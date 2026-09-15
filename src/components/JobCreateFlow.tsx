/* ── How a job gets created — two doors, one Job entity, one lifecycle ──────────
 *
 * Drawn for the client (15/09/2026), who asked for "a create-job diagram" and, in
 * the same conversation, surfaced the case the spec had only implied: an employer
 * whose company is VERIFIED but holds NO official invoice yet can still open the
 * form and save a draft — they just cannot publish, and they never see the Free
 * tier (that one is Admin's alone). So the picture has to say three things at once:
 *
 *   ONE — the two doors differ in WHAT THEY MAY POST FROM (Free tier / PO line for
 *         HQ, held products for the employer), not in the form or the lifecycle.
 *   TWO — VERIFIED is the only employer-side gate that stops everything; "no
 *         product yet" and "no slots left" both still allow a draft.
 *   THREE — a slot is spent at PUBLISH, never at draft, and nobody approves anything.
 *
 * Every box is a rule that already exists on the Create job page; the drawing adds
 * none of its own. If the two ever disagree, the table wins and this file is the
 * one to fix. Labels are Vietnamese like the other flow drawings — the client reads
 * them; system words (Draft, Open, Publish, PO, Free tier) stay as the spec spells them.
 */
const INK = 'var(--color-ink)'
const MUT = 'var(--color-muted)'
const BR = 'var(--color-brand)'
const AMB = '#b45309'
const GRN = '#047857'

/** one rounded box with a title and up to two subtitle lines */
function Box({ x, y, w, h, title, sub, sub2, tone = 'plain' }: {
  x: number; y: number; w: number; h: number; title: string; sub?: string; sub2?: string
  tone?: 'plain' | 'pool' | 'crm' | 'gate' | 'stop'
}) {
  const fill = tone === 'pool' ? '#fffbeb' : tone === 'crm' ? '#ecfdf5' : tone === 'gate' ? 'var(--color-brand-soft)' : tone === 'stop' ? '#fff1f2' : 'var(--color-surface)'
  const stroke = tone === 'pool' ? AMB : tone === 'crm' ? GRN : tone === 'gate' ? BR : tone === 'stop' ? '#e11d48' : 'var(--color-line)'
  const tc = tone === 'pool' ? AMB : tone === 'crm' ? GRN : tone === 'gate' ? BR : tone === 'stop' ? '#be123c' : INK
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <text x={x + w / 2} y={sub ? y + h / 2 - (sub2 ? 12 : 5) : y + h / 2 + 4} fontSize={12.5} fontWeight={700} textAnchor="middle" fill={tc}>{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + (sub2 ? 4 : 11)} fontSize={10.5} textAnchor="middle" fill={MUT}>{sub}</text>}
      {sub2 && <text x={x + w / 2} y={y + h / 2 + 19} fontSize={10.5} textAnchor="middle" fill={MUT}>{sub2}</text>}
    </g>
  )
}

function Arrow({ d, label, lx, ly, tone = 'plain' }: { d: string; label?: string; lx?: number; ly?: number; tone?: 'plain' | 'brand' | 'stop' }) {
  const c = tone === 'brand' ? BR : tone === 'stop' ? '#e11d48' : 'var(--color-line-soft)'
  const head = tone === 'brand' ? 'b' : tone === 'stop' ? 's' : 'p'
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={1.8} markerEnd={`url(#jc-${head})`} />
      {label && <text x={lx} y={ly} fontSize={10} fontWeight={600} textAnchor="middle" fill={tone === 'plain' ? MUT : c}>{label}</text>}
    </g>
  )
}

export function JobCreateFlow() {
  return (
    /* Same width rule as the other flow drawings: min-w matches the viewBox so the
       type renders at the size it was authored at and the reader pans on a phone. */
    <div className="mt-2 overflow-x-auto">
      <p className="mb-1 text-[11px] text-faint">Sơ đồ rộng — kéo ngang để xem hết →</p>
      <svg viewBox="0 0 1420 790" className="h-auto w-full min-w-[860px]" role="img" aria-label="How a job is created by HQ and by the employer, and the one lifecycle both feed">
        <defs>
          {[['p', 'var(--color-line-soft)'], ['b', BR], ['s', '#e11d48']].map(([k, c]) => (
            <marker key={k} id={`jc-${k}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* ── the premise, stated once ─────────────────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={54} rx={10} fill="var(--color-canvas)" stroke="var(--color-line)" strokeWidth={1.5} />
        <text x={38} y={40} fontSize={13} fontWeight={800} fill={INK}>TẠO JOB — hai cửa vào, MỘT Job entity, MỘT lifecycle</text>
        <text x={38} y={58} fontSize={11} fill={MUT}>
          Admin (HQ) đăng thay công ty bằng <tspan fontWeight={700} fill={INK}>Free tier hoặc PO</tspan> · Nhà tuyển dụng đăng bằng <tspan fontWeight={700} fill={INK}>gói đã mua</tspan> · Draft luôn lưu được, kể cả khi chưa có hóa đơn — <tspan fontWeight={700} fill={INK}>VERIFIED là cổng bắt buộc duy nhất</tspan>.
        </text>

        {/* ── DOOR 1 · Admin ───────────────────────────────────────────────────── */}
        <text x={38} y={100} fontSize={11} fontWeight={800} fill={MUT}>CỬA 1 · ADMIN (HQ) — Company detail → Jobs → + New job · đăng thay bất kỳ công ty</text>

        <Box x={38} y={116} w={220} h={68} title="Chọn công ty" sub="picker — bất kỳ công ty" />
        <Arrow d="M 258 150 L 296 150" tone="brand" />
        <Box x={298} y={116} w={330} h={68} title="Chọn nguồn đăng tin" sub="① Free tier (Always available) — không PO, không giới hạn" sub2="② PO của công ty → dòng sản phẩm đã mua" tone="gate" />
        <Arrow d="M 628 150 L 666 150" tone="brand" />
        <Box x={668} y={116} w={200} h={68} title="Điền form" sub="cùng field với cửa 2" />
        <Arrow d="M 868 150 L 906 150" tone="brand" />
        <Box x={908} y={116} w={250} h={68} title="Save draft · Publish" sub="Post now → Open · Schedule for later → Schedule" sub2="HQ đăng được kể cả khi công ty hết slot" />
        <text x={38} y={206} fontSize={10.5} fill={MUT}>
          Concierge override: HQ được đăng vượt slot còn lại của công ty — có ghi audit. Free job: không PO, không trừ quota, không lên báo cáo doanh thu, không nâng cấp lên tier trả phí được.
        </text>

        {/* ── DOOR 2 · Employer ────────────────────────────────────────────────── */}
        <line x1={20} y1={226} x2={1400} y2={226} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="5 4" />
        <text x={38} y={248} fontSize={11} fontWeight={800} fill={MUT}>CỬA 2 · NHÀ TUYỂN DỤNG (Company site) — My jobs → Create job · chỉ HR Manager / HR Specialist · công ty cố định, KHÔNG chọn PO</text>

        {/* row 1 — the gates, left to right */}
        <Box x={38} y={264} w={250} h={72} title="Công ty đã Verified?" sub="cổng DUY NHẤT chặn cả Save draft" tone="gate" />
        <Arrow d="M 288 300 L 326 300" tone="brand" label="Rồi" lx={307} ly={292} />
        <Box x={328} y={264} w={330} h={72} title="Đã có sản phẩm đăng tin?" sub="= hóa đơn GTGT chính thức đã xuất → entitlement" sub2="Free tier KHÔNG bao giờ xuất hiện ở đây" tone="gate" />
        <Arrow d="M 658 300 L 696 300" tone="brand" label="Có" lx={677} ly={292} />
        <Box x={698} y={264} w={250} h={72} title="Chọn tier từ gói đang giữ" sub="quota còn lại hiện ngay bên cạnh" sub2="không chọn PO — hệ thống suy từ gói" tone="gate" />
        <Arrow d="M 948 300 L 986 300" tone="brand" label="còn slot" lx={967} ly={292} />
        <Box x={988} y={264} w={180} h={72} title="Điền form" sub="cùng field với Admin" />
        <Arrow d="M 1168 300 L 1206 300" tone="brand" />
        <Box x={1208} y={264} w={190} h={72} title="Save draft · Publish" sub="Publish trừ ĐÚNG 1 slot" sub2="Draft không trừ gì" />

        {/* row 2 — where each "no" lands. The rose box stops everything; the two
            amber boxes are ONE form state ("nothing to publish from") and both
            still save a draft. The second amber box is the case the client review
            surfaced on 15/09/2026, hence the tag. */}
        <Arrow d="M 163 336 L 163 382" tone="stop" label="Chưa" lx={190} ly={362} />
        <Box x={38} y={384} w={250} h={88} title="CHƯA XÁC MINH → không tạo được" sub="Publish và Save draft đều tắt" sub2="→ tải ERC ở Company information" tone="stop" />

        <Arrow d="M 493 336 L 493 382" tone="brand" label="Chưa có" lx={530} ly={362} />
        <Box x={328} y={384} w={330} h={88} title="CHƯA CÓ HÓA ĐƠN → CHỈ SAVE DRAFT" sub="không có tier để chọn · không có Free như Admin" sub2="Publish tắt + link mua gói · draft không tiêu gì" tone="pool" />
        <rect x={568} y={376} width={82} height={18} rx={9} fill={AMB} />
        <text x={609} y={389} fontSize={9.5} fontWeight={800} textAnchor="middle" fill="#ffffff">CASE MỚI</text>

        <Arrow d="M 823 336 L 823 382" tone="brand" label="hết slot" lx={855} ly={362} />
        <Box x={698} y={384} w={250} h={88} title="HẾT SLOT → CHỈ SAVE DRAFT" sub="Publish tắt + deep link mua gói" sub2="draft vẫn lưu, không tiêu gì" tone="pool" />

        <text x={988} y={408} fontSize={10.5} fontWeight={700} fill={AMB}>Hai ô vàng là MỘT trạng thái form — “chưa có gì để đăng”:</text>
        <text x={988} y={424} fontSize={10.5} fill={MUT}>draft giữ nguyên; khi hóa đơn được xuất hoặc mua thêm gói</text>
        <text x={988} y={440} fontSize={10.5} fill={MUT}>→ mở lại draft → chọn tier → Publish. Không ai duyệt.</text>

        {/* ── the one lifecycle both doors feed ───────────────────────────────── */}
        <line x1={20} y1={498} x2={1400} y2={498} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="5 4" />
        <text x={38} y={520} fontSize={11} fontWeight={800} fill={MUT}>CẢ HAI CỬA ĐỔ VÀO MỘT LIFECYCLE — không có cổng duyệt ở đâu cả · Exposure On/Off là công tắc riêng, chỉ có tác dụng khi Open</text>

        <Box x={38} y={544} w={220} h={64} title="DRAFT" sub="chưa đăng · không tiêu gì" sub2="từ cửa nào cũng nằm đây" />
        <Arrow d="M 258 576 L 396 576" tone="brand" label="Publish → Schedule for later" lx={327} ly={568} />
        <Box x={398} y={544} w={220} h={64} title="SCHEDULE" sub="đợi đến giờ hẹn" sub2="đã trừ slot (cửa 2)" />
        <Arrow d="M 618 576 L 756 576" tone="brand" label="đến giờ hẹn → tự Open" lx={687} ly={568} />
        <Box x={758} y={544} w={220} h={64} title="OPEN" sub="live trên trang jobseeker" sub2="72 h sau: NTD hết sửa tiêu đề" tone="crm" />
        <Arrow d="M 978 576 L 1116 576" label="hết hạn → tự Closed" lx={1047} ly={568} />
        <Box x={1118} y={544} w={220} h={64} title="CLOSED" sub="tự đóng khi hết hạn" sub2="không mở lại — Duplicate → Draft mới" />
        {/* Post now skips Schedule: drawn under the row so it cannot be read as
            passing through it. */}
        <Arrow d="M 148 608 C 148 664, 868 664, 868 608" tone="brand" label="Publish → Post now (→ Open ngay, trừ slot ngay)" lx={508} ly={668} />

        {/* ── the rules that make the picture hold ────────────────────────────── */}
        <rect x={38} y={700} width={1340} height={64} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={58} y={720} fontSize={11.5} fontWeight={800} fill={AMB}>Luật bất biến</text>
        <text x={58} y={738} fontSize={11} fill={MUT}>
          Draft không tiêu gì và không cần PO / hóa đơn / sản phẩm · Slot trừ ĐÚNG lúc Publish (Post now hoặc Schedule) · Không có duyệt trước khi lên tin — cả hai cửa.
        </text>
        <text x={58} y={754} fontSize={11} fill={MUT}>
          Free tier CHỈ Admin — NTD không bao giờ thấy nó · NTD không chọn PO, tier suy ra từ gói đang giữ · HQ được đăng vượt slot (concierge, có audit), NTD thì không.
        </text>
      </svg>
    </div>
  )
}
