# [Admin][CRM] Company page tab: mục Search tags cho từng công ty

**Module:** CRM · **Site:** Admin (saramin-vn-admin) + svn-be · **Loại:** BE trước, FE sau
**Mockup (source of truth cho UI):** https://claude.ai/artifact/Czeaekg1FjX1PKmnV6szc4 — **màn 2 · Company page tab** và **màn 3 · Hộp chọn Search tag**
**Phụ thuộc:** task 1 phải xong trước — mục này chỉ chọn được từ các tag đã gắn cờ `search_tag`.


## Màn hình

**CRM → Companies → <công ty> → tab Company page.**

![Company page tab](https://saramin-eta.vercel.app/tickets/srm-1531/company-page.jpg)

**Section 3 tách làm hai.** 3a giữ nguyên hành vi cũ; 3b là phần mới. Banner đỏ hiện vì công ty đang có gói Premium mà 3b còn trống — không chặn lưu.

![Section 3](https://saramin-eta.vercel.app/tickets/srm-1531/section-3.jpg)

**Hộp chọn khi mở từ 3b.** Vẫn là `HighlightPickerDialog` đang chạy, chỉ khác danh sách nguồn và con số tối đa; nhãn trên tiêu đề nói rõ nó đang lọc trong tập nào.

![Hộp chọn Search tag](https://saramin-eta.vercel.app/tickets/srm-1531/picker.jpg)

---

## 0. Bối cảnh — đọc trước khi code

Hôm nay **section 3 Highlights** trong tab Company page cho phép chọn tối đa **6** chip từ cả 76 dòng catalogue, lưu ở `company_page_highlight`, hiện thành dải chip dưới thẻ thông tin trên trang công ty. Code: `highlights-section.tsx` (`MAX_HIGHLIGHTS = 6`) và `highlight-picker-dialog.tsx`.

Giờ cần **một tập thứ hai, độc lập**: các tag công ty dùng để lọc trong dải Premium trên trang tìm kiếm.

Hai tập trả lời hai câu khác nhau, nên là hai tập chứ không phải một:

| | 3a · Highlights | 3b · Search tags |
|---|---|---|
| Câu hỏi | "trang công ty khoe gì?" | "ứng viên lọc dải Premium bằng gì?" |
| Chọn từ | cả 76 tag | **chỉ tag có `search_tag = true`** |
| Tối đa | **6** — giữ nguyên | **12** |
| Hiện ở | trang công ty | hàng tag trong dải Premium trên `/search` |
| Lưu ở | `company_page_highlight` | `company_search_tag` (bảng mới) |

Một tag được phép nằm ở **cả hai** tập. Bỏ ở tập này không ảnh hưởng tập kia.

> **Vì sao 12 chứ không phải 6.** Với một khách Premium, số search tag công ty đó chọn CHÍNH LÀ số tag tối đa hiện trên hàng tag. Sáu là một hàng mỏng so với KR. Mười hai đủ dày mà vẫn chọn xong trong một lần ngồi.

---

## 1. Task 2a — svn-be: bảng `company_search_tag`

```sql
CREATE TABLE company_search_tag (
  company_id   VARCHAR(64) NOT NULL,
  highlight_id VARCHAR(64) NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, highlight_id)
);
CREATE INDEX idx_company_search_tag_company ON company_search_tag (company_id);
```

Cùng hình dạng `company_page_highlight` — không phát minh hình dạng mới cho cùng một loại quan hệ.

**Ba luật svn-be phải tự giữ, không dựa vào client:**

1. **Tối đa 12 dòng / công ty.** Dòng thứ 13 → `400`, đúng cách svn-be đang từ chối chip thứ 7 của company page.
2. **Chỉ nhận `highlight_id` có `search_tag = true`.** Không thì `400` với mã lỗi riêng — client có thể đang chạy bản cũ, hoặc HQ vừa tắt cờ.
3. **HQ tắt cờ một tag đang có công ty dùng → gỡ tag đó khỏi MỌI `company_search_tag`, trong cùng transaction.** Không để lại dòng mồ côi: trang tìm kiếm đọc thẳng bảng này, một dòng trỏ tới tag đã mất cờ sẽ thành một tag lọc mà không ai gắn cờ cho nó.

Endpoint: `GET` / `PUT /admin/companies/{id}/search-tags`, hoặc gộp vào payload company page đang có — Dev chọn, miễn là **hai tập không dùng chung một field**.

### Acceptance — task 2a

- [ ] `PUT` 13 tag → `400`; `PUT` 12 tag → `200`.
- [ ] `PUT` một `highlight_id` có `search_tag = false` → `400`, mã lỗi đọc được.
- [ ] Tắt cờ `search_tag` của một tag đang được 3 công ty dùng → cả 3 dòng biến mất khỏi `company_search_tag`, trong một transaction.
- [ ] `company_page_highlight` **không bị ảnh hưởng** bởi bất kỳ thao tác nào ở trên.
- [ ] Hai tập của cùng một công ty có thể chứa cùng một `highlight_id` mà không xung đột.

---

## 2. Task 2b — admin: tách section 3 làm hai mục con

Màn: **CRM → Companies → <công ty> → tab Company page**. Xem màn 2 trong mockup.

Section 3 **giữ nguyên số thứ tự và tiêu đề "Highlights"**, bên trong chia hai mục con:

### 3a · Highlights — trang công ty

Giữ nguyên 100% hành vi hiện tại: tối đa 6, chọn từ cả 76 tag, chip xếp theo thứ tự catalogue, nút ✕ trên chip để bỏ.

### 3b · Search tags — trang tìm kiếm *(mới)*

- Tối đa **12**, bộ đếm `N / 12`.
- Nút **+ Thêm** mở `HighlightPickerDialog` — **dùng lại nguyên si**, truyền vào `options` đã lọc `searchTag === true` và `max = 12`. Không fork component.
- Header dialog khi mở từ 3b có thêm một nhãn: **"Chỉ hiện tag đã gắn cờ Search tag"**, để người nhập không thắc mắc vì sao danh sách ngắn hơn lần trước.
- Mọi thứ khác trong dialog giữ nguyên: ô tìm kiếm tìm cả tên lẫn `criteria`, bộ lọc Mức ưu tiên, nhóm in đậm phân cách, khoá dòng kèm lời giải thích khi đã đủ số lượng.
- Chip xếp theo thứ tự catalogue, nút ✕ để bỏ.

### 2c. Cảnh báo khi công ty Premium chưa có Search tag

Banner đỏ trong section 3, hiện khi **công ty có gói Premium đang chạy** và 3b trống:

> ⚠ **Công ty đang dùng gói Premium nhưng chưa chọn Search tag.** Tin tuyển dụng của công ty vẫn lên dải Premium, nhưng hàng tag sẽ lấy tạm Highlights của trang công ty. Nếu cả hai đều trống thì hàng tag bị ẩn.

**Không chặn lưu.** Chặn lưu sẽ khoá luôn những phần không liên quan của trang — ảnh, giới thiệu, phúc lợi — chỉ vì một mục không bắt buộc.

### 2d. Checklist "Ready to publish"

Thêm một dòng **Search tags** vào danh sách bên phải, **không phải mục bắt buộc** (không có dấu `*`), nhưng tính vào phần trăm hoàn thành. Không nhìn thấy thì không ai nhớ điền.

### 2e. Trạng thái section 3

Dòng trạng thái bên phải tiêu đề section đọc `N + M tag` — xanh khi cả hai mục đều có, xám khi còn thiếu.

### Acceptance — task 2b

- [ ] Thêm/bỏ tag ở 3b **không** làm thay đổi 3a, và ngược lại.
- [ ] Hộp chọn mở từ 3b chỉ liệt kê tag có `search_tag = true`; mở từ 3a liệt kê cả 76.
- [ ] Hộp chọn mở từ 3b hiện nhãn "Chỉ hiện tag đã gắn cờ Search tag"; mở từ 3a không hiện.
- [ ] Chọn đủ 12 ở 3b → các dòng còn lại trong hộp bị khoá kèm lời giải thích trên chính dòng đó, không phải lỗi lúc lưu.
- [ ] Công ty Premium + 3b trống → banner hiện; chọn 1 tag → banner biến mất; **nút Lưu không bao giờ bị khoá**.
- [ ] Công ty không có gói Premium + 3b trống → **không** hiện banner.
- [ ] Checklist bên phải tick dòng Search tags khi 3b có ít nhất 1 tag, và phần trăm đổi theo.
- [ ] `HighlightPickerDialog` vẫn là một component duy nhất, không có bản sao.

---

## 3. Không làm trong task này

- ❌ Thêm cột `search_tag` — đó là task 1.
- ❌ Hàng tag trên trang tìm kiếm — đó là task 3.
- ❌ Đổi `MAX_HIGHLIGHTS = 6` của mục 3a.
- ❌ Đổi cách dải chip hiện trên trang công ty của jobseeker.
- ❌ Chặn lưu trang khi thiếu Search tag.
- ❌ Nhập hàng loạt Search tag cho nhiều công ty cùng lúc.
