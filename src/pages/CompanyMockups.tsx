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
import { createContext, Fragment, useContext, useState } from 'react'
import {
  Search,
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
  User,
  Users,
} from 'lucide-react'
import { Btn, Chip } from '@/components/wire'
import { CopyLinkButton, initialScreenParam, useScreenParam } from '@/components/ShareLink'
import { AdminJobCreate } from './adminPrototypes'
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
        <div className="ml-auto flex gap-1.5"><Chip tone="blue">Job Posting</Chip><Chip tone="blue">Resume Search</Chip></div>
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
                <span className="grid h-7 w-7 place-items-center rounded-full bg-canvas text-[11px]"></span>
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
              <div className="flex justify-between text-[11.5px]"><span>Job posting slots</span><b className="tabular-nums">7/10</b></div>
              <Bar pct={70} />
            </div>
            <div>
              <div className="flex justify-between text-[11.5px]"><span>Resume CV unlocks</span><b className="tabular-nums">62/100</b></div>
              <Bar pct={62} />
            </div>
            <p className="mt-2 text-[10.5px] text-faint">Shared across your team · valid until 31/12/2026.</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12.5px] font-bold">Quick actions</p>
            <div className="flex flex-col gap-2">
              <Btn primary onClick={() => go('co-post-job')}>+ Post a job</Btn>
              <Btn onClick={() => go('co-resume-search')}>Search resumes</Btn>
              <Btn onClick={() => go('co-company-page')}>✎ Edit company page</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PostJobScreen() {
  const go = useCoNav()
  /* THE SAME create-job form the Admin console uses — the component itself, not a
     copy of it. Two hand-maintained versions of a 40-field form drift within a
     sprint, and a field that exists on only one surface is invisible until an
     employer cannot enter something HQ can.

     `surface="company"` drops the two Admin-only parts: the company picker (an
     employer is already scoped to their own company) and the free tier, because
     an employer can never post a free job — a PO is their only route to a
     product. */
  return (
    <div>
      <PageBar
        title="Post a job"
        sub="Uses 1 of your 10 posting slots · goes live immediately — no approval wait."
        action={
          <div className="flex gap-2">
            <Btn onClick={() => go('co-jobs')}>Save draft</Btn>
            <Btn primary onClick={() => go('co-jobs')}>Publish</Btn>
          </div>
        }
      />
      <div className="px-5 py-4">
        <AdminJobCreate surface="company" onBack={() => go('co-jobs')} />
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
    to open first, so the column order stops being just "who applied last".
    NEVER a bare percentage: the chip always carries the two highest-CONTRIBUTING
    signals beside it. A recruiter deciding who to call needs to know what the
    number is made of, and a score with no reasons claims an authority the model
    does not have. Same rule as the jobseeker side — see Resume management →
    "MATCH SCORE — what each side actually sees". */
function Match({ score, why }: { score: number; why: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <Chip tone={score >= 80 ? 'green' : score >= 60 ? 'amber' : 'muted'}>{score}% match</Chip>
      <span className="truncate text-[10px] text-faint">{why}</span>
    </span>
  )
}

type CoCandidate = {
  n: string
  role: string
  exp: string
  loc: string
  match: number
  /** the two highest-CONTRIBUTING signals behind `match` — the chip never shows alone */
  why: string
  applied: string
  salary: string
  cv: string
  /** days since the last stage move — the "who is waiting on me" pressure signal */
  waiting: string
  /** set when SARAMIN pulled the CV back after sending it — the date it happened.
      The row stays in the pipeline; see the recall banner in the detail panel. */
  recalled?: string
  /** Why it was withdrawn, in the employer's words. Safe to show now that the
      three reject reasons describe the DOCUMENT (unreadable · not a CV · too
      thin) rather than the person — the account-level judgements moved to Block
      user, and those are still never surfaced here. */
  recallReason?: string
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

/** Every stage a candidate can be moved to — the five customisable ones plus the
    terminal Hired. The detail panel's stage dropdown offers exactly these. */
const ALL_STAGES = ['New', 'Screening', 'Interview', 'Offer', 'Rejected', 'Hired'] as const

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
              <p className="truncate">{p.exp} · {p.loc}</p>
              <p className="truncate">Mong muốn {p.salary}</p>
              <p className="truncate">{p.cv}</p>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1">
              <Match score={p.match} why={p.why} />
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
  /** the stage picked in the detail panel's dropdown — null = whatever the candidate is in */
  const [stageSel, setStageSel] = useState<string | null>(null)
  const [stageOpen, setStageOpen] = useState(false)
  const [view, setView] = useState<'list' | 'board'>('list')
  /** null = every stage. Clicking a stage header filters the list to it. */
  const [stage, setStage] = useState<string | null>(null)
  const [multi, setMulti] = useState(false)
  const [picks, setPicks] = useState<string[]>([])
  const cols: CoStageCol[] = [
    {
      stage: 'New',
      people: [
        { n: 'Nguyễn Thị Hoa', role: 'Điều dưỡng viên', exp: '3 năm KN', loc: 'Hồ Chí Minh', match: 88, why: '9/10 kỹ năng · 3 năm hợp 2–5', applied: '2 ngày trước', salary: '12–15 tr', cv: 'Saramin CV', waiting: '2 days' },
        { n: 'Phạm Thu Trang', role: 'Điều dưỡng viên', exp: '1 năm KN', loc: 'Bình Dương', match: 64, why: '5/10 kỹ năng · lương hợp', applied: '3 ngày trước', salary: '9–11 tr', cv: 'PDF tải lên', waiting: '3 days' },
        /* RECALLED BY SARAMIN. The row deliberately stays in the pipeline: the
           recruiter may already have read this CV or phoned the candidate, and a
           row that vanishes silently is worse than one that explains itself. It
           is greyed and chipped instead, and the detail panel says who removed it
           and what to do. */
        { n: 'Ngô Bảo Khánh', role: 'Sales Staff', exp: '1 năm KN', loc: 'Cần Thơ', match: 38, why: '2/10 kỹ năng', applied: '4 ngày trước', salary: '8–12 tr', cv: 'PDF tải lên', waiting: '4 days', recalled: '20/08/2026', recallReason: 'File này không phải một CV.' },
      ],
    },
    { stage: 'Screening', people: [{ n: 'Trần Văn Bình', role: 'Điều dưỡng viên', exp: '5 năm KN', loc: 'Hồ Chí Minh', match: 81, why: '8/10 kỹ năng · Hồ Chí Minh', applied: '5 ngày trước', salary: '15–18 tr', cv: 'Saramin CV', waiting: '4 days' }] },
    { stage: 'Interview', people: [{ n: 'Lê Thị Cúc', role: 'Điều dưỡng viên', exp: '4 năm KN', loc: 'Hồ Chí Minh', match: 76, why: '7/10 kỹ năng · Hồ Chí Minh', applied: '1 tuần trước', salary: '13–16 tr', cv: 'Saramin CV', waiting: '6 days' }] },
    { stage: 'Offer', people: [{ n: 'Võ Minh Anh', role: 'Điều dưỡng trưởng', exp: '6 năm KN', loc: 'Hồ Chí Minh', match: 92, why: '10/10 kỹ năng · 6 năm hợp 2–5', applied: '2 tuần trước', salary: '18–22 tr', cv: 'Saramin CV', waiting: '1 day' }] },
    { stage: 'Rejected', people: [{ n: 'Đỗ Văn Khoa', role: 'Kỹ thuật viên xét nghiệm', exp: '2 năm KN', loc: 'Đồng Nai', match: 41, why: '3/10 kỹ năng · Đồng Nai', applied: '2 tuần trước', salary: '10–12 tr', cv: 'PDF tải lên', waiting: '9 days' }] },
  ]
  /* The terminal stage, pinned past the "+": every company has it and no company
     can rename or remove it, so it is not part of `cols`. */
  const hired: CoStageCol = { stage: 'Hired', people: [] }
  // one flat list, so the table and the detail both read from the same rows
  const flat = [...cols, hired].flatMap((c) => c.people.map((p) => ({ ...p, stage: c.stage })))
  const rows = stage ? flat.filter((p) => p.stage === stage) : flat
  const picked = flat.find((p) => p.n === sel)
  const toggle = (n: string) => setPicks((ps) => (ps.includes(n) ? ps.filter((x) => x !== n) : [...ps, n]))
  /** open a candidate — the stage dropdown resets to whatever THAT candidate is in */
  const open = (n: string | null) => {
    setSel(n)
    setStageSel(null)
    setStageOpen(false)
  }

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
          <Pill tone="green" icon={<Users className="h-3.5 w-3.5" />}>2 new this week</Pill>
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
                  <div onClick={() => open(p.n)} className="flex min-w-0 cursor-pointer items-center gap-2">
                    <Avatar name={p.n} />
                    <div className="min-w-0">
                      <p className={cn('truncate font-medium', p.recalled ? 'text-muted line-through' : 'text-ink')}>{p.n}</p>
                      <p className="truncate text-[10.5px] text-faint">{p.role} · {p.loc}</p>
                    </div>
                  </div>
                  <span className="text-muted">{p.exp}</span>
                  <span className="text-muted">{p.salary}</span>
                  {/* A recalled row shows no match score: it is not a candidate to
                      compare any more, and leaving the number invites comparison. */}
                  <span>{p.recalled ? <span className="text-[11px] text-faint">—</span> : <Match score={p.match} why={p.why} />}</span>
                  <span>{p.recalled ? <Chip tone="rose">Đã thu hồi</Chip> : <Chip tone={STAGE_TONE[p.stage]}>{p.stage}</Chip>}</span>
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
                <StageColumn key={c.stage} col={c} onPick={open} />
              ))}
              <span className="grid h-9 w-8 shrink-0 place-items-center rounded-lg border border-dashed border-line text-faint"><Plus className="h-4 w-4" /></span>
              <StageColumn col={hired} terminal onPick={open} />
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-faint">
          Change a stage from the row, drag a card between columns in board view, or select rows for a bulk move.
          Every stage change is logged with who moved it and when.
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
                  <p className="flex items-center gap-2 text-[14px] font-bold text-ink">{picked.n} <Match score={picked.match} why={picked.why} /></p>
                  {/* No job title here — the panel opens from inside that job's pipeline,
                      which already names it above. */}
                  <p className="text-[11px] text-muted">Applied {picked.applied} · in {picked.stage} for {picked.waiting}</p>
                </div>
              </div>
              <span className="cursor-pointer text-faint" onClick={() => open(null)}>✕</span>
            </div>
            {/* RECALL NOTICE — first thing in the panel, above the CV, because the
                recruiter must know before they read another line. It names SARAMIN
                as the actor: "the candidate withdrew" would be a lie, and hiding
                that we sent something we had not finished checking costs trust
                exactly once. It does NOT carry the internal reason code — "hồ sơ
                giả" is an accusation about a real person, and that code exists for
                us to count, not for an employer to read. */}
            {picked.recalled && (
              <div className="border-b border-rose-200 bg-rose-50 px-4 py-3">
                <p className="flex items-center gap-2 text-[12.5px] font-bold text-rose-700">
                  <span></span> Saramin đã thu hồi CV này
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-rose-900/80">
                  Lý do: <b className="font-semibold">{picked.recallReason}</b>{' '}
                  <b className="font-semibold">Bạn không cần xử lý ứng viên này.</b>
                </p>
                <p className="mt-1 text-[10.5px] text-rose-900/60">
                  Thu hồi ngày {picked.recalled} · Nếu bạn đã liên hệ ứng viên, có thể bỏ qua
                </p>
              </div>
            )}
            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_244px]">
              {/* left: the FULL CV, rendered in place — no extra click, no separate
                  viewer. A recruiter decides from the document, so the document is
                  what the panel opens on. */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">CV — {picked.cv} (full document)</p>
                  {/* Download disappears on a recalled CV. Leaving it would let the
                      recruiter keep a copy of a document we have just told them to
                      ignore, which makes the recall decorative. */}
                  {!picked.recalled && <span className="shrink-0 cursor-pointer text-[11px] font-medium text-brand">Download CV</span>}
                </div>
                <div className={cn('space-y-3 rounded-lg border border-line bg-canvas/30 p-4', picked.recalled && 'pointer-events-none select-none opacity-40 blur-[2px]')}>
                  {/* CV header */}
                  <div className="border-b border-line-soft pb-2">
                    <p className="text-[14px] font-bold text-ink">{picked.n}</p>
                    <p className="text-[11.5px] text-muted">{picked.role} · {picked.loc} · {picked.exp}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">hoa.nguyen@email.com · 0901 xxx xxx · 1998</p>
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
              {/* right: the candidate's PROFILE, in the same two groups the jobseeker
                  filled in — Basic information · Work preference — then the one status
                  this screen owns. Same grouping as My CVs, so employer and candidate
                  are looking at the same record described the same way. */}
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Basic information</p>
                  {([
                    ['Email', 'hoa.nguyen@email.com'],
                    ['Phone', '0901 xxx xxx'],
                    ['Province / city', picked.loc],
                    ['Highest education', 'Cử nhân'],
                    ['Years of experience', picked.exp],
                  ] as [string, string][]).map(([k, v]) => (
                    <p key={k} className="text-[11.5px] text-muted">{k}: <b className="font-medium text-ink">{v}</b></p>
                  ))}
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Work preference</p>
                  {([
                    ['Desired position', picked.role],
                    ['Job category', 'Y tế / Chăm sóc sức khỏe'],
                    ['Industry', 'Bệnh viện · Phòng khám'],
                    ['Work location', picked.loc],
                    ['Expected salary', picked.salary],
                    ['Availability', '1 month'],
                  ] as [string, string][]).map(([k, v]) => (
                    <p key={k} className="text-[11.5px] text-muted">{k}: <b className="font-medium text-ink">{v}</b></p>
                  ))}
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Stage</p>
                  {/* ONE field, not six rows: the stage is a single value, and the list of
                      six read like six separate toggles. Also the only editable status here. */}
                  <div className="relative">
                    <span
                      onClick={() => setStageOpen((o) => !o)}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-medium text-ink"
                    >
                      {stageSel ?? picked.stage}
                      <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-faint transition-transform', stageOpen && 'rotate-180')} />
                    </span>
                    {stageOpen && (
                      <ul className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-lg">
                        {ALL_STAGES.map((s) => (
                          <li key={s}>
                            <span
                              onClick={() => {
                                setStageSel(s)
                                setStageOpen(false)
                              }}
                              className={cn(
                                'block cursor-pointer px-2.5 py-1 text-[11.5px]',
                                s === (stageSel ?? picked.stage) ? 'bg-brand-soft font-medium text-brand' : 'text-ink/80 hover:bg-canvas/70',
                              )}
                            >
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Notes (team-visible)</p>
                  <div className="h-14 rounded-md border border-line bg-canvas/40" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
              <Btn onClick={() => open(null)}>Close</Btn>
              <Btn primary onClick={() => open(null)}>Save</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* One labelled block inside a resume-search row ("Latest company", "Latest
   education"). The label sits above the value so a row reads as a small record a
   recruiter can scan down, not as a run-on sentence. */
function CvBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <div className="mt-0.5 text-[11.5px] leading-[1.45] text-ink">{children}</div>
    </div>
  )
}

/*
 * The resume-search filter panel for the query "điều dưỡng" over 248 results.
 *
 * A WIDE PANEL ABOVE THE RESULTS, not a left rail: every field is a dropdown, and
 * a dropdown in a 200px rail is unreadable. The results list takes the full width
 * underneath, which the rich rows want anyway.
 *
 * GROUPED BY WHERE THE DATA COMES FROM, because that is what tells a recruiter how
 * much to trust a field, and a developer which fields go thin without the parser:
 *   1. Work preference — the candidate's own asks. ALL OPTIONAL, so choosing one
 *      silently drops everyone who left it blank. The group says so, permanently.
 *   2. Profile — Basic information: who they are.
 *   3. Work information — extracted from the CV: what they have done.
 *   4. CV activity — not candidate data at all: freshness, and what this team has
 *      already paid for.
 *
 * Two things are query-driven, and only one changes the shape of the panel:
 *   · COUNTS — every option carries how many of the current results it would keep.
 *     With dropdowns these live INSIDE the open option list; open one to see them.
 *   · OPTION LISTS — the open-ended fields (`derived`) list only values PRESENT in
 *     the current results, top-N by count. Searching "điều dưỡng" surfaces nursing
 *     skills; "kế toán" would surface accounting ones. A fixed global list of three
 *     skills is decoration, not a filter.
 * The GROUPS, their order, and the fields inside them never change.
 */
interface Facet {
  label: string
  /** options are drawn from the current result set, not from a fixed list */
  derived?: boolean
  /** several values may be chosen at once — rendered with checkboxes */
  multi?: boolean
  /** the option list is long enough to need a type-to-filter box inside the panel */
  searchable?: boolean
  opts: [string, number][]
}
interface FacetSection {
  /** sub-heading inside a group, e.g. "Basic information" / "CV content" */
  caption?: string
  facets: Facet[]
  /** renders Language + level as ONE paired control at the end of the section */
  language?: boolean
}
interface FacetGroup {
  title: string
  /** renders the "Last resume update" pill row as the group's only control */
  lastUpdate?: boolean
  /** renders the two-currency salary range as the group's first control */
  salary?: boolean
  /** renders Language + level as ONE paired control at the end of the group */
  language?: boolean
  /** captioned sub-blocks — used where one group holds two field sheets */
  sections?: FacetSection[]
  facets: Facet[]
}

/*
 * EVERY field below is one of the client's own 15 candidate-data fields — the
 * 9 of Basic information and the 6 of Desired work condition — plus the CV-content
 * facets (skills, certificates, languages, and the title off the latest work
 * experience). Nothing here is invented; see the requirement's provenance table.
 *
 * Two groups mirror the client's field sheet exactly, INCLUDING its order, so the
 * employer's filters and the candidate's own My-CVs form read as the same list.
 */
const FILTER_GROUPS: FacetGroup[] = [
  /* Freshness first: how recently a CV was touched is the cheapest way to avoid
     spending a credit on someone who has stopped looking, so it is the filter a
     recruiter sets before any other. */
  { title: 'CV activity', lastUpdate: true, facets: [] },
  {
    /* TABLE 2 of the client's field sheet — "Desired work condition", all six,
       in the sheet's own order. Salary renders after the first four because the
       range control is taller than a dropdown. */
    title: 'Work preference',
    salary: true,
    facets: [
      { label: 'Desired job role', derived: true, multi: true, searchable: true, opts: [['Điều dưỡng viên', 131], ['Điều dưỡng trưởng', 29], ['KTV xét nghiệm', 24], ['Hộ lý', 17]] },
      { label: 'Desired job category', derived: true, multi: true, searchable: true, opts: [['Y tế – Điều dưỡng', 208], ['Xét nghiệm – CLS', 27], ['Dược', 13]] },
      { label: 'Desired industry', derived: true, multi: true, searchable: true, opts: [['Healthcare', 218], ['Pharmaceuticals', 21], ['Education', 6]] },
      { label: 'Desired locations', derived: true, multi: true, searchable: true, opts: [['Hồ Chí Minh', 174], ['Bình Dương', 41], ['Đồng Nai', 18], ['Hà Nội', 15]] },
      { label: 'Desired work type', multi: true, opts: [['In office', 231], ['Hybrid', 14], ['Remote', 5], ['Oversea', 3]] },
    ],
  },
  {
    title: 'Candidate information',
    sections: [
      {
        /* TABLE 1 of the field sheet — Basic information, MINUS full name (masked
           until unlock) and minus email/phone (contact, never a filter). Exactly
           the six that remain. */
        facets: [
          { label: 'Nationality', derived: true, opts: [['Việt Nam', 241], ['Hàn Quốc', 4], ['Philippines', 3]] },
          { label: 'Age', opts: [['Under 25', 41], ['25 – 34', 138], ['35 – 44', 57], ['45+', 12]] },
          { label: 'Highest education', opts: [['High school', 9], ['College', 103], ['Bachelor', 138], ['Master', 7], ['Doctor', 0]] },
          { label: 'Years of work experience', opts: [['No experience / fresher', 34], ['1 – 3 years', 82], ['3 – 5 years', 76], ['5+ years', 56]] },
        ],
      },
      {
        /* TABLE 3 — CV content. Only the parts of a CV that are searchable facets:
           skills, certificates, languages, and the title off the latest work
           experience. About / projects are free text and belong to the keyword box. */
        facets: [
          { label: 'Job title', derived: true, multi: true, searchable: true, opts: [['Điều dưỡng viên', 142], ['Điều dưỡng trưởng', 38], ['KTV xét nghiệm', 31], ['Hộ lý', 19]] },
          { label: 'Skills', derived: true, multi: true, searchable: true, opts: [['Chăm sóc nội khoa', 74], ['Tiêm truyền', 61], ['Hồ sơ bệnh án', 48], ['JCI', 12]] },
          { label: 'Certificates', derived: true, multi: true, searchable: true, opts: [['CC hành nghề điều dưỡng', 187], ['Sơ cấp cứu (BLS)', 44], ['IELTS', 12]] },
        ],
        language: true,
      },
    ],
    facets: [],
  },
]

/** Language and its level are ONE question ("English, at professional level"), so
    they render as one block and must be applied against the SAME language entry —
    never English from one row and Professional from another. */
const LANGUAGE_FACET: Facet = { label: 'Language', derived: true, searchable: true, opts: [['Tiếng Anh', 96], ['Tiếng Nhật', 11], ['Tiếng Hàn', 4], ['Tiếng Trung', 7]] }
const LANGUAGE_LEVEL_FACET: Facet = { label: 'Level', opts: [['Native', 8], ['Professional', 41], ['Conversational', 63], ['Basic', 22]] }

/** "Last resume update" — one row of single-select pills, the same control the
    client's reference uses. Ranges are cumulative ("1 Week" = within the last
    week), and Any is the default, because a date filter nobody set must never
    quietly hide CVs. */
const LAST_UPDATE = ['Any', 'Today', 'Yesterday', '3 days ago', '1 Week', '2 Weeks', '1 Month', '2 Months', '6 Months', '12 Months']

/** One filter field: a dropdown whose open panel carries the per-option counts.
    A closed select cannot show counts, which is the one thing this layout costs
    us against a checkbox rail — so the panel says where they went. */
function FilterSelect({ f }: { f: Facet }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[11.5px] font-medium text-ink/80">{f.label}</p>
        {f.derived && <span className="text-[9.5px] text-faint">from results</span>}
      </div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn('flex w-full items-center gap-2 rounded-md border bg-surface px-2.5 py-1.5 text-left', open ? 'border-brand' : 'border-line')}
      >
        <span className="min-w-0 flex-1 truncate text-[12px] text-faint">Any</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-faint" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-lg">
          {/* Type-to-filter, for the fields whose option list is a taxonomy rather
              than a short enum — a recruiter should never scroll 42 skills to find
              one. Matches on the canonical name AND its aliases. */}
          {f.searchable && (
            <div className="flex items-center gap-1.5 border-b border-line-soft px-2.5 py-1.5">
              <Search className="h-3 w-3 shrink-0 text-faint" />
              <span className="text-[11px] text-faint">Type to find a {f.label.toLowerCase()}…</span>
            </div>
          )}
          <div className="max-h-40 overflow-y-auto py-1">
            <div className="flex items-center gap-2 px-2.5 py-1 text-[11.5px] text-ink">
              {f.multi && <span className="h-3 w-3 shrink-0 rounded-[3px] border border-line" />}
              Any
            </div>
            {f.opts.map(([o, n]) => (
              <div key={o} className={cn('flex items-center gap-2 px-2.5 py-1 text-[11.5px]', n === 0 ? 'text-faint' : 'text-ink/80')}>
                {f.multi && <span className="h-3 w-3 shrink-0 rounded-[3px] border border-line" />}
                <span className="min-w-0 flex-1 truncate">{o}</span>
                <span className="shrink-0 tabular-nums text-[10px] text-faint">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/*
 * Desired salary — a RANGE on the employer's side, matched against the ONE figure
 * the candidate stated.
 *
 * The two sides are deliberately different shapes, and the asymmetry is the whole
 * logic: a candidate enters a single expected figure, an employer sets a band, and
 * a CV matches when THE CANDIDATE'S FIGURE FALLS INSIDE THE BAND. It is a
 * point-in-range test, not two ranges overlapping — there is no second candidate
 * number to overlap with.
 *
 * Reads `expectedSalary { kind, currency, min, max }`; today `max` is null because
 * the candidate form takes one number. Writing the query as an overlap against
 * [min, max ?? min] gives the point-in-range behaviour now AND keeps working
 * unchanged if the candidate form ever becomes a range.
 */
function SalaryRange() {
  const [cur, setCur] = useState<'VND' | 'USD'>('VND')
  const unit = cur === 'VND' ? 'triệu/mo' : 'USD/mo'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[11.5px] font-medium text-ink/80">Desired salary</p>
        <div className="flex gap-1">
          {(['VND', 'USD'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className={cn(
                'rounded border px-1.5 py-px text-[10px] font-semibold',
                cur === c ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {/* stacked, not side by side — the rail is too narrow for two bounds on one row */}
      <div className="space-y-1.5">
        {['From', 'To'].map((b) => (
          <div key={b} className="flex min-w-0 items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
            <span className="min-w-0 flex-1 truncate text-[12px] text-faint">{b} · Any {unit}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-faint" />
          </div>
        ))}
      </div>
      <p className="mt-1 text-[9.5px] leading-snug text-faint">Matches candidates whose stated expected salary falls in this band. Either bound may be left as Any.</p>
    </div>
  )
}

/** Language + level — one question, so one block. The pair must be applied against
    the SAME language entry; see the requirement. */
function LanguagePair() {
  return (
    <div className="rounded-md border border-line-soft bg-canvas/30 p-2">
      <div className="space-y-2">
        <FilterSelect f={LANGUAGE_FACET} />
        <FilterSelect f={LANGUAGE_LEVEL_FACET} />
      </div>
    </div>
  )
}

/** One collapsible group in the left filter rail. Grouping by data source is what
    makes a rail this long navigable; collapsing keeps it shorter than the results. */
function FilterGroupBlock({ g, children }: { g: FacetGroup; children?: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-1 bg-canvas/40 px-2.5 py-2 text-left">
        <span className="flex-1 text-[10.5px] font-bold uppercase tracking-wide text-ink">{g.title}</span>
        {open ? <ChevronUp className="h-3 w-3 shrink-0 text-faint" /> : <ChevronDown className="h-3 w-3 shrink-0 text-faint" />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-line-soft px-2.5 py-2.5">
          {g.facets.map((f) => <FilterSelect key={f.label} f={f} />)}
          {g.salary && <SalaryRange />}
          {g.language && <LanguagePair />}
          {g.sections?.map((s, i) => (
            <div key={s.caption ?? `section-${i}`} className="space-y-3">
              {s.caption && <p className="text-[9.5px] font-semibold uppercase tracking-wide text-brand/70">{s.caption}</p>}
              {s.facets.map((f) => <FilterSelect key={f.label} f={f} />)}
              {s.language && <LanguagePair />}
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}

/*
 * The keyword bar, following Saramin KR's employer search: THREE boxes rather than
 * one, so a recruiter states the boolean query as three plain lists instead of
 * learning an operator syntax.
 *   OR  — any of these words (the main query)
 *   AND — every one of these must also appear
 *   NOT — exclude any CV containing these
 * The three combine as: (a OR b) AND c AND d AND NOT (e OR f).
 */
/* ── The parsed query ──────────────────────────────────────────────────────
 * Replaces the Saramin-KR OR / AND / NOT boxes. The recruiter types a sentence;
 * we show the PARSE as chips they can correct. Operators become PRIORITY:
 *
 *   Bắt buộc  — must match. The only state that removes rows (changes the count).
 *   Ưu tiên   — preferred. Re-orders only; it can never empty the screen.
 *   Loại trừ  — exclude.
 *
 * Role defaults to Bắt buộc, everything else to Ưu tiên, because a recruiter
 * means "an accountant, ideally from banking" — never "anyone from banking".
 */
type ChipState = 'must' | 'pref' | 'not'
const CHIP_STATE: Record<ChipState, { label: string; cls: string }> = {
  must: { label: 'Bắt buộc', cls: 'border-brand bg-brand-soft text-brand' },
  pref: { label: 'Ưu tiên', cls: 'border-line bg-surface text-ink/75' },
  not: { label: 'Loại trừ', cls: 'border-rose-200 bg-rose-50 text-rose-600' },
}
const SEARCH_QUERY = 'điều dưỡng trưởng bệnh viện quốc tế'
const SEARCH_CHIPS: { type: string; value: string; state: ChipState }[] = [
  { type: 'Vai trò', value: 'Điều dưỡng trưởng', state: 'must' },
  { type: 'Nơi làm việc', value: 'Bệnh viện quốc tế', state: 'pref' },
]

/** One parsed term. The state selector is the whole boolean model, per chip. */
function QueryChip({ c }: { c: { type: string; value: string; state: ChipState } }) {
  const s = CHIP_STATE[c.state]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11.5px]', s.cls)}>
      <span className="opacity-60">{c.type}:</span>
      <b className="font-semibold">{c.value}</b>
      <span className="ml-0.5 cursor-pointer rounded bg-black/5 px-1.5 py-px text-[10px] font-medium">{s.label} ▾</span>
      <span className="cursor-pointer opacity-40 hover:opacity-100">✕</span>
    </span>
  )
}

/* ── Advanced mode: the old Saramin-KR boolean bar ─────────────────────────
 * Kept, not deleted. It is Saramin KR parity, some recruiters genuinely think
 * in operators, and it is the escape hatch for the query a chip cannot express
 * ("either of these two job titles, but never this third word"). It is simply
 * no longer the thing a first-time recruiter has to understand.
 */
const ADV_BOXES: { op: string; value?: string; hint: string; note: string }[] = [
  { op: 'OR', value: 'điều dưỡng trưởng, y tá trưởng', hint: 'bất kỳ từ nào', note: 'Câu truy vấn chính — khớp nếu CV chứa ÍT NHẤT MỘT từ' },
  { op: 'AND', value: 'quản lý', hint: 'phải có tất cả', note: 'Thu hẹp — mọi từ ở đây đều phải xuất hiện' },
  { op: 'NOT', value: 'thực tập', hint: 'loại trừ các từ này', note: 'Loại bỏ — CV chứa bất kỳ từ nào ở đây sẽ bị bỏ' },
]
const ADV_SCOPES = ['Tất cả các trường', 'Chỉ chức danh', 'Chỉ kỹ năng', 'Chỉ công ty']

/* ── CV detail page ────────────────────────────────────────────────────────
 * Opened by Unlock / View CV. A PAGE, not a modal — a CV is a document a
 * recruiter reads end to end, forwards to a colleague and prints.
 *
 * Structure follows the client's own three-group candidate-data model, in the
 * order Saramin KR's own resume page uses: the CV itself first (what they have
 * done), the candidate's desired conditions last, under their own heading.
 *   1 · Basic information   2 · Work preference   3 · CV content
 * Row layout is the Figma reference's: period in a fixed left column, the
 * content in the right — so a reader can scan the dates alone.
 */
function CvRow({ period, children }: { period: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-line-soft py-3 last:border-0 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
      <p className="text-[11px] leading-snug text-muted">{period}</p>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** A label/value pair — the shape Basic information and Work preference both use. */
function CvPair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-1.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <p className="text-[11.5px] font-medium text-ink/70">{label}</p>
      <p className="min-w-0 text-[12px] text-ink">{value}</p>
    </div>
  )
}

function CvSection({ n, title, sub, children }: { n: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <div className="mb-2 flex flex-wrap items-baseline gap-2 border-b-2 border-ink/80 pb-1.5">
        <span className="grid h-4 w-4 place-items-center rounded bg-ink text-[9px] font-bold text-white">{n}</span>
        <h4 className="text-[14px] font-bold text-ink">{title}</h4>
        {sub && <span className="text-[10.5px] text-faint">{sub}</span>}
      </div>
      {children}
    </section>
  )
}

function CvDetailPage({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span onClick={onBack} className="cursor-pointer text-[12px] text-brand">← Back to resume search</span>
        <div className="flex gap-2">
          <Btn>↓ Download CV</Btn>
          <Btn>＋ Add to a job pipeline</Btn>
          <Btn primary>Contact candidate</Btn>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-5">
        {/* candidate header — the photo is shown, the name is now real */}
        <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-line pb-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[16px] font-bold text-white">NH</span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-ink">Nguyễn Thị Hoa <Chip tone="green">Unlocked</Chip></p>
            <p className="text-[12px] text-muted">Điều dưỡng viên · Nữ · 28 tuổi · 4 năm kinh nghiệm</p>
          </div>
          <p className="text-[10.5px] text-faint">Unlocked by Linh Trần · 05/08/2026 · from the team pool</p>
        </div>

        <CvSection n="1" title="Basic information" sub="9 fields — from sign-up and onboarding">
          <div className="divide-y divide-line-soft">
            <CvPair label="Full name" value="Nguyễn Thị Hoa" />
            <CvPair label="Email" value="hoa.nguyen@email.com" />
            <CvPair label="Phone" value="0901 234 567" />
            <CvPair label="Nationality" value="Việt Nam" />
            <CvPair label="Gender" value="Nữ" />
            <CvPair label="Marital status" value="Độc thân" />
            <CvPair label="Date of birth" value="12/04/1998 (28 tuổi)" />
            <CvPair label="Highest education" value="Cử nhân (Bachelor)" />
            <CvPair label="Years of work experience" value="4 năm" />
          </div>
        </CvSection>

        <CvSection n="2" title="Work preference" sub="the conditions this candidate set — 6 fields">
          <div className="divide-y divide-line-soft">
            <CvPair label="Desired job role" value="Điều dưỡng viên" />
            <CvPair label="Desired job category" value="Y tế – Điều dưỡng" />
            <CvPair label="Desired industry" value="Healthcare · Bệnh viện / Phòng khám" />
            <CvPair label="Desired work location" value="Hồ Chí Minh, Bình Dương" />
            <CvPair label="Expected salary" value="Từ 15 triệu / tháng (VND)" />
            <CvPair label="Desired work type" value="In office" />
          </div>
        </CvSection>

        <CvSection n="3" title="CV content" sub="Điều dưỡng viên — CV.pdf · updated 2 days ago">
          <p className="mb-1 mt-3 text-[12px] font-bold text-ink">About</p>
          <p className="mb-4 text-[11.5px] leading-relaxed text-muted">
            Điều dưỡng viên 4 năm kinh nghiệm khoa Nội, quen với quy trình chăm sóc người bệnh nội trú tại bệnh viện công lập và phòng khám đa khoa.
            Thành thạo tiêm truyền, theo dõi dấu hiệu sinh tồn và ghi chép hồ sơ bệnh án; ưu tiên môi trường có quy trình rõ ràng và đào tạo nội bộ.
          </p>

          <p className="mb-1 mt-4 text-[12px] font-bold text-ink">Work experience</p>
          <div className="mb-4">
            <CvRow period="03/2023 – nay · 2 năm 5 tháng">
              <p className="text-[12px] font-semibold text-ink">BV Nhân dân Gia Định <span className="font-normal text-muted">· Điều dưỡng viên</span></p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">Chăm sóc người bệnh khoa Nội (40 giường); tiêm truyền, theo dõi dấu hiệu sinh tồn, bàn giao ca và hướng dẫn người nhà.</p>
            </CvRow>
            <CvRow period="07/2021 – 02/2023 · 1 năm 8 tháng">
              <p className="text-[12px] font-semibold text-ink">PK Đa khoa Vạn Hạnh <span className="font-normal text-muted">· Điều dưỡng viên</span></p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">Tiếp nhận bệnh nhân ngoại trú, lấy mẫu xét nghiệm và hướng dẫn sau khám.</p>
            </CvRow>
          </div>

          <p className="mb-1 mt-4 text-[12px] font-bold text-ink">Education</p>
          <div className="mb-4">
            <CvRow period="09/2017 – 06/2021 · Tốt nghiệp">
              <p className="text-[12px] font-semibold text-ink">ĐH Y Dược TP.HCM <span className="font-normal text-muted">· Cử nhân Điều dưỡng</span></p>
              <p className="mt-0.5 text-[11px] text-muted">Hồ Chí Minh · GPA 3.4 / 4.0</p>
            </CvRow>
          </div>

          <p className="mb-1 mt-4 text-[12px] font-bold text-ink">Certificates</p>
          <div className="mb-4">
            <CvRow period="08/2021"><p className="text-[12px] text-ink"><b>Chứng chỉ hành nghề điều dưỡng</b> <span className="text-muted">· Sở Y tế TP.HCM</span></p></CvRow>
            <CvRow period="03/2024"><p className="text-[12px] text-ink"><b>Sơ cấp cứu cơ bản (BLS)</b> <span className="text-muted">· Hội Điều dưỡng VN</span></p></CvRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-ink">Skills</p>
              <div className="flex flex-wrap gap-1">
                {['Chăm sóc nội khoa', 'Tiêm truyền', 'Hồ sơ bệnh án', 'Giao tiếp bệnh nhân', 'Sơ cấp cứu'].map((s) => <Chip key={s}>{s}</Chip>)}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-bold text-ink">Languages</p>
              <p className="text-[11.5px] text-ink">Tiếng Anh — <span className="text-muted">Conversational</span></p>
              <p className="text-[11.5px] text-ink">Tiếng Việt — <span className="text-muted">Native</span></p>
            </div>
          </div>

          <p className="mb-1 mt-4 text-[12px] font-bold text-ink">Projects</p>
          <CvRow period="2024">
            <p className="text-[12px] font-semibold text-ink">Chuẩn hoá quy trình bàn giao ca khoa Nội</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">Xây dựng checklist bàn giao, giảm sai sót ghi chép hồ sơ khoảng 30% trong 6 tháng.</p>
          </CvRow>
        </CvSection>
      </div>
    </div>
  )
}

function ResumeSearchScreen() {
  const [viewing, setViewing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState('Any')
  const [advanced, setAdvanced] = useState(false)
  /* Each row carries the full locked-preview field set: DESIRED ROLE, demographic
     line (gender · age), years of experience, the LATEST company (name, role,
     period, one-line description), the LATEST education (school, degree,
     graduated or expected), and skills. Identity (full name, contact, CV file)
     stays hidden until unlock.

     `desiredRole` is where the candidate wants to go, NOT their current title —
     the two are separate fields and only the second is readable from a CV. It
     leads the card because it is what the Desired job role facet filters on, and
     because a recruiter's first question is whether the candidate wants the job
     being recruited for. */
  /*
   * WORK HISTORY ON THE CARD — the shape the client specified, matching Saramin KR:
   *   · the CURRENT (most recent) job in full — company, job title, period,
   *     employment status, and ONE truncated line of description;
   *   · every earlier job as a compact chip — company, job title, total duration,
   *     no description;
   *   · anything beyond the chips that fit as a "+N" count.
   * `prior` is that chip list; `morePrior` is the overflow count.
   */
  /* Results are GROUPED, never one flat run ordered by an invisible score. A band
     says which chips matched and how strongly, so a recruiter can stop reading
     when the tier stops being worth their time — and every row carries its own
     reason line, which is what turns ranking from something to trust into
     something to check before spending an unlock.

     The last band is the client's "nhà cung ứng cho Starbucks" case: the ENTITY
     matched but the ROLE did not. That person is genuinely interesting and is
     genuinely not a nurse, so they are shown, labelled, and kept OUT of the role
     tiers — blending them in is what makes the top of a list stop being trusted. */
  type CvRow = {
    reason: [string, string][]
    unlocked: boolean
    /* SARAMIN pulled this CV back AFTER the employer had already unlocked it.
       It drops out of NEW searches (it is Hidden), but it stays reachable from
       what the employer already paid for — hiding something they bought would be
       worse than telling them it is withdrawn. The credit is refunded. */
    recalled?: string
    id: string
    name: string
    desiredRole: string
    gender: string
    age: number
    years: string
    company: { name: string; masked: string; title: string; period: string; desc: string }
    prior: { name: string; masked: string; title: string; dur: string }[]
    morePrior?: number
    education: { school: string; masked: string; degree: string; status: string; expected: boolean }
    skills: string[]
    more?: number
    loc: string
    salary: string
    updated: string
  }
  const BANDS: {
    label: string
    count: number
    tone: string
    note: string
    rows: CvRow[]
  }[] = [
    {
      label: 'KHỚP NHẤT',
      count: 18,
      tone: 'text-emerald-600',
      note: 'Đúng vai trò · đã làm ở bệnh viện quốc tế',
      rows: [
        {
          reason: [['✓', 'Điều dưỡng trưởng'], ['✓', 'Bệnh viện quốc tế — 5 năm kinh nghiệm']],
          unlocked: false,
          id: 'A2F91',
          name: 'Trần ○○',
          desiredRole: 'Điều dưỡng trưởng',
          gender: 'Nữ', age: 34, years: '7 yrs experience',
          company: { name: 'BV Quốc tế Mỹ (AIH)', masked: 'Bệnh viện tư nhân quốc tế · TP.HCM', title: 'Điều dưỡng trưởng khoa Ngoại', period: '01/2021 – nay', desc: 'Quản lý 18 điều dưỡng; xây dựng quy trình chăm sóc theo chuẩn JCI, đào tạo nội bộ và kiểm tra tuân thủ hằng tháng.' },
          prior: [
            { name: 'BV Hoàn Mỹ Sài Gòn', masked: 'Bệnh viện tư nhân', title: 'Điều dưỡng viên', dur: '2 năm 3 tháng' },
            { name: 'PK Quốc tế Columbia', masked: 'Phòng khám quốc tế', title: 'Điều dưỡng viên', dur: '1 năm' },
          ],
          morePrior: 2,
          education: { school: 'ĐH Y khoa Phạm Ngọc Thạch', masked: 'Đại học y khoa · TP.HCM', degree: 'Cử nhân Điều dưỡng', status: 'Graduated 2014', expected: false },
          skills: ['Quản lý điều dưỡng', 'JCI', 'Đào tạo'], more: 3,
          loc: 'Hồ Chí Minh', salary: 'Từ 25 triệu', updated: '1 week ago',
        },
        {
          reason: [['✓', 'Điều dưỡng trưởng'], ['✓', 'Bệnh viện quốc tế — 6 năm kinh nghiệm']],
          unlocked: false,
          id: 'D9E13',
          name: 'Đỗ ○○',
          desiredRole: 'Điều dưỡng trưởng',
          gender: 'Nữ', age: 36, years: '9 yrs experience',
          company: { name: 'BV FV', masked: 'Bệnh viện tư nhân quốc tế · TP.HCM', title: 'Điều dưỡng trưởng khoa Sản', period: '05/2019 – nay', desc: 'Phụ trách 24 điều dưỡng khoa Sản; triển khai bộ tiêu chuẩn an toàn người bệnh và đào tạo điều dưỡng mới.' },
          prior: [{ name: 'BV Từ Dũ', masked: 'Bệnh viện công lập', title: 'Điều dưỡng viên', dur: '3 năm 4 tháng' }],
          education: { school: 'ĐH Y Dược TP.HCM', masked: 'Đại học y dược · TP.HCM', degree: 'Cử nhân Điều dưỡng', status: 'Graduated 2012', expected: false },
          skills: ['Quản lý điều dưỡng', 'An toàn người bệnh', 'Sản khoa'], more: 2,
          loc: 'Hồ Chí Minh', salary: 'Từ 28 triệu', updated: '3 days ago',
        },
      ],
    },
    {
      label: 'LIÊN QUAN',
      count: 43,
      tone: 'text-amber-600',
      note: 'Đúng vai trò · “quốc tế” chỉ có ở đào tạo / chứng chỉ, chưa đi làm',
      rows: [
        {
          reason: [['✓', 'Điều dưỡng trưởng'], ['◐', 'Bệnh viện quốc tế — chứng chỉ JCI, chưa làm thực tế']],
          unlocked: true,
          recalled: '20/08/2026',
          id: 'E1D77',
          name: 'Nguyễn Thị Hoa',
          desiredRole: 'Điều dưỡng trưởng',
          gender: 'Nữ', age: 31, years: '6 yrs experience',
          company: { name: 'BV Nhân dân Gia Định', masked: 'Bệnh viện công lập · TP.HCM', title: 'Điều dưỡng trưởng khoa Nội', period: '03/2022 – nay', desc: 'Điều phối 12 điều dưỡng khoa Nội (40 giường); phân ca, giám sát hồ sơ bệnh án và hướng dẫn người nhà.' },
          prior: [{ name: 'PK Đa khoa Vạn Hạnh', masked: 'Phòng khám đa khoa', title: 'Điều dưỡng viên', dur: '1 năm 8 tháng' }],
          education: { school: 'ĐH Y Dược TP.HCM', masked: 'Đại học y dược · TP.HCM', degree: 'Cử nhân Điều dưỡng · chứng chỉ JCI 2023', status: 'Graduated 06/2019', expected: false },
          skills: ['Chăm sóc nội khoa', 'JCI', 'Quản lý ca trực'], more: 2,
          loc: 'Hồ Chí Minh', salary: 'Từ 20 triệu', updated: '2 days ago',
        },
      ],
    },
    {
      label: 'ÍT LIÊN QUAN HƠN',
      count: 187,
      tone: 'text-muted',
      note: 'Đúng vai trò · chưa có yếu tố quốc tế',
      rows: [
        {
          reason: [['✓', 'Điều dưỡng trưởng'], ['○', 'Chưa có bệnh viện quốc tế']],
          unlocked: false,
          id: 'B4C22',
          name: 'Phạm ○○',
          desiredRole: 'Điều dưỡng trưởng',
          gender: 'Nam', age: 33, years: '8 yrs experience',
          company: { name: 'BV Đại học Y Dược TP.HCM', masked: 'Bệnh viện đại học · TP.HCM', title: 'Điều dưỡng trưởng khoa Nội tổng hợp', period: '02/2020 – nay', desc: 'Quản lý 15 điều dưỡng; lập lịch trực, kiểm tra tuân thủ quy trình chăm sóc cơ bản.' },
          prior: [],
          education: { school: 'ĐH Nguyễn Tất Thành', masked: 'Đại học tư thục · TP.HCM', degree: 'Cử nhân Điều dưỡng', status: 'Graduated 2016', expected: false },
          skills: ['Chăm sóc nội khoa', 'Quản lý ca trực'],
          loc: 'Hồ Chí Minh', salary: 'Thỏa thuận', updated: '4 days ago',
        },
      ],
    },
    {
      label: 'CÓ NHẮC ĐẾN “BỆNH VIỆN QUỐC TẾ”',
      count: 9,
      tone: 'text-violet-600',
      note: 'Từ khoá khớp nhưng KHÁC vai trò — ví dụ nhà cung ứng, đối tác đào tạo',
      rows: [
        {
          reason: [['○', 'Không phải điều dưỡng trưởng'], ['✓', 'Bệnh viện quốc tế — khách hàng / đối tác']],
          unlocked: false,
          id: 'F3A88',
          name: 'Lê ○○',
          desiredRole: 'Chuyên viên thiết bị y tế',
          gender: 'Nam', age: 35, years: '10 yrs experience',
          company: { name: 'Công ty TBYT Đông Á', masked: 'Nhà phân phối thiết bị y tế · TP.HCM', title: 'Quản lý kinh doanh khu vực', period: '04/2018 – nay', desc: 'Phụ trách cung ứng vật tư tiêu hao cho BV Quốc tế Mỹ (AIH), BV FV và Vinmec; đào tạo sử dụng thiết bị cho điều dưỡng.' },
          prior: [{ name: 'Công ty Dược Hậu Giang', masked: 'Công ty dược', title: 'Trình dược viên', dur: '3 năm' }],
          education: { school: 'ĐH Bách khoa TP.HCM', masked: 'Đại học kỹ thuật · TP.HCM', degree: 'Kỹ sư Điện tử y sinh', status: 'Graduated 2013', expected: false },
          skills: ['Thiết bị y tế', 'Đào tạo sử dụng', 'Quản lý khách hàng'], more: 4,
          loc: 'Hồ Chí Minh', salary: 'Từ 30 triệu', updated: '5 days ago',
        },
      ],
    },
  ]

  /* Candidates whose ask is in the OTHER currency are set aside rather than
     compared — but never silently. This is the count that says so. */
  const otherCurrency = 12

  /* Unlock / View CV swaps the console to the CV detail PAGE — a CV is a document
     someone reads end to end, not a dialog. Back returns to the result list. */
  if (viewing) return <CvDetailPage onBack={() => setViewing(false)} />

  return (
    <div className="relative">
      <PageBar title="Resume search" sub="Find and unlock candidate CVs from Saramin's talent pool." action={<Chip tone="blue">62 / 100 unlocks left</Chip>} />
      {/* ── search bar: ONE box, then the parse ───────────────────────────────
          Replaces the Saramin-KR OR / AND / NOT boxes. Operators asked the
          recruiter to resolve their intent into set logic BEFORE we had shown we
          understood them — "kế toán trưởng ngành ngân hàng" has no correct
          operator, because banking is PREFERRED and three boxes cannot say that.
          So: the recruiter writes a sentence, we show the parse as chips, and
          each chip carries the priority instead. Boolean survives behind
          "Tìm kiếm nâng cao" for the queries chips cannot express. */}
      <div className="mb-3">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] font-semibold text-ink">Find the right people for the role</p>
          <div className="flex items-center gap-3 text-[10.5px] text-muted">
            <span className="cursor-pointer">↺ Reset</span>
            <span className="cursor-pointer">Saved searches</span>
          </div>
        </div>

        {advanced ? (
          <>
            {/* Three plain lists, the Saramin-KR model. The recruiter still never
                types AND, OR or a bracket — the SCREEN states the logic and the
                recruiter states the words. */}
            <div className="flex items-stretch overflow-hidden rounded-lg border border-brand">
              {ADV_BOXES.map((b) => (
                <div key={b.op} className="flex min-w-0 flex-1 items-center gap-2 border-r border-line px-3 py-2">
                  <span className="shrink-0 rounded bg-brand-soft px-1.5 py-px text-[10px] font-bold tracking-wide text-brand">{b.op}</span>
                  <span className={cn('min-w-0 flex-1 truncate text-[12px]', b.value ? 'text-ink' : 'text-faint')}>{b.value ?? b.hint}</span>
                </div>
              ))}
              <span className="flex shrink-0 cursor-pointer items-center bg-brand px-6 text-[12.5px] font-semibold text-white">Tìm</span>
            </div>
            {/* What each box does, under the box it describes — the operator names
                are only learnable if their meaning is on screen beside them. */}
            <div className="mt-1 grid grid-cols-3 gap-0">
              {ADV_BOXES.map((b) => (
                <p key={b.op} className="px-3 text-[10px] leading-snug text-faint">{b.note}</p>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Scope is ORTHOGONAL to the operators: the boxes say WHICH words,
                  this says WHERE to look. It exists only in advanced mode — in the
                  default mode the chip TYPE already answers "where", and two
                  answers to one question is how a search starts lying. */}
              <span className="text-[10.5px] text-faint">Tìm trong:</span>
              <span className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-ink">
                {ADV_SCOPES[0]} <ChevronDown className="h-3 w-3 text-faint" />
              </span>
              <span className="rounded-md border border-line bg-canvas/60 px-2 py-1 font-mono text-[10.5px] text-muted">
                (điều dưỡng trưởng OR y tá trưởng) AND quản lý NOT thực tập
              </span>
              <span onClick={() => setAdvanced(false)} className="ml-auto cursor-pointer text-[10.5px] font-medium text-brand">
                ← Quay lại tìm kiếm thường
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-stretch overflow-hidden rounded-lg border border-brand">
              <span className="grid shrink-0 place-items-center pl-3 text-faint">
                <Search className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate px-2.5 py-2 text-[12.5px] text-ink">{SEARCH_QUERY}</span>
              <span className="flex shrink-0 cursor-pointer items-center bg-brand px-6 text-[12.5px] font-semibold text-white">Tìm</span>
            </div>
            {/* The parse, shown and editable. A wrong reading is visible and fixable
                in one click instead of silently returning the wrong people. */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] text-faint">Đang hiểu là:</span>
              {SEARCH_CHIPS.map((c) => <QueryChip key={c.type} c={c} />)}
              <span className="cursor-pointer rounded-lg border border-dashed border-line px-2 py-1 text-[11.5px] text-muted">＋ Thêm điều kiện</span>
              <span onClick={() => setAdvanced(true)} className="ml-auto cursor-pointer text-[10.5px] text-brand">
                Tìm kiếm nâng cao (OR / AND / NOT) →
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* ── left filter rail ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold">Filters</p>
              <span className="cursor-pointer text-[10.5px] text-brand">Clear all</span>
            </div>
          </div>
          {/* The groups, their order, and the fields inside them never change with
              the query. Only the counts and the `derived` option lists do. */}
          {FILTER_GROUPS.map((g) => (
            <FilterGroupBlock key={g.title} g={g}>
              {g.lastUpdate && (
                <div>
                  <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Last resume update</p>
                  <Seg options={LAST_UPDATE} value={lastUpdate} onChange={setLastUpdate} />
                </div>
              )}
            </FilterGroupBlock>
          ))}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-muted">
              <b className="text-ink">257</b> candidates match · xếp theo mức độ phù hợp
            </p>
            <span className="text-[10.5px] text-faint">✓ khớp · ◐ khớp yếu · ○ chưa có</span>
          </div>
          <div className="space-y-4">
            {BANDS.map((band) => (
              <div key={band.label}>
                {/* The band header is the whole point of the grouping: it names
                    WHY these rows are together, so a recruiter can stop reading
                    when the tier stops being worth their time. */}
                <div className="mb-1.5 flex items-center gap-2 border-b border-line-soft pb-1">
                  <span className={cn('shrink-0 text-[11px] font-bold uppercase tracking-wide', band.tone)}>{band.label}</span>
                  <span className="shrink-0 rounded-full bg-canvas px-1.5 text-[10px] font-medium text-muted">{band.count}</span>
                  <span className="min-w-0 flex-1 truncate text-[10.5px] text-faint">{band.note}</span>
                  <span className="shrink-0 cursor-pointer text-[10.5px] text-brand">Thu gọn</span>
                </div>
                <div className="space-y-2.5">
                  {band.rows.map((cv, i) => (
              <div key={i} className="rounded-lg border border-line p-3">
                {/* WHY this row is in this band — one mark per chip. The highest-value
                    element on the card: it turns ranking from something to trust into
                    something to CHECK before spending an unlock. */}
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-line-soft pb-1.5">
                  {cv.reason.map(([mark, text]) => (
                    <span key={text} className="inline-flex items-center gap-1 text-[10.5px] text-muted">
                      <span className={cn('font-bold', mark === '✓' ? 'text-emerald-600' : mark === '◐' ? 'text-amber-600' : 'text-faint')}>{mark}</span>
                      {text}
                    </span>
                  ))}
                </div>
                {/* identity line — masked until unlocked, but the demographic +
                    seniority summary a recruiter screens on is always readable */}
                <div className="flex items-start gap-3">
                  {/* The avatar slot always renders an avatar — a padlock here made
                      the row look broken rather than protected, and the locked
                      state is already carried by the name slot and the Unlock
                      button. Locked rows show a generic person mark, NOT the
                      candidate's photo: a real face is the strongest re-identifier
                      on the card, findable by eye or by reverse image search. */}
                  <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px]', cv.unlocked ? 'bg-brand-soft font-semibold text-brand' : 'bg-canvas text-faint')}>
                    {cv.unlocked ? cv.name.split(' ').slice(-1)[0][0] : <User className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    {/* SAME layout locked and unlocked — the name SLOT stays, only
                        its content changes. Locked shows "Ứng viên #A2F91" in the
                        name position: scannable as a name, obviously not one, and
                        it never shows a surname — "Trần ○○" plus a named hospital
                        and an age is one LinkedIn search from a free unlock. */}
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      {cv.unlocked ? (
                        <p className={cn('truncate text-[12.5px] font-semibold', cv.recalled ? 'text-muted line-through' : 'text-ink')}>{cv.name}</p>
                      ) : (
                        <p className="truncate text-[12.5px] font-semibold tracking-wide text-ink/60">Ứng viên #{cv.id}</p>
                      )}
                      <span className="text-[11px] text-muted">{cv.gender} · {cv.age} tuổi</span>
                      <span className="text-faint">·</span>
                      <span className="text-[11px] font-medium text-ink/80">{cv.years}</span>
                      {cv.unlocked && !cv.recalled && <Chip tone="green">Unlocked</Chip>}
                      {cv.recalled && <Chip tone="rose">Đã thu hồi · hoàn 1 lượt unlock</Chip>}
                    </div>
                    {/* DESIRED ROLE, labelled — not a free-text headline. Unlabelled
                        it read as a second job title and duplicated the current
                        role on the line below; and it is the field the "Desired
                        job role" facet filters on, so the card has to show what
                        the search matched. Enum from the Job category → Role
                        master data, which is why it never carries qualifiers
                        like "(mới tốt nghiệp)" — seniority is the `years` slot. */}
                    <p className="truncate text-[11.5px] text-muted">
                      <span className="text-faint">Desired role: </span>
                      <span className="font-medium text-ink/80">{cv.desiredRole}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    {/* No View on a recalled CV, and no Unlock either: the document
                        is withdrawn, and offering to spend a credit on it again
                        would be selling something we have just taken back. */}
                    {cv.recalled
                      ? <span className="text-[11px] text-faint">Không còn khả dụng</span>
                      : cv.unlocked
                        ? <Btn onClick={() => setViewing(true)}>View CV</Btn>
                        : <Btn primary onClick={() => setViewing(true)}>Unlock</Btn>}
                  </div>
                </div>

                {/* the career record — work history, education, skills.
                    The EMPLOYER NAME is the strongest identifier on the card —
                    "Điều dưỡng trưởng khoa Ngoại at BV Quốc tế Mỹ, nữ, 34" is a
                    unique person. Locked rows get the employer TYPE and city
                    instead, which is what a recruiter screens on anyway; the
                    name arrives with the unlock. Same for the school. */}
                <div className="mt-2.5 space-y-2 pl-[52px]">
                  {/* CURRENT job in full: company · title, then period + employment
                      status, then exactly ONE line of description. */}
                  <div className="min-w-0">
                    <p className="truncate text-[12px]">
                      <b className="font-semibold text-ink">{cv.unlocked ? cv.company.name : cv.company.masked}</b>
                      <span className="text-muted"> · {cv.company.title}</span>
                    </p>
                    {/* No employment-status badge: the period already says it.
                        "03/2023 – nay" is still employed; an end date is not. */}
                    <p className="text-[10.5px] text-muted">{cv.company.period}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{cv.company.desc}</p>
                  </div>

                  {/* EARLIER jobs — PLAIN TEXT, not chips: company · title (total
                      duration). A boxed chip reads as a tag you can act on; these
                      are just the rest of the career, so they stay quiet. No
                      description — the current job is the one being judged.
                      Overflow → +N. */}
                  {(cv.prior.length > 0 || cv.morePrior) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10.5px] text-muted">
                      {cv.prior.map((p) => (
                        <span key={p.name} className="max-w-full truncate">
                          {cv.unlocked ? p.name : p.masked} · {p.title} <span className="text-faint">({p.dur})</span>
                        </span>
                      ))}
                      {cv.morePrior && <span className="cursor-pointer font-medium text-brand">+{cv.morePrior}</span>}
                    </div>
                  )}

                  <CvBlock label="Education">
                    <p className="truncate">
                      <b className="font-semibold">{cv.unlocked ? cv.education.school : cv.education.masked}</b> · {cv.education.degree}{' '}
                      <span className={cn('ml-0.5 rounded border px-1 py-px text-[9.5px] font-medium', cv.education.expected ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-line bg-canvas text-muted')}>
                        {cv.education.status}
                      </span>
                    </p>
                  </CvBlock>
                  <CvBlock label="Skills">
                    <div className="flex flex-wrap items-center gap-1">
                      {cv.skills.map((s) => <Chip key={s}>{s}</Chip>)}
                      {cv.more && <span className="text-[10.5px] text-brand">+{cv.more}</span>}
                    </div>
                  </CvBlock>
                </div>

                {/* Desired location + expected salary — two of the client's six
                    Desired-work-condition fields. There is deliberately no
                    "availability" chip: it is not one of the 15 candidate-data
                    fields, so we do not hold it. */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2 pl-[52px]">
                  <Chip tone="blue">Desired location: {cv.loc}</Chip>
                  <Chip tone="amber">{cv.salary}</Chip>
                  <span className="ml-auto text-[10.5px] text-faint">Updated {cv.updated}</span>
                </div>
              </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* A currency-scoped salary query hides rows. Say so, and offer the way
              to see them — counting them needs no exchange rate, and silence here
              reads as "there is nobody else". */}
          <div className="mt-3 rounded-md border border-line bg-canvas/50 px-3 py-2 text-[11px] text-muted">
            <b className="text-ink">{otherCurrency} candidates</b> ask in USD and are not shown, because salaries are never converted between currencies.
            <span className="ml-1 cursor-pointer font-medium text-brand">Switch to USD to see them →</span>
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
              <Field label="Locations (3 offices)" req value="Tên · tỉnh/thành · địa chỉ · toạ độ ✓ (geocode khi lưu)" />
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

              {/* Văn phòng — the ONE-office layout, which is the common case: a single
                  horizontal card, no list column, and no "Trụ sở chính" label (naming it
                  HQ implies there are others). The open-job count is what makes the
                  address useful — a jobseeker picks employers by what they can commute to. */}
              <p className="mt-3 text-[11px] font-bold text-ink">Văn phòng</p>
              <div className="mt-1.5 grid grid-cols-[1fr_0.9fr] gap-2 rounded-md border border-line p-2">
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium leading-snug">12 Nguyễn Huệ, Quận 1</p>
                  <p className="text-[10px] text-faint">TP. Hồ Chí Minh</p>
                  <p className="mt-1 text-[10px] font-semibold text-brand">Đang tuyển 4 vị trí tại đây</p>
                  <p className="mt-1 text-[10px] font-semibold text-brand">Chỉ đường ↗</p>
                </div>
                {/* static map image, click-through to Google Maps — no map SDK on the
                    public page, so no key exposed and no per-view quota */}
                <div className="grid min-h-[54px] place-items-center rounded bg-line/60 text-[9.5px] text-faint">Bản đồ tĩnh</div>
              </div>
              <p className="mt-1 text-[10px] italic text-faint">2–3 offices → list + map; 4+ → tabs by city. One office never renders the list column.</p>
              <p className="mt-3 text-[10.5px] italic text-faint">Story, video, growth chart and leaders are empty → those sections do not render.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-brand">Same company record as CRM & Admin — one source of truth. Resume-Search-only customers don't get this page.</div>
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
                {r.admin && <Chip tone="blue">Super admin</Chip>}
              </button>
            ))}
          </div>
        </div>
        {/* permission builder */}
        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <input value={role.name} readOnly={!editable} onChange={(e) => setRoles((rs) => rs.map((r, i) => (i === sel ? { ...r, name: e.target.value } : r)))} className={cn('min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-[13px] font-semibold text-ink', editable ? 'border-line' : 'border-transparent bg-transparent')} />
            {role.admin && <span className="shrink-0 text-[11px] text-faint">Super admin · full access, can’t be edited</span>}
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
            <p className="text-[12.5px] font-bold">Job Posting — Pro</p>
            <Chip tone="green">Active</Chip>
          </div>
          <div className="flex justify-between text-[11.5px]"><span className="text-muted">Posting slots left</span><b className="tabular-nums">7 / 10</b></div>
          <Bar pct={70} />
          <p className="mt-2 text-[10.5px] text-faint">One slot is spent each time a job goes Open. Valid until 31/12/2026.</p>
          <div className="mt-3 flex gap-2"><Btn primary onClick={() => go('co-post-job')}>+ Post a job</Btn><Btn>Buy more slots</Btn></div>
        </div>
        <div className="rounded-xl border border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] font-bold">Resume Search — 6 months</p>
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
            ['', 'CV unlock — Nguyễn Thị Hoa (Điều dưỡng viên)', 'Linh Trần', '05/08/2026', '−1 unlock · 62 left'],
            ['', 'Job opened — Điều dưỡng viên (Khoa Nội)', 'Minh Phạm', '01/08/2026', '−1 slot · 7 left'],
            ['', 'CV unlock — Trần Văn B. (Kỹ thuật viên XN)', 'Linh Trần', '29/07/2026', '−1 unlock · 63 left'],
            ['', 'Job opened — Bác sĩ Đa khoa', 'Minh Phạm', '25/07/2026', '−1 slot · 8 left'],
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
/* Pre-login: submit a sign-up request. It provisions nothing — HQ places the company
   and emails an activation link (Model B). Two steps: 1) fill the form → Register
   2) request submitted / check your email. */
function StepDots({ step }: { step: 1 | 2 }) {
  const items = ['Create account', 'Request submitted']
  return (
    <div className="mx-auto mb-5 flex max-w-[520px] items-center gap-2">
      {items.map((label, i) => {
        const n = (i + 1) as 1 | 2
        const done = step > n
        const active = step === n
        return (
          <Fragment key={label}>
            <div className="flex items-center gap-2">
              <span className={cn('grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold', active ? 'bg-brand text-white' : done ? 'bg-emerald-500 text-white' : 'border border-line text-faint')}>{done ? '✓' : n}</span>
              <span className={cn('text-[11.5px] font-medium', active || done ? 'text-ink' : 'text-faint')}>{label}</span>
            </div>
            {i === 0 && <span className="h-px flex-1 bg-line" />}
          </Fragment>
        )
      })}
    </div>
  )
}

function SignupScreen() {
  const [step, setStep] = useState<1 | 2>(1)
  const [f, setF] = useState({ name: 'Nguyễn Văn Toàn', email: 'toan@daiduong.vn', phone: '0903 112 456', tax: '0315xxxxxx', company: 'Công ty TNHH Đại Dương', hiring: true })
  const [agree, setAgree] = useState(false)
  const inp = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[12.5px] text-ink placeholder:text-faint'
  const lbl = 'mb-1 block text-[11.5px] font-semibold text-ink/80'
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))

  if (step === 2) {
    const track = [
      { label: 'Signed up', sub: 'Account request received', state: 'done' as const },
      { label: 'Verify your email', sub: `Link sent to ${f.email || 'your email'}`, state: 'now' as const },
      { label: 'Company review', sub: 'Our team sets up your company — usually within 1 business day', state: 'wait' as const },
      { label: 'Ready to sign in', sub: 'We email you — then log in with the password you just set', state: 'wait' as const },
    ]
    return (
      <div className="flex justify-center py-6">
        <div className="w-full max-w-[560px]">
          <StepDots step={2} />
          <div className="rounded-2xl border border-line bg-surface p-7">
            <div className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-[22px] text-emerald-700">✓</span>
              <p className="mt-3 text-[17px] font-bold text-ink">Thanks, {f.name.split(' ').slice(-1)[0] || 'there'}! Your request is in.</p>
              <p className="mx-auto mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-muted">
                First, <b className="text-ink/80">verify your email</b> (we just sent a link). Then our team sets up your company and emails you when you can sign in — here’s where you are:
              </p>
            </div>

            {/* status tracker */}
            <div className="mx-auto mt-5 max-w-[440px] space-y-0">
              {track.map((t, i) => (
                <div key={t.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                      t.state === 'done' ? 'bg-emerald-500 text-white' : t.state === 'now' ? 'bg-brand text-white' : 'border border-line text-faint')}>
                      {t.state === 'done' ? '✓' : i + 1}
                    </span>
                    {i < track.length - 1 && <span className="my-0.5 h-6 w-px bg-line" />}
                  </div>
                  <div className="pb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[12.5px] font-semibold', t.state === 'wait' ? 'text-faint' : 'text-ink')}>{t.label}</span>
                      {t.state === 'now' && <Chip tone="blue">Do this now</Chip>}
                      {t.state === 'wait' && i === 2 && <Chip tone="amber">In review</Chip>}
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted">{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-1 max-w-[440px] rounded-lg bg-brand-soft px-4 py-2.5 text-[11px] leading-relaxed text-brand">
              You won’t be able to log in until both your email is verified <b>and</b> our team has set up your company. We’ll email you at each step — no need to check back.
            </div>
            <div className="mt-5 flex justify-center">
              <button onClick={() => { setStep(1); setAgree(false) }} className="text-[12px] font-medium text-brand hover:underline">← Back to the form</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-6">
      <div className="w-full max-w-[560px]">
        <StepDots step={1} />
        <div className="rounded-2xl border border-line bg-surface p-7">
          <h1 className="text-center text-[22px] font-bold text-brand">Create your employer account</h1>
          <p className="mx-auto mt-1 max-w-[420px] text-center text-[12.5px] text-muted">It only takes a minute to sign up — but it could change your team forever.</p>

          <p className="mt-6 text-[12px] font-bold text-brand">Login information</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div><label className={lbl}>Full name *</label><input className={inp} placeholder="Full name" value={f.name} onChange={set('name')} /></div>
            <div><label className={lbl}>Email *</label><input className={inp} placeholder="you@company.com" value={f.email} onChange={set('email')} /></div>
            <div><label className={lbl}>Phone number *</label><input className={inp} placeholder="09xx xxx xxx" value={f.phone} onChange={set('phone')} /></div>
            <div><label className={lbl}>Password *</label><input type="password" className={inp} placeholder="Password" /></div>
          </div>

          <p className="mt-5 text-[12px] font-bold text-brand">Company information</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div><label className={lbl}>Tax number *</label><input className={inp} placeholder="Business registration no." value={f.tax} onChange={set('tax')} /></div>
            <div><label className={lbl}>Company name *</label><input className={inp} placeholder="Company name" value={f.company} onChange={set('company')} /></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12.5px]">
            <span className="font-semibold text-ink/80">Is your company currently hiring?</span>
            <button type="button" onClick={() => setF((s) => ({ ...s, hiring: true }))} className="flex items-center gap-1.5"><span className={cn('grid h-4 w-4 place-items-center rounded-full border-2', f.hiring ? 'border-brand' : 'border-line')}>{f.hiring && <span className="h-2 w-2 rounded-full bg-brand" />}</span> Yes</button>
            <button type="button" onClick={() => setF((s) => ({ ...s, hiring: false }))} className="flex items-center gap-1.5"><span className={cn('grid h-4 w-4 place-items-center rounded-full border-2', !f.hiring ? 'border-brand' : 'border-line')}>{!f.hiring && <span className="h-2 w-2 rounded-full bg-brand" />}</span> No</button>
          </div>

          <button type="button" onClick={() => setAgree((a) => !a)} className="mt-4 flex items-start gap-2 text-left text-[11.5px] text-muted">
            <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border', agree ? 'border-brand bg-brand text-white' : 'border-line')}>{agree && <span className="text-[10px] leading-none">✓</span>}</span>
            <span>I have read and agree to the <span className="font-medium text-brand">Terms of service</span> and <span className="font-medium text-brand">Privacy Policy</span> of Saramin.</span>
          </button>

          <button onClick={() => agree && setStep(2)} disabled={!agree} className={cn('mt-5 w-full rounded-xl py-3 text-[13px] font-semibold', agree ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-canvas text-faint')}>Register</button>
          <p className="mt-3 text-center text-[12px] text-muted">Already have an account? <span className="font-semibold text-brand">Log in</span></p>
        </div>
      </div>
    </div>
  )
}

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

/* Pre-login entry point — creating a new employer account (login + Unverified company).
   It is NOT part of the logged-in console nav; it is surfaced by its own banner above
   the shell so reviewers can find the sign-up flow. */
const SIGNUP: NavItem = { id: 'co-signup', label: 'Create account', Comp: SignupScreen, flush: true }

/** flat registry of company screens, for embedding in feature detail pages */
export const CO_SCREENS: NavItem[] = [DASHBOARD, SIGNUP, ...NAV_GROUPS.flatMap((g) => g.items)]

/** Resolve a screen id to its {group, item} — the one place that mapping lives. */
function resolveCoScreen(id: string | null): CoActive | null {
  if (!id) return null
  if (id === DASHBOARD.id) return { group: 'Home', item: DASHBOARD }
  if (id === SIGNUP.id) return { group: 'Sign up', item: SIGNUP }
  for (const g of NAV_GROUPS) {
    const item = g.items.find((i) => i.id === id)
    if (item) return { group: g.label, item }
  }
  return null
}

export function CompanyMockups() {
  /* Land on the screen named by `?screen=` so a shared link opens it directly. */
  const [active, setActive] = useState<CoActive>(
    () => resolveCoScreen(initialScreenParam()) ?? { group: 'Home', item: DASHBOARD },
  )
  const Body = active.item.Comp

  /* …and keep the address bar in step as the reader clicks around. */
  useScreenParam(active.item.id)

  /** jump to a screen by id (used by in-screen buttons like "+ Post a job") */
  const go = (id: string) => {
    const next = resolveCoScreen(id)
    if (next) setActive(next)
  }

  const isSignup = active.item.id === SIGNUP.id

  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframe</p>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight">Company mockups</h1>
        </div>
        {/* the link carries the screen on show, not just "the company mockups" */}
        <CopyLinkButton />
      </div>

      {/* console shell — one horizontal nav with dropdowns and a blue CTA. The grey
          utility strip above it (Business home · Career site · Hiring tools · …) was
          Saramin KR's sibling PROPERTIES, not this product's navigation. */}
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        {isSignup ? (
          /* pre-login frame — no logged-in header, just the brand + a way back */
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="text-[19px] font-bold lowercase tracking-tight text-brand">saramin</span>
            <button onClick={() => setActive({ group: 'Home', item: DASHBOARD })} className="text-[12px] font-medium text-muted hover:text-brand">← Back to the logged-in console</button>
          </div>
        ) : (
          <CoHeader active={active} onSelect={setActive} />
        )}

        {/* content */}
        <div className={cn('min-w-0 bg-surface', !active.item.flush && 'p-5')}>
          <CoNav.Provider value={go}>
            <Body />
          </CoNav.Provider>
        </div>
      </div>

      <p className="mt-4 max-w-[72ch] text-[12px] leading-relaxed text-faint">
        This is the company's own console. It can be created two ways: <b>self-serve</b> via the pre-login sign-up above,
        or by Sales in the CRM. Everything here draws on the same company record and pooled quota shown in the Admin &amp; CRM mockups.
      </p>
    </div>
  )
}

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
        {/* Pre-login sign-up entry, kept in the top bar for discoverability. */}
        <span
          onClick={() => onSelect({ group: 'Sign up', item: SIGNUP })}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-brand px-3 py-1.5 text-[12px] font-semibold text-brand hover:bg-brand-soft"
        >
          Create account
        </span>
        {/* No notification bell — removed on the same call as the Admin console's:
            a badge that never changes is decoration, not a signal. */}
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
