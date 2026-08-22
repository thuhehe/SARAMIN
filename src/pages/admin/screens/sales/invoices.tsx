import { useState } from 'react'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import { INVOICES, QUOTE_CATALOG, VAT_RATE, invPay, invStage, payStatus } from '@/pages/admin/data/sales'
import type { Inv } from '@/pages/admin/data/sales'
import { dateBefore, vnWords } from '@/pages/admin/lib/fmt'
import { PayCell } from '@/pages/admin/screens/sales/_shared'
import { InvoicePdfModal } from '@/pages/admin/screens/sales/invoicePdf'
import { InfoBit } from '@/pages/admin/ui/fields'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

function InvoiceDetail({ inv, onBack }: { inv: Inv; onBack: () => void }) {
  useDetailCrumb(inv.code, onBack)
  const [pdf, setPdf] = useState(false)
  /* Confirming payment is ONE write, against the PO. The invoice and the PO both
     read that fact, so the PO's payment column follows by construction rather than
     by a second update that could fail on its own. Local state here only because
     the mock has no store. */
  const [paidNow, setPaidNow] = useState<string | null>(null)
  const pay = invPay(inv)
  const payNow = payStatus(paidNow ?? pay.paidAt, pay.poIssued)
  /* `customer` on an invoice may be the record name, the legal name or the display
     name depending on which row wrote it — match on all of them, or the buyer block
     silently prints as a company when it should print as an individual. */
  const invCo = COMPANIES.find((x) => x.name === inv.co)
    ?? COMPANIES.find((x) => x.name === inv.customer || x.legalName === inv.customer || coLabel(x) === inv.customer)
  const pack = QUOTE_CATALOG[inv.product]
  const sub = Math.round(inv.total / (1 + VAT_RATE / 100))
  const vat = inv.total - sub
  const unit = Math.round(sub / inv.qty)
  const st = invStage(inv)
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
            <PayCell paidAt={paidNow ?? pay.paidAt} poIssued={pay.poIssued} />
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
            <>
              <span className="text-[11px] text-muted">Kế toán chỉ xuất được hóa đơn chính khi Sales đã <b className="text-ink/75">yêu cầu</b>.</span>
              <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Yêu cầu xuất hóa đơn chính</button>
            </>
          )}
          {inv.step === 'requested' && (
            <button className="rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Xuất hóa đơn chính<span className="ml-1 font-normal opacity-90">· Kế toán</span></button>
          )}
          {/* KẾ TOÁN ONLY, and only while the money is outstanding — Unpaid or
              Overdue. It is independent of the document status: an invoice can be
              issued and unpaid, or still a draft and already paid. */}
          {payNow !== 'Paid' && (
            <button
              onClick={() => setPaidNow(dateBefore(0))}
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
          <div className="grid min-w-[620px] gap-x-3 border-t border-line px-3 py-2 text-[12px]" style={{ gridTemplateColumns: '28px 2.6fr 0.7fr 0.6fr 1fr 1fr' }}>
            <span className="text-faint">1</span><span className="truncate">{pack.vi}</span>
            <span className="text-right text-[11px] text-muted">{pack.unitVi}</span>
            <span className="text-right tabular-nums">{inv.qty}</span>
            <span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span>
            <span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
          </div>
        </div>

        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Cộng tiền hàng</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng tiền thanh toán</span><span className="tabular-nums">{inv.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Số tiền viết bằng chữ: {vnWords(inv.total)}.</p>
        </div>
      </div>

      {pdf && <InvoicePdfModal inv={inv} co={invCo} onClose={() => setPdf(false)} />}
    </div>
  )
}

export function AdminInvoices() {
  const [open, setOpen] = useState<Inv | null>(null)
  if (open) return <InvoiceDetail inv={open} onBack={() => setOpen(null)} />
  /* Archived rows are withdrawn from the default list. A draft whose PO expired
     never had legal force and granted nothing, so it is not an invoice to
     reconcile — but it stays reachable through the Archived tab and from its PO,
     because "what happened to that draft?" is a real month-end question. */
  const rows = INVOICES.filter((i) => i.step !== 'archived')
  return (
    <div>
    <ListPage
      tabs={[{ label: 'All', count: 210, active: true }, { label: 'Draft', count: 5 }, { label: 'Invoice requested', count: 3 }, { label: 'Invoice issued' }, { label: 'Archived', count: 4 }, { label: 'Activation expiring', count: 6 }]}
      cols={[{ label: 'Invoice no.', w: '1.2fr' }, { label: 'Customer', w: '1.6fr' }, { label: 'From PO', w: '1.4fr' }, { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.9fr' },
        { label: 'Thanh toán', w: '1.1fr' },
        { label: 'Issued', w: '0.9fr' }, { label: 'Activate by', w: '0.9fr' }]}
      rows={rows.map((i) => {
        const st = invStage(i)
        return [
          <button onClick={() => setOpen(i)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{i.code}</button>,
          <span className="truncate">{i.customer}</span>,
          <span className="truncate font-mono text-[11px] text-muted">{i.po}</span>,
          <span className="tabular-nums">{i.total.toLocaleString('en-US')} ₫</span>,
          <Pill tone={st.tone}>{st.en}</Pill>,
          <PayCell {...invPay(i)} />,
          <span className="tabular-nums text-muted">{i.issued}</span>,
          <span className="tabular-nums text-muted">{i.activateBy}</span>,
        ]
      })}
      minW={1280}
      total={rows.length}
    />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        A draft invoice whose PO expired at month end is <b className="text-muted">withdrawn from this list</b> — it never had legal force and granted
        nothing, so it is not an invoice to reconcile. The record stays on its PO and in the audit log.
      </p>
    </div>
  )
}
