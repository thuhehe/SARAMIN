import { useState } from 'react'
import { AC_STATUS, BUYER_TYPE, buyersFor, coLabel, coValue, poGate, typeOfBuyer } from '@/pages/admin/data/companies'
import type { BuyerType } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { PAY_METHODS, QUOTE_CATALOG, VAT_RATE } from '@/pages/admin/data/sales'
import { endOfMonth, vnWords } from '@/pages/admin/lib/fmt'
import { DerivedField, Section } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* ── Tạo PO / Create sales order ───────────────────────────────────────────────
   Raised from ONE accepted quotation option. Nothing is retyped: lines, totals,
   VAT and the VAT-billing block are copied from the quotation, because those are
   what the e-invoice must eventually match. Confirming is the "won" moment for the
   pipeline — but it provisions nothing; only the invoice does (T&C clause 3). */
export function CreatePOModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const { quote } = poGate(c)
  const [terms, setTerms] = useState('100% in advance')
  const [otherTerms, setOtherTerms] = useState('')
  const [method, setMethod] = useState<string>(PAY_METHODS[0])
  const [paidAt, setPaidAt] = useState('')
  /* Who THIS document is issued to. Defaults from the company record and can be
     changed per PO — VN practice: "xuất hóa đơn theo thông tin nào?" is asked at
     the deal, not fixed forever at account creation. Changing it here never
     rewrites the record; it is a per-document override. */
  const [buyer, setBuyer] = useState<BuyerType>(c.buyerType ?? 'dn-vn')
  const recordBuyer = c.buyerType ?? 'dn-vn'
  /* The SAME gate as the company form: Loại công ty decides which classifications
     can produce a legal invoice. Offering all four here would let a foreign company
     be invoiced as "Doanh nghiệp Việt Nam" against a Vietnamese MST it does not
     have — the exact combination the create form refuses. */
  const allowed = buyersFor(c.companyType ?? typeOfBuyer(c.buyerType))
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
              <Section title="VAT billing — cho PO/hóa đơn này" className="mt-0" />
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Xuất cho / Phân loại người mua</label>
                <select value={buyer} onChange={(e) => setBuyer(e.target.value as BuyerType)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  {allowed.map((k) => (
                    <option key={k} value={k}>{BUYER_TYPE[k].vi}{k === recordBuyer ? ' — theo hồ sơ' : ''}</option>
                  ))}
                </select>
                {/* REMOVED 2026-08-23: the "một lần hay mặc định?" note and the
                    "Đặt làm mặc định cho công ty này" checkbox. Setting a record's
                    default now belongs on the COMPANY form, where the record is —
                    a document is a poor place to edit the thing it was copied from,
                    and asking the question on every PO made a one-off override feel
                    like a decision about the customer. Overriding here stays
                    one-off, silently, which is what an override means. */}
              </div>
              {/* The identifier set follows the classification — same shapes as the
                  company form, prefilled from the record when it is the record's own. */}
              {/* NOTHING here is typed by sales. Every identifier is READ from the
                  company record — a rep re-keying a legal name into a PO is how the
                  PO and the e-invoice end up disagreeing by one character, which
                  costs a cancel + re-issue. Wrong value? Fix the record, not this. */}
              {buyer === 'dn-vn' && (
                <>
                  <DerivedField label="Tên công ty / Legal name" value={c.legalName} from="hồ sơ" />
                  <DerivedField label="Địa chỉ xuất hóa đơn" value={c.address} from="hồ sơ" />
                  <DerivedField label="Mã số thuế / Tax code" value={c.tax} from="hồ sơ" mono hint="Phải khớp từng ký tự với hóa đơn điện tử — sai là phải hủy và xuất lại. Sửa ở hồ sơ công ty, không sửa tại đây." />
                </>
              )}
              {buyer === 'dn-nn' && (
                <>
                  <DerivedField label="Tên đơn vị / Legal name" value={c.buyerName?.trim() || c.legalName} from="hồ sơ" />
                  <DerivedField label="Địa chỉ xuất hóa đơn" value={c.address} from="hồ sơ" hint="DN nước ngoài không có MST Việt Nam — không in mã số thuế." />
                </>
              )}
              {buyer === 'ca-nhan' && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                  Hóa đơn chỉ in một dòng <b>“Bán cho người tiêu dùng”</b> — không MST, không CCCD, không địa chỉ. Khách <b>không dùng hạch toán chi phí / quyết toán thuế được</b> (điểm 4, Phụ lục NĐ 254/2026).
                </p>
              )}
              {buyer === 'ca-nhan-cccd' && (
                <>
                  <DerivedField label="Họ tên người mua hàng" value={c.buyerName?.trim() || '— chưa có trên hồ sơ —'} from="hồ sơ" />
                  <DerivedField label="Số CCCD" value={c.idCard?.trim() || '— chưa có trên hồ sơ —'} from="hồ sơ" mono hint="In vào dòng “Căn cước công dân” — không dùng ô MST." />
                  <DerivedField label="Địa chỉ xuất hóa đơn" value={c.address} from="hồ sơ" />
                </>
              )}
            </div>
            <div className="space-y-3">
              {/* NOT PRINTED ON THE PO (decided 2026-08-23) — said here, at the only
                  moment someone might expect otherwise. These are how WE track the
                  money: they show on the PO LIST, they are the only three fields
                  Edit PO can touch, and they legitimately change after issue. The
                  document itself must read the same on both sides forever, so a
                  mutable field has no place on it. */}
              <Section title="Thanh toán — nội bộ, không in trên PO" className="mt-0" />
              <p className="rounded-md border border-line bg-canvas/50 px-2.5 py-1.5 text-[10.5px] leading-relaxed text-muted">
                3 mục dưới đây <b className="font-semibold text-ink/80">không hiển thị trên chứng từ PO</b> gửi khách. Chúng nằm ở cột tương ứng trong
                danh sách PO, và là <b className="font-semibold text-ink/80">3 mục duy nhất</b> có thể sửa sau khi phát hành.
              </p>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Điều khoản thanh toán / Payment terms</label>
                <select value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  <option>100% in advance</option><option>50 / 50</option><option>Others</option>
                </select>
                {/* "Others" without a place to say what it is would put the real term
                    nowhere — and the PO is the document both sides point at later. */}
                {terms === 'Others' && (
                  <input
                    value={otherTerms}
                    onChange={(e) => setOtherTerms(e.target.value)}
                    placeholder="Ghi rõ điều khoản — VD: 30% tạm ứng, 70% trong 15 ngày sau xuất hóa đơn"
                    className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-ink outline-none placeholder:text-faint focus:border-brand"
                  />
                )}
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Trả trước là mặc định — điều 3 hợp đồng chỉ kích hoạt dịch vụ sau khi nhận tiền.</p>
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Phương thức thanh toán</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  {PAY_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Empty at issue in the normal case — the money has not arrived yet.
                  It is on this form only because a PO is sometimes written up after
                  payment, and forcing that rep into Edit PO straight after issuing
                  would be a second trip for something they already know. */}
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Ngày thu tiền <span className="font-normal text-faint">— để trống nếu chưa thu</span></label>
                <input
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  placeholder="dd/mm/yyyy"
                  className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] tabular-nums outline-none placeholder:text-faint focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">Trạng thái Paid · Unpaid · Overdue được tính từ ngày này.</p>
              </div>
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
