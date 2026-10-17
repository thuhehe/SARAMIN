/*
 * Job list → Placement tab: which jobs are running in each paid job placement on the
 * Home page and the Search page's top section, the way CS tracks it today in the
 * "Super Hot Job Today / Job Highlight" sheet.
 *
 * Placements are the build's (svn-web PLACEMENT_IDS + home.service ZONE_PLACEMENTS,
 * svn-be placement_top_search, checked 17/10/2026), named by the heading the visitor
 * sees. A job is IN a placement because the product it was published with covers that
 * placement (fill route TIER) — nobody books a job into a band by hand.
 *
 * Rows under Super Hot Job and Highlight jobs are the client's sheet; its "today" is
 * 02/10/2026 (that is what makes its "Số ngày còn lại" 3…10), so this tab counts from
 * that date. The other bands carry invented sample rows; Company IDs not on the
 * sheets are invented too.
 */
import { asDate } from '@/pages/admin/lib/fmt'

export const JP_TODAY = new Date(2026, 9, 2)
export const JP_TODAY_LABEL = '02/10/2026'
const DAY = 86_400_000

export type JpSpot = 'hot-plus' | 'hot' | 'top' | 'distinction' | 'recommended' | 'highlight' | 'top-search'

export type JobPlacement = {
  id: string
  name: string
  page: 'Home' | 'Search'
  /** the products whose postings land here */
  fedBy: string
  spot: JpSpot
  hasReference: boolean
}

export const JOB_PLACEMENTS: JobPlacement[] = [
  { id: 'placement_home_super_hot_large', name: 'Homepage — Super Hot Job Plus (large card)', page: 'Home', fedBy: 'Job Hero', spot: 'hot-plus', hasReference: true },
  { id: 'placement_home_super_hot_image', name: 'Homepage — Super Hot Job', page: 'Home', fedBy: 'Super Hot Job', spot: 'hot', hasReference: true },
  { id: 'placement_home_top_job', name: 'Homepage — Top Job', page: 'Home', fedBy: 'Top Job', spot: 'top', hasReference: true },
  { id: 'placement_home_distinction', name: 'Homepage — Distinction', page: 'Home', fedBy: 'Distinction', spot: 'distinction', hasReference: true },
  { id: 'placement_home_recommended', name: 'Homepage — Recommended jobs (rail)', page: 'Home', fedBy: 'Top Job · Distinction', spot: 'recommended', hasReference: true },
  { id: 'placement_home_job_card_basic_plus', name: 'Homepage — Highlight jobs', page: 'Home', fedBy: 'Basic Plus', spot: 'highlight', hasReference: true },
  { id: 'placement_top_search', name: 'Search — Top search', page: 'Search', fedBy: 'products covering Top search', spot: 'top-search', hasReference: true },
]

/** The sheet's "Phân loại", read as the Quota usage page's Internal tag. */
export type JpTag = 'Paid package' | 'Gift' | 'CS Support'

export type PlacedJob = {
  placement: string
  jobId: string
  title: string
  companyId: string
  company: string
  tag: JpTag
  /** dd/mm/yyyy — when the job started running in this placement */
  activated: string
  /** dd/mm/yyyy — the last day it runs here */
  expires: string
}

const SH = 'placement_home_super_hot_image'
const HL = 'placement_home_job_card_basic_plus'
export const PLACED_JOBS: PlacedJob[] = [
  // ── Super Hot Job Today = Công việc Hot hôm nay (the client's sheet) ──
  { placement: SH, jobId: '2135254', title: 'Kiến Trúc Sư Phần Mềm (SA)', companyId: 'CO-0094320', company: 'Tổng Công Ty Hạ Tầng Mạng (VNPT-Net)', tag: 'Gift', activated: '25/09/2026', expires: '05/10/2026' },
  { placement: SH, jobId: '2134510', title: 'Senior AI Engineer (Computer Vision/NLP/LLM) - Khối Công nghệ thông tin (2026TD450878)', companyId: 'CO-0090117', company: 'MBBANK', tag: 'CS Support', activated: '25/09/2026', expires: '05/10/2026' },
  { placement: SH, jobId: '2134742', title: 'Kĩ sư Kinh tế xây dựng', companyId: 'CO-0097132', company: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN XÂY LẮP 1 - PETROLIMEX', tag: 'CS Support', activated: '24/09/2026', expires: '06/10/2026' },
  { placement: SH, jobId: '2133063', title: 'Fullstack AI Engineer', companyId: 'CO-0093310', company: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ BOOKINGCARE', tag: 'Gift', activated: '28/09/2026', expires: '08/10/2026' },
  { placement: SH, jobId: '2134261', title: 'Game Art Director 10Y+', companyId: 'CO-0095701', company: 'SUPERCENT VIETNAM', tag: 'CS Support', activated: '01/10/2026', expires: '11/10/2026' },
  { placement: SH, jobId: '2135786', title: 'Business Analyst (Domain GOV)', companyId: 'CO-0068206', company: 'FPT IS', tag: 'CS Support', activated: '01/10/2026', expires: '11/10/2026' },
  { placement: SH, jobId: '2135904', title: 'Trưởng phòng Mua hàng & XNK', companyId: 'CO-0097129', company: 'CÔNG TY CỔ PHẦN AD.TEK', tag: 'CS Support', activated: '01/10/2026', expires: '11/10/2026' },
  { placement: SH, jobId: '2134720', title: 'TICKET VÉ ĐOÀN', companyId: 'CO-0096120', company: 'CÔNG TY TNHH DU LỊCH VIETPOWER', tag: 'CS Support', activated: '01/10/2026', expires: '11/10/2026' },
  { placement: SH, jobId: '2136024', title: 'Chuyên Gia Chính Vận Hành Thẻ', companyId: 'CO-0095215', company: 'AEON Finance', tag: 'CS Support', activated: '01/10/2026', expires: '11/10/2026' },
  { placement: SH, jobId: '2134288', title: '[Hà Nội] Fullstack Developer (C#, .NET, Vuejs)', companyId: 'CO-0064074', company: 'MISA SOFTWARE', tag: 'CS Support', activated: '02/10/2026', expires: '12/10/2026' },
  { placement: SH, jobId: '2136354', title: 'Senior Verification Engineer/Verification Engineer', companyId: 'CO-0091833', company: 'CÔNG TY TNHH BRIDGETEK VIỆT NAM', tag: 'CS Support', activated: '02/10/2026', expires: '12/10/2026' },
  { placement: SH, jobId: '2136353', title: 'Tester/ Quality Control (Domain Health Tech)', companyId: 'CO-0089420', company: 'OSP GROUP', tag: 'CS Support', activated: '02/10/2026', expires: '12/10/2026' },
  // invented: one waiting, one finished — the two states the sheet does not show
  { placement: SH, jobId: '2137011', title: 'Head of Data Platform', companyId: 'CO-0064074', company: 'MISA SOFTWARE', tag: 'Paid package', activated: '06/10/2026', expires: '15/10/2026' },
  { placement: SH, jobId: '2131870', title: 'Kế toán tổng hợp', companyId: 'CO-0095215', company: 'AEON Finance', tag: 'Paid package', activated: '15/09/2026', expires: '24/09/2026' },

  // ── Job Highlight (the client's sheet) ──
  { placement: HL, jobId: '2134720', title: 'TICKET VÉ ĐOÀN', companyId: 'CO-0096120', company: 'CÔNG TY TNHH DU LỊCH VIETPOWER', tag: 'CS Support', activated: '28/09/2026', expires: '08/10/2026' },
  { placement: HL, jobId: '2134745', title: 'Business Analyst - Banking/Trading Platform', companyId: 'CO-0092871', company: 'CÔNG TY TNHH CÔNG NGHỆ CODERPUSH', tag: 'CS Support', activated: '28/09/2026', expires: '08/10/2026' },

  // ── invented sample rows for the other bands ──
  { placement: 'placement_home_super_hot_large', jobId: '2135990', title: 'Giám đốc Khối Công nghệ (CTO)', companyId: 'CO-0068206', company: 'FPT IS', tag: 'Paid package', activated: '29/09/2026', expires: '09/10/2026' },
  { placement: 'placement_home_super_hot_large', jobId: '2137102', title: 'Engineering Manager — Payments', companyId: 'CO-0095215', company: 'AEON Finance', tag: 'Paid package', activated: '10/10/2026', expires: '19/10/2026' },
  { placement: 'placement_home_top_job', jobId: '2135412', title: 'Senior Java Developer', companyId: 'CO-0064074', company: 'MISA SOFTWARE', tag: 'Paid package', activated: '26/09/2026', expires: '06/10/2026' },
  { placement: 'placement_home_top_job', jobId: '2135433', title: 'Chuyên viên Phân tích Tín dụng', companyId: 'CO-0090117', company: 'MBBANK', tag: 'Paid package', activated: '27/09/2026', expires: '07/10/2026' },
  { placement: 'placement_home_top_job', jobId: '2134998', title: 'Product Owner (Fintech)', companyId: 'CO-0097129', company: 'CÔNG TY CỔ PHẦN AD.TEK', tag: 'Gift', activated: '30/09/2026', expires: '10/10/2026' },
  { placement: 'placement_home_distinction', jobId: '2135577', title: 'Kỹ sư Cầu nối (BrSE) tiếng Nhật', companyId: 'CO-0091833', company: 'CÔNG TY TNHH BRIDGETEK VIỆT NAM', tag: 'Paid package', activated: '22/09/2026', expires: '02/10/2026' },
  { placement: 'placement_home_distinction', jobId: '2135601', title: 'Nhân viên Kinh doanh Tour', companyId: 'CO-0096120', company: 'CÔNG TY TNHH DU LỊCH VIETPOWER', tag: 'CS Support', activated: '04/10/2026', expires: '13/10/2026' },
  { placement: 'placement_home_recommended', jobId: '2135412', title: 'Senior Java Developer', companyId: 'CO-0064074', company: 'MISA SOFTWARE', tag: 'Paid package', activated: '26/09/2026', expires: '06/10/2026' },
  { placement: 'placement_home_recommended', jobId: '2135433', title: 'Chuyên viên Phân tích Tín dụng', companyId: 'CO-0090117', company: 'MBBANK', tag: 'Paid package', activated: '27/09/2026', expires: '07/10/2026' },
  { placement: 'placement_home_recommended', jobId: '2135577', title: 'Kỹ sư Cầu nối (BrSE) tiếng Nhật', companyId: 'CO-0091833', company: 'CÔNG TY TNHH BRIDGETEK VIỆT NAM', tag: 'Paid package', activated: '22/09/2026', expires: '02/10/2026' },
]

/* ── Derived ──────────────────────────────────────────────────────────────── */

const ms = (s: string) => asDate(s).getTime()
const TODAY = JP_TODAY.getTime()

export type JpPhase = 'Scheduled' | 'Open' | 'Closed'
/** Where the job's run in this placement stands — from its dates, never typed. */
export function jpPhaseOf(j: PlacedJob): JpPhase {
  if (ms(j.activated) > TODAY) return 'Scheduled'
  if (ms(j.expires) < TODAY) return 'Closed'
  return 'Open'
}
/** Open: days to its last day (the sheet's "Số ngày còn lại"). Scheduled: days to start. */
export function jpDays(j: PlacedJob): number {
  return Math.round(((jpPhaseOf(j) === 'Scheduled' ? ms(j.activated) : ms(j.expires)) - TODAY) / DAY)
}

export type JpRow = { placement: JobPlacement; showing: PlacedJob[]; waiting: PlacedJob[]; all: PlacedJob[] }
export function jobPlacementRows(): JpRow[] {
  return JOB_PLACEMENTS.map((p) => {
    const all = PLACED_JOBS.filter((j) => j.placement === p.id)
    return {
      placement: p,
      showing: all.filter((j) => jpPhaseOf(j) === 'Open').sort((a, b) => ms(a.expires) - ms(b.expires)),
      waiting: all.filter((j) => jpPhaseOf(j) === 'Scheduled').sort((a, b) => ms(a.activated) - ms(b.activated)),
      all,
    }
  })
}
