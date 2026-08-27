import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { ScreenNavCtx, useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import { PAY_METHODS, PAY_TERMS, POS, PO_TONE, QUOTE_CATALOG, VAT_RATE, draftInvOf, poDraftBtn, poExpiry, poLive, poNext, poStage, poStep } from '@/pages/admin/data/sales'
import type { Po, PayMethod, PayTerms } from '@/pages/admin/data/sales'
import { vnWords } from '@/pages/admin/lib/fmt'
import { PayCell } from '@/pages/admin/screens/sales/_shared'
import { InvoicePdfModal } from '@/pages/admin/screens/sales/invoicePdf'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/* ── Edit PO — the THREE payment fields, and nothing else ──────────────────
 *
 * Everything a PO says about the deal — customer, product, quantity, price,
 * totals, dates — is printed on a document the customer holds a copy of. Editing
 * any of it after issue means two parties reading different POs under one number,
 * so the document is FROZEN: to change it, cancel and issue a new one.
 *
 * What stays editable is what was never on the document: how we agreed to be
 * paid, how the money actually arrives, and the day it landed. Those are our own
 * operational facts, they legitimately change after issue, and no copy of them
 * sits on the customer's side to disagree with.
 *
 * The dialog says so in one line rather than showing the frozen fields greyed
 * out — a form full of disabled inputs invites the question "why can't I?" on
 * every one of them.
 */
function EditPoModal({ po, onClose }: { po: Po; onClose: () => void }) {
  const [terms, setTerms] = useState<PayTerms>(po.payTerms ?? '100% in advance')
  const [otherTerms, setOtherTerms] = useState('')
  const [method, setMethod] = useState<PayMethod>(po.payMethod ?? 'Chuyển khoản')
  const [paidAt, setPaidAt] = useState(po.paidAt?.replace(/\./g, '/') ?? '')
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{children}</label>
  )
  const box = 'w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none focus:border-brand'
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-12">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-start justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">Sửa thông tin thanh toán</p>
            <p className="truncate font-mono text-[11px] text-muted">{po.code}</p>
          </div>
          <span className="cursor-pointer pl-3 text-faint" onClick={onClose}>✕</span>
        </div>

        <div className="space-y-3 p-4">
          <p className="rounded-md border border-line bg-canvas/50 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Chỉ <b className="font-semibold text-ink/80">3 mục thanh toán</b> sửa được. Nội dung trên chứng từ PO —
            khách hàng, sản phẩm, số lượng, đơn giá, tổng tiền, ngày phát hành — đã cố định vì khách đang giữ một bản
            giống hệt. Cần đổi những mục đó thì <b className="font-semibold text-ink/80">huỷ PO và phát hành PO mới</b>.
          </p>

          <div>
            <Label>Điều khoản thanh toán</Label>
            <select value={terms} onChange={(e) => setTerms(e.target.value as PayTerms)} className={box}>
              {PAY_TERMS.map((t) => <option key={t}>{t}</option>)}
            </select>
            {terms === 'Others' && (
              <input
                value={otherTerms}
                onChange={(e) => setOtherTerms(e.target.value)}
                placeholder="Ghi rõ điều khoản — VD: 30% tạm ứng, 70% trong 15 ngày"
                className={cn(box, 'mt-1.5 text-[12px] placeholder:text-faint')}
              />
            )}
          </div>

          <div>
            <Label>Phương thức thanh toán</Label>
            <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className={box}>
              {PAY_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <Label>Ngày thu tiền</Label>
            <input
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              placeholder="dd/mm/yyyy — để trống nếu chưa thu"
              className={cn(box, 'tabular-nums placeholder:text-faint')}
            />
            {/* The one field with a consequence outside this dialog, so it is stated
                where it is typed: Paid / Unpaid / Overdue are derived from this date
                and from nothing else. */}
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              Trạng thái <b className="text-ink/70">Paid · Unpaid · Overdue</b> được tính từ ngày này — không có ô trạng thái riêng để sửa.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-ink hover:bg-canvas">Huỷ</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Lưu</button>
        </div>
      </div>
    </div>
  )
}

function PoDetail({ po, onBack }: { po: Po; onBack: () => void }) {
  useDetailCrumb(po.code, onBack)
  /* Only one document opens from here now: the draft VAT invoice. The PO itself is
     printed in full further down the page, so a viewer for it was a second copy of
     something already on screen. */
  const [draftPdf, setDraftPdf] = useState(false)
  const [editPay, setEditPay] = useState(false)
  const poCo = COMPANIES.find((x) => x.name === po.co)
    ?? COMPANIES.find((x) => x.name === po.customer || x.legalName === po.customer || coLabel(x) === po.customer)
  const step = poStep(po)
  const cur = poStage(step)
  const next = poNext(step)
  const pack = QUOTE_CATALOG[po.product]
  const sub = Math.round(po.total / (1 + VAT_RATE / 100))
  const vat = po.total - sub
  const unit = Math.round(sub / po.qty)
  return (
    <div>

      {/* One status, one action. The four-status model — what each means, who acts
          and what it triggers — is documented in the requirement, not restated on
          screen every time a rep opens a PO. */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-canvas/40 px-3.5 py-2.5">
        <span className="flex flex-wrap items-center gap-2">
          <Pill tone={PO_TONE[step]}>{cur.en}</Pill>
          {/* An Active PO is running out of month, and that is the only thing on
              this bar the rep can still change the outcome of. */}
          {/* A draft invoice does not stop the clock: the PO still lapses at the
              end of its month unless the OFFICIAL invoice goes out. */}
          {poLive(step) && <span className="text-[11px] text-muted">Hết hạn <b className="text-ink/75">{poExpiry(po)}</b> — cuối tháng</span>}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* ONE button for the draft, on exactly the statuses where a draft is the
              live document. "Xuất" not "Xem": the PO is where a draft is PRODUCED,
              and this is now the only place it can be — the invoice screen shows
              the filed document, not the working one. */}
          {poDraftBtn(step) && (
            <button onClick={() => setDraftPdf(true)} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">
              Xuất hóa đơn nháp
            </button>
          )}
          {/* Once the official invoice exists it is the document worth opening, and
              it lives on its own screen. */}
          {step === 'invoiced' && (
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">
              Xem hóa đơn chính
            </button>
          )}
          {/* SALES steps only. Issuing the official invoice is Kế toán's act and it
              is taken on the invoice itself — that is where the document, its number
              and its signature live. A duplicate button here would let the fiscal
              document be created from a screen that does not show it. */}
          {next && !next.accounting && (
            <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">
              {next.label}
            </button>
          )}
          {next?.accounting && (
            <span className="text-[11.5px] text-muted">Đang chờ <b className="text-ink/75">Kế toán</b> xuất hóa đơn chính — thao tác trên hóa đơn.</span>
          )}
          {/* Available at EVERY step, including Expired: the money on a lapsed PO
              still arrives and still has to be recorded. Nothing it edits is on
              the document, so nothing it edits can be invalidated by expiry. */}
          <button onClick={() => setEditPay(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand">
            Sửa thông tin thanh toán
          </button>
        </div>
      </div>

      {/* No explanatory callouts on the record. The status pill, the expiry date
          beside it and the buttons already say what this PO is and what may be
          done to it; the rules behind them live in the requirement, not repeated
          on every record a rep opens. */}

      {/* document */}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        <p className="text-[18px] font-bold tracking-tight">{po.code}</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div className="text-[11.5px] leading-relaxed">
            <p className="font-bold text-ink">DAOUKIWOOM INNOVATION COMPANY LIMITED</p>
            <p className="text-ink/80">Level 12, 13 &amp; 14, AP Tower, 518B Dien Bien Phu,<br />Thanh My Tay Ward, HCMC<br />Ho Chi Minh City<br />Vietnam 700000</p>
            <p className="mt-0.5 text-ink/80">Mã số thuế: <span className="tabular-nums">0315421202</span></p>
          </div>
          <div className="text-right text-[11.5px] leading-relaxed">
            <p className="text-muted">Người nhận:</p>
            <p className="font-bold text-brand">{po.customer}</p>
            <p className="mt-1 text-ink/80">Mã số thuế: <span className="tabular-nums">{COMPANIES.find((c) => c.name === po.co)?.tax ?? '0318705749'}</span></p>
            {po.poNo && <p className="text-ink/80">Số PO của khách: <span className="font-mono">{po.poNo}</span></p>}
            <p className="mt-1 text-ink/80">Ngày phát hành: <b>{po.issued}</b></p>
            <p className="text-ink/80">Hết hạn: <b>{poExpiry(po)}</b></p>
            <p className="text-ink/80">Người bán: <b>{po.seller}</b></p>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto rounded-lg border border-line">
          <div className="grid min-w-[760px] gap-x-3 bg-ink px-3 py-2 text-[11px] font-semibold text-white" style={{ gridTemplateColumns: '28px 3fr 0.7fr 1fr 0.7fr 0.9fr 1fr' }}>
            <span>#</span><span>Sản phẩm</span><span className="text-right">Số lượng</span><span className="text-right">Giá</span><span className="text-right">Chiết khấu</span><span className="text-right">Thuế</span><span className="text-right">Tổng</span>
          </div>
          <div className="grid min-w-[760px] gap-x-3 border-t border-line px-3 py-2.5 text-[12px]" style={{ gridTemplateColumns: '28px 3fr 0.7fr 1fr 0.7fr 0.9fr 1fr' }}>
            <span className="text-faint">1</span>
            <span className="min-w-0">
              <p className="font-medium text-ink">{pack.vi}</p>
              <ol className="mt-1 ml-4 list-decimal text-[11px] leading-relaxed text-muted">
                {pack.feats.map((f) => <li key={f}>{f}</li>)}
              </ol>
            </span>
            <span className="text-right tabular-nums">{po.qty} {pack.unitVi}</span>
            <span className="text-right tabular-nums">{unit.toLocaleString('en-US')}</span>
            <span className="text-right tabular-nums">0%</span>
            <span className="text-right text-[11px] text-muted">Thuế GTGT {VAT_RATE}%</span>
            <span className="text-right tabular-nums">{sub.toLocaleString('en-US')}</span>
          </div>
        </div>

        {/* the client's screen stops at a pre-VAT line total; spelling the tax out
            removes the ambiguity about what the customer actually owes */}
        <div className="mt-3 ml-auto w-full max-w-[320px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
          <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
          <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng phải trả</span><span className="tabular-nums">{po.total.toLocaleString('en-US')} ₫</span></div>
          <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(po.total)}.</p>
        </div>
      </div>

      {/* The draft invoice this PO would produce — rendered by the SAME component
          the Invoice screen uses, in its draft form, so the rep is looking at the
          document that will actually exist rather than a preview of it. */}
      {draftPdf && <InvoicePdfModal inv={draftInvOf(po)} co={poCo} onClose={() => setDraftPdf(false)} />}
      {editPay && <EditPoModal po={po} onClose={() => setEditPay(false)} />}
    </div>
  )
}

export function AdminPOs() {
  const [open, setOpen] = useState<Po | null>(null)
  /* The source quotation belongs to the Quotations page, so the link navigates
     there rather than rendering a quotation inside Purchase order — that keeps the
     breadcrumb honest ("CRM / Quotations / QUO-…") and Back going to the right list. */
  const goTo = useContext(ScreenNavCtx)
  if (open) return <PoDetail po={open} onBack={() => setOpen(null)} />
  return (
    <ListPage
      tabs={[{ label: 'All', count: 64, active: true }, { label: 'Active', count: 9 }, { label: 'Draft invoice', count: 5 }, { label: 'Invoice requested', count: 3 }, { label: 'Invoice issued' }, { label: 'Expired' }]}
      cols={[
        { label: 'PO', w: '1.5fr' }, { label: 'Customer', w: '1.8fr' }, { label: 'Quotation', w: '1.4fr' },
        { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.9fr' },
        // Payment sits NEXT TO the document status, never merged into it: they are
        // two independent facts and a rep reads them together.
        //
        // THE THREE PAYMENT FIELDS LIVE HERE AND NOT ON THE DOCUMENT (2026-08-23).
        // Terms, method and collection date are how WE track the money; the PO is
        // the copy the customer holds. Putting a field that changes after issue on
        // a document that must not is how two sides end up holding different POs.
        { label: 'Điều khoản TT', w: '1.2fr' },
        { label: 'Phương thức TT', w: '1.1fr' },
        { label: 'Thanh toán · ngày thu', w: '1.3fr' },
        { label: 'Issued', w: '0.8fr' }, { label: 'Expires', w: '0.9fr' },
      ]}
      rows={POS.map((p) => [
        <button onClick={() => setOpen(p)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{p.code}</button>,
        <span className="truncate">{p.customer}</span>,
        <button onClick={() => goTo('admin-quotes', p.quote)} className="min-w-0 truncate text-left font-mono text-[11px] text-brand hover:underline">{p.quote}</button>,
        <span className="tabular-nums">{p.total.toLocaleString('en-US')} ₫</span>,
        <Pill tone={PO_TONE[poStep(p)]}>{poStage(poStep(p)).en}</Pill>,
        /* An em-dash, not a blank: a PO issued before these fields existed has no
           term recorded, which is a different thing from having none. */
        <span className={cn('truncate', p.payTerms ? 'text-ink/80' : 'text-faint')}>{p.payTerms ?? '—'}</span>,
        <span className={cn('truncate', p.payMethod ? 'text-ink/80' : 'text-faint')}>{p.payMethod ?? '—'}</span>,
        <PayCell paidAt={p.paidAt} poIssued={p.issued} />,
        <span className="tabular-nums text-muted">{p.issued}</span>,
        <span className={cn('tabular-nums', poLive(poStep(p)) ? 'font-medium text-ink/80' : 'text-faint')}>{poExpiry(p)}</span>,
      ])}
      minW={1560}
    />
  )
}
