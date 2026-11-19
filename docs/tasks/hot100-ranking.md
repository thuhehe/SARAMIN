# 25. HOT100 — đổi cách xếp hạng trang "Công ty hàng đầu"

**Repo:** svn-web + svn-be · **Ưu tiên:** sau go-live 21/11/2026 *(giả định của BA, cần xác nhận)*
**Requirement:** [saramin-eta.vercel.app/m/job-management/hot100](https://saramin-eta.vercel.app/m/job-management/hot100)
**Mockup:** [Mockups ▸ js-hot100](https://saramin-eta.vercel.app/mockups)
**Tham khảo UI:** Saramin KR — [/zf_user/jobs/hot100](https://www.saramin.co.kr/zf_user/jobs/hot100)

> **Tóm lại:** trang `/viec-lam/cong-ty-hang-dau` hiện xếp theo bậc gói rồi tới thời điểm làm mới tin. Hai thứ đó gần như không đổi theo ngày, nên cột tăng/giảm mà svn-web đã vẽ sẵn luôn hiển thị "–" trên production. Ticket này giữ nguyên cách **chọn ra 100 tin**, và đổi cách **xếp vị trí trong 100 tin đó** thành công thức trộn: mặc định 90% theo gói, 10% theo mức ứng viên quan tâm, tính lại mỗi đêm. Tỉ lệ đó là **một ô cấu hình trong admin**, không viết cứng. Kèm theo: một dòng "Gợi ý" phía trên vị trí số 1, một bộ lọc kinh nghiệm, giới hạn 10 dòng cho khách chưa đăng nhập, và một màn hình cấu hình 6 ô.

---

## 0. Trước khi ước lượng — đọc phần này

**Không cần dựng hệ thống thu thập dữ liệu mới.** Bộ đếm lượt xem, lượt lưu, lượt ứng tuyển đều đã có; bảng chụp thứ hạng hằng ngày, tác vụ 0h và endpoint lấy thứ hạng hôm qua cũng đã có. Việc chính là **đổi khoá sắp xếp** và **thêm phần tính điểm**.

**Hai chỗ dễ làm sai nhất**, đọc kỹ trước khi code:

1. **Tin bằng điểm tương tác phải nhận CÙNG một thứ hạng** (phần 1, bước B2). Giai đoạn đầu phần lớn tin sẽ cùng 0 điểm, nên chỗ này quyết định cả bảng.
2. **Hai quy tắc chống gian lận lượt xem phải lên cùng đợt** (phần 3.7), không để lại sau.

---

## 1. Luồng đích — hệ thống phải chạy thế nào

Tác vụ chạy **00:01 giờ Việt Nam mỗi ngày**. Bảng cố định suốt ngày hôm đó.

```
TOÀN BỘ TIN TRONG HỆ THỐNG
        │
   [A] CHỌN 100 TIN        A1 lọc → A2 sắp theo gói → A3 giới hạn công ty → A4 bù cho đủ
        │                  thứ tự sau bước này = HẠNG THEO GÓI
   [B] XẾP THEO TƯƠNG TÁC  B1 điểm thô → B2 xếp hạng, xử lý bằng điểm
        │                  thứ tự sau bước này = HẠNG THEO TƯƠNG TÁC
   [C] TRỘN                vị trí = 0,9 × hạng theo gói + 0,1 × hạng theo tương tác
        │
   [D] MŨI TÊN & LƯU LẠI   so với hôm qua → lưu bảng → xử lý lỗi
```

### A — Chọn 100 tin, lập hạng theo gói

| Bước | Quy tắc |
|---|---|
| **A1 — lọc** | Tin đang mở và bật hiển thị · chưa hết hạn nhận hồ sơ · chưa hết hạn hiển thị · công ty đang hoạt động · công ty có mã số thuế hợp lệ (công ty nước ngoài dùng `foreign_tax_id`) |
| **A2 — sắp xếp** | 1. bậc gói trên posting ladder, cao→thấp · 2. thời điểm làm mới tin, mới→cũ · 3. tin tạo sau đứng trước (chỉ phá hoà) |
| **A3 — giới hạn công ty** | Duyệt từ trên xuống, mỗi công ty tối đa **10 tin**. Tin thứ 11 trở đi sang danh sách chờ, nhường chỗ cho công ty khác |
| **A4 — bù cho đủ** | Chưa đủ 100 thì lấy tiếp từ danh sách chờ theo đúng thứ tự A2. Vẫn chưa đủ thì bảng hiển thị đúng số tin có |

**Thứ tự sau A4 chính là hạng theo gói** (1…100), một trong hai đầu vào của bước C. Không lưu lại, đêm nào cũng tính lại.

> **Không có cổng chặn tin miễn phí ở bước này.** Tin không mua gói vẫn hợp lệ, chỉ xếp cuối. Build hiện tại thì ngược lại — xem phần 3.1.

### B — Lập hạng theo tương tác, chỉ cho 100 tin đó

**B1 — điểm thô**, trong 7 ngày gần nhất tính tới hết ngày hôm qua:

```
điểm thô = (lượt xem hợp lệ × 1) + (lượt lưu còn hiệu lực × 3) + (lượt ứng tuyển còn hiệu lực × 5)
```

**B2 — xếp hạng.** Sắp 100 tin theo điểm thô giảm dần, đánh số 1…100.

**Tin bằng điểm nhận cùng một thứ hạng**, bằng trung bình của khoảng vị trí mà nhóm đó chiếm.

> Ví dụ: 20 tin có điểm nhận hạng 1…20. 80 tin còn lại cùng 0 điểm, cùng chiếm khoảng vị trí 21…100, nên **cả 80 tin đều nhận hạng 60,5**.
>
> Nếu xếp tin bằng điểm theo thứ tự tuỳ ý, hai tin giống hệt nhau sẽ nhận hạng 21 và 100 — chênh 79 bậc dựng ra từ hư không, nhân 0,1 thành lệch 8 bậc trên bảng thật.

Cửa sổ 7 ngày chính là cơ chế làm mượt rồi (mỗi ngày chỉ thay 1/7 dữ liệu). **Không thêm công thức làm mượt nào khác**, và **không lưu điểm** — điểm thô luôn tính lại được từ dữ liệu gốc.

### C — Trộn, ra vị trí hiển thị

```
vị trí = ((1 − w) × hạng theo gói) + (w × hạng theo tương tác)
```

`w` là **trọng số tương tác**, một số từ 0 đến 1 do admin đặt, **mặc định 0,1**. Trọng số gói là phần còn lại, hệ thống tự suy ra.

Sắp **tăng dần**, số nhỏ hơn đứng trước. Bằng nhau thì hạng theo gói nhỏ hơn đứng trước. **Không có bước xáo trộn nào sau đây.**

| Tin | Hạng theo gói | Hạng theo tương tác | Điểm vị trí | Hiển thị ở |
|---|---|---|---|---|
| P | 5 | 60,5 | 4,5 + 6,05 = 10,55 | 1 |
| Q | 12 | 2 | 10,8 + 0,2 = 11,00 | 2 |
| R | 12 | 60,5 | 10,8 + 6,05 = 16,85 | 3 |
| S | 20 | 1 | 18 + 0,1 = 18,10 | 4 |

**Admin nhập một số, không phải hai.** Hai ô riêng có thể bị đặt thành tổng khác 1 và không chỗ nào trên màn hình báo điều đó.

**`w = 0` là công tắc tắt.** Đặt về 0 thì bảng quay lại đúng thứ tự như production hiện nay — không cần phát hành lại. Đây là đường lui nếu quy tắc mới có vấn đề sau khi lên.

### D — Mũi tên và lưu lại

| Tình huống | Hiển thị |
|---|---|
| Có trong bảng hôm qua, vị trí thay đổi | ▲ / ▼ kèm số bậc |
| Có trong bảng hôm qua, giữ nguyên vị trí | – |
| Không có hôm qua **và chưa từng lên bảng** | **new** |
| Không có hôm qua **nhưng đã từng lên bảng** | – |
| Đêm chạy đầu tiên | – cho toàn bộ |
| Đang áp bộ lọc | – cho toàn bộ |

**Lưu đúng hai thứ:** danh sách 100 tin kèm vị trí, và mốc ngày tin lần đầu lọt vào bảng. Không lưu điểm.

Tác vụ lỗi ở bất kỳ bước nào → **giữ nguyên bảng hôm trước**, ghi log, cảnh báo. Không để trang trắng.

### Trong ngày

| Tình huống | Hệ thống làm gì |
|---|---|
| Mở trang bình thường | Trả bảng đã chốt lúc 0h, không tính lại |
| Bấm bộ lọc | Truy vấn mới trên toàn bộ tin hợp lệ, sắp theo bậc gói rồi thời điểm làm mới, tối đa 100 tin. **Không dùng điểm** |
| Đang áp bộ lọc | Cột tăng/giảm hiển thị "–" mọi dòng |

---

## 2. Những gì ĐÃ CÓ trong build — dùng lại, đừng viết mới

| Đã có | Ở đâu | Ghi chú |
|---|---|---|
| Bảng chụp thứ hạng hằng ngày | `hot100_rank_snapshot` (V818) | Dùng lại nguyên, chỉ đổi nội dung được ghi vào |
| Tác vụ 0h | `Hot100RankSnapshotJob`, chạy 00:01 giờ VN mỗi ngày | Dùng lại |
| Endpoint thứ hạng hôm qua | `GET /api/{lang}/jobs/hot100/previous-ranks` | Dùng lại |
| Logic mũi tên phía FE | `features/jobs/hot-100/lib/rank-with-change.ts` | Cần thêm nhãn "new" |
| Lượt xem theo ngày | `job_daily_snapshot` (V541) — ghi tổng luỹ kế của **mọi tin đang mở** mỗi ngày | Lượt xem 1 ngày = hiệu hai ngày liên tiếp |
| Lượt lưu | bảng `scrap`, có `scrapped_at`; `job.save_count` đồng bộ bằng trigger (V440) | Đếm trực tiếp theo ngày |
| Lượt ứng tuyển | bảng `job_application`; `job.apply_count` (V5, V166) | Đếm trực tiếp theo ngày |

**Lưu ý khi tính lượt xem:** nếu một ngày không có dòng nào trong `job_daily_snapshot` (tác vụ không chạy hôm đó) thì coi ngày đó **0 lượt xem**, không được lấy hiệu nhảy cóc qua hai ngày.

---

## 3. MƯỜI HAI ĐIỂM CẦN THAY ĐỔI

### 3.1 Bỏ lọc theo placement

| | |
|---|---|
| **Build** | Lọc theo placement `placement_mega_menu_page_job_list_trending`. Tin không có gói được tick vị trí này thì không bao giờ lên trang |
| **Requirement** | Không có khái niệm placement. Lấy tất cả tin hợp lệ, sắp theo bậc posting ladder, cắt lấy 100 tin đầu |
| **Cần làm** | Bỏ điều kiện lọc placement cho section này. Chuyển posting ladder từ vai trò *lọc* sang vai trò *sắp xếp để chọn* |

> Thay đổi này vào build ngày 22/09/2026, commit `6d9697723` — *"the two board strips are sold, not inferred from rank"*. Requirement chưa bao giờ cập nhật theo.
>
> **ĐÃ CHỐT 19/11/2026: làm theo requirement, bỏ lọc placement.** Việc build hiện đang làm khác không phải lý lẽ — trang này đang được xây lại theo requirement, nên code hiện tại không quyết định được gì.
>
> Hệ quả bán hàng: câu bán là **"mua gói để đứng CAO HƠN"**, không phải "mua gói để ĐƯỢC LÊN trang". Trên thực tế khác biệt nhỏ, vì với giới hạn 10 dòng cho khách vãng lai thì những dòng họ thật sự nhìn thấy đằng nào cũng là phần đầu của thứ tự theo gói.

### 3.2 Chuyển giới hạn 10 tin/công ty lên bước chọn

| | |
|---|---|
| **Build** | Áp sau khi đã có danh sách, trong `TopCompaniesOrder.arrange` |
| **Cần làm** | Áp ngay ở bước A3, trước khi cắt lấy 100 tin, kèm bước bù A4 |

### 3.3 BỎ quy tắc không để 2 tin liền kề cùng công ty

| | |
|---|---|
| **Build** | `TopCompaniesOrder.arrange` xáo trộn thứ tự để hai tin liền kề không cùng công ty |
| **Cần làm** | **Gỡ hẳn phần giãn công ty.** Giữ lại phần đếm giới hạn 10 tin và chuyển lên A3 |

Hệ quả: một công ty có thể chiếm nhiều vị trí liền kề, tối đa 10 trong 100. **Đây là kết quả đúng, không phải lỗi.**

### 3.4 Đổi khoá sắp xếp vị trí

| | |
|---|---|
| **Build** | `ORDER_TIER_THEN_REFRESHED` — bậc gói rồi thời điểm làm mới |
| **Cần đổi thành** | Công thức trộn ở bước C |

### 3.5 Thêm phần tính điểm và xếp hạng theo tương tác

Logic mới hoàn toàn (bước B). Chạy trong tác vụ 00:01, chỉ cho 100 tin đã chọn. **Bắt buộc xử lý đúng trường hợp bằng điểm.**

### 3.6 Nhãn "new" và mốc "đã từng lên bảng"

Build hiện chỉ có 2 trạng thái: có số liệu hôm qua thì ▲▼, không có thì "–". Cần thêm:

- Lưu mốc **ngày đầu tiên tin lọt vào bảng**
- Hiển thị **"new"** cho tin lần đầu lên bảng
- Tin đã từng lên bảng, rớt ra rồi quay lại → "–"
- Đêm chạy đầu tiên → toàn bộ "–", không hiện "new" hàng loạt

> **"new" nghĩa là mới vào bảng, không phải tin mới đăng.** Tin đăng 8 ngày trước vẫn hiện "new" nếu đây là lần đầu nó lọt top 100. Câu chữ cho người dùng phải là "mới vào bảng" hoặc giữ nguyên chữ "new", **không được dịch thành "tin mới"**.

### 3.7 Chống gian lận lượt xem — lên cùng đợt, không để sau

| Quy tắc | Hiện trạng |
|---|---|
| Một người xem một tin trong một ngày chỉ tính **1 lượt** | **CHƯA CÓ** — đang +1 mỗi lần mở trang |
| Lượt xem từ tài khoản nhà tuyển dụng sở hữu tin **không tính** | **CHƯA CÓ** |
| Bỏ lưu tin thì không còn tính | Đã có trigger, kiểm tra lại |
| Ứng tuyển bị rút/xoá thì không tính | Đã có trigger, kiểm tra lại |

> Thiếu hai dòng đầu thì nhà tuyển dụng chỉ cần tự mở lại tin của mình nhiều lần là leo hạng. Lần đầu bị phát hiện là bảng mất hết uy tín, mà uy tín là toàn bộ giá trị của tính năng này.

### 3.8 Sửa nội dung hiển thị

| Chỗ | Hiện tại | Sửa thành |
|---|---|---|
| Tiêu đề trang | "Tin tuyển dụng phổ biến HOT100" | "Công ty hàng đầu" |
| Chú thích dấu "?" | Mô tả bảng dựa trên lượt xem và lượt lưu, tổng hợp 30 phút từ 0 giờ | BA sẽ cấp câu chữ mới |

Khoá trong `dictionaries/vi.json`, `en.json`, `ko.json`: `hotTitle`, `hotInfoDescription`.

### 3.9 THÊM một vị trí "Gợi ý" phía trên dòng số 1

Một dòng **nằm trên vị trí số 1**, mang nhãn "Gợi ý", **không có số thứ tự** và **không có mũi tên** — vì nó không phải một vị trí trên bảng.

| Câu hỏi | Quy tắc |
|---|---|
| Tin nào được chọn | Tin có **điểm thô cao nhất** trong 100 tin. Bằng điểm thì tin có hạng theo gói tốt hơn được chọn |
| Khi không tin nào có điểm | **Không vẽ dòng này**. Gắn nhãn "Gợi ý" cho một tin không ai mở thì nhãn mất nghĩa ngay tuần đầu — mà giai đoạn đầu phần lớn tin sẽ 0 điểm |
| Tính lúc nào | Ngay sau bước B, trong cùng tác vụ 0h. Không giữ lại từ hôm qua |
| Bao nhiêu dòng | Tham số cấu hình, mặc định 1 |

> **Nhãn này nghĩa là "ứng viên thích tin này", KHÔNG phải "tin trả phí cao".** Đây là một ngã rẽ thiết kế đã được chốt: bản đề xuất ban đầu định dùng nhãn để thể hiện giá trị thương mại, khách hàng chọn hướng ngược lại. Đừng âm thầm đổi nó thành nhãn theo gói.
>
> Dòng này là **phần duy nhất của trang thuần theo tương tác**. Mọi dòng bên dưới nó là 90% theo gói.

**Chưa chốt:** tin được chọn có giữ luôn dòng đánh số của nó ở dưới, hay được nhấc hẳn ra khỏi 100 tin — xem phần 8.

### 3.10 THÊM bộ lọc kinh nghiệm

Hai nút: **Chưa có kinh nghiệm** / **Đã có kinh nghiệm**, đặt dưới lưới chọn ngành nghề, **không phải một tab** như 4 nhóm kia.

| | |
|---|---|
| **Dùng lại cái gì** | Facet `experience` svn-be đã phục vụ sẵn — `entry` cho tin không đòi kinh nghiệm, `experienced` cho tin có đòi. **Không cần thêm trường mới** |
| **Hành vi** | Giống mọi bộ lọc khác: truy vấn lại trên toàn bộ tin hợp lệ, xếp theo bậc gói rồi thời điểm làm mới, và **cột tăng/giảm hiển thị "–" mọi dòng** |

**Chưa chốt:** có trạng thái "tất cả" không, hay luôn phải chọn một trong hai — xem phần 8.

### 3.11 THÊM màn hình cấu hình trong admin — 6 ô, một màn hình

**Không số nào trong ticket này được viết cứng trong code.** Đây là các cần gạt mà vận hành sẽ chỉnh khi có lưu lượng thật, và cả sáu số đều sẽ sai ở lần đoán đầu tiên.

| Ô | Mặc định | Chỉnh nó thì sao |
|---|---|---|
| Trọng số tương tác `w` | 0,1 | Tin dịch xa khỏi vị trí theo gói bao nhiêu. 0,1 ≈ 10 bậc, 0,3 ≈ 30 bậc, **0 = tắt hẳn quy tắc mới** |
| Điểm mỗi lượt xem | 1 | Nâng/hạ trọng lượng của sự tò mò |
| Điểm mỗi lượt lưu | 3 | Nếu lượt lưu không nói lên gì ở thị trường này thì hạ xuống 2 |
| Điểm mỗi lượt ứng tuyển | 5 | Nếu ứng tuyển là tín hiệu thật duy nhất thì nâng lên 10 |
| Số ngày của cửa sổ tính điểm | 7 | Ngắn thì phản ứng nhanh và nhảy mạnh; dài thì êm và chậm |
| Số dòng cho khách chưa đăng nhập | 10 | Khách vãng lai xem được bao nhiêu dòng trước khi bị mời đăng nhập. Tăng lên là đánh đổi lượt đăng ký lấy độ phủ |

Ô cuối bảng — số dòng cho khách chưa đăng nhập — xem phần 3.12.

Thêm một ô thứ 7 nếu làm nhiều dòng Gợi ý: **số dòng Gợi ý**, mặc định 1.

> **Bộ 1 / 3 / 5 là con số đoán ban đầu, không phải đo đạc.** Nó xếp ba tín hiệu theo công sức ứng viên bỏ ra: xem có thể là bấm nhầm, lưu là có chủ đích, ứng tuyển tốn công thật và là thứ nhà tuyển dụng trả tiền để có. Chưa đo gì ở thị trường này, nên cả ba là **ô cấu hình chứ không phải hằng số**.
>
> **Màn hình phải ghi rõ: đổi số có hiệu lực từ lần chạy 0h kế tiếp, không phải ngay lập tức.** Không ghi thì người vận hành đầu tiên đổi số sẽ kết luận là nó không chạy.

### 3.12 THÊM giới hạn 10 dòng cho khách chưa đăng nhập

**Khách chưa đăng nhập chỉ thấy 10 dòng đầu** của bảng đang xem. Đăng nhập rồi thì thấy đủ 100.

Áp cho **cả bảng chung lẫn mọi danh sách đã lọc** — lọc sang ngành nào cũng chỉ 10 dòng đầu của danh sách đó.

| Câu hỏi | Quy tắc |
|---|---|
| Cắt cái gì | **Chỉ cắt phần HIỂN THỊ.** Tác vụ 0h vẫn tính và lưu đủ 100 vị trí |
| Cắt ở đâu | Lúc render, trên danh sách mà trang đã có sẵn |
| Dưới dòng 10 | Khối mời đăng nhập "Đăng nhập để xem đủ 100 tin". **Không** làm mờ dòng 11–20 kiểu nhá hàng |
| Mũi tên | Khách chưa đăng nhập **vẫn thấy** ▲▼ trên 10 dòng đó |
| Dòng Gợi ý | Vẫn vẽ. Nếu tin đó cũng nằm dưới dòng 10 thì khách vãng lai đơn giản là không gặp nó hai lần |
| Số 10 | Ô cấu hình thứ 6 |

> **TUYỆT ĐỐI KHÔNG cắt lúc tính.** Nếu tác vụ 0h lưu 10 dòng thay vì 100, thì mọi tin dưới vị trí 10 không có mốc để so hôm sau, và sáng mai cả bảng sẽ hiện "new". Bảng lưu luôn là 100 dòng.

### Cảnh báo SEO — đọc trước khi code

Ý định đằng sau là đúng: nếu Google chỉ thấy 10 dòng thì 90 tin trả phí biến mất khỏi kết quả tìm kiếm, hỏng âm thầm, vài tháng sau mới phát hiện.

**Nhưng cho bot thấy 100 dòng trong khi người dùng thấy 10 chính là cloaking, và Google có hình phạt cho việc đó.** Kiểm tra user-agent rồi trả nội dung khác nhau không phải cách làm.

Ba hướng, cần chủ SEO chọn:

1. Dùng **structured data cho nội dung có tường chắn** của Google (`isAccessibleForFree: false` + `hasPart`) — đây là cách Google cho phép chính thức
2. Trả đủ 100 dòng trong HTML cho tất cả, chặn ở phía giao diện
3. Chấp nhận chỉ 10 dòng được lập chỉ mục

**Đánh đổi giữa hướng 1 và hướng 2:**

- **Hướng 1** là ngoại lệ chính thức của luật cloaking, không phải lách luật. Google có hướng dẫn riêng cho nội dung sau tường đăng nhập: `isAccessibleForFree: false` cộng `hasPart` trỏ vào phần bị chắn.
- **Hướng 2** rẻ hơn và cũng hợp lệ, nhưng **tường đăng nhập thành mềm**: ai mở mã nguồn trang là đọc được cả 100 tin. Mà "cho người ta lý do đăng ký" chính là mục đích của quy tắc này, nên hướng 2 làm hỏng đúng thứ mà quy tắc muốn đạt.

Nếu phải chọn nhanh thì **hướng 1 là hướng duy nhất vừa cho Google thấy đủ nội dung vừa giữ được tường đăng nhập**.

Đây là quyết định có hình phạt đi kèm, không phải chi tiết kỹ thuật — **đừng tự chọn, hỏi lại BA**.

### Hệ quả bán hàng

**Vị trí số 10 giờ là một ranh giới có tiền.** Với `w = 0,1` một tin dịch tối đa khoảng 10 bậc, nên:

- tin xếp thứ 15 theo gói **có thể lọt vào 10 dòng khách vãng lai nhìn thấy** nhờ tương tác tốt
- tin xếp thứ 8 theo gói **có thể rớt ra khỏi** 10 dòng đó

Phải nói rõ với khách hàng trước khi bán gói đầu tiên dựa trên ranh giới này.

---

## 4. Kiểm thử bằng dữ liệu quá khứ trên production

**Yêu cầu từ BA.** Production đã có lượt xem tích luỹ từ trước, nên **trước khi bật tính năng**, hãy dựng lại bảng xếp hạng cho các ngày đã qua và xem con số tăng giảm thực tế ra sao. Ví dụ dữ liệu mới nhất là 16/11 thì dựng bảng cho 11, 12, 13, 14, 15/11 rồi so liên tiếp từng ngày.

Mục đích là trả lời **trước khi lên production** hai câu mà hiện không ai biết:

- mỗi ngày bảng xáo trộn bao nhiêu bậc trên thực tế
- có bao nhiêu tin thật sự đổi chỗ, hay gần như đứng yên vì phần lớn tin 0 điểm

### Dựng lại được tới đâu

| Thành phần | Dựng lại được? | Vì sao |
|---|---|---|
| **Điểm thô (tương tác)** | **Được, chính xác** | `job_daily_snapshot` ghi tổng lượt xem luỹ kế của mọi tin đang mở vào cuối mỗi ngày, nên lượt xem một ngày = hiệu hai ngày liên tiếp. `scrap.scrapped_at` và mốc thời gian của `job_application` cho phép đếm đúng theo ngày |
| **Hạng theo gói — phần bậc gói** | **Được** | `job_daily_snapshot` lưu `tier_code` và `is_free` của từng tin từng ngày |
| **Hạng theo gói — phần thời điểm làm mới** | **KHÔNG** | `refreshed_at` bị ghi đè tại chỗ, không có bản chụp theo ngày |
| **Tin nào hợp lệ ngày đó** | Gần đúng | `job_daily_snapshot` có một dòng cho mọi tin OPEN tại thời điểm chốt ngày, kèm cờ `is_live` |

**Kết luận:** dựng lại được toàn bộ phía tương tác và phần lớn phía gói, thiếu đúng một khoá phụ là thứ tự làm mới trong cùng bậc gói. Kết quả vì thế **không trùng khít** với bảng thật, nhưng **đủ để trả lời câu hỏi cần trả lời**: biên độ dịch chuyển mỗi ngày là bao nhiêu.

### Cách làm đề xuất

1. Viết một lệnh chạy tay (script hoặc CLI) nhận vào một ngày, dựng bảng 100 tin của ngày đó theo đúng bước A–C, nhưng **đọc dữ liệu lịch sử thay vì dữ liệu hiện tại**
2. Chạy cho 5–7 ngày liên tiếp gần nhất
3. Xuất bảng so sánh: mỗi ngày bao nhiêu tin đổi chỗ · bậc dịch chuyển trung bình · bậc dịch chuyển lớn nhất · bao nhiêu tin "new"
4. **Gửi kết quả cho BA trước khi chốt giá trị mặc định của `w`**

> **Báo lại sớm nếu không làm được.** `job_daily_snapshot` chỉ bắt đầu ghi từ ngày deploy V541 và một ngày tác vụ không chạy thì không có dòng nào. Nếu production chưa đủ ngày, kiểm thử này không thực hiện được và giá trị `w` mặc định phải chọn bằng phán đoán — BA cần biết điều đó sớm chứ không phải lúc bàn giao.

---

## 5. Việc cần kiểm tra riêng — làm được ngay, không cần chờ

Trên production **toàn bộ các dòng đang hiển thị "–"** ở cột tăng/giảm, dù logic và endpoint đều đã có. Kiểm tra:

- Tác vụ `Hot100RankSnapshotJob` có đang chạy trên production không
- Bảng `hot100_rank_snapshot` có dữ liệu không
- Cờ cấu hình `svn.search.hot100-rank.enabled` có đang bật không

### Và một câu nữa, quan trọng hơn

**Trên production có gói nào thực sự khai nhịp làm mới (`refresh_policy`) chưa?**

Auto-refresh là tự động, không có nút cho khách bấm: mỗi gói mang một chính sách làm mới (`product.refresh_policy`, danh sách phase với `everyDays`), tin chụp lại chính sách đó lúc đăng vào `job.refresh_policy` + `next_refresh_at`, rồi `JobLifecycleSweepService` tự bump `refreshed_at` khi tới hạn.

Hệ quả nếu **không gói nào khai nhịp**:

- `refreshed_at` đứng yên ở ngày đăng tin
- **khoá sắp xếp số 2 ở bước A không bao giờ nhúc nhích**
- thứ hạng theo gói gần như đóng băng, và **tương tác trở thành thứ duy nhất làm bảng chuyển động**

Điều đó không làm hỏng quy tắc — ngược lại, nó làm `w` càng quan trọng. Nhưng nó đổi hoàn toàn kỳ vọng về mức biến động, và phải biết **trước** khi chọn giá trị `w` mặc định. Kiểm tra chung một lượt với mục 4.

---

## 6. Tiêu chí nghiệm thu

**Bước A — chọn tin**
- [ ] Tác vụ chạy lúc 00:01 giờ VN và ghi lại bảng của ngày
- [ ] Bảng tối đa 100 dòng; ít tin hơn thì hiển thị đúng số có, không chèn thêm
- [ ] Không công ty nào có quá 10 tin trên bảng
- [ ] Khi ít công ty đăng tin, bảng vẫn gom đủ 100 nhờ bước bù
- [ ] Tin gói thấp vẫn lên được bảng khi hôm đó ít tin gói cao

**Bước B — hạng theo tương tác**
- [ ] Điểm thô đúng công thức 1 / 3 / 5 trên cửa sổ 7 ngày
- [ ] **Tin bằng điểm nhận cùng thứ hạng** (trung bình khoảng vị trí), không xếp tuỳ ý
- [ ] Khi cả 100 tin đều 0 điểm, cả 100 tin cùng một thứ hạng
- [ ] Ngày thiếu dữ liệu trong `job_daily_snapshot` tính là 0 lượt xem, không nhảy cóc

**Bước C — trộn**
- [ ] Vị trí hiển thị khớp đúng công thức trộn theo `w`
- [ ] Khi cả 100 tin cùng hạng tương tác, thứ tự hiển thị trùng khớp hoàn toàn với hạng theo gói
- [ ] Hai tin cùng công ty được phép đứng liền kề
- [ ] Tin đăng hôm nay nằm ở nửa trên của bảng, không rơi xuống đáy
- [ ] Trọng số `w` đổi được qua cấu hình, không cần phát hành lại

**Bước D — mũi tên**
- [ ] Tin lần đầu lên bảng hiển thị "new"
- [ ] Tin rớt ra rồi quay lại hiển thị "–", không hiện "new" lần hai
- [ ] Đêm chạy đầu tiên: toàn bộ "–"
- [ ] Số bậc tăng/giảm không bao giờ vượt quá 99

**Chống gian lận**
- [ ] Mở một tin 10 lần bằng một tài khoản trong một ngày chỉ cộng 1 lượt xem
- [ ] Nhà tuyển dụng mở tin của chính mình không cộng lượt xem
- [ ] Bỏ lưu tin thì điểm giảm tương ứng ở lần tính kế tiếp

**Bộ lọc và lỗi**
- [ ] Áp bộ lọc bất kỳ → cột tăng/giảm "–" mọi dòng
- [ ] Danh sách đã lọc vẫn xếp theo bậc gói rồi thời điểm làm mới
- [ ] Tác vụ 0h lỗi → trang vẫn hiển thị bảng hôm trước, không trắng

**Dòng Gợi ý**
- [ ] Dòng Gợi ý nằm trên vị trí số 1, không có số thứ tự, không có mũi tên
- [ ] Tin được chọn là tin có điểm thô cao nhất trong 100 tin
- [ ] Khi cả 100 tin đều 0 điểm, **không vẽ dòng Gợi ý**

**Bộ lọc kinh nghiệm**
- [ ] Hai nút lọc đúng qua facet `experience` có sẵn, không thêm trường mới
- [ ] Khi đang lọc kinh nghiệm, cột tăng/giảm hiển thị "–" mọi dòng

**Cấu hình admin**
- [ ] 6 ô cấu hình đổi được, không cần phát hành lại
- [ ] Đổi số có hiệu lực từ lần chạy 0h kế tiếp, và màn hình ghi rõ điều đó
- [ ] Đặt `w = 0` thì bảng ra đúng thứ tự như production hiện nay

**Kiểm thử dữ liệu quá khứ**
- [ ] Có lệnh dựng lại bảng cho một ngày trong quá khứ
- [ ] Đã chạy cho 5–7 ngày liên tiếp và gửi BA bảng so sánh biên độ dịch chuyển

**Giới hạn khách chưa đăng nhập**
- [ ] Chưa đăng nhập: thấy 10 dòng, dưới đó là khối mời đăng nhập, không có dòng mờ nhá hàng
- [ ] Chưa đăng nhập + đang lọc: thấy 10 dòng đầu **của danh sách đã lọc**, không phải 10 dòng của bảng chung
- [ ] Chưa đăng nhập vẫn thấy ▲▼ trên 10 dòng đó
- [ ] Ngày mà mọi khách đều chỉ thấy 10 dòng, bảng lưu vẫn đủ 100 vị trí, và sáng hôm sau chỉ tin thật sự mới mới hiện "new"
- [ ] Số 10 đổi được qua cấu hình

**Khác**
- [ ] Tiêu đề trang và chú thích dấu "?" đã cập nhật

---

## 7. Ngoài phạm vi

- Bộ lọc 4 nhóm trên trang — giữ nguyên hoàn toàn
- Nội dung thẻ tin, màn hình rỗng — giữ nguyên
- Nhãn "Gợi ý" cho tin gói cao — chờ khách chốt
- Nhãn "TOP100 theo ngành nghề" như Saramin KR — không làm đợt này
- `/viec-lam/theo-khu-vuc`, `/viec-lam/theo-nganh-nghe` và các dải tin khác — không đụng

---

## 8. Câu hỏi cần BA trả lời trước khi bắt tay

**Đã chốt, không cần hỏi lại:** trọng số và điểm số chuyển thành ô cấu hình trong admin (không có "lộ trình" nào cả) · bộ 1 / 3 / 5 giữ làm mặc định · luật "new chỉ hiện một lần" CÓ áp · giữ nguyên 4 nhóm lọc đang chạy · nhãn Gợi ý gắn theo tương tác chứ không theo gói · **danh sách đã lọc giữ nguyên cách xếp hiện nay** (bậc gói rồi auto-refresh, không dùng điểm, mũi tên "–" toàn bộ) · **HOT100 KHÔNG phải trang chỉ dành cho tin trả phí** — bỏ lọc placement, làm theo requirement (phần 3.1).

**Còn lại:**

1. Tin được gắn nhãn Gợi ý có **giữ luôn dòng đánh số của nó ở dưới** không, hay được nhấc hẳn ra khỏi 100 tin?
2. Nút lọc kinh nghiệm có trạng thái **"tất cả"** không, hay luôn phải chọn một trong hai? Saramin Hàn Quốc chỉ có hai nút, nghĩa là không bao giờ xem được bảng đầy đủ — có thể đúng ở bên đó nhưng sai ở đây
3. Bao nhiêu dòng Gợi ý — 1 như hình vẽ, hay 3? Một nhãn trên một trăm dòng là rất thưa
4. **Bot tìm kiếm nhìn thấy bao nhiêu dòng?** Xem cảnh báo cloaking ở phần 3.12. Đây là câu cho chủ SEO, không phải cho dev tự quyết
5. Giới hạn 10 dòng làm lệch chính tín hiệu mà bảng này thu được: lưu lượng của nó giờ chỉ chạm tới 10 dòng đầu, nên tin ở 11–100 nhận ít lượt xem hơn **từ trang này** và hôm sau điểm thấp hơn, lại càng không lên nổi. Lượt xem đến từ tìm kiếm và các trang khác làm loãng bớt, nhưng vòng lặp này có thật — cần theo dõi khi có số liệu
6. **Có nên KHÔNG tính vào điểm những lượt xem đến từ chính trang HOT100 không?** Đây là cách cắt đứt vòng lặp ở câu 5: khi đó điểm chỉ phản ánh quan tâm đến từ tìm kiếm, trang chủ, trang chi tiết và nguồn ngoài, còn bảng không tự nuôi chính nó. Cần gắn nguồn vào sự kiện xem tin nên có thêm việc, và với `w = 0,1` thì vòng lặp cũng yếu — nên đây là câu hỏi, chưa phải quyết định
7. Câu chữ mới cho chú thích dấu "?" — BA cấp khi nào?

---

## 9. Đầu mối trong mã nguồn

**svn-be**

| Nội dung | Vị trí |
|---|---|
| Khoá sắp xếp hiện tại | `PgFtsSearchAdapter.ORDER_TIER_THEN_REFRESHED` |
| Lọc theo placement cần bỏ | `PgFtsSearchAdapter.BOARD_BAND_PREDICATE`, `JOB_LIST_TRENDING_PLACEMENT_ID` |
| Giới hạn + giãn công ty | `TopCompaniesOrder.arrange` |
| Định nghĩa section | `JobBoardSection.TRENDING_LATEST` |
| Thứ hạng hôm qua | `Hot100RankService`, `Hot100RankSnapshotJob`, V818 |
| Dữ liệu theo ngày | `job_daily_snapshot` (V541), `scrap`, `job_application` |

**svn-web**

| Nội dung | Vị trí |
|---|---|
| Màn hình | `features/jobs/hot-100/` |
| Trang | `app/[lang]/(main)/jobs/top-companies/page.tsx` |
| Logic mũi tên | `features/jobs/hot-100/lib/rank-with-change.ts` |
| Gọi thứ hạng hôm qua | `features/jobs/hot-100/lib/hot-100-rank-change.ts` |
| Câu chữ | `dictionaries/{vi,en,ko}.json` — `hotTitle`, `hotInfoDescription` |
