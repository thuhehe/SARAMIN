import { useState } from 'react'
import { cn } from '@/lib/utils'
import { RejectDialog } from '@/pages/admin/ui/rejectDialog'
import { Toast, type ToastMsg } from '@/pages/admin/ui/toast'
import { CV_COLS } from '@/pages/admin/data/recruitment'
import type { StatusTone } from '@/pages/admin/lib/tone'
import { AdminResumeNew } from '@/pages/admin/screens/recruitment/resumeNew/index'
import { ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'
import { TwoLine, split2 } from '@/pages/admin/ui/table'

/* Candidate detail — ONE candidate = one row in the pool; the drill-in shows
   their Profile summary + ALL their CVs (≤3, exactly one searchable) and the
   HQ moderation actions. HQ moderates; it never edits content or flips the
   candidate's own visibility consent. */
/* The candidate drill-in, in the SAME three groups the jobseeker sees on their own
   profile — Basic information · Work preference · CV content. Reading HQ's view in
   a different shape from the candidate's is how support ends up describing a screen
   the caller is not looking at.

   HQ is read-only on all three. The only thing it owns is the CV's status, and that
   lives on the row's ⋯ menu, not here. */
function ResumeCandidateDetail({ name, onClose }: { name: string; onClose: () => void }) {
  /* Every CV carries a CV STATUS; the derived SEARCH status is shown only on the
     one toggled on — the others are not candidates for the index at all, so a
     search pill on them would claim a fact that does not exist. */
  const cvs = [
    { label: 'Frontend Engineer CV', kind: 'Saramin CV', searchable: true, updated: '2 days ago', st: 'Qualified', content: '3 experience · 8 skills' },
    { label: 'CV_An_EN.pdf', kind: 'Upload', searchable: false, updated: '1 week ago', st: 'Qualified', content: '2 experience · 6 skills' },
    { label: 'scan_old.pdf', kind: 'Upload', searchable: false, updated: '3 weeks ago', st: "Can't read", content: 'No readable content' },
  ]
  const Group = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
    <div>
      <p className="mb-1.5 flex flex-wrap items-baseline gap-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
        {title}{note && <span className="font-normal normal-case tracking-normal text-faint/80">{note}</span>}
      </p>
      {children}
    </div>
  )
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <p className="flex items-baseline justify-between gap-3 text-[11.5px]"><span className="shrink-0 text-muted">{k}</span><span className="text-right font-medium text-ink">{v}</span></p>
  )
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[600px] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-bold text-ink">{name}</p>
            <p className="text-[11px] text-muted">The same three groups the jobseeker sees on their own profile · HQ is read-only</p>
          </div>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Group title="1 · Basic information" note="sign-up · 9 fields">
            <div className="grid gap-x-6 gap-y-1 rounded-lg border border-line p-3 sm:grid-cols-2">
              <Row k="Full name" v={name} />
              <Row k="Email" v={<span className="text-muted">masked · <span className="cursor-pointer text-brand">reveal (logged)</span></span>} />
              <Row k="Phone" v={<span className="text-muted">masked · <span className="cursor-pointer text-brand">reveal (logged)</span></span>} />
              <Row k="Nationality" v="Vietnamese" />
              <Row k="Gender" v="Male" />
              <Row k="Marital status" v="Single" />
              <Row k="Date of birth" v="12/04/1996" />
              <Row k="Highest education" v="Bachelor" />
              <Row k="Years of experience" v="4 yrs" />
            </div>
          </Group>
          <Group title="2 · Work preference" note="onboarding · 6 fields">
            <div className="grid gap-x-6 gap-y-1 rounded-lg border border-line p-3 sm:grid-cols-2">
              <Row k="Desired job role" v="Senior Frontend Engineer" />
              <Row k="Desired job category" v="Information Technology" />
              <Row k="Desired industry" v="IT / Software" />
              <Row k="Desired work location" v="Hồ Chí Minh · Hà Nội" />
              <Row k="Expected salary" v="25 – 35M" />
              <Row k="Desired work type" v="In office" />
            </div>
          </Group>
          <Group title="3 · CV content" note={`${cvs.length} / 3 · exactly one is searchable`}>
            <div className="space-y-2">
              {cvs.map((cv) => (
                <div key={cv.label} className={cn('flex items-center gap-3 rounded-lg border p-3', cv.searchable ? 'border-brand/40 bg-brand-soft/30' : 'border-line')}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[13px]">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-ink">
                      {cv.label}
                      <Pill tone={cv.kind === 'Saramin CV' ? 'neutral' : 'draft'}>{cv.kind}</Pill>
                      <Pill tone={cv.st === 'Qualified' ? 'active' : 'draft'}>{cv.st}</Pill>
                      {cv.searchable && <Pill tone={cv.st === 'Qualified' ? 'active' : 'pending'}>{cv.st === 'Qualified' ? 'Showing' : 'Hidden'}</Pill>}
                    </p>
                    <p className="text-[10.5px] text-faint">{cv.content} · updated {cv.updated}</p>
                  </div>
                  <span className="cursor-pointer text-[11px] font-medium text-brand">Mở (ghi log)</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">Which CV is toggled on for search is the candidate’s choice — HQ cannot change it. Every CV carries a CV STATUS; the search pill appears only on the toggled-on one. HQ can only change the STATUS, and that action lives on the ⋯ menu in the list.</p>
          </Group>
        </div>
        <div className="flex justify-end border-t border-line px-4 py-3"><button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink/70">Close</button></div>
      </div>
    </div>
  )
}

export function AdminResumes() {
  const [creating, setCreating] = useState(false)
  const [sel, setSel] = useState<string | null>(null)
  const [menu, setMenu] = useState<number | null>(null)
  /* THE SAME TWO DIALOGS AS CV REVIEW, imported rather than re-built. Talent pool
     and CV review write the same field with the same two verbs, so a second
     reject form here would be a second place for the candidate-facing wording to
     drift — which is exactly how the three status tables drifted apart before. */
  const [reject, setReject] = useState<PoolRow | null>(null)
  /* Approve resolves on the click and reports in a toast — same as CV review, and
     for the same reason: it is the frequent, reversible half of the pair, and a
     modal per row buys nothing that Undo does not. Reject keeps its dialog; it
     sends words to a stranger and there is no undoing a delivered message. */
  const [decided, setDecided] = useState<Record<string, 'Qualified' | undefined>>({})
  const [toast, setToast] = useState<ToastMsg | null>(null)
  if (creating) return <AdminResumeNew onBack={() => setCreating(false)} />
  /* THE TALENT POOL. Columns come from the REAL field sheets: BASIC INFORMATION is
     table 1 (9 fields, sign-up), WORK PREFERENCE is table 2 (6 fields, onboarding).
     From CV CONTENT we show only what is countable and already stored.

     ONE CV STATUS, four values, two of them interim:

       Qualified                 FINAL — the scan wrote it, or an admin approved
       Not enough information    DOUBT — read fine, below the rule
       Can't read                DOUBT — no text layer; a human can still read it
       Rejected                  FINAL — written only by an admin, never the scan

     Application delivery and CV-search visibility are DERIVED from it, never
     stored: Qualified → Sent · Showing; doubt → Not sent (until an admin
     approves) · Hidden; Rejected → Not sent · Hidden — and any application
     already DELIVERED when the rejection lands flips to Recall instead. Search
     stays binary; application status has exactly those three values. Why a CV is
     hidden is the CV STATUS column's job — repeating it inside the visibility
     cell was one fact written twice. */
  type CvSt = 'Qualified' | 'Not enough information' | "Can't read" | 'Rejected'
  const ST_TONE: Record<CvSt, StatusTone> = { Qualified: 'active', 'Not enough information': 'pending', "Can't read": 'draft', Rejected: 'rejected' }
  const SEARCH_OF: Record<CvSt, [string, StatusTone]> = {
    Qualified: ['Showing', 'active'],
    'Not enough information': ['Hidden', 'pending'],
    "Can't read": ['Hidden', 'pending'],
    Rejected: ['Hidden', 'rejected'],
  }
  /* The verbs a status allows: doubt offers both, finals offer only the reversal. */
  const verbs = (st: CvSt): ('Approve' | 'Reject')[] => (st === 'Qualified' ? ['Reject'] : st === 'Rejected' ? ['Approve'] : ['Approve', 'Reject'])
  type PoolRow = { name: string; basic: string; contact: [string, string]; pref: string; cv: string; kind: 'Saramin' | 'Upload'; st: CvSt; why?: string; content: string; unlocks: number; updated: string }
  const raw: PoolRow[] = [
    { name: 'Nguyễn Văn An', basic: 'Male · 12/04/1996 · Vietnamese · Single · Bachelor · 4 yrs exp', contact: ['an.nguyen@gmail.com', '0903 112 445'], pref: 'Frontend Engineer · IT · Hồ Chí Minh · 25–35M · In office', cv: 'Frontend Engineer CV', kind: 'Saramin', st: 'Qualified', content: '3 experience · 8 skills', unlocks: 7, updated: '2 days ago' },
    { name: 'Trần Thị Bích', basic: 'Female · 03/09/1994 · Vietnamese · Married · Bachelor · 6 yrs exp', contact: ['bich.tran@gmail.com', '0912 887 330'], pref: 'Digital Marketing Lead · Marketing · Hà Nội · 30–40M · Hybrid', cv: 'bich-portfolio.pdf', kind: 'Upload', st: 'Qualified', content: '2 experience · 11 skills', unlocks: 12, updated: '1 week ago' },
    { name: 'Lê Hoàng Cường', basic: 'Male · 21/11/1990 · Vietnamese · Married · Master · 8 yrs exp', contact: ['cuong.le@gmail.com', '0938 220 114'], pref: 'Product Manager · IT · Hồ Chí Minh · 50–70M · Hybrid', cv: 'Product Manager CV', kind: 'Saramin', st: 'Qualified', content: '4 experience · 9 skills', unlocks: 4, updated: '3 weeks ago' },
    { name: 'Phạm Thu Dung', basic: 'Female · 07/02/1997 · Vietnamese · Single · Bachelor · 3 yrs exp', contact: ['dung.pham@gmail.com', '0905 664 218'], pref: 'General Accountant · Accounting · Đà Nẵng · 12–18M · In office', cv: 'thu-dung-cv.pdf', kind: 'Upload', st: 'Qualified', content: '1 experience · 3 skills', unlocks: 0, updated: '1 month ago' },
    /* Scanned Qualified, then rejected by an admin — the case the scan cannot see. */
    { name: 'Vũ Minh Đức', basic: 'Male · 30/06/1995 · Vietnamese · Single · Bachelor · 5 yrs exp', contact: ['duc.vu@gmail.com', '0977 145 903'], pref: 'Backend Engineer · IT · Hồ Chí Minh · 35–45M · Remote', cv: 'Backend Engineer CV', kind: 'Saramin', st: 'Rejected', why: 'Fake profile — same photo as 3 other accounts', content: '3 experience · 12 skills', unlocks: 9, updated: '2 months ago' },
    { name: 'Lâm Thị Kiều', basic: 'Female · 18/05/1999 · Vietnamese · Single · Bachelor · 2 yrs exp', contact: ['kieu.lam@gmail.com', '0899 330 771'], pref: 'UI Designer · Design · Hồ Chí Minh · 15–20M · In office', cv: 'CV_2026_final.docx', kind: 'Upload', st: 'Not enough information', content: '2 experience · 1 skill', unlocks: 0, updated: '5 hours ago' },
    { name: 'Trương Văn Bình', basic: 'Male · 09/09/1998 · Vietnamese · Single · College · 3 yrs exp', contact: ['binh.truong@gmail.com', '0908 551 220'], pref: 'Sales Executive · Sales · Hà Nội · 12–18M · In office', cv: 'scan_0816.pdf', kind: 'Upload', st: "Can't read", content: 'No readable content', unlocks: 0, updated: '10 min ago' },
    /* Can't-read scan approved by an admin — Showing, but thin: nothing extracted. */
    { name: 'Mai Tuấn Kiệt', basic: 'Male · 12/09/1991 · Vietnamese · Married · Master · 9 yrs exp', contact: ['kiet.mai@gmail.com', '0908 330 776'], pref: 'Solution Architect · IT · Hồ Chí Minh · 60–80M · Remote', cv: 'cv_scan_2026.pdf', kind: 'Upload', st: 'Qualified', why: 'Approved by admin — real CV, just a scan. Thin: no extracted skills', content: 'No readable content', unlocks: 2, updated: '1 day ago' },
    { name: 'Đỗ Thanh Hà', basic: 'Female · 25/12/1996 · Vietnamese · Single · Bachelor · 4 yrs exp', contact: ['ha.do@gmail.com', '0967 004 512'], pref: 'Product Designer · Design · Hồ Chí Minh · 20–30M · Hybrid', cv: 'portfolio-2026.pdf', kind: 'Upload', st: 'Not enough information', content: '0 experience · 0 skills', unlocks: 0, updated: '6 days ago' },
    { name: 'Ngô Bảo Khánh', basic: 'Male · 14/07/2001 · Vietnamese · Single · College · 1 yr exp', contact: ['khanh.ngo@gmail.com', '0333 908 117'], pref: 'Sales Staff · Sales · Cần Thơ · 8–12M · In office', cv: 'menu_final.pdf', kind: 'Upload', st: 'Rejected', why: 'Not a CV — the file is a price list', content: '0 experience · 0 skills', unlocks: 0, updated: '2 months ago' },
    /* Doubt approved by an admin — the parser missed a two-column layout. */
    { name: 'Lý Khánh Vy', basic: 'Female · 17/03/2000 · Vietnamese · Single · Bachelor · 2 yrs exp', contact: ['vy.ly@gmail.com', '0903 887 441'], pref: 'Graphic Designer · Design · Hồ Chí Minh · 15–22M · Hybrid', cv: 'CV-KhanhVy-design.pdf', kind: 'Upload', st: 'Qualified', why: 'Approved by admin — real CV, two-column layout the parser missed', content: '0 experience · 2 skills', unlocks: 1, updated: '13 hours ago' },
    { name: 'Ngô Thị Lan', basic: 'Female · 11/08/1992 · Vietnamese · Married · Bachelor · 7 yrs exp', contact: ['lan.ngo@gmail.com', '0918 332 447'], pref: 'HR Business Partner · HR · Hồ Chí Minh · 30–40M · In office', cv: 'lan-cv.docx', kind: 'Upload', st: 'Qualified', content: '4 experience · 10 skills', unlocks: 15, updated: '1 day ago' },
  ]
  /* The row's EFFECTIVE status — the local override first. A wireframe stand-in
     for the write, so an approve visibly moves the row instead of leaving it
     looking untouched, which is the whole reason a toast is trustworthy. */
  const stOf = (r: PoolRow) => decided[r.name] ?? r.st
  const approveNow = (r: PoolRow) => {
    const undoing = stOf(r) === 'Rejected'
    setDecided((d) => ({ ...d, [r.name]: 'Qualified' }))
    setToast({
      msg: undoing ? `Đã bỏ từ chối — ${r.name}` : `Đã duyệt CV — ${r.name}`,
      sub: 'CV → Qualified · mọi đơn đang chờ đã gửi tới NTD · vào tìm kiếm CV nếu ứng viên đã bật. Ứng viên không nhận thông báo nào.',
      warn: /no readable content|0 experience · 0 skills/i.test(r.content)
        ? 'Không trích xuất được nội dung — CV sẽ không xuất hiện khi NTD tìm theo kỹ năng.'
        : undefined,
      onUndo: () => setDecided((d) => { const n = { ...d }; delete n[r.name]; return n }),
    })
  }
  const rows = raw.map((r, i) => [
    <span onClick={() => setSel(r.name)} className="min-w-0 cursor-pointer truncate text-brand hover:underline">{r.name}</span>,
    <div className="min-w-0">
      <p onClick={() => setSel(r.name)} className="cursor-pointer truncate font-medium text-brand hover:underline" title="Opens the CV — PII action, logged">{r.cv}</p>
      <Pill tone={r.kind === 'Saramin' ? 'neutral' : 'draft'}>{r.kind === 'Saramin' ? 'Saramin CV' : 'Upload'}</Pill>
    </div>,
    <TwoLine top={split2(r.basic, 3)[0]} bottom={split2(r.basic, 3)[1]} />,
    <TwoLine top={split2(r.pref, 2)[0]} bottom={split2(r.pref, 2)[1]} />,
    <TwoLine top={r.contact[0]} bottom={r.contact[1]} />,
    /* ONE status. `why` under it is the admin's recorded reason, where one exists. */
    <div className="min-w-0">
      <Pill tone={ST_TONE[stOf(r)]}>{stOf(r)}</Pill>
      {r.why && <p className="mt-0.5 truncate text-[10.5px] text-muted" title={r.why}>{r.why}</p>}
    </div>,
    /* CV-search visibility — DERIVED from the status, never stored. */
    <Pill tone={SEARCH_OF[stOf(r)][1]}>{SEARCH_OF[stOf(r)][0]}</Pill>,
    <span className={cn('truncate', stOf(r) !== 'Qualified' || /^1 experience · [123] /.test(r.content) || r.content === 'No readable content' ? 'text-amber-700' : 'text-muted')}>{r.content}</span>,
    stOf(r) === 'Qualified'
      ? <span className={cn(r.unlocks === 0 ? 'text-faint' : 'font-medium text-ink/80')}>{r.unlocks}</span>
      : <span className="text-faint" title="Not showing in CV search, so it cannot have unlocks">—</span>,
    <span className="text-muted">{r.updated}</span>,
    /* Only the verbs this status allows: doubt offers both, finals only the reversal. */
    <div className="relative flex items-center justify-end">
      <button
        onClick={() => setMenu(menu === i ? null : i)}
        className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[15px] leading-none text-muted', menu === i ? 'border-line bg-canvas' : 'border-transparent hover:border-line hover:bg-canvas')}
      >⋯</button>
      {menu === i && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />
          <div className="absolute right-0 top-8 z-30 w-[286px] overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-lg">
            {/* Opening things lives on the row itself — name → profile, CV name →
                the file. This menu is only the decision. */}
            {/* TWO ACTIONS AND NOTHING ELSE — the same shape as CV review. The
                internal note that used to sit in this dropdown moved into the two
                dialogs, which is where it belongs: a note box under a menu is
                impossible to write in, and a reject in particular now has to show
                the reviewer the sentence the candidate will receive before it is
                sent. A 286px menu cannot do that. */}
            {verbs(stOf(r)).map((v) => (
              <button
                key={v}
                onClick={() => { setMenu(null); v === 'Approve' ? approveNow(r) : setReject(r) }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium hover:bg-canvas', v === 'Approve' ? 'text-emerald-700' : 'text-rose-600')}
              >
                <span className="w-3.5 text-center">{v === 'Approve' ? '✓' : '✕'}</span>
                <span className="flex-1">{v === 'Approve' && stOf(r) === 'Rejected' ? 'Approve CV — undo the rejection' : `${v} CV…`}</span>
                <span className="shrink-0 text-[10px] text-faint">→ {v === 'Approve' ? 'Qualified' : 'Rejected'}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>,
  ])
  return (
    <div>
      {/* ONE note. One status, four values, two of them interim. */}
      <p className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
        Every candidate who has switched CV search ON — so everyone here WANTS to be found. Columns come from the field sheets:{' '}
        <b className="font-semibold text-ink/80">Basic information</b> (table 1, sign-up) and <b className="font-semibold text-ink/80">Work preference</b> (table 2,
        onboarding). The scan at upload writes ONE CV status: <b className="font-semibold text-ink/80">Qualified</b> (final), or a DOUBT —{' '}
        <b className="font-semibold text-ink/80">Not enough information</b> · <b className="font-semibold text-ink/80">Can’t read</b> — which is a question, not a
        verdict. Only an admin writes <b className="font-semibold text-ink/80">Rejected</b>. Everything else is derived: Qualified → application Sent · CV search
        Showing; doubt → Not sent (until an admin approves) · Hidden; Rejected → Not sent · Hidden — and an application already DELIVERED flips to{' '}
        <b className="font-semibold text-ink/80">Recall</b> instead. Search is binary; application status is exactly Sent · Not sent · Recall. Why a CV is hidden is the CV status column’s job.{' '}
        <b className="font-semibold text-ink/80">CV review</b> is this list filtered to the two doubt states. Approve / Reject are the only verbs, every use needs an
        internal note, and a re-upload never launders a rejection.{' '}
        <b className="font-semibold text-amber-700">These records contain PII — every open is logged.</b>
      </p>
      <ListPage
        minW={2200}
        action={<button onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:opacity-90">+ New resume</button>}
        tabs={[{ label: 'All', count: 8420, active: true }, { label: 'Approved', count: 6087 }, { label: 'Pending review', count: 13 }, { label: 'Rejected', count: 9 }, { label: 'Not enough information', count: 21 }, { label: "Can't read", count: 12 }]}
        cols={CV_COLS.filter((c) => c.label !== 'Application status')}
        rows={rows}
      />
      {sel && <ResumeCandidateDetail name={sel} onClose={() => setSel(null)} />}
      {reject && <RejectDialog name={reject.name} file={reject.cv} extracted={reject.content} onClose={() => setReject(null)} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

/** Registered as its own screen id so the spec page can show the create flow
    directly; Back returns to the list, the same thing it does in the console. */
export function AdminResumeNewStandalone() {
  const [backToList, setBackToList] = useState(false)
  if (backToList) return <AdminResumes />
  return <AdminResumeNew onBack={() => setBackToList(true)} />
}
