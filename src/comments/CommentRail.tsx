import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronRight,
  CornerDownRight,
  Link2Off,
  MessageSquare,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useComments } from './CommentsProvider'
import { resolveAvatarUrl } from './client'
import { docLabelParts, docOrder } from './docTitle'
import { COMMENT_ROOT_ID, NO_COMMENT_ATTR, resolveAnchor } from './anchor'
import { QUICK_KEY_LABEL, isTypingTarget } from './hotkeys'
import { NameField } from './NameField'
import type { Comment, CommentThread, ShareMember } from './types'

/** Which threads the rail is showing. `open` is the working default. */
type StatusFilter = 'open' | 'resolved' | 'all'

/**
 * Where the keyboard should land after a j/k step. The sequence number is
 * what makes a repeat land again: pressing Enter twice on one thread is
 * two requests to focus the reply box, and without it the second is a
 * no-op because nothing about the value changed.
 */
interface KeyboardFocus {
  id: string
  target: 'card' | 'reply'
  seq: number
}

function isMine(thread: CommentThread): boolean {
  return thread.mine || thread.replies.some((r) => r.mine)
}

function matchesStatus(thread: CommentThread, status: StatusFilter): boolean {
  if (status === 'all') return true
  const resolved = thread.resolvedAt !== null
  return status === 'resolved' ? resolved : !resolved
}

/**
 * Search covers the replies and the quoted text too, not just the opening
 * comment — "the one about the pipeline stages" is as likely to be
 * something DucLuong said three replies down as it is the title.
 */
function matchesQuery(thread: CommentThread, needle: string): boolean {
  if (!needle) return true
  const fields = [
    thread.body,
    thread.author.name,
    thread.anchor.quote ?? '',
    ...thread.replies.flatMap((r) => [r.body, r.author.name]),
  ]
  return fields.some((field) => field.toLowerCase().includes(needle))
}

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

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-canvas px-1 py-px font-sans text-[9.5px] font-semibold text-muted">
      {children}
    </kbd>
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
        {comment.canDelete && (
          <button
            type="button"
            onClick={() => onDelete(comment.id)}
            className="ml-auto text-faint opacity-0 transition-opacity group-hover/bubble:opacity-100 hover:text-red-600"
            aria-label={comment.mine ? 'Delete comment' : 'Delete as moderator'}
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
 *
 * Two lines, deliberately. These sit inside a group already labelled with
 * the page they belong to, so the reader has the context and only needs
 * enough of the thread to recognise it — the quote, the reply count on
 * its own line and a second line of body were three rows of scroll each,
 * spent on a card whose entire purpose is to be clicked through.
 */
function RemoteThreadCard({ thread }: { thread: CommentThread }) {
  const { jumpTo } = useComments()
  const resolved = thread.resolvedAt !== null

  return (
    <button
      type="button"
      onClick={() => jumpTo(thread)}
      title={thread.anchor.quote ?? undefined}
      className={[
        'w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left transition-colors hover:border-brand',
        resolved ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="truncate text-[11.5px] font-semibold">
          {thread.author.name}
        </span>
        <span className="shrink-0 text-[10px] text-faint">
          {relativeTime(thread.createdAt)}
        </span>
        {thread.replies.length > 0 && (
          <span className="shrink-0 text-[10px] text-faint">
            · {thread.replies.length}
          </span>
        )}
        {resolved && (
          <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-700" />
        )}
      </div>
      <p className="line-clamp-1 text-[12px] leading-relaxed text-ink/85">
        {thread.body}
      </p>
    </button>
  )
}

function ThreadCard({
  thread,
  orphaned,
  focus,
}: {
  thread: CommentThread
  orphaned: boolean
  /** Set when the keyboard just landed here; null for every other card. */
  focus: KeyboardFocus | null
}) {
  const { activeId, setActiveId, post, setResolved, remove, name, member } =
    useComments()
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)
  const active = activeId === thread.id
  const resolved = thread.resolvedAt !== null

  /*
   * `preventScroll` because the two scrollers this card sits in are
   * already being driven — the rail by the effect below, the page by
   * CommentableRoot — and letting the browser also scroll to the focused
   * element lands somewhere between the two, mid-animation.
   */
  useEffect(() => {
    if (!focus) return
    if (focus.target === 'reply') replyRef.current?.focus({ preventScroll: true })
    else cardRef.current?.focus({ preventScroll: true })
  }, [focus])

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
      /**
       * The card is a toggle: click to open the reply box, click again to
       * put it away. Before this the only way to close one was to open a
       * different one, so a rail you had finished with kept a composer
       * and two buttons wedged open under the thread you were reading.
       *
       * Two things are not "a click on the card". Anything that landed on
       * a control of its own — Reply, Resolve, the delete bin, the
       * textarea — is that control's click and nothing else; without this
       * guard, clicking into the reply box would close the reply box.
       * And a drag that left text selected is a copy, not a click: the
       * same rule the page highlights use in CommentableRoot.
       */
      onClick={(e) => {
        if (
          e.target instanceof Element &&
          e.target.closest('button, textarea, input, a, [contenteditable]')
        )
          return
        if (!window.getSelection()?.isCollapsed) return
        setActiveId(active ? null : thread.id)
      }}
      /*
       * Focusable so ↑/↓ have somewhere to mean "the rail" rather than
       * "the page", and so the list is reachable by Tab at all — until now
       * these were click-only divs, invisible to anyone on a keyboard.
       */
      tabIndex={0}
      aria-current={active || undefined}
      className={[
        'cursor-pointer rounded-xl border p-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/40',
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
              ref={replyRef}
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
    activeId,
    setActiveId,
    setResolved,
  } = useComments()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [mineOnly, setMineOnly] = useState(false)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [focus, setFocus] = useState<KeyboardFocus | null>(null)
  const focusSeq = useRef(0)

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

  const needle = query.trim().toLowerCase()
  const keep = useCallback(
    (thread: CommentThread) =>
      matchesStatus(thread, status) &&
      (!mineOnly || isMine(thread)) &&
      matchesQuery(thread, needle),
    [status, mineOnly, needle],
  )

  const visible = useMemo(() => ordered.filter(keep), [ordered, keep])

  // Every other page that has something to say, in nav order.
  const elsewhere = useMemo(() => {
    const byDoc = new Map<string, CommentThread[]>()
    for (const thread of allThreads) {
      if (thread.docKey === docKey) continue
      if (!keep(thread)) continue
      const list = byDoc.get(thread.docKey) ?? []
      list.push(thread)
      byDoc.set(thread.docKey, list)
    }
    return [...byDoc.entries()]
      .sort(([a], [b]) => docOrder(a) - docOrder(b))
      .map(([key, list]) => ({
        key,
        ...docLabelParts(key),
        threads: list.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      }))
  }, [allThreads, docKey, keep])

  const openCount = allThreads.filter((t) => t.resolvedAt === null).length
  const resolvedCount = allThreads.length - openCount
  const elsewhereCount = elsewhere.reduce((n, g) => n + g.threads.length, 0)

  /*
   * Searching overrides the collapsed state rather than clearing it: the
   * point of typing is to see what matched, and a list of shut folders is
   * a worse answer than no answer. Clearing the box restores whatever the
   * reader had opened by hand.
   */
  const searching = needle.length > 0
  const toggleGroup = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })

  /**
   * j / k step through the threads on this page, Enter drops into the
   * reply box, R resolves. ↑ / ↓ do the same as j / k but only while the
   * focus is inside the rail — bound globally they would take the arrow
   * keys away from scrolling the page, which is a bad trade for anyone
   * who leaves the rail open while reading.
   *
   * Only this page's threads are navigable. The ones from elsewhere are
   * one click from being on another page entirely, and stepping onto one
   * would mean navigating out from under the key you just pressed.
   */
  const railRef = useRef<HTMLElement>(null)
  const step = useCallback(
    (delta: number) => {
      if (visible.length === 0) return
      const at = visible.findIndex((t) => t.id === activeId)
      const next =
        at === -1
          ? delta > 0
            ? 0
            : visible.length - 1
          : (at + delta + visible.length) % visible.length
      setActiveId(visible[next].id)
      focusSeq.current += 1
      setFocus({ id: visible[next].id, target: 'card', seq: focusSeq.current })
    },
    [visible, activeId, setActiveId],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.repeat) return
      if (isTypingTarget(e.target)) return

      const inRail =
        document.activeElement instanceof Node &&
        !!railRef.current?.contains(document.activeElement)
      const down = e.key === 'j' || (inRail && e.key === 'ArrowDown')
      const up = e.key === 'k' || (inRail && e.key === 'ArrowUp')
      if (down || up) {
        e.preventDefault()
        step(down ? 1 : -1)
        return
      }

      /*
       * Enter and R act on the selected thread, so they must not fire
       * while the reader is somewhere else with something focused — a nav
       * link, the "Refresh" button, a tab. Enter on a focused link means
       * "follow it", and a thread staying selected in the rail is no
       * reason to swallow that. Body (nothing focused) still counts as
       * ours: that is where a click on a page highlight leaves you.
       */
      const elsewhereFocus =
        document.activeElement !== null &&
        document.activeElement !== document.body &&
        !inRail
      if (elsewhereFocus) return

      const thread = activeId ? visible.find((t) => t.id === activeId) : null
      if (!thread) return
      if (e.key === 'Enter') {
        e.preventDefault()
        focusSeq.current += 1
        setFocus({ id: thread.id, target: 'reply', seq: focusSeq.current })
        return
      }
      if (e.key === 'r') {
        e.preventDefault()
        void setResolved(thread.id, thread.resolvedAt === null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [step, visible, activeId, setResolved])

  return (
    <aside
      ref={railRef}
      {...{ [NO_COMMENT_ATTR]: true }}
      // Width comes from `--comment-rail-w` in index.css because the page
      // reserves exactly this much room while the rail is open.
      className="fixed right-0 top-0 z-40 flex h-full w-[var(--comment-rail-w)] flex-col border-l border-line bg-canvas shadow-2xl"
    >
      <header className="space-y-2 border-b border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
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
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Escape clears rather than closing the rail — you reach for
              // it to undo the filter you can see, not to leave.
              if (e.key === 'Escape' && query) {
                e.stopPropagation()
                setQuery('')
              }
            }}
            placeholder="Search comments…"
            aria-label="Search comments"
            className="w-full rounded-lg border border-line bg-canvas/50 py-1.5 pl-7 pr-2 text-[12px] outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-line p-0.5">
            {(['open', 'resolved', 'all'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                aria-pressed={status === value}
                className={`rounded-md px-2 py-0.5 text-[11px] capitalize transition-colors ${
                  status === value
                    ? 'bg-brand text-white'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            aria-pressed={mineOnly}
            className={`rounded-lg border px-2 py-1 text-[11px] transition-colors ${
              mineOnly
                ? 'border-brand bg-brand-soft/50 text-brand'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            Mine
          </button>
        </div>
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
        <SectionLabel>This page · {visible.length}</SectionLabel>
        {visible.length === 0 ? (
          <p className="px-1 pb-2 pt-1 text-center text-[11.5px] leading-relaxed text-faint">
            {searching || mineOnly || status !== 'open' ? (
              'Nothing here matches those filters.'
            ) : (
              <>
                No open comments here.
                <br />
                Select any text, then click{' '}
                <span className="font-medium text-muted">Comment</span> or
                press{' '}
                <kbd className="rounded border border-line bg-surface px-1 py-px font-sans text-[10px] font-semibold text-muted">
                  {QUICK_KEY_LABEL}
                </kbd>
                .
              </>
            )}
          </p>
        ) : (
          visible.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              orphaned={orphanIds.has(thread.id)}
              focus={focus?.id === thread.id ? focus : null}
            />
          ))
        )}

        {elsewhereCount > 0 && (
          <>
            <SectionLabel>
              Elsewhere on the site · {elsewhereCount}
            </SectionLabel>
            {elsewhere.map((group) => {
              const open = searching || expanded.has(group.key)
              return (
                <div key={group.key} className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={open}
                    title={group.parent ? `${group.parent} › ${group.leaf}` : group.leaf}
                    className="flex w-full items-center gap-1.5 rounded-lg px-1 py-1 text-left hover:bg-surface"
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 text-faint transition-transform ${
                        open ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      {/* Module above, page below: five features of one
                          module otherwise read as five identical rows
                          truncated at the only part that differs. */}
                      {group.parent && (
                        <span className="block truncate text-[9.5px] uppercase tracking-wide text-faint">
                          {group.parent}
                        </span>
                      )}
                      <span className="block truncate text-[11.5px] font-medium text-ink/80">
                        {group.leaf}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-semibold text-faint">
                      {group.threads.length}
                    </span>
                  </button>
                  {open &&
                    group.threads.map((thread) => (
                      <RemoteThreadCard key={thread.id} thread={thread} />
                    ))}
                </div>
              )
            })}
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
        {/* The shortcuts only pay off if you know they exist, and this is
            the one strip of the rail that never scrolls away. */}
        <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[10px] text-faint">
          <Key>j</Key>
          <Key>k</Key>
          <span>move</span>
          <Key>↵</Key>
          <span>reply</span>
          <Key>r</Key>
          <span>resolve</span>
        </p>
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
