import { useState } from 'react'
import { Browser, JsHeader, JobCard, Btn, Chip, SectionTitle, NavContext, useNav } from '@/components/wire'
import { cn } from '@/lib/utils'

/* ── Jobseeker screens (VN recruitment standard) ─────────────────────────── */

/* ── My page left rail ───────────────────────────────────────────────────────
   ONE definition, shared by every My-page screen. Each screen used to declare its
   own menu array, and they disagreed — different item counts, "My page" vs
   "Dashboard" for the same destination, and My CVs / My Profile swapping order —
   so the rail reshuffled under the cursor as you clicked through it. A nav that
   changes shape when you use it is not a nav.

   `active` is the CURRENT SCREEN ID, so the highlight is derived from where you
   are rather than a hardcoded index that has to be kept in sync by hand. */
const MY_PAGE_MENU: { label: string; screen?: string }[] = [
  { label: 'My page', screen: 'js-mypage' },
  // "My Profile" is NOT a nav destination: My CVs already shows the profile
  // summary, and the profile is edited from there ("✎ Edit profile").
  { label: 'My CVs', screen: 'js-my-cvs' },
  { label: 'My applications', screen: 'js-applications' },
  { label: 'Saved jobs' },
  { label: 'Settings' },
]

/** Identity card + visibility toggle + menu. Identical on every My-page screen.
    The toggle lives here rather than on one screen because "let recruiters find
    me" is one candidate-wide consent, not a per-page setting (see the Resume
    management module: visibility is stored on the candidate). */
function MyPageRail({ active }: { active: string }) {
  const go = useNav()
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line p-4 text-center">
        <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-brand to-violet-500" />
        <p className="text-[13px] font-bold text-ink">Trần Minh Anh</p>
        <p className="text-[11px] text-muted">Product Designer</p>
        <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-canvas/50 px-2.5 py-2 text-left">
          <span className="text-[11px] font-medium text-ink/80">Let recruiters find me</span>
          <span className="relative h-4 w-7 shrink-0 rounded-full bg-emerald-500"><span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" /></span>
        </div>
      </div>
      <div className="rounded-xl border border-line p-2">
        {MY_PAGE_MENU.map(({ label, screen }) => {
          const isActive = screen === active
          return (
            <p
              key={label}
              onClick={() => screen && !isActive && go(screen)}
              className={cn(
                'rounded px-3 py-1.5 text-[12.5px]',
                screen && !isActive && 'cursor-pointer hover:bg-canvas/70',
                isActive ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70',
              )}
            >
              {label}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function HomeScreen() {
  const go = useNav()
  return (
    <div>
      <JsHeader active="Jobs" />
      {/* hero search */}
      <div className="bg-brand-soft px-5 py-7">
        <p className="text-[18px] font-bold text-ink">Find your next job</p>
        <p className="text-[12.5px] text-muted mb-3">Thousands of jobs from top companies in Vietnam</p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-[720px]">
          <div className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-faint">🔍 Job title, skill, company…</div>
          <div className="w-full sm:w-44 rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-faint">📍 All locations</div>
          <Btn primary className="px-5" onClick={() => go('js-search')}>Search</Btn>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Chip>IT</Chip><Chip>Sales</Chip><Chip>Marketing</Chip><Chip>Finance</Chip><Chip>Remote</Chip>
        </div>
      </div>
      {/* long banner */}
      <div className="px-5 pt-4">
        <div className="grid h-20 place-items-center rounded-lg border border-dashed border-line bg-canvas/50 text-[11px] text-faint">Long banner (Admin-managed)</div>
      </div>
      {/* hot jobs */}
      <div className="px-5 py-4">
        <SectionTitle more>Hot jobs</SectionTitle>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <JobCard title="Senior Frontend Engineer" company="FPT Software" salary="30 – 45 tr" onClick={() => go('js-job-detail')} />
          <JobCard title="Digital Marketing Lead" company="Tiki" salary="Thỏa thuận" location="Hà Nội" onClick={() => go('js-job-detail')} />
          <JobCard title="Accountant" company="VNG" salary="18 – 25 tr" onClick={() => go('js-job-detail')} />
          <JobCard title="Product Manager" company="MoMo" salary="Up to 60 tr" onClick={() => go('js-job-detail')} />
        </div>
      </div>
      {/* top companies */}
      <div className="px-5 pb-6">
        <SectionTitle more>Top companies</SectionTitle>
        <div className="flex gap-2.5 overflow-x-auto">
          {[
            ['FPT Software', 'IT · 30,000+'],
            ['Shopee', 'E-commerce'],
            ['Techcombank', 'Banking'],
            ['VNG', 'Technology'],
            ['Vinamilk', 'FMCG'],
          ].map(([name, meta]) => (
            <div key={name} className="w-32 shrink-0 rounded-lg border border-line p-3 text-center">
              <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-canvas" />
              <p className="truncate text-[12px] font-semibold text-ink">{name}</p>
              <p className="truncate text-[10.5px] text-muted">{meta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchScreen() {
  const go = useNav()
  return (
    <div>
      <JsHeader active="Jobs" />
      <div className="flex items-center gap-2 border-b border-line px-5 py-3">
        <div className="flex-1 rounded-md border border-line px-3 py-2 text-[12px] text-faint">🔍 "frontend"</div>
        <div className="w-40 rounded-md border border-line px-3 py-2 text-[12px] text-faint">📍 Hồ Chí Minh</div>
        <Btn primary>Search</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
        {/* filters */}
        <div className="border-b md:border-b-0 md:border-r border-line-soft p-4 space-y-4">
          <p className="text-[12px] font-bold">Filters</p>
          {([
            ['Location', ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']],
            ['Category / industry', ['IT – Software', 'Marketing', 'Finance']],
            ['Salary range', ['Under 15 tr', '15 – 30 tr', 'Over 30 tr']],
            ['Experience level', ['Intern / Fresher', '1 – 3 years', '3+ years']],
            ['Job type', ['Full-time', 'Part-time', 'Contract']],
            ['Work arrangement', ['On-site', 'Hybrid', 'Remote']],
            ['Posted date', ['Last 24 hours', 'Last 7 days', 'Last 30 days']],
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
        {/* results */}
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12.5px] text-muted"><span className="font-semibold text-ink">1,248</span> jobs found</p>
            <div className="flex items-center gap-2 text-[11.5px] text-muted">Sort: <Chip tone="blue">Most recent</Chip><Chip>Relevance</Chip></div>
          </div>
          <div className="space-y-2.5">
            <JobCard title="Frontend Engineer (ReactJS)" company="Shopee" salary="25 – 40 tr" onClick={() => go('js-job-detail')} />
            <JobCard title="Senior Frontend Developer" company="Grab" salary="Thỏa thuận" onClick={() => go('js-job-detail')} />
            <JobCard title="Frontend Intern" company="Base.vn" salary="8 – 12 tr" onClick={() => go('js-job-detail')} />
            <JobCard title="Fullstack (FE-heavy)" company="Techcombank" salary="30 – 50 tr" onClick={() => go('js-job-detail')} />
            <JobCard title="UI Engineer" company="One Mount" salary="Up to 45 tr" onClick={() => go('js-job-detail')} />
          </div>
          <div className="mt-4 flex justify-center gap-1.5">
            {['1', '2', '3', '…', '25'].map((p) => (
              <span key={p} className={cn('grid h-7 w-7 place-items-center rounded border text-[11.5px]', p === '1' ? 'border-brand bg-brand text-white' : 'border-line text-muted')}>{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function JobDetailScreen() {
  const go = useNav()
  return (
    <div>
      <JsHeader active="Jobs" />
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 p-5">
        <div className="min-w-0">
          {/* header card */}
          <div className="rounded-xl border border-line p-4">
            <div className="flex gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-canvas text-[10px] text-faint">LOGO</div>
              <div className="min-w-0">
                <p className="text-[16px] font-bold text-ink">Senior Frontend Engineer</p>
                <p className="text-[12.5px] text-muted">FPT Software</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Chip tone="green">30 – 45 tr</Chip><Chip>Hồ Chí Minh</Chip><Chip>3+ years</Chip><Chip>Full-time</Chip>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Btn primary className="flex-1" onClick={() => go('js-apply')}>Apply now</Btn>
              <Btn>♡ Save</Btn>
            </div>
            <p className="mt-2 text-[11px] text-faint">Deadline: 31/08/2026</p>
          </div>
          {/* body */}
          {([
            ['Job description', [
              'Build and maintain high-traffic web apps with React and TypeScript.',
              'Work with designers and PMs to ship features end-to-end.',
              'Own performance, accessibility and code quality on the frontend.',
            ]],
            ['Requirements', [
              '3+ years building production React applications.',
              'Strong TypeScript, HTML/CSS and REST/GraphQL skills.',
              'Good English reading & written communication.',
            ]],
            ['Benefits', [
              '13th-month salary and performance bonus.',
              'Premium health insurance for you and your family.',
              'Hybrid working — 2 days remote per week.',
            ]],
          ] as [string, string[]][]).map(([h, items]) => (
            <div key={h} className="mt-4">
              <p className="mb-2 text-[13.5px] font-bold text-ink">{h}</p>
              <ul className="space-y-1 text-[12px] leading-relaxed text-muted">
                {items.map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-faint">•</span><span>{t}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* right rail */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12px] font-bold">About the company</p>
            <div className="mb-2 h-10 w-10 rounded-md bg-canvas" />
            <p className="text-[12px] font-semibold text-ink">FPT Software</p>
            <p className="text-[11px] leading-relaxed text-muted">Vietnam's leading IT services &amp; software outsourcing company.</p>
            <div className="mt-2"><Chip>10,000+ staff</Chip></div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12px] font-bold">Similar jobs</p>
            <div className="space-y-2 text-[11.5px]">
              <p className="text-ink">React Native Developer · MoMo</p>
              <p className="text-ink">Frontend Lead · Tiki</p>
              <p className="text-ink">Web Engineer · Grab</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Apply-modal form primitives ─────────────────────────────────────────────
   The apply modal collects the full profile, grouped VietnamWorks-style: a
   numbered section per topic rather than one long field run, so ~24 fields stay
   scannable. Labels only — no helper copy. */
function ApplyGroup({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">{n}</span>
        <h4 className="text-[12px] font-semibold text-ink">{title}</h4>
      </div>
      {children}
    </section>
  )
}

/** Two-column field grid inside a group. */
function ApplyFields({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 rounded-md border border-line p-2.5">{children}</div>
}

type AFieldKind = 'text' | 'select' | 'seg' | 'phone' | 'money'
function AField({ label, req, value, kind = 'text', options, full, lock, unit }: {
  label: string
  req?: boolean
  value?: string
  kind?: AFieldKind
  /** segmented control options (kind="seg") */
  options?: [string, string]
  /** span both columns */
  full?: boolean
  /** provider-locked, e.g. an email that came from social sign-up */
  lock?: string
  /** trailing unit, e.g. USD/month */
  unit?: string
}) {
  const filled = !!value
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-[10.5px] font-medium text-ink/70">
        {label}{req && <span className="text-rose-500"> *</span>}
      </label>
      {kind === 'seg' && options ? (
        <div className="flex gap-1.5">
          {options.map((o) => (
            <span key={o} className={cn('flex-1 rounded-md border px-2 py-1.5 text-center text-[11px]', o === value ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted')}>{o}</span>
          ))}
        </div>
      ) : kind === 'phone' ? (
        <div className="flex items-center gap-1.5">
          <span className="flex shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 py-1.5 text-[11.5px] text-ink/80">🇻🇳 +84 <span className="text-faint">▾</span></span>
          <div className={cn('min-w-0 flex-1 rounded-md border bg-surface px-2.5 py-1.5 text-[11.5px]', filled ? 'border-line text-ink/80' : 'border-brand/50 text-faint')}>{value || 'Enter your phone number'}</div>
        </div>
      ) : (
        <div className={cn('flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11.5px]', lock ? 'border-line bg-canvas/60 text-muted' : filled ? 'border-line bg-surface text-ink/80' : 'border-line bg-surface text-faint')}>
          <span className="min-w-0 flex-1 truncate">{value || (kind === 'select' ? 'Please select…' : 'Enter…')}</span>
          {lock && <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[9px] font-medium text-faint">🔒 {lock}</span>}
          {unit && <span className="shrink-0 border-l border-line pl-1.5 text-[10px] text-faint">{unit}</span>}
          {kind === 'select' && !lock && <span className="shrink-0 text-faint">▾</span>}
        </div>
      )}
    </div>
  )
}

function ApplyScreen() {
  const go = useNav()
  const [cv, setCv] = useState<'saramin' | 'portfolio' | 'meet' | 'new'>('saramin')
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40"><JobDetailScreen /></div>
      {/* modal */}
      <div className="absolute inset-0 flex items-start justify-center bg-black/25 px-4 pt-8">
        <div className="flex max-h-[590px] w-full max-w-[460px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-[14px] font-bold text-ink">Apply for this job</p>
              <p className="text-[11px] text-muted">Senior Frontend Engineer · FPT Software</p>
            </div>
            <span className="cursor-pointer text-faint" onClick={() => go('js-job-detail')}>✕</span>
          </div>

          {/* body (scrolls) */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-thin p-4">
            {/* Your CV — choose which CV to send (Saramin CV or an uploaded CV) */}
            <ApplyGroup n={1} title="Your CV">
              <div className="space-y-1.5">
                {([
                  ['saramin', 'Saramin CV', 'Structured profile · 70% complete'],
                  ['portfolio', '📄 Portfolio.pdf', 'Uploaded 26/07/2026 · 1.2 MB'],
                  ['meet', '📄 CV_TranMinhAnh.pdf', 'Uploaded 12/01/2024'],
                ] as const).map(([id, label, sub]) => (
                  <label
                    key={id}
                    onClick={() => setCv(id)}
                    className={cn('flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2', cv === id ? 'border-brand bg-brand-soft' : 'border-line')}
                  >
                    <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', cv === id ? 'border-brand' : 'border-line')}>{cv === id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-ink">{label}</span>
                      <span className="block truncate text-[11px] text-faint">{sub}</span>
                    </span>
                    {id === 'saramin' && <Chip tone="green">Saramin</Chip>}
                  </label>
                ))}
                {/* create a new CV — opens the SAME Add-new-CV screen as My CVs */}
                <button
                  onClick={() => go('js-add-cv')}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-line px-3 py-2 text-left hover:border-brand/50"
                >
                  <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2 border-line text-[10px] font-bold text-brand">＋</span>
                  <span className="flex-1 text-[12px] text-muted">Add a new CV <span className="text-faint">— upload or build (same as My CVs)</span></span>
                  <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-brand">Open</span>
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-faint">.doc, .docx, .pdf · max 5 MB · no password protection.</p>
            </ApplyGroup>

            {/* Application information — the SLIM profile set only (the decided
                field tiers — no demographics, no address, no "current position"
                fields: those are derived from the CV, never asked). Everything
                arrives pre-filled from the Profile; phone is the one field a
                social sign-up always has to add. */}
            <ApplyGroup n={2} title="Application information">
              <ApplyFields>
                <AField label="Full name" req value="Trần Minh Anh" full />
                <AField label="Email" req value="minhanh@gmail.com" lock="Google" />
                <AField label="Phone" req kind="phone" />
                <AField label="Province / City" req kind="select" value="Hồ Chí Minh" />
                <AField label="Years of experience" req value="4" unit="years" />
                <AField label="Highest degree" req kind="select" value="Bachelor" />
              </ApplyFields>
              <p className="mt-1 text-[10px] text-faint">Pre-filled from your profile — confirm once. Your title, level and industry are read from your CV automatically.</p>
            </ApplyGroup>

            <ApplyGroup n={3} title="Desired job">
              <ApplyFields>
                <AField label="Desired work location" req kind="select" value="Hồ Chí Minh" />
                <AField label="Desired level" req kind="select" value="Trưởng nhóm" />
                <AField label="Desired industry" req kind="select" value="IT / Software" />
                <AField label="Desired field" req kind="select" />
                <AField label="Desired salary" unit="tr/month" />
                <AField label="Availability" kind="select" value="1 month" />
              </ApplyFields>
            </ApplyGroup>

            <ApplyGroup n={4} title="Cover message">
              <div className="h-14 rounded-md border border-line bg-canvas/40" />
            </ApplyGroup>

            {/* consent */}
            <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
              <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />
              I agree to share my profile &amp; CV with this employer, per Saramin's privacy policy.
            </label>
          </div>

          {/* footer */}
          <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
            <Btn onClick={() => go('js-job-detail')}>Cancel</Btn>
            <Btn primary onClick={() => go('js-applications')}>Submit application</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

function MyPageScreen() {
  const go = useNav()
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-mypage" />
        <div className="space-y-4">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-1.5 text-[13px] font-bold">Profile completeness</p>
            <div className="h-2 w-full rounded-full bg-canvas"><div className="h-2 w-[70%] rounded-full bg-brand" /></div>
            <p className="mt-1 text-[11.5px] text-muted">70% — add work experience to improve visibility.</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <SectionTitle more>My CV &amp; Profile</SectionTitle>
            <div className="space-y-2">
              {/* uploaded CV — the file recruiters read */}
              <div onClick={() => go('js-profile-cv')} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 hover:border-brand/40">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-rose-50 text-[13px]">📄</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-ink">Portfolio.pdf</p>
                  <p className="text-[11px] text-muted">Your uploaded CV · what recruiters read</p>
                </div>
              </div>
              {/* saramin CV — optional structured profile */}
              <div onClick={() => go('js-profile-cv')} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 hover:border-brand/40">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-canvas text-[13px]">🧬</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-ink">Saramin CV</p>
                  <p className="text-[11px] text-muted">Structured profile · optional</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <SectionTitle more>Recent applications</SectionTitle>
            <div className="space-y-2">
              {([
                ['Senior Frontend Engineer · FPT', 'Applied'],
                ['Product Manager · MoMo', 'Screening'],
                ['UI Engineer · One Mount', 'Sent to employer'],
              ] as [string, string][]).map(([job, s]) => (
                <div key={job} className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                  <span className="truncate text-[11.5px] text-ink">{job}</span>
                  <Chip tone="amber">{s}</Chip>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A section card for the Saramin CV. `action` hides when empty (read-only recruiter view); `badge` shows an impact ↑%. */
function CvSection({ title, action = 'Edit', badge, onAction, children }: { title: string; action?: string; badge?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <h4 className="text-[14px] font-bold text-ink">{title}</h4>
        {badge && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">↑ {badge}</span>}
        {action && <span onClick={onAction} className="ml-auto cursor-pointer text-[11px] font-medium text-brand">{action}</span>}
      </div>
      {children}
    </div>
  )
}

/** Tiered completeness bar — motivates with impact, not a vanity %. */
function CompletenessBar() {
  const tiers = ['Cơ bản', 'Trung bình', 'Tương đối hoàn chỉnh', 'Hoàn chỉnh']
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h4 className="text-[15px] font-bold text-ink">Hoàn chỉnh hồ sơ</h4>
      <div className="mt-2 flex justify-between text-[10px] text-muted">
        {tiers.map((t, i) => <span key={t} className={cn(i === 2 && 'font-semibold text-brand')}>{t}</span>)}
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full bg-brand" style={{ width: '72%' }} />
      </div>
      <p className="mt-2 text-[11.5px] text-muted"><b className="text-ink">72% · Tương đối hoàn chỉnh.</b> Fill these to get seen more:</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {([['+ Skill years', '+40% searches'], ['+ Languages', '+10% matches'], ['+ References', 'more trust']] as [string, string][]).map(([label, impact]) => (
          <span key={label} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-ink/80">{label} → <b className="text-emerald-600">{impact}</b></span>
        ))}
      </div>
    </div>
  )
}

/* The eight optional CV sections, with the completeness impact that justifies
   filling each one. ONE definition, read by BOTH My Profile and the Create-CV
   builder — the two screens must offer the same sections in the same order with
   the same stated payoff, or the candidate is told two different stories about
   what a complete CV is. Field lists for these live in SECTION_EDITORS. */
export const OPTIONAL_CV_SECTIONS: { title: string; pct: string; desc: string; icon: string }[] = [
  { title: 'Foreign Language', pct: '10%', desc: 'Provide your language skills and proficiencies', icon: '🌐' },
  { title: 'Highlight Project', pct: '5%', desc: 'Showcase your highlight project', icon: '📁' },
  { title: 'Certificates', pct: '5%', desc: 'Provide evidence of your specific expertise and skills', icon: '📜' },
  { title: 'Awards', pct: '5%', desc: 'Highlight your awards or recognitions', icon: '🏆' },
  { title: 'Activities', pct: '3%', desc: 'Volunteering, clubs & communities you take part in', icon: '🎯' },
  { title: 'Publications', pct: '2%', desc: 'Articles or papers you have published', icon: '📰' },
  { title: 'References', pct: '3%', desc: 'People who can vouch for your work', icon: '👥' },
  { title: 'Recommendations', pct: '5%', desc: 'Ask colleagues to recommend you', icon: '⭐' },
]

/** Empty-section prompt with an impact ↑% (why it's worth filling). */
function EmptySection({ title, desc, pct, icon, onAdd }: { title: string; desc: string; pct: string; icon: string; onAdd?: () => void }) {
  return (
    <div onClick={onAdd} className={cn('flex items-center gap-3 rounded-xl border border-line bg-surface p-4', onAdd && 'cursor-pointer')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-bold text-ink">{title}</h4>
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">↑ {pct}</span>
        </div>
        <p className="mt-0.5 text-[11.5px] text-faint">{desc}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-50 text-[16px] opacity-60">{icon}</span>
      <button className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-[1.5px] border-brand text-[13px] font-bold text-brand">+</button>
    </div>
  )
}

/* ── Section editors ─────────────────────────────────────────────────────────
   The real field list per profile section, so the edit sheet shows what is
   actually being asked for instead of three grey placeholder bars. Field names
   and enums track the Saramin standard model in the Resume management module —
   if a field changes there, it changes here.

   `hint` is used where the field carries a rule worth stating at the point of
   entry (taxonomy resolution, what recruiters can search, what AI cannot read). */
type EditField = {
  label: string
  req?: boolean
  kind?: 'text' | 'area' | 'select' | 'month' | 'toggle' | 'tags' | 'file'
  value?: string
  options?: string[]
  hint?: string
  half?: boolean
}
type EditSpec = { intro?: string; repeatable?: boolean; note?: string; fields: EditField[] }

const SECTION_EDITORS: Record<string, EditSpec> = {
  'Profile header': {
    intro: 'Who you are, and the line recruiters see first in search results.',
    fields: [
      { label: 'Full name', req: true, value: 'Trần Minh Anh' },
      { label: 'Headline / current title', req: true, value: 'Product Designer', hint: 'The primary keyword field for recruiter search — write the role, not a slogan.' },
      { label: 'Location', kind: 'select', req: true, value: 'Hồ Chí Minh', options: ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'], half: true },
      { label: 'Date of birth', kind: 'month', value: '1996-08', half: true },
      { label: 'Email', req: true, value: 'minhanh@email.com', half: true },
      { label: 'Phone', req: true, value: '09xx xxx xxx', half: true },
      { label: 'Profile photo', kind: 'file', hint: 'Optional. Commonly expected on VN CVs.' },
    ],
  },
  About: {
    intro: 'A short summary of what you do. Two or three sentences is plenty.',
    fields: [
      { label: 'Summary', kind: 'area', req: true, value: 'Product designer with 4+ years across web & mobile products, focused on design systems and user research.', hint: 'The first line appears in employer search results.' },
    ],
  },
  Experience: {
    repeatable: true,
    intro: 'One entry per role. This section is what your years-of-experience is calculated from.',
    fields: [
      { label: 'Company', req: true, value: 'Lantern Digital' },
      { label: 'Job title', req: true, value: 'Senior Product Designer', hint: 'Resolves to the canonical Title taxonomy so employer filters can match it.' },
      { label: 'Location', value: 'Hồ Chí Minh', half: true },
      { label: 'Employment type', kind: 'select', value: 'Full-time', options: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'], half: true },
      { label: 'From', kind: 'month', req: true, value: '2022-03', half: true },
      { label: 'To', kind: 'month', value: '', hint: 'Leave empty if this is your current role.', half: true },
      { label: 'I currently work here', kind: 'toggle', value: 'on' },
      { label: 'What you did', kind: 'area', value: '• Led the design system rollout across 4 product teams\n• Ran user research for the checkout redesign', hint: 'One achievement per line. Also a source for skill extraction.' },
      { label: 'Skills used', kind: 'tags', value: 'Figma, Design systems, User research' },
    ],
  },
  Education: {
    repeatable: true,
    fields: [
      { label: 'School', req: true, value: 'University of Economics HCMC' },
      { label: 'Degree', kind: 'select', req: true, value: 'Bachelor', options: ['High school', 'Associate', 'Bachelor', 'Master', 'Doctorate'], half: true },
      { label: 'Major', value: 'Business Administration', half: true },
      { label: 'From', kind: 'month', value: '2016-09', half: true },
      { label: 'To', kind: 'month', value: '2020-07', half: true },
      { label: 'GPA', value: '3.4 / 4.0', half: true, hint: 'Optional.' },
    ],
  },
  Skills: {
    intro: 'The single strongest signal in employer CV search. Add the ones you would be interviewed on.',
    fields: [
      { label: 'Skills', kind: 'tags', req: true, value: 'User Experience (UX), Interaction Design, Design Systems, Product Design, User Research', hint: 'Autocompletes against the canonical Skill taxonomy — a free-typed skill is offered the closest match rather than stored raw.' },
      { label: 'Years of experience per skill', kind: 'toggle', value: 'on', hint: 'Adding years makes you rank higher for that skill.' },
    ],
  },
  'Job preferences': {
    intro: 'The handful of things your CV cannot tell us. All optional — and never inferred.',
    fields: [
      { label: 'Desired job title', value: 'Senior Product Designer' },
      { label: 'Desired location(s)', kind: 'tags', value: 'Hồ Chí Minh, Remote' },
      { label: 'Employment type', kind: 'select', value: 'Full-time', options: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'], half: true },
      { label: 'Availability', kind: 'select', value: '1 month', options: ['Immediately', '2 weeks', '1 month', '2 months', 'Just exploring'], half: true },
      { label: 'Desired salary (VND / month)', value: '35,000,000', half: true, hint: 'Optional. Never shown to employers as an exact figure without your consent.' },
      { label: 'Negotiable', kind: 'toggle', value: 'on', half: true },
      { label: 'Open to remote', kind: 'toggle', value: 'on', half: true },
      { label: 'Open to relocating', kind: 'toggle', value: '', half: true },
    ],
  },
  'CV file': {
    intro: 'The document employers actually read when you apply.',
    note: 'Replacing the file keeps this CV record and its history — applications you already sent still reference the version you sent them.',
    fields: [
      { label: 'Current file', value: 'CV_TranMinhAnh.pdf · 1.2 MB · uploaded 26/07/2026' },
      { label: 'CV name', value: 'CV_TranMinhAnh', hint: 'The label you will recognise in My CVs.' },
      { label: 'Replace with', kind: 'file', hint: 'PDF · DOC · DOCX — max 5 MB. PDF parses most reliably.' },
    ],
  },
  'Foreign Language': {
    repeatable: true,
    intro: 'A real employer search facet — especially for KO and JA roles in the VN market.',
    fields: [
      { label: 'Language', kind: 'select', req: true, value: 'English', options: ['English', 'Korean', 'Japanese', 'Chinese', 'Vietnamese'], half: true },
      { label: 'Proficiency', kind: 'select', req: true, value: 'Fluent', options: ['Basic', 'Intermediate', 'Advanced', 'Fluent', 'Native'], half: true },
      { label: 'Certificate', kind: 'select', value: 'IELTS', options: ['—', 'TOEIC', 'TOEFL', 'IELTS', 'TOPIK', 'OPIc', 'JLPT', 'HSK'], half: true },
      { label: 'Score / level', value: '7.5', half: true, hint: 'Free text — the scales differ (7.5, 850, N3, 4급).' },
    ],
  },
  'Highlight Project': {
    repeatable: true,
    fields: [
      { label: 'Project name', req: true, value: '' },
      { label: 'Your role', value: '', half: true },
      { label: 'Team size', value: '', half: true },
      { label: 'From', kind: 'month', value: '', half: true },
      { label: 'To', kind: 'month', value: '', half: true },
      { label: 'Tools / tech used', kind: 'tags', value: '' },
      { label: 'What you did and what changed', kind: 'area', value: '', hint: 'An outcome beats a description.' },
      { label: 'Link (demo / repo / case study)', value: '' },
    ],
  },
  Certificates: {
    repeatable: true,
    fields: [
      { label: 'Certificate name', req: true, value: '' },
      { label: 'Issuing organisation', value: '', half: true },
      { label: 'Issue date', kind: 'month', value: '', half: true },
      { label: 'Expiry date', kind: 'month', value: '', half: true, hint: 'Leave empty if it does not expire.' },
      { label: 'Credential ID or URL', value: '', half: true },
    ],
  },
  Awards: {
    repeatable: true,
    fields: [
      { label: 'Award name', req: true, value: '' },
      { label: 'Awarded by', value: '', half: true },
      { label: 'Year', value: '', half: true },
      { label: 'What it was for', kind: 'area', value: '' },
    ],
  },
  Activities: {
    repeatable: true,
    intro: 'Volunteering, clubs and communities — useful for fresher profiles with little work history.',
    fields: [
      { label: 'Organisation / club', req: true, value: '' },
      { label: 'Your role', value: '', half: true },
      { label: 'Still involved', kind: 'toggle', value: '', half: true },
      { label: 'From', kind: 'month', value: '', half: true },
      { label: 'To', kind: 'month', value: '', half: true },
      { label: 'What you did', kind: 'area', value: '' },
    ],
  },
  Publications: {
    repeatable: true,
    fields: [
      { label: 'Title', req: true, value: '' },
      { label: 'Publisher / journal', value: '', half: true },
      { label: 'Date', kind: 'month', value: '', half: true },
      { label: 'Co-authors', value: '' },
      { label: 'Link', value: '' },
    ],
  },
  References: {
    repeatable: true,
    note: 'This is someone else’s personal data. Ask them first — we show a referee’s contact details only to employers who have unlocked your CV.',
    fields: [
      { label: 'Full name', req: true, value: '' },
      { label: 'Role & company', req: true, value: '' },
      { label: 'Relationship', kind: 'select', value: 'Direct manager', options: ['Direct manager', 'Colleague', 'Client', 'Lecturer', 'Other'], half: true },
      { label: 'Phone', value: '', half: true },
      { label: 'Email', value: '', half: true },
      { label: 'They agreed to be contacted', kind: 'toggle', value: '', hint: 'Required before we will show these details to anyone.' },
    ],
  },
  Recommendations: {
    intro: 'Ask a colleague to write a short recommendation. They get a link — you never write it yourself.',
    fields: [
      { label: 'Their email', req: true, value: '' },
      { label: 'Their name', value: '', half: true },
      { label: 'How you worked together', kind: 'select', value: 'Colleague', options: ['Direct manager', 'Colleague', 'Client', 'Report'], half: true },
      { label: 'Message', kind: 'area', value: 'Hi — would you mind writing a short recommendation about our work together? It takes about 2 minutes.' },
    ],
  },
}

/** One field row in the edit sheet. Values are static — this is a wireframe. */
function EditRow({ f }: { f: EditField }) {
  const box = 'w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]'
  return (
    <div className={f.half ? '' : 'col-span-2'}>
      <label className="mb-1 block text-[10.5px] font-medium text-ink/70">
        {f.label}{f.req && <span className="text-rose-500"> *</span>}
      </label>
      {f.kind === 'toggle' ? (
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5">
          <span className={cn('relative h-4 w-7 shrink-0 rounded-full', f.value ? 'bg-emerald-500' : 'bg-line')}>
            <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white', f.value ? 'right-0.5' : 'left-0.5')} />
          </span>
          <span className="text-[11px] text-muted">{f.value ? 'Yes' : 'No'}</span>
        </div>
      ) : f.kind === 'area' ? (
        <div className={cn(box, 'min-h-[58px] whitespace-pre-wrap', f.value ? 'text-ink/80' : 'text-faint')}>{f.value || 'Not filled in yet'}</div>
      ) : f.kind === 'tags' ? (
        <div className="flex min-h-[30px] flex-wrap items-center gap-1 rounded-md border border-line bg-surface px-2 py-1.5">
          {f.value
            ? f.value.split(',').map((t) => (
                <span key={t} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10.5px] text-ink/80">{t.trim()} <span className="text-faint">✕</span></span>
              ))
            : <span className="text-[11px] text-faint">Start typing to search…</span>}
          <span className="text-[10.5px] font-medium text-brand">＋ Add</span>
        </div>
      ) : f.kind === 'file' ? (
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-brand/50 px-2.5 py-1 text-[11px] font-medium text-brand">⬆ Choose file</span>
          <span className="text-[11px] text-faint">No file chosen</span>
        </div>
      ) : (
        <div className={cn(box, 'flex items-center justify-between gap-2', f.value ? 'text-ink/80' : 'text-faint')}>
          <span className="truncate">{f.value || (f.kind === 'month' ? 'mm / yyyy' : 'Not filled in yet')}</span>
          {f.kind === 'select' && <span className="shrink-0 text-faint">▾</span>}
        </div>
      )}
      {f.hint && <p className="mt-1 text-[10px] leading-snug text-faint">{f.hint}</p>}
    </div>
  )
}

function EditSheet({ title, onClose }: { title: string; onClose: () => void }) {
  const spec = SECTION_EDITORS[title]
  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/30 px-4 py-6">
      <div className="flex max-h-full w-full max-w-[460px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">Edit · {title}</p>
            {spec?.intro && <p className="mt-0.5 text-[11px] leading-snug text-muted">{spec.intro}</p>}
          </div>
          <span className="shrink-0 cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {spec?.note && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10.5px] leading-relaxed text-amber-800">{spec.note}</p>
          )}
          {spec ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {spec.fields.map((f) => <EditRow key={f.label} f={f} />)}
              </div>
              {spec.repeatable && (
                <button className="w-full rounded-md border border-dashed border-line py-2 text-[11.5px] font-medium text-brand hover:border-brand">
                  ＋ Add another {title.toLowerCase()} entry
                </button>
              )}
              <p className="text-[10px] text-faint">Saved as a draft as you type — nothing is published until you save.</p>
            </>
          ) : (
            <p className="text-[11px] text-faint">No field list authored for “{title}” yet.</p>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-line px-4 py-3">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn primary onClick={onClose}>Save</Btn>
        </div>
      </div>
    </div>
  )
}

/** Fill-from-CV flow — turn an uploaded PDF/DOC into a structured Saramin CV (parse → review → confirm). */
function FillFromCvModal({ step, setStep, onClose }: { step: 'select' | 'working' | 'done'; setStep: (s: 'select' | 'working' | 'done') => void; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/40 px-4 pt-10">
      <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        {step === 'select' && (
          <>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[15px] font-bold text-ink">Select your CV</p>
              <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800">
                <span>⭐</span>
                <p><b>Note:</b> We read your file and pre-fill your profile — you just review &amp; confirm. Nothing is published until you save.</p>
              </div>
              {/* option 1 — current CV */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border-2 border-brand/40 bg-brand-soft/40 p-3">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-brand"><span className="h-2 w-2 rounded-full bg-brand" /></span>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">Use your current CV</p>
                  <p className="text-[12px] font-medium text-brand underline">CV_TranMinhAnh.pdf</p>
                  <p className="text-[11px] text-faint">Uploaded 26/07/2026 · 1.2 MB</p>
                </div>
              </label>
              {/* option 2 — new upload */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-line" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink">Upload a new CV</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-md border border-brand/50 px-2.5 py-1 text-[11.5px] font-medium text-brand">⬆ Choose file</span>
                    <span className="text-[11.5px] text-faint">No file chosen</span>
                  </div>
                  <p className="mt-1 text-[10.5px] text-faint">.doc, .docx or .pdf · max 3MB · no password protection</p>
                </div>
              </label>
              <label className="flex items-center gap-2 text-[11.5px] text-ink/80">
                <span className="grid h-4 w-4 place-items-center rounded bg-brand text-[10px] text-white">✓</span>
                Also replace my CV file with this upload
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
              <Btn onClick={onClose}>Cancel</Btn>
              <Btn primary onClick={() => { setStep('working'); setTimeout(() => setStep('done'), 1600) }}>✨ Fill profile</Btn>
            </div>
          </>
        )}
        {step === 'working' && (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-brand-soft text-[26px]">📄</div>
            <div className="mx-auto mb-4 h-1.5 w-44 overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
            </div>
            <p className="text-[15px] font-bold text-ink">We're reading your CV…</p>
            <p className="mt-1 text-[12px] text-muted">Extracting your experience, skills and details.<br />Please don't close this window.</p>
          </div>
        )}
        {step === 'done' && (
          <div className="px-5 py-6 text-center">
            <div className="mb-1 text-[30px]">🎉</div>
            <p className="text-[15px] font-bold text-ink">Profile filled from your CV!</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] text-muted">Please review the imported info and edit anything that needs a touch-up.</p>
            <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Updated sections</p>
            <div className="mt-2 space-y-1.5 text-left">
              {([['👤', 'Personal information'], ['💼', 'Work experience'], ['🎓', 'Education'], ['🛠', 'Skills']] as [string, string][]).map(([ic, label]) => (
                <div key={label} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-medium text-emerald-800"><span>{ic}</span>{label}</div>
              ))}
            </div>
            <div className="mt-4 flex justify-center"><Btn primary onClick={onClose}>Review my profile</Btn></div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileCvScreen() {
  const [cvView, setCvView] = useState<'me' | 'recruiter'>('me')
  const [editing, setEditing] = useState<string | null>(null)
  const [fillStep, setFillStep] = useState<'select' | 'working' | 'done' | null>(null)
  const ro = cvView === 'recruiter'
  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-profile-cv" />

        {/* main */}
        <div className="space-y-4">
          {/* page title + "view as" toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-bold text-ink">My Profile</p>
            <div className="flex shrink-0 overflow-hidden rounded-md border border-line text-[11.5px] font-medium">
              {([['me', 'Hồ sơ của tôi'], ['recruiter', 'Xem như nhà tuyển dụng']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setCvView(id)} className={cn('px-3 py-1.5', cvView === id ? 'bg-brand text-white' : 'text-muted')}>{label}</button>
              ))}
            </div>
          </div>

          {/* ── Identity header — on top, clean ── */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[28px]">🙂</div>
              <div className="min-w-0 flex-1">
                <p className="text-[19px] font-bold leading-tight text-ink">Trần Minh Anh</p>
                <p className="mt-0.5 text-[13px] text-ink/80">Product Designer · 4 yrs experience</p>
                <p className="mt-0.5 text-[11.5px] text-muted">📍 Hồ Chí Minh, Vietnam</p>
              </div>
              {!ro && (
                <button onClick={() => setEditing('Profile header')} className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-brand/40">✎ Edit</button>
              )}
            </div>
            {!ro && (
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-line-soft pt-3 text-[12px] text-ink/80">
                <span className="inline-flex items-center gap-1.5"><span className="text-muted">✉</span> minhanh@email.com</span>
                <span className="inline-flex items-center gap-1.5"><span className="text-muted">📞</span> 0901 234 567</span>
              </div>
            )}
          </div>

          {ro && (
            /* recruiter "3-second fit" summary */
            <div className="rounded-xl border-2 border-brand/30 bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12.5px] font-medium text-ink">3-second fit</p>
                <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-bold text-brand">92% match</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([['Top skills', 'UX · UI · Design Systems'], ['Location · Work', 'Hồ Chí Minh · Hybrid'], ['Available · Salary', 'Open now · 20–30 tr']] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{k}</p>
                    <p className="mt-0.5 text-[11.5px] font-medium text-ink">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10.5px] text-faint">The 3-second view a recruiter sees first · empty sections are hidden.</p>
            </div>
          )}

          {!ro && (
            <>
              {/* ── Job preferences (Basic info — NOT part of the CV) ── */}
              <div className="rounded-xl border border-line bg-surface p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-[14px] font-bold text-ink">Công việc mong muốn <span className="text-[11px] font-normal text-muted">· Job preferences</span></h4>
                    <p className="mt-0.5 text-[11px] text-faint">Basic info · powers matching &amp; recommendations — not shown on your CV / PDF.</p>
                  </div>
                  <span onClick={() => setEditing('Job preferences')} className="shrink-0 cursor-pointer text-[11px] font-medium text-brand">Edit</span>
                </div>
                <div className="divide-y divide-line-soft">
                  {([
                    ['Desired role', <>Senior Product Designer</>],
                    ['Category · Level', <>Design · Experienced (non-manager)</>],
                    ['Industry (≤3)', <span className="flex flex-wrap justify-end gap-1"><Chip tone="blue">IT / Software</Chip><Chip tone="blue">FMCG</Chip><Chip tone="blue">Banking</Chip></span>],
                    ['Location (≤3)', <span className="flex flex-wrap justify-end gap-1"><Chip>Hồ Chí Minh</Chip><Chip>Hà Nội</Chip></span>],
                    ['Expected salary', <span className="flex flex-wrap items-center justify-end gap-2">20 – 30 tr <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] font-normal text-muted">👁 Shown</span></span>],
                    ['Availability', <>🟢 Open now</>],
                  ] as [string, React.ReactNode][]).map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
                      <span className="shrink-0 text-[11.5px] text-muted">{k}</span>
                      <span className="text-right text-[12.5px] font-medium text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Your CV file — the uploaded document (replaces the old tab) ── */}
              <div className="rounded-xl border border-line bg-surface p-4">
                <h4 className="mb-2 text-[14px] font-bold text-ink">Your CV file <span className="text-[11px] font-normal text-muted">· the document recruiters download</span></h4>
                <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[14px]">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">CV_TranMinhAnh.pdf</p>
                    <p className="text-[11px] text-faint">Uploaded 26/07/2026 · 1.2 MB</p>
                  </div>
                  <Chip tone="green">Approved</Chip>
                  <span onClick={() => setEditing('CV file')} className="cursor-pointer text-[11px] font-medium text-brand">Replace</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-brand/50 bg-brand-soft/60 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-brand">✨ Turn this file into my Saramin CV</p>
                    <p className="text-[11px] text-muted">We read the file and pre-fill the sections below — you just review &amp; confirm. <span className="text-faint">(Phase 2)</span></p>
                  </div>
                  <Btn primary onClick={() => setFillStep('select')}>Fill profile from CV</Btn>
                </div>
              </div>

              {/* impact-framed completeness */}
              <CompletenessBar />
            </>
          )}

          {/* ── About (+ Top skills) ── */}
          <CvSection title="About" action={ro ? '' : 'Edit'} onAction={() => setEditing('About')}>
            <p className="text-[12.5px] leading-relaxed text-ink/80">Product designer with 4+ years across web and mobile products at agency and in-house teams. I turn user research into clean, usable interfaces and maintain scalable design systems.</p>
            <div className="mt-3 rounded-lg border border-line px-3 py-2">
              <p className="text-[11px] font-semibold text-ink">💎 Top skills</p>
              <p className="mt-0.5 text-[11.5px] text-muted">User Experience (UX) · Interaction Design · Design Systems · Product Design</p>
            </div>
          </CvSection>

          {/* ── Experience ── */}
          <CvSection title="Experience" action={ro ? '' : '+ Add'} onAction={() => setEditing('Experience')}>
            {([
              ['Senior Product Designer', 'Lantern Digital · Full-time', '2022 – Present · 2 yrs', 'Hồ Chí Minh City, Vietnam', 'Lead designer on the core web product — run research, ship the design system, and mentor two junior designers.', ['User Research', 'Design Systems', 'Figma']],
              ['Product Designer', 'Zenpay · Full-time', '2020 – 2022 · 2 yrs', 'Hồ Chí Minh City, Vietnam', 'Designed the payments experience across mobile and web, from research through to handoff.', ['Product Design', 'Prototyping']],
            ] as [string, string, string, string, string, string[]][]).map(([role, org, dates, loc, desc, skills]) => (
              <div key={role} className="flex gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]">🏢</div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">{role}</p>
                  <p className="text-[11.5px] text-ink/80">{org}</p>
                  <p className="text-[11px] text-faint">{dates} · {loc}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{desc}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">{skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>
                </div>
              </div>
            ))}
          </CvSection>

          {/* ── Education ── */}
          <CvSection title="Education" action={ro ? '' : '+ Add'} onAction={() => setEditing('Education')}>
            {([
              ['University of Economics HCMC', 'Bachelor · Business Information Systems', '2016 – 2020'],
              ['FPT Arena Multimedia', 'Diploma · Graphic & Digital Design', '2015 – 2016'],
            ] as [string, string, string][]).map(([school, deg, dates]) => (
              <div key={school} className="flex gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]">🎓</div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">{school}</p>
                  <p className="text-[11.5px] text-ink/80">{deg}</p>
                  <p className="text-[11px] text-faint">{dates}</p>
                </div>
              </div>
            ))}
          </CvSection>

          {/* ── Skills (with years) ── */}
          <CvSection title="Skills" action={ro ? '' : 'Edit'} badge={ro ? undefined : '6%'} onAction={() => setEditing('Skills')}>
            {!ro && <div className="mb-2 rounded-md bg-brand-soft/60 px-3 py-2 text-[11.5px] text-brand">✎ Quick update — years of experience for skills</div>}
            <p className="mb-1.5 text-[11px] font-semibold text-ink">Core skills</p>
            <div className="flex flex-wrap gap-1.5">
              {([['User Experience (UX)', '4 yrs'], ['Interaction Design', '4 yrs'], ['Design Systems', '3 yrs'], ['Product Design', '3 yrs'], ['User Research', '2 yrs']] as [string, string][]).map(([s, y]) => (
                <span key={s} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-ink/80"><b className="font-semibold text-ink">{s}</b> ({y})</span>
              ))}
            </div>
          </CvSection>

          {/* ── Empty sections — my view only, impact-framed prompts ── */}
          {!ro && OPTIONAL_CV_SECTIONS.map((s) => (
            <EmptySection key={s.title} title={s.title} pct={s.pct} desc={s.desc} icon={s.icon} onAdd={() => setEditing(s.title)} />
          ))}
        </div>
      </div>
      {editing && <EditSheet title={editing} onClose={() => setEditing(null)} />}
      {fillStep && <FillFromCvModal step={fillStep} setStep={setFillStep} onClose={() => setFillStep(null)} />}
    </div>
  )
}

/* ── CV builder — the MANUAL create route, in the Saramin-KR layout: profile
   header on top, the CV sections stacked as forms in the main column, and a
   right rail with CV completeness + the item list (add/remove optional
   sections). Uploads do NOT land here — they go to the compare screen. */
function CreateCvScreen() {
  const go = useNav()
  const [extra, setExtra] = useState<string[]>([])
  const OPTIONAL = OPTIONAL_CV_SECTIONS.map((s) => s.title)
  const SectionHead = ({ title, essential, actions }: { title: string; essential?: boolean; actions?: string[] }) => (
    <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink/80 pb-2">
      <p className="text-[14px] font-bold text-ink">{title}</p>
      {essential && <span className="text-[10.5px] font-semibold text-rose-500">essential</span>}
      <span className="ml-auto flex gap-3">{actions?.map((a) => <span key={a} className="cursor-pointer text-[11px] font-medium text-brand">＋ {a}</span>)}</span>
    </div>
  )
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="mx-auto grid max-w-[1020px] grid-cols-1 gap-4 p-5 md:grid-cols-[minmax(0,1fr)_280px]">
        {/* ── main column ── */}
        <div className="space-y-5">
          {/* pre-fill from PDF — the second entrance to this SAME form. Typing and
              fetching land in identical fields; the PDF is only a faster pen. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-soft/40 px-4 py-3">
            <p className="text-[12px] text-ink/80">⚡ <b className="font-semibold">Have a PDF?</b> Upload it and we pre-fill this form — you just review.</p>
            <Btn onClick={() => go('js-cv-compare')}>⬆ Upload &amp; pre-fill</Btn>
          </div>

          {/* profile header — the top of the KR reference: identity from Profile */}
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-ink">
                  Trần Minh Anh
                  <span className="rounded-md border border-line px-2 py-0.5 text-[10.5px] font-medium text-muted">Trưởng nhóm ▾</span>
                </p>
                {/* ALL the Profile (= onboarding) fields — read-only here, edited on My Profile */}
                <div className="mt-2 grid gap-x-6 gap-y-1 text-[11.5px] sm:grid-cols-2">
                  {/* Unmasked: this is the candidate looking at their OWN CV.
                      Masking belongs on employer-facing surfaces (locked search
                      previews), not here — hiding it from the owner only makes it
                      harder to check the address employers will contact. */}
                  <p className="text-ink/80">✉ minhanh@email.com · 📱 0901 234 567</p>
                  <p className="text-ink/80">💼 Desired: <b>Senior Product Designer</b></p>
                  <p className="text-ink/80">📍 Hồ Chí Minh · Hà Nội <span className="text-faint">· open to relocating</span></p>
                  <p className="text-ink/80">🏭 IT / Software · FMCG</p>
                  <p className="text-ink/80">💰 20 – 30 tr</p>
                  <p className="text-ink/80">📈 4 yrs · 🎓 Bachelor · 🟢 Open now</p>
                </div>
              </div>
              <div className="grid h-16 w-14 shrink-0 place-items-center rounded-md border border-line bg-canvas text-[18px]">🙂</div>
              <span className="cursor-pointer text-[13px] text-muted">✎</span>
            </div>
          </div>

          {/* Education — essential; PRE-FILLED with the CV content from My Profile */}
          <div>
            <SectionHead title="Education" essential actions={['Add']} />
            <div className="mt-3 space-y-2">
              {([
                ['University of Economics HCMC', 'Bachelor · Business Information Systems', '2016 – 2020'],
                ['FPT Arena Multimedia', 'Diploma · Graphic & Digital Design', '2015 – 2016'],
              ] as [string, string, string][]).map(([school, deg, dates]) => (
                <div key={school} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]">🎓</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink">{school}</p>
                    <p className="text-[11.5px] text-ink/80">{deg}</p>
                    <p className="text-[11px] text-faint">{dates}</p>
                  </div>
                  <span className="cursor-pointer text-[12px] text-muted">✎</span>
                </div>
              ))}
            </div>
          </div>

          {/* Work experience — PRE-FILLED with the CV content from My Profile */}
          <div>
            <SectionHead title="Work experience" actions={['Import certified experience', 'Add']} />
            <div className="mt-3 space-y-2">
              {([
                ['Senior Product Designer', 'Lantern Digital · Full-time', '2022 – Present · 2 yrs', 'Lead designer on the core web product — run research, ship the design system, and mentor two junior designers.', ['User Research', 'Design Systems', 'Figma']],
                ['Product Designer', 'Zenpay · Full-time', '2020 – 2022 · 2 yrs', 'Designed the payments experience across mobile and web, from research through to handoff.', ['Product Design', 'Prototyping']],
              ] as [string, string, string, string, string[]][]).map(([role, org, dates, desc, skills]) => (
                <div key={role} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]">🏢</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink">{role}</p>
                    <p className="text-[11.5px] text-ink/80">{org}</p>
                    <p className="text-[11px] text-faint">{dates}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{desc}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">{skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>
                  </div>
                  <span className="cursor-pointer text-[12px] text-muted">✎</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills — PRE-FILLED with years; the AI suggestions stay */}
          <div>
            <SectionHead title="Skills" actions={['Add']} />
            <div className="mt-3 rounded-xl border border-line bg-surface p-3.5">
              <div className="flex flex-wrap gap-1.5">
                {([['User Experience (UX)', '4 yrs'], ['Interaction Design', '4 yrs'], ['Design Systems', '3 yrs'], ['Product Design', '3 yrs'], ['User Research', '2 yrs']] as [string, string][]).map(([s, y]) => (
                  <span key={s} className="rounded-full border border-line px-2.5 py-1 text-[11.5px] text-ink/80"><b className="font-semibold text-ink">{s}</b> ({y})</span>
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-lg bg-brand-soft/50 px-2.5 py-2">
                <span className="text-[11px] font-medium text-brand">✨ people in your role often list:</span>
                {['Figma', 'Wireframing', 'Prototyping'].map((s) => <span key={s} className="cursor-pointer rounded-full border border-dashed border-brand/50 px-2 py-0.5 text-[10.5px] text-brand">＋ {s}</span>)}
                <span className="cursor-pointer text-[10.5px] font-medium text-brand">more →</span>
              </div>
            </div>
          </div>

          {/* About — PRE-FILLED with the CV content from My Profile */}
          <div>
            <SectionHead title="About" actions={[]} />
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
              <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink/80">Product designer with 4+ years across web and mobile products at agency and in-house teams. I turn user research into clean, usable interfaces and maintain scalable design systems.</p>
              <span className="cursor-pointer text-[12px] text-muted">✎</span>
            </div>
          </div>

          {/* ── Optional sections — ALL EIGHT are always on the page, exactly as
              My Profile lists them (one shared OPTIONAL_CV_SECTIONS definition).
              Collapsed they are impact-framed prompts, so a candidate can see
              everything a CV can hold without hunting the rail; opened they show
              the real field form from SECTION_EDITORS — the same field catalogue
              the profile edit sheets read. ── */}
          {OPTIONAL_CV_SECTIONS.map(({ title, pct, desc, icon }) => {
            const open = extra.includes(title)
            const spec = SECTION_EDITORS[title]
            if (!open) {
              return (
                <EmptySection
                  key={title}
                  title={title}
                  pct={pct}
                  desc={desc}
                  icon={icon}
                  onAdd={() => setExtra((a) => [...a, title])}
                />
              )
            }
            return (
              <div key={title}>
                <SectionHead title={title} actions={spec?.repeatable ? ['Add'] : []} />
                <div className="mt-3 rounded-xl border border-line bg-surface p-3.5">
                  {spec?.intro && <p className="mb-2.5 text-[11px] text-muted">{spec.intro}</p>}
                  {spec?.note && <p className="mb-2.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10.5px] leading-relaxed text-amber-800">{spec.note}</p>}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                    {spec?.fields.map((f) => <EditRow key={f.label} f={f} />)}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {spec?.repeatable && (
                      <button className="flex-1 rounded-md border border-dashed border-line py-2 text-[11.5px] font-medium text-brand hover:border-brand">
                        ＋ Add another {title.toLowerCase()} entry
                      </button>
                    )}
                    <button
                      onClick={() => setExtra((a) => a.filter((x) => x !== title))}
                      className="rounded-md border border-line px-2.5 py-2 text-[11px] font-medium text-muted hover:border-ink/40"
                    >
                      Remove section
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── right rail — completeness + item list (the KR reference) ── */}
        <div className="space-y-3 self-start">
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-ink">CV completeness</p>
              <p className="text-[15px] font-bold text-brand">85%</p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full w-[85%] rounded-full bg-brand" /></div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">Your CV is usable just by entering <span className="font-medium text-brand">basic information and education</span>!</p>

            {/* the item list — required first, then the CV sections, then optional +/− */}
            <div className="mt-3 space-y-0.5 border-t border-line-soft pt-3">
              <div className="flex items-center justify-between rounded-md bg-emerald-50 px-2 py-1.5"><span className="text-[12px] font-semibold text-emerald-700">Education</span><span className="text-[10px] font-bold text-emerald-600">✓ REQUIRED</span></div>
              {['Work experience', 'Skills', 'About'].map((s) => (
                <div key={s} className="flex items-center justify-between px-2 py-1.5"><span className="text-[12px] text-ink/80">{s}</span><span className="text-[11px] text-emerald-500">✓</span></div>
              ))}
              {OPTIONAL.map((s) => {
                const on = extra.includes(s)
                return (
                  <div key={s} className="flex items-center justify-between px-2 py-1.5">
                    <span className={cn('text-[12px]', on ? 'font-medium text-brand' : 'text-ink/60')}>{s}</span>
                    <span
                      onClick={() => setExtra((a) => (on ? a.filter((x) => x !== s) : [...a, s]))}
                      className={cn('grid h-4.5 w-4.5 cursor-pointer place-items-center rounded-full border text-[11px] leading-none', on ? 'border-brand text-brand' : 'border-line text-muted')}
                      style={{ height: 18, width: 18 }}
                    >
                      {on ? '−' : '＋'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── bottom bar — title + preview + complete (the KR reference) ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-line bg-surface px-5 py-3">
        <p className="shrink-0 text-[12.5px] font-bold text-ink">CV Title</p>
        <div className="min-w-[220px] flex-1 rounded-md border-2 border-brand/50 px-3 py-2 text-[12px] text-faint">CV title (if left blank, a default title is saved automatically)</div>
        <span className="cursor-pointer text-[12px] font-semibold text-violet-600">✨ Get AI CV Coaching</span>
        <Btn>CV Preview</Btn>
        <Btn primary onClick={() => go('js-my-cvs')}>Completed</Btn>
      </div>
    </div>
  )
}

/* ── Admin / CRM screens (HQ Admin console) ──────────────────────────────── */

function AdminBar({ active }: { active?: string }) {
  const items = ['Dashboard', 'Companies', 'Jobs', 'Sales', 'Settings']
  return (
    <div className="flex items-center gap-4 border-b border-line px-5 py-2.5 bg-surface">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
      <span className="text-[13px] font-bold text-brand">Saramin<span className="text-ink"> · HQ Admin</span></span>
      <nav className="ml-2 hidden md:flex items-center gap-4 text-[12.5px]">
        {items.map((it) => (
          <span key={it} className={cn(active === it ? 'font-semibold text-brand' : 'text-ink/70')}>{it}</span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex rounded-md border border-line text-[11px] font-medium overflow-hidden">
          <span className="px-1.5 py-0.5 bg-brand text-white">VI</span>
          <span className="px-1.5 py-0.5 text-muted">EN</span>
          <span className="px-1.5 py-0.5 text-muted">KO</span>
        </div>
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand to-violet-500" />
      </div>
    </div>
  )
}

/** Step ribbon shared across the CRM activation screens. */
function FlowSteps({ step }: { step: number }) {
  const labels = ['Lead', 'Won', 'Account', 'Products', 'Company page']
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line-soft bg-canvas/40 px-5 py-2">
      {labels.map((l, i) => (
        <div key={l} className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
              i === step ? 'bg-brand text-white' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-canvas text-faint',
            )}
          >
            <span className={cn('grid h-3.5 w-3.5 place-items-center rounded-full text-[9px]', i === step ? 'bg-white/25' : i < step ? 'bg-emerald-500 text-white' : 'bg-line text-faint')}>
              {i < step ? '✓' : i + 1}
            </span>
            {l}
          </span>
          {i < labels.length - 1 && <span className="text-faint">›</span>}
        </div>
      ))}
    </div>
  )
}

const CRM_STAGES: { name: string; tone?: 'muted' | 'green' | 'blue' | 'amber' }[] = [
  { name: 'Lead' }, { name: 'Qualified', tone: 'blue' }, { name: 'Proposal', tone: 'blue' },
  { name: 'Negotiation', tone: 'amber' }, { name: 'Won', tone: 'green' }, { name: 'Lost' },
]

function CrmPipelineScreen() {
  const deals: Record<string, { n: string; v: string; ind: string }[]> = {
    Lead: [{ n: 'Cty Vạn Phát', v: '133.5M ₫', ind: 'Y tế' }, { n: 'Cty Thiên Long', v: '476.9M ₫', ind: 'Sản xuất' }],
    Qualified: [{ n: 'Cty Hồng Đức', v: '128.0M ₫', ind: 'Bán lẻ' }],
    Proposal: [{ n: 'Cty Hoàng Gia', v: '171.1M ₫', ind: 'BĐS' }],
    Negotiation: [{ n: 'Cty Việt Tiến', v: '55.2M ₫', ind: 'Logistics' }],
    Won: [{ n: 'Cty Trường Sơn', v: '231.3M ₫', ind: 'Tài chính' }],
    Lost: [{ n: 'Cty Á Châu', v: '115.5M ₫', ind: 'Logistics' }],
  }
  return (
    <div>
      <AdminBar active="Sales" />
      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <p className="text-[15px] font-bold">Sales pipeline</p>
          <p className="text-[11.5px] text-muted">Customer deals grouped by stage. Totals reflect deal value per stage.</p>
        </div>
        <Btn primary>+ New quote</Btn>
      </div>
      <div className="flex items-center gap-2 border-y border-line-soft px-5 py-2 text-[11px] text-muted">
        <span className="rounded-md border border-line px-2 py-1">Owner: ALL</span>
        <span className="rounded-md border border-line px-2 py-1">Industry: ALL</span>
        <span className="rounded-md border border-line px-2 py-1">Has quote</span>
        <span className="rounded-md border border-line px-2 py-1">Has invoice</span>
      </div>
      <div className="grid grid-cols-6 gap-2 p-4 overflow-x-auto" style={{ minWidth: 720 }}>
        {CRM_STAGES.map((st) => (
          <div key={st.name} className="rounded-lg border border-line bg-canvas/40 p-2 min-w-[110px]">
            <div className="mb-2 flex items-center justify-between">
              <Chip tone={st.tone}>{st.name}</Chip>
              <span className="text-[11px] font-bold text-faint">{(deals[st.name] ?? []).length}</span>
            </div>
            {(deals[st.name] ?? []).map((d) => (
              <div key={d.n} className={cn('mb-2 rounded-md border bg-surface p-2', st.name === 'Won' ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-line')}>
                <p className="text-[11.5px] font-semibold text-ink truncate">{d.n}</p>
                <p className="text-[10.5px] text-muted">{d.v}</p>
                <span className="mt-1 inline-block rounded border border-line bg-canvas px-1 py-0.5 text-[9px] text-muted">{d.ind}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="px-5 pb-4 text-[11px] text-faint">A deal is a company you’re tracking — no login, invisible to jobseekers. Drag to <b>Won</b> to activate it as a customer.</p>
    </div>
  )
}

function CrmCustomerScreen() {
  return (
    <div>
      <AdminBar active="Sales" />
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-bold">Công ty TNHH Vạn Phát</p>
              <Chip tone="green">Won</Chip>
            </div>
            <p className="text-[11.5px] text-muted">Healthcare · HCMC · Owner: Nguyễn Thị Lan</p>
          </div>
          <Btn primary>⚡ Activate customer</Btn>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12px] font-bold">Customer record <span className="font-normal text-faint">(CRM — internal only)</span></p>
            {[['Legal name', 'Công ty TNHH Vạn Phát'], ['Tax code', '0312xxxxxx'], ['Industry', 'Healthcare (Y tế)'], ['Address', 'Quận 1, HCMC'], ['Contact', 'Ms. Lan · 09xx xxx xxx']].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line-soft py-1.5 text-[12px] last:border-0">
                <span className="text-muted">{k}</span><span className="text-ink font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-line p-4">
              <p className="mb-2 text-[12px] font-bold">Lifecycle</p>
              <div className="flex flex-wrap gap-1.5">
                {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'].map((s, i) => (
                  <Chip key={s} tone={i === 4 ? 'green' : 'muted'}>{i < 4 ? '✓ ' : ''}{s}</Chip>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">No login yet · not on jobseeker site. “Activate” creates the account.</p>
            </div>
            <div className="rounded-xl border border-line p-4">
              <p className="mb-2 text-[12px] font-bold">Deal history</p>
              <div className="space-y-1.5 text-[11.5px]">
                <div className="flex justify-between"><span className="text-muted">Quote #P91…</span><Chip tone="green">Accepted</Chip></div>
                <div className="flex justify-between"><span className="text-muted">Deal value</span><span className="font-medium">133.5M ₫</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-brand">This company is now a real customer. Next: click <b>Activate customer</b> to create its account.</div>
      </div>
    </div>
  )
}

function CrmActivateScreen() {
  return (
    <div>
      <AdminBar active="Companies" />
      <FlowSteps step={2} />
      <div className="p-5">
        <p className="text-[15px] font-bold">Create account & connect to the lead</p>
        <p className="text-[11.5px] text-muted mb-4">The account is the <b>same company record</b>, pre-filled from CRM — nothing is retyped.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4 space-y-3">
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Company</p>
              <div className="flex items-center gap-2 rounded-md border border-line bg-canvas/50 px-3 py-2 text-[12px]">
                Công ty TNHH Vạn Phát <span className="ml-auto text-[10.5px] text-violet-600">🔗 from CRM #VP-1042</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Account owner (login email)</p>
              <div className="rounded-md border border-line px-3 py-2 text-[12px] text-faint">hr@vanphat.vn</div>
            </div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink/80">Billing entity</p>
              <div className="rounded-md border border-line px-3 py-2 text-[12px] text-faint">Vạn Phát — from Won deal (133.5M ₫)</div>
            </div>
            <Btn primary className="w-full">Create account →</Btn>
          </div>
          <div className="space-y-3">
            <div className="rounded-md bg-brand-soft px-3 py-2.5 text-[11.5px] text-brand">🔗 The account links back to the CRM customer, so sales history and account stay in sync — one source of truth.</div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-[11.5px] text-emerald-800">✓ The company now gets a login. Next: choose what they bought.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CrmProductsScreen() {
  return (
    <div>
      <AdminBar active="Companies" />
      <FlowSteps step={3} />
      <div className="p-5">
        <p className="text-[15px] font-bold">What did they buy?</p>
        <p className="text-[11.5px] text-muted mb-4">This choice decides the rest. Job Posting needs a public company page; Resume Search does not.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-brand bg-brand-soft p-4">
            <div className="flex items-center justify-between">
              <span className="text-[20px]">📢</span>
              <span className="grid h-5 w-5 place-items-center rounded-md bg-brand text-[11px] text-white">✓</span>
            </div>
            <p className="mt-2 text-[14px] font-bold">Job Posting</p>
            <p className="text-[11.5px] text-muted">Post jobs shown to jobseekers. Profile is public.</p>
            <p className="mt-2 text-[11px] font-bold text-amber-600">→ Requires a Company Detail Page</p>
          </div>
          <div className="rounded-xl border-2 border-line p-4">
            <div className="flex items-center justify-between">
              <span className="text-[20px]">🔍</span>
              <span className="grid h-5 w-5 place-items-center rounded-md border border-line text-[11px] text-transparent">✓</span>
            </div>
            <p className="mt-2 text-[14px] font-bold">Resume Search</p>
            <p className="text-[11.5px] text-muted">Search &amp; contact candidates. Nothing shown to jobseekers.</p>
            <p className="mt-2 text-[11px] font-bold text-emerald-600">→ No company page needed</p>
          </div>
        </div>
        <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11.5px] text-amber-800">
          ⚠️ Job Posting is selected → the next step is <b>required</b>: create the public Company Detail Page. (Resume Search only → activation is done, no page.)
        </div>
      </div>
    </div>
  )
}

function CrmCompanyPageScreen() {
  return (
    <div>
      <AdminBar active="Companies" />
      <FlowSteps step={4} />
      <div className="p-5">
        <p className="text-[15px] font-bold">Create the company detail page</p>
        <p className="text-[11.5px] text-muted mb-4">Because they post jobs, fill the public profile jobseekers will see.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* form */}
          <div className="rounded-xl border border-line p-4 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-faint">Public profile <span className="text-amber-600">· required</span></p>
            {[['Display name', 'Vạn Phát Healthcare'], ['Logo · Size', 'VP · 200–500 staff'], ['About', 'Leading private healthcare group…'], ['Website · Benefits', 'vanphat.vn · Insurance, 13th salary']].map(([k, v]) => (
              <div key={k}>
                <p className="mb-1 text-[11.5px] font-medium text-ink/80">{k}</p>
                <div className="rounded-md border border-line px-3 py-2 text-[12px] text-faint">{v}</div>
              </div>
            ))}
          </div>
          {/* preview */}
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
        <div className="mt-3 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-brand">🔗 Same record throughout: CRM #VP-1042 → account → public page. One source of truth.</div>
      </div>
    </div>
  )
}

/* ── My CVs — the CV documents list + the single "Add new CV" flow (Upload / Build).
   One profile, many documents: AI reads an uploaded file to fill the shared profile;
   the file stays as-is by default, optionally re-formatted as a Saramin CV. Same flow
   is reached from Apply → "Create a new CV", so the two never diverge. */
/* ── Add a new CV — its OWN screen, reached from My CVs AND from the Apply
   modal, so both entry points get the identical flow. Full-page takeover — no
   rail, no modal — so the one task gets the user's full attention. */
/* ── The uploaded PDF, rendered as a REAL page — one component, shown everywhere
   the file appears (upload preview, saved confirmation, compare screen), so "your
   PDF" always looks like the same document. White on purpose: a PDF is a white
   page in both app themes. `highlightDates` marks the Zenpay dates the parser
   misses — only the compare screen turns that on. */
function UploadedCvDoc({ highlightDates }: { highlightDates?: boolean }) {
  return (
    <div className="flex min-h-[430px] flex-col rounded-xl border border-line bg-white p-6 text-slate-800 shadow-sm">
      <p className="text-[16px] font-bold tracking-wide">TRẦN MINH ANH</p>
      <p className="text-[11px] font-medium text-slate-500">Product Designer</p>
      <p className="mt-0.5 text-[9.5px] text-slate-400">Hồ Chí Minh · minhanh@email.com · 0901 234 567 · behance.net/minhanh</p>

      <div className="my-3 h-px bg-slate-200" />
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Summary</p>
      <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
        Product designer with 4+ years across web and mobile products at agency and in-house teams. Focused on user research,
        clean interfaces and scalable design systems.
      </p>

      <div className="my-3 h-px bg-slate-200" />
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Experience</p>
      <div className="mt-1">
        <p className="text-[10.5px] font-semibold">Senior Product Designer — Lantern Digital</p>
        <p className="text-[9px] text-slate-400">2022 – Present · Hồ Chí Minh</p>
        <ul className="mt-0.5 list-disc pl-4 text-[9.5px] leading-relaxed text-slate-600">
          <li>Lead designer on the core web product — research, design system, mentoring two juniors</li>
          <li>Design system rollout across 4 product teams</li>
        </ul>
      </div>
      <div className="mt-2">
        <p className="text-[10.5px] font-semibold">Product Designer — Zenpay</p>
        <p className="text-[9px] text-slate-400">
          {highlightDates
            ? <span className="rounded-sm bg-amber-100 px-1 py-px font-medium text-amber-800">03/2020 – 12/2021</span>
            : <span>03/2020 – 12/2021</span>}
          {' '}· Hồ Chí Minh
        </p>
        <ul className="mt-0.5 list-disc pl-4 text-[9.5px] leading-relaxed text-slate-600">
          <li>Designed the merchant dashboard and KYC onboarding flow</li>
          <li>Ran usability tests with 20+ merchants per quarter</li>
        </ul>
      </div>

      <div className="my-3 h-px bg-slate-200" />
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Education</p>
      <p className="mt-1 text-[10.5px] font-semibold">University of Economics HCMC</p>
      <p className="text-[9px] text-slate-400">Bachelor · Business Information Systems · 2016 – 2020</p>

      <div className="my-3 h-px bg-slate-200" />
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Skills</p>
      <p className="mt-1 text-[9.5px] text-slate-600">Figma · UI Design · Sketch · Adobe CC · HTML/CSS basics</p>

      <p className="mt-auto pt-4 text-[9.5px] text-slate-400">CV_TranMinhAnh.pdf · 1.2 MB · exactly as recruiters would download it</p>
    </div>
  )
}

function AddCvScreen() {
  const go = useNav()
  const [step, setStep] = useState<'choose' | 'upload' | 'saved' | 'reading'>('choose')
  const [chosen, setChosen] = useState(false)
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className={cn('mx-auto px-5 py-8', step === 'upload' || step === 'saved' ? 'max-w-[860px]' : 'max-w-[620px]')}>
        <button onClick={() => go('js-my-cvs')} className="mb-5 text-[11.5px] font-medium text-muted hover:text-brand">← Back to My CVs</button>

        {step === 'choose' && (
          <>
            <p className="text-[18px] font-bold text-ink">Add a new CV</p>
            <p className="mt-1 text-[12px] text-muted">Two different intents, two paths — upload the file you have, or create a Saramin CV.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <button onClick={() => setStep('upload')} className="rounded-xl border border-line p-5 text-left hover:border-brand/50">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-[19px]">⬆</div>
                <p className="text-[14px] font-bold text-ink">Upload a CV</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">Your PDF, saved as-is — that’s it. Recruiters download exactly the file you upload.</p>
              </button>
              <button onClick={() => go('js-create-cv')} className="rounded-xl border border-line p-5 text-left hover:border-brand/50">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-[19px]">✎</div>
                <p className="text-[14px] font-bold text-ink">Create a Saramin CV</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">The structured CV recruiters can search. Type it in — or upload a PDF to pre-fill the form.</p>
              </button>
            </div>
          </>
        )}

        {step === 'upload' && (
          <>
            <p className="text-[18px] font-bold text-ink">Upload a CV</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* left — the file itself: dropzone, then the PDF PREVIEW once chosen */}
              <div>
                {!chosen ? (
                  <div onClick={() => setChosen(true)} className="grid min-h-[300px] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line py-14 text-center hover:border-brand/50">
                    <div>
                      <p className="text-[26px]">📄</p>
                      <p className="mt-1.5 text-[13px] font-medium text-brand">Choose a file or drop it here</p>
                      <p className="mt-0.5 text-[11.5px] text-faint">.pdf, .doc, .docx · max 3MB · no password</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* the full document, not a thumbnail — the user is about to
                        commit this exact file, so show all of it */}
                    <UploadedCvDoc />
                    <p onClick={() => setChosen(false)} className="mt-1.5 cursor-pointer text-[11px] font-medium text-brand">↺ Choose a different file</p>
                  </div>
                )}
              </div>
              {/* right — what happens with the file + the acceptance rule + actions */}
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-line bg-canvas/40 p-3.5">
                  <p className="text-[12px] font-semibold text-ink">Saved exactly as uploaded</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">Recruiters download this file as-is — we never modify it. You can convert it into a searchable Saramin CV right after saving.</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                  <p className="text-[11.5px] leading-relaxed text-amber-800">A file must contain readable work experience <b>or</b> education to be accepted as a CV — otherwise we’ll ask you to create one instead. Smaller gaps (skills, summary) can be filled in later.</p>
                </div>
                <div className="mt-auto flex justify-end gap-2">
                  <Btn onClick={() => { setChosen(false); setStep('choose') }}>Back</Btn>
                  <Btn primary onClick={() => setStep('saved')}>Save my PDF</Btn>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Saved — the upload intent is DONE here. The Saramin conversion is a
            separate offer, not a step: accepting moves the user onto the
            create-Saramin-CV path; declining costs nothing. */}
        {step === 'saved' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* left — the saved document itself, in full: proof of what "saved
                as-is" means, not just a green sentence about it */}
            <UploadedCvDoc />
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-[14px] font-bold text-emerald-800">✓ CV_TranMinhAnh.pdf is in My CVs</p>
                <p className="mt-1 text-[12px] text-emerald-900/80">Saved exactly as uploaded — recruiters download this file as-is. You can apply with it right now.</p>
              </div>
              <div className="rounded-xl border border-brand/40 bg-brand-soft/40 p-4">
                <p className="text-[13.5px] font-bold text-ink">✨ Also create a Saramin CV from it?</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  AI reads your PDF and builds a structured, searchable version beside it — this is what recruiter search reads.
                  Your PDF is never changed.
                </p>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  <Btn onClick={() => go('js-my-cvs')}>No thanks — I’m done</Btn>
                  <Btn primary onClick={() => { setStep('reading'); setTimeout(() => go('js-cv-compare'), 1500) }}>Convert with AI</Btn>
                </div>
              </div>
              <p className="text-[10.5px] text-faint">Not now? You can convert any time from My CVs.</p>
            </div>
          </div>
        )}

        {step === 'reading' && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-brand-soft text-[26px]">📄</div>
            <div className="mx-auto mb-4 h-1.5 w-44 overflow-hidden rounded-full bg-line"><div className="h-full w-1/2 animate-pulse rounded-full bg-brand" /></div>
            <p className="text-[15px] font-bold text-ink">Reading your CV with AI…</p>
            <p className="mt-1 text-[12px] text-muted">Extracting title, experience, skills and education.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MyCvsScreen() {
  const go = useNav()
  const [searchable, setSearchable] = useState(0)
  const cvs = [
    { name: 'Product Designer CV', kind: 'Uploaded PDF', meta: 'CV_TranMinhAnh.pdf · 26/07/2026 · 1.2 MB', icon: '📄' },
    { name: 'Business Developer CV', kind: 'Saramin template', meta: 'Generated 26/07/2026', icon: '📃' },
  ]

  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-my-cvs" />

        {/* main */}
        <div className="space-y-4">
          {/* ── profile summary — the onboarding data, always on top (Saramin-KR style) ── */}
          <div className="rounded-xl border border-line bg-brand-soft/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold text-ink">
                  Trần Minh Anh
                  <span className="rounded bg-brand px-1.5 py-0.5 text-[9.5px] font-semibold text-white">Đang bật tìm kiếm</span>
                </p>
                {/* the FULL Profile (= onboarding) field set — nothing more, nothing less */}
                <p className="mt-0.5 text-[11px] text-muted">✉ minhanh@email.com · 📱 0901 234 567</p>
                <div className="mt-1.5 grid gap-x-5 gap-y-0.5 text-[11.5px] text-ink/80 sm:grid-cols-2">
                  <p>💼 Desired: <b>Senior Product Designer</b> · Trưởng nhóm</p>
                  <p>📍 Hồ Chí Minh · Hà Nội <span className="text-faint">· open to relocating</span></p>
                  <p>🏭 IT / Software · FMCG</p>
                  <p>💰 20 – 30 tr</p>
                  <p>📈 4 yrs experience · 🎓 Bachelor</p>
                  <p>🟢 Open now</p>
                </div>
              </div>
              <span onClick={() => go('js-profile-cv')} className="shrink-0 cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/70">✎ Edit profile</span>
            </div>
            {/* the counters that make this a homepage, not a form */}
            <div className="mt-3 flex flex-wrap gap-2 border-t border-line-soft pt-3">
              {([['Đề xuất nhận được', '0'], ['Lượt xem CV', '3'], ['Đã ứng tuyển', '5']] as [string, string][]).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11px] text-muted">{k} <b className="text-ink">{v}</b></span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-bold text-ink">My CVs <span className="text-[11px] font-normal text-faint">· {cvs.length} of 3</span></p>
              <p className="max-w-md text-[11.5px] text-faint">Create a CV by uploading a PDF or building one manually. Exactly one CV is searchable by recruiters.</p>
            </div>
            <Btn primary onClick={() => go('js-add-cv')}>+ Add new CV</Btn>
          </div>

          {/* CV list — named CVs, kind as a tag, per-CV searchable toggle (exactly one on) */}
          <div className="space-y-2.5">
            {cvs.map((c, i) => (
              <div key={c.name} className={cn('flex items-center gap-3 rounded-xl border bg-surface p-4', searchable === i ? 'border-brand/40' : 'border-line')}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-rose-50 text-[16px]">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-ink">{c.name} <Chip tone={c.kind === 'Saramin template' ? 'blue' : 'muted'}>{c.kind}</Chip></p>
                  <p className="text-[11px] text-faint">{c.meta}</p>
                </div>
                {/* Cho phép tìm kiếm — switching one ON switches the other OFF (1 searchable CV) */}
                <label onClick={() => setSearchable(i)} className="flex shrink-0 cursor-pointer items-center gap-1.5">
                  <span className="text-[11px] text-muted">Cho phép tìm kiếm</span>
                  <span className={cn('relative h-4 w-7 rounded-full transition-colors', searchable === i ? 'bg-emerald-500' : 'bg-line')}>
                    <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', searchable === i ? 'right-0.5' : 'left-0.5')} />
                  </span>
                </label>
                <div className="hidden shrink-0 items-center gap-3 text-[11px] font-medium text-brand sm:flex">
                  <span className="cursor-pointer">View</span>
                  <span className="cursor-pointer text-muted">Delete</span>
                </div>
              </div>
            ))}
          </div>

          {/* what search actually reads — the 2-table logic, stated plainly */}
          <div className="rounded-xl border border-dashed border-line bg-canvas/40 p-4">
            <p className="text-[12px] font-semibold text-ink">What recruiters find</p>
            <p className="mt-0.5 text-[11.5px] text-muted">Recruiter search reads your <b>Profile</b> (desired job, location, experience — from onboarding) together with your <b>searchable CV</b> (work history, education, skills). Turning “Cho phép tìm kiếm” on another CV moves it — only one CV is searchable at a time.</p>
          </div>
        </div>
      </div>

    </div>
  )
}

/* ── CV compare — the payoff screen after an upload is read: YOUR PDF on the
   left, the SAME information restructured as a Saramin CV on the right, gaps
   flagged inline in the structure, AI-suggested skills as one-tap chips, and
   the format choice at the bottom. Review + compare + choose = one screen. */
function CvCompareScreen() {
  const go = useNav()
  const [added, setAdded] = useState<string[]>([])
  const SUGGESTED = ['Design Systems', 'Prototyping', 'User Research', 'Wireframing']
  return (
    <div>
      <JsHeader active="CV & Profile" />

      {/* top bar — what happened + the exit */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-ink">✨ We read your CV — here it is, two ways</p>
          <p className="text-[11px] text-muted">From <b>CV_TranMinhAnh.pdf</b> · check the Saramin version, fill the flagged gaps, then choose what to save.</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn onClick={() => go('js-my-cvs')}>Cancel</Btn>
          <Btn primary onClick={() => go('js-my-cvs')}>Save</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {/* ── left: their PDF, as uploaded ── */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">📄 Your PDF — as uploaded</p>
          <UploadedCvDoc highlightDates />
        </div>

        {/* ── right: the SAME info, restructured — mirrors the FULL CV structure
             of My Profile (About · Experience · Education · Skills · optional
             sections). Header = the latest one, from onboarding/Profile.
             Missing data = INLINE FIELDS, filled right here reading off the PDF. ── */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-brand">Saramin CV — your information, structured</p>
          <div className="space-y-2.5">
            {/* header — from Profile (onboarding) */}
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-[15px]">🙂</div>
                <p className="text-[13px] font-bold text-ink">Trần Minh Anh</p>
                <span className="ml-auto rounded bg-canvas px-1.5 py-0.5 text-[9.5px] text-faint">from Profile</span>
              </div>
            </div>
            {/* about — extracted summary */}
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-brand">About</p>
              <p className="text-[11.5px] leading-relaxed text-ink/80">Product designer with 4+ years across web and mobile products at agency and in-house teams — research, clean interfaces, scalable design systems.</p>
            </div>
            {/* experience — one complete, one with an INLINE fillable gap */}
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-brand">Experience</p>
              <p className="text-[12px] font-semibold text-ink">Senior Product Designer · Lantern Digital</p>
              <p className="text-[10.5px] text-faint">2022 – Present · Hồ Chí Minh</p>
              <p className="mt-0.5 text-[11px] text-muted">Lead designer on the core web product — research, design system, mentoring.</p>
              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50/50 p-2.5">
                <p className="text-[12px] font-semibold text-ink">Product Designer · Zenpay</p>
                <p className="mt-0.5 text-[10.5px] font-medium text-rose-600">⚠ We couldn’t read the dates — type them here (they’re on your PDF, left)</p>
                {/* the answer to "how do they fill it in": inline fields, right in the structure */}
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <div className="flex h-8 items-center rounded-md border border-rose-300 bg-surface px-2.5 text-[11px] text-faint">Start · MM/YYYY</div>
                  <div className="flex h-8 items-center rounded-md border border-rose-300 bg-surface px-2.5 text-[11px] text-faint">End · MM/YYYY or “current”</div>
                </div>
                <p className="mt-1.5 text-[10px] text-muted">You can save without this — but your years of experience won’t count these dates until they’re filled.</p>
              </div>
            </div>
            {/* education */}
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-brand">Education</p>
              <p className="text-[12px] font-semibold text-ink">University of Economics HCMC</p>
              <p className="text-[10.5px] text-faint">Bachelor · Business Information Systems · 2016 – 2020</p>
            </div>
            {/* skills — extracted + AI-SUGGESTED one-tap chips */}
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-brand">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="blue">Figma</Chip><Chip tone="blue">UI Design</Chip>
                {added.map((s) => <Chip key={s} tone="blue">{s}</Chip>)}
              </div>
              <div className="mt-2.5 rounded-lg bg-brand-soft/50 p-2.5">
                <p className="mb-1.5 text-[10.5px] font-semibold text-brand">✨ AI suggests — people with your experience also list:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED.filter((s) => !added.includes(s)).map((s) => (
                    <span key={s} onClick={() => setAdded((a) => [...a, s])} className="cursor-pointer rounded-full border border-dashed border-brand/50 px-2.5 py-1 text-[11px] text-brand hover:bg-brand-soft">＋ {s}</span>
                  ))}
                  {SUGGESTED.every((s) => added.includes(s)) && <span className="text-[10.5px] text-muted">All added 🎉</span>}
                </div>
              </div>
            </div>
            {/* optional sections — same list as My Profile, compact add prompts */}
            <div className="rounded-xl border border-dashed border-line bg-canvas/30 p-3.5">
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-faint">Add more — boosts your visibility</p>
              <div className="flex flex-wrap gap-1.5">
                {(['🌐 Foreign Language', '📁 Highlight Project', '📜 Certificates', '🏆 Awards', '🎯 Activities', '📰 Publications', '👥 References'] as string[]).map((s) => (
                  <span key={s} className="cursor-pointer rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink/70 hover:border-brand/40">＋ {s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── save — two explicit buttons; the filled-in info is saved to the CV
           record either way (the PDF file itself is never modified) ── */}
      <div className="border-t border-line bg-surface px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button onClick={() => go('js-my-cvs')} className="rounded-lg border-2 border-line px-4 py-2.5 text-[12.5px] font-semibold text-ink hover:border-brand/50">📄 Save as original PDF</button>
          <button onClick={() => go('js-my-cvs')} className="rounded-lg bg-brand px-4 py-2.5 text-[12.5px] font-semibold text-white hover:opacity-90">📃 Save as Saramin CV</button>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-faint">
          Either way, everything you typed here (dates, skills, …) is saved with the CV — recruiters searching or screening read that data even when they download your original PDF. The file itself is never modified.
        </p>
      </div>
    </div>
  )
}

/* ── Onboarding — a short GUIDED wizard (the Saramin-KR pattern): a few
   RELEVANT questions (job wanted · region · experience · education · get-seen),
   each step framed with a live job-count carrot, ending on a screen of matched
   jobs — from which we lead the candidate into creating their CV. No upload /
   build fork here; that lives on the My CVs page. */
function OnboardingScreen() {
  const go = useNav()
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 'results'>(1)
  const counts: Record<number, string> = { 1: '', 2: '61,341', 3: '12,231', 4: '8,400', 5: '6,900' }
  const Bar = ({ n }: { n: number }) => (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
        <span>Step {n} of 5</span>
        {counts[n] && <span className="font-medium text-brand">✨ {counts[n]} jobs match so far</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${n * 20}%` }} /></div>
    </div>
  )
  const Fld = ({ label, ph }: { label: string; ph?: string }) => (
    <div><p className="mb-1 text-[11.5px] font-medium text-ink">{label}</p><div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">{ph}</div></div>
  )
  const Nav = ({ back, next, nextLabel = 'Next' }: { back?: () => void; next: () => void; nextLabel?: string }) => (
    <div className="mt-5 flex justify-between">{back ? <Btn onClick={back}>Before</Btn> : <span />}<Btn primary onClick={next}>{nextLabel}</Btn></div>
  )
  return (
    <div className="min-h-[560px] bg-canvas/40">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
        <span className="text-[13px] font-bold text-brand">Saramin<span className="text-ink">VN</span></span>
      </div>
      <div className="grid place-items-center px-4 py-8">
        {step !== 'results' ? (
          <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <Bar n={step} />
            {step === 1 && (
              <>
                <p className="text-[15px] font-bold text-ink">What kind of work are you looking for?</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Tell us the role — personalized job matches begin from here.</p>
                <div className="mt-3"><div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-canvas/30 px-3 text-[12px] text-faint">🔍 e.g. Product Designer at an IT company</div></div>
                <Nav next={() => setStep(2)} />
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-[15px] font-bold text-ink">Which region would you like to work in?</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Pick up to 3.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Remote', 'Overseas'].map((c, i) => (
                    <span key={c} className={cn('rounded-full border px-2.5 py-1 text-[11.5px]', i < 2 ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink/70')}>{c}</span>
                  ))}
                </div>
                <label className="mt-3 flex items-center gap-2 text-[11.5px] text-ink/80"><span className="grid h-4 w-4 place-items-center rounded bg-brand text-[10px] text-white">✓</span> I’m open to relocating</label>
                <Nav back={() => setStep(1)} next={() => setStep(3)} />
              </>
            )}
            {step === 3 && (
              <>
                <p className="text-[15px] font-bold text-ink">Your work experience</p>
                <div className="mt-3 space-y-3">
                  <Fld label="Total years of experience" ph="e.g. 4 years" />
                </div>
                <p className="mt-2 text-[10.5px] text-faint">Just the total — your work history itself lives on your CV, where we can read it from an upload.</p>
                <Nav back={() => setStep(2)} next={() => setStep(4)} />
              </>
            )}
            {step === 4 && (
              <>
                <p className="text-[15px] font-bold text-ink">Your highest level of education</p>
                <div className="mt-3 space-y-3">
                  <Fld label="Highest level of education" ph="e.g. Bachelor’s degree" />
                </div>
                <p className="mt-2 text-[10.5px] text-faint">School and major go on your CV — no need to type them here.</p>
                <Nav back={() => setStep(3)} next={() => setStep(5)} />
              </>
            )}
            {step === 5 && (
              <>
                <p className="text-[15px] font-bold text-ink">What are you aiming for?</p>
                <p className="mt-0.5 text-[11.5px] text-muted">These sharpen your matches — recruiters filter on them.</p>
                <div className="mt-3 space-y-3">
                  <Fld label="Desired job level" ph="Nhân viên · Trưởng nhóm · Trưởng phòng · …" />
                  <div>
                    <p className="mb-1 text-[11.5px] font-medium text-ink">Desired industry (up to 3)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['IT / Software', 'FMCG', 'Banking', 'Healthcare', 'Education', 'Logistics'].map((c, i) => (
                        <span key={c} className={cn('rounded-full border px-2.5 py-1 text-[11.5px]', i < 2 ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink/70')}>{c}</span>
                      ))}
                    </div>
                  </div>
                  <Fld label="Desired salary (optional)" ph="e.g. 20 – 30 tr / month" />
                </div>
                <Nav back={() => setStep(4)} next={() => setStep('results')} nextLabel="See my matches →" />
              </>
            )}
          </div>
        ) : (
          /* ── Final step — the Saramin-KR pattern: a LONG page of matched jobs,
             then the single CTA that leads into creating a CV. ── */
          <div className="w-full max-w-[720px]">
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <p className="text-[19px] font-bold leading-snug text-ink">We found<br /><span className="text-brand">the best job postings</span> based on the information you entered!</p>
              <p className="mt-1.5 text-[12px] text-muted">Save the ones you like — you can apply immediately after completing your CV. Saved jobs live in <b>My page › Saved jobs</b>.</p>

              {/* matched grid — 2 rows of 3 */}
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {([
                  ['Product Designer', 'Lantern Digital', 'Hồ Chí Minh', '92% match'],
                  ['Senior UX Designer', 'Zenpay', 'Hồ Chí Minh', '88% match'],
                  ['UI Designer', 'FPT Software', 'Hà Nội', '84% match'],
                  ['Design Lead', 'Tiki', 'Hồ Chí Minh', '80% match'],
                  ['Product Designer (Fintech)', 'MoMo', 'Hồ Chí Minh', '78% match'],
                  ['UX Researcher', 'One Mount', 'Hà Nội', '75% match'],
                ] as [string, string, string, string][]).map(([title, co, loc, match]) => (
                  <div key={title} className="rounded-xl border border-line p-3 hover:border-brand/40">
                    <div className="mb-1.5 grid h-8 w-8 place-items-center rounded-md bg-canvas text-[12px]">🏢</div>
                    <p className="text-[12px] font-semibold leading-snug text-ink">{title}</p>
                    <p className="text-[11px] text-ink/70">{co}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">📍 {loc}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-semibold text-brand">🔥 {match}</span>
                      <span className="cursor-pointer text-[12px] text-faint">☆</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[11.5px] text-muted">‹ View more customized job postings <b className="text-brand">1</b> / 5 ›</p>

              {/* second rail — by desired industry */}
              <p className="mt-5 border-t border-line-soft pt-4 text-[13px] font-bold text-ink">IT / Software openings for you</p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-3">
                {([
                  ['Frontend Engineer', 'Shopee', 'Hồ Chí Minh'],
                  ['Product Owner', 'VNG', 'Hồ Chí Minh'],
                  ['Business Analyst', 'Techcombank', 'Hà Nội'],
                ] as [string, string, string][]).map(([title, co, loc]) => (
                  <div key={title} className="rounded-xl border border-line p-3 hover:border-brand/40">
                    <div className="mb-1.5 grid h-8 w-8 place-items-center rounded-md bg-canvas text-[12px]">🏢</div>
                    <p className="text-[12px] font-semibold leading-snug text-ink">{title}</p>
                    <p className="text-[11px] text-ink/70">{co}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">📍 {loc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* the single next action — into the CV flow */}
            <div className="mt-4 flex flex-col items-center gap-2 pb-6">
              <button onClick={() => go('js-my-cvs')} className="rounded-full bg-brand px-6 py-3 text-[13.5px] font-semibold text-white shadow-sm hover:opacity-90">Complete your CV and go apply →</button>
              <span onClick={() => go('js-home')} className="cursor-pointer text-[11.5px] text-muted">Browse all jobs first</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── My applications — the jobseeker's view of every application: where it is
   in the pipeline (incl. the HQ screening step — sold as a feature, shown
   honestly), which CV was sent, and what happened when. List + detail. */
function MyApplicationsScreen() {
  const [sel, setSel] = useState<number | null>(null)
  const APPS = [
    { job: 'Senior Frontend Engineer', co: 'FPT Software', applied: '02/08/2026', cv: 'CV_TranMinhAnh.pdf', status: 'Interview', tone: 'amber' as const, note: 'Interview scheduled — 08/08, 10:00' },
    { job: 'Product Designer', co: 'Lantern Digital', applied: '30/07/2026', cv: 'My Saramin CV', status: 'Forwarded', tone: 'blue' as const, note: 'Passed Saramin screening · sent to employer' },
    { job: 'UI Designer', co: 'Zenpay', applied: '28/07/2026', cv: 'My Saramin CV', status: 'Screening', tone: 'blue' as const, note: 'Being screened by Saramin' },
    { job: 'UX Researcher', co: 'Tiki', applied: '20/07/2026', cv: 'CV_TranMinhAnh.pdf', status: 'Offer', tone: 'green' as const, note: 'Offer received 🎉' },
    { job: 'Design Lead', co: 'MWG', applied: '12/07/2026', cv: 'My Saramin CV', status: 'Not selected', tone: 'muted' as const, note: 'Closed by employer' },
  ]
  const TIMELINE: [string, string, boolean][] = [
    ['Submitted', 'You applied with CV_TranMinhAnh.pdf', true],
    ['Saramin screening', 'Quality-checked by Saramin — passed', true],
    ['Forwarded to employer', 'Your application reached FPT Software', true],
    ['Viewed by employer', 'FPT Software opened your CV', true],
    ['Interview', 'Scheduled — 08/08, 10:00 (check email)', true],
    ['Result', 'Waiting', false],
  ]
  const a = sel !== null ? APPS[sel] : null
  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-applications" />

        {/* main */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[15px] font-bold text-ink">My applications</p>
            <div className="flex gap-1.5">
              {['All (5)', 'In progress (3)', 'Offer (1)', 'Closed (1)'].map((f, i) => (
                <span key={f} className={cn('cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium', i === 0 ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted')}>{f}</span>
              ))}
            </div>
          </div>

          {APPS.map((app, i) => (
            <div key={app.job} onClick={() => setSel(i)} className="cursor-pointer rounded-xl border border-line bg-surface p-4 hover:border-brand/40">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-canvas text-[14px]">🏢</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{app.job}</p>
                  <p className="text-[11.5px] text-ink/70">{app.co}</p>
                  <p className="mt-0.5 text-[11px] text-faint">Applied {app.applied} · with <span className="font-medium text-ink/70">{app.cv}</span></p>
                </div>
                <div className="shrink-0 text-right">
                  <Chip tone={app.tone}>{app.status}</Chip>
                  <p className="mt-1 max-w-[180px] text-[10.5px] text-faint">{app.note}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-faint">Every application passes Saramin screening before it reaches the employer — that is why high-quality CVs get responses faster.</p>
        </div>
      </div>

      {/* ── application detail ── */}
      {a && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/30 px-4 pt-8">
          <div className="flex max-h-[590px] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div><p className="text-[14px] font-bold text-ink">{a.job}</p><p className="text-[11px] text-muted">{a.co} · applied {a.applied}</p></div>
              <span className="cursor-pointer text-faint" onClick={() => setSel(null)}>✕</span>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-thin p-4">
              <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
                <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-md bg-rose-50 text-[13px]">📄</span><div><p className="text-[12px] font-semibold text-ink">{a.cv}</p><p className="text-[10.5px] text-faint">The exact snapshot sent — later edits don’t change it</p></div></div>
                <span className="cursor-pointer text-[11px] font-medium text-brand">View</span>
              </div>
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Progress</p>
                <div className="space-y-0">
                  {TIMELINE.map(([t, d, done], i) => (
                    <div key={t} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px]', done ? 'bg-emerald-500 text-white' : 'border-2 border-line bg-surface')}>{done ? '✓' : ''}</span>
                        {i < TIMELINE.length - 1 && <span className={cn('w-px flex-1', done ? 'bg-emerald-300' : 'bg-line')} style={{ minHeight: 18 }} />}
                      </div>
                      <div className="pb-3">
                        <p className={cn('text-[12px] font-medium', done ? 'text-ink' : 'text-faint')}>{t}</p>
                        <p className="text-[11px] text-muted">{d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <span className="cursor-pointer text-[11.5px] font-medium text-rose-500">Withdraw application</span>
              <Btn onClick={() => setSel(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sign up — account creation, the FIRST step of the sign-up flow.
   Create account (email or social) → Onboarding (build profile) → browse jobs.
   Uses ONE "Full name" field (the platform-wide standard, no first/last split). */
function SignUpScreen() {
  const go = useNav()
  return (
    <div className="min-h-[560px] bg-canvas/40">
      <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-3">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-[11px] font-bold text-white">S</span>
        <span className="text-[13px] font-bold text-brand">Saramin<span className="text-ink">VN</span></span>
      </div>
      <div className="grid place-items-center px-4 py-8">
        <div className="w-full max-w-[380px] rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-center text-[16px] font-bold text-ink">Create your account</p>
          <p className="mx-auto mt-1 max-w-xs text-center text-[12px] text-muted">One account to apply, save jobs and be found by recruiters.</p>

          {/* social — pre-verified, goes straight on to onboarding */}
          <div className="mt-4 space-y-2">
            {([['🟢', 'Continue with Google'], ['🔵', 'Continue with Facebook']] as [string, string][]).map(([ic, label]) => (
              <button key={label} onClick={() => go('js-onboarding')} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-[12.5px] font-medium text-ink hover:border-brand/50"><span>{ic}</span>{label}</button>
            ))}
          </div>
          <div className="my-3 flex items-center gap-2 text-[11px] text-faint"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>

          {/* email */}
          <div className="space-y-2.5">
            <div><p className="mb-1 text-[11.5px] font-medium text-ink">Full name</p><div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">One field — no first / last split</div></div>
            <div><p className="mb-1 text-[11.5px] font-medium text-ink">Email</p><div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">you@email.com</div></div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink">Password</p>
              <div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">••••••••</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {['12+ chars', '1 number', '1 symbol', '1 uppercase'].map((r) => <span key={r} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-muted"><span className="text-emerald-500">✓</span>{r}</span>)}
              </div>
            </div>
            <label className="flex items-start gap-2 text-[10.5px] leading-relaxed text-muted"><span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />I agree to Saramin’s Terms &amp; Privacy Policy.</label>
          </div>

          <button onClick={() => go('js-onboarding')} className="mt-4 w-full rounded-lg bg-brand py-2.5 text-[13px] font-semibold text-white">Create account</button>
          <p className="mt-3 text-center text-[11.5px] text-muted">Already have an account? <span className="cursor-pointer font-medium text-brand">Sign in</span></p>
        </div>
        <p className="mt-3 text-[11px] text-faint">Next: we’ll help you build your profile — upload a CV or answer a few questions.</p>
      </div>
    </div>
  )
}

/* ── Registry ────────────────────────────────────────────────────────────── */

export interface Screen {
  id: string
  site: string
  title: string
  url: string
  Comp: () => JSX.Element
}

export const SCREENS: Screen[] = [
  { id: 'js-home', site: 'Jobseeker', title: 'Homepage / job list', url: 'saramin.vn', Comp: HomeScreen },
  { id: 'js-search', site: 'Jobseeker', title: 'Search results', url: 'saramin.vn/jobs?q=frontend', Comp: SearchScreen },
  { id: 'js-job-detail', site: 'Jobseeker', title: 'Job detail', url: 'saramin.vn/job/senior-frontend', Comp: JobDetailScreen },
  { id: 'js-apply', site: 'Jobseeker', title: 'Apply flow', url: 'saramin.vn/job/…/apply', Comp: ApplyScreen },
  { id: 'js-mypage', site: 'Jobseeker', title: 'My page', url: 'saramin.vn/my-page', Comp: MyPageScreen },
  { id: 'js-my-cvs', site: 'Jobseeker', title: 'My CVs', url: 'saramin.vn/my-page/cvs', Comp: MyCvsScreen },
  { id: 'js-add-cv', site: 'Jobseeker', title: 'Add a new CV', url: 'saramin.vn/cv/new', Comp: AddCvScreen },
  { id: 'js-cv-compare', site: 'Jobseeker', title: 'CV compare (after upload)', url: 'saramin.vn/cv/review', Comp: CvCompareScreen },
  { id: 'js-profile-cv', site: 'Jobseeker', title: 'My Profile', url: 'saramin.vn/my-page/profile', Comp: ProfileCvScreen },
  { id: 'js-create-cv', site: 'Jobseeker', title: 'Create CV', url: 'saramin.vn/cv/create', Comp: CreateCvScreen },
  { id: 'js-applications', site: 'Jobseeker', title: 'My applications', url: 'saramin.vn/my-page/applications', Comp: MyApplicationsScreen },
  { id: 'js-signup', site: 'Jobseeker', title: 'Sign up', url: 'saramin.vn/signup', Comp: SignUpScreen },
  { id: 'js-onboarding', site: 'Jobseeker', title: 'Onboarding', url: 'saramin.vn/welcome', Comp: OnboardingScreen },
  // Admin / CRM — the lead → customer activation flow
  { id: 'crm-pipeline', site: 'Admin · CRM', title: '1 · Sales pipeline', url: 'admin/sales/customers', Comp: CrmPipelineScreen },
  { id: 'crm-customer', site: 'Admin · CRM', title: '2 · Customer (Won) → activate', url: 'admin/sales/customers/vanphat', Comp: CrmCustomerScreen },
  { id: 'crm-activate', site: 'Admin · CRM', title: '3 · Create account', url: 'admin/accounts/new', Comp: CrmActivateScreen },
  { id: 'crm-products', site: 'Admin · CRM', title: '4 · Choose products', url: 'admin/accounts/vanphat/products', Comp: CrmProductsScreen },
  { id: 'crm-company-page', site: 'Admin · CRM', title: '5 · Company detail page', url: 'admin/companies/vanphat/profile', Comp: CrmCompanyPageScreen },
]

/** One canvas that swaps screens — driven entirely by clicks inside each screen.
    There is no flow index beside it on purpose: a list of every screen lets a
    reader jump straight to "My CV & Profile" without ever going through Apply,
    which is exactly the reading a clickable prototype exists to prevent. The
    only way through is the way a candidate actually goes. */
function InteractivePrototype() {
  const byId = new Map(SCREENS.map((s) => [s.id, s]))
  const [active, setActive] = useState('js-home')
  const current = byId.get(active) ?? SCREENS[0]
  const Comp = current.Comp
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Chip tone="blue">Interactive</Chip>
        <span className="text-[12.5px] font-semibold text-ink">{current.title}</span>
        <span className="text-[11px] text-faint">— click buttons, job cards &amp; menu items to move between screens</span>
      </div>
      <NavContext.Provider value={setActive}>
        <Browser url={current.url}>
          <Comp />
        </Browser>
      </NavContext.Provider>
    </div>
  )
}

export function Mockups() {
  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframes</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">Mockups — core flows</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/75 max-w-[72ch]">
          Low-fidelity wireframes of the candidate-facing recruitment flow (VN-market standards). Click
          buttons, job cards and menu items inside a screen to move through the flow the way a candidate
          would. Structure &amp; layout only — not final visual design.
        </p>
      </div>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-[16px] font-bold">Interactive prototype</h2>
          <Chip tone="blue">Clickable</Chip>
        </div>
        <p className="mb-3 max-w-[72ch] text-[12.5px] text-muted">
          Try the happy path: Home → click a job → <b>Apply now</b> → submit → My page → <b>My CV &amp; Profile</b>.
        </p>
        <InteractivePrototype />
      </section>
    </div>
  )
}
