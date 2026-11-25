# [Feature][FE][Jobseeker] Onboarding — dải "Việc làm cho {các vị trí}" ở màn kết quả

**Requirement (nguồn sự thật):**
https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic — mục 12a

**Ticket:** SRM-1596 · **Parent:** SRM-1330 [JS] Matching logic · **Tách ra từ** SRM-1338 T5

**Màn hình:** `/chao-mung` (`/welcome`) — màn kết quả sau khi xong wizard, khối **thứ hai**, dưới lưới "những việc phù hợp nhất".

---

## Cập nhật 25/11 — hai thay đổi, trên nền bản đã làm xong ngày 17/11

Bản 17/11 đã lên `dev`: dải chỉ lấy job **đúng vị trí** (bỏ nhánh "phần còn lại của ngành nghề"), và **dưới 3 job thì ẩn cả khối**. Hai điều đó **giữ nguyên**.

| | Hôm nay trên `dev` | Chốt 25/11 |
|---|---|---|
| Lấy job theo | **một** vị trí — vị trí có nhiều job đang mở nhất trong ≤3 vị trí đã chọn | **tất cả** vị trí đã chọn ở bước 1 (≤3) |
| Nơi làm việc | **không lọc** | **lọc** theo các tỉnh/thành đã chọn ở bước 2 |
| Tiêu đề | tên **một** vị trí | tên **tất cả** vị trí đã chọn — dấu phẩy ở giữa, **và** trước tên cuối |

**Vì sao lọc thêm nơi làm việc:** đúng vị trí mà sai tỉnh/thành thì ứng viên không ứng tuyển được — thẻ đó chiếm chỗ mà không dùng được. Ứng viên vừa khai nơi muốn làm ở ngay bước trước đó; không dùng câu trả lời ấy thì hỏi làm gì.

**Vì sao bỏ luật "chọn vị trí nhiều job nhất":** ứng viên chọn 3 vị trí, hệ thống giữ 1 và vứt 2. Hai vị trí bị vứt thường chính là chỗ có tin mới. Gộp cả ba vừa đúng ý ứng viên vừa bỏ luôn một lượt đếm.

---

## Bối cảnh — màn kết quả có hai khối, hai nguồn khác nhau

| Khối | Nguồn | Ticket |
|---|---|---|
| **1 · Những việc phù hợp nhất** — 6 thẻ/trang, tối đa 5 trang | Bộ máy **Recommended jobs** (có chấm điểm) | SRM-1338 |
| **2 · "Việc làm cho {các vị trí}"** — một hàng 3 thẻ | **Search thuần** trên `/jobs/search`, không chấm điểm | **ticket này** |

Khối 2 không đọc CV, không đọc hồ sơ, không trọng số, không xáo trộn, không ghi impression. Nó chỉ là một lượt tìm kiếm với đúng hai bộ lọc: **vị trí** và **nơi làm việc**.

---

## T1 · Lấy job của **tất cả** vị trí đã chọn

> **Một lượt `/jobs/search` với `role` = tất cả vị trí ứng viên chọn ở bước 1 (≤3), `sort=posted`. Không còn ai "chọn vị trí" nữa.**

Hôm nay `pickStripRoleAction` đếm job của từng vị trí rồi lấy vị trí nhiều nhất; bỏ hẳn lượt đếm đó.

**Checklist**
- [ ] `getRoleJobsAction` nhận `roleIds: string[]` thay cho `roleId?: string`, lọc qua `resolveRoles` như cũ (giữ nguyên trần `MAX_PICKED_ROLES = 3`)
- [ ] Một lượt `fetchJobSearch({ roleCodes: picked, sort: "posted", pageSize: POOL_SIZE })` — query `role` nhận danh sách cách nhau bằng dấu phẩy
- [ ] Gỡ `pickStripRoleAction` và `busiestIndex` (cùng test của nó trong `role-jobs-pool.test.mjs`)
- [ ] `onboarding-page.tsx`: bỏ `pickStripRoleAction` khỏi `Promise.all`, truyền thẳng mảng `roles`
- [ ] Một job khớp hai vị trí chỉ ra **một thẻ** — kiểm lại khi truyền nhiều `role` cùng lúc
- [ ] Bước 1 không chọn vị trí nào → **không có khối 2**; khối 1 vẫn render

---

## T2 · Lọc thêm theo **nơi làm việc**

> **Job phải có nơi làm việc nằm trong các tỉnh/thành ứng viên chọn ở bước 2. Đúng vị trí nhưng sai tỉnh thì không vào dải.**

`onboarding-page.tsx` đã giữ sẵn mảng `provinces` (state của `RegionDrillPicker`) — chính mảng đang truyền làm `regionIds` cho câu dẫn ở bước 3/4 và `locationIds` lúc submit. Truyền tiếp mảng đó xuống dải.

**Checklist**
- [ ] `getRoleJobsAction` nhận thêm `provinceCodes: string[]`, truyền xuống `fetchJobSearch({ provinceCodes })` → query `provinceCode=a,b`
- [ ] **Không chọn tỉnh nào** → không truyền tham số (lọc theo vị trí thôi), không truyền mảng rỗng
- [ ] Giữ nguyên thứ tự **mới nhất trước**; lọc nơi làm việc không được đổi thứ tự

**Một điểm phải nói rõ với QA:** `/jobs/search` khớp tỉnh theo `province_code` của tin **hoặc** theo chi nhánh làm việc của tin (ruling §6 của svn-be). Tin **không ghi tỉnh nào** vì thế **không** vào dải. Chỗ này **khác có chủ đích** với câu dẫn ở bước 3/4, nơi tin bỏ trống một trường thì không bị loại vì trường đó: câu dẫn là lời động viên trước khi ứng viên thấy tin nào, còn dải này là lời hứa có tiêu đề đi kèm.

---

## T3 · Tiêu đề in **tất cả** vị trí đã chọn

> **"Việc làm cho Hành chính marketing, Nhân viên kinh doanh và Content marketing"** — đúng thứ tự ứng viên chọn, dấu phẩy ở giữa, **và** trước tên cuối.

**Checklist**
- [ ] `roleLabel` đổi từ tên một vị trí thành danh sách tên theo đúng thứ tự đã chọn, nối bằng `", "` và **từ nối trước tên cuối**: 3 vị trí → `A, B và C`; 2 vị trí → `A và B` (không có dấu phẩy); 1 vị trí → `A`
- [ ] Từ nối lấy theo ngôn ngữ của trang: tiếng Việt **và**, tiếng Anh **and** — nằm trong file copy, không hard-code
- [ ] `copy.roleSectionTitle` (`{role}`) nhận chuỗi dài hơn trước — kiểm tiêu đề **xuống dòng** gọn gàng ở mobile, không cắt chữ, không tràn
- [ ] Không chọn lại, không rút gọn danh sách: chọn 3 vị trí thì in đủ 3 tên, kể cả khi một vị trí không có job nào lọt vào dải

---

## T4 · Giữ nguyên, **không** đụng tới

- **Dưới 3 job thì ẩn cả khối** (bản 17/11, đã có trong code qua `showsStrip`). Đếm **sau khi** đã lọc vị trí, lọc nơi làm việc và bỏ id khối 1.
- **Không bao giờ nới lên ngành nghề.** Taxonomy chỉ có 2 tầng (`job_category` → `job_role`), một ngành chứa ~50 vị trí; nấc giữa chưa có dữ liệu (SRM-1315).
- **Bỏ mọi id khối 1 đang hiện** (tất cả ≤30 job, không chỉ trang đang xem) trước khi đếm và chia trang.
- **Con số ở bước 3 / bước 4 của wizard** (SRM-1347) vẫn đếm ở **mức ngành nghề** — cố ý, đừng "sửa cho khớp".
- Khối 2 **không ghi impression log**, không gọi feed gợi ý. `/jobs/search` lỗi → ẩn khối, màn kết quả vẫn lên bình thường.
- **BE không đổi.** `/jobs/search` đã nhận `role` và `provinceCode` dạng danh sách.

---

## Test

| # | Tình huống | Kết quả đúng |
|---|---|---|
| 1 | Chọn 3 vị trí, 2 tỉnh; mỗi vị trí đều có job trong 2 tỉnh đó | Dải gộp job của **cả 3** vị trí, mới nhất trước; tiêu đề in đủ 3 tên |
| 2 | Job đúng vị trí nhưng ở tỉnh **không** chọn | **Không** xuất hiện trong dải |
| 3 | Job khớp **hai** vị trí đã chọn | Chỉ một thẻ, không nhân đôi |
| 4 | Sau khi lọc còn 2 job | **Ẩn cả khối** — không tiêu đề, không lưới, không đường kẻ |
| 5 | Sau khi lọc còn đúng 3 job | Hiện 3 thẻ, không có nút chuyển trang |
| 6 | Còn 12 job sau khi lọc | 4 trang × 3 thẻ |
| 7 | Khối 1 đang hiện 6 trong số các job khớp | 6 job đó bị bỏ **trước khi** đếm ngưỡng 3 |
| 8 | Bước 2 không chọn tỉnh nào | Lọc theo vị trí thôi, dải vẫn hiện bình thường |
| 9 | Bước 1 không chọn vị trí nào | Không có khối 2; khối 1 vẫn render |
| 10 | Tin không ghi tỉnh nào | Không vào dải (xem ghi chú ở T2) |
| 11 | Tiêu đề 3 vị trí tên dài, màn mobile | Xuống dòng gọn, không cắt chữ, không tràn ngang |
| 11b | Chọn 2 vị trí · chọn 1 vị trí | `A và B` (không dấu phẩy) · `A`. Bản tiếng Anh dùng **and** |
| 12 | `/jobs/search` lỗi | Ẩn khối 2, màn kết quả vẫn lên bình thường |
| 13 | Con số ở bước 3 / 4 của wizard | **Không đổi** — vẫn đếm theo ngành nghề (SRM-1347) |

---

## Phạm vi

**FE (`svn-web`) — BE không đổi.**

| File | Việc |
|---|---|
| `features/onboarding/api/role-jobs.api.ts` | `getRoleJobsAction` nhận `roleIds[]` + `provinceCodes[]`; gỡ `pickStripRoleAction` |
| `features/onboarding/lib/role-jobs-pool.ts` | Gỡ `busiestIndex` (còn lại `withoutShown`) |
| `features/onboarding/ui/onboarding-page.tsx` | Truyền `roles` và `provinces` xuống dải; `roleLabel` nối tên nhiều vị trí |
| `features/onboarding/components/results-view.tsx` | Tiêu đề nhiều tên — kiểm xuống dòng ở mobile; ngưỡng `showsStrip` giữ nguyên |
| `features/onboarding/lib/role-jobs-pool.test.mjs` | Cập nhật theo luật mới |
