# [FE] svn-web: vẽ hàng tag + đếm lượt hiển thị

**Sub-task 4 / 4** · **Repo:** svn-web · **Phụ thuộc:** sub-task 3 phải **live trên môi trường đang test** trước
**Requirement:** [saramin-eta.vercel.app → “THE BLUE ZONE’S TAG ROW”](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-dealt-out-so-every-tag-opens-a-different-set-of-jobs)
**Mockup bấm được:** [jobseeker](https://claude.ai/artifact/SKfqu7LySEraceQ5oSsz9g) · **Prototype:** [mockups?screen=js-search](https://saramin-eta.vercel.app/mockups?screen=js-search)

> **Spring bỏ qua `@RequestParam` lạ mà không báo lỗi.** Nếu sub-task này lên trước sub-task 3 thì không có lỗi nào xuất hiện ở đâu cả — hàng tag chỉ đơn giản không hoạt động.

---

## 1. Vẽ hàng tag

File: `features/jobs/search/ui/premium-jobs-band.tsx`.

![Hàng tag](https://saramin-eta.vercel.app/tickets/srm-1497/tag-row.jpg)

- Hàng tag nằm **giữa tiêu đề dải và các card**, cuộn ngang với mũi tên `‹ ›` ở hai đầu.
- Tag đang chọn: viền và chữ màu brand, in đậm. Tag khác: nền trắng, viền trong suốt.
- Dải hiện `deal[tagĐangChọn]` → **3 card một lượt**, mũi tên `‹ ›` lật **3 card**.
- **Đổi tag là đổi tức thì:** không gọi lại server, không đổi URL, không ghi thêm log tìm kiếm, **danh sách kết quả bên dưới không đổi**. Toàn bộ dữ liệu đã nằm trong response đầu tiên.
- Đổi tag thì **quay về trang 1 của carousel**.
- `tags.length === 0` → **không vẽ hàng tag**, dải giữ nguyên hành vi hôm nay.
- FE **không sắp xếp, không lọc, không cắt** — đúng như comment đang có trong component.

### Acceptance — hàng tag

- [ ] Vào trang: tag đầu tiên đã ở trạng thái chọn, dải hiện 3 card đầu của tag đó.
- [ ] Bấm tag khác: dải đổi ngay, không có loading, carousel về trang 1.
- [ ] Bấm qua lại giữa hai tag nhiều lần: nội dung mỗi tag **không đổi** trong cùng một lần tải trang.
- [ ] URL, danh sách kết quả và bộ lọc bên trái không đổi khi bấm tag.
- [ ] Tab mạng: bấm tag **không phát sinh request nào**.
- [ ] `tags: []` → không có hàng tag, dải vẫn vẽ bình thường.
- [ ] Mobile: hàng tag cuộn ngang được, trang không bị tràn ngang.
- [ ] Bàn phím: Tab tới được từng tag, Enter/Space để chọn, có viền focus nhìn thấy.

---

## 2. Đếm lượt hiển thị

Dải là vùng bán tiền, nên con số này đi thẳng vào báo cáo gửi khách. Luật chia bài tạo ra một cái bẫy: server trả sẵn tới **8 tag × 10 card = 80 card** trong một trang, trong khi ứng viên chỉ nhìn thấy 3.

- **Một lượt hiển thị = một card thật sự lọt vào khung nhìn** — tag đó đang được chọn **và** card đang nằm trong 3 ô đang hiện. Bấm mũi tên `›` sang card 4·5·6 thì ba card đó mới được tính.
- **Ghi nhận mỗi lượt bấm tag**: tag nào, từ khoá nào, vị trí thứ mấy trên hàng. Đây là dữ liệu duy nhất cho biết tag nào thật sự có người dùng — sau 2–3 tháng BA mới biết nên giữ tag nào trong danh sách Search tag.
- Card trong dải vẫn báo `surface: "SEARCH_PREMIUM"` kèm `contextRef.search(searchId)` như hôm nay.
- Header `X-SVN-Search-Log` / `searchLogEntry` **chỉ đi cùng lần tìm kiếm chính của ứng viên**, không đi kèm bất cứ thao tác nào trên hàng tag. Một lần tìm kiếm là một dòng log.

### Acceptance — đếm lượt hiển thị

- [ ] Tải trang và không chạm vào gì: đúng **3** lượt hiển thị được ghi, không phải 80.
- [ ] Bấm `›` một lần: thêm đúng 3 lượt.
- [ ] Bấm sang tag khác: ghi một sự kiện bấm tag, và 3 lượt hiển thị của tag mới.
- [ ] Không phát sinh dòng search-log thứ hai cho cùng một lần tìm kiếm.

---

## 3. Không làm trong sub-task này

- ❌ Lọc, sắp xếp hay cắt bớt `deal` ở phía client — BE đã chia xong.
- ❌ Gọi lại server khi đổi tag.
- ❌ Hiện số đếm trên tag.
- ❌ Nút “Tất cả” hoặc trạng thái không chọn tag nào.
- ❌ Đưa tag vào URL.
- ❌ Hàng tag cho dải Premium ở trang chủ hay trang công ty — chỉ `/search`.
