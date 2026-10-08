/* ── Calls — how a Callio call gets onto its company ─────────────────────────────
 *
 * Four COLUMNS read left to right, because the feature is one pipeline: the rep
 * starts a call (two ways), Callio places it and reports it back, the CRM matches it
 * in a fixed order, and the call lands on the company.
 *
 *   THE REP   — Copy on the company record's Call card records a CRM call; a call
 *               dialled straight in Callio records nothing.
 *   CALLIO    — places every call; the call-end / missed-call webhook brings it back
 *               in seconds. No dial API, which is why the link is made at the click.
 *   MATCHING  — ① pending CRM call → ② the number (again on Sync from CRM) → ③ several
 *               companies: the rep picks one → ④ still waiting: an admin. The first
 *               that answers wins.
 *   COMPANY   — one call row (company · contact · Linked by) and one activity per
 *               answered call. The dashed loop: a number saved on a contact + Sync from
 *               CRM sends a waiting call back through ②.
 *
 * Under it, the two screens the client will look at: the Call card on the company
 * record, and the Call logs list with the Company / Contact person columns they asked
 * for. Names and numbers are the prototype's seed rows (07/10/2026).
 */
const INK = 'var(--color-ink)'
const MUT = 'var(--color-muted)'
const BR = 'var(--color-brand)'
const AMB = '#b45309'
const GRN = '#047857'
const RED = '#e11d48'
const SKY = '#0369a1'
const VIO = '#6d28d9'
const SLA = '#475569'

/* one marker per arrow colour — an SVG marker cannot inherit its path's stroke */
const MARK: Record<string, string> = { plain: 'var(--color-line-soft)', brand: BR, amber: AMB, sky: SKY, violet: VIO, slate: SLA, red: RED }
type Tone = keyof typeof MARK

function Box({ x, y, w, h, title, sub, sub2, tone = 'plain' }: {
  x: number; y: number; w: number; h: number; title: string; sub?: string; sub2?: string
  tone?: 'plain' | 'amber' | 'gate' | 'green' | 'stop'
}) {
  const fill = tone === 'amber' ? '#fffbeb' : tone === 'gate' ? 'var(--color-brand-soft)' : tone === 'green' ? '#ecfdf5' : tone === 'stop' ? '#fff1f2' : 'var(--color-surface)'
  const stroke = tone === 'amber' ? AMB : tone === 'gate' ? BR : tone === 'green' ? GRN : tone === 'stop' ? RED : 'var(--color-line)'
  const tc = tone === 'amber' ? AMB : tone === 'gate' ? BR : tone === 'green' ? GRN : tone === 'stop' ? '#be123c' : INK
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={sub ? y + h / 2 - (sub2 ? 12 : 5) : y + h / 2 + 4} fontSize={12.5} fontWeight={700} textAnchor="middle" fill={tc}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + (sub2 ? 4 : 11)} fontSize={10.5} textAnchor="middle" fill={MUT}>{sub}</text>}
      {sub2 && <text x={x + w / 2} y={y + h / 2 + 19} fontSize={10.5} textAnchor="middle" fill={MUT}>{sub2}</text>}
    </g>
  )
}

function Arrow({ d, label, lx, ly, tone = 'plain', dashed }: { d: string; label?: string; lx?: number; ly?: number; tone?: Tone; dashed?: boolean }) {
  const c = MARK[tone]
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={1.8} strokeDasharray={dashed ? '4 3' : undefined} markerEnd={`url(#cl-${tone})`} />
      {label && <text x={lx} y={ly} fontSize={11} fontWeight={600} textAnchor="middle" fill={tone === 'plain' ? MUT : c}>{label}</text>}
    </g>
  )
}

/** The Linked by chip, as the Call logs page draws it. x/y = the chip's centre. */
const CHIP: Record<string, [string, string, string]> = {
  'CRM call': ['var(--color-brand-soft)', BR, BR],
  Number: ['#f0f9ff', '#bae6fd', SKY],
  Rep: ['#f5f3ff', '#ddd6fe', VIO],
  Admin: ['#f1f5f9', '#e2e8f0', SLA],
  Waiting: ['#fffbeb', '#fde68a', '#92400e'],
  'No company': ['#fffbeb', '#fde68a', '#92400e'],
}
function Chip({ cx, cy, label }: { cx: number; cy: number; label: string }) {
  const [fill, stroke, color] = CHIP[label]
  const w = label.length * 6 + 16
  return (
    <g>
      <rect x={cx - w / 2} y={cy - 9} width={w} height={18} rx={9} fill={fill} stroke={stroke} strokeWidth={1} />
      <text x={cx} y={cy + 4} fontSize={10} fontWeight={700} textAnchor="middle" fill={color}>{label}</text>
    </g>
  )
}

function Line({ x, y, t, bold, color = MUT, size = 10.5 }: { x: number; y: number; t: string; bold?: boolean; color?: string; size?: number }) {
  return <text x={x} y={y} fontSize={size} fontWeight={bold ? 700 : 400} fill={color}>{t}</text>
}

export function CallLinkFlow() {
  /* column x — A the rep · B Callio · C matching · D the company */
  const A = 34, AW = 260
  const B = 356, BW = 160
  const C = 574, CW = 404
  const D = 1092, DW = 290
  const cx = C + CW / 2
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-line bg-canvas/40 p-3">
      <svg viewBox="0 0 1420 850" className="h-auto w-full min-w-[860px]" role="img" aria-label="Calls — a call started from the company record carries its company; a call dialled in Callio is matched by number, then by the rep who made it, then by an admin; every path ends on the company with one activity">
        <defs>
          {Object.entries(MARK).map(([k, c]) => (
            <marker key={k} id={`cl-${k}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={c} /></marker>
          ))}
        </defs>

        {/* ── premise ─────────────────────────────────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={58} rx={10} fill="var(--color-brand-soft)" stroke={BR} strokeWidth={1.5} />
        <text x={36} y={39} fontSize={12.5} fontWeight={800} fill={BR}>THE LINK IS MADE WHEN THE CALL IS MADE — at the Copy click, or by the number. The rep settles a shared or unknown number; an admin gets only what is left.</text>
        <text x={36} y={60} fontSize={11} fill={MUT}>
          Callio places every call (no dial API). The CRM records the one fact a number cannot carry — which company and person the rep meant — and pairs it with Callio’s call when the webhook brings it back, seconds after hang-up.
        </text>

        {/* ── column headers ──────────────────────────────────────────────────── */}
        {([
          [20, 300, 'THE REP — how the call starts'],
          [336, 200, 'CALLIO'],
          [552, 446, 'MATCHING — on Callio’s webhook, in this order'],
          [1014, 386, 'ON THE COMPANY'],
        ] as const).map(([x, w, t]) => (
          <g key={t}>
            <rect x={x} y={90} width={w} height={26} rx={8} fill="var(--color-surface)" stroke="var(--color-line)" />
            <text x={x + w / 2} y={107} fontSize={11.5} fontWeight={800} textAnchor="middle" fill={INK}>{t}</text>
          </g>
        ))}

        {/* ── A · the rep ─────────────────────────────────────────────────────── */}
        <Box x={A} y={150} w={AW} h={110} title="Call on the company record" sub="header · Log an activity · ☎ on a contact" sub2="→ Copy the number" tone="gate" />
        <Box x={A} y={400} w={AW} h={92} title="Dialled straight in Callio" sub="or the customer rings in" sub2="nothing recorded in the CRM" />
        <text x={A} y={300} fontSize={10.5} fill={MUT}>The click is the only moment the CRM knows</text>
        <text x={A} y={315} fontSize={10.5} fill={MUT}>who the rep MEANT to call — so it is recorded</text>
        <text x={A} y={330} fontSize={10.5} fill={MUT}>there. Nothing extra for the rep: it is the</text>
        <text x={A} y={345} fontSize={10.5} fill={MUT}>copy they already make.</text>

        {/* ── B · Callio ──────────────────────────────────────────────────────── */}
        <Box x={B} y={150} w={BW} h={60} title="CRM call · Pending" sub="rep · company · contact" sub2="number · clicked at" tone="amber" />
        <rect x={B} y={228} width={BW} height={264} rx={10} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1.5} />
        <text x={B + BW / 2} y={256} fontSize={13} fontWeight={800} textAnchor="middle" fill={INK}>Callio</text>
        <text x={B + BW / 2} y={273} fontSize={10.5} textAnchor="middle" fill={MUT}>places every call</text>
        <text x={B + BW / 2} y={306} fontSize={10.5} textAnchor="middle" fill={INK}>rep pastes the number,</text>
        <text x={B + BW / 2} y={321} fontSize={10.5} textAnchor="middle" fill={INK}>presses Call</text>
        <text x={B + BW / 2} y={350} fontSize={10.5} textAnchor="middle" fill={INK}>talk · hang up</text>
        <text x={B + BW / 2} y={384} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={INK}>webhook call-end ·</text>
        <text x={B + BW / 2} y={399} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={INK}>missed-call</text>
        <text x={B + BW / 2} y={414} fontSize={10.5} textAnchor="middle" fill={MUT}>stored in 1–2 s</text>
        <text x={B + BW / 2} y={450} fontSize={10} textAnchor="middle" fill={MUT}>no dial API ·</text>
        <text x={B + BW / 2} y={464} fontSize={10} textAnchor="middle" fill={MUT}>no auto-dial link</text>

        <Arrow d={`M ${A + AW + 6} 172 L ${B - 6} 172`} tone="amber" label="records" lx={(A + AW + B) / 2} ly={165} />
        <Arrow d={`M ${A + AW + 6} 246 L ${B - 6} 246`} tone="brand" label="paste" lx={(A + AW + B) / 2} ly={239} />
        <Arrow d={`M ${A + AW + 6} 446 L ${B - 6} 446`} tone="slate" />
        {/* the CRM call is what ① looks for; the Callio call is what arrives */}
        <Arrow d={`M ${B + BW + 6} 172 L ${C - 6} 172`} tone="amber" dashed />
        <Arrow d={`M ${B + BW + 6} 300 L 548 300 L 548 222 L ${C - 6} 222`} tone="brand" />

        {/* ── C · matching, in order ──────────────────────────────────────────── */}
        <Box x={C} y={156} w={CW} h={84} title="① A pending CRM call matches?" sub="same rep · same number · started −2…+30 min from the click" sub2="outbound only · latest click wins · settles shared numbers too" tone="gate" />
        <Arrow d={`M ${cx} 244 L ${cx} 270`} label="no" lx={cx + 18} ly={261} />
        <Box x={C} y={274} w={CW} h={64} title="② Exactly one company holds the number?" sub="on arrival (built today) — and again on Sync from CRM" />
        <Arrow d={`M ${cx} 342 L ${cx} 368`} label="none · several" lx={cx + 50} ly={359} />
        <Box x={C} y={372} w={CW} h={80} title="③ Several companies hold it — the rep picks one" sub="Call logs: the Company cell lists them · one click" sub2="the contact is the one holding the number there" tone="amber" />
        <Arrow d={`M ${cx} 456 L ${cx} 482`} label="none · not picked · no rep bound" lx={cx + 100} ly={473} />
        <Box x={C} y={486} w={CW} h={76} title="④ Still waiting — Needs assigning" sub="no company? save the number on a contact → Sync from CRM" sub2="or an admin assigns it (the build’s queue · Assign · Archive)" />

        {/* each path into the company, carrying the Linked by value it stores */}
        {([
          [198, 'CRM call', 'brand'],
          [306, 'Number', 'sky'],
          [412, 'Rep', 'violet'],
          [524, 'Admin', 'slate'],
        ] as const).map(([y, label, tone]) => (
          <g key={label}>
            <Arrow d={`M ${C + CW + 6} ${y} L ${D - 6} ${y}`} tone={tone} />
            <Chip cx={(C + CW + D) / 2} cy={y - 16} label={label} />
          </g>
        ))}

        {/* ── D · on the company ──────────────────────────────────────────────── */}
        <rect x={D} y={150} width={DW} height={410} rx={10} fill="#ecfdf5" stroke={GRN} strokeWidth={1.5} />
        <Line x={D + 16} y={176} t="Filed on the company" bold color={GRN} size={12.5} />
        <Line x={D + 16} y={196} t="call row: company · contact person ·" />
        <Line x={D + 16} y={211} t="Linked by — stored with who and when" />
        <line x1={D + 16} x2={D + DW - 16} y1={228} y2={228} stroke="#a7f3d0" />
        <Line x={D + 16} y={250} t="Answered → ONE Sales activity" bold color={INK} size={11.5} />
        <Line x={D + 16} y={268} t="the rep’s note + Result · duration ·" />
        <Line x={D + 16} y={283} t="▶ recording — never the transcript" />
        <Line x={D + 16} y={298} t="resets Idle · KPI call as today" />
        <line x1={D + 16} x2={D + DW - 16} y1={316} y2={316} stroke="#a7f3d0" />
        <Line x={D + 16} y={336} t="Unanswered → attempt row" bold color={INK} size={11.5} />
        <Line x={D + 16} y={354} t="greyed on the feed · no Idle reset ·" />
        <Line x={D + 16} y={369} t="not a KPI call" />
        <line x1={D + 16} x2={D + DW - 16} y1={386} y2={386} stroke="#a7f3d0" />
        <Line x={D + 16} y={406} t="Number saved on a contact" bold color={INK} size={11.5} />
        <Line x={D + 16} y={424} t="Sync from CRM links the calls waiting" />
        <Line x={D + 16} y={439} t="on it; later calls link at ② on arrival" />
        <line x1={D + 16} x2={D + DW - 16} y1={456} y2={456} stroke="#a7f3d0" />
        <Line x={D + 16} y={476} t="Waiting — answered, none of ①–④ yet" bold color="#92400e" size={11.5} />
        <Line x={D + 16} y={494} t="on no company yet; the KPI still counts" />
        <Line x={D + 16} y={509} t="it (by rep). Linking never moves the KPI." />
        <Line x={D + 16} y={538} t="One answered call = one activity, any path." bold color={GRN} />

        {/* the loop that shrinks the queue: a number saved on a contact + Sync from CRM
            sends a waiting call back through ② — the build never matches it again */}
        <Arrow d={`M ${cx} 566 L ${cx} 584 L 556 584 L 556 322 L ${C - 6} 322`} tone="sky" dashed label="number saved on a contact → Sync from CRM → ② again" lx={cx - 110} ly={598} />

        {/* ── the Call card ───────────────────────────────────────────────────── */}
        <rect x={20} y={604} width={680} height={230} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={628} fontSize={11} fontWeight={800} fill={MUT}>THE CALL CARD — Company record → Log an activity → Call</text>
        <Box x={40} y={700} w={140} h={56} title="Pick" sub="who are you calling?" />
        <Arrow d="M 186 728 L 214 728" tone="brand" />
        <Box x={220} y={700} w={150} h={56} title="Calling" sub="copied · waiting for Callio" tone="amber" />
        <Arrow d="M 396 728 L 396 662 L 414 662" tone="brand" />
        <Arrow d="M 376 728 L 414 728" tone="slate" />
        <Arrow d="M 396 728 L 396 794 L 414 794" tone="red" />
        <Box x={420} y={640} w={262} h={44} title="Found" sub="answered · duration · ▶ recording" tone="green" />
        <Box x={420} y={706} w={262} h={44} title="No answer" sub="attempt · Idle unchanged · Call again" />
        <Box x={420} y={772} w={262} h={44} title="Not found" sub="30 min, no Callio call · keep as note / discard" tone="stop" />
        <text x={40} y={786} fontSize={10.5} fill={MUT}>The note can be written while waiting —</text>
        <text x={40} y={801} fontSize={10.5} fill={MUT}>Callio’s facts join the SAME row when the</text>
        <text x={40} y={816} fontSize={10.5} fill={MUT}>call arrives. Never two rows for one call.</text>

        {/* ── Call logs — the list the client asked for ───────────────────────── */}
        <rect x={720} y={604} width={680} height={230} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={736} y={628} fontSize={11} fontWeight={800} fill={MUT}>CALL LOGS — Company (must have) · Contact person (nice to have) · Linked by</text>
        {(() => {
          const X = [740, 836, 1012, 1150, 1256]
          const head = ['Phone', 'Company', 'Contact person', 'Linked by', 'Status']
          /* company: a name · '' = No company · a list = several hold the number, pick one */
          const rows: [string, string | string[], string, string][] = [
            ['0908 123 456', 'Công ty TNHH Đại Dương', 'Nguyễn Văn Toàn', 'CRM call'],
            ['0912 345 678', 'Tiki', 'Bùi Thu Hằng', 'Number'],
            ['0938 555 777', 'VNG Corporation', 'Đoàn Hải Nam', 'Rep'],
            ['0981 127 348', 'Công ty TNHH Đại Dương', 'Phạm Kế Toán', 'Admin'],
            ['0911 468 024', ['Bình Minh', 'Sao Mai'], '—', 'Waiting'],
            ['0969 920 995', '', '—', 'Waiting'],
          ]
          return (
            <g>
              <rect x={736} y={640} width={648} height={22} rx={4} fill="var(--color-canvas)" />
              {head.map((h, i) => <text key={h} x={X[i]} y={655} fontSize={10} fontWeight={700} fill={MUT}>{h}</text>)}
              {rows.map(([phone, co, contact, src], r) => {
                const y = 678 + r * 21
                return (
                  <g key={phone}>
                    <line x1={736} x2={1384} y1={y + 9} y2={y + 9} stroke="var(--color-line-soft)" strokeWidth={0.8} />
                    <text x={X[0]} y={y + 3} fontSize={10.5} fontFamily="ui-monospace, monospace" fill={INK}>{phone}</text>
                    {Array.isArray(co)
                      ? (
                        <g>
                          <text x={X[1]} y={y + 3} fontSize={9.5} fontWeight={700} fill="#92400e">pick:</text>
                          {co.map((name, k) => {
                            const w = name.length * 6 + 12
                            const x = X[1] + 30 + (k === 0 ? 0 : co[0].length * 6 + 16)
                            return (
                              <g key={name}>
                                <rect x={x} y={y - 9} width={w} height={17} rx={5} fill="var(--color-surface)" stroke={BR} strokeWidth={1} />
                                <text x={x + w / 2} y={y + 3} fontSize={10} fontWeight={600} textAnchor="middle" fill={BR}>{name}</text>
                              </g>
                            )
                          })}
                        </g>
                      )
                      : co
                        ? <text x={X[1]} y={y + 3} fontSize={10.5} fontWeight={600} fill={BR}>{co}</text>
                        : <Chip cx={X[1] + 38} cy={y - 1} label="No company" />}
                    <text x={X[2]} y={y + 3} fontSize={10.5} fill={contact === '—' ? MUT : INK}>{contact}</text>
                    <Chip cx={X[3] + 32} cy={y - 1} label={src} />
                    <text x={X[4]} y={y + 3} fontSize={10.5} fontWeight={600} fill={GRN}>Answered</text>
                  </g>
                )
              })}
            </g>
          )
        })()}
        <text x={740} y={806} fontSize={10.5} fill={MUT}>
          On top of the page: <tspan fontWeight={700} fill={INK}>Today · 11 answered · CRM call 3 · Number 2 · Rep 1 · Admin 1 · Waiting 4</tspan>
        </text>
        <text x={740} y={821} fontSize={10.5} fill={MUT}>Beside it: Sync from CRM · Sync from Callio. Mostly Rep / Admin = the team dials from Callio, not the CRM.</text>
      </svg>
    </div>
  )
}
