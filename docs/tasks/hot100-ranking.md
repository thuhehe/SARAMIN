# 25. HOT100 — đổi cách xếp hạng trang "Công ty hàng đầu"

**Repo:** svn-web + svn-be · **Ưu tiên:** sau go-live 21/11/2026 *(giả định của BA, cần xác nhận)*
**Requirement:** [saramin-eta.vercel.app/m/job-management/hot100](https://saramin-eta.vercel.app/m/job-management/hot100)
**Mockup:** [Mockups ▸ js-hot100](https://saramin-eta.vercel.app/mockups)
**Tham khảo UI:** Saramin KR — [/zf_user/jobs/hot100](https://www.saramin.co.kr/zf_user/jobs/hot100)

> **Tóm lại:** trang `/viec-lam/cong-ty-hang-dau` hiện xếp theo bậc gói rồi tới thời điểm làm mới tin. Hai thứ đó gần như không đổi theo ngày, nên cột tăng/giảm mà svn-web đã vẽ sẵn luôn hiển thị "–" trên production. Ticket này giữ nguyên cách **chọn ra 100 tin**, và đổi cách **xếp vị trí trong 100 tin đó** thành công thức trộn: 90% theo gói, 10% theo mức ứng viên quan tâm, tính lại mỗi đêm.

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
vị trí = (0,9 × hạng theo gói) + (0,1 × hạng theo tương tác)
```

Sắp **tăng dần**, số nhỏ hơn đứng trước. Bằng nhau thì hạng theo gói nhỏ hơn đứng trước. **Không có bước xáo trộn nào sau đây.**

| Tin | Hạng theo gói | Hạng theo tương tác | Điểm vị trí | Hiển thị ở |
|---|---|---|---|---|
| P | 5 | 60,5 | 4,5 + 6,05 = 10,55 | 1 |
| Q | 12 | 2 | 10,8 + 0,2 = 11,00 | 2 |
| R | 12 | 60,5 | 10,8 + 6,05 = 16,85 | 3 |
| S | 20 | 1 | 18 + 0,1 = 18,10 | 4 |

Hai trọng số **phải nằm trong cấu hình** — khách hàng có thể đổi sang 0,7/0,3 rồi 0,5/0,5 mà không cần phát hành lại.

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
| Tác vụ 0h | `Hot100RankSnapshotJob`, cron `0 1 0 * * *` giờ VN | Dùng lại |
| Endpoint thứ hạng hôm qua | `GET /api/{lang}/jobs/hot100/previous-ranks` | Dùng lại |
| Logic mũi tên phía FE | `features/jobs/hot-100/lib/rank-with-change.ts` | Cần thêm nhãn "new" |
| Lượt xem theo ngày | `job_daily_snapshot` (V541) — ghi tổng luỹ kế của **mọi tin đang mở** mỗi ngày | Lượt xem 1 ngày = hiệu hai ngày liên tiếp |
| Lượt lưu | bảng `scrap`, có `scrapped_at`; `job.save_count` đồng bộ bằng trigger (V440) | Đếm trực tiếp theo ngày |
| Lượt ứng tuyển | bảng `job_application`; `job.apply_count` (V5, V166) | Đếm trực tiếp theo ngày |

**Lưu ý khi tính lượt xem:** nếu một ngày không có dòng nào trong `job_daily_snapshot` (tác vụ không chạy hôm đó) thì coi ngày đó **0 lượt xem**, không được lấy hiệu nhảy cóc qua hai ngày.

---

## 3. TÁM ĐIỂM CẦN THAY ĐỔI

### 3.1 Bỏ lọc theo placement

| | |
|---|---|
| **Build** | Lọc theo placement `placement_mega_menu_page_job_list_trending`. Tin không có gói được tick vị trí này thì không bao giờ lên trang |
| **Requirement** | Không có khái niệm placement. Lấy tất cả tin hợp lệ, sắp theo bậc posting ladder, cắt lấy 100 tin đầu |
| **Cần làm** | Bỏ điều kiện lọc placement cho section này. Chuyển posting ladder từ vai trò *lọc* sang vai trò *sắp xếp để chọn* |

> Thay đổi này vào build ngày 22/09/2026, commit `6d9697723` — *"the two board strips are sold, not inferred from rank"*. Requirement chưa bao giờ cập nhật theo. **BA xác nhận giữ theo requirement.** Nếu khách hàng đổi ý thì đây là chỗ sửa lại.

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

---

## 4. Việc cần kiểm tra riêng — làm được ngay, không cần chờ

Trên production **toàn bộ các dòng đang hiển thị "–"** ở cột tăng/giảm, dù logic và endpoint đều đã có. Kiểm tra:

- Tác vụ `Hot100RankSnapshotJob` có đang chạy trên production không
- Bảng `hot100_rank_snapshot` có dữ liệu không
- Cờ cấu hình `svn.search.hot100-rank.enabled` có đang bật không

---

## 5. Tiêu chí nghiệm thu

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
- [ ] Vị trí hiển thị khớp đúng công thức 0,9 / 0,1
- [ ] Khi cả 100 tin cùng hạng tương tác, thứ tự hiển thị trùng khớp hoàn toàn với hạng theo gói
- [ ] Hai tin cùng công ty được phép đứng liền kề
- [ ] Tin đăng hôm nay nằm ở nửa trên của bảng, không rơi xuống đáy
- [ ] Hai trọng số đổi được qua cấu hình, không cần phát hành lại

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

**Khác**
- [ ] Tiêu đề trang và chú thích dấu "?" đã cập nhật

---

## 6. Ngoài phạm vi

- Bộ lọc 4 nhóm trên trang — giữ nguyên hoàn toàn
- Nội dung thẻ tin, màn hình rỗng — giữ nguyên
- Nhãn "Gợi ý" cho tin gói cao — chờ khách chốt
- Nhãn "TOP100 theo ngành nghề" như Saramin KR — không làm đợt này
- `/viec-lam/theo-khu-vuc`, `/viec-lam/theo-nganh-nghe` và các dải tin khác — không đụng

---

## 7. Câu hỏi cần BA trả lời trước khi bắt tay

1. HOT100 có phải trang **chỉ dành cho tin trả phí** không? Requirement nói không, build nói có (phần 3.1). Câu trả lời đổi luôn câu bán hàng
2. Có lộ trình tăng trọng số tương tác (0,9/0,1 → 0,7/0,3 → 0,5/0,5) không?
3. Trọng số 1 / 3 / 5 và cửa sổ 7 ngày đã chốt chưa?
4. Luật "new chỉ hiện một lần" có áp không?
5. Danh sách đã lọc giữ cách xếp hiện nay, hay lọc trong 100 tin của bảng chính?
6. Câu chữ mới cho chú thích dấu "?" — BA cấp khi nào?

---

## 8. Đầu mối trong mã nguồn

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
