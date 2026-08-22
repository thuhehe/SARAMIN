import { Suspense, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Package,
  Users,
  FileImage,
  Handshake,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { BUILD_MODULES } from '@/data/buildModules'
import type { Site } from '@/data/buildModules'
import { featurePath } from '@/data/featureSlug'
import { cn } from '@/lib/utils'
import { ADMIN_PROTOTYPES, AdminPipeline, NewProductModal, NewPackageModal, NewQuotationModal, GlobalCompanySearch, DetailCrumbCtx, ScreenNavCtx, OpenRecordCtx, CreateSignalCtx } from './adminPrototypes'
import type { DetailCrumb } from './adminPrototypes'
import { ActivityLogButton } from './adminActivityLog'
import { MonetizationFlow } from '@/components/MonetizationFlow'
import { ActivationFlow } from '@/components/ActivationFlow'
import { CopyLinkButton, useScreenParam } from '@/components/ShareLink'

interface NavItem {
  label: string
  specId?: string
}

/* ── "View full spec" target ──────────────────────────────────────────────────
   The button used to link to /f/:id (the LEGACY FeatureSpec route), which is not
   where the authored spec lives any more — that is BUILD_MODULES at
   /m/:moduleId/:slug. Map each admin page to its build feature by NAME +
   SITE (never by index, which shifts whenever a feature is added or reordered).
   A page with no authored feature yet simply shows no button. */
const SPEC_TARGET: Record<string, { module: string; feature: string; site?: Site }> = {
  // Recruitment
  'admin-job-list': { module: 'job-management', feature: 'Job list', site: 'Admin' },
  'admin-job-applicants': { module: 'application-management', feature: 'Application list', site: 'Admin' },
  'admin-resumes': { module: 'resume-management', feature: 'Resume list', site: 'Admin' },
  'admin-cv-check': { module: 'resume-management', feature: 'CV qualification — apply & CV search' },
  'admin-resume-new': { module: 'resume-management', feature: 'Create resume', site: 'Admin' },
  // Jobseekers
  'admin-jobseekers': { module: 'jobseeker-user', feature: 'User management' },
  // Content
  'admin-image-gallery': { module: 'banners-popups', feature: 'Image gallery' },
  'admin-banners': { module: 'banners-popups', feature: 'Create banner + Banner list' },
  // Billing & products
  'admin-catalog': { module: 'products-packages', feature: 'Products management' },
  'admin-bundles': { module: 'products-packages', feature: 'Packages management' },
  'admin-placements': { module: 'products-packages', feature: 'Placements registry' },
  'admin-promotions': { module: 'products-packages', feature: 'Discount programmes' },
  // Service — the CV-search product after it is sold. Lives with Products &
  // Packages because the row is a package, not a search.
  'admin-cv-search-usage': { module: 'products-packages', feature: 'CV search usage' },
  // NOTE: still no targets for 'admin-credits' / 'admin-orders'.
  // Discounting happens on the quotation line (one place a price can be cut), orders
  // are CRM → Purchase order, and the credit balance is the entitlement ledger on the
  // company account.
  // CRM
  'admin-company-list': { module: 'crm', feature: 'Companies' },
  'admin-company-pipeline': { module: 'crm', feature: 'Sales pipeline' },
  'admin-signups': { module: 'crm', feature: 'Sign-ups' },
  // Both pool screens are specified as ONE feature — the claim flow is the spec, and
  // the queue is the second half of it. They sit on the System nav but belong to CRM.
  'admin-company-directory': { module: 'crm', feature: 'Danh bạ doanh nghiệp (free company data)' },
  'admin-claim-queue': { module: 'crm', feature: 'Danh bạ doanh nghiệp (free company data)' },
  'admin-quotes': { module: 'crm', feature: 'Quotations' },
  'admin-purchase-orders': { module: 'crm', feature: 'Purchase order' },
  'admin-invoices': { module: 'crm', feature: 'Invoice (VAT e-invoice)' },
  // NOTE: 'admin-company-users' has no target on purpose — the Account management
  // module was trimmed out of the build plan (buildModules.ts), so there is no
  // authored feature page to link to. Re-add it there to make this page linkable.
  // System
  'admin-staff': { module: 'admin-access', feature: 'Staff directory', site: 'Admin' },
  'admin-roles': { module: 'admin-access', feature: 'Roles & permissions' },
  'admin-users': { module: 'admin-access', feature: 'Operators (users)' },
  'admin-issuer': { module: 'admin-system', feature: 'Company information' },
  // Configuration page → System module, like every other System nav item. The tier it
  // configures is displayed by CRM → Companies, which cross-references back to here.
  'admin-membership': { module: 'admin-system', feature: 'Membership tiers' },
  'admin-master-data': { module: 'admin-system', feature: 'Master data' },
  // Both point at the Resume-management feature that specifies them — the weights
  // and the log belong to the matching logic, not to the admin shell.
  'admin-matching-settings': { module: 'resume-management', feature: 'Job recommendations — the jobseeker feed' },
  'admin-matching-report': { module: 'resume-management', feature: 'Job recommendations — the jobseeker feed' },
  'admin-audit-log': { module: 'admin-system', feature: 'Audit log' },
  'admin-environment': { module: 'admin-system', feature: 'Environment' },
  'admin-departments': { module: 'admin-system', feature: 'Departments' },
}

/* ── Sidebar state, remembered per reader ────────────────────────────────────
   Collapsing is a preference, not a per-visit decision: someone who works in the
   wide CRM tables collapses once and expects it to stay that way. Both bits live
   in localStorage and fail silently where it isn't available. */
const LS_COLLAPSED = 'admin-nav-collapsed'
const LS_OPEN_GROUPS = 'admin-nav-open-groups'

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / storage disabled — the preference just doesn't persist */
  }
}

/** True while the viewport is wide enough for the labelled sidebar to earn its width. */
function useWideViewport() {
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 768px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setWide(mq.matches)
    /* Re-read on mount as well: a page first laid out at zero width (an embedded
       frame, a hidden pane, a restored background tab) mounts as "narrow", and the
       media query then never fires a change event — the sidebar would stay stuck as
       a rail on a full-width screen. */
    onChange()
    mq.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])
  return wide
}

/** Resolve an admin page to its authored spec page, or null if none exists yet. */
function specPath(specId?: string): string | null {
  if (!specId) return null
  const t = SPEC_TARGET[specId]
  if (!t) return null
  const m = BUILD_MODULES.find((x) => x.id === t.module)
  if (!m) return null
  const f = m.features.find((x) => x.name === t.feature && (!t.site || x.site === t.site))
  return f ? featurePath(m, f) : null
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
      // Does a higher match score actually produce applications? The only screen
      // that can answer it, and the reason the recommendation log exists.
      { label: 'Matching report', specId: 'admin-matching-report' },
    ],
  },
  {
    label: 'Recruitment',
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      { label: 'Jobs', specId: 'admin-job-list' },
      { label: 'Applicants', specId: 'admin-job-applicants' },
      { label: 'Talent pool', specId: 'admin-resumes' },
      { label: 'CV review', specId: 'admin-cv-check' },
    ],
  },
  {
    // "Content" covered two unrelated jobs: delivering what customers BOUGHT, and
    // editing the site's own copy. This group is now only the first — every item is
    // a service someone paid for. Pages moved to System, where site config lives.
    label: 'Service',
    icon: <FileImage className="h-4 w-4" />,
    items: [
      // CV search leads the group — it is the service HQ watches most closely,
      // being the one customers buy and then quietly fail to use.
      { label: 'Tìm kiếm CV', specId: 'admin-cv-search-usage' },
      // One page with a Banners / Popups switcher — both are Display placement
      // products on the same lifecycle, so they are not two console pages.
      { label: 'Displays', specId: 'admin-banners' },
      // ONE page for all manual services: five products across a hundred companies
      // is one list at the grain of (company × service), not five queues.
      { label: 'Manual services', specId: 'admin-manual-services' },
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
      // Sits directly under PO because it is the step that follows it: the VAT
      // e-invoice is issued from a PO once Accounting has confirmed the payment.
      { label: 'Invoice', specId: 'admin-invoices' },
      // Last in the group: inbound self-registrations are a triage inbox that
      // feeds the pipeline, not a step in the document flow above it.
      { label: 'Sign-ups', specId: 'admin-signups' },
      // What every customer has actually consumed, across all four product types —
      // the screen sales opens before a renewal call.
      { label: 'Account usage', specId: 'admin-account-usage' },
    ],
  },
  {
    // The catalogue, in one module: what is sellable, what it is bundled into, and
    // where it surfaces on the site. Split across System before, but the three are
    // one job — you cannot define a placement product without the placement list.
    label: 'Products',
    icon: <Package className="h-4 w-4" />,
    items: [
      // What is sellable and at what price.
      { label: 'Products', specId: 'admin-catalog' },
      // Several products at one package price, defined once and quoted many times
      // (the client's Gói Ultimate). NOT the per-segment price groups — those are a
      // price list on the tier product.
      { label: 'Packages', specId: 'admin-bundles' },
      // The display areas on the jobseeker site (sizes, caps, how each is filled).
      // A placement product points at a row here instead of restating
      // "1536×371, max 6, rotate 3s" on every sale.
      { label: 'Placements', specId: 'admin-placements' },
      // The stock pictures those placements' image slots are filled from. It sits
      // beside Placements rather than under Service because it is configuration a
      // placement reads, not something a customer bought.
      { label: 'Image gallery', specId: 'admin-image-gallery' },
      // The discount programmes the quotation builder applies by itself, keyed on
      // the customer's status. Settings, not coupon codes — nobody types one.
      { label: 'Discount programmes', specId: 'admin-promotions' },
    ],
  },
  {
    // Identity & access — its own group, split out of System because it is a
    // feature in its own right (see the Roles & permissions build module).
    label: 'Roles & access',
    icon: <Users className="h-4 w-4" />,
    items: [
      // People first: the staff directory is the source Users & CRM ownership pick from.
      { label: 'Staff directory', specId: 'admin-staff' },
      { label: 'Users', specId: 'admin-users' },
      { label: 'Roles & permissions', specId: 'admin-roles' },
    ],
  },
  {
    label: 'System',
    icon: <Settings className="h-4 w-4" />,
    items: [
      // The issuer identity that prints on every quotation / order / invoice.
      { label: 'Company information', specId: 'admin-issuer' },
      // Loyalty programme: the tier thresholds + reward catalogue the CRM reads.
      // Here rather than under CRM for the same reason as Products — it is HQ-only
      // configuration that changes how another module behaves.
      { label: 'Membership tiers', specId: 'admin-membership' },
      // Static site copy — configuration, not a sold service.
      { label: 'Pages', specId: 'admin-pages' },
      { label: 'Master data', specId: 'admin-master-data' },
      // The 8 score weights + the salary exchange rate. HQ-only configuration that
      // changes how another module behaves — same reason Products sits here.
      { label: 'Matching settings', specId: 'admin-matching-settings' },
      // The free company pool. Under System, NOT under CRM: these are not customers
      // and not owned by anyone — a reference dataset a rep can request FROM. Putting
      // it in CRM would put unowned, unverified rows inside every CRM count.
      { label: 'Danh bạ doanh nghiệp', specId: 'admin-company-directory' },
      { label: 'Yêu cầu nhận công ty', specId: 'admin-claim-queue' },
      // The taxonomy's maintenance queue, and the answer to "who keeps the skill
      // list from rotting". Fed from BOTH sides — employer searches that matched
      // nothing and CV imports that resolved nothing — because one alias fixes both.
      { label: 'Chất lượng tìm kiếm', specId: 'admin-unresolved-terms' },
      { label: 'Audit log', specId: 'admin-audit-log' },
      { label: 'Environment', specId: 'admin-environment' },
      { label: 'Departments', specId: 'admin-departments' },
    ],
  },
]

/* The console's nav is where an admin screen is NAMED, so it is also the source
   for any other surface that needs to show a screen's name — the spec pages'
   Screen-UI tabs, for one. Without this they fall back to the raw id, and
   "admin-cv-check" is a slug, not a name. */
export const ADMIN_SCREEN_LABELS: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((it) => [it.specId, it.label] as const)),
)


/* Primary create action per page, rendered on the page title row — the
   conventional spot for it, so the page's main verb is visible before the
   reader gets past the explainer copy. Pages absent from this map have no
   single create action (reports, logs, boards). */
const PRIMARY_ACTION: Record<string, string> = {
  'admin-catalog': '+ New product',
  'admin-company-list': '+ New company',
  'admin-bundles': '+ New package',
  'admin-quotes': '+ New quotation',
}

/* Shown while a screen's chunk is in flight. Deliberately quiet and the height of
   a list page, so arriving at a screen doesn't jump the layout. */
function ScreenLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <p className="text-[12px] text-faint">Loading…</p>
    </div>
  )
}

export function AdminWireframe() {
  const [walkthrough, setWalkthrough] = useState<null | 'activation' | 'flow'>(null)
  /** specId whose create modal is open — the title-row button opens it. */
  const [creating, setCreating] = useState<string | null>(null)
  /** the crumb a detail view publishes while it is open (see useDetailCrumb) */
  const [detail, setDetail] = useState<DetailCrumb | null>(null)
  /** Landing page: `?screen=<specId>` when a spec page linked here (so the feature
      spec never has to carry its own copy of the screen), else the default. Looked
      up by label so nav reordering can't desync it. */
  const [searchParams] = useSearchParams()
  const wanted = searchParams.get('screen')
  const [active, setActive] = useState<{ group: string; item: NavItem }>(() => {
    if (wanted) {
      for (const g of NAV_GROUPS) {
        const item = g.items.find((x) => x.specId === wanted)
        if (item) return { group: g.label, item }
      }
    }
    const g = NAV_GROUPS.find((x) => x.label === 'Recruitment') ?? NAV_GROUPS[0]
    return { group: g.label, item: g.items[0] }
  })
  /* Bumped on every nav click. Used as the page's key so re-clicking the ALREADY
     ACTIVE item remounts it: without this the shell clears the breadcrumb but the
     page keeps its own detail state, and the crumb then describes a list while the
     content still shows a record. */
  const [navSeq, setNavSeq] = useState(0)
  /* Bumped by the title-row create button. Pages whose create REPLACES the list
     (company, job) listen for it; pages with a modal are handled below. */
  const [createSeq, setCreateSeq] = useState(0)
  const select = (group: string, item: NavItem) => {
    setWalkthrough(null)
    setDetail(null)
    setOpenRecord(null)
    setNavSeq((n) => n + 1)
    setActive({ group, item })
  }

  /* A record linked from another page: switch to the page that OWNS the record and
     hand it the id to open, so the breadcrumb names the right module and Back
     returns to the right list. */
  const [openRecord, setOpenRecord] = useState<string | null>(null)
  const goToScreen = (specId: string, record?: string) => {
    for (const g of NAV_GROUPS) {
      const item = g.items.find((x) => x.specId === specId)
      if (!item) continue
      setWalkthrough(null)
      setDetail(null)
      setNavSeq((n) => n + 1)
      setActive({ group: g.label, item })
      setOpenRecord(record ?? null)
      return
    }
  }

  /* Sidebar chrome: collapsed to an icon rail, and which groups are unfolded.
     Below md the labelled panel has nowhere to go, so the rail is forced on. */
  const [collapsed, setCollapsed] = useState(() => readStored(LS_COLLAPSED, false))
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    readStored(LS_OPEN_GROUPS, Object.fromEntries(NAV_GROUPS.map((g) => [g.label, true]))),
  )
  const wide = useWideViewport()
  const railOnly = collapsed || !wide

  /* Keep the address bar pointing at the page on show, so it can be shared. */
  useScreenParam(active.item.specId)
  useEffect(() => writeStored(LS_COLLAPSED, collapsed), [collapsed])
  useEffect(() => writeStored(LS_OPEN_GROUPS, openGroups), [openGroups])

  /* "[" toggles the sidebar — the shortcut every console with a collapsible nav
     uses. Ignored while the reader is typing, so it can't eat a keystroke. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      setCollapsed((c) => !c)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const specHref = specPath(active.item.specId)
  const Proto = active.item.specId ? ADMIN_PROTOTYPES[active.item.specId] : undefined

  return (
    <div className="pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">HQ Admin — navigation & shell</h1>
      </div>

      {/* ── Wireframe frame ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        {/* ── Row 1: the console's ONLY bar ───────────────────────────────
            The brand block sits at the sidebar's width so the top-left corner
            reads as one piece with the nav under it, and the breadcrumb lives
            IN this bar rather than in a second row below it. */}
        <div className="flex h-[52px] shrink-0 border-b border-line">
          <div
            className={cn(
              'flex shrink-0 items-center gap-2.5 overflow-hidden border-r border-line transition-[width] duration-150',
              railOnly ? 'w-14 justify-center px-0' : 'w-[236px] pl-3 pr-1.5',
            )}
          >
            {railOnly ? (
              /* Collapsed: the logo IS the way back out — hovering it turns into the
                 expand arrow. Below md there is nothing to expand into, so it stays
                 a plain mark. */
              wide ? (
                <button
                  onClick={() => setCollapsed(false)}
                  title="Expand sidebar  ["
                  aria-label="Expand sidebar"
                  className="group grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-canvas"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-[12px] font-bold text-white group-hover:hidden">S</span>
                  <ChevronRight className="hidden h-4 w-4 text-ink group-hover:block" />
                </button>
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-[12px] font-bold text-white">S</span>
              )
            ) : (
              <>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-[12px] font-bold text-white">S</span>
                <span className="min-w-0 truncate text-[13px] font-semibold">Saramin · HQ Admin</span>
                {/* Collapse lives on the sidebar's own header, pointing at the thing
                    it moves — not out in the page bar. */}
                <button
                  onClick={() => setCollapsed(true)}
                  title="Collapse sidebar  ["
                  aria-label="Collapse sidebar"
                  className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-lg text-faint transition-colors hover:bg-canvas hover:text-ink"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Three columns, not a flex row: the search has to sit in the MIDDLE of
              the bar and stay there. With flex it started wherever the breadcrumb
              ended, so it slid left and right as you moved between pages. The two
              1fr columns split the slack evenly, which centres the auto column
              between them without absolute positioning — so it can never overlap
              the breadcrumb or the right-hand actions. */}
          {/* Three tracks, and the numbers matter:
              · both side tracks are 1fr so they always resolve EQUAL — that, not
                absolute positioning, is what puts the middle track dead centre;
              · they carry a 150px MINIMUM so the right-hand actions (History ·
                View full spec · avatar) can never be squeezed under the search;
              · the centre is minmax(0,420px), so when the bar gets tight the SEARCH
                gives up width rather than the breadcrumb or the actions.
              A bare `1fr` would be minmax(auto,1fr): the wider right column would
              then outgrow its share and shove the search off-centre. */}
          {/* Three tracks so the search sits optically centred rather than wherever the
              breadcrumb happens to end. The right track is `auto`: its contents are
              fixed-width chrome that cannot shrink, and a 1fr track narrower than
              them made the block overflow leftwards under the search box. */}
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(160px,1fr)_minmax(0,420px)_auto] items-center">
            <div className="flex min-w-0 items-center gap-2.5 px-3">
              {/* Breadcrumb. On a detail view the page segment becomes the way BACK,
                  and the record itself is the last crumb — so no page needs its own
                  "← Back to X" button. */}
              <div className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted">
                {/* the group segment is the first thing to go when the bar is tight —
                    the page (and the record on a detail view) matter more */}
                <span className="hidden shrink-0 lg:inline">{active.group}</span>
                <span className="hidden shrink-0 text-faint lg:inline">/</span>
                {detail ? (
                  <button onClick={detail.onBack} className="shrink-0 text-brand hover:underline">{active.item.label}</button>
                ) : (
                  <span className="truncate font-medium text-ink">{active.item.label}</span>
                )}
                {detail && (
                  <>
                    <span className="shrink-0 text-faint">/</span>
                    <span className="truncate font-medium text-ink">{detail.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* One search for the whole console, in the chrome rather than on a page:
                "does this company exist, and where is it?" is a question a rep asks
                from wherever they are, and the answer has to be reachable without
                first navigating to Companies. Centre column, fixed width — a search
                box that changes width as the breadcrumb grows is a moving target. */}
            <div className="hidden w-full min-w-0 md:flex">
              <GlobalCompanySearch onOpen={goToScreen} />
            </div>

            <div className="flex h-full items-center justify-self-end">
              <div className="flex h-full items-center gap-2 px-3">
                <ActivityLogButton page={active.item.label} />
                {specHref && (
                  <Link to={specHref} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-brand transition-colors hover:border-ink/30 hover:underline">
                    <span className="hidden lg:inline">View full spec</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <div className="flex h-full items-center gap-2 px-3">
                {/* No language control: the Admin console is English-only, so a
                    switcher would offer exactly one choice. See SH-I18N-01. */}
                {/* No notification bell: nothing in this console pushes an alert a
                    reader can act on, so a permanently-dotted bell only promises
                    something that never arrives. */}
                <span className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-brand to-violet-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex">
          <AdminSidebar
            collapsed={railOnly}
            activeGroup={active.group}
            activeItem={active.item.label}
            openGroups={openGroups}
            onToggleGroup={(label) => setOpenGroups((o) => ({ ...o, [label]: !(o[label] ?? true) }))}
            onSetAllGroups={(open) =>
              setOpenGroups(Object.fromEntries(NAV_GROUPS.map((g) => [g.label, open])))
            }
            onExpandSidebar={(label) => {
              setCollapsed(false)
              setOpenGroups((o) => ({ ...o, [label]: true }))
            }}
            onSelect={(group, item) => select(group, item)}
          />

          {/* Content preview */}
          <div className="min-w-0 flex-1 bg-surface">
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold">{active.item.label}</h3>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Every page is addressable, so a reviewer can point at THIS
                      screen instead of describing how to click to it. */}
                  <CopyLinkButton />
                  {/* Create belongs to the LIST. On a detail view (detail is set) the
                      page's verb is whatever that record allows, not "new". */}
                  {!walkthrough && !detail && active.item.specId && PRIMARY_ACTION[active.item.specId] && (
                    <button
                      onClick={() => { setCreating(active.item.specId!); setCreateSeq((n) => n + 1) }}
                      className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
                    >
                      {PRIMARY_ACTION[active.item.specId]}
                    </button>
                  )}
                </div>
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
                <ScreenNavCtx.Provider value={goToScreen}>
                  <OpenRecordCtx.Provider value={openRecord}>
                    <DetailCrumbCtx.Provider value={setDetail}>
                      <AdminPipeline onActivate={() => setWalkthrough('activation')} />
                    </DetailCrumbCtx.Provider>
                  </OpenRecordCtx.Provider>
                </ScreenNavCtx.Provider>
              ) : Proto ? (
                <ScreenNavCtx.Provider value={goToScreen}>
                  <OpenRecordCtx.Provider value={openRecord}>
                    <DetailCrumbCtx.Provider value={setDetail}>
                      <CreateSignalCtx.Provider value={createSeq}>
                        <Suspense fallback={<ScreenLoading />}>
                          <Proto key={`${active.item.specId}-${navSeq}`} />
                        </Suspense>
                      </CreateSignalCtx.Provider>
                    </DetailCrumbCtx.Provider>
                  </OpenRecordCtx.Provider>
                </ScreenNavCtx.Provider>
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
          {creating === 'admin-bundles' && <NewPackageModal onClose={() => setCreating(null)} />}
          {creating === 'admin-quotes' && <NewQuotationModal onClose={() => setCreating(null)} />}
        </div>
      </div>

      {/* Rationale */}
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────────────────
   Two widths, one nav. Expanded (236px) it is the familiar grouped tree, each
   group foldable. Collapsed (56px) it is a rail of the six group icons, and the
   labels come back on demand: HOVER an icon for a flyout of that group's pages
   (jump without leaving the collapsed state), CLICK it to expand the sidebar on
   that group. So collapsing never costs the reader access to a page — only the
   labels being permanently on screen. */
function AdminSidebar({
  collapsed,
  activeGroup,
  activeItem,
  openGroups,
  onToggleGroup,
  onSetAllGroups,
  onExpandSidebar,
  onSelect,
}: {
  collapsed: boolean
  activeGroup: string
  activeItem: string
  openGroups: Record<string, boolean>
  onToggleGroup: (label: string) => void
  onSetAllGroups: (open: boolean) => void
  onExpandSidebar: (label: string) => void
  onSelect: (group: string, item: NavItem) => void
}) {
  /* group whose flyout is showing, and where to pin it (the icon's offset) */
  const [fly, setFly] = useState<{ label: string; top: number } | null>(null)
  const flyGroup = fly && NAV_GROUPS.find((g) => g.label === fly.label)
  const allOpen = NAV_GROUPS.every((g) => openGroups[g.label] ?? true)

  return (
    <aside
      onMouseLeave={() => setFly(null)}
      className={cn(
        'relative flex shrink-0 border-r border-line bg-canvas/30 transition-[width] duration-150',
        collapsed ? 'w-14' : 'w-[236px]',
      )}
    >
      {collapsed ? (
        <nav className="flex max-h-[640px] w-full flex-col items-center gap-1 overflow-y-auto scroll-thin py-2">
          {NAV_GROUPS.map((g) => (
            <button
              key={g.label}
              title={g.label}
              aria-label={g.label}
              onMouseEnter={(e) => setFly({ label: g.label, top: e.currentTarget.offsetTop })}
              onClick={() => onExpandSidebar(g.label)}
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
                activeGroup === g.label ? 'bg-brand-soft text-brand' : 'text-faint hover:bg-canvas hover:text-ink',
              )}
            >
              {g.icon}
            </button>
          ))}
        </nav>
      ) : (
        <nav className="max-h-[640px] w-full overflow-y-auto scroll-thin px-2 py-2.5">
          {NAV_GROUPS.map((g) => {
            const open = openGroups[g.label] ?? true
            return (
              <div key={g.label}>
                <button
                  onClick={() => onToggleGroup(g.label)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] font-medium text-ink hover:bg-canvas"
                >
                  <span className={cn(activeGroup === g.label ? 'text-brand' : 'text-faint')}>{g.icon}</span>
                  <span className="truncate">{g.label}</span>
                  {/* folded away but holding the current page — the reader still
                      needs to see where they are */}
                  {!open && activeGroup === g.label && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  )}
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-faint transition-transform',
                      !open && activeGroup === g.label ? 'ml-1.5' : 'ml-auto',
                      !open && '-rotate-90',
                    )}
                  />
                </button>
                {open && (
                  <ul>
                    {g.items.map((it) => (
                      <li key={it.label}>
                        <NavPage
                          label={it.label}
                          active={activeGroup === g.label && activeItem === it.label}
                          onClick={() => onSelect(g.label, it)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
          {/* One click between the full tree and a six-line index of the console. */}
          <button
            onClick={() => onSetAllGroups(!allOpen)}
            className="mt-2 w-full border-t border-line-soft px-2 pt-2 text-left text-[11px] text-muted hover:text-brand"
          >
            {allOpen ? 'Collapse all' : 'Expand all'}
          </button>
        </nav>
      )}

      {/* flyout — the collapsed rail's labels, on hover */}
      {collapsed && flyGroup && (
        <div
          style={{ top: fly!.top - 6 }}
          className="absolute left-14 z-30 min-w-[196px] rounded-xl border border-line bg-surface p-1.5 shadow-xl"
        >
          <p className="px-2 pb-1 pt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-faint">
            {flyGroup.label}
          </p>
          <ul>
            {flyGroup.items.map((it) => (
              <li key={it.label}>
                <NavPage
                  label={it.label}
                  active={activeGroup === flyGroup.label && activeItem === it.label}
                  flush
                  onClick={() => {
                    setFly(null)
                    onSelect(flyGroup.label, it)
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

/** One page row — indented under its group in the panel, flush inside a flyout. */
function NavPage({
  label,
  active,
  flush,
  onClick,
}: {
  label: string
  active: boolean
  flush?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-lg py-1.5 pr-2 text-left text-[12px] transition-colors',
        flush ? 'pl-2' : 'pl-8',
        active ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70 hover:bg-canvas',
      )}
    >
      <span className="truncate">{label}</span>
    </button>
  )
}

