/*
 * The CRM company model — who we sell to, what stage they are at, and how long
 * since anyone touched the account.
 */
import type { StatusTone } from '@/pages/admin/lib/tone'

/* ── Companies ────────────────────────────────────────────────────────────── */
// Pipeline stage = the sales/document flow. Ordered Qualified → Proposal →
// Negotiation → PO → Invoice, plus Lost. (Renewal/lapse is tracked separately by
// the customer `account` status: New / Existing / Churn.)
//   Qualified   = HR manager is willing to discuss the Quotation
//   Proposal    = Quotation has been sent to the customer
//   Negotiation = HR manager is running it through their internal approval process
//   PO          = customer agreed to buy; Sales issued the Purchase Order (deal won)
//   Invoice     = customer paid; Accounting issued the Invoice (deal closed)
//   Lost        = ended without a PO (declined / lost to a competitor / budget cut / went silent)
export type CoStatus = 'Qualified' | 'Proposal' | 'Negotiation' | 'PO' | 'Invoice' | 'Lost'
// Customer-relationship health (shown on the Companies directory) — distinct from the
// deal lifecycle above (shown on the Pipeline board). Only real customers have one;
// a company still being sold to (no PO yet) has account = null.
//   New = became a customer recently (onboarding)
//   Existing = active, currently using a purchased service
//   Churn = no new product bought for 1 year since the last PO was issued
/* Customer status — exactly three, and every company always has one.
     New      = has never bought from us (no VAT e-invoice has ever been issued)
     Existing = has paid at least once — active service or a past order
     Churn    = no new order for 12 months since the last invoice
   New is about BUYING HISTORY, not about having a login: a company can sit at New
   for years while being quoted repeatedly. Whether an account exists is a separate
   fact. New → Existing is one-way; a win-back returns a churned company to Existing,
   never to New. */
export type Account = 'New' | 'Existing' | 'Churn'
/* ── Who the invoice is made out to ───────────────────────────────────────────
   The VAT e-invoice has four different shapes depending on WHO is buying, and the
   difference is not cosmetic: which identifier is legally required changes, and so
   does which name block prints. Getting it wrong means re-issuing the invoice with
   a biên bản, so the classification is asked ONCE on the company record and every
   document reads it from there.

     dn-vn        Doanh nghiệp Việt Nam — MST REQUIRED. The ordinary case.
     dn-nn        Doanh nghiệp nước ngoài — MST may be EMPTY (they have no
                  Vietnamese tax code), but legal name + address are still required
                  because the invoice has to say who it was issued to.
     ca-nhan-cccd Cá nhân có CCCD — no MST at all. The citizen ID goes in its own
                  field and the person's name prints in "Họ tên người mua hàng",
                  which is a DIFFERENT line from "Tên đơn vị".
     ca-nhan      Cá nhân không có CCCD — MST and CCCD both empty. The invoice
                  still issues, and "Họ tên người mua hàng" prints the fixed phrase
                  "Bán cho người tiêu dùng" — the standard wording for a consumer
                  sale. That line is never blank and never typed.

   MST and CCCD are separate fields on purpose. They are different identifiers with
   different formats and different legal meaning, and one column holding either is
   the kind of shortcut that survives until an audit. */
/** What prints in "Họ tên người mua hàng" for a consumer sale with no CCCD. A fixed
    legal phrase, SUPPLIED BY THE SYSTEM and never typed: the rep should not have to
    remember the exact wording, and a typo here lands on a filed fiscal document. */
export const RETAIL_BUYER = 'Bán cho người tiêu dùng'
export type BuyerType = 'dn-vn' | 'dn-nn' | 'ca-nhan-cccd' | 'ca-nhan'
export const BUYER_TYPE: Record<BuyerType, { vi: string; en: string; tax: 'req' | 'empty'; needsIdCard?: boolean; needsBuyerName?: boolean; noAddress?: boolean; hint: string }> = {
  'dn-vn': { vi: 'Doanh nghiệp Việt Nam', en: 'Vietnamese company', tax: 'req', hint: 'MST bắt buộc — in trên hóa đơn VAT.' },
  'dn-nn': { vi: 'Doanh nghiệp nước ngoài', en: 'Foreign company', tax: 'empty', hint: 'Không có MST Việt Nam — để trống. Vẫn bắt buộc tên pháp lý và địa chỉ.' },
  'ca-nhan-cccd': { vi: 'Cá nhân có CCCD', en: 'Individual with ID card', tax: 'empty', needsIdCard: true, needsBuyerName: true, hint: 'Không có MST. Điền số CCCD và họ tên người mua hàng.' },
  /* Điểm 4b, Phụ lục NĐ 254/2026: when the buyer does not provide name, address and
     số định danh cá nhân, the invoice shows only “Bán cho người tiêu dùng”. So there
     is no address to ask for either — the whole buyer block is that one line. */
  'ca-nhan': { vi: 'Cá nhân không có CCCD', en: 'Individual, no ID provided', tax: 'empty', noAddress: true, hint: `Không hỏi MST, CCCD và cả địa chỉ. Hóa đơn chỉ in “${RETAIL_BUYER}” ở dòng Họ tên người mua hàng.` },
}

export type Company = {
  name: string; shortName: string; legalName: string; tax: string; industry: string; size: string; address: string
  /** Which of the four invoice shapes this buyer takes. Defaults to a Vietnamese
      company, which is the overwhelming majority. */
  buyerType?: BuyerType
  /** Số CCCD — only for an individual buyer. NEVER stored in `tax`. */
  idCard?: string
  /** "Họ tên người mua hàng" on the invoice — the PERSON, which is a different line
      from Tên đơn vị / legal name and is only filled for an individual. */
  buyerName?: string
  /** Quốc tịch — where the company is REGISTERED. 'Việt Nam' is what reveals the
      province picker; every country keeps a free-text address. */
  country: string
  // Corporate tree. `parent` is the DIRECT parent's `name` — one parent only, any
  // depth (parent → subsidiary → sub-subsidiary). Undefined = a root: either the top
  // of a group, or a company that stands alone. Nothing is inherited down this link:
  // quota, billing, users and deals all stay on the record that owns them.
  parent?: string
  contact: string; owner: string; status: CoStatus
  account: Account; lastPO: string; renewal: string; nextStep: string
  idle: number | null; note: string; revenue: number
  /** the sent quotation has passed its expiry date — the deal does NOT move, it gets flagged */
  quoteLapsed?: boolean
  /** Promoted out of the free Danh bạ, not created from a signed document. Worth
      showing on the record: the identity data started as unverified free data, so
      the legal name and MST deserve a second look before the first invoice. */
  fromPool?: { at: string; by: string }
  jobPosting: boolean; resumeSearch: boolean; jobLeft: number; jobTotal: number; cvLeft: number; cvTotal: number
  hasPage: boolean; jobs: number; domain: string; since: string
  /** Archived — the company is gone (phá sản, giải thể, sáp nhập) or must never be
      worked again (trùng lặp, vi phạm). It leaves every working list and every work
      queue, but the record and its documents are kept. NOT churn, and NOT the same
      as being released back to the free pool: an archived company never returns to
      the pool for another rep to claim. See CRM → “Ending a customer relationship”. */
  archived?: { at: string; by: string; reason: string; note?: string }
}
export const COMPANIES: Company[] = [
  { name: 'Công ty TNHH Đại Dương', shortName: 'Đại Dương', legalName: 'Công ty TNHH Đại Dương', country: 'Việt Nam', tax: '0315xxxxxx', industry: 'Thủy sản', size: '50–200', address: 'Hải Phòng', contact: 'Mr. Nguyễn Văn Toàn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '18/06/2026', renewal: '18/12/2026', nextStep: 'Quarterly review', idle: 34, note: 'Renewal discussion started.', revenue: 55_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 10, cvLeft: 45, cvTotal: 80, hasPage: true, jobs: 3, domain: 'daiduong.vn', since: '12/04/2025' },
  { name: 'Công ty CP Bình Minh', shortName: 'Bình Minh', legalName: 'Công ty Cổ phần Bình Minh', fromPool: { at: '14/07/2026', by: 'Lê Minh Anh (admin)' }, country: 'Việt Nam', tax: '0316xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận 3, HCMC', contact: 'Ms. Lê Thu Hằng · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Schedule product demo', idle: 6, note: 'Quotation sent — demo booked 29/07.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 1, domain: 'binhminh.edu.vn', since: '—' },
  { name: 'Công ty TNHH Sao Mai', shortName: 'Sao Mai', legalName: 'Công ty TNHH Sao Mai', country: 'Việt Nam', tax: '0317xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Mr. Trần Đức Anh · HR Mgr', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 12, note: 'Waiting on their board approval.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'saomai.vn', since: '—' },
  { name: 'Công ty TNHH Vạn Phát', shortName: 'Vạn Phát', legalName: 'Công ty TNHH Vạn Phát', country: 'Việt Nam', tax: '0312xxxxxx', industry: 'Healthcare', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Vũ Thanh Linh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '26/05/2026', renewal: '26/08/2026', nextStep: 'Onboarding check-in', idle: 47, note: 'Kickoff scheduled 30/07.', revenue: 37_800_000, jobPosting: true, resumeSearch: true, jobLeft: 7, jobTotal: 10, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 4, domain: 'vanphat.vn', since: '26/05/2026' },
  { name: 'FPT Software', shortName: 'FPT Software', legalName: 'Công ty TNHH Phần mềm FPT', country: 'Việt Nam', tax: '0101xxxxxx', industry: 'CNTT', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Lý Văn Giang · HR Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '15/06/2026', renewal: '15/09/2026', nextStep: 'Upsell Resume Search', idle: 60, note: 'Discussed CV-search add-on.', revenue: 420_000_000, jobPosting: true, resumeSearch: true, jobLeft: 12, jobTotal: 50, cvLeft: 180, cvTotal: 400, hasPage: true, jobs: 38, domain: 'fpt.com.vn', since: '12/01/2024' },
  { name: 'Công ty CP Hoàng Gia', shortName: 'Hoàng Gia', legalName: 'Công ty Cổ phần Hoàng Gia', country: 'Việt Nam', tax: '0313xxxxxx', industry: 'Bất động sản', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Đỗ Thu Hà · Recruiter', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '03/03/2026', renewal: '03/09/2026', nextStep: 'Confirm CV-unlock usage', idle: 1, note: 'PO signed; awaiting payment.', revenue: 20_000_000, jobPosting: false, resumeSearch: true, jobLeft: 0, jobTotal: 0, cvLeft: 40, cvTotal: 50, hasPage: false, jobs: 0, domain: 'hoanggia.vn', since: '03/03/2026' },
  { name: 'Công ty TNHH Việt Tiến', shortName: '', legalName: 'Công ty TNHH Việt Tiến Logistics', country: 'Việt Nam', tax: '0314xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận Bình Tân, HCMC', contact: 'Mr. Ngô Minh Tú', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '10/07/2025', renewal: 'Lapsed', nextStep: 'Win-back call', idle: 73, note: 'No response to renewal ×3.', revenue: 90_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'viettien.vn', since: '15/08/2024' , archived: { at: '14/07/2026', by: 'Lê Hữu Phong · Sales Lead', reason: 'dissolved', note: 'Toà mở thủ tục phá sản 06/2026 — công nợ 12.000.000 ₫ chuyển Kế toán.' } },
  { name: 'Tiki', shortName: 'Tiki', legalName: 'Công ty TNHH TIKI', country: 'Việt Nam', tax: '0309xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 4, HCMC', contact: 'Ms. Bùi Thu Hằng · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '01/07/2026', renewal: '01/10/2026', nextStep: 'Quarterly review', idle: 86, note: 'QBR booked next week.', revenue: 300_000_000, jobPosting: true, resumeSearch: true, jobLeft: 21, jobTotal: 30, cvLeft: 210, cvTotal: 300, hasPage: true, jobs: 21, domain: 'tiki.vn', since: '10/11/2023' },
  { name: 'VNG Corporation', shortName: 'VNG', legalName: 'Công ty CP VNG', country: 'Việt Nam', tax: '0304xxxxxx', industry: 'CNTT', size: '1000–5000', address: 'Quận 7, HCMC', contact: 'Mr. Đoàn Hải Nam · HR Director', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '20/06/2026', renewal: '20/12/2026', nextStep: 'Renewal upsell deck', idle: 99, note: 'Interested in employer-branding page.', revenue: 510_000_000, jobPosting: true, resumeSearch: true, jobLeft: 30, jobTotal: 40, cvLeft: 180, cvTotal: 400, hasPage: true, jobs: 27, domain: 'vng.com.vn', since: '05/02/2024' },
  { name: 'MoMo', shortName: 'MoMo', legalName: 'Công ty CP Dịch vụ Di động Trực tuyến (M_Service)', country: 'Việt Nam', tax: '0305xxxxxx', industry: 'Fintech', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Trịnh Khánh Vy · TA Lead', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Collect payment on PO', idle: 2, note: 'PO signed; invoice pending.', revenue: 150_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 15, cvLeft: 90, cvTotal: 120, hasPage: true, jobs: 9, domain: 'momo.vn', since: '18/07/2026' },
  { name: 'Thế Giới Di Động', shortName: 'TGDĐ', legalName: 'Công ty CP Đầu tư Thế Giới Di Động', country: 'Việt Nam', tax: '0306xxxxxx', industry: 'Bán lẻ', size: '5000+', address: 'Thủ Đức, HCMC', contact: 'Mr. Cao Văn Đức · HR Manager', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '10/05/2026', renewal: '10/11/2026', nextStep: 'Quarterly review', idle: 112, note: 'Volume hiring for new stores.', revenue: 620_000_000, jobPosting: true, resumeSearch: true, jobLeft: 40, jobTotal: 80, cvLeft: 300, cvTotal: 500, hasPage: true, jobs: 54, domain: 'thegioididong.com', since: '22/09/2023' },
  // Singaporean PARENT, but the buying entity is a VN-registered TNHH with a VN
  // MST — so it is dn-vn. Quốc tịch does not decide the invoice shape.
  { name: 'Shopee Việt Nam', shortName: 'Shopee', legalName: 'Công ty TNHH Shopee', country: 'Singapore', tax: '0307xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Lâm Ngọc Bích · TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Align on package + price', idle: 5, note: 'Comparing us vs a competitor.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'shopee.vn', since: '—' },
  { name: 'Base.vn', buyerType: 'ca-nhan-cccd', idCard: '079123456789', buyerName: 'Phan Anh Tuấn', shortName: 'Base.vn', legalName: 'Công ty CP Base Enterprise', country: 'Việt Nam', tax: '0308xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Phan Anh Tuấn', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book discovery call', idle: 3, note: 'Inbound from website form.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'base.vn', since: '—' },
  { name: 'Công ty CP Đông Á', shortName: '', legalName: 'Công ty Cổ phần Đông Á', country: 'Việt Nam', tax: '0318xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Hà Kiều Trang · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 16, note: 'Quotation sent — gone quiet.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongabank.com.vn', since: '—' , archived: { at: '28/07/2026', by: 'Đỗ Xuân Trường — Sales manager', reason: 'banned', note: 'Đăng tin tuyển dụng sai sự thật, thu phí ứng viên — ngừng phục vụ.' } },
  { name: 'Công ty TNHH Minh Long', buyerType: 'ca-nhan', shortName: 'Minh Long', legalName: 'Công ty TNHH Gốm sứ Minh Long', country: 'Việt Nam', tax: '0319xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Lý Quốc Bảo', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '02/06/2025', renewal: 'Lapsed', nextStep: 'Win-back next quarter', idle: 40, note: 'Budget frozen; revisit in Q4.', revenue: 60_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhlong.com', since: '14/03/2024' },
  { name: 'Công ty CP An Khang', shortName: 'An Khang', legalName: 'Công ty Cổ phần Dược phẩm An Khang', country: 'Việt Nam', tax: '0321xxxxxx', industry: 'Y tế', size: '200–500', address: 'Quận 10, HCMC', contact: 'Ms. Trần Mỹ Duyên · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 4, note: 'Quotation sent for Job Posting Pro.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ankhang.vn', since: '—' },
  { name: 'Công ty TNHH Phú Thịnh', shortName: 'Phú Thịnh', legalName: 'Công ty TNHH Thương mại Phú Thịnh', country: 'Việt Nam', tax: '0322xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Hồ Đăng Khoa · Trưởng phòng HC-NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Waiting on director approval', idle: 11, note: 'Asked for 10% discount; escalated.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuthinh.com.vn', since: '—' },
  { name: 'Công ty CP Thành Đạt', shortName: 'Thành Đạt', legalName: 'Công ty Cổ phần Xây dựng Thành Đạt', country: 'Việt Nam', tax: '0320xxxxxx', industry: 'Xây dựng', size: '200–500', address: 'Quận Hà Đông, Hà Nội', contact: 'Mr. Vũ Đình Khôi · HR', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '12/07/2026', renewal: '12/10/2026', nextStep: 'Onboarding check-in', idle: 53, note: 'First purchase — Job Posting.', revenue: 25_000_000, jobPosting: true, resumeSearch: false, jobLeft: 8, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 3, domain: 'thanhdat.com.vn', since: '12/07/2026' },
  // ── Rot coverage: the rows below deliberately span fresh / amber / red for every
  // open stage, and across all three reps, so the Idle column can be read at a glance
  // in both Sales view and Sales-lead view. Thresholds are IDLE_AMBER / IDLE_RED above.
  { name: 'Công ty CP Nam Long', shortName: 'Nam Long', legalName: 'Công ty Cổ phần Đầu tư Nam Long', country: 'Việt Nam', tax: '0323xxxxxx', industry: 'Bất động sản', size: '500–1000', address: 'Quận 7, HCMC', contact: 'Ms. Đặng Kiều Oanh · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-send quotation options', idle: 9, note: 'Asked us to circle back after Tết planning.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'namlong.vn', since: '—' },
  { name: 'Công ty TNHH Hòa Bình', shortName: 'Hòa Bình', legalName: 'Công ty TNHH Xây dựng Hòa Bình', country: 'Việt Nam', tax: '0324xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Mr. Đinh Trọng Nghĩa · Trưởng phòng NS', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — no reply in 2.5 weeks', idle: 18, note: 'Three follow-ups, no answer. Try the CFO.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hoabinh.com.vn', since: '—' },
  { name: 'Công ty CP Thương mại Vina', shortName: 'Vina Trading', legalName: 'Công ty Cổ phần Thương mại Vina', country: 'Việt Nam', tax: '0325xxxxxx', industry: 'FMCG', size: '500–1000', address: 'Quận Bình Thạnh, HCMC', contact: 'Ms. Hoàng Diệu Linh · HR', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase quotation feedback', idle: 12, note: 'Quotation sent; validity ends in 2 days.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinatrading.vn', since: '—' },
  { name: 'Công ty TNHH An Phú Logistics', shortName: 'An Phú', legalName: 'Công ty TNHH Giao nhận An Phú', country: 'Việt Nam', tax: '0326xxxxxx', industry: 'Logistics', size: '200–500', address: 'Quận 9, HCMC', contact: 'Mr. Lại Văn Bình', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quotation expired — reissue or close', idle: 26, note: 'Went silent after pricing. Decide: reissue or Lost.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'anphulog.vn', since: '—' },
  { name: 'Công ty CP Tài chính Đại Tín', shortName: 'Đại Tín', legalName: 'Công ty Cổ phần Tài chính Đại Tín', country: 'Việt Nam', tax: '0327xxxxxx', industry: 'Tài chính', size: '500–1000', address: 'Quận 1, HCMC', contact: 'Ms. Chu Thanh Vân · HR Director', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask for approval timeline', idle: 30, note: 'Legal review dragging; needs a nudge.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'daitin.com.vn', since: '—' },
  { name: 'Công ty CP Trường Sơn', shortName: 'Trường Sơn', legalName: 'Công ty Cổ phần Tập đoàn Trường Sơn', country: 'Việt Nam', tax: '0328xxxxxx', industry: 'Sản xuất', size: '1000–5000', address: 'Đà Nẵng', contact: 'Mr. Tạ Quang Đạo · Giám đốc NS', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate to sales lead', idle: 52, note: 'Stalled past 45d — approval never came back.', revenue: 0, quoteLapsed: true, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongson.vn', since: '—' },
  // The one BRANCH in the mock — same 10-digit tax root as its parent, only the -001
  // suffix differs. That is what flips the affiliate badge from "Công ty con" to
  // "Chi nhánh"; nothing else about the record behaves differently. It still buys its
  // own package, is invoiced on its own tax code, and has its own sales owner.
  { name: 'CN Trường Sơn — Hà Nội', shortName: 'Trường Sơn HN', legalName: 'Chi nhánh Công ty Cổ phần Tập đoàn Trường Sơn tại Hà Nội', country: 'Việt Nam', tax: '0328xxxxxx-001', industry: 'Sản xuất', size: '200–500', address: 'Long Biên, Hà Nội', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Nguyễn Vân Khánh · HC-NS', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '08/06/2026', renewal: '08/12/2026', nextStep: 'Quarterly review', idle: 21, note: 'Hires separately from HQ — own PO, own invoice.', revenue: 42_000_000, jobPosting: true, resumeSearch: false, jobLeft: 4, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongson.vn', since: '08/06/2025' },
  { name: 'Công ty TNHH Hải Âu Travel', shortName: 'Hải Âu', legalName: 'Công ty TNHH Du lịch Hải Âu', country: 'Việt Nam', tax: '0329xxxxxx', industry: 'Du lịch', size: '50–200', address: 'Quận 1, HCMC', contact: 'Ms. Phùng Mỹ Hạnh · HR', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '19/07/2026', renewal: '19/10/2026', nextStep: 'Chase payment on PO', idle: 10, note: 'PO signed 19/07; payment not received yet.', revenue: 28_000_000, jobPosting: true, resumeSearch: false, jobLeft: 5, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'haiautravel.vn', since: '19/07/2026' },
  { name: 'Công ty CP Tân Hưng Foods', shortName: 'Tân Hưng', legalName: 'Công ty Cổ phần Thực phẩm Tân Hưng', country: 'Việt Nam', tax: '0330xxxxxx', industry: 'Thực phẩm', size: '200–500', address: 'Long An', contact: 'Mr. Ngô Bá Thành · HC-NS', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '05/07/2026', renewal: '05/10/2026', nextStep: 'Payment 24d overdue — escalate', idle: 24, note: 'Accounting has chased twice; no transfer.', revenue: 45_000_000, jobPosting: true, resumeSearch: true, jobLeft: 10, jobTotal: 10, cvLeft: 50, cvTotal: 50, hasPage: false, jobs: 0, domain: 'tanhungfoods.vn', since: '05/07/2026' },
  // More Qualified cover — idle spans fresh / amber / red (8d / 15d) across all three reps
  { name: 'Công ty CP Dệt may Phương Nam', shortName: 'Phương Nam', legalName: 'Công ty Cổ phần Dệt may Phương Nam', country: 'Việt Nam', tax: '0331xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Quận 12, HCMC', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Nguyễn Hồng Nhung · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send package comparison', idle: 4, note: 'Wants Basic Plus vs Basic breakdown.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phuongnamtex.vn', since: '—' },
  { name: 'Công ty TNHH Cơ khí Đông Phong', shortName: 'Đông Phong', legalName: 'Công ty TNHH Cơ khí Đông Phong', country: 'Việt Nam', tax: '0332xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', parent: 'Công ty CP Trường Sơn', contact: 'Mr. Trịnh Văn Lộc · Trưởng phòng NS', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-book the demo they missed', idle: 132, note: 'No-showed the demo; rescheduling.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dongphong.com.vn', since: '—' },
  { name: 'Galaxy Media', shortName: 'Galaxy', legalName: 'Công ty Cổ phần Truyền thông Galaxy', country: 'Việt Nam', tax: '0333xxxxxx', industry: 'Truyền thông', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Đặng Thảo My · TA Lead', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase — 3 calls unanswered', idle: 19, note: 'Went quiet after the discovery call.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'galaxymedia.vn', since: '—' },
  // More Proposal cover — includes a quotation that has already lapsed past its 14-day validity
  { name: 'Công ty CP Dược Hậu Giang', shortName: 'DHG Pharma', legalName: 'Công ty Cổ phần Dược Hậu Giang', country: 'Việt Nam', tax: '0334xxxxxx', industry: 'Y tế', size: '1000–5000', address: 'Cần Thơ', contact: 'Mr. Lâm Thanh Tùng · HR Director', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quotation sent 22/07 — follow up', idle: 5, note: '2 options sent: Basic Plus + Basic.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dhgpharma.com.vn', since: '—' },
  { name: 'Vietjet Air', shortName: 'Vietjet', legalName: 'Công ty Cổ phần Hàng không Vietjet', country: 'Việt Nam', tax: '0335xxxxxx', industry: 'Hàng không', size: '5000+', address: 'Tân Bình, HCMC', contact: 'Ms. Hoàng Bảo Ngân · TA Manager', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quote expires 04/08 — nudge', idle: 13, note: 'Comparing our quote against TopCV.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vietjetair.com', since: '—' },
  /* ── The deep end of the corporate tree ──────────────────────────────────────
     Trường Sơn is deliberately the WORST CASE for the group chart: 6 direct
     children on the root, five levels of nesting, branches (chi nhánh, MST with a
     -00x suffix) mixed in among real subsidiaries at several depths, and one leaf
     owned by a different rep from everything above it. If the chart is legible
     here it is legible anywhere — and the indentation, the "Công ty con" pill and
     the owner column all get tested at depth rather than at depth 1. */
  { name: 'Công ty TNHH Sợi Phương Nam', shortName: 'Sợi Phương Nam', legalName: 'Công ty TNHH Sợi Phương Nam', country: 'Việt Nam', tax: '0351xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Củ Chi, HCMC', parent: 'Công ty CP Dệt may Phương Nam', contact: 'Mr. Lâm Quốc Bảo · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book discovery call', idle: 9, note: 'Upstream of the dyeing plant — hires together with it.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'soiphuongnam.vn', since: '—' },
  { name: 'CN Sợi Phương Nam — Long An', shortName: 'Sợi PN Long An', legalName: 'Chi nhánh Công ty TNHH Sợi Phương Nam tại Long An', country: 'Việt Nam', tax: '0351xxxxxx-001', industry: 'Sản xuất', size: '50–200', address: 'Bến Lức, Long An', parent: 'Công ty TNHH Sợi Phương Nam', contact: 'Ms. Đỗ Kim Yến · HC-NS', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '02/04/2026', renewal: '02/10/2026', nextStep: 'Quarterly review', idle: 30, note: 'Own PO and invoice — hires shift workers locally.', revenue: 18_000_000, jobPosting: true, resumeSearch: false, jobLeft: 2, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 2, domain: 'soiphuongnam.vn', since: '02/04/2025' },
  { name: 'Công ty TNHH Nhuộm Phương Nam', shortName: 'Nhuộm Phương Nam', legalName: 'Công ty TNHH Nhuộm và Hoàn tất Phương Nam', country: 'Việt Nam', tax: '0352xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Quận 12, HCMC', parent: 'Công ty CP Dệt may Phương Nam', contact: 'Mr. Ngô Tấn Phát · Trưởng phòng NS', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 14, note: 'Quotation sent with the parent’s.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'nhuomphuongnam.vn', since: '—' },
  { name: 'CN Kim Long — Hải Phòng', shortName: 'Kim Long HP', legalName: 'Chi nhánh Công ty TNHH Thép Kim Long tại Hải Phòng', country: 'Việt Nam', tax: '0336xxxxxx-001', industry: 'Sản xuất', size: '50–200', address: 'Ngô Quyền, Hải Phòng', parent: 'Công ty TNHH Kim Long Steel', contact: 'Mr. Bùi Thế Vinh · HC-NS', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send package comparison', idle: 41, note: 'Port-side warehouse — seasonal hiring.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kimlongsteel.vn', since: '—' },
  { name: 'Công ty TNHH Kim Long Logistics', shortName: 'Kim Long Logistics', legalName: 'Công ty TNHH Tiếp vận Kim Long', country: 'Việt Nam', tax: '0353xxxxxx', industry: 'Logistics', size: '200–500', address: 'Biên Hòa, Đồng Nai', parent: 'Công ty TNHH Kim Long Steel', contact: 'Ms. Trương Hải Yến · HR Manager', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '11/05/2026', renewal: '11/11/2026', nextStep: 'Collect payment on PO', idle: 6, note: 'Moves the parent’s steel — separate PO.', revenue: 71_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 15, cvLeft: 40, cvTotal: 60, hasPage: true, jobs: 6, domain: 'kimlonglogistics.vn', since: '11/05/2024' },
  { name: 'Công ty TNHH Kim Long Vận tải biển', shortName: 'Kim Long Marine', legalName: 'Công ty TNHH Vận tải biển Kim Long', country: 'Việt Nam', tax: '0354xxxxxx', industry: 'Logistics', size: '50–200', address: 'Vũng Tàu', parent: 'Công ty TNHH Kim Long Logistics', contact: 'Mr. Hà Trọng Nghĩa · HR', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Align on package + price', idle: 18, note: 'Deepest node in the group — five levels below the root.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kimlongmarine.vn', since: '—' },
  { name: 'Công ty CP Bất động sản Trường Sơn', shortName: 'Trường Sơn Land', legalName: 'Công ty Cổ phần Bất động sản Trường Sơn', country: 'Việt Nam', tax: '0355xxxxxx', industry: 'Bất động sản', size: '50–200', address: 'Hải Châu, Đà Nẵng', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Phan Thùy Linh · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book discovery call', idle: 25, note: 'Different industry from the rest of the group.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'truongsonland.vn', since: '—' },
  { name: 'Công ty TNHH Trường Sơn Energy', shortName: 'Trường Sơn Energy', legalName: 'Công ty TNHH Năng lượng Trường Sơn', country: 'Việt Nam', tax: '0356xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Quảng Nam', parent: 'Công ty CP Trường Sơn', contact: 'Mr. Đinh Công Sơn · Giám đốc NS', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '19/03/2026', renewal: '19/09/2026', nextStep: 'Upsell Resume Search', idle: 12, note: 'Solar + hydro — engineer hiring all year.', revenue: 96_000_000, jobPosting: true, resumeSearch: false, jobLeft: 9, jobTotal: 20, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 9, domain: 'truongsonenergy.vn', since: '19/03/2024' },
  { name: 'Công ty CP Trường Sơn Digital', shortName: 'TS Digital', legalName: 'Công ty Cổ phần Trường Sơn Digital', country: 'Việt Nam', tax: '0357xxxxxx', industry: 'CNTT', size: '50–200', address: 'Hải Châu, Đà Nẵng', parent: 'Công ty CP Trường Sơn', contact: 'Ms. Lý Thanh Trúc · TA Lead', owner: 'Phạm Quang Huy', status: 'Lost', account: 'Churn', lastPO: '05/02/2025', renewal: 'Lapsed', nextStep: 'Win-back call', idle: 88, note: 'Churned — in-housed their hiring.', revenue: 24_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tsdigital.vn', since: '05/02/2024' , archived: { at: '02/08/2026', by: 'Lê Hữu Phong · Sales Lead', reason: 'merged', note: 'Sáp nhập vào Công ty CP Trường Sơn — quota còn lại chuyển sang công ty mẹ.' } },
  { name: 'Công ty TNHH Kim Long Steel', shortName: 'Kim Long', legalName: 'Công ty TNHH Thép Kim Long', country: 'Việt Nam', tax: '0336xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Đồng Nai', parent: 'Công ty TNHH Cơ khí Đông Phong', contact: 'Mr. Vương Chí Kiên · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Quote lapsed — re-issue or close', idle: 126, note: 'Quotation expired 10 days ago.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kimlongsteel.vn', since: '—' },
  // More Negotiation cover — long internal-approval cycles, so the reds run deep here
  { name: 'Techcombank', shortName: 'Techcombank', legalName: 'Ngân hàng TMCP Kỹ Thương Việt Nam', country: 'Việt Nam', tax: '0337xxxxxx', industry: 'Tài chính', size: '5000+', address: 'Cầu Giấy, Hà Nội', contact: 'Ms. Phùng Diệu Linh · Head of TA', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Waiting on procurement sign-off', idle: 17, note: 'Legal reviewing our T&C clause 4.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'techcombank.com.vn', since: '—' },
  { name: 'Công ty CP Bán lẻ Thiên Hà', shortName: 'Thiên Hà', legalName: 'Công ty Cổ phần Bán lẻ Thiên Hà', country: 'Việt Nam', tax: '0338xxxxxx', industry: 'Bán lẻ', size: '500–1000', address: 'Đà Nẵng', contact: 'Mr. Đỗ Nhật Trường · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send v3 quote at 12% discount', idle: 26, note: 'Board meets month-end to approve.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'thienharetail.vn', since: '—' },
  { name: 'Công ty TNHH Bảo Sơn Group', shortName: 'Bảo Sơn', legalName: 'Công ty TNHH Tập đoàn Bảo Sơn', country: 'Việt Nam', tax: '0339xxxxxx', industry: 'Bất động sản', size: '1000–5000', address: 'Nam Từ Liêm, Hà Nội', contact: 'Ms. Cao Quỳnh Anh · HR', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — 7 weeks silent', idle: 51, note: 'Sponsor left the company; no new contact.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'baosongroup.com', since: '—' },
  // More PO cover — order confirmed, payment outstanding by varying degrees
  { name: 'Công ty CP Vinh Quang Logistics', shortName: 'Vinh Quang', legalName: 'Công ty Cổ phần Vinh Quang Logistics', country: 'Việt Nam', tax: '0340xxxxxx', industry: 'Logistics', size: '200–500', address: 'Hải Phòng', contact: 'Mr. Bùi Xuân Trường · HC-NS', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '24/07/2026', renewal: '24/10/2026', nextStep: 'Awaiting transfer — due 31/07', idle: 3, note: 'Order confirmed; bank details sent.', revenue: 31_000_000, jobPosting: true, resumeSearch: false, jobLeft: 5, jobTotal: 5, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinhquanglog.vn', since: '24/07/2026' },
  { name: 'Lazada Việt Nam', shortName: 'Lazada', legalName: 'Công ty TNHH Recess (Lazada Việt Nam)', country: 'Việt Nam', tax: '0341xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 1, HCMC', contact: 'Ms. Trương Mỹ Hạnh · TA Lead', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '15/07/2026', renewal: '15/10/2026', nextStep: 'Chase payment — 12d out', idle: 12, note: 'Their finance runs a 30-day cycle.', revenue: 195_000_000, jobPosting: true, resumeSearch: true, jobLeft: 20, jobTotal: 20, cvLeft: 150, cvTotal: 150, hasPage: false, jobs: 0, domain: 'lazada.vn', since: '15/07/2026' },
  { name: 'Công ty CP Xây dựng Hưng Thịnh', shortName: 'Hưng Thịnh', legalName: 'Công ty Cổ phần Xây dựng Hưng Thịnh', country: 'Việt Nam', tax: '0342xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Quận Bình Thạnh, HCMC', contact: 'Mr. Phan Đăng Hải · Giám đốc NS', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '04/07/2026', renewal: '04/10/2026', nextStep: 'Payment 25d overdue — escalate', idle: 25, note: 'Signed PO but no transfer; CFO on leave.', revenue: 88_000_000, jobPosting: true, resumeSearch: true, jobLeft: 15, jobTotal: 15, cvLeft: 80, cvTotal: 80, hasPage: false, jobs: 0, domain: 'hungthinhcorp.vn', since: '04/07/2026' },
  // Lost — closed, so no rot colour at all
  { name: 'Công ty CP Công nghệ Tân Tiến', shortName: 'Tân Tiến', legalName: 'Công ty Cổ phần Công nghệ Tân Tiến', country: 'Việt Nam', tax: '0343xxxxxx', industry: 'CNTT', size: '200–500', address: 'Quận 7, HCMC', contact: 'Mr. Hoàng Việt Dũng · CTO', owner: 'Phạm Quang Huy', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Nurture — revisit Q1 2027', idle: 40, note: 'Lost to competitor on price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tantien.tech', since: '—' },
  { name: 'Công ty TNHH Đức Thành', shortName: 'Đức Thành', legalName: 'Công ty TNHH Thương mại Đức Thành', country: 'Việt Nam', tax: '0344xxxxxx', industry: 'Bán lẻ', size: '50–200', address: 'Quận Gò Vấp, HCMC', contact: 'Ms. Lưu Ngọc Diễm · HR', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'Churn', lastPO: '20/05/2025', renewal: 'Lapsed', nextStep: 'Win-back call in August', idle: 33, note: 'Hiring frozen; no budget this year.', revenue: 18_000_000, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'ducthanh.com.vn', since: '20/05/2024' },
  // Invoice — won and closed
  // The company behind the client's real quotation QUO-009909-07-2026, so that
  // quotation resolves to a CRM record like every other one.
  { name: 'Công ty TNHH AM Software Việt Nam', shortName: 'AM Software', legalName: 'CÔNG TY TNHH AM SOFTWARE VIỆT NAM', country: 'Việt Nam', tax: '0317110315', industry: 'CNTT', size: '50–200', address: '115/2A Lê Trọng Tấn, Phường Sơn Kỳ, Quận Tân Phú, HCMC', contact: 'Mr. Nguyễn Huy · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up on quotation', idle: 9, note: 'Quotation sent 20/07 — 2 options.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'aoimirai.co.jp', since: '—' },
  { name: 'Sacombank', shortName: 'Sacombank', legalName: 'Ngân hàng TMCP Sài Gòn Thương Tín', country: 'Việt Nam', tax: '0345xxxxxx', industry: 'Tài chính', size: '5000+', address: 'Quận 3, HCMC', contact: 'Ms. Nguyễn Lê Vy · Head of Talent', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '08/06/2026', renewal: '08/12/2026', nextStep: 'Quarterly review', idle: 66, note: 'Renewed for a second year.', revenue: 380_000_000, jobPosting: true, resumeSearch: true, jobLeft: 25, jobTotal: 40, cvLeft: 220, cvTotal: 350, hasPage: true, jobs: 19, domain: 'sacombank.com.vn', since: '08/06/2025' },
  { name: 'Công ty TNHH Giáo dục Sunrise', shortName: 'Sunrise Edu', legalName: 'Công ty TNHH Giáo dục Sunrise', country: 'Việt Nam', tax: '0331xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận Tân Phú, HCMC', contact: 'Ms. Lưu Ngọc Hân · HR', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send quotation options', idle: 2, note: 'Discovery call done; keen on Resume Search.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'sunriseedu.vn', since: '—' },
  { name: 'Công ty CP Bảo Việt Care', shortName: 'Bảo Việt Care', legalName: 'Công ty Cổ phần Bảo Việt Care', country: 'Việt Nam', tax: '0332xxxxxx', industry: 'Y tế', size: '500–1000', address: 'Quận 5, HCMC', contact: 'Ms. Trịnh Bích Thảo · TA Lead', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '28/05/2026', renewal: '28/11/2026', nextStep: 'Quarterly review', idle: 79, note: 'Renewal talk starts next month.', revenue: 185_000_000, jobPosting: true, resumeSearch: true, jobLeft: 14, jobTotal: 20, cvLeft: 120, cvTotal: 200, hasPage: true, jobs: 11, domain: 'baovietcare.vn', since: '14/06/2025' },
  // ── Volume rows: enough companies for the pipeline board and the list to feel
  // like a real book of business — every stage populated, owners rotated across
  // the three reps, idle values spanning fresh / amber / red.
  { name: 'Công ty CP Vĩnh Cửu', shortName: 'Vĩnh Cửu', legalName: 'Công ty Cổ phần Vĩnh Cửu', country: 'Việt Nam', tax: '0333xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Bình Dương', contact: 'Ms. Lê Kim Chi · HR', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Follow up in 2 days', idle: 3, note: 'Quotation sent, awaiting review.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'vinhcuu.vn', since: '—' },
  { name: 'Công ty TNHH Bách Khoa Tech', shortName: 'Bách Khoa', legalName: 'Công ty TNHH Bách Khoa Technology', country: 'Việt Nam', tax: '0334xxxxxx', industry: 'CNTT', size: '50–200', address: 'Quận 10, HCMC', contact: 'Mr. Vương Tuấn Kiệt · CTO', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Call the HR manager', idle: 9, note: 'No reply since the quotation.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'bachkhoatech.vn', since: '—' },
  { name: 'Công ty CP Nội thất Sài Gòn', shortName: 'Nội thất SG', legalName: 'Công ty Cổ phần Nội thất Sài Gòn', country: 'Việt Nam', tax: '0335xxxxxx', industry: 'Bán lẻ', size: '200–500', address: 'Quận 12, HCMC', contact: 'Ms. Trần Thảo Vy · HR', owner: 'Trần Quốc Trung', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Reissue or close', idle: 19, note: 'Quotation validity almost up.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'noithatsg.vn', since: '—' },
  { name: 'Công ty TNHH Dệt may Phong Phú', shortName: 'Phong Phú', legalName: 'Công ty TNHH Dệt may Phong Phú', country: 'Việt Nam', tax: '0336xxxxxx', industry: 'Dệt may', size: '1000–5000', address: 'Quận 9, HCMC', contact: 'Mr. Bùi Hữu Lộc · Trưởng phòng NS', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Clarify option B', idle: 5, note: 'Comparing our 3 options.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'phongphu.com.vn', since: '—' },
  { name: 'Công ty CP Dược Nam Hà', shortName: 'Nam Hà', legalName: 'Công ty Cổ phần Dược Nam Hà', country: 'Việt Nam', tax: '0337xxxxxx', industry: 'Y tế', size: '1000–5000', address: 'Cần Thơ', contact: 'Ms. Nguyễn Bảo Châu · HR Director', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Decide: reissue or Lost', idle: 24, note: 'Silent for over 3 weeks.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'dhgpharma.com.vn', since: '—' },
  { name: 'Công ty TNHH Cơ khí Tây Đô', shortName: 'Tây Đô', legalName: 'Công ty TNHH Cơ khí Tây Đô', country: 'Việt Nam', tax: '0338xxxxxx', industry: 'Cơ khí', size: '200–500', address: 'Hải Dương', contact: 'Mr. Hà Trọng Tín', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Book the demo', idle: 2, note: 'Wants a demo next week.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'taydock.vn', since: '—' },
  { name: 'Công ty CP Vận tải Bắc Nam', shortName: 'Bắc Nam', legalName: 'Công ty Cổ phần Vận tải Bắc Nam', country: 'Việt Nam', tax: '0339xxxxxx', industry: 'Logistics', size: '500–1000', address: 'Đà Nẵng', contact: 'Ms. Đỗ Lan Phương · HC-NS', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask about budget cycle', idle: 11, note: 'Budget check in progress.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'bacnamlogistics.vn', since: '—' },
  { name: 'Công ty TNHH Kiến Á', shortName: 'Kiến Á', legalName: 'Công ty TNHH Đầu tư Kiến Á', country: 'Việt Nam', tax: '0340xxxxxx', industry: 'Bất động sản', size: '200–500', address: 'Quận 2, HCMC', contact: 'Mr. Lâm Chí Cường · HR', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate to sales lead', idle: 16, note: 'Went quiet after first call.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'kiena.vn', since: '—' },
  { name: 'Công ty CP Bia Sài Gòn Miền Tây', shortName: 'Bia SG MT', legalName: 'Công ty Cổ phần Bia Sài Gòn Miền Tây', country: 'Việt Nam', tax: '0341xxxxxx', industry: 'Thực phẩm', size: '500–1000', address: 'Cần Thơ', contact: 'Ms. Phạm Ngọc Diệp', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send quotation options', idle: 6, note: 'Interested in Resume Search.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'biasgmt.vn', since: '—' },
  { name: 'Công ty TNHH Thiết bị Y tế Việt', shortName: 'TBYT Việt', legalName: 'Công ty TNHH Thiết bị Y tế Việt', country: 'Việt Nam', tax: '0342xxxxxx', industry: 'Y tế', size: '50–200', address: 'Quận 5, HCMC', contact: 'Mr. Tôn Quang Vinh · HR', owner: 'Nguyễn Thị Lan', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Discovery call', idle: 4, note: 'Referred by an existing client.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tbytviet.vn', since: '—' },
  { name: 'Công ty CP Xi măng Hà Tiên', shortName: 'Hà Tiên', legalName: 'Công ty Cổ phần Xi măng Hà Tiên', country: 'Việt Nam', tax: '0343xxxxxx', industry: 'Xây dựng', size: '1000–5000', address: 'Kiên Giang', contact: 'Ms. Cao Thị Lệ · HR Manager', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send revised quote', idle: 14, note: 'Haggling on the 6-month price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hatien.com.vn', since: '—' },
  /* The real dn-nn case: no Vietnamese entity and no Vietnamese tax code, buying
     employer branding from abroad. `tax` is EMPTY on purpose — that is the whole
     point of the classification, and the invoice prints without an MST line. */
  { name: 'Talently Pte. Ltd.', buyerType: 'dn-nn', shortName: 'Talently', legalName: 'Talently Pte. Ltd.', country: 'Singapore', tax: '', industry: 'CNTT', size: '50–200', address: '80 Robinson Road, Singapore 068898', contact: 'Ms. Rachel Ong · Head of Talent', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send bilingual quotation', idle: 4, note: 'No VN entity — invoice issues without MST.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'talently.sg', since: '' },
  { name: 'Công ty TNHH Phần mềm Rikkei', shortName: 'Rikkei', legalName: 'Công ty TNHH Phần mềm Rikkei', country: 'Nhật Bản / Japan', tax: '0344xxxxxx', industry: 'CNTT', size: '500–1000', address: 'Cầu Giấy, Hà Nội', contact: 'Mr. Đặng Minh Hoàng · TA Lead', owner: 'Trần Quốc Trung', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Ask for approval date', idle: 27, note: 'Waiting on their board.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'rikkeisoft.com', since: '—' },
  { name: 'Công ty CP Thủy sản Minh Phú', shortName: 'Minh Phú', legalName: 'Công ty Cổ phần Thủy sản Minh Phú', country: 'Việt Nam', tax: '0345xxxxxx', industry: 'Thủy sản', size: '1000–5000', address: 'Cà Mau', contact: 'Ms. Võ Kim Ngân · HR', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Escalate — likely dead', idle: 48, note: 'Stalled well past 45d.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'minhphu.com', since: '—' },
  { name: 'Công ty TNHH Bảo hiểm Tín Việt', shortName: 'Tín Việt', legalName: 'Công ty TNHH Bảo hiểm Tín Việt', country: 'Việt Nam', tax: '0346xxxxxx', industry: 'Tài chính', size: '200–500', address: 'Quận 1, HCMC', contact: 'Mr. Nguyễn Đình Phúc', owner: 'Phạm Quang Huy', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Prepare the order', idle: 7, note: 'Agreed terms verbally.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'tinviet.vn', since: '—' },
  { name: 'Công ty CP Du lịch Phương Nam', shortName: 'Phương Nam', legalName: 'Công ty Cổ phần Du lịch Phương Nam', country: 'Việt Nam', tax: '0347xxxxxx', industry: 'Du lịch', size: '50–200', address: 'Nha Trang', contact: 'Ms. Huỳnh Mai Trâm · HR', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '16/07/2026', renewal: '16/10/2026', nextStep: 'Hand to Accounting', idle: 2, note: 'PO signed, invoice next.', revenue: 63_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 30, cvLeft: 54, cvTotal: 100, hasPage: true, jobs: 7, domain: 'phuongnamtravel.vn', since: '16/07/2026' },
  { name: 'Công ty TNHH Giấy Tân Mai', shortName: 'Tân Mai', legalName: 'Công ty TNHH Giấy Tân Mai', country: 'Việt Nam', tax: '0348xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Đồng Nai', contact: 'Mr. Trịnh Bá Hưng · HC-NS', owner: 'Nguyễn Thị Lan', status: 'PO', account: 'Existing', lastPO: '17/07/2026', renewal: '17/10/2026', nextStep: 'Chase payment', idle: 12, note: 'Payment not received yet.', revenue: 80_000_000, jobPosting: true, resumeSearch: false, jobLeft: 7, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 8, domain: 'tanmai.vn', since: '17/07/2026' },
  { name: 'Công ty CP Điện máy Thành Công', shortName: 'Thành Công', legalName: 'Công ty Cổ phần Điện máy Thành Công', country: 'Việt Nam', tax: '0349xxxxxx', industry: 'Bán lẻ', size: '500–1000', address: 'Quận Gò Vấp, HCMC', contact: 'Ms. Lý Thu Trang · HR', owner: 'Phạm Quang Huy', status: 'PO', account: 'Existing', lastPO: '18/07/2026', renewal: '18/10/2026', nextStep: 'Escalate to Accounting lead', idle: 23, note: 'Payment badly overdue.', revenue: 97_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 56, cvTotal: 100, hasPage: true, jobs: 9, domain: 'thanhcongdm.vn', since: '18/07/2026' },
  { name: 'Công ty TNHH Logistics Sao Việt', shortName: 'Sao Việt', legalName: 'Công ty TNHH Logistics Sao Việt', country: 'Việt Nam', tax: '0350xxxxxx', industry: 'Logistics', size: '200–500', address: 'Hải Phòng', contact: 'Mr. Phan Đức Duy', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '19/07/2026', renewal: '19/10/2026', nextStep: 'Kickoff call', idle: 92, note: 'Onboarding in progress.', revenue: 114_000_000, jobPosting: true, resumeSearch: true, jobLeft: 9, jobTotal: 30, cvLeft: 57, cvTotal: 100, hasPage: true, jobs: 10, domain: 'saovietlog.vn', since: '19/07/2026' },
  { name: 'Công ty CP Giáo dục Én Nhỏ', shortName: 'Én Nhỏ', legalName: 'Công ty Cổ phần Giáo dục Én Nhỏ', country: 'Việt Nam', tax: '0351xxxxxx', industry: 'Giáo dục', size: '50–200', address: 'Quận Phú Nhuận, HCMC', contact: 'Ms. Ngô Hải Yến · HR', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '20/07/2026', renewal: '20/10/2026', nextStep: 'Quarterly review', idle: 105, note: 'Using both products actively.', revenue: 131_000_000, jobPosting: true, resumeSearch: false, jobLeft: 4, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 2, domain: 'ennho.edu.vn', since: '21/01/2025' },
  { name: 'Công ty TNHH Sơn Đại Việt', shortName: 'Đại Việt', legalName: 'Công ty TNHH Sơn Đại Việt', country: 'Việt Nam', tax: '0352xxxxxx', industry: 'Sản xuất', size: '200–500', address: 'Long An', contact: 'Mr. Chu Văn Thái', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '21/07/2026', renewal: '21/10/2026', nextStep: 'Check-in — usage is low', idle: 118, note: 'Quiet since activation.', revenue: 148_000_000, jobPosting: true, resumeSearch: true, jobLeft: 5, jobTotal: 20, cvLeft: 59, cvTotal: 100, hasPage: true, jobs: 3, domain: 'sondaiviet.vn', since: '21/07/2026' },
  { name: 'Công ty CP Nông sản Xanh', shortName: 'Nông sản Xanh', legalName: 'Công ty Cổ phần Nông sản Xanh', country: 'Việt Nam', tax: '0353xxxxxx', industry: 'Nông nghiệp', size: '200–500', address: 'Lâm Đồng', contact: 'Ms. Trương Bích Hạnh · HR', owner: 'Trần Quốc Trung', status: 'Invoice', account: 'Existing', lastPO: '22/07/2026', renewal: '22/10/2026', nextStep: 'Prepare renewal quote', idle: 46, note: 'Renewal in 2 months.', revenue: 165_000_000, jobPosting: true, resumeSearch: true, jobLeft: 6, jobTotal: 30, cvLeft: 60, cvTotal: 100, hasPage: true, jobs: 4, domain: 'nongsanxanh.vn', since: '23/03/2025' },
  { name: 'Công ty TNHH Nhựa Bình Phát', shortName: 'Bình Phát', legalName: 'Công ty TNHH Nhựa Bình Phát', country: 'Việt Nam', tax: '0354xxxxxx', industry: 'Sản xuất', size: '500–1000', address: 'Bình Dương', contact: 'Mr. Đoàn Quốc Huy · HR', owner: 'Nguyễn Thị Lan', status: 'Invoice', account: 'Existing', lastPO: '23/07/2026', renewal: '23/10/2026', nextStep: 'Re-engage before renewal', idle: 31, note: 'No contact in a month.', revenue: 182_000_000, jobPosting: true, resumeSearch: false, jobLeft: 7, jobTotal: 10, cvLeft: 0, cvTotal: 0, hasPage: true, jobs: 5, domain: 'binhphat.vn', since: '23/07/2026' },
  { name: 'Công ty CP Bán lẻ Vạn Xuân', shortName: 'Vạn Xuân', legalName: 'Công ty Cổ phần Bán lẻ Vạn Xuân', country: 'Việt Nam', tax: '0355xxxxxx', industry: 'Bán lẻ', size: '1000–5000', address: 'Quận 3, HCMC', contact: 'Ms. Tạ Mỹ Linh · TA Manager', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '24/07/2026', renewal: '24/10/2026', nextStep: 'Upsell Resume Search', idle: 59, note: 'Repeat customer, 3rd order.', revenue: 199_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 62, cvTotal: 100, hasPage: true, jobs: 6, domain: 'vanxuan.vn', since: '25/05/2025' },
  { name: 'Công ty TNHH Kỹ thuật Nam Việt', shortName: 'Nam Việt', legalName: 'Công ty TNHH Kỹ thuật Nam Việt', country: 'Việt Nam', tax: '0356xxxxxx', industry: 'Cơ khí', size: '200–500', address: 'Quận Tân Bình, HCMC', contact: 'Mr. Lưu Anh Tú', owner: 'Trần Quốc Trung', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Re-engage next quarter', idle: 35, note: 'Chose a competitor on price.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'namvieteng.vn', since: '—' },
  { name: 'Công ty CP Chứng khoán Đại Nam', shortName: 'CK Đại Nam', legalName: 'Công ty Cổ phần Chứng khoán Đại Nam', country: 'Việt Nam', tax: '0357xxxxxx', industry: 'Tài chính', size: '200–500', address: 'Quận 1, HCMC', contact: 'Ms. Hồ Diễm Quỳnh · HR', owner: 'Nguyễn Thị Lan', status: 'Lost', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Nurture — revisit Q1', idle: 44, note: 'Budget frozen for the year.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'cknam.vn', since: '—' },
  { name: 'Công ty TNHH Mỹ phẩm Hương Sen', shortName: 'Hương Sen', legalName: 'Công ty TNHH Mỹ phẩm Hương Sen', country: 'Việt Nam', tax: '0358xxxxxx', industry: 'FMCG', size: '50–200', address: 'Quận 7, HCMC', contact: 'Ms. Bạch Tuyết Nhi', owner: 'Phạm Quang Huy', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Send discount options', idle: null, note: 'Inbound sign-up — nobody has called yet.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'huongsen.vn', since: '—' },
  { name: 'Công ty CP Thép Việt Đức', shortName: 'Thép Việt Đức', legalName: 'Công ty Cổ phần Thép Việt Đức', country: 'Việt Nam', tax: '0359xxxxxx', industry: 'Sản xuất', size: '1000–5000', address: 'Vĩnh Phúc', contact: 'Mr. Kiều Mạnh Hà · Trưởng phòng NS', owner: 'Trần Quốc Trung', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Retry after 01/08', idle: 9, note: 'HR manager on leave.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'thepvietduc.vn', since: '—' },
  { name: 'Công ty TNHH Cà phê Ban Mê', shortName: 'Ban Mê', legalName: 'Công ty TNHH Cà phê Ban Mê', country: 'Việt Nam', tax: '0360xxxxxx', industry: 'Thực phẩm', size: '200–500', address: 'Đắk Lắk', contact: 'Ms. Phùng Thanh Thúy · HR', owner: 'Nguyễn Thị Lan', status: 'Negotiation', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Chase legal', idle: 22, note: 'Legal reviewing our T&C.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'banmecoffee.vn', since: '—' },
  { name: 'Công ty CP Công nghệ TekOne', shortName: 'TekOne', legalName: 'Công ty Cổ phần Công nghệ TekOne', country: 'Việt Nam', tax: '0361xxxxxx', industry: 'CNTT', size: '50–200', address: 'Quận 4, HCMC', contact: 'Mr. Trần Gia Bảo · CEO', owner: 'Phạm Quang Huy', status: 'Invoice', account: 'Existing', lastPO: '04/07/2026', renewal: '04/10/2026', nextStep: 'Ask for a testimonial', idle: null, note: 'Inbound sign-up — nobody has called yet.', revenue: 101_000_000, jobPosting: true, resumeSearch: true, jobLeft: 8, jobTotal: 20, cvLeft: 68, cvTotal: 100, hasPage: true, jobs: 3, domain: 'tekone.vn', since: '06/02/2025' },
  { name: 'Công ty TNHH An Toàn Lao Động Việt', shortName: 'ATLĐ Việt', legalName: 'Công ty TNHH An Toàn Lao Động Việt', country: 'Việt Nam', tax: '0362xxxxxx', industry: 'Dịch vụ', size: '50–200', address: 'Quận Bình Tân, HCMC', contact: 'Ms. Dương Kiều My', owner: 'Trần Quốc Trung', status: 'PO', account: 'Existing', lastPO: '05/07/2026', renewal: '05/10/2026', nextStep: 'Collect PO number', idle: 6, note: 'Awaiting their PO number.', revenue: 118_000_000, jobPosting: true, resumeSearch: true, jobLeft: 9, jobTotal: 30, cvLeft: 69, cvTotal: 100, hasPage: true, jobs: 4, domain: 'atldviet.vn', since: '05/07/2026' },
  { name: 'Công ty CP Khách sạn Biển Đông', shortName: 'Biển Đông', legalName: 'Công ty Cổ phần Khách sạn Biển Đông', country: 'Việt Nam', tax: '0363xxxxxx', industry: 'Du lịch', size: '500–1000', address: 'Đà Nẵng', contact: 'Mr. Nguyễn Hải Sơn · HR Manager', owner: 'Nguyễn Thị Lan', status: 'Proposal', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Confirm option 2', idle: 13, note: 'Second option preferred.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'biendonghotel.vn', since: '—' },
  { name: 'Công ty TNHH Thương mại Hoàng Long', shortName: 'Hoàng Long', legalName: 'Công ty TNHH Thương mại Hoàng Long', country: 'Việt Nam', tax: '0364xxxxxx', industry: 'Bán lẻ', size: '200–500', address: 'Quận 6, HCMC', contact: 'Ms. Đinh Thu Hà', owner: 'Phạm Quang Huy', status: 'Qualified', account: 'New', lastPO: '—', renewal: '—', nextStep: 'Qualify need & budget', idle: 3, note: 'Inbound from the website.', revenue: 0, jobPosting: false, resumeSearch: false, jobLeft: 0, jobTotal: 0, cvLeft: 0, cvTotal: 0, hasPage: false, jobs: 0, domain: 'hoanglongtm.vn', since: '—' },
]

/* Colour carries meaning, so customer status must not borrow RED. On a company row
   red already means "act now" three times over — idle past its red threshold, a
   lapsed quotation, never contacted. Churn is none of those: it is a factual
   lifecycle state (no new order in 12 months) and commercially it is an
   OPPORTUNITY — a churned customer is the warmest win-back lead we have. Amber
   reads as attention-not-alarm, which is exactly the register, and it leaves red
   free for the markers that genuinely demand action today. */
export const AC_STATUS: Record<Account, { tone: StatusTone; label: string }> = {
  New: { tone: 'draft', label: 'New' },
  Existing: { tone: 'active', label: 'Existing' },
  Churn: { tone: 'pending', label: 'Churn' },
}
/* Onboarding is a CADENCE, not a status — the first 90 days after the first
   invoice, when a fresh customer needs a tighter touch. The real system reads
   firstInvoicedAt; the mock uses `since`, which is the same date. */
const ONBOARDING_DAYS = 90
const TODAY = new Date(2026, 6, 29) // 29/07/2026 — the mock's "now"
const daysSince = (dmy: string) => {
  const [d, m, y] = dmy.split('/').map(Number)
  if (!d || !m || !y) return Infinity // "—" — never activated
  return Math.round((TODAY.getTime() - new Date(y, m - 1, d).getTime()) / 86_400_000)
}
// A company shows a pipeline step only while a deal is open (before it closes at
// Invoice, or dies at Lost). Settled customers show "—".
/* On the board or not. Three ways off it, and only one of them is a decision:
   closed-won (Invoice), closed-lost (Lost, by a human with a reason), and the
   quotation EXPIRING. The quotation is the reason the card exists, so when it
   lapses the card goes with it — but that is not Lost: no reason, no decision,
   customer status untouched, and a new quotation puts them straight back. */
export const inPipeline = (c: Company) => c.status !== 'Invoice' && c.status !== 'Lost' && !c.quoteLapsed
/* ── Create-PO gate ───────────────────────────────────────────────────────────
   A sales order / PO is only ever created from ONE ACCEPTED quotation option —
   never from scratch, and never from a quotation that has lapsed (T&C clause 2:
   the discounts and gifts were only committed until the expiry date). So the
   button is always visible on a pre-PO company, but it explains itself when it
   cannot fire. Demo mapping by stage: Qualified/Proposal = quote out, not yet
   accepted · Proposal + idle > 14d = quote lapsed · Negotiation = an option has
   been accepted, so the PO can be raised. */
export function poGate(c: Company): { ok: boolean; reason?: string; quote: string } {
  const quote = `QUO-0099${(c.tax.replace(/\D/g, '').slice(0, 2) || '10')}-07-2026`
  if (c.status === 'PO' || c.status === 'Invoice') return { ok: false, reason: 'An order already exists for this deal.', quote }
  if (c.status === 'Lost') return { ok: false, reason: 'The deal is closed-lost. Re-open it or start a new deal first.', quote }
  if (c.status === 'Qualified') return { ok: false, reason: 'No quotation option has been accepted yet.', quote }
  if (c.status === 'Proposal') {
    return (c.idle ?? 0) > 14
      ? { ok: false, reason: 'The quotation has lapsed past its validity — extend it or re-issue as v2 before raising an order.', quote }
      : { ok: false, reason: 'The quotation is sent but no option has been accepted yet.', quote }
  }
  return { ok: true, quote } // Negotiation — an option is agreed, raise the order
}

/* ── Idle ──────────────────────────────────────────────────────────────────
   Idle = days since the last human CONTACT with the client. Reset only by a real
   touch (logged chat/call/meeting, or a document sent/confirmed); system events
   (auto-reminders, provisioning, page publishes) must NOT reset it.

   ONE rule everywhere — the same definition, thresholds table and display on the
   Companies list and the Pipeline board. The rule is "idle vs the EXPECTED CONTACT
   CADENCE for this relationship type", i.e. one formula reading a settings table,
   never per-stage logic sprinkled through the code. A company with an open deal
   always uses the openDeal row: the live opportunity sets the pace. */
export type Cadence = 'openDeal' | 'onboarding' | 'existing' | 'nurture' | 'churn'
export const IDLE_RULE: Record<Cadence, { amber: number; red: number; cadence: string }> = {
  openDeal:    { amber: 7,  red: 14, cadence: 'weekly' },
  onboarding:  { amber: 14, red: 30, cadence: 'fortnightly' }, // Existing, first 90 days after the first invoice
  existing:    { amber: 30, red: 60, cadence: 'monthly' },
  nurture:     { amber: 30, red: 60, cadence: 'monthly' },     // New (never bought), no open deal
  churn:       { amber: 60, red: 90, cadence: 'quarterly' },   // win-back
}
/* Sort options for the Companies list. The default is "chưa liên hệ lâu nhất" —
   with the Needs-attention filter gone, ordering by neglect is what puts the rows a
   rep must act on at the top, without spending a colour channel on every row.
   Never-contacted (idle null) sorts first: it is the highest-priority follow-up. */
export type CoSort = 'contact-old' | 'contact-new' | 'name' | 'revenue'
const idleRank = (c: Company) => (c.idle === null ? Infinity : c.idle)
export const CO_SORTS: Record<CoSort, { label: string; cmp: (a: Company, b: Company) => number }> = {
  'contact-old': { label: 'Chưa liên hệ lâu nhất', cmp: (a, b) => idleRank(b) - idleRank(a) },
  'contact-new': { label: 'Liên hệ gần đây nhất', cmp: (a, b) => idleRank(a) - idleRank(b) },
  name: { label: 'Tên công ty A → Z', cmp: (a, b) => coLabel(a).localeCompare(coLabel(b), 'vi') },
  revenue: { label: 'Doanh thu cao nhất', cmp: (a, b) => b.revenue - a.revenue },
}

export function cadenceOf(c: Company): Cadence {
  if (inPipeline(c)) return 'openDeal'
  if (c.account === 'Churn') return 'churn'
  if (c.account === 'New') return 'nurture'
  return daysSince(c.since) <= ONBOARDING_DAYS ? 'onboarding' : 'existing'
}
type Rot = 'fresh' | 'amber' | 'red'
export function idleOf(days: number, k: Cadence = 'openDeal'): Rot {
  const t = IDLE_RULE[k]
  return days >= t.red ? 'red' : days >= t.amber ? 'amber' : 'fresh'
}
/** ONE display rule, used on both the Companies list and the Pipeline board:
    under a month reads in days ("12d"); a month or more rolls up to months +
    remainder ("1m 18d", "3m 2d") so a long gap stays readable instead of "92d".
    Still used wherever a DURATION is what is being said ("2m 4d ago" on the
    activity trail); the Last-contact column shows the date itself instead. */
export function fmtIdle(days: number): string {
  if (days < 30) return `${days}d`
  const m = Math.floor(days / 30)
  const d = days % 30
  return d ? `${m}m ${d}d` : `${m}m`
}
export const ROT_TEXT: Record<Rot, string> = {
  fresh: 'text-muted',
  amber: 'text-amber-600 font-medium',
  red: 'text-rose-600 font-medium',
}
export const ROT_DOT: Record<Rot, string> = { fresh: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-rose-500' }
export const CO_STATUS: Record<CoStatus, { tone: StatusTone; label: string }> = {
  Qualified: { tone: 'draft', label: 'Qualified' },
  Proposal: { tone: 'neutral', label: 'Proposal' },
  Negotiation: { tone: 'pending', label: 'Negotiation' },
  PO: { tone: 'schedule', label: 'PO' },
  Invoice: { tone: 'active', label: 'Invoice' },
  Lost: { tone: 'rejected', label: 'Lost' },
}
// Board order follows the document flow: the quotation goes out (Proposal), the HR
// manager engages with it (Qualified), then internal approval (Negotiation) → PO → Invoice.
export const CO_ORDER: CoStatus[] = ['Proposal', 'Qualified', 'Negotiation', 'PO', 'Invoice', 'Lost']
/* WHO moves a card out of each stage, and by doing what. Surfaced as the column
   tooltip so the rule lives where the work happens instead of only in the spec — a
   rep should not have to open the requirement to learn that PO waits on Accounting.
   Mirrors the "Rule" column of "Pipeline stages" in the CRM requirement; keep the
   two in step. */
export const STAGE_NEXT: Record<CoStatus, string> = {
  Proposal: 'SALES chases the customer for a reply. The card landed here automatically the moment the quotation was marked Sent — it is never dragged in.',
  Qualified: 'SALES agrees the option and the price, then moves the card on. This stage can be skipped entirely — Proposal → Negotiation is legal.',
  Negotiation: 'SALES creates the Sales order from the option the customer accepted. Revising to v2 / v3 happens here without leaving the stage.',
  PO: 'KẾ TOÁN ONLY confirms the payment against the bank statement. Won — but nothing is provisioned yet.',
  Invoice: 'Closed. KẾ TOÁN issued the VAT e-invoice; the system then flipped the customer to Existing, started the 12-month clock and released provisioning.',
  Lost: 'SALES set this by hand with a reason — the system never auto-closes a deal. Re-open by moving it back a stage; a win-back is a NEW deal.',
}
// A company is a customer once a PO is issued (PO or Invoice stage).
export const isCustomer = (c: Company) => c.status === 'PO' || c.status === 'Invoice'
const CO_VALUE: Record<string, number> = {
  'Công ty TNHH Đại Dương': 42_000_000, 'Công ty CP Bình Minh': 68_000_000, 'Công ty TNHH Sao Mai': 155_000_000,
  'Công ty TNHH Vạn Phát': 37_800_000, 'FPT Software': 420_000_000, 'Công ty CP Hoàng Gia': 20_000_000,
  'Công ty TNHH Việt Tiến': 90_000_000, 'Tiki': 300_000_000,
  'VNG Corporation': 510_000_000, 'MoMo': 150_000_000, 'Thế Giới Di Động': 620_000_000,
  'Shopee Việt Nam': 245_000_000, 'Base.vn': 18_000_000, 'Công ty CP Đông Á': 72_000_000,
  'Công ty TNHH Minh Long': 60_000_000, 'Công ty CP Thành Đạt': 25_000_000,
  'Công ty CP An Khang': 95_000_000, 'Công ty TNHH Phú Thịnh': 33_500_000,
  'Công ty CP Nam Long': 128_000_000, 'Công ty TNHH Hòa Bình': 210_000_000,
  'Công ty CP Thương mại Vina': 76_000_000, 'Công ty TNHH An Phú Logistics': 54_000_000,
  'Công ty CP Tài chính Đại Tín': 165_000_000, 'Công ty CP Trường Sơn': 231_000_000,
  'Công ty TNHH Hải Âu Travel': 28_000_000, 'Công ty CP Tân Hưng Foods': 45_000_000,
  'Công ty TNHH Giáo dục Sunrise': 22_000_000, 'Công ty CP Bảo Việt Care': 185_000_000,
  'Công ty CP Dệt may Phương Nam': 64_000_000, 'Công ty TNHH Cơ khí Đông Phong': 41_000_000,
  'Galaxy Media': 87_000_000, 'Công ty CP Dược Hậu Giang': 240_000_000,
  'Vietjet Air': 465_000_000, 'Công ty TNHH Kim Long Steel': 58_000_000,
  'Techcombank': 540_000_000, 'Công ty CP Bán lẻ Thiên Hà': 112_000_000,
  'Công ty TNHH Bảo Sơn Group': 198_000_000, 'Công ty CP Vinh Quang Logistics': 31_000_000,
  'Lazada Việt Nam': 195_000_000, 'Công ty CP Xây dựng Hưng Thịnh': 88_000_000,
  'Công ty CP Công nghệ Tân Tiến': 74_000_000, 'Công ty TNHH Đức Thành': 18_000_000,
  'Công ty TNHH AM Software Việt Nam': 6_588_000, 'Sacombank': 380_000_000,
}
/* Deal value. Rows without an explicit entry above get a stable pseudo-value
   derived from the name, so a demo company can never render as 0 ₫ — the map only
   needs maintaining for the few figures we quote in conversation. */
export const coValue = (c: Company) => {
  const explicit = CO_VALUE[c.name]
  if (explicit) return explicit
  let h = 0
  for (const ch of c.name) h = (h * 31 + ch.codePointAt(0)!) % 100000
  return (18 + (h % 43)) * 1_000_000 // 18M – 60M ₫, stable per name
}
/** Display label: prefer the short/brand name, fall back to the legal name. */
export const coLabel = (c: Company) => c.shortName?.trim() || c.legalName
/* Demo stand-in for the database primary key. In the real build this is the
   company row's bigint id; here it is derived from the name so every render (and
   every screenshot) shows the same company ID. See lib/companyId.ts. */
export const coKey = (c: Company) => {
  let h = 0
  for (const ch of c.name) h = (h * 131 + ch.codePointAt(0)!) % 900000
  return h + 1000
}
/** City / province — the last segment of the address (the form captures both). */
/** A Vietnamese-registered company — the only case that gets the province picker. */
export const isVNCompany = (c: Company) => /^vi[eệ]t nam$|^vietnam$/i.test(c.country.trim())
export const coCity = (c: Company) => c.address.split(',').pop()!.trim()
/** Demo-only: a stable lead source per company, so the field is exercised without
    authoring one on every row. Real build stores this from the New-company form. */
export const LEAD_SOURCES = ['Website sign-up', 'Inbound call', 'Referral', 'Event / job fair', 'Outbound', 'Partner']
/* Latest revenue = the value of the MOST RECENT paid order, where Total revenue is
   lifetime. A first-time customer's latest equals their total; a repeat customer's
   is the last order only — the pair together shows whether an account is growing or
   coasting. Demo-only derivation; the real build reads the last paid invoice. */
export const coLastRevenue = (c: Company) => {
  if (!c.revenue) return 0
  if (c.account === 'New') return c.revenue // first order = their whole history
  let h = 0
  for (const ch of c.name) h = (h * 29 + ch.codePointAt(0)!) % 7919
  const share = 0.2 + (h % 60) / 100 // 20% – 79% of lifetime, stable per company
  return Math.round((c.revenue * share) / 1_000_000) * 1_000_000
}
export const coLeadSource = (c: Company) => {
  let h = 0
  for (const ch of c.name) h = (h * 17 + ch.codePointAt(0)!) % 9973
  return LEAD_SOURCES[h % LEAD_SOURCES.length]
}

/** Company ID in the same format the Create-job picker uses: "Vạn Phát · CO-0312". */
export const coId = (c: Company) => 'CO-' + (c.tax.replace(/\D/g, '').slice(0, 4) || '0000').padEnd(4, '0')
