/* Wireframe primitives — grey-box building blocks for the Mockups gallery. */
import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

/** Lets interactive mockups jump between screens when a button is clicked.
 *  Defaults to a no-op, so the same screens render inertly in the static gallery. */
export const NavContext = createContext<(id: string) => void>(() => {})
export function useNav() {
  return useContext(NavContext)
}

export function Line({ w = '100%', h = 8, className }: { w?: string | number; h?: number; className?: string }) {
  return <span className={cn('block rounded bg-line', className)} style={{ width: w, height: h }} />
}

export function Btn({
  children,
  primary,
  className,
  onClick,
}: {
  children: React.ReactNode
  primary?: boolean
  className?: string
  onClick?: () => void
}) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-[12px] font-medium',
        primary ? 'bg-brand text-white' : 'border border-line bg-surface text-ink/70',
        onClick && 'cursor-pointer select-none',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Chip({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'green' | 'blue' | 'amber' | 'rose' }) {
  const tones = {
    muted: 'bg-canvas text-muted border-line',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    /* removed / withdrawn / blocked — the kit had no colour for a state that means
       "stop, this is no longer yours to act on". */
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return <span className={cn('inline-block rounded border px-1.5 py-0.5 text-[10.5px] font-medium', tones[tone])}>{children}</span>
}

/** A browser chrome frame around a mockup. */
export function Browser({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-3 py-2">
        <span className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </span>
        <span className="ml-2 flex-1 rounded-md border border-line bg-surface px-3 py-1 text-[11px] text-faint">{url}</span>
      </div>
      {/* VIEWPORT-RELATIVE, not a fixed 640. The frame starts ~136px down the page,
          so a hard 640 did the wrong thing at both ends: on a tall monitor it left
          a wide band of unused space and made every screen scroll inside a small
          window, and on a short one it pushed its own bottom edge below the fold,
          so the reader scrolled the OUTER page to reach the INNER scrollbar. Sized
          to what is actually there, the common case is one scrollbar instead of
          two.

          THE FLOOR IS THE OLD 640, deliberately, so this can never be a
          regression: it is the value used whenever the viewport is short — and
          also whenever `vh` resolves to nothing, which happens in embedded and
          hidden-pane contexts where innerHeight reports 0. Tall screen → more
          room; anything else → exactly what it did before. */}
      <div className="max-h-[max(640px,calc(100vh-9.5rem))] overflow-y-auto scroll-thin">{children}</div>
    </div>
  )
}

/** Jobseeker site top nav. The section nav (Jobs / Companies / …) is parked for
    now — the logo goes home, and "My account" opens the signed-in area (My page,
    My CVs, My applications…). `active` is accepted so callers stay unchanged.
 *
 *  ONE header for every jobseeker screen, including sign-up and onboarding. Those
 *  used to hand-roll their own logo bar, which looked identical but was dead — so
 *  the brand mark went home on some pages and nowhere on others. `minimal` keeps
 *  the same bar and the same clickable mark, and drops only the right-hand
 *  actions: offering "Sign up" on the sign-up page, or "My account" to someone who
 *  is still creating one, is noise. */
export function JsHeader({ minimal }: { active?: string; minimal?: boolean } = {}) {
  const go = useNav()
  return (
    /* Sticky to the Browser frame's scroll container, so the brand mark — the way
       home — stays reachable however far down a long screen (Create CV, My
       Profile, Onboarding) the reader has scrolled. Opaque background and a z-index
       above the page content, or rows would show through as they pass under it. */
    <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-line bg-surface px-5 py-3">
      <span onClick={() => go('js-home')} className="grid h-6 w-6 cursor-pointer place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
      <span onClick={() => go('js-home')} className="cursor-pointer text-[13px] font-bold text-brand">Saramin<span className="text-ink">VN</span></span>
      {!minimal && (
        <div className="ml-auto flex items-center gap-2">
          <span
            onClick={() => go('js-mypage')}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink/80 hover:border-brand/50"
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[9px] text-white"></span>
            My account <span className="text-faint">▾</span>
          </span>
          <Btn>Sign in</Btn>
          <Btn primary onClick={() => go('js-signup')}>Sign up</Btn>
          <span className="ml-1 hidden sm:inline text-[11px] text-faint">| For employers</span>
        </div>
      )}
    </div>
  )
}

/** A standard VN job card. */
export function JobCard({
  title = 'Job title',
  company = 'Company name',
  salary = 'Thỏa thuận',
  location = 'Hồ Chí Minh',
  rank,
  tier,
  onClick,
}: {
  title?: string
  company?: string
  salary?: string
  location?: string
  rank?: number
  /** Posting tier, shown as the "Tin ưu tiên" disclosure badge. Paid position is
      visible on purpose: banding lets a tier outrank relevance, so the reader is
      told which slots were bought. Omit on Free — there is nothing to disclose. */
  tier?: 'Top Job' | 'Distinction' | 'Basic Plus' | 'Basic'
  onClick?: () => void
}) {
  return (
    <div onClick={onClick} className={cn('flex gap-3 rounded-lg border border-line bg-surface p-3 hover:border-brand/40', onClick && 'cursor-pointer')}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-canvas text-[10px] text-faint">LOGO</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-ink">
            {rank != null && <span className="mr-1 text-brand">#{rank}</span>}
            {title}
          </p>
          <span className="text-faint">♡</span>
        </div>
        <p className="truncate text-[12px] text-muted">{company}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {tier && <Chip tone={tier === 'Top Job' ? 'rose' : tier === 'Distinction' ? 'amber' : 'blue'}>Tin ưu tiên · {tier}</Chip>}
          <Chip tone="green">{salary}</Chip>
          <Chip>{location}</Chip>
          <Chip>Full-time</Chip>
        </div>
      </div>
    </div>
  )
}

export function SectionTitle({ children, more }: { children: React.ReactNode; more?: boolean }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <p className="text-[14px] font-bold text-ink">{children}</p>
      {more && <span className="text-[11.5px] text-brand">View all →</span>}
    </div>
  )
}
