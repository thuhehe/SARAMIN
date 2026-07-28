import {
  CommentApiError,
  type Comment,
  type CommentAnchor,
  type DocCommentCount,
  type DocCommentsPayload,
  type MemberShareSession,
  type ShareSession,
} from './types'
import * as session from './session'

/**
 * Thin client for the BB PM public share surface. Three behaviours worth
 * knowing about:
 *
 * 1. **Silent renewal, for guests.** The guest share JWT lives 2h. On a
 *    401 we re-unlock once with the stored passcode and replay the
 *    request, so a long review never gets interrupted by a passcode
 *    prompt mid-sentence. A *member* session can't do this — we
 *    deliberately kept no OAuth token to renew with — so its 401
 *    surfaces as `auth` and the UI asks them to sign in again. Their JWT
 *    is longer-lived to compensate.
 * 2. **Two ways in, one credential out.** Passcode or BB PM sign-in,
 *    both end at a share JWT; every call after that looks identical.
 * 3. **Every response is `{ success, data }`.** The API wraps all
 *    non-RFC routes in that envelope (TransformInterceptor), so unwrap
 *    in exactly one place.
 */

export const API_BASE = (import.meta.env.VITE_BBPM_API_BASE ?? '').replace(
  /\/$/,
  '',
)
const SHARE_TOKEN = import.meta.env.VITE_BBPM_SHARE_TOKEN ?? ''

/**
 * With no token configured the whole comment layer stays dormant and
 * the site behaves exactly as it did before — that is the intended
 * state for local content work and for any deploy that shouldn't carry
 * comments.
 */
export const commentsConfigured = Boolean(API_BASE && SHARE_TOKEN)

const base = () => `${API_BASE}/public/share/${SHARE_TOKEN}`

interface Envelope<T> {
  success: boolean
  data: T
}

async function toError(res: Response): Promise<CommentApiError> {
  let message = res.statusText
  let retryAfterSeconds: number | undefined
  try {
    const body: unknown = await res.json()
    if (body && typeof body === 'object') {
      const b = body as { message?: unknown; retryAfterSeconds?: unknown }
      if (typeof b.message === 'string') message = b.message
      else if (Array.isArray(b.message)) message = b.message.join(', ')
      if (typeof b.retryAfterSeconds === 'number')
        retryAfterSeconds = b.retryAfterSeconds
    }
  } catch {
    /* non-JSON error body — the status alone tells us enough */
  }

  if (res.status === 401) return new CommentApiError('auth', message)
  if (res.status === 410)
    return new CommentApiError(
      'gone',
      'This comment link has been revoked or has expired.',
    )
  if (res.status === 423)
    return new CommentApiError('locked', message, retryAfterSeconds)
  if (res.status === 429) {
    // Honour Retry-After when the server sends one; otherwise let the
    // caller pick a backoff.
    const header = Number(res.headers.get('retry-after'))
    return new CommentApiError(
      'throttled',
      'Too many requests — slowing down.',
      Number.isFinite(header) && header > 0 ? header : undefined,
    )
  }
  if (res.status === 403) return new CommentApiError('forbidden', message)
  return new CommentApiError('server', message)
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
  /** Internal: stops a renewal loop from recursing. */
  isRetry?: boolean
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const jwt = session.shareJwt.get()
  if (!jwt) throw new CommentApiError('auth', 'Not unlocked yet')

  let res: Response
  try {
    res = await fetch(`${base()}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'X-Doc-Author-Key': session.authorKey(),
        ...(opts.body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    })
  } catch (err) {
    // AbortError is our own doing (route change, unmount) — let it pass
    // through untouched so callers can ignore it.
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new CommentApiError('offline', 'Could not reach the comment server')
  }

  if (res.status === 401 && !opts.isRetry) {
    // Only a guest can be renewed from storage. A member's credential
    // was spent on purpose, so their lapsed session has to go back
    // through BB PM.
    const stored = session.member.get() ? null : session.passcode.get()
    if (stored) {
      try {
        await unlock(stored)
        return request<T>(path, { ...opts, isRetry: true })
      } catch {
        session.shareJwt.set(null)
        throw new CommentApiError('auth', 'Session expired')
      }
    }
  }

  if (!res.ok) throw await toError(res)

  const envelope = (await res.json()) as Envelope<T>
  return envelope.data
}

/**
 * Exchange the passcode for a share JWT. Stores both — see the note in
 * `session.ts` about why the passcode is kept.
 */
export async function unlock(code: string): Promise<ShareSession> {
  let res: Response
  try {
    res = await fetch(`${base()}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: code }),
    })
  } catch {
    throw new CommentApiError('offline', 'Could not reach the comment server')
  }
  if (!res.ok) throw await toError(res)

  const { data } = (await res.json()) as Envelope<
    ShareSession & { shareJwt: string }
  >
  session.shareJwt.set(data.shareJwt)
  session.passcode.set(code)
  session.member.set(null)
  return data
}

/**
 * The member half of unlock: spend a BB PM access token on a share JWT
 * that carries the account behind it. The token is passed in rather than
 * read from storage because it is never stored — see `oauth.ts`.
 *
 * A 403 here is the interesting case: the credential was fine, but the
 * person isn't a member of this project. That is not an error to retry,
 * it is a signal to offer the passcode instead, so it keeps the
 * `forbidden` kind and the dialog says so.
 */
export async function unlockMember(
  accessToken: string,
): Promise<MemberShareSession> {
  let res: Response
  try {
    res = await fetch(`${base()}/unlock-member`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch {
    throw new CommentApiError('offline', 'Could not reach the comment server')
  }
  if (!res.ok) throw await toError(res)

  const { data } = (await res.json()) as Envelope<
    MemberShareSession & { shareJwt: string }
  >
  session.shareJwt.set(data.shareJwt)
  session.member.set(data.member)
  // A member's name comes from their BB PM account; drop any passcode
  // this browser was holding so the renewal path can't quietly demote
  // them back to a guest mid-session.
  session.passcode.set(null)
  return data
}

export function fetchSession(signal?: AbortSignal): Promise<ShareSession> {
  return request<ShareSession>('/project', { signal })
}

export function listComments(
  docKey: string,
  signal?: AbortSignal,
): Promise<DocCommentsPayload> {
  return request<DocCommentsPayload>(
    `/doc-comments?docKey=${encodeURIComponent(docKey)}`,
    { signal },
  )
}

export function fetchCounts(signal?: AbortSignal): Promise<DocCommentCount[]> {
  return request<DocCommentCount[]>('/doc-comments/counts', { signal })
}

export interface CreateCommentInput {
  docKey: string
  body: string
  anchor?: Partial<CommentAnchor> | null
  parentId?: string | null
  guestName?: string | null
}

export function createComment(input: CreateCommentInput): Promise<Comment> {
  // Strip nulls: the DTO uses @IsOptional, and `forbidNonWhitelisted`
  // validation rejects an explicit null where a string is expected.
  const payload: Record<string, unknown> = {
    docKey: input.docKey,
    body: input.body,
  }
  if (input.parentId) payload.parentId = input.parentId
  if (input.guestName) payload.guestName = input.guestName
  if (input.anchor) {
    const a = input.anchor
    const anchor: Record<string, unknown> = {}
    if (a.containerId) anchor.containerId = a.containerId
    if (a.quote) anchor.quote = a.quote
    if (a.prefix) anchor.prefix = a.prefix
    if (a.suffix) anchor.suffix = a.suffix
    if (typeof a.textOffset === 'number') anchor.textOffset = a.textOffset
    if (Object.keys(anchor).length) payload.anchor = anchor
  }
  return request<Comment>('/doc-comments', { method: 'POST', body: payload })
}

export function resolveComment(
  commentId: string,
  resolved: boolean,
  by: string | null,
): Promise<Comment> {
  const payload: Record<string, unknown> = { resolved }
  if (by) payload.by = by
  return request<Comment>(`/doc-comments/${commentId}/resolve`, {
    method: 'PATCH',
    body: payload,
  })
}

export function deleteComment(commentId: string): Promise<{ id: string }> {
  return request<{ id: string }>(`/doc-comments/${commentId}`, {
    method: 'DELETE',
  })
}
