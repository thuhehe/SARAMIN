# [Admin] Invoice: xuất hóa đơn chính thức theo đợt — toàn bộ / một phần giá trị / số tiền còn lại

**Module:** CRM — Sales back office (Quotation → PO → Invoice)
**Màn hình:** Admin → CRM → Invoice → dialog **Xuất hóa đơn chính thức**
**Requirement (source of truth):** https://saramin-eta.vercel.app/m/crm/invoice-vat-e-invoice
**Mockup:** https://saramin-eta.vercel.app/wireframe/admin?screen=admin-invoices

---

## 0. Yêu cầu gốc

Khi kế toán xuất hóa đơn chính thức, có **dropdown chọn 1 trong 2 kiểu**:

1. **Xuất theo tổng số tiền của đơn hàng** — đúng như hệ thống đang làm hiện nay, dòng hàng hóa copy nguyên từ PO.
2. **Xuất theo số tiền nhỏ hơn** — hiện ra **2 field nhập tay**: (a) **Tên hàng hóa, dịch vụ** và (b) **Đơn giá**. Phần còn lại (thành tiền trước thuế, tiền thuế, tổng tiền thanh toán, số tiền bằng chữ) hệ thống **tự tính**.
3. Từ **hóa đơn thứ 2 trở đi** của cùng một đơn hàng: thêm **checkbox “Xuất số tiền còn lại”** — tick vào thì hệ thống **tự tính số tiền còn lại và tự suy ra đơn giá**. **Field “Tên hàng hóa, dịch vụ” vẫn phải nhập tay.**

Hóa đơn mẫu khách gửi — đây là dòng hàng hóa của **đợt 1**, và là format phải in ra được:

> **Tên hàng hóa, dịch vụ:** Dịch vụ tuyển dụng Saramin theo hợp đồng số 27022026/HĐTD/DKI – NIPA (ĐỢT 1)
> **ĐVT:** Gói · **SL:** 1 · **Đơn giá:** 174.300.000 · **Thành tiền trước thuế:** 174.300.000
> **Thuế suất:** 8% · **Tiền thuế:** 13.944.000 · **Tổng tiền thanh toán:** 188.244.000

![Hóa đơn mẫu — đợt 1](https://saramin-eta.vercel.app/tickets/invoice-xuat-theo-dot/hoa-don-mau-dot-1.jpg)

Phần in khung đỏ chính là **field (a)** mà kế toán gõ tay. Mọi con số bên phải nó đều do **field (b) Đơn giá** sinh ra.

---

## 1. Đọc trước khi ước lượng — đây KHÔNG phải task thêm 2 field

Hệ thống hiện tại chốt cứng **1 đơn hàng = 1 hóa đơn, và số tiền hóa đơn phải bằng đúng số tiền PO**. Yêu cầu này phá cả hai. Danh sách ràng buộc phải gỡ:

| # | Ràng buộc hiện tại | Nằm ở đâu | Phải đổi thành |
|---|---|---|---|
| 1 | `UNIQUE (po_id)` trên bảng `invoice` — một PO chỉ được có đúng 1 hóa đơn | `V214__invoice_status_derived.sql`, constraint `uq_invoice_po` | Bỏ UNIQUE 1 cột, thay bằng `UNIQUE (po_id, tranche_no)` — một PO có N hóa đơn, mỗi hóa đơn là 1 đợt |
| 2 | `InvoiceRepository.findByPoId()` trả `Optional<Invoice>` | `svn-application/.../sales/port/out/InvoiceRepository.java` | Trả `List<Invoice>`; thêm `findLatestByPoId` / `findByPoIdAndTrancheNo` |
| 3 | Compact constructor của `Invoice` **tự dựng lại toàn bộ bậc thang tiền từ các dòng và bắt buộc khớp PO** | `svn-domain/.../sales/Invoice.java` | Invariant mới: tổng tiền trước thuế của **tất cả** hóa đơn chưa bị hủy của 1 PO ≤ tổng tiền trước thuế của PO. Từng hóa đơn lẻ không còn phải bằng PO |
| 4 | Trạng thái hóa đơn **không được lưu**, mà suy ra từ trạng thái PO (`DRAFT`/`REQUESTED`/`ISSUED`/`ARCHIVED`) | `V214`, `InvoiceStatus.of()` | Một PO có thể đồng thời có đợt 1 đã phát hành và đợt 2 còn nháp → PO không còn giữ được trạng thái hộ. Hóa đơn phải có status riêng trở lại. Xem **Quyết định D1** |
| 5 | `invoice_line.product_id NOT NULL` — mỗi dòng hóa đơn là snapshot của 1 sản phẩm | `V170__vat_invoice.sql` | Dòng nhập tay không gắn sản phẩm nào → cho phép NULL, kèm cột đánh dấu dòng nhập tay |
| 6 | `InvoiceService.workingDocument()` ném lỗi *“This invoice is already declared”* khi PO đã có hóa đơn phát hành | `svn-application/.../sales/service/InvoiceService.java` | Phải cho mở document mới (đợt kế tiếp) khi PO vẫn còn số tiền chưa xuất |
| 7 | PO **hết hạn cuối tháng** nếu chưa có hóa đơn chính thức (`requireInsideItsMonth`) | cùng file + job quét hàng giờ | PO đã xuất được ít nhất 1 đợt thì **không được hết hạn**, nếu không đợt 2 vĩnh viễn không xuất được. Xem **Quyết định D2** |
| 8 | Phát hành hóa đơn = **cấp quota ngay + bắt đầu đồng hồ 12 tháng** | `InvoiceService.issue()` phase C | Chỉ cấp **một lần**, ở **đợt đầu tiên**. Các đợt sau không cấp thêm gì. Xem **Quyết định D3** |
| 9 | `FiscalLine.of(invoice)` tự thêm **dòng chiết khấu tổng đơn** vào XML gửi nhà cung cấp hóa đơn điện tử | `svn-domain/.../sales/FiscalLine.java` | Ở chế độ “một phần”, chỉ có **đúng 1 dòng GOODS**, **không** sinh dòng chiết khấu — chiết khấu đã nằm trong số tiền của đợt rồi, thêm nữa là trừ 2 lần |

> Hệ quả thực tế: không có cách nào làm task này chỉ bằng FE. Phải đi cả DB migration + domain + API + FE.

---

## 2. UI — dialog “Xuất hóa đơn chính thức”

Dropdown nằm **trên cùng dialog**, trước mọi field khác, vì nó quyết định phần còn lại của form hiển thị cái gì.

### 2.1 Dropdown “Giá trị xuất hóa đơn”

| Option | Label | Mặc định | Form hiển thị |
|---|---|---|---|
| `FULL` | **Toàn bộ giá trị đơn hàng** | ✓ (khi PO chưa xuất đợt nào) | Y hệt hiện tại — bảng dòng hàng hóa copy từ PO, read-only |
| `PARTIAL` | **Một phần giá trị đơn hàng** | ✓ (khi PO đã có đợt đã phát hành) | Ẩn bảng dòng hàng hóa của PO, hiện khối nhập tay ở 2.2 |

- PO **đã xuất ít nhất 1 đợt** → option `FULL` bị **disable** (không thể xuất lại toàn bộ lần nữa), tooltip: *“Đơn hàng đã xuất {X} đồng, chỉ còn {Y} đồng chưa xuất.”*
- Dropdown **khóa sau khi hóa đơn đã phát hành** — hóa đơn chính thức là bất biến.

### 2.2 Khối nhập tay (chỉ ở chế độ `PARTIAL`)

| # | Field | Key | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|---|
| a | **Tên hàng hóa, dịch vụ** | `lineName` | ✓ | textarea, tối đa **255 ký tự** | Khớp `invoice_line.name_vi VARCHAR(255)`. Gõ tay 100%, **luôn gõ tay kể cả khi tick “số tiền còn lại”**. Prefill gợi ý: xem **Quyết định D5** |
| b | **Đơn giá (chưa thuế)** | `unitPrice` | ✓ | number, VND, số nguyên ≥ 1 | Hiển thị phân cách hàng nghìn. Bị **khóa read-only** khi tick checkbox ở 2.3 |

**Các ô read-only hệ thống tự tính, hiển thị ngay dưới, cập nhật realtime khi gõ đơn giá:**

| Ô | Giá trị |
|---|---|
| Đơn vị tính | `Gói` — cố định, xem **Quyết định D4** |
| Số lượng | `1` — cố định |
| Thành tiền trước thuế | `= Đơn giá × 1` |
| Thuế suất | Lấy `vatRatePercent` **của PO** (hiện 8%) — không cho sửa, không đọc giá trị hiện hành |
| Tiền thuế | `= làm tròn(Thành tiền trước thuế × Thuế suất)` |
| Tổng tiền thanh toán | `= Thành tiền trước thuế + Tiền thuế` |
| Số tiền viết bằng chữ | Dùng lại `VietnameseAmount` sẵn có |
| Còn lại sau đợt này | `= Số tiền còn lại trước đó − Thành tiền trước thuế` |

### 2.3 Checkbox “Xuất số tiền còn lại”

- **Chỉ hiển thị từ hóa đơn thứ 2 trở đi** của cùng một PO (`tranche_no ≥ 2`). Hóa đơn đầu tiên: không có checkbox này.
- Tick → ô **Đơn giá** chuyển read-only và tự điền = **số tiền còn lại (trước thuế)**; mọi ô tính toán ở 2.2 cập nhật theo.
- Bỏ tick → ô Đơn giá mở lại, giữ nguyên giá trị vừa điền để kế toán sửa.
- **Tên hàng hóa, dịch vụ vẫn bắt buộc gõ tay** — checkbox không prefill, không khóa field này.
- Số tiền còn lại = 0 → không mở được dialog xuất đợt mới (nút bị disable, tooltip *“Đơn hàng đã xuất hóa đơn đủ giá trị.”*).

### 2.4 Validation

| Điều kiện | Chặn? | Thông báo |
|---|---|---|
| `lineName` rỗng / chỉ khoảng trắng | ✓ chặn submit | *Nhập tên hàng hóa, dịch vụ.* |
| `lineName` > 255 ký tự | ✓ chặn | *Tên hàng hóa, dịch vụ tối đa 255 ký tự.* |
| `unitPrice` ≤ 0 hoặc rỗng | ✓ chặn | *Đơn giá phải lớn hơn 0.* |
| `unitPrice` > số tiền còn lại | ✓ chặn | *Vượt quá số tiền chưa xuất hóa đơn của đơn hàng ({Y} ₫).* |
| `unitPrice` không phải số nguyên | ✓ chặn | *Đơn giá là số nguyên (đồng).* |
| PO đã hủy / hết hạn | ✓ chặn, ẩn luôn nút xuất | — |
| Số tiền còn lại = 0 | ✓ chặn mở dialog | *Đơn hàng đã xuất hóa đơn đủ giá trị.* |
| Đơn giá < số tiền còn lại (xuất thiếu) | **không chặn** | Đây là chuyện bình thường — còn đợt sau |
| PO chưa thu tiền | **không chặn** | Giữ nguyên nguyên tắc hiện tại: xuất hóa đơn **không** phụ thuộc thanh toán |

---

## 3. Công thức và ví dụ

**Số tiền còn lại (trước thuế)** = `Tổng tiền trước thuế của PO` − `Σ thành tiền trước thuế của các hóa đơn đã phát hành của PO đó, KHÔNG tính hóa đơn đã Cancel`

- Hóa đơn nháp chưa phát hành **không** trừ vào số tiền còn lại.
- Hóa đơn bị Cancel (SRM-1081) **trả lại** số tiền của nó vào số tiền còn lại.
- Làm tròn tiền thuế: đến **đồng**, làm tròn nửa lên. Đợt **cuối cùng gánh phần lệch làm tròn**, để Σ các đợt bằng đúng tổng PO, không dư không thiếu 1 đồng.

**Ví dụ — PO 300.000.000 ₫ trước thuế, VAT 8%, xuất 2 đợt:**

| | Tên hàng hóa, dịch vụ | Đơn giá | Thành tiền trước thuế | Tiền thuế 8% | Tổng thanh toán | Còn lại sau đợt |
|---|---|---|---|---|---|---|
| Đợt 1 — `PARTIAL`, gõ tay đơn giá | Dịch vụ tuyển dụng Saramin theo hợp đồng số 27022026/HĐTD/DKI – NIPA (ĐỢT 1) | 174.300.000 | 174.300.000 | 13.944.000 | **188.244.000** | 125.700.000 |
| Đợt 2 — `PARTIAL` + tick *Xuất số tiền còn lại* | …(ĐỢT 2) — **vẫn gõ tay** | 125.700.000 *(tự điền)* | 125.700.000 | 10.056.000 | **135.756.000** | **0** |
| **Cộng** | | | **300.000.000** | **24.000.000** | **324.000.000** | |

---

## 4. Thay đổi dữ liệu và API

### 4.1 DB

| Bảng | Thay đổi |
|---|---|
| `invoice` | **DROP** `uq_invoice_po`; **ADD** `tranche_no INT NOT NULL DEFAULT 1` + `UNIQUE (po_id, tranche_no)` + `CHECK (tranche_no >= 1)` |
| `invoice` | **ADD** `scope VARCHAR(16) NOT NULL DEFAULT 'FULL'` — `FULL` \| `PARTIAL` |
| `invoice` | Xem **Quyết định D1**: có thể phải **ADD lại** cột `status` |
| `invoice_line` | `product_id` → **NULLABLE**; **ADD** `is_manual BOOLEAN NOT NULL DEFAULT FALSE`; `CHECK (is_manual OR product_id IS NOT NULL)` |
| Backfill | Mọi hóa đơn đang có: `tranche_no = 1`, `scope = 'FULL'` — không đổi hành vi dữ liệu cũ |

### 4.2 API

| Verb | Path | Thay đổi |
|---|---|---|
| `GET` | `/admin/sales/purchase-orders/:id` | Trả thêm `invoicedSubtotal`, `remainingSubtotal`, `invoiceCount` để FE vẽ dropdown + checkbox |
| `POST` | `/admin/sales/invoices` (tạo document đợt mới) | Nhận `scope`, `lineName`, `unitPrice`, `useRemaining` |
| `POST` | `/admin/sales/invoices/:id/issue` | Không đổi chữ ký; số tiền đã nằm trên document |
| `GET` | `/admin/sales/invoices` | Cột/filter phải chịu được nhiều hóa đơn cùng 1 PO; thêm cột **Đợt** (`1/2`, `2/2`) |

Backend **phải tự tính lại** số tiền còn lại ở thời điểm phát hành và từ chối nếu vượt — không tin số FE gửi lên. Hai kế toán mở 2 tab cùng lúc là ca phải chặn được (khóa theo `po_id`, cùng kiểu compare-and-swap đang dùng).

### 4.3 Nhà cung cấp hóa đơn điện tử (EasyInvoice)

- `InvoiceXmlBuilder` phải xuất được **dòng nhập tay**: tên tự do, ĐVT `Gói`, SL 1, đơn giá, thuế suất của PO.
- Chế độ `PARTIAL`: **không** sinh dòng chiết khấu tổng đơn (mục 1, hàng 9).
- Mỗi đợt là **một số hóa đơn pháp lý riêng** từ dải của nhà cung cấp — không chèn, không sửa số đã phát hành.

---

## 5. Quyết định cần chốt trước khi code (Thu chốt)

| # | Vấn đề | Đề xuất |
|---|---|---|
| **D1** | Một PO có đợt 1 đã phát hành + đợt 2 còn nháp → trạng thái hóa đơn không suy ra từ PO được nữa | **Trả cột `status` về cho hóa đơn** (`DRAFT`/`REQUESTED`/`ISSUED`/`CANCELLED`); PO thêm trạng thái **“Đã xuất một phần”**, và chỉ chuyển **“Đã xuất hóa đơn”** khi số tiền còn lại = 0 |
| **D2** | PO hết hạn cuối tháng nếu chưa xuất hóa đơn — đợt 2 thường rơi sang tháng sau | PO **đã xuất ít nhất 1 đợt thì không hết hạn nữa**; job quét bỏ qua. Nếu không, không ai xuất được đợt 2 |
| **D3** | Cấp quota ở đợt nào | Cấp **đủ 100% ở đợt đầu tiên**, các đợt sau không cấp thêm. Đồng hồ 12 tháng tính từ **đợt đầu tiên**. Không chia quota theo tỉ lệ tiền |
| **D4** | ĐVT và Số lượng ở chế độ một phần | **Cố định `Gói` / `1`** như hóa đơn mẫu. Nếu muốn cho sửa thì nói sớm, vì nó đổi cả công thức |
| **D5** | Hệ thống có tự gợi ý hậu tố “(ĐỢT n)” vào tên hàng hóa không | **Có prefill gợi ý** `Dịch vụ tuyển dụng Saramin theo hợp đồng số … (ĐỢT {n})`, kế toán **sửa đè thoải mái**. Prefill ≠ khóa field |
| **D6** | QR thanh toán trong mail hóa đơn: hiện mở theo kỳ thu của PO (`receivable.tranche_no`, do điều khoản thanh toán quyết định) | Số đợt hóa đơn **do kế toán chọn**, không nhất thiết trùng số kỳ thu của điều khoản thanh toán. Đề xuất: **QR của hóa đơn đợt N = đúng số tiền của hóa đơn đó**, tách khỏi điều khoản thanh toán |
| **D7** | Có giới hạn số đợt không | **Không giới hạn**; thứ chặn là số tiền còn lại |

---

## 6. Acceptance criteria

**Dropdown và chế độ toàn bộ**

- [ ] PO chưa có hóa đơn nào → dialog mở ra, dropdown mặc định **Toàn bộ giá trị đơn hàng**, form y hệt hiện tại, không có field nhập tay, không có checkbox.
- [ ] Xuất ở chế độ toàn bộ → hóa đơn ra số tiền bằng đúng PO, quota được cấp, hành vi **không khác gì trước task này** (regression).

**Chế độ một phần**

- [ ] Chọn **Một phần giá trị đơn hàng** → bảng dòng hàng hóa của PO biến mất, hiện đúng 2 field nhập tay: Tên hàng hóa, dịch vụ + Đơn giá.
- [ ] Gõ đơn giá `174300000` với PO VAT 8% → các ô tự tính hiện: thành tiền **174.300.000**, tiền thuế **13.944.000**, tổng thanh toán **188.244.000**, số tiền bằng chữ *“Một trăm tám mươi tám triệu hai trăm bốn mươi bốn nghìn đồng”*.
- [ ] Phát hành → PDF từ nhà cung cấp in **đúng 1 dòng**, tên đúng chữ kế toán gõ, ĐVT `Gói`, SL `1`, và các con số trên.
- [ ] PDF **không** có dòng chiết khấu tổng đơn.
- [ ] Nhập đơn giá lớn hơn số tiền còn lại → chặn submit kèm message nêu rõ số tiền còn lại.
- [ ] Bỏ trống tên hàng hóa → chặn submit.

**Từ đợt 2 trở đi**

- [ ] PO đã có đợt 1 phát hành → nút xuất hóa đơn mở được **document mới**, không còn lỗi *“already declared”*.
- [ ] Dialog đợt 2 hiện **checkbox “Xuất số tiền còn lại”**; đợt 1 **không** có checkbox này.
- [ ] Tick checkbox → Đơn giá tự điền đúng số tiền còn lại và chuyển read-only; bỏ tick → mở lại sửa được.
- [ ] Tick checkbox mà **không gõ tên hàng hóa** → vẫn chặn submit.
- [ ] Theo ví dụ mục 3: sau đợt 2, số tiền còn lại = **0**, tổng 2 hóa đơn = **300.000.000** trước thuế / **324.000.000** sau thuế, không lệch 1 đồng.
- [ ] Số tiền còn lại = 0 → nút xuất đợt mới bị disable kèm tooltip.
- [ ] Cancel hóa đơn đợt 1 → số tiền của nó **trả lại** vào số tiền còn lại, xuất lại được.

**Dữ liệu và danh sách**

- [ ] Danh sách Invoice hiển thị được **nhiều hóa đơn của cùng 1 PO**, có cột **Đợt** (`1/2`, `2/2`), mỗi dòng 1 số hóa đơn pháp lý riêng.
- [ ] Màn Company → Products & billing hiển thị đủ các đợt.
- [ ] Quota **chỉ được cấp 1 lần** ở đợt đầu; xuất đợt 2 **không** cấp thêm quota, không dời mốc “Activate by”.
- [ ] Dữ liệu cũ sau migration: mọi hóa đơn hiện có `tranche_no = 1`, `scope = FULL`, hiển thị y như trước.
- [ ] Hai tab cùng xuất đợt cuối một lúc → chỉ 1 cái thành công, cái còn lại báo lỗi số tiền còn lại, **không** tạo ra tổng vượt PO.

---

## 7. Không làm trong task này

- Không sửa / xuất lại hóa đơn đã phát hành — hóa đơn chính thức vẫn bất biến, sai thì Cancel (SRM-1081) rồi xuất lại.
- Không cho nhập **nhiều dòng** hàng hóa tay ở chế độ một phần — đúng 1 dòng.
- Không cho sửa thuế suất trên dialog; luôn lấy theo PO.
- Không tự động chia đợt theo điều khoản thanh toán — kế toán tự quyết số tiền từng đợt.
- Không đổi quy tắc “xuất hóa đơn không phụ thuộc đã thu tiền hay chưa”.
- Không đụng tới luồng mail/QR ngoài phần số tiền (chờ chốt **D6**).
