/*
 * Document changelog — the client-facing timeline of THIS SITE.
 *
 * The site is the source of truth a client reads to decide what is being
 * built. A source of truth that changes silently is worse than one that is
 * out of date: the reader has no way to tell whether the paragraph they
 * approved last week is still the paragraph on the page. So every change to a
 * requirement or a mockup lands one entry here, newest first.
 *
 * WHAT GOES IN AN ENTRY — the reader's question is always "what changed for
 * me?", never "which file moved". So:
 *   - Write what the PRODUCT now says, not what the code does.
 *   - A pure refactor of the site (a component split, a copy-edit that keeps
 *     the meaning) gets NO entry. Nothing changed for the reader.
 *   - `source` credits the build commit a change was read out of, so a reader
 *     who doubts an entry can be shown the code. It is optional — an entry
 *     authored from a client meeting has no commit.
 *
 * Appended by the `/sync-doc` skill (after the user approves) and by hand for
 * changes that come from a decision rather than from the code.
 */

/** vi first, en underneath — same convention as `KeyPoint` in `build/types.ts`. */
export type Bilingual = string | { vi: string; en: string }

/** What surface the change landed on. Drives the pill on each entry. */
export type ChangeKind =
  | 'requirement' // the written spec in src/data/build/*.ts
  | 'mockup' // the prototype screens
  | 'both' // requirement + mockup together (the usual case)
  | 'scope' // something entered or left the build plan
  | 'decision' // a locked answer to an open question
  | 'guide' // a user-guide page (how to drive the built screens) was added or changed

export const KIND_META: Record<ChangeKind, { label: string; vi: string; pill: string }> = {
  requirement: {
    label: 'Requirement',
    vi: 'Yêu cầu',
    pill: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  mockup: { label: 'Mockup', vi: 'Mockup', pill: 'bg-violet-50 text-violet-700 border-violet-200' },
  both: {
    label: 'Requirement + mockup',
    vi: 'Yêu cầu + mockup',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  scope: { label: 'Scope', vi: 'Phạm vi', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  decision: {
    label: 'Decision',
    vi: 'Quyết định',
    pill: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  guide: { label: 'User guide', vi: 'Hướng dẫn sử dụng', pill: 'bg-teal-50 text-teal-700 border-teal-200' },
}

/** The build commit an entry was read out of — the receipt behind the claim. */
export interface ChangeSource {
  /** 'svn-be' | 'svn-web' | 'saramin-vn-admin' */
  repo: string
  /** short sha, e.g. '3a2a37c3a' */
  sha?: string
  /** one line: what that commit did */
  note?: string
}

export interface ChangeEntry {
  /** ISO date, YYYY-MM-DD. Entries are grouped by this in the UI. */
  date: string
  kind: ChangeKind
  /** Module id from BUILD_MODULES, e.g. 'job-management'. Links the entry to its page. */
  module?: string
  /** Feature index within that module, when the change is about one feature. */
  featureKey?: string | number
  /** One line, in the reader's words. */
  title: Bilingual
  /** The detail — what it was, what it is now, why. Optional but usually wanted. */
  detail?: Bilingual
  /** Where the change came from in the build code. */
  source?: ChangeSource[]
}

/*
 * Newest first. `/sync-doc` inserts at the top of this array.
 */
export const CHANGELOG: ChangeEntry[] = [
  {
    date: '2026-09-11',
    kind: 'guide',
    module: 'crm',
    title: {
      vi: 'Hướng dẫn CRM có 4 workflow đầu-cuối — mỗi bước ghi rõ ai làm · trên platform nào · trang nào · thao tác gì · kết quả gì, kèm ảnh chụp từng bước',
      en: 'The CRM guide opens with four end-to-end workflows — each step names who acts, on which platform and page, doing what, with what result, with a screenshot per step',
    },
    detail: {
      vi: 'Theo yêu cầu của khách hàng (“trang nào, thao tác nào, ai làm”): (1) Company user đăng ký → Admin xem dòng Sign-ups → Move · Create company & activate · Archive — chỉ sau Move/Create user mới đăng nhập được; (2) Xác minh công ty: No paperwork → Waiting to verify → Verified; (3) Báo giá có chiết khấu tổng đơn: ≤ 10% Sales lead duyệt, > 10% Sales manager duyệt; (4) Sales xin nhận công ty từ Free data qua hai cấp duyệt. Đường dẫn lấy từ build (employer site dev.hiring.svn.topdev.asia: /auth/sign-up · /company-join · /jobs/new; admin: /crm/sign-ups · /crm/companies · /crm/free-data · /crm/company-claims · /crm/quotations). Ảnh chụp từ mockup của tài liệu này, sẽ thay bằng ảnh môi trường QA khi có.',
      en: 'At the client’s request (“which page, which action, who does it”): (1) a company user signs up → the Admin reviews the Sign-ups row → Move · Create company & activate · Archive — only Move and Create open the login; (2) company verification: No paperwork → Waiting to verify → Verified; (3) a quotation with an order-level discount: ≤ 10% the Sales lead approves, > 10% the Sales manager; (4) Sales claims a company from Free data through the two approval levels. Paths come from the build (employer site dev.hiring.svn.topdev.asia: /auth/sign-up · /company-join · /jobs/new; admin: /crm/sign-ups · /crm/companies · /crm/free-data · /crm/company-claims · /crm/quotations). Screenshots are taken from this site’s mockups and will be swapped for QA-environment captures when available.',
    },
  },
  {
    date: '2026-09-11',
    kind: 'both',
    module: 'crm',
    title: {
      vi: 'Xác minh công ty theo đúng build: ba nhãn No paperwork · Waiting to verify · Verified — có Giấy chứng nhận đăng ký doanh nghiệp (ERC) trên hồ sơ là chuyển sang Waiting to verify, và chỉ ở trạng thái đó Admin mới bấm Verify',
      en: 'Company verification follows the build: three labels No paperwork · Waiting to verify · Verified — an ERC on file moves the company to Waiting to verify, and only there can the Admin press Verify',
    },
    detail: {
      vi: 'Thay luật “đủ 3 input MST · địa chỉ đăng ký MST · ERC” (09/09) bằng luật một input: có ERC trên hồ sơ. Lý do: công ty được admin tạo qua form Create company đầy đủ (bắt buộc tên pháp lý · MST · địa chỉ xuất hóa đơn), nên MST và địa chỉ không thể thiếu trên một hồ sơ đã tồn tại — thứ employer còn nợ chỉ là giấy chứng nhận. Nhãn được tính lúc đọc từ kết luận xác minh + có/không có tài liệu (svn-be V482), không lưu. Trên Company site: banner và nút header đổi thành “Tải lên ERC để được xác minh”, tag No paperwork / Waiting to verify / Verified; trang Company information (/company-join) chỉ đọc sau khi Verified. Trên admin: filter Verified 3 giá trị, chip Chờ verify đếm Waiting to verify, dialog Verify liệt kê ERC là input và MST · địa chỉ · tên pháp lý · sales owner là thông tin đối chiếu. Hành động thứ ba trên Sign-ups gọi theo build: Create company & activate.',
      en: 'Replaces the 09/09 “three inputs — MST · registered address · ERC” rule with one input: an ERC on the record. Why: the company is created by an admin through the full Create company form (legal name · MST · invoice address required), so neither can be missing on a record that exists — the certificate is the only thing the employer still owes. The label is derived on read from the verdict plus the documents (svn-be V482), never stored. Company site: banner and header button now read “Tải lên ERC để được xác minh”, tags No paperwork / Waiting to verify / Verified; Company information (/company-join) is read-only once Verified. Admin: the Verified filter has the three labels, the Chờ verify chip counts Waiting to verify, the Verify dialog lists the ERC as the input and MST · address · legal name · sales owner as facts to read against it. The third Sign-ups action takes the build’s name: Create company & activate.',
    },
  },
  {
    date: '2026-09-09',
    kind: 'both',
    module: 'crm',
    featureKey: 'sign-ups',
    title: {
      vi: 'Sign-up: xác minh email KHÔNG còn mở quyền đăng nhập — admin phải place user vào một công ty trước. Khôi phục lại cửa của luồng 08/2026',
      en: 'Sign-up: verifying the email no longer opens sign-in — an admin must place the person into a company first. The 08/2026 gate is restored',
    },
    detail: {
      vi: 'Bản 09/2026 cho phép bấm link email là vào console ngay, công ty được tạo tự động ở trạng thái Chưa xác minh. Nay quay lại luật cũ: link email chỉ xác thực địa chỉ và tạo MỘT dòng trên Sign-ups — chưa có login, chưa có công ty. Admin resolve dòng đó theo một trong ba cách: Move vào công ty đã có · Create công ty + đặt người đó làm Admin đầu tiên (trường hợp phổ biến) · Archive nếu là spam. Move và Create gửi email kích hoạt, và đó là lúc user đăng nhập được. Lý do khách hàng đưa ra: chỉ người thuộc một công ty mà admin đã xem qua mới được vào platform. Xác minh ERC vẫn là cửa THỨ HAI, sau khi đã vào, và vẫn chỉ chặn hai việc: đăng tin và Sales yêu cầu xuất hóa đơn chính. Hệ quả: không còn “công ty rỗng” tạo tự động rồi archive khi trùng, và SLA của màn Sign-ups giờ là lời hứa với khách (1 ngày làm việc) vì khách đang đứng ngoài cửa.',
      en: 'The 09/2026 model let the email link itself open the console, creating the company automatically as Unverified. That is reverted: the link now only proves the address and creates ONE row on Sign-ups — no login, no company. An admin resolves the row one of three ways: Move into an existing customer · Create the company and place the person as its first Admin (the common case) · Archive as spam. Move and Create send the activation email, and that is the moment sign-in works. The client’s reason: only people who belong to a company an admin has looked at should be inside the platform. ERC verification remains the SECOND gate, after they are in, and still blocks only two things — posting a job, and Sales requesting the official invoice. Consequences: no more auto-created shell company that has to be archived when it turns out to be a duplicate, and the Sign-ups SLA is now a promise to a customer (1 business day), because the customer is waiting outside.',
    },
  },
  {
    date: '2026-09-09',
    kind: 'both',
    module: 'crm',
    title: {
      vi: 'Xác minh công ty — nút Verify chỉ mở khi hồ sơ đủ 3 mục (MST · địa chỉ đăng ký MST · ERC); Customers lọc và đếm được công ty đã đủ hồ sơ',
      en: 'Company verification — Verify opens only when the record has all three inputs (MST · registered address · ERC); Customers filters and counts the companies that are ready',
    },
    detail: {
      vi: 'Trước đây checklist Verify có 4 mục (ERC · MST khớp · tên pháp lý khớp · đã phân sales owner). Nay đúng 3 input trên hồ sơ: MST, địa chỉ đăng ký MST và ít nhất một tệp ERC — tên pháp lý và sales owner chỉ hiện để đối chiếu, không chặn. “Đủ hồ sơ” được tính từ ba trường đó mỗi lần đọc, không lưu, nên mọi màn hình nói cùng một điều: filter Verified trên Customers có 3 giá trị (Verified · Unverified · ready to verify · Unverified · missing info), chip “Chờ verify · n” lọc một click, dưới tag Unverified ghi rõ còn thiếu gì, nút Verify company ở Company detail disabled kèm lý do, và panel Sign-ups cũng báo hồ sơ đủ hay thiếu. Phía Company site: nút cạnh tag đọc “Xác minh công ty · thiếu N mục →”, trang Post job và Company information liệt kê 3 mục ✓/✗ với link đến chỗ điền; đủ 3 thì báo “Đủ hồ sơ — Saramin xác minh trong 1 ngày làm việc”.',
      en: 'The Verify checklist used to have four items (ERC · MST matches · legal name matches · sales owner assigned). It is now exactly three inputs on the record: MST, registered (tax) address and at least one ERC file — legal name and sales owner are shown to read against the certificate, not gates. “Ready” is computed from those three fields on every read, never stored, so every screen says the same thing: the Verified filter on Customers has three values (Verified · Unverified · ready to verify · Unverified · missing info), a “Chờ verify · n” chip applies the ready filter in one click, the Unverified tag on each row says what is missing, the Verify company button on Company detail is disabled with the reason, and the Sign-ups panel reports ready / missing too. On the Company site the header button reads “Xác minh công ty · thiếu N mục →”, and Post job and Company information list the three items ✓/✗ with a link to where each is filled; with all three in: “Đủ hồ sơ — Saramin xác minh trong 1 ngày làm việc”.',
    },
  },
  {
    date: '2026-09-09',
    kind: 'requirement',
    module: 'account-management',
    title: {
      vi: 'Company information (Company site) — hai trạng thái: Chưa xác minh thì Admin tài khoản sửa trực tiếp mọi trường; Đã xác minh thì chỉ đọc. Bỏ hàng đợi “yêu cầu thay đổi”',
      en: 'Company information (Company site) — two states: editable by the account Admin while Unverified, read-only once Verified. The change-request queue is gone',
    },
    detail: {
      vi: 'Bản trước đưa tên pháp lý · MST · địa chỉ đăng ký · loại công ty qua yêu cầu thay đổi (Pending review → Applied / Declined) để HQ duyệt. Nay việc xác minh chính là bước duyệt: khi Chưa xác minh, Admin tài khoản điền và sửa trực tiếp (kể cả MST, địa chỉ) để đủ hồ sơ; khi Đã xác minh, trang chỉ đọc, chỉ Saramin sửa và sửa là rớt cờ, phải Verify lại. Banner “Để được xác minh, Saramin cần đủ 3 mục” hiện ở cả chế độ xem và sửa (Figma 2311-10289 · 2313-10289). Giấy tờ (Enterprise Registration Documents) không còn trạng thái theo từng tệp — tệp có hay không, cờ Verified của công ty là kết luận duy nhất; tải lên được ở cả hai trạng thái, xoá chỉ khi Chưa xác minh.',
      en: 'The previous draft routed legal name · tax code · registered address · company type through change requests (Pending review → Applied / Declined) for HQ to confirm. Verification now is the review: while Unverified the account Admin fills and edits everything directly (tax code and address included) to complete the record; once Verified the page is read-only, only Saramin edits, and that edit drops the flag until re-verified. The banner “Để được xác minh, Saramin cần đủ 3 mục” shows in view and edit mode (Figma 2311-10289 · 2313-10289). Documents (Enterprise Registration Documents) no longer carry a per-file status — a file is on the record or not, and the company-level Verified flag is the only verdict; upload works in both states, delete only while Unverified.',
    },
  },
  {
    date: '2026-09-09',
    kind: 'decision',
    module: 'crm',
    title: {
      vi: 'Sau khi user xác minh email, admin có hai việc độc lập: ghép trùng làm ngay; xác minh công ty thong thả — miễn xong trước khi đăng tin / xuất hóa đơn',
      en: 'After the email is verified the admin has two independent jobs: resolve a duplicate right away; verify the company at leisure — as long as it is done before posting a job or issuing an invoice',
    },
    detail: {
      vi: 'Dòng Sign-ups xuất hiện ngay khi email verified, và Move (công ty đã có trên Customers) hoặc Gộp dòng Free data dùng được ngay — không chờ ERC, không chờ xác minh. Xác minh không có deadline riêng; hai cổng duy nhất là đăng tin và yêu cầu xuất hóa đơn chính. Sơ đồ trên trang Sign-up & company verification vẽ lại hai việc này thành hai nhóm tách nhau, và sơ đồ nay vừa với khổ trang (không còn phải kéo ngang mới thấy hết chữ).',
      en: 'The Sign-ups row appears the moment the email is verified, and Move (company already on Customers) or merging a Free data row is available at once — no waiting for the ERC or for verification. Verification has no deadline of its own; the only two gates are posting a job and requesting the official invoice. The diagram on the Sign-up & company verification page now draws the two jobs as separate groups, and it fits the page width (no more horizontal scrolling to read the labels).',
    },
  },
  {
    date: '2026-09-08',
    kind: 'guide',
    module: 'products-packages',
    title: {
      vi: 'Products & Packages có trang Hướng dẫn sử dụng — các bước chính trên màn hình admin thật, kèm ảnh chụp',
      en: 'Products & Packages gets a User guide — key steps on the real admin screens, with screenshots',
    },
    detail: {
      vi: 'Mỗi module giờ có thể có hai lớp: trang yêu cầu (vì sao) và trang Hướng dẫn sử dụng (làm thế nào), nằm ngay dưới tên module ở menu trái. Trang đầu tiên là Products & Packages: 8 việc thường làm — tìm module, xem danh mục, tạo sản phẩm, chọn vị trí hiển thị cho một hạng tin, tạo gói, cấu hình vùng hiển thị, kiểm tra chương trình chiết khấu, xem mức dùng gói tìm CV. Hai màn hình (Discount programmes, CV search usage) chưa có ảnh chụp, được đánh dấu rõ trên trang.',
      en: 'A module can now carry two layers: the requirement page (why) and a User guide page (how), listed right under the module name in the left menu. The first one is Products & Packages: 8 everyday tasks — find the module, browse the catalogue, create a product, set where a tier appears, create a package, configure a display area, check a discount programme, see who is using their CV search package. Two screens (Discount programmes, CV search usage) have no screenshot yet and are marked as such on the page.',
    },
    source: [
      { repo: 'saramin-vn-admin', sha: '07e4b68', note: 'dev — the screens the guide describes' },
      { repo: 'saramin-vn-admin', sha: 'deed9d0', note: 'docs/qa/screenshots — the pictures used' },
    ],
  },
  {
    date: '2026-09-08',
    kind: 'decision',
    title: {
      vi: 'Trang này bắt đầu ghi lại lịch sử thay đổi tài liệu',
      en: 'This site starts recording its own document history',
    },
    detail: {
      vi: 'Từ hôm nay, mỗi lần tài liệu được đồng bộ với code thực tế (3 repo: Admin, Company/Jobseeker site, Backend), thay đổi sẽ được ghi lại ở đây kèm ngày và module — để khách hàng theo dõi được tài liệu nào đã đổi, đổi lúc nào và vì sao. Các thay đổi trước ngày này chưa được ghi lại.',
      en: 'From today, every sync between this documentation and the actual build (three repos: Admin, Company/Jobseeker site, Backend) is logged here with its date and module, so the client can see which document changed, when, and why. Changes made before this date are not recorded.',
    },
  },
]
