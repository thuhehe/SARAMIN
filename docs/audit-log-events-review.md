# Audit log — Danh sách sự kiện hệ thống đang ghi nhận

**Mục đích:** để khách hàng rà soát lại toàn bộ event mà hệ thống đang ghi vào trang **Audit log** (`System → Audit log`) — xác nhận cái nào **đủ**, cái nào **thiếu**, cái nào **không cần ghi**.

| | |
|---|---|
| **Nguồn** | `svn-be` (backend), nhánh `dev`, commit `7836a2575` — 18/09/2026 |
| **Cách lấy** | Trích tự động từ **tất cả** các điểm gọi `AuditRecord` trong mã nguồn backend (164 điểm gọi), không phải viết tay từ tài liệu |
| **Tổng số event** | **145 event**, thuộc 37 nhóm đối tượng |
| **Xem ở đâu** | Trang `System → Audit log` — lọc theo Action / Entity / Người thực hiện / Khoảng ngày, xuất CSV |
| **Quyền xem** | `audit_log:read` — hiện chỉ cấp cho vai trò **HQ Admin** |

## Cách đọc bảng

- **Mã event** — chuỗi kỹ thuật lưu trong cột `Action`, dạng `đối-tượng.hành-động`. Đây là giá trị anh/chị sẽ thấy khi lọc trên màn hình, **không đổi được** vì dữ liệu cũ đã lưu theo mã này.
- **Người thực hiện** — ai là người tạo ra event:

| Ký hiệu | Nghĩa |
|---|---|
| **Admin** | Nhân sự HQ đang đăng nhập trang quản trị |
| **NTD** | Người dùng của công ty nhà tuyển dụng |
| **ỨV** | Ứng viên / người tìm việc |
| **Hệ thống** | Tác vụ tự động (job quét định kỳ, đồng bộ hoá đơn, đối soát ngân hàng) — không có người bấm |

- **Cột cuối để trống** — nhờ anh/chị đánh dấu khi rà soát:
  `✅` giữ nguyên · `❌` không cần ghi · `➕` cần bổ sung thông tin · hoặc ghi chú trực tiếp.

> **Lưu ý về phạm vi:** đây là danh sách **đang có trong code**. Nếu anh/chị cần một event chưa có trong bảng này, vui lòng ghi vào mục **[Đề xuất bổ sung](#đề-xuất-bổ-sung)** ở cuối file.

---

## 1 · Đăng nhập, mật khẩu & bảo mật tài khoản (24 event)

Nhóm quan trọng nhất khi điều tra sự cố truy cập trái phép.

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `auth.login` | Đăng nhập thành công (áp dụng cho cả Admin, NTD và ỨV) | Admin · NTD · ỨV | |
| `auth.login_failed` | Đăng nhập thất bại — sai email hoặc mật khẩu | Admin · NTD · ỨV | |
| `auth.login_locked` | Tài khoản admin bị khoá do sai mật khẩu quá số lần cho phép | Hệ thống | |
| `auth.set_password` | Đặt mật khẩu lần đầu (admin / NTD kích hoạt tài khoản qua email mời) | Admin · NTD | |
| `auth.change_password` | Đổi mật khẩu thành công | ỨV · NTD | |
| `auth.change_password_failed` | Đổi mật khẩu thất bại — nhập sai mật khẩu hiện tại | ỨV · NTD | |
| `auth.password_reset_requested` | Yêu cầu đặt lại mật khẩu (bấm "Quên mật khẩu") | ỨV | |
| `auth.password_reset_completed` | Đặt lại mật khẩu thành công qua link trong email | ỨV | |
| `auth.email_verified` | Xác thực email thành công | ỨV | |
| `auth.verification_resent` | Gửi lại email xác thực | ỨV | |
| `auth.magic_link_issued` | Phát hành link đăng nhập nhanh cho người dùng công ty | Hệ thống | |
| `auth.oauth_linked` | Liên kết tài khoản với đăng nhập mạng xã hội (Google…) | ỨV | |
| `auth.reauth_failed` | Xác thực lại thất bại khi thực hiện thao tác nhạy cảm | ỨV | |
| `auth.account_recovery_lookup` | Tra cứu khôi phục tài khoản | ỨV | |
| `auth.otp_requested` | Yêu cầu gửi mã OTP qua điện thoại | ỨV | |
| `auth.otp_verified` | Xác thực mã OTP thành công | ỨV | |
| `auth.otp_failed` | Nhập sai mã OTP | ỨV | |
| `auth.otp_purpose_mismatch` | Dùng mã OTP sai mục đích (mã cấp cho việc A, đem dùng cho việc B) | ỨV | |
| `auth.withdraw_otp_requested` | Yêu cầu OTP để **xoá tài khoản** | ỨV | |
| `auth.withdraw_otp_verified` | Xác thực OTP xoá tài khoản thành công | ỨV | |
| `auth.withdraw_otp_failed` | Xác thực OTP xoá tài khoản thất bại | ỨV | |
| `account.create` | Tạo tài khoản mới (ứng viên tự đăng ký, hoặc tài khoản NTD được tạo từ Sign-up) | ỨV · Admin | |
| `account.deactivate` | Ứng viên tự vô hiệu hoá tài khoản | ỨV | |
| `account.delete_self` | Ứng viên tự xoá tài khoản | ỨV | |

---

## 2 · Dữ liệu cá nhân ứng viên — PII (22 event)

**Nhóm cần rà soát kỹ nhất.** Đây là các event trả lời câu hỏi *"ai đã xem / tải / mở khoá dữ liệu cá nhân của ứng viên nào, lúc nào"* — phục vụ nghĩa vụ bảo vệ dữ liệu cá nhân.

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `candidate.search` | NTD **tìm kiếm** trong kho CV | NTD | |
| `candidate.profile_read` | NTD **mở xem** hồ sơ một ứng viên | NTD | |
| `resume.unlock` | NTD **mở khoá** một CV (trừ quota) | NTD | |
| `resume.contact_reveal` | Hiển thị thông tin liên hệ của CV đã mở khoá ⚠️ | Hệ thống *(xem ghi chú 1)* | |
| `resume.unlock_refund` | Hoàn lại lượt mở khoá đã trừ | Admin | |
| `resume.read` | Xem nội dung CV | Admin · NTD | |
| `resume.update` | Cập nhật CV | ỨV · Admin | |
| `resume.delete` | Xoá CV | ỨV · Admin | |
| `talent_pool.read` | Xem danh sách Talent pool | Admin · NTD | |
| `talent_pool.export` | **Xuất file** danh sách Talent pool | Admin · NTD | |
| `candidate.read` | Admin xem hồ sơ ứng viên trong trang quản trị | Admin | |
| `candidate.export` | Admin **xuất file** danh sách ứng viên | Admin | |
| `candidate.create` | Admin tạo hồ sơ ứng viên | Admin | |
| `candidate.deactivate` | Admin vô hiệu hoá tài khoản ứng viên | Admin | |
| `candidate.reactivate` | Admin kích hoạt lại tài khoản ứng viên | Admin | |
| `candidate.delete` | Admin xoá tài khoản ứng viên (xoá mềm) | Admin | |
| `candidate.restore` | Admin khôi phục tài khoản đã xoá | Admin | |
| `candidate.purge` | **Xoá vĩnh viễn** dữ liệu ứng viên theo lịch tự động | Hệ thống | |
| `candidate.dormant` | Chuyển tài khoản sang trạng thái ngủ đông (lâu không hoạt động) | Hệ thống | |
| `candidate.resend_verification` | Admin gửi lại email xác thực giúp ứng viên | Admin | |
| `candidate.send_password_reset` | Admin gửi link đặt lại mật khẩu giúp ứng viên | Admin | |
| `consent.read` | Xem lịch sử đồng ý điều khoản của ứng viên | Admin | |

**Ghi chú 1 — `resume.contact_reveal` chưa ghi được người thực hiện.** Hệ thống hiện chỉ ghi được **công ty** nào đã xem, chưa ghi được **nhân viên cụ thể** nào trong công ty đó. Đây là hạn chế kỹ thuật đã được ghi nhận ở phía backend. Nhờ khách hàng xác nhận: **có bắt buộc phải truy vết đến từng nhân viên không?** Nếu có, cần đưa vào danh sách việc phải làm.

---

## 3 · CV & hồ sơ đính kèm (5 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `candidate_cv.read` | Xem CV trong hàng đợi duyệt | Admin | |
| `candidate_cv.approve` | **Duyệt** CV | Admin | |
| `candidate_cv.reject` | **Từ chối** CV (kèm lý do) | Admin | |
| `cv_qualification.rescan` | Chạy lại kiểm tra chất lượng CV | Admin | |
| `skill_gap.adopt` | Thêm một kỹ năng mới vào từ điển kỹ năng | Admin | |

---

## 4 · Tin tuyển dụng & ứng tuyển (13 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `job.create` | Tạo tin tuyển dụng | Admin · NTD | |
| `job.update` | Sửa tin tuyển dụng | NTD | |
| `job.publish` | **Đăng tin** (trừ slot quota) | Admin · NTD | |
| `job.approve` | Duyệt tin do công ty tự đăng | Admin | |
| `job.reject` | Từ chối tin do công ty tự đăng (kèm lý do) | Admin | |
| `job.upgrade_tier` | **Nâng hạng tin** (trừ slot của hạng mới) | Admin | |
| `job.correct_tier` | Sửa lại hạng tin bị sai | Admin | |
| `job.auto_open` | Tin hẹn giờ **tự động lên sóng** đúng giờ đã đặt | Hệ thống | |
| `job.auto_close` | Tin **tự động đóng** khi hết hạn | Hệ thống | |
| `application.read` | Admin xem hồ sơ ứng tuyển | Admin | |
| `application.reject` | Admin loại hồ sơ ứng tuyển | Admin | |
| `applicant.read` | Xem danh sách / chi tiết ứng viên đã ứng tuyển | Admin · NTD | |
| `applicant.export` | **Xuất file** danh sách ứng viên đã ứng tuyển | NTD | |

---

## 5 · Khách hàng & hồ sơ công ty (18 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `company.create` | Tạo công ty mới | Admin | |
| `company.update` | Sửa thông tin công ty | Admin | |
| `company.archive` | Lưu trữ công ty | Admin | |
| `company.unarchive` | Bỏ lưu trữ công ty | Admin | |
| `company.document.submit` | Công ty **nộp** giấy tờ xác minh | NTD | |
| `company.document.attach` | Đính kèm thêm giấy tờ | NTD · Admin | |
| `company.document.approve` | **Duyệt** giấy tờ xác minh | Admin | |
| `company.document.reject` | **Từ chối** giấy tờ xác minh | Admin | |
| `company.document.withdraw` | Rút lại giấy tờ đã nộp | NTD | |
| `company.change.request` | Yêu cầu **đổi thông tin pháp lý** (tên, MST…) | NTD | |
| `company.change.approve` | Duyệt yêu cầu đổi thông tin pháp lý ⚠️ | Admin | |
| `company.change.reject` | Từ chối yêu cầu đổi thông tin pháp lý | Admin | |
| `company.change.withdraw` | Rút lại yêu cầu đổi thông tin pháp lý | NTD | |
| `company_page.publish` | **Đăng** trang giới thiệu công ty | Admin · NTD | |
| `company_page.unpublish` | **Gỡ** trang giới thiệu công ty | Admin · NTD | |
| `company_activity.create` | Ghi nhận một hoạt động chăm sóc khách hàng (gọi / chat / họp) | Admin | |
| `company_user.read` | Xem danh sách người dùng của công ty | Admin | |
| `daily_activity.create` | Ghi nhận hoạt động hằng ngày của sale | Admin | |

⚠️ `company.change.approve` là **đường duy nhất** có thể đổi mã số thuế sau khi đã có — nên đây là event bắt buộc phải có.

---

## 6 · Đăng ký tài khoản NTD & nhận công ty (10 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `signup.submitted` | NTD **gửi** đăng ký trên trang công ty | NTD *(chưa có tài khoản)* | |
| `signup.verified` | NTD xác thực email đăng ký | NTD *(chưa có tài khoản)* | |
| `signup.resent` | Gửi lại email xác thực đăng ký | Hệ thống | |
| `signup.moved_to_existing` | Admin **ghép** người đăng ký vào công ty đã có | Admin | |
| `signup.assign` | Admin gán người phụ trách cho đăng ký | Admin | |
| `signup.archived` | Admin **từ chối / lưu trữ** đăng ký (spam) | Admin | |
| `claim.request` | Sale **xin nhận** một công ty từ kho Free data | Admin | |
| `claim.admin_approve` | Admin duyệt yêu cầu nhận công ty (bước 1) | Admin | |
| `claim.lead_approve` | Trưởng nhóm sale duyệt (bước 2) | Admin | |
| `claim.reject` | Từ chối yêu cầu nhận công ty | Admin | |

---

## 7 · Bán hàng: báo giá → đơn hàng → hoá đơn (24 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `quote.create` | Tạo báo giá | Admin | |
| `quote.revise` | Sửa báo giá | Admin | |
| `quote.duplicate` | Nhân bản báo giá | Admin | |
| `quote.transition` | Chuyển trạng thái báo giá | Admin | |
| `quote.stage_change` | Kéo thẻ sang cột khác trên bảng Pipeline | Admin | |
| `quote.mode_change` | Đổi chương trình chiết khấu của báo giá | Admin | |
| `quote.close_lost` | Đóng deal — **thua** (kèm lý do) | Admin | |
| `quote.reopen` | Mở lại deal đã đóng | Admin | |
| `quote.expire` | Báo giá **hết hạn tự động** | Hệ thống | |
| `purchase_order.issue` | **Phát hành đơn hàng** từ phương án khách đã chọn | Admin | |
| `purchase_order.attach_customer_po` | Đính kèm số PO của khách | Admin | |
| `purchase_order.update_payment` | Cập nhật thông tin thanh toán của đơn hàng | Admin | |
| `purchase_order.expire` | Đơn hàng **hết hạn tự động** cuối tháng | Hệ thống | |
| `invoice.request` | Sale **đề nghị** kế toán xuất hoá đơn | Admin | |
| `invoice.draft` | Tạo hoá đơn nháp | Admin | |
| `invoice.issue` | **Xuất hoá đơn VAT chính thức** ⚠️ | Admin *(kế toán)* | |
| `invoice.superseded_detected` | Phát hiện hoá đơn đã bị thay thế phía nhà cung cấp | Hệ thống | |
| `invoice_email.send` | Gửi hoá đơn cho khách qua email | Admin | |
| `order.create` | Tạo đơn | Admin | |
| `order.create.self` | Công ty **tự đặt** đơn trên trang NTD | NTD | |
| `order.confirm` | Xác nhận đơn | Admin | |
| `order.cancel` | Huỷ đơn | Admin | |
| `payment.record` | Ghi nhận một khoản tiền về | Admin · Hệ thống | |
| `payment.confirm` | **Xác nhận** đã nhận tiền | Admin | |
| `payment.unmatched` | Tiền về ngân hàng nhưng **không khớp** đơn nào | Hệ thống | |
| `receivable.open` | Mở một khoản phải thu | Hệ thống | |

⚠️ `invoice.issue` là thời điểm **quota được cấp cho khách hàng** — event quan trọng nhất trong nhóm này.

---

## 8 · Sản phẩm, quota & chương trình (7 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `company_tier_quota.grant` | Cấp slot đăng tin cho công ty | Admin · Hệ thống | |
| `search_quota.activate` | **Kích hoạt** gói CV search (bắt đầu đếm 30/90 ngày) | Admin · NTD | |
| `search_quota.revoke` | **Thu hồi** gói CV search | Admin | |
| `discount_programme.create` | Tạo chương trình chiết khấu | Admin | |
| `discount_programme.update` | Sửa chương trình chiết khấu | Admin | |
| `membership_programme.save` | Lưu cấu hình hạng thành viên | Admin | |
| `bundle.approve` / `bundle.reject` | Duyệt / từ chối gói combo | Admin | |

---

## 9 · Quản trị hệ thống & phân quyền (16 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `user.invite` | Mời nhân sự HQ mới | Admin | |
| `user.resend_invite` | Gửi lại email mời | Admin | |
| `user.update` | Sửa thông tin nhân sự HQ | Admin | |
| `user.delete` | Xoá nhân sự HQ | Admin | |
| `user.assign_roles` | **Gán vai trò** cho nhân sự HQ ⚠️ | Admin | |
| `user.reset_password` | Đặt lại mật khẩu cho nhân sự HQ | Admin | |
| `role.create` | Tạo vai trò mới | Admin | |
| `role.update` | Sửa vai trò | Admin | |
| `role.duplicate` | Nhân bản vai trò | Admin | |
| `role.delete` | Xoá vai trò | Admin | |
| `role.replace_permissions` | **Thay đổi quyền** của một vai trò ⚠️ | Admin | |
| `department.create` / `department.update` / `department.delete` | Quản lý phòng ban | Admin | |
| `master_data.import` | **Nhập hàng loạt** dữ liệu danh mục (ngành nghề, khu vực…) | Admin | |
| `seller_profile.replace` | Đổi thông tin pháp nhân bên bán (in trên hoá đơn) | Admin | |
| `audit_log.export` | **Xuất file chính trang Audit log này** | Admin | |

⚠️ `user.assign_roles` và `role.replace_permissions` là hai event trả lời *"ai đã cấp quyền cho ai"* — cần thiết khi rà soát nội bộ.

---

## 10 · Xuất dữ liệu, thông báo & tích hợp (8 event)

| Mã event | Ghi lại khi nào | Người thực hiện | Rà soát |
|---|---|---|---|
| `export.requested` | Yêu cầu xuất file dữ liệu | Admin | |
| `export.completed` | File xuất đã tạo xong | Hệ thống | |
| `notification_manual_batch.send` | Gửi thông báo thủ công hàng loạt | Admin | |
| `notification_delivery.retry` | Gửi lại một thông báo bị lỗi | Admin | |
| `zalo_template.update` | Sửa mẫu tin nhắn Zalo | Admin | |
| `zalo.template_test` | Gửi thử mẫu tin nhắn Zalo | Admin | |
| `zalo.token_seed` | Nạp token Zalo OA | Admin | |
| `scrap.create` / `scrap.delete` | Ứng viên lưu / bỏ lưu tin tuyển dụng | ỨV | |
| `company_follow.create` / `company_follow.delete` | Ứng viên theo dõi / bỏ theo dõi công ty | ỨV | |

---

## Các điểm cần khách hàng xác nhận

| # | Nội dung | Trả lời |
|---|---|---|
| 1 | **`resume.contact_reveal` chưa truy vết đến từng nhân viên** — chỉ biết công ty nào đã xem thông tin liên hệ, không biết ai trong công ty. Có bắt buộc phải truy vết đến từng người không? | |
| 2 | **Thời gian lưu log** — hiện chưa có quy định xoá log cũ. Cần lưu tối thiểu bao lâu (1 năm / 3 năm / vĩnh viễn)? | |
| 3 | **Quyền xem Audit log** — hiện chỉ HQ Admin. Có cần mở cho vai trò nào khác không (ví dụ: kế toán chỉ xem nhóm hoá đơn)? | |
| 4 | **Giới hạn xuất file** — file CSV bị cắt ở 50.000 dòng. Có cần nâng giới hạn không? | |
| 5 | **Các thao tác CHỈ ĐỌC** (`candidate.read`, `application.read`, `talent_pool.read`…) tạo rất nhiều dòng log. Có cần ghi hết không, hay chỉ ghi khi xem dữ liệu cá nhân? | |

## Đề xuất bổ sung

Nhờ anh/chị ghi vào đây những event **cần có thêm** mà bảng trên chưa liệt kê:

| Nghiệp vụ cần ghi log | Lý do cần | Mức ưu tiên |
|---|---|---|
| | | |
| | | |
| | | |

---

*File này được trích tự động từ mã nguồn backend. Khi backend thêm event mới, cần trích lại để danh sách không lạc hậu.*
