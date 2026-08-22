import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { ScreenNavCtx, useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import { POS, PO_TONE, QUOTE_CATALOG, VAT_RATE, draftInvOf, poDraftBtn, poExpiry, poLive, poNext, poStage, poStep } from '@/pages/admin/data/sales'
import type { Po } from '@/pages/admin/data/sales'
import { vnWords } from '@/pages/admin/lib/fmt'
import { PayCell } from '@/pages/admin/screens/sales/_shared'
import { InvoicePdfModal } from '@/pages/admin/screens/sales/invoicePdf'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

function PoDetail({ po, onBack }: { po: Po; onBack: () => void }) {
  useDetailCrumb(po.code, onBack)
  /* Only one document opens from here now: the draft VAT invoice. The PO itself is
     printed in full further down the page, so a viewer for it was a second copy of
     something already on screen. */
  const [draftPdf, setDraftPdf] = useState(false)
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
        { label: 'Thanh toán', w: '1.1fr' },
        { label: 'Issued', w: '0.8fr' }, { label: 'Expires', w: '0.9fr' },
      ]}
      rows={POS.map((p) => [
        <button onClick={() => setOpen(p)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{p.code}</button>,
        <span className="truncate">{p.customer}</span>,
        <button onClick={() => goTo('admin-quotes', p.quote)} className="min-w-0 truncate text-left font-mono text-[11px] text-brand hover:underline">{p.quote}</button>,
        <span className="tabular-nums">{p.total.toLocaleString('en-US')} ₫</span>,
        <Pill tone={PO_TONE[poStep(p)]}>{poStage(poStep(p)).en}</Pill>,
        <PayCell paidAt={p.paidAt} poIssued={p.issued} />,
        <span className="tabular-nums text-muted">{p.issued}</span>,
        <span className={cn('tabular-nums', poLive(poStep(p)) ? 'font-medium text-ink/80' : 'text-faint')}>{poExpiry(p)}</span>,
      ])}
      minW={1240}
    />
  )
}
