/*
 * The product catalogue: what is for sale, how it is fulfilled, the packages that
 * bundle it, and the discount programmes on top.
 */
import type { Account } from '@/pages/admin/data/companies'
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Billing & products ───────────────────────────────────────────────────── */
/* The five product TYPES, derived from the client Products deck. The type is the
   discriminator that decides what "fulfilment" means, so it drives which fields
   the create form asks for — see NewProductModal. */
/* ── Placements registry ──────────────────────────────────────────────────────
   One row per display area on the jobseeker site, transcribed from the client
   Products deck (§1 Dịch vụ Trang chủ, §2 Dịch vụ Trang Tìm kiếm).

   This is the layer BETWEEN the site and the catalog. Sizes and caps live here,
   once — not retyped into every banner sale — and each row records how it gets
   filled, which is the product ⇄ homepage relationship:

     tier   — membership is DERIVED from a job's posting tier. Nothing is booked.
     booked — a company buys the slot for N days. Capacity-capped → needs a calendar.
     both   — available by tier AND sellable standalone. Needs a priority rule,
              or the fixed positions get oversold. */
export type FillRoute = 'tier' | 'booked' | 'both'
export const FILL_META: Record<FillRoute, { label: string; tone: StatusTone; hint: string }> = {
  tier: { label: 'Tier-driven', tone: 'active', hint: 'Derived from the job’s posting tier — never booked, never assigned by hand.' },
  booked: { label: 'Booked', tone: 'pending', hint: 'Sold as a time window on the slot. Capacity-capped, so it needs an availability calendar.' },
  both: { label: 'Tier + booked', tone: 'rejected', hint: 'Two supply routes competing for the same positions — needs an explicit priority rule.' },
}
export type Placement = { id: string; page: 'Home' | 'Search'; ref: string; name: string; size: string; shown: string; cap: string; route: FillRoute; fedBy: string }
export const PLACEMENTS: Placement[] = [
  { id: 'home-hero', page: 'Home', ref: '1.1', name: 'Main Banner (Hero)', size: '1536 × 371 px', shown: '1 at a time', cap: 'max 6 · rotate 3s', route: 'booked', fedBy: 'Banner placement product · client-supplied image + link' },
  { id: 'home-feature-co', page: 'Home', ref: '1.2', name: 'Feature company (logos)', size: 'Logo from profile', shown: '6 logos', cap: 'max 12 · random per reload', route: 'booked', fedBy: 'Feature company product · logo auto-pulled from company profile' },
  { id: 'home-super-hot', page: 'Home', ref: '1.3', name: 'Công việc Hot hôm nay', size: 'Job card + image', shown: '4 jobs', cap: 'unlimited pool · random per reload', route: 'both', fedBy: 'Top Job tier (first 10 days) — AND sold standalone (10 ngày)' },
  { id: 'home-top-co', page: 'Home', ref: '1.4', name: 'Top Companies Hiring Now', size: 'Logo + cover', shown: '2 companies', cap: 'max 5 · rotate 5s', route: 'booked', fedBy: 'Công ty nổi bật product (10 ngày)' },
  { id: 'home-popular-jobs', page: 'Home', ref: '1.5', name: 'Popular Jobs', size: 'Job row', shown: '20 postings', cap: '+4 fixed premium positions', route: 'both', fedBy: 'Distinction + Top Job tiers · 4 fixed positions sold as an add-on' },
  { id: 'home-highlight-co', page: 'Home', ref: '1.6', name: 'Highlight Companies', size: 'Job row', shown: '20 postings', cap: '+5 fixed premium positions', route: 'both', fedBy: 'Basic Plus tier · 5 fixed positions sold as an add-on' },
  { id: 'home-new-jobs', page: 'Home', ref: '1.7', name: 'Công việc mới (Job Basic)', size: 'Job row', shown: 'List', cap: 'Bottom of page', route: 'tier', fedBy: 'Basic tier' },
  { id: 'home-adsense', page: 'Home', ref: '1.8', name: 'Banner adsense', size: '1260 × 120 px', shown: '1 at a time', cap: 'max 6 · refresh on reload', route: 'booked', fedBy: 'Banner placement product · below “Hot Categories”' },
  { id: 'home-tailored', page: 'Home', ref: '1.9', name: 'Jobs Tailored For You', size: 'Job card', shown: 'List', cap: '—', route: 'tier', fedBy: 'Guests: Distinction + Top Job · Logged in: personalised by profile & behaviour' },
  { id: 'home-popup', page: 'Home', ref: '1.10', name: 'Homepage pop-up', size: 'Custom creative', shown: '1 at a time', cap: 'priority decides · frequency-capped', route: 'booked', fedBy: 'Popup placement product · per campaign, CTA configurable' },
  { id: 'search-highlight-co', page: 'Search', ref: '2.1', name: 'Highlight Company', size: 'Company block', shown: '1 company', cap: 'unlimited · random per reload', route: 'booked', fedBy: 'Highlight Company product → links to company profile' },
  { id: 'search-highlight-jobs', page: 'Search', ref: '2.2', name: 'Highlight Jobs', size: 'Job row', shown: 'Unlimited', cap: 'shuffled per search session', route: 'tier', fedBy: 'Basic Plus · Distinction · Top Job (tier sets the rank band)' },
  { id: 'search-adsense', page: 'Search', ref: '2.3', name: 'Banner adsense', size: '425 × 160 px', shown: '1 at a time', cap: 'unlimited · position varies on reload', route: 'booked', fedBy: 'Banner placement product · interleaved between results' },
]

/* ── Image gallery ───────────────────────────────────────────────────────────
   The stock pictures a JOB borrows when its product feeds a placement with image
   slots. Classified by TOPIC — what the picture SHOWS — because that is the only
   thing intrinsic to a photograph: two people at a laptop is a business scene
   that serves IT, banking, marketing and a school office equally, and calling it
   "IT / Software" is a claim about the employer, not about the frame.

   Industry keeps its entry point through INDUSTRY_TOPICS: a small ordered map,
   so "filter by industry" still works and the automatic default still resolves,
   without any picture carrying an industry it cannot support. Rename an industry
   and one map row changes instead of hundreds of pictures being re-tagged. */
export type GalleryImg = {
  id: string; title: string; topics: string[]; tags: string[]
  /** a scene with people/objects, or a texture the card lays a logo over */
  role: 'subject' | 'background'
  /** stand-in for the photo — the wireframe paints a gradient rather than shipping stock */
  hue: number
  uses: number; licence: string; expires?: string; archived?: boolean
}
export const GALLERY: GalleryImg[] = [
  { id: 'g1', title: 'Kho hàng · xe nâng', topics: ['Kho vận'], tags: ['xe nâng', 'trong nhà'], role: 'subject', hue: 210, uses: 12, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g2', title: 'Dây chuyền sản xuất', topics: ['Nhà máy · sản xuất', 'Kỹ thuật'], tags: ['máy móc'], role: 'subject', hue: 24, uses: 7, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g3', title: 'Nhóm họp trong văn phòng', topics: ['Văn phòng', 'Nhóm người'], tags: ['phòng họp'], role: 'subject', hue: 268, uses: 41, licence: 'Stock · Unsplash+' },
  { id: 'g4', title: 'Phòng khám · điều dưỡng', topics: ['Y tế · chăm sóc', 'Nhóm người'], tags: ['bệnh viện'], role: 'subject', hue: 160, uses: 5, licence: 'Nội bộ · shoot 2026' },
  { id: 'g5', title: 'Lập trình viên & màn hình code', topics: ['Công nghệ', 'Văn phòng'], tags: ['màn hình'], role: 'subject', hue: 200, uses: 23, licence: 'Stock · Unsplash+' },
  { id: 'g6', title: 'Quầy bán lẻ · khách hàng', topics: ['Bán lẻ · cửa hàng'], tags: ['khách hàng'], role: 'subject', hue: 340, uses: 9, licence: 'Stock · Shutterstock', expires: '28/02/2026' },
  { id: 'g7', title: 'Công trường xây dựng', topics: ['Công trường', 'Kỹ thuật'], tags: ['ngoài trời', 'mũ bảo hộ'], role: 'subject', hue: 40, uses: 3, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g8', title: 'Lớp học · giảng viên', topics: ['Lớp học · đào tạo', 'Nhóm người'], tags: ['bảng'], role: 'subject', hue: 96, uses: 6, licence: 'Nội bộ · shoot 2026' },
  { id: 'g9', title: 'Sảnh khách sạn', topics: ['Nhà hàng · khách sạn'], tags: ['dịch vụ'], role: 'subject', hue: 12, uses: 2, licence: 'Stock · Unsplash+' },
  { id: 'g10', title: 'Quầy giao dịch ngân hàng', topics: ['Văn phòng', 'Bán lẻ · cửa hàng'], tags: ['khách hàng'], role: 'subject', hue: 224, uses: 15, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g11', title: 'Toà nhà cao tầng (nền)', topics: ['Toà nhà · kiến trúc'], tags: ['ngoài trời', 'skyline'], role: 'background', hue: 190, uses: 18, licence: 'Stock · Unsplash+' },
  { id: 'g12', title: 'Gradient xanh (nền)', topics: ['Trừu tượng · nền'], tags: ['nền'], role: 'background', hue: 246, uses: 11, licence: 'Nội bộ · shoot 2026' },
  { id: 'g13', title: 'Cây xanh · ánh sáng tự nhiên', topics: ['Thiên nhiên · môi trường'], tags: ['ngoài trời', 'xanh'], role: 'background', hue: 130, uses: 4, licence: 'Stock · Unsplash+' },
  { id: 'g14', title: 'Xe tải giao hàng', topics: ['Vận tải'], tags: ['ngoài trời'], role: 'subject', hue: 350, uses: 6, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g15', title: 'Kệ hàng siêu thị (cũ)', topics: ['Bán lẻ · cửa hàng'], tags: [], role: 'subject', hue: 300, uses: 0, licence: 'Stock · hết hạn', archived: true },
  { id: 'g16', title: 'Bàn làm việc · laptop', topics: ['Văn phòng'], tags: ['bàn làm việc'], role: 'subject', hue: 258, uses: 33, licence: 'Stock · Unsplash+' },
  { id: 'g17', title: 'Trao đổi trong phòng họp', topics: ['Văn phòng', 'Nhóm người'], tags: ['phòng họp'], role: 'subject', hue: 236, uses: 19, licence: 'Stock · Unsplash+' },
  { id: 'g18', title: 'Kỹ sư kiểm tra máy', topics: ['Kỹ thuật', 'Nhà máy · sản xuất'], tags: ['mũ bảo hộ'], role: 'subject', hue: 32, uses: 8, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g19', title: 'Kỹ sư hiện trường', topics: ['Kỹ thuật', 'Công trường'], tags: ['ngoài trời'], role: 'subject', hue: 48, uses: 5, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g20', title: 'Chia hàng trong kho', topics: ['Kho vận'], tags: ['thùng hàng'], role: 'subject', hue: 196, uses: 10, licence: 'Stock · Unsplash+' },
  { id: 'g21', title: 'Đóng gói đơn hàng', topics: ['Kho vận', 'Vận tải'], tags: ['thùng hàng'], role: 'subject', hue: 182, uses: 4, licence: 'Nội bộ · shoot 2026' },
  { id: 'g22', title: 'Đội ngũ chụp chung', topics: ['Nhóm người'], tags: ['chân dung nhóm'], role: 'subject', hue: 288, uses: 27, licence: 'Stock · Unsplash+' },
  { id: 'g23', title: 'Server room · hạ tầng', topics: ['Công nghệ'], tags: ['trung tâm dữ liệu'], role: 'subject', hue: 214, uses: 9, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g24', title: 'Bo mạch · cận cảnh', topics: ['Công nghệ', 'Trừu tượng · nền'], tags: ['cận cảnh'], role: 'background', hue: 172, uses: 7, licence: 'Stock · Unsplash+' },
  { id: 'g25', title: 'Thùng carton thương hiệu', topics: ['Sản phẩm · bao bì'], tags: ['tĩnh vật', 'đóng gói'], role: 'subject', hue: 22, uses: 5, licence: 'Stock · Unsplash+' },
  { id: 'g26', title: 'Hàng tiêu dùng bày trên bàn', topics: ['Sản phẩm · bao bì', 'Bán lẻ · cửa hàng'], tags: ['tĩnh vật'], role: 'subject', hue: 104, uses: 3, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g27', title: 'Ống nghiệm · mô hình phân tử', topics: ['Nghiên cứu · phòng lab'], tags: ['R&D'], role: 'background', hue: 208, uses: 8, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g28', title: 'Kỹ thuật viên trong phòng lab', topics: ['Nghiên cứu · phòng lab', 'Y tế · chăm sóc'], tags: ['áo blouse'], role: 'subject', hue: 174, uses: 2, licence: 'Nội bộ · shoot 2026' },
  { id: 'g29', title: 'Biểu đồ tài chính trên máy tính bảng', topics: ['Dữ liệu · biểu đồ', 'Công nghệ'], tags: ['cận cảnh bàn tay'], role: 'background', hue: 188, uses: 14, licence: 'Stock · Unsplash+' },
  { id: 'g30', title: 'Bảng số liệu · màn hình', topics: ['Dữ liệu · biểu đồ'], tags: ['màn hình'], role: 'background', hue: 220, uses: 6, licence: 'Stock · Unsplash+' },
  { id: 'g31', title: 'Nhà máy nhìn từ trên cao', topics: ['Nhà xưởng · ngoại cảnh', 'Nhà máy · sản xuất'], tags: ['flycam', 'ngoài trời'], role: 'background', hue: 200, uses: 9, licence: 'Stock · Shutterstock', expires: '31/12/2026' },
  { id: 'g32', title: 'Toàn cảnh khu công nghiệp', topics: ['Nhà xưởng · ngoại cảnh'], tags: ['ngoài trời'], role: 'background', hue: 30, uses: 4, licence: 'Stock · Unsplash+' },
  { id: 'g33', title: 'Bắt tay · chúc mừng (cận cảnh)', topics: ['Nhóm người'], tags: ['cận cảnh bàn tay', 'cử chỉ'], role: 'subject', hue: 306, uses: 21, licence: 'Stock · Unsplash+' },
  { id: 'g34', title: 'Bàn làm việc · sổ và đồng hồ', topics: ['Văn phòng'], tags: ['tĩnh vật'], role: 'background', hue: 44, uses: 12, licence: 'Stock · Unsplash+' },
]
/** Master data → Image topic. ~12 values, and it does not grow when the industry list does. */
export const GALLERY_TOPICS = [
  'Văn phòng', 'Kỹ thuật', 'Nhà máy · sản xuất', 'Nhà xưởng · ngoại cảnh', 'Kho vận', 'Vận tải',
  'Công trường', 'Bán lẻ · cửa hàng', 'Sản phẩm · bao bì', 'Y tế · chăm sóc', 'Nghiên cứu · phòng lab',
  'Lớp học · đào tạo', 'Nhà hàng · khách sạn', 'Công nghệ', 'Dữ liệu · biểu đồ', 'Nhóm người',
  'Toà nhà · kiến trúc', 'Thiên nhiên · môi trường', 'Trừu tượng · nền',
]
/** INDUSTRY → ordered topics. The first entry is what the automatic default resolves to. */
export const INDUSTRY_TOPICS: [string, string[]][] = [
  ['IT / Software', ['Công nghệ', 'Dữ liệu · biểu đồ', 'Văn phòng', 'Trừu tượng · nền']],
  ['FMCG', ['Sản phẩm · bao bì', 'Nhà máy · sản xuất', 'Bán lẻ · cửa hàng', 'Kho vận']],
  ['Banking / Finance', ['Dữ liệu · biểu đồ', 'Văn phòng', 'Toà nhà · kiến trúc']],
  ['Healthcare', ['Y tế · chăm sóc', 'Nghiên cứu · phòng lab', 'Nhóm người']],
  ['Manufacturing', ['Nhà máy · sản xuất', 'Nhà xưởng · ngoại cảnh', 'Kỹ thuật']],
  ['Retail', ['Bán lẻ · cửa hàng', 'Sản phẩm · bao bì', 'Kho vận']],
  ['Education', ['Lớp học · đào tạo', 'Nhóm người']],
  ['Logistics', ['Kho vận', 'Vận tải', 'Nhà xưởng · ngoại cảnh']],
  ['Construction & Real Estate', ['Công trường', 'Toà nhà · kiến trúc', 'Kỹ thuật']],
  ['Hospitality & Tourism', ['Nhà hàng · khách sạn', 'Nhóm người']],
  ['Media & Advertising', ['Văn phòng', 'Nhóm người', 'Trừu tượng · nền']],
  ['Telecommunications', ['Công nghệ', 'Dữ liệu · biểu đồ', 'Toà nhà · kiến trúc']],
]
/** the wireframe's stand-in for a photograph */
export const imgStyle = (hue: number) => ({
  background: `linear-gradient(135deg, hsl(${hue} 55% 62%), hsl(${hue + 28} 45% 42%))`,
})

/* ── Upload ──────────────────────────────────────────────────────────────────
   Two steps, because a stock pack arrives forty pictures at a time and nobody
   classifies forty pictures one modal at a time: drop the batch, let the too-small
   ones fail loudly, then apply topic / role / licence to the whole batch at once
   and correct the odd one out. */
export type PendingFile = { name: string; w: number; h: number; hue: number; title: string; ok: boolean }
export const PENDING_SEED: PendingFile[] = [
  { name: 'warehouse-forklift-02.jpg', w: 2400, h: 1600, hue: 205, title: 'Kho hàng · xe nâng', ok: true },
  { name: 'team-meeting-natural-light.jpg', w: 3000, h: 2000, hue: 262, title: 'Họp nhóm · ánh sáng tự nhiên', ok: true },
  { name: 'engineer-inspection.jpg', w: 2048, h: 1365, hue: 34, title: 'Kỹ sư kiểm tra thiết bị', ok: true },
  { name: 'clinic-corridor.jpg', w: 1800, h: 1200, hue: 158, title: 'Hành lang phòng khám', ok: true },
  { name: 'logo-square-small.png', w: 800, h: 800, hue: 320, title: 'logo-square-small', ok: false },
]

/* FOUR types. "Add-on" was a fifth until we noticed it describes how a thing is
   SOLD, not what it is: an email blast is a Manual service whether it is sold
   alone or included in Top Job, and a premium fixed position is a Placement
   either way. So attachability is a FLAG on the product (`standalone`), not a
   type — which is why the same "Công ty nổi bật" definition serves both the
   standalone booking and the copy included inside Top Job. */
export const PRODUCT_TYPES = [
  { id: 'job', label: 'Job posting', blurb: 'A posting tier — publishing a job spends one slot', eg: 'Basic · Basic Plus · Distinction · Top Job' },
  { id: 'cv', label: 'CV search', blurb: 'Unlock quota + validity, spent per CV opened', eg: 'COMBO 30 / 50 / 100 / 300' },
  { id: 'placement', label: 'Placement booking', blurb: 'A time window on a slot, capacity-capped', eg: 'Main banner · Công ty nổi bật · Adsense · Popup' },
  { id: 'service', label: 'Manual service', blurb: 'Ops fulfils it — creates a task, not an entitlement', eg: 'Fanpage post · Email marketing' },
] as const
export type ProductTypeId = (typeof PRODUCT_TYPES)[number]['id']

/* The catalog, transcribed from the client Products deck. Prices marked ⓒ come
   from the current CRM product picker (the deck prices only the CV combos).

   Note what is deliberately NOT here: one row per tier, not the four segment
   variants the CRM carries today (Basic Plus exists there as Basic Plus SMEs
   3.949.000 / Basic Plus Enterprise 5.544.000 / Basic Plus Job 6.100.000 /
   Basic Plus 15 days 30.000.000). Segment pricing is a price list ON the
   product, so what a tier grants is defined once. */
/* SKU is the stable handle a product keeps for life: it is what a quotation line,
   an order, an invoice and an entitlement all reference, so it must survive a
   rename. Shape is TYPE-CAPABILITY — the type prefix makes a row self-describing
   in an export or a support ticket, where the Type column is not there to help. */
/* `role` is the product's relationship to a sale — the same axis the create form
   asks for. Three values, not two, because the fanpage post and the email send are
   genuinely sold standalone AND included inside Top Job; a binary flag would force
   duplicating them.
     Main   — quotable on its own
     Add-on — reaches a customer only via another product's `includes`
     Both   — quotable AND includable                                            */
type ProductRole = 'Main' | 'Add-on'
/* `entitlement` says HOW a product reaches a job, and it is deliberately NOT
   derived from price: a promo line can cost 0 ₫ and still be consumed from a PO.
   'free' = HQ may post it at any time with no PO and no limit; it is Admin-only,
   never offered on the Company site, and never upgradeable to a paid tier. */
type Entitlement = 'purchase' | 'free'
/* ── Activation window ────────────────────────────────────────────────────────
   How long the customer has to START using what they bought, counted from the
   INVOICE date — client T&C clause 4. It is the middle of three clocks and the
   only one that can silently destroy paid-for quota:

     provisioned   the invoice is issued → quota lands on the account (immediate)
     activate by   invoice date + THIS window → unused quota expires
     runs for      once a slot is activated, the posting/pack runs its own period

   It sits on the PRODUCT, not on a global setting, because a 12-month bank on a
   13.800.000 ₫ Top Job slot and a 12-month bank on a free trial tin are not the
   same promise. Default 12 months, which is what the client T&C states. */
export const ACTIVATE_WITHIN_DEFAULT = 12
/** Months to activate, or null where the product is never invoiced at all. */
export const activateWithin = (p: { entitlement?: Entitlement; activateWithin?: number }) =>
  p.entitlement === 'free' ? null : p.activateWithin ?? ACTIVATE_WITHIN_DEFAULT
/* Always in MONTHS, never "1 năm": the point of the column is to compare 3 against
   12 at a glance, and the client T&C itself says "trong vòng 12 tháng". */
export const activateWithinLabel = (p: { entitlement?: Entitlement; activateWithin?: number }) => {
  const m = activateWithin(p)
  return m === null ? '—' : `${m} tháng`
}

/* `trial` is a third VISIBILITY axis, alongside role. A trial product is a real
   SKU with a real (low) price — not a discount — and it is offered ONLY inside a
   quotation whose discount programme is Gói dùng thử. Keeping it a product is
   what makes the sale auditable: the invoice states what was sold at what price,
   and revenue reporting sees a cheap SKU rather than a 95% write-down nobody can
   explain a year later. */
export const CATALOG: { sku: string; name: string; type: string; role: ProductRole; price: string; fulfilment: string; status: 'Active' | 'Inactive'; includes?: string[]; entitlement?: Entitlement; activateWithin?: number; trial?: boolean }[] = [
  // ── Job posting ───────────────────────────────────────────────────────────
  { sku: 'JOB-FREE', name: 'Tin Free (Admin đăng hộ)', type: 'Job posting', role: 'Main', price: '0 ₫', fulfilment: '14 ngày · không vị trí nổi bật', status: 'Active', entitlement: 'free' },
  { sku: 'JOB-BASIC', name: 'Tin Basic', type: 'Job posting', role: 'Main', price: '2,710,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 15 ngày', status: 'Active' },
  { sku: 'JOB-BASICPLUS', name: 'Tin Basic Plus', type: 'Job posting', role: 'Main', price: '6,100,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 10 ngày', status: 'Active', includes: ['PLC-HLCOMPANIES', 'SVC-EMAIL-DEV'] },
  { sku: 'JOB-DISTINCTION', name: 'Tin Distinction', type: 'Job posting', role: 'Main', price: '12,000,000 ₫ ⓒ', fulfilment: '30 ngày · làm mới 5 ngày', status: 'Active', includes: ['PLC-POPULARJOBS'] },
  { sku: 'JOB-TOPJOB', name: 'Tin Top Job', type: 'Job posting', role: 'Main', price: '13,800,000 ₫ ⓒ', fulfilment: '30 ngày · mỗi ngày ×7 rồi 5 ngày', status: 'Active', includes: ['PLC-POPULARJOBS', 'SVC-FB-TOPDEV', 'SVC-EMAIL-DEV'] },
  // Shorter window than the 12-month default on purpose: a giveaway that can be
  // banked for a year is a liability on the books, not an incentive to start.
  { sku: 'JOB-TRIAL', name: 'Tin đăng dùng thử (Basic Job)', type: 'Job posting', role: 'Main', price: '500,000 ₫', fulfilment: '15 ngày · 1 slot · 1 lần / MST', status: 'Active', activateWithin: 3, trial: true },
  { sku: 'CV-TRIAL', name: 'Tìm kiếm hồ sơ dùng thử (7 ngày)', type: 'CV search', role: 'Main', price: '300,000 ₫', fulfilment: '5 lượt · 7 ngày · 1 lần / MST', status: 'Active', activateWithin: 3, trial: true },

  // ── CV search ─────────────────────────────────────────────────────────────
  { sku: 'CV-030', name: 'COMBO 30 — mở CV', type: 'CV search', role: 'Main', price: '2,400,000 ₫', fulfilment: '30 lượt · 30 ngày · ~80.000/CV', status: 'Active' },
  { sku: 'CV-050', name: 'COMBO 50 — mở CV', type: 'CV search', role: 'Main', price: '3,700,000 ₫', fulfilment: '50 lượt · 30 ngày · ~74.000/CV', status: 'Active' },
  { sku: 'CV-100', name: 'COMBO 100 — mở CV', type: 'CV search', role: 'Main', price: '7,000,000 ₫', fulfilment: '100 lượt · 90 ngày · ~70.000/CV', status: 'Active' },
  { sku: 'CV-300', name: 'COMBO 300 — mở CV', type: 'CV search', role: 'Main', price: '20,000,000 ₫', fulfilment: '300 lượt · 90 ngày · ~67.000/CV', status: 'Active' },
  { sku: 'CV-SOURCING', name: 'CV sourcing + giới thiệu', type: 'CV search', role: 'Add-on', price: '— nội bộ', fulfilment: '10 lượt · theo gói cha', status: 'Active' },

  // ── Placement booking ─────────────────────────────────────────────────────
  { sku: 'PLC-HOMEHERO', name: 'Main Banner — Home hero', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1536×371 · 1 of 6 · rotate 3s', status: 'Inactive' },
  { sku: 'PLC-FEATURECO', name: 'Feature company (logo)', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '6 logo · tối đa 12', status: 'Inactive' },
  { sku: 'PLC-TOPCOMPANY', name: 'Công ty nổi bật', type: 'Placement booking', role: 'Main', price: '10,000,000 ₫ ⓒ', fulfilment: '10 ngày · Home · logo + cover', status: 'Active' },
  { sku: 'PLC-HOTJOBS', name: 'Công việc Hot hôm nay', type: 'Placement booking', role: 'Main', price: '5,000,000 ₫ ⓒ', fulfilment: '10 ngày · 4 vị trí', status: 'Active' },
  { sku: 'PLC-ADS-HOME', name: 'Banner adsense — Home', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1260×120 · 1 of 6', status: 'Inactive' },
  { sku: 'PLC-ADS-SEARCH', name: 'Banner adsense — Search', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '425×160 · không giới hạn', status: 'Inactive' },
  { sku: 'PLC-SEARCH-HLCO', name: 'Highlight Company — Search', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1 công ty · không giới hạn', status: 'Inactive' },
  { sku: 'PLC-POPUP', name: 'Homepage pop-up', type: 'Placement booking', role: 'Main', price: '— price TBC', fulfilment: '1 popup · theo chiến dịch', status: 'Inactive' },
  { sku: 'PLC-POPULARJOBS', name: 'Popular Jobs — vị trí premium', type: 'Placement booking', role: 'Add-on', price: '— nội bộ', fulfilment: '4 vị trí cố định', status: 'Active' },
  { sku: 'PLC-HLCOMPANIES', name: 'Highlight Companies — vị trí premium', type: 'Placement booking', role: 'Add-on', price: '— nội bộ', fulfilment: '5 vị trí cố định', status: 'Active' },

  // ── Manual service ────────────────────────────────────────────────────────
  { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', type: 'Manual service', role: 'Main', price: '4,000,000 ₫ ⓒ', fulfilment: '1 bài đăng · 176k follower', status: 'Active' },
  { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', type: 'Manual service', role: 'Main', price: '20,000,000 ₫ ⓒ', fulfilment: '1 lượt gửi · reach theo gói cha', status: 'Active' },
  { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', type: 'Manual service', role: 'Add-on', price: '— nội bộ', fulfilment: '1 bài test · chỉ trong Gói Ultimate', status: 'Active' },
  { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', type: 'Manual service', role: 'Add-on', price: '— nội bộ', fulfilment: '2 mốc · ngày 11 và ngày 31', status: 'Active' },
  { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', type: 'Manual service', role: 'Main', price: '8,000,000 ₫', fulfilment: '1 lượt gửi · 650k ứng viên', status: 'Active' },
]

/* Price segments and product descriptions are shared by the create form and the
   product record, so the two can never ask for / show a different set. */
export const PRICE_SEGMENTS = ['SME / Startup', 'Enterprise', 'Standard'] as const

/** Deck-derived VI/EN description — what prints on the quotation and the PO. */
export const DESCRIPTIONS: Record<string, { vi: string; en: string }> = {
  'JOB-BASIC': { vi: 'Đăng tuyển chính thức 30 ngày, gắn tối đa 03 skill tag · Làm mới bài đăng mỗi 15 ngày · Hiển thị tại Trang chủ mục “Công việc mới” và Trang tìm kiếm.', en: 'Official job posting for 30 days, up to 03 skill tags · Refreshed every 15 days · Shown in “New jobs” on the homepage and in search.' },
  'JOB-BASICPLUS': { vi: 'Đăng tuyển chính thức 30 ngày · Làm mới mỗi 10 ngày · Tiêu đề tô đỏ · Ưu tiên hiển thị trong kết quả tìm kiếm · Logo công ty tại mục Highlight Companies · Email marketing đến 7.500 data.', en: 'Official posting for 30 days · Refreshed every 10 days · Bold red title · Priority in search results · Company logo in Highlight Companies · Email marketing to 7,500 targeted profiles.' },
  'JOB-DISTINCTION': { vi: 'Đăng tuyển chính thức 30 ngày, tối đa 05 skill tag · Làm mới mỗi 05 ngày · Tiêu đề đỏ + nền nổi bật · Hiển thị 03 phúc lợi ở trang tìm kiếm · Top Search · Hiển thị tại “Các công ty phổ biến”.', en: 'Official posting for 30 days, up to 05 skill tags · Refreshed every 05 days · Red title + highlighted background · 3 benefits shown in search · Top Search · Shown in Popular Companies.' },
  'JOB-TOPJOB': { vi: 'Gói cao cấp nhất: 30 ngày, tối đa 07 skill tag · Làm mới mỗi ngày trong 7 ngày đầu rồi mỗi 05 ngày · Nhãn “HOT JOB” 10 ngày · “Công việc Hot hôm nay” 10 ngày đầu · Vị trí cao nhất Top Search · Bài đăng fanpage TopDev · Big Banner trong Email Job Alert.', en: 'Top tier: 30 days, up to 07 skill tags · Refreshed daily for the first 7 days then every 05 · “HOT JOB” label for 10 days · “Hot jobs today” for the first 10 days · Highest Top Search position · TopDev fanpage post · Big Banner in the Email Job Alert.' },
  'JOB-TRIAL': { vi: 'Tin dùng thử tặng khách hàng mới: 15 ngày hiển thị, 01 slot, giới hạn 01 lần trên mỗi mã số thuế.', en: 'Free trial posting for new customers: 15 days, 01 slot, limited to once per tax code.' },
  'CV-030': { vi: 'Mở 30 hồ sơ ứng viên (mỗi CV tương ứng 01 lượt mở) · Hạn dùng 30 ngày kể từ ngày kích hoạt · Hồ sơ đã mở được bảo lưu 30 ngày sau khi dịch vụ hết hạn.', en: 'Unlock 30 candidate profiles (1 unlock per CV) · Valid 30 days from activation · Opened profiles retained 30 days after expiry.' },
  'CV-050': { vi: 'Mở 50 hồ sơ ứng viên · Hạn dùng 30 ngày kể từ ngày kích hoạt.', en: 'Unlock 50 candidate profiles · Valid 30 days from activation.' },
  'CV-100': { vi: 'Mở 100 hồ sơ ứng viên · Hạn dùng 90 ngày kể từ ngày kích hoạt.', en: 'Unlock 100 candidate profiles · Valid 90 days from activation.' },
  'CV-300': { vi: 'Mở 300 hồ sơ ứng viên · Hạn dùng 90 ngày kể từ ngày kích hoạt.', en: 'Unlock 300 candidate profiles · Valid 90 days from activation.' },
  'PLC-TOPCOMPANY': { vi: 'Thời gian hiển thị 10 ngày · Vị trí Trang chủ TopDev · Logo công ty và hình ảnh đại diện · Tiếp cận hơn 200.000 lượt truy cập.', en: '10 days · TopDev homepage · Company logo and cover image · Reaches 200,000+ visits.' },
  'PLC-HOTJOBS': { vi: 'Thời gian hiển thị 10 ngày · Trang chủ TopDev · Logo công ty và thông tin tuyển dụng · 4 vị trí hiển thị.', en: '10 days · TopDev homepage · Company logo and job details · 4 display positions.' },
  'SVC-FB-TOPDEV': { vi: 'Bài đăng quảng bá tin tuyển dụng hoặc thương hiệu trên fanpage chính thức TopDev, hơn 176.000 follower.', en: 'A promotional post for the job or brand on the official TopDev fanpage, 176,000+ followers.' },
  'SVC-EMAIL-DEV': { vi: 'Gửi email tin tuyển dụng hoặc chiến dịch truyền thông đến database developer của TopDev.', en: 'Email the job or campaign to the TopDev developer database.' },
}

export type CatalogItem = (typeof CATALOG)[number]

export const PACKAGES: { name: string; note: string; components: string; price: string; status: 'Active' | 'Inactive' }[] = [
  { name: 'Gói Ultimate', note: '6 components · from the client catalogue', components: 'Top Job posting (60 ngày: 30 chính thức + 30 bảo hành) · CV sourcing + giới thiệu · Email marketing 9.500 data · Popular Companies logo · HackerRank assessment · CSKH follow-up', price: '16,489,000 ₫', status: 'Active' },
  { name: 'Top Job + premium position', note: '2 components · proposed', components: 'Tin Top Job ×1 · Popular Jobs premium position ×1', price: '— price TBC', status: 'Inactive' },
  { name: 'Enterprise (custom)', note: 'quoted per deal', components: 'All products + negotiated volume', price: 'Custom', status: 'Inactive' },
]

/* ── Discount programmes ──────────────────────────────────────────────────────
   The client's own promo sheet, configured here ONCE and applied by the quotation
   builder automatically. It is deliberately settings, not a hard-coded rule: the
   thresholds are a commercial decision that changes every campaign, and a rep
   typing 25 / 30 / 35 by hand gets it wrong roughly as often as they get it right.

   Two programmes, two SHAPES, and the shapes are genuinely different — which is
   why this is not one table with an audience column:

     volume per PRODUCT (Existing)  — quantities of the SAME product are summed
                                      across the option, and the tier that total
                                      reaches sets the % on every line of it
     flat on the order  (New/Churn) — one % on everything, but only while EVERY
                                      line stays at or under a quantity cap

   “Cùng loại” is the load-bearing phrase in the first one: 3 + 4 Basic Plus on two
   lines is 7 Basic Plus, so both lines earn the 5-tier at 30% — not 25% each for
   being under 5 separately. Splitting a line must never change the price.

   The second is all-or-nothing on purpose: one line over the cap and the whole
   50% is lost, not just that line's share. That cliff is the client's rule, and
   it is the reason the builder has to show WHICH line broke it. */
type PromoAudience = Account
type VolumeTier = { minQty: number; pct: number }
export type Programme = {
  id: string
  name: string
  vi: string
  audience: PromoAudience[]
  /** per-product: quantities of the same product are summed, then tiered ·
      flat: one % on the whole option */
  kind: 'volume-per-product' | 'flat-order'
  tiers?: VolumeTier[]
  pct?: number
  /** flat only — every non-gift line must be at or under this, or nothing applies */
  maxQtyPerLine?: number
  /** flat only — first PO of the CURRENT status spell, not first in history: for a
      Churn customer that is the first PO since they came back. Self-enforcing,
      because the first invoice flips them to Existing and the programme stops
      matching on its own. */
  firstPoOfCurrentSpell?: boolean
  /** whether it may run alongside another programme on the same quotation */
  stackable: boolean
  /** gift lines inherit the paid line's activation window rather than their own */
  giftActivationFollowsPaid?: boolean
  status: 'Active' | 'Inactive'
  from: string
  to: string
  note?: string
}

export const PROGRAMMES: Programme[] = [
  {
    id: 'EXISTING-VOLUME',
    name: 'Volume discount — existing customers',
    vi: 'Chiết khấu theo số lượng (cùng loại)',
    audience: ['Existing'],
    kind: 'volume-per-product',
    // Thresholds, not exact matches: 7 tin earns the 5-tier, not nothing.
    tiers: [
      { minQty: 2, pct: 25 }, { minQty: 5, pct: 30 }, { minQty: 10, pct: 35 },
      { minQty: 20, pct: 40 }, { minQty: 30, pct: 45 }, { minQty: 50, pct: 50 },
      { minQty: 100, pct: 60 },
    ],
    stackable: true,
    status: 'Active',
    from: '01/01/2026',
    to: '31/12/2026',
    note: 'Section 1 of 3 on the client’s sheet — the other two sections that “apply at the same time” have not been supplied yet.',
  },
  {
    id: 'NEWCHURN-50',
    name: 'Welcome / win-back — 50% off everything',
    vi: 'Giảm 50% tất cả các dịch vụ',
    audience: ['New', 'Churn'],
    kind: 'flat-order',
    pct: 50,
    maxQtyPerLine: 5,
    firstPoOfCurrentSpell: true,
    stackable: false,
    giftActivationFollowsPaid: true,
    status: 'Active',
    from: '01/01/2026',
    to: '31/12/2026',
    note: 'Over the cap, the sheet’s own escape routes are: quote the Existing programme instead, or split into two documents so the customer gets both. Both are a rep decision, not something the system does by itself.',
  },
]

/** The one programme that applies to a customer status, or null. */
export const programmeFor = (a?: Account) => PROGRAMMES.find((x) => x.status === 'Active' && a && x.audience.includes(a)) ?? null
/** Highest tier whose threshold the quantity reaches. 1 earns nothing. */
export const tierPct = (p: Programme, qty: number) =>
  (p.tiers ?? []).reduce((best, t) => (qty >= t.minQty ? t.pct : best), 0)
/** Quantity of each product across an option's PAID lines — the number the tier
    is looked up on. Gifts are 0 ₫ and were not bought, so they never count. */
export const qtyByProduct = (lines: { cat: number; qty: number; gift: boolean }[]) => {
  const m = new Map<number, number>()
  lines.forEach((l) => { if (!l.gift) m.set(l.cat, (m.get(l.cat) ?? 0) + l.qty) })
  return m
}
