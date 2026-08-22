/*
 * Reference data the create-job form reads: skill pools, role→skill suggestions.
 */
/* The benefit types declared on the COMPANY page. Every job of that company
   The benefit types declared on the COMPANY page — the DEFAULT SET a new job is
   prefilled with. It is a default, NOT a restriction: the job picker still offers
   every type and there is no cap, so a job freely adds position-specific ones on
   top of these. */
export const COMPANY_BENEFITS = ['insurance', 'health', 'bonus', 'salary-13th', 'allowance', 'paid-leave', 'training']

/* ── Job skills — ONE field ──────────────────────────────────────────────────
   A single list, drawn from the canonical Skill taxonomy (never free text — that
   is what lets a JD skill join to a CV skill).

   Skills RANK candidates, they do not exclude anyone: a flat list where every
   entry filtered would narrow the pool to nothing after four or five picks. The
   candidate line is there so an employer can see how rare their combination is
   before they publish. */
export const SKILL_POOL: { name: string; sel: number }[] = [
  { name: 'React', sel: 0.20 },
  { name: 'TypeScript', sel: 0.35 },
  { name: 'Node.js', sel: 0.30 },
  { name: 'Git', sel: 0.55 },
  { name: 'ASP.NET Core', sel: 0.10 },
  { name: '.NET', sel: 0.14 },
  { name: 'GraphQL', sel: 0.12 },
  { name: 'Docker', sel: 0.18 },
  { name: 'Kubernetes', sel: 0.06 },
  { name: 'AWS', sel: 0.15 },
  { name: 'Figma', sel: 0.22 },
]
export const BASE_POOL = 3200
export const SKILL_CAP = 10

/* Suggestions for the EMPLOYER, keyed on the job's own Job role — the same
   occupation↔skill map the candidate side reads, just entered from the job end
   instead of the desired-role end. ESSENTIAL rows first, then OPTIONAL; that
   flag is already on the client's occupation_skill table, so the ordering costs
   no demand data and no new backend. */
export const ROLE_SKILL_MAP: Record<string, { name: string; essential: boolean }[]> = {
  'Software Developer': [
    { name: 'Git', essential: true },
    { name: 'TypeScript', essential: true },
    { name: 'React', essential: true },
    { name: 'Node.js', essential: true },
    { name: 'Docker', essential: false },
    { name: 'AWS', essential: false },
    { name: 'GraphQL', essential: false },
    { name: 'Kubernetes', essential: false },
  ],
  'DevOps Engineer': [
    { name: 'Docker', essential: true },
    { name: 'Kubernetes', essential: true },
    { name: 'AWS', essential: true },
    { name: 'Git', essential: true },
    { name: 'Node.js', essential: false },
  ],
}
export const SUGGEST_CAP = 6

/* ── Job detail (read-only) — opened by clicking a job title ─────────────────── */
/* Who saved this job. HQ asked to see the people behind the Saves number — a
   save is a demand signal, and a shortlist of warm candidates worth sourcing.
   Names are candidate PII, so opening one is an audited action like any resume view. */
type Saver = { name: string; title: string; exp: string; location: string; when: string; applied: boolean }
export const JOB_SAVERS: Saver[] = [
  { name: 'Nguyễn Văn An', title: 'Frontend Engineer', exp: '4 năm', location: 'Hồ Chí Minh', when: '2 giờ trước', applied: true },
  { name: 'Trần Thị Bích', title: 'Digital Marketing Executive', exp: '6 năm', location: 'Hà Nội', when: '5 giờ trước', applied: false },
  { name: 'Lê Hoàng Cường', title: 'Product Manager', exp: '8 năm', location: 'Hồ Chí Minh', when: '1 ngày trước', applied: false },
  { name: 'Phạm Thu Dung', title: 'Content Strategist', exp: '3 năm', location: 'Đà Nẵng', when: '2 ngày trước', applied: true },
  { name: 'Vũ Minh Đức', title: 'Growth Marketing', exp: '5 năm', location: 'Hồ Chí Minh', when: '3 ngày trước', applied: false },
]

export const TITLE_I18N: Record<'VI' | 'EN', string> = {
  VI: 'Trưởng nhóm kỹ thuật (.NET, tiếng Nhật N4+)',
  EN: 'Technical Leader / Technical Architect (.NET)',
}
