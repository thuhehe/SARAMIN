import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

/*
 * ── Image lightbox ───────────────────────────────────────────────────────────
 *
 * A picture opens in an overlay ON the page, never in a new tab. A new tab
 * loses the reader's place — they come back to a page scrolled wherever they
 * left it and have to hunt for the step again — and it drops the caption,
 * which is half of what a screenshot means in a guide.
 *
 * The admin screens are captured at 1408px wide, so on a laptop the fitted view
 * lands just under 1:1 and the small text inside a table is exactly what the
 * reader opened the picture for. Hence the zoom toggle: fit by default, click
 * the image for actual pixels and pan.
 *
 * Usage: wrap the page in <LightboxProvider items={…}> and call
 * useLightbox()?.open(src) from whatever renders the image. Items are matched
 * BY SRC, so the arrows step through every picture on the page in reading order
 * without a caller ever passing an index — one less thing to keep in sync when
 * a task gains a screenshot.
 */

export interface LightboxItem {
  src: string
  caption?: string
}

interface LightboxApi {
  open: (src: string) => void
}

const LightboxCtx = createContext<LightboxApi | null>(null)

/** null when the tree has no provider — callers fall back to a plain link. */
export function useLightbox() {
  return useContext(LightboxCtx)
}

export function LightboxProvider({ items, children }: { items: LightboxItem[]; children: ReactNode }) {
  const [state, setState] = useState<{ list: LightboxItem[]; i: number } | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  const open = useCallback(
    (src: string) => {
      const i = items.findIndex((it) => it.src === src)
      /* An unregistered src still opens, just without arrows — a picture missing
         from the list must not turn a click into nothing. */
      setState(i >= 0 ? { list: items, i } : { list: [{ src }], i: 0 })
      setZoomed(false)
    },
    [items],
  )

  const close = useCallback(() => setState(null), [])

  const step = useCallback((d: number) => {
    setState((s) => (s && s.list.length > 1 ? { ...s, i: (s.i + d + s.list.length) % s.list.length } : s))
    setZoomed(false)
  }, [])

  const isOpen = state !== null

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close, step])

  /* The page behind must not scroll under the overlay — a wheel over the scrim
     otherwise moves the guide, and closing lands the reader somewhere else. */
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) closeRef.current?.focus()
  }, [isOpen])

  const cur = state ? state.list[state.i] : undefined
  const many = (state?.list.length ?? 0) > 1

  return (
    <LightboxCtx.Provider value={{ open }}>
      {children}
      {state &&
        cur &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={cur.caption ?? 'Screenshot'}
            className="fixed inset-0 z-[200] flex flex-col bg-ink/90 backdrop-blur-sm"
            onClick={close}
          >
            <div className="flex shrink-0 items-center gap-3 px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
              <p className="min-w-0 flex-1 truncate text-[12.5px] text-white/80">{cur.caption}</p>
              {many && (
                <span className="shrink-0 font-mono text-[11.5px] text-white/50">
                  {state.i + 1} / {state.list.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                title={zoomed ? 'Fit to screen' : 'Actual size'}
                aria-label={zoomed ? 'Fit to screen' : 'Actual size'}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
              >
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                title="Close (Esc)"
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Zoomed, the image is bigger than the box, so the box scrolls and the
                image is only centred horizontally — a flex-centred child cannot be
                scrolled back to its own top edge. */}
            <div
              className={
                zoomed
                  ? 'flex-1 overflow-auto px-4 pb-5'
                  : 'flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pb-5'
              }
              onClick={close}
            >
              <img
                key={cur.src}
                src={cur.src}
                alt={cur.caption ?? ''}
                onClick={(e) => {
                  e.stopPropagation()
                  setZoomed((z) => !z)
                }}
                className={
                  zoomed
                    ? 'mx-auto block max-w-none cursor-zoom-out rounded-lg shadow-2xl'
                    : 'max-h-full max-w-full cursor-zoom-in rounded-lg object-contain shadow-2xl'
                }
              />
            </div>

            {many && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    step(-1)
                  }}
                  title="Previous (←)"
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    step(1)
                  }}
                  title="Next (→)"
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </LightboxCtx.Provider>
  )
}
