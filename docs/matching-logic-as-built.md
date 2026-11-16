# Matching logic — rule hiện tại của build (as-built)

> Đọc từ code trên `origin/dev` ngày **16/11/2026**: svn-be `0279b6ce3` (16/11) · svn-web `46d6ea4ac` (14/11) · saramin-vn-admin `ac6f5780` (16/11).
> Build theo SRM-1330 (1338 · 1331 · 1345 · 1347), merge 05/11, fix thêm 12/11. Đây là **cái đang chạy**, không phải requirement; chỗ nào build khác requirement đã chốt thì đánh dấu ⚠ và gom ở mục 6.
> Nguồn chính: `svn-be/docs/architecture/job-recommendation-matching.md` (v4), `relevant-jobs-job-to-job-matching.md` (v3), và các hằng số trong code (`MatchWeights`, `JobFeed`, `RelevantJobsWeights`, `JobSimilarity`, `RecommendCandidatesService`, `OnboardingJobCountService`, `ExperienceLadder`).

---

## 0. Bản đồ — nơi nào dùng engine nào

Bốn engine, không engine nào nuôi hai chỗ cùng một câu trả lời:

| # | Nơi hiển thị | Ai thấy | Engine · API | Số thẻ | Thứ tự | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | **Onboarding — màn kết quả, section 1** ("những việc phù hợp nhất") | Ứng viên vừa xong wizard | **A** Recommended jobs · `GET /me/job-recommendations?surface=ONBOARDING&size=30` | 30 tin, FE chia **6 / trang** (≤5 trang) | **Đúng thứ tự điểm**, một công ty một hàng ⚠ | Đọc một lần sau khi lưu câu trả lời; pool mỏng → ít trang hơn, không lấp. Nới được (mục 1.2) |
| 2 | **Onboarding — section 2** "Jobs for {role}" | Như trên | **Search thuần** `GET /jobs/search?roleCodes=…&sort=posted` — không chấm điểm | Strip, **3 / trang** | Tin **đúng role** trước, rồi phần còn lại của **category** đó; trong mỗi phần: mới nhất trước | Trong ≤3 role đã chọn ở bước 1, lấy role có **category nhiều tin nhất** (hoà → role chọn trước). Bỏ mọi id section 1 đang hiện **trước khi** chia trang. |
| 3 | **Onboarding — số tin ở bước 3 và bước 4** | Khách (public, chưa cần tài khoản) | **D** Job count · `GET /onboarding/job-count?roleIds&industryIds&contractTypeIds&regionIds&years` — đếm theo bộ lọc, **không điểm** | Một con số | — | Cap **500 → in "500+"**. Dưới **5** tin tại tỉnh đã chọn → câu có thêm số **toàn quốc**. Bước 4 mà N₄ = N₃ → không in số (mục 4) |
| 4 | **Job detail — carousel "Việc làm tương tự"** | Mọi người, kể cả chưa đăng nhập | **B** Relevant jobs · `GET /jobs/{id}/similar` | **6** | Điểm ↓ → ngày đăng ↓ → id ↓ | Cache **1 giờ / tin**, tính lazy. Điểm cao nhất **< 40** → tiêu đề **"Việc làm khác tại {tỉnh}"**, vẫn đủ thẻ. FE xin ~12 dòng |
| 5a | **Job detail — danh sách "Gợi ý việc làm cho bạn"** | Đã đăng nhập | **A** · `surface=JOB_DETAIL&size=6&jobId=…&exclude=<6 id carousel>` | **6** | Xáo trộn seed (ứng viên + ngày + surface + **jobId**) | **Neo category** tin đang xem, **không bao giờ nới**. Feed rỗng → **ẩn section** (không lấp). Không bao giờ trùng carousel |
| 5b | Cùng section, **chưa đăng nhập** | Khách | **Dòng 7–12 của chính `/similar`** (không gọi feed) | ≤6 | Như carousel | Tiêu đề **"Có thể bạn quan tâm"** (không hứa "cho bạn"). Đây là cách duy nhất khách thấy section này |
| 6 | **Popup sau khi nộp đơn — Batch apply** | Người vừa nộp đơn | **A** · `surface=AFTER_APPLY&size=30&jobId=<tin vừa nộp>` | **30** | **Đúng thứ tự điểm**, không xáo | **Không neo** category; tin vừa nộp **và bản trùng của nó** (cùng công ty + tiêu đề + tỉnh) không bao giờ có. Tick tối đa **5** / lượt; sort **Matching / Newest ở client**; chip lý do ≤2 từ `reasons`; "Ứng tuyển tất cả" = **một** request `POST /me/applications/batch` |
| 7 | **My page `/ho-so-ca-nhan` — "Việc làm phù hợp với bạn"** | Đã đăng nhập | **A** · `surface=HOMEPAGE&size=6` | **6** | Xáo trộn seed (ứng viên + ngày + surface) | Tiêu đề cố định; không %, không chip. Cùng 6 thẻ cả ngày, mai khác |
| 8 | **Trang chủ** (`/`) | — | **Không có khối gợi ý cá nhân.** Component `RecommendedForYouSection` còn trong code nhưng không trang nào render; placement cũ `placement_home_hot_jobs` đã bỏ | — | — | ⚠ Rules register trên guide còn ghi "block Recommended ở trang chủ là placement" — cũ |
| 9 | **Email Job Alert** (thứ Hai **07:00** VN) | Ứng viên **bật** topic Job alert (mặc định OFF) | **A** · `surface=JOB_ALERT`, size **6** (`svn.recruitment.job-alert.size`) | 6 | **Đúng thứ tự điểm**, một công ty một hàng | **Không gửi lại** tin đã gửi ở alert trước (surface duy nhất có luật này). Dưới **3** tin mới (`job-alert.min-jobs`) → **không gửi**. Impression ghi **sau** khi gửi. Nút "Apply all" trong mail → trang `/jobs/apply-all` hiện **đúng các tin trong mail** (bỏ tin đã đóng / đã nộp / đã dismiss), không chấm lại |
| 10 | **Strip trên kết quả tìm kiếm** | — | **A** `surface=SEARCH` (BE chấm trong tập id kết quả search) | — | Điểm | BE có sẵn; **FE không gọi** — trang search chỉ gửi analytics với `surface=SEARCH`. Không có strip gợi ý trên trang search hiện nay |
| 11 | **Company Home (NTD) — "Recommended talent"** | NTD có quyền `candidate:search` | **C** Recommended candidates · `GET …/candidates/recommended?jobId&limit=3` | **3** | Best score first trong "draw của ngày" | Dropdown chọn tin của công ty; mode **MATCHED** (thẻ đầu = **Top pick**) hoặc **RECENT** "Hồ sơ mới cập nhật". Mở được CV, in tên tin. Liên hệ che như `/search` |
| 12 | **Applicants board của một tin — % phù hợp** | NTD | Cùng `ApplicantMatch` (`matchOf → forBoard`), **chỉ dữ liệu tự khai** | % | — | Dưới **4/7** tín hiệu so được → **không in %** |
| 13 | **Admin — System → General settings** | Admin | Tab **Currency** (tỷ giá USD/VND, `POST /exchange-rate`) · `GET /api/admin/matching-settings` chỉ **báo** trọng số trong code (read-only) | — | — | Tab trọng số bỏ **05/11**; link cũ `?tab=recommended-jobs` rơi về tab đầu. Endpoint ghi trọng số đã xoá |

Ngoài ra: nút **sao / dismiss** trên thẻ gợi ý → `/me/job-recommendations/{jobId}/dismissed` (tin bị loại khỏi mọi feed như tin đã nộp đơn); click thẻ → `/{jobId}/clicked` (ghi vào impression).

---

## 1. Engine A — Recommended jobs v4 (người ↔ tin)

Tính **mới mỗi lần gọi**, không lưu danh sách. Pipeline: Person → Lọc (cắt 500) → Chấm 7 tín hiệu → Pool 80 → chia theo surface → ghi impression.

### 1.1 Ứng viên là ai — khai + hành vi

| Nguồn | Lấy gì | Loại |
|---|---|---|
| `candidate_desired_role` (≤3) + `desired_role_id` | role; category của role | DECLARED |
| `desired_category_id` · `candidate_desired_location` · `candidate_desired_industry` | category · tỉnh · ngành | DECLARED |
| `job_application` / `scrap` (**1 lần** là đủ) · `job_view` (**3 tin khác nhau**) — **90 ngày** gần nhất | role · category · tỉnh của tin; giữ **top 3** mỗi loại | INFERRED |
| **Tiêu đề CV** (headline) — chỉ khi **không khai role lẫn category** | role có tên / alias nằm trọn trong tiêu đề, cụm dài nhất thắng | INFERRED, **không bật bộ lọc** |

- Giá trị INFERRED ăn **80 %** bậc (làm tròn): 42→34 · 30→24 · 17→14 · 20→16 · 5→4.
- Hành vi **không cộng điểm**: chỉ mở rộng tập so khớp, và phá hoà (hai tin bằng điểm → tin **chưa xem** lên trước).
- Hành vi **không bao giờ** sang phía NTD (engine C và board dùng `BehaviourProfile.NONE`).
- Chưa đọc được (D-REC-49): chức danh ở vị trí gần nhất trong CV, ngành của công ty trên CV, tỉnh trên Profile — chưa có dạng id.

### 1.2 Lọc trước khi chấm

| Điều kiện | Bật khi | Tập |
|---|---|---|
| **Live** | Luôn | OPEN · đã publish · chưa hết hạn · exposure on · công ty public · **chưa có đơn (mọi trạng thái)** · chưa dismiss |
| **Category** | Đã khai role hoặc category | khai ∪ hành vi, so trên `job_category_link` |
| **Tỉnh** | Đã khai tỉnh **và** không tick "sẵn sàng chuyển chỗ" (`open_to_relocate`) | khai ∪ hành vi; **hoặc tin remote** (qua từ mọi nơi) |
| **Neo tin đang xem** | Chỉ `JOB_DETAIL` | Category của tin đang xem; **không bao giờ nới** |
| Ngành · hình thức · lương · năm · học vấn · kỹ năng | Không bao giờ | Chỉ ăn điểm |

- Không khai gì → không bật điều kiện nào → pool rộng nhất.
- **Cắt 500 trước khi chấm**: `ORDER BY (tin có ≥1 role trong tập role của ứng viên) DESC, publish_at DESC`, lấy 500; adapter xin **501** dòng để biết có cắt hay không → cờ `pool_capped` vào log.
- **Dưới 6 tin** (chưa đủ một hàng) → nới **2 bước**: bỏ điều kiện tỉnh, chạy lại; vẫn dưới 6 → bỏ cả category. Cờ `relaxed` vào log, **tiêu đề không đổi**. Không nới trên `JOB_DETAIL`, và không nới khi `SEARCH` có từ khoá không khớp tin nào.

### 1.3 Điểm — `MatchWeights.DEFAULT` = **v4**, cố định trong code

| Tín hiệu | Max | Bậc |
|---|---|---|
| **Vị trí & role** | **42** | Cùng role 42 · cùng group 30 · cùng category 17 · khác 0 — lấy **một** bậc cao nhất, không cộng. ⚠ Group chưa có trong DB (D-REC-52) → thực tế **42 → 17 → 0** |
| **Địa điểm & hình thức** | **20** | Đúng tỉnh + đúng hình thức 20 · tin remote 20 · đúng tỉnh khác hình thức 14 · tỉnh lân cận 10 · khác 0. **Người không khai tỉnh: không so, remote cũng 0** (fix 05/11) ⚠. Bậc 10 "lân cận" chưa có bảng (D-REC-50) → không bao giờ đạt |
| **Kinh nghiệm** | **14** | Trong dải / "không yêu cầu" 14 · thừa ≤2 năm 10 · thiếu ≤1 năm 7 · thừa >2 năm 5 · thiếu >1 năm 0. Tin **chỉ khai cấp bậc** → quy năm của ứng viên ra bậc (`ExperienceLadder`, mục 4.3): cùng bậc 14 · lệch 1 bậc 7 · còn lại 0. Năm đọc **Profile trước, CV sau** |
| **Lương** | **12** | Trong dải hoặc dải cao hơn mong muốn 12 · đòi hơn ≤10 % 8 · ≤20 % 4 · một bên "Thỏa thuận" 6 · >20 % 0. Khác tiền tệ → quy đổi theo **tỷ giá admin, hai chiều** (chỉ nhập USD→VND vẫn so được chiều ngược); **không có tỷ giá → 0** |
| **Ngành** | **5** | Trùng 5 · cùng cha 3 · khác 0 |
| **Kỹ năng** | **4** | 4 × (khớp ÷ yêu cầu); skill ESSENTIAL tính đôi hai vế |
| **Học vấn** | **3** | Đạt / "Không yêu cầu" 3 · thấp 1 bậc 1 · còn lại 0 |

- **Thiếu dữ liệu = 0, không chia lại** — cả phía tin lẫn phía ứng viên. Tổng luôn trên thang 100, làm tròn **một lần** ở tổng.
- Nhiều CV: chấm **từng CV**, mỗi tin giữ **điểm cao nhất**.
- Ứng viên **không bao giờ thấy điểm**: API trả `matchPercent = null`, không `heading`, không `relaxed`; `reasons` vẫn trả (chỉ Batch apply dùng làm chip).

### 1.4 Pool 80 và cách chia cho từng surface (`JobFeed`)

- Khử trùng **công ty + tiêu đề + tỉnh** → giữ tin mới nhất; rồi lấy **top 80** theo điểm (`POOL = 80`). **Không ngưỡng điểm.**
- Nếu có tin neo (`jobId`): tin đó **và bản trùng của nó** bị loại khỏi pool (fix 05/11); `exclude` (≤20 id) loại thêm — dùng cho job detail để không ghi impression cho thẻ carousel.
- Một hàng **6 thẻ** (`ROW = 6`): **một công ty một hàng** — gặp công ty trùng thì lấy thẻ kế tiếp; hết công ty khác nhau thì **vẫn lấp đủ 6** (lặp công ty) để các hàng sau không lệch vị trí.
- Thứ tự theo surface:

| Surface | Thứ tự | 
|---|---|
| `AFTER_APPLY` | **Đúng thứ tự điểm** (`JobFeed.ranked`), không gom theo công ty |
| `ONBOARDING` · `JOB_ALERT` · `SEARCH` | **Điểm cao nhất trước** + một công ty một hàng (`JobFeed.best`) |
| `HOMEPAGE` · `JOB_DETAIL` | **Xáo trộn seed** (`JobFeed.dealt`) + một công ty một hàng |

- **Seed** = `hash(candidateId, ngày VN, surface, jobId-neo)` → cùng màn hình **ổn định cả ngày**, reload không đổi; mỗi màn hình đảo khác nhau; mai khác. Không bao giờ random thuần.
- `size` tối đa **80**.

### 1.5 Log và tín hiệu ngược

- `recommendation_impression`: một dòng **mỗi thẻ hiện** — candidateId · jobId · score · `v4` · rate version · surface · position · `relaxed` · `pool_capped`. `JOB_ALERT` ghi **sau khi gửi** mail (một alert không gửi được thì tin vẫn còn cho tuần sau).
- `POST /{jobId}/clicked` → `clicked_at`; `/dismissed` → loại vĩnh viễn như tin đã nộp đơn.
- Không còn (so với v3): ngưỡng 50/60, xoay trong dải 5 điểm, giáng hạng sau 3 lần hiện, cap công ty trong pool, 4 cấp tiêu đề, trọng số chỉnh ở admin, renormalise.

---

## 2. Engine B — Relevant jobs v3 (tin ↔ tin) — `GET /jobs/{id}/similar?limit`

Không đọc hồ sơ người xem → một danh sách cho mọi người, **cache theo tin**.

**Luồng:** tin gốc phải OPEN/CLOSED · exposure · công ty public (không thì 404) → cache Caffeine **1 giờ / jobId**, tính **lazy** ở request đầu tiên sau khi cache hết hạn (tin không ai mở không tốn gì) → một câu SQL đọc facts tin gốc + **mọi tin live** (**không cổng category**) → `JobSimilarity` chấm trong bộ nhớ → khử trùng công ty + tiêu đề + tỉnh (mới nhất) và **bản trùng của chính tin gốc** → **tối đa 2 tin / công ty** → sắp **điểm ↓ → publish ↓ → id ↓** → giữ **20 id** → dựng thẻ, kiểm tra live lại. **Không** có giới hạn 500; nếu sau này cần: giới hạn theo `cùng category ∪ cùng tỉnh`, cắt **sau** khi chấm, không bao giờ theo ngày đăng.

**Điểm — `RelevantJobsWeights.DEFAULT` = v3:**

| Tín hiệu | Max | Bậc |
|---|---|---|
| Taxonomy | **45** | Cùng role 45 · cùng group 32 · cùng category 18 — quan hệ **mạnh nhất** giữa mọi cặp role. ⚠ Group rỗng (D-REC-52) → thực tế 45 → 18 → 0 |
| Cấp bậc | **15** | Cùng bậc 15 · lệch 1 → 9 · lệch 2 → 4 · ≥3 → 0 (cặp gần nhất giữa các level hai tin) |
| Địa điểm | **15** | Cùng tỉnh, hoặc một bên remote 15 · tỉnh lân cận 9 (chưa có bảng, D-REC-50) · khác 0 |
| Lương | **10** | Hai dải giao nhau 10 · lệch trong 20 % → 5 · không giao 0. Quy về **tháng** và quy đổi tiền tệ theo tỷ giá admin hai chiều (fix 12/11); không có tỷ giá → 0 |
| Kỹ năng | **8** | 8 × (chung ÷ số skill của **tin gốc**) |
| Ngành | **4** | Cùng ngành 4 · cùng nhóm cha 2 |
| Hình thức | **3** | Cùng job type 3 · remote ↔ hybrid 2 |

- Thiếu dữ liệu ở **bất kỳ phía nào = 0**, không chia lại (cùng luật với engine A).
- API trả `{ items, weak }` — **không trả điểm**. `weak = true` (điểm cao nhất < **40**, `RELATED_FLOOR`) → FE đổi tiêu đề "Việc làm khác tại {tỉnh}", **vẫn đủ thẻ**.
- FE xin ~12 dòng: 6 cho carousel, 7–12 cho section thứ hai của **khách**. Người đã đăng nhập: FE **ẩn tin đã nộp đơn ở client** (cache không đổi).

---

## 3. Engine C — Recommended candidates (tin ↔ người, phía NTD) — `GET …/candidates/recommended?jobId&limit=3`

| Bước | Luật |
|---|---|
| **Tin neo** | `jobId` được chọn; không có → mặc định: tin **OPEN** chưa quá hạn → **SCHEDULE** → **DRAFT**, tin sửa gần nhất trong tier |
| **Ai vào vòng chấm** | Ứng viên **muốn role hoặc category của tin**, HOẶC CV **có một skill của tin**; phải: cho phép tìm kiếm (`searchVisible`), CV **Qualified** có kinh nghiệm + học vấn, **chưa nằm trong talent pool** của công ty. Cap **500** trước khi chấm (`PRE_SCORE_LIMIT`); người bị "bỏ qua" 3 lần rời tập trước khi cắt |
| **Chấm** | `ApplicantMatch` cùng bảng v4 ở mục 1.3, đọc **chỉ dữ liệu tự khai** (profile + CV, **không hành vi**). Không khai role → suy từ **tiêu đề CV** (inferred, 80 %); không khai tỉnh → **tỉnh cư trú** trên profile (fix 12/11) |
| **Pool của ngày** | **Top 30** có điểm **≥ 40** (`POOL`, sàn 40) |
| **Hiển thị** | Draw **seeded theo công ty + ngày** chọn `limit` người (mặc định **3**) từ pool, **điểm cao nhất trước**; cùng người cả ngày, mai khác. Thẻ đầu trong mode MATCHED = **Top pick** |
| **Bị lờ đi** | Hiện **3 lần** mà không được mở (`IGNORED_AFTER_SHOWS = 3`) → loại |
| **Không có ai đạt** | Mode **RECENT** "Hồ sơ mới cập nhật": CV mới nhất, **ngành của công ty** ưu tiên, **một người / category**, **không in %** |
| **Liên hệ** | Che như trang `/search` |

---

## 4. Engine D — Onboarding job count (bộ lọc, không điểm) — `GET /onboarding/job-count` (public)

### 4.1 Điều kiện đếm — mọi điều kiện **giữ** tin không khai trường đó

| Tham số | Điều kiện trên tin |
|---|---|
| Luôn | `status = OPEN` · đã publish · exposure on · công ty public |
| `roleIds` → **category** của role | Tin có category trong tập, **hoặc tin không có category nào** (đếm ở mức category, nên role hẹp vẫn ra số ≥ 2) |
| `industryIds` | `industry_id` trong tập, hoặc tin **không có ngành** (tin tự đăng không có ô ngành → luôn qua) |
| `contractTypeIds` | Trong tập, hoặc tin không khai |
| `regionIds` → mã tỉnh | Tin **remote**, hoặc tỉnh của tin / company location trong tập, hoặc tin **không có địa điểm** |
| `years` | Tin khai dải năm → `min_experience_years ≤ years`; không khai dải nhưng khai **cấp bậc** → giữ tin có bậc **≤ bậc của người + 1**; không khai gì → giữ |
| Học vấn | **Không** là điều kiện |

### 4.2 Trả về và banner

- `{ total, capped, nationwide, nationwideCapped }`. `total` cap **500** (query xin 501) → FE in **"500+"**.
- Có chọn tỉnh và `total < 5` → đếm thêm **không điều kiện tỉnh** → `nationwide` (cũng cap 500).
- FE (`bannerCount`): **bước 3** in N₃ (đếm trên bước 1 + 2); **bước 4** in N₄ (bước 1 + 2 + 3) — **N₄ = N₃ → không in số**; `total = 0` → không in 0 (chỉ câu "toàn quốc có X" nếu có); tỉnh mỏng → câu nói rõ "… toàn quốc"; lỗi API → câu không có số. Các bước khác không có số.

### 4.3 Bảng năm → bậc (`ExperienceLadder`, trên `job_level.sort_order` 1–9) — dùng chung cho engine A, C và D

| Năm kinh nghiệm | Bậc |
|---|---|
| < 1 (fresher, 0) | 2 |
| 1–2 | 3 |
| 3–4 | 4 |
| 5–7 | 5 |
| 8–11 | 6 |
| 12–14 | 7 |
| ≥ 15 | 8 |
| Không khai | không có bậc → không so (A, C) / không lọc (D) |

Lệch 1 bậc = "với tới được" (`ADJACENT = 1`); lệch ≥2 = không hợp.

---

## 5. Luật dùng chung cho cả bốn engine

1. **"Đã ứng tuyển"** = có **bất kỳ** dòng `job_application` cho (ứng viên, tin), mọi trạng thái → tin biến mất khỏi engine A (mọi surface, kể cả Batch apply) và khỏi engine B với người đã đăng nhập (ẩn ở client). Rút đơn cũng không quay lại.
2. **Tin dismiss** → như tin đã nộp đơn.
3. **Thiếu dữ liệu = 0 điểm, không chia lại**, ở A, B và C. Ngoại lệ duy nhất là **cách in %** trên board NTD (dưới 4/7 tín hiệu → không in).
4. **Trọng số nằm trong code, có version** (`v4` người ↔ tin, `v3` tin ↔ tin) và đi vào mọi điểm / impression. Admin không chỉnh được.
5. **Tỷ giá USD/VND** do admin nhập là thứ duy nhất chỉnh được; dùng hai chiều; thiếu → tín hiệu lương = 0 ở cả ba engine chấm điểm.
6. **Ứng viên không bao giờ thấy %**; NTD thấy % trên board và không thấy trên "Hồ sơ mới cập nhật".
7. **Năm → bậc** một bảng (mục 4.3).
8. **Một công ty một hàng 6 thẻ** ở mọi surface có hàng (trừ Batch apply, là danh sách).
9. Thang occupation **Role › Group › Category** viết sẵn 3 tầng ở cả A, B, C; Group **chưa có dữ liệu** cho tới SRM-1315.

---

## 6. Build khác requirement / tài liệu ở đâu (để biết, không phải bug)

| # | Chỗ | Build đang làm | Requirement / tài liệu nói | Ghi chú |
|---|---|---|---|---|
| 1 | Onboarding section 1 | **Đúng thứ tự điểm** | Trang NEW logic §12 / §12a: "xáo trộn" | Dev đổi 12/11 có chủ ý ("kết quả là phần thưởng cho câu trả lời vừa gõ"). Nên sửa requirement theo build |
| 2 | Địa điểm, người không khai tỉnh | Tin remote **0 điểm** | §7: "tin REMOTE → 20, từ mọi nơi" | Fix 05/11: không có fix này thì top 10 của người chỉ có CV toàn tin remote không liên quan. Nên sửa requirement |
| 3 | Bậc "cùng group" (30 / 32 điểm) | Không bao giờ đạt | Cả hai trang có bậc này | D-REC-52 — chờ taxonomy SRM-1315 |
| 4 | Bậc "tỉnh lân cận" (10 / 9 điểm) | Không bao giờ đạt | Cả hai trang có bậc này | D-REC-50 — chờ bảng ~10 cặp tỉnh từ BA |
| 5 | Fallback "only if empty" | Mới đọc **tiêu đề CV**; chưa đọc chức danh vị trí gần nhất, ngành công ty trên CV, tỉnh profile | §7 liệt kê cả ba | D-REC-49 — dữ liệu chưa có dạng id |
| 6 | Board NTD — kỹ năng CV không resolve | Tính là "không có skill" | §9 ②: tính là "chưa biết" | D-REC-51 |
| 7 | Strip gợi ý trên trang search | BE có, FE không gọi | Ngoài phạm vi SRM-1338 | Không có strip; chỉ analytics `surface=SEARCH` |
| 8 | Trang chủ | Không có khối gợi ý cá nhân | Guide `/danh-sach-rule` (Product settings): "block Recommended ở trang chủ là placement" | Guide cũ; placement đã bỏ |
| 9 | Guide `/danh-sach-rule` — mục "Matching & gợi ý" | — | "Recommend job theo profile, recommend ứng viên theo job — **logic chưa có**" (ghi 04/11) | Đã có từ 05/11 — cần thay bằng tài liệu này |
| 10 | Engine C — ai vào vòng chấm | Thêm nhánh **"CV có một skill của tin"** | Trang Recommended candidates nói theo role / category | Mở rộng tập, không đổi cách chấm |
