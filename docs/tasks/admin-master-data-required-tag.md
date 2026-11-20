# [2/5][Admin][Master data] Company highlights: cờ Required + cờ Default

**Sub-task 2 / 5** · **Repo:** saramin-vn-admin + svn-be · **Phụ thuộc:** sub-task 1 (cờ Search tag) phải xong trước
**Hai cờ trong một ticket** vì cùng một bảng, cùng một migration, cùng một chỗ render cột.
**Requirement:** [saramin-eta.vercel.app → Admin · System → Master data](https://saramin-eta.vercel.app/m/admin-system/master-data#company-highlights-carry-three-more-flags-search-tag-required-and-default-and-none-of-them-is-the-priority-column)
**Giải thích cho khách:** https://claude.ai/artifact/SV4xrNdEktZuvJLFXtCra2

> **Ticket MỚI, thêm ngày 19/11/2026** khi mô hình hiển thị của dải Premium được viết lại; **bổ sung cờ Default ngày 20/11**. Nó nhỏ, nhưng sub-task 4 (svn-be) **không chạy được nếu thiếu cờ Required**.

## ⚠️ Required và Default KHÔNG phải một thứ

Đọc kỹ bảng này trước, vì hai cờ nằm cạnh nhau trên cùng một màn và rất dễ cài nhầm thành một.

| | **Required** | **Default** |
|---|---|---|
| Bao nhiêu dòng mang cờ | **đúng 1** | **bao nhiêu cũng được** |
| Có lưu vào `company_search_tag` không | **KHÔNG** — svn-be tự thêm lúc dựng dải | **CÓ** — ghi thành dòng thật của công ty |
| Người nhập liệu gỡ được không | **không bao giờ** | **gỡ thoải mái** |
| Tính vào giới hạn 12 tag không | **không** | **có** |
| Ảnh hưởng công ty đã tồn tại | **có, ngay lập tức** | **không** — chỉ công ty tạo MỚI |
| Để làm gì | **độ phủ**: không tin nào thuộc về không tag nào | **độ với**: công ty chưa ai điền vẫn nằm trong vài vòng quay thay vì một |

Một dòng catalogue được phép mang Search tag một mình, Search tag + Required, hoặc Search tag + Default — **không bao giờ Required và Default cùng lúc**.

---

## 0. Vì sao cần cờ này

Tag là thuộc tính của **công ty**. Dải Premium **luôn có đúng một tag đang được chọn** — không có nút "Tất cả", không có trạng thái không chọn gì.

Ghép hai điều đó lại ra một lỗ hổng: **công ty mua placement nhưng chưa ai chọn Search tag cho họ thì tin của họ không thuộc tag nào** — và vì luôn có một tag đang chọn, những tin đó **không bao giờ xuất hiện**. Khách trả tiền, tin không lên dải, và không có lỗi nào báo ở đâu cả.

Bản spec cũ chữa bằng chuỗi dự phòng 2 bước (mượn tạm Highlights của trang công ty, không có nữa thì ẩn hàng tag). Cách đó phức tạp và vẫn để lọt trường hợp xấu nhất.

**Cờ Required chữa tận gốc:** đúng một dòng catalogue mang cờ này, và nó phủ **mọi tin trong dải** — định nghĩa theo TIN, không theo công ty, nên cả tin đăng ẩn danh (không có công ty) cũng nằm trong đó. Không tin nào có thể rơi ra ngoài. Nhờ vậy **chuỗi dự phòng bằng Highlights được xoá hẳn** khỏi sub-task 4.

## 1. svn-be: thêm cột `required` và `default`

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

### Cột `default`

```
ALTER TABLE company_highlight ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_company_highlight_default ON company_highlight (is_default) WHERE is_default;
```

- `GET` trả thêm `isDefault: boolean`; `PATCH .../{id}` nhận `isDefault`.
- **Chỉ dòng đã có `search_tag = true` mới được gắn Default** → vi phạm trả `400`.
- **Dòng đang Required không được gắn Default** → `400`. Nó không lưu per-company, nên gắn Default sẽ ghi ra những dòng vô nghĩa.
- **Gỡ cờ `search_tag` của dòng đang Default**: cho phép, nhưng **tự gỡ luôn `is_default`** trong cùng transaction (khác với Required — cái đó từ chối thẳng).
- Không có trần số dòng Default. Nhưng nếu số dòng Default **vượt 12** thì phần vượt sẽ bị cắt lúc tạo công ty (giới hạn 12 ở sub-task 3) — admin cảnh báo, xem mục 2.
- **Migration KHÔNG bật sẵn Default cho dòng nào.** Đây là lựa chọn sản phẩm của HQ, không phải thứ dev đoán hộ.

## 2. Admin: cột Required

Màn: **System → Master data → tab Company highlights**, cùng chỗ với cờ Search tag của sub-task 1.

| Cái gì | Ở đâu | Hành vi |
|---|---|---|
| **Cột Required** | ngay sau cột **Search tag** | một `Radio` mỗi dòng (không phải Switch — radio nói đúng rằng chỉ chọn được một). Dòng chưa gắn Search tag: radio **disabled**, kèm tooltip nêu lý do. |
| **Xác nhận khi đổi** | dialog trước khi `PATCH` | nêu rõ: tag nào đang Required, tag nào sắp thay, và một câu rằng tag này **hiện trên mọi dải Premium toàn site**. |
| **Nhãn trong mục "Search tag đang dùng"** | chip của dòng Required | thêm huy hiệu **Bắt buộc** và **bỏ nút ×** — không gỡ được từ đây. |
| **Cột Default** | ngay sau cột **Required** | một `Checkbox` mỗi dòng. Dòng chưa gắn Search tag, hoặc dòng đang Required: **disabled**, kèm tooltip nêu lý do. |
| **Bộ đếm Default** | thanh công cụ, cạnh bộ đếm Search tag | `Mặc định: N tag`. **N > 12 thì đổi sang màu cảnh báo** kèm tooltip: công ty tạo mới chỉ nhận được 12 tag đầu. |
| **Huy hiệu Default** | chip trong mục "Search tag đang dùng" | thêm nhãn **Mặc định**. Vẫn có nút × bình thường (gỡ × ở đây là gỡ cờ Search tag, kéo theo cả Default). |

> Dùng lại đường đã có của sub-task 1: thêm cờ `hasRequired: true` vào domain `companyHighlights` trong `master-data-domains.ts`, để `use-domain-columns.tsx` render theo cờ — **không viết nhánh `if (domain === 'companyHighlights')`**.

## 3. Default áp vào công ty ở đâu

**Không phải trong ticket này.** Ticket này chỉ dựng cái cờ. Việc chép các tag Default vào `company_search_tag` lúc tạo công ty nằm ở **sub-task 3 (SRM-1537)**, cùng chỗ với bảng đó.

Ba luật cần nhất quán giữa hai ticket:

1. **Chép một lần, lúc tạo.** Không phải liên kết sống. HQ sửa danh sách Default sau này **không đụng** tới công ty đã tồn tại — nếu không thì lần sau HQ sửa là mọi thao tác gỡ tag của người nhập liệu bị ghi đè, và hàng nghìn công ty bị viết lại từ một màn hình mà không ai biết ai yêu cầu.
2. **Chép xong là tag bình thường**: gỡ được, tính vào giới hạn 12.
3. **Công ty đã tồn tại từ trước**: mọi công ty trên hệ thống hôm nay đều có trước cờ này, nên sẽ không bao giờ nhận được Default. Đề xuất một migration một lần, chép Default **chỉ vào công ty đang có `company_search_tag` RỖNG** — không ghi đè gì, không đụng lựa chọn của ai, và xoá đi được nếu sai. **Cần chị Thu chốt trước khi chạy.**

## 4. Dữ liệu — tag nào được chọn làm Required

Migration bật cờ cho **`featured-jobs` — "✨ Việc làm nổi bật"**. Nếu mã này chưa tồn tại trong catalogue thì migration **tạo mới** nó (nhóm phù hợp, `search_tag = true`, `active = true`) rồi mới gắn Required.

> **Đây là quyết định sản phẩm, không phải kỹ thuật.** Tag này là thứ **mọi ứng viên nhìn thấy trên mọi dải Premium của toàn site**, nên nó phải đọc như một dấu hiệu chất lượng trung tính. "💻 Làm việc từ xa" chẳng hạn sẽ là một lời hứa mà phần lớn các công ty trong dải không giữ được. HQ đổi được bất cứ lúc nào tại màn này, có hiệu lực ngay ở lượt tải trang kế tiếp, không cần migration.

## 5. Acceptance

### Cờ Required

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

### Cờ Default

- [ ] `PATCH isDefault: true` lên nhiều dòng cùng lúc đều được — không có trần.
- [ ] `PATCH isDefault: true` lên dòng chưa gắn Search tag → `400`.
- [ ] `PATCH isDefault: true` lên dòng **đang Required** → `400`.
- [ ] `PATCH required: true` lên dòng **đang Default** → `400` (chặn cả hai chiều).
- [ ] `PATCH searchTag: false` lên dòng đang Default → **thành công**, và `is_default` tự về `false` trong cùng transaction.
- [ ] Sau migration: **không dòng nào** có `is_default = true`.
- [ ] Admin: checkbox bị disabled ở dòng chưa gắn Search tag và ở dòng đang Required, cả hai đều có tooltip.
- [ ] Admin: gắn Default cho 13 dòng → bộ đếm đổi màu cảnh báo kèm tooltip.
- [ ] Admin: chip của dòng Default có nhãn **Mặc định** và vẫn có nút ×.
- [ ] Cột Default không xuất hiện ở bất kỳ tab master data nào khác.

## 6. Không làm trong sub-task này

- ❌ Chọn Search tag cho từng công ty, **và việc chép tag Default vào công ty lúc tạo** — sub-task 3.
- ❌ Logic vòng quay, con trỏ, response `premiumBand` — sub-task 4.
- ❌ Giao diện hàng tag trên svn-web — sub-task 5.
- ❌ Ghi tag Required vào `company_search_tag` của từng công ty. Nó **không** được lưu per-company: svn-be thêm nó vào lúc dựng dải. Lưu 10.000 dòng giống hệt nhau chỉ để diễn đạt "mọi công ty đều có" là sai hướng.
