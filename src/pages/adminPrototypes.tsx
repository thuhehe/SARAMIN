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
type StatusTone = 'active' | 'pending' | 'expired' | 'rejected' | 'draft' | 'neutral'

const STATUS_TONE: Record<StatusTone, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  neutral: 'bg-sky-50 text-sky-700 border-sky-200',
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

function StatCards({ cards }: { cards: { label: string; value: string; delta?: string; up?: boolean }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
type JobRow = { title: string; category: string; company: string; source: 'Company' | 'Admin'; status: StatusTone; statusLabel: string; posted: string; deadline: string; views: number; saves: number; applicants: number }
const JOB_ROWS: JobRow[] = [
  { title: 'Senior Frontend Engineer (ReactJS)', category: 'CNTT - Phần mềm', company: 'FPT Software', source: 'Company', status: 'pending', statusLabel: 'Pending approval', posted: '—', deadline: '31/08/2026', views: 0, saves: 0, applicants: 0 },
  { title: 'Kế toán tổng hợp', category: 'Kế toán - Kiểm toán', company: 'VNG Corporation', source: 'Company', status: 'pending', statusLabel: 'Pending approval', posted: '—', deadline: '20/08/2026', views: 0, saves: 0, applicants: 0 },
  { title: 'Digital Marketing Lead', category: 'Marketing - Truyền thông', company: 'Tiki', source: 'Admin', status: 'active', statusLabel: 'Active', posted: '15/07/2026', deadline: '15/09/2026', views: 1240, saves: 86, applicants: 42 },
  { title: 'Product Manager', category: 'Sản phẩm - Dự án', company: 'MoMo', source: 'Company', status: 'active', statusLabel: 'Active', posted: '05/07/2026', deadline: '05/09/2026', views: 890, saves: 54, applicants: 18 },
  { title: 'Nhân viên kinh doanh', category: 'Kinh doanh - Bán hàng', company: 'Thế Giới Di Động', source: 'Company', status: 'active', statusLabel: 'Active', posted: '20/07/2026', deadline: '28/08/2026', views: 320, saves: 12, applicants: 7 },
  { title: 'Backend Engineer (Go)', category: 'CNTT - Phần mềm', company: 'Shopee', source: 'Company', status: 'expired', statusLabel: 'Expired', posted: '01/04/2026', deadline: '01/07/2026', views: 2150, saves: 143, applicants: 61 },
  { title: 'Thực tập sinh Nhân sự', category: 'Nhân sự', company: 'Base.vn', source: 'Company', status: 'rejected', statusLabel: 'Rejected', posted: '—', deadline: '—', views: 0, saves: 0, applicants: 0 },
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
      tabs={[{ label: 'All', count: 1248 }, { label: 'Pending approval', count: 2, active: true }, { label: 'Active', count: 1180 }, { label: 'Expired', count: 58 }, { label: 'Draft', count: 8 }]}
      cols={[
        { label: 'Job title', w: '1.9fr' },
        { label: 'Company', w: '1.2fr' },
        { label: 'Created by', w: '0.8fr' },
        { label: 'Status', w: '1fr' },
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
type CoStatus = 'Lead' | 'Qualified' | 'Proposal' | 'Won' | 'Expired' | 'Lost'
type Company = {
  name: string; legalName: string; tax: string; industry: string; size: string; address: string
  contact: string; owner: string; status: CoStatus
  jobPosting: boolean; resumeSearch: boolean; jobLeft: number; jobTotal: number; cvLeft: number; cvTotal: number
  hasPage: boolean; jobs: number; domain: string; since: string
}
const COMPANIES: Company[] = [
  { name: 'Công ty TNHH Đại Dương', legalName: 'Công ty TNHH Đại Dương', tax: '0315xxxxxx', industry: 'Thủy sản', size: '50–200', address: 'Hải Phòng', contact: 'Mr. Nguyễn Văn Toàn', owner: 'Nguyễn Thị Lan', status: 'Lead', jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'daiduong.vn', since: '—' },
  { name: 'Công ty CP Bình Minh', legalName: 'Công ty Cổ phần Bình Minh', tax: '0316xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận 3, HCMC', contact: 'Ms. Lê Thu Hằng · HR', owner: 'Phạm Quang Huy', status: 'Qualified', jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'binhminh.edu.vn', since: '—' },
  { name: 'Công ty TNHH Sao Mai', legalName: 'Công ty TNHH Sao Mai', tax: '0317xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Mr. Trần Đức Anh · HR Mgr', owner: 'Trần Quốc Trung', status: 'Proposal', jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'saomai.vn', since: '—' },
  { name: 'Công ty TNHH Vạn Phát', legalName: 'Công ty TNHH Vạn Phát', tax: '0312xxxxxx', industry: 'Healthcare', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Vũ Thanh Linh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Won', jobPosting: true, resumeSearch: true, jobLeft: 7, jobTotal: 10, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 4, domain: 'vanphat.vn', since: '26/05/2026' },
  { name: 'FPT Software', legalName: 'Công ty TNHH Phần mềm FPT', tax: '0101xxxxxx', industry: 'CNTT', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Lý Văn Giang · HR Lead', owner: 'Phạm Quang Huy', status: 'Won', jobPosting: true, resumeSearch: false, jobLeft: 12, jobTotal: 50, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 38, domain: 'fpt.com.vn', since: '12/01/2024' },
  { name: 'Công ty CP Hoàng Gia', legalName: 'Công ty Cổ phần Hoàng Gia', tax: '0313xxxxxx', industry: 'Bất động sản', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Đỗ Thu Hà · Recruiter', owner: 'Trần Quốc Trung', status: 'Won', jobPosting: false, resumeSearch: true, jobLeft: 0, jobTotal: 0, cvLeft: 40, cvTotal: 50, hasPage: false, jobs: 0, domain: 'hoanggia.vn', since: '03/03/2026' },
  { name: 'Công ty TNHH Việt Tiến', legalName: 'Công ty TNHH Việt Tiến Logistics', tax: '0314xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận Bình Tân, HCMC', contact: 'Mr. Ngô Minh Tú', owner: 'Nguyễn Thị Lan', status: 'Expired', jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'viettien.vn', since: '15/08/2024' },
  { name: 'Tiki', legalName: 'Công ty TNHH TIKI', tax: '0309xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 4, HCMC', contact: 'Ms. Bùi Thu Hằng · TA Manager', owner: 'Phạm Quang Huy', status: 'Won', jobPosting: true, resumeSearch: true, jobLeft: 21, jobTotal: 30, cvLeft: 210, cvTotal: 300, hasPage: true, jobs: 21, domain: 'tiki.vn', since: '10/11/2023' },
]

const CO_STATUS: Record<CoStatus, { tone: StatusTone; label: string }> = {
  Lead: { tone: 'draft', label: 'Lead' },
  Qualified: { tone: 'neutral', label: 'Qualified' },
  Proposal: { tone: 'neutral', label: 'Proposal' },
  Won: { tone: 'active', label: 'Won · customer' },
  Expired: { tone: 'pending', label: 'Expired · renew' },
  Lost: { tone: 'rejected', label: 'Lost' },
}

function ProductChips({ c }: { c: Company }) {
  if (!c.jobPosting && !c.resumeSearch) return <span className="text-[11px] text-faint">— none yet</span>
  return (
    <span className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
      {c.jobPosting && <span className="shrink-0 rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[10.5px] text-brand">📢 Job Posting</span>}
      {c.resumeSearch && <span className="shrink-0 rounded border border-brand/30 bg-brand-soft px-1.5 py-0.5 text-[10.5px] text-brand">🔍 Resume Search</span>}
    </span>
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

function AdminCompanyList() {
  const [open, setOpen] = useState<Company | null>(null)
  if (open) return <CompanyDetail c={open} onBack={() => setOpen(null)} />
  return (
    <div>
      <p className="mb-3 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
        <b>One list of every company</b> — from cold <b>Lead</b> → <b>Won</b> customer → <b>Expired</b> (loops back for renewal). The <b>Pipeline</b> is just this same list shown as a board. Products and the public company page are sections on each record, only for customers who bought them.
      </p>
      <TabBar tabs={[{ label: 'All', count: 512, active: true }, { label: 'Lead', count: 210 }, { label: 'Qualified', count: 64 }, { label: 'Proposal', count: 22 }, { label: 'Won', count: 458 }, { label: 'Expired', count: 16 }, { label: 'Lost', count: 42 }]} />
      <Table
        cols={[{ label: 'Company', w: '1.5fr' }, { label: 'Industry', w: '0.9fr' }, { label: 'Products in use', w: '2.2fr' }, { label: 'Status', w: '1.2fr' }, { label: 'Jobs', w: '0.5fr', align: 'r' }, { label: 'Owner', w: '0.9fr', align: 'r' }]}
        rows={COMPANIES.map((c) => [
          <button onClick={() => setOpen(c)} className="truncate text-left font-medium text-brand hover:underline">{c.name}</button>,
          <span className="truncate">{c.industry}</span>,
          <ProductChips c={c} />,
          <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>,
          <span className="tabular-nums">{c.jobs || '—'}</span>,
          <span className="truncate">{c.owner}</span>,
        ])}
      />
      <Footer text="Showing 8 of 512 — one record per company, tracked lead → renewal. Click to open. The Pipeline board is the same list grouped by status." />
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
    { title: 'Điều dưỡng viên (Khoa Nội)', status: 'active', statusLabel: 'Active', applicants: 14, posted: '02/07/2026', deadline: '31/08/2026' },
    { title: 'Bác sĩ Đa khoa', status: 'active', statusLabel: 'Active', applicants: 6, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Kế toán viện phí', status: 'pending', statusLabel: 'Pending approval', applicants: 0, posted: '20/07/2026', deadline: '15/09/2026' },
    { title: 'Lễ tân bệnh viện', status: 'expired', statusLabel: 'Expired', applicants: 31, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'FPT Software': [
    { title: 'Senior Frontend Engineer (ReactJS)', status: 'pending', statusLabel: 'Pending approval', applicants: 0, posted: '24/07/2026', deadline: '31/08/2026' },
    { title: 'Java Developer (Spring Boot)', status: 'active', statusLabel: 'Active', applicants: 52, posted: '10/07/2026', deadline: '10/09/2026' },
    { title: 'Business Analyst', status: 'active', statusLabel: 'Active', applicants: 28, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Comtor tiếng Nhật (BrSE)', status: 'active', statusLabel: 'Active', applicants: 11, posted: '01/07/2026', deadline: '31/08/2026' },
    { title: 'DevOps Engineer', status: 'active', statusLabel: 'Active', applicants: 19, posted: '20/06/2026', deadline: '20/08/2026' },
    { title: 'QA Automation Engineer', status: 'expired', statusLabel: 'Expired', applicants: 40, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
  'Tiki': [
    { title: 'Digital Marketing Lead', status: 'active', statusLabel: 'Active', applicants: 42, posted: '15/07/2026', deadline: '15/09/2026' },
    { title: 'Product Manager', status: 'active', statusLabel: 'Active', applicants: 18, posted: '05/07/2026', deadline: '05/09/2026' },
    { title: 'Backend Engineer (Go)', status: 'active', statusLabel: 'Active', applicants: 33, posted: '02/07/2026', deadline: '02/09/2026' },
    { title: 'Data Analyst', status: 'active', statusLabel: 'Active', applicants: 25, posted: '28/06/2026', deadline: '28/08/2026' },
    { title: 'Nhân viên Kho vận', status: 'pending', statusLabel: 'Pending approval', applicants: 0, posted: '22/07/2026', deadline: '20/09/2026' },
    { title: 'Category Manager', status: 'expired', statusLabel: 'Expired', applicants: 47, posted: '01/04/2026', deadline: '30/06/2026' },
  ],
}
const companyJobs = (c: Company) => COMPANY_JOBS[c.name] ?? []

type CoTeamUser = { name: string; email: string; role: 'HR Manager' | 'HR Specialist'; status: 'Active' | 'Invited'; last: string }
function companyTeam(c: Company): CoTeamUser[] {
  const noProducts = !c.jobPosting && !c.resumeSearch
  const managerName = c.contact.replace(/^(Mr\.|Ms\.)\s*/, '').split(' · ')[0]
  const localPart = (n: string) =>
    n.split(' ').pop()!.toLowerCase()
      .replace(/đ/g, 'd').replace(/ơ/g, 'o').replace(/ư/g, 'u')
      .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  const base: Omit<CoTeamUser, 'email'>[] = [{ name: managerName, role: 'HR Manager', status: 'Active', last: '10m ago' }]
  if (c.status === 'Won' && !noProducts) {
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

function MiniStat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[15px] font-bold tabular-nums', tone === 'warn' ? 'text-amber-600' : 'text-ink')}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-[10.5px] text-faint">{sub}</p>}
    </div>
  )
}

type CoTab = 'Overview' | 'Users' | 'Products & billing' | 'Company page' | 'Jobs' | 'Activity'
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
          {noProducts && c.status !== 'Expired' ? (
            <p className="text-[12px] text-muted">No purchases on record yet.</p>
          ) : (
            <div className="space-y-1.5">
              {c.jobPosting && <PurchaseRow name="Job Posting — Pro" detail="10 slots · 3 months" amount="15,000,000 ₫" date={c.since} />}
              {c.resumeSearch && <PurchaseRow name="Resume Search — 6 months" detail="100 CV unlocks" amount="20,000,000 ₫" date={c.since} />}
              {noProducts && c.status === 'Expired' && <PurchaseRow name="Job Posting — Pro" detail="lapsed 31/12/2025" amount="15,000,000 ₫" date="12/2024" expired />}
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
      {noProducts && c.status === 'Expired' && <p className="mt-2 text-[11px] text-amber-700">Subscription expired — no active quota. Renew to reactivate.</p>}
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
  const noProducts = !c.jobPosting && !c.resumeSearch
  const team = companyTeam(c)
  const jobs = companyJobs(c)
  const activeJobs = jobs.filter((j) => j.status === 'active').length
  const full = team.length >= MAX_SEATS
  const initials = c.name.replace(/^Công ty (TNHH|CP|Cổ phần)?\s*/i, '').slice(0, 2).toUpperCase()

  const tabs: { key: CoTab; label: string; count?: number }[] = [
    { key: 'Overview', label: 'Overview' },
    { key: 'Users', label: 'Users', count: team.length },
    { key: 'Products & billing', label: 'Products & billing' },
    { key: 'Company page', label: 'Company page' },
    { key: 'Jobs', label: 'Jobs', count: c.jobPosting ? jobs.length : undefined },
    { key: 'Activity', label: 'Activity' },
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
            <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{c.name} <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill></h2>
            <p className="text-[11.5px] text-muted">{c.legalName} · MST {c.tax} · <span className="font-mono">{c.domain}</span></p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Edit</button>
          {c.hasPage && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">View on jobseeker ↗</button>}
        </div>
      </div>

      {/* at-a-glance stats */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Customer since" value={c.since.slice(-4)} sub={c.since} />
        <MiniStat label="Active jobs" value={c.jobPosting ? activeJobs : '—'} sub={c.jobPosting ? `${jobs.length} total` : 'No Job Posting'} />
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
            <DetailCard title="Company page (jobseeker)" action={c.jobPosting ? <Pill tone={c.hasPage ? 'active' : 'pending'}>{c.hasPage ? 'Published' : 'Draft'}</Pill> : <Pill tone="expired">Not applicable</Pill>}>
              <p className="text-[12px] text-muted">
                {c.jobPosting ? (c.hasPage ? 'Public profile is live on the jobseeker site.' : 'Draft — must be published before the company can post jobs.') : 'Resume-Search-only — no public page.'}
              </p>
              {c.jobPosting && <button onClick={() => setTab('Company page')} className="mt-2 text-[11.5px] font-medium text-brand hover:underline">Open page editor →</button>}
            </DetailCard>
          </div>
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      {tab === 'Users' && (
        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <p className="max-w-[62ch] flex-1 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
              <b>Exactly 1 HR Manager + up to {MAX_SEATS - 1} HR Specialists</b> ({MAX_SEATS} seats max). All users <b>share the account’s pooled quota</b>. Making someone Manager <b>transfers</b> the role — no email/login changes.
            </p>
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
            {noProducts && c.status === 'Expired' ? (
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
              <p className="mt-2 text-[11px] text-faint">Jobs this account posted (HQ oversight). Pending-approval rows are handled from Recruitment → Jobs.</p>
            </>
          )}
        </div>
      )}

      {/* ── Activity ─────────────────────────────────────────────────────── */}
      {tab === 'Activity' && (
        <DetailCard title="Activity & audit trail" action={<span className="text-[11px] text-faint">newest first</span>}>
          <div className="space-y-3">
            {companyActivity(c).map((e, i) => <TL key={i} icon={e.icon} title={e.title} time={e.time} sub={e.sub} tone={e.tone} />)}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-faint">PII-view actions (resume unlocks) are always written to the immutable audit log.</p>
        </DetailCard>
      )}

      {inviting && <InviteUserModal onClose={() => setInviting(false)} />}
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
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[62ch] flex-1 rounded-lg bg-brand-soft px-3 py-2.5 text-[11.5px] leading-relaxed text-brand">
          One company = one account. <b>Exactly 1 HR Manager + up to 3 HR Specialists</b> (4 max). All users <b>share the account’s pooled quota</b>. The HR Manager invites and manages the rest.
        </p>
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

      {converting && <ConvertLeadModal companyName={deal.company} value={deal.value} onClose={() => setConverting(false)} />}
    </div>
  )
}

/* ── Create-lead modal (company-first, adapted from Salesforce) ────────────── */
function LField({ label, req, value, select }: { label: string; req?: boolean; value: string; select?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</label>
      <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{value}{select && <span className="ml-auto">▾</span>}</div>
    </div>
  )
}
function Section({ title }: { title: string }) {
  return <p className="mt-2 rounded-md bg-canvas/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">{title}</p>
}
function CreateLeadModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="text-[15px] font-bold">New lead</p>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <p className="text-right text-[11px] text-faint"><span className="text-rose-500">*</span> = Required</p>
          <Section title="Company (the lead)" />
          <LField label="Legal name" req value="Công ty TNHH …" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Tax code (MST)" value="03xxxxxxxx" />
            <LField label="Industry" value="— Select —" select />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Company size" value="— Select —" select />
            <LField label="Website" value="company.vn" />
          </div>
          <Section title="Primary contact" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Contact name" req value="Họ và tên" />
            <LField label="Title" value="HR Manager" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Phone" value="09xx xxx xxx" />
            <LField label="Email" value="hr@company.vn" />
          </div>
          <Section title="Sales" />
          <div className="grid grid-cols-2 gap-3">
            <LField label="Lead source" value="— Select —" select />
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
          <button className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-ink hover:border-ink/40">Save &amp; New</button>
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
function ConvertLeadModal({ companyName, value, onClose }: { companyName: string; value: number; onClose: () => void }) {
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
            <LField label="Record owner" req value={deal.owner} select />
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
      {convertDeal && <ConvertLeadModal companyName={convertDeal.company} value={convertDeal.value} onClose={() => setConvertDeal(null)} />}
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
function AdminMasterData() {
  const rows = [
    ['Industries', '38', 'vi · en · ko', '12/06/2026'],
    ['Locations (provinces)', '63', 'vi · en', '01/05/2026'],
    ['Job categories', '124', 'vi · en · ko', '20/07/2026'],
    ['Career levels', '7', 'vi · en · ko', '01/05/2026'],
    ['Education levels', '9', 'vi · en', '01/05/2026'],
  ]
  return (
    <ListPage
      cols={[{ label: 'Domain', w: '1.6fr' }, { label: 'Entries', w: '0.8fr', align: 'r' }, { label: 'Languages', w: '1.2fr' }, { label: 'Updated', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Powers Store search filters + job form dropdowns · vi mandatory, en/ko optional"
    />
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
function TaxoPane({ title, items, activeIndex }: { title: string; items: string[]; activeIndex?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5">
        <span className="text-[12.5px] font-bold text-ink">{title}</span>
        <button className="text-[12px] font-medium text-brand hover:underline">Add new +</button>
      </div>
      {items.map((it, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-between border-b border-line-soft px-4 py-2.5 text-[12.5px] last:border-0',
            i === activeIndex && 'bg-brand-soft',
          )}
        >
          <span className={cn('truncate', i === activeIndex ? 'font-medium text-brand' : 'text-ink/80')}>{it}</span>
          <button className="shrink-0 text-[11.5px] text-brand hover:underline">Edit</button>
        </div>
      ))}
    </div>
  )
}

function AdminJobCategories() {
  const categories = ['IT', 'Business, Finance', 'Management', 'Manufacturing & Engineering', 'Service', 'Design, Creativity']
  const rolesInIT = [
    'Software Developer', 'Machine Learning / AI Engineer', 'Augmented Reality (AR) Developer',
    'Internet of Things (IoT) Developer', 'Blockchain Developer', 'DevOps Engineer',
    'Data Engineer / Scientist / Analyst', 'Network Engineer / Cyber Security Expert', 'QA / Tester',
    'Product Manager / Business Analyst', 'IT Support Specialist', 'IT - Hardware / Network',
  ]
  return (
    <div>
      <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11.5px] text-sky-800">
        Master data — powers the job form <b>Category → Role</b> dropdowns and the job-search filters. Pick a category to manage its roles.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TaxoPane title="Job Category" items={categories} activeIndex={0} />
        <TaxoPane title="Role — in “IT”" items={rolesInIT} />
      </div>
      <p className="mt-3 text-[11px] text-faint">
        Two-level taxonomy: each Job Category owns a list of Roles (job titles). Distinct from System → Roles &amp; permissions (admin RBAC). vi mandatory · en / ko optional.
      </p>
    </div>
  )
}

/* ── Create Job — draft field map ─────────────────────────────────────────────
 * A field inventory for the job-create form, NOT final visual design.
 * Structure adapted from the TopDev job dashboard (9-tab layout) and cross-checked
 * against a live Saramin post. Placeholder values are illustrative. Fields tagged
 * `confirm` need client sign-off (legal / VN-market / commercial specifics).
 * ------------------------------------------------------------------------------ */

/** amber "needs client confirmation" marker */
function Confirm() {
  return <span className="ml-1 rounded border border-amber-200 bg-amber-50 px-1 py-px text-[9px] font-medium uppercase tracking-wide text-amber-700">confirm</span>
}


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

/** radio group rendered as a row */
function RadioRow({ label, req, options, value, extra }: { label: React.ReactNode; req?: boolean; options: string[]; value: string; extra?: React.ReactNode }) {
  return (
    <div>
      <FLabel req={req}>{label}{extra}</FLabel>
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
        {options.map((o) => (
          <span key={o} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/80">
            <span className={cn('grid h-4 w-4 place-items-center rounded-full border-2', o === value ? 'border-brand' : 'border-line')}>{o === value && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
            {o}
          </span>
        ))}
      </div>
    </div>
  )
}

function FormSection({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mt-1 border-b border-line-soft pb-1.5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{title}</p>
      {note && <p className="mt-0.5 text-[10.5px] text-faint">{note}</p>}
    </div>
  )
}

/* ── Job detail (read-only) — opened by clicking a job title ─────────────────── */
function AdminJobDetail({ job, onBack }: { job: JobRow; onBack: () => void }) {
  const pending = job.status === 'pending'
  return (
    <div className="max-w-[900px]">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Jobs</button>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Recruitment · Job</p>
          <h2 className="mt-0.5 flex flex-wrap items-center gap-2 text-[20px] font-bold tracking-tight">{job.title} <Pill tone={job.status}>{job.statusLabel}</Pill></h2>
          <p className="text-[11.5px] text-muted">{job.category} · {job.company} · Created by {job.source}</p>
        </div>
        <div className="flex gap-2">
          {pending ? (
            <>
              <button className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Approve</button>
              <button className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-500 hover:text-white">Reject</button>
            </>
          ) : (
            <button className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Edit</button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <MiniStat label="Applicants" value={job.applicants || '—'} sub="total received" />
        <MiniStat label="Views" value={job.views.toLocaleString('en-US')} sub="job detail views" />
        <MiniStat label="Saves" value={job.saves.toLocaleString('en-US')} sub="saved by seekers" />
        <MiniStat label="Created by" value={job.source} sub={job.source === 'Admin' ? 'HQ on behalf' : 'company HR'} />
        <MiniStat label="Posted" value={job.posted} sub="went live" />
        <MiniStat label="Expires" value={job.deadline} sub="applications close" />
        <MiniStat label="Status" value={job.statusLabel} tone={pending ? 'warn' : undefined} />
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

      {pending && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">⚠️ Pending approval — Approve to publish it live, or Reject with a reason back to the company.</p>}
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

const TITLE_I18N: Record<'VI' | 'EN' | 'KO', string> = {
  VI: 'Trưởng nhóm kỹ thuật (.NET, tiếng Nhật N4+)',
  EN: 'Technical Leader / Technical Architect (.NET)',
  KO: '기술 팀장 (.NET, 일본어 N4+)',
}

function AdminJobCreate({ onBack }: { onBack: () => void }) {
  const [exposed, setExposed] = useState(true)
  const [schedule, setSchedule] = useState(false)
  const [titleLang, setTitleLang] = useState<'VI' | 'EN' | 'KO'>('VI')
  const G2 = 'grid gap-3 sm:grid-cols-2'
  const G3 = 'grid gap-3 sm:grid-cols-3'

  return (
    <div className="max-w-[860px]">
      <button onClick={onBack} className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">← Back to Jobs</button>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Recruitment · Jobs</p>
          <h2 className="mt-0.5 text-[20px] font-bold tracking-tight">Create job <span className="font-medium text-muted">— draft field map</span></h2>
        </div>
        <Pill tone="draft">Draft · fields for review</Pill>
      </div>

      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11.5px] leading-relaxed text-sky-800">
        Field inventory for the job-create form — <b>one scrolling page</b> (no tabs). Cross-checked against a live <b>Saramin</b> post and the <b>TopDev</b> dashboard.
        Fields marked <Confirm /> need client sign-off. This is a structure draft, not final visual design.
      </div>

      <div className="space-y-8">
        {/* ── Company ───────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Company" />
          <FField label="Company" req value="NEC Vietnam · CO-1042" select hint="Searchable by company name or ID; links the job to the customer record & pooled quota." />
          <CompanyInfoCard />
        </section>

        {/* ── Package & boosts (below company) ──────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Package & boosts" note="Which paid package / add-ons this posting consumes. Ties into Billing & CRM." />
          <div className="rounded-lg border border-line p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11.5px] font-medium text-ink/80">Package</p>
                <p className="text-[13px] font-semibold text-ink">Free <span className="text-[11px] font-normal text-muted">· expires in 14 days</span></p>
              </div>
              <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">from linked order</span>
            </div>
          </div>
          <div>
            <FLabel>Boosts<Confirm /></FLabel>
            <div className="flex flex-wrap gap-2">
              {['Hot job', 'Super hot', 'Pin to top', 'Homepage feature'].map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> {b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Visibility (below company & packages) ─────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Visibility" note="Whether an Open job appears on the jobseeker site. Independent of the status lifecycle." />
          <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-ink">Exposure</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                {exposed
                  ? 'On — visible to jobseekers and open for applications (while the job is Open).'
                  : 'Off — taken down from the jobseeker site; nobody can apply. Reversible any time before the deadline — the job does not Close.'}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={exposed}
              onClick={() => setExposed((v) => !v)}
              className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', exposed ? 'bg-emerald-500' : 'bg-line')}
            >
              <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', exposed ? 'left-[22px]' : 'left-0.5')} />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-faint">
            Status is deadline-driven: <b className="text-ink/70">Draft → Pending → Open → Closed</b> (auto at the deadline). There is no manual “Close” — turn <b className="text-ink/70">Exposure</b> off to take a job down; it auto-Closes when the deadline passes, and can be re-exposed before then.
          </p>
        </section>

        {/* ── Job title (single field, language tab) ────────────────────────── */}
        <section className="space-y-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-[11.5px] font-medium text-ink/80">Job title<span className="text-rose-500"> *</span></label>
              <div className="ml-auto flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
                {(['VI', 'EN', 'KO'] as const).map((l) => (
                  <button key={l} onClick={() => setTitleLang(l)} className={cn('px-2 py-0.5', titleLang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{TITLE_I18N[titleLang]}</div>
            <p className="mt-1 text-[10.5px] text-faint">Vietnamese is the default &amp; fallback language; English / Korean optional.</p>
          </div>
        </section>

        {/* ── Classification ────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Classification" note="Powered by System → Job categories & roles (master data)." />
          <FField label="Job category" req value="IT" select />
          <ChipField label="Job roles" req chips={['Software Developer']} placeholder="Add role…" />
          <ChipField label="Job levels" req chips={['Intern', 'Fresher', 'Junior', 'Middle', 'Trưởng nhóm', 'Trưởng phòng']} placeholder="Add level…" />
          <ChipField label="Skills" chips={['ASP.NET Core', 'SQL Server', '.NET', 'React']} placeholder="Add skill…" />
          <div className={G2}>
            <FField label="Experiences from" value="7 years" select hint="Only the minimum year of experience is displayed publicly." />
            <FField label="Experiences to" value="—" select />
          </div>
          <ChipField label="Work location(s)" chips={['Hồ Chí Minh']} placeholder="Add location…" />
        </section>

        {/* ── Compensation & timeline ───────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Compensation & timeline" />
          <RadioRow label="Salary display" value="Negotiable" options={['Negotiable', 'Fixed range', 'Up to', 'Competitive']} />
          <div className={G3}>
            <FField label="Salary from" value="—" />
            <FField label="Salary to" value="—" />
            <FField label="Currency / period" value="VND / month" select extra={<Confirm />} />
          </div>
          <div className={G3}>
            <FField label="Number of vacancies" value="1" />
            <FField label="Application deadline" req value="dd/mm/yyyy" select />
            <FField label="Expected start" value="—" />
          </div>
          <RadioRow label="Working arrangement" value="Hybrid" options={['Onsite', 'Hybrid', 'Remote']} />
        </section>

        {/* ── Descriptions ──────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Descriptions" note="Rich-text editor in the real form. VI mandatory · EN/KO optional per field." />
          <TArea label="Job description / Responsibilities" req value="Lead the development team; backend architecture (70%) + frontend (30%); code review & mentoring…" rows={4} />
          <TArea label="Requirements" req value="7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…" rows={4} />
          <TArea label="Benefits / welfare" value="Full insurance; 13th-month salary; language allowance up to $500/mo; 19+ paid leave; Udemy; hybrid…" rows={3} />
        </section>

        {/* ── Candidate requirements ────────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Candidate requirements" />
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
            ⚠️ Demographic fields (gender / age / marital status / nationality) are legally sensitive for VN job ads — confirm with the client whether to collect / display them.
          </div>
          <ChipField label="Language requirements" chips={['Japanese N4+', 'English']} placeholder="Add language…" />
          <div className={G2}>
            <FField label="Gender preference" value="Any" select extra={<Confirm />} />
            <FField label="Age preference" value="—" extra={<Confirm />} />
          </div>
          <div className={G2}>
            <FField label="Marital status" value="Any" select extra={<Confirm />} />
            <FField label="Nationality" value="—" select extra={<Confirm />} />
          </div>
        </section>

        {/* ── Media ─────────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Media" note="Optional — used on the public job detail & company page." />
          <div className={G2}>
            <FField label="Cover / banner image" value="Upload… (1200×400)" select />
            <FField label="Logo override" value="Upload…" select />
          </div>
          <FField label="Gallery images" value="Upload multiple…" select hint="Office / team photos shown in a carousel." />
        </section>

        {/* ── Internal notes ────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <FormSection title="Internal notes" note="Never shown publicly — visible to HQ Admin & the owning company’s HR only." />
          <TArea label="Notes" value="Approval context, special instructions, follow-ups…" rows={4} />
        </section>
      </div>

      {/* footer actions */}
      <div className="mt-6 border-t border-line pt-4">
        <div className="mb-3">
          <FLabel>Publish timing</FLabel>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSchedule(false)}
              className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', !schedule ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted')}
            >
              Post now
            </button>
            <button
              onClick={() => setSchedule(true)}
              className={cn('rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', schedule ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted')}
            >
              Schedule
            </button>
            {schedule && (
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 text-[12px] text-faint">📅 dd/mm/yyyy · hh:mm <span className="ml-1">▾</span></span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Save as draft</button>
          <button onClick={onBack} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">{schedule ? 'Schedule post' : 'Post job'}</button>
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
  'admin-job-categories': AdminJobCategories,
}
