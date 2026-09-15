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
 * them — and written as plain sentences, not telegraphese (Thu's review, 15/09):
 * a box that needs decoding is a box the client skips. System words the spec
 * spells in English (Draft, Open, Publish, PO, Free) stay in English.
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
        <text x={38} y={40} fontSize={13} fontWeight={800} fill={INK}>TẠO JOB — hai cửa vào, cùng một tin, cùng một vòng đời</text>
        <text x={38} y={58} fontSize={11} fill={MUT}>
          Admin (HQ) đăng thay công ty bằng <tspan fontWeight={700} fill={INK}>gói Free hoặc theo PO đã mua</tspan> · Nhà tuyển dụng chỉ đăng bằng <tspan fontWeight={700} fill={INK}>gói mình đã mua</tspan> · Bản nháp lúc nào cũng lưu được, kể cả khi chưa có hóa đơn — <tspan fontWeight={700} fill={INK}>điều kiện bắt buộc duy nhất là công ty đã được xác minh</tspan>.
        </text>

        {/* ── DOOR 1 · Admin ───────────────────────────────────────────────────── */}
        <text x={38} y={100} fontSize={11} fontWeight={800} fill={MUT}>CỬA 1 · ADMIN (HQ) — vào Company detail → Jobs → + New job · đăng thay cho bất kỳ công ty nào</text>

        <Box x={38} y={116} w={220} h={68} title="Chọn công ty" sub="tìm và chọn bất kỳ công ty nào" />
        <Arrow d="M 258 150 L 296 150" tone="brand" />
        <Box x={298} y={116} w={330} h={68} title="Chọn nguồn để đăng" sub="① Gói Free (Always available): không cần PO, không giới hạn" sub2="② PO của công ty → chọn sản phẩm đã mua trong PO đó" tone="gate" />
        <Arrow d="M 628 150 L 666 150" tone="brand" />
        <Box x={668} y={116} w={200} h={68} title="Điền form" sub="cùng một form với nhà tuyển dụng" />
        <Arrow d="M 868 150 L 906 150" tone="brand" />
        <Box x={908} y={116} w={290} h={68} title="Save draft hoặc Publish" sub="Post now → tin lên Open ngay · Schedule → hẹn giờ" sub2="HQ vẫn đăng được khi công ty đã hết lượt" />
        <text x={38} y={206} fontSize={10.5} fill={MUT}>
          HQ được đăng vượt số lượt còn lại của công ty (đăng thay khách — có ghi audit). Tin Free: không gắn PO, không trừ quota, không tính vào doanh thu và không nâng cấp lên gói trả phí được.
        </text>

        {/* ── DOOR 2 · Employer ────────────────────────────────────────────────── */}
        <line x1={20} y1={226} x2={1400} y2={226} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="5 4" />
        <text x={38} y={248} fontSize={11} fontWeight={800} fill={MUT}>CỬA 2 · NHÀ TUYỂN DỤNG (Company site) — vào My jobs → Create job · chỉ HR Manager / HR Specialist · công ty là công ty của mình, không phải chọn PO</text>

        {/* row 1 — the gates, left to right */}
        <Box x={38} y={264} w={250} h={72} title="Công ty đã được xác minh chưa?" sub="cổng duy nhất chặn cả việc lưu nháp" tone="gate" />
        <Arrow d="M 288 300 L 326 300" tone="brand" label="Rồi" lx={307} ly={292} />
        <Box x={328} y={264} w={330} h={72} title="Đã có gói đăng tin chưa?" sub="tức là đã có hóa đơn GTGT chính thức → gói đã được cấp" sub2="gói Free không bao giờ xuất hiện ở cửa này" tone="gate" />
        <Arrow d="M 658 300 L 696 300" tone="brand" label="Có" lx={677} ly={292} />
        <Box x={698} y={264} w={250} h={72} title="Chọn gói trong những gói đang có" sub="số lượt còn lại hiện ngay bên cạnh" sub2="không chọn PO — hệ thống tự lấy gói" tone="gate" />
        <Arrow d="M 948 300 L 986 300" tone="brand" label="còn lượt" lx={967} ly={292} />
        <Box x={988} y={264} w={180} h={72} title="Điền form" sub="cùng một form với Admin" />
        <Arrow d="M 1168 300 L 1206 300" tone="brand" />
        <Box x={1208} y={264} w={190} h={72} title="Save draft hoặc Publish" sub="Publish trừ đúng 1 lượt đăng" sub2="Save draft không trừ gì" />

        {/* row 2 — where each "no" lands. The rose box stops everything; the two
            amber boxes are ONE form state ("nothing to publish from") and both
            still save a draft. The second amber box is the case the client review
            surfaced on 15/09/2026, hence the tag. */}
        <Arrow d="M 163 336 L 163 382" tone="stop" label="Chưa" lx={190} ly={362} />
        <Box x={38} y={384} w={250} h={88} title="CHƯA XÁC MINH → chưa tạo được tin" sub="Không hiển thị nút Publish và Save draft" sub2="Tải Giấy ĐKKD (ERC) ở Company information" tone="stop" />

        <Arrow d="M 493 336 L 493 382" tone="brand" label="Chưa có" lx={530} ly={362} />
        <Box x={328} y={384} w={330} h={88} title="CHƯA CÓ HÓA ĐƠN → chỉ lưu nháp được" sub="Chưa có gói nào để chọn, và không có gói Free như Admin" sub2="Publish bị khoá, có link mua gói · lưu nháp không tiêu gì" tone="pool" />
        <rect x={568} y={376} width={82} height={18} rx={9} fill={AMB} />
        <text x={609} y={389} fontSize={9.5} fontWeight={800} textAnchor="middle" fill="#ffffff">CASE MỚI</text>

        <Arrow d="M 823 336 L 823 382" tone="brand" label="hết lượt" lx={855} ly={362} />
        <Box x={698} y={384} w={250} h={88} title="HẾT LƯỢT → chỉ lưu nháp được" sub="Publish bị khoá, có link mua thêm gói" sub2="nháp vẫn được lưu, không tiêu gì" tone="pool" />

        <text x={988} y={408} fontSize={10.5} fontWeight={700} fill={AMB}>Hai ô vàng thực ra là cùng một tình huống: chưa có gói để đăng.</text>
        <text x={988} y={424} fontSize={10.5} fill={MUT}>Bản nháp giữ nguyên; khi có hóa đơn hoặc mua thêm gói,</text>
        <text x={988} y={440} fontSize={10.5} fill={MUT}>mở lại nháp → chọn gói → Publish. Không cần ai duyệt.</text>

        {/* ── the one lifecycle both doors feed ───────────────────────────────── */}
        <line x1={20} y1={498} x2={1400} y2={498} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="5 4" />
        <text x={38} y={520} fontSize={11} fontWeight={800} fill={MUT}>CẢ HAI CỬA ĐỀU ĐI VÀO MỘT VÒNG ĐỜI CHUNG — không có bước duyệt nào · Exposure On/Off là công tắc riêng, chỉ có tác dụng khi tin đang Open</text>

        <Box x={38} y={544} w={220} h={64} title="DRAFT" sub="chưa đăng, không tiêu gì" sub2="nháp từ cửa nào cũng nằm ở đây" />
        <Arrow d="M 258 576 L 396 576" tone="brand" label="Publish → chọn Schedule (hẹn giờ)" lx={327} ly={568} />
        <Box x={398} y={544} w={220} h={64} title="SCHEDULE" sub="đang chờ đến giờ hẹn" sub2="đã trừ lượt đăng (cửa 2)" />
        <Arrow d="M 618 576 L 756 576" tone="brand" label="đến giờ hẹn → tự lên Open" lx={687} ly={568} />
        <Box x={758} y={544} w={220} h={64} title="OPEN" sub="đang hiển thị trên trang jobseeker" sub2="sau 72 giờ NTD hết sửa được tiêu đề" tone="crm" />
        <Arrow d="M 978 576 L 1116 576" label="hết hạn → tự chuyển Closed" lx={1047} ly={568} />
        <Box x={1118} y={544} w={220} h={64} title="CLOSED" sub="tự đóng khi hết hạn" sub2="không mở lại; Duplicate → nháp mới" />
        {/* Post now skips Schedule: drawn under the row so it cannot be read as
            passing through it. */}
        <Arrow d="M 148 608 C 148 664, 868 664, 868 608" tone="brand" label="Publish → chọn Post now: lên Open ngay, trừ lượt ngay" lx={508} ly={668} />

        {/* ── the rules that make the picture hold ────────────────────────────── */}
        <rect x={38} y={700} width={1340} height={64} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={58} y={720} fontSize={11.5} fontWeight={800} fill={AMB}>Những điều luôn đúng</text>
        <text x={58} y={738} fontSize={11} fill={MUT}>
          Bản nháp không tiêu gì và không cần PO / hóa đơn / gói · Lượt đăng (slot) chỉ bị trừ đúng lúc Publish, dù là Post now hay Schedule · Không có bước duyệt trước khi tin lên — ở cả hai cửa.
        </text>
        <text x={58} y={754} fontSize={11} fill={MUT}>
          Gói Free chỉ Admin dùng được — nhà tuyển dụng không bao giờ thấy nó · Nhà tuyển dụng không chọn PO, hệ thống tự lấy gói đang có · HQ được đăng vượt lượt (đăng thay khách, có audit), nhà tuyển dụng thì không.
        </text>
      </svg>
    </div>
  )
}
