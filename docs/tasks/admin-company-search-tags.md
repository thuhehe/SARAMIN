# [3/5][Admin][CRM] Company page tab: mục Search tags cho từng công ty

**Sub-task 3 / 5** · **Repo:** saramin-vn-admin + svn-be · **Phụ thuộc:** sub-task 1 và 2 (cờ Search tag + cờ Required)
**Requirement:** [saramin-eta.vercel.app → CRM → Companies](https://saramin-eta.vercel.app/m/crm/companies#company-page-tab-highlights-splits-in-two-one-set-for-the-company-page-one-for-job-search)
**Mockup bấm được:** https://claude.ai/artifact/Czeaekg1FjX1PKmnV6szc4 — **màn 2 · Company page tab**

> **CẬP NHẬT 19/11/2026.** Tag Required hiện trong mục này nhưng **không sửa được**, và **chuỗi dự phòng bằng Highlights đã bị bỏ hẳn** — kéo theo nội dung banner cảnh báo phải viết lại.
>
> **CẬP NHẬT 20/11/2026.** Thêm mục 3: **công ty tạo mới nhận sẵn các tag Default**. Và trần số tag hiện trên dải đổi từ 8 → **10**.

---

## 1. Section 3 tách làm hai

Section 3 của tab Company page trước nay giữ một bộ chip: tối đa 6, chọn từ cả 76 dòng catalogue, vẽ thành dải dưới thẻ thông tin trên trang công ty công khai. Giờ nó giữ **hai** bộ, vì hai màn hình đang hỏi hai câu khác nhau. Section giữ nguyên số và tiêu đề; chỗ tách nằm bên trong.

| | 3a · Highlights | 3b · Search tags |
|---|---|---|
| Trả lời câu | "trang công ty khoe cái gì?" | "ứng viên lọc dải Premium bằng cái gì?" |
| Chọn từ | cả 76 dòng catalogue | **chỉ dòng HQ đã gắn cờ Search tag** |
| Tối đa | **6** — không đổi | **12** |
| Hiện ở | trang công ty công khai | hàng tag trong dải Premium trên `/search` |

- **Hai bộ độc lập.** Cùng một chip được phép nằm ở cả hai; bỏ ở bên này không đụng bên kia. Lưu riêng, và dải chip trên trang công ty **không đổi gì cả**.
- **Mười hai, không phải sáu.** Hàng tag lấy từ hợp các tag của mọi công ty trong dải và chỉ hiện tối đa 10 — nên 12 không phải 12 chip trên màn, mà là **12 cơ hội lọt vào 10 ô**. Công ty chọn 6 thì vào vòng quay bằng nửa công ty chọn 12. Đó là động lực đúng.
- **Dùng lại đúng dialog chọn chip của 3a** — bảng tìm kiếm được, có nhóm / mức ưu tiên / tiêu chí mỗi dòng. Chỉ khác danh sách nguồn và giới hạn. Mở từ 3b thì ghi rõ trên header, không thì danh sách ngắn hơn sẽ bị đọc như lỗi.

## 2. Tag Required — hiện, nhưng không sửa được

- Tag đang mang cờ Required (sub-task 2) **luôn hiện đầu mục 3b**: đã tick, làm mờ, có huy hiệu **Bắt buộc**, không bỏ tick được.
- Nó **không tính vào giới hạn 12**. Công ty vẫn chọn được đủ 12 tag khác.
- Kèm một dòng giải thích ngắn: *công ty nào cũng có tag này, HQ đặt trong Master data.*
- **Không ghi nó vào `company_search_tag`.** svn-be thêm vào lúc dựng dải. Lưu 10.000 dòng giống hệt nhau chỉ để nói "mọi công ty đều có" là sai hướng.

> Phải hiện nó, dù không sửa được. Người nhập liệu cần thấy công ty **đã** với tới được tag mở đầu của dải mà không phải làm gì — nếu không thì 12 ô bên dưới trông như bắt buộc, trong khi chúng là tuỳ chọn.

## 3. Công ty tạo mới nhận sẵn các tag Default

HQ đánh dấu một số dòng catalogue là **Default** ở Master data (sub-task 2, SRM-1718). Khi một công ty được **tạo mới**, chép toàn bộ các dòng đó vào `company_search_tag` của công ty đó.

| | |
|---|---|
| Chép lúc nào | **đúng lúc tạo record công ty**, trong cùng transaction |
| Chép xong là gì | **tag bình thường** — sales gỡ được, tính vào giới hạn 12 |
| Vượt 12 dòng Default | chép **12 dòng đầu** theo thứ tự catalogue, bỏ phần dư. Master data đã cảnh báo HQ chuyện này rồi |
| HQ sửa danh sách Default sau đó | **không đụng** công ty đã tồn tại |
| Tag Required | **KHÔNG** nằm trong đây — nó không lưu per-company |

> **Vì sao chép một lần chứ không phải liên kết sống.** Nếu Default là liên kết sống thì lần sau HQ sửa danh sách, mọi thao tác gỡ tag của sales bị ghi đè, và hàng nghìn công ty bị viết lại từ một màn hình mà không có dấu vết ai yêu cầu. Chép một lần là hướng an toàn và cũng là hướng trung thực duy nhất.

### Công ty đã tồn tại từ trước — cần chốt

Mọi công ty trên hệ thống hôm nay đều có trước cờ Default, nên sẽ **không bao giờ** nhận được tag mặc định. Đề xuất một migration chạy một lần:

- chép các dòng Default **chỉ vào công ty đang có `company_search_tag` RỖNG**
- **không ghi đè** gì; công ty đã có tag thì để nguyên
- xoá đi được nếu kết quả sai

**Chưa chạy cho tới khi chị Thu chốt.** Code vẫn viết, nhưng để sau một cờ bật/tắt hoặc một lệnh chạy tay.

## 4. Banner cảnh báo — viết lại

Bản cũ ghi: công ty mua placement mà chưa chọn Search tag thì hệ thống mượn tạm Highlights của trang công ty, không có nữa thì tin không thuộc tag nào. **Bỏ hết.** Tag Required khiến chuyện đó không xảy ra được.

Banner vẫn còn, nhưng nói điều nhẹ hơn và đúng hơn:

> Công ty này chưa có Search tag nào. Tin của họ vẫn lên dải Premium, nhưng **chỉ trong vòng quay của tag bắt buộc** thay vì tối đa 12 tag. Đó là **mất độ phủ, không phải vô hình.**

- Vẫn là **cảnh báo, không bao giờ chặn lưu.** Chặn lưu sẽ khoá luôn ảnh, tầm nhìn và phúc lợi chỉ vì một trường tuỳ chọn.
- Điều kiện hiện banner: **"công ty này đang có sản phẩm còn hiệu lực phủ placement của dải Premium"** — theo placement, không theo tên gói.
- "Search tags" vẫn nằm trong checklist Ready-to-publish, **không gắn sao**, vì không nhìn thấy nghĩa là chưa điền.

## 5. svn-be

```
CREATE TABLE company_search_tag (
  company_id   BIGINT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
  highlight_id BIGINT NOT NULL REFERENCES company_highlight(id) ON DELETE CASCADE,
  sort_order   INT NOT NULL,
  PRIMARY KEY (company_id, highlight_id)
);
CREATE INDEX idx_company_search_tag_company ON company_search_tag (company_id);
```

- `GET` / `PUT` dưới endpoint company page sẵn có, cạnh `company_page_highlight`.
- **Server chặn quá 12 dòng mỗi công ty** — đừng để UI là lớp bảo vệ duy nhất.
- **Server từ chối `highlight_id` chưa gắn cờ Search tag** → `400`.
- **Server từ chối ghi tag đang Required vào bảng này** → `400`. Nó không thuộc về đây.
- Gỡ cờ Search tag của một chip (sub-task 1) đã xoá nó khỏi mọi công ty trong cùng transaction — hành vi đó giữ nguyên.

## 6. Acceptance

- [ ] Mục 3b chỉ liệt kê chip đã gắn cờ Search tag; chip chưa gắn không xuất hiện trong dialog.
- [ ] Chọn tới 12 tag được; tag thứ 13 bị chặn ở UI **và** `PUT` 13 dòng bị server trả `400`.
- [ ] Tag Required hiện đầu 3b, đã tick, làm mờ, có huy hiệu **Bắt buộc**, không bỏ tick được.
- [ ] Tag Required **không** tính vào 12 — chọn đủ 12 tag khác vẫn lưu được.
- [ ] Sau khi lưu, `company_search_tag` **không chứa** id của tag Required.
- [ ] `PUT` kèm id tag Required → `400`.
- [ ] `PUT` kèm id chưa gắn cờ Search tag → `400`.
- [ ] Thêm / bớt ở 3b **không làm đổi** 3a, và ngược lại.
- [ ] Công ty có sản phẩm phủ placement nhưng 3b rỗng → hiện banner mới, **và vẫn lưu được**.
- [ ] Công ty không có sản phẩm phủ placement → không hiện banner.
- [ ] Dải chip trên trang công ty công khai không đổi.

### Tag Default

- [ ] HQ gắn Default cho 5 tag → tạo công ty mới → công ty đó có **đúng 5 dòng** trong `company_search_tag`, đúng 5 tag đó.
- [ ] Sales gỡ 2 trong 5 tag đó → lưu được, còn 3 dòng.
- [ ] HQ **đổi** danh sách Default sau đó → công ty vừa tạo ở trên **không đổi một dòng nào**.
- [ ] HQ gắn Default cho 15 tag → tạo công ty mới → chỉ **12 dòng đầu theo thứ tự catalogue** được chép.
- [ ] Không dòng Default nào trùng id với tag Required.
- [ ] Không gắn Default cho tag nào → tạo công ty mới → `company_search_tag` rỗng, **vẫn lưu được**, banner cảnh báo hiện bình thường.

## 7. Không làm trong sub-task này

- ❌ Cột Search tag / Required / Default trong Master data — sub-task 1 và 2.
- ❌ Vòng quay, con trỏ, response `premiumBand` — sub-task 4.
- ❌ Giao diện hàng tag trên svn-web — sub-task 5.
