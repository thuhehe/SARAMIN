import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CV_STATUS_TONE, DELIVERY_TONE, STAGE_TONE, isHeld } from '@/pages/admin/data/recruitment'
import type { Applicant } from '@/pages/admin/data/recruitment'
import { FilterSelect, ListPage, RowAction } from '@/pages/admin/ui/list'
import { RejectDialog } from '@/pages/admin/ui/rejectDialog'
import { Pill } from '@/pages/admin/ui/status'
import { TwoLine, split2 } from '@/pages/admin/ui/table'

/** Text that opens a detail page in a new tab (wireframe affordance). */
function ExtLink({ children }: { children: React.ReactNode }) {
  return (
    <a target="_blank" rel="noopener noreferrer" title="Opens in a new tab" className="min-w-0 truncate text-brand hover:underline">
      {children}
    </a>
  )
}

/* Applicant detail under status model v2. There is NO pre-send gate any more:
   the employer already has this CV, so HQ cannot approve or reject it. What is
   left is oversight — read the same information the employer sees, then either
   pull it back (Recall) or shut the whole account off (Block). The quality
   checks stay on screen as LABELS: they inform, they never block. */
function ApplicantDetail({ a, onClose }: { a: Applicant; onClose: () => void }) {
  const { name, status, hold } = a
  const [decision, setDecision] = useState<'none' | 'recall' | 'block'>('none')
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[640px] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
              {name}
              <Pill tone={DELIVERY_TONE[status]}>{status}</Pill>
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              {a.job} · {a.company} · applied {a.when} · CV: <b className="font-semibold text-ink/80">{a.cv[0]}</b>
              <Pill tone={a.cv[1] === 'saramin' ? 'neutral' : 'draft'}>{a.cv[1] === 'saramin' ? 'Saramin CV' : 'Upload'}</Pill>
            </p>
          </div>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          {/* The WHOLE candidate record, in the order an operator reads it: who
              they are, what they want, then the document itself. The list shows
              Basic information and Work preference as truncated two-liners, so
              this is where those columns are read in full — the CV alone was
              never enough to judge an application. */}
          <div className="space-y-3">
            <div className="rounded-lg border border-line p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Basic information</p>
              <p className="text-[11.5px] leading-relaxed text-ink">{a.basic}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                <span>✉ {a.contact[0]}</span><span>📞 {a.contact[1]}</span>
              </p>
            </div>
            <div className="rounded-lg border border-line p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Work preference</p>
              <p className="text-[11.5px] leading-relaxed text-ink">{a.pref}</p>
            </div>
            <div className="rounded-lg border border-line bg-canvas/30 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-faint">CV content — {a.cv[0]}</p>
                <span className="shrink-0 cursor-pointer text-[11px] font-medium text-brand">⬇ Download</span>
              </div>
              {/* A CV nothing could be read from has NO parsed content to show. It
                  says so, instead of rendering a work history that does not exist
                  — that is the whole reason the row is held. */}
              {a.role === '—' ? (
                <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-[11px] leading-relaxed text-muted">
                  Nothing could be extracted from this file.<br />
                  <span className="text-faint">Open the original to check it by eye — the verdict is made in CV review.</span>
                </p>
              ) : (
                <>
                  <p className="text-[13px] font-bold text-ink">{name}</p>
                  <p className="mb-2 text-[11px] text-muted">{a.role} · {a.loc} · {a.years}</p>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Experience</p>
                  <p className="text-[11px] text-ink">{a.role} · Zenpay · 2022–nay</p>
                  <p className="mb-2 text-[11px] text-muted">{a.role} · Lantern Digital · 2020–2022</p>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Education</p>
                  <p className="mb-2 text-[11px] text-ink">{a.edu}</p>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Skills</p>
                  <p className="text-[11px] text-ink">React · TypeScript · Next.js · Tailwind · Testing</p>
                </>
              )}
              <p className="mt-2 text-[10.5px] text-faint">Opening the full CV is a PII action and is audited.</p>
            </div>
          </div>
          {/* labels + the two oversight actions */}
          <div className="space-y-3">
            {/* Held rows only. Deliberately NOT a verdict UI: the decision lives on
                the CV, because one CV can hold many applications. */}
            {hold && (
              <div>
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-600">Delivery is waiting</p>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                  {hold}. The employer has not received this yet, and nothing will send it automatically. Decide on the <b className="font-semibold">CV</b> — that verdict resolves every application using it.
                </p>
                <button className="mt-1.5 w-full rounded-md border border-amber-300 px-2 py-1.5 text-[11px] font-semibold text-amber-700">Open in CV review ↗</button>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-faint">Labels · never blocking</p>
              <div className="space-y-1">
                {([['Độ phù hợp', '86% — skills & years fit'], ['Mức hoàn thiện hồ sơ', '3 / 4'], ['Kênh liên hệ', 'Email + phone'], ['Nguồn dữ liệu', 'Saramin CV']] as [string, string][]).map(([k, v]) => (
                  <p key={k} className="flex items-baseline justify-between gap-2 text-[11px]">
                    <span className="text-faint">{k}</span><b className="font-semibold text-ink/80">{v}</b>
                  </p>
                ))}
              </div>
              <p className="mt-1.5 text-[10.5px] text-faint">These inform the employer’s decision. None of them stops a CV from being sent.</p>
            </div>
            {decision === 'recall' && (
              <div>
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-600">Recall this application</p>
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10.5px] leading-relaxed text-amber-800">
                  The employer was emailed at apply time — that email cannot be un-sent. Recall removes the CV from their dashboard and notifies them to ignore it. Terminal: the candidate must apply again.
                </p>
              </div>
            )}
            {decision === 'block' && (
              <div>
                <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-rose-500">Block reason (required, audited)</p>
                <div className="space-y-1">
                  {['Fraudulent / fake identity', 'Abusive behaviour', 'Duplicate accounts', 'Other (note required)'].map((r, i) => (
                    <label key={r} className={cn('flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[11px]', i === 0 ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-line text-muted')}>{r}</label>
                  ))}
                </div>
                <p className="mt-1.5 text-[10.5px] font-medium text-rose-600">Whole user: blocks future applies and recalls all 7 sent applications across every job.</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="text-[10.5px] text-faint">
            {isHeld(hold)
              ? 'Waiting on the CV verdict, which is made in CV review. Nothing releases this on its own, and there is nothing to decide here.'
              : 'No approve / reject — the employer already has this CV. Every action is audited.'}
          </span>
          <div className="flex shrink-0 gap-2 whitespace-nowrap">
            {decision === 'none' ? (
              <>
                <RowAction>Note</RowAction>
                <RowAction>Edit</RowAction>
                <button onClick={() => setDecision('block')} className="rounded-lg border border-rose-300 px-3 py-1.5 text-[12.5px] font-semibold text-rose-600">Block user…</button>
                {/* Recall pulls something back from the employer — meaningless while
                    delivery has not happened yet. */}
                {!isHeld(hold) && (
                  <button onClick={() => setDecision('recall')} className="rounded-lg bg-amber-500 px-3 py-1.5 text-[12.5px] font-semibold text-white">Recall…</button>
                )}
              </>
            ) : (
              <>
                <button onClick={() => setDecision('none')} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold text-muted">Cancel</button>
                <button onClick={onClose} className={cn('rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white', decision === 'block' ? 'bg-rose-500' : 'bg-amber-500')}>
                  {decision === 'block' ? 'Confirm block user' : 'Confirm recall'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminApplicants() {
  const [open, setOpen] = useState<Applicant | null>(null)
  const [menuA, setMenuA] = useState<number | null>(null)
  /* THE SAME dialog component as CV review, not a copy — one decision reached
     from two screens must not grow two forms with two wordings. */
  const [reject, setReject] = useState<{ name: string; file: string } | null>(null)
  const [fStatus, setFStatus] = useState('')
  const [fStage, setFStage] = useState('')
  const [fCompany, setFCompany] = useState('')
  const [fLoc, setFLoc] = useState('')
  const [fCv, setFCv] = useState('')
  const [fCvSt, setFCvSt] = useState('')
  const raw: Applicant[] = [
    /* Applied with a CV whose verdict is unresolved → delivery waits. Role reads
       "—" because extraction found nothing; years and education survive because
       they are PROFILE fields, stated at onboarding. */
    { name: 'Trương Văn Bình', basic: 'Male · 09/09/1998 · Vietnamese · Single · College · 3 yrs exp', pref: 'Sales Executive · Sales · Hà Nội · 12–18M · In office', contact: ['binh.truong@gmail.com', '0915 785 565'], role: '—', years: '3 yrs', loc: 'Hà Nội', edu: 'College · Business', job: 'Sales Executive', company: 'Thế Giới Di Động', cv: ['scan_0816.pdf', 'upload'], cvStatus: 'Not enough information', status: 'Not sent', hold: 'CV in doubt · chờ duyệt · đã đợi 23h', stage: 'New', when: '10m ago' },
    { name: 'Nguyễn Văn An', basic: 'Male · 12/04/1996 · Vietnamese · Single · Bachelor · 4 yrs exp', pref: 'Frontend Engineer · IT · Hồ Chí Minh · 25–35M · In office', contact: ['an.nguyen@gmail.com', '0922 798 582'], role: 'Frontend Engineer', years: '4 yrs', loc: 'Hồ Chí Minh', edu: "Bachelor · CS", job: 'Senior Frontend Engineer', company: 'FPT Software', cv: ['Frontend Engineer CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'Reviewing', when: '2h ago' },
    { name: 'Trần Thị Bích', basic: 'Female · 03/09/1994 · Vietnamese · Married · Bachelor · 6 yrs exp', pref: 'Digital Marketing Lead · Marketing · Hà Nội · 30–40M · Hybrid', contact: ['bich.tran@gmail.com', '0929 811 599'], role: 'Digital Marketing Specialist', years: '6 yrs', loc: 'Hà Nội', edu: 'Bachelor · Marketing', job: 'Digital Marketing Lead', company: 'Tiki', cv: ['bich-portfolio.pdf', 'upload'], cvStatus: 'Qualified', status: 'Sent', stage: 'Interview', when: '5h ago' },
    { name: 'Lê Hoàng Cường', basic: 'Male · 21/11/1990 · Vietnamese · Married · Master · 8 yrs exp', pref: 'Product Manager · IT · Hồ Chí Minh · 50–70M · Hybrid', contact: ['cuong.le@gmail.com', '0936 824 616'], role: 'Senior Product Manager', years: '8 yrs', loc: 'Hồ Chí Minh', edu: 'Master · MBA', job: 'Product Manager', company: 'MoMo', cv: ['Product Manager CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'Hired', when: '1d ago' },
    { name: 'Phạm Thu Dung', basic: 'Female · 07/02/1997 · Vietnamese · Single · Bachelor · 3 yrs exp', pref: 'General Accountant · Accounting · Đà Nẵng · 12–18M · In office', contact: ['dung.pham@gmail.com', '0943 837 633'], role: 'General Accountant', years: '3 yrs', loc: 'Đà Nẵng', edu: 'Bachelor · Accounting', job: 'Kế toán tổng hợp', company: 'VNG', cv: ['thu-dung-cv.pdf', 'upload'], cvStatus: 'Qualified', status: 'Sent', stage: 'New', when: '1d ago' },
    { name: 'Vũ Minh Đức', basic: 'Male · 30/06/1995 · Vietnamese · Single · Bachelor · 5 yrs exp', pref: 'Backend Engineer · IT · Hồ Chí Minh · 35–45M · Remote', contact: ['duc.vu@gmail.com', '0950 850 650'], role: 'Backend Engineer', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · SE', job: 'Backend Engineer (Go)', company: 'Shopee', cv: ['Backend Engineer CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'Rejected', when: '3d ago' },
    { name: 'Đặng Thị Hoa', basic: 'Female · 25/12/1996 · Vietnamese · Single · Bachelor · 4 yrs exp', pref: 'Product Designer · Design · Hồ Chí Minh · 20–30M · Hybrid', contact: ['hoa.dang@gmail.com', '0957 863 667'], role: 'Product Designer', years: '4 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · Design', job: 'UI/UX Designer', company: 'One Mount', cv: ['hoa-portfolio.pdf', 'upload'], cvStatus: "Can't read", status: 'Not sent', hold: 'CV in doubt · chờ duyệt · đã đợi 18h', stage: 'New', when: '3d ago' },
    /* Applied with a CV an admin had already Rejected — never delivered. */
    { name: 'Ngô Bảo Khánh', basic: 'Male · 14/07/2001 · Vietnamese · Single · College · 1 yr exp', pref: 'Sales Staff · Sales · Cần Thơ · 8–12M · In office', contact: ['khanh.ngo@gmail.com', '0964 876 684'], role: '—', years: '1 yr', loc: 'Cần Thơ', edu: 'College · Business', job: 'Sales Staff', company: 'Thế Giới Di Động', cv: ['menu_final.pdf', 'upload'], cvStatus: 'Rejected', status: 'Not sent', hold: 'CV Rejected — never delivered', stage: 'New', when: '1d ago' },
    { name: 'Bùi Quang Huy', basic: 'Male · 19/03/1999 · Vietnamese · Single · Bachelor · 2 yrs exp', pref: 'Data Analyst · IT · Hà Nội · 18–25M · Hybrid', contact: ['huy.bui@gmail.com', '0971 889 701'], role: 'Data Analyst', years: '2 yrs', loc: 'Hà Nội', edu: 'Bachelor · Statistics', job: 'Data Analyst', company: 'Techcombank', cv: ['Data Analyst CV', 'saramin'], cvStatus: 'Rejected', status: 'Recall', stage: 'Reviewing', when: '4d ago' },
    { name: 'Ngô Thị Lan', basic: 'Female · 11/08/1992 · Vietnamese · Married · Bachelor · 7 yrs exp', pref: 'HR Business Partner · HR · Hồ Chí Minh · 30–40M · In office', contact: ['lan.ngo@gmail.com', '0978 902 718'], role: 'HR Generalist', years: '7 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · HRM', job: 'HR Business Partner', company: 'Grab', cv: ['lan-cv.docx', 'upload'], cvStatus: 'Qualified', status: 'Sent', stage: 'Interview', when: '4d ago' },
    { name: 'Hoàng Văn Nam', basic: 'Male · 02/03/1993 · Vietnamese · Married · Bachelor · 6 yrs exp', pref: 'DevOps Engineer · IT · Hồ Chí Minh · 35–50M · Remote', contact: ['nam.hoang@gmail.com', '0985 915 735'], role: 'DevOps Engineer', years: '6 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · CS', job: 'DevOps Engineer', company: 'VNG', cv: ['DevOps Engineer CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'New', when: '5d ago' },
    { name: 'Trịnh Mỹ Linh', basic: 'Female · 27/10/1998 · Vietnamese · Single · Bachelor · 3 yrs exp', pref: 'Content Writer · Marketing · Hà Nội · 12–16M · Hybrid', contact: ['linh.trinh@gmail.com', '0992 928 752'], role: 'Content Writer', years: '3 yrs', loc: 'Hà Nội', edu: 'Bachelor · Journalism', job: 'Content Marketing', company: 'Base.vn', cv: ['my-linh.pdf', 'upload'], cvStatus: 'Rejected', status: 'Recall', stage: 'New', when: '5d ago' },
    { name: 'Đỗ Anh Tú', basic: 'Male · 05/05/1995 · Vietnamese · Single · Bachelor · 5 yrs exp', pref: 'iOS Developer · IT · Hồ Chí Minh · 35–45M · In office', contact: ['tu.do@gmail.com', '0999 941 769'], role: 'iOS Developer', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · SE', job: 'Mobile Engineer (iOS)', company: 'MoMo', cv: ['iOS Developer CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'Shortlisted', when: '6d ago' },
    { name: 'Lý Thu Trang', basic: 'Female · 22/06/1997 · Vietnamese · Single · Bachelor · 4 yrs exp', pref: 'QA Engineer · IT · Đà Nẵng · 20–28M · In office', contact: ['trang.ly@gmail.com', '0906 954 786'], role: 'QA Engineer', years: '4 yrs', loc: 'Đà Nẵng', edu: 'Bachelor · IT', job: 'QA Engineer', company: 'FPT Software', cv: ['trang-qa.pdf', 'upload'], cvStatus: 'Qualified', status: 'Sent', stage: 'Interview', when: '6d ago' },
    { name: 'Phan Văn Kiên', basic: 'Male · 15/01/1998 · Vietnamese · Single · College · 3 yrs exp', pref: 'Sales Executive · Sales · Hồ Chí Minh · 12–18M · In office', contact: ['kien.phan@gmail.com', '0913 967 803'], role: 'Sales Executive', years: '3 yrs', loc: 'Hồ Chí Minh', edu: 'College · Business', job: 'Sales Executive', company: 'Thế Giới Di Động', cv: ['Sales Executive CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'New', when: '1w ago' },
    { name: 'Võ Thị Ngọc', basic: 'Female · 09/12/1994 · Vietnamese · Married · Bachelor · 5 yrs exp', pref: 'Business Analyst · IT · Hồ Chí Minh · 28–38M · Hybrid', contact: ['ngoc.vo@gmail.com', '0920 980 820'], role: 'Business Analyst', years: '5 yrs', loc: 'Hồ Chí Minh', edu: 'Bachelor · IS', job: 'Business Analyst', company: 'Shopee', cv: ['ngoc-cv.pdf', 'upload'], cvStatus: 'Qualified', status: 'Sent', stage: 'Shortlisted', when: '1w ago' },
    { name: 'Mai Đức Thắng', basic: 'Male · 30/09/1989 · Vietnamese · Married · Master · 10 yrs exp', pref: 'Solution Architect · IT · Hồ Chí Minh · 60–80M · Remote', contact: ['thang.mai@gmail.com', '0927 993 837'], role: 'Solution Architect', years: '10 yrs', loc: 'Hồ Chí Minh', edu: 'Master · CS', job: 'Solution Architect', company: 'Techcombank', cv: ['Solution Architect CV', 'saramin'], cvStatus: 'Qualified', status: 'Sent', stage: 'Hired', when: '1w ago' },
  ]
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'vi'))
  const cvKind = (a: Applicant) => (a.cv[1] === 'saramin' ? 'Saramin CV' : 'Uploaded file')
  // the filter row narrows the list; ListPage still searches on top of the result
  const shown = raw.filter(
    (a) =>
      (!fStatus || a.status === fStatus) &&
      (!fStage || a.stage === fStage) &&
      (!fCompany || a.company === fCompany) &&
      (!fLoc || a.loc === fLoc) &&
      (!fCv || cvKind(a) === fCv) &&
      (!fCvSt || a.cvStatus === fCvSt),
  )
  const rows = shown.map((a, i) => [
    <span onClick={() => setOpen(a)} className="min-w-0 cursor-pointer truncate text-brand hover:underline">{a.name}</span>,
    /* Same cell shapes as Talent pool, so an operator reads the two lists as one
       system: CV = name + kind pill, then Basic information and Work preference. */
    <div className="min-w-0">
      <p onClick={() => setOpen(a)} className="cursor-pointer truncate font-medium text-brand hover:underline" title="Opens the full candidate record — basic information, work preference and CV content. PII action, logged">{a.cv[0]}</p>
      <Pill tone={a.cv[1] === 'saramin' ? 'neutral' : 'draft'}>{a.cv[1] === 'saramin' ? 'Saramin CV' : 'Upload'}</Pill>
    </div>,
    <TwoLine top={split2(a.basic, 3)[0]} bottom={split2(a.basic, 3)[1]} />,
    <TwoLine top={split2(a.pref, 2)[0]} bottom={split2(a.pref, 2)[1]} />,
    <TwoLine top={a.contact[0]} bottom={a.contact[1]} />,
    <ExtLink>{a.job}</ExtLink>,
    <ExtLink>{a.company}</ExtLink>,
    <Pill tone={CV_STATUS_TONE[a.cvStatus]}>{a.cvStatus}</Pill>,
    /* The pill alone. It used to carry a sub-line repeating WHY (“CV in doubt · chờ
       duyệt…”) — removed: the CV status column two cells left already says exactly
       that, and one fact printed twice on one row is how the two copies drift. */
    <Pill tone={DELIVERY_TONE[a.status]}>{a.status}</Pill>,
    /* Recalled CVs are off the employer's dashboard, so their funnel stops moving —
       an em-dash says that better than a frozen badge would. */
    a.status === 'Sent'
      ? <Pill tone={STAGE_TONE[a.stage] ?? 'draft'}>{a.stage}</Pill>
      : <span className="text-faint" title={isHeld(a.hold) ? 'Not delivered yet — the employer funnel has not started' : 'Off the employer dashboard — the funnel no longer applies'}>—</span>,
    <span className="text-muted">{a.when}</span>,
    /* The SAME ⋯ menu as the CV lists, because the verbs ARE CV verbs: an admin
       never approves or rejects an application — they decide on the CV, and that
       decision resolves every application using it. Application-level actions
       (Recall · Block user · Note) live in the detail, opened from the name. */
    <div className="relative flex items-center justify-end">
      <button
        onClick={() => setMenuA(menuA === i ? null : i)}
        className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[15px] leading-none text-muted', menuA === i ? 'border-line bg-canvas' : 'border-transparent hover:border-line hover:bg-canvas')}
      >⋯</button>
      {menuA === i && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuA(null)} />
          <div className="absolute right-0 top-8 z-30 w-[360px] overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-lg">
            {/* Opening lives on the row — candidate name → application detail,
                CV name → the file. The menu is only the decision. */}
            {(a.cvStatus === 'Not enough information' || a.cvStatus === "Can't read" || a.cvStatus === 'Rejected') && (
              <button onClick={() => setMenuA(null)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-emerald-700 hover:bg-canvas">
                <span className="w-3.5 text-center">✓</span><span className="flex-1">Approve CV…</span>
                <span className="shrink-0 text-[10px] text-faint">→ Qualified · Sent · Showing</span>
              </button>
            )}
            {a.cvStatus !== 'Rejected' && (
              <button onClick={() => { setMenuA(null); setReject({ name: a.name, file: a.cv[0] }) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-rose-600 hover:bg-canvas">
                <span className="w-3.5 text-center">✕</span>
                <span className="flex-1">Reject CV…</span>
                <span className="shrink-0 text-[10px] text-faint">chọn lý do ở bước sau</span>
              </button>
            )}
            {/* SAME two-verb menu and SAME reject dialog as CV review — this is one
                decision reached from a different screen, so it must not grow a
                second form with its own wording. The dialog itself is specced once,
                on CV review. */}
            <div className="border-t border-line-soft px-3 py-2">
              <p className="text-[10px] leading-snug text-faint">Quyết định áp lên CV — nó xử lý mọi đơn dùng CV này, không riêng đơn này.</p>
            </div>
          </div>
        </>
      )}
    </div>,
  ])
  return (
    <div>
      {/* The two dimensions are owned by different people, so the list names both
          owners once rather than leaving a reader to guess which badge is whose. */}
      <p className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
        <b className="font-semibold text-ink/80">Status</b> is Saramin’s — three values. Derived from the CV:
        Qualified → <b className="font-semibold text-ink/80">Sent</b> · in doubt → <b className="font-semibold text-ink/80">Not sent</b>, which{' '}
        <b className="font-semibold text-ink/80">waits for an admin — nothing auto-sends</b> · Rejected before delivery → <b className="font-semibold text-ink/80">Not sent</b>, now final ·
        Rejected AFTER delivery → <b className="font-semibold text-ink/80">Recall</b>, pulled back from the employer (blocking a user works the same way: it rejects their CVs, which recalls what was delivered).{' '}
        <b className="font-semibold text-ink/80">Stage</b> is the employer’s hiring funnel and is read-only here.
        There is no decision to make on this screen: the hold belongs to the CV, so the reviewer works{' '}
        <b className="font-semibold text-ink/80">CV review</b> and one verdict resolves every application waiting on that CV.
      </p>
      <ListPage
        minW={2050}
        /* rows are already narrowed by the filter row, so Total means every
           application HQ holds, not what survived the filters */
        total={raw.length}
        searchHint="Search candidate, job, company…"
        filters={
          <>
            <FilterSelect label="Status" value={fStatus} onChange={setFStatus} options={uniq(raw.map((a) => a.status))} />
            <FilterSelect label="Stage" value={fStage} onChange={setFStage} options={uniq(raw.map((a) => a.stage))} />
            <FilterSelect label="Company" value={fCompany} onChange={setFCompany} options={uniq(raw.map((a) => a.company))} />
            <FilterSelect label="Location" value={fLoc} onChange={setFLoc} options={uniq(raw.map((a) => a.loc))} />
            <FilterSelect label="CV" value={fCv} onChange={setFCv} options={uniq(raw.map(cvKind))} />
            <FilterSelect label="CV status" value={fCvSt} onChange={setFCvSt} options={uniq(raw.map((a) => a.cvStatus))} />
          </>
        }
        cols={[
          { label: 'Candidate', w: '1.1fr' },
          { label: 'Profile & CV', w: '1.3fr' },
          { label: 'Basic information', w: '1.1fr' },
          { label: 'Work preference', w: '1.3fr' },
          { label: 'Contact', w: '1.3fr' },
          { label: 'Applied to', w: '1.3fr' },
          { label: 'Company', w: '1fr' },
          { label: 'CV status', w: '1.2fr' },
          { label: 'Application status', w: '1.1fr' },
          { label: 'Pipeline status (employer)', w: '1fr' },
          { label: 'Applied', w: '0.8fr', align: 'r' },
          { label: 'Actions', w: '1.4fr', align: 'r' },
        ]}
        rows={rows}
      />
      {open && <ApplicantDetail a={open} onClose={() => setOpen(null)} />}
      {reject && <RejectDialog name={reject.name} file={reject.file} onClose={() => setReject(null)} />}
    </div>
  )
}
