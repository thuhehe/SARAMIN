# [Admin][Master data] Company highlights: cờ Search tag + mục "Search tag đang dùng"

**Module:** System · **Site:** Admin (saramin-vn-admin) + svn-be · **Loại:** BE trước, FE sau
**Mockup (source of truth cho UI):** https://claude.ai/artifact/Czeaekg1FjX1PKmnV6szc4 — **màn 1 · Master data**
**Liên quan:** task 2 (Company page tab) và task 3 (hàng tag trên trang tìm kiếm) đều phụ thuộc task này.

---

## 0. Bối cảnh — đọc trước khi code

`company_highlight` hôm nay là catalogue 76 dòng trong 12 nhóm, seed bởi **svn-be V531** từ file *"New SVN - Benefit Card for Company.xlsx"* của khách hàng. Cột sẵn có: `parent_id` (dòng không có parent LÀ tiêu đề nhóm), `priority`, `criteria_vi/en`, `sort_order`, `active`, `search_text`.

Hôm nay catalogue này chỉ phục vụ **một** chỗ: dải chip trên trang công ty, tối đa 6 chip, lưu ở `company_page_highlight`.

Sắp tới trang tìm kiếm dùng chính catalogue này làm tag lọc trong dải Premium. Nhưng không phải tag nào cũng hợp để lên trang tìm kiếm, nên cần **một danh sách HQ chọn lọc** — khoảng 20 tag trong 76.

> **Không dùng lại cột `priority`.** Comment của V531 ghi thẳng: *"CORE | HIGH_VALUE | STANDARD | PREMIUM — the customer's editorial weighting. **Not a filter**."* Nó trả lời câu "tag này có đáng chỗ trên trang công ty không", là một câu hỏi khác. Nhóm CORE cũng chỉ có 11 dòng, quá ít. Gán nghĩa thứ hai cho một cột đã có nghĩa là cách chắc chắn để sáu tháng sau không ai biết nó đang nói gì.

---

## 1. Task 1a — svn-be: thêm cột `search_tag`

```sql
ALTER TABLE company_highlight ADD COLUMN search_tag BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index: chỉ ~20/76 dòng là TRUE, và mọi truy vấn đều hỏi "cái nào TRUE".
CREATE INDEX idx_company_highlight_search_tag ON company_highlight (search_tag) WHERE search_tag;
```

- `GET /admin/master-data/company-highlights` trả thêm `searchTag: boolean` cho mọi dòng.
- `PATCH /admin/master-data/company-highlights/{id}` nhận `searchTag`.
- **Dòng tiêu đề nhóm (`parent_id IS NULL`) không được gắn cờ** — svn-be trả `400` với mã lỗi riêng. Nhóm không phải tag.
- Migration bật sẵn cờ cho các mã ở mục 3 bên dưới.

### Acceptance — task 1a

- [ ] `GET` trả `searchTag` cho mọi dòng, kể cả dòng nhóm (luôn `false`).
- [ ] `PATCH searchTag: true` lên một dòng nhóm → `400`, mã lỗi đọc được.
- [ ] Sau migration: các mã ở mục 3 có `search_tag = true`, mọi dòng khác `false`.
- [ ] `priority`, `sort_order`, `active`, `criteria_*` của mọi dòng **không đổi giá trị** sau migration.

---

## 2. Task 1b — admin: cột Search tag + mục "Search tag đang dùng"

Màn: **System → Master data → tab Company highlights**. Xem màn 1 trong mockup.

### 2a. Cột mới trong bảng

| | |
|---|---|
| Vị trí | giữa cột **Mức ưu tiên** và cột **Tiêu chí** |
| Điều khiển | một `Switch` trên mỗi dòng tag; dòng nhóm để trống |
| Phạm vi | **chỉ tab `companyHighlights`**, không áp cho tab master data khác |

Cách gắn: thêm cờ `hasSearchTag: true` vào domain `companyHighlights` trong `master-data-domains.ts`, rồi `use-domain-columns.tsx` render cột theo cờ đó — đúng cách `hasPriority` đang làm, không viết nhánh riêng cho một domain.

### 2b. Thanh công cụ

- Nút lọc **"Chỉ tag đã gắn Search tag"**, đặt cạnh bộ lọc Mức ưu tiên.
- Bộ đếm **`Đã gắn N / 76 tag`** ở cuối thanh công cụ.

### 2c. Mục "Search tag đang dùng" — ngay DƯỚI bảng

Một section tách biệt, nền phân biệt với bảng:

- Tiêu đề **Search tag đang dùng** + bộ đếm `N tag`.
- Một **hàng chip ngang** gồm mọi tag đang bật cờ, chip tự xuống dòng khi hết chỗ.
- Mỗi chip có nút **×** → `PATCH searchTag: false`; chip biến mất và `Switch` tương ứng trong bảng tắt theo, **không tải lại trang**.
- Chip xếp theo **thứ tự catalogue** (nhóm rồi `sort_order`), không theo thứ tự bấm — hai lần mở trang phải thấy cùng một thứ tự.
- Danh sách trống → **vẫn hiện section**, kèm câu hướng dẫn bật công tắc ở bảng trên.

> **Mục này KHÔNG bị ô tìm kiếm và bộ lọc Mức ưu tiên lọc.** Nó là danh sách đang dùng, phải luôn đầy đủ. Bộ lọc chỉ tác động lên bảng.

### 2d. Bảng không đổi thứ tự dòng

Cây nhóm và `sort_order` giữ nguyên. Tag đã gắn cờ **vẫn nằm trong nhóm của nó**, không nhảy lên đầu bảng. Kéo thả sắp xếp hoạt động như cũ.

### Acceptance — task 1b

- [ ] Bật/tắt `Switch` gọi `PATCH` và cập nhật ngay cả bộ đếm trên thanh công cụ lẫn hàng chip dưới bảng.
- [ ] Bấm **×** trên chip tắt cờ và tắt `Switch` tương ứng trong bảng, không phải tải lại trang.
- [ ] Bộ lọc "Chỉ tag đã gắn Search tag" rút bảng còn các dòng đã bật; bỏ lọc thì về như cũ.
- [ ] Gõ ô tìm kiếm hoặc đổi bộ lọc Mức ưu tiên **không làm thay đổi** hàng chip dưới bảng.
- [ ] Cột **Search tag** không xuất hiện ở bất kỳ tab master data nào khác.
- [ ] Dòng tiêu đề nhóm không có `Switch`.
- [ ] Chưa gắn tag nào: section vẫn hiện kèm hướng dẫn, không phải khoảng trắng.
- [ ] Thứ tự dòng trong bảng không đổi khi bật/tắt cờ.

---

## 3. Dữ liệu — bật cờ sẵn cho 18 mã này

Đây là các tag tương đương với hàng chip Saramin KR đang chạy trên `/zf_user/search`.

| Chip KR | Mã trong `company_highlight` |
|---|---|
| 취업축하금 🎉 | `signing-bonus` |
| 성과급/상여금 💵 | `performance-bonus` |
| 연봉 TOP 💰 | `attractive-salary` |
| — | `13th-month-salary` |
| — | `kpi-bonus` |
| — | `salary-review` |
| 재택근무 💼 | `remote` |
| 유연근무제 🕐 | `flexible-working-hours` |
| 프리한 복장 👗 | `casual-dress` |
| 자유로운 연차 ⭐ | `extra-annual-leave` |
| — | `birthday-leave` |
| 육아휴직 👶 | `maternity` |
| 점심지원 🍚 | `meal-allowance` |
| — | `free-meals` |
| 주거복지 🏠 | `housing-allowance` |
| 간식 제공 🍭 · 사내 카페 ☕ | `free-snacks-drinks` |
| — | `tuition-support` |
| 휴가비 지원 🏝️ | `company-trips` |

**Sáu chip KR không có tương đương và KHÔNG làm trong task này:** 100명 이상 (trên 100 nhân viên), 대기업 (tập đoàn lớn), 스타트업 (startup), 급성장 중 (đang tăng trưởng nhanh), 장기근속자 (nhân viên gắn bó lâu), 워라밸 (cân bằng công việc – cuộc sống). Đây là **thuộc tính của doanh nghiệp**, không phải phúc lợi, nên catalogue hiện tại không có chỗ cho chúng. Bốn trong sáu cái đó có thể suy ra tự động từ `company.headcount` và `company.business_form` — đề xuất làm ở một task riêng sau.

---

## 4. Không làm trong task này

- ❌ Đổi ý nghĩa hay giá trị của cột `priority`.
- ❌ Thêm tag mới vào catalogue.
- ❌ Đụng vào tab `jobCardTags` hay bất kỳ domain master data nào khác.
- ❌ Giao diện chọn Search tag cho từng công ty — đó là task 2.
- ❌ Bất kỳ thay đổi nào trên svn-web.
