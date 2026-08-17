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

/* ── Shareable requirement sections ───────────────────────────────────────────
   A requirement gets discussed one block at a time ("the Pending rule", "section
   4"), so each block needs its own address the same way each mockup screen does.
   The block id comes from its LABEL rather than its position, so a link survives
   the reordering that happens constantly while a spec is being written — at the
   cost of breaking when a label is renamed, which is rarer and louder. */

/** Label → url fragment: diacritics stripped, punctuation collapsed to dashes. */
export function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      // đ/Đ carry no combining mark, so NFD leaves them behind
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}

/**
 * Scroll to the landing `#fragment` and flash it.
 *
 * The browser's own fragment scrolling fires before the page has rendered its
 * data, so it lands on nothing; this re-runs it once the content is in. The
 * flash matters because a requirement block looks the same as the nine around
 * it — without it a reader arrives with no idea which one they were sent to.
 */
export function useHashTarget() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return

    /* Retried, because two other things scroll on the same mount: the browser's
       own fragment jump (which fires before the data has rendered and lands on
       nothing) and the app's scroll-to-top on route change. Whichever wins, a
       later attempt puts the reader back on the section they were sent to.
       `auto`, not `smooth` — a deep link is a jump, and an animated 5,000px
       glide is both slow and interruptible by the very scrolls being beaten. */
    const timers = [0, 120, 400].map((d) =>
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'auto' }), d),
    )

    // The flash starts after the last scroll attempt, so it is still on screen
    // when the reader arrives. Requirement cards look alike; without it there is
    // no way to tell which one the link meant.
    const ring = ['ring-2', 'ring-brand', 'ring-offset-2'] as const
    let el: HTMLElement | null = null
    timers.push(
      setTimeout(() => {
        el = document.getElementById(id)
        el?.classList.add(...ring)
      }, 420),
      setTimeout(() => el?.classList.remove(...ring), 2600),
    )

    return () => {
      timers.forEach(clearTimeout)
      el?.classList.remove(...ring)
    }
  }, [])
}

/**
 * Copy a link straight to one section.
 *
 * Icon-only and hover-revealed: every requirement block carries one, and a row
 * of "Copy link" buttons down the page would compete with the requirements
 * themselves. It stays visible while focused so it is reachable by keyboard.
 */
export function CopySectionLink({ hash, className }: { hash: string; className?: string }) {
  const [done, setDone] = useState(false)

  const copy = async () => {
    const { origin, pathname, search } = window.location
    const url = `${origin}${pathname}${search}#${hash}`
    /* Put the section in the address bar FIRST, so that when the clipboard is
       unavailable — permission denied, or a browser that blocks it outright —
       the reader can still copy the link by hand instead of getting nothing.
       replaceState, not a hash assignment: this should not add a history entry
       or re-trigger the fragment scroll on a page the reader is already on. */
    window.history.replaceState(null, '', `${pathname}${search}#${hash}`)
    if (await writeClipboard(url)) setDone(true)
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
      title="Copy a link to this section"
      aria-label="Copy a link to this section"
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-all',
        'opacity-0 focus-visible:opacity-100 group-hover/req:opacity-100',
        done ? 'border-emerald-200 bg-emerald-50 text-emerald-600 opacity-100' : 'border-line text-faint hover:border-ink/40 hover:text-ink',
        className,
      )}
    >
      {done ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
    </button>
  )
}

/** Clipboard write with the plain-http fallback. Returns whether it landed. */
async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    /* Clipboard API needs a secure context and permission. Fall back to the
       old selection trick so this still works over plain http, and stay
       silent if even that fails rather than claiming a copy that never
       happened. */
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
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
