# [JS] Matching logic — bản đồ 4 sub-task

**Requirement (nguồn sự thật):** https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic — bảng đối chiếu 4 tính năng và các luật dùng chung nằm ngay dưới đây.

**Đã audit 2026-11-03.** Bốn trang requirement và bốn sub-task từng nói khác nhau ở 6 chỗ; tất cả đã được sửa cùng ngày để dùng **một bộ luật chung**. Dev đọc bảng này trước, rồi mới mở sub-task của mình.

---

## Bốn tính năng, bốn câu hỏi

| Sub-task | Tính năng | Trả lời câu hỏi | Cần đăng nhập | Trang requirement |
|---|---|---|---|---|
| SRM-1338 | **Recommended jobs** | Tin nào hợp với **người này** — profile + CV + hành vi | Ứng viên | [Recommended jobs (NEW logic)](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic) |
| SRM-1331 | **Similar / Relevant jobs** | Tin nào giống **tin này** — job ↔ job, không đọc profile | Không | [Relevant jobs](https://saramin-eta.vercel.app/m/job-management/relevant-jobs-matched-to-another-job) |
| SRM-1345 | **Recommended candidates** | Người nào hợp với **tin này** — cùng công thức với 1338, đọc từ phía NTD | NTD | [Recommended candidates](https://saramin-eta.vercel.app/m/job-management/recommended-candidates-matched-to-an-employer-s-job) |
| SRM-1347 | **Onboarding job count** | Có **bao nhiêu** tin khớp bộ câu trả lời — đếm theo bộ lọc, không chấm điểm | Không | [mục 12b–12e](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#12b-onboarding-the-two-numbers-in-the-wizard-steps-3-and-4) |

## Luật dùng chung — làm MỘT lần

| Luật | Giá trị | Áp cho |
|---|---|---|
| **Một bảng trọng số** người ↔ tin | Vị trí & role 42 · Địa điểm 20 · Kinh nghiệm 14 · Lương 12 · Ngành 5 · Kỹ năng 4 · Học vấn 3 (mục 7) | 1338 và 1345. Phía NTD chỉ đọc dữ liệu ứng viên **tự khai**, không đọc hành vi |
| Bảng trọng số tin ↔ tin | Taxonomy 45 · Level 15 · Location 15 · Salary 10 · Skills 8 · Industry 4 · Work type 3 | 1331 — khác bảng vì so hai tin, nhưng cùng thang Category › Group › Role |
| **"Đã ứng tuyển"** | Có **bất kỳ** dòng `job_application` cho (ứng viên, tin) — mọi trạng thái. Một EXISTS, không bảng trạng thái | 1338 feed · 1331 cho người đăng nhập · Batch apply · switch "ẩn việc đã ứng tuyển" |
| **Thiếu dữ liệu** | Tín hiệu không so được = **0 điểm**, tổng vẫn trên 100, **không chia lại** (mục 9) | Cả ba tính năng chấm điểm. Chỉ cách **in %** trên board ứng tuyển của NTD có ngoại lệ, không đổi thứ hạng |
| **Năm → bậc** | Bảng ở mục 12d, trên thang `job_level.sort_order` 1–9 | 1347 (lọc), 1338 và 1345 (tín hiệu kinh nghiệm khi tin chỉ khai cấp bậc) |
| **Thang taxonomy** | Cùng Role › cùng Group › cùng Category › khác. Group tính như Category cho tới khi SRM-1315 import taxonomy mới | Cả ba |
| **Ai nuôi màn hình nào** | Job detail: Relevant jobs lấy **trước**, Recommended jobs lấy phần còn lại. Popup sau khi nộp đơn: **Recommended jobs** (không phải Relevant). Onboarding results: Recommended jobs + một hàng search theo vị trí. Company Home: Recommended candidates | Không màn hình nào được hai tính năng cùng nuôi |
| Ngưỡng điểm | 1338: **không có** (pool 80 tin tốt nhất, tiêu đề cố định). 1345: **sàn 40** vì 3 thẻ nằm dưới tiêu đề tên tin kèm badge. 1331: không ngưỡng, đổi tiêu đề khi điểm cao nhất < 40 | Khác nhau có chủ ý, đã ghi lý do trên từng trang |

## Những chỗ đã sửa ngày 2026-11-03 (để ai đọc bản cũ không bị lệch)

1. **1345 dùng bảng trọng số của build (22/21/20/20/9/5/3)** trong khi tự nhận "cùng công thức" với 1338 (42/20/14/12/5/4/3) → thống nhất về bảng của 1338.
2. **"Đã ứng tuyển"**: 1338 nói ẩn vĩnh viễn, 1331 nói chỉ ẩn đơn live → thống nhất: có dòng đơn là ẩn.
3. **Thiếu dữ liệu**: 1331 chia lại điểm khi tin gốc không khai → bỏ, cùng luật 0-không-chia-lại với hai trang kia (thứ tự không đổi, build hiện tại cũng đang làm vậy).
4. **Popup sau khi nộp đơn** được cả 1331 lẫn 1338 nhận → là của 1338 (feed cá nhân, xếp theo điểm, không neo vào tin vừa nộp). 1331 bỏ phần T6 chip.
5. **Mục 13–15 của trang 1338** là text cũ (sàn 50, in %, trọng số cũ, tín hiệu ngoại ngữ) → viết lại theo trang mới.
6. **Trang Onboarding** còn mô tả wizard 3 bước → thêm khối REVISED: 5 bước như build, số tin ở bước 3 và 4.
7. **Job detail cho người chưa đăng nhập**: section "Recommended jobs" lấy dòng 7–12 của Relevant jobs (quyết định của Thu), tiêu đề "Có thể bạn quan tâm".
8. **Onboarding results section 2** ("Jobs for {role}") chưa có requirement → mục 12a.
9. **Bảng năm → bậc** của 1347 ở trạng thái "đề xuất" → chốt trên thang 9 bậc thật của `job_level`.

## Thứ tự nên làm

1. **SRM-1338** trước — nó định nghĩa bảng trọng số, luật thiếu dữ liệu, luật "đã ứng tuyển" mà 1345 dùng lại, và nuôi popup Batch apply.
2. **SRM-1331** song song được — khác engine, khác màn hình; chỉ chạm 1338 ở luật "đã ứng tuyển" và dedup trên job detail.
3. **SRM-1347** song song được — endpoint public, không chạm engine.
4. **SRM-1345** sau 1338 — dùng `ApplicantMatch` đã đổi trọng số.
