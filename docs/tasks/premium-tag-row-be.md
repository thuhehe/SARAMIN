# [BE] svn-be: luật chia bài + response `premiumBand`

**Sub-task 3 / 4** · **Repo:** svn-be · **Phụ thuộc:** sub-task 1 và 2 (cần `company_search_tag` có dữ liệu)
**Requirement:** [saramin-eta.vercel.app → “THE BLUE ZONE’S TAG ROW”](https://saramin-eta.vercel.app/m/job-management/job-list-search-result#the-blue-zone-s-tag-row-company-tags-dealt-out-so-every-tag-opens-a-different-set-of-jobs)
**Mockup:** [jobseeker](https://claude.ai/artifact/SKfqu7LySEraceQ5oSsz9g)

> **svn-be sở hữu toàn bộ logic của dải, đúng như hôm nay.** Nó chia bài một lần rồi trả ra cấu trúc hoàn chỉnh; FE chỉ vẽ, không sắp xếp, không lọc, không cắt.

---

## 1. Response

`GET /api/{lang}/jobs/search?...&premiumOnly=true` đổi từ danh sách phẳng sang:

```
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

- `jobs` chứa **mỗi tin đúng một lần**; `deal` trỏ tới chúng bằng id. Một tin có thể nằm ở nhiều tag, nhưng payload không nhân bản.
- `tags` đã localize theo `{lang}`, **không có** `count` — xem luật 7.
- `name` đã bao gồm emoji (emoji nằm trong `name_vi` / `name_en` của catalogue, không phải cột riêng).

### Acceptance — response

- [ ] `jobs` không chứa id trùng.
- [ ] Mọi id trong `deal` đều tồn tại trong `jobs`.
- [ ] Khoá của `deal` khớp đúng tập `tags`, không thừa không thiếu.
- [ ] Không có field `count` ở bất kỳ đâu trong `premiumBand`.
- [ ] `tags[].name` trả đúng ngôn ngữ theo `{lang}`.

---

## 2. Tám luật chia bài

| # | Luật |
|---|---|
| **1** | **Tag ứng cử** = hợp của `company_search_tag` của mọi công ty đang có tin trong dải. **Loại bỏ tag lọc ra dưới 3 tin.** Không có luật trần — tag phủ 100% số tin vẫn được giữ. |
| **2** | **Số tag hiện = số tin trong dải ÷ 3** (làm tròn xuống), **tối đa 8, tối thiểu 3**. Không đủ 3 tag → `tags: []` và FE ẩn cả hàng tag. Chia 3 vì dải hiện 3 card một lượt — đó là thứ bảo đảm luật 5 ở khung nhìn đầu. |
| **3** | **Thứ tự tag ngẫu nhiên**, đổi mỗi lần gọi. Khi số tag ứng cử nhiều hơn số tag được hiện, **lấy mấy tag đầu sau khi xáo** — nên qua nhiều lần tải, mọi tag của công ty đều có lượt. **Ngoại lệ:** luật 3b. |
| **3b** | **Tag đầu tiên phải là tag phủ nhiều công ty nhất** trong dải (bằng nhau thì ngẫu nhiên trong số đó). Nếu không, một tag chỉ một công ty nhỏ có thể rơi vào vị trí chọn sẵn, và dải mở ra chỉ thấy công ty đó — khách lớn nhất vô hình. |
| **4** | **Luôn có đúng một tag đang chọn**, và vào trang thì **tag đầu tiên** được chọn sẵn. Không có nút “Tất cả”, không có trạng thái không chọn gì. |
| **5** | **Chia bài.** Xáo ngẫu nhiên tập tin một lần cho cả request. Rồi chia vòng tròn: đi lần lượt qua từng tag, mỗi tag lấy **tin tiếp theo trong danh sách đã xáo mà tag đó lọc được và chưa tag nào lấy**. Lặp cho tới khi mọi tag đủ card. **Chỉ khi hết sạch tin chưa dùng mới cho phép lặp lại.** |
| **5b** | **Tag ít tin nhất chia trước.** Nếu không, một tag chỉ có 4 tin đủ điều kiện sẽ bị các tag 20 tin lấy mất hết phần và còn lại rỗng. |
| **6** | **Tối đa 10 card mỗi tag.** Một tag **không bao giờ** lặp tin của chính nó: tag chỉ lọc được 4 tin thì `deal` của nó có 4 phần tử, không độn cho đủ 10. Các tag dài ngắn khác nhau là bình thường. |
| **7** | **Không trả và không hiện số đếm trên tag.** KR không hiện, và với một khách Premium mọi con số đều bằng nhau — đó mới là thứ lộ ra ngay, sớm hơn thứ tự tin nhiều. |
| **8** | Trong một tag, **hai card liền nhau không cùng một công ty** (rải vòng theo công ty sau khi chia xong). Luật công bằng sẵn có của dải phải sống sót qua việc chia bài. |

> **Về luật “không dùng ngẫu nhiên” trong spec:** luật đó bảo vệ **danh sách kết quả**, nơi có phân trang. Dải Premium chỉ nằm ở trang 1 và không phân trang, nên xáo lại mỗi request là ngoại lệ có chủ ý. Spec đã được sửa lại cho rõ: *cái gì có phân trang thì không được ngẫu nhiên.*

---

## 3. Chuỗi dự phòng khi công ty chưa chọn Search tag

Tin của một công ty **chỉ được chia cho tag mà công ty đó có**. Công ty không có tag nào thì tin của họ không thuộc tag nào, và vì luôn có một tag đang chọn, **tin đó sẽ không bao giờ xuất hiện** — một khách Premium trả tiền mà tin không lên dải, không có lỗi nào báo ở đâu.

1. Công ty không có dòng nào trong `company_search_tag` → lấy tạm **`company_page_highlight` (tối đa 6)** của chính công ty đó làm search tag.
2. Công ty cũng không có highlight nào → **`tags: []`**, FE ẩn hàng tag, dải vẽ như hôm nay với đủ mọi tin.

> Thà mất hàng tag còn hơn mất tin của khách.

---

## 4. Acceptance — luật chia bài

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

## 5. Không làm trong sub-task này

- ❌ Giao diện hàng tag — đó là sub-task 4.
- ❌ Thêm param lọc theo tag: FE không gọi lại server khi đổi tag, toàn bộ deal đã nằm trong response đầu tiên.
- ❌ Trả `count` cho tag.
- ❌ Đụng vào Top section hay thứ tự của danh sách kết quả chính.
