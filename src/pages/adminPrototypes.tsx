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

function Table({ cols, rows }: { cols: Col[]; rows: React.ReactNode[][] }) {
  const tmpl = cols.map((c) => c.w).join(' ')
  const alignCls = (a?: 'r' | 'c') => (a === 'r' ? 'text-right justify-end' : a === 'c' ? 'text-center justify-center' : '')
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <div style={{ gridTemplateColumns: tmpl, minWidth: 560 }} className="grid gap-x-3 bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {cols.map((c, i) => <span key={i} className={alignCls(c.align)}>{c.label}</span>)}
      </div>
      {rows.map((r, ri) => (
        <div key={ri} style={{ gridTemplateColumns: tmpl, minWidth: 560 }} className="grid gap-x-3 items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]">
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

function ListPage({ tabs, cols, rows, footer }: { tabs?: { label: string; count?: number; active?: boolean }[]; cols: Col[]; rows: React.ReactNode[][]; footer: string }) {
  return (
    <div>
      {tabs && <TabBar tabs={tabs} />}
      <Table cols={cols} rows={rows} />
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
type JobRow = { title: string; company: string; source: 'Company' | 'Admin'; status: StatusTone; statusLabel: string; applicants: number; deadline: string }
const JOB_ROWS: JobRow[] = [
  { title: 'Senior Frontend Engineer (ReactJS)', company: 'FPT Software', source: 'Company', status: 'pending', statusLabel: 'Pending approval', applicants: 0, deadline: '31/08/2026' },
  { title: 'Kế toán tổng hợp', company: 'VNG Corporation', source: 'Company', status: 'pending', statusLabel: 'Pending approval', applicants: 0, deadline: '20/08/2026' },
  { title: 'Digital Marketing Lead', company: 'Tiki', source: 'Admin', status: 'active', statusLabel: 'Active', applicants: 42, deadline: '15/09/2026' },
  { title: 'Product Manager', company: 'MoMo', source: 'Company', status: 'active', statusLabel: 'Active', applicants: 18, deadline: '05/09/2026' },
  { title: 'Nhân viên kinh doanh', company: 'Thế Giới Di Động', source: 'Company', status: 'active', statusLabel: 'Active', applicants: 7, deadline: '28/08/2026' },
  { title: 'Backend Engineer (Go)', company: 'Shopee', source: 'Company', status: 'expired', statusLabel: 'Expired', applicants: 61, deadline: '01/07/2026' },
  { title: 'Thực tập sinh Nhân sự', company: 'Base.vn', source: 'Company', status: 'rejected', statusLabel: 'Rejected', applicants: 0, deadline: '—' },
]
function AdminJobList() {
  return (
    <ListPage
      tabs={[{ label: 'All', count: 1248 }, { label: 'Pending approval', count: 2, active: true }, { label: 'Active', count: 1180 }, { label: 'Expired', count: 58 }, { label: 'Draft', count: 8 }]}
      cols={[{ label: 'Job title', w: '2fr' }, { label: 'Company', w: '1.2fr' }, { label: 'Source', w: '0.8fr' }, { label: 'Status', w: '1fr' }, { label: 'Applicants', w: '0.8fr', align: 'r' }, { label: 'Actions', w: '1.4fr', align: 'r' }]}
      rows={JOB_ROWS.map((r) => [
        <div className="min-w-0"><p className="truncate font-medium text-ink">{r.title}</p><p className="text-[11px] text-faint">Deadline {r.deadline}</p></div>,
        <span className="truncate">{r.company}</span>,
        <Pill tone={r.source === 'Admin' ? 'neutral' : 'draft'}>{r.source}</Pill>,
        <Pill tone={r.status}>{r.statusLabel}</Pill>,
        <span className="tabular-nums">{r.applicants || '—'}</span>,
        r.status === 'pending' ? <><RowAction tone="brand">Approve</RowAction><RowAction tone="rose">Reject</RowAction></> : <><RowAction>View</RowAction><RowAction>Edit</RowAction></>,
      ])}
      footer="Showing 7 of 1,248 — server-side filter · sort · pagination"
    />
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
function AdminCompanyList() {
  const rows = [
    ['Công ty TNHH Vạn Phát', 'Healthcare', '200–500', <Pill tone="active">Active customer</Pill>, '4', 'Nguyễn Thị Lan'],
    ['FPT Software', 'CNTT', '5000+', <Pill tone="active">Active customer</Pill>, '38', 'Phạm Quang Huy'],
    ['Công ty CP Hoàng Gia', 'Bất động sản', '50–200', <Pill tone="active">Active customer</Pill>, '6', 'Trần Quốc Trung'],
    ['Công ty TNHH Việt Tiến', 'Logistics', '200–500', <Pill tone="pending">Onboarding</Pill>, '0', 'Nguyễn Thị Lan'],
    ['Tiki', 'Bán lẻ', '1000–5000', <Pill tone="active">Active customer</Pill>, '21', 'Phạm Quang Huy'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All customers', count: 486, active: true }, { label: 'Active', count: 452 }, { label: 'Onboarding', count: 22 }, { label: 'Churned', count: 12 }]}
      cols={[{ label: 'Company', w: '1.8fr' }, { label: 'Industry', w: '1fr' }, { label: 'Size', w: '0.8fr' }, { label: 'Status', w: '1.1fr' }, { label: 'Jobs', w: '0.5fr', align: 'r' }, { label: 'Owner', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Showing 5 of 486 — this list is customers activated from the CRM (no manual create)"
    />
  )
}

function AdminCompanyUsers() {
  const rows = [
    ['Vũ Thanh Linh', 'Công ty Vạn Phát', <Pill tone="neutral">HR Manager</Pill>, <Pill tone="active">Active</Pill>, '10m ago'],
    ['Đỗ Thị Mai', 'Công ty Vạn Phát', <Pill tone="draft">HR Specialist</Pill>, <Pill tone="active">Active</Pill>, '2h ago'],
    ['Lý Văn Giang', 'FPT Software', <Pill tone="neutral">HR Manager</Pill>, <Pill tone="active">Active</Pill>, '1d ago'],
    ['Ngô Minh Tú', 'FPT Software', <Pill tone="draft">HR Specialist</Pill>, <Pill tone="pending">Invited</Pill>, '—'],
    ['Bùi Thu Hà', 'Tiki', <Pill tone="draft">HR Specialist</Pill>, <Pill tone="expired">Disabled</Pill>, '3 months ago'],
  ]
  return (
    <ListPage
      tabs={[{ label: 'All users', count: 1140, active: true }, { label: 'Active', count: 1020 }, { label: 'Invited', count: 96 }, { label: 'Disabled', count: 24 }]}
      cols={[{ label: 'User', w: '1.2fr' }, { label: 'Company (account)', w: '1.4fr' }, { label: 'Role', w: '1fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Users belong to an activated company account · HR Manager = super admin, HR Specialist = job posting / resume search only"
    />
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

function PipelineTable({ onActivate }: { onActivate?: () => void }) {
  // priority sort: open deals by most-idle-first (rotting), Won/Lost sink to bottom
  const sorted = [...DEALS].sort((a, b) => (isOpen(b.stage) ? b.idle : -1) - (isOpen(a.stage) ? a.idle : -1))
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-muted">Sort: <b className="font-medium text-ink">Priority — most idle first</b> ▾</span>
        <span className="text-faint">Other sorts: Value · Close date · Last activity</span>
      </div>
      <Table
        cols={[
          { label: 'Company', w: '1.7fr' }, { label: 'Stage', w: '1.1fr' }, { label: 'Value', w: '0.9fr', align: 'r' },
          { label: 'Owner', w: '1.2fr' }, { label: 'Idle', w: '0.9fr' }, { label: 'Next step', w: '1.5fr' }, { label: '', w: '1fr', align: 'r' },
        ]}
        rows={sorted.map((d) => [
          <span className="truncate font-medium text-ink">{d.company}</span>,
          <Pill tone={d.tone}>{d.stage}</Pill>,
          <span className="tabular-nums">{money(d.value)}</span>,
          <span className="truncate">{d.owner}</span>,
          <IdlePill days={d.idle} />,
          <span className="truncate text-muted">{d.next}</span>,
          d.stage === 'Won'
            ? <button onClick={onActivate} className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90">⚡ Activate →</button>
            : <RowAction>Open</RowAction>,
        ])}
      />
      <p className="mt-2 text-[11px] text-faint">Default view for long pipelines. Top row = most neglected open deal (🔥 idle &gt; 14d) — work down the list. Columns are sortable.</p>
    </div>
  )
}

function PipelineBoard({ onActivate }: { onActivate?: () => void }) {
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
              <div key={d.company} className={cn('mb-1.5 rounded-md border bg-surface p-2', st.key === 'Won' && 'border-emerald-300 ring-1 ring-emerald-200')}>
                <p className="truncate text-[11.5px] font-semibold text-ink">{d.company}</p>
                <p className="text-[10.5px] text-muted tabular-nums">{money(d.value)}</p>
                {st.key === 'Won' && (
                  <button onClick={onActivate} className="mt-1.5 w-full rounded-md bg-emerald-600 px-2 py-1 text-[10.5px] font-semibold text-white hover:opacity-90">⚡ Activate →</button>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export function AdminPipeline({ onActivate }: { onActivate?: () => void } = {}) {
  const [view, setView] = useState<'table' | 'board'>('table')
  return (
    <div>
      {/* view toggle — table is the default for long pipelines */}
      <div className="mb-3 inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
        <button onClick={() => setView('table')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'table' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>☰ Table</button>
        <button onClick={() => setView('board')} className={cn('rounded-md px-3 py-1 transition-colors', view === 'board' ? 'bg-brand text-white' : 'text-muted hover:text-ink')}>▦ Board</button>
      </div>

      {view === 'table' ? <PipelineTable onActivate={onActivate} /> : <PipelineBoard onActivate={onActivate} />}

      {/* hand-off banner — the answer to "what do I do after Won?" */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="text-[16px]">🎉</span>
        <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-emerald-800">
          <b>“Cty Trường Sơn” is Won.</b> The pipeline ends here. Next you <b>activate the customer</b> — create the account, choose products, and (for Job Posting) build the company page. This hands the customer off to <b>Account management</b>.
        </p>
        <button onClick={onActivate} className="shrink-0 rounded-lg bg-emerald-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">⚡ Activate customer →</button>
      </div>
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

/* ── System ───────────────────────────────────────────────────────────────── */
function AdminUsers() {
  const rows = [
    ['Trần Quốc Trung', 'admin@saramin.vn', <Pill tone="neutral">HQ Admin</Pill>, <Pill tone="active">Active</Pill>, '5m ago'],
    ['Lê Hữu Phong', 'ops1@saramin.vn', <Pill tone="draft">VN Operations</Pill>, <Pill tone="active">Active</Pill>, '1h ago'],
    ['Nguyễn Thị Lan', 'sales1@saramin.vn', <Pill tone="draft">Sales</Pill>, <Pill tone="active">Active</Pill>, '2h ago'],
    ['Phạm Quang Huy', 'sales2@saramin.vn', <Pill tone="draft">Sales</Pill>, <Pill tone="pending">Invited</Pill>, '—'],
  ]
  return (
    <ListPage
      cols={[{ label: 'User', w: '1.2fr' }, { label: 'Email', w: '1.6fr' }, { label: 'Role', w: '1.1fr' }, { label: 'Status', w: '0.9fr' }, { label: 'Last login', w: '1fr', align: 'r' }]}
      rows={rows}
      footer="Admin user CRUD + role assignment · confirm auth story (SSO vs local)"
    />
  )
}
function AdminRoles() {
  const perms = ['Companies', 'Jobs', 'Resumes', 'Billing', 'CRM', 'Content', 'System']
  const roles = [
    { name: 'Super admin', on: [true, true, true, true, true, true, true] },
    { name: 'Sales', on: [true, false, false, true, true, false, false] },
    { name: 'Operations', on: [true, true, true, false, false, true, false] },
    { name: 'Content', on: [false, false, false, false, false, true, false] },
  ]
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <div className="grid items-center bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted" style={{ gridTemplateColumns: `1.2fr repeat(${perms.length}, 1fr)`, minWidth: 640 }}>
          <span>Role</span>
          {perms.map((p) => <span key={p} className="text-center">{p}</span>)}
        </div>
        {roles.map((r) => (
          <div key={r.name} className="grid items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]" style={{ gridTemplateColumns: `1.2fr repeat(${perms.length}, 1fr)`, minWidth: 640 }}>
            <span className="font-medium text-ink">{r.name}</span>
            {r.on.map((v, i) => <span key={i} className="text-center">{v ? <span className="text-emerald-600">●</span> : <span className="text-line">○</span>}</span>)}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-faint">Permission engine exists (resource:action) — the role matrix / personas need client sign-off</p>
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

/* ── registry ─────────────────────────────────────────────────────────────── */
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
}
