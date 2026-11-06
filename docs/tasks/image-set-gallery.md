# [Admin] Image gallery — gom ảnh thành IMAGE SET, 3 format, tag tự tạo, nhập hàng loạt từ Excel

**Module:** Banners & Pop-ups → Image gallery · **Site:** Admin · **Loại:** BE + FE
**Ticket:** [SRM-1407](https://pm.burningbros.kr/projects/SRM/board?open=47fe6d39-0016-410a-bd8f-afcf073530e7) · 5 subtask
**Requirement chi tiết (source of truth):** https://saramin-eta.vercel.app/m/banners-popups/image-gallery
**Requirement nhập hàng loạt:** https://saramin-eta.vercel.app/m/banners-popups/bulk-image-import
**Mockup bấm thử được:**
- Thư viện + tạo cụm: https://saramin-eta.vercel.app/wireframe/admin?screen=admin-image-gallery
- Nhập hàng loạt: https://saramin-eta.vercel.app/wireframe/admin?screen=admin-image-bulk
- Ảnh trên tin đăng (dùng lại cụm): https://saramin-eta.vercel.app/wireframe/admin?screen=admin-job-create → **+ New job** → mục **Card artwork**

---

## 0. Bối cảnh — đọc trước khi code

Trang tuyển dụng in **cùng một tấm ảnh ở ba khung khác nhau**: ngang (thẻ lúc nghỉ), dọc (thẻ mở rộng khi rê chuột), tròn (dải thẻ ảnh tròn). Hiện tại admin lưu **ảnh rời**: mỗi khung chọn một lần, không có gì ràng buộc ba kết quả là cùng một cảnh. Hệ quả thực tế là thẻ lúc hover hiện một tấm ảnh khác hẳn thẻ lúc nghỉ, và không ai phát hiện cho tới khi tin đã chạy.

Task này đổi đơn vị lưu trữ từ **ảnh** sang **cụm ảnh (image set)**: một cảnh, mang tối đa ba format của chính nó. Ba tác động:

1. Người tạo tin **chọn một lần được cả ba khung**, thay vì tìm thư viện ba lượt.
2. Hệ thống mới **tự điền được ảnh theo ngành** — không thể tự điền 3 khung từ 3 danh sách rời nhau.
3. Phân loại (ngành, tag, hạn bản quyền) gắn **một lần cho cả cụm**, không lặp lại ba lần.

**Mỗi cụm chỉ bắt buộc một field: Industry.** Name / Tag / Expiry date đều optional.

**Không có migration dữ liệu lớn:** thư viện hiện tại gần như trống, nên tạo bảng mới và bỏ bảng cũ là được. Xác nhận lại với HQ trước khi xoá.

---

## Thứ tự làm

Mỗi subtask là **một tính năng trọn vẹn** — BE và FE đi cùng nhau, không tách lớp.

```
Subtask 1 (quản lý hình theo set)   ← chặn tất cả
        ├── Subtask 2 (industry)  ─┐
        ├── Subtask 3 (tags)      ─┤  2 và 3 song song được
        └── Subtask 4 (tạo 1 set) ←┘  dùng picker của 2 và ô tag của 3
                └── Subtask 5 (nhập hàng loạt)
```

---

## Subtask 1 — Quản lý hình theo set

> SRM-1408 · priority HIGH · **nền tảng của 4 cái còn lại**

Thư viện lưu **cụm**, mỗi cụm tối đa 3 format của cùng một cảnh.

### Model

**`image_set`** — `id` · `name` text **NULL** (UI hiện `Cụm #n` khi trống) · `expires_at` date NULL **có index** (query "tháng này hết hạn gì") · `master_url`/`focal_x`/`focal_y` (chỉ có khi tạo bằng 1 ảnh gốc) · `status` enum(`active`,`archived`)

**`image_set_format`** — `UNIQUE(set_id, format)`

| Cột | Ghi chú |
|---|---|
| `format` | enum(`ngang`,`doc`,`tron`) — **khung nào cũng có thể không tồn tại** |
| `crop_box` jsonb NULL, `derived` bool | `derived = true` → cắt từ `master_url` của cụm |
| `file_url`, `width`, `height` | |
| `version` int | **Bất biến** — thay ảnh là ghi bản ghi mới, không sửa đè |

| Format | Size | In ở đâu |
|---|---|---|
| Ngang | 596 × 336 · 16:9 | Thẻ lúc nghỉ trên dải trả phí |
| Dọc | 600 × 800 · 3:4 | Thẻ mở rộng khi rê chuột |
| Tròn | 240 × 240 · 1:1 | Dải thẻ ảnh tròn |

> **Vì sao `version` phải bất biến:** tin đăng lưu **3 id của `image_set_format`**, không lưu `set_id`. Nhờ vậy HQ sửa/cắt lại/lưu trữ ảnh trong thư viện **không làm đổi ảnh của tin đang chạy**. Nếu thiếu, một lần dọn thư viện sẽ đổi ảnh hàng loạt tin đã bán.

### API

```
GET    /admin/image-sets?complete=&status=&q=
POST   /admin/image-sets
PATCH  /admin/image-sets/:id
POST   /admin/image-sets/:id/archive
PUT    /admin/image-sets/:id/formats/:format     // cắt lại hoặc thay tệp → version mới
DELETE /admin/image-sets/:id/formats/:format     // để trống khung đó
```

- Ảnh gốc **tối thiểu 1600 × 1200**, nhỏ hơn thì từ chối, **không phóng to**
- Cắt ảnh: lưu `crop_box` + focal point, **render/cache theo từng kích thước lúc phục vụ**. Không cắt sẵn thành file cứng — thêm một kích thước mới sau này sẽ phải cắt lại cả thư viện bằng tay.

### UI — trang danh sách + màn chi tiết

- Grid theo **cụm**. Mỗi thẻ vẽ **cả 3 format cạnh nhau, đúng tỉ lệ thật**. Khung thiếu vẽ ô gạch đứt chữ "trống".
- Cụm không đặt tên hiển thị `Cụm #n` in nghiêng mờ; tên sửa inline ở màn chi tiết
- Bộ lọc **Phiên bản** (đủ cả 3 / còn thiếu) · ẩn-hiện cụm đã lưu trữ · ô tìm theo tên
- Màn chi tiết: 3 khung kèm **focal point** và **vùng an toàn** mà thẻ sẽ vẽ đè lên (ô `badge`, dấu `☆`) — cắt ảnh phải nhìn trên thẻ thật, không đoán. Mỗi khung: *Cắt lại* · *Thay tệp*; khung trống: *Cắt từ ảnh gốc* · *Tải tệp riêng*. Ảnh `derived` có dấu ✂.

> **Không làm banner cảnh báo ở đầu trang.** Bản trước có 3 banner màu vàng, KH yêu cầu bỏ (06/11). Thông tin độ phủ nằm trong chính bộ lọc.

**Acceptance**
- [ ] `UNIQUE(set_id, format)` chặn một cụm có hai ảnh ngang
- [ ] Xoá một format → cụm vẫn tồn tại, `complete = false`
- [ ] Thay ảnh một khung sinh `version` mới, bản ghi cũ còn nguyên
- [ ] Upload ảnh 1200×900 → reject, message nói rõ do kích thước
- [ ] Archive cụm đang có N tin dùng → cảnh báo kèm N, không xoá
- [ ] Lọc `Phiên bản · Còn thiếu` ra đúng các cụm chưa đủ 3

---

## Subtask 2 — Liên kết image set theo Industry

> SRM-1409 · priority HIGH · phụ thuộc Subtask 1

### Gắn ngành — bắt buộc, chọn được cả 3 cấp

- `image_set.industry_ids` uuid[] **NOT NULL**, length ≥ 1 trừ khi `any_industry` — FK master data industry, **cấp 1 / 2 / 3 đều được**, index GIN
- `any_industry` bool — ảnh trung tính. Là một **cờ**, không phải "tick hết 11 nhóm", để nhóm mới thêm vào master data tự thừa hưởng.
- **Industry là field DUY NHẤT bắt buộc của cụm.** Cụm không có ngành thì resolver không bao giờ với tới được → vào thư viện là đã vô hình. Chặn ở **cả form, API và import**.
- UI: dùng chung **component Industry picker 3 cấp** với bên jobseeker (4 trạng thái checkbox Selected / Included / Partial / Empty, chọn cha thì gộp con vào). Không viết lại component thứ hai.
- Bộ lọc **Nhóm ngành** lọc theo **cả nhánh** — lọc `Xây dựng` thì cụm gắn `Xây dựng › Nội thất và cảnh quan › Thiết kế cảnh quan` **phải ra**. Option in kèm số cụm đầy đủ của nhánh.

### Resolver — phần dễ làm sai nhất

Tin có **một** node ngành (cấp bất kỳ), cụm có **nhiều** node (cấp bất kỳ).

| Tier | Khi nào | Xếp hạng |
|---|---|---|
| **0 · Ancestor** | Cụm gắn đúng node của tin, **hoặc node cha** | Tốt nhất. **Node khớp càng sâu càng ưu tiên** — cụm gắn `Kho bãi/lưu trữ` thắng cụm gắn `Bán hàng và phân phối` cho tin kho bãi |
| **1 · Descendant** | Cụm gắn ở node **con** của node tin | Dùng được, xếp sau mọi ancestor |
| **2 · Mọi ngành** | Cụm có cờ `any_industry` | Phương án cuối |

```
Sắp xếp: (tier ASC, độ sâu node khớp DESC, usage_count ASC)
Lấy: cụm ĐẦY ĐỦ (đủ 3 format) đầu tiên

GET /artwork/default?industry=<nodeId>   → 3 id của image_set_format
GET /artwork/pick?industry=&format=&completeOnly=&q=
```

> `usage_count ASC` không phải chi tiết nhỏ. Bỏ nó đi thì mọi tin cùng ngành dùng chung một tấm ảnh, trang chủ trông như template — tệ hơn là không bán placement.

**Acceptance**
- [ ] Không lưu được cụm thiếu ngành — từ form, từ API, và từ import
- [ ] Chọn node cha khi đã chọn vài node con → con bị gộp vào cha, chỉ còn 1 chip
- [ ] Lọc nhóm cấp 1 trả về cả cụm gắn cấp 2 và cấp 3 trong nhánh
- [ ] Tin ngành `Kho bãi/lưu trữ` (cấp 3): cụm gắn `Kho bãi/lưu trữ` được chọn trước cụm gắn `Bán hàng và phân phối` (cấp 1)
- [ ] **Tạo 2 tin liên tiếp cùng ngành → nhận 2 cụm KHÁC NHAU** khi còn cụm đầy đủ chưa dùng
- [ ] Cụm thiếu format **không bao giờ** được resolver chọn, dù khớp ngành sâu nhất
- [ ] Ngành không có cụm riêng → rơi xuống cụm `Mọi ngành`, không trả về rỗng

---

## Subtask 3 — Liên kết image set vô topic tags

> SRM-1410 · phụ thuộc Subtask 1

Lớp nhãn **tự do** để người dùng tìm bằng mắt.

> Industry là trục **máy đọc** nên phải ổn định. Tag là trục **người đọc** và được phép lộn xộn — ép tag đi qua một release master data là cách chắc chắn nhất để không ai gắn tag nữa.

### Model + API

`artwork_tag` — `id` · `name` **UNIQUE (không phân biệt hoa thường)** · `created_by` · `created_at`
`image_set.tag_ids` uuid[] — **không bắt buộc**, index GIN

```
GET    /admin/artwork-tags
POST   /admin/artwork-tags       { name }   // tên đã có (khác hoa thường) → trả tag cũ, không tạo trùng
PATCH  /admin/artwork-tags/:id   { name }
DELETE /admin/artwork-tags/:id              // trả về số cụm bị ảnh hưởng
```

### UI

- **Tạo tag ngay trong ô tag** lúc đang phân loại ảnh: gõ tên chưa có → hiện `＋ Tạo tag "x"`. Thời điểm cần một cái tag là **lúc đang nhìn tấm ảnh**, không phải trước đó ở một màn admin riêng.
- Panel **Quản lý tag** để dọn: đổi tên tại chỗ, xoá, kèm số cụm đang dùng
- Xoá hiện confirm nêu rõ: *"N cụm đang gắn sẽ bị gỡ nhãn — ảnh vẫn giữ nguyên."*
- Bộ lọc **Tag** trong thư viện + ô tìm khớp cả tên tag

> **Xoá tag KHÔNG xoá cụm nào.** Mất một cái nhãn không phải lý do để mất một tấm ảnh.

**Acceptance**
- [ ] Gõ tag chưa tồn tại → tạo được ngay, dùng được cho cụm khác liền sau đó
- [ ] POST trùng tên (khác hoa thường) không tạo bản ghi thứ hai
- [ ] Đổi tên tag → mọi cụm đang gắn đổi theo, không phải sửa gì ở `image_set`
- [ ] Xoá tag → **không cụm nào bị xoá**, confirm có in số cụm bị gỡ nhãn
- [ ] Lọc theo tag ra đúng các cụm gắn tag đó

---

## Subtask 4 — Tạo 1 set hình

> SRM-1412 · priority HIGH · phụ thuộc Subtask 1, dùng picker của 2 và ô tag của 3

**Một màn duy nhất** — không toggle chế độ, không wizard 2 bước.

```
┌ Tạo cụm ảnh ──────────────────────────────┐
│ ① [ Thả một ảnh gốc — tự cắt cả 3 khung ] │
│ ② [ Ngang ] [ Dọc ] [ Tròn ]   mỗi khung: │
│      Cắt · Thay tệp · Bỏ trống            │
│ ③ Tên · Hết hạn · Tag · Ngành *           │
│                      [Huỷ] [Tạo cụm]      │
└───────────────────────────────────────────┘
```

- **Hai cách tải ảnh KHÔNG phải hai lựa chọn loại trừ nhau.** Thả ảnh gốc → tự cắt vào mọi khung **đang trống**. Thả tệp thẳng vào một khung → khung đó dùng tệp riêng. **Trộn cả hai trên cùng một cụm là bình thường** — "ngang và dọc cắt từ ảnh gốc, tròn chụp riêng" là ca có thật, bản cũ có toggle thì không diễn đạt được.
- **Ảnh gốc không bao giờ đè lên khung đã có tệp riêng.** Cắt đè lên một ảnh người ta cố ý tải lên là thứ duy nhất làm màn này mất tin cậy. Gỡ ảnh gốc chỉ xoá các khung cắt từ nó; khung tải tay giữ nguyên.
- **Cắt là một overlay ngay trên dialog**, mở bằng nút *Cắt* của từng khung: ảnh gốc phủ nền, khung crop khoét trên scrim tối (thấy cùng lúc phần giữ và phần bỏ), có focal point + zoom, và vẽ sẵn **vùng an toàn** (ô `badge`, dấu `☆`) để cắt theo thẻ thật.
- **Ảnh tròn mặc định cắt từ khung DỌC** theo cùng focal point → thường chỉ cần một lần tải lên.
- Mỗi khung in rõ nguồn: **✂ cắt từ ảnh gốc** hay **tệp riêng** — sáu tháng sau câu "sao thẻ hover trông khác vậy" phải trả lời được ngay trên màn hình.
- **Phân loại nằm cùng màn**, không phải bước 2. Chỉ **Ngành** chặn nút lưu; tên, tag, hạn để trống được.
- Dòng trạng thái ở footer nói thẳng lý do còn chặn (*"cụm thiếu…"*, *"chưa chọn ngành"*) chứ không chỉ disable nút — nút xám không lý do là cách form này hay bị tắc nhất.

**Acceptance**
- [ ] Thả 1 ảnh gốc → cả 3 khung tự có ảnh, không phải thao tác thêm
- [ ] Tải tệp riêng cho khung tròn, rồi thả ảnh gốc → ngang + dọc được cắt, **khung tròn giữ nguyên tệp riêng**
- [ ] Gỡ ảnh gốc → chỉ các khung ✂ trống lại, khung tệp riêng còn nguyên
- [ ] Bấm *Cắt* → overlay mở đúng tỉ lệ khung đó, có focal point + zoom + vùng an toàn
- [ ] Bấm *Bỏ trống* khung tròn → vẫn tạo được cụm, cụm đó đánh dấu thiếu
- [ ] Chưa chọn ngành → nút tạo disable **và** footer nói rõ lý do

---

## Subtask 5 — Tạo set hình hàng loạt từ Excel

> SRM-1417 · phụ thuộc Subtask 1, 2, 3
> **File mẫu:** `public/templates/gallery-images-import-template.xlsx` (sinh bằng `scripts/make_gallery_import_template.py`)

**Là một TRANG, không phải modal** — bảng review phải cuộn và soi được.

Cấu trúc sheet: **một dòng = một ảnh**; các dòng **trùng cột Name** gộp thành một cụm. Người điền file không cần hiểu khái niệm "cụm" — chỉ cần biết "tấm này là bản ngang của Văn phòng HN". Bắt khách diễn đạt quan hệ 1-3 trong một bảng phẳng là chỗ các import kiểu này thường chết.

| Cột | Bắt buộc | Validate |
|---|---|---|
| Name | Không | Trùng tên → gộp 1 cụm. Tên trống → mỗi dòng thành cụm riêng, **không gộp các dòng trống với nhau**. |
| Image link | **Có** | Link Drive mở được bằng link. |
| Format | **Có** | Đúng một trong `Ngang` · `Dọc` · `Tròn`. |
| Industry | **Có** | Phải khớp node có thật trong master data. |
| Topics tag | Không | Cách nhau dấu phẩy. **Tag lạ thì TẠO MỚI**, không reject. |
| Licence expiry | Không | dd/mm/yyyy. |

```
POST /admin/image-sets/import/validate   // multipart .xlsx → kết quả từng dòng, KHÔNG ghi gì
POST /admin/image-sets/import/commit     // tạo set, trả created / skipped / failed
GET  /admin/image-sets/import/template.xlsx
```

- **Dòng lỗi bị bỏ qua, phần còn lại vẫn nhập.** Một ô sai chính tả không được chặn cả lô 40 ảnh.
- Xuất được file `.xlsx` chỉ chứa dòng lỗi để gửi lại khách.
- Trước khi commit: preview các **cụm** sẽ tạo, vẽ 3 khung, khung thiếu gạch đứt. In rõ `N dòng hợp lệ → M cụm`.
- Tải lại file đã sửa: **bỏ qua cụm đã tồn tại**, không tạo trùng.

> ⚠️ **Bẫy đã gặp:** dropdown trong file .xlsx phải ghi `dataValidation/formula1` **không có dấu `=` ở đầu** và trỏ qua *defined name*. Excel bỏ qua lỗi này nhưng **Google Sheets xoá sạch rule** — khách mở file thấy ô text trơn, không dropdown, không báo lỗi.

**Acceptance**
- [ ] 3 dòng cùng Name với Ngang/Dọc/Tròn → **1 cụm đầy đủ**
- [ ] 2 dòng cùng Name chỉ có Ngang/Dọc → 1 cụm thiếu tròn, preview báo rõ
- [ ] Dòng ngành sai → fail đúng dòng đó, các dòng khác vẫn nhập
- [ ] Dòng không có Industry → fail
- [ ] Tag lạ trong file → sau khi nhập, tag đó tồn tại trong hệ thống
- [ ] File mẫu tải về mở bằng Google Sheets có dropdown Industry 636 mục chạy được

---

## Phụ thuộc — không nằm trong task này

**Card artwork trên form tạo tin** (tin tự nhận ảnh từ cụm theo ngành, đổi cả 3 khung bằng 1 click, ghép khung từ nhiều cụm) đã có requirement + mockup riêng, **phụ thuộc Subtask 1 và 2**:
https://saramin-eta.vercel.app/m/job-management/create-job#card-artwork-one-set-fills-all-three-frames-and-industry-fills-it-first

---

## Câu hỏi cần KH chốt trước khi làm Subtask 1

1. **`role` (ảnh chủ thể / ảnh nền)** đã bị bỏ khỏi cụm. Nhưng quy tắc hero 2 khung bên Placements đang dựa vào nó (*"một nền + một chủ thể"*, hai ảnh chủ thể cạnh nhau sẽ chọi nhau). Quy tắc đó còn giữ không? Nếu còn thì cờ này nằm ở đâu?
2. **`source` và `licence type`** cũng bị bỏ, chỉ còn `Expiry date`. Ảnh không rõ bản quyền nằm trên placement khách đã trả tiền là rủi ro pháp lý. Chỉ ngày hết hạn có đủ không, hay giữ thêm một ô `source` dạng text để truy vết?
3. **Tên tag** để tự do hay chuẩn hoá (trim + gộp hoa thường) lúc lưu? Để tự do thì *"Văn phòng"* và *"văn phòng "* cùng tồn tại sau một tuần.
4. **Link Drive** trong file Excel: BE tải về lúc import (cần share folder cho service account), hay đổi sang cho khách nộp file zip? Mockup đang giả định tải theo link.
