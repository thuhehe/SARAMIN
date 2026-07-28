import { API_BASE } from './client'

/**
 * Sign-in for people who already have a BB PM account, over the same
 * OAuth 2.1 flow claude.ai uses against that server: authorization code
 * + PKCE, public client, no secret anywhere in this bundle.
 *
 * Why a redirect and not a passcode: the passcode is one shared secret
 * for every reader, so every comment needs a typed-in name to be worth
 * anything. A BB PM member already has a name, an avatar, and a project
 * membership — bouncing through their own login is what lets us use them
 * instead of asking again.
 *
 * The access token this produces is deliberately short-lived in *our*
 * hands. It is exchanged once for a share JWT (see `unlockMember` in
 * `client.ts`) and then dropped: on the BB PM API a `bbpm_at_…` bearer
 * is a full-account credential, and there is no reason for a static
 * review site to keep one lying in storage. The share JWT it becomes can
 * do exactly one thing — comment on this project.
 */

const CLIENT_ID = import.meta.env.VITE_BBPM_OAUTH_CLIENT_ID ?? ''

/** With no client id configured the rail only offers the passcode. */
export const memberSignInConfigured = Boolean(API_BASE && CLIENT_ID)

/** Route the browser comes back to. Registered with the client id. */
export const CALLBACK_PATH = '/oauth/callback'

/**
 * The consent screen is a page in the BB PM *web* app while the token
 * endpoint is on its API. The server builds its own metadata as
 * `apiBase = ${webBase}/api`, so the web root is simply the API origin —
 * no discovery request needed to find it.
 */
const authorizeUrl = () => `${new URL(API_BASE).origin}/oauth/authorize`
const tokenUrl = () => `${API_BASE}/oauth/token`
const redirectUri = () => `${window.location.origin}${CALLBACK_PATH}`

/**
 * Identity only. Notably *not* `mcp`, which on this server means
 * read/write to everything the person can see — a spec site has no
 * business asking for that, and the consent screen would be right to
 * look alarming if it did.
 */
const SCOPE = 'openid profile email'

// sessionStorage, not localStorage: the verifier is single-use and dying
// with the tab is the correct lifetime. Keyed alongside the comment
// layer's other storage for easy inspection.
const KEY_VERIFIER = 'saramin.comments.pkce.verifier'
const KEY_STATE = 'saramin.comments.pkce.state'
const KEY_RETURN = 'saramin.comments.pkce.returnTo'

function stash(key: string, value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, value)
  } catch {
    /* private mode — the state check below will fail loudly instead */
  }
}

function unstash(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function base64Url(bytes: Uint8Array): string {
  let raw = ''
  for (const byte of bytes) raw += String.fromCharCode(byte)
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return base64Url(new Uint8Array(digest))
}

export class OAuthError extends Error {}

/**
 * Leave for BB PM. Resolves only if the redirect never happens — the
 * caller can treat a resolved promise as a failure to launch.
 */
export async function beginSignIn(returnTo: string): Promise<void> {
  if (!memberSignInConfigured)
    throw new OAuthError('BB PM sign-in is not configured for this build')
  // `crypto.subtle` is absent on plain http, which would otherwise fail
  // deep inside the challenge step with an unreadable error.
  if (!window.isSecureContext)
    throw new OAuthError('Sign-in needs HTTPS (or localhost)')

  const verifier = randomToken()
  const state = randomToken()
  stash(KEY_VERIFIER, verifier)
  stash(KEY_STATE, state)
  stash(KEY_RETURN, returnTo)

  const url = new URL(authorizeUrl())
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri())
  url.searchParams.set('scope', SCOPE)
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', await challengeFor(verifier))
  url.searchParams.set('code_challenge_method', 'S256')
  window.location.assign(url.toString())
}

export interface SignInResult {
  /** Use once, then forget — see the note at the top of this file. */
  accessToken: string
  /** Where the reader was when they clicked sign in. */
  returnTo: string
}

/**
 * Finish the flow from the query string BB PM redirected back with.
 * Consumes the stored PKCE state whatever the outcome, so a reload of
 * the callback URL can't replay anything.
 */
export async function completeSignIn(search: string): Promise<SignInResult> {
  const params = new URLSearchParams(search)
  const verifier = unstash(KEY_VERIFIER)
  const expectedState = unstash(KEY_STATE)
  const returnTo = unstash(KEY_RETURN) ?? '/'
  stash(KEY_VERIFIER, null)
  stash(KEY_STATE, null)
  stash(KEY_RETURN, null)

  const failure = params.get('error')
  if (failure)
    throw new OAuthError(
      failure === 'access_denied'
        ? 'Sign-in was cancelled'
        : (params.get('error_description') ?? failure),
    )

  const code = params.get('code')
  if (!code) throw new OAuthError('BB PM did not return an authorization code')
  if (!verifier || !expectedState)
    throw new OAuthError('This sign-in has expired — start it again')
  if (params.get('state') !== expectedState)
    throw new OAuthError('Sign-in state did not match — start it again')

  // Form-encoded per RFC 6749 §4.1.3. No `client_secret`: the client is
  // registered as public, and PKCE is what proves the exchange belongs
  // to the browser that started it.
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
    client_id: CLIENT_ID,
  })

  let res: Response
  try {
    res = await fetch(tokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch {
    throw new OAuthError('Could not reach BB PM to finish signing in')
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const payload: unknown = await res.json()
      if (payload && typeof payload === 'object') {
        const p = payload as { message?: unknown; error_description?: unknown }
        if (typeof p.message === 'string') message = p.message
        else if (typeof p.error_description === 'string')
          message = p.error_description
      }
    } catch {
      /* non-JSON body — the status is all we have */
    }
    throw new OAuthError(message)
  }

  // `/oauth/token` is @RawResponse() — no `{ success, data }` envelope.
  const token = (await res.json()) as { access_token?: string }
  if (!token.access_token)
    throw new OAuthError('BB PM returned no access token')

  return { accessToken: token.access_token, returnTo }
}
