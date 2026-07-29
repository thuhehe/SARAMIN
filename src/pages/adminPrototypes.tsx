/*
 * Admin page prototypes — realistic (mock-data) previews for the HQ Admin shell.
 *
 * Keyed by the nav item's `specId`. The wireframe's content area renders the
 * matching prototype when one exists, else falls back to the generic skeleton.
 * Everything here is mock content laid out to VN-market recruitment standards —
 * structure & data shape only, not final visual design.
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'

/* ── shared bits ──────────────────────────────────────────────────────────── */
type StatusTone = 'active' | 'pending' | 'expired' | 'rejected' | 'draft' | 'neutral' | 'open' | 'schedule' | 'closed'

const STATUS_TONE: Record<StatusTone, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  neutral: 'bg-sky-50 text-sky-700 border-sky-200',
  // job status model: Draft → Schedule → Open → Closed
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  schedule: 'bg-violet-50 text-violet-700 border-violet-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
}

function Pill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium', STATUS_TONE[tone])}>
      {children}
    </span>
  )
}

function Tab({ label, count, active }: { label: string; count?: number; active?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] transition-colors',
        active ? 'bg-brand-soft font-medium text-brand' : 'text-muted hover:bg-canvas/70',
      )}
    >
      {label}
      {count != null && (
        <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-brand text-white' : 'bg-canvas text-faint')}>{count}</span>
      )}
    </span>
  )
}

function TabBar({ tabs }: { tabs: { label: string; count?: number; active?: boolean }[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1 border-b border-line-soft pb-3">
      {tabs.map((t, i) => <Tab key={i} {...t} />)}
    </div>
  )
}

function RowAction({ children, tone }: { children: React.ReactNode; tone?: 'brand' | 'rose' | 'muted' }) {
  return (
    <button
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
        tone === 'brand'
          ? 'border-brand/30 bg-brand-soft text-brand hover:bg-brand hover:text-white'
          : tone === 'rose'
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white'
            : 'border-line text-muted hover:bg-canvas/70',
      )}
    >
      {children}
    </button>
  )
}

type Col = { label: string; w: string; align?: 'r' | 'c' }

function Table({ cols, rows, minW = 560 }: { cols: Col[]; rows: React.ReactNode[][]; minW?: number }) {
  const tmpl = cols.map((c) => c.w).join(' ')
  const alignCls = (a?: 'r' | 'c') => (a === 'r' ? 'text-right justify-end' : a === 'c' ? 'text-center justify-center' : '')
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div style={{ gridTemplateColumns: tmpl, minWidth: minW }} className="grid gap-x-5 bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {cols.map((c, i) => <span key={i} className={alignCls(c.align)}>{c.label}</span>)}
      </div>
      {rows.map((r, ri) => (
        <div key={ri} style={{ gridTemplateColumns: tmpl, minWidth: minW }} className="grid gap-x-5 items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]">
          {r.map((cell, ci) => (
            <span key={ci} className={cn('flex min-w-0 items-center gap-1.5 text-ink/80', alignCls(cols[ci]?.align))}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

/** `text` is optional — some lists carry no explanatory footnote, only pagination. */
function Footer({ text }: { text?: string }) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <p className="text-[11px] text-faint">{text}</p>
      <div className="flex gap-1">
        {['1', '2', '3', '…', '12'].map((p) => (
          <span key={p} className={cn('grid h-6 min-w-6 place-items-center rounded border px-1 text-[11px]', p === '1' ? 'border-brand bg-brand text-white' : 'border-line text-muted')}>{p}</span>
        ))}
      </div>
    </div>
  )
}

function ListPage({ tabs, cols, rows, footer, minW }: { tabs?: { label: string; count?: number; active?: boolean }[]; cols: Col[]; rows: React.ReactNode[][]; footer?: string; minW?: number }) {
  return (
    <div>
      {tabs && <TabBar tabs={tabs} />}
      <Table cols={cols} rows={rows} minW={minW} />
      <Footer text={footer} />
    </div>
  )
}

function StatCards({ cards, row }: { cards: { label: string; value: string; delta?: string; up?: boolean }[]; row?: boolean }) {
  return (
    <div className={cn('grid gap-3', row ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4')}>
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border border-line p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-faint">{c.label}</p>
          <p className="mt-1 text-[20px] font-bold tracking-tight tabular-nums">{c.value}</p>
          {c.delta && <p className={cn('mt-0.5 text-[11.5px] font-medium', c.up ? 'text-emerald-600' : 'text-rose-600')}>{c.up ? '▲' : '▼'} {c.delta}</p>}
        </div>
      ))}
    </div>
  )
}

function Bars({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-end gap-3" style={{ height: 140 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] font-medium text-muted tabular-nums">{d.value}{unit}</span>
            <div className="w-full rounded-t bg-brand/80" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 border-t border-line-soft pt-2">
        {data.map((d, i) => <span key={i} className="flex-1 text-center text-[10.5px] text-faint">{d.label}</span>)}
      </div>
    </div>
  )
}

/* ── Recruitment ──────────────────────────────────────────────────────────── */
type JobRow = { title: string; category: string; company: string; source: 'Company' | 'Admin'; status: StatusTone; statusLabel: string; exposure: 'On' | 'Off'; posted: string; deadline: string; views: number; saves: number; applicants: number }
const JOB_ROWS: JobRow[] = [
  { title: 'Senior Frontend Engineer (ReactJS)', category: 'CNTT - Phần mềm', company: 'FPT Software', source: 'Company', status: 'draft', statusLabel: 'Draft', exposure: 'Off', posted: '—', deadline: '31/08/2026', views: 0, saves: 0, applicants: 0 },
  { title: 'Kế toán tổng hợp', category: 'Kế toán - Kiểm toán', company: 'VNG Corporation', source: 'Company', status: 'schedule', statusLabel: 'Schedule', exposure: 'Off', posted: '01/09/2026', deadline: '20/09/2026', views: 0, saves: 0, applicants: 0 },
  { title: 'Digital Marketing Lead', category: 'Marketing - Truyền thông', company: 'Tiki', source: 'Admin', status: 'open', statusLabel: 'Open', exposure: 'On', posted: '15/07/2026', deadline: '15/09/2026', views: 1240, saves: 86, applicants: 42 },
  { title: 'Product Manager', category: 'Sản phẩm - Dự án', company: 'MoMo', source: 'Company', status: 'open', statusLabel: 'Open', exposure: 'On', posted: '05/07/2026', deadline: '05/09/2026', views: 890, saves: 54, applicants: 18 },
  { title: 'Nhân viên kinh doanh', category: 'Kinh doanh - Bán hàng', company: 'Thế Giới Di Động', source: 'Company', status: 'open', statusLabel: 'Open', exposure: 'Off', posted: '20/07/2026', deadline: '28/08/2026', views: 320, saves: 12, applicants: 7 },
  { title: 'Backend Engineer (Go)', category: 'CNTT - Phần mềm', company: 'Shopee', source: 'Company', status: 'closed', statusLabel: 'Closed', exposure: 'Off', posted: '01/04/2026', deadline: '01/07/2026', views: 2150, saves: 143, applicants: 61 },
  { title: 'Thực tập sinh Nhân sự', category: 'Nhân sự', company: 'Base.vn', source: 'Company', status: 'draft', statusLabel: 'Draft', exposure: 'Off', posted: '—', deadline: '—', views: 0, saves: 0, applicants: 0 },
]
/* The create form as a screen in its own right, so the "Create job (Admin)" spec
   page can show the form instead of the list it is reached from. Back returns to
   the list — the same thing it does inside the console. */
function AdminJobCreateStandalone() {
  const [backToList, setBackToList] = useState(false)
  if (backToList) return <AdminJobList />
  return <AdminJobCreate onBack={() => setBackToList(true)} />
}

function AdminJobList() {
  const [creating, setCreating] = useState(false)
  const [detail, setDetail] = useState<JobRow | null>(null)
  if (creating) return <AdminJobCreate onBack={() => setCreating(false)} />
  if (detail) return <AdminJobDetail job={detail} onBack={() => setDetail(null)} />
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[60ch] text-[11.5px] text-muted">HQ oversight of every job across all company accounts. Admin can also post a job on a company’s behalf.</p>
        <button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ New job</button>
      </div>
    <ListPage
      minW={1200}
      tabs={[{ label: 'All', count: 1248 }, { label: 'Draft', count: 8 }, { label: 'Schedule', count: 5, active: true }, { label: 'Open', count: 1180 }, { label: 'Closed', count: 58 }]}
      cols={[
        { label: 'Job title', w: '1.7fr' },
        { label: 'Category', w: '1fr' },
        { label: 'Company', w: '1.1fr' },
        { label: 'Created by', w: '0.8fr' },
        { label: 'Status', w: '0.9fr' },
        { label: 'Exposure', w: '0.7fr' },
        { label: 'Posted', w: '0.8fr', align: 'r' },
        { label: 'Expires', w: '0.8fr', align: 'r' },
        { label: 'Views', w: '0.6fr', align: 'r' },
        { label: 'Saves', w: '0.6fr', align: 'r' },
        { label: 'Applied', w: '0.7fr', align: 'r' },
      ]}
      rows={JOB_ROWS.map((r) => [
        <button onClick={() => setDetail(r)} className="min-w-0 text-left"><p className="truncate font-medium text-brand hover:underline">{r.title}</p></button>,
        <span className="truncate text-muted">{r.category}</span>,
        <span className="truncate">{r.company}</span>,
        <Pill tone={r.source === 'Admin' ? 'neutral' : 'draft'}>{r.source}</Pill>,
        <Pill tone={r.status}>{r.statusLabel}</Pill>,
        r.status === 'open'
          ? <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium', r.exposure === 'On' ? 'text-emerald-600' : 'text-slate-400')}><span className={cn('h-1.5 w-1.5 rounded-full', r.exposure === 'On' ? 'bg-emerald-500' : 'bg-slate-300')} />{r.exposure}</span>
          : <span className="text-[11.5px] text-faint">—</span>,
        <span className="tabular-nums text-muted">{r.posted}</span>,
        <span className="tabular-nums text-muted">{r.deadline}</span>,
        <span className="tabular-nums">{r.views.toLocaleString('en-US')}</span>,
        <span className="tabular-nums">{r.saves.toLocaleString('en-US')}</span>,
        <span className="tabular-nums font-medium text-brand">{r.applicants || '—'}</span>,
      ])}
      footer="Showing 7 of 1,248 — click a job title to open its detail · server-side filter · sort · pagination"
    />
    </div>
  )
}

/** Text that opens a detail page in a new tab (wireframe affordance). */
function ExtLink({ children }: { children: React.ReactNode }) {
  return (
    <a target="_blank" rel="noopener noreferrer" title="Opens in a new tab" className="min-w-0 truncate text-brand hover:underline">
      {children}
    </a>
  )
}

function CvCell({ label, kind }: { label: string; kind: 'saramin' | 'upload' }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {kind === 'saramin'
        ? <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700">Saramin CV</span>
        : <span className="truncate text-ink/80">📄 {label}</span>}
      <a target="_blank" rel="noopener noreferrer" className="shrink-0 text-brand hover:underline">View</a>
    </span>
  )
}

type Applicant = { name: string; role: string; years: string; loc: string; edu: string; job: string; company: string; cv: [string, 'saramin' | 'upload']; stage: React.ReactNode; when: string }

function AdminApplicants() {
  const raw: Applicant[] = [
    { name: 'Nguyễn Văn An', role: 'Frontend Engineer', years: '4 yrs', loc: 'Hồ Chí Minh', edu: "Bachelor · CS", job: 'Senior Frontend Engineer', company: 'FPT Software', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="neutral">Screening</Pill>, when: '2h ago' },
    { name: 'Trần Thị Bích', role: 'Digital Marketing Specialist', years: '6 yrs', loc: 'Hà Nội', edu: 'Bachelor · Marketing', job: 'Digital Marketing Lead', company: 'Tiki', cv: ['bich-portfolio.pdf', 'upload'], stage: <Pill tone="pending">Interview</Pill>, when: '5h ago' },
    { name: 'Lê Hoàng Cường', role: 'Senior Product Manager', years: '8 yrs', loc: 'Hồ Chí Minh', edu: 'Master · MBA', job: 'Product Manager', company: 'MoMo', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="active">Offer</Pill>, when: '1d ago' },
    { name: 'Phạm Thu Dung', role: 'General Accountant', years: '3 yrs', loc: 'Đà Nẵng', edu: 'Bachelor · Accounting', job: 'Kế toán tổng hợp', company: 'VNG', cv: ['thu-dung-cv.pdf', 'upload'], stage: <Pill tone="neutral">New</Pill>, when: '1d ago' },
    { name: 'Vũ Minh Đức', role: 'Backend Engineer', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · SE', job: 'Backend Engineer (Go)', company: 'Shopee', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="rejected">Rejected</Pill>, when: '3d ago' },
    { name: 'Đặng Thị Hoa', role: 'Product Designer', years: '4 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · Design', job: 'UI/UX Designer', company: 'One Mount', cv: ['hoa-portfolio.pdf', 'upload'], stage: <Pill tone="neutral">New</Pill>, when: '3d ago' },
    { name: 'Bùi Quang Huy', role: 'Data Analyst', years: '2 yrs', loc: 'Hà Nội', edu: 'Bachelor · Statistics', job: 'Data Analyst', company: 'Techcombank', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="neutral">Screening</Pill>, when: '4d ago' },
    { name: 'Ngô Thị Lan', role: 'HR Generalist', years: '7 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · HRM', job: 'HR Business Partner', company: 'Grab', cv: ['lan-cv.docx', 'upload'], stage: <Pill tone="pending">Interview</Pill>, when: '4d ago' },
    { name: 'Hoàng Văn Nam', role: 'DevOps Engineer', years: '6 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · CS', job: 'DevOps Engineer', company: 'VNG', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="neutral">New</Pill>, when: '5d ago' },
    { name: 'Trịnh Mỹ Linh', role: 'Content Writer', years: '3 yrs', loc: 'Hà Nội', edu: 'Bachelor · Journalism', job: 'Content Marketing', company: 'Base.vn', cv: ['my-linh.pdf', 'upload'], stage: <Pill tone="neutral">Screening</Pill>, when: '5d ago' },
    { name: 'Đỗ Anh Tú', role: 'iOS Developer', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · SE', job: 'Mobile Engineer (iOS)', company: 'MoMo', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="neutral">New</Pill>, when: '6d ago' },
    { name: 'Lý Thu Trang', role: 'QA Engineer', years: '4 yrs', loc: 'Đà Nẵng', edu: 'Bachelor · IT', job: 'QA Engineer', company: 'FPT Software', cv: ['trang-qa.pdf', 'upload'], stage: <Pill tone="pending">Interview</Pill>, when: '6d ago' },
    { name: 'Phan Văn Kiên', role: 'Sales Executive', years: '3 yrs', loc: 'Hồ Chí Minh', edu: 'College · Business', job: 'Sales Executive', company: 'Thế Giới Di Động', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="neutral">New</Pill>, when: '1w ago' },
    { name: 'Võ Thị Ngọc', role: 'Business Analyst', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · IS', job: 'Business Analyst', company: 'Shopee', cv: ['ngoc-cv.pdf', 'upload'], stage: <Pill tone="neutral">Screening</Pill>, when: '1w ago' },
    { name: 'Mai Đức Thắng', role: 'Solution Architect', years: '10 yrs', loc: 'Hồ Chí Minh', edu: 'Master · CS', job: 'Solution Architect', company: 'Techcombank', cv: ['Saramin CV', 'saramin'], stage: <Pill tone="active">Offer</Pill>, when: '1w ago' },
  ]
  const rows = raw.map((a) => [
    <ExtLink>{a.name}</ExtLink>,
    <div className="min-w-0">
      <p className="truncate text-ink/80">{a.role} · {a.years}</p>
      <p className="truncate text-[11px] text-faint">{a.loc} · {a.edu}</p>
    </div>,
    <ExtLink>{a.job}</ExtLink>,
    <ExtLink>{a.company}</ExtLink>,
    <CvCell label={a.cv[0]} kind={a.cv[1]} />,
    a.stage,
    <span className="text-muted">{a.when}</span>,
  ])
  return (
    <ListPage
      minW={1360}
      tabs={[{ label: 'All', count: 342 }, { label: 'New', count: 12, active: true }, { label: 'Screening', count: 88 }, { label: 'Interview', count: 40 }, { label: 'Hired', count: 21 }]}
      cols={[
        { label: 'Candidate', w: '1.1fr' },
        { label: 'Snapshot', w: '1.7fr' },
        { label: 'Applied to', w: '1.3fr' },
        { label: 'Company', w: '1fr' },
        { label: 'CV', w: '1.2fr' },
        { label: 'Stage', w: '0.9fr' },
        { label: 'Applied', w: '0.8fr', align: 'r' },
      ]}
      rows={rows}
      footer="Showing 15 of 342 applicants — HQ oversight view across all jobs"
    />
  )
}

function AdminResumes() {
  const rows = [
    ['Nguyễn Văn An', 'Frontend Engineer · 4 yrs', 'Hồ Chí Minh', <Pill tone="active">Public</Pill>, '2 days ago'],
    ['Trần Thị Bích', 'Digital Marketing · 6 yrs', 'Hà Nội', <Pill tone="active">Public</Pill>, '1 week ago'],
    ['Lê Hoàng Cường', 'Product Manager · 8 yrs', 'Hồ Chí Minh', <Pill tone="draft">Private</Pill>, '3 weeks ago'],
    ['Phạm Thu Dung', 'Kế toán · 3 yrs', 'Đà Nẵng', <Pill tone="active">Public</Pill>, '1 month ago'],
    ['Vũ Minh Đức', 'Backend Engineer · 5 yrs', 'Hồ Chí Minh', <Pill tone="active">Public</Pill>, '2 months ago'],
  ]
  return (
    <div>
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">🔒 Resumes contain PII — access is permission-gated and every view is written to the audit log.</div>
      <ListPage
        tabs={[{ label: 'All', count: 8420, active: true }, { label: 'Public', count: 6100 }, { label: 'Private', count: 2320 }]}
        cols={[{ label: 'Candidate', w: '1.2fr' }, { label: 'Title / experience', w: '1.6fr' }, { label: 'Location', w: '1fr' }, { label: 'Visibility', w: '0.9fr' }, { label: 'Updated', w: '1fr', align: 'r' }]}
        rows={rows}
        footer="Showing 5 of 8,420 resumes — CV-unlock model ties to employer talent search"
      />
    </div>
  )
}

/* ── Companies ────────────────────────────────────────────────────────────── */
// Pipeline stage = the sales/document flow. Ordered Qualified → Proposal →
// Negotiation → PO → Invoice, plus Lost. (Renewal/lapse is tracked separately by
// the customer `account` status: New / Existing / Churn.)
//   Qualified   = HR manager is willing to discuss the Quotation
//   Proposal    = Quotation has been sent to the customer
//   Negotiation = HR manager is running it through their internal approval process
//   PO          = customer agreed to buy; Sales issued the Purchase Order (deal won)
//   Invoice     = customer paid; Accounting issued the Invoice (deal closed)
//   Lost        = ended without a PO (declined / lost to a competitor / budget cut / went silent)
type CoStatus = 'Qualified' | 'Proposal' | 'Negotiation' | 'PO' | 'Invoice' | 'Lost'
// Customer-relationship health (shown on the Companies directory) — distinct from the
// deal lifecycle above (shown on the Pipeline board). Only real customers have one;
// a company still being sold to (no PO yet) has account = null.
//   New = became a customer recently (onboarding)
//   Existing = active, currently using a purchased service
//   Churn = no new product bought for 1 year since the last PO was issued
/* Customer status — exactly three, and every company always has one.
     New      = has never bought from us (no VAT e-invoice has ever been issued)
     Existing = has paid at least once — active service or a past order
     Churn    = no new order for 12 months since the last invoice
   New is about BUYING HISTORY, not about having a login: a company can sit at New
   for years while being quoted repeatedly. Whether an account exists is a separate
   fact. New → Existing is one-way; a win-back returns a churned company to Existing,
   never to New. */
type Account = 'New' | 'Existing' | 'Churn'
type Company = {
  name: string; shortName: string; legalName: string; tax: string; industry: string; size: string; address: string
  // Corporate tree. `parent` is the DIRECT parent's `name` — one parent only, any
  // depth (parent → subsidiary → sub-subsidiary). Undefined = a root: either the top
  // of a group, or a company that stands alone. Nothing is inherited down this link:
  // quota, billing, users and deals all stay on the record that owns them.
  parent?: string
  contact: string; owner: string; status: CoStatus
  account: Account; lastPO: string; renewal: string; nextStep: string
  idle: number | null; note: string; revenue: number
  /** the sent quotation has passed its expiry date — the deal does NOT move, it gets flagged */
  quoteLapsed?: boolean
  jobPosting: boolean; resumeSearch: boolean; jobLeft: number; jobTotal: number; cvLeft: number; cvTotal: number
  hasPage: boolean; jobs: number; domain: string; since: string
}
const COMPANIES: Company[] = [
  { name: 'Công ty TNHH Đại Dương', shortName: 'Đại Dương', legalName: 'Công ty TNHH Đại Dương', tax: '0315xxxxxx', industry: 'Thủy sản', size: '50–200', address: 'Hải Phòng', contact: 'Mr. Nguyễn Văn Toàn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '18/06/2026', renewal: '18/12/2026', nextStep: 'Quarterly review', idle: 34, note: 'Renewal discussion started.', revenue: 55_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 10, cvLeft: 45, cvTotal: 80, hasPage: true, jobs: 3, domain: 'daiduong.vn', since: '12/04/2025' },
  { name: 'Công ty CP Bình Minh', shortName: 'Bình Minh', legalName: 'Công ty Cổ phần Bình Minh', tax: '0316xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận 3, HCMC', contact: 'Ms. Lê Thu Hằng · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Schedule product demo', idle: 6, note: 'Quotation sent — demo booked 29/07.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'binhminh.edu.vn', since: '—' },
  { name: 'Công ty TNHH Sao Mai', shortName: 'Sao Mai', legalName: 'Công ty TNHH Sao Mai', tax: '0317xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Mr. Trần Đức Anh · HR Mgr', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 12, note: 'Waiting on their board approval.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'saomai.vn', since: '—' },
  { name: 'Công ty TNHH Vạn Phát', shortName: 'Vạn Phát', legalName: 'Công ty TNHH Vạn Phát', tax: '0312xxxxxx', industry: 'Healthcare', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Vũ Thanh Linh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '26/05/2026', renewal: '26/08/2026', nextStep: 'Onboarding check-in', idle: 47, note: 'Kickoff scheduled 30/07.', revenue: 37_800_000, jobPosting: true, resumeSearch: true, jobLeft: 7, jobTotal: 10, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 4, domain: 'vanphat.vn', since: '26/05/2026' },
  { name: 'FPT Software', shortName: 'FPT Software', legalName: 'Công ty TNHH Phần mềm FPT', tax: '0101xxxxxx', industry: 'CNTT', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Lý Văn Giang · HR Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '15/06/2026', renewal: '15/09/2026', nextStep: 'Upsell Resume Search', idle: 60, note: 'Discussed CV-search add-on.', revenue: 420_000_000, jobPosting: true, resumeSearch: false, jobLeft: 12, jobTotal: 50, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 38, domain: 'fpt.com.vn', since: '12/01/2024' },
  { name: 'Công ty CP Hoàng Gia', shortName: 'Hoàng Gia', legalName: 'Công ty Cổ phần Hoàng Gia', tax: '0313xxxxxx', industry: 'Bất động sản', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Đỗ Thu Hà · Recruiter', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '03/03/2026', renewal: '03/09/2026', nextStep: 'Confirm CV-unlock usage', idle: 1, note: 'PO signed; awaiting payment.', revenue: 20_000_000, jobPosting: false, resumeSearch: true, jobLeft: 0, jobTotal: 0, cvLeft: 40, cvTotal: 50, hasPage: false, jobs: 0, domain: 'hoanggia.vn', since: '03/03/2026' },
  { name: 'Công ty TNHH Việt Tiến', shortName: '', legalName: 'Công ty TNHH Việt Tiến Logistics', tax: '0314xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận Bình Tân, HCMC', contact: 'Mr. Ngô Minh Tú', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '10/07/2025', renewal: 'Lapsed', nextStep: 'Win-back call', idle: 73, note: 'No response to renewal ×3.', revenue: 90_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'viettien.vn', since: '15/08/2024' },
  { name: 'Tiki', shortName: 'Tiki', legalName: 'Công ty TNHH TIKI', tax: '0309xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 4, HCMC', contact: 'Ms. Bùi Thu Hằng · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '01/07/2026', renewal: '01/10/2026', nextStep: 'Quarterly review', idle: 86, note: 'QBR booked next week.', revenue: 300_000_000, jobPosting: true, resumeSearch: true, jobLeft: 21, jobTotal: 30, cvLeft: 210, cvTotal: 300, hasPage: true, jobs: 21, domain: 'tiki.vn', since: '10/11/2023' },
  { name: 'VNG Corporation', shortName: 'VNG', legalName: 'Công ty CP VNG', tax: '0304xxxxxx', industry: 'CNTT', size: '1000–5000', address: 'Quận 7, HCMC', contact: 'Mr. Đoàn Hải Nam · HR Director', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '20/06/2026', renewal: '20/12/2026', nextStep: 'Renewal upsell deck', idle: 99, note: 'Interested in employer-branding page.', revenue: 510_000_000, jobPosting: true, resumeSearch: true, jobLeft: 30, jobTotal: 40, cvLeft: 180, cvTotal: 400, hasPage: true, jobs: 27, domain: 'vng.com.vn', since: '05/02/2024' },
  { name: 'MoMo', shortName: 'MoMo', legalName: 'Công ty CP Dịch vụ Di động Trực tuyến (M_Service)', tax: '0305xxxxxx', industry: 'Fintech', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Trịnh Khánh Vy · TA Lead', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Collect payment on PO', idle: 2, note: 'PO signed; invoice pending.', revenue: 150_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 15, cvLeft: 90, cvTotal: 120, hasPage: true, jobs: 9, domain: 'momo.vn', since: '18/07/2026' },
  { name: 'Thế Giới Di Động', shortName: 'TGDĐ', legalName: 'Công ty CP Đầu tư Thế Giới Di Động', tax: '0306xxxxxx', industry: 'Bán lẻ', size: '5000+', address: 'Thủ Đức, HCMC', contact: 'Mr. Cao Văn Đức · HR Manager', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '10/05/2026', renewal: '10/11/2026', nextStep: 'Quarterly review', idle: 112, note: 'Volume hiring for new stores.', revenue: 620_000_000, jobPosting: true, resumeSearch: true, jobLeft: 40, jobTotal: 80, cvLeft: 300, cvTotal: 500, hasPage: true, jobs: 54, domain: 'thegioididong.com', since: '22/09/2023' },
  { name: 'Shopee Việt Nam', shortName: 'Shopee', legalName: 'Công ty TNHH Shopee', tax: '0307xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Lâm Ngọc Bích · TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Align on package + price', idle: 5, note: 'Comparing us vs a competitor.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'shopee.vn', since: '—' },
  { name: 'Base.vn', shortName: 'Base.vn', legalName: 'Công ty CP Base Enterprise', tax: '0308xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Phan Anh Tuấn', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book discovery call', idle: 3, note: 'Inbound from website form.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'base.vn', since: '—' },
  { name: 'Công ty CP Đông Á', shortName: '', legalName: 'Công ty Cổ phần Đông Á', tax: '0318xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Hà Kiều Trang · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 16, note: 'Quotation sent — gone quiet.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongabank.com.vn', since: '—' },
  { name: 'Công ty TNHH Minh Long', shortName: 'Minh Long', legalName: 'Công ty TNHH Gốm sứ Minh Long', tax: '0319xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Lý Quốc Bảo', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '02/06/2025', renewal: 'Lapsed', nextStep: 'Win-back next quarter', idle: 40, note: 'Budget frozen; revisit in Q4.', revenue: 60_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhlong.com', since: '14/03/2024' },
  { name: 'Công ty CP An Khang', shortName: 'An Khang', legalName: 'Công ty Cổ phần Dược phẩm An Khang', tax: '0321xxxxxx', industry: 'Y tế', size: '200–500', address: 'Quận 10, HCMC', contact: 'Ms. Trần Mỹ Duyên · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 4, note: 'Quotation sent for Job Posting Pro.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ankhang.vn', since: '—' },
  { name: 'Công ty TNHH Phú Thịnh', shortName: 'Phú Thịnh', legalName: 'Công ty TNHH Thương mại Phú Thịnh', tax: '0322xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Hồ Đăng Khoa · Trưởng phòng HC-NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Waiting on director approval', idle: 11, note: 'Asked for 10% discount; escalated.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuthinh.com.vn', since: '—' },
  { name: 'Công ty CP Thành Đạt', shortName: 'Thành Đạt', legalName: 'Công ty Cổ phần Xây dựng Thành Đạt', tax: '0320xxxxxx', industry: 'Xây dựng', size: '200–500', address: 'Quận Hà Đông, Hà Nội', contact: 'Mr. Vũ Đình Khôi · HR', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '12/07/2026', renewal: '12/10/2026', nextStep: 'Onboarding check-in', idle: 53, note: 'First purchase — Job Posting.', revenue: 25_000_000, jobPosting: true, resumeSearch: false, jobLeft: 8, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 3, domain: 'thanhdat.com.vn', since: '12/07/2026' },
  // ── Rot coverage: the rows below deliberately span fresh / amber / red for every
  // open stage, and across all three reps, so the Idle column can be read at a glance
  // in both Sales view and Sales-lead view. Thresholds are IDLE_AMBER / IDLE_RED above.
  { name: 'Công ty CP Nam Long', shortName: 'Nam Long', legalName: 'Công ty Cổ phần Đầu tư Nam Long', tax: '0323xxxxxx', industry: 'Bất động sản', size: '500–1000', address: 'Quận 7, HCMC', contact: 'Ms. Đặng Kiều Oanh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-send quotation options', idle: 9, note: 'Asked us to circle back after Tết planning.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'namlong.vn', since: '—' },
  { name: 'Công ty TNHH Hòa Bình', shortName: 'Hòa Bình', legalName: 'Công ty TNHH Xây dựng Hòa Bình', tax: '0324xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Mr. Đinh Trọng Nghĩa · Trưởng phòng NS', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — no reply in 2.5 weeks', idle: 18, note: 'Three follow-ups, no answer. Try the CFO.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hoabinh.com.vn', since: '—' },
  { name: 'Công ty CP Thương mại Vina', shortName: 'Vina Trading', legalName: 'Công ty Cổ phần Thương mại Vina', tax: '0325xxxxxx', industry: 'FMCG', size: '500–1000', address: 'Quận Bình Thạnh, HCMC', contact: 'Ms. Hoàng Diệu Linh · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase quotation feedback', idle: 12, note: 'Quotation sent; validity ends in 2 days.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinatrading.vn', since: '—' },
  { name: 'Công ty TNHH An Phú Logistics', shortName: 'An Phú', legalName: 'Công ty TNHH Giao nhận An Phú', tax: '0326xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận 9, HCMC', contact: 'Mr. Lại Văn Bình', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quotation expired — reissue or close', idle: 26, note: 'Went silent after pricing. Decide: reissue or Lost.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'anphulog.vn', since: '—' },
  { name: 'Công ty CP Tài chính Đại Tín', shortName: 'Đại Tín', legalName: 'Công ty Cổ phần Tài chính Đại Tín', tax: '0327xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Chu Thanh Vân · HR Director', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask for approval timeline', idle: 30, note: 'Legal review dragging; needs a nudge.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'daitin.com.vn', since: '—' },
  { name: 'Công ty CP Trường Sơn', shortName: 'Trường Sơn', legalName: 'Công ty Cổ phần Tập đoàn Trường Sơn', tax: '0328xxxxxx', industry: 'Sản xuất', size: '1000–5000', address: 'Đà Nẵng', contact: 'Mr. Tạ Quang Đạo · Giám đốc NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate to sales lead', idle: 52, note: 'Stalled past 45d — approval never came back.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongson.vn', since: '—' },
  // The one BRANCH in the mock — same 10-digit tax root as its parent, only the -001
  // suffix differs. That is what flips the affiliate badge from "Công ty con" to
  // "Chi nhánh"; nothing else about the record behaves differently. It still buys its
  // own package, is invoiced on its own tax code, and has its own sales owner.
  { name: 'CN Trường Sơn — Hà Nội', shortName: 'Trường Sơn HN', legalName: 'Chi nhánh Công ty Cổ phần Tập đoàn Trường Sơn tại Hà Nội', tax: '0328xxxxxx-001', industry: 'Sản xuất', size: '200–500', address: 'Long Biên, Hà Nội', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Nguyễn Vân Khánh · HC-NS', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '08/06/2026', renewal: '08/12/2026', nextStep: 'Quarterly review', idle: 21, note: 'Hires separately from HQ — own PO, own invoice.', revenue: 42_000_000, jobPosting: true, resumeSearch: false, jobLeft: 4, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongson.vn', since: '08/06/2025' },
  { name: 'Công ty TNHH Hải Âu Travel', shortName: 'Hải Âu', legalName: 'Công ty TNHH Du lịch Hải Âu', tax: '0329xxxxxx', industry: 'Du lịch', size: '50–200', address: 'Quận 1, HCMC', contact: 'Ms. Phùng Mỹ Hạnh · HR', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '19/07/2026', renewal: '19/10/2026', nextStep: 'Chase payment on PO', idle: 10, note: 'PO signed 19/07; payment not received yet.', revenue: 28_000_000, jobPosting: true, resumeSearch: false, jobLeft: 5, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'haiautravel.vn', since: '19/07/2026' },
  { name: 'Công ty CP Tân Hưng Foods', shortName: 'Tân Hưng', legalName: 'Công ty Cổ phần Thực phẩm Tân Hưng', tax: '0330xxxxxx', industry: 'Thực phẩm', size: '200–500', address: 'Long An', contact: 'Mr. Ngô Bá Thành · HC-NS', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '05/07/2026', renewal: '05/10/2026', nextStep: 'Payment 24d overdue — escalate', idle: 24, note: 'Accounting has chased twice; no transfer.', revenue: 45_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 10, cvLeft: 50, cvTotal: 50, hasPage: false, jobs: 0, domain: 'tanhungfoods.vn', since: '05/07/2026' },
  // More Qualified cover — idle spans fresh / amber / red (8d / 15d) across all three reps
  { name: 'Công ty CP Dệt may Phương Nam', shortName: 'Phương Nam', legalName: 'Công ty Cổ phần Dệt may Phương Nam', tax: '0331xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Quận 12, HCMC', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Nguyễn Hồng Nhung · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send package comparison', idle: 4, note: 'Wants Basic Plus vs Basic breakdown.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuongnamtex.vn', since: '—' },
  { name: 'Công ty TNHH Cơ khí Đông Phong', shortName: 'Đông Phong', legalName: 'Công ty TNHH Cơ khí Đông Phong', tax: '0332xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', parent: 'Công ty CP Trường Sơn', contact: 'Mr. Trịnh Văn Lộc · Trưởng phòng NS', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-book the demo they missed', idle: 11, note: 'No-showed the demo; rescheduling.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongphong.com.vn', since: '—' },
  { name: 'Galaxy Media', shortName: 'Galaxy', legalName: 'Công ty Cổ phần Truyền thông Galaxy', tax: '0333xxxxxx', industry: 'Truyền thông', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Đặng Thảo My · TA Lead', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase — 3 calls unanswered', idle: 19, note: 'Went quiet after the discovery call.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'galaxymedia.vn', since: '—' },
  // More Proposal cover — includes a quotation that has already lapsed past its 14-day validity
  { name: 'Công ty CP Dược Hậu Giang', shortName: 'DHG Pharma', legalName: 'Công ty Cổ phần Dược Hậu Giang', tax: '0334xxxxxx', industry: 'Y tế', size: '1000–5000', address: 'Cần Thơ', contact: 'Mr. Lâm Thanh Tùng · HR Director', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quotation sent 22/07 — follow up', idle: 5, note: '2 options sent: Basic Plus + Basic.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dhgpharma.com.vn', since: '—' },
  { name: 'Vietjet Air', shortName: 'Vietjet', legalName: 'Công ty Cổ phần Hàng không Vietjet', tax: '0335xxxxxx', industry: 'Hàng không', size: '5000+', address: 'Tân Bình, HCMC', contact: 'Ms. Hoàng Bảo Ngân · TA Manager', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quote expires 04/08 — nudge', idle: 13, note: 'Comparing our quote against TopCV.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vietjetair.com', since: '—' },
  { name: 'Công ty TNHH Kim Long Steel', shortName: 'Kim Long', legalName: 'Công ty TNHH Thép Kim Long', tax: '0336xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Đồng Nai', parent: 'Công ty TNHH Cơ khí Đông Phong', contact: 'Mr. Vương Chí Kiên · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quote lapsed — re-issue or close', idle: 27, note: 'Quotation expired 10 days ago.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kimlongsteel.vn', since: '—' },
  // More Negotiation cover — long internal-approval cycles, so the reds run deep here
  { name: 'Techcombank', shortName: 'Techcombank', legalName: 'Ngân hàng TMCP Kỹ Thương Việt Nam', tax: '0337xxxxxx', industry: 'Tài chính', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Ms. Phùng Diệu Linh · Head of TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Waiting on procurement sign-off', idle: 17, note: 'Legal reviewing our T&C clause 4.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'techcombank.com.vn', since: '—' },
  { name: 'Công ty CP Bán lẻ Thiên Hà', shortName: 'Thiên Hà', legalName: 'Công ty Cổ phần Bán lẻ Thiên Hà', tax: '0338xxxxxx', industry: 'Bán lẻ', size: '500–1000', address: 'Đà Nẵng', contact: 'Mr. Đỗ Nhật Trường · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send v3 quote at 12% discount', idle: 26, note: 'Board meets month-end to approve.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'thienharetail.vn', since: '—' },
  { name: 'Công ty TNHH Bảo Sơn Group', shortName: 'Bảo Sơn', legalName: 'Công ty TNHH Tập đoàn Bảo Sơn', tax: '0339xxxxxx', industry: 'Bất động sản', size: '1000–5000', address: 'Nam Từ Liêm, Hà Nội', contact: 'Ms. Cao Quỳnh Anh · HR', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — 7 weeks silent', idle: 51, note: 'Sponsor left the company; no new contact.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'baosongroup.com', since: '—' },
  // More PO cover — order confirmed, payment outstanding by varying degrees
  { name: 'Công ty CP Vinh Quang Logistics', shortName: 'Vinh Quang', legalName: 'Công ty Cổ phần Vinh Quang Logistics', tax: '0340xxxxxx', industry: 'Logistics', size: '200–500', address: 'Hải Phòng', contact: 'Mr. Bùi Xuân Trường · HC-NS', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '24/07/2026', renewal: '24/10/2026', nextStep: 'Awaiting transfer — due 31/07', idle: 3, note: 'Order confirmed; bank details sent.', revenue: 31_000_000, jobPosting: true, resumeSearch: false, jobLeft: 5, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinhquanglog.vn', since: '24/07/2026' },
  { name: 'Lazada Việt Nam', shortName: 'Lazada', legalName: 'Công ty TNHH Recess (Lazada Việt Nam)', tax: '0341xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Trương Mỹ Hạnh · TA Lead', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '15/07/2026', renewal: '15/10/2026', nextStep: 'Chase payment — 12d out', idle: 12, note: 'Their finance runs a 30-day cycle.', revenue: 195_000_000, jobPosting: true, resumeSearch: true, jobLeft: 20, jobTotal: 20, cvLeft: 150, cvTotal: 150, hasPage: false, jobs: 0, domain: 'lazada.vn', since: '15/07/2026' },
  { name: 'Công ty CP Xây dựng Hưng Thịnh', shortName: 'Hưng Thịnh', legalName: 'Công ty Cổ phần Xây dựng Hưng Thịnh', tax: '0342xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Quận Bình Thạnh, HCMC', contact: 'Mr. Phan Đăng Hải · Giám đốc NS', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '04/07/2026', renewal: '04/10/2026', nextStep: 'Payment 25d overdue — escalate', idle: 25, note: 'Signed PO but no transfer; CFO on leave.', revenue: 88_000_000, jobPosting: true, resumeSearch: true, jobLeft: 15, jobTotal: 15, cvLeft: 80, cvTotal: 80, hasPage: false, jobs: 0, domain: 'hungthinhcorp.vn', since: '04/07/2026' },
  // Lost — closed, so no rot colour at all
  { name: 'Công ty CP Công nghệ Tân Tiến', shortName: 'Tân Tiến', legalName: 'Công ty Cổ phần Công nghệ Tân Tiến', tax: '0343xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 7, HCMC', contact: 'Mr. Hoàng Việt Dũng · CTO', owner: 'Phạm Quang Huy', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Nurture — revisit Q1 2027', idle: 40, note: 'Lost to competitor on price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tantien.tech', since: '—' },
  { name: 'Công ty TNHH Đức Thành', shortName: 'Đức Thành', legalName: 'Công ty TNHH Thương mại Đức Thành', tax: '0344xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Gò Vấp, HCMC', contact: 'Ms. Lưu Ngọc Diễm · HR', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '20/05/2025', renewal: 'Lapsed', nextStep: 'Win-back call in August', idle: 33, note: 'Hiring frozen; no budget this year.', revenue: 18_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ducthanh.com.vn', since: '20/05/2024' },
  // Invoice — won and closed
  // The company behind the client's real quotation EST-009909-07-2026, so that
  // quotation resolves to a CRM record like every other one.
  { name: 'Công ty TNHH AM Software Việt Nam', shortName: 'AM Software', legalName: 'CÔNG TY TNHH AM SOFTWARE VIỆT NAM', tax: '0317110315', industry: 'CNTT', size: '50–200', address: '115/2A Lê Trọng Tấn, Phường Sơn Kỳ, Quận Tân Phú, HCMC', contact: 'Mr. Nguyễn Huy · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 9, note: 'Quotation sent 20/07 — 2 options.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'aoimirai.co.jp', since: '—' },
  { name: 'Sacombank', shortName: 'Sacombank', legalName: 'Ngân hàng TMCP Sài Gòn Thương Tín', tax: '0345xxxxxx', industry: 'Tài chính', size: '5000+', address: 'Quận 3, HCMC', contact: 'Ms. Nguyễn Lê Vy · Head of Talent', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '08/06/2026', renewal: '08/12/2026', nextStep: 'Quarterly review', idle: 66, note: 'Renewed for a second year.', revenue: 380_000_000, jobPosting: true, resumeSearch: true, jobLeft: 25, jobTotal: 40, cvLeft: 220, cvTotal: 350, hasPage: true, jobs: 19, domain: 'sacombank.com.vn', since: '08/06/2025' },
  { name: 'Công ty TNHH Giáo dục Sunrise', shortName: 'Sunrise Edu', legalName: 'Công ty TNHH Giáo dục Sunrise', tax: '0331xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận Tân Phú, HCMC', contact: 'Ms. Lưu Ngọc Hân · HR', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send quotation options', idle: 2, note: 'Discovery call done; keen on Resume Search.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'sunriseedu.vn', since: '—' },
  { name: 'Công ty CP Bảo Việt Care', shortName: 'Bảo Việt Care', legalName: 'Công ty Cổ phần Bảo Việt Care', tax: '0332xxxxxx', industry: 'Y tế', size: '500–1000', address: 'Quận 5, HCMC', contact: 'Ms. Trịnh Bích Thảo · TA Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '28/05/2026', renewal: '28/11/2026', nextStep: 'Quarterly review', idle: 79, note: 'Renewal talk starts next month.', revenue: 185_000_000, jobPosting: true, resumeSearch: true, jobLeft: 14, jobTotal: 20, cvLeft: 120, cvTotal: 200, hasPage: true, jobs: 11, domain: 'baovietcare.vn', since: '14/06/2025' },
  // ── Volume rows: enough companies for the pipeline board and the list to feel
  // like a real book of business — every stage populated, owners rotated across
  // the three reps, idle values spanning fresh / amber / red.
  { name: 'Công ty CP Vĩnh Cửu', shortName: 'Vĩnh Cửu', legalName: 'Công ty Cổ phần Vĩnh Cửu', tax: '0333xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Ms. Lê Kim Chi · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up in 2 days', idle: 3, note: 'Quotation sent, awaiting review.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinhcuu.vn', since: '—' },
  { name: 'Công ty TNHH Bách Khoa Tech', shortName: 'Bách Khoa', legalName: 'Công ty TNHH Bách Khoa Technology', tax: '0334xxxxxx', industry: 'CNTT', size: '50–200', address: 'Quận 10, HCMC', contact: 'Mr. Vương Tuấn Kiệt · CTO', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Call the HR manager', idle: 9, note: 'No reply since the quotation.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'bachkhoatech.vn', since: '—' },
  { name: 'Công ty CP Nội thất Sài Gòn', shortName: 'Nội thất SG', legalName: 'Công ty Cổ phần Nội thất Sài Gòn', tax: '0335xxxxxx', industry: 'Bán lẻ', size: '200–500', address: 'Quận 12, HCMC', contact: 'Ms. Trần Thảo Vy · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Reissue or close', idle: 19, note: 'Quotation validity almost up.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'noithatsg.vn', since: '—' },
  { name: 'Công ty TNHH Dệt may Phong Phú', shortName: 'Phong Phú', legalName: 'Công ty TNHH Dệt may Phong Phú', tax: '0336xxxxxx', industry: 'Dệt may', size: '1000–5000', address: 'Quận 9, HCMC', contact: 'Mr. Bùi Hữu Lộc · Trưởng phòng NS', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Clarify option B', idle: 5, note: 'Comparing our 3 options.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phongphu.com.vn', since: '—' },
  { name: 'Công ty CP Dược Nam Hà', shortName: 'Nam Hà', legalName: 'Công ty Cổ phần Dược Nam Hà', tax: '0337xxxxxx', industry: 'Y tế', size: '1000–5000', address: 'Cần Thơ', contact: 'Ms. Nguyễn Bảo Châu · HR Director', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Decide: reissue or Lost', idle: 24, note: 'Silent for over 3 weeks.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dhgpharma.com.vn', since: '—' },
  { name: 'Công ty TNHH Cơ khí Tây Đô', shortName: 'Tây Đô', legalName: 'Công ty TNHH Cơ khí Tây Đô', tax: '0338xxxxxx', industry: 'Cơ khí', size: '200–500', address: 'Hải Dương', contact: 'Mr. Hà Trọng Tín', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book the demo', idle: 2, note: 'Wants a demo next week.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'taydock.vn', since: '—' },
  { name: 'Công ty CP Vận tải Bắc Nam', shortName: 'Bắc Nam', legalName: 'Công ty Cổ phần Vận tải Bắc Nam', tax: '0339xxxxxx', industry: 'Logistics', size: '500–1000', address: 'Đà Nẵng', contact: 'Ms. Đỗ Lan Phương · HC-NS', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask about budget cycle', idle: 11, note: 'Budget check in progress.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'bacnamlogistics.vn', since: '—' },
  { name: 'Công ty TNHH Kiến Á', shortName: 'Kiến Á', legalName: 'Công ty TNHH Đầu tư Kiến Á', tax: '0340xxxxxx', industry: 'Bất động sản', size: '200–500', address: 'Quận 2, HCMC', contact: 'Mr. Lâm Chí Cường · HR', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate to sales lead', idle: 16, note: 'Went quiet after first call.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kiena.vn', since: '—' },
  { name: 'Công ty CP Bia Sài Gòn Miền Tây', shortName: 'Bia SG MT', legalName: 'Công ty Cổ phần Bia Sài Gòn Miền Tây', tax: '0341xxxxxx', industry: 'Thực phẩm', size: '500–1000', address: 'Cần Thơ', contact: 'Ms. Phạm Ngọc Diệp', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send quotation options', idle: 6, note: 'Interested in Resume Search.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'biasgmt.vn', since: '—' },
  { name: 'Công ty TNHH Thiết bị Y tế Việt', shortName: 'TBYT Việt', legalName: 'Công ty TNHH Thiết bị Y tế Việt', tax: '0342xxxxxx', industry: 'Y tế', size: '50–200', address: 'Quận 5, HCMC', contact: 'Mr. Tôn Quang Vinh · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Discovery call', idle: 4, note: 'Referred by an existing client.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tbytviet.vn', since: '—' },
  { name: 'Công ty CP Xi măng Hà Tiên', shortName: 'Hà Tiên', legalName: 'Công ty Cổ phần Xi măng Hà Tiên', tax: '0343xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Kiên Giang', contact: 'Ms. Cao Thị Lệ · HR Manager', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 14, note: 'Haggling on the 6-month price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hatien.com.vn', since: '—' },
  { name: 'Công ty TNHH Phần mềm Rikkei', shortName: 'Rikkei', legalName: 'Công ty TNHH Phần mềm Rikkei', tax: '0344xxxxxx', industry: 'CNTT', size: '500–1000', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Đặng Minh Hoàng · TA Lead', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask for approval date', idle: 27, note: 'Waiting on their board.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'rikkeisoft.com', since: '—' },
  { name: 'Công ty CP Thủy sản Minh Phú', shortName: 'Minh Phú', legalName: 'Công ty Cổ phần Thủy sản Minh Phú', tax: '0345xxxxxx', industry: 'Thủy sản', size: '1000–5000', address: 'Cà Mau', contact: 'Ms. Võ Kim Ngân · HR', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — likely dead', idle: 48, note: 'Stalled well past 45d.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhphu.com', since: '—' },
  { name: 'Công ty TNHH Bảo hiểm Tín Việt', shortName: 'Tín Việt', legalName: 'Công ty TNHH Bảo hiểm Tín Việt', tax: '0346xxxxxx', industry: 'Tài chính', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Nguyễn Đình Phúc', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Prepare the order', idle: 7, note: 'Agreed terms verbally.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tinviet.vn', since: '—' },
  { name: 'Công ty CP Du lịch Phương Nam', shortName: 'Phương Nam', legalName: 'Công ty Cổ phần Du lịch Phương Nam', tax: '0347xxxxxx', industry: 'Du lịch', size: '50–200', address: 'Nha Trang', contact: 'Ms. Huỳnh Mai Trâm · HR', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '16/07/2026', renewal: '16/10/2026', nextStep: 'Hand to Accounting', idle: 2, note: 'PO signed, invoice next.', revenue: 63_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 30, cvLeft: 54, cvTotal: 100, hasPage: true, jobs: 7, domain: 'phuongnamtravel.vn', since: '16/07/2026' },
  { name: 'Công ty TNHH Giấy Tân Mai', shortName: 'Tân Mai', legalName: 'Công ty TNHH Giấy Tân Mai', tax: '0348xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Đồng Nai', contact: 'Mr. Trịnh Bá Hưng · HC-NS', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '17/07/2026', renewal: '17/10/2026', nextStep: 'Chase payment', idle: 12, note: 'Payment not received yet.', revenue: 80_000_000, jobPosting: true, resumeSearch: false, jobLeft: 7, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 8, domain: 'tanmai.vn', since: '17/07/2026' },
  { name: 'Công ty CP Điện máy Thành Công', shortName: 'Thành Công', legalName: 'Công ty Cổ phần Điện máy Thành Công', tax: '0349xxxxxx', industry: 'Bán lẻ', size: '500–1000', address: 'Quận Gò Vấp, HCMC', contact: 'Ms. Lý Thu Trang · HR', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Escalate to Accounting lead', idle: 23, note: 'Payment badly overdue.', revenue: 97_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 56, cvTotal: 100, hasPage: true, jobs: 9, domain: 'thanhcongdm.vn', since: '18/07/2026' },
  { name: 'Công ty TNHH Logistics Sao Việt', shortName: 'Sao Việt', legalName: 'Công ty TNHH Logistics Sao Việt', tax: '0350xxxxxx', industry: 'Logistics', size: '200–500', address: 'Hải Phòng', contact: 'Mr. Phan Đức Duy', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '19/07/2026', renewal: '19/10/2026', nextStep: 'Kickoff call', idle: 92, note: 'Onboarding in progress.', revenue: 114_000_000, jobPosting: true, resumeSearch: true, jobLeft: 9, jobTotal: 30, cvLeft: 57, cvTotal: 100, hasPage: true, jobs: 10, domain: 'saovietlog.vn', since: '19/07/2026' },
  { name: 'Công ty CP Giáo dục Én Nhỏ', shortName: 'Én Nhỏ', legalName: 'Công ty Cổ phần Giáo dục Én Nhỏ', tax: '0351xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận Phú Nhuận, HCMC', contact: 'Ms. Ngô Hải Yến · HR', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '20/07/2026', renewal: '20/10/2026', nextStep: 'Quarterly review', idle: 105, note: 'Using both products actively.', revenue: 131_000_000, jobPosting: true, resumeSearch: false, jobLeft: 4, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 2, domain: 'ennho.edu.vn', since: '21/01/2025' },
  { name: 'Công ty TNHH Sơn Đại Việt', shortName: 'Đại Việt', legalName: 'Công ty TNHH Sơn Đại Việt', tax: '0352xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Long An', contact: 'Mr. Chu Văn Thái', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '21/07/2026', renewal: '21/10/2026', nextStep: 'Check-in — usage is low', idle: 118, note: 'Quiet since activation.', revenue: 148_000_000, jobPosting: true, resumeSearch: true, jobLeft: 5, jobTotal: 20, cvLeft: 59, cvTotal: 100, hasPage: true, jobs: 3, domain: 'sondaiviet.vn', since: '21/07/2026' },
  { name: 'Công ty CP Nông sản Xanh', shortName: 'Nông sản Xanh', legalName: 'Công ty Cổ phần Nông sản Xanh', tax: '0353xxxxxx', industry: 'Nông nghiệp', size: '200–500', address: 'Lâm Đồng', contact: 'Ms. Trương Bích Hạnh · HR', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '22/07/2026', renewal: '22/10/2026', nextStep: 'Prepare renewal quote', idle: 46, note: 'Renewal in 2 months.', revenue: 165_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 30, cvLeft: 60, cvTotal: 100, hasPage: true, jobs: 4, domain: 'nongsanxanh.vn', since: '23/03/2025' },
  { name: 'Công ty TNHH Nhựa Bình Phát', shortName: 'Bình Phát', legalName: 'Công ty TNHH Nhựa Bình Phát', tax: '0354xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Đoàn Quốc Huy · HR', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '23/07/2026', renewal: '23/10/2026', nextStep: 'Re-engage before renewal', idle: 31, note: 'No contact in a month.', revenue: 182_000_000, jobPosting: true, resumeSearch: false, jobLeft: 7, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 5, domain: 'binhphat.vn', since: '23/07/2026' },
  { name: 'Công ty CP Bán lẻ Vạn Xuân', shortName: 'Vạn Xuân', legalName: 'Công ty Cổ phần Bán lẻ Vạn Xuân', tax: '0355xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Tạ Mỹ Linh · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '24/07/2026', renewal: '24/10/2026', nextStep: 'Upsell Resume Search', idle: 59, note: 'Repeat customer, 3rd order.', revenue: 199_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 6, domain: 'vanxuan.vn', since: '25/05/2025' },
  { name: 'Công ty TNHH Kỹ thuật Nam Việt', shortName: 'Nam Việt', legalName: 'Công ty TNHH Kỹ thuật Nam Việt', tax: '0356xxxxxx', industry: 'Cơ khí', size: '200–500', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Lưu Anh Tú', owner: 'Trần Quốc Trung', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-engage next quarter', idle: 35, note: 'Chose a competitor on price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'namvieteng.vn', since: '—' },
  { name: 'Công ty CP Chứng khoán Đại Nam', shortName: 'CK Đại Nam', legalName: 'Công ty Cổ phần Chứng khoán Đại Nam', tax: '0357xxxxxx', industry: 'Tài chính', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Hồ Diễm Quỳnh · HR', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Nurture — revisit Q1', idle: 44, note: 'Budget frozen for the year.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'cknam.vn', since: '—' },
  { name: 'Công ty TNHH Mỹ phẩm Hương Sen', shortName: 'Hương Sen', legalName: 'Công ty TNHH Mỹ phẩm Hương Sen', tax: '0358xxxxxx', industry: 'FMCG', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Bạch Tuyết Nhi', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send discount options', idle: null, note: 'Inbound sign-up — nobody has called yet.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'huongsen.vn', since: '—' },
  { name: 'Công ty CP Thép Việt Đức', shortName: 'Thép Việt Đức', legalName: 'Công ty Cổ phần Thép Việt Đức', tax: '0359xxxxxx', industry: 'Sản xuất', size: '1000–5000', address: 'Vĩnh Phúc', contact: 'Mr. Kiều Mạnh Hà · Trưởng phòng NS', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Retry after 01/08', idle: 9, note: 'HR manager on leave.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'thepvietduc.vn', since: '—' },
  { name: 'Công ty TNHH Cà phê Ban Mê', shortName: 'Ban Mê', legalName: 'Công ty TNHH Cà phê Ban Mê', tax: '0360xxxxxx', industry: 'Thực phẩm', size: '200–500', address: 'Đắk Lắk', contact: 'Ms. Phùng Thanh Thúy · HR', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase legal', idle: 22, note: 'Legal reviewing our T&C.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'banmecoffee.vn', since: '—' },
  { name: 'Công ty CP Công nghệ TekOne', shortName: 'TekOne', legalName: 'Công ty Cổ phần Công nghệ TekOne', tax: '0361xxxxxx', industry: 'CNTT', size: '50–200', address: 'Quận 4, HCMC', contact: 'Mr. Trần Gia Bảo · CEO', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '04/07/2026', renewal: '04/10/2026', nextStep: 'Ask for a testimonial', idle: null, note: 'Inbound sign-up — nobody has called yet.', revenue: 101_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 68, cvTotal: 100, hasPage: true, jobs: 3, domain: 'tekone.vn', since: '06/02/2025' },
  { name: 'Công ty TNHH An Toàn Lao Động Việt', shortName: 'ATLĐ Việt', legalName: 'Công ty TNHH An Toàn Lao Động Việt', tax: '0362xxxxxx', industry: 'Dịch vụ', size: '50–200', address: 'Quận Bình Tân, HCMC', contact: 'Ms. Dương Kiều My', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '05/07/2026', renewal: '05/10/2026', nextStep: 'Collect PO number', idle: 6, note: 'Awaiting their PO number.', revenue: 118_000_000, jobPosting: true, resumeSearch: true, jobLeft: 9, jobTotal: 30, cvLeft: 69, cvTotal: 100, hasPage: true, jobs: 4, domain: 'atldviet.vn', since: '05/07/2026' },
  { name: 'Công ty CP Khách sạn Biển Đông', shortName: 'Biển Đông', legalName: 'Công ty Cổ phần Khách sạn Biển Đông', tax: '0363xxxxxx', industry: 'Du lịch', size: '500–1000', address: 'Đà Nẵng', contact: 'Mr. Nguyễn Hải Sơn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Confirm option 2', idle: 13, note: 'Second option preferred.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'biendonghotel.vn', since: '—' },
  { name: 'Công ty TNHH Thương mại Hoàng Long', shortName: 'Hoàng Long', legalName: 'Công ty TNHH Thương mại Hoàng Long', tax: '0364xxxxxx', industry: 'Bán lẻ', size: '200–500', address: 'Quận 6, HCMC', contact: 'Ms. Đinh Thu Hà', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Qualify need & budget', idle: 3, note: 'Inbound from the website.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hoanglongtm.vn', since: '—' },
]

const AC_STATUS: Record<Account, { tone: StatusTone; label: string }> = {
  New: { tone: 'draft', label: 'New' },
  Existing: { tone: 'active', label: 'Existing' },
  Churn: { tone: 'rejected', label: 'Churn' },
}
/* Onboarding is a CADENCE, not a status — the first 90 days after the first
   invoice, when a fresh customer needs a tighter touch. The real system reads
   firstInvoicedAt; the mock uses `since`, which is the same date. */
const ONBOARDING_DAYS = 90
const TODAY = new Date(2026, 6, 29) // 29/07/2026 — the mock's "now"
const daysSince = (dmy: string) => {
  const [d, m, y] = dmy.split('/').map(Number)
  if (!d || !m || !y) return Infinity // "—" — never activated
  return Math.round((TODAY.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000)
}
// A company shows a pipeline step only while a deal is open (before it closes at
// Invoice, or dies at Lost). Settled customers show "—".
const inPipeline = (c: Company) => c.status !== 'Invoice' && c.status !== 'Lost'
const revFmt = (v: number) => (v === 0 ? '—' : (v / 1e6).toFixed(0) + 'M ₫')

/* ── Create-PO gate ───────────────────────────────────────────────────────────
   A sales order / PO is only ever created from ONE ACCEPTED quotation option —
   never from scratch, and never from a quotation that has lapsed (T&C clause 2:
   the discounts and gifts were only committed until the expiry date). So the
   button is always visible on a pre-PO company, but it explains itself when it
   cannot fire. Demo mapping by stage: Qualified/Proposal = quote out, not yet
   accepted · Proposal + idle > 14d = quote lapsed · Negotiation = an option has
   been accepted, so the PO can be raised. */
function poGate(c: Company): { ok: boolean; reason?: string; quote: string } {
  const quote = `EST-0099${(c.tax.replace(/\D/g, '').slice(0, 2) || '10')}-07-2026`
  if (c.status === 'PO' || c.status === 'Invoice') return { ok: false, reason: 'An order already exists for this deal.', quote }
  if (c.status === 'Lost') return { ok: false, reason: 'The deal is closed-lost. Re-open it or start a new deal first.', quote }
  if (c.status === 'Qualified') return { ok: false, reason: 'No quotation option has been accepted yet.', quote }
  if (c.status === 'Proposal') {
    return (c.idle ?? 0) > 14
      ? { ok: false, reason: 'The quotation has lapsed past its validity — extend it or re-issue as v2 before raising an order.', quote }
      : { ok: false, reason: 'The quotation is sent but no option has been accepted yet.', quote }
  }
  return { ok: true, quote } // Negotiation — an option is agreed, raise the order
}

/* ── Idle ──────────────────────────────────────────────────────────────────
   Idle = days since the last human CONTACT with the client. Reset only by a real
   touch (logged chat/call/meeting, or a document sent/confirmed); system events
   (auto-reminders, provisioning, page publishes) must NOT reset it.

   ONE rule everywhere — the same definition, thresholds table and display on the
   Companies list and the Pipeline board. The rule is "idle vs the EXPECTED CONTACT
   CADENCE for this relationship type", i.e. one formula reading a settings table,
   never per-stage logic sprinkled through the code. A company with an open deal
   always uses the openDeal row: the live opportunity sets the pace. */
type Cadence = 'openDeal' | 'onboarding' | 'existing' | 'nurture' | 'churn'
const IDLE_RULE: Record<Cadence, { amber: number; red: number; cadence: string }> = {
  openDeal:    { amber: 7,  red: 14, cadence: 'weekly' },
  onboarding:  { amber: 14, red: 30, cadence: 'fortnightly' }, // Existing, first 90 days after the first invoice
  existing:    { amber: 30, red: 60, cadence: 'monthly' },
  nurture:     { amber: 30, red: 60, cadence: 'monthly' },     // New (never bought), no open deal
  churn:       { amber: 60, red: 90, cadence: 'quarterly' },   // win-back
}
/** Which cadence row a company is judged against. Open deal wins over everything. */
function cadenceOf(c: Company): Cadence {
  if (inPipeline(c)) return 'openDeal'
  if (c.account === 'Churn') return 'churn'
  if (c.account === 'New') return 'nurture'
  return daysSince(c.since) <= ONBOARDING_DAYS ? 'onboarding' : 'existing'
}
type Rot = 'fresh' | 'amber' | 'red'
function idleOf(days: number, k: Cadence = 'openDeal'): Rot {
  const t = IDLE_RULE[k]
  return days >= t.red ? 'red' : days >= t.amber ? 'amber' : 'fresh'
}
/** ONE display rule, used on both the Companies list and the Pipeline board:
    under a month reads in days ("12d"); a month or more rolls up to months +
    remainder ("1m 18d", "3m 2d") so a long gap stays readable instead of "92d". */
function fmtIdle(days: number): string {
  if (days < 30) return `${days}d`
  const m = Math.floor(days / 30)
  const d = days % 30
  return d ? `${m}m ${d}d` : `${m}m`
}
const ROT_TEXT: Record<Rot, string> = {
  fresh: 'text-muted',
  amber: 'text-amber-600 font-medium',
  red: 'text-rose-600 font-medium',
}
const ROT_DOT: Record<Rot, string> = { fresh: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' }
/** Idle read-out: a health dot + the gap. `days = null` → never contacted at all,
    which is a DISTINCT state from 0d and the highest-priority follow-up. */
function Idle({ days, kind = 'openDeal', dotOnly }: { days: number | null; kind?: Cadence; dotOnly?: boolean }) {
  if (days === null) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-rose-600" title="No contact has ever been logged for this company — highest-priority follow-up.">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
        {dotOnly ? null : 'Never'}
      </span>
    )
  }
  const t = IDLE_RULE[kind]
  const rot = idleOf(days, kind)
  return (
    <span className={cn('inline-flex items-center gap-1 tabular-nums', ROT_TEXT[rot])} title={`${days} day(s) since the last contact · ${kind} expects ${t.cadence} contact — amber from ${t.amber}d, red from ${t.red}d`}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', ROT_DOT[rot])} />
      {dotOnly ? null : fmtIdle(days)}
    </span>
  )
}


const CO_STATUS: Record<CoStatus, { tone: StatusTone; label: string }> = {
  Qualified: { tone: 'draft', label: 'Qualified' },
  Proposal: { tone: 'neutral', label: 'Proposal' },
  Negotiation: { tone: 'pending', label: 'Negotiation' },
  PO: { tone: 'schedule', label: 'PO' },
  Invoice: { tone: 'active', label: 'Invoice' },
  Lost: { tone: 'rejected', label: 'Lost' },
}
// Board order follows the document flow: the quotation goes out (Proposal), the HR
// manager engages with it (Qualified), then internal approval (Negotiation) → PO → Invoice.
const CO_ORDER: CoStatus[] = ['Proposal', 'Qualified', 'Negotiation', 'PO', 'Invoice', 'Lost']
// A company is a customer once a PO is issued (PO or Invoice stage).
const isCustomer = (c: Company) => c.status === 'PO' || c.status === 'Invoice'
/** Full VND — e.g. 18,000,000 ₫ (pipeline values are read exactly, not rounded to M). */
const vnd = (v: number) => v.toLocaleString('en-US') + ' ₫'
const CO_VALUE: Record<string, number> = {
  'Công ty TNHH Đại Dương': 42_000_000, 'Công ty CP Bình Minh': 68_000_000, 'Công ty TNHH Sao Mai': 155_000_000,
  'Công ty TNHH Vạn Phát': 37_800_000, 'FPT Software': 420_000_000, 'Công ty CP Hoàng Gia': 20_000_000,
  'Công ty TNHH Việt Tiến': 90_000_000, 'Tiki': 300_000_000,
  'VNG Corporation': 510_000_000, 'MoMo': 150_000_000, 'Thế Giới Di Động': 620_000_000,
  'Shopee Việt Nam': 245_000_000, 'Base.vn': 18_000_000, 'Công ty CP Đông Á': 72_000_000,
  'Công ty TNHH Minh Long': 60_000_000, 'Công ty CP Thành Đạt': 25_000_000,
  'Công ty CP An Khang': 95_000_000, 'Công ty TNHH Phú Thịnh': 33_500_000,
  'Công ty CP Nam Long': 128_000_000, 'Công ty TNHH Hòa Bình': 210_000_000,
  'Công ty CP Thương mại Vina': 76_000_000, 'Công ty TNHH An Phú Logistics': 54_000_000,
  'Công ty CP Tài chính Đại Tín': 165_000_000, 'Công ty CP Trường Sơn': 231_000_000,
  'Công ty TNHH Hải Âu Travel': 28_000_000, 'Công ty CP Tân Hưng Foods': 45_000_000,
  'Công ty TNHH Giáo dục Sunrise': 22_000_000, 'Công ty CP Bảo Việt Care': 185_000_000,
  'Công ty CP Dệt may Phương Nam': 64_000_000, 'Công ty TNHH Cơ khí Đông Phong': 41_000_000,
  'Galaxy Media': 87_000_000, 'Công ty CP Dược Hậu Giang': 240_000_000,
  'Vietjet Air': 465_000_000, 'Công ty TNHH Kim Long Steel': 58_000_000,
  'Techcombank': 540_000_000, 'Công ty CP Bán lẻ Thiên Hà': 112_000_000,
  'Công ty TNHH Bảo Sơn Group': 198_000_000, 'Công ty CP Vinh Quang Logistics': 31_000_000,
  'Lazada Việt Nam': 195_000_000, 'Công ty CP Xây dựng Hưng Thịnh': 88_000_000,
  'Công ty CP Công nghệ Tân Tiến': 74_000_000, 'Công ty TNHH Đức Thành': 18_000_000,
  'Công ty TNHH AM Software Việt Nam': 6_588_000, 'Sacombank': 380_000_000,
}
/* Deal value. Rows without an explicit entry above get a stable pseudo-value
   derived from the name, so a demo company can never render as 0 ₫ — the map only
   needs maintaining for the few figures we quote in conversation. */
const coValue = (c: Company) => {
  const explicit = CO_VALUE[c.name]
  if (explicit) return explicit
  let h = 0
  for (const ch of c.name) h = (h * 31 + ch.codePointAt(0)!) % 100000
  return (18 + (h % 43)) * 1_000_000 // 18M – 60M ₫, stable per name
}
/** Display label: prefer the short/brand name, fall back to the legal name. */
const coLabel = (c: Company) => c.shortName?.trim() || c.legalName
/* Demo stand-in for the database primary key. In the real build this is the
   company row's bigint id; here it is derived from the name so every render (and
   every screenshot) shows the same company ID. See lib/companyId.ts. */
const coKey = (c: Company) => {
  let h = 0
  for (const ch of c.name) h = (h * 131 + ch.codePointAt(0)!) % 900000
  return h + 1000
}
/** City / province — the last segment of the address (the form captures both). */
const coCity = (c: Company) => c.address.split(',').pop()!.trim()
/** Demo-only: a stable lead source per company, so the field is exercised without
    authoring one on every row. Real build stores this from the New-company form. */
const LEAD_SOURCES = ['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']
/* Latest revenue = the value of the MOST RECENT paid order, where Total revenue is
   lifetime. A first-time customer's latest equals their total; a repeat customer's
   is the last order only — the pair together shows whether an account is growing or
   coasting. Demo-only derivation; the real build reads the last paid invoice. */
const coLastRevenue = (c: Company) => {
  if (!c.revenue) return 0
  if (c.account === 'New') return c.revenue // first order = their whole history
  let h = 0
  for (const ch of c.name) h = (h * 29 + ch.codePointAt(0)!) % 7919
  const share = 0.2 + (h % 60) / 100 // 20% – 79% of lifetime, stable per company
  return Math.round((c.revenue * share) / 1_000_000) * 1_000_000
}
const coLeadSource = (c: Company) => {
  let h = 0
  for (const ch of c.name) h = (h * 17 + ch.codePointAt(0)!) % 9973
  return LEAD_SOURCES[h % LEAD_SOURCES.length]
}

/* ── Corporate tree ────────────────────────────────────────────────────────
   Parent and subsidiary are separate legal entities: separate records, separate
   tax codes, separate accounts, separate billing, separate sales owners. The
   only thing the link does is let a rep see the context and click across. A
   BRANCH is the one exception in Vietnamese law — not its own legal entity, so
   it shares the parent's 10-digit tax code and only appends a -001 suffix. We
   store branches in the same tree with the same `parent` field and tell the two
   apart by comparing tax roots, so there is no second mechanism to maintain. */
const coByName = (n: string) => COMPANIES.find((x) => x.name === n)
/** The 10-digit tax number without a branch suffix — the identity of the legal entity. */
const taxRoot = (t: string) => t.split('-')[0]
/** Direct children only, in list order. */
const childrenOf = (c: Company) => COMPANIES.filter((x) => x.parent === c.name)
/** Ancestor chain, furthest first: [group root, …, direct parent]. Depth-guarded so a
    bad `parent` value can never spin the render loop. */
const ancestorsOf = (c: Company) => {
  const chain: Company[] = []
  let cur = c.parent ? coByName(c.parent) : undefined
  while (cur && chain.length < 8 && !chain.includes(cur)) {
    chain.unshift(cur)
    cur = cur.parent ? coByName(cur.parent) : undefined
  }
  return chain
}
/** The top of the group — the company itself when it has no parent. */
const groupRootOf = (c: Company) => ancestorsOf(c)[0] ?? c
/** Every company in the same group, the root included. */
const groupOf = (root: Company) => COMPANIES.filter((x) => groupRootOf(x).name === root.name)
/** True when the company is part of a group at all (has a parent or any children). */
const inGroup = (c: Company) => Boolean(c.parent) || childrenOf(c).length > 0
/** Branch (shares the parent's tax root) vs subsidiary (its own tax code). Derived from
    the data — never a field someone has to remember to set. */
const affiliateKind = (c: Company, parent: Company) =>
  taxRoot(c.tax) === taxRoot(parent.tax) ? 'Chi nhánh' : 'Công ty con'

function CompaniesBoard({ onOpen, showOwner, rows = COMPANIES }: { onOpen: (c: Company) => void; showOwner?: boolean; rows?: Company[] }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, minmax(130px,1fr))' }}>
      {CO_ORDER.map((st) => {
        const list = rows.filter((c) => c.status === st)
        const total = list.reduce((s, c) => s + coValue(c), 0)
        return (
          <div key={st} className="rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-1 flex items-center justify-between"><Pill tone={CO_STATUS[st].tone}>{st}</Pill><span className="text-[11px] font-bold text-faint">{list.length}</span></div>
            <p className="mb-2 text-[10.5px] text-faint tabular-nums">{list.length ? vnd(total) : '—'}</p>
            {list.map((c) => (
              <button key={c.name} onClick={() => onOpen(c)} className="mb-1.5 block w-full rounded-md border border-line bg-surface p-2 text-left hover:border-brand/40">
                <p className="truncate text-[11.5px] font-semibold text-ink">{coLabel(c)}</p>
                {/* industry sits directly under the name — it is what a rep scans to
                    judge fit and to spot clusters worth a sector play. Rendered as a
                    bordered tag, not plain text, so it reads as a category the board
                    can be filtered by rather than as a second line of the name. */}
                <span className="mt-1 inline-block max-w-full truncate rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-muted">{c.industry}</span>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <p className="text-[10.5px] text-muted tabular-nums">{vnd(coValue(c))}</p>
                  <span className="shrink-0 text-[10.5px]"><Idle days={c.idle} kind={cadenceOf(c)} /></span>
                </div>
                {c.quoteLapsed && <p className="mt-1 truncate text-[10px] font-medium text-rose-600">⚠ offer lapsed — reissue or close</p>}
                {showOwner && <p className="mt-0.5 truncate text-[10px] text-faint">👤 {c.owner}</p>}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}


function QuotaBar({ left, total }: { left: number; total: number }) {
  const pct = total ? (left / total) * 100 : 0
  return (
    <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full', pct < 30 ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  )
}

const ME = 'Nguyễn Thị Lan' // the signed-in sales rep (mock)

function AdminCompanyList() {
  const [open, setOpen] = useState<Company | null>(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState<'me' | 'team'>('me')
  // Group filter — the whole tree under one root. Deliberately NOT an owner filter:
  // a group can span several reps, so filtering by group has to ignore the view
  // switcher, otherwise a rep can never see the parts of the group they don't own.
  const [group, setGroup] = useState<Company | null>(null)
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} onOpen={setOpen} />

  const rows = group ? groupOf(group) : view === 'me' ? COMPANIES.filter((c) => c.owner === ME) : COMPANIES
  const showOwner = view === 'team' || Boolean(group)
  const stats = view === 'me'
    ? [
        { label: 'Revenue vs target (Q3)', value: '72%', delta: '₫720M / ₫1.0B', up: true },
        { label: 'Activity today', value: '38 / 50', delta: '12 below target', up: false },
        { label: 'In pipeline', value: '12', delta: '₫1.6B open', up: true },
        { label: 'My customers', value: '84' },
        { label: 'Churn risk', value: '5', delta: '+1 to win back', up: false },
      ]
    : [
        { label: 'Revenue vs target (Q3)', value: '84%', delta: '₫12.4B / ₫14.8B', up: true },
        { label: 'Activity today', value: '227 / 300', delta: '73 below target', up: false },
        { label: 'In pipeline', value: '108', delta: '₫18.2B open', up: true },
        { label: 'Total customers', value: '512' },
        { label: 'Churned (12mo)', value: '30', delta: '5.9% of base', up: false },
      ]

  return (
    <div>
      {/* Sales vs Sales-lead view switcher */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
          <button onClick={() => setView('me')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'me' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales view</button>
          <button onClick={() => setView('team')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'team' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales lead view</button>
        </div>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New company</button>
      </div>

      <div className="mb-4"><StatCards cards={stats} row /></div>

      {/* Group filter banner — only ever visible once a rep has clicked a group tag,
          so the default list stays exactly as it was. */}
      {group && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2 text-[12px] text-brand">
          <span className="font-semibold">🏢 Tập đoàn {coLabel(group)}</span>
          <span className="text-brand/70">— {rows.length} công ty, mọi cấp, không phân biệt sales phụ trách. Mỗi công ty vẫn có MST, hợp đồng và quota riêng.</span>
          <button onClick={() => setGroup(null)} className="ml-auto rounded-md border border-brand/40 px-2 py-0.5 text-[11px] font-medium hover:bg-surface">Bỏ lọc ✕</button>
        </div>
      )}

      {creating && <CreateLeadModal onClose={() => setCreating(false)} />}

      <Table
        minW={showOwner ? 1360 : 1220}
        cols={[
          { label: 'Company', w: '1.4fr' },
          { label: 'Industry', w: '0.9fr' },
          { label: 'Location', w: '0.9fr' },
          { label: 'Status', w: '0.8fr' },
          { label: 'Pipeline', w: '0.9fr' },
          // Owner is only meaningful when looking across the team — in Sales view
          // every row is yours, so the column would repeat the same name. A group
          // view always shows it: the whole point is that a group can span reps.
          ...(showOwner ? [{ label: 'Owner', w: '0.9fr' } as Col] : []),
          { label: 'Idle', w: '0.6fr' },
          { label: 'Latest note', w: '1.5fr' },
          { label: 'Total revenue', w: '1fr', align: 'r' as const },
          { label: 'Latest revenue', w: '1fr', align: 'r' as const },
        ]}
        rows={rows.map((c) => [
          <div className="min-w-0">
            <button onClick={() => setOpen(c)} className="block min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">{coLabel(c)}</button>
            {/* The group tag is the whole affordance: it says "this record is part of a
                bigger customer" and doubles as the filter into that group. */}
            {inGroup(c) && (
              <button
                onClick={() => setGroup(groupRootOf(c))}
                className="mt-0.5 block max-w-full truncate text-left text-[10px] text-faint hover:text-brand hover:underline"
              >
                🏢 {coLabel(groupRootOf(c))}{c.parent ? ` · ${affiliateKind(c, coByName(c.parent)!).toLowerCase()}` : ' · công ty mẹ'}
              </button>
            )}
          </div>,
          <span className="truncate">{c.industry}</span>,
          <span className="truncate">{c.address}</span>,
          <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>,
          inPipeline(c) ? (
            <span className="flex min-w-0 flex-wrap items-center gap-1">
              <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>
              {c.quoteLapsed && <span title="The sent quotation has passed its expiry date — reissue or close the deal." className="text-[10.5px] font-medium text-rose-600">⚠ lapsed</span>}
            </span>
          ) : <span className="text-faint">—</span>,
          ...(showOwner ? [<span className="truncate">{c.owner}</span>] : []),
          <Idle days={c.idle} kind={cadenceOf(c)} />,
          <span className="truncate text-muted">{c.note}</span>,
          <span className="tabular-nums">{revFmt(c.revenue)}</span>,
          <span className="tabular-nums">{revFmt(coLastRevenue(c))}</span>,
        ])}
      />
      <Footer text={group
        ? `Showing ${rows.length} companies in the ${coLabel(group)} group — parent, subsidiaries and branches. Grouping is a view; each row is still its own customer with its own billing.`
        : view === 'me' ? `Showing ${rows.length} of 84 — your book of business.` : `Showing ${rows.length} of 512 — every company across the team. Filter by owner to drill into one rep.`} />
    </div>
  )
}

/* ── Pipeline — the same companies as a status board (opens the same record) ── */
function AdminCompanyPipeline() {
  const [open, setOpen] = useState<Company | null>(null)
  const [view, setView] = useState<'me' | 'team'>('me')
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} onOpen={setOpen} />
  const rows = view === 'me' ? COMPANIES.filter((c) => c.owner === ME) : COMPANIES
  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
        <button onClick={() => setView('me')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'me' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales view</button>
        <button onClick={() => setView('team')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'team' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>Sales lead view</button>
      </div>
      <CompaniesBoard onOpen={setOpen} rows={rows} showOwner={view === 'team'} />
    </div>
  )
}

function CompanyPagePreview({ c }: { c: Company }) {
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="h-12 bg-gradient-to-r from-brand to-violet-500" />
      <div className="-mt-5 px-3 pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border-2 border-surface bg-surface text-[13px] font-bold text-brand shadow">{initials}</div>
        <p className="mt-1.5 text-[12.5px] font-bold">{c.name}</p>
        <p className="text-[10.5px] text-faint">{c.industry} · {c.size} staff</p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between rounded-md border border-line px-2 py-1 text-[10.5px]"><span>Open role #1</span><span className="text-faint">HCMC</span></div>
          <div className="flex justify-between rounded-md border border-line px-2 py-1 text-[10.5px]"><span>Open role #2</span><span className="text-faint">HCMC</span></div>
        </div>
      </div>
    </div>
  )
}

function PurchaseRow({ name, detail, amount, date, expired }: { name: string; detail: string; amount: string; date: string; expired?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5">
      <div className="min-w-0">
        <p className="truncate text-[11.5px] font-medium text-ink">{name}</p>
        <p className="text-[10.5px] text-faint">{detail} · {date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11.5px] font-medium tabular-nums">{amount}</p>
        <Pill tone={expired ? 'expired' : 'active'}>{expired ? 'Expired' : 'Paid'}</Pill>
      </div>
    </div>
  )
}

const MAX_SEATS = 4

/* ── per-company mock data (jobs · team · activity) ───────────────────────── */
type CoJob = { title: string; status: StatusTone; statusLabel: string; applicants: number; posted: string; deadline: string }
const COMPANY_JOBS: Record<string, CoJob[]> = {
  'Công ty TNHH Vạn Phát': [
    { title: 'Điều dưỡng viên (Khoa Nội)', status: 'open', statusLabel: 'Open', applicants: 14, posted: '02/07/2026', deadline: '31/08/2026' },
    { title: 'Bác sĩ Đa khoa', status: 'open', statusLabel: 'Open', applicants: 6, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Kế toán viện phí', status: 'open', statusLabel: 'Open', applicants: 0, posted: '20/07/2026', deadline: '15/09/2026' },
    { title: 'Lễ tân bệnh viện', status: 'closed', statusLabel: 'Closed', applicants: 31, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'FPT Software': [
    { title: 'Senior Frontend Engineer (ReactJS)', status: 'open', statusLabel: 'Open', applicants: 0, posted: '24/07/2026', deadline: '31/08/2026' },
    { title: 'Java Developer (Spring Boot)', status: 'open', statusLabel: 'Open', applicants: 52, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Business Analyst', status: 'open', statusLabel: 'Open', applicants: 28, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Comtor tiếng Nhật (BrSE)', status: 'open', statusLabel: 'Open', applicants: 11, posted: '01/07/2026', deadline: '31/08/2026' },
    { title: 'DevOps Engineer', status: 'open', statusLabel: 'Open', applicants: 19, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'QA Automation Engineer', status: 'closed', statusLabel: 'Closed', applicants: 40, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Tiki': [
    { title: 'Digital Marketing Lead', status: 'open', statusLabel: 'Open', applicants: 42, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Product Manager', status: 'open', statusLabel: 'Open', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Backend Engineer (Go)', status: 'open', statusLabel: 'Open', applicants: 33, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Data Analyst', status: 'open', statusLabel: 'Open', applicants: 25, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên Kho vận', status: 'open', statusLabel: 'Open', applicants: 0, posted: '22/07/2026', deadline: '20/09/2026' },
    { title: 'Category Manager', status: 'closed', statusLabel: 'Closed', applicants: 47, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Công ty TNHH Đại Dương': [
    { title: 'Nhân viên Kinh doanh Thủy sản', status: 'open', statusLabel: 'Open', applicants: 9, posted: '20/06/2026', deadline: '31/08/2026' },
    { title: 'Kỹ sư Nuôi trồng Thủy sản', status: 'open', statusLabel: 'Open', applicants: 4, posted: '15/06/2026', deadline: '15/09/2026' },
    { title: 'Nhân viên QC (Chế biến)', status: 'closed', statusLabel: 'Closed', applicants: 22, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'VNG Corporation': [
    { title: 'Kế toán tổng hợp', status: 'schedule', statusLabel: 'Schedule', applicants: 0, posted: '—', deadline: '20/09/2026' },
    { title: 'Game Product Manager', status: 'open', statusLabel: 'Open', applicants: 36, posted: '12/07/2026', deadline: '12/09/2026' },
    { title: 'Backend Engineer (Golang)', status: 'open', statusLabel: 'Open', applicants: 44, posted: '08/07/2026', deadline: '08/09/2026' },
    { title: 'Data Engineer', status: 'open', statusLabel: 'Open', applicants: 17, posted: '30/06/2026', deadline: '31/08/2026' },
    { title: 'UI/UX Designer', status: 'open', statusLabel: 'Open', applicants: 23, posted: '25/06/2026', deadline: '25/08/2026' },
    { title: 'Chuyên viên Tuyển dụng', status: 'closed', statusLabel: 'Closed', applicants: 58, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'MoMo': [
    { title: 'Product Manager', status: 'open', statusLabel: 'Open', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Risk & Fraud Analyst', status: 'open', statusLabel: 'Open', applicants: 12, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Android Engineer (Kotlin)', status: 'open', statusLabel: 'Open', applicants: 29, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên CSKH (Hotline)', status: 'open', statusLabel: 'Open', applicants: 61, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'Kế toán thanh toán', status: 'draft', statusLabel: 'Draft', applicants: 0, posted: '—', deadline: '—' },
  ],
  'Thế Giới Di Động': [
    { title: 'Nhân viên Kinh doanh (Chuỗi cửa hàng)', status: 'open', statusLabel: 'Open', applicants: 128, posted: '22/07/2026', deadline: '30/09/2026' },
    { title: 'Quản lý Cửa hàng — HCMC', status: 'open', statusLabel: 'Open', applicants: 47, posted: '18/07/2026', deadline: '18/09/2026' },
    { title: 'Kỹ thuật viên Bảo hành', status: 'open', statusLabel: 'Open', applicants: 63, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Nhân viên Kho vận', status: 'open', statusLabel: 'Open', applicants: 84, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Chuyên viên Đào tạo Nội bộ', status: 'schedule', statusLabel: 'Schedule', applicants: 0, posted: '—', deadline: '01/10/2026' },
    { title: 'Thu ngân (Part-time)', status: 'closed', statusLabel: 'Closed', applicants: 96, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Công ty CP Thành Đạt': [
    { title: 'Kỹ sư Xây dựng (Giám sát công trình)', status: 'open', statusLabel: 'Open', applicants: 7, posted: '14/07/2026', deadline: '14/09/2026' },
    { title: 'Kỹ sư Dự toán', status: 'open', statusLabel: 'Open', applicants: 3, posted: '12/07/2026', deadline: '12/09/2026' },
    { title: 'Nhân viên An toàn Lao động', status: 'draft', statusLabel: 'Draft', applicants: 0, posted: '—', deadline: '—' },
  ],
}
const companyJobs = (c: Company) => COMPANY_JOBS[c.name] ?? []

/* Applications received (employer view — like the Company site) */
type CoApplicant = { name: string; job: string; applied: string; tone: StatusTone; stage: string }
const APPLICANT_NAMES = ['Trần Văn Hùng', 'Nguyễn Thị Mai', 'Lê Hoàng Nam', 'Phạm Thu Trang', 'Đỗ Minh Quân', 'Vũ Thị Hồng', 'Bùi Đức Anh']
const APPLICANT_STAGES: { tone: StatusTone; stage: string }[] = [
  { tone: 'schedule', stage: 'Shortlisted' }, { tone: 'pending', stage: 'Reviewing' }, { tone: 'neutral', stage: 'New' },
  { tone: 'active', stage: 'Interview' }, { tone: 'rejected', stage: 'Rejected' }, { tone: 'neutral', stage: 'New' }, { tone: 'pending', stage: 'Reviewing' },
]
const APPLICANT_WHEN = ['2 days ago', '3 days ago', '5 days ago', '1 week ago', '1 week ago', '2 weeks ago', '2 weeks ago']
const companyApplicants = (c: Company): CoApplicant[] => {
  const js = companyJobs(c)
  if (!js.length) return []
  return APPLICANT_NAMES.map((n, i) => ({ name: n, job: js[i % js.length].title, applied: APPLICANT_WHEN[i], tone: APPLICANT_STAGES[i].tone, stage: APPLICANT_STAGES[i].stage }))
}

/* Resume unlocks / opens (employer view — like the Company site) */
type CoResumeView = { name: string; headline: string; when: string; by: string }
const companyResumeViews = (c: Company): CoResumeView[] => {
  if (!c.resumeSearch) return []
  const mgr = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  return [
    { name: 'Hoàng Thị Lan Anh', headline: 'Kế toán trưởng · 8 năm KN', when: '1 hour ago', by: mgr },
    { name: 'Nguyễn Đức Thắng', headline: 'Kỹ sư Cơ khí · 5 năm KN', when: '3 hours ago', by: mgr },
    { name: 'Trần Bảo Ngọc', headline: 'Nhân viên Marketing · 3 năm KN', when: 'Yesterday', by: 'Đỗ Thị Mai' },
    { name: 'Lý Quốc Khánh', headline: 'Chuyên viên Nhân sự · 6 năm KN', when: '2 days ago', by: mgr },
    { name: 'Phan Thị Hương', headline: 'Nhân viên Kinh doanh · 4 năm KN', when: '3 days ago', by: 'Đỗ Thị Mai' },
  ]
}

type CoTeamUser = { name: string; email: string; role: 'HR Manager' | 'HR Specialist'; status: 'Active' | 'Invited'; last: string }
function companyTeam(c: Company): CoTeamUser[] {
  const noProducts = !c.jobPosting && !c.resumeSearch
  const managerName = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const localPart = (n: string) =>
    n.split(' ').pop()!.toLowerCase()
      .replace(/đ/g, 'd').replace(/ơ/g, 'o').replace(/ư/g, 'u')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const base: Omit<CoTeamUser, 'email'>[] = [{ name: managerName, role: 'HR Manager', status: 'Active', last: '10m ago' }]
  if (isCustomer(c) && !noProducts) {
    base.push({ name: 'Đỗ Thị Mai', role: 'HR Specialist', status: 'Active', last: '2h ago' })
    if (c.size === '5000+' || c.jobs > 15) {
      base.push({ name: 'Ngô Minh Tú', role: 'HR Specialist', status: 'Active', last: '1d ago' })
      base.push({ name: 'Lê Thanh Sơn', role: 'HR Specialist', status: 'Invited', last: '—' })
    }
  }
  return base.map((u) => ({ ...u, email: `${localPart(u.name)}@${c.domain}` }))
}

type CoEvent = { icon: string; tone: string; title: string; time: string; sub: string }

/* SALES ACTIVITY ONLY — what a human on our side did with the client: chats, calls,
   and documents actually sent or confirmed to them. Deliberately NOT a merged
   "everything that happened" feed.

   System and usage events (CV unlocked, job published, page published, payment
   received, products provisioned, account activated) are excluded on purpose. Two
   reasons: they already each have their own tab on this record — Resume activity,
   Jobs, Company page, Products & billing — so nothing is lost; and mixing them in
   makes a silent client look busy, which is exactly the signal a sales rep opens
   this panel to read.

   The newest row is the last CONTACT, so it is what the Idle column counts from —
   `c.idle` days ago. That keeps one number meaning one thing in both places. */
const CHAT = 'bg-sky-100 text-sky-700'
const CALL = 'bg-emerald-100 text-emerald-700'
const DOC = 'bg-violet-100 text-violet-700'
function companyActivity(c: Company): CoEvent[] {
  const contact = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const rep = c.owner.split(' ').slice(-2).join(' ')
  const ago = (d: number) => `${fmtIdle(d)} ago`
  // No contact has ever been logged — a real state, and the highest-priority
  // follow-up. An empty trail says that far better than inventing history.
  if (c.idle === null) return []
  const last = c.idle

  if (c.account === 'Churn') {
    return [
      { icon: '📞', tone: CALL, title: 'Call · win-back', time: ago(last), sub: `${rep} called ${contact} — ${c.note.toLowerCase()} Agreed to revisit.` },
      { icon: '💬', tone: CHAT, title: 'Chat · Email', time: ago(last + 34), sub: `${rep} sent a renewal reminder to ${contact} — no reply.` },
      { icon: '📄', tone: DOC, title: 'Renewal quotation sent', time: ago(last + 61), sub: `Sent to ${contact}; the quotation lapsed unanswered.` },
    ]
  }

  const ev: CoEvent[] = [
    { icon: '💬', tone: CHAT, title: 'Chat · Zalo', time: ago(last), sub: `${rep} messaged ${contact} — next step: ${c.nextStep.toLowerCase()}.` },
  ]
  // Documents count as sales activity: a rep sent them to the client. Provisioning
  // that follows a document does not — that is the system reacting.
  if (c.status === 'PO' || c.status === 'Invoice') {
    ev.push({ icon: '📄', tone: DOC, title: 'Order confirmed with the client', time: ago(last + 9), sub: `${contact} confirmed the accepted option; PO issued by ${rep}.` })
  }
  if (c.status !== 'Qualified') {
    ev.push({ icon: '📄', tone: DOC, title: 'Quotation sent', time: ago(last + 21), sub: `${rep} sent the priced options to ${contact}.` })
  }
  ev.push({ icon: '📞', tone: CALL, title: 'Call · discovery', time: ago(last + 38), sub: `${rep} called ${contact} — logged via Calio, need and budget qualified.` })
  ev.push({ icon: '💬', tone: CHAT, title: 'Chat · Email', time: ago(last + 52), sub: `First outreach to ${contact}.` })
  return ev
}

/* Sales activity log — compose a chat (channel + note) or a call (via Calio) */
const CHAT_CHANNELS = ['Zalo', 'Facebook Messenger', 'Email', 'SMS', 'Zalo OA', 'Phone', 'Other']
function CompanyActivities({ c }: { c: Company }) {
  const [kind, setKind] = useState<null | 'chat' | 'call'>(null)
  const [channel, setChannel] = useState('Zalo')
  const [note, setNote] = useState('')
  const [logged, setLogged] = useState<CoEvent[]>([])
  const rows = [...logged, ...companyActivity(c)]

  const save = () => {
    const entry: CoEvent = kind === 'chat'
      ? { icon: '💬', tone: 'bg-sky-100 text-sky-700', title: `Chat · ${channel}`, time: 'just now', sub: note.trim() || 'No note added.' }
      : { icon: '📞', tone: 'bg-emerald-100 text-emerald-700', title: 'Call · logged via Calio', time: 'just now', sub: note.trim() || 'Call synced from Calio — outcome & recording attached.' }
    setLogged((p) => [entry, ...p])
    setKind(null); setNote(''); setChannel('Zalo')
  }

  return (
    // min-w-0 so the trail's table scrolls inside this column instead of forcing
    // the whole Overview grid wider than the page.
    <div className="min-w-0 space-y-4">
      {/* composer */}
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-2 border-b border-line-soft px-3.5 py-2.5">
          <p className="text-[12.5px] font-bold">Log an activity</p>
        </div>
        <div className="p-3.5">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setKind('chat')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'chat' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>💬 Chat</button>
            <button onClick={() => setKind('call')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'call' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>📞 Call</button>
          </div>

          {kind === 'chat' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Channel <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {CHAT_CHANNELS.map((ch) => (
                    <button key={ch} onClick={() => setChannel(ch)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', channel === ch ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{ch}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={`What did you discuss on ${channel}?`} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log chat</button>
              </div>
            </div>
          )}

          {kind === 'call' && (
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
                <span>📞 Linked with <b>Calio</b> — place the call in Calio and it auto-logs here (duration, outcome, recording).</span>
                <button className="shrink-0 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">Call via Calio</button>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Call summary / next step… (auto-filled from Calio when available)" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log call</button>
              </div>
            </div>
          )}

          {!kind && <p className="mt-3 text-[11px] leading-relaxed text-faint">Pick <b>Chat</b> to log a Zalo / Messenger / email conversation, or <b>Call</b> to log a phone call (synced from Calio).</p>}
        </div>
      </div>

      {/* history — table so the whole trail is scannable at a glance */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">Sales activity <span className="font-normal text-muted">— contact with the client only</span></p>
          <span className="text-[11px] text-faint">newest first</span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-3.5 py-4 text-center">
            <p className="text-[12.5px] font-medium text-rose-700">Never contacted</p>
            <p className="mt-0.5 text-[11.5px] text-rose-700/80">No sales activity has ever been logged for this company — the highest-priority follow-up, not the lowest.</p>
          </div>
        ) : (
          <Table
            cols={[{ label: 'When', w: '0.8fr' }, { label: 'Activity', w: '1.3fr' }, { label: 'Details', w: '2.6fr' }]}
            rows={rows.map((e) => [
              <span className="text-[11.5px] text-muted">{e.time}</span>,
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]', e.tone)}>{e.icon}</span>
                <span className="truncate font-medium text-ink">{e.title}</span>
              </span>,
              <span className="text-muted">{e.sub}</span>,
            ])}
          />
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          Chats, calls and documents sent to the client — nothing else. The newest row is what <b>Idle</b> counts from, so a system event can never make a silent account look healthy.
          System and usage events live on their own tabs: <b>Resume activity</b> (CV unlocks, always audited), <b>Jobs</b>, <b>Company page</b>, <b>Products &amp; billing</b> (payments, provisioning).
        </p>
      </div>
    </div>
  )
}

function MiniStat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[15px] font-bold tabular-nums', tone === 'warn' ? 'text-amber-600' : 'text-ink')}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10.5px] text-faint">{sub}</p>}
    </div>
  )
}

type CoTab = 'Overview' | 'Users' | 'Products & billing' | 'Company page' | 'Jobs' | 'Applications' | 'Resumes' | 'Activity'
function CoTabBar({ tabs, active, onSelect }: { tabs: { key: CoTab; label: string; count?: number }[]; active: CoTab; onSelect: (t: CoTab) => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-0.5 border-b border-line-soft">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className={cn(
            'relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors',
            active === t.key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {t.label}
          {t.count != null && <span className={cn('rounded-full px-1.5 text-[10px]', active === t.key ? 'bg-brand text-white' : 'bg-canvas text-faint')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* Products & quota block — shared by the Overview snapshot and the billing tab */
function ProductsQuota({ c, compact }: { c: Company; compact?: boolean }) {
  const noProducts = !c.jobPosting && !c.resumeSearch
  return (
    <>
      {!compact && (
        <>
          <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Purchased</p>
          {noProducts && c.account !== 'Churn' ? (
            <p className="text-[12px] text-muted">No purchases on record yet.</p>
          ) : (
            <div className="space-y-1.5">
              {c.jobPosting && <PurchaseRow name="Job Posting — Pro" detail="10 slots · 3 months" amount="15,000,000 ₫" date={c.since} />}
              {c.resumeSearch && <PurchaseRow name="Resume Search — 6 months" detail="100 CV unlocks" amount="20,000,000 ₫" date={c.since} />}
              {noProducts && c.account === 'Churn' && <PurchaseRow name="Job Posting — Pro" detail="lapsed 31/12/2025" amount="15,000,000 ₫" date="12/2024" expired />}
            </div>
          )}
        </>
      )}
      {!noProducts && (
        <>
          <p className={cn('mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint', !compact && 'mt-3.5')}>Quota in use</p>
          <div className="space-y-3">
            {c.jobPosting && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>📢 Job posting</b><span className="tabular-nums font-semibold">{c.jobLeft}<span className="font-normal text-faint">/{c.jobTotal} slots</span></span></div>
                <QuotaBar left={c.jobLeft} total={c.jobTotal} />
              </div>
            )}
            {c.resumeSearch && (
              <div>
                <div className="flex items-baseline justify-between text-[12px]"><b>🔍 Resume search</b><span className="tabular-nums font-semibold">{c.cvLeft}<span className="font-normal text-faint">/{c.cvTotal} unlocks</span></span></div>
                <QuotaBar left={c.cvLeft} total={c.cvTotal} />
              </div>
            )}
            <p className="text-[11px] text-faint">Valid until 31/12/2026.</p>
          </div>
        </>
      )}
      {noProducts && c.account === 'Churn' && <p className="mt-2 text-[11px] text-amber-700">Subscription expired — no active quota. Renew to reactivate.</p>}
    </>
  )
}

/* jobseeker company page — editor + draft preview, shared by Overview + its tab */
function CompanyPageEditor({ c }: { c: Company }) {
  if (!c.jobPosting) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-canvas/40 px-3 py-6 text-center">
        <div className="text-[22px]">🔍</div>
        <p className="mt-1 text-[12.5px] font-medium">No public page needed</p>
        <p className="mx-auto mt-1 max-w-[42ch] text-[11.5px] text-muted">Resume-Search-only customer — invisible to jobseekers and not listed in the public Companies directory. Add Job Posting to enable a page.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-canvas/50 px-2.5 py-2">
        <a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">↗ Preview draft on jobseeker site</a>
        <span className="font-mono text-[10.5px] text-faint">saramin.vn/company/…?preview=draft</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1.15fr_1fr] md:items-start">
        <div className="space-y-2.5">
          <LField label="Display name" value={c.hasPage ? c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '') : ''} />
          <LField label="Logo · cover image" value={c.hasPage ? 'Uploaded' : 'Upload…'} />
          <LField label="About (vi required · en/ko optional)" req value={c.hasPage ? `Leading ${c.industry.toLowerCase()} company in Vietnam…` : ''} />
          <LField label="Benefits / welfare" value={c.hasPage ? 'Insurance · 13th salary · hybrid' : ''} />
          <LField label="Locations · website" value={c.hasPage ? `${c.address} · ${c.domain}` : ''} />
        </div>
        {c.hasPage && <CompanyPagePreview c={c} />}
      </div>
      <div className="flex flex-wrap gap-2">
        {c.hasPage ? (
          <>
            <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Save changes</button>
            <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">↗ View live</button>
          </>
        ) : (
          <button className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Publish page</button>
        )}
      </div>
      {!c.hasPage && <p className="text-[11px] text-amber-700">⚠️ Draft — not public yet. The company can’t publish jobs until this page is published.</p>}
    </div>
  )
}

/* ── the tabbed company record ────────────────────────────────────────────── */
/* ── Affiliated companies — the corporate-tree block on a company record ─────
   One level up (as a breadcrumb) and one level down (as a list). Deliberately not
   the whole tree: the rep needs context and a way across, not an org chart. Every
   row shows the affiliate's OWN tax code, because that is what makes it obvious
   these are separate customers that happen to be related. */
function AffiliatedCompanies({ c, onOpen }: { c: Company; onOpen?: (x: Company) => void }) {
  const chain = ancestorsOf(c)
  const kids = childrenOf(c)
  if (!chain.length && !kids.length) return null
  const root = groupRootOf(c)
  const go = (x: Company) => onOpen?.(x)

  return (
    <DetailCard
      title="Công ty liên kết — Affiliated companies"
      action={<span className="text-[11px] text-faint">{groupOf(root).length} công ty trong tập đoàn</span>}
    >
      {/* breadcrumb up to the group root */}
      {chain.length > 0 && (
        <div className="mb-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px]">
          <span className="text-faint">Thuộc:</span>
          {chain.map((a) => (
            <span key={a.name} className="flex items-center gap-1.5">
              <button onClick={() => go(a)} className="font-medium text-brand hover:underline">{coLabel(a)}</button>
              <span className="text-faint">›</span>
            </span>
          ))}
          <span className="font-medium text-ink">{coLabel(c)}</span>
        </div>
      )}

      {kids.length > 0 ? (
        <div className="space-y-1.5">
          {kids.map((k) => (
            <button key={k.name} onClick={() => go(k)} className="flex w-full items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5 text-left hover:border-brand/40">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-ink">{coLabel(k)}</p>
                <p className="truncate text-[10.5px] text-faint">MST {k.tax} · 👤 {k.owner}</p>
              </div>
              <span className="shrink-0">
                <Pill tone={affiliateKind(k, c) === 'Chi nhánh' ? 'draft' : 'neutral'}>{affiliateKind(k, c)}</Pill>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11.5px] text-muted">Không có công ty con trực tiếp.</p>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button className="text-[11px] font-medium text-brand hover:underline">Xem sơ đồ tập đoàn ↗</button>
        <button className="text-[11px] text-muted hover:text-ink hover:underline">+ Gán công ty mẹ</button>
      </div>
      <p className="mt-2 rounded-md bg-canvas px-2.5 py-2 text-[11px] leading-relaxed text-muted">
        Liên kết chỉ để tra cứu và điều hướng — <b>không kế thừa gì</b>. Gói/quota, hợp đồng, báo giá, hoá đơn VAT, user và sales phụ trách đều riêng theo MST của từng công ty.
        <span className="text-faint"> Chi nhánh = cùng 10 số gốc MST (đuôi -001); công ty con = MST hoàn toàn khác.</span>
      </p>
    </DetailCard>
  )
}

function CompanyDetail({ c, onBack, onOpen }: { c: Company; onBack: () => void; onOpen?: (x: Company) => void }) {
  const [tab, setTab] = useState<CoTab>('Overview')
  const [inviting, setInviting] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const noProducts = !c.jobPosting && !c.resumeSearch
  const team = companyTeam(c)
  const jobs = companyJobs(c)
  const activeJobs = jobs.filter((j) => j.status === 'open').length
  const full = team.length >= MAX_SEATS
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  const contactPerson = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const contactEmail = contactPerson.split(' ').pop()!.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '') + '@' + c.domain
  const contactPhone = '090' + (c.tax.replace(/\D/g, '').slice(0, 1) || '0') + ' ' + c.tax.replace(/\D/g, '').slice(1, 4).padEnd(3, '0') + ' •••'

  const tabs: { key: CoTab; label: string; count?: number }[] = [
    { key: 'Overview', label: 'Overview' },
    { key: 'Users', label: 'Users', count: team.length },
    { key: 'Products & billing', label: 'Products & billing' },
    { key: 'Company page', label: 'Company page' },
    { key: 'Jobs', label: 'Jobs', count: c.jobPosting ? jobs.length : undefined },
    // Applications hang off the jobs this account posted, so the tab only exists
    // for Job-Posting customers; Resumes only for Resume-Search customers.
    ...(c.jobPosting ? [{ key: 'Applications' as CoTab, label: 'Applications', count: companyApplicants(c).length }] : []),
    ...(c.resumeSearch ? [{ key: 'Resumes' as CoTab, label: 'Resumes' }] : []),
  ]

  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Company list</button>

      {/* header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-[16px] font-bold text-white shadow-sm">{initials}</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Company account</p>
            <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">
              {c.name}
              {/* Both axes, always: customer status (has it ever bought) and, only
                  while a deal is live, the pipeline stage. */}
              <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>
              {inPipeline(c) && <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
            </h2>
            <p className="text-[11.5px] text-muted"><span className="font-mono font-medium text-ink/70">{companyId(coKey(c))}</span> · {c.legalName} · MST {c.tax} · <span className="font-mono">{c.domain}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>
          {c.hasPage && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">View on jobseeker ↗</button>}
          {/* Tạo báo giá — unconditional, for EVERY company. A quotation is the one
              document that is always legitimate to raise: a first quote for a
              prospect, a renewal for an existing customer, a win-back for a churned
              one. The gated step is the PO, which is raised from an accepted
              quotation option (see the Quotations list), not from here. */}
          <button onClick={() => setQuoting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">
            Tạo báo giá / Create quotation
          </button>
        </div>
      </div>

      {/* at-a-glance stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Customer since" value={c.since.slice(-4)} sub={c.since} />
        <MiniStat label="Open jobs" value={c.jobPosting ? activeJobs : '—'} sub={c.jobPosting ? `${jobs.length} total` : 'No Job Posting'} />
        <MiniStat label="Team" value={`${team.length}/${MAX_SEATS}`} sub="seats used" tone={full ? 'warn' : undefined} />
        <MiniStat label="Job quota" value={c.jobPosting ? `${c.jobLeft}/${c.jobTotal}` : '—'} sub={c.jobPosting ? 'slots left' : 'n/a'} tone={c.jobPosting && c.jobLeft / c.jobTotal < 0.3 ? 'warn' : undefined} />
        <MiniStat label="CV unlocks" value={c.resumeSearch ? `${c.cvLeft}/${c.cvTotal}` : '—'} sub={c.resumeSearch ? 'left' : 'n/a'} tone={c.resumeSearch && c.cvLeft / c.cvTotal < 0.3 ? 'warn' : undefined} />
        <MiniStat label="Sales owner" value={<span className="text-[12.5px]">{c.owner.split(' ').slice(-2).join(' ')}</span>} sub="from CRM" />
      </div>

      <CoTabBar tabs={tabs} active={tab} onSelect={setTab} />

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {/* Overview = who they are (left, narrow) + what we have done with them
          (right, wide). Products & quota and Team are NOT repeated here — they own
          the "Products & billing" and "Users" tabs. Activities is the primary
          section: it is what a rep actually opens this record for. */}
      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
          <div className="min-w-0 space-y-4">
            {/* Mirrors the New-company form field-for-field, in the same order, so a
                rep never wonders where something they typed went. */}
            <DetailCard title="Basic info — from CRM">
              <KV label="Company ID" value={companyId(coKey(c))} />
              <KV label="Legal name" value={c.legalName} />
              <KV label="Short name" value={c.shortName?.trim() || '— (falls back to the legal name)'} />
              <KV label="Tax code (MST)" value={c.tax} />
              <KV label="Công ty mẹ" value={c.parent ? coLabel(coByName(c.parent)!) : '— (không thuộc tập đoàn nào)'} />
              <KV label="Industry · size" value={`${c.industry} · ${c.size} staff`} />
              <KV label="Location" value={coCity(c)} />
              <KV label="Website" value={c.domain} link />
              <KV label="Address" value={c.address} />
              <KV label="Primary contact" value={c.contact} />
              <KV label="Contact email" value={contactEmail} />
              <KV label="Contact phone" value={contactPhone} />
              <KV label="Lead source" value={coLeadSource(c)} />
              <KV label="Sales owner" value={c.owner} />
              <KV label="Estimated deal value" value={vnd(coValue(c))} />
              <KV label="Description" value={c.note} />
              <p className="mt-2 rounded-md bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">🔗 Synced from the CRM customer record — the same company, one source of truth.</p>
            </DetailCard>
            <AffiliatedCompanies c={c} onOpen={onOpen} />
          </div>

          {/* activity composer + full trail — the key section, so it gets the wider side */}
          <CompanyActivities c={c} />
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      {tab === 'Users' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-ink">Team members</p>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('text-[11px] font-medium', full ? 'text-amber-700' : 'text-faint')}>{team.length}/{MAX_SEATS} seats</span>
              <button onClick={() => setInviting(true)} disabled={full} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">+ Invite user</button>
            </div>
          </div>
          {noProducts && <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">Subscription expired — logins remain but are read-only until the account is renewed.</p>}
          <Table
            cols={[{ label: 'User', w: '1.6fr' }, { label: 'Role', w: '1fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' }]}
            rows={team.map((u) => [
              <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
              <Pill tone={u.role === 'HR Manager' ? 'neutral' : 'draft'}>{u.role}</Pill>,
              <Pill tone={u.status === 'Active' ? 'active' : 'pending'}>{u.status}</Pill>,
              <span className="text-[11.5px] text-muted">{u.last}</span>,
              u.status === 'Invited'
                ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
                : u.role === 'HR Manager'
                  ? <RowAction>Transfer role</RowAction>
                  : <><RowAction>Make manager</RowAction><RowAction tone="rose">Disable</RowAction></>,
            ])}
          />
          <p className="mt-2 text-[11px] leading-relaxed text-faint">Remove = disable (never hard-delete) — the HR Manager can’t be disabled directly; transfer the role first. A self-signup requesting to join appears here for the Manager to approve.</p>
        </div>
      )}

      {/* ── Products & billing ───────────────────────────────────────────── */}
      {tab === 'Products & billing' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <DetailCard title="Products & quota" action={<span className="text-[11px] text-brand">Manage in Account mgmt →</span>}>
            <ProductsQuota c={c} />
          </DetailCard>
          <DetailCard title="Billing history" action={<span className="text-[11px] text-faint">from CRM · Orders</span>}>
            {noProducts && c.account === 'Churn' ? (
              <p className="text-[12px] text-muted">Last order lapsed 31/12/2025. No active billing.</p>
            ) : (
              <Table
                cols={[{ label: 'Doc', w: '1.1fr' }, { label: 'Type', w: '1fr' }, { label: 'Amount', w: '1fr', align: 'r' }, { label: 'Status', w: '1fr', align: 'r' }]}
                rows={[
                  ['ORD-5521', 'Order', '37,800,000 ₫', <Pill tone="active">Fulfilled</Pill>],
                  ['INV-3390', 'Invoice', '37,800,000 ₫', <Pill tone="active">Paid</Pill>],
                  ['PAY-1042', 'Payment', '37,800,000 ₫', <Pill tone="neutral">Bank transfer</Pill>],
                ]}
              />
            )}
            <p className="mt-2 text-[11px] text-faint">Every entitlement traces back to a paid order — provisioned automatically, never picked by hand.</p>
          </DetailCard>
        </div>
      )}

      {/* ── Company page ─────────────────────────────────────────────────── */}
      {tab === 'Company page' && (
        <DetailCard
          title="Company detail page (jobseeker)"
          action={c.jobPosting ? <Pill tone={c.hasPage ? 'active' : 'pending'}>{c.hasPage ? 'Published' : 'Draft'}</Pill> : undefined}
        >
          <CompanyPageEditor c={c} />
        </DetailCard>
      )}

      {/* ── Jobs ─────────────────────────────────────────────────────────── */}
      {tab === 'Jobs' && (
        <div>
          {!c.jobPosting ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">
              This account has no Job Posting product — it can’t post jobs. Resume-Search-only customers are invisible to jobseekers.
            </p>
          ) : jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-canvas/40 px-4 py-8 text-center text-[12px] text-muted">No jobs posted yet.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11.5px] text-muted"><b className="text-ink">{activeJobs}</b> active · <b className="text-ink">{jobs.length}</b> total — using <b className="text-ink">{c.jobTotal - c.jobLeft}/{c.jobTotal}</b> posting slots</p>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by status</span>
              </div>
              <Table
                cols={[{ label: 'Job title', w: '2fr' }, { label: 'Status', w: '1.1fr' }, { label: 'Applicants', w: '0.9fr', align: 'r' }, { label: 'Deadline', w: '1fr', align: 'r' }, { label: 'Actions', w: '1fr', align: 'r' }]}
                rows={jobs.map((j) => [
                  <div className="min-w-0"><p className="truncate font-medium text-ink">{j.title}</p><p className="text-[11px] text-faint">Posted {j.posted}</p></div>,
                  <Pill tone={j.status}>{j.statusLabel}</Pill>,
                  <span className="tabular-nums">{j.applicants || '—'}</span>,
                  <span className="tabular-nums text-muted">{j.deadline}</span>,
                  <RowAction>View</RowAction>,
                ])}
              />
              <p className="mt-2 text-[11px] text-faint">Jobs this account posted (HQ oversight). Company posts go live directly — manage them from Recruitment → Jobs.</p>
            </>
          )}
        </div>
      )}

      {/* ── Applications (employer view, mirrored for HQ) ─────────────────── */}
      {tab === 'Applications' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">Applications received across this account’s jobs — <b className="text-ink">the same list the company sees on their site</b>.</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by job / stage</span>
          </div>
          <Table
            cols={[{ label: 'Candidate', w: '1.4fr' }, { label: 'Applied to', w: '1.8fr' }, { label: 'Stage', w: '1fr' }, { label: 'Applied', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1fr', align: 'r' }]}
            rows={companyApplicants(c).map((a) => [
              <span className="truncate font-medium text-ink">{a.name}</span>,
              <span className="truncate text-muted">{a.job}</span>,
              <Pill tone={a.tone}>{a.stage}</Pill>,
              <span className="text-[11.5px] text-muted">{a.applied}</span>,
              <RowAction>View CV</RowAction>,
            ])}
          />
          <p className="mt-2 text-[11px] text-faint">Read-only for HQ — HQ never moves a company’s candidates through their pipeline, and opening a candidate’s CV is written to the audit log.</p>
        </div>
      )}

      {/* ── Resumes (CV unlocks) ─────────────────────────────────────────── */}
      {tab === 'Resumes' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">CVs this account <b className="text-ink">unlocked from Resume Search</b> — the same list the employer sees on their site. Uses <b className="text-ink">{c.cvTotal - c.cvLeft}/{c.cvTotal}</b> unlocks.</p>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted">▽ Filter by user</span>
          </div>
          <Table
            cols={[{ label: 'Candidate', w: '1.3fr' }, { label: 'Headline', w: '1.8fr' }, { label: 'Unlocked by', w: '1fr' }, { label: 'When', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '0.9fr', align: 'r' }]}
            rows={companyResumeViews(c).map((r) => [
              <span className="truncate font-medium text-ink">{r.name}</span>,
              <span className="truncate text-muted">{r.headline}</span>,
              <span className="truncate text-[11.5px]">{r.by}</span>,
              <span className="text-[11.5px] text-muted">{r.when}</span>,
              <RowAction>Open CV</RowAction>,
            ])}
          />
          <p className="mt-2 text-[11px] text-faint">Each unlock spends 1 from the pooled CV-unlock quota and is written to the immutable audit log.</p>
        </div>
      )}

      {/* ── Activities (log chat / call + timeline) ──────────────────────── */}

      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {quoting && <NewQuotationModal company={c.name} onClose={() => setQuoting(false)} />}
    </div>
  )
}

type CUser = { name: string; email: string; company: string; role: 'HR Manager' | 'HR Specialist'; status: 'Active' | 'Invited' | 'Disabled'; last: string }
const CUSERS: CUser[] = [
  { name: 'Vũ Thanh Linh', email: 'linh@vanphat.vn', company: 'Cty Vạn Phát', role: 'HR Manager', status: 'Active', last: '10m ago' },
  { name: 'Đỗ Thị Mai', email: 'mai@vanphat.vn', company: 'Cty Vạn Phát', role: 'HR Specialist', status: 'Active', last: '2h ago' },
  { name: 'Lý Văn Giang', email: 'giang@fpt.com.vn', company: 'FPT Software', role: 'HR Manager', status: 'Active', last: '1d ago' },
  { name: 'Ngô Minh Tú', email: 'tu@fpt.com.vn', company: 'FPT Software', role: 'HR Specialist', status: 'Invited', last: '—' },
  { name: 'Bùi Thu Hằng', email: 'hang@tiki.vn', company: 'Tiki', role: 'HR Specialist', status: 'Disabled', last: '3 months ago' },
]

function InviteUserModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Invite user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          <LField label="Company (account)" value="Cty Vạn Phát" select />
          <LField label="Email" req value="new.hr@vanphat.vn" />
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Role</p>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2">
              <Pill tone="draft">HR Specialist</Pill>
              <span className="text-[11.5px] text-muted">member — post jobs / search resumes only</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">New users join as HR Specialist (up to 3). There is <b className="text-ink/70">exactly 1 HR Manager</b>, created at conversion — to hand it over, use <b className="text-ink/70">Transfer role</b> on the users list (the current manager becomes a Specialist).</p>
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>🔑</span><span>We email an invite link. The person <b>sets their own password</b> — no one types it for them.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Send invite</button>
        </div>
      </div>
    </div>
  )
}

function TransferManagerModal({ company, users, preselect, onConfirm, onClose }: { company: string; users: CUser[]; preselect?: string; onConfirm: (targetEmail: string) => void; onClose: () => void }) {
  const manager = users.find((u) => u.company === company && u.role === 'HR Manager' && u.status !== 'Disabled')
  const specialists = users.filter((u) => u.company === company && u.role === 'HR Specialist' && u.status === 'Active')
  const [target, setTarget] = useState<string>(preselect ?? specialists[0]?.email ?? '')
  const targetUser = specialists.find((s) => s.email === target)
  const none = specialists.length === 0
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Transfer HR Manager</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3 p-5">
          {none ? (
            <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-800"><span>⚠️</span><span>This account has no active HR Specialist to transfer to. <b>Invite one first</b> — an account must always have exactly one HR Manager.</span></p>
          ) : (
            <>
              <p className="text-[12px] text-muted">Pick who becomes the HR Manager. The current manager moves to HR Specialist. <b className="text-ink/80">No email/login changes for anyone.</b></p>
              <div className="space-y-1.5">
                {specialists.map((s) => (
                  <button key={s.email} onClick={() => setTarget(s.email)} className={cn('flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left', target === s.email ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                    <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', target === s.email ? 'border-brand' : 'border-line')}>{target === s.email && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                    <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-ink">{s.name}</span><span className="block truncate font-mono text-[10.5px] text-faint">{s.email}</span></span>
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-line bg-canvas/40 p-3 text-[11.5px]">
                <p className="mb-1 font-semibold text-ink/70">After transfer</p>
                <p className="flex items-center gap-1.5">{targetUser?.name} <span className="text-faint">→</span> <Pill tone="neutral">HR Manager</Pill></p>
                <p className="mt-1 flex items-center gap-1.5">{manager?.name} (current) <span className="text-faint">→</span> <Pill tone="draft">HR Specialist</Pill></p>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => target && onConfirm(target)} disabled={none || !target} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Transfer role</button>
        </div>
      </div>
    </div>
  )
}

function AdminCompanyUsers() {
  const [inviting, setInviting] = useState(false)
  const [users, setUsers] = useState<CUser[]>(CUSERS)
  const [transfer, setTransfer] = useState<{ company: string; preselect?: string } | null>(null)
  const applyTransfer = (targetEmail: string) => {
    if (!transfer) return
    setUsers((prev) => prev.map((u) => {
      if (u.company !== transfer.company) return u
      if (u.role === 'HR Manager' && u.status !== 'Disabled') return { ...u, role: 'HR Specialist' }
      if (u.email === targetEmail) return { ...u, role: 'HR Manager' }
      return u
    }))
    setTransfer(null)
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
        <button onClick={() => setInviting(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Invite user</button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-2.5"><Pill tone="neutral">HR Manager · exactly 1</Pill><p className="mt-1.5 text-[11px] text-muted">Owner / super admin — everything, plus manage users & billing.</p></div>
        <div className="rounded-lg border border-line p-2.5"><Pill tone="draft">HR Specialist · up to 3</Pill><p className="mt-1.5 text-[11px] text-muted">Member — post jobs / search resumes only.</p></div>
      </div>

      <TabBar tabs={[{ label: 'All users', count: 1140, active: true }, { label: 'Active', count: 1020 }, { label: 'Invited', count: 96 }, { label: 'Disabled', count: 24 }]} />
      <Table
        cols={[
          { label: 'User', w: '1.5fr' }, { label: 'Company (account)', w: '1.2fr' }, { label: 'Role', w: '1.1fr' },
          { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.5fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
          <span className="truncate">{u.company}</span>,
          <Pill tone={u.role === 'HR Manager' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          <Pill tone={u.status === 'Active' ? 'active' : u.status === 'Invited' ? 'pending' : 'expired'}>{u.status}</Pill>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Invited'
              ? <><RowAction tone="brand">Resend</RowAction><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <RowAction tone="brand">Re-enable</RowAction>
                : u.role === 'HR Manager'
                  ? <button onClick={() => setTransfer({ company: u.company })} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Transfer role</button>
                  : <><button onClick={() => setTransfer({ company: u.company, preselect: u.email })} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Make manager</button><RowAction tone="rose">Disable</RowAction></>}
          </div>,
        ])}
      />
      <Footer text="Showing 5 of 1,140 · a self-signup can also request to join a company → the HR Manager approves it here" />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">Exactly 1 HR Manager. Making someone HR Manager <b>transfers</b> the role — the current manager becomes a Specialist; no email/login changes. If the sole manager is ever gone, HQ can reassign it.</p>
      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {transfer && <TransferManagerModal company={transfer.company} users={users} preselect={transfer.preselect} onConfirm={applyTransfer} onClose={() => setTransfer(null)} />}
    </div>
  )
}

/* ── User — jobseeker accounts ────────────────────────────────────────────────
 * HQ view of the seeker side of the marketplace (module: Job seeker user
 * management). Accounts are born on the Jobseeker site — email + password or one
 * of the 4 social logins — so HQ's job here is search → inspect → activate /
 * deactivate, never "type someone's password". Sign-up method and email
 * verification are first-class columns because they explain most support cases.
 * -------------------------------------------------------------------------- */
type JSSignup = 'Email' | 'Google' | 'Facebook' | 'LinkedIn' | 'GitHub'
type JSStatus = 'Active' | 'Unverified' | 'Deactivated' | 'Withdrawn'
type JSUser = {
  id: number
  name: string
  email: string
  phone: string
  location: string
  headline: string
  signup: JSSignup
  status: JSStatus
  complete: number
  resumes: number
  applications: number
  joined: string
  last: string
}
const JS_STATUS: Record<JSStatus, StatusTone> = { Active: 'active', Unverified: 'pending', Deactivated: 'expired', Withdrawn: 'rejected' }
const JS_USERS: JSUser[] = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0903 112 445', location: 'Hồ Chí Minh', headline: 'Frontend Engineer · 4 yrs', signup: 'Email', status: 'Active', complete: 92, resumes: 2, applications: 14, joined: '12/03/2025', last: '10m ago' },
  { id: 2, name: 'Trần Thị Bích', email: 'bich.tran@gmail.com', phone: '0912 668 201', location: 'Hà Nội', headline: 'Digital Marketing · 6 yrs', signup: 'Google', status: 'Active', complete: 78, resumes: 1, applications: 8, joined: '04/01/2026', last: '3h ago' },
  { id: 3, name: 'Lê Hoàng Cường', email: 'cuong.le@outlook.com', phone: '0977 340 118', location: 'Hồ Chí Minh', headline: 'Product Manager · 8 yrs', signup: 'LinkedIn', status: 'Active', complete: 100, resumes: 3, applications: 27, joined: '22/08/2024', last: '1d ago' },
  { id: 4, name: 'Phạm Thu Dung', email: 'dung.pham@gmail.com', phone: '—', location: 'Đà Nẵng', headline: 'Kế toán tổng hợp · 3 yrs', signup: 'Email', status: 'Unverified', complete: 24, resumes: 0, applications: 0, joined: '26/07/2026', last: '—' },
  { id: 5, name: 'Vũ Minh Đức', email: 'duc.vu@gmail.com', phone: '0908 771 903', location: 'Hồ Chí Minh', headline: 'Backend Engineer · 5 yrs', signup: 'Facebook', status: 'Active', complete: 61, resumes: 1, applications: 3, joined: '15/05/2026', last: '2 weeks ago' },
  { id: 6, name: 'Đặng Thu Trang', email: 'trang.dang@gmail.com', phone: '0356 220 447', location: 'Hải Phòng', headline: 'QA Engineer · 2 yrs', signup: 'GitHub', status: 'Deactivated', complete: 46, resumes: 1, applications: 5, joined: '03/02/2025', last: '3 months ago' },
  { id: 7, name: 'Hoàng Bảo Ngọc', email: 'ngoc.hoang@gmail.com', phone: '0938 015 662', location: 'Hà Nội', headline: 'HR Specialist · 3 yrs', signup: 'Email', status: 'Withdrawn', complete: 88, resumes: 0, applications: 11, joined: '19/09/2024', last: '1 month ago' },
]

/** Sign-up channel as a compact chip — email vs one of the 4 social providers. */
function SignupChip({ via }: { via: JSSignup }) {
  const dot: Record<JSSignup, string> = { Email: 'bg-slate-400', Google: 'bg-rose-500', Facebook: 'bg-blue-600', LinkedIn: 'bg-sky-600', GitHub: 'bg-slate-800' }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink/75">
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot[via])} />
      {via}
    </span>
  )
}

/** Profile-completeness bar — the number My page shows the seeker. */
function Meter({ pct }: { pct: number }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {/* fixed width, not w-full — the cell is shrink-to-fit, so a percentage width collapses */}
      <span className="h-1.5 w-[58px] shrink-0 overflow-hidden rounded-full bg-line">
        <span className={cn('block h-full rounded-full', pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-400')} style={{ width: `${pct}%` }} />
      </span>
      <span className="shrink-0 text-[11px] tabular-nums text-muted">{pct}%</span>
    </span>
  )
}

function AdminJobseekers() {
  const [users, setUsers] = useState<JSUser[]>(JS_USERS)
  const [detail, setDetail] = useState<JSUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const setStatus = (id: number, status: JSStatus) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
  const create = (name: string, email: string) => {
    setUsers((prev) => [
      { id: Math.max(0, ...prev.map((u) => u.id)) + 1, name, email, phone: '—', location: '—', headline: '—', signup: 'Email', status: 'Unverified', complete: 10, resumes: 0, applications: 0, joined: '28/07/2026', last: '—' },
      ...prev,
    ])
    setCreating(false)
    setToast(`Set-password link sent to ${email} — the account stays Unverified until they open it.`)
  }

  if (detail) {
    const live = users.find((u) => u.id === detail.id) ?? detail
    return <JobseekerDetail u={live} onBack={() => setDetail(null)} onStatus={(s) => setStatus(live.id, s)} />
  }

  const n = (s: JSStatus) => users.filter((u) => u.status === s).length
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[62ch] text-[11.5px] text-muted">
          Every jobseeker account on the Store site. Seekers sign themselves up (email + password or 1 of 4 social logins) — HQ searches, inspects and activates / deactivates. Click a name to open the account.
        </p>
        <button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ New user</button>
      </div>

      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>✅ {toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Accounts" value="128,412" sub="all time" />
        <MiniStat label="Active" value="121,006" sub="verified + usable" />
        <MiniStat label="Unverified" value="4,318" sub="email not confirmed" tone="warn" />
        <MiniStat label="Deactivated" value="1,942" sub="blocked by HQ" />
        <MiniStat label="Withdrawn" value="1,146" sub="seeker-initiated" />
        <MiniStat label="New this month" value="3,204" sub="▲ 12% vs Jun" />
      </div>

      <TabBar
        tabs={[
          { label: 'All', count: users.length, active: true },
          { label: 'Active', count: n('Active') },
          { label: 'Unverified', count: n('Unverified') },
          { label: 'Deactivated', count: n('Deactivated') },
          { label: 'Withdrawn', count: n('Withdrawn') },
        ]}
      />
      <Table
        minW={1120}
        cols={[
          { label: 'Jobseeker', w: '1.6fr' },
          { label: 'Signed up via', w: '0.9fr' },
          { label: 'Profile', w: '0.9fr' },
          { label: 'CVs', w: '0.5fr', align: 'r' },
          { label: 'Applied', w: '0.6fr', align: 'r' },
          { label: 'Status', w: '0.9fr' },
          { label: 'Joined', w: '0.8fr', align: 'r' },
          { label: 'Last login', w: '0.9fr', align: 'r' },
          { label: 'Actions', w: '1.7fr', align: 'r' },
        ]}
        rows={users.map((u) => [
          <button onClick={() => setDetail(u)} className="min-w-0 text-left">
            <p className="truncate text-[12.5px] font-medium text-brand hover:underline">{u.name}</p>
            <p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p>
          </button>,
          <SignupChip via={u.signup} />,
          <Meter pct={u.complete} />,
          <span className="tabular-nums">{u.resumes || '—'}</span>,
          <span className="tabular-nums font-medium text-brand">{u.applications || '—'}</span>,
          <Pill tone={JS_STATUS[u.status]}>{u.status}</Pill>,
          <span className="tabular-nums text-muted">{u.joined}</span>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Unverified' ? (
              <>
                <button onClick={() => setToast(`Verification email re-sent to ${u.email}.`)} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Resend</button>
                <button onClick={() => setStatus(u.id, 'Active')} title="Demo: simulate the seeker clicking their verification link" className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Simulate verify</button>
              </>
            ) : u.status === 'Deactivated' ? (
              <button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Reactivate</button>
            ) : u.status === 'Withdrawn' ? (
              <span className="text-[10.5px] text-faint">seeker-initiated · restore on request</span>
            ) : (
              <>
                <button onClick={() => setDetail(u)} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">View</button>
                <button onClick={() => setStatus(u.id, 'Deactivated')} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Deactivate</button>
              </>
            )}
          </div>,
        ])}
      />
      <Footer text="Showing 7 of 128,412 — search by name / email / phone · filter by status, sign-up method, location, joined date" />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Interactive prototype — <b>Simulate verify</b> flips an Unverified row to Active; <b>Deactivate</b> / <b>Reactivate</b> toggle a row. <b>Deactivated</b> is an HQ block (login refused, resumes hidden from Resume Search); <b>Withdrawn</b> is the seeker deactivating their own account from My page. Opening an account or its CV is PII access — always written to the audit log.
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
        Open questions for the client: retention for withdrawn accounts (grace period before hard delete) · whether HQ may create seeker accounts at all · merge policy when the same email arrives by email sign-up and by social login.
      </p>

      {creating && <NewJobseekerModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}

function NewJobseekerModal({ onCreate, onClose }: { onCreate: (name: string, email: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const valid = name.trim() && /.+@.+\..+/.test(email)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[460px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">New jobseeker user</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          <p className="flex gap-2 rounded-md bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
            <span>⚠️</span><span>The normal path is self sign-up on the Store site. Use this only for support cases (e.g. a seeker who can't complete sign-up) — it does not replace registration.</span>
          </p>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Full name <span className="text-rose-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nguyễn Thị Hà" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Email <span className="text-rose-500">*</span></label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <LField label="Phone" value="optional — seeker completes it on My page" />
          <LField label="Location" value="Hồ Chí Minh" select hint="From Master data → Locations. Everything else (headline, CV, job preferences) is filled in by the seeker." />
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand">
            <span>🔑</span><span>We email a set-password link. The seeker <b>sets their own password</b> — no one types it for them. The account stays <b>Unverified</b> until they open the link, then flips to <b>Active</b>.</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onCreate(name.trim(), email.trim())} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">✉ Create &amp; send link</button>
        </div>
      </div>
    </div>
  )
}

/** One seeker account — what My page holds, plus their CVs and applications. */
function JobseekerDetail({ u, onBack, onStatus }: { u: JSUser; onBack: () => void; onStatus: (s: JSStatus) => void }) {
  const CVS: [string, 'public' | 'private', string, number][] = [
    ['CV_NguyenVanAn_Frontend_EN.pdf', 'public', 'Updated 2 days ago', 6],
    ['CV tiếng Việt — Frontend', 'private', 'Updated 3 weeks ago', 0],
  ]
  const APPS: [string, string, StatusTone, string, string][] = [
    ['Senior Frontend Engineer (ReactJS)', 'FPT Software', 'pending', 'Interview', '2h ago'],
    ['Product Manager', 'MoMo', 'neutral', 'Screening', '5d ago'],
    ['Backend Engineer (Go)', 'Shopee', 'rejected', 'Rejected', '2 months ago'],
  ]
  return (
    <div className="max-w-[960px]">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Jobseeker users</button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{u.name} <Pill tone={JS_STATUS[u.status]}>{u.status}</Pill></h2>
          <p className="text-[11.5px] text-muted">{u.headline} · {u.location} · <span className="font-mono">{u.email}</span></p>
        </div>
        <div className="flex shrink-0 gap-2">
          {u.status === 'Unverified' && <button className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Resend verification</button>}
          {u.status === 'Deactivated' || u.status === 'Withdrawn'
            ? <button onClick={() => onStatus('Active')} className="rounded-lg border border-brand/30 bg-brand-soft px-3.5 py-2 text-[12.5px] font-medium text-brand hover:bg-brand hover:text-white">Reactivate</button>
            : <button onClick={() => onStatus('Deactivated')} className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12.5px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Deactivate</button>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Profile" value={`${u.complete}%`} sub="completeness" tone={u.complete < 50 ? 'warn' : undefined} />
        <MiniStat label="CVs" value={u.resumes || '—'} sub={`${CVS.filter((c) => c[1] === 'public').length} public`} />
        <MiniStat label="Applications" value={u.applications || '—'} sub="all time" />
        <MiniStat label="CV unlocks" value="6" sub="by employers" />
        <MiniStat label="Joined" value={u.joined} sub={`via ${u.signup}`} />
        <MiniStat label="Last login" value={u.last} sub="web · Chrome" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetailCard title="Account">
          <KV label="Full name" value={u.name} />
          <KV label="Email (login)" value={u.email} />
          <KV label="Email verified" value={u.status === 'Unverified' ? 'No — verification pending' : 'Yes'} />
          <KV label="Sign-up method" value={u.signup === 'Email' ? 'Email + password' : `${u.signup} (social login)`} />
          <KV label="Phone" value={u.phone} />
          <KV label="Location" value={u.location} />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            HQ never sees or sets a password. Password reset is a self-service email link; social-login accounts have no password at all.
          </p>
        </DetailCard>

        <DetailCard title="My page — profile & job preferences">
          <div className="mb-2"><Meter pct={u.complete} /></div>
          <KV label="Headline" value={u.headline} />
          <KV label="Desired role" value="Software Developer · IT" />
          <KV label="Job type" value="Full-time" />
          <KV label="Expected salary" value="35 – 45 tr VND / month" />
          <KV label="Preferred locations" value="Hồ Chí Minh · Remote" />
          <KV label="Open to offers" value="Yes — visible in Resume Search" />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Read-only for HQ. The seeker edits these on My page; the vocabularies come from Master data.
          </p>
        </DetailCard>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">CVs / resumes</p>
        <Table
          minW={640}
          cols={[{ label: 'CV', w: '2fr' }, { label: 'Visibility', w: '0.9fr' }, { label: 'Updated', w: '1fr' }, { label: 'Unlocked by', w: '0.9fr', align: 'r' }, { label: '', w: '0.7fr', align: 'r' }]}
          rows={CVS.map((c) => [
            <span className="truncate text-[12.5px] text-ink/85">{c[0]}</span>,
            <Pill tone={c[1] === 'public' ? 'active' : 'draft'}>{c[1] === 'public' ? 'Public' : 'Private'}</Pill>,
            <span className="text-[11.5px] text-muted">{c[2]}</span>,
            <span className="tabular-nums">{c[3] ? `${c[3]} employers` : '—'}</span>,
            <RowAction>Open CV</RowAction>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">🔒 Opening a CV is a PII view — logged with the operator, the record and the timestamp. Private CVs never appear in Resume Search.</p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">Applications</p>
        <Table
          minW={640}
          cols={[{ label: 'Job', w: '1.9fr' }, { label: 'Company', w: '1fr' }, { label: 'Stage', w: '0.9fr' }, { label: 'Applied', w: '0.8fr', align: 'r' }]}
          rows={APPS.map((a) => [
            <span className="truncate text-[12.5px] text-ink/85">{a[0]}</span>,
            <span className="truncate">{a[1]}</span>,
            <Pill tone={a[2]}>{a[3]}</Pill>,
            <span className="text-[11.5px] text-muted">{a[4]}</span>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Read-only mirror of what the seeker sees under “Applied jobs” — HQ never moves a candidate's stage; that is the employer's call.</p>
      </div>
    </div>
  )
}

/* ── Content ──────────────────────────────────────────────────────────────── */
function AdminBanners() {
  const rows = [
    ['Hero — Tết 2026 campaign', 'Home hero', '01/01 – 15/02', <Pill tone="active">Live</Pill>, '12,480'],
    ['Long banner — IT jobs', 'Home mid', '10/07 – 10/08', <Pill tone="active">Live</Pill>, '4,220'],
    ['Square — Resume builder', 'Sidebar', '01/08 – 31/08', <Pill tone="pending">Scheduled</Pill>, '—'],
    ['Hero — Employer promo', 'Home hero', '20/06 – 30/06', <Pill tone="expired">Ended</Pill>, '9,110'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Banner', w: '1.8fr' }, { label: 'Slot', w: '1fr' }, { label: 'Schedule', w: '1.2fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Clicks', w: '0.8fr', align: 'r' }]}
      rows={rows}
      footer="Banners render in Store Home sections & Curation — slots link to paid ad products"
    />
  )
}
function AdminPopups() {
  const rows = [
    ['Welcome — new visitors', 'Guests', 'Always on', <Pill tone="active">Live</Pill>, '1 / session'],
    ['Survey — NPS', 'Logged-in seekers', '01/08 – 14/08', <Pill tone="pending">Scheduled</Pill>, '1 / week'],
    ['Promo — Employer trial', 'Employers', '—', <Pill tone="draft">Draft</Pill>, '—'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Popup', w: '1.6fr' }, { label: 'Audience', w: '1.2fr' }, { label: 'Schedule', w: '1.2fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Frequency', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Targeting + scheduling + frequency capping (don’t re-show)"
    />
  )
}
function AdminPages() {
  const rows = [
    ['About Saramin Vietnam', '/about', '12/06/2026', <Pill tone="active">Published</Pill>],
    ['Terms of Service', '/legal/terms', '01/05/2026', <Pill tone="active">Published</Pill>],
    ['Privacy Policy', '/legal/privacy', '01/05/2026', <Pill tone="active">Published</Pill>],
    ['Service guide — Employers', '/guide/employer', '20/07/2026', <Pill tone="draft">Draft</Pill>],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 24, active: true }, { label: 'Published', count: 19 }, { label: 'Draft', count: 5 }]}
      cols={[{ label: 'Page', w: '1.8fr' }, { label: 'Slug', w: '1.4fr' }, { label: 'Updated', w: '1fr' }, { label: 'Status', w: '0.9fr', align: 'r' }]}
      rows={rows}
      footer="CMS pages (prototype) — full CMS vs banners+popups-only is a launch-scope decision"
    />
  )
}
function AdminBoards() {
  const rows = [
    ['Thông báo hệ thống', 'Notice', '18', '2 days ago'],
    ['Câu hỏi thường gặp', 'Help', '42', '1 week ago'],
    ['Cẩm nang nghề nghiệp', 'Career', '65', '3 days ago'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Board', w: '1.8fr' }, { label: 'Type', w: '1fr' }, { label: 'Posts', w: '0.7fr', align: 'r' }, { label: 'Updated', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Content boards (prototype) — needs BE migration if in launch scope"
    />
  )
}
function AdminBlog() {
  const rows = [
    ['10 kỹ năng phỏng vấn cần biết', 'Ban biên tập', 'Cẩm nang', <Pill tone="active">Published</Pill>, '12/07/2026'],
    ['Xu hướng tuyển dụng IT 2026', 'Ban biên tập', 'Thị trường', <Pill tone="active">Published</Pill>, '01/07/2026'],
    ['Cách viết CV chuẩn ATS', 'Ban biên tập', 'Cẩm nang', <Pill tone="draft">Draft</Pill>, '—'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Article', w: '2fr' }, { label: 'Author', w: '1fr' }, { label: 'Category', w: '1fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Published', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Article model exists; menu hidden pending BE migration"
    />
  )
}

/* ── Billing & products ───────────────────────────────────────────────────── */
/* The five product TYPES, derived from the client Products deck. The type is the
   discriminator that decides what "fulfilment" means, so it drives which fields
   the create form asks for — see NewProductModal. */
const PRODUCT_TYPES = [
  { id: 'tier', label: 'Posting tier', blurb: 'Buy N posting slots; publishing a job spends one', eg: 'Basic · Basic Plus · Distinction · Top Job' },
  { id: 'placement', label: 'Placement booking', blurb: 'A time window on a slot, capacity-capped', eg: 'Main banner · Feature company · Adsense · Popup' },
  { id: 'credit', label: 'Credit pack', blurb: 'Quota + validity, spent per unlock', eg: 'COMBO 30 / 50 / 100 / 300 CV unlocks' },
  { id: 'addon', label: 'Add-on (attach-only)', blurb: 'Rides on a parent tier, never sold alone', eg: 'Premium fixed slots · “HOT” label' },
  { id: 'service', label: 'Manual service', blurb: 'Ops fulfils it — creates a task, not an entitlement', eg: 'Fanpage post · Email / Job Alert banner' },
] as const
type ProductTypeId = (typeof PRODUCT_TYPES)[number]['id']

function AdminCatalog() {
  const rows = [
    ['Tin Top Job', 'Posting tier', '15,000,000 ₫', '10 slots · 30 days each', <Pill tone="active">Active</Pill>],
    ['COMBO 50 — CV unlocks', 'Credit pack', '3,700,000 ₫', '50 unlocks · 30 days', <Pill tone="active">Active</Pill>],
    ['Main Banner (Home hero)', 'Placement booking', '8,000,000 ₫', 'Per week · 1 of 6 slots', <Pill tone="active">Active</Pill>],
    ['Popular Jobs — premium slot', 'Add-on (attach-only)', '3,000,000 ₫', 'Per job · 4 positions', <Pill tone="active">Active</Pill>],
    ['TopDev fanpage post', 'Manual service', '5,000,000 ₫', '1 post · SLA 3 days', <Pill tone="draft">Draft</Pill>],
  ]
  // The "+ New product" button lives on the page title row in the shell
  // (PRIMARY_ACTION in AdminWireframe), which also opens NewProductModal.
  return (
    <ListPage
      cols={[{ label: 'Product', w: '1.8fr' }, { label: 'Type', w: '1.2fr' }, { label: 'Price', w: '1fr', align: 'r' }, { label: 'Fulfilment', w: '1.3fr' }, { label: 'Status', w: '0.8fr', align: 'r' }]}
      rows={rows}
      minW={820}
      footer="Every product maps to an entitlement (product + remaining quota + validity) — the record downstream screens read and decrement"
    />
  )
}

/* Create product. The type picker is step 1 because it changes the rest of the
   form — a placement needs a slot + calendar, a credit pack needs an amount, a
   manual service needs an SLA and an owner. One flat form can't express that. */
export function NewProductModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<ProductTypeId>('tier')
  const [nameVi, setNameVi] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState('50')
  const valid = nameVi.trim().length > 0 && sku.trim().length > 0

  const priceNum = Number(price.replace(/\D/g, ''))
  const amountNum = Number(amount.replace(/\D/g, ''))
  const perCv = priceNum > 0 && amountNum > 0 ? Math.round(priceNum / amountNum) : null
  const vnd = (n: number) => n.toLocaleString('vi-VN')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[620px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">New product</p>
            <p className="text-[11px] text-muted">A product is the sellable SKU — price + terms. What it grants comes from its type.</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="space-y-3.5 p-5">
          <Section title="1 · Type" className="mt-0" />
          <div className="grid gap-1.5">
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors',
                  type === t.id ? 'border-brand bg-brand-soft' : 'border-line hover:border-ink/30',
                )}
              >
                <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border', type === t.id ? 'border-brand' : 'border-line')}>
                  {type === t.id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-[12.5px] font-semibold', type === t.id ? 'text-brand' : 'text-ink')}>{t.label}</span>
                  <span className="block text-[11px] leading-relaxed text-muted">{t.blurb}</span>
                  <span className="block text-[10.5px] text-faint">e.g. {t.eg}</span>
                </span>
              </button>
            ))}
          </div>

          <Section title="2 · Identity" />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel req>Name (VN)</FLabel>
              <input value={nameVi} onChange={(e) => setNameVi(e.target.value)} placeholder="e.g. Tin Top Job" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
            <div>
              <FLabel>Name (EN)</FLabel>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Top Job posting" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel req>SKU code</FLabel>
              <input value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} placeholder="TOPJOB-10" className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
            </div>
            <SelectField label="Sales category" req value="Đăng tin tuyển dụng" options={['Dịch vụ Trang chủ', 'Dịch vụ Trang Tìm kiếm', 'Đăng tin tuyển dụng', 'Tìm kiếm CV', 'Nâng cao — thương hiệu']} />
          </div>
          <TArea label="Sales description" value="Bilingual blurb shown on the quotation and the company Store." rows={2} />

          <Section title="3 · Fulfilment" />
          {type === 'tier' && (
            <>
              <SelectField label="Tier" req value="Top Job" options={['Basic', 'Basic Plus', 'Distinction', 'Top Job']} extra={<span className="ml-1 font-normal text-faint">— benefits come from tier config, not typed here</span>} />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Posting slots" req value="10 slots" hint="Publishing a job spends one slot of this tier." />
                <LField label="Slots must be used within" value="12 months from activation" select />
              </div>
              <LField label="Publishes to" value="TopDev.vn + Saramin.vn" select />
              <p className="rounded-md bg-canvas/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
                <b className="text-ink/70">Top Job grants (read-only):</b> 30 days display · refresh daily for 7 days then every 5 · green title + background · 3 benefits in search · highest search rank · “HOT JOB” label 10 days · Super Hot Jobs 10 days · Popular Jobs.
              </p>
            </>
          )}
          {type === 'placement' && (
            <>
              <SelectField label="Placement slot" req value="Main Banner — Home hero (1536×371)" options={['Main Banner — Home hero (1536×371)', 'Banner adsense — Home (1260×120)', 'Banner adsense — Search (425×160)', 'Feature company logo — Home', 'Top Companies Hiring Now — Home', 'Highlight Company — Search', 'Homepage popup']} />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Booking unit" req value="Per week" select />
                <LField label="Slots consumed" value="1 of 6 in rotation" hint="Pool is capped — sales must check the calendar before quoting." />
              </div>
              <LField label="Creative source" value="Client-supplied image + redirect link" select />
              <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                ⚠️ Inherited from the slot: 1 banner shown at a time, rotates every 3s, max 6 · title ≤ 50 chars, description ≤ 100, CTA ≤ 10. <b>Availability calendar</b> needed — this slot is sold out for weeks where 6 bookings already overlap.
              </p>
            </>
          )}
          {type === 'credit' && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Credit type" req value="CV unlock" select />
                <div>
                  <FLabel req>Amount</FLabel>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="50" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
                </div>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Validity" req value="30 days" select hint="Deck sells 30-day and 90-day packs." />
                <LField label="Unused credits on repurchase" value="Roll over" select />
              </div>
            </>
          )}
          {type === 'addon' && (
            <>
              <LField label="Attaches to" req value="Distinction · Top Job" select hint="Never sold standalone — it only appears on a quotation line under its parent tier." />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Capacity" req value="4 fixed positions" hint="Shared, finite inventory — needs the same availability check as a placement." />
                <LField label="Duration" value="10 days from job publish" select />
              </div>
            </>
          )}
          {type === 'service' && (
            <>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <LField label="Fulfilment SLA" req value="3 working days" select />
                <LField label="Owning team" req value="Marketing — TopDev" select />
              </div>
              <TArea label="Inputs required from the buyer" value="Post copy · image · target audience · preferred publish date" rows={2} />
              <p className="rounded-md bg-brand-soft px-3 py-2 text-[11px] leading-relaxed text-brand">
                🛠 Paying this does <b>not</b> auto-provision quota. It opens a fulfilment task (Requested → Scheduled → Delivered) and needs proof-of-delivery before the line counts as fulfilled.
              </p>
            </>
          )}

          <Section title="4 · Pricing" />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <FLabel req>Price (₫)</FLabel>
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" placeholder="3700000" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
              {priceNum > 0 && <p className="mt-1 text-[10.5px] text-faint">{vnd(priceNum)} ₫</p>}
            </div>
            <LField label="Floor price" value="Lowest a sales rep may discount to" hint="Below this needs manager approval on the quotation." />
          </div>
          {type === 'credit' && (
            <p className="rounded-md bg-canvas/70 px-3 py-2 text-[11px] text-muted">
              Average per CV: <b className="text-ink/80">{perCv ? `~${vnd(perCv)} ₫ / CV` : '— enter price and amount'}</b> — computed, never typed. This is the number the deck sells on.
            </p>
          )}
          <LField label="Visibility" value="Sales-quote only" select hint="Public self-serve · Sales-quote only · Package-only." />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink/80 hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-40">Save as draft</button>
          <button onClick={onClose} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create &amp; activate</button>
        </div>
      </div>
    </div>
  )
}
function AdminBundles() {
  const rows = [
    ['Recruit Starter', 'Job Posting Pro + 1 boost', '17,000,000 ₫', <Pill tone="active">Active</Pill>],
    ['Recruit Growth', 'Job Posting Pro + Resume Search', '32,000,000 ₫', <Pill tone="active">Active</Pill>],
    ['Enterprise', 'All products + Talent pool', 'Custom', <Pill tone="draft">Draft</Pill>],
  ]
  return (
    <ListPage
      cols={[{ label: 'Package', w: '1.2fr' }, { label: 'Includes', w: '2fr' }, { label: 'Package price', w: '1.1fr', align: 'r' }, { label: 'Status', w: '0.8fr', align: 'r' }]}
      rows={rows}
      footer="Packages = several products at one package price (maps to Store “Recruit package”)"
    />
  )
}
function AdminCredits() {
  const rows = [
    ['Công ty Vạn Phát', '80 CV unlocks', '−20 (unlock)', 'System', '10m ago'],
    ['FPT Software', '1,240 credits', '+500 (grant)', 'Phạm Quang Huy', '2h ago'],
    ['Tiki', '320 credits', '−15 (unlock)', 'System', '1d ago'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Company', w: '1.5fr' }, { label: 'Balance', w: '1fr', align: 'r' }, { label: 'Last change', w: '1fr', align: 'r' }, { label: 'By', w: '1fr', align: 'r' }, { label: 'When', w: '0.8fr', align: 'r' }]}
      rows={rows}
      footer="Every change writes to an auditable credit ledger · blocked on credits-vs-cash decision"
    />
  )
}
function AdminOrders() {
  const rows = [
    ['ORD-5521', 'Công ty Vạn Phát', '37,800,000 ₫', <Pill tone="active">Fulfilled</Pill>, '26/05/2026'],
    ['ORD-5522', 'Việt Tiến Logistics', '22,000,000 ₫', <Pill tone="pending">Pending payment</Pill>, '01/06/2026'],
    ['ORD-5523', 'Hoàng Gia', '8,000,000 ₫', <Pill tone="neutral">Paid</Pill>, '03/06/2026'],
    ['ORD-5524', 'Tiki', '32,000,000 ₫', <Pill tone="draft">Draft</Pill>, '05/06/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 312, active: true }, { label: 'Pending payment', count: 14 }, { label: 'Paid', count: 40 }, { label: 'Fulfilled', count: 250 }]}
      cols={[{ label: 'Order', w: '1fr' }, { label: 'Company', w: '1.6fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.1fr' }, { label: 'Date', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Draft → Pending payment → Paid → Fulfilled — no gateway wired yet"
    />
  )
}
function AdminPromotions() {
  const rows = [
    ['TET2026', '−20%', 'All products', '01/01 – 15/02', '128 / 500'],
    ['NEWEMP', '−1,000,000 ₫', 'Job Posting Pro', '01/07 – 31/08', '44 / ∞'],
    ['SUMMER', '−10%', 'Bundles', 'Ended', '210 / 200'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Code', w: '1fr' }, { label: 'Discount', w: '1fr' }, { label: 'Applies to', w: '1.4fr' }, { label: 'Validity', w: '1.2fr' }, { label: 'Uses', w: '0.9fr', align: 'r' }]}
      rows={rows}
      footer="Prototype only — decide promote-to-backend or drop"
    />
  )
}

/* ── Sales / CRM ──────────────────────────────────────────────────────────────
   LEGACY board. This is an older mockup of the same Sales pipeline that the
   Companies board (CompaniesBoard, sourced from COMPANIES) now covers, with its
   own stage vocabulary (Lead / Won) and its own demo rows. It shares the ONE
   idle RULE via idleOf() above, but it still carries its own `idle` numbers — so
   a company appearing in both shows two different day counts. Idle is a property
   of the COMPANY; this duplicate field should go when the board is retired in
   favour of the company-sourced one. */
type Deal = { company: string; stage: string; tone: StatusTone; value: number; owner: string; idle: number; next: string }
const DEALS: Deal[] = [
  { company: 'Cty Việt Tiến Logistics', stage: 'Negotiation', tone: 'pending', value: 369_900_000, owner: 'Trần Quốc Trung', idle: 21, next: 'Chase signed contract' },
  { company: 'Cty Tinh Hoa Công Nghệ', stage: 'Negotiation', tone: 'pending', value: 111_700_000, owner: 'Nguyễn Thị Lan', idle: 18, next: 'Negotiate discount' },
  { company: 'Cty Vạn Phát', stage: 'Negotiation', tone: 'pending', value: 133_500_000, owner: 'Nguyễn Thị Lan', idle: 12, next: 'Send revised quote' },
  { company: 'Cty Hoàng Gia', stage: 'Proposal', tone: 'neutral', value: 171_100_000, owner: 'Nguyễn Thị Lan', idle: 9, next: 'Follow up on proposal' },
  { company: 'Cty Hồng Đức', stage: 'Qualified', tone: 'neutral', value: 128_000_000, owner: 'Phạm Quang Huy', idle: 6, next: 'Schedule product demo' },
  { company: 'Cty Sao Mai', stage: 'Proposal', tone: 'neutral', value: 98_400_000, owner: 'Phạm Quang Huy', idle: 3, next: 'Prepare proposal' },
  { company: 'Cty Thiên Long', stage: 'Lead', tone: 'draft', value: 476_900_000, owner: 'Trần Quốc Trung', idle: 2, next: 'Qualify budget & need' },
  { company: 'Cty Trường Sơn', stage: 'Won', tone: 'active', value: 231_300_000, owner: 'Phạm Quang Huy', idle: 1, next: 'Activate account' },
  { company: 'Cty Á Châu', stage: 'Lost', tone: 'rejected', value: 115_500_000, owner: 'Nguyễn Thị Lan', idle: 30, next: 'Re-engage next quarter' },
]
const STAGES: { key: string; tone: StatusTone }[] = [
  { key: 'Lead', tone: 'draft' }, { key: 'Qualified', tone: 'neutral' }, { key: 'Proposal', tone: 'neutral' },
  { key: 'Negotiation', tone: 'pending' }, { key: 'Won', tone: 'active' }, { key: 'Lost', tone: 'rejected' },
]
const isOpen = (s: string) => s !== 'Won' && s !== 'Lost'
const money = (v: number) => (v / 1e6).toFixed(1) + 'M ₫'

/** Same flat no-contact thresholds as the Companies list — see idleOf above. */
function IdlePill({ days }: { days: number }) {
  const rot = idleOf(days)
  return <Pill tone={rot === 'red' ? 'rejected' : rot === 'amber' ? 'pending' : 'draft'}>Idle {days}d</Pill>
}

function PipelineTable({ onConvert, onOpen }: { onConvert: (d: Deal) => void; onOpen: (d: Deal) => void }) {
  // priority sort: open deals by most-idle-first (rotting), Won/Lost sink to bottom
  const sorted = [...DEALS].sort((a, b) => (isOpen(b.stage) ? b.idle : -1) - (isOpen(a.stage) ? a.idle : -1))
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">Sort: <b className="font-medium text-ink">Priority — most idle first</b> ▾</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">▽ Filter</span>
        <span className="text-faint">by owner · stage · industry · idle</span>
      </div>
      <Table
        cols={[
          { label: 'Company', w: '2fr' }, { label: 'Stage', w: '1.1fr' }, { label: 'Value', w: '0.9fr', align: 'r' },
          { label: 'Owner', w: '1.2fr' }, { label: 'Idle', w: '0.9fr' }, { label: 'Next step', w: '1.6fr' },
        ]}
        rows={sorted.map((d) => [
          <div className="min-w-0">
            <button onClick={() => onOpen(d)} className="block max-w-full truncate text-left font-medium text-brand hover:underline">{d.company}</button>
            {d.stage === 'Won' && (
              <button onClick={() => onConvert(d)} className="mt-1 inline-flex rounded-md bg-emerald-600 px-2 py-0.5 text-[10.5px] font-semibold text-white hover:opacity-90">⚡ Convert →</button>
            )}
          </div>,
          <Pill tone={d.tone}>{d.stage}</Pill>,
          <span className="tabular-nums">{money(d.value)}</span>,
          <span className="truncate">{d.owner}</span>,
          <IdlePill days={d.idle} />,
          <span className="truncate text-muted">{d.next}</span>,
        ])}
      />
      <p className="mt-2 text-[11px] text-faint">Default view for long pipelines. Top row = most neglected open deal — work down the list. Idle thresholds are per stage (Negotiation tolerates 21d/45d, Qualified only 7d/14d); closed deals show &quot;—&quot;. Click a company to open the lead.</p>
    </div>
  )
}

function PipelineBoard({ onConvert, onOpen }: { onConvert: (d: Deal) => void; onOpen: (d: Deal) => void }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, minmax(120px,1fr))' }}>
      {STAGES.map((st) => {
        const cards = DEALS.filter((d) => d.stage === st.key)
        const total = cards.reduce((s, d) => s + d.value, 0)
        return (
          <div key={st.key} className="rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-1 flex items-center justify-between"><Pill tone={st.tone}>{st.key}</Pill><span className="text-[11px] font-bold text-faint">{cards.length}</span></div>
            <p className="mb-2 text-[10.5px] text-faint tabular-nums">{money(total)}</p>
            {cards.map((d) => (
              <div key={d.company} onClick={() => onOpen(d)} className={cn('mb-1.5 cursor-pointer rounded-md border bg-surface p-2 hover:border-brand', st.key === 'Won' && 'border-emerald-300 ring-1 ring-emerald-200')}>
                <p className="truncate text-[11.5px] font-semibold text-ink">{d.company}</p>
                <p className="text-[10.5px] text-muted tabular-nums">{money(d.value)}</p>
                {st.key === 'Won' && (
                  <button onClick={(e) => { e.stopPropagation(); onConvert(d) }} className="mt-1.5 w-full rounded-md bg-emerald-600 px-2 py-1 text-[10.5px] font-semibold text-white hover:opacity-90">⚡ Convert →</button>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/* ── Lead detail (Salesforce-style) ───────────────────────────────────────── */
const PATH = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won']
const NEXT_BY_STAGE: Record<string, string> = {
  Lead: 'Qualify budget, authority & timeline. Confirm the decision-maker.',
  Qualified: 'Book a product demo and send an intro deck within 2 days.',
  Proposal: 'Follow up on the proposal; confirm which products they need.',
  Negotiation: 'Send the revised quote and agree terms — aim to close this week.',
  Won: 'Activate the customer: create the account & provision products.',
  Lost: 'Log the loss reason and set a reminder to re-engage next quarter.',
}

function DetailCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2.5"><p className="text-[12.5px] font-bold">{title}</p>{action}</div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}
function KV({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="border-b border-line-soft py-2 last:border-0">
      <p className="text-[10.5px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[12.5px]', link ? 'text-brand' : 'text-ink/85')}>{value}</p>
    </div>
  )
}
function TL({ icon, title, time, sub, tone }: { icon: string; title: string; time: string; sub: string; tone: string }) {
  return (
    <div className="flex gap-2.5">
      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px]', tone)}>{icon}</span>
      <div className="min-w-0 flex-1 border-b border-line-soft pb-3">
        <div className="flex items-center justify-between gap-2"><p className="truncate text-[12.5px] font-medium text-brand">{title}</p><span className="shrink-0 text-[11px] text-faint">{time}</span></div>
        <p className="text-[11.5px] text-muted">{sub}</p>
      </div>
    </div>
  )
}

function LeadDetail({ deal, onBack }: { deal: Deal; onBack: () => void }) {
  const ci = PATH.indexOf(deal.stage)
  const [converting, setConverting] = useState(false)
  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to pipeline</button>

      {/* header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-[16px]">🏢</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">Lead · Company</p>
            <h3 className="text-[19px] font-bold tracking-tight">{deal.company}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Change owner</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>
          <button onClick={() => setConverting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Convert</button>
        </div>
      </div>

      {/* status path */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-line bg-surface p-1.5">
        <div className="flex flex-1 items-stretch gap-1">
          {PATH.map((s, i) => (
            <div key={s} className={cn('flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-[12px] font-semibold', i < ci ? 'bg-brand-soft text-brand' : i === ci ? 'bg-brand text-white' : 'bg-canvas text-muted')}>
              {i < ci ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>
        {deal.stage === 'Lost'
          ? <Pill tone="rejected">Lost</Pill>
          : deal.stage === 'Won'
            ? <button onClick={() => setConverting(true)} className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">⚡ Convert →</button>
            : <button className="shrink-0 rounded-lg bg-brand px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90">✓ Mark stage complete</button>}
      </div>

      {/* 3 columns */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.95fr)]">
        {/* col 1 — details */}
        <div className="space-y-3">
          <DetailCard title="About (company)">
            <KV label="Legal name" value={deal.company} />
            <KV label="Tax code (MST)" value="0312xxxxxx" />
            <KV label="Industry · Size" value="Logistics · 200–500 staff" />
            <KV label="Website" value="viettien.vn" link />
            <KV label="Notes" value="Multi-branch logistics firm, hiring drivers & ops across 3 cities." />
          </DetailCard>
          <DetailCard title="Sales">
            <KV label="Owner" value={deal.owner} link />
            <KV label="Lead source" value="Referral" />
            <KV label="Estimated value" value={money(deal.value)} />
            <KV label="Stage" value={deal.stage} />
          </DetailCard>
        </div>

        {/* col 2 — activity */}
        <DetailCard
          title="Activity"
          action={<span className="flex gap-1">{['✉', '📞', '✅', '📅'].map((i) => <span key={i} className="grid h-6 w-6 place-items-center rounded-md border border-line text-[11px] text-muted">{i}</span>)}</span>}
        >
          <p className="mb-3 text-[11px] text-faint">Filters: Within 2 months · All activities · All types</p>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">Upcoming &amp; overdue</p>
          <div className="space-y-3">
            <TL icon="📅" title="Introductory call" time="Feb 16" sub="Upcoming event · 1:30 PM" tone="bg-violet-100 text-violet-700" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">February 2026</p>
            <TL icon="📞" title="Discovery call" time="Today" sub="You logged a call — 18 min" tone="bg-sky-100 text-sky-700" />
            <TL icon="✅" title="Send pricing options" time="Today" sub="Task completed" tone="bg-emerald-100 text-emerald-700" />
            <TL icon="✉" title="Intro & product overview" time="Today" sub="Email sent to Ms. Linh · Opened" tone="bg-amber-100 text-amber-700" />
          </div>
        </DetailCard>

        {/* col 3 — related & next step (recommended) */}
        <div className="space-y-3">
          <div className="rounded-xl border border-brand/30 bg-brand-soft p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand">▶ Next best action</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink/85">{NEXT_BY_STAGE[deal.stage]}</p>
          </div>
          <DetailCard title="Contacts" action={<span className="text-[11px] text-brand">+ Add</span>}>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-[12px]">👩</span>
                <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold">Ms. Vũ Thanh Linh</p><p className="text-[11px] text-muted">HR Manager · decision-maker</p></div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-[12px]">🧑</span>
                <div className="min-w-0"><p className="truncate text-[12.5px] font-semibold">Mr. Lê Quốc Bảo</p><p className="text-[11px] text-muted">Finance · handles PO / invoice</p></div>
              </div>
            </div>
          </DetailCard>
          <DetailCard title="Deal &amp; products">
            <KV label="Estimated value" value={money(deal.value)} />
            <div className="border-b border-line-soft py-2">
              <p className="text-[10.5px] uppercase tracking-wide text-faint">Products interested</p>
              <div className="mt-1 flex flex-wrap gap-1.5"><Pill tone="neutral">📢 Job Posting</Pill><Pill tone="neutral">🔍 Resume Search</Pill></div>
            </div>
            <KV label="Latest quote" value="Q-2042 · Sent · 28.5M ₫" link />
          </DetailCard>
          <DetailCard title="On our platform">
            <p className="text-[12px] text-muted">Not yet an account · <b className="text-ink">0</b> jobs posted. Becomes a company account when you <b className="text-ink">Convert</b> it.</p>
          </DetailCard>
        </div>
      </div>

      {converting && <ConvertLeadModal companyName={deal.company} value={deal.value} owner={deal.owner} onClose={() => setConverting(false)} />}
    </div>
  )
}

/* ── Create-lead modal (company-first, adapted from Salesforce) ────────────── */
function LField({ label, req, value, select, hint }: { label: string; req?: boolean; value: string; select?: boolean; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{hint}</p>}
    </div>
  )
}
function Section({ title, className }: { title: string; className?: string }) {
  return <p className={cn('mt-2 rounded-md bg-canvas/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted', className)}>{title}</p>
}

/** Interactive combobox — pick a suggested option or type a custom value. */
function ComboField({ label, req, value: initial, options, placeholder }: { label: string; req?: boolean; value?: string; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [val, setVal] = useState(initial ?? '')
  const isExact = options.some((o) => o.toLowerCase() === val.toLowerCase())
  // exact selection (or empty) → show the whole list; mid-typing → filter
  const matches = isExact || val.length === 0 ? options : options.filter((o) => o.toLowerCase().includes(val.toLowerCase()))
  const isCustom = val.length > 0 && !isExact
  return (
    <div className="relative">
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 focus-within:border-brand">
        <input
          value={val}
          onChange={(e) => { setVal(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
        />
        <button type="button" onClick={() => setOpen((o) => !o)} className="ml-2 shrink-0 text-muted">▾</button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg">
            {matches.map((o) => (
              <button type="button" key={o} onClick={() => { setVal(o); setOpen(false) }} className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', o === val ? 'font-medium text-brand' : 'text-ink')}>{o}</button>
            ))}
            {isCustom && (
              <button type="button" onClick={() => setOpen(false)} className="block w-full border-t border-line px-3 py-1.5 text-left text-[12px] text-brand hover:bg-canvas">Use “{val}” (custom)</button>
            )}
            {matches.length === 0 && !isCustom && <p className="px-3 py-1.5 text-[11px] text-faint">Type to add a custom value…</p>}
          </div>
        </>
      )}
    </div>
  )
}
/* ── New quotation (Báo giá) ───────────────────────────────────────────────────
   Modelled on the client's live PDF EST-009909-07-2026. The load-bearing idea is
   that one quotation carries 1–3 priced OPTIONS which are ALTERNATIVES, not
   add-ons: each totals independently, exactly one gets accepted, and the document
   has no grand total. Everything derived (line totals, VAT, total-after-VAT,
   amount-in-words, benefit lists) is computed here and never typed. */
const QUOTE_CATALOG = [
  { vi: 'Dịch vụ tin đăng (Basic Job)', short: 'Basic Job', unitVi: 'tin', unitEn: 'post', price: 2_710_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag', 'Làm mới bài đăng mỗi 15 ngày'] },
  { vi: 'Dịch vụ tin đăng (Basic Plus Job)', short: 'Basic Plus Job', unitVi: 'tin', unitEn: 'post', price: 6_100_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag', 'Tiêu đề đậm xanh', 'Top Search: ưu tiên trên kết quả tìm kiếm', 'Làm mới bài đăng mỗi 10 ngày', 'Hiển thị tại “Các công ty nổi bật” — Trang chủ'] },
  { vi: 'Dịch vụ tin đăng (Premium Job)', short: 'Premium Job', unitVi: 'tin', unitEn: 'post', price: 9_800_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 05 skill tag', 'Tiêu đề đậm xanh + huy hiệu Premium', 'Top Search + Top Category', 'Làm mới bài đăng mỗi 7 ngày'] },
  { vi: 'Dịch vụ tìm kiếm hồ sơ (30 ngày)', short: 'CV Search 30d', unitVi: 'hồ sơ', unitEn: 'CV', price: 5_500_000, feats: ['Mở tối đa 50 hồ sơ trong 30 ngày', 'Lọc theo kỹ năng, kinh nghiệm, mức lương'] },
  { vi: 'Dịch vụ tìm kiếm hồ sơ (90 ngày)', short: 'CV Search 90d', unitVi: 'hồ sơ', unitEn: 'CV', price: 13_900_000, feats: ['Mở tối đa 200 hồ sơ trong 90 ngày', 'Lọc theo kỹ năng, kinh nghiệm, mức lương'] },
  { vi: 'Employer Branding Page', short: 'EB Page', unitVi: 'gói', unitEn: 'package', price: 15_000_000, feats: ['Trang thương hiệu tuyển dụng riêng', 'Banner + video giới thiệu'] },
]
const DISCOUNT_APPROVAL = 20 // % above which a sales lead must approve before Send

const VN_D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
function vnRead3(n: number, full: boolean) {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10
  let s = ''
  if (full || tr > 0) s += VN_D[tr] + ' trăm'
  if (ch === 0 && dv > 0) s += ((tr > 0 || full) ? ' lẻ ' : ' ') + VN_D[dv]
  else if (ch === 1) s += ' mười' + (dv > 0 ? ' ' + (dv === 5 ? 'lăm' : VN_D[dv]) : '')
  else if (ch > 1) s += ' ' + VN_D[ch] + ' mươi' + (dv === 1 ? ' một' : dv === 5 ? ' lăm' : dv > 0 ? ' ' + VN_D[dv] : '')
  return s.trim()
}
/** Bằng chữ — the PDF's amount-in-words, generated. 6,588,000 → "Sáu triệu năm trăm tám mươi tám nghìn đồng." */
function vnWords(n: number) {
  if (n <= 0) return 'Không đồng'
  const g: number[] = []
  for (let x = n; x > 0; x = Math.floor(x / 1000)) g.unshift(x % 1000)
  const scales = ['', 'nghìn', 'triệu', 'tỷ']
  const parts = g.map((v, i) => (v === 0 ? '' : (vnRead3(v, i > 0) + ' ' + scales[g.length - 1 - i]).trim())).filter(Boolean)
  const s = parts.join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng'
}

type QLine = { cat: number; qty: number; price: number; disc: number; gift: boolean }
type QOption = { id: number; lines: QLine[]; recommended: boolean; optDisc: number }
const lineTotal = (l: QLine) => (l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100)))
const VAT_RATE = 8

/* ── Tạo PO / Create sales order ───────────────────────────────────────────────
   Raised from ONE accepted quotation option. Nothing is retyped: lines, totals,
   VAT and the VAT-billing block are copied from the quotation, because those are
   what the e-invoice must eventually match. Confirming is the "won" moment for the
   pipeline — but it provisions nothing; only the invoice does (T&C clause 3). */
function CreatePOModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const { quote } = poGate(c)
  const [terms, setTerms] = useState('100% in advance')
  const [poNo, setPoNo] = useState('')
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
              <Section title="VAT billing — snapshot from the quotation" className="mt-0" />
              <LField label="Tên công ty / Legal name" req value={c.legalName} />
              <LField label="Địa chỉ KKD / Billing address" req value={c.address} />
              <LField label="Mã số thuế / Tax code" req value={c.tax} hint="Must match the e-invoice exactly — a mismatch later needs a cancel + re-issue." />
            </div>
            <div className="space-y-3">
              <Section title="Order terms" className="mt-0" />
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Điều khoản thanh toán / Payment terms</label>
                <select value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]">
                  <option>100% in advance</option><option>50 / 50</option><option>Net 30 after invoice</option>
                </select>
                <p className="mt-1 text-[10.5px] text-faint">Advance is the default — clause 3 activates the service only after payment.</p>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Customer PO number <span className="font-normal text-faint">(optional)</span></label>
                <input value={poNo} onChange={(e) => setPoNo(e.target.value)} placeholder="e.g. PO-VP/2026/044" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px]" />
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">If their procurement issues its own PO, record the number and attach the file. Customers without a procurement process simply confirm the order we send.</p>
              </div>
              <button className="w-full rounded-md border border-dashed border-line py-2 text-[11.5px] text-muted hover:border-ink/40">+ Attach their signed PO / confirmation</button>
            </div>
          </div>

          <div className="ml-auto w-full max-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
            <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
            <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
            <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{total.toLocaleString('en-US')} ₫</span></div>
            <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(total)}.</p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            <b>Confirming this order is the “won” moment</b> — the deal moves to the PO stage. It does <b>not</b> provision anything: no account, no quota, no company page. That waits for the Accounting-confirmed payment and the issued VAT e-invoice (T&C clause 3). Customer status stays <b>{c.account ? AC_STATUS[c.account].label : 'Prospect'}</b> until the invoice.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink hover:border-ink/40">Save draft</button>
          <button className="rounded-lg bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">Send order for confirmation →</button>
        </div>
      </div>
    </div>
  )
}

/** Company ID in the same format the Create-job picker uses: "Vạn Phát · CO-0312". */
const coId = (c: Company) => 'CO-' + (c.tax.replace(/\D/g, '').slice(0, 4) || '0000').padEnd(4, '0')
/** A derived value shown as information — deliberately not styled as an input. */
function InfoBit({ label, value, hint, mono }: { label: string; value: string; hint?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('truncate text-[12.5px] font-medium text-ink', mono && 'font-mono')}>{value}</p>
      {hint && <p className="truncate text-[10px] text-faint">{hint}</p>}
    </div>
  )
}
/* Confirmation card — mirrors CompanyInfoCard on Create job. Its job is to let the
   rep verify they picked the right company, and it doubles as the VAT-billing
   read-out: legal name, MST and registered address all print on the invoice, and
   they live on the company record rather than being re-entered per quotation. */
function QuoteCompanyCard({ c }: { c: Company }) {
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()
  return (
    <div className="rounded-lg border border-line bg-canvas/40 p-3">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">{coLabel(c)} <span className="text-[11px] font-normal text-muted">· ID {coId(c)}</span></p>
          <p className="truncate text-[11px] text-muted">{c.industry} · {c.size} staff · {c.address}</p>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {c.account && <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>}
          {inPipeline(c) && <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
        </span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-2.5 sm:grid-cols-4">
        <InfoBit label="Tên pháp lý / Legal name" value={c.legalName} hint="prints on the invoice" />
        <InfoBit label="Mã số thuế / Tax code" value={c.tax} mono hint="prints on the invoice" />
        <InfoBit label="Người liên hệ / Contact" value={c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]} hint={c.contact.split(' · ')[1] ?? ''} />
        <InfoBit label="Email" value={`contact@${c.domain}`} hint="send-to address" />
      </div>
    </div>
  )
}

/** `company` pre-selects the record — set when opened from a company detail page,
    left empty when opened from the Quotations list. */
export function NewQuotationModal({ onClose, company: initialCompany = '' }: { onClose: () => void; company?: string }) {
  const today = '29/07/2026'
  const [company, setCompany] = useState(initialCompany)
  const [seq, setSeq] = useState(0)
  const [options, setOptions] = useState<QOption[]>([
    { id: 1, lines: [{ cat: 1, qty: 1, price: QUOTE_CATALOG[1].price, disc: 0, gift: false }, { cat: 1, qty: 1, price: 0, disc: 0, gift: true }], recommended: true, optDisc: 0 },
    { id: 2, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }, { cat: 0, qty: 1, price: 0, disc: 0, gift: true }], recommended: false, optDisc: 0 },
  ])

  const co = COMPANIES.find((c) => c.name === company)
  // Approval looks at BOTH discount levels — a 30% option-level cut is no less
  // of a concession than a 30% line-level one.
  const maxDisc = Math.max(0, ...options.flatMap((o) => [o.optDisc, ...o.lines.map((l) => l.disc)]))
  const needsApproval = maxDisc > DISCOUNT_APPROVAL
  const everyOptionPaid = options.every((o) => o.lines.some((l) => !l.gift && lineTotal(l) > 0))
  const valid = !!co && everyOptionPaid

  const patch = (oid: number, li: number, d: Partial<QLine>) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.map((l, i) => (i === li ? { ...l, ...d } : l)) } : o)))
  const addLine = (oid: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: [...o.lines, { cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }] } : o)))
  const delLine = (oid: number, li: number) =>
    setOptions((os) => os.map((o) => (o.id === oid ? { ...o, lines: o.lines.filter((_, i) => i !== li) } : o)))
  const addOption = () =>
    setOptions((os) => (os.length >= 3 ? os : [...os, { id: Math.max(...os.map((o) => o.id)) + 1, lines: [{ cat: 0, qty: 1, price: QUOTE_CATALOG[0].price, disc: 0, gift: false }], recommended: false, optDisc: 0 }]))

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
            <InfoBit label="Số báo giá / Quotation no." value={`EST-00991${seq}-07-2026`} mono hint="Gapless sequence" />
            <InfoBit label="Ngày báo giá / Proposal date" value={today} />
            <InfoBit label="Ngày hết hạn / Expiry date" value="12/08/2026" hint="+14 ngày" />
            <InfoBit label="Báo giá bởi / Proposed by" value="Nguyễn Thị Lan" hint="Signed-in rep" />
          </div>

          {/* 2 · client — pick the company, then confirm it from its own record.
              Billing data (legal name, MST, address) is READ from that record, so
              there is no separate VAT-billing form to keep in sync. */}
          <Section title="2 · Khách hàng / Client" />
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
          {co
            ? <QuoteCompanyCard c={co} />
            : <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-[11.5px] text-faint">Pick a company to confirm its details, contact and billing data.</p>}

          {/* 3 · options — the heart of it */}
          <Section title="3 · Options — alternatives, not add-ons" />
          {options.map((o, oi) => {
            /* Two discount levels, applied in order: per-line first, then a single
               option-level discount on the subtotal. VAT is charged on what is left,
               so the option discount must land BEFORE the VAT line, not after. */
            const sub = o.lines.reduce((s, l) => s + lineTotal(l), 0)
            const optCut = Math.round(sub * o.optDisc / 100)
            const net = sub - optCut
            const vat = Math.round(net * VAT_RATE / 100)
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
                        <select value={l.cat} onChange={(e) => { const c = Number(e.target.value); patch(o.id, li, { cat: c, price: l.gift ? 0 : QUOTE_CATALOG[c].price }) }} className="min-w-0 flex-1 truncate rounded border border-line bg-surface px-1.5 py-1 text-[11.5px]">
                          {QUOTE_CATALOG.map((p, i) => <option key={i} value={i}>{p.vi}</option>)}
                        </select>
                        {l.gift && <Pill tone="active">Tặng</Pill>}
                      </span>
                      <span className="text-[11px] text-muted">{QUOTE_CATALOG[l.cat].unitVi} / {QUOTE_CATALOG[l.cat].unitEn}</span>
                      <input type="number" min={1} value={l.qty} onChange={(e) => patch(o.id, li, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded border border-line bg-surface px-1 py-1 text-right text-[11.5px] tabular-nums" />
                      <input disabled={l.gift} value={l.gift ? '0' : l.price.toLocaleString('en-US')} onChange={(e) => patch(o.id, li, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} className={cn('w-full rounded border border-line px-1 py-1 text-right text-[11.5px] tabular-nums', l.gift ? 'bg-canvas text-faint' : 'bg-surface')} />
                      <span className="flex items-center justify-end gap-0.5">
                        <input disabled={l.gift} type="number" min={0} max={100} value={l.disc} onChange={(e) => patch(o.id, li, { disc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} className={cn('w-11 rounded border px-1 py-1 text-right text-[11.5px] tabular-nums', l.disc > DISCOUNT_APPROVAL ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-line bg-surface', l.gift && 'bg-canvas text-faint')} />
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
                  <div className="min-w-[300px] rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11.5px]">
                    <div className="flex justify-between"><span className="text-muted">Tạm tính</span><span className="tabular-nums">{sub.toLocaleString('en-US')} ₫</span></div>
                    {/* Applies to the whole option — on the subtotal, before VAT */}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted">
                        Chiết khấu
                        <input type="number" min={0} max={100} value={o.optDisc}
                          onChange={(e) => setOptions((os) => os.map((x) => (x.id === o.id ? { ...x, optDisc: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x)))}
                          className={cn('w-12 rounded border px-1 py-0.5 text-right text-[11.5px] tabular-nums', o.optDisc > DISCOUNT_APPROVAL ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-line bg-surface')} />
                        <span className="text-[10.5px] text-faint">%</span>
                      </span>
                      <span className={cn('tabular-nums', optCut > 0 && 'text-rose-600')}>{optCut > 0 ? '−' : ''}{optCut.toLocaleString('en-US')} ₫</span>
                    </div>
                    {o.optDisc > 0 && <div className="flex justify-between"><span className="text-muted">Sau chiết khấu</span><span className="tabular-nums">{net.toLocaleString('en-US')} ₫</span></div>}
                    <div className="flex justify-between"><span className="text-muted">Thuế GTGT ({VAT_RATE}%)</span><span className="tabular-nums">{vat.toLocaleString('en-US')} ₫</span></div>
                    <div className="mt-1 flex justify-between border-t border-line pt-1 font-semibold"><span>Tổng sau VAT</span><span className="tabular-nums">{(net + vat).toLocaleString('en-US')} ₫</span></div>
                    <p className="mt-1.5 text-[10.5px] italic leading-relaxed text-faint">Bằng chữ: {vnWords(net + vat)}.</p>
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
          {needsApproval && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-900">
              ⚠ A {maxDisc}% discount exceeds the {DISCOUNT_APPROVAL}% threshold — Send is blocked until a sales lead approves. Save as draft and request approval.
            </div>
          )}
          {!everyOptionPaid && <p className="text-[11.5px] text-rose-600">Every option needs at least one paid line — an option cannot be gifts only.</p>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
            <button disabled={!co} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', co ? 'border-line text-ink hover:border-ink/40' : 'border-line text-faint')}>Save draft</button>
            <button disabled={!valid} className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', valid ? 'border-brand/40 text-brand hover:bg-brand-soft' : 'border-line text-faint')}>Preview PDF</button>
            {/* Over-threshold discount blocks SEND, but must not block the action that
                unblocks it — the rep needs to be able to request the approval. */}
            <button disabled={!valid} className={cn('rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold text-white', !valid ? 'bg-line' : needsApproval ? 'bg-amber-600 hover:opacity-90' : 'bg-brand hover:opacity-90')}>
              {needsApproval ? 'Request approval →' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateLeadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">New company</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <p className="rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">A permanent <b className="text-ink">Company ID</b> (e.g. <span className="font-mono">JW-7K2M9PQ</span>) is assigned automatically on save — it is never typed and never changes.</p>
          <LField label="Legal name" req value="Công ty TNHH …" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Short name" value="e.g. FPT, Tiki, NEC" hint="Display / brand name — shown on the pipeline & company page." />
            <LField label="Tax code (MST)" value="0328xxxxxx-001" hint="10 số, hoặc 10 số + “-001” nếu là chi nhánh." />
          </div>

          {/* Dedup has three outcomes, not two. An exact full-MST hit is a real
              duplicate and blocks. A shared 10-digit root, or a near-identical legal
              name on a different MST, is almost always an affiliate — blocking those
              is what stops sales entering a legitimate new customer. Shown here as the
              "possible affiliate" state, which is the case reps hit most often. */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-amber-900">
            <p className="font-semibold">⚠ Trùng 10 số gốc MST với một khách hàng đã có</p>
            <p className="mt-1">
              <b>Công ty CP Trường Sơn</b> · MST 0328xxxxxx · owner Nguyễn Thị Lan. Cùng gốc, khác đuôi ⇒ đây là <b>chi nhánh</b>, không phải bản ghi trùng.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90">Liên kết làm chi nhánh của công ty này</button>
              <button className="rounded-md border border-amber-300 bg-surface px-2.5 py-1 text-[11px] font-medium text-amber-900 hover:border-amber-500">Không liên quan — tạo độc lập</button>
            </div>
            <p className="mt-2 text-[10.5px] text-amber-800/80">
              Chỉ MST trùng khít mới bị chặn. Cùng gốc MST, hoặc tên gần giống trên một MST khác (“… Miền Nam”, “… Hà Nội”), luôn được tạo — hệ thống chỉ gợi ý liên kết.
            </p>
          </div>

          <ComboField label="Công ty mẹ (tuỳ chọn)" value="Công ty CP Trường Sơn" placeholder="Tìm theo tên hoặc MST…" options={['— Không thuộc tập đoàn nào —', 'Công ty CP Trường Sơn', 'Công ty TNHH Cơ khí Đông Phong', 'FPT Software', 'VNG Corporation']} />
          <p className="-mt-1.5 text-[11px] leading-relaxed text-faint">
            Chỉ là liên kết tra cứu. Công ty mới vẫn có MST, hợp đồng, quota và sales phụ trách riêng — không dùng chung gì với công ty mẹ. Không giới hạn số cấp; hệ thống chặn liên kết vòng.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <LField label="Industry" value="IT / Software" select />
            <LField label="Company size" value="100–499 staff" select />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Location" value="Hồ Chí Minh" select hint="City / province of the head office." />
            <LField label="Website" value="company.vn" />
          </div>
          <LField label="Address" value="Số nhà, tên đường, phường/xã, quận/huyện" hint="Full head-office address — used on quotes, invoices & contracts." />
          <Section title="Primary contact" className="!mt-6" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Contact name" req value="Họ và tên" />
            <ComboField label="Title" value="HR Manager" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'CEO / Founder', 'Office Manager']} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Phone" value="09xx xxx xxx" />
            <LField label="Email" value="hr@company.vn" />
          </div>
          <Section title="Sales" className="!mt-6" />
          <div className="grid grid-cols-2 gap-3">
            <ComboField label="Lead source" value="Website sign-up" placeholder="Select or type…" options={['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']} />
            <LField label="Owner" value="Nguyễn Thị Lan" select />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Products interested</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> 📢 Job Posting</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> 🔍 Resume Search</span>
            </div>
          </div>
          <LField label="Estimated deal value (₫)" value="0" />
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Description</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">How we heard about them, need, next step…</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Save</button>
        </div>
      </div>
    </div>
  )
}

/* ── Convert-lead modal (adapted from Salesforce) ─────────────────────────── */
function Radio({ on }: { on?: boolean }) {
  return <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-line')}>{on && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
}
function ConvertLeadModal({ companyName, value, owner, onClose }: { companyName: string; value: number; owner: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[760px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Convert to customer — {companyName}</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-5">
          <div className="flex gap-2.5 rounded-lg bg-brand-soft px-3.5 py-3 text-[12px] leading-relaxed text-brand">
            <span>🔗</span>
            <div>Converting creates the <b>company account</b> + its <b>first user login</b>, and provisions the <b>products</b> they bought. If the company already exists (e.g. it self-signed up), link it instead to avoid a duplicate.</div>
          </div>

          {/* Account */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">🏢 Account <span className="font-normal text-faint">(the company)</span></p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg border border-brand bg-brand-soft/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-brand"><Radio on /> Create new account</div>
                <LField label="Account name" req value={companyName} />
              </div>
              <div className="flex items-center justify-center text-[11px] font-semibold text-faint">— OR —</div>
              <div className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-muted"><Radio /> Choose existing account</div>
                <div className="flex items-center rounded-md border border-line px-3 py-2 text-[12px] text-faint">Search by name / tax code <span className="ml-auto">🔍</span></div>
                <p className="mt-2 rounded-md bg-canvas/60 px-2 py-2.5 text-center text-[11px] text-faint">0 matches — checked by tax code (dedup)</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">👤 Contact <span className="font-normal text-faint">(→ first user login)</span></p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
              <div className="rounded-lg border border-brand bg-brand-soft/40 p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-brand"><Radio on /> Create new contact</div>
                <LField label="Name · title" value="Ms. Vũ Thanh Linh · HR Manager" />
                <p className="mt-1.5 text-[11px] text-muted">Gets the login as HR Manager (super admin).</p>
              </div>
              <div className="flex items-center justify-center text-[11px] font-semibold text-faint">— OR —</div>
              <div className="rounded-lg border border-line p-3">
                <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-muted"><Radio /> Choose existing contact</div>
                <p className="rounded-md bg-canvas/60 px-2 py-2.5 text-center text-[11px] text-faint">0 matches detected</p>
              </div>
            </div>
          </div>

          {/* Products (our version of "Opportunity") */}
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2.5 flex items-center gap-2 text-[13px] font-bold">📦 Products <span className="font-normal text-faint">(provisioned as quota on convert)</span></p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> 📢 Job Posting — 10 slots</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-soft px-2.5 py-1.5 text-[12px] text-brand"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-brand text-[9px] text-white">✓</span> 🔍 Resume Search — 100 unlocks</span>
            </div>
            <label className="mt-2.5 flex items-center gap-2 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Don’t provision yet (activate later)</label>
            <p className="mt-2 text-[11px] text-amber-700">⚠️ Job Posting is selected → a public company page will be required after convert.</p>
            <p className="mt-1 text-[11px] text-faint">From <b className="text-ink/70">{companyName}</b> · {money(value)} · Quote Q-2042</p>
          </div>

          {/* owner + status */}
          <div className="grid gap-3 md:grid-cols-2">
            <LField label="Record owner" req value={owner} select />
            <LField label="Converted status" req value="Active customer" select />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Convert</button>
        </div>
      </div>
    </div>
  )
}

export function AdminPipeline({ onActivate }: { onActivate?: () => void } = {}) {
  const [view, setView] = useState<'table' | 'board'>('table')
  const [openLead, setOpenLead] = useState<Deal | null>(null)
  const [convertDeal, setConvertDeal] = useState<Deal | null>(null)
  const [creating, setCreating] = useState(false)

  if (openLead) return <LeadDetail deal={openLead} onBack={() => setOpenLead(null)} />

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* view toggle — table is the default for long pipelines */}
        <div className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
          <button onClick={() => setView('table')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'table' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>☰ Table</button>
          <button onClick={() => setView('board')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'board' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>▦ Board</button>
        </div>
        <button onClick={() => setCreating(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New lead</button>
      </div>

      {view === 'table' ? <PipelineTable onConvert={setConvertDeal} onOpen={setOpenLead} /> : <PipelineBoard onConvert={setConvertDeal} onOpen={setOpenLead} />}

      {/* Hand-off banner — the entry point to the activation walkthrough, and ONLY
          that. Rendered only when a caller supplies onActivate (the admin wireframe).
          On a requirement page nobody passes it, where the banner was a dead CTA
          plus a hard-coded storyboard line about one specific company. */}
      {onActivate && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-[16px]">🎉</span>
          <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-emerald-800">
            <b>“Cty Trường Sơn” is Won.</b> The pipeline ends here. Next you <b>activate the customer</b> — create the account, choose products, and (for Job Posting) build the company page. This hands the customer off to <b>Account management</b>.
          </p>
          <button onClick={onActivate} className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">⚡ Activate customer →</button>
        </div>
      )}

      {creating && <CreateLeadModal onClose={() => setCreating(false)} />}
      {convertDeal && <ConvertLeadModal companyName={convertDeal.company} value={convertDeal.value} owner={convertDeal.owner} onClose={() => setConvertDeal(null)} />}
    </div>
  )
}
/* Quote-to-cash, in the order it actually happens:
   Quotation (1–3 options) → Sales order / PO (confirm = won) → Payment
   (Accounting confirms) → VAT e-invoice (issue = closed + provisioning released). */
/* FOUR statuses only: Draft · Sent · Issued to PO · Expired. Everything that used
   to be its own status is a FLAG on one of these — discount approval is a gate on
   Draft, an accepted option is recorded on a Sent quote until the PO exists, a
   revision is a version (v2) not a status, and a lapsed offer is Sent + expired
   validity. The flags live in the data and surface on the DETAIL page; the list
   stays scannable and shows the status pill alone. */
type QuoteStatus = 'Draft' | 'Sent' | 'Issued to PO' | 'Expired'
type Quote = {
  code: string; customer: string; co?: string; products: number[]; options: number
  value: number; status: QuoteStatus; created: string; expires: string
  acceptedOpt?: number; lapsed?: boolean; awaitingApproval?: boolean; note?: string
}
const QUOTE_TONE: Record<QuoteStatus, StatusTone> = { Draft: 'draft', Sent: 'pending', 'Issued to PO': 'active', Expired: 'expired' }
const QUOTES: Quote[] = [
  { code: 'EST-009909-07-2026', customer: 'AM Software Việt Nam', co: 'Công ty TNHH AM Software Việt Nam', products: [1, 0], options: 2, value: 6_588_000, status: 'Sent', created: '20/07/2026', expires: '03/08/2026' },
  { code: 'EST-009908-07-2026', customer: 'Công ty Vạn Phát', co: 'Công ty TNHH Vạn Phát', products: [1, 4], options: 3, value: 37_800_000, status: 'Sent', created: '14/07/2026', expires: '28/07/2026', acceptedOpt: 2, note: 'Customer confirmed Option 2 by email.' },
  { code: 'EST-009907-07-2026', customer: 'Hoàng Gia', products: [2], options: 1, value: 131_429_662, status: 'Issued to PO', created: '30/06/2026', expires: '14/07/2026', acceptedOpt: 1 },
  { code: 'EST-009906-06-2026', customer: 'Việt Tiến Logistics', co: 'Công ty TNHH Việt Tiến', products: [0, 3], options: 2, value: 28_536_925, status: 'Sent', created: '16/06/2026', expires: '30/06/2026', lapsed: true, note: 'Went quiet after pricing. Extend or re-issue as v2.' },
  { code: 'EST-009904-05-2026', customer: 'Tinh Hoa (v1)', products: [1], options: 2, value: 58_900_000, status: 'Expired', created: '17/05/2026', expires: '31/05/2026', note: 'Replaced by v2 — EST-009905-06-2026.' },
  { code: 'EST-009905-06-2026', customer: 'Tinh Hoa', products: [1, 5], options: 2, value: 60_206_698, status: 'Draft', created: '28/07/2026', expires: '—', awaitingApproval: true, note: '25% discount — needs sales-lead approval before it can be sent.' },
]
/** Products, compactly: first name + "+N" when there are more. Full list on hover. */
function ProductCell({ ids }: { ids: number[] }) {
  if (!ids.length) return <span className="text-faint">—</span>
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={ids.map((i) => QUOTE_CATALOG[i].vi).join(' · ')}>
      <span className="truncate">{QUOTE_CATALOG[ids[0]].short}</span>
      {ids.length > 1 && <span className="shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">+{ids.length - 1}</span>}
    </span>
  )
}

/* Quotation detail. The list stays scannable, so every exception lives here: the
   approval gate, a lapsed offer, a superseded version, and which option the
   customer actually accepted. Read-only — changes go through Edit, which reopens
   the builder, because a Sent quotation is immutable and revising it makes a v2. */
function QuotationDetail({ q, onBack, onCreatePO }: { q: Quote; onBack: () => void; onCreatePO: (c: Company) => void }) {
  const co = COMPANIES.find((x) => x.name === q.co)
  /* Issue PO shows on every SENT quotation — that is the only state where an order
     can follow. It is disabled on a lapsed offer: the discounts and gifts expired
     with the validity date (T&C clause 2), so extend or re-issue as v2 first. */
  const canPO = q.status === 'Sent' && !q.lapsed
  // One option per product listed, priced off the catalog so the arithmetic is real.
  const opts = q.products.map((p, i) => {
    const qty = Math.max(1, Math.round(q.value / (1 + VAT_RATE / 100) / QUOTE_CATALOG[p].price))
    const sub = qty * QUOTE_CATALOG[p].price
    const vat = Math.round(sub * VAT_RATE / 100)
    return { n: i + 1, p, qty, sub, vat, total: sub + vat }
  })
  return (
    <div>
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Quotations</button>

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
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Preview PDF</button>
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-ink hover:border-ink/40">Export</button>
          {/* Sales declares "sent" — reps routinely deliver the PDF by Zalo or from
              their own mail client, so it cannot depend on our mailer firing. */}
          {q.status === 'Draft' && (
            <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Mark as sent</button>
          )}
          {q.status === 'Sent' && (
            <button
              onClick={() => canPO && co && onCreatePO(co)}
              disabled={!canPO}
              title={canPO ? 'Raise the sales order from the accepted option' : `Offer lapsed ${q.expires} — extend validity or re-issue as v2 first`}
              className={cn('rounded-lg px-3 py-1.5 text-[12px] font-semibold', canPO ? 'bg-brand text-white hover:opacity-90' : 'border border-line bg-canvas text-faint')}
            >
              Issue PO →
            </button>
          )}
        </div>
      </div>

      {q.lapsed && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] text-rose-900">
          ⚠ Offer lapsed — validity ended {q.expires}. Extend validity or re-issue as v2 before an order can be raised.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3.5 py-2.5 sm:grid-cols-5">
        <InfoBit label="Ngày báo giá / Created" value={q.created} />
        <InfoBit label="Ngày hết hạn / Expires" value={q.expires} hint={q.lapsed ? 'lapsed' : q.expires === '—' ? 'not sent yet' : undefined} />
        <InfoBit label="Báo giá bởi / Proposed by" value={co?.owner ?? 'Nguyễn Thị Lan'} />
        <InfoBit label="Số option" value={String(q.options)} hint="alternatives, never summed" />
        <InfoBit label="Giá trị / Value" value={`${q.value.toLocaleString('en-US')} ₫`} hint={q.acceptedOpt ? 'accepted option' : 'highest option'} />
      </div>

      {co && <div className="mb-4"><QuoteCompanyCard c={co} /></div>}

      <p className="mb-2 text-[12.5px] font-semibold">Options</p>
      <div className="space-y-2">
        {opts.map((o) => (
          <div key={o.n} className={cn('rounded-xl border p-3', q.acceptedOpt === o.n ? 'border-emerald-300 bg-emerald-50/40' : 'border-line')}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12.5px] font-semibold">Option {o.n} <span className="font-normal text-muted">{QUOTE_CATALOG[o.p].vi}</span></p>
              {q.acceptedOpt === o.n
                ? <Pill tone="active">Accepted</Pill>
                : q.acceptedOpt ? <Pill tone="draft">Not chosen</Pill> : null}
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
    </div>
  )
}

function AdminQuotes() {
  /* PO creation lives HERE, not on the company detail page: an order can only come
     from an ACCEPTED quotation option, so the accepted row is the only place the
     action is ever valid. Company detail carries "Create quotation" instead. */
  const [poFor, setPoFor] = useState<Company | null>(null)
  const [open, setOpen] = useState<Quote | null>(null)
  if (open) return <QuotationDetail q={open} onBack={() => setOpen(null)} onCreatePO={setPoFor} />

  const rows = QUOTES.map((q) => {
    const canPO = !!q.acceptedOpt && q.status === 'Sent' && !q.lapsed
    return [
      <button onClick={() => setOpen(q)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{q.code}</button>,
      <span className="truncate">{q.customer}</span>,
      <ProductCell ids={q.products} />,
      <span className="tabular-nums text-muted">{q.options}</span>,
      <span className="tabular-nums">{q.value.toLocaleString('en-US')} ₫</span>,
      <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>,
      <span className="tabular-nums text-muted">{q.created}</span>,
      <span className="tabular-nums text-muted">{q.expires}</span>,
      canPO
        ? <button onClick={() => setPoFor(COMPANIES.find((x) => x.name === q.co) ?? null)} className="rounded-md border border-brand/40 bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand hover:bg-brand hover:text-white">Issue PO →</button>
        : <span className="text-faint">—</span>,
    ]
  })

  return (
    <div>
      {/* Create action lives on the page title row (see PRIMARY_ACTION in AdminWireframe). */}
      <p className="mb-3 max-w-[60ch] text-[11.5px] text-muted">
        Bilingual VN/EN proposal (BÁO GIÁ), 1–3 priced options per document. Creating one asks for the company
        first — a quotation is always attached to a company and a deal, never floating.
      </p>
      <ListPage
        tabs={[{ label: 'All', count: 92, active: true }, { label: 'Draft', count: 11 }, { label: 'Sent', count: 34 }, { label: 'Issued to PO', count: 41 }, { label: 'Expired', count: 6 }]}
        cols={[
          { label: 'Quotation', w: '1.4fr' }, { label: 'Customer', w: '1.3fr' }, { label: 'Products', w: '1.2fr' },
          { label: 'Options', w: '0.6fr' }, { label: 'Value', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1fr' },
          { label: 'Created', w: '0.8fr' }, { label: 'Expires', w: '0.8fr' }, { label: '', w: '1.2fr' },
        ]}
        rows={rows}
        minW={1180}
      />
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </div>
  )
}
function AdminInvoices() {
  const rows = [
    ['INV-3390 · 1C26TAA/0041', 'Công ty Vạn Phát', 'PAY-1042', '37,800,000 ₫', <Pill tone="active">Issued</Pill>, '26/07/2026', '26/07/2027'],
    ['INV-3389 · 1C26TAA/0040', 'Trường Sơn', 'PAY-1044', '73,929,353 ₫', <Pill tone="active">Issued</Pill>, '24/07/2026', '24/07/2027'],
    ['INV-3388 · 1C26TAA/0039', 'Hồng Đức', 'PAY-1039', '139,609,357 ₫', <Pill tone="expired">Cancelled · replaced</Pill>, '06/07/2026', '—'],
    ['— not issued yet', 'AM Software Việt Nam', 'PAY-1043', '6,588,000 ₫', <Pill tone="draft">Blocked · payment unconfirmed</Pill>, '—', '—'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 210, active: true }, { label: 'To issue', count: 2 }, { label: 'Issued' }, { label: 'Cancelled / replaced' }, { label: 'Activation expiring', count: 6 }]}
      cols={[{ label: 'Invoice · legal no.', w: '1.7fr' }, { label: 'Customer', w: '1.3fr' }, { label: 'Payment', w: '0.9fr' }, { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.6fr' }, { label: 'Issued', w: '0.9fr', align: 'r' }, { label: 'Activate by', w: '0.9fr', align: 'r' }]}
      rows={rows}
      minW={900}
      footer="Issued only after a confirmed payment (T&C clause 3) — so no Overdue state here · issuing closes the deal, flips the company New → Existing and releases provisioning · activate-by = issued + 12 months (clause 4)"
    />
  )
}
function AdminPOs() {
  const rows = [
    ['SO-1188', 'Công ty Vạn Phát', 'PO-VP/2026/044', '37,800,000 ₫', <Pill tone="active">Paid → invoiced</Pill>, '07/07/2026'],
    ['SO-1189', 'AM Software Việt Nam', '—', '6,588,000 ₫', <Pill tone="pending">Awaiting payment</Pill>, '22/07/2026'],
    ['SO-1190', 'Hoàng Gia', '—', '87,505,977 ₫', <Pill tone="neutral">Sent</Pill>, '18/07/2026'],
    ['SO-1191', 'Sao Mai', '—', '126,360,120 ₫', <Pill tone="draft">Draft</Pill>, '—'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 64, active: true }, { label: 'Sent' }, { label: 'Confirmed' }, { label: 'Awaiting payment', count: 9 }, { label: 'Invoiced' }]}
      cols={[{ label: 'Order', w: '1fr' }, { label: 'Customer', w: '1.5fr' }, { label: 'Customer PO', w: '1.2fr' }, { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.3fr' }, { label: 'Issued', w: '0.9fr', align: 'r' }]}
      rows={rows}
      minW={760}
      footer="From ONE accepted quotation option · Confirmed = won (deal → PO) · holds the customer’s own PO number when their procurement issues one · provisions nothing yet"
    />
  )
}
function AdminPayments() {
  const rows = [
    ['PAY-1042', 'Công ty Vạn Phát', 'SO-1188', '37,800,000 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '26/07/2026'],
    ['PAY-1043', 'AM Software Việt Nam', 'SO-1189', '6,588,000 ₫', 'Bank transfer', <Pill tone="pending">Recorded — to confirm</Pill>, '27/07/2026'],
    ['PAY-1044', 'Trường Sơn', 'SO-1185', '73,929,353 ₫', 'Bank transfer', <Pill tone="active">Confirmed · Kế toán</Pill>, '24/07/2026'],
    ['PAY-1045', 'Á Châu', 'SO-1182', '19,934,148 ₫', 'Cash', <Pill tone="rejected">Unmatched</Pill>, '20/07/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'Awaiting payment', count: 9 }, { label: 'To confirm', count: 4, active: true }, { label: 'Confirmed' }, { label: 'To invoice', count: 2 }, { label: 'Unmatched', count: 1 }]}
      cols={[{ label: 'Reference', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Order', w: '0.9fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Method', w: '1.1fr' }, { label: 'Status', w: '1.6fr' }, { label: 'Paid', w: '0.9fr', align: 'r' }]}
      rows={rows}
      minW={860}
      footer="Money lands against the ORDER, not an invoice · Recorded ≠ Confirmed — only Accounting confirms it against the bank, and that click is what unlocks invoicing"
    />
  )
}
function AdminContracts() {
  const rows = [
    ['CT-0912', 'Trường Sơn', '546,679,016 ₫', <Pill tone="active">Active</Pill>, '20/04/2026 – 20/04/2027'],
    ['CT-0913', 'Phương Đông', '498,258,424 ₫', <Pill tone="expired">Expired</Pill>, '20/05/2025 – 15/04/2026'],
    ['CT-0914', 'Hồng Đức', '152,568,060 ₫', <Pill tone="draft">Draft</Pill>, '30/03/2026 – 04/09/2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Contract', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Value', w: '1.2fr', align: 'r' }, { label: 'Status', w: '1fr' }, { label: 'Validity', w: '1.8fr', align: 'r' }]}
      rows={rows}
      footer="Draft → Active on signing → Expired past end date · e-sign + storage TBD"
    />
  )
}

/* ── Analytics ────────────────────────────────────────────────────────────── */
function AdminDashboard() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Revenue (MTD)', value: '2.4B ₫', delta: '12% vs last month', up: true },
        { label: 'Active jobs', value: '1,180', delta: '4% vs last month', up: true },
        { label: 'New applicants', value: '3,942', delta: '8% vs last month', up: true },
        { label: 'Paying companies', value: '452', delta: '3 churned', up: false },
      ]} />
      <div>
        <p className="mb-2 text-[12px] font-semibold text-ink/70">Revenue — last 6 months (B ₫)</p>
        <Bars data={[{ label: 'Feb', value: 1.6 }, { label: 'Mar', value: 1.9 }, { label: 'Apr', value: 1.7 }, { label: 'May', value: 2.1 }, { label: 'Jun', value: 2.3 }, { label: 'Jul', value: 2.4 }]} />
      </div>
    </div>
  )
}
function AdminSalesReport() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Bookings (MTD)', value: '2.4B ₫', delta: '12%', up: true },
        { label: 'Avg deal size', value: '38.2M ₫', delta: '5%', up: true },
        { label: 'Win rate', value: '31%', delta: '2%', up: false },
        { label: 'Open pipeline', value: '4.9B ₫' },
      ]} />
      <ListPage
        cols={[{ label: 'Product', w: '1.6fr' }, { label: 'Units sold', w: '1fr', align: 'r' }, { label: 'Revenue', w: '1.2fr', align: 'r' }, { label: 'Share', w: '0.8fr', align: 'r' }]}
        rows={[
          ['Job Posting — Pro', '112', '1.68B ₫', '52%'],
          ['Resume Search', '48', '0.96B ₫', '30%'],
          ['Main ad', '36', '0.29B ₫', '9%'],
          ['Boosts', '61', '0.18B ₫', '6%'],
        ]}
        footer="Mock timeseries today — needs a real sales-aggregation read model"
      />
    </div>
  )
}
function AdminRecruitReport() {
  return (
    <div className="space-y-4">
      <p className="text-[12px] font-semibold text-ink/70">Recruiting funnel — last 30 days</p>
      <Bars data={[{ label: 'Views', value: 84200 }, { label: 'Applies', value: 12400 }, { label: 'Screened', value: 8100 }, { label: 'Interview', value: 2600 }, { label: 'Hired', value: 640 }]} />
      <p className="text-[11px] text-faint">Apply rate 14.7% · screen-through 65% · hire rate 0.8% — aggregates the application pipeline</p>
    </div>
  )
}
function AdminRevenueReport() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Revenue (YTD)', value: '14.2B ₫', delta: '18% YoY', up: true },
        { label: 'Recognized', value: '11.8B ₫' },
        { label: 'Deferred', value: '2.4B ₫' },
        { label: 'Refunds', value: '86M ₫', delta: '0.6%', up: false },
      ]} />
      <ListPage
        cols={[{ label: 'Month', w: '1fr' }, { label: 'Bookings', w: '1.2fr', align: 'r' }, { label: 'Recognized', w: '1.2fr', align: 'r' }, { label: 'Refunds', w: '1fr', align: 'r' }]}
        rows={[['May 2026', '2.1B ₫', '1.7B ₫', '12M ₫'], ['Jun 2026', '2.3B ₫', '1.9B ₫', '18M ₫'], ['Jul 2026', '2.4B ₫', '2.0B ₫', '9M ₫']]}
        footer="Backed by a real revenue read model — reconciles with orders"
      />
    </div>
  )
}
function AdminUserBehavior() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'DAU', value: '18,400', delta: '6%', up: true },
        { label: 'Searches / day', value: '42,100', delta: '9%', up: true },
        { label: 'Avg session', value: '6m 12s', delta: '3%', up: true },
        { label: 'Apply conversion', value: '14.7%' },
      ]} />
      <Bars data={[{ label: 'Mon', value: 17200 }, { label: 'Tue', value: 18900 }, { label: 'Wed', value: 19400 }, { label: 'Thu', value: 18100 }, { label: 'Fri', value: 20300 }, { label: 'Sat', value: 11200 }, { label: 'Sun', value: 9800 }]} />
      <p className="text-[11px] text-faint">Reads the Store behaviour-tracking pipeline · privacy/consent applies (VN)</p>
    </div>
  )
}

/* ── System · Roles & permissions ───────────────────────────────────────────
 * Interactive flow — the internal HQ operator lifecycle, in order:
 *   1. Define a ROLE first  → a permission tree (None / Read / Read & write per page)
 *   2. Create an operator   → fill name + email
 *   3. Assign the role      → pick from the roles defined in step 1
 *   4. Send email invite    → operator sets their OWN password via the link
 *   → status is Pending until they activate it, then Active
 * Same invitation format/flow as the company HR Manager / HR Specialist invite.
 */
type PermLevel = 'none' | 'read' | 'write'
const PERM_GROUPS: { key: string; label: string; resources: string[] }[] = [
  { key: 'recruitment', label: 'Recruitment', resources: ['Jobs', 'Job approval', 'Applicants', 'Resumes / candidates (PII)'] },
  { key: 'companies', label: 'Companies', resources: ['Company accounts', 'Company users', 'Company page review'] },
  { key: 'content', label: 'Content', resources: ['Banners', 'Popups', 'Pages', 'Boards', 'Blog / articles'] },
  { key: 'billing', label: 'Billing & products', resources: ['Catalog', 'Bundles', 'Credits', 'Orders', 'Promotions'] },
  { key: 'crm', label: 'CRM', resources: ['Sign-ups', 'Pipeline / leads', 'Quotes', 'Invoices', 'Purchase orders', 'Payments', 'Contracts'] },
  { key: 'analytics', label: 'Analytics', resources: ['Dashboard', 'Sales report', 'Recruit report', 'Revenue report', 'User behavior'] },
  { key: 'system', label: 'System', resources: ['Operator accounts', 'Roles & permissions', 'Master data', 'Job categories & roles', 'Audit log', 'Environment / flags', 'Departments'] },
]
const TOTAL_PERMS = PERM_GROUPS.reduce((n, g) => n + g.resources.length, 0)
const permKey = (gk: string, r: string) => `${gk}:${r}`

type Role = { name: string; desc: string; users: number; grants: Record<string, PermLevel> }
const ROLES: Role[] = [
  { name: 'Super admin', desc: 'Full access to every module, including roles & operator accounts.', users: 3, grants: { recruitment: 'write', companies: 'write', content: 'write', billing: 'write', crm: 'write', analytics: 'write', system: 'write' } },
  { name: 'Sales', desc: 'CRM pipeline, companies & billing. No content or system settings.', users: 8, grants: { recruitment: 'none', companies: 'read', content: 'none', billing: 'write', crm: 'write', analytics: 'read', system: 'none' } },
  { name: 'Operations', desc: 'Recruitment moderation, company accounts & content.', users: 12, grants: { recruitment: 'write', companies: 'write', content: 'write', billing: 'none', crm: 'none', analytics: 'read', system: 'none' } },
  { name: 'Content editor', desc: 'Content module only — banners, popups, pages, blog.', users: 5, grants: { recruitment: 'none', companies: 'none', content: 'write', billing: 'none', crm: 'none', analytics: 'read', system: 'none' } },
  { name: 'Finance', desc: 'Billing, orders & revenue reports. Read-only CRM.', users: 4, grants: { recruitment: 'none', companies: 'read', content: 'none', billing: 'write', crm: 'read', analytics: 'read', system: 'none' } },
]
// expand a role's per-group grants into a full per-resource permission map
const expandGrants = (grants: Record<string, PermLevel>): Record<string, PermLevel> => {
  const m: Record<string, PermLevel> = {}
  for (const g of PERM_GROUPS) for (const r of g.resources) m[permKey(g.key, r)] = grants[g.key] ?? 'none'
  return m
}
const grantedCount = (perms: Record<string, PermLevel>) => Object.values(perms).filter((l) => l !== 'none').length

const PERM_LEVELS: { key: PermLevel; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'read', label: 'Read' },
  { key: 'write', label: 'Read & write' },
]
function PermSeg({ value, onChange }: { value: PermLevel | null; onChange: (l: PermLevel) => void }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-line">
      {PERM_LEVELS.map((l, i) => (
        <button
          key={l.key}
          onClick={() => onChange(l.key)}
          className={cn(
            'px-2.5 py-1 text-[11px] font-medium transition-colors',
            i > 0 && 'border-l border-line',
            value === l.key
              ? l.key === 'none' ? 'bg-slate-600 text-white' : 'bg-brand text-white'
              : 'text-muted hover:bg-canvas/70',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

/* ── Step 1 · the permission-tree editor (mirrors the Customer-permissions screen) */
function RoleEditor({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const [name, setName] = useState(role?.name ?? '')
  const [desc, setDesc] = useState(role?.desc ?? '')
  const [perms, setPerms] = useState<Record<string, PermLevel>>(role ? expandGrants(role.grants) : expandGrants({}))
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({ recruitment: true })
  const searching = query.trim().length > 0
  const q = query.trim().toLowerCase()

  const setMany = (keys: string[], level: PermLevel) => setPerms((p) => ({ ...p, ...Object.fromEntries(keys.map((k) => [k, level])) }))
  const allKeys = PERM_GROUPS.flatMap((g) => g.resources.map((r) => permKey(g.key, r)))
  const groupKeys = (g: (typeof PERM_GROUPS)[number]) => g.resources.map((r) => permKey(g.key, r))
  const uniformLevel = (keys: string[]): PermLevel | null => {
    const first = perms[keys[0]]
    return keys.every((k) => perms[k] === first) ? first : null
  }
  const granted = grantedCount(perms)

  return (
    <div>
      <button onClick={onClose} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to roles</button>

      {/* header — name + granted counter + bulk + save */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[240px] flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Step 1 · {role ? 'Edit role' : 'New role'}</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Role name (e.g. Regional ops)"
            className="mt-1 w-full max-w-[420px] rounded-lg border border-line bg-surface px-3 py-2 text-[16px] font-bold tracking-tight outline-none placeholder:font-normal placeholder:text-faint focus:border-brand"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description of what this role can do"
            className="mt-1.5 w-full max-w-[520px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] text-ink/80 outline-none placeholder:text-faint focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand tabular-nums">{granted} / {TOTAL_PERMS} granted</span>
          <button onClick={onClose} className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save role</button>
        </div>
      </div>

      {/* search + top-level bulk */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages / permissions…"
          className="w-[240px] rounded-lg border border-line bg-surface px-3 py-1.5 text-[12px] outline-none placeholder:text-faint focus:border-brand"
        />
        <span className="ml-auto text-[11px] font-medium text-faint">Apply to all pages:</span>
        <PermSeg value={uniformLevel(allKeys)} onChange={(l) => setMany(allKeys, l)} />
      </div>

      {/* the tree */}
      <div className="space-y-2">
        {PERM_GROUPS.map((g) => {
          const gks = groupKeys(g)
          const visible = g.resources.filter((r) => !searching || r.toLowerCase().includes(q) || g.label.toLowerCase().includes(q))
          if (searching && visible.length === 0) return null
          const isOpen = searching || open[g.key]
          const gGranted = gks.filter((k) => perms[k] !== 'none').length
          return (
            <div key={g.key} className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-2 bg-canvas/60 px-3.5 py-2.5">
                <button onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <span className={cn('text-faint transition-transform', !isOpen && '-rotate-90')}>▾</span>
                  <span className="text-[13px] font-bold text-ink">{g.label}</span>
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-faint tabular-nums">{gGranted}/{g.resources.length}</span>
                </button>
                <PermSeg value={uniformLevel(gks)} onChange={(l) => setMany(gks, l)} />
              </div>
              {isOpen && (
                <div>
                  {visible.map((r) => {
                    const k = permKey(g.key, r)
                    return (
                      <div key={k} className="flex items-center gap-2 border-t border-line-soft px-3.5 py-2 pl-8">
                        <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink/85">{r}</span>
                        <PermSeg value={perms[k]} onChange={(l) => setPerms((p) => ({ ...p, [k]: l }))} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Set once, per page. <b className="text-ink/70">Read</b> = can view the page; <b className="text-ink/70">Read &amp; write</b> = can also create / edit / delete. Group and “apply to all” toggles cascade to the rows below them. Save the role, then assign it to operators in <b className="text-ink/70">System → Users</b>.
      </p>
    </div>
  )
}

function AdminRoles() {
  const [editing, setEditing] = useState<{ role: Role | null } | null>(null)
  if (editing) return <RoleEditor role={editing.role} onClose={() => setEditing(null)} />
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[64ch] flex-1 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          <b>Step 1 of the operator flow — define the role first.</b> A role is a permission tree: per page, choose <b>None</b> / <b>Read</b> / <b>Read &amp; write</b>. You then assign a saved role to each operator in <b>System → Users</b> and send them an invite.
        </p>
        <button onClick={() => setEditing({ role: null })} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ New role</button>
      </div>
      <Table
        cols={[{ label: 'Role', w: '2.1fr' }, { label: 'Permissions', w: '0.9fr', align: 'r' }, { label: 'Operators', w: '0.7fr', align: 'r' }, { label: 'Actions', w: '2fr', align: 'r' }]}
        rows={ROLES.map((r) => {
          const granted = grantedCount(expandGrants(r.grants))
          const inUse = r.users > 0
          return [
            <div className="min-w-0"><button onClick={() => setEditing({ role: r })} className="block truncate text-left font-medium text-brand hover:underline">{r.name}</button><p className="truncate text-[11px] text-faint">{r.desc}</p></div>,
            <span className="tabular-nums">{granted}/{TOTAL_PERMS}</span>,
            <span className="tabular-nums">{r.users}</span>,
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={() => setEditing({ role: r })} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70">Edit</button>
              <RowAction>Duplicate</RowAction>
              <button disabled={inUse} title={inUse ? `${r.users} operator${r.users > 1 ? 's' : ''} assigned — reassign them first` : 'Delete role'} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 enabled:hover:bg-rose-500 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Delete</button>
            </div>,
          ]
        })}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">Roles are fully managed by your team — create, edit, duplicate or delete. A role <b>can’t be deleted while operators are still assigned to it</b> (reassign them first), and at least one role must always keep full access so no one gets locked out.</p>
    </div>
  )
}

/* ── System · Users (HQ operators) — create → assign role → invite → status ── */
type OpUser = { id: number; name: string; email: string; role: string; status: 'Active' | 'Pending' | 'Disabled'; last: string }
const OPERATORS: OpUser[] = [
  { id: 1, name: 'Trần Quốc Trung', email: 'admin@saramin.vn', role: 'Super admin', status: 'Active', last: '5m ago' },
  { id: 2, name: 'Lê Hữu Phong', email: 'ops1@saramin.vn', role: 'Operations', status: 'Active', last: '1h ago' },
  { id: 3, name: 'Nguyễn Thị Lan', email: 'sales1@saramin.vn', role: 'Sales', status: 'Active', last: '2h ago' },
  { id: 4, name: 'Phạm Quang Huy', email: 'sales2@saramin.vn', role: 'Sales', status: 'Pending', last: '—' },
  { id: 5, name: 'Đặng Thu Trang', email: 'content1@saramin.vn', role: 'Content editor', status: 'Disabled', last: '2 months ago' },
]
const OP_STATUS: Record<OpUser['status'], StatusTone> = { Active: 'active', Pending: 'pending', Disabled: 'expired' }

function CreateOperatorModal({ onCreate, onClose }: { onCreate: (name: string, email: string, role: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const valid = name.trim() && /.+@.+\..+/.test(email) && role
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[480px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">Create operator</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="space-y-3.5 p-5">
          {/* step markers */}
          <div className="flex items-center gap-1 text-[10.5px] font-medium text-faint">
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">2 · Details</span><span>→</span>
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-brand">3 · Assign role</span><span>→</span>
            <span className="rounded-full bg-canvas px-2 py-0.5">4 · Send invite</span>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Full name <span className="text-rose-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vũ Thanh Hải" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Work email <span className="text-rose-500">*</span></label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@saramin.vn" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Role <span className="text-rose-500">*</span></label>
            <div className="grid gap-1.5">
              {ROLES.map((r) => (
                <button key={r.name} onClick={() => setRole(r.name)} className={cn('flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left', role === r.name ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                  <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', role === r.name ? 'border-brand' : 'border-line')}>{role === r.name && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-ink">{r.name}</span><span className="block truncate text-[10.5px] text-faint">{r.desc}</span></span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-faint">{grantedCount(expandGrants(r.grants))}/{TOTAL_PERMS}</span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-faint">No role fits? Define one first in <b className="text-ink/70">System → Roles &amp; permissions</b>.</p>
          </div>
          <p className="flex gap-2 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] leading-relaxed text-brand"><span>🔑</span><span>Sending the invite emails a one-time activation link. The operator <b>sets their own password</b> — no one types it for them. Their status stays <b>Pending</b> until they activate it, then flips to <b>Active</b>.</span></p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onCreate(name.trim(), email.trim(), role)} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">✉ Create &amp; send invite</button>
        </div>
      </div>
    </div>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState<OpUser[]>(OPERATORS)
  const [creating, setCreating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => setToast(m)
  const create = (name: string, email: string, role: string) => {
    setUsers((prev) => [{ id: Math.max(0, ...prev.map((u) => u.id)) + 1, name, email, role, status: 'Pending', last: '—' }, ...prev])
    setCreating(false)
    flash(`Invitation sent to ${email} — waiting for them to activate the link.`)
  }
  const setStatus = (id: number, status: OpUser['status']) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
        <button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">+ Create operator</button>
      </div>

      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>✅ {toast}</span>
          <button onClick={() => setToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      <TabBar tabs={[{ label: 'All', count: users.length, active: true }, { label: 'Active', count: users.filter((u) => u.status === 'Active').length }, { label: 'Pending', count: users.filter((u) => u.status === 'Pending').length }, { label: 'Disabled', count: users.filter((u) => u.status === 'Disabled').length }]} />
      <Table
        cols={[{ label: 'Operator', w: '1.5fr' }, { label: 'Role', w: '1.1fr' }, { label: 'Status', w: '1fr' }, { label: 'Last login', w: '0.9fr', align: 'r' }, { label: 'Actions', w: '1.6fr', align: 'r' }]}
        rows={users.map((u) => [
          <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p><p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p></div>,
          <Pill tone={u.role === 'Super admin' ? 'neutral' : 'draft'}>{u.role}</Pill>,
          u.status === 'Pending'
            ? <span className="inline-flex items-center gap-1.5"><Pill tone="pending">Pending</Pill><span className="text-[10.5px] text-faint">invite sent</span></span>
            : <Pill tone={OP_STATUS[u.status]}>{u.status}</Pill>,
          <span className="text-[11.5px] text-muted">{u.last}</span>,
          <div className="flex items-center justify-end gap-1.5">
            {u.status === 'Pending'
              ? <><button onClick={() => flash(`Invitation re-sent to ${u.email}.`)} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Resend</button><button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:bg-canvas/70" title="Demo: simulate the operator activating their link">Simulate activate</button><RowAction tone="rose">Cancel</RowAction></>
              : u.status === 'Disabled'
                ? <button onClick={() => setStatus(u.id, 'Active')} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Re-enable</button>
                : <><RowAction>Change role</RowAction><button onClick={() => setStatus(u.id, 'Disabled')} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-500 hover:text-white">Disable</button></>}
          </div>,
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Interactive prototype — <b>+ Create operator</b> adds a Pending row; <b>Simulate activate</b> flips it to Active. Full lifecycle &amp; status rules are in the feature spec (↗ View full spec).
      </p>

      {creating && <CreateOperatorModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}
/* ── Master data — one place for every reference list ─────────────────────────
 * Single source of truth for the dropdown / filter vocabularies used across all
 * three sites. One page, one left rail of domains, one detail panel. Each domain
 * declares its shape: flat list, tag cloud, two-level taxonomy, or grouped list.
 * Mirrors the client's master-data spec sheet (Industry, Job categories, roles,
 * level, skills, education, languages, job types, locations, currency).
 * ---------------------------------------------------------------------------- */
type MDKind = 'flat' | 'tags' | 'taxonomy' | 'grouped'
type MDDomain = {
  key: string
  label: string
  i18n: string
  used: string
  note: string
  kind: MDKind
  entries?: string[]
  groups?: { name: string; items: string[] }[]
}
const MD_DOMAINS: MDDomain[] = [
  {
    key: 'industry', label: 'Industry', i18n: 'vi · en · ko', used: 'Company profile · job form · Store filter',
    note: 'Classifies companies (and jobs). Single-level list.', kind: 'flat',
    entries: ['IT / Software', 'FMCG', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Logistics', 'Construction & Real Estate', 'Hospitality & Tourism', 'Media & Advertising', 'Telecommunications'],
  },
  {
    key: 'job-categories', label: 'Job categories & roles', i18n: 'vi · en · ko', used: 'Job form (Category → Role) · Store filter',
    note: 'Two-level taxonomy: each Category owns a list of Roles (job titles). Roles are children of their category — pick a category on the left to manage its roles. Distinct from System → Roles & permissions (admin RBAC).',
    kind: 'taxonomy',
    groups: [
      { name: 'IT', items: ['Software Developer', 'Machine Learning / AI Engineer', 'Augmented Reality (AR) Developer', 'Internet of Things (IoT) Developer', 'Blockchain Developer', 'DevOps Engineer', 'Data Engineer / Scientist / Analyst', 'Network Engineer / Cyber Security', 'QA / Tester', 'Product Manager / Business Analyst', 'IT Support Specialist', 'IT - Hardware / Network'] },
      { name: 'Business, Finance', items: ['Accountant', 'Financial Analyst', 'Auditor', 'Investment Analyst', 'Business Development', 'Sales Executive'] },
      { name: 'Management', items: ['Project Manager', 'Operations Manager', 'General Manager', 'Team Lead'] },
      { name: 'Manufacturing & Engineering', items: ['Mechanical Engineer', 'Electrical Engineer', 'QA/QC Engineer', 'Production Supervisor'] },
      { name: 'Service', items: ['Customer Service', 'Restaurant Staff', 'Housekeeping', 'Security'] },
      { name: 'Design, Creativity', items: ['UI/UX Designer', 'Graphic Designer', 'Copywriter', 'Video Editor'] },
    ],
  },
  {
    key: 'job-level', label: 'Job level', i18n: 'vi · en · ko', used: 'Job form · Store filter',
    note: 'Seniority of the posting. Single-level list.', kind: 'flat',
    entries: ['Intern/Student', 'Fresher/Entry level', 'Experienced (non-manager)', 'Manager', 'Director and above'],
  },
  {
    key: 'skills', label: 'Skills', i18n: 'vi · en', used: 'Job form · resume · Store filter (tags)',
    note: 'Free-growing tag vocabulary; can be connected to Job categories / roles. Displayed as tags on the Jobseeker site.', kind: 'tags',
    entries: ['ASP.NET Core', '.NET', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'SQL Server', 'AWS', 'Docker', 'Kubernetes', 'Figma', 'Photoshop', 'SEO', 'Copywriting', 'Japanese N2', 'Excel'],
  },
  {
    key: 'education', label: 'Education level', i18n: 'vi · en', used: 'Job form (min. education) · resume',
    note: 'Single-level list.', kind: 'flat',
    entries: ['High school', "Associate's degree", 'College', 'Bachelor', 'Master', 'Doctorate', 'Others'],
  },
  {
    key: 'languages', label: 'Preferred languages for application', i18n: 'vi · en', used: 'Job form · resume',
    note: 'Languages a candidate may apply / be assessed in. Single-level list.', kind: 'flat',
    entries: ['English', 'Vietnamese', 'Japanese', 'Chinese', 'Korean', 'French', 'Spanish', 'Italian'],
  },
  {
    key: 'job-types', label: 'Job types', i18n: 'vi · en · ko', used: 'Job form · Store filter',
    note: 'Employment type. Single-level list.', kind: 'flat',
    entries: ['Full-time', 'Part-time', 'Internship', 'Online Jobs', 'Freelancer', 'Seasonal', 'Other'],
  },
  {
    key: 'locations', label: 'Locations', i18n: 'vi · en', used: 'Company profile · job form · Store filter',
    note: 'Vietnamese provinces/cities plus an International bucket. Grouped list.', kind: 'grouped',
    groups: [
      { name: 'Vietnam', items: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai', 'Khánh Hòa', '… 63 provinces'] },
      { name: 'International', items: ['International (remote)', 'Japan', 'Singapore', 'Korea', 'Other'] },
    ],
  },
  {
    key: 'currency', label: 'Salary currency', i18n: '—', used: 'Job form (salary range)',
    note: 'ISO currency codes offered in the salary field. Single-level list.', kind: 'flat',
    entries: ['USD', 'VND', 'JPY', 'CNY', 'EUR', 'INR', 'GBP', 'RUB', 'SGD'],
  },
]

function MDEntryRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5 text-[12.5px] last:border-0">
      <span className="truncate text-ink/80">{label}</span>
      <div className="flex shrink-0 items-center gap-3">
        <button className="text-[11.5px] text-brand hover:underline">Edit</button>
        <button className="text-[11.5px] text-rose-500 hover:underline">Delete</button>
      </div>
    </div>
  )
}

function MDDomainDetail({ d }: { d: MDDomain }) {
  const [cat, setCat] = useState(0)
  const count = d.kind === 'taxonomy'
    ? (d.groups!.length + d.groups!.reduce((n, g) => n + g.items.length, 0))
    : d.kind === 'grouped'
      ? d.groups!.reduce((n, g) => n + g.items.length, 0)
      : d.entries!.length
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-bold tracking-tight text-ink">{d.label}</h3>
          <p className="mt-0.5 text-[11px] text-muted">{count} entries · Languages: {d.i18n} · Used by: {d.used}</p>
        </div>
        <button className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">+ Add new</button>
      </div>
      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11.5px] leading-relaxed text-sky-800">{d.note}</div>

      {d.kind === 'taxonomy' && (
        <div className="grid gap-4 md:grid-cols-2">
          <TaxoPane title="Job Category" items={d.groups!.map((g) => g.name)} activeIndex={cat} onSelect={setCat} />
          <TaxoPane title={`Role — in “${d.groups![cat].name}”`} items={d.groups![cat].items} />
        </div>
      )}

      {d.kind === 'grouped' && (
        <div className="space-y-4">
          {d.groups!.map((g) => (
            <div key={g.name} className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
                <span className="text-[12.5px] font-bold text-ink">{g.name}</span>
                <span className="text-[11px] text-faint">· {g.items.length}</span>
                <button className="ml-auto text-[12px] font-medium text-brand hover:underline">Add new +</button>
              </div>
              {g.items.map((it) => <MDEntryRow key={it} label={it} />)}
            </div>
          ))}
        </div>
      )}

      {d.kind === 'tags' && (
        <div className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap gap-1.5">
            {d.entries!.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-[11.5px] text-brand">{t}<button className="text-brand/50 hover:text-brand">×</button></span>
            ))}
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand/50 px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-brand-soft">＋ Add tag</button>
          </div>
        </div>
      )}

      {d.kind === 'flat' && (
        <div className="overflow-hidden rounded-xl border border-line">
          {d.entries!.map((e) => <MDEntryRow key={e} label={e} />)}
        </div>
      )}
    </div>
  )
}

/* ── System → Company information (issuer) ────────────────────────────────────
   The ONE place the letterhead that prints on every selling document is set:
   logo, VN + EN legal name, VN + EN address, website, plus the tax identity and
   bank details the order and invoice need. Never typed per quotation — otherwise
   the same company appears three different ways across three documents, and a
   move of office means editing every template. */
function AdminIssuer() {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  const NAME = { VI: 'CÔNG TY TNHH DAOUKIWOOM INNOVATION', EN: 'DAOUKIWOOM INNOVATION COMPANY LIMITED' }
  const ADDR = {
    VI: 'Tầng 12, 13 & 14, Tòa nhà AP, 518B Điện Biên Phủ, Phường Thạnh Mỹ Tây, Thành Phố Hồ Chí Minh, Việt Nam',
    EN: 'Level 12, 13 & 14, AP Tower, 518B Dien Bien Phu Street, Thanh My Tay Ward, Ho Chi Minh City, Vietnam',
  }
  return (
    <div className="max-w-[900px]">
      <p className="mb-3 max-w-[70ch] text-[11.5px] leading-relaxed text-muted">
        The issuer identity printed at the top of every quotation, sales order and VAT invoice. Set once here —
        documents read it, so nobody retypes it and past documents keep the version they were sent with.
      </p>

      {/* live letterhead preview — what the customer actually sees */}
      <div className="mb-4 overflow-hidden rounded-xl border border-line">
        <div className="flex items-center justify-between border-b border-line bg-canvas/50 px-3 py-1.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Letterhead preview</p>
          <div className="flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
            {(['VI', 'EN'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={cn('px-2 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-start justify-between gap-4 bg-surface p-4">
          <div className="min-w-0 text-[11.5px] leading-relaxed">
            <p className="font-bold text-ink">{NAME.VI}</p>
            <p className="font-bold text-ink">{NAME.EN}</p>
            <p className="mt-0.5 text-ink/80">{ADDR[lang]}</p>
            <p className="text-brand">https://topdev.vn</p>
            <p className="mt-1.5 text-ink/70">Báo giá bởi / Proposed by: Nguyễn Thị Lan | lan.nguyen@topdev.vn <span className="text-faint">— the signed-in rep, not a setting</span></p>
          </div>
          <div className="grid h-12 w-28 shrink-0 place-items-center rounded-md border border-dashed border-line bg-canvas/60 text-[11px] font-bold tracking-tight text-ink/60">saramin</div>
        </div>
      </div>

      <div className="space-y-4">
        <JobGroup title="Legal identity">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Tên công ty (VI)" req value={NAME.VI} hint="Prints on line 1 of the letterhead." />
            <LField label="Company name (EN)" req value={NAME.EN} hint="Prints on line 2 — both always print, in both languages." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Mã số thuế / Tax code" req value="0313545562" hint="The ISSUER’s MST — not the customer’s." />
            <LField label="Website" value="https://topdev.vn" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TArea label="Địa chỉ (VI)" req value={ADDR.VI} rows={2} />
            <TArea label="Address (EN)" req value={ADDR.EN} rows={2} />
          </div>
        </JobGroup>

        <JobGroup title="Brand">
          <div>
            <LabelRow label="Logo" />
            <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3">
              <div className="grid h-12 w-28 shrink-0 place-items-center rounded-md border border-dashed border-line bg-surface text-[11px] font-bold tracking-tight text-ink/60">saramin</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] text-ink/80">saramin-logo.svg · 420×96</p>
                <p className="text-[10.5px] text-faint">SVG or PNG at 2× · max 400 KB · transparent background. Printed top-right on every document.</p>
              </div>
              <button className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-muted hover:border-ink/40">Replace</button>
            </div>
          </div>
        </JobGroup>

        <JobGroup title="Document defaults">
          <div className="grid grid-cols-3 gap-3">
            <LField label="Thuế suất VAT / VAT rate" req value="8%" select hint="A State rate change is made here once (T&C clause 6). A sent document keeps the rate it was sent with." />
            <LField label="Quotation validity" req value="14 days" hint="Drives the default Ngày hết hạn." />
            <LField label="Discount needing approval" req value="> 20%" hint="Above this, Send is blocked pending a sales lead." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <LField label="Quotation no. format" value="EST-{seq}-{MM}-{YYYY}" hint="Gapless sequence." />
            <LField label="Sales order no. format" value="SO-{seq}-{MM}-{YYYY}" />
            <LField label="Support email" value="customercare@topdev.vn" hint="Printed in T&C clause 6." />
          </div>
        </JobGroup>

        <JobGroup title="Bank details — printed on the order for payment">
          <div className="grid grid-cols-3 gap-3">
            <LField label="Ngân hàng / Bank" req value="Vietcombank — CN Tân Bình" />
            <LField label="Số tài khoản / Account no." req value="0071 0004 12345" />
            <LField label="Chủ tài khoản / Account name" req value="CONG TY TNHH DAOUKIWOOM INNOVATION" />
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            Sent with the sales order because the default payment term is 100% in advance — the customer pays before the VAT
            e-invoice is issued (T&amp;C clause 3).
          </p>
        </JobGroup>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-amber-900">
          Editing these values is <b>versioned, not retroactive</b>. Documents already sent keep the letterhead, VAT rate and
          bank details they were issued with — reprinting a year-old quotation must produce the identical page.
        </p>
        <button className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Save</button>
      </div>
    </div>
  )
}

function AdminMasterData() {
  const [sel, setSel] = useState(0)
  const active = MD_DOMAINS[sel]
  return (
    <div>
      <div className="mb-3 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
        <b>Master data</b> — one source of truth for every reference list (dropdown / filter vocabulary) used across the Jobseeker, Company and Admin sites. Managing it here keeps the job form, resume form and Store search filters consistent. <b>vi</b> mandatory · <b>en / ko</b> optional.
      </div>
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        {/* left rail — domains */}
        <div className="overflow-hidden rounded-xl border border-line">
          {MD_DOMAINS.map((d, i) => (
            <button
              key={d.key}
              onClick={() => setSel(i)}
              className={cn('flex w-full items-center justify-between gap-2 border-b border-line-soft px-3.5 py-2.5 text-left last:border-0 hover:bg-canvas/50', i === sel && 'bg-brand-soft')}
            >
              <span className={cn('truncate text-[12.5px]', i === sel ? 'font-semibold text-brand' : 'text-ink/80')}>{d.label}</span>
              <span className="shrink-0 rounded-full bg-canvas px-1.5 text-[10px] tabular-nums text-faint">
                {d.kind === 'taxonomy' ? d.groups!.length : d.kind === 'grouped' ? d.groups!.reduce((n, g) => n + g.items.length, 0) : d.entries!.length}
              </span>
            </button>
          ))}
        </div>
        {/* detail */}
        <MDDomainDetail key={active.key} d={active} />
      </div>
      <p className="mt-3 text-[11px] text-faint">
        Each domain feeds the matching form dropdown; operators can also add a new value inline from those dropdowns (＋ Create new…) — new values are saved back here.
      </p>
    </div>
  )
}
function AdminAuditLog() {
  const rows = [
    ['10:42', 'Nguyễn Thị Lan', 'Activated customer', 'Công ty Vạn Phát'],
    ['10:31', 'Phạm Quang Huy', 'Viewed resume (PII)', 'CV #48211'],
    ['09:58', 'Lê Hữu Phong', 'Approved job', 'Digital Marketing Lead · Tiki'],
    ['09:40', 'Trần Quốc Trung', 'Granted credits (+500)', 'FPT Software'],
    ['09:12', 'System', 'Issued e-invoice', 'INV-3390'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Time', w: '0.7fr' }, { label: 'Actor', w: '1.2fr' }, { label: 'Action', w: '1.6fr' }, { label: 'Target', w: '1.8fr', align: 'r' }]}
      rows={rows}
      footer="Immutable log · PII-view actions (resumes) are always audited"
    />
  )
}
function AdminEnvironment() {
  const flags = [
    { name: 'store.jobs.realData', desc: 'Store job search reads real backend', on: true },
    { name: 'store.companies.reviews', desc: 'Company reviews (UGC) visible', on: false },
    { name: 'crm.purchaseOrders', desc: 'PO / payments / contracts enabled', on: false },
    { name: 'notifications.zaloZNS', desc: 'Zalo ZNS delivery channel', on: false },
  ]
  return (
    <div>
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.name} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[12px] font-medium text-ink">{f.name}</p>
              <p className="text-[11.5px] text-muted">{f.desc}</p>
            </div>
            <span className={cn('relative h-5 w-9 rounded-full transition-colors', f.on ? 'bg-brand' : 'bg-line')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all', f.on ? 'left-4' : 'left-0.5')} />
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-faint">Feature flags gate which Store screens use real data vs mock · some UI-editable, some env-only</p>
    </div>
  )
}
function AdminDepartments() {
  const rows = [
    ['Sales', '8', 'Nguyễn Thị Lan'],
    ['Operations', '12', 'Lê Hữu Phong'],
    ['Content', '5', 'Trần Quốc Trung'],
    ['Engineering', '14', 'Seonguk'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Department', w: '1.6fr' }, { label: 'Members', w: '0.8fr', align: 'r' }, { label: 'Lead', w: '1.4fr', align: 'r' }]}
      rows={rows}
      footer="Prototype only (no BE counterpart) — org-department reference data"
    />
  )
}

/* ── Sales / CRM — Sign-ups (inbound self-registrations) ─────────────────── */
type Signup = {
  person: string; email: string; company: string; via: string; when: string
  match: 'new' | 'lead' | 'customer' | 'spam'; matchName?: string
}
const SIGNUPS: Signup[] = [
  { person: 'Nguyễn Văn Toàn', email: 'toan@daiduong.vn', company: 'Công ty TNHH Đại Dương', via: 'no match on tax code / domain', when: '15m ago', match: 'new' },
  { person: 'Trần Thị Hà', email: 'ha@viettien.vn', company: 'Việt Tiến Logistics', via: 'tax code 0314xxxxxx', when: '1h ago', match: 'lead', matchName: 'Cty TNHH Việt Tiến' },
  { person: 'Lê Minh Khôi', email: 'khoi@fpt.com.vn', company: 'FPT Software', via: 'email domain @fpt.com.vn', when: '3h ago', match: 'customer', matchName: 'FPT Software' },
  { person: 'Đỗ Quốc Bảo', email: 'baohr@gmail.com', company: 'Startup ABC', via: 'public email domain — verify manually', when: '5h ago', match: 'new' },
  { person: 'asdf qwer', email: 'x@spam.io', company: 'zzz', via: 'flagged by spam filter', when: '6h ago', match: 'spam' },
]
const MATCH_META: Record<Signup['match'], { tone: StatusTone; label: string; action: string }> = {
  new: { tone: 'neutral', label: 'New company', action: 'Create lead →' },
  lead: { tone: 'pending', label: 'Matches a lead', action: 'Merge into lead' },
  customer: { tone: 'active', label: 'Existing customer', action: 'Send join request' },
  spam: { tone: 'rejected', label: 'Spam', action: 'Dismiss' },
}
function AdminSignups() {
  return (
    <div>
      <div className="mb-3 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
        Inbound self-registrations from the company site — this is lead capture. Triage each one: match it to a company already in the CRM, or create a new lead. Nothing is provisioned here.
      </div>

      {/* the 3 cases + their action */}
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-line p-2.5"><Pill tone="neutral">New company</Pill><p className="mt-1.5 text-[11px] text-muted">No match → <b className="text-ink">Create lead</b> (enters the pipeline).</p></div>
        <div className="rounded-lg border border-line p-2.5"><Pill tone="pending">Matches a lead</Pill><p className="mt-1.5 text-[11px] text-muted">Already in CRM → <b className="text-ink">Merge into lead</b> + notify owner.</p></div>
        <div className="rounded-lg border border-line p-2.5"><Pill tone="active">Existing customer</Pill><p className="mt-1.5 text-[11px] text-muted">Already a customer → <b className="text-ink">Send join request</b> to their admin.</p></div>
      </div>

      <TabBar tabs={[{ label: 'All', count: 34, active: true }, { label: 'New company', count: 19 }, { label: 'Matched', count: 12 }, { label: 'Spam', count: 3 }]} />
      <Table
        cols={[
          { label: 'Person', w: '1.5fr' }, { label: 'Company entered', w: '1.4fr' }, { label: 'Match', w: '1.7fr' },
          { label: 'When', w: '0.7fr', align: 'r' }, { label: 'Action', w: '1.5fr', align: 'r' },
        ]}
        rows={SIGNUPS.map((s) => {
          const m = MATCH_META[s.match]
          return [
            <div className="min-w-0"><p className="truncate text-[12.5px] font-medium text-ink">{s.person}</p><p className="truncate font-mono text-[10.5px] text-faint">{s.email}</p></div>,
            <span className="truncate">{s.company}</span>,
            <div className="min-w-0">
              <Pill tone={m.tone}>{m.label}{s.matchName ? `: ${s.matchName}` : ''}</Pill>
              <p className="mt-0.5 truncate text-[10.5px] text-faint">{s.via}</p>
            </div>,
            <span className="text-[11.5px] text-muted">{s.when}</span>,
            <div className="flex items-center justify-end gap-1.5">
              {s.match === 'spam'
                ? <RowAction tone="rose">Dismiss</RowAction>
                : <>
                    <button className={cn('rounded-md px-2.5 py-1 text-[11px] font-semibold text-white', s.match === 'new' ? 'bg-brand hover:opacity-90' : s.match === 'customer' ? 'bg-emerald-600 hover:opacity-90' : 'bg-amber-600 hover:opacity-90')}>{m.action}</button>
                    <RowAction tone="rose">Spam</RowAction>
                  </>}
            </div>,
          ]
        })}
      />
    </div>
  )
}

/* ── registry ─────────────────────────────────────────────────────────────── */
/* ── Reference data — Job categories & roles ─────────────────────────────── */
function TaxoPane({ title, items, activeIndex, onSelect }: { title: string; items: string[]; activeIndex?: number; onSelect?: (i: number) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
        <span className="text-[12.5px] font-bold text-ink">{title}</span>
        <button className="text-[12px] font-medium text-brand hover:underline">Add new +</button>
      </div>
      <div className="max-h-[420px] overflow-auto">
        {items.map((it, i) => (
          <div
            key={i}
            onClick={() => onSelect?.(i)}
            className={cn(
              'flex items-center justify-between border-b border-line-soft px-4 py-2.5 text-[12.5px] last:border-0',
              onSelect && 'cursor-pointer hover:bg-canvas/50',
              i === activeIndex && 'bg-brand-soft',
            )}
          >
            <span className={cn('truncate', i === activeIndex ? 'font-medium text-brand' : 'text-ink/80')}>{it}</span>
            <button className="shrink-0 text-[11.5px] text-brand hover:underline">Edit</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Create Job — draft field map ─────────────────────────────────────────────
 * A field inventory for the job-create form, NOT final visual design.
 * Structure adapted from the TopDev job dashboard (9-tab layout) and cross-checked
 * against a live Saramin post. Placeholder values are illustrative. Fields tagged
 * `confirm` need client sign-off (legal / VN-market / commercial specifics).
 * ------------------------------------------------------------------------------ */



function FLabel({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{children}{req && <span className="text-rose-500"> *</span>}</label>
}

/** free-text textarea placeholder */
function TArea({ label, req, value, rows = 3, hint, extra }: { label: React.ReactNode; req?: boolean; value: string; rows?: number; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: rows * 20 }}>{value}</div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** multi-value chip / token input placeholder */
function ChipField({ label, req, chips, placeholder, hint, extra }: { label: React.ReactNode; req?: boolean; chips: string[]; placeholder: string; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">{c}<span className="text-brand/50">×</span></span>
        ))}
        <span className="px-1 text-[12px] text-faint">{placeholder}</span>
      </div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/** inline single-value field with optional provenance/confirm markers + hint */
function FField({ label, req, value, select, hint, extra }: { label: React.ReactNode; req?: boolean; value: string; select?: boolean; hint?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
      {hint && <p className="mt-1 text-[10.5px] text-faint">{hint}</p>}
    </div>
  )
}

/* ── Job detail (read-only) — opened by clicking a job title ─────────────────── */
function AdminJobDetail({ job, onBack }: { job: JobRow; onBack: () => void }) {
  return (
    <div className="max-w-[900px]">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Jobs</button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{job.title} <Pill tone={job.status}>{job.statusLabel}</Pill></h2>
          <p className="text-[11.5px] text-muted">{job.category} · {job.company} · Created by {job.source}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Edit</button>
          {job.status === 'open' && <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Close</button>}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <MiniStat label="Applicants" value={job.applicants || '—'} sub="total received" />
        <MiniStat label="Views" value={job.views.toLocaleString('en-US')} sub="job detail views" />
        <MiniStat label="Saves" value={job.saves.toLocaleString('en-US')} sub="saved by seekers" />
        <MiniStat label="Created by" value={job.source} sub={job.source === 'Admin' ? 'HQ on behalf' : 'company HR'} />
        <MiniStat label="Posted" value={job.posted} sub="went live" />
        <MiniStat label="Expires" value={job.deadline} sub="applications close" />
        <MiniStat label="Status" value={job.statusLabel} tone={job.status === 'schedule' ? 'warn' : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <DetailCard title="Overview">
          <KV label="Company" value={job.company} />
          <KV label="Category · role" value="IT · Software Developer" />
          <KV label="Level" value="Team Lead / Manager" />
          <KV label="Experience" value="7+ years" />
          <KV label="Salary" value="Negotiable (hidden)" />
          <KV label="Location" value="Hồ Chí Minh" />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">Placeholder detail — mirrors the create-form fields. Real values load from the saved job record.</p>
        </DetailCard>
        <DetailCard title="Description">
          <Section title="Responsibilities" />
          <p className="text-[12px] leading-relaxed text-muted">Lead the development team; backend architecture (70%) + frontend (30%); code review &amp; mentoring…</p>
          <Section title="Requirements" />
          <p className="text-[12px] leading-relaxed text-muted">7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…</p>
        </DetailCard>
      </div>

      {job.status === 'open' && <p className="mt-3 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] text-muted">This job is live on the jobseeker site. Turn Exposure off to take it down without closing it — or Close to end it.</p>}
    </div>
  )
}

/** A form section: a big underlined header with its fields below (VietnamWorks-style). */
function JobGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b-2 border-line pb-2 text-[18px] font-bold tracking-tight text-ink">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** Inline "Show to Job Seekers" switch, shown to the right of a field label. */
function ShowToggle({ on = true }: { on?: boolean }) {
  const [v, setV] = useState(on)
  return (
    <button onClick={() => setV((x) => !x)} className="flex items-center gap-2 text-[11px] text-muted">
      Show to Job Seekers
      <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', v ? 'bg-brand' : 'bg-line')}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', v ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

/** − [n] + stepper placeholder. */
function Stepper({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-line">
      <span className="px-3 py-2 text-[13px] text-muted">−</span>
      <span className="min-w-[48px] border-x border-line px-3 py-2 text-center text-[12.5px] text-ink/80">{value}</span>
      <span className="px-3 py-2 text-[13px] text-muted">+</span>
    </div>
  )
}

/** Field label row with an optional right-aligned control (e.g. Show-to-jobseekers). */
function LabelRow({ label, req, right }: { label: string; req?: boolean; right?: React.ReactNode }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <label className="text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

/** Compact demographic row (VietnamWorks-style): label · radios · Show-toggle, kept close together. */
function DemoRow({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <label className="w-36 text-[11.5px] font-medium text-ink/80">{label}</label>
      <RadioOpts options={options} value="Any" />
      <ShowToggle on={false} />
    </div>
  )
}

/**
 * Interactive single-select dropdown (click to open, pick one).
 *
 * `createLabel` turns on the inline "＋ Create new…" affordance: master-data-backed
 * fields (category, level, industry, currency…) let an operator add a new option
 * without leaving the form — the new value is added to Master data and selected.
 */
function SelectField({ label, req, value, options, extra, createLabel }: { label: string; req?: boolean; value: string; options: string[]; extra?: React.ReactNode; createLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [sel, setSel] = useState(value)
  const [opts, setOpts] = useState(options)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const commit = () => {
    const v = draft.trim()
    if (v) { setOpts((o) => (o.includes(v) ? o : [...o, v])); setSel(v) }
    setDraft(''); setCreating(false); setOpen(false)
  }
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center rounded-md border border-line bg-surface px-3 py-2 text-left text-[12.5px] text-ink/80">
          {sel}<span className="ml-auto text-faint">▾</span>
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-lg">
            <div className="max-h-52 overflow-auto py-1">
              {opts.map((o) => (
                <button key={o} onClick={() => { setSel(o); setOpen(false) }} className={cn('block w-full px-3 py-1.5 text-left text-[12px] hover:bg-canvas', o === sel ? 'bg-brand-soft font-medium text-brand' : 'text-ink/80')}>{o}</button>
              ))}
            </div>
            {createLabel && (
              <div className="border-t border-line-soft bg-canvas/50">
                {creating ? (
                  <div className="flex items-center gap-1.5 p-1.5">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setCreating(false); setDraft('') } }}
                      placeholder={`New ${label.toLowerCase()}…`}
                      className="min-w-0 flex-1 rounded border border-line bg-surface px-2 py-1 text-[12px] outline-none focus:border-brand"
                    />
                    <button onClick={commit} className="shrink-0 rounded bg-brand px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90">Add</button>
                  </div>
                ) : (
                  <button onClick={() => setCreating(true)} className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[12px] font-medium text-brand hover:bg-brand-soft">
                    <span className="text-[14px] leading-none">＋</span> {createLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Radio option pills without a label (label handled by LabelRow). */
function RadioOpts({ options, value }: { options: string[]; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 pt-0.5">
      {options.map((o) => (
        <span key={o} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/80">
          <span className={cn('grid h-4 w-4 place-items-center rounded-full border-2', o === value ? 'border-brand' : 'border-line')}>{o === value && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
          {o}
        </span>
      ))}
    </div>
  )
}

/** Company summary chip — click to open the company detail page on Admin. */
function CompanyInfoCard() {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3 text-left transition-colors hover:border-brand/40">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">NEC</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">NEC Vietnam <span className="text-[11px] font-normal text-muted">· ID CO-1042</span></p>
        <p className="text-[11px] text-muted">IT / Software · 100–499 staff · Head office: Hồ Chí Minh</p>
      </div>
      <span className="ml-auto flex items-center gap-2">
        <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">✓ Job-Posting quota</span>
        <span className="text-[15px] text-muted">→</span>
      </span>
    </button>
  )
}

const TITLE_I18N: Record<'VI' | 'EN', string> = {
  VI: 'Trưởng nhóm kỹ thuật (.NET, tiếng Nhật N4+)',
  EN: 'Technical Leader / Technical Architect (.NET)',
}

/** Bilingual textarea — VI / EN tab on the label row. */
function BiTArea({ label, req, vi, en, rows = 4 }: { label: string; req?: boolean; vi: string; en: string; rows?: number }) {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI')
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label className="text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
        <div className="ml-auto flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
          {(['VI', 'EN'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)} className={cn('px-2 py-0.5', lang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-faint" style={{ minHeight: rows * 20 }}>{lang === 'VI' ? vi : en}</div>
    </div>
  )
}

function AdminJobCreate({ onBack }: { onBack: () => void }) {
  const [exposed, setExposed] = useState(true)
  const [postMenu, setPostMenu] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [titleLang, setTitleLang] = useState<'VI' | 'EN'>('VI')
  const [locations, setLocations] = useState<string[]>(['Burning Bros D2 · 69 Võ Nguyên Giáp, Thảo Điền, Quận 2, HCMC'])
  const G2 = 'grid grid-cols-2 gap-3'
  const G3 = 'grid grid-cols-3 gap-3'

  return (
    <div className="max-w-[860px]">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Jobs</button>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mt-0.5 text-[20px] font-bold tracking-tight">Create job <span className="font-medium text-muted">— draft field map</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="draft">Draft</Pill>
          <a className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-brand">👁 Preview draft ↗</a>
        </div>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-faint">
        <b>Status:</b> Draft → Schedule (publishes at a future time) → Open (live on the jobseeker site) → Closed (expired). While <b>Draft</b> or <b>Schedule</b>, the link above previews the draft; once <b>Open</b> it links to the live job post. <b>Exposure</b> (On / Off) is separate — an Open job can be hidden from jobseekers by turning Exposure Off.
      </p>

      <div className="space-y-8">
        {/* ═══ POSTING SETUP (company · package · exposure) ═════════════════ */}
        <JobGroup title="Posting setup">
          <SelectField label="Company" req value="NEC Vietnam · CO-1042" createLabel="Create company" options={['NEC Vietnam · CO-1042', 'FPT Software · CO-1007', 'VNG Corporation · CO-2231', 'Tiki · CO-1890', 'MoMo · CO-3120']} extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— searchable by name or ID</span>} />
          <CompanyInfoCard />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <LabelRow label="Package" />
              <div className="flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2">
                <span className="text-[12.5px] text-ink/80">Free <span className="text-[11px] text-muted">· expires in 14 days</span></span>
                <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">from linked order</span>
              </div>
            </div>
            <div>
              <LabelRow label="Exposure" />
              <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
                <span className="min-w-0 flex-1 text-[11.5px] text-muted">{exposed ? 'On — visible on the jobseeker site.' : 'Off — hidden; reversible before the deadline (does not Close).'}</span>
                <button role="switch" aria-checked={exposed} onClick={() => setExposed((v) => !v)} className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', exposed ? 'bg-emerald-500' : 'bg-line')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', exposed ? 'left-[18px]' : 'left-0.5')} />
                </button>
              </div>
            </div>
          </div>
        </JobGroup>

        {/* ═══ JOB INFORMATION (client field list) ══════════════════════════ */}
        <JobGroup title="Job information">
          {/* job title — single field, VI / EN tab */}
          <div>
            <LabelRow label="Job title" req right={
              <div className="flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
                {(['VI', 'EN'] as const).map((l) => (
                  <button key={l} onClick={() => setTitleLang(l)} className={cn('px-2 py-0.5', titleLang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
                ))}
              </div>
            } />
            <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{TITLE_I18N[titleLang]}</div>
            <p className="mt-1 text-[10.5px] text-faint">Vietnamese is the default &amp; fallback language; English optional.</p>
          </div>

          <div className={G2}>
            <SelectField label="Job category" req value="IT" createLabel="Create category" options={['IT', 'Marketing', 'Finance & Accounting', 'Sales', 'Human Resources', 'Design', 'Engineering', 'Healthcare', 'Education']} />
            <ChipField label="Job role" req chips={['Software Developer']} placeholder="Add role…" hint="Roles come from the selected category (Master data). Type to add a new one." />
          </div>
          <div className={G2}>
            <SelectField label="Job level" req value="Experienced (non-manager)" createLabel="Create job level" options={['Intern/Student', 'Fresher/Entry level', 'Experienced (non-manager)', 'Manager', 'Director and above']} />
            <SelectField label="Job type" req value="Full-time" createLabel="Create job type" options={['Full-time', 'Part-time', 'Internship', 'Online Jobs', 'Freelancer', 'Seasonal', 'Other']} />
          </div>
          <div className={G2}>
            <SelectField label="Industry" req value="FMCG" createLabel="Create industry" options={['IT / Software', 'FMCG', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Logistics']} />
            <ChipField label="Skill" chips={['ASP.NET Core', '.NET', 'React']} placeholder="Add skill…" />
          </div>
          <div>
            <LabelRow label="Working location (up to 3 locations)" req />
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{loc}<span className="ml-auto">▾</span></div>
                  {locations.length > 1 && (
                    <button onClick={() => setLocations((ls) => ls.filter((_, j) => j !== i))} className="rounded-md border border-line px-2 py-2 text-[12px] text-muted">🗑</button>
                  )}
                </div>
              ))}
            </div>
            {locations.length < 3 && (
              <button onClick={() => setLocations((ls) => [...ls, 'Select a working location…'])} className="mt-1 text-[11px] font-medium text-brand">+ Add a working location</button>
            )}
          </div>

          <BiTArea label="Job description" req rows={4}
            vi="Lãnh đạo nhóm phát triển; kiến trúc backend (70%) + frontend (30%); review code & mentoring…"
            en="Lead the development team; backend architecture (70%) + frontend (30%); code review & mentoring…" />
          <BiTArea label="Requirements" req rows={4}
            vi="7+ năm phát triển phần mềm; 3+ năm ở vị trí Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; tiếng Nhật N4+…"
            en="7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…" />
          <BiTArea label="Benefits" rows={3}
            vi="Bảo hiểm đầy đủ; lương tháng 13; phụ cấp ngoại ngữ tới $500/tháng; 19+ ngày phép; Udemy; hybrid…"
            en="Full insurance; 13th-month salary; language allowance up to $500/mo; 19+ paid leave; Udemy; hybrid…" />

          <div>
            <LabelRow label="Salary range" req right={<ShowToggle />} />
            <div className={G3}>
              <FField label="From" value="500" />
              <FField label="To" value="1500" />
              <SelectField label="Currency" value="USD" createLabel="Create currency" options={['USD', 'VND', 'JPY', 'CNY', 'EUR', 'INR', 'GBP', 'RUB', 'SGD']} />
            </div>
          </div>
          <div>
            <LabelRow label="Number of headcount" right={<ShowToggle on={false} />} />
            <Stepper value="1" />
          </div>
          <FField label="Application deadline" req value="dd/mm/yyyy" select />
        </JobGroup>

        {/* ═══ CANDIDATE EXPECTATION ════════════════════════════════════════ */}
        <JobGroup title="Candidate expectation">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            ⚠️ Demographic fields (nationality / gender / marital status / age) are legally sensitive for VN job ads — confirm with the client whether to collect / display them.
          </div>
          <div className={G2}>
            <div>
              <LabelRow label="Minimum years of experience" />
              <Stepper value="Minimum" />
            </div>
            <SelectField label="Minimum education level" value="Bachelor" createLabel="Create education level" options={['High school', "Associate's degree", 'College', 'Bachelor', 'Master', 'Doctorate', 'Others']} />
          </div>
          <DemoRow label="Nationality" options={['Any', 'Vietnamese', 'Foreigner']} />
          <DemoRow label="Gender" options={['Any', 'Male', 'Female']} />
          <DemoRow label="Marital status" options={['Any', 'Single', 'Married']} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <label className="w-36 text-[11.5px] font-medium text-ink/80">Age preference</label>
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <span className="rounded-md border border-line bg-surface px-3 py-1.5">18</span>—<span className="rounded-md border border-line bg-surface px-3 py-1.5">60</span>
            </div>
            <ShowToggle on={false} />
          </div>
          <div>
            <LabelRow label="Do you require cover letter?" />
            <RadioOpts options={['Yes, always required', 'No, it is optional', 'No, it is never required']} value="No, it is never required" />
          </div>
        </JobGroup>

        {/* ═══ INTERNAL (HQ ONLY) ═══════════════════════════════════════════ */}
        <JobGroup title="Internal (HQ only)">
          <TArea label="Notes" value="Approval context, special instructions, follow-ups… — never shown publicly." rows={3} />
        </JobGroup>
      </div>

      {/* footer actions */}
      <div className="mt-6 border-t border-line pt-4">
        {scheduling && (
          <div className="mb-3 rounded-lg border border-line bg-canvas/40 p-3">
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Schedule publish time</p>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-faint">
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5">📅 dd/mm/yyyy</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5">🕐 hh:mm</span>
              <span className="text-[11px] text-muted">GMT+7</span>
              <button onClick={() => setScheduling(false)} className="ml-1 text-[11px] font-medium text-muted underline">Cancel</button>
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">Job is saved with <b>Schedule</b> status and auto-publishes to <b>Open</b> at this time.</p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Save as draft</button>
          <div className="relative">
            <button onClick={() => setPostMenu((o) => !o)} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">
              {scheduling ? 'Schedule post' : 'Post now'} <span className="text-[11px]">▾</span>
            </button>
            {postMenu && (
              <div className="absolute right-0 z-10 mt-1 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                <button onClick={() => { setScheduling(false); setPostMenu(false) }} className="block w-full px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-canvas">Post now — publish immediately</button>
                <button onClick={() => { setScheduling(true); setPostMenu(false) }} className="block w-full border-t border-line-soft px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-canvas">📅 Schedule for later…</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Open questions for the client: bilingual coverage per field (VI/EN/KO) · whether demographic fields are collected at all · salary-display policy · which package/boost SKUs exist · approval workflow (auto vs manual).
      </p>
    </div>
  )
}

export const ADMIN_PROTOTYPES: Record<string, () => JSX.Element> = {
  // Recruitment
  'admin-job-list': AdminJobList,
  'admin-job-create': AdminJobCreateStandalone,
  'admin-job-applicants': AdminApplicants,
  'admin-resumes': AdminResumes,
  // Companies
  'admin-company-list': AdminCompanyList,
  'admin-company-pipeline': AdminCompanyPipeline,
  // User — both sides of the marketplace's people accounts
  'admin-jobseekers': AdminJobseekers,
  'admin-company-users': AdminCompanyUsers,
  // Content
  'admin-banners': AdminBanners,
  'admin-popups': AdminPopups,
  'admin-pages': AdminPages,
  'admin-boards': AdminBoards,
  'admin-blog': AdminBlog,
  // Billing & products
  'admin-catalog': AdminCatalog,
  'admin-bundles': AdminBundles,
  'admin-credits': AdminCredits,
  'admin-orders': AdminOrders,
  'admin-promotions': AdminPromotions,
  // Sales / CRM
  'admin-signups': AdminSignups,
  'admin-sales-pipeline': AdminPipeline,
  'admin-quotes': AdminQuotes,
  'admin-invoices': AdminInvoices,
  'admin-purchase-orders': AdminPOs,
  'admin-payments': AdminPayments,
  'admin-contracts': AdminContracts,
  // Analytics
  'admin-analytics-dashboard': AdminDashboard,
  'admin-sales-report': AdminSalesReport,
  'admin-recruit-report': AdminRecruitReport,
  'admin-revenue-report': AdminRevenueReport,
  'admin-user-behavior': AdminUserBehavior,
  // System
  'admin-users': AdminUsers,
  'admin-roles': AdminRoles,
  'admin-issuer': AdminIssuer,
  'admin-master-data': AdminMasterData,
  'admin-audit-log': AdminAuditLog,
  'admin-environment': AdminEnvironment,
  'admin-departments': AdminDepartments,
  // Job categories & roles now live inside Master data (one page); keep the id mapped.
  'admin-job-categories': AdminMasterData,
}
