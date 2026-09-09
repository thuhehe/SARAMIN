/* ── Company verification — who does what, on which side, and what it unlocks ─────
 *
 * Two swim-lanes, because the whole point of this flow is the HAND-OFF: the employer
 * acts on the Company site, the admin acts in the console, and the state that joins
 * them is one flag on the company record. Read left to right.
 *
 * THREE THINGS THIS DRAWING EXISTS TO SETTLE.
 *
 * ONE — the gate moved. It used to be LOGIN: a self-registered person waited until
 * an admin placed them. Now the email link is the only thing between sign-up and
 * being inside the console. What waits for the admin is VERIFICATION, and what it
 * gates is narrow: the employer posting a job, and Sales requesting the official
 * invoice. Everything else — reading, uploading the ERC, fixing company details —
 * is open while Unverified.
 *
 * TWO — two states, not three. Verified / Unverified. "Was verified, then an admin
 * changed identity data" is Unverified with a reason, and the same Verify button
 * clears it. Every gate reads one yes/no.
 *
 * THREE — verified means frozen on the customer side. Once an admin has checked the
 * legal name and MST against the certificate, the employer can no longer edit them;
 * only an admin can, and doing so drops the flag until it is checked again. Two
 * people editing a verified identity independently is how the invoice and the
 * certificate stop matching.
 *
 * FOUR — the admin has TWO jobs here, and they are independent and differently
 * timed (page feedback 09/09/2026). (A) Ghép trùng: if the company already exists —
 * on Customers or in Free data — the admin may place the person there the moment
 * the Sign-ups row appears, right after the email is verified; this never waits
 * for verification. (B) Xác minh: no deadline of its own — "thong thả" — as long as
 * it is done before the two gates (post a job · official invoice). The admin lane
 * is therefore drawn as two labelled groups with a divider, not as one chain.
 */
const INK = 'var(--color-ink)'
const MUT = 'var(--color-muted)'
const BR = 'var(--color-brand)'
const AMB = '#b45309'
const BLUE = '#1d4ed8'
const SLATE = '#475569'
const GRN = '#047857'

function Box({ x, y, w, h, title, sub, sub2, tone = 'plain' }: {
  x: number; y: number; w: number; h: number; title: string; sub?: string; sub2?: string
  tone?: 'plain' | 'amber' | 'blue' | 'gate' | 'green' | 'stop'
}) {
  const fill = tone === 'amber' ? '#fffbeb' : tone === 'blue' ? '#eff6ff' : tone === 'gate' ? 'var(--color-brand-soft)' : tone === 'green' ? '#ecfdf5' : tone === 'stop' ? '#fff1f2' : 'var(--color-surface)'
  const stroke = tone === 'amber' ? AMB : tone === 'blue' ? BLUE : tone === 'gate' ? BR : tone === 'green' ? GRN : tone === 'stop' ? '#e11d48' : 'var(--color-line)'
  const tc = tone === 'amber' ? AMB : tone === 'blue' ? BLUE : tone === 'gate' ? BR : tone === 'green' ? GRN : tone === 'stop' ? '#be123c' : INK
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={sub ? y + h / 2 - (sub2 ? 12 : 5) : y + h / 2 + 4} fontSize={12.5} fontWeight={700} textAnchor="middle" fill={tc}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + (sub2 ? 4 : 11)} fontSize={10.5} textAnchor="middle" fill={MUT}>{sub}</text>}
      {sub2 && <text x={x + w / 2} y={y + h / 2 + 19} fontSize={10.5} textAnchor="middle" fill={MUT}>{sub2}</text>}
    </g>
  )
}

function Arrow({ d, label, lx, ly, tone = 'plain', dashed }: { d: string; label?: string; lx?: number; ly?: number; tone?: 'plain' | 'brand' | 'amber' | 'blue' | 'stop'; dashed?: boolean }) {
  const c = tone === 'brand' ? BR : tone === 'amber' ? AMB : tone === 'blue' ? BLUE : tone === 'stop' ? '#e11d48' : 'var(--color-line-soft)'
  const head = tone === 'brand' ? 'b' : tone === 'amber' ? 'a' : tone === 'blue' ? 'u' : tone === 'stop' ? 's' : 'p'
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={1.8} strokeDasharray={dashed ? '4 3' : undefined} markerEnd={`url(#cv-${head})`} />
      {label && <text x={lx} y={ly} fontSize={11} fontWeight={600} textAnchor="middle" fill={tone === 'plain' ? MUT : c}>{label}</text>}
    </g>
  )
}

/** the tag exactly as it renders on both sites — so the drawing and the screens agree */
function Tag({ x, y, verified }: { x: number; y: number; verified: boolean }) {
  /* Slate, not amber: at this point in the flow the company is missing paperwork,
     which is the employer's move — amber is reserved for "Chờ xác minh", the queue
     an admin can clear. Same split as the tag on both screens. */
  const c = verified ? BLUE : SLATE
  const bg = verified ? '#eff6ff' : '#f1f5f9'
  const label = verified ? 'Verified' : 'Thiếu hồ sơ'
  const w = verified ? 78 : 82
  return (
    <g>
      <rect x={x} y={y} width={w} height={20} rx={10} fill={bg} stroke={c} strokeWidth={1.2} />
      {verified && <path d={`M ${x + 12} ${y + 5} l -4 1.6 v 3 c 0 2.6 1.9 4.8 4 5.4 2.1 -.6 4 -2.8 4 -5.4 v -3 z`} fill="none" stroke={c} strokeWidth={1.1} />}
      <text x={x + (verified ? 22 : 10)} y={y + 14} fontSize={10.5} fontWeight={700} fill={c}>{label}</text>
    </g>
  )
}

export function CompanyVerificationFlow() {
  return (
    /* FITS THE CARD. The drawing scales to the requirement card's width instead of
       claiming a fixed 1080px and scrolling — on a 1920 screen the card is ~1040px,
       so the fixed width clipped the right edge and the reader saw half a label
       (page feedback 09/09/2026). The floor only kicks in on a phone. */
    <div className="my-4 overflow-x-auto rounded-xl border border-line bg-canvas/40 p-3">
      <svg viewBox="0 0 1420 918" className="h-auto w-full min-w-[860px]" role="img" aria-label="Company verification — the employer's steps on the Company site, the admin's steps in the console, and what Verified unlocks">
        <defs>
          <marker id="cv-p" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-line-soft)" /></marker>
          <marker id="cv-b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={BR} /></marker>
          <marker id="cv-a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={AMB} /></marker>
          <marker id="cv-u" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={BLUE} /></marker>
          <marker id="cv-s" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#e11d48" /></marker>
        </defs>

        {/* ── premise ─────────────────────────────────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={58} rx={10} fill="var(--color-brand-soft)" stroke={BR} strokeWidth={1.5} />
        <text x={36} y={39} fontSize={12.5} fontWeight={800} fill={BR}>XÁC MINH CÔNG TY (ERC) — email mở cửa ĐĂNG NHẬP, admin mở cửa ĐĂNG TIN & XUẤT HÓA ĐƠN</text>
        <text x={36} y={60} fontSize={11} fill={MUT}>
          Employer: đăng ký → xác minh email → vào console ngay (công ty tạo cùng lúc, user là Admin). Admin có HAI việc độc lập: (A) ghép trùng — làm ngay nếu công ty đã có trên Customers / Free data; (B) xác minh — thong thả, miễn xong trước khi đăng tin / xuất hóa đơn.
        </text>

        {/* ── lane labels ─────────────────────────────────────────────────────── */}
        <rect x={20} y={92} width={1380} height={330} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={116} fontSize={11} fontWeight={800} fill={MUT}>COMPANY SITE — employer</text>
        <rect x={20} y={440} width={1380} height={330} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={464} fontSize={11} fontWeight={800} fill={MUT}>ADMIN — Saramin · hai việc độc lập nhau</text>

        {/* ── COMPANY LANE ────────────────────────────────────────────────────── */}
        <Box x={38} y={140} w={230} h={74} title="① Sign up" sub="Họ tên · email · SĐT · mật khẩu" sub2="MST · tên công ty · đang tuyển?" tone="plain" />
        {/* the new field, drawn as its own strip under the form so nobody reads it as required */}
        <rect x={38} y={222} width={230} height={30} rx={8} fill="#fffbeb" stroke={AMB} strokeWidth={1.2} strokeDasharray="4 3" />
        <text x={153} y={241} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={AMB}>+ ERC — tuỳ chọn · nhiều file</text>

        <Arrow d="M 268 177 L 306 177" tone="brand" />
        <Box x={308} y={140} w={210} h={74} title="② Email xác minh" sub="gửi ngay khi bấm Register" sub2="bấm link → email verified" tone="gate" />

        <Arrow d="M 518 177 L 556 177" tone="brand" label="ngay lập tức" lx={537} ly={166} />
        {/* The question this box has to answer without being asked: does the person
            belong to a company at this point? YES, always — the click that created
            the login created the company, and the person is its first Admin. There is
            no orphan-user state anywhere in the product. */}
        <Box x={558} y={128} w={260} h={98} title="③ Đăng nhập & dùng console" sub="công ty TẠO NGAY · user = Admin đầu tiên" sub2="không có user mồ côi — luôn thuộc 1 công ty" tone="amber" />
        <Tag x={640} y={200} verified={false} />

        {/* what is locked while unverified */}
        <Arrow d="M 688 226 L 688 262" tone="amber" />
        <Box x={558} y={264} w={260} h={64} title="KHÓA khi chưa xác minh" sub="Post job (kể cả draft) — disabled" sub2="kèm 3 mục còn thiếu ✓/✗ + link Company information" tone="stop" />

        <Arrow d="M 818 165 L 856 165" tone="brand" label="nút cạnh tag" lx={837} ly={154} />
        <Box x={858} y={128} w={250} h={74} title="④ Company information" sub="điền địa chỉ đăng ký MST · upload ERC" sub2="banner ✓/✗ 3 mục · Figma 2311 · 2313" tone="plain" />

        {/* the verified state on the company side */}
        <Box x={1140} y={128} w={240} h={98} title="⑥ Tag xanh — Verified" sub="Post job MỞ (draft không cần invoice)" sub2="Company info CHỈ ĐỌC — đổi qua Saramin" tone="blue" />
        <Tag x={1222} y={200} verified />

        {/* ── ADMIN LANE — two groups, a divider between them ──────────────────── */}
        {/* JOB A — resolve a duplicate, RIGHT AWAY. The row appears the moment the
            email is verified, and Move / merge are enabled at once; nothing here
            waits for the ERC or for verification. */}
        <text x={318} y={482} fontSize={10.5} fontWeight={800} fill={AMB}>VIỆC A · LÀM NGAY khi email verified — ghép trùng nếu công ty đã tồn tại</text>
        <Box x={318} y={492} w={230} h={74} title="Sign-ups — 1 dòng xuất hiện" sub="ngay khi email verified" sub2="Match: Customers? Free data? Không?" tone="plain" />
        <Arrow d="M 548 529 L 588 529" tone="amber" />
        <Box x={590} y={492} w={250} h={94} title="Ghép trùng — không chờ verify" sub="Có trên Customers → Move user vào đó" sub2="Có ở Free data → gộp dòng vào công ty mới" tone="amber" />
        <text x={715} y={606} fontSize={10.5} textAnchor="middle" fill={MUT}>Không trùng → không làm gì ở đây; dòng tự đóng khi công ty được Verify</text>

        {/* the divider IS the statement: nothing flows from A into B */}
        <line x1={852} y1={474} x2={852} y2={764} stroke="var(--color-line)" strokeWidth={1.5} strokeDasharray="5 4" />

        {/* JOB B — verify, at leisure. No deadline of its own; the two gates are the
            only hard stops, and the button opens when the three inputs are in. */}
        <text x={866} y={482} fontSize={10.5} fontWeight={800} fill={BR}>VIỆC B · THONG THẢ — xác minh, miễn xong trước khi đăng tin / xuất hóa đơn</text>
        <Box x={866} y={492} w={250} h={74} title="Customers — cột Verified" sub="filter “Unverified · ready to verify”" sub2="hàng ghi rõ thiếu gì · chip Chờ verify" tone="plain" />

        <Arrow d="M 991 566 L 991 604" tone="brand" />
        <Box x={866} y={606} w={250} h={94} title="⑤ Company detail → Verify" sub="nút chỉ bấm được khi đủ 3 input:" sub2="MST · địa chỉ đăng ký MST · ERC" tone="gate" />

        <Arrow d="M 1116 653 L 1146 653" tone="blue" />
        <Box x={1148} y={606} w={232} h={94} title="VERIFIED" sub="Sales: “Yêu cầu xuất hóa đơn chính” MỞ" sub2="Kế toán chỉ xuất từ yêu cầu này" tone="green" />

        {/* admin edit knocks it back */}
        <Arrow d="M 1264 700 C 1264 762, 1070 762, 991 746 L 991 702" tone="amber" dashed label="admin SỬA hồ sơ đã verified → Chưa xác minh (cần xác minh lại)" lx={1135} ly={779} />

        {/* ── cross-lane hand-offs ──────────────────────────────────────────────── */}
        {/* email verified → the row appears for the admin */}
        {/* Drawn from ②, not ③: the row exists the moment the email is verified,
            before the person has reached the console — the timing is read off the
            picture. The label sits LEFT of the line, so the line never runs
            through the words (it did, on the old curve). */}
        <Arrow d="M 413 214 L 433 490" tone="brand" dashed />
        <text x={322} y={346} fontSize={11} fontWeight={600} textAnchor="middle" fill={BR}>email verified →</text>
        <text x={322} y={361} fontSize={11} fontWeight={600} textAnchor="middle" fill={BR}>1 dòng Sign-ups xuất hiện ngay</text>
        {/* ERC uploaded → lands on the admin's document card */}
        <Arrow d="M 983 202 C 983 300, 991 400, 991 490" tone="amber" dashed label="ERC hiện ở card Enterprise Registration Documents" lx={1130} ly={392} />
        {/* verify → the tag on the company side turns blue */}
        <Arrow d="M 1300 606 L 1300 228" tone="blue" />
        <text x={1236} y={318} fontSize={11} fontWeight={600} textAnchor="middle" fill={BLUE}>Verify xong →</text>
        <text x={1236} y={333} fontSize={11} fontWeight={600} textAnchor="middle" fill={BLUE}>tag đổi màu xanh</text>

        {/* ── the invariant ────────────────────────────────────────────────────── */}
        <rect x={20} y={792} width={1380} height={108} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={40} y={816} fontSize={11.5} fontWeight={800} fill={AMB}>Luật bất biến</text>
        <text x={40} y={838} fontSize={11} fill={INK}>
          <tspan fontWeight={700}>Verified là CỔNG cho đúng hai việc</tspan>: employer đăng tin (kể cả draft) · Sales yêu cầu xuất hóa đơn chính. Không gate đăng nhập, không gate đọc/sửa/upload.
        </text>
        <text x={40} y={856} fontSize={11} fill={INK}>
          <tspan fontWeight={700}>Hai trạng thái, không ba</tspan>: Verified · Unverified. “Đã verify rồi admin sửa” = Unverified + lý do <tspan fontStyle="italic">cần xác minh lại</tspan> — cùng nút Verify để xóa.
        </text>
        <text x={40} y={874} fontSize={11} fill={INK}>
          <tspan fontWeight={700}>Verified thì phía employer chỉ đọc</tspan> — chỉ admin sửa được định danh, và sửa là rớt cờ. Hai bên cùng sửa một định danh đã xác minh là cách hóa đơn và giấy phép lệch nhau.
        </text>
        <text x={40} y={892} fontSize={11} fill={INK}>
          <tspan fontWeight={700}>Hai việc của admin độc lập nhau</tspan>: ghép trùng (Move / gộp Free data) làm ngay khi dòng Sign-ups xuất hiện — không chờ verify; verify không có deadline riêng, chỉ phải xong trước hai cổng trên.
        </text>
      </svg>
    </div>
  )
}
