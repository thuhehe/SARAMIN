# [Feature][BE][FE][Jobseeker] Onboarding — con số "N tin phù hợp" ở bước 3 và 4

**Requirement (nguồn sự thật):**
https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic — mục 18b · 18c · 18d · 18e

> **Audit 2026-11-03:** logic không đổi, chỉ chốt bảng năm → bậc (T3) trên thang 9 bậc thật của `job_level`. Section 2 của màn kết quả ("Jobs for {role}") thuộc SRM-1338 T5, không phải task này.

**Ticket:** SRM-1347 · **Parent:** SRM-1330 [JS] Matching logic

**Màn hình ảnh hưởng:** `/welcome` — wizard onboarding 5 bước, dòng chữ phía trên thanh tiến trình (chip `3/5` · `4/5`).

---

## Bối cảnh

Wizard in ra một con số ở **bước 3** và **bước 4**. Build hiện tại gọi engine chấm điểm của Recommended jobs (`/me/job-recommendations/count`) rồi đếm tin đạt **≥ 50/100 điểm**.

Cách đó sai bản chất. Recommended jobs trả lời *"xếp hạng tin nào hợp với **người này**"* — nó đọc CV, profile, trọng số. Con số trong wizard trả lời *"có bao nhiêu tin hợp với **bộ câu trả lời này**"*. Ứng viên lúc đó chưa có CV, chưa lưu profile.

Thay đổi: **đếm theo bộ lọc, không chấm điểm**. Không CV, không profile, không trọng số, không ngưỡng. Hệ quả tốt: **không cần đăng nhập** → API để public được, và con số **kiểm chứng được** — cùng bộ lọc đó mở ra trang job search phải ra đúng số dòng.

> ⚠️ Task này **không đụng** tới thuật toán Recommended jobs. Hai câu hỏi khác nhau, hai phép tính khác nhau.

---

## T1 · Hai con số đếm gì

> Requirement: [mục 18b](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18b-onboarding-the-two-numbers-in-the-wizard-steps-3-and-4)

**Chỉ có hai con số.** Bước 1, 2, 5 giữ câu không có số.

| | Hiện ở | Đếm tin khớp với |
|---|---|---|
| **N₃** | Bước 3 — số năm kinh nghiệm | vị trí · lĩnh vực · hình thức hợp đồng · nơi làm việc — **bước 1 + 2** |
| **N₄** | Bước 4 — trình độ học vấn | như trên, **cộng số năm kinh nghiệm** — bước 1 + 2 + **3** |

Mỗi banner tính trên những câu trả lời **đã xong trước bước đó** → con số đứng yên trong lúc ứng viên đang gõ.

**Checklist**
- [ ] N₃ = bước 1 + 2. N₄ = bước 1 + 2 + 3. Không hơn không kém
- [ ] Bước 4 ghi công cho **kinh nghiệm** (copy của nó nói vậy), không phải học vấn — học vấn đang được trả lời *tại* bước 4
- [ ] Tin được đếm: `status = OPEN` · đã publish · chưa hết hạn · `exposure = true` · công ty active công khai
- [ ] **Không** có luật "đã ứng tuyển" — ứng viên vừa đăng ký vài phút trước
- [ ] Copy cả hai kiểu (có số / không số) **đã có sẵn** EN + VI trong `features/onboarding/mock/copy.ts`. Không viết copy mới

> **Học vấn và mức lương không làm đổi con số nào.** Chúng được trả lời ở bước 4 và 5, sau đó không còn banner nữa. Đây là hệ quả của việc chỉ có hai banner, không phải thiếu sót.

---

## T2 · Luật cốt lõi — bỏ trống thì không loại

> Requirement: [mục 18c](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18c-the-one-rule-the-two-numbers-stand-on)

> **Tin nào bỏ trống một trường thì KHÔNG BAO GIỜ bị loại vì trường đó. Chỉ loại khi tin GHI RÕ một điều trái với câu trả lời.**

Phần lớn tin VN bỏ trống lĩnh vực, hình thức hợp đồng và dải kinh nghiệm. So khớp kiểu bằng-nhau thì tất cả biến mất ngay khi ứng viên trả lời bước 3, và N₄ = 0 với mọi người.

| Tiêu chí | Trường bên job | Chỉ loại tin khi |
|---|---|---|
| Vị trí (≤3) | `job_category_link` | category của tin không nằm trong category của các vị trí đã chọn |
| Lĩnh vực (≤3) | `industry_id` | tin **có ghi** và không nằm trong danh sách đã chọn |
| Hình thức hợp đồng | `contract_type_id` | tin **có ghi** và không trùng |
| Nơi làm việc (≤3) | `province_code` / `city_codes` / `job_location_link` | tin có ghi tỉnh/thành và không tỉnh nào được chọn |
| Kinh nghiệm (chỉ N₄) | xem T3 | ứng viên thấp hơn mức tin yêu cầu |

**Checklist**
- [ ] AND giữa các trường, OR trong cùng một trường (3 thành phố = bất kỳ cái nào)
- [ ] Vị trí so ở mức **category**, KHÔNG so đúng role — so đúng role ra con số kiểu 2
- [ ] Tin **remote** luôn qua được bộ lọc nơi làm việc
- [ ] **Thừa kinh nghiệm / thừa cấp bậc không bao giờ bị loại.** Giới hạn trên trong tin VN là đỉnh dải quảng cáo, không phải trần
- [ ] Con số **kiểm chứng được**: cùng bộ lọc đó mở job search ra đúng số dòng

---

## T3 · Kinh nghiệm đọc HAI nguồn, không phải một

> Requirement: [mục 18d](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18d-experience-has-two-sources-not-one)

`min_experience_years` **không bắt buộc** trên form đăng tin, bỏ trống ở hầu hết tin tự đăng. Chỉ đọc cột đó thì **N₄ = N₃ gần như mọi lần** — bước 4 in lại con số bước 3 trong khi câu chữ nói "khớp chính xác hơn".

| Thứ tự | Nguồn | Loại tin khi |
|---|---|---|
| **1** | `min_experience_years` | ứng viên **thấp hơn** mức tối thiểu tin ghi |
| **2 — dự phòng** | `job_level_link` | bậc ứng viên **thấp hơn ≥ 2 bậc** so với cấp thấp nhất tin ghi. **Lệch 1 bậc thì giữ** |
| — | tin không ghi cả hai | **Không bao giờ loại.** Form quy ước **để trống cấp bậc = "Mọi cấp bậc"** |

Một tin chỉ thoát tiêu chí kinh nghiệm khi NTD không nói gì về cấp bậc ở **cả hai** trường — tập đó nhỏ hơn nhiều "bỏ trống dải năm".

**Bảng quy đổi số năm → bậc — ĐÃ CHỐT 2026-11-03**, trên thang thật `job_level.sort_order` (intern 1 · fresher 2 · junior 3 · mid 4 · senior 5 · lead 6 · manager 7 · director 8 · c-level 9). Bảng này dùng chung với tín hiệu kinh nghiệm của SRM-1338 / 1345 — **một chỗ duy nhất** (requirement mục 18d):

| Số năm ứng viên | Bậc |
|---|---|
| Tick "Fresher" / 0 năm | fresher (2) |
| dưới 1 năm | fresher (2) |
| 1–2 | junior (3) |
| 3–4 | mid (4) |
| 5–7 | senior (5) |
| 8–11 | lead (6) |
| 12–14 | manager (7) |
| 15+ | director (8) |

**Checklist**
- [ ] Đọc `min_experience_years` trước, không có thì đọc `job_level_link`, không có cả hai thì **giữ tin**
- [ ] Lệch 1 bậc **giữ**, lệch ≥ 2 bậc **loại** — đúng bằng dung sai phần chấm điểm đang dùng (`EXPERIENCE_LEVEL_ADJACENT`), để hai chỗ không mâu thuẫn về việc ai "chưa đủ"
- [ ] Một tin có nhiều `job_level_link` → so với **cấp thấp nhất** tin ghi
- [ ] Ví dụ: ứng viên 3 năm (mid 4) vs tin Senior (5) → lệch 1, **giữ** · ứng viên 1 năm (junior 3) vs tin Senior (5) → lệch 2, **loại** · ứng viên 10 năm (lead 6) vs tin Intern (1) → thừa, **giữ**
- [ ] Bảng quy đổi nằm ở **một chỗ duy nhất**, không hard-code rải rác

---

## T4 · N₄ ≤ N₃, và khi hai số bằng nhau

> Requirement: [mục 18e](https://saramin-eta.vercel.app/m/job-management/recommended-jobs-new-logic#18e-n-is-never-larger-than-n-and-what-to-do-when-they-are-equal)

Lọc AND thì thêm tiêu chí chỉ có thể **bớt** tin. "Khớp chính xác hơn" = **chính xác hơn**, không phải **nhiều hơn**.

Figma vẽ 2 → 20 (số tăng) — **số minh hoạ**, team FE đã ghi nhận vậy khi dựng banner (`docs/onboarding/be-field-gaps.md` §2). **Không** cài luật để con số tăng lên.

| Tình huống | Banner hiện gì |
|---|---|
| N₄ < N₃ | Con số, như thiết kế |
| **N₄ = N₃** | **Câu không có số.** Bước 4 thôi không nhận công nữa |
| N < 5 ở bất kỳ bước nào | Bỏ bộ lọc **nơi làm việc**, đếm toàn quốc, **nói rõ trong câu**: "Chỉ có 3 tin ở Đà Nẵng — **128** tin trên cả nước." |
| Nới rồi vẫn không có gì | Câu không có số |
| Chưa chọn gì / API lỗi | Câu không có số |

**Checklist**
- [ ] **N₄ = N₃ → bước 4 hiện câu không có số.** Đây là cái dễ bị bỏ qua nhất vì trông như edge case — nó chính là thứ làm cho trường hợp dữ liệu xấu trở nên vô hình thay vì nói dối
- [ ] Chỉ được nới lỏng khi **câu chữ nói ra điều đó**. Âm thầm bỏ bộ lọc rồi báo số to hơn là nói dối về chính thứ vừa đo
- [ ] **Không bao giờ in `0`.** Ở màn hình thứ hai ứng viên từng thấy, số 0 đọc như một lời phán về con người
- [ ] Chỉ nới **một lần**, và chỉ nới **nơi làm việc**

---

## T5 · API

**Checklist**
- [ ] Endpoint **public** — không `candidateAccess.require`, không đọc candidate id. Đây là bộ đếm trên trường của job
- [ ] Tham số: `roleIds` · `industryIds` · `contractTypeId` · `regionIds` · `years` (tất cả optional, list đi dạng `a,b`)
- [ ] Trả `{ total }`. **Cap ở 500** → FE hiện "500+", để banner không bao giờ thành full table scan
- [ ] Không ghi impression, không ghi log gì — đây không phải một lượt hiển thị tin
- [ ] Gửi **cả 3 vị trí** đã chọn, không chỉ vị trí đầu (build hiện tại chỉ gửi cái đầu)

---

## T6 · FE

**Checklist**
- [ ] Debounce ~**300ms**, bỏ qua response về trễ (sai thứ tự) — bộ đếm bắn theo từng lượt chọn
- [ ] Gọi lại khi bất kỳ câu trả lời nào ở bước 1–3 đổi. Không cache
- [ ] Số chỉ render ở bước 3 và 4. Bước 1, 2, 5 render câu không có số
- [ ] Lỗi / chưa trả lời gì → rơi về câu không có số, **không** hiện `0`, **không** hiện spinner ở chỗ con số
- [ ] Bỏ `getMatchCountAction` cũ (gọi `/me/job-recommendations/count`) và cờ `isLive("job-recommendations")` — bộ đếm không còn phụ thuộc feature flag của Recommended jobs

---

## Bảng kiểm thử

| # | Thao tác | Kết quả mong đợi |
|---|---|---|
| 1 | Trả lời bước 1 + 2, sang bước 3 | Banner bước 3 hiện số |
| 2 | Bước 1, 2, 5 | **Không** có số, hiện câu không có số |
| 3 | Tin không ghi `industry_id`, ứng viên chọn lĩnh vực bất kỳ | Tin đó **vẫn được đếm** |
| 4 | Tin không ghi cả `min_experience_years` lẫn `job_level_link` | Tin đó **vẫn được đếm** ở N₄ |
| 5 | Ứng viên 10 năm, tin ghi cấp "Nhân viên" | Tin đó **vẫn được đếm** (thừa không loại) |
| 6 | Ứng viên 0 năm (fresher 2), tin ghi Mid (4) — lệch 2 bậc | Tin đó **bị loại** |
| 7 | Ứng viên 1–2 năm (junior 3), tin ghi Mid (4) — lệch 1 | Tin đó **vẫn được đếm** |
| 7b | Ứng viên 3 năm (mid 4), tin ghi Senior (5) — lệch 1 | Tin đó **vẫn được đếm** |
| 7c | Ứng viên 1 năm (junior 3), tin ghi Senior (5) — lệch 2 | Tin đó **bị loại** |
| 8 | Tin remote, ứng viên chọn Hà Nội, tin ở HCM | Tin đó **vẫn được đếm** |
| 9 | Dữ liệu làm N₄ = N₃ | Bước 4 hiện **câu không có số**, không lặp lại con số bước 3 |
| 10 | Bộ lọc ra 3 tin ở Đà Nẵng | Nới toàn quốc, câu chữ **nói rõ** "… trên cả nước" |
| 11 | Không có tin nào kể cả sau khi nới | Câu không có số. **Không in 0** |
| 12 | Tắt mạng / API 500 | Câu không có số, không vỡ wizard |
| 13 | Mở job search với đúng bộ lọc của N₃ | **Đúng số dòng** bằng con số banner in |
| 14 | Chưa đăng nhập, gọi thẳng endpoint | **200**, trả về số — không đòi token |
| 15 | Chọn/bỏ chọn liên tục 10 lần trong 1 giây | Chỉ 1–2 request thực sự bay đi, con số cuối cùng đúng |

---

## Việc cần làm TRƯỚC khi code

Đếm coverage trên DB thật. Nếu **cả hai** cột đều gần 0 thì không luật nào tách được hai con số, và bước 4 nên **bỏ hẳn số** — đó là trường hợp duy nhất "hai số giống nhau" là câu trả lời đúng, và phải ghi lại vào requirement khi xảy ra.

```sql
SELECT count(*) FILTER (WHERE j.min_experience_years IS NOT NULL) AS years_stated,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM job_level_link l WHERE l.job_id = j.id)) AS level_stated,
       count(*) FILTER (WHERE j.industry_id IS NOT NULL) AS industry_stated,
       count(*) FILTER (WHERE j.contract_type_id IS NOT NULL) AS contract_stated,
       count(*) AS total
FROM job j WHERE j.status = 'OPEN';
```

---

## Không làm trong task này

- Không đụng trọng số / cách chấm điểm của **Recommended jobs** — khác thuật toán, khác câu hỏi
- Không làm 4 thẻ việc ở **cuối** wizard (màn hình kết quả) — thuộc task Recommended jobs
- Không thêm con số thứ ba lên màn hình kết quả (nơi duy nhất học vấn và mức lương có thể có tác dụng nhìn thấy) — để sau, nếu muốn
- Không bắt buộc `min_experience_years` trên form đăng tin — không sửa được tin cũ, và thêm ma sát cho luồng đăng tin
- Không hiện điểm số ở bất kỳ đâu — bộ đếm này không có điểm số để hiện
