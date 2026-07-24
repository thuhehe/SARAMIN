import { useState } from 'react'
import { cn } from '@/lib/utils'

/*
 * Interactive prototype of the lead → customer activation flow, embedded in the
 * Admin wireframe. Create a lead in CRM → win it → activate = create the account
 * → choose products → (Job Posting only) create the public company page.
 * Toggle the product cards in step 4 to see the branch change step 5.
 */

interface ActState {
  jobPosting: boolean
  resumeSearch: boolean
}
const INITIAL: ActState = { jobPosting: true, resumeSearch: false }

const PHASES: { g: string; lab: string }[] = [
  { g: 'CRM', lab: 'Lead' },
  { g: 'CRM', lab: 'Won' },
  { g: 'Account management', lab: 'Create account' },
  { g: 'Account management', lab: 'Choose products' },
  { g: 'Account management', lab: 'Company page' },
]

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']

function Pill({ tone, children }: { tone: 'muted' | 'ok' | 'warn' | 'info'; children: React.ReactNode }) {
  const tones = { muted: 'bg-canvas text-muted', ok: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700', info: 'bg-brand-soft text-brand' }
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
function Btn({ onClick, kind = 'default', children }: { onClick?: () => void; kind?: 'default' | 'primary' | 'good'; children: React.ReactNode }) {
  const kinds = { default: 'border-line bg-surface text-ink hover:border-ink/40', primary: 'border-brand bg-brand text-white hover:opacity-90', good: 'border-emerald-600 bg-emerald-600 text-white hover:opacity-90' }
  return <button onClick={onClick} className={cn('rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors', kinds[kind])}>{children}</button>
}
function Head({ title, sub, extra }: { title: string; sub: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight">{title}{extra}</h3>
      <p className="mt-0.5 text-[13px] text-muted">{sub}</p>
    </div>
  )
}

export function ActivationFlow() {
  const [phase, setPhase] = useState(0)
  const [s, setS] = useState<ActState>(INITIAL)
  const go = (n: number) => setPhase(Math.max(0, Math.min(PHASES.length - 1, n)))
  const toggle = (k: keyof ActState) => setS((prev) => {
    const next = { ...prev, [k]: !prev[k] }
    if (!next.jobPosting && !next.resumeSearch) next[k] = true // keep at least one
    return next
  })
  const reset = () => { setS(INITIAL); setPhase(0) }

  return (
    <div>
      {/* phase bar */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1.5 shadow-sm scroll-thin">
        {PHASES.map((p, i) => {
          const first = i === 0 || PHASES[i - 1].g !== p.g
          return (
            <div key={i} className="flex items-center">
              {first && <span className="px-2 text-[9px] font-bold uppercase tracking-wider text-faint whitespace-nowrap">{p.g}</span>}
              <button onClick={() => go(i)} className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors', i === phase ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-canvas/70')}>
                <span className={cn('grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold', i === phase ? 'bg-brand text-white' : i < phase ? 'bg-emerald-500 text-white' : 'bg-line text-muted')}>{i < phase ? '✓' : i + 1}</span>
                <span className="text-[12px] font-semibold whitespace-nowrap">{p.lab}</span>
              </button>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {phase === 0 && <StageLead />}
        {phase === 1 && <StageWon activate={() => go(2)} />}
        {phase === 2 && <StageAccount next={() => go(3)} />}
        {phase === 3 && <StageProducts s={s} toggle={toggle} next={() => go(4)} />}
        {phase === 4 && <StageCompanyPage s={s} />}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-l-2 border-brand bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-ink/75">
        <span>
          <b className="text-ink">One company record, growing up:</b>{' '}
          {s.jobPosting
            ? 'Lead → Won → create account → pick products → fill the company page → live to jobseekers.'
            : 'Lead → Won → create account → pick products → done (Resume Search only, no public page).'}
        </span>
        <button onClick={reset} className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Reset</button>
      </div>
    </div>
  )
}

function Pipeline({ activeStage }: { activeStage: 'Lead' | 'Won' }) {
  return (
    <div className="grid grid-cols-6 gap-2 overflow-x-auto">
      {STAGES.map((st) => {
        const here = st === activeStage
        const card = st === 'Lead' && activeStage === 'Lead' ? true : st === 'Won' && activeStage === 'Won'
        return (
          <div key={st} className="min-w-[92px] rounded-lg border border-line bg-canvas/40 p-2">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted">{st}</p>
            {card && (
              <div className={cn('rounded-md border bg-surface p-2', here && activeStage === 'Won' ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-brand ring-1 ring-brand-soft')}>
                <p className="text-[11px] font-semibold">Cty Vạn Phát</p>
                <p className="text-[10px] text-muted">133.5M ₫</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StageLead() {
  return (
    <>
      <Chrome kind="Admin" url="admin/crm/customers" />
      <div className="p-6">
        <Head title="Create the lead" sub="A lead is just a company you’re tracking. No login, not shown to jobseekers — internal sales data only." />
        <Pipeline activeStage="Lead" />
        <div className="mt-4 rounded-xl border border-line p-4">
          <p className="mb-2 text-[12px] font-bold">Customer record <span className="font-normal text-faint">(CRM — internal only)</span></p>
          {[['Legal name', 'Công ty TNHH Vạn Phát'], ['Tax code · Industry', '0312xxxxxx · Healthcare'], ['Contact', 'Ms. Lan · 09xx xxx xxx']].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-line-soft py-1.5 text-[12px] last:border-0"><span className="text-muted">{k}</span><span className="font-medium">{v}</span></div>
          ))}
        </div>
        <Note tone="warn"><span>☝️</span><div><b>Always created here first</b> — the CRM is the single front door, even for a company that arrives already big.</div></Note>
      </div>
    </>
  )
}

function StageWon({ activate }: { activate: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/crm/customers" />
      <div className="p-6">
        <Head title="Deal won → now a real customer" sub="Drag the deal to Won. Nothing is provisioned automatically — you now activate the customer." extra={<Pill tone="ok">Won</Pill>} />
        <Pipeline activeStage="Won" />
        <Note tone="good"><span>🎉</span><div><b>Won.</b> The company is now a real customer. Click <b>Activate customer</b> to create its account.</div></Note>
        <div className="mt-4"><Btn kind="good" onClick={activate}>⚡ Activate customer →</Btn></div>
      </div>
    </>
  )
}

function StageAccount({ next }: { next: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/accounts/new" />
      <div className="p-6">
        <Head title="Create the account & connect to the lead" sub="The account is the same company record, pre-filled from CRM — nothing is retyped. This is where the company gets a login." />
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-[11px] font-medium text-muted">Company</p>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[12.5px]">Công ty TNHH Vạn Phát <span className="ml-auto text-[10.5px] text-violet-600">🔗 from CRM #VP-1042</span></div>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium text-muted">Account owner (login email)</p>
            <div className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-faint">hr@vanphat.vn</div>
          </div>
        </div>
        <Note tone="info"><span>🔗</span><div>The account links back to the CRM customer, so sales history + account stay in sync — one source of truth.</div></Note>
        <div className="mt-4"><Btn kind="primary" onClick={next}>Create account → choose products →</Btn></div>
      </div>
    </>
  )
}

function StageProducts({ s, toggle, next }: { s: ActState; toggle: (k: keyof ActState) => void; next: () => void }) {
  return (
    <>
      <Chrome kind="Admin" url="admin/accounts/vanphat/products" />
      <div className="p-6">
        <Head title="What did they buy?" sub="This choice decides the rest. Job Posting needs a public company page; Resume Search does not." />
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductCard on={s.jobPosting} onClick={() => toggle('jobPosting')} icon="📢" title="Job Posting" desc="Post jobs shown to jobseekers. Profile is public." req="→ Requires a Company Detail Page" reqTone="warn" />
          <ProductCard on={s.resumeSearch} onClick={() => toggle('resumeSearch')} icon="🔍" title="Resume Search" desc="Search & contact candidates. Nothing shown to jobseekers." req="→ No company page needed" reqTone="ok" />
        </div>
        <Note tone={s.jobPosting ? 'warn' : 'good'}><span>{s.jobPosting ? '⚠️' : '✓'}</span><div>
          {s.jobPosting ? <>Job Posting is on → the next step is <b>required</b>: create the public Company Detail Page.</> : <>Resume Search only → <b>no public page needed.</b> Activation finishes here.</>}
        </div></Note>
        <div className="mt-4"><Btn kind="primary" onClick={next}>{s.jobPosting ? 'Next: company page →' : 'Finish activation →'}</Btn></div>
      </div>
    </>
  )
}
function ProductCard({ on, onClick, icon, title, desc, req, reqTone }: { on: boolean; onClick: () => void; icon: string; title: string; desc: string; req: string; reqTone: 'warn' | 'ok' }) {
  return (
    <button onClick={onClick} className={cn('rounded-xl border-2 p-4 text-left transition-colors', on ? 'border-brand bg-brand-soft' : 'border-line hover:border-brand/50')}>
      <div className="flex items-center justify-between">
        <span className="text-[20px]">{icon}</span>
        <span className={cn('grid h-5 w-5 place-items-center rounded-md text-[11px]', on ? 'bg-brand text-white' : 'border border-line text-transparent')}>✓</span>
      </div>
      <p className="mt-2 text-[14px] font-bold">{title}</p>
      <p className="text-[11.5px] text-muted">{desc}</p>
      <p className={cn('mt-2 text-[11px] font-bold', reqTone === 'warn' ? 'text-amber-600' : 'text-emerald-600')}>{req}</p>
    </button>
  )
}

function StageCompanyPage({ s }: { s: ActState }) {
  if (!s.jobPosting) {
    return (
      <>
        <Chrome kind="Admin" url="admin/accounts/vanphat" />
        <div className="p-6">
          <Head title="Done — no company page needed" sub="Resume Search only. The account can search candidates immediately; nothing is published to jobseekers." />
          <div className="rounded-xl border border-dashed border-line py-8 text-center">
            <div className="text-[26px]">🔍✓</div>
            <p className="mt-2 text-[13px] font-semibold">Company detail page skipped</p>
            <p className="mx-auto mt-1 max-w-[42ch] text-[12px] text-muted">Vạn Phát stays invisible to jobseekers — no public profile required. Account is ready to use.</p>
          </div>
          <Note tone="good"><span>✓</span><div>They can add Job Posting later — that is when the company page becomes required.</div></Note>
        </div>
      </>
    )
  }
  return (
    <>
      <Chrome kind="Admin" url="admin/companies/vanphat/profile" />
      <div className="p-6">
        <Head title="Create the company detail page" sub="Because they post jobs, fill the public profile jobseekers will see." extra={<Pill tone="warn">Required</Pill>} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            {[['Display name', 'Vạn Phát Healthcare'], ['Logo · Size', 'VP · 200–500 staff'], ['About', 'Leading private healthcare group…'], ['Benefits', 'Insurance, 13th salary']].map(([k, v]) => (
              <div key={k}><p className="mb-1 text-[11px] font-medium text-muted">{k}</p><div className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-faint">{v}</div></div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-faint">Jobseeker view →</p>
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="h-14 bg-gradient-to-r from-brand to-violet-500" />
              <div className="-mt-6 px-4 pb-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl border-2 border-surface bg-surface text-[16px] font-bold text-brand shadow">VP</div>
                <p className="mt-2 text-[13px] font-bold">Vạn Phát Healthcare</p>
                <p className="text-[11px] text-faint">Healthcare · HCMC · 200–500 staff</p>
                <p className="mt-2 text-[11.5px] text-muted">Leading private healthcare group in HCMC, hiring across nursing and operations.</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between rounded-md border border-line px-2.5 py-1.5 text-[11px]"><span>Registered Nurse</span><span className="text-faint">HCMC</span></div>
                  <div className="flex justify-between rounded-md border border-line px-2.5 py-1.5 text-[11px]"><span>Clinic Operations Lead</span><span className="text-faint">HCMC</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Note tone="info"><span>🔗</span><div>Same record throughout: <b>CRM #VP-1042 → account → public page</b>. One source of truth.</div></Note>
      </div>
    </>
  )
}
