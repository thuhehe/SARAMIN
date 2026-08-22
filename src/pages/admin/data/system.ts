/*
 * System configuration: permission roles, HQ operators, the staff directory and
 * the master-data domains.
 */
import { COMPANIES } from '@/pages/admin/data/companies'
import type { StatusTone } from '@/pages/admin/ui/status'

/* ── System · Roles & permissions ───────────────────────────────────────────
 * Interactive flow — the internal HQ operator lifecycle, in order:
 *   1. Define a ROLE first  → a permission tree (None / Read / Read & write per page)
 *   2. Create an operator   → fill name + email
 *   3. Assign the role      → pick from the roles defined in step 1
 *   4. Send email invite    → operator sets their OWN password via the link
 *   → status is Pending until they activate it, then Active
 * Same invitation format/flow as the company Admin / assigned-role invite.
 */
export type PermLevel = 'none' | 'read' | 'write'
export const PERM_GROUPS: { key: string; label: string; resources: string[] }[] = [
  { key: 'recruitment', label: 'Recruitment', resources: ['Jobs', 'Job approval', 'Applicants', 'Resumes / candidates (PII)'] },
  { key: 'companies', label: 'Companies', resources: ['Company accounts', 'Company users', 'Company page review'] },
  // One resource, because Displays is one page (banners + popups behind a switcher).
  { key: 'content', label: 'Service', resources: ['Displays (banners + popups)', 'Manual services'] },
  { key: 'billing', label: 'Billing & products', resources: ['Catalog', 'Bundles', 'Credits', 'Orders', 'Promotions'] },
  { key: 'crm', label: 'CRM', resources: ['Sign-ups', 'Pipeline / leads', 'Quotes', 'Invoices', 'Purchase orders', 'Payments', 'Contracts'] },
  { key: 'analytics', label: 'Analytics', resources: ['Dashboard', 'Sales report', 'Recruit report', 'Revenue report', 'User behavior'] },
  { key: 'system', label: 'System', resources: ['Operator accounts', 'Roles & permissions', 'Master data', 'Job categories & roles', 'Audit log', 'Environment / flags', 'Departments'] },
]
export const TOTAL_PERMS = PERM_GROUPS.reduce((n, g) => n + g.resources.length, 0)
export const permKey = (gk: string, r: string) => `${gk}:${r}`

export type Role = { name: string; desc: string; users: number; grants: Record<string, PermLevel> }
export const ROLES: Role[] = [
  { name: 'Super admin', desc: 'Full access to every module, including roles & operator accounts.', users: 3, grants: { recruitment: 'write', companies: 'write', content: 'write', billing: 'write', crm: 'write', analytics: 'write', system: 'write' } },
  { name: 'Sales', desc: 'CRM pipeline, companies & billing. No content or system settings.', users: 8, grants: { recruitment: 'none', companies: 'read', content: 'none', billing: 'write', crm: 'write', analytics: 'read', system: 'none' } },
  { name: 'Operations', desc: 'Recruitment moderation, company accounts & content.', users: 12, grants: { recruitment: 'write', companies: 'write', content: 'write', billing: 'none', crm: 'none', analytics: 'read', system: 'none' } },
  { name: 'Content editor', desc: 'Content module only — banners, popups, pages, blog.', users: 5, grants: { recruitment: 'none', companies: 'none', content: 'write', billing: 'none', crm: 'none', analytics: 'read', system: 'none' } },
  { name: 'Finance', desc: 'Billing, orders & revenue reports. Read-only CRM.', users: 4, grants: { recruitment: 'none', companies: 'read', content: 'none', billing: 'write', crm: 'read', analytics: 'read', system: 'none' } },
]
// expand a role's per-group grants into a full per-resource permission map
export const expandGrants = (grants: Record<string, PermLevel>): Record<string, PermLevel> => {
  const m: Record<string, PermLevel> = {}
  for (const g of PERM_GROUPS) for (const r of g.resources) m[permKey(g.key, r)] = grants[g.key] ?? 'none'
  return m
}
export const grantedCount = (perms: Record<string, PermLevel>) => Object.values(perms).filter((l) => l !== 'none').length

export const PERM_LEVELS: { key: PermLevel; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Read & write' },
]
/* ── System · Users (HQ operators) — create → assign role → invite → status ── */
/* Department is the org unit (who they sit with, from System → Departments);
   role is the RBAC grant set. The two are orthogonal — same department, different
   roles is normal — so they get their own columns. */
export const OP_DEPTS = ['Sales', 'Operations', 'Content', 'Engineering'] as const
export type OpUser = { id: number; name: string; email: string; dept: string; role: string; status: 'Active' | 'Pending' | 'Disabled'; last: string }
export const OPERATORS: OpUser[] = [
  { id: 1, name: 'Trần Quốc Trung', email: 'admin@saramin.vn', dept: 'Content', role: 'Super admin', status: 'Active', last: '5m ago' },
  { id: 2, name: 'Lê Hữu Phong', email: 'ops1@saramin.vn', dept: 'Operations', role: 'Operations', status: 'Active', last: '1h ago' },
  { id: 3, name: 'Nguyễn Thị Lan', email: 'sales1@saramin.vn', dept: 'Sales', role: 'Sales', status: 'Active', last: '2h ago' },
  { id: 4, name: 'Phạm Quang Huy', email: 'sales2@saramin.vn', dept: 'Sales', role: 'Sales', status: 'Pending', last: '—' },
  { id: 5, name: 'Đặng Thu Trang', email: 'content1@saramin.vn', dept: 'Content', role: 'Content editor', status: 'Disabled', last: '2 months ago' },
]
export const OP_STATUS: Record<OpUser['status'], StatusTone> = { Active: 'active', Pending: 'pending', Disabled: 'expired' }

/* ── System · Staff directory ─────────────────────────────────────────────────
 * The master people list for HQ — name · email · phone · department. It is the
 * single source that two other places draw from:
 *   • Operators (console logins) — you create an operator by PICKING a staff
 *     member here, then assigning a role. Not every staff member is an operator.
 *   • CRM ownership — a company is assigned to a SALES staff member (its owner).
 * A person's email / department is entered once, here, then reused everywhere.
 */
export type Staff = { id: number; name: string; email: string; phone: string; dept: string; title: string }
export const STAFF: Staff[] = [
  { id: 1, name: 'Trần Quốc Trung', email: 'admin@saramin.vn', phone: '0901 234 567', dept: 'Content', title: 'Founder / Super admin' },
  { id: 2, name: 'Lê Hữu Phong', email: 'ops1@saramin.vn', phone: '0902 345 678', dept: 'Operations', title: 'Operations lead' },
  { id: 3, name: 'Nguyễn Thị Lan', email: 'sales1@saramin.vn', phone: '0903 456 789', dept: 'Sales', title: 'Account executive' },
  { id: 4, name: 'Phạm Quang Huy', email: 'sales2@saramin.vn', phone: '0904 567 890', dept: 'Sales', title: 'Account executive' },
  { id: 5, name: 'Đặng Thu Trang', email: 'content1@saramin.vn', phone: '0905 678 901', dept: 'Content', title: 'Content editor' },
  { id: 6, name: 'Ngô Minh Tú', email: 'tu@saramin.vn', phone: '0906 789 012', dept: 'Operations', title: 'Moderator' },
  { id: 7, name: 'Vũ Thanh Hải', email: 'hai@saramin.vn', phone: '0907 890 123', dept: 'Sales', title: 'Sales rep' },
  { id: 8, name: 'Seonguk Park', email: 'seonguk@saramin.vn', phone: '0908 901 234', dept: 'Engineering', title: 'Engineering lead' },
]
/** which staff already have a console login (seed operators), by email → role. */
export const OPERATOR_ROLE_BY_EMAIL: Record<string, string> = Object.fromEntries(OPERATORS.map((o) => [o.email, o.role]))
/** how many CRM companies a staff member owns (drawn from the CRM company list). */
export const companiesOwnedBy = (name: string) => COMPANIES.filter((c) => c.owner === name).length

/* ── Master data — one place for every reference list ─────────────────────────
 * Single source of truth for the dropdown / filter vocabularies used across all
 * three sites. One page, one left rail of domains, one detail panel. Each domain
 * declares its shape: flat list, tag cloud, two-level taxonomy, or grouped list.
 * Mirrors the client's master-data spec sheet (Industry, Job categories, roles,
 * level, skills, education, languages, job types, locations, currency).
 * ---------------------------------------------------------------------------- */
type MDKind = 'flat' | 'tags' | 'taxonomy' | 'grouped'
export type MDDomain = {
  key: string
  label: string
  i18n: string
  used: string
  note: string
  kind: MDKind
  entries?: string[]
  groups?: { name: string; items: string[] }[]
}
export const MD_DOMAINS: MDDomain[] = [
  {
    // Numbering series belong in Master data: they are configuration an admin looks
    // up, not something any screen lets you type. Records and documents follow
    // OPPOSITE rules, which is the whole point of listing them side by side.
    key: 'doc-numbering', label: 'Document numbering', i18n: '—', used: 'Company · quotation · sales order · invoice',
    note: 'System-assigned, never editable (except the customer’s own PO number, typed as given). A RECORD id must not be guessable — its sequence would reveal how many customers we have. A DOCUMENT number must be sequential + date-stamped so it is filable, quotable on the phone, and legal for VAT.',
    kind: 'flat',
    entries: [
      'Company (record) — CO-XXXXXXX · e.g. CO-P9FCEPD · 6 encoded chars + 1 check char, Crockford Base32 (no I/L/O/U) · NOT sequential, capacity 1.07 billion',
      'Quotation — QUO-{seq6}-{MM}-{YYYY} · e.g. QUO-009909-07-2026 · sequential',
      'Sales order / PO — PO-{seq6}-{MM}-{YYYY} · e.g. PO-005864-08-2026 · sequential',
      'Invoice — the e-invoice provider’s own series · e.g. 1C26TTD-173 · sequential and gapless, required by law. ONE number: a draft already carries one, so there is no separate internal INV- code',
      'Customer’s own PO number — free text, recorded exactly as given · e.g. PO-VP/2026/044',
    ],
  },
  {
    key: 'industry', label: 'Industry', i18n: 'vi · en · ko', used: 'Company profile · job form · Store filter',
    note: 'Classifies companies (and jobs). Single-level list.', kind: 'flat',
    entries: ['IT / Software', 'FMCG', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Logistics', 'Construction & Real Estate', 'Hospitality & Tourism', 'Media & Advertising', 'Telecommunications'],
  },
  {
    key: 'job-categories', label: 'Job categories & roles', i18n: 'vi · en · ko', used: 'Job form (Category → Role) · Store filter',
    note: 'Two-level taxonomy: each Category owns a list of Roles (job titles). Roles are children of their category — pick a category on the left to manage its roles. Distinct from System → Roles & permissions (admin RBAC).',
    kind: 'taxonomy',
    groups: [
      { name: 'IT', items: ['Software Developer', 'Machine Learning / AI Engineer', 'Augmented Reality (AR) Developer', 'Internet of Things (IoT) Developer', 'Blockchain Developer', 'DevOps Engineer', 'Data Engineer / Scientist / Analyst', 'Network Engineer / Cyber Security', 'QA / Tester', 'Product Manager / Business Analyst', 'IT Support Specialist', 'IT - Hardware / Network'] },
      { name: 'Business, Finance', items: ['Accountant', 'Financial Analyst', 'Auditor', 'Investment Analyst', 'Business Development', 'Sales Executive'] },
      { name: 'Management', items: ['Project Manager', 'Operations Manager', 'General Manager', 'Team Lead'] },
      { name: 'Manufacturing & Engineering', items: ['Mechanical Engineer', 'Electrical Engineer', 'QA/QC Engineer', 'Production Supervisor'] },
      { name: 'Service', items: ['Customer Service', 'Restaurant Staff', 'Housekeeping', 'Security'] },
      { name: 'Design, Creativity', items: ['UI/UX Designer', 'Graphic Designer', 'Copywriter', 'Video Editor'] },
    ],
  },
  {
    key: 'benefits', label: 'Benefits (phúc lợi)', i18n: 'vi · en · ko', used: 'Job form (Benefits picker) · Job detail · Store filter',
    note: 'A benefit = a fixed TYPE (icon + label, here) + a DESCRIPTION written per job. Typing them is what gives each benefit an icon, a translation and a SEARCH FILTER — a free-text blob can never answer “show me jobs with a shuttle bus”. Kept deliberately short (12, one 4×3 grid): the description carries the detail, so “Phụ cấp” covers ăn trưa / xăng xe / điện thoại / chuyên cần without four separate types. Max 6 per job.',
    kind: 'flat',
    entries: [
      'Lương & thưởng — Pay & bonus',
      'Phụ cấp — Allowances',
      'Bảo hiểm & sức khoẻ — Insurance & health',
      'Nghỉ phép — Paid leave',
      'Làm việc linh hoạt — Flexible working',
      'Đưa đón & chỗ ở — Transport & housing',
      'Căn-tin — Canteen',
      'Trang bị làm việc — Equipment & uniform',
      'Đào tạo & thăng tiến — Training & career',
      'Du lịch & hoạt động — Trips & activities',
      'Chăm lo gia đình — Family care',
      'Khác — Other (tiêu đề tự nhập, luôn xếp cuối)',
    ],
  },
  {
    key: 'job-level', label: 'Job level', i18n: 'vi · en · ko', used: 'Job form · Store filter',
    note: 'Seniority of the posting. Single-level list.', kind: 'flat',
    entries: ['Intern/Student', 'Fresher/Entry level', 'Experienced (non-manager)', 'Manager', 'Director and above'],
  },
  {
    key: 'skills', label: 'Skills', i18n: 'vi · en', used: 'Job form · resume · Store filter (tags)',
    note: 'Free-growing tag vocabulary; can be connected to Job categories / roles. Displayed as tags on the Jobseeker site.', kind: 'tags',
    entries: ['ASP.NET Core', '.NET', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'SQL Server', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'Photoshop', 'SEO', 'Copywriting', 'Japanese N2', 'Excel'],
  },
  {
    key: 'education', label: 'Education level', i18n: 'vi · en', used: 'Job form (min. education) · resume',
    note: 'Single-level list.', kind: 'flat',
    entries: ['High school', "Associate's degree", 'College', 'Bachelor', 'Master', 'Doctorate', 'Others'],
  },
  {
    key: 'languages', label: 'Preferred languages for application', i18n: 'vi · en', used: 'Job form · resume',
    note: 'Languages a candidate may apply / be assessed in. Single-level list.', kind: 'flat',
    entries: ['English', 'Vietnamese', 'Japanese', 'Chinese', 'Korean', 'French', 'Spanish', 'Italian'],
  },
  {
    // TWO axes, two lists — see Job management → "WORK TYPE and CONTRACT TYPE are
    // TWO fields". They combine freely ("Fulltime + Remote"), so one merged list
    // would force the employer to pick a side and drop the other half.
    key: 'work-types', label: 'Work types (job_type)', i18n: 'vi · en · ko', used: 'Job form · Search filter · Matching',
    note: 'WHERE and HOW the work happens. Single-level list.', kind: 'flat',
    entries: ['In office', 'Remote', 'Hybrid', 'Oversea'],
  },
  {
    key: 'contract-types', label: 'Contract types (contract_type)', i18n: 'vi · en · ko', used: 'Job form · Search filter',
    note: 'The EMPLOYMENT RELATIONSHIP. Job side only — the candidate is never asked for one, so this drives the jobseeker\u2019s SEARCH FILTER, not the match score. No "Other": a catch-all here meant the old list was carrying two axes at once.', kind: 'flat',
    entries: ['Fulltime', 'Part-time', 'Fixed-term contract', 'Internship', 'Probation', 'Freelance', 'Seasonal'],
  },
  {
    // Gates the Locations field: a Vietnamese company picks a province from
    // Locations below; a foreign one does not, and writes its city into Address.
    key: 'country', label: 'Country (quốc tịch công ty)', i18n: 'vi · en', used: 'Company profile (create + detail)',
    note: 'Quốc gia ĐĂNG KÝ của công ty — nơi thành lập theo giấy chứng nhận đăng ký, KHÔNG phải nơi đặt văn phòng và KHÔNG phải quốc tịch của chủ sở hữu (một công ty Hàn Quốc đầu tư, thành lập tại VN thì vẫn là Việt Nam — dùng Company tag cho phần sở hữu). Danh sách ĐẦY ĐỦ theo ISO 3166-1: các nước hay gặp trong kinh doanh tại VN được xếp lên đầu và có tên tiếng Việt, phần còn lại theo tên tiếng Anh, A→Z. Không có mục “Khác” — một quốc gia có thật luôn chọn được, và “Khác” thì không dùng được vào việc gì (hiệp định thuế, báo cáo).',
    kind: 'flat',
    entries: ['Việt Nam', 'Hàn Quốc / Korea, Republic of', 'Nhật Bản / Japan', 'Singapore', 'Hoa Kỳ / United States', 'Trung Quốc / China', 'Đài Loan / Taiwan', 'Hồng Kông / Hong Kong', 'Thái Lan / Thailand', 'Malaysia', 'Indonesia', 'Philippines', 'Ấn Độ / India', 'Úc / Australia', 'Đức / Germany', 'Pháp / France', 'Anh / United Kingdom', 'Hà Lan / Netherlands', 'Thụy Sĩ / Switzerland', 'Canada', 'Nga / Russian Federation', 'Campuchia / Cambodia', 'Lào / Laos', 'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei Darussalam', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Chile', 'Colombia', 'Comoros', 'Congo', 'Congo, Democratic Republic of the', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Côte d\'Ivoire', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'Gabon', 'Gambia', 'Georgia', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, Democratic People\'s Republic of', 'Kuwait', 'Kyrgyzstan', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine, State of', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Syria', 'Tajikistan', 'Tanzania', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkmenistan', 'Tuvalu', 'Türkiye', 'Uganda', 'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Yemen', 'Zambia', 'Zimbabwe'],
  },
  {
    key: 'js-nationality', label: 'Quốc tịch ứng viên / Jobseeker nationality', i18n: 'vi · en',
    used: 'Job form (yêu cầu ứng viên) · Jobseeker profile · Applicant filter',
    note: 'HAI giá trị, và danh sách này không được phép dài ra. Câu hỏi mà nhà tuyển dụng thực sự cần trả lời là “có phải bảo lãnh giấy phép lao động không”, chứ không phải “hộ chiếu nước nào” — mà câu đó chỉ có hai vế. Tách theo từng quốc gia sẽ biến một trường dữ liệu cá nhân nhạy cảm thành bộ lọc phân biệt đối xử, và nếu vai trò cần tiếng Nhật hay tiếng Hàn thì đó là KỸ NĂNG NGÔN NGỮ, không phải quốc tịch.\n\nKhác hẳn Country của CÔNG TY (đủ ~196 nước): quốc gia đăng ký của công ty là dữ liệu công khai trên giấy phép và quyết định cách tính thuế; quốc tịch ứng viên là dữ liệu cá nhân nhạy cảm (NĐ 13/2023) nên chỉ thu thập đúng phần dùng đến.',
    kind: 'flat',
    entries: ['Việt Nam / Vietnamese', 'Nước ngoài / Foreigner'],
  },
  {
    key: 'locations', label: 'Locations', i18n: 'vi · en', used: 'Company profile · job form · Store filter',
    note: 'ĐỦ 34 đơn vị hành chính cấp tỉnh của Việt Nam sau sáp nhập 01/7/2025 (6 thành phố trực thuộc trung ương + 28 tỉnh), và giá trị CUỐI CÙNG là “Quốc tế / International”. Sáu thành phố xếp trước vì phần lớn tin tuyển dụng nằm ở đó; 28 tỉnh còn lại A→Z. Danh sách phẳng, không nhóm — một tin đăng chọn một tỉnh, không chọn một vùng.\n\nQuốc tế nằm CUỐI, không nằm đầu và không tách thành từng nước: ở một sàn tuyển dụng Việt Nam đây là ngoại lệ, và tách Japan/Singapore/Korea thành từng mục sẽ tạo ra bộ lọc gần như luôn rỗng.',
    kind: 'flat',
    entries: ['Hà Nội', 'Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Huế', 'Cần Thơ', 'An Giang', 'Bắc Ninh', 'Cao Bằng', 'Cà Mau', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên', 'Khánh Hòa', 'Lai Châu', 'Lào Cai', 'Lâm Đồng', 'Lạng Sơn', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sơn La', 'Thanh Hóa', 'Thái Nguyên', 'Tuyên Quang', 'Tây Ninh', 'Vĩnh Long', 'Điện Biên', 'Đắk Lắk', 'Đồng Nai', 'Đồng Tháp', 'Quốc tế / International'],
  },
  {
    key: 'currency', label: 'Salary currency', i18n: '—', used: 'Job form (salary range) · Candidate expected salary',
    note: 'TWO entries only, and this list must not grow. A JPY or RUB salary is unfilterable, unrankable and unmaintainable on a VN board. USD is a DISPLAY denomination — payroll settles in VND either way. Separate from the BILLING currency owned by the billing BC: what you invoice a customer in has nothing to do with what a job pays.', kind: 'flat',
    entries: ['VND', 'USD'],
  },
  {
    key: 'company-tag', label: 'Company tag', i18n: 'vi · en', used: 'Company profile · Store filter (tags)',
    note: 'Editorial labels applied to a company (a company can carry several). Displayed as tags on the Company site. Free-growing list — start with the two below.', kind: 'tags',
    entries: ['Korean company', 'Big company'],
  },
  {
    key: 'image-topic', label: 'Image topic', i18n: 'vi · en', used: 'Image gallery · job picture picker',
    note: 'WHAT A PICTURE SHOWS — the gallery is classified on this, not on industry, because a photograph is a scene and industry is a fact about the employer. Industry reaches the pictures through the industry → topic map beside the gallery, so this list stays small and does not grow when the industry list does.', kind: 'flat',
    entries: ['Văn phòng', 'Kỹ thuật', 'Nhà máy · sản xuất', 'Nhà xưởng · ngoại cảnh', 'Kho vận', 'Vận tải', 'Công trường', 'Bán lẻ · cửa hàng', 'Sản phẩm · bao bì', 'Y tế · chăm sóc', 'Nghiên cứu · phòng lab', 'Lớp học · đào tạo', 'Nhà hàng · khách sạn', 'Công nghệ', 'Dữ liệu · biểu đồ', 'Nhóm người', 'Toà nhà · kiến trúc', 'Thiên nhiên · môi trường', 'Trừu tượng · nền'],
  },
]
