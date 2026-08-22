import { useState } from 'react'
import { AC_STATUS, coLabel, coValue, poGate } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { QUOTE_CATALOG, VAT_RATE } from '@/pages/admin/data/sales'
import { endOfMonth, vnWords } from '@/pages/admin/lib/fmt'
import { LField, Section } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* ── Tạo PO / Create sales order ───────────────────────────────────────────────
   Raised from ONE accepted quotation option. Nothing is retyped: lines, totals,
   VAT and the VAT-billing block are copied from the quotation, because those are
   what the e-invoice must eventually match. Confirming is the "won" moment for the
   pipeline — but it provisions nothing; only the invoice does (T&C clause 3). */
export function CreatePOModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const { quote } = poGate(c)
  const [terms, setTerms] = useState('100% in advance')
  const [poNo, setPoNo] = useState('')
  /* Lines drive the total, never the reverse — quantity × the real catalog price.
     Back-solving a unit price from the deal value produces prices like 5,979,938,
     which is not a figure any catalog would ever quote. */
  const pack = QUOTE_CATALOG[1]
  const unit = pack.price
  const qty = Math.max(1, Math.round(coValue(c) / (1 + VAT_RATE / 100) / unit))
  const sub = qty * unit
  const vat = Math.round(sub * VAT_RATE / 100)
  const total = sub + vat

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[780px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Tạo PO / Create sales order — {coLabel(c)}</p>
            <p className="text-[11px] text-muted">From the accepted quotation option. Lines and billing details are copied, not retyped.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[72vh] space-y-3.5 overflow-y-auto p-5">
          <Section title="Source — the accepted option" className="mt-0" />
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft/40 px-3 py-2 text-[12px]">
            <span className="font-mono font-medium text-brand">{quote}</span>
            <Pill tone="active">Option 2 · accepted</Pill>
            <span className="text-muted">The alternatives the customer did not choose never become orders.</span>
          </div>

          <Section title="Order lines — copied from the option" />
          <div className="overflow-x-auto rounded-lg border border-line">
            <div className="grid min-w-[560px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span>#</span><span>Dịch vụ / Service</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng giá</span>
            </div>
            <div className="grid min-w-[560px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span className="text-faint">1</span><span className="truncate">{pack.vi}</span><span className="text-[11px] text-muted">{pack.unitVi} / {pack.unitEn}</span>
              <span className="tabular-nums">{qty}</span><span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span><span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
            </div>
            <div className="grid min-w-[560px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
              <span className="text-faint">2</span>
              <span className="flex min-w-0 items-center gap-1.5"><span className="truncate">{pack.vi}</span><Pill tone="active">Tặng</Pill></span>
              <span className="text-[11px] text-muted">{pack.unitVi} / {pack.unitEn}</span><span className="tabular-nums">1</span><span className="text-right tabular-nums">0</span><span className="text-right tabular-nums">0</span>
            </div>
          </div>
          <p className="text-[10.5px] text-faint">The gift line carries into the order at 0 ₫ — no revenue, but it is provisioned as real quota once the invoice is issued.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-3">
              <Section title="VAT billing — snapshot from the quotation" className="mt-0" />
              <LField label="Tên công ty / Legal name" req value={c.legalName} />
              <LField label="Địa chỉ KKD / Billing address" req value={c.address} />
              <LField label="Mã số thuế / Tax code" req value={c.tax} hint="Must match the e-invoice exactly — a mismatch later needs a cancel + re-issue." />
            </div>
            <div className="space-y-3">
              <Section title="Order terms" className="mt-0" />
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Điều khoản thanh toán / Payment terms</label>
                <select value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  <option>100% in advance</option><option>50 / 50</option><option>Net 30 after invoice</option>
                </select>
                <p className="mt-1 text-[10.5px] text-faint">Advance is the default — clause 3 activates the service only after payment.</p>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Customer PO number <span className="font-normal text-faint">(optional)</span></label>
                <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="e.g. PO-VP/2026/044" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">If their procurement issues its own PO, record the number and attach the file. Customers without a procurement process simply confirm the order we send.</p>
              </div>
              <button className="w-full rounded-md border border-dashed border-line py-2 text-[11.5px] text-muted hover:border-ink/40">+ Attach their signed PO / confirmation</button>
            </div>
          </div>

          <div className="ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
            <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
            <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{total.toLocaleString('en-US')} ₫</span></div>
            <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(total)}.</p>
          </div>

          {/* Two consequences, both immediate on issue, and neither of them is
              provisioning — that is the invoice's job. Stated here because this is
              the last screen before the PO exists. */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            <b>Issuing this PO is the “won” moment</b> — the deal moves to the PO stage, and the PO is <b>Active</b> until <b>{endOfMonth('01/07/2026')}</b> (end of the month, same rule as the quotation). It provisions <b>nothing</b>: no account, no quota, no company page. That happens the moment <b>Kế toán</b> issues the VAT e-invoice on it. Customer status stays <b>{c.account ? AC_STATUS[c.account].label : 'Prospect'}</b> until then.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
          {/* No "Save draft": a PO has no draft state — it is Active from the moment
              it is issued, so the only outcomes here are issue it or don't. */}
          <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Issue PO →</button>
        </div>
      </div>
    </div>
  )
}
