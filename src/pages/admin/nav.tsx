/*
 * ADMIN CONSOLE NAVIGATION — the single definition of what the HQ Admin console
 * contains: its groups, the screens under each, the screens kept off the nav but
 * still reachable, and each screen's authored-spec target.
 *
 * Extracted from AdminWireframe so it has more than one reader. The console
 * renders it as a sidebar; the screen index (/wireframe/admin/screens) renders
 * it as a directory. Keeping it here stops the two from disagreeing — and stops
 * the index page from pulling the 800-line console shell into its chunk just to
 * learn the group names.
 */
import {
  Briefcase,
  Package,
  Users,
  FileImage,
  Handshake,
  BarChart3,
  Settings,
} from 'lucide-react'
import { BUILD_MODULES } from '@/data/buildModules'
import type { Site } from '@/data/buildModules'
import { featurePath } from '@/data/featureSlug'

export interface NavItem {
  label: string
  specId?: string
  /* WORK WAITING on this page. The point of a badge is that a queue nobody knows
     has work in it is the same as no queue at all — so the count belongs where the
     admin already looks, not inside the screen they have to open first.

     Only ever on a page that IS a queue: a number beside a catalogue is noise,
     because a catalogue is never "done". CV review is the only such page today. */
  badge?: number
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
  'admin-company-list': { module: 'crm', feature: 'Customers' },
  'admin-company-pipeline': { module: 'crm', feature: 'Sales pipeline' },
  'admin-company-archived': { module: 'crm', feature: 'Customers' },
  'admin-signups': { module: 'crm', feature: 'Sign-ups' },
  // Both pool screens are specified as ONE feature — the claim flow is the spec, and
  // the queue is the second half of it. They sit on the System nav but belong to CRM.
  'admin-company-directory': { module: 'crm', feature: 'Free data' },
  'admin-claim-requests': { module: 'crm', feature: 'Free data' },
  'admin-quotes': { module: 'crm', feature: 'Quotations' },
  'admin-purchase-orders': { module: 'crm', feature: 'Purchase order' },
  'admin-invoices': { module: 'crm', feature: 'Invoices' },
  // Account management is back in the build plan, so the Company-users screen links
  // to its authored feature page (users, roles, deactivate/offboarding, move-user).
  'admin-company-users': { module: 'account-management', feature: 'Company users & roles (on Admin)' },
  // System
  'admin-staff': { module: 'admin-access', feature: 'Staff directory', site: 'Admin' },
  'admin-roles': { module: 'admin-access', feature: 'Roles & permissions' },
  'admin-users': { module: 'admin-access', feature: 'Operators (users)' },
  'admin-issuer': { module: 'admin-system', feature: 'Company information' },
  // Configuration page → System module, like every other System nav item. The tier it
  // configures is displayed by CRM → Customers, which cross-references back to here.
  'admin-membership': { module: 'admin-system', feature: 'Membership tiers' },
  'admin-master-data': { module: 'admin-system', feature: 'Master data' },
  // Both point at the Resume-management feature that specifies them — the weights
  // and the log belong to the matching logic, not to the admin shell.
  'admin-matching-settings': { module: 'resume-management', feature: 'Recommended jobs — matched to a jobseeker’s profile' },
  'admin-matching-report': { module: 'resume-management', feature: 'Recommended jobs — matched to a jobseeker’s profile' },
  'admin-environment': { module: 'admin-system', feature: 'Environment' },
  'admin-departments': { module: 'admin-system', feature: 'Departments' },
}

/** Resolve an admin page to its authored spec page, or null if none exists yet. */
export function specPath(specId?: string): string | null {
  if (!specId) return null
  const t = SPEC_TARGET[specId]
  if (!t) return null
  const m = BUILD_MODULES.find((x) => x.id === t.module)
  if (!m) return null
  const f = m.features.find((x) => x.name === t.feature && (!t.site || x.site === t.site))
  return f ? featurePath(m, f) : null
}
export interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

/** Proposed HQ Admin console navigation (grouped by domain, mirrors modules B1–B9). */
export const NAV_GROUPS: NavGroup[] = [
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
      { label: 'CV review', specId: 'admin-cv-check', badge: 10 },
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
      { label: 'Customers', specId: 'admin-company-list' },
      { label: 'Pipeline', specId: 'admin-company-pipeline' },
      { label: 'Quotations', specId: 'admin-quotes' },
      { label: 'Purchase order', specId: 'admin-purchase-orders' },
      // Sits directly under PO because it is the step that follows it: the VAT
      // e-invoice is issued from a PO once Accounting has confirmed the payment.
      { label: 'Invoice', specId: 'admin-invoices' },
      // Last in the group: inbound self-registrations are a triage inbox that
      // feeds the pipeline, not a step in the document flow above it.
      { label: 'Sign-ups', specId: 'admin-signups' },
      // The free company pool and its claim queue. They live in CRM because that is
      // where a rep looks for their next customer — the pool is the top of the same
      // funnel Customers and Pipeline sit further down. (They remain a SEPARATE
      // STORE outside the CRM tables, which is what keeps unowned, unverified rows
      // out of every CRM count; where the nav puts them and where the data lives are
      // different questions — see Danh bạ doanh nghiệp → "Two stores, not one flag".)
      { label: 'Free data', specId: 'admin-company-directory' },
      // The LOG of every claim request — append-only, no action buttons. Approval
      // happens on Free data (the company's record shows all rivals side by side);
      // this page exists because a rejection is otherwise silent for the rep who
      // asked, until a notification exists. Default view: Của tôi.
      { label: 'Yêu cầu nhận công ty', specId: 'admin-claim-requests' },
      // Last: the register of companies nobody will work again. A dead end by
      // design, so it sits at the bottom of the group and not beside Customers.
      { label: 'Công ty đã lưu trữ', specId: 'admin-company-archived' },
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
      // The taxonomy's maintenance queue, and the answer to "who keeps the skill
      // list from rotting". Fed from BOTH sides — employer searches that matched
      // nothing and CV imports that resolved nothing — because one alias fixes both.
      { label: 'Chất lượng tìm kiếm', specId: 'admin-unresolved-terms' },
      { label: 'Departments', specId: 'admin-departments' },
    ],
  },
]

/* OFF THE NAV, STILL ROUTABLE. Three screens were pulled from the sidebar by the
   client (2026-08) but their screens and registry entries were kept on purpose, so
   restoring one is a single nav line. `?screen=` used to resolve ONLY against
   NAV_GROUPS, which quietly made these unreachable: the URL fell through to the
   default page, and the Environment spec page's own "open in console" link landed
   on Job list instead. Listed here so a link to a de-navved screen still opens it,
   while the sidebar stays exactly as the client asked. */
export const OFF_NAV: { group: string; item: NavItem }[] = [
  { group: 'CRM', item: { label: 'Account usage', specId: 'admin-account-usage' } },
  { group: 'System', item: { label: 'Audit log', specId: 'admin-audit-log' } },
  { group: 'System', item: { label: 'Environment', specId: 'admin-environment' } },
]

/* The console's nav is where an admin screen is NAMED, so it is also the source
   for any other surface that needs to show a screen's name — the spec pages'
   Screen-UI tabs, for one. Without this they fall back to the raw id, and
   "admin-cv-check" is a slug, not a name. */
export const ADMIN_SCREEN_LABELS: Record<string, string> = Object.fromEntries([
  ...NAV_GROUPS.flatMap((g) => g.items.map((it) => [it.specId, it.label] as const)),
  // de-navved screens keep their name too — they are still openable by link
  ...OFF_NAV.map((o) => [o.item.specId, o.item.label] as const),
])
