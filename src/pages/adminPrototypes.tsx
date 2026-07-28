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
      <div style={{ gridTemplateColumns: tmpl, minWidth: minW }} className="grid gap-x-3 bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {cols.map((c, i) => <span key={i} className={alignCls(c.align)}>{c.label}</span>)}
      </div>
      {rows.map((r, ri) => (
        <div key={ri} style={{ gridTemplateColumns: tmpl, minWidth: minW }} className="grid gap-x-3 items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]">
          {r.map((cell, ci) => (
            <span key={ci} className={cn('flex min-w-0 items-center gap-1.5 text-ink/80', alignCls(cols[ci]?.align))}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  )
}

function Footer({ text }: { text: string }) {
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

function ListPage({ tabs, cols, rows, footer, minW }: { tabs?: { label: string; count?: number; active?: boolean }[]; cols: Col[]; rows: React.ReactNode[][]; footer: string; minW?: number }) {
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
      minW={1100}
      tabs={[{ label: 'All', count: 1248 }, { label: 'Draft', count: 8 }, { label: 'Schedule', count: 5, active: true }, { label: 'Open', count: 1180 }, { label: 'Closed', count: 58 }]}
      cols={[
        { label: 'Job title', w: '1.9fr' },
        { label: 'Company', w: '1.2fr' },
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
        <button onClick={() => setDetail(r)} className="min-w-0 text-left"><p className="truncate font-medium text-brand hover:underline">{r.title}</p><p className="truncate text-[11px] text-faint">{r.category}</p></button>,
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

function AdminApplicants() {
  const rows = [
    ['Nguyễn Văn An', 'Senior Frontend Engineer', 'FPT Software', <Pill tone="neutral">Screening</Pill>, '2h ago'],
    ['Trần Thị Bích', 'Digital Marketing Lead', 'Tiki', <Pill tone="pending">Interview</Pill>, '5h ago'],
    ['Lê Hoàng Cường', 'Product Manager', 'MoMo', <Pill tone="active">Offer</Pill>, '1d ago'],
    ['Phạm Thu Dung', 'Kế toán tổng hợp', 'VNG', <Pill tone="neutral">New</Pill>, '1d ago'],
    ['Vũ Minh Đức', 'Backend Engineer (Go)', 'Shopee', <Pill tone="rejected">Rejected</Pill>, '3d ago'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 342 }, { label: 'New', count: 12, active: true }, { label: 'Screening', count: 88 }, { label: 'Interview', count: 40 }, { label: 'Hired', count: 21 }]}
      cols={[{ label: 'Candidate', w: '1.3fr' }, { label: 'Applied to', w: '1.5fr' }, { label: 'Company', w: '1fr' }, { label: 'Stage', w: '1fr' }, { label: 'Applied', w: '0.8fr', align: 'r' }]}
      rows={rows}
      footer="Showing 5 of 342 applicants — HQ oversight view across all jobs"
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
type Account = 'New' | 'Existing' | 'Churn'
type Company = {
  name: string; shortName: string; legalName: string; tax: string; industry: string; size: string; address: string
  contact: string; owner: string; status: CoStatus
  account: Account | null; lastPO: string; renewal: string; nextStep: string
  idle: number; note: string; revenue: number
  jobPosting: boolean; resumeSearch: boolean; jobLeft: number; jobTotal: number; cvLeft: number; cvTotal: number
  hasPage: boolean; jobs: number; domain: string; since: string
}
const COMPANIES: Company[] = [
  { name: 'Công ty TNHH Đại Dương', shortName: 'Đại Dương', legalName: 'Công ty TNHH Đại Dương', tax: '0315xxxxxx', industry: 'Thủy sản', size: '50–200', address: 'Hải Phòng', contact: 'Mr. Nguyễn Văn Toàn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '18/06/2026', renewal: '18/12/2026', nextStep: 'Quarterly review', idle: 4, note: 'Renewal discussion started.', revenue: 55_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 10, cvLeft: 45, cvTotal: 80, hasPage: true, jobs: 3, domain: 'daiduong.vn', since: '12/04/2025' },
  { name: 'Công ty CP Bình Minh', shortName: 'Bình Minh', legalName: 'Công ty Cổ phần Bình Minh', tax: '0316xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận 3, HCMC', contact: 'Ms. Lê Thu Hằng · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: null, lastPO: '—', renewal: '—', nextStep: 'Schedule product demo', idle: 6, note: 'Quotation sent — demo booked 29/07.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'binhminh.edu.vn', since: '—' },
  { name: 'Công ty TNHH Sao Mai', shortName: 'Sao Mai', legalName: 'Công ty TNHH Sao Mai', tax: '0317xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Mr. Trần Đức Anh · HR Mgr', owner: 'Trần Quốc Trung', status: 'Negotiation', account: null, lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 12, note: 'Waiting on their board approval.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'saomai.vn', since: '—' },
  { name: 'Công ty TNHH Vạn Phát', shortName: 'Vạn Phát', legalName: 'Công ty TNHH Vạn Phát', tax: '0312xxxxxx', industry: 'Healthcare', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Vũ Thanh Linh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'New', lastPO: '26/05/2026', renewal: '26/08/2026', nextStep: 'Onboarding check-in', idle: 3, note: 'Kickoff scheduled 30/07.', revenue: 37_800_000, jobPosting: true, resumeSearch: true, jobLeft: 7, jobTotal: 10, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 4, domain: 'vanphat.vn', since: '26/05/2026' },
  { name: 'FPT Software', shortName: 'FPT Software', legalName: 'Công ty TNHH Phần mềm FPT', tax: '0101xxxxxx', industry: 'CNTT', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Lý Văn Giang · HR Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '15/06/2026', renewal: '15/09/2026', nextStep: 'Upsell Resume Search', idle: 9, note: 'Discussed CV-search add-on.', revenue: 420_000_000, jobPosting: true, resumeSearch: false, jobLeft: 12, jobTotal: 50, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 38, domain: 'fpt.com.vn', since: '12/01/2024' },
  { name: 'Công ty CP Hoàng Gia', shortName: 'Hoàng Gia', legalName: 'Công ty Cổ phần Hoàng Gia', tax: '0313xxxxxx', industry: 'Bất động sản', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Đỗ Thu Hà · Recruiter', owner: 'Trần Quốc Trung', status: 'PO', account: 'New', lastPO: '03/03/2026', renewal: '03/09/2026', nextStep: 'Confirm CV-unlock usage', idle: 1, note: 'PO signed; awaiting payment.', revenue: 20_000_000, jobPosting: false, resumeSearch: true, jobLeft: 0, jobTotal: 0, cvLeft: 40, cvTotal: 50, hasPage: false, jobs: 0, domain: 'hoanggia.vn', since: '03/03/2026' },
  { name: 'Công ty TNHH Việt Tiến', shortName: '', legalName: 'Công ty TNHH Việt Tiến Logistics', tax: '0314xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận Bình Tân, HCMC', contact: 'Mr. Ngô Minh Tú', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '10/07/2025', renewal: 'Lapsed', nextStep: 'Win-back call', idle: 21, note: 'No response to renewal ×3.', revenue: 90_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'viettien.vn', since: '15/08/2024' },
  { name: 'Tiki', shortName: 'Tiki', legalName: 'Công ty TNHH TIKI', tax: '0309xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 4, HCMC', contact: 'Ms. Bùi Thu Hằng · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '01/07/2026', renewal: '01/10/2026', nextStep: 'Quarterly review', idle: 5, note: 'QBR booked next week.', revenue: 300_000_000, jobPosting: true, resumeSearch: true, jobLeft: 21, jobTotal: 30, cvLeft: 210, cvTotal: 300, hasPage: true, jobs: 21, domain: 'tiki.vn', since: '10/11/2023' },
  { name: 'VNG Corporation', shortName: 'VNG', legalName: 'Công ty CP VNG', tax: '0304xxxxxx', industry: 'CNTT', size: '1000–5000', address: 'Quận 7, HCMC', contact: 'Mr. Đoàn Hải Nam · HR Director', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '20/06/2026', renewal: '20/12/2026', nextStep: 'Renewal upsell deck', idle: 4, note: 'Interested in employer-branding page.', revenue: 510_000_000, jobPosting: true, resumeSearch: true, jobLeft: 30, jobTotal: 40, cvLeft: 180, cvTotal: 400, hasPage: true, jobs: 27, domain: 'vng.com.vn', since: '05/02/2024' },
  { name: 'MoMo', shortName: 'MoMo', legalName: 'Công ty CP Dịch vụ Di động Trực tuyến (M_Service)', tax: '0305xxxxxx', industry: 'Fintech', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Trịnh Khánh Vy · TA Lead', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'New', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Collect payment on PO', idle: 2, note: 'PO signed; invoice pending.', revenue: 150_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 15, cvLeft: 90, cvTotal: 120, hasPage: true, jobs: 9, domain: 'momo.vn', since: '18/07/2026' },
  { name: 'Thế Giới Di Động', shortName: 'TGDĐ', legalName: 'Công ty CP Đầu tư Thế Giới Di Động', tax: '0306xxxxxx', industry: 'Bán lẻ', size: '5000+', address: 'Thủ Đức, HCMC', contact: 'Mr. Cao Văn Đức · HR Manager', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '10/05/2026', renewal: '10/11/2026', nextStep: 'Quarterly review', idle: 8, note: 'Volume hiring for new stores.', revenue: 620_000_000, jobPosting: true, resumeSearch: true, jobLeft: 40, jobTotal: 80, cvLeft: 300, cvTotal: 500, hasPage: true, jobs: 54, domain: 'thegioididong.com', since: '22/09/2023' },
  { name: 'Shopee Việt Nam', shortName: 'Shopee', legalName: 'Công ty TNHH Shopee', tax: '0307xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Lâm Ngọc Bích · TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: null, lastPO: '—', renewal: '—', nextStep: 'Align on package + price', idle: 5, note: 'Comparing us vs a competitor.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'shopee.vn', since: '—' },
  { name: 'Base.vn', shortName: 'Base.vn', legalName: 'Công ty CP Base Enterprise', tax: '0308xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Phan Anh Tuấn', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: null, lastPO: '—', renewal: '—', nextStep: 'Book discovery call', idle: 3, note: 'Inbound from website form.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'base.vn', since: '—' },
  { name: 'Công ty CP Đông Á', shortName: '', legalName: 'Công ty Cổ phần Đông Á', tax: '0318xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Hà Kiều Trang · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: null, lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 16, note: 'Quotation sent — gone quiet.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongabank.com.vn', since: '—' },
  { name: 'Công ty TNHH Minh Long', shortName: 'Minh Long', legalName: 'Công ty TNHH Gốm sứ Minh Long', tax: '0319xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Lý Quốc Bảo', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '02/06/2025', renewal: 'Lapsed', nextStep: 'Win-back next quarter', idle: 28, note: 'Budget frozen; revisit in Q4.', revenue: 60_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhlong.com', since: '14/03/2024' },
  { name: 'Công ty CP An Khang', shortName: 'An Khang', legalName: 'Công ty Cổ phần Dược phẩm An Khang', tax: '0321xxxxxx', industry: 'Y tế', size: '200–500', address: 'Quận 10, HCMC', contact: 'Ms. Trần Mỹ Duyên · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: null, lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 4, note: 'Quotation sent for Job Posting Pro.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ankhang.vn', since: '—' },
  { name: 'Công ty TNHH Phú Thịnh', shortName: 'Phú Thịnh', legalName: 'Công ty TNHH Thương mại Phú Thịnh', tax: '0322xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Hồ Đăng Khoa · Trưởng phòng HC-NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: null, lastPO: '—', renewal: '—', nextStep: 'Waiting on director approval', idle: 11, note: 'Asked for 10% discount; escalated.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuthinh.com.vn', since: '—' },
  { name: 'Công ty CP Thành Đạt', shortName: 'Thành Đạt', legalName: 'Công ty Cổ phần Xây dựng Thành Đạt', tax: '0320xxxxxx', industry: 'Xây dựng', size: '200–500', address: 'Quận Hà Đông, Hà Nội', contact: 'Mr. Vũ Đình Khôi · HR', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'New', lastPO: '12/07/2026', renewal: '12/10/2026', nextStep: 'Onboarding check-in', idle: 6, note: 'First purchase — Job Posting.', revenue: 25_000_000, jobPosting: true, resumeSearch: false, jobLeft: 8, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 3, domain: 'thanhdat.com.vn', since: '12/07/2026' },
]

const AC_STATUS: Record<Account, { tone: StatusTone; label: string }> = {
  New: { tone: 'pending', label: 'New' },
  Existing: { tone: 'neutral', label: 'Existing' },
  Churn: { tone: 'rejected', label: 'Churn' },
}
// A company shows a pipeline step only while a deal is open (before it closes at
// Invoice, or dies at Lost). Settled customers show "—".
const inPipeline = (c: Company) => c.status !== 'Invoice' && c.status !== 'Lost'
const revFmt = (v: number) => (v === 0 ? '—' : (v / 1e6).toFixed(0) + 'M ₫')

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
}
const coValue = (c: Company) => CO_VALUE[c.name] ?? 0
/** Display label: prefer the short/brand name, fall back to the legal name. */
const coLabel = (c: Company) => c.shortName?.trim() || c.legalName

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
                <p className="text-[10.5px] text-muted tabular-nums">{vnd(coValue(c))}</p>
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
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} />

  const rows = view === 'me' ? COMPANIES.filter((c) => c.owner === ME) : COMPANIES
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

      {creating && <CreateLeadModal onClose={() => setCreating(false)} />}

      <Table
        minW={1320}
        cols={[
          { label: 'Company', w: '1.4fr' },
          { label: 'Industry', w: '0.9fr' },
          { label: 'Location', w: '0.9fr' },
          { label: 'Status', w: '0.8fr' },
          { label: 'Owner', w: '0.9fr' },
          { label: 'Idle', w: '0.6fr' },
          { label: 'Latest note', w: '1.6fr' },
          { label: 'Total revenue', w: '0.9fr', align: 'r' },
          { label: 'Pipeline', w: '0.9fr' },
        ]}
        rows={rows.map((c) => [
          <button onClick={() => setOpen(c)} className="block min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">{coLabel(c)}</button>,
          <span className="truncate">{c.industry}</span>,
          <span className="truncate">{c.address}</span>,
          c.account ? <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill> : <span className="text-faint">—</span>,
          <span className="truncate">{c.owner}</span>,
          <span className={cn('tabular-nums', c.idle > 14 ? 'font-medium text-rose-600' : c.idle > 7 ? 'text-amber-600' : 'text-muted')}>{c.idle > 14 ? '🔥 ' : ''}{c.idle}d</span>,
          <span className="truncate text-muted">{c.note}</span>,
          <span className="tabular-nums">{revFmt(c.revenue)}</span>,
          inPipeline(c) ? <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill> : <span className="text-faint">—</span>,
        ])}
      />
      <Footer text={view === 'me' ? `Showing ${rows.length} of 84 — your book of business.` : `Showing ${rows.length} of 512 — every company across the team. Filter by owner to drill into one rep.`} />
    </div>
  )
}

/* ── Pipeline — the same companies as a status board (opens the same record) ── */
function AdminCompanyPipeline() {
  const [open, setOpen] = useState<Company | null>(null)
  const [view, setView] = useState<'me' | 'team'>('me')
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} />
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
function companyActivity(c: Company): CoEvent[] {
  const owner = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const noProducts = !c.jobPosting && !c.resumeSearch
  if (noProducts) {
    return [
      { icon: '⚠️', tone: 'bg-amber-100 text-amber-700', title: 'Subscription expired', time: '3 weeks ago', sub: 'All quota lapsed — account is read-only until renewal.' },
      { icon: '✉', tone: 'bg-violet-100 text-violet-700', title: 'Renewal reminder sent', time: '2 weeks ago', sub: `Emailed ${owner} — no response yet.` },
      { icon: '🏢', tone: 'bg-slate-100 text-slate-600', title: 'Account activated', time: c.since, sub: `Created from CRM (deal Won) · owner ${c.owner}.` },
    ]
  }
  const ev: CoEvent[] = []
  if (c.resumeSearch) ev.push({ icon: '🔍', tone: 'bg-sky-100 text-sky-700', title: 'CV unlocked (PII)', time: '10m ago', sub: `${owner} unlocked a candidate — ${c.cvTotal - c.cvLeft}/${c.cvTotal} unlocks used · audited.` })
  if (c.jobPosting) ev.push({ icon: '📢', tone: 'bg-emerald-100 text-emerald-700', title: 'Job published', time: '2h ago', sub: `${owner} posted a role — ${c.jobTotal - c.jobLeft}/${c.jobTotal} slots used.` })
  ev.push({ icon: '👤', tone: 'bg-violet-100 text-violet-700', title: 'User invited', time: '1d ago', sub: 'HR Specialist added by the HR Manager.' })
  if (c.hasPage) ev.push({ icon: '🌐', tone: 'bg-sky-100 text-sky-700', title: 'Company page published', time: '2 months ago', sub: 'Public profile went live on the jobseeker site.' })
  ev.push({ icon: '💳', tone: 'bg-amber-100 text-amber-700', title: 'Payment received', time: '2 months ago', sub: 'Bank transfer applied to INV-3390 · VAT e-invoice issued.' })
  ev.push({ icon: '📦', tone: 'bg-brand-soft text-brand', title: 'Products provisioned', time: '2 months ago', sub: [c.jobPosting && 'Job Posting', c.resumeSearch && 'Resume Search'].filter(Boolean).join(' + ') + ' — from the paid order.' })
  ev.push({ icon: '🏢', tone: 'bg-slate-100 text-slate-600', title: 'Account activated', time: c.since, sub: `Created from CRM (deal Won) · owner ${c.owner}.` })
  return ev
}

/* Sales activity log — compose a chat (channel + note) or a call (via Calio) */
const CHAT_CHANNELS = ['Zalo', 'Facebook Messenger', 'Email', 'SMS', 'Zalo OA', 'Phone', 'Other']
function CompanyActivities({ c }: { c: Company }) {
  const [kind, setKind] = useState<null | 'chat' | 'call'>(null)
  const [channel, setChannel] = useState('Zalo')
  const [note, setNote] = useState('')
  const [logged, setLogged] = useState<CoEvent[]>([])
  const base = companyActivity(c)

  const save = () => {
    const entry: CoEvent = kind === 'chat'
      ? { icon: '💬', tone: 'bg-sky-100 text-sky-700', title: `Chat · ${channel}`, time: 'just now', sub: note.trim() || 'No note added.' }
      : { icon: '📞', tone: 'bg-emerald-100 text-emerald-700', title: 'Call · logged via Calio', time: 'just now', sub: note.trim() || 'Call synced from Calio — outcome & recording attached.' }
    setLogged((p) => [entry, ...p])
    setKind(null); setNote(''); setChannel('Zalo')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
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

      {/* timeline */}
      <DetailCard title="Timeline" action={<span className="text-[11px] text-faint">newest first</span>}>
        <div className="space-y-3">
          {[...logged, ...base].map((e, i) => <TL key={i} icon={e.icon} title={e.title} time={e.time} sub={e.sub} tone={e.tone} />)}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-faint">Sales activities + system events in one trail. PII-view actions (resume unlocks) are always audited.</p>
      </DetailCard>
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

type CoTab = 'Overview' | 'Users' | 'Products & billing' | 'Company page' | 'Jobs' | 'Resume activity' | 'Activity'
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
function CompanyDetail({ c, onBack }: { c: Company; onBack: () => void }) {
  const [tab, setTab] = useState<CoTab>('Overview')
  const [inviting, setInviting] = useState(false)
  const [converting, setConverting] = useState(false)
  const preWon = !isCustomer(c) && c.status !== 'Lost' // still in the pipeline, no PO yet
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
    ...(c.resumeSearch ? [{ key: 'Resume activity' as CoTab, label: 'Resume activity' }] : []),
    { key: 'Activity', label: 'Activities' },
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
              {c.account
                ? <Pill tone={AC_STATUS[c.account].tone}>{AC_STATUS[c.account].label}</Pill>
                : <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
              {c.account && inPipeline(c) && <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
            </h2>
            <p className="text-[11.5px] text-muted">{c.legalName} · MST {c.tax} · <span className="font-mono">{c.domain}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>
          {c.hasPage && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">View on jobseeker ↗</button>}
          {preWon && <button onClick={() => setConverting(true)} className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Convert to customer</button>}
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
      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          <DetailCard title="Basic info — from CRM">
            <KV label="Legal name" value={c.legalName} />
            <KV label="Tax code (MST)" value={c.tax} />
            <KV label="Industry · size" value={`${c.industry} · ${c.size} staff`} />
            <KV label="Address" value={c.address} />
            <KV label="Primary contact" value={c.contact} />
            <KV label="Contact email" value={contactEmail} />
            <KV label="Contact phone" value={contactPhone} />
            <KV label="Sales owner" value={c.owner} />
            <p className="mt-2 rounded-md bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">🔗 Synced from the CRM customer record — the same company, one source of truth.</p>
          </DetailCard>

          <div className="space-y-4">
            <DetailCard title="Products & quota" action={<button onClick={() => setTab('Products & billing')} className="text-[11px] text-brand hover:underline">Manage →</button>}>
              <ProductsQuota c={c} compact />
            </DetailCard>
            <DetailCard title="Team" action={<button onClick={() => setTab('Users')} className="text-[11px] text-brand hover:underline">{team.length}/{MAX_SEATS} seats →</button>}>
              <div className="space-y-1.5">
                {team.slice(0, 3).map((u) => (
                  <div key={u.email} className="flex items-center justify-between gap-2 rounded-md border border-line px-2.5 py-1.5">
                    <span className="truncate text-[12px] font-medium text-ink">{u.name}</span>
                    <Pill tone={u.role === 'HR Manager' ? 'neutral' : 'draft'}>{u.role}</Pill>
                  </div>
                ))}
              </div>
            </DetailCard>
          </div>
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

              {/* Applications — same employer view the company sees on their own site */}
              <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-ink">Applications <span className="font-normal text-muted">— what the company sees on their site</span></p>
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
              <p className="mt-2 text-[11px] text-faint">Read-only for HQ — opening a candidate’s CV is written to the audit log.</p>
            </>
          )}
        </div>
      )}

      {/* ── Resume activity ──────────────────────────────────────────────── */}
      {tab === 'Resume activity' && (
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
      {tab === 'Activity' && <CompanyActivities c={c} />}

      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
      {converting && <ConvertLeadModal companyName={c.name} value={coValue(c)} owner={c.owner} onClose={() => setConverting(false)} />}
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
function AdminCatalog() {
  const rows = [
    ['Job Posting — Pro', 'Posting quota', '15,000,000 ₫', '10 posts · 3 months', <Pill tone="active">Active</Pill>],
    ['Resume Search — 6 months', 'Subscription', '20,000,000 ₫', '100 CV unlocks', <Pill tone="active">Active</Pill>],
    ['Main ad (Home hero)', 'Advertising', '8,000,000 ₫', 'Per week', <Pill tone="active">Active</Pill>],
    ['Recommend rank boost', 'Boost', '3,000,000 ₫', 'Per job · 14 days', <Pill tone="active">Active</Pill>],
    ['Talent pool access', 'Subscription', '30,000,000 ₫', '12 months', <Pill tone="draft">Draft</Pill>],
  ]
  return (
    <ListPage
      cols={[{ label: 'Product', w: '1.8fr' }, { label: 'Type', w: '1fr' }, { label: 'Price', w: '1fr', align: 'r' }, { label: 'Fulfilment', w: '1.2fr' }, { label: 'Status', w: '0.8fr', align: 'r' }]}
      rows={rows}
      footer="These are what the Store billing catalog sells — each product maps to an entitlement/quota"
    />
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
      cols={[{ label: 'Bundle', w: '1.2fr' }, { label: 'Includes', w: '2fr' }, { label: 'Package price', w: '1.1fr', align: 'r' }, { label: 'Status', w: '0.8fr', align: 'r' }]}
      rows={rows}
      footer="Bundles = several catalog products at a package price (maps to Store “Recruit package”)"
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

/* ── Sales / CRM ──────────────────────────────────────────────────────────── */
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

function IdlePill({ days }: { days: number }) {
  const tone: StatusTone = days > 14 ? 'rejected' : days > 7 ? 'pending' : 'draft'
  return <Pill tone={tone}>{days > 14 ? '🔥 ' : ''}Idle {days}d</Pill>
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
      <p className="mt-2 text-[11px] text-faint">Default view for long pipelines. Top row = most neglected open deal (🔥 idle &gt; 14d) — work down the list. Click a company to open the lead.</p>
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
function CreateLeadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">New company</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <LField label="Legal name" req value="Công ty TNHH …" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Short name" value="e.g. FPT, Tiki, NEC" hint="Display / brand name — shown on the pipeline & company page." />
            <LField label="Tax code (MST)" value="03xxxxxxxx" />
          </div>
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

      {/* hand-off banner — the answer to "what do I do after Won?" */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="text-[16px]">🎉</span>
        <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-emerald-800">
          <b>“Cty Trường Sơn” is Won.</b> The pipeline ends here. Next you <b>activate the customer</b> — create the account, choose products, and (for Job Posting) build the company page. This hands the customer off to <b>Account management</b>.
        </p>
        <button onClick={onActivate} className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">⚡ Activate customer →</button>
      </div>

      {creating && <CreateLeadModal onClose={() => setCreating(false)} />}
      {convertDeal && <ConvertLeadModal companyName={convertDeal.company} value={convertDeal.value} owner={convertDeal.owner} onClose={() => setConvertDeal(null)} />}
    </div>
  )
}
function AdminQuotes() {
  const rows = [
    ['Q-2041', 'Công ty Vạn Phát', '37,800,000 ₫', <Pill tone="active">Accepted</Pill>, '13/06/2026'],
    ['Q-2042', 'Việt Tiến Logistics', '28,536,925 ₫', <Pill tone="pending">Sent</Pill>, '13/06/2026'],
    ['Q-2043', 'Hoàng Gia', '131,429,662 ₫', <Pill tone="rejected">Rejected</Pill>, '14/06/2026'],
    ['Q-2044', 'Tinh Hoa', '60,206,698 ₫', <Pill tone="draft">Draft</Pill>, '—'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 92, active: true }, { label: 'Draft' }, { label: 'Sent' }, { label: 'Accepted' }, { label: 'Rejected' }, { label: 'Expired' }]}
      cols={[{ label: 'Quote', w: '1fr' }, { label: 'Customer', w: '1.6fr' }, { label: 'Total', w: '1.2fr', align: 'r' }, { label: 'Status', w: '1fr' }, { label: 'Valid until', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Draft → Sent → Accepted → (Rejected / Expired) · accepted quote → PO"
    />
  )
}
function AdminInvoices() {
  const rows = [
    ['INV-3390', 'Công ty Vạn Phát', '37,800,000 ₫', '37,800,000 ₫', <Pill tone="active">Paid</Pill>, '09/06/2026'],
    ['INV-3391', 'Hồng Đức', '139,609,357 ₫', '0 ₫', <Pill tone="pending">Issued</Pill>, '06/06/2026'],
    ['INV-3392', 'Phương Đông', '177,304,898 ₫', '80,000,000 ₫', <Pill tone="pending">Partially paid</Pill>, '16/06/2026'],
    ['INV-3393', 'Hoàng Gia', '38,267,008 ₫', '0 ₫', <Pill tone="rejected">Overdue</Pill>, '28/05/2026'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All', count: 210, active: true }, { label: 'Issued' }, { label: 'Paid' }, { label: 'Overdue', count: 18 }]}
      cols={[{ label: 'Invoice', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Total', w: '1.1fr', align: 'r' }, { label: 'Collected', w: '1.1fr', align: 'r' }, { label: 'Status', w: '1.1fr' }, { label: 'Due', w: '0.9fr', align: 'r' }]}
      rows={rows}
      footer="Status derived from payments + due date · VN VAT e-invoice issued on payment"
    />
  )
}
function AdminPOs() {
  const rows = [
    ['PO-1188', 'Công ty Vạn Phát', '37,800,000 ₫', <Pill tone="active">Accepted</Pill>, '1', '07/05/2026'],
    ['PO-1189', 'Hoàng Gia', '87,505,977 ₫', <Pill tone="pending">Sent</Pill>, '0', '22/04/2026'],
    ['PO-1190', 'Sao Mai', '126,360,120 ₫', <Pill tone="draft">Draft</Pill>, '0', '—'],
  ]
  return (
    <ListPage
      cols={[{ label: 'PO code', w: '1fr' }, { label: 'Customer', w: '1.6fr' }, { label: 'Total', w: '1.2fr', align: 'r' }, { label: 'Status', w: '1fr' }, { label: 'Invoices', w: '0.7fr', align: 'r' }, { label: 'Issued', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Created from accepted quote → invoices raised against it (needs BE build if in launch scope)"
    />
  )
}
function AdminPayments() {
  const rows = [
    ['PAY-1042', 'Công ty Vạn Phát', '37,800,000 ₫', 'Bank transfer', 'INV-3390', '26/05/2026'],
    ['PAY-1043', 'Bình Minh', '52,412,282 ₫', 'Credit card', 'INV-3388', '26/05/2026'],
    ['PAY-1044', 'Trường Sơn', '73,929,353 ₫', 'Bank transfer', 'INV-3385', '26/05/2026'],
    ['PAY-1045', 'Á Châu', '19,934,148 ₫', 'Cash', 'INV-3380', '26/05/2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Reference', w: '1fr' }, { label: 'Customer', w: '1.4fr' }, { label: 'Amount', w: '1.1fr', align: 'r' }, { label: 'Method', w: '1.1fr' }, { label: 'Invoice', w: '0.9fr' }, { label: 'Date', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Applying a payment updates the linked invoice’s collected total + status"
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
      <Footer text="Showing 5 of 34 — self-signups land here, get matched, then flow into the Pipeline as leads" />
      <p className="mt-2 text-[11px] text-faint">Match key: tax code (strongest) → email domain → company name. Public domains (gmail…) need manual verification.</p>
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
  'admin-job-applicants': AdminApplicants,
  'admin-resumes': AdminResumes,
  // Companies
  'admin-company-list': AdminCompanyList,
  'admin-company-pipeline': AdminCompanyPipeline,
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
  'admin-master-data': AdminMasterData,
  'admin-audit-log': AdminAuditLog,
  'admin-environment': AdminEnvironment,
  'admin-departments': AdminDepartments,
  // Job categories & roles now live inside Master data (one page); keep the id mapped.
  'admin-job-categories': AdminMasterData,
}
