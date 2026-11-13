# [Premium] Hàng tag lọc trong dải Premium trên trang tìm kiếm (company tag)

**Module:** Job management · Admin · CRM · **Site:** svn-web + svn-be + saramin-vn-admin
**Requirement (source of truth):** [saramin-eta.vercel.app → Job list (Search result)](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-dealt-out-so-every-tag-opens-a-different-set-of-jobs) — mục “THE BLUE ZONE’S TAG ROW”
**Mockup bấm được:** [jobseeker](https://claude.ai/artifact/SKfqu7LySEraceQ5oSsz9g) · [admin](https://claude.ai/artifact/Czeaekg1FjX1PKmnV6szc4)
**Prototype:** [saramin-eta.vercel.app/mockups?screen=js-search](https://saramin-eta.vercel.app/mockups?screen=js-search)
**Tham khảo:** Saramin KR — dải “쉿! 회원님에게만 알려주는 공고” trên `/zf_user/search`

> Ticket này là **task cha**: bối cảnh, lý do và thứ tự làm. Luật chi tiết và acceptance nằm ở **4 sub-task** bên dưới.

---

## 0. Việc này là gì

Thêm **một hàng tag ngay dưới tiêu đề dải Premium** trên `/search`. Bấm vào một tag thì các card trong dải đổi sang một nhóm tin khác. Danh sách kết quả bên dưới không đụng tới.

Dải Premium **đã chạy** (svn-be V486, FE `features/jobs/search/ui/premium-jobs-band.tsx`): chèn sau 3 dòng kết quả đầu, chỉ ở trang 1, 10 card xem 3 card một lượt.

**Nguồn tag là company tag** — catalogue `company_highlight`, cùng vốn từ mà dải chip trên trang công ty đang dùng. Không dùng job card tag, không dùng trường của job (ngành nghề, địa điểm, cấp bậc): chỉ catalogue này mới có emoji, mà emoji trên mỗi tag là một phần của thiết kế.

## 1. Vấn đề cốt lõi — đọc trước khi code

Tag là **thuộc tính của công ty**, không phải của tin.

Nên khi dải chỉ có **một** công ty Premium — đúng tình huống Saramin VN trong vài tháng tới — mọi tag đều phủ 100% số tin trong dải. Bấm tag nào cũng ra đúng tập tin đó. **Không tag nào lọc được gì cả.**

Điều này **đã được chấp nhận**, không phải thiếu sót. Cách xử lý:

> Thay vì xáo lại cùng một danh sách cho có vẻ khác, svn-be **chia tin của dải ra cho các tag**: xáo một lần, rồi chia vòng tròn, mỗi tag lấy một tin chưa tag nào lấy. Mỗi tag mở ra một **nhóm tin khác nhau**, chứ không phải cùng một danh sách đảo thứ tự.
>
> Và khi có khách Premium thứ hai, hàng tag **tự trở thành bộ lọc thật** — không sửa một dòng code nào.

Ví dụ: 20 tin của một khách, 6 tag → mỗi tag 10 card, và **3 card đầu của cả 6 tag là 18 tin khác nhau**, không trùng cái nào.

## 2. Màn hình

**Một khách Premium — 20 tin, 6 tag.** Dải chèn sau dòng kết quả thứ 3.

![Dải Premium, một khách Premium](https://saramin-eta.vercel.app/tickets/srm-1497/search-1-company.jpg)

**Hàng tag phóng to.** Tag đầu chọn sẵn, không tag nào có số đếm, 3 card một lượt, mũi tên lật 3.

![Hàng tag](https://saramin-eta.vercel.app/tickets/srm-1497/tag-row.jpg)

**Ba khách Premium — 33 tin, 8 tag.** Cùng bộ luật: hàng tag lúc này lọc thật, mỗi tag ra một nhóm công ty khác nhau, số card mỗi tag không còn đều nhau.

![Dải Premium, ba khách Premium](https://saramin-eta.vercel.app/tickets/srm-1497/search-3-companies.jpg)

## 3. Bốn sub-task — thứ tự là BẮT BUỘC

| # | Sub-task | Repo | Vì sao phải đúng thứ tự |
|---|---|---|---|
| 1 | Master data: cờ **Search tag** | admin + svn-be | HQ phải gắn cờ ~18 tag trước, nếu không sub-task 2 không có gì để chọn |
| 2 | Company page tab: mục **Search tags** | admin + svn-be | Người nhập phải chọn tag cho từng công ty Premium, nếu không sub-task 3 không có gì để chia |
| 3 | svn-be: **luật chia bài** + response | svn-be | BE phải live trước FE |
| 4 | svn-web: **vẽ hàng tag** + đếm lượt hiển thị | svn-web | — |

**Hai cái bẫy:**

- **Spring bỏ qua `@RequestParam` lạ mà không báo lỗi.** Sub-task 4 lên trước sub-task 3 thì không có lỗi nào xuất hiện ở đâu cả — hàng tag chỉ đơn giản không hoạt động, và không ai biết vì sao.
- **Sub-task 3 và 4 không có gì để hiện nếu sub-task 1 và 2 chưa có DỮ LIỆU THẬT**, không phải chỉ code xong. Một công ty Premium chưa ai chọn Search tag là một khách trả tiền mà tin không lên dải.

## 4. Trước khi bật — việc của người, không phải của code

- [ ] HQ đã gắn cờ Search tag cho các tag trong catalogue (sub-task 1 có sẵn danh sách 18 mã).
- [ ] Mỗi công ty đang có gói Premium đã được chọn Search tag ở tab Company page.
- [ ] BA xác nhận với sales: trong giai đoạn một khách Premium, hàng tag là **trình bày**, chưa phải bộ lọc. Bán nó như bộ lọc sẽ gặp đúng câu hỏi nó chưa trả lời được.

## 5. Không làm trong phạm vi này

- ❌ Dùng job card tag (`job_card_tag`) làm nguồn tag.
- ❌ Dùng trường của job (ngành nghề, địa điểm, cấp bậc, hình thức làm việc) làm tag.
- ❌ Luật trần “tag phủ quá nhiều tin thì ẩn”.
- ❌ Hiện số đếm trên tag.
- ❌ Nút “Tất cả” hoặc trạng thái không chọn tag nào.
- ❌ Đưa tag vào URL hay vào bộ lọc bên trái.
- ❌ Đụng vào Top section hay danh sách kết quả chính.
- ❌ Đổi copy tiêu đề dải.
- ❌ Hàng tag cho dải Premium ở trang chủ hay trang công ty — chỉ `/search`.
