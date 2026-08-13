import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Shareable screen links ───────────────────────────────────────────────────
   A mockup gets reviewed by people who need to point at ONE screen ("look at the
   quotation list"), so every screen has to be addressable on its own. The active
   screen is mirrored into `?screen=<id>`, which makes the address bar the share
   link and costs the page nothing else: navigation stays click-driven and no
   visible screen index is added anywhere.

   The param is the SAME key each page already uses to identify a screen, so a
   link keeps working when groups are renamed or reordered. */

/** Landing `?screen=` value, read once for a useState initialiser. */
export function initialScreenParam(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('screen')
}

/**
 * Mirror the active screen id into `?screen=`.
 *
 * `replace` because switching screens inside a mockup is not a browsing step:
 * with a push per click, Back would walk the reader through every screen they
 * looked at instead of leaving the mockup.
 */
export function useScreenParam(id: string | undefined) {
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    if (!id || params.get('screen') === id) return
    const next = new URLSearchParams(params)
    next.set('screen', id)
    setParams(next, { replace: true })
    // Deliberately keyed on `id` alone: this effect WRITES the param, so
    // depending on the params it just wrote would re-run it for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
}

/** Copy the current URL — which is the link to the screen on show. */
export function CopyLinkButton({ className }: { className?: string }) {
  const [done, setDone] = useState(false)

  const copy = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* Clipboard API needs a secure context and permission. Fall back to the
         old selection trick so this still works over plain http, and stay
         silent if even that fails rather than claiming a copy that never
         happened. */
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (!ok) return
      } catch {
        return
      }
    }
    setDone(true)
  }

  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 1600)
    return () => clearTimeout(t)
  }, [done])

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy a link that opens this screen"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors',
        done
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-line text-muted hover:border-ink/40 hover:text-ink',
        className,
      )}
    >
      {done ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {done ? 'Link copied' : 'Copy link'}
    </button>
  )
}
