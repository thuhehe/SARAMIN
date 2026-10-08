/* ── Company verification status — three labels, one flag, and who moves each ────
 *
 * Redrawn 08/10/2026 as a STATUS flow (client page feedback). The old drawing had
 * two swim-lanes that walked the whole sign-up → placement → verification journey,
 * which put the sign-up on this page twice (it also lived inside the intake
 * drawing) and buried the three statuses. Sign-up now has its own drawing,
 * CompanySignupFlow; this one starts once a person is inside a company and answers
 * one question: what state is the company in, and what moves it on?
 *
 * THREE LABELS, ONE STORED FLAG. The record stores verified | unverified only. The
 * two unverified labels are told apart on read by whether an ERC is on file —
 * exactly the build's derivation (svn-be V482: the verdict plus any non-rejected
 * company_document; admin i18n `verification.UNVERIFIED / WAITING_TO_VERIFY /
 * VERIFIED`). So no arrow here is "set the status": every move is an upload, a
 * Verify press, or an admin edit, and the label follows.
 *
 * WHOSE MOVE. Unverified waits on the EMPLOYER (upload the certificate). Waiting to
 * verify waits on the ADMIN (read it, press Verify). Verified waits on nobody — until
 * an admin edits identity data, which drops it back to Waiting to verify.
 */
const INK = 'var(--color-ink)'
const MUT = 'var(--color-muted)'
const BR = 'var(--color-brand)'
const AMB = '#b45309'
const BLUE = '#1d4ed8'
const SLATE = '#475569'
const GRN = '#047857'
const RED = '#be123c'

/** a status: the tag exactly as both sites render it, then who owes the next move */
function State({ x, y, w, h, title, tone, line1, line2, owner }: {
  x: number; y: number; w: number; h: number; title: string; tone: 'slate' | 'amber' | 'blue'; line1: string; line2: string; owner: string
}) {
  const c = tone === 'slate' ? SLATE : tone === 'amber' ? AMB : BLUE
  const bg = tone === 'slate' ? '#f1f5f9' : tone === 'amber' ? '#fffbeb' : '#eff6ff'
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={bg} stroke={c} strokeWidth={2} />
      <rect x={x + w / 2 - 78} y={y + 14} width={156} height={26} rx={13} fill="var(--color-surface)" stroke={c} strokeWidth={1.4} />
      <text x={x + w / 2} y={y + 32} fontSize={13} fontWeight={800} textAnchor="middle" fill={c}>{title}</text>
      <text x={x + w / 2} y={y + 62} fontSize={11} textAnchor="middle" fill={INK}>{line1}</text>
      <text x={x + w / 2} y={y + 80} fontSize={11} textAnchor="middle" fill={MUT}>{line2}</text>
      <text x={x + w / 2} y={y + h - 14} fontSize={10.5} fontWeight={700} textAnchor="middle" fill={c}>{owner}</text>
    </g>
  )
}

function Arrow({ d, tone, dashed }: { d: string; tone: 'amber' | 'blue' | 'brand' | 'plain'; dashed?: boolean }) {
  const c = tone === 'amber' ? AMB : tone === 'blue' ? BLUE : tone === 'brand' ? BR : 'var(--color-line-soft)'
  const head = tone === 'amber' ? 'a' : tone === 'blue' ? 'u' : tone === 'brand' ? 'b' : 'p'
  return <path d={d} fill="none" stroke={c} strokeWidth={2} strokeDasharray={dashed ? '5 4' : undefined} markerEnd={`url(#cv-${head})`} />
}

/** an arrow's caption: bold first line, plain second, haloed so lines never cut it */
function Label({ x, y, title, sub, tone }: { x: number; y: number; title: string; sub?: string; tone: 'amber' | 'blue' | 'brand' | 'plain' }) {
  const c = tone === 'amber' ? AMB : tone === 'blue' ? BLUE : tone === 'brand' ? BR : MUT
  return (
    <g>
      <text x={x} y={y} fontSize={11} fontWeight={700} textAnchor="middle" fill={c} stroke="var(--color-surface)" strokeWidth={4} paintOrder="stroke">{title}</text>
      {sub && <text x={x} y={y + 15} fontSize={10.5} textAnchor="middle" fill={MUT} stroke="var(--color-surface)" strokeWidth={4} paintOrder="stroke">{sub}</text>}
    </g>
  )
}

/** what a state allows — one row per gate, aligned under its state */
function Gates({ x, w, rows }: { x: number; w: number; rows: [string, boolean | 'admin'][] }) {
  return (
    <g>
      {rows.map(([label, open], i) => {
        const y = 444 + i * 24
        const c = open === true ? GRN : open === 'admin' ? AMB : RED
        const mark = open === true ? '✓' : open === 'admin' ? '●' : '✕'
        return (
          <g key={label}>
            <text x={x + 14} y={y} fontSize={12} fontWeight={800} fill={c}>{mark}</text>
            <text x={x + 34} y={y} fontSize={11} fill={INK}>{label}</text>
          </g>
        )
      })}
      <rect x={x} y={424} width={w} height={rows.length * 24 + 10} rx={8} fill="none" stroke="var(--color-line)" strokeWidth={1} />
    </g>
  )
}

export function CompanyVerificationFlow() {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-line bg-canvas/40 p-3">
      <svg viewBox="0 0 1420 660" className="h-auto w-full min-w-[860px]" role="img" aria-label="Company verification status — Unverified, Waiting to verify, Verified, and what moves a company between them">
        <defs>
          {[['p', 'var(--color-line-soft)'], ['b', BR], ['a', AMB], ['u', BLUE]].map(([k, c]) => (
            <marker key={k} id={`cv-${k}`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* ── premise ─────────────────────────────────────────────────────────── */}
        <rect x={20} y={16} width={1380} height={58} rx={10} fill="var(--color-brand-soft)" stroke={BR} strokeWidth={1.5} />
        <text x={36} y={39} fontSize={12.5} fontWeight={800} fill={BR}>TRẠNG THÁI XÁC MINH CÔNG TY — 3 NHÃN, BẮT ĐẦU SAU KHI USER ĐÃ VÀO (Move / Create ở Sign-ups)</text>
        <text x={36} y={60} fontSize={11} fill={MUT}>
          Dữ liệu chỉ lưu MỘT cờ verified / unverified; hai nhãn chưa xác minh tách nhau bằng việc đã có ERC trên hồ sơ hay chưa. Không ai “chọn” trạng thái — upload, nút Verify và việc admin sửa hồ sơ làm nhãn đổi theo.
        </text>

        {/* ── entry ────────────────────────────────────────────────────────────── */}
        <text x={38} y={112} fontSize={11} fontWeight={800} fill={MUT}>CÔNG TY MỚI (Create ở Sign-ups,</text>
        <text x={38} y={127} fontSize={11} fontWeight={800} fill={MUT}>hoặc admin tạo ở Customers)</text>
        <Arrow d="M 110 136 L 110 160" tone="plain" />
        {/* an ERC attached at sign-up is filed on the company when it is created,
            so that company never sits in Unverified at all */}
        <Arrow d="M 180 120 C 430 108, 560 108, 640 158" tone="plain" dashed />
        <Label x={392} y={104} title="đã nộp ERC lúc sign-up → vào thẳng Waiting to verify" tone="plain" />

        {/* ── the three states ─────────────────────────────────────────────────── */}
        <State x={38} y={162} w={300} h={130} title="Unverified" tone="slate" line1="Chưa xác minh — chưa có ERC trên hồ sơ" line2="Company site: banner yêu cầu tải ERC" owner="Chờ EMPLOYER — tải lên ERC" />
        <State x={560} y={162} w={300} h={130} title="Waiting to verify" tone="amber" line1="Đã có ≥ 1 ERC, admin chưa xét" line2="Customers: chip “Chờ verify · n” đếm đúng nhóm này" owner="Chờ ADMIN — đối chiếu và bấm Verify" />
        <State x={1082} y={162} w={300} h={130} title="Verified" tone="blue" line1="Admin đã đối chiếu ERC với hồ sơ" line2="tag xanh trên cả hai site" owner="Không chờ ai" />

        {/* Unverified → Waiting: an upload, by either side; nobody presses anything */}
        <Arrow d="M 338 214 L 558 214" tone="amber" />
        <Label x={448} y={186} title="Upload ERC" sub="employer · hoặc admin upload hộ" tone="amber" />

        {/* Waiting → Verified: the admin's one action */}
        <Arrow d="M 860 214 L 1080 214" tone="blue" />
        <Label x={970} y={186} title="Verify company" sub="Company detail · quyền company:verify" tone="blue" />

        {/* Verified → Waiting: an admin edit of identity data, on Save */}
        <Arrow d="M 1232 292 C 1232 340, 740 340, 720 294" tone="amber" dashed />
        <Label x={976} y={360} title="Admin sửa định danh + Save → Waiting to verify · cần xác minh lại" sub="tên legal · MST · địa chỉ ĐK · loại hình — cùng nút Verify để xoá" tone="amber" />

        {/* On Unverified the Verify button does not proceed: nothing to rule on */}
        <Label x={188} y={318} title="Bấm Verify ở đây → “chưa có hồ sơ để xét”," tone="plain" />
        <Label x={188} y={333} title="dialog trỏ sang Company documents" tone="plain" />

        {/* ── what each state allows ────────────────────────────────────────────── */}
        <text x={38} y={412} fontSize={11} fontWeight={800} fill={MUT}>MỖI TRẠNG THÁI CHO LÀM GÌ</text>
        <Gates x={38} w={300} rows={[
          ['Đăng nhập · đọc · upload ERC', true],
          ['Sửa Company information', true],
          ['Đăng tin — kể cả bản nháp', false],
          ['Sales: Yêu cầu xuất hóa đơn chính', false],
        ]} />
        <Gates x={560} w={300} rows={[
          ['Đăng nhập · đọc · upload thêm ERC', true],
          ['Sửa Company information', true],
          ['Đăng tin — kể cả bản nháp', false],
          ['Sales: Yêu cầu xuất hóa đơn chính', false],
          ['Admin: nút Verify company bấm được', 'admin'],
        ]} />
        <Gates x={1082} w={300} rows={[
          ['Đăng nhập · đọc · upload thêm ERC', true],
          ['Company info: CHỈ ĐỌC (sửa qua Saramin)', false],
          ['Đăng tin (bản nháp không cần hoá đơn)', true],
          ['Sales: Yêu cầu xuất hóa đơn chính', true],
        ]} />

        {/* ── the invariant ────────────────────────────────────────────────────── */}
        <rect x={20} y={572} width={1380} height={76} rx={10} fill="#fffbeb" stroke={AMB} strokeWidth={1.5} />
        <text x={40} y={594} fontSize={11.5} fontWeight={800} fill={AMB}>Luật bất biến</text>
        <text x={40} y={613} fontSize={11} fill={INK}>
          <tspan fontWeight={700}>Verified là cổng cho đúng hai việc</tspan>: employer đăng tin (kể cả nháp) · Sales yêu cầu xuất hóa đơn chính. Không gate đăng nhập, không gate đọc / sửa / upload.
        </text>
        <text x={40} y={631} fontSize={11} fill={INK}>
          <tspan fontWeight={700}>Không có “Rejected”</tspan>: không xác minh được thì công ty giữ nguyên nhãn, lý do ghi ở activity log; dừng hẳn thì Archive công ty. Cùng 3 nhãn hiện ở Customers (cột · filter · chip), Company detail và Company site.
        </text>
      </svg>
    </div>
  )
}
