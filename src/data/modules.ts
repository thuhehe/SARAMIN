/*
 * Cross-surface MODULES.
 *
 * The feature specs (features/*.ts) are organised by *surface* (JS / CO / Admin)
 * — good for "what exists where". This file re-packs the same features into
 * bigger end-to-end MODULES that show how a capability flows across the three
 * apps, e.g. Jobs: create on CO/Admin → manage → show on the JS store.
 *
 * Every feature id below must exist in SPECS. A module is a reading lens over
 * the specs, not a second source of truth — each step links to the real spec.
 */

export type Surface = 'JS' | 'CO' | 'Admin'

export interface FlowStep {
  /** which app this step happens on */
  surface: Surface
  /** short imperative label for the step, e.g. "Create / edit a job" */
  label: string
  /** feature ids (must match SPECS) surfaced at this step */
  featureIds: string[]
}

export interface BigModule {
  id: string
  code: string
  title: string
  /** one-line goal of the module */
  goal: string
  /** compact arrow summary of the flow, e.g. "CO create → Admin oversee → JS show" */
  flow: string
  /** ordered end-to-end steps */
  steps: FlowStep[]
  /** cross-cutting decisions that gate this module (from Part C) */
  keyDecisions?: string[]
}

export const SURFACE_META: Record<Surface, { label: string; long: string; pill: string; dot: string }> = {
  JS: {
    label: 'JS',
    long: 'Job-seeker site',
    pill: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  CO: {
    label: 'CO',
    long: 'Company site (employer)',
    pill: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
  Admin: {
    label: 'Admin',
    long: 'HQ Admin console',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
}

export const MODULES: BigModule[] = [
  {
    id: 'm-identity',
    code: 'M1',
    title: 'Identity, accounts & access',
    goal: 'One account model across all three apps: candidates and employers sign up, HQ manages users + permissions, everyone manages their own profile.',
    flow: 'JS/CO create account → Admin user & role management → My profile (JS) / team access (CO)',
    steps: [
      { surface: 'JS', label: 'Create account, sign in (email + social), verify email', featureIds: ['js-auth'] },
      { surface: 'CO', label: 'Company team roster & access (invite members, roles)', featureIds: ['emp-members'] },
      { surface: 'Admin', label: 'Admin user management + roles & permissions (resource:action)', featureIds: ['admin-users', 'admin-roles'] },
      { surface: 'JS', label: 'My profile & account actions (withdrawal) in My Account', featureIds: ['js-auth', 'js-my-home'] },
    ],
    keyDecisions: [
      'Social providers for VN (Google / Facebook / Zalo?) and auto-login vs email-verification.',
      'Admin role matrix / personas (sales, ops, content, super-admin) needs sign-off.',
      'Session / JWT ownership + admin auth (SSO vs local).',
    ],
  },
  {
    id: 'm-jobs',
    code: 'M2',
    title: 'Jobs — create, manage & discover',
    goal: 'A single job entity created on CO/Admin, managed through its lifecycle, and surfaced to candidates on the JS store.',
    flow: 'CO/Admin create job → CO manage own postings → Admin oversee all jobs → JS search & view',
    steps: [
      { surface: 'CO', label: 'Create / edit a job posting (employer-scoped)', featureIds: ['emp-jobs'] },
      { surface: 'Admin', label: 'Create a job (canonical multi-step form) & edit any posting', featureIds: ['admin-job-new', 'admin-job-detail'] },
      { surface: 'CO', label: 'Move a posting through its lifecycle (open / close / …)', featureIds: ['emp-job-lifecycle'] },
      { surface: 'Admin', label: 'Oversee every posting across the platform', featureIds: ['admin-job-list'] },
      { surface: 'JS', label: 'Search, browse lists, view detail, save (scrap)', featureIds: ['js-search', 'js-lists', 'js-job-detail', 'js-scraps'] },
    ],
    keyDecisions: [
      'One shared posting field schema across CO form + Admin “New job” + JS detail.',
      'Job creation should be its own module ("Create job") reused by CO and Admin.',
      'Hot-100 / ranking logic ownership + refresh cadence.',
    ],
  },
  {
    id: 'm-applications',
    code: 'M3',
    title: 'Applications & hiring (ATS)',
    goal: 'A candidate applies once; the application flows into the employer’s pipeline and HQ’s oversight view.',
    flow: 'JS apply → JS my-applications → CO applicant board + schedule → Admin applicants oversight',
    steps: [
      { surface: 'JS', label: 'Apply to a job (pick resume, confirm)', featureIds: ['js-apply'] },
      { surface: 'JS', label: 'Track my applications + status', featureIds: ['js-my-applications'] },
      { surface: 'CO', label: 'Applicant board (ATS) — move through stages + interview scheduling', featureIds: ['emp-ats', 'emp-schedule'] },
      { surface: 'Admin', label: 'HQ applicants board (oversight) per job', featureIds: ['admin-job-applicants'] },
    ],
    keyDecisions: [
      'Pipeline stages: fixed defaults vs per-employer configurable.',
      'Application statuses + who can change them; HQ read-only vs editable.',
      'Application-evaluation model (auto?) — waiting / ready / not matching / spam …',
    ],
  },
  {
    id: 'm-resumes',
    code: 'M4',
    title: 'Resumes & talent search',
    goal: 'Candidates build CVs; employers search and unlock them (credits/paid); HQ manages resume records.',
    flow: 'JS build CV → CO talent search + CV unlock (credits) → Admin resume records',
    steps: [
      { surface: 'JS', label: 'Create / edit resumes (online + uploaded) + templates', featureIds: ['js-resumes', 'js-resume-templates'] },
      { surface: 'CO', label: 'Search the talent pool + unlock CVs (spends credits)', featureIds: ['emp-talent-search', 'emp-credits'] },
      { surface: 'Admin', label: 'Resume records: list / detail / create (PII-gated)', featureIds: ['admin-resumes', 'admin-resume-detail', 'admin-resume-new'] },
    ],
    keyDecisions: [
      'CV "unlock price" model — candidate paywall vs employer-side unlock; credits vs cash.',
      'Candidate consent to appear in talent search (VN privacy) + HQ CV-view audit.',
    ],
  },
  {
    id: 'm-companies',
    code: 'M5',
    title: 'Companies',
    goal: 'HQ (and employers) maintain company profiles; candidates browse them on the store.',
    flow: 'Admin/CO maintain company profile → JS company directory & rich detail',
    steps: [
      { surface: 'Admin', label: 'Company records: list / detail / create', featureIds: ['admin-company-new', 'admin-company-list', 'admin-company-detail'] },
      { surface: 'JS', label: 'Company directory + rich profile (info, welfare, reviews, jobs)', featureIds: ['js-companies'] },
    ],
    keyDecisions: [
      'Company detail UI depth (Vietnamworks-simple vs itviec-rich).',
      'User-generated reviews / interviews — in scope? moderation flow + legal.',
    ],
  },
  {
    id: 'm-content',
    code: 'M6',
    title: 'Content & display management',
    goal: 'HQ configures homepage sections, banners and CMS content; the store renders them in the admin-defined order.',
    flow: 'Admin section-builder / banners / CMS → JS home, curation & content pages render',
    steps: [
      { surface: 'Admin', label: 'Banners & popups', featureIds: ['admin-banners'] },
      { surface: 'Admin', label: 'CMS: pages, blog/articles', featureIds: ['admin-pages', 'admin-blog'] },
      { surface: 'JS', label: 'Homepage sections, curation, career-info render the managed content', featureIds: ['js-home', 'js-curation', 'js-career-info'] },
    ],
    keyDecisions: [
      'Client to define the homepage section/slot types (following Saramin KR or VN).',
      'How jobs auto-fill sections when demand > slots; job "collections" defined by bundle?',
      'Full CMS at launch vs just banners + popups.',
    ],
  },
  {
    id: 'm-billing',
    code: 'M7',
    title: 'Billing, products & sales',
    goal: 'HQ defines paid products; employers purchase them; HQ processes orders and runs the sales/CRM back office.',
    flow: 'Admin define products → CO buy (catalog + 8 paid products) → Admin orders → CRM quotes/invoices/PO/payments/contracts',
    steps: [
      { surface: 'Admin', label: 'Products, bundles, credits, promotions', featureIds: ['admin-catalog', 'admin-bundles', 'admin-credits', 'admin-promotions'] },
      { surface: 'CO', label: 'Purchase surface: catalog + the 8 paid products', featureIds: ['bill-catalog', 'bill-main-ad', 'bill-targeted-ad', 'bill-recommend-rank', 'bill-search-product', 'bill-package', 'bill-talent-pool', 'bill-events'] },
      { surface: 'Admin', label: 'Orders (billing connector)', featureIds: ['admin-orders'] },
      { surface: 'Admin', label: 'Sales / CRM: pipeline, customers, activation, quotes, invoices, PO, payments, contracts', featureIds: ['admin-sales-pipeline', 'admin-customers', 'admin-customer-activation', 'admin-quotes', 'admin-invoices', 'admin-purchase-orders', 'admin-payments', 'admin-contracts'] },
    ],
    keyDecisions: [
      'CRM is the single front door for companies: lead → won → activate (create account) → products → company page. One company record throughout (no duplicates).',
      'Activation branch: Job Posting requires a public company detail page; Resume Search only does not.',
      'No payment gateway wired anywhere — pick the VN gateway (VNPay / MoMo / card / bank / invoice). Biggest single gap.',
      'Credits vs cash vs both; self-serve purchase vs sales-assisted (HQ-created orders).',
      'PO / payments / contracts are empty seams — in launch scope? (real svn-be build).',
      'Which of the 8 paid products launch first.',
    ],
  },
  {
    id: 'm-notifications',
    code: 'M8',
    title: 'Notifications',
    goal: 'System events trigger templated messages routed through workflows and delivered to candidates/employers.',
    flow: 'Admin events → templates → workflows → delivery log → JS/CO notification bell',
    steps: [
      { surface: 'Admin', label: 'Define trigger events + templates (per channel & language)', featureIds: ['admin-notif-events', 'admin-notif-templates'] },
      { surface: 'Admin', label: 'Workflows (routing rules) + delivery log', featureIds: ['admin-notif-workflows', 'admin-notif-log'] },
      { surface: 'JS', label: 'Notification bell + read-marking (also employer side)', featureIds: ['js-notifications'] },
    ],
    keyDecisions: [
      'Channels (email / SMS / Zalo / in-app push) + provider — undecided, blocks the whole module.',
      'Entire module is on the prototype DB — needs BE migration.',
    ],
  },
  {
    id: 'm-analytics',
    code: 'M9',
    title: 'Analytics & reporting',
    goal: 'Store behaviour and transactions feed HQ dashboards and reports.',
    flow: 'JS behaviour tracking → Admin analytics dashboard + sales / recruit / revenue / behaviour reports',
    steps: [
      { surface: 'JS', label: 'Behaviour tracking (clicks / views / searches)', featureIds: ['js-behavior-tracking'] },
      { surface: 'Admin', label: 'KPI dashboard + reports', featureIds: ['admin-analytics-dashboard', 'admin-sales-report', 'admin-recruit-report', 'admin-revenue-report', 'admin-user-behavior'] },
    ],
    keyDecisions: [
      'Which reports must show real data at launch (several are mock timeseries).',
      'Privacy / consent handling for behaviour tracking under VN law.',
    ],
  },
  {
    id: 'm-platform',
    code: 'M10',
    title: 'Platform, settings & distribution',
    goal: 'The shared plumbing: master data, config/flags, audit, localisation, the app shell, and external job distribution.',
    flow: 'Admin master data & settings → powers all surfaces · CO multi-platform distribution',
    steps: [
      { surface: 'Admin', label: 'Master data (categories, locations…), environment/flags, audit log, departments', featureIds: ['admin-master-data', 'admin-environment', 'admin-audit-log', 'admin-departments'] },
      { surface: 'CO', label: 'Multi-platform recruit posting + recruit list, employer onboarding', featureIds: ['emp-multi-platform', 'emp-recruit-list', 'emp-tutorial', 'emp-dashboard'] },
      { surface: 'JS', label: 'i18n & multilingual content, global header/footer/layout', featureIds: ['shared-i18n', 'shared-layout'] },
    ],
    keyDecisions: [
      'Which external platforms (Saramin / Komate / Worknet / Senior) are real integrations vs placeholders.',
      'Feature-flag registry (Admin Environment) gates which store screens use real data vs mock.',
      'Localisation: JS vi/en, CO vi/en/ko, Admin vi/en; full list of multilingual fields.',
    ],
  },
  {
    id: 'm-tools',
    code: 'M11',
    title: 'Career tools & marketing pages',
    goal: 'Candidate self-service tools plus standalone marketing / info / legal pages.',
    flow: 'JS candidate tools + dashboard · shared marketing & legal pages',
    steps: [
      { surface: 'JS', label: 'Candidate dashboard (my-home)', featureIds: ['js-my-home'] },
      { surface: 'JS', label: 'Salary explorer + tools (character counter, statement coaching)', featureIds: ['js-salary', 'js-tool-counter', 'js-tool-coaching'] },
      { surface: 'JS', label: 'Marketing & legal: Top Brand Award, service guide, help / legal', featureIds: ['shared-top-brand', 'shared-service-guide', 'shared-help-legal'] },
    ],
    keyDecisions: [
      'Which tools ship at launch (AI coaching needs an AI provider + cost).',
      'Salary data source (aggregated / licensed / manual) + legal disclaimer.',
      'Final VN privacy / terms copy (client / legal).',
    ],
  },
]
