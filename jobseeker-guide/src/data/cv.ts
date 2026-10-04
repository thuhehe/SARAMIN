/*
 * MODULE CV — how a jobseeker creates, uploads, manages and uses a CV.
 *
 * Written for the client: what the jobseeker does, screen by screen, and the
 * rules the build actually enforces. Read from svn-web bfb3ef8 + svn-be 6a1fee8
 * (dev). Where the build and its own copy disagree, the page follows the code
 * and lists the disagreement under "Điểm cần lưu ý".
 *
 * URLs are the Vietnamese slugs the site serves by default (/ho-so-ca-nhan/…).
 */
import type { GuideModule, GuideSection } from './types'

const M = 'cv'

export const CV_MODULE: GuideModule = {
  id: M,
  code: 'CV',
  label: 'CV',
  title: 'CV của ứng viên, từ lúc tạo đến lúc ứng tuyển',
  lead:
    'Người tìm việc có hai cách để có CV trên Saramin: **tạo CV Saramin** bằng trình tạo CV trên web, hoặc **tải lên file CV** có sẵn (PDF / Word). Cả hai nằm chung một thư viện ở trang [[Quản lý CV|Resume Management]], đều dùng được để ứng tuyển, và chỉ **một** CV được hiển thị cho nhà tuyển dụng tìm kiếm. Bật **Xem bản Developer** để thấy thêm endpoint và giới hạn kỹ thuật.',
  quick: [
    {
      q: 'Muốn tạo CV?',
      a: 'Vào [[Quản lý CV|Resume Management]] → [[Tạo CV Saramin|Create Saramin CV]], điền các mục, bấm [[Lưu|Save]] ở thanh dưới cùng. Hoặc [[Tự động tạo từ file|Auto-create from file]] để tải lên CV có sẵn — AI đọc và điền thông tin giúp.',
    },
    {
      q: 'CV thế nào là hoàn chỉnh?',
      a: 'Có ít nhất **1** [[Học vấn|Education]] và **1** [[Kinh nghiệm làm việc|Work experience]]. Người chưa đi làm chọn [[Không kinh nghiệm|No experience]] thì chỉ cần [[Học vấn|Education]]. Chưa đủ thì CV **chưa ứng tuyển được**.',
    },
    {
      q: 'Nhà tuyển dụng thấy CV nào?',
      a: 'Chỉ **một** CV được bật [[Hiển thị CV với nhà tuyển dụng|Show CV to employers]] — CV đó xuất hiện khi nhà tuyển dụng tìm hồ sơ. Mọi CV khác vẫn đính kèm được khi ứng tuyển.',
    },
  ],
  keyFact: {
    heading: 'Điều quan trọng nhất cần nhớ',
    text:
      'Trình tạo CV **không tự lưu**. Khi tạo CV mới, mọi thứ chỉ nằm trên tab trình duyệt cho tới khi người dùng bấm [[Lưu|Save]] ở thanh dưới cùng — tải lại trang hoặc đóng tab là mất hết. Nút [[Lưu|Save]] nhỏ trong từng mục chỉ ghi tạm vào bản nháp, chưa lưu CV. Phần lớn câu hỏi “tôi đã nhập rồi mà không thấy CV đâu” dừng ở đây.',
  },
  links: [
    { label: 'Mở Quản lý CV', path: '/ho-so-ca-nhan/cv-resume' },
    { label: 'Mở Thêm CV mới', path: '/ho-so-ca-nhan/cv/tao-moi' },
    { label: 'Mở trình tạo CV', path: '/ho-so-ca-nhan/cv/tao' },
    { label: 'Mở Tải CV lên', path: '/ho-so-ca-nhan/cv/tai-len' },
  ],
  subs: [
    { label: 'Tổng quan', blurb: 'Hai loại CV, các màn hình liên quan, và những từ cần biết.' },
    { label: 'Trước khi tạo CV', blurb: 'Thiết lập ban đầu sau khi đăng ký, và điều kiện làm việc mong muốn.' },
    { label: 'Tạo CV Saramin', blurb: 'Trình tạo CV trên web: từng mục, từng ô, cách lưu và khi nào CV hoàn chỉnh.' },
    { label: 'Tải CV lên', blurb: 'Tải file PDF / Word có sẵn; AI đọc và điền thông tin.' },
    { label: 'Quản lý & dùng CV', blurb: 'Danh sách CV, hiển thị với nhà tuyển dụng, ứng tuyển, ai đã xem CV.' },
    { label: 'Tra cứu', blurb: 'Điểm chưa khớp trong build; endpoint và giới hạn cho Developer.' },
  ],
}

export const CV_SECTIONS: GuideSection[] = [
  /* ── TỔNG QUAN ────────────────────────────────────────────────────────── */
  {
    id: 'cv-tong-quan',
    module: M,
    group: 'Tổng quan',
    code: 'TQ',
    label: 'Hai loại CV & màn hình',
    title: 'Hai loại CV và bản đồ màn hình',
    lead: 'Mọi màn hình CV nằm trong **Hồ sơ cá nhân** và cần đăng nhập — chưa đăng nhập thì được đưa sang trang Đăng nhập, xong quay lại đúng trang.',
    blocks: [
      {
        kind: 'table',
        heading: 'CV Saramin và CV tải lên',
        table: {
          cols: ['', 'CV Saramin', 'CV tải lên'],
          rows: [
            ['Tạo bằng', 'Trình tạo CV trên web — nhập từng mục.', 'Tải lên file người dùng đã có.'],
            ['Định dạng', 'Hệ thống tự dựng file PDF theo **một mẫu cố định**.', '**PDF** hoặc **Word (.docx)**, tối đa **10 MB**, 1 file mỗi CV.'],
            ['Nhà tuyển dụng nhận', 'File PDF do Saramin dựng.', 'Đúng file người dùng tải lên.'],
            ['Thông tin để tìm kiếm', 'Lấy từ các mục người dùng nhập.', '**AI đọc file** và rút ra kinh nghiệm, học vấn, chức danh, kỹ năng.'],
            ['Nhãn trong danh sách', '[[CV Saramin|Saramin CV]]', '[[Đã tải lên|Uploaded]]'],
            ['Số lượng', 'Tối đa **10** CV Saramin mỗi tài khoản.', 'Không giới hạn.'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Các màn hình',
        table: {
          cols: ['Màn hình', 'Đường dẫn', 'Dùng để'],
          rows: [
            ['[[Quản lý CV|Resume Management]]', '`/ho-so-ca-nhan/cv-resume`', 'Danh sách mọi CV, tạo mới, tải lên, bật hiển thị với nhà tuyển dụng, tải xuống, xoá.'],
            ['[[Thêm CV mới|Add a new CV]]', '`/ho-so-ca-nhan/cv/tao-moi`', 'Trang chọn 2 hướng: [[Tải CV lên|Upload a CV]] hoặc [[Tạo CV Saramin|Create a Saramin CV]]. Mở từ menu [[Lương & Công cụ|Salary & Tools]] → [[Tạo CV|Create a CV]] trên header.'],
            ['Trình tạo CV', '`/ho-so-ca-nhan/cv/tao`', 'Tạo CV Saramin mới.'],
            ['Sửa CV Saramin', '`/ho-so-ca-nhan/cv/{mã CV}`', 'Sửa một CV Saramin đã lưu.'],
            ['Tải CV lên', '`/ho-so-ca-nhan/cv/tai-len`', 'Tải file CV lên, đặt tên, chọn hiển thị.'],
            ['[[Tình trạng xem CV|CV viewing status]]', '`/ho-so-ca-nhan/luot-xem-cv`', 'Công ty nào đã xem / lưu / mở CV.'],
            ['[[Chỉnh sửa điều kiện làm việc mong muốn|Edit work preference]]', '`/ho-so-ca-nhan/dieu-kien-lam-viec`', 'Vị trí, nơi làm, lĩnh vực, hợp đồng, lương mong muốn — dùng chung cho mọi CV.'],
            ['Chào mừng (thiết lập ban đầu)', '`/chao-mung`', 'Ngay sau đăng ký: 5 câu hỏi. **Không tạo CV.**'],
          ],
        },
      },
      {
        kind: 'flow',
        heading: 'Hành trình thường gặp nhất',
        items: [
          { label: 'Đăng ký → Chào mừng', path: '/chao-mung' },
          { label: '[[Hoàn tất CV và ứng tuyển|Complete your CV and go apply]]', path: '/ho-so-ca-nhan/cv/tao' },
          { label: '[[Lưu|Save]] → [[Quản lý CV|Resume Management]]', path: '/ho-so-ca-nhan/cv-resume' },
          { label: 'Ứng tuyển bằng CV đó' },
        ],
      },
      {
        kind: 'p',
        text: 'Lối vào khác: menu [[Lương & Công cụ|Salary & Tools]] → [[Tạo CV|Create a CV]] trên header, mục [[CV của tôi|My CVs]] → [[Đăng ký CV|Resume Register]] ở menu trái trang Hồ sơ, nút [[Hoàn thiện CV|Complete my CV]] trong hộp nhắc trên trang Hồ sơ khi người dùng chưa có CV hoàn chỉnh.',
      },
    ],
  },
  {
    id: 'cv-tu-dien',
    module: M,
    group: 'Tổng quan',
    code: 'TĐ',
    label: 'Từ điển CV',
    title: 'Từ điển — đọc trước, 3 phút',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['Từ', 'Nghĩa trong hệ thống này'],
          rows: [
            ['CV hiển thị với nhà tuyển dụng', 'CV duy nhất xuất hiện khi nhà tuyển dụng **tìm hồ sơ**. Bật cho CV này thì CV đang bật trước đó tự tắt. Trong thông báo còn gọi là **CV mặc định**.'],
            ['CV hoàn chỉnh', 'Có ít nhất 1 [[Học vấn|Education]] + 1 [[Kinh nghiệm làm việc|Work experience]] (hoặc chỉ [[Học vấn|Education]] nếu chọn [[Không kinh nghiệm|No experience]]). Chỉ CV hoàn chỉnh mới ứng tuyển được.'],
            ['[[Không kinh nghiệm|No experience]]', 'Lựa chọn cạnh tên ở đầu CV (ngược lại là [[Có kinh nghiệm|Experienced]]). Chọn thì mục [[Kinh nghiệm làm việc|Work experience]] thành tuỳ chọn. Mặc định lấy theo câu trả lời lúc thiết lập ban đầu.'],
            ['[[Chưa hoàn thiện|Unfinished]]', 'Nhãn đỏ trong danh sách: CV thiếu [[Học vấn|Education]] / [[Kinh nghiệm làm việc|Work experience]]. Chưa hiển thị với nhà tuyển dụng, chưa ứng tuyển được.'],
            ['[[Không đọc được|Can’t read]] / [[Chưa được duyệt|Not approved]]', 'File tải lên không đọc được chữ, hoặc bị Saramin từ chối khi duyệt. Không bật hiển thị được, không ứng tuyển được.'],
            ['[[Mức hoàn thiện|Completion]]', 'Thanh % trong trình tạo CV ([[Mức độ hoàn thiện CV|CV completeness]]) và trong danh sách. Chỉ tính [[Học vấn|Education]] và [[Kinh nghiệm làm việc|Work experience]] (0 / 50 / 100%) — các mục khác không làm tăng %.'],
            ['Đọc CV bằng AI', 'Khi tải file lên, AI đọc file (sau khi che thông tin cá nhân) và rút ra kinh nghiệm, học vấn, chức danh, kỹ năng. Mất khoảng 1–3 phút.'],
            ['Thông tin tài khoản', 'Họ tên, giới tính, ngày sinh, quốc tịch, email, điện thoại, ảnh, tổng kinh nghiệm, học vấn cao nhất. Thuộc **tài khoản**, không thuộc riêng CV nào — sửa ở một CV là đổi cho mọi CV.'],
            ['[[Điều kiện làm việc mong muốn|Work preference]]', 'Vị trí, nơi làm, lĩnh vực, loại hợp đồng, lương. Dùng chung cho mọi CV, **không in trên CV**; dùng để gợi ý việc làm và cho nhà tuyển dụng tìm.'],
          ],
        },
      },
    ],
  },

  /* ── TRƯỚC KHI TẠO CV ─────────────────────────────────────────────────── */
  {
    id: 'cv-chao-mung',
    module: M,
    group: 'Trước khi tạo CV',
    code: 'B1',
    label: 'Thiết lập ban đầu',
    title: 'Thiết lập ban đầu ngay sau khi đăng ký',
    where: '/chao-mung',
    lead: 'Hiện **một lần duy nhất**, sau lần đăng ký / đăng nhập đầu tiên. Không có nút bỏ qua. Câu trả lời lưu vào tài khoản — **chưa có CV nào được tạo ở bước này**.',
    blocks: [
      {
        kind: 'table',
        heading: '5 câu hỏi',
        table: {
          cols: ['Bước', 'Câu hỏi trên màn hình', 'Trả lời'],
          rows: [
            ['1', '“Bạn đang tìm công việc như thế nào?”', '[[Vị trí công việc|Job role]], [[Lĩnh vực|Industry]], [[Hình thức làm việc|Contract type]] — mỗi mục tối đa 3. Bắt buộc.'],
            ['2', '“Bạn muốn làm việc ở đâu?”', '[[Nơi làm việc|Job locations]] theo Miền → Tỉnh/thành, tối đa 3, tối thiểu 1. Bắt buộc.'],
            ['3', '“Vui lòng nhập thông tin kinh nghiệm làm việc”', '[[Tổng số năm kinh nghiệm|Total years of work experience]]. Bắt buộc.'],
            ['4', '“Vui lòng nhập trình độ học vấn cao nhất”', '[[Trình độ học vấn cao nhất|Highest level of education]]. Bắt buộc.'],
            ['5', '“Mức lương bạn mong đợi là bao nhiêu?”', 'Số tiền (VND / USD) hoặc tick [[Thương lượng|Negotiable]]. Không bắt buộc.'],
          ],
        },
      },
      {
        kind: 'steps',
        heading: 'Kết thúc',
        items: [
          'Màn hình cuối liệt kê việc làm phù hợp với câu trả lời.',
          'Nút [[Hoàn tất CV và ứng tuyển|Complete your CV and go apply]] mở thẳng trình tạo CV. Nút [[Quay lại việc bạn đang làm|Back to what you were doing]] đưa về trang người dùng định vào trước khi đăng ký (ví dụ tin vừa bấm [[Nộp đơn|Apply]]).',
        ],
      },
      {
        kind: 'tip',
        text: 'Câu trả lời bước 1, 2, 5 thành [[Điều kiện làm việc mong muốn|Work preference]]; bước 3 quyết định CV mặc định là [[Có kinh nghiệm|Experienced]] hay [[Không kinh nghiệm|No experience]]. Chưa xong bước này thì trang [[Quản lý CV|Resume Management]] hiện banner “Hoàn tất phần thiết lập còn dang dở…” với nút [[Thiết lập ngay|Get onboard]].',
      },
    ],
  },
  {
    id: 'cv-dieu-kien',
    module: M,
    group: 'Trước khi tạo CV',
    code: 'B2',
    label: 'Điều kiện làm việc',
    title: 'Điều kiện làm việc mong muốn',
    where: '/ho-so-ca-nhan/dieu-kien-lam-viec',
    lead: 'Hiện thành khung [[Điều kiện làm việc mong muốn|Work preference]] trên trang [[Quản lý CV|Resume Management]]; bấm [[Sửa điều kiện làm việc mong muốn|Edit work preference]] để mở trang [[Chỉnh sửa điều kiện làm việc mong muốn|Edit work preference]].',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['Ô', 'Quy tắc'],
          rows: [
            ['[[Ngành nghề|Job role]]', 'Bắt buộc, tối đa 3.'],
            ['[[Nơi làm việc|Work location]]', 'Bắt buộc, tối đa 3.'],
            ['[[Lĩnh vực|Industry]]', 'Bắt buộc, tối đa 3.'],
            ['[[Loại hợp đồng|Contract type]]', 'Bắt buộc, chọn bằng ô tick.'],
            ['[[Lương tháng|Monthly salary]]', 'Bắt buộc.'],
          ],
        },
      },
      {
        kind: 'p',
        text: 'Nút [[Lưu điều kiện làm việc|Save work preference]] chỉ bấm được khi đủ 5 ô. Một bộ điều kiện cho **cả tài khoản** — không có điều kiện riêng cho từng CV, và **không in lên CV / PDF**. Dùng để gợi ý việc làm, đề xuất vị trí và để nhà tuyển dụng tìm thấy.',
      },
    ],
  },

  /* ── TẠO CV SARAMIN ───────────────────────────────────────────────────── */
  {
    id: 'cv-bat-dau',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T1',
    label: 'Bắt đầu tạo CV',
    title: 'Bắt đầu tạo CV Saramin',
    where: '/ho-so-ca-nhan/cv/tao-moi → /ho-so-ca-nhan/cv/tao',
    blocks: [
      {
        kind: 'steps',
        items: [
          'Vào [[Quản lý CV|Resume Management]] → khung [[Bạn muốn tạo CV?|Want to create your CV?]] → bấm [[Tạo CV Saramin|Create Saramin CV]]. (Hoặc từ header [[Lương & Công cụ|Salary & Tools]] → [[Tạo CV|Create a CV]] → trang [[Thêm CV mới|Add a new CV]] → thẻ [[Tạo CV Saramin|Create a Saramin CV]].)',
          'Trình tạo CV mở ra **trống**. Không có bước chọn mẫu, không chọn ngôn ngữ CV.',
          'Kiểm tra phần đầu trang: tên, giới tính, ngày sinh, quốc tịch, email, điện thoại, ảnh — lấy từ tài khoản. Chọn [[Có kinh nghiệm|Experienced]] / [[Không kinh nghiệm|No experience]] cạnh tên.',
          'Điền các mục bên dưới. Mục bắt buộc ([[Học vấn|Education]], và [[Kinh nghiệm làm việc|Work experience]] nếu có kinh nghiệm) **tự mở sẵn** ô nhập.',
          'Trong mỗi mục, bấm [[Thêm|Add]] để mở ô nhập ngay dưới mục đó → điền → bấm [[Lưu|Save]] của mục.',
          'Cuối trang, trả lời câu [[Bạn có muốn hiển thị CV với nhà tuyển dụng?|Do you want to show your CV to recruiters?]] (bắt buộc).',
          'Đặt [[Tên CV|CV Title]] ở thanh dưới cùng (có thể để trống) → bấm [[Lưu|Save]] ở thanh dưới cùng. Xong thì về trang [[Quản lý CV|Resume Management]].',
        ],
      },
      {
        kind: 'table',
        heading: 'Bố cục trình tạo CV',
        table: {
          cols: ['Vùng', 'Có gì'],
          rows: [
            ['Giữa', 'Phần thông tin cá nhân → banner [[Nhập CV|Import CV]] → 10 mục của CV → câu hỏi hiển thị với nhà tuyển dụng → lưu ý an toàn.'],
            ['Cột phải (cố định)', '[[Mức độ hoàn thiện CV|CV completeness]] (%) và danh sách 10 mục; bấm một mục để nhảy tới. Mục bắt buộc gắn nhãn [[Bắt buộc|Required]]; 4 mục tuỳ chọn có nút + ([[Thêm mục|Add section]]) / − ([[Bỏ mục|Remove section]]).'],
            ['Thanh dưới cùng (cố định)', 'Ô [[Tên CV|CV Title]], nút [[Xem trước hồ sơ|Resume preview]], nút [[Lưu|Save]].'],
          ],
        },
      },
      {
        kind: 'warn',
        text: 'Trên trang [[Thêm CV mới|Add a new CV]], nút [[Tải PDF để điền sẵn|Upload a PDF to pre-fill]] dưới thẻ [[Tạo CV Saramin|Create a Saramin CV]] **không điền sẵn CV mới**: file được lưu thành một CV tải lên riêng, thông tin đọc được đưa vào tài khoản, rồi trình tạo CV vẫn mở **trống**. Muốn điền sẵn từ file, dùng [[Nhập CV|Import CV]] ngay trong trình tạo CV (xem T5).',
      },
    ],
  },
  {
    id: 'cv-thong-tin-ca-nhan',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T2',
    label: 'Thông tin cá nhân & ảnh',
    title: 'Thông tin cá nhân và ảnh',
    lead: 'Bấm biểu tượng bút ([[Chỉnh sửa|Edit]]) ở phần đầu CV để mở khung [[Thông tin cơ bản|Basic information]]. Những thông tin này thuộc **tài khoản**: bấm [[Lưu|Save]] là ghi ngay vào tài khoản và **đổi trên mọi CV** — kể cả khi CV đang tạo chưa được lưu.',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['Ô', 'Quy tắc'],
          rows: [
            ['[[Họ và tên|Full name]]', 'Chỉ xem — “Lấy từ tài khoản — không sửa được ở đây.”'],
            ['[[Giới tính|Gender]] *', '[[Nam|Male]] / [[Nữ|Female]] / [[Khác|Other]] / [[Không muốn tiết lộ|Prefer not to say]].'],
            ['[[Ngày sinh|Date of birth]] *', 'Không được ở tương lai — “Ngày sinh không thể ở trong tương lai”.'],
            ['[[Quốc tịch|Nationality]]', '[[Việt Nam|Vietnam]] / [[Quốc tế|International]].'],
            ['[[Email|Email]]', 'Chỉ xem.'],
            ['[[Điện thoại|Phone]]', 'Chỉ xem, kèm mã quốc gia.'],
          ],
        },
      },
      {
        kind: 'steps',
        heading: 'Ảnh hồ sơ',
        items: [
          'Trong [[Thông tin cơ bản|Basic information]], bấm [[Thêm ảnh|Add photo]] (hoặc [[Đổi ảnh|Change photo]]) → hộp [[Tải ảnh lên|Upload photo]].',
          'Bấm [[Chọn tệp|Choose file]]: ảnh **JPG, PNG hoặc GIF dưới 10MB**.',
          'Kéo chuột trên ảnh để chọn vùng hiển thị — khung cố định tỉ lệ dọc **100×140**.',
          'Bấm [[Đăng ký|Register]], rồi [[Lưu|Save]] khung [[Thông tin cơ bản|Basic information]]. Ảnh đổi trên **mọi CV**.',
        ],
      },
      {
        kind: 'warn',
        text: 'File PDF của CV Saramin **không in ảnh, ngày sinh, giới tính và quốc tịch** — chỉ có tên, email, điện thoại và các mục của CV. Ảnh hiện trên trang hồ sơ, không có trên PDF.',
      },
      {
        kind: 'warn',
        text: 'Nếu tài khoản chưa có số điện thoại, phần đầu CV hiện link [[Vui lòng nhập số điện thoại|Please enter your mobile number]] ›, nhưng ô [[Điện thoại|Phone]] trong [[Thông tin cơ bản|Basic information]] là **chỉ xem** — hiện không thêm được số từ trình tạo CV.',
      },
    ],
  },
  {
    id: 'cv-cac-muc',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T3',
    label: '10 mục của CV',
    title: '10 mục của CV và thứ tự',
    lead: 'Thứ tự các mục **cố định**, người dùng không đổi được. Riêng khi chọn [[Không kinh nghiệm|No experience]], [[Học vấn|Education]] được đưa lên trên [[Kinh nghiệm làm việc|Work experience]].',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['#', 'Mục', 'Bắt buộc?', 'Ghi chú'],
          rows: [
            ['1', '[[Giới thiệu|About]]', 'Không', 'Một đoạn tóm tắt sự nghiệp và mục tiêu nghề nghiệp, tối đa 4000 ký tự. (Không có mục “Mục tiêu nghề nghiệp” riêng.)'],
            ['2', '[[Kinh nghiệm làm việc|Work experience]]', '**Có** — trừ khi chọn [[Không kinh nghiệm|No experience]]', 'Không xoá được mục cuối cùng khi đang bắt buộc.'],
            ['3', '[[Học vấn|Education]]', '**Có**', 'Luôn phải còn ít nhất 1 mục.'],
            ['4', '[[Dự án nổi bật|Highlight projects]]', 'Không', 'Cả hoạt động tình nguyện, câu lạc bộ, cộng đồng.'],
            ['5', '[[Kỹ năng|Skills]]', 'Không', 'Chọn từ danh mục, tối đa 20.'],
            ['6', '[[Ngoại ngữ|Foreign languages]]', 'Không', ''],
            ['7', '[[Chứng chỉ|Certificates]]', 'Không — ẩn sẵn', 'Bật bằng nút + ([[Thêm mục|Add section]]) ở cột phải.'],
            ['8', '[[Giải thưởng|Awards]]', 'Không — ẩn sẵn', 'Bật bằng nút + ([[Thêm mục|Add section]]) ở cột phải.'],
            ['9', '[[Hoạt động|Activities]]', 'Không — ẩn sẵn', 'Bật bằng nút + ([[Thêm mục|Add section]]) ở cột phải.'],
            ['10', '[[Người tham chiếu|References]]', 'Không — ẩn sẵn', 'Bật bằng nút + ([[Thêm mục|Add section]]) ở cột phải.'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Thao tác trong một mục',
        table: {
          cols: ['Muốn', 'Làm'],
          rows: [
            ['Thêm một dòng', 'Bấm [[Thêm|Add]] ở đầu mục → điền → [[Lưu|Save]] (hoặc [[Hủy|Cancel]]).'],
            ['Sửa / xoá một dòng', 'Biểu tượng bút [[Sửa|Edit]] / thùng rác [[Xóa|Delete]] → “Bạn có muốn xóa mục này không?”.'],
            ['Đổi thứ tự trong [[Kinh nghiệm làm việc|Work experience]]', 'Nút ⇅ [[Thay đổi thứ tự|Change order]] → [[Sắp xếp theo mới nhất|Sort by newest]] hoặc sắp xếp tay → [[Hoàn tất|Done]].'],
            ['Đổi thứ tự ở mục khác', 'Kéo thả các dòng ([[Kỹ năng|Skills]]: kéo biểu tượng ở đầu dòng).'],
            ['Bỏ một mục tuỳ chọn', 'Nút − ([[Bỏ mục|Remove section]]) ở cột phải → “Bỏ mục này khỏi hồ sơ?”. Nội dung đã nhập vẫn được giữ.'],
          ],
        },
      },
      {
        kind: 'p',
        text: 'Quy tắc chung cho mọi ô: tên ô hiện ngay trong ô, ô bắt buộc có dấu `*`. Ngày tháng chọn theo **tháng/năm**. Ô mô tả dài có [[In đậm|Bold]], [[In nghiêng|Italic]], [[Danh sách gạch đầu dòng|Bulleted list]] / [[Danh sách đánh số|Numbered list]], bộ đếm “… / 5000 ký tự”. Lỗi chung: “Trường này là bắt buộc”, “Ngày kết thúc không thể trước ngày bắt đầu”, “Ngày bắt đầu không thể ở trong tương lai”.',
      },
    ],
  },
  {
    id: 'cv-kinh-nghiem-hoc-van',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T4',
    label: 'Kinh nghiệm & Học vấn',
    title: 'Kinh nghiệm làm việc và Học vấn — hai mục quyết định CV hoàn chỉnh',
    blocks: [
      {
        kind: 'table',
        heading: 'Kinh nghiệm làm việc — mỗi dòng',
        table: {
          cols: ['Ô', 'Bắt buộc?', 'Ghi chú'],
          rows: [
            ['[[Chức danh|Job title]]', '**Có**', 'Tối đa 255 ký tự.'],
            ['[[Công ty|Company]]', '**Có**', 'Tối đa 255 ký tự.'],
            ['[[Từ tháng|From month]]', '**Có**', 'Không ở tương lai.'],
            ['[[Đến tháng|To month]]', 'Có — trừ khi bật [[Công việc hiện tại|Current job]]', 'Không ở tương lai, không trước [[Từ tháng|From month]].'],
            ['[[Công việc hiện tại|Current job]]', 'Không', 'Bật thì [[Đến tháng|To month]] bị xoá và hiện [[Hiện tại|Present]].'],
            ['[[Mô tả|Description]]', 'Không', 'Gợi ý trong ô: chọn lọc việc quan trọng, tóm tắt vai trò, quy mô nhóm, đóng góp và kết quả.'],
          ],
        },
      },
      {
        kind: 'p',
        text: 'Đầu mục có chip [[Tổng kinh nghiệm|Total experience]]. Bút cạnh chip mở [[Sửa tổng số kinh nghiệm|Edit total experience]]: hệ thống tự cộng (có tuỳ chọn [[Trừ khoảng thời gian trùng|Exclude overlapping periods]]), hoặc tick [[Nhập trực tiếp|Enter manually]] để gõ số năm / tháng. Con số này lưu vào **tài khoản**.',
      },
      {
        kind: 'table',
        heading: 'Học vấn — mỗi dòng',
        note: 'Chọn [[Bằng cấp|Degree]] trước; các ô còn lại hiện ra sau khi chọn.',
        table: {
          cols: ['Ô', 'Bắt buộc?', 'Ghi chú'],
          rows: [
            ['[[Bằng cấp|Degree]]', '**Có**', '[[THPT|High school]] · [[Trung cấp|Vocational]] · [[Cao đẳng|College / Associate]] · [[Đại học|Bachelor]] · [[Thạc sĩ|Master]] · [[Tiến sĩ|Doctorate (PhD)]] · [[Khác|Other]].'],
            ['[[Trường|School]]', '**Có** (trừ [[THPT|High school]] và [[Khác|Other]])', ''],
            ['[[Chuyên ngành|Major]]', '**Có** (trừ [[THPT|High school]] và [[Khác|Other]])', ''],
            ['[[Điểm số|Score]]', 'Không', 'Gõ tự do, ví dụ “3.4 / 4.0” hoặc “Giỏi”.'],
            ['[[Từ|From]] / [[Đến|To]]', 'Không', '[[Đến|To]] được phép ở tương lai (dự kiến tốt nghiệp).'],
            ['[[Đang diễn ra|Currently ongoing]]', 'Không', ''],
            ['[[Thành tích|Achievement]]', 'Không', 'Ô mô tả dài.'],
          ],
        },
      },
      {
        kind: 'p',
        text: 'Dòng đầu tiên gắn nhãn [[Trình độ cao nhất|Highest level of education]]. Bút ở đầu mục mở [[Sửa trình độ học vấn cao nhất|Edit highest education]] để chọn dòng nào là cao nhất — cũng lưu vào **tài khoản**.',
      },
      {
        kind: 'tip',
        text: 'Người chọn [[Không kinh nghiệm|No experience]] mà chưa có dòng kinh nghiệm nào sẽ thấy: “Bạn đã đánh dấu là chưa có kinh nghiệm. Mục Kinh nghiệm làm việc không bắt buộc.” — CV hoàn chỉnh khi đã có [[Học vấn|Education]].',
      },
    ],
  },
  {
    id: 'cv-ky-nang-khac',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T5',
    label: 'Kỹ năng, Ngoại ngữ & mục khác',
    title: 'Kỹ năng, Ngoại ngữ và các mục còn lại',
    blocks: [
      {
        kind: 'steps',
        heading: 'Kỹ năng',
        items: [
          'Gõ vào ô [[Vui lòng nhập công cụ/kỹ năng|Please enter tools/skills]] rồi tick trong danh sách, hoặc bấm nhanh trong đám gợi ý [[Kỹ năng phổ biến trong Vị trí mong muốn|Popular skills in Desired job role]] (nút [[Xem nhóm kỹ năng khác|Show other skills]] để đổi gợi ý).',
          '**Chỉ chọn được kỹ năng có trong danh mục** — gõ tự do không được lưu.',
          'Tối đa **20 kỹ năng** mỗi CV. Đủ 20: “Đã đạt tối đa 20 kỹ năng. Hãy bỏ bớt một kỹ năng để thêm kỹ năng khác.”',
          'Vòng tiến độ [[Kỹ năng của tôi|My skills]] nhắc: “Chọn thêm {n} kỹ năng nữa thì cơ hội nhận được lời mời sẽ tăng.”; từ 5 kỹ năng: “Đây là một bộ kỹ năng rất tốt.”',
        ],
      },
      {
        kind: 'table',
        heading: 'Các mục còn lại — ô bắt buộc có dấu *',
        table: {
          cols: ['Mục', 'Các ô'],
          rows: [
            ['[[Ngoại ngữ|Foreign languages]]', '[[Ngôn ngữ|Language]] * ([[Tiếng Việt|Vietnamese]], [[Tiếng Anh|English]], [[Tiếng Nhật|Japanese]], [[Tiếng Hàn|Korean]], [[Tiếng Trung|Chinese]], [[Tiếng Pháp|French]], [[Tiếng Đức|German]], [[Khác|Other]]) · [[Trình độ|Proficiency]] * ([[Sơ cấp (A1)|Beginner (A1)]], [[Sơ cấp (A2)|Elementary (A2)]], [[Trung cấp (B1)|Intermediate (B1)]], [[Trung cao (B2)|Upper-intermediate (B2)]], [[Cao cấp (C1)|Advanced (C1)]], [[Thành thạo (C2)|Proficient (C2)]], [[Bản ngữ|Native]]). Không có ô điểm / chứng chỉ.'],
            ['[[Dự án nổi bật|Highlight projects]]', '[[Tên dự án|Project name]] * · [[Từ|From]] · [[Đến|To]] · [[Đang diễn ra|Currently ongoing]] · [[Bạn đã làm gì và thay đổi được gì|What you did and what changed]] · [[Liên kết (demo / repo / case study / bài công bố)|Link (demo / repo / case study / publication)]].'],
            ['[[Chứng chỉ|Certificates]]', '[[Tên chứng chỉ|Certificate name]] * · [[Tổ chức cấp|Issuing organisation]] · [[Ngày cấp|Issue date]] · [[Mã hoặc đường dẫn chứng chỉ|Credential ID or URL]] · [[Mô tả|Description]].'],
            ['[[Giải thưởng|Awards]]', '[[Tên giải thưởng|Award name]] * · [[Được trao bởi|Awarded by]] · [[Ngày trao|Issue date]] · [[Trao cho việc gì|What it was for]].'],
            ['[[Hoạt động|Activities]]', '[[Tên chương trình|Program name]] * · [[Tổ chức / câu lạc bộ|Organisation / club]] · [[Vai trò của bạn|Your role]] · [[Từ|From]] * · [[Đến|To]] · [[Vẫn đang tham gia|Still involved]] · [[Bạn đã làm gì|What you did]].'],
            ['[[Người tham chiếu|References]]', '[[Họ và tên|Full name]] * · [[Chức danh|Job title]] * · [[Công ty|Company]] * · [[Điện thoại|Phone]] (chỉ chữ số) · [[Email|Email]].'],
          ],
        },
      },
      {
        kind: 'steps',
        heading: 'Nhập nội dung từ CV có sẵn (banner Nhập CV)',
        items: [
          'Trong trình tạo CV, bấm [[Nhập CV|Import CV]] trên banner “Tự động điền hồ sơ của bạn từ CV đã tải lên, chỉ trong vài phút.”',
          'Hộp [[Chọn CV muốn lấy nội dung|Choose the CV to import]]: chọn một CV đã được AI đọc xong ([[CV đã đọc xong|CVs already read]]), hoặc [[Tải CV lên|Upload a CV]] một PDF (file này chỉ dùng để điền, không thêm vào danh sách CV).',
          'Xác nhận “Nhập hồ sơ này đè lên hồ sơ hiện tại?” — nội dung đọc được **thay thế** những gì đang có trong trình tạo CV.',
          'Kiểm tra, sửa lại, rồi bấm [[Lưu|Save]] ở thanh dưới cùng. Chưa bấm [[Lưu|Save]] thì chưa có gì được lưu.',
        ],
      },
    ],
  },
  {
    id: 'cv-luu',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T6',
    label: 'Lưu & xem trước',
    title: 'Lưu CV, xem trước, và khi nào CV hoàn chỉnh',
    blocks: [
      {
        kind: 'table',
        heading: 'Hai nút Lưu khác nhau',
        table: {
          cols: ['Nút', 'Khi tạo CV mới', 'Khi sửa CV đã có'],
          rows: [
            ['[[Lưu|Save]] trong từng mục', 'Chỉ ghi vào bản nháp trên trình duyệt. Không có thông báo.', 'Lưu ngay lên hệ thống, hiện “Đã lưu”.'],
            ['[[Lưu|Save]] ở thanh dưới cùng', 'Tạo CV thật: lưu mọi mục, dựng file PDF, thêm vào danh sách, đặt tên, bật hiển thị nếu chọn. Rồi về [[Quản lý CV|Resume Management]].', 'Lưu tên CV, [[Có kinh nghiệm|Experienced]] / [[Không kinh nghiệm|No experience]] và lựa chọn hiển thị. Rồi về [[Quản lý CV|Resume Management]].'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Khi nào bấm Lưu bị chặn',
        note: 'Mục có vấn đề chuyển đỏ ở cột phải.',
        table: {
          cols: ['Thông báo', 'Cách xử lý'],
          rows: [
            ['“Vui lòng lưu tất cả nội dung đang soạn trước khi hoàn tất.”', 'Còn ô nhập đang mở — bấm [[Lưu|Save]] hoặc [[Hủy|Cancel]] của mục đó.'],
            ['“Vui lòng điền Kinh nghiệm làm việc, Học vấn trước khi hoàn tất.”', 'Thêm ít nhất 1 dòng cho mục bắt buộc.'],
            ['“Vui lòng chọn có hiển thị CV với nhà tuyển dụng hay không.”', 'Trả lời câu hỏi cuối trang.'],
            ['“Bạn đã đạt số CV tối đa. Hãy xoá bớt một CV trước khi tạo CV mới.”', 'Đã có 10 CV Saramin (xem cảnh báo bên dưới).'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Mức hoàn thiện CV',
        table: {
          cols: ['Trường hợp', 'Cách tính'],
          rows: [
            ['[[Có kinh nghiệm|Experienced]]', '[[Kinh nghiệm làm việc|Work experience]] 50% + [[Học vấn|Education]] 50% → 0%, 50% hoặc 100%.'],
            ['[[Không kinh nghiệm|No experience]]', '[[Học vấn|Education]] 100% → 0% hoặc 100%.'],
            ['Các mục khác', 'Không làm thay đổi %.'],
          ],
        },
      },
      {
        kind: 'p',
        text: '[[Tên CV|CV Title]] tối đa 255 ký tự; để trống thì hệ thống đặt: “CV của {tên} – Tổng kinh nghiệm {số năm}”, hoặc “CV của {tên} – Chưa có kinh nghiệm”.',
      },
      {
        kind: 'p',
        text: '[[Xem trước hồ sơ|Resume preview]] mở cửa sổ mới hiển thị CV như nhà tuyển dụng thấy, kèm dòng đỏ “Đây là bản xem thử nội dung bạn đã nhập. Bấm Lưu để lưu CV.” Mục trống bị ẩn; ngày sinh chỉ hiện năm. In CV: dùng Ctrl+P trong cửa sổ xem trước.',
      },
      {
        kind: 'warn',
        text: 'Không có tự lưu. Rời trang bằng logo / menu / nút Quay lại thì hỏi “Rời khỏi trang khi chưa lưu?”; tải lại hoặc đóng tab thì trình duyệt cảnh báo. Chọn rời là **mất toàn bộ** CV đang tạo.',
      },
      {
        kind: 'warn',
        text: 'Mỗi tài khoản tạo được tối đa **10 CV Saramin**. **Xoá CV không trả lại lượt** — sau khoảng 10 lần tạo, người dùng không tạo thêm được CV Saramin, kể cả khi đã xoá bớt. (CV tải lên không bị giới hạn.)',
      },
      {
        kind: 'warn',
        text: 'Sửa một CV Saramin đã lưu **không cập nhật file PDF** của nó: tải xuống và hồ sơ ứng tuyển vẫn dùng bản PDF cũ.',
      },
    ],
  },
  {
    id: 'cv-ngon-ngu-mau',
    module: M,
    group: 'Tạo CV Saramin',
    code: 'T7',
    label: 'Ngôn ngữ & mẫu CV',
    title: 'Ngôn ngữ CV và mẫu CV',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['Câu hỏi', 'Trả lời theo build hiện tại'],
          rows: [
            ['Có chọn mẫu CV không?', '**Không.** File PDF dựng theo một mẫu cố định. Trang “Mẫu CV” trên site hiện là dữ liệu demo.'],
            ['Có CV tiếng Việt / tiếng Anh riêng không?', '**Không.** Nội dung người dùng nhập giữ nguyên; nhãn (tên mục, trình độ…) theo ngôn ngữ đang dùng trên site. PDF dựng bằng tiếng Việt hoặc tiếng Anh.'],
            ['Đổi thứ tự các mục được không?', '**Không.** Chỉ đổi được thứ tự các dòng trong một mục.'],
            ['Có ô lương, nơi làm việc, lý do nghỉ việc trong Kinh nghiệm không?', '**Không** — các ô này có trong code nhưng chưa hiển thị.'],
          ],
        },
      },
    ],
  },

  /* ── TẢI CV LÊN ───────────────────────────────────────────────────────── */
  {
    id: 'cv-tai-len',
    module: M,
    group: 'Tải CV lên',
    code: 'U1',
    label: 'Tải file CV lên',
    title: 'Tải file CV có sẵn lên',
    where: '/ho-so-ca-nhan/cv/tai-len',
    lead: 'Cho người đã có CV bằng PDF / Word. Nhà tuyển dụng nhận **đúng file** đã tải lên; AI đọc file để hệ thống biết kinh nghiệm, học vấn, kỹ năng.',
    blocks: [
      {
        kind: 'steps',
        items: [
          'Vào [[Quản lý CV|Resume Management]] → bấm [[Tự động tạo từ file|Auto-create from file]] (nhãn [[Tải file lên, xong nhanh!|Upload a file, finish fast!]]).',
          'Ở mục [[Tệp CV|Resume file]] ([[Bắt buộc|Required]]), bấm + [[Thêm tệp|Add file]] → hộp [[Đính kèm tệp|File attachment]] → [[Chọn tệp|Choose File]] → [[Đăng ký|Registration]].',
          'Chờ “Đang tải tệp lên” — **khoảng 1–3 phút**, không đóng được hộp này; rời màn hình thì file không tải xong.',
          '“Đã tải tệp lên thành công.” → [[Xác nhận|Confirmation]]. File hiện bản xem trước bên dưới.',
          'Chọn [[Kinh nghiệm|Work experience]]: [[Có kinh nghiệm|Experienced]] / [[Không kinh nghiệm|No experience]] (ở đầu trang).',
          'Trả lời [[Bạn có muốn hiển thị CV với nhà tuyển dụng?|Do you want to show your CV to recruiters?]] (bắt buộc).',
          'Đặt [[Tên CV|CV Title]] (có thể để trống) → [[Lưu|Save]] → “Đã lưu CV.”, về [[Quản lý CV|Resume Management]].',
        ],
      },
      {
        kind: 'table',
        heading: 'File được chấp nhận',
        table: {
          cols: ['', 'Quy tắc'],
          rows: [
            ['Định dạng', '**PDF** hoặc **Word .docx**. File **.doc** (Word cũ) bị từ chối với lỗi chung “Đã xảy ra lỗi. Vui lòng thử lại.”'],
            ['Dung lượng', 'Tối đa **10 MB**.'],
            ['Số file', '1 file cho mỗi CV. Muốn nhiều CV thì tải lên nhiều lần. Không giới hạn số CV tải lên.'],
            ['Nội dung cần có', 'Cột phải [[Tệp của bạn cần có|What your file should include]] liệt kê các phần nên có; [[Học vấn|Education]] bắt buộc, [[Kinh nghiệm làm việc|Work experience]] bắt buộc nếu chọn [[Có kinh nghiệm|Experienced]].'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Sau khi tải lên, AI đọc file',
        table: {
          cols: ['Kết quả', 'Người dùng thấy'],
          rows: [
            ['Đọc được, đủ [[Học vấn|Education]] (+ [[Kinh nghiệm làm việc|Work experience]] nếu có)', 'CV dùng được ngay để ứng tuyển và bật hiển thị.'],
            ['Đọc được nhưng thiếu', 'Nhãn đỏ [[Chưa hoàn thiện|Unfinished]], thanh [[Mức hoàn thiện|Completion]], nút [[Hoàn thiện CV|Complete CV]]. Trong trang CV: “CV của bạn chưa hoàn thiện”.'],
            ['Không đọc được chữ (ví dụ file ảnh scan)', 'Nhãn đỏ [[Không đọc được|Can’t read]].'],
            ['Bị Saramin từ chối khi duyệt', '“CV chưa được duyệt” kèm lời nhắn của người duyệt.'],
          ],
        },
      },
      {
        kind: 'warn',
        text: 'Với CV đã có, bấm ✕ → [[Xoá tệp|Remove file]] trong trang này là **xoá cả CV** (kèm các hệ quả như xoá ở trang [[Quản lý CV|Resume Management]] — xem Q1), và ở đây không có chặn “CV cuối cùng”.',
      },
      {
        kind: 'warn',
        text: 'CV tải lên **đầu tiên** của một người được AI đọc xong sẽ **tự động thành CV hiển thị với nhà tuyển dụng** nếu họ chưa có CV nào đang hiển thị — dù người dùng chưa chọn.',
      },
      {
        kind: 'p',
        text: 'Lối khác: trang [[Thêm CV mới|Add a new CV]] → thẻ [[Tải CV lên|Upload a CV]]: tải file → đề nghị [[Chuyển sang mẫu Saramin|Convert to Saramin template]] → AI đọc (“Đang đọc CV của bạn bằng AI…”) → so sánh kết quả hai bên → [[Xong|Done]]. Khi lưu hỏi “Cho nhà tuyển dụng tìm thấy CV này?”.',
      },
    ],
  },

  /* ── QUẢN LÝ & DÙNG CV ────────────────────────────────────────────────── */
  {
    id: 'cv-quan-ly',
    module: M,
    group: 'Quản lý & dùng CV',
    code: 'Q1',
    label: 'Trang Quản lý CV',
    title: 'Trang Quản lý CV',
    where: '/ho-so-ca-nhan/cv-resume',
    blocks: [
      {
        kind: 'table',
        heading: 'Từ trên xuống',
        table: {
          cols: ['Khối', 'Nội dung'],
          rows: [
            ['Hai thẻ đầu trang', '[[Tình trạng xem CV|CV viewing status]] — “{n} công ty đã xem CV của bạn”, link [[Xem chi tiết|View detail]]. [[Bạn muốn tạo CV?|Want to create your CV?]] — nút [[Tạo CV Saramin|Create Saramin CV]] và [[Tự động tạo từ file|Auto-create from file]].'],
            ['[[Điều kiện làm việc mong muốn|Work preference]]', '5 ô tóm tắt + nút [[Sửa điều kiện làm việc mong muốn|Edit work preference]]. (Chưa xong thiết lập ban đầu thì là banner [[Thiết lập ngay|Get onboard]].)'],
            ['Nhắc bật hiển thị', 'Chỉ khi có CV nhưng **không CV nào** hiển thị: “… bật nhận đề xuất vị trí để biết CV của bạn cạnh tranh đến đâu!” — ô [[Chọn CV|Choose a CV]] → [[Cho phép tìm kiếm|Let employers find me]].'],
            ['Thẻ CV nổi bật', 'CV đang hiển thị, nhãn xanh [[Nhà tuyển dụng thấy CV này|Employers see this CV]]: ngày sửa, tên, loại CV, 4 thông tin ([[Tổng số năm kinh nghiệm|Total years of experience]], [[Học vấn|Education]], [[Chức danh gần nhất|Latest job title]], [[Kỹ năng|Skills]]), số lượt xem, số lần ứng tuyển, nút [[Chỉnh sửa|Edit]].'],
            ['Bộ lọc', '[[Tổng {n}|Total {n}]] · [[Tất cả|All]] / [[CV Saramin|Saramin CV]] / [[Đã tải lên|Uploaded]].'],
            ['Danh sách', 'Mọi CV (CV đang hiển thị đứng đầu). Mỗi dòng: nhãn đỏ nếu chưa dùng được, tên, loại, [[Mức hoàn thiện|Completion]], ô chọn hiển thị, 4 thông tin, [[Số lần ứng tuyển|Applications]], nút [[Chỉnh sửa|Edit]] hoặc [[Hoàn thiện CV|Complete CV]], ô [[Nhập ghi chú|Enter memo]].'],
            ['[[Lưu ý|Please note]]', '4 dòng: không giới hạn số CV lưu giữ; chỉ 1 CV được tìm kiếm; bật CV này tự tắt CV kia; dùng nút bên phải để tải xuống / xoá.'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Thao tác với một CV',
        table: {
          cols: ['Thao tác', 'Ở đâu', 'Ghi chú'],
          rows: [
            ['Sửa', 'Nút [[Chỉnh sửa|Edit]] / bấm tên CV', 'CV Saramin mở trình tạo CV; CV tải lên mở trang Tải CV lên.'],
            ['Đổi tên', 'Ô [[Tên CV|CV Title]] trong trang sửa, hoặc bút chì ([[Đổi tên CV|Rename this CV]]) khi chọn CV lúc ứng tuyển', 'Không có trong menu ⋯ ([[Thêm tùy chọn|More actions]]).'],
            ['Tải xuống', 'Menu ⋯ → [[Tải xuống|Download]]', 'Mở file trong tab mới.'],
            ['Xoá', 'Menu ⋯ → [[Xóa|Delete]] → “Xóa CV này?”', '**Không xoá được CV cuối cùng.** Thông báo “Đã xóa CV.”'],
            ['Hiển thị / ẩn với nhà tuyển dụng', 'Ô chọn trên dòng CV', 'Chỉ với CV hoàn chỉnh. Xem Q2.'],
          ],
        },
      },
      {
        kind: 'warn',
        text: 'Xoá CV **không hoàn tác được**. Các hồ sơ ứng tuyển **đang xử lý** gửi bằng CV đó bị **rút lại**, nhà tuyển dụng được báo và không xem được CV nữa. Nếu là CV đang hiển thị, thông tin hồ sơ đọc từ CV này cũng bị xoá (phần người dùng tự nhập vẫn giữ).',
      },
      {
        kind: 'p',
        text: 'Không còn: Nhân bản, Đổi tên và In trong menu ⋯ (đã bỏ ngày 30/09). Ô [[Nhập ghi chú|Enter memo]] trên mỗi CV hiện **chưa được lưu** — tải lại trang là mất.',
      },
    ],
  },
  {
    id: 'cv-hien-thi',
    module: M,
    group: 'Quản lý & dùng CV',
    code: 'Q2',
    label: 'Hiển thị với nhà tuyển dụng',
    title: 'Hiển thị CV với nhà tuyển dụng',
    lead: 'Mỗi người chỉ có **một** CV được nhà tuyển dụng tìm thấy. Các CV khác vẫn đính kèm được khi ứng tuyển.',
    blocks: [
      {
        kind: 'table',
        heading: 'Câu hỏi cuối trang tạo / sửa CV',
        table: {
          cols: ['Tình huống', 'Câu hỏi', 'Lựa chọn'],
          rows: [
            ['Chưa có CV nào hiển thị', '[[Bạn có muốn hiển thị CV với nhà tuyển dụng?|Do you want to show your CV to recruiters?]]', '[[Hiển thị CV này với nhà tuyển dụng|Show this CV to recruiters]] / [[Không hiển thị CV nào|Show no CV]]. Không chọn sẵn.'],
            ['Đang có CV khác hiển thị', '[[Tôi đang hiển thị CV khác với nhà tuyển dụng|You are showing recruiters a different CV]]', '[[Giữ CV này|Keep that CV]] (chọn sẵn, kèm tên CV đang hiển thị) / [[Đổi sang CV này|Switch to this CV]].'],
          ],
        },
      },
      {
        kind: 'steps',
        heading: 'Đổi CV hiển thị từ danh sách',
        items: [
          'Trên dòng CV, ô chọn → [[Hiển thị CV với nhà tuyển dụng|Show CV to employers]]. CV đang hiển thị trước đó tự tắt. Thông báo “Đặt làm CV mặc định — đã áp dụng vào hồ sơ.”',
          'Muốn ẩn: chọn [[Ẩn CV khỏi nhà tuyển dụng|Hide CV from employers]] → hộp nhắc “Nếu bạn đang tìm việc, hãy để ngỏ cơ hội nhận lời mời” → [[Ẩn CV của tôi|Hide my CV]] (hoặc [[Giữ CV hiển thị|Keep my CV visible]]).',
        ],
      },
      {
        kind: 'table',
        heading: 'Nhà tuyển dụng thấy gì',
        table: {
          cols: ['', ''],
          rows: [
            ['Trong tìm kiếm hồ sơ', 'CV đang hiển thị + điều kiện làm việc mong muốn (vị trí, nơi làm, lương). **Thông tin liên hệ bị che** cho tới khi công ty trả phí mở.'],
            ['Khi ứng viên ứng tuyển', 'CV được gửi kèm — công ty luôn xem được CV đó, kể cả CV không bật hiển thị.'],
            ['CV chưa hoàn chỉnh / chưa được duyệt', 'Không xuất hiện trong tìm kiếm. CV bị từ chối không bật hiển thị được: “CV này chưa được duyệt nên không thể hiển thị trong tìm kiếm CV.”'],
          ],
        },
      },
      {
        kind: 'warn',
        text: 'Dưới câu hỏi có lưu ý “Bạn có thể đặt công ty đang làm và các công ty cụ thể vào danh sách hạn chế xem hồ sơ.” — **tính năng này chưa có**: ứng viên hiện không chặn được công ty nào.',
      },
    ],
  },
  {
    id: 'cv-ung-tuyen',
    module: M,
    group: 'Quản lý & dùng CV',
    code: 'Q3',
    label: 'Dùng CV để ứng tuyển',
    title: 'Dùng CV để ứng tuyển',
    blocks: [
      {
        kind: 'steps',
        items: [
          'Trên trang tin tuyển dụng, bấm [[Nộp đơn|Apply]] → khung ứng tuyển mở ở góc dưới phải.',
          '[[CV đã chọn|Selected CV]] — mặc định là CV đầu tiên dùng được. Bấm [[Đổi CV|Change CV]] › → hộp [[Chọn CV để ứng tuyển|Select the resume you wish to apply for.]] → chọn → [[Chọn CV|Select CV]].',
          'Viết [[Thư xin việc|Cover letter]] nếu tin yêu cầu ([[bắt buộc|required]] / [[không bắt buộc|optional]] / không có, tuỳ tin).',
          'Tick [[Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật|I agree with Terms of service and Privacy policy]] → [[Ứng tuyển|Apply job]] → “Đơn ứng tuyển của bạn đã được gửi.”',
        ],
      },
      {
        kind: 'table',
        heading: 'CV nào chọn được',
        table: {
          cols: ['CV', 'Trong hộp chọn'],
          rows: [
            ['Hoàn chỉnh', 'Chọn được.'],
            ['[[Chưa hoàn thiện|Unfinished]]', 'Hiện nhưng **không chọn được**, có lý do bên dưới ([[Chưa đủ thông tin|Not enough info]]).'],
            ['[[Chưa được duyệt|Not approved]] / [[Không đọc được|Can’t read]]', 'Không chọn được. Nếu lọt qua, hệ thống báo “CV này chưa gửi được. Hãy chọn CV khác.”'],
          ],
        },
      },
      {
        kind: 'warn',
        text: 'Chưa có CV nào thì khung ứng tuyển chỉ ghi “Bạn chưa thêm CV nào.”, nút [[Ứng tuyển|Apply job]] mờ, và **không có link tạo CV** ngay tại đó — người dùng phải tự vào [[Quản lý CV|Resume Management]].',
      },
      {
        kind: 'p',
        text: 'Sau khi ứng tuyển, hệ thống có thể gợi ý tối đa 5 tin tương tự để ứng tuyển tiếp bằng cùng CV. Trên trang Hồ sơ, người chưa có CV hoàn chỉnh thấy hộp nhắc “Bạn chưa có CV hoàn chỉnh nào!” với nút [[Hoàn thiện CV|Complete my CV]].',
      },
    ],
  },
  {
    id: 'cv-luot-xem',
    module: M,
    group: 'Quản lý & dùng CV',
    code: 'Q4',
    label: 'Ai đã xem CV',
    title: 'Tình trạng xem CV',
    where: '/ho-so-ca-nhan/luot-xem-cv',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['Phần', 'Nội dung'],
          rows: [
            ['3 thẻ số', '[[Công ty đã xem CV|Companies view CV]] · [[Công ty đã lưu CV|Companies saved CV]] · [[Công ty đã mở CV|Companies unlocked CV]] (đã trả phí mở thông tin liên hệ).'],
            ['Tab', '[[Tất cả lượt xem|All viewing]] / [[Đã lưu|Saved]] / [[Đã mở|Unlocked]].'],
            ['[[Khoảng thời gian|Period]]', '1, 2, 3 hoặc 6 tháng gần nhất. Lịch sử giữ tối đa **180 ngày**.'],
            ['Mỗi dòng', 'Ngày, tên công ty, [[Lượt xem: {n}|View: {n}]], nhãn [[Đã lưu|Saved]], link [[Xem tin tuyển dụng|View jobs]].'],
            ['Chưa có ai xem', '“Chưa có công ty nào xem CV của bạn.” + nút [[Cập nhật CV|Update CV]].'],
          ],
        },
      },
      {
        kind: 'p',
        text: 'Một lượt xem được ghi khi công ty mở hồ sơ ứng viên **từ tìm kiếm**. Ứng viên **không nhận thông báo hay email** khi có công ty xem CV.',
      },
    ],
  },

  /* ── TRA CỨU ──────────────────────────────────────────────────────────── */
  {
    id: 'cv-diem-chua-khop',
    module: M,
    group: 'Tra cứu',
    code: 'BK',
    label: 'Điểm cần lưu ý',
    title: 'Điểm chưa khớp và cần quyết định',
    lead: 'Những chỗ build hiện tại khác với chữ trên màn hình, hoặc có thể làm người dùng mất dữ liệu. Ghi lại để khách hàng quyết định và để QA không báo trùng.',
    blocks: [
      {
        kind: 'table',
        heading: 'Có thể làm người dùng mất dữ liệu hoặc bị chặn',
        table: {
          cols: ['Ở đâu', 'Hiện tượng'],
          rows: [
            ['Trình tạo CV', '**Không tự lưu**, không có bản nháp trên hệ thống — tải lại trang là mất CV đang tạo.'],
            ['Trình tạo CV', 'Khi bấm [[Lưu|Save]], nếu một mục lưu lỗi thì bị bỏ qua **không báo** — CV có thể thiếu mục mà người dùng không biết.'],
            ['Giới hạn 10 CV Saramin', 'Xoá CV không trả lại lượt → sau ~10 lần tạo, người dùng bị chặn vĩnh viễn.'],
            ['Sửa CV Saramin', 'File PDF không được dựng lại → nhà tuyển dụng nhận bản cũ.'],
            ['Tải CV lên', '[[Xoá tệp|Remove file]] trên CV đã có = xoá cả CV, rút cả hồ sơ ứng tuyển đang xử lý.'],
            ['Tải CV lên', 'CV tải lên đầu tiên tự thành CV hiển thị với nhà tuyển dụng mà người dùng không chọn.'],
            ['Bỏ mục tuỳ chọn', 'Bỏ một mục chỉ ẩn trên màn hình — nội dung đã nhập **vẫn được lưu và in trên PDF**.'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Chữ trên màn hình không khớp với hệ thống',
        table: {
          cols: ['Chữ trên màn hình', 'Thực tế'],
          rows: [
            ['[[Tải PDF để điền sẵn|Upload a PDF to pre-fill]] ([[Thêm CV mới|Add a new CV]])', 'Không điền sẵn CV mới — trình tạo mở trống.'],
            ['“Định dạng tệp có thể đăng ký: PDF” vs “PDF hoặc Word”', 'Nhận PDF và .docx; .doc bị từ chối với lỗi chung.'],
            ['“Không giới hạn số CV” vs lỗi “tối đa 10 CV”', 'CV tải lên không giới hạn; CV Saramin tối đa 10.'],
            ['“Dùng nút bên phải để xem trước, tải xuống hoặc xóa”', 'Menu chỉ có [[Tải xuống|Download]] và [[Xóa|Delete]].'],
            ['“…danh sách hạn chế xem hồ sơ”', 'Chưa có tính năng chặn công ty.'],
            ['[[Vui lòng nhập số điện thoại|Please enter your mobile number]] ›', 'Ô [[Điện thoại|Phone]] trong [[Thông tin cơ bản|Basic information]] là chỉ xem.'],
            ['“600.000+ lời mời mỗi tháng” (hộp ẩn CV)', 'Con số cố định trong code.'],
            ['Ô [[Nhập ghi chú|Enter memo]] trên mỗi CV', 'Chưa được lưu.'],
            ['[[Sửa|Edit]] trong hộp [[Chọn CV để ứng tuyển|Select the resume you wish to apply for.]] khi ứng tuyển', 'Với CV tải lên, link mở nhầm trình tạo CV.'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Cần khách hàng quyết định',
        table: {
          cols: ['Câu hỏi', 'Bối cảnh'],
          rows: [
            ['Có cần mẫu CV / CV nhiều ngôn ngữ không?', 'Hiện một mẫu PDF cố định, không có bản VI / EN / KO riêng.'],
            ['PDF có cần ảnh, ngày sinh, giới tính?', 'Hiện không in. Trang hồ sơ thì có ảnh.'],
            ['Có mở các ô Lương / Nơi làm việc / Lý do nghỉ việc trong Kinh nghiệm?', 'Đã có trong code, đang ẩn.'],
          ],
        },
      },
    ],
  },
  {
    id: 'cv-api',
    module: M,
    group: 'Tra cứu',
    code: 'API',
    label: 'Endpoint & giới hạn',
    title: 'Endpoint, trạng thái và giới hạn',
    dev: true,
    lead: 'Tất cả dưới `/api/{vi|en}`, phiên ứng viên, CSRF cho thao tác ghi. Controller chính: `CandidateCvLibraryController`, `CandidateResumeController`, `WebApplyService`, `WebOnboardingController`.',
    blocks: [
      {
        kind: 'table',
        heading: 'Thư viện CV (`/me/cvs`)',
        table: {
          cols: ['Method + path', 'Dùng để'],
          rows: [
            ['POST `/me/cvs` → POST `/me/cvs/{ticketId}/confirm`', 'Xin chỗ tải lên {contentType,size} → xác nhận {fileName}; 201 + tự xếp hàng AI parse.'],
            ['GET `/me/cvs`', 'Danh sách, mới nhất trước; facts, applicationCount, status.'],
            ['PATCH `/me/cvs/{id}`', '{fileName?, title?, searchable?, fresher?}.'],
            ['DELETE `/me/cvs/{id}`', 'Xoá; `CvDeletionEffects` rút hồ sơ đang xử lý, báo công ty, xoá file.'],
            ['GET `/me/cvs/{id}/download`', 'Link tải mới.'],
            ['POST `/me/cvs/generate?resumeId=`', 'Dựng PDF CV Saramin (OpenHtmlToPdf), một CV mỗi résumé.'],
            ['POST `/me/cvs/{cvId}/versions/{ticketId}`', 'Thay file (web chưa dùng).'],
            ['GET `/me/cv-parse-versions[/{id}]` · POST `…/{id}/apply`', 'Kết quả AI parse; web poll 2,5 giây, bỏ sau ~3 phút.'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Résumé (nội dung CV Saramin)',
        table: {
          cols: ['Method + path', 'Dùng để'],
          rows: [
            ['POST `/me/resumes`', 'Tạo résumé (fullName, email, content; yearsOfExp 0 = không kinh nghiệm). 409 khi đủ 10.'],
            ['POST / PATCH / DELETE `/me/resumes/{id}/{section}[/{itemId}]`', 'section: experience, education, skills, languages, projects, certificates, awards, activities, references.'],
            ['PUT `/me/resumes/{id}/{section}/order`', '{itemIds}.'],
            ['PUT `/me/resumes/{id}/about`', '[[Giới thiệu|About]] ≤ 4000.'],
            ['PATCH `/jobseeker/profile`', '[[Thông tin cơ bản|Basic information]], tổng kinh nghiệm, học vấn cao nhất, điều kiện làm việc, câu trả lời onboarding.'],
            ['POST `/me/avatar-uploads` → `/{ticket}/confirm`', 'Ảnh: server nhận JPEG/PNG ≤ 2 MB (web cắt và nén JPEG 768×1075).'],
          ],
        },
      },
      {
        kind: 'table',
        heading: 'Giới hạn và trạng thái',
        table: {
          cols: ['', 'Giá trị'],
          rows: [
            ['Résumé / tài khoản', '10 (`ManageMyResumesUseCase.MAX_RESUMES_PER_CANDIDATE`); xoá CV không xoá résumé.'],
            ['Kỹ năng / CV', '20 (`ResumeSkill.MAX_PER_RESUME`).'],
            ['File CV', '`MediaKind.CV_FILE`: PDF, DOCX, 10 MB, kiểm tra magic bytes.'],
            ['Trạng thái CV', '`QUALIFIED` · `NOT_ENOUGH_INFORMATION` · `REJECTED`; duyệt admin `APPROVED / PENDING / REJECTED`.'],
            ['Quy tắc hoàn chỉnh', '`CvQualificationRule`: education ≥ 1, + experience ≥ 1 trừ khi fresher. Cờ `svn.cv.qualification.enabled` mặc định tắt (giữ đơn chờ duyệt).'],
            ['AI parse', 'Sidecar Python, che PII → OpenAI gpt-4o-mini; `application.yml` mặc định `mock`, compose dev `http`.'],
            ['Ứng tuyển', 'POST `/jobs/{jobId}/apply` {source: OWN_CV, cvId}; BE chỉ chặn REJECTED (409 `CV_NOT_APPROVED`), web chặn thêm NOT_ENOUGH_INFORMATION.'],
            ['Lượt xem', 'GET `/jobseeker/cv-viewing-status?tab=ALL|SAVED|UNLOCKED&months=1..6`.'],
          ],
        },
      },
    ],
  },
]
