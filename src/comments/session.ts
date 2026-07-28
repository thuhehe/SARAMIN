/**
 * Everything this browser remembers about the reviewer. All of it is
 * localStorage — there is no account, and by design no server-side
 * notion of "who you are" beyond a display name you typed.
 *
 * On the passcode: we keep it so the 2h share JWT can be renewed
 * silently instead of interrupting a review with a re-prompt. That is a
 * deliberate trade — the passcode is a *shared* secret that every
 * viewer of this site already has (it arrives by email or Slack), and
 * it sits next to a bearer JWT in the same storage. It buys a session
 * that lasts as long as the reader's interest does. "Sign out" in the
 * rail clears all three keys.
 */

const KEY_JWT = 'saramin.comments.jwt'
const KEY_PASSCODE = 'saramin.comments.passcode'
const KEY_AUTHOR = 'saramin.comments.authorKey'
const KEY_NAME = 'saramin.comments.displayName'

/** Safari in private mode throws on every localStorage touch. */
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* storage unavailable — the session simply doesn't survive reload */
  }
}

export const shareJwt = {
  get: () => read(KEY_JWT),
  set: (v: string | null) => write(KEY_JWT, v),
}

export const passcode = {
  get: () => read(KEY_PASSCODE),
  set: (v: string | null) => write(KEY_PASSCODE, v),
}

export const displayName = {
  get: () => read(KEY_NAME),
  set: (v: string | null) => write(KEY_NAME, v),
}

/**
 * Opaque per-browser id sent as `X-Doc-Author-Key`. It is not identity
 * and not authentication: the server only compares it for equality to
 * decide which comments this browser may delete. Minted once, kept
 * forever, never displayed.
 */
export function authorKey(): string {
  const existing = read(KEY_AUTHOR)
  if (existing) return existing
  const minted =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `k_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  write(KEY_AUTHOR, minted)
  return minted
}

export function signOut(): void {
  write(KEY_JWT, null)
  write(KEY_PASSCODE, null)
  // Deliberately keeps the author key and display name: signing out is
  // about dropping the link credential, not about forgetting that these
  // comments were yours.
}
