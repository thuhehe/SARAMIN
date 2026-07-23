import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Search, X, Home, Workflow, PanelsTopLeft, ListChecks, Monitor } from 'lucide-react'
import { NAV, SPECS } from '@/data'
import type { NavModule } from '@/data/types'
import { STATUS_META } from '@/lib/status'
import { StatusDot } from './StatusBadge'
import { cn } from '@/lib/utils'

/** modules grouped under their app (L1) heading, in nav order. */
function groupByApp(modules: NavModule[]): { app: string; modules: NavModule[] }[] {
  const out: { app: string; modules: NavModule[] }[] = []
  for (const m of modules) {
    let g = out.find((x) => x.app === m.app)
    if (!g) {
      g = { app: m.app, modules: [] }
      out.push(g)
    }
    g.modules.push(m)
  }
  return out
}

export function Sidebar() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const groups = useMemo(() => groupByApp(NAV), [])
  const q = query.trim().toLowerCase()

  const matches = (label: string, id?: string) => {
    if (!q) return true
    if (label.toLowerCase().includes(q)) return true
    const spec = id ? SPECS[id] : undefined
    return Boolean(
      spec &&
        (spec.summary.toLowerCase().includes(q) ||
          (spec.code ?? '').toLowerCase().includes(q)),
    )
  }

  return (
    <aside className="hidden lg:flex flex-col w-[276px] shrink-0 h-[calc(100vh-24px)] sticky top-3 rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-line-soft shrink-0">
        <Link to="/" className="block">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand">
            Saramin Vietnam
          </p>
          <h2 className="text-[15px] font-semibold leading-tight">Feature Spec</h2>
          <p className="text-[11px] text-muted mt-0.5">Source of truth · living doc</p>
        </Link>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features…"
            className="w-full rounded-lg border border-line bg-canvas/60 pl-8 pr-7 py-1.5 text-xs outline-none focus:border-brand focus:bg-surface"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin py-2">
        <div className="px-2 pb-1">
          <PrimaryLink to="/" icon={<Home className="h-3.5 w-3.5" />} label="Overview" exact />
          <PrimaryLink to="/modules" icon={<Workflow className="h-3.5 w-3.5" />} label="Modules — detail" />
          <PrimaryLink to="/plan" icon={<ListChecks className="h-3.5 w-3.5" />} label="Build plan" />
          <PrimaryLink to="/mockups" icon={<PanelsTopLeft className="h-3.5 w-3.5" />} label="Mockups" />
          <PrimaryLink to="/wireframe/admin" icon={<Monitor className="h-3.5 w-3.5" />} label="Admin wireframe" />
        </div>
        <div className="mx-4 my-1.5 border-t border-line-soft" />
        <p className="px-4 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest text-faint">
          By surface
        </p>
        {groups.map((g) => (
          <div key={g.app} className="mb-1">
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-faint">
              {g.app}
            </p>
            {g.modules.map((m) => (
              <Module key={m.code} module={m} matches={matches} activePath={location.pathname} forceOpen={Boolean(q)} />
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line-soft px-4 py-2.5">
        <Link to="/legend" className="text-[11px] text-muted hover:text-brand">
          Status legend & how to read
        </Link>
      </div>
    </aside>
  )
}

function PrimaryLink({
  to,
  icon,
  label,
  exact,
}: {
  to: string
  icon: React.ReactNode
  label: string
  exact?: boolean
}) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] transition-colors',
        active ? 'bg-brand-soft text-brand font-medium' : 'text-ink/80 hover:bg-canvas/70',
      )}
    >
      <span className={cn(active ? 'text-brand' : 'text-faint')}>{icon}</span>
      {label}
    </Link>
  )
}

function Module({
  module: m,
  matches,
  activePath,
  forceOpen,
}: {
  module: NavModule
  matches: (label: string, id?: string) => boolean
  activePath: string
  forceOpen: boolean
}) {
  const visibleChildren = m.children.filter((c) => matches(c.label, c.id))
  const hasActive = m.children.some((c) => c.id && activePath === `/f/${c.id}`)
  const [open, setOpen] = useState(true)
  const isOpen = forceOpen || open || hasActive

  if (visibleChildren.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-4 py-1.5 text-left hover:bg-canvas/70 group"
      >
        <ChevronRight
          className={cn(
            'h-3 w-3 text-faint transition-transform',
            isOpen && 'rotate-90',
          )}
        />
        <span className="text-[10px] font-mono text-faint w-6">{m.code}</span>
        <span className="text-[12.5px] font-medium text-ink truncate">{m.label}</span>
        <span className="ml-auto text-[10px] text-faint">{m.children.length}</span>
      </button>
      {isOpen && (
        <ul className="pb-1">
          {visibleChildren.map((c) => {
            const to = `/f/${c.id}`
            const active = activePath === to
            const spec = c.id ? SPECS[c.id] : undefined
            return (
              <li key={c.id ?? c.label}>
                <Link
                  to={to}
                  className={cn(
                    'flex items-center gap-2 pl-[42px] pr-3 py-1.5 text-[12.5px] transition-colors',
                    active
                      ? 'bg-brand-soft text-brand font-medium'
                      : 'text-ink/80 hover:bg-canvas/70',
                  )}
                >
                  {spec ? (
                    <StatusDot status={spec.status} />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                  )}
                  <span className="truncate">{c.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { STATUS_META }
