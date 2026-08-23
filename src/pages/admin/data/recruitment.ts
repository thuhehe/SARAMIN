/*
 * Recruitment mock data: job rows, applicant delivery states, CV review reasons.
 */
import type { StatusTone } from '@/pages/admin/lib/tone'
import type { Col } from '@/pages/admin/ui/table'

/* ONE column set, shared by Talent pool and CV review. CV review is the same list
   filtered to the two DOUBT statuses, so it must read identically — an operator
   moving between them should not re-learn the table. Defined once rather than
   copied, because two copies of a column list are two lists that drift. */
export const CV_COLS: Col[] = [
  { label: 'Candidate', w: '1fr' },
  { label: 'CV', w: '1.3fr' },
  { label: 'Basic information', w: '1.5fr' },
  { label: 'Work preference', w: '1.5fr' },
  { label: 'Contact', w: '1.3fr' },
  { label: 'CV status', w: '1.3fr' },
  { label: 'Application status', w: '1.3fr' },
  { label: 'CV Search status', w: '1.3fr' },
  { label: 'CV content', w: '1.2fr' },
  { label: 'Unlocks', w: '0.6fr' },
  { label: 'Updated', w: '0.8fr' },
  { label: '', w: '0.35fr', align: 'r' },
]

/* ── Recruitment ──────────────────────────────────────────────────────────── */
export type JobRow = { id: string; title: string; category: string; company: string; source: 'Company' | 'Admin'; product: string; status: StatusTone; statusLabel: string; exposure: 'On' | 'Off'; posted: string; deadline: string; views: number; saves: number; applicants: number }
export const JOB_ROWS: JobRow[] = [
  { id: 'JOB-2116', title: 'Senior Frontend Engineer (ReactJS)', category: 'CNTT - Phần mềm', company: 'FPT Software', source: 'Company', product: 'Basic', status: 'draft', statusLabel: 'Draft', exposure: 'Off', posted: '—', deadline: '31/08/2026', views: 0, saves: 0, applicants: 0 },
  { id: 'JOB-2117', title: 'Kế toán tổng hợp', category: 'Kế toán - Kiểm toán', company: 'VNG Corporation', source: 'Company', product: 'Free', status: 'schedule', statusLabel: 'Schedule', exposure: 'Off', posted: '01/09/2026', deadline: '20/09/2026', views: 0, saves: 0, applicants: 0 },
  { id: 'JOB-2109', title: 'Digital Marketing Lead', category: 'Marketing - Truyền thông', company: 'Tiki', source: 'Admin', product: 'Distinction', status: 'open', statusLabel: 'Open', exposure: 'On', posted: '15/07/2026', deadline: '15/09/2026', views: 1240, saves: 86, applicants: 42 },
  { id: 'JOB-2101', title: 'Product Manager', category: 'Sản phẩm - Dự án', company: 'MoMo', source: 'Company', product: 'Basic plus', status: 'open', statusLabel: 'Open', exposure: 'On', posted: '05/07/2026', deadline: '05/09/2026', views: 890, saves: 54, applicants: 18 },
  { id: 'JOB-2098', title: 'Nhân viên kinh doanh', category: 'Kinh doanh - Bán hàng', company: 'Thế Giới Di Động', source: 'Company', product: 'Free', status: 'open', statusLabel: 'Open', exposure: 'Off', posted: '20/07/2026', deadline: '28/08/2026', views: 320, saves: 12, applicants: 7 },
  { id: 'JOB-2040', title: 'Backend Engineer (Go)', category: 'CNTT - Phần mềm', company: 'Shopee', source: 'Company', product: 'Top Job', status: 'closed', statusLabel: 'Closed', exposure: 'Off', posted: '01/04/2026', deadline: '01/07/2026', views: 2150, saves: 143, applicants: 61 },
  { id: 'JOB-2001', title: 'Thực tập sinh Nhân sự', category: 'Nhân sự', company: 'Base.vn', source: 'Company', product: 'Free', status: 'draft', statusLabel: 'Draft', exposure: 'Off', posted: '—', deadline: '—', views: 0, saves: 0, applicants: 0 },
]
/* A CV is always shown as the candidate NAMED it, plus the kind it is — the two
   things HQ needs to know at a glance. Never the tag alone: "Saramin CV" with no
   name gives the screener nothing to recognise the document by. */

/* stage is a plain string + its own tone so the list can FILTER on it — a
   pre-rendered <Pill> is unfilterable. Same shape as CoApplicant below. */
/*
 * Status model v2 — an application carries TWO status dimensions and the admin
 * list must show both, because they are owned by different people:
 *
 *   status (Layer 2, HQ-owned)   Sent · Not sent · Recall (+ Blocked, user-level)
 *   stage  (Layer 3, company-owned, read-only here)
 *                                New → Reviewing → Shortlisted → Interview → Hired / Rejected
 *
 * CV QUALITY IS NOT CHECKED HERE — an uploaded CV is parsed and evaluated once,
 * at UPLOAD (Resume management → "CV qualification — apply & CV search"), so it
 * arrives carrying its own verdict. When that verdict is unresolved the
 * application is NOT SENT: the apply succeeded, delivery is waiting on the CV.
 *
 * The hold belongs to the CV, not to the application, which is why there is no
 * decision to make on this screen — the reviewer works Admin → CV review, and ONE
 * verdict releases (or drops) every application waiting on that CV. A held
 * application now waits for a human — nothing auto-sends — so an unworked queue
 * a candidate a deadline.
 */
export type Delivery = 'Sent' | 'Not sent' | 'Recall' | 'Blocked'

/* THREE values, no more. “Pending” used to sit here and was removed: it was the
   CV’s doubt written a second time in a column that already reads from the CV,
   and two copies of one fact are how they start to disagree. A held application
   simply reads NOT SENT; whether it is still WAITING or finally refused is
   carried in `hold`, not a fourth status. RECALL is the one legitimate addition —
   it records history (this one WAS delivered, then its CV was Rejected) that the
   CV status alone cannot reproduce. */
export const isHeld = (hold?: string) => !!hold?.includes('chờ duyệt')

export const DELIVERY_TONE: Record<Delivery, StatusTone> = {
  Sent: 'neutral',
  'Not sent': 'rejected',
  Recall: 'draft',
  Blocked: 'rejected',
}

/* The employer funnel, in order. Tones run cool → warm → resolved so the column
   reads as progress at a glance. */
export const STAGE_TONE: Record<string, StatusTone> = {
  New: 'draft',
  Reviewing: 'neutral',
  Shortlisted: 'schedule',
  Interview: 'pending',
  Hired: 'active',
  Rejected: 'rejected',
}

/* `hold` — held rows only: why delivery is waiting, and how long is left on the
   how long it has waited. The decision itself is made on the CV, not here. */
/* `cvStatus` — the verdict the CV carried in from upload, and the reason a row is
   not sent at all. Without it a binary Not sent looks arbitrary. */
type CvStatus = 'Qualified' | 'Not enough information' | "Can't read" | 'Rejected'
/* `basic` and `pref` are the SAME field-sheet strings the Talent pool renders —
   Basic information (table 1) and Work preference (table 2). Work preference comes
   from ONBOARDING, so even a candidate whose CV was unreadable has a full one. */
export type Applicant = { name: string; basic: string; pref: string; contact: [string, string]; role: string; years: string; loc: string; edu: string; job: string; company: string; cv: [string, 'saramin' | 'upload']; cvStatus: CvStatus; status: Delivery; stage: string; when: string; hold?: string }

export const CV_STATUS_TONE: Record<CvStatus, StatusTone> = {
  Qualified: 'active',
  'Not enough information': 'pending',
  "Can't read": 'draft',
  Rejected: 'rejected',
}

/* ── CV review — the review QUEUE, deliberately not the talent pool ────────────
   Two different jobs, so two different lists: Resumes is for BROWSING the pool
   (one row per candidate, their searchable CV); this is for DECIDING on the
   handful of uploaded PDFs whose extraction fell under the rule. Only PDFs
   appear — a Saramin CV is arithmetic over typed fields and never needs a human.

   The reviewer's real job is telling "not a CV" apart from "our parser failed on
   this layout", so the row shows WHAT WE EXTRACTED next to the file. One verdict
   resolves the CV *and* every application waiting on it. Nothing sends without
   that verdict, which is why the applications-waiting count carries its own
   countdown — after that the CV is still held, but nobody is blocked. */
/* CV CHECK — the same population as Talent pool, filtered to rows still awaiting
   review, so it carries the SAME columns in the SAME order and adds only the two
   the queue needs: how many applications are waiting on this decision, and how
   long the CV has been sitting here. An operator moving between the two lists
   should not have to re-learn the table.

   Only uploaded PDFs appear — a Saramin CV is arithmetic over typed fields and is
   never queued. `kind` is the REASON under the status: `thin` was read fine but is
   under the rule (delivery waits), `tech` could not be read at all (applications
   went out normally, and there is nothing for us to fix). */
/* Rejection reason codes. FIXED, not free text — a note explains one call, but
   only a code lets you count thirty of them and see the pattern. `parser` is the
   valuable one: it turns an operator's rejection into a bug report against the
   scan, and its share is the honest measure of how much work the automation is
   creating for humans. */
/* THREE reasons, reusing the scan's own vocabulary. A rejection records what the
   reviewer CONFIRMED after opening the file, against what the scan suspected:
   the scan's doubt is a question, this is the answer to it.

   Deliberately NOT here: fake, abusive, duplicate. Those are judgements about the
   ACCOUNT rather than the document, and they have their own lever — Block user.
   Filing them as a CV reason would hide an account that needs blocking behind a
   row that looks like a bad upload. */
/* WHAT THE ADMIN RECORDS — internal, never shown to anyone outside the console.
   A code rather than a note alone: a note explains one call, but only a fixed
   code lets thirty rejections be COUNTED, and counting them against what the scan
   said is how a parser gap becomes visible.

   "Khác" exists so the list can stay short without the reviewer having to force a
   real case into a wrong box. It is the pressure valve — and it is also the
   metric: a rising share of Khác is the signal that a fifth code is owed. */
export const REJECT_REASONS = ['Can’t read', 'Not a CV', 'CV but not enough information', 'Khác'] as const

/* WHAT THE CANDIDATE SEES — ONE tag, the same for every reason, forever.
 *
 * The earlier design mapped each code to its own chip ("Không đọc được", "Không
 * phải CV", "Thiếu thông tin"). Three problems with that, and they get worse as
 * the code list grows: adding a code means writing new candidate-facing copy and
 * touching three surfaces; picking the WRONG code silently shows the candidate a
 * wrong explanation; and the chip leaks our internal taxonomy to someone who has
 * no use for it.
 *
 * One generic tag CANNOT be wrong, survives any future code, and moves the whole
 * explanation into a field written for this one person.
 *
 * "CHƯA", not "KHÔNG": a rejection is reversible — Approve undoes it — and most
 * of these are faults of the FILE, not of the candidate. "Không phù hợp" would
 * read as a judgement on them, which is both wrong and unfixable. */
export const REJECT_TAG = 'Chưa được duyệt'

/* THE PUBLIC MESSAGE is what actually tells the candidate anything, so it is
   REQUIRED — a generic tag with no message is strictly worse than the old
   specific chips. Picking a code DRAFTS it (and the action button), and the
   reviewer can rewrite every word.

   Drafts keep the curated quality of the old fixed copy for the three known
   cases while letting any case be expressed. "Khác" drafts NOTHING on purpose:
   the box has to be written, or the code means nothing to the person receiving it.

   Note “Can’t read” never reaches the candidate as written — it describes OUR
   extraction failing, and phrasing it as their fault would be both wrong and
   unfixable by them.

   AND IT NAMES THE SYMPTOM, NEVER THE CAUSE (2026-08-23). The draft used to say
   “file ở dạng ảnh scan”, which is a GUESS: extraction also fails on a corrupt
   file, on text saved as vector outlines, on odd font embedding, and on
   permission-locked PDFs. Told “your file is a scan” about a file that is not
   one, the candidate re-exports the same document, it fails again, and we have
   spent their trust on a diagnosis we were never able to make. So the message
   states what we observed — we could not read it — and follows with an action
   that helps in every one of those cases. */
export const REASON_DRAFTS: Record<string, { msg: string; cta: string }> = {
  'Can’t read': { msg: 'Hệ thống không đọc được nội dung trong file này. Bạn thử tải lên bản PDF xuất trực tiếp từ Word hoặc Google Docs giúp nhé.', cta: 'Tải lên CV khác' },
  'Not a CV': { msg: 'File bạn tải lên không phải một CV. Bạn kiểm tra và tải lại đúng file giúp nhé.', cta: 'Tải lên CV khác' },
  'CV but not enough information': { msg: 'Hồ sơ chưa đủ thông tin để gửi tới nhà tuyển dụng. Bạn bổ sung kinh nghiệm làm việc và ít nhất 3 kỹ năng giúp nhé.', cta: 'Cập nhật hồ sơ' },
  'Khác': { msg: '', cta: 'Cập nhật hồ sơ' },
}

/** The action button under the message. A message with no next step is a dead
    end, and the right step differs by case — so it is picked, not derived. */
export const REJECT_CTAS = ['Tải lên CV khác', 'Cập nhật hồ sơ', 'Liên hệ hỗ trợ', 'Không có nút'] as const

type RejectReason = (typeof REJECT_REASONS)[number]

export type CvCheckRow = {
  name: string; basic: string; contact: [string, string]; pref: string; file: string
  kind: 'thin' | 'tech'; extracted: string; apps: number; left: string; age: string; updated: string; hint: 'likely' | 'unlikely'
  /* Which of the three views the row belongs to. `doubt` is the work; the other
     two are the RECORD of a human decision, kept on the same screen so a bad call
     can be rechecked and undone where it was made. */
  state?: 'doubt' | 'approved' | 'rejected'
  by?: string
  reason?: RejectReason
  /* The queue has TWO sources: the automatic check, and CVs REPORTED by an
     employer or flagged by moderation. A reported row is the only way a CV that
     scanned Qualified ever lands here, so it is worth showing on the row. */
  via?: 'report'
}
