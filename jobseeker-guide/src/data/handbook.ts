/*
 * CẨM NANG JOBSEEKER — the operating handbook for the BUILT jobseeker site.
 *
 * Written from the build repos (svn-web + svn-be, branch `dev`), not from the spec
 * site: every message below is the copy the screen actually renders, every limit
 * is the constant the backend actually enforces. When the build and the spec
 * disagree, this page follows the build and says so in "Điểm chưa khớp".
 *
 * Module 1 — Tài khoản: sign up, sign in, forgot password.
 */
import type { GuideModule, GuideSection, Handbook } from './types'
import { COPY_MODULE, COPY_SECTIONS } from './copyReview'
import { CV_MODULE, CV_SECTIONS } from './cv'

/** The deployed jobseeker site this handbook describes. Every deep link is built from it. */
export const SITE_BASE = 'https://dev.svn.topdev.asia'
export const siteUrl = (path: string) => `${SITE_BASE}${path}`

/** The handbook family, as the switcher at the top of the rail lists it. */
export const DOCS = [
  { label: 'Admin console', note: 'Cẩm nang trang quản trị', href: 'https://saramin-admin-guide.vercel.app/' },
  { label: 'Jobseeker', note: 'Cẩm nang trang người tìm việc', href: '/' },
] as const
export const CURRENT_DOC = 'Jobseeker'

const ACCOUNT_MODULE: GuideModule = {
  id: 'tai-khoan',
  code: 'TK',
  label: 'Tài khoản',
  title: 'Tài khoản ứng viên, coi một lần là hiểu',
  lead:
    'Bản này dành cho người vận hành, CS và QA: tạo tài khoản ứng viên, đăng nhập, lấy lại mật khẩu trên trang Saramin dành cho người tìm việc — làm gì, theo thứ tự nào, và màn hình sẽ báo gì khi có lỗi. Bật **Xem bản Developer** để thấy thêm route, endpoint, mã lỗi và cấu hình môi trường.',
  quick: [
    {
      q: 'Muốn tạo tài khoản?',
      a: 'Vào [[Đăng ký|Sign up]] → [[Tạo tài khoản bằng email|Create an account with email]]. Cần một **số điện thoại Việt Nam nhận được mã Zalo** (hoặc tick [[Tôi đang ở nước ngoài|I live abroad]] để xác thực bằng email). Đăng ký xong là vào thẳng, không cần mở email.',
    },
    {
      q: 'Không đăng nhập được?',
      a: 'Đăng nhập **chỉ bằng email** (không bằng số điện thoại). Tài khoản tạo bằng Google/Facebook/LinkedIn **không có mật khẩu** — dùng lại nút mạng xã hội, hoặc [[Quên mật khẩu|Forgot password]] để đặt mật khẩu đầu tiên.',
    },
    {
      q: 'Quên mật khẩu?',
      a: 'Bấm [[Quên mật khẩu|Forgot password]] → nhận **mã 6 số** qua số điện thoại (mặc định) hoặc email → đặt mật khẩu mới ngay trên cùng trang. Không còn gửi link qua email.',
    },
  ],
  keyFact: {
    heading: 'Điều quan trọng nhất cần nhớ',
    text:
      'Tài khoản ứng viên **xác thực bằng số điện thoại** nhưng **đăng nhập bằng email**. Lúc đăng ký, mã OTP gửi về số điện thoại (qua Zalo) — email chỉ được kiểm tra bằng mã khi người dùng tick [[Tôi đang ở nước ngoài|I live abroad]]. Lúc đăng nhập thì ngược lại: ô duy nhất là [[Email|Email]], không có ô số điện thoại. Gần như mọi câu hỏi “sao tôi đăng ký rồi mà không vào được” đều dừng ở chỗ người dùng gõ số điện thoại vào ô email, hoặc tài khoản đó được tạo bằng mạng xã hội nên chưa từng có mật khẩu.',
  },
  links: [
    { label: 'Mở trang Đăng ký', path: '/auth/sign-up' },
    { label: 'Mở form đăng ký email', path: '/auth/sign-up/detail' },
    { label: 'Mở trang Đăng nhập', path: '/auth/sign-in' },
    { label: 'Mở Quên mật khẩu', path: '/auth/forgot-password' },
  ],

  subs: [
    { label: 'Tổng quan', blurb: 'Các màn hình của module và những từ cần biết trước.' },
    { label: 'Đăng ký', blurb: 'Tạo tài khoản bằng email, khi ở nước ngoài, hoặc bằng mạng xã hội.' },
    { label: 'Đăng nhập', blurb: 'Email + mật khẩu, mạng xã hội, hộp đăng nhập nổi, đăng xuất.' },
    { label: 'Quên mật khẩu', blurb: 'Lấy lại mật khẩu bằng mã 6 số, và link đặt lại cũ.' },
    { label: 'Tra cứu', blurb: 'Điểm chưa khớp trong build; môi trường dev và mã lỗi cho Developer.' },
  ],
}

const ACCOUNT_SECTIONS: Omit<GuideSection, 'module'>[] = [
    /* ── BẮT ĐẦU ──────────────────────────────────────────────────────────── */
    {
      id: 'tong-quan',
      group: 'Tổng quan',
      code: 'TQ',
      label: 'Bản đồ màn hình',
      title: 'Bản đồ màn hình — module Tài khoản',
      lead:
        'Toàn bộ module nằm dưới `/auth`. Đường dẫn giống nhau ở mọi ngôn ngữ — ngôn ngữ lấy từ cookie hoặc trình duyệt, mặc định tiếng Việt. Cả ba màn hình đều có tab [[Ứng viên|Jobseeker]] | [[Nhà tuyển dụng|Employer]]; cẩm nang này chỉ nói phần [[Ứng viên|Jobseeker]].',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Màn hình', 'Đường dẫn', 'Dùng để'],
            rows: [
              ['[[Đăng ký|Sign up]] — chọn cách', '`/auth/sign-up`', 'Bước 1: chọn mạng xã hội hoặc [[Tạo tài khoản bằng email|Create an account with email]]. Bên phải là banner quảng bá chạy tự động.'],
              ['[[Đăng ký|Sign up]] — form email', '`/auth/sign-up/detail`', 'Bước 2: điền họ tên, email, mật khẩu, số điện thoại (xác thực OTP), ngày sinh, điều khoản.'],
              ['[[Hoàn tất đăng ký|Finish signing up]]', '`/auth/complete-signup`', 'Chỉ gặp khi đăng ký **lần đầu bằng mạng xã hội**: bổ sung số điện thoại và đồng ý điều khoản.'],
              ['[[Chào mừng|Welcome]] (onboarding)', '`/chao-mung`', 'Trang đầu tiên sau khi đăng ký thành công: dựng hồ sơ, kết thúc bằng danh sách việc làm gợi ý.'],
              ['[[Đăng nhập|Sign in]]', '`/auth/sign-in`', 'Email + mật khẩu, [[Duy trì đăng nhập|Keep me signed in]], link [[Quên mật khẩu|Forgot password]], nút mạng xã hội.'],
              ['[[Quên mật khẩu|Forgot password]]', '`/auth/forgot-password`', 'Tìm mật khẩu bằng số điện thoại hoặc email → mã 6 số → đặt mật khẩu mới, cả 3 bước trên cùng một trang.'],
              ['[[Đặt mật khẩu mới|Set a new password]] (link cũ)', '`/auth/reset-password?token=…`', 'Chỉ mở từ **link email cũ** hoặc link do admin gửi. Người dùng bình thường không còn đi qua trang này.'],
              ['[[Tài khoản của bạn đã được xoá|Your account has been deleted]]', '`/auth/account-deleted`', 'Trang kết thúc sau khi ứng viên **tự xoá** tài khoản. Không phải trang báo lỗi đăng nhập.'],
            ],
          },
        },
        {
          kind: 'flow',
          heading: 'Hành trình thường gặp nhất',
          items: [
            { label: '[[Đăng ký|Sign up]]', path: '/auth/sign-up' },
            { label: 'Form email + OTP điện thoại', path: '/auth/sign-up/detail' },
            { label: 'Tự đăng nhập → [[Chào mừng|Welcome]]', path: '/chao-mung' },
            { label: 'Lần sau: [[Đăng nhập|Sign in]]', path: '/auth/sign-in' },
          ],
        },
        {
          kind: 'warn',
          text: 'Chưa có trang **Tìm ID** (tìm lại email đăng nhập). Người dùng quên luôn email thì chỉ CS hỗ trợ được.',
        },
      ],
    },
    {
      id: 'tu-dien',
      group: 'Tổng quan',
      code: 'TĐ',
      label: 'Từ điển',
      title: 'Từ điển — đọc trước, 3 phút',
      lead: 'Năm từ đầu bảng giải thích gần hết các ca “tại sao lại thế”.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Từ', 'Nghĩa trong hệ thống này'],
            rows: [
              ['ID đăng nhập', 'Luôn là **email**. Không đăng nhập bằng số điện thoại hay tên.'],
              ['OTP / mã xác thực', 'Mã **6 chữ số**, sống **3 phút**. Sau **60 giây** mới được xin mã mới. Mỗi mã cho nhập sai **3 lần**; mỗi lượt xác thực xin được tối đa **3 mã**.'],
              ['Luồng Việt Nam', 'Mặc định khi đăng ký. Số điện thoại **phải xác thực bằng OTP** (gửi qua Zalo). Email không cần xác thực lúc đăng ký.'],
              ['Luồng ở nước ngoài', 'Khi tick [[Tôi đang ở nước ngoài|I live abroad]]. **Email phải xác thực bằng OTP**; số điện thoại chỉ là số liên hệ, không xác thực.'],
              ['Tài khoản mạng xã hội', 'Tạo bằng Google / Facebook / LinkedIn. **Không có mật khẩu** cho tới khi người dùng tự đặt qua [[Quên mật khẩu|Forgot password]].'],
              ['[[Duy trì đăng nhập|Keep me signed in]]', 'Tick: giữ đăng nhập **14 ngày**. Không tick: **1 ngày**. Trong thời gian đó hệ thống tự gia hạn, người dùng không phải đăng nhập lại.'],
              ['Khoá số điện thoại', 'Nhập sai mã **5 lần trong 24 giờ** trên cùng một số → số đó bị khoá 24 giờ, không gửi được mã nữa.'],
              ['Onboarding / [[Chào mừng|Welcome]]', 'Trình hướng dẫn dựng hồ sơ sau đăng ký. Chưa xong thì mỗi lần đăng nhập đều được đưa về đây trước.'],
            ],
          },
        },
      ],
    },

    /* ── ĐĂNG KÝ ──────────────────────────────────────────────────────────── */
    {
      id: 'dang-ky-email',
      group: 'Đăng ký',
      code: 'ĐK1',
      label: 'Đăng ký bằng email',
      title: 'Đăng ký bằng email (người ở Việt Nam)',
      where: '/auth/sign-up → /auth/sign-up/detail',
      lead:
        'Cách đăng ký chính. Form có 6 phần, **tất cả đều bắt buộc** dù không có dấu sao đỏ. Lỗi của một ô hiện khi rời khỏi ô đó.',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Mở trang [[Đăng ký|Sign up]] (`/auth/sign-up`), hoặc bấm [[Đăng ký tài khoản ứng viên|Create a jobseeker account]] ở panel trái trang [[Đăng nhập|Sign in]]. Đảm bảo đang ở tab [[Ứng viên|Jobseeker]].',
            'Bấm [[Tạo tài khoản bằng email|Create an account with email]]. Trang chuyển sang form [[Đăng ký tài khoản ứng viên Saramin|Create your Saramin jobseeker account]].',
            'Điền [[Họ và tên|Full name]] và [[Email|Email]]. Email này là ID đăng nhập về sau.',
            'Đặt [[Mật khẩu|Password]] — gõ tới đâu, danh sách 4 điều kiện bên dưới sáng tới đó; đủ cả 4 thì hiện [[Mật khẩu hợp lệ|This is a valid password]].',
            'Nhập [[Số điện thoại|Phone number]] (chỉ gõ được chữ số, không cần +84) → bấm [[Xác thực|Verify]]. Mã 6 số được gửi qua **Zalo** về số đó.',
            'Nhập mã vào ô [[Nhập mã 6 chữ số|Enter the 6-digit code]] → bấm [[Kiểm tra|Check]]. Thành công hiện ✓ [[Đã xác thực số điện thoại|Phone number is verified]], ô số khoá lại, nút đổi thành [[Đổi số|Change]].',
            'Chọn [[Ngày sinh|Date of birth]] (gõ DD/MM/YYYY hoặc bấm biểu tượng lịch). Phải đủ **15 tuổi**.',
            'Tick [[(Bắt buộc) Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật|(Required) I agree to our Terms of Service & Privacy Policy]] (hoặc [[Đồng ý tất cả|Agree to all]]) → bấm [[Đăng ký|Sign up]].',
          ],
        },
        {
          kind: 'table',
          heading: 'Từng ô và điều kiện',
          table: {
            cols: ['Ô', 'Điều kiện', 'Thông báo khi sai'],
            rows: [
              ['[[Họ và tên|Full name]]', '2–100 ký tự, chỉ chữ cái (có dấu được) và một khoảng trắng giữa các từ. Không số, không ký tự đặc biệt.', '“Vui lòng nhập họ và tên (tối thiểu 2 ký tự).” · “Họ và tên chỉ gồm chữ cái và khoảng trắng đơn.”'],
              ['[[Email|Email]]', 'Đúng định dạng email. Tự chuyển về chữ thường. Trùng hay không chỉ biết **khi bấm** [[Đăng ký|Sign up]].', '“Vui lòng nhập email.” · “Định dạng email không hợp lệ.”'],
              ['[[Mật khẩu|Password]]', 'Xem bảng mật khẩu ngay dưới. Không được trùng email.', '“Mật khẩu không được trùng với email.”'],
              ['[[Số điện thoại|Phone number]]', 'Số di động 9 chữ số hoặc cố định 10 (bỏ số 0 đầu). Nút [[Xác thực|Verify]] chỉ bấm được khi số hợp lệ.', '“Số điện thoại không hợp lệ. Số di động có 9 chữ số, số cố định có 10.” · khi bấm [[Đăng ký|Sign up]] mà chưa xác thực: “Vui lòng xác thực số điện thoại trước khi tiếp tục.”'],
              ['[[Ngày sinh|Date of birth]]', 'Không ở tương lai, không quá 120 năm, đủ 15 tuổi (tính theo giờ Việt Nam).', '“Vui lòng nhập ngày sinh.” · “Ngày sinh không thể ở tương lai.” · “Bạn phải đủ 15 tuổi trở lên để đăng ký.”'],
              ['[[Điều khoản|Terms]]', '1 ô bắt buộc + 3 ô tuỳ chọn (dịch vụ theo vị trí, tiếp thị qua email, tiếp thị qua SMS). Mặc định chưa tick ô nào.', 'Không có thông báo — xem cảnh báo bên dưới.'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Quy tắc mật khẩu',
          note: 'Giống nhau ở đăng ký, quên mật khẩu và đổi mật khẩu.',
          table: {
            cols: ['Điều kiện', 'Dòng trong danh sách'],
            rows: [
              ['8 đến 128 ký tự', '[[Ít nhất 8 ký tự|At least 8 characters]]'],
              ['Có ít nhất 1 chữ số 0–9', '[[Ít nhất 1 chữ số|At least 1 number]]'],
              ['Có ít nhất 1 ký tự đặc biệt trên bàn phím: ! @ # $ % & * ( ) - _ + = ? . , … ', '[[Ít nhất 1 ký tự đặc biệt|At least 1 special characters]]'],
              ['Có ít nhất 1 chữ in hoa A–Z (không dấu)', '[[Ít nhất 1 chữ hoa|At least 1 uppercase letter]]'],
              ['Không trùng với email', '— (báo lỗi riêng)'],
            ],
          },
        },
        {
          kind: 'warn',
          text: 'Nếu **chưa tick ô điều khoản bắt buộc**, bấm [[Đăng ký|Sign up]] sẽ **không có gì xảy ra** — không báo lỗi, nút vẫn sáng. Khi người dùng báo “bấm Đăng ký không được”, hỏi điều này trước tiên.',
        },
        {
          kind: 'warn',
          text: 'Chữ có dấu (ă, ơ…), dấu cách hay emoji được danh sách tính là “ký tự đặc biệt” và hiện [[Mật khẩu hợp lệ|This is a valid password]], nhưng hệ thống **từ chối** khi bấm [[Đăng ký|Sign up]] với lỗi “Mật khẩu chưa đáp ứng yêu cầu bảo mật.” Hướng dẫn người dùng dùng ký tự như **! @ # $**.',
        },
        {
          kind: 'tip',
          text: 'Xác thực số điện thoại có hiệu lực **30 phút**. Điền form quá lâu sau khi xác thực thì khi bấm [[Đăng ký|Sign up]] sẽ báo “Xác thực số điện thoại đã hết hạn. Vui lòng xác thực lại.” — chỉ cần bấm [[Xác thực|Verify]] lại.',
        },
        { kind: 'links', items: [{ label: 'Đăng ký', path: '/auth/sign-up' }, { label: 'Form email', path: '/auth/sign-up/detail' }] },
      ],
    },
    {
      id: 'dang-ky-nuoc-ngoai',
      group: 'Đăng ký',
      code: 'ĐK2',
      label: 'Người ở nước ngoài',
      title: 'Đăng ký khi đang ở nước ngoài',
      where: '/auth/sign-up/detail — tick “Tôi đang ở nước ngoài”',
      lead:
        'Cho người không có số Việt Nam nhận được mã. Cùng form với ĐK1, chỉ khác phần xác thực: **xác thực email thay vì số điện thoại**.',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Trên dòng [[Số điện thoại|Phone number]], tick [[Tôi đang ở nước ngoài|I live abroad]] (góc phải).',
            'Ô [[Email|Email]] xuất hiện nút [[Xác thực|Verify]] → bấm để nhận mã 6 số qua email (tiêu đề “[Saramin] Mã xác thực đăng ký tài khoản”). Dưới ô hiện “Đã gửi mã tới m***@g***” và đồng hồ đếm ngược.',
            'Nhập mã vào [[Nhập mã 6 số|Enter the 6-digit code]] → [[Kiểm tra|Check]]. Thành công hiện ✓ [[Đã xác thực email|Email verified]], nút đổi thành [[Đổi email|Change]].',
            'Ô [[Số điện thoại|Phone number]] vẫn bắt buộc nhưng chỉ cần tối thiểu 6 chữ số, không xác thực.',
            'Điền các ô còn lại như ĐK1 → [[Đăng ký|Sign up]].',
          ],
        },
        {
          kind: 'warn',
          text: 'Tick rồi bỏ tick (hoặc ngược lại) sẽ **xoá kết quả xác thực** đã có ở luồng kia — phải xác thực lại.',
        },
        {
          kind: 'warn',
          text: 'Xác thực email chỉ có hiệu lực **10 phút** (số điện thoại là 30 phút). Quá hạn thì bấm [[Đăng ký|Sign up]] chỉ ra thông báo chung “Đã xảy ra lỗi. Vui lòng thử lại.” — cách xử lý: bấm [[Đổi email|Change]] rồi xác thực lại.',
        },
        {
          kind: 'p',
          text: 'Gửi mã email cũng **kiểm tra email đã được dùng chưa**: trùng thì báo ngay “Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.”, không phải đợi tới lúc bấm [[Đăng ký|Sign up]].',
        },
      ],
    },
    {
      id: 'dang-ky-mxh',
      group: 'Đăng ký',
      code: 'ĐK3',
      label: 'Đăng ký bằng mạng xã hội',
      title: 'Đăng ký bằng Google / Facebook / LinkedIn',
      where: '/auth/sign-up → nhà cung cấp → /auth/complete-signup',
      lead:
        'Ba nút tròn dưới dòng [[Đăng nhập mạng xã hội|Quick social sign-in]] ở bước 1. Không có Zalo, Apple, Naver hay Kakao. Cùng ba nút này cũng dùng để **đăng nhập** — hệ thống tự biết đây là người mới hay người cũ.',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Ở [[Đăng ký|Sign up]] (tab [[Ứng viên|Jobseeker]]), bấm biểu tượng Google, Facebook hoặc LinkedIn.',
            'Đăng nhập và đồng ý trên trang của nhà cung cấp.',
            'Nếu đây là **người mới**, trang [[Hoàn tất đăng ký|Finish signing up]] mở ra. Email lấy từ nhà cung cấp (khoá, không sửa được); nếu nhà cung cấp không trả email thì người dùng tự nhập.',
            'Xác thực [[Số điện thoại|Phone number]] bằng OTP như ĐK1 (hoặc tick [[Tôi đang ở nước ngoài|I live abroad]]).',
            'Tick điều khoản bắt buộc → [[Tiếp tục|Continue]]. Nút chỉ sáng khi đủ điều kiện.',
          ],
        },
        {
          kind: 'table',
          heading: 'Hệ thống quyết định thế nào',
          table: {
            cols: ['Tình huống', 'Kết quả'],
            rows: [
              ['Tài khoản mạng xã hội này đã từng đăng ký', 'Đăng nhập luôn, không qua [[Hoàn tất đăng ký|Finish signing up]].'],
              ['Email Google/LinkedIn trùng một tài khoản Saramin **đã xác thực**', 'Tự liên kết và đăng nhập vào tài khoản đó.'],
              ['Email trùng một tài khoản, nhưng qua **Facebook**', 'Không tự liên kết (Facebook không được tin về email). Quay về trang [[Đăng nhập|Sign in]] — **không có thông báo** nào hiện ra.'],
              ['Người mới', 'Trang [[Hoàn tất đăng ký|Finish signing up]]. Phiên chờ này sống **30 phút**.'],
              ['Email của tài khoản **đã xoá**', 'Trang [[Đăng nhập|Sign in]] báo “Tài khoản này đã bị xoá và không thể sử dụng lại. Vui lòng liên hệ hỗ trợ nếu bạn cần trợ giúp.”'],
            ],
          },
        },
        {
          kind: 'warn',
          text: 'Nút nào chưa được bật trên môi trường đang dùng thì vẫn **hiện**, nhưng bấm vào chỉ ra thông báo “Phương thức đăng nhập này sẽ sớm ra mắt.” Đây không phải lỗi.',
        },
        {
          kind: 'p',
          text: 'Tài khoản tạo theo cách này **không có mật khẩu** và **không hỏi họ tên, ngày sinh** — họ tên lấy từ nhà cung cấp.',
        },
      ],
    },
    {
      id: 'sau-dang-ky',
      group: 'Đăng ký',
      code: 'ĐK4',
      label: 'Sau khi đăng ký',
      title: 'Sau khi bấm Đăng ký thành công',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Người dùng **được đăng nhập ngay** — không có màn hình “kiểm tra email”, không cần bấm link xác thực.',
            'Trang chuyển sang [[Chào mừng|Welcome]] (`/chao-mung`) để dựng hồ sơ. Nếu bắt đầu đăng ký từ một hành động (ví dụ bấm [[Ứng tuyển|Apply]]), sau [[Chào mừng|Welcome]] sẽ quay về đúng trang đó.',
            'Một **email chào mừng** được gửi: “[Saramin] {Tên} ơi, sẵn sàng “Khởi đầu Matching” cùng Saramin Vietnam nào!”.',
          ],
        },
        {
          kind: 'p',
          text: 'Với luồng Việt Nam, **email chưa được xác thực** sau khi đăng ký (chỉ số điện thoại được xác thực). Điều này không chặn đăng nhập.',
        },
      ],
    },
    {
      id: 'loi-dang-ky',
      group: 'Đăng ký',
      code: 'ĐK5',
      label: 'Lỗi khi đăng ký',
      title: 'Lỗi khi đăng ký — tra nhanh',
      lead: 'Thông báo đúng như trên màn hình. Cột cuối là việc cần hướng dẫn người dùng làm.',
      blocks: [
        {
          kind: 'table',
          heading: 'Khi bấm Đăng ký',
          table: {
            cols: ['Thông báo', 'Hiện ở', 'Nghĩa là / Cách xử lý'],
            rows: [
              ['“Email này đã được đăng ký.”', 'Ô [[Email|Email]]', 'Đã có tài khoản → [[Đăng nhập|Sign in]] hoặc [[Quên mật khẩu|Forgot password]]. Có thể tài khoản cũ được tạo bằng mạng xã hội.'],
              ['“Email này thuộc về một tài khoản đã bị xoá và không thể dùng để đăng ký lại.”', 'Ô [[Email|Email]]', 'Email của tài khoản đã xoá bị chặn vĩnh viễn. Chỉ CS gỡ được sau khi xác minh danh tính.'],
              ['“Số điện thoại này đã được đăng ký. Vui lòng đăng nhập hoặc dùng số khác.”', 'Ô [[Số điện thoại|Phone number]]', 'Số đã gắn với tài khoản khác.'],
              ['“Xác thực số điện thoại đã hết hạn. Vui lòng xác thực lại.”', 'Ô [[Số điện thoại|Phone number]]', 'Quá 30 phút từ lúc xác thực. Bấm [[Xác thực|Verify]] lại.'],
              ['“Mật khẩu chưa đáp ứng yêu cầu bảo mật.”', 'Ô [[Mật khẩu|Password]]', 'Thường do dùng chữ có dấu / dấu cách làm “ký tự đặc biệt”. Đổi sang ! @ # $.'],
              ['“Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.”', 'Thông báo nổi', 'Quá 5 lần đăng ký/phút từ cùng mạng. Đợi một phút.'],
              ['“Đã xảy ra lỗi. Vui lòng thử lại.”', 'Thông báo nổi', 'Lỗi chung. Với người ở nước ngoài: thường là xác thực email đã quá 10 phút.'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Khi xin mã / nhập mã',
          table: {
            cols: ['Thông báo', 'Nghĩa là / Cách xử lý'],
            rows: [
              ['“Mã vừa được gửi. Vui lòng đợi trước khi yêu cầu mã mới.”', 'Chưa đủ 60 giây, hoặc đã xin quá **3 mã/giờ** (10 mã/ngày) cho số này.'],
              ['“Mã xác thực không đúng. Vui lòng thử lại.”', 'Sai mã. Mỗi mã cho sai 3 lần.'],
              ['“Đã hết thời gian nhập. Vui lòng nhận lại mã xác thực và nhập lại.”', 'Mã quá 3 phút. Bấm [[Gửi lại|Resend]].'],
              ['“Một mã mới đã được gửi. Vui lòng dùng tin nhắn mới nhất.”', 'Đang nhập mã cũ sau khi đã bấm [[Gửi lại|Resend]].'],
              ['“Số này đã bị khoá do nhập sai quá nhiều lần. Vui lòng thử lại sau 24 giờ.”', 'Sai 5 lần trong 24 giờ. Không mở khoá sớm được từ phía người dùng.'],
              ['“Xác thực số điện thoại tạm thời không khả dụng. Vui lòng liên hệ hỗ trợ.”', 'Hệ thống gửi Zalo chưa được cấu hình / đang lỗi. Báo kỹ thuật.'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Trang Hoàn tất đăng ký (mạng xã hội)',
          table: {
            cols: ['Thông báo', 'Nghĩa là / Cách xử lý'],
            rows: [
              ['“Phiên của bạn đã hết hạn. Vui lòng bắt đầu lại đăng nhập mạng xã hội.”', 'Quá 30 phút trên trang này — bấm lại nút mạng xã hội. **Lưu ý:** lỗi email sai định dạng và lỗi chung cũng đang hiện câu này.'],
              ['“Email này đã được đăng ký. Vui lòng đăng nhập.”', 'Có tài khoản email/mật khẩu với email này → đăng nhập bằng mật khẩu.'],
              ['“Email này thuộc về một tài khoản đã bị xoá…”', 'Như bảng trên. Không có link đăng nhập.'],
            ],
          },
        },
      ],
    },

    /* ── ĐĂNG NHẬP ────────────────────────────────────────────────────────── */
    {
      id: 'dang-nhap',
      group: 'Đăng nhập',
      code: 'ĐN1',
      label: 'Đăng nhập bằng email',
      title: 'Đăng nhập bằng email và mật khẩu',
      where: '/auth/sign-in',
      lead:
        'Trang có panel minh hoạ bên trái (chỉ trên máy tính) và form bên phải. Không có tiêu đề “Đăng nhập” — chữ [[Đăng nhập|Sign in]] nằm trên nút.',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Mở trang [[Đăng nhập|Sign in]] (`/auth/sign-in`). Kiểm tra đang ở tab [[Ứng viên|Jobseeker]] (tab [[Nhà tuyển dụng|Employer]] là tài khoản khác hoàn toàn).',
            'Nhập [[Email|Email]] và [[Mật khẩu|Password]] (biểu tượng con mắt để hiện/ẩn).',
            'Tick [[Duy trì đăng nhập|Keep me signed in]] nếu là máy cá nhân — giữ đăng nhập 14 ngày thay vì 1 ngày.',
            'Bấm [[Đăng nhập|Sign in]].',
            'Thành công: nếu chưa xong onboarding → về [[Chào mừng|Welcome]]; nếu đến từ một trang cần đăng nhập → quay lại đúng trang đó; còn lại → trang chủ.',
          ],
        },
        {
          kind: 'table',
          heading: 'Ô nhập',
          table: {
            cols: ['Ô', 'Điều kiện', 'Thông báo khi sai'],
            rows: [
              ['[[Email|Email]]', 'Đúng định dạng email. **Số điện thoại không dùng được.**', '“Định dạng email không hợp lệ.” (để trống cũng hiện câu này)'],
              ['[[Mật khẩu|Password]]', 'Không trống, tối đa 72 ký tự.', '“Vui lòng nhập mật khẩu.” · “Mật khẩu tối đa 72 ký tự.”'],
              ['[[Duy trì đăng nhập|Keep me signed in]]', 'Tuỳ chọn, mặc định không tick.', '—'],
            ],
          },
        },
        {
          kind: 'tip',
          text: 'Trên **điện thoại** (màn hình hẹp), trang [[Đăng nhập|Sign in]] **không có nút** [[Đăng ký tài khoản ứng viên|Create a jobseeker account]] — nút đó nằm ở panel trái chỉ hiện trên máy tính. Người dùng mobile mở thẳng `/auth/sign-up`.',
        },
        { kind: 'links', items: [{ label: 'Đăng nhập', path: '/auth/sign-in' }] },
      ],
    },
    {
      id: 'dang-nhap-mxh',
      group: 'Đăng nhập',
      code: 'ĐN2',
      label: 'Đăng nhập mạng xã hội',
      title: 'Đăng nhập bằng Google / Facebook / LinkedIn',
      where: '/auth/sign-in — dưới dòng “hoặc đăng nhập bằng mạng xã hội”',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Bấm biểu tượng nhà cung cấp dưới dòng [[hoặc đăng nhập bằng mạng xã hội|or sign in with social]] (chỉ có ở tab [[Ứng viên|Jobseeker]]).',
            'Đồng ý trên trang của nhà cung cấp.',
            'Tài khoản đã có → vào luôn. Tài khoản chưa có → sang [[Hoàn tất đăng ký|Finish signing up]] (xem ĐK3).',
          ],
        },
        {
          kind: 'table',
          heading: 'Thông báo đỏ trên đầu trang Đăng nhập khi đăng nhập mạng xã hội thất bại',
          table: {
            cols: ['Thông báo', 'Nghĩa là'],
            rows: [
              ['“Đăng nhập bị gián đoạn. Vui lòng thử lại.”', 'Quá 10 phút giữa lúc bấm và lúc quay về, hoặc mở bằng tab khác.'],
              ['“Đăng nhập thất bại. Vui lòng thử lại.”', 'Lỗi chung từ nhà cung cấp hoặc hệ thống.'],
              ['“Email từ nhà cung cấp chưa được xác thực.”', 'Nhà cung cấp chưa xác thực email đó.'],
              ['“Tài khoản này không hoạt động.”', 'Tài khoản bị vô hiệu hoá.'],
              ['“Tài khoản này đã bị xoá và không thể sử dụng lại. Vui lòng liên hệ hỗ trợ nếu bạn cần trợ giúp.”', 'Tài khoản đã xoá.'],
            ],
          },
        },
      ],
    },
    {
      id: 'can-dang-nhap',
      group: 'Đăng nhập',
      code: 'ĐN3',
      label: 'Khi thao tác cần đăng nhập',
      title: 'Khi bấm Ứng tuyển / Lưu tin mà chưa đăng nhập',
      lead:
        'Người dùng không cần rời trang: một hộp đăng nhập nổi lên ngay tại chỗ, đăng nhập xong thì thao tác vừa bấm được làm tiếp.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Ai bấm', 'Thấy gì'],
            rows: [
              ['Khách chưa đăng nhập', 'Hộp [[Bạn cần đăng nhập để sử dụng dịch vụ này|You need to sign in to use this service]] với [[Email|Email]], [[Mật khẩu|Password]], [[Duy trì đăng nhập|Keep me signed in]], [[Ghi nhớ email|Remember my email]], nút [[Đăng nhập|Sign in]], link [[Quên mật khẩu|Forgot password]] | [[Đăng ký|Sign Up]] và nút mạng xã hội.'],
              ['Đang đăng nhập bằng **tài khoản nhà tuyển dụng**', 'Panel góc màn hình [[Đăng nhập bằng tài khoản ứng viên|Sign in as a jobseeker]] — “Bạn đang đăng nhập bằng tài khoản nhà tuyển dụng. Ứng tuyển cần tài khoản ứng viên.” Đăng nhập ứng viên sẽ **kết thúc phiên nhà tuyển dụng** (mỗi trình duyệt chỉ một vai trò).'],
            ],
          },
        },
        {
          kind: 'p',
          text: 'Áp dụng cho: [[Ứng tuyển|Apply]] (trang chi tiết tin: [[Nộp đơn|Apply]]), [[Ứng tuyển hàng loạt|Batch apply]], Lưu tin (nút ngôi sao), [[Theo dõi|Follow]] công ty, chuông thông báo.',
        },
        {
          kind: 'warn',
          text: 'Ô [[Ghi nhớ email|Remember my email]] trong hộp này **chưa có tác dụng** — tick hay không thì lần sau email cũng không được điền sẵn.',
        },
      ],
    },
    {
      id: 'loi-dang-nhap',
      group: 'Đăng nhập',
      code: 'ĐN4',
      label: 'Lỗi khi đăng nhập',
      title: 'Không đăng nhập được — tra nhanh',
      lead:
        'Hệ thống chỉ cho biết trạng thái tài khoản **sau khi mật khẩu đúng**. Sai email hay sai mật khẩu đều ra cùng một câu, có chủ đích.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Thông báo (dưới ô mật khẩu)', 'Nghĩa là', 'Cách xử lý'],
            rows: [
              ['“Email hoặc mật khẩu không đúng.”', 'Sai email, sai mật khẩu, **tài khoản chỉ có mạng xã hội** (chưa từng có mật khẩu), hoặc đang dùng tài khoản nhà tuyển dụng ở tab [[Ứng viên|Jobseeker]].', 'Kiểm tra tab, thử nút mạng xã hội, hoặc [[Quên mật khẩu|Forgot password]].'],
              ['“Tài khoản này đã bị vô hiệu hóa.”', 'Admin đã tắt tài khoản.', 'Liên hệ CS.'],
              ['“Tài khoản này đã bị xoá và không thể sử dụng lại.”', 'Tài khoản đã xoá.', 'Chỉ CS khôi phục được, và chỉ trong **72 giờ** sau khi xoá.'],
              ['“Vui lòng xác thực email để tiếp tục.” + khung [[Kiểm tra email của bạn|Check your email]]', 'Tài khoản cũ chưa xác thực email (tài khoản mới tạo không gặp).', 'Bấm [[Gửi lại email xác thực|Resend verification email]] (tối đa 3 lần/giờ), mở link trong email rồi đăng nhập lại.'],
              ['“Quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.”', 'Quá 10 lần thử/phút cho cùng email hoặc cùng mạng.', 'Đợi một phút. **Không có khoá tài khoản** vì sai mật khẩu nhiều lần.'],
              ['“Đã xảy ra lỗi. Vui lòng thử lại.”', 'Lỗi chung.', 'Thử lại; vẫn lỗi thì báo kỹ thuật.'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Thông báo trên đầu trang (đến từ link)',
          table: {
            cols: ['Thông báo', 'Khi nào'],
            rows: [
              ['“Email của bạn đã được xác thực. Vui lòng đăng nhập.” (xanh)', 'Sau khi bấm link xác thực trong email.'],
              ['“Liên kết xác thực không hợp lệ hoặc đã hết hạn.”', 'Link xác thực quá 24 giờ hoặc đã dùng.'],
              ['“Khu vực này dành cho loại tài khoản khác. Vui lòng đăng nhập bằng tài khoản phù hợp.”', 'Mở trang của nhà tuyển dụng bằng tài khoản ứng viên (hoặc ngược lại).'],
            ],
          },
        },
      ],
    },
    {
      id: 'dang-xuat',
      group: 'Đăng nhập',
      code: 'ĐN5',
      label: 'Đăng xuất & phiên',
      title: 'Đăng xuất và thời gian giữ đăng nhập',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Bấm [[Đăng xuất|Logout]] trong menu tài khoản ở header (hoặc trong [[Cài đặt tài khoản|Account settings]]).',
            'Không có hộp xác nhận. Trang về trang chủ ngay.',
          ],
        },
        {
          kind: 'p',
          text: 'Đăng xuất chỉ áp dụng cho **thiết bị đang dùng**. Muốn đăng xuất mọi thiết bị: đặt lại mật khẩu qua [[Quên mật khẩu|Forgot password]] (xem QM2).',
        },
      ],
    },

    /* ── QUÊN MẬT KHẨU ────────────────────────────────────────────────────── */
    {
      id: 'quen-mat-khau',
      group: 'Quên mật khẩu',
      code: 'QM1',
      label: 'Xác thực để lấy lại',
      title: 'Quên mật khẩu — bước 1: xác thực',
      where: '/auth/forgot-password',
      lead:
        'Trang [[Tìm mật khẩu cho ứng viên|Find password for jobseeker]]. Hai tab: [[Tìm bằng số điện thoại|Find by phone number]] (mặc định) và [[Tìm bằng email|Find by email address]]. Không còn gửi link đặt lại qua email — mọi thứ làm trên cùng trang bằng mã 6 số.',
      blocks: [
        {
          kind: 'flow',
          items: [
            { label: 'Nhập số / email → [[Xác thực|Verify]]' },
            { label: 'Nhập mã → [[Kiểm tra|Check]]' },
            { label: '[[Đặt lại mật khẩu|Reset password]]' },
            { label: '[[Mật khẩu mới|New password]] + [[Xác nhận mật khẩu|Confirm password]]' },
            { label: 'Xong → [[Đến trang đăng nhập|Go to sign in]]' },
          ],
        },
        {
          kind: 'steps',
          items: [
            'Trang [[Đăng nhập|Sign in]] → bấm [[Quên mật khẩu|Forgot password]].',
            'Chọn tab: [[Tìm bằng số điện thoại|Find by phone number]] (mã qua Zalo) hoặc [[Tìm bằng email|Find by email address]] (mã qua email “[Saramin] Mã xác thực đặt lại mật khẩu”).',
            'Nhập số / email → bấm [[Xác thực|Verify]]. Nút chuyển thành đếm ngược, hết giờ thì thành [[Gửi lại|Resend]].',
            'Nhập mã vào ô [[Mã xác minh|Verification code]] → bấm [[Kiểm tra|Check]]. Thành công hiện [[Đã xác thực số điện thoại|Number verified]] / [[Đã xác thực email|Email verified]].',
            'Nút xanh lớn [[Đặt lại mật khẩu|Reset password]] sáng lên → bấm để sang bước 2.',
          ],
        },
        {
          kind: 'table',
          heading: 'Thông báo ở bước này',
          table: {
            cols: ['Thông báo', 'Nghĩa là / Cách xử lý'],
            rows: [
              ['“Không tìm thấy tài khoản nào có thể khôi phục bằng số điện thoại này. Vui lòng kiểm tra lại số, hoặc khôi phục bằng email.”', 'Số chưa gắn tài khoản nào. Thử tab [[Tìm bằng email|Find by email address]]. (Có chủ đích cho biết rõ — quyết định sản phẩm 28/09.)'],
              ['“Không tìm thấy tài khoản nào có thể khôi phục bằng email này…”', 'Email chưa đăng ký. Thử tab [[Tìm bằng số điện thoại|Find by phone number]].'],
              ['“Số này đang gắn với nhiều tài khoản nên không xác định được cần đặt lại mật khẩu nào. Vui lòng dùng email.”', 'Dùng tab [[Tìm bằng email|Find by email address]].'],
              ['“Còn {n} lần thử.” / “Đã hết số lần thử với mã này. Hãy gửi mã mới.”', 'Sai mã. Mỗi mã cho 3 lần.'],
              ['“Mã này đã hết hạn. Hãy gửi mã mới.”', 'Quá 3 phút.'],
              ['“Mã đó đã được thay thế…”', 'Đang nhập mã cũ sau khi bấm [[Gửi lại|Resend]].'],
              ['“Quá nhiều yêu cầu. Vui lòng thử lại sau {n} giây.”', 'Chưa đủ 60 giây, hoặc đã xin 3 mã.'],
              ['“Nhập sai mã quá nhiều lần. Vui lòng thử lại sau…”', 'Số điện thoại bị khoá 24 giờ (sai 5 lần/24 giờ). Tab [[Tìm bằng email|Find by email address]] không bị khoá kiểu này.'],
              ['“Hiện chưa thể xác minh qua điện thoại. Vui lòng liên hệ bộ phận hỗ trợ Saramin.”', 'Kênh Zalo chưa sẵn sàng → dùng tab [[Tìm bằng email|Find by email address]].'],
            ],
          },
        },
        {
          kind: 'tip',
          text: 'Đổi số / email hoặc chuyển tab sẽ huỷ mã đang chờ. Trang **không hiển thị** mã đã gửi tới số nào — người dùng tự kiểm tra Zalo/email của đúng số/địa chỉ vừa gõ.',
        },
        {
          kind: 'p',
          text: 'Tài khoản tạo bằng mạng xã hội cũng dùng được trang này để **đặt mật khẩu lần đầu**, sau đó đăng nhập được bằng email + mật khẩu.',
        },
        { kind: 'links', items: [{ label: 'Quên mật khẩu', path: '/auth/forgot-password' }] },
      ],
    },
    {
      id: 'dat-lai-mat-khau',
      group: 'Quên mật khẩu',
      code: 'QM2',
      label: 'Đặt mật khẩu mới',
      title: 'Quên mật khẩu — bước 2: đặt mật khẩu mới',
      where: '/auth/forgot-password (cùng trang)',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Nhập [[Mật khẩu mới|New password]] (quy tắc như lúc đăng ký: 8–128 ký tự, 1 chữ số, 1 ký tự đặc biệt, 1 chữ hoa).',
            'Nhập lại ở [[Xác nhận mật khẩu|Confirm password]].',
            'Bấm [[Đặt lại mật khẩu|Reset password]]. Màn hình hiện “Mật khẩu của bạn đã được đặt lại — Mọi thiết bị khác đã bị đăng xuất. Hãy đăng nhập bằng mật khẩu mới.”',
            'Bấm [[Đến trang đăng nhập|Go to sign in]] và đăng nhập bằng mật khẩu mới.',
          ],
        },
        {
          kind: 'table',
          table: {
            cols: ['Thông báo', 'Nghĩa là'],
            rows: [
              ['“Mật khẩu phải có từ 8 đến 128 ký tự.” · “…ít nhất một chữ số.” · “…ít nhất một ký tự đặc biệt.” · “…ít nhất một chữ in hoa (A-Z).”', 'Chưa đủ điều kiện.'],
              ['“Hai mật khẩu không khớp nhau.”', 'Hai ô khác nhau.'],
              ['“Phiên xác minh của bạn đã hết hạn. Vui lòng bắt đầu lại.”', 'Quá **10 phút** từ lúc xác thực mã. Trang tự quay về bước 1.'],
            ],
          },
        },
        {
          kind: 'warn',
          text: '**Không tự đăng nhập** sau khi đặt lại. **Mọi thiết bị** đang đăng nhập đều bị đăng xuất, và một email “[Saramin] Mật khẩu của bạn đã được thay đổi” được gửi đi. Nếu người dùng nhận email này mà không tự đổi → hướng dẫn đặt lại mật khẩu ngay và báo CS.',
        },
      ],
    },
    {
      id: 'link-cu',
      group: 'Quên mật khẩu',
      code: 'QM3',
      label: 'Link đặt lại cũ',
      title: 'Link đặt lại mật khẩu cũ trong email',
      where: '/auth/reset-password?token=…',
      lead:
        'Trang này chỉ mở từ link email **cũ** hoặc link do **admin** gửi cho ứng viên. Link sống **1 giờ**, dùng một lần; yêu cầu link mới thì link trước mất hiệu lực.',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Mở link trong email → trang [[Đặt mật khẩu mới|Set a new password]].',
            'Nhập **một** ô mật khẩu mới (không có ô xác nhận) → [[Cập nhật mật khẩu|Update password]].',
            'Thành công: **tự đăng nhập** và về trang chủ (khác với QM2).',
          ],
        },
        {
          kind: 'warn',
          text: 'Trang này **không kiểm tra chữ in hoa** trước khi gửi, nhưng hệ thống vẫn bắt buộc. Thiếu chữ hoa sẽ ra “Đã xảy ra lỗi. Vui lòng thử lại.” — hướng dẫn người dùng thêm một chữ in hoa.',
        },
        {
          kind: 'p',
          text: 'Link hết hạn / đã dùng: “Liên kết đặt lại không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.” kèm link [[Yêu cầu liên kết mới|Request a new link]] (dẫn về QM1).',
        },
      ],
    },

    /* ── TRA CỨU ──────────────────────────────────────────────────────────── */
    {
      id: 'diem-chua-khop',
      group: 'Tra cứu',
      code: 'BK',
      label: 'Điểm chưa khớp đã biết',
      title: 'Điểm chưa khớp đã biết trong build',
      lead: 'Không phải thao tác sai của người dùng. Ghi lại để QA không báo trùng và CS biết trả lời.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Ở đâu', 'Hiện tượng'],
            rows: [
              ['Đăng ký — điều khoản', 'Không tick ô bắt buộc mà bấm [[Đăng ký|Sign up]]: không có phản hồi nào.'],
              ['Đăng ký — mật khẩu', 'Chữ có dấu / dấu cách được tính là ký tự đặc biệt ở màn hình nhưng bị hệ thống từ chối.'],
              ['Đăng ký — ở nước ngoài', 'Xác thực email quá 10 phút chỉ báo lỗi chung.'],
              ['Đăng ký — mã OTP', 'Hệ thống có trả về số lần thử còn lại nhưng màn hình đăng ký không hiển thị.'],
              ['Đăng ký — số điện thoại', 'Không có ô mã quốc gia, không gõ được dấu “+”, kể cả khi ở nước ngoài.'],
              ['Đăng ký — mobile', 'Tiêu đề header trên điện thoại ở form email và [[Hoàn tất đăng ký|Finish signing up]] ghi [[Đăng nhập|Sign In]].'],
              ['Đăng ký — banner', 'Slide 2, 4, 5 quảng bá dịch vụ chỉ có ở Hàn Quốc (đánh giá năng lực, đề nghị vị trí, thưởng 500.000 KRW).'],
              ['Đăng ký — tuổi', 'Tối thiểu 15 tuổi lấy theo Hàn Quốc, đang chờ xác nhận pháp lý VN.'],
              ['Hoàn tất đăng ký', 'Lỗi email sai định dạng / lỗi chung hiện thành “Phiên của bạn đã hết hạn…”.'],
              ['Đăng nhập MXH', 'Email trùng tài khoản chưa xác thực (hoặc qua Facebook): về trang [[Đăng nhập|Sign in]] mà không có thông báo.'],
              ['Đăng nhập — mobile', 'Không có nút [[Đăng ký tài khoản ứng viên|Create a jobseeker account]] trên trang [[Đăng nhập|Sign in]].'],
              ['Đăng nhập — đã đăng nhập', 'Mở lại `/auth/sign-in` hay `/auth/sign-up` khi đang đăng nhập vẫn hiện form (không tự chuyển đi).'],
              ['Hộp đăng nhập nổi', '[[Ghi nhớ email|Remember my email]] không có tác dụng.'],
              ['Quên mật khẩu', 'Không hiển thị “đã gửi mã tới 090•••”.'],
              ['Link đặt lại cũ', 'Không kiểm tra chữ hoa; không có ô xác nhận; không đăng xuất các thiết bị khác.'],
              ['Tìm ID', 'Chưa có trang.'],
            ],
          },
        },
      ],
    },
    {
      id: 'moi-truong',
      group: 'Tra cứu',
      code: 'MT',
      label: 'Môi trường dev',
      title: 'Môi trường dev — vì sao không nhận được mã',
      dev: true,
      lead:
        'Mấy công tắc dưới đây quyết định trang dev hành xử ra sao. Giá trị thật nằm trong secret CI (`SVN_FE_ENV`) và `bin/.env` trên máy chủ, **không có trong repo** — kiểm tra trên trình duyệt trước khi kết luận.',
      blocks: [
        {
          kind: 'table',
          table: {
            cols: ['Công tắc', 'Mặc định', 'Hệ quả'],
            rows: [
              ['`NEXT_PUBLIC_USE_MOCK`', 'bật nếu không đặt', 'Mock: đăng nhập luôn thành công, mã nào 6 số cũng đúng (recovery nhận `000000`), đăng ký không tạo tài khoản thật.'],
              ['`NEXT_PUBLIC_{GOOGLE,FACEBOOK,LINKEDIN}_OAUTH_ENABLED`', '`false`', 'Tắt: nút vẫn hiện, bấm ra toast “sẽ sớm ra mắt”. BE cũng có cờ `SVN_*_OAUTH_ENABLED` riêng (tắt → 404).'],
              ['`SVN_ZALO_PROVIDER`', '`none` (profile `staging`: `log`)', '`log`: mã OTP điện thoại **chỉ ghi vào log máy chủ**, không gửi Zalo. `none`: 503 `SVN-2020`. Cần `zns` + OA đã xác minh để gửi thật.'],
              ['`SVN_MAIL_ENABLED`', '`false`', 'Tắt: mã email, email chào mừng, email đổi mật khẩu **không được gửi**; stub chỉ log người nhận đã che.'],
            ],
          },
        },
        {
          kind: 'warn',
          text: 'Theo `docker-compose.dev.yml`, host dev **chưa nối Zalo/SMS và tắt mail**. Nếu vẫn đúng, người dùng thật trên dev **không hoàn tất được luồng Việt Nam** trừ khi có người đọc mã từ log. QA cần số trong allow-list hoặc quyền xem log.',
        },
      ],
    },
    {
      id: 'api',
      group: 'Tra cứu',
      code: 'API',
      label: 'Endpoint & mã lỗi',
      title: 'Endpoint và mã lỗi',
      dev: true,
      lead:
        'Tất cả dưới `/api/{vi|en}/auth` (giao diện tiếng Hàn gọi `en`). FE gọi qua BFF phía server. Controller: `WebAuthController`, `WebPhoneOtpController`, `WebSignUpEmailOtpController`, `WebOAuthController`, `WebAccountRecoveryController`.',
      blocks: [
        {
          kind: 'table',
          heading: 'Đăng ký',
          table: {
            cols: ['Method + path', 'FE gọi từ', 'Mã trả về'],
            rows: [
              ['POST `/phone/otp` {phone, purpose: SIGN_UP}', '`features/auth/phone-verification/api/phone-otp.api.ts`', '202 · 409 `SVN-2032` · 423 `SVN-2016` · 429 `SVN-2017`/`1007` · 503 `SVN-2020`'],
              ['POST `/phone/otp/verify`', '`phone-otp.api.ts`', '200 {phoneVerificationToken, 30 phút} · 400 `SVN-2019` (+attemptsLeft) / `2018` · 410 `SVN-2015`'],
              ['POST `/email/otp`', '`member-join-detail/api/signup-email-otp.api.ts`', '202 {maskedEmail} · 409 `SVN-1005` / `2008` · 429 `SVN-2017`'],
              ['POST `/email/otp/verify`', '`signup-email-otp.api.ts`', '200 {verificationToken, 10 phút} · 400 `SVN-2019`/`2018` · 410 `SVN-2015`'],
              ['POST `/sign-up`', '`member-join-detail/api/join-detail.api.ts`', '201 + cookie phiên · 409 `SVN-1005`/`2008`/`2032` · 401 `SVN-2021` · 403 `SVN-2026` · 400 `SVN-2010`/`1006` · 429 `SVN-1007` (5/phút/IP)'],
              ['POST `/oauth/pending` · `/oauth/complete`', '`complete-signup/api/complete-signup.api.ts`', '200 + cookie · `SVN-2002` (pending 30 phút) · `1005` · `2007`/`2008` · `2003`'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Đăng nhập & phiên',
          table: {
            cols: ['Method + path', 'FE gọi từ', 'Mã trả về'],
            rows: [
              ['POST `/sign-in` {email, password, keepLoggedIn}', '`features/auth/sign-in/api/sign-in.api.ts`', '200 · 401 `SVN-2000`/`2001`/`2007` · 403 `SVN-2003` · 429 `SVN-1007` (10/phút/IP và /email)'],
              ['GET `/oauth/{provider}` → `/callback`', '`app/[lang]/auth/oauth/start/route.ts`', 'lỗi → `/auth/sign-in?error=oauth_*`'],
              ['POST `/oauth/exchange`', '`app/[lang]/auth/oauth/landing/route.ts`', 'code 1 phút · 401 `SVN-2002`'],
              ['POST `/resend-verification`', '`features/auth/email-verification/api/resend-verification.api.ts`', '200 trung tính · 429 (3/giờ/email)'],
              ['POST `/refresh`', '`proxy.ts`', 'access 30 phút; refresh 1 ngày / 14 ngày (keepLoggedIn)'],
              ['POST `/sign-out`', '`features/auth/session/api/sign-out.api.ts`', 'thu hồi refresh token của thiết bị này'],
            ],
          },
        },
        {
          kind: 'table',
          heading: 'Quên mật khẩu',
          table: {
            cols: ['Method + path', 'FE gọi từ', 'Mã trả về'],
            rows: [
              ['POST `/recovery/phone/otp` · `/recovery/email/otp`', '`features/auth/recovery/services/recovery.service.ts`', '202 · 404 `SVN-2033` · 409 `SVN-2024` · 423 `SVN-2016` · 429 `SVN-2017` · 503 `SVN-2020`'],
              ['POST `/recovery/otp/verify` · `/recovery/email/otp/verify`', '`recovery.service.ts`', '200 {token, 10 phút} · 400 `SVN-2019`/`2018` · 410 `SVN-2015`'],
              ['POST `/recovery/reset-password`', '`recovery.service.ts`', '200 (revokeAll, không tạo phiên) · 401 `SVN-2021` · 400 `SVN-2010`'],
              ['POST `/reset-password` {token}', '`features/auth/reset-password/api/reset-password.api.ts`', '200 + auto-login · 401 `SVN-2002` · 400 `SVN-2010` (FE chưa map)'],
              ['POST `/forgot-password`', '`forgot-password.api.ts` — **code chết**, không màn hình nào gọi', 'luôn 200'],
            ],
          },
        },
      ],
    },
]

export const HANDBOOK: Handbook = {
  modules: [ACCOUNT_MODULE, CV_MODULE, COPY_MODULE],
  sections: [...ACCOUNT_SECTIONS.map((s) => ({ ...s, module: ACCOUNT_MODULE.id })), ...CV_SECTIONS, ...COPY_SECTIONS],
  source: { web: 'bfb3ef8', be: '6a1fee8', date: '04/10/2026' },
}
