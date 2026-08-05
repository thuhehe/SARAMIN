/**
 * Drag-to-move for the floating comment pill.
 *
 * The pill sits in the bottom-right corner, which is also where a lot of
 * the spec's own content ends up — table scrollbars, the last row of a
 * long list, a callout. Reviewers need to be able to shove it out of the
 * way, so a press that travels becomes a drag and a press that doesn't
 * stays a click. Where it lands is remembered per browser: moving it
 * once should be the last time anyone thinks about it.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/** How far a press must travel before it counts as a drag, not a click. */
const DRAG_THRESHOLD = 4

/** Keeps the pill from being dropped half-way off the viewport. */
const EDGE_MARGIN = 8

interface Point {
  left: number
  top: number
}

/** Safari in private mode throws on every localStorage touch. */
function readStored(key: string): Point | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Point).left === 'number' &&
      typeof (parsed as Point).top === 'number'
    )
      return { left: (parsed as Point).left, top: (parsed as Point).top }
  } catch {
    /* unreadable — fall back to the default corner */
  }
  return null
}

interface Gesture {
  pointerId: number
  /** Where the press started, in viewport coordinates. */
  startX: number
  startY: number
  /** Where the pill was when the press started. */
  left: number
  top: number
}

export function useDraggable({
  storageKey,
  onActivate,
}: {
  storageKey: string
  /** Runs on a plain click — a press that ended without moving. */
  onActivate: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<Point | null>(() =>
    readStored(storageKey),
  )
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  // A ref, not state: the click that follows the drop has to read this
  // before React would have re-rendered.
  const moved = useRef(false)

  const clamp = useCallback((point: Point): Point => {
    const el = ref.current
    const width = el?.offsetWidth ?? 0
    const height = el?.offsetHeight ?? 0
    const next = {
      left: Math.min(
        Math.max(point.left, EDGE_MARGIN),
        Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN),
      ),
      top: Math.min(
        Math.max(point.top, EDGE_MARGIN),
        Math.max(EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN),
      ),
    }
    // Same object when nothing moved, so callers can use this as a
    // no-op guard instead of re-rendering and re-saving for free.
    return next.left === point.left && next.top === point.top ? point : next
  }, [])

  // A window that shrank since the last visit — or between renders — can
  // leave a remembered spot off-screen, which would strand the pill.
  useEffect(() => {
    const reclamp = () => setPosition((p) => (p ? clamp(p) : p))
    reclamp()
    window.addEventListener('resize', reclamp)
    return () => window.removeEventListener('resize', reclamp)
  }, [clamp])

  // Written on the drop rather than on every move: `dragging` is false
  // and `position` settled only once the pointer is up.
  useEffect(() => {
    if (dragging || !position) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position))
    } catch {
      /* storage unavailable — the spot simply doesn't survive reload */
    }
  }, [dragging, position, storageKey])

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
    }
    moved.current = false
    // Dragging the pill shouldn't select the text underneath it.
    event.preventDefault()
    try {
      // Capture so the drag survives the pointer outrunning the pill, and
      // so the drop still arrives if it ends over an iframe or the rail.
      el.setPointerCapture(event.pointerId)
    } catch {
      // Only a synthetic pointer gets here (no active pointer to
      // capture). The gesture still works off the plain move events.
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    // A `pointerup` that never arrived (a lost capture, a browser that
    // swallowed it) would otherwise leave the pill following the cursor
    // around the page. No button held means the gesture is over.
    if (event.buttons === 0) {
      gesture.current = null
      setDragging(false)
      return
    }
    const dx = event.clientX - active.startX
    const dy = event.clientY - active.startY
    if (!moved.current && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
    moved.current = true
    setDragging(true)
    setPosition(clamp({ left: active.left + dx, top: active.top + dy }))
  }

  const onPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId) return
    gesture.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return {
    dragging,
    props: {
      ref,
      style: {
        // `right: auto` / `bottom: auto` undo the default corner the
        // pill is anchored to by class until someone moves it.
        ...(position
          ? {
              left: position.left,
              top: position.top,
              right: 'auto',
              bottom: 'auto',
            }
          : null),
        // Otherwise a touch-drag scrolls the page instead of moving it.
        touchAction: 'none' as const,
      },
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        // The browser fires a click after the drop too; that one is the
        // tail of the gesture, not a request to open anything. Only a
        // pointer click can be that tail — `detail` is 0 for Enter or
        // Space on the focused pill, which must always activate it.
        if (moved.current && event.detail > 0) {
          moved.current = false
          return
        }
        onActivate()
      },
    },
  }
}
