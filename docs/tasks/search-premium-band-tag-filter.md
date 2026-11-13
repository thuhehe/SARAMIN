# [JS][Search] Dải Premium: hàng tag lọc card trong dải (company tag)

**Module:** Job management · **Site:** Jobseeker (svn-web) + svn-be · **Loại:** BE trước, FE sau
**Mockup (source of truth cho UI + hành vi):** https://claude.ai/artifact/SKfqu7LySEraceQ5oSsz9g
**Mockup phía admin:** https://claude.ai/artifact/Czeaekg1FjX1PKmnV6szc4
**Tham khảo:** Saramin KR — dải "쉿! 회원님에게만 알려주는 공고" trên `/zf_user/search`, hàng chip ngay dưới tiêu đề dải.
**Phụ thuộc:** task 1 và task 2 phải xong và **phải có dữ liệu thật** — không có công ty nào chọn Search tag thì task này không có gì để hiện.

> **BẢN NÀY VIẾT LẠI TOÀN BỘ.** Bản trước mô tả phương án `companyHighlightId` + facet đếm theo tag; phương án đó đã bị thay. Đừng đọc lại lịch sử của ticket.


## Màn hình

**Một khách Premium — 20 tin, 6 tag, mỗi tag 10 card.** Dải chèn sau dòng kết quả thứ 3.

![Dải Premium, một khách Premium](https://saramin-eta.vercel.app/tickets/srm-1497/search-1-company.jpg)

**Hàng tag phóng to.** Tag đầu chọn sẵn, không tag nào có số đếm, 3 card một lượt, mũi tên lật 3.

![Hàng tag](https://saramin-eta.vercel.app/tickets/srm-1497/tag-row.jpg)

**Ba khách Premium — 33 tin, 8 tag.** Cùng bộ luật, không sửa dòng code nào: hàng tag lúc này lọc thật, mỗi tag ra một nhóm công ty khác nhau, và số card mỗi tag không còn đều nhau.

![Dải Premium, ba khách Premium](https://saramin-eta.vercel.app/tickets/srm-1497/search-3-companies.jpg)

**Các con số phía sau**, tính cho tình huống ba khách: 8 tag, tag chỉ lọc được 9 tin chỉ có 9 card, tag chỉ lọc được 4 tin chỉ có 4 card, và 24 ô ở khung nhìn đầu là 24 tin khác nhau.

![Bảng số liệu](https://saramin-eta.vercel.app/tickets/srm-1497/readout.jpg)

---

## 0. Bối cảnh — đọc trước khi code

Dải Premium trên `/search` **đã chạy**: svn-be V486, FE `features/jobs/search/ui/premium-jobs-band.tsx`, chèn sau 3 dòng kết quả đầu, chỉ ở trang 1, 10 card xem 3 card một lượt. svn-be quyết định thành viên và thứ tự; FE không sắp xếp và không lọc gì.

Việc của task này: thêm **một hàng tag ngay dưới tiêu đề dải**, bấm vào một tag thì dải đổi sang một nhóm tin khác.

**Nguồn tag là company tag** (`company_search_tag`, từ task 2). Không dùng job card tag, không dùng trường của job (ngành nghề, địa điểm, cấp bậc) — những trường đó không có icon, mà icon là một phần của thiết kế hàng tag.

### Điều Dev phải hiểu trước khi đọc luật

Tag là **thuộc tính của công ty**, không phải của tin. Nên khi dải chỉ có **một** công ty Premium, mọi tag đều phủ 100% số tin — bấm tag nào cũng ra đúng tập tin đó. Đây là tình huống của Saramin VN trong vài tháng tới và **đã được chấp nhận**.

Luật ở mục 2 được thiết kế để sống với điều đó: hàng tag làm dải trông phong phú hơn ngay từ bây giờ bằng cách **chia tin ra cho các tag**, và tự trở thành bộ lọc thật khi có khách Premium thứ hai, **không sửa một dòng code nào**.

---

## 1. Task 3a — svn-be: dải Premium trả về cấu trúc đã chia sẵn

svn-be tiếp tục sở hữu toàn bộ logic của dải, đúng như hôm nay. Nó chia bài một lần rồi trả ra cấu trúc hoàn chỉnh; FE chỉ vẽ.

### Response

`GET /api/{lang}/jobs/search?...&premiumOnly=true` đổi từ danh sách phẳng sang:

```json
"premiumBand": {
  "tags": [
    { "id": "chl-13th", "name": "💰 Lương tháng 13" },
    { "id": "chl-remote", "name": "💻 Làm việc từ xa" }
  ],
  "jobs": [ { "id": "job-1", "title": "…", "companyName": "…", "…": "…" } ],
  "deal": {
    "chl-13th":   ["job-7", "job-1", "job-9", "…"],
    "chl-remote": ["job-14", "job-16", "job-17", "…"]
  }
}
```

- `jobs` chứa **mỗi tin đúng một lần**; `deal` trỏ tới chúng bằng id. Một tin có thể xuất hiện ở nhiều tag, nhưng payload không nhân bản.
- `tags` đã localize theo `{lang}`, **không có** `count` — xem luật 7.
- `name` đã bao gồm emoji (emoji nằm trong `name_vi` / `name_en` của catalogue, không phải cột riêng).

### Acceptance — task 3a

- [ ] `jobs` không chứa id trùng.
- [ ] Mọi id trong `deal` đều tồn tại trong `jobs`.
- [ ] Khoá của `deal` khớp đúng tập `tags`, không thừa không thiếu.
- [ ] Không có field `count` ở bất kỳ đâu trong `premiumBand`.
- [ ] `tags[].name` trả đúng ngôn ngữ theo `{lang}`.

---

## 2. Luật chia bài — svn-be

Tám luật. Đây là phần quan trọng nhất của task.

| # | Luật |
|---|---|
| **1** | **Tag ứng cử** = hợp của `company_search_tag` của mọi công ty đang có tin trong dải. **Loại bỏ tag lọc ra dưới 3 tin.** Không có luật trần — tag phủ 100% số tin vẫn được giữ. |
| **2** | **Số tag hiện = số tin trong dải ÷ 3** (làm tròn xuống), **tối đa 8, tối thiểu 3**. Không đủ 3 tag → `tags: []` và FE ẩn cả hàng tag. |
| **3** | **Thứ tự tag ngẫu nhiên**, đổi mỗi lần gọi. Khi số tag ứng cử nhiều hơn số tag được hiện, **lấy mấy tag đầu sau khi xáo** — nên qua nhiều lần tải, mọi tag của công ty đều có lượt. **Ngoại lệ:** xem luật 3b. |
| **3b** | **Tag đầu tiên phải là tag phủ nhiều công ty nhất** trong dải. Nhiều tag cùng phủ nhiều nhất thì chọn ngẫu nhiên trong số đó. |
| **4** | **Luôn có đúng một tag đang chọn**, và vào trang thì **tag đầu tiên** được chọn sẵn. Không có nút "Tất cả", không có trạng thái không chọn gì. |
| **5** | **Chia bài.** Xáo ngẫu nhiên tập tin một lần cho cả request. Rồi chia vòng tròn: đi lần lượt qua từng tag, mỗi tag lấy **tin tiếp theo trong danh sách đã xáo mà tag đó lọc được và chưa tag nào lấy**. Lặp cho tới khi mọi tag đủ card. **Chỉ khi hết sạch tin chưa dùng mới cho phép lặp lại.** |
| **5b** | **Tag ít tin nhất chia trước.** Nếu không, một tag chỉ có 4 tin đủ điều kiện sẽ bị các tag 20 tin lấy mất hết phần và còn lại rỗng. |
| **6** | **Tối đa 10 card mỗi tag.** Một tag **không bao giờ** lặp tin của chính nó: tag chỉ lọc được 4 tin thì `deal` của nó có 4 phần tử, không độn cho đủ 10. Các tag dài ngắn khác nhau là bình thường. |
| **7** | **Không trả và không hiện số đếm trên tag.** KR không hiện, và với một khách Premium mọi con số đều bằng nhau — đó mới là thứ lộ ra ngay, sớm hơn thứ tự tin nhiều. |
| **8** | Trong một tag, **hai card liền nhau không cùng một công ty** (rải vòng theo công ty sau khi chia xong). Giữ nguyên tinh thần luật đã có của dải: không công ty nào chiếm liền nhiều card. |

### Chuỗi dự phòng khi công ty chưa chọn Search tag

Tin của một công ty **chỉ được chia cho tag mà công ty đó có**. Công ty không có tag nào thì tin của họ không thuộc tag nào, và vì luôn có một tag đang chọn, **tin đó sẽ không bao giờ xuất hiện** — một khách Premium trả tiền mà tin không lên dải, không có lỗi nào báo.

Nên:

1. Công ty không có dòng nào trong `company_search_tag` → lấy tạm **`company_page_highlight` (tối đa 6)** của chính công ty đó làm search tag.
2. Công ty cũng không có highlight nào → **`tags: []`**, FE ẩn hàng tag, dải vẽ như hôm nay với đủ mọi tin.

> Thà mất hàng tag còn hơn mất tin của khách.

### Acceptance — luật chia bài

- [ ] Dải 20 tin, 1 công ty, công ty chọn 9 search tag → **6 tag**, mỗi tag **10 card**.
- [ ] Trong ví dụ trên, gom **3 phần tử đầu** của cả 6 tag lại → **18 id khác nhau**, không trùng cái nào.
- [ ] Dải 33 tin, 3 công ty (20 / 9 / 4 tin) → **8 tag**; tag chỉ lọc được 9 tin có đúng **9 card**; tag chỉ lọc được 4 tin có đúng **4 card**.
- [ ] Không `deal[tag]` nào chứa id trùng.
- [ ] Dải 8 tin → `tags: []` (vì 8 ÷ 3 = 2 < 3).
- [ ] Công ty trong dải chỉ có 2 search tag đủ điều kiện → `tags: []`.
- [ ] `tags[0]` luôn là một tag phủ số công ty nhiều nhất trong dải.
- [ ] Hai lần gọi liên tiếp cùng tham số → thứ tự tag khác nhau và nội dung `deal` khác nhau.
- [ ] Công ty Premium không có search tag nhưng có 4 highlight → 4 highlight đó được dùng làm tag.
- [ ] Công ty Premium không có cả hai → `tags: []`, và **mọi tin của công ty đó vẫn nằm trong `jobs`**.

---

## 3. Task 3b — svn-web: vẽ hàng tag

Xem mockup. File: `features/jobs/search/ui/premium-jobs-band.tsx`.

- Hàng tag nằm **giữa tiêu đề dải và các card**, cuộn ngang với mũi tên `‹ ›` ở hai đầu.
- Tag đang chọn: viền và chữ màu brand, in đậm. Tag khác: nền trắng, viền trong suốt.
- Dải hiện `deal[tagĐangChọn]` → **3 card một lượt**, mũi tên `‹ ›` lật **3 card**.
- **Đổi tag là đổi tức thì:** không gọi lại server, không đổi URL, không ghi thêm log tìm kiếm, **danh sách kết quả bên dưới không đổi**. Toàn bộ dữ liệu đã nằm trong response đầu tiên.
- Đổi tag thì **quay về trang 1 của carousel**.
- `tags.length === 0` → **không vẽ hàng tag**, dải giữ nguyên hành vi hôm nay.
- FE **không sắp xếp, không lọc, không cắt** — đúng như comment đang có trong component.

### Acceptance — task 3b

- [ ] Vào trang: tag đầu tiên đã ở trạng thái chọn, dải hiện 3 card đầu của tag đó.
- [ ] Bấm tag khác: dải đổi ngay, không có loading, carousel về trang 1.
- [ ] Bấm qua lại giữa hai tag nhiều lần: nội dung mỗi tag **không đổi** trong cùng một lần tải trang.
- [ ] URL, danh sách kết quả và bộ lọc bên trái không đổi khi bấm tag.
- [ ] Tab mạng: bấm tag **không phát sinh request nào**.
- [ ] `tags: []` → không có hàng tag, dải vẫn vẽ bình thường.
- [ ] Mobile: hàng tag cuộn ngang được, trang không bị tràn ngang.
- [ ] Bàn phím: Tab tới được từng tag, Enter/Space để chọn, có viền focus nhìn thấy.

---

## 4. Task 3c — đếm lượt hiển thị

Dải là vùng bán tiền, nên con số này đi thẳng vào báo cáo gửi khách. Luật chia bài tạo ra một cái bẫy: server trả sẵn tới **8 tag × 10 card = 80 card** trong một trang, trong khi ứng viên chỉ nhìn thấy 3.

- **Một lượt hiển thị = một card thật sự lọt vào khung nhìn** — tag đó đang được chọn **và** card đang nằm trong 3 ô đang hiện. Bấm mũi tên `›` sang card 4·5·6 thì ba card đó mới được tính.
- **Ghi nhận mỗi lượt bấm tag**: tag nào, từ khoá nào, vị trí thứ mấy trên hàng. Đây là dữ liệu duy nhất cho biết tag nào thật sự có người dùng — sau 2–3 tháng BA mới biết nên giữ tag nào trong danh sách Search tag.
- Card trong dải vẫn báo `surface: "SEARCH_PREMIUM"` kèm `contextRef.search(searchId)` như hôm nay.
- Header `X-SVN-Search-Log` / `searchLogEntry` **chỉ đi cùng lần tìm kiếm chính của ứng viên**, không đi kèm bất cứ thao tác nào trên hàng tag. Một lần tìm kiếm là một dòng log.

### Acceptance — task 3c

- [ ] Tải trang và không chạm vào gì: đúng **3** lượt hiển thị được ghi, không phải 80.
- [ ] Bấm `›` một lần: thêm đúng 3 lượt.
- [ ] Bấm sang tag khác: ghi một sự kiện bấm tag, và 3 lượt hiển thị của tag mới.
- [ ] Không phát sinh dòng search-log thứ hai cho cùng một lần tìm kiếm.

---

## 5. Thứ tự deploy — KHÔNG additive như vẻ ngoài

1. **Task 1** (cột `search_tag` + màn master data) → HQ gắn cờ ~18 tag.
2. **Task 2** (bảng `company_search_tag` + mục 3b) → người nhập chọn search tag cho từng công ty Premium.
3. **Task 3a** (svn-be) lên trước.
4. **Task 3b** (svn-web) lên sau.

Hai cái bẫy:

- **Spring bỏ qua `@RequestParam` lạ mà không báo lỗi.** FE lên trước BE thì không có lỗi nào xuất hiện ở đâu cả — hàng tag chỉ đơn giản không hoạt động.
- **Task 3 không có gì để hiện nếu chưa có dữ liệu từ task 1 và 2.** Trước khi bật, BA/Admin phải xác nhận các công ty Premium đã chọn search tag. Đây là việc của người, không phải của code.

---

## 6. Không làm trong task này

- ❌ Dùng job card tag (`job_card_tag`) làm nguồn tag.
- ❌ Dùng trường của job (ngành nghề, địa điểm, cấp bậc, hình thức làm việc) làm tag.
- ❌ Luật trần "tag phủ quá nhiều tin thì ẩn".
- ❌ Hiện số đếm trên tag.
- ❌ Nút "Tất cả" hoặc trạng thái không chọn tag nào.
- ❌ Đưa tag vào URL hay vào bộ lọc bên trái.
- ❌ Đụng vào Top section hay danh sách kết quả chính.
- ❌ Đổi copy tiêu đề dải.
- ❌ Hàng tag cho dải Premium ở trang chủ hay trang công ty — chỉ `/search`.
