import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useComments } from './CommentsProvider'
import {
  COMMENT_ROOT_ID,
  boxesFor,
  resolveAnchor,
  type HighlightBox,
} from './anchor'
import { SelectionPopover } from './SelectionPopover'

interface Painted {
  id: string
  boxes: HighlightBox[]
  resolved: boolean
}

/**
 * Wraps the page content and paints comment highlights over it.
 *
 * The highlights are absolutely-positioned boxes in an overlay layer,
 * not `<mark>` elements wrapped around the text. That matters: this
 * site re-renders its content from `src/data/**` on every navigation,
 * and any DOM we injected into React's tree would be destroyed,
 * duplicated, or would fight reconciliation. An overlay is read-only —
 * we measure the text, we never own it.
 *
 * Positions are recomputed whenever the threads change, the route
 * changes, or the content resizes (tab switches, image loads, window
 * resize all funnel through the ResizeObserver).
 */
export function CommentableRoot({ children }: { children: React.ReactNode }) {
  const { threads, docKey, activeId, activeSeq, setActiveId, status } =
    useComments()
  const rootRef = useRef<HTMLDivElement>(null)
  const [painted, setPainted] = useState<Painted[]>([])

  const repaint = useCallback(() => {
    const root = rootRef.current
    if (!root || status !== 'ready') {
      setPainted([])
      return
    }
    const next: Painted[] = []
    for (const thread of threads) {
      const range = resolveAnchor(root, thread.anchor)
      if (!range) continue // orphaned or page-level — the rail lists it
      const boxes = boxesFor(range, root)
      if (boxes.length) {
        next.push({
          id: thread.id,
          boxes,
          resolved: thread.resolvedAt !== null,
        })
      }
    }
    setPainted(next)
  }, [threads, status])

  // Layout effect so boxes land in the same frame as the content they
  // sit on — a paint-then-correct would show highlights sliding.
  useLayoutEffect(() => {
    repaint()
  }, [repaint, docKey])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(() => repaint())
    observer.observe(root)
    window.addEventListener('resize', repaint)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', repaint)
    }
  }, [repaint])

  /**
   * Selecting a thread scrolls its quote into view — the rail is useless
   * for a long page if you have to hunt for the sentence yourself.
   *
   * Only scrolls when the quote is actually outside a comfortable band,
   * so clicking a highlight that's already on screen (or a thread you
   * just replied to) doesn't yank the page around. Threads with no
   * resolvable anchor — orphaned or page-level — have nowhere to go and
   * are skipped, and are left unmarked so the jump still happens if their
   * text arrives on a later render.
   *
   * Keyed on `activeSeq`, not on `activeId`. Once per *selection* is the
   * right rate — `threads` is a fresh array on every 5s poll, and without
   * a guard a reader who scrolls away from a still-selected thread gets
   * dragged back every five seconds — but "selection" means the act, not
   * the value. Clicking the same card again leaves `activeId` untouched,
   * so an id-keyed guard swallowed exactly the click that means "take me
   * back there", which is what you press after reading somewhere else.
   */
  const scrolledSeq = useRef(-1)
  useEffect(() => {
    if (!activeId || status !== 'ready') return
    if (scrolledSeq.current === activeSeq) return
    const root = rootRef.current
    if (!root) return
    const thread = threads.find((t) => t.id === activeId)
    if (!thread) return

    // Keep clear of the sticky page chrome at the top, and leave the
    // quote well above the fold rather than flush against the edge.
    const topMargin = 120
    const bottomMargin = 80

    /*
     * Measure only once the layout has stopped moving. A selection often
     * *opens* the rail, and the page then gives back the rail's width over
     * 150ms — which reflows the column and walks the quote down by up to a
     * few hundred px on a spec page. Scrolling to where the quote was
     * before that reflow lands somewhere near it but not on it, which
     * reads as "it didn't jump to my comment".
     *
     * Watching the rect settle rather than waiting out a hard-coded 150ms
     * keeps this honest if the transition changes, and covers the other
     * reason a rect moves late (a font or image landing above the quote).
     */
    let cancelled = false
    let frame = 0
    let lastTop = NaN
    let stableFrames = 0
    const deadline = performance.now() + 400

    const align = () => {
      if (cancelled) return
      const range = resolveAnchor(root, thread.anchor)
      if (!range) return
      const rect = range.getBoundingClientRect()
      if (rect.height === 0 && rect.width === 0) return

      if (rect.top === lastTop) stableFrames += 1
      else {
        stableFrames = 0
        lastTop = rect.top
      }
      if (stableFrames < 2 && performance.now() < deadline) {
        frame = requestAnimationFrame(align)
        return
      }

      scrolledSeq.current = activeSeq
      const comfortable =
        rect.top >= topMargin && rect.bottom <= window.innerHeight - bottomMargin
      if (comfortable) return
      window.scrollBy({ top: rect.top - topMargin, behavior: 'smooth' })
    }

    frame = requestAnimationFrame(align)
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [activeId, activeSeq, threads, status])

  /**
   * Clicking highlighted text focuses its thread. Done by hit-testing
   * the click against the painted boxes rather than by making the boxes
   * clickable: the boxes sit *under* the text so it stays selectable,
   * and they are `aria-hidden` decoration — putting buttons in there
   * would hide real controls from assistive tech. The rail's own list
   * is the accessible route to every thread.
   */
  const onContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root || painted.length === 0) return
    if (!window.getSelection()?.isCollapsed) return // a drag-select, not a click
    const origin = root.getBoundingClientRect()
    const x = event.clientX - origin.left
    const y = event.clientY - origin.top
    const hit = painted.find((thread) =>
      thread.boxes.some(
        (b) => x >= b.left && x <= b.left + b.width && y >= b.top && y <= b.top + b.height,
      ),
    )
    if (hit) setActiveId(hit.id)
  }

  return (
    <div id={COMMENT_ROOT_ID} ref={rootRef} className="relative isolate">
      <div
        aria-hidden
        /*
         * Over the text, not behind it. This site's content is a stack of
         * opaque cards (`bg-surface`), so a box painted underneath one is
         * a box nobody ever sees — which is every highlight outside the
         * few paragraphs that sit on the bare canvas.
         *
         * `mix-blend-multiply` is what makes being on top safe: like a
         * marker on paper it darkens the white card to amber and leaves
         * the glyphs alone, so the quote stays as readable as it was.
         * `isolate` on the root confines that blend to this subtree, and
         * `pointer-events-none` keeps the text selectable through it.
         */
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden mix-blend-multiply"
      >
        {painted.map((thread) =>
          thread.boxes.map((box, i) => (
            <span
              key={`${thread.id}-${i}`}
              className={[
                'absolute rounded-[3px] transition-colors',
                thread.resolved
                  ? 'bg-emerald-200/60'
                  : activeId === thread.id
                    ? 'bg-amber-300 ring-1 ring-amber-500/60'
                    : 'bg-amber-200/70',
              ].join(' ')}
              style={{
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
              }}
            />
          )),
        )}
      </div>

      {/* Content sits above the highlight boxes so text stays selectable. */}
      <div className="relative z-[1]" onClick={onContentClick}>
        {children}
      </div>

      <SelectionPopover rootRef={rootRef} />
    </div>
  )
}
