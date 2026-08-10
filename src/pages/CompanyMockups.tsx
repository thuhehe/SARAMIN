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
import { createContext, useContext, useState } from 'react'
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  Crown,
  Shield,
  List,
  Columns3,
  SlidersHorizontal,
  Filter,
  Pencil,
  MoreHorizontal,
  MoreVertical,
  Building2,
  CheckCheck,
  Plus,
  Inbox,
  Users,
} from 'lucide-react'
import { Btn, Chip } from '@/components/wire'
import { cn } from '@/lib/utils'

/** Lets a screen jump the console to another screen by id (e.g. "+ Post a job"). */
const CoNav = createContext<(id: string) => void>(() => {})
const useCoNav = () => useContext(CoNav)

/** Small segmented / pill selector used across the Post-a-job form. */
function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-md border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
            value === o ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-brand/40',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

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
  const go = useCoNav()
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
        <Stat label="Open jobs" value="4" sub="1 scheduled" />
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
              <Btn primary onClick={() => go('co-post-job')}>+ Post a job</Btn>
              <Btn onClick={() => go('co-resume-search')}>🔍 Search resumes</Btn>
              <Btn onClick={() => go('co-company-page')}>✎ Edit company page</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Bilingual copy for the demo posting — swapped by the VI / EN tab. */
const JOB_I18N = {
  vi: {
    title: 'Điều dưỡng viên (Khoa Nội)',
    role: 'Chăm sóc bệnh nhân nội trú, theo dõi dấu hiệu sinh tồn, phối hợp với bác sĩ trong điều trị…',
    quals: 'Bằng cao đẳng/đại học điều dưỡng, chứng chỉ hành nghề, tối thiểu 1 năm kinh nghiệm…',
    benefits: 'Bảo hiểm sức khỏe, thưởng tháng 13, phụ cấp ca đêm…',
  },
  en: {
    title: 'Registered Nurse (Internal Medicine)',
    role: 'Care for inpatients, monitor vital signs, coordinate with treating physicians…',
    quals: 'Nursing college/university degree, valid practice certificate, 1+ year experience…',
    benefits: 'Health insurance, 13th-month bonus, night-shift allowance…',
  },
}

function PostJobScreen() {
  const go = useCoNav()
  const [lang, setLang] = useState<'vi' | 'en'>('vi')
  const [salaryMode, setSalaryMode] = useState('From – to')
  const [exposure, setExposure] = useState('Exposed')
  const [pkg, setPkg] = useState('Basic')
  const [jobType, setJobType] = useState('In office')
  const [contract, setContract] = useState('Full-time')
  const t = JOB_I18N[lang]

  return (
    <div>
      <PageBar
        title="Post a job"
        sub="Uses 1 of your 10 posting slots · goes live immediately — no approval wait."
        action={
          <div className="flex gap-2">
            <Btn onClick={() => go('co-jobs')}>Save draft</Btn>
            <Btn primary onClick={() => go('co-jobs')}>Post now</Btn>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* form */}
        <div className="space-y-4">
          {/* language tab — controls all bilingual fields */}
          <div className="flex items-center justify-between rounded-lg border border-line bg-canvas/40 px-3 py-2">
            <span className="text-[11px] font-medium text-ink/70">Content language</span>
            <div className="flex overflow-hidden rounded-md border border-line text-[11px] font-medium">
              {(['vi', 'en'] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={cn('px-2.5 py-1 uppercase', lang === l ? 'bg-brand text-white' : 'text-muted')}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Basics */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">Basics</p>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Company <span className="text-rose-500">*</span></p>
              <div className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-3 py-2 text-[12px] text-ink/70">
                🔒 Vạn Phát Healthcare
                <span className="ml-auto text-[10.5px] text-violet-600">from Company API · ID VP-1042</span>
              </div>
            </div>
            <Field label={`Job title · ${lang.toUpperCase()} 🌐`} req value={t.title} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category / industry" req value="Healthcare ▾" />
              <Field label="Position level" value="Junior ▾" />
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Contract type <span className="text-rose-500">*</span></p>
              <Seg options={['Full-time', 'Freelancer']} value={contract} onChange={setContract} />
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Job type <span className="text-rose-500">*</span></p>
              <Seg options={['In office', 'Remote', 'Hybrid', 'Oversea']} value={jobType} onChange={setJobType} />
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Exposure status <span className="text-rose-500">*</span></p>
              <Seg options={['Exposed', 'Unexposed']} value={exposure} onChange={setExposure} />
              <p className="mt-1 text-[10.5px] text-faint">Whether this job shows on the jobseeker site (hiển thị trên trang jobseeker hay không).</p>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Package <span className="text-rose-500">*</span></p>
              <Seg options={['Free', 'Basic', 'Basic plus', 'Distinction']} value={pkg} onChange={setPkg} />
            </div>
          </div>

          {/* Location, experience & salary */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">Location, experience & salary</p>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Location (city) <span className="text-rose-500">*</span></p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip tone="blue">Hồ Chí Minh ✕</Chip>
                <Chip tone="blue">Hà Nội ✕</Chip>
                <span className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] text-brand">+ Add city</span>
              </div>
              <p className="mt-1 text-[10.5px] text-faint">Multiple cities — pending client confirmation.</p>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Years of experience</p>
              <div className="flex items-center gap-2 text-[12px] text-faint">
                <span className="rounded-md border border-line bg-surface px-3 py-2">From 1</span>
                <span className="text-muted">—</span>
                <span className="rounded-md border border-line bg-surface px-3 py-2">To 3</span>
                <span className="text-[11px] text-faint">years</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Salary <span className="text-rose-500">*</span></p>
              <div className="flex gap-4 text-[12px]">
                {['Negotiable', 'From – to'].map((m) => (
                  <label key={m} onClick={() => setSalaryMode(m)} className="flex cursor-pointer items-center gap-1.5 text-ink/80">
                    <span className={cn('grid h-3.5 w-3.5 place-items-center rounded-full border-2', salaryMode === m ? 'border-brand' : 'border-line')}>
                      {salaryMode === m && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </span>
                    {m}
                  </label>
                ))}
              </div>
              {salaryMode === 'From – to' ? (
                <div className="mt-2 flex items-center gap-2 text-[12px] text-faint">
                  <span className="rounded-md border border-line bg-surface px-3 py-2">12,000,000</span>
                  <span className="text-muted">—</span>
                  <span className="rounded-md border border-line bg-surface px-3 py-2">18,000,000</span>
                  <span className="text-[11px] text-faint">VND</span>
                </div>
              ) : (
                <p className="mt-2 rounded-md border border-line bg-canvas/40 px-3 py-2 text-[12px] text-muted">Shown as “Thỏa thuận” to jobseekers.</p>
              )}
            </div>
          </div>

          {/* Content (bilingual) */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">Content · {lang.toUpperCase()} 🌐</p>
            <Field label="Your role & responsibility" req area value={t.role} />
            <Field label="Your skills & qualifications" req area value={t.quals} />
            <Field label="Benefits" area value={t.benefits} />
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Skills</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip>Điều dưỡng ✕</Chip><Chip>Chăm sóc bệnh nhân ✕</Chip><Chip>Sơ cấp cứu ✕</Chip>
                <span className="rounded-md border border-line px-2 py-1 text-[11px] text-muted">Select skills ▾</span>
              </div>
            </div>
            <Field label="Application deadline" req value="31/08/2026" />
          </div>
        </div>

        {/* preview + notes */}
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-faint">Jobseeker view →</p>
            <div className={cn('rounded-lg border border-line p-3', exposure === 'Unexposed' && 'opacity-50')}>
              <div className="flex gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-canvas text-[11px] font-bold text-brand">VP</div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{t.title}</p>
                  <p className="text-[12px] text-muted">Vạn Phát Healthcare</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip tone="green">{salaryMode === 'From – to' ? '12 – 18 tr' : 'Thỏa thuận'}</Chip>
                    <Chip>Hồ Chí Minh</Chip>
                    <Chip>{jobType}</Chip>
                    <Chip>{contract}</Chip>
                  </div>
                </div>
              </div>
            </div>
            {exposure === 'Unexposed' && (
              <p className="mt-1.5 rounded-md border border-line bg-canvas/50 px-3 py-1.5 text-[11px] text-muted">🚫 Unexposed — hidden from the jobseeker site until you set it to Exposed.</p>
            )}
          </div>
          <div className="rounded-md bg-brand-soft px-3 py-2.5 text-[11.5px] text-brand">
            📦 Package: <b>{pkg}</b>{pkg === 'Free' ? ' — standard listing.' : ' — higher visibility & ranking.'}
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11.5px] text-emerald-800">
            ✅ Goes live immediately — no approval wait. Visible to jobseekers while the job is <b>Open</b> and <b>Exposure is On</b>.
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
  const go = useCoNav()
  const rows: [string, string, 'Open' | 'Schedule' | 'Closed' | 'Draft', 'On' | 'Off' | '—', string, string][] = [
    ['Điều dưỡng viên (Khoa Nội)', '02/07/2026', 'Open', 'On', '14', '31/08/2026'],
    ['Bác sĩ Đa khoa', '28/06/2026', 'Open', 'Off', '6', '28/08/2026'],
    ['Kế toán viện phí', '01/09/2026', 'Schedule', '—', '0', '15/09/2026'],
    ['Lễ tân bệnh viện', '01/04/2026', 'Closed', '—', '31', '30/06/2026'],
  ]
  const tone = (s: string) => (s === 'Open' ? 'green' : s === 'Schedule' ? 'blue' : 'muted') as 'green' | 'blue' | 'muted'
  return (
    <div>
      <PageBar title="My jobs" sub="Jobs your company has posted — go live instantly, no approval wait." action={<Btn primary onClick={() => go('co-post-job')}>+ Post a job</Btn>} />
      <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-line-soft pb-3">
        {['All 4', 'Draft 0', 'Schedule 1', 'Open 2', 'Closed 1'].map((t, i) => (
          <span key={t} className={cn('rounded-lg px-2.5 py-1 text-[12px]', i === 0 ? 'bg-brand-soft font-medium text-brand' : 'text-muted')}>{t}</span>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_1.4fr] bg-canvas/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>Job title</span><span>Status</span><span>Exposure</span><span className="text-right">Applicants</span><span className="text-right">Deadline</span><span className="text-right">Actions</span>
        </div>
        {rows.map(([title, posted, status, exposure, apps, deadline]) => (
          <div key={title} className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1fr_1.4fr] items-center border-t border-line-soft px-4 py-2.5 text-[12.5px]">
            <div className="min-w-0"><p className="truncate font-medium text-ink">{title}</p><p className="text-[10.5px] text-faint">Posted {posted}</p></div>
            <span><Chip tone={tone(status)}>{status}</Chip></span>
            <span>{status === 'Open'
              ? <span className={cn('inline-flex items-center gap-1 text-[11.5px] font-medium', exposure === 'On' ? 'text-emerald-600' : 'text-slate-400')}><span className={cn('h-1.5 w-1.5 rounded-full', exposure === 'On' ? 'bg-emerald-500' : 'bg-slate-300')} />{exposure}</span>
              : <span className="text-[11.5px] text-faint">—</span>}</span>
            <span className="text-right tabular-nums">{apps === '0' ? '—' : apps}</span>
            <span className="text-right tabular-nums text-muted">{deadline}</span>
            <span className="flex justify-end gap-1.5">
              <span onClick={() => go('co-applicants')} className="cursor-pointer rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand">View applicants</span>
              <span onClick={() => go('co-post-job')} className="cursor-pointer rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted">Edit</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Open &amp; Scheduled jobs count against your 10 posting slots. Turn Exposure off to take an Open job down without closing it.</p>
    </div>
  )
}

/** The candidate's profile photo. Initials stand in for the real image in the
    wireframe; a candidate who uploaded a photo shows it in the same slot. */
function Avatar({ name, big }: { name: string; big?: boolean }) {
  const parts = name.trim().split(/\s+/)
  const initials = ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand',
        big ? 'h-11 w-11 text-[14px]' : 'h-8 w-8 text-[11px]',
      )}
    >
      {initials}
    </span>
  )
}

/** Match score against THIS job — the signal that tells a recruiter which card
    to open first, so the column order stops being just "who applied last". */
function Match({ score }: { score: number }) {
  return (
    <Chip tone={score >= 80 ? 'green' : score >= 60 ? 'amber' : 'muted'}>{score}% match</Chip>
  )
}

type CoCandidate = {
  n: string
  role: string
  exp: string
  loc: string
  match: number
  applied: string
  salary: string
  cv: string
  /** days since the last stage move — the "who is waiting on me" pressure signal */
  waiting: string
}

/** Toolbar button in the Saramin KR shape: white, hairline border, icon + label. */
function BarBtn({ icon, children, active, onClick }: { icon?: React.ReactNode; children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium',
        active ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-ink/70',
        onClick && 'cursor-pointer select-none',
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/** Rounded status pill under the page title — Saramin KR's chip row. */
function Pill({ icon, children, tone = 'muted' }: { icon?: React.ReactNode; children: React.ReactNode; tone?: 'muted' | 'violet' | 'green' }) {
  const tones = {
    muted: 'bg-canvas text-muted',
    violet: 'bg-violet-50 text-violet-700',
    green: 'bg-emerald-50 text-emerald-700',
  }
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium', tones[tone])}>{icon}{children}</span>
}

type CoStageCol = { stage: keyof typeof STAGE_TONE; people: CoCandidate[] }

/** One stage header. `terminal` is the fixed final stage (Saramin KR's 최종 합격):
    it sits AFTER the "+", so the header row itself says which stages a company may
    rename or remove and which one it may not. */
function StageHead({ col, active, terminal, onClick }: { col: CoStageCol; active?: boolean; terminal?: boolean; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'flex min-w-[128px] shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2',
        onClick && 'cursor-pointer',
        active
          ? 'border-brand bg-brand-soft/50'
          : terminal
            ? 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300'
            : 'border-line bg-surface hover:border-brand/40',
      )}
    >
      <span className={cn('text-[12.5px] font-semibold', terminal ? 'text-emerald-800' : 'text-ink')}>{col.stage}</span>
      <span className={cn('text-[13px] font-bold tabular-nums', terminal ? 'text-emerald-600' : 'text-brand')}>{col.people.length}</span>
      {terminal ? <Crown className="ml-auto h-3.5 w-3.5 text-emerald-500" /> : <MoreVertical className="ml-auto h-3.5 w-3.5 text-faint" />}
    </span>
  )
}

/** A board column: the same stage header, with its cards underneath. */
function StageColumn({ col, terminal, onPick }: { col: CoStageCol; terminal?: boolean; onPick: (n: string) => void }) {
  return (
    <div className={cn('w-[208px] shrink-0 rounded-lg border', terminal ? 'border-emerald-200 bg-emerald-50/40' : 'border-line bg-canvas/40')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className={cn('text-[12.5px] font-semibold', terminal ? 'text-emerald-800' : 'text-ink')}>{col.stage}</span>
        <span className={cn('text-[13px] font-bold tabular-nums', terminal ? 'text-emerald-600' : 'text-brand')}>{col.people.length}</span>
        {terminal ? <Crown className="ml-auto h-3.5 w-3.5 text-emerald-500" /> : <MoreVertical className="ml-auto h-3.5 w-3.5 text-faint" />}
      </div>
      <div className="min-h-[220px] space-y-1.5 px-2 pb-2">
        {col.people.map((p) => (
          <div key={p.n} onClick={() => onPick(p.n)} className="cursor-pointer rounded-lg border border-line bg-surface p-2 hover:border-brand/40">
            {/* photo + who they are — enough to judge the card without opening it */}
            <div className="flex items-start gap-2">
              <Avatar name={p.n} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-semibold text-ink">{p.n}</p>
                <p className="truncate text-[10.5px] text-muted">{p.role}</p>
              </div>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[10px] text-muted">
              <p className="truncate">🕑 {p.exp} · 📍 {p.loc}</p>
              <p className="truncate">💰 Mong muốn {p.salary}</p>
              <p className="truncate">📄 {p.cv}</p>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1">
              <Match score={p.match} />
              <span className="shrink-0 text-[10px] text-faint">{p.waiting}</span>
            </div>
          </div>
        ))}
        {col.people.length === 0 && (
          <div className="py-10 text-center">
            <Inbox className="mx-auto h-5 w-5 text-faint" />
            <p className="mt-1.5 text-[11.5px] text-muted">No candidates</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** The postings in the left rail — the same jobs as My jobs, seen from the pipeline side. */
const PIPELINE_JOBS: [string, string][] = [
  ['Điều dưỡng viên (Khoa Nội)', '6 candidates · posted 02/07/2026'],
  ['Bác sĩ Đa khoa', '3 candidates · posted 28/06/2026'],
  ['Kế toán viện phí', 'No candidates · scheduled 01/09/2026'],
  ['Lễ tân bệnh viện', '31 candidates · closed 30/06/2026'],
]

function ApplicantsScreen() {
  const [sel, setSel] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'board'>('list')
  /** null = every stage. Clicking a stage header filters the list to it. */
  const [stage, setStage] = useState<string | null>(null)
  const [multi, setMulti] = useState(false)
  const [picks, setPicks] = useState<string[]>([])
  const cols: CoStageCol[] = [
    {
      stage: 'New',
      people: [
        { n: 'Nguyễn Thị Hoa', role: 'Điều dưỡng viên', exp: '3 năm KN', loc: 'Hồ Chí Minh', match: 88, applied: '2 ngày trước', salary: '12–15 tr', cv: 'Saramin CV', waiting: '2 days' },
        { n: 'Phạm Thu Trang', role: 'Điều dưỡng viên', exp: '1 năm KN', loc: 'Bình Dương', match: 64, applied: '3 ngày trước', salary: '9–11 tr', cv: 'PDF tải lên', waiting: '3 days' },
      ],
    },
    { stage: 'Screening', people: [{ n: 'Trần Văn Bình', role: 'Điều dưỡng viên', exp: '5 năm KN', loc: 'Hồ Chí Minh', match: 81, applied: '5 ngày trước', salary: '15–18 tr', cv: 'Saramin CV', waiting: '4 days' }] },
    { stage: 'Interview', people: [{ n: 'Lê Thị Cúc', role: 'Điều dưỡng viên', exp: '4 năm KN', loc: 'Hồ Chí Minh', match: 76, applied: '1 tuần trước', salary: '13–16 tr', cv: 'Saramin CV', waiting: '6 days' }] },
    { stage: 'Offer', people: [{ n: 'Võ Minh Anh', role: 'Điều dưỡng trưởng', exp: '6 năm KN', loc: 'Hồ Chí Minh', match: 92, applied: '2 tuần trước', salary: '18–22 tr', cv: 'Saramin CV', waiting: '1 day' }] },
    { stage: 'Rejected', people: [{ n: 'Đỗ Văn Khoa', role: 'Kỹ thuật viên xét nghiệm', exp: '2 năm KN', loc: 'Đồng Nai', match: 41, applied: '2 tuần trước', salary: '10–12 tr', cv: 'PDF tải lên', waiting: '9 days' }] },
  ]
  /* The terminal stage, pinned past the "+": every company has it and no company
     can rename or remove it, so it is not part of `cols`. */
  const hired: CoStageCol = { stage: 'Hired', people: [] }
  // one flat list, so the table and the detail both read from the same rows
  const flat = [...cols, hired].flatMap((c) => c.people.map((p) => ({ ...p, stage: c.stage })))
  const rows = stage ? flat.filter((p) => p.stage === stage) : flat
  const picked = flat.find((p) => p.n === sel)
  const toggle = (n: string) => setPicks((ps) => (ps.includes(n) ? ps.filter((x) => x !== n) : [...ps, n]))

  return (
    <div className="relative grid grid-cols-1 md:grid-cols-[236px_minmax(0,1fr)]">
      {/* ── left rail: which posting am I working? ─────────────────────────── */}
      <aside className="border-b border-line bg-surface p-3 md:border-b-0 md:border-r">
        <div className="flex rounded-lg bg-canvas p-0.5 text-[12px] font-medium">
          <span className="flex-1 rounded-md bg-surface py-1 text-center text-ink shadow-sm">Jobs</span>
          <span className="flex-1 py-1 text-center text-muted">Talent pool</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-faint">
          <Search className="h-3.5 w-3.5" />
          Search job, candidate
        </div>
        <div className="mt-2 flex items-center gap-1 px-1 text-[11.5px] font-medium text-ink/70">
          All <ChevronDown className="h-3 w-3 text-faint" />
        </div>
        <ul className="mt-1.5 space-y-0.5">
          {PIPELINE_JOBS.map(([title, sub], i) => (
            <li key={title}>
              <div className={cn('cursor-pointer rounded-md border-l-2 px-2 py-1.5', i === 0 ? 'border-brand bg-brand-soft/50' : 'border-transparent hover:bg-canvas/70')}>
                <p className={cn('truncate text-[12px]', i === 0 ? 'font-semibold text-brand' : 'text-ink/80')}>{title}</p>
                <p className="truncate text-[10.5px] text-faint">{sub}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-[11px] text-faint">1 / 1</p>
      </aside>

      {/* ── main: the pipeline for the selected posting ────────────────────── */}
      <div className="min-w-0 p-5">
        <div className="flex flex-wrap items-baseline gap-2">
          <h3 className="text-[21px] font-bold tracking-tight">Điều dưỡng viên (Khoa Nội)</h3>
          <span className="inline-flex cursor-pointer items-center gap-1 text-[12px] text-muted">All openings <ChevronDown className="h-3 w-3" /></span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Pill tone="violet" icon={<Users className="h-3.5 w-3.5" />}>{flat.length} candidates</Pill>
          <Pill tone="green" icon={<CheckCheck className="h-3.5 w-3.5" />}>Screened by Saramin</Pill>
          <Pill>Điều dưỡng · Hồ Chí Minh</Pill>
        </div>

        {/* toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-line">
            {([['list', List], ['board', Columns3]] as const).map(([v, Icon]) => (
              <span
                key={v}
                onClick={() => setView(v)}
                className={cn('grid h-[30px] w-9 cursor-pointer place-items-center', view === v ? 'bg-brand-soft text-brand' : 'text-faint')}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
          <div className="flex w-[190px] items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] text-faint">
            <Search className="h-3.5 w-3.5" />
            Search candidate
          </div>
          <BarBtn icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>Detail</BarBtn>
          <BarBtn icon={<Filter className="h-3.5 w-3.5" />}>Filter</BarBtn>
          <div className="ml-auto flex items-center gap-2">
            <BarBtn
              icon={<CheckCheck className="h-3.5 w-3.5" />}
              active={multi}
              onClick={() => {
                setMulti((m) => !m)
                setPicks([])
              }}
            >
              Select multiple
            </BarBtn>
            <span className="grid h-[30px] w-8 place-items-center rounded-lg border border-line text-faint"><ChevronUp className="h-4 w-4" /></span>
          </div>
        </div>

        {/* stage rail — the counters ARE the navigation; a company can rename, add or remove these */}
        {view === 'list' && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scroll-thin">
            {cols.map((c) => (
              <StageHead key={c.stage} col={c} active={stage === c.stage} onClick={() => setStage((s) => (s === c.stage ? null : c.stage))} />
            ))}
            <span className="grid h-[38px] w-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-dashed border-line text-faint"><Plus className="h-4 w-4" /></span>
            <StageHead col={hired} terminal active={stage === hired.stage} onClick={() => setStage((s) => (s === hired.stage ? null : hired.stage))} />
          </div>
        )}

        {/* bulk bar — the common case is a bulk Rejected after a screening pass */}
        {multi && picks.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2 text-[12px] text-brand">
            <b className="tabular-nums">{picks.length} selected</b>
            <span className="cursor-pointer rounded-md border border-brand/30 bg-surface px-2 py-1 font-medium">Move to stage ▾</span>
            <span className="cursor-pointer rounded-md border border-brand/30 bg-surface px-2 py-1 font-medium">Reject</span>
            <span onClick={() => setPicks([])} className="ml-auto cursor-pointer text-[11.5px] underline">Clear</span>
          </div>
        )}

        {view === 'list' ? (
          /* ── list view — the table Saramin KR opens on ── */
          <div className="mt-3 overflow-x-auto">
            <div className="min-w-[820px] overflow-hidden rounded-lg border border-line">
              <div className={cn('grid bg-canvas/60 px-4 py-2 text-[11px] font-semibold text-muted', multi ? 'grid-cols-[24px_2fr_1fr_1fr_0.9fr_1fr_0.9fr]' : 'grid-cols-[2fr_1fr_1fr_0.9fr_1fr_0.9fr]')}>
                {multi && <span />}
                <span>Candidate</span>
                <span>Experience</span>
                <span>Desired salary</span>
                <span>Match</span>
                <span>Stage</span>
                <span className="text-right">Waiting</span>
              </div>
              {rows.map((p) => (
                <div
                  key={p.n}
                  className={cn(
                    'grid items-center border-t border-line-soft px-4 py-2.5 text-[12.5px] hover:bg-canvas/40',
                    multi ? 'grid-cols-[24px_2fr_1fr_1fr_0.9fr_1fr_0.9fr]' : 'grid-cols-[2fr_1fr_1fr_0.9fr_1fr_0.9fr]',
                  )}
                >
                  {multi && (
                    <span
                      onClick={() => toggle(p.n)}
                      className={cn('h-3.5 w-3.5 cursor-pointer rounded-[3px] border', picks.includes(p.n) ? 'border-brand bg-brand' : 'border-line')}
                    />
                  )}
                  <div onClick={() => setSel(p.n)} className="flex min-w-0 cursor-pointer items-center gap-2">
                    <Avatar name={p.n} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{p.n}</p>
                      <p className="truncate text-[10.5px] text-faint">{p.role} · {p.loc} · {p.cv}</p>
                    </div>
                  </div>
                  <span className="text-muted">{p.exp}</span>
                  <span className="text-muted">{p.salary}</span>
                  <span><Match score={p.match} /></span>
                  <span><Chip tone={STAGE_TONE[p.stage]}>{p.stage}</Chip></span>
                  <span className="text-right tabular-nums text-muted">{p.waiting}</span>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="border-t border-line-soft py-14 text-center">
                  <Inbox className="mx-auto h-6 w-6 text-faint" />
                  <p className="mt-2 text-[13px] font-medium text-ink">No candidates in this stage</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">Move someone here, or clear the stage filter.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── board view — the same stages as columns ── */
          <div className="mt-3 overflow-x-auto">
            <div className="flex gap-2" style={{ minWidth: 1320 }}>
              {cols.map((c) => (
                <StageColumn key={c.stage} col={c} onPick={setSel} />
              ))}
              <span className="grid h-9 w-8 shrink-0 place-items-center rounded-lg border border-dashed border-line text-faint"><Plus className="h-4 w-4" /></span>
              <StageColumn col={hired} terminal onPick={setSel} />
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-faint">
          Every application is screened by Saramin before it reaches you. Change a stage from the row, drag a card between
          columns in board view, or select rows for a bulk move.
        </p>
      </div>

      {/* ── candidate detail — the application record: CV + profile info + stage actions ── */}
      {picked && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/30 px-4 pt-4">
          <div className="flex max-h-[620px] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={picked.n} big />
                <div>
                  <p className="flex items-center gap-2 text-[14px] font-bold text-ink">{picked.n} <Match score={picked.match} /></p>
                  <p className="text-[11px] text-muted">Điều dưỡng viên (Khoa Nội) · applied {picked.applied} · <span className="text-emerald-600">✓ Screened by Saramin</span></p>
                </div>
              </div>
              <span className="cursor-pointer text-faint" onClick={() => setSel(null)}>✕</span>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_210px]">
              {/* left: the FULL CV, rendered in place — no extra click, no separate
                  viewer. A recruiter decides from the document, so the document is
                  what the panel opens on. */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">CV — {picked.cv} (full document)</p>
                  <span className="shrink-0 cursor-pointer text-[11px] font-medium text-brand">⬇ Download PDF</span>
                </div>
                <div className="space-y-3 rounded-lg border border-line bg-canvas/30 p-4">
                  {/* CV header */}
                  <div className="border-b border-line-soft pb-2">
                    <p className="text-[14px] font-bold text-ink">{picked.n}</p>
                    <p className="text-[11.5px] text-muted">{picked.role} · {picked.loc} · {picked.exp}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">✉ hoa.nguyen@email.com · 📞 0901 xxx xxx · 🎂 1998</p>
                  </div>
                  {/* objective */}
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Mục tiêu nghề nghiệp</p>
                    <p className="text-[11px] leading-relaxed text-ink">Tìm vị trí {picked.role.toLowerCase()} tại bệnh viện đa khoa để phát triển chuyên môn chăm sóc nội khoa, hướng tới vai trò điều dưỡng trưởng trong 3–5 năm.</p>
                  </div>
                  {/* experience — full entries with responsibilities */}
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Kinh nghiệm làm việc</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[11.5px] font-semibold text-ink">{picked.role} · BV Nhân dân Gia Định</p>
                        <p className="text-[10.5px] text-faint">03/2023 – nay · Hồ Chí Minh</p>
                        <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-ink/80">
                          <li>Chăm sóc 20–25 bệnh nhân nội khoa mỗi ca, theo dõi sinh hiệu và diễn tiến bệnh.</li>
                          <li>Thực hiện tiêm truyền, lấy mẫu xét nghiệm, chuẩn bị bệnh nhân trước thủ thuật.</li>
                          <li>Ghi chép và bàn giao hồ sơ bệnh án theo quy trình JCI của khoa.</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11.5px] font-semibold text-ink">Điều dưỡng viên · PK Đa khoa Vạn Hạnh</p>
                        <p className="text-[10.5px] text-faint">07/2021 – 02/2023 · Hồ Chí Minh</p>
                        <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-ink/80">
                          <li>Tiếp nhận, phân loại và hướng dẫn bệnh nhân ngoại trú.</li>
                          <li>Hỗ trợ bác sĩ trong khám và tiểu thủ thuật; quản lý vật tư y tế của phòng.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* education */}
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Học vấn</p>
                    <p className="text-[11.5px] font-semibold text-ink">Cử nhân Điều dưỡng · ĐH Y Dược TP.HCM</p>
                    <p className="text-[10.5px] text-faint">2017 – 2021 · GPA 3.2/4.0</p>
                  </div>
                  {/* skills */}
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Kỹ năng</p>
                    <div className="flex flex-wrap gap-1">
                      {['Chăm sóc nội khoa', 'Tiêm truyền', 'Hồ sơ bệnh án', 'Giao tiếp bệnh nhân', 'Sơ cấp cứu', 'Điều dưỡng hậu phẫu'].map((s) => (
                        <Chip key={s}>{s}</Chip>
                      ))}
                    </div>
                  </div>
                  {/* certificates + languages */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Chứng chỉ</p>
                      <p className="text-[11px] text-ink">Chứng chỉ hành nghề điều dưỡng (2021)</p>
                      <p className="text-[11px] text-ink">Hồi sức cấp cứu cơ bản – BLS (2024)</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Ngoại ngữ</p>
                      <p className="text-[11px] text-ink">Tiếng Anh · giao tiếp cơ bản</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* right: application info + actions */}
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Contact</p>
                  <p className="text-[11.5px] text-ink">✉ hoa.nguyen@email.com</p>
                  <p className="text-[11.5px] text-ink">📞 0901 xxx xxx</p>
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Candidate info</p>
                  <p className="text-[11.5px] text-muted">Expected salary: <b className="text-ink">{picked.salary}</b></p>
                  <p className="text-[11.5px] text-muted">Availability: <b className="text-ink">1 month</b></p>
                  <p className="text-[11.5px] text-muted">Location: <b className="text-ink">{picked.loc}</b></p>
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Stage</p>
                  <div className="space-y-1">
                    {(['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'] as const).map((s) => (
                      <label key={s} className={cn('flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]', s === picked.stage ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted')}>{s}</label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Notes (team-visible)</p>
                  <div className="h-14 rounded-md border border-line bg-canvas/40" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
              <Btn onClick={() => setSel(null)}>Close</Btn>
              <Btn primary onClick={() => setSel(null)}>Save</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumeSearchScreen() {
  const [confirming, setConfirming] = useState(false)
  const [viewing, setViewing] = useState(false)
  const cvs = [
    { title: 'Điều dưỡng viên · 4 năm KN', loc: 'Hồ Chí Minh', updated: '2 days ago', unlocked: true, name: 'Nguyễn Thị H.', skills: ['Chăm sóc nội khoa', 'Tiêm truyền', 'Hồ sơ bệnh án'], salary: '12–15 tr', avail: 'Open now' },
    { title: 'Điều dưỡng trưởng · 7 năm KN', loc: 'Hồ Chí Minh', updated: '1 week ago', unlocked: false, skills: ['Quản lý điều dưỡng', 'JCI', 'Đào tạo'], salary: '20–25 tr', avail: '1 month' },
    { title: 'Kỹ thuật viên xét nghiệm · 3 năm', loc: 'Bình Dương', updated: '3 weeks ago', unlocked: false, skills: ['Xét nghiệm huyết học', 'Sinh hóa'], salary: '10–13 tr', avail: 'Open now' },
    { title: 'Bác sĩ đa khoa · 6 năm KN', loc: 'Hồ Chí Minh', updated: '1 month ago', unlocked: false, skills: ['Khám nội tổng quát', 'Cấp cứu'], salary: 'Thỏa thuận', avail: '2 months' },
  ]
  return (
    <div className="relative">
      <PageBar title="Resume search" sub="Find and unlock candidate CVs from Saramin's talent pool." action={<Chip tone="blue">62 / 100 unlocks left</Chip>} />
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 rounded-md border border-line px-3 py-2 text-[12px] text-faint">🔍 "điều dưỡng", skills, title…</div>
        <div className="w-36 rounded-md border border-line px-3 py-2 text-[12px] text-faint">📍 HCMC</div>
        <Btn primary>Search</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><p className="text-[12px] font-bold">Filters</p><span className="cursor-pointer text-[10.5px] text-brand">Clear all</span></div>
          {([
            ['Experience', ['1 – 3 years', '3 – 5 years', '5+ years']],
            ['Location', ['Hồ Chí Minh', 'Hà Nội', 'Bình Dương']],
            ['Industry', ['Healthcare', 'IT – Software', 'Finance']],
            ['Education', ['College', 'Bachelor', 'Master']],
            ['Salary expectation', ['Under 15 tr', '15 – 30 tr', 'Over 30 tr']],
            ['Availability', ['Open now', 'Within 1 month', '2+ months']],
            ['Last updated', ['This week', 'This month', 'Any time']],
          ] as [string, string[]][]).map(([f, opts]) => (
            <div key={f}>
              <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">{f}</p>
              <div className="space-y-1">
                {opts.map((o) => (
                  <label key={o} className="flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="h-3 w-3 shrink-0 rounded-[3px] border border-line" />
                    {o}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] text-muted"><b className="text-ink">248</b> candidates match</p>
            <span className="text-[11px] text-muted">Sort: Best match ▾</span>
          </div>
          <div className="space-y-2.5">
            {cvs.map((cv, i) => (
              <div key={i} className="rounded-lg border border-line p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-[13px]">{cv.unlocked ? '👩‍⚕️' : '🔒'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">{cv.unlocked ? cv.name : '••••••• (unlock to see name & contact)'}</p>
                    <p className="truncate text-[11.5px] text-muted">{cv.title}</p>
                  </div>
                  {cv.unlocked
                    ? <Btn onClick={() => setViewing(true)}>View CV</Btn>
                    : <Btn primary onClick={() => setConfirming(true)}>🔓 Unlock · 1 credit</Btn>}
                </div>
                {/* locked PREVIEW — enough to judge fit, no PII */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[52px]">
                  {cv.skills.map((s) => <Chip key={s}>{s}</Chip>)}
                  <Chip tone="blue">{cv.loc}</Chip>
                  <Chip tone="amber">💰 {cv.salary}</Chip>
                  <Chip tone="green">🟢 {cv.avail}</Chip>
                  <span className="text-[10.5px] text-faint">Updated {cv.updated}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            🔒 The preview shows fit (title, skills, salary, availability) but never PII. Unlocking reveals name + contact + the full CV, spends 1 credit, and is logged. Re-viewing an unlocked CV is free.
          </div>
        </div>
      </div>

      {/* ── unlock confirm — the paid moment, made explicit ── */}
      {confirming && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/30 px-4 pt-16">
          <div className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="p-5 text-center">
              <p className="text-[24px]">🔓</p>
              <p className="mt-1 text-[15px] font-bold text-ink">Unlock this CV?</p>
              <p className="mx-auto mt-1 max-w-xs text-[12px] text-muted">Điều dưỡng trưởng · 7 năm KN · HCMC. You’ll see the candidate’s name, contact details and full CV.</p>
              <div className="mx-auto mt-3 flex max-w-[240px] items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]">
                <span className="text-muted">Cost</span><b className="text-ink">1 credit</b>
              </div>
              <div className="mx-auto mt-1.5 flex max-w-[240px] items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px]">
                <span className="text-muted">Balance after</span><b className="text-ink">61 / 100</b>
              </div>
              <p className="mt-2 text-[10.5px] text-faint">Unlocks are pooled across your team · this unlock is logged · re-viewing is free.</p>
            </div>
            <div className="flex justify-center gap-2 border-t border-line px-4 py-3">
              <Btn onClick={() => setConfirming(false)}>Cancel</Btn>
              <Btn primary onClick={() => { setConfirming(false); setViewing(true) }}>Unlock · 1 credit</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── full CV view — after unlock ── */}
      {viewing && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/30 px-4 pt-4">
          <div className="flex max-h-[560px] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-[15px]">👩‍⚕️</span>
                <div>
                  <p className="flex items-center gap-1.5 text-[14px] font-bold text-ink">Nguyễn Thị Hoa <Chip tone="green">Unlocked</Chip></p>
                  <p className="text-[11px] text-muted">✉ hoa.nguyen@email.com · 📞 0901 234 567 · Hồ Chí Minh</p>
                </div>
              </div>
              <span className="cursor-pointer text-faint" onClick={() => setViewing(false)}>✕</span>
            </div>
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_190px]">
              <div className="rounded-lg border border-line bg-canvas/30 p-4">
                <p className="text-[13px] font-bold text-ink">Nguyễn Thị Hoa</p>
                <p className="mb-2 text-[11px] text-muted">Điều dưỡng viên · 4 yrs · Hồ Chí Minh</p>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Experience</p>
                <p className="text-[11px] text-ink">Điều dưỡng viên · BV Nhân dân Gia Định · 2023–nay</p>
                <p className="mb-2 text-[11px] text-muted">Điều dưỡng viên · PK Đa khoa Vạn Hạnh · 2021–2023</p>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Education</p>
                <p className="mb-2 text-[11px] text-ink">Cử nhân Điều dưỡng · ĐH Y Dược TP.HCM</p>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Skills</p>
                <p className="text-[11px] text-ink">Chăm sóc nội khoa · Tiêm truyền · Hồ sơ bệnh án · Giao tiếp bệnh nhân</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Candidate asks</p>
                  <p className="text-[11.5px] text-muted">Salary: <b className="text-ink">12–15 tr</b></p>
                  <p className="text-[11.5px] text-muted">Availability: <b className="text-ink">Open now</b></p>
                  <p className="text-[11.5px] text-muted">Locations: <b className="text-ink">HCMC</b></p>
                </div>
                <div className="space-y-1.5">
                  <Btn primary className="w-full">⬇ Download CV</Btn>
                  <Btn className="w-full">✉ Contact candidate</Btn>
                  <Btn className="w-full">＋ Add to a job pipeline</Btn>
                </div>
                <p className="text-[10px] text-faint">Unlocked by Linh Trần · 05/08/2026 · from the team pool. Contacting the candidate happens outside Saramin in Phase 1.</p>
              </div>
            </div>
          </div>
        </div>
      )}
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
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Public profile <span className="text-emerald-600">· published</span></p>
              <span className="text-[11px] font-bold text-brand">62% complete</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full w-[62%] rounded-full bg-brand" /></div>
            <p className="mt-1.5 text-[11px] text-faint">Required fields are done. Add photos, benefits and story to rank higher in company search.</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">Basics · required</p>
            <Field label="Display name" req value="Vạn Phát Healthcare" />
            <Field label="Logo · cover image" req value="Uploaded ✓" />
            <Field label="About (vi required · en optional)" req area value="Hệ thống y tế tư nhân hàng đầu HCMC, tuyển dụng điều dưỡng & vận hành…" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Locations" req value="Quận 1, HCMC" />
              <Field label="Founded" value="2011" />
              <Field label="Website" value="vanphat.vn" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-faint">Optional · never blocks publishing</p>
            <Field label="Story blocks (0 / 4)" value="Not added — section hidden on the live page" />
            <Field label="Vision & mission · core values · programmes" value="Not added — card hidden" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Photos (5 / 18)" value="Needs ≥3 ✓" />
              <Field label="Videos (0 / 3)" value="YouTube · Vimeo only" />
            </div>
            <Field label="Benefit categories (4 / 8 filled)" value="Insurance · Salary · Training · Time off" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Headcount history" value="2 yrs — chart hidden, needs 3" />
              <Field label="Leaders (0 / 6)" value="Not added" />
            </div>
            <Field label="CEO · business lines · brands · socials" value="Nguyễn Văn A · Bệnh viện đa khoa · Facebook, LinkedIn" />
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
              <div className="mt-2 grid grid-cols-4 gap-1 rounded-md border border-line py-1.5 text-center">
                {[['Founded', '2011'], ['Size', '200–500'], ['Industry', 'Y tế'], ['Open jobs', '4']].map(([l, v]) => (
                  <div key={l}><p className="text-[9px] text-faint">{l}</p><p className="text-[11px] font-bold">{v}</p></div>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-bold text-ink">Việc làm đang tuyển (4)</p>
              <div className="mt-1.5 space-y-1.5">
                <div className="flex justify-between rounded-md border border-line px-2.5 py-1.5 text-[11px]"><span>Điều dưỡng viên (Khoa Nội)</span><span className="text-faint">HCMC</span></div>
                <div className="flex justify-between rounded-md border border-line px-2.5 py-1.5 text-[11px]"><span>Bác sĩ Đa khoa</span><span className="text-faint">HCMC</span></div>
              </div>
              <p className="mt-3 text-[11px] font-bold text-ink">Về công ty</p>
              <p className="mt-1 text-[11.5px] text-muted">Hệ thống y tế tư nhân hàng đầu HCMC, tuyển dụng điều dưỡng & vận hành.</p>
              <p className="mt-3 text-[11px] font-bold text-ink">Hình ảnh công ty</p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {['', '', ''].map((_, i) => <div key={i} className="h-10 rounded-md bg-line/70" />)}
              </div>
              <p className="mt-3 text-[11px] font-bold text-ink">Phúc lợi</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {['Bảo hiểm', 'Lương thưởng', 'Đào tạo', 'Nghỉ phép'].map((b) => (
                  <span key={b} className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-muted">{b}</span>
                ))}
              </div>
              <p className="mt-3 text-[10.5px] italic text-faint">Story, video, growth chart and leaders are empty → those sections do not render.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-brand">🔗 Same company record as CRM & Admin — one source of truth. Resume-Search-only customers don't get this page.</div>
    </div>
  )
}

/* ── Roles = built from a short permission set, then assigned to users ─────────
   The VietnamWorks "build a role, then set users" flow, trimmed to 7 permissions
   across the 3 modules. Prerequisites auto-include so a role can never be invalid.
   "Manage users & roles" is NOT a tickable permission — it lives on Admin only. */
type PermKey = 'jobs.view' | 'jobs.post' | 'jobs.edit' | 'apps.view' | 'apps.move' | 'resume.search' | 'resume.unlock'
const PERM_GROUPS: { module: string; perms: { key: PermKey; label: string; needs?: PermKey }[] }[] = [
  { module: 'Job posts', perms: [
    { key: 'jobs.view', label: 'View jobs' },
    { key: 'jobs.post', label: 'Post jobs', needs: 'jobs.view' },
    { key: 'jobs.edit', label: 'Edit jobs', needs: 'jobs.view' },
  ] },
  { module: 'Applications', perms: [
    { key: 'apps.view', label: 'View applications & CVs' },
    { key: 'apps.move', label: 'Manage applications', needs: 'apps.view' },
  ] },
  { module: 'Resume search', perms: [
    { key: 'resume.search', label: 'Search resumes' },
    { key: 'resume.unlock', label: 'View / unlock resume detail', needs: 'resume.search' },
  ] },
]
const ALL_PERMS: PermKey[] = PERM_GROUPS.flatMap((g) => g.perms.map((p) => p.key))
const NEEDS: Partial<Record<PermKey, PermKey>> = Object.fromEntries(
  PERM_GROUPS.flatMap((g) => g.perms.filter((p) => p.needs).map((p) => [p.key, p.needs])),
) as Partial<Record<PermKey, PermKey>>

/* Admin is the one fixed, highest role (all access + manage users) and cannot be
   edited. EVERY other role is a custom role the Admin builds and can edit. */
type CoRole = { name: string; admin?: boolean; perms: PermKey[] }
const DEFAULT_ROLES: CoRole[] = [
  { name: 'Admin', admin: true, perms: ALL_PERMS },
  { name: 'Recruiter', perms: [...ALL_PERMS] },
  { name: 'Viewer', perms: ['jobs.view', 'apps.view'] },
]

/* Toggle a permission with prerequisite closure: turning one ON pulls in what it
   needs; turning one OFF drops anything that needed it. A role is never broken. */
function togglePerm(perms: PermKey[], key: PermKey): PermKey[] {
  const has = perms.includes(key)
  if (!has) {
    const next = new Set(perms)
    let k: PermKey | undefined = key
    while (k) { next.add(k); k = NEEDS[k] }
    return ALL_PERMS.filter((p) => next.has(p))
  }
  const drop = new Set<PermKey>([key])
  let changed = true
  while (changed) {
    changed = false
    for (const p of ALL_PERMS) {
      const n = NEEDS[p]
      if (n && drop.has(n) && !drop.has(p)) { drop.add(p); changed = true }
    }
  }
  return perms.filter((p) => !drop.has(p))
}

function RolesScreen() {
  const [roles, setRoles] = useState<CoRole[]>(DEFAULT_ROLES)
  const [sel, setSel] = useState(1)
  const role = roles[sel]
  const editable = !role.admin
  const setPerms = (perms: PermKey[]) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, perms } : r)))
  const addRole = () => { setRoles((rs) => [...rs, { name: `New role ${rs.length}`, perms: ['jobs.view'] }]); setSel(roles.length) }
  return (
    <div>
      <PageBar title="Roles" sub="Build a role from a short set of permissions, then assign it to users." />
      <div className="grid max-w-[880px] gap-4 md:grid-cols-[220px_1fr]">
        {/* roles list */}
        <div className="rounded-xl border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[12px] font-bold">Roles</p>
            <button onClick={addRole} className="text-[11px] font-medium text-brand">+ Add role</button>
          </div>
          <div className="space-y-1">
            {roles.map((r, i) => (
              <button key={r.name} onClick={() => setSel(i)} className={cn('flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left', i === sel ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-brand/40')}>
                <span className="text-[12px] font-medium text-ink">{r.name}</span>
                {r.admin && <Chip tone="blue">🔒 Super admin</Chip>}
              </button>
            ))}
          </div>
        </div>
        {/* permission builder */}
        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <input value={role.name} readOnly={!editable} onChange={(e) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, name: e.target.value } : r)))} className={cn('min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-[13px] font-semibold text-ink', editable ? 'border-line' : 'border-transparent bg-transparent')} />
            {role.admin && <span className="shrink-0 text-[11px] text-faint">🔒 Super admin · full access, can’t be edited</span>}
          </div>
          {PERM_GROUPS.map((g) => (
            <div key={g.module} className="mb-2.5 border-t border-line-soft pt-2.5 first:border-0 first:pt-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">{g.module}</p>
              <div className="space-y-1">
                {g.perms.map((p) => {
                  const on = role.perms.includes(p.key)
                  const locked = on && ALL_PERMS.some((q) => NEEDS[q] === p.key && role.perms.includes(q))
                  const disabled = !editable || locked
                  return (
                    <label key={p.key} className={cn('flex items-center gap-2.5 rounded-md px-2 py-1.5', disabled ? 'opacity-90' : 'cursor-pointer hover:bg-canvas')}>
                      <input type="checkbox" checked={on} disabled={disabled} onChange={() => editable && setPerms(togglePerm(role.perms, p.key))} className="h-3.5 w-3.5 accent-brand" />
                      <span className="text-[12px] text-ink">{p.label}</span>
                      {p.needs && on && <span className="text-[10px] text-faint">(needs {PERM_GROUPS.flatMap((x) => x.perms).find((x) => x.key === p.needs)!.label})</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
          <p className="mt-3 text-[10.5px] leading-relaxed text-faint">Ticking a higher action auto-includes (and locks) its prerequisite, so a role is never invalid. Admin is the one fixed role — every other role is custom and editable.</p>
        </div>
      </div>
    </div>
  )
}

function TeamScreen() {
  const go = useCoNav()
  const team = [
    { name: 'Vũ Thanh Linh', email: 'linh@vanphat.vn', role: 'Admin', status: 'Active' },
    { name: 'Đỗ Thị Mai', email: 'mai@vanphat.vn', role: 'Recruiter', status: 'Active' },
    { name: 'Ngô Văn Sơn', email: 'son@vanphat.vn', role: 'Viewer', status: 'Invited' },
  ] as const
  return (
    <div>
      <PageBar title="Team" sub="The people who can log in for your company." />
      <div className="max-w-[820px] rounded-xl border border-line p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] font-bold">Users</p>
          <div className="flex items-center gap-2"><span className="text-[11px] text-faint">3 / 4 seats</span><Btn primary>+ Invite user</Btn></div>
        </div>
        {/* column captions so ROLE and STATUS read as two different things */}
        <div className="mb-1 flex items-center gap-3 px-3 text-[9.5px] font-semibold uppercase tracking-wide text-faint">
          <span className="flex-1">User</span>
          <span className="w-[120px]">Role</span>
          <span className="w-[84px]">Status</span>
          <span className="w-[180px] text-right">Actions</span>
        </div>
        <div className="space-y-1.5">
          {team.map((u) => {
            const admin = u.role === 'Admin'
            const active = u.status === 'Active'
            return (
              <div key={u.email} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink">{u.name}</p>
                  <p className="truncate font-mono text-[10.5px] text-faint">{u.email}</p>
                </div>
                {/* ROLE — a bordered pill with an icon; clearly an assignment, not a state */}
                <span className={cn('inline-flex w-[120px] items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium', admin ? 'border-brand/40 bg-brand-soft/50 text-brand' : 'border-line text-ink/75')}>
                  {admin ? <Crown className="h-3 w-3 shrink-0" /> : <Shield className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{u.role}</span>
                </span>
                {/* STATUS — a coloured dot + label; clearly a state, not a role */}
                <span className="inline-flex w-[84px] items-center gap-1.5 text-[11px] font-medium">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', active ? 'bg-emerald-500' : 'bg-amber-500')} />
                  <span className={active ? 'text-emerald-700' : 'text-amber-700'}>{u.status}</span>
                </span>
                {/* ACTIONS — deactivate an Active user; resend / cancel an Invite */}
                <div className="flex w-[180px] shrink-0 items-center justify-end gap-1.5">
                  {u.status === 'Invited' ? (
                    <>
                      <button className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-brand hover:bg-canvas">Resend</button>
                      <button className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">Cancel invitation</button>
                    </>
                  ) : admin ? (
                    <span className="text-[10.5px] text-faint">Super admin · can’t deactivate</span>
                  ) : (
                    <button className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50">Deactivate</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-faint">Invite by email and pick a role. Every account keeps at least one Admin (its login can’t be deactivated). All users share the account’s pooled quota.</p>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span className="text-faint">Roles are built on the</span>
          <button onClick={() => go('co-roles')} className="font-medium text-brand">Roles screen →</button>
        </div>
      </div>
    </div>
  )
}

function ProductsQuotaScreen() {
  const go = useCoNav()
  return (
    <div>
      <PageBar title="Products & quota" sub="What you bought and how much is left." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] font-bold">📢 Job Posting — Pro</p>
            <Chip tone="green">Active</Chip>
          </div>
          <div className="flex justify-between text-[11.5px]"><span className="text-muted">Posting slots left</span><b className="tabular-nums">7 / 10</b></div>
          <Bar pct={70} />
          <p className="mt-2 text-[10.5px] text-faint">One slot is spent each time a job goes Open. Valid until 31/12/2026.</p>
          <div className="mt-3 flex gap-2"><Btn primary onClick={() => go('co-post-job')}>+ Post a job</Btn><Btn>Buy more slots</Btn></div>
        </div>
        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] font-bold">🔍 Resume Search — 6 months</p>
            <Chip tone="green">Active</Chip>
          </div>
          <div className="flex justify-between text-[11.5px]"><span className="text-muted">CV unlocks left</span><b className="tabular-nums">62 / 100</b></div>
          <Bar pct={62} />
          <p className="mt-2 text-[10.5px] text-faint">One unlock reveals a candidate's full CV + contact. Valid until 31/12/2026.</p>
          <div className="mt-3 flex gap-2"><Btn primary onClick={() => go('co-resume-search')}>Search resumes</Btn><Btn>Buy more unlocks</Btn></div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Quota is shared by everyone on your team. Products appear here automatically once Saramin confirms your payment — you never pick them by hand.
      </p>

      {/* ── usage history — every spend, who and what, so quota is never a mystery ── */}
      <div className="mt-4 rounded-xl border border-line p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] font-bold">Usage history</p>
          <div className="flex gap-1.5">
            {['All', 'Posting slots', 'CV unlocks'].map((f, i) => (
              <span key={f} className={cn('cursor-pointer rounded-full border px-2.5 py-1 text-[10.5px] font-medium', i === 0 ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted')}>{f}</span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-line-soft">
          {([
            ['🔓', 'CV unlock — Nguyễn Thị Hoa (Điều dưỡng viên)', 'Linh Trần', '05/08/2026', '−1 unlock · 62 left'],
            ['📢', 'Job opened — Điều dưỡng viên (Khoa Nội)', 'Minh Phạm', '01/08/2026', '−1 slot · 7 left'],
            ['🔓', 'CV unlock — Trần Văn B. (Kỹ thuật viên XN)', 'Linh Trần', '29/07/2026', '−1 unlock · 63 left'],
            ['📢', 'Job opened — Bác sĩ Đa khoa', 'Minh Phạm', '25/07/2026', '−1 slot · 8 left'],
            ['↩', 'Slot returned — job "Kế toán viện phí" closed early (policy)', 'System', '20/07/2026', '+1 slot · 9 left'],
          ] as [string, string, string, string, string][]).map(([ic, what, who, when, delta]) => (
            <div key={what} className="flex items-center gap-3 py-2 text-[11.5px]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-canvas text-[12px]">{ic}</span>
              <span className="min-w-0 flex-1 truncate text-ink/80">{what}</span>
              <span className="shrink-0 text-muted">{who}</span>
              <span className="shrink-0 tabular-nums text-faint">{when}</span>
              <span className="shrink-0 font-medium tabular-nums text-ink">{delta}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] text-faint">Every spend is attributed to the team member who made it. Slot-return rules are set by Saramin policy.</p>
      </div>
    </div>
  )
}

function OrdersInvoicesScreen() {
  const orders = [
    ['ORD-5521', 'Recruit Growth (Job Posting Pro + Resume Search)', '37,800,000 ₫', 'Paid', 'green', '26/05/2026'],
    ['ORD-5498', 'Job Posting — Pro', '15,000,000 ₫', 'Paid', 'green', '12/01/2026'],
    ['ORD-5602', 'Resume Search — top-up 50 unlocks', '9,000,000 ₫', 'Pending payment', 'amber', '24/07/2026'],
  ] as const
  return (
    <div>
      <PageBar title="Orders & invoices" sub="Your purchase history and VAT e-invoices." />
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[0.9fr_2fr_1fr_1fr_0.9fr] bg-canvas/60 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
          <span>Order</span><span>Items</span><span className="text-right">Amount</span><span>Status</span><span className="text-right">Invoice</span>
        </div>
        {orders.map(([id, items, amount, status, tone, date]) => (
          <div key={id} className="grid grid-cols-[0.9fr_2fr_1fr_1fr_0.9fr] items-center border-t border-line-soft px-4 py-2.5 text-[12px]">
            <div className="min-w-0"><p className="truncate font-medium text-ink">{id}</p><p className="text-[10.5px] text-faint">{date}</p></div>
            <span className="truncate pr-2 text-muted">{items}</span>
            <span className="text-right tabular-nums text-ink/80">{amount}</span>
            <span><Chip tone={tone as 'green' | 'amber'}>{status}</Chip></span>
            <span className="text-right text-[11.5px] text-brand">{status === 'Paid' ? 'Download ↓' : '—'}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Saramin issues the VAT e-invoice after payment is confirmed; the products are provisioned at the same moment.
      </p>
    </div>
  )
}

/* ── navigation model ────────────────────────────────────────────────────── */
interface NavItem {
  id: string
  label: string
  Comp: () => JSX.Element
  /** screen brings its own padding (it owns the full width, rail included) */
  flush?: boolean
}
interface NavGroup {
  label: string
  items: NavItem[]
  /** parked behind the "⋯" overflow button, as Saramin KR does with the tail of its nav */
  overflow?: boolean
}

const DASHBOARD: NavItem = { id: 'co-dashboard', label: 'Home', Comp: DashboardScreen }
const POST_JOB: NavItem = { id: 'co-post-job', label: 'Post a job', Comp: PostJobScreen }
/* Top-level nav, in Saramin KR's employer order: Home · Jobs · Talent pool ·
   Candidates · Hiring products · ⋯, with the blue "Post a job" CTA on the end.
   Each entry opens a small dropdown of its screens. */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Jobs',
    items: [
      { id: 'co-jobs', label: 'My jobs', Comp: MyJobsScreen },
      POST_JOB,
    ],
  },
  {
    label: 'Talent pool',
    items: [{ id: 'co-resume-search', label: 'Resume search', Comp: ResumeSearchScreen }],
  },
  {
    label: 'Candidates',
    items: [{ id: 'co-applicants', label: 'Applicants', Comp: ApplicantsScreen, flush: true }],
  },
  {
    // What the company bought is its own concern, separate from who can log in.
    label: 'Hiring products',
    items: [
      { id: 'co-products', label: 'Products & quota', Comp: ProductsQuotaScreen },
      { id: 'co-orders', label: 'Orders & invoices', Comp: OrdersInvoicesScreen },
    ],
  },
  {
    label: 'Account',
    overflow: true,
    items: [
      { id: 'co-company-page', label: 'Company page', Comp: CompanyPageScreen },
      { id: 'co-team', label: 'Team', Comp: TeamScreen },
      { id: 'co-roles', label: 'Roles', Comp: RolesScreen },
    ],
  },
]

/** flat registry of company screens, for embedding in feature detail pages */
export const CO_SCREENS: NavItem[] = [DASHBOARD, ...NAV_GROUPS.flatMap((g) => g.items)]

export function CompanyMockups() {
  const [active, setActive] = useState<CoActive>({ group: 'Home', item: DASHBOARD })
  const Body = active.item.Comp

  /** jump to a screen by id (used by in-screen buttons like "+ Post a job") */
  const go = (id: string) => {
    if (id === DASHBOARD.id) return setActive({ group: 'Home', item: DASHBOARD })
    for (const g of NAV_GROUPS) {
      const item = g.items.find((i) => i.id === id)
      if (item) return setActive({ group: g.label, item })
    }
  }

  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">Company mockups</h1>
      </div>

      {/* console shell — the chrome follows Saramin KR's employer site (hiring.saramin.co.kr):
          a thin utility strip, then one horizontal nav with dropdowns and a blue CTA. */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        {/* utility strip */}
        <div className="flex items-center gap-4 border-b border-line-soft px-5 py-1.5 text-[11px] text-muted">
          {UTILITY_LINKS.map((l, i) => (
            <span key={l} className={cn('cursor-default', i === 0 && 'font-semibold text-ink/80')}>{l}</span>
          ))}
          <span className="ml-auto hidden sm:inline">📢 7/10 slots · 🔍 62 CVs</span>
        </div>

        {/* main header */}
        <CoHeader active={active} onSelect={setActive} />

        {/* content */}
        <div className={cn('min-w-0 bg-surface', !active.item.flush && 'p-5')}>
          <CoNav.Provider value={go}>
            <Body />
          </CoNav.Provider>
        </div>
      </div>

      <p className="mt-4 max-w-[72ch] text-[12px] leading-relaxed text-faint">
        This is the company's own console — created by Sales in the CRM, then activated. Everything here draws on
        the same company record and pooled quota shown in the Admin &amp; CRM mockups.
      </p>
    </div>
  )
}

/** The grey strip above the header on Saramin KR — sibling properties, not app nav. */
const UTILITY_LINKS = ['Business home', 'Career site', 'Hiring tools', 'Consulting', 'Sales', 'Ads']

type CoActive = { group: string; item: NavItem }

function CoHeader({ active, onSelect }: { active: CoActive; onSelect: (a: CoActive) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const pick = (group: string, item: NavItem) => {
    onSelect({ group, item })
    setOpen(null)
  }
  return (
    <div className="relative flex items-center gap-1 border-b border-line px-5 py-2.5">
      <span className="mr-4 text-[19px] font-bold lowercase tracking-tight text-brand">saramin</span>

      <NavTop label="Home" active={active.item.id === DASHBOARD.id} onClick={() => pick('Home', DASHBOARD)} />
      {NAV_GROUPS.filter((g) => !g.overflow).map((g) => (
        <NavMenu
          key={g.label}
          group={g}
          activeId={active.item.id}
          open={open === g.label}
          onToggle={() => setOpen((o) => (o === g.label ? null : g.label))}
          onPick={(item) => pick(g.label, item)}
        />
      ))}
      {NAV_GROUPS.filter((g) => g.overflow).map((g) => (
        <NavMenu
          key={g.label}
          group={g}
          activeId={active.item.id}
          open={open === g.label}
          onToggle={() => setOpen((o) => (o === g.label ? null : g.label))}
          onPick={(item) => pick(g.label, item)}
          icon={<MoreHorizontal className="h-4 w-4" />}
        />
      ))}

      <span
        onClick={() => pick('Jobs', POST_JOB)}
        className="ml-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
        Post a job
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span className="relative text-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500 text-[8px] font-bold text-white">1</span>
        </span>
        <span className="hidden items-center gap-1.5 text-[12px] md:flex">
          <Building2 className="h-4 w-4 text-faint" />
          <span className="text-ink/80">Vạn Phát Healthcare</span>
          <span className="text-line">|</span>
          <span className="font-medium text-ink">Trần Thị Mai</span>
          <ChevronDown className="h-3 w-3 text-faint" />
        </span>
      </div>
    </div>
  )
}

/** A nav entry with no dropdown (Home). */
function NavTop({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-md px-2.5 py-1.5 text-[13.5px] font-semibold', active ? 'text-brand' : 'text-ink/80 hover:text-brand')}
    >
      {label}
    </button>
  )
}

/** A nav entry that drops its screens down, the way the KR header's ▾ items do. */
function NavMenu({
  group,
  activeId,
  open,
  onToggle,
  onPick,
  icon,
}: {
  group: NavGroup
  activeId: string
  open: boolean
  onToggle: () => void
  onPick: (item: NavItem) => void
  icon?: React.ReactNode
}) {
  const owns = group.items.some((i) => i.id === activeId)
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13.5px] font-semibold',
          owns ? 'text-brand' : 'text-ink/80 hover:text-brand',
        )}
      >
        {icon ?? (
          <>
            {group.label}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>
      {open && (
        <ul className="absolute left-0 top-full z-20 mt-1 min-w-[176px] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
          {group.items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => onPick(it)}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-left text-[12.5px]',
                  it.id === activeId ? 'bg-brand-soft font-medium text-brand' : 'text-ink/80 hover:bg-canvas/70',
                )}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
