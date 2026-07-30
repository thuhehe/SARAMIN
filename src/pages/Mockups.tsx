import { useState } from 'react'
import { Browser, JsHeader, JobCard, Btn, Chip, SectionTitle, NavContext, useNav } from '@/components/wire'
import { cn } from '@/lib/utils'

/* ── Jobseeker screens (VN recruitment standard) ─────────────────────────── */

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
            <div>
              <p className="mb-1.5 text-[12px] font-medium text-ink">Your CV <span className="text-rose-500">*</span></p>
              <div className="space-y-1.5">
                {([
                  ['saramin', 'Saramin CV', 'Structured profile · 70% complete'],
                  ['portfolio', '📄 Portfolio.pdf', 'Uploaded 26/07/2026 · 1.2 MB'],
                  ['meet', '📄 Meet Thu Nguyen.pdf', 'Uploaded 12/01/2024'],
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
                {/* upload a new CV */}
                <label
                  onClick={() => setCv('new')}
                  className={cn('flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed px-3 py-2', cv === 'new' ? 'border-brand bg-brand-soft' : 'border-line')}
                >
                  <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', cv === 'new' ? 'border-brand' : 'border-line')}>{cv === 'new' && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}</span>
                  <span className="flex-1 text-[12px] text-muted">⬆ Upload a new CV</span>
                  <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-brand">Choose file</span>
                </label>
              </div>
              <p className="mt-1.5 text-[11px] text-faint">.doc, .docx, .pdf · max 5 MB · no password protection.</p>
            </div>

            {/* preferred location — VN standard field */}
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Preferred work location <span className="text-rose-500">*</span></p>
              <div className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-[12px] text-ink/70">Hồ Chí Minh <span className="text-faint">▾</span></div>
            </div>

            {/* cover message */}
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Cover message <span className="text-faint">(optional)</span></p>
              <div className="h-14 rounded-md border border-line bg-canvas/40" />
            </div>

            {/* consent */}
            <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
              <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />
              I agree to share my profile &amp; CV with this employer, per Saramin's privacy policy.
            </label>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              Screened by Saramin before it reaches the employer.
            </div>
          </div>

          {/* footer */}
          <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
            <Btn onClick={() => go('js-job-detail')}>Cancel</Btn>
            <Btn primary onClick={() => go('js-mypage')}>Submit application</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

function MyPageScreen() {
  const go = useNav()
  const menu: [string, string?][] = [['My page'], ['My CVs', 'js-profile-cv'], ['My applications'], ['Saved jobs'], ['Settings']]
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 p-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4 text-center">
            <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-brand to-violet-500" />
            <p className="text-[13px] font-bold text-ink">Nguyễn Thị Thu</p>
            <p className="text-[11px] text-muted">UX/UI Design Lead</p>
          </div>
          <div className="rounded-xl border border-line p-2">
            {menu.map(([m, target], i) => (
              <p
                key={m}
                onClick={() => target && go(target)}
                className={cn('rounded px-3 py-1.5 text-[12.5px]', target && 'cursor-pointer', i === 0 ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70')}
              >
                {m}
              </p>
            ))}
          </div>
        </div>
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

function ProfileCvScreen() {
  const go = useNav()
  const [cvTab, setCvTab] = useState<'saramin' | 'upload'>('saramin')
  const menu: [string, string?][] = [['Dashboard', 'js-mypage'], ['My CV & Profile'], ['My applications'], ['Saved jobs'], ['Settings']]
  const sections: [string, string, boolean][] = [
    ['About me', 'Senior product designer · 8 yrs across B2B SaaS & fintech.', true],
    ['Work experience', 'Design Lead · MoMo · 2021–now  ·  +2 more', true],
    ['Education', 'Banking University of HCMC · 2008–2012', true],
    ['Skills', 'Figma · Design systems · User research  ·  +6', true],
    ['Languages', 'Add your languages to improve matching', false],
  ]
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        {/* left rail */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4 text-center">
            <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-gradient-to-br from-brand to-violet-500" />
            <p className="text-[13px] font-bold text-ink">Nguyễn Thị Thu</p>
            <p className="text-[11px] text-muted">UX/UI Design Lead</p>
            {/* single visibility toggle */}
            <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-canvas/50 px-2.5 py-2 text-left">
              <span className="text-[11px] font-medium text-ink/80">Let recruiters find me</span>
              <span className="relative h-4 w-7 shrink-0 rounded-full bg-emerald-500"><span className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white" /></span>
            </div>
          </div>
          <div className="rounded-xl border border-line p-2">
            {menu.map(([m, target], i) => (
              <p
                key={m}
                onClick={() => target && go(target)}
                className={cn('rounded px-3 py-1.5 text-[12.5px]', target && 'cursor-pointer', i === 1 ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70')}
              >
                {m}
              </p>
            ))}
          </div>
        </div>

        {/* main */}
        <div className="space-y-4">
          {/* CV tabs — like VietnamWorks */}
          <div className="flex gap-1 border-b border-line">
            {([['saramin', 'Saramin CV'], ['upload', 'Uploaded CV']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCvTab(id)}
                className={cn(
                  'relative -mb-px border-b-2 px-4 py-2 text-[13px] font-medium transition-colors',
                  cvTab === id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Uploaded CV — the file recruiters read (primary) */}
          {cvTab === 'upload' && (
            <div className="space-y-3">
              <p className="text-[12px] text-muted">Your own CV file — what recruiters read. <span className="font-medium text-brand">Recommended.</span></p>
              <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[14px]">📄</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">Portfolio.pdf</p>
                  <p className="text-[11px] text-faint">Uploaded 26/07/2026 · 1.2 MB</p>
                </div>
                <Chip tone="green">Approved</Chip>
                <span className="text-[11px] font-medium text-brand">Replace</span>
              </div>
              <div className="grid place-items-center rounded-lg border border-dashed border-line py-6 text-[12px] text-brand">⬆ Upload a new CV</div>
              <p className="text-[11px] text-faint">Supports .doc, .docx, .pdf · under 5 MB · no password protection.</p>
              {/* auto-fill bridge — Phase 2 */}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-brand/50 bg-brand-soft/60 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[11.5px] font-semibold text-brand">✨ Auto-fill my Saramin CV from this file</p>
                  <p className="text-[11px] text-muted">We read the file and pre-fill your Saramin CV — you just confirm. <span className="text-faint">(Phase 2)</span></p>
                </div>
                <Btn primary>Fill profile</Btn>
              </div>
            </div>
          )}

          {/* Saramin CV — structured profile (optional) */}
          {cvTab === 'saramin' && (
            <div className="space-y-3">
              <p className="text-[12px] text-muted">Structured profile — powers recruiter search &amp; matching. <span className="text-faint">Optional.</span></p>
              <div>
                <div className="mb-1 flex justify-between text-[11.5px]"><span className="font-semibold">Profile strength</span><span className="font-bold text-brand">70%</span></div>
                <div className="h-2 w-full rounded-full bg-canvas"><div className="h-2 w-[70%] rounded-full bg-brand" /></div>
                <p className="mt-1 text-[11px] text-muted">Reach 100% to unlock the generated CV template and top recruiter visibility.</p>
              </div>
              {sections.map(([k, v, done]) => (
                <div key={k} className="flex items-start justify-between rounded-lg border border-line px-3 py-2">
                  <div className="min-w-0">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <p className="text-[12px] font-semibold text-ink">{k}</p>
                      {done ? <Chip tone="green">✓</Chip> : <Chip tone="amber">Missing</Chip>}
                    </div>
                    <p className="truncate text-[11.5px] text-muted">{v}</p>
                  </div>
                  <span className="ml-2 shrink-0 text-[11px] font-medium text-brand">{done ? 'Edit' : '+ Add'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateCvScreen() {
  const go = useNav()
  const sections: [string, string[]][] = [
    ['Contact & profile', ['Nguyễn Thị Thu', 'UX/UI Design Lead', 'thu@email.com · 0382 233 670']],
    ['Professional summary', ['Senior product designer with 8 years across B2B SaaS & fintech.']],
    ['Work experience', ['Design Lead · MoMo · 2021–now', 'Senior Designer · Tiki · 2018–2021']],
    ['Education', ['Banking University of HCMC · 2008–2012']],
    ['Skills', ['Figma, Design systems, User research, Prototyping']],
    ['Languages', ['Vietnamese (native), English (fluent)']],
  ]
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-[14px] font-bold">Create CV — Online builder</p>
        <div className="flex gap-2"><Btn>Save draft</Btn><Btn primary onClick={() => go('js-profile-cv')}>Save & publish</Btn></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
        {/* form */}
        <div className="space-y-3">
          {sections.map(([s, fields], i) => (
            <div key={s} className="rounded-lg border border-line p-3">
              <p className="mb-2 text-[12.5px] font-semibold">{i + 1}. {s}</p>
              <div className="space-y-1.5">
                {fields.map((f) => (
                  <div key={f} className="rounded-md border border-line bg-canvas/40 px-2.5 py-1.5 text-[11px] text-muted">{f}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* live preview */}
        <div className="rounded-lg border border-line bg-canvas/30 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-faint">Live preview</p>
          <div className="rounded-md bg-surface border border-line p-4">
            <p className="text-[15px] font-bold text-ink">Nguyễn Thị Thu</p>
            <p className="mb-3 text-[11px] text-muted">UX/UI Design Lead · Hồ Chí Minh</p>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Summary</p>
            <p className="mb-3 text-[11px] leading-relaxed text-muted">Senior product designer with 8 years across B2B SaaS &amp; fintech, leading design systems and 0→1 products.</p>
            <div className="my-3 h-px bg-line" />
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Experience</p>
            <p className="text-[11px] text-ink">Design Lead · MoMo · 2021–now</p>
            <p className="text-[11px] text-muted">Senior Designer · Tiki · 2018–2021</p>
          </div>
        </div>
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
  { id: 'js-profile-cv', site: 'Jobseeker', title: 'My CV & Profile', url: 'saramin.vn/my-page/cv', Comp: ProfileCvScreen },
  { id: 'js-create-cv', site: 'Jobseeker', title: 'Create CV', url: 'saramin.vn/cv/create', Comp: CreateCvScreen },
  // Admin / CRM — the lead → customer activation flow
  { id: 'crm-pipeline', site: 'Admin · CRM', title: '1 · Sales pipeline', url: 'admin/sales/customers', Comp: CrmPipelineScreen },
  { id: 'crm-customer', site: 'Admin · CRM', title: '2 · Customer (Won) → activate', url: 'admin/sales/customers/vanphat', Comp: CrmCustomerScreen },
  { id: 'crm-activate', site: 'Admin · CRM', title: '3 · Create account', url: 'admin/accounts/new', Comp: CrmActivateScreen },
  { id: 'crm-products', site: 'Admin · CRM', title: '4 · Choose products', url: 'admin/accounts/vanphat/products', Comp: CrmProductsScreen },
  { id: 'crm-company-page', site: 'Admin · CRM', title: '5 · Company detail page', url: 'admin/companies/vanphat/profile', Comp: CrmCompanyPageScreen },
]

/** Jobseeker screens grouped into flows (Mobbin-style). Labels override the long registry titles. */
const JS_FLOWS: { flow: string; items: { id: string; label: string }[] }[] = [
  {
    flow: 'Find a job',
    items: [
      { id: 'js-home', label: 'Homepage / job list' },
      { id: 'js-search', label: 'Search results' },
      { id: 'js-job-detail', label: 'Job detail' },
    ],
  },
  {
    flow: 'Apply to a job',
    items: [{ id: 'js-apply', label: 'Apply flow' }],
  },
  {
    flow: 'My profile & CV',
    items: [
      { id: 'js-mypage', label: 'My page' },
      { id: 'js-profile-cv', label: 'My CV & Profile' },
    ],
  },
]

/** One canvas that swaps screens — driven by the flow index on the left and by clicks inside each screen. */
function InteractivePrototype() {
  const byId = new Map(SCREENS.map((s) => [s.id, s]))
  const [active, setActive] = useState('js-home')
  const current = byId.get(active) ?? SCREENS[0]
  const Comp = current.Comp
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
      {/* flow index sidebar */}
      <aside className="scroll-thin self-start rounded-xl border border-line p-2 md:sticky md:top-4 md:max-h-[640px] md:overflow-y-auto">
        <p className="mb-1 border-b border-line-soft px-2 pb-2 pt-1 text-[11px] font-bold text-ink">Jobseeker flows</p>
        {JS_FLOWS.map((g, gi) => (
          <div key={g.flow} className={cn(gi > 0 && 'mt-2.5')}>
            {/* section label — uppercase micro-caps so it never reads as a clickable screen */}
            <p className="px-2 pb-1 pt-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint">
              {g.flow}
            </p>
            {g.items.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={cn(
                  'block w-full truncate rounded px-2 py-1.5 pl-3.5 text-left text-[12px]',
                  id === active ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70 hover:bg-canvas',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* live canvas */}
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
          Low-fidelity wireframes of the candidate-facing recruitment flow (VN-market standards). Pick any
          screen from the index on the left, or click buttons inside a screen to move through the flow.
          Structure &amp; layout only — not final visual design.
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
