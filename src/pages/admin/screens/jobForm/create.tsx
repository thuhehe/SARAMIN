import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BenefitsField } from '@/components/BenefitsField'
import { WorkingLocationsField } from '@/components/WorkingLocationsField'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { COMPANY_BENEFITS, TITLE_I18N } from '@/pages/admin/data/jobForm'
import { CATALOG } from '@/pages/admin/data/products'
import { CompanyInfoCard, JobSkillsField } from '@/pages/admin/screens/jobForm/fields'
import { BiTArea, ChipField, FField, LabelRow, SelectField, TArea } from '@/pages/admin/ui/fields'
import { DemoRow, JobGroup, RadioOpts, ShowToggle, Stepper } from '@/pages/admin/ui/form'
import { Pill } from '@/pages/admin/ui/status'

/* ONE create-job form for both surfaces. The Company site renders this same
   component rather than a look-alike, because two hand-maintained copies of a
   40-field form drift within a sprint and the drift is invisible until a field
   exists on one side only.

   Only two things differ, and both come from the spec rather than from taste:
   ① the company picker is Admin-only — an employer is already scoped to their
     own company, so there is nothing to choose;
   ② the free tier is Admin-only too. "Employers can NEVER post a free job"
     (Products & Packages), so on the Company surface a PO is the only way to a
     product and the no-PO free list must not be offered. */
export function AdminJobCreate({ onBack, surface = 'admin' }: { onBack: () => void; surface?: 'admin' | 'company' }) {
  const isAdmin = surface === 'admin'
  useDetailCrumb('New job', onBack)
  const [exposed, setExposed] = useState(true)
  const [postMenu, setPostMenu] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [titleLang, setTitleLang] = useState<'VI' | 'EN'>('VI')
  const G2 = 'grid grid-cols-2 gap-3'
  const G3 = 'grid grid-cols-3 gap-3'

  /* Products offered depend on the PO, straight from the product's `entitlement`:
     with no PO only the always-available (free) tiers can be picked; choosing a PO adds
     that PO's paid lines. Nothing here matches on the product NAME. */
  /* The no-PO option reads differently per surface: for HQ it is the route to the
     free tier, for an employer it is simply "nothing to post from" — never a
     free job. */
  const NO_PO = isAdmin ? '— none (Free job) —' : '— none —'
  const [po, setPo] = useState(NO_PO)
  const hasPo = po !== NO_PO
  const freeProducts = CATALOG.filter((c) => c.type === 'Job posting' && c.entitlement === 'free' && c.status === 'Active')
  const paidProducts = CATALOG.filter((c) => c.type === 'Job posting' && c.entitlement !== 'free' && c.status === 'Active')
  const label = (c: (typeof CATALOG)[number]) => `${c.name} · ${c.fulfilment.split(' · ')[0]}`
  /* No PO on the Company surface means NO product — never the free tier, which is
     Admin-only. An employer without an active PO has nothing to post from. */
  const productOptions = (hasPo ? paidProducts : isAdmin ? freeProducts : []).map(label)

  return (
    <div className="max-w-[860px]">

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mt-0.5 text-[20px] font-bold tracking-tight">Create job <span className="font-medium text-muted">— draft field map</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="draft">Draft</Pill>
          <a className="inline-flex cursor-pointer items-center gap-1 text-[11.5px] font-medium text-brand">Preview draft ↗</a>
        </div>
      </div>

      <div className="space-y-8">
        {/* ═══ POSTING SETUP (company · package · exposure) ═════════════════ */}
        <JobGroup title="Posting setup">
          {/* Admin-only: an employer is already scoped to their own company. */}
          {isAdmin && (
            <>
              <SelectField label="Company" req value="NEC Vietnam · CO-1042" createLabel="Create company" options={['NEC Vietnam · CO-1042', 'FPT Software · CO-1007', 'VNG Corporation · CO-2231', 'Tiki · CO-1890', 'MoMo · CO-3120']} extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— searchable by name or ID</span>} />
              <CompanyInfoCard />
            </>
          )}
          {/* PO → Products sit side by side: the PO scopes which products can be picked */}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Purchase order (PO)"
              value={po}
              onChange={setPo}
              options={[NO_PO, 'PO-2026-0042 · active · signed 12/07/2026', 'PO-2026-0039 · active · signed 02/06/2026']}
              extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— paid products only</span>}
            />
            {/* keyed on the PO so the product resets rather than keeping a stale
                paid tier after the operator drops back to "no PO" */}
            <SelectField
              key={po}
              label="Products"
              req
              value={productOptions[0] ?? '— no product available —'}
              options={productOptions}
              extra={<span className="ml-2 text-[10.5px] font-normal text-faint">{hasPo ? '— lines on the selected PO' : '— free tier (no PO)'}</span>}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <LabelRow label="Exposure" />
              <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
                <span className="min-w-0 flex-1 text-[11.5px] text-muted">{exposed ? 'On — visible on the jobseeker site.' : 'Off — hidden; reversible before the deadline (does not Close).'}</span>
                <button role="switch" aria-checked={exposed} onClick={() => setExposed((v) => !v)} className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', exposed ? 'bg-emerald-500' : 'bg-line')}>
                  <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', exposed ? 'left-[18px]' : 'left-0.5')} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10.5px] leading-relaxed text-faint">
            The product list follows the PO. With <b>no PO</b> only products flagged <b>Always available</b> on the product record are offered — HQ can post those for any company at any time, unlimited. Pick a PO (a customer can have more than one active) and the list becomes that PO’s paid lines. Expiry comes from the product’s duration. <b>Employers never see the free tier</b> — on the Company site they can only post from what they bought.
          </p>
        </JobGroup>

        {/* ═══ JOB INFORMATION (client field list) ══════════════════════════ */}
        <JobGroup title="Job information">
          {/* job title — single field, VI / EN tab */}
          <div>
            <LabelRow label="Job title" req right={
              <div className="flex overflow-hidden rounded-md border border-line text-[10.5px] font-medium">
                {(['VI', 'EN'] as const).map((l) => (
                  <button key={l} onClick={() => setTitleLang(l)} className={cn('px-2 py-0.5', titleLang === l ? 'bg-brand text-white' : 'text-muted')}>{l}</button>
                ))}
              </div>
            } />
            <div className="flex items-center rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">{TITLE_I18N[titleLang]}</div>
            <p className="mt-1 text-[10.5px] text-faint">Vietnamese is the default &amp; required language and the fallback shown wherever an EN/KO translation is missing; English/Korean optional.</p>
          </div>

          <div className={G2}>
            <SelectField label="Job category" req value="IT" createLabel="Create category" options={['IT', 'Marketing', 'Finance & Accounting', 'Sales', 'Human Resources', 'Design', 'Engineering', 'Healthcare', 'Education']} />
            <ChipField label="Job role" req chips={['Software Developer']} placeholder="Add role…" hint="Roles come from the selected category (Master data). Type to add a new one." />
          </div>
          <div className={G2}>
            <SelectField label="Job level" req value="Experienced (non-manager)" createLabel="Create job level" options={['Intern/Student', 'Fresher/Entry level', 'Experienced (non-manager)', 'Manager', 'Director and above']} />
            <SelectField label="Work type" req value="In office" createLabel="Create work type" options={['In office', 'Remote', 'Hybrid', 'Oversea']} /><SelectField label="Contract type" req value="Fulltime" createLabel="Create contract type" options={['Fulltime', 'Part-time', 'Fixed-term contract', 'Internship', 'Probation', 'Freelance', 'Seasonal']} />
          </div>
          <div className={G2}>
            <SelectField label="Industry" req value="FMCG" createLabel="Create industry" options={['IT / Software', 'FMCG', 'Banking / Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Logistics']} />
            <JobSkillsField />
          </div>
          {/* A working location is a NAMED office saved on the company, not a
              city+address typed per job — see WorkingLocationsField. */}
          <WorkingLocationsField />

          <div>
            <LabelRow label="Salary range" req right={<ShowToggle />} />
            <div className={G3}>
              <FField label="From" value="500" />
              <FField label="To" value="1500" />
              {/* TWO currencies, and no "create" affordance — a JPY or RUB salary
                  on a VN board is unfilterable and unrankable. USD is a DISPLAY
                  denomination: the IT / FDI segment advertises in it, and an
                  employer who cannot say "$1,700–3,200" writes "Thỏa thuận"
                  instead, which costs us the salary data entirely. */}
              <SelectField label="Currency" value="USD" options={['VND', 'USD']} />
            </div>
            <p className="mt-1 text-[10.5px] text-faint">
              USD jobs display a settlement line to candidates: <i>“Lương thỏa thuận và chi trả bằng VND theo tỷ giá tại thời điểm ký hợp đồng.”</i>
            </p>
          </div>
          <div>
            <LabelRow label="Number of headcount" right={<ShowToggle on={false} />} />
            <Stepper value="1" />
          </div>
          <SelectField label="Contact person" req value="Ms. Vũ Thanh Linh · HR Manager" createLabel="Create contact person" options={['Ms. Vũ Thanh Linh · HR Manager', 'Mr. Ngô Minh Tú · HR Specialist', 'Ms. Đỗ Thị Mai · HR Specialist']} extra={<span className="ml-2 text-[10.5px] font-normal text-faint">— the recipient name candidates see</span>} />
          <ChipField label="Application recipient email(s)" req chips={['hr@nec.vn', 'ta.lead@nec.vn']} placeholder="Add email…" hint="Applications are emailed to these addresses (multiple allowed); the name shown to candidates is the contact person above." />
        </JobGroup>

        {/* ═══ JOB CONTENT (bilingual rich text) ════════════════════════════ */}
        <JobGroup title="Job content">
          <BiTArea label="Job description" req rows={4}
            vi="Lãnh đạo nhóm phát triển; kiến trúc backend (70%) + frontend (30%); review code & mentoring…"
            en="Lead the development team; backend architecture (70%) + frontend (30%); code review & mentoring…" />
          <BiTArea label="Requirements" req rows={4}
            vi="7+ năm phát triển phần mềm; 3+ năm ở vị trí Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; tiếng Nhật N4+…"
            en="7+ years software dev; 3+ years as Technical Leader; ASP.NET Core, SQL Server, React/Vue/Angular; Japanese N4+…" />
          {/* Benefits is NOT free text any more: a typed list is what gives each
              one an icon, a translation, and a search filter. See BenefitsField.
              No `initial` on a NEW job: the field prefills from the company set
              (copy-on-create) and the editor curates freely — with "↺ Về mặc định
              công ty" and the read-only preview as the way back. */}
          <BenefitsField
            companyBenefits={COMPANY_BENEFITS}
            companyName="NEC Vietnam"
          />
        </JobGroup>

        {/* ═══ CANDIDATE EXPECTATION ════════════════════════════════════════ */}
        <JobGroup title="Candidate expectation">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
           Demographic fields (nationality / gender / marital status / age) are legally sensitive for VN job ads — confirm with the client whether to collect / display them.
          </div>
          <div className={G2}>
            <div>
              <LabelRow label="Years of experience (min – max)" />
              <div className="flex items-center gap-2 text-[12.5px] text-faint">
                <span className="rounded-md border border-line bg-surface px-3 py-1.5">Min</span>—<span className="rounded-md border border-line bg-surface px-3 py-1.5">Max</span>
              </div>
            </div>
            <SelectField label="Minimum education level" value="Bachelor" createLabel="Create education level" options={['High school', "Associate's degree", 'College', 'Bachelor', 'Master', 'Doctorate', 'Others']} />
          </div>
          <DemoRow label="Nationality" options={['Any', 'Vietnamese', 'Foreigner']} />
          <DemoRow label="Gender" options={['Any', 'Male', 'Female']} />
          <DemoRow label="Marital status" options={['Any', 'Single', 'Married']} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <label className="w-36 text-[11.5px] font-medium text-ink/80">Age preference</label>
            <div className="flex items-center gap-2 text-[12.5px] text-faint">
              <span className="rounded-md border border-line bg-surface px-3 py-1.5">18</span>—<span className="rounded-md border border-line bg-surface px-3 py-1.5">60</span>
            </div>
            <ShowToggle on={false} />
          </div>
          <div>
            <LabelRow label="Do you require cover letter?" />
            <RadioOpts options={['Yes, always required', 'No, it is optional', 'No, it is never required']} value="No, it is never required" />
          </div>
        </JobGroup>

        {/* ═══ INTERNAL (HQ ONLY) ═══════════════════════════════════════════ */}
        <JobGroup title="Internal (HQ only)">
          <TArea label="Notes" value="Approval context, special instructions, follow-ups… — never shown publicly." rows={3} />
        </JobGroup>
      </div>

      {/* footer actions */}
      <div className="mt-6 border-t border-line pt-4">
        {scheduling && (
          <div className="mb-3 rounded-lg border border-line bg-canvas/40 p-3">
            <p className="mb-1.5 text-[11.5px] font-medium text-ink/80">Schedule publish time</p>
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-faint">
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5">dd/mm/yyyy</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5">hh:mm</span>
              <span className="text-[11px] text-muted">GMT+7</span>
              <button onClick={() => setScheduling(false)} className="ml-1 text-[11px] font-medium text-muted underline">Cancel</button>
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">Job is saved with <b>Schedule</b> status and auto-publishes to <b>Open</b> at this time.</p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Save as draft</button>
          <div className="relative">
            <button onClick={() => setPostMenu((o) => !o)} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">
              {scheduling ? 'Schedule post' : 'Post now'} <span className="text-[11px]">▾</span>
            </button>
            {postMenu && (
              <div className="absolute right-0 z-10 mt-1 w-60 overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
                <button onClick={() => { setScheduling(false); setPostMenu(false) }} className="block w-full px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-canvas">Post now — publish immediately</button>
                <button onClick={() => { setScheduling(true); setPostMenu(false) }} className="block w-full border-t border-line-soft px-3 py-2 text-left text-[12.5px] text-ink/80 hover:bg-canvas">Schedule for later…</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Open questions for the client: bilingual coverage per field (VI/EN/KO) · whether demographic fields are collected at all · salary-display policy · which package/boost SKUs exist · approval workflow (auto vs manual).
      </p>
    </div>
  )
}
