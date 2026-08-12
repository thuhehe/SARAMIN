import type { NavModule } from './types'

/**
 * Left-nav source of truth. Three levels:
 *   L1 = app group (`app`)  ·  L2 = module (`code` + `label`)  ·  L3 = feature (leaf `id`)
 *
 * Every leaf `id` must match a FeatureSpec.id in features/*.ts.
 * Add a feature by adding its leaf here + its spec there — nothing else.
 */
export const NAV: NavModule[] = [
  // ── Store Site ────────────────────────────────────────────────────────────
  {
    code: 'A1',
    label: 'Job-seeker',
    app: 'Store Site',
    children: [
      { id: 'js-auth', label: 'Authentication' },
      { id: 'js-home', label: 'Home / landing' },
      { id: 'js-search', label: 'Job search' },
      { id: 'js-lists', label: 'Job lists by type' },
      { id: 'js-job-detail', label: 'Job detail' },
      { id: 'js-apply', label: 'Apply to job' },
      { id: 'js-my-applications', label: 'My applications' },
      { id: 'js-scraps', label: 'Scraps (saved jobs)' },
      { id: 'js-my-home', label: 'Candidate dashboard' },
      { id: 'js-resumes', label: 'Resumes' },
      { id: 'js-resume-templates', label: 'Resume templates' },
      { id: 'js-notifications', label: 'Notifications' },
      { id: 'js-companies', label: 'Companies directory' },
      { id: 'js-salary', label: 'Salary explorer' },
      { id: 'js-career-info', label: 'Senior list / career info' },
      { id: 'js-curation', label: 'Curation' },
      { id: 'js-tool-counter', label: 'Tool — character counter' },
      { id: 'js-tool-coaching', label: 'Tool — statement coaching' },
      { id: 'js-behavior-tracking', label: 'Behaviour tracking' },
    ],
  },
  {
    code: 'A2',
    label: 'Employer console',
    app: 'Store Site',
    children: [
      { id: 'emp-dashboard', label: 'Employer dashboard' },
      { id: 'emp-jobs', label: 'Job postings (CRUD)' },
      { id: 'emp-job-lifecycle', label: 'Job lifecycle' },
      { id: 'emp-ats', label: 'Applicant board (ATS)' },
      { id: 'emp-schedule', label: 'Applicant schedule' },
      { id: 'emp-talent-search', label: 'Candidate search' },
      { id: 'emp-credits', label: 'Credits' },
      { id: 'emp-members', label: 'Company members' },
      { id: 'emp-multi-platform', label: 'Multi-platform posting' },
      { id: 'emp-recruit-list', label: 'Recruit list' },
      { id: 'emp-tutorial', label: 'Tutorial / onboarding' },
    ],
  },
  {
    code: 'A2$',
    label: 'Employer billing',
    app: 'Store Site',
    children: [
      { id: 'bill-catalog', label: 'Product catalog / select' },
      { id: 'bill-main-ad', label: 'Main ad' },
      { id: 'bill-targeted-ad', label: 'Area / job / industry ad' },
      { id: 'bill-recommend-rank', label: 'Recommend rank' },
      { id: 'bill-search-product', label: 'Search product' },
      { id: 'bill-package', label: 'Recruit package' },
      { id: 'bill-talent-pool', label: 'Talent pool' },
      { id: 'bill-events', label: 'Events' },
    ],
  },
  {
    code: 'A3',
    label: 'Shared / content',
    app: 'Store Site',
    children: [
      { id: 'shared-top-brand', label: 'Top Brand Award' },
      { id: 'shared-service-guide', label: 'Service guide' },
      { id: 'shared-help-legal', label: 'Help / legal' },
      { id: 'shared-i18n', label: 'i18n (vi / en)' },
      { id: 'shared-layout', label: 'Header / footer / layout' },
    ],
  },

  // ── HQ Admin ──────────────────────────────────────────────────────────────
  {
    code: 'B1',
    label: 'Companies',
    app: 'HQ Admin',
    children: [
      { id: 'admin-company-list', label: 'Company list' },
      { id: 'admin-company-detail', label: 'Company detail' },
      { id: 'admin-company-new', label: 'New company' },
    ],
  },
  {
    code: 'B2',
    label: 'Products',
    app: 'HQ Admin',
    // Catalogue side only — the selling documents live under Sales (CRM).
    // Products · Packages · Placements are one job: you cannot define a placement
    // product without the placement list, so they share a module.
    children: [
      { id: 'admin-catalog', label: 'Products' },
      { id: 'admin-bundles', label: 'Packages' },
      { id: 'admin-placements', label: 'Placements' },
    ],
  },
  {
    code: 'B3',
    label: 'Jobs',
    app: 'HQ Admin',
    children: [
      { id: 'admin-job-list', label: 'Job list' },
      { id: 'admin-job-detail', label: 'Job detail' },
      { id: 'admin-job-applicants', label: 'Applicants board' },
      { id: 'admin-job-new', label: 'New job' },
    ],
  },
  {
    code: 'B4',
    label: 'Resumes',
    app: 'HQ Admin',
    children: [
      { id: 'admin-resumes', label: 'Resume list' },
      { id: 'admin-resume-detail', label: 'Resume detail' },
      { id: 'admin-resume-new', label: 'New resume' },
    ],
  },
  {
    code: 'B5',
    label: 'Service',
    app: 'HQ Admin',
    // Only what customers bought. Site copy (Pages, Blog) moved to System settings.
    children: [
      { id: 'admin-banners', label: 'Displays' },
      { id: 'admin-manual-services', label: 'Manual services' },
    ],
  },
  {
    code: 'B6',
    label: 'Notifications',
    app: 'HQ Admin',
    children: [
      { id: 'admin-notif-templates', label: 'Templates' },
      { id: 'admin-notif-events', label: 'Events' },
      { id: 'admin-notif-workflows', label: 'Workflows' },
      { id: 'admin-notif-log', label: 'Delivery log' },
    ],
  },
  {
    code: 'B7',
    label: 'Analytics',
    app: 'HQ Admin',
    children: [
      { id: 'admin-analytics-dashboard', label: 'Analytics dashboard' },
      { id: 'admin-sales-report', label: 'Sales report' },
      { id: 'admin-recruit-report', label: 'Recruit report' },
      { id: 'admin-revenue-report', label: 'Revenue report' },
      { id: 'admin-user-behavior', label: 'User behavior' },
    ],
  },
  {
    code: 'B8',
    label: 'Sales (CRM)',
    app: 'HQ Admin',
    children: [
      { id: 'admin-sales-pipeline', label: 'Pipeline' },
      { id: 'admin-account-usage', label: 'Account usage' },
      { id: 'admin-customers', label: 'Customers' },
      { id: 'admin-customer-activation', label: 'Lead → customer activation' },
      // ordered as the quote-to-cash chain runs — Payments before Invoices,
      // because the customer pays first and the VAT e-invoice is issued after.
      { id: 'admin-quotes', label: 'Quotations' },
      { id: 'admin-purchase-orders', label: 'Sales orders / PO' },
      { id: 'admin-payments', label: 'Payments' },
      { id: 'admin-invoices', label: 'Invoices (VAT)' },
      { id: 'admin-contracts', label: 'Contracts' },
    ],
  },
  {
    code: 'B9',
    label: 'System settings',
    app: 'HQ Admin',
    children: [
      { id: 'admin-staff', label: 'Staff directory' },
      { id: 'admin-roles', label: 'Roles & permissions' },
      { id: 'admin-users', label: 'Users' },
      { id: 'admin-pages', label: 'Pages' },
      { id: 'admin-blog', label: 'Blog / articles' },
      { id: 'admin-master-data', label: 'Master data' },
      { id: 'admin-audit-log', label: 'Audit log' },
      { id: 'admin-environment', label: 'Environment' },
      { id: 'admin-departments', label: 'Departments' },
    ],
  },

  // ── Cross-cutting ───────────────────────────────────────────────────────────
  {
    code: 'C',
    label: 'Cross-cutting themes',
    app: 'Cross-cutting',
    children: [
      { id: 'xc-payments', label: 'Payments & monetisation' },
      { id: 'xc-backend-readiness', label: 'Backend readiness' },
      { id: 'xc-multi-platform', label: 'Multi-platform distribution' },
      { id: 'xc-notifications', label: 'Notifications delivery' },
      { id: 'xc-ugc', label: 'User-generated content' },
      { id: 'xc-data-sourcing', label: 'Data sourcing' },
      { id: 'xc-localization', label: 'Localisation scope' },
    ],
  },
]
