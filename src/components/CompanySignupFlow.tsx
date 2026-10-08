/* ── Company-user sign-up — a PERSON placed into a company, nothing more ────────
 *
 * Split out of CompanyIntakeFlow on 08/10/2026 (client page feedback: the two flows
 * read as one and overlapped). The reason they are separate drawings is the point
 * of this one:
 *
 * A SIGN-UP NEVER MOVES A COMPANY. Free data → Customers is the intake drawing's
 * business, and it has exactly two roads (xin nhận, or admin phân trực tiếp). The
 * sign-up row only ever ends with a person inside a company that ALREADY sits in
 * Customers. So the Sign-ups screen has three actions and no fourth "merge the pool
 * row" action:
 *
 *   match on Customers  → Move to existing company
 *   match on Free data  → promote the company to Customers FIRST (intake road B),
 *                         then Move to existing company — two steps, two screens
 *   no match            → Create company & activate (door ② on Customers) with this
 *                         person as its first Admin
 *   spam / wrong        → Archive
 *
 * This is also what the build does: the Move dialog on a Free-data hit says "That
 * company is still in Free data … Promote it to Customers first, then come back".
 *
 * What happens to the COMPANY after the person is inside — Unverified → Waiting to
 * verify → Verified — is CompanyVerificationFlow, the next drawing on this page.
 */
const INK = 'var(--color-ink)'
const MUT = 'var(--color-muted)'
const BR = 'var(--color-brand)'
const AMB = '#b45309'
const GRN = '#047857'

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

function Arrow({ d, label, lx, ly, tone = 'plain', dashed, anchor = 'middle' }: {
  d: string; label?: string; lx?: number; ly?: number; tone?: 'plain' | 'brand' | 'amber' | 'stop'; dashed?: boolean; anchor?: 'start' | 'middle' | 'end'
}) {
  const c = tone === 'brand' ? BR : tone === 'amber' ? AMB : tone === 'stop' ? '#e11d48' : 'var(--color-line-soft)'
  const head = tone === 'brand' ? 'b' : tone === 'amber' ? 'a' : tone === 'stop' ? 's' : 'p'
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={1.8} strokeDasharray={dashed ? '4 3' : undefined} markerEnd={`url(#su-${head})`} />
      {label && (
        /* white halo so a label never sits ON a line it crosses */
        <text x={lx} y={ly} fontSize={10.5} fontWeight={700} textAnchor={anchor} fill={tone === 'plain' ? MUT : c}
              stroke="var(--color-surface)" strokeWidth={4} paintOrder="stroke">{label}</text>
      )}
    </g>
  )
}

export function CompanySignupFlow() {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-line bg-canvas/40 p-3">
      <svg viewBox="0 0 1420 600" className="h-auto w-full min-w-[860px]" role="img" aria-label="Company-user sign-up — email verification, the Sign-ups row, and the admin's three actions">
        <defs>
          {[['p', 'var(--color-line-soft)'], ['b', BR], ['a', AMB], ['s', '#e11d48']].map(([k, c]) => (
            <marker key={k} id={`su-${k}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* ── premise ─────────────────────────────────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={58} rx={10} fill="var(--color-brand-soft)" stroke={BR} strokeWidth={1.5} />
        <text x={36} y={39} fontSize={12.5} fontWeight={800} fill={BR}>LUỒNG SIGN-UP — ĐỘC LẬP VỚI FREE DATA / CUSTOMERS: NÓ ĐẶT MỘT NGƯỜI VÀO MỘT CÔNG TY, KHÔNG CHUYỂN CÔNG TY</text>
        <text x={36} y={60} fontSize={11} fill={MUT}>
          Email verified chỉ xác thực địa chỉ email — chưa có login, chưa có công ty. Login chỉ mở khi admin xử lý dòng Sign-ups bằng Move hoặc Create. Archive = không cho vào.
        </text>

        {/* ── the employer's two steps, then the row ───────────────────────────── */}
        <text x={38} y={104} fontSize={11} fontWeight={800} fill={MUT}>COMPANY SITE — employer</text>
        <text x={478} y={104} fontSize={11} fontWeight={800} fill={MUT}>ADMIN — Sign-ups</text>
        <text x={840} y={104} fontSize={11} fontWeight={800} fill={MUT}>3 HÀNH ĐỘNG (Free data = 2 bước)</text>
        <text x={1170} y={104} fontSize={11} fontWeight={800} fill={MUT}>KẾT QUẢ</text>

        <Box x={38} y={118} w={200} h={74} title="① Đăng ký" sub="họ tên · email · SĐT · mật khẩu" sub2="MST · tên công ty · ERC (tuỳ chọn)" tone="plain" />
        <Arrow d="M 238 155 L 266 155" tone="brand" />
        <Box x={268} y={118} w={180} h={74} title="② Bấm link email" sub="chỉ xác thực email" sub2="chưa login · chưa công ty" tone="plain" />
        <Arrow d="M 448 155 L 476 155" tone="brand" />
        <Box x={478} y={118} w={222} h={74} title="③ 1 dòng trên Sign-ups" sub="Match: công ty đã có chưa?" sub2="Customers · Free data · không có" tone="gate" />
        <text x={343} y={232} fontSize={10.5} textAnchor="middle" fill={MUT}>③ Match chỉ là gợi ý (tên · đuôi email · MST)</text>
        <text x={343} y={248} fontSize={10.5} textAnchor="middle" fill={MUT}>— admin mở công ty ra kiểm, rồi tự chọn hành động</text>

        {/* ── four branches out of the row ─────────────────────────────────────── */}
        <Arrow d="M 700 138 L 838 138" tone="brand" label="khớp Customers" lx={770} ly={130} />
        <Arrow d="M 700 162 C 760 162, 770 266, 838 266" tone="amber" label="khớp Free data" lx={776} ly={238} />
        <Arrow d="M 700 180 C 770 180, 770 392, 838 392" tone="brand" label="không khớp — công ty mới" lx={770} ly={330} />
        <Arrow d="M 560 192 C 560 470, 700 494, 838 494" tone="stop" label="spam · sai · trùng yêu cầu" lx={640} ly={440} />

        {/* Move — the one action that places into an EXISTING Customers company */}
        <Box x={840} y={112} w={290} h={74} title="Move to existing company" sub="chọn công ty đích (ở Customers) + role" sub2="không tạo công ty nào" tone="crm" />

        {/* Free data — two steps on two screens; step 2 IS the Move above */}
        <Box x={840} y={226} w={290} h={80} title="Bước 1 · Đưa công ty lên Customers" sub="ở Free data: Admin phân trực tiếp (đường B)" sub2="điền MST · địa chỉ ĐK · liên hệ · sales owner" tone="pool" />
        <Arrow d="M 960 226 L 960 190" tone="amber" label="Bước 2 · quay lại Sign-ups → Move" lx={972} ly={212} anchor="start" />

        {/* Create — door ② on Customers, with this person as its first Admin */}
        <Box x={840} y={352} w={290} h={80} title="Create company & activate" sub="tạo công ty mới ở Customers (như cửa ②)" sub2="user = Admin đầu tiên · công ty Unverified" tone="crm" />

        <Box x={840} y={466} w={290} h={56} title="Archive" sub="không tạo login, không tạo công ty" tone="stop" />

        {/* ── outcomes ─────────────────────────────────────────────────────────── */}
        <Arrow d="M 1130 140 C 1276 140, 1276 200, 1276 260" tone="brand" />
        <Arrow d="M 1130 392 C 1150 392, 1150 330, 1168 330" tone="brand" />
        <Box x={1170} y={262} w={212} h={100} title="Login MỞ" sub="email kích hoạt → đăng nhập được" sub2="→ công ty đi tiếp luồng Verify" tone="crm" />
        <Arrow d="M 1130 494 L 1168 494" tone="stop" />
        <Box x={1170} y={466} w={212} h={56} title="Không vào được" sub="dòng Archived · giữ lịch sử" tone="stop" />

        {/* ── the rule ─────────────────────────────────────────────────────────── */}
        <rect x={20} y={540} width={1380} height={50} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={38} y={560} fontSize={11} fill={INK}>
          <tspan fontWeight={800} fill={AMB}>Luật · </tspan>Đúng 3 hành động: <tspan fontWeight={700}>Move to existing company · Create company & activate · Archive</tspan>. Không có hành động “gộp Free data” — công ty ở Free data phải lên Customers trước, rồi mới Move.
        </text>
        <text x={38} y={578} fontSize={11} fill={INK}>
          Move và Create gửi email kích hoạt — lúc duy nhất user đăng nhập được. Mỗi dòng phải được xử lý (SLA 1 ngày làm việc): dòng còn mở là một khách đang đứng ngoài cửa.
        </text>
      </svg>
    </div>
  )
}
