import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CV_COLS } from '@/pages/admin/data/recruitment'
import type { CvCheckRow } from '@/pages/admin/data/recruitment'
import { ListPage } from '@/pages/admin/ui/list'
import { RejectDialog } from '@/pages/admin/ui/rejectDialog'
import { Toast, type ToastMsg } from '@/pages/admin/ui/toast'
import { Pill } from '@/pages/admin/ui/status'
import { TwoLine, split2 } from '@/pages/admin/ui/table'

export function AdminCvCheck() {
  const [open, setOpen] = useState<CvCheckRow | null>(null)
  const [reject, setReject] = useState<CvCheckRow | null>(null)
  /* APPROVE RESOLVES ON THE CLICK — no confirmation step. It is the frequent,
     low-risk, reversible half of the queue, and a modal on it would interrupt a
     reviewer once per row to prevent a mistake that costs one click to undo.
     What the dialog used to explain now travels in the toast, where it does not
     stand between the reviewer and the next row.

     `decided` is the local override — a wireframe's stand-in for the write, so
     the row visibly leaves Cần duyệt and the count drops. Undo deletes the key. */
  /* `| undefined` on purpose — without it TS reads every lookup as a hit and
     narrows stateOf to the literal 'approved'. */
  const [decided, setDecided] = useState<Record<string, 'approved' | undefined>>({})
  const [toast, setToast] = useState<ToastMsg | null>(null)
  /* Three views over ONE list: the open queue, and the two resolved outcomes.
     Resolved rows stay here rather than disappearing, because a rejection is the
     only call in this model a machine cannot make — so it is the one that has to
     be rechecked in bulk, and undone from where it was made. */
  const [view, setView] = useState<'doubt' | 'approved' | 'rejected'>('doubt')
  /* Actions behind a ⋯ menu rather than peer buttons: the verdicts release or
     recall real applications, and a peer button puts "Reject" one stray click from
     "Xem CV". Same menu shape as Talent pool, and every action needs a note. */
  const [menu, setMenu] = useState<number | null>(null)
  const raw: CvCheckRow[] = [
    { name: 'Trương Văn Bình', basic: 'Male · 09/09/1998 · Vietnamese · Single · College · 3 yrs exp', contact: ['binh.truong@gmail.com', '0908 551 220'], pref: 'Sales Executive · Sales · Hà Nội · 12–18M · In office', file: 'scan_0816.pdf', kind: 'tech', extracted: 'No readable content — image scan', apps: 1, left: 'sent normally', age: '10m', updated: '10 min ago', hint: 'likely' },
    { name: 'Lâm Thị Kiều', basic: 'Female · 18/05/1999 · Vietnamese · Single · Bachelor · 2 yrs exp', contact: ['kieu.lam@gmail.com', '0899 330 771'], pref: 'UI Designer · Design · Hồ Chí Minh · 15–20M · In office', file: 'CV_2026_final.docx', kind: 'thin', extracted: '2 experience · 1 skill', apps: 2, left: '19h', age: '5h', updated: '5 hours ago', hint: 'likely' },
    { name: 'Hồ Nhật Minh', basic: 'Male · 22/01/1997 · Vietnamese · Single · Bachelor · 4 yrs exp', contact: ['minh.ho@gmail.com', '0906 774 118'], pref: 'Business Analyst · IT · Hồ Chí Minh · 25–35M · Hybrid', file: 'cv-hnm.pdf', kind: 'thin', extracted: '1 experience · 2 skills', apps: 1, left: '21h', age: '3h', updated: '3 hours ago', hint: 'likely' },
    { name: 'Tạ Thu Phương', basic: 'Female · 05/05/1995 · Vietnamese · Married · Bachelor · 5 yrs exp', contact: ['phuong.ta@gmail.com', '0919 220 553'], pref: 'Chief Accountant · Accounting · Hà Nội · 20–28M · In office', file: 'resume_scan.jpg.pdf', kind: 'tech', extracted: 'No readable content — image scan', apps: 0, left: '—', age: '8h', updated: '8 hours ago', hint: 'likely' },
    { name: 'Đỗ Thanh Hà', basic: 'Female · 25/12/1996 · Vietnamese · Single · Bachelor · 4 yrs exp', contact: ['ha.do@gmail.com', '0967 004 512'], pref: 'Product Designer · Design · Hồ Chí Minh · 20–30M · Hybrid', file: 'portfolio-2026.pdf', kind: 'thin', extracted: '0 experience · 0 skills', apps: 3, left: 'auto-sent', age: '6d', updated: '6 days ago', hint: 'likely' },
    { name: 'Chu Văn Sơn', basic: 'Male · 30/11/1994 · Vietnamese · Married · College · 6 yrs exp', contact: ['son.chu@gmail.com', '0972 118 004'], pref: 'Sales Manager · Sales · Đà Nẵng · 20–30M · In office', file: 'bang-gia-2026.pdf', kind: 'thin', extracted: '0 experience · 0 skills', apps: 1, left: 'auto-sent', age: '2d', updated: '2 days ago', hint: 'unlikely' },
    { name: 'Ngô Bảo Khánh', basic: 'Male · 14/07/2001 · Vietnamese · Single · College · 1 yr exp', contact: ['khanh.ngo@gmail.com', '0333 908 117'], pref: 'Sales Staff · Sales · Cần Thơ · 8–12M · In office', file: 'menu_final.pdf', kind: 'thin', extracted: '0 experience · 0 skills', apps: 0, left: '—', age: '2m', updated: '2 months ago', hint: 'unlikely' },
    { name: 'Vương Gia Bảo', basic: 'Male · 08/08/2002 · Vietnamese · Single · Student · 0 yrs exp', contact: ['bao.vuong@gmail.com', '0388 550 226'], pref: 'Marketing Intern · Marketing · Hồ Chí Minh · Negotiable · In office', file: 'bai-tap-lon.docx', kind: 'thin', extracted: '0 experience · 1 skill', apps: 0, left: '—', age: '4d', updated: '4 days ago', hint: 'unlikely' },
    { name: 'Lý Khánh Vy', basic: 'Female · 17/03/2000 · Vietnamese · Single · Bachelor · 2 yrs exp', contact: ['vy.ly@gmail.com', '0903 887 441'], pref: 'Graphic Designer · Design · Hồ Chí Minh · 15–22M · Hybrid', file: 'CV-KhanhVy-design.pdf', kind: 'thin', extracted: '0 experience · 2 skills', apps: 4, left: '11h', age: '13h', updated: '13 hours ago', hint: 'likely' },
    { name: 'Mai Tuấn Kiệt', basic: 'Male · 12/09/1991 · Vietnamese · Married · Master · 9 yrs exp', contact: ['kiet.mai@gmail.com', '0908 330 776'], pref: 'Solution Architect · IT · Hồ Chí Minh · 60–80M · Remote', file: 'cv_scan_2026.pdf', kind: 'tech', extracted: 'No readable content — image scan', apps: 2, left: 'sent normally', age: '1d', updated: '1 day ago', hint: 'likely' },
    /* ── resolved: approved by a human ─────────────────────────────────────── */
    { name: 'Bùi Thanh Tùng', basic: 'Male · 02/04/1995 · Vietnamese · Married · Bachelor · 5 yrs exp', contact: ['tung.bui@gmail.com', '0901 447 882'], pref: 'Backend Engineer · IT · Hồ Chí Minh · 35–45M · Hybrid', file: 'tung-cv-scan.pdf', kind: 'tech', extracted: 'No readable content — image scan', apps: 2, left: 'sent', age: '—', updated: '1 day ago', hint: 'likely', state: 'approved', by: 'Hà (ops)' },
    { name: 'Phan Mỹ Duyên', basic: 'Female · 11/11/1998 · Vietnamese · Single · Bachelor · 3 yrs exp', contact: ['duyen.phan@gmail.com', '0938 220 114'], pref: 'HR Executive · HR · Hà Nội · 15–20M · In office', file: 'CV-Duyen.pdf', kind: 'thin', extracted: '2 experience · 2 skills', apps: 1, left: 'sent', age: '—', updated: '3 days ago', hint: 'likely', state: 'approved', by: 'Nam (ops)' },
    /* ── resolved: rejected by a human, with the reason CODE that makes the set
         countable — “parser failed” is a bug report against the scan ─────────── */
    { name: 'Trịnh Quốc Anh', basic: 'Male · 20/06/1993 · Vietnamese · Single · Bachelor · 7 yrs exp', contact: ['anh.trinh@gmail.com', '0977 003 221'], pref: 'Project Manager · IT · Hồ Chí Minh · 40–55M · Hybrid', file: 'bao-gia-thang-8.pdf', kind: 'thin', extracted: '0 experience · 0 skills', apps: 0, left: '—', age: '—', updated: '2 days ago', hint: 'unlikely', state: 'rejected', by: 'Hà (ops)', reason: 'Not a CV' },
    { name: 'Nguyễn Hải Yến', basic: 'Female · 03/03/1997 · Vietnamese · Single · Bachelor · 4 yrs exp', contact: ['yen.nguyen@gmail.com', '0912 550 883'], pref: 'Content Lead · Marketing · Hà Nội · 25–32M · Remote', file: 'yen-cv-2col.pdf', kind: 'thin', extracted: '0 experience · 1 skill', apps: 3, left: 'recalled', age: '—', updated: '4 days ago', hint: 'likely', state: 'rejected', by: 'Nam (ops)', reason: 'CV but not enough information' },
    { name: 'Đinh Công Danh', basic: 'Male · 15/02/1990 · Vietnamese · Married · College · 8 yrs exp', contact: ['danh.dinh@gmail.com', '0908 117 665'], pref: 'Driver · Logistics · Bình Dương · 10–14M · In office', file: 'cv-danh-copy.pdf', kind: 'thin', extracted: '1 experience · 0 skills', apps: 1, left: 'recalled', age: '—', updated: '1 week ago', hint: 'unlikely', state: 'rejected', by: 'Hà (ops)', reason: 'Not a CV' },
    /* more APPROVED cases — the operator opened the file and found a real CV.
       The last one is the second source: a Qualified CV an employer reported,
       reviewed, and kept. */
    { name: 'Võ Hoàng Long', basic: 'Male · 27/07/1994 · Vietnamese · Single · Bachelor · 6 yrs exp', contact: ['long.vo@gmail.com', '0903 662 118'], pref: 'Data Engineer · IT · Hồ Chí Minh · 40–50M · Remote', file: 'long-cv-scan-2026.pdf', kind: 'tech', extracted: 'No readable content — image scan', apps: 0, left: '—', updated: '2 days ago', age: '—', hint: 'likely', state: 'approved', by: 'Hà (ops)' },
    { name: 'Cao Thị Mai', basic: 'Female · 09/12/1996 · Vietnamese · Married · College · 4 yrs exp', contact: ['mai.cao@gmail.com', '0977 441 220'], pref: 'Kế toán tổng hợp · Accounting · Đà Nẵng · 14–18M · In office', file: 'CV_Mai_2cot.pdf', kind: 'thin', extracted: '3 experience · 1 skill', apps: 4, left: 'sent', age: '—', updated: '5 days ago', hint: 'likely', state: 'approved', by: 'Nam (ops)' },
    { name: 'Hoàng Anh Tuấn', basic: 'Male · 18/08/1992 · Vietnamese · Married · Master · 8 yrs exp', contact: ['tuan.hoang@gmail.com', '0912 003 887'], pref: 'Sales Director · Sales · Hà Nội · 50–70M · Hybrid', file: 'tuan-profile.pdf', kind: 'thin', extracted: '4 experience · 9 skills', apps: 2, left: 'sent', age: '—', updated: '6 days ago', hint: 'likely', state: 'approved', by: 'Hà (ops)', via: 'report' },
    /* more REJECTED cases — every reason code represented, so the view can be
       read as the training set it is meant to be. */
    { name: 'Lương Bảo Ngọc', basic: 'Female · 04/09/1999 · Vietnamese · Single · Bachelor · 2 yrs exp', contact: ['ngoc.luong@gmail.com', '0908 774 003'], pref: 'Marketing Executive · Marketing · Hồ Chí Minh · 18–24M · Hybrid', file: 'ngoc-cv.pdf', kind: 'thin', extracted: '5 experience · 12 skills', apps: 2, left: 'recalled', age: '—', updated: '3 days ago', hint: 'likely', state: 'rejected', by: 'Nam (ops)', reason: 'Not a CV', via: 'report' },
    { name: 'Tô Minh Quân', basic: 'Male · 21/05/1991 · Vietnamese · Single · College · 5 yrs exp', contact: ['quan.to@gmail.com', '0933 118 442'], pref: 'Security Guard · Operations · Bình Dương · 9–12M · In office', file: 'quan-scan.pdf', kind: 'tech', extracted: 'No readable content — image scan', apps: 0, left: '—', age: '—', updated: '1 week ago', hint: 'unlikely', state: 'rejected', by: 'Hà (ops)', reason: 'Can’t read' },
    { name: 'Hà Kiều Trang', basic: 'Female · 30/01/2000 · Vietnamese · Single · Bachelor · 1 yr exp', contact: ['trang.ha@gmail.com', '0966 220 771'], pref: 'Translator · Education · Hà Nội · 12–16M · Remote', file: 'trang-cv-1trang.pdf', kind: 'thin', extracted: '0 experience · 3 skills', apps: 1, left: 'recalled', age: '—', updated: '1 week ago', hint: 'likely', state: 'rejected', by: 'Nam (ops)', reason: 'CV but not enough information' },
    { name: 'Phạm Gia Huy', basic: 'Male · 12/12/2001 · Vietnamese · Single · Student · 0 yrs exp', contact: ['huy.pham@gmail.com', '0388 117 550'], pref: 'Intern · IT · Hồ Chí Minh · Negotiable · In office', file: 'anh-the-3x4.pdf', kind: 'thin', extracted: '0 experience · 0 skills', apps: 0, left: '—', age: '—', updated: '2 weeks ago', hint: 'unlikely', state: 'rejected', by: 'Hà (ops)', reason: 'Not a CV' },
  ]
  const stateOf = (r: CvCheckRow) => decided[r.name] ?? r.state ?? 'doubt'
  /* One click: write the status, then say what it did. The toast carries the two
     things the dialog was there for — the consequences the row cannot show, and
     the empty-extraction caveat — plus the Undo that makes skipping the
     confirmation safe. */
  const approveNow = (r: CvCheckRow) => {
    const undoing = stateOf(r) === 'rejected'
    setDecided((d) => ({ ...d, [r.name]: 'approved' }))
    setToast({
      msg: undoing ? `Đã bỏ từ chối — ${r.name}` : `Đã duyệt CV — ${r.name}`,
      sub: r.apps
        ? `CV → Qualified · ${r.apps} đơn đang chờ đã gửi tới NTD · vào tìm kiếm CV nếu ứng viên đã bật.`
        : 'CV → Qualified · vào tìm kiếm CV nếu ứng viên đã bật. Ứng viên không nhận thông báo nào.',
      warn: /no readable content|0 experience · 0 skills/i.test(r.extracted ?? '')
        ? 'Không trích xuất được nội dung — CV sẽ không xuất hiện khi NTD tìm theo kỹ năng. Nên nhắc ứng viên tải lên bản PDF dạng văn bản.'
        : undefined,
      onUndo: () => setDecided((d) => { const n = { ...d }; delete n[r.name]; return n }),
    })
  }
  const shown = raw.filter((r) => stateOf(r) === view)
  const rows = shown.map((r, i) => [
    <span onClick={() => setOpen(r)} className="min-w-0 cursor-pointer truncate text-brand hover:underline">{r.name}</span>,
    <div className="min-w-0">
      <p onClick={() => setOpen(r)} className="cursor-pointer truncate font-medium text-brand hover:underline" title="Opens the CV file — PII action, logged">{r.file}</p>
      <Pill tone="draft">Upload</Pill>
    </div>,
    <TwoLine top={split2(r.basic, 3)[0]} bottom={split2(r.basic, 3)[1]} />,
    <TwoLine top={split2(r.pref, 2)[0]} bottom={split2(r.pref, 2)[1]} />,
    <TwoLine top={r.contact[0]} bottom={r.contact[1]} />,
    /* Same columns as Talent pool — the one status, its derived application
       status (with what this decision releases), and the derived search cell
       with how long the row has sat. */
    stateOf(r) === 'doubt'
      ? <Pill tone={r.kind === 'tech' ? 'draft' : 'pending'}>{r.kind === 'tech' ? "Can't read" : 'Not enough information'}</Pill>
      : (
        <div className="min-w-0">
          <Pill tone={stateOf(r) === 'approved' ? 'active' : 'rejected'}>{stateOf(r) === 'approved' ? 'Qualified' : 'Rejected'}</Pill>
          {/* who decided, and — for a rejection — the CODE. The code is the whole
              point of keeping resolved rows: it is what makes thirty of them
              countable instead of thirty separate anecdotes. */}
          <p className="mt-0.5 truncate text-[10.5px] text-faint" title={[r.by, r.reason, r.via === 'report' ? 'reported by employer' : ''].filter(Boolean).join(' · ')}>
            {r.by}{r.reason ? ` · ${r.reason}` : ''}{r.via === 'report' ? ' · reported' : ''}
          </p>
        </div>
      ),
    r.apps === 0
      ? <span className="text-faint" title="No applications made with this CV">—</span>
      : <TwoLine top={`Not sent · ${r.apps} apps`} bottom={r.left.startsWith('sent') || r.left.startsWith('auto') ? r.left : `đã đợi ${r.left}`} />,
    stateOf(r) === 'doubt'
      ? (
        <div className="min-w-0">
          <Pill tone="pending">Hidden</Pill>
          <p className="mt-0.5 truncate text-[10.5px] text-faint">waiting {r.age}</p>
        </div>
      )
      : <Pill tone={stateOf(r) === 'approved' ? 'active' : 'draft'}>{stateOf(r) === 'approved' ? 'Showing' : 'Hidden'}</Pill>,
    <span className="truncate text-amber-700">{r.extracted}</span>,
    <span className="text-muted">{r.updated}</span>,
    <div className="relative flex items-center justify-end">
      <button
        onClick={() => setMenu(menu === i ? null : i)}
        className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md border text-[15px] leading-none text-muted', menu === i ? 'border-line bg-canvas' : 'border-transparent hover:border-line hover:bg-canvas')}
      >⋯</button>
      {menu === i && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} />
          <div className="absolute right-0 top-8 z-30 w-[360px] overflow-hidden rounded-xl border border-line bg-surface py-1 text-left shadow-lg">
            {/* TWO ACTIONS, and nothing else. The menu used to carry the whole
                reject form — a reason list, a message box and a note, inside a
                360px dropdown — which is where a menu stops being a menu. It now
                answers one question (approve or reject) and the REJECT DIALOG asks
                the rest, where there is room to read what the candidate will get
                before sending it.

                A RESOLVED row offers only the opposite verb: the useful action on
                a decided CV is undoing it, and re-applying the verdict it already
                carries is a no-op that only invites a mis-click. Opening the CV
                lives on the file name itself, not in here. */}
            {stateOf(r) !== 'approved' && (
              <button onClick={() => { setMenu(null); approveNow(r) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-emerald-700 hover:bg-canvas">
                <span className="w-3.5 text-center">✓</span>
                {/* NO ELLIPSIS, unlike Reject — the punctuation is the promise.
                    "…" means a step follows; this one acts on the click. */}
                <span className="flex-1">{stateOf(r) === 'rejected' ? 'Approve CV — undo the rejection' : 'Approve CV'}</span>
                <span className="shrink-0 text-[10px] text-faint">→ Qualified · Sent · Showing</span>
              </button>
            )}
            {stateOf(r) !== 'rejected' && (
              <button onClick={() => { setMenu(null); setReject(r) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-rose-600 hover:bg-canvas">
                <span className="w-3.5 text-center">✕</span>
                <span className="flex-1">Reject CV…</span>
                <span className="shrink-0 text-[10px] text-faint">chọn lý do ở bước sau</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>,
  ])
  return (
    <div>
      <p className="mb-2.5 rounded-lg border border-line bg-canvas/50 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
        Every CV a HUMAN has touched — the open queue plus both outcomes. A CV the scan qualified never appears here; it goes straight to{' '}
        <b className="font-semibold text-ink/80">Talent pool</b>. That is what keeps this list finite and every row a decision worth learning from.{' '}
        <b className="font-semibold text-ink/80">Cần duyệt</b> is the only count that is work, and the only one that should reach zero.{' '}
        <b className="font-semibold text-ink/80">Đã duyệt</b> and <b className="font-semibold text-ink/80">Đã từ chối</b> are kept so a call can be
        rechecked in bulk and undone where it was made — rejection is the one verdict the scan is never allowed to write, so it is the one most worth auditing.
        Uploaded PDFs only; a Saramin CV is arithmetic over typed fields and never lands here. The call is almost always{' '}
        <b className="font-semibold text-ink/80">“not a CV” vs “our parser failed on this layout”</b>, which is why{' '}
        the three reject reasons reuse the scan’s own words, so a rejection reads as the reviewer ANSWERING the scan rather than as a separate vocabulary.
        Approve resolves the CV <b className="font-semibold text-ink/80">and every application waiting on it</b>; applications on a doubt CV read <b className="font-semibold text-ink/80">Not sent</b> and
        wait for this decision — nothing releases them on its own, so every hour a row sits here is an hour a candidate’s applications are going nowhere.
      </p>
      <ListPage
        minW={2200}
        total={shown.length}
        searchHint="Search candidate, file…"
        leading={
          /* Three views, not three screens. Only the FIRST count is work — it is
             the number that should reach zero, so the other two are deliberately
             quieter and never enter the nav badge. */
          <span className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12px] font-medium">
            {([
              ['doubt', 'Cần duyệt', raw.filter((r) => stateOf(r) === 'doubt').length],
              ['approved', 'Đã duyệt', raw.filter((r) => stateOf(r) === 'approved').length],
              ['rejected', 'Đã từ chối', raw.filter((r) => stateOf(r) === 'rejected').length],
            ] as const).map(([k, label, n]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={cn('rounded-md px-3 py-1 transition-colors', view === k ? 'bg-brand text-white' : 'text-muted hover:text-ink')}
              >
                {label} <span className={cn('ml-0.5 tabular-nums', view === k ? 'text-white/70' : 'text-faint')}>{n}</span>
              </button>
            ))}
          </span>
        }
        cols={CV_COLS.filter((c) => c.label !== 'Unlocks')}
        rows={rows}
      />
      {open && <CvCheckDetail row={open} onClose={() => setOpen(null)} />}
      {reject && <RejectDialog name={reject.name} file={reject.file} extracted={reject.extracted} apps={reject.apps} onClose={() => setReject(null)} />}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function CvCheckDetail({ row, onClose }: { row: CvCheckRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[600px] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[14px] font-bold text-ink">{row.name}<Pill tone="pending">Awaiting review</Pill></p>
            <p className="truncate text-[11px] text-muted">{row.file} · waiting {row.age} · {row.apps} application(s) waiting</p>
          </div>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-canvas/30 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">Original file</p>
            <div className="grid h-44 place-items-center rounded-md border border-dashed border-line text-[11px] text-faint">PDF preview — opening the file is a PII action and is logged</div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">What we extracted</p>
              <p className={cn('rounded-md border px-2 py-1.5 text-[11.5px]', row.kind === 'tech' ? 'border-line bg-canvas/60 text-muted' : 'border-amber-200 bg-amber-50 text-amber-800')}>
                {row.extracted}{row.kind === 'thin'  && ' — below the minimum (≥1 experience and ≥3 skills)'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">The only question</p>
              <p className="text-[11.5px] leading-relaxed text-ink/80">
                Is this a real CV? {row.kind === 'tech'
                  ? 'We could not read the content, but opening the file will tell you.'
                  : 'We read it fine, but the content is below the minimum.'}
              </p>
              <p className="mt-1 text-[10.5px] text-faint">{row.hint === 'likely' ? 'Hint: multi-column / designed layout — most likely a real CV our parser missed.' : 'Hint: nothing here looks like a CV.'}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-faint">This decision affects</p>
              <ul className="space-y-1 text-[11px] text-ink/80">
                <li>· Whether this CV enters employer CV search</li>
                <li>· {row.apps} waiting application(s) — all released, or all recalled</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="text-[10.5px] text-faint">
            {row.kind === 'tech'
              ? 'Applications stay Not sent until you decide — opening the file is usually enough.'
              : 'Waiting applications go nowhere until this CV has a verdict — the decision is about the CV, and it releases all of them at once.'}
          </span>
          <div className="flex shrink-0 gap-2 whitespace-nowrap">
            <button onClick={onClose} className="rounded-lg border border-rose-300 px-3 py-1.5 text-[12.5px] font-semibold text-rose-600">Reject → Not sent</button>
            <button onClick={onClose} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12.5px] font-semibold text-white">Approve → Sent + Showing</button>
          </div>
        </div>
      </div>
    </div>
  )
}
