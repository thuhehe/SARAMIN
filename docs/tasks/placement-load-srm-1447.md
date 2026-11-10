# SRM-1447 · Dashboard: tình hình hiển thị job ở các placement

**Parent:** SRM-1445 Product Mapping · **Assignee:** Long · **Reviewer:** Thu

- **Requirement:** https://saramin-eta.vercel.app/m/products-packages/placement-load-what-each-band-actually-shows
- **Mockup:** https://saramin-eta.vercel.app/wireframe/admin?screen=admin-placement-load
- **Vị trí:** Products → **Tình hình hiển thị** (ngay dưới Placements)

---

## 1. Mục tiêu

Mở một trang jobseeker ra dưới dạng **sơ đồ slot**: mỗi band là lưới slot thật của nó, cho thấy ngay **bao nhiêu tin đang lấp slot** và **bao nhiêu tin đang xếp hàng phía sau** (hoặc bao nhiêu slot đang bỏ trống).

## 2. Hai tình huống, đúng hai con số

| | Điều kiện | Lưới vẽ ra | Hai con số |
|---|---|---|---|
| **TH1 — thừa tin** | `eligible > số slot` | Lấp đầy toàn bộ slot, + hàng chờ bên dưới | `X tin đang hiển thị` · `(eligible − X) tin đang chờ` |
| **TH2 — thiếu tin** | `eligible < số slot` | Lấp `eligible` ô, phần còn lại viền đứt | `X tin đang hiển thị` · `(slot − X) slot chưa có tin lấp` |

```
showing = min(itemsShown, eligible)
waiting = max(0, eligible − itemsShown)
empty   = max(0, itemsShown − eligible)
eligible = loads[].showing  (từ /api/admin/jobs/placement-board)
```

**Không thêm chỉ số nào khác.** Không trạng thái, không nhãn cảnh báo, không xếp hạng mức độ.

## 3. Lưới thật của từng band — đo trên stg-saramin 10/11/2026

Số cột đọc trực tiếp từ toạ độ card trên trang. Ba band khớp chính xác `itemsShown` của registry, nên đây là lưới thật chứ không phải quy ước.

| Band | Slot | Lưới |
|---|---|---|
| Super hot - Pinned | 1 | 1 thẻ lớn, cao bằng 2 dòng thẻ thường, bên trái lưới Super hot |
| Super hot - Image | 30 | 4 cột |
| Super hot - Blue highlight | 16 | 4 cột × 4 dòng |
| Super hot - Plain | 24 | 4 cột × 6 dòng |
| Premium jobs | 10 | dải cuộn ngang 1 dòng, 10 thẻ |
| Highlight jobs | 24 | **4 cột × 6 dòng** |
| Latest jobs | 30 | **5 cột × 6 dòng** |
| Diverse opportunities | 36 | **6 cột × 6 dòng** |
| Mega menu (2 band) | 40 / 30 | 3 cột |

Korea và Global dùng đúng bộ 8 band này, cùng số slot, cùng lưới.

## 4. UI mỗi band

```
Tên band          30 slot · 5 cột × 6 dòng                        SLOT_KEY

23 TIN ĐANG HIỂN THỊ · 7 SLOT CHƯA CÓ TIN LẤP   683 TIN ĐANG CHỜ HIỂN THỊ
[lưới 5×6: 23 ô xanh đặc, 7 ô viền đứt]         [lưới vàng, cắt 2 dòng] +671

Sản phẩm feed vào đây:  [JOB-BASIC] [JOB - TIN BASIC 2026]
```

**Hàng chờ nằm BÊN PHẢI lưới slot, không nằm dưới** — một trang có 8 band, xếp dọc thì phải cuộn hai lần mới đọc hết một trang.

- Ô xanh đặc = slot đã có tin.
- Ô viền đứt = **slot đang hiển thị trên trang nhưng chưa có tin lấp**.
- Ô vàng = tin đang chờ. **Cắt ở 2 dòng**, phần còn lại hiện `+N` — 683 ô vàng là một bức tường không đọc được.
- Thứ tự band trong trang đi đúng thứ tự người dùng gặp (Super hot - Pinned xuống Diverse opportunities).

## 5. API — không cần endpoint mới

| Endpoint | |
|---|---|
| `GET /api/admin/placements` | **đã có** — `itemsShown`, `fillRoute`, `status` |
| `GET /api/admin/jobs/placement-board` | **đã có** — `feeds[]` (sản phẩm mỗi band) + `loads[].showing` (eligible) |

**Không bảng mới, không cột mới, không endpoint mới.** Thứ duy nhất không có trong registry là **số cột** của từng band → FE giữ bảng ánh xạ `slotKey → cols` (mục 3), vì đó là layout của trang chứ không phải cấu hình bán hàng.

## 6. Acceptance criteria

- [ ] Mỗi band TIER + ACTIVE của trang đang chọn có đúng 1 khối, vẽ đúng `itemsShown` ô theo đúng số cột ở mục 3.
- [ ] `Home - Diverse opportunities`: lưới 6×6, 36 ô đặc, đọc “36 tin đang hiển thị”, hàng chờ “683 tin đang chờ hiển thị” + `+671`.
- [ ] `Home - Latest jobs`: lưới 5×6, 23 ô đặc + 7 ô viền đứt, đọc “23 tin đang hiển thị · 7 slot chưa có tin lấp”.
- [ ] `Korea - Super hot - Image`: lưới 4 cột, 3 ô đặc + 27 ô viền đứt.
- [ ] `Home - Highlight jobs`: 24 ô đặc, hàng chờ đúng 2 ô vàng, không có `+N`.
- [ ] Mỗi khối liệt kê đúng các sản phẩm đang feed vào band.
- [ ] Không có endpoint mới nào được thêm.

## 7. Không làm

- **Không sửa gì từ màn hình này.** Read-only — cấu hình vẫn đi qua Products → Placements.
- **Không có trang Job search result.** Dải trên cùng còn lọc theo từ khoá nên số tin đủ điều kiện không có nghĩa trên một lần render.
- **Không đụng khối “The choice that sets you apart”** — không đọc placement nào, cứ gói từ premium trở lên + khớp từ khoá là được đẩy lên, nên không có slot để vẽ.
- **Không đưa band `BOOKED`** (banner, popup) vào — đã có Service → Boosting lo.
- **Không làm trạng thái / cảnh báo / lịch sử / xu hướng / tra cứu theo từng tin.**

## 8. Điều Dev phải biết dù màn hình không hiện

svn-be sắp theo `refreshed_at desc`, **CẮT ở `pool_cap ?? items_shown`, RỒI MỚI xáo**. 19/27 band đang để trống `pool_cap`, nên ở các band đó tập được xáo đúng bằng số slot — tin ngoài top N **không “chờ tới lượt”**, nó không nằm trong tập được bốc, và chỉ lên được khi chính nó được refresh lên đầu.

Màn hình gộp tất cả vào “đang chờ” theo quyết định của PO (10/11/2026) vì hai con số là đủ cho vận hành. Nhưng khi khách hỏi “bao giờ tin tôi lên?”, câu trả lời phụ thuộc `pool_cap` chứ không phải vị trí trong hàng đợi.

---

## 9. Hai việc tách riêng, KHÔNG nằm trong task này

1. **19/27 band để trống Pool cap** — cần Thu xác nhận cố ý hay sót. Nếu là sót, sửa cấu hình giải quyết phần lớn vấn đề mà Dev không phải làm gì.
2. **Hai band mega menu bị đặt tên chéo nhau.** `MEGA_MENU_PAGE_JOB_LIST_TRENDING` mang tên *"Don't miss these annoucements"*, `MEGA_MENU_PAGE_JOB_LIST_ANNOUNCEMENT` mang tên *"Trending jobs"*. Nên sửa tên trong registry **trước khi** màn hình này lên, nếu không người đọc sẽ đối chiếu nhầm band. (Tên hiển thị cũng sai chính tả “annoucements”.)
