# [2/5][Admin][Master data] Company highlights: cờ Required — đúng một tag mọi công ty đều có

**Sub-task 2 / 5** · **Repo:** saramin-vn-admin + svn-be · **Phụ thuộc:** sub-task 1 (cờ Search tag) phải xong trước
**Requirement:** [saramin-eta.vercel.app → Admin · System → Master data](https://saramin-eta.vercel.app/m/admin-system/master-data#company-highlights-carry-two-more-flags-search-tag-and-required-and-neither-is-the-priority-column)
**Giải thích cho khách:** https://claude.ai/artifact/SV4xrNdEktZuvJLFXtCra2

> **Ticket MỚI, thêm ngày 19/11/2026** khi mô hình hiển thị của dải Premium được viết lại. Nó nhỏ, nhưng sub-task 4 (svn-be) **không chạy được nếu thiếu nó**.

---

## 0. Vì sao cần cờ này

Tag là thuộc tính của **công ty**. Dải Premium **luôn có đúng một tag đang được chọn** — không có nút "Tất cả", không có trạng thái không chọn gì.

Ghép hai điều đó lại ra một lỗ hổng: **công ty mua placement nhưng chưa ai chọn Search tag cho họ thì tin của họ không thuộc tag nào** — và vì luôn có một tag đang chọn, những tin đó **không bao giờ xuất hiện**. Khách trả tiền, tin không lên dải, và không có lỗi nào báo ở đâu cả.

Bản spec cũ chữa bằng chuỗi dự phòng 2 bước (mượn tạm Highlights của trang công ty, không có nữa thì ẩn hàng tag). Cách đó phức tạp và vẫn để lọt trường hợp xấu nhất.

**Cờ Required chữa tận gốc:** đúng một dòng catalogue mang cờ này, và nó phủ **mọi tin trong dải** — định nghĩa theo TIN, không theo công ty, nên cả tin đăng ẩn danh (không có công ty) cũng nằm trong đó. Không tin nào có thể rơi ra ngoài. Nhờ vậy **chuỗi dự phòng bằng Highlights được xoá hẳn** khỏi sub-task 4.

## 1. svn-be: thêm cột `required`

```
ALTER TABLE company_highlight ADD COLUMN required BOOLEAN NOT NULL DEFAULT FALSE;

-- Đúng một dòng được phép TRUE. Ràng buộc ở DB, không chỉ ở tầng ứng dụng.
CREATE UNIQUE INDEX idx_company_highlight_required_one
  ON company_highlight ((required)) WHERE required;
```

- `GET /admin/master-data/company-highlights` trả thêm `required: boolean`.
- `PATCH .../{id}` nhận `required`. Bật cờ trên dòng mới **phải tự tắt dòng cũ trong cùng một transaction** — không bắt admin tắt tay rồi bật tay, vì giữa hai thao tác đó dải sẽ không có tag required nào.
- **Chỉ dòng đã có `search_tag = true` mới được gắn Required.** Vi phạm → `400`, mã lỗi đọc được.
- **Gỡ cờ `search_tag` của dòng đang Required → từ chối thẳng**, `400`, nêu rõ lý do. Muốn đổi thì gắn Required cho dòng khác trước.
- Không cho phép trạng thái "không có dòng nào Required": `PATCH required: false` trực tiếp → `400`. Chỉ đổi được bằng cách gắn cho dòng khác.
- Migration bật sẵn cờ cho `featured-jobs` (xem mục 3).

## 2. Admin: cột Required

Màn: **System → Master data → tab Company highlights**, cùng chỗ với cờ Search tag của sub-task 1.

| Cái gì | Ở đâu | Hành vi |
|---|---|---|
| **Cột Required** | ngay sau cột **Search tag** | một `Radio` mỗi dòng (không phải Switch — radio nói đúng rằng chỉ chọn được một). Dòng chưa gắn Search tag: radio **disabled**, kèm tooltip nêu lý do. |
| **Xác nhận khi đổi** | dialog trước khi `PATCH` | nêu rõ: tag nào đang Required, tag nào sắp thay, và một câu rằng tag này **hiện trên mọi dải Premium toàn site**. |
| **Nhãn trong mục "Search tag đang dùng"** | chip của dòng Required | thêm huy hiệu **Bắt buộc** và **bỏ nút ×** — không gỡ được từ đây. |

> Dùng lại đường đã có của sub-task 1: thêm cờ `hasRequired: true` vào domain `companyHighlights` trong `master-data-domains.ts`, để `use-domain-columns.tsx` render theo cờ — **không viết nhánh `if (domain === 'companyHighlights')`**.

## 3. Dữ liệu — tag nào được chọn làm Required

Migration bật cờ cho **`featured-jobs` — "✨ Việc làm nổi bật"**. Nếu mã này chưa tồn tại trong catalogue thì migration **tạo mới** nó (nhóm phù hợp, `search_tag = true`, `active = true`) rồi mới gắn Required.

> **Đây là quyết định sản phẩm, không phải kỹ thuật.** Tag này là thứ **mọi ứng viên nhìn thấy trên mọi dải Premium của toàn site**, nên nó phải đọc như một dấu hiệu chất lượng trung tính. "💻 Làm việc từ xa" chẳng hạn sẽ là một lời hứa mà phần lớn các công ty trong dải không giữ được. HQ đổi được bất cứ lúc nào tại màn này, có hiệu lực ngay ở lượt tải trang kế tiếp, không cần migration.

## 4. Acceptance

- [ ] Sau migration: đúng **một** dòng có `required = true`, là `featured-jobs`, và dòng đó cũng có `search_tag = true`.
- [ ] `PATCH required: true` lên dòng B (khi A đang Required) → A tự về `false`, B thành `true`, **trong một transaction**. Truy vấn giữa chừng không bao giờ thấy 0 hoặc 2 dòng Required.
- [ ] `PATCH required: true` lên dòng chưa gắn Search tag → `400`.
- [ ] `PATCH searchTag: false` lên dòng đang Required → `400`, nêu lý do.
- [ ] `PATCH required: false` trực tiếp → `400`; không có cách nào đưa hệ thống về trạng thái không có tag Required.
- [ ] Thử ghi 2 dòng `required = true` thẳng vào DB → **unique index chặn**.
- [ ] Admin: radio ở dòng chưa gắn Search tag bị disabled và có tooltip.
- [ ] Admin: đổi Required hiện dialog xác nhận nêu đúng tên tag cũ và tag mới.
- [ ] Admin: chip của tag Required trong mục "Search tag đang dùng" có huy hiệu **Bắt buộc** và **không có nút ×**.
- [ ] Cột Required không xuất hiện ở bất kỳ tab master data nào khác.

## 5. Không làm trong sub-task này

- ❌ Chọn Search tag cho từng công ty — sub-task 3.
- ❌ Logic vòng quay, con trỏ, response `premiumBand` — sub-task 4.
- ❌ Giao diện hàng tag trên svn-web — sub-task 5.
- ❌ Ghi tag Required vào `company_search_tag` của từng công ty. Nó **không** được lưu per-company: svn-be thêm nó vào lúc dựng dải. Lưu 10.000 dòng giống hệt nhau chỉ để diễn đạt "mọi công ty đều có" là sai hướng.
