# [5/5][FE] svn-web: vẽ hàng tag + đếm lượt hiển thị

**Sub-task 5 / 5** · **Repo:** svn-web · **Phụ thuộc:** sub-task 4 phải **live trên môi trường đang test** trước
**Requirement:** [saramin-eta.vercel.app → "THE BLUE ZONE'S TAG ROW"](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-and-a-rotation-that-gives-every-job-the-same-chance-at-the-three-visible-cards)
**Prototype bấm được:** https://saramin-eta.vercel.app/mockups?screen=js-search

> **Spring bỏ qua `@RequestParam` lạ mà không báo lỗi.** Sub-task này lên trước sub-task 4 thì không có lỗi nào xuất hiện ở đâu cả — hàng tag chỉ đơn giản không hoạt động. Đừng đảo thứ tự.

> **CẬP NHẬT 19/11/2026:** khoá response đổi `deal` → `cards`, thêm `bandSeq`, và tag đầu tiên giờ là tag bắt buộc do BE đánh dấu.

---

## 1. Vẽ hàng tag

File: `features/jobs/search/ui/premium-jobs-band.tsx`.

- Hàng tag nằm **giữa tiêu đề dải và các card**, cuộn ngang với mũi tên `‹ ›` ở hai đầu.
- Tag đang chọn: viền và chữ màu brand, in đậm. Tag khác: nền trắng, viền trong suốt.
- **Vào trang thì `tags[0]` được chọn sẵn** — đó là tag bắt buộc, BE luôn đặt ở vị trí đầu và đánh dấu `required: true`. Không có nút "Tất cả", không có trạng thái không chọn gì.
- **Không hiện số đếm** trên bất kỳ tag nào. BE cũng không trả.
- `tags.length === 0` → **không vẽ hàng tag**, dải giữ nguyên hành vi hôm nay.

## 2. Vẽ card — cắt trang, không sắp xếp

- `cards[tagĐangChọn]` là **danh sách id tối đa 10, ĐÃ đúng thứ tự hiển thị**. Tra sang `jobs` theo id để lấy dữ liệu.
- Cắt thành **trang 3 thẻ**: `3 + 3 + 3 + 1`. Mũi tên `‹ ›` lật **nguyên một trang**, không nhích từng card.
- **FE không sắp xếp, không lọc, không cắt bớt, không xáo** — đúng như comment đang có trong component. Mọi luật đã chạy ở BE.
- Đổi tag → **quay về trang 1** của carousel.
- **Đổi tag là đổi tức thì:** không gọi lại server, không đổi URL, không ghi thêm log tìm kiếm, danh sách kết quả bên dưới không đổi. Toàn bộ dữ liệu đã nằm trong response đầu tiên.

## 3. `bandSeq` — thứ làm dải xoay vòng

Con trỏ của BE cần biết đây là lượt tải thứ mấy. Nếu FE không gửi, `bandSeq` mặc định 0 và **dải sẽ đứng yên mãi mãi** — mọi ứng viên thấy đúng 3 tin đó, đúng thứ mà cả thiết kế này sinh ra để chống.

- Giữ một số nguyên trong `sessionStorage`, **tăng 1 mỗi lần trang tìm kiếm được tải**, gửi kèm request tìm kiếm.
- `sessionStorage`, không phải `localStorage`: mở tab mới nên là một phiên mới.
- Không reset khi đổi từ khoá — BE đã khoá con trỏ theo nội dung dải, nên cùng một bộ đếm dùng chung cho mọi từ khoá là đúng.

## 4. Đếm lượt hiển thị

- **Chỉ đếm card NHÌN THẤY.** Một response mang tới 10 tag × 10 card; ứng viên thấy 3. Đếm nguyên response thì báo cáo của khách hàng phồng lên khoảng 10 lần.
- Một card được tính khi **tag của nó đang được chọn** *và* **nó nằm trong 3 ô đang hiện**. Lật trang carousel sang 3 card mới thì 3 card đó mới được tính.
- **Ghi lại mọi cú bấm tag** (`tag_select`, BE đã nhận trong sub-task 4). Đây là bằng chứng duy nhất về việc tag nào có người dùng, và là căn cứ duy nhất để sau này cắt bớt danh sách tag.

## 5. Acceptance

- [ ] Vào trang: tag đầu tiên đã ở trạng thái chọn, dải hiện 3 card đầu của tag đó.
- [ ] Bấm tag khác: dải đổi ngay, không loading, carousel về trang 1.
- [ ] Bấm qua lại giữa hai tag nhiều lần: nội dung mỗi tag **không đổi** trong cùng một lần tải trang.
- [ ] Mũi tên lật đúng **3 card** một lần, không phải 1.
- [ ] URL, danh sách kết quả và bộ lọc bên trái **không đổi** khi bấm tag.
- [ ] **F5 vài lần: 3 card đầu đổi sang tin khác** — nếu không đổi thì `bandSeq` chưa chạy.
- [ ] F5 đủ `số tin ÷ 3` lần thì quay lại đúng bộ card ban đầu.
- [ ] Mở tab mới → `bandSeq` bắt đầu lại từ 0.
- [ ] Không tag nào hiện số đếm.
- [ ] `tags: []` → không có hàng tag, dải vẫn vẽ bình thường.
- [ ] Lượt hiển thị chỉ ghi cho 3 card đang thấy, không ghi cho cả 10 và không ghi cho tag chưa chọn.
- [ ] Bấm tag ghi đúng một sự kiện `tag_select`.

## 6. Không làm trong sub-task này

- ❌ Tự sắp xếp, lọc hay cắt `cards` ở FE.
- ❌ Gọi lại server khi đổi tag.
- ❌ Đụng Top section hoặc danh sách kết quả chính.
