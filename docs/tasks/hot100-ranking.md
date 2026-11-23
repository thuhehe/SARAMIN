# 25. HOT100 — đổi cách xếp hạng trang "Công ty hàng đầu"

**Ticket:** SRM-1711 "Update logic", sub-task của **SRM-1708 [JS] Page Hot100**
**Hai sub-task anh em, KHÔNG thuộc phạm vi ticket này:** SRM-1709 (tiêu đề trang + URL) · SRM-1710 (Refine UI)
**Repo:** svn-web + svn-be · **Ưu tiên:** sau go-live 21/11/2026 *(giả định của BA, cần xác nhận)*
**Requirement:** [saramin-eta.vercel.app/m/job-management/hot100](https://saramin-eta.vercel.app/m/job-management/hot100)
**Mockup:** [Mockups ▸ js-hot100](https://saramin-eta.vercel.app/mockups)
**Tham khảo UI:** Saramin KR — [/zf_user/jobs/hot100](https://www.saramin.co.kr/zf_user/jobs/hot100)

> **Tóm lại:** trang `/viec-lam/cong-ty-hang-dau` hiện xếp theo bậc gói rồi tới thời điểm làm mới tin. Hai thứ đó gần như không đổi theo ngày, nên cột tăng/giảm mà svn-web đã vẽ sẵn luôn hiển thị "–" trên production. Ticket này giữ nguyên **nguyên tắc chọn tin theo bậc gói** — bước A gom **101 tin**, một tin được nhấc ra làm dòng "Gợi ý" nên bảng đánh số vẫn đủ 100 — và đổi cách **xếp vị trí trong 100 tin đó** thành công thức trộn: mặc định 90% theo gói, 10% theo mức ứng viên quan tâm, tính lại mỗi đêm. Tỉ lệ đó là **một ô cấu hình trong admin**, không viết cứng. Kèm theo: một dòng "Gợi ý" phía trên vị trí số 1, một bộ lọc kinh nghiệm, giới hạn 10 dòng cho khách chưa đăng nhập, và một màn hình cấu hình 6 ô.

---

## 0. Trước khi ước lượng — đọc phần này

**Không cần dựng hệ thống thu thập dữ liệu mới.** Bộ đếm lượt xem, lượt lưu, lượt ứng tuyển đều đã có; bảng chụp thứ hạng hằng ngày, tác vụ 0h và endpoint lấy thứ hạng hôm qua cũng đã có. Việc chính là **đổi khoá sắp xếp** và **thêm phần tính điểm**.

**Ba chỗ dễ làm sai nhất**, đọc kỹ trước khi code:

1. **Hạng theo gói là VỊ TRÍ — 1, 2, 3 … 100 — không phải `product.display_order`.** Bảng Posting ladder trong admin hiển thị các giá trị 300, 295, 291, 287, 280… Đó là số để xếp các bậc gói với nhau, **không phải thứ hạng**. Nhét một trong các số đó vào công thức thì phần theo gói lớn gấp mấy chục lần, phần tương tác mất hết tác dụng, và bảng im lặng cho ra đúng thứ tự như production hiện nay — **không báo lỗi, không có dấu hiệu gì**, chỉ là tính năng lặng lẽ không chạy. Hạng theo tương tác cũng vậy: là vị trí ở bước B, không phải điểm thô. Xem **ví dụ 1/3** và **2/3** ở phần 1.
2. **Tin bằng điểm tương tác phải nhận CÙNG một thứ hạng** (phần 1, bước B2). Giai đoạn đầu phần lớn tin sẽ cùng 0 điểm, nên chỗ này quyết định cả bảng.
3. **Hai quy tắc chống gian lận lượt xem phải lên cùng đợt** (phần 3.7), không để lại sau.

---

## 1. Luồng đích — hệ thống phải chạy thế nào

Tác vụ chạy **00:01 giờ Việt Nam mỗi ngày**. Bảng cố định suốt ngày hôm đó.

```
TOÀN BỘ TIN TRONG HỆ THỐNG
        │
   [A] CHỌN 101 TIN        A1 lọc → A2 sắp theo gói → A3 giới hạn công ty → A4 bù cho đủ
        │                  A5 nhấc tin Gợi ý ra, còn 100 tin đánh số
        │                  thứ tự sau bước này = HẠNG THEO GÓI
   [B] XẾP THEO TƯƠNG TÁC  B1 điểm thô → B2 xếp hạng, xử lý bằng điểm
        │                  thứ tự sau bước này = HẠNG THEO TƯƠNG TÁC
   [C] TRỘN                C1 vị trí = 0,9 × hạng theo gói + 0,1 × hạng theo tương tác
        │                  C2 giãn công ty: tin cùng công ty không đứng cạnh nhau
        │
   [D] MŨI TÊN & LƯU LẠI   so với hôm qua → lưu bảng → xử lý lỗi
```

> **BA VÍ DỤ CHẠY XUYÊN SUỐT — nếu chỉ đọc một thứ trong ticket này, đọc ba cái đó.** Cùng bốn tin **P, Q, R, S** đi qua cả ba bước, và mỗi con số ở ví dụ sau **đọc thẳng từ ví dụ trước**, không phải số chọn đại:
>
> | Ví dụ | Nằm ở | Cho ra |
> |---|---|---|
> | **1/3 — hạng theo gói** | cuối bước A | P = 5, R = 12, Q = 13, S = 20 |
> | **2/3 — hạng theo tương tác** | cuối bước B | S = 1, Q = 2, P = 60,5, R = 60,5 |
> | **3/3 — trộn hai hạng** | trong bước C | vị trí hiển thị 1, 2, 3, 4 |

### A — Chọn 101 tin, lập hạng theo gói

| Bước | Quy tắc |
|---|---|
| **A1 — lọc** | Tin đang mở và bật hiển thị · chưa hết hạn nhận hồ sơ · chưa hết hạn hiển thị · công ty đang hoạt động · công ty có mã số thuế hợp lệ (công ty nước ngoài dùng `foreign_tax_id`) |
| **A2 — sắp xếp** | 1. bậc gói trên posting ladder, cao→thấp · 2. thời điểm làm mới tin, mới→cũ · 3. tin tạo sau đứng trước (chỉ phá hoà) |
| **A3 — giới hạn công ty** | Duyệt từ trên xuống, mỗi công ty tối đa **10 tin**. Tin thứ 11 trở đi sang danh sách chờ, nhường chỗ cho công ty khác. **Gom 101 tin, không phải 100** |
| **A4 — bù cho đủ** | Chưa đủ 101 thì lấy tiếp từ danh sách chờ theo đúng thứ tự A2. Vẫn chưa đủ thì bảng hiển thị đúng số tin có |
| **A5 — nhấc tin Gợi ý ra** | Trong 101 tin đó, tin có **điểm thô cao nhất** (bước B) rời khỏi danh sách đánh số và trở thành dòng Gợi ý. 100 tin còn lại được đánh số 1…100 |

**Thứ tự sau A4 chính là hạng theo gói**, một trong hai đầu vào của bước C.

> **Hạng theo gói là SỐ THỨ TỰ DÒNG, không phải phép tính.** Sắp toàn bộ tin hợp lệ theo A2, áp A3, rồi tin rơi vào dòng nào thì hạng theo gói đúng bằng số dòng đó — dòng đầu là 1, dòng hai là 2, cho tới 101. Không cộng, không nhân, không quy đổi gì cả.
>
> **Không có hai tin nào cùng hạng theo gói.** A2 kết thúc bằng khoá phá hoà theo thời điểm tạo chính là để thứ tự luôn duy nhất. Hạng bằng nhau chỉ xuất hiện ở phía tương tác (bước B) — nên số lẻ kiểu 60,5 chỉ có ở cột đó, không bao giờ có ở cột hạng theo gói.

> **Vì sao gom 101 chứ không phải 100:** để bảng đánh số luôn đủ một trăm dòng, bất kể có dòng Gợi ý hay không. Nhấc một tin ra khỏi 100 thì bảng chỉ còn 99 dòng, và người đọc gặp lại cùng một tin hai lần nếu giữ cả hai chỗ. Không lưu lại, đêm nào cũng tính lại.

> **Không có cổng chặn tin miễn phí ở bước này.** Tin không mua gói vẫn hợp lệ, chỉ xếp cuối. Build hiện tại thì ngược lại — xem phần 3.1.

**VÍ DỤ 1/3 — hạng theo gói hình thành thế nào**

Bốn tin **P, Q, R, S** sẽ đi xuyên suốt cả ba bước trong ticket này. Đây là bước đầu. Giả sử bậc gói trên posting ladder là 300, 295, 291, 287, 280 và đêm đó có 3 tin đang mở ở bậc 300, 2 tin ở bậc 295, 4 tin ở bậc 291, 4 tin ở bậc 287, 7 tin ở bậc 280:

| Dòng | Bậc gói | Tin nào rơi vào đây | Trong cùng bậc xếp theo |
|---|---|---|---|
| 1 – 3 | 300 | — | thời điểm làm mới, mới trước |
| 4 – 5 | 295 | **P** ở dòng 5 | thời điểm làm mới |
| 6 – 9 | 291 | — | thời điểm làm mới |
| 10 – 13 | 287 | **R** ở dòng 12, **Q** ở dòng 13 | R được làm mới **gần đây hơn** Q một tiếng |
| 14 – 20 | 280 | **S** ở dòng 20 | thời điểm làm mới |

**Đọc ra hạng theo gói: P = 5, R = 12, Q = 13, S = 20.** Đúng là các con số ở cột "hạng theo gói" của bước C, và mỗi con số chỉ là một số thứ tự dòng.

**R và Q cùng một bậc gói mà vẫn lệch nhau một bậc**, vì thời điểm làm mới tách chúng ra. Đó là thứ duy nhất sắp thứ tự hai tin trong cùng một bậc — và cũng là lý do gói có nhịp làm mới nhanh hơn thì đáng tiền hơn.

**Không có phép tính nào ở đây.** Không nhân, không quy đổi. Số 287 và 300 chỉ dùng để biết bậc nào đứng trước bậc nào, xong là thôi.

### B — Lập hạng theo tương tác

**B1 — điểm thô**, trong 7 ngày gần nhất tính tới hết ngày hôm qua:

```
điểm thô = (lượt xem hợp lệ × 1) + (lượt lưu còn hiệu lực × 3) + (lượt ứng tuyển còn hiệu lực × 5)
```

**B1 chạy cho cả 101 tin** gom ở bước A — A5 cần điểm thô của mọi tin mới biết nhấc tin nào ra làm dòng Gợi ý. **B2 chỉ xếp hạng 100 tin còn lại**, sau khi đã nhấc tin đó ra.

**B2 — xếp hạng.** Sắp 100 tin còn lại theo điểm thô giảm dần, đánh số 1…100.

**Tin bằng điểm nhận cùng một thứ hạng**, bằng trung bình của khoảng vị trí mà nhóm đó chiếm.

> Ví dụ: 20 tin có điểm nhận hạng 1…20. 80 tin còn lại cùng 0 điểm, cùng chiếm khoảng vị trí 21…100, nên **cả 80 tin đều nhận hạng 60,5**.
>
> Nếu xếp tin bằng điểm theo thứ tự tuỳ ý, hai tin giống hệt nhau sẽ nhận hạng 21 và 100 — chênh 79 bậc dựng ra từ hư không, nhân 0,1 thành lệch 8 bậc trên bảng thật.

Cửa sổ 7 ngày chính là cơ chế làm mượt rồi (mỗi ngày chỉ thay 1/7 dữ liệu). **Không thêm công thức làm mượt nào khác**, và **không lưu điểm** — điểm thô luôn tính lại được từ dữ liệu gốc.

**VÍ DỤ 2/3 — hạng theo tương tác hình thành thế nào**

Vẫn bốn tin đó, sang bước hai. Điểm thô là tổng 7 ngày, mỗi lượt xem 1 điểm, mỗi lượt lưu 3, mỗi lượt ứng tuyển 5. Giả sử tuần đó có 20 trong 100 tin có điểm, 80 tin còn lại không có điểm nào — đúng hình dạng bình thường của bảng trong những tháng đầu:

| Tin | Lượt xem | Lượt lưu | Lượt ứng tuyển | Điểm thô | Hạng tương tác |
|---|---|---|---|---|---|
| **S** | 180 | 20 | 9 | 180 + 60 + 45 = **285** | 1 |
| **Q** | 150 | 14 | 6 | 150 + 42 + 30 = **222** | 2 |
| 18 tin khác có điểm | … | … | … | 221 xuống 1 | 3 … 20 |
| **P**, **R** và 78 tin nữa | 0 | 0 | 0 | **0** | **60,5** — tất cả |

**Đọc ra hạng theo tương tác: S = 1, Q = 2, P = 60,5, R = 60,5.** Đúng là các con số ở cột "hạng theo tương tác" của bước C.

**Số 60,5 ở đâu ra:** 80 tin cùng 0 điểm chiếm chung khoảng vị trí 21 đến 100. Trung bình của khoảng đó là (21 + 100) / 2 = 60,5, và cả 80 tin đều nhận số này. Không ai nhập con số đó vào đâu cả.

**P và R không có điểm nào mà vẫn ở trên bảng**, vì bước A đưa chúng vào theo gói chứ không theo mức được quan tâm. Giai đoạn đầu đó là chuyện bình thường — và cũng chính là lý do trọng số gói để 0,9.

### C — Trộn, ra vị trí hiển thị

```
vị trí = ((1 − w) × hạng theo gói) + (w × hạng theo tương tác)
```

`w` là **trọng số tương tác**, một số từ 0 đến 1 do admin đặt, **mặc định 0,1**. Trọng số gói là phần còn lại, hệ thống tự suy ra.

Sắp **tăng dần**, số nhỏ hơn đứng trước. Bằng nhau thì hạng theo gói nhỏ hơn đứng trước.

Sau khi có thứ tự này còn **một bước cuối: giãn công ty** — xem mục 3.3. Bước đó chỉ đẩy tin cùng công ty ra khỏi hai dòng liền nhau, không xáo trộn gì thêm.

**VÍ DỤ 3/3 — trộn hai hạng lại.** Hai cột hạng dưới đây **đọc thẳng từ ví dụ 1 và ví dụ 2**, không phải số chọn đại:

| Tin | Hạng theo gói | Hạng theo tương tác | Điểm vị trí | Hiển thị ở |
|---|---|---|---|---|
| P | 5 | 60,5 | 4,5 + 6,05 = 10,55 | 1 |
| Q | 13 | 2 | 11,7 + 0,2 = 11,90 | 2 |
| R | 12 | 60,5 | 10,8 + 6,05 = 16,85 | 3 |
| S | 20 | 1 | 18 + 0,1 = 18,10 | 4 |

**Đọc Q với R** — đây đúng là thứ tính năng này sinh ra để làm: R có **hạng gói tốt hơn** (12 so với 13, cùng bậc nhưng được làm mới gần đây hơn một tiếng) mà vẫn tụt xuống dưới Q, vì ứng viên quan tâm tới Q còn R thì không. Một bậc hạng gói đáng 0,9 điểm; khoảng cách giữa hạng tương tác tốt nhất và tệ nhất đáng khoảng 9,9 điểm.

**Đọc S với P:** S được quan tâm nhất cả bảng mà vẫn không vượt nổi P — P đứng trên nó **15 bậc** hạng gói, trong khi tương tác chỉ mua được khoảng 10 bậc. Gói vẫn là yếu tố chính.

**Admin nhập một số, không phải hai.** Hai ô riêng có thể bị đặt thành tổng khác 1 và không chỗ nào trên màn hình báo điều đó.

**`w = 0` tắt phần tương tác — KHÔNG phải nút hoàn tác cả ticket.** Đặt về 0 thì vị trí quay về đúng thứ tự của bước A, đổi một ô, không cần phát hành lại.

Nhưng bảng vẫn **không** giống production hiện nay, vì ticket này còn bỏ lọc placement (3.1), nhấc tin Gợi ý ra (A5) và đổi cách giãn công ty (3.3). Ba thứ đó không có công tắc; muốn gỡ phải phát hành lại.

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
| **Requirement** | Không có khái niệm placement. Lấy tất cả tin hợp lệ, sắp theo bậc posting ladder, cắt lấy 101 tin đầu |
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
| **Cần làm** | Áp ngay ở bước A3, trước khi cắt lấy 101 tin, kèm bước bù A4 |

### 3.3 GIỮ quy tắc giãn công ty, và thêm điều kiện nới luật

> **ĐỔI QUYẾT ĐỊNH 23/11/2026.** Phần này trước đây ghi *gỡ hẳn phần giãn công ty*. Khách chốt lại: HOT 100 áp **đúng luật 10% như các section trên ba trang Jobs**, đủ cả ba vế. Mọi chỗ khác trong tài liệu nói hai tin cùng công ty được đứng liền kề đều đã sửa theo.

| | |
|---|---|
| **Build** | `TopCompaniesOrder.arrange` có cả hai phần: đếm giới hạn, và xáo trộn để hai tin liền kề không cùng công ty |
| **Cần làm** | Giữ cả hai phần. Phần đếm chuyển lên A3 theo mục 3.2; phần giãn chạy ở cuối bước C, trên bảng đã xếp theo điểm |

**Luật 10% — ba vế, áp đủ:**

| Vế | Nội dung |
|---|---|
| **1 — Trần** | Trong số tin cùng hiện một lúc, mỗi công ty nhiều nhất **10%**, thấp nhất **1 tin**. Bảng 100 dòng nên trần là **10 tin** |
| **2 — Giãn** | Tin của cùng một công ty **không đứng cạnh nhau** |
| **3 — Nới** | Không đủ công ty khác để xen vào thì **bỏ luật, hiện hết**. Không bỏ tin nào ra và không để bảng thiếu dòng |

> **Vế 2 làm vị trí lệch khỏi thứ tự điểm — đây là cái giá, không phải lỗi.** Bước C cho ra một thứ tự chính xác theo điểm. Hai tin cùng công ty rơi vào hai dòng liền nhau thì phải đẩy một tin đi, nên vị trí hiển thị không còn trùng khít với thứ tự điểm.

> **Cách làm: đẩy xuống, KHÔNG xáo ngẫu nhiên.** Duyệt bảng từ trên xuống theo thứ tự điểm. Tin nào rơi ngay dưới một tin cùng công ty thì đổi chỗ với tin hợp lệ gần nhất phía dưới. Giữ nguyên thứ tự điểm ở mọi chỗ không vi phạm. Build đang xáo ngẫu nhiên — **cách đó không dùng được ở đây**: bảng này có số thứ tự và mũi tên, nên chạy lại trên cùng dữ liệu phải ra **đúng cùng một bảng**.

> **Mũi tên tính trên vị trí SAU khi giãn**, tức vị trí người đọc nhìn thấy, không phải thứ tự điểm trước khi giãn. Nếu không thì mũi tên nói về một bảng không ai thấy.

> **Vế 3 là lý do không được dựng luật này thành điều kiện cứng.** Bảng phải luôn đủ dòng. Khi hàng chỉ còn một hai công ty thì giãn tới đâu hay tới đó, rồi hiện hết phần còn lại theo thứ tự điểm.

### 3.4 Đổi khoá sắp xếp vị trí

| | |
|---|---|
| **Build** | `ORDER_TIER_THEN_REFRESHED` — bậc gói rồi thời điểm làm mới |
| **Cần đổi thành** | Công thức trộn ở bước C |

### 3.5 Thêm phần tính điểm và xếp hạng theo tương tác

Logic mới hoàn toàn (bước B). Chạy trong tác vụ 00:01: **tính điểm cho cả 101 tin** gom ở bước A, rồi **xếp hạng 100 tin còn lại** sau khi A5 nhấc tin Gợi ý ra. **Bắt buộc xử lý đúng trường hợp bằng điểm.**

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
| Chú thích dấu "?" | Mô tả bảng dựa trên lượt xem và lượt lưu, tổng hợp 30 phút từ 0 giờ | **Câu chữ mới bên dưới** |

Khoá trong `dictionaries/vi.json`, `en.json`, `ko.json`: `hotInfoDescription`.

> **Tiêu đề trang (`hotTitle`) và URL KHÔNG thuộc ticket này** — đó là việc của **SRM-1709**. Đừng sửa `hotTitle` ở đây, hai ticket đụng nhau một khoá là chắc chắn có người ghi đè người kia.

**ĐÃ CHỐT 20/11/2026 — câu chữ mới cho `hotInfoDescription`**, copy thẳng vào dictionaries:

**vi**

```
Bảng 100 tin tuyển dụng nổi bật, chốt mỗi ngày lúc 0h.
Thứ hạng có tính đến lượt xem, lượt lưu và lượt ứng tuyển trong 7 ngày gần nhất.
▲▼ so với hôm qua · "new" là tin lần đầu vào bảng.
```

**en**

```
100 standout job postings, fixed once a day at midnight.
Ranking takes into account views, saves and applications from the past 7 days.
▲▼ is the change since yesterday · "new" means a first appearance on the chart.
```

**ko**

```
매일 자정에 확정되는 주목할 만한 채용공고 100선입니다.
순위는 최근 7일간의 조회수·스크랩수·지원수를 반영합니다.
▲▼는 어제 대비 변동이며, "new"는 처음 차트에 진입한 공고입니다.
```

> **KHÔNG được viết "thứ hạng dựa trên lượt xem và lượt lưu"** ở bất kỳ ngôn ngữ nào. Đó đúng là câu đang sai mà ticket này sinh ra để sửa: nó nói hai trong ba tín hiệu tương tác **là cơ sở** xếp hạng, trong khi xếp hạng 90% theo gói. Thêm lượt ứng tuyển vào câu đó cũng không cứu được — vẫn là lời hứa mà bảng không giữ, và ứng viên đầu tiên đi kiểm sẽ thấy tin ít lượt xem hơn đứng cao hơn.
>
> Cụm gánh việc là **"có tính đến"** — đúng sự thật, và không khẳng định đó là những yếu tố duy nhất. Tooltip cố tình **không nhắc tới gói dịch vụ** và **không nhắc giới hạn 10 dòng** (khối mời đăng nhập đã nói rồi).

### 3.9 THÊM một vị trí "Gợi ý" phía trên dòng số 1

Một dòng **nằm trên vị trí số 1**, mang nhãn "Gợi ý", **không có số thứ tự** và **không có mũi tên** — vì nó không phải một vị trí trên bảng.

| Câu hỏi | Quy tắc |
|---|---|
| Tin nào được chọn | Tin có **điểm thô cao nhất** trong 101 tin gom ở bước A. Bằng điểm thì tin có hạng theo gói tốt hơn được chọn |
| Khi không tin nào có điểm | **Không vẽ dòng này**. Gắn nhãn "Gợi ý" cho một tin không ai mở thì nhãn mất nghĩa ngay tuần đầu — mà giai đoạn đầu phần lớn tin sẽ 0 điểm |
| Tính lúc nào | Ngay sau bước B, trong cùng tác vụ 0h. Không giữ lại từ hôm qua |
| Bao nhiêu dòng | **Đúng 1 dòng**, như Saramin KR. Không phải tham số cấu hình |

> **Nhãn này nghĩa là "ứng viên thích tin này", KHÔNG phải "tin trả phí cao".** Đây là một ngã rẽ thiết kế đã được chốt: bản đề xuất ban đầu định dùng nhãn để thể hiện giá trị thương mại, khách hàng chọn hướng ngược lại. Đừng âm thầm đổi nó thành nhãn theo gói.
>
> Dòng này là **phần duy nhất của trang thuần theo tương tác**. Mọi dòng bên dưới nó là 90% theo gói.

**ĐÃ CHỐT 19/11/2026:** tin được chọn **không** giữ dòng đánh số ở dưới. Bước A gom 101 tin và nhấc tin này ra, nên bảng đánh số vẫn đủ 100 dòng. Người đọc không bao giờ gặp cùng một tin hai lần.

### 3.10 THÊM bộ lọc kinh nghiệm

Hai nút: **Chưa có kinh nghiệm** / **Đã có kinh nghiệm**, đặt dưới lưới chọn ngành nghề, **không phải một tab** như 4 nhóm kia.

| | |
|---|---|
| **Dùng lại cái gì** | Facet `experience` svn-be đã phục vụ sẵn — `entry` cho tin không đòi kinh nghiệm, `experienced` cho tin có đòi. **Không cần thêm trường mới** |
| **Hành vi** | Giống mọi bộ lọc khác: truy vấn lại trên toàn bộ tin hợp lệ, xếp theo bậc gói rồi thời điểm làm mới, và **cột tăng/giảm hiển thị "–" mọi dòng** |

**ĐÃ CHỐT 19/11/2026: KHÔNG có trạng thái "tất cả"** — luôn phải chọn một trong hai, giống Saramin KR. Nghĩa là người xem không bao giờ thấy bảng đầy đủ không lọc kinh nghiệm.

### 3.11 THÊM màn hình cấu hình trong admin — 6 ô, một màn hình

**Không số nào trong ticket này được viết cứng trong code.** Đây là các cần gạt mà vận hành sẽ chỉnh khi có lưu lượng thật, và cả sáu số đều sẽ sai ở lần đoán đầu tiên.

| Ô | Mặc định | Chỉnh nó thì sao |
|---|---|---|
| Trọng số tương tác `w` | 0,1 | Tin dịch xa khỏi vị trí theo gói bao nhiêu — khoảng 11 bậc ở mức 0,1. **Không phải `w × 100`**, xem bảng dưới. **0 = tắt hẳn quy tắc mới** |
| Điểm mỗi lượt xem | 1 | Nâng/hạ trọng lượng của sự tò mò |
| Điểm mỗi lượt lưu | 3 | Nếu lượt lưu không nói lên gì ở thị trường này thì hạ xuống 2 |
| Điểm mỗi lượt ứng tuyển | 5 | Nếu ứng tuyển là tín hiệu thật duy nhất thì nâng lên 10 |
| Số ngày của cửa sổ tính điểm | 7 | Ngắn thì phản ứng nhanh và nhảy mạnh; dài thì êm và chậm |
| Số dòng cho khách chưa đăng nhập | 10 | Khách vãng lai xem được bao nhiêu dòng trước khi bị mời đăng nhập. Tăng lên là đánh đổi lượt đăng ký lấy độ phủ |

**Biên độ KHÔNG tỉ lệ thuận với `w`.** Một tin dịch tối đa `99w / (1 − w)` bậc — nâng `w` thì đồng thời làm một bậc hạng gói bớt giá trị, nên mẫu số chạy ngược lại:

| `w` | Phép tính | Dịch tối đa |
|---|---|---|
| 0,1 | 9,9 / 0,9 | **~11 bậc** |
| 0,2 | 19,8 / 0,8 | **~25 bậc** |
| 0,3 | 29,7 / 0,7 | **~42 bậc** |
| 0,4 | 39,6 / 0,6 | **~66 bậc** |
| 0,5 | 49,5 / 0,5 | **~99 bậc** — mọi tin tới được mọi vị trí, thứ tự theo gói mất hiệu lực hoàn toàn |

> **Đây là trần, không phải mức dịch chuyển mỗi ngày.** Nó là khoảng cách giữa hạng tương tác tốt nhất và tệ nhất, nên một tin chỉ đi hết chừng đó nếu nó rơi từ tin được quan tâm nhất bảng xuống tin ít nhất. Cửa sổ 7 ngày khiến tin thật chỉ xê dịch vài bậc mỗi ngày.

Số dòng Gợi ý **không** phải ô cấu hình — cố định 1 dòng.

Ô cuối bảng — số dòng cho khách chưa đăng nhập — xem phần 3.12.

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

**ĐÃ CHỐT 19/11/2026: BA đã hỏi khách và khách giao lại cho bên mình quyết — đây là quyết định kỹ thuật.** Người làm ticket này cũng là người làm task SEO, nên chọn một trong ba hướng rồi **báo lại BA biết đã chọn hướng nào**, đừng chọn im lặng.

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
- [ ] Công thức dùng **vị trí 1…100**, không dùng `product.display_order`. Kiểm bằng cách: đặt `w = 1` (thuần tương tác) thì bảng phải xếp đúng theo thứ hạng tương tác — nếu vẫn gần giống thứ tự theo gói thì đã nhét nhầm số
- [ ] Không hai tin nào có cùng hạng theo gói — thứ tự ở bước A luôn là duy nhất
- [ ] Khi cả 100 tin cùng hạng tương tác, thứ tự hiển thị trùng khớp hoàn toàn với hạng theo gói
- [ ] Hai tin cùng công ty **không đứng cạnh nhau**, khi hàng còn đủ công ty khác để xen vào
- [ ] Khi gần như chỉ còn một công ty, bảng **hiện hết** và chấp nhận hai tin cùng công ty đứng cạnh nhau — không bỏ tin nào và không để thiếu dòng
- [ ] Chạy lại tác vụ trên cùng dữ liệu cho ra **đúng cùng một bảng** — phần giãn không được dùng ngẫu nhiên
- [ ] Mũi tên tính trên vị trí sau khi giãn, không phải thứ tự điểm trước khi giãn
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
- [ ] Tin được chọn là tin có điểm thô cao nhất trong **101 tin** gom ở bước A
- [ ] Khi cả 101 tin đều 0 điểm, **không vẽ dòng Gợi ý**
- [ ] **Đúng 1 dòng Gợi ý**, không phải 3, và không để thành ô cấu hình
- [ ] Tin ở dòng Gợi ý **không xuất hiện lần thứ hai** trong bảng đánh số, và bảng vẫn đủ 100 dòng

**Bộ lọc kinh nghiệm**
- [ ] Hai nút lọc đúng qua facet `experience` có sẵn, không thêm trường mới
- [ ] **Không có trạng thái "tất cả"** — luôn một trong hai đang bật, kể cả lúc vừa vào trang
- [ ] Khi đang lọc kinh nghiệm, cột tăng/giảm hiển thị "–" mọi dòng

**Cấu hình admin**
- [ ] 6 ô cấu hình đổi được, không cần phát hành lại
- [ ] Đổi số có hiệu lực từ lần chạy 0h kế tiếp, và màn hình ghi rõ điều đó
- [ ] Đặt `w = 0` thì bảng ra đúng thứ tự của bước A — bậc gói, rồi thời điểm làm mới, đã áp giới hạn 10 tin/công ty. Tin Gợi ý vẫn được nhấc ra như thường, vì A5 không đọc `w`; phần giãn công ty vẫn chạy, vì vế 2 không đọc `w`
- [ ] Biên độ khớp bảng ở phần 3.11: đặt `w = 0,2` thì tin dịch tối đa ~25 bậc, không phải ~20

**Kiểm thử dữ liệu quá khứ**
- [ ] Có lệnh dựng lại bảng cho một ngày trong quá khứ
- [ ] Đã chạy cho 5–7 ngày liên tiếp và gửi BA bảng so sánh biên độ dịch chuyển

**Giới hạn khách chưa đăng nhập**
- [ ] Chưa đăng nhập: thấy 10 dòng, dưới đó là khối mời đăng nhập, không có dòng mờ nhá hàng
- [ ] Chưa đăng nhập + đang lọc: thấy 10 dòng đầu **của danh sách đã lọc**, không phải 10 dòng của bảng chung
- [ ] Chưa đăng nhập vẫn thấy ▲▼ trên 10 dòng đó
- [ ] Ngày mà mọi khách đều chỉ thấy 10 dòng, bảng lưu vẫn đủ 100 vị trí, và sáng hôm sau chỉ tin thật sự mới mới hiện "new"
- [ ] Số 10 đổi được qua cấu hình

**Khác** *(tiêu đề trang: xem SRM-1709)*
- [ ] `hotInfoDescription` dùng đúng câu chữ đã chốt ở phần 3.8, cả ba ngôn ngữ
- [ ] Không ngôn ngữ nào còn câu "thứ hạng dựa trên lượt xem và lượt lưu"

---

## 7. Ngoài phạm vi

- Bộ lọc 4 nhóm trên trang — giữ nguyên hoàn toàn
- Nội dung thẻ tin, màn hình rỗng — giữ nguyên
- Nhãn "Gợi ý" gắn theo gói — **đã loại**, khách chốt gắn theo tương tác (phần 3.9)
- Nhãn "TOP100 theo ngành nghề" như Saramin KR — không làm đợt này
- `/viec-lam/theo-khu-vuc`, `/viec-lam/theo-nganh-nghe` và các dải tin khác — không đụng

---

## 8. Câu hỏi cần BA trả lời trước khi bắt tay

**Đã chốt, không cần hỏi lại:** trọng số và điểm số chuyển thành ô cấu hình trong admin (không có "lộ trình" nào cả) · bộ 1 / 3 / 5 giữ làm mặc định · luật "new chỉ hiện một lần" CÓ áp · giữ nguyên 4 nhóm lọc đang chạy · nhãn Gợi ý gắn theo tương tác chứ không theo gói · **danh sách đã lọc giữ nguyên cách xếp hiện nay** (bậc gói rồi auto-refresh, không dùng điểm, mũi tên "–" toàn bộ) · **HOT100 KHÔNG phải trang chỉ dành cho tin trả phí** — bỏ lọc placement, làm theo requirement (phần 3.1) · **bước A gom 101 tin**, tin Gợi ý được nhấc ra nên bảng đánh số vẫn đủ 100 · **đúng 1 dòng Gợi ý** · **nút lọc kinh nghiệm KHÔNG có trạng thái "tất cả"** · **câu hỏi SEO khách giao lại cho bên mình quyết** (phần 3.12) · **câu chữ mới cho chú thích dấu "?"** đã có, nằm ở phần 3.8 · **luật 10% ba vế** — trần 10%/thấp nhất 1 tin, không đứng cạnh nhau, thiếu công ty thì nới ra và hiện hết (chốt 23/11, thay cho quyết định bỏ giãn công ty) · **sửa tiêu chí nghiệm thu `w = 0`** theo đề xuất của dev, khách trả lời "ok" trên SRM-1708 ngày 20/11 · **giữ hai bước và giữ `w = 0,1`** — chấm điểm một lượt trên toàn bộ tin, và `w = 1`, đều đã cân nhắc và bác ngày 20/11.

**Còn lại:**

1. **Bot tìm kiếm nhìn thấy bao nhiêu dòng?** Xem cảnh báo cloaking ở phần 3.12. **Đây là việc của Thương**, vì Thương cũng là người làm task SEO — chọn một trong ba hướng rồi báo lại BA biết đã chọn hướng nào
2. Giới hạn 10 dòng làm lệch chính tín hiệu mà bảng này thu được: lưu lượng của nó giờ chỉ chạm tới 10 dòng đầu, nên tin ở 11–100 nhận ít lượt xem hơn **từ trang này** và hôm sau điểm thấp hơn, lại càng không lên nổi. Lượt xem đến từ tìm kiếm và các trang khác làm loãng bớt, nhưng vòng lặp này có thật — cần theo dõi khi có số liệu
3. **Có nên KHÔNG tính vào điểm những lượt xem đến từ chính trang HOT100 không?** Đây là cách cắt đứt vòng lặp ở câu 2: khi đó điểm chỉ phản ánh quan tâm đến từ tìm kiếm, trang chủ, trang chi tiết và nguồn ngoài, còn bảng không tự nuôi chính nó. Cần gắn nguồn vào sự kiện xem tin nên có thêm việc, và với `w = 0,1` thì vòng lặp cũng yếu — nên đây là câu hỏi, chưa phải quyết định

---

## 9. Đầu mối trong mã nguồn

**svn-be**

| Nội dung | Vị trí |
|---|---|
| Khoá sắp xếp hiện tại | `PgFtsSearchAdapter.ORDER_TIER_THEN_REFRESHED` |
| Lọc theo placement cần bỏ | `PgFtsSearchAdapter.BOARD_BAND_PREDICATE`, `JOB_LIST_TRENDING_PLACEMENT_ID` |
| Giới hạn + giãn công ty | `TopCompaniesOrder.arrange` — giữ cả hai phần, nhưng phần giãn phải đổi từ xáo ngẫu nhiên sang đẩy xuống theo thứ tự điểm (mục 3.3) |
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
