# [6/6][BE] Placement `SEARCH_PREMIUM` — đổi NGUỒN của `job.is_premium`, không đổi đường đọc

**Sub-task 6 / 6** · **Repo:** svn-be · **⚠ PHẢI XONG TRƯỚC phần "tin nào vào dải" của SRM-1538**
**Requirement:** [saramin-eta.vercel.app → "THE BLUE ZONE'S TAG ROW"](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-and-a-rotation-that-gives-every-job-the-same-chance-at-the-three-visible-cards)

> **VIẾT LẠI 23/11 sau khi đọc kỹ svn-be.** Bản đầu của ticket này nói "đổi predicate của dải từ `bundle.is_premium` sang placement" — **mô tả sai hiện trạng** và sẽ dẫn tới một thay đổi lớn hơn cần thiết, đồng thời **làm rơi dữ liệu migrate**. Đọc mục 1.

---

## 0. Vì sao có ticket này

17/11 chốt: vùng này **không còn là đặc quyền của gói Premium**, mà là **một placement bình thường** — sản phẩm nào phủ placement đó thì tin mua sản phẩm đó hiển thị ở đây, giống Top search.

`docs/PLACEMENT_INVENTORY.md` liệt kê **đúng một placement trên trang search: `SEARCH_TOP_JOBS`**. Placement cho vùng màu xanh **chưa tồn tại**, và không sub-task nào khác tạo nó.

## 1. Hiện trạng THẬT — đọc trước khi code

Dải **không** đọc `bundle.is_premium`. Nó đọc **`job.is_premium`**, một cột được *đóng dấu* sẵn.

```
Điều kiện của dải = job.is_premium = TRUE  VÀ  còn một job_placement ACTIVE trong cửa sổ
```

`job.is_premium` (V811) được `PremiumJobTagger` đóng dấu khi tin lên sóng hoặc đổi tier, từ **hai nguồn**:

| Nguồn | Đường đi |
|---|---|
| **Tin bán mới** | gói (`bundle.is_premium`) → hoá đơn → tin → sản phẩm đã chọn |
| **Tin migrate từ AMS** | `legacy_product_mapping.premium` theo dòng gói AMS hoặc cặp (gói, sản phẩm CRM); **và** `legacy_job_premium` — tập ngoại lệ **theo từng tin**, bật hoặc tắt, **thắng dòng mapping của nó**, áp ngay và được giữ qua mọi lần apply sau |

Và V813 gắn **trigger re-index ES** mỗi khi `job.is_premium` đổi.

> **Câu quan trọng nhất, trích thẳng comment của V811:** *"The legacy migration has to put a group of postings in the band **whatever product they were mapped to**, which **a catalogue-wide rule cannot express**."*
>
> "Sản phẩm phủ placement" **chính là** một luật catalogue-wide. Nên nó **không thể** thay thế đường legacy. Thay mù là **đá toàn bộ tin migrate ra khỏi dải**, không báo lỗi gì.

## 2. Tạo dòng `placement`

| Cột | Giá trị |
|---|---|
| `slot_key` | **`SEARCH_PREMIUM`** (chị Thu chốt 23/11) |
| `page` | `SEARCH` |
| `format` | `CONTENT_POOL` |
| `fill_route` | `TIER` |
| `items_shown` | `3` — số thẻ nhìn thấy cùng lúc |
| `pool_cap` | `500` — xem mục 5, **code của dải không được đọc giá trị này** |
| `rotation_seconds` | `NULL` — dải tự xoay theo `bandSeq` (SRM-1538 luật 8) |
| `creative_width/height` | `NULL` |
| `status` | `ACTIVE` |

## 3. `product_placement_slot` — CHỐT: giống hệt hôm nay

**Ngày đầu, phủ đúng những product code đang nằm trong bundle có `is_premium = true` và `status = APPROVED`.** Không thêm, không bớt. `coverage_days = NULL` cho mọi dòng.

> **Vì sao không nhân tiện đổi luôn danh sách.** Đổi cơ chế và đổi phạm vi cùng lúc thì khi số liệu lệch, không ai biết lệch vì cơ chế mới sai hay vì danh sách mới khác. Giữ nguyên phạm vi → phép đối chiếu trước/sau phải ra **đúng 0 chênh lệch** → đó là bằng chứng cơ chế mới đúng. Muốn đổi ai được vào dải thì đổi sau, và khi đó nó chỉ là **sửa dữ liệu**, không đụng một dòng code nào. Đó mới là cái lợi thật của việc chuyển sang placement.

`coverage_days = NULL` không phải lựa chọn tuỳ ý: hôm nay luật premium **không có cửa sổ riêng theo ô** — cửa sổ đến từ `job_placement`. `NULL` là giá trị duy nhất giữ nguyên hành vi.

## 4. Đổi CÁI GÌ — nhỏ hơn bản đầu của ticket này nhiều

**Giữ nguyên:** `job.is_premium`, `PremiumJobTagger`, trigger V813, đường ES, và điều kiện đọc của dải. Đường đọc **không đổi một dòng**.

**Chỉ đổi một thứ:** nguồn mà tagger dùng cho **tin bán mới** —

- ~~sản phẩm nằm trong bundle `is_premium` + `APPROVED`~~
- → **sản phẩm phủ placement `SEARCH_PREMIUM`** (`product_placement_slot`)

**Tuyệt đối không đụng** `legacy_product_mapping.premium` và `legacy_job_premium`. Hai cái đó là cửa thoát cố ý cho dữ liệu migrate, và theo V811 thì luật catalogue **không diễn đạt được** cái chúng diễn đạt. `legacy_job_premium` vẫn thắng như cũ.

Khi tagger đã chạy bằng placement và đối chiếu xong, **`bundle.is_premium` thành vô dụng** → gỡ bằng một migration riêng. Gỡ cột hay để lại mà không ai đọc là tuỳ BE, miễn **chỉ còn đúng một nguồn sự thật cho tin bán mới**.

> ⛔ **Không để hai nguồn cùng sống.** Nếu tagger vừa đọc `bundle.is_premium` vừa đọc placement thì dải trả lời hai câu khác nhau tuỳ nhánh nào chạy — và lỗi kiểu đó **không báo gì cả**, chỉ là tin của khách lúc có lúc không.

## 5. ⚠ Hai chỗ cơ chế TIER sẵn có đụng vào luật vòng quay

**a. `limit = pool_cap ?? items_shown` sẽ cắt mất tập tin.** Reader chung `findOpenJobsInPlacement()` giới hạn theo `pool_cap`, nhưng SRM-1538 cần **id của TOÀN BỘ tập đủ điều kiện** — vòng quay chạy trên tập đó, và cắt tập là **đóng băng vĩnh viễn** những tin nằm ngoài.

> Dải **không dùng reader chung**. Dùng lại vị ngữ của nó (`tierWindowsOf` + `feedsPlacement` + job `OPEN` & `exposure`, company `ACTIVE`) nhưng **bỏ `limit` và bỏ `ORDER BY`**.

**b. `ORDER BY job.refreshed_at DESC, job.id DESC` KHÔNG áp cho dải này.** Thứ tự do vòng quay quyết định (SRM-1538 luật 7/7b/8). Độ mới **cố ý vắng mặt** ở khung nhìn đầu.

## 6. Acceptance

- [ ] Có dòng `placement` `SEARCH_PREMIUM`: `page = SEARCH`, `format = CONTENT_POOL`, `fill_route = TIER`, `status = ACTIVE`.
- [ ] `product_placement_slot` phủ **đúng** tập product code đang nằm trong bundle `is_premium = true` + `APPROVED`, `coverage_days = NULL`.
- [ ] **Đối chiếu trước/sau phải ra 0 chênh lệch.** Với cùng từ khoá, tập tin dải trả về theo đường cũ và đường mới **giống hệt nhau**. Lệch một tin cũng phải giải thích được.
- [ ] **Tin migrate vẫn ở nguyên trong dải.** Một tin có `legacy_product_mapping.premium` nhưng sản phẩm **không** phủ `SEARCH_PREMIUM` → **vẫn** premium, vẫn trong dải.
- [ ] **`legacy_job_premium` vẫn thắng.** Bật thủ công cho một tin mà mapping của nó không premium → tin đó premium. Tắt cho một tin mà mapping premium → tin đó rớt.
- [ ] Chạy apply lại mapping → các ngoại lệ `legacy_job_premium` **không bị ghi đè**.
- [ ] Đổi `product_placement_slot` (thêm/bớt một product) → tin tương ứng vào/ra dải **sau khi tagger chạy lại**, và ES được re-index (trigger V813).
- [ ] Dải đọc được **toàn bộ** tập id đủ điều kiện, **không bị `pool_cap` cắt**.
- [ ] Thứ tự tin trong dải **không** theo `refreshed_at`.
- [ ] Tin hết `job_placement` ACTIVE → rời dải, kể cả khi `is_premium = true`.
- [ ] Tắt placement về `INACTIVE` → dải rỗng, **không lỗi, không 404**.
- [ ] Sau khi gỡ: **không còn chỗ nào đọc `bundle.is_premium`** để quyết định tin bán mới.

## 7. Không làm trong sub-task này

- ❌ Đổi danh sách sản phẩm được vào dải — ngày đầu giữ y hệt, đổi sau bằng sửa dữ liệu.
- ❌ Đụng `legacy_product_mapping.premium` hay `legacy_job_premium`.
- ❌ Đổi đường đọc của dải, `job.is_premium`, trigger V813 hay ES mapping.
- ❌ Hàng tag, vòng quay, con trỏ, response `premiumBand` — SRM-1538.
- ❌ Đụng `SEARCH_TOP_JOBS` hay placement nào đang chạy.
