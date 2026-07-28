import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CornerDownRight,
  Link2Off,
  MessageSquare,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useComments } from './CommentsProvider'
import { resolveAvatarUrl } from './client'
import { docOrder, docTitle } from './docTitle'
import { COMMENT_ROOT_ID, NO_COMMENT_ATTR, resolveAnchor } from './anchor'
import { NameField } from './NameField'
import type { Comment, CommentThread, ShareMember } from './types'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

/**
 * Who you're signed in as. The avatar falls back to an initial on error
 * as well as on absence — BB PM serves these itself, and a broken image
 * icon next to your own name reads as "something is wrong with your
 * session" when nothing is.
 */
function MemberBadge({ member }: { member: ShareMember }) {
  const src = resolveAvatarUrl(member.avatar)
  const [broken, setBroken] = useState(false)

  return (
    <div className="flex items-center gap-2">
      {src && !broken ? (
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className="h-5 w-5 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[9px] font-semibold text-white">
          {member.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="text-[11.5px] font-medium">{member.name}</span>
      <span className="text-[10px] text-faint">signed in</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="sticky top-0 z-[1] -mx-3 bg-canvas/95 px-3 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-faint backdrop-blur">
      {children}
    </p>
  )
}

function Bubble({
  comment,
  onDelete,
}: {
  comment: Comment
  onDelete: (id: string) => void
}) {
  return (
    <div className="group/bubble">
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-semibold">{comment.author.name}</span>
        <span className="text-[10px] text-faint">
          {relativeTime(comment.createdAt)}
        </span>
        {comment.mine && (
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="ml-auto text-faint opacity-0 transition-opacity group-hover/bubble:opacity-100 hover:text-red-600"
            aria-label="Delete comment"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ink/85">
        {comment.body}
      </p>
    </div>
  )
}

/**
 * A thread that lives on another page. Read-only on purpose: the useful
 * action from here is "take me there", and a reply box on a quote you
 * can't see is an invitation to answer the wrong question.
 */
function RemoteThreadCard({ thread }: { thread: CommentThread }) {
  const { jumpTo } = useComments()
  const resolved = thread.resolvedAt !== null

  return (
    <button
      type="button"
      onClick={() => jumpTo(thread)}
      className={[
        'w-full rounded-xl border border-line bg-surface p-2.5 text-left transition-colors hover:border-brand',
        resolved ? 'opacity-60' : '',
      ].join(' ')}
    >
      {thread.anchor.quote && (
        <p className="mb-1.5 line-clamp-1 border-l-2 border-amber-400 pl-2 text-[11px] italic text-muted">
          {thread.anchor.quote}
        </p>
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-[12px] font-semibold">{thread.author.name}</span>
        <span className="text-[10px] text-faint">
          {relativeTime(thread.createdAt)}
        </span>
        {resolved && (
          <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-700" />
        )}
      </div>
      <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink/85">
        {thread.body}
      </p>
      {thread.replies.length > 0 && (
        <p className="mt-1 text-[10px] text-faint">
          {thread.replies.length}{' '}
          {thread.replies.length === 1 ? 'reply' : 'replies'}
        </p>
      )}
    </button>
  )
}

function ThreadCard({
  thread,
  orphaned,
}: {
  thread: CommentThread
  orphaned: boolean
}) {
  const { activeId, setActiveId, post, setResolved, remove, name, member } =
    useComments()
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const active = activeId === thread.id
  const resolved = thread.resolvedAt !== null

  /**
   * When a thread is selected from the page (clicking its highlight),
   * bring its card into view inside the rail. Scrolls the rail's own
   * container rather than calling `scrollIntoView`, which walks up and
   * would also scroll the document — fighting the page-scroll effect in
   * CommentableRoot that runs on the same state change.
   */
  useEffect(() => {
    if (!active) return
    const card = cardRef.current
    const scroller = card?.closest<HTMLElement>('[data-comment-scroll]')
    if (!card || !scroller) return
    const cardTop = card.offsetTop - scroller.offsetTop
    const cardBottom = cardTop + card.offsetHeight
    const viewTop = scroller.scrollTop
    const viewBottom = viewTop + scroller.clientHeight
    if (cardTop >= viewTop && cardBottom <= viewBottom) return
    scroller.scrollTo({ top: cardTop - 12, behavior: 'smooth' })
  }, [active])

  const submitReply = async () => {
    if (!reply.trim() || busy) return
    setBusy(true)
    try {
      await post({ body: reply, parentId: thread.id })
      setReply('')
    } catch {
      /* provider surfaced it; keep the draft */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      ref={cardRef}
      onClick={() => setActiveId(thread.id)}
      className={[
        'rounded-xl border p-3 transition-colors cursor-default',
        active ? 'border-brand bg-brand-soft/40' : 'border-line bg-surface',
        resolved && !active ? 'opacity-60' : '',
      ].join(' ')}
    >
      {thread.anchor.quote && (
        <p
          className={[
            'mb-2 line-clamp-2 border-l-2 pl-2 text-[11px] italic',
            orphaned ? 'border-faint text-faint' : 'border-amber-400 text-muted',
          ].join(' ')}
        >
          {thread.anchor.quote}
        </p>
      )}
      {orphaned && (
        <p className="mb-2 flex items-center gap-1 text-[10px] text-faint">
          <Link2Off className="h-3 w-3" />
          The text this was attached to has changed
        </p>
      )}

      <Bubble comment={thread} onDelete={remove} />

      {thread.replies.length > 0 && (
        <div className="mt-2.5 space-y-2.5 border-l border-line-soft pl-3">
          {thread.replies.map((r) => (
            <Bubble key={r.id} comment={r} onDelete={remove} />
          ))}
        </div>
      )}

      {active && (
        <div className="mt-3 border-t border-line-soft pt-2.5">
          {!member && !name && <NameField className="mb-2" />}
          <div className="flex items-start gap-1.5">
            <CornerDownRight className="mt-2 h-3 w-3 shrink-0 text-faint" />
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter')
                  void submitReply()
              }}
              rows={2}
              maxLength={4000}
              placeholder="Reply…"
              className="w-full resize-y rounded-lg border border-line bg-canvas/50 px-2 py-1.5 text-[12px] outline-none focus:border-brand"
            />
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void setResolved(thread.id, !resolved)}
              className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] hover:border-brand hover:text-brand"
            >
              {resolved ? (
                <>
                  <RotateCcw className="h-3 w-3" /> Reopen
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" /> Resolve
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void submitReply()}
              disabled={!reply.trim() || busy}
              className="rounded-lg bg-brand px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-40"
            >
              {busy ? 'Sending…' : 'Reply'}
            </button>
          </div>
        </div>
      )}

      {!active && resolved && (
        <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700">
          <Check className="h-3 w-3" />
          Resolved{thread.resolvedBy ? ` by ${thread.resolvedBy}` : ''}
        </p>
      )}
    </div>
  )
}

/**
 * The right-hand thread list, in two parts.
 *
 * **This page** is ordered by where each anchor sits in the document, so
 * reading the rail top-to-bottom matches reading the page; orphaned and
 * page-level threads collect at the end where they can't disappear.
 *
 * **Elsewhere** is every other thread in the project, grouped by page in
 * left-nav order. Without it a question sits unread on a page nobody
 * thinks to revisit — the badge in the nav says a number, and finding out
 * what it says means opening each feature in turn. Clicking one navigates
 * there and scrolls to the quote.
 */
export function CommentRail({ onClose }: { onClose: () => void }) {
  const {
    threads,
    allThreads,
    truncated,
    docKey,
    share,
    member,
    error,
    signOut,
    refresh,
  } = useComments()
  const [showResolved, setShowResolved] = useState(false)

  const { ordered, orphanIds } = useMemo(() => {
    const root = document.getElementById(COMMENT_ROOT_ID)
    const positions = new Map<string, number>()
    const orphans = new Set<string>()
    for (const thread of threads) {
      const range = root ? resolveAnchor(root, thread.anchor) : null
      if (range) {
        positions.set(thread.id, range.getBoundingClientRect().top)
      } else if (thread.anchor.quote) {
        // Only a thread that *had* a quote can have lost it. A page-level
        // comment never had one, and telling its author their text changed
        // is a lie about a comment that is working exactly as intended.
        orphans.add(thread.id)
      }
    }
    const sorted = [...threads].sort((a, b) => {
      const pa = positions.get(a.id)
      const pb = positions.get(b.id)
      if (pa === undefined && pb === undefined)
        return a.createdAt.localeCompare(b.createdAt)
      if (pa === undefined) return 1
      if (pb === undefined) return -1
      return pa - pb
    })
    return { ordered: sorted, orphanIds: orphans }
  }, [threads])

  const visible = showResolved
    ? ordered
    : ordered.filter((t) => t.resolvedAt === null)

  // Every other page that has something to say, in nav order.
  const elsewhere = useMemo(() => {
    const byDoc = new Map<string, CommentThread[]>()
    for (const thread of allThreads) {
      if (thread.docKey === docKey) continue
      if (!showResolved && thread.resolvedAt !== null) continue
      const list = byDoc.get(thread.docKey) ?? []
      list.push(thread)
      byDoc.set(thread.docKey, list)
    }
    return [...byDoc.entries()]
      .sort(([a], [b]) => docOrder(a) - docOrder(b))
      .map(([key, list]) => ({
        key,
        label: docTitle(key),
        threads: list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }))
  }, [allThreads, docKey, showResolved])

  const openCount = allThreads.filter((t) => t.resolvedAt === null).length
  const resolvedCount = allThreads.length - openCount
  const elsewhereCount = elsewhere.reduce((n, g) => n + g.threads.length, 0)

  return (
    <aside
      {...{ [NO_COMMENT_ATTR]: true }}
      className="fixed right-0 top-0 z-40 flex h-full w-[340px] flex-col border-l border-line bg-canvas shadow-2xl"
    >
      <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <MessageSquare className="h-4 w-4 text-brand" />
        <span className="text-[13px] font-semibold">Comments</span>
        <span className="text-[11px] text-faint">
          {openCount} open
          {resolvedCount > 0 ? ` · ${resolvedCount} resolved` : ''}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto text-muted hover:text-ink"
          aria-label="Close comments"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {error && (
        <p className="border-b border-line bg-red-50 px-4 py-2 text-[11px] text-red-700">
          {error}
        </p>
      )}

      <div
        data-comment-scroll
        className="flex-1 space-y-2.5 overflow-y-auto scroll-thin p-3"
      >
        <SectionLabel>This page</SectionLabel>
        {visible.length === 0 ? (
          <p className="px-1 pb-2 pt-1 text-center text-[11.5px] leading-relaxed text-faint">
            No {showResolved ? '' : 'open '}comments here.
            <br />
            Select any text to start a thread.
          </p>
        ) : (
          visible.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              orphaned={orphanIds.has(thread.id)}
            />
          ))
        )}

        {elsewhereCount > 0 && (
          <>
            <SectionLabel>
              Elsewhere on the site · {elsewhereCount}
            </SectionLabel>
            {elsewhere.map((group) => (
              <div key={group.key} className="space-y-1.5">
                <p
                  title={group.key}
                  className="flex items-baseline gap-1.5 px-0.5 pt-1 text-[11px] font-medium text-muted"
                >
                  <span className="truncate">{group.label}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-faint">
                    {group.threads.length}
                  </span>
                </p>
                {group.threads.map((thread) => (
                  <RemoteThreadCard key={thread.id} thread={thread} />
                ))}
              </div>
            ))}
          </>
        )}

        {truncated && (
          <p className="px-1 pt-2 text-center text-[10px] leading-relaxed text-faint">
            Showing the first {allThreads.length} threads — this project has
            more than the rail can load at once.
          </p>
        )}
      </div>

      <footer className="space-y-2 border-t border-line bg-surface px-4 py-2.5">
        <label className="flex items-center gap-2 text-[11px] text-muted">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Show resolved
        </label>
        {/* A member is already named by their account — asking again
            would invite two names for one person. */}
        {member ? <MemberBadge member={member} /> : <NameField />}
        <div className="flex items-center justify-between text-[10px] text-faint">
          <span>{share ? `${share.projectKey} · BB PM` : 'BB PM'}</span>
          <span className="flex gap-2">
            <button type="button" onClick={refresh} className="hover:text-ink">
              Refresh
            </button>
            <button type="button" onClick={signOut} className="hover:text-ink">
              Sign out
            </button>
          </span>
        </div>
      </footer>
    </aside>
  )
}
