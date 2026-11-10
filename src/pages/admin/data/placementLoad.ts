/*
 * Placement load — mỗi band có bao nhiêu slot, bao nhiêu tin đang hiển thị, và bao
 * nhiêu tin đang chờ (hoặc bao nhiêu slot bị bỏ trống).
 *
 * HAI CON SỐ, KHÔNG HƠN (chốt với PO 10/11/2026). Bản đầu tiên tách bốn nhóm —
 * đang hiện / chờ lượt xoay / không bao giờ hiện / ô trống — và PO cắt xuống còn
 * hai: `showing` và `waiting` (hoặc `empty` khi thiếu tin). Xem ghi chú POOL_CAVEAT
 * bên dưới: phần bị cắt KHÔNG biến mất khỏi hệ thống, nó chỉ không còn được tách
 * ra trên màn hình này.
 *
 * NUMBERS ARE REAL. `itemsShown` / `eligible` / `feeders` đọc từ staging 10/11/2026:
 *   GET /api/admin/placements               → registry (47 dòng, 27 TIER + ACTIVE)
 *   GET /api/admin/jobs/placement-board     → { feeds[], loads[] }; loads[].showing
 *                                             = số tin đang giữ một sản phẩm feed
 * `cols` đo trực tiếp trên stg-saramin.saramin.vn cùng ngày bằng cách đọc toạ độ
 * card thật, không phải ước lượng: Highlight jobs 24 ô = 4 cột × 6 dòng, Latest jobs
 * 30 ô = 5 cột × 6 dòng, Diverse opportunities 36 ô = 6 cột × 6 dòng — khớp chính
 * xác `itemsShown` của registry, nên lưới trên màn hình này là lưới thật của trang.
 */

export const PL_TODAY_LABEL = '10/11/2026'
export const PL_SOURCE = 'staging · 10/11/2026'

/**
 * Vì sao “đang chờ” không hoàn toàn đúng với svn-be, và vì sao vẫn hiển thị thế.
 *
 * svn-be sắp theo `refreshed_at desc`, CẮT ở `pool_cap ?? items_shown`, rồi mới xáo.
 * 19/27 band để trống `pool_cap`, nên ở các band đó tập được xáo đúng bằng số ô —
 * tin ngoài top N không “chờ tới lượt”, nó không nằm trong tập được bốc. Màn hình
 * gộp chúng vào “đang chờ” theo yêu cầu của PO; requirement giữ nguyên lời giải
 * thích đầy đủ để Dev không mất dữ kiện này khi đặt pool cap.
 */
export const POOL_CAVEAT =
  'svn-be cắt ở pool_cap ?? items_shown theo refreshed_at desc rồi mới xáo. 19/27 band đang để trống pool_cap, nên ở các band đó “đang chờ” nghĩa là chỉ lên được khi tin leo lên top theo refreshed_at.'

/** Trang jobseeker có band TIER. */
export type PlPage = 'home' | 'korea' | 'global' | 'joblist'

export const PL_PAGES: { id: PlPage; label: string; note?: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'korea', label: 'Korea' },
  { id: 'global', label: 'Global' },
  { id: 'joblist', label: 'Jobs (mega menu)', note: 'Mở từ menu Jobs — by location / job role / industry. Cùng một bộ band cho cả ba tab.' },
]

export type PlacementLoad = {
  /** `placement.id` — path param của feed công khai */
  id: string
  /** `slot_key` — thứ operator đọc */
  key: string
  /** tên hiển thị, rút gọn phần tên trang ở đầu */
  name: string
  page: PlPage
  /** số ô hiển thị cùng lúc = số slot vẽ trên lưới */
  itemsShown: number
  /** số cột trên trang thật — đo trên stg-saramin 10/11/2026 */
  cols: number
  /** true = một thẻ lớn chiếm 2 dòng trong lưới Super hot (thẻ ghim) */
  big?: boolean
  /** true = dải cuộn ngang một dòng, không phải lưới */
  carousel?: boolean
  /** số tin đang giữ một sản phẩm feed vào band này */
  eligible: number
  /** các sản phẩm feed vào band (`product_placement_slot`) */
  products: string[]
}

/* ── Home ────────────────────────────────────────────────────────────────────
   Thứ tự đúng thứ tự render trên trang: Super hot (4 band chung một lưới 4 cột,
   thẻ ghim chiếm ô lớn) → Premium jobs (dải cuộn) → Highlight → Latest → Diverse. */
const HOME: PlacementLoad[] = [
  { id: 'placement_home_super_hot_large', key: 'HOME_SUPER_HOT_LARGE', name: 'Super hot - Pinned', page: 'home', itemsShown: 1, cols: 1, big: true, eligible: 33, products: ['JOB-SUPERHOT-PLUS'] },
  { id: 'placement_home_super_hot_image', key: 'HOME_SUPER_HOT_IMAGE', name: 'Super hot - Image', page: 'home', itemsShown: 30, cols: 4, eligible: 17, products: ['JOB-SUPERHOT', 'JOB - SUPER HOT JOB BY THU', 'JOB - TIN TOP JOB 2026'] },
  { id: 'placement_home_top_job', key: 'HOME_TOP_JOB', name: 'Super hot - Blue highlight', page: 'home', itemsShown: 16, cols: 4, eligible: 26, products: ['JOB-TOPJOB'] },
  { id: 'placement_home_distinction', key: 'HOME_DISTINCTION', name: 'Super hot - Plain', page: 'home', itemsShown: 24, cols: 4, eligible: 22, products: ['JOB-DISTINCTION', 'JOB - TIN DISTINCTION 2026'] },
  { id: 'placement_home_recommended', key: 'HOME_RECOMMENDED', name: 'Premium jobs', page: 'home', itemsShown: 10, cols: 10, carousel: true, eligible: 50, products: ['JOB-HERO', 'JOB - TIN TOP JOB 2026', 'JOB - TIN DISTINCTION 2026'] },
  { id: 'placement_home_job_card_basic_plus', key: 'HOME_JOB_CARD_BASIC_PLUS', name: 'Highlight jobs', page: 'home', itemsShown: 24, cols: 4, eligible: 26, products: ['JOB-BASICPLUS', 'JOB - TIN BASIC PLUS 2026'] },
  { id: 'placement_home_job_card_basic', key: 'HOME_JOB_CARD_BASIC', name: 'Latest jobs', page: 'home', itemsShown: 30, cols: 5, eligible: 23, products: ['JOB-BASIC', 'JOB - TIN BASIC 2026'] },
  { id: 'placement_home_job_card_free', key: 'HOME_JOB_CARD_FREE', name: 'Diverse opportunities', page: 'home', itemsShown: 36, cols: 6, eligible: 719, products: ['JOB-TRIAL', 'JOB - BASIC - FREE', 'JOB - TIN FREE - 14 NGAY 2026'] },
]

/* Korea và Global dựng đúng tám band như Home, cùng số ô và cùng lưới — khác nhau
   duy nhất ở lượng tin đủ điều kiện, và đó chính là thứ màn hình này cho thấy. */
const mirror = (page: PlPage, prefix: string, eligibles: number[]): PlacementLoad[] =>
  HOME.map((h, i) => ({
    ...h,
    page,
    id: h.id.replace('placement_home_', `placement_${page}_`),
    key: h.key.replace('HOME_', `${prefix}_`),
    eligible: eligibles[i],
  }))

export const PLACEMENT_LOADS: PlacementLoad[] = [
  ...HOME,
  ...mirror('korea', 'KOREA', [18, 3, 3, 16, 7, 3, 4, 6]),
  ...mirror('global', 'GLOBAL', [15, 8, 22, 8, 43, 23, 19, 713]),
  { id: 'placement_mega_menu_page_job_list_trending', key: 'MEGA_MENU_PAGE_JOB_LIST_TRENDING', name: "Don't miss these annoucements", page: 'joblist', itemsShown: 40, cols: 3, eligible: 1345, products: ['JOB - TIN DISTINCTION 2026', 'JOB - TIN TOP JOB 2026', 'JOB - TIN TOP JOB UNLIMITED - MB BANK 2026'] },
  { id: 'placement_mega_menu_page_job_list_announcement', key: 'MEGA_MENU_PAGE_JOB_LIST_ANNOUNCEMENT', name: 'Trending jobs', page: 'joblist', itemsShown: 30, cols: 3, eligible: 765, products: ['JOB - TIN BASIC 2026', 'JOB - TIN BASIC PLUS 2026', 'JOB - TIN FREE - 14 NGAY 2026', 'JOB - TIN UNLIMITED BASIC PLUS 2026'] },
]

export type PlComputed = {
  /** số tin thực sự lấp slot */
  showing: number
  /** tin đủ điều kiện nhưng không còn slot */
  waiting: number
  /** slot không có tin để lấp */
  empty: number
  /** số dòng lưới vẽ ra */
  rows: number
}

export function computeLoad(p: PlacementLoad): PlComputed {
  const showing = Math.min(p.itemsShown, p.eligible)
  return {
    showing,
    waiting: Math.max(0, p.eligible - p.itemsShown),
    empty: Math.max(0, p.itemsShown - p.eligible),
    rows: Math.ceil(p.itemsShown / p.cols),
  }
}

export const byId = (id: string) => PLACEMENT_LOADS.find((p) => p.id === id)!
