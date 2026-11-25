# [Feature][FE][Jobseeker] Onboarding — dải "Việc làm cho {vị trí}" ở màn kết quả

**Requirement (nguồn sự thật):**
https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic — mục 12a

**Ticket:** SRM-1596 · **Parent:** SRM-1330 [JS] Matching logic · **Tách ra từ** SRM-1338 T5

**Màn hình:** `/chao-mung` (`/welcome`) — màn kết quả sau khi xong wizard, khối **thứ hai**, dưới lưới "những việc phù hợp nhất".

---

## Cập nhật 25/11 — ba thay đổi, trên nền bản đã làm xong ngày 17/11

Bản 17/11 đã lên `dev`: dải chỉ lấy job **đúng vị trí** (bỏ nhánh "phần còn lại của ngành nghề"), và **dưới 3 job thì ẩn cả khối**. Hai điều đó **giữ nguyên**.

| | Hôm nay trên `dev` | Chốt 25/11 |
|---|---|---|
| Nơi làm việc | **không lọc** | **lọc** theo các tỉnh/thành đã chọn ở bước 2 |
| Chọn vị trí | lấy **một** vị trí — vị trí có **tổng số tin** nhiều nhất | **mở dần**: vị trí còn nhiều job nhất đi trước, không đủ 9 mới thêm vị trí thứ hai, rồi thứ ba |
| Tiêu đề | tên một vị trí | tên **đúng những vị trí được lấy** — dấu phẩy ở giữa, **và** trước tên cuối |
| Số job hiển thị | **không có trần** — đọc 100 tin, chia 3 thẻ/trang (có thể ra 30 trang) | **tối đa 9 job** — 3 thẻ × 3 trang |

**Vì sao lọc thêm nơi làm việc:** đúng vị trí mà sai tỉnh/thành thì ứng viên không ứng tuyển được — thẻ đó chiếm chỗ mà không dùng được. Ứng viên vừa khai nơi muốn làm ở ngay bước trước đó.

**Vì sao mở dần thay vì in cả 3 vị trí:** 3 tên vị trí trên một dòng tiêu đề là 77–120 ký tự. Mở dần thì phần lớn trường hợp tiêu đề chỉ một tên, và chỉ dài ra đúng lúc nó cần dài — lúc một vị trí không đủ job.

**Vì sao có trần 9:** màn này ứng viên chỉ thấy **một lần** (reload là bị đẩy về trang chủ), lại nằm dưới nút *Hoàn tất CV và ứng tuyển*. Một thanh phân trang 30 trang ở đó là vô nghĩa.

---

## Bối cảnh — màn kết quả có hai khối, hai nguồn khác nhau

| Khối | Nguồn | Ticket |
|---|---|---|
| **1 · Những việc phù hợp nhất** — 6 thẻ/trang, tối đa 5 trang | Bộ máy **Recommended jobs** (có chấm điểm) | SRM-1338 |
| **2 · "Việc làm cho {vị trí}"** — 3 thẻ/trang, tối đa 3 trang | **Search thuần** trên `/jobs/search`, không chấm điểm | **ticket này** |

Khối 2 không đọc CV, không đọc hồ sơ, không trọng số, không xáo trộn, không ghi impression. Nó chỉ là một lượt tìm kiếm với đúng hai bộ lọc: **vị trí** và **nơi làm việc**.

---

## T1 · Một lượt đọc, lọc theo vị trí **và** nơi làm việc

> **Một lượt `/jobs/search` với `role` = tất cả vị trí ứng viên chọn ở bước 1 (≤3), `provinceCode` = các tỉnh chọn ở bước 2, `sort=posted`. Rồi bỏ mọi id khối 1 đang hiện.**

`onboarding-page.tsx` đã giữ sẵn mảng `provinces` (state của `RegionDrillPicker`) — chính mảng đang truyền làm `regionIds` cho câu dẫn ở bước 3/4 và `locationIds` lúc submit. Truyền tiếp mảng đó xuống dải.

**Checklist**
- [ ] `getRoleJobsAction` nhận `roleIds: string[]` + `provinceCodes: string[]` (thay cho `roleId?: string`), lọc qua `resolveRoles` như cũ
- [ ] Một lượt `fetchJobSearch({ roleCodes: picked, provinceCodes, sort: "posted", pageSize: POOL_SIZE })` — `role` và `provinceCode` đều nhận danh sách cách nhau bằng dấu phẩy
- [ ] **Không chọn tỉnh nào** → không truyền `provinceCodes` (lọc theo vị trí thôi), không truyền mảng rỗng
- [ ] Bỏ mọi id khối 1 đang hiện — **tất cả ≤30 job**, không chỉ trang đang xem — **trước** mọi bước đếm
- [ ] Một job khớp hai vị trí chỉ ra **một thẻ**
- [ ] Bước 1 không chọn vị trí nào → **không có khối 2**; khối 1 vẫn render

**Một điểm phải nói rõ với QA:** `/jobs/search` khớp tỉnh theo `province_code` của tin **hoặc** theo chi nhánh làm việc của tin (ruling §6 của svn-be). Tin **không ghi tỉnh nào** vì thế **không** vào dải. Chỗ này **khác có chủ đích** với câu dẫn ở bước 3/4, nơi tin bỏ trống một trường thì không bị loại vì trường đó.

---

## T2 · Mở dần từng vị trí, trần **9 job**

> **Nhóm phần còn lại theo vị trí. Lấy vị trí còn nhiều job nhất. Chưa đủ 9 thì thêm vị trí nhiều thứ hai, vẫn chưa đủ thì thêm vị trí thứ ba. Đủ 9 là dừng.**

Đếm trên **phần còn lại sau khi đã lọc tỉnh và đã bỏ id khối 1**, không phải tổng số tin của vị trí đó — cái cần biết là vị trí này lấp được bao nhiêu chỗ của dải, không phải nó có bao nhiêu tin trên toàn site.

- Hoà nhau → lấy vị trí ứng viên chọn trước.
- **Ngưỡng mở rộng = trần hiển thị = 9.** Hai con số này phải bằng nhau: vị trí thứ hai chỉ được thêm vào khi vị trí thứ nhất **không lấp nổi 9**, nên phần thiếu chắc chắn do vị trí thứ hai lấp → mọi vị trí có tên trên tiêu đề đều có ít nhất một thẻ bên dưới. Đặt hai số khác nhau (ví dụ mở rộng khi <5 nhưng hiển thị 15) là tiêu đề lại hứa suông.
- Gộp xong vẫn **mới nhất trước** trên toàn bộ danh sách, không xếp theo vị trí.
- Tổng còn **dưới 3 job** → **ẩn cả khối** (giữ nguyên luật 17/11): không tiêu đề, không đường kẻ, không lưới, không nút chuyển trang.

**Checklist**
- [ ] Nhóm theo vị trí **sau** khi lọc tỉnh + bỏ id khối 1; xếp vị trí theo số job còn lại giảm dần, hoà → thứ tự ứng viên chọn
- [ ] Thêm vị trí cho tới khi đủ **9** job hoặc hết vị trí
- [ ] Cắt danh sách cuối cùng còn **9 job**, chia **3 thẻ/trang → tối đa 3 trang**
- [ ] Ngưỡng ẩn khối vẫn là **< 3** (`showsStrip`), đếm trên danh sách cuối cùng
- [ ] `POOL_SIZE` đọc về vẫn 100 để đếm cho đủ, nhưng **không bao giờ render quá 9**

---

## T3 · Tiêu đề in **đúng những vị trí được lấy**

> **Chỉ in tên những vị trí thực sự có job trong dải — 1, 2 hay 3 tên. Dấu phẩy ở giữa, `và` trước tên cuối.**

- 3 vị trí → `Việc làm cho A, B và C` · 2 vị trí → `Việc làm cho A và B` (không dấu phẩy) · 1 vị trí → `Việc làm cho A`
- Vị trí ứng viên có chọn nhưng **không được lấy vào** thì **không** lên tiêu đề.
- Từ nối lấy theo ngôn ngữ của trang: tiếng Việt **và**, tiếng Anh **and** — nằm trong file copy, không hard-code.

**Checklist**
- [ ] `roleLabel` dựng từ danh sách vị trí **đã được lấy**, đúng thứ tự lấy
- [ ] `copy.roleSectionTitle` (`{role}`) nhận chuỗi dài hơn trước — tiêu đề 3 tên phải **xuống dòng** gọn ở mobile, không cắt chữ, không dấu `…`
- [ ] Gỡ `pickStripRoleAction` và `busiestIndex` — việc chọn vị trí giờ nằm trong bước nhóm ở T2, không cần lượt đếm riêng

---

## T4 · Giữ nguyên, **không** đụng tới

- **Không bao giờ nới lên ngành nghề.** Taxonomy chỉ có 2 tầng (`job_category` → `job_role`), một ngành chứa ~50 vị trí; nấc giữa chưa có dữ liệu (SRM-1315).
- **Con số ở bước 3 / bước 4 của wizard** (SRM-1347) vẫn đếm ở **mức ngành nghề** — cố ý, đừng "sửa cho khớp".
- Khối 2 **không ghi impression log**, không gọi feed gợi ý, không chấm điểm, không xáo trộn, không ưu tiên gói tin.
- `/jobs/search` lỗi → ẩn khối, màn kết quả vẫn lên bình thường.
- **BE không đổi.** `/jobs/search` đã nhận `role` và `provinceCode` dạng danh sách.

---

## Test

| # | Tình huống | Kết quả đúng |
|---|---|---|
| 1 | Vị trí A còn 14 job sau khi lọc | Chỉ lấy A; tiêu đề **một tên**; hiện 9 job, 3 trang |
| 2 | A còn 5, B còn 7, C còn 2 | Xếp B (7) trước → B chưa đủ 9 → thêm A → 12 job, cắt còn **9**; tiêu đề `B và A` |
| 3 | A còn 5, B còn 2, C còn 1 | Lấy cả 3, tổng 8 job → hiện đủ 8, 3 trang; tiêu đề `A, B và C` |
| 4 | Tổng sau khi lọc còn 2 job | **Ẩn cả khối** — không tiêu đề, không lưới, không đường kẻ |
| 5 | Tổng còn đúng 3 job | Hiện 3 thẻ, **không** có nút chuyển trang |
| 6 | Vị trí được lấy nhưng tất cả job của nó rơi ngoài 9 thẻ | **Không được xảy ra** — ngưỡng mở rộng bằng trần nên mỗi vị trí trên tiêu đề luôn có ít nhất 1 thẻ |
| 7 | Job đúng vị trí nhưng ở tỉnh **không** chọn | **Không** xuất hiện trong dải |
| 8 | Khối 1 đang hiện 6 trong số các job khớp | 6 job đó bị bỏ **trước khi** nhóm, đếm và cắt |
| 9 | Job khớp **hai** vị trí đã chọn | Chỉ một thẻ, không nhân đôi; tính cho vị trí nào cũng được, miễn không đếm hai lần |
| 10 | Bước 2 không chọn tỉnh nào | Lọc theo vị trí thôi, dải vẫn hiện bình thường |
| 11 | Bước 1 không chọn vị trí nào | Không có khối 2; khối 1 vẫn render |
| 12 | Tin không ghi tỉnh nào | Không vào dải (xem ghi chú ở T1) |
| 13 | Tiêu đề 3 vị trí tên dài, màn mobile | Xuống dòng gọn, không cắt chữ, không tràn ngang |
| 14 | Bản tiếng Anh | Từ nối là **and**, không phải `và` |
| 15 | `/jobs/search` lỗi | Ẩn khối 2, màn kết quả vẫn lên bình thường |
| 16 | Con số ở bước 3 / 4 của wizard | **Không đổi** — vẫn đếm theo ngành nghề (SRM-1347) |

---

## Phạm vi

**FE (`svn-web`) — BE không đổi.**

| File | Việc |
|---|---|
| `features/onboarding/api/role-jobs.api.ts` | `getRoleJobsAction` nhận `roleIds[]` + `provinceCodes[]`, nhóm theo vị trí và mở dần tới 9; gỡ `pickStripRoleAction` |
| `features/onboarding/lib/role-jobs-pool.ts` | Gỡ `busiestIndex`; thêm hàm nhóm + mở dần (có test riêng) |
| `features/onboarding/ui/onboarding-page.tsx` | Truyền `roles` và `provinces` xuống dải; `roleLabel` nối tên các vị trí được lấy |
| `features/onboarding/components/results-view.tsx` | Trần 9 job / 3 trang; tiêu đề nhiều tên — kiểm xuống dòng ở mobile; ngưỡng `showsStrip` giữ nguyên |
| `features/onboarding/lib/role-jobs-pool.test.mjs` | Cập nhật theo luật mới |
