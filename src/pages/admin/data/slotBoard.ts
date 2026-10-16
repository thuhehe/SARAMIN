/*
 * Slot occupancy — one row per Display placement, with what is showing and what
 * is waiting to show.
 *
 * DELIBERATELY ON THE BUILD'S OWN REGISTRY, not on the deck-era PLACEMENTS in
 * products.ts. This screen is a hand-off to the developers building it in
 * saramin-vn-admin, so its rows carry the names, keys, ids, sizes and Number of
 * slides that the dev admin's Placements page actually shows (checked 16/10/2026),
 * and "View all" uses the same `placement` id the Boosting list already filters by
 * (`/content/boosting?placement=<id>`).
 *
 * Ad vocabulary is the build's too: an ad is Draft / Review / Published / Archived,
 * and a Published ad reads Scheduled / Open / Closed from its dates.
 */
import { asDate } from '@/pages/admin/lib/fmt'

/** The reference date every figure on the screen counts from. The build reads the server clock. */
export const BOARD_TODAY = new Date(2026, 9, 16)
export const BOARD_TODAY_LABEL = '16/10/2026'
const DAY = 86_400_000

/** Which page a placement sits on — drives the schematic in the Preview column. */
export type BoardPage = 'home' | 'search' | 'job-detail' | 'my-page' | 'company' | 'co-home' | 'co-candidate'

export type BoardPlacement = {
  /** `placement.id` — what `/content/boosting?placement=` takes */
  id: string
  key: string
  name: string
  page: BoardPage
  pageLabel: string
  /** creative size, or 'any' */
  size: string
  /** Number of slides — how many Published ads may overlap on one day */
  slides: number
  rotation: string
  /** false = no reference image uploaded on Placements yet */
  hasReference: boolean
}

export const BOARD_PLACEMENTS: BoardPlacement[] = [
  { id: 'placement_banner_slot_1', key: 'BANNER_SLOT_1', name: '[JS] Homepage - Home Hero', page: 'home', pageLabel: 'Home', size: '614 × 320', slides: 2, rotation: '300 s', hasReference: true },
  { id: 'placement_banner_slot_2', key: 'BANNER_SLOT_2', name: '[JS] Homepage - Home Ribbon', page: 'home', pageLabel: 'Home', size: '1260 × 48', slides: 1, rotation: '60 s', hasReference: true },
  { id: 'placement_banner_slot_3', key: 'BANNER_SLOT_3', name: '[JS] Homepage - Home Middle', page: 'home', pageLabel: 'Home', size: '1260 × 60', slides: 2, rotation: '60 s', hasReference: true },
  { id: 'placement_home_popup', key: 'HOME_POPUP', name: '[JS] Homepage - Popup', page: 'home', pageLabel: 'Home', size: 'any', slides: 1, rotation: '—', hasReference: true },
  { id: 'placement_search_page_banner', key: 'SEARCH_PAGE_BANNER', name: 'Trang tìm kiếm — Banner cột phải', page: 'search', pageLabel: 'Search', size: '273 × 327', slides: 1, rotation: '60 s', hasReference: true },
  { id: 'placement_jobseeker_job_detail_banner', key: 'JOBSEEKER_JOB_DETAIL_BANNER', name: '[JS] Job detail - Bottom Banner', page: 'job-detail', pageLabel: 'Job detail', size: '728 × 90', slides: 6, rotation: '60 s', hasReference: true },
  { id: 'placement_jobseeker_my_dashboard_banner', key: 'JOBSEEKER_MY_DASHBOARD_BANNER', name: '[JS] My page - My page banner', page: 'my-page', pageLabel: 'My page', size: '400 × 152', slides: 10, rotation: '60 s', hasReference: true },
  { id: 'placement_company_page_top', key: 'COMPANY_PAGE_TOP', name: 'Company page - Long banner', page: 'company', pageLabel: 'Company page', size: '994 × 94', slides: 1, rotation: '300 s', hasReference: true },
  { id: 'placement_co_home_top_strip', key: 'CO_HOME_TOP_STRIP', name: '[CO] Home - Top strip', page: 'co-home', pageLabel: 'Employer home', size: '894 × 64', slides: 6, rotation: '60 s', hasReference: true },
  { id: 'placement_co_home_mid_strip', key: 'CO_HOME_MID_STRIP', name: '[CO] Home - Mid strip', page: 'co-home', pageLabel: 'Employer home', size: '1200 × 57', slides: 6, rotation: '60 s', hasReference: true },
  { id: 'placement_co_home_rail_banner', key: 'CO_HOME_RAIL_BANNER', name: '[CO] Home - Right rail banner', page: 'co-home', pageLabel: 'Employer home', size: '243 × 127', slides: 6, rotation: '60 s', hasReference: false },
  { id: 'placement_co_home_recommend_rail', key: 'CO_HOME_RECOMMEND_RAIL', name: '[CO] Home - Recommended talent rail', page: 'co-home', pageLabel: 'Employer home', size: '282 × 235', slides: 6, rotation: '60 s', hasReference: true },
  { id: 'placement_co_home_service_promo', key: 'CO_HOME_SERVICE_PROMO', name: '[CO] Home - Service promo card', page: 'co-home', pageLabel: 'Employer home', size: '840 × 150', slides: 6, rotation: '60 s', hasReference: true },
  { id: 'placement_co_candidate_management_left_banner', key: 'CO_CANDIDATE_MANAGEMENT_LEFT_BANNER', name: '[CO] Candidate management page - Left banner', page: 'co-candidate', pageLabel: 'Candidate management', size: '258 × 136', slides: 6, rotation: '60 s', hasReference: true },
]

export type AdStatus = 'Draft' | 'Review' | 'Published' | 'Archived'
/** What the Status column shows — the build's `displayAdPhase`: four values, read from status + dates. */
export type AdPhase = 'Draft' | 'Scheduled' | 'Open' | 'Closed'

export type BoardAd = {
  id: string
  placement: string
  name: string
  kind: 'Banner' | 'Popup'
  source: 'Customer' | 'Internal'
  /** the customer, or "Saramin VN" for a house ad */
  company: string
  /** "PO-… · line" — or "Free product" / "—" */
  order: string
  status: AdStatus
  visible: boolean
  /** dd/mm/yyyy; '—' on a Draft that has no dates yet */
  start: string
  /** dd/mm/yyyy, the LAST day shown; null = no end date (popup "No end date") */
  end: string | null
  /** optional, admin-only — the second line under the name on the list */
  purpose?: string
}

export const BOARD_ADS: BoardAd[] = [
  // Home Hero (2 slides): full now, one waiting, then nothing after 14/12.
  { id: 'AD-3101', placement: 'placement_banner_slot_1', name: 'Hero — FPT Software · Q4 tuyển dụng', kind: 'Banner', source: 'Customer', company: 'FPT Software', order: 'PO-006120-09-2026 · Home Hero 30 ngày', status: 'Published', visible: true, start: '01/10/2026', end: '30/10/2026', purpose: 'Q4 employer branding' },
  { id: 'AD-3102', placement: 'placement_banner_slot_1', name: 'Hero — Tuyển dụng Saramin VN', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '10/10/2026', end: '14/11/2026', purpose: 'Tuyển dụng nội bộ' },
  { id: 'AD-3103', placement: 'placement_banner_slot_1', name: 'Hero — Shopee 11.11', kind: 'Banner', source: 'Customer', company: 'Shopee', order: 'PO-006188-10-2026 · Home Hero 30 ngày', status: 'Published', visible: true, start: '15/11/2026', end: '14/12/2026' },
  { id: 'AD-3104', placement: 'placement_banner_slot_1', name: 'Hero — Tết 2026 · FPT Software', kind: 'Banner', source: 'Customer', company: 'FPT Software', order: 'PO-005929-08-2026 · Home Hero 30 ngày', status: 'Published', visible: true, start: '01/01/2026', end: '30/01/2026' },
  { id: 'AD-3105', placement: 'placement_banner_slot_1', name: 'Hero — MoMo employer promo', kind: 'Banner', source: 'Customer', company: 'MoMo', order: 'PO-005888-07-2026 · Home Hero 30 ngày', status: 'Draft', visible: true, start: '—', end: null },

  // Home Ribbon (1 slide): blank TODAY until a booking starts on 20/10.
  { id: 'AD-3111', placement: 'placement_banner_slot_2', name: 'Ribbon — Tiki Black Friday', kind: 'Banner', source: 'Customer', company: 'Tiki', order: 'PO-006140-09-2026 · Home Ribbon 30 ngày', status: 'Published', visible: true, start: '20/10/2026', end: '18/11/2026', purpose: 'Black Friday 2026' },
  { id: 'AD-3112', placement: 'placement_banner_slot_2', name: 'Ribbon — Vạn Phát tuyển gấp', kind: 'Banner', source: 'Customer', company: 'Công ty TNHH Vạn Phát', order: 'PO-005812-07-2026 · Home Ribbon 14 ngày', status: 'Published', visible: true, start: '01/10/2026', end: '14/10/2026' },

  // Home Middle (2 slides): a hole between two bookings.
  { id: 'AD-3121', placement: 'placement_banner_slot_3', name: 'Middle — Viettel IT jobs', kind: 'Banner', source: 'Customer', company: 'Viettel', order: 'PO-006102-09-2026 · Home Middle 30 ngày', status: 'Published', visible: true, start: '02/10/2026', end: '31/10/2026' },
  { id: 'AD-3122', placement: 'placement_banner_slot_3', name: 'Middle — Thông báo bảo trì', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '05/11/2026', end: '07/11/2026' },
  { id: 'AD-3123', placement: 'placement_banner_slot_3', name: 'Middle — Grab driver hiring', kind: 'Banner', source: 'Customer', company: 'Grab Vietnam', order: 'PO-006150-10-2026 · Home Middle 30 ngày', status: 'Published', visible: true, start: '08/11/2026', end: '07/12/2026' },

  // Popup: a house popup with no end date — never blank.
  { id: 'AD-3131', placement: 'placement_home_popup', name: 'Popup — Chào mừng người dùng mới', kind: 'Popup', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '01/06/2026', end: null, purpose: 'Giới thiệu tính năng cho khách mới' },
  { id: 'AD-3132', placement: 'placement_home_popup', name: 'Popup — Khảo sát NPS Q3', kind: 'Popup', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Archived', visible: false, start: '01/08/2026', end: '14/08/2026' },

  // Search right rail (1 slide): runs out on 25/10, nothing behind it.
  { id: 'AD-3141', placement: 'placement_search_page_banner', name: 'Search rail — Shopee', kind: 'Banner', source: 'Customer', company: 'Shopee', order: 'PO-005777-08-2026 · Search rail 30 ngày', status: 'Published', visible: true, start: '26/09/2026', end: '25/10/2026' },

  // Job detail bottom (6 slides): busy, one hidden, one closed, covered to 30/11.
  { id: 'AD-3151', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — FPT Software', kind: 'Banner', source: 'Customer', company: 'FPT Software', order: 'PO-006120-09-2026 · Job detail 30 ngày', status: 'Published', visible: true, start: '05/10/2026', end: '03/11/2026', purpose: 'Q4 tuyển dụng IT' },
  { id: 'AD-3152', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — Tiki', kind: 'Banner', source: 'Customer', company: 'Tiki', order: 'PO-006140-09-2026 · Job detail 30 ngày', status: 'Published', visible: true, start: '10/10/2026', end: '08/11/2026' },
  { id: 'AD-3153', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — Mời NTD dùng thử', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '01/10/2026', end: '30/11/2026' },
  { id: 'AD-3154', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — MoMo', kind: 'Banner', source: 'Customer', company: 'MoMo', order: 'Free product · Test ABC 30 ngày', status: 'Published', visible: false, start: '08/10/2026', end: '06/11/2026' },
  { id: 'AD-3155', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — Grab Vietnam', kind: 'Banner', source: 'Customer', company: 'Grab Vietnam', order: 'PO-006150-10-2026 · Job detail 30 ngày', status: 'Published', visible: true, start: '25/10/2026', end: '23/11/2026' },
  { id: 'AD-3156', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — Viettel', kind: 'Banner', source: 'Customer', company: 'Viettel', order: 'PO-006102-09-2026 · Job detail 30 ngày', status: 'Published', visible: true, start: '01/11/2026', end: '30/11/2026' },
  { id: 'AD-3157', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — Vạn Phát', kind: 'Banner', source: 'Customer', company: 'Công ty TNHH Vạn Phát', order: 'PO-005812-07-2026 · Job detail 30 ngày', status: 'Published', visible: true, start: '01/09/2026', end: '30/09/2026' },
  { id: 'AD-3158', placement: 'placement_jobseeker_job_detail_banner', name: 'Job detail — Shopee', kind: 'Banner', source: 'Customer', company: 'Shopee', order: 'PO-006188-10-2026 · Job detail 30 ngày', status: 'Review', visible: true, start: '—', end: null },

  // My page (10 slides): nothing at all — blank from today with no end.

  // Company page long banner (1 slide): network ad, a hole, then another.
  { id: 'AD-3171', placement: 'placement_company_page_top', name: 'Company page — Viettel (network)', kind: 'Banner', source: 'Customer', company: 'Viettel', order: 'PO-006102-09-2026 · Company page 30 ngày', status: 'Published', visible: true, start: '12/10/2026', end: '10/11/2026' },
  { id: 'AD-3172', placement: 'placement_company_page_top', name: 'Company page — FPT Software (network)', kind: 'Banner', source: 'Customer', company: 'FPT Software', order: 'PO-006120-09-2026 · Company page 30 ngày', status: 'Published', visible: true, start: '20/11/2026', end: '19/12/2026' },

  // [CO] regions.
  { id: 'AD-3181', placement: 'placement_co_home_top_strip', name: 'CO top — Gói Premium tháng 10', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '01/10/2026', end: '31/10/2026', purpose: 'Bán gói Premium cho NTD' },
  { id: 'AD-3182', placement: 'placement_co_home_top_strip', name: 'CO top — Gói Premium tháng 11', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '01/11/2026', end: '30/11/2026' },
  { id: 'AD-3191', placement: 'placement_co_home_mid_strip', name: 'CO mid — Webinar tuyển dụng', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: false, start: '10/10/2026', end: '24/10/2026' },
  { id: 'AD-3201', placement: 'placement_co_home_service_promo', name: 'CO promo — CV search package', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '28/10/2026', end: '27/11/2026' },
  { id: 'AD-3211', placement: 'placement_co_candidate_management_left_banner', name: 'CO candidate — Talent pool tips', kind: 'Banner', source: 'Internal', company: 'Saramin VN', order: '—', status: 'Published', visible: true, start: '01/09/2026', end: '15/10/2026' },
]

/* ── Derived ──────────────────────────────────────────────────────────────── */

const t0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const TODAY = t0(BOARD_TODAY)
const ms = (s: string) => t0(asDate(s))

/* The build's rule (saramin-vn-admin display-ad-phase.ts): Archived → Closed;
   anything not Published (Draft, Review) → Draft; Published → Scheduled before its
   start, Open until its end (no end = stays Open), Closed after it. */
export function phaseOf(a: BoardAd): AdPhase {
  if (a.status === 'Archived') return 'Closed'
  if (a.status !== 'Published' || a.start === '—') return 'Draft'
  if (ms(a.start) > TODAY) return 'Scheduled'
  if (a.end !== null && ms(a.end) < TODAY) return 'Closed'
  return 'Open'
}

/** Newest start first — the Boosting list's default sort (startAt desc). Undated drafts last. */
export const byStartDesc = (a: BoardAd, b: BoardAd) =>
  (b.start === '—' ? -Infinity : ms(b.start)) - (a.start === '—' ? -Infinity : ms(a.start))

/** Days until the ad's last day (Open), or until it starts (Scheduled). */
export function daysTo(a: BoardAd): number | null {
  const p = phaseOf(a)
  if (p === 'Scheduled') return Math.round((ms(a.start) - TODAY) / DAY)
  if (p === 'Open') return a.end === null ? null : Math.round((ms(a.end) - TODAY) / DAY)
  return null
}

export type BoardRow = {
  placement: BoardPlacement
  /** Open + Visible on — what a visitor can see today */
  showing: BoardAd[]
  /** Open but Visible = Off — not on screen, still holds a slide */
  hidden: BoardAd[]
  /** Scheduled — Published, start date still ahead */
  waiting: BoardAd[]
  /** every ad on this placement, any status — what "View all" lists */
  all: BoardAd[]
}

export function boardRow(p: BoardPlacement): BoardRow {
  const all = BOARD_ADS.filter((a) => a.placement === p.id)
  const open = all.filter((a) => phaseOf(a) === 'Open')
  const byEnd = (a: BoardAd, b: BoardAd) => (a.end === null ? Infinity : ms(a.end)) - (b.end === null ? Infinity : ms(b.end))
  return {
    placement: p,
    showing: open.filter((a) => a.visible).sort(byEnd),
    hidden: open.filter((a) => !a.visible).sort(byEnd),
    waiting: all.filter((a) => phaseOf(a) === 'Scheduled').sort((a, b) => ms(a.start) - ms(b.start)),
    all,
  }
}

export const BOARD_ROWS = (): BoardRow[] => BOARD_PLACEMENTS.map(boardRow)
