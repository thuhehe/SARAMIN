/**
 * Wire types for the BB PM doc-comment API
 * (`/api/public/share/:token/doc-comments`). Kept hand-written rather
 * than generated — the surface is five endpoints and this file is the
 * whole contract, so a drift is easy to spot in review.
 */

/** Where a thread attaches in the page. All-null means page-level. */
export interface CommentAnchor {
  containerId: string | null
  quote: string | null
  prefix: string | null
  suffix: string | null
  textOffset: number | null
}

export interface Comment {
  id: string
  docKey: string
  body: string
  anchor: CommentAnchor
  author: { name: string; avatar: string | null; isGuest: boolean }
  /** True when this browser's author key posted it — gates the delete UI. */
  mine: boolean
  resolvedAt: string | null
  resolvedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CommentThread extends Comment {
  replies: Comment[]
}

export interface DocCommentsPayload {
  docKey: string
  threads: CommentThread[]
}

export interface DocCommentCount {
  docKey: string
  open: number
  resolved: number
}

export interface ShareSession {
  projectKey: string
  projectName: string
  sharedByName: string
  scopes: string[]
  expiresAt: string | null
}

/** The BB PM account behind a member session. */
export interface ShareMember {
  id: string
  name: string
  avatar: string | null
}

/** `POST /unlock-member` returns the session plus who we signed in as. */
export interface MemberShareSession extends ShareSession {
  member: ShareMember
}

/**
 * Errors the UI reacts to differently:
 * - `auth` — passcode wrong, or our JWT lapsed and a silent retry failed.
 * - `gone` — link revoked or expired; no passcode will fix it.
 * - `locked` — brute-force lockout, `retryAfterSeconds` is set.
 * - `offline` — the request never reached the API; keep polling.
 * - `throttled` — rate limited. Transient like `offline`, but the fix is
 *   to poll *slower*, not to retry immediately. Never shown as an error:
 *   the whole office shares one NAT address, so a busy review session
 *   can hit the ceiling through no fault of the person reading.
 */
export type CommentErrorKind =
  | 'auth'
  | 'gone'
  | 'locked'
  | 'forbidden'
  | 'offline'
  | 'throttled'
  | 'server'

export class CommentApiError extends Error {
  constructor(
    readonly kind: CommentErrorKind,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'CommentApiError'
  }
}
