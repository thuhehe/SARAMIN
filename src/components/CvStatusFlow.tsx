/*
 * CV status → the two views derived from it, as a FLOW.
 *
 * Drawn rather than tabulated because the three things readers get wrong are all
 * spatial:
 *
 *  1. DIRECTION — application status and CV-search status are not decided
 *     anywhere; they are read off the CV. Every arrow points right, and none
 *     comes back.
 *  2. THE ROUTE CHANGES WHICH FAILURES EXIST — an uploaded file can be unreadable
 *     and can be rejected by a reviewer; a typed one can only be short of the rule.
 *     Two branches, two panels, four statuses against two.
 *
 *     What the derived cells do NOT show, because they hold one value each and a
 *     value cannot be conditional: an uploaded CV in doubt is HELD rather than
 *     refused — the apply succeeds, and delivery waits for a reviewer. That is in
 *     the panel note, and in the status table on the same page.
 *  3. ONE RULE FEEDS BOTH — so the rule sits at the fork, touched by both
 *     branches, instead of being repeated inside each panel.
 *  4. ONLY THE UPLOADED BRANCH REACHES A HUMAN — it has four statuses, the typed
 *     branch two. Rejected only exists where a review exists, and reviews only
 *     happen on uploaded files. The uneven panels ARE the argument.
 *  5. INTERNAL VALUE ≠ WHAT THE CANDIDATE SEES, which is why every status card
 *     now carries a second, smaller line underneath it. Read that line DOWN the
 *     uploaded panel and the rule states itself: nothing, nothing, nothing, then
 *     one rejection message. A table can list the same facts; only the picture
 *     puts the internal value and its (usually absent) candidate-facing twin in
 *     the same glance, which is the mistake this page exists to prevent.
 *
 * SVG, not HTML: curved connectors are the whole point, and this has to survive
 * being screenshotted into a chat and printed. Structural colours come from the
 * theme tokens; the three status colours are the same pastels the rest of the
 * console uses for Qualified / doubt / Rejected.
 */

const C = {
  ok: { fill: '#ecfdf5', line: '#a7f3d0', text: '#047857' },
  doubt: { fill: '#fffbeb', line: '#fde68a', text: '#b45309' },
  bad: { fill: '#fff1f2', line: '#fecdd3', text: '#be123c' },
} as const

type Tone = keyof typeof C

/* The derived cells hold the real status VALUES, not a sentence about them — the
   same sets the admin lists render, so the picture and the tables can be read
   against each other without translation. A CV in doubt reads Not sent, and it
   stays that way until a reviewer decides. Nothing releases it automatically.

   Application status has a THIRD value the cells cannot carry: RECALL, written
   when an admin rejects a CV that was already Sent. It is a transition, not an
   apply-time outcome — no row produces it, so it is drawn as the annotation under
   the uploaded panel instead of squeezed into a cell it would misdescribe. */
type AppStatus = 'Sent' | 'Not sent'
type SearchStatus = 'Showing' | 'Hidden'

/* `app` is OPTIONAL, and the absence carries meaning: when the jobseeker cannot
   select the CV to apply, no application is ever created — so there is nothing for
   an application status to describe. Rendering "Not sent" there would invent a
   record that does not exist. The card shows the ACTION first (can / can't apply)
   and the status only when there is one. */
/* `sees` — WHAT THE CANDIDATE IS SHOWN for this status, printed under the status
   card. It is the whole reason this picture was redrawn: three of the four
   uploaded rows show the candidate NOTHING, and that repetition is the argument.
   `seesTone` absent = render it as an absence (faint, italic) rather than a
   label. */
type Row = {
  tone: Tone; status: string; canApply: boolean; app?: AppStatus; canToggle: boolean; search?: SearchStatus
  sees: string; seesTone?: Tone
}

/* Value → colour, so a status reads the same here as it does on its pill. */
const VALUE_TONE: Record<AppStatus | SearchStatus, Tone> = {
  Sent: 'ok',
  Showing: 'ok',
  'Not sent': 'bad',
  Hidden: 'bad',
}

const UPLOADED: Row[] = [
  { tone: 'ok', status: 'Qualified', canApply: true, app: 'Sent', canToggle: true, search: 'Showing', sees: 'no label — an ordinary CV' },
  /* THE TWO DOUBT ROWS SHOW THE CANDIDATE NOTHING. The status is our uncertainty
     about our own parse, not a fact about them; announcing it would blame them for
     a failure that may be ours, before any human has confirmed it. */
  { tone: 'doubt', status: 'Can’t read', canApply: true, app: 'Not sent', canToggle: true, search: 'Hidden', sees: 'NOTHING — renders as an ordinary CV' },
  { tone: 'doubt', status: 'Not enough information', canApply: true, app: 'Not sent', canToggle: true, search: 'Hidden', sees: 'NOTHING — renders as an ordinary CV' },
  /* Rejected is the only uploaded status that refuses the apply outright, so it is
     the only one with no application status to show — and the only one the
     candidate is ever told about. The admin's reason code completes the chip. */
  { tone: 'bad', status: 'Rejected', canApply: false, canToggle: false, sees: 'Chưa được duyệt — <lý do> + 1 nút sửa', seesTone: 'bad' },
]

/* TWO statuses only, and the missing third is the point: Rejected is written by an
   admin, admins only ever work the CV-check queue, and that queue holds uploaded
   PDFs alone. A typed CV is arithmetic over fields the candidate entered — the
   check is always right about it — so it is never reviewed and can never be
   rejected. (A spam or reported profile is handled by account moderation, which is
   a different lever and not part of this flow.) */
const SARAMIN: Row[] = [
  { tone: 'ok', status: 'Qualified', canApply: true, app: 'Sent', canToggle: true, search: 'Showing', sees: 'no label — an ordinary CV' },
  /* The typed route refuses instead of holding — the missing field is the
     candidate's own and takes seconds to fill — so again there is no application.
     It is also the ONLY doubt state the candidate is shown, because there is no
     parser to be wrong and nothing queued for review: the check cannot be
     mistaken about fields they typed into our own form. */
  { tone: 'doubt', status: 'Not enough information', canApply: false, canToggle: false, sees: '⚠ Chưa đủ thông tin + Cập nhật hồ sơ', seesTone: 'doubt' },
]

/** A status chip — the left column of a panel. Two lines when the name is long. */
function StatusCard({ x, y, row }: { x: number; y: number; row: Row }) {
  const c = C[row.tone]
  const words = row.status.split(' ')
  const lines = row.status.length > 16 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : [row.status]
  return (
    <g>
      <rect x={x} y={y} width={178} height={66} rx={14} fill={c.fill} stroke={c.line} strokeWidth={1.5} />
      <circle cx={x + 18} cy={y + 33} r={4} fill={c.text} />
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + 30}
          y={y + (lines.length === 1 ? 38 : 28 + i * 15)}
          fontSize={12.5}
          fontWeight={700}
          fill={c.text}
        >
          {l}
        </text>
      ))}
    </g>
  )
}

/** One derived column, two rows — the same shape in both columns:
 *
 *    1. what the JOBSEEKER can do        ✓ Can apply · ✓ Can turn ON CV search
 *    2. the resulting status             Application status: Sent
 *
 *  Row 2 names its FIELD as well as its value, so a cell lifted out of the picture
 *  into a conversation still says which status it is.
 *
 *  `value` may be absent, and the absence is meaningful rather than missing data —
 *  see ApplicationCard. */
function DerivedCard({
  x,
  y,
  can,
  canLabel,
  field,
  value,
  emptyLabel,
}: {
  x: number
  y: number
  can: boolean
  canLabel: string
  field: string
  value?: AppStatus | SearchStatus
  emptyLabel?: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={196} height={66} rx={14} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1.5} />
      <text x={x + 14} y={y + 25} fontSize={11.5} fontWeight={600} fill={can ? C.ok.text : C.bad.text}>
        {can ? '\u2713 ' : '\u2715 '}{canLabel}
      </text>
      {value ? (
        /* label and value on ONE line: two stacked lines would not fit the card,
           and the label is only there to name the field, not to be read first. */
        <text x={x + 14} y={y + 47} fontSize={9.5} fill="var(--color-faint)">
          {field}:{' '}
          <tspan fontSize={12} fontWeight={700} fill={C[VALUE_TONE[value]].text}>{value}</tspan>
        </text>
      ) : (
        <text x={x + 14} y={y + 47} fontSize={10} fontStyle="italic" fill="var(--color-faint)">
          {emptyLabel}
        </text>
      )}
    </g>
  )
}

/** The application column. When the jobseeker cannot apply, NO application is
 *  ever created — so there is no application status to show, and printing “Not
 *  sent” would invent a record that never existed. The empty line says so. */
function ApplicationCard({ x, y, canApply, value }: { x: number; y: number; canApply: boolean; value?: AppStatus }) {
  return (
    <DerivedCard
      x={x}
      y={y}
      can={canApply}
      canLabel={canApply ? 'Can apply' : 'Can\u2019t apply'}
      field="Application status"
      value={value}
      emptyLabel="no application created"
    />
  )
}

/** The CV-search column, and it behaves exactly like the application one: a CV
 *  that cannot be turned ON for search was never in CV search at all, so there is
 *  no search status to report. “Hidden” would describe a state the CV never
 *  entered — the same invented record “Not sent” would be on a non-existent
 *  application. Both columns therefore show a status only where one exists. */
function SearchCard({ x, y, canToggle, value }: { x: number; y: number; canToggle: boolean; value?: SearchStatus }) {
  return (
    <DerivedCard
      x={x}
      y={y}
      can={canToggle}
      canLabel={canToggle ? 'Can turn ON CV search' : 'Can\u2019t turn ON CV search'}
      field="CV search status"
      value={value}
      emptyLabel="never in CV search"
    />
  )
}

function Panel({
  x,
  y,
  w,
  h,
  title,
  note,
  rows,
  pitch,
  accent,
}: {
  x: number
  y: number
  w: number
  h: number
  title: string
  note: string[]
  rows: Row[]
  pitch: number
  accent: string
}) {
  const colStatus = x + 22
  const colApp = x + 232
  const colSearch = x + 460
  const firstRow = y + 82
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill="var(--color-canvas)" stroke={accent} strokeWidth={1.5} opacity={0.55} />
      <rect x={x} y={y} width={w} height={h} rx={18} fill="none" stroke={accent} strokeWidth={1.5} />
      <text x={x + 22} y={y + 30} fontSize={13} fontWeight={700} fill="var(--color-ink)">{title}</text>
      {/* SVG does not wrap text, so the note is authored as lines. Long notes were
          running past the panel edge and off the canvas entirely. */}
      {note.map((l, i) => (
        <text key={i} x={x + 22} y={y + 48 + i * 14} fontSize={10.5} fill="var(--color-muted)">{l}</text>
      ))}

      {/* The sub-line is labelled ONCE, in the header, so each row's caption can be
          the bare thing the candidate sees — a per-row “Ứng viên thấy:” prefix ate
          the column width and repeated 4×. Kept SHORT on purpose: the column is
          210px wide before APPLICATION STATUS begins, and the fuller wording
          (“small line = what the candidate sees”) overran it by 80px. The ▾ does
          the pointing instead, and the section text spells it out. */}
      <text x={colStatus} y={y + 72} fontSize={9.5} fontWeight={700} fill="var(--color-faint)" letterSpacing={0.6}>CV STATUS  ·  ▾ CANDIDATE SEES</text>
      <text x={colApp} y={y + 72} fontSize={9.5} fontWeight={700} fill="var(--color-faint)" letterSpacing={0.6}>APPLICATION STATUS</text>
      <text x={colSearch} y={y + 72} fontSize={9.5} fontWeight={700} fill="var(--color-faint)" letterSpacing={0.6}>CV SEARCH STATUS</text>

      {rows.map((r, i) => {
        const ry = firstRow + i * pitch
        return (
          <g key={i}>
            <StatusCard x={colStatus} y={ry} row={r} />
            {/* WHAT THE CANDIDATE SEES, printed directly against the internal value
                it contradicts. An absence renders faint and italic so the eye reads
                it as “nothing here” rather than as another label. */}
            <text
              x={colStatus + 4}
              y={ry + 84}
              fontSize={9.5}
              fontWeight={r.seesTone ? 700 : 400}
              fontStyle={r.seesTone ? 'normal' : 'italic'}
              fill={r.seesTone ? C[r.seesTone].text : 'var(--color-faint)'}
            >
              {r.sees}
            </text>
            <line x1={colStatus + 184} y1={ry + 33} x2={colApp - 8} y2={ry + 33} stroke={accent} strokeWidth={1.5} markerEnd={`url(#arrow-${accent.slice(1)})`} />
            <ApplicationCard x={colApp} y={ry} canApply={r.canApply} value={r.app} />
            <line x1={colApp + 202} y1={ry + 33} x2={colSearch - 8} y2={ry + 33} stroke={accent} strokeWidth={1.5} markerEnd={`url(#arrow-${accent.slice(1)})`} />
            <SearchCard x={colSearch} y={ry} canToggle={r.canToggle} value={r.search} />
          </g>
        )
      })}
    </g>
  )
}

const RED = '#e11d48'
const BLUE = '#2563eb'

export function CvStatusFlow() {
  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox="0 0 1500 990" className="h-auto w-full min-w-[1040px]" role="img" aria-label="CV status drives application status and CV search status">
        <defs>
          {[RED, BLUE].map((c) => (
            <marker key={c} id={`arrow-${c.slice(1)}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* ── the spine: one jobseeker, two routes, ONE rule ─────────────────── */}
        <circle cx={64} cy={505} r={42} fill="var(--color-brand-soft)" stroke="var(--color-brand)" strokeWidth={1.5} />
        <text x={64} y={510} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--color-brand)">Jobseeker</text>

        <path d="M 108 505 C 156 505, 156 300, 200 300" fill="none" stroke={RED} strokeWidth={2} markerEnd={`url(#arrow-${RED.slice(1)})`} />
        <path d="M 108 505 C 156 505, 156 712, 200 712" fill="none" stroke={BLUE} strokeWidth={2} markerEnd={`url(#arrow-${BLUE.slice(1)})`} />

        <circle cx={256} cy={300} r={50} fill="#fff1f2" stroke={RED} strokeWidth={1.5} />
        <text x={256} y={295} fontSize={11.5} fontWeight={700} textAnchor="middle" fill={RED}>Uploads</text>
        <text x={256} y={311} fontSize={11.5} fontWeight={700} textAnchor="middle" fill={RED}>a file</text>

        <circle cx={256} cy={712} r={50} fill="#eff6ff" stroke={BLUE} strokeWidth={1.5} />
        <text x={256} y={707} fontSize={11.5} fontWeight={700} textAnchor="middle" fill={BLUE}>Builds a</text>
        <text x={256} y={723} fontSize={11.5} fontWeight={700} textAnchor="middle" fill={BLUE}>Saramin CV</text>

        <path d="M 306 300 C 350 300, 350 470, 396 470" fill="none" stroke={RED} strokeWidth={2} markerEnd={`url(#arrow-${RED.slice(1)})`} />
        <path d="M 306 712 C 350 712, 350 542, 396 542" fill="none" stroke={BLUE} strokeWidth={2} markerEnd={`url(#arrow-${BLUE.slice(1)})`} />

        {/* the rule — at the fork, because ONE rule reads both routes */}
        <rect x={400} y={432} width={322} height={148} rx={16} fill="var(--color-surface)" stroke="var(--color-brand)" strokeWidth={1.5} />
        <text x={561} y={462} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--color-brand)">
          Điều kiện tối thiểu CV được gửi đi
        </text>
        <text x={561} y={496} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--color-ink)" fontFamily="ui-monospace, monospace">AND [</text>
        <text x={561} y={516} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--color-ink)" fontFamily="ui-monospace, monospace">
          OR [ Work experience,
        </text>
        <text x={561} y={534} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--color-ink)" fontFamily="ui-monospace, monospace">
          AND [ Education, Projects ] ],
        </text>
        <text x={561} y={556} fontSize={12} fontWeight={700} textAnchor="middle" fill="var(--color-ink)" fontFamily="ui-monospace, monospace">3 skills ]</text>

        <path d="M 722 470 C 768 470, 768 284, 812 284" fill="none" stroke={RED} strokeWidth={2} markerEnd={`url(#arrow-${RED.slice(1)})`} />
        <path d="M 722 542 C 768 542, 768 753, 812 753" fill="none" stroke={BLUE} strokeWidth={2} markerEnd={`url(#arrow-${BLUE.slice(1)})`} />

        {/* ── the two outcome panels ─────────────────────────────────────────── */}
        <Panel
          x={816}
          y={28}
          w={668}
          h={512}
          accent={RED}
          title="Uploaded CV — parsed into the same fields"
          note={[
            'A failure may be OUR parser, not the document — so the apply is never refused, the',
            'candidate is never told, and delivery waits for a reviewer. Nothing auto-releases.',
          ]}
          rows={UPLOADED}
          pitch={106}
        />
        {/* The one move the rows can't show, because it is a TRANSITION rather than
            an apply-time outcome: a Qualified CV that already reached employers is
            later Rejected by an admin. Sat under the uploaded panel because only
            that route has an admin to overturn anything. */}
        <text x={826} y={560} fontSize={11} fill={C.bad.text}>
          ↩ Rejected AFTER Qualified — an admin overturns a CV that employers already have: every application
        </text>
        <text x={826} y={576} fontSize={11} fill={C.bad.text}>
          already Sent flips to <tspan fontWeight={700}>Recall</tspan> (pulled back; the employer is told Saramin withdrew it). Held ones stay Not sent.
        </text>
        <Panel
          x={816}
          y={606}
          w={668}
          h={294}
          accent={BLUE}
          title="Saramin CV — typed"
          note={[
            'Two statuses, never four: no file to fail on, and nothing for an admin to review.',
            'A missing field is theirs to fix, and it blocks both doors.',
          ]}
          rows={SARAMIN}
          pitch={106}
        />

        {/* the one sentence the picture is making */}
        <text x={40} y={930} fontSize={11} fill="var(--color-muted)">
          Every arrow points right: both statuses are READ from the CV. Nothing writes back.
        </text>
        {/* …and the one thing the picture CANNOT show, because it is about who is
            looking rather than what the value is. Printed here so nobody reads a
            “Not sent” cell as a label the candidate is shown. */}
        <text x={40} y={954} fontSize={11} fill="var(--color-muted)">
          These are INTERNAL values. A candidate never sees a doubt state: an uploaded CV in doubt renders like a healthy one,
        </text>
        <text x={40} y={970} fontSize={11} fill="var(--color-muted)">
          and its application reads the ordinary “Đã nộp”. Only DECIDED states are ever spoken about — Qualified, or Rejected with its reason.
        </text>
      </svg>
    </div>
  )
}
