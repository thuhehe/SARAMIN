/*
 * CV status → the two views derived from it, as a FLOW.
 *
 * Drawn rather than tabulated because the three things readers get wrong are all
 * spatial:
 *
 *  1. DIRECTION — application status and CV-search status are not decided
 *     anywhere; they are read off the CV. Every arrow points right, and none
 *     comes back.
 *  2. THE ROUTE CHANGES WHAT A FAILURE COSTS — an uploaded CV in doubt can still
 *     be applied with (the failure may be OUR parser); a typed one cannot (the
 *     candidate can fix it in seconds). Two branches, two panels.
 *  3. ONE RULE FEEDS BOTH — so the rule sits at the fork, touched by both
 *     branches, instead of being repeated inside each panel.
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

type Row = {
  tone: Tone
  status: string
  canApply: boolean
  sent: boolean
  canToggle: boolean
  showing: boolean
}

const UPLOADED: Row[] = [
  { tone: 'ok', status: 'Qualified', canApply: true, sent: true, canToggle: true, showing: true },
  { tone: 'doubt', status: 'Can’t read', canApply: true, sent: false, canToggle: true, showing: false },
  { tone: 'doubt', status: 'Not enough information', canApply: true, sent: false, canToggle: true, showing: false },
  { tone: 'bad', status: 'Rejected', canApply: false, sent: false, canToggle: false, showing: false },
]

const SARAMIN: Row[] = [
  { tone: 'ok', status: 'Qualified', canApply: true, sent: true, canToggle: true, showing: true },
  { tone: 'doubt', status: 'Not enough information', canApply: false, sent: false, canToggle: false, showing: false },
  { tone: 'bad', status: 'Rejected', canApply: false, sent: false, canToggle: false, showing: false },
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

/** A derived-view chip — “can you?” on top, the resulting status underneath. */
function DerivedCard({
  x,
  y,
  can,
  canLabel,
  good,
  goodLabel,
}: {
  x: number
  y: number
  can: boolean
  canLabel: string
  good: boolean
  goodLabel: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={196}
        height={66}
        rx={14}
        fill="var(--color-surface)"
        stroke="var(--color-line)"
        strokeWidth={1.5}
      />
      <text x={x + 14} y={y + 26} fontSize={11.5} fill={can ? 'var(--color-muted)' : C.bad.text} fontWeight={can ? 400 : 600}>
        <tspan fontWeight={700}>{can ? '✓ ' : '✕ '}</tspan>
        {canLabel}
      </text>
      <text x={x + 14} y={y + 46} fontSize={12.5} fontWeight={700} fill={good ? C.ok.text : 'var(--color-faint)'}>
        {goodLabel}
      </text>
    </g>
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
  note: string
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
      <text x={x + 22} y={y + 48} fontSize={10.5} fill="var(--color-muted)">{note}</text>

      <text x={colStatus} y={y + 72} fontSize={9.5} fontWeight={700} fill="var(--color-faint)" letterSpacing={0.6}>CV STATUS</text>
      <text x={colApp} y={y + 72} fontSize={9.5} fontWeight={700} fill="var(--color-faint)" letterSpacing={0.6}>APPLICATION STATUS</text>
      <text x={colSearch} y={y + 72} fontSize={9.5} fontWeight={700} fill="var(--color-faint)" letterSpacing={0.6}>CV SEARCH STATUS</text>

      {rows.map((r, i) => {
        const ry = firstRow + i * pitch
        return (
          <g key={i}>
            <StatusCard x={colStatus} y={ry} row={r} />
            <line x1={colStatus + 184} y1={ry + 33} x2={colApp - 8} y2={ry + 33} stroke={accent} strokeWidth={1.5} markerEnd={`url(#arrow-${accent.slice(1)})`} />
            <DerivedCard
              x={colApp}
              y={ry}
              can={r.canApply}
              canLabel={r.canApply ? 'Can apply with it' : 'Cannot select to apply'}
              good={r.sent}
              goodLabel={r.sent ? 'CV is always SENT' : 'CV is NOT sent'}
            />
            <line x1={colApp + 202} y1={ry + 33} x2={colSearch - 8} y2={ry + 33} stroke={accent} strokeWidth={1.5} markerEnd={`url(#arrow-${accent.slice(1)})`} />
            <DerivedCard
              x={colSearch}
              y={ry}
              can={r.canToggle}
              canLabel={r.canToggle ? 'Can toggle ON search' : 'Cannot toggle ON search'}
              good={r.showing}
              goodLabel={r.showing ? 'CV is always SHOWED' : 'CV is HIDDEN'}
            />
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
      <svg viewBox="0 0 1500 1010" className="h-auto w-full min-w-[1040px]" role="img" aria-label="CV status drives application status and CV search status">
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

        <path d="M 722 470 C 768 470, 768 250, 812 250" fill="none" stroke={RED} strokeWidth={2} markerEnd={`url(#arrow-${RED.slice(1)})`} />
        <path d="M 722 542 C 768 542, 768 790, 812 790" fill="none" stroke={BLUE} strokeWidth={2} markerEnd={`url(#arrow-${BLUE.slice(1)})`} />

        {/* ── the two outcome panels ─────────────────────────────────────────── */}
        <Panel
          x={816}
          y={28}
          w={668}
          h={444}
          accent={RED}
          title="Uploaded CV — parsed into the same fields"
          note="A failure may be OUR parser, not their document — so applying is never refused."
          rows={UPLOADED}
          pitch={88}
        />
        <Panel
          x={816}
          y={556}
          w={668}
          h={424}
          accent={BLUE}
          title="Saramin CV — typed"
          note="No “Can’t read”: no file to fail on. A missing field is theirs to fix, so it blocks both doors."
          rows={SARAMIN}
          pitch={104}
        />

        {/* the one sentence the picture is making */}
        <text x={40} y={1000} fontSize={11} fill="var(--color-muted)">
          Every arrow points right: both statuses are READ from the CV. Nothing writes back.
        </text>
      </svg>
    </div>
  )
}
