# [Feature][BE][FE][Jobseeker] Recommended jobs — một pool 80 tin, bốn vị trí hiển thị

**Requirement (nguồn sự thật):** https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic — build theo trang này. Trang "OLD logic" chỉ để tham khảo.

**Ticket:** SRM-1338 · **Parent:** SRM-1330 (đọc bảng đối chiếu ở parent trước)

**Màn hình ảnh hưởng:** Onboarding — màn kết quả · Job detail — section "Recommended jobs" · Popup sau khi nộp đơn (Batch apply) · My dashboard `/ho-so-ca-nhan` · Admin — General settings (bỏ tab).

---

## Bối cảnh

Build hiện tại (v3, `docs/architecture/job-recommendation-matching.md`): cổng lọc G1–G7 → `ApplicantMatch` 22/21/20/20/9/5/3 có renormalise → `JobFeed` (ngưỡng 50 để vào danh sách, 60 để in %, xoay trong dải 5 điểm, cap công ty, giáng hạng sau 3 lần hiện không click) → 4 cấp tiêu đề FOR_YOU / LIKE_YOUR_CV / MATCHING / FEATURED → trọng số chỉnh được ở admin.

Thay đổi, tóm tắt: **một pool 80 tin tốt nhất**, xáo trộn gieo theo ngày ở 3 vị trí, **Batch apply xếp đúng theo điểm**; **không ngưỡng, không in %, mỗi màn hình một tiêu đề cố định**; trọng số mới **42 / 20 / 14 / 12 / 5 / 4 / 3 nằm trong code**; **hành vi** (xem / lưu / ứng tuyển) mở rộng tập role / category / tỉnh trước khi chấm.

> **Remove** setting này, trọng số để trong code, không để admin set: https://stg-admin.saramin.vn/system/general-settings?tab=recommended-jobs — tỷ giá USD/VND trên trang đó **giữ**.

---

## T1 · Trọng số mới và cách chấm

> Requirement: [mục 7](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#7-how-the-score-is-calculated) · [mục 8](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#8-every-signal-where-it-comes-from-and-what-it-scores) · [mục 9](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#9-the-rules-behind-that-scoring-table) · [mục 15](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#15-a-signal-with-nothing-to-compare-scores-0-we-never-re-scale)

| Tín hiệu | Điểm | So gì |
|---|---|---|
| Vị trí & role | **42** | MỘT tín hiệu, thang Category › Group › Role: cùng role 42 · cùng group 30 · cùng category 17 · khác 0. Giá trị suy ra (hành vi / "if empty") ăn 80% → 34 / 24 / 14 |
| Địa điểm & hình thức | **20** | Đúng tỉnh + đúng hình thức 20 (suy ra 16) · tin remote 20 · đúng tỉnh khác hình thức 14 · tỉnh lân cận 10 · khác 0 |
| Kinh nghiệm | **14** | Trong dải 14 · tin "không yêu cầu" 14 · thừa ≤2 năm 10 · thiếu ≤1 năm 7 · thừa >2 năm 5 · thiếu >1 năm 0. **Tin không khai dải năm nhưng khai cấp bậc** → quy đổi năm → bậc theo bảng 18d: cùng bậc 14 · lệch 1 bậc 7 · còn lại 0 |
| Lương | **12** | Trong dải hoặc dải cao hơn mong muốn 12 · đòi hơn ≤10% 8 · 10–20% 4 · một bên "Thỏa thuận" 6 · >20% 0. Khác tiền tệ → quy đổi theo tỷ giá admin; **không có tỷ giá → 0** |
| Ngành | **5** | Trùng 5 (suy ra 4) · cùng cha 3 · khác 0 |
| Kỹ năng | **4** | 4 × (khớp ÷ yêu cầu); skill ESSENTIAL tính đôi hai vế |
| Học vấn | **3** | Đạt / tin không yêu cầu 3 · thấp 1 bậc 1 · còn lại 0 |

**Checklist**
- [ ] `matching_weight_version` thêm hàng v4 = 42/20/14/12/5/4/3, tổng 100. **Bỏ endpoint `GET/POST /api/admin/matching-settings` và tab admin** — trọng số là code có version, không phải setting
- [ ] **Bỏ renormalise.** Tín hiệu không so được = 0, tổng luôn trên 100 (mục 15). Sửa luôn javadoc "signal leaves the calculation"
- [ ] Role + category gộp thành MỘT tín hiệu 42 (bỏ cách "đúng role 20 / trúng category w/2" hiện tại). Thang 4 nấc viết sẵn; Group tính như Category cho tới SRM-1315
- [ ] Giá trị **suy ra** (từ hành vi — T2, hoặc dòng "if empty") ăn 80% điểm, làm tròn. Giá trị ứng viên **tự khai** ăn đủ
- [ ] Kinh nghiệm: giữ bậc thang cấp bậc của v3 nhưng theo bảng năm → bậc ở 18d (chung với SRM-1347), lệch 1 bậc = 7/14
- [ ] "Thỏa thuận" là câu trả lời, ăn 6; ô lương **trống** ăn 0
- [ ] Làm tròn **một lần** ở tổng
- [ ] Nhiều CV: chấm từng CV, mỗi tin giữ điểm cao nhất (mục 17). Không gộp CV
- [ ] Bảng tỉnh lân cận (~10 cặp) trong master data; chưa có thì nấc 10 điểm = 0

---

## T2 · Hành vi mở rộng tập so khớp — không cộng điểm

> Requirement: [mục 5](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#5-what-we-know-about-the-jobseeker-what-they-said-and-what-they-did)

| Hành vi | Đủ khi | Lấy gì |
|---|---|---|
| Ứng tuyển | 1 tin | role · category · tỉnh của tin |
| Lưu | 1 tin | như trên |
| Mở xem | **3 tin khác nhau** | như trên |

**Checklist**
- [ ] Đọc `job_application`, `scrap`, `job_view` trong **90 ngày**; giữ top 3 role / top 3 category / top 3 tỉnh theo tần suất
- [ ] Tập này **hợp** với tập tự khai rồi đưa vào cả cổng lọc (G4/G5) lẫn chấm điểm. Giá trị đến từ hành vi chấm là "suy ra" (80%)
- [ ] **Không** cộng điểm thưởng cho hành vi. Dùng thêm đúng một chỗ: hoà điểm → tin chưa xem lên trước
- [ ] `job_view` chỉ giữ 1 dòng / (ứng viên, tin) → đếm số tin khác nhau, không đếm số lần
- [ ] Dữ liệu cá nhân: không join vào bất kỳ API phía NTD, không dùng để giải thích thẻ

---

## T3 · Lọc, pool 80, xáo trộn

> Requirement: [mục 2](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#2-one-pool-of-80-shuffled-across-the-four-surfaces) · [mục 4](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#4-a-job-they-applied-to-never-comes-back) · [mục 6](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#6-which-jobs-get-scored-at-all-the-filter-then-the-500-limit)

**Checklist**
- [ ] Cổng lọc giữ như v3: G1 live · G2 exposure + công ty ACTIVE + MST · G3 loại trừ · G4 tỉnh (bỏ khi "sẵn sàng chuyển chỗ") · G5 category (= desired category ∪ category của desired role, trên `job_category_link`). **Dưới 6 tin** (chưa đủ một hàng) → nới theo 2 bước: bỏ G4 trước, vẫn dưới 6 thì bỏ cả G5; gắn cờ `relaxed` vào log — **không đổi tiêu đề** (xem T4). JOB_DETAIL không bao giờ nới (mục 6, quyết định 2026-11-04)
- [ ] **G6 (neo category tin đang xem) chỉ còn ở JOB_DETAIL.** Bỏ ở AFTER_APPLY — popup lấy pool thường
- [ ] Loại **tin đã có đơn — bất kỳ trạng thái** (một `NOT EXISTS job_application`, giữ như G3 hiện tại) và tin đã dismiss, **trước** khi cắt 80
- [ ] Khử trùng `company + title + province`, giữ tin mới nhất, **trước** khi cắt 80
- [ ] Cắt **top 80** theo điểm. **Không ngưỡng điểm.** Không cap công ty trong pool
- [ ] Bỏ của `JobFeed`: ngưỡng 50/60, xoay trong dải 5 điểm, giáng hạng sau 3 lần hiện, cap `max(2, size/10)`
- [ ] **Xáo trộn gieo theo (jobseeker id + ngày)** cho ONBOARDING / HOMEPAGE / JOB_DETAIL. AFTER_APPLY giữ nguyên thứ tự điểm
- [ ] Khi render một hàng: **một công ty một hàng** — gặp công ty trùng thì bỏ qua lấy thẻ kế tiếp trong pool (FE hoặc BE đều được, nhưng một chỗ)
- [ ] **Cắt 500 trước khi chấm** theo thứ tự: tin có ≥1 role trong tập role của ứng viên (khai + hành vi) đứng trước → rồi `publish DESC`; LIMIT 500. Ứng viên không có role nào → chỉ theo `publish DESC` (mục 6, quyết định 2026-11-04)
- [ ] Log impression như cũ + **cột cờ "quá 500 tin qua bộ lọc"** (mục 6)
- [ ] 80 và 500 là hằng số có tên, một chỗ

---

## T4 · API và tiêu đề

> Requirement: [mục 16](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#16-if-the-jobseeker-has-not-filled-in-everything) · [mục 18](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18-where-recommended-jobs-appear)

**Checklist**
- [ ] `GET /me/job-recommendations?surface&size&jobId` giữ đường dẫn. `size` tối đa 80
- [ ] **Bỏ 4 cấp `heading` / `headingKey`** — FE in tiêu đề cố định của Figma cho từng màn hình. `relaxed` chỉ còn đi vào log
- [ ] **Không trả `matchPercent`** (hoặc luôn null) — không màn hình nào in %. `reasons` vẫn trả, chỉ Batch apply dùng (T7)
- [ ] `matchedResumeId` giữ nguyên, chưa in ra
- [ ] SEARCH strip và JOB_ALERT vẫn đọc feed này (pool 80, xáo trộn) — ngoài phạm vi ticket, chỉ không được vỡ

---

## T5 · Onboarding — màn kết quả có HAI section

> Requirement: [mục 18a](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18a-onboarding-results-two-sections-two-sources)

| Section | Nguồn | Luật |
|---|---|---|
| **1 · Best matches** — 6 thẻ/trang, 1/5 | Feed này, pool 80 xáo trộn | Đọc MỘT lần sau khi lưu câu trả lời (Server Action), phân trang ở client. Pool < 30 → ít trang hơn, không lấp |
| **2 · "Jobs for [Desired job role]"** — một hàng carousel | **Search thuần**, không chấm điểm | Trong ≤3 vị trí đã chọn ở bước 1, lấy vị trí có **category nhiều tin đang mở nhất**. Liệt kê tin của category đó — **đúng role lên đầu**, rồi phần còn lại — mới nhất trước. Tiêu đề in **tên role** đã chọn. Bỏ mọi id section 1 đang hiện |

**Checklist**
- [ ] Section 2 gọi `GET /jobs/search?category=…` (đã phân trang), sắp xếp đúng-role-trước ở BE hoặc gọi hai lượt role rồi category
- [ ] Hoà số tin → lấy vị trí ứng viên chọn trước
- [ ] Không chọn gì ở bước 1 → không có section 2; section 1 vẫn render
- [ ] Section 2 không ghi impression log
- [ ] Số tin ở bước 3 / 4 của wizard → **SRM-1347**, không làm ở đây

![Onboarding results](https://bb-project-management.s3.ap-southeast-1.amazonaws.com/attachments/15a26ad7-57c8-4516-906c-50f6e019ccb2.png)

---

## T6 · Job detail — "Recommended jobs" dưới "Similar jobs"

> Requirement: [mục 18](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18-where-recommended-jobs-appear)

| Người đọc | Section "Similar jobs" | Section "Recommended jobs" |
|---|---|---|
| Đã đăng nhập | Relevant jobs (SRM-1331), 6 thẻ, cached | Feed này, 6 dòng, xáo trộn, neo category tin đang xem (G6). **Bỏ mọi id Similar jobs đang hiện** |
| Chưa đăng nhập | Relevant jobs, 6 thẻ | **Dòng 7–12 của chính Relevant jobs** (API đó đã trả ~12). Tiêu đề đổi thành **"Có thể bạn quan tâm"** — không được hứa "cho bạn" với người mình không biết |

**Checklist**
- [ ] Relevant jobs lấy **trước** (public, cached); feed này lọc bỏ id trùng ở client
- [ ] Chưa đăng nhập: không gọi `/me/job-recommendations`; cắt dòng 7–12 từ response Similar jobs
- [ ] G6 giữ: 0 dòng → ẩn section, không nới

![Job detail](https://bb-project-management.s3.ap-southeast-1.amazonaws.com/attachments/decb9fa9-ffb7-477a-8490-ff11adbcd4b7.png)

---

## T7 · Batch apply — popup sau khi nộp đơn

> Requirement: [mục 18f](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18f-batch-apply-the-after-apply-popup-itself)

Đây là list quan trọng nhất: **không xáo trộn, luôn xếp điểm cao nhất lên đầu.** Popup lấy **feed này**, không lấy Similar jobs (chốt 2026-11-03 — SRM-1331 bỏ phần popup).

**Checklist**
- [ ] `surface=AFTER_APPLY`, **không neo** vào tin vừa nộp, tối đa 30 dòng, đúng thứ tự điểm
- [ ] **Không tick sẵn.** Tối đa **5** tin một lượt — checkbox thứ 6 disable kèm dòng nhắc
- [ ] Chip lý do: tối đa **2**, chỉ tín hiệu dương, từ `reasons` của feed. Không in %
- [ ] Dropdown sort: "Matching" (mặc định, đúng thứ tự BE gửi) · "Newest" — sort **ở client** trên đúng 30 dòng đã có, không gọi lại BE
- [ ] Info strip: "Gợi ý theo hồ sơ của bạn — xếp theo mức phù hợp." Bỏ câu "similar to the one you applied for"
- [ ] "Ứng tuyển (n) việc đã chọn" → **một** request batch, mỗi tin một transaction, một email xác nhận. Nút Apply từng dòng = apply lẻ
- [ ] Footer ghi CV sẽ gửi (mặc định CV vừa dùng); CV không Qualified → nút batch disable + lý do
- [ ] "Lưu tất cả việc làm" ↔ "Bỏ lưu tất cả" như build
- [ ] Pool rỗng → ẩn list, chỉ còn xác nhận + CV + link My applications. Có 1–2 dòng vẫn hiện

![Batch apply](https://bb-project-management.s3.ap-southeast-1.amazonaws.com/attachments/20f25b68-d1ee-4fc4-8593-c4cd7adb93f6.png)

---

## T8 · My dashboard — "Việc làm phù hợp với bạn"

> Requirement: [mục 19](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#19-my-dashboard-viec-lam-phu-hop-voi-ban-the-score-rail)

https://dev-saramin.saramin.vn/ho-so-ca-nhan

**Checklist**
- [ ] **6 tin**, carousel hiện 3; **mỗi lần bấm mũi tên trượt đúng 1 thẻ**, không nhảy 3 thẻ
- [ ] Lấy từ pool 80 xáo trộn (`surface=HOMEPAGE`, size 6 sau khi áp một-công-ty-một-hàng)
- [ ] Thẻ: tiêu đề · công ty · job level · ngày · Apply · sao. **Không %, không chip lý do**
- [ ] Không sàn điểm; pool < 6 → hiện ít hơn, không lấp
- [ ] Tiêu đề cố định "Việc làm phù hợp với bạn". Chưa onboarding → banner nhắc ở trên vẫn là lời mời, dải vẫn render từ những gì profile có
- [ ] Rail "Tương tự việc bạn vừa xem" (mục 20) **không làm** trong ticket này

![My dashboard](https://bb-project-management.s3.ap-southeast-1.amazonaws.com/attachments/b5c52123-6595-4648-9dd8-8ba3711938b8.png)

---

## Bảng kiểm thử

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | Ví dụ Linh ở [mục 10–12](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#10-worked-example-one-jobseeker-three-jobs-end-to-end) | A = 90 · B = 84 · C = 75; Batch apply ra đúng A, B, C |
| 2 | Tin không khai kinh nghiệm / ngành / học vấn (mục 15) | Mất đúng 14 + 5 + 3 điểm, các tín hiệu khác không đổi, **không** chia lại |
| 3 | Ứng viên khai Marketing · HCM, 90 ngày qua lưu 2 tin kế toán | Tin kế toán ở HCM vào pool, chấm vị trí ở mức 34 (suy ra) |
| 4 | Mở 2 tin e-commerce (chưa đủ 3) | Ngành e-commerce **không** vào tập hành vi |
| 5 | Reload dashboard 3 lần trong ngày | Cùng 6 thẻ, cùng thứ tự. Ngày mai khác |
| 6 | Pool có 4 tin FPT đứng đầu | Một hàng không có 2 thẻ FPT; Batch apply vẫn liệt kê cả 4 |
| 7 | Đã nộp đơn, sau đó rút đơn | Tin đó vẫn **không** quay lại feed, ở mọi vị trí |
| 8 | Tin đăng 2 lần cùng công ty / tiêu đề / tỉnh | Chỉ 1 dòng trong pool |
| 8b | Khai Frontend · HCM, lọc xong chỉ còn 3 tin | Bỏ G4 chạy lại → đủ ≥6 thì dừng (tin Frontend ở Hà Nội / remote vào); log có `relaxed`; tiêu đề không đổi. Trên job detail: không nới, hiện 3 tin |
| 8c | Lọc xong còn 800 tin, 150 tin đúng role | Cả 150 tin đúng role nằm trong 500 tin được chấm; log có cờ "quá 500" |
| 9 | Job detail, đã đăng nhập | Không tin nào xuất hiện ở cả Similar jobs lẫn Recommended jobs |
| 10 | Job detail, chưa đăng nhập | Section 2 = dòng 7–12 của Similar jobs, tiêu đề "Có thể bạn quan tâm" |
| 11 | Popup sau khi nộp đơn, tick 6 tin | Checkbox thứ 6 không tick được; bấm nút → 5 đơn, 1 email |
| 12 | Onboarding chọn 3 vị trí | Section 2 là vị trí có category nhiều tin nhất, tiêu đề in tên role, không trùng section 1 |
| 13 | Tin USD, ứng viên VND, dải thực giao nhau | Ăn đủ 12 điểm; xoá tỷ giá → 0 điểm |
| 14 | Mở admin General settings | Không còn tab Recommended jobs; tỷ giá vẫn sửa được |
| 15 | Bất kỳ màn hình nào | Không có % nào được in |

---

## Không làm trong task này

- Số tin ở bước 3 / 4 của wizard → **SRM-1347** (đếm theo bộ lọc, không dùng engine này)
- Section "Similar jobs" → **SRM-1331**
- Recommended candidates phía NTD → **SRM-1345** (dùng lại bảng trọng số này, nên làm sau)
- Rail "Tương tự việc bạn vừa xem" trên dashboard — mục 20, hoãn
- SEARCH strip và JOB_ALERT — không đổi hành vi, chỉ không được vỡ
- Báo cáo đọc `recommendation_impression` — sau
