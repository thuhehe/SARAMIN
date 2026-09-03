/*
 * ONE CV · TWO APPLICATIONS · ONE REJECTION — the version rule told as a story.
 *
 * The rule is a single sentence ("a reject recalls only the applications that
 * carry the rejected version"), and nobody believes a single sentence about a
 * case this tangled. So the page walks ONE concrete case end to end, and at every
 * step shows the same three things:
 *
 *   1. THE STATE — the CV (version · status) and each application (status ·
 *      which version it holds). Read the CV column down and it changes four
 *      times. Read Đơn #1 down and it NEVER changes. That contrast is the rule.
 *   2. THE LOGIC — which rule fired, in one or two lines, so a developer can
 *      map each step to a line of code and a tester to an assertion.
 *   3. WHO SEES WHAT — the actual UI fragment each party gets: the candidate's
 *      rows, the employer's row, the admin's row or dialog. Miniatures of the
 *      real mockups, same words, same colours, so the story and the screens
 *      cannot drift apart.
 *
 * Two framings are deliberately kept apart, because the client raised exactly
 * this: the ADMIN REJECTS THE CV — the whole record, the thing on the shelf, and
 * its status becomes Rejected. The VERSION is not what they act on; it is what
 * the system COMPARES, per application, to decide which deliveries to pull back.
 * The story shows both at once on the final steps: the CV reads Rejected on
 * every surface, and Đơn #1 reads Sent on every surface, and the version badge
 * is what makes those two facts sit together instead of looking like a bug.
 *
 * The case is an UPLOADED CV, on purpose. "Removing fields" on a Saramin CV drops
 * it to doubt too — but a Saramin CV in doubt never reaches an admin (the check is
 * arithmetic on typed fields), so it can never be Rejected through this path and
 * the earlier application is untouched by construction. The upload route is the
 * one where a human actually decides, so it is the one where the rule is
 * exercised — and the one where the dialog has to state the split.
 */
import { useState } from 'react'
import { cn } from '@/lib/utils'

/* Same pastels as the admin console, status for status. */
type Tone = 'ok' | 'doubt' | 'bad' | 'sent' | 'held' | 'stage' | 'none'
const TONE: Record<Tone, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  doubt: 'border-amber-200 bg-amber-50 text-amber-700',
  bad: 'border-rose-200 bg-rose-50 text-rose-700',
  sent: 'border-sky-200 bg-sky-50 text-sky-700',
  held: 'border-slate-200 bg-slate-100 text-slate-600',
  stage: 'border-violet-200 bg-violet-50 text-violet-700',
  none: 'border-dashed border-slate-300 bg-transparent text-slate-400',
}
function Chip({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-px text-[10px] font-medium leading-4', TONE[tone], className)}>{children}</span>
}

/* ── miniature UI fragments — the same words the real mockups use ─────────── */
function Panel({ who, tone, children }: { who: string; tone: 'js' | 'co' | 'ad'; children: React.ReactNode }) {
  const bar = { js: 'border-l-brand', co: 'border-l-violet-400', ad: 'border-l-slate-400' }[tone]
  return (
    <div className={cn('min-w-0 rounded-md border border-line border-l-[3px] bg-surface p-2', bar)}>
      <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wide text-faint">{who}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}
function Nothing({ children = 'Không có gì thay đổi' }: { children?: React.ReactNode }) {
  return <p className="rounded border border-dashed border-line px-2 py-1.5 text-[10.5px] italic text-faint">— {children}</p>
}
/** Jobseeker · My CVs row */
function MyCv({ meta, ver, chip, why, cta }: { meta: string; ver?: number; chip?: string; why?: string; cta?: string }) {
  return (
    <div className="rounded border border-line px-2 py-1.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
        <span>📄</span><span className="truncate">CV_TranMinhAnh.pdf</span>
        {chip && <Chip tone="bad" className="ml-auto">{chip}</Chip>}
      </p>
      <p className="text-[10px] text-faint">{meta}{ver && ver > 1 ? <span className="text-slate-500"> · v.{ver} <span className="text-faint">(đã thay {ver - 1} lần)</span></span> : null}</p>
      {why && <p className="mt-1 text-[10px] leading-snug text-rose-700/80">{why}</p>}
      {cta && <span className="mt-1 inline-block rounded border border-line px-1.5 py-px text-[10px] text-ink">{cta} →</span>}
    </div>
  )
}
/** Jobseeker · My applications row */
function MyApp({ job, co, chip, tone, note }: { job: string; co: string; chip: string; tone: Tone; note?: string }) {
  return (
    <div className="rounded border border-line px-2 py-1.5">
      <p className="flex items-center gap-1.5 text-[11px] text-ink"><span className="truncate font-medium">{job}</span><span className="text-faint">· {co}</span><Chip tone={tone} className="ml-auto">{chip}</Chip></p>
      {note && <p className="mt-0.5 text-[10px] leading-snug text-faint">{note}</p>}
    </div>
  )
}
/** Employer · Applicants row */
function CoRow({ stage, doc }: { stage: string; doc: string }) {
  return (
    <div className="rounded border border-line px-2 py-1.5">
      <p className="flex items-center gap-1.5 text-[11px] text-ink"><span className="font-medium">Trần Minh Anh</span><span className="truncate text-faint">· CV_TranMinhAnh.pdf</span><Chip tone="stage" className="ml-auto">{stage}</Chip></p>
      <p className="mt-0.5 text-[10px] text-faint">Mở CV → <span className="text-ink/70">{doc}</span></p>
    </div>
  )
}
/** Admin · Applicants row — CV status · application status · stage */
function AdApp({ co, ver, behind, cv, cvTone, app, appTone, stage }: { co: string; ver?: number; behind?: number; cv: string; cvTone: Tone; app: string; appTone: Tone; stage?: string }) {
  return (
    <div className="rounded border border-line px-2 py-1.5">
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10.5px] text-ink">
        <span className="font-medium">{co}</span>
        <span className="text-faint">· CV_TranMinhAnh.pdf</span>
        {behind ? (
          <span className="rounded border border-line bg-canvas px-1 text-[9.5px] text-muted">v.{ver}/{behind}</span>
        ) : <span className="text-[9.5px] font-medium text-ink/70">v.{ver ?? 1}/{ver ?? 1}</span>}
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
        <span className="text-faint">CV</span><Chip tone={cvTone}>{cv}</Chip>
        <span className="ml-1 text-faint">Đơn</span><Chip tone={appTone}>{app}</Chip>
        <span className="ml-1 text-faint">Stage</span>{stage ? <Chip tone="stage">{stage}</Chip> : <span className="text-faint">—</span>}
      </p>
    </div>
  )
}
/** Admin · CV review queue row */
function AdQueue({ ver, apps, extracted }: { ver: number; apps: number; extracted: string }) {
  return (
    <div className="rounded border border-amber-200 bg-amber-50/40 px-2 py-1.5">
      <p className="flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-ink"><span className="font-medium">CV review · Cần duyệt</span><span className="text-faint">· CV_TranMinhAnh.pdf</span><span className="text-[9.5px] font-medium text-ink/70">v.{ver}/{ver}</span></p>
      <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px]"><Chip tone="doubt">Not enough information</Chip><span className="text-muted">{extracted}</span><span className="text-muted">· {apps ? `${apps} đơn dùng v.${ver}` : `chưa dùng v.${ver} để ứng tuyển`}</span></p>
    </div>
  )
}
/** Admin · the reject dialog in miniature. No consequence block any more (client,
    2026-09-03): the row's “Dùng để ứng tuyển” already counts the applications on
    the version being judged, so the dialog is the form plus one footer sentence. */
function AdDialog() {
  return (
    <div className="rounded border border-rose-200 bg-surface">
      <p className="border-b border-line-soft px-2 py-1 text-[10.5px] font-bold text-ink">Từ chối CV — Trần Minh Anh <span className="font-normal text-faint">· CV_TranMinhAnh.pdf · <b className="font-semibold text-ink/80">v.2/2</b> · CV but not enough information</span></p>
      <p className="px-2 py-1 text-[9.5px] leading-snug text-faint">Quyết định áp lên CV — chỉ chạm vào đơn dùng v.2 (cột “Dùng để ứng tuyển”: 1 đơn, Tiki). Đơn FPT dùng v.1 không đổi. Thu hồi: 0.</p>
    </div>
  )
}

/* ── the story ────────────────────────────────────────────────────────────── */
type Cell = { label: string; tone: Tone; sub?: string }
type Step = {
  date: string
  actor: 'Ứng viên' | 'NTD' | 'Admin' | 'Hệ thống'
  title: string
  event: string
  rule: string[]
  cv: Cell
  a1: Cell
  a2: Cell
  sees: { js: React.ReactNode; co: React.ReactNode; ad: React.ReactNode }
  star?: boolean
}

const NONE: Cell = { label: '—', tone: 'none' }
const A1_SENT: Cell = { label: 'Sent', tone: 'sent', sub: 'v.1' }

const STEPS: Step[] = [
  {
    date: '01/07', actor: 'Ứng viên', title: 'Tải CV lên — v.1',
    event: 'Minh Anh tải lên CV_TranMinhAnh.pdf, 2 trang. Hệ thống đọc được 3 kinh nghiệm · 8 kỹ năng.',
    rule: ['Quy tắc đủ điều kiện (≥1 kinh nghiệm/học vấn + ≥3 kỹ năng) → đạt → **Qualified**. Không cần người duyệt.', 'CV Qualified không bao giờ vào hàng đợi CV review.'],
    cv: { label: 'Qualified', tone: 'ok', sub: 'v.1' }, a1: NONE, a2: NONE,
    sees: {
      js: <MyCv meta="Tải lên 01/07/2026" />,
      co: <Nothing>Chưa có gì</Nothing>,
      ad: <Nothing>Không vào hàng đợi</Nothing>,
    },
  },
  {
    date: '05/07', actor: 'Ứng viên', title: 'Ứng tuyển FPT — Đơn #1 mang v.1',
    event: 'Ứng tuyển Senior Product Designer tại FPT Software bằng CV này.',
    rule: ['CV Qualified → đơn **Sent** ngay lập tức.', '**Đơn chụp lại (snapshot) v.1 tại thời điểm gửi.** Từ đây Đơn #1 nghĩa là “v.1”, dù CV sau này thay đổi thế nào.'],
    cv: { label: 'Qualified', tone: 'ok', sub: 'v.1' }, a1: A1_SENT, a2: NONE,
    sees: {
      js: <MyApp job="Senior Product Designer" co="FPT" chip="Đã gửi" tone="sent" note="Đã gửi tới nhà tuyển dụng" />,
      co: <CoRow stage="New" doc="v.1 · 2 trang · 3 kinh nghiệm · 8 kỹ năng" />,
      ad: <AdApp co="FPT Software" cv="Qualified" cvTone="ok" app="Sent" appTone="sent" stage="New" />,
    },
  },
  {
    date: '12/07', actor: 'NTD', title: 'FPT chuyển sang Interview',
    event: 'FPT đọc CV và hẹn phỏng vấn.',
    rule: ['Stage là của NTD — Saramin không can thiệp.', 'Có trong câu chuyện vì nó cho thấy NTD đã **đầu tư** vào đúng tài liệu này. Một lần thu hồi sai sẽ phá đúng cái này.'],
    cv: { label: 'Qualified', tone: 'ok', sub: 'v.1' }, a1: { ...A1_SENT, sub: 'v.1 · Interview' }, a2: NONE,
    sees: {
      js: <MyApp job="Senior Product Designer" co="FPT" chip="Interview" tone="stage" note="Interview scheduled — 15/07, 10:00" />,
      co: <CoRow stage="Interview" doc="v.1 — vẫn là tài liệu đã nhận" />,
      ad: <AdApp co="FPT Software" cv="Qualified" cvTone="ok" app="Sent" appTone="sent" stage="Interview" />,
    },
  },
  {
    date: '20/07', actor: 'Ứng viên', title: 'Thay file — v.2, mỏng hơn',
    event: 'Minh Anh thay file bằng một “bản rút gọn” 1 trang — với CV tải lên, đây chính là “xoá bớt trường”. Hệ thống đọc được 1 kinh nghiệm · 2 kỹ năng.',
    rule: ['Bản mới **luôn được quét lại** → không đạt (<3 kỹ năng) → **Not enough information**. CV tải lên đang nghi ngờ → **vào hàng đợi CV review**.', 'Đơn #1 là snapshot của v.1 → **không đổi**. FPT vẫn giữ bản 2 trang. Trạng thái nghi ngờ **không bao giờ thu hồi** gì.'],
    cv: { label: 'Not enough information', tone: 'doubt', sub: 'v.2' }, a1: { ...A1_SENT, sub: 'v.1 · Interview' }, a2: NONE,
    sees: {
      js: <><MyCv meta="Cập nhật 20/07/2026" ver={2} /><p className="text-[10px] italic text-faint">Không chip, không “chờ duyệt” — nghi ngờ trên CV tải lên là việc của chúng ta, ứng viên không thấy.</p></>,
      co: <CoRow stage="Interview" doc="v.1 — FPT không được báo, và không cần được báo" />,
      ad: <AdQueue ver={2} apps={0} extracted="1 experience · 2 skills" />,
    },
  },
  {
    date: '21/07', actor: 'Ứng viên', title: 'Ứng tuyển Tiki — Đơn #2 bị giữ lại',
    event: 'Ứng tuyển Product Designer tại Tiki bằng cùng CV (nay là v.2).',
    rule: ['CV đang nghi ngờ → đơn **Not sent** (giữ lại). Không có gì tự gửi; chờ admin.', 'Ứng viên không được báo là đơn đang bị giữ — đây là cái giá đã chấp nhận để không đổ lỗi cho họ về parser của mình.'],
    cv: { label: 'Not enough information', tone: 'doubt', sub: 'v.2' }, a1: { ...A1_SENT, sub: 'v.1 · Interview' }, a2: { label: 'Not sent', tone: 'held', sub: 'giữ lại · chờ duyệt' },
    sees: {
      js: <MyApp job="Product Designer" co="Tiki" chip="Đã nộp" tone="sent" note="Đơn của bạn đã được nộp — cách “Đã gửi” một bước, và ứng viên không phân biệt được" />,
      co: <Nothing>Tiki chưa nhận gì</Nothing>,
      ad: <><AdQueue ver={2} apps={1} extracted="1 experience · 2 skills" /><AdApp co="Tiki" cv="Not enough information" cvTone="doubt" app="Not sent" appTone="held" /></>,
    },
  },
  {
    date: '22/07', actor: 'Admin', title: 'Hà từ chối CV — “CV but not enough information”', star: true,
    event: 'Hà mở v.2. Đúng là CV thật, nhưng thật sự chỉ có 1 kinh nghiệm, 2 kỹ năng — quá mỏng để gửi. Từ chối, lý do “CV but not enough information”.',
    rule: ['**Từ chối áp lên CV** — cả CV, trạng thái → **Rejected**. Đây là điều admin làm.', 'Rồi **từng đơn, một phép so sánh**: version của đơn có bằng version đang bị xét (v.2) không? Đây là điều hệ thống làm.', 'Đơn #1: v.1 ≠ v.2 → **Giữ nguyên** (Sent). Đơn #2: chưa gửi → **Không được gửi**. **Thu hồi: 0** — chưa có gì được gửi bằng v.2.'],
    cv: { label: 'Rejected', tone: 'bad', sub: 'v.2' }, a1: { label: 'Sent', tone: 'sent', sub: 'v.1 · Interview · giữ nguyên ✓' }, a2: { label: 'Not sent', tone: 'bad', sub: 'không được gửi · chốt' },
    sees: {
      js: <Nothing>Xem bước sau</Nothing>,
      co: <Nothing>Xem bước sau</Nothing>,
      ad: <AdDialog />,
    },
  },
  {
    date: '22/07', actor: 'Hệ thống', title: 'Sau quyết định — ba phía nhìn thấy gì',
    event: 'Cùng một CV, hai đơn, hai kết quả. CV đọc là Rejected ở mọi nơi; Đơn #1 đọc là Sent ở mọi nơi. Huy hiệu version là thứ làm hai điều đó đứng cạnh nhau mà không giống lỗi.',
    rule: ['My CVs: chip từ chối trên **CV** — cả CV, đúng như admin đã làm.', 'My applications: FPT **Interview** không đổi; Tiki **Không được gửi** với lời nhắn admin soạn.', 'FPT: **không có gì đổi**, không được báo. Admin Applicants: hàng “Rejected · Sent · Interview” + `v.1/2` — hàng duy nhất trông như lỗi nếu thiếu huy hiệu.'],
    cv: { label: 'Rejected', tone: 'bad', sub: 'v.2' }, a1: { label: 'Sent', tone: 'sent', sub: 'v.1 · Interview' }, a2: { label: 'Not sent', tone: 'bad', sub: 'chốt' },
    sees: {
      js: <>
        <MyCv meta="Cập nhật 20/07/2026" ver={2} chip="Chưa được duyệt — Thiếu thông tin" why="Hồ sơ chưa đủ thông tin để gửi tới nhà tuyển dụng. Bạn bổ sung kinh nghiệm làm việc và ít nhất 3 kỹ năng giúp nhé." cta="Tải lên CV khác" />
        <MyApp job="Senior Product Designer" co="FPT" chip="Interview" tone="stage" note="Không đổi — đơn này mang v.1" />
        <MyApp job="Product Designer" co="Tiki" chip="Không được gửi" tone="bad" note="Hồ sơ chưa đủ thông tin — cập nhật hồ sơ rồi ứng tuyển lại" />
      </>,
      co: <CoRow stage="Interview" doc="v.1 — y như ngày 05/07. FPT không biết, và không cần biết, có v.2." />,
      ad: <>
        <AdApp co="FPT Software" ver={1} behind={2} cv="Rejected" cvTone="bad" app="Sent" appTone="sent" stage="Interview" />
        <AdApp co="Tiki" ver={2} cv="Rejected" cvTone="bad" app="Not sent" appTone="bad" />
      </>,
    },
  },
]

/* **bold** and `code` inside the rule strings — a splitter, not innerHTML, so the
   component keeps the site's no-HTML-in-data stance even for its own constants. */
function Mark({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, k) =>
        p.startsWith('**') ? <b key={k} className="font-semibold text-ink">{p.slice(2, -2)}</b>
          : p.startsWith('`') ? <code key={k} className="rounded bg-canvas px-1 text-[10px]">{p.slice(1, -1)}</code>
          : <span key={k}>{p}</span>,
      )}
    </>
  )
}

function StateCell({ c, dim }: { c: Cell; dim?: boolean }) {
  return (
    <div className={cn('min-w-0', dim && 'opacity-60')}>
      <Chip tone={c.tone}>{c.label}</Chip>
      {c.sub && <p className="mt-0.5 text-[9.5px] leading-tight text-faint">{c.sub}</p>}
    </div>
  )
}

export function CvVersionStory() {
  const [i, setI] = useState(5)
  const s = STEPS[i]
  return (
    <div className="mt-2 rounded-xl border border-line bg-canvas/40 p-3">
      {/* cast */}
      <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted">
        <span><b className="font-semibold text-ink/80">Ứng viên</b> Trần Minh Anh</span>
        <span><b className="font-semibold text-ink/80">CV</b> CV_TranMinhAnh.pdf (tải lên)</span>
        <span><b className="font-semibold text-ink/80">Đơn #1</b> FPT Software</span>
        <span><b className="font-semibold text-ink/80">Đơn #2</b> Tiki</span>
        <span><b className="font-semibold text-ink/80">Admin</b> Hà (ops)</span>
      </p>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ── the timeline: every step with its state, readable without a click ── */}
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <div className="grid grid-cols-[52px_minmax(0,1fr)_100px_96px_96px] items-center gap-2 border-b border-line bg-canvas/60 px-2 py-1.5 text-[9.5px] font-bold uppercase tracking-wide text-faint">
            <span>Ngày</span><span>Sự kiện</span><span>CV</span><span>Đơn #1 FPT</span><span>Đơn #2 Tiki</span>
          </div>
          {STEPS.map((st, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={cn('grid w-full grid-cols-[52px_minmax(0,1fr)_100px_96px_96px] items-start gap-2 border-b border-line-soft px-2 py-2 text-left last:border-b-0', k === i ? 'bg-brand/5' : 'hover:bg-canvas/60')}
            >
              <span className="pt-px text-[10.5px] font-semibold text-ink/70">{st.date}</span>
              <span className="min-w-0">
                <span className={cn('block truncate text-[11px]', k === i ? 'font-semibold text-ink' : 'text-ink/85')}>{st.star && <span className="mr-1 text-amber-500">★</span>}{st.title}</span>
                <span className="block text-[9.5px] text-faint">{st.actor}</span>
              </span>
              <StateCell c={st.cv} />
              <StateCell c={st.a1} dim={st.a1.tone === 'none'} />
              <StateCell c={st.a2} dim={st.a2.tone === 'none'} />
            </button>
          ))}
          <p className="border-t border-line bg-canvas/40 px-2 py-1.5 text-[10px] leading-snug text-muted">
            Đọc cột <b className="font-semibold text-ink/80">CV</b> từ trên xuống: đổi bốn lần. Đọc cột <b className="font-semibold text-ink/80">Đơn #1</b>: <b className="font-semibold text-ink/80">không đổi một lần nào</b>. Đó là toàn bộ quy tắc.
          </p>
        </div>

        {/* ── the selected step in full ── */}
        <div className="min-w-0 space-y-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-faint">Bước {i + 1} · {s.date} · {s.actor}</p>
            <p className="text-[13px] font-bold text-ink">{s.star && <span className="mr-1 text-amber-500">★</span>}{s.title}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink/80">{s.event}</p>
          </div>
          <div className="rounded-md border border-line bg-surface p-2">
            <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-faint">Logic — quy tắc nào chạy</p>
            <ul className="space-y-1">
              {s.rule.map((r, k) => (
                <li key={k} className="flex gap-1.5 text-[11px] leading-snug text-ink/85">
                  <span className="shrink-0 text-faint">›</span>
                  <span><Mark t={r} /></span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-faint">UI — ai thấy gì</p>
            <div className="grid gap-2 md:grid-cols-3">
              <Panel who="Ứng viên" tone="js">{s.sees.js}</Panel>
              <Panel who="NTD" tone="co">{s.sees.co}</Panel>
              <Panel who="Admin" tone="ad">{s.sees.ad}</Panel>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-md border border-line px-2.5 py-1 text-[11px] text-ink disabled:opacity-40">← Bước trước</button>
            <span className="text-[10px] text-faint">{i + 1} / {STEPS.length}</span>
            <button disabled={i === STEPS.length - 1} onClick={() => setI(i + 1)} className="rounded-md border border-line px-2.5 py-1 text-[11px] text-ink disabled:opacity-40">Bước sau →</button>
          </div>
        </div>
      </div>

      {/* ── the two variants a reader will ask about next ── */}
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-md border border-line bg-surface p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-faint">Biến thể — khi nào mới có <span className="text-rose-600">Thu hồi</span></p>
          <p className="mt-1 text-[11px] leading-snug text-ink/80">
            Giả sử v.2 <b className="font-semibold">vẫn đạt</b> quy tắc (3 kỹ năng, ít kinh nghiệm) → Qualified → Đơn #2 <b className="font-semibold">Sent</b> tới Tiki. Tiki mở ra, thấy nội dung không phải CV thật, <b className="font-semibold">báo cáo</b>. Hà xét v.2 → từ chối “Not a CV”.
            Lúc này Đơn #2 mang đúng v.2 → <b className="font-semibold text-rose-600">Thu hồi</b>. Đơn #1 vẫn mang v.1 → <b className="font-semibold text-emerald-700">Giữ nguyên</b>. Thu hồi chỉ xảy ra khi <b className="font-semibold">một version đã được gửi đi</b> rồi mới bị từ chối.
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-faint">Biến thể — nếu đây là Saramin CV</p>
          <p className="mt-1 text-[11px] leading-snug text-ink/80">
            Xoá trường trên Saramin CV cũng rơi xuống Not enough information — nhưng ứng viên <b className="font-semibold">thấy ngay</b> (chip vàng “Chưa đủ thông tin”, nút Cập nhật), CV <b className="font-semibold">không ứng tuyển được</b> cho tới khi sửa, và <b className="font-semibold">không vào hàng đợi admin</b>: phép kiểm là số học trên trường họ tự gõ, không có gì để người duyệt. Không có bước 6. Đơn #1 không bị đụng tới — vì nghi ngờ không thu hồi, và vì chẳng ai từ chối.
          </p>
        </div>
      </div>
    </div>
  )
}
