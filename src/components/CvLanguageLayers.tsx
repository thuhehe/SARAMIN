/*
 * WHY A CV IN ANY LANGUAGE IS SEARCHABLE — and where that stops being true.
 *
 * Drawn rather than tabulated because the thing developers get wrong here is not
 * a fact, it is a SHAPE: they read "we support multi-language CVs" as one
 * property of one system, when it is two indexes with opposite behaviour fed by
 * one extraction step. The picture puts the fork on screen.
 *
 * The four things it has to carry:
 *
 *  1. THERE IS EXACTLY ONE PLACE LANGUAGE MATTERS — extraction. Everything above
 *     it is a document in some language; everything below it is either an id
 *     (language gone) or raw text (language kept). One box, one fork.
 *  2. THE TWO LAYERS ARE NOT A DESIGN CHOICE, they are what did and did not
 *     resolve. So the left panel lists FIELDS and the right lists PROSE, and the
 *     reason a field is on one side is never "we decided" — it is "a master
 *     exists" or "no master exists".
 *  3. EACH LAYER HAS EXACTLY ONE CONSUMER, and the consumer belongs INSIDE the
 *     layer, not in a separate row underneath it. Layer 1 IS the filter rail's
 *     data; layer 2 IS the keyword boxes' data. Drawing them apart (as the first
 *     version did) invited the reading that they were four things rather than
 *     two, which is exactly backwards — the point is that storage and reach are
 *     the same fact seen twice.
 *  4. LAYER 1 CAN COME BACK EMPTY, and that is the failure nobody plans for: an
 *     unextractable language yields 0 skills, which the qualification rule reads
 *     as "not enough information" and blames on the candidate. Drawn as a CHAIN
 *     rather than a paragraph, because the first version stated the conclusion
 *     and readers could not see how it followed.
 *
 * The worked example (a Korean CV, one line of it) runs through both panels so
 * the same source text can be followed to a hit on one side and a miss on the
 * other. Abstract boxes let a reader agree with the diagram without testing it
 * against anything.
 *
 * SVG for the same reasons as CvStatusFlow: elbow connectors, and it has to
 * survive being screenshotted into a chat. Structure uses theme tokens; the two
 * layer colours are the console's ok / bad pastels, because "works in any
 * language" and "breaks across languages" is exactly a pass/fail pair.
 */

const OK = { fill: '#ecfdf5', line: '#a7f3d0', text: '#047857' }
const BAD = { fill: '#fff1f2', line: '#fecdd3', text: '#be123c' }
const WARN = { fill: '#fffbeb', line: '#fde68a', text: '#b45309' }

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

/* An elbow: straight down, across, then down into the target. Rounded corners so
   it reads as one connector rather than three segments. */
function elbow(x1: number, y1: number, x2: number, y2: number) {
  const mid = y1 + 22
  const dir = x2 > x1 ? 1 : -1
  return `M${x1} ${y1} L${x1} ${mid - 10} Q${x1} ${mid} ${x1 + 10 * dir} ${mid} L${x2 - 10 * dir} ${mid} Q${x2} ${mid} ${x2} ${mid + 10} L${x2} ${y2}`
}

/** One field or one prose block — the contents of a layer, as a labelled pill. */
function Item({ x, y, w, label, tone }: { x: number; y: number; w: number; label: string; tone: typeof OK }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={26} rx={7} fill="var(--color-surface)" stroke={tone.line} strokeWidth={1.2} />
      <circle cx={x + 13} cy={y + 13} r={3} fill={tone.text} />
      <text x={x + 25} y={y + 17} fontSize={11.5} fill="var(--color-ink)">{label}</text>
    </g>
  )
}

/* LEFT — resolved. Every one of these is a filter field, and the list is the
   PM's eight (2026-08-22): the test for being here is that a reference list or a
   closed enum supplies the values. */
const RESOLVED = [
  ['Skills', 'Nationality'],
  ['Language + level', 'Gender'],
  ['Highest education', 'Marital status'],
  ['Years of experience', 'Age'],
]

/* RIGHT — not resolved. Note the last pair: job title and certificate name are
   here because NO master exists for them, which is the same reason they were cut
   from the filter rail. The two facts are one fact. */
const RAW = [
  ['About / giới thiệu', 'Tên công ty'],
  ['Mô tả công việc', 'Job title'],
  ['Mô tả dự án', 'Tên chứng chỉ'],
]

export function CvLanguageLayers() {
  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox="0 0 1400 930" className="h-auto w-full min-w-[1020px]" role="img" aria-label="How a CV in any language is indexed: master-data ids versus raw text">
        <defs>
          {['#94a3b8', OK.text, BAD.text].map((c) => (
            <marker key={c} id={`la-${c.slice(1)}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* ── the source document ─────────────────────────────────────────── */}
        <rect x={530} y={20} width={340} height={92} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1.5} />
        <text x={550} y={44} fontSize={12} fontWeight={700} fill="var(--color-ink)">MỘT CV — bất kỳ ngôn ngữ nào</text>
        <text x={550} y={70} fontSize={12} fontFamily={MONO} fill="var(--color-ink)">리액트 · 프로젝트 관리 3년</text>
        <text x={550} y={92} fontSize={12} fontFamily={MONO} fill="var(--color-ink)">서울대학교 · 정보통신공학</text>

        <path d="M700 112 L700 152" stroke="#94a3b8" strokeWidth={1.6} fill="none" markerEnd="url(#la-94a3b8)" />

        {/* ── the ONE step where language matters ─────────────────────────── */}
        <rect x={548} y={152} width={304} height={80} rx={12} fill="var(--color-canvas)" stroke="var(--color-line)" strokeWidth={1.8} />
        <text x={700} y={180} fontSize={13.5} fontWeight={700} textAnchor="middle" fill="var(--color-ink)">EXTRACTION</text>
        <text x={700} y={202} fontSize={12.5} textAnchor="middle" fill="var(--color-ink)">chữ  →  id</text>
        <text x={700} y={222} fontSize={10.5} textAnchor="middle" fill="var(--color-muted)">bước DUY NHẤT trong hệ thống quan tâm tới ngôn ngữ</text>

        <path d={elbow(700, 232, 350, 292)} stroke={OK.text} strokeWidth={1.6} fill="none" markerEnd={`url(#la-${OK.text.slice(1)})`} />
        <path d={elbow(700, 232, 1050, 292)} stroke={BAD.text} strokeWidth={1.6} fill="none" markerEnd={`url(#la-${BAD.text.slice(1)})`} />
        <text x={470} y={248} fontSize={11} fontWeight={600} textAnchor="end" fill={OK.text}>resolve được ✓</text>
        <text x={930} y={248} fontSize={11} fontWeight={600} fill={BAD.text}>không resolve được ✗</text>

        {/* ══ LAYER 1 — data, index and the surface that reads it, in ONE box ══ */}
        <rect x={40} y={292} width={620} height={372} rx={14} fill={OK.fill} stroke={OK.line} strokeWidth={1.8} />
        <rect x={40} y={292} width={620} height={40} rx={14} fill={OK.line} />
        <rect x={40} y={318} width={620} height={14} fill={OK.line} />
        <text x={62} y={318} fontSize={13} fontWeight={700} fill={OK.text}>LAYER 1 · MASTER DATA (ids)</text>
        <text x={638} y={318} fontSize={12} fontWeight={700} textAnchor="end" fill={OK.text}>khớp trên ID</text>

        <text x={62} y={354} fontSize={10} fontWeight={700} letterSpacing={0.6} fill={OK.text}>CÁI GÌ NẰM Ở ĐÂY</text>
        {RESOLVED.map((pair, i) =>
          pair.map((label, col) => <Item key={label} x={62 + col * 300} y={364 + i * 32} w={278} label={label} tone={OK} />),
        )}
        <text x={62} y={504} fontSize={10.5} fill="var(--color-muted)">Điều kiện để có mặt ở đây: <tspan fontWeight={700} fill={OK.text}>tồn tại một reference list</tspan> để resolve về.</text>

        <line x1={62} y1={516} x2={638} y2={516} stroke={OK.line} strokeWidth={1.2} />
        <text x={62} y={534} fontSize={10} fontWeight={700} letterSpacing={0.6} fill={OK.text}>INDEX LƯU GÌ</text>
        <text x={62} y={554} fontSize={11.5} fontFamily={MONO} fill="var(--color-ink)">skill_id:812 · edu_level:BACHELOR · lang:ko|C2</text>

        <line x1={62} y1={568} x2={638} y2={568} stroke={OK.line} strokeWidth={1.2} />
        <text x={62} y={586} fontSize={10} fontWeight={700} letterSpacing={0.6} fill={OK.text}>AI ĐỌC LAYER NÀY</text>
        <text x={62} y={608} fontSize={12.5} fontWeight={700} fill="var(--color-ink)">FILTER RAIL (8 dropdown) — VÀ ô từ khoá, khi từ khoá resolve được</text>
        <text x={62} y={630} fontSize={11.5} fontWeight={600} fill={OK.text}>✅ Lọc “React” → CV tiếng Hàn ở trên VẪN RA.</text>
        <text x={62} y={648} fontSize={10.5} fill="var(--color-muted)">Gõ “React”, “Kế toán”, “Hồ Chí Minh” vào ô từ khoá cũng rơi vào đây — resolve được là thành ID.</text>

        {/* ══ LAYER 2 ═══════════════════════════════════════════════════════ */}
        <rect x={740} y={292} width={620} height={372} rx={14} fill={BAD.fill} stroke={BAD.line} strokeWidth={1.8} />
        <rect x={740} y={292} width={620} height={40} rx={14} fill={BAD.line} />
        <rect x={740} y={318} width={620} height={14} fill={BAD.line} />
        <text x={762} y={318} fontSize={13} fontWeight={700} fill={BAD.text}>LAYER 2 · RAW TEXT (no master data)</text>
        <text x={1338} y={318} fontSize={12} fontWeight={700} textAnchor="end" fill={BAD.text}>khớp trên CHỮ</text>

        <text x={762} y={354} fontSize={10} fontWeight={700} letterSpacing={0.6} fill={BAD.text}>CÁI GÌ NẰM Ở ĐÂY</text>
        {RAW.map((pair, i) =>
          pair.map((label, col) => <Item key={label} x={762 + col * 300} y={364 + i * 32} w={278} label={label} tone={BAD} />),
        )}
        <text x={762} y={480} fontSize={10.5} fill="var(--color-muted)">
          <tspan fontWeight={700} fill={BAD.text}>Job title</tspan> và <tspan fontWeight={700} fill={BAD.text}>Tên chứng chỉ</tspan> nằm ở đây vì không có master data — cũng
        </text>
        <text x={762} y={496} fontSize={10.5} fill="var(--color-muted)">đúng là lý do hai field đó bị cắt khỏi filter rail ngày 22/08. Một sự thật, hai hệ quả.</text>

        <line x1={762} y1={516} x2={1338} y2={516} stroke={BAD.line} strokeWidth={1.2} />
        <text x={762} y={534} fontSize={10} fontWeight={700} letterSpacing={0.6} fill={BAD.text}>INDEX LƯU GÌ</text>
        <text x={762} y={554} fontSize={11.5} fontFamily={MONO} fill="var(--color-ink)">text:&quot;프로젝트 관리 3년&quot; · lang:ko</text>

        <line x1={762} y1={568} x2={1338} y2={568} stroke={BAD.line} strokeWidth={1.2} />
        <text x={762} y={586} fontSize={10} fontWeight={700} letterSpacing={0.6} fill={BAD.text}>AI ĐỌC LAYER NÀY</text>
        <text x={762} y={608} fontSize={12.5} fontWeight={700} fill="var(--color-ink)">Ô TỪ KHOÁ — chỉ phần KHÔNG resolve được</text>
        <text x={762} y={630} fontSize={11.5} fontWeight={600} fill={BAD.text}>❌ “quản lý dự án” không có trong master → khớp chữ → trượt CV tiếng Hàn.</text>
        <text x={762} y={648} fontSize={10.5} fill="var(--color-muted)">Folding / prefix / fuzzy đều chạy TRONG một ngôn ngữ, không cái nào bắc qua.</text>

        {/* ── consequence of Layer 1, drawn as the CHAIN it actually is ────── */}
        {/* Full-width now: with the Layer-2 panel removed, a 620-wide box left
            half the row empty and read as something missing rather than something
            deliberately not drawn. */}
        <rect x={40} y={696} width={1320} height={158} rx={12} fill={WARN.fill} stroke={WARN.line} strokeWidth={1.8} />
        <text x={62} y={720} fontSize={11.5} fontWeight={700} fill={WARN.text}>⚠ LAYER 1 RỖNG → CV BỊ CHẶN, không phải vì CV yếu</text>
        <line x1={68} y1={732} x2={68} y2={820} stroke={WARN.line} strokeWidth={2} />
        <text x={82} y={748} fontSize={11} fill="var(--color-ink)">CV tiếng Hàn, extraction không nhận ra <tspan fontFamily={MONO}>리액트</tspan></text>
        <text x={82} y={768} fontSize={11} fill="var(--color-ink)">→ Layer 1 nhận về <tspan fontWeight={700}>0 skill</tspan></text>
        <text x={82} y={788} fontSize={11} fill="var(--color-ink)">→ Luật qualify cần ≥ 3 skill, nên ghi <tspan fontFamily={MONO}>Not enough information</tspan></text>
        <text x={82} y={808} fontSize={11} fill="var(--color-ink)">→ CV bị chặn: không apply được, không lên CV search</text>
        <text x={62} y={836} fontSize={10.5} fill={WARN.text}>Ứng viên nhận thông báo “hồ sơ chưa đủ thông tin” — sai, lỗi là mình không đọc được.</text>

        {/* The Layer-2 consequence panel — “⏭ DỊCH TỪ KHOÁ — ĐỂ PHASE SAU” — was
            removed on request: it described work that is NOT being built, and a
            deferred feature drawn beside two shipping layers reads as a third thing
            to build. The deferral itself is still recorded in the section’s bullets,
            which is where a decision belongs rather than in a build diagram. */}

        {/* the one sentence the picture is making */}
        <text x={40} y={884} fontSize={11.5} fontWeight={600} fill="var(--color-ink)">
          Một câu: ô từ khoá thử resolve TRƯỚC — resolve được thì thành Layer 1 (mọi ngôn ngữ đều ra); không resolve được mới rơi xuống Layer 2 và phải đúng tiếng CV viết.
        </text>
        <text x={40} y={906} fontSize={11} fill="var(--color-muted)">
          Hệ quả cho dev: mọi field muốn thành filter phải resolve được về một reference list. Không có master thì nó rơi xuống Layer 2, và Layer 2 không lọc được.
        </text>
      </svg>
    </div>
  )
}
