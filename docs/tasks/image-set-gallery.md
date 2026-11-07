# [Admin] Image gallery — gom ảnh thành IMAGE SET, 3 format, tag tự tạo, bảng nhập hàng loạt

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

Mỗi subtask là **một tính năng trọn vẹn** — BE và FE đi cùng nhau, không tách lớp. Thứ tự dưới đây là thứ tự Dev nên làm, không phải thứ tự tuỳ ý.

| # | Ticket | Subtask | Vì sao ở vị trí này |
|---|---|---|---|
| 1 | SRM-1408 | Quản lý hình theo set | Nền tảng. Không có bảng thì không có gì để gắn ngành hay tag. |
| 2 | SRM-1409 | Liên kết theo Industry | **Industry là field bắt buộc** → chưa có picker thì chưa lưu nổi một cụm nào. |
| 3 | SRM-1410 | Tạo 1 set hình | Lúc thư viện **bắt đầu có dữ liệu**. Trước nó mọi màn đều rỗng. |
| 4 | SRM-1412 | Liên kết vô topic tags | Tag **optional** → không chặn gì. Ô tag ở màn tạo stub tạm rồi nối vào đây. |
| 5 | SRM-1417 | Tạo set hình hàng loạt | Bảng nhập trong admin; cần đủ model, ngành và tag mới làm được. |

**Lưu ý về Subtask 2:** phần *gắn ngành + picker* phải xong trước Subtask 3, nhưng phần *resolver* (tin đăng tự nhận ảnh) chỉ test được sau khi thư viện có cụm đầy đủ — tức sau Subtask 3. Có thể tách hai nhịp trong cùng một ticket.

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

## Subtask 3 — Tạo 1 set hình

> SRM-1410 · priority HIGH · phụ thuộc Subtask 1 và **Subtask 2** (Industry bắt buộc nên chưa có picker thì chưa lưu nổi cụm nào). Ô tag stub tạm, nối vào ở Subtask 4.
>
> **Đây là lúc thư viện bắt đầu có dữ liệu** — trước nó màn danh sách và chi tiết đều rỗng.

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

## Subtask 4 — Liên kết image set vô topic tags

> SRM-1412 · phụ thuộc Subtask 1. **Để sau Subtask 3 vì tag là field optional** — không chặn việc tạo cụm, nên không chặn gì cả.

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

## Subtask 5 — Tạo set hình hàng loạt

> SRM-1417 · phụ thuộc Subtask 1, 2, 3 (dùng lại picker ngành và ô tag)

**Một TRANG CÓ BẢNG NHẬP TRỰC TIẾP trong admin.** Không có file .xlsx, không tải mẫu, không upload ngược.

> ⚠️ **Bản .xlsx round-trip đã BỎ (06/11).** Tài liệu nào còn nhắc tới nó là bản cũ. Không làm nữa: `POST /import/validate`, `POST /import/commit`, `GET /template.xlsx`, `scripts/make_gallery_import_template.py`, `public/templates/*.xlsx`, và file xuất dòng lỗi.

### Vì sao bỏ file

| Vấn đề của round-trip | Bảng nhập làm gì thay |
|---|---|
| Link Drive — nguồn lỗi lớn nhất: sai quyền chia sẻ, rate limit, trả HTML thay vì ảnh | **Thả file thẳng vào ô** — không link, không fetch bên thứ ba, không có quyền nào để sai |
| File mẫu sinh từ master data → đổi ngành một lần là mọi bản copy trong inbox khách thành sai, không ai báo | Picker ngành đọc master data **trực tiếp**, không có bản copy nào để cũ |
| Validate thành một lượt riêng — người sửa ô không còn nhìn thấy bảng đã sinh ra nó | **Từng ô validate ngay lúc gõ**, tại chỗ, lý do hiện dưới dòng |

**Mất gì:** khách không chuẩn bị offline rồi email được nữa. Bù lại bằng **paste từ Sheets** — nên paste không phải tiện ích, nó là đường migration.

### Cấu trúc bảng — MỘT DÒNG = MỘT CỤM

`Name` · `Ngang` · `Dọc` · `Tròn` · `Industry` · `Topics` · `Expiry`

- **Name** — optional nhưng **phải UNIQUE**; tên là handle của cả cụm. Trống thì fallback `Cụm #n`.
- **Ngang · Dọc · Tròn** — ba cột, mỗi cột một slot; file thả vào slot nào **render đúng hình dạng slot đó**.
- **Industry** — chips, chọn ở bất kỳ cấp nào trong 3 cấp, có nhãn cấp. **Bắt buộc.**
- **Topics** — ô tag tạo-tại-chỗ, kèm "Quản lý topic" ở thanh header.

> **HÌNH DẠNG CHÍNH LÀ NHÃN.** Ảnh nhầm slot thấy ngay khi cột tròn vẽ thành hình tròn; trong bảng toàn chữ thì nó đọc như một dòng đúng cho tới lúc thẻ render. **Slot trống là một hình đang chờ** — nhìn qua 40 dòng biết ngay cụm nào thiếu.

### Copy giữa các cụm — thao tác cả trang sống nhờ nó

Industry là field duy nhất có việc thật: pick 3 cấp cho từng cụm. Làm tay 40 lần chính là thứ đẩy người ta quay về Excel.

| Nút | Khi nào hiện | Làm gì |
|---|---|---|
| **⧉ Copy** | Ô đang focus | Lấy giá trị ô đó — cả chips |
| **⇲ Paste** | Ô focus **cùng cột**, sau khi đã copy | Thả giá trị vào cụm này |
| **⇊ Fill down** | Ô đang focus | Đẩy xuống **mọi cụm bên dưới** trong một thao tác |
| `Ctrl+C` / `Ctrl+V` / `Ctrl+D` | — | Y hệt ba cái trên, từ bàn phím |

- **Nút có CHỮ, không chỉ icon** — `⧉` trần là đoán, `⧉ Copy` thì không. Thêm một dải trên bảng ghi lại ba thao tác để thấy trước khi click vào ô nào.
- **Chỉ hiện trên ô đang focus**, không rải khắp 40 dòng.
- **Paste kiểm theo kiểu cột**: Industry không rơi vào được Topics — nhận bừa là nhét node id vào tag list, lỗi nổ muộn hơn nhiều ở chỗ khác.
- **Slot ảnh KHÔNG copy được** — hai cụm dùng chung một tấm ảnh đúng là thứ thư viện sinh ra để tránh.

### Thả ảnh — hai hành vi, chọn một lần

Một **toggle trên đầu bảng**, không hỏi từng ảnh: 40 ảnh là 40 lần cùng một quyết định.

| Toggle | Thả file vào slot | Dùng khi |
|---|---|---|
| **Dùng nguyên file** | Vào thẳng slot, render đúng hình dạng — xong | File đã cắt sẵn đúng tỉ lệ |
| **Mở khung cắt** | Mở crop frame đúng tỉ lệ slot | Ảnh thô còn phải căn khung |

- **Không bao giờ kéo giãn ảnh cho vừa.** Ảnh di chuyển và phóng to bên trong crop frame theo đúng aspect của nó — mặt bị bóp méo tệ hơn cắt sát.
- Slot đã có ảnh vẫn giữ link **"Cắt lại"** khi toggle đang bật.

**Acceptance**
- [ ] Một cụm là **một dòng**; ba format nằm ngang trên cùng dòng
- [ ] Slot tròn vẽ hình tròn, slot dọc vẽ dọc — thả nhầm thấy ngay
- [ ] Slot trống hiện như hình đang chờ, quét 40 dòng biết ngay cụm nào thiếu
- [ ] Trùng Name → báo lỗi tại ô, không cho lưu
- [ ] Không có Industry → báo lỗi tại ô
- [ ] ⧉ Copy / ⇲ Paste / ⇊ Fill down chạy đúng, `Ctrl+C/V/D` ra cùng kết quả
- [ ] Paste Industry vào cột Topics → **bị từ chối**
- [ ] Slot ảnh không copy được
- [ ] Toggle "mở khung cắt" → crop frame đúng tỉ lệ slot, **không kéo giãn**
- [ ] Paste từ Google Sheets → ra đúng các cột

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
