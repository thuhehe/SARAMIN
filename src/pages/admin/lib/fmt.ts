/*
 * Formatting shared across admin screens: money, dates, and the VI/EN amount-in-
 * words readers the quotation and invoice PDFs print.
 */
export const revFmt = (v: number) => (v === 0 ? '—' : (v / 1e6).toFixed(0) + 'M ₫')

/* Fixed "today" for the mock so the dates it derives stay stable across reloads
   and match the hand-written dates elsewhere in the data (lastPO, renewal…). */
export const MOCK_TODAY = new Date(2026, 7, 8)
/** A gap in days, rendered as the DATE that gap points back to — dd/mm/yyyy.
    `short` drops the year, for places where the column is one of several things
    competing for a narrow card. The full date is always in the tooltip. */
export function dateBefore(days: number, short?: boolean): string {
  const d = new Date(MOCK_TODAY)
  d.setDate(d.getDate() - days)
  const dm = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  return short ? dm : `${dm}/${d.getFullYear()}`
}
/** Full VND — e.g. 18,000,000 ₫ (pipeline values are read exactly, not rounded to M). */
export const vnd = (v: number) => v.toLocaleString('en-US') + ' ₫'
export const asDate = (d: string) => {
  const [dd, mm, yy] = d.split('/').map(Number)
  return new Date(yy, mm - 1, dd)
}
export const money = (v: number) => (v / 1e6).toFixed(1) + 'M ₫'

/* A quotation ALWAYS expires on the last day of the month it was created in —
   not after a fixed number of days. So validity shrinks through the month, and
   every quote raised in a month lapses together. Derived, never typed. */
export function endOfMonth(ddmmyyyy: string) {
  const [, mm, yyyy] = ddmmyyyy.split('/').map(Number)
  if (!mm || !yyyy) return '—'
  const last = new Date(yyyy, mm, 0).getDate()
  return `${String(last).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yyyy}`
}
/** Days left on a quotation raised on `created`, as of `today`. */
export function daysLeft(created: string, today: string) {
  const p = (d: string) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd) }
  const exp = p(endOfMonth(created))
  const n = Math.round((exp.getTime() - p(today).getTime()) / 86_400_000)
  return n
}

const VN_D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
function vnRead3(n: number, full: boolean) {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10
  let s = ''
  if (full || tr > 0) s += VN_D[tr] + ' trăm'
  if (ch === 0 && dv > 0) s += ((tr > 0 || full) ? ' lẻ ' : ' ') + VN_D[dv]
  else if (ch === 1) s += ' mười' + (dv > 0 ? ' ' + (dv === 5 ? 'lăm' : VN_D[dv]) : '')
  else if (ch > 1) s += ' ' + VN_D[ch] + ' mươi' + (dv === 1 ? ' một' : dv === 5 ? ' lăm' : dv > 0 ? ' ' + VN_D[dv] : '')
  return s.trim()
}
/** Bằng chữ — the PDF's amount-in-words, generated. 6,588,000 → "Sáu triệu năm trăm tám mươi tám nghìn đồng." */
export function vnWords(n: number) {
  if (n <= 0) return 'Không đồng'
  const g: number[] = []
  for (let x = n; x > 0; x = Math.floor(x / 1000)) g.unshift(x % 1000)
  const scales = ['', 'nghìn', 'triệu', 'tỷ']
  const parts = g.map((v, i) => (v === 0 ? '' : (vnRead3(v, i > 0) + ' ' + scales[g.length - 1 - i]).trim())).filter(Boolean)
  const s = parts.join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng'
}

/** The PDF's English "In words:" line. 6,588,000 → "Six million five hundred
    eighty-eight thousand VND." Same generated-never-typed rule as vnWords. */
const EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
function enRead3(n: number): string {
  const h = Math.floor(n / 100), r = n % 100
  const out: string[] = []
  if (h) out.push(`${EN_ONES[h]} hundred`)
  if (r < 20) { if (r) out.push(EN_ONES[r]) }
  else {
    const t = Math.floor(r / 10), u = r % 10
    out.push(u ? `${EN_TENS[t]}-${EN_ONES[u]}` : EN_TENS[t])
  }
  return out.join(' ')
}
export function enWords(n: number) {
  if (n <= 0) return 'Zero VND'
  const g: number[] = []
  for (let x = n; x > 0; x = Math.floor(x / 1000)) g.unshift(x % 1000)
  const scales = ['', 'thousand', 'million', 'billion']
  const parts = g.map((v, i) => (v === 0 ? '' : `${enRead3(v)} ${scales[g.length - 1 - i]}`.trim())).filter(Boolean)
  const s = parts.join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1) + ' VND'
}

/** "20/07/2026" → a sortable number. A dash (no date) sorts last. */
export function dmy(d: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d.trim())
  return m ? Number(m[3] + m[2] + m[1]) : Number.MAX_SAFE_INTEGER
}
