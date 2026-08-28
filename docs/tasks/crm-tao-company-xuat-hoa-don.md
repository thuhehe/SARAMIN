# [CRM] Tạo Company — nhóm field định danh, nút Verify MST, và thông tin xuất hóa đơn thừa kế

**Module:** CRM — Sales & customer lifecycle
**Phạm vi sửa:** 3 màn hình · **Loại:** thay đổi field + validation + luồng
**Requirement chi tiết (source of truth):** https://saramin-eta.vercel.app/m/crm/companies

---

## 0. Bối cảnh — đọc trước khi code

| Cần hiểu | Ở đâu |
|---|---|
| Bức tranh tổng thể CRM: Free data ↔ Company list là **một bảng công ty ở hai mức hoàn thiện**, hai cửa tạo đều của Admin, sales không tạo công ty | https://saramin-eta.vercel.app/m/crm/danh-ba-doanh-nghiep-free-company-data |
| Sơ đồ luồng vào CRM (Free data → Company list, Sign-up → Company) | cùng trang trên, mục *ONE company table, two states* |
| Mockup form tạo Company (bản đã cập nhật) | https://saramin-eta.vercel.app/wireframe/admin?screen=admin-company-list → bấm **+ New company** |
| Mockup Basic-info card (phải giống form field-for-field) | cùng screen → mở 1 công ty → tab **Overview** |
| Mockup dialog Issue PO | https://saramin-eta.vercel.app/wireframe/admin?screen=admin-quotes → mở 1 quotation **Sent** → **Issue PO →** |

**Nguyên tắc xuyên suốt toàn task:** form tạo Company chia làm **2 nhóm trả lời 2 câu hỏi khác nhau** —
*“pháp nhân này là ai”* (**Thông tin công ty**) và *“hóa đơn xuất cho ai”* (**Thông tin xuất hóa đơn**).
Nhóm 2 **thừa kế** từ nhóm 1, không phải bản copy để nhập lại.

---

## Task 1 — Nhóm “Thông tin công ty”: 3 field bắt buộc để định danh + field phân loại công ty

**Màn hình:** Form tạo Company (Company list → + New company) **và** Basic-info card ở Company detail (luật mirror: 2 nơi giống nhau field-for-field).

### 1.1 Field list

| # | Field | Key | Bắt buộc | Kiểu | Ghi chú |
|---|---|---|---|---|---|
| 1 | **Loại công ty** | `companyType` | ✓ (default `trong-nuoc`) | enum `trong-nuoc` \| `nuoc-ngoai` | **FIELD MỚI.** Đặt **đầu tiên** trong nhóm — nó đổi nghĩa của ô MST ngay dưới và gate các option ở nhóm xuất hóa đơn |
| 2 | **Tên đơn vị / Legal name** | `legalName` | ✓ | string | Đúng như ĐKKD. Verify “có tồn tại” → tự điền từ cơ quan thuế, rep vẫn sửa được |
| 3 | **Mã số thuế (MST)** | `taxCode` | ✓ nếu `trong-nuoc`<br>— nếu `nuoc-ngoai` | string | Trong nước: 10 số, hoặc 10 số + `-001` (chi nhánh). Nước ngoài: xem 1.2 |
| 4 | **Địa chỉ đăng ký MST** | `registeredAddress` | ✓ | string | Verify “có tồn tại” → tự điền. Nước ngoài: label đổi thành **“Địa chỉ đăng ký”** |
| 5 | Tên hiển thị | `shortName` | — | string | Brand name; bỏ trống thì mọi danh sách fallback về `legalName` |

→ Cửa **Company list** bắt buộc **5 thông tin**: 3 field định danh trên + **Người liên hệ** + **Sales owner**.
→ Công ty **nước ngoài**: **4 thông tin** (bỏ MST).
→ Header form phải in đúng con số + danh sách field, và **đổi theo `companyType`** ngay khi user chọn.

### 1.2 `companyType = nuoc-ngoai` — MST chỉ là mã tham chiếu

Chốt: **công ty nước ngoài KHÔNG có mã số thuế Việt Nam.** Con số nhập vào chỉ là mã số thuế ở nước sở tại, để tham chiếu, **không tra cứu được trên hệ thống thuế VN**.

| Điểm | `trong-nuoc` | `nuoc-ngoai` |
|---|---|---|
| Label ô MST | `Mã số thuế (MST) *` | `Mã số thuế nước ngoài (tham chiếu)` — **không có dấu `*`** |
| Bắt buộc | ✓ | **không** |
| Placeholder | `0328xxxxxx-001` | `Tax ID nước sở tại (nếu có)` |
| Nút **Verify** / **Tra cứu** | Hiện | **KHÔNG hiển thị** |
| Autofill tên + địa chỉ từ cơ quan thuế | Có (khi verify OK) | Không có |
| Danh sách “trùng 10 số gốc MST” (gợi ý chi nhánh / công ty mẹ) | Hiện | **Ẩn** — gốc MST là khái niệm của MST Việt Nam |
| Label địa chỉ | `Địa chỉ đăng ký mã số thuế` | `Địa chỉ đăng ký` (nước sở tại) |
| Check trùng MST | Có | **Vẫn có** nếu người dùng có nhập giá trị |

### 1.3 Acceptance criteria — Task 1

- [ ] Chọn `Công ty nước ngoài` → nút Verify **biến mất**, label ô MST đổi, `*` biến mất, header form đổi từ *“bắt buộc 5 thông tin”* → *“bắt buộc 4 thông tin”*.
- [ ] Chọn lại `Công ty trong nước` → tất cả trở lại như cũ, và **kết quả verify cũ bị xóa** (không giữ chip từ trạng thái trước).
- [ ] Lưu công ty nước ngoài **không nhập MST** → thành công.
- [ ] Lưu công ty trong nước **không nhập MST** → bị chặn (field required).
- [ ] Basic-info card ở Company detail hiển thị đúng cùng bộ field + cùng label theo `companyType` (cả view mode và edit mode).
- [ ] Hồ sơ cũ chưa có `companyType`: suy ra từ phân loại người mua đang lưu — `dn-nn` → `nuoc-ngoai`, còn lại → `trong-nuoc`. Không cần migration bắt buộc nhập tay.

---

## Task 2 — Nút **Verify** ở ô MST: 2 chip kết quả, và chip nào cũng KHÔNG chặn tạo

**Đây là phần dễ code sai nhất của cả ticket. Đọc kỹ ô “Chặn tạo?”.**

Nút **Verify** (tên cũ: *Tra cứu*) hỏi hệ thống thuế đúng một câu — *số này có tồn tại không?* — và trả lời bằng **một trong hai chip** ngay dưới ô MST.

### 2.1 Hành vi

| Tình huống | Hiển thị | Chặn tạo công ty? |
|---|---|---|
| Verify → số **CÓ** trên hệ thống thuế | Chip xanh **“✓ Có tồn tại trên MST”** + **tự điền** Tên đơn vị & Địa chỉ đăng ký từ cơ quan thuế (rep sửa được) | **KHÔNG** |
| Verify → số **KHÔNG** có | Chip vàng **“✕ Không có tồn tại trên MST”** + câu *“Chỉ là thông tin — vẫn tạo được công ty, miễn MST không trùng.”* | **KHÔNG** |
| Không bấm Verify | Không chip nào | **KHÔNG** — Verify không bắt buộc |
| Sửa ô MST sau khi verify | Chip **biến mất** | — kết quả verify thuộc về đúng chuỗi đã kiểm |
| Đổi `companyType` sau khi verify | Chip **biến mất** | — |
| `companyType = nuoc-ngoai` | **Không có nút Verify** | — |

- Nút **disable** đến khi ô MST đủ 10 chữ số → một lần bấm cho một số đọc được.
- Trạng thái đang gọi API: label nút đổi thành **“Đang kiểm tra…”**.
- Chip xanh **thay thế** banner “Đã lấy thông tin từ cơ quan thuế” của bản cũ — một kết quả, một chỗ đọc.
- Chip vàng **không điền gì, không khóa gì** — form nhập tay như thường.

### 2.2 Điều kiện DUY NHẤT chặn tạo công ty: **MST unique**

| Rule | Chi tiết | Hành vi UI |
|---|---|---|
| **MST unique** | So sánh trên **full string** — `0301234567` và `0301234567-001` là **hai giá trị khác nhau, đều hợp lệ**. Quét **CẢ HAI kho**: Company list **và** Free data | |
| Trùng ở **Company list** | Đã có hồ sơ CRM giữ số này | **Banner đỏ — CHẶN tạo.** “MST này đã thuộc `{tên công ty}` trên Company list — không tạo được.” + link mở hồ sơ đó. Đây là banner đỏ **duy nhất** của form |
| Trùng ở **Free data** | Công ty đã có trong bể dữ liệu, chưa có chủ | **Banner amber — không tạo mới.** Mở thẳng dòng Free data để **phân trực tiếp cho sales** → công ty lên Company list mang theo dữ liệu danh bạ, thay vì thành bản ghi thứ hai |
| Trùng **10 số gốc** MST | Cùng pháp nhân, khác chi nhánh | **Không chặn.** Danh sách gợi ý liên kết mẹ/con, rep chọn hoặc bỏ qua |

### 2.3 API cần cho Verify

```
POST /api/crm/tax-code/verify   { taxCode: string }
→ 200 { exists: true,  legalName: string, registeredAddress: string, industry?: string }
→ 200 { exists: false }
```
- Lỗi mạng / service thuế down → hiển thị như trường hợp **không bấm Verify** (không chip, không lỗi đỏ). **Không được** biến sự cố của service thành lỗi chặn lưu.
- Kết quả verify **không cần lưu** vào DB như một trạng thái phê duyệt. Nếu muốn lưu để audit thì lưu dạng `{ checkedAt, exists }` — và **không** field nào của nó được tham gia validate lúc save.

### 2.4 Acceptance criteria — Task 2

- [ ] Verify một MST **không tồn tại** → hiện chip vàng → vẫn bấm **Lưu** được và tạo thành công.
- [ ] Verify một MST **tồn tại** → chip xanh + Tên đơn vị và Địa chỉ đăng ký được điền tự động, và **vẫn sửa được**.
- [ ] Sửa 1 ký tự trong ô MST → chip biến mất ngay.
- [ ] Nhập MST **trùng với 1 công ty trong Company list** → banner đỏ, **nút Lưu bị chặn**, dù đã verify ra chip xanh.
- [ ] Nhập MST **trùng với 1 dòng Free data** → banner amber + link mở dòng đó; không tạo bản ghi mới.
- [ ] `0301234567` và `0301234567-001` được coi là 2 giá trị khác nhau → **không** báo trùng lẫn nhau.

---

## Task 3 — “Thông tin xuất hóa đơn” thừa kế từ “Thông tin công ty”, không cho nhập tay

**Màn hình:** Form tạo Company + Basic-info card.

### 3.1 Luật thừa kế

Câu hỏi quyết định **không** phải tên phân loại, mà là: **người mua trên hóa đơn có phải chính công ty này không?**

| Phân loại người mua | Người mua là | Các dòng hóa đơn | Field nhập tay |
|---|---|---|---|
| **Doanh nghiệp Việt Nam** (`dn-vn`) | chính công ty | **THỪA KẾ** từ Thông tin công ty: Tên đơn vị · MST · Địa chỉ xuất hóa đơn | **Không có** |
| **Doanh nghiệp nước ngoài** (`dn-nn`) | chính công ty | **THỪA KẾ**: Tên đơn vị · Địa chỉ xuất hóa đơn — **không có dòng MST** | **Không có** |
| **Cá nhân có CCCD** (`ca-nhan-cccd`) | một người khác | Họ tên người mua hàng · Số CCCD · Địa chỉ xuất hóa đơn | Có — vì người mua là bên khác |
| **Cá nhân không có CCCD** (`ca-nhan`) | khách lẻ | Chỉ in một dòng **“Bán cho người tiêu dùng”** | Không hỏi gì cả |

- Dòng thừa kế render dạng **giá trị đã điền + nhãn “tự điền”**, **không phải input**.
- Sửa ở **Thông tin công ty** → dòng thừa kế đổi theo. **Không lưu bản chép thứ hai** trong DB.
- `companyType` **gate** danh sách phân loại người mua:

| `companyType` | Phân loại người mua được phép |
|---|---|
| `trong-nuoc` | Doanh nghiệp Việt Nam · Cá nhân có CCCD · Cá nhân không có CCCD |
| `nuoc-ngoai` | Doanh nghiệp nước ngoài · Cá nhân có CCCD · Cá nhân không có CCCD |

- Đổi `companyType` mà phân loại đang chọn không còn hợp lệ → **tự chuyển sang phân loại hợp lệ đầu tiên** của loại mới. Không để nguyên một lựa chọn đã bị vô hiệu.

### 3.2 KHÔNG có checkbox “Set as default” trên form tạo

Phân loại chọn lúc tạo **chính là** mặc định của công ty → một checkbox ở đây là câu hỏi chỉ có một đáp án đúng.
Form tạo thay checkbox bằng **một câu ghi chú**: *phân loại này là mặc định; đổi lúc phát hành PO không sửa hồ sơ, trừ khi tick “Đặt làm mặc định” ngay trên dialog Issue PO.*

Checkbox **“Set as default”** chỉ tồn tại ở **Task 4**.

### 3.3 Acceptance criteria — Task 3

- [ ] `trong-nuoc` + `Doanh nghiệp Việt Nam` → nhóm xuất hóa đơn **không có input nào**, hiện 3 dòng thừa kế có nhãn “tự điền”.
- [ ] `nuoc-ngoai` + `Doanh nghiệp nước ngoài` → **2 dòng** thừa kế (không có dòng MST).
- [ ] Sửa Legal name ở nhóm trên → dòng thừa kế ở nhóm dưới đổi theo ngay.
- [ ] Chọn `Cá nhân có CCCD` → xuất hiện đúng các field của cá nhân (họ tên, CCCD, địa chỉ).
- [ ] Đang ở `nuoc-ngoai` + `Doanh nghiệp nước ngoài`, đổi sang `trong-nuoc` → phân loại tự chuyển về `Doanh nghiệp Việt Nam`.
- [ ] Form tạo **không có** checkbox “Set as default”.
- [ ] DB: không sinh thêm cột lưu trùng legalName / taxCode / address cho mục đích hóa đơn.

---

## Task 4 — Quotation → **Issue PO**: chọn cách thức xuất hóa đơn

**Màn hình:** dialog **Issue PO** mở từ một quotation trạng thái *Sent*.

Ở Việt Nam, *“xuất hóa đơn theo thông tin nào?”* là câu hỏi của **từng giao dịch**, không cố định một lần lúc tạo khách hàng (công ty mẹ trả tiền · sếp mua bằng tên cá nhân · pháp nhân nước ngoài thanh toán). Mô hình 2 tầng, giống MISA/Fast:

| Tầng | Ở đâu | Hành vi |
|---|---|---|
| **Mặc định** | hồ sơ công ty | Phân loại người mua lưu trên hồ sơ (Task 3) |
| **Theo chứng từ** | dialog Issue PO | Prefill từ hồ sơ, **đổi được cho riêng PO/hóa đơn này** |

### 4.1 Yêu cầu

| # | Yêu cầu |
|---|---|
| 1 | Dropdown **“Xuất cho / Phân loại người mua”**, option của hồ sơ có hậu tố **“— theo hồ sơ”** |
| 2 | Danh sách option **gate theo `companyType`** — đúng bảng ở 3.1. Công ty nước ngoài **không bao giờ** được chọn *Doanh nghiệp Việt Nam* |
| 3 | Đổi phân loại → bộ field đổi theo đúng 4 hình dạng ở 3.1 |
| 4 | **Sales không gõ lại bất kỳ thông tin người mua nào.** Mọi định danh (legal name · MST · CCCD · địa chỉ) hiển thị dạng **giá trị + nhãn “hồ sơ”**, không phải input. Sai giá trị → sửa ở hồ sơ công ty, không sửa tại chứng từ |
| 5 | Checkbox **“Đặt làm mặc định cho công ty này”** — **chỉ hiện khi** phân loại đang chọn **khác** phân loại của hồ sơ, và **default KHÔNG tick** |
| 6 | Tick → ghi phân loại này vào **hồ sơ công ty**, các PO sau tự dùng. Không tick → chỉ áp dụng **một lần** cho PO này, hồ sơ không đổi |
| 7 | Điều khoản thanh toán: **3 option** — `100% in advance` · `50 / 50` · `Others`. Chọn *Others* → mở ô free-text ghi rõ điều khoản |
| 8 | **Đã bỏ khỏi dialog:** `Customer PO number` và nút `+ Attach their signed PO / confirmation` — số PO bên mua và file xác nhận là chứng từ đến **sau**, thuộc hồ sơ PO, không phải điều kiện để phát hành |

### 4.2 Snapshot

PO **chốt thông tin người mua tại thời điểm phát hành**. Hóa đơn VAT phải khớp **từng ký tự** với PO — sửa sau đó là **cancel + re-issue**, không phải update. Vì vậy: lưu snapshot thông tin người mua **lên bản ghi PO**, không phải chỉ lưu ref tới hồ sơ công ty.

### 4.3 Acceptance criteria — Task 4

- [ ] Mở Issue PO của một công ty **trong nước** → dropdown có **3 option**, *Doanh nghiệp Việt Nam* mang nhãn “— theo hồ sơ”.
- [ ] Mở Issue PO của một công ty **nước ngoài** → dropdown có **3 option**, *Doanh nghiệp nước ngoài* mang nhãn “— theo hồ sơ”, **không có** *Doanh nghiệp Việt Nam*.
- [ ] Chưa đổi phân loại → **không thấy** checkbox “Đặt làm mặc định”.
- [ ] Đổi phân loại → checkbox xuất hiện, **chưa tick**.
- [ ] Đổi phân loại, **không** tick, phát hành PO → PO dùng phân loại mới, **hồ sơ công ty không đổi**.
- [ ] Đổi phân loại, **có** tick, phát hành PO → hồ sơ công ty được cập nhật, PO tiếp theo prefill theo phân loại mới.
- [ ] Không có input nào cho legal name / MST / CCCD / địa chỉ trong dialog.
- [ ] Chọn `Others` ở điều khoản thanh toán → hiện ô nhập nội dung điều khoản.

---

## 5. Data model — thay đổi cần thiết

| Bảng | Cột | Kiểu | Ghi chú |
|---|---|---|---|
| `company` | **`company_type`** | enum(`trong_nuoc`,`nuoc_ngoai`) NOT NULL default `trong_nuoc` | **MỚI.** Backfill: `buyer_type = 'dn_nn'` → `nuoc_ngoai`, còn lại `trong_nuoc` |
| `company` | `tax_code` | varchar NULL | Bỏ NOT NULL nếu đang là NOT NULL — công ty nước ngoài được để trống. **UNIQUE index trên full string**, quét chung không gian với bảng Free data |
| `company` | `registered_address` | varchar NOT NULL | Địa chỉ đăng ký MST — tách khỏi địa chỉ làm việc thực tế |
| `company` | `buyer_type` | enum(`dn_vn`,`dn_nn`,`ca_nhan_cccd`,`ca_nhan`) | Mặc định xuất hóa đơn của hồ sơ. Validate hợp lệ theo `company_type` |
| `company` | ~~`billing_legal_name`, `billing_tax_code`, `billing_address`~~ | — | **KHÔNG tạo** cho trường hợp `dn_vn` / `dn_nn` — đọc thừa kế từ cột định danh. Chỉ lưu field riêng cho 2 dạng cá nhân (`buyer_name`, `id_card`) |
| `purchase_order` | `buyer_type` + snapshot người mua | enum + các cột text | Snapshot tại lúc phát hành (mục 4.2) |
| `purchase_order` | `payment_terms`, `payment_terms_other` | enum + text NULL | 3 option; `other` mới có nội dung |

---

## 6. Tổng hợp validation — cái gì chặn, cái gì không

| Rule | Khi nào | Chặn lưu? |
|---|---|---|
| `legalName` bắt buộc | luôn luôn | **✓ Chặn** |
| `registeredAddress` bắt buộc | luôn luôn | **✓ Chặn** |
| `taxCode` bắt buộc | chỉ khi `companyType = trong-nuoc` | **✓ Chặn** |
| `taxCode` unique (full string, cả 2 kho) | khi có giá trị | **✓ Chặn** |
| Người liên hệ + Sales owner bắt buộc | cửa Company list | **✓ Chặn** |
| `buyerType` hợp lệ theo `companyType` | luôn luôn | **✓ Chặn** (nhưng UI tự sửa trước khi tới bước này) |
| **Verify MST → “Không có tồn tại”** | khi rep bấm Verify | **✕ KHÔNG chặn** |
| **Verify MST → chưa bấm** | luôn luôn | **✕ KHÔNG chặn** |
| Trùng 10 số gốc MST | công ty trong nước | **✕ KHÔNG chặn** — chỉ gợi ý liên kết |
| Service thuế lỗi / timeout | khi bấm Verify | **✕ KHÔNG chặn** |

---

## 7. KHÔNG làm (để tránh code thêm thứ spec không có)

- ❌ **Không** biến “Không có tồn tại trên MST” thành lỗi validation. Đây là điều spec cấm rõ ràng — công ty vừa đăng ký có thể chưa lên hệ thống thuế trong nhiều ngày; độ trễ đó là của registry, không phải của khách hàng.
- ❌ **Không** thêm nút Verify / Tra cứu cho công ty nước ngoài. Một nút chỉ có thể fail sẽ dạy người dùng bỏ qua nút.
- ❌ **Không** thêm checkbox “Set as default” vào form tạo Company. Nó chỉ thuộc dialog Issue PO.
- ❌ **Không** cho nhập tay thông tin xuất hóa đơn khi người mua là chính công ty. Bản chép thứ hai là cách hồ sơ và hóa đơn lệch nhau một ký tự.
- ❌ **Không** cho sales gõ lại định danh người mua trên dialog Issue PO.
- ❌ **Không** thêm cửa tạo công ty ở màn Sign-ups. Màn đó không hỏi phân loại người mua / địa chỉ xuất hóa đơn / người liên hệ → hồ sơ tạo từ đó sẽ tắc ở bước xuất hóa đơn VAT, lúc đó công ty đã có user đang đăng nhập.

---

## 8. Deep link tới từng requirement (spec site)

| Requirement | Link |
|---|---|
| Task 1 — nhóm Thông tin công ty | `/m/crm/companies#tao-company-thong-tin-cong-ty-3-field-dinh-danh-mot-field-phan-loai` |
| Task 2 — nút Verify + 2 chip | `/m/crm/companies#nut-verify-hai-chip-ket-qua-chip-nao-cung-chi-de-biet` |
| Task 3 — gate phân loại theo loại công ty | `/m/crm/companies#loai-cong-ty-gates-the-invoice-classifications` |
| Task 3 + 4 — mặc định trên hồ sơ, đổi theo từng PO | `/m/crm/companies#thong-tin-xuat-hoa-don-mac-dinh-tren-ho-so-doi-duoc-theo-tung-po` |
| Bối cảnh — hai cửa tạo công ty | `/m/crm/danh-ba-doanh-nghiep-free-company-data#one-company-table-two-states-and-two-admin-only-create-doors` |

Prefix: `https://saramin-eta.vercel.app`
