import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { COMPANIES, coId, coLabel } from '@/pages/admin/data/companies'
import { programmeFor, qtyByProduct, tierPct } from '@/pages/admin/data/products'
import { DISCOUNT_MODES, NEWCHURN_MAX_QTY, NEWCHURN_PCT, QUOTE_CATALOG, SPECIAL_LEADER_MAX, VAT_RATE, addonOrphans, apprRole, catForMode, defaultMode, fieldCls, lineTotal, modesFor, optionTotals, selfApproves } from '@/pages/admin/data/sales'
import type { DiscountMode, QLine, QOption } from '@/pages/admin/data/sales'
import { SALES_PERSONAS, SALES_ROLE_LABEL } from '@/pages/admin/data/salesOrg'
import type { SalesPersona } from '@/pages/admin/data/salesOrg'
import { daysLeft, endOfMonth, vnWords } from '@/pages/admin/lib/fmt'
import { QuoteCompanyCard } from '@/pages/admin/screens/sales/_shared'
import { InfoBit, Section } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

/** `company` pre-selects the record — set when opened from a company detail page,
    left empty when opened from the Quotations list. */
export function NewQuotationModal({ onClose, company: initialCompany = '' }: { onClose: () => void; company?: string }) {
  const today = '29/07/2026'
  const [company, setCompany] = useState(initialCompany)
  const [seq, setSeq] = useState(0)
  const [options, setOptions] = useState<QOption[]>([
    { id: 1, lines: [{ cat: 1, qty: 1, price: QUOTE_CATALOG[1].price, disc: 0, gift: false }, { cat: 1, qty: 1, price: 0, disc: 0, gift: true }], recommended: true, optDisc: 0, fixed: 0 },
    { id: 2, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }, { cat: 0, qty: 1, price: 0, disc: 0, gift: true }], recommended: false, optDisc: 0, fixed: 0 },
  ])

  const co = COMPANIES.find((c) => c.name === company)

  /* ── One discount MODE per quotation ────────────────────────────────────────
     Four modes, and the customer's status decides which are on offer. They are
     exclusive: two programmes layered on one quotation produce a total nobody
     planned and an approver signing off on half of it.

     What each mode does to the three inputs is declared in DISCOUNT_MODES, not
     re-derived here — twelve rules spread through a form is how they drift. */
  /* WHO is writing this quotation. In the product this is simply the signed-in
     user; here it is a picker so the self-approval rules can be seen working —
     the same personas the Customers and Quotations lists use. */
  const [creator, setCreator] = useState<SalesPersona>(SALES_PERSONAS[0])
  const [mode, setMode] = useState<DiscountMode>('newchurn')
  const allowed = modesFor(co?.account)
  /* Picking a company resets the mode to that status's default, and re-picking a
     mode wipes every figure the previous one left behind. Carrying 50% over into
     a Special offer would mean the rep approves a number they never typed. */
  useEffect(() => {
    if (co) setMode(defaultMode(co.account))
  }, [co?.name, co?.account])
  /* Products reset when trial is involved: a trial quotation cannot hold a
     full-price SKU and a normal one cannot hold a trial SKU, so leaving the
     previous selection would produce a line the mode does not permit. Clearing the
     DISCOUNTS is not done here — see the effect below, which has to catch the
     automatic mode change on picking a company as well as this manual one. */
  const pickMode = (m: DiscountMode) => {
    setMode(m)
    if ((m === 'trial') === (mode === 'trial')) return
    const firstOf = catForMode(m)[0].i
    setOptions((os) => os.map((o) => ({
      ...o,
      lines: o.lines.map((l) => ({ ...l, cat: firstOf, price: l.gift ? 0 : QUOTE_CATALOG[firstOf].price })),
    })))
  }
  const rule = DISCOUNT_MODES[mode]
  const promo = programmeFor(co?.account)

  /* Rule-driven fields are recomputed whenever the company, the mode or any
     quantity moves — those are the only inputs the rules read. Keyed on a
     signature so writing the result back cannot re-trigger the effect. */
  const qtySig = options.map((o) => o.lines.map((l) => `${l.gift ? 'g' : 'p'}${l.qty}`).join(',')).join('|')
  /* A mode change WIPES every discount figure before the new rules run. This has to
     live here rather than in the click handler, because the mode also changes on
     its own the moment a company is picked — and without the wipe a New & Churn
     50% survived into an Existing quotation on any option the rep did not retype.
     A rate the rep never chose, sitting under an approval band, is exactly the bug
     the mode switch exists to prevent. */
  const prevMode = useRef(mode)
  useEffect(() => {
    const switched = prevMode.current !== mode
    prevMode.current = mode
    setOptions((os) => {
      let changed = false
      const next = os.map((o0) => {
        const o = switched ? { ...o0, optDisc: 0, fixed: 0, lines: o0.lines.map((l) => ({ ...l, disc: 0 })) } : o0
        if (switched) changed = true
        // Line %: the volume tiers under Existing, otherwise locked at 0.
        const totals = qtyByProduct(o.lines)
        const lines = o.lines.map((l) => {
          const d = rule.line === 'auto' && !l.gift && promo?.tiers ? tierPct(promo, totals.get(l.cat) ?? 0) : 0
          if (rule.line === 'free' || d === l.disc) return l
          changed = true
          return { ...l, disc: d }
        })
        // Order %: the 50%-with-a-cap rule under New & Churn, otherwise untouched
        // when free, otherwise 0.
        let od = o.optDisc
        if (rule.order === 'auto') {
          const withinCap = o.lines.every((l) => l.gift || l.qty <= NEWCHURN_MAX_QTY)
          od = withinCap ? NEWCHURN_PCT : 0
        } else if (rule.order === 'off') od = 0
        if (od !== o.optDisc) changed = true
        const fx = rule.fixed === 'off' ? 0 : o.fixed
        if (fx !== o.fixed) changed = true
        return changed ? { ...o, lines, optDisc: od, fixed: fx } : o0
      })
      return changed ? next : os
    })
  }, [mode, promo, qtySig])

  /** The line that costs the customer the 50%, when there is one. */
  const capBreaches = rule.order === 'auto'
    ? options.flatMap((o, oi) => o.lines.map((l, li) => ({ oi, li, l })).filter((x) => !x.l.gift && x.l.qty > NEWCHURN_MAX_QTY))
    : []

  /* ── Approval ───────────────────────────────────────────────────────────────
     ONLY the order-level % under the Existing programme routes for approval, and
     it routes on the highest rate in the document. A Special offer does not: the
     rep is trusted to set it and owns it, which is the difference between the two
     modes. A fixed amount never routes either — it is a voucher, agreed
     elsewhere, not a rate the rep invented. */
  /* Routed on the HIGHEST band across the options, not per option: the customer
     picks one and the approver has to be able to sign off on the worst case. So a
     document with one option at 8% and another at 18% goes to the manager, and the
     lead never sees it — two approvals on one document that offers a choice would
     mean approving a price the customer may never take. */
  const perOption = rule.approves ? options.map((o) => (o.optDisc > 0 ? apprRole(o.optDisc) : null)) : []
  const orderPct = rule.approves ? Math.max(0, ...options.map((o) => o.optDisc)) : 0
  const required = orderPct === 0 ? null : apprRole(orderPct)
  /* The creator's own seniority can waive it entirely — see selfApproves. */
  const waived = !!required && selfApproves(creator.role, required)
  const approver = waived ? null : required
  /** True when the options disagree and the document escalated because of it. */
  const escalated = required === 'manager' && perOption.some((r) => r === 'lead')

  const everyOptionPaid = options.every((o) => o.lines.some((l) => !l.gift && lineTotal(l) > 0))
  /* An add-on rides on a job line in the SAME option — alone it sells a premium
     position for a job that does not exist on the order. */
  const orphans = addonOrphans(options)
  const valid = !!co && everyOptionPaid && orphans.length === 0

  const patch = (oid: number, li: number, d: Partial<QLine>) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.map((l, i) => (i === li ? { ...l, ...d } : l)) } : o)))
  const addLine = (oid: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: [...o.lines, { cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }] } : o)))
  const delLine = (oid: number, li: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.filter((_, i) => i !== li) } : o)))
  const addOption = () =>
    setOptions((os) => (os.length >= 3 ? os : [...os, { id: Math.max(...os.map((o) => o.id)) + 1, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }], recommended: false, optDisc: 0, fixed: 0 }]))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[1000px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New quotation · Báo giá</p>
            <p className="text-[11px] text-muted">Bilingual VN/EN proposal. 1–3 priced options in one document — the customer picks one.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="max-h-[74vh] space-y-3.5 overflow-y-auto p-5">
          {/* 1 · header — every value is derived, so it reads as INFORMATION rather
              than as fields the rep might think they should fill in. */}
          <Section title="1 · Document header — auto" className="mt-0" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-4">
            <InfoBit label="Số báo giá / Quotation no." value={`QUO-00991${seq}-07-2026`} mono hint="Gapless sequence" />
            <InfoBit label="Ngày báo giá / Proposal date" value={today} />
            <InfoBit label="Ngày hết hạn / Expiry date" value={endOfMonth(today)} hint={`cuối tháng · còn ${daysLeft(today, today)} ngày`} />
            {/* A field only in the mock: in the product this is the signed-in user
                and is not choosable. It is here because the creator's role decides
                whether the discount needs approving at all. */}
            <label className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-faint">Báo giá bởi / Proposed by</span>
              <select
                value={creator.name}
                onChange={(e) => setCreator(SALES_PERSONAS.find((x) => x.name === e.target.value)!)}
                className="w-full cursor-pointer truncate bg-transparent text-[12.5px] font-medium text-ink outline-none"
              >
                {SALES_PERSONAS.map((x) => <option key={x.name} value={x.name}>{x.name} — {SALES_ROLE_LABEL[x.role]}</option>)}
              </select>
              <span className="block text-[10px] text-faint">quyết định có cần duyệt hay không</span>
            </label>
          </div>

          {/* 2 · client — pick the company, then confirm it from its own record.
              Billing data (legal name, MST, address) is READ from that record, so
              there is no separate VAT-billing form to keep in sync. */}
          <Section title="2 · Khách hàng / Client" />
          {/* Opened from a company record, the company is already decided — showing a
              picker there invites changing it, which is exactly what must not happen.
              The confirmation card below carries the details either way. */}
          {!initialCompany && (
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">
              Company<span className="text-rose-500"> *</span>
              <span className="ml-2 text-[10.5px] font-normal text-faint">— searchable by name or ID</span>
            </label>
            <select value={company} onChange={(e) => { setCompany(e.target.value); setSeq((s) => (s + 1) % 10) }} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink">
              <option value="">— Pick a company from the CRM —</option>
              {COMPANIES.map((c) => <option key={c.name} value={c.name}>{coLabel(c)} · {coId(c)}</option>)}
            </select>
          </div>
          )}
          {co
            ? <QuoteCompanyCard c={co} />
            : <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[11.5px] text-faint">Pick a company to confirm its details, contact and billing data.</p>}

          {/* The one discount decision on this screen, taken BEFORE the lines,
              because it decides which of the three discount cells the rep may even
              touch. Only the modes this customer's status qualifies for are shown —
              a New-customer offer greyed out on an Existing quotation would invite
              the question of how to unlock it. */}
          {co && (
            <div className="rounded-xl border border-line bg-canvas/40 px-3.5 py-3">
              <p className="mb-2 text-[11.5px] font-semibold text-ink">
                Chương trình chiết khấu
                <span className="ml-1.5 font-normal text-muted">— chọn một, áp dụng cho cả báo giá · khách hàng <b className="text-ink/75">{co.account}</b></span>
              </p>
              {/* Compact radio pills. The long explanation of each mode used to sit
                  here and in the rule strip below it — but the mode is chosen once,
                  and the three discount cells already show what they do by being
                  editable, rule-coloured or locked. The rules live in the
                  requirement; the form does not need to teach them every time. */}
              <div className="flex flex-wrap gap-1.5">
                {allowed.map((m) => {
                  const d = DISCOUNT_MODES[m]
                  const on = mode === m
                  return (
                    <button
                      key={m}
                      onClick={() => pickMode(m)}
                      title={d.hint}
                      className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors',
                        on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-surface text-muted hover:border-ink/30')}
                    >
                      <span className={cn('grid h-3 w-3 shrink-0 place-items-center rounded-full border', on ? 'border-brand' : 'border-line')}>
                        {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                      </span>
                      {d.vi}
                    </button>
                  )
                })}
              </div>

              {/* The cliff, named. "One line over and the whole 50% is gone" is the
                  rule reps get wrong, so it points at the exact line. */}
              {capBreaches.length > 0 && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] leading-relaxed text-rose-900">
                  <b>Mất toàn bộ {NEWCHURN_PCT}%.</b>{' '}
                  {capBreaches.map((x) => `Option ${x.oi + 1} · dòng ${x.li + 1} (${QUOTE_CATALOG[x.l.cat].vi}) có số lượng ${x.l.qty}`).join(' · ')} — vượt giới hạn {NEWCHURN_MAX_QTY}.
                  Chỉ cần một dòng vượt là cả đơn mất chiết khấu, không phải riêng dòng đó.
                  <br />
                  <span className="text-rose-800">Hai cách xử lý: giảm số lượng về {NEWCHURN_MAX_QTY}, hoặc chuyển sang <b>Chiết khấu theo số lượng</b> — chương trình dành cho đơn lớn.</span>
                </div>
              )}
              {mode === 'trial' && (
                <p className="mt-2 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
                  Báo giá dùng thử chỉ chọn được <b>sản phẩm dùng thử</b> — đây là các SKU có giá riêng, không phải chiết khấu, nên hóa đơn ghi đúng thứ đã bán với đúng giá đã bán. Mọi ô chiết khấu khoá ở 0.
                </p>
              )}
            </div>
          )}

          {/* 3 · options — the heart of it */}
          <Section title="3 · Options — alternatives, chọn MỘT" />
              {orphans.length > 0 && (
                <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
                  <span>⚠️</span>
                  <span>
                    {orphans.map((oi) => `Option ${oi + 1}`).join(' · ')} có dòng <b>Add-on</b> nhưng không có tin đăng nào để
                    gắn vào — thêm một dòng dịch vụ tin đăng vào cùng option, hoặc bỏ dòng add-on. Add-on bán được, nhưng
                    không bao giờ đứng một mình.
                  </span>
                </p>
              )}

          {options.map((o, oi) => {
            /* Three discount levels — see optionTotals for the order they stack in.
               Which of them the rep may touch is decided by the MODE, not here. */
            const { sub, pctCut, fixedCut, net, vat } = optionTotals(o)
            return (
              <div key={o.id} className={cn('rounded-xl border p-3', o.recommended ? 'border-brand/40 bg-brand-soft/30' : 'border-line')}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-semibold">
                    Option {oi + 1}
                    <span className="ml-1.5 font-normal text-muted">{o.lines.map((l) => QUOTE_CATALOG[l.cat].vi + (l.gift ? ' (Tặng)' : '')).join(' + ')}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-ink/80">
                      <input type="radio" name="rec" checked={o.recommended} onChange={() => setOptions((os) => os.map((x) => ({ ...x, recommended: x.id === o.id })))} className="h-3 w-3" />
                      Recommended
                    </label>
                    {options.length > 1 && (
                      <button onClick={() => setOptions((os) => os.filter((x) => x.id !== o.id))} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted hover:border-rose-300 hover:text-rose-600">Remove</button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-line">
                  <div className="grid min-w-[720px] gap-x-2 bg-canvas/60 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: '20px 2.2fr 0.7fr 0.5fr 1fr 0.6fr 1fr 24px' }}>
                    <span>#</span><span>Dịch vụ / Service</span><span>Đơn vị</span><span>SL</span><span className="text-right">Đơn giá</span><span className="text-right">Giảm</span><span className="text-right">Tổng giá</span><span />
                  </div>
                  {o.lines.map((l, li) => (
                    <div key={li} className="grid min-w-[720px] items-center gap-x-2 border-t border-line-soft px-2.5 py-1.5 text-[12px]" style={{ gridTemplateColumns: '20px 2.2fr 0.7fr 0.5fr 1fr 0.6fr 1fr 24px' }}>
                      <span className="text-faint">{li + 1}</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        {/* Trial SKUs and normal SKUs never appear in the same list —
                            a trial quotation offers only trial products, and vice versa. */}
                        <select value={l.cat} onChange={(e) => { const c = Number(e.target.value); patch(o.id, li, { cat: c, price: l.gift ? 0 : QUOTE_CATALOG[c].price }) }} className="min-w-0 flex-1 truncate rounded border border-line bg-surface px-1.5 py-1 text-[11.5px]">
                          {catForMode(mode).map(({ c, i }) => <option key={i} value={i}>{c.vi}</option>)}
                        </select>
                        {l.gift && <Pill tone="active">Tặng</Pill>}
                      </span>
                      <span className="text-[11px] text-muted">{QUOTE_CATALOG[l.cat].unitVi} / {QUOTE_CATALOG[l.cat].unitEn}</span>
                      <input type="number" min={1} value={l.qty} onChange={(e) => patch(o.id, li, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded border border-line bg-surface px-1 py-1 text-right text-[11.5px] tabular-nums" />
                      <input disabled={l.gift} value={l.gift ? '0' : l.price.toLocaleString('en-US')} onChange={(e) => patch(o.id, li, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} className={cn('w-full rounded border border-line px-1 py-1 text-right text-[11.5px] tabular-nums', l.gift ? 'bg-canvas text-faint' : 'bg-surface')} />
                      <span className="flex items-center justify-end gap-0.5">
                        {/* Read-only, always: the number is a consequence of the
                            quantity, and an editable box invites overwriting the
                            rule the customer was promised. */}
                        <input
                          type="number" min={0} max={100} value={l.disc}
                          disabled={l.gift || rule.line !== 'free'} readOnly={l.gift || rule.line !== 'free'}
                          onChange={(e) => patch(o.id, li, { disc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                          className={cn('w-11 rounded border px-1 py-1 text-right text-[11.5px] tabular-nums', l.gift ? 'border-line bg-canvas text-faint' : fieldCls(rule.line, l.disc > 0))} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className="text-right tabular-nums">{lineTotal(l).toLocaleString('en-US')}</span>
                      {o.lines.length > 1
                        ? <button onClick={() => delLine(o.id, li)} className="text-[12px] text-faint hover:text-rose-600">✕</button>
                        : <span />}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => addLine(o.id)} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">+ Line item</button>
                    <button onClick={() => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, lines: [...x.lines, { cat: x.lines[0].cat, qty: 1, price: 0, disc: 0, gift: true }] } : x)))} className="rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">+ Gift (Tặng)</button>
                  </div>
                  <div className="min-w-[360px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
                    {/* Every figure shows the arithmetic that produced it. The client has
                        to be able to confirm the ORDER the three discounts stack in —
                        percentage before amount, VAT on what is left — and a column of
                        bare totals cannot be checked against their own spreadsheet. */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-muted">
                        Tạm tính
                        <span className="ml-1 text-[10px] text-faint">Σ (SL × đơn giá × (1 − CK dòng))</span>
                      </span>
                      <span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span>
                    </div>
                    {/* Order-level %, on the subtotal and before VAT. Free, rule-driven
                        or locked at 0 depending on the mode — never a plain input. */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        Chiết khấu tổng đơn
                        <input
                          type="number" min={0} max={100} value={o.optDisc}
                          disabled={rule.order !== 'free'} readOnly={rule.order !== 'free'}
                          onChange={(e) => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, optDisc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)))}
                          className={cn('w-12 rounded border px-1 py-0.5 text-right text-[11.5px] tabular-nums', fieldCls(rule.order, o.optDisc > 0))} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {o.optDisc > 0 && <span className="block text-[10px] text-faint">{sub.toLocaleString('en-US')} × {o.optDisc}%</span>}
                        <span className={cn('tabular-nums', pctCut > 0 && 'text-rose-600')}>{pctCut > 0 ? '−' : ''}{pctCut.toLocaleString('en-US')} ₫</span>
                      </span>
                    </div>
                    {/* The client's "Voucher": a flat amount, not a percentage. It comes
                        off AFTER the percentage, so the two cannot be read as one. */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        Giảm số tiền
                        <input
                          type="text" inputMode="numeric" value={o.fixed ? o.fixed.toLocaleString('en-US') : '0'}
                          disabled={rule.fixed !== 'free'} readOnly={rule.fixed !== 'free'}
                          onChange={(e) => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, fixed: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))}
                          className={cn('w-24 rounded border px-1 py-0.5 text-right text-[11.5px] tabular-nums', fieldCls(rule.fixed, o.fixed > 0))} />
                        <span className="text-[10.5px] text-faint">₫</span>
                      </span>
                      <span className="shrink-0 text-right">
                        {/* Only ever visible when the cap actually bit — otherwise it is
                            noise on a line that already reads correctly. */}
                        {o.fixed > fixedCut && <span className="block text-[10px] text-rose-500">tối đa {(sub - pctCut).toLocaleString('en-US')}</span>}
                        <span className={cn('tabular-nums', fixedCut > 0 && 'text-rose-600')}>{fixedCut > 0 ? '−' : ''}{fixedCut.toLocaleString('en-US')} ₫</span>
                      </span>
                    </div>
                    {(pctCut > 0 || fixedCut > 0) && (
                      <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-line-soft pt-1">
                        <span className="min-w-0 text-muted">
                          Sau chiết khấu
                          <span className="ml-1 text-[10px] text-faint">tạm tính − CK tổng đơn − giảm tiền</span>
                        </span>
                        <span className="tabular-nums font-medium">{net.toLocaleString('en-US')} ₫</span>
                      </div>
                    )}
                    {/* VAT is charged on what is LEFT, never on the pre-discount figure —
                        the single most consequential line here, because getting it wrong
                        overcharges the customer on a filed invoice. */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 text-muted">
                        Thuế GTGT ({VAT_RATE}%)
                        <span className="ml-1 text-[10px] text-faint">{net.toLocaleString('en-US')} × {VAT_RATE}%</span>
                      </span>
                      <span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span>
                    </div>
                    <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{(net + vat).toLocaleString('en-US')} ₫</span></div>
                    <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(net + vat)}.</p>
                    {/* The formula in one line, for the client to sign off. It is stated
                        rather than inferred from the numbers above, because the ORDER is
                        the part that is genuinely open to disagreement. */}
                    <p className="mt-2 rounded-md border border-line bg-surface px-2 py-1.5 text-[10px] leading-relaxed text-muted">
                      <b className="text-ink/70">Công thức:</b> Tạm tính = Σ (SL × đơn giá × (1 − CK dòng)) → trừ <b>CK tổng đơn %</b> → trừ <b>giảm số tiền</b> (tối đa bằng phần còn lại) → <b>VAT tính trên số còn lại</b> → Tổng sau VAT. Làm tròn đến đồng ở từng bước.
                    </p>
                  </div>
                </div>

              </div>
            )
          })}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={addOption} disabled={options.length >= 3} className={cn('rounded-lg border px-3 py-1.5 text-[12px] font-medium', options.length >= 3 ? 'border-line text-faint' : 'border-brand/40 text-brand hover:bg-brand-soft')}>
              + Add option {options.length >= 3 && '(max 3)'}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Internal note — not printed</label>
            <textarea rows={2} placeholder="Why this pricing, what the customer asked for…" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
          </div>
        </div>

        {/* footer */}
        <div className="space-y-2 border-t border-line px-5 py-3">
          {/* One line, and it names the PERSON — "needs approval" leaves the rep
              guessing who to chase, which is how a quotation sits for three days. */}
          {approver && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900">
              Chiết khấu tổng đơn <b>{orderPct}%</b> → cần <b>{SALES_ROLE_LABEL[approver]}</b> duyệt trước khi gửi khách.
              {/* Why the lead was skipped, when the options disagreed. */}
              {escalated && <span className="text-amber-800"> Có option chỉ cần Sales lead, nhưng option cao nhất vượt {SPECIAL_LEADER_MAX}% nên <b>cả báo giá</b> trình Sales manager.</span>}
              <span className="text-amber-800"> Mức ≤ {SPECIAL_LEADER_MAX}% do Sales lead duyệt, trên {SPECIAL_LEADER_MAX}% do Sales manager duyệt. Chiết khấu theo bậc trên từng dòng và số tiền giảm cố định <b>không cần duyệt</b>. Sửa lại % sau khi đã duyệt sẽ <b>hủy phê duyệt</b> và phải trình lại.</span>
            </div>
          )}
          {/* The waiver, said out loud. A rep who sees no approval step needs to know
              it is because of who they are, not because the rule stopped applying. */}
          {waived && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] leading-relaxed text-emerald-900">
              Chiết khấu tổng đơn <b>{orderPct}%</b> — <b>không cần trình duyệt</b>. {creator.name} là <b>{SALES_ROLE_LABEL[creator.role]}</b>, mức này thuộc thẩm quyền của chính người lập báo giá.
              {creator.role === 'lead' && <span className="text-emerald-800"> Trên {SPECIAL_LEADER_MAX}% thì vẫn phải trình Sales manager.</span>}
            </div>
          )}
          {mode === 'special' && (
            <p className="text-[11.5px] leading-relaxed text-amber-700">
              <b>Ưu đãi đặc biệt — không có bước duyệt.</b> Cả ba mức đều do sales tự quyết, nên con số ở đây là trách nhiệm của người lập báo giá.
            </p>
          )}
          {!everyOptionPaid && <p className="text-[11.5px] text-rose-600">Every option needs at least one paid line — an option cannot be gifts only.</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
            <button disabled={!co} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', co ? 'border-line text-ink hover:border-ink/40' : 'border-line text-faint')}>Save draft</button>
            <button disabled={!valid} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', valid ? 'border-brand/40 text-brand hover:bg-brand-soft' : 'border-line text-faint')}>Preview PDF</button>
            <button disabled={!valid} className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', !valid ? 'bg-line' : approver ? 'bg-amber-600 hover:opacity-90' : 'bg-brand hover:opacity-90')}>
              {approver ? `Gửi ${SALES_ROLE_LABEL[approver]} duyệt →` : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
