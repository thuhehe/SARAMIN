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
  /* SPONSOR mode — ONE table for every invoice AND every linked company (client,
     2026-10-21: "1 bảng duy nhất cho nhiều invoice và theo dõi cty thụ hưởng").
     The old per-product matrix is folded in as COLUMNS: the sponsor's own use,
     then one column per linked company, under one "Đã dùng" group header. Rows stay
     the invoice lines, so "which invoice" and "which company" read off the same
     cell. Qty used = the sum across those columns; remaining comes from it. A
     removed link keeps its column (muted) — a slot used is used. */
  const links = beneficiariesOf(c.name)
  const sponsor = links.length > 0 || invs.some((i) => i.lines.some((l) => l.shared))
  const benefs = links.map((l) => ({ name: l.beneficiary, removed: l.status === 'removed', co: COMPANIES.find((x) => x.name === l.beneficiary) }))
  const [split, setSplit] = useState(true)
  const byCo = sponsor && split
  const cols = 5 + (byCo ? benefs.length + 1 : 0)
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
  const sharedSum = (l: Line) => Object.values(l.shared ?? {}).reduce((x, y) => x + y, 0)
  const own = (l: Line) => (l.used ?? 0) - sharedSum(l)
  /* Footer: what each company has drawn across the invoices on screen. Units mix
     (slots + unlocks), same as the old matrix's TỔNG — the per-line cells above are
     the exact figures; this row answers "who uses most". */
  const spend = shown.flatMap((i) => i.lines).filter((l) => l.used !== null)
  const colTotal = (name: string | null) => spend.reduce((s, l) => s + (name === null ? own(l) : l.shared?.[name] ?? 0), 0)

  if (invs.length === 0) return (
    <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12px] text-muted">
      {coLabel(c)} chưa tự mua sản phẩm nào — chưa có hoá đơn của riêng mình. Nếu sau này tự mua, hoá đơn hiện ở đây như mọi công ty, tách khỏi phần dùng chung.
    </p>
  )

  const num = (n: number, muted?: boolean) => <span className={cn('tabular-nums', n === 0 ? 'text-faint' : muted ? 'text-faint' : 'font-semibold text-ink')}>{n === 0 ? '—' : n}</span>
  const stick = 'sticky left-0 z-10'
  const th = 'px-3 py-2 text-right whitespace-nowrap'

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
        {sponsor && (
          <label className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11.5px] text-muted hover:bg-canvas">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} className="accent-brand" />
            Tách số đã dùng theo công ty
          </label>
        )}
        <span className="ml-auto text-[10.5px] text-faint">Quota trừ theo hoá đơn hết hạn sớm nhất trước — hoá đơn In use đầu tiên là hoá đơn lần đăng tin tới sẽ trừ.</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-[12px]" style={{ minWidth: 820 + (byCo ? (benefs.length + 1) * 96 : 0) }}>
          <thead className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">
            {byCo && (
              <tr className="bg-canvas/60">
                <th colSpan={5} className={cn(stick, 'bg-canvas')} />
                <th colSpan={benefs.length + 1} className="border-l border-b border-line px-3 pb-1 pt-2 text-center">Qty used — tách theo công ty</th>
              </tr>
            )}
            <tr className="border-b border-line bg-canvas/60 text-left">
              <th className={cn(stick, 'min-w-[200px] bg-canvas px-3 py-2')}>Product</th>
              <th className="w-[130px] px-3 py-2">Product type</th>
              <th className={cn(th, 'w-[90px]')}>Total qty</th>
              <th className={cn(th, 'w-[90px]')}>Qty used</th>
              <th className={cn(th, 'w-[110px]')}>Qty remaining</th>
              {byCo && (
                <>
                  <th className={cn(th, 'border-l border-line normal-case tracking-normal text-ink/80')}>{coLabel(c)}<span className="block text-[9.5px] font-normal text-faint">sponsor · tự dùng</span></th>
                  {benefs.map((b) => (
                    <th key={b.name} className={cn(th, 'normal-case tracking-normal')}>
                      <button onClick={() => b.co && onOpen?.(b.co)} className={cn('hover:underline', b.removed ? 'text-faint line-through' : 'text-brand')}>{b.co ? coLabel(b.co) : b.name}</button>
                      <span className="block text-[9.5px] font-normal text-faint">{b.removed ? 'đã Remove' : 'thụ hưởng'}</span>
                    </th>
                  ))}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {shown.map((inv) => {
              const st = invStatus(inv)
              const isClosed = closed[inv.no] ?? st !== 'In use'
              const head = st === 'In use' ? 'bg-[#f3f7ff]' : 'bg-canvas'
              return (
                <Fragment key={inv.no}>
                  {/* INVOICE HEADER ROW — the four facts the client asked for, in one line */}
                  <tr className={cn('border-t border-line', head)}>
                    <td colSpan={cols} className="p-0">
                      <div className={cn(stick, 'flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2', head)}>
                        <button
                          onClick={() => setClosed((x) => ({ ...x, [inv.no]: !isClosed }))}
                          className="grid h-5 w-5 place-items-center rounded border border-line bg-surface text-[11px] text-muted"
                          aria-label={isClosed ? 'Mở' : 'Thu gọn'}
                        >{isClosed ? '+' : '−'}</button>
                        <span className="font-mono text-[12px] font-semibold text-brand">{inv.no}</span>
                        <span className="text-muted">Ngày xuất <b className="font-medium tabular-nums text-ink/80">{inv.issued}</b></span>
                        <span className="text-muted">Hết hạn <b className={cn('font-medium tabular-nums', st === 'Expired' ? 'text-rose-600' : 'text-ink/80')}>{inv.expires}</b></span>
                        <Pill tone={TONE[st]}>{st}</Pill>
                        <span className="font-mono text-[11px] text-faint">{inv.po}</span>
                        <b className="text-[11px] font-semibold tabular-nums text-ink/80">{inv.amount}</b>
                      </div>
                    </td>
                  </tr>
                  {/* PRODUCT LINES of that invoice */}
                  {!isClosed && inv.lines.map((l) => {
                    const left = l.used === null ? null : l.total - l.used
                    return (
                      <tr key={inv.no + l.name} className="border-t border-line-soft">
                        <td className={cn(stick, 'bg-surface py-2 pl-11 pr-3 text-ink')}>{l.name}</td>
                        <td className="px-3 py-2 text-muted">{l.type}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.total}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {l.used === null ? <span className="text-faint" title="Đi kèm một tin đăng — không trừ riêng">—</span> : byCo ? <b className="font-semibold">{l.used}</b> : l.used}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {left === null ? <span className="text-[10.5px] text-faint">đi kèm tin</span>
                            : st === 'Expired' && left > 0 ? <span className="text-faint line-through" title="Hoá đơn đã hết hạn — phần còn lại không dùng được nữa">{left}</span>
                            : <b className={cn('font-semibold', left === 0 ? 'text-faint' : 'text-brand')}>{left}</b>}
                        </td>
                        {byCo && (
                          l.used === null
                            ? <td colSpan={benefs.length + 1} className="border-l border-line-soft px-3 py-2 text-center text-[10.5px] text-faint">đi kèm tin đăng — không trừ riêng</td>
                            : <>
                                <td className="border-l border-line-soft px-3 py-2 text-right">{num(own(l))}</td>
                                {benefs.map((b) => (
                                  <td key={b.name} className={cn('px-3 py-2 text-right')}>{num(l.shared?.[b.name] ?? 0, b.removed)}</td>
                                ))}
                              </>
                        )}
                      </tr>
                    )
                  })}
                </Fragment>
              )
            })}
          </tbody>
          {byCo && (
            <tfoot>
              <tr className="border-t-2 border-line bg-canvas/70 text-[11.5px]">
                <td colSpan={3} className={cn(stick, 'bg-canvas px-3 py-2 font-semibold text-ink/80')}>
                  Tổng đã dùng theo công ty<span className="block text-[10px] font-normal text-faint">trên các hoá đơn đang hiện · cộng chung slot và lượt mở CV</span>
                </td>
                <td className="px-3 py-2 text-right"><b className="tabular-nums">{spend.reduce((s, l) => s + (l.used ?? 0), 0)}</b></td>
                <td />
                <td className="border-l border-line px-3 py-2 text-right">{num(colTotal(null))}</td>
                {benefs.map((b) => <td key={b.name} className={cn('px-3 py-2 text-right')}>{num(colTotal(b.name), b.removed)}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
        <b className="text-muted">In use</b> — còn hạn và còn ít nhất một dòng chưa dùng hết. <b className="text-muted">Fully used</b> — còn hạn nhưng mọi dòng đã dùng hết.{' '}
        <b className="text-muted">Expired</b> — quá ngày hết hạn; phần còn lại bị gạch và không dùng được nữa. Dòng add-on (Top search, Super-star tag) đi kèm tin đăng nên không có số đã dùng và không giữ hoá đơn ở In use.
        Hoá đơn Fully used và Expired thu gọn sẵn — bấm + để xem.
        {byCo && <> Mỗi công ty được link là <b className="text-muted">một cột</b> — link thêm thì thêm cột, cuộn ngang khi nhiều; cột Product đứng yên. <b className="text-muted">Qty used</b> = tổng các cột công ty bên phải; tên gạch là link đã Remove — số đã dùng vẫn giữ. Bỏ tick "Tách theo công ty" để về bảng gọn.</>}
      </p>
    </div>
  )
}
