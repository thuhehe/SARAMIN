# [2/5][Admin][Master data] Company highlights: cờ Required — 1 hoặc nhiều tag, gắn vào mọi tin

**Sub-task 2 / 5** · **Repo:** saramin-vn-admin + svn-be · **Phụ thuộc:** sub-task 1 (cờ Search tag) phải xong trước
**Requirement:** [saramin-eta.vercel.app → Admin · System → Master data](https://saramin-eta.vercel.app/m/admin-system/master-data#company-highlights-carry-two-more-flags-search-tag-and-required-and-neither-is-the-priority-column)
**Giải thích cho khách:** https://claude.ai/artifact/SV4xrNdEktZuvJLFXtCra2

> ## ⚠️ VIẾT LẠI 21/11/2026 — hai chỗ của bản cũ sai
>
> **1. Cờ Default đã bị XOÁ.** Bản 20/11 có một cờ thứ hai tên Default, chép tag vào công ty lúc tạo mới. Bỏ hoàn toàn: nó là câu trả lời thứ hai cho đúng câu hỏi mà Required đã trả lời, và trên thực tế hai cờ đang bị đọc nhầm thành một. **Đừng cài Default từ bản cũ.** Bước chép một lần cho công ty cũ cũng bỏ theo.
>
> **2. Required KHÔNG phải "đúng một dòng".** Là **một hoặc nhiều** dòng, và nó gắn vào **TIN ĐĂNG**, không phải vào công ty.

---

## 0. Việc này là gì, nói một lần cho gọn

Hai bước, trên cùng một màn:

1. Trong bảng Master data, bật **Search tag** cho những dòng được phép dùng làm tag tìm kiếm *(sub-task 1, đã xong)*.
2. **Trong số các Search tag đó**, tick **Required** cho **một hoặc nhiều** dòng.

Tag Required được **mọi tin đăng mang theo** — tin đang mở hiện tại và mọi tin tạo về sau. Nhà tuyển dụng **không phải tự thêm** và **không gỡ được**; trên form đăng tin không có gì để họ đụng vào.

**Vì sao cần:** dải Premium **luôn có đúng một tag đang được chọn**, không có nút "Tất cả". Nên một tin không thuộc tag nào sẽ **không bao giờ xuất hiện** — khách trả tiền, tin không lên dải, không có lỗi nào báo ở đâu. Tag Required làm chuyện đó không thể xảy ra.

## 1. svn-be: thêm cột `required`

```
ALTER TABLE company_highlight ADD COLUMN required BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_company_highlight_required ON company_highlight (required) WHERE required;
```

Không còn unique index — **nhiều dòng được phép TRUE**.

- `GET /admin/master-data/company-highlights` trả thêm `required: boolean`.
- `PATCH .../{id}` nhận `required`.
- **Chỉ dòng đã có `search_tag = true` mới được tick Required** → vi phạm trả `400`.
- **Ràng buộc bất biến — siết hơn "không được 0 dòng"** (sửa 23/11 sau câu hỏi của svn-be):

  > **Luôn phải còn ít nhất MỘT dòng vừa `search_tag = true`, vừa `required = true`, vừa `active = true`.**

  Lý do phải có `active`: tag bị tắt active thì không render được, nên hệ thống có đúng 1 dòng Required đang inactive *vẫn thoả* ràng buộc "≥1 dòng Required" mà dải thì không có tag nào để mở.

  Ba thao tác sau, **nếu nhắm vào dòng hợp lệ cuối cùng** → `400`: `DELETE` dòng đó · `PATCH searchTag: false` · `PATCH active: false`. Còn dòng hợp lệ khác thì **cả ba đều cho phép**, và khi gỡ `search_tag` thì `required` tự về `false` trong cùng transaction.

- **Đếm trong cùng transaction với lệnh ghi.** Có nhiều dòng Required thì sinh ra một race ngược: 2 dòng đang Required, 2 admin cùng lúc mỗi người bỏ tick một dòng, cả hai cùng đọc "còn 2, bỏ 1 vẫn còn 1", cả hai cùng qua → **kết quả 0 dòng**. Phải `SELECT … FOR UPDATE` tập dòng Required rồi đếm trong cùng transaction, không đọc trước ghi sau. Bên thua nhận `409` kèm "vừa có người đổi, tải lại trang".
- Migration bật sẵn Required cho `featured-jobs` (xem mục 3) — để hệ thống không bao giờ ở trạng thái 0 dòng.

### ⛔ KHÔNG ghi tag Required vào từng tin đăng

Gắn lúc **dựng dải**, không lưu xuống DB. Lưu xuống thì kéo theo:

- một lần backfill toàn bộ tin đang mở ngay hôm HQ bật cờ
- **một lần backfill nữa mỗi lần HQ đổi danh sách Required**
- dòng bị lệch mỗi khi tin được sửa hoặc đăng lại
- một cột mà một form nào đó trong tương lai có thể xoá nhầm

Suy ra lúc dựng dải thì **không tốn gì**, **tự động phủ luôn tin đang mở**, và câu "nhà tuyển dụng không gỡ được" đúng *theo thiết kế* chứ không phải nhờ một cái chốt mà sáu tháng nữa có người quên.

## 2. Admin: cột Required

Màn: **System → Master data → tab Company highlights**, cùng chỗ cờ Search tag của sub-task 1.

| Cái gì | Ở đâu | Hành vi |
|---|---|---|
| **Cột Required** | ngay sau cột **Search tag** | một `Checkbox` mỗi dòng (**không phải Radio** — chọn được nhiều). Dòng chưa bật Search tag: **disabled**, tooltip nêu lý do. |
| **Bộ đếm Required** | thanh công cụ, cạnh bộ đếm Search tag | `Bắt buộc: N tag`. N cũng chính là số chip **không lọc được gì** trên dải — xem mục 4. |
| **Chặn về 0** | khi thao tác nhắm vào dòng hợp lệ cuối cùng | không cho bỏ tick Required, không cho tắt Switch Search tag, không cho tắt `active`. Kèm một dòng giải thích: *phải còn ít nhất 1 tag bắt buộc đang bật, nếu không sẽ có tin không thuộc tag nào và không bao giờ hiện trên dải.* Switch Search tag chỉ disable **có điều kiện** — các dòng Required khác vẫn gỡ được bình thường. |
| **Huy hiệu Required** | chip trong mục "Search tag đang dùng" | thêm nhãn **Bắt buộc**. Dòng Required cuối cùng **bỏ nút ×**. |

> Dùng lại đường đã có của sub-task 1: thêm cờ `hasRequired: true` vào domain `companyHighlights` trong `master-data-domains.ts`, để `use-domain-columns.tsx` render theo cờ — **không viết nhánh `if (domain === 'companyHighlights')`**.

## 3. Dữ liệu — tag nào bật sẵn

Migration bật Required cho **`featured-jobs` — "✨ Việc làm nổi bật"**. Nếu mã này chưa có trong catalogue thì migration **tạo mới** (nhóm phù hợp, `search_tag = true`, `active = true`) rồi mới tick Required.

> **Đây là quyết định sản phẩm, không phải kỹ thuật.** Các tag Required là thứ **mọi ứng viên nhìn thấy trên mọi dải Premium toàn site**, in trên mọi tin của mọi nhà tuyển dụng. Nên chúng phải đọc như dấu hiệu chất lượng trung tính. "💻 Làm việc từ xa" sẽ là một lời hứa mà phần lớn công ty trong dải không giữ được. HQ đổi bất cứ lúc nào tại màn này, có hiệu lực ngay lượt tải trang kế tiếp — **không migration, không backfill**, đúng vì ta không lưu xuống tin.

## 4. Tick thêm một tag Required thì mất gì

Mỗi tag Required phủ **toàn bộ** dải, nên nó cũng là **một chip không lọc được gì**.

- 2 tag Required = 2 chip như nhau. 3 = 3.
- Các tag Required **chiếm các ô đầu**, nên dải nhỏ sẽ bị chúng lấn hết phần xoay vòng: dải **12 tin** chỉ hiện **4 chip** — 3 tag Required thì còn đúng **1 ô** cho tag lọc thật.
- Nếu các tag Required chiếm hết số ô thì dải chỉ hiện chúng, không có gì xoay vòng.

**Khuyến nghị 1–2 tag.** Bộ đếm trên thanh công cụ có mặt chính là để HQ thấy mình đang chọn cái gì.

## 5. Acceptance

- [ ] Sau migration: **ít nhất một** dòng có `required = true`, trong đó có `featured-jobs`, và dòng đó cũng có `search_tag = true`.
- [ ] Tick Required cho **3 dòng cùng lúc** → đều thành công, không dòng nào bị bỏ tick tự động.
- [ ] `PATCH required: true` lên dòng chưa bật Search tag → `400`.
- [ ] Còn đúng 1 dòng Required active, bỏ tick Required nó → `400`, UI nêu rõ lý do.
- [ ] Còn đúng 1 dòng Required active, `PATCH searchTag: false` lên nó → `400`.
- [ ] Còn đúng 1 dòng Required active, `PATCH active: false` lên nó → `400`.
- [ ] Còn đúng 1 dòng Required active, `DELETE` nó → `400`.
- [ ] Có 3 dòng Required active, `PATCH active: false` lên một dòng → **thành công**, còn 2.
- [ ] **Race:** 2 dòng Required, hai request bỏ tick hai dòng khác nhau gửi đồng thời → đúng một request thành công, request kia nhận `409`; kết quả cuối **vẫn còn ≥ 1 dòng**.
- [ ] Có 3 dòng Required, `PATCH searchTag: false` lên một dòng → **thành công**, `required` của dòng đó tự về `false`, còn 2 dòng.
- [ ] Thử ghi thẳng vào DB cho `required = true` ở 5 dòng → **được phép** (không có unique index).
- [ ] Xoá hết `required` thẳng trong DB rồi gọi API dựng dải → hệ thống **không crash**; có log cảnh báo rõ ràng.
- [ ] Admin: checkbox disabled ở dòng chưa bật Search tag, có tooltip.
- [ ] Admin: bộ đếm `Bắt buộc: N tag` khớp số dòng đang tick.
- [ ] Admin: chip Required trong mục "Search tag đang dùng" có nhãn **Bắt buộc**; chip Required cuối cùng không có nút ×.
- [ ] Cột Required không xuất hiện ở bất kỳ tab master data nào khác.
- [ ] **Không có bảng/cột nào lưu tag Required xuống từng tin đăng.**

## 6. Không làm trong sub-task này

- ❌ **Cờ Default** — đã xoá khỏi scope, đừng cài từ bản 20/11.
- ❌ Bước chép một lần cho công ty cũ — bỏ theo cờ Default.
- ❌ Chọn Search tag cho từng công ty — sub-task 3.
- ❌ Logic vòng quay, con trỏ, response `premiumBand` — sub-task 4.
- ❌ Giao diện hàng tag trên svn-web — sub-task 5.
- ❌ Thêm gì đó vào form đăng tin. Nhà tuyển dụng không thấy, không thêm, không gỡ — không có UI nào cần làm.
