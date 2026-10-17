import { useState } from 'react'
import { cn } from '@/lib/utils'
import { QUOTA_UNITS, QU_TODAY_LABEL, daysToUseBy, invoiceStatusOf, statusOf } from '@/pages/admin/data/quotaUsage'
import type { InvoiceStatus, QuStatus, QuotaUnit } from '@/pages/admin/data/quotaUsage'
import { Pill } from '@/pages/admin/ui/status'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Quota usage ──────────────────────────────────────────────────────────────
   The CS "AMS" sheet, as a page. One row per UNIT of a product sold: a PO line of
   4 × Basic Plus Job is four rows numbered 1–4, because each unit is spent on its
   own job, on its own day, and may get its own warranty.

   The sheet's columns are kept, in the sheet's order, with the sheet's Vietnamese
   name under some English headers so CS can map one to the other. Changes agreed
   17/10/2026: "ID CRM" + "ID AMS" are one Company ID (one system now), the CS
   column is dropped, and "Phân loại" reads "Internal tag". The "CS điền" columns
   are filled by the system when a unit is spent. */
const STATUS_TONE: Record<QuStatus, StatusTone> = { Unused: 'pending', Used: 'open', Expired: 'closed' }
const INVOICE_TONE: Record<InvoiceStatus, StatusTone> = { 'In use': 'pending', 'Fully used': 'open', Expired: 'closed' }
const SOON = 30

type Focus = 'all' | QuStatus | 'soon'

export function AdminQuotaUsage() {
  const all = QUOTA_UNITS
  const [focus, setFocus] = useState<Focus>('all')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [product, setProduct] = useState('')
  const [sales, setSales] = useState('')
  /* An invoice that is Fully used or Expired needs nothing more from anyone — CS can hide it. */
  const [hideDone, setHideDone] = useState(false)

  const soon = (u: QuotaUnit) => statusOf(u) === 'Unused' && daysToUseBy(u) <= SOON
  const rows = all.filter((u) =>
    (focus === 'all' || (focus === 'soon' ? soon(u) : statusOf(u) === focus))
    && (!q || [u.invoice, u.company, u.companyId, u.jobId ?? '', u.warranty?.jobId ?? ''].join(' ').toLowerCase().includes(q.toLowerCase()))
    && (!category || u.category === category)
    && (!product || u.product === product)
    && (!sales || u.sales === sales)
    && (!hideDone || invoiceStatusOf(u.invoice) === 'In use'))
  const n = (f: Focus) => all.filter((u) => f === 'all' || (f === 'soon' ? soon(u) : statusOf(u) === f)).length
  const uniq = (k: keyof QuotaUnit) => [...new Set(all.map((u) => String(u[k])))].sort()

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[80ch] text-[11.5px] leading-relaxed text-muted">
          Every unit of every product sold, <b className="text-ink/70">one row per unit</b> — a line of 4 × Basic Plus Job
          is four rows. Units appear when the invoice is issued; <b className="text-ink/70">Status, Activated and Job ID fill
          themselves</b> when a unit is spent on a job.
        </p>
        <span className="shrink-0 rounded-lg border border-line bg-canvas/60 px-2.5 py-1.5 text-[11px] text-muted">
          As of <b className="tabular-nums text-ink/80">{QU_TODAY_LABEL}</b>
        </span>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Sum label="All units" value={n('all')} on={focus === 'all'} onClick={() => setFocus('all')} />
        <Sum label="Unused" value={n('Unused')} tone="text-amber-600" on={focus === 'Unused'} onClick={() => setFocus('Unused')} />
        <Sum label={`Use by ≤ ${SOON} days`} value={n('soon')} tone="text-rose-600" on={focus === 'soon'} onClick={() => setFocus('soon')} />
        <Sum label="Used" value={n('Used')} tone="text-emerald-700" on={focus === 'Used'} onClick={() => setFocus('Used')} />
        <Sum label="Expired" value={n('Expired')} tone="text-ink/50" on={focus === 'Expired'} onClick={() => setFocus('Expired')} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search invoice, company, job ID…"
          className="w-[250px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] outline-none focus:border-brand"
        />
        <Select value={category} onChange={setCategory} all="All internal tags" options={uniq('category')} />
        <Select value={product} onChange={setProduct} all="All products" options={uniq('product')} />
        <Select value={sales} onChange={setSales} all="All sales" options={uniq('sales')} />
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] text-muted">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          Hide Fully used / Expired invoices
        </label>
        <button className="ml-auto rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] text-ink/80 hover:border-ink/40">Export .xlsx</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[2330px] border-collapse text-[11.5px]">
          <thead>
            <tr className="text-center text-[10.5px] font-semibold uppercase tracking-wide">
              <th colSpan={5} className="border-b border-r border-line bg-canvas px-3 py-1.5 text-muted">Order</th>
              <th colSpan={5} className="border-b border-r border-line bg-canvas px-3 py-1.5 text-muted">Product unit</th>
              <th colSpan={3} className="border-b border-r border-line bg-emerald-50 px-3 py-1.5 text-emerald-800">Usage — filled by the system <span className="font-normal normal-case">(was “CS điền”)</span></th>
              <th colSpan={4} className="border-b border-line bg-sky-50 px-3 py-1.5 text-sky-800">Warranty 1 <span className="font-normal normal-case">(Bảo hành lần 1)</span></th>
            </tr>
            <tr className="bg-canvas/60 text-left text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              <Th l="Invoice no." vn="Invoice # CRM" />
              <Th l="Invoice status" vn="Trạng thái invoice" />
              <Th l="Company ID" />
              <Th l="Company" vn="Tên công ty" w="min-w-[230px]" />
              <Th l="Sales" vn="Sales" edge />
              <Th l="#" vn="Số thứ tự" />
              <Th l="Product" vn="Gói dịch vụ" />
              <Th l="Internal tag" vn="Phân loại" />
              <Th l="Invoice date" />
              <Th l="Use by" edge />
              <Th l="Status" vn="Trạng thái sử dụng" />
              <Th l="Activated" vn="Ngày kích hoạt" />
              <Th l="Job ID" vn="ID Job" edge />
              <Th l="Warranty type" vn="Loại bảo hành" />
              <Th l="Warranty date" vn="Ngày bảo hành" />
              <Th l="Warranty job ID" vn="ID Job bảo hành" />
              <Th l="Free PO" vn="PO Free – bảo hành" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => {
              const st = statusOf(u)
              /* A heavy rule where the INVOICE changes; a lighter one where the company
                 changes inside one invoice (a NIPA invoice covers several companies). */
              const newInvoice = i > 0 && rows[i - 1].invoice !== u.invoice
              const newCompany = i > 0 && !newInvoice && rows[i - 1].companyId !== u.companyId
              const inv = invoiceStatusOf(u.invoice)
              const d = daysToUseBy(u)
              return (
                <tr key={i} className={cn('align-top', newInvoice ? 'border-t-[3px] border-t-slate-400' : newCompany ? 'border-t-2 border-line' : 'border-t border-line-soft', st !== 'Unused' && 'text-ink/60')}>
                  <td className={cn('whitespace-nowrap px-3 py-2 font-mono text-[11px]', u.unpaid && 'bg-amber-100/70')}>
                    <span className="text-brand hover:underline">{u.invoice}</span>
                    {u.unpaid && <span className="mt-0.5 block font-sans text-[10px] font-medium text-amber-800">Unpaid</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2"><Pill tone={INVOICE_TONE[inv]}>{inv}</Pill></td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">{u.companyId}</td>
                  <td className="px-3 py-2 font-medium text-ink/85">{u.company}</td>
                  <td className="whitespace-nowrap border-r border-line px-3 py-2">{u.sales}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{u.no}</td>
                  <td className="whitespace-nowrap px-3 py-2">{u.product}</td>
                  <td className="whitespace-nowrap px-3 py-2"><CategoryTag c={u.category} /></td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums">{u.invoiceDate}</td>
                  <td className="whitespace-nowrap border-r border-line px-3 py-2 tabular-nums">
                    {u.useBy}
                    {st === 'Unused' && <span className={cn('block text-[10px]', d <= SOON ? 'font-medium text-rose-600' : 'text-faint')}>{d} days left</span>}
                  </td>
                  <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-2"><Pill tone={STATUS_TONE[st]}>{st}</Pill></td>
                  <td className="whitespace-nowrap bg-emerald-50/40 px-3 py-2 tabular-nums">{u.activated ?? <span className="text-faint">—</span>}</td>
                  <td className="whitespace-nowrap border-r border-line bg-emerald-50/40 px-3 py-2 font-mono text-[11px]">
                    {u.jobId ? <span className="text-brand hover:underline">{u.jobId}</span> : <span className="text-faint">—</span>}
                  </td>
                  <td className="whitespace-nowrap bg-sky-50/40 px-3 py-2">{u.warranty ? <Pill tone="neutral">{u.warranty.type}</Pill> : <span className="text-faint">—</span>}</td>
                  <td className="whitespace-nowrap bg-sky-50/40 px-3 py-2 tabular-nums">{u.warranty?.date ?? <span className="text-faint">—</span>}</td>
                  <td className="whitespace-nowrap bg-sky-50/40 px-3 py-2 font-mono text-[11px]">
                    {u.warranty?.jobId ? <span className="text-brand hover:underline">{u.warranty.jobId}</span> : <span className="text-faint">—</span>}
                  </td>
                  <td className="whitespace-nowrap bg-sky-50/40 px-3 py-2 font-mono text-[11px]">
                    {u.warranty?.freePo ? <span className="text-brand hover:underline">{u.warranty.freePo}</span> : <span className="text-faint">—</span>}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={17} className="px-3 py-8 text-center text-[12px] text-faint">No unit matches.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        {rows.length} of {all.length} units · <span className="rounded bg-amber-100 px-1 text-amber-800">Unpaid</span> = invoice
        issued, not paid yet (the sheet's yellow fill) · <b className="text-ink/70">Invoice status</b>: Fully used = every
        unit used · Expired = nothing left to use, at least one unit expired · In use = still has unused units · a heavy
        line starts the next invoice · Invoice no., Job ID and Free PO open their records.
      </p>
    </div>
  )
}

function Th({ l, vn, w, edge }: { l: string; vn?: string; w?: string; edge?: boolean }) {
  return (
    <th className={cn('whitespace-nowrap px-3 py-2 align-bottom', w, edge && 'border-r border-line')}>
      {l}
      {vn && <span className="block text-[9.5px] font-normal normal-case tracking-normal text-faint">{vn}</span>}
    </th>
  )
}

const CAT_STYLE: Record<QuotaUnit['category'], string> = {
  'Paid package': 'bg-rose-50 text-rose-700 border-rose-200',
  'PO 0đ': 'bg-orange-50 text-orange-700 border-orange-200',
  'Monthly gift': 'bg-amber-50 text-amber-700 border-amber-200',
  'NIPA project': 'bg-sky-50 text-sky-700 border-sky-200',
}
function CategoryTag({ c }: { c: QuotaUnit['category'] }) {
  return <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10.5px] font-medium', CAT_STYLE[c])}>{c}</span>
}

function Sum({ label, value, tone, on, onClick }: { label: string; value: number; tone?: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('rounded-xl border p-3 text-left transition-colors', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30')}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[20px] font-bold tabular-nums tracking-tight', value === 0 ? 'text-ink/25' : tone ?? 'text-ink')}>{value}</p>
    </button>
  )
}

function Select({ value, onChange, all, options }: { value: string; onChange: (v: string) => void; all: string; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('max-w-[220px] rounded-lg border bg-surface px-2 py-1.5 text-[12px] outline-none', value ? 'border-brand text-brand' : 'border-line text-ink/80')}
    >
      <option value="">{all}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
