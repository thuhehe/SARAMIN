import { useState } from 'react'
import { cn } from '@/lib/utils'

/*
 * Interactive prototype of the monetization flow, embedded in the Admin wireframe.
 * Sell (Quote → PO → Invoice → Payment) → payment auto-provisions quota on the
 * account → the company consumes it (post a job, unlock CVs). The entitlements
 * rail on the right updates live as you click through.
 */

const PRICE = { job: 15_000_000, search: 20_000_000 }
const TOTAL = Math.round((PRICE.job + PRICE.search) * 1.08)
const fmt = (n: number) => n.toLocaleString('en-US') + ' ₫'

interface FlowState {
  quote: 'Draft' | 'Sent' | 'Accepted'
  po: boolean
  invoice: boolean
  paid: boolean
  jobTotal: number
  jobLeft: number
  cvTotal: number
  cvLeft: number
  searchActive: boolean
  posted: string[]
  unlocked: Record<string, boolean>
}

const INITIAL: FlowState = {
  quote: 'Draft', po: false, invoice: false, paid: false,
  jobTotal: 10, jobLeft: 10, cvTotal: 100, cvLeft: 100,
  searchActive: false, posted: [], unlocked: {},
}

const CANDIDATES = [
  { id: 'c1', name: 'Trần Thị Mai', role: 'Registered Nurse · 4 yrs', phone: '0903 xxx 218', email: 'mai.***@email.com' },
  { id: 'c2', name: 'Lê Hoàng Nam', role: 'Clinic Operations · 6 yrs', phone: '0912 xxx 077', email: 'nam.***@email.com' },
  { id: 'c3', name: 'Phạm Quốc Anh', role: 'Lab Technician · 3 yrs', phone: '0938 xxx 445', email: 'anh.***@email.com' },
]

const PHASES: { g: string; lab: string }[] = [
  { g: 'Sell & get paid · Admin / CRM', lab: 'Quote' },
  { g: 'Sell & get paid · Admin / CRM', lab: 'Purchase order' },
  { g: 'Sell & get paid · Admin / CRM', lab: 'Invoice' },
  { g: 'Sell & get paid · Admin / CRM', lab: 'Payment' },
  { g: 'Provision · Admin / Account', lab: 'Auto-provision' },
  { g: 'Use the quota · Store / Company', lab: 'Post a job' },
  { g: 'Use the quota · Store / Company', lab: 'Resume search' },
]

function Pill({ tone, children }: { tone: 'draft' | 'sent' | 'ok' | 'warn' | 'bad'; children: React.ReactNode }) {
  const tones = {
    draft: 'bg-canvas text-muted',
    sent: 'bg-brand-soft text-brand',
    ok: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-rose-50 text-rose-700',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold', tones[tone])}>{children}</span>
}

function Chrome({ kind, url }: { kind: 'Admin' | 'Store'; url: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line bg-canvas/50 px-4 py-2.5 text-[12px]">
      <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', kind === 'Admin' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700')}>{kind}</span>
      <span className="font-semibold text-ink/70">{kind === 'Admin' ? 'Saramin · HQ Admin' : 'Saramin · Company site'}</span>
      <span className="ml-auto rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[11px] text-faint">{url}</span>
    </div>
  )
}

function Note({ tone, children }: { tone: 'info' | 'good' | 'warn'; children: React.ReactNode }) {
  const tones = { info: 'bg-brand-soft text-brand', good: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700' }
  return <div className={cn('mt-4 flex gap-2.5 rounded-lg px-3.5 py-3 text-[12.5px] leading-relaxed', tones[tone])}>{children}</div>
}

function LineItems() {
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-[12.5px] tabular-nums">
          <thead>
            <tr className="bg-canvas/60 text-[10.5px] uppercase tracking-wide text-muted">
              <th className="px-3 py-2 text-left font-bold">Product</th>
              <th className="px-3 py-2 text-left font-bold">Detail</th>
              <th className="px-3 py-2 text-right font-bold">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line"><td className="px-3 py-2">Job Posting — Pro</td><td className="px-3 py-2 text-muted">10 posting slots · 3 months</td><td className="px-3 py-2 text-right">{fmt(PRICE.job)}</td></tr>
            <tr className="border-t border-line"><td className="px-3 py-2">Resume Search — 6 months</td><td className="px-3 py-2 text-muted">Unlimited search · 100 CV unlocks</td><td className="px-3 py-2 text-right">{fmt(PRICE.search)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="mt-2 space-y-1 text-[12.5px] tabular-nums">
        <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{fmt(PRICE.job + PRICE.search)}</span></div>
        <div className="flex justify-between"><span className="text-muted">VAT 8%</span><span>{fmt(Math.round((PRICE.job + PRICE.search) * 0.08))}</span></div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-[14px] font-bold"><span>Total</span><span>{fmt(TOTAL)}</span></div>
      </div>
    </>
  )
}

function Meter({ pct }: { pct: number }) {
  const color = pct <= 0 ? 'bg-rose-500' : pct < 30 ? 'bg-amber-500' : 'bg-brand'
  return (
    <div className="h-[7px] overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full transition-all duration-300', color)} style={{ width: `${Math.max(0, pct)}%` }} />
    </div>
  )
}

export function MonetizationFlow() {
  const [phase, setPhase] = useState(0)
  const [s, setS] = useState<FlowState>(INITIAL)
  const patch = (p: Partial<FlowState>) => setS((prev) => ({ ...prev, ...p }))
  const go = (n: number) => setPhase(Math.max(0, Math.min(PHASES.length - 1, n)))

  const acceptQuote = () => patch({ quote: s.quote === 'Draft' ? 'Sent' : 'Accepted' })
  const pay = () => patch({ paid: true, searchActive: true, jobLeft: s.jobTotal, cvLeft: s.cvTotal })
  const postJob = () => s.jobLeft > 0 && patch({ jobLeft: s.jobLeft - 1, posted: [...s.posted, `Registered Nurse — Vạn Phát Clinic Q1 #${s.posted.length + 1}`] })
  const unlock = (id: string) => s.cvLeft > 0 && !s.unlocked[id] && patch({ cvLeft: s.cvLeft - 1, unlocked: { ...s.unlocked, [id]: true } })
  const reset = () => { setS(INITIAL); setPhase(0) }

  return (
    <div>
      {/* phase bar */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1.5 shadow-sm scroll-thin">
        {PHASES.map((p, i) => {
          const first = i === 0 || PHASES[i - 1].g !== p.g
          return (
            <div key={i} className="flex items-center">
              {first && <span className="px-2 text-[9px] font-bold uppercase tracking-wider text-faint whitespace-nowrap">{p.g.split('·')[1]}</span>}
              <button
                onClick={() => go(i)}
                className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors', i === phase ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-canvas/70')}
              >
                <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold', i === phase ? 'bg-brand text-white' : i < phase ? 'bg-emerald-500 text-white' : 'bg-line text-muted')}>{i < phase ? '✓' : i + 1}</span>
                <span className="text-[12px] font-semibold whitespace-nowrap">{p.lab}</span>
              </button>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* main screen */}
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          {phase === 0 && <PhaseQuote s={s} accept={acceptQuote} next={() => go(1)} />}
          {phase === 1 && <PhasePO s={s} confirm={() => patch({ po: true })} next={() => go(2)} />}
          {phase === 2 && <PhaseInvoice s={s} issue={() => patch({ invoice: true })} next={() => go(3)} />}
          {phase === 3 && <PhasePayment s={s} pay={pay} next={() => go(4)} />}
          {phase === 4 && <PhaseProvision s={s} next={() => go(5)} back={() => go(3)} />}
          {phase === 5 && <PhasePostJob s={s} post={postJob} next={() => go(6)} />}
          {phase === 6 && <PhaseSearch s={s} unlock={unlock} />}
        </div>

        {/* live entitlements rail */}
        <aside className="lg:sticky lg:top-3 h-max overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="border-b border-line bg-canvas/50 px-4 py-3">
            <p className="text-[13px] font-bold">Vạn Phát · Account</p>
            <p className="text-[11px] text-faint">entitlements (live)</p>
          </div>
          <div className="space-y-3.5 p-4">
            {!s.paid ? (
              <p className="px-1 py-2 text-center text-[12px] leading-relaxed text-faint">
                No products yet.<br />Quota appears here the moment the invoice is <b>paid</b> (step 4).
              </p>
            ) : (
              <>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between text-[12px]"><b>📢 Job posting</b><span className="font-bold tabular-nums">{s.jobLeft}<span className="font-normal text-faint">/{s.jobTotal}</span></span></div>
                  <Meter pct={(s.jobLeft / s.jobTotal) * 100} />
                  <p className="mt-1 text-[11px] leading-snug text-faint">{s.jobTotal - s.jobLeft} used · a slot is consumed when a job is published</p>
                </div>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between text-[12px]"><b>🔍 Resume search</b><Pill tone="ok">Active</Pill></div>
                  <Meter pct={(s.cvLeft / s.cvTotal) * 100} />
                  <p className="mt-1 text-[11px] leading-snug text-faint">{s.cvLeft}/{s.cvTotal} CV unlocks left · until 31/12/2026</p>
                </div>
                <p className="border-t border-line pt-3 text-[11px] leading-snug text-faint">Provisioned automatically from <b>INV-3390</b>. No manual product selection.</p>
              </>
            )}
          </div>
        </aside>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-l-2 border-brand bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-ink/75">
        <span>
          <b className="text-ink">The model in one line:</b> sales sell products (Quote → PO → Invoice) → the customer pays → payment <b>auto-provisions quota on the account</b> → the company spends it posting jobs and unlocking CVs. The product is chosen once, at purchase.
        </span>
        <button onClick={reset} className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Reset</button>
      </div>
    </div>
  )
}

/* ── phase screens ────────────────────────────────────────────────────────── */
function Head({ title, sub, extra }: { title: string; sub: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight">{title}{extra}</h3>
      <p className="mt-0.5 text-[13px] text-muted">{sub}</p>
    </div>
  )
}
function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex flex-wrap items-center gap-2.5">{children}</div>
}
function Btn({ onClick, kind = 'default', disabled, children }: { onClick?: () => void; kind?: 'default' | 'primary' | 'good'; disabled?: boolean; children: React.ReactNode }) {
  const kinds = { default: 'border-line bg-surface text-ink hover:border-ink/40', primary: 'border-brand bg-brand text-white hover:opacity-90', good: 'border-emerald-600 bg-emerald-600 text-white hover:opacity-90' }
  return <button onClick={onClick} disabled={disabled} className={cn('rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40', kinds[kind])}>{children}</button>
}

function PhaseQuote({ s, accept, next }: { s: FlowState; accept: () => void; next: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/crm/quotes/Q-2041" />
      <div className="p-6">
        <Head title="Quote" sub="Sales propose products + price. These two line items are exactly what will become the account’s quota later."
          extra={<Pill tone={s.quote === 'Accepted' ? 'ok' : s.quote === 'Sent' ? 'sent' : 'draft'}>{s.quote}</Pill>} />
        <LineItems />
        <Note tone="info"><span>🧾</span><div>A <b>Quote</b> is the offer. When the customer says yes it becomes a <b>Purchase Order</b> — their formal commitment to buy.</div></Note>
        <Actions>
          {s.quote !== 'Accepted'
            ? <Btn kind="primary" onClick={accept}>{s.quote === 'Draft' ? 'Send to customer' : 'Mark accepted by customer'} →</Btn>
            : <><Pill tone="ok">✓ Accepted</Pill><Btn kind="primary" onClick={next}>Next: Purchase order →</Btn></>}
        </Actions>
      </div>
    </>
  )
}

function PhasePO({ s, confirm, next }: { s: FlowState; confirm: () => void; next: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/crm/purchase-orders/PO-1188" />
      <div className="p-6">
        <Head title="Purchase order" sub="Created from the accepted quote — the customer’s formal commitment. Corporate finance requires it before we invoice."
          extra={<Pill tone={s.po ? 'ok' : 'draft'}>{s.po ? 'Accepted' : 'Draft'}</Pill>} />
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-[12.5px] tabular-nums">
            <thead><tr className="bg-canvas/60 text-[10.5px] uppercase tracking-wide text-muted"><th className="px-3 py-2 text-left font-bold">PO code</th><th className="px-3 py-2 text-left font-bold">Customer</th><th className="px-3 py-2 text-right font-bold">Total</th></tr></thead>
            <tbody><tr className="border-t border-line"><td className="px-3 py-2">PO-1188</td><td className="px-3 py-2">Công ty Vạn Phát</td><td className="px-3 py-2 text-right">{fmt(TOTAL)}</td></tr></tbody>
          </table>
        </div>
        <Note tone="info"><span>📄</span><div>PO ← from Quote Q-2041. Next we issue the <b>Invoice</b> (the legal VAT bill) against this PO.</div></Note>
        <Actions>{!s.po ? <Btn kind="primary" onClick={confirm}>Confirm PO →</Btn> : <><Pill tone="ok">✓ PO confirmed</Pill><Btn kind="primary" onClick={next}>Next: Invoice →</Btn></>}</Actions>
      </div>
    </>
  )
}

function PhaseInvoice({ s, issue, next }: { s: FlowState; issue: () => void; next: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/crm/invoices/INV-3390" />
      <div className="p-6">
        <Head title="Invoice" sub="The VAT e-invoice (hóa đơn điện tử) — legally required in Vietnam. Billed against PO-1188, due in 15 days."
          extra={<Pill tone={s.paid ? 'ok' : s.invoice ? 'sent' : 'draft'}>{s.paid ? 'Paid' : s.invoice ? 'Issued' : 'Draft'}</Pill>} />
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-[12.5px] tabular-nums">
            <thead><tr className="bg-canvas/60 text-[10.5px] uppercase tracking-wide text-muted"><th className="px-3 py-2 text-left font-bold">Invoice</th><th className="px-3 py-2 text-left font-bold">Due</th><th className="px-3 py-2 text-right font-bold">Total</th><th className="px-3 py-2 text-right font-bold">Collected</th></tr></thead>
            <tbody><tr className="border-t border-line"><td className="px-3 py-2">INV-3390</td><td className="px-3 py-2">15 days</td><td className="px-3 py-2 text-right">{fmt(TOTAL)}</td><td className="px-3 py-2 text-right">{fmt(s.paid ? TOTAL : 0)}</td></tr></tbody>
          </table>
        </div>
        <Note tone="warn"><span>🇻🇳</span><div>A licensed VN <b>e-invoice</b> is issued here — this is why Invoices are a first-class module, not just a receipt.</div></Note>
        <Actions>{!s.invoice ? <Btn kind="primary" onClick={issue}>Issue invoice →</Btn> : <><Pill tone="sent">Issued</Pill><Btn kind="primary" onClick={next}>Next: Payment →</Btn></>}</Actions>
      </div>
    </>
  )
}

function PhasePayment({ s, pay, next }: { s: FlowState; pay: () => void; next: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/crm/payments" />
      <div className="p-6">
        <Head title="Payment" sub="Record the customer’s payment against the invoice. This is the moment products get provisioned onto the account — automatically."
          extra={s.paid ? <Pill tone="ok">Recorded</Pill> : undefined} />
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-[12.5px] tabular-nums">
            <thead><tr className="bg-canvas/60 text-[10.5px] uppercase tracking-wide text-muted"><th className="px-3 py-2 text-left font-bold">Reference</th><th className="px-3 py-2 text-left font-bold">Method</th><th className="px-3 py-2 text-left font-bold">Invoice</th><th className="px-3 py-2 text-right font-bold">Amount</th></tr></thead>
            <tbody><tr className="border-t border-line"><td className="px-3 py-2">PAY-1042</td><td className="px-3 py-2">Bank transfer</td><td className="px-3 py-2">INV-3390</td><td className="px-3 py-2 text-right">{fmt(TOTAL)}</td></tr></tbody>
          </table>
        </div>
        {s.paid
          ? <><Note tone="good"><span>✅</span><div><b>Paid in full.</b> The account was provisioned — look at the entitlements panel → it now shows real quota. <b>Nobody selected products by hand.</b></div></Note><Actions><Btn kind="primary" onClick={next}>See what got provisioned →</Btn></Actions></>
          : <><Note tone="info"><span>💳</span><div>Recording this payment auto-grants the two purchased products as <b>quota on the account</b>.</div></Note><Actions><Btn kind="good" onClick={pay}>Record payment ₫ →</Btn></Actions></>}
      </div>
    </>
  )
}

function PhaseProvision({ s, next, back }: { s: FlowState; next: () => void; back: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/accounts/vanphat/entitlements" />
      <div className="p-6">
        <Head title="Account entitlements — auto-provisioned" sub="Account management for Vạn Phát. These entitlements were created from the paid order, not typed in by an admin." />
        {s.paid ? (
          <>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-[12.5px] tabular-nums">
                <thead><tr className="bg-canvas/60 text-[10.5px] uppercase tracking-wide text-muted"><th className="px-3 py-2 text-left font-bold">Product</th><th className="px-3 py-2 text-left font-bold">Source</th><th className="px-3 py-2 text-left font-bold">Granted</th><th className="px-3 py-2 text-right font-bold">Quota</th></tr></thead>
                <tbody>
                  <tr className="border-t border-line"><td className="px-3 py-2">Job Posting — Pro</td><td className="px-3 py-2 text-muted">INV-3390 (paid)</td><td className="px-3 py-2"><Pill tone="ok">Auto</Pill></td><td className="px-3 py-2 text-right">{s.jobLeft} / {s.jobTotal} slots</td></tr>
                  <tr className="border-t border-line"><td className="px-3 py-2">Resume Search</td><td className="px-3 py-2 text-muted">INV-3390 (paid)</td><td className="px-3 py-2"><Pill tone="ok">Auto</Pill></td><td className="px-3 py-2 text-right">{s.cvLeft} / {s.cvTotal} unlocks</td></tr>
                </tbody>
              </table>
            </div>
            <Note tone="good"><span>🔗</span><div><b>This is the key idea.</b> Products flow: <b>paid invoice → entitlements on the account</b>. Admin never re-picks a product; downstream screens just read this quota.</div></Note>
            <Actions><Btn kind="primary" onClick={next}>Now use it — post a job →</Btn></Actions>
          </>
        ) : (
          <><Note tone="warn"><span>⏳</span><div>Nothing provisioned yet — record the payment first (step 4).</div></Note><Actions><Btn onClick={back}>← Back to payment</Btn></Actions></>
        )}
      </div>
    </>
  )
}

function PhasePostJob({ s, post, next }: { s: FlowState; post: () => void; next: () => void }) {
  const none = s.jobLeft <= 0
  return (
    <>
      <Chrome kind="Store" url="company.saramin.vn/jobs/new" />
      <div className="p-6">
        <Head title="Post a job" sub="The company’s HR user posts a job. The form reads the account quota — no product picker. Publishing consumes one posting slot." />
        <div className="space-y-3">
          <Field label="Job title" value="Registered Nurse — Vạn Phát Clinic Q1" />
          <div className="flex gap-3"><Field label="Location" value="Quận 1, HCMC" /><Field label="Salary" value="15 – 20 triệu" /></div>
        </div>
        <Note tone={none ? 'warn' : 'info'}><span>{none ? '⛔' : '📢'}</span><div>
          {none ? <><b>No posting slots left (0/{s.jobTotal}).</b> Publishing is blocked until they buy more.</> : <>Posting slots on this account: <b>{s.jobLeft} / {s.jobTotal}</b>. Publishing uses <b>1 slot</b> — drawn automatically from what they bought.</>}
        </div></Note>
        <Actions>
          {none ? <><Btn disabled>Publish job</Btn><Btn kind="primary">Buy more slots</Btn></> : <Btn kind="good" onClick={post}>Publish job (−1 slot)</Btn>}
          <Btn onClick={next}>Go to resume search →</Btn>
        </Actions>
        {s.posted.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {s.posted.map((j, i) => <div key={i} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]"><span>{j}</span><Pill tone="ok">Active</Pill></div>)}
          </div>
        )}
      </div>
    </>
  )
}

function PhaseSearch({ s, unlock }: { s: FlowState; unlock: (id: string) => void }) {
  if (!s.searchActive) {
    return (
      <>
        <Chrome kind="Store" url="company.saramin.vn/talent-search" />
        <div className="p-6">
          <Head title="Resume search" sub="Search the CV database and contact candidates." />
          <Note tone="warn"><span>🔒</span><div><b>Resume Search is not active on this account.</b> It unlocks once the Resume Search product is purchased + paid.</div></Note>
          <Actions><Btn kind="primary">Buy Resume Search</Btn></Actions>
        </div>
      </>
    )
  }
  return (
    <>
      <Chrome kind="Store" url="company.saramin.vn/talent-search?q=nurse" />
      <div className="p-6">
        <Head title="Resume search" sub="The paid entitlement unlocked this screen. Search is free; each candidate’s contact costs 1 CV unlock." extra={<Pill tone="ok">Active</Pill>} />
        <div className="space-y-2.5">
          {CANDIDATES.map((c) => {
            const on = s.unlocked[c.id]
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-[14px]">🧑‍⚕️</span>
                <div className="min-w-0 flex-1">
                  <div className={cn('text-[13px] font-semibold', !on && 'select-none blur-[4px]')}>{c.name}</div>
                  <div className="text-[11.5px] text-muted">{c.role}</div>
                  <div className={cn('font-mono text-[11px] text-faint', !on && 'select-none blur-[4px]')}>{on ? `${c.phone} · ${c.email}` : '0900 000 000 · hidden'}</div>
                </div>
                {on ? <Pill tone="ok">Unlocked</Pill> : <Btn disabled={s.cvLeft <= 0} onClick={() => unlock(c.id)}>Unlock (−1)</Btn>}
              </div>
            )
          })}
        </div>
        <Note tone={s.cvLeft <= 0 ? 'warn' : 'info'}><span>🔍</span><div>
          {s.cvLeft <= 0 ? <><b>0 unlocks left.</b> Buy more to reveal further candidates.</> : <>CV unlocks remaining: <b>{s.cvLeft} / {s.cvTotal}</b>. Unlocking reveals name + phone + email and spends one credit.</>}
        </div></Note>
      </div>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1">
      <p className="mb-1 text-[11px] font-medium text-muted">{label}</p>
      <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink/80">{value}</div>
    </div>
  )
}
