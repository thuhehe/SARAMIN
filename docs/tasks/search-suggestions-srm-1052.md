# [Search Bar] Gợi ý khi gõ / dán từ khoá — 3 nhóm: Công ty · Từ khoá · Việc làm

**Module:** Job management · **Site:** Jobseeker (svn-web + svn-be) · **Loại:** BE + FE
**Requirement chi tiết (source of truth):** https://saramin-eta.vercel.app/m/job-management/search-suggestions-the-dropdown-under-the-search-box
**Design:** Figma frame “Search - Clicked & entered keyword”

---

## 0. Bối cảnh — đọc trước khi code

Hiện tại `GET /api/{lang}/jobs/suggest` **chỉ đọc master data**: job category, occupation, specialisation group, specialisation, industry, skill, và location. Vì vậy một title do nhà tuyển dụng tự gõ (vd. *“Business Analyst (Fintech)”*) **không bao giờ** hiện trong dropdown. Kết quả là dropdown báo *“Không có kết quả”*, trong khi bấm Enter vẫn tìm ra job. Đây chính là bug SRM-1052: hai phần của cùng một ô search trả lời khác nhau.

Task này đổi dropdown thành **3 nhóm, mỗi nhóm tối đa 2 dòng**, theo đúng thứ tự trong design.

---

## Task 1 — BE: `/jobs/suggest` trả về 3 nhóm

### 1.1 Ba nhóm, thứ tự cố định

| Thứ tự | Nhóm | Nguồn | Tối đa |
|---|---|---|---|
| 1 | **Công ty** | Tên công ty đang active, có **≥ 1 job đang mở và không ẩn danh** | **2** |
| 2 | **Từ khoá** | Master data — **chỉ job categories** | **2** |
| 3 | **Việc làm** | Title của job **đang mở và public** (cùng điều kiện với trang kết quả search) | **2** |

→ **Tối đa 6 dòng.**

- **Từ khoá chỉ lấy job categories.** **Bỏ** occupation, specialisation (group), industry, skill khỏi dropdown.
- **Bỏ nhóm `location`** khỏi dropdown. Thanh search đã có ô chọn địa điểm riêng.
- **Title job không bao giờ là dòng Từ khoá.** Title chỉ xuất hiện trong nhóm Việc làm.
- Mỗi row Công ty cần: `slug`, tên. Mỗi row Từ khoá cần: `code`, tên category. Mỗi row Việc làm cần: `slug`, `title`.

### 1.2 Nhóm thiếu thì để thiếu — không bù, không chèn

- Mỗi nhóm hiện số kết quả khớp, **tối đa 2**.
- Ít hơn 2 → hiện ít hơn. Không có → **ẩn cả nhóm**.
- **Không** lấy slot trống của nhóm này bù cho nhóm khác.
- **Không** chèn kết quả không khớp để cho đủ.

| Tìm được (công ty / từ khoá / việc làm) | Hiện | Tổng |
|---|---|---|
| 5 / 3 / 9 | 2 / 2 / 2 | 6 |
| 0 / 1 / 9 | 0 / 1 / 2 | 3 |
| 1 / 0 / 0 | 1 / 0 / 0 | 1 |
| 0 / 0 / 0 | — | 0 (empty state, xem 2.3) |

### 1.3 Thế nào là “khớp”, và 2 dòng nào được chọn

- **Khớp** = tên **chứa** chuỗi đã gõ, **không phân biệt dấu** (“ke toan” → “Kế toán”), khớp **cả tên VI lẫn EN**.
- Công ty hoặc category có **0 job đang mở** → **không** tính là khớp.
- **Chọn 2 dòng theo thứ tự:** bắt đầu bằng chuỗi gõ → một từ bắt đầu bằng chuỗi gõ → chứa chuỗi gõ.
- **Bằng nhau thì:** Công ty và Từ khoá xếp theo **số job đang mở** nhiều hơn; Việc làm xếp theo **auto-refresh mới nhất** (giống luật tie của trang kết quả).
- **Không trùng dòng:** một công ty, category hay job không xuất hiện 2 lần.

### 1.4 Job ẩn danh (SRM-737)

- Hiện trong nhóm Việc làm như một job bình thường.
- **Không** làm công ty thật xuất hiện trong nhóm Công ty, và **không** tính vào số job đang mở của công ty đó.

### 1.5 Location chip

Nếu thanh search đang chọn địa điểm thì **chỉ nhóm Việc làm bị lọc** theo địa điểm đó. Công ty và Từ khoá không bị ảnh hưởng.

### AC — Task 1
- [ ] Gõ “ux” khi có ≥ 2 kết quả mỗi nhóm → đúng 6 dòng, thứ tự: 2 công ty → 2 từ khoá → 2 việc làm.
- [ ] Không nhóm nào có quá 2 dòng.
- [ ] Nhóm Từ khoá không có kết quả → tổng chỉ còn 4 dòng; slot trống **không** được bù bằng công ty hay việc làm.
- [ ] Dán đúng title của 1 job đang mở → job đó xuất hiện trong nhóm Việc làm.
- [ ] Gõ “ke toan” → nhóm Từ khoá có category “Kế toán / Kiểm toán”.
- [ ] Gõ tên một skill (vd. “React”, “Java”) → **không** có dòng skill nào trong nhóm Từ khoá.
- [ ] “ke toan” và “accountant” đều ra “Kế toán”.
- [ ] Công ty, category có 0 job đang mở → không xuất hiện. Job đã đóng hoặc tắt exposure → không xuất hiện.
- [ ] Không có dòng trùng nhau.
- [ ] Gõ tên thật của công ty chỉ có job ẩn danh → công ty **không** xuất hiện.
- [ ] Response chỉ còn 3 nhóm: company, category, job. Không còn `occupation`, `specialisationGroup`, `specialisation`, `industry`, `skill`, `location`.

---

## Task 2 — FE: hiển thị dropdown và hành vi bấm

### 2.1 Hiển thị (theo design)

- **Một danh sách**, 3 nhóm theo thứ tự: **Công ty → Từ khoá → Việc làm**.
- **Công ty:** icon toà nhà + tên, nhãn *Công ty* bên phải.
- **Từ khoá:** icon kính lúp + tên category.
- **Việc làm:** icon cặp + title (1 dòng, quá dài thì “…”), nhãn *Việc làm* bên phải.
- **In đậm** phần khớp với chuỗi đã gõ.
- **Không cuộn**: tối đa 6 dòng nên luôn vừa khung.
- Footer (tắt gợi ý · đóng) và panel công ty quan tâm bên phải: **giữ nguyên như hiện tại**.

### 2.2 Bấm vào đâu đi tới đâu

| Bấm | Đi tới |
|---|---|
| Công ty | Trang **chi tiết công ty** `/companies/<slug>` |
| Từ khoá | `/search?category=<code>` — **filter**, không phải keyword. **Đổi so với hiện tại** (đang submit thành keyword search). |
| Việc làm | Trang **chi tiết việc làm** `/jobs/<slug>` |
| Enter, không chọn dòng nào | Keyword search như hiện tại |

### 2.3 Hành vi

- **Dán = gõ.** Paste phải kích hoạt gợi ý giống hệt khi gõ.
- Bắt đầu gợi ý từ **2 ký tự** (đã có).
- **Không còn dòng “Không có kết quả”.** Khi không có gợi ý nào, hiện: **“Không có gợi ý cho ‘…’ — nhấn Enter để tìm”** / *“No suggestions for ‘…’ — press Enter to search”* (thêm vào dictionary VI/EN/KO).
- **Bàn phím:** ↑ ↓ đi qua tất cả các dòng của cả 3 nhóm, Enter mở dòng đang chọn, Esc đóng dropdown.
- **Chưa gõ gì:** giữ nguyên như hiện tại.
- Sự kiện analytics khi chọn gợi ý (`sendSuggestSelect`) ghi thêm **nhóm** đã chọn: `company` / `keyword` / `job`.

### AC — Task 2
- [ ] Thứ tự hiển thị đúng: Công ty → Từ khoá → Việc làm; nhóm rỗng không chiếm chỗ.
- [ ] Dán title job → dropdown hiện job đó, **không** hiện “Không có kết quả”.
- [ ] Bấm một công ty → mở đúng trang chi tiết công ty.
- [ ] Bấm một từ khoá → mở `/search` với category đó **đang được chọn** ở thanh filter, bỏ chọn được.
- [ ] Bấm một việc làm → mở đúng trang chi tiết việc làm.
- [ ] Không có gợi ý → hiện câu “nhấn Enter để tìm”; Enter ra trang kết quả bình thường.
- [ ] Phần khớp được in đậm; title dài bị cắt bằng “…”.
- [ ] ↑ ↓ / Enter / Esc hoạt động xuyên suốt 3 nhóm.
- [ ] Có chọn địa điểm Hà Nội → nhóm Việc làm chỉ còn job ở Hà Nội; Công ty và Từ khoá không đổi.

---

## Không làm trong task này

- ❌ Bù slot trống của nhóm này sang nhóm khác. Mỗi nhóm tối đa 2, thiếu thì để thiếu.
- ❌ Dùng title job làm **từ khoá gợi ý**.
- ❌ Gợi ý occupation, specialisation, industry, skill. Từ khoá **chỉ** là job categories.
- ❌ Gợi ý địa điểm trong dropdown (đã có ô chọn địa điểm riêng).
- ❌ Đổi panel công ty quan tâm, footer, hay màn hình lúc chưa gõ gì.
- ❌ Sửa lỗi chính tả hoặc tìm gần đúng (fuzzy / typo).
- ❌ Đổi gì ở trang kết quả search khi bấm Enter.

---

## Bug gốc (reporter)

**Actual Result:**
- The suggestion dropdown shows "Không có kết quả" (No results) while the keyword is pasted/typed.
- However, upon pressing Enter, the search results page successfully finds and displays the matching job (e.g., 1 job found)

**Expected Result:**
The suggestion dropdown should accurately query and display matching job suggestions in real-time when a valid search keyword is pasted or typed, ensuring consistency with the search results page.
