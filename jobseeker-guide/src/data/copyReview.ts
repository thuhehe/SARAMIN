/*
 * DUYỆT NỘI DUNG — the client copy review.
 *
 * Every string a jobseeker sees on the account screens, one row each, with a
 * stable ID the client quotes back ("sửa SD-07"). The rows come from
 * copy.generated.json, which scripts/build-copy.mjs pulls out of svn-web: the
 * text here is never typed by hand, so what the client approves is what the
 * build ships.
 */
import data from './copy.generated.json'
import type { GuideSection } from './types'

export interface CopyRow {
  id: string
  where: string
  note?: string
  keys: string[]
  vi: string
  en: string
  ko: string
}

export interface CopyScreen {
  id: string
  screen: string
  path: string
  note?: string
  items: CopyRow[]
}

export const COPY_SOURCE: { web: string; date: string } = data.source
export const COPY_SCREENS = data.screens as CopyScreen[]
export const copyScreen = (id: string) => COPY_SCREENS.find((s) => s.id === id)

export const COPY_GROUP = 'Duyệt nội dung'
export const COPY_LANGS = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'ko', label: '한국어' },
] as const
export type CopyLang = (typeof COPY_LANGS)[number]['id']

const total = COPY_SCREENS.reduce((n, s) => n + s.items.length, 0)

export const COPY_SECTIONS: GuideSection[] = [
  {
    id: 'duyet-noi-dung',
    group: COPY_GROUP,
    code: 'ND',
    label: 'Cách duyệt',
    title: 'Duyệt nội dung — cách đọc bảng',
    lead: `Toàn bộ chữ người tìm việc nhìn thấy trên ${COPY_SCREENS.length} màn hình Tài khoản — ${total} dòng, lấy thẳng từ build (svn-web @ ${COPY_SOURCE.web}, ${COPY_SOURCE.date}), không gõ lại bằng tay.`,
    blocks: [
      {
        kind: 'steps',
        items: [
          'Mỗi dòng có một **mã** (ví dụ `SD-07`): hai chữ đầu là màn hình, số là thứ tự xuất hiện trên màn hình đó. Khi góp ý, chỉ cần ghi mã + nội dung muốn sửa.',
          'Cột **Vị trí** cho biết chữ nằm ở đâu; dòng nhỏ bên dưới là **khi nào** chữ đó hiện (ví dụ chỉ hiện khi có lỗi).',
          'Phần trong ngoặc nhọn như `{seconds}` hay `{email}` là chỗ hệ thống **tự điền** (số giây, địa chỉ email…) — giữ nguyên ngoặc khi sửa câu.',
          'Chữ xuống dòng trên màn hình thì trong bảng cũng xuống dòng đúng chỗ đó.',
          'Dùng **Sao chép** để dán vào Excel / Google Sheets: mỗi màn hình một bảng, hoặc tất cả cùng lúc. Bảng dán ra có sẵn cột **Ý kiến** để ghi góp ý.',
        ],
      },
      { kind: 'copy-all' },
      {
        kind: 'tip',
        text: 'Ba ngôn ngữ đều có trên site: tiếng Việt (mặc định), English và 한국어. Bật / tắt cột ngôn ngữ bằng các nút phía trên mỗi bảng.',
      },
    ],
  },
  /* Written by hand against the generated IDs — re-check the IDs whenever
     build-copy.mjs reports a change in a screen's row count. */
  {
    id: 'nd-can-quyet-dinh',
    group: COPY_GROUP,
    code: 'QĐ',
    label: 'Điểm cần khách quyết định',
    title: 'Điểm cần khách hàng quyết định',
    lead: 'Những chỗ chúng tôi thấy khi rà chữ. Không phải lỗi gõ đơn thuần — mỗi điểm cần một quyết định về nội dung.',
    blocks: [
      {
        kind: 'table',
        table: {
          cols: ['Mã dòng', 'Vấn đề', 'Cần quyết định'],
          rows: [
            ['SU-17 · SU-18 · SU-21 · SU-22 · SU-24', 'Banner đăng ký quảng bá **dịch vụ chỉ có ở Hàn Quốc**: bài kiểm tra năng khiếu (slide 2), đề nghị vị trí (slide 4), thưởng **500.000 KRW** (slide 5).', 'Bỏ các slide này, hay viết lại cho dịch vụ có ở Việt Nam?'],
            ['SU-06', 'Trang **đăng ký** nhưng tiêu đề khối mạng xã hội là “Đăng nhập mạng xã hội”.', 'Đổi thành “Đăng ký bằng mạng xã hội”?'],
            ['SD-03 · CS-02', 'Trên điện thoại, tiêu đề header của màn đăng ký là **“Đăng nhập”**.', 'Xác nhận cần sửa thành “Đăng ký”.'],
            ['SD-20 · SD-57 · CS-38', 'Cùng một ô nhưng hai cách viết: “Nhập mã 6 số” và “Nhập mã 6 chữ số”.', 'Chọn một cách viết.'],
            ['SD-33 · SD-99 …', 'Cùng một ý, hai câu: “Đã có lỗi xảy ra. Vui lòng thử lại.” và “Đã xảy ra lỗi. Vui lòng thử lại.”', 'Chọn một câu dùng chung.'],
            ['FP-03', 'Tiêu đề “Tìm mật khẩu cho ứng viên” — mật khẩu không “tìm” được, chỉ đặt lại được.', 'Đổi thành “Đặt lại mật khẩu”?'],
            ['FP-39 · FP-53', 'Hai nút khác việc nhưng **cùng chữ** “Đặt lại mật khẩu” (bước 1: sang bước tiếp; bước 2: lưu mật khẩu).', 'Đổi nút bước 1 thành “Tiếp tục”?'],
            ['FP-41', '“Nhập hai lần để một lỗi gõ nhầm không khoá bạn ở ngoài.” đọc như dịch máy.', 'Viết lại câu hướng dẫn.'],
            ['FP-17 · FP-27', 'Đếm ngược hiển thị “Hết hạn sau 45” (không có đơn vị); khoá 24 giờ hiện thành “1440:00”.', 'Định dạng thời gian mong muốn (ví dụ “45 giây”, “24 giờ”).'],
            ['SI-23 · LR-05', 'Để trống ô email mà bấm Đăng nhập thì báo “Định dạng email không hợp lệ.” — không có câu “Vui lòng nhập email.”', 'Thêm câu riêng cho ô trống?'],
            ['SD-47', 'Tiếng Anh sai ngữ pháp: “At least 1 special characters”.', 'Sửa thành “At least 1 special character”.'],
            ['SD-07 · SD-14', 'Tiếng Anh thiếu dấu chấm cuối câu, khác các câu báo lỗi còn lại.', 'Thống nhất dấu chấm.'],
            ['SD-03 · SI-12 · LR-22 · FP-58 · SO-01', 'Tiếng Anh không thống nhất: “Sign in / Sign In / Log in / Login failed / Sign Up / Logout”.', 'Chọn một bộ từ (ví dụ “Sign in / Sign up / Sign out”).'],
            ['CS-35', 'Ô Email có placeholder đúng bằng nhãn “Email”.', 'Thêm gợi ý, ví dụ “Nhập email của bạn”.'],
            ['RP-12', 'Link đặt lại cũ dùng quy tắc mật khẩu khác (chữ + số, không cần chữ hoa) so với đăng ký và quên mật khẩu.', 'Thống nhất một bộ quy tắc mật khẩu.'],
          ],
        },
      },
      {
        kind: 'warn',
        text: 'Không có dòng nào trong bảng cho trường hợp **chưa tick điều khoản bắt buộc** khi đăng ký: câu báo lỗi có trong code nhưng **không bao giờ hiện** — người dùng bấm Đăng ký và không thấy gì. Đây là lỗi của build, cần sửa cùng lúc với nội dung.',
      },
      {
        kind: 'p',
        text: 'Ngoài bảng: vài nhãn chỉ dành cho trình đọc màn hình đang là tiếng Anh ở mọi ngôn ngữ (“Change language”, “Show password / Hide password” ở bước 2 Quên mật khẩu) và nút Quay lại trên điện thoại chưa có nhãn. Tiếng Hàn đã dịch đủ nhưng **chưa chọn được** trên trang người tìm việc.',
      },
    ],
  },
  ...COPY_SCREENS.map<GuideSection>((s) => ({
    id: `nd-${s.id.toLowerCase()}`,
    group: COPY_GROUP,
    code: s.id,
    label: s.screen,
    title: s.screen,
    where: s.path,
    lead: s.note,
    blocks: [{ kind: 'copy', screen: s.id }],
  })),
]

/** Text a section's search should match — the rows, not just the screen id. */
export function copyHaystack(screenId: string) {
  const s = copyScreen(screenId)
  if (!s) return ''
  return s.items.map((r) => [r.id, r.where, r.note ?? '', r.vi, r.en, r.ko].join(' ')).join(' ')
}

/* ── export ───────────────────────────────────────────────────────────────── */

const HEAD = ['Mã', 'Màn hình', 'Vị trí', 'Khi nào hiện', 'Tiếng Việt', 'English', '한국어', 'Ý kiến']

function rowsFor(screens: CopyScreen[]) {
  return screens.flatMap((s) => s.items.map((r) => [r.id, s.screen, r.where, r.note ?? '', r.vi, r.en, r.ko, '']))
}

/** Tab-separated, cells quoted when they hold a tab, quote or line break —
    the shape Excel and Google Sheets both accept from the clipboard. */
export function toTsv(screens: CopyScreen[]) {
  const cell = (v: string) => (/[\t"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [HEAD, ...rowsFor(screens)].map((r) => r.map(cell).join('\t')).join('\n')
}

/** CSV with a BOM, so Excel opens the Vietnamese and Korean text as UTF-8. */
export function toCsv(screens: CopyScreen[]) {
  const cell = (v: string) => `"${v.replace(/"/g, '""')}"`
  return '﻿' + [HEAD, ...rowsFor(screens)].map((r) => r.map(cell).join(',')).join('\r\n')
}
