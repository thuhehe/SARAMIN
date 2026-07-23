/*
 * BUILD MODULES — the near-final module list defined by the SVN team
 * (Module · Owner · Features · Site · Scope · Notes), mirrored from the sheet.
 *
 * This is the authoritative build plan. Each feature row ≈ a page/screen.
 * `requirements` are authored per module against basic VN-market recruitment
 * standards (VietnamWorks / TopCV / ITviec). `mockup` links a feature to a
 * wireframe on the Mockups page.
 */

export type Site = 'Jobseekers' | 'Companies' | 'Admin'
export type Scope = 'BE' | 'FE' | 'UI'

export const SITE_META: Record<Site, { label: string; pill: string }> = {
  Jobseekers: { label: 'Jobseekers', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Companies: { label: 'Companies', pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  Admin: { label: 'Admin', pill: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export const SCOPE_META: Record<Scope, { pill: string }> = {
  BE: { pill: 'bg-blue-100 text-blue-700 border-blue-200' },
  FE: { pill: 'bg-blue-100 text-blue-700 border-blue-200' },
  UI: { pill: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export interface BuildFeature {
  name: string
  site: Site
  scope: Scope[]
  notes?: string
  /** id of a wireframe on the Mockups page, if one exists */
  mockup?: string
}

export interface BuildModule {
  id: string
  title: string
  owner: string
  /** authored — what the module must deliver (VN-standard). */
  requirements: string[]
  features: BuildFeature[]
}

export const BUILD_MODULES: BuildModule[] = [
  {
    id: 'crm',
    title: 'CRM (to be updated)',
    owner: 'Luan',
    requirements: [
      'Placeholder — scope to be updated by the team.',
      'Sales pipeline + customer (company) records; connects to Company user management.',
    ],
    features: [{ name: 'CRM', site: 'Admin', scope: ['BE', 'FE'] }],
  },
  {
    id: 'jobseeker-user',
    title: 'Job seeker user management',
    owner: 'Luong',
    requirements: [
      'Email + password sign up / sign in, plus 4 social logins (Facebook, Google, LinkedIn, GitHub).',
      'Email verification to activate the account; password reset.',
      'My page: profile info, avatar, contact, job preferences, profile completeness.',
      'Deactivate (withdraw) account with a confirm step.',
      'Admin: search jobseeker accounts, view detail, activate / deactivate.',
    ],
    features: [
      { name: 'Sign up / Sign in', site: 'Jobseekers', scope: ['BE', 'FE'], notes: '4 social login (Facebook, Gmail, LinkedIn, Github)' },
      { name: 'User management', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'My page', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-mypage' },
      { name: 'Deactivate account', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
    ],
  },
  {
    id: 'company-user',
    title: 'Company user management',
    owner: 'Luong',
    requirements: [
      'Create company on Admin (will connect with CRM); create company users on Admin and self-register on the Company site.',
      'Company member model: roles + permissions — e.g. HR Manager (super admin) vs HR Specialist (job posting / resume search only).',
      'Decide member limit per company.',
      'Public company detail page on the Jobseeker site (profile, benefits, open jobs).',
    ],
    features: [
      { name: 'Create company', site: 'Admin', scope: ['BE', 'FE'], notes: 'Will connect with CRM' },
      { name: 'Create company user (on Admin)', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Create company user (on CO)', site: 'Companies', scope: ['BE', 'FE', 'UI'], notes: 'Member count per company, limits, and roles (HR manager = super admin; HR specialist = job posting / resume search only) — TBD.' },
      { name: 'Company detail', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
    ],
  },
  {
    id: 'products-packages',
    title: 'Products & Packages',
    owner: 'Luan',
    requirements: [
      'Manage sellable products (job-posting slots, CV search, banner/ad placements).',
      'Bundle products into packages with price, duration and quota.',
      'Admin-only; feeds the Company purchasing surface.',
    ],
    features: [
      { name: 'Products management', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Packages management', site: 'Admin', scope: ['BE', 'FE'] },
    ],
  },
  {
    id: 'job-management',
    title: 'Job management',
    owner: 'Luan',
    requirements: [
      'Create a job on Admin AND on the Company site — company users can now post jobs themselves (previously draft-only).',
      'Standard VN job fields: title, company, salary (incl. "Thỏa thuận"), work location, level, experience, deadline, description / requirements / benefits.',
      'Job list on Admin (all jobs) and Company (own jobs) with status + filters.',
      'Jobseeker: job lists on the Homepage and Search-result page, plus the Job detail page.',
    ],
    features: [
      { name: 'Create job', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Create job', site: 'Companies', scope: ['BE', 'FE', 'UI'], notes: "Company user can't post job today (draft only); SVN wants company users to post by themselves.", mockup: 'co-create-job' },
      { name: 'Job list', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Job list', site: 'Companies', scope: ['BE', 'FE', 'UI'], mockup: 'co-job-list' },
      { name: 'Job list (Homepage)', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-home' },
      { name: 'Job list (Search result)', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-search' },
      { name: 'Job detail', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-job-detail' },
    ],
  },
  {
    id: 'application-management',
    title: 'Application management',
    owner: 'Luong',
    requirements: [
      'Apply flow (Jobseeker): quick apply with a selected CV.',
      'Application list on Admin and Company; My application on the Jobseeker site.',
      'Status pipeline; HQ screening step before forwarding to the company (Phase-1 quality gate).',
    ],
    features: [
      { name: 'Apply flow', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-apply' },
      { name: 'Application list', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Application list', site: 'Companies', scope: ['BE', 'FE', 'UI'], mockup: 'co-application-list' },
      { name: 'My application', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
    ],
  },
  {
    id: 'resume-management',
    title: 'Resume management',
    owner: 'Luong',
    requirements: [
      'Create CV — online builder (+ uploaded CV); My CVs on the My page.',
      'One jobseeker = one primary CV (Phase-1) — confirm.',
      'Resume list on Admin and Company (CV search / talent), gated by package + candidate visibility consent.',
    ],
    features: [
      { name: 'Create CV', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-create-cv' },
      { name: 'My CVs (My page)', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-mypage' },
      { name: 'Resume list', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Resume list', site: 'Companies', scope: ['BE', 'FE', 'UI'] },
    ],
  },
  {
    id: 'banners-popups',
    title: 'Banners & Popups',
    owner: 'Luong',
    requirements: [
      'Admin: create + manage banners and popups with scheduling and placement/target.',
      'Jobseeker site: render active banners and popups in the defined slots.',
    ],
    features: [
      { name: 'Create banner + Banner list', site: 'Admin', scope: ['BE', 'FE'] },
      { name: 'Display banner', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
      { name: 'Create popup + Popup list', site: 'Admin', scope: ['BE', 'FE', 'UI'] },
      { name: 'Display popup', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'] },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    owner: 'Luong',
    requirements: [
      'Migrate two tools from the current web: Personality testing and Gross ↔ Net salary calculator.',
      'Jobseeker-facing; keep the existing calculation logic.',
    ],
    features: [
      { name: 'Personality testing', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], notes: 'migrate logic from current web' },
      { name: 'Gross - Net calculation', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], notes: 'migrate logic from current web' },
    ],
  },
]
