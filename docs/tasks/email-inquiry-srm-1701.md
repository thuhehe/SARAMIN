# 24. Email inquiry — form liên hệ ở Footer + 3 màn quản trị

**Ticket cha:** SRM-1634 [Launch Test] Bug · **Repo:** svn-web + svn-be + saramin-vn-admin
**Tham khảo UI:** Saramin KR — [/zf_user/help/inquery/email-inquiry-write](https://www.saramin.co.kr/zf_user/help/inquery/email-inquiry-write)

> **Tóm lại:** bấm "Email Inquiry" ở Footer → mở một trang form liên hệ giống KR. Người dùng chọn mình là ứng viên hay doanh nghiệp, chọn loại yêu cầu, nhập tiêu đề và nội dung, gửi đi. Phía admin cần 3 thứ: khai danh sách loại yêu cầu, khai email nhận, và một màn xem lại các yêu cầu đã gửi.

---

## 0. Cảnh báo về phạm vi — đọc trước khi ước lượng

Ticket này nằm trong danh sách **lỗi launch test**, nhưng nội dung của nó **không phải sửa lỗi**. Nó là một tính năng mới trọn vẹn:

- 1 trang công khai mới trên svn-web
- 1 bảng mới + bộ endpoint công khai và admin trên svn-be
- 3 chỗ mới trong admin

Đây không phải việc làm xen kẽ trong một buổi. **Nếu ước lượng ra quá 2 ngày công thì báo lại để tách thành task riêng**, đừng để nó chìm trong danh sách bug.

---

## 1. Những gì ĐÃ CÓ trong build — dùng lại, đừng viết mới

| Đã có | Ở đâu | Dùng để làm gì |
|---|---|---|
| Footer và các link trong đó | admin **Content ▸ Site footer** (`/content/footer`), mục **Links**; svn-be `/api/admin/site/footer/{surface}/…` | thêm link "Email Inquiry" ở đây, **không hardcode trong code svn-web** |
| Component footer | svn-web `components/layout/content-layout/footer/index.tsx` | nơi link được vẽ ra |
| Giờ làm việc / hotline CSKH | admin **System ▸ Company information ▸ Customer center** (singleton); svn-web đọc qua hook `useSupportContact()` | dòng "Yêu cầu gửi trong giờ hành chính sẽ được trả lời trong ngày…" ở đầu form — **đọc từ đây, không hardcode giờ** |
| Catalogue 2 cấp (nhóm → mục) | `master-data-domains.ts`, xem `company_highlight` hoặc `job_card_tag` | khuôn mẫu cho danh sách loại yêu cầu ở phần 2 |

### Hai thứ TRÔNG GIỐNG nhưng không phải

- `features/billing/components/contact-inquiry.tsx` — chỉ là **khối hiển thị** số hotline trên trang bảng giá, không có form.
- `features/billing/api/submit-purchase-inquiry.api.ts` — là **hàm giả lập** cho nút mua hàng, chưa nối backend.

Cả hai **không liên quan** tới ticket này. Đừng gắn thêm vào chúng.

### Và một thứ CHƯA CÓ

svn-be hiện **không có bảng nào lưu yêu cầu liên hệ**. Phải tạo mới hoàn toàn.

---

## 2. Phần 1 — Trang gửi yêu cầu (svn-web + svn-be)

Dựng theo đúng UI trang KR trong ảnh đính kèm ticket. Các trường, theo thứ tự:

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| Dòng mở đầu | chữ | — | giờ trả lời, lấy từ **Customer center** |
| Email | ô nhập | ✓ | xem câu hỏi 2 ở mục 6 về nút xác minh |
| Đối tượng | radio | ✓ | **Ứng viên** / **Doanh nghiệp** |
| Loại yêu cầu | dropdown | ✓ | **danh sách đổi theo Đối tượng** — chọn ứng viên ra một danh sách, chọn doanh nghiệp ra danh sách khác |
| Tiêu đề | ô nhập | ✓ | |
| Nội dung | ô nhập nhiều dòng | ✓ | |
| Tệp đính kèm | upload | — | xem câu hỏi 3 ở mục 6 |

**Luật quan trọng:** đổi Đối tượng thì dropdown Loại yêu cầu **nạp lại và xoá lựa chọn cũ**. Giữ lại lựa chọn cũ sẽ cho ra yêu cầu gắn sai loại.

### Acceptance — phần 1

- [ ] Bấm "Email Inquiry" ở footer mở đúng trang này; link khai trong admin chứ không nằm trong code.
- [ ] Dòng giờ trả lời đổi theo khi sửa Customer center trong admin, không cần deploy.
- [ ] Chọn **Ứng viên** → dropdown ra danh sách của ứng viên; chuyển sang **Doanh nghiệp** → danh sách đổi và ô chọn bị xoá trắng.
- [ ] Bỏ trống bất kỳ trường bắt buộc nào → báo lỗi ngay tại trường đó, không gửi đi.
- [ ] Gửi thành công → hiện màn xác nhận, và bản ghi xuất hiện ở màn danh sách phần 4.
- [ ] Gửi khi **chưa đăng nhập** vẫn được — đây là trang công khai.

---

## 3. Phần 2 — Khai loại yêu cầu (admin + svn-be)

Danh sách loại yêu cầu **do admin nhập**, không hardcode. Dùng đúng khuôn 2 cấp đã có trong Master data:

- **Dòng nhóm** = đối tượng: `Ứng viên`, `Doanh nghiệp`
- **Dòng con** = một loại yêu cầu, nằm dưới nhóm của nó

Đây chính xác là cách `company_highlight` và `job_card_tag` đang làm (`hasParent: true`, `maxLevels: 2`), nên thêm một domain mới vào `master-data-domains.ts` là đủ — **không cần dựng màn hình riêng**.

Cần có: bật/tắt (`hasActive`), kéo thả sắp thứ tự (`reorderable`), tên VI/EN.

### Dữ liệu mồi — danh sách của KR cho nhóm Doanh nghiệp

Lấy từ ảnh trong ticket: Báo cáo vi phạm lương tối thiểu / công ty xấu / tin tuyển dụng · Báo lỗi · Hỏi về CV · Hỏi về ứng tuyển · Hỏi về tìm kiếm · Đăng ký / huỷ tài khoản / ID / mật khẩu · Hỏi về thông báo · Hỏi về quản lý ứng viên · Hỏi về email / thông báo · Hỏi về thanh toán / sản phẩm trả phí · Yêu cầu huỷ thanh toán · Yêu cầu ẩn thông tin lương · Hỏi về bài test tính cách · Đăng ký dùng thử bài test tính cách

> ⚠️ Ảnh trong ticket **chỉ chụp danh sách của Doanh nghiệp**. Danh sách của Ứng viên chưa có — xem câu hỏi 1 ở mục 6.

### Acceptance — phần 2

- [ ] Thêm / sửa / tắt một loại yêu cầu trong admin → trang form ngoài web đổi theo mà không cần deploy.
- [ ] Loại đã tắt không còn trong dropdown, nhưng yêu cầu cũ đã gắn loại đó **vẫn hiện đúng tên**.
- [ ] Dòng nhóm (Ứng viên / Doanh nghiệp) không chọn được trong dropdown.
- [ ] Thứ tự trong dropdown đúng theo thứ tự kéo thả trong admin.

---

## 4. Phần 3 — Email nhận yêu cầu

Admin khai **địa chỉ email nhận**; mỗi yêu cầu gửi đi thì hệ thống gửi một email tới địa chỉ đó.

- Cho phép khai **nhiều địa chỉ**, vì CSKH thường không phải một người.
- Đề xuất đặt ở **System ▸ Company information**, cạnh Customer center — cùng là thiết lập một lần cho cả hệ thống.
- Email gửi đi phải có: đối tượng, loại yêu cầu, tiêu đề, nội dung, email người gửi, thời điểm gửi, và link mở thẳng bản ghi trong admin.

### Acceptance — phần 3

- [ ] Đổi địa chỉ nhận trong admin → yêu cầu gửi sau đó đi tới địa chỉ mới, không cần deploy.
- [ ] Khai 2 địa chỉ → cả 2 cùng nhận được.
- [ ] **Gửi email thất bại thì yêu cầu vẫn được lưu** và vẫn hiện ở màn danh sách. Không bao giờ mất yêu cầu của người dùng chỉ vì hộp thư lỗi.
- [ ] Chưa khai địa chỉ nào → form ngoài web vẫn chạy, yêu cầu vẫn lưu, và admin thấy cảnh báo chưa khai email nhận.

---

## 5. Phần 4 — Màn danh sách yêu cầu trong admin

Một màn xem lại mọi yêu cầu đã gửi.

- **Cột:** thời điểm gửi · đối tượng · loại yêu cầu · tiêu đề · email người gửi · trạng thái
- **Lọc:** theo đối tượng, theo loại yêu cầu, theo khoảng thời gian
- **Mở một dòng** → xem đầy đủ nội dung và tệp đính kèm
- **Trạng thái:** tối thiểu `Mới` / `Đã xử lý`, để CSKH không đọc trùng

### Acceptance — phần 4

- [ ] Gửi một yêu cầu ngoài web → trong vòng vài giây nó xuất hiện ở đầu danh sách.
- [ ] Lọc theo đối tượng và theo loại đều ra đúng kết quả.
- [ ] Đổi trạng thái sang `Đã xử lý` và tải lại trang → trạng thái vẫn giữ.
- [ ] Màn này nằm sau quyền riêng, tài khoản không có quyền thì không mở được.

---

## 6. Năm câu hỏi cần Thu chốt trước khi code

Năm câu này **thay đổi khối lượng công việc**, nên hỏi trước khi bắt đầu chứ đừng đoán:

1. **Danh sách loại yêu cầu cho nhóm Ứng viên gồm những gì?** Ảnh trong ticket chỉ có danh sách của Doanh nghiệp.
2. **Có bắt xác minh email trước khi gửi không?** KR có nút "certification" cạnh ô email. Làm thì phải thêm luồng gửi mã OTP — đây là phần tốn công nhất của cả ticket. Không làm thì form dễ bị spam.
3. **Có cho đính kèm tệp không?** Nếu có: loại tệp nào, dung lượng tối đa bao nhiêu, bao nhiêu tệp.
4. **Người gửi có nhận email xác nhận không?**
5. **CSKH trả lời bằng cách nào?** Trả lời ngay trong admin (cần thêm luồng soạn và gửi), hay chỉ nhận email rồi reply bằng hộp thư riêng? Câu này quyết định màn ở phần 4 là **màn đọc** hay **màn làm việc**.

---

## 7. Không làm trong ticket này

- ❌ Hệ thống ticket hỗ trợ đầy đủ (gán người xử lý, SLA, trao đổi qua lại).
- ❌ Đụng vào luồng liên hệ mua hàng ở trang bảng giá.
- ❌ Trang FAQ / Customer center đang có.
- ❌ Hardcode link "Email Inquiry" vào code footer.
- ❌ Hardcode danh sách loại yêu cầu vào code.
