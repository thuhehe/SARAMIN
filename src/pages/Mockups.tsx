import { useState } from 'react'
import { Browser, JsHeader, JobCard, Btn, Chip, SectionTitle, NavContext, useNav } from '@/components/wire'
import { BenefitCards } from '@/components/BenefitsField'
import { SaraminCvDoc, CvComposer, CvRichText, normalizeCvText, type CvData } from '@/components/CvDoc'
import { CopyLinkButton, initialScreenParam, useScreenParam } from '@/components/ShareLink'
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
  { label: 'Settings', screen: 'js-settings' },
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
        <div className="mb-2 flex justify-center"><ProfilePhoto photo size="md" /></div>
        <p className="text-[13px] font-bold text-ink">Trần Minh Anh</p>
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
          <div className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-faint">Job title, skill, company…</div>
          <div className="w-full sm:w-44 rounded-md border border-line bg-surface px-3 py-2 text-[12px] text-faint">All locations</div>
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
        <div className="flex-1 rounded-md border border-line px-3 py-2 text-[12px] text-faint">"frontend"</div>
        <div className="w-40 rounded-md border border-line px-3 py-2 text-[12px] text-faint">Hồ Chí Minh</div>
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
            <div className="flex items-center gap-2 text-[11.5px] text-muted">Sort: <Chip tone="blue">Mới cập nhật</Chip><Chip>Relevance</Chip><Chip>Mới nhất</Chip><Chip>Salary</Chip></div>
          </div>
          {/* Tier banding — ONLY in the "Mới cập nhật" sort, which is why that chip is
              the active one here. The pool is ordered Top Job → Distinction → Basic Plus
              → Basic → Free, and auto-refresh only reorders WITHIN a band. Paid slots
              carry the "Tin ưu tiên" badge, because a band can outrank relevance.
              Pick Relevance / Mới nhất / Salary and the bands disappear entirely. */}
          <div className="space-y-2.5">
            <JobCard title="Frontend Engineer (ReactJS)" company="Shopee" salary="25 – 40 tr" tier="Top Job" onClick={() => go('js-job-detail')} />
            <JobCard title="Senior Frontend Developer" company="Grab" salary="Thỏa thuận" tier="Distinction" onClick={() => go('js-job-detail')} />
            <JobCard title="Fullstack (FE-heavy)" company="Techcombank" salary="30 – 50 tr" tier="Basic Plus" onClick={() => go('js-job-detail')} />
            <JobCard title="UI Engineer" company="One Mount" salary="Up to 45 tr" tier="Basic" onClick={() => go('js-job-detail')} />
            <JobCard title="Frontend Intern" company="Base.vn" salary="8 – 12 tr" onClick={() => go('js-job-detail')} />
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
                {/* A USD job displays the figure the employer wrote — never a
                    conversion — plus the settlement line, which is accurate,
                    sets expectations before the interview, and answers the
                    foreign-currency question before a candidate asks it. */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Chip tone="green">1,200 – 1,800 USD</Chip><Chip>Hồ Chí Minh</Chip><Chip>3+ years</Chip><Chip>Full-time</Chip>
                </div>
                <p className="mt-1 text-[10.5px] text-faint">Lương thỏa thuận và chi trả bằng VND theo tỷ giá tại thời điểm ký hợp đồng.</p>
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

          {/* Benefits — icon cards, not bullets. Each one is a TYPE from master data
              (icon + label) plus the company's own description, which is what makes
              them scannable here and filterable in search. */}
          <div className="mt-5">
            <p className="mb-2 text-[13.5px] font-bold text-ink">Các phúc lợi dành cho bạn</p>
            <BenefitCards items={[
              { key: 'salary-13th', text: 'Lương tháng 13, chi trả trước Tết.' },
              { key: 'bonus', text: 'Thưởng KPI theo quý, xét tăng lương 2 lần/năm.' },
              { key: 'insurance', text: '• BHXH – BHYT – BHTN đóng **đầy đủ theo lương**\n• Bảo hiểm tai nạn 24/7\n• Khám sức khoẻ định kỳ hằng năm' },
              { key: 'health', text: 'Bảo hiểm sức khoẻ riêng cho CBNV và người thân.' },
              { key: 'remote-support', text: 'Làm 5 ngày/tuần, hybrid 2 ngày remote.' },
              { key: 'training', text: 'Lộ trình thăng tiến rõ ràng, ngân sách Udemy hàng năm.' },
              { key: 'paid-leave', text: '19 ngày phép/năm, nghỉ sinh nhật.' },
            ]} />
          </div>
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
function ApplyGroup({ n, title, action, children }: { n: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">{n}</span>
        <h4 className="text-[12px] font-semibold text-ink">{title}</h4>
        {action && <span className="ml-auto shrink-0">{action}</span>}
      </div>
      {children}
    </section>
  )
}

function ApplyScreen() {
  const go = useNav()
  const [cv, setCv] = useState<'saramin' | 'portfolio' | 'meet' | 'new'>('saramin')
  const [editing, setEditing] = useState<null | 'basic' | 'prefs'>(null)
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
              {/* SAME row shape as the My CVs list — a candidate should recognise
                  their own shelf here, not learn a second layout for the same thing.
                  productdesign.pdf did NOT qualify for CV search (its extraction was
                  thin) and is still fully selectable here — an uploaded file is never
                  gated at apply, because the doubt is about OUR parser. Only the
                  Saramin CV below the same rule is greyed, further down. */}
              <div className="space-y-1.5">
                {([
                  ['portfolio', '', 'productdesign.pdf', 'Uploaded', 'Uploaded 26/07/2026'],
                  ['saramin', '', 'Business Developer CV', 'Saramin', 'Generated 26/07/2026'],
                ] as const).map(([id, icon, name, kind, meta]) => (
                  <label
                    key={id}
                    onClick={() => setCv(id)}
                    className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5', cv === id ? 'border-brand/50 bg-brand-soft/40' : 'border-line bg-surface')}
                  >
                    <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', cv === id ? 'border-brand' : 'border-line')}>
                      {cv === id && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[14px]">{icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-[12.5px] font-semibold text-ink">{name}</span>
                        <Chip tone={kind === 'Saramin' ? 'blue' : 'muted'}>{kind}</Chip>
                      </span>
                      <span className="block truncate text-[11px] text-faint">{meta}</span>
                    </span>
                  </label>
                ))}
                {/* The SAME qualification rule as every other CV (≥1 experience — or
                    ≥1 education entry for a fresher — and ≥3 skills), but the strict
                    consequence: a SARAMIN CV below it cannot be sent, because we
                    generate that document ourselves. VNW pattern — greyed,
                    unselectable, missing fields NAMED, one link into the editor. */}
                <div className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas/40 p-2.5">
                  <span className="grid h-3.5 w-3.5 shrink-0 rounded-full border-2 border-line bg-canvas" />
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[14px] opacity-50">📄</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-[12.5px] font-semibold text-muted">UX Designer CV</span>
                      <Chip tone="blue">Saramin</Chip>
                      <Chip tone="amber">⚠ Chưa đủ thông tin</Chip>
                    </span>
                    <span className="block text-[11px] text-faint">
                      Chưa đủ thông tin — cần bổ sung kinh nghiệm hoặc kỹ năng{' '}
                      <span onClick={() => go('js-my-cvs')} className="cursor-pointer font-medium text-brand">Cập nhật hồ sơ →</span>
                    </span>
                  </span>
                </div>
                {/* REJECTED — refused here too, but for a different reason and with a
                    different fix: there is no field to complete, so the row offers a
                    replacement rather than a link into the editor. The chip is the
                    VERDICT chip from My CVs (rose “Chưa được duyệt — <reason>”),
                    not a fourth auto-status — “not a CV” is a rejection reason,
                    judged by a human. */}
                <div className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas/40 p-2.5">
                  <span className="grid h-3.5 w-3.5 shrink-0 rounded-full border-2 border-line bg-canvas" />
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[14px] opacity-50">📄</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-[12.5px] font-semibold text-muted">scan_cu.pdf</span>
                      <Chip tone="muted">Uploaded</Chip>
                      <Chip tone="rose">Chưa được duyệt — Không phải CV</Chip>
                    </span>
                    <span className="block text-[11px] text-faint">
                      File bạn tải lên không phải một CV{' '}
                      <span onClick={() => go('js-add-cv')} className="cursor-pointer font-medium text-brand">Tải lên CV khác →</span>
                    </span>
                  </span>
                </div>
                {/* REMOVED (2026-08-20): the amber notice that appeared when the
                    selected upload was in doubt — “CV đang được kiểm tra / chưa đủ
                    điều kiện gửi đi”. An upload in doubt is OUR uncertainty about
                    our own parse, and warning the candidate at the moment they
                    apply makes them doubt a CV a human may well approve minutes
                    later. Doubt is invisible on every jobseeker surface; only a
                    DECIDED rejection is ever spoken about. */}
                <button
                  onClick={() => go('js-add-cv')}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-line px-3 py-2.5 text-left hover:border-brand/50"
                >
                  <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2 border-line text-[10px] font-bold text-brand">＋</span>
                  <span className="flex-1 text-[12px] text-muted">Add a new CV <span className="text-faint">— upload or build</span></span>
                  <span className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-brand">Open</span>
                </button>
              </div>
            </ApplyGroup>

            {/* Your profile — the SAME card as My CVs, so the candidate reads back
                exactly what they saw there. Read-only with a per-group Edit; applying
                is a confirmation, not a form. */}
            {/* Cover letter sits SECOND: it is the only thing on this screen the
                candidate actually writes for THIS job. The profile below is a
                read-back, so it belongs after the work, not before it. */}
            <ApplyGroup n={2} title="Cover letter">
              <div className="h-14 rounded-md border border-line bg-canvas/40" />
            </ApplyGroup>

            <ApplyGroup n={3} title="Your profile">
              <ProfileSummaryCard onEdit={(sec) => setEditing(sec)} />
              <p className="mt-1.5 text-[10.5px] text-faint">From your profile — an edit here is saved to it, so you never re-type this on the next application.</p>
            </ApplyGroup>
          </div>

          {/* footer */}
          <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
            <Btn onClick={() => go('js-job-detail')}>Cancel</Btn>
            <Btn primary onClick={() => go('js-applications')}>Submit application</Btn>
          </div>
        </div>
      </div>

      {/* Edit popup — the ONLY place the apply flow shows inputs. Saving writes
          back to the profile, so a correction made once while applying is not
          re-typed on the next application. */}
      {editing && <ProfileEditPopup section={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function MyPageScreen() {
  return (
    <div>
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-mypage" />
        {/* Dashboard content is parked — to be designed. */}
        <div className="space-y-4" />
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
/* ── CV completeness weights — they must total exactly 100%.
   Weighted by what a recruiter actually filters and reads: work history is the
   single biggest signal, skills are the #1 search facet, then education, then
   the summary. The eight optional sections share the remaining 25%. ── */
export const CORE_CV_SECTIONS: { title: string; pct: string }[] = [
  { title: 'Work experience', pct: '30%' },
  { title: 'Skills', pct: '20%' },
  { title: 'Education', pct: '15%' },
  { title: 'About', pct: '10%' },
] // = 75%

export const OPTIONAL_CV_SECTIONS: { title: string; pct: string; desc: string; icon: string }[] = [
  { title: 'Foreign Language', pct: '7%', desc: 'Provide your language skills and proficiencies', icon: '' },
  { title: 'Highlight projects', pct: '6%', desc: 'Showcase your work — projects, case studies, published pieces', icon: '' },
  { title: 'Certificates', pct: '4%', desc: 'Provide evidence of your specific expertise and skills', icon: '' },
  { title: 'Awards', pct: '4%', desc: 'Highlight your awards or recognitions', icon: '' },
  { title: 'Activities', pct: '3%', desc: 'Volunteering, clubs & communities you take part in', icon: '' },
  { title: 'References', pct: '1%', desc: 'People who can vouch for your work', icon: '' },
] // = 25%  →  75 + 25 = 100%
// NOTE: no "Publications" section — it is not a search facet and near-nobody fills
// it on a general VN job board (Saramin KR and VietnamWorks have none either).
// Papers and articles belong under Highlight projects.

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
  /* What an EMPTY field says. Distinct from `value`, and worth the extra key:
     "Search language" tells you the control is a lookup, where the generic
     "Not filled in yet" tells you only that you have not used it. */
  placeholder?: string
}
/* `max` caps a repeatable section. Shown in the heading as "(2/5)" rather than
   enforced silently, so the limit is visible before it is hit. */
type EditSpec = { intro?: string; repeatable?: boolean; note?: string; max?: number; fields: EditField[] }

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
    fields: [
      { label: 'Company', req: true, value: 'Lantern Digital' },
      { label: 'Job title', req: true, value: 'Senior Product Designer', hint: 'Resolves to the canonical Title taxonomy so employer filters can match it.' },
      { label: 'From', kind: 'month', req: true, value: '2022-03', half: true },
      { label: 'To', kind: 'month', value: '', hint: 'Leave empty if this is your current role.', half: true },
      { label: 'I currently work here', kind: 'toggle', value: 'on' },
      /* Seeded with all four marks rather than two bare bullets — this is the
         field the vocabulary exists for, and a default that only ever shows
         bullets teaches that bullets are all there is. Matches the sample on the
         Saramin CV template screen so the two never disagree. */
      { label: 'What you did', kind: 'area', hint: 'Hai nút: H = tiêu đề nhỏ (nhóm các gạch đầu dòng trong một vị trí) · • = gạch đầu dòng. Không bấm gì thì là đoạn văn. Không có in đậm, in nghiêng, gạch chân hay đánh số — bản CV tạo ra không hiển thị chúng.', value: 'Led product design for web & mobile, and owned the shared design system across 4 teams.\n## Design System\n• Built and maintained the shared design system, cutting new-screen build time by 40%.\n• Wrote the usage guide and ran 6 training sessions for design and front-end.\n## Checkout redesign\n• Interviewed 18 customers and found 3 blockers in the payment flow.\n• Redesigned checkout, lifting order completion 12% in two months.' },
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
      { label: 'Score', value: '3.4 / 4.0', half: true },
      /* Was a single-line text input, which is why nobody filled it in: a degree's
         achievements are a LIST (scholarships, thesis, competitions), and one
         line asks for a run-on sentence. Same composer as every other free-text
         CV field — one vocabulary across the whole builder. */
      { label: 'Achievement', kind: 'area', value: '• Học bổng khuyến khích học tập 3 kỳ liên tiếp\n• Khoá luận đạt loại Giỏi — đề tài về hành vi người dùng thương mại điện tử' },
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
      /* Currency sits ON the amount, not in a separate row — VND default, USD for
         the IT / FDI segment. Nothing in the platform converts between the two. */
      { label: 'Desired salary / month', kind: 'select', value: '35,000,000 VND', options: ['35,000,000 VND', '3,000 USD'], half: true, hint: 'Optional · VND or USD. Never shown to employers as an exact figure without your consent.' },
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
  /* TWO FIELDS, and that is the whole section (client design, 2026-08-22).
     Certificate and Score were dropped from here — NOT lost: a language
     certificate is a certificate, and the Certificates section already holds
     name · issuer · date · credential, which carries an IELTS 7.5 better than a
     free-text score box ever did (the scales differ — 7.5, 850, N3, 4급 — so one
     box was either unvalidatable or wrong). Keeping both places to record IELTS
     meant two answers to one question and eventually two different ones. */
  'Foreign Language': {
    repeatable: true,
    max: 5,
    fields: [
      { label: 'Language', kind: 'select', req: true, value: '', placeholder: 'Search language', options: ['English', 'Korean', 'Japanese', 'Chinese', 'French', 'German', 'Vietnamese'], half: true },
      /* FOUR levels, no "Native". A native speaker picks Fluent — a fifth value
         that only differs by birthplace is not something an employer can act on
         differently, and it invites a judgement call on every bilingual CV. */
      { label: 'Level', kind: 'select', req: true, value: '', placeholder: 'Select level', options: ['Basic', 'Intermediate', 'Advanced', 'Fluent'], half: true },
    ],
  },
  'Highlight projects': {
    repeatable: true,
    fields: [
      { label: 'Project name', req: true, value: '' },
      { label: 'From', kind: 'month', value: '', half: true },
      { label: 'To', kind: 'month', value: '', half: true },
      { label: 'What you did and what changed', kind: 'area', value: '', hint: 'An outcome beats a description.' },
      { label: 'Link (demo / repo / case study / publication)', value: '' },
    ],
  },
  Certificates: {
    repeatable: true,
    fields: [
      { label: 'Certificate name', req: true, value: '' },
      { label: 'Issuing organisation', value: '', half: true },
      { label: 'Issue date', kind: 'month', value: '', half: true },
      { label: 'Credential ID or URL', value: '', half: true },
      /* The certificate NAME is the searchable part; this line is what a
         recruiter reads once the CV is open. Kept optional because a well-known
         certificate explains itself — "AWS Solutions Architect" needs no gloss —
         while a niche or in-house one is unreadable without it. The hint pushes
         towards the second case rather than inviting everyone to write a
         paragraph. */
      { label: 'Description', kind: 'area', value: '', hint: 'Only worth writing for a certificate a recruiter may not know — what it covers, or what you had to pass.' },
    ],
  },
  Awards: {
    repeatable: true,
    fields: [
      { label: 'Award name', req: true, value: '' },
      { label: 'Awarded by', value: '', half: true },
      { label: 'Issue date', kind: 'month', value: '', half: true },
      { label: 'What it was for', kind: 'area', value: '' },
    ],
  },
  Activities: {
    repeatable: true,
    fields: [
      { label: 'Tên chương trình', req: true, value: '' },
      { label: 'Organisation / club', value: '' },
      { label: 'Your role', value: '', half: true },
      { label: 'Still involved', kind: 'toggle', value: '', half: true },
      { label: 'From', kind: 'month', value: '', half: true },
      { label: 'To', kind: 'month', value: '', half: true },
      { label: 'What you did', kind: 'area', value: '' },
    ],
  },
  References: {
    repeatable: true,
    fields: [
      { label: 'Full name', req: true, value: '' },
      { label: 'Job title', req: true, value: '', half: true },
      { label: 'Company', req: true, value: '', half: true },
      { label: 'Phone', value: '', half: true },
      { label: 'Email', value: '', half: true },
    ],
  },
}

/** One field row in the edit sheet. Values are static — this is a wireframe —
 *  with ONE exception: a free-text CV field is LIVE, because the whole question
 *  it answers ("how do I actually add a sub-heading or a bullet?") cannot be
 *  answered by a picture of a textarea. Type in it and the preview under it
 *  re-renders through the same CvRichText the generated CV uses. */
function EditRow({ f }: { f: EditField }) {
  const box = 'w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11.5px]'
  const [rich, setRich] = useState(f.value ?? '')
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
        /* The four marks, the three buttons, and what they produce — all in the
           place a candidate actually writes. Anything richer than this is not
           offered, because the generated CV has no way to render it. */
        <CvComposer value={rich} onChange={setRich} />
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
          <span className="rounded-md border border-brand/50 px-2.5 py-1 text-[11px] font-medium text-brand">Choose file</span>
          <span className="text-[11px] text-faint">No file chosen</span>
        </div>
      ) : (
        <div className={cn(box, 'flex items-center justify-between gap-2', f.value ? 'text-ink/80' : 'text-faint')}>
          <span className="truncate">{f.value || f.placeholder || (f.kind === 'month' ? 'mm / yyyy' : 'Not filled in yet')}</span>
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
                <span></span>
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
                    <span className="rounded-md border border-brand/50 px-2.5 py-1 text-[11.5px] font-medium text-brand">Choose file</span>
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
              <Btn primary onClick={() => { setStep('working'); setTimeout(() => setStep('done'), 1600) }}>Fill profile</Btn>
            </div>
          </>
        )}
        {step === 'working' && (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-brand-soft text-[26px]"></div>
            <div className="mx-auto mb-4 h-1.5 w-44 overflow-hidden rounded-full bg-line">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
            </div>
            <p className="text-[15px] font-bold text-ink">We're reading your CV…</p>
            <p className="mt-1 text-[12px] text-muted">Extracting your experience, skills and details.<br />Please don't close this window.</p>
          </div>
        )}
        {step === 'done' && (
          <div className="px-5 py-6 text-center">
            <div className="mb-1 text-[30px]"></div>
            <p className="text-[15px] font-bold text-ink">Profile filled from your CV!</p>
            <p className="mx-auto mt-1 max-w-xs text-[12px] text-muted">Please review the imported info and edit anything that needs a touch-up.</p>
            <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Updated sections</p>
            <div className="mt-2 space-y-1.5 text-left">
              {([['', 'Personal information'], ['', 'Work experience'], ['', 'Education'], ['', 'Skills']] as [string, string][]).map(([ic, label]) => (
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
              <ProfilePhoto photo size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[19px] font-bold leading-tight text-ink">Trần Minh Anh</p>
                <p className="mt-0.5 text-[13px] text-ink/80">Product Designer · 4 yrs experience</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Hồ Chí Minh, Vietnam</p>
              </div>
              {!ro && (
                <button onClick={() => setEditing('Profile header')} className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-brand/40">✎ Edit</button>
              )}
            </div>
            {!ro && (
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-line-soft pt-3 text-[12px] text-ink/80">
                <span className="inline-flex items-center gap-1.5"><span className="text-muted"></span> minhanh@email.com</span>
                <span className="inline-flex items-center gap-1.5"><span className="text-muted"></span> 0901 234 567</span>
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
                    ['Expected salary', <span className="flex flex-wrap items-center justify-end gap-2">20 – 30 tr <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] font-normal text-muted">Shown</span></span>],
                    ['Availability', <>Open now</>],
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
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[14px]"></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">CV_TranMinhAnh.pdf</p>
                    <p className="text-[11px] text-faint">Uploaded 26/07/2026 · 1.2 MB</p>
                  </div>
                  <Chip tone="green">Approved</Chip>
                  <span onClick={() => setEditing('CV file')} className="cursor-pointer text-[11px] font-medium text-brand">Replace</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-dashed border-brand/50 bg-brand-soft/60 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-semibold text-brand">Turn this file into my Saramin CV</p>
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
              <p className="text-[11px] font-semibold text-ink">Top skills</p>
              <p className="mt-0.5 text-[11.5px] text-muted">User Experience (UX) · Interaction Design · Design Systems · Product Design</p>
            </div>
          </CvSection>

          {/* ── Experience ── */}
          <CvSection title="Experience" action={ro ? '' : '+ Add'} onAction={() => setEditing('Experience')}>
            {([
              ['Senior Product Designer', 'Lantern Digital · Full-time', '2022 – Present · 2 yrs', 'Hồ Chí Minh City, Vietnam', 'Lead designer on the core web product — run research, ship the design system, and mentor two junior designers.'],
              ['Product Designer', 'Zenpay · Full-time', '2020 – 2022 · 2 yrs', 'Hồ Chí Minh City, Vietnam', 'Designed the payments experience across mobile and web, from research through to handoff.'],
            ] as [string, string, string, string, string][]).map(([role, org, dates, loc, desc]) => (
              <div key={role} className="flex gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]"></div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">{role}</p>
                  <p className="text-[11.5px] text-ink/80">{org}</p>
                  <p className="text-[11px] text-faint">{dates} · {loc}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{desc}</p>
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
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]"></div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-ink">{school}</p>
                  <p className="text-[11.5px] text-ink/80">{deg}</p>
                  <p className="text-[11px] text-faint">{dates}</p>
                </div>
              </div>
            ))}
          </CvSection>

          {/* ── Skills — flat tags, NO years. CvSkill is a pure link row in
                 Phase-1 (see Resume management → SKILLS); per-skill years is
                 explicitly Phase-2. ── */}
          <CvSection title="Skills" action={ro ? '' : 'Edit'} badge={ro ? undefined : '20%'} onAction={() => setEditing('Skills')}>
            <div className="flex flex-wrap gap-1.5">
              {['User Experience (UX)', 'Interaction Design', 'Design Systems', 'Product Design', 'User Research'].map((s) => (
                <span key={s} className="rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand">{s}</span>
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
  /* Every ＋ Add / ✎ opens the SAME EditSheet the profile uses, keyed by section —
     one field catalogue (SECTION_EDITORS), so the builder and My Profile can never
     disagree about what a section contains. */
  const [editing, setEditing] = useState<string | null>(null)
  const OPTIONAL = OPTIONAL_CV_SECTIONS.map((s) => s.title)
  const SectionHead = ({ title, essential, actions, editKey }: { title: string; essential?: boolean; actions?: string[]; editKey?: string }) => (
    <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink/80 pb-2">
      <p className="text-[14px] font-bold text-ink">{title}</p>
      {essential && <span className="text-[10.5px] font-semibold text-rose-500">essential</span>}
      <span className="ml-auto flex gap-3">
        {actions?.map((a) => (
          <span key={a} onClick={() => setEditing(editKey ?? title)} className="cursor-pointer text-[11px] font-medium text-brand">＋ {a}</span>
        ))}
      </span>
    </div>
  )
  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="mx-auto grid max-w-[1020px] grid-cols-1 gap-4 p-5 md:grid-cols-[minmax(0,1fr)_280px]">
        {/* ── main column ── */}
        <div className="space-y-5">
          {/* pre-fill from PDF — the second entrance to this SAME form. Typing and
              fetching land in identical fields; the PDF is only a faster pen. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-soft/40 px-4 py-3">
            <p className="text-[12px] text-ink/80"><b className="font-semibold">Have a PDF?</b> Upload it and we pre-fill this form — you just review.</p>
            <Btn onClick={() => go('js-cv-compare')}>Upload &amp; pre-fill</Btn>
          </div>

          {/* Profile summary — the SAME component as My CVs. Read-only here:
              this is Profile data, not CV content, so the builder shows it rather
              than asking for it again. */}
          <ProfileSummaryCard onEdit={(sec) => setEditing(sec === 'basic' ? 'Profile header' : 'Job preferences')} />

          {/* About — FIRST: the CV opens with who this person is, then the history */}
          <div>
            <SectionHead title="About" actions={[]} />
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
              <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink/80">Product designer with 4+ years across web and mobile products at agency and in-house teams. I turn user research into clean, usable interfaces and maintain scalable design systems.</p>
              <span onClick={() => setEditing('About')} className="cursor-pointer text-[12px] text-muted">✎</span>
            </div>
          </div>

          {/* Work experience — PRE-FILLED with the CV content from My Profile */}
          <div>
            <SectionHead title="Work experience" actions={['Add']} editKey="Experience" />
            <div className="mt-3 space-y-2">
              {([
                ['Senior Product Designer', 'Lantern Digital · Full-time', '2022 – Present · 2 yrs', 'Lead designer on the core web product — run research, ship the design system, and mentor two junior designers.'],
                ['Product Designer', 'Zenpay · Full-time', '2020 – 2022 · 2 yrs', 'Designed the payments experience across mobile and web, from research through to handoff.'],
              ] as [string, string, string, string][]).map(([role, org, dates, desc]) => (
                <div key={role} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]"></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink">{role}</p>
                    <p className="text-[11.5px] text-ink/80">{org}</p>
                    <p className="text-[11px] text-faint">{dates}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{desc}</p>
                  </div>
                  <span onClick={() => setEditing('Experience')} className="cursor-pointer text-[12px] text-muted">✎</span>
                </div>
              ))}
            </div>
          </div>

          {/* Education — sits BELOW work experience: for an experienced candidate
              the history is the headline, the degree is the footnote. */}
          <div>
            <SectionHead title="Education" essential actions={['Add']} />
            <div className="mt-3 space-y-2">
              {([
                ['University of Economics HCMC', 'Bachelor · Business Information Systems', '2016 – 2020'],
                ['FPT Arena Multimedia', 'Diploma · Graphic & Digital Design', '2015 – 2016'],
              ] as [string, string, string][]).map(([school, deg, dates]) => (
                <div key={school} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-canvas text-[13px]"></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink">{school}</p>
                    <p className="text-[11.5px] text-ink/80">{deg}</p>
                    <p className="text-[11px] text-faint">{dates}</p>
                  </div>
                  <span onClick={() => setEditing('Education')} className="cursor-pointer text-[12px] text-muted">✎</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills — PRE-FILLED with years; the AI suggestions stay */}
          <div>
            <SectionHead title="Skills" actions={['Add']} />
            <CvSkillsField />
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
                        {/* The cap is stated ON the control that spends it, not
                            discovered by a disabled button on the 6th click. */}
                        {spec.max && <span className="font-normal text-faint"> · tối đa {spec.max}</span>}
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
            {/* the weights are not arbitrary — say what they mean, in the UI */}
            <p className="mt-2 text-[10.5px] leading-relaxed text-faint">
              Each section is worth what it adds to being <b className="font-medium text-ink/70">found and shortlisted</b> — the % is how much employer search and job matching read it.
            </p>

            {/* the item list — ONE pattern for every section: a green check when it
                has content. No "required" chip: the CV sections read the same way,
                and completeness already says what is missing. */}
            <div className="mt-3 space-y-0.5 border-t border-line-soft pt-3">
              {CORE_CV_SECTIONS.map(({ title, pct }) => (
                <div key={title} className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-[12px] text-ink/80">{title} <span className="text-[10px] text-faint">{pct}</span></span>
                  <span className="text-[11px] text-emerald-500">✓</span>
                </div>
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
        <Btn>CV Preview</Btn>
        <Btn primary onClick={() => go('js-my-cvs')}>Completed</Btn>
      </div>

      {/* every ＋ Add / ✎ in this builder opens the shared section editor */}
      {editing && <EditSheet title={editing} onClose={() => setEditing(null)} />}
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
          <Btn primary>Activate customer</Btn>
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
                Công ty TNHH Vạn Phát <span className="ml-auto text-[10.5px] text-violet-600">from CRM #VP-1042</span>
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
            <div className="rounded-md bg-brand-soft px-3 py-2.5 text-[11.5px] text-brand">The account links back to the CRM customer, so sales history and account stay in sync — one source of truth.</div>
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
              <span className="text-[20px]"></span>
              <span className="grid h-5 w-5 place-items-center rounded-md bg-brand text-[11px] text-white">✓</span>
            </div>
            <p className="mt-2 text-[14px] font-bold">Job Posting</p>
            <p className="text-[11.5px] text-muted">Post jobs shown to jobseekers. Profile is public.</p>
            <p className="mt-2 text-[11px] font-bold text-amber-600">→ Requires a Company Detail Page</p>
          </div>
          <div className="rounded-xl border-2 border-line p-4">
            <div className="flex items-center justify-between">
              <span className="text-[20px]"></span>
              <span className="grid h-5 w-5 place-items-center rounded-md border border-line text-[11px] text-transparent">✓</span>
            </div>
            <p className="mt-2 text-[14px] font-bold">Resume Search</p>
            <p className="text-[11.5px] text-muted">Search &amp; contact candidates. Nothing shown to jobseekers.</p>
            <p className="mt-2 text-[11px] font-bold text-emerald-600">→ No company page needed</p>
          </div>
        </div>
        <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11.5px] text-amber-800">
         Job Posting is selected → the next step is <b>required</b>: create the public Company Detail Page. (Resume Search only → activation is done, no page.)
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
        <div className="mt-3 rounded-md bg-brand-soft px-3 py-2 text-[11.5px] text-brand">Same record throughout: CRM #VP-1042 → account → public page. One source of truth.</div>
      </div>
    </div>
  )
}

/* ── CV skills — ONE flat list of taxonomy-backed tags, nothing else ─────────
   No years, no featured/star, no per-role attachment. A CvSkill is a pure link
   row: this CV has this skill.

   What that costs and what covers it:
   · ranking loses per-skill depth — but total years of experience still lives on
     the Profile (Basic information), so seniority is known, just not per skill;
   · "which skills to show" is no longer the candidate's job to curate — a search
     result shows the ones that overlap the job being matched, which is more
     useful than a static top-5 and needs no UI at all. */
/* Skill catalogue the picker searches — stands in for the canonical Skill
   taxonomy. Each row is (canonical name + the group it sits in), mirroring
   /docs/skill-taxonomy-seed.csv. */
const SKILL_CATALOGUE: { name: string; group: string }[] = [
  { name: 'Figma', group: 'Design' },
  { name: 'Wireframing', group: 'Design' },
  { name: 'Prototyping', group: 'Design' },
  { name: 'Adobe Photoshop', group: 'Design' },
  { name: 'Adobe Illustrator', group: 'Design' },
  { name: 'Thiết kế đồ hoạ', group: 'Design' },
  { name: 'Design System', group: 'Design' },
  { name: 'Nghiên cứu người dùng', group: 'Design' },
  { name: 'HTML/CSS', group: 'IT — Software' },
  { name: 'Content Marketing', group: 'Marketing' },
  { name: 'Microsoft Excel', group: 'Office & General' },
  { name: 'Làm việc nhóm', group: 'Office & General' },
]

/* Suggestions come from the skill↔role association: "of everyone with role
   Product Designer, which skills do they most often list?" — so the row names
   the role it is reasoning from. Phase-1 that table is hand-seeded; once there
   are real CVs it is recomputed from co-occurrence and needs no curation. */
/* TWO SOURCES, IN ORDER. What someone HAS DONE is stronger evidence than what
   they WANT to do next, so the CV's own work experience is read first: each job
   title resolves to an occupation, most recent role first, and its occupation_skill
   rows come back ESSENTIAL before OPTIONAL. The desired job role fills whatever is
   left of the cap — it is the only source a fresher has, and the only source an
   unconverted PDF has, since it holds no structured experience rows at all.
   Each chip carries WHERE it came from: "you were a Product Designer" is a far
   better reason to tap than "people like you list this". */
const SKILL_SUGGESTIONS: { from: string; source: 'experience' | 'desired'; skills: string[] }[] = [
  { from: 'Product Designer · Lantern Digital', source: 'experience', skills: ['Figma', 'Wireframing'] },
  { from: 'Senior Product Designer', source: 'desired', skills: ['Prototyping'] },
]

/* NO HARD CAP ANY MORE (decided 2026-09-02). A cap of 20 was built here for one
   day and removed: an uploaded PDF can legitimately carry more, extraction cannot
   be told to stop finding them, and blocking the confirm screen at 20 put OUR
   arbitrary limit in the middle of someone else's document.
   What replaced it is a SOFT rule that never blocks input — past SOFT_LIMIT the
   skills score is multiplied by SOFT_LIMIT ÷ total, so a padded CV gains nothing
   while an honest one (10-15 skills, per the requirement) never notices the rule
   exists. The candidate is told plainly rather than stopped.
   MIN 3 is the opposite kind of rule and the only one that BLOCKS: it is part of
   the qualification rule, so under 3 the CV cannot be applied with and cannot
   enter CV search. Hence the loud note for the floor, a quiet one for the soft
   limit, and no ceiling at all. */
const CV_SKILL_SOFT = 25
const CV_SKILL_MIN = 3

function CvSkillsField() {
  const [skills, setSkills] = useState<string[]>([
    'User Experience (UX)', 'Interaction Design', 'Design Systems', 'Product Design', 'User Research',
  ])
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)

  /* The tier-1 analyser, and nothing more: lower-case, ASCII-fold, strip
     punctuation and spaces. This is what makes "thiet ke" find Thiết kế and
     "htmlcss" find HTML/CSS with NO curated alias behind it — the whole reason
     Phase-1 can ship with an empty skill_alias table. */
  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '')
  const matches = SKILL_CATALOGUE.filter((c) => !skills.includes(c.name) && (!q.trim() || norm(c.name).includes(norm(q))))
  const over = skills.length >= CV_SKILL_SOFT
  const add = (n: string) => { setSkills((a) => [...a, n]); setQ(''); setHi(0) }
  /* Merged in source order, deduped, already-added removed, capped at 6 — so a
     candidate with a long history never sees a wall of chips. */
  const suggested = SKILL_SUGGESTIONS
    .flatMap((g) => g.skills.map((s) => ({ skill: s, from: g.from, source: g.source })))
    .filter((s, i, a) => a.findIndex((x) => x.skill === s.skill) === i)
    .filter((s) => !skills.includes(s.skill))
    .slice(0, 6)

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((i) => Math.min(i + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && open && matches[hi]) { e.preventDefault(); add(matches[hi].name) }
    else if (e.key === 'Backspace' && !q && skills.length) setSkills((a) => a.slice(0, -1))
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="mt-3">
      {/* THE COUNTER, in the same place and the same tones the job form uses for
          its 10 — one pattern for both sides of the same taxonomy. It only turns
          amber AT the cap: a count that shouts from 15 trains people to ignore it. */}
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-ink/70">Kỹ năng</span>
        {/* A COUNT, NOT A QUOTA. “5/20” reads as a limit to fill; a bare count
            reads as information. Nothing here turns red, because nothing here is
            wrong. */}
        <span className={cn('text-[10.5px] tabular-nums', over ? 'font-medium text-amber-600' : 'text-faint')}>
          {skills.length} kỹ năng
        </span>
      </div>
      {/* ONE combobox: the chips and the input live in the same box, so adding a
          skill is typing — no button, no mode switch. Backspace on an empty input
          removes the last chip, the way every tag field people already use works. */}
      <div className="relative">
        <div
          onClick={() => setOpen(true)}
          className={cn(
            'flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border bg-surface px-2 py-1.5 transition-colors',
            open ? 'border-brand' : 'border-line',
          )}
        >
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11.5px] font-medium text-brand">
              {s}
              <span onClick={(e) => { e.stopPropagation(); setSkills((a) => a.filter((x) => x !== s)) }} className="cursor-pointer opacity-60 hover:opacity-100">×</span>
            </span>
          ))}
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={skills.length ? 'Add another…' : 'Type a skill — e.g. figma, thiet ke, excel'}
            className="min-w-[150px] flex-1 bg-transparent px-1 py-0.5 text-[12px] outline-none"
          />
        </div>

        {open && (
          <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <div className="max-h-[184px] overflow-y-auto">
              {matches.map((c, i) => (
                <button
                  key={c.name}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => add(c.name)}
                  className={cn('flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px]', i === hi ? 'bg-brand-soft text-brand' : 'text-ink/80')}
                >
                  <span>{c.name}</span>
                  <span className="shrink-0 text-[10px] text-faint">{c.group}</span>
                </button>
              ))}
              {matches.length === 0 && (
                <p className="px-3 py-3 text-[11.5px] text-faint">
                  Nothing matches “{q}”. Skills come from a fixed list —
                  <span className="ml-1 cursor-pointer font-medium text-brand">request “{q}”</span>
                </p>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line-soft bg-canvas/60 px-3 py-1.5 text-[10px] text-faint">
              <span>↑↓ to move · ↵ to add · ⌫ to remove</span>
              <span onClick={() => setOpen(false)} className="cursor-pointer font-medium text-brand">Done</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions, grouped by where they came from — experience before desired
          role. The group label is the reason to tap, so it names the actual job the
          skills were inferred from rather than saying "common for people like you". */}
      {/* THE FLOOR IS THE RULE THAT BITES. 20 is a guardrail nobody normal reaches;
          3 is the qualification rule, and under it this CV cannot be applied with
          and cannot enter CV search. So the shortfall gets the loud treatment and
          the ceiling gets a quiet number. */}
      {skills.length < CV_SKILL_MIN && (
        <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-800">
          Cần tối thiểu {CV_SKILL_MIN} kỹ năng — thêm {CV_SKILL_MIN - skills.length} nữa thì CV mới ứng tuyển được và mới hiển thị trong tìm kiếm CV.
        </p>
      )}
      {over && (
        <p className="mt-1.5 text-[10.5px] leading-snug text-muted">
          Hồ sơ tập trung được chấm cao hơn — từ kỹ năng thứ {CV_SKILL_SOFT + 1} trở đi, điểm phù hợp của bạn bắt đầu giảm. Bạn vẫn thêm được thoải mái.
        </p>
      )}
      {suggested.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {[...new Set(suggested.map((s) => s.from))].map((from) => {
            const group = suggested.filter((s) => s.from === from)
            return (
              <div key={from} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] text-faint">
                  {group[0].source === 'experience' ? 'From your time as' : 'For your desired role'} <b className="font-medium text-ink/70">{from}</b>:
                </span>
                {group.map((s) => (
                  <span key={s.skill} onClick={() => add(s.skill)} className="cursor-pointer rounded-full border border-dashed border-brand/50 px-2 py-0.5 text-[10.5px] text-brand hover:bg-brand-soft">＋ {s.skill}</span>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Profile summary — Basic information + Desired work condition ───────────────────
   ONE component, rendered on BOTH My CVs and the Create-CV builder. The two
   screens must never disagree about what the profile holds, so the field lists
   live here and nowhere else — edit this and both surfaces change.

   Basic information = the 9 fields the edit popup writes. Desired work condition = the
   five recruiter-facing facts, as tiles. Both are PROFILE data (1 per jobseeker),
   never CV content — which is why the builder shows them read-only above the CV
   sections rather than asking for them again. */
/* Basic information — the profile's identity block. The demographic four (date of
   birth, nationality, gender, marital status) are REINSTATED per client direction
   (2026-08-09), reversing the 2026-08-05 cut. Note none of them is read by search
   or matching, and marital status still carries a discrimination risk — see the
   open question on Application management. CURRENT location is not held here:
   what matters for matching is DESIRED location, which lives in Desired work condition. */
/* Profile photo — optional everywhere, shown as initials when absent so a
   candidate who never uploads one still reads as a person in a board column.
   Optional by design, and never a screening criterion. */
function ProfilePhoto({ photo, size = 'sm' }: { photo?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const z = {
    sm: { box: 'h-10 w-10 text-[12.5px]', img: 'text-[22px]' },
    md: { box: 'h-14 w-14 text-[17px]', img: 'text-[30px]' },
    lg: { box: 'h-20 w-20 text-[24px]', img: 'text-[42px]' },
  }[size]
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft font-bold text-brand', z.box)}>
      {photo ? <span className={z.img}>‍</span> : 'TA'}
    </span>
  )
}

type PField = { label: string; value: string; kind: 'text' | 'email' | 'phone' | 'date' | 'select' | 'number' | 'salary' }

/* Basic information — the 9 fields, in the order the client's field sheet lists
   them, with WHERE each is collected. The demographic four are reinstated per
   client direction (2026-08-09); none is read by search or matching. CURRENT
   location is not held here — matching reads DESIRED location, in Desired work
   condition. */
const PROFILE_BASIC: PField[] = [
  { label: 'Full name', value: 'Trần Minh Anh', kind: 'text' },
  { label: 'Email', value: 'minhanh@email.com', kind: 'email' },
  { label: 'Phone', value: '0901 234 567', kind: 'phone' },
  { label: 'Nationality', value: 'Việt Nam', kind: 'select' },
  { label: 'Gender', value: 'Nữ', kind: 'select' },
  { label: 'Marital status', value: 'Độc thân', kind: 'select' },
  { label: 'Date of birth', value: '12/04/1996', kind: 'date' },
  { label: 'Highest education', value: 'Cử nhân', kind: 'select' },
  { label: 'Years of work experience', value: '4', kind: 'number' },
]

/* Desired work condition — all SIX collected at onboarding or added later.
   `kind` decides which control the quick-edit popup renders; without it every
   field became a dropdown, and Expected salary is a number, not a list. */
const PROFILE_PREFS: { icon: string; label: string; value: string; kind: PField['kind'] }[] = [
  { icon: '', label: 'Desired job role', value: 'Senior Product Designer', kind: 'select' },
  { icon: '', label: 'Desired job category', value: 'Design', kind: 'select' },
  { icon: '', label: 'Desired industry', value: 'IT / Software · FMCG', kind: 'select' },
  { icon: '', label: 'Desired work location', value: 'Hồ Chí Minh · Hà Nội', kind: 'select' },
  { icon: '', label: 'Desired work type', value: 'In office · Hybrid', kind: 'select' },
  /* ONE figure, not a range — the candidate says what they expect, the employer
     searches by a band and tests this figure against it. See Resume management. */
  { icon: '', label: 'Expected salary', value: '20 triệu / tháng', kind: 'salary' },
]

function ProfileSummaryCard({ onEdit }: { onEdit?: (section: 'basic' | 'prefs') => void }) {
  /* Each group carries its OWN edit button: Basic information and Desired work condition
     are written by different forms, so one shared pencil at the top would open the
     wrong one half the time. */
  const EditBtn = ({ section }: { section: 'basic' | 'prefs' }) =>
    onEdit ? (
      <span
        onClick={() => onEdit(section)}
        className="shrink-0 cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-brand/40 hover:text-brand"
      >
        ✎ Edit
      </span>
    ) : null

  return (
    <div className="rounded-xl border border-line bg-surface">
      {/* — BASIC INFORMATION — */}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <ProfilePhoto photo />
          <p className="text-[15px] font-bold text-ink">Trần Minh Anh</p>
        </div>
        <div className="mt-2 mb-1.5 flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">Basic information</p>
          <EditBtn section="basic" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11.5px] text-ink/80">
          {PROFILE_BASIC.filter((f) => f.label !== 'Full name').map((f) => (
            <p key={f.label}><span className="text-faint">{f.label}</span> <b className="font-medium text-ink">{f.value}</b></p>
          ))}
        </div>
      </div>

      {/* — WORK PREFERENCE — */}
      <div className="border-t border-line-soft px-4 pb-4 pt-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">Desired work condition</p>
          <EditBtn section="prefs" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PROFILE_PREFS.map((f) => (
            <div key={f.label} className="rounded-lg border border-line p-2.5">
              <p className="flex items-center gap-1 text-[10.5px] text-faint">{f.icon} {f.label}</p>
              <p className="mt-1 text-[11.5px] font-semibold leading-snug text-ink">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Profile quick-edit ──────────────────────────────────────────────────────
   ONE popup, opened from the ProfileSummaryCard's per-group Edit on BOTH My CVs
   and the apply modal. Its field list is derived from the same PROFILE_BASIC /
   PROFILE_PREFS the card renders, so what is shown and what is edited can never
   drift apart. */
function ProfileEditPopup({ section, onClose }: { section: 'basic' | 'prefs'; onClose: () => void }) {
  /* Whether a photo is set. Starts set, matching the rest of the profile; Remove
     flips it so the initials fallback is reachable rather than only described. */
  const [photo, setPhoto] = useState(true)
  const fields: PField[] =
    section === 'basic'
      ? PROFILE_BASIC
      : PROFILE_PREFS.map((f) => ({ label: f.label, value: f.value, kind: f.kind }))
  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/30 px-4 pt-8">
      <div className="flex max-h-[560px] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-[14px] font-bold text-ink">{section === 'basic' ? 'Edit basic information' : 'Edit desired work condition'}</p>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin p-4">
          {/* Photo first — it is the one field here that is OPTIONAL, so it carries no
              asterisk and says what it is for. Employers see it on the applicant card. */}
          {section === 'basic' && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3">
              <ProfilePhoto photo={photo} size="md" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-ink/80">Profile photo <span className="text-faint">· optional</span></p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    onClick={() => setPhoto(true)}
                    className="cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:border-brand/40 hover:text-brand"
                  >
                    {photo ? 'Change photo' : 'Upload photo'}
                  </span>
                  {photo && (
                    <span onClick={() => setPhoto(false)} className="cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted hover:text-rose-600">
                      Remove
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
                  JPG / PNG · max 2MB · cropped square here before upload. Recruiters see it on your application card; without one they see your initials.
                </p>
              </div>
            </div>
          )}
          {/* Real controls per field — a text box, a date box and a select do not
              look alike, and a candidate should be able to tell what a field wants
              before clicking it. Everything here rendered as a dropdown before. */}
          <div className="grid grid-cols-2 gap-2.5">
            {fields.map((f, i) => (
              <div key={f.label} className={cn((i === 0 || f.kind === 'salary') && 'col-span-2')}>
                <p className="mb-1 text-[11px] font-medium text-ink/80">{f.label}<span className="text-rose-500"> *</span></p>
                {f.kind === 'phone' ? (
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[11.5px] text-ink/80">+84 <span className="text-faint">▾</span></span>
                    <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-line bg-surface px-2.5 text-[11.5px] text-ink/80">{f.value}</div>
                  </div>
                ) : f.kind === 'salary' ? (
                  /* ONE number + a currency, never a from–to pair: the candidate
                     states what they expect and the employer searches by a band.
                     "Thỏa thuận" is a real answer here, not an empty field —
                     without it people who are open to negotiation leave the most
                     filtered-on question on the profile blank. */
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-line bg-surface px-2.5 text-[11.5px] text-ink/80">20</div>
                      <span className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[11.5px] text-ink/80">triệu / tháng <span className="text-faint">▾</span></span>
                      <span className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[11.5px] text-ink/80">VND <span className="text-faint">▾</span></span>
                    </div>
                    <label className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                      <span className="h-3 w-3 shrink-0 rounded-[3px] border border-line" />
                      Thỏa thuận — I’d rather discuss it
                    </label>
                  </div>
                ) : (
                  <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-line bg-surface px-2.5 text-[11.5px] text-ink/80">
                    <span className="min-w-0 truncate">{f.value}</span>
                    {f.kind === 'select' && <span className="shrink-0 text-faint">▾</span>}
                    {f.kind === 'date' && <span className="shrink-0 text-[11px] text-faint"></span>}
                    {f.kind === 'number' && <span className="shrink-0 border-l border-line pl-2 text-[10px] text-faint">years</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn primary onClick={onClose}>Save</Btn>
        </div>
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
   misses — only the compare screen turns that on.

   `compact` renders the same page markedly smaller, for the compare screen where
   the PDF is only a reference to check answers against. It shrinks the real type
   and padding rather than CSS-transforming the box, so the layout height matches
   what is drawn and no dead space appears underneath. */
function UploadedCvDoc({ highlightDates, compact }: { highlightDates?: boolean; compact?: boolean }) {
  const z = compact
    ? { pad: 'p-3.5', min: 'min-h-0', name: 'text-[11px]', role: 'text-[8.5px]', meta: 'text-[7px]', head: 'text-[7px]', body: 'text-[7.5px]', item: 'text-[8px]', bullet: 'text-[7.5px]', gap: 'my-2', foot: 'text-[7px]' }
    : { pad: 'p-6', min: 'min-h-[430px]', name: 'text-[16px]', role: 'text-[11px]', meta: 'text-[9.5px]', head: 'text-[9px]', body: 'text-[10px]', item: 'text-[10.5px]', bullet: 'text-[9.5px]', gap: 'my-3', foot: 'text-[9.5px]' }
  return (
    <div className={cn('flex flex-col rounded-xl border border-line bg-white text-slate-800 shadow-sm', z.pad, z.min)}>
      <p className={cn('font-bold tracking-wide', z.name)}>TRẦN MINH ANH</p>
      <p className={cn('font-medium text-slate-500', z.role)}>Product Designer</p>
      <p className={cn('mt-0.5 text-slate-400', z.meta)}>Hồ Chí Minh · minhanh@email.com · 0901 234 567 · behance.net/minhanh</p>

      <div className={cn('h-px bg-slate-200', z.gap)} />
      <p className={cn('font-bold uppercase tracking-widest text-slate-400', z.head)}>Summary</p>
      <p className={cn('mt-1 leading-relaxed text-slate-600', z.body)}>
        Product designer with 4+ years across web and mobile products at agency and in-house teams. Focused on user research,
        clean interfaces and scalable design systems.
      </p>

      <div className={cn('h-px bg-slate-200', z.gap)} />
      <p className={cn('font-bold uppercase tracking-widest text-slate-400', z.head)}>Experience</p>
      <div className="mt-1">
        <p className={cn('font-semibold', z.item)}>Senior Product Designer — Lantern Digital</p>
        <p className={cn('text-slate-400', z.head)}>2022 – Present · Hồ Chí Minh</p>
        <ul className={cn('mt-0.5 list-disc pl-4 leading-relaxed text-slate-600', z.bullet)}>
          <li>Lead designer on the core web product — research, design system, mentoring two juniors</li>
          <li>Design system rollout across 4 product teams</li>
        </ul>
      </div>
      <div className="mt-2">
        <p className={cn('font-semibold', z.item)}>Product Designer — Zenpay</p>
        <p className={cn('text-slate-400', z.head)}>
          {highlightDates
            ? <span className="rounded-sm bg-amber-100 px-1 py-px font-medium text-amber-800">03/2020 – 12/2021</span>
            : <span>03/2020 – 12/2021</span>}
          {' '}· Hồ Chí Minh
        </p>
        <ul className={cn('mt-0.5 list-disc pl-4 leading-relaxed text-slate-600', z.bullet)}>
          <li>Designed the merchant dashboard and KYC onboarding flow</li>
          <li>Ran usability tests with 20+ merchants per quarter</li>
        </ul>
      </div>

      <div className={cn('h-px bg-slate-200', z.gap)} />
      <p className={cn('font-bold uppercase tracking-widest text-slate-400', z.head)}>Education</p>
      <p className={cn('mt-1 font-semibold', z.item)}>University of Economics HCMC</p>
      <p className={cn('text-slate-400', z.head)}>Bachelor · Business Information Systems · 2016 – 2020</p>

      <div className={cn('h-px bg-slate-200', z.gap)} />
      <p className={cn('font-bold uppercase tracking-widest text-slate-400', z.head)}>Skills</p>
      <p className={cn('mt-1 text-slate-600', z.bullet)}>Figma · UI Design · Sketch · Adobe CC · HTML/CSS basics</p>

      <p className={cn('mt-auto pt-4 text-slate-400', z.foot)}>CV_TranMinhAnh.pdf · 1.2 MB · exactly as recruiters would download it</p>
    </div>
  )
}

function AddCvScreen() {
  const go = useNav()
  const [step, setStep] = useState<'choose' | 'upload' | 'saved' | 'reading'>('choose')
  /* Save is the LAST moment we can make the offer — after this the candidate is
     gone to My CVs and the upload sits there unsearchable. The card below the
     file makes the offer calmly to anyone who reads it; this catches everyone who
     scrolled past it and went straight for the button. It is a genuine offer, not
     a trap: "just save" is a real, equal-weight way out. */
  const [ask, setAsk] = useState(false)
  const convert = () => { setAsk(false); setStep('reading'); setTimeout(() => go('js-cv-compare'), 1500) }
  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className={cn('mx-auto px-5 py-8', step === 'upload' || step === 'saved' ? 'max-w-[860px]' : 'max-w-[620px]')}>
        <button onClick={() => go('js-my-cvs')} className="mb-5 text-[11.5px] font-medium text-muted hover:text-brand">← Back to My CVs</button>

        {step === 'choose' && (
          <>
            <p className="text-[18px] font-bold text-ink">Add a new CV</p>
            <p className="mt-1 text-[12px] text-muted">Two different intents, two paths — upload the file you have, or create a Saramin CV.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <button onClick={() => setStep('upload')} className="rounded-xl border border-line p-5 text-left hover:border-brand/50">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-[19px]"></div>
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

        {/* Upload — just the picker. Choosing a file goes STRAIGHT to the result
            screen: a confirm-this-file step adds a click and tells the user
            nothing they don't already know. */}
        {step === 'upload' && (
          <>
            <p className="text-center text-[18px] font-bold text-ink">Upload a CV</p>
            <div className="mx-auto mt-4 max-w-[520px]">
              <div onClick={() => setStep('saved')} className="grid min-h-[300px] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line py-14 text-center hover:border-brand/50">
                <div>
                  <p className="text-[26px]"></p>
                  <p className="mt-1.5 text-[13px] font-medium text-brand">Choose a file or drop it here</p>
                  <p className="mt-0.5 text-[11.5px] text-faint">.pdf, .doc, .docx · max 3MB · no password</p>
                </div>
              </div>
              <div className="mt-5 flex justify-center">
                <Btn onClick={() => setStep('choose')}>Back</Btn>
              </div>
            </div>
          </>
        )}

        {/* Uploaded — the FILE leads, the decision follows. Two buttons, nothing
            else: keep it as-is, or convert it to the Saramin template. */}
        {/* Uploaded — the candidate came here to put their PDF on the platform, so
            SAVE is the primary action and the only one on the main line. Converting
            is a genuine offer, not a competing choice: it sits BELOW the save, in a
            quieter card, worded as "there is also this" rather than "pick one". */}
        {step === 'saved' && (
          <div className="mx-auto max-w-[520px]">
            <div className="text-center">
              <p className="text-[22px]"></p>
              <p className="mt-1 text-[18px] font-bold text-ink">productdesign.pdf uploaded</p>
              <p className="mt-1 text-[12px] text-muted">Saved exactly as you uploaded it. Recruiters download this file, unchanged.</p>
            </div>

            <div className="mt-4">
              <UploadedCvDoc />
            </div>

            <div className="mt-4 flex justify-center">
              <Btn primary onClick={() => setAsk(true)}>Save</Btn>
            </div>

            {/* the other option — offered, not competing */}
            <div className="mt-5 rounded-xl border border-line bg-canvas/40 p-4">
              <p className="text-[12.5px] font-semibold text-ink">One more thing you can do</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                We read your PDF for skills, so employers can already find you. A structured version goes further —
                recruiters can read it, and your experience and education become searchable too. Your PDF is never changed.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Btn onClick={convert}>Convert to Saramin template</Btn>
                <span className="text-[10.5px] text-faint">Takes about a minute · you can also do this later from My CVs</span>
              </div>
            </div>

          </div>
        )}

        {step === 'reading' && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-xl bg-brand-soft text-[26px]"></div>
            <div className="mx-auto mb-4 h-1.5 w-44 overflow-hidden rounded-full bg-line"><div className="h-full w-1/2 animate-pulse rounded-full bg-brand" /></div>
            <p className="text-[15px] font-bold text-ink">Reading your CV with AI…</p>
            <p className="mt-1 text-[12px] text-muted">Extracting title, experience, skills and education.</p>
          </div>
        )}
      </div>
            {/* Last-chance offer on Save. The reasons are the REAL mechanics of the
          product, not flattery: an uploaded PDF cannot be searched, so a
          candidate who only ever uploads is invisible to the recruiters
          already looking for them. Everything here is reversible and the PDF
          is untouched — which is why the ask is fair to make at all. */}
      {ask && (
        <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/30 px-4 pt-10">
          <div className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
            <div className="px-5 pt-5">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-[20px]"></div>
              <p className="text-[16px] font-bold leading-snug text-ink">
                Make this CV searchable by recruiters?
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                Your PDF is saved, and we’ve read the skills off it so employers can find you.
                A Saramin CV goes further — recruiters can <b className="text-ink/80">read</b> it, not just download it.
              </p>

              <div className="mt-3.5 space-y-2">
                {[
                  ['', <>Be found on more than skills — <b className="text-ink/80">experience, level and education</b> only become searchable once they’re structured.</>],
                  ['', <>AI fills it in from the PDF you just uploaded — about a minute, and you review before it saves.</>],
                  ['', <>Your original PDF stays <b className="text-ink/80">exactly as-is</b>. The Saramin CV sits beside it; you pick which one to apply with.</>],
                ].map(([icon, text], i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="mt-px shrink-0 text-[13px]">{icon}</span>
                    <p className="text-[11.5px] leading-relaxed text-ink/75">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-line-soft bg-canvas/40 px-5 py-3.5">
              <Btn primary onClick={convert}>Convert to Saramin CV</Btn>
              {/* Equal-weight exit: the candidate came to upload a file, and
                  they must be able to finish doing exactly that. */}
              <Btn onClick={() => go('js-my-cvs')}>No thanks, just save my PDF</Btn>
              <p className="text-center text-[10.5px] text-faint">You can convert any time from My CVs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MyCvsScreen() {
  const go = useNav()
  const [searchable, setSearchable] = useState(1)
  const [menu, setMenu] = useState<number | null>(null)
  const [editing, setEditing] = useState<null | 'basic' | 'prefs'>(null)
  /* An uploaded PDF is parsed in the background — the file is never converted, but
     the SKILLS it yields are what let employers find the candidate at all. So the
     extracted list is shown here to be corrected, not hidden in the database.
     Skills ONLY: a strip that asked about years, title and education too would be
     the compare screen again, which is the thing this route exists to avoid. */
  /* Which CV's skills are open for editing. An uploaded PDF has no skills section
     of its own to send the candidate to, so it edits here in a popup — the same
     shape as every other Edit on this page. */
  /* Uploaded CVs keep their FILE NAME — that is what the candidate recognises and
     what they will see again when they pick a CV to apply with. Generated ones get
     a readable title instead, since there is no file the user named. */
  /* Skills are per-CV (CvSkill: cvId · skillId), so two CVs genuinely differ here —
     which is the reason the row shows them at all: it is how a candidate compares
     their CVs and decides which one employers should find. */
  /* `missing` = the APPLY-ELIGIBLE gate (see Resume management): a Saramin CV
     needs ≥1 experience (or ≥1 education entry for a fresher) and ≥3 skills
     before it can be SENT with an application. The label shows HERE, on the
     shelf, so the candidate learns it before the apply modal greys the row.
     It does not touch the searchable flag — an incomplete CV can still be
     the one employers find. */
  /* `indexStatus` — CV SEARCH only. ONE rule qualifies a CV (≥1 experience or
     education entry + ≥3 skills), read off the fields an upload is parsed into
     at UPLOAD time. An uploaded CV that fails is NOT blocked from applying —
     that would punish the candidate for our parser — it simply waits outside
     the index until a reviewer clears it. Decided: no auto-pass, so the
     candidate must be able to SEE the wait rather than assume they are already
     findable. A Saramin CV below the same rule is the stricter case: it cannot
     apply either, because we generate that document ourselves (`missing`). */
  /* ONE state per CV, FOUR values — Qualified · Can’t read · Not enough
     information · Rejected — the same set the admin sees, in the words the
     candidate reads.

     DOUBT ON AN UPLOAD IS INVISIBLE TO THE CANDIDATE (decided 2026-08-20, client
     feedback). Can’t read and Not enough information are OUR uncertainty about a
     file we parsed, not a fact about the person: the layout may have beaten the
     parser on a CV a human reads perfectly. Saying “không đọc được” or “chưa đủ
     thông tin” before a human has confirmed it blames the candidate for our own
     failure — the exact thing this module promises never to do. So an uploaded CV
     in doubt renders EXACTLY like a normal one: no chip, no reason line, no
     button, no “chờ duyệt”. The candidate only ever sees DECIDED states —
     Qualified (nothing to say) or Rejected (reason + fix).

     The cost is ours and it is real: a held application is invisible to the
     person waiting on it, so an unworked queue is a silent failure. That makes
     the review SLA a hard commitment monitored by ageing alerts on the admin
     side — see the CV review queue.

     REJECTED is a verdict, not a doubt: an admin chose one of THREE reasons, and
     the chip names both — “Chưa được duyệt — <reason>”. Softened from “Bị từ
     chối” on client feedback (too harsh), and per-reason on the same feedback:
     the three rejections have three different fixes, so they must be tellable
     apart at a glance. “Không hợp lệ” as a state of its own is GONE — “not a
     CV” is now a rejection reason, because only a human can judge it. The
     detail of WHAT is missing lives in the editor, not here: this list is for
     recognising your CVs, so a failing row gets one line and one button. */
  /* WHICH STATES EXIST DEPENDS ON THE ROUTE, and the types say so rather than
     leaving it to a comment nobody reads:

       Uploaded PDF  — all four. There is a FILE, so it can fail to parse, and a
                       human can judge it not a CV at all.
       Saramin CV    — two: Qualified · Not enough information. Typed into our own
                       form, so there is no file to fail on, nothing for an admin
                       to review, and it can never be Rejected — the fix is always
                       the candidate's own.

     Getting this wrong in either direction is a real bug — offering "Tải lên CV
     khác" to someone who never uploaded anything, or hiding "Không đọc được" from
     a scan that genuinely failed. */
  type UploadState = 'qualified' | 'not_enough' | 'unreadable' | 'rejected'
  type SaraminState = 'qualified' | 'not_enough'
  type RejectReason = 'not_a_cv' | 'not_enough' | 'unreadable'
  /* THE ONLY DOUBT THE CANDIDATE EVER SEES — a SARAMIN CV below the rule, and it
     is a different animal from an upload in doubt: there is no file, no parser
     and no uncertainty. It is arithmetic over fields the candidate typed into our
     own form, so the check cannot be wrong about it, nothing is queued for review,
     and the fix is entirely theirs. Hence: shown immediately, amber, with the one
     button that fixes it. An UPLOAD in the same state shows nothing at all. */
  const SARAMIN_THIN = { chip: '⚠ Chưa đủ thông tin', why: 'Chưa hiển thị với NTD & chưa ứng tuyển được — cần bổ sung kinh nghiệm hoặc kỹ năng.', action: 'Cập nhật hồ sơ', to: 'js-create-cv' }
  /* One entry per REJECT REASON — the admin's code picks the candidate's words,
     and the CHIP carries the reason too (client feedback: a bare status chip
     made the three rejections indistinguishable at a glance). The soft verdict
     word stays as the prefix — “Chưa được duyệt — <reason>”, never “Bị từ chối”.
     “Thiếu thông tin”, not “Chưa đủ thông tin”, so the rose chip can never be
     misread as the amber auto-flag of the same name. */
  const REJECTED: Record<RejectReason, { chip: string; why: string; action: string; to: string }> = {
    not_a_cv: { chip: 'Chưa được duyệt — Không phải CV', why: 'File bạn tải lên không phải một CV. Hãy tải lên CV của bạn, hoặc tạo Saramin CV.', action: 'Tải lên CV khác', to: 'js-add-cv' },
    not_enough: { chip: 'Chưa được duyệt — Thiếu thông tin', why: 'Hồ sơ chưa đủ thông tin để gửi tới nhà tuyển dụng.', action: 'Cập nhật hồ sơ', to: 'js-create-cv' },
    unreadable: { chip: 'Chưa được duyệt — Không đọc được', why: 'Hệ thống không đọc được nội dung trong file này. Bạn thử tải lên bản PDF dạng văn bản.', action: 'Tải lên CV khác', to: 'js-add-cv' },
  }
  /* The union is what enforces the route rule: a row typed as Saramin cannot be
     given `unreadable` or `rejected` — TypeScript refuses it. And `reason` exists
     ONLY with `state: 'rejected'`, so a rejection can never be reasonless. */
  /* `ver` — HOW MANY TIMES THIS CV HAS BEEN REPLACED, +1. It is on the row for one
     reason: to make it obvious that replacing a file UPDATES this CV rather than
     creating another one, so the candidate does not burn a shelf slot trying to
     fix a typo. The earlier applications keep the version they were sent — the
     line under the shelf says so, because "my new CV went out to everyone" is the
     wrong assumption to leave a candidate holding. Absent or 1 = never replaced,
     and nothing renders. */
  type CvRow =
    | { name: string; kind: 'Uploaded'; meta: string; icon: string; ver?: number; state: Exclude<UploadState, 'rejected'> }
    | { name: string; kind: 'Uploaded'; meta: string; icon: string; ver?: number; state: 'rejected'; reason: RejectReason }
    | { name: string; kind: 'Saramin'; meta: string; icon: string; ver?: number; state: SaraminState }
  const cvs: CvRow[] = [
    { name: 'productdesign.pdf', kind: 'Uploaded', meta: 'Cập nhật 26/07/2026', icon: '📄', ver: 3, state: 'unreadable' },
    { name: 'Business Developer CV', kind: 'Saramin', meta: 'Created 26/07/2026', icon: '📄', state: 'qualified' },
    { name: 'UX Designer CV', kind: 'Saramin', meta: 'Cập nhật 14/08/2026', icon: '📄', ver: 2, state: 'not_enough' },
    /* ALL THREE reject reasons are present on purpose: each one has a different
       chip, a different line and a DIFFERENT BUTTON, and that difference is the
       whole argument for three names rather than one “rejected”. A screen that
       demonstrates only one of them cannot be reviewed against the matrix.
       Rejected CVs do not count towards the 3-CV cap, so showing all three does
       not misrepresent the limit. */
    { name: 'scan_cu.pdf', kind: 'Uploaded', meta: 'Uploaded 02/08/2026', icon: '📄', state: 'rejected', reason: 'not_a_cv' },
    { name: 'cv-ban-nhap.pdf', kind: 'Uploaded', meta: 'Uploaded 10/08/2026', icon: '📄', state: 'rejected', reason: 'not_enough' },
    { name: 'anh-chup-cv.pdf', kind: 'Uploaded', meta: 'Uploaded 12/08/2026', icon: '📄', state: 'rejected', reason: 'unreadable' },
  ]
  /* WHAT THE ROW SHOWS — null means “render it like any healthy CV”, and THREE
     different situations map to null on purpose:

       qualified            nothing to say
       uploaded · doubt     our uncertainty, not their problem — invisible until
                            a human decides (see the decision above)
       (rejected)           never null; a decided verdict is always shown

     Every call site gates on this one function, so the invisibility rule cannot
     be honoured in the chip and forgotten in the reason line. */
  const shown = (c: CvRow) =>
    c.state === 'rejected' ? REJECTED[c.reason]
      : c.kind === 'Saramin' && c.state === 'not_enough' ? SARAMIN_THIN
      : null

  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-my-cvs" />

        {/* main */}
        <div className="space-y-4">
          {/* Profile summary — SHARED with the Create-CV builder (ProfileSummaryCard) */}
          <ProfileSummaryCard onEdit={(sec) => setEditing(sec)} />

          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div>
                {/* A REJECTED CV does not consume a slot. The cap exists to keep the
                    shelf small enough to choose from; a file we have refused is not
                    a choice, and making it eat one of three would punish the
                    candidate for our rejection. */}
                <p className="text-[15px] font-bold text-ink">My CVs <span className="text-[11px] font-normal text-faint">· {cvs.filter((c) => c.state !== 'rejected').length} of 3</span></p>
                {/* The cap is stated where the count is, not on the button — a
                    disabled button that explains itself is a button nobody can use;
                    a live button that tells you what it will ask for is one you can. */}
                {cvs.filter((c) => c.state !== 'rejected').length >= 3 && (
                  <p className="text-[11px] text-faint">Đã đủ 3 CV — tạo mới sẽ cần chọn 1 CV để thay thế. CV bị từ chối không tính vào giới hạn.</p>
                )}
              </div>
            </div>
            {/* ALWAYS available, even at the cap. The cap is a real constraint, but a
                dead button is a dead end — the flow can ask which CV to replace,
                which the candidate can act on. */}
            <Btn primary onClick={() => go('js-add-cv')}>+ Add new CV</Btn>
          </div>

          {/* The which-statuses-by-route explainer box that used to sit here was
              REMOVED (2026-08-20 review): a status legend is spec material, and it
              lives as a table in Resume management → CV qualification. The screen
              teaches through the rows themselves — each failing CV carries its own
              chip, reason and action. */}

          {/* CV list — ONE named action per row (View as employer, the only thing a
              candidate does often) and everything else behind ⋯. Four peer links put
              Delete one stray click from View; a menu costs one click and removes that.
              The searchable switch lives in the menu too, where there is finally room
              for the sentence that makes it truthful. */}
          <div className="space-y-2.5">
            {cvs.map((c, i) => (
              <div key={c.name} onClick={() => go('js-cv-detail')} className={cn('relative flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-4 hover:border-brand/40', searchable === i ? 'border-brand/40 bg-brand-soft/25' : 'border-line')}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-rose-50 text-[16px]">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-ink">
                    {c.name}
                    <Chip tone={c.kind === 'Saramin' ? 'blue' : 'muted'}>{c.kind}</Chip>
                    {/* Two different chips, because they answer two different
                        questions: the STATE of the CV (only ever a DECIDED one —
                        an upload in doubt shows nothing), and whether this is the
                        one employers search. AMBER is the Saramin gate the
                        candidate can clear themselves; ROSE is an admin verdict.

                        THE SEARCH CHIP MARKS THE CHOICE, not the live index —
                        “this is the CV employers search with”. So it stays on an
                        upload in doubt: the choice is real, and adding “tạm không
                        hiển thị” would leak the review we just decided to hide.
                        A REJECTED CV gets no search chip at all — it left the
                        index for good, and a “tạm” would promise a return that
                        needs a new file. */}
                    {shown(c) && <Chip tone={c.state === 'rejected' ? 'rose' : 'amber'}>{shown(c)!.chip}</Chip>}
                    {searchable === i && c.state !== 'rejected' && c.state !== 'not_enough' && <Chip tone="green">Hiển thị trong tìm kiếm CV</Chip>}
                    {searchable === i && c.state === 'not_enough' && c.kind === 'Saramin' && <Chip tone="amber">Tạm không hiển thị</Chip>}
                  </p>
                  <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-faint">
                    <span>{c.meta}</span>
                    {!!c.ver && c.ver > 1 && (
                      <span className="text-[10.5px] text-slate-500" title={`Bạn đã thay CV này ${c.ver - 1} lần. Những đơn đã nộp trước đó vẫn giữ đúng bản bạn đã gửi khi ấy.`}>
                        · bản {c.ver} <span className="text-faint">(đã thay {c.ver - 1} lần)</span>
                      </span>
                    )}
                  </p>

                  {/* A failing row gets ONE line and ONE button. The detail of what
                      is missing belongs in the editor — this list is for recognising
                      your CVs, not for working through a checklist. */}
                  {shown(c) && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <p className={cn('min-w-0 flex-1 text-[11px] leading-snug', c.state === 'rejected' ? 'text-rose-700' : 'text-amber-700')}>
                        {shown(c)!.why}
                        {searchable === i && c.state !== 'rejected' && ' Vẫn là CV bạn chọn — sẽ hiển thị lại ngay khi đủ điều kiện.'}
                      </p>
                      <span
                        onClick={(e) => { e.stopPropagation(); go(shown(c)!.to) }}
                        className={cn('shrink-0 cursor-pointer rounded-md border bg-surface px-2.5 py-1 text-[11px] font-medium', c.state === 'rejected' ? 'border-rose-300 text-rose-700' : 'border-amber-300 text-amber-700')}
                      >
                        {shown(c)!.action} →
                      </span>
                    </div>
                  )}

                  {/* The one named action, LAST — it sends the candidate away from
                      this list, so it sits under what describes the CV rather than
                      above it. The ⋯ button holds the rest. */}
                  <span className="mt-2 inline-block cursor-pointer text-[11.5px] font-medium text-brand">View as employer</span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setMenu(menu === i ? null : i) }}
                  className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[15px] leading-none text-muted', menu === i ? 'border-line bg-canvas' : 'border-transparent hover:border-line hover:bg-canvas')}
                >⋯</button>

                {menu === i && (
                  <>
                    {/* click-away */}
                    <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenu(null) }} />
                    <div onClick={(e) => e.stopPropagation()} className="absolute right-3 top-12 z-30 w-[248px] overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
                      {[
                        { icon: '⤓', label: 'Tải xuống' },
                        { icon: '✎', label: 'Đổi tên' },
                        { icon: '', label: 'Xoá', danger: true },
                      ].map((a) => (
                        <button
                          key={a.label}
                          onClick={() => setMenu(null)}
                          className={cn('flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] hover:bg-canvas', a.danger ? 'text-rose-600' : 'text-ink')}
                        >
                          <span className="w-3.5 text-center text-faint">{a.icon}</span>{a.label}
                        </button>
                      ))}

                      {/* The switch that decides which CV recruiters can find. Its old
                          label “Cho phép tìm kiếm” read as a privacy switch; it actually
                          means “THIS is the one employers see”, so it says that now. */}
                      {/* A RADIO, not a switch — the flag moves between CVs and can
                          never reach zero, because "Discoverable with nothing
                          indexed" is the worst state in the product: the candidate
                          consented, believes they are findable, and gets nothing.
                          It used to render as an on/off toggle that could not
                          actually be switched off, which promised the opposite. */}
                      {/* The toggle is blocked only by what the candidate can SEE —
                          `shown(c)`. An upload in doubt is selectable and reads
                          normally: it is hidden from the index for now, but saying
                          so would leak the review, and the choice itself is real
                          and will be honoured the moment the CV clears. */}
                      <div className="mt-1 border-t border-line-soft px-3 py-2.5">
                        <label
                          onClick={() => { if (!shown(c)) { setSearchable(i); setMenu(null) } }}
                          className={cn('flex items-center justify-between gap-2', !shown(c) ? 'cursor-pointer' : 'cursor-default opacity-60')}
                        >
                          <span className="text-[12px] text-ink">Cho nhà tuyển dụng tìm thấy CV này</span>
                          {/* A TOGGLE, not a radio — “turn CV search on for this CV”
                              reads as a switch, and a disabled switch shows plainly
                              that the control exists but is not available yet. */}
                          <span className={cn('relative h-4 w-7 shrink-0 rounded-full transition-colors', searchable === i ? (!shown(c) ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-line')}>
                            <span className={cn('absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all', searchable === i ? 'right-0.5' : 'left-0.5')} />
                          </span>
                        </label>
                        {/* A REJECTED CV gets no “tạm” and no promise of returning on
                            its own — a verdict needs a new file or real edits, not a
                            wait. The Saramin gate keeps the “back the moment it
                            qualifies” line, because that moment is theirs to create. */}
                        <p className={cn('mt-1 text-[10.5px] leading-snug', !shown(c) ? 'text-faint' : c.state === 'rejected' ? 'text-rose-700' : 'text-amber-700')}>
                          {c.state === 'rejected'
                            ? 'CV chưa được duyệt nên không thể hiển thị với nhà tuyển dụng.'
                            : shown(c)
                            ? searchable === i
                              ? 'Vẫn là CV bạn đã chọn, nhưng chưa đủ điều kiện nên tạm không hiển thị. Bổ sung xong là hiển thị lại ngay — không cần chọn lại.'
                              : 'Chưa đủ thông tin — chưa thể hiển thị với nhà tuyển dụng.'
                            : searchable === i
                              ? 'Đây là CV nhà tuyển dụng tìm thấy. Chọn CV khác để thay thế.'
                              : 'Chọn CV này thay cho CV đang hiển thị.'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Edit Basic information — the 9 fields, and only those ── */}
      {editing && <ProfileEditPopup section={editing} onClose={() => setEditing(null)} />}

    </div>
  )
}


/* ── CV detail — one CV, read the way an employer reads it, in the SAME three
   groups the candidate already knows from their profile: Basic information ·
   Work preference · CV content.
   Two jobs on one screen: (1) show the document, (2) explain its STATE. A failing
   CV gets the DETAILED version of the message here — the list only had room for
   one line, and “what exactly is wrong and what do I do” is the thing a candidate
   opens this page to find out.

   WHICH STATES REACH THIS PANEL — the same two the list flags, and no others:
   a SARAMIN CV below the rule (drawn below), and a REJECTED upload (the admin's
   reason picks the heading, body and button, exactly as on the list). An upload
   in DOUBT reaches this page with NO panel at all: it renders as a plain CV,
   because our own uncertainty about our own parse is not something the candidate
   is told about. See My CVs for the full rule. ── */
function CvDetailScreen() {
  const go = useNav()
  /* The state this screen is demonstrating. Every failure reason lands here with
     its own heading, body and action — the list is the summary, this is the full
     explanation, and the two must never disagree. */
  const st = {
    chip: '⚠ Chưa đủ thông tin',
    heading: 'Hồ sơ chưa đủ điều kiện hiển thị và ứng tuyển',
    body: 'Để bật cho phép tìm kiếm và dùng để ứng tuyển, hồ sơ cần có ít nhất 1 kinh nghiệm làm việc (hoặc học vấn + dự án nếu bạn chưa đi làm) và 3 kỹ năng.',
    todo: [
      { label: 'Kinh nghiệm làm việc', hint: 'Chưa có kinh nghiệm? Điền Học vấn + Dự án thay thế' },
      { label: 'Kỹ năng — đang có 1/3', hint: 'Thêm 2 kỹ năng nữa' },
    ],
    action: 'Cập nhật hồ sơ',
  }
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">{title}</p>
      {children}
    </div>
  )
  const Row = ({ k, v }: { k: string; v: string }) => (
    <p className="flex items-baseline justify-between gap-3 border-t border-line-soft py-1.5 text-[12px] first:border-t-0 first:pt-0">
      <span className="shrink-0 text-muted">{k}</span><span className="text-right font-medium text-ink">{v}</span>
    </p>
  )
  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-my-cvs" />

        <div className="space-y-3">
          <p onClick={() => go('js-my-cvs')} className="cursor-pointer text-[11.5px] font-medium text-brand">← My CVs</p>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-bold text-ink">UX Designer CV</p>
            <Chip tone="blue">Saramin</Chip>
            <Chip tone="amber">{st.chip}</Chip>
          </div>

          {/* The DETAILED state — the reason the candidate opened this page. Same
              wording family as the list, but with the “what exactly” the list had
              no room for, and one action. */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-[12.5px] font-bold text-amber-800">{st.heading}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-amber-800/90">{st.body}</p>
            <div className="mt-2.5 space-y-1.5">
              {st.todo.map((t) => (
                <div key={t.label} className="flex items-start gap-2">
                  <span className="mt-[3px] h-3 w-3 shrink-0 rounded-full border-[1.5px] border-amber-400" />
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-medium text-ink/85">{t.label}</p>
                    <p className="text-[10.5px] text-amber-700">{t.hint}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Btn primary onClick={() => go('js-create-cv')}>{st.action}</Btn>
            </div>
          </div>

          <Section title="1 · Thông tin cơ bản">
            <div className="grid gap-x-6 sm:grid-cols-2">
              <Row k="Họ tên" v="Trần Minh Anh" />
              <Row k="Email" v="minhanh@email.com" />
              <Row k="Điện thoại" v="0901 234 567" />
              <Row k="Ngày sinh" v="12/04/1996" />
              <Row k="Giới tính" v="Nữ" />
              <Row k="Quốc tịch" v="Việt Nam" />
              <Row k="Tình trạng hôn nhân" v="Độc thân" />
              <Row k="Học vấn cao nhất" v="Cử nhân" />
              <Row k="Số năm kinh nghiệm" v="4 năm" />
            </div>
          </Section>

          <Section title="2 · Công việc mong muốn">
            <div className="grid gap-x-6 sm:grid-cols-2">
              <Row k="Vị trí mong muốn" v="Senior Product Designer" />
              <Row k="Ngành nghề" v="Thiết kế" />
              <Row k="Lĩnh vực" v="IT / Phần mềm" />
              <Row k="Nơi muốn làm việc" v="Hồ Chí Minh · Hà Nội" />
              <Row k="Mức lương mong muốn" v="20 – 30 tr" />
              <Row k="Hình thức làm việc" v="In office" />
            </div>
          </Section>

          {/* CV CONTENT — the document itself, shown the way an employer sees it,
              with the file link underneath. This is what “Xem như nhà tuyển dụng”
              means in practice, so it does not need a separate screen. */}
          <Section title="3 · Nội dung CV">
            <div className="rounded-lg border border-line bg-canvas/40 p-4">
              <p className="text-[13px] font-bold text-ink">Trần Minh Anh</p>
              <p className="text-[11px] text-muted">Product Designer · Hồ Chí Minh</p>
              <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Kinh nghiệm làm việc</p>
              <p className="rounded-md border border-dashed border-amber-300 bg-amber-50/60 px-2 py-1.5 text-[11px] text-amber-700">Chưa có — cần bổ sung</p>
              <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Kỹ năng</p>
              <p className="text-[11.5px] text-ink">Figma</p>
              <p className="mt-3 mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Học vấn</p>
              <p className="text-[11.5px] text-ink">ĐH Kinh tế TP.HCM · Cử nhân</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="cursor-pointer text-[11.5px] font-medium text-brand">🔗 Tải xuống PDF</span>
              <span className="cursor-pointer text-[11.5px] font-medium text-brand">Xem như nhà tuyển dụng</span>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

/* ── SARAMIN STANDARD — the one generated-CV template, shown next to the editor
   that produces it. A CV can be laid out a thousand ways; this screen exists to
   say we do not chase them. Left: the document. Right: the whole markup
   vocabulary a candidate gets, and what an uploaded PDF is normalised into.
   The rules themselves live in components/CvDoc.tsx. ── */
const TEMPLATE_CV: CvData = {
  name: 'Trần Minh Anh',
  headline: 'Senior Product Designer',
  email: 'minhanh@email.com',
  phone: '0901 234 567',
  location: 'Hồ Chí Minh',
  photo: true,
  summary: 'Product designer 4+ năm cho sản phẩm web & mobile, tập trung vào hệ thống thiết kế và nghiên cứu người dùng.',
  roles: [
    /* Exercises ALL FOUR marks — lead paragraph, sub-headings grouping bullets by
       project, and inline bold on the numbers. This is the shape a senior CV
       actually has, and the reason sub-heading earned its place in the set. */
    {
      title: 'Senior Product Designer', company: 'Lantern Digital', place: 'Hồ Chí Minh',
      from: '03/2022', to: 'Nay',
      body: [
        'Thiết kế sản phẩm cho 2 nền tảng web & mobile, dẫn dắt hệ thống thiết kế dùng chung cho 4 nhóm sản phẩm.',
        '## Design System',
        '• Xây dựng và duy trì hệ thống thiết kế dùng chung cho 4 nhóm sản phẩm, giảm thời gian dựng giao diện mới khoảng 40%.',
        '• Viết tài liệu hướng dẫn và tổ chức 6 buổi đào tạo cho đội thiết kế và front-end.',
        '## Checkout redesign',
        '• Phỏng vấn 18 khách hàng, tìm ra 3 điểm nghẽn chính trong luồng thanh toán.',
        '• Thiết kế lại luồng checkout, tăng tỷ lệ hoàn tất đơn 12% sau 2 tháng.',
        '## Research Ops',
        '• Thiết lập quy trình phỏng vấn và kho dữ liệu nghiên cứu dùng chung cho cả công ty.',
      ].join('\n'),
    },
    /* The common case, and the one that must stay simple: plain bullets, no
       headings. Most CVs on a general job board look like this. */
    {
      title: 'Product Designer', company: 'Zenpay', place: 'Hồ Chí Minh',
      from: '06/2019', to: '02/2022',
      body: [
        '• Thiết kế giao diện ứng dụng ví điện tử cho hơn 200.000 người dùng.',
        '• Phối hợp với nhóm marketing xây dựng bộ nhận diện trong sản phẩm.',
        '• Chuẩn hoá thư viện icon và bảng màu, dùng chung cho 3 sản phẩm.',
      ].join('\n'),
    },
  ],
  schools: [{
    school: 'ĐH Kinh tế TP.HCM', degree: 'Cử nhân', major: 'Quản trị kinh doanh', from: '2015', to: '2019',
    /* Achievements take the same two blocks as a job description — the field was
       a single-line input until 2026-08-22, which is why it read as an
       afterthought and nobody filled it in. */
    body: [
      '• Học bổng khuyến khích học tập 3 kỳ liên tiếp',
      '• Khoá luận loại Giỏi — hành vi người dùng thương mại điện tử',
    ].join('\n'),
  }],
  skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'Wireframing'],
  /* Every optional section is the same shape — title · meta · block body — so a
     project written with sub-headings prints exactly like a role written with
     them. One vocabulary, everywhere a candidate types prose. */
  extras: [
    {
      heading: 'Dự án nổi bật',
      entries: [{
        title: 'Saramin Design Kit', meta: '2024',
        body: [
          'Bộ thư viện giao diện mã nguồn mở cho nhóm thiết kế nội bộ.',
          '## Phạm vi',
          '• 42 component, tài liệu hướng dẫn và bộ token màu · chữ.',
          '• Được 3 nhóm sản phẩm sử dụng trong 6 tháng đầu.',
        ].join('\n'),
      }],
    },
    {
      heading: 'Giải thưởng',
      entries: [{
        title: 'Vietnam Design Awards — Hạng mục UX', meta: '2023',
        body: '• Giải Bạc cho dự án thiết kế lại luồng thanh toán.',
      }],
    },
    {
      heading: 'Hoạt động',
      entries: [{
        title: 'UX Vietnam Community', meta: 'Mentor · 2022 – nay',
        body: '• Hướng dẫn 12 bạn mới chuyển ngành, mỗi khoá 8 tuần.',
      }],
    },
    /* Language = name + level, nothing else. The IELTS score that used to sit
       here now sits in Chứng chỉ, where a certificate has an issuer and a date. */
    { heading: 'Ngoại ngữ', entries: [{ title: 'Tiếng Anh', meta: 'Fluent' }, { title: 'Tiếng Hàn', meta: 'Basic' }] },
    {
      heading: 'Chứng chỉ',
      entries: [
        { title: 'IELTS 7.5', meta: 'British Council · 2023' },
        { title: 'Google UX Design Certificate', meta: 'Coursera · 2021' },
      ],
    },
  ],
}

/* A messy paste straight out of a PDF — wrapped bullets, mixed glyphs, a numbered
   list. Shown beside its normalised form because the wrap rule is the one thing
   readers do not believe until they see it: line 2 is NOT a second bullet. */
const RAW_PASTE = [
  '- Built 10+ operational modules (HR, Security, Equipment Tracking) across 60+',
  '  screens as the sole mobile developer, from architecture to production.',
  '2. Integrated FCM for push notifications and CodePush for OTA updates,',
  '   enabling hotfixes without a store re-download.',
].join('\n')

function CvTemplateScreen() {
  const [body, setBody] = useState(TEMPLATE_CV.roles[0].body)
  const cv: CvData = { ...TEMPLATE_CV, roles: [{ ...TEMPLATE_CV.roles[0], body }, TEMPLATE_CV.roles[1]] }
  const Mark = ({ code, is }: { code: string; is: string }) => (
    <p className="flex gap-2 text-[11px]">
      <code className="w-14 shrink-0 rounded bg-canvas px-1 py-0.5 text-center font-mono text-[10.5px] text-ink/80">{code}</code>
      <span className="min-w-0 text-muted">{is}</span>
    </p>
  )
  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        {/* ── left: the document ── */}
        <div>
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-brand">Saramin Standard — bản CV được tạo ra</p>
          <SaraminCvDoc cv={cv} frame />
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Một cột, thứ tự mục cố định, không đổi màu và không đổi bố cục. Ràng buộc quyết định:{' '}
            <b className="font-semibold text-ink/70">CV do Saramin tạo, đưa ngược qua chính bộ đọc CV của Saramin, phải ra đúng từng trường</b> —
            nếu bộ đọc của mình còn không đọc nổi bản mình tạo thì không ATS nào đọc được.
          </p>
        </div>

        {/* ── right: the vocabulary, live ── */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-3.5">
            <p className="text-[12px] font-bold text-ink">Hai nút — hết</p>
            <p className="mt-0.5 mb-2 text-[11px] leading-relaxed text-muted">
              Một ô nhập, một thanh công cụ, <b className="font-semibold text-ink/75">đúng 2 nút</b> — như ô soạn tin
              của Slack. Ứng viên chọn <b className="font-semibold text-ink/75">cấu trúc</b>, Saramin chọn{' '}
              <b className="font-semibold text-ink/75">kiểu hiển thị</b>. Không có cú pháp để học và không bao giờ
              thấy ký hiệu. Sửa thử ở dưới, bản CV bên trái đổi theo.
            </p>
            <div className="space-y-1">
              <Mark code="H" is="tiêu đề nhỏ — nhóm gạch đầu dòng trong một vị trí" />
              <Mark code="•" is="gạch đầu dòng, 1 cấp" />
              <Mark code="—" is="không bấm gì = đoạn văn" />
            </div>
            <div className="mt-2.5">
              <CvComposer value={body} onChange={setBody} />
            </div>
          </div>

          {/* The normalisation rule, demonstrated rather than asserted. */}
          <div className="rounded-xl border border-line bg-surface p-3.5">
            <p className="text-[12px] font-bold text-ink">Dán từ PDF → chuẩn hoá</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              Dòng nối tiếp của một gạch đầu dòng bị xuống hàng trong PDF sẽ được{' '}
              <b className="font-semibold text-ink/75">nhập lại vào đúng gạch đầu dòng đó</b>, không tách thành dòng mới.
              Mọi ký hiệu <code className="font-mono text-[10.5px]">- · * 1.</code> đều quy về gạch đầu dòng, và mọi định dạng chữ (đậm, nghiêng) bị bỏ.
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-canvas/60 p-2 font-mono text-[10px] leading-relaxed text-muted">{RAW_PASTE}</pre>
            <p className="mt-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wide text-faint">Kết quả</p>
            <div className="rounded-md border border-line bg-canvas/30 p-2">
              <CvRichText value={normalizeCvText(RAW_PASTE)} />
            </div>
          </div>

          <div className="rounded-xl border border-line bg-canvas/50 p-3.5">
            <p className="text-[11px] font-semibold text-ink/80">Bỏ đi, có chủ đích</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              In đậm (tên công nghệ đã nằm ở trường Kỹ năng có cấu trúc — nơi tìm kiếm thật sự đọc) ·
              in nghiêng &amp; gạch chân (trong CV thật chúng chỉ dùng để đánh dấu tiêu đề nhỏ — nay đã có kiểu dòng riêng) ·
              danh sách đánh số · gạch đầu dòng nhiều cấp · bảng &amp; chia cột · font, cỡ chữ, màu sắc.
            </p>
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
  /* An extracted word that resolved to no taxonomy row — the miss path. */
  const [resolved, setResolved] = useState<'picked' | 'requested' | null>(null)
  /* Experience first, desired role second — the same order the skills field uses.
     Here the reason is visible on the very same screen: the roles being read from
     sit two cards above, in the PDF the candidate just uploaded. */
  const SUGGESTED_GROUPS: { from: string; source: 'experience' | 'desired'; skills: string[] }[] = [
    { from: 'Senior Product Designer · Lantern Digital', source: 'experience', skills: ['Design Systems', 'User Research'] },
    { from: 'Senior Product Designer', source: 'desired', skills: ['Prototyping', 'Wireframing'] },
  ]
  const SUGGESTED = SUGGESTED_GROUPS.flatMap((g) => g.skills)
  return (
    <div>
      <JsHeader active="CV & Profile" />

      {/* top bar — what happened + the exit */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-5 py-3">
        <div>
          <p className="text-[14px] font-bold text-ink">We read your CV — here it is, two ways</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn onClick={() => go('js-my-cvs')}>Cancel</Btn>
          <Btn primary onClick={() => go('js-my-cvs')}>Save</Btn>
        </div>
      </div>

      {/* The PDF column is deliberately MUCH narrower than the Saramin column and
          renders the compact document: the PDF is only the reference you check
          answers against, the Saramin CV is the thing being built. */}
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        {/* ── left: their PDF — reference, not the main event ── */}
        <div className="md:sticky md:top-4 md:self-start">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Your PDF — reference</p>
          <UploadedCvDoc highlightDates compact />
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
                <ProfilePhoto photo />
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
                <p className="mt-0.5 text-[10.5px] font-medium text-rose-600">We couldn’t read the dates — type them here (they’re on your PDF, left)</p>
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
            {/* skills — the resolution pipeline made visible: words the parser
                pulled off the PDF either MATCHED a taxonomy row (chip) or did
                not (the amber row below). Nothing is saved until confirmed. */}
            <div className="rounded-xl border border-line bg-surface p-3.5">
              <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-brand">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="blue">Figma</Chip><Chip tone="blue">UI Design</Chip>
                {added.map((s) => <Chip key={s} tone="blue">{s}</Chip>)}
              </div>
              {/* the MISS path — an extracted word that matched no taxonomy row
                  and no alias. It is never guessed into a neighbour and never
                  saved silently: the candidate picks a real row or asks for it. */}
              {!resolved && (
                <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                  <p className="text-[10.5px] font-semibold text-amber-800">1 word from your PDF isn’t in our skill list</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded border border-dashed border-amber-400 bg-surface px-2 py-1 text-[11px] text-ink/70">“Design Thinking”</span>
                    <span onClick={() => setResolved('picked')} className="cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/80 hover:border-brand/50">Pick from the list</span>
                    <span onClick={() => setResolved('requested')} className="cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink/80 hover:border-brand/50">Request it</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-amber-800/80">We never guess a close match — it would put a skill on your CV that you didn’t choose.</p>
                </div>
              )}
              {resolved === 'picked' && (
                <p className="mt-2.5 rounded-lg bg-canvas px-2.5 py-2 text-[10.5px] text-muted">Skipped “Design Thinking” — nothing was added to your CV.</p>
              )}
              {resolved === 'requested' && (
                <p className="mt-2.5 rounded-lg bg-canvas px-2.5 py-2 text-[10.5px] text-muted">Sent “Design Thinking” to the team for review. It isn’t on your CV yet.</p>
              )}
              <div className="mt-2.5 space-y-2 rounded-lg bg-brand-soft/50 p-2.5">
                {SUGGESTED_GROUPS.map((g) => {
                  const left = g.skills.filter((s) => !added.includes(s))
                  if (!left.length) return null
                  return (
                    <div key={g.from}>
                      <p className="mb-1.5 text-[10.5px] font-semibold text-brand">
                        {g.source === 'experience' ? 'From your time as' : 'For your'} {g.from}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {left.map((s) => (
                          <span key={s} onClick={() => setAdded((a) => [...a, s])} className="cursor-pointer rounded-full border border-dashed border-brand/50 px-2.5 py-1 text-[11px] text-brand hover:bg-brand-soft">＋ {s}</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {SUGGESTED.every((s) => added.includes(s)) && <span className="text-[10.5px] text-muted">All added</span>}
              </div>
            </div>
            {/* optional sections — same list as My Profile, compact add prompts */}
            <div className="rounded-xl border border-dashed border-line bg-canvas/30 p-3.5">
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wide text-faint">Add more — boosts your visibility</p>
              <div className="flex flex-wrap gap-1.5">
                {(['Foreign Language', 'Highlight projects', 'Certificates', 'Awards', 'Activities', 'References'] as string[]).map((s) => (
                  <span key={s} className="cursor-pointer rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink/70 hover:border-brand/40">＋ {s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── save — ONE action. The candidate reached this screen by choosing to
           convert, so "save as original PDF" was a second exit from a decision
           already made; the PDF is already saved and untouched regardless. ── */}
      <div className="border-t border-line bg-surface px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button onClick={() => go('js-my-cvs')} className="rounded-lg bg-brand px-6 py-2.5 text-[12.5px] font-semibold text-white hover:opacity-90">Save</button>
        </div>
        <p className="mt-2 text-center text-[10.5px] text-faint">
          Your original PDF stays in My CVs, unchanged — this adds the structured version beside it.
        </p>
      </div>
    </div>
  )
}

/* ── Onboarding — a short GUIDED wizard (the Saramin-KR pattern): a few
   RELEVANT questions about WORK PREFERENCE (job wanted · region · pay),
   each step framed with a live job-count carrot, ending on a screen of matched
   jobs — from which we lead the candidate into creating their CV. No upload /
   build fork here; that lives on the My CVs page. */
/* Provinces ONLY. “Remote” and “Overseas” used to sit in this list, which made
   the field lie about what it holds: as locations they cannot express “I live in
   HCMC and want remote”, and they are really values of the job's WORK TYPE axis
   (in-office · remote · hybrid · oversea). They moved to their own control below,
   which is the same question asked correctly — not a new question. */
const VN_PROVINCES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai', 'Hải Phòng', 'Cần Thơ', 'Bắc Ninh', 'Bình Định', 'Khánh Hoà']
const WORK_TYPES = ['In office', 'Remote', 'Hybrid', 'Oversea']

function OnboardingScreen() {
  const go = useNav()
  const [step, setStep] = useState<1 | 2 | 3 | 'results'>(1)
  /* Every taxonomy field is a DROPDOWN, not a chip grid. The real master data is
     far longer than any mockup list — 34 provincial units, ~30 industries, hundreds of
     roles — so a chip grid would either lie about the choice or scroll forever.
     Selections stay visible as removable chips UNDER the field, which keeps the
     "what did I pick" answer without pretending the whole set fits on screen. */
  const [locOpen, setLocOpen] = useState(false)
  const [locs, setLocs] = useState<string[]>(['Hồ Chí Minh', 'Hà Nội'])
  const [relocate, setRelocate] = useState(true)
  const [workTypes, setWorkTypes] = useState<string[]>(['In office', 'Hybrid'])
  const toggleLoc = (c: string) =>
    setLocs((a) => (a.includes(c) ? a.filter((x) => x !== c) : a.length >= 3 ? a : [...a, c]))
  const [catOpen, setCatOpen] = useState(false)
  const [cat, setCat] = useState('Design')
  const [indOpen, setIndOpen] = useState(false)
  const [inds, setInds] = useState<string[]>(['IT / Software', 'FMCG'])
  const toggleInd = (c: string) =>
    setInds((a) => (a.includes(c) ? a.filter((x) => x !== c) : a.length >= 3 ? a : [...a, c]))
  /* Step 3 is the CANDIDATE side of the shared salary contract: ONE figure,
     never a range — the employer states the band and this number has to fall
     inside it. See Resume management → "★ SALARY — the one contract". The
     amount is always monthly VND here, so there is no period or currency
     control to hold state for. */

  /* One picker for every taxonomy field. `max` set → multi-select with a cap and
     removable chips; unset → single-select that closes on pick. Open state is
     held by the parent so this staying inline doesn't reset it on re-render. */
  const Picker = ({ label, hint, options, open, setOpen, value, onPick, max }: {
    label: string; hint?: string; options: string[]; open: boolean
    setOpen: (v: boolean) => void; value: string | string[]
    onPick: (v: string) => void; max?: number
  }) => {
    const multi = Array.isArray(value)
    const chosen = multi ? (value as string[]) : []
    const full = (n: string) => multi && !chosen.includes(n) && chosen.length >= (max ?? 99)
    return (
      <div>
        <p className="mb-1 text-[11.5px] font-medium text-ink">
          {label}{max && <span className="font-normal text-faint"> (up to {max})</span>}
        </p>
        <button
          onClick={() => setOpen(!open)}
          className={cn('flex h-10 w-full items-center gap-2 rounded-lg border bg-surface px-3 text-[12px]', open ? 'border-brand' : 'border-line')}
        >
          <span className={cn('flex-1 text-left', (multi ? chosen.length : value) ? 'text-ink/80' : 'text-faint')}>
            {multi ? (chosen.length ? `${chosen.length} selected` : 'Select…') : (value as string) || 'Select…'}
          </span>
          <span className="text-faint">{open ? '▴' : '▾'}</span>
        </button>
        {open && (
          <div className="mt-1 max-h-[168px] overflow-y-auto rounded-lg border border-line bg-surface shadow-sm">
            {options.map((c) => {
              const on = multi ? chosen.includes(c) : value === c
              const off = full(c)
              return (
                <button
                  key={c}
                  disabled={off}
                  onClick={() => { onPick(c); if (!multi) setOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 border-b border-line-soft px-3 py-2 text-left text-[12px] last:border-b-0',
                    on ? 'bg-brand-soft/50 font-medium text-brand' : off ? 'text-faint' : 'text-ink/80 hover:bg-canvas/60',
                  )}
                >
                  <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border text-[9px] font-bold', on ? 'border-brand bg-brand text-white' : 'border-line text-transparent')}>✓</span>
                  {c}
                </button>
              )
            })}
          </div>
        )}
        {multi && chosen.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chosen.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11.5px] text-brand">
                {c}
                <span onClick={() => onPick(c)} className="cursor-pointer text-[10px] text-brand/70 hover:text-brand">✕</span>
              </span>
            ))}
          </div>
        )}
        {hint && <p className="mt-1 text-[10px] text-faint">{hint}</p>}
      </div>
    )
  }
  const counts: Record<number, string> = { 1: '', 2: '61,341', 3: '12,231' }
  const Bar = ({ n }: { n: number }) => (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
        <span>Step {n} of 3</span>
        {counts[n] && <span className="font-medium text-brand">{counts[n]} jobs match so far</span>}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(n / 3) * 100}%` }} /></div>
    </div>
  )
  const Nav =({ back, next, nextLabel = 'Next' }: { back?: () => void; next: () => void; nextLabel?: string }) => (
    <div className="mt-5 flex justify-between">{back ? <Btn onClick={back}>Before</Btn> : <span />}<Btn primary onClick={next}>{nextLabel}</Btn></div>
  )
  return (
    <div className="min-h-[560px] bg-canvas/40">
      {/* The real header, not a look-alike: same bar on every jobseeker screen and
          the brand mark always goes home. `minimal` drops the account / auth
          actions, which make no sense while someone is signing up. */}
      <JsHeader minimal />
      <div className="grid place-items-center px-4 py-8">
        {step !== 'results' ? (
          <div className="w-full max-w-[440px] rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <Bar n={step} />
            {/* 1 · WHAT work — category → role → industry answer one question, so
                   they belong on one screen. Category is picked first because it
                   narrows the role list below it. */}
            {step === 1 && (
              <>
                <p className="text-[15px] font-bold text-ink">What kind of work are you looking for?</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Personalized job matches begin from here.</p>
                <div className="mt-3 space-y-3">
                  <Picker
                    label="Desired job category"
                    options={['Design', 'IT — Software', 'Marketing', 'Sales', 'Accounting', 'HR', 'Logistics', 'Manufacturing']}
                    open={catOpen} setOpen={setCatOpen}
                    value={cat} onPick={setCat}
                    hint="One category — it drives the role suggestions below."
                  />
                  <div>
                    <p className="mb-1 text-[11.5px] font-medium text-ink">Desired job role</p>
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-canvas/30 px-3 text-[12px] text-faint">e.g. Senior Product Designer</div>
                    <p className="mt-1 text-[10px] text-faint">Suggestions come from the category you picked above.</p>
                  </div>
                  <Picker
                    label="Desired industry"
                    options={['IT / Software', 'FMCG', 'Banking', 'Healthcare', 'Education', 'Logistics', 'Real estate', 'Retail']}
                    open={indOpen} setOpen={setIndOpen}
                    value={inds} onPick={toggleInd} max={3}
                    hint="The company’s sector — a designer can work in Banking or FMCG."
                  />
                </div>
                <Nav next={() => setStep(2)} />
              </>
            )}
            {/* 2 · WHERE */}
            {step === 2 && (
              <>
                <p className="text-[15px] font-bold text-ink">Where and how would you like to work?</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Up to 3 places. The rest is optional.</p>
                <div className="mt-3">
                  {/* the field itself — click to open the province list */}
                  <button
                    onClick={() => setLocOpen((o) => !o)}
                    className={cn('flex h-10 w-full items-center gap-2 rounded-lg border bg-surface px-3 text-[12px]', locOpen ? 'border-brand' : 'border-line')}
                  >
                    <span className="text-faint"></span>
                    <span className={cn('flex-1 text-left', locs.length ? 'text-ink/80' : 'text-faint')}>
                      {locs.length ? `${locs.length} selected` : 'Search a province or city…'}
                    </span>
                    <span className="text-faint">{locOpen ? '▴' : '▾'}</span>
                  </button>

                  {locOpen && (
                    <div className="mt-1 max-h-[168px] overflow-y-auto rounded-lg border border-line bg-surface shadow-sm">
                      {VN_PROVINCES.map((c) => {
                        const on = locs.includes(c)
                        const full = !on && locs.length >= 3
                        return (
                          <button
                            key={c}
                            onClick={() => toggleLoc(c)}
                            disabled={full}
                            className={cn(
                              'flex w-full items-center gap-2 border-b border-line-soft px-3 py-2 text-left text-[12px] last:border-b-0',
                              on ? 'bg-brand-soft/50 font-medium text-brand' : full ? 'text-faint' : 'text-ink/80 hover:bg-canvas/60',
                            )}
                          >
                            <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border text-[9px] font-bold', on ? 'border-brand bg-brand text-white' : 'border-line text-transparent')}>✓</span>
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* selections stay visible as removable chips under the field */}
                  {locs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {locs.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-brand bg-brand-soft px-2.5 py-1 text-[11.5px] text-brand">
                          {c}
                          <span onClick={() => toggleLoc(c)} className="cursor-pointer text-[10px] text-brand/70 hover:text-brand">✕</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[10px] text-faint">{locs.length} of 3 selected · Vietnam has 34 provincial units, so this searches rather than lists.</p>

                  {/* RELOCATE — a widener, not a fourth city. The cap is 3 provinces, so
                      a candidate open to moving anywhere had no way to say so without
                      spending picks on guesses. One flag says "these three are the
                      preference, not the limit", which is what lets a match outside them
                      still surface instead of being filtered away. */}
                  <label
                    onClick={() => setRelocate((v) => !v)}
                    className="mt-2.5 flex cursor-pointer items-start gap-2 text-[11.5px] leading-relaxed text-ink/75"
                  >
                    <span
                      className={cn(
                        'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-sm border text-[10px] font-bold',
                        relocate ? 'border-brand bg-brand text-white' : 'border-line text-transparent',
                      )}
                    >
                      ✓
                    </span>
                    <span>
                      Tôi có thể thay đổi nơi làm việc
                      <span className="text-faint"> · I'm willing to relocate</span>
                    </span>
                  </label>

                  {/* WORK TYPE — the other half of "where", and the half that used to
                      hide inside the province list. Chips, not a search: four values,
                      all visible. This is what the job's `job_type` matches against. */}
                  <div className="mt-3">
                    <p className="mb-1 text-[11.5px] font-medium text-ink">How do you want to work? <span className="font-normal text-faint">(up to 3)</span></p>
                    <div className="flex flex-wrap gap-1.5">
                      {WORK_TYPES.map((w) => {
                        const on = workTypes.includes(w)
                        /* Capped at 3 of the 4 deliberately: selecting all four matches
                           exactly the same jobs as selecting none, so the redundant
                           "anything goes" answer is pushed to the control that already
                           states it — leaving them all off. */
                        const full = !on && workTypes.length >= 3
                        return (
                          <span
                            key={w}
                            onClick={() => !full && setWorkTypes((a) => (on ? a.filter((x) => x !== w) : [...a, w]))}
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-[11.5px]',
                              on
                                ? 'cursor-pointer border-brand bg-brand-soft text-brand'
                                : full
                                  ? 'cursor-not-allowed border-line text-faint'
                                  : 'cursor-pointer border-line text-ink/70',
                            )}
                          >{w}</span>
                        )
                      })}
                    </div>
                    <p className="mt-1 text-[10px] text-faint">{workTypes.length} of 3 selected · happy with any arrangement? Leave all off and we will not rule anything out.</p>
                  </div>
                </div>
                <Nav back={() => setStep(1)} next={() => setStep(3)} />
              </>
            )}
            {/* 3 · THE ASK — salary gets its own moment; buried in a list it goes
                   unanswered, and it is the filter employers use most.
                   Years of experience + highest education used to be a step here.
                   They are BASIC INFORMATION, so they moved to sign-up: this wizard
                   asks Work preference and nothing else. */}
            {step === 3 && (
              <>
                <p className="text-[15px] font-bold text-ink">What salary are you expecting?</p>
                <p className="mt-0.5 text-[11.5px] text-muted">One of the filters recruiters use most — and no CV ever states it.</p>
                {/* ONE figure, NOT a range: the employer states the band, and this
                    single number has to fall inside it (point-in-range). An earlier
                    draft here showed "20 – 30", which never matched the contract. */}
                <div className="mt-3">
                  <p className="mb-1 text-[11.5px] font-medium text-ink">Expected salary</p>
                  {/* The amount is always MONTHLY, so the unit sits inline instead of
                      being a control: one figure, one fixed period, nothing to choose. */}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted">Từ</span>
                    <div className="flex h-10 flex-1 items-center rounded-lg border border-line bg-canvas/30 px-3 text-[12px] text-faint">
                      20
                    </div>
                    <span className="whitespace-nowrap text-[12px] text-muted">triệu / tháng</span>
                  </div>
                </div>
                <p className="mt-2 text-[10.5px] text-faint">
                  Employers see it exactly as written — “Từ 20 triệu / tháng”. One number: nobody turns down more.
                </p>
                <Nav back={() => setStep(2)} next={() => setStep('results')} nextLabel="See my matches →" />
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

              {/* matched grid — 2 rows of 3. The score NEVER appears alone: each card
                  carries the two highest-CONTRIBUTING signals (weight × credit earned),
                  because a bare percentage invites the one question it cannot answer.
                  Below the 60 floor a card shows no number at all — see the match-score
                  requirement in Resume management. */}
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {([
                  ['Product Designer', 'Lantern Digital', 'Hồ Chí Minh', '92% match', '8/10 skills · 4 yrs fits 3–5'],
                  ['Senior UX Designer', 'Zenpay', 'Hồ Chí Minh', '88% match', '7/10 skills · salary fits'],
                  ['UI Designer', 'FPT Software', 'Hà Nội', '84% match', '7/10 skills · Design category'],
                  ['Design Lead', 'Tiki', 'Hồ Chí Minh', '80% match', '6/10 skills · 4 yrs fits 3–6'],
                  ['Product Designer (Fintech)', 'MoMo', 'Hồ Chí Minh', '78% match', '6/10 skills · IT / Software'],
                  ['UX Researcher', 'One Mount', 'Hà Nội', '75% match', '5/10 skills · Design category'],
                ] as [string, string, string, string, string][]).map(([title, co, loc, match, why]) => (
                  <div key={title} className="rounded-xl border border-line p-3 hover:border-brand/40">
                    <div className="mb-1.5 grid h-8 w-8 place-items-center rounded-md bg-canvas text-[12px]"></div>
                    <p className="text-[12px] font-semibold leading-snug text-ink">{title}</p>
                    <p className="text-[11px] text-ink/70">{co}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">{loc}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[9.5px] font-semibold text-brand">{match}</span>
                      <span className="cursor-pointer text-[12px] text-faint">☆</span>
                    </div>
                    <p className="mt-1 text-[9.5px] leading-snug text-faint">{why}</p>
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
                    <div className="mb-1.5 grid h-8 w-8 place-items-center rounded-md bg-canvas text-[12px]"></div>
                    <p className="text-[12px] font-semibold leading-snug text-ink">{title}</p>
                    <p className="text-[11px] text-ink/70">{co}</p>
                    <p className="mt-0.5 text-[10.5px] text-faint">{loc}</p>
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

/* ── DELETE ACCOUNT — ⛔ PROPOSAL, PARKED PENDING CLIENT CONFIRMATION ────────
 *
 * ⛔ NOT THE LIVE FLOW (parked 2026-08-23). The shipped behaviour is still the
 * one in Jobseeker user → Deactivate account. This screen exists so the client
 * has something concrete to say yes or no TO. If the answer is no, delete this
 * screen and the matching spec block; the reasoning lives in both.
 *
 * SHAPED ON SARAMIN KR (Figma 1648-2192): Settings → a Delete button → a
 * NOTICES dialog you must tick through → a REASON dialog whose content answers
 * the reason you picked → verify by email → confirm → done.
 *
 * TWO DELIBERATE DIFFERENCES FROM KR:
 *   · they verify with an OTP, we open a link — same proof, one less thing to type;
 *   · they ask the reason AFTER verification, we ask BEFORE. Asking first is what
 *     lets the offer be aimed at the stated reason, and it captures a reason even
 *     from the people who abandon — which KR never sees.
 *
 * NO PASSWORD STEP, matching KR: the inbox IS the identity check. The cost is
 * recorded on the requirement page rather than argued away here.
 */
type DelStage = 'settings' | 'notices' | 'reason' | 'email' | 'confirm' | 'done'
const DEL_STAGES: { id: DelStage; label: string }[] = [
  { id: 'settings', label: '1 · Settings' },
  { id: 'notices', label: '2 · Lưu ý' },
  { id: 'reason', label: '3 · Lý do' },
  { id: 'email', label: '4 · Email' },
  { id: 'confirm', label: '5 · Xác nhận' },
  { id: 'done', label: '6 · Xong' },
]

/* REASON → THE ANSWER TO THAT REASON. The KR flow does not plead; each reason
   gets a real fix with a link that performs it, and the two that have no honest
   fix get a free-text box instead of an invented argument. */
const DEL_REASONS: { key: string; say: string; does: string[]; note?: boolean }[] = [
  {
    key: 'Bảo vệ thông tin cá nhân',
    say: 'Nếu chuyển CV sang chế độ riêng tư, nhà tuyển dụng sẽ không liên hệ bạn nữa — mà hồ sơ vẫn còn để bạn dùng lại khi cần đổi việc.',
    does: ['Chuyển CV sang riêng tư'],
  },
  {
    key: 'Đã tìm được việc',
    say: 'Chúc mừng bạn! Chuyển CV sang riêng tư thì NTD sẽ ngừng liên hệ, nhưng nội dung hồ sơ vẫn giữ nguyên — lần sau đổi việc chỉ cần cập nhật, không phải nhập lại từ đầu.',
    does: ['Chuyển CV sang riêng tư'],
  },
  {
    key: 'Không hài lòng với dịch vụ',
    say: 'Bạn có thể cho chúng tôi biết điều gì chưa ổn — phản hồi này được đọc và là thứ giúp dịch vụ tốt lên.',
    does: [],
    note: true,
  },
  {
    key: 'Dùng dịch vụ khác',
    say: 'Nếu bạn để lại lý do cụ thể, chúng tôi sẽ cố gắng cải thiện dịch vụ.',
    does: [],
    note: true,
  },
]

function DeleteAccountScreen() {
  const go = useNav()
  const [stage, setStage] = useState<DelStage>('settings')
  const [agreed, setAgreed] = useState(false)
  const [reason, setReason] = useState('')
  /* WHAT THE LINK LANDS ON. A confirm-by-link flow is judged on its failure
     states, not its happy one — three of these four are what a real user meets
     when the mail sat unread overnight, was clicked twice, or was opened on a
     laptop signed in as someone else. */
  const [link, setLink] = useState<'valid' | 'expired' | 'used' | 'other'>('valid')
  const email = 'minhanh@email.com'
  const picked = DEL_REASONS.find((r) => r.key === reason)

  const Sheet = ({ title, sub, children, foot }: { title: string; sub?: string; children: React.ReactNode; foot: React.ReactNode }) => (
    <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/35 px-4 py-6">
      <div className="my-2 w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="border-b border-line px-5 py-3.5">
          <p className="text-[14px] font-bold text-ink">{title}</p>
          {sub && <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{sub}</p>}
        </div>
        <div className="max-h-[420px] space-y-3 overflow-y-auto scroll-thin px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{foot}</div>
      </div>
    </div>
  )
  const Notice = ({ h, lines }: { h: string; lines: string[] }) => (
    <div>
      <p className="text-[11.5px] font-bold text-ink">{h}</p>
      <ul className="mt-1 space-y-1">
        {lines.map((l) => (
          <li key={l} className="flex gap-1.5 text-[11px] leading-relaxed text-muted"><span className="text-faint">·</span><span className="min-w-0">{l}</span></li>
        ))}
      </ul>
    </div>
  )
  const Ghost = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick} className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">{children}</button>
  )

  return (
    <div className="relative">
      <JsHeader active="CV & Profile" />
      <div className="grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-4 p-5">
        <MyPageRail active="js-settings" />

        <div className="min-w-0 space-y-3">
          {/* ⛔ on the screen, not only in a comment — a wireframe gets screenshotted
              into chats, and a proposal that travels without its status is read as
              a decision. */}
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
            <b className="font-semibold">⛔ Đề xuất — chưa chốt.</b> Luồng xoá tài khoản hiện tại <b className="font-semibold">chưa thay đổi</b>. Màn này để trao đổi và chờ khách hàng xác nhận.
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEL_STAGES.map((st) => (
              <button key={st.id} onClick={() => setStage(st.id)}
                className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', stage === st.id ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}
              >{st.label}</button>
            ))}
          </div>

          {/* ── SETTINGS — the entry point. Delete sits in a DANGER ZONE at the
               bottom, under the ordinary settings, never in the nav rail: a
               destructive action does not belong one stray click from “My CVs”. ── */}
          <div className="rounded-xl border border-line bg-surface">
            <p className="border-b border-line px-4 py-3 text-[15px] font-bold text-ink">Cài đặt</p>
            <div className="divide-y divide-line-soft">
              {[
                ['Thông báo việc làm', 'Email và thông báo đẩy khi có việc phù hợp', 'Bật'],
                ['Cho NTD tìm thấy CV', 'Hồ sơ hiển thị trong tìm kiếm của nhà tuyển dụng', 'Bật'],
                ['Đổi mật khẩu', 'Cập nhật lần cuối 12/06/2026', ''],
              ].map(([t, d, v]) => (
                <div key={t} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-ink">{t}</p>
                    <p className="text-[11px] text-muted">{d}</p>
                  </div>
                  <span className="shrink-0 text-[11.5px] font-medium text-brand">{v || 'Sửa'}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-rose-200 bg-rose-50/40 px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-rose-700">Xoá tài khoản</p>
                  <p className="text-[11px] leading-relaxed text-muted">Xoá vĩnh viễn hồ sơ, CV và lịch sử ứng tuyển. Không khôi phục được.</p>
                </div>
                <button onClick={() => { setAgreed(false); setStage('notices') }}
                  className="shrink-0 rounded-lg border border-rose-300 bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-rose-600 hover:bg-rose-50">
                  Xoá tài khoản
                </button>
              </div>
            </div>
          </div>

          {stage === 'email' && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[15px] font-bold text-ink">Kiểm tra hộp thư của bạn</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                Đã gửi email xác nhận tới <b className="font-semibold text-ink">{email}</b>. Mở email và bấm nút trong đó để hoàn tất.
              </p>
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
                Liên kết có hiệu lực <b className="font-semibold">24 giờ</b> và chỉ dùng được một lần. Hết hạn thì yêu cầu tự huỷ, tài khoản giữ nguyên.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="cursor-pointer text-[11.5px] font-medium text-brand">Gửi lại email</span>
                <span className="text-[11px] text-faint">có thể gửi lại sau 60 giây</span>
                <span className="text-[11px] text-faint">· Không thấy? Kiểm tra Spam / Quảng cáo</span>
              </div>

              {/* The email drawn, because the copy is the deliverable. Functional
                  only — the persuasion already happened at the reason step, where
                  it could be aimed, and this message doubles as the alarm for
                  “someone is deleting your account”. */}
              <div className="mt-3 overflow-hidden rounded-xl border border-line">
                <div className="border-b border-line bg-canvas/50 px-4 py-2.5 text-[11px] leading-relaxed">
                  <p className="text-[12.5px] font-bold text-ink">[Saramin] Xác nhận yêu cầu xoá tài khoản</p>
                  <p className="mt-0.5 text-muted">Saramin &lt;no-reply@<b className="font-semibold text-ink/75">saramin.vn</b>&gt; · tới {email}</p>
                </div>
                <div className="space-y-2.5 px-4 py-3.5 text-[11.5px] leading-relaxed text-ink/85">
                  <p>Chào bạn <b className="font-semibold text-ink">Trần Minh Anh</b>,</p>
                  <p>Chúng tôi nhận được yêu cầu xoá tài khoản Saramin của bạn. <b className="font-semibold text-ink">Chưa có gì bị xoá.</b></p>
                  <p>Bấm nút dưới để xác nhận. Sau khi hoàn tất, hồ sơ và toàn bộ CV bị xoá vĩnh viễn. Các đơn đã gửi vẫn nằm ở phía nhà tuyển dụng, kèm nhãn cho biết tài khoản không còn tồn tại.</p>
                  <div className="pt-1"><span className="inline-block cursor-pointer rounded-lg bg-rose-600 px-3.5 py-2 text-[12px] font-semibold text-white">Xác nhận xoá tài khoản</span></div>
                  <p className="text-[11px] text-muted">Liên kết hết hạn sau 24 giờ. Nút này mở một trang xác nhận — không xoá ngay khi bấm.</p>
                  <p className="rounded-md border border-line bg-canvas/50 px-2.5 py-2 text-[11px] text-muted">
                    <b className="font-semibold text-ink/75">Bạn không yêu cầu việc này?</b> Tài khoản vẫn an toàn — bỏ qua email này và <span className="cursor-pointer font-medium text-brand">đổi mật khẩu</span> ngay.
                  </p>
                </div>
              </div>
            </div>
          )}

          {stage === 'confirm' && (
            <div className="space-y-3">
              {/* Four states on one switcher: the page a link lands on is judged on
                  the three that are NOT the happy path. */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-faint">Trạng thái liên kết</span>
                {([['valid', 'Hợp lệ'], ['expired', 'Hết hạn'], ['used', 'Đã dùng'], ['other', 'Sai tài khoản']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setLink(k)}
                    className={cn('rounded-full border px-2.5 py-1 text-[11px]', link === k ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}
                  >{l}</button>
                ))}
              </div>

              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-[11px] font-medium text-faint">saramin.vn/account/delete/confirm — mở từ nút trong email</p>

                {link === 'valid' && (<>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">Xác nhận lần cuối</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    Bạn đang đăng nhập bằng <b className="font-semibold text-ink">{email}</b> — đúng tài khoản của liên kết này.
                  </p>
                  {/* THE LOSS, RESTATED IN NUMBERS. The same counters as the notices
                      dialog, because this is the last moment and a figure lands
                      where a paragraph does not. */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[['CV', '1'], ['Đơn ứng tuyển', '3'], ['Việc đã lưu', '5']].map(([k, v]) => (
                      <div key={k} className="rounded-md border border-rose-200 bg-rose-50/50 px-2.5 py-2">
                        <p className="text-[10.5px] text-rose-700/70">{k}</p>
                        <p className="text-[15px] font-bold tabular-nums text-rose-700">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">Tất cả sẽ bị xoá vĩnh viễn. Các đơn đã gửi vẫn ở phía NTD, kèm nhãn “Tài khoản này không còn tồn tại”.</p>
                  {/* ★ THE LINK MUST NOT DELETE ON CLICK — Outlook Safe Links, mail
                      gateways and antivirus scanners FOLLOW links to inspect them,
                      so a GET that destroys an account can fire before the human
                      opens the message. Deletion happens on the POST from this
                      button, which is also why this page exists at all. */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setStage('done')} className="rounded-lg bg-rose-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Xoá tài khoản vĩnh viễn</button>
                    <Ghost onClick={() => setStage('settings')}>Tôi đổi ý, giữ tài khoản</Ghost>
                  </div>
                </>)}

                {/* EXPIRED — and the headline says the ACCOUNT IS FINE first. Someone
                    reading this is anxious; “hết hạn” alone reads as “something went
                    wrong with my deletion”, which is the opposite of reassuring. */}
                {link === 'expired' && (<>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">Liên kết đã hết hạn — tài khoản của bạn vẫn nguyên vẹn</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    Liên kết xác nhận chỉ có hiệu lực 24 giờ. Yêu cầu xoá đã tự huỷ và <b className="font-semibold text-ink">không có gì bị xoá</b>.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => { setStage('settings'); setAgreed(false); setReason('') }} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Bắt đầu lại</button>
                    <Ghost onClick={() => go('js-mypage')}>Về My page</Ghost>
                  </div>
                </>)}

                {/* ALREADY USED — the one state that must never look like a failure:
                    the person got what they asked for. A bare 404 here reads as “it
                    did not work”, and produces a second deletion attempt. */}
                {link === 'used' && (<>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">Liên kết này đã được sử dụng</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    Tài khoản <b className="font-semibold text-ink">{email}</b> đã được xoá lúc <b className="font-semibold text-ink">14:32 · 23/08/2026</b>. Mỗi liên kết chỉ dùng được một lần.
                  </p>
                  <div className="mt-3"><Ghost onClick={() => go('js-home')}>Về trang chủ</Ghost></div>
                </>)}

                {/* WRONG ACCOUNT — the case KR warns about in its email (“hãy đăng
                    nhập đúng tài khoản”). The link is NOT a bearer token: it only
                    works in a session belonging to the account it was issued for, so
                    a forwarded email cannot delete anyone. */}
                {link === 'other' && (<>
                  <p className="mt-0.5 text-[15px] font-bold text-ink">Liên kết này không thuộc tài khoản đang đăng nhập</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    Bạn đang đăng nhập bằng <b className="font-semibold text-ink">huy.tran@email.com</b>, còn liên kết được gửi cho <b className="font-semibold text-ink">{email}</b>. Chúng tôi không xoá tài khoản nào cả.
                  </p>
                  <p className="mt-2 rounded-md border border-line bg-canvas/50 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                    Liên kết chỉ có tác dụng trong phiên đăng nhập của đúng tài khoản đó — nên một email bị chuyển tiếp <b className="text-ink/75">không thể xoá tài khoản của ai</b>.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Đăng xuất &amp; đăng nhập lại</button>
                    <Ghost onClick={() => go('js-mypage')}>Huỷ</Ghost>
                  </div>
                </>)}
              </div>
            </div>
          )}

          {stage === 'done' && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[15px] font-bold text-ink">Tài khoản đã được xoá</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">Bạn đã được đăng xuất khỏi mọi thiết bị. Một email xác nhận cuối cùng đã gửi tới {email}.</p>
              <p className="mt-2 text-[11px] leading-relaxed text-faint">Dữ liệu cá nhân được xoá theo quy định lưu trữ bắt buộc. Các đơn đã gửi vẫn ở phía nhà tuyển dụng, kèm nhãn cho biết tài khoản không còn tồn tại.</p>
              <div className="mt-3"><Btn primary onClick={() => go('js-home')}>Về trang chủ</Btn></div>
            </div>
          )}
        </div>
      </div>

      {/* ── POPUP 1 · NOTICES — KR's “check the instructions” screen. The record
           summary at the top is the part worth copying: “1 CV · 3 đơn · 5 việc đã
           lưu” makes the loss concrete in a way a paragraph never does. ── */}
      {stage === 'notices' && (
        <Sheet
          title="Vui lòng đọc kỹ trước khi xoá tài khoản"
          foot={<>
            <Ghost onClick={() => setStage('settings')}>Huỷ</Ghost>
            <button disabled={!agreed} onClick={() => setStage('reason')}
              className={cn('rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white', agreed ? 'bg-brand hover:opacity-90' : 'cursor-not-allowed bg-line')}
            >Tiếp tục</button>
          </>}
        >
          <div className="rounded-lg border border-line bg-canvas/40 px-3.5 py-3">
            <p className="text-[11.5px] text-muted"><b className="font-semibold text-brand">Trần Minh Anh</b> — dữ liệu bạn đang có</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[['CV', '1'], ['Đơn ứng tuyển', '3'], ['Việc đã lưu', '5']].map(([k, v]) => (
                <div key={k} className="rounded-md border border-line bg-surface px-2.5 py-2">
                  <p className="text-[10.5px] text-faint">{k}</p>
                  <p className="text-[15px] font-bold tabular-nums text-ink">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <Notice h="Tài khoản đã xoá không khôi phục được" lines={[
            'ID và toàn bộ dữ liệu không thể lấy lại sau khi xoá. Hãy cân nhắc kỹ.',
          ]} />
          <Notice h="Về việc xoá dữ liệu sử dụng dịch vụ" lines={[
            'Toàn bộ CV, trạng thái ứng tuyển và lời mời từ NTD sẽ bị xoá và không khôi phục được. Hãy lưu lại những gì bạn cần trước.',
            'Các đơn đã gửi VẪN nằm ở phía nhà tuyển dụng, kèm nhãn “Tài khoản này không còn tồn tại” — họ đã nhận hồ sơ rồi, và CV họ đã mở khoá thì đã trả phí.',
            'Nếu bạn có giao dịch cần hoàn tiền, vui lòng liên hệ trước khi xoá tài khoản.',
          ]} />
          <Notice h="Nội dung đã đăng không xoá được" lines={[
            'Đánh giá công ty và nội dung bạn đã đăng công khai sẽ được lưu theo thời hạn quy định rồi mới xoá.',
            'Hãy tự xoá những nội dung bạn muốn gỡ TRƯỚC khi xoá tài khoản.',
          ]} />
          <Notice h="Trường hợp chưa xoá được" lines={[
            'Không xoá được khi đang có giao dịch chưa hoàn tất.',
          ]} />

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2.5">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-[3px] h-3.5 w-3.5 shrink-0 accent-[var(--color-brand)]" />
            <span className="text-[11.5px] leading-relaxed text-ink/85">Tôi đã đọc và đồng ý với toàn bộ lưu ý trên.</span>
          </label>
        </Sheet>
      )}

      {/* ── POPUP 2 · REASON — a dropdown, and the panel under it answers the
           reason picked. Required, but “Dùng dịch vụ khác” and “Không hài lòng”
           take free text instead of an invented counter-argument. ── */}
      {stage === 'reason' && (
        <Sheet
          title="Vì sao bạn muốn xoá tài khoản Saramin?"
          sub="Cho chúng tôi biết lý do, dịch vụ sẽ tốt hơn cho những người sau."
          foot={<>
            <Ghost onClick={() => setStage('settings')}>Huỷ</Ghost>
            <button disabled={!reason} onClick={() => setStage('email')}
              className={cn('rounded-lg px-3.5 py-2 text-[12.5px] font-semibold text-white', reason ? 'bg-rose-600 hover:opacity-90' : 'cursor-not-allowed bg-line')}
            >Xác nhận xoá</button>
          </>}
        >
          <div className="flex items-start gap-3">
            <p className="mt-2 w-[92px] shrink-0 text-[11.5px] font-semibold text-ink">Lý do xoá tài khoản</p>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none focus:border-brand">
              <option value="">Vui lòng chọn</option>
              {DEL_REASONS.map((r) => <option key={r.key}>{r.key}</option>)}
            </select>
          </div>

          {picked && (
            <div className="border-t border-line pt-3">
              <p className="text-[11.5px] leading-relaxed text-ink/85">{picked.say}</p>
              {picked.does.map((d) => (
                <p key={d} className="mt-2 cursor-pointer text-[11.5px] font-semibold text-brand underline decoration-brand/40 underline-offset-2">{d} ›</p>
              ))}
              {picked.note && (
                <div className="mt-2 min-h-[64px] rounded-md border border-line bg-canvas/40 px-3 py-2 text-[11.5px] italic text-faint">
                  Nhập lý do cụ thể (không bắt buộc)…
                </div>
              )}
            </div>
          )}
        </Sheet>
      )}
    </div>
  )
}

/* ── My applications — the jobseeker's view of every application: where it is
   in the pipeline (incl. the HQ screening step — sold as a feature, shown
   honestly), which CV was sent, and what happened when. List + detail. */
function MyApplicationsScreen() {
  const [sel, setSel] = useState<number | null>(null)
  /* THREE application statuses underneath these rows — Sent · Not sent · Recall —
     all derived from the applied-with CV, and each surfaces here as a label:

       Sent      → 'Đã gửi' (and then the employer's own stages: Interview, Offer…)
       Not sent  → 'Đã nộp'            while the CV is in DOUBT. The plain
                                       submitted state, indistinguishable from any
                                       ordinary application in progress — see below
                   'Không được gửi'    once the CV was Rejected before delivery
       Recall    → 'Đã thu hồi'        the CV was Sent, then an admin rejected it —
                                       Saramin pulled it back from the employer

     A HELD APPLICATION LOOKS ORDINARY (decided 2026-08-20, client feedback). The
     hold exists because WE are unsure about our own parse of their file; flagging
     it here would tell the candidate their CV is defective before any human has
     confirmed it, and would leak a review we deliberately keep backstage. So the
     row reads 'Đã nộp' in neutral blue — true (they did submit), unremarkable,
     and one step short of 'Đã gửi'. When the CV clears it turns 'Đã gửi'
     silently; only a REJECTION is ever spoken about.

     TONES: everything undecided is blue/neutral; both rejection outcomes are ROSE (a verdict — act, don't wait). Muted would file them with 'Not
     selected', which is the one thing they must not read as: the employer never
     turned these candidates down, WE stopped the CV, and the fix is theirs. */
  const APPS = [
    { job: 'Senior Frontend Engineer', co: 'FPT Software', applied: '02/08/2026', cv: 'CV_TranMinhAnh.pdf', status: 'Interview', tone: 'amber' as const, note: 'Interview scheduled — 08/08, 10:00' },
    { job: 'Product Designer', co: 'Lantern Digital', applied: '30/07/2026', cv: 'My Saramin CV', status: 'Đã gửi', tone: 'blue' as const, note: 'Đã gửi tới nhà tuyển dụng' },
    { job: 'UI Designer', co: 'Zenpay', applied: '28/07/2026', cv: 'productdesign.pdf', status: 'Đã nộp', tone: 'blue' as const, note: 'Đơn của bạn đã được nộp' },
    { job: 'UX Researcher', co: 'Tiki', applied: '20/07/2026', cv: 'CV_TranMinhAnh.pdf', status: 'Offer', tone: 'green' as const, note: 'Offer received' },
    /* The applied-with CV was Rejected by review — the application was never
       delivered, and the candidate is told WHY and what to do, never left
       assuming the employer ignored them. */
    { job: 'Visual Designer', co: 'Base.vn', applied: '18/07/2026', cv: 'old_scan.pdf', status: 'Không được gửi', tone: 'rose' as const, note: 'File này không phải một CV — tải lên CV khác rồi ứng tuyển lại', reason: 'Not a CV' },
    /* The third reject reason, so the list demonstrates all three fixes: this one
       is the only rejection the candidate clears WITHOUT re-uploading anything. */
    { job: 'Brand Designer', co: 'Highlands', applied: '17/07/2026', cv: 'cv-ban-nhap.pdf', status: 'Không được gửi', tone: 'rose' as const, note: 'Hồ sơ chưa đủ thông tin — cập nhật hồ sơ rồi ứng tuyển lại', reason: 'CV but not enough information' },
    /* SENT, then RECALLED — the CV qualified, reached the employer, and was later
       rejected on review. The candidate must be told it was WITHDRAWN BY US rather
       than turned down by the employer: "Not selected" here would be a lie that
       costs them the chance to fix the real problem. */
    { job: 'Motion Designer', co: 'Momo', applied: '15/07/2026', cv: 'old_scan.pdf', status: 'Đã thu hồi', tone: 'rose' as const, note: 'Saramin đã thu hồi CV này — hệ thống không đọc được nội dung file', reason: 'Can’t read' },
    { job: 'Design Lead', co: 'MWG', applied: '12/07/2026', cv: 'My Saramin CV', status: 'Not selected', tone: 'muted' as const, note: 'Closed by employer' },
  ]
  /* Two shapes, and the difference is the point: a normal application has NO
     Saramin step at all, while one waiting on its CV shows exactly what it is
     waiting for and that it leaves anyway. */
  const timelineFor = (app: (typeof APPS)[number]): [string, string, boolean][] =>
    app.status === 'Không được gửi'
      ? [
          ['Đã gửi đơn', `Bạn ứng tuyển bằng ${app.cv}`, true],
          /* The REASON, in the candidate's words, is the whole value of this step:
             "không đạt" alone sends them guessing, and the three reasons have three
             different fixes. */
          ['Kiểm tra CV — không đạt', 'File này không phải một CV (giấy tờ, bảng giá, ảnh không liên quan)', true],
          ['Không gửi tới nhà tuyển dụng', 'Tải lên CV khác hoặc tạo Saramin CV, rồi ứng tuyển lại', false],
        ]
      : app.status === 'Đã thu hồi'
      ? [
          ['Đã gửi đơn', `Bạn ứng tuyển bằng ${app.cv}`, true],
          ['Đã gửi tới nhà tuyển dụng', `Đơn của bạn đã tới ${app.co}`, true],
          /* Names SARAMIN as the actor. The candidate must not read this as the
             employer turning them down — that would send them off fixing the
             wrong thing, and it would be untrue. */
          ['Saramin thu hồi CV', 'Hệ thống không đọc được nội dung trong file này', true],
          ['Cần làm gì', 'Tải lên bản PDF dạng văn bản, rồi ứng tuyển lại', false],
        ]
      : app.status === 'Đã nộp'
      ? [
          ['Đã gửi đơn', `Bạn ứng tuyển bằng ${app.cv}`, true],
          /* An ordinary pending step — no reason, no CV blame, no review. The
             hold is OUR uncertainty about OUR parse; the candidate is not told
             their CV is defective before a human has agreed it is. When the CV
             clears, this step simply completes. */
          ['Gửi tới nhà tuyển dụng', 'Đang xử lý', false],
          ['Kết quả', 'Đang chờ', false],
        ]
      : [
          ['Submitted', `You applied with ${app.cv}`, true],
          ['Sent to employer', `Your application reached ${app.co}`, true],
          ['Viewed by employer', `${app.co} opened your CV`, true],
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
              {['All (8)', 'In progress (3)', 'Offer (1)', 'Closed (4)'].map((f, i) => (
                <span key={f} className={cn('cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium', i === 0 ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted')}>{f}</span>
              ))}
            </div>
          </div>

          {APPS.map((app, i) => (
            <div key={app.job} onClick={() => setSel(i)} className="cursor-pointer rounded-xl border border-line bg-surface p-4 hover:border-brand/40">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-canvas text-[14px]"></span>
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
          <p className="text-[11px] text-faint">Đơn ứng tuyển được gửi tới nhà tuyển dụng ngay sau khi bạn nộp.</p>
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
                <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-md bg-rose-50 text-[13px]"></span><div><p className="text-[12px] font-semibold text-ink">{a.cv}</p><p className="text-[10.5px] text-faint">The exact snapshot sent — later edits don’t change it</p></div></div>
                <span className="cursor-pointer text-[11px] font-medium text-brand">View</span>
              </div>
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Progress</p>
                <div className="space-y-0">
                  {timelineFor(a).map(([t, d, done], i) => (
                    <div key={t} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px]', done ? 'bg-emerald-500 text-white' : 'border-2 border-line bg-surface')}>{done ? '✓' : ''}</span>
                        {i < timelineFor(a).length - 1 && <span className={cn('w-px flex-1', done ? 'bg-emerald-300' : 'bg-line')} style={{ minHeight: 18 }} />}
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
/* ── Social sign-up completion ────────────────────────────────────────────────
   The step that finishes a social sign-up. It exists because a provider gives us
   a verified EMAIL and nothing else that matters:
     · the NAME it returns is a display name — often a nickname, or wrongly cased
     · it never returns a PHONE — the field VN recruiters actually call
     · it cannot ACCEPT OUR TERMS on the candidate's behalf
   The last one alone makes this step mandatory, which is why asking for the phone
   here is nearly free: we are stopping the candidate anyway. Modelled on the
   Saramin KR completion screen (agree-to-all + itemised required/optional). */
/* The red asterisk, so "required" reads the same everywhere it appears. */
const Req = () => <span className="text-rose-500"> *</span>

/* The rest of Basic information, shared by both sign-up paths (email and social)
   so the two can never drift. All of it is REQUIRED — the client wants a complete
   profile at sign-up rather than a partial one topped up later.

   Nationality is a two-option list, not a country list: the only thing the platform
   does with it is decide whether to ask about a work permit, so a 200-country
   dropdown would make the candidate do that mapping instead.
   `bg` matches the surrounding form's field background. */
function PersonalDetails({ bg = 'bg-surface' }: { bg?: string }) {
  const [natOpen, setNatOpen] = useState(false)
  const [nat, setNat] = useState('Người Việt Nam')
  return (
    <div>
      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Personal details</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <p className="mb-1 text-[11px] font-medium text-ink/80">Nationality<Req /></p>
          <button
            onClick={() => setNatOpen((o) => !o)}
            className={cn('flex h-9 w-full items-center justify-between rounded-md border px-2.5 text-[11.5px] text-ink/80', bg, natOpen ? 'border-brand' : 'border-line')}
          >
            {nat}
            <span className="text-faint">{natOpen ? '▴' : '▾'}</span>
          </button>
          {natOpen && (
            <div className="mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-sm">
              {['Người Việt Nam', 'Người nước ngoài'].map((o) => (
                <button
                  key={o}
                  onClick={() => { setNat(o); setNatOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-2 border-b border-line-soft px-2.5 py-2 text-left text-[11.5px] last:border-b-0',
                    o === nat ? 'bg-brand-soft/50 font-medium text-brand' : 'text-ink/80 hover:bg-canvas/60',
                  )}
                >
                  <span className={cn('grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border text-[9px] font-bold', o === nat ? 'border-brand bg-brand text-white' : 'border-line text-transparent')}>✓</span>
                  {o}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-[10px] text-faint">Chọn “Người nước ngoài” sẽ hỏi thêm về giấy phép lao động.</p>
        </div>
        {([['Date of birth', 'DD/MM/YYYY'], ['Gender', 'Select…'], ['Marital status', 'Select…']] as [string, string][]).map(([label, ph]) => (
          <div key={label}>
            <p className="mb-1 text-[11px] font-medium text-ink/80">{label}<Req /></p>
            <div className={cn('flex h-9 items-center justify-between rounded-md border border-line px-2.5 text-[11.5px] text-faint', bg)}>{ph}<span className="text-faint">▾</span></div>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-faint">Shown on your CV. Employers can never search or filter by these.</p>

      {/* The last two Basic-information fields. They sit at SIGN-UP, not in
          onboarding: sign-up collects Basic information, onboarding asks Work
          preference. Kept as their own group because — unlike the four above —
          employers DO filter on both, so they cannot carry the same footnote. */}
      <p className="mb-1.5 mt-4 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Background</p>
      <div className="grid grid-cols-2 gap-2">
        {([['Highest education', 'Select…'], ['Years of work experience', 'Select…']] as [string, string][]).map(([label, ph]) => (
          <div key={label}>
            <p className="mb-1 text-[11px] font-medium text-ink/80">{label}<Req /></p>
            <div className={cn('flex h-9 items-center justify-between rounded-md border border-line px-2.5 text-[11.5px] text-faint', bg)}>{ph}<span className="text-faint">▾</span></div>
          </div>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-faint">Just the totals — recruiters filter on both. Your work history and school go on your CV.</p>
    </div>
  )
}

/* The step that FINISHES a social sign-up. Reached from SignUpScreen in the
   gallery, and registered on its own (js-signup-social) so the requirement page can
   show it beside the entry screen — it is where a social candidate enters every
   field the provider could not give us, which is the point reviewers must see.
   `onBack` is optional: there is nothing to go back to when it stands alone. */
function SocialCompleteScreen({ provider, onBack }: { provider: 'Google' | 'Facebook'; onBack?: () => void }) {
  const go = useNav()
  /* One consent line — the same control the email Create-account form uses. */
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="min-h-[560px] bg-canvas/40">
      {/* The real header, not a look-alike: same bar on every jobseeker screen and
          the brand mark always goes home. `minimal` drops the account / auth
          actions, which make no sense while someone is signing up. */}
      <JsHeader minimal />
      <div className="grid place-items-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <p className="text-center text-[17px] font-bold text-ink">Almost there — confirm your details</p>
          <p className="mx-auto mt-1 max-w-sm text-center text-[12px] text-muted">
            We got your email from {provider}. Check your name, add a phone number, and accept our terms.
          </p>

          <div className="mt-5 rounded-2xl border border-line bg-surface p-5 shadow-sm">
            {/* email — from the provider, locked: it is the identity key */}
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink">Email</p>
              <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-line bg-canvas/60 px-3 text-[12px] text-muted">
                <span className="truncate">minhanh@gmail.com</span>
                <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[9px] font-medium text-faint">{provider}</span>
              </div>
            </div>

            {/* name — EDITABLE: a provider display name is often not the real one */}
            <div className="mt-3">
              <p className="mb-1 text-[11.5px] font-medium text-ink">Full name <span className="text-rose-500">*</span></p>
              <div className="flex h-9 items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-[12px] text-ink/80">
                <span>Trần Minh Anh</span>
                <span className="shrink-0 text-[10px] text-faint">✎</span>
              </div>
              <p className="mt-0.5 text-[10px] text-faint">From {provider} — edit it if it isn’t how you want employers to address you.</p>
            </div>

            {/* phone — never supplied by any provider */}
            <div className="mt-3">
              <p className="mb-1 text-[11.5px] font-medium text-ink">Mobile phone <span className="text-rose-500">*</span></p>
              <div className="flex items-center gap-1.5">
                <span className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink/80">+84 <span className="text-faint">▾</span></span>
                <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-brand/50 bg-surface px-3 text-[12px] text-faint">Enter your phone number</div>
              </div>
              <label className="mt-1.5 flex items-center gap-2 text-[10.5px] text-muted"><span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />I live abroad — I don’t have a Vietnamese number</label>
            </div>

            <div className="mt-4"><PersonalDetails /></div>

            {/* consent — the same single line as the email Create-account form */}
            <label onClick={() => setAgreed((v) => !v)} className="mt-4 flex cursor-pointer items-start gap-2 text-[10.5px] leading-relaxed text-muted">
              <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-sm border text-[9px] font-bold', agreed ? 'border-brand bg-brand text-white' : 'border-line text-transparent')}>✓</span>
              I agree to Saramin’s Terms &amp; Privacy Policy.
            </label>

            <button onClick={() => go('js-onboarding')} className="mt-4 w-full rounded-lg bg-brand py-2.5 text-[13px] font-semibold text-white">Create account</button>
          </div>

          {onBack && (
            <p onClick={onBack} className="mt-3 cursor-pointer text-center text-[11.5px] text-muted hover:text-brand">← Use a different method</p>
          )}
        </div>
      </div>
    </div>
  )
}

/** The completion step on its own, for the requirement page and the gallery. */
function SignUpSocialScreen() {
  return <SocialCompleteScreen provider="Google" />
}

function SignUpScreen() {
  const go = useNav()
  /* A provider verifies an EMAIL. It cannot accept our terms and it never returns
     a phone number — so a social sign-up is not finished at the OAuth callback.
     It lands on a completion step: confirm name, add phone, accept the terms. */
  const [social, setSocial] = useState<null | 'Google' | 'Facebook'>(null)
  if (social) return <SocialCompleteScreen provider={social} onBack={() => setSocial(null)} />
  return (
    <div className="min-h-[560px] bg-canvas/40">
      {/* The real header, not a look-alike: same bar on every jobseeker screen and
          the brand mark always goes home. `minimal` drops the account / auth
          actions, which make no sense while someone is signing up. */}
      <JsHeader minimal />
      <div className="grid place-items-center px-4 py-8">
        <div className="w-full max-w-[380px] rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-center text-[16px] font-bold text-ink">Create your account</p>
          <p className="mx-auto mt-1 max-w-xs text-center text-[12px] text-muted">One account to apply, save jobs and be found by recruiters.</p>

          {/* social — verified email, but still needs the completion step */}
          <div className="mt-4 space-y-2">
            {([['', 'Google'], ['', 'Facebook']] as ['' | '', 'Google' | 'Facebook'][]).map(([ic, name]) => (
              <button key={name} onClick={() => setSocial(name)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-2.5 text-[12.5px] font-medium text-ink hover:border-brand/50"><span>{ic}</span>Continue with {name}</button>
            ))}
          </div>
          <div className="my-3 flex items-center gap-2 text-[11px] text-faint"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>

          {/* email — every field on this form is REQUIRED, including the personal
              details below. The asterisk is on every label rather than a "all fields
              required" note, so the rule is readable field-by-field while scrolling. */}
          <div className="space-y-2.5">
            <div><p className="mb-1 text-[11.5px] font-medium text-ink">Full name<Req /></p><div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">One field — no first / last split</div></div>
            <div><p className="mb-1 text-[11.5px] font-medium text-ink">Email<Req /></p><div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">you@email.com</div></div>
            <div>
              <p className="mb-1 text-[11.5px] font-medium text-ink">Password<Req /></p>
              <div className="flex h-9 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">••••••••</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {['12+ chars', '1 number', '1 symbol', '1 uppercase'].map((r) => <span key={r} className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-muted"><span className="text-emerald-500">✓</span>{r}</span>)}
              </div>
            </div>
            <div><p className="mb-1 text-[11.5px] font-medium text-ink">Phone<Req /></p><div className="flex items-center gap-1.5"><span className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink/80">+84 <span className="text-faint">▾</span></span><div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-line bg-canvas/30 px-3 text-[12px] text-faint">Enter your phone number</div></div></div>

            <PersonalDetails bg="bg-canvas/30" />

            <label className="flex items-start gap-2 text-[10.5px] leading-relaxed text-muted"><span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm border border-line" />I agree to Saramin’s Terms &amp; Privacy Policy.</label>
          </div>

          <button onClick={() => go('js-onboarding')} className="mt-4 w-full rounded-lg bg-brand py-2.5 text-[13px] font-semibold text-white">Create account</button>
          <p className="mt-3 text-center text-[11.5px] text-muted">Already have an account? <span className="cursor-pointer font-medium text-brand">Sign in</span></p>
        </div>
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
  { id: 'js-cv-detail', site: 'Jobseeker', title: 'CV detail', url: 'saramin.vn/my-page/cvs/ux-designer-cv', Comp: CvDetailScreen },
  { id: 'js-cv-template', site: 'Jobseeker', title: 'Saramin CV template', url: 'saramin.vn/my-page/cvs/template', Comp: CvTemplateScreen },
  { id: 'js-add-cv', site: 'Jobseeker', title: 'Add a new CV', url: 'saramin.vn/cv/new', Comp: AddCvScreen },
  { id: 'js-cv-compare', site: 'Jobseeker', title: 'CV compare (after upload)', url: 'saramin.vn/cv/review', Comp: CvCompareScreen },
  { id: 'js-profile-cv', site: 'Jobseeker', title: 'My Profile', url: 'saramin.vn/my-page/profile', Comp: ProfileCvScreen },
  { id: 'js-create-cv', site: 'Jobseeker', title: 'Create CV', url: 'saramin.vn/cv/create', Comp: CreateCvScreen },
  { id: 'js-applications', site: 'Jobseeker', title: 'My applications', url: 'saramin.vn/my-page/applications', Comp: MyApplicationsScreen },
  { id: 'js-settings', site: 'Jobseeker', title: 'Settings + delete account — ⛔ proposal', url: 'saramin.vn/my-page/settings', Comp: DeleteAccountScreen },
  { id: 'js-signup', site: 'Jobseeker', title: 'Sign up', url: 'saramin.vn/signup', Comp: SignUpScreen },
  { id: 'js-signup-social', site: 'Jobseeker', title: 'Sign up — social login completion', url: 'saramin.vn/signup/complete', Comp: SignUpSocialScreen },
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
  /* A shared link opens the screen it names. This does NOT reintroduce the flow
     index the comment above rules out — there is still no list to browse, only
     the screen someone deliberately pointed a colleague at. */
  const [active, setActive] = useState(() => {
    const wanted = initialScreenParam()
    return wanted && byId.has(wanted) ? wanted : 'js-home'
  })
  const current = byId.get(active) ?? SCREENS[0]
  const Comp = current.Comp
  useScreenParam(current.id)
  return (
    <div className="min-w-0">
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
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Draft wireframes</p>
          <h1 className="text-[26px] font-bold tracking-tight mt-1">Jobseeker mockups</h1>
        </div>
        {/* the link carries the screen on show, not just "the jobseeker mockups" */}
        <CopyLinkButton />
      </div>

      <section>
        <InteractivePrototype />
      </section>
    </div>
  )
}
