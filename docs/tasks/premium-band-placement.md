# [6/6][BE] Tạo placement cho dải "Lựa chọn tạo nên sự khác biệt" + bỏ `bundle.is_premium`

**Sub-task 6 / 6** · **Repo:** svn-be · **⚠ PHẢI XONG TRƯỚC phần "tin nào vào dải" của SRM-1538**
**Requirement:** [saramin-eta.vercel.app → "THE BLUE ZONE'S TAG ROW"](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-and-a-rotation-that-gives-every-job-the-same-chance-at-the-three-visible-cards)

> Đánh số 6 vì thêm sau cùng, nhưng **về thứ tự làm thì nó đứng trước sub-task 4**. SRM-1538 luật 1 ("tin vào dải = sản phẩm phủ placement") không có gì để chạy cho tới khi ticket này xong.

---

## 0. Vì sao có ticket này

Ngày 17/11 chốt: vùng này **không còn là đặc quyền của gói Premium**, mà là **một placement bình thường** — sản phẩm nào phủ placement đó thì tin mua sản phẩm đó hiển thị ở đây, giống hệt Top search.

Kiểm lại svn-be ngày 23/11 thì **quyết định đó chưa được hiện thực ở đâu cả**, và không sub-task nào trong 5 cái đang làm nó.

## 1. Hiện trạng — dải đang chạy bằng gì

Bằng **`bundle.is_premium`**, cờ trên **GÓI**, thêm bởi `V488__bundle_is_premium.sql`. Đường đi: `job.selected_tier_code → product.code → bundle_item → bundle` có cờ đó.

Comment của chính migration viết rõ: *"the flag is a property of the CATALOGUE, not of a sale"* — và kèm một hệ quả đã được chấp nhận: *đưa JOB-BASIC vào một gói premium thì mọi tin JOB-BASIC thành premium, kể cả tin bán lẻ.*

**`docs/PLACEMENT_INVENTORY.md` liệt kê đúng MỘT placement trên trang search: `SEARCH_TOP_JOBS`.** Chữ "premium" xuất hiện 0 lần trong cả tài liệu. Placement cho vùng màu xanh **chưa tồn tại**.

## 2. Tạo dòng `placement`

| Cột | Giá trị | Ghi chú |
|---|---|---|
| `slot_key` | **cần chốt** — đề xuất `SEARCH_DISTINCTION_BAND` | ⚠ trùng chữ với product `JOB-DISTINCTION`. Nếu thấy dễ lẫn thì dùng `SEARCH_HIGHLIGHT_BAND`. Một dòng quyết định, chị Thu chốt. |
| `page` | `SEARCH` | |
| `format` | `CONTENT_POOL` | ô chứa danh sách tin thật, không phải ảnh |
| `fill_route` | `TIER` | tin vào vì **sản phẩm của nó phủ ô này** — đúng cơ chế đã chốt |
| `items_shown` | `3` | số thẻ nhìn thấy cùng lúc |
| `pool_cap` | xem mục 4 | **không được để mặc định** |
| `rotation_seconds` | `NULL` | dải tự xoay theo `bandSeq` (SRM-1538 luật 8), không xoay client-side |
| `creative_width/height` | `NULL` | không phải banner |
| `status` | `ACTIVE` | |

## 3. `product_placement_slot` — SẢN PHẨM NÀO phủ ô này

**Đây là quyết định thương mại, không phải việc của dev**, và là mảnh duy nhất không ai đoán hộ được.

Hôm nay câu trả lời là "mọi sản phẩm nằm trong một gói có cờ premium". Danh sách mới **có thể giống, có thể khác hẳn** — đó chính là điều phải chốt.

Cần chị Thu trả lời hai câu:

1. **Những product code nào** phủ placement này?
2. **`coverage_days` bằng bao nhiêu** cho mỗi dòng? `NULL` = phủ suốt thời gian tin chạy. Số N = tin chỉ nằm trong dải N ngày đầu kể từ `COALESCE(publish_at, created_at)`.

> **Khuyến nghị `coverage_days = NULL`.** Cả thiết kế vòng quay dựa trên "mọi tin trong dải đều có cơ hội như nhau". Nếu tin rụng khỏi dải sau N ngày thì lời hứa đó chỉ đúng trong N ngày, và không có gì báo cho khách biết tin của họ đã rơi ra. Muốn bán theo thời hạn thì nên bán bằng thời hạn của chính sản phẩm, không phải bằng `coverage_days` của một ô.

## 4. ⚠ Hai chỗ cơ chế TIER sẵn có ĐỤNG vào luật của dải

Đọc kỹ, vì dải này không đọc dữ liệu giống các ô khác.

**a. `limit = pool_cap ?? items_shown` sẽ cắt mất tập tin.** Reader chung `findOpenJobsInPlacement()` giới hạn theo `pool_cap`. Nhưng SRM-1538 luật 1 + §4 câu 1 yêu cầu đọc **id của TOÀN BỘ tập đủ điều kiện** — vòng quay chạy trên tập đó, và cắt tập là **đóng băng vĩnh viễn** những tin nằm ngoài, đúng thứ cả mô hình sinh ra để chống.

> **Cách làm:** dải **không dùng reader chung**. Dùng lại đúng vị ngữ của nó — `tierWindowsOf(placementId)` + `feedsPlacement()` + các điều kiện phụ (job `OPEN` & `exposure`, company `ACTIVE`) — nhưng **bỏ `limit` và bỏ `ORDER BY`**, lấy hết id. `pool_cap` khi đó chỉ còn là con số tham khảo cho admin; đặt một giá trị rộng rãi (vd `500`) và **đừng để code của dải đọc nó**.

**b. `ORDER BY job.refreshed_at DESC, job.id DESC` KHÔNG áp cho dải này.** Thứ tự của dải do vòng quay quyết định (SRM-1538 luật 7/7b/8). Độ mới **cố ý vắng mặt** ở khung nhìn đầu — mọi tin đều được một lượt như nhau. Đừng mang thứ tự của reader chung vào.

## 5. Chuyển luật thành viên

Đổi predicate của dải từ `bundle.is_premium` sang đường placement.

> **⛔ Không để hai cơ chế chạy song song.** Nếu vừa còn `bundle.is_premium` vừa có placement thì dải trả lời hai câu hỏi khác nhau tuỳ nhánh code nào chạy — và kiểu lỗi này **không báo gì cả**, chỉ là tin của khách lúc có lúc không, không ai biết vì sao.

Sau khi placement chạy đúng trên dev và đã đối chiếu số liệu (xem acceptance), **gỡ `bundle.is_premium`** bằng một migration riêng. Gỡ cột hay để lại cột nhưng không ai đọc — BE chọn; miễn là **chỉ còn đúng một nguồn sự thật**.

## 6. Acceptance

- [ ] Có dòng `placement` mới: `page = SEARCH`, `format = CONTENT_POOL`, `fill_route = TIER`, `status = ACTIVE`.
- [ ] `product_placement_slot` có đủ các dòng theo danh sách chị Thu chốt ở mục 3.
- [ ] **Đối chiếu trước/sau:** với cùng một từ khoá, so tập tin dải trả về theo `bundle.is_premium` và theo placement. Chênh lệch **phải giải thích được bằng danh sách sản phẩm đã chốt** — không được có tin lạ xuất hiện hay biến mất mà không ai giải thích nổi.
- [ ] Dải đọc được **toàn bộ** tập id đủ điều kiện, **không bị `pool_cap` cắt**. Test với một placement có > `pool_cap` tin đủ điều kiện.
- [ ] Thứ tự tin trong dải **không** theo `refreshed_at` — theo vòng quay của SRM-1538.
- [ ] Tin của công ty `status != ACTIVE`, tin không `OPEN`, tin `exposure = false` → **không** vào dải.
- [ ] `coverage_days = NULL` → tin nằm trong dải suốt thời gian chạy. Nếu chốt một số N thì test tin ngày N+1 rụng khỏi dải.
- [ ] Tắt `status` của placement về `INACTIVE` → dải rỗng, **không lỗi, không 404**.
- [ ] Sau khi gỡ: **không còn chỗ nào trong code đọc `bundle.is_premium`** để quyết định thành viên của dải.

## 7. Không làm trong sub-task này

- ❌ Hàng tag, vòng quay, con trỏ, response `premiumBand` — SRM-1538.
- ❌ Cờ Search tag / Required trong Master data — SRM-1536 và SRM-1718.
- ❌ Giao diện — SRM-1539.
- ❌ Đụng `SEARCH_TOP_JOBS` hay bất kỳ placement nào đang chạy.
