import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANIES, coLabel, isVerified } from '@/pages/admin/data/companies'
import { INVOICES, POS, QUOTE_CATALOG, VAT_RATE, invPay, invPayInfo, invStage, payStatus, qrState, fmtUnit } from '@/pages/admin/data/sales'
import type { Inv } from '@/pages/admin/data/sales'
import { MOCK_TODAY, asDate, dateBefore, money, vnWords } from '@/pages/admin/lib/fmt'
import { PayCell, QrLine } from '@/pages/admin/screens/sales/_shared'
import { InvoicePdfModal } from '@/pages/admin/screens/sales/invoicePdf'
import { InfoBit } from '@/pages/admin/ui/fields'
import { ListPage } from '@/pages/admin/ui/list'
import { PeriodBar, inPeriod, usePeriod } from '@/pages/admin/ui/period'
import { MiniStat } from '@/pages/admin/ui/stats'
import { Pill } from '@/pages/admin/ui/status'

/* ── Xuất hóa đơn chính thức — toàn bộ, một phần, hoặc phần còn lại ──────────
   Kế toán chọn GIÁ TRỊ XUẤT trước khi tờ hóa đơn được filing, vì lựa chọn đó
   quyết định dòng hàng hóa in ra: toàn bộ đơn hàng in lại các dòng của PO, một
   phần in ĐÚNG MỘT dòng do kế toán gõ tay ("… (ĐỢT 1)") với đơn giá tự nhập.
   Mọi con số còn lại suy ra từ đơn giá — kế toán không gõ tiền thuế hay tổng
   tiền, vì gõ tay một con số đã tính được là mời sai số vào tờ hóa đơn.

   Một đơn hàng vì thế có thể cần NHIỀU tờ hóa đơn, mỗi tờ một số pháp lý
   riêng. Số tiền còn lại = PO trước thuế − các đợt đã phát hành (không tính
   đợt đã hủy), và nó là thứ duy nhất chặn đơn giá nhập vào. */
export type Tranche = { no: number; name: string; net: number }

function IssueDialog({ inv, left, no, onClose, onIssue }: {
  inv: Inv; left: number; no: number; onClose: () => void; onIssue: (t: Tranche) => void
}) {
  /* Đợt 1 mặc định là toàn bộ. Từ đợt 2 thì "toàn bộ" không còn là lựa chọn
     thật — phần đó đã nằm trên tờ trước rồi — nên dropdown mở sẵn ở một phần
     và option kia bị khóa, kèm lý do. */
  const [mode, setMode] = useState<'full' | 'partial'>(no === 1 ? 'full' : 'partial')
  /* Chỉ từ đợt 2 trở đi. Ở đợt 1, "số tiền còn lại" chính là cả đơn hàng, nên
     checkbox sẽ chỉ là một cách gọi khác của option "toàn bộ". */
  const [useLeft, setUseLeft] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const typed = Number(price) || 0
  const net = mode === 'full' || useLeft ? left : typed
  const vat = Math.round((net * VAT_RATE) / 100)
  const over = mode === 'partial' && !useLeft && typed > left
  const blocked = mode === 'partial' && (!name.trim() || net <= 0 || over)
  const num = (n: number) => n.toLocaleString('en-US')
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-10">
      <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-start justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">Xuất hóa đơn chính thức<span className="ml-1.5 font-normal text-muted">· Kế toán</span></p>
            <p className="truncate font-mono text-[11px] text-muted">{inv.code} · {inv.po} · đợt {no}</p>
          </div>
          <span className="cursor-pointer pl-3 text-faint" onClick={onClose}>✕</span>
        </div>

        <div className="space-y-3.5 p-4">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Giá trị xuất hóa đơn</label>
            <select
              value={mode}
              onChange={(e) => { setMode(e.target.value as 'full' | 'partial'); setUseLeft(false) }}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none focus:border-brand"
            >
              <option value="full" disabled={no > 1}>Toàn bộ giá trị đơn hàng{no > 1 ? ' — đã xuất một phần rồi' : ''}</option>
              <option value="partial">Một phần giá trị đơn hàng</option>
            </select>
            <p className="mt-1 text-[10.5px] text-faint">
              {mode === 'full'
                ? 'Dòng hàng hóa copy từ PO, không sửa — cách hệ thống đang làm.'
                : <>Một dòng duy nhất, kế toán gõ tay. Chưa xuất: <b className="tabular-nums text-ink/70">{num(left)} ₫</b> (trước thuế).</>}
            </p>
          </div>

          {mode === 'partial' && (
            <>
              {/* Chỉ xuất hiện từ hóa đơn thứ 2. Tick thì ĐƠN GIÁ bị khóa và tự
                  điền; TÊN HÀNG HÓA thì không — tên là thứ duy nhất hệ thống
                  không suy ra được, và nó mang số hợp đồng + số đợt. */}
              {no > 1 && (
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2">
                  <input type="checkbox" checked={useLeft} onChange={(e) => setUseLeft(e.target.checked)} className="mt-0.5" />
                  <span className="text-[11.5px] leading-relaxed text-ink/80">
                    <b>Xuất số tiền còn lại</b> — hệ thống tự tính <span className="tabular-nums">{num(left)} ₫</span> và tự suy ra đơn giá.
                    <span className="block text-[10.5px] text-faint">Tên hàng hóa, dịch vụ vẫn phải nhập tay.</span>
                  </span>
                </label>
              )}

              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Tên hàng hóa, dịch vụ <span className="text-rose-600">*</span></label>
                <textarea
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 255))}
                  rows={2}
                  placeholder={`Dịch vụ tuyển dụng Saramin theo hợp đồng số … (ĐỢT ${no})`}
                  className="w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] text-faint">In nguyên văn lên tờ hóa đơn. Tối đa 255 ký tự ({name.length}/255).</p>
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Đơn giá (chưa thuế) <span className="text-rose-600">*</span></label>
                <input
                  value={useLeft ? num(left) : price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  readOnly={useLeft}
                  placeholder="174300000"
                  className={cn('w-full rounded-md border px-3 py-2 text-[12.5px] tabular-nums outline-none focus:border-brand',
                    over ? 'border-rose-400 bg-rose-50/40' : 'border-line bg-surface', useLeft && 'bg-canvas/60 text-muted')}
                />
                {over && <p className="mt-1 text-[10.5px] font-medium text-rose-700">Vượt quá số tiền chưa xuất hóa đơn của đơn hàng ({num(left)} ₫).</p>}
              </div>
            </>
          )}

          {/* Hệ thống tự tính — không ô nào ở đây gõ được. Số lượng và ĐVT cố
              định vì tờ hóa đơn mẫu là 1 Gói; đơn giá × 1 = thành tiền. */}
          <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2.5 text-[11.5px]">
            <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-faint">Hệ thống tự tính</p>
            <div className="flex justify-between"><span className="text-muted">ĐVT · Số lượng</span><span>Gói · <span className="tabular-nums">1</span></span></div>
            <div className="flex justify-between"><span className="text-muted">Thành tiền trước thuế</span><span className="tabular-nums">{num(net)} ₫</span></div>
            <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{num(vat)} ₫</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng tiền thanh toán</span><span className="tabular-nums">{num(net + vat)} ₫</span></div>
            <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Số tiền viết bằng chữ: {net > 0 ? vnWords(net + vat) : '—'}.</p>
            <p className="mt-1.5 border-t border-line pt-1.5 text-[10.5px] text-muted">
              Còn lại sau đợt này: <b className={cn('tabular-nums', left - net === 0 ? 'text-emerald-700' : 'text-ink/70')}>{num(Math.max(left - net, 0))} ₫</b>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink hover:bg-canvas">Huỷ</button>
          <button
            onClick={() => onIssue({ no, name: mode === 'full' ? 'Toàn bộ giá trị đơn hàng' : name.trim(), net })}
            disabled={blocked}
            className="rounded-lg bg-amber-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            Xuất hóa đơn chính
          </button>
        </div>
      </div>
    </div>
  )
}

function InvoiceDetail({ inv, onBack }: { inv: Inv; onBack: () => void }) {
  useDetailCrumb(inv.code, onBack)
  const [pdf, setPdf] = useState(false)
  /* Các đợt đã phát hành trên ĐƠN HÀNG này. Local state chỉ vì mock không có
     store — thật thì đây là các dòng `invoice` cùng `po_id`, đọc theo
     `tranche_no`, và một đợt bị hủy thì rơi khỏi tổng này. */
  const [issuing, setIssuing] = useState(false)
  const [tranches, setTranches] = useState<Tranche[]>([])
  /* Confirming payment is ONE write, against the PO. The invoice and the PO both
     read that fact, so the PO's payment column follows by construction rather than
     by a second update that could fail on its own. Local state here only because
     the mock has no store. */
  const [paidNow, setPaidNow] = useState<{ at: string; amount: number } | null>(null)
  const [confirming, setConfirming] = useState(false)
  const base = invPay(inv)
  /* ONE button, and the AMOUNT decides the status: less than what is left →
     Partially paid, all of it → Paid. A second "confirm partially" button would be
     a second name for the same act. */
  const pay = paidNow ? { ...base, paidAt: paidNow.at, paidAmount: (base.paidAt ? base.paidAmount ?? base.total : 0) + paidNow.amount } : base
  const payNow = payStatus(pay)
  const remaining = pay.total - (pay.paidAt ? pay.paidAmount ?? pay.total : 0)
  const [amt, setAmt] = useState(String(remaining))
  const [rcvd, setRcvd] = useState(dateBefore(0))
  const srcPo = POS.find((p) => p.code === inv.po)
  const qr = srcPo ? qrState(srcPo, pay.paidAt) : null
  /* `customer` on an invoice may be the record name, the legal name or the display
     name depending on which row wrote it — match on all of them, or the buyer block
     silently prints as a company when it should print as an individual. */
  const invCo = COMPANIES.find((x) => x.name === inv.co)
    ?? COMPANIES.find((x) => x.name === inv.customer || x.legalName === inv.customer || coLabel(x) === inv.customer)
  const pack = QUOTE_CATALOG[inv.product]
  /* Lines on an invoice never carry a discount. Where the quotation had explicit
     lines, `calc` is those lines with every discount folded into the unit price;
     otherwise the single catalogue line is back-solved from the total. */
  const rows = inv.calc
    ? inv.calc.lines.map((l) => ({ name: l.name, unit: l.unitVi, qty: l.qty, price: fmtUnit(l.invUnit), amt: l.invNet }))
    : [{ name: pack.vi, unit: pack.unitVi, qty: inv.qty, price: Math.round(Math.round(inv.total / (1 + VAT_RATE / 100)) / inv.qty).toLocaleString('en-US'), amt: Math.round(inv.total / (1 + VAT_RATE / 100)) }]
  const sub = inv.calc ? inv.calc.base : Math.round(inv.total / (1 + VAT_RATE / 100))
  const vat = inv.total - sub
  const st = invStage(inv)
  /* Số tiền còn lại được tính trên TRƯỚC THUẾ, vì đó là con số kế toán gõ vào ô
     Đơn giá — thuế là hệ quả, không phải thứ chia được theo đợt. */
  const issuedNet = tranches.reduce((n, t) => n + t.net, 0)
  const left = sub - issuedNet
  return (
    <div>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">
            {inv.step === 'issued'
              ? 'Hóa đơn GTGT / VAT e-invoice'
              : inv.step === 'archived'
                ? 'Hóa đơn nháp / Draft — lưu trữ, PO đã hết hạn'
                : 'Hóa đơn nháp / Draft — chưa có giá trị pháp lý, chưa cấp quota'}
          </p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="font-mono">{inv.code}</span>
            <Pill tone={st.tone}>{st.en}</Pill>
            {/* The second, independent axis. An issued invoice can still be unpaid,
                and an unpaid one can still be overdue — none of which is a document
                status, so it gets its own badge instead of changing that one. */}
            <PayCell facts={pay} />
          </h2>
          <p className="text-[11.5px] text-muted">{st.vi} · {inv.customer}</p>
        </div>
        {/* Read left to right: the action, then the documents. Every invoice has a
            draft behind it, and an issued one has TWO documents worth opening —
            checking the filed sheet against the draft it came from is a real task,
            so each gets its own button rather than one button that changes meaning.
            The official one sits furthest right: it is the one that counts.
            Printing and downloading live inside the viewer, so neither of these is
            a second download button. */}
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          {/* A DRAFT carries a Sales action only. Kế toán opening this screen gets
              told why there is nothing for them to do, rather than looking for a
              button that was never rendered — "the request has not been made yet"
              is a different problem from "I lack the permission". */}
          {inv.step === 'draft' && (
            /* The request is a SALES act, and it is gated on the company being
               VERIFIED: the invoice prints the legal name and MST, and nobody has
               checked those against the certificate yet. The reason sits on the
               button — "I lack the permission" and "the company is not verified"
               are different problems, and a missing button cannot tell them apart. */
            (invCo && !isVerified(invCo)) ? (
              <>
                <span className="text-[11px] text-amber-800">Công ty <b>chưa được xác minh</b> — Verify ở Company detail (ERC · MST · tên pháp lý) rồi mới yêu cầu xuất hóa đơn.</span>
                <button disabled title="Công ty chưa xác minh — không yêu cầu xuất hóa đơn được" className="cursor-not-allowed rounded-lg bg-canvas px-3 py-1.5 text-[12px] font-semibold text-faint">Yêu cầu xuất hóa đơn chính</button>
              </>
            ) : (
              <>
                <span className="text-[11px] text-muted">Kế toán chỉ xuất được hóa đơn chính khi Sales đã <b className="text-ink/75">yêu cầu</b>.</span>
                <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Yêu cầu xuất hóa đơn chính</button>
              </>
            )
          )}
          {/* Một nút, và nó mở DIALOG chứ không file thẳng — giá trị xuất là một
              lựa chọn (toàn bộ / một phần), và một đơn hàng có thể cần nhiều tờ.
              Hết số tiền chưa xuất thì nút tắt, vì "xuất thêm" lúc đó là xuất
              vượt giá trị đơn hàng. */}
          {inv.step === 'requested' && (
            left > 0 ? (
              <button onClick={() => setIssuing(true)} className="rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">
                {tranches.length ? `Xuất hóa đơn đợt ${tranches.length + 1}` : 'Xuất hóa đơn chính'}
                <span className="ml-1 font-normal opacity-90">· Kế toán</span>
              </button>
            ) : (
              <button disabled title="Đơn hàng đã xuất hóa đơn đủ giá trị" className="cursor-not-allowed rounded-lg bg-canvas px-3 py-1.5 text-[12px] font-semibold text-faint">Đã xuất đủ giá trị</button>
            )
          )}
          {/* KẾ TOÁN ONLY, and only while money is outstanding — Unpaid, Partially
              paid or Overdue. It is independent of the document status: an invoice can be
              issued and unpaid, or still a draft and already paid. */}
          {payNow !== 'Paid' && (
            <button
              onClick={() => { setAmt(String(remaining)); setConfirming(true) }}
              title={`Xác nhận đã nhận tiền. Ghi vào PO ${inv.po} — cột Thanh toán của PO cập nhật theo. Chỉ Kế toán.`}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
            >
              Confirm payment<span className="ml-1 font-normal opacity-90">· Kế toán</span>
            </button>
          )}
          {paidNow && (
            <span className="text-[11px] text-emerald-700">✓ Đã ghi vào <b className="font-mono">{inv.po}</b></span>
          )}
          {/* No draft viewer here. A draft is produced and read on its PO — this
              screen is for the document that was filed. Two buttons that opened the
              same modal only made a reader ask which one they were looking at. */}
          <button
            onClick={() => setPdf(true)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink hover:border-brand hover:text-brand"
          >
            {inv.step === 'issued' ? 'Xem hóa đơn chính' : 'Xem hóa đơn'}
          </button>
        </div>
      </div>

      {/* No status banner and no explanatory notes on the record. The eyebrow, the
          pill beside the number and the button row already say what this document
          is and what may be done to it; a stack of coloured boxes repeating it was
          pushing the invoice itself below the fold. The rules live in the
          requirement, not on every record. */}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Số hóa đơn" value={inv.code} mono hint={inv.step === 'issued' ? 'do nhà cung cấp cấp' : 'chưa có giá trị pháp lý'} />
        <InfoBit label="Ngày xuất chính / Issued" value={inv.issued} hint={inv.step === 'issued' ? 'một SỰ KIỆN, không phải kế hoạch' : inv.step === 'archived' ? 'không bao giờ xuất chính' : 'chưa xuất chính'} />
        <InfoBit label="Kích hoạt trước / Activate by" value={inv.activateBy} hint="ngày xuất chính + 12 tháng" />
        <InfoBit label="Từ PO" value={inv.po} mono />
        <InfoBit label="Thanh toán đã xác nhận" value={inv.payment ?? '—'} mono hint={inv.payment ? `bởi ${inv.issuer}` : 'chưa có'} />
      </div>
      {/* The PO's QR line, read-only here — the same notice, from the same PO. */}
      {qr && <div className="-mt-2 mb-4 rounded-lg border border-line bg-canvas/40 px-3.5 py-2"><QrLine qr={qr} /></div>}

      {/* Chỉ hiện khi đơn hàng được xuất làm nhiều đợt. Một tờ một số pháp lý
          riêng, nên cái người đọc cần là "đơn hàng này đã xuất bao nhiêu, còn
          bao nhiêu" — con số chặn mọi đợt sau. */}
      {tranches.length > 0 && (
        <div className="mb-4 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">Xuất theo đợt · PO {inv.po}</p>
            <p className="text-[11.5px] text-muted">
              Đã xuất <b className="tabular-nums text-ink/80">{issuedNet.toLocaleString('en-US')} ₫</b> / {sub.toLocaleString('en-US')} ₫ ·
              còn lại <b className={cn('tabular-nums', left === 0 ? 'text-emerald-700' : 'text-amber-700')}>{left.toLocaleString('en-US')} ₫</b> <span className="text-faint">(trước thuế)</span>
            </p>
          </div>
          <div className="mt-1.5 space-y-1">
            {tranches.map((t) => (
              <div key={t.no} className="flex items-baseline justify-between gap-3 border-t border-line pt-1 text-[11.5px] first:border-0 first:pt-0">
                <span className="min-w-0 truncate"><b className="text-ink/75">Đợt {t.no}</b> <span className="text-muted">{t.name}</span></span>
                <span className="shrink-0 tabular-nums text-ink/80">{t.net.toLocaleString('en-US')} ₫ <span className="text-faint">+ VAT {Math.round((t.net * VAT_RATE) / 100).toLocaleString('en-US')}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-[11.5px] leading-relaxed">
            <p className="text-muted">Đơn vị bán hàng:</p>
            <p className="font-bold text-ink">DAOUKIWOOM INNOVATION COMPANY LIMITED</p>
            <p className="text-ink/80">Level 12, 13 &amp; 14, AP Tower, 518B Dien Bien Phu, Thanh My Tay Ward, HCMC</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">0315421202</span></p>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed">
            <p className="text-muted">Đơn vị mua hàng:</p>
            <p className="font-bold text-brand">{inv.customer}</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">{COMPANIES.find((c) => c.name === inv.co)?.tax ?? '0318705749'}</span></p>
            <p className="mt-1 text-[10.5px] text-faint">Khớp chính xác với thông tin trên báo giá — lệch là phải hủy &amp; xuất lại</p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <div className="grid min-w-[620px] gap-x-3 bg-ink px-3 py-2 text-[11px] font-semibold text-white" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
            <span>#</span><span>Tên hàng hóa, dịch vụ</span><span className="text-right">ĐVT</span><span className="text-right">SL</span><span className="text-right">Đơn giá</span><span className="text-right">Thành tiền</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid min-w-[620px] gap-x-3 border-t border-line px-3 py-2 text-[12px]" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
              <span className="text-faint">{i + 1}</span><span className="truncate">{r.name}</span>
              <span className="text-right text-[11px] text-muted">{r.unit}</span>
              <span className="text-right tabular-nums">{r.qty}</span>
              <span className="text-right tabular-nums">{r.price}</span>
              <span className="text-right tabular-nums">{r.amt.toLocaleString('en-US')}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Cộng tiền hàng</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng tiền thanh toán</span><span className="tabular-nums">{inv.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Số tiền viết bằng chữ: {vnWords(inv.total)}.</p>
        </div>
      </div>

      {pdf && <InvoicePdfModal inv={inv} co={invCo} onClose={() => setPdf(false)} />}
      {issuing && (
        <IssueDialog
          inv={inv}
          left={left}
          no={tranches.length + 1}
          onClose={() => setIssuing(false)}
          onIssue={(t) => { setTranches((xs) => [...xs, t]); setIssuing(false) }}
        />
      )}
      {confirming && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-16">
          <div className="w-full max-w-[380px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="flex items-start justify-between border-b border-line px-4 py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink">Confirm payment</p>
                <p className="truncate font-mono text-[11px] text-muted">{inv.code} · {inv.po}</p>
              </div>
              <span className="cursor-pointer pl-3 text-faint" onClick={() => setConfirming(false)}>✕</span>
            </div>
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Số tiền nhận</label>
                <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9]/g, ''))} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] tabular-nums outline-none focus:border-brand" />
                <p className="mt-1 text-[10.5px] text-faint">Còn lại {remaining.toLocaleString('en-US')} ₫ — ít hơn số này là <b className="text-ink/70">Partially paid</b>, bằng là <b className="text-ink/70">Paid</b>.</p>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Ngày nhận</label>
                <input value={rcvd} onChange={(e) => setRcvd(e.target.value)} placeholder="dd/mm/yyyy" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] tabular-nums outline-none focus:border-brand" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
              <button onClick={() => setConfirming(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink hover:bg-canvas">Huỷ</button>
              <button
                onClick={() => { setPaidNow({ at: rcvd, amount: Math.min(Number(amt) || 0, remaining) }); setConfirming(false) }}
                disabled={!Number(amt)}
                className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminInvoices() {
  const [open, setOpen] = useState<Inv | null>(null)
  const period = usePeriod()
  if (open) return <InvoiceDetail inv={open} onBack={() => setOpen(null)} />
  /* Archived rows are withdrawn from the default list. A draft whose PO expired
     never had legal force and granted nothing, so it is not an invoice to
     reconcile — but it stays reachable through the Archived tab and from its PO,
     because "what happened to that draft?" is a real month-end question. */
  /* Period first, on the invoice's own issue date. A DRAFT has no issue date yet,
     so it follows its PO's issue date — otherwise every preset but All time would
     hide exactly the rows Sales is still working on. */
  const invDate = (i: Inv) => (i.issued !== '—' ? i.issued : POS.find((p) => p.code === i.po)?.issued)
  const rows = INVOICES.filter((i) => i.step !== 'archived').filter((i) => inPeriod(invDate(i), period))
  const byStage = (en: string) => rows.filter((i) => invStage(i).en === en).length
  const archived = INVOICES.filter((i) => i.step === 'archived' && inPeriod(invDate(i), period)).length
  const expiring = rows.filter((i) => i.activateBy !== '—' && (asDate(i.activateBy).getTime() - MOCK_TODAY.getTime()) / 86_400_000 <= 60).length
  const sumOf = (rs: Inv[]) => rs.reduce((n, i) => n + i.total, 0)
  const collected = rows.filter((i) => payStatus(invPay(i)) === 'Paid')
  return (
    <div className="space-y-3">
    <PeriodBar summary={`${rows.length} hoá đơn trong kỳ`} />
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <MiniStat label="Hoá đơn" value={rows.length} sub="trong kỳ, không tính lưu trữ" />
      <MiniStat label="Tổng giá trị" value={money(sumOf(rows))} sub="sau VAT, khớp PO" />
      <MiniStat label="Đã xuất chính thức" value={byStage('Invoice issued')} sub={`${byStage('Draft') + byStage('Invoice requested')} nháp / đang yêu cầu`} />
      <MiniStat label="Đã thu tiền" value={collected.length} sub={`${money(sumOf(collected))} đã về tài khoản`} />
    </div>
    <ListPage
      tabs={[{ label: 'All', count: rows.length, active: true }, { label: 'Draft', count: byStage('Draft') }, { label: 'Invoice requested', count: byStage('Invoice requested') }, { label: 'Invoice issued', count: byStage('Invoice issued') }, { label: 'Archived', count: archived }, { label: 'Activation expiring', count: expiring }]}
      cols={[{ label: 'Invoice no.', w: '1.2fr' }, { label: 'Customer', w: '1.6fr' }, { label: 'From PO', w: '1.4fr' }, { label: 'Total', w: '1.1fr', align: 'r' },
        // Named for what it is, and paired with the money's status — the same two
        // lifecycles, and the same fix, as the PO list.
        { label: 'Invoice status', w: '1.9fr' },
        { label: 'Payment status', w: '1.1fr' },
        // The three payment columns are READ FROM THE PO, not stored here. An
        // invoice is the fiscal half of a PO, so the terms it was sold on are the
        // PO's terms; copying them would let a correction on one document leave
        // the other showing yesterday's answer.
        { label: 'Điều khoản TT', w: '1.2fr' },
        { label: 'Phương thức TT', w: '1.1fr' },
        { label: 'Ngày thu tiền', w: '1fr' },
        { label: 'Issued', w: '0.9fr' }, { label: 'Activate by', w: '0.9fr' }]}
      rows={rows.map((i) => {
        const st = invStage(i)
        const pay = invPayInfo(i)
        return [
          <button onClick={() => setOpen(i)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{i.code}</button>,
          <span className="truncate">{i.customer}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{i.po}</span>,
          <span className="tabular-nums">{i.total.toLocaleString('en-US')} ₫</span>,
          <Pill tone={st.tone}>{st.en}</Pill>,
          <PayCell facts={invPay(i)} qr={(() => { const p = POS.find((x) => x.code === i.po); return p ? qrState(p) : null })()} />,
          /* An em-dash, not a blank — a PO issued before these fields existed
             recorded no term, which is not the same as having none. */
          <span className={cn('truncate', pay.payTerms ? 'text-ink/80' : 'text-faint')}>{pay.payTerms ?? '—'}</span>,
          <span className={cn('truncate', pay.payMethod ? 'text-ink/80' : 'text-faint')}>{pay.payMethod ?? '—'}</span>,
          <span className={cn('tabular-nums', pay.paidAt ? 'text-ink/80' : 'text-faint')}>{pay.paidAt?.replace(/\./g, '/') ?? '—'}</span>,
          <span className="tabular-nums text-muted">{i.issued}</span>,
          <span className="tabular-nums text-muted">{i.activateBy}</span>,
        ]
      })}
      minW={1720}
      total={rows.length}
    />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        A draft invoice whose PO expired at month end is <b className="text-muted">withdrawn from this list</b> — it never had legal force and granted
        nothing, so it is not an invoice to reconcile. The record stays on its PO and in the audit log.
      </p>
    </div>
  )
}
