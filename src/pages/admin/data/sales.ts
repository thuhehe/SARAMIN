/*
 * Sales documents and the rules that move them: quotation, purchase order, VAT
 * invoice, payment status, and the discount modes a quotation may use.
 */
import type { Account } from '@/pages/admin/data/companies'
import { SALES_MANAGER, SALES_TEAMS } from '@/pages/admin/data/salesOrg'
import type { SalesRole } from '@/pages/admin/data/salesOrg'
import { MOCK_TODAY, asDate, dmy, endOfMonth } from '@/pages/admin/lib/fmt'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Sales / CRM ──────────────────────────────────────────────────────────────
   LEGACY board. This is an older mockup of the same Sales pipeline that the
   Companies board (CompaniesBoard, sourced from COMPANIES) now covers, with its
   own stage vocabulary (Lead / Won) and its own demo rows. It shares the ONE
   idle RULE via idleOf() above, but it still carries its own `idle` numbers — so
   a company appearing in both shows two different day counts. Idle is a property
   of the COMPANY; this duplicate field should go when the board is retired in
   favour of the company-sourced one. */
export type Deal = { company: string; stage: string; tone: StatusTone; value: number; owner: string; idle: number; next: string }
export const DEALS: Deal[] = [
  { company: 'Cty Việt Tiến Logistics', stage: 'Negotiation', tone: 'pending', value: 369_900_000, owner: 'Trần Quốc Trung', idle: 21, next: 'Chase signed contract' },
  { company: 'Cty Tinh Hoa Công Nghệ', stage: 'Negotiation', tone: 'pending', value: 111_700_000, owner: 'Nguyễn Thị Lan', idle: 18, next: 'Negotiate discount' },
  { company: 'Cty Vạn Phát', stage: 'Negotiation', tone: 'pending', value: 133_500_000, owner: 'Nguyễn Thị Lan', idle: 12, next: 'Send revised quote' },
  { company: 'Cty Hoàng Gia', stage: 'Proposal', tone: 'neutral', value: 171_100_000, owner: 'Nguyễn Thị Lan', idle: 9, next: 'Follow up on proposal' },
  { company: 'Cty Hồng Đức', stage: 'Qualified', tone: 'neutral', value: 128_000_000, owner: 'Phạm Quang Huy', idle: 6, next: 'Schedule product demo' },
  { company: 'Cty Sao Mai', stage: 'Proposal', tone: 'neutral', value: 98_400_000, owner: 'Phạm Quang Huy', idle: 3, next: 'Prepare proposal' },
  { company: 'Cty Thiên Long', stage: 'Lead', tone: 'draft', value: 476_900_000, owner: 'Trần Quốc Trung', idle: 2, next: 'Qualify budget & need' },
  { company: 'Cty Trường Sơn', stage: 'Won', tone: 'active', value: 231_300_000, owner: 'Phạm Quang Huy', idle: 1, next: 'Activate account' },
  { company: 'Cty Á Châu', stage: 'Lost', tone: 'rejected', value: 115_500_000, owner: 'Nguyễn Thị Lan', idle: 30, next: 'Re-engage next quarter' },
]
export const STAGES: { key: string; tone: StatusTone }[] = [
  { key: 'Lead', tone: 'draft' }, { key: 'Qualified', tone: 'neutral' }, { key: 'Proposal', tone: 'neutral' },
  { key: 'Negotiation', tone: 'pending' }, { key: 'Won', tone: 'active' }, { key: 'Lost', tone: 'rejected' },
]
export const isOpen = (s: string) => s !== 'Won' && s !== 'Lost'
/* ── Lead detail (Salesforce-style) ───────────────────────────────────────── */
export const PATH = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won']
export const NEXT_BY_STAGE: Record<string, string> = {
  Lead: 'Qualify budget, authority & timeline. Confirm the decision-maker.',
  Qualified: 'Book a product demo and send an intro deck within 2 days.',
  Proposal: 'Follow up on the proposal; confirm which products they need.',
  Negotiation: 'Send the revised quote and agree terms — aim to close this week.',
  Won: 'Activate the customer: create the account & provision products.',
  Lost: 'Log the loss reason and set a reminder to re-engage next quarter.',
}


/* ── New quotation (Báo giá) ───────────────────────────────────────────────────
   Modelled on the client's live PDF QUO-009909-07-2026. The load-bearing idea is
   that one quotation carries 1–3 priced OPTIONS which are ALTERNATIVES, not
   add-ons: each totals independently, exactly one gets accepted, and the document
   has no grand total. Everything derived (line totals, VAT, total-after-VAT,
   amount-in-words, benefit lists) is computed here and never typed. */
export const QUOTE_CATALOG = [
  { vi: 'Dịch vụ tin đăng (Basic Job)', short: 'Basic Job', unitVi: 'tin', unitEn: 'post', price: 2_710_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag', 'Làm mới bài đăng mỗi 15 ngày'] },
  { vi: 'Dịch vụ tin đăng (Basic Plus Job)', short: 'Basic Plus Job', unitVi: 'tin', unitEn: 'post', price: 6_100_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag', 'Tiêu đề đậm xanh', 'Top Search: ưu tiên trên kết quả tìm kiếm', 'Làm mới bài đăng mỗi 10 ngày', 'Hiển thị tại “Các công ty nổi bật” — Trang chủ'] },
  { vi: 'Dịch vụ tin đăng (Premium Job)', short: 'Premium Job', unitVi: 'tin', unitEn: 'post', price: 9_800_000, feats: ['Đăng tuyển chính thức 30 ngày, gắn tối đa 05 skill tag', 'Tiêu đề đậm xanh + huy hiệu Premium', 'Top Search + Top Category', 'Làm mới bài đăng mỗi 7 ngày'] },
  { vi: 'Dịch vụ tìm kiếm hồ sơ (30 ngày)', short: 'CV Search 30d', unitVi: 'hồ sơ', unitEn: 'CV', price: 5_500_000, feats: ['Mở tối đa 50 hồ sơ trong 30 ngày', 'Lọc theo kỹ năng, kinh nghiệm, mức lương'] },
  { vi: 'Dịch vụ tìm kiếm hồ sơ (90 ngày)', short: 'CV Search 90d', unitVi: 'hồ sơ', unitEn: 'CV', price: 13_900_000, feats: ['Mở tối đa 200 hồ sơ trong 90 ngày', 'Lọc theo kỹ năng, kinh nghiệm, mức lương'] },
  { vi: 'Employer Branding Page', short: 'EB Page', unitVi: 'gói', unitEn: 'package', price: 15_000_000, feats: ['Trang thương hiệu tuyển dụng riêng', 'Banner + video giới thiệu'] },
  /* ── Trial products ─────────────────────────────────────────────────────
     The trial "discount" is not a discount at all — it is a small set of real
     products priced low, carrying `trial`. Modelling it as products rather than
     as a percentage is what makes it auditable: the invoice shows what was
     actually sold at what price, instead of a 95% write-down nobody can explain
     a year later, and revenue reporting sees a cheap SKU rather than a discount.
     They are offered ONLY inside a trial quotation. */
  { vi: 'Tin đăng dùng thử (Basic Job)', short: 'Trial Basic', unitVi: 'tin', unitEn: 'post', price: 500_000, trial: true, feats: ['Đăng tuyển 15 ngày', 'Không có vị trí nổi bật', 'Giới hạn 01 lần trên mỗi MST'] },
  { vi: 'Tìm kiếm hồ sơ dùng thử (7 ngày)', short: 'Trial CV 7d', unitVi: 'hồ sơ', unitEn: 'CV', price: 300_000, trial: true, feats: ['Mở tối đa 05 hồ sơ trong 07 ngày', 'Giới hạn 01 lần trên mỗi MST'] },
]
/** Trial SKUs never appear in a normal quotation, and normal SKUs never in a trial. */
export const catForMode = (m: DiscountMode) => QUOTE_CATALOG.map((c, i) => ({ c, i })).filter((x) => !!x.c.trial === (m === 'trial'))
/* ── The four ways a quotation can be discounted ──────────────────────────────
   A rep picks exactly ONE mode. Which modes are offered depends on the customer's
   status, and each mode decides — independently — what happens to the THREE
   discount inputs the client's live system has:

     line %    "Discount" on each product row
     order %   "Addition Discount" on the whole order
     fixed ₫   "Voucher", a flat amount off

   Three inputs and four modes is twelve rules, which is exactly why they are a
   table here rather than conditionals scattered through the form. */
export type DiscountMode = 'newchurn' | 'existing' | 'trial' | 'special'
type FieldRule = 'off' | 'auto' | 'free'   // locked at 0 · written by a rule · the rep's
export const DISCOUNT_MODES: Record<DiscountMode, {
  vi: string; en: string; hint: string
  line: FieldRule; order: FieldRule; fixed: FieldRule
  /** order-% approval bands apply only where this is true */
  approves?: boolean
  audience: Account[]
}> = {
  newchurn: {
    vi: 'Ưu đãi khách mới / quay lại', en: 'New & Churn discount',
    hint: 'Giảm 50% trên tổng đơn, với điều kiện mọi dòng ≤ 5 số lượng. Chỉ áp dụng cho PO đầu tiên kể từ khi khách ở trạng thái hiện tại, và không chạy cùng chương trình khác.',
    line: 'off', order: 'auto', fixed: 'free', audience: ['New', 'Churn'],
  },
  existing: {
    vi: 'Chiết khấu theo số lượng', en: 'Existing discount',
    hint: 'Cộng dồn số lượng theo từng loại sản phẩm rồi lấy bậc tương ứng (2+ → 25% … 100+ → 60%). Có thể cộng thêm chiết khấu trên tổng đơn — mức này phải được duyệt.',
    line: 'auto', order: 'free', fixed: 'free', approves: true, audience: ['New', 'Churn', 'Existing'],
  },
  trial: {
    vi: 'Gói dùng thử', en: 'Trial',
    hint: 'Không phải chiết khấu: đây là các sản phẩm dùng thử có giá riêng, chỉ xuất hiện trong báo giá. Mọi ô chiết khấu đều khoá ở 0.',
    line: 'off', order: 'off', fixed: 'off', audience: ['New', 'Churn'],
  },
  special: {
    vi: 'Ưu đãi đặc biệt', en: 'Special offer',
    hint: 'Sales tự quyết cả ba mức — từng dòng, tổng đơn và số tiền cố định. Không có bước duyệt, nên mọi con số ở đây là trách nhiệm của người lập báo giá.',
    line: 'free', order: 'free', fixed: 'free', audience: ['New', 'Churn', 'Existing'],
  },
}
export const modesFor = (a?: Account) =>
  (Object.keys(DISCOUNT_MODES) as DiscountMode[]).filter((m) => a && DISCOUNT_MODES[m].audience.includes(a))
/** What a customer status starts on. Existing has no welcome offer to default to. */
export const defaultMode = (a?: Account): DiscountMode => (a === 'Existing' ? 'existing' : 'newchurn')

/* Approval bands for the ORDER-level percentage, and only under the Existing
   programme. 10% and below is a sales lead's call; above it is the manager's.
   Constants because they are a sales policy that will be renegotiated, not a fact
   about the software. */
export const SPECIAL_LEADER_MAX = 10
/* The New & Churn offer, in numbers. All-or-nothing on the cap: one line over and
   the whole 50% is lost, not just that line's share. */
export const NEWCHURN_PCT = 50
export const NEWCHURN_MAX_QTY = 5
/** How a discount cell looks: locked at 0, written by a rule, or the rep's own. */
export const fieldCls = (r: FieldRule, filled: boolean) =>
  r === 'free' ? 'border-amber-400 bg-surface font-semibold text-amber-900'
    : r === 'auto' && filled ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800'
      : 'border-line bg-canvas text-faint'

export type QLine = { cat: number; qty: number; price: number; disc: number; gift: boolean }
export type QOption = { id: number; lines: QLine[]; recommended: boolean; optDisc: number; fixed: number }
/* The three discounts stack in ONE order and it is not interchangeable: line %
   first (it changes the subtotal), then the order % on what is left, then the
   fixed amount off that, and VAT only on the remainder. Applying the voucher
   before the percentage would quietly make it worth more, and charging VAT on
   the pre-discount figure would overcharge the customer on a filed invoice. */
export const optionTotals = (o: QOption) => {
  const sub = o.lines.reduce((s, l) => s + lineTotal(l), 0)
  const pctCut = Math.round(sub * o.optDisc / 100)
  const fixedCut = Math.min(Math.max(0, o.fixed), sub - pctCut)   // never below zero
  const net = sub - pctCut - fixedCut
  const vat = Math.round(net * VAT_RATE / 100)
  return { sub, pctCut, fixedCut, net, vat, total: net + vat }
}
export const lineTotal = (l: QLine) => (l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100)))
export const VAT_RATE = 8

/* Companies sharing the first 10 digits of a tax code — the same legal entity's
   branches, or genuinely unrelated companies that happen to collide. The form does
   NOT decide which; it lists them and lets the rep link. */
export const MST_ROOT_MATCHES = [
  { name: 'Công ty CP Trường Sơn', tax: '0328xxxxxx', owner: 'Nguyễn Thị Lan', where: 'Đà Nẵng', status: 'Existing' },
  { name: 'CN Trường Sơn — Hà Nội', tax: '0328xxxxxx-001', owner: 'Phạm Quang Huy', where: 'Long Biên, Hà Nội', status: 'Existing' },
  { name: 'CN Trường Sơn — Cần Thơ', tax: '0328xxxxxx-002', owner: 'Trần Quốc Trung', where: 'Ninh Kiều, Cần Thơ', status: 'New' },
]

/* Quote-to-cash, in the order it actually happens:
   Quotation (1–3 options) → Sales order / PO (confirm = won) → Payment
   (Accounting confirms) → VAT e-invoice (issue = closed + provisioning released). */
/* FOUR statuses only: Draft · Sent · Issued to PO · Expired. Everything that used
   to be its own status is a FLAG on one of these — discount approval is a gate on
   Draft, an accepted option is recorded on a Sent quote until the PO exists, a
   revision is a version (v2) not a status, and a lapsed offer is Sent + expired
   validity. The flags live in the data and surface on the DETAIL page; the list
   stays scannable and shows the status pill alone. */
export type QuoteStatus = 'Draft' | 'Sent' | 'Issued to PO' | 'Expired'
/* Expiry first by default: every quotation dies at month-end, so "what runs out
   soonest" is the only ordering that tells a rep what to chase today. */
export type QuoteSort = 'expires' | 'created' | 'value'
export const QUOTE_SORTS: Record<QuoteSort, { label: string; cmp: (a: Quote, b: Quote) => number }> = {
  expires: { label: 'Sắp hết hạn trước', cmp: (a, b) => dmy(a.expires) - dmy(b.expires) },
  created: { label: 'Mới tạo trước', cmp: (a, b) => dmy(b.created) - dmy(a.created) },
  value: { label: 'Giá trị cao nhất', cmp: (a, b) => b.value - a.value },
}
export type Quote = {
  code: string; customer: string; co?: string; products: number[]; options: number
  value: number; status: QuoteStatus; created: string; expires: string
  acceptedOpt?: number; lapsed?: boolean; note?: string
  /* ── Special discount + its approval ───────────────────────────────────────
     `special` is the one percentage a rep may type (the option-subtotal rate).
     Everything else here is the approval trail, and `apprPct` exists so that
     editing the rate after a decision can VOID it — an approval that does not
     record WHAT was approved cannot be enforced. */
  special?: number
  appr?: 'pending' | 'approved' | 'rejected'
  reqBy?: string; reqAt?: string
  apprBy?: string; apprAt?: string; apprPct?: number; apprReason?: string
}
/* Which ROLE a special discount routes to — by amount, not by chain, so above the
   band the lead is skipped entirely. Reuses the sales org already defined for the
   Companies list rather than inventing a second hierarchy. */
export const apprRole = (pct: number): SalesRole => (pct <= SPECIAL_LEADER_MAX ? 'lead' : 'manager')
/* Seniority, so "can this person sign their own discount?" is one comparison
   rather than a pile of special cases. Anyone whose own role is at or above the
   role a rate routes to approves it by raising it — a lead's ≤10% needs nobody,
   a lead's >10% still goes to the manager, and a manager's rate never routes at
   all. Sending a request to yourself is not a control; it is a click. */
const ROLE_RANK: Record<SalesRole, number> = { rep: 0, lead: 1, manager: 2 }
export const selfApproves = (creator: SalesRole, required: SalesRole) => ROLE_RANK[creator] >= ROLE_RANK[required]
/** The person that role resolves to for a given rep. A lead approves their own
    team's requests; there is one department manager. */
export const apprPerson = (pct: number, rep?: string) =>
  apprRole(pct) === 'manager'
    ? SALES_MANAGER
    : SALES_TEAMS.find((t) => rep && t.members.includes(rep))?.lead ?? SALES_TEAMS[0].lead
export const QUOTE_TONE: Record<QuoteStatus, StatusTone> = { Draft: 'draft', Sent: 'pending', 'Issued to PO': 'active', Expired: 'expired' }
export const QUOTES: Quote[] = [
  /* Three options — Basic Plus (the one we RECOMMEND), Basic as the cheaper
     alternative, Premium as the upsell. The client's own file had two; a third is
     the case the document has to prove it handles, since the rule is 1–3
     ALTERNATIVES that are never summed.
     value = 10,584,000 = the HIGHEST option (Premium), per the documented rule —
     NOT the recommended one. This row is deliberately the worked example of the
     open question in the spec: recommended ≠ highest, and the two give different
     pipeline totals. */
  { code: 'QUO-009909-07-2026', customer: 'AM Software Việt Nam', co: 'Công ty TNHH AM Software Việt Nam', products: [1, 0, 2], options: 3, value: 10_584_000, status: 'Sent', created: '20/07/2026', expires: '31/07/2026' },
  { code: 'QUO-009908-07-2026', customer: 'Công ty Vạn Phát', co: 'Công ty TNHH Vạn Phát', products: [1, 4], options: 3, value: 37_800_000, status: 'Sent', created: '14/07/2026', expires: '31/07/2026', acceptedOpt: 2, note: 'Customer confirmed Option 2 by email.' },
  { code: 'QUO-009907-07-2026', customer: 'Hoàng Gia', products: [2], options: 1, value: 131_429_662, status: 'Issued to PO', created: '30/06/2026', expires: '30/06/2026', acceptedOpt: 1 },
  { code: 'QUO-009906-06-2026', customer: 'Việt Tiến Logistics', co: 'Công ty TNHH Việt Tiến', products: [0, 3], options: 2, value: 28_536_925, status: 'Sent', created: '16/06/2026', expires: '30/06/2026', lapsed: true, note: 'Went quiet after pricing. Extend or re-issue as v2.' },
  { code: 'QUO-009904-05-2026', customer: 'Tinh Hoa (v1)', products: [1], options: 2, value: 58_900_000, status: 'Expired', created: '17/05/2026', expires: '31/05/2026', note: 'Replaced by v2 — QUO-009905-06-2026.' },
  // 8% → routes to the Sales leader, still waiting
  { code: 'QUO-009905-06-2026', customer: 'Tinh Hoa', products: [1, 5], options: 2, value: 60_206_698, status: 'Draft', created: '28/07/2026', expires: '31/07/2026', special: 8, appr: 'pending', reqBy: 'Nguyễn Thị Lan', reqAt: '06/08/2026 09:12', note: 'Khách so sánh với đối thủ, xin thêm 8% trên tổng đơn.' },
  // 18% → skips the leader and goes straight to the Sales manager
  { code: 'QUO-009913-08-2026', customer: 'Công ty CP Bình Minh', co: 'Công ty CP Bình Minh', products: [2], options: 1, value: 148_000_000, status: 'Draft', created: '07/08/2026', expires: '31/08/2026', special: 18, appr: 'pending', reqBy: 'Trần Quốc Trung', reqAt: '07/08/2026 16:40', note: 'Đơn lớn, khách chốt trong tuần nếu có 18%.' },
  // approved, and therefore sendable
  { code: 'QUO-009914-08-2026', customer: 'Công ty TNHH Sao Mai', co: 'Công ty TNHH Sao Mai', products: [1], options: 2, value: 92_400_000, status: 'Sent', created: '05/08/2026', expires: '31/08/2026', special: 10, appr: 'approved', reqBy: 'Trần Quốc Trung', reqAt: '05/08/2026 11:02', apprBy: 'Nguyễn Thị Lan', apprAt: '05/08/2026 14:20', apprPct: 10 },
  // refused, with the reason the rep has to act on
  { code: 'QUO-009915-08-2026', customer: 'Công ty CP Hoàng Gia', co: 'Công ty CP Hoàng Gia', products: [2], options: 1, value: 64_800_000, status: 'Draft', created: '06/08/2026', expires: '31/08/2026', special: 22, appr: 'rejected', reqBy: 'Phạm Quang Huy', reqAt: '06/08/2026 08:30', apprBy: 'Đỗ Xuân Trường', apprAt: '06/08/2026 10:05', apprPct: 22, apprReason: 'Trên 20% thì âm biên. Tối đa 12%, hoặc đổi sang gói Basic Plus.' },
]
/* ── Export quotation to PDF ───────────────────────────────────────────────────
   The document the customer actually receives. Content is a faithful reproduction
   of the client's live PDF (EST-009909-07-2026) — every block, every field, both
   languages, nothing added and nothing dropped. What is REFINED here is only the
   presentation:

     · bilingual pairs are stacked (VN primary, EN muted underneath) instead of
       being run together on one line — the single biggest readability win;
     · the two customer blocks become side-by-side cards instead of wrapped prose;
     · line tables get real columns, tabular figures and right-aligned money;
     · each option is a self-contained card with its own totals box, because the
       options are ALTERNATIVES and the document must never look like it sums;
     · terms become numbered clauses with a VN/EN pair each.

   Everything printed is derived (line totals, VAT, total-after-VAT, amount in
   words, benefit lists) — see the "What prints on the page" spec section. */
export const ISSUER = {
  nameVi: 'CÔNG TY TNHH DAOUKIWOOM INNOVATION',
  nameEn: 'DAOUKIWOOM INNOVATION COMPANY LIMITED',
  addrVi: 'Tầng 12, 13 & 14, Tòa nhà AP, 518B Điện Biên Phủ, Phường Thạnh Mỹ Tây, Thành phố Hồ Chí Minh, Việt Nam',
  addrEn: 'Level 12, 13 & 14, AP Tower, 518B Dien Bien Phu Street, Thanh My Tay Ward, Ho Chi Minh City, Vietnam',
  web: 'https://topdev.vn',
  support: 'customercare@topdev.vn',
  brand: 'TopDev',
}

export const pdfNum = (n: number) => n.toLocaleString('en-US')
/** "20/07/2026" → "Ngày 20 tháng 07 năm 2026 / July 20th, 2026" */
export function signDate(d: string) {
  const [dd, mm, yyyy] = d.split('/')
  const EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const n = Number(dd)
  const ord = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return { vi: `Ngày ${dd} tháng ${mm} năm ${yyyy}`, en: `${EN[Number(mm) - 1]} ${n}${ord}, ${yyyy}` }
}

/* T&C — verbatim from the client's PDF, split into VN/EN pairs so each clause can
   be read in one language without the other interleaved. Six clauses, in order. */
export const QUOTE_TERMS: { vi: string[]; en: string[] }[] = [
  { vi: ['Giá đã bao gồm 8% thuế VAT.'], en: ['Price is inclusive of 8% VAT.'] },
  {
    vi: ['Báo giá bao gồm chính sách chiết khấu, ưu đãi và quà tặng có hiệu lực áp dụng cho khách hàng đến hết ngày hết hạn được đề cập phía trên. Sau thời gian này, các chính sách có thể thay đổi dựa trên các chương trình khách hàng chính thức khác do TopDev áp dụng.'],
    en: ['The quote includes discounts, incentives and gifts valid for customers until the expiration date mentioned above. After this time, policies may change based on other official promotions programs applied by TopDev.'],
  },
  {
    vi: ['Dịch vụ được kích hoạt sau khi khách hàng thanh toán đơn hàng & hóa đơn cho đơn hàng được xuất.'],
    en: ['The service will be activated after the customer completes the payment & the invoice is issued.'],
  },
  {
    vi: [
      'Thời hạn dịch vụ:',
      '– Đối với dịch vụ tin đăng: Dịch vụ đã mua phải được kích hoạt trong vòng 12 tháng kể từ ngày xuất hóa đơn.',
      '– Đối với dịch vụ tìm kiếm hồ sơ: Dịch vụ đã mua phải được kích hoạt trong vòng 12 tháng kể từ ngày xuất hóa đơn.',
      '– Thời gian trên không áp dụng cho các trường hợp tin đăng thuộc chương trình ưu đãi với quy định khác về thời gian sử dụng.',
      '– Sau thời gian tương ứng nêu trên, bất kỳ dịch vụ nào đã mua nhưng chưa được kích hoạt sẽ không còn giá trị sử dụng nếu không có thỏa thuận khác được xác nhận.',
    ],
    en: [
      'Service term:',
      '– Job posting service: The purchased service must be activated within 12 months from the date the invoice is issued.',
      '– Search CV service: The purchased service must be activated within 12 months from the date the invoice is issued.',
      '– The above time does not apply to cases of job posts applied to promotional programs with different regulations on usage time.',
      '– After this period, any service purchased but not activated will no longer be valid unless other agreements have been confirmed.',
    ],
  },
  {
    vi: [
      'Thời hạn sử dụng sau khi kích hoạt dịch vụ (được áp dụng cho cả dịch vụ đặt mua và dịch vụ tặng kèm):',
      '– Dịch vụ đăng tin: 30 ngày đăng tin chính thức.',
      '– Tìm kiếm hồ sơ: 30 ngày hoặc 90 ngày tương ứng với dịch vụ đặt mua.',
      '– Quà tặng kèm: theo ghi chú quà tặng phía trên.',
    ],
    en: [
      'Usage period after activating the service (applicable to both service and bonus service):',
      '– Job Posting service: 30 days for official posting.',
      '– Search CV: 30 days or 90 days corresponding to the ordered service.',
      '– Employer Branding gift: according to note information above.',
    ],
  },
  {
    vi: [`TopDev cam kết chính sách giá & ưu đãi tại thời điểm báo giá là tốt nhất dành cho khách hàng theo chương trình khách hàng thân thiết & chính sách hiện hành (trừ trường hợp thay đổi thuế suất VAT theo quy định Nhà nước). Liên hệ hỗ trợ: ${ISSUER.support}.`],
    en: [`We commit that the price policy & incentives at the time of quotation are the best offer for you according to the loyalty program & current policies (except for changes in VAT rates according to State regulations). Contact support: ${ISSUER.support}.`],
  },
]

type PdfLine = { name: string; unitVi: string; unitEn: string; qty: number; price: number; disc: number; gift: boolean }
type PdfOption = { n: number; title: string; lines: PdfLine[]; sub: number; vat: number; total: number; feats: { name: string; items: string[] }[] }

/** Build the printable options from the quotation — paid line + its gift line, as
    the client's document does. Gift lines print at 0 ₫ but are real entitlements. */
export function pdfOptions(q: Quote): PdfOption[] {
  return Array.from({ length: Math.max(1, q.options) }, (_, i) => {
    const cat = QUOTE_CATALOG[q.products[i % q.products.length]]
    /* LINES DRIVE THE TOTAL, never the reverse. Back-solving quantity from the
       quotation's value made every option's quantity shift whenever the value
       changed — add a pricier third option and Option 1 silently became "2 tin".
       Quantity is a property of the option; the value is derived FROM the options
       (the highest one), not the other way round. */
    const qty = 1
    const lines: PdfLine[] = [
      { name: cat.vi, unitVi: cat.unitVi, unitEn: cat.unitEn, qty, price: cat.price, disc: 0, gift: false },
      { name: `${cat.vi} (Tặng)`, unitVi: cat.unitVi, unitEn: cat.unitEn, qty: 1, price: 0, disc: 0, gift: true },
    ]
    const sub = lines.reduce((s, l) => s + (l.gift ? 0 : Math.round(l.qty * l.price * (1 - l.disc / 100))), 0)
    const vat = Math.round(sub * VAT_RATE / 100)
    return {
      n: i + 1,
      title: lines.map((l) => l.name).join(' + '),
      lines,
      sub,
      vat,
      total: sub + vat,
      feats: [
        { name: cat.vi, items: cat.feats },
        { name: `${cat.vi} (Tặng)`, items: cat.feats },
      ],
    }
  })
}

/* Saramin wordmark, inlined as a path rather than hotlinked from saramin.co.kr:
   a document must render identically offline, in print and a year from now, which
   a remote asset cannot promise. Brand blue #2D65F2, taken from the live site. */
export const SARAMIN_BLUE = '#2D65F2'
export const SARAMIN_MARK_D = 'M29.1,24.5L29.1,24.5c-0.4,0.3-1.5,0.9-3.5,0.9c-2.1,0-3.3-0.9-3.3-2.4c0-1.4,1.3-2.3,3.2-2.3 c1.3,0,2.4,0.2,3.5,0.5h0.1C29.1,21.2,29.1,24.5,29.1,24.5z M19.1,13.4c0,0.6,0.3,1.2,0.7,1.5c0.6,0.4,1.4,0.5,2.4,0.2 c0.9-0.3,2.1-0.6,3.4-0.6c2.4,0,3.4,0.8,3.4,2.8v1h-0.1c-1.3-0.3-2.3-0.5-3.9-0.5c-6.6,0-7.1,4.2-7.1,5.5c0,2.9,1.9,5.9,7.3,5.9 c4.2,0,6.7-1.4,7.4-1.9c0.6-0.4,0.8-0.8,0.8-1.5v-8.4c0-4.5-2.6-6.8-7.7-6.8c-2.1,0-4.1,0.4-5.1,0.8S19.1,12.5,19.1,13.4z M80.9,12.6L80.9,12.6c-1.3-1.4-2.9-2-5.1-2c-2.3,0-4.7,0.7-6.3,1.9c-0.7,0.5-0.9,0.9-0.9,1.6v12.7c0,1.2,1,2.3,2.2,2.3 c1.3,0,2.2-1,2.2-2.3v-11l0.1-0.1c0.3-0.2,1.3-0.8,2.8-0.8c1.9,0,2.9,1.1,2.9,3.2v8.8c0,1.2,1,2.3,2.2,2.3c1.3,0,2.2-1,2.2-2.3V15.8 l0.1-0.1c0.3-0.2,1.3-0.8,2.8-0.8c1.9,0,2.9,1.1,2.9,3.2v8.8c0,1.2,1,2.3,2.2,2.3c1.3,0,2.3-1,2.3-2.3V18c0-5-2.3-7.4-7.2-7.4 C84.5,10.6,82.6,11.3,80.9,12.6L80.9,12.6L80.9,12.6z M60.6,24.5L60.6,24.5c-0.4,0.3-1.5,0.9-3.5,0.9c-2.1,0-3.3-0.9-3.3-2.4 c0-1.4,1.3-2.3,3.2-2.3c1.3,0,2.4,0.2,3.5,0.5h0.1C60.6,21.3,60.6,24.5,60.6,24.5z M50.6,13.4c0,0.6,0.3,1.2,0.7,1.5 c0.6,0.4,1.4,0.5,2.4,0.2c0.9-0.3,2.1-0.6,3.4-0.6c2.4,0,3.4,0.8,3.4,2.8v1h-0.1c-1.3-0.3-2.3-0.5-3.9-0.5c-6.6,0-7.1,4.2-7.1,5.5 c0,2.9,1.9,5.9,7.3,5.9c4.2,0,6.7-1.4,7.4-1.9c0.6-0.4,0.8-0.8,0.8-1.5v-8.4c0-4.5-2.6-6.8-7.7-6.8c-2.1,0-4.2,0.4-5.1,0.8 C51.1,11.8,50.6,12.5,50.6,13.4z M46.3,10.9c-0.7-0.2-1.8-0.3-3-0.3c-3.9,0-6.1,2.1-6.1,5.8V27c0,1.2,1,2.1,2.2,2.1l0,0l0,0l0,0 c1.3,0,2.3-1,2.3-2.2v-9.7c0-1.5,0.6-2.3,1.9-2.3c0.6,0,1.1,0.1,1.6,0.2c0.4,0.1,0.7,0.1,1.1,0.1c1.4,0,2.1-1.2,2.1-2.1 C48.4,12,47.6,11.2,46.3,10.9 M10.7,18.4l-2.8-0.6c-1.5-0.3-2.2-0.8-2.2-1.7c0-0.5,0.3-1.6,2.6-1.6c1,0,2.4,0.3,3.3,0.8 c1.1,0.6,2.3,0.5,2.9-0.3c0.4-0.4,0.6-1,0.5-1.6c0-0.4-0.2-0.9-0.7-1.4c-1.1-0.9-3.5-1.6-5.9-1.6c-4.3,0-7.1,2.3-7.1,5.7 c0,3.3,2.8,4.7,5.1,5.3c0.8,0.2,1.2,0.3,1.7,0.4c0.3,0.1,0.7,0.1,1.2,0.2c1.5,0.3,2.1,0.9,2.1,1.8c0,0.6-0.4,1.7-2.8,1.7 c-1.7,0-3.5-0.5-4.6-1.2C3.7,24.2,3.3,24,2.8,24c-0.6,0-1.2,0.3-1.6,0.8c-0.6,0.8-0.4,2.1,0.4,2.8c0.7,0.6,2.9,2,6.9,2 c4.3,0,7.2-2.4,7.2-6C15.8,20.9,14.1,19.2,10.7,18.4 M99.6,8.5c-1.2,0-2.1,1-2.1,2.2v11.9c0,1.2,1,2.2,2.1,2.2c1.2,0,2.1-1,2.1-2.2 V10.7C101.7,9.5,100.8,8.5,99.6,8.5 M99.6,0c-1.8,0-3.2,1.3-3.2,3.1s1.4,3.2,3.2,3.2c1.7,0,3.2-1.5,3.2-3.2 C102.8,1.4,101.4,0,99.6,0 M113.6,10.6c-4.5,0-6.9,1.6-7.3,1.9c-0.6,0.4-0.8,0.8-0.8,1.6v12.8c0,1.2,1,2.3,2.2,2.3 c1.3,0,2.2-1,2.2-2.3V15.7l0,0c0.7-0.4,2-0.8,3.5-0.8c1.7,0,3.5,0.9,3.5,3.3v8.7c0,1.2,1,2.3,2.2,2.3c1.3,0,2.2-1,2.2-2.3V18 C121.5,13.2,118.8,10.6,113.6,10.6'
/* An invoice only EXISTS once it has been issued — before that there is a PO
   awaiting one, which is the PO list's job. So this list carries no "blocked"
   or "draft" rows: every row here is a real fiscal document with a legal number.
   That is why there are only two statuses. */
/* ── VAT e-invoice ────────────────────────────────────────────────────────────
   ONE number, the provider's own: 1C26TTD-173. The separate internal INV-…
   sequence is gone — it existed to give an invoice a code before the provider
   issued one, and a draft already carries a number in this series, so it bought
   nothing and gave support two numbers to ask about.

   Four statuses, and they mirror the PO exactly, because an invoice IS the second
   half of a PO's life:

     Draft invoice      nháp — a working document. No legal force, nothing filed
                        with the tax authority, and it grants the customer NOTHING.
     Invoice requested  Sales has asked Kế toán to make it official.
     Invoice issued     chính — signed and filed. THIS is what releases the product.
     Expired            the PO lapsed at month end before it was ever made
                        official. See the note on invExpired below.

   ARCHIVED stays as a fifth, and only ever applies to an ISSUED one:
   VN regulation forbids editing a filed invoice, so a wrong one is cancelled and
   re-issued with a biên bản. That is also the route for an invoice issued ahead
   of a payment that never arrived. */
type InvStep = 'draft' | 'requested' | 'issued' | 'archived'
const INV_STAGE: Record<InvStep, { vi: string; en: string; tone: StatusTone; by: string }> = {
  draft: { vi: 'Hóa đơn nháp', en: 'Draft', tone: 'draft', by: 'Sales' },
  requested: { vi: 'Đang yêu cầu xuất hóa đơn chính', en: 'Invoice requested', tone: 'schedule', by: 'Sales' },
  issued: { vi: 'Đã xuất hóa đơn chính', en: 'Invoice issued', tone: 'active', by: 'Kế toán' },
  archived: { vi: 'Lưu trữ — PO đã hết hạn', en: 'Archived', tone: 'expired', by: 'System' },
}
export type Inv = { code: string; step: InvStep; customer: string; co?: string; po: string; payment?: string; total: number; issued: string; activateBy: string; product: number; qty: number; issuer: string }

export const invStage = (i: Inv) => INV_STAGE[i.step]

/* ── Purchase order ───────────────────────────────────────────────────────────
   Page layout follows the client's live system. Numbering is PO-{seq6}-{MM}-
   {YYYY}, issuer block on the left, recipient + dates on the right, line items
   with the package benefits printed inline. */
/* FIVE statuses. The PO and the invoice on it move together — the PO status IS
   the invoice's status, seen from the commercial side:

     Active             the PO exists. No invoice yet.
     Draft invoice      Sales issued a draft (hóa đơn nháp)   → invoice: Draft
     Invoice requested  Sales asked for the official one      → invoice: Invoice requested
     Invoice issued     Kế toán filed it (hóa đơn chính)      → invoice: Invoice issued
     Expired            the month ended first                 → invoice: Archived

   Two things give this its shape rather than a straight line:

   1 · From Active, Sales has a CHOICE. Issue a draft, or skip it and request the
       official invoice directly. The draft is never a precondition.

   2 · Expiry beats everything. A PO lapses at the end of the month it was issued
       in whether it is Active, Draft invoice or Invoice requested — no matter
       what. Only an official invoice takes it out of reach of the clock.

   The line that matters commercially: ONLY the official invoice releases the
   product. A draft grants nothing, however long it has existed.

   There is deliberately NO Cancelled on a PO. A PO that goes nowhere expires. */
type PoStep = 'active' | 'draft-inv' | 'requested' | 'invoiced' | 'expired'
type PoStage = { key: PoStep; vi: string; en: string; by: string }
const PO_FLOW: PoStage[] = [
  { key: 'active', vi: 'Đang hiệu lực', en: 'Active', by: 'Sales' },
  { key: 'draft-inv', vi: 'Đã xuất hóa đơn nháp', en: 'Draft invoice', by: 'Sales' },
  { key: 'requested', vi: 'Đang yêu cầu xuất hóa đơn chính', en: 'Invoice requested', by: 'Sales' },
  { key: 'invoiced', vi: 'Đã xuất hóa đơn chính', en: 'Invoice issued', by: 'Kế toán' },
]
/* An exit, not a step — nobody reaches it by clicking the flow forward. */
const PO_EXITS: Record<string, PoStage> = {
  expired: { key: 'expired', vi: 'Hết hạn', en: 'Expired', by: 'System' },
}
export const poStage = (k: PoStep) => PO_FLOW.find((x) => x.key === k) ?? PO_EXITS[k]
/* The forward action. Active and Draft invoice share one, because issuing a draft
   is optional — a PO can go straight from Active to Invoice requested. */
const PO_ACTIONS: Partial<Record<PoStep, { label: string; en: string; by: string; accounting: boolean }>> = {
  active: { label: 'Yêu cầu xuất hóa đơn chính', en: 'Request official invoice', by: 'Sales', accounting: false },
  'draft-inv': { label: 'Yêu cầu xuất hóa đơn chính', en: 'Request official invoice', by: 'Sales', accounting: false },
  requested: { label: 'Xuất hóa đơn chính', en: 'Issue official invoice', by: 'Kế toán', accounting: true },
}
export const poNext = (step: PoStep) => PO_ACTIONS[step] ?? null
/** Still running out of month. Expiry beats all three of these. */
export const poLive = (step: PoStep) => step === 'active' || step === 'draft-inv' || step === 'requested'
/* ONE button, one action, three statuses. On Active it creates the draft; after
   that the same click opens it. They were never two different things — a rep
   issues a draft precisely in order to look at it. Gone once the official invoice
   exists (that is the document you read then) and gone once expired. */
export const poDraftBtn = (step: PoStep) => poLive(step)

/* ── Payment status — a THIRD axis, independent of both document statuses ──────
   Money is not a stage of a document. A PO can be Active and already paid; an
   invoice can be issued and still unpaid (VN practice routinely invoices ahead of
   the transfer). So payment is tracked on its own and never folded into PoStep or
   InvStep — the moment it becomes a stage, one of the two has to lie.

   Only two of the three values are STORED, and only one of them as a fact:
     Paid     paidAt has a date. The one thing a human records.
     Unpaid   no paidAt yet, and inside the 14-day window.
     Overdue  no paidAt and MORE THAN 14 DAYS since the PO was issued. Derived, so
              it turns over by itself at midnight — nobody has to run anything, and
              there is no stored "overdue" that can go stale.

   Counted from the PO's issue date, not the invoice's: the customer's obligation
   starts when the order is confirmed, and an invoice issued late must not reset
   the clock the customer is already late against. */
export const PAY_TERMS_DAYS = 14
type PayStatus = 'Paid' | 'Unpaid' | 'Overdue'
export const PAY_META: Record<PayStatus, { tone: StatusTone; vi: string }> = {
  Paid: { tone: 'active', vi: 'Đã thanh toán' },
  Unpaid: { tone: 'pending', vi: 'Chưa thanh toán' },
  Overdue: { tone: 'rejected', vi: `Quá hạn — hơn ${PAY_TERMS_DAYS} ngày kể từ ngày xuất PO` },
}
/** Dotted or slashed dd.mm.yyyy → days elapsed against the mock's fixed today. */
export const daysFromDoc = (d: string) => {
  const [dd, mm, yy] = d.replace(/\./g, '/').split('/').map(Number)
  if (!dd || !mm || !yy) return 0
  return Math.round((MOCK_TODAY.getTime() - new Date(yy, mm - 1, dd).getTime()) / 86_400_000)
}
/* An invoice's payment status is its PO's — the same money, read from one place.
   Confirming on the invoice therefore updates the PO by construction rather than by
   a second write that could fail on its own. */
const poOf = (code: string) => POS.find((p) => p.code === code)
export const invPay = (i: Inv): { paidAt?: string; poIssued: string } => {
  const po = poOf(i.po)
  // Older rows carry a payment reference instead of a date; treat it as paid.
  return { paidAt: po?.paidAt ?? (i.payment ? i.issued : undefined), poIssued: po?.issued ?? i.issued }
}

export function payStatus(paidAt: string | undefined, poIssued: string): PayStatus {
  if (paidAt) return 'Paid'
  return daysFromDoc(poIssued) > PAY_TERMS_DAYS ? 'Overdue' : 'Unpaid'
}

/** `invNo` is allocated by the provider the moment the FIRST draft is issued, so
    a PO that never got one has none — that is what tells the two apart. `invIssued`
    is filled only when the official invoice is filed. */
/* THE THREE PAYMENT FIELDS — payTerms · payMethod · paidAt — are INTERNAL
   COMMERCIAL TRACKING, not part of the PO document (decided 2026-08-23).

   They live on the record and on the PO LIST, and they are the only three fields
   Edit PO may touch. The reason is what a PO IS: the document the customer holds
   a copy of. Once issued, its lines, totals and dates must read the same on both
   sides forever — so nothing on the printed document is editable. How and when we
   collect the money is our own operational fact: it changes after issue (an
   unpaid PO becomes paid), it is nobody's copy but ours, and printing it would
   put a mutable field on an immutable document. */
export type Po = { code: string; customer: string; co?: string; poNo?: string; quote: string; total: number; step: PoStep; issued: string; seller: string; product: number; qty: number; invNo?: string; invIssued?: string
  /** Điều khoản thanh toán — agreed at issue. Same three options as the quotation. */
  payTerms?: PayTerms
  /** Phương thức thanh toán — how the money actually comes in. */
  payMethod?: PayMethod
  /** Ngày thu tiền — the date Kế toán confirmed the money arrived. The ONLY stored
      payment FACT; Paid / Unpaid / Overdue are all derived from it. */
  paidAt?: string }

/* Fixed lists rather than free text: both are reported on (“how much of the book
   is 50/50?”, “how many customers still pay cash?”), and a free-text field cannot
   be counted. `Others` is the pressure valve, and it carries its own note. */
export const PAY_TERMS = ['100% in advance', '50 / 50', 'Others'] as const
export const PAY_METHODS = ['Chuyển khoản', 'Tiền mặt', 'Bù trừ công nợ', 'Khác'] as const
export type PayTerms = (typeof PAY_TERMS)[number]
export type PayMethod = (typeof PAY_METHODS)[number]
/* A PO lapses at the end of the month it was issued in — the same end-of-month
   rule as the quotation it came from, so the two documents can never disagree
   about how long the commercial terms stand. Dates on the document are dotted. */
export const poExpiry = (p: Po) => endOfMonth(p.issued.replace(/\./g, '/'))
/* Expiry is a nightly JOB, not a field anyone sets — so the mock must not store
   it either. A PO whose month has ended is Expired no matter what its last
   recorded step was, and the invoice on it is Archived with it. Keeping a stored
   `step` and a computed expiry date side by side and hoping they agree is the
   same bug as keeping the invoice status beside the PO's: the demo drifted into
   showing a "Draft invoice" PO that had lapsed a week earlier.

   Only `invoiced` is immune — an official invoice takes the PO out of reach of
   the clock, which is the whole point of the rule. */
export const poStep = (p: Po): PoStep =>
  p.step !== 'invoiced' && MOCK_TODAY.getTime() > asDate(poExpiry(p)).getTime() ? 'expired' : p.step
export const POS: Po[] = [
  /* Dated against MOCK_TODAY = 08/08/2026, and every status below is DERIVED from
     that date plus the stored step — nothing here asserts "Expired" by hand. The
     August rows are the live ones; the July and June rows are what the nightly
     expiry job has already caught, which is why four of them read Expired no
     matter what step they were left in. */

  // Issued inside the 14-day payment window and not yet paid — the plain Unpaid
  // case. Without a row like this the column only ever shows the two loud states
  // and nobody sees what "on time" looks like.
  { code: 'PO-005865-08-2026', payTerms: '100% in advance', payMethod: 'Chuyển khoản', customer: 'Công ty CP Nam Long', co: 'Công ty CP Nam Long', poNo: 'PO-NL/2026/012', quote: 'QUO-009912-08-2026', total: 18_500_000, step: 'active', issued: '03.08.2026', seller: 'Nguyễn Thị Lan', product: 1, qty: 3 },
  { code: 'PO-005864-08-2026', payTerms: '100% in advance', payMethod: 'Chuyển khoản', customer: 'CÔNG TY TNHH DEKON VIỆT NAM', poNo: 'PO-DK/2026/031', paidAt: '07.08.2026', quote: 'QUO-009911-08-2026', total: 12_960_000, step: 'invoiced', issued: '04.08.2026', seller: 'Nguyễn Hoàng Oanh', product: 2, qty: 1, invNo: '1C26TTD-173', invIssued: '06/08/2026' },
  { code: 'PO-005863-08-2026', payTerms: '50 / 50', payMethod: 'Chuyển khoản', customer: 'Công ty TNHH Vạn Phát', co: 'Công ty TNHH Vạn Phát', poNo: 'PO-VP/2026/044', quote: 'QUO-009908-08-2026', total: 40_824_000, step: 'requested', issued: '05.08.2026', seller: 'Nguyễn Thị Lan', product: 1, qty: 6, invNo: '1C26TTD-175' },
  { code: 'PO-005862-08-2026', payTerms: '100% in advance', payMethod: 'Tiền mặt', customer: 'CÔNG TY TNHH AM SOFTWARE VIỆT NAM', co: 'Công ty TNHH AM Software Việt Nam', quote: 'QUO-009909-08-2026', total: 6_588_000, step: 'draft-inv', issued: '06.08.2026', seller: 'Nguyễn Thị Lan', product: 1, qty: 1, invNo: '1C26TTD-176' },

  /* Left at "Invoice requested" in July and never made official. Expiry beats it:
     the PO reads Expired and its invoice is Archived — the single clearest proof
     that a draft does not stop the clock. */
  { code: 'PO-005861-07-2026', payTerms: '50 / 50', payMethod: 'Chuyển khoản', customer: 'Công ty CP Hoàng Gia', co: 'Công ty CP Hoàng Gia', paidAt: '20.07.2026', quote: 'QUO-009907-07-2026', total: 87_505_977, step: 'requested', issued: '18.07.2026', seller: 'Trần Quốc Trung', product: 2, qty: 8, invNo: '1C26TTD-170' },
  // never got past Active — expired with no invoice at all
  { code: 'PO-005860-07-2026', payTerms: 'Others', payMethod: 'Chuyển khoản', customer: 'Công ty TNHH Sao Mai', co: 'Công ty TNHH Sao Mai', quote: 'QUO-009910-07-2026', total: 126_360_120, step: 'active', issued: '16.07.2026', seller: 'Trần Quốc Trung', product: 1, qty: 19 },
  // a June draft, lapsed on 30/06 — not on a rolling 30 days
  { code: 'PO-005859-06-2026', payTerms: '100% in advance', payMethod: 'Bù trừ công nợ', customer: 'Công ty TNHH Minh Long', quote: 'QUO-009906-06-2026', total: 32_400_000, step: 'draft-inv', issued: '24.06.2026', seller: 'Nguyễn Thị Lan', product: 0, qty: 10, invNo: '1C26TTD-168' },
  { code: 'PO-005858-06-2026', payTerms: '100% in advance', payMethod: 'Chuyển khoản', customer: 'Công ty CP Đông Á', quote: 'QUO-009905-06-2026', total: 21_600_000, step: 'active', issued: '09.06.2026', seller: 'Phạm Quang Huy', product: 0, qty: 7 },
]
export const PO_TONE: Record<PoStep, StatusTone> = { active: 'pending', 'draft-inv': 'draft', requested: 'schedule', invoiced: 'active', expired: 'expired' }

/* ── Where the invoice list comes from ────────────────────────────────────────
   DERIVED from the POs, never hand-written beside them. An invoice is not a
   record with a lifecycle of its own — it is the fiscal half of a PO — so its
   status is a function of the PO's status and nothing else:

     PO draft-inv → Draft · requested → Invoice requested
     PO invoiced  → Invoice issued    · expired   → Archived

   Two hand-maintained arrays drifted the moment they existed: a PO reading
   "Invoice requested" carried an invoice reading "Invoice issued", and one PO
   had two invoices contradicting each other. Deriving makes that unrepresentable.

   A PO appears here only once it has an `invNo`, i.e. once a draft was actually
   issued. An Active PO has no invoice, and a PO that expired while still Active
   never had one either. */
const PO_TO_INV: Partial<Record<PoStep, InvStep>> = {
  'draft-inv': 'draft', requested: 'requested', invoiced: 'issued', expired: 'archived',
}
/** invoice date + the product's activation window (clause 4). */
const activateByOf = (issued: string) => {
  const [dd, mm, yy] = issued.split('/').map(Number)
  return dd && mm && yy ? `${String(dd).padStart(2, '0')}/${String(mm).padStart(2, '0')}/${yy + 1}` : '—'
}
const invOf = (p: Po): Inv => ({
  code: p.invNo!,
  step: PO_TO_INV[poStep(p)]!,
  customer: p.customer,
  co: p.co,
  po: p.code,
  payment: poStep(p) === 'invoiced' ? 'PAY-1042' : undefined,
  total: p.total,
  issued: p.invIssued ?? '—',
  activateBy: p.invIssued ? activateByOf(p.invIssued) : '—',
  product: p.product,
  qty: p.qty,
  issuer: poStep(p) === 'invoiced' ? 'Lê Thị Kế Toán' : p.seller,
})
export const INVOICES: Inv[] = POS.filter((p) => p.invNo && PO_TO_INV[poStep(p)]).map(invOf)

/** The draft VAT invoice a PO would produce. Not stored — a draft only becomes a
    record when the rep actually issues one, and until then this is what it WOULD
    say. Rendered through the real invoice component so the two can never drift. */
export const draftInvOf = (po: Po): Inv => ({
  code: '1C26TTD-—', step: 'draft', customer: po.customer, co: po.co, po: po.code,
  total: po.total, issued: '—', activateBy: '—', product: po.product, qty: po.qty, issuer: po.seller,
})
