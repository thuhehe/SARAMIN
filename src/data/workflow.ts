/*
 * CẨM NANG THAO TÁC — the operating handbook for the real Admin console.
 *
 * WHAT THIS IS NOT. It is not the requirement (src/data/build/*) which says why a
 * module behaves as it does, and it is not the per-module user guide
 * (src/data/guides/*) which walks one module's screens. This is the CROSS-MODULE
 * handbook a Sales or ops person reads once before touching the console: what the
 * words mean, which order things happen in, and the two or three rules that cause
 * every support call when they are not known.
 *
 * ONE DOCUMENT, TWO AUDIENCES. Blocks marked `dev: true` are hidden in the Sales
 * view and shown in the Developer view. Writing two documents guarantees they
 * disagree within a month — the operator's version silently loses a rule the
 * developer's version gained — so the audience is a filter over one source, never
 * a second copy.
 *
 * Content is written from the BUILD repos (SARAMIN_BUILD/saramin-vn-admin: docs/
 * business-logic.md, docs/qa/tester-guide/, src/configs/navigation.config.tsx),
 * not from this site's spec. Paths below are the ones the console actually serves.
 */
import type { SpecTable } from './types'

/** The deployed admin this handbook describes. Every deep link is built from it. */
export const ADMIN_BASE = 'https://dev.admin-svn.topdev.asia'
export const adminUrl = (path: string) => `${ADMIN_BASE}${path}`

export type WfBlock =
  /** a paragraph */
  | { kind: 'p'; text: string; dev?: boolean }
  /** numbered actions — what to DO, in order */
  | { kind: 'steps'; heading?: string; items: string[]; dev?: boolean }
  /** a value grid — the default for anything with more than three cases */
  | { kind: 'table'; heading?: string; note?: string; table: SpecTable; dev?: boolean }
  /** the one rule of the section that, unknown, produces a wrong outcome */
  | { kind: 'warn'; text: string; dev?: boolean }
  /** deep links into the live console */
  | { kind: 'links'; items: { label: string; path: string }[]; dev?: boolean }

export interface WfSection {
  /** anchor id — stable once published */
  id: string
  /** sidebar group heading */
  group: string
  /** short badge in the sidebar, as in the client's layout */
  code: string
  /** sidebar label */
  label: string
  title: string
  /** where in the console this lives */
  where?: string
  lead?: string
  blocks: WfBlock[]
  /** whole section hidden from the Sales view */
  dev?: boolean
}

export interface Workflow {
  title: string
  lead: string
  /** the three "I want to…" cards above the fold */
  quick: { q: string; a: string }[]
  keyFact: { heading: string; text: string }
  links: { label: string; path: string }[]
  sections: WfSection[]
}

export const WORKFLOW: Workflow = {
  title: 'Quy trình Saramin, coi một lần là hiểu',
  lead:
    'Bản này dành cho Sales và các bạn làm nghiệp vụ. Nội dung tập trung vào chuyện cần làm gì, khi nào làm, và làm xong thì hệ thống thay đổi ra sao. Bật “Xem bản Developer” để thấy thêm route, mã lỗi và ràng buộc kỹ thuật.',
  quick: [
    { q: 'Muốn bán sản phẩm?', a: 'Đi theo luồng Báo giá → PO → Hoá đơn. Quota chỉ được cấp khi hoá đơn Issued.' },
    { q: 'Muốn đăng tin tuyển dụng?', a: 'Công ty phải Active, đã xác minh, và còn slot đúng tier muốn đăng.' },
    { q: 'Chưa thấy quyền sử dụng?', a: 'Kiểm hoá đơn đã Issued chưa, rồi mở Company → Products & billing.' },
  ],
  keyFact: {
    heading: 'Điều quan trọng nhất cần nhớ',
    text:
      'Chỉ khi hoá đơn chính thức được phát hành (Issued) thì sản phẩm hoặc số lượt sử dụng mới được cộng vào tài khoản công ty. PO đã duyệt, hay trạng thái “đã thanh toán”, đều KHÔNG tự động cấp quyền sử dụng. Đây là mốc quan trọng nhất trong toàn hệ thống — gần như mọi câu hỏi “sao khách mua rồi mà không đăng tin được” đều dừng ở đây.',
  },
  links: [
    { label: 'Mở CRM', path: '/crm/companies' },
    { label: 'Mở danh sách báo giá', path: '/crm/quotations' },
    { label: 'Mở hoá đơn', path: '/crm/invoices' },
    { label: 'Mở Jobs', path: '/recruitment/jobs' },
    { label: 'Mở Products', path: '/system/products' },
  ],

  sections: [
    /* ── HƯỚNG DẪN ──────────────────────────────────────────────────────────── */
    {
      id: 'tu-dien',
      group: 'Hướng dẫn',
      code: 'TĐ',
      label: 'Từ điển',
      title: 'Từ điển — đọc trước, 5 phút',
      lead:
        'Gần như mọi nhầm lẫn khi dùng hệ thống đến từ năm từ đầu bảng. Đọc một lượt rồi quay lại tra khi cần.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Từ', 'Nghĩa trong hệ thống này'],
            rows: [
              ['Product', 'Một món bán được, ví dụ “Tin tuyển dụng Top job 30 ngày”. Một dòng báo giá luôn trỏ vào một Product.'],
              ['Tier (bậc tin)', 'Mức của một tin: Basic · Basic plus · Top job · Distinction · Platinum. Với loại Job posting thì **Product chính là Tier**, không phải hai thứ tách rời.'],
              ['Package (bundle)', 'Nhiều Product bán chung một giá, gộp thành một dòng.'],
              ['Placement', 'Một **khu vực hiển thị** trên trang jobseeker. Từ này có 3 nghĩa khác nhau — xem mục ngay dưới.'],
              ['Quota (hạn ngạch)', 'Số lượt đăng tin công ty còn được dùng, **đếm riêng theo từng tier**. Mua 5 tin Top job là có 5 slot Top job, không phải 5 slot bất kỳ.'],
              ['Slot', 'Một lượt trong quota. Đăng một tin tiêu đúng 1 slot của tier đó.'],
              ['Quotation (báo giá)', 'Chứng từ chào giá, có 1–3 **option** để khách chọn 1.'],
              ['Option', 'Một phương án trong báo giá. Các option **thay thế nhau**, không cộng dồn.'],
              ['PO (Purchase Order)', 'Đơn đã cam kết, dựng từ đúng option khách chấp nhận.'],
              ['Invoice', 'Hoá đơn VAT. **Issued là lúc quota được cấp.**'],
              ['Exposure', 'Công tắc cho hiện công khai của một tin. **Độc lập với status** — tin có thể Open mà vẫn không ai thấy nếu Exposure tắt.'],
              ['MST', 'Mã số thuế công ty. Hoá đơn VAT cần nó, và nó là khoá chống trùng công ty.'],
              ['Add-on', 'Món bán thêm gắn lên một tin đã có tier chính, ví dụ nhãn “Hot”.'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Bẫy tên gọi: “Placement” có 3 nghĩa',
          note: 'Đây là nguồn nhầm lẫn số 1. Biết có ba thứ khác nhau là đủ.',
          table: {
            cols: ['Tên đầy đủ', 'Là gì', 'Xem ở đâu'],
            rows: [
              ['masterdata.Placement', 'Khu vực hiển thị trên trang jobseeker. Cấu hình thuần: kích thước, hiện bao nhiêu cái, bao lâu xoay một lần.', 'System → Placements'],
              ['recruitment.JobPlacement', 'Tier mà **một tin cụ thể** đang chiếm. Là một giao dịch có ngày bắt đầu/kết thúc, gắn 1 PO.', 'Không có trang riêng — xem ở job detail, dòng Current tier.'],
              ['content.PlacementBooking', 'Mua đứt một banner cụ thể. Cơ chế song song, **không liên quan tin tuyển dụng**.', 'Content → Displays'],
            ],
          },
        },
      ],
    },
    {
      id: 'chuoi',
      group: 'Hướng dẫn',
      code: 'CH',
      label: 'Chuỗi xuyên suốt',
      title: 'Chuỗi xuyên suốt — vì sao các module là một thứ',
      lead:
        'Các module không rời rạc. Chúng là một chuỗi, và biết mình đang đứng ở chặng nào giúp trả lời gần hết các câu hỏi “sao chưa thấy gì”.',
      blocks: [
        {
          kind: 'p',
          text:
            'Công ty mua gói đăng tuyển qua Báo giá → PO → Hoá đơn. Đúng lúc kế toán phát hành hoá đơn VAT, công ty có ngay quota cho đúng tier đã mua. Đăng tin dưới tier đó thì tin **tự động** xuất hiện ở đúng những khu vực mà tier đó mua quyền xuất hiện. Không ai gõ tay “tin này thuộc banner nào”.',
        },
        {
          kind: 'table',
          heading: 'Mỗi chặng làm gì',
          table: {
            cols: ['Chặng', 'Trang', 'Kết quả để lại'],
            rows: [
              ['1. Khai báo bán cái gì', 'System → Products', 'Có Product/tier để báo giá trỏ vào.'],
              ['2. Có khách hàng', 'CRM → Companies', 'Công ty tồn tại, có MST, được xác minh.'],
              ['3. Chào giá', 'CRM → Quotations', 'Báo giá với 1–3 option; khách chấp nhận 1.'],
              ['4. Chốt đơn', 'CRM → Purchase orders', 'PO dựng từ option đã chấp nhận.'],
              ['5. Phát hành hoá đơn', 'CRM → Invoices', '**Issued ⇒ quota được cấp vào công ty.**'],
              ['6. Đăng tin', 'Recruitment → Jobs', 'Tiêu 1 slot của đúng tier; tin lên các khu vực của tier đó.'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Nhảy cóc là nguyên nhân phổ biến nhất của “hệ thống lỗi”. Không có Product thì không báo giá được; công ty chưa Active thì không đăng tin được; hoá đơn chưa Issued thì quota bằng 0 dù PO đã duyệt.',
        },
      ],
    },
    {
      id: 'quyen',
      group: 'Hướng dẫn',
      code: 'R',
      label: 'Quyền theo vai trò',
      title: 'Quyền theo vai trò',
      lead:
        'Quyền của bạn quyết định bạn thấy trang nào. Nếu một trang trong tài liệu này không có trong sidebar của bạn thì đó là **thiếu permission, không phải bug** — báo team gán role.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Vai trò', 'Phạm vi xem', 'Được làm', 'Không được làm / cần chuyển người khác'],
            rows: [
              ['Sales Member', 'Khách hàng mình phụ trách; dữ liệu team khác ở chế độ chỉ xem', 'Call, meeting, tạo báo giá trong phạm vi được giao', 'Không sửa Company info, không xoá Contact. Thiếu quyền thì chuyển Sales Leader hoặc Sales Admin.'],
              ['Sales Leader', 'Dữ liệu của team và từng thành viên', 'Theo dõi team, duyệt chiết khấu trong hạn mức', 'Chiết khấu vượt hạn mức phải chuyển Sales Manager.'],
              ['Sales Admin', 'Phạm vi quản trị Sales', 'Verify company, xử lý Sign-up, duyệt claim', 'Không đụng các quyền chỉ dành cho System Admin.'],
              ['Accountant / Kế toán', 'Chứng từ tài chính', '**Phát hành hoá đơn (Issued)** — bước cấp quota', 'Không sửa nội dung tin tuyển dụng.'],
              ['Ops / Recruitment', 'Tin tuyển dụng, ứng viên, CV', 'Duyệt và chỉnh tin, xử lý ứng tuyển', 'Không phát hành hoá đơn, không đổi giá.'],
              ['System Admin', 'Toàn hệ thống', 'Users, Roles, Master data, Environment', '—'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Nút bị ẩn gần như luôn là permission, không phải lỗi. Trước khi báo bug, kiểm: trang có trong sidebar của bạn không, và vai trò của bạn có hành động đó trong bảng trên không.',
        },
        {
          kind: 'p',
          dev: true,
          text:
            'Permission có dạng `resource:action` (ví dụ `company:read`, `order:read`), mỗi cái kèm `scope`: `all` (không giới hạn) · `company` (dòng phải thuộc companyId được cấp) · `own` (dòng phải thuộc chính user). **svn-be là nơi duy nhất có thẩm quyền** — nó enforce 401/403 và row-level scope trên mọi call; `usePermission()` / `AppButton` / `PermissionGate` ở FE chỉ là UX (ẩn nút người dùng không bấm được), không bao giờ được coi là lớp bảo vệ.',
        },
        {
          kind: 'p',
          dev: true,
          text:
            'Nguồn sự thật về danh tính và quyền là `GET /api/admin/auth/me`, cache trong `AuthProvider`. Sửa role/permission thì phải invalidate query đó. Hiện chỉ seed một tài khoản `admin@saramin.vn` scope `all`; muốn kiểm hành vi scope `company`/`own` phải tạo user qua `AdminUserController` trước.',
        },
      ],
    },

    /* ── CRM ────────────────────────────────────────────────────────────────── */
    {
      id: 'companies',
      group: 'CRM',
      code: 'C',
      label: 'Companies',
      title: 'Companies — hồ sơ khách hàng',
      where: 'CRM → Companies (/crm/companies)',
      lead: 'Mọi thứ bán được đều treo vào một công ty. Công ty sai hoặc trùng là lỗi đắt nhất, vì hoá đơn và quota đã gắn vào đó.',
      blocks: [
        {
          kind: 'steps',
          heading: 'Tạo công ty',
          items: [
            'Mở **CRM → Companies → Create company**.',
            'Nhập **Tên pháp lý** và **MST** — đây là hai field bắt buộc; mọi thứ khác điền sau được.',
            'Điền địa chỉ đăng ký, người liên hệ, sales owner.',
            'Lưu. Công ty vào trạng thái chưa xác minh cho tới khi có giấy tờ.',
          ],
        },
        {
          kind: 'table',
          heading: 'Xác minh công ty',
          table: {
            cols: ['Trạng thái', 'Nghĩa', 'Ai chuyển'],
            rows: [
              ['No paperwork', 'Chưa có giấy tờ nào', '—'],
              ['Waiting to verify', 'Đã nộp giấy tờ, chờ duyệt', 'Sales nộp'],
              ['Verified', 'Đã xác minh — mới được đăng tin', 'Sales Admin duyệt'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'MST là khoá chống trùng. Tạo công ty với MST đã tồn tại sẽ bị từ chối và hệ thống chỉ thẳng sang công ty đang giữ MST đó — hãy mở công ty đó ra thay vì tạo bản thứ hai.',
        },
        {
          kind: 'p',
          dev: true,
          text:
            'Trùng MST trả **409** kèm `{ error, id }` trong `ApiError.details`, `id` là công ty đang tồn tại để client link sang. `id` có thể `null` ở nhánh thua race khi cùng tạo (svn-be F9).',
        },
        { kind: 'links', items: [{ label: 'Companies', path: '/crm/companies' }, { label: 'Sign-ups', path: '/crm/sign-ups' }, { label: 'Company documents', path: '/crm/company-documents' }] },
      ],
    },
    {
      id: 'bao-gia',
      group: 'CRM',
      code: 'đ',
      label: 'Báo giá → Hoá đơn',
      title: 'Báo giá → PO → Hoá đơn',
      where: 'CRM → Quotations / Purchase orders / Invoices',
      lead: 'Đây là luồng bán. Ba chứng từ nối tiếp nhau, và chỉ chứng từ cuối cùng mới đổi được quyền sử dụng của khách.',
      blocks: [
        {
          kind: 'steps',
          heading: 'Các bước',
          items: [
            'Mở công ty → **Create quotation**. Báo giá luôn bắt đầu từ công ty, không tạo trôi nổi.',
            'Thêm **option** (1–3). Mỗi option là một phương án trọn gói; khách chọn **một**.',
            'Mỗi dòng trong option trỏ vào một **Product** — không gõ tay tên sản phẩm.',
            'Gửi khách. Khách chấp nhận một option → option đó chuyển **Accepted**.',
            'Dựng **PO** từ đúng option đã Accepted.',
            'Kế toán phát hành **Invoice**. Ngay khi Invoice **Issued**, quota vào tài khoản công ty.',
          ],
        },
        {
          kind: 'table',
          heading: 'Duyệt chiết khấu',
          table: {
            cols: ['Mức chiết khấu tổng đơn', 'Ai duyệt'],
            rows: [
              ['≤ 10%', 'Sales Leader'],
              ['> 10%', 'Sales Manager'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Các option **thay thế nhau, không cộng dồn**. Khách chấp nhận option 2 nghĩa là option 1 và 3 bị loại, không phải mua cả ba. Dựng PO từ nhầm option là sai số tiền và sai quota.',
        },
        {
          kind: 'table',
          heading: 'Mã lỗi hay gặp',
          dev: true,
          table: {
            cols: ['Status / code', 'Nghĩa', 'Xử lý ở UX'],
            rows: [
              ['409 `SVN-4000`', 'INSUFFICIENT_CREDIT', 'Nhắc nạp thêm credit'],
              ['409 `SVN-1005`', 'Sai chuyển trạng thái', 'Hiện thông báo xung đột'],
              ['400', 'Chưa xác định người trả', 'Hỏi chọn payer'],
              ['404 `SVN-1002`', 'Không tìm thấy', 'Thông báo not found'],
            ],
          },
        },
        { kind: 'links', items: [{ label: 'Quotations', path: '/crm/quotations' }, { label: 'Purchase orders', path: '/crm/purchase-orders' }, { label: 'Invoices', path: '/crm/invoices' }] },
      ],
    },
    {
      id: 'claim',
      group: 'CRM',
      code: '✓',
      label: 'Claim & Sign-up',
      title: 'Claim công ty & Sign-up',
      where: 'CRM → Company claims (/crm/company-claims) · Sign-ups (/crm/sign-ups)',
      lead: 'Hai cửa đưa khách vào hệ thống: khách tự đăng ký, hoặc Sales xin nhận một công ty đang nằm ở Free data.',
      blocks: [
        {
          kind: 'steps',
          heading: 'Sign-up: khách tự đăng ký',
          items: [
            'Người của công ty đăng ký ở employer site → dòng mới xuất hiện ở **CRM → Sign-ups**.',
            'Admin xem dòng đó và chọn một trong ba: **Move** (gắn vào công ty đã có) · **Create company & activate** (tạo mới) · **Archive** (bỏ).',
            'Chỉ sau **Move** hoặc **Create** thì người đó mới đăng nhập được.',
          ],
        },
        {
          kind: 'steps',
          heading: 'Claim: Sales xin nhận công ty',
          items: [
            'Sales mở công ty trong **Free data** → gửi yêu cầu nhận.',
            'Yêu cầu đi qua **hai cấp duyệt** trước khi công ty về tay Sales đó.',
          ],
        },
        { kind: 'links', items: [{ label: 'Sign-ups', path: '/crm/sign-ups' }, { label: 'Company claims', path: '/crm/company-claims' }, { label: 'Pipeline', path: '/crm/pipeline' }] },
      ],
    },
    {
      id: 'products-quota',
      group: 'CRM',
      code: 'P',
      label: 'Products & Quota',
      title: 'Products & Quota — khách đang giữ những gì',
      where: 'System → Products (/system/products) · Company → Products & billing',
      lead: 'Products là danh mục bán. Quota là phần khách đã mua và còn dùng được — hai thứ khác nhau, hay bị hỏi lẫn.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Câu hỏi', 'Xem ở đâu'],
            rows: [
              ['Chúng ta bán những gì?', 'System → Products'],
              ['Công ty này đã mua gì, còn bao nhiêu lượt?', 'Mở công ty → tab Products & billing'],
              ['Sao mua rồi mà quota vẫn 0?', 'Mở hoá đơn của đơn đó — nhiều khả năng chưa Issued'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Quota đếm **theo từng tier**. Mua 5 tin Top job là 5 slot Top job — không dùng được cho Basic hay Distinction. Hết slot đúng tier thì không đăng được tin tier đó, dù tổng số slot còn nhiều.',
        },
        { kind: 'links', items: [{ label: 'Products', path: '/system/products' }, { label: 'Companies', path: '/crm/companies' }] },
      ],
    },

    /* ── RECRUITMENT ────────────────────────────────────────────────────────── */
    {
      id: 'jobs',
      group: 'Recruitment',
      code: 'J',
      label: 'Jobs',
      title: 'Jobs — đăng và quản tin tuyển dụng',
      where: 'Recruitment → Jobs (/recruitment/jobs)',
      lead: 'Đăng tin là lúc quota bị tiêu. Đây cũng là nơi hai khái niệm hay bị lẫn: status và exposure.',
      blocks: [
        {
          kind: 'steps',
          heading: 'Đăng một tin',
          items: [
            'Kiểm công ty đã **Active** và **Verified**, và còn slot đúng tier muốn đăng.',
            'Mở **Recruitment → Jobs → New job**, chọn công ty.',
            'Điền nội dung tin và chọn **tier**. Tier quyết định tin lên những khu vực nào.',
            'Publish. Hệ thống **tiêu 1 slot** của tier đó.',
          ],
        },
        {
          kind: 'table',
          heading: 'Status và Exposure là hai thứ khác nhau',
          table: {
            cols: ['', 'Status', 'Exposure'],
            rows: [
              ['Là gì', 'Tin đang ở chặng nào: Draft · Schedule · Open · Closed', 'Cho hiện công khai hay không: On / Off'],
              ['Ai đổi', 'Theo ngày và hành động publish — suy ra, không gõ tay', 'Người vận hành bật/tắt'],
              ['Tắt thì sao', 'Closed là kết thúc booking', 'Off là giấu khỏi trang jobseeker nhưng booking vẫn chạy và vẫn hết hạn đúng ngày'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Tin **Open mà Exposure Off thì không ai thấy**. Khi khách báo “tin không hiện”, kiểm Exposure trước khi kiểm bất cứ thứ gì khác.',
        },
        { kind: 'links', items: [{ label: 'Jobs', path: '/recruitment/jobs' }, { label: 'Applicants', path: '/recruitment/applicants' }] },
      ],
    },
    {
      id: 'applicants',
      group: 'Recruitment',
      code: 'A',
      label: 'Applications & CV',
      title: 'Applications & CV / Resumes',
      where: 'Recruitment → Applicants (/recruitment/applicants) · Resumes (/recruitment/resumes)',
      lead: 'Hồ sơ ứng viên là dữ liệu cá nhân. Mọi thao tác mở và xuất đều bị ghi log.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Việc cần làm', 'Trang'],
            rows: [
              ['Xem ai đã ứng tuyển tin nào', 'Recruitment → Applicants'],
              ['Tra cứu kho CV ứng viên', 'Recruitment → Resumes / candidates'],
              ['Mở khoá một CV cho công ty', 'Từ CV đó — tiêu credit của công ty'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Mở hồ sơ ứng viên và xuất danh sách đều là thao tác chạm dữ liệu cá nhân, được audit ở server. Chỉ mở khi có lý do công việc.',
        },
        {
          kind: 'p',
          dev: true,
          text:
            'Export bị gate bằng `candidate:manage`, không phải `:read`, và được audit dưới sự kiện `candidate.export`. Unlock CV và company unlock đều trừ credit trên số dư công ty qua `/api/admin/companies/{id}/credit`; giá unlock một CV có thể bị admin override theo từng CV.',
        },
        { kind: 'links', items: [{ label: 'Applicants', path: '/recruitment/applicants' }, { label: 'Resumes', path: '/recruitment/resumes' }] },
      ],
    },
    {
      id: 'jobseeker-users',
      group: 'Users',
      code: 'ID',
      label: 'Jobseeker Users',
      title: 'Jobseeker Users — tài khoản người tìm việc',
      where: 'Users → Jobseeker users',
      lead: 'Bốn trạng thái ở API hiện thành năm trạng thái trên màn hình. Cặp hay nhầm là Withdrawn và Deactivated.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Hiện trên UI', 'Nghĩa', 'Ai gây ra'],
            rows: [
              ['Active', 'Đang dùng bình thường', '—'],
              ['Unverified', 'Đăng ký nhưng chưa xác thực', '—'],
              ['Withdrawn', 'Người dùng **tự** tắt tài khoản', 'Chính ứng viên'],
              ['Deactivated', 'Bị HQ khoá', 'Admin'],
              ['Deleted', 'Xoá mềm, purge sau 30 ngày', 'Admin hoặc ứng viên'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Withdrawn và Deactivated trông giống nhau ở danh sách vì cùng một trạng thái phía API — phân biệt bằng **ai là người đổi**. Đừng “reactivate” một tài khoản Withdrawn như thể HQ đã khoá nhầm.',
        },
        {
          kind: 'p',
          dev: true,
          text:
            '4 API states (`ACTIVE`, `INACTIVE`→hiện “Unverified”, `DEACTIVATED`, `DELETED`) → 5 UI states. `DEACTIVATED` tách bằng `statusChangedBy`: bằng `candidate.id` ⇒ Withdrawn, id khác ⇒ Deactivated. Nguồn duy nhất: `resolveDisplayStatus()` trong `modules/user/jobseekers/jobseekers.types.ts`. Withdrawn **không filter được ở server** — tab của nó query cùng tập `DEACTIVATED`, số đếm lấy từ `/stats`; muốn filter thật cần thêm param ở BE.',
        },
      ],
    },

    /* ── DASHBOARDS ─────────────────────────────────────────────────────────── */
    {
      id: 'dashboard',
      group: 'Dashboards',
      code: 'DB',
      label: 'Dashboard & Analytics',
      title: 'Dashboard & Analytics',
      where: 'Dashboard (/) · Analytics (/analytics/…)',
      lead: 'Ba báo cáo tách theo câu hỏi, không phải theo phòng ban.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Báo cáo', 'Trả lời câu hỏi', 'Đường dẫn'],
            rows: [
              ['Sales report', 'Ai bán được bao nhiêu, đang ở chặng nào', '/analytics/sales-report'],
              ['Recruit report', 'Tin tuyển dụng và ứng tuyển chạy ra sao', '/analytics/recruit-report'],
              ['Revenue report', 'Tiền thực thu theo kỳ', '/analytics/revenue-report'],
            ],
          },
        },
        {
          kind: 'p',
          dev: true,
          text:
            'Mọi ngày giờ render theo giờ VN — mọi helper trong `shared/utils/format.ts` pin `timeZone: "Asia/Ho_Chi_Minh"`. Không dùng `toLocaleString`/`toLocaleDateString` với timezone ngầm định. Số tiền qua `formatVnd` / `formatInt`.',
        },
        { kind: 'links', items: [{ label: 'Dashboard', path: '/' }, { label: 'Sales report', path: '/analytics/sales-report' }, { label: 'Revenue report', path: '/analytics/revenue-report' }] },
      ],
    },

    /* ── QUẢN TRỊ ───────────────────────────────────────────────────────────── */
    {
      id: 'can-xac-nhan',
      group: 'Quản trị',
      code: '?',
      label: 'Điểm cần xác nhận',
      title: 'Điểm cần xác nhận',
      lead:
        'Những điểm chưa có quyết định cuối. Ghi ở đây để không ai vô tình coi là đã chốt — mỗi dòng cần một người quyết trước khi build theo.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Vấn đề', 'Đang tạm hiểu là', 'Ai quyết'],
            rows: [
              ['Ngưỡng tỉ lệ hiển thị tối thiểu của một vị trí banner', 'Tạm 50% — là cam kết thương mại, chưa chốt', 'Business'],
              ['Khi vị trí sắp trống, hệ thống tự đẩy banner nội bộ hay chỉ cảnh báo?', 'Chỉ cảnh báo', 'Business + Ops'],
              ['Hạn mức chiết khấu của Sales Leader', 'Tạm ≤ 10%', 'Sales Manager'],
              ['Ai được phát hành hoá đơn ngoài Kế toán?', 'Chưa ai khác', 'Finance'],
            ],
          },
        },
        {
          kind: 'warn',
          text:
            'Trang này mô tả hệ thống trên môi trường dev. Khi build đổi, trang này là thứ cũ đi — đọc kèm ngày cập nhật ở đầu trang.',
        },
      ],
    },
  ],
}

/** Sidebar groups, in the order the handbook reads. */
export const WF_GROUPS = ['Hướng dẫn', 'Dashboards', 'CRM', 'Recruitment', 'Users', 'Quản trị']
