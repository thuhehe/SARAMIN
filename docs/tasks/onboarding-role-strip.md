# [Feature][FE][Jobseeker] Onboarding — dải "Việc làm cho {vị trí}" ở màn kết quả

**Requirement (nguồn sự thật):**
https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic — mục 12a

**Ticket:** SRM-1596 · **Parent:** SRM-1330 [JS] Matching logic · **Tách ra từ** SRM-1338 T5

> **Vì sao tách ticket riêng (chốt 17/11):** khối này **không dùng bộ máy chấm điểm**. Nó là một lượt **tìm kiếm thuần** trên `/jobs/search` — không CV, không hồ sơ, không trọng số, không xáo trộn, không ghi impression. Nằm chung với SRM-1338 thì luật của nó bị đọc nhầm thành luật của Recommended jobs, và đó chính là lỗi đang thấy trên production.

**Màn hình:** `/chao-mung` (`/welcome`) — màn kết quả sau khi xong wizard, khối **thứ hai**, dưới lưới "những việc phù hợp nhất".

---

## Bối cảnh

Màn kết quả có **hai khối, hai nguồn khác nhau**:

| Khối | Nguồn | Ticket |
|---|---|---|
| **1 · Những việc phù hợp nhất** — 6 thẻ/trang, tối đa 5 trang | Bộ máy **A** Recommended jobs (có chấm điểm) | SRM-1338 |
| **2 · "Việc làm cho {vị trí}"** — một hàng 3 thẻ | **Search thuần**, không chấm điểm | **ticket này** |

**Ảnh production 17/11 — hai lỗi trong một khung hình.** Tiêu đề in *"Việc làm cho Hành chính marketing"*, bên dưới đúng **một** thẻ, và thẻ đó là *"Platform Operations Specialist — ANTSOMI"*: không phải Hành chính marketing. Một lưới 3 cột với một thẻ trông như trang lỗi, còn thẻ đó thì mâu thuẫn với chính dòng tiêu đề ngay trên nó.

Hai luật dưới đây sửa đúng hai lỗi đó.

---

## T1 · Chỉ lấy tin **đúng vị trí** (level 2) — không bao giờ nới lên ngành nghề

> Requirement: [mục 12a](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#12a-onboarding-results-two-sections-two-sources)

> **Danh sách chỉ chứa tin có `job_role` = đúng vị trí in trên tiêu đề. Hết. Không có nhánh "phần còn lại của ngành nghề".**

Build hiện tại gọi **hai** lượt đọc rồi ghép: tin của role, xong tới tin của các role **anh em cùng category**. Bỏ lượt thứ hai.

**Vì sao không nới lên level 1:**

- **Tiêu đề in tên vị trí**, nên mọi thẻ dưới nó phải là vị trí đó. Nới = tự mâu thuẫn, như ảnh production.
- **Taxonomy chỉ có 2 tầng:** `job_category` (level 1) → `job_role` (level 2). Một category chứa **~50 vị trí** (*Kinh doanh & Thương mại* 52, *Tài chính & Bảo hiểm* 58). "Phần còn lại của category" cạnh *Bán dịch vụ tài chính* là *Bán bất động sản*, *Vận hành Livestream*… — không phải một bước nới nhẹ, mà là cả một ngành.
- **Nấc giữa (nhóm vị trí)** đáng ra làm việc nới nhẹ này, nhưng **chưa có dữ liệu** — SRM-1315. Khi nào có mới bàn lại.
- Ứng viên không mất gì: khối 1 ngay phía trên đã là danh sách rộng, có chấm điểm, có nới.

**Checklist**
- [ ] `getRoleJobsAction` chỉ còn **một** lượt `fetchJobSearch({ roleCodes: [role.id], sort: "posted" })`
- [ ] Bỏ lượt đọc `rest` (các role anh em) và hàm ghép `mergeRoleThenCategory` → chỉ còn lọc `excludeIds`
- [ ] `categoryRoleIds` không còn ai gọi ở luồng này → gỡ cùng test của nó
- [ ] Thứ tự: **mới nhất trước** (`sort=posted`). Không điểm, không xáo trộn, không ưu tiên gói tin
- [ ] Bỏ mọi id khối 1 đang hiện (tất cả ≤30 tin, không chỉ trang đang xem) **trước khi** chia trang

---

## T2 · Dưới 3 tin thì **ẩn cả khối**

> **Đếm sau khi đã trừ id của khối 1. Còn 0, 1 hoặc 2 tin → không vẽ gì cả: không tiêu đề, không đường kẻ, không lưới, không nút chuyển trang.**

Build hiện tại vẽ khối ngay khi còn **≥1** tin (`stripCards.length > 0`). Đổi ngưỡng thành **≥3**.

- Lưới 3 cột với 1 thẻ trông như trang lỗi — đúng cái đang thấy trên production.
- Đây **không phải luật mới**: Blue zone đã xử lý cùng vấn đề theo cùng cách (dưới số tối thiểu thì ẩn khối, không hiện khối lèo tèo).
- Ẩn khối 2 **không** ảnh hưởng khối 1 và không ảnh hưởng nút "Hoàn tất CV và ứng tuyển".

**Checklist**
- [ ] Điều kiện render đổi `stripCards.length > 0` → `stripCards.length >= 3`
- [ ] Ẩn thì ẩn cả `<hr>`/khoảng trắng phía trên, không để lại lỗ hổng giữa khối 1 và nút CTA
- [ ] 3 ≤ n ≤ 5 vẫn hiện bình thường, phân trang 3 thẻ/trang

---

## T3 · Chọn vị trí nào để in lên tiêu đề

Không đổi cách chọn, **chỉ đổi cái đem ra đếm**:

| | Trước | Sau |
|---|---|---|
| Trong ≤3 vị trí chọn ở bước 1, lấy vị trí có nhiều tin đang mở nhất | đếm theo **cả category** | đếm theo **chính vị trí đó** |

- Hoà → lấy vị trí ứng viên chọn trước.
- Bước 1 không chọn vị trí nào → **không có khối 2**; khối 1 vẫn render.
- **Không chọn lại sang vị trí khác** khi vị trí đã chọn rơi xuống dưới 3 sau khi trừ id khối 1. Tiêu đề chỉ in được một tên, và những tin đó ứng viên vẫn đang nhìn thấy ngay phía trên ở khối 1 — ẩn khối 2 lúc đó là đúng, không phải thiếu sót.

**Checklist**
- [ ] `pickStripRoleAction` đếm `roleCodes: [role.id]`, không phải `role.categoryRoleIds`

---

## T4 · Những thứ **không** đụng tới

- **Con số ở bước 3 / bước 4 của wizard** (SRM-1347) vẫn đếm ở **mức category** — cố ý. Hai câu hỏi khác nhau: con số trả lời *"có bao nhiêu việc cho hướng đi này"*, dải này trả lời *"mở xem vài tin đúng vị trí này"*. Đừng "sửa cho khớp".
- **Khối 1** (SRM-1338) — không đổi gì.
- Khối 2 **không ghi impression log**, không gọi feed gợi ý.
- API BE không đổi: `/jobs/search` đã nhận `roleCodes` + `sort=posted`.

---

## Test

| # | Tình huống | Kết quả đúng |
|---|---|---|
| 1 | Vị trí chọn có 12 tin mở, khối 1 không trùng tin nào | Khối 2 hiện 12 tin, 4 trang × 3 thẻ, **tất cả đều đúng vị trí đó** |
| 2 | Vị trí chọn có 8 tin, khối 1 đang hiện 6 trong số đó | Còn 2 → **ẩn cả khối 2** |
| 3 | Vị trí chọn có 3 tin, khối 1 không trùng | Hiện đúng 3 thẻ, không có nút chuyển trang |
| 4 | Vị trí chọn có 2 tin | **Ẩn cả khối**, không để lại tiêu đề hay đường kẻ |
| 5 | Vị trí chọn có 0 tin | Ẩn cả khối |
| 6 | Vị trí *Hành chính marketing*, trong category có hàng trăm tin của vị trí khác | Chỉ tin *Hành chính marketing* được tính; không có tin nào khác lọt vào (ca production 17/11) |
| 7 | Bước 1 chọn 3 vị trí | Tiêu đề in vị trí có **nhiều tin của chính nó** nhất; hoà → vị trí chọn trước |
| 8 | Bước 1 không chọn vị trí nào | Không có khối 2; khối 1 vẫn render bình thường |
| 9 | `/jobs/search` lỗi | Ẩn khối 2, màn kết quả vẫn lên bình thường |
| 10 | Con số ở bước 3 / 4 của wizard | **Không đổi** — vẫn đếm theo category (SRM-1347) |

---

## Phạm vi

**FE (`svn-web`) — BE không đổi.**

| File | Việc |
|---|---|
| `features/onboarding/api/role-jobs.api.ts` | `pickStripRoleAction` đếm theo role; `getRoleJobsAction` bỏ lượt đọc category |
| `features/onboarding/lib/role-jobs-pool.ts` | Gỡ `categoryRoleIds` + `mergeRoleThenCategory` khỏi luồng (còn lại: lọc `excludeIds`) |
| `features/onboarding/components/results-view.tsx` | Ngưỡng render `>= 3` |
| `features/onboarding/lib/role-jobs-pool.test.mjs` | Cập nhật theo luật mới |
