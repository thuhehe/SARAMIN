/*
 * Content & usage data: banners, popups, placement stock, and the search terms
 * that returned nothing.
 */
import type { Company } from '@/pages/admin/data/companies'
import { SERVICE_USAGE } from '@/pages/admin/data/services'
import type { ServiceEntitlement } from '@/pages/admin/data/services'
import { asDate } from '@/pages/admin/lib/fmt'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Content ──────────────────────────────────────────────────────────────── */
/* A BANNER is an instance of a Placement product: one company's creative, running
   on one slot, for a period. The product says what a hero banner costs and how big
   it is; this record is the thing that actually goes live.

   Status mirrors Jobs exactly — Draft → Schedule → Open → Expired, driven by the
   publish action and the dates, never typed. Exposure is SEPARATE, as on a job: an
   Open banner can be pulled off screen without ending its booking. */
type BannerStatus = 'Draft' | 'Schedule' | 'Open' | 'Expired'
export const BANNER_TONE: Record<BannerStatus, StatusTone> = {
  Draft: 'draft',
  Schedule: 'schedule',
  Open: 'open',
  Expired: 'closed',
}
export type Banner = {
  id: string
  name: string
  /* Sold — bought by a customer, backed by a paid PO line.
     House — Saramin VN's own promotion. No company, no PO, no product. */
  source: 'Sold' | 'House'
  sku: string
  company: string
  start: string
  end: string
  status: BannerStatus
  exposure: 'On' | 'Off'
  clicks: string
  creative: string | null
}
export const BANNERS: Banner[] = [
  { id: 'BN-1042', name: 'Hero — Tết 2026 campaign', source: 'Sold', sku: 'PLC-HOMEHERO', company: 'FPT Software', start: '01/01/2026', end: '15/02/2026', status: 'Expired', exposure: 'Off', clicks: '12,480', creative: 'tet2026-hero-1536x371.jpg' },
  { id: 'BN-1051', name: 'Hero — Tuyển dụng Q3', source: 'Sold', sku: 'PLC-HOMEHERO', company: 'Công ty Vạn Phát', start: '01/08/2026', end: '08/08/2026', status: 'Open', exposure: 'On', clicks: '3,190', creative: 'vanphat-hero-1536x371.jpg' },
  { id: 'BN-1052', name: 'Adsense — IT jobs', source: 'Sold', sku: 'PLC-ADS-HOME', company: 'Tiki', start: '10/08/2026', end: '17/08/2026', status: 'Schedule', exposure: 'Off', clicks: '—', creative: 'tiki-ads-1260x120.jpg' },
  { id: 'BN-1053', name: 'Hero — Employer promo', source: 'Sold', sku: 'PLC-HOMEHERO', company: 'MoMo', start: '—', end: '—', status: 'Draft', exposure: 'Off', clicks: '—', creative: null },
  { id: 'BN-1054', name: 'Adsense — Search, Shopee', source: 'Sold', sku: 'PLC-ADS-SEARCH', company: 'Shopee', start: '05/08/2026', end: '12/08/2026', status: 'Open', exposure: 'Off', clicks: '840', creative: 'shopee-search-425x160.jpg' },
  { id: 'BN-1060', name: 'Tuyển dụng nội bộ — Saramin VN', source: 'House', sku: 'PLC-HOMEHERO', company: 'Saramin VN', start: '01/08/2026', end: '31/08/2026', status: 'Open', exposure: 'On', clicks: '2,410', creative: 'saramin-hiring-1536x371.jpg' },
  { id: 'BN-1061', name: 'Thông báo bảo trì hệ thống', source: 'House', sku: 'PLC-ADS-HOME', company: 'Saramin VN', start: '20/08/2026', end: '22/08/2026', status: 'Schedule', exposure: 'Off', clicks: '—', creative: 'maintenance-1260x120.jpg' },
]

/* Publish a banner. Two decisions only, as asked: WHEN it starts and WHAT runs.
   Everything else is read from the placement product — size, duration, the slot's
   rotation cap — because those were fixed when the product was sold. */
/* Placement lines that have actually been BOUGHT. A banner cannot be published
   from the catalogue — only from a paid order line — which is the module's own
   invariant applied to this screen: nothing is entitled without a paid order.

   `qty` is what the customer bought, `used` is how many bookings already exist
   against that line. A line with none left cannot be chosen again. */
type PoPlacementLine = { sku: string; qty: number; used: number }
type PlacementPo = { po: string; invoiced: string | null; lines: PoPlacementLine[] }
export const PLACEMENT_POS: Record<string, PlacementPo[]> = {
  'Công ty TNHH Vạn Phát': [
    { po: 'PO-005812-07-2026', invoiced: '26/05/2026', lines: [{ sku: 'PLC-HOMEHERO', qty: 2, used: 1 }, { sku: 'PLC-TOPCOMPANY', qty: 1, used: 0 }, { sku: 'PLC-POPUP', qty: 2, used: 1 }] },
    { po: 'PO-005940-08-2026', invoiced: null, lines: [{ sku: 'PLC-HOMEHERO', qty: 1, used: 0 }] },
  ],
  'FPT Software': [
    { po: 'PO-005601-06-2026', invoiced: '15/06/2026', lines: [{ sku: 'PLC-HOMEHERO', qty: 1, used: 1 }] },
  ],
  'Tiki': [
    { po: 'PO-005733-07-2026', invoiced: '01/07/2026', lines: [{ sku: 'PLC-ADS-HOME', qty: 3, used: 1 }] },
  ],
  'MoMo': [
    { po: 'PO-005888-07-2026', invoiced: '18/07/2026', lines: [{ sku: 'PLC-HOMEHERO', qty: 1, used: 0 }] },
  ],
  'Shopee': [
    { po: 'PO-005777-08-2026', invoiced: '05/08/2026', lines: [{ sku: 'PLC-ADS-SEARCH', qty: 2, used: 1 }] },
  ],
}

/* A POPUP is the same kind of record as a banner — a scheduled creative with a
   source, a status and an exposure switch. Three things differ, and all three come
   from the fact that a popup INTERRUPTS rather than sits in a slot:

     · it targets an AUDIENCE, not a placement
     · it carries a FREQUENCY CAP, so one person is not shown it twice a day
     · only ONE can show at a time, so it needs a PRIORITY

   Everything else — Draft → Schedule → Open → Expired, Exposure separate, creative
   frozen while Open — is deliberately identical, because an operator who has learnt
   the banner screen should not have to learn a second one. */
type PopupAudience = 'Guests' | 'Jobseekers' | 'Employers'
export type Popup = {
  id: string
  name: string
  source: 'Sold' | 'House'
  audience: PopupAudience
  company: string
  /** the PO line this popup was sold on — empty for a House popup */
  po?: string
  /** the placement product bought (Homepage pop-up …) */
  product: string
  /** why it is running, in the booker's own words — asked on the form as Mục đích */
  purpose: string
  start: string
  end: string
  status: BannerStatus
  exposure: 'On' | 'Off'
  freq: string
  priority: number
  creative: string | null
}
export const POPUPS: Popup[] = [
  { id: 'PU-2010', name: 'Chào mừng người dùng mới', source: 'House', audience: 'Guests', product: 'Homepage pop-up', purpose: 'Giới thiệu tính năng cho khách mới', company: 'Saramin VN', start: '01/06/2026', end: 'Always on', status: 'Open', exposure: 'On', freq: '1 / phiên', priority: 1, creative: 'welcome-popup.jpg' },
  { id: 'PU-2011', name: 'Khảo sát NPS', source: 'House', audience: 'Jobseekers', product: 'Homepage pop-up', purpose: 'Thu thập NPS quý 3', company: 'Saramin VN', start: '01/08/2026', end: '14/08/2026', status: 'Open', exposure: 'On', freq: '1 / tuần', priority: 3, creative: 'nps-survey.jpg' },
  { id: 'PU-2012', name: 'Tuyển dụng Q3 — Vạn Phát', source: 'Sold', audience: 'Jobseekers', po: 'PO-003862-07-2026', product: 'Homepage pop-up', purpose: 'Đẩy tin tuyển dụng Q3', company: 'Công ty TNHH Vạn Phát', start: '10/08/2026', end: '17/08/2026', status: 'Schedule', exposure: 'Off', freq: '1 / phiên', priority: 2, creative: 'vanphat-popup.jpg' },
  { id: 'PU-2013', name: 'Employer trial', source: 'House', audience: 'Employers', product: 'Homepage pop-up', purpose: 'Mời NTD dùng thử', company: 'Saramin VN', start: '—', end: '—', status: 'Draft', exposure: 'Off', freq: '1 / tuần', priority: 5, creative: null },
  { id: 'PU-2009', name: 'Tết 2026 — FPT Software', source: 'Sold', audience: 'Jobseekers', po: 'PO-003790-12-2025', product: 'Homepage pop-up', purpose: 'Chiến dịch Tết 2026', company: 'FPT Software', start: '01/01/2026', end: '15/02/2026', status: 'Expired', exposure: 'Off', freq: '1 / phiên', priority: 4, creative: 'fpt-tet.jpg' },
]
export const PU_AUDIENCE: Record<PopupAudience, string> = {
  Guests: 'Khách chưa đăng nhập',
  Jobseekers: 'Ứng viên đã đăng nhập',
  Employers: 'Nhà tuyển dụng',
}

/* ── Account usage, across every customer ─────────────────────────────────────
   The queues answer "what still needs doing?". This answers the other question —
   "what has this customer consumed?" — for every customer at once, which today can
   only be reconstructed by opening thirty company records one at a time.

   Every column is the same shape because every product is: bought N, used M. Job
   slots, CV unlocks, placement bookings and service deliveries differ only in WHO
   records the use — the platform observes the first three, a person asserts the
   fourth — not in what the number means. */
export type UsagePair = { used: number; total: number }
export function usageOf(c: Company) {
  const placements = (PLACEMENT_POS[c.name] ?? []).flatMap((p) => p.lines)
  const services = SERVICE_USAGE[c.name] ?? []
  return {
    job: { used: c.jobTotal - c.jobLeft, total: c.jobTotal } as UsagePair,
    cv: { used: c.cvTotal - c.cvLeft, total: c.cvTotal } as UsagePair,
    plc: { used: placements.reduce((t, l) => t + l.used, 0), total: placements.reduce((t, l) => t + l.qty, 0) } as UsagePair,
    svc: { used: services.reduce((t, e) => t + e.entries.length, 0), total: services.reduce((t, e) => t + e.total, 0) } as UsagePair,
  }
}

/* ── Manual services, one page for all of them ────────────────────────────────
   Five products across a hundred companies is not five queues — it is one list at
   the grain of (company × service), which is where the quota lives. A per-product
   page fragments the one question ops actually asks: who is owed something?

   STATUS IS DERIVED from two facts, remaining and validity, and both matter:

     Còn lượt    — remaining > 0, still valid. Actionable.
     Đã dùng hết — delivered everything. Nothing owed, nothing lost.
     Hết hạn     — validity passed with units UNUSED. The customer paid for
                   something they never received, and it can no longer be given.
                   This is the row that must never be silent.
     Đã kết thúc — validity passed with everything delivered. Clean close.

   Only "Còn lượt" can be logged against. Delivering after expiry would mean giving
   away a unit the customer's own terms had already forfeited. */
export type SvcState = 'Còn lượt' | 'Đã dùng hết' | 'Hết hạn' | 'Đã kết thúc'
export const SVC_TONE: Record<SvcState, StatusTone> = {
  'Còn lượt': 'open',
  'Đã dùng hết': 'expired',
  'Hết hạn': 'rejected',
  'Đã kết thúc': 'closed',
}
/** Demo "today". A real build compares against the server clock. */
const SVC_TODAY = new Date(2026, 7, 16)
export function svcState(e: ServiceEntitlement): SvcState {
  const left = e.total - e.entries.length
  const expired = asDate(e.validUntil) < SVC_TODAY
  if (expired) return left > 0 ? 'Hết hạn' : 'Đã kết thúc'
  return left > 0 ? 'Còn lượt' : 'Đã dùng hết'
}

/* ── CV search usage ──────────────────────────────────────────────────────────
   HQ's view of how the CV-search product is actually USED. Same grain and same
   shape as Manual services — one row per (customer × package bought) — because it
   is the same kind of object: something a customer paid for that either gets
   consumed or quietly does not.

   Account usage answers "how much quota is left". This answers "is anybody
   searching", and the two give opposite readings on the same account: a customer
   who bought 40 unlocks and never logged in reads as 40 REMAINING there and as a
   dead renewal here. */
export const CV_SEARCH_PACKAGES = [
  { pkg: 'CV Search 100 · 6 tháng', co: 'Vạn Phát Healthcare', coId: 'VP-1042', owner: 'Ngọc Anh', used: 39, total: 100, until: '31/12/2026', searches: 142, last: '2 giờ trước' },
  { pkg: 'CV Search 50 · 3 tháng', co: 'FPT Software', coId: 'FS-0318', owner: 'Minh Tuấn', used: 31, total: 50, until: '30/09/2026', searches: 96, last: 'Hôm nay' },
  { pkg: 'CV Search 50 · 3 tháng', co: 'Tiki', coId: 'TK-0771', owner: 'Ngọc Anh', used: 12, total: 50, until: '15/10/2026', searches: 61, last: '3 ngày trước' },
  { pkg: 'CV Search 30 · 1 tháng', co: 'MoMo', coId: 'MM-0209', owner: 'Hải Yến', used: 4, total: 30, until: '05/09/2026', searches: 24, last: '1 tuần trước' },
  { pkg: 'CV Search 50 · 3 tháng', co: 'Zenpay', coId: 'ZP-1130', owner: 'Minh Tuấn', used: 0, total: 50, until: '20/11/2026', searches: 4, last: '3 tuần trước' },
  { pkg: 'CV Search 40 · 6 tháng', co: 'One Mount', coId: 'OM-0455', owner: 'Hải Yến', used: 0, total: 40, until: '28/02/2027', searches: 0, last: '—' },
]

/* Two failures that look identical to the employer and are fixed by different
   people. The labels say which is which without needing the legend. */
export const ZERO_RESULT_TERMS = [
  { term: 'Kubernetes + Hà Nội', n: 14, why: 'Không có ứng viên' as const },
  { term: 'kiến trúc sư giải pháp', n: 11, why: 'Không hiểu từ khoá' as const },
  { term: 'RPA', n: 9, why: 'Không hiểu từ khoá' as const },
  { term: 'Điều dưỡng + tiếng Nhật N2', n: 7, why: 'Không có ứng viên' as const },
  { term: 'flutter dev', n: 5, why: 'Không hiểu từ khoá' as const },
]

/* ── Unresolved terms ─────────────────────────────────────────────────────────
   Promoted out of a panel on CV search because it is a QUEUE, not a report: every
   row needs somebody to do something and then say they did it. A panel cannot
   hold a status, an owner or a decision, and at real volume this is hundreds of
   rows a month rather than five.

   The important move is the MERGE. The same failure arrives from two directions —
   an employer searches "RPA" and gets nothing, a candidate's PDF says "RPA" and it
   resolves to nothing — and the fix is identical: one alias, one row, both sides
   fixed at once. Two lists would mean the taxonomy owner watches two queues and
   fixes the same word twice.

   Tab 2 is deliberately NOT the same problem. A term we understood against a pool
   that is empty is a sourcing job, not a data job, and it belongs to Sales. It sits
   here only because both are discovered the same way — by a search returning
   nothing — and separating them at the tab level is what stops them being confused. */
type TermStatus = 'Mới' | 'Đã xử lý' | 'Bỏ qua'
/* `from` is a LIST, not a value. The same word often arrives from both directions —
   an employer types it into CV search and gets nothing, and a candidate's PDF
   contains it and resolves to nothing — and seeing both on one row is the clearest
   possible evidence that one alias fixes two problems. */
type TermSource = 'search' | 'cv'
export const SOURCE_LABEL: Record<TermSource, string> = { search: 'NTD tìm kiếm', cv: 'CV ứng viên' }
export const UNRESOLVED_TERMS: { term: string; from: TermSource[]; n: number; first: string; last: string; suggest: string; status: TermStatus }[] = [
  { term: 'RPA', from: ['search', 'cv'], n: 23, first: '02/08', last: 'Hôm nay', suggest: 'Kỹ năng mới · nhóm IT — Software', status: 'Mới' },
  { term: 'ReactJs', from: ['search', 'cv'], n: 34, first: '21/07', last: 'Hôm nay', suggest: 'Alias của “React”', status: 'Đã xử lý' },
  { term: 'flutter dev', from: ['search'], n: 5, first: '05/08', last: 'Hôm qua', suggest: 'Alias của “Flutter”', status: 'Mới' },
  { term: 'kiến trúc sư giải pháp', from: ['search'], n: 11, first: '28/07', last: 'Hôm nay', suggest: 'Chức danh, không phải kỹ năng — bỏ qua', status: 'Mới' },
  { term: 'kế toán công nợ', from: ['cv'], n: 22, first: '19/07', last: 'Hôm nay', suggest: 'Kỹ năng mới · nhóm Accounting & Finance', status: 'Mới' },
  { term: 'MS Ofice', from: ['cv'], n: 17, first: '25/07', last: '3 ngày trước', suggest: 'Lỗi chính tả → alias của “Microsoft Office”', status: 'Mới' },
  { term: 'chăm chỉ', from: ['cv'], n: 63, first: '18/07', last: 'Hôm nay', suggest: 'Không phải kỹ năng — bỏ qua', status: 'Bỏ qua' },
]

export const SUPPLY_GAPS = [
  { query: 'Kubernetes + Hà Nội', n: 14, pool: 3, note: 'Có 3 ứng viên nhưng đều ở HCM' },
  { query: 'Điều dưỡng + tiếng Nhật N2', n: 7, pool: 0, note: 'Chưa có ai trong kho' },
  { query: 'SAP FICO + 5 năm', n: 6, pool: 1, note: 'Có 1, đã bị unlock 4 lần' },
]

export const TERM_TONE: Record<TermStatus, StatusTone> = { 'Mới': 'pending', 'Đã xử lý': 'active', 'Bỏ qua': 'draft' }
