import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { CV_STATUS_TONE, DELIVERY_TONE, STAGE_TONE } from '@/pages/admin/data/recruitment'
import { JS_STATUS, JS_USERS } from '@/pages/admin/data/users'
import type { JSSignup, JSStatus, JSUser } from '@/pages/admin/data/users'
import { CandidateProfileModal } from '@/pages/admin/ui/candidateProfile'
import { DetailCard, KV, LField } from '@/pages/admin/ui/fields'
import { ListPage } from '@/pages/admin/ui/list'
import { PoolPickCell } from '@/pages/admin/ui/pickCells'
import { MiniStat } from '@/pages/admin/ui/stats'
import { Pill } from '@/pages/admin/ui/status'
import { Table } from '@/pages/admin/ui/table'

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

export function AdminJobseekers() {
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
      {toast && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11.5px] text-emerald-800">
          <span>{toast}</span>
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

      <ListPage
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New user</button>}
        tabs={[
          { label: 'All', count: users.length, active: true },
          { label: 'Active', count: n('Active') },
          { label: 'Unverified', count: n('Unverified') },
          { label: 'Deactivated', count: n('Deactivated') },
          { label: 'Withdrawn', count: n('Withdrawn') },
        ]}
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
            <span></span><span>The normal path is self sign-up on the Store site. Use this only for support cases (e.g. a seeker who can't complete sign-up) — it does not replace registration.</span>
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
            <span></span><span>We email a set-password link. The seeker <b>sets their own password</b> — no one types it for them. The account stays <b>Unverified</b> until they open the link, then flips to <b>Active</b>.</span>
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={() => valid && onCreate(name.trim(), email.trim())} disabled={!valid} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">Create &amp; send link</button>
        </div>
      </div>
    </div>
  )
}

/** CV STATUS — the four values every CV carries; the same set the Talent pool and
 *  CV review own. Search visibility and application delivery are DERIVED from it. */
type CvSt = 'Qualified' | 'Not enough information' | "Can't read" | 'Rejected'
type Delivery = 'Sent' | 'Not sent' | 'Recall'

/** One seeker account — what My page holds, plus their CVs and applications.
 *  Basic information + Work preference mirror the candidate field sheets (the same
 *  two tables the Talent pool renders). The CV and application tables mirror the
 *  Talent pool and Applicant columns so HQ reads ONE shape everywhere, and the CV
 *  filename opens the same 3-group candidate modal (basic · preference · CV content). */
function JobseekerDetail({ u, onBack, onStatus }: { u: JSUser; onBack: () => void; onStatus: (s: JSStatus) => void }) {
  useDetailCrumb(u.name, onBack)

  /* This screen is ACCESS-ONLY: HQ manages the account, never the candidate's
     content. So the CV / application tables are a READ-ONLY MIRROR — no Approve /
     Reject here. Every CV decision is made on ONE of three pages (Talent pool ·
     CV review · Applicants) and resolves everywhere. The only interaction is the
     CV link, which opens the same read-only candidate modal. */
  const [profile, setProfile] = useState(false)

  const CVS: { cv: string; kind: 'Saramin' | 'Upload'; searchable: boolean; st: CvSt; content: string; unlocks: number; updated: string }[] = [
    { cv: 'CV_NguyenVanAn_Frontend_EN.pdf', kind: 'Upload', searchable: true, st: 'Qualified', content: '3 experience · 8 skills', unlocks: 6, updated: '2 days ago' },
    { cv: 'CV tiếng Việt — Frontend', kind: 'Saramin', searchable: false, st: 'Not enough information', content: '1 experience · 2 skills', unlocks: 0, updated: '3 weeks ago' },
  ]
  const APPS: { job: string; company: string; cv: string; cvSt: CvSt; status: Delivery; stage: string; when: string }[] = [
    { job: 'Senior Frontend Engineer (ReactJS)', company: 'FPT Software', cv: 'CV_NguyenVanAn_Frontend_EN.pdf', cvSt: 'Qualified', status: 'Sent', stage: 'Interview', when: '2h ago' },
    { job: 'Product Manager', company: 'MoMo', cv: 'CV_NguyenVanAn_Frontend_EN.pdf', cvSt: 'Qualified', status: 'Sent', stage: 'Reviewing', when: '5d ago' },
    { job: 'Backend Engineer (Go)', company: 'Shopee', cv: 'CV tiếng Việt — Frontend', cvSt: 'Rejected', status: 'Recall', stage: 'Rejected', when: '2 months ago' },
  ]

  /* The CV name is the ONLY interactive cell — it opens the shared read-only
     candidate modal (basic · preference · CV content). Job / company render as
     links; the row carries no decision. */
  const cvLink = (cv: string) => (
    <span onClick={() => setProfile(true)} title="Opens the candidate record — basic information, work preference and CV content. PII action, logged" className="min-w-0 cursor-pointer truncate text-brand hover:underline">{cv}</span>
  )
  const extLink = (label: string) => <span className="min-w-0 cursor-pointer truncate text-brand hover:underline" title="Opens in a new tab">{label}</span>

  return (
    <div className="max-w-[1160px]">
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
        <MiniStat label="CVs" value={u.resumes || '—'} sub={`${CVS.filter((c) => c.searchable).length} searchable`} />
        <MiniStat label="Applications" value={u.applications || '—'} sub="all time" />
        <MiniStat label="CV unlocks" value={String(CVS.reduce((n, c) => n + c.unlocks, 0))} sub="by employers" />
        <MiniStat label="Joined" value={u.joined} sub={`via ${u.signup}`} />
        <MiniStat label="Last login" value={u.last} sub="web · Chrome" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* CARD 1 — Basic information: the 9-field sign-up sheet, the same shape the
            candidate modal and Talent pool render, plus the two account-only facts
            (verified, sign-up) that make this the ACCOUNT view. */}
        <DetailCard title="Basic information">
          <KV label="Full name" value={u.name} />
          <KV label="Email (login)" value={u.email} />
          <KV label="Phone" value={u.phone} />
          <KV label="Nationality" value="Vietnamese" />
          <KV label="Gender" value="Male" />
          <KV label="Marital status" value="Single" />
          <KV label="Date of birth" value="12/04/1996" />
          <KV label="Highest education" value="Bachelor" />
          <KV label="Years of experience" value="4 yrs" />
          <KV label="Email verified" value={u.status === 'Unverified' ? 'No — verification pending' : 'Yes'} />
          <KV label="Sign-up method" value={u.signup === 'Email' ? 'Email + password' : `${u.signup} (social login)`} />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Read-only for HQ. HQ never sees or sets a password — reset is a self-service email link; social-login accounts have no password at all.
          </p>
        </DetailCard>

        {/* CARD 2 — Work preference: the 6-field onboarding sheet. */}
        <DetailCard title="Work preference">
          <div className="mb-2"><Meter pct={u.complete} /></div>
          <KV label="Desired job role" value="Senior Frontend Engineer" />
          <KV label="Desired job category" value="Information Technology" />
          <KV label="Desired industry" value="IT / Software" />
          <KV label="Desired work location" value="Hồ Chí Minh · Remote" />
          <KV label="Expected salary" value="35 – 45 tr VND / month" />
          <KV label="Desired work type" value="In office" />
          <p className="mt-2 rounded-md bg-canvas/70 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
            Read-only for HQ. The seeker edits these on My page; the vocabularies come from Master data.
          </p>
        </DetailCard>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">CVs / resumes</p>
        <Table
          minW={880}
          cols={[
            { label: 'CV', w: '1.9fr' },
            { label: 'CV status', w: '1fr' },
            { label: 'Talent pool', w: '1fr' },
            { label: 'CV content', w: '1.1fr' },
            { label: 'Unlocks', w: '0.7fr', align: 'r' },
            { label: 'Updated', w: '0.9fr', align: 'r' },
          ]}
          rows={CVS.map((c) => [
            cvLink(c.cv),
            <Pill tone={CV_STATUS_TONE[c.st]}>{c.st}</Pill>,
            <PoolPickCell picked={c.searchable} />,
            <span className="text-[11.5px] text-muted">{c.content}</span>,
            <span className="tabular-nums">{c.unlocks || '—'}</span>,
            <span className="text-[11.5px] text-muted">{c.updated}</span>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Read-only mirror. Opening a CV is a PII view — logged with the operator, the record and the timestamp. Talent pool is the candidate's own choice — which one CV they flag for CV Search (Đã chọn / Chưa chọn); HQ never sets it. HQ never decides a CV here either — Approve / Reject lives on Talent pool, CV review and Applicants, and one verdict there resolves every application using the CV.</p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[12.5px] font-bold">Applications</p>
        <Table
          minW={1040}
          cols={[
            { label: 'Job', w: '1.8fr' },
            { label: 'Company', w: '1fr' },
            { label: 'CV', w: '1.5fr' },
            { label: 'CV status', w: '1fr' },
            { label: 'Application status', w: '1fr' },
            { label: 'Pipeline status', w: '1fr' },
            { label: 'Applied', w: '0.7fr', align: 'r' },
          ]}
          rows={APPS.map((a) => [
            extLink(a.job),
            extLink(a.company),
            cvLink(a.cv),
            <Pill tone={CV_STATUS_TONE[a.cvSt]}>{a.cvSt}</Pill>,
            <Pill tone={DELIVERY_TONE[a.status]}>{a.status}</Pill>,
            a.status === 'Sent' ? <Pill tone={STAGE_TONE[a.stage] ?? 'draft'}>{a.stage}</Pill> : <span className="text-faint" title="Not on the employer dashboard — the funnel no longer applies">—</span>,
            <span className="text-[11.5px] text-muted">{a.when}</span>,
          ])}
        />
        <p className="mt-2 text-[11px] text-faint">Read-only mirror of the candidate's applications. Application status is Saramin's (Sent / Not sent / Recall), derived from the CV; Pipeline status is the employer's funnel. HQ makes no decision here — the CV verdict is taken on Applicants (or Talent pool / CV review).</p>
      </div>

      {profile && <CandidateProfileModal name={u.name} onClose={() => setProfile(false)} />}
    </div>
  )
}
