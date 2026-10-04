/*
 * Screenshots per guide page.
 *
 * Captured from svn-web `dev` (bfb3ef8) run locally in mock mode — the real
 * screens and the real copy, filled with sample data (the candidate "Trần Minh
 * Anh", the job "[LG CNS] …"). dev.svn.topdev.asia itself could not be reached
 * from the capture machine. Re-capture with the script in scripts/shoot.cjs.
 */
export interface Shot {
  src: string
  caption: string
}

const s = (file: string, caption: string): Shot => ({ src: `shots/${file}.jpg`, caption })

export const SHOTS_SOURCE = 'svn-web dev @ bfb3ef8, chạy với dữ liệu mẫu'

export const SHOTS: Record<string, Shot[]> = {
  /* ── Tài khoản ── */
  'tong-quan': [s('acc-sign-up', 'Đăng ký — bước 1: chọn mạng xã hội hoặc Tạo tài khoản bằng email')],
  'dang-ky-email': [
    s('acc-sign-up-detail', 'Form Đăng ký tài khoản ứng viên Saramin (toàn trang)'),
    s('acc-password', 'Mật khẩu — danh sách 4 điều kiện sáng dần khi gõ'),
    s('acc-phone-otp', 'Số điện thoại — sau khi bấm Xác thực: ô nhập mã và đồng hồ đếm ngược'),
    s('acc-phone-verified', 'Số điện thoại — đã xác thực, nút đổi thành Đổi số'),
    s('acc-terms', 'Khối Điều khoản: Đồng ý tất cả, 1 ô bắt buộc, 3 ô tuỳ chọn'),
  ],
  'dang-ky-nuoc-ngoai': [s('acc-abroad', 'Tick Tôi đang ở nước ngoài — ô Email có nút Xác thực')],
  'dang-ky-mxh': [s('acc-complete-signup', 'Hoàn tất đăng ký sau khi đăng nhập bằng mạng xã hội')],
  'sau-dang-ky': [s('acc-welcome', 'Trang Chào mừng — bước 1/5 của thiết lập ban đầu')],
  'loi-dang-ky': [s('acc-signup-errors', 'Lỗi hiện dưới từng ô khi rời ô để trống')],
  'dang-nhap': [s('acc-sign-in', 'Trang Đăng nhập — tab Ứng viên')],
  'dang-nhap-mxh': [s('acc-sign-in-oauth', 'Thông báo đỏ khi đăng nhập mạng xã hội thất bại')],
  'loi-dang-nhap': [
    s('acc-sign-in-errors', 'Bấm Đăng nhập khi để trống'),
    s('acc-sign-in-verified', 'Thông báo xanh sau khi bấm link xác thực email'),
    s('acc-account-deleted', 'Trang Tài khoản của bạn đã được xoá'),
  ],
  'quen-mat-khau': [
    s('acc-forgot', 'Tìm mật khẩu cho ứng viên — tab Tìm bằng số điện thoại'),
    s('acc-forgot-code', 'Sau khi bấm Xác thực: ô Mã xác minh và nút Kiểm tra'),
    s('acc-forgot-verified', 'Đã xác thực — nút Đặt lại mật khẩu sáng lên'),
  ],
  'dat-lai-mat-khau': [s('acc-forgot-step2', 'Bước 2: Mật khẩu mới và Xác nhận mật khẩu')],
  'link-cu': [s('acc-reset-legacy', 'Trang Đặt mật khẩu mới mở từ link email cũ')],

  /* ── CV ── */
  'cv-tong-quan': [
    s('cv-list', 'Quản lý CV — phần đầu trang'),
    s('cv-new', 'Thêm CV mới — hai hướng: Tải CV lên / Tạo CV Saramin'),
  ],
  'cv-chao-mung': [s('acc-welcome', 'Chào mừng — bước 1/5')],
  'cv-dieu-kien': [s('cv-work-pref', 'Chỉnh sửa điều kiện làm việc mong muốn')],
  'cv-bat-dau': [s('cv-builder', 'Trình tạo CV — phần đầu, cột Mức độ hoàn thiện CV và thanh Lưu dưới cùng')],
  'cv-thong-tin-ca-nhan': [s('cv-basic-info', 'Khung Thông tin cơ bản (mở bằng biểu tượng bút)')],
  'cv-cac-muc': [s('cv-builder-full', 'Trình tạo CV — toàn trang, đủ các mục')],
  'cv-kinh-nghiem-hoc-van': [s('cv-experience', 'Chọn Có kinh nghiệm — ô nhập Kinh nghiệm làm việc tự mở')],
  'cv-ky-nang-khac': [s('cv-skills', 'Kỹ năng — ô tìm và gợi ý chọn nhanh')],
  'cv-luu': [
    s('cv-save-blocked', 'Bấm Lưu khi còn ô đang soạn — thông báo đỏ, mục chuyển đỏ ở cột phải'),
    s('cv-detail', 'Sửa một CV Saramin đã lưu'),
  ],
  'cv-tai-len': [
    s('cv-upload', 'Trang tải CV lên'),
    s('cv-upload-modal', 'Hộp Đính kèm tệp'),
    s('cv-upload-existing', 'CV tải lên đã có — xem trước tệp'),
  ],
  'cv-quan-ly': [s('cv-list-full', 'Quản lý CV — toàn trang')],
  'cv-hien-thi': [s('cv-visibility', 'Câu hỏi hiển thị cuối trình tạo CV — khi đang có CV khác hiển thị')],
  'cv-ung-tuyen': [
    s('cv-job', 'Trang tin tuyển dụng — nút Nộp đơn'),
    s('cv-apply', 'Khung ứng tuyển: CV đã chọn, Đổi CV, Thư xin việc, nút Ứng tuyển'),
  ],
  'cv-luot-xem': [s('cv-viewing', 'Tình trạng xem CV')],
}
