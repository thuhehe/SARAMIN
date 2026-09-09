/* ── How a company gets into the CRM, and how a sign-up user follows it ────────
 *
 * Two things this drawing exists to settle.
 *
 * ONE — FREE DATA AND COMPANY LIST ARE ONE TABLE. A company is not "moved between
 * stores"; it is COMPLETED and ASSIGNED.
 *
 *   pool state     name only, no owner                 → Free data
 *   customer state name + MST + contact + sales owner  → Customers
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
    /* Scales to the card (same rule as the verification drawing): a fixed 1420px
       scrolled on every screen and hid the right third. Floor for phones only. */
    <div className="mt-2 overflow-x-auto">
      {/* min-w MATCHES the viewBox width on purpose. It used to be 1080, which is
          BELOW the 1420 the diagram is drawn at — so every screen rendered it at
          0.76x and the 10.5px labels came out at ~8px, unreadable in Vietnamese.
          At 1:1 the type is the size it was authored at and the reader pans. */}
      <p className="mb-1 text-[11px] text-faint">Sơ đồ rộng — kéo ngang để xem hết →</p>
      <svg viewBox="0 0 1420 860" className="h-auto w-full min-w-[860px]" role="img" aria-label="How a company enters the CRM, and how a sign-up user follows it">
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
          Free data = chỉ bắt buộc <tspan fontWeight={700} fill={INK}>tên công ty</tspan> · Customers = thêm <tspan fontWeight={700} fill={INK}>MST + địa chỉ đăng ký MST + người liên hệ + sales owner</tspan>. Admin CHỌN MÀN HÌNH TRƯỚC — màn nào thì bắt buộc đúng field của màn đó, không phải “gõ được gì thì gõ, hệ thống tự xếp”.
        </text>

        {/* ── ROW 1: the three doors ──────────────────────────────────────────── */}
        <text x={38} y={104} fontSize={11} fontWeight={800} fill={MUT}>2 CỬA TẠO CÔNG TY — CẢ HAI ĐỀU LÀ ADMIN (sales không có cửa tạo — xem “Luật bất biến” dưới cùng)</text>

        <Box x={38} y={118} w={380} h={64} title="① Admin tạo ở màn Free data" sub="1 field bắt buộc: TÊN CÔNG TY" sub2="→ nằm ở Free data, chưa có chủ" tone="pool" />
        <Box x={448} y={118} w={652} h={64} title="② Admin tạo ở màn Customers" sub="5 field bắt buộc: tên legal · MST · địa chỉ đăng ký MST · người liên hệ · sales owner" sub2="→ thẳng vào Customers, có chủ ngay" tone="crm" />


        {/* the dedup gate both doors pass */}
        <Arrow d="M 228 182 L 228 226" tone="brand" />
        <Arrow d="M 774 182 L 774 226" tone="brand" />
        <Box x={38} y={228} w={810} h={56} title="Kiểm tra trùng — quét CẢ HAI trạng thái (Free data + Customers)" sub="MST trùng → CHẶN, nêu công ty đang giữ + sales phụ trách · tên/domain trùng ở Free data → mở dòng đó, đừng tạo mới" tone="gate" />

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

        <text x={544} y={452} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={AMB}>Cả hai đường đều bắt buộc: MST hợp lệ + không trùng · địa chỉ ĐK xuất hóa đơn · contact person — và một sales owner</text>
        <text x={544} y={468} fontSize={10.5} textAnchor="middle" fill={MUT}>Xong thì dòng RỜI Free data (không xoá — giữ liên kết tới hồ sơ CRM để truy vết)</text>

        {/* ── ROW 3: the sign-up flow, which WAITS on the above ───────────────── */}
        {/* Divider 490 and heading 508, NOT 500/528: the right-hand outcome boxes
            start at y=518, so a heading baseline at 528 ran the whole sentence
            THROUGH the "Move to existing company" box (282px of overlap). The
            heading has to clear the tallest thing in the row it labels. */}
        <line x1={20} y1={490} x2={1400} y2={490} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="5 4" />
        <text x={38} y={508} fontSize={11} fontWeight={800} fill={MUT}>LUỒNG SIGN-UP (đổi 09/2026) — EMAIL VERIFIED CHỈ LÀ XÁC THỰC EMAIL. ADMIN PLACE (MOVE / CREATE) MỚI MỞ LOGIN · ARCHIVE = KHÔNG CHO VÀO</text>

        <Box x={38} y={546} w={230} h={64} title="Employer tự đăng ký" sub="verify email → CHƯA vào được" sub2="chưa có login, chưa có công ty" tone="pool" />
        <Arrow d="M 268 578 L 306 578" />
        <Box x={308} y={546} w={240} h={64} title="Admin mở Sign-ups" sub="có trùng công ty đã có không?" sub2="(resolve xong mới mở login)" tone="gate" />
        {/* ARCHIVE is the SECOND of the only two actions the screen has, and it does
            not depend on where the company is — spam, a duplicate request and a
            person who named the wrong company are all archived whatever the answer
            below. Drawn hanging off the gate rather than as a fourth branch, or the
            picture would say it is one more outcome of the lookup. */}
        <Arrow d="M 428 610 L 428 640" />
        <Box x={308} y={642} w={240} h={52} title="hoặc ARCHIVE" sub="spam · trùng · sai công ty" tone="plain" />

        {/* three answers */}
        <Arrow d="M 548 560 C 590 560, 600 545, 640 545" tone="brand" label="đã ở Customers" lx={596} ly={534} />
        <Arrow d="M 548 578 L 640 652" tone="brand" label="đang ở Free data" lx={600} ly={614} />
        <Arrow d="M 548 596 L 640 748" tone="brand" label="chưa có ở đâu" lx={588} ly={706} />

        <Box x={642} y={518} w={300} h={54} title="Move to existing company" sub="ghép user vào công ty có sẵn · archive bản trùng" tone="crm" />
        {/* Neither of these is a blocker any more: the sign-up already created the
            company. The pool case is a MERGE in one direction only — pool row INTO
            the new company, because a pool row cannot hold a login — and the "nowhere"
            case simply keeps the new company and verifies it on its record. */}
        <Box x={642} y={620} w={300} h={64} title="GỘP dòng Free data vào công ty vừa tạo" sub="dòng rời Free data · dữ liệu đổ vào" sub2="Xin nhận → ứng viên owner" tone="crm" />
        <Box x={642} y={722} w={300} h={54} title="Công ty mới thật — giữ nguyên" sub="Verify ở Company detail · dòng Sign-ups tự đóng" tone="crm" />
        <text x={1096} y={600} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={GRN}>chiều gộp: pool → công ty mới,</text>
        <text x={1096} y={616} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={GRN}>không bao giờ ngược lại —</text>
        <text x={1096} y={632} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={GRN}>dòng pool không chứa được login</text>

        {/* the resulting move */}
        <Arrow d="M 942 545 L 1090 545" tone="brand" />
        <Box x={1092} y={518} w={286} h={54} title="Không trùng → giữ công ty mới" sub="dòng tự đóng khi admin Verify công ty" tone="crm" />

        {/* ── the one rule that makes the whole thing hold ────────────────────── */}
        <rect x={38} y={792} width={1340} height={48} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={58} y={812} fontSize={11.5} fontWeight={800} fill={AMB}>Luật bất biến</text>
        <text x={58} y={830} fontSize={11} fill={MUT}>
          Công ty phải TỒN TẠI trong Customers trước khi bất kỳ user nào được gán vào · Chỉ ADMIN tạo công ty · Sales chỉ có một đường sở hữu: xin nhận từ Free data, qua 2 cấp duyệt.
        </text>
      </svg>
    </div>
  )
}
