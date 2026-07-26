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
  { id: 'js-create-cv', site: 'Jobseeker', title: 'Create CV', url: 'saramin.vn/cv/create', Comp: CreateCvScreen },
  // Admin / CRM — the lead → customer activation flow
  { id: 'crm-pipeline', site: 'Admin · CRM', title: '1 · Sales pipeline', url: 'admin/sales/customers', Comp: CrmPipelineScreen },
  { id: 'crm-customer', site: 'Admin · CRM', title: '2 · Customer (Won) → activate', url: 'admin/sales/customers/vanphat', Comp: CrmCustomerScreen },
  { id: 'crm-activate', site: 'Admin · CRM', title: '3 · Create account', url: 'admin/accounts/new', Comp: CrmActivateScreen },
  { id: 'crm-products', site: 'Admin · CRM', title: '4 · Choose products', url: 'admin/accounts/vanphat/products', Comp: CrmProductsScreen },
  { id: 'crm-company-page', site: 'Admin · CRM', title: '5 · Company detail page', url: 'admin/companies/vanphat/profile', Comp: CrmCompanyPageScreen },
]

const PLANNED = [
  { site: 'Companies', items: ['See the Company mockups (employer portal) →'] },
  { site: 'Admin', items: ['See the Admin console wireframe →'] },
]

export function Mockups() {
  return (
    <div className="max-w-[1180px] pb-16">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframes</p>
        <h1 className="text-[26px] font-bold tracking-tight mt-1">Mockups — core flows</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/75 max-w-[72ch]">
          Low-fidelity wireframes of the candidate-facing recruitment flow (VN-market standards), top to
          bottom starting from the Homepage. Structure &amp; layout only — not final visual design.
        </p>
      </div>

      <div className="space-y-8">
        {SCREENS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-4">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-[15px] font-semibold">{s.title}</h2>
              <Chip tone="green">{s.site}</Chip>
            </div>
            <Browser url={s.url}>
              <s.Comp />
            </Browser>
          </section>
        ))}

        {/* pointers to the other mockup sets */}
        <div className="rounded-xl border border-dashed border-line bg-canvas/40 p-4 text-[12.5px] leading-relaxed text-muted">
          {PLANNED.map((g) => (
            <p key={g.site}>
              <span className="font-semibold text-ink/70">{g.site}:</span> {g.items.join(' · ')}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
