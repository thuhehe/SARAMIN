import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  /** Threads anchored in the page being read. Derived from `allThreads`. */
  threads: CommentThread[]
  /** Every thread in the project, each carrying its own `docKey`. */
  allThreads: CommentThread[]
  /** True when the project holds more comments than the server returned. */
  truncated: boolean
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
  /**
   * Focus a thread wherever it lives: same page, select it; another page,
   * navigate there first and select it once that page is up.
   */
  jumpTo: (thread: { id: string; docKey: string }) => void
  error: string | null
  unlock: (passcode: string) => Promise<void>
  /** Leaves the site for BB PM's login/consent screens. */
  signInAsMember: () => Promise<void>
  /** Finishes that round trip from the callback route's query string. */
  completeMemberSignIn: (search: string) => Promise<string>
  /** False when this build has no OAuth client id — passcode only. */
  memberSignInAvailable: boolean
  /** Whether the reader has asked for the rail. */
  railOpen: boolean
  setRailOpen: (open: boolean) => void
  /**
   * Whether the rail is actually on screen. Lives here rather than in the
   * rail because the *page* needs it too: the rail is fixed-position, so
   * without the page reserving room for it, it covers the right edge of
   * whatever you were reading. One value, so the room and the rail can
   * never disagree.
   */
  railVisible: boolean
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
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>(
    api.commentsConfigured
      ? session.shareJwt.get()
        ? 'ready'
        : 'locked'
      : 'unavailable',
  )
  const [share, setShare] = useState<ShareSession | null>(null)
  const [allThreads, setAllThreads] = useState<CommentThread[]>([])
  const [truncated, setTruncated] = useState(false)
  const [member, setMember] = useState<ShareMember | null>(session.member.get())
  const [name, setNameState] = useState<string | null>(session.displayName.get())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [railOpen, setRailOpen] = useState(false)
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

  /**
   * The page being read is one filter over the project-wide list, so a
   * navigation needs no refetch — the thread you jumped to is already
   * loaded, and its highlight can paint in the first frame of the new page.
   */
  const threads = useMemo(
    () => allThreads.filter((t) => t.docKey === docKey),
    [allThreads, docKey],
  )

  /**
   * Nav badges, derived rather than fetched. `GET /doc-comments/counts`
   * would say the same thing one request later; counting what we already
   * hold keeps the badge and the rail from ever disagreeing.
   */
  const counts = useMemo(() => {
    const byDoc = new Map<string, DocCommentCount>()
    for (const thread of allThreads) {
      const entry =
        byDoc.get(thread.docKey) ??
        { docKey: thread.docKey, open: 0, resolved: 0 }
      if (thread.resolvedAt === null) entry.open += 1
      else entry.resolved += 1
      byDoc.set(thread.docKey, entry)
    }
    return byDoc
  }, [allThreads])

  /**
   * Set when a jump asked for a thread on another page: the route change
   * below hands it to `activeId` once we're there. Without it the effect
   * would clear the selection we navigated specifically to make.
   */
  const pendingJump = useRef<string | null>(null)

  // A thread selected on the previous page has no anchor on this one —
  // unless arriving here *was* the point.
  useEffect(() => {
    setActiveId(pendingJump.current)
    pendingJump.current = null
  }, [docKey])

  const jumpTo = useCallback<CommentsContextValue['jumpTo']>(
    (thread) => {
      if (thread.docKey === docKeyRef.current) {
        setActiveId(thread.id)
        return
      }
      pendingJump.current = thread.id
      navigate(thread.docKey)
    },
    [navigate],
  )

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
        const payload = await api.listAllComments(controller.signal)
        if (!stopped) {
          setAllThreads(payload.threads)
          setTruncated(payload.truncated)
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
    // The poll no longer depends on the route: one project-wide read
    // serves every page, so navigating doesn't restart the loop.
  }, [status, tick, handleError])

  // Which project this link opens, and who shared it. Fixed for the life
  // of the session, so it's read on unlock and after mutations rather
  // than on every poll.
  useEffect(() => {
    if (status !== 'ready') return
    const controller = new AbortController()
    void (async () => {
      try {
        setShare(await api.fetchSession(controller.signal))
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
      setAllThreads((prev) =>
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
    setAllThreads([])
    setTruncated(false)
    setStatus('locked')
  }, [])

  const value = useMemo<CommentsContextValue>(
    () => ({
      status,
      share,
      threads,
      allThreads,
      truncated,
      counts,
      docKey,
      member,
      // A member's name is their account's; a guest's is what they typed.
      name: member?.name ?? name,
      setName,
      activeId,
      setActiveId,
      jumpTo,
      error,
      unlock,
      signInAsMember,
      completeMemberSignIn,
      memberSignInAvailable: oauth.memberSignInConfigured,
      railOpen,
      setRailOpen,
      // The dialog stands in for the rail until there's a session, so the
      // page shouldn't reserve room for a rail that isn't there yet.
      railVisible: railOpen && status === 'ready',
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
      allThreads,
      truncated,
      counts,
      docKey,
      member,
      name,
      setName,
      activeId,
      jumpTo,
      railOpen,
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
