# [4/5][BE] svn-be: vòng quay + con trỏ + response `premiumBand`

**Sub-task 4 / 5** · **Repo:** svn-be · **Phụ thuộc:** sub-task 1–3 (cần `company_search_tag` và cờ Required có dữ liệu)
**Requirement:** [saramin-eta.vercel.app → "THE BLUE ZONE'S TAG ROW"](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-and-a-rotation-that-gives-every-job-the-same-chance-at-the-three-visible-cards)
**Giải thích cho khách (có ví dụ chạy được):** https://claude.ai/artifact/SV4xrNdEktZuvJLFXtCra2

> **VIẾT LẠI 19/11/2026 — luật chia bài đã bị bỏ hoàn toàn.** Nếu bạn đã đọc bản trước của ticket này, bỏ hết: không còn xáo, không còn chia vòng tròn, không còn "mỗi tag mở ra một tập khác nhau". Đọc lại từ đầu.

---

## 0. Vì sao đổi

Khách chốt lại mục tiêu của dải: **chỗ duy nhất thật sự có người nhìn là 3 thẻ của tag đang mở**, và mọi tin trong dải đều phải có cơ hội như nhau để lọt vào 3 ô đó. Thứ nằm sau mũi tên hay sau cú bấm tag thứ hai là chuyện phụ.

Luật chia bài cũ tối ưu cho **sự khác nhau giữa các tag** — không phải mục tiêu này. Nên thay bằng **vòng quay**: mỗi tag giữ tin của nó trong một vòng cố định, con trỏ nhích 3 ô mỗi lượt tải trang, sau `số tin ÷ 3` lượt là mọi tin đã vào 3 ô đầu **đúng một lần**.

**Đánh đổi phải nói rõ:** mô hình cũ bảo đảm mỗi tag mở ra một tập tin khác nhau. Mô hình mới **không** bảo đảm điều đó. Cố ý.

## 1. Response

`GET /api/{lang}/jobs/search?...&premiumOnly=true` → thêm `premiumBand` bên cạnh `items` hiện có (giữ `items` nguyên, để web chưa cập nhật vẫn chạy):

```
"premiumBand": {
  "tags": [
    { "id": "chl-featured", "name": "✨ Việc làm nổi bật", "required": true },
    { "id": "chl-13th",     "name": "💰 Lương tháng 13" }
  ],
  "jobs": [ { "id": "job-1", "title": "…", "companyName": "…", "…": "…" } ],
  "cards": {
    "chl-featured": ["job-7", "job-1", "job-9", "…"],
    "chl-13th":     ["job-14", "job-16", "job-17", "…"]
  }
}
```

- Khoá đổi tên `deal` → **`cards`**. Tên cũ mô tả việc chia bài đã bỏ.
- `cards[tag]` = **tối đa 10 id, đã đúng thứ tự hiển thị**, tính từ con trỏ của tag đó. FE chỉ cắt thành trang 3 thẻ, không sắp xếp lại.
- `jobs` chứa **mỗi tin đúng một lần**; `cards` trỏ bằng id. Một tin **được phép** nằm ở nhiều tag — đây là thay đổi so với bản cũ.
- `tags[0]` **luôn** là tag required, và chỉ nó có `"required": true`.
- Không có `count` ở bất kỳ đâu.

## 2. Luật

| # | Luật |
|---|---|
| **1** | **Tin vào dải**: như hiện tại (sản phẩm phủ placement + khớp từ khoá). Luật dưới đây không thêm/bớt tin nào, chỉ quyết định thứ tự. |
| **2** | **Tag required**: đúng một dòng catalogue có cờ Required. Nó phủ **mọi tin trong dải** — định nghĩa theo TIN, không theo công ty (xem §4 câu 5). Luôn ở `tags[0]`, luôn được chọn sẵn. |
| **3** | **Tag khác ứng cử** = hợp `company_search_tag` của mọi công ty có tin trong dải. **Loại tag lọc ra dưới 3 tin.** Không có luật trần. |
| **4** | **Số tag hiện** = `số tin trong dải ÷ 3` (làm tròn xuống), **tối đa 8, tối thiểu 3**. Dưới 3 → `tags: []`, FE ẩn cả hàng tag. |
| **5** | **Thứ tự tag**: slot 1 là tag required. Các slot còn lại **xoay vòng** — con trỏ trên danh sách tag ứng cử nhích `số tag hiện − 1` mỗi lượt tải. **Không ngẫu nhiên ở bất kỳ đâu.** |
| **6** | **Luôn đúng một tag được chọn**, là tag required khi vào trang. Không có nút "Tất cả". |
| **7** | **Mỗi tag một vòng riêng**: các tin tag đó phủ, xếp sao cho **mỗi công ty rải đều khắp vòng** — công ty có 12/33 tin thì cứ ~3 ô một tin, công ty 3 tin thì cứ ~11 ô một tin. **KHÔNG dùng round-robin** (luật cũ): nó vét hết công ty nhỏ trước rồi để công ty lớn chiếm cả đuôi vòng. |
| **7b** | **Sửa vòng**: chỗ nào **3 ô liền nhau cùng công ty** thì nhấc tin ở giữa ra, cắm vào chỗ ít đụng nhất. Lặp tới khi hết hoặc không cải thiện được nữa. |
| **8** | **Con trỏ**: nhích **3 mỗi lượt tải trang, cộng thêm 1 bước mỗi khi vòng lại từ đầu**. Bước cộng thêm là bắt buộc — vòng có độ dài chia hết cho 3 mà không có nó thì **mọi tin bị ghim chết vào một ô vĩnh viễn** (ví dụ 33 tin: 33/33 tin bị kẹt; có bước cộng thêm: 0/33). Nhích **3**, tuyệt đối không nhích 10. |
| **9** | **Rút thẻ**: tối đa 10 thẻ từ con trỏ, chia thành trang 3 + 3 + 3 + 1. **Trong một trang 3 thẻ, một công ty tối đa 2 thẻ** — tới thẻ thứ 3 của công ty đó thì bỏ qua, lấy tin kế tiếp trên vòng. Không còn gì để thay (dải chỉ 1 công ty) thì cứ điền. |
| **10** | **Không trả `count`.** |

> **Luật 9 là no-op khi không có công ty áp đảo.** Kiểm trên ví dụ 33 tin / 6 công ty: không đổi một lượt nào. Nó chỉ kích hoạt khi một công ty nắm > 2/3 số tin.

## 3. Xác định "lượt tải trang"

Con trỏ cần một bộ đếm. **Không dùng `Random`, không dùng timestamp thô.**

- Nhận thêm query param `bandSeq` (số nguyên, mặc định 0) do FE gửi, hoặc suy từ một counter theo session. Chốt cách nào tuỳ BE, miễn thoả: **cùng một request + cùng `bandSeq` → cùng một dải** (để bug report tái hiện được), và **người dùng F5 thì `bandSeq` tăng**.
- Khoá con trỏ theo **hash của danh sách id đã sắp xếp của dải**, không phải một counter toàn cục — hai từ khoá khác nhau là hai dải khác nhau, không được dùng chung con trỏ.

## 4. Trả lời 7 câu hỏi của Long (comment 16/11)

1. **Dải đọc tối đa bao nhiêu tin?** Bỏ giới hạn 50. Đọc **id của toàn bộ tập đủ điều kiện** (rẻ) vì đó mới là thứ vòng quay chạy trên; chỉ **hydrate đầy đủ ≤ 80 id** thật sự vào response. Cắt tập đủ điều kiện sẽ **đóng băng vĩnh viễn** những tin nằm ngoài — đúng thứ mô hình này sinh ra để chống.
2. **Luật 4 khi không đủ tag:** "số tin trong dải" là **toàn bộ tin của dải** (tag required phủ hết nên không còn phân biệt). Dưới 3 tag ứng cử → `tags: []`, ẩn hẳn hàng tag, **không** hiện 2 tag.
3. **Luật 3b (tag đầu phủ nhiều công ty nhất):** **BỎ.** Tag required thay thế hoàn toàn.
4. **Luật 8 cũ (2 card liền nhau không cùng công ty):** **BỎ.** Thay bằng luật 7/7b (xếp vòng) + luật 9 (rút thẻ).
5. **Tin đăng ẩn danh:** không có công ty nên không có company tag — nhưng **tag required định nghĩa theo TIN, không theo công ty**, nên tin ẩn danh vẫn nằm trong vòng của tag required. Không mất tin nào.
6. **Chuỗi dự phòng bằng Highlights:** **BỎ HẲN.** Tag required làm nó không thể với tới: không công ty nào có tin không thuộc tag nào nữa.
7. **Tiếng Hàn:** đúng, `/ko` dùng tên tiếng Anh. Catalogue không có cột tiếng Hàn và không bổ sung trong scope này.

## 5. Acceptance

- [ ] Dải 33 tin / 6 công ty → `tags` có 8 phần tử, `tags[0].required === true`.
- [ ] Gọi 11 lượt liên tiếp với `bandSeq` 0→10, gom 3 id đầu của `cards[tag required]` mỗi lượt → **đúng 33 id, không trùng cái nào**.
- [ ] Gọi tiếp lượt 11→21: mỗi tin xuất hiện ở **ô khác** so với vòng trước (không tin nào ở nguyên một vị trí).
- [ ] Mọi trang 3 thẻ của mọi tag: **không có 3 thẻ cùng một công ty**, trừ khi dải chỉ có 1 công ty.
- [ ] Dải MB 28 tin + 2 công ty nhỏ 5 tin → **0 trang nào có 3 thẻ MB**.
- [ ] Cùng request + cùng `bandSeq` gọi 2 lần → response **giống hệt** nhau.
- [ ] Dải 8 tin → `tags: []`.
- [ ] Công ty không có `company_search_tag` → tin vẫn ra, nằm trong vòng của tag required.
- [ ] Tin đăng ẩn danh → có mặt trong `cards[tag required]`.
- [ ] Mọi id trong `cards` tồn tại trong `jobs`; `jobs` không có id trùng; không có field `count`.
- [ ] `/ko` trả `tags[].name` tiếng Anh, không lỗi.

## 6. Không làm trong sub-task này

- ❌ Giao diện hàng tag — sub-task 5.
- ❌ Param lọc theo tag: FE không gọi lại server khi đổi tag.
- ❌ Trả `count`.
- ❌ Đụng Top section hoặc thứ tự danh sách kết quả chính.
