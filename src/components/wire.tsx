/* Wireframe primitives — grey-box building blocks for the Mockups gallery. */
import { createContext, useContext } from 'react'
import { cn } from '@/lib/utils'

/** Lets interactive mockups jump between screens when a button is clicked.
 *  Defaults to a no-op, so the same screens render inertly in the static gallery. */
export const NavContext = createContext<(id: string) => void>(() => {})
export function useNav() {
  return useContext(NavContext)
}

/** Header nav items → screen id (only the wired destinations). */
const HEADER_NAV: Record<string, string | undefined> = {
  Jobs: 'js-home',
  'CV & Profile': 'js-profile-cv',
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

export function Chip({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'green' | 'blue' | 'amber' }) {
  const tones = {
    muted: 'bg-canvas text-muted border-line',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
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
      <div className="max-h-[640px] overflow-y-auto scroll-thin">{children}</div>
    </div>
  )
}

/** Jobseeker site top nav (VN recruitment standard). */
export function JsHeader({ active }: { active?: string }) {
  const items = ['Jobs', 'Companies', 'CV & Profile', 'Tools']
  const go = useNav()
  return (
    <div className="flex items-center gap-4 border-b border-line px-5 py-3 bg-surface">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
      <span className="text-[13px] font-bold text-brand">Saramin<span className="text-ink">VN</span></span>
      <nav className="ml-2 hidden md:flex items-center gap-4 text-[12.5px]">
        {items.map((it) => (
          <span
            key={it}
            onClick={() => HEADER_NAV[it] && go(HEADER_NAV[it]!)}
            className={cn(HEADER_NAV[it] && 'cursor-pointer', active === it ? 'font-semibold text-brand' : 'text-ink/70')}
          >
            {it}
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Btn>Sign in</Btn>
        <Btn primary onClick={() => go('js-signup')}>Sign up</Btn>
        <span className="ml-1 hidden sm:inline text-[11px] text-faint">| For employers</span>
      </div>
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
  onClick,
}: {
  title?: string
  company?: string
  salary?: string
  location?: string
  rank?: number
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
