/* ── Shared quota — the three steps a developer has to cover, on both sides ─────
 *
 * Two COLUMNS, not two lanes: the sponsor (công ty tài trợ) on the left, the
 * beneficiary (công ty thụ hưởng) on the right, because the whole feature is the
 * asymmetry between them — the same step looks different on each side. Three
 * BANDS top to bottom, in the order the client listed them (25/09/2026):
 *
 *   ① LINK — on the sponsor's Company detail (Overview → Dùng chung quota) the
 *     admin links beneficiaries with the KR-style Company ID list (boxes, red −,
 *     + Thêm ID, SAVE). The beneficiary's record only SAYS whose beneficiary it is.
 *   ② CREATE JOB — the beneficiary picks the sponsor's PO in the picker (its own
 *     group, "Shared by …"), publishes; the slot leaves the SPONSOR's PO, the job
 *     carries the BENEFICIARY's name.
 *   ③ PRODUCTS & BILLING — shown on BOTH records and on BOTH surfaces (admin,
 *     company site): the sponsor reads the matrix with totals and remainder, the
 *     beneficiary reads only what it used.
 *
 * The one rule drawn in red: a beneficiary's screens never show the sponsor's PO —
 * no number, no lines, no totals, no remainder, no invoice.
 */
const INK = 'var(--color-ink)'
const MUT = 'var(--color-muted)'
const BR = 'var(--color-brand)'
const AMB = '#b45309'
const GRN = '#047857'
const RED = '#e11d48'

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

function Arrow({ d, label, lx, ly, tone = 'plain', dashed }: { d: string; label?: string; lx?: number; ly?: number; tone?: 'plain' | 'brand' | 'amber' | 'stop'; dashed?: boolean }) {
  const c = tone === 'brand' ? BR : tone === 'amber' ? AMB : tone === 'stop' ? RED : 'var(--color-line-soft)'
  const head = tone === 'brand' ? 'b' : tone === 'amber' ? 'a' : tone === 'stop' ? 's' : 'p'
  return (
    <g>
      <path d={d} fill="none" stroke={c} strokeWidth={1.8} strokeDasharray={dashed ? '4 3' : undefined} markerEnd={`url(#sq-${head})`} />
      {label && <text x={lx} y={ly} fontSize={11} fontWeight={600} textAnchor="middle" fill={tone === 'plain' ? MUT : c}>{label}</text>}
    </g>
  )
}

/** The KR "ID AMS" control, in miniature — so the drawing shows the UI the client
    asked for by picture, not a word for it. */
function IdList({ x, y }: { x: number; y: number }) {
  const rows = [['CO-S2CERJW', 'Sao Mai · 17 đơn vị'], ['CO-CZ1HY91', 'An Khang · 1 đơn vị'], ['CO-XXXXXXX', '']]
  return (
    <g>
      <text x={x} y={y - 6} fontSize={10} fontWeight={700} fill={MUT}>COMPANY ID</text>
      {rows.map(([id, name], i) => {
        const ry = y + i * 26
        const empty = !name
        return (
          <g key={id}>
            <rect x={x} y={ry} width={228} height={20} rx={4} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} strokeDasharray={empty ? '3 2' : undefined} />
            <text x={x + 8} y={ry + 14} fontSize={10} fontFamily="ui-monospace, monospace" fill={empty ? MUT : INK}>{id}</text>
            {name && <text x={x + 88} y={ry + 14} fontSize={9.5} fill={MUT}>{name}</text>}
            <rect x={x + 232} y={ry} width={22} height={20} rx={4} fill={RED} />
            <text x={x + 243} y={ry + 14.5} fontSize={13} fontWeight={800} textAnchor="middle" fill="#fff">−</text>
          </g>
        )
      })}
      <text x={x} y={y + 92} fontSize={10} fontWeight={600} fill={BR}>+ Thêm ID</text>
      <rect x={x + 200} y={y + 80} width={54} height={18} rx={4} fill={BR} />
      <text x={x + 227} y={y + 93} fontSize={10} fontWeight={800} textAnchor="middle" fill="#fff">SAVE</text>
    </g>
  )
}

/** The matrix, in miniature — columns are products, rows are companies. */
function Matrix({ x, y }: { x: number; y: number }) {
  const cols = ['Top job', 'Basic', 'CV 200']
  const rows: [string, (string | number)[]][] = [['Sao Mai', [3, 2, 12]], ['An Khang', [1, '—', '—']], ['FPT tự dùng', [38, 4, 61]], ['Còn lại / tổng', ['56/100', '14/20', '123/200']]]
  const cw = 56
  return (
    <g fontSize={9.5}>
      <text x={x} y={y - 4} fontSize={10} fontWeight={700} fill={MUT}>CÔNG TY DÙNG CHUNG</text>
      {cols.map((c, i) => <text key={c} x={x + 92 + i * cw + cw / 2} y={y - 4} fontSize={9.5} fontWeight={700} textAnchor="middle" fill={MUT}>{c}</text>)}
      {rows.map(([name, vals], r) => {
        const ry = y + r * 18
        const last = r === rows.length - 1
        return (
          <g key={name}>
            <rect x={x} y={ry} width={92 + cols.length * cw} height={17} fill={last ? 'var(--color-brand-soft)' : r === 2 ? 'var(--color-canvas)' : 'var(--color-surface)'} stroke="var(--color-line)" strokeWidth={0.8} />
            <text x={x + 6} y={ry + 12} fontWeight={last ? 800 : r === 2 ? 600 : 500} fill={last ? BR : INK}>{name}</text>
            {vals.map((v, i) => <text key={i} x={x + 92 + i * cw + cw - 6} y={ry + 12} textAnchor="end" fontWeight={last ? 800 : 500} fill={last ? BR : v === '—' ? MUT : INK}>{v}</text>)}
          </g>
        )
      })}
    </g>
  )
}

/** The beneficiary's tiles, in miniature — counts only. */
function Tiles({ x, y }: { x: number; y: number }) {
  const t: [string, string][] = [['Top job', '3 slots'], ['Basic', '2 slots'], ['CV search', '12 unlocks']]
  return (
    <g>
      <text x={x} y={y - 4} fontSize={10} fontWeight={700} fill={MUT}>TỪ FPT SOFTWARE · ĐÃ DÙNG</text>
      {t.map(([n, v], i) => (
        <g key={n}>
          <rect x={x + i * 88} y={y} width={82} height={40} rx={6} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
          <text x={x + i * 88 + 8} y={y + 14} fontSize={9.5} fill={MUT}>{n}</text>
          <text x={x + i * 88 + 8} y={y + 32} fontSize={15} fontWeight={800} fill={INK}>{v.split(' ')[0]}<tspan fontSize={9} fontWeight={400} fill={MUT}> {v.split(' ')[1]} đã dùng</tspan></text>
        </g>
      ))}
    </g>
  )
}

function Surface({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={label.length * 6.2 + 14} height={16} rx={8} fill="var(--color-canvas)" stroke="var(--color-line)" strokeWidth={1} />
      <text x={x + 7} y={y + 11.5} fontSize={9.5} fontWeight={700} fill={MUT}>{label}</text>
    </g>
  )
}

export function SharedQuotaFlow() {
  const L = 38 // left column x
  const R = 728 // right column x
  const W = 654 // column width
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-line bg-canvas/40 p-3">
      <svg viewBox="0 0 1420 1250" className="h-auto w-full min-w-[860px]" role="img" aria-label="Shared quota — link on the sponsor's record, the beneficiary posts from the sponsor's PO, Products & billing on both records and both surfaces">
        <defs>
          <marker id="sq-p" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-line-soft)" /></marker>
          <marker id="sq-b" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={BR} /></marker>
          <marker id="sq-a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={AMB} /></marker>
          <marker id="sq-s" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={RED} /></marker>
        </defs>

        {/* ── premise ─────────────────────────────────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={58} rx={10} fill="var(--color-brand-soft)" stroke={BR} strokeWidth={1.5} />
        <text x={36} y={39} fontSize={12.5} fontWeight={800} fill={BR}>BA BƯỚC — ① LINK ở Company detail → ② CTY THỤ HƯỞNG chọn PO của cty tài trợ khi tạo job → ③ PRODUCTS & BILLING hiện cho CẢ HAI, trên Admin và Company site</text>
        <text x={36} y={60} fontSize={11} fill={MUT}>
          Cùng một bước, hai bên nhìn thấy hai thứ khác nhau — đó là toàn bộ tính năng. Cty tài trợ (sponsor) đứng tên PO và thấy tất cả; cty thụ hưởng (beneficiary) dùng quota và chỉ thấy số mình đã dùng. Không phải quan hệ mẹ – con.
        </text>

        {/* ── column headers ──────────────────────────────────────────────────── */}
        <rect x={20} y={90} width={690} height={26} rx={8} fill="var(--color-surface)" stroke="var(--color-line)" />
        <text x={365} y={107} fontSize={11.5} fontWeight={800} textAnchor="middle" fill={INK}>CÔNG TY TÀI TRỢ — sponsor · đứng tên PO · FPT Software</text>
        <rect x={710} y={90} width={690} height={26} rx={8} fill="var(--color-surface)" stroke="var(--color-line)" />
        <text x={1055} y={107} fontSize={11.5} fontWeight={800} textAnchor="middle" fill={INK}>CÔNG TY THỤ HƯỞNG — beneficiary · dùng chung quota · Sao Mai</text>

        {/* ── ① LINK ──────────────────────────────────────────────────────────── */}
        <rect x={20} y={128} width={1380} height={262} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={152} fontSize={11} fontWeight={800} fill={MUT}>① LINK — Admin · Company detail → Overview → thẻ “Dùng chung quota”</text>
        <Surface x={560} y={140} label="Admin" />

        {/* sponsor: the ID list IS the UI */}
        <Box x={L} y={166} w={W} h={40} title="UI nhập liệu: danh sách Company ID — như “ID AMS” của KR" sub="ô ID · nút − đỏ · ô trống cho ID kế tiếp · + Thêm ID · một nút SAVE" tone="gate" />
        <IdList x={L + 20} y={232} />
        <text x={L + 300} y={238} fontSize={10.5} fill={MUT}>Gõ ID → 6 check chạy ngay dưới ô (tồn tại · Active ·</text>
        <text x={L + 300} y={253} fontSize={10.5} fill={MUT}>không phải sponsor của ai · không phải chính mình · chưa link ·</text>
        <text x={L + 300} y={268} fontSize={10.5} fill={MUT}>không gõ trùng) → ✓ hiện tên công ty. − đánh dấu gỡ, ↺ bỏ đánh dấu.</text>
        <text x={L + 300} y={290} fontSize={10.5} fontWeight={700} fill={INK}>SAVE = một lần ghi: link mới + gỡ cũ → audit log + activity CẢ HAI bên.</text>
        <text x={L + 300} y={306} fontSize={10.5} fill={MUT}>Link bao nhiêu công ty cũng được. Một công ty cũng có thể</text>
        <text x={L + 300} y={321} fontSize={10.5} fill={MUT}>là thụ hưởng của nhiều sponsor — mỗi link một dòng.</text>
        <text x={L + 300} y={343} fontSize={10.5} fill={MUT}>Quyền: HQ admin · sales owner của sponsor (company:share_quota).</text>

        <Arrow d={`M ${L + W + 8} 300 L ${R - 8} 300`} tone="brand" label="SAVE → link Active" lx={(L + W + R) / 2} ly={290} />

        {/* beneficiary: information only */}
        <Box x={R} y={166} w={W} h={40} title="Chỉ hiển thị thông tin — không có ô nhập, không có nút" sub="thẻ “Dùng chung quota” trên Overview của cty thụ hưởng" tone="plain" />
        <rect x={R + 20} y={224} width={W - 40} height={78} rx={8} fill="var(--color-canvas)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={R + 34} y={246} fontSize={11.5} fill={INK}>Sao Mai là <tspan fontWeight={800}>công ty thụ hưởng</tspan> của:</text>
        <text x={R + 34} y={268} fontSize={11.5} fontWeight={700} fill={BR}>FPT Software <tspan fontSize={10} fontWeight={400} fill={MUT}>· link 12/08/2026 · Phạm Quang Huy</tspan></text>
        <text x={R + 34} y={288} fontSize={11.5} fontWeight={700} fill={BR}>Tiki <tspan fontSize={10} fontWeight={400} fill={MUT}>· link 05/09/2026 · Phạm Quang Huy</tspan></text>
        <Box x={R + 20} y={316} w={W - 40} h={52} title="Cty thụ hưởng chỉ thấy SỐ INVOICE của cty tài trợ — không gì khác" sub="số invoice hiện vì lúc đăng tin phải chọn nó · không số PO · không dòng · không giá trị · không tổng · không còn lại" tone="stop" />

        {/* ── ② CREATE JOB ────────────────────────────────────────────────────── */}
        <rect x={20} y={406} width={1380} height={250} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={430} fontSize={11} fontWeight={800} fill={MUT}>② ĐĂNG TIN — Company site của cty thụ hưởng (hoặc Admin đăng hộ) → Create job</text>
        <Surface x={560} y={418} label="Company site" />
        <Surface x={655} y={418} label="Admin" />

        {/* beneficiary acts — read the right column first here */}
        <Box x={R} y={446} w={306} h={78} title="Chọn Purchase order (PO)" sub="nhóm “PO của công ty bạn” (nếu có)" sub2="nhóm “Shared by FPT Software” — từng dòng là SỐ INVOICE (INV-…)" tone="gate" />
        <Arrow d={`M ${R + 306} 485 L ${R + 340} 485`} tone="brand" />
        <Box x={R + 342} y={446} w={312} h={78} title="Chọn sản phẩm trên PO đó → Publish" sub="danh sách sản phẩm = các dòng của PO đã chọn" sub2="add-on cũng lấy từ PO đó" tone="plain" />
        <Box x={R} y={540} w={W} h={56} title="Job đứng tên CÔNG TY THỤ HƯỞNG trên jobseeker site" sub="tên, logo, company page của Sao Mai — ứng viên không thấy FPT ở đâu cả · job.fundedByCompanyId = FPT" tone="green" />
        <Box x={R} y={606} w={W} h={40} title="PO của sponsor hết slot → vẫn liệt kê, nhưng disabled: “Hết slot — liên hệ FPT Software”" sub="cty thụ hưởng không bao giờ thấy con số, chỉ thấy còn đăng được hay không" tone="amber" />

        {/* sponsor side: what a publish does to its balance */}
        <Arrow d={`M ${R - 8} 485 L ${L + W + 8} 485`} tone="brand" dashed label="Publish → trừ 1 slot" lx={(L + W + R) / 2} ly={475} />
        <Box x={L} y={446} w={W} h={78} title="1 slot rời khỏi PO của CTY TÀI TRỢ" sub="một dòng ledger trên balance của FPT: usedByCompanyId = Sao Mai — không copy quota sang cty thụ hưởng" sub2="trừ atomic (row lock): hai cty thụ hưởng publish cùng lúc trên slot cuối là ca phải test" tone="gate" />
        <Box x={L} y={540} w={W} h={56} title="Chia sẻ chỉ có hiệu lực SAU KHI hoá đơn chính của PO được xuất" sub="PO chưa xuất hoá đơn → cty thụ hưởng chưa thấy gì · hạn dùng (Must be used within) tính từ ngày hoá đơn của sponsor" tone="plain" />
        <Box x={L} y={606} w={W} h={40} title="Doanh thu · hạng · Customer since · customer status → CTY TÀI TRỢ" sub="cty thụ hưởng chưa mua gì thì vẫn New, revenue 0 — job, ứng viên, CV thuộc về cty thụ hưởng" tone="plain" />

        {/* ── ③ PRODUCTS & BILLING ────────────────────────────────────────────── */}
        <rect x={20} y={672} width={1380} height={272} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={696} fontSize={11} fontWeight={800} fill={MUT}>③ PRODUCTS & BILLING — hiện cho CẢ HAI công ty, trên CẢ HAI surface: Admin (Company detail → Products & billing) và Company site (Products & quota)</text>

        {/* sponsor: the matrix */}
        <Box x={L} y={712} w={W} h={40} title="Cty tài trợ thấy TẤT CẢ — ma trận theo từng sản phẩm" sub="hàng = công ty được link · cột = MỖI dòng sản phẩm trên các PO đã xuất hoá đơn (100 Top job · 20 Basic · 200 CV…)" tone="gate" />
        <Matrix x={L + 20} y={778} />
        <text x={L + 300} y={786} fontSize={10.5} fill={MUT}>Footer: sponsor tự dùng · các cty được link đã dùng ·</text>
        <text x={L + 300} y={801} fontSize={10.5} fontWeight={700} fill={INK}>còn lại / tổng theo từng sản phẩm</text>
        <text x={L + 300} y={821} fontSize={10.5} fill={MUT}>+ hoá đơn, PO history, Remove trên từng hàng.</text>
        <text x={L + 300} y={841} fontSize={10.5} fill={MUT}>Usage history của sponsor: mỗi lần cty thụ hưởng đăng tin /</text>
        <text x={L + 300} y={856} fontSize={10.5} fill={MUT}>mở CV là một dòng “bởi Sao Mai”.</text>
        <Surface x={L + 20} y={886} label="Admin · Company detail" />
        <Surface x={L + 170} y={886} label="Company site · Products & quota" />
        <text x={L + 380} y={898} fontSize={10.5} fill={MUT}>← cùng ma trận, cùng footer, không có Remove/Link</text>

        {/* beneficiary: tiles */}
        <Box x={R} y={712} w={W} h={40} title="Cty thụ hưởng chỉ thấy SỐ MÌNH ĐÃ DÙNG — không tổng, không còn lại" sub="một panel cho mỗi sponsor · một ô cho mỗi sản phẩm đã dùng · con số to, đơn vị nhỏ" tone="gate" />
        <Tiles x={R + 20} y={778} />
        <text x={R + 300} y={786} fontSize={10.5} fill={MUT}>Header panel: tên sponsor (mở hồ sơ) · link ngày/bởi ·</text>
        <text x={R + 300} y={801} fontSize={10.5} fill={MUT}>lần dùng gần nhất · tổng đã dùng · Remove link (admin).</text>
        <text x={R + 300} y={821} fontSize={10.5} fontWeight={700} fill="#be123c">Chỉ số invoice · không PO · không tổng · không còn lại.</text>
        <text x={R + 300} y={841} fontSize={10.5} fill={MUT}>Orders & invoices của cty thụ hưởng: chỉ chứng từ của chính nó.</text>
        <text x={R + 300} y={856} fontSize={10.5} fill={MUT}>Usage history: spend của mình, ghi “từ quota của FPT Software”.</text>
        <Surface x={R + 20} y={886} label="Admin · Company detail" />
        <Surface x={R + 170} y={886} label="Company site · Products & quota" />
        <text x={R + 380} y={898} fontSize={10.5} fill={MUT}>← cùng các ô đã dùng, không có Remove</text>
        <text x={R + 20} y={930} fontSize={10.5} fill={MUT}>Stat card “Job quota” của cty thụ hưởng đọc “dùng chung · từ FPT Software · Tiki” thay vì một con số.</text>

        {/* ── ④ SCREENS TO BUILD — the inventory, so nothing is left out ─────── */}
        <rect x={20} y={962} width={1380} height={272} rx={12} fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth={1} />
        <text x={36} y={986} fontSize={11} fontWeight={800} fill={MUT}>④ MÀN HÌNH & PHẦN CẦN LÀM — đủ danh sách này là đủ tính năng</text>
        {[
          ['ADMIN CONSOLE', [
            'Company detail → Overview · thẻ Dùng chung quota — sponsor: danh sách Company ID + SAVE · beneficiary: chỉ tên sponsor',
            'Company detail → Products & billing — sponsor: ma trận + footer + Remove · beneficiary: panel/sponsor, ô đã dùng',
            'Company detail → stat card Job quota — beneficiary: “dùng chung · từ …” thay vì số',
            'Create job (Admin đăng hộ) → Purchase order: nhóm “Shared by …”, PO hết slot disabled',
            'Jobs tab · cột “Trừ từ” = công ty tài trợ (job.fundedByCompanyId)',
            'Usage history của sponsor: dòng “bởi {beneficiary}” · Audit log + activity 2 bên khi link/gỡ',
          ]],
          ['COMPANY SITE', [
            'Create job → Purchase order: nhóm “PO của công ty bạn” + “Shared by …” · note dưới ô · PO hết slot disabled',
            'Product usage (Products & Payment Management) — sponsor: từng dòng có “dùng bởi …” · beneficiary: nhóm theo SỐ INVOICE “Shared by …”, chỉ số đã dùng',
            'Products & quota — sponsor: ma trận · beneficiary: ô đã dùng',
            'Orders & invoices — chỉ chứng từ của chính công ty (beneficiary không thấy hoá đơn sponsor)',
            'Usage history — “từ quota của {sponsor}” / “bởi {beneficiary}”',
            'Thông báo: link tạo/gỡ → admin 2 bên · “hết slot” → contact của sponsor',
          ]],
          ['BACKEND', [
            'company_quota_share (sponsor, beneficiary, status active|removed, linkedAt/By, removedAt/By/Reason) · unique (sponsor, beneficiary) WHERE active',
            'Ledger: cột usedByCompanyId trên mọi spend · job.fundedByCompanyId',
            'POST/DELETE/GET /admin/companies/{id}/quota-shares · GET …/quota-sponsor',
            'GET /company/purchase-orders?usable=true — PO riêng + PO shared (hasQuota: boolean, không số)',
            'POST /company/jobs/{id}/publish {poId} — check link active, trừ atomic trên balance sponsor',
            'JOB archive → gỡ mọi link của công ty bị archive · 6 check khi link (400/404/409)',
          ]],
        ].map(([head, items], col) => {
          const x = 36 + col * 458
          return (
            <g key={head as string}>
              <text x={x} y={1010} fontSize={10.5} fontWeight={800} fill={BR}>{head as string}</text>
              {(items as string[]).map((t, i) => (
                <g key={i}>
                  <rect x={x} y={1020 + i * 34} width={440} height={28} rx={6} fill="var(--color-canvas)" stroke="var(--color-line)" strokeWidth={0.8} />
                  <text x={x + 8} y={1032 + i * 34} fontSize={9.5} fill={INK}>{t.length > 84 ? t.slice(0, 84) : t}</text>
                  {t.length > 84 && <text x={x + 8} y={1043 + i * 34} fontSize={9.5} fill={INK}>{t.slice(84)}</text>}
                </g>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
