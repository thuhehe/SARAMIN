# Matching logic — rule hiện tại của build (as-built)

> Đọc từ code trên `origin/dev` tối **16/11/2026**: svn-be `58e37d05a` · svn-web `e3ff8df46` · saramin-vn-admin `d0be92d3`. Đã gồm **SRM-1491** (xáo trộn trong từng bậc role, merge 16/11 14:43) và **SRM-1551** (rút đơn là cuối, 16/11).
> Build theo SRM-1330 (1338 · 1331 · 1345 · 1347), merge 05/11, fix 12/11 theo chốt của Thu. Đây là **cái đang chạy**, không phải requirement; chỗ build khác requirement thì đánh dấu ⚠ và gom ở mục 7. Những gì Long báo đã sửa ngày 16/11 nhưng **chưa lên dev** nằm ở mục 8.
> Nguồn: `svn-be/docs/architecture/job-recommendation-matching.md` (v4), `relevant-jobs-job-to-job-matching.md` (v3), changelog recruitment / search / notification, và các hằng số trong code (`MatchWeights`, `JobFeed`, `RelevantJobsWeights`, `JobSimilarity`, `RecommendCandidatesService`, `OnboardingJobCountService`, `ExperienceLadder`, `JobsLikeAppliedService`, `AfterApplySuggestionService`).

---

## 0. Bản đồ — nơi nào dùng engine nào

Năm engine, không engine nào nuôi hai chỗ cùng một câu trả lời:

| # | Nơi hiển thị | Ai thấy | Engine · API | Số thẻ | Thứ tự | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | **Onboarding — màn kết quả, section 1** ("những việc phù hợp nhất") | Ứng viên vừa xong wizard | **A** Recommended jobs · `GET /me/job-recommendations?surface=ONBOARDING&size=30` | 30 tin, FE chia **6 / trang** (≤5 trang) | **Đúng thứ tự điểm**, cap 3 tin/công ty + cách nhau ≥ 6 vị trí (Thu chốt 12/11 và 17/11) | Đọc một lần sau khi lưu câu trả lời; pool mỏng → ít trang hơn, không lấp. Nới được (mục 1.2) |
| 2 | **Onboarding — section 2** "Jobs for {role}" | Như trên | **Search thuần** `GET /jobs/search?roleCodes=…&sort=posted` — không chấm điểm | Strip, **3 / trang**, hiện khi còn **≥1** tin | Tin **đúng role** trước, rồi phần còn lại của **category** đó; trong mỗi phần: mới nhất trước | Trong ≤3 role đã chọn ở bước 1, lấy role có **category nhiều tin nhất** (hoà → role chọn trước). Bỏ mọi id section 1 đang hiện **trước khi** chia trang. ⚠ **Thu chốt 17/11: chỉ lấy tin ĐÚNG role (bỏ nhánh category), và dưới 3 tin thì ẩn cả khối** — xem mục 7 dòng 19; build chưa làm |
| 3 | **Onboarding — số tin ở bước 3 và bước 4** | Khách (public, chưa cần tài khoản) | **D** Job count · `GET /onboarding/job-count?roleIds&industryIds&contractTypeIds&regionIds&years` — đếm theo bộ lọc, **không điểm** | Một con số | — | Cap **500 → in "500+"**. Dưới **5** tin tại tỉnh đã chọn → câu có thêm số **toàn quốc**. Bước 4 mà N₄ = N₃ → không in số. **Không cần khớp** số của trang tìm việc (Thu chốt 12/11, mục 4.4) |
| 4 | **Job detail — carousel "Việc làm tương tự"** | Mọi người, kể cả chưa đăng nhập | **B** Relevant jobs · `GET /jobs/{id}/similar` | **6** | Điểm ↓ → ngày đăng ↓ → id ↓ | Cache **1 giờ / tin**, tính lazy (làm mới tối đa ~75 phút — Thu chấp nhận 12/11). Điểm cao nhất **< 40** → tiêu đề **"Việc làm khác tại {tỉnh}"**, vẫn đủ thẻ. FE xin ~12 dòng |
| 5a | **Job detail — danh sách "Gợi ý việc làm cho bạn"** | Đã đăng nhập | **A** · `surface=JOB_DETAIL&size=6&jobId=…&exclude=<6 id carousel>` | **6** | Xáo trộn seed (ứng viên + ngày + surface + **jobId**), **trong từng bậc role** (mục 1.4) | **Neo category** tin đang xem, **không bao giờ nới**. Feed rỗng → **ẩn section** (không lấp). Không bao giờ trùng carousel |
| 5b | Cùng section, **chưa đăng nhập** | Khách | **Dòng 7–12 của chính `/similar`** (không gọi feed) | ≤6 | Như carousel | Tiêu đề **"Có thể bạn quan tâm"** (không hứa "cho bạn"). Đây là cách duy nhất khách thấy section này |
| 6 | **Popup sau khi nộp đơn — Batch apply** | Người vừa nộp đơn | **A** · `surface=AFTER_APPLY&size=30&jobId=<tin vừa nộp>` | **30** | **Đúng thứ tự điểm**, không xáo | **Không neo** category; tin vừa nộp **và bản trùng của nó** (cùng công ty + tiêu đề + tỉnh) không bao giờ có. Tick tối đa **5** / lượt; sort **Matching / Newest ở client**; chip lý do ≤2 từ `reasons`; "Ứng tuyển tất cả" = **một** request `POST /me/applications/batch`; popup vẫn mở khi danh sách rỗng |
| 7 | **My page `/ho-so-ca-nhan` — "Việc làm phù hợp với bạn"** | Đã đăng nhập | **A** · `surface=HOMEPAGE&size=6` | **6** | Xáo trộn seed (ứng viên + ngày + surface), **trong từng bậc role** | Tiêu đề cố định; không %, không chip. Cùng 6 thẻ cả ngày, mai khác |
| 8 | **Trang chủ** (`/`) | — | **Không có khối gợi ý cá nhân.** Component `RecommendedForYouSection` còn trong code nhưng không trang nào render; placement cũ `placement_home_hot_jobs` đã bỏ | — | — | ⚠ Rules register trên guide còn ghi "block Recommended ở trang chủ là placement" — cũ |
| 9 | **Email JS 3 — Gợi ý việc làm hằng tuần** (thứ Hai **07:00** VN) | **Mọi ứng viên ACTIVE** chưa tắt công tắc **"Nhận email thông báo từ hệ thống"** (mặc định **BẬT**, trang Thông tin tài khoản) — không còn opt-in (SRM-1433, 10/11) | **A** · `surface=JOB_ALERT`, size **6** | 6 | **Đúng thứ tự điểm**, cap 3 tin/công ty + cách nhau ≥ 6 vị trí | Chỉ quét khi rule email JS 3 đang bật ở admin. **Không gửi lại** tin đã gửi ở alert trước (surface duy nhất có luật này). Dưới **3** tin mới → **không gửi**. Impression ghi **sau** khi gửi. Nút "Ứng tuyển tất cả" → trang `/jobs/apply-all` hiện **đúng các tin trong mail** (bỏ tin đã đóng / đã nộp / đã dismiss), không chấm lại |
| 10 | **Strip trên kết quả tìm kiếm** | — | **A** `surface=SEARCH` (BE chấm trong tập id kết quả search) | — | Điểm | BE có sẵn; **FE không gọi** — trang search chỉ gửi analytics. Không có strip gợi ý trên trang search hiện nay |
| 11 | **Company Home (NTD) — "Recommended talent"** | NTD có quyền `candidate:search` | **C** Recommended candidates · `GET …/candidates/recommended?jobId&limit=3` | **3** | Best score first trong "draw của ngày" | Dropdown chọn tin của công ty; mode **MATCHED** (thẻ đầu = **Top pick**) hoặc **RECENT** "Hồ sơ mới cập nhật"; tiêu đề in tên tin. **Bấm thẻ → mở đúng trang CV che PI của Search talent**, cùng luật **trừ lượt mở CV miễn phí** của trang đó (Thu chốt 16/11: CÓ trừ); lượt bấm được ghi cho luật "3 lần không bấm" |
| 12 | **Applicants board của một tin — % phù hợp** | NTD | Cùng `ApplicantMatch`, **chỉ dữ liệu tự khai** | % | — | Dưới **4/7** tín hiệu so được → **không in %**. Đơn **đã rút** không còn trên board (SRM-1551) |
| 13 | **Admin — System → General settings** | Admin | Tab **Currency** (tỷ giá USD/VND) · `GET /api/admin/matching-settings` chỉ **báo** trọng số trong code (read-only) | — | — | Tab trọng số bỏ **05/11**; link cũ `?tab=recommended-jobs` rơi về tab đầu. Endpoint ghi trọng số đã xoá |
| 14 | **Email JS 4 (ứng tuyển thành công) / JS 5 (apply all) — khối "việc làm gợi ý"** | Ứng viên vừa nộp đơn, chưa tắt "Nhận email thông báo từ hệ thống" | **E** Việc làm giống tin vừa nộp · Elasticsearch, `JobsLikeAppliedService` (SRM-1433, 10/11) — **không đọc hồ sơ**, không phải engine A | tối đa **4** | Điểm = 0.5 Relevance + 0.25 Fairness + 0.15 Package + 0.1 Freshness (mục 5) | Tin gốc = tin vừa nộp (JS 5: tin **chọn cuối** trong lượt). Khớp **≥1 skill và ≥1 tỉnh** với tin gốc. Có 1–3 tin → in đúng số đó; **0 tin → ẩn cả khối**, phần xác nhận vẫn gửi. Không có Elasticsearch → ẩn khối. **Không fallback**, không blacklist |

Ngoài ra: nút **sao / dismiss** trên thẻ gợi ý → `/me/job-recommendations/{jobId}/dismissed` (tin bị loại khỏi mọi feed như tin đã nộp đơn); click thẻ → `/{jobId}/clicked` (ghi vào impression).

---

## 1. Engine A — Recommended jobs v4 (người ↔ tin)

Tính **mới mỗi lần gọi**, không lưu danh sách. Pipeline: Person → Lọc (cắt 500) → Chấm 7 tín hiệu → Pool 30 → cap 3 tin/công ty → chia theo surface (giãn ≥ 6 vị trí) → ghi impression.

### 1.1 Ứng viên là ai — khai + hành vi

| Nguồn | Lấy gì | Loại |
|---|---|---|
| `candidate_desired_role` (≤3) + `desired_role_id` | role; category của role | DECLARED |
| `desired_category_id` · `candidate_desired_location` · `candidate_desired_industry` | category · tỉnh · ngành ("Ngành mong muốn" trong Work preference — Thu chốt 16/11: đây là field ngành duy nhất, không suy từ CV) | DECLARED |
| `job_application` / `scrap` (**1 lần** là đủ) · `job_view` (**3 tin khác nhau**) — **90 ngày** gần nhất | role · category · tỉnh của tin; giữ **top 3** mỗi loại | INFERRED |
| **Tiêu đề CV** (headline) — chỉ khi **không khai role lẫn category** | role có tên / alias nằm trọn trong tiêu đề, cụm dài nhất thắng | INFERRED, **không bật bộ lọc** |
| **Tỉnh cư trú** trên Profile — chỉ khi không khai tỉnh **và** hành vi không có tỉnh (fix 12/11) | tỉnh | INFERRED ⚠ Thu chốt 16/11: **bỏ**, địa điểm chỉ lấy từ Work preference — Long đang gỡ (mục 8) |

- Giá trị INFERRED ăn **80 %** bậc (làm tròn): 42→34 · 30→24 · 17→14 · 20→16 · 5→4.
- Hành vi **không cộng điểm**: chỉ mở rộng tập so khớp, và phá hoà (hai tin bằng điểm → tin **chưa xem** lên trước).
- Hành vi **không bao giờ** sang phía NTD.
- Chưa đọc được (D-REC-49): chức danh ở vị trí gần nhất trong CV, ngành của công ty trên CV — chưa có dạng id; ngành thì Thu đã chốt **không làm**.

### 1.2 Lọc trước khi chấm

| Điều kiện | Bật khi | Tập |
|---|---|---|
| **Live** | Luôn | OPEN · đã publish · chưa hết hạn · exposure on · công ty public · **chưa có đơn — mọi trạng thái, kể cả đã rút** (`NOT EXISTS job_application`) · chưa dismiss |
| **Category** | Đã khai role hoặc category | khai ∪ hành vi, so trên `job_category_link` |
| **Tỉnh** | Đã khai tỉnh **và** không tick "sẵn sàng chuyển chỗ" | khai ∪ hành vi; **hoặc tin remote** (qua từ mọi nơi) |
| **Neo tin đang xem** | Chỉ `JOB_DETAIL` | Category của tin đang xem; **không bao giờ nới** |
| Ngành · hình thức · lương · năm · học vấn · kỹ năng | Không bao giờ | Chỉ ăn điểm |

- Không khai gì → không bật điều kiện nào → pool rộng nhất.
- **Cắt 500 trước khi chấm**: tin có ≥1 role trong tập role của ứng viên đứng trước, rồi mới nhất trước, lấy 500; adapter xin **501** dòng để biết có cắt hay không → cờ `pool_capped` vào log.
- **Dưới 6 tin** (chưa đủ một hàng) → nới **2 bước**: bỏ điều kiện tỉnh, chạy lại; vẫn dưới 6 → bỏ cả category. Cờ `relaxed` vào log, **tiêu đề không đổi**. Không nới trên `JOB_DETAIL`, và không nới khi `SEARCH` có từ khoá không khớp tin nào.

### 1.3 Điểm — v4, cố định trong code

| Tín hiệu | Max | Bậc |
|---|---|---|
| **Vị trí & role** | **42** | Cùng role 42 · cùng group 30 · cùng category 17 · khác 0 — lấy **một** bậc cao nhất, không cộng. ⚠ Group chưa có trong DB (D-REC-52) → thực tế **42 → 17 → 0** |
| **Địa điểm & hình thức** | **20** | Đúng tỉnh + đúng hình thức 20 · tin remote 20 · đúng tỉnh khác hình thức 14 · tỉnh lân cận 10 · khác 0. **Người không khai tỉnh: không so, remote cũng 0** (Thu chốt 12/11 — sửa spec theo build). Bậc 10 "lân cận" chưa có bảng, **Thu chốt 12/11 bỏ hẳn** → khác tỉnh = 0; Long đang gỡ khỏi code (mục 8) |
| **Kinh nghiệm** | **14** | Trong dải / "không yêu cầu" 14 · thừa ≤2 năm 10 · thiếu ≤1 năm 7 · thừa >2 năm 5 · thiếu >1 năm 0. Tin **chỉ khai cấp bậc** → quy năm của ứng viên ra bậc (mục 4.3): cùng bậc 14 · lệch 1 bậc 7 · còn lại 0. Năm đọc **Profile trước, CV sau** |
| **Lương** | **12** | Trong dải hoặc dải cao hơn mong muốn 12 · đòi hơn ≤10 % 8 · ≤20 % 4 · một bên "Thỏa thuận" 6 · >20 % 0. Khác tiền tệ → quy đổi theo **tỷ giá admin, hai chiều** (fix 12/11); **không có tỷ giá → 0** |
| **Ngành** | **5** | Trùng 5 · cùng cha 3 · khác 0 |
| **Kỹ năng** | **4** | 4 × (khớp ÷ yêu cầu); skill ESSENTIAL tính đôi hai vế |
| **Học vấn** | **3** | Đạt / "Không yêu cầu" 3 · thấp 1 bậc 1 · còn lại 0 |

- **Thiếu dữ liệu = 0, không chia lại** — cả phía tin lẫn phía ứng viên. Tổng luôn trên thang 100, làm tròn **một lần** ở tổng.
- Nhiều CV: chấm **từng CV**, mỗi tin giữ **điểm cao nhất**.
- Ứng viên **không bao giờ thấy điểm**: API trả `matchPercent = null`, không `heading`, không `relaxed`; `reasons` vẫn trả (chỉ Batch apply dùng làm chip).

### 1.4 Pool 30, cap 3 tin/công ty, cách nhau 6 vị trí, và cách chia cho từng surface

- Khử trùng **công ty + tiêu đề + tỉnh** → giữ tin mới nhất; rồi lấy **top 30** theo điểm. **Không ngưỡng điểm.** ⚠ `JobFeed.POOL = 80` trên dev tối 16/11. Thu chốt **50** chiều 16/11 ("80 hơi rộng, chứa nhiều job không liên quan"), rồi **chốt 30 ngày 17/11**. Long mới sửa tới 50 và chưa lên dev; 30 thì chưa ai làm (mục 8).
- **Tối đa 3 tin / công ty** — **Thu chốt 17/11**, **chưa có trong code**. Áp cho **Onboarding, Job detail, My dashboard**; **Batch apply KHÔNG áp** (xem dưới). Đi xuống danh sách đã chấm, gặp tin thứ 4 của cùng một công ty thì bỏ qua. Không xếp lại, không đổi điểm, không giữ chỗ.
  - Lý do: onboarding trên prod hiện 5 trang × 6 thẻ **toàn MB Bank**. Luật "một công ty một hàng" chỉ giãn được vài thẻ đầu; hết công ty khác nhau là nó lấp lặp lại (gạch dưới), nên không có cap thì pool 50 có thể là 50 tin của một nhà tuyển dụng.
  - 3 ở đâu ra: **một phần mười của pool 30**. Đó là cách **chọn** con số, không phải cách **tính** nó — **3 là hằng số trong code**; pool đổi thì cap được chốt lại bằng tay, không tự tính lại.
  - v3 từng có cap riêng `max(2, size ÷ 10)`; v4 bỏ đi. Đây là đưa lại.
  - Vì sao để % trong code thì hỏng: % siết đúng lúc danh sách đã ngắn (10% của 8 tin = 1), và mỗi surface rút số thẻ khác nhau từ cùng một pool nên "10%" ra mỗi màn hình một con số, không viết thành một luật kiểm thử được.
- **Hai tin cùng công ty cách nhau ít nhất 6 vị trí** — **Thu chốt 17/11**, **chưa có trong code**. Luật này **thay cho** "một công ty một hàng": hàng phụ thuộc bề ngang màn hình (trên mobile một hàng = một thẻ), vị trí thì không. Dựng danh sách từng vị trí một, lấy tin xếp cao nhất còn lại mà công ty của nó **chưa xuất hiện trong 5 vị trí gần nhất**; không còn tin nào hợp lệ thì vẫn lấp (ghi cờ vào log).
  - Hệ quả miễn phí: màn 6 thẻ (Job detail, My dashboard) **không bao giờ** lặp công ty — 6 vị trí không lọt vừa trong 6 thẻ. Onboarding 6 thẻ/trang thì hai thẻ cùng công ty **không bao giờ cùng một trang**.
- **Batch apply — luật lỏng hơn, Thu chốt 17/11**: **không cap** (giữ mọi công ty, vì đây là danh sách xếp theo điểm và thứ hạng phải đúng), nhưng **không để hai tin cùng công ty liền nhau**. Đi theo thứ tự điểm; gặp tin cùng công ty với tin vừa đặt thì **tìm xuống tối đa 3 dòng** để lấy tin khác công ty; cả 3 cũng cùng công ty thì chấp nhận lặp và đi tiếp. Không thẻ nào xê dịch quá 3 bậc so với hạng của nó.
- Nếu có tin neo (`jobId`): tin đó **và bản trùng của nó** bị loại khỏi pool; `exclude` (≤20 id) loại thêm — dùng cho job detail để không ghi impression cho thẻ carousel.

| Surface | Thứ tự |
|---|---|
| `AFTER_APPLY` | **Đúng thứ tự điểm**; **không cap công ty**, nhưng **không hai tin cùng công ty liền nhau** (nhìn xuống tối đa 3 dòng — 17/11) |
| `ONBOARDING` · `JOB_ALERT` · `SEARCH` | **Điểm cao nhất trước** + **cap 3 tin/công ty** + **cách nhau ≥ 6 vị trí** (17/11) |
| `HOMEPAGE` · `JOB_DETAIL` | **Xáo trộn seed trong từng bậc role** (SRM-1491, 16/11) + **cap 3 tin/công ty** + **cách nhau ≥ 6 vị trí** (17/11) |

- **Xáo trộn trong từng bậc role** (SRM-1491): pool được xếp theo **điểm của riêng tín hiệu Vị trí & role** — role **khai** 42 → role **hành vi** 34 → group 30 / 24 → category 17 / 14 → còn lại 0 — rồi chỉ xáo **bên trong** mỗi bậc. Tin đúng role đã khai không bao giờ đứng sau tin chỉ cùng category dù tin kia hơn điểm địa điểm / lương. Lý do: QA Engineer từng thấy Sysadmin, Helpdesk, Data Engineer đứng trước tin QA.
- **Seed** = hash(ứng viên, ngày VN, surface, tin neo) → cùng màn hình **ổn định cả ngày**, reload không đổi; mỗi màn hình đảo khác nhau; mai khác. Không bao giờ random thuần.
- `size` tối đa **30** (bằng pool; trước là 80).

### 1.5 Log và tín hiệu ngược

- `recommendation_impression`: một dòng **mỗi thẻ hiện** — ứng viên · tin · điểm · `v4` · rate version · surface · vị trí · `relaxed` · `pool_capped`. `JOB_ALERT` ghi **sau khi gửi** mail.
- Click thẻ → `clicked_at`; dismiss → loại vĩnh viễn như tin đã nộp đơn.
- Không còn (so với v3): ngưỡng 50/60, xoay trong dải 5 điểm, giáng hạng sau 3 lần hiện, 4 cấp tiêu đề, trọng số chỉnh ở admin, renormalise.
- **Cap công ty trong pool** có ở v3, v4 bỏ đi — và **Thu chốt 17/11 đưa lại**, ở mức 2, kèm luật cách nhau 6 vị trí (mục 1.4).

---

## 2. Engine B — Relevant jobs v3 (tin ↔ tin) — `GET /jobs/{id}/similar`

Không đọc hồ sơ người xem → một danh sách cho mọi người, **cache theo tin**.

**Luồng:** tin gốc phải OPEN/CLOSED · exposure · công ty public (không thì 404) → cache **1 giờ / tin**, tính **lazy** ở request đầu tiên sau khi cache hết hạn → một câu SQL đọc facts tin gốc + **mọi tin live** (**không cổng category**) → chấm trong bộ nhớ → khử trùng công ty + tiêu đề + tỉnh (mới nhất) và **bản trùng của chính tin gốc** → **tối đa 2 tin / công ty** → sắp **điểm ↓ → ngày đăng ↓ → id ↓** → giữ **20 id** → dựng thẻ, kiểm tra live lại. **Không** có giới hạn 500; nếu sau này cần: giới hạn theo `cùng category ∪ cùng tỉnh`, cắt **sau** khi chấm, không bao giờ theo ngày đăng.

| Tín hiệu | Max | Bậc |
|---|---|---|
| Taxonomy | **45** | Cùng role 45 · cùng group 32 · cùng category 18 — quan hệ **mạnh nhất** giữa mọi cặp role. ⚠ Group rỗng → thực tế 45 → 18 → 0 |
| Cấp bậc | **15** | Cùng bậc 15 · lệch 1 → 9 · lệch 2 → 4 · ≥3 → 0 |
| Địa điểm | **15** | Cùng tỉnh, hoặc một bên remote 15 · tỉnh lân cận 9 (Thu chốt 12/11 **bỏ**; Long đang gỡ) · khác 0 |
| Lương | **10** | Hai dải giao nhau 10 · lệch trong 20 % → 5 · không giao 0. Quy về **tháng** và quy đổi theo tỷ giá admin hai chiều (fix 12/11); không có tỷ giá → 0 |
| Kỹ năng | **8** | 8 × (chung ÷ số skill của **tin gốc**) |
| Ngành | **4** | Cùng ngành 4 · cùng nhóm cha 2 |
| Hình thức | **3** | Cùng job type 3 · remote ↔ hybrid 2 |

- Thiếu dữ liệu ở **bất kỳ phía nào = 0**, không chia lại.
- API trả `{ items, weak }` — **không trả điểm**. `weak = true` (điểm cao nhất < **40**) → FE đổi tiêu đề "Việc làm khác tại {tỉnh}", **vẫn đủ thẻ**.
- FE xin ~12 dòng: 6 cho carousel, 7–12 cho section thứ hai của **khách**. Người đã đăng nhập: FE **ẩn tin đã nộp đơn ở client** qua `/me/applied-job-ids` (cache không đổi). ⚠ Từ SRM-1551 (16/11) endpoint này **không tính đơn đã rút** → tin đã rút đơn **hiện lại** trên carousel và có thể nộp lại; ở engine A và email thì vẫn ẩn (mục 6.1).

---

## 3. Engine C — Recommended candidates (tin ↔ người, phía NTD)

| Bước | Luật |
|---|---|
| **Tin neo** | `jobId` được chọn; không có → mặc định: tin **OPEN** chưa quá hạn → **SCHEDULE** → **DRAFT**, tin sửa gần nhất trong tier |
| **Ai vào vòng chấm** | Ứng viên **muốn role hoặc category của tin**, HOẶC CV **có một skill của tin**; phải: cho phép tìm kiếm, CV **Qualified** có kinh nghiệm + học vấn, **chưa nằm trong talent pool** của công ty. Cap **500** trước khi chấm; người bị "bỏ qua" 3 lần rời tập trước khi cắt |
| **Chấm** | Cùng bảng v4 ở mục 1.3, đọc **chỉ dữ liệu tự khai** (profile + CV, **không hành vi**). Không khai role → suy từ **tiêu đề CV** (80 %); không khai tỉnh → **tỉnh cư trú** trên profile (fix 12/11) ⚠ Thu chốt 16/11 bỏ fallback tỉnh này (mục 8) |
| **Pool của ngày** | **Top 30** có điểm **≥ 40** (sàn 40) |
| **Hiển thị** | Draw **seeded theo công ty + ngày** chọn **3** người từ pool, **điểm cao nhất trước**; cùng người cả ngày, mai khác. Thẻ đầu trong mode MATCHED = **Top pick**. Tiêu đề section in tên tin |
| **Bấm thẻ** | Mở **trang CV che PI của Search talent** (fix 12/11, theo chốt của Thu "phải cho NTD bấm được"); **có trừ** lượt mở CV miễn phí như mọi lần mở CV (Thu chốt 16/11). NTD không có quyền tìm ứng viên → lượt bấm không được ghi |
| **Bị lờ đi** | Hiện **3 lần** mà không được mở → loại (giữ luật — Thu chốt 12/11) |
| **Không có ai đạt** | Mode **RECENT** "Hồ sơ mới cập nhật": CV mới nhất, **ngành của công ty** ưu tiên, **một người / category**, **không in %** |
| **Liên hệ** | Che như trang `/search` |

---

## 4. Engine D — Onboarding job count (bộ lọc, không điểm) — public

### 4.1 Điều kiện đếm — mọi điều kiện **giữ** tin không khai trường đó

| Tham số | Điều kiện trên tin |
|---|---|
| Luôn | OPEN · đã publish · exposure on · công ty public |
| `roleIds` → **category** của role | Tin có category trong tập, **hoặc tin không có category nào** (đếm ở mức category, nên role hẹp vẫn ra số ≥ 2) |
| `industryIds` | Ngành trong tập, hoặc tin **không có ngành** (tin tự đăng không có ô ngành → luôn qua) |
| `contractTypeIds` (nhiều giá trị) | Trong tập, hoặc tin không khai |
| `regionIds` → mã tỉnh | Tin **remote**, hoặc tỉnh của tin / company location trong tập, hoặc tin **không có địa điểm** |
| `years` | Tin khai dải năm → `min ≤ years`; không khai dải nhưng khai **cấp bậc** → giữ tin có bậc **≤ bậc của người + 1**; không khai gì → giữ |
| Học vấn | **Không** là điều kiện |

### 4.2 Trả về và banner

- `total` cap **500** → FE in **"500+"**. Có chọn tỉnh và `total < 5` → đếm thêm **không điều kiện tỉnh** → `nationwide`.
- **Bước 3** in N₃ (đếm trên bước 1 + 2); **bước 4** in N₄ (bước 1 + 2 + 3) — **N₄ = N₃ → không in số**; `total = 0` → không in 0 (chỉ câu "toàn quốc có X" nếu có); tỉnh mỏng → câu nói rõ "… toàn quốc"; lỗi API → câu không có số. Các bước khác không có số.

### 4.3 Bảng năm → bậc (trên `job_level.sort_order` 1–9) — dùng chung cho engine A, C và D

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

Lệch 1 bậc = "với tới được"; lệch ≥2 = không hợp.

### 4.4 Con số KHÔNG cần khớp trang tìm việc (Thu chốt 12/11, bỏ test #13)

| | Banner onboarding | Trang tìm việc |
|---|---|---|
| Tin để trống loại hợp đồng | Giữ lại | Loại |
| Lọc ngành theo | Ngành của tin | Ngành của công ty |
| Tin remote | Luôn được tính, ở mọi tỉnh | Không có luật này |
| Kinh nghiệm | Quy năm ra cấp bậc | Không quy đổi |

QA kiểm con số bằng dữ liệu trực tiếp, không bằng trang tìm việc.

---

## 5. Engine E — Việc làm giống tin vừa nộp (email JS 4 / JS 5) — `JobsLikeAppliedService`

Khối "việc làm gợi ý" dưới dòng "Bạn đã ứng tuyển thành công" (SRM-1433, khách xác nhận 09–10/11). Chạy trên **Elasticsearch**, **không đọc hồ sơ**, không ghi impression — khác hẳn engine A.

| Bước | Luật |
|---|---|
| **Khi nào có khối** | Ứng viên chưa tắt "Nhận email thông báo từ hệ thống" (mặc định bật). Tắt → không có khối. Môi trường không có Elasticsearch → không có khối (không có bản Postgres thay thế) |
| **Tin gốc** | JS 4: tin vừa nộp. JS 5 (apply all): tin **chọn cuối** trong lượt |
| **Ai vào vòng chấm** | Tin live, exposure on; **chung ≥1 skill VÀ ≥1 tỉnh** với tin gốc; trừ tin gốc và cả lượt apply-all. `_score` của ES = **3 / skill chung + 2 / tỉnh chung + 2 nếu dải lương giao nhau**. Lấy **50** tin tốt nhất theo `_score` |
| **Điểm xếp hạng** | **0.5 × Relevance + 0.25 × Fairness + 0.15 × Package + 0.1 × Freshness** |
| Relevance | min(`_score` ÷ 15, 1) |
| Fairness | 1 ÷ (1 + log₂(1 + số tin đang mở của công ty)) — công ty lớn không chiếm hết danh sách |
| Package | hạng gói ÷ 5: Distinction / Top job / Hero **5** · Basic plus **4** · Basic **3** · còn lại (free) **2** |
| Freshness | e^(−0.00015 × số ngày từ lúc đăng) — gần như phẳng, chỉ phá hoà |
| Hoà | Ngày đăng mới nhất → id nhỏ nhất |
| **Sau khi xếp** | Bỏ mọi tin ứng viên **đã từng nộp (mọi trạng thái, kể cả rút — SRM-1551)** và tin đã đóng / hết exposure (qua `picked`); giữ **4** đầu. 1–3 tin → in đúng số; 0 → **ẩn khối**, phần xác nhận vẫn gửi |
| Không có | Fallback bù tin (khách chưa xác nhận — không dùng); blacklist công ty (ticket đã bỏ); JS 5 thêm khối "Hiển thị CV với nhà tuyển dụng" nếu ứng viên chưa có CV nào đang hiển thị |

---

## 6. Luật dùng chung cho cả năm engine

1. **"Đã ứng tuyển"** = có **bất kỳ** dòng `job_application` cho (ứng viên, tin), mọi trạng thái **kể cả đã rút** → tin biến mất khỏi engine A (mọi surface, kể cả Batch apply) và khỏi email JS 3 / JS 4 / JS 5. Ngoại lệ sau SRM-1551 (16/11): rút đơn là cuối và **giải phóng tin** — `/me/applied-job-ids` không tính đơn đã rút, nên tin đó **hiện lại trên carousel Similar jobs** và nộp lại được (đơn mới, snapshot mới); đơn recalled / rejected vẫn khoá.
2. **Tin dismiss** → như tin đã nộp đơn.
3. **Thiếu dữ liệu = 0 điểm, không chia lại**, ở A, B và C. Ngoại lệ duy nhất là **cách in %** trên board NTD (dưới 4/7 tín hiệu → không in).
4. **Trọng số nằm trong code, có version** (`v4` người ↔ tin, `v3` tin ↔ tin; công thức email E không có version). Admin không chỉnh được.
5. **Tỷ giá USD/VND** do admin nhập là thứ duy nhất chỉnh được; dùng hai chiều; thiếu → tín hiệu lương = 0 ở A, B, C.
6. **Ứng viên không bao giờ thấy %**; NTD thấy % trên board và không thấy trên "Hồ sơ mới cập nhật".
7. **Năm → bậc** một bảng (mục 4.3).
8. **Hai tin cùng công ty cách nhau ≥ 6 vị trí** và **tối đa 3 tin / công ty** ở Onboarding · Job detail · My dashboard; **Batch apply** chỉ có luật "không liền nhau", không cap (Thu chốt 17/11, chưa code). Similar jobs đã có luật tương đương từ đầu: **2 tin / công ty** trong 20 tin giữ lại.
9. Thang occupation **Role › Group › Category** viết sẵn 3 tầng ở cả A, B, C; Group **chưa có dữ liệu** cho tới SRM-1315.
10. **Một công tắc email** "Nhận email thông báo từ hệ thống" (mặc định bật) chi phối JS 3 và khối gợi ý JS 4 / JS 5; topic `JOB_ALERT` cũ không còn ai đọc.

---

## 7. Build khác requirement / tài liệu ở đâu (để biết, không phải bug)

| # | Chỗ | Build đang làm | Requirement / tài liệu nói | Chốt · việc còn lại |
|---|---|---|---|---|
| 1 | Onboarding section 1 | **Đúng thứ tự điểm** | Trang NEW logic §12 / §12a: "xáo trộn" | Thu chốt 12/11 theo build → **sửa spec** (mục 0, 1, 2, 8, 12, 12a) |
| 2 | Địa điểm, người không khai tỉnh | Tin remote **0 điểm** | §7: "tin REMOTE → 20, từ mọi nơi" | Thu chốt 12/11 đề xuất A → **sửa spec** |
| 3 | Bậc "cùng group" (30 / 32 điểm) | Không bao giờ đạt | Cả hai trang có bậc này | Chờ taxonomy SRM-1315 |
| 4 | Bậc "tỉnh lân cận" (10 / 9 điểm) | Còn trong code, không bao giờ đạt | Cả hai trang có bậc này | Thu chốt 12/11 **bỏ hẳn** → Long gỡ code (mục 8), **sửa spec** hai trang |
| 5 | Fallback "only if empty" | Đọc tiêu đề CV; **tỉnh cư trú** (12/11); không đọc chức danh / ngành công ty trên CV | §7 liệt kê cả ba | Thu chốt 16/11: ngành = "Ngành mong muốn" (không làm thêm); tỉnh **chỉ** từ Work preference → Long gỡ fallback (mục 8); **sửa spec** |
| 6 | Board NTD — kỹ năng CV không resolve | Tính là "không có skill" | §9 ②: tính là "chưa biết" | D-REC-51, chưa chốt |
| 7 | Strip gợi ý trên trang search | BE có, FE không gọi | Ngoài phạm vi SRM-1338 | Không có strip |
| 8 | Trang chủ | Không có khối gợi ý cá nhân | Guide `/danh-sach-rule`: "block Recommended ở trang chủ là placement" | Guide cũ; placement đã bỏ |
| 9 | Guide `/danh-sach-rule` — mục "Matching & gợi ý" | — | "logic chưa có" (ghi 04/11) | Đã có từ 05/11 — thay bằng tài liệu này |
| 10 | Engine C — ai vào vòng chấm | Ba nhánh: role · category · **skill trên CV** | ~~Chỉ role / category~~ — **SAI, đã kiểm lại 16/11**: trang Recommended candidates §2b liệt kê đủ cả ba nhánh, skill nằm trong đó | **Không phải lệch.** Build khớp spec. Dòng này trước đây ghi sai |
| 11 | Pool engine A | `JobFeed.POOL = 80` trên dev | ~~Spec và ticket: 80~~ | **Thu chốt 50 (16/11)** rồi **30 (17/11)**. Spec và ticket SRM-1338 đã về **30**; code chưa → **làm code** |
| 12 | Số tin ở wizard (engine D) | Lọc khác trang tìm việc (mục 4.4) | 1347 test #13: phải khớp trang tìm việc | Thu chốt 12/11 bỏ test #13 → **sửa spec** |
| 13 | Similar jobs — độ tươi | Cache 1 giờ, làm mới ≤ ~75 phút | Trang Relevant jobs: "tính lại khi tin thay đổi" | Thu chấp nhận 12/11 → **sửa spec** |
| 14 | Xáo trộn HOMEPAGE / JOB_DETAIL | Xáo **trong từng bậc role** (SRM-1491) | Spec: xáo trộn seed trên cả pool | Bug QA 12/11, merge 16/11 → **thêm vào spec** (mục pool / surfaces) |
| 15 | Email JS 4 / JS 5 | Engine E riêng (mục 5) | Trang NEW logic không nhắc email sau khi nộp đơn | SRM-1433 — **thêm vào spec** như một nơi dùng matching |
| 16 | Email JS 3 — ai nhận | Mọi ứng viên ACTIVE chưa tắt công tắc (mặc định bật) | Spec: opt-in topic Job alert, mặc định tắt | SRM-1433 (10/11) → **sửa spec** |
| 17 | Rút đơn | Giải phóng tin; carousel Similar jobs hiện lại tin đã rút | Spec: "có dòng đơn là ẩn" ở cả 1338 lẫn 1331 | SRM-1551 (16/11, chốt của BA) → **sửa spec** 1331 |
| 18 | Cap / giãn công ty engine A | **Không có cap**; chỉ "một công ty một hàng", và hàng vẫn lấp lặp khi hết công ty | Spec cũ: "NO PER-COMPANY SCORING RULE" | **Thu chốt 17/11**: pool **30**, **cap 3 tin/công ty** + **cách nhau ≥ 6 vị trí** ở 3 surface xáo trộn; Batch apply **không cap**, chỉ "không liền nhau" (nhìn xuống tối đa 3 dòng). Spec + ticket đã sửa → **làm code** |
| 19 | Onboarding section 2 — "Jobs for {role}" | Đọc **role + phần còn lại của category**, ghép role trước; vẽ khối ngay khi còn **≥1** tin | §12a (sửa 17/11): **chỉ tin đúng role**, và **dưới 3 tin thì ẩn cả khối** | **Thu chốt 17/11.** Lý do: prod 17/11 in tiêu đề "Việc làm cho Hành chính marketing" trên đúng **một** thẻ, và thẻ đó là *Platform Operations Specialist*. Taxonomy 2 tầng, 1 category ~50 vị trí → "nới sang category" là nới cả ngành. Spec đã sửa → **SRM-1596** (tách khỏi SRM-1338) |

---

## 8. Long báo đã sửa ngày 16/11 (10:49) — CHƯA lên `dev` khi kiểm tra tối 16/11

Theo comment của Long trên SRM-1330; code trên `origin/dev` và các nhánh đã push chưa có. Khi lên dev, các mục 1.1 / 1.3 / 1.4 / 2 / 3 ở trên đổi theo:

1. **Bỏ fallback tỉnh cư trú**: địa điểm chỉ lấy từ Work preference ("Địa điểm mong muốn", tối đa 3 tỉnh); không khai → tín hiệu địa điểm 0 ở Recommended jobs, Recommended candidates và board NTD (vài ứng viên trên board sẽ lại không hiện % như trước 12/11).
2. **Bỏ bậc tỉnh lân cận** ở cả Recommended jobs (10) và Similar jobs (9): khác tỉnh = 0. Thứ hạng không đổi vì bậc này chưa bao giờ đạt.
3. **Pool 80 → 50 → 30** cho engine A — Thu chốt 50 chiều 16/11 (80 hơi rộng, lẫn nhiều job không liên quan), rồi **chốt 30 ngày 17/11**. Long mới sửa tới 50 và chưa lên dev.
4. **Company Home**: bấm thẻ CÓ trừ lượt mở CV miễn phí; hết lượt → thấy CV che hết chi tiết; thẻ vẫn luôn hiện. (Trùng với cách dev đang chạy — thẻ mở đúng trang CV của Search talent.)
5. **Pool 50 → 30**, **cap 3 tin / công ty** và **cách nhau ≥ 6 vị trí** (Onboarding · Job detail · My dashboard), **Batch apply không cap nhưng không liền nhau** — **Thu chốt 17/11**. Chưa có trong code; spec và ticket SRM-1338 đã sửa, ticket chuyển **Recheck**.
