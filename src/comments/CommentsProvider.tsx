import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'
import * as api from './client'
import * as oauth from './oauth'
import * as session from './session'
import {
  CommentApiError,
  type CommentAnchor,
  type CommentThread,
  type DocCommentCount,
  type ShareMember,
  type ShareSession,
} from './types'

/** How often to re-read the current document while the tab is visible. */
const POLL_MS = 5000

/**
 * Ceiling for the backoff applied after a throttled or failed poll. The
 * API allows plenty of headroom for reads, but a whole office shares one
 * NAT address, so a busy session can still hit the limit — backing off to
 * half a minute keeps a crowded review readable instead of hammering.
 */
const MAX_POLL_MS = 30000

type Status = 'locked' | 'unlocking' | 'ready' | 'unavailable'

interface CommentsContextValue {
  status: Status
  share: ShareSession | null
  threads: CommentThread[]
  counts: Map<string, DocCommentCount>
  docKey: string
  /** Signed-in BB PM account, or null for a passcode guest. */
  member: ShareMember | null
  /**
   * Name shown on this browser's comments. For a member it is their BB PM
   * name and is not editable here; for a guest, null until first prompt.
   */
  name: string | null
  setName: (value: string) => void
  /** Thread the reader is focused on — the rail and the highlights agree on it. */
  activeId: string | null
  setActiveId: (id: string | null) => void
  error: string | null
  unlock: (passcode: string) => Promise<void>
  /** Leaves the site for BB PM's login/consent screens. */
  signInAsMember: () => Promise<void>
  /** Finishes that round trip from the callback route's query string. */
  completeMemberSignIn: (search: string) => Promise<string>
  /** False when this build has no OAuth client id — passcode only. */
  memberSignInAvailable: boolean
  signOut: () => void
  post: (input: {
    body: string
    anchor?: CommentAnchor | null
    parentId?: string | null
  }) => Promise<void>
  setResolved: (commentId: string, resolved: boolean) => Promise<void>
  remove: (commentId: string) => Promise<void>
  refresh: () => void
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

/**
 * Owns the share session, the current document's threads, and the poll
 * loop. One provider for the whole app: the rail, the highlights and
 * the selection button all read the same list, so a comment posted from
 * the popover appears in the rail without a round trip through props.
 *
 * "Live" here is polling, not sockets — BB PM has no realtime transport,
 * and for review comments a 5s worst-case delay is indistinguishable
 * from instant. Polling pauses entirely while the tab is hidden and
 * fires immediately on return, so an idle tab costs nothing.
 */
export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const [status, setStatus] = useState<Status>(
    api.commentsConfigured
      ? session.shareJwt.get()
        ? 'ready'
        : 'locked'
      : 'unavailable',
  )
  const [share, setShare] = useState<ShareSession | null>(null)
  const [threads, setThreads] = useState<CommentThread[]>([])
  const [counts, setCounts] = useState<Map<string, DocCommentCount>>(new Map())
  const [member, setMember] = useState<ShareMember | null>(session.member.get())
  const [name, setNameState] = useState<string | null>(session.displayName.get())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Bumping this forces the effect below to re-run — used after every
  // mutation and by the manual refresh button.
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const docKey = useMemo(() => pathname.replace(/\/+$/, '') || '/', [pathname])

  // Keep the latest docKey in a ref so the poll timer never closes over
  // a stale route after navigation.
  const docKeyRef = useRef(docKey)
  docKeyRef.current = docKey

  // A thread selected on the previous page has no anchor on this one.
  useEffect(() => setActiveId(null), [docKey])

  const handleError = useCallback((err: unknown) => {
    if (err instanceof DOMException && err.name === 'AbortError') return
    if (err instanceof CommentApiError) {
      if (err.kind === 'auth') {
        session.signOut()
        setMember(null)
        setStatus('locked')
        setError(null)
        return
      }
      // `offline` and `throttled` are transient by definition — the next
      // poll may well succeed, and neither is the reader's fault, so don't
      // shout about them. The poll loop slows itself down instead.
      setError(
        err.kind === 'offline' || err.kind === 'throttled' ? null : err.message,
      )
      return
    }
    setError('Something went wrong loading comments')
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    const controller = new AbortController()
    let timer: number | undefined
    let stopped = false

    // Grows on a throttled or failed poll, resets on the first success.
    // Without it a rate-limited client keeps asking at the same rate and
    // stays rate-limited.
    let delay = POLL_MS

    const load = async () => {
      try {
        const payload = await api.listComments(docKeyRef.current, controller.signal)
        // A slow response that landed after the user navigated away
        // must not paint another page's threads.
        if (!stopped && payload.docKey === docKeyRef.current) {
          setThreads(payload.threads)
          setError(null)
        }
        delay = POLL_MS
      } catch (err) {
        if (stopped) return
        if (err instanceof CommentApiError) {
          if (err.kind === 'throttled' || err.kind === 'offline') {
            const suggested = err.retryAfterSeconds
              ? err.retryAfterSeconds * 1000
              : delay * 2
            delay = Math.min(MAX_POLL_MS, Math.max(POLL_MS, suggested))
          }
        }
        handleError(err)
      }
    }

    const schedule = () => {
      timer = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') await load()
        if (!stopped) schedule()
      }, delay)
    }

    void load()
    schedule()

    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      stopped = true
      controller.abort()
      if (timer) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [status, docKey, tick, handleError])

  // Session details and nav badges are project-wide, so they refresh on
  // unlock and after mutations, not on every route change.
  useEffect(() => {
    if (status !== 'ready') return
    const controller = new AbortController()
    void (async () => {
      try {
        const [detail, tallies] = await Promise.all([
          api.fetchSession(controller.signal),
          api.fetchCounts(controller.signal),
        ])
        setShare(detail)
        setCounts(new Map(tallies.map((c) => [c.docKey, c])))
      } catch (err) {
        handleError(err)
      }
    })()
    return () => controller.abort()
  }, [status, tick, handleError])

  const unlock = useCallback(async (passcode: string) => {
    setStatus('unlocking')
    setError(null)
    try {
      const detail = await api.unlock(passcode)
      setShare(detail)
      setMember(null)
      setStatus('ready')
    } catch (err) {
      setStatus('locked')
      if (err instanceof CommentApiError) {
        setError(
          err.kind === 'locked' && err.retryAfterSeconds
            ? `Too many attempts. Try again in ${Math.ceil(err.retryAfterSeconds / 60)} minute(s).`
            : err.message,
        )
      } else setError('Could not unlock comments')
      throw err
    }
  }, [])

  const signInAsMember = useCallback(async () => {
    setError(null)
    try {
      // Resolves only if the redirect didn't happen; on success the page
      // is already on its way to BB PM.
      await oauth.beginSignIn(`${window.location.pathname}${window.location.search}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start BB PM sign-in',
      )
      throw err
    }
  }, [])

  /**
   * The other end of the redirect. Runs on the callback route, and
   * returns where to send the reader back to so the route component
   * doesn't have to know how the flow stored it.
   */
  const completeMemberSignIn = useCallback(async (search: string) => {
    setStatus('unlocking')
    setError(null)
    try {
      const { accessToken, returnTo } = await oauth.completeSignIn(search)
      const detail = await api.unlockMember(accessToken)
      setShare(detail)
      setMember(detail.member)
      setStatus('ready')
      return returnTo
    } catch (err) {
      setStatus('locked')
      if (err instanceof CommentApiError && err.kind === 'forbidden') {
        setError(
          'Your BB PM account is not a member of this project — use the passcode instead.',
        )
      } else if (err instanceof Error) setError(err.message)
      else setError('Could not finish signing in')
      throw err
    }
  }, [])

  const setName = useCallback((value: string) => {
    const trimmed = value.trim().slice(0, 80)
    session.displayName.set(trimmed || null)
    setNameState(trimmed || null)
  }, [])

  const post = useCallback<CommentsContextValue['post']>(
    async ({ body, anchor, parentId }) => {
      try {
        await api.createComment({
          docKey: docKeyRef.current,
          body,
          anchor: anchor ?? null,
          parentId: parentId ?? null,
          // A member is named by their account; sending a local display
          // name alongside would be a second name for the same person.
          guestName: session.member.get() ? null : session.displayName.get(),
        })
        // Refetch rather than splice the response in: the list is small,
        // and a refetch also picks up whatever anyone else posted in the
        // seconds we were typing.
        refresh()
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [handleError, refresh],
  )

  const setResolved = useCallback(
    async (commentId: string, resolved: boolean) => {
      // Optimistic: resolving is a single boolean with an obvious
      // outcome, and the poll will correct us within 5s if it failed.
      // For a member the server stamps their account name and ignores
      // what we send, so guess the same thing to avoid a visible flip.
      const signature = session.member.get()?.name ?? session.displayName.get()
      setThreads((prev) =>
        prev.map((t) =>
          t.id === commentId
            ? {
                ...t,
                resolvedAt: resolved ? new Date().toISOString() : null,
                resolvedBy: resolved ? signature : null,
              }
            : t,
        ),
      )
      try {
        await api.resolveComment(commentId, resolved, signature)
      } catch (err) {
        handleError(err)
      } finally {
        refresh()
      }
    },
    [handleError, refresh],
  )

  const remove = useCallback(
    async (commentId: string) => {
      try {
        await api.deleteComment(commentId)
      } catch (err) {
        handleError(err)
      } finally {
        refresh()
      }
    },
    [handleError, refresh],
  )

  const signOutAll = useCallback(() => {
    session.signOut()
    setShare(null)
    setMember(null)
    setThreads([])
    setCounts(new Map())
    setStatus('locked')
  }, [])

  const value = useMemo<CommentsContextValue>(
    () => ({
      status,
      share,
      threads,
      counts,
      docKey,
      member,
      // A member's name is their account's; a guest's is what they typed.
      name: member?.name ?? name,
      setName,
      activeId,
      setActiveId,
      error,
      unlock,
      signInAsMember,
      completeMemberSignIn,
      memberSignInAvailable: oauth.memberSignInConfigured,
      signOut: signOutAll,
      post,
      setResolved,
      remove,
      refresh,
    }),
    [
      status,
      share,
      threads,
      counts,
      docKey,
      member,
      name,
      setName,
      activeId,
      error,
      unlock,
      signInAsMember,
      completeMemberSignIn,
      signOutAll,
      post,
      setResolved,
      remove,
      refresh,
    ],
  )

  return (
    <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>
  )
}

export function useComments(): CommentsContextValue {
  const ctx = useContext(CommentsContext)
  if (!ctx)
    throw new Error('useComments must be used inside <CommentsProvider>')
  return ctx
}
