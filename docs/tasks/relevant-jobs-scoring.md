# [Feature][BE][Jobseeker] Relevant jobs — chấm điểm mọi tin, bỏ gate category

**Requirement (nguồn sự thật):**
https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job

**Ticket:** SRM-1331 · **Parent:** SRM-1330 (đọc bảng đối chiếu ở parent trước)

**Màn hình ảnh hưởng:** Job detail — section "Các công việc tương tự"; với người **chưa đăng nhập**, section thứ hai của trang cũng lấy từ danh sách này (dòng 7–12). **Popup sau khi nộp đơn KHÔNG thuộc task này** — nó lấy Recommended jobs (SRM-1338), chốt 2026-11-03.

> **Audit 2026-11-03:** ba chỗ đổi so với bản sáng nay — T2 (bỏ chia lại điểm), T5 (ẩn mọi tin đã có đơn, không chỉ đơn live), T6 (popup không còn ở đây). Lý do ở từng mục.

---

## Bối cảnh

Build hiện tại lọc cứng theo **cùng category** rồi mới chấm điểm (`JobSimilarity` + `SIMILAR_SCORED_CTE`). Hệ quả: một tin không có tin nào cùng category thì **section trống hoàn toàn**. Đây là kết quả duy nhất mà tính năng này không được phép tạo ra.

Thay đổi: **bỏ gate, chấm điểm mọi tin đang mở**, lấy 6 tin cao điểm nhất. Phần dự phòng tự sinh ra — tin không có gì cùng ngành vẫn được chấm trên địa điểm, cấp bậc, lương, hình thức làm việc.

---

## T1 · Bảng trọng số mới

> Requirement: [mục 1](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#1-every-job-is-scored-there-is-no-category-gate)

| Tín hiệu | Điểm | Đủ điểm khi | Một phần |
|---|---|---|---|
| Taxonomy | **45** | Cùng Role | Cùng **Group** → 32 · Cùng **Category** → 18 · Khác category → 0 |
| Job level | **15** | Cùng bậc | Lệch 1 → 9 · Lệch 2 → 4 · Lệch ≥3 → 0 |
| Location | **15** | Cùng tỉnh, hoặc một trong hai là remote | Tỉnh lân cận cùng vùng → 9 · Khác vùng → 0 |
| Salary | **10** | Hai khoảng giao nhau | Lệch trong 20% → 5 · Không giao → 0 |
| Skills | **8** | Tin kia có đủ mọi skill của tin gốc | Theo tỉ lệ trên số skill của **tin gốc**: 3/5 → 4.8 |
| Industry | **4** | Cùng ngành | Cùng nhóm ngành → 2 |
| Work type | **3** | Cùng job type | Tương thích (remote ↔ hybrid) → 2 |

**Checklist**
- [ ] Bỏ `qualified` CTE (gate category). Mọi tin OPEN / exposure on / chưa hết hạn / công ty active đều vào vòng chấm
- [ ] `RelevantJobsWeights` đổi thành 7 trường, tổng = 100, giữ invariant kiểm tra tổng
- [ ] Taxonomy: tin nhiều role lấy **quan hệ mạnh nhất** giữa mọi cặp role, KHÔNG chia tỉ lệ
- [ ] Skills: tỉ lệ trên số skill của **tin gốc** (mẫu số là anchor, không phải union)
- [ ] Salary khác tiền tệ: quy đổi bằng tỷ giá master data trước khi so. Không bao giờ so số thô
- [ ] `JobSimilarity.java` (pure function) và SQL vẫn phải khớp nhau — giữ integration test so từng dòng
- [ ] Trọng số vẫn chỉ tồn tại ở MỘT chỗ, SQL interpolate từ đó

> ⚠️ **Tầng Group chưa có trong DB.** `job_role` hiện chỉ có `job_category_id`. Cho tới khi taxonomy mới (SRM-1315) được import, **Group tính như Category** — tức mức 32 tạm thời không dùng được. Code phải viết sẵn cho 3 tầng, không hard-code 2 tầng.

---

## T2 · Quy tắc thiếu dữ liệu — MỘT luật, giống hai tính năng kia

> Requirement: [mục 1a](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#1a-missing-data-who-gets-penalised-and-who-does-not)

| Trường hợp | Xử lý |
|---|---|
| **Tin gốc** không khai | Mọi tin kia ăn **0** điểm mục đó. Tổng vẫn trên thang 100, **không chia lại** |
| Tin gốc có khai, **tin kia** không khai | Tin kia ăn **0** điểm mục đó, không chia lại |
| Cả hai không khai | **0**, như dòng 1 |

**Đổi so với bản sáng 2026-11-03:** bản trước chia lại điểm khi tin gốc không khai. Bỏ — vì nó **không đổi thứ tự** (mọi tin kia mất cùng số điểm), chỉ đổi mỗi ngưỡng đổi tiêu đề, và là chỗ duy nhất ba tính năng matching nói khác nhau về thiếu dữ liệu. Giữ đúng luật `JobSimilarity` đang có: *"A missing signal scores ZERO here, and is NOT renormalised"* — javadoc **không cần sửa**.

**Checklist**
- [ ] Không có nhánh renormalise nào trong `JobSimilarity` lẫn SQL
- [ ] Test: tin gốc không khai lương → mọi tin tối đa 90, thứ tự không đổi so với khi có lương
- [ ] Test: tin gốc khai bậc, tin kia không khai → tin kia mất đúng 15, các mục khác giữ nguyên
- [ ] Hệ quả chấp nhận: tin gốc khai ít thì điểm cao nhất thấp hơn, section hay mang tiêu đề "Việc làm khác tại {tỉnh}" hơn (T4) — đúng sự thật, không vá

---

## T3 · Lọc, sắp xếp, hiển thị

> Requirement: [mục 1b](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#1b-filtering-ordering-and-what-the-reader-finally-sees)

**Checklist**
- [ ] Loại: tin đang xem · tin đóng/hết hạn · exposure off · công ty không active
- [ ] API trả **~12 dòng** (xem T5); FE của job detail dùng dòng 7–12 cho section thứ hai khi người đọc chưa đăng nhập (SRM-1338 T6) — không cần endpoint riêng
- [ ] Tối đa **2 tin mỗi công ty**, giữ 2 tin điểm cao nhất (giữ nguyên `PER_COMPANY_CAP`)
- [ ] Sắp xếp: **điểm ↓ → ngày đăng ↓ → id ↓**
- [ ] Trả về **6 thẻ**. **Bỏ ngưỡng `role_score + level_score > 0`** — không còn ngưỡng tối thiểu nào
- [ ] API trả thêm 1 cờ cho FE biết điểm cao nhất có < 40 hay không (để đổi tiêu đề — xem T4). Điểm số **vẫn không được trả ra ngoài**
- [ ] Cache theo từng tin, hết hạn sau 1 giờ hoặc khi tin thay đổi. **Tính LAZY**: dựng list ở request đầu tiên sau khi cache hết hạn, KHÔNG chạy theo lịch cho mọi tin đang mở (tin không ai mở thì không tốn gì)
- [ ] **Không copy giới hạn 500 tin của Recommended jobs** — bên đó là ngân sách cho một request của một người; list này tính một lần cho mỗi tin rồi dùng chung cho mọi người xem
- [ ] **Không bao giờ cắt pool theo ngày đăng** (bỏ ý "2.000 tin mới nhất" — quyết định 2026-11-04). Nếu sau này thật sự cần giới hạn: chỉ chấm `cùng category ∪ cùng tỉnh` với tin đang xem (hợp hai điều kiện rộng, không phải cổng), và **cắt SAU khi chấm**, không cắt trước

---

## T4 · FE — đổi tiêu đề khi không có gì thật sự liên quan

> Requirement: [mục 1b](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#1b-filtering-ordering-and-what-the-reader-finally-sees)

**Checklist**
- [ ] Điểm cao nhất ≥ 40 → tiêu đề "Việc làm tương tự" (như hiện tại)
- [ ] Điểm cao nhất < 40 → "Việc làm khác tại {tỉnh/thành của tin đang xem}"
- [ ] **Vẫn hiện đủ 6 thẻ trong cả hai trường hợp.** Không ẩn section, không hiện ít thẻ hơn
- [ ] Không hiển thị điểm số ở bất kỳ đâu

---

## T5 · FE — ẩn việc người dùng đang ứng tuyển

> Requirement: [mục 1c](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#1c-a-signed-in-reader-does-not-see-jobs-they-are-already-applying-to)

**Checklist**
- [ ] Làm ở **client**, sau khi trang cached đã load. KHÔNG lọc ở server (sẽ mất cache)
- [ ] Ẩn **mọi tin đã có đơn — bất kỳ trạng thái** (đã rút / bị từ chối / đã tuyển vẫn ẩn). Một EXISTS, không bảng trạng thái — cùng định nghĩa với [Recommended jobs mục 4](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#4-a-job-they-applied-to-never-comes-back). (Đổi 2026-11-03: bản trước chỉ ẩn đơn live, là trang duy nhất nói khác)
- [ ] Xin **~12 dòng** từ API cho một hàng 6 thẻ, để bù phần bị trừ
- [ ] Chỉ bỏ bớt dòng, **không đổi thứ tự** các dòng còn lại
- [ ] Vẽ hàng thẻ **sau khi** đã có câu trả lời về đơn của người dùng — không được hiện 6 thẻ rồi xoá 2

---

## T6 · Popup sau khi nộp đơn — KHÔNG còn ở task này

> Requirement: [mục 4](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#4-the-after-apply-popup-what-each-card-shows) (nay chỉ là con trỏ)

Chốt 2026-11-03: popup "Job application complete!" lấy **Recommended jobs** (feed cá nhân, xếp theo điểm, không neo vào tin vừa nộp) — SRM-1338 T7. Hai tính năng cùng nuôi một popup là hai danh sách phải giải thích. Phần reason chips viết ở đây sáng nay **bỏ**; chip của popup là `reasons` của feed.

**Checklist**
- [ ] Không gọi `GET /jobs/{id}/similar` từ popup

---

## Bảng kiểm thử

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | Mở tin có nhiều tin cùng role | 6 thẻ, tin cùng role lên đầu, tiêu đề "Việc làm tương tự" |
| 2 | Mở tin **không có tin nào cùng category** | **Vẫn đủ 6 thẻ**, tiêu đề "Việc làm khác tại {tỉnh}" |
| 3 | Tin gốc không khai lương | Mọi tin tối đa 90, thứ tự y như khi có lương |
| 4 | Tin gốc khai bậc, tin kia không khai | Tin kia mất đúng 15 điểm, các mục khác không đổi |
| 5 | Tin gốc USD, tin kia VND, khoảng thực tế giao nhau | Ăn đủ 10 điểm (đã quy đổi) |
| 6 | 1 công ty có 5 tin điểm cao | Chỉ hiện 2 tin của công ty đó |
| 7 | Ví dụ ở [mục 2](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#2-worked-example-the-full-arithmetic) | Thứ tự đúng: Tiki 97 · Shopee 81 · VNG 80 · Base.vn 69 · MoMo 67 · Kế toán 37 |
| 8 | Người đã đăng nhập, đã có đơn ở 3 tin trong danh sách (kể cả 1 đơn đã rút) | 3 dòng đó biến mất, 6 thẻ vẫn đủ, thứ tự không đổi |
| 9 | Người chưa đăng nhập | Thấy danh sách đầy đủ, giống hệt mọi người khác |
| 10 | Mở lại cùng 1 tin nhiều lần trong 1 giờ | Cùng kết quả, không tính lại |
| 11 | Chưa đăng nhập, cuộn xuống section thứ hai của job detail | Dòng 7–12 của chính danh sách này, tiêu đề "Có thể bạn quan tâm", không trùng 6 thẻ trên |

---

## Không làm trong task này

- Không đưa skills lên trọng số cao hơn 8 — [mục 3](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job#3-phase-2-the-two-things-to-change-once-there-is-data) là Phase 2, chờ master data skill mới
- Không hiển thị điểm số cho người dùng, không trả điểm ra API
- Không tách section "Việc làm khác tại {công ty}" (nice-to-have, không thuộc thuật toán)
- Không đụng tới **Recommended jobs** (jobseeker ↔ job) — khác thuật toán, khác màn hình
- Không làm popup sau khi nộp đơn — **SRM-1338 T7**
- Không import taxonomy mới (SRM-1315 lo phần đó)
