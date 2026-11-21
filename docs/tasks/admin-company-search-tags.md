# [3/5][Admin][CRM] Company page tab: mục Search tags cho từng công ty

**Sub-task 3 / 5** · **Repo:** saramin-vn-admin + svn-be · **Phụ thuộc:** sub-task 1 và 2 (cờ Search tag + cờ Required)
**Requirement:** [saramin-eta.vercel.app → CRM → Companies](https://saramin-eta.vercel.app/m/crm/companies#company-page-tab-highlights-splits-in-two-one-set-for-the-company-page-one-for-job-search)
**Mockup bấm được:** https://claude.ai/artifact/Czeaekg1FjX1PKmnV6szc4 — **màn 2 · Company page tab**

> **CẬP NHẬT 19/11/2026.** **Chuỗi dự phòng bằng Highlights đã bị bỏ hẳn** — kéo theo nội dung banner cảnh báo phải viết lại. Trần số tag hiện trên dải đổi 8 → **10**.
>
> ## ⚠️ VIẾT LẠI 21/11/2026 — bỏ hai thứ khỏi ticket này
>
> **1. Mục "công ty tạo mới nhận sẵn tag Default" đã XOÁ**, cùng với bước chép một lần cho công ty cũ. Cờ Default không còn tồn tại (xem SRM-1718). **Đừng cài từ bản 20/11.**
>
> **2. Tag Required KHÔNG hiện trong mục 3b nữa.** Bản trước ghi nó hiện ở đây dạng tick sẵn + làm mờ — sai. Tag Required gắn vào **TIN ĐĂNG**, không công ty nào "có" nó, nên nó không thuộc danh sách này.

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

## 2. Tag Required KHÔNG nằm trong mục này

Mục 3b là danh sách tag **công ty này có**. Tag Required thì **không công ty nào "có"** — nó gắn vào mọi tin đăng trên hệ thống, do HQ đặt một lần trong Master data (SRM-1718).

- **Không hiện tag Required trong picker của 3b**, kể cả dạng tick sẵn làm mờ. Để nó vào danh sách này là làm nó trông như một thuộc tính của công ty mà một ngày nào đó có người bỏ tick được.
- **Không ghi nó vào `company_search_tag`.** svn-be gắn lúc dựng dải. Lưu 10.000 dòng giống hệt nhau chỉ để nói "mọi tin đều có" là sai hướng.
- **Không tính vào giới hạn 12** — không liên quan, nó đâu nằm trong danh sách.

Thay vào đó, **một dòng chú thích dưới mục 3b**:

> *Ngoài các tag chọn ở đây, mọi tin của công ty còn mang sẵn các tag bắt buộc do HQ đặt.*

Dòng đó nói cho người nhập liệu biết họ đang chọn **thêm vào trên nền gì**, mà không bịa ra một dòng họ không sở hữu.

## 3. Banner cảnh báo — viết lại

Bản cũ ghi: công ty mua placement mà chưa chọn Search tag thì hệ thống mượn tạm Highlights của trang công ty, không có nữa thì tin không thuộc tag nào. **Bỏ hết.** Tag Required khiến chuyện đó không xảy ra được.

Banner vẫn còn, nhưng nói điều nhẹ hơn và đúng hơn:

> Công ty này chưa có Search tag nào. Tin của họ vẫn lên dải Premium, nhưng **chỉ trong vòng quay của tag bắt buộc** thay vì tối đa 12 tag. Đó là **mất độ phủ, không phải vô hình.**

- Vẫn là **cảnh báo, không bao giờ chặn lưu.** Chặn lưu sẽ khoá luôn ảnh, tầm nhìn và phúc lợi chỉ vì một trường tuỳ chọn.
- Điều kiện hiện banner: **"công ty này đang có sản phẩm còn hiệu lực phủ placement của dải Premium"** — theo placement, không theo tên gói.
- "Search tags" vẫn nằm trong checklist Ready-to-publish, **không gắn sao**, vì không nhìn thấy nghĩa là chưa điền.

## 4. svn-be

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

## 5. Acceptance

- [ ] Mục 3b chỉ liệt kê chip đã gắn cờ Search tag; chip chưa gắn không xuất hiện trong dialog.
- [ ] Chọn tới 12 tag được; tag thứ 13 bị chặn ở UI **và** `PUT` 13 dòng bị server trả `400`.
- [ ] Tag Required **không xuất hiện** trong picker của 3b, kể cả dạng tick sẵn làm mờ.
- [ ] Dòng chú thích về tag bắt buộc hiện dưới mục 3b.
- [ ] Sau khi lưu, `company_search_tag` **không chứa** id của bất kỳ tag Required nào.
- [ ] `PUT` kèm id tag Required → `400`.
- [ ] `PUT` kèm id chưa gắn cờ Search tag → `400`.
- [ ] Thêm / bớt ở 3b **không làm đổi** 3a, và ngược lại.
- [ ] Công ty có sản phẩm phủ placement nhưng 3b rỗng → hiện banner mới, **và vẫn lưu được**.
- [ ] Công ty không có sản phẩm phủ placement → không hiện banner.
- [ ] Dải chip trên trang công ty công khai không đổi.

## 6. Không làm trong sub-task này

- ❌ Cột Search tag / Required trong Master data — sub-task 1 và 2.
- ❌ Cờ Default và bước chép cho công ty cũ — **đã xoá khỏi scope**, đừng cài từ bản 20/11.
- ❌ Vòng quay, con trỏ, response `premiumBand` — sub-task 4.
- ❌ Giao diện hàng tag trên svn-web — sub-task 5.
