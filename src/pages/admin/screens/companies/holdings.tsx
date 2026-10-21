import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { Pill } from '@/pages/admin/ui/status'

/* ── What this company holds — BY INVOICE ─────────────────────────────────────
 * Client feedback 2026-10-21: the build listed one row per PRODUCT with the
 * invoices it was bought on stacked in the right-hand cells, so a product bought
 * on three invoices showed three dates and three totals in one row and nobody
 * could tell which invoice was still running. This turns it inside out: one
 * header row per INVOICE (number · issue date · expiry · status), and under it
 * the product lines that invoice bought, each with its own total / used / left.
 *
 * WHY PER-INVOICE COUNTS ARE POSSIBLE: quota is spent soonest-expiry-first
 * (FEFO), so every unit used is attributable to exactly one invoice line. The
 * build keeps ONE shared counter per posting tier across invoices — showing
 * this table needs the backend to record which invoice line each spend came
 * from. That is the one real dependency of this layout. */

type Line = { name: string; code: string; total: number; used: number | null }
type Inv = { no: string; po: string; issued: string; expires: string; amount: string; lines: Line[] }
type InvStatus = 'In use' | 'Fully used' | 'Expired'

/* Mock "today" for the prototype — the same date the screenshot was taken. */
const TODAY = new Date(2026, 9, 21)
const day = (d: string) => { const [dd, mm, yy] = d.split('/').map(Number); return new Date(yy, mm - 1, dd) }

/* A line with used === null is an ADD-ON that rides on a posting (Top search,
   Super-star tag): it has a count on the invoice but is never spent on its own,
   so it can neither run out nor keep an invoice "In use". */
const INVOICES: Inv[] = [
  { no: 'INV-003440-09-2026', po: 'PO-003440-09-2026', issued: '15/09/2026', expires: '15/09/2027', amount: '198.504.000 ₫', lines: [
    { name: 'Super hot job plus', code: 'JOB-SUPERHOT-PLUS', total: 5, used: 0 },
    { name: 'Super hot job', code: 'JOB-SUPERHOT', total: 5, used: 5 },
  ] },
  { no: 'INV-950101-10-2026', po: 'PO-950101-10-2026', issued: '05/10/2026', expires: '05/10/2027', amount: '202.543.200 ₫', lines: [
    { name: 'Top job', code: 'JOB-TOPJOB', total: 4, used: 4 },
    { name: 'Super hot job plus', code: 'JOB-SUPERHOT-PLUS', total: 4, used: 0 },
    { name: 'Super hot job', code: 'JOB-SUPERHOT', total: 3, used: 2 },
    { name: 'Distinction', code: 'JOB-DISTINCTION', total: 28, used: 0 },
  ] },
  { no: 'INV-003544-10-2026', po: 'PO-003544-10-2026', issued: '20/10/2026', expires: '20/10/2027', amount: '54.000.000 ₫', lines: [
    { name: 'Super hot job plus v3', code: 'JOB-SUPER-HOT-JOB-PLUS-V3', total: 10, used: 0 },
    { name: 'Top search add-on', code: 'JOB-TOP-SEARCH-ADD-ON', total: 10, used: null },
  ] },
  { no: 'INV-003475-09-2026', po: 'PO-003475-09-2026', issued: '28/09/2026', expires: '30/03/2027', amount: '513.000 ₫', lines: [
    { name: 'Top job 2026 — QC test', code: 'JOB-TOP-JOB-2026-QC-TEST', total: 1, used: 1 },
    { name: 'Super-star tag', code: 'JOB-SUPER-STAR-TAG', total: 1, used: null },
  ] },
  { no: 'INV-003533-10-2026', po: 'PO-003533-10-2026', issued: '15/10/2026', expires: '16/04/2027', amount: '2.700.000 ₫', lines: [
    { name: 'Top job 2026 — QC test', code: 'JOB-TOP-JOB-2026-QC-TEST', total: 2, used: 2 },
    { name: 'Super-star tag', code: 'JOB-SUPER-STAR-TAG', total: 2, used: null },
  ] },
  { no: 'INV-002981-09-2025', po: 'PO-002981-09-2025', issued: '12/09/2025', expires: '12/09/2026', amount: '45.000.000 ₫', lines: [
    { name: 'Basic job', code: 'JOB-BASIC', total: 10, used: 7 },
  ] },
]

/* Expired wins over everything: a lapsed invoice with units left has not been
   "used", its leftovers are forfeit. Otherwise Fully used when every SPENDABLE
   line is at zero — add-ons do not count, they are never spent on their own. */
export function invStatus(inv: Inv): InvStatus {
  if (day(inv.expires) < TODAY) return 'Expired'
  const spendable = inv.lines.filter((l) => l.used !== null)
  return spendable.every((l) => l.total - (l.used ?? 0) <= 0) ? 'Fully used' : 'In use'
}
const TONE = { 'In use': 'active', 'Fully used': 'draft', Expired: 'expired' } as const
const ORDER: Record<InvStatus, number> = { 'In use': 0, 'Fully used': 1, Expired: 2 }

export function HoldingsByInvoice() {
  const [filter, setFilter] = useState<InvStatus | 'All'>('All')
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  /* In use first, soonest expiry first — that IS the order the quota drains in, so
     the top invoice is the one the next posting will spend. Then Fully used, then
     Expired, newest first. */
  const rows = [...INVOICES].sort((a, b) => {
    const sa = invStatus(a), sb = invStatus(b)
    if (sa !== sb) return ORDER[sa] - ORDER[sb]
    return sa === 'In use' ? day(a.expires).getTime() - day(b.expires).getTime() : day(b.issued).getTime() - day(a.issued).getTime()
  })
  const count = (s: InvStatus) => INVOICES.filter((i) => invStatus(i) === s).length
  const shown = rows.filter((i) => filter === 'All' || invStatus(i) === filter)

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {(['All', 'In use', 'Fully used', 'Expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('rounded-full border px-2.5 py-1 text-[11.5px]', filter === f ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line text-muted hover:bg-canvas')}
          >
            {f} <span className="tabular-nums opacity-70">{f === 'All' ? INVOICES.length : count(f)}</span>
          </button>
        ))}
        <span className="ml-auto text-[10.5px] text-faint">Quota trừ theo hoá đơn hết hạn sớm nhất trước — hoá đơn In use đầu tiên là hoá đơn lần đăng tin tới sẽ trừ.</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[820px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-faint">
              <th className="px-3 py-2">Product</th>
              <th className="w-[110px] px-3 py-2 text-right">Total qty</th>
              <th className="w-[110px] px-3 py-2 text-right">Qty used</th>
              <th className="w-[130px] px-3 py-2 text-right">Qty remaining</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((inv) => {
              const st = invStatus(inv)
              const isClosed = closed[inv.no] ?? st !== 'In use'
              return (
                <Fragment key={inv.no}>
                  {/* INVOICE HEADER ROW — the four facts the client asked for, in one line */}
                  <tr className={cn('border-t border-line', st === 'In use' ? 'bg-brand-soft/30' : 'bg-canvas/50')}>
                    <td colSpan={4} className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <button
                          onClick={() => setClosed((c) => ({ ...c, [inv.no]: !isClosed }))}
                          className="grid h-5 w-5 place-items-center rounded border border-line bg-surface text-[11px] text-muted"
                          aria-label={isClosed ? 'Mở' : 'Thu gọn'}
                        >{isClosed ? '+' : '−'}</button>
                        <span className="font-mono text-[12px] font-semibold text-brand">{inv.no}</span>
                        <span className="text-muted">Ngày xuất <b className="font-medium tabular-nums text-ink/80">{inv.issued}</b></span>
                        <span className="text-muted">Hết hạn <b className={cn('font-medium tabular-nums', st === 'Expired' ? 'text-rose-600' : 'text-ink/80')}>{inv.expires}</b></span>
                        <Pill tone={TONE[st]}>{st}</Pill>
                        <span className="ml-auto flex items-center gap-3 text-[11px] text-faint">
                          <span className="font-mono">{inv.po}</span>
                          <b className="font-semibold tabular-nums text-ink/80">{inv.amount}</b>
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* PRODUCT LINES of that invoice */}
                  {!isClosed && inv.lines.map((l) => {
                    const left = l.used === null ? null : l.total - l.used
                    return (
                      <tr key={inv.no + l.code} className="border-t border-line-soft">
                        <td className="py-2 pl-11 pr-3">
                          <p className="text-ink">{l.name}</p>
                          <p className="text-[10.5px] text-faint">{l.code} · job slots</p>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.total}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {l.used === null ? <span className="text-faint" title="Đi kèm một tin đăng — không trừ riêng">—</span> : l.used}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {left === null ? <span className="text-[10.5px] text-faint">đi kèm tin</span>
                            : st === 'Expired' && left > 0 ? <span className="text-faint line-through" title="Hoá đơn đã hết hạn — phần còn lại không dùng được nữa">{left}</span>
                            : <b className={cn('font-semibold', left === 0 ? 'text-faint' : 'text-ink')}>{left}</b>}
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
        <b className="text-muted">In use</b> — còn hạn và còn ít nhất một dòng chưa dùng hết. <b className="text-muted">Fully used</b> — còn hạn nhưng mọi dòng đã dùng hết.{' '}
        <b className="text-muted">Expired</b> — quá ngày hết hạn; phần còn lại bị gạch và không dùng được nữa. Dòng add-on (Top search, Super-star tag) đi kèm tin đăng nên không có số đã dùng và không giữ hoá đơn ở In use.
        Hoá đơn Fully used và Expired thu gọn sẵn — bấm + để xem.
      </p>
    </div>
  )
}
