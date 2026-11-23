# [Premium] Hàng tag trong dải Premium trên trang tìm kiếm (company tag)

**Module:** Job management · Admin · CRM · **Site:** svn-web + svn-be + saramin-vn-admin
**Requirement (nguồn đúng):** [saramin-eta.vercel.app → "THE BLUE ZONE'S TAG ROW"](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-and-a-rotation-that-gives-every-job-the-same-chance-at-the-three-visible-cards)
**Giải thích cho khách (bấm được, có ví dụ chạy):** https://claude.ai/artifact/SV4xrNdEktZuvJLFXtCra2
**Prototype:** https://saramin-eta.vercel.app/mockups?screen=js-search
**Tham khảo:** Saramin KR — dải "쉿! 회원님에게만 알려주는 공고" trên `/zf_user/search`

> Task cha: bối cảnh, lý do, thứ tự làm. Luật chi tiết và acceptance nằm ở **5 sub-task**.

---

## 0. Việc này là gì

Thêm **một hàng tag ngay dưới tiêu đề dải Premium** trên `/search`. Bấm một tag thì các card trong dải đổi sang nhóm tin khác. Danh sách kết quả bên dưới không đụng tới.

Dải đã chạy (svn-be **V488** `bundle_is_premium`, FE `features/jobs/search/ui/premium-jobs-band.tsx`): chèn sau 3 dòng kết quả đầu, chỉ trang 1, 10 card xem 3 card một lượt.

Nguồn tag là **company tag** — catalogue `company_highlight`. Không dùng job card tag, không dùng trường của job: chỉ catalogue này mới có emoji, mà emoji trên mỗi tag là một phần của thiết kế.

## 1. VIẾT LẠI 19/11/2026 — đọc kỹ nếu bạn đã xem bản cũ

Bản đầu của task này xây quanh **luật chia bài**: xáo tin một lần rồi chia vòng tròn cho các tag, sao cho **mỗi tag mở ra một tập tin khác nhau**. Toàn bộ phần đó **đã bị bỏ**.

Khách chốt lại mục tiêu: **chỗ duy nhất thật sự có người nhìn là 3 thẻ của tag đang mở**, và mọi tin trong dải phải có cơ hội như nhau để lọt vào 3 ô đó. Thứ nằm sau mũi tên hay sau cú bấm tag thứ hai là chuyện phụ.

Thay bằng **vòng quay**: mỗi tag giữ tin trong một vòng cố định, con trỏ nhích 3 ô mỗi lượt tải trang. Sau `số tin ÷ 3` lượt, mọi tin đã vào 3 ô đầu **đúng một lần** — không phải trung bình, mà đúng một lần.

**Đánh đổi, phải nói rõ khi trình bày:** mô hình cũ bảo đảm mỗi tag mở ra một tập khác nhau. Mô hình mới **không** bảo đảm điều đó. Đây là đổi có chủ ý: lấy *công bằng về lượt hiện* thay cho *sự đa dạng giữa các tag*.

**Luật đã xoá hẳn** (đừng cài từ bản cũ): xáo-rồi-chia (luật 5), tag ít tin chia trước (5b), tag ưu tiên công ty đang giữ ít nhất (5c), tag đầu phải phủ nhiều công ty nhất (3b), và chuỗi dự phòng 2 bước bằng Highlights.

## 2. Hai thứ mới trong Master data

| | |
|---|---|
| **Cờ Search tag** | đánh dấu dòng catalogue nào được dùng làm tag tìm kiếm. Đã làm xong (sub-task 1). |
| **Cờ Required** | **MỚI 19/11.** Đúng **một** dòng catalogue mang cờ này. **Mọi công ty đều có nó**, không bỏ được. Nó phủ **mọi tin trong dải**, luôn đứng slot 1, luôn được chọn sẵn khi vào trang. |

Cờ Required là thứ đóng được lỗ hổng cũ: công ty chưa chọn Search tag thì tin không thuộc tag nào, mà luôn có một tag đang chọn → **tin của khách trả tiền không bao giờ xuất hiện**, không báo lỗi ở đâu. Có tag required thì chuyện đó không thể xảy ra, nên chuỗi dự phòng bằng Highlights bỏ được.

## 3. Khi một công ty áp đảo kết quả tìm kiếm

Ứng viên tìm "ngân hàng", MB Bank chiếm 28/33 tin của dải. Lúc đó **không thể** vừa cho mỗi tin hiện đúng một lần mỗi vòng, vừa chặn 3 thẻ cùng công ty: một vòng 11 lượt, mỗi lượt cần ≥ 1 tin ngoài MB → cần 11 tin, chỉ có 5. **Số học, không phải lỗi.**

Chốt: bỏ vế thứ nhất. Trong một trang 3 thẻ, một công ty tối đa 2 thẻ; tới thẻ thứ 3 thì bỏ qua, lấy tin kế tiếp.

**Cái giá, cần đưa vào điều khoản sản phẩm:** đo trên 3000 lượt tải, tin của công ty nhỏ được hiện ~600 lần trong khi tin của MB ~214 lần. Tức **công ty mua nhiều tin hơn lại có số lần hiện trên mỗi tin thấp hơn**. Họ sẽ nhận ra.

## 4. Năm sub-task, theo đúng thứ tự làm

| # | Việc | Repo | Trạng thái |
|---|---|---|---|
| 1 | Master data: cờ Search tag + mục "Search tag đang dùng" | saramin-vn-admin | đã xong, đang QA |
| 2 | Master data: **cờ Required** | saramin-vn-admin | mới |
| 3 | Company page tab: mục Search tags cho từng công ty | saramin-vn-admin | sửa lại |
| 4 | svn-be: vòng quay + con trỏ + response `premiumBand` | svn-be | viết lại hoàn toàn |
| 5 | svn-web: vẽ hàng tag + đếm lượt hiển thị | svn-web | sửa lại |

> **Spring bỏ qua `@RequestParam` lạ mà không báo lỗi.** Sub-task 5 lên trước sub-task 4 thì không có lỗi nào xuất hiện ở đâu cả — hàng tag chỉ đơn giản không hoạt động. Giữ đúng thứ tự.

## 5. Còn mở

**Các tag mở ra những tập tin trùng nhau.** Đo trên ví dụ 33 tin: 3 thẻ đầu của cả 10 tag gộp lại chỉ có **17.5 tin khác nhau trên 30 ô**, vì mọi vòng dựng giống nhau và mọi con trỏ bắt đầu cùng chỗ. Lệch con trỏ mỗi tag theo vị trí của nó trong hàng đưa lên **20.4/30**, tốn một dòng code. Một bước khử trùng hẳn giữa các tag đạt cao hơn nữa nhưng kéo lại đúng phần phức tạp vừa bỏ đi.

Đề xuất: lấy phương án lệch con trỏ, chỉ xem lại nếu khách nêu. Theo mô hình vòng quay thì tag trùng nhau **không làm tin nào mất lượt hiện** — nên đây là vấn đề cảm giác, không phải công bằng.
