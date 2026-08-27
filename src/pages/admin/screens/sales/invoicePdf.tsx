import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BUYER_TYPE } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { ISSUER, QUOTE_CATALOG, VAT_RATE, pdfNum } from '@/pages/admin/data/sales'
import type { Inv } from '@/pages/admin/data/sales'
import { vnWords } from '@/pages/admin/lib/fmt'
import { SaraminMark } from '@/pages/admin/screens/sales/_shared'

/* ── VAT e-invoice as PDF ──────────────────────────────────────────────────────
   The provider's own template (easyinvoice), reproduced because Kế toán and the
   customer both work from this exact sheet. It renders in TWO forms off one
   component, and the differences are the whole point:

     NHÁP (draft)   Số : <Chưa cấp số>. No seller signature block, no tax-authority
                    code, no lookup URL. It is a working proof, not a document — it
                    grants nothing and is filed nowhere.
     CHÍNH (issued) Số : 175 — allocated by the provider, sequential and gapless.
                    Carries the digital signature block, the "Mã của cơ quan thuế"
                    and the lookup page. THIS is the fiscal document.

   Which buyer lines print depends on the company's BuyerType: a company shows Tên
   đơn vị + Mã số thuế; an individual shows Họ tên người mua hàng + Căn cước công
   dân; a foreign company shows the name and address with the tax line blank. */
/* ── Bilingual labels on a VAT invoice ────────────────────────────────────────
   Nghị định 123/2020 điều 10 khoản 13: the writing on an invoice is VIETNAMESE.
   Foreign text is allowed, but only as an ADDITION — placed in parentheses to the
   right of the Vietnamese, or on the line directly below it, and in a SMALLER
   font. It may never replace the Vietnamese or be printed at equal size.

   So the "Tên đơn vị / Legal name" slash format the quotation and the PO use is
   fine on those documents and NOT fine here. Everything on this sheet goes
   through InvLabel / InvHead, which enforce the shape: Vietnamese first, English parenthesised
   and one step smaller. */
function InvLabel({ vi, en }: { vi: string; en: string }) {
  return (
    <>
      {vi} <span className="text-[8px] font-normal italic text-slate-500">({en})</span>
    </>
  )
}
/** Same rule inside a table header, where the English goes BELOW rather than beside
    — the decree allows either placement. */
function InvHead({ vi, en }: { vi: string; en: string }) {
  return (
    <>
      {vi}
      <span className="block text-[7px] font-normal italic text-slate-500">({en})</span>
    </>
  )
}

function InvoicePdfDoc({ inv, co }: { inv: Inv; co?: Company }) {
  const pack = QUOTE_CATALOG[inv.product]
  const sub = Math.round(inv.total / (1 + VAT_RATE / 100))
  const vat = inv.total - sub
  const unit = Math.round(sub / inv.qty)
  const official = inv.step === 'issued'
  const bt = BUYER_TYPE[co?.buyerType ?? 'dn-vn']
  // The provider allocates the number only when the invoice is made official.
  const serial = inv.code.split('-')[0]
  const no = official ? inv.code.split('-')[1] : null
  const d = (official && inv.issued !== '—' ? inv.issued : '11/08/2026').split('/')
  const COLS = '34px minmax(0,2.3fr) 52px 56px 82px 92px 40px 78px 92px'
  const Cell = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <span className={cn('border-r border-slate-300 px-1.5 py-1 text-[9px] leading-snug last:border-r-0', className)}>{children}</span>
  )

  return (
    <div className="mx-auto bg-white text-slate-900 shadow-xl" style={{ width: 794 }}>
      <div className="px-[44px] py-[36px]">
        {/* seller — the issuer block is fixed, from System → Company information */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 pt-1"><SaraminMark width={92} /></div>
          <div className="min-w-0 text-[9.5px] leading-relaxed">
            <p><span className="text-slate-500"><InvLabel vi="Đơn vị bán hàng" en="Seller" /> : </span><b>{ISSUER.nameVi}</b></p>
            <p><span className="text-slate-500"><InvLabel vi="Mã số thuế" en="Tax code" />: </span><b>0315421202</b></p>
            <p><span className="text-slate-500"><InvLabel vi="Địa chỉ" en="Address" /> : </span>{ISSUER.addrVi}</p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-4 border-t border-slate-300 pt-3">
          {/* the QR only exists once the provider has signed and filed it */}
          <div className="shrink-0">
            {official
              ? <div className="grid h-[88px] w-[88px] place-items-center border border-slate-800 text-[8px] text-slate-400">QR</div>
              : <div className="grid h-[88px] w-[88px] place-items-center border border-dashed border-slate-300 text-center text-[8px] leading-tight text-slate-300">chưa có<br />QR</div>}
          </div>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[17px] font-bold uppercase tracking-wide text-red-600">Hóa đơn giá trị gia tăng</p>
            <p className="text-[10px] font-semibold italic text-red-600">(VAT INVOICE)</p>
            {!official && (
              <p className="mx-auto mt-1 inline-block bg-yellow-100 px-2 py-0.5 text-[13px] font-bold text-red-600">
                HÓA ĐƠN NHÁP — chưa có giá trị pháp lý
              </p>
            )}
            <p className="mt-1 text-[9.5px]">
              Ngày <b className="px-1">{d[0]}</b> tháng <b className="px-1">{d[1]}</b> năm <b className="px-1">{d[2]}</b>
            </p>
          </div>
          <div className="w-[150px] shrink-0 text-[9.5px] leading-relaxed">
            <p><span className="text-slate-500">Ký hiệu: </span><b>{serial}</b></p>
            <p className="mt-0.5">
              <span className="text-slate-500">Số : </span>
              {official
                ? <b className="rounded border border-red-300 px-2 py-0.5 text-red-600">{no}</b>
                : <b className="text-red-600">&lt;Chưa cấp số&gt;</b>}
            </p>
          </div>
        </div>

        {/* buyer — WHICH lines carry a value depends on the buyer type */}
        <dl className="mt-3 space-y-[3px] text-[9.5px] leading-relaxed">
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Họ tên người mua hàng" en="Buyer name" /> :</dt>
            {/* A named person when we have one; blank for a company, where the name
                belongs on Tên đơn vị instead. The anonymous consumer-sale line was
                dropped with the `ca-nhan` classification (2026-08-23). */}
            <dd className="min-w-0 flex-1 font-bold">{bt.needsBuyerName ? (co?.buyerName ?? '') : ''}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Tên đơn vị" en="Company name" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold uppercase">{co?.legalName ?? inv.customer}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Mã số thuế" en="Tax code" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold tabular-nums">{bt.tax === 'req' ? (co?.tax ?? '') : ''}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Căn cước công dân" en="Citizen ID" /> :</dt>
            <dd className={cn('min-w-0 flex-1 tabular-nums', bt.needsIdCard && 'font-bold')}>{bt.needsIdCard ? (co?.idCard ?? '') : ''}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Địa chỉ" en="Address" /> :</dt>
            {/* Blank for a buyer who provided nothing — the decree's "Bán cho người
                tiêu dùng" case carries no name, address or ID at all. */}
            <dd className="min-w-0 flex-1 font-bold">{bt.noAddress ? '' : (co?.address ?? '')}</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Hình thức thanh toán" en="Payment method" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold">Chuyển khoản</dd>
          </div>
          <div className="flex gap-1 border-b border-dotted border-slate-300">
            <dt className="shrink-0 text-slate-600"><InvLabel vi="Đơn vị tiền tệ" en="Currency" /> :</dt>
            <dd className="min-w-0 flex-1 font-bold">VND</dd>
          </div>
        </dl>

        {/* line table — the provider's numbered column headers */}
        <div className="mt-3 border border-slate-400">
          <div className="grid border-b border-slate-400 bg-white text-center text-[9px] font-semibold" style={{ gridTemplateColumns: COLS }}>
            <Cell><InvHead vi="STT" en="No." /></Cell>
            <Cell><InvHead vi="Tên hàng hóa, dịch vụ" en="Description" /></Cell>
            <Cell><InvHead vi="Đơn vị tính" en="Unit" /></Cell>
            <Cell><InvHead vi="Số lượng" en="Quantity" /></Cell>
            <Cell><InvHead vi="Đơn giá" en="Unit price" /></Cell>
            <Cell><InvHead vi="Thành tiền trước thuế" en="Amount before VAT" /></Cell>
            <Cell><InvHead vi="Thuế suất" en="VAT rate" /></Cell>
            <Cell><InvHead vi="Tiền thuế" en="VAT amount" /></Cell>
            <Cell><InvHead vi="Tổng tiền thanh toán" en="Total payable" /></Cell>
          </div>
          <div className="grid border-b border-slate-300 text-center text-[8px] text-slate-500" style={{ gridTemplateColumns: COLS }}>
            <Cell>1</Cell><Cell>2</Cell><Cell>3</Cell><Cell>4</Cell><Cell>5</Cell><Cell>6=4x5</Cell><Cell>7</Cell><Cell>8</Cell><Cell>9=6+8</Cell>
          </div>
          <div className="grid min-h-[96px] border-b border-slate-400" style={{ gridTemplateColumns: COLS }}>
            <Cell className="text-center">1</Cell>
            <Cell className="text-left">{pack.vi}</Cell>
            <Cell className="text-center">{pack.unitVi}</Cell>
            <Cell className="text-center tabular-nums">{inv.qty}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(unit)}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(sub)}</Cell>
            <Cell className="text-center tabular-nums">{VAT_RATE}%</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(vat)}</Cell>
            <Cell className="text-right font-semibold tabular-nums">{pdfNum(inv.total)}</Cell>
          </div>
          {/* the provider's VAT-rate summary block, every band listed */}
          <div className="grid border-b border-slate-400 bg-white text-[9px] font-semibold" style={{ gridTemplateColumns: 'minmax(0,2fr) 56px 1fr 1fr 1.2fr' }}>
            <Cell><InvHead vi="Tổng hợp" en="Summary" /></Cell>
            <Cell className="text-center"><InvHead vi="Thuế suất" en="VAT rate" /></Cell>
            <Cell className="text-center"><InvHead vi="Tổng tiền trước thuế" en="Total before VAT" /></Cell>
            <Cell className="text-center"><InvHead vi="Tổng tiền thuế" en="Total VAT" /></Cell>
            <Cell className="text-center"><InvHead vi="Tổng tiền thanh toán" en="Total payable" /></Cell>
          </div>
          {([
            ['Tổng tiền không chịu thuế:', 'KCT', false],
            ['Tổng tiền chịu thuế suất:', '0%', false],
            ['Tổng tiền chịu thuế suất:', '5%', false],
            ['Tổng tiền chịu thuế suất:', `${VAT_RATE}%`, true],
            ['Tổng tiền chịu thuế suất:', '10%', false],
            ['Tổng tiền không tính thuế:', 'KKKNT', false],
            ['Tổng tiền chịu thuế suất:', 'KHAC', false],
          ] as const).map(([label, band, on], i) => (
            <div key={i} className="grid border-b border-slate-300 text-[9px]" style={{ gridTemplateColumns: 'minmax(0,2fr) 56px 1fr 1fr 1.2fr' }}>
              <Cell>{label}</Cell>
              <Cell className="text-center">{band}</Cell>
              <Cell className={cn('text-right tabular-nums', on && 'font-bold')}>{on ? pdfNum(sub) : ''}</Cell>
              <Cell className={cn('text-right tabular-nums', on && 'font-bold')}>{on ? pdfNum(vat) : ''}</Cell>
              <Cell className={cn('text-right tabular-nums', on && 'font-bold')}>{on ? pdfNum(inv.total) : ''}</Cell>
            </div>
          ))}
          <div className="grid border-b border-slate-400 text-[9px] font-bold" style={{ gridTemplateColumns: 'minmax(0,2fr) 56px 1fr 1fr 1.2fr' }}>
            <Cell>Tổng cộng :</Cell><Cell />
            <Cell className="text-right tabular-nums">{pdfNum(sub)}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(vat)}</Cell>
            <Cell className="text-right tabular-nums">{pdfNum(inv.total)}</Cell>
          </div>
          <div className="px-1.5 py-1 text-[9px]">
            <span className="text-slate-600"><InvLabel vi="Số tiền viết bằng chữ" en="Amount in words" /> : </span><b>{vnWords(inv.total)}</b>
          </div>
        </div>

        {/* signature row — the seller block only exists on an official invoice */}
        <div className="mt-4 grid grid-cols-2 gap-6 text-center text-[9.5px]">
          <div>
            <p className="font-bold">Người mua hàng</p>
            <div className="h-[64px]" />
          </div>
          <div>
            <p className="font-bold">Người bán hàng</p>
            {official ? (
              <div className="mt-1.5 inline-block rounded border border-red-300 px-3 py-1.5 text-left text-[8.5px] leading-snug">
                <p className="font-semibold text-slate-700">Signature Valid</p>
                <p className="mt-0.5 text-red-600">✅ bởi: {ISSUER.nameVi}</p>
                <p className="text-red-600">Ký ngày: {inv.issued !== '—' ? inv.issued.replace(/\//g, '-') : '—'}</p>
              </div>
            ) : (
              <div className="mt-1.5 inline-block rounded border border-dashed border-slate-300 px-3 py-3 text-[8.5px] text-slate-400">chưa ký số</div>
            )}
          </div>
        </div>

        {/* the tax-authority code and lookup page exist only once it is filed */}
        {official ? (
          <div className="mt-3 border-t border-slate-300 pt-2 text-[8.5px] leading-relaxed">
            <p><span className="text-slate-600">Mã của cơ quan thuế: </span><b className="font-mono">0035FDFC78864F4C08BA320C8F8A9D9EE6</b></p>
            <p>
              <span className="text-slate-600">Trang tra cứu: </span>
              <span className="text-sky-700 underline">http://0315421202hd.easyinvoice.com.vn</span>
              <span className="text-slate-600"> · Mã tra cứu: </span><b className="font-mono">RO2NN7MLS</b>
            </p>
            <p className="text-slate-400">(Cần kiểm tra, đối chiếu khi lập, giao, nhận hóa đơn)</p>
          </div>
        ) : (
          <p className="mt-3 border-t border-dashed border-slate-300 pt-2 text-[8.5px] leading-relaxed text-slate-400">
            Bản nháp: chưa có số hóa đơn, chưa ký số, chưa có mã của cơ quan thuế và chưa có trang tra cứu. Chỉ dùng để khách đối chiếu thông tin trước khi xuất chính thức.
          </p>
        )}
      </div>
    </div>
  )
}

export function InvoicePdfModal({ inv, co, onClose }: { inv: Inv; co?: Company; onClose: () => void }) {
  const [zoom, setZoom] = useState(0.9)
  const official = inv.step === 'issued'
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-900 px-4 py-2.5 text-white">
        <span className="text-[13px] font-semibold">{official ? 'Hóa đơn chính / Official invoice' : 'Hóa đơn nháp / Draft invoice'}</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px]">{inv.code}.pdf</span>
        {!official && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10.5px] font-medium text-amber-300">chưa cấp số · chưa ký số</span>}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center overflow-hidden rounded-md border border-slate-600">
            <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">−</button>
            <span className="min-w-[46px] px-1 text-center text-[11px] tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))} className="px-2 py-1 text-[12px] hover:bg-white/10">+</button>
          </div>
          <button className="rounded-md border border-slate-600 px-2.5 py-1 text-[12px] font-medium hover:bg-white/10">🖨 In / Print</button>
          <button className="rounded-md bg-white px-3 py-1 text-[12px] font-semibold text-slate-900 hover:opacity-90">⬇ Tải PDF</button>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-slate-300 hover:bg-white/10">✕</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div style={{ width: 794 * zoom, margin: '0 auto' }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 794 }}>
            <InvoicePdfDoc inv={inv} co={co} />
          </div>
        </div>
      </div>
    </div>
  )
}
