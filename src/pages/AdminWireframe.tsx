import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  FileImage,
  Bell,
  CreditCard,
  Handshake,
  BarChart3,
  Settings,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { SPECS } from '@/data'
import { STATUS_META } from '@/lib/status'
import { cn } from '@/lib/utils'
import { ADMIN_PROTOTYPES, AdminPipeline } from './adminPrototypes'
import { ActivityLogButton } from './adminActivityLog'
import { MonetizationFlow } from '@/components/MonetizationFlow'
import { ActivationFlow } from '@/components/ActivationFlow'

interface NavItem {
  label: string
  specId?: string
}
interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

/** Proposed HQ Admin console navigation (grouped by domain, mirrors modules B1–B9). */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Recruitment',
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      { label: 'Jobs', specId: 'admin-job-list' },
      { label: 'Applicants', specId: 'admin-job-applicants' },
      { label: 'Resumes / candidates', specId: 'admin-resumes' },
    ],
  },
  {
    label: 'Companies',
    icon: <Building2 className="h-4 w-4" />,
    items: [
      { label: 'Company list', specId: 'admin-company-list' },
    ],
  },
  {
    label: 'Content',
    icon: <FileImage className="h-4 w-4" />,
    items: [
      { label: 'Banners', specId: 'admin-banners' },
      { label: 'Popups', specId: 'admin-popups' },
      { label: 'Pages', specId: 'admin-pages' },
      { label: 'Boards', specId: 'admin-boards' },
      { label: 'Blog / articles', specId: 'admin-blog' },
    ],
  },
  {
    label: 'Billing & products',
    icon: <CreditCard className="h-4 w-4" />,
    items: [
      { label: 'Catalog', specId: 'admin-catalog' },
      { label: 'Bundles', specId: 'admin-bundles' },
      { label: 'Credits', specId: 'admin-credits' },
      { label: 'Orders', specId: 'admin-orders' },
      { label: 'Promotions', specId: 'admin-promotions' },
    ],
  },
  {
    label: 'CRM',
    icon: <Handshake className="h-4 w-4" />,
    items: [
      { label: 'Sign-ups', specId: 'admin-signups' },
      { label: 'Pipeline', specId: 'admin-sales-pipeline' },
      { label: 'Quotes', specId: 'admin-quotes' },
      { label: 'Invoices', specId: 'admin-invoices' },
      { label: 'Purchase orders', specId: 'admin-purchase-orders' },
      { label: 'Payments', specId: 'admin-payments' },
      { label: 'Contracts', specId: 'admin-contracts' },
    ],
  },
  {
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    items: [
      { label: 'Dashboard', specId: 'admin-analytics-dashboard' },
      { label: 'Sales report', specId: 'admin-sales-report' },
      { label: 'Recruit report', specId: 'admin-recruit-report' },
      { label: 'Revenue report', specId: 'admin-revenue-report' },
      { label: 'User behavior', specId: 'admin-user-behavior' },
    ],
  },
  {
    label: 'System',
    icon: <Settings className="h-4 w-4" />,
    items: [
      { label: 'Users', specId: 'admin-users' },
      { label: 'Roles & permissions', specId: 'admin-roles' },
      { label: 'Master data', specId: 'admin-master-data' },
      { label: 'Job categories & roles', specId: 'admin-job-categories' },
      { label: 'Audit log', specId: 'admin-audit-log' },
      { label: 'Environment', specId: 'admin-environment' },
      { label: 'Departments', specId: 'admin-departments' },
    ],
  },
]

export function AdminWireframe() {
  const [walkthrough, setWalkthrough] = useState<null | 'activation' | 'flow'>(null)
  const [active, setActive] = useState<{ group: string; item: NavItem }>({
    group: 'Recruitment',
    item: NAV_GROUPS[0].items[0],
  })
  const select = (group: string, item: NavItem) => {
    setWalkthrough(null)
    setActive({ group, item })
  }

  const spec = active.item.specId ? SPECS[active.item.specId] : undefined
  const Proto = active.item.specId ? ADMIN_PROTOTYPES[active.item.specId] : undefined

  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">HQ Admin — navigation & shell</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/75 max-w-[72ch]">
          A proposed layout for the internal admin console: a domain-grouped left sidebar (mapped to modules B1–B9),
          a top bar with global search + language + account, and a standard list/detail content area. Click any nav
          item to preview its page and jump to the spec. Status dots double as a live build-status map.
        </p>
      </div>

      {/* ── Wireframe frame ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-line bg-canvas/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
            <span className="text-[13px] font-semibold">Saramin · HQ Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-md border border-line bg-surface text-[11px] font-medium overflow-hidden">
              <span className="px-2 py-1 bg-brand text-white">VI</span>
              <span className="px-2 py-1 text-muted">EN</span>
              <span className="px-2 py-1 text-muted">KO</span>
            </div>
            <span className="relative grid h-7 w-7 place-items-center rounded-md border border-line text-muted">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand to-violet-500" />
          </div>
        </div>

        {/* Body: sidebar + content */}
        <div className="grid grid-cols-1 md:grid-cols-[236px_minmax(0,1fr)]">
          {/* Sidebar */}
          <nav className="border-r border-line bg-canvas/30 py-2 max-h-[640px] overflow-y-auto scroll-thin">
            <SidebarItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              active={active.item.label === 'Dashboard' && active.group === 'Overview'}
              onClick={() => select('Overview', { label: 'Dashboard', specId: 'admin-analytics-dashboard' })}
              single
            />
            {NAV_GROUPS.map((g) => (
              <SidebarGroup
                key={g.label}
                group={g}
                activeItem={active.group === g.label ? active.item.label : null}
                onSelect={(item) => select(g.label, item)}
              />
            ))}
          </nav>

          {/* Content preview */}
          <div className="min-w-0 bg-surface">
            <div className="flex items-center gap-2 border-b border-line-soft px-5 py-3 text-[11.5px] text-muted">
              <span>{active.group}</span>
              <span className="text-faint">/</span>
              <span className="text-ink font-medium">{active.item.label}</span>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[17px] font-semibold">{active.item.label}</h3>
                  {spec && (
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium', STATUS_META[spec.status].pill)}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[spec.status].dot)} />
                        {STATUS_META[spec.status].label}
                      </span>
                      <Link to={`/f/${spec.id}`} className="inline-flex items-center gap-1 text-[11.5px] text-brand hover:underline">
                        View full spec <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
                <ActivityLogButton page={active.item.label} />
              </div>

              {/* interactive walkthrough launched contextually from a page, else the page itself */}
              {walkthrough ? (
                <div>
                  <button
                    onClick={() => setWalkthrough(null)}
                    className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40"
                  >
                    ← Back to {active.item.label}
                  </button>
                  {walkthrough === 'activation' ? <ActivationFlow initialPhase={2} /> : <MonetizationFlow />}
                </div>
              ) : active.item.specId === 'admin-sales-pipeline' ? (
                <AdminPipeline onActivate={() => setWalkthrough('activation')} />
              ) : Proto ? (
                <>
                  {active.item.specId === 'admin-orders' && (
                    <button
                      onClick={() => setWalkthrough('flow')}
                      className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand hover:bg-brand hover:text-white"
                    >
                      ▶ Interactive: how an order becomes quota
                    </button>
                  )}
                  <Proto />
                </>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <span>Name</span>
                      <span>Owner</span>
                      <span>Updated</span>
                      <span>Status</span>
                    </div>
                    {[0, 1, 2, 3, 4].map((r) => (
                      <div key={r} className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] items-center border-t border-line-soft px-4 py-3">
                        <span className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-canvas" />
                          <span className="h-3 rounded bg-line" style={{ width: `${60 - r * 6}%` }} />
                        </span>
                        <span className="h-3 w-16 rounded bg-line-soft" />
                        <span className="h-3 w-14 rounded bg-line-soft" />
                        <span className="h-4 w-14 rounded-full bg-canvas" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-faint">
                    Placeholder list — this page’s prototype isn’t built yet. Every module lands on a list → detail pattern with New / Filter / search.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rationale */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <RationaleCard title="Why grouped this way">
          Eight domain groups map 1:1 to admin modules B1–B9. Recruitment (Jobs · Applicants · Resumes) is
          lifted to the top because it is the daily-use core; System settings sinks to the bottom.
        </RationaleCard>
        <RationaleCard title="Shell conventions">
          Persistent top bar (global search, VI/EN/KO switch, notifications, account). Every module is a
          list → detail → create flow with a consistent New / Filter / search toolbar.
        </RationaleCard>
        <RationaleCard title="Permission-aware">
          Groups and items are gated by the role’s resource:action grants — a user only sees what their
          role allows. Needs the role matrix signed off (see System → Roles).
        </RationaleCard>
        <RationaleCard title="Status as a map">
          The dot on each nav item is its real build status, so this doubles as an at-a-glance readiness
          view: green = on the real backend, violet = prototype DB, red = empty seam.
        </RationaleCard>
        <RationaleCard title="Audit logging (3 layers)">
          Everything is logged — who (user or System) changed what, when, before → after. Three scopes,
          no overlap: <b>System → Audit log</b> = the whole firehose; the per-page <b>History</b> button = recent
          activity in that section; a record's <b>Activity</b> tab (in its detail drawer) = that one record's trail.
          PII-view actions (e.g. opening a resume) are always recorded.
        </RationaleCard>
      </div>
    </div>
  )
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  single,
}: {
  icon?: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  single?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition-colors',
        single ? 'font-medium' : '',
        active ? 'bg-brand-soft text-brand font-medium' : 'text-ink/80 hover:bg-canvas/70',
      )}
    >
      {icon && <span className={cn(active ? 'text-brand' : 'text-faint')}>{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  )
}

function SidebarGroup({
  group,
  activeItem,
  onSelect,
}: {
  group: NavGroup
  activeItem: string | null
  onSelect: (item: NavItem) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] font-medium text-ink/80 hover:bg-canvas/70"
      >
        <span className="text-faint">{group.icon}</span>
        <span className="truncate">{group.label}</span>
        <ChevronDown className={cn('ml-auto h-3.5 w-3.5 text-faint transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <ul>
          {group.items.map((it) => {
            const isActive = activeItem === it.label
            return (
              <li key={it.label}>
                <button
                  onClick={() => onSelect(it)}
                  className={cn(
                    'flex w-full items-center gap-2 py-1.5 pl-9 pr-3 text-left text-[12px] transition-colors',
                    isActive ? 'bg-brand-soft text-brand font-medium' : 'text-ink/70 hover:bg-canvas/70',
                  )}
                >
                  <span className="truncate">{it.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function RationaleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-[12.5px] font-semibold mb-1">{title}</p>
      <p className="text-[12.5px] leading-relaxed text-ink/70">{children}</p>
    </div>
  )
}
