/*
 * Company (employer / recruiter) site mockups — the "Nhà tuyển dụng" portal.
 *
 * Presented like the HQ Admin wireframe: a console shell with a top bar and a
 * left-sidebar navigation, and a content area that swaps per nav item. This is
 * what a company's HR Manager / HR Specialist sees after logging in — post
 * jobs, manage applicants, search resumes, edit the public company page, and
 * manage their team + quota. Structure & layout only — not final visual design.
 *
 * Logged-in employer throughout: "Vạn Phát Healthcare" (Job Posting + Resume
 * Search customer), matching the CRM activation flow in Mockups.tsx.
 */
import { useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Settings,
  Bell,
  ChevronDown,
} from 'lucide-react'
import { Btn, Chip, Line } from '@/components/wire'
import { cn } from '@/lib/utils'

/* ── shared bits ─────────────────────────────────────────────────────────── */
function PageBar({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 className="text-[17px] font-semibold">{title}</h3>
        {sub && <p className="mt-0.5 text-[11.5px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('mt-0.5 text-[19px] font-bold tabular-nums', tone === 'warn' ? 'text-amber-600' : 'text-ink')}>{value}</p>
      {sub && <p className="text-[10.5px] text-faint">{sub}</p>}
    </div>
  )
}

function Bar({ pct, tone }: { pct: number; tone?: 'warn' }) {
  return (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
      <div className={cn('h-full rounded-full', tone === 'warn' ? 'bg-amber-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Field({ label, value, req, area }: { label: string; value: string; req?: boolean; area?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[11.5px] font-medium text-ink/80">{label}{req && <span className="text-rose-500"> *</span>}</p>
      <div className={cn('rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-faint', area && 'h-16')}>{value}</div>
    </div>
  )
}

const STAGE_TONE: Record<string, 'muted' | 'blue' | 'amber' | 'green'> = {
  New: 'muted', Screening: 'blue', Interview: 'amber', Offer: 'green', Hired: 'green', Rejected: 'muted',
}

/* ── screen bodies (no chrome — the shell provides top bar + sidebar) ─────── */
function DashboardScreen() {
  const recent = [
    ['Nguyễn Thị Hoa', 'Điều dưỡng viên (Khoa Nội)', 'New', '10m'],
    ['Trần Văn Bình', 'Bác sĩ Đa khoa', 'Screening', '2h'],
    ['Lê Thị Cúc', 'Điều dưỡng viên (Khoa Nội)', 'Interview', '1d'],
    ['Phạm Minh Dũng', 'Kế toán viện phí', 'New', '1d'],
  ]
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-violet-500 text-[13px] font-bold text-white">VP</span>
        <div>
          <p className="text-[15px] font-bold">Vạn Phát Healthcare</p>
          <p className="text-[11px] text-muted">Healthcare · HCMC · 200–500 staff</p>
        </div>
        <div className="ml-auto flex gap-1.5"><Chip tone="blue">📢 Job Posting</Chip><Chip tone="blue">🔍 Resume Search</Chip></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active jobs" value="4" sub="1 pending approval" />
        <Stat label="New applicants" value="12" sub="this week" />
        <Stat label="Interviews" value="3" sub="scheduled" />
        <Stat label="CV unlocks left" value="62" sub="of 100" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 flex items-center justify-between"><p className="text-[14px] font-bold">Recent applicants</p><span className="text-[11.5px] text-brand">View all →</span></div>
          <div className="space-y-1.5">
            {recent.map(([name, job, stage, t]) => (
              <div key={name} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-canvas text-[11px]">👤</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink">{name}</p>
                  <p className="truncate text-[11px] text-muted">{job}</p>
                </div>
                <Chip tone={STAGE_TONE[stage]}>{stage}</Chip>
                <span className="w-8 text-right text-[10.5px] text-faint">{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12.5px] font-bold">Your quota</p>
            <div className="mb-3">
              <div className="flex justify-between text-[11.5px]"><span>📢 Job posting slots</span><b className="tabular-nums">7/10</b></div>
              <Bar pct={70} />
            </div>
            <div>
              <div className="flex justify-between text-[11.5px]"><span>🔍 Resume CV unlocks</span><b className="tabular-nums">62/100</b></div>
              <Bar pct={62} />
            </div>
            <p className="mt-2 text-[10.5px] text-faint">Shared across your team · valid until 31/12/2026.</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12.5px] font-bold">Quick actions</p>
            <div className="flex flex-col gap-2">
              <Btn primary>+ Post a job</Btn>
              <Btn>🔍 Search resumes</Btn>
              <Btn>✎ Edit company page</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PostJobScreen() {
  return (
    <div>
      <PageBar
        title="Post a job"
        sub="Uses 1 of your 10 posting slots · goes to Saramin for approval before it's public."
        action={<div className="flex gap-2"><Btn>Save draft</Btn><Btn primary>Submit for approval</Btn></div>}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Job title" req value="Điều dưỡng viên (Khoa Nội)" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" req value="Healthcare ▾" />
            <Field label="Role" req value="Registered Nurse ▾" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" req value="Quận 1, HCMC ▾" />
            <Field label="Job type" value="Full-time ▾" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary range" value="12 – 18 triệu" />
            <Field label="Experience" value="1–3 years ▾" />
          </div>
          <Field label="Job description" req area value="Chăm sóc bệnh nhân nội trú, theo dõi dấu hiệu sinh tồn…" />
          <Field label="Requirements" req area value="Bằng cao đẳng/đại học điều dưỡng, chứng chỉ hành nghề…" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Benefits / welfare" value="Bảo hiểm · thưởng tháng 13" />
            <Field label="Application deadline" value="31/08/2026" />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-faint">Jobseeker view →</p>
            <div className="rounded-lg border border-line p-3">
              <div className="flex gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-canvas text-[11px] font-bold text-brand">VP</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">Điều dưỡng viên (Khoa Nội)</p>
                  <p className="text-[12px] text-muted">Vạn Phát Healthcare</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5"><Chip tone="green">12 – 18 tr</Chip><Chip>Hồ Chí Minh</Chip><Chip>Full-time</Chip></div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] text-amber-800">
            ⏳ After you submit, Saramin reviews the post. It becomes visible to jobseekers once <b>approved</b>.
          </div>
          <div className="rounded-md bg-brand-soft px-3 py-2.5 text-[11.5px] text-brand">
            📢 Publishing consumes <b>1 posting slot</b>. You have <b>3 slots</b> left after this one.
          </div>
        </div>
      </div>
    </div>
  )
}

function MyJobsScreen() {
  const rows: [string, string, 'Active' | 'Pending' | 'Expired', string, string][] = [
    ['Điều dưỡng viên (Khoa Nội)', '02/07/2026', 'Active', '14', '31/08/2026'],
    ['Bác sĩ Đa khoa', '28/06/2026', 'Active', '6', '28/08/2026'],
    ['Kế toán viện phí', '20/07/2026', 'Pending', '0', '15/09/2026'],
    ['Lễ tân bệnh viện', '01/04/2026', 'Expired', '31', '30/06/2026'],
  ]
  const tone = (s: string) => (s === 'Active' ? 'green' : s === 'Pending' ? 'amber' : 'muted') as 'green' | 'amber' | 'muted'
  const label = (s: string) => (s === 'Pending' ? 'Pending approval' : s)
  return (
    <div>
      <PageBar title="My jobs" sub="Jobs your company has posted." action={<Btn primary>+ Post a job</Btn>} />
      <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-line-soft pb-3">
        {['All 4', 'Active 2', 'Pending approval 1', 'Expired 1', 'Draft 0'].map((t, i) => (
          <span key={t} className={cn('rounded-lg px-2.5 py-1 text-[12px]', i === 0 ? 'bg-brand-soft font-medium text-brand' : 'text-muted')}>{t}</span>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1.4fr] bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>Job title</span><span>Status</span><span className="text-right">Applicants</span><span className="text-right">Deadline</span><span className="text-right">Actions</span>
        </div>
        {rows.map(([title, posted, status, apps, deadline]) => (
          <div key={title} className="grid grid-cols-[2fr_1fr_0.8fr_1fr_1.4fr] items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]">
            <div className="min-w-0"><p className="truncate font-medium text-ink">{title}</p><p className="text-[10.5px] text-faint">Posted {posted}</p></div>
            <span><Chip tone={tone(status)}>{label(status)}</Chip></span>
            <span className="text-right tabular-nums">{apps === '0' ? '—' : apps}</span>
            <span className="text-right tabular-nums text-muted">{deadline}</span>
            <span className="flex justify-end gap-1.5">
              <span className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand">View applicants</span>
              <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted">Edit</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Active jobs count against your 10 posting slots. Expired jobs can be reposted (uses a slot).</p>
    </div>
  )
}

function ApplicantsScreen() {
  const cols: { stage: keyof typeof STAGE_TONE; people: { n: string; exp: string }[] }[] = [
    { stage: 'New', people: [{ n: 'Nguyễn Thị Hoa', exp: '3 yrs · ĐD' }, { n: 'Phạm Thu Trang', exp: '1 yr · ĐD' }] },
    { stage: 'Screening', people: [{ n: 'Trần Văn Bình', exp: '5 yrs · ĐD' }] },
    { stage: 'Interview', people: [{ n: 'Lê Thị Cúc', exp: '4 yrs · ĐD' }] },
    { stage: 'Offer', people: [{ n: 'Võ Minh Anh', exp: '6 yrs · ĐD' }] },
    { stage: 'Rejected', people: [{ n: 'Đỗ Văn Khoa', exp: '2 yrs · ĐD' }] },
  ]
  return (
    <div>
      <PageBar
        title="Applicants"
        sub="Applications forwarded by Saramin after screening. Move candidates through your hiring stages."
        action={<span className="rounded-md border border-line px-3 py-1.5 text-[12px] text-muted">Job: Điều dưỡng viên (Khoa Nội) ▾</span>}
      />
      <div className="grid grid-cols-5 gap-2 overflow-x-auto" style={{ minWidth: 720 }}>
        {cols.map((c) => (
          <div key={c.stage} className="min-w-[130px] rounded-lg border border-line bg-canvas/40 p-2">
            <div className="mb-2 flex items-center justify-between">
              <Chip tone={STAGE_TONE[c.stage]}>{c.stage}</Chip>
              <span className="text-[11px] font-bold text-faint">{c.people.length}</span>
            </div>
            {c.people.map((p) => (
              <div key={p.n} className="mb-1.5 rounded-md border border-line bg-surface p-2">
                <p className="truncate text-[11.5px] font-semibold text-ink">{p.n}</p>
                <p className="text-[10.5px] text-muted">{p.exp}</p>
                <span className="mt-1 inline-block text-[10px] font-medium text-brand">View CV →</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-faint">Every application is screened by Saramin before it reaches you. Drag a candidate to change stage.</p>
    </div>
  )
}

function ResumeSearchScreen() {
  const cvs = [
    { title: 'Điều dưỡng viên · 4 năm KN', loc: 'Hồ Chí Minh', unlocked: true, name: 'Nguyễn Thị H.' },
    { title: 'Điều dưỡng trưởng · 7 năm KN', loc: 'Hồ Chí Minh', unlocked: false },
    { title: 'Kỹ thuật viên xét nghiệm · 3 năm', loc: 'Bình Dương', unlocked: false },
    { title: 'Bác sĩ đa khoa · 6 năm KN', loc: 'Hồ Chí Minh', unlocked: false },
  ]
  return (
    <div>
      <PageBar title="Resume search" sub="Find and unlock candidate CVs from Saramin's talent pool." action={<Chip tone="blue">62 / 100 unlocks left</Chip>} />
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 rounded-md border border-line px-3 py-2 text-[12px] text-faint">🔍 "điều dưỡng", skills, title…</div>
        <div className="w-36 rounded-md border border-line px-3 py-2 text-[12px] text-faint">📍 HCMC</div>
        <Btn primary>Search</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          <p className="text-[12px] font-bold">Filters</p>
          {['Industry', 'Experience', 'Location', 'Education', 'Salary expectation'].map((f) => (
            <div key={f}><p className="mb-1.5 text-[11.5px] font-medium text-ink/80">{f}</p><div className="space-y-1"><Line w="90%" h={7} /><Line w="65%" h={7} /></div></div>
          ))}
        </div>
        <div>
          <p className="mb-3 text-[12px] text-muted"><b className="text-ink">248</b> candidates match</p>
          <div className="space-y-2.5">
            {cvs.map((cv, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-line p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-[13px]">{cv.unlocked ? '👩‍⚕️' : '🔒'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{cv.unlocked ? cv.name : '••••••• (locked)'}</p>
                  <p className="truncate text-[11.5px] text-muted">{cv.title}</p>
                  <div className="mt-1 flex gap-1.5"><Chip>{cv.loc}</Chip>{cv.unlocked && <Chip tone="green">Contact visible</Chip>}</div>
                </div>
                {cv.unlocked ? <Btn>View CV</Btn> : <Btn primary>🔓 Unlock · 1 CV</Btn>}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            🔒 Unlocking a CV reveals PII and spends 1 unlock. Every unlock is logged.
          </div>
        </div>
      </div>
    </div>
  )
}

function CompanyPageScreen() {
  return (
    <div>
      <PageBar
        title="Company page"
        sub="Your public profile on the jobseeker site — required because you post jobs."
        action={<div className="flex gap-2"><Btn>Save changes</Btn><Btn primary>↗ View live</Btn></div>}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Public profile <span className="text-emerald-600">· published</span></p>
          <Field label="Display name" req value="Vạn Phát Healthcare" />
          <Field label="Logo · cover image" value="Uploaded ✓" />
          <Field label="About (vi required · en/ko optional)" req area value="Hệ thống y tế tư nhân hàng đầu HCMC, tuyển dụng điều dưỡng & vận hành…" />
          <Field label="Benefits / welfare" value="Bảo hiểm · thưởng tháng 13 · hybrid" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Locations" value="Quận 1, HCMC" />
            <Field label="Website" value="vanphat.vn" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-faint">Jobseeker view →</p>
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="h-14 bg-gradient-to-r from-brand to-violet-500" />
            <div className="-mt-6 px-4 pb-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl border-2 border-surface bg-surface text-[16px] font-bold text-brand shadow">VP</div>
              <p className="mt-2 text-[13px] font-bold">Vạn Phát Healthcare</p>
              <p className="text-[11px] text-faint">Healthcare · HCMC · 200–500 staff</p>
              <p className="mt-2 text-[11.5px] text-muted">Hệ thống y tế tư nhân hàng đầu HCMC, tuyển dụng điều dưỡng & vận hành.</p>
              <p className="mt-3 text-[11px] font-bold text-ink">Open roles (4)</p>
              <div className="mt-1.5 space-y-1.5">
                <div className="flex justify-between rounded-md border border-line px-2.5 py-1.5 text-[11px]"><span>Điều dưỡng viên (Khoa Nội)</span><span className="text-faint">HCMC</span></div>
                <div className="flex justify-between rounded-md border border-line px-2.5 py-1.5 text-[11px]"><span>Bác sĩ Đa khoa</span><span className="text-faint">HCMC</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-brand">🔗 Same company record as CRM & Admin — one source of truth. Resume-Search-only customers don't get this page.</div>
    </div>
  )
}

function TeamBillingScreen() {
  const team = [
    ['Vũ Thanh Linh', 'linh@vanphat.vn', 'HR Manager', 'green', 'Active'],
    ['Đỗ Thị Mai', 'mai@vanphat.vn', 'HR Specialist', 'muted', 'Active'],
    ['Ngô Văn Sơn', 'son@vanphat.vn', 'HR Specialist', 'amber', 'Invited'],
  ] as const
  return (
    <div>
      <PageBar title="Team & billing" sub="Manage your users and see what you've bought." />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12.5px] font-bold">Users</p>
            <div className="flex items-center gap-2"><span className="text-[11px] text-faint">3 / 4 seats</span><Btn primary>+ Invite user</Btn></div>
          </div>
          <div className="space-y-1.5">
            {team.map(([name, email, role, tone, status]) => (
              <div key={email} className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink">{name}</p>
                  <p className="truncate font-mono text-[10.5px] text-faint">{email}</p>
                </div>
                <Chip tone={tone as 'green' | 'muted' | 'amber'}>{role}</Chip>
                <Chip tone={status === 'Active' ? 'green' : 'amber'}>{status}</Chip>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-faint">Exactly 1 HR Manager + up to 3 HR Specialists. All share the account's pooled quota. Only the Manager can invite / remove / transfer the role.</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12.5px] font-bold">Products & quota</p>
            <div className="mb-3">
              <div className="flex justify-between text-[11.5px]"><span>📢 Job posting</span><b className="tabular-nums">7/10 slots</b></div>
              <Bar pct={70} />
            </div>
            <div>
              <div className="flex justify-between text-[11.5px]"><span>🔍 Resume search</span><b className="tabular-nums">62/100 unlocks</b></div>
              <Bar pct={62} />
            </div>
            <p className="mt-2 text-[10.5px] text-faint">Valid until 31/12/2026 · <span className="text-brand">Buy more →</span></p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12.5px] font-bold">Order history</p>
            <div className="space-y-1.5 text-[11.5px]">
              <div className="flex items-center justify-between"><span className="text-muted">ORD-5521 · Recruit Growth</span><Chip tone="green">Paid</Chip></div>
              <div className="flex items-center justify-between"><span className="text-muted">INV-3390 · 37,800,000 ₫</span><span className="text-brand">Invoice ↓</span></div>
            </div>
            <p className="mt-2 text-[10.5px] text-faint">Provisioned automatically once payment is confirmed by Saramin.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── navigation model ────────────────────────────────────────────────────── */
interface NavItem {
  id: string
  label: string
  Comp: () => JSX.Element
}
interface NavGroup {
  label: string
  icon: React.ReactNode
  items: NavItem[]
}

const DASHBOARD: NavItem = { id: 'co-dashboard', label: 'Dashboard', Comp: DashboardScreen }
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Recruiting',
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      { id: 'co-jobs', label: 'My jobs', Comp: MyJobsScreen },
      { id: 'co-post-job', label: 'Post a job', Comp: PostJobScreen },
      { id: 'co-applicants', label: 'Applicants', Comp: ApplicantsScreen },
    ],
  },
  {
    label: 'Talent',
    icon: <Search className="h-4 w-4" />,
    items: [{ id: 'co-resume-search', label: 'Resume search', Comp: ResumeSearchScreen }],
  },
  {
    label: 'Account',
    icon: <Settings className="h-4 w-4" />,
    items: [
      { id: 'co-company-page', label: 'Company page', Comp: CompanyPageScreen },
      { id: 'co-team', label: 'Team & billing', Comp: TeamBillingScreen },
    ],
  },
]

/** flat registry of company screens, for embedding in feature detail pages */
export const CO_SCREENS: NavItem[] = [DASHBOARD, ...NAV_GROUPS.flatMap((g) => g.items)]

export function CompanyMockups() {
  const [active, setActive] = useState<{ group: string; item: NavItem }>({ group: 'Home', item: DASHBOARD })
  const Body = active.item.Comp

  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">Company portal — navigation & shell</h1>
        <p className="mt-2 max-w-[72ch] text-[14px] leading-relaxed text-ink/75">
          The <b>employer / recruiter</b> console — what a company's HR Manager &amp; HR Specialists see after
          logging in. Same shell as the HQ Admin wireframe: a left sidebar + content area. Click any nav item to
          preview its screen. Structure &amp; layout only — not final visual design.
        </p>
      </div>

      {/* console shell */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {/* top bar */}
        <div className="flex items-center gap-3 border-b border-line bg-canvas/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
            <span className="text-[13px] font-semibold">Saramin · Employer</span>
          </div>
          <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2.5 md:flex">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[9px] font-bold text-white">VP</span>
            <span className="text-[11px] text-ink/70">Vạn Phát Healthcare</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-md border border-line px-2 py-1 text-[10.5px] text-muted sm:inline">📢 7/10 slots · 🔍 62 CVs</span>
            <div className="flex overflow-hidden rounded-md border border-line text-[11px] font-medium">
              <span className="bg-brand px-2 py-1 text-white">VI</span>
              <span className="px-2 py-1 text-muted">EN</span>
              <span className="px-2 py-1 text-muted">KO</span>
            </div>
            <span className="relative grid h-7 w-7 place-items-center rounded-md border border-line text-muted">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand to-violet-500" />
          </div>
        </div>

        {/* body: sidebar + content */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="max-h-[640px] overflow-y-auto border-r border-line bg-canvas/30 py-2 scroll-thin">
            <SidebarItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              active={active.item.id === DASHBOARD.id}
              onClick={() => setActive({ group: 'Home', item: DASHBOARD })}
            />
            {NAV_GROUPS.map((g) => (
              <SidebarGroup
                key={g.label}
                group={g}
                activeItem={active.group === g.label ? active.item.id : null}
                onSelect={(item) => setActive({ group: g.label, item })}
              />
            ))}
          </nav>

          <div className="min-w-0 bg-surface">
            <div className="flex items-center gap-2 border-b border-line-soft px-5 py-3 text-[11.5px] text-muted">
              <span>{active.group === 'Home' ? 'Employer' : active.group}</span>
              <span className="text-faint">/</span>
              <span className="font-medium text-ink">{active.item.label}</span>
            </div>
            <div className="p-5">
              <Body />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 max-w-[72ch] text-[12px] leading-relaxed text-faint">
        This is the company's own console — created by Sales in the CRM, then activated. Everything here draws on
        the same company record and pooled quota shown in the Admin &amp; CRM mockups.
      </p>
    </div>
  )
}

function SidebarItem({ icon, label, active, onClick }: { icon?: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] font-medium transition-colors',
        active ? 'bg-brand-soft text-brand' : 'text-ink/80 hover:bg-canvas/70',
      )}
    >
      {icon && <span className={cn(active ? 'text-brand' : 'text-faint')}>{icon}</span>}
      <span className="truncate">{label}</span>
    </button>
  )
}

function SidebarGroup({ group, activeItem, onSelect }: { group: NavGroup; activeItem: string | null; onSelect: (item: NavItem) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] font-medium text-ink/80 hover:bg-canvas/70"
      >
        <span className="text-faint">{group.icon}</span>
        <span className="truncate">{group.label}</span>
        <ChevronDown className={cn('ml-auto h-3.5 w-3.5 text-faint transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <ul>
          {group.items.map((it) => {
            const isActive = activeItem === it.id
            return (
              <li key={it.id}>
                <button
                  onClick={() => onSelect(it)}
                  className={cn(
                    'flex w-full items-center gap-2 py-1.5 pl-9 pr-3 text-left text-[12px] transition-colors',
                    isActive ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70 hover:bg-canvas/70',
                  )}
                >
                  <span className="truncate">{it.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
