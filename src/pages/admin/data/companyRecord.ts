/*
 * Per-company mock data behind the record tabs: jobs, applicants, contact people,
 * login users, permissions and the activity feed.
 */
import { coKey, coValue, fmtIdle, isCustomer } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { PLACEMENT_POS } from '@/pages/admin/data/content'
import { CATALOG } from '@/pages/admin/data/products'
import { SERVICE_USAGE } from '@/pages/admin/data/services'
import type { ServiceEntitlement } from '@/pages/admin/data/services'
import { vnd } from '@/pages/admin/lib/fmt'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── What a company holds, product by product ─────────────────────────────────
   ONE FLAT LIST, grouped by product TYPE — job · CV search · display · manual
   service — and NOT by purchase order.

   The product is what the reader came for ("how many CV unlocks are left?"), so the
   product name and its quota are the headline and the PO that bought it is a small
   line underneath. Grouping by PO instead put a document number where the answer
   should be, and forced a reader who wanted one number to first work out which
   order paid for it.

   Two things carry NO PO, and they are separated at the end of the list for exactly
   that reason:

     TẶNG      a gifted posting. Negotiated, not ordered — no PO line, no quota.
     TIN FREE  Admin posts a job with no PO selected. Any time, unlimited.

   There is no grand total. "12/50 slots across 2 POs" is a number nobody quotes: a
   rep quotes what is left on the line that is still valid, and the lines expire on
   different days. */
export type EntType = 'job' | 'cv' | 'placement' | 'service' | 'none'
export type Ent = {
  type: EntType
  name: string
  /** null when the item genuinely HAS no quota — a gift, a free job */
  left: number | null
  total: number | null
  unit: string
  /** the order that bought it. Absent on a gift or a free job, and that is the point. */
  po?: string
  invoiced?: string
  until?: string
  /** manual services carry their delivery log, so it opens where the quota is shown */
  svc?: ServiceEntitlement
  /** For a FREE row there is no quota to count down, so it reports the one fact the
      quota rows also report: how many postings were made. Deliberately NOT whether
      they are still running — a posting counts the moment it goes up, here exactly as
      it does for a paid slot. */
  posts?: number
}

/** Split one quota across n buckets so the parts always sum to the whole, draining
    bucket 1 first (= the soonest to expire). */
function splitQuota(total: number, left: number, n: number): { total: number; left: number }[] {
  const per = Math.ceil(total / n)
  const out: { total: number; left: number }[] = []
  let used = total - left
  for (let i = 0; i < n; i++) {
    const t = i === n - 1 ? total - per * (n - 1) : per
    const u = Math.min(used, t)
    used -= u
    out.push({ total: t, left: t - u })
  }
  return out
}

/** How many live POs this company holds. Big books carry a renewal alongside the
    original — which is the case the per-PO line exists for. */
const poCount = (c: Company) => (c.jobTotal >= 30 ? 2 : 1)
const jobPoOf = (c: Company, i: number) =>
  i === 0 ? `PO-${String(5500 + (coKey(c) % 400)).padStart(6, '0')}-07-2026` : `PO-${String(5900 + (coKey(c) % 90)).padStart(6, '0')}-08-2026`

/** A gifted posting. Kept as data rather than a flag so it can be named — at renewal
    a rep has to know what the customer got for nothing. */
const GIFTS: Record<string, string[]> = { 'FPT Software': ['Tin đăng Basic (Tặng)'] }

export function entitlements(c: Company): Ent[] {
  const out: Ent[] = []
  const n = poCount(c)
  const jobs = c.jobPosting ? splitQuota(c.jobTotal, c.jobLeft, n) : []
  for (let i = 0; i < n && c.jobPosting; i++) {
    out.push({
      type: 'job',
      name: i === 0 ? 'Job Posting — Pro' : 'Job Posting — Pro (gia hạn)',
      left: jobs[i].left, total: jobs[i].total, unit: 'slots',
      po: jobPoOf(c, i),
      invoiced: i === 0 ? (c.since && c.since !== '—' ? c.since : '—') : '15/06/2026',
      until: i === 0 ? '31/10/2026' : '31/12/2026',
    })
  }
  // CV search hangs off the LAST job PO, so the list answers "which order bought the
  // unlocks?" instead of implying every order did.
  if (c.resumeSearch) {
    out.push({
      type: 'cv', name: `COMBO ${c.cvTotal} — mở CV`, left: c.cvLeft, total: c.cvTotal, unit: 'CV unlocks',
      po: jobPoOf(c, n - 1), invoiced: n > 1 ? '15/06/2026' : (c.since !== '—' ? c.since : '—'), until: n > 1 ? '31/12/2026' : '31/10/2026',
    })
  }
  // Display / placement bookings — bought by the line, spent by the booking.
  for (const po of PLACEMENT_POS[c.name] ?? []) {
    for (const l of po.lines) {
      const prod = CATALOG.find((x) => x.sku === l.sku)
      out.push({
        type: 'placement', name: prod?.name ?? l.sku, left: l.qty - l.used, total: l.qty, unit: 'lượt đặt',
        po: po.po, invoiced: po.invoiced ?? undefined, until: po.invoiced ? undefined : undefined,
      })
    }
  }
  // Manual services — same shape as everything else, plus their delivery log.
  for (const e of SERVICE_USAGE[c.name] ?? []) {
    out.push({ type: 'service', name: e.name, left: e.total - e.entries.length, total: e.total, unit: e.unit, po: e.po, until: e.validUntil, svc: e })
  }
  /* JOB FREE — no PO, no quota. Reported by the count of postings it produced, and
     by nothing else: a quota row records that a job was posted, so a free row records
     the same thing. Whether the posting is still running belongs to the Jobs tab,
     where every job's status already lives. */
  const posted = companyJobs(c)
  const gift = posted.filter((j) => j.gift).length
  if (gift > 0 || (GIFTS[c.name] ?? []).length > 0) {
    out.push({ type: 'none', name: (GIFTS[c.name] ?? ['Tin đăng (Tặng)'])[0], left: null, total: null, unit: '', posts: gift })
  }
  const free = posted.filter((j) => j.free).length
  if (free > 0) out.push({ type: 'none', name: 'Tin Free (Admin đăng hộ)', left: null, total: null, unit: '', posts: free })
  return out
}

/** the PO codes this company's entitlement came from, in list order */
const entPos = (c: Company) => [...new Set(entitlements(c).map((e) => e.po).filter((x): x is string => Boolean(x)))]

/* A free job — posted by Admin with NO PO selected. Not a bucket, not a quota, no
   expiry of its own beyond the product's own 14 days: just the absence of a PO, which
   is exactly how it is created. Rendered on the job row so a reader can tell at a
   glance which postings were never paid for. */
export const FREE_JOB = { label: 'Job free · không PO' }

/** Which PO a given job was posted against.

    Attribution follows the deduction rule — soonest expiry first — so this column and
    the numbers on the billing tab are two readings of one arithmetic.

    The mock job list is a SAMPLE (FPT shows 6 jobs against 38 consumed slots), so the
    listed jobs are shared out in the same PROPORTION as the real consumption. In the
    product this is a stored `entitlementId` on the job — one column, written when the
    posting is created, never recomputed. */
export function jobSources(c: Company): ({ label: string; until?: string } | undefined)[] {
  const js = companyJobs(c)
  const isFree = js.map((j) => Boolean(j.free || j.gift))
  const jobEnts = entitlements(c).filter((e) => e.type === 'job')
  if (jobEnts.length === 0 || js.length === 0) return js.map((_, i) => (isFree[i] ? FREE_JOB : undefined))
  if (jobEnts.length === 1) return js.map((_, i) => (isFree[i] ? FREE_JOB : { label: jobEnts[0].po!, until: jobEnts[0].until }))

  const consumed = jobEnts.map((e) => (e.total ?? 0) - (e.left ?? 0))
  const totalConsumed = consumed.reduce((a, b) => a + b, 0) || 1
  const paid = js.filter((_, i) => !isFree[i]).length
  const seats = consumed.map((x) => Math.round((x / totalConsumed) * paid))
  let slack = paid - seats.reduce((a, b) => a + b, 0)
  for (let i = 0; slack !== 0 && i < seats.length; i++) {
    const d = slack > 0 ? 1 : -1
    if (seats[i] + d >= 0) { seats[i] += d; slack -= d }
  }
  const day = (d: string) => { const [dd, mm, yy] = d.split('/').map(Number); return (yy || 0) * 10000 + (mm || 0) * 100 + (dd || 0) }
  const order = js.map((_, i) => i).filter((i) => !isFree[i]).sort((a, b) => day(js[a].posted) - day(js[b].posted))
  const out: ({ label: string; until?: string } | undefined)[] = js.map((_, i) => (isFree[i] ? FREE_JOB : undefined))
  let si = 0
  for (const i of order) {
    while (si < jobEnts.length - 1 && seats[si] <= 0) si++
    out[i] = { label: jobEnts[si].po!, until: jobEnts[si].until }
    seats[si]--
  }
  return out
}

/** One row per PURCHASE ORDER — what was bought on it, for how much, when the VAT
    invoice went out, and when it runs out.

    DERIVED from the same entitlement list the quota card renders, so the two can
    never disagree about which order paid for what. */
export function poHistory(c: Company): { po: string; products: string; amount: string; invoiced: string | null; until: string | null }[] {
  type PoRow = { po: string; products: string; amount: string; invoiced: string | null; until: string | null }
  const ents = entitlements(c)
  const rows: PoRow[] = entPos(c).map((po) => {
    const on = ents.filter((e) => e.po === po)
    return {
      po,
      products: on.map((e) => e.name).join(' · '),
      amount: vnd(on.some((e) => e.type === 'cv') ? 35_000_000 : 15_000_000),
      invoiced: on.find((e) => e.invoiced)?.invoiced ?? null,
      until: on.find((e) => e.until)?.until ?? null,
    }
  })
  const k = coKey(c)
  // The previous period's order — history a renewal call opens with.
  if (isCustomer(c)) {
    rows.push({ po: `PO-${String(4900 + (k % 200)).padStart(6, '0')}-01-2025`, products: 'Job Posting — Basic (5 slots)', amount: '6,100,000 ₫', invoiced: '12/01/2025', until: '31/12/2025' })
  }
  if (c.account === 'Churn') {
    rows.push({ po: `PO-${String(5100 + (k % 300)).padStart(6, '0')}-12-2024`, products: 'Job Posting — Pro · Resume Search', amount: '35,000,000 ₫', invoiced: '20/12/2024', until: '31/12/2025' })
  }
  return rows
}

export const MAX_SEATS = 4

/* ── per-company mock data (jobs · team · activity) ───────────────────────── */
type CoJob = {
  title: string; status: StatusTone; statusLabel: string; applicants: number; posted: string; deadline: string
  /** posted by Admin with no PO selected — the Tin Free product. No quota touched. */
  free?: boolean
  /** posted on a gifted line negotiated into a PO. Also free, also no quota. */
  gift?: boolean
}
const COMPANY_JOBS: Record<string, CoJob[]> = {
  // A FREE job: Admin posted it without selecting a PO. The company has no product
  // and no quota, and the record has to say so — or a renewal call opens with the
  // wrong assumption about what this customer has paid for.
  'Công ty CP Bình Minh': [
    { title: 'Giáo viên Tiếng Anh (Tiểu học)', status: 'open', statusLabel: 'Open', applicants: 9, posted: '16/07/2026', deadline: '31/08/2026', free: true },
  ],
  'Công ty TNHH Vạn Phát': [
    { title: 'Điều dưỡng viên (Khoa Nội)', status: 'open', statusLabel: 'Open', applicants: 14, posted: '02/07/2026', deadline: '31/08/2026' },
    { title: 'Bác sĩ Đa khoa', status: 'open', statusLabel: 'Open', applicants: 6, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Kế toán viện phí', status: 'open', statusLabel: 'Open', applicants: 0, posted: '20/07/2026', deadline: '15/09/2026' },
    { title: 'Lễ tân bệnh viện', status: 'closed', statusLabel: 'Closed', applicants: 31, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'FPT Software': [
    // The free jobs on the worked example: no PO, no quota, beside 5 paid ones. One
    // still running and one already closed, so the row can say which is which.
    { title: 'Thực tập sinh Kiểm thử (QA Intern)', status: 'open', statusLabel: 'Open', applicants: 3, posted: '01/08/2026', deadline: '30/09/2026', free: true },
    { title: 'Nhân viên Hành chính — Văn phòng HN', status: 'closed', statusLabel: 'Closed', applicants: 22, posted: '02/05/2026', deadline: '30/06/2026', gift: true },
    { title: 'Senior Frontend Engineer (ReactJS)', status: 'open', statusLabel: 'Open', applicants: 0, posted: '24/07/2026', deadline: '31/08/2026' },
    { title: 'Java Developer (Spring Boot)', status: 'open', statusLabel: 'Open', applicants: 52, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Business Analyst', status: 'open', statusLabel: 'Open', applicants: 28, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Comtor tiếng Nhật (BrSE)', status: 'open', statusLabel: 'Open', applicants: 11, posted: '01/07/2026', deadline: '31/08/2026' },
    { title: 'DevOps Engineer', status: 'open', statusLabel: 'Open', applicants: 19, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'QA Automation Engineer', status: 'closed', statusLabel: 'Closed', applicants: 40, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Tiki': [
    { title: 'Digital Marketing Lead', status: 'open', statusLabel: 'Open', applicants: 42, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Product Manager', status: 'open', statusLabel: 'Open', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Backend Engineer (Go)', status: 'open', statusLabel: 'Open', applicants: 33, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Data Analyst', status: 'open', statusLabel: 'Open', applicants: 25, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên Kho vận', status: 'open', statusLabel: 'Open', applicants: 0, posted: '22/07/2026', deadline: '20/09/2026' },
    { title: 'Category Manager', status: 'closed', statusLabel: 'Closed', applicants: 47, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Công ty TNHH Đại Dương': [
    { title: 'Nhân viên Kinh doanh Thủy sản', status: 'open', statusLabel: 'Open', applicants: 9, posted: '20/06/2026', deadline: '31/08/2026' },
    { title: 'Kỹ sư Nuôi trồng Thủy sản', status: 'open', statusLabel: 'Open', applicants: 4, posted: '15/06/2026', deadline: '15/09/2026' },
    { title: 'Nhân viên QC (Chế biến)', status: 'closed', statusLabel: 'Closed', applicants: 22, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'VNG Corporation': [
    { title: 'Kế toán tổng hợp', status: 'schedule', statusLabel: 'Schedule', applicants: 0, posted: '—', deadline: '20/09/2026' },
    { title: 'Game Product Manager', status: 'open', statusLabel: 'Open', applicants: 36, posted: '12/07/2026', deadline: '12/09/2026' },
    { title: 'Backend Engineer (Golang)', status: 'open', statusLabel: 'Open', applicants: 44, posted: '08/07/2026', deadline: '08/09/2026' },
    { title: 'Data Engineer', status: 'open', statusLabel: 'Open', applicants: 17, posted: '30/06/2026', deadline: '31/08/2026' },
    { title: 'UI/UX Designer', status: 'open', statusLabel: 'Open', applicants: 23, posted: '25/06/2026', deadline: '25/08/2026' },
    { title: 'Chuyên viên Tuyển dụng', status: 'closed', statusLabel: 'Closed', applicants: 58, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'MoMo': [
    { title: 'Product Manager', status: 'open', statusLabel: 'Open', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Risk & Fraud Analyst', status: 'open', statusLabel: 'Open', applicants: 12, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Android Engineer (Kotlin)', status: 'open', statusLabel: 'Open', applicants: 29, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên CSKH (Hotline)', status: 'open', statusLabel: 'Open', applicants: 61, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'Kế toán thanh toán', status: 'draft', statusLabel: 'Draft', applicants: 0, posted: '—', deadline: '—' },
  ],
  'Thế Giới Di Động': [
    { title: 'Nhân viên Kinh doanh (Chuỗi cửa hàng)', status: 'open', statusLabel: 'Open', applicants: 128, posted: '22/07/2026', deadline: '30/09/2026' },
    { title: 'Quản lý Cửa hàng — HCMC', status: 'open', statusLabel: 'Open', applicants: 47, posted: '18/07/2026', deadline: '18/09/2026' },
    { title: 'Kỹ thuật viên Bảo hành', status: 'open', statusLabel: 'Open', applicants: 63, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Nhân viên Kho vận', status: 'open', statusLabel: 'Open', applicants: 84, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Chuyên viên Đào tạo Nội bộ', status: 'schedule', statusLabel: 'Schedule', applicants: 0, posted: '—', deadline: '01/10/2026' },
    { title: 'Thu ngân (Part-time)', status: 'closed', statusLabel: 'Closed', applicants: 96, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Công ty CP Thành Đạt': [
    { title: 'Kỹ sư Xây dựng (Giám sát công trình)', status: 'open', statusLabel: 'Open', applicants: 7, posted: '14/07/2026', deadline: '14/09/2026' },
    { title: 'Kỹ sư Dự toán', status: 'open', statusLabel: 'Open', applicants: 3, posted: '12/07/2026', deadline: '12/09/2026' },
    { title: 'Nhân viên An toàn Lao động', status: 'draft', statusLabel: 'Draft', applicants: 0, posted: '—', deadline: '—' },
  ],
}
export const companyJobs = (c: Company) => COMPANY_JOBS[c.name] ?? []

/* Applications received (employer view — like the Company site) */
type CoApplicant = { name: string; job: string; applied: string; tone: StatusTone; stage: string }
const APPLICANT_NAMES = ['Trần Văn Hùng', 'Nguyễn Thị Mai', 'Lê Hoàng Nam', 'Phạm Thu Trang', 'Đỗ Minh Quân', 'Vũ Thị Hồng', 'Bùi Đức Anh']
const APPLICANT_STAGES: { tone: StatusTone; stage: string }[] = [
  { tone: 'schedule', stage: 'Shortlisted' }, { tone: 'pending', stage: 'Reviewing' }, { tone: 'neutral', stage: 'New' },
  { tone: 'active', stage: 'Interview' }, { tone: 'rejected', stage: 'Rejected' }, { tone: 'neutral', stage: 'New' }, { tone: 'pending', stage: 'Reviewing' },
]
const APPLICANT_WHEN = ['2 days ago', '3 days ago', '5 days ago', '1 week ago', '1 week ago', '2 weeks ago', '2 weeks ago']
export const companyApplicants = (c: Company): CoApplicant[] => {
  const js = companyJobs(c)
  if (!js.length) return []
  return APPLICANT_NAMES.map((n, i) => ({ name: n, job: js[i % js.length].title, applied: APPLICANT_WHEN[i], tone: APPLICANT_STAGES[i].tone, stage: APPLICANT_STAGES[i].stage }))
}

/* Resume unlocks / opens (employer view — like the Company site) */
type CoResumeView = { name: string; headline: string; when: string; by: string }
export const companyResumeViews = (c: Company): CoResumeView[] => {
  if (!c.resumeSearch) return []
  const mgr = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  return [
    { name: 'Hoàng Thị Lan Anh', headline: 'Kế toán trưởng · 8 năm KN', when: '1 hour ago', by: mgr },
    { name: 'Nguyễn Đức Thắng', headline: 'Kỹ sư Cơ khí · 5 năm KN', when: '3 hours ago', by: mgr },
    { name: 'Trần Bảo Ngọc', headline: 'Nhân viên Marketing · 3 năm KN', when: 'Yesterday', by: 'Đỗ Thị Mai' },
    { name: 'Lý Quốc Khánh', headline: 'Chuyên viên Nhân sự · 6 năm KN', when: '2 days ago', by: mgr },
    { name: 'Phan Thị Hương', headline: 'Nhân viên Kinh doanh · 4 năm KN', when: '3 days ago', by: 'Đỗ Thị Mai' },
  ]
}

/* ── CONTACT PEOPLE vs LOGIN USERS ───────────────────────────────────────────
   Two different populations on the same company, deliberately INDEPENDENT:

     Contact  a person we do business with. Owned by Sales, lives in the CRM, and
              may have no login at all — a CFO who signs off, an accountant who
              receives invoices, a receptionist who takes the call.
     User     a login on the Company site. Consumes one of the 4 seats, owned by
              the customer's HR Manager, and may be someone Sales never met.

   They overlap often (the HR Manager is usually both) but neither implies the
   other, so one is NEVER auto-created from the other. A contact may optionally be
   LINKED to a user record; the link is informational, not a dependency. */
/* FIVE statuses, not nine. Each answers "what do I do about this person NOW?", and
   two statuses that lead to the SAME action are one status:
     on leave + asked-us-to-come-back   → Paused          (both: wait, with a date)
     left + retired + moved department   → No longer here  (all: find the successor)
     never verified + email now bouncing → Needs verifying (both: fix the details)
   The sub-reason ("nghỉ hưu" vs "chuyển phòng ban") goes in the note, where a human
   reads it — rather than multiplying statuses that behave identically. */
export type ContactStatus = 'Active' | 'Needs verifying' | 'Paused' | 'No longer here' | 'Do not contact'
export const CONTACT_STATUS: Record<ContactStatus, { tone: StatusTone; vi: string; hint: string; action: string }> = {
  Active: {
    tone: 'active', vi: 'Đang liên hệ',
    hint: 'Our working contact — reachable and expecting to hear from us.',
    action: 'Call or email as normal.',
  },
  'Needs verifying': {
    tone: 'pending', vi: 'Cần xác minh',
    hint: 'Details not confirmed — from a name card or web form, or the email has started bouncing.',
    action: 'Confirm email + phone before this contact goes on a quotation.',
  },
  Paused: {
    tone: 'schedule', vi: 'Tạm dừng liên hệ',
    hint: 'On leave, or they asked us to come back later. Still our contact, just not now.',
    action: 'Do not chase until the resume date; use the cover person if urgent.',
  },
  'No longer here': {
    tone: 'expired', vi: 'Không còn phụ trách',
    hint: 'Left the company, retired, or moved department — either way they no longer buy from us.',
    action: 'Find the successor. If you know where they went, that is a warm lead.',
  },
  'Do not contact': {
    tone: 'rejected', vi: 'Không liên hệ',
    hint: 'They asked not to be contacted. A compliance flag, not an opinion.',
    action: 'No outreach at all, manual or automated. Only a manager can clear it.',
  },
}
export type CoContact = {
  name: string; title: string; email: string; phone: string
  status: ContactStatus; primary?: boolean; decisionMaker?: boolean
  /** receives every quotation / invoice — usually the accountant, rarely the buyer */
  billing?: boolean
  /** where a "No longer here" contact went, when we know — a warm lead at the new employer */
  movedTo?: string
  /** the date a "Paused" contact should be approached again */
  snoozedUntil?: string
  /** email of the login user this person is the same human as, when they have one */
  linkedUser?: string
  /** ONE free-text note per contact — the human context a status can never carry:
      how they prefer to be reached, who they defer to, what went wrong last time. */
  note: string
  /** when we last spoke to THIS person (the company's Idle is the newest of these) */
  lastContact: string
}

/* Demo contacts: always the primary from the CRM record, plus a realistic spread
   of the awkward states — someone who left, someone who moved desk, an unlinked
   finance contact who will never need a login. */
export function companyContacts(c: Company): CoContact[] {
  const person = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const title = c.contact.split(' · ')[1] ?? 'HR'
  const local = (n: string) =>
    n.split(' ').pop()!.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '')
  const out: CoContact[] = [
    { name: person, title, email: `${local(person)}@${c.domain}`, phone: '09xx xxx xxx', status: 'Active', primary: true, decisionMaker: true, linkedUser: `${local(person)}@${c.domain}`, note: 'Prefers Zalo over email. Signs off up to 100M ₫ alone; above that needs the GD.', lastContact: '2 days ago' },
    // finance contact: receives every invoice, never needs to log in
    { name: 'Phạm Kế Toán', title: 'Kế toán trưởng / Chief accountant', email: `ketoan@${c.domain}`, phone: '09xx xxx xxx', status: 'Active', billing: true, note: 'Only wants the VAT invoice + MST — do not send sales material. Reachable 8–17h.', lastContact: '3 weeks ago' },
  ]
  if (isCustomer(c)) {
    out.push({ name: 'Đỗ Thị Mai', title: 'HR Specialist', email: `mai@${c.domain}`, phone: '09xx xxx xxx', status: 'Active', linkedUser: `mai@${c.domain}`, note: 'Day-to-day poster of jobs. Ask her for the hiring plan before quoting a renewal.', lastContact: '5 days ago' })
    // the classic churn cause: the person who bought from us left, and nobody told Sales
    out.push({ name: 'Trần Cũ', title: 'HR Manager (cũ)', email: `tran@${c.domain}`, phone: '—', status: 'No longer here', movedTo: 'Công ty CP Vạn Phát', note: 'Đã nghỉ việc 06/2026. Bought the first package from us — nobody told Sales, which is why the renewal slipped.', lastContact: '4 months ago' })
  }
  if (c.size === '5000+' || c.jobs > 15) {
    out.push({ name: 'Nguyễn Điều Chuyển', title: 'Trưởng phòng Tuyển dụng', email: `chuyen@${c.domain}`, phone: '09xx xxx xxx', status: 'No longer here', note: 'Đã chuyển sang phòng Đào tạo. Still friendly — happy to introduce the new TA lead.', lastContact: '6 weeks ago' })
    out.push({ name: 'Vũ Mới Nhập', title: 'Chuyên viên Tuyển dụng', email: `moi@${c.domain}`, phone: '09xx xxx xxx', status: 'Needs verifying', note: 'Captured from a name card at the 07/2026 job fair — email not confirmed yet.', lastContact: '—' })
  }
  if (c.account === 'Churn') {
    out.push({ name: 'Lê Không Phản Hồi', title: 'Giám đốc Nhân sự', email: `le@${c.domain}`, phone: '09xx xxx xxx', status: 'Needs verifying', note: 'Email bounced twice, phone rings out. Try the switchboard or LinkedIn.', lastContact: '5 months ago' })
    out.push({ name: 'Hoàng Hẹn Lại', title: 'Trưởng phòng HCNS', email: `hoang@${c.domain}`, phone: '09xx xxx xxx', status: 'Paused', snoozedUntil: '01/10/2026', note: 'Budget frozen until Q4. Asked us to come back after 01/10 — do not chase before that.', lastContact: '2 months ago' })
  }
  return out
}

export type CoUserRole = 'Admin' | 'Recruiter' | 'Viewer'
type CoTeamUser = { name: string; email: string; role: CoUserRole; status: 'Active' | 'Invited'; last: string }
export function companyTeam(c: Company): CoTeamUser[] {
  const noProducts = !c.jobPosting && !c.resumeSearch
  const managerName = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const localPart = (n: string) =>
    n.split(' ').pop()!.toLowerCase()
      .replace(/đ/g, 'd').replace(/ơ/g, 'o').replace(/ư/g, 'u')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const base: Omit<CoTeamUser, 'email'>[] = [{ name: managerName, role: 'Admin', status: 'Active', last: '10m ago' }]
  if (isCustomer(c) && !noProducts) {
    base.push({ name: 'Đỗ Thị Mai', role: 'Recruiter', status: 'Active', last: '2h ago' })
    if (c.size === '5000+' || c.jobs > 15) {
      base.push({ name: 'Ngô Minh Tú', role: 'Recruiter', status: 'Active', last: '1d ago' })
      base.push({ name: 'Lê Thanh Sơn', role: 'Viewer', status: 'Invited', last: '—' })
    }
  }
  return base.map((u) => ({ ...u, email: `${localPart(u.name)}@${c.domain}` }))
}

/* ── Company roles — built from a short permission set, then assigned ──────────
   The VietnamWorks "build a role, then set users" flow, trimmed to 7 permissions
   across the 3 modules. Prerequisites auto-include so a role can never be invalid.
   "Manage users & roles" is NOT tickable — it lives on the fixed Admin role. */
export type CoPermKey = 'jobs.view' | 'jobs.post' | 'jobs.edit' | 'apps.view' | 'apps.move' | 'resume.search' | 'resume.unlock'
export const CO_PERM_GROUPS: { module: string; perms: { key: CoPermKey; label: string; needs?: CoPermKey }[] }[] = [
  { module: 'Job posts', perms: [
    { key: 'jobs.view', label: 'View jobs' },
    { key: 'jobs.post', label: 'Post jobs', needs: 'jobs.view' },
    { key: 'jobs.edit', label: 'Edit jobs', needs: 'jobs.view' },
  ] },
  { module: 'Applications', perms: [
    { key: 'apps.view', label: 'View applications & CVs' },
    { key: 'apps.move', label: 'Manage applications', needs: 'apps.view' },
  ] },
  { module: 'Resume search', perms: [
    { key: 'resume.search', label: 'Search resumes' },
    { key: 'resume.unlock', label: 'View / unlock resume detail', needs: 'resume.search' },
  ] },
]
export const CO_ALL_PERMS: CoPermKey[] = CO_PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.key))
export const CO_NEEDS: Partial<Record<CoPermKey, CoPermKey>> = Object.fromEntries(
  CO_PERM_GROUPS.flatMap((g) => g.perms.filter((p) => p.needs).map((p) => [p.key, p.needs])),
) as Partial<Record<CoPermKey, CoPermKey>>

/* Admin is the one fixed, highest role (all access + manage users) and cannot be
   edited. EVERY other role is a custom role the Admin builds and can edit. */
export type CoRoleDef = { name: string; admin?: boolean; perms: CoPermKey[] }
export const CO_ROLE_DEFS: CoRoleDef[] = [
  { name: 'Admin', admin: true, perms: CO_ALL_PERMS },
  { name: 'Recruiter', perms: [...CO_ALL_PERMS] },
  { name: 'Viewer', perms: ['jobs.view', 'apps.view'] },
]

export function coTogglePerm(perms: CoPermKey[], key: CoPermKey): CoPermKey[] {
  if (!perms.includes(key)) {
    const next = new Set(perms)
    let k: CoPermKey | undefined = key
    while (k) { next.add(k); k = CO_NEEDS[k] }
    return CO_ALL_PERMS.filter((p) => next.has(p))
  }
  const drop = new Set<CoPermKey>([key])
  let changed = true
  while (changed) {
    changed = false
    for (const p of CO_ALL_PERMS) {
      const n = CO_NEEDS[p]
      if (n && drop.has(n) && !drop.has(p)) { drop.add(p); changed = true }
    }
  }
  return perms.filter((p) => !drop.has(p))
}

/* ── Company activity feed ───────────────────────────────────────────────────
   ONE merged trail of everything that ever happened on this account, typed by WHO
   caused it so it can be filtered and so Idle stays honest:

     sales   a human on OUR side did it — chat, call, quotation/PO sent
     client  the CUSTOMER did it — posted a job, opened a CV, paid, invited a user
     system  automatic — invoice issued, products provisioned, quota warnings

   IDLE counts from the newest SALES row only. That is the rule that matters: a
   client opening a CV or the system issuing an invoice must never make a silent
   account look freshly contacted. Everything is visible; only sales resets the clock. */
export type CoKind = 'sales' | 'client' | 'system'
/* `by` is the ACCOUNT that performed the activity — not the company's sales owner.
   A colleague who covers a call while the owner is busy is the one who did the work,
   so they are the one shown here and the one the KPI counts. `atts` are the files
   carried by the row (screenshots of a Zalo thread, a forwarded email, meeting
   photos); they are part of the record, not a separate document library. */
export type CoAtt = { kind: 'image' | 'email' | 'file'; label: string }
export type CoEvent = { icon: string; tone: string; title: string; time: string; sub: string; kind: CoKind; days: number; by: string; atts?: CoAtt[] }

export const CHAT = 'bg-sky-100 text-sky-700'
export const CALL = 'bg-emerald-100 text-emerald-700'
export const MEET = 'bg-indigo-100 text-indigo-700'
export const DOC = 'bg-violet-100 text-violet-700'
const CLIENT = 'bg-amber-100 text-amber-700'
const SYS = 'bg-slate-100 text-slate-600'

export const KIND_META: Record<CoKind, { label: string; hint: string }> = {
  sales: { label: 'Sales', hint: 'what we did — resets Idle' },
  client: { label: 'Client', hint: 'what the customer did' },
  system: { label: 'System', hint: 'automatic events' },
}

export function companyActivity(c: Company): CoEvent[] {
  const contact = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const rep = c.owner.split(' ').slice(-2).join(' ')
  // No contact has ever been logged — a real state, and the highest-priority
  // follow-up. An empty trail says that far better than inventing history.
  if (c.idle === null) return []
  const last = c.idle
  const ev: CoEvent[] = []
  /* Who did it: our own rows are performed by a named colleague — usually the owner,
     but not always, which is the whole point of showing it. Client rows are performed
     by the contact on their side; system rows by the system. */
  const cover = 'Đỗ Minh Quân'
  const add = (days: number, kind: CoKind, icon: string, tone: string, title: string, sub: string, by?: string, atts?: CoAtt[]) =>
    ev.push({ days, kind, icon, tone, title, sub, by: by ?? (kind === 'sales' ? rep : kind === 'client' ? contact : 'System'), time: `${fmtIdle(days)} ago`, atts })

  if (c.account === 'Churn') {
    add(last, 'sales', '', CALL, 'Call · win-back', `${rep} called ${contact} — ${c.note.toLowerCase()} Agreed to revisit.`, cover)
    add(last + 20, 'system', '', SYS, 'Subscription expired', 'All quota lapsed — the account is read-only until it is renewed.')
    add(last + 34, 'sales', '', CHAT, 'Chat · Email', `${rep} sent a renewal reminder to ${contact} — no reply.`)
    add(last + 61, 'sales', '', DOC, 'Renewal quotation sent', `Sent to ${contact}; the quotation lapsed unanswered.`)
    add(last + 92, 'client', '', CLIENT, 'Last CV unlocked', `${contact} opened a candidate — the final use before they went quiet.`)
    add(last + 150, 'system', '', SYS, 'Payment confirmed', 'Accounting matched the bank transfer for the previous term.')
    return ev.sort((x, y) => x.days - y.days)
  }

  // ── sales side: chats, calls and the documents we sent ────────────────────
  add(last, 'sales', '', CHAT, 'Chat · Zalo', `${rep} messaged ${contact} — next step: ${c.nextStep.toLowerCase()}.`, undefined,
    [{ kind: 'image', label: 'zalo-01.png' }, { kind: 'image', label: 'zalo-02.png' }, { kind: 'image', label: 'bao-gia.jpg' }])
  add(last + 6, 'sales', '', MEET, 'Meeting · at their office', `Package options walked through with ${contact} and the finance lead. 60 phút · 14:00 20/07/2026.`, cover,
    [{ kind: 'email', label: 'RE- Báo giá tháng 7.eml' }, { kind: 'image', label: 'bien-ban-hop.jpg' }])
  if (c.status === 'PO' || c.status === 'Invoice') {
    add(last + 9, 'sales', '', DOC, 'Purchase order issued', `${contact} confirmed the accepted option; PO issued by ${rep} — active until the end of the month.`)
  }
  if (c.status !== 'Qualified') {
    add(last + 21, 'sales', '', DOC, 'Quotation sent', `${rep} sent the priced options to ${contact}.`)
  }
  add(last + 38, 'sales', '', CALL, 'Call · discovery', `${rep} called ${contact} — logged via Calio, need and budget qualified.`)
  add(last + 52, 'sales', '', CHAT, 'Chat · Email', `First outreach to ${contact}.`)

  // ── the money + provisioning chain, once they are a customer ──────────────
  if (isCustomer(c)) {
    add(last + 4, 'client', '', CLIENT, 'Payment made', `${contact} transferred ${vnd(coValue(c))} for the order.`)
    add(last + 3, 'system', '', SYS, 'Payment confirmed', 'Accounting matched the transfer against the bank — invoicing unlocked.')
    add(last + 2, 'system', '', SYS, 'VAT e-invoice issued', 'Provider stamped the invoice; the 12-month activation window started.')
    add(last + 2, 'system', '', SYS, 'Products provisioned',
      [c.jobPosting && 'Job Posting', c.resumeSearch && 'Resume Search'].filter(Boolean).join(' + ') + ' — released from the paid invoice.')
    add(last + 1, 'system', '', SYS, 'Account activated', `Login created for ${contact} (Admin) · owner ${c.owner}.`)
  }

  // ── what the client themselves did on their site ──────────────────────────
  if (c.jobPosting) {
    add(Math.max(0, last - 2), 'client', '', CLIENT, 'Job published', `${contact} posted a role — ${c.jobTotal - c.jobLeft}/${c.jobTotal} posting slots used.`)
    add(Math.max(0, last - 1), 'client', '', CLIENT, 'Applications received', 'Candidates applied to the open roles — visible on the Applications tab.')
    if (c.hasPage) add(last + 30, 'system', '', SYS, 'Company page published', 'The public profile went live on the jobseeker site.')
    if (c.jobTotal && c.jobLeft / c.jobTotal < 0.3) {
      add(Math.max(0, last - 3), 'system', '', SYS, 'Posting quota low', `${c.jobLeft} of ${c.jobTotal} slots left — offer a top-up.`)
    }
  }
  if (c.resumeSearch) {
    add(Math.max(0, last - 1), 'client', '', CLIENT, 'CV unlocked (PII)', `${contact} opened a candidate — ${c.cvTotal - c.cvLeft}/${c.cvTotal} unlocks used · audited.`)
    add(Math.max(0, last - 4), 'client', '', CLIENT, 'Resume search run', 'Searched the CV pool — no unlock spent on a search itself.')
  }
  if (isCustomer(c)) {
    add(Math.max(0, last - 5), 'client', '', CLIENT, 'User invited', `${contact} invited a user (Recruiter) to the account.`)
    add(Math.max(0, last - 6), 'client', '', CLIENT, 'Signed in', `${contact} signed in to the company site.`)
  }

  return ev.sort((x, y) => x.days - y.days)
}

/* Sales activity log — compose a chat (channel + note) or a call (via Calio) */
export const CHAT_CHANNELS = ['Zalo', 'Facebook Messenger', 'Email', 'SMS', 'Zalo OA', 'Phone', 'Other']
export const CO_TABS = ['Overview', 'Yêu cầu nhận', 'Contacts', 'Users', 'Products & billing', 'Company page', 'Jobs', 'Applications', 'Resumes', 'Owner history', 'Activity'] as const
export type CoTab = (typeof CO_TABS)[number]
