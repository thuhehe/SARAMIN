/* ── How a company gets into the CRM, and how a sign-up user follows it ────────
 *
 * Two things this drawing exists to settle.
 *
 * ONE — FREE DATA AND COMPANY LIST ARE ONE TABLE. A company is not "moved between
 * stores"; it is COMPLETED and ASSIGNED.
 *
 *   pool state     name only, no owner                 → Free data
 *   customer state name + MST + contact + sales owner  → Company list
 *
 * TWO — TWO CREATE DOORS, BOTH ADMIN'S, AND THE OPERATOR PICKS THE DOOR FIRST.
 * Which screen you press "create" on declares what you are making, and the form
 * then enforces exactly that screen's required fields. The rejected alternative was
 * one form whose destination follows completeness — "fill what you have, we'll sort
 * it" — which fails the moment someone means to create a customer and forgets the
 * owner: they get a pool row, silently, and then go hunting for a customer that was
 * never created. A form where every field is optional produces records where every
 * field is empty.
 *
 * SALES NEVER CREATE A COMPANY. Their only route to owning one is xin nhận from
 * Free data, through the two approval levels. No back door, so no company enters
 * the CRM without an admin having looked at it.
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

function Arrow({ d, label, lx, ly, tone = 'plain', dashed }: { d: string; label?: string; lx?: number; ly?: number; tone?: 'plain' | 'brand' | 'stop'; dashed?: boolean }) {
  const c = tone === 'brand' ? BR : tone === 'stop' ? '#e11d48' : 'var(--color-line-soft)'
  const head = tone === 'brand' ? 'b' : tone === 'stop' ? 's' : 'p'
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={1.8} strokeDasharray={dashed ? '4 3' : undefined} markerEnd={`url(#ci-${head})`} />
      {label && <text x={lx} y={ly} fontSize={10} fontWeight={600} textAnchor="middle" fill={tone === 'plain' ? MUT : c}>{label}</text>}
    </g>
  )
}

export function CompanyIntakeFlow() {
  return (
    <div className="mt-2 overflow-x-auto">
      <svg viewBox="0 0 1420 860" className="h-auto w-full min-w-[1080px]" role="img" aria-label="How a company enters the CRM, and how a sign-up user follows it">
        <defs>
          {[['p', 'var(--color-line-soft)'], ['b', BR], ['s', '#e11d48']].map(([k, c]) => (
            <marker key={k} id={`ci-${k}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* ── the premise, stated once at the top ─────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={54} rx={10} fill="var(--color-canvas)" stroke="var(--color-line)" strokeWidth={1.5} />
        <text x={38} y={40} fontSize={13} fontWeight={800} fill={INK}>MỘT bảng công ty, hai trạng thái</text>
        <text x={38} y={58} fontSize={11} fill={MUT}>
          Free data = chỉ bắt buộc <tspan fontWeight={700} fill={INK}>tên công ty</tspan> · Company list = thêm <tspan fontWeight={700} fill={INK}>MST + địa chỉ đăng ký MST + người liên hệ + sales owner</tspan>. Admin CHỌN MÀN HÌNH TRƯỚC — màn nào thì bắt buộc đúng field của màn đó, không phải “gõ được gì thì gõ, hệ thống tự xếp”.
        </text>

        {/* ── ROW 1: the three doors ──────────────────────────────────────────── */}
        <text x={38} y={104} fontSize={11} fontWeight={800} fill={MUT}>2 CỬA TẠO CÔNG TY — CẢ HAI ĐỀU LÀ ADMIN (sales không có cửa tạo — xem “Luật bất biến” dưới cùng)</text>

        <Box x={38} y={118} w={380} h={64} title="① Admin tạo ở màn Free data" sub="1 field bắt buộc: TÊN CÔNG TY" sub2="→ nằm ở Free data, chưa có chủ" tone="pool" />
        <Box x={448} y={118} w={652} h={64} title="② Admin tạo ở màn Company list" sub="5 field bắt buộc: tên legal · MST · địa chỉ đăng ký MST · người liên hệ · sales owner" sub2="→ thẳng vào Company list, có chủ ngay" tone="crm" />


        {/* the dedup gate both doors pass */}
        <Arrow d="M 228 182 L 228 226" tone="brand" />
        <Arrow d="M 774 182 L 774 226" tone="brand" />
        <Box x={38} y={228} w={810} h={56} title="Kiểm tra trùng — quét CẢ HAI trạng thái (Free data + Company list)" sub="MST trùng → CHẶN, nêu công ty đang giữ + sales phụ trách · tên/domain trùng ở Free data → mở dòng đó, đừng tạo mới" tone="gate" />

        {/* ── ROW 2: the two states ───────────────────────────────────────────── */}
        <Arrow d="M 190 284 L 190 336" tone="brand" />
        <Arrow d="M 700 284 C 700 310, 900 300, 900 336" tone="brand" />

        <Box x={38} y={338} w={300} h={92} title="FREE DATA" sub="tên công ty · chưa ai sở hữu" sub2="không đếm vào số nào của CRM" tone="pool" />
        <Box x={750} y={338} w={300} h={92} title="COMPANY LIST" sub="MST · địa chỉ ĐKT · người liên hệ · owner" sub2="khách hàng thật — báo giá, PO, hoá đơn" tone="crm" />

        {/* ── the promotion paths between them ────────────────────────────────── */}
        <text x={370} y={330} fontSize={11} fontWeight={800} fill={MUT}>ĐƯA LÊN COMPANY LIST — 2 ĐƯỜNG</text>

        <Box x={368} y={344} w={352} h={38} title="A · Sales xin nhận → Admin duyệt → Sales lead duyệt" tone="plain" />
        <Box x={368} y={392} w={352} h={38} title="B · Admin phân trực tiếp (không cần duyệt)" tone="plain" />
        <Arrow d="M 338 363 L 366 363" tone="brand" />
        <Arrow d="M 338 411 L 366 411" tone="brand" />
        <Arrow d="M 722 363 C 736 363, 736 380, 748 380" tone="brand" />
        <Arrow d="M 722 411 C 736 411, 736 396, 748 396" tone="brand" />

        <text x={544} y={452} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={AMB}>Cả hai đường đều bắt buộc: MST hợp lệ + không trùng, và một sales owner</text>
        <text x={544} y={468} fontSize={10.5} textAnchor="middle" fill={MUT}>Xong thì dòng RỜI Free data (không xoá — giữ liên kết tới hồ sơ CRM để truy vết)</text>

        {/* ── ROW 3: the sign-up flow, which WAITS on the above ───────────────── */}
        <line x1={20} y1={500} x2={1400} y2={500} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="5 4" />
        <text x={38} y={528} fontSize={11} fontWeight={800} fill={MUT}>LUỒNG SIGN-UP — KHÔNG BAO GIỜ TỰ TẠO CÔNG TY</text>

        <Box x={38} y={546} w={230} h={64} title="Employer tự đăng ký" sub="trên trang Company" sub2="→ vào list Sign-ups" tone="plain" />
        <Arrow d="M 268 578 L 306 578" />
        <Box x={308} y={546} w={240} h={64} title="Admin mở Sign-ups" sub="công ty người này khai" sub2="đang nằm ở đâu?" tone="gate" />

        {/* three answers */}
        <Arrow d="M 548 560 C 590 560, 600 545, 640 545" tone="brand" label="đã ở Company list" lx={596} ly={534} />
        <Arrow d="M 548 578 L 640 646" tone="stop" label="đang ở Free data" lx={600} ly={614} />
        <Arrow d="M 548 596 L 640 748" tone="stop" label="chưa có ở đâu" lx={588} ly={706} />

        <Box x={642} y={518} w={300} h={54} title="Move to existing company" sub="chọn công ty + role → mở khoá login" tone="crm" />
        <Box x={642} y={620} w={300} h={54} title="CHẶN — “Đưa công ty lên Company list →”" sub="mở dòng Free data, làm đường A hoặc B" tone="stop" />
        <Box x={642} y={722} w={300} h={54} title="CHẶN — “Tạo công ty trước →”" sub="tạo qua cửa ② hoặc ③" tone="stop" />

        {/* the blocked paths loop back up into the promotion machinery */}
        <Arrow d="M 942 647 C 1010 647, 1010 500, 900 440" tone="stop" dashed />
        <Arrow d="M 942 749 C 1060 749, 1070 470, 900 436" tone="stop" dashed />
        <text x={1096} y={600} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="#be123c">quay lại 2 đường</text>
        <text x={1096} y={616} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="#be123c">ở trên — rồi mới</text>
        <text x={1096} y={632} fontSize={10.5} fontWeight={700} textAnchor="middle" fill="#be123c">Move được</text>

        {/* the resulting move */}
        <Arrow d="M 942 545 L 1090 545" tone="brand" />
        <Box x={1092} y={518} w={286} h={54} title="User vào công ty" sub="role + seat · email “you’re in”" tone="crm" />

        {/* ── the one rule that makes the whole thing hold ────────────────────── */}
        <rect x={38} y={792} width={1340} height={48} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={58} y={812} fontSize={11.5} fontWeight={800} fill={AMB}>Luật bất biến</text>
        <text x={58} y={830} fontSize={11} fill={MUT}>
          Công ty phải TỒN TẠI trong Company list trước khi bất kỳ user nào được gán vào · Chỉ ADMIN tạo công ty · Sales chỉ có một đường sở hữu: xin nhận từ Free data, qua 2 cấp duyệt.
        </text>
      </svg>
    </div>
  )
}
