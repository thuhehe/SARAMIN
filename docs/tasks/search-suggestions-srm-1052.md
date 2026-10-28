# [Search Bar] Gợi ý khi gõ / dán từ khoá — 3 nhóm: Từ khoá · Việc làm · Công ty

**Module:** Job management · **Site:** Jobseeker (svn-web + svn-be) · **Loại:** BE + FE
**Requirement chi tiết (source of truth):** https://saramin-eta.vercel.app/m/job-management/search-suggestions-the-dropdown-under-the-search-box

---

## 0. Bối cảnh — đọc trước khi code

Hiện tại `GET /api/{lang}/jobs/suggest` **chỉ đọc master data**: job category, occupation, specialisation group, specialisation, industry, skill, và location. Vì vậy một title do nhà tuyển dụng tự gõ (vd. *“Business Analyst (Fintech)”*) **không bao giờ** hiện trong dropdown. Kết quả là dropdown báo *“Không có kết quả”*, trong khi bấm Enter vẫn tìm ra job. Đây chính là bug SRM-1052: hai phần của cùng một ô search trả lời khác nhau.

Task này **mở rộng** dropdown thành **3 nhóm**, đọc từ 3 nguồn, theo **thứ tự ưu tiên cố định** và **số slot linh động**.

---

## Task 1 — BE: `/jobs/suggest` trả về 3 nhóm

### 1.1 Ba nhóm và thứ tự ưu tiên

| Ưu tiên | Nhóm | Nguồn | Slot cơ bản | Trần |
|---|---|---|---|---|
| 1 | **Từ khoá** | Master data — **chỉ job categories** | 5 | 7 |
| 2 | **Việc làm** | Title của job **đang mở và public** (cùng điều kiện với trang kết quả search) | 3 | 6 |
| 3 | **Công ty** | Tên công ty đang active, có **≥ 1 job đang mở và không ẩn danh** | 2 | 4 |

- **Từ khoá chỉ lấy job categories.** **Bỏ** occupation, specialisation (group), industry, skill khỏi dropdown.
- **Bỏ nhóm `location`** khỏi dropdown. Thanh search đã có ô chọn địa điểm riêng.
- Mỗi row Việc làm cần: `slug`, `title`, tên công ty, logo. Mỗi row Công ty cần: `slug`, tên, logo, số job đang mở. Mỗi row Từ khoá cần: `code` và tên của category.

### 1.2 Chia slot linh động — tổng tối đa 10 dòng

1. Mỗi nhóm lấy số kết quả mình có, **tối đa bằng slot cơ bản**.
2. Slot thừa = 10 − số đã dùng.
3. Chia slot thừa **theo thứ tự ưu tiên: Từ khoá → Việc làm → Công ty**. Nhóm trước lấp đầy tới **trần** của nó rồi mới tới nhóm sau.
4. Vẫn còn thừa → **trả ít hơn 10 dòng**. **Không** chèn kết quả không khớp để cho đủ.

| Tìm được (từ khoá / việc làm / công ty) | Trả về | Tổng |
|---|---|---|
| 8 / 5 / 3 | 5 / 3 / 2 | 10 |
| 8 / 5 / 0 | **7** / 3 / 0 | 10 |
| 8 / 1 / 4 | **7** / 1 / 2 | 10 |
| 1 / 8 / 4 | 1 / **6** / **3** | 10 |
| 0 / 0 / 6 | 0 / 0 / **4** | 4 |
| 2 / 1 / 1 | 2 / 1 / 1 | 4 |
| 0 / 0 / 0 | — | 0 |

### 1.3 Thế nào là “khớp”, và thứ tự trong nhóm

- **Khớp** = tên **chứa** chuỗi đã gõ, **không phân biệt dấu** (“ke toan” → “Kế toán”), khớp **cả tên VI lẫn EN**.
- Từ khoá hoặc công ty có **0 job đang mở** → **không** tính là khớp.
- **Thứ tự trong nhóm:** bắt đầu bằng chuỗi gõ → một từ bắt đầu bằng chuỗi gõ → chứa chuỗi gõ.
- **Bằng nhau thì:** Từ khoá và Công ty xếp theo **số job đang mở** nhiều hơn; Việc làm xếp theo **auto-refresh mới nhất** (giống luật tie của trang kết quả).

### 1.4 Ngoại lệ: chuỗi gõ là tên công ty

Tên công ty **bắt đầu bằng** chuỗi gõ (vd. “fpt”, “bosch”) và công ty có job đang mở, không ẩn danh → row công ty đó lên **dòng đầu tiên**. Nó vẫn tính vào slot của nhóm Công ty: số lượng ở 1.2 **không đổi**, chỉ đổi vị trí.

### 1.5 Job ẩn danh (SRM-737)

- Hiện trong nhóm Việc làm với logo Saramin và tên **“Saramin’s Client”**, không bao giờ hiện tên hay logo thật.
- **Không** làm công ty thật xuất hiện trong nhóm Công ty, và **không** tính vào số job đang mở của công ty đó.

### 1.6 Location chip

Nếu thanh search đang chọn địa điểm thì **chỉ nhóm Việc làm bị lọc** theo địa điểm đó. Từ khoá và Công ty không bị ảnh hưởng.

### AC — Task 1
- ☐ Gõ “ke toan” → nhóm Từ khoá có category “Kế toán / Kiểm toán”, nhóm Việc làm có các job có title chứa “kế toán”, nhóm Công ty nếu có tên khớp.
- ☐ Gõ “Business Ana” → nhóm Việc làm có Senior Business Analyst, Business Analyst (Fintech)…; nhóm Từ khoá chỉ có kết quả nếu có **category** khớp.
- ☐ Gõ tên một skill (vd. “React”, “Java”) hoặc một industry không trùng tên category nào → **không** có dòng skill / industry nào trong nhóm Từ khoá.
- ☐ Dán đúng title của 1 job đang mở → job đó xuất hiện trong nhóm Việc làm.
- ☐ Tổng số dòng không bao giờ quá 10. Các ca trong bảng 1.2 trả đúng số dòng từng nhóm.
- ☐ Không nhóm nào vượt trần: Từ khoá ≤ 7, Việc làm ≤ 6, Công ty ≤ 4.
- ☐ “ke toan” và “accountant” đều ra “Kế toán”.
- ☐ Từ khoá, công ty có 0 job đang mở → không xuất hiện. Job đã đóng hoặc tắt exposure → không xuất hiện.
- ☐ Gõ “fpt” → công ty FPT ở dòng 1.
- ☐ Gõ tên thật của công ty chỉ có job ẩn danh → công ty **không** xuất hiện; job hiện là “Saramin’s Client”.
- ☐ Response chỉ còn 3 nhóm: category, job, company. Không còn `occupation`, `specialisationGroup`, `specialisation`, `industry`, `skill`, `location`.

---

## Task 2 — FE: hiển thị dropdown và hành vi bấm

### 2.1 Hiển thị

- **Một cột**, 3 nhóm theo thứ tự: **Từ khoá → Việc làm → Công ty**. Mỗi nhóm có tiêu đề nhỏ; nhóm rỗng thì ẩn cả tiêu đề.
- **Từ khoá:** icon kính lúp + tên category, nhãn *Ngành nghề*.
- **Việc làm:** logo + title + tên công ty, nhãn *Việc làm*.
- **Công ty:** logo + tên, nhãn *Công ty*.
- **In đậm** phần khớp với chuỗi đã gõ.
- **Không** thêm cột “việc làm gợi ý” không liên quan đến chuỗi gõ.

### 2.2 Bấm vào đâu đi tới đâu

| Bấm | Đi tới |
|---|---|
| Từ khoá | `/search?category=<code>` — **filter**, không phải keyword. **Đổi so với hiện tại** (đang submit thành keyword search). |
| Việc làm | Trang **chi tiết việc làm** `/jobs/<slug>` |
| Công ty | Trang **chi tiết công ty** `/companies/<slug>` (không phải danh sách job của công ty) |
| Enter, không chọn dòng nào | Keyword search như hiện tại |

### 2.3 Hành vi

- **Dán = gõ.** Paste phải kích hoạt gợi ý giống hệt khi gõ.
- Bắt đầu gợi ý từ **2 ký tự** (đã có).
- **Không còn dòng “Không có kết quả”.** Khi không có gợi ý nào, hiện: **“Không có gợi ý cho ‘…’ — nhấn Enter để tìm”** / *“No suggestions for ‘…’ — press Enter to search”* (thêm vào dictionary VI/EN/KO).
- **Bàn phím:** ↑ ↓ đi qua tất cả các dòng của cả 3 nhóm, Enter mở dòng đang chọn, Esc đóng dropdown.
- **Chưa gõ gì:** giữ nguyên như hiện tại (recent search + từ khoá phổ biến).
- Sự kiện analytics khi chọn gợi ý (`sendSuggestSelect`) ghi thêm **nhóm** đã chọn: `keyword` / `job` / `company`.

### AC — Task 2
- ☐ Dán title job → dropdown hiện job đó, **không** hiện “Không có kết quả”.
- ☐ Bấm một từ khoá → mở `/search` với filter đó **đang được chọn** ở thanh filter, bỏ chọn được.
- ☐ Bấm một việc làm → mở đúng trang chi tiết việc làm.
- ☐ Bấm một công ty → mở đúng trang chi tiết công ty.
- ☐ Không có gợi ý → hiện câu “nhấn Enter để tìm”; Enter ra trang kết quả bình thường.
- ☐ Nhóm rỗng không hiện tiêu đề. Phần khớp được in đậm.
- ☐ ↑ ↓ / Enter / Esc hoạt động xuyên suốt 3 nhóm.
- ☐ Có chọn địa điểm Hà Nội → nhóm Việc làm chỉ còn job ở Hà Nội; Từ khoá và Công ty không đổi.

---

## Không làm trong task này

- ❌ Dùng title job làm **từ khoá gợi ý**. Title chỉ xuất hiện dưới dạng **một job cụ thể**.
- ❌ Gợi ý occupation, specialisation, industry, skill. Từ khoá **chỉ** là job categories.
- ❌ Gợi ý địa điểm trong dropdown (đã có ô chọn địa điểm riêng).
- ❌ Cột / khối “việc làm bạn sẽ thích” cạnh gợi ý.
- ❌ Sửa lỗi chính tả hoặc tìm gần đúng (fuzzy / typo).
- ❌ Đổi gì ở trang kết quả search khi bấm Enter.

---

## Bug gốc (reporter)

**Actual Result:**
- The suggestion dropdown shows "Không có kết quả" (No results) while the keyword is pasted/typed.
- However, upon pressing Enter, the search results page successfully finds and displays the matching job (e.g., 1 job found)

**Expected Result:**
The suggestion dropdown should accurately query and display matching job suggestions in real-time when a valid search keyword is pasted or typed, ensuring consistency with the search results page.
