import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Pill } from '@/pages/admin/ui/status'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { beneficiariesOf, sponsorsOf } from '@/pages/admin/data/sharedQuota'

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
/* `warranty` — a compensation line (client, 2026-10-21: "warranty ở trong Invoice
   lun"). It sits on the invoice of the product it makes good, right under that
   line: the build lists warranties beside gifts with no invoice, but a warranty
   always HAS one — the purchase that under-delivered. Only free products (gifts)
   stay in a table of their own. */
type Warranty = { of: string; on: string; reason: string; validUntil: string }
type Line = { name: string; type: ProductType; total: number; used: number | null; shared?: Record<string, number>; warranty?: Warranty }
/* `notShared` — an own invoice of a sponsor that nobody else ever drew on, because
   it ran out before the first link existed. Its reason is the tooltip. */
type Inv = { no: string; po: string; issued: string; expires: string; amount: string; lines: Line[]; notShared?: string }
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
    { name: 'CV Search 90d', type: 'CV search', total: 7, used: 0, warranty: { of: 'CV Search 90d', on: '09/10/2026', reason: 'Không ứng viên nào mở CV', validUntil: '11/11/2026' } },
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
const SM = 'Công ty TNHH Sao Mai', AK = 'Công ty CP An Khang', PT = 'Công ty TNHH Phú Thịnh', TK = 'Tiki'
const HOLDINGS: Record<string, Inv[]> = {
  'FPT Software': [
    { no: 'INV-003210-07-2026', po: 'PO-003210-07-2026', issued: '01/07/2026', expires: '01/07/2027', amount: '386.400.000 ₫', lines: [
      { name: 'Top job', type: 'Job posting', total: 40, used: 40, shared: { [SM]: 3, [AK]: 1, [PT]: 2 } },
      { name: 'Basic', type: 'Job posting', total: 20, used: 6, shared: { [SM]: 2 } },
    ] },
    { no: 'INV-003464-09-2026', po: 'PO-003464-09-2026', issued: '10/09/2026', expires: '10/09/2027', amount: '512.000.000 ₫', lines: [
      { name: 'Top job', type: 'Job posting', total: 60, used: 6, shared: { [TK]: 2 } },
      { name: 'Distinction', type: 'Job posting', total: 10, used: 0 },
      { name: 'CV search — COMBO 200', type: 'CV search', total: 200, used: 86, shared: { [SM]: 12, [PT]: 4, [TK]: 9 } },
      { name: 'CV search — COMBO 200', type: 'CV search', total: 10, used: 3, warranty: { of: 'CV search — COMBO 200', on: '12/10/2026', reason: '10 CV mở ra đã đi làm — đổi lượt mở mới', validUntil: '10/09/2027' } },
    ] },
  ],
  /* BOTH ROLES — Tiki sponsors Sao Mai (its July invoice), draws on FPT Software,
     and holds an October invoice nobody else has used yet. One level only: the FPT
     invoices it rides on are NOT passed on to Sao Mai. */
  'Tiki': [
    { no: 'INV-003012-05-2026', po: 'PO-003012-05-2026', issued: '20/05/2026', expires: '20/11/2026', amount: '64.800.000 ₫', notShared: 'Tiki dùng hết 10/10 ngày 28/08/2026 — trước khi link Sao Mai (05/09/2026)', lines: [
      { name: 'Top job', type: 'Job posting', total: 10, used: 10 },
      { name: 'Distinction', type: 'Job posting', total: 4, used: 4 },
    ] },
    { no: 'INV-003589-10-2026', po: 'PO-003589-10-2026', issued: '16/10/2026', expires: '16/04/2027', amount: '48.600.000 ₫', lines: [
      { name: 'Top job', type: 'Job posting', total: 5, used: 2 },
      { name: 'Super-star tag', type: 'Add-on', total: 5, used: null },
    ] },
    { no: 'INV-003451-09-2026', po: 'PO-003451-09-2026', issued: '01/09/2026', expires: '01/09/2027', amount: '96.000.000 ₫', lines: [
      { name: 'Job Posting — Pro', type: 'Job posting', total: 30, used: 9, shared: { [SM]: 1 } },
    ] },
  ],
  /* INDEPENDENT — buys for itself, shares with no one, draws from no one. Matches
     its record: job posting only (no CV search), 4 of 10 slots left on the July PO. */
  'Công ty CP Giáo dục Én Nhỏ': [
    { no: 'INV-003391-07-2026', po: 'PO-003391-07-2026', issued: '20/07/2026', expires: '20/07/2027', amount: '58.320.000 ₫', lines: [
      { name: 'Job Posting — Standard', type: 'Job posting', total: 10, used: 6 },
      { name: 'Job Posting — Standard', type: 'Job posting', total: 1, used: 0, warranty: { of: 'Job Posting — Standard', on: '02/10/2026', reason: 'Tin hết hạn không có ứng viên — đăng lại miễn phí', validUntil: 'Not started' } },
      { name: 'Top search add-on', type: 'Add-on', total: 3, used: null },
    ] },
    { no: 'INV-003598-10-2026', po: 'PO-003598-10-2026', issued: '12/10/2026', expires: '12/10/2027', amount: '72.900.000 ₫', lines: [
      { name: 'Top job', type: 'Job posting', total: 3, used: 1 },
      { name: 'Distinction', type: 'Job posting', total: 5, used: 0 },
    ] },
    { no: 'INV-002417-01-2025', po: 'PO-002417-01-2025', issued: '21/01/2025', expires: '21/01/2026', amount: '24.300.000 ₫', lines: [
      { name: 'Job Posting — Basic', type: 'Job posting', total: 5, used: 5 },
    ] },
  ],
  /* Beneficiaries that bought nothing themselves — everything they post is shared. */
  /* Sao Mai buys a little itself AND draws on two sponsors — the case that needs
     "which invoice is mine, which one am I riding on" on one table. */
  [SM]: [
    { no: 'INV-003577-10-2026', po: 'PO-003577-10-2026', issued: '14/10/2026', expires: '14/10/2027', amount: '31.860.000 ₫', lines: [
      { name: 'Basic', type: 'Job posting', total: 5, used: 1 },
      { name: 'Top job', type: 'Job posting', total: 2, used: 0 },
    ] },
  ],
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
  /* TWO PARTS, split by SOURCE (client, 2026-10-21). A sponsor only ever shares what
     it bought, so "invoices as sponsor" = its own purchases; "invoices as
     beneficiary" = the sponsors'. Each part keeps one column set:
       OWN PURCHASE — full numbers (total · used · remaining). On a sponsor, and only
         here, a "theo công ty" group splits Qty used: its own part, then one
         column per company it shares with.
       SPONSORED BY OTHER COMPANIES — only the products THIS company used, and only
         its own count. No total, no remaining, no PO, no amount: those are the
         sponsor's (client, 25/09/2026 and 21/10/2026).
     Independent and pure sponsor: part 1 only, no heading. */
  const sponsorLinks = sponsorsOf(c.name)
  const benef = sponsorLinks.length > 0
  const ownInvs = holdingsOf(c.name)
  /* A sponsor invoice that was never shared (ran out before the link) is not the beneficiary's to see. */
  const borrowed = sponsorLinks.flatMap((l) => (HOLDINGS[l.sponsor] ?? []).filter((inv) => !inv.notShared).map((inv) => ({ inv, sponsor: l.sponsor })))
  const borrowedNos = new Set(borrowed.map((b) => b.inv.no))
  const links = beneficiariesOf(c.name)
  const sponsor = links.length > 0
  const benefs = links.map((l) => ({ name: l.beneficiary, removed: l.status === 'removed', co: COMPANIES.find((x) => x.name === l.beneficiary) }))
  const [split, setSplit] = useState(true)
  const byCo = sponsor && split
  const [filter, setFilter] = useState<InvStatus | 'All'>('All')
  const [source, setSource] = useState<'all' | 'own' | 'shared'>('all')
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  /* In use first, soonest expiry first — that IS the order the quota drains in.
     Then Fully used, then Expired, newest first. */
  const byDrain = (a: Inv, b: Inv) => {
    const sa = invStatus(a), sb = invStatus(b)
    if (sa !== sb) return ORDER[sa] - ORDER[sb]
    return sa === 'In use' ? day(a.expires).getTime() - day(b.expires).getTime() : day(b.issued).getTime() - day(a.issued).getTime()
  }
  const statusOk = (i: Inv) => filter === 'All' || invStatus(i) === filter
  const sourceOk = (i: Inv) => source === 'all' || (source === 'shared') === borrowedNos.has(i.no)
  const all = [...ownInvs, ...borrowed.map((b) => b.inv)]
  const count = (st: InvStatus) => all.filter((i) => sourceOk(i) && invStatus(i) === st).length
  const ownShown = source === 'shared' ? [] : ownInvs.filter(statusOk).sort(byDrain)
  const borShown = source === 'own' ? [] : borrowed.filter((b) => statusOk(b.inv)).sort((x, y) => byDrain(x.inv, y.inv))

  const sharedSum = (l: Line) => Object.values(l.shared ?? {}).reduce((x, y) => x + y, 0)
  const own = (l: Line) => (l.used ?? 0) - sharedSum(l)
  const num = (n: number, muted?: boolean) => <span className={cn('tabular-nums', n === 0 || muted ? 'text-faint' : 'font-semibold text-ink')}>{n === 0 ? '—' : n}</span>
  const nameOf = (n: string) => { const x = COMPANIES.find((co) => co.name === n); return x ? coLabel(x) : n }
  const openCo = (n: string) => { const x = COMPANIES.find((co) => co.name === n); if (x) onOpen?.(x) }
  const stick = 'sticky left-0 z-10'
  const th = 'px-3 py-2 text-right whitespace-nowrap'
  const productCell = (l: Line) => l.warranty ? (
    <td className={cn(stick, 'bg-surface py-2 pl-11 pr-3 text-ink')}>
      <span className="flex items-center gap-1.5">
        <span className="text-faint">↳</span>{l.name}
        <span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-px text-[10px] font-semibold text-violet-700">Warranty</span>
      </span>
      <span className="block pl-4 text-[10.5px] leading-snug text-faint">{l.warranty.on} · {l.warranty.reason} · hạn dùng {l.warranty.validUntil}</span>
    </td>
  ) : <td className={cn(stick, 'bg-surface py-2 pl-11 pr-3 text-ink')}>{l.name}</td>

  /* The invoice header row — the four facts, then the source tag, then (own only) the amount. */
  const head = (inv: Inv, cols: number, tag: ReactNode, amount: boolean) => {
    const st = invStatus(inv)
    const isClosed = closed[inv.no] ?? st !== 'In use'
    const bg = st === 'In use' ? 'bg-[#f3f7ff]' : 'bg-canvas'
    return {
      isClosed,
      row: (
        <tr className={cn('border-t border-line', bg)}>
          <td colSpan={cols} className="p-0">
            <div className={cn(stick, 'flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2', bg)}>
              <button
                onClick={() => setClosed((x) => ({ ...x, [inv.no]: !isClosed }))}
                className="grid h-5 w-5 place-items-center rounded border border-line bg-surface text-[11px] text-muted"
                aria-label={isClosed ? 'Mở' : 'Thu gọn'}
              >{isClosed ? '+' : '−'}</button>
              <span className="font-mono text-[12px] font-semibold text-brand">{inv.no}</span>
              <span className="text-muted">Ngày xuất <b className="font-medium tabular-nums text-ink/80">{inv.issued}</b></span>
              <span className="text-muted">Hết hạn <b className={cn('font-medium tabular-nums', st === 'Expired' ? 'text-rose-600' : 'text-ink/80')}>{inv.expires}</b></span>
              <Pill tone={TONE[st]}>{st}</Pill>
              {tag}
              {amount && <b className="text-[11px] font-semibold tabular-nums text-ink/80">{inv.amount}</b>}
            </div>
          </td>
        </tr>
      ),
    }
  }

  /* PART 1 — OWN PURCHASE */
  const groupCols = byCo ? benefs.length + 1 : 0
  const ownCols = 5 + groupCols
  /* Own-invoice tag. A sponsor's own invoices say whether they were shared — the
     not-shared one ran out before any link, so its company columns stay blank. */
  const ownTag = (inv: Inv) => {
    const text = [benef && 'Own purchase', sponsor && (inv.notShared ? 'not shared' : 'shared')].filter(Boolean).join(' · ')
    if (!text) return null
    return inv.notShared
      ? <span title={inv.notShared} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[11px] font-medium text-muted">{text}</span>
      : <span className="rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">{text}</span>
  }
  const ownTable = (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-[12px]" style={{ minWidth: 820 + groupCols * 96 }}>
        <thead className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">
          {byCo && (
            <tr className="bg-canvas/60">
              <th colSpan={5} className={cn(stick, 'bg-canvas')} />
              <th colSpan={groupCols} className="border-l border-b border-line px-3 pb-1 pt-2 text-center">Qty used — tách theo công ty</th>
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
                <th className={cn(th, 'border-l border-line normal-case tracking-normal text-ink/80')}>{coLabel(c)}</th>
                {benefs.map((b) => (
                  <th key={b.name} className={cn(th, 'normal-case tracking-normal')}>
                    <button onClick={() => b.co && onOpen?.(b.co)} className={cn('hover:underline', b.removed ? 'text-faint line-through' : 'text-brand')}>{b.co ? coLabel(b.co) : b.name}</button>
                    {b.removed && <span className="block text-[9.5px] font-normal text-faint">đã Remove</span>}
                  </th>
                ))}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {ownShown.map((inv) => {
            const st = invStatus(inv)
            const h = head(inv, ownCols, ownTag(inv), true)
            return (
              <Fragment key={inv.no}>
                {h.row}
                {!h.isClosed && inv.lines.map((l) => {
                  const left = l.used === null ? null : l.total - l.used
                  return (
                    <tr key={inv.no + l.name} className="border-t border-line-soft">
                      {productCell(l)}
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
                          ? <td colSpan={groupCols} className="border-l border-line-soft px-3 py-2 text-center text-[10.5px] text-faint">đi kèm tin đăng — không trừ riêng</td>
                          : <>
                              <td className="border-l border-line-soft px-3 py-2 text-right">{num(own(l))}</td>
                              {benefs.map((b) => inv.notShared
                                ? <td key={b.name} className="bg-canvas/50 px-3 py-2 text-right text-faint" title={inv.notShared}>·</td>
                                : <td key={b.name} className="px-3 py-2 text-right">{num(l.shared?.[b.name] ?? 0, b.removed)}</td>)}
                            </>
                      )}
                    </tr>
                  )
                })}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  /* PART 2 — SPONSORED BY OTHER COMPANIES: only lines this company used, only its count. */
  const borTable = (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[640px] border-collapse text-[12px]">
        <thead className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">
          <tr className="border-b border-line bg-canvas/60 text-left">
            <th className={cn(stick, 'min-w-[200px] bg-canvas px-3 py-2')}>Product</th>
            <th className="w-[160px] px-3 py-2">Product type</th>
            <th className={cn(th, 'w-[160px] normal-case tracking-normal text-ink/80')}>Qty used by {coLabel(c)}</th>
          </tr>
        </thead>
        <tbody>
          {borShown.map(({ inv, sponsor: sp }) => {
            const tag = (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                Sponsored by <button onClick={() => openCo(sp)} className="font-semibold underline-offset-2 hover:underline">{nameOf(sp)}</button>
              </span>
            )
            const h = head(inv, 3, tag, false)
            const usedLines = inv.lines.filter((l) => (l.shared?.[c.name] ?? 0) > 0)
            return (
              <Fragment key={inv.no}>
                {h.row}
                {!h.isClosed && usedLines.length === 0 && (
                  <tr className="border-t border-line-soft"><td colSpan={3} className="py-2 pl-11 pr-3 text-[11.5px] text-faint">{coLabel(c)} chưa dùng sản phẩm nào từ hoá đơn này.</td></tr>
                )}
                {!h.isClosed && usedLines.map((l) => (
                  <tr key={inv.no + l.name} className="border-t border-line-soft">
                    {productCell(l)}
                    <td className="px-3 py-2 text-muted">{l.type}</td>
                    <td className="px-3 py-2 text-right"><b className="tabular-nums">{l.shared![c.name]}</b></td>
                  </tr>
                ))}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  /* BENEFICIARY ONLY (Sao Mai) — ONE table (client, 2026-10-21: "gom 2 table làm 1").
     Own invoices with full numbers; sponsored invoices with only the lines this
     company used, its count under Qty used, Total and Remaining left empty. One
     list in drain order, the tag tells the two apart. */
  const merged = [...ownShown.map((inv) => ({ inv, sponsor: null as string | null })), ...borShown].sort((x, y) => byDrain(x.inv, y.inv))
  const mergedTable = (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[820px] border-collapse text-[12px]">
        <thead className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">
          <tr className="border-b border-line bg-canvas/60 text-left">
            <th className={cn(stick, 'min-w-[200px] bg-canvas px-3 py-2')}>Product</th>
            <th className="w-[130px] px-3 py-2">Product type</th>
            <th className={cn(th, 'w-[90px]')}>Total qty</th>
            <th className={cn(th, 'w-[90px]')}>Qty used</th>
            <th className={cn(th, 'w-[110px]')}>Qty remaining</th>
          </tr>
        </thead>
        <tbody>
          {merged.map(({ inv, sponsor: sp }) => {
            const st = invStatus(inv)
            const tag = sp
              ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Sponsored by <button onClick={() => openCo(sp)} className="font-semibold underline-offset-2 hover:underline">{nameOf(sp)}</button></span>
              : ownTag(inv)
            const h = head(inv, 5, tag, !sp)
            const lines = sp ? inv.lines.filter((l) => (l.shared?.[c.name] ?? 0) > 0) : inv.lines
            return (
              <Fragment key={inv.no}>
                {h.row}
                {!h.isClosed && sp && lines.length === 0 && (
                  <tr className="border-t border-line-soft"><td colSpan={5} className="py-2 pl-11 pr-3 text-[11.5px] text-faint">{coLabel(c)} chưa dùng sản phẩm nào từ hoá đơn này.</td></tr>
                )}
                {!h.isClosed && lines.map((l) => {
                  const left = l.used === null ? null : l.total - l.used
                  return (
                    <tr key={inv.no + l.name} className="border-t border-line-soft">
                      {productCell(l)}
                      <td className="px-3 py-2 text-muted">{l.type}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{sp ? '' : l.total}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {sp ? <b className="font-semibold">{l.shared![c.name]}</b>
                          : l.used === null ? <span className="text-faint" title="Đi kèm một tin đăng — không trừ riêng">—</span> : l.used}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {sp ? ''
                          : left === null ? <span className="text-[10.5px] text-faint">đi kèm tin</span>
                          : st === 'Expired' && left > 0 ? <span className="text-faint line-through">{left}</span>
                          : <b className={cn('font-semibold', left === 0 ? 'text-faint' : 'text-brand')}>{left}</b>}
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
  )

  const section = (title: ReactNode, n: number, body: ReactNode) => (
    <section className="mt-3 first:mt-0">
      <h4 className="mb-1.5 flex items-baseline gap-2 text-[11.5px] font-semibold text-ink/80">{title}<span className="font-normal text-faint">{n} hoá đơn</span></h4>
      {body}
    </section>
  )
  const empty = (txt: string) => <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[12px] text-muted">{txt}</p>

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
        {(['All', 'In use', 'Fully used', 'Expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn('rounded-full border px-2.5 py-1 text-[11.5px]', filter === f ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line text-muted hover:bg-canvas')}
          >
            {f} <span className="tabular-nums opacity-70">{f === 'All' ? all.filter(sourceOk).length : count(f)}</span>
          </button>
        ))}
        {benef && (
          <span className="ml-2 flex items-center gap-1 rounded-full border border-line p-0.5">
            {([['all', 'All sources'], ['own', `Own purchase ${ownInvs.length}`], ['shared', `Sponsored ${borrowed.length}`]] as const).map(([k, label]) => (
              <button key={k} onClick={() => setSource(k)} className={cn('rounded-full px-2.5 py-0.5 text-[11.5px]', source === k ? 'bg-ink/80 font-semibold text-white' : 'text-muted hover:bg-canvas')}>{label}</button>
            ))}
          </span>
        )}
        {sponsor && (
          <label className="ml-2 flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11.5px] text-muted hover:bg-canvas">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} className="accent-brand" />
            Tách số đã dùng theo công ty
          </label>
        )}
        <span className="ml-auto text-[10.5px] text-faint">Quota trừ theo hoá đơn hết hạn sớm nhất trước — hoá đơn In use đầu tiên là hoá đơn lần đăng tin tới sẽ trừ.</span>
      </div>

      {!benef ? (
        ownInvs.length === 0 ? empty(`${coLabel(c)} chưa có hoá đơn nào.`) : ownTable
      ) : !sponsor ? (
        mergedTable
      ) : (
        <>
          {source !== 'shared' && section(
            <>Own purchase{sponsor && <span className="font-normal text-muted"> — {coLabel(c)} là sponsor, chia sẻ cho {benefs.filter((b) => !b.removed).map((b) => b.co ? coLabel(b.co) : b.name).join(', ')}</span>}</>,
            ownShown.length,
            ownInvs.length === 0 ? empty(`${coLabel(c)} chưa tự mua sản phẩm nào.`) : ownTable,
          )}
          {source !== 'own' && section(<>Sponsored by other companies</>, borShown.length, borTable)}
        </>
      )}

      <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
        <b className="text-muted">In use</b> — còn hạn và còn ít nhất một dòng chưa dùng hết. <b className="text-muted">Fully used</b> — còn hạn nhưng mọi dòng đã dùng hết.{' '}
        <b className="text-muted">Expired</b> — quá ngày hết hạn; phần còn lại bị gạch. Dòng add-on đi kèm tin đăng nên không có số đã dùng. Hoá đơn Fully used và Expired thu gọn sẵn. Dòng <b className="text-muted">Warranty</b> nằm ngay dưới sản phẩm nó bù, trên chính hoá đơn đó — ngày cấp, lý do, hạn dùng ở dòng phụ.
        {byCo && <> Mỗi công ty được link là một cột trong nhóm <b className="text-muted">Qty used — tách theo công ty</b>, chỉ trên hoá đơn tự mua; tên gạch là link đã Remove.</>}
        {benef && <> Hoá đơn <b className="text-muted">Sponsored by …</b> chỉ liệt kê sản phẩm {coLabel(c)} đã dùng và số của riêng {coLabel(c)} — tổng và số còn lại là của sponsor, không hiện ở đây.</>}
        {sponsor && <> <b className="text-muted">not shared</b> — hoá đơn dùng hết trước khi link công ty nào, nên không có cột công ty nào dùng.</>}
      </p>
    </div>
  )
}

/* ── Free products — gifts, the only things with no invoice behind them ─────────
 * Client, 2026-10-21: warranties moved into the invoice table; what is left here
 * is what was GIVEN. Same quantity columns as the invoice table so a rep reads
 * both the same way, plus valid-until and the reason the gift was granted. */
type Gift = { name: string; type: ProductType; total: number; used: number; validUntil: string; reason: string; by: string; on: string }
const GIFTS: Record<string, Gift[]> = {
  'FPT Software': [
    { name: 'Gift CV Search', type: 'CV search', total: 20, used: 5, validUntil: '11/11/2026', reason: 'Goodwill — gia hạn hợp đồng 2026', by: 'Phạm Quang Huy', on: '12/08/2026' },
  ],
  'Công ty CP Giáo dục Én Nhỏ': [
    { name: 'Top job', type: 'Job posting', total: 1, used: 0, validUntil: '31/12/2026', reason: 'Khách hàng thân thiết 2025', by: 'Nguyễn Thị Lan', on: '05/10/2026' },
    { name: 'Gift Manual Service', type: 'Manual service', total: 1, used: 1, validUntil: '12/10/2027', reason: 'Đăng tin Fanpage tặng kèm', by: 'Nguyễn Thị Lan', on: '12/10/2026' },
  ],
  'Công ty TNHH Sao Mai': [],
  'Tiki': [],
}
const GIFTS_DEFAULT: Gift[] = [
  { name: 'Gift CV Search', type: 'CV search', total: 10, used: 10, validUntil: '11/11/2026', reason: 'Goodwill CV search gift', by: 'Nguyễn Thị Lan', on: '01/10/2026' },
  { name: 'Gift Manual Service', type: 'Manual service', total: 2, used: 2, validUntil: '12/10/2027', reason: 'Manual service gift', by: 'Nguyễn Thị Lan', on: '12/10/2026' },
]
export const giftsOf = (name: string): Gift[] => GIFTS[name] ?? GIFTS_DEFAULT

export function FreeProducts({ c }: { c: Company }) {
  const gifts = giftsOf(c.name)
  if (gifts.length === 0) return <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[12px] text-muted">{coLabel(c)} chưa được tặng sản phẩm nào.</p>
  const th = 'px-3 py-2 text-right whitespace-nowrap'
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[900px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-line bg-canvas/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-faint">
            <th className="px-3 py-2">Product</th>
            <th className="w-[130px] px-3 py-2">Product type</th>
            <th className={cn(th, 'w-[90px]')}>Total qty</th>
            <th className={cn(th, 'w-[90px]')}>Qty used</th>
            <th className={cn(th, 'w-[110px]')}>Qty remaining</th>
            <th className="w-[110px] px-3 py-2">Valid until</th>
            <th className="px-3 py-2">Reason</th>
          </tr>
        </thead>
        <tbody>
          {gifts.map((g) => {
            const left = g.total - g.used
            const lapsed = day(g.validUntil) < TODAY
            return (
              <tr key={g.name + g.on} className="border-t border-line-soft">
                <td className="px-3 py-2 text-ink">{g.name}<span className="block text-[10.5px] text-faint">tặng {g.on} · {g.by}</span></td>
                <td className="px-3 py-2 text-muted">{g.type}</td>
                <td className="px-3 py-2 text-right tabular-nums">{g.total}</td>
                <td className="px-3 py-2 text-right tabular-nums">{g.used}</td>
                <td className="px-3 py-2 text-right tabular-nums">{lapsed && left > 0 ? <span className="text-faint line-through">{left}</span> : <b className={cn('font-semibold', left === 0 ? 'text-faint' : 'text-brand')}>{left}</b>}</td>
                <td className={cn('px-3 py-2 tabular-nums', lapsed ? 'text-rose-600' : 'text-ink/80')}>{g.validUntil}</td>
                <td className="px-3 py-2 text-muted">{g.reason}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
