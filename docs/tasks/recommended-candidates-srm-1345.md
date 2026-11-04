# Recommended candidates — logic chọn ứng viên (SRM-1345)

*Chỉ là logic chọn ứng viên. Nội dung thẻ theo Figma, ticket này không đụng tới.* Bản đầy đủ: [Recommended candidates — spec](https://saramin-eta.vercel.app/m/job-management/recommended-candidates-matched-to-an-employer-s-job)

> **Cập nhật 2026-11-03 (audit SRM-1330):** bảng trọng số ở Bước 3 trước đây là bảng v3 của build (22/21/20/20/9/5/3). Nay dùng **đúng bảng của Recommended jobs** (42/20/14/12/5/4/3) — cùng một `ApplicantMatch`, đọc từ phía NTD. **Làm sau SRM-1338.**

### Bước 1 — Chọn tin để neo vào

Không neo vào thư mục Talent pool: bảng `talent_pool` chỉ có id / company_id / name / kind / created_by / created_at / updated_at — không có gì để khớp. Thư mục là nơi lưu kết quả, không phải đề bài.

| Ưu tiên | Status | Lý do |
|---|---|---|
| **1** | `OPEN` — và chưa quá hạn | Đang tuyển thật |
| **2** | `SCHEDULE` | Đã chốt, chờ tới ngày |
| **3** | `DRAFT` | Có thể không bao giờ đăng, nhưng hơn không có gì |
| — | `CLOSED` | **Không bao giờ neo vào** |
| — | `REVIEW` | Giá trị chết (không gì tạo ra nó từ V468). Dòng cũ xếp chung bậc `DRAFT` |
| — | Không có tin nào | Nhảy thẳng xuống bước 5 |

- **Trong cùng một bậc lấy tin SỬA gần nhất**, không phải tin tạo gần nhất.
- Tin `OPEN` đã quá hạn → coi như CLOSED, rớt khỏi bậc 1.
- Cờ `exposure` không liên quan — màn hình nội bộ của công ty. Tin tắt exposure vẫn neo bình thường.
- **Một logic duy nhất cho mọi status.** Không có cổng "draft đủ thông tin chưa", không nhánh riêng cho draft.
- Tiêu đề section in tên tin; dropdown cho đổi sang tin khác của công ty.

### Bước 2 — Lọc ra ai được tính là ứng viên của tin này

```
WHERE ( desired_role      ∩ role của tin      ≠ ∅
     OR desired_category_id = category của tin
     OR kỹ năng trong CV    ∩ kỹ năng của tin  ≠ ∅ )
LIMIT 500
```

- Đây là định nghĩa "có phải ứng viên của tin này không". Bỏ bước này thì một người cùng thành phố, đúng số năm, đúng lương, ngành hoàn toàn khác vẫn được 20 + 14 + 12 = **46** điểm → vượt sàn 40. Sàn không chặn được, chỉ bước này chặn được.
- Là **OR** chứ không phải AND — gợi ý, không phải tìm kiếm.
- Tin nháp không role, không category, không kỹ năng → rỗng → nhảy xuống bước 5. Không cần luật riêng.

### Bước 3 — Chấm điểm: CÙNG bảng với Recommended jobs, thang 100, tin không khai = 0

> Requirement: [mục 3](https://saramin-eta.vercel.app/m/job-management/recommended-candidates-matched-to-an-employer-s-job#3-information-the-job-does-not-state-is-worth-0-it-is-not-thrown-away) · thang điểm chi tiết ở [Recommended jobs mục 7](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#7-how-the-score-is-calculated) — **không chép lại, một bảng một chỗ**

| Tín hiệu | Điểm | Lấy từ tin | So với ứng viên — chỉ dữ liệu **tự khai** | Tin nháp chỉ có địa điểm |
|---|---|---|---|---|
| Vị trí & role | 42 | `job_role_link` + category | desired role (≤3) + desired category; cả hai trống → job title gần nhất trên CV (suy ra → 34). **Không đọc hành vi** | 0 |
| Địa điểm & hình thức | 20 | tỉnh + job type | desired location + work type; trống → tỉnh trên Profile (suy ra → 16) | **20** |
| Kinh nghiệm | 14 | dải năm, không có thì cấp bậc (bảng năm → bậc 12d) | years_of_experience; trống → tính từ CV | 0 |
| Lương | 12 | salary_min/max + currency | desired_salary + currency — quy đổi theo tỷ giá admin trước | 0 |
| Ngành | 5 | `company.industry_id` | desired industry; trống → ngành các công ty trên CV (→ 4) | 0 |
| Kỹ năng | 4 | kỹ năng của tin | kỹ năng trong CV | 0 |
| Học vấn | 3 | yêu cầu học vấn | học vấn trong CV | 0 |
| **Tổng** | **100** | | | **20** |

- **Bỏ renormalise** của `ApplicantMatch` hiện tại. Tín hiệu tin không khai = 0, luôn trên thang 100. Tin chỉ có địa điểm → trần 20/100 — không cần gate, con số tự nói thật.
- Thang từng tín hiệu (cùng role 42 / cùng group 30 / cùng category 17; trong dải năm 14, lệch 1 bậc 7; …) **đúng như Recommended jobs mục 7**. Giá trị suy ra ăn 80%.
- **Chỉ dữ liệu tự khai + CV.** Không dùng tập role/tỉnh mở rộng từ hành vi của ứng viên — đó là dữ liệu cá nhân, không được join sang phía NTD.
- Khác tiền tệ → quy đổi bằng `exchange_rate` admin nhập; không có tỷ giá → lương 0 điểm.

### Bước 4 — Loại bỏ

```
CV không bật cho phép NTD tìm kiếm
CV chưa Qualified
CV thiếu kinh nghiệm làm việc hoặc học vấn
đã nằm trong pool nào của công ty này
đã hiện cho công ty này 3 lần mà không ai bấm
```

- **Không yêu cầu CV phải có kỹ năng** (chốt 2026-11-03): chỉ 26% job role có kỹ năng được biên soạn. Ứng viên không khai kỹ năng vẫn vào được qua desired_role / desired_category ở bước 2.
- Luật "hiện 3 lần không bấm": `IGNORED_AFTER_SHOWS = 3`, riêng cho màn hình này (feed ứng viên đã bỏ luật giáng hạng — SRM-1338).

### Bước 5 — Cắt theo sàn, rồi xoay danh sách mỗi ngày

```
Cắt:   bỏ mọi dòng dưới 40 điểm
Pool:  giữ tối đa 30 người cao điểm nhất
```

**Sàn 40 — đã chốt 2026-11-03.** Để cạnh bộ trọng số, chỉnh được không cần deploy.

| | Chế độ có chấm điểm | "Hồ sơ mới cập nhật" |
|---|---|---|
| Pool | Mọi người trên sàn 40, tối đa **top 30** | Mọi người qua bước 4, sắp theo CV mới cập nhật, tối đa **top 30** |
| Hôm nay hiện ai | Xáo trộn pool, gieo theo **company id + ngày** | Cùng cơ chế, cùng seed |
| Reload buổi trưa | Vẫn đúng những người đó | Vẫn đúng những người đó |
| Ngày mai | Một lượt rút khác từ cùng pool | Một lượt rút khác |

- **Gieo theo ngày, không random.** Recruiter sáng thấy một người thì chiều tìm lại được; "thứ Ba hệ thống hiện ai?" phải trả lời được.
- **Trong số đã chọn vẫn sắp theo điểm.** Xáo trộn quyết định *ai* hiện, không quyết định thứ tự — 3 thẻ thì người khớp nhất phải đọc trước.
- Loại người đã hiện 3 lần không bấm (bước 4) **trước**, rồi mới xáo.
- Pool ít hơn 3 người không phải lỗi — hiện 2 người, ngày nào cũng vậy. **Không lấy người dưới sàn lấp cho đủ hàng.**

**Khi không còn dòng nào** (không có tin, hoặc mọi người đều dưới 40) → đổi tiêu đề section thành **"Hồ sơ mới cập nhật"**: lọc cứng như bước 4 · ưu tiên trùng ngành công ty (`company.industry_id`) · sắp theo CV cập nhật gần nhất · mỗi nhóm nghề tối đa 1 người · xoay theo ngày. Không badge, không %.

---

**Hệ quả cần báo cho người làm màn hình Applicants:** màn hình đó dùng chung `ApplicantMatch`. Đổi trọng số + chấm tuyệt đối **không đổi thứ tự** bên đó (mọi ứng viên của cùng một tin chia cho cùng một số), chỉ làm **% in ra thấp đi** trên tin điền sơ sài. Luật in % đã có ở [Recommended jobs mục 9](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#9-a-signal-with-nothing-to-compare-scores-0-we-never-re-scale): dưới một nửa số tín hiệu so được → không in %; kỹ năng CV không resolve → tính là chưa biết. Không chặn ticket này.
