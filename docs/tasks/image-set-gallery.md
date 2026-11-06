# [Admin] Image gallery — gom ảnh thành IMAGE SET, 3 format, tag tự tạo, nhập hàng loạt từ Excel

**Module:** Banners & Pop-ups → Image gallery · **Site:** Admin · **Loại:** BE + FE
**Requirement chi tiết (source of truth):** https://saramin-eta.vercel.app/m/banners-popups/image-gallery
**Requirement nhập hàng loạt:** https://saramin-eta.vercel.app/m/banners-popups/bulk-image-import
**Mockup bấm thử được:**
- Thư viện + tạo cụm: https://saramin-eta.vercel.app/wireframe/admin?screen=admin-image-gallery
- Nhập hàng loạt: https://saramin-eta.vercel.app/wireframe/admin?screen=admin-image-bulk
- Ảnh trên tin đăng (dùng lại cụm): https://saramin-eta.vercel.app/wireframe/admin?screen=admin-job-create → **+ New job** → kéo tới mục **Card artwork**

---

## 0. Bối cảnh — đọc trước khi code

Trang tuyển dụng in **cùng một tấm ảnh ở ba khung khác nhau**: ngang (thẻ lúc nghỉ), dọc (thẻ mở rộng khi rê chuột), tròn (dải thẻ ảnh tròn). Hiện tại admin lưu **ảnh rời**: mỗi khung chọn một lần, không có gì ràng buộc ba kết quả là cùng một cảnh. Hệ quả thực tế là thẻ lúc hover hiện một tấm ảnh khác hẳn thẻ lúc nghỉ, và không ai phát hiện cho tới khi tin đã chạy.

Task này đổi đơn vị lưu trữ từ **ảnh** sang **cụm ảnh (image set)**: một cảnh, mang tối đa ba format của chính nó. Ba tác động:

1. Người tạo tin **chọn một lần được cả ba khung**, thay vì tìm thư viện ba lượt.
2. Hệ thống mới **tự điền được ảnh theo ngành** — không thể tự điền 3 khung từ 3 danh sách rời nhau.
3. Phân loại (ngành, tag, hạn bản quyền) gắn **một lần cho cả cụm**, không lặp lại ba lần.

**Không có migration dữ liệu lớn:** thư viện hiện tại gần như trống, nên tạo bảng mới và bỏ bảng cũ là được. Xác nhận lại với HQ trước khi xoá.

---

## Thứ tự làm

```
Task 1 (model)  →  Task 2 (tag API)  →  Task 3 (set API)  →  Task 4 (resolver)
                                    ↘
                   Task 5 (list) → Task 6 (tạo cụm) → Task 7 (sửa cụm) → Task 8 (quản lý tag)
                                                                       ↘
                                                              Task 9 (nhập Excel)
```

Task 1 chặn tất cả. Task 5–8 làm song song với 2–4 được nếu FE mock API trước.

---

## Task 1 — BE · Model `ImageSet` / `ImageSetFormat` / `ArtworkTag`

Ba bảng. **Chỉ `industryIds` là bắt buộc** — xem phần lý do ở requirement.

| Bảng | Cột | Ghi chú |
|---|---|---|
| `image_set` | `id` uuid PK | |
| | `name` text **NULL** | Không bắt buộc. UI hiển thị `Cụm #n` khi trống. |
| | `industry_ids` uuid[] **NOT NULL** | FK → master data industry, **cấp 1, 2 hoặc 3 đều được**. Length ≥ 1 trừ khi `any_industry = true`. Index GIN. |
| | `any_industry` bool NOT NULL default false | Ảnh trung tính, mọi ngành dùng được. |
| | `tag_ids` uuid[] | FK → `artwork_tag`. Index GIN. |
| | `expires_at` date NULL | Hạn bản quyền. **Index** — đây là cột để chạy query “tháng này hết hạn những gì”. |
| | `master_url`, `focal_x`, `focal_y` | Chỉ có khi tạo bằng luồng ① (1 ảnh gốc + crop). |
| | `status` enum(`active`,`archived`) NOT NULL | |
| `image_set_format` | `id`, `set_id` FK | **UNIQUE(set_id, format)** |
| | `format` enum(`ngang`,`doc`,`tron`) NOT NULL | Khung nào cũng có thể không tồn tại. |
| | `crop_box` jsonb NULL, `derived` bool | `derived = true` → cắt từ `master_url` của cụm. |
| | `file_url`, `width`, `height` | |
| | `version` int NOT NULL | **Bất biến**: thay ảnh là ghi bản ghi mới, không sửa đè. |
| `artwork_tag` | `id`, `name` **UNIQUE (không phân biệt hoa thường)** | |
| | `created_by`, `created_at` | |

**Acceptance**
- [ ] Tạo được set chỉ với `industry_ids` — `name`, `tag_ids`, `expires_at` đều trống.
- [ ] Tạo set không có industry và không có `any_industry` → **reject**, kể cả qua API.
- [ ] `UNIQUE(set_id, format)` chặn một cụm có hai ảnh ngang.
- [ ] Thay ảnh một khung sinh `version` mới, bản ghi cũ còn nguyên.

> **Vì sao `version` phải bất biến:** tin đăng lưu **3 id của `image_set_format`**, không lưu `set_id`. Nhờ vậy HQ sửa/cắt lại/lưu trữ ảnh trong thư viện **không làm đổi ảnh của tin đang chạy**. Nếu thiếu, một lần dọn thư viện sẽ đổi ảnh hàng loạt tin đã bán.

---

## Task 2 — BE · API tag (tạo / sửa / xoá)

Tag **không phải master data**. HQ gõ ra là có.

```
GET    /admin/artwork-tags
POST   /admin/artwork-tags            { name }
PATCH  /admin/artwork-tags/:id        { name }
DELETE /admin/artwork-tags/:id
```

**Acceptance**
- [ ] `POST` với tên đã tồn tại (khác hoa thường) → trả về tag cũ, không tạo trùng.
- [ ] `PATCH` đổi tên → mọi cụm đang gắn hiển thị tên mới ngay, không cần sửa gì ở `image_set`.
- [ ] `DELETE` **gỡ tag khỏi mọi cụm và KHÔNG xoá cụm nào**. Response trả về số cụm bị ảnh hưởng.
- [ ] `DELETE` một tag đang được N cụm dùng vẫn chạy — không chặn, chỉ báo số lượng để FE confirm.

---

## Task 3 — BE · API cụm ảnh + từng khung

```
GET    /admin/image-sets?industry=&tag=&complete=&status=&q=
POST   /admin/image-sets
PATCH  /admin/image-sets/:id
POST   /admin/image-sets/:id/archive
PUT    /admin/image-sets/:id/formats/:format     // cắt lại hoặc thay tệp → version mới
DELETE /admin/image-sets/:id/formats/:format     // để trống khung đó
```

- `?industry=` phải lọc theo **cả nhánh**: lọc nhóm `Xây dựng` thì cụm gắn `Xây dựng › Nội thất và cảnh quan › Thiết kế cảnh quan` **phải ra**.
- `?complete=true` = có đủ cả 3 format.
- Ảnh gốc **tối thiểu 1600 × 1200**, nhỏ hơn thì từ chối, **không phóng to**.
- Cắt ảnh: lưu `crop_box` + focal point, **render/cache theo từng kích thước lúc phục vụ**. Không cắt sẵn thành file cứng — thêm một kích thước mới sau này sẽ phải cắt lại cả thư viện bằng tay.

**Acceptance**
- [ ] Lọc theo nhóm cấp 1 trả về cả cụm gắn ở cấp 2 và cấp 3 trong nhánh đó.
- [ ] `DELETE` một format → cụm vẫn tồn tại, `complete = false`.
- [ ] Archive cụm đang có N tin dùng → trả về cảnh báo kèm N, không xoá.
- [ ] Upload ảnh 1200×900 → reject, message rõ là do kích thước.

---

## Task 4 — BE · Resolver: tin đăng tự nhận ảnh theo ngành

Đây là phần dễ làm sai nhất. Tin có **một** node ngành (cấp bất kỳ), cụm có **nhiều** node (cấp bất kỳ).

| Tier | Khi nào | Xếp hạng |
|---|---|---|
| **0 · Ancestor** | Cụm gắn đúng node của tin, **hoặc node cha** của nó | Tốt nhất. **Node khớp càng sâu càng ưu tiên** — cụm gắn `Kho bãi/lưu trữ` thắng cụm gắn `Bán hàng và phân phối` cho tin kho bãi. |
| **1 · Descendant** | Cụm gắn ở node **con** của node tin | Dùng được, xếp sau mọi ancestor. |
| **2 · Mọi ngành** | Cụm có cờ `any_industry` | Phương án cuối. |

```
Sắp xếp: (tier ASC, độ sâu node khớp DESC, usage_count ASC)
Lấy: cụm ĐẦY ĐỦ (đủ 3 format) đầu tiên
```

```
GET /artwork/default?industry=<nodeId>   → 3 id của image_set_format
GET /artwork/pick?industry=&tag=&format=&completeOnly=&q=
```

**Acceptance**
- [ ] Tin ngành `Kho bãi/lưu trữ` (cấp 3): cụm gắn `Kho bãi/lưu trữ` được chọn trước cụm gắn `Bán hàng và phân phối` (cấp 1).
- [ ] **Tạo 2 tin liên tiếp cùng ngành → nhận 2 cụm KHÁC NHAU** khi còn cụm đầy đủ chưa dùng.
- [ ] Cụm thiếu format **không bao giờ** được resolver chọn, dù khớp ngành sâu nhất.
- [ ] Ngành không có cụm riêng nào → rơi xuống cụm `Mọi ngành`, không trả về rỗng.

> `usage_count ASC` không phải chi tiết nhỏ. Bỏ nó đi thì mọi tin cùng ngành dùng chung một tấm ảnh, trang chủ trông như template — tệ hơn là không bán placement.

---

## Task 5 — FE · Trang danh sách thư viện

→ https://saramin-eta.vercel.app/wireframe/admin?screen=admin-image-gallery

- Grid theo **cụm**. Mỗi thẻ vẽ **cả 3 format cạnh nhau, đúng tỉ lệ thật**. Khung thiếu vẽ ô gạch đứt chữ “trống”.
- Chip ngành có nhãn cấp (`L1` / `L2` / `L3`) — đây là thứ quyết định độ phủ của cụm nên phải đọc được ngay trên thẻ.
- Cụm không đặt tên hiển thị `Cụm #n` kiểu in nghiêng mờ.
- Bộ lọc: **Nhóm ngành** (option in kèm số cụm đầy đủ của nhánh) · **Tag** · **Phiên bản** (đủ cả 3 / còn thiếu) · ẩn-hiện cụm đã lưu trữ · ô tìm theo tên và tag.

**Acceptance**
- [ ] Thẻ cụm thiếu khung hiện cảnh báo “không được dùng làm ảnh tự điền”.
- [ ] Lọc `Phiên bản · Còn thiếu` ra đúng các cụm chưa đủ 3.
- [ ] Lọc theo nhóm ngành ra cả cụm gắn cấp 2/3 trong nhánh.

> **Không làm banner cảnh báo ở đầu trang.** Bản trước có 3 banner màu vàng, KH yêu cầu bỏ (06/11). Thông tin độ phủ nằm trong chính bộ lọc: số cụm in trong option của dropdown ngành, và bộ lọc “Còn thiếu”.

---

## Task 6 — FE · Dialog tạo cụm — 2 luồng, nêu rõ ngay từ đầu

Dialog mở ra là **chọn luồng trước**, không giấu luồng hai sau một cái link nhỏ.

| Luồng | Khi nào | Làm gì |
|---|---|---|
| **① Một ảnh gốc → cắt 3 khung** | Mặc định | Thả **1 ảnh ≥1600×1200**. Khung crop khoét trên nền tối, có **focal point kéo được** + thanh zoom. Bên phải là 3 khung, bấm để chuyển; mỗi khung có *Tệp riêng* và *Bỏ trống*. |
| **② Tải riêng từng khung** | 3 ảnh khác nhau, hoặc cắt không ra | 3 ô thả riêng, đúng tỉ lệ. Chế độ này **không cắt lại**. |

- **Ảnh tròn mặc định cắt từ khung DỌC** theo cùng focal point → bình thường chỉ cần **1 lần tải lên**, không phải 3.
- Bước 2 phân loại: tên (không bắt buộc) · hạn (không bắt buộc) · **ngành (bắt buộc, cây 3 cấp)** · tag (không bắt buộc).
- Nút “Tạo cụm” **chỉ disable khi chưa có ngành** hoặc chưa có khung nào.

**Acceptance**
- [ ] Tải 1 ảnh → ra đủ 3 khung, không phải tải thêm lần nào.
- [ ] Bấm “Bỏ trống” khung tròn → vẫn tạo được cụm, cụm đó đánh dấu thiếu.
- [ ] Chưa chọn ngành → nút tạo disable, có chữ giải thích.
- [ ] Đổi luồng ①↔② không mất dữ liệu đã nhập ở bước 2.

---

## Task 7 — FE · Màn chi tiết / sửa cụm

- Tên sửa ngay tại chỗ (inline), placeholder là `Cụm #n` để thấy rõ là không bắt buộc.
- 3 khung hiển thị kèm **focal point** và **vùng an toàn** mà thẻ sẽ vẽ đè lên (ô `badge`, dấu `☆`) — cắt ảnh phải nhìn trên thẻ thật, không đoán.
- Mỗi khung: *Cắt lại* · *Thay tệp*; khung trống: *Cắt từ ảnh gốc* · *Tải tệp riêng*.
- Cây chọn ngành (3 cấp, multi) + checkbox **Mọi ngành**.
- Trường tag + ô hạn bản quyền.

**Acceptance**
- [ ] Bỏ hết ngành → nút Lưu disable kèm lý do.
- [ ] Ảnh `derived` có dấu ✂ để phân biệt với ảnh tải riêng.

---

## Task 8 — FE · Panel “Quản lý tag”

- Tạo tag mới ngay trong **ô tag** khi đang phân loại ảnh: gõ tên chưa có → hiện `＋ Tạo tag "x"`.
- Panel riêng để dọn: đổi tên tại chỗ, xoá, kèm số cụm đang dùng.
- Xoá hiện confirm nêu rõ: *“N cụm đang gắn sẽ bị gỡ nhãn — ảnh vẫn giữ nguyên.”*

**Acceptance**
- [ ] Gõ tag chưa tồn tại → tạo được ngay, dùng được cho cụm khác liền sau đó.
- [ ] Đổi tên tag → mọi cụm đang gắn đổi theo.
- [ ] Xoá tag → **không cụm nào bị xoá**.

---

## Task 9 — FE + BE · Trang nhập hàng loạt từ Excel

→ https://saramin-eta.vercel.app/wireframe/admin?screen=admin-image-bulk
**File mẫu:** `public/templates/gallery-images-import-template.xlsx` (sinh ra bằng `scripts/make_gallery_import_template.py`)

**Là một TRANG, không phải modal** — bảng review phải cuộn và soi được.

Cấu trúc sheet: **một dòng = một ảnh**; các dòng **trùng cột Name** gộp thành một cụm. Người điền file không cần hiểu khái niệm “cụm”.

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

**Acceptance**
- [ ] 3 dòng cùng Name với Ngang/Dọc/Tròn → **1 cụm đầy đủ**.
- [ ] 2 dòng cùng Name chỉ có Ngang/Dọc → 1 cụm thiếu tròn, preview báo rõ.
- [ ] Dòng ngành sai → fail đúng dòng đó, các dòng khác vẫn nhập.
- [ ] Dòng không có Industry → fail.
- [ ] Tag lạ trong file → sau khi nhập, tag đó tồn tại trong hệ thống.

> ⚠️ **Bẫy đã gặp:** dropdown trong file .xlsx phải ghi `dataValidation/formula1` **không có dấu `=` ở đầu** và trỏ qua *defined name*. Excel bỏ qua lỗi này nhưng **Google Sheets xoá sạch rule** — khách mở file thấy ô text trơn, không dropdown, không báo lỗi.

---

## Phụ thuộc — không nằm trong task này

**Card artwork trên form tạo tin** (tin tự nhận ảnh từ cụm theo ngành, đổi cả 3 khung bằng 1 click, ghép khung từ nhiều cụm) đã có requirement + mockup riêng, **phụ thuộc Task 1 và Task 4**:
https://saramin-eta.vercel.app/m/job-management/create-job#card-artwork-one-set-fills-all-three-frames-and-industry-fills-it-first

---

## Câu hỏi cần KH chốt trước khi làm Task 1

1. **`role` (ảnh chủ thể / ảnh nền)** đã bị bỏ khỏi cụm. Nhưng quy tắc hero 2 khung bên Placements đang dựa vào nó (*“một nền + một chủ thể”*, hai ảnh chủ thể cạnh nhau sẽ chọi nhau). Quy tắc đó còn giữ không? Nếu còn thì cờ này nằm ở đâu?
2. **`source` và `licence type`** cũng bị bỏ, chỉ còn `Expiry date`. Ảnh không rõ bản quyền nằm trên placement khách đã trả tiền là rủi ro pháp lý. Chỉ ngày hết hạn có đủ không, hay giữ thêm một ô `source` dạng text để truy vết?
3. **Tên tag** để tự do hay chuẩn hoá (trim + gộp hoa thường) lúc lưu? Để tự do thì *“Văn phòng”* và *“văn phòng ”* cùng tồn tại sau một tuần.
4. **Link Drive** trong file Excel: BE tải về lúc import (cần share folder cho service account), hay đổi sang cho khách nộp file zip? Mockup đang giả định tải theo link.
