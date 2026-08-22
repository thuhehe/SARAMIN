import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANIES, coId, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { QUOTE_CATALOG, QUOTE_TONE, SPECIAL_LEADER_MAX, VAT_RATE, apprPerson, apprRole } from '@/pages/admin/data/sales'
import type { Quote } from '@/pages/admin/data/sales'
import { SALES_ROLE_LABEL, teamBookOf } from '@/pages/admin/data/salesOrg'
import type { SalesPersona } from '@/pages/admin/data/salesOrg'
import { vnWords } from '@/pages/admin/lib/fmt'
import { QuoteCompanyCard } from '@/pages/admin/screens/sales/_shared'
import { QuotationPdfModal } from '@/pages/admin/screens/sales/quotationPdf'
import { InfoBit } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/* Quotation detail. The list stays scannable, so every exception lives here: the
   approval gate, a lapsed offer, a superseded version, and which option the
   customer actually accepted. Read-only — changes go through Edit, which reopens
   the builder, because a Sent quotation is immutable and revising it makes a v2. */
export function QuotationDetail({ q, persona, onBack, onCreatePO, onDuplicate }: { q: Quote; persona?: SalesPersona; onBack: () => void; onCreatePO: (c: Company) => void; onDuplicate?: (companyName: string) => void }) {
  useDetailCrumb(q.code, onBack)
  /* Resolve the quotation's company against the real records. `co` on a quotation
     is written as the legal name, and older rows carry only `customer` — so match
     on any of the names a company is known by. Without this the duplicate dialog
     opens on "— Chọn công ty —" for a quotation that plainly belongs to someone. */
  const co = COMPANIES.find((x) => x.name === q.co)
    ?? COMPANIES.find((x) => x.legalName === q.co || x.name === q.customer || x.legalName === q.customer || x.shortName === q.customer)
  /* Issue PO shows on every SENT quotation — that is the only state where an order
     can follow. It is disabled on a lapsed offer: the discounts and gifts expired
     with the validity date (T&C clause 2), so extend or re-issue as v2 first. */
  const canPO = q.status === 'Sent' && !q.lapsed
  /* A special discount gates SEND. Until it is approved the quotation is a Draft
     that cannot leave the building — which is the whole point of the request. */
  const pending = q.appr === 'pending' && q.special != null
  const rejected = q.appr === 'rejected'
  /** True when the signed-in persona is the one this request routed to. */
  const iAmApprover = !!(pending && persona && apprRole(q.special!) === persona.role
    && (persona.role === 'manager' || teamBookOf(persona.name).has(q.reqBy ?? '')))
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('')
  // One option per product listed, priced off the catalog so the arithmetic is real.
  /* Which option the customer bought is decided HERE, when the PO is raised —
     the quotation itself carries no per-option status. With one option there is
     nothing to ask; with several the rep must pick one, because an order copies
     exactly ONE option forward. */
  const [picking, setPicking] = useState(false)
  /* Duplicate ≠ revise. Revise makes v2 of THIS quotation and supersedes it —
     same deal, same company. Duplicate starts a brand-new quotation, on any
     company, with no link back beyond a "copied from" reference. Using duplicate
     where revise was meant leaves two live quotes on one deal. */
  const [duping, setDuping] = useState(false)
  /* Defaults to THIS quotation's company: re-quoting the same customer after one
     lapsed is the common case, and quoting a different company is the exception the
     rep opts into. Starting empty made every duplicate ask a question that already
     has an answer. */
  const [dupCo, setDupCo] = useState('')
  const [pdf, setPdf] = useState(false)
  /** what the dialog acts on: the rep's pick if they made one, else this company. */
  const dupTarget = dupCo || co?.name || ''
  /* Build ONE card per declared option. Deriving from q.products instead would
     render 2 cards for a quotation that says it has 3 — and the Issue-PO picker
     would then offer fewer choices than the customer was actually given. */
  const opts = Array.from({ length: Math.max(1, q.options) }, (_, i) => {
    const p = q.products[i % q.products.length]
    // Same rule as the printed document: lines drive the total. Quantity is never
    // back-solved from q.value, or the detail and the PDF disagree on the figures.
    const qty = 1
    const sub = qty * QUOTE_CATALOG[p].price
    const vat = Math.round(sub * VAT_RATE / 100)
    return { n: i + 1, p, qty, sub, vat, total: sub + vat }
  })
  return (
    <div>

      {/* ── Special-discount approval ────────────────────────────────────────
          Shown on the QUOTATION, because approving a percentage without the lines,
          the options and the customer in front of you is signing a number blind.
          The same bar serves both sides: the approver gets buttons, everyone else
          gets the status and who it is sitting with. */}
      {q.special != null && q.appr && (
        <div className={cn('mb-4 rounded-xl border px-3.5 py-3',
          q.appr === 'approved' ? 'border-emerald-200 bg-emerald-50'
            : q.appr === 'rejected' ? 'border-rose-200 bg-rose-50'
              : 'border-amber-300 bg-amber-50')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cn('text-[12.5px] font-semibold',
                q.appr === 'approved' ? 'text-emerald-900' : q.appr === 'rejected' ? 'text-rose-900' : 'text-amber-900')}>
                {q.appr === 'approved' ? '✓ ' : q.appr === 'rejected' ? '✕ ' : '⏳ '}
                Chiết khấu đặc biệt <b>{q.special}%</b> trên tổng đơn
                {q.appr === 'pending' && <> — chờ <b>{SALES_ROLE_LABEL[apprRole(q.special)]}</b> ({apprPerson(q.special, q.reqBy)}) duyệt</>}
                {q.appr === 'approved' && <> — đã duyệt</>}
                {q.appr === 'rejected' && <> — bị từ chối</>}
              </p>
              <p className={cn('mt-0.5 text-[11px] leading-relaxed',
                q.appr === 'approved' ? 'text-emerald-800' : q.appr === 'rejected' ? 'text-rose-800' : 'text-amber-800')}>
                {q.reqBy} đề nghị lúc {q.reqAt}.
                {q.appr !== 'pending' && q.apprBy && <> {q.apprBy} quyết định lúc {q.apprAt}, ở mức <b>{q.apprPct}%</b>.</>}
                {q.note && <> · “{q.note}”</>}
              </p>
              {q.apprReason && <p className="mt-1 rounded-md bg-white/70 px-2 py-1 text-[11px] leading-relaxed text-rose-900"><b>Lý do từ chối:</b> {q.apprReason}</p>}
              {/* The rule that makes an approval mean something. */}
              {q.appr === 'approved' && <p className="mt-1 text-[10.5px] text-emerald-800">Sửa lại % sẽ hủy phê duyệt này và phải trình lại — nếu vượt {SPECIAL_LEADER_MAX}% thì trình Sales manager.</p>}
            </div>

            {iAmApprover ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button onClick={() => setDecision('reject')} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-rose-700 hover:border-rose-400">Từ chối</button>
                <button onClick={() => setDecision('approve')} className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Duyệt {q.special}%</button>
              </div>
            ) : q.appr === 'pending' ? (
              <span className="shrink-0 text-[11px] text-amber-800">Bạn không phải người duyệt mức này.</span>
            ) : null}
          </div>

          {/* A rejection needs a reason; an approval does not. The rep can only act
              on "no" if they are told what would be a yes. */}
          {decision === 'reject' && (
            <div className="mt-2.5 rounded-lg border border-rose-200 bg-white px-2.5 py-2">
              <label className="mb-1 block text-[11px] font-medium text-rose-900">Lý do từ chối <span className="text-rose-500">*</span></label>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Mức nào thì duyệt được? Rep cần biết để chỉnh lại." className="w-full rounded-md border border-line px-2.5 py-1.5 text-[12px] outline-none focus:border-rose-400" />
              <div className="mt-1.5 flex justify-end gap-2">
                <button onClick={() => { setDecision(null); setReason('') }} className="rounded-md border border-line px-2.5 py-1 text-[11.5px] font-medium text-muted hover:border-ink/40">Hủy</button>
                <button disabled={!reason.trim()} className={cn('rounded-md px-3 py-1 text-[11.5px] font-semibold text-white', reason.trim() ? 'bg-rose-600 hover:opacity-90' : 'bg-line')}>Gửi từ chối</button>
              </div>
            </div>
          )}
          {decision === 'approve' && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white px-2.5 py-2 text-[11.5px] text-emerald-900">
              <span>Duyệt <b>{q.special}%</b> cho {q.customer}. Ghi lại người duyệt, thời điểm và mức đã duyệt — sau đó rep gửi được báo giá.</span>
              <span className="flex shrink-0 gap-2">
                <button onClick={() => setDecision(null)} className="rounded-md border border-line px-2.5 py-1 font-medium text-muted hover:border-ink/40">Hủy</button>
                <button className="rounded-md bg-emerald-600 px-3 py-1 font-semibold text-white hover:opacity-90">Xác nhận duyệt</button>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Báo giá / Quotation</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
            <span className="font-mono">{q.code}</span>
            <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>
          </h2>
          <p className="text-[11.5px] text-muted">{q.customer} · {q.options} options · giá trị {q.value.toLocaleString('en-US')} ₫</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* One action, not two: "preview" and "export" render the SAME document —
              the viewer is where the file is downloaded from, so a rep can never
              send a PDF they have not looked at. */}
          <button onClick={() => setPdf(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Xuất PDF / Export</button>
          {/* Available in EVERY status — the commonest use is re-quoting an expired
              or lost offer, so restricting it to live quotations would remove it
              exactly when it is most wanted. */}
          <button onClick={() => setDuping(true)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink/40">⧉ Nhân bản / Duplicate</button>
          {/* Sales declares "sent" — reps routinely deliver the PDF by Zalo or from
              their own mail client, so it cannot depend on our mailer firing. */}
          {q.status === 'Draft' && (
            <button
              disabled={pending || rejected}
              title={pending ? 'Chờ duyệt chiết khấu đặc biệt' : rejected ? 'Chiết khấu bị từ chối — chỉnh lại % rồi trình lại' : undefined}
              className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white', pending || rejected ? 'cursor-not-allowed bg-line' : 'bg-brand hover:opacity-90')}
            >
              Mark as sent
            </button>
          )}
          {q.status === 'Sent' && (
            <button
              onClick={() => { if (!canPO || !co) return; if (opts.length > 1) setPicking(true); else onCreatePO(co) }}
              disabled={!canPO}
              title={canPO ? (opts.length > 1 ? 'Chọn option khách đã chốt, rồi tạo PO' : 'Raise the sales order from this option') : `Offer lapsed ${q.expires} — extend validity or re-issue as v2 first`}
              className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold', canPO ? 'bg-brand text-white hover:opacity-90' : 'border border-line bg-canvas text-faint')}
            >
              Issue PO →
            </button>
          )}
        </div>
      </div>

      {q.lapsed && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-900">
          Offer lapsed — validity ended {q.expires}. Extend validity or re-issue as v2 before an order can be raised.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Ngày báo giá / Created" value={q.created} />
        <InfoBit label="Ngày hết hạn / Expires" value={q.expires} hint={q.lapsed ? 'lapsed' : q.expires === '—' ? 'not sent yet' : undefined} />
        <InfoBit label="Báo giá bởi / Proposed by" value={co?.owner ?? 'Nguyễn Thị Lan'} />
        <InfoBit label="Số option" value={String(q.options)} hint="alternatives, never summed" />
        {/* ONE option's total-after-VAT, never a sum: the accepted option once the
            customer decides, else the HIGHEST option. Deliberately not the
            "recommended" one — that swap is still an open question in the spec. */}
        <InfoBit label="Giá trị / Value" value={`${q.value.toLocaleString('en-US')} ₫`} hint={q.acceptedOpt ? 'accepted option' : 'highest option'} />
      </div>

      {co && <div className="mb-4"><QuoteCompanyCard c={co} /></div>}

      <p className="mb-2 text-[12.5px] font-semibold">Options</p>
      <div className="space-y-2">
        {opts.map((o) => (
          <div key={o.n} className="rounded-xl border border-line p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold">Option {o.n} <span className="font-normal text-muted">{QUOTE_CATALOG[o.p].vi}</span></p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-line">
              <div className="grid min-w-[520px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
                <span>#</span><span>Dịch vụ</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Tổng giá</span>
              </div>
              <div className="grid min-w-[520px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.4fr 0.7fr 0.5fr 1fr 1fr' }}>
                <span className="text-faint">1</span><span className="truncate">{QUOTE_CATALOG[o.p].vi}</span>
                <span className="text-[11px] text-muted">{QUOTE_CATALOG[o.p].unitVi}</span>
                <span className="tabular-nums">{o.qty}</span>
                <span className="text-right tabular-nums">{QUOTE_CATALOG[o.p].price.toLocaleString('en-US')}</span>
                <span className="text-right tabular-nums">{o.sub.toLocaleString('en-US')}</span>
              </div>
            </div>
            <div className="mt-2 ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
              <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{o.sub.toLocaleString('en-US')} ₫</span></div>
              <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{o.vat.toLocaleString('en-US')} ₫</span></div>
              <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{o.total.toLocaleString('en-US')} ₫</span></div>
              <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(o.total)}.</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Options are alternatives — no grand total exists, and reporting never sums them.</p>

      {duping && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[15px] font-bold">Nhân bản báo giá</p>
                <p className="text-[11px] text-muted">Tạo một báo giá MỚI từ {q.code} — số mới, ngày mới, trạng thái Nháp.</p>
              </div>
              <button onClick={() => setDuping(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>

            <div className="space-y-3.5 p-5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Báo giá cho công ty<span className="text-rose-500"> *</span></label>
                <select value={dupTarget} onChange={(e) => setDupCo(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
                  {!co && <option value="">— Chọn công ty —</option>}
                  {COMPANIES.map((c) => <option key={c.name} value={c.name}>{coLabel(c)} · {coId(c)}</option>)}
                </select>
                <p className="mt-1 text-[10.5px] text-faint">
                  {!dupTarget
                    ? 'Chọn công ty sẽ nhận bản báo giá mới.'
                    : dupTarget === co?.name
                      ? 'Giữ nguyên công ty của báo giá này — dùng khi báo lại sau khi bản cũ hết hạn hoặc bị từ chối. Đổi ở trên nếu muốn chào cho khách khác.'
                      : 'Khác công ty — dùng khi chào cùng gói cho khách khác. Thông tin xuất hóa đơn sẽ lấy theo công ty mới.'}
                </p>
              </div>

              <div className="rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
                <b className="text-ink/70">Không sao chép:</b> số báo giá, ngày báo giá, ngày hết hạn, trạng thái gửi, option khách đã chốt,
                và liên kết tới PO. Bản sao luôn bắt đầu ở <b className="text-ink/70">Nháp</b> với hạn <b className="text-ink/70">cuối tháng tạo</b>.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              <button onClick={() => setDuping(false)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Hủy</button>
              <button
                disabled={!dupTarget}
                onClick={() => { setDuping(false); onDuplicate?.(dupTarget) }}
                className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', dupTarget ? 'bg-brand hover:opacity-90' : 'bg-line')}
              >
                Tạo bản sao →
              </button>
            </div>
          </div>
        </div>
      )}

      {picking && co && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
              <div>
                <p className="text-[15px] font-bold">Khách đã chốt option nào?</p>
                <p className="text-[11px] text-muted">Một PO chỉ lấy được MỘT option. Các option còn lại không trở thành đơn hàng.</p>
              </div>
              <button onClick={() => setPicking(false)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
            </div>
            <div className="space-y-2 p-5">
              {opts.map((o) => (
                <button
                  key={o.n}
                  onClick={() => { setPicking(false); onCreatePO(co) }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-brand hover:bg-brand-soft/40"
                >
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink">Option {o.n}</span>
                    <span className="block truncate text-[11.5px] text-muted">{QUOTE_CATALOG[o.p].vi} · {o.qty} {QUOTE_CATALOG[o.p].unitVi}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[12.5px] font-semibold tabular-nums text-ink">{o.total.toLocaleString('en-US')} ₫</span>
                    <span className="block text-[10.5px] text-faint">đã gồm VAT {VAT_RATE}%</span>
                  </span>
                </button>
              ))}
              <p className="text-[10.5px] leading-relaxed text-faint">
                Option được chọn sẽ được sao nguyên sang PO — dòng hàng, số lượng, đơn giá, VAT và thông tin xuất hóa đơn.
                Không nhập lại gì.
              </p>
            </div>
          </div>
        </div>
      )}

      {pdf && <QuotationPdfModal q={q} co={co} onClose={() => setPdf(false)} />}
    </div>
  )
}
