# [Jobseeker] Mọi ô tìm kiếm master data phải khớp cả tiếng Việt lẫn tiếng Anh

**Module:** Jobseeker (Onboarding · My CVs · Tìm việc) · **Site:** svn-web (chính) + svn-be (1 field phụ) · **Loại:** FE trước, BE một mục nhỏ
**Tiền lệ:** **SRM-938** đã làm đúng việc này cho form đăng tin phía employer (13/10/2026). Task này là mở rộng sang phía jobseeker và **dùng lại code của 938**, không viết lại.
**Liên quan:** **SRM-1348** (UI của đúng những picker này trên Onboarding / Work preference, đang RECHECK) — **đụng cùng file**, nên làm nối tiếp chứ đừng chạy song song. **SRM-1426** (bug tìm theo tên category ở Onboarding) đã xong và không chồng lấn.
**Quy tắc gốc trong spec:** https://saramin-eta.vercel.app/m/admin-system#every-picker-over-master-data-searches-both-names-vi-and-en-decided-2026-11-16 — đọc quy tắc ở đó, ticket này chỉ là danh sách thi công. Nguyên mẫu minh hoạ (gõ tiếng Việt trên trang tiếng Anh): https://saramin-eta.vercel.app/m/jobseeker-user/onboarding

---

## 0. Hiện tượng

Trang **Onboarding** (`/chao-mung`) ở locale EN, mở modal **Jobs/Occupations**, gõ `bán hàng` → **No match** — trong khi catalogue có `Bán hàng công nghiệp / Industrial Sales`, `Nhân viên bán hàng / Retail salesperson`, `Giám sát bán hàng / Sales supervisor`…

Ngược chiều cũng hỏng: ở locale VI gõ `sales` không ra `Nhân viên kinh doanh`, gõ `accountant` không ra `Kế toán viên`.

Người Việt dùng giao diện tiếng Anh (và người nước ngoài dùng giao diện tiếng Việt) là chuyện thường ngày trên sản phẩm này. Ô tìm kiếm hiện chỉ khớp **đúng ngôn ngữ đang hiển thị**, nên nửa số người dùng gõ đúng tên nghề của mình mà vẫn ra rỗng — ngay ở bước đầu tiên sau khi đăng ký.

---

## 1. Bối cảnh — đọc trước khi code

Dữ liệu đi qua ba tầng, **chỉ tầng trên cùng hỏng**:

| Tầng | Trạng thái |
|---|---|
| **DB** | ✅ Đã sẵn sàng. `V175` thêm cột sinh `search_text` cho 21 bảng master data (`code + name_vi + name_en + name_ko`, bỏ dấu, flatten dấu câu, + GIN trgm index); `job_attribute` có cột tương đương ở `V346`. **Không cần migration mới.** |
| **API** | ✅ Phần lớn đã trả đủ 2 tên. `TaxonomyOptionDto` = `{ id, code, nameVi, nameEn, parentId }` — `/job-roles`, `/job-categories/taxonomy`, `/industries`, `/skills`, `/languages`, `/regions/provinces`… đều trả cả hai. ⚠ Trừ 3 endpoint facet ở mục 7. |
| **FE** | ❌ Chỗ hỏng. Mỗi service gộp 2 tên thành **một** `label` theo locale, rồi ô tìm kiếm lọc trên chính `label` đó. Tên ngôn ngữ kia bị vứt đi ngay ở tầng service, picker không còn gì để khớp. |

Ba dòng code là toàn bộ căn nguyên:

```ts
// features/my-profile/services/profile-options.service.ts
function taxLabel(o, lang) { return lang === "vi" ? o.nameVi : (o.nameEn ?? o.nameVi); }  // nameVi bị bỏ khi lang=en

// features/onboarding/components/taxonomy-picker.tsx
const matched = needle ? options.filter((o) => foldVi(o.label).includes(needle)) : options;  // chỉ còn label

// features/jobs/search/lib/industry-tree.ts
node: { code: row.id, label: industryLabel(row, locale), children: [] }   // nameVi/nameEn/nameKo → 1 label
```

**Đã có sẵn hai chỗ làm ĐÚNG trong repo — dùng lại, đừng viết mới:**

- `features/hiring/jobs/lib/job-quick-pick.ts` — `otherLanguageName()` (tên của ngôn ngữ trang **không** hiển thị), `matchEither()` (khớp tên hiển thị trước, rồi tên kia), `otherNameHint()` (chỉ trả tên kia khi **chỉ** nó khớp). Kèm unit test ở `job-quick-pick.test.mjs`.
- `features/my-profile/services/profile-options.service.ts` — `toBilingualItems()` gắn `searchText = nameVi + " " + nameEn` vào từng option. Hôm nay **chỉ** dùng cho `industries`, và đó đúng là field duy nhất trong Onboarding đang tìm được bằng cả hai thứ tiếng.

---

## 2. Quy tắc chung — áp cho MỌI field trong task này

| | Quy tắc |
|---|---|
| **R1** | Một dòng khớp khi chuỗi gõ vào khớp **tên tiếng Việt HOẶC tên tiếng Anh**, bất kể trang đang ở locale nào. |
| **R2** | **Không đổi thuật toán khớp của từng picker.** `taxonomy-picker` đang dùng `includes`, `job-role-selector` đang dùng `matchesWordPrefix` — giữ nguyên, chỉ **mở rộng vùng tìm** từ một tên thành hai. Đổi thuật toán là rủi ro hồi quy không cần có trong task này. |
| **R3** | Bỏ dấu + hạ chữ thường bằng `foldVi` (`lib/fold-vi.ts`), không tự viết hàm chuẩn hoá mới. `ha noi` vẫn phải ra `Hà Nội`, `ke toan` vẫn phải ra `Kế toán viên`. |
| **R4** | **Nhãn hiển thị không đổi.** Trang EN vẫn in tên EN, trang VI vẫn in tên VI. Task này sửa cái được **tìm**, không sửa cái được **hiện**. |
| **R5** | **Mọi dòng trong danh sách phải có ít nhất một đoạn được highlight** — trong nhãn, trong dòng phụ, hoặc trong tiêu đề nhóm của nó. Một dòng không có highlight nào là **bug**, không phải lựa chọn thiết kế: người dùng gõ `bán hàng`, nhận về `Retail salesperson` không có chữ nào sáng lên, và kết luận là hệ thống trả sai. Cách hiện cho từng trạng thái ở **mục 2b**. |
| **R6** | **Không gọi thêm API khi client đã có đủ dữ liệu.** Gần như mọi catalogue đã về client với cả hai tên — chỉ bị service bỏ đi. SRM-938 phải fetch catalogue lần hai vì endpoint facet chỉ trả một tên; mục 7 làm để lần fetch đó biến mất, không phải để nhân nó ra thêm. |
| **R7** | Locale `ko`: **hiển thị** theo quy tắc hiện có, **tìm kiếm** vẫn là VI + EN (wire không mang `nameKo` cho phần lớn catalogue). |
| **R8** | Chỉ khớp theo **tên**, không khớp theo `code`. `code` là slug kỹ thuật (`sales-representative`), người dùng không gõ nó, và để nó vào vùng tìm sẽ cho ra kết quả không giải thích được. |

---

## 2b. Hiển thị kết quả — bốn trạng thái, và cách chia nhóm

> **Mockup (nguồn chân lý cho UI):**
> · [Màn hiện tại — SRI-2337](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=7555-38157)
> · [Khớp qua tên role](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=7565-23363)
> · [Khớp qua tên category](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=7566-23363)

Ô tìm kiếm hiện tại **đã** highlight chữ đã gõ trong kết quả. Đó chính là lý do tìm song ngữ không thể chỉ "thêm dòng vào danh sách": một dòng khớp qua ngôn ngữ kia sẽ nằm giữa các dòng có chữ sáng, mà bản thân nó không sáng chữ nào. Phải nói cho người dùng biết **tại sao** nó ở đó.

### 2b-1. Bốn trạng thái

| Khớp ở đâu | Dòng hiển thị | Dòng phụ (12px, mờ, dưới nhãn) |
|---|---|---|
| **Tên đang hiển thị** | highlight tại chỗ | **không có** — y như hôm nay, không thêm gì |
| **Tên VI của role** | nhãn để trơn | tên VI của **riêng role** + highlight — `VI · Nhân viên bán hàng` |
| **Tên VI của category** | nhãn để trơn | **không có** — tên category nói MỘT LẦN ở tiêu đề nhóm (xem 2b-3) |
| **Cả role lẫn category** | nhãn để trơn | cả chuỗi `category > role`, **cả hai đoạn** cùng highlight |

**Không bao giờ dịch cả chuỗi khi chỉ một đoạn khớp.** Dòng phụ tồn tại để giải thích kết quả, không phải để dịch dòng chính. `Kinh doanh & Thương mại > Nhân viên bán hàng` dài xấp xỉ nhãn gốc, nên hai dòng dài bằng nhau sẽ đọc thành **hai kết quả** chứ không phải một kết quả kèm chú thích. Chỉ khi cả hai đoạn cùng khớp thì chuỗi đầy đủ mới chính đáng — lúc đó cả hai đoạn đều có chữ sáng.

**Tiền tố `VI ·` / `EN ·` là bắt buộc.** Không có nó, dòng mờ bên dưới đọc như một chú thích vu vơ. Tiền tố là tên của ngôn ngữ **đang không hiển thị**: trang EN thì `VI ·`, trang VI thì `EN ·`.

**Hai tên trùng nhau thì không có dòng phụ.** `Digital Marketing` viết y hệt ở cả hai cột — in lại lần nữa là nhiễu, không phải thông tin.

### 2b-2. Chia nhóm theo độ cụ thể của chỗ khớp

Thứ tự: **khớp tên đang hiển thị** → **khớp tên role** → **khớp tên category**. Người dùng đọc từ trên xuống, gặp cái quen trước, và tới nhóm lạ thì đã được báo trước.

```
Matching the name shown · 2          ← chỉ hiện khi nhóm có dòng
☐ Sales, Marketing, Trade > Bán hàng công nghiệp
☐ Sales, Marketing, Trade > Bán hàng trực tuyến
──────────────────────────────────────────────
Also matching in Vietnamese · 3
☐ Sales, Marketing, Trade > Retail salesperson
   VI · Nhân viên bán hàng
...
```

**Tiêu đề nhóm chỉ xuất hiện khi nhóm đó có dòng.** Gõ `kinh doanh` ở trang EN thì không dòng nào khớp tên đang hiển thị → nhóm đầu biến mất hẳn, không để lại khoảng trống hay tiêu đề rỗng. Khi chỉ còn **một** nhóm, tiêu đề của nó vẫn giữ — nó chính là lời giải thích.

### 2b-3. Khớp ở category: nói MỘT LẦN ở tiêu đề, không lặp từng dòng

Đây là ca dễ làm hỏng nhất. Vùng tìm của `category-drill-modal` ghép cả tên category lẫn tên role, nên khi category khớp thì **mọi role dưới nó đều khớp** — 12, 20, có khi hơn. Nếu mỗi dòng tự in `VI · Kinh doanh & Thương mại`, kết quả là một cột chữ **giống hệt nhau** lặp 20 lần, và nó nhấn chìm đúng những dòng mà tên role mới là chỗ khớp.

Thay vào đó, gom thành một nhóm riêng và để tiêu đề mang tên category (có highlight), các dòng bên dưới để **trơn**:

```
Category “Kinh doanh & Thương mại” matched — every role under it · 12
☐ Sales, Marketing, Trade > Retail salesperson
☐ Sales, Marketing, Trade > Industrial Sales
```

Các dòng này **không vi phạm R5**: chữ sáng nằm ở tiêu đề nhóm, và tiêu đề áp cho mọi dòng trong nhóm.

### 2b-4. Sửa nhãn "Select all that contain …"

Hôm nay dòng cuối ghi **"Select all that contain `ma`"**. Với tìm song ngữ câu này thành **sai sự thật** — nó sẽ chọn cả những dòng hiển nhiên không chứa chuỗi đã gõ. Đổi thành:

- EN: **Select all results for “bán hàng”**
- VI: **Chọn tất cả kết quả cho “bán hàng”**

### Acceptance — mục 2b

- [ ] Không có dòng nào trong danh sách không có highlight (soát bằng mắt trên cả 3 truy vấn ở mục 9, cả 2 locale).
- [ ] Dòng khớp trực tiếp **không** mọc thêm dòng phụ — so ảnh trước/sau phải giống hệt.
- [ ] Dòng khớp qua tên role hiện đúng tên VI **của role**, không kèm category.
- [ ] Khớp qua category: tên category hiện **một lần** ở tiêu đề nhóm; không dòng nào trong nhóm đó có dòng phụ.
- [ ] Khớp cả hai: dòng phụ là `category > role`, cả hai đoạn cùng sáng.
- [ ] Trang EN gõ `kinh doanh` → nhóm "Matching the name shown" **không xuất hiện**, không để lại tiêu đề rỗng hay khoảng trắng.
- [ ] Tiền tố đúng theo locale: trang EN là `VI ·`, trang VI là `EN ·`.
- [ ] Nhãn dòng cuối không còn chữ "contain"/"chứa".
- [ ] Thứ tự nhóm: tên hiển thị → tên role → tên category, không đổi giữa hai lần mở cùng một truy vấn.

---

## 3. Phạm vi — các field phải sửa

### Phía jobseeker (phần chính, đúng yêu cầu)

| # | Màn hình | Field | Component | Catalogue | Hôm nay |
|---|---|---|---|---|---|
| 1 | Onboarding bước 1 | **Jobs/Occupations** | `features/onboarding/components/category-drill-modal.tsx`, `job-role-picker.tsx` | `job_category` (21) + `job_role` (477) | ❌ chỉ 1 tên |
| 2 | Onboarding bước 2 | **Locations** | `category-drill-modal.tsx`, `taxonomy-picker.tsx` | `region` (34 tỉnh) | ❌ API `/regions` chỉ trả 1 tên |
| 3 | Onboarding | **Industry** | `industry-drill-modal.tsx` → `industry-picker-panel.tsx` | `industry` (632) | ✅ **đã đúng** — chuẩn để đối chiếu |
| 4 | My profile → **Work preference** | Job roles · Locations · Industries | đúng 3 component trên (màn này import lại của wizard) | như trên | giống 1–3 |
| 5 | My CVs → CV builder → **Skills** | ô tìm kỹ năng | `features/my-profile/ui/cv/skills-editor.tsx` | `skill` (783) | ❌ chỉ 1 tên |
| 6 | **`/tim-kiem`** · các trang board `/viec-lam/dia-diem`, `/nganh-nghe`, `/nganh`… · **dải tìm kiếm trên header (mọi trang)** | **Ngành nghề · Kỹ năng · Chuyên môn** | `features/jobs/ui/job-role-selector.tsx`, dùng bởi `search/ui/search-filter-bar.tsx` **và** `jobs/ui/header-search-band.tsx` | facet: `job_role`, `skill`, `job_attribute` (598) | ❌ API facet chỉ trả 1 tên |
| 7 | `/tim-kiem` · các trang board `/viec-lam/*` | **Lĩnh vực** | `features/jobs/ui/industry-selector.tsx` ← `industry-tree.ts`, dùng bởi `search-filter-bar.tsx` | `industry` | ❌ chỉ 1 tên |

### Phía employer (2 picker SRM-938 bỏ sót — sửa luôn cho hết)

| # | Màn hình | Field | Component | Hôm nay |
|---|---|---|---|---|
| 8 | Hiring → Tìm ứng viên → bộ lọc | mọi tầng trong picker | `features/hiring/candidate-search/components/filter-picker.tsx` (`nodeLabel`) | ❌ — nhưng `PickerNode` **đã mang sẵn** `nameVi` + `nameEn`, sửa 1 dòng |
| 9 | Hiring → Tìm ứng viên → **Skill picker** | ô tìm kỹ năng | `features/hiring/candidate-search/components/skill-picker.tsx` | ❌ — cùng `PickerNode`, cũng 1 dòng |

> Không nằm trong danh sách vì **đã đúng**: `job-card-tag-picker.tsx` (tìm cả `nameVi`, `nameEn`, `code`, `criteriaVi`, `criteriaEn`), và toàn bộ form đăng tin phía employer (SRM-938).
>
> Không nằm trong danh sách vì **không có ô tìm kiếm**: các `Select` ở CV (trình độ học vấn, mức độ ngoại ngữ), `region-drill-picker`, chip loại hình công việc/hợp đồng. Catalogue dưới ~50 dòng, chọn bằng cuộn chuột.

---

## 4. Task 1 — svn-web: hạ tầng dùng chung (làm trước, các task sau phụ thuộc)

**4a. Đưa helper của SRM-938 ra chỗ dùng chung.** Chuyển `otherLanguageName`, `matchEither`, `otherNameHint` (và `<AltName>`) từ `features/hiring/jobs/` sang một module dùng chung (`lib/bilingual-name.ts` + một component ở `components/`). Phía hiring import từ chỗ mới. **Không đổi hành vi, không đổi test** — chỉ đổi chỗ ở. Phía jobseeker không được phép copy lại logic này.

**4b. `ProfileOptionItem` mang tên thứ hai.** Thêm `altLabel?: string` — tên của ngôn ngữ trang **không** hiển thị, `undefined` khi dòng chỉ có một tên hoặc hai tên giống nhau (chính là đầu ra của `otherLanguageName`). Cho `toItems()` gắn `altLabel` cho **mọi** catalogue thay vì chỉ `industries`.

> `searchText` hiện có của `toBilingualItems` là một chuỗi gộp — tìm được, nhưng **không** biết tên nào đã khớp, nên không vẽ được gợi ý R5. Thay `searchText` bằng `altLabel` và bỏ `toBilingualItems`, để cả dự án còn **một** cách làm thay vì hai.

**4c. Một hàm lọc dùng chung, và nó phải trả về CHỖ KHỚP chứ không phải true/false.** `matchesBilingual(row, query)` trả `"label" | "altRole" | "altCategory" | "altBoth" | null`. Mục 2b chia nhóm và chọn dòng phụ theo đúng giá trị này, nên một hàm trả boolean là không đủ — đó cũng là lý do `searchText` (chuỗi gộp) phải biến mất ở 4b. Mọi picker ở mục 5–7 gọi hàm này; không picker nào tự gọi `foldVi` trên một tên nữa.

### Acceptance — Task 1

- [ ] `features/hiring/jobs/lib/job-quick-pick.ts` không còn khai báo `otherLanguageName` / `matchEither` / `otherNameHint`, mà import từ module dùng chung.
- [ ] Toàn bộ test cũ của SRM-938 vẫn xanh, không sửa assertion nào.
- [ ] `toItems()` trả `altLabel` cho mọi catalogue; `searchText` và `toBilingualItems` đã bị xoá, không còn ai tham chiếu.
- [ ] `altLabel` là `undefined` khi `name_vi === name_en` (ví dụ `Digital Marketing`) — không hiện gợi ý trùng chính nó.
- [ ] Unit test cho `matchesBilingual`: trả đúng `"label"` / `"altRole"` / `"altCategory"` / `"altBoth"` / `null` cho năm ca tương ứng — đây là đầu vào của cách chia nhóm ở mục 2b, sai một giá trị là sai cả màn hình.

---

## 5. Task 2 — Onboarding + Work preference (mục 1, 2, 4)

Ba component, sửa cùng một kiểu. **Hai màn hình dùng chung component, nên sửa một lần là xong cả hai** — nhưng phải test cả hai.

- `taxonomy-picker.tsx` — đổi `foldVi(o.label).includes(needle)` sang `matchesBilingual(o, query)`.
- `category-drill-modal.tsx` — vùng tìm hiện ghép `role.label` với `categoryLabel`; thêm `altLabel` của **cả role lẫn category** vào đó. Gõ `sales` ở trang VI phải mở được nhóm `Kinh doanh & Thương mại` (EN: `Sales, Marketing, Trade`).
- `job-role-picker.tsx` — vùng tìm cũng ghép `categoryLabel` với `role.label`, sửa cùng kiểu.
- Dòng kết quả vẽ theo **mục 2b**: dòng phụ nằm **dưới** nhãn (không phải bên phải — nhãn ở đây là chuỗi `Category > Role`, đã dài sẵn), 12px, màu mờ, chữ đã gõ sáng trong đó. Các dòng khớp qua category gom thành nhóm riêng và **không** có dòng phụ.

**Locations** cần thêm một bước: `fetchRegions()` đọc `/api/{lang}/regions`, endpoint này chỉ trả **một** `name` đã localize. Đổi nguồn của `options.locations` sang **`GET /api/{lang}/regions/provinces`** — endpoint đã tồn tại, trả đúng `{ id, code, nameVi, nameEn, parentId }`, và javadoc của nó nói thẳng là được tạo ra cho đúng tình huống "picker phải render được bằng cả hai thứ tiếng". `/regions` giữ nguyên cho cây Miền › Tỉnh › Phường của trang tìm việc.

### Acceptance — Task 2

Kiểm trên **cả** `/chao-mung` **và** My profile → Work preference, **cả** locale `vi` **lẫn** `en`:

- [ ] Trang EN, modal Jobs/Occupations, gõ `bán hàng` → ra ≥ 4 dòng, trong đó có `Industrial Sales`, `Retail salesperson`, `Sales supervisor`, `E-commerce sales`; mỗi dòng hiện tên tiếng Việt mờ bên cạnh.
- [ ] Trang VI, gõ `sales` → ra `Nhân viên kinh doanh`, `Trưởng phòng kinh doanh`, `Giám sát bán hàng`…, kèm tên tiếng Anh mờ.
- [ ] Trang EN, gõ `ke toan` (không dấu) → ra `Accountant`. Trang VI, gõ `accountant` → ra `Kế toán viên`.
- [ ] Trang EN, ô Locations gõ `ha noi` → ra `Hanoi`; trang VI gõ `ho chi minh` → ra `Hồ Chí Minh`.
- [ ] Trang VI, gõ `marketing executive` → ra `Chuyên viên Marketing`.
- [ ] Industry (đang đúng sẵn) **không đổi hành vi**: trang EN gõ `bất động sản` vẫn ra `Real estate, rental, and brokerage`.
- [ ] Dòng có `name_vi === name_en` (ví dụ `Digital Marketing`) ra đúng một lần, **không** kèm gợi ý trùng.
- [ ] Giá trị lưu xuống không đổi: vẫn là `job_role.id` / `region.id` / `industry.id` như trước. Chọn bằng tiếng Anh rồi reload trang VI phải thấy đúng chip tiếng Việt.
- [ ] Cap chọn tối đa, thứ tự dòng, giới hạn `MAX_ROWS = 100` giữ nguyên.

---

## 6. Task 3 — My CVs → CV builder → Skills (mục 5)

`skills-editor.tsx` lọc `options.skills` bằng `norm(o.label)` (fold + bỏ hết ký tự không phải chữ/số). Giữ nguyên `norm`, chỉ chạy nó trên **cả** `label` lẫn `altLabel`.

Catalogue 783 kỹ năng, phần lớn là thuật ngữ nghề — đây là ô người dùng gõ nhiều nhất trong CV builder.

### Acceptance — Task 3

- [ ] Trang EN gõ `kế toán` ra các kỹ năng kế toán; trang VI gõ `accounting` ra đúng tập đó.
- [ ] `norm` vẫn bỏ dấu cách và dấu câu: `thiet ke` vẫn ra `Thiết kế`.
- [ ] Đám mây kỹ năng gợi ý (SRM-1501) không đổi.
- [ ] Giá trị lưu vẫn là `skill.id`.

---

## 7. Task 4 — Trang tìm việc (mục 6, 7) + Task 5 — svn-be

> **Đây là mấy trang nào, nói cho rõ.** Hai picker này KHÔNG nằm ở một trang. `SearchFilterBar` được dùng nguyên vẹn ở **ba** nơi:
>
> | Nơi | Route | Component |
> |---|---|---|
> | Trang kết quả tìm kiếm | `/tim-kiem` (`PAGE.SEARCH`) | `app/[lang]/(main)/search/page.tsx` → `SearchResultsPage` → `search-filter-bar.tsx` |
> | Các trang **job board** | `/viec-lam/dia-diem` · `/viec-lam/nganh-nghe` · `/viec-lam/nganh` (và `trong-nuoc`, `han-quoc`, `nuoc-ngoai`, `hot-100`) | `features/jobs/board/page.tsx` — *đúng cái* `SearchFilterBar` của `/tim-kiem`, không phải bản rút gọn |
> | **Dải tìm kiếm trên header** | mọi trang jobseeker, kể cả trong mega menu | `header-search-band.tsx` → `JobRoleSelector` |
>
> Nghĩa là sửa `job-role-selector.tsx` một lần là xong cả ba, nhưng **phải test cả ba** — nhất là dải header, vì nó xuất hiện ở mọi trang và dễ bị bỏ sót khi QA chỉ mở `/tim-kiem`. Lưu ý `/viec-lam/<slug>` (không có đoạn sau) là trang **chi tiết tin**, không có picker nào.

**7a. Lĩnh vực (`industry-selector.tsx`) — chỉ FE.** `IndustryRow` từ `/industries` đã có `nameVi`/`nameEn`/`nameKo`; `buildIndustryTree` vứt chúng đi ở `industryLabel`. Cho `IndustryNode` mang thêm `altLabel`, lọc bằng `matchesBilingual`. Giá trị gửi lên (`?industry=` = row id) không đổi.

**7b. Ngành nghề · Kỹ năng · Chuyên môn (`job-role-selector.tsx`) — cần BE.** Ba endpoint facet chỉ trả **một** `name` đã localize:

| Endpoint | DTO | Đổi |
|---|---|---|
| `GET /api/{lang}/job-attribute-facets` | `JobAttributeFacetDto(id, code, name, categoryCode, kindCode, kindName, count)` | **thêm** `nameVi`, `nameEn` |
| `GET /api/{lang}/job-role-facets` | `JobRoleFacetDto(id, code, name, categoryCode, count)` | **thêm** `nameVi`, `nameEn` |
| `GET /api/{lang}/job-category-skills` · `/job-role-skills` | resolve một `name` ở tầng application | **thêm** `nameVi`, `nameEn` |

Thuần **additive**: `name` giữ nguyên tên, kiểu, vị trí và giá trị; không client nào phải đổi theo. Dữ liệu đã có sẵn trên entity (`job_attribute.name_vi/name_en`, `skill.name_vi/name_en`), chỉ là mapper đang resolve sớm.

> **Phần thưởng kèm theo:** SRM-938 phải đọc `/job-attribute-facets` **lần thứ hai** ở ngôn ngữ kia mỗi lần mở form đăng tin, chỉ để có tên thứ hai (xem changelog `2026-10-13/feat-srm-938-bilingual-taxonomy-search.md`). Khi DTO trả đủ hai tên, **xoá lần fetch đó** — task này làm trang đăng tin nhẹ đi chứ không nặng thêm.

**7c.** `job-role-selector.tsx` lọc bằng `matchesBilingual`, **giữ nguyên `matchesWordPrefix`** làm phép so khớp (R2): nó khớp theo đầu từ, không phải substring, và đó là chủ ý.

### Acceptance — Task 4 + 5

- [ ] `GET /api/en/job-attribute-facets` trả `nameVi` và `nameEn` cho mọi dòng; `name` không đổi một ký tự so với trước (so sánh response trước/sau).
- [ ] Tương tự cho `/job-role-facets`, `/job-category-skills`, `/job-role-skills`.
- [ ] `/tim-kiem` ở EN, ô Lĩnh vực gõ `ngân hàng` → ra `Banking and financial`, `Banking and Billing`; ở VI gõ `banking` → ra `Tài chính và ngân hàng`.
- [ ] `/tim-kiem` ở EN, picker Ngành nghề gõ `bán hàng` → ra cả role lẫn chuyên môn (`B2B sales`, `B2C sales`, `Live-commerce`…).
- [ ] **Cùng kết quả đó trên `/viec-lam/nganh-nghe` và trên dải tìm kiếm ở header** (mở từ trang chủ và từ mega menu) — ba nơi dùng chung component, nên ba nơi phải giống nhau.
- [ ] Số đếm (count) cạnh mỗi dòng và thứ tự nhóm không đổi.
- [ ] Form đăng tin phía employer **không còn** gọi `/job-attribute-facets` lần hai; hành vi tìm kiếm của nó giữ nguyên.

---

## 8. Task 6 — Hai picker còn sót phía employer (mục 8, 9)

`filter-picker.tsx` và `skill-picker.tsx` lọc bằng `nodeLabel(node, locale)` — trong khi `PickerNode` **đã mang sẵn** `nameVi` và `nameEn`. Đổi sang khớp cả hai. Mỗi file một dòng; không cần API, không cần service.

### Acceptance — Task 6

- [ ] Hiring → Tìm ứng viên, trang EN, ô tìm trong bộ lọc gõ `kế toán` → ra các nút tiếng Anh tương ứng; trang VI gõ `accounting` → ra tiếng Việt.
- [ ] Skill picker: như trên.
- [ ] Tiêu chí đã lưu (saved criteria) và nhãn chip không đổi.

---

# UI

https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=7565-23363&t=MxdoTWnNWM8RQ7RZ-1

![](https://bb-project-management.s3.ap-southeast-1.amazonaws.com/attachments/9fa94971-292f-4248-b414-2352cadac928.png)

---

## 9. Bảng kiểm thử chung

Chạy trên **cả hai locale** cho **mọi** field ở mục 3. `✔` = phải ra kết quả.

| Gõ vào | Trang VI | Trang EN | Ghi chú |
|---|---|---|---|
| `bán hàng` | ✔ | ✔ | ca ở mục 0 |
| `sales` | ✔ | ✔ | |
| `ke toan` (không dấu) | ✔ | ✔ | R3 |
| `KẾ TOÁN` (hoa, có dấu) | ✔ | ✔ | R3 |
| `accountant` | ✔ | ✔ | |
| `ha noi` | ✔ | ✔ | field Locations |
| `digital marketing` | ✔ | ✔ | dòng có 2 tên trùng nhau — **không** hiện gợi ý |
| chuỗi rỗng / chỉ dấu cách | danh sách đầy đủ | danh sách đầy đủ | không đổi hành vi hiện tại |
| `zzzz` | "Không có kết quả" | "No match" | không đổi |

---

## 10. Giới hạn đã biết — KHÔNG phải lỗi của task này

Kiểm trên bộ master data 02/11 (`V791`), **mọi dòng đều có `name_en`** — nên sửa code là đủ, không cần chờ dịch thêm. Nhưng một phần catalogue có `name_vi` **chính là** tên tiếng Anh:

| Catalogue | Tổng | `name_vi` trùng `name_en` |
|---|---|---|
| `job_role` | 477 | 58 (12%) |
| `job_attribute` | 598 | 129 (21%) |
| `skill` | 783 | 102 (13%) |
| `industry` | 632 | 23 (3%) |
| `job_category` | 21 | 0 |

Với những dòng này (`Marketing Planner`, `Digital Marketing`, `Content Editor`…) người dùng gõ tiếng Việt vẫn **không** tìm ra — vì không tồn tại tên tiếng Việt để khớp. Đó là việc của **BA + khách hàng** (bổ sung `name_vi` thật), không phải của dev, và không chặn task này.

Hướng mở rộng sau (không làm bây giờ): bảng `job_role_alias` / `industry_alias` / `skill_alias` đã tồn tại và đang được **job search** dùng làm từ đồng nghĩa (`V793`). Cho picker khớp cả alias sẽ bắt được `Lập trình viên Backend` → `Backend Developer`. Đề xuất làm thành task riêng sau khi task này xong.

---

## 11. Không làm trong task này

- ❌ **Ô tìm kiếm từ khoá việc làm** (ô keyword trên dải tìm kiếm) — đó là full-text trên nội dung tin tuyển dụng ở svn-be, có bộ từ đồng nghĩa riêng, không phải picker master data.
- ❌ Tìm kiếm bằng **tiếng Hàn**. Wire không mang `nameKo` cho phần lớn catalogue; hiển thị `ko` giữ nguyên quy tắc hiện có.
- ❌ Đổi **nhãn hiển thị**, thứ tự dòng, cap chọn, `MAX_ROWS`, hay thuật toán khớp của bất kỳ picker nào (R2, R4).
- ❌ Thêm/sửa/dịch **dòng master data**. Mục 10 là việc của BA.
- ❌ Khớp theo **alias** (để task sau) và khớp theo `code` (R8).
- ❌ Tìm theo tên **công ty**, tên trường, tên đơn vị — dữ liệu người dùng nhập, không phải master data song ngữ.
- ❌ Đụng vào **admin** (`saramin-vn-admin`): System → Master data đã tìm trên `search_text` ở DB, vốn đã song ngữ.
- ❌ Migration DB mới.
