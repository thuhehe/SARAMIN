import { Fragment, useState } from 'react'
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
    ] },
  ],
  /* BOTH ROLES — Tiki sponsors Sao Mai (its July invoice), draws on FPT Software,
     and holds an October invoice nobody else has used yet. One level only: the FPT
     invoices it rides on are NOT passed on to Sao Mai. */
  'Tiki': [
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
  /* BENEFICIARY mode (client, 2026-10-21: "giống Én Nhỏ, chỉ cần rõ invoice nào tự
     mua, invoice nào xài ké"). Same table as any company; the sponsors' invoices it
     can draw on are mixed in, each header tagged "Dùng chung · từ <sponsor>" against
     "Tự mua", with a source filter. A sponsor invoice hides PO and amount (client,
     25/09: never the sponsor's PO); its lines keep total / used / remaining for the
     whole pool — what the beneficiary can still post — plus one column with this
     company's own part. */
  const sponsorLinks = sponsorsOf(c.name)
  const benef = sponsorLinks.length > 0
  const ownInvs = holdingsOf(c.name)
  const srcOf: Record<string, string | null> = {}
  ownInvs.forEach((i) => { srcOf[i.no] = null })
  const borrowed = sponsorLinks.flatMap((l) => (HOLDINGS[l.sponsor] ?? []).map((i) => { srcOf[i.no] = l.sponsor; return i }))
  const invs = [...ownInvs, ...borrowed]
  const [source, setSource] = useState<'all' | 'own' | 'shared'>('all')
  /* SPONSOR mode — ONE table for every invoice AND every linked company (client,
     2026-10-21: "1 bảng duy nhất cho nhiều invoice và theo dõi cty thụ hưởng").
     The old per-product matrix is folded in as COLUMNS: the sponsor's own use,
     then one column per linked company, under one "Đã dùng" group header. Rows stay
     the invoice lines, so "which invoice" and "which company" read off the same
     cell. Qty used = the sum across those columns; remaining comes from it. A
     removed link keeps its column (muted) — a slot used is used. */
  const links = beneficiariesOf(c.name)
  const sponsor = links.length > 0 || ownInvs.some((i) => i.lines.some((l) => l.shared))
  const benefs = links.map((l) => ({ name: l.beneficiary, removed: l.status === 'removed', co: COMPANIES.find((x) => x.name === l.beneficiary) }))
  const [split, setSplit] = useState(true)
  const byCo = sponsor && split
  /* ONE column scheme for all four cases. After Qty used / remaining, a "theo công
     ty" group appears whenever more than one company can touch a line:
       - first column = THIS company's own part (own invoice: used − others;
         borrowed invoice: its draw),
       - then one column per company IT shares with (sponsor only). On a borrowed
         invoice those cells are blank: it cannot re-share, and the sponsor's other
         beneficiaries are none of its business.
     Independent: no group — it would only repeat Qty used. */
  const group = byCo || benef
  const cos = byCo ? benefs : []
  const cols = 5 + (group ? cos.length + 1 : 0)
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
  const bySource = (i: Inv) => source === 'all' || (source === 'own') === (srcOf[i.no] === null)
  const count = (s: InvStatus) => invs.filter((i) => bySource(i) && invStatus(i) === s).length
  const shown = rows.filter((i) => bySource(i) && (filter === 'All' || invStatus(i) === filter))
  const sharedSum = (l: Line) => Object.values(l.shared ?? {}).reduce((x, y) => x + y, 0)
  const own = (l: Line) => (l.used ?? 0) - sharedSum(l)
  const mineOf = (inv: Inv, l: Line) => (srcOf[inv.no] ? l.shared?.[c.name] ?? 0 : own(l))

  if (invs.length === 0 && !benef) return (
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
            {f} <span className="tabular-nums opacity-70">{f === 'All' ? invs.filter(bySource).length : count(f)}</span>
          </button>
        ))}
        {benef && (
          <span className="ml-2 flex items-center gap-1 rounded-full border border-line p-0.5">
            {([['all', 'Tất cả nguồn'], ['own', `Tự mua ${ownInvs.length}`], ['shared', `Dùng chung ${borrowed.length}`]] as const).map(([k, label]) => (
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

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-[12px]" style={{ minWidth: 820 + (byCo ? (benefs.length + 1) * 96 : 0) }}>
          <thead className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">
            {group && (
              <tr className="bg-canvas/60">
                <th colSpan={5} className={cn(stick, 'bg-canvas')} />
                <th colSpan={cos.length + 1} className="border-l border-b border-line px-3 pb-1 pt-2 text-center">Qty used — tách theo công ty</th>
              </tr>
            )}
            <tr className="border-b border-line bg-canvas/60 text-left">
              <th className={cn(stick, 'min-w-[200px] bg-canvas px-3 py-2')}>Product</th>
              <th className="w-[130px] px-3 py-2">Product type</th>
              <th className={cn(th, 'w-[90px]')}>Total qty</th>
              <th className={cn(th, 'w-[90px]')}>Qty used</th>
              <th className={cn(th, 'w-[110px]')}>Qty remaining</th>
              {group && (
                <>
                  <th className={cn(th, 'border-l border-line normal-case tracking-normal text-ink/80')}>{coLabel(c)}<span className="block text-[9.5px] font-normal text-faint">{byCo ? 'tự dùng' : 'đã dùng'}</span></th>
                  {cos.map((b) => (
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
                        {benef && (srcOf[inv.no]
                          ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              Dùng chung · từ
                              <button onClick={() => { const x = COMPANIES.find((co) => co.name === srcOf[inv.no]); if (x) onOpen?.(x) }} className="font-semibold underline-offset-2 hover:underline">{(() => { const x = COMPANIES.find((co) => co.name === srcOf[inv.no]); return x ? coLabel(x) : srcOf[inv.no] })()}</button>
                            </span>
                          : <span className="rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">Tự mua</span>)}
                        {srcOf[inv.no]
                          ? <span className="text-[10.5px] text-faint" title="Client 25/09/2026: không hiển thị PO của công ty tài trợ">PO &amp; giá trị: chỉ trên hồ sơ sponsor</span>
                          : <>
                              <span className="font-mono text-[11px] text-faint">{inv.po}</span>
                              <b className="text-[11px] font-semibold tabular-nums text-ink/80">{inv.amount}</b>
                            </>}
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
                        {group && (
                          l.used === null
                            ? <td colSpan={cos.length + 1} className="border-l border-line-soft px-3 py-2 text-center text-[10.5px] text-faint">đi kèm tin đăng — không trừ riêng</td>
                            : <>
                                <td className="border-l border-line-soft px-3 py-2 text-right">{num(mineOf(inv, l))}</td>
                                {cos.map((b) => (
                                  <td key={b.name} className={cn('px-3 py-2 text-right', srcOf[inv.no] && 'bg-canvas/50')} title={srcOf[inv.no] ? 'Hoá đơn dùng chung — không chia tiếp được' : undefined}>{srcOf[inv.no] ? <span className="text-faint">·</span> : num(l.shared?.[b.name] ?? 0, b.removed)}</td>
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
        </table>
      </div>
      <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
        <b className="text-muted">In use</b> — còn hạn và còn ít nhất một dòng chưa dùng hết. <b className="text-muted">Fully used</b> — còn hạn nhưng mọi dòng đã dùng hết.{' '}
        <b className="text-muted">Expired</b> — quá ngày hết hạn; phần còn lại bị gạch và không dùng được nữa. Dòng add-on (Top search, Super-star tag) đi kèm tin đăng nên không có số đã dùng và không giữ hoá đơn ở In use.
        Hoá đơn Fully used và Expired thu gọn sẵn — bấm + để xem.
        {benef && <> <b className="text-muted">Tự mua</b> — hoá đơn của chính {coLabel(c)}, đủ PO và giá trị. <b className="text-muted">Dùng chung</b> — hoá đơn của sponsor mà {coLabel(c)} được dùng ké: số tổng / đã dùng / còn lại là của cả nhóm (còn lại = {coLabel(c)} còn đăng được bao nhiêu), cột <b className="text-muted">{coLabel(c)} đã dùng</b> là phần của riêng {coLabel(c)}; PO và giá trị không hiện.</>}
        {byCo && <> Mỗi công ty được link là <b className="text-muted">một cột</b> — link thêm thì thêm cột, cuộn ngang khi nhiều; cột Product đứng yên. <b className="text-muted">Qty used</b> = tổng các cột công ty bên phải; tên gạch là link đã Remove — số đã dùng vẫn giữ. Bỏ tick "Tách theo công ty" để về bảng gọn.</>}
      </p>
    </div>
  )
}
