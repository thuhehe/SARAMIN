/*
 * Quota usage — one row per UNIT of a product sold, the way CS tracks it today in
 * the "AMS" sheet: a PO line of 4 × Basic Plus Job is four rows numbered 1–4, and
 * each row is used (or not) on its own job.
 *
 * Rows are transcribed from the CS sheet the client shared on 17/10/2026. Two
 * fictional "Công ty Demo ABC" rows are added to show the two states the sheet's
 * sample does not: an UNPAID invoice and an EXPIRED unit.
 *
 * Everything right of "Use by" is what CS types into the sheet by hand today
 * ("CS điền"). In the system it is filled when the unit is spent on a job.
 */
import { asDate } from '@/pages/admin/lib/fmt'

export const QU_TODAY = new Date(2026, 9, 17)
export const QU_TODAY_LABEL = '17/10/2026'

/** "Phân loại" on the sheet, shown as "Internal tag" — why the unit exists. */
export type QuCategory = 'Paid package' | 'PO 0đ' | 'Monthly gift' | 'NIPA project'

export type QuotaUnit = {
  invoice: string
  /** the invoice is issued but not paid yet — the sheet's yellow fill ("chưa thanh toán / lên tin trước") */
  unpaid?: boolean
  /** one company record now; the sheet carried two ids because CRM and AMS were two systems */
  companyId: string
  company: string
  sales: string
  /** unit number within its product line — "Số thứ tự" */
  no: number
  product: string
  category: QuCategory
  invoiceDate: string
  useBy: string
  activated?: string
  jobId?: string
  warranty?: { type: string; date?: string; jobId?: string; freePo?: string }
}

export const QUOTA_UNITS: QuotaUnit[] = [
  { invoice: 'INV-005816/06/2026', companyId: 'CO-0096405', company: 'CÔNG TY TNHH RSQUARE VIỆT NAM', sales: 'Korean Sales Team (Thu Thảo)', no: 1, product: 'Hero Banner 10 ngày', category: 'PO 0đ', invoiceDate: '26/06/2026', useBy: '25/06/2027' },
  { invoice: 'INV-005816/06/2026', companyId: 'CO-0096405', company: 'CÔNG TY TNHH RSQUARE VIỆT NAM', sales: 'Korean Sales Team (Thu Thảo)', no: 1, product: 'Top Job', category: 'PO 0đ', invoiceDate: '26/06/2026', useBy: '25/06/2027', activated: '26/06/2026', jobId: '2115706' },

  { invoice: 'INV-005812/06/2026', companyId: 'CO-0096906', company: 'CÔNG TY CỔ PHẦN ACLOUD VIỆT NAM', sales: 'Thái Ngọc Hân', no: 1, product: 'Basic Plus Job', category: 'Paid package', invoiceDate: '25/06/2026', useBy: '24/06/2027', activated: '25/06/2026', jobId: '2115444', warranty: { type: 'Basic 30N' } },

  { invoice: 'INV-005792/06/2026', companyId: 'CO-0079403', company: 'CÔNG TY TNHH TIN HỌC & DỊCH VỤ NAM LONG', sales: 'Dương Thị Oanh', no: 1, product: 'Basic Plus Job', category: 'Monthly gift', invoiceDate: '23/06/2026', useBy: '22/06/2027', activated: '23/06/2026', jobId: '2114873', warranty: { type: 'Basic Plus 30N', date: '24/07/2026', jobId: '2121434', freePo: 'INV-005863/07/2026' } },
  { invoice: 'INV-005792/06/2026', companyId: 'CO-0079403', company: 'CÔNG TY TNHH TIN HỌC & DỊCH VỤ NAM LONG', sales: 'Dương Thị Oanh', no: 1, product: 'Basic Plus Job', category: 'Paid package', invoiceDate: '23/06/2026', useBy: '22/06/2027', activated: '03/07/2026', jobId: '2117405', warranty: { type: 'Basic Plus 30N', date: '05/08/2026', jobId: '2123477', freePo: 'INV-005880/08/2026' } },

  ...[1, 2, 3, 4].map((no): QuotaUnit => ({ invoice: 'INV-005556/02/2026', companyId: 'CO-0096899', company: 'CÔNG TY TNHH HANSOL ELECTRONICS VIỆT NAM', sales: 'Korean Sales Team (Thu Thảo)', no, product: 'Basic Plus Job', category: 'NIPA project', invoiceDate: '27/02/2026', useBy: '26/02/2027', activated: '23/06/2026', jobId: String(2114843 - no) })),
  ...[1, 2].map((no): QuotaUnit => ({ invoice: 'INV-005556/02/2026', companyId: 'CO-0096752', company: 'CÔNG TY TRÁCH NHIỆM HỮU HẠN HS HYOSUNG VIỆT NAM', sales: 'Korean Sales Team (Thu Thảo)', no, product: 'Basic Plus Job', category: 'NIPA project', invoiceDate: '27/02/2026', useBy: '26/02/2027', activated: '23/06/2026', jobId: no === 1 ? '2114821' : '2114816' })),

  { invoice: 'INV-005804/06/2026', companyId: 'CO-0092123', company: 'ITC Group', sales: 'Dương Thị Oanh', no: 1, product: 'Basic Plus Job', category: 'Monthly gift', invoiceDate: '23/06/2026', useBy: '22/06/2027' },
  { invoice: 'INV-005804/06/2026', companyId: 'CO-0092123', company: 'ITC Group', sales: 'Dương Thị Oanh', no: 2, product: 'Basic Plus Job', category: 'Monthly gift', invoiceDate: '23/06/2026', useBy: '22/06/2027', activated: '23/06/2026', jobId: '2114619', warranty: { type: 'Basic 30N' } },
  { invoice: 'INV-005804/06/2026', companyId: 'CO-0092123', company: 'ITC Group', sales: 'Dương Thị Oanh', no: 1, product: 'Basic Plus Job', category: 'Paid package', invoiceDate: '23/06/2026', useBy: '22/06/2027' },
  { invoice: 'INV-005804/06/2026', companyId: 'CO-0092123', company: 'ITC Group', sales: 'Dương Thị Oanh', no: 2, product: 'Basic Plus Job', category: 'Paid package', invoiceDate: '23/06/2026', useBy: '22/06/2027' },

  // Fictional — the two states the sheet's sample does not show.
  { invoice: 'INV-005901/10/2026', unpaid: true, companyId: 'CO-0099001', company: 'Công ty Demo ABC', sales: 'Thái Ngọc Hân', no: 1, product: 'Top Job', category: 'Paid package', invoiceDate: '10/10/2026', useBy: '09/10/2027', activated: '11/10/2026', jobId: '2125110' },
  { invoice: 'INV-004870/10/2025', companyId: 'CO-0099001', company: 'Công ty Demo ABC', sales: 'Thái Ngọc Hân', no: 1, product: 'Basic Job', category: 'Paid package', invoiceDate: '01/10/2025', useBy: '30/09/2026' },
]

export type QuStatus = 'Unused' | 'Used' | 'Expired'

/** Derived, never typed: a job id means Used; otherwise past Use by means Expired. */
export function statusOf(u: QuotaUnit): QuStatus {
  if (u.jobId) return 'Used'
  return asDate(u.useBy) < QU_TODAY ? 'Expired' : 'Unused'
}

/** Days until Use by, for an unused unit. */
export function daysToUseBy(u: QuotaUnit): number {
  return Math.round((asDate(u.useBy).getTime() - QU_TODAY.getTime()) / 86_400_000)
}

/* The INVOICE's status, read across every unit on it — the column that tells CS
   "nothing more to do here". Fully used = every unit used ("Đã dùng xong");
   Expired = nothing left to use and at least one unit expired ("Đã hết hạn");
   In use = at least one unit still unused. */
export type InvoiceStatus = 'In use' | 'Fully used' | 'Expired'
export function invoiceStatusOf(invoice: string): InvoiceStatus {
  const st = QUOTA_UNITS.filter((u) => u.invoice === invoice).map(statusOf)
  if (st.includes('Unused')) return 'In use'
  return st.includes('Expired') ? 'Expired' : 'Fully used'
}
