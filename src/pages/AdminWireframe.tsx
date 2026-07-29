import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Users,
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
import { cn } from '@/lib/utils'
import { ADMIN_PROTOTYPES, AdminPipeline, NewProductModal } from './adminPrototypes'
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
    label: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    items: [
      { label: 'Dashboard', specId: 'admin-analytics-dashboard' },
      { label: 'Sales report', specId: 'admin-sales-report' },
      { label: 'Recruit report', specId: 'admin-recruit-report' },
      { label: 'Revenue report', specId: 'admin-revenue-report' },
    ],
  },
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
    // Both sides of the marketplace's people accounts in one group: the seekers
    // who apply, and the employer-side logins that hang off a company account.
    label: 'User',
    icon: <Users className="h-4 w-4" />,
    items: [
      { label: 'Jobseeker users', specId: 'admin-jobseekers' },
      { label: 'Company users', specId: 'admin-company-users' },
    ],
  },
  {
    label: 'CRM',
    icon: <Handshake className="h-4 w-4" />,
    // Only the two documents sales itself works as a queue get a global list:
    // Quotation (drives the Proposal stage) and Purchase order (the "won" record
    // + the anchor for the churn clock). Payments, VAT e-invoices and Contracts
    // are per-company paperwork — reached from the company record, not the nav.
    items: [
      { label: 'Companies', specId: 'admin-company-list' },
      { label: 'Pipeline', specId: 'admin-company-pipeline' },
      { label: 'Quotations', specId: 'admin-quotes' },
      { label: 'Purchase order', specId: 'admin-purchase-orders' },
      // Last in the group: inbound self-registrations are a triage inbox that
      // feeds the pipeline, not a step in the document flow above it.
      { label: 'Sign-ups', specId: 'admin-signups' },
    ],
  },
  {
    // Sits below CRM: the catalogue is the reference data the CRM's selling
    // documents draw on, so it reads after the flow that consumes it.
    label: 'Product setting',
    icon: <CreditCard className="h-4 w-4" />,
    // Selling documents (quotation → sales order → payment → invoice) all live in
    // CRM. This group is the catalogue side only: what is sellable and at what price.
    items: [
      { label: 'Products', specId: 'admin-catalog' },
      { label: 'Packages', specId: 'admin-bundles' },
      { label: 'Promotions', specId: 'admin-promotions' },
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
    label: 'System',
    icon: <Settings className="h-4 w-4" />,
    items: [
      { label: 'Users', specId: 'admin-users' },
      { label: 'Roles & permissions', specId: 'admin-roles' },
      { label: 'Master data', specId: 'admin-master-data' },
      { label: 'Audit log', specId: 'admin-audit-log' },
      { label: 'Environment', specId: 'admin-environment' },
      { label: 'Departments', specId: 'admin-departments' },
    ],
  },
]

/* Primary create action per page, rendered on the page title row — the
   conventional spot for it, so the page's main verb is visible before the
   reader gets past the explainer copy. Pages absent from this map have no
   single create action (reports, logs, boards). */
const PRIMARY_ACTION: Record<string, string> = {
  'admin-catalog': '+ New product',
  'admin-quotes': '+ New quotation',
}

export function AdminWireframe() {
  const [walkthrough, setWalkthrough] = useState<null | 'activation' | 'flow'>(null)
  /** specId whose create modal is open — the title-row button opens it. */
  const [creating, setCreating] = useState<string | null>(null)
  /** default landing page — looked up by label so nav reordering can't desync it */
  const [active, setActive] = useState<{ group: string; item: NavItem }>(() => {
    const g = NAV_GROUPS.find((x) => x.label === 'Recruitment') ?? NAV_GROUPS[0]
    return { group: g.label, item: g.items[0] }
  })
  const select = (group: string, item: NavItem) => {
    setWalkthrough(null)
    setActive({ group, item })
  }

  const spec = active.item.specId ? SPECS[active.item.specId] : undefined
  const Proto = active.item.specId ? ADMIN_PROTOTYPES[active.item.specId] : undefined

  return (
    <div className="pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">HQ Admin — navigation & shell</h1>
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
              <div className="ml-auto flex items-center gap-2">
                <ActivityLogButton page={active.item.label} />
                {spec && (
                  <Link to={`/f/${spec.id}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-brand transition-colors hover:border-ink/30 hover:underline">
                    View full spec <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{active.item.label}</h3>
                {!walkthrough && active.item.specId && PRIMARY_ACTION[active.item.specId] && (
                  <button
                    onClick={() => setCreating(active.item.specId!)}
                    className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
                  >
                    {PRIMARY_ACTION[active.item.specId]}
                  </button>
                )}
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
                  {/* Rehomed from the removed Products → Orders page: a paid sales
                      order is what provisions quota, so the walkthrough belongs here. */}
                  {active.item.specId === 'admin-purchase-orders' && (
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

          {creating === 'admin-catalog' && <NewProductModal onClose={() => setCreating(null)} />}
        </div>
      </div>

      {/* Rationale */}
    </div>
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

