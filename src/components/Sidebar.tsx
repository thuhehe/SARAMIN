import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Search, X, Home, Workflow, PanelsTopLeft, ListChecks, Monitor } from 'lucide-react'
import { BUILD_MODULES, SITE_META } from '@/data/buildModules'
import type { BuildModule } from '@/data/buildModules'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const featureMatches = (m: BuildModule, name: string) => {
    if (!q) return true
    if (m.title.toLowerCase().includes(q)) return true
    return name.toLowerCase().includes(q)
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
          <PrimaryLink to="/modules" icon={<Workflow className="h-3.5 w-3.5" />} label="Modules" />
          <PrimaryLink to="/plan" icon={<ListChecks className="h-3.5 w-3.5" />} label="Build plan" />
          <PrimaryLink to="/mockups" icon={<PanelsTopLeft className="h-3.5 w-3.5" />} label="Mockups" />
          <PrimaryLink to="/wireframe/admin" icon={<Monitor className="h-3.5 w-3.5" />} label="Admin wireframe" />
        </div>
        <div className="mx-4 my-1.5 border-t border-line-soft" />
        <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-faint">
          Modules
        </p>
        {BUILD_MODULES.map((m) => (
          <ModuleRow
            key={m.id}
            module={m}
            featureMatches={featureMatches}
            activePath={location.pathname}
            forceOpen={Boolean(q)}
          />
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

function ModuleRow({
  module: m,
  featureMatches,
  activePath,
  forceOpen,
}: {
  module: BuildModule
  featureMatches: (m: BuildModule, name: string) => boolean
  activePath: string
  forceOpen: boolean
}) {
  // feature indexes (into m.features) that survive the search filter
  const visible = m.features
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => featureMatches(m, f.name))

  const modulePath = `/m/${m.id}`
  const moduleActive = activePath === modulePath
  const hasActiveChild = visible.some(({ i }) => activePath === `/m/${m.id}/${i}`)
  const [open, setOpen] = useState(true)
  const isOpen = forceOpen || open || hasActiveChild || moduleActive

  if (visible.length === 0) return null

  return (
    <div>
      <div
        className={cn(
          'flex w-full items-center gap-1.5 pr-3 hover:bg-canvas/70',
          moduleActive && 'bg-brand-soft',
        )}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          className="py-1.5 pl-4 pr-0.5 text-faint hover:text-ink"
        >
          <ChevronRight className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-90')} />
        </button>
        <Link
          to={modulePath}
          className={cn(
            'flex flex-1 items-center gap-1.5 py-1.5 text-left',
            moduleActive ? 'text-brand' : 'text-ink',
          )}
        >
          <span className="text-[12.5px] font-medium truncate">{m.title}</span>
          <span className="ml-auto text-[10px] text-faint">{m.features.length}</span>
        </Link>
      </div>
      {isOpen && (
        <ul className="pb-1">
          {visible.map(({ f, i }) => {
            const to = `/m/${m.id}/${i}`
            const active = activePath === to
            return (
              <li key={i}>
                <Link
                  to={to}
                  className={cn(
                    'flex items-center gap-2 pl-[38px] pr-3 py-1.5 text-[12px] transition-colors',
                    active ? 'bg-brand-soft text-brand font-medium' : 'text-ink/80 hover:bg-canvas/70',
                  )}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', SITE_META[f.site].dot)} />
                  <span className="font-mono text-[10px] text-faint shrink-0">[{SITE_META[f.site].tag}]</span>
                  <span className="truncate">{f.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
