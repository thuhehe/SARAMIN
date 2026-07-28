/**
 * Everything this browser remembers about the reviewer. All of it is
 * localStorage.
 *
 * Two kinds of session live here. A **guest** typed the shared passcode
 * and a display name; nothing server-side knows who they are. A
 * **member** came back from BB PM's OAuth flow, so the share JWT itself
 * carries their account and the name comes off their user row.
 *
 * On the passcode: we keep it so the 2h guest JWT can be renewed
 * silently instead of interrupting a review with a re-prompt. That is a
 * deliberate trade — the passcode is a *shared* secret that every
 * viewer of this site already has (it arrives by email or Slack), and
 * it sits next to a bearer JWT in the same storage. It buys a session
 * that lasts as long as the reader's interest does.
 *
 * What is *not* here is the OAuth access token. It is spent once on
 * `unlock-member` and dropped: on the BB PM API that bearer is a
 * full-account credential, while the share JWT it becomes can only
 * comment on this one project. A member session therefore cannot renew
 * itself silently — it re-runs the redirect — and that is the price of
 * not storing the stronger credential.
 */

import type { ShareMember } from './types'

const KEY_JWT = 'saramin.comments.jwt'
const KEY_PASSCODE = 'saramin.comments.passcode'
const KEY_AUTHOR = 'saramin.comments.authorKey'
const KEY_NAME = 'saramin.comments.displayName'
const KEY_MEMBER = 'saramin.comments.member'

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
 * The signed-in BB PM member, or null for a guest session. Doubles as
 * the flag for which kind of session this is: its presence is what tells
 * the client not to try a passcode renewal, and the rail not to ask for
 * a name.
 */
export const member = {
  get: (): ShareMember | null => {
    const raw = read(KEY_MEMBER)
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const m = parsed as Partial<ShareMember>
        if (typeof m.id === 'string' && typeof m.name === 'string')
          return { id: m.id, name: m.name, avatar: m.avatar ?? null }
      }
    } catch {
      /* someone edited storage by hand — treat as a guest */
    }
    return null
  },
  set: (v: ShareMember | null) =>
    write(KEY_MEMBER, v === null ? null : JSON.stringify(v)),
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
  write(KEY_MEMBER, null)
  // Deliberately keeps the author key and display name: signing out is
  // about dropping the link credential, not about forgetting that these
  // comments were yours.
}
