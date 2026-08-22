/*
 * Manual-service entitlements — services sold by the unit and delivered by hand,
 * so each delivery is logged against the units bought.
 */
/* ── Manual-service usage ─────────────────────────────────────────────────────
   A Manual service has no automatic meter. Nothing on the platform can observe a
   fanpage post going up or an email blast going out, so "how many of the 4 posts
   has this customer used?" is only answerable if the person who did the work says
   so. This is that record.

   ONE LOG ENTRY = ONE UNIT CONSUMED. Remaining is derived (total − entries), never
   stored and never edited by hand — a typed remaining count is the thing that goes
   out of step with what was actually delivered.

   Proof is required, not decorative: the link is what a customer asks for when they
   query the invoice ("show me the post"), and without it the entry is one person's
   word that a unit was spent. */
type ServiceDelivery = { id: string; date: string; link: string; image: string | null; content: string; by: string }
export type ServiceEntitlement = { sku: string; name: string; unit: string; total: number; validUntil: string; entries: ServiceDelivery[] }

export const SERVICE_USAGE: Record<string, ServiceEntitlement[]> = {
  'Công ty TNHH Vạn Phát': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 4, validUntil: '30/11/2026', entries: [
      { id: 'SD-001', date: '02/08/2026', link: 'https://facebook.com/topdev.vn/posts/1029384', image: 'vanphat-fb-01.jpg', content: 'Tuyển 5 Backend Engineer — Vạn Phát. Đăng kèm ảnh văn phòng, CTA về trang công ty.', by: 'Nguyễn Thị Lan' },
      { id: 'SD-002', date: '09/08/2026', link: 'https://facebook.com/topdev.vn/posts/1031002', image: 'vanphat-fb-02.jpg', content: 'Nhắc lại tin tuyển dụng, nhấn phúc lợi 13th-month salary.', by: 'Phạm Quang Huy' },
    ] },
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 1, validUntil: '30/11/2026', entries: [] },
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 2, validUntil: '30/11/2026', entries: [
      { id: 'SD-003', date: '05/08/2026', link: 'https://mail.topdev.vn/campaign/9921', image: null, content: 'Big Banner trong Job Alert tuần 32 — 650k ứng viên.', by: 'Nguyễn Thị Lan' },
    ] },
  ],
  'FPT Software': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 2, validUntil: '15/09/2026', entries: [
      { id: 'SD-010', date: '20/06/2026', link: 'https://facebook.com/topdev.vn/posts/998211', image: null, content: 'Employer branding — FPT Software culture post.', by: 'Phạm Quang Huy' },
      { id: 'SD-011', date: '05/07/2026', link: 'https://facebook.com/topdev.vn/posts/1004556', image: 'fpt-fb-02.jpg', content: 'Tuyển Java/Go, kèm banner sự kiện tech talk.', by: 'Phạm Quang Huy' },
    ] },
    { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', unit: 'bài test', total: 5, validUntil: '15/09/2026', entries: [
      { id: 'SD-012', date: '01/07/2026', link: 'https://hackerrank.com/x/tests/44120', image: null, content: 'Bộ test Java backend, 5 ứng viên vòng 2.', by: 'Trần Quốc Trung' },
    ] },
  ],
  // The case that matters: paid, partly used, then the validity ran out. Two sends
  // were never delivered and can no longer be — that has to be visible, not silent.
  'Tiki': [
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 3, validUntil: '30/06/2026', entries: [
      { id: 'SD-020', date: '10/05/2026', link: 'https://mail.topdev.vn/campaign/8812', image: null, content: 'Chiến dịch tuyển Data Engineer.', by: 'Phạm Quang Huy' },
    ] },
  ],
  'VNG Corporation': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 3, validUntil: '20/12/2026', entries: [] },
    { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', unit: 'mốc', total: 2, validUntil: '20/12/2026', entries: [
      { id: 'SD-030', date: '01/07/2026', link: 'https://crm.saramin.vn/notes/5521', image: null, content: 'Mốc ngày 11 — review chất lượng CV, khách hài lòng.', by: 'Nguyễn Thị Lan' },
      { id: 'SD-031', date: '21/07/2026', link: 'https://crm.saramin.vn/notes/5588', image: null, content: 'Mốc ngày 31 — đề xuất nâng lên Top Job.', by: 'Nguyễn Thị Lan' },
    ] },
  ],
  'MoMo': [
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 1, validUntil: '18/10/2026', entries: [] },
  ],
  'Thế Giới Di Động': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 6, validUntil: '10/11/2026', entries: [
      { id: 'SD-040', date: '15/06/2026', link: 'https://facebook.com/topdev.vn/posts/995001', image: 'tgdd-fb-01.jpg', content: 'Tuyển hàng loạt nhân viên cửa hàng mới.', by: 'Trần Quốc Trung' },
      { id: 'SD-041', date: '01/07/2026', link: 'https://facebook.com/topdev.vn/posts/1002110', image: 'tgdd-fb-02.jpg', content: 'Đợt 2 — mở rộng khu vực miền Trung.', by: 'Trần Quốc Trung' },
      { id: 'SD-042', date: '20/07/2026', link: 'https://facebook.com/topdev.vn/posts/1010455', image: null, content: 'Đợt 3 — nhấn lộ trình thăng tiến.', by: 'Trần Quốc Trung' },
    ] },
  ],
  // Churned: validity lapsed with everything unused. The clearest "we owe nothing
  // any more, but the customer got nothing either" row.
  'Công ty TNHH Việt Tiến': [
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 2, validUntil: '10/01/2026', entries: [] },
  ],

  /* More companies, deliberately spread across all four derived states and all five
     SKUs — the page is read by scanning for what is owed, so the demo has to show a
     fresh row, a used-up row, an EXPIRED-with-units-left row (the one that must never
     be quiet) and a cleanly closed row side by side. */
  'Công ty CP Hoàng Gia': [
    // Nothing delivered and validity already gone: the customer paid for two posts
    // and received none. The loudest row on the page.
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 2, validUntil: '30/06/2026', entries: [] },
    { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', unit: 'lượt', total: 3, validUntil: '20/12/2026', entries: [
      { id: 'SD-030', date: '12/08/2026', link: '', image: null, content: 'Gọi review 2 tuần đầu — CV chưa đạt kỳ vọng, đề xuất đổi tiêu đề tin.', by: 'Trần Quốc Trung' },
    ] },
  ],
  'Shopee Việt Nam': [
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 3, validUntil: '31/10/2026', entries: [
      { id: 'SD-031', date: '28/07/2026', link: 'https://mail.topdev.vn/campaign/10032', image: 'shopee-email-01.jpg', content: 'Blast 120k dev — tuyển Backend & Data. Open rate 24%.', by: 'Phạm Quang Huy' },
    ] },
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 2, validUntil: '31/10/2026', entries: [] },
  ],
  'Công ty TNHH Minh Long': [
    // Everything delivered, validity passed — a clean close, nothing owed.
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 1, validUntil: '10/01/2026', entries: [
      { id: 'SD-032', date: '05/01/2026', link: 'https://facebook.com/topdev.vn/posts/981004', image: 'minhlong-fb.jpg', content: 'Tuyển thợ gốm & QC — đăng kèm ảnh xưởng.', by: 'Nguyễn Thị Lan' },
    ] },
  ],
  'Công ty CP Trường Sơn': [
    { sku: 'SVC-HACKERRANK', name: 'Đánh giá ứng viên HackerRank', unit: 'bài test', total: 10, validUntil: '30/11/2026', entries: [
      { id: 'SD-033', date: '01/08/2026', link: 'https://hackerrank.com/x/tests/88120', image: null, content: 'Bộ test Java cho 4 ứng viên vòng 1.', by: 'Nguyễn Thị Lan' },
      { id: 'SD-034', date: '08/08/2026', link: 'https://hackerrank.com/x/tests/88455', image: null, content: 'Bộ test SQL cho 3 ứng viên Data.', by: 'Nguyễn Thị Lan' },
    ] },
    { sku: 'SVC-CSKH', name: 'CSKH theo dõi tình hình tuyển dụng', unit: 'lượt', total: 2, validUntil: '30/11/2026', entries: [] },
  ],
  'Base.vn': [
    // Small customer, one service, fully used inside validity.
    { sku: 'SVC-EMAIL-DEV', name: 'Email Marketing đến Database Developer', unit: 'lượt gửi', total: 1, validUntil: '30/11/2026', entries: [
      { id: 'SD-035', date: '11/08/2026', link: 'https://mail.topdev.vn/campaign/10101', image: null, content: 'Blast 40k dev SaaS — tuyển Product Engineer.', by: 'Trần Quốc Trung' },
    ] },
  ],
  'Công ty CP An Khang': [
    { sku: 'SVC-JOBALERT', name: 'Big Banner trong Email Job Alert', unit: 'lượt gửi', total: 4, validUntil: '18/10/2026', entries: [
      { id: 'SD-036', date: '04/08/2026', link: 'https://mail.topdev.vn/campaign/10044', image: 'ankhang-banner.jpg', content: 'Job Alert tuần 32 — ngành Y tế / Dược.', by: 'Nguyễn Thị Lan' },
    ] },
    { sku: 'SVC-FB-TOPDEV', name: 'Bài đăng Facebook (fanpage TopDev)', unit: 'bài đăng', total: 3, validUntil: '18/10/2026', entries: [] },
  ],
}
