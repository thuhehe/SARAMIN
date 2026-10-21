import { Fragment, useState } from 'react'
import { cn } from '@/lib/utils'
import { Pill } from '@/pages/admin/ui/status'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { beneficiariesOf } from '@/pages/admin/data/sharedQuota'

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

/* `type` is the catalogue's product type — the column a rep scans to tell posting
   slots from CV unlocks on one invoice (client, 2026-10-21). */
type ProductType = 'Job posting' | 'CV search' | 'Display / placement' | 'Manual service' | 'Add-on'
/* `shared` — SHARED QUOTA: how much of `used` linked companies (beneficiaries) spent
   from this line, by company name. `used` is always the line's whole spend; the
   sponsor's own part is `used − Σ shared`. Same FEFO attribution as the rest of the
   table: a beneficiary's posting drains the sponsor's soonest-expiring line. */
type Line = { name: string; type: ProductType; total: number; used: number | null; shared?: Record<string, number> }
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
    { name: 'Super hot job plus', type: 'Job posting', total: 5, used: 0 },
    { name: 'Super hot job', type: 'Job posting', total: 5, used: 5 },
  ] },
  { no: 'INV-950101-10-2026', po: 'PO-950101-10-2026', issued: '05/10/2026', expires: '05/10/2027', amount: '202.543.200 ₫', lines: [
    { name: 'Top job', type: 'Job posting', total: 4, used: 4 },
    { name: 'Super hot job plus', type: 'Job posting', total: 4, used: 0 },
    { name: 'Super hot job', type: 'Job posting', total: 3, used: 2 },
    { name: 'Distinction', type: 'Job posting', total: 28, used: 0 },
  ] },
  { no: 'INV-003544-10-2026', po: 'PO-003544-10-2026', issued: '20/10/2026', expires: '20/10/2027', amount: '54.000.000 ₫', lines: [
    { name: 'Super hot job plus v3', type: 'Job posting', total: 10, used: 0 },
    { name: 'Top search add-on', type: 'Add-on', total: 10, used: null },
    { name: 'CV Search 90d', type: 'CV search', total: 200, used: 42 },
  ] },
  { no: 'INV-003475-09-2026', po: 'PO-003475-09-2026', issued: '28/09/2026', expires: '30/03/2027', amount: '513.000 ₫', lines: [
    { name: 'Top job 2026 — QC test', type: 'Job posting', total: 1, used: 1 },
    { name: 'Super-star tag', type: 'Add-on', total: 1, used: null },
  ] },
  { no: 'INV-003533-10-2026', po: 'PO-003533-10-2026', issued: '15/10/2026', expires: '16/04/2027', amount: '2.700.000 ₫', lines: [
    { name: 'Top job 2026 — QC test', type: 'Job posting', total: 2, used: 2 },
    { name: 'Super-star tag', type: 'Add-on', total: 2, used: null },
  ] },
  { no: 'INV-002981-09-2025', po: 'PO-002981-09-2025', issued: '12/09/2025', expires: '12/09/2026', amount: '45.000.000 ₫', lines: [
    { name: 'Basic job', type: 'Job posting', total: 10, used: 7 },
  ] },
]

/* Per-company holdings for the demo records the shared-quota seed uses. The numbers
   are the same ledger the Shared quota matrix reads (data/sharedQuota.ts): FPT's
   Top job 100 = 40 + 60, own use 38, Sao Mai 3, An Khang 1, Phú Thịnh 2 (removed).
   A beneficiary's record never reads these lines — it reads `drawsOf()` below,
   which returns only ITS OWN counts. Every other company shows the generic set. */
const SM = 'Công ty TNHH Sao Mai', AK = 'Công ty CP An Khang', PT = 'Công ty TNHH Phú Thịnh'
const HOLDINGS: Record<string, Inv[]> = {
  'FPT Software': [
    { no: 'INV-003210-07-2026', po: 'PO-003210-07-2026', issued: '01/07/2026', expires: '01/07/2027', amount: '386.400.000 ₫', lines: [
      { name: 'Top job', type: 'Job posting', total: 40, used: 40, shared: { [SM]: 3, [AK]: 1, [PT]: 2 } },
      { name: 'Basic', type: 'Job posting', total: 20, used: 6, shared: { [SM]: 2 } },
    ] },
    { no: 'INV-003464-09-2026', po: 'PO-003464-09-2026', issued: '10/09/2026', expires: '10/09/2027', amount: '512.000.000 ₫', lines: [
      { name: 'Top job', type: 'Job posting', total: 60, used: 4 },
      { name: 'Distinction', type: 'Job posting', total: 10, used: 0 },
      { name: 'CV search — COMBO 200', type: 'CV search', total: 200, used: 77, shared: { [SM]: 12, [PT]: 4 } },
    ] },
  ],
  'Tiki': [
    { no: 'INV-003451-09-2026', po: 'PO-003451-09-2026', issued: '01/09/2026', expires: '01/09/2027', amount: '96.000.000 ₫', lines: [
      { name: 'Job Posting — Pro', type: 'Job posting', total: 30, used: 9, shared: { [SM]: 1 } },
    ] },
  ],
  /* Beneficiaries that bought nothing themselves — everything they post is shared. */
  [SM]: [],
  [AK]: [],
}
export const holdingsOf = (name: string): Inv[] => HOLDINGS[name] ?? INVOICES

/** What ONE beneficiary spent from each sponsor line — the only numbers its record
    may show. No total, no remaining, no amount, no PO: the invoice NUMBER is the
    one fact of the sponsor's documents the client allowed through (25/09/2026). */
export type Draw = { sponsor: string; invoice: string; product: string; type: ProductType; used: number }
export const drawsOf = (beneficiary: string): Draw[] =>
  Object.entries(HOLDINGS).flatMap(([sponsor, invs]) => invs.flatMap((inv) => inv.lines
    .filter((l) => (l.shared?.[beneficiary] ?? 0) > 0)
    .map((l) => ({ sponsor, invoice: inv.no, product: l.name, type: l.type, used: l.shared![beneficiary] }))))

const short = (name: string) => { const x = COMPANIES.find((c) => c.name === name); return x ? coLabel(x) : name }

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

export function HoldingsByInvoice({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  const invs = holdingsOf(c.name)
  /* SPONSOR mode — some line carries other companies' spends. One extra column
     says whose: "Qty used" stays the line's whole spend (that is what "remaining"
     is computed from), and the new column is the part of it that was NOT the
     sponsor's own. Removed links stay on it, struck: a slot used is used. */
  const sponsor = invs.some((i) => i.lines.some((l) => l.shared))
  const removed = new Set(beneficiariesOf(c.name).filter((l) => l.status === 'removed').map((l) => l.beneficiary))
  const cols = sponsor ? 6 : 5
  const [filter, setFilter] = useState<InvStatus | 'All'>('All')
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  /* In use first, soonest expiry first — that IS the order the quota drains in, so
     the top invoice is the one the next posting will spend. Then Fully used, then
     Expired, newest first. */
  const rows = [...invs].sort((a, b) => {
    const sa = invStatus(a), sb = invStatus(b)
    if (sa !== sb) return ORDER[sa] - ORDER[sb]
    return sa === 'In use' ? day(a.expires).getTime() - day(b.expires).getTime() : day(b.issued).getTime() - day(a.issued).getTime()
  })
  const count = (s: InvStatus) => invs.filter((i) => invStatus(i) === s).length
  const shown = rows.filter((i) => filter === 'All' || invStatus(i) === filter)

  if (invs.length === 0) return (
    <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12px] text-muted">
      {coLabel(c)} chưa tự mua sản phẩm nào — chưa có hoá đơn của riêng mình. Nếu sau này tự mua, hoá đơn hiện ở đây như mọi công ty, tách khỏi phần dùng chung.
    </p>
  )

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {(['All', 'In use', 'Fully used', 'Expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('rounded-full border px-2.5 py-1 text-[11.5px]', filter === f ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line text-muted hover:bg-canvas')}
          >
            {f} <span className="tabular-nums opacity-70">{f === 'All' ? invs.length : count(f)}</span>
          </button>
        ))}
        <span className="ml-auto text-[10.5px] text-faint">Quota trừ theo hoá đơn hết hạn sớm nhất trước — hoá đơn In use đầu tiên là hoá đơn lần đăng tin tới sẽ trừ.</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className={cn('w-full border-collapse text-[12px]', sponsor ? 'min-w-[920px]' : 'min-w-[820px]')}>
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-faint">
              <th className="px-3 py-2">Product</th>
              <th className="w-[170px] px-3 py-2">Product type</th>
              <th className="w-[110px] px-3 py-2 text-right">Total qty</th>
              <th className="w-[110px] px-3 py-2 text-right">Qty used</th>
              {sponsor && <th className="w-[190px] px-3 py-2">Trong đó công ty liên kết</th>}
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
                    <td colSpan={cols} className="px-3 py-2">
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
                      <tr key={inv.no + l.name} className="border-t border-line-soft">
                        <td className="py-2 pl-11 pr-3 text-ink">{l.name}</td>
                        <td className="px-3 py-2 text-muted">{l.type}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.total}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {l.used === null ? <span className="text-faint" title="Đi kèm một tin đăng — không trừ riêng">—</span> : l.used}
                          {sponsor && l.shared && l.used !== null && (
                            <span className="block text-[10px] text-faint">tự dùng {l.used - Object.values(l.shared).reduce((a, b) => a + b, 0)}</span>
                          )}
                        </td>
                        {sponsor && (
                          <td className="px-3 py-2 text-[11.5px]">
                            {l.shared ? (
                              <span className="flex flex-wrap gap-x-2.5 gap-y-0.5">
                                {Object.entries(l.shared).map(([name, n]) => {
                                  const x = COMPANIES.find((co) => co.name === name)
                                  const gone = removed.has(name)
                                  return (
                                    <span key={name} className="whitespace-nowrap" title={gone ? 'Link đã Remove — số đã dùng vẫn giữ' : undefined}>
                                      <button onClick={() => x && onOpen?.(x)} className={cn('hover:underline', gone ? 'text-faint line-through' : 'text-brand')}>{short(name)}</button>{' '}
                                      <b className={cn('tabular-nums', gone ? 'font-normal text-faint' : 'text-ink')}>{n}</b>
                                    </span>
                                  )
                                })}
                              </span>
                            ) : <span className="text-faint">—</span>}
                          </td>
                        )}
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
        {sponsor && <> <b className="text-muted">Qty used</b> là toàn bộ số đã dùng trên dòng, kể cả công ty liên kết; cột bên cạnh tách phần của họ, tên gạch là link đã Remove.</>}
      </p>
    </div>
  )
}
