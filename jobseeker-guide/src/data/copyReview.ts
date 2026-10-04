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
