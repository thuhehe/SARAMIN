import { useSearchParams } from 'react-router-dom'
import { Browser, JsHeader, JobCard, Btn, Chip, Line, SectionTitle } from '@/components/wire'
import { cn } from '@/lib/utils'

/* ── Jobseeker screens (VN recruitment standard) ─────────────────────────── */

function HomeScreen() {
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
          <Btn primary className="px-5">Search</Btn>
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
          <JobCard title="Senior Frontend Engineer" company="FPT Software" salary="30 – 45 tr" />
          <JobCard title="Digital Marketing Lead" company="Tiki" salary="Thỏa thuận" location="Hà Nội" />
          <JobCard title="Accountant" company="VNG" salary="18 – 25 tr" />
          <JobCard title="Product Manager" company="MoMo" salary="Up to 60 tr" />
        </div>
      </div>
      {/* top companies */}
      <div className="px-5 pb-6">
        <SectionTitle more>Top companies</SectionTitle>
        <div className="flex gap-2.5 overflow-x-auto">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-32 shrink-0 rounded-lg border border-line p-3 text-center">
              <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-canvas" />
              <Line w="80%" className="mx-auto mb-1" />
              <Line w="55%" h={6} className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchScreen() {
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
          {['Location', 'Category / industry', 'Salary range', 'Experience level', 'Job type', 'Work arrangement', 'Posted date'].map((f) => (
            <div key={f}>
              <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">{f}</p>
              <div className="space-y-1">
                <Line w="90%" h={7} /><Line w="70%" h={7} />
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
            <JobCard title="Frontend Engineer (ReactJS)" company="Shopee" salary="25 – 40 tr" />
            <JobCard title="Senior Frontend Developer" company="Grab" salary="Thỏa thuận" />
            <JobCard title="Frontend Intern" company="Base.vn" salary="8 – 12 tr" />
            <JobCard title="Fullstack (FE-heavy)" company="Techcombank" salary="30 – 50 tr" />
            <JobCard title="UI Engineer" company="One Mount" salary="Up to 45 tr" />
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
              <Btn primary className="flex-1">Apply now</Btn>
              <Btn>♡ Save</Btn>
            </div>
            <p className="mt-2 text-[11px] text-faint">Deadline: 31/08/2026</p>
          </div>
          {/* body */}
          {['Job description', 'Requirements', 'Benefits'].map((h) => (
            <div key={h} className="mt-4">
              <p className="mb-2 text-[13.5px] font-bold text-ink">{h}</p>
              <div className="space-y-1.5"><Line /><Line w="95%" /><Line w="88%" /><Line w="60%" /></div>
            </div>
          ))}
        </div>
        {/* right rail */}
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12px] font-bold">About the company</p>
            <div className="mb-2 h-10 w-10 rounded-md bg-canvas" />
            <Line w="80%" className="mb-1.5" /><Line w="60%" h={7} />
            <div className="mt-2"><Chip>10,000+ staff</Chip></div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="mb-2 text-[12px] font-bold">Similar jobs</p>
            <div className="space-y-2"><Line /><Line w="90%" /><Line w="80%" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApplyScreen() {
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40"><JobDetailScreen /></div>
      {/* modal */}
      <div className="absolute inset-0 bg-black/20 flex items-start justify-center pt-10">
        <div className="w-[92%] max-w-[440px] rounded-xl border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[14px] font-bold">Apply · Senior Frontend Engineer</p>
            <span className="text-faint">✕</span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Choose your CV</p>
              <label className="flex items-center gap-2 rounded-md border border-brand bg-brand-soft px-3 py-2 text-[12px]">
                <span className="h-3 w-3 rounded-full border-2 border-brand bg-brand" /> Online CV — Nguyễn Văn A (default)
              </label>
              <label className="mt-1.5 flex items-center gap-2 rounded-md border border-line px-3 py-2 text-[12px] text-muted">
                <span className="h-3 w-3 rounded-full border border-line" /> Uploaded CV — my-cv.pdf
              </label>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-medium">Cover message <span className="text-faint">(optional)</span></p>
              <div className="h-16 rounded-md border border-line bg-canvas/40" />
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
              Your application is screened by Saramin before it reaches the employer.
            </div>
            <div className="flex justify-end gap-2">
              <Btn>Cancel</Btn><Btn primary>Submit application</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MyPageScreen() {
  const menu = ['My page', 'My CVs', 'My applications', 'Saved jobs', 'Settings']
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 p-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-line p-4 text-center">
            <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-canvas" />
            <Line w="70%" className="mx-auto mb-1" /><Line w="50%" h={6} className="mx-auto" />
          </div>
          <div className="rounded-xl border border-line p-2">
            {menu.map((m, i) => (
              <p key={m} className={cn('rounded px-3 py-1.5 text-[12.5px]', i === 0 ? 'bg-brand-soft font-medium text-brand' : 'text-ink/70')}>{m}</p>
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
            <SectionTitle>My CVs</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-line p-3"><Chip tone="green">Default</Chip><Line w="70%" className="mt-2 mb-1" /><Line w="45%" h={6} /></div>
              <div className="grid place-items-center rounded-lg border border-dashed border-line p-3 text-[12px] text-brand">+ Create CV</div>
            </div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <SectionTitle more>Recent applications</SectionTitle>
            <div className="space-y-2">
              {['Applied', 'Screening', 'Sent to employer'].map((s) => (
                <div key={s} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
                  <Line w="45%" /><Chip tone="amber">{s}</Chip>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateCvScreen() {
  const sections = ['Contact & profile', 'Professional summary', 'Work experience', 'Education', 'Skills', 'Languages']
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-[14px] font-bold">Create CV — Online builder</p>
        <div className="flex gap-2"><Btn>Save draft</Btn><Btn primary>Save & publish</Btn></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
        {/* form */}
        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={s} className="rounded-lg border border-line p-3">
              <p className="mb-2 text-[12.5px] font-semibold">{i + 1}. {s}</p>
              <div className="space-y-1.5"><Line /><Line w="85%" />{i < 3 && <Line w="60%" />}</div>
            </div>
          ))}
        </div>
        {/* live preview */}
        <div className="rounded-lg border border-line bg-canvas/30 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-faint">Live preview</p>
          <div className="rounded-md bg-surface border border-line p-4">
            <Line w="55%" h={12} className="mb-2" /><Line w="40%" h={7} className="mb-3" />
            <div className="space-y-1.5"><Line /><Line w="95%" /><Line w="90%" /><Line w="70%" /></div>
            <div className="my-3 h-px bg-line" />
            <div className="space-y-1.5"><Line w="60%" /><Line /><Line w="85%" /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Registry ────────────────────────────────────────────────────────────── */

interface Screen {
  id: string
  site: string
  title: string
  url: string
  Comp: () => JSX.Element
}

const SCREENS: Screen[] = [
  { id: 'js-home', site: 'Jobseeker', title: 'Homepage / job list', url: 'saramin.vn', Comp: HomeScreen },
  { id: 'js-search', site: 'Jobseeker', title: 'Search results', url: 'saramin.vn/jobs?q=frontend', Comp: SearchScreen },
  { id: 'js-job-detail', site: 'Jobseeker', title: 'Job detail', url: 'saramin.vn/job/senior-frontend', Comp: JobDetailScreen },
  { id: 'js-apply', site: 'Jobseeker', title: 'Apply flow', url: 'saramin.vn/job/…/apply', Comp: ApplyScreen },
  { id: 'js-mypage', site: 'Jobseeker', title: 'My page', url: 'saramin.vn/my-page', Comp: MyPageScreen },
  { id: 'js-create-cv', site: 'Jobseeker', title: 'Create CV', url: 'saramin.vn/cv/create', Comp: CreateCvScreen },
]

const PLANNED = [
  { site: 'Companies', items: ['Job list', 'Create job', 'Application list'] },
  { site: 'Admin', items: ['See the Admin console wireframe →'] },
]

export function Mockups() {
  const [params, setParams] = useSearchParams()
  const current = params.get('screen') ?? SCREENS[0].id
  const screen = SCREENS.find((s) => s.id === current) ?? SCREENS[0]

  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframes</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">Mockups — Jobseeker core flow</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/75 max-w-[72ch]">
          Low-fidelity wireframes of the candidate-facing recruitment flow, laid out to VN-market standards
          (VietnamWorks / TopCV / ITviec). Structure &amp; layout only — not final visual design.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5">
        {/* screen selector */}
        <aside className="lg:sticky lg:top-3 h-max rounded-xl border border-line bg-surface p-2">
          <p className="px-2 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest text-faint">Jobseeker</p>
          {SCREENS.map((s) => (
            <button
              key={s.id}
              onClick={() => setParams({ screen: s.id })}
              className={cn(
                'block w-full rounded-md px-3 py-1.5 text-left text-[12.5px] transition-colors',
                s.id === screen.id ? 'bg-brand-soft font-medium text-brand' : 'text-ink/75 hover:bg-canvas/70',
              )}
            >
              {s.title}
            </button>
          ))}
          {PLANNED.map((g) => (
            <div key={g.site}>
              <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-faint">{g.site} · planned</p>
              {g.items.map((it) => (
                <p key={it} className="px-3 py-1.5 text-[12px] text-faint">{it}</p>
              ))}
            </div>
          ))}
        </aside>

        {/* mockup */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[15px] font-semibold">{screen.title}</h2>
            <Chip tone="green">{screen.site}</Chip>
          </div>
          <Browser url={screen.url}>
            <screen.Comp />
          </Browser>
        </div>
      </div>
    </div>
  )
}
