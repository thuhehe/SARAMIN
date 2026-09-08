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
