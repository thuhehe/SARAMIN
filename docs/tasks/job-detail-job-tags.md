# [Job detail] Job tags — dải từ khoá tự sinh, bấm vào ra trang tìm kiếm đã lọc sẵn

**Module:** Job management · **Site:** Jobseeker (svn-web) · **Loại:** FE (+ 1 thay đổi nhỏ BE nếu thiếu mã skill)
**Requirement chi tiết (source of truth):** https://saramin-eta.vercel.app/m/job-management/job-tags-keyword-links-on-the-job-detail

---

## 0. Bối cảnh — đọc trước khi code

Job tag là **link**, không phải nhãn. Mỗi chip lấy **một giá trị tin tuyển dụng đã có sẵn** (ngành, vị trí, địa điểm, kỹ năng…) và mở **danh sách việc làm khác có cùng giá trị đó**. Nhà tuyển dụng **không nhập thêm gì**.

Mục đích: (1) ứng viên vào nhầm tin vẫn có đường đi tiếp sang việc làm tương tự; (2) tạo link nội bộ cho Google. Tham khảo: Saramin KR (hashtag cuối tin), VietnamWorks (mục “Từ khoá”).

**Không làm từ đầu.** svn-web đã có `FooterUtilities` → `TagChips` ở cuối panel job detail, **bị comment lại ngày 15/09** (`features/jobs/detail/ui/index.tsx`) vì:
1. chỉ in lại danh sách kỹ năng dưới dạng `?keyword=` — không thêm được gì;
2. lỗi hiển thị `##A/B Testing` (data đã có `#`, `TagChips` lại thêm `#`).

Task này **thay data** của dải tag đó, sửa 2 lỗi trên rồi bật lại. Giữ nguyên vị trí và component.

---

## Task 1 — Dựng danh sách chip từ field có cấu trúc

Chip được dựng theo **đúng thứ tự** bên dưới. Field nào tin không có thì không có chip đó. Text của chip là **tên trong catalogue theo ngôn ngữ trang** (VI / EN / KO), giống chữ đang in ở khối “Thông tin việc làm”.

| # | Chip | Field trên tin | Link tới | Tối đa |
|---|---|---|---|---|
| 1 | Ngành | `hiringBrief.industryId` | `/search?industry=<code>` | 1 |
| 2 | Nhóm nghề | `jobCategoryId` | `/search?category=<code>` | 1 |
| 3 | Vị trí | `roleIds` | `/search?role=<code>` — mỗi role 1 chip | 3 |
| 4 | Cấp bậc | `jobLevelIds` | `/search?level=<code>` — mỗi level 1 chip | 3 |
| 5 | Địa điểm (tỉnh/thành) | `hiringBrief.cityCodes`, nếu trống thì lấy tỉnh của working locations | `/search?province-code=<code>` — mỗi tỉnh 1 chip | 3 |
| 6 | Kỹ năng | `tags[]` có `kind = SKILL` | `/search?skill=<code>` | 8 |
| 7 | Công ty | `company.slug` | `/companies/<slug>/jobs` | 1 |

Quy tắc:
- **Id → code.** `/search` lọc theo **code** catalogue, còn payload job detail trả **id** (skill thì trả tên). Map id → code qua các catalogue mà service `jobs-detail.service.ts` đã fetch sẵn.
- **Không có code thì bỏ chip.** Catalogue lỗi hoặc row bị deactivate → **bỏ chip đó**. **Không** fallback sang `?keyword=<tên>`, vì link đó ra một danh sách khác, mờ hơn cái chip hứa.
- **Bỏ trùng.** Hai chip cùng text (vd. ngành và nhóm nghề cùng tên “Bất động sản”) → giữ chip **đứng trước** theo thứ tự trên.
- **Không bao giờ tạo chip cho:** benefit (`kind = BENEFIT`), lương, loại hợp đồng / hình thức làm việc, học vấn, số lượng tuyển.
- **Tin ẩn danh (SRM-737, `company.anonymous`)** → **không** có chip công ty.

### Task 1b (BE — chỉ làm nếu cần)
Nếu `tags[]` kind `SKILL` hiện chưa có `code`: svn-be thêm field `code` vào tag trong response public job detail (additive, không breaking). FE đọc `code` để dựng `?skill=`.

### AC — Task 1
- [ ] Một tin có đủ field → chip ra đúng thứ tự: ngành → nhóm nghề → vị trí → cấp bậc → địa điểm → kỹ năng → công ty.
- [ ] Tin có 5 role → chỉ hiện 3 chip role đầu (theo thứ tự employer chọn). Tương tự cho level (3), tỉnh (3), skill (8).
- [ ] Ngành và nhóm nghề trùng tên → chỉ còn 1 chip (chip ngành).
- [ ] Tin có benefit tags → **không** có chip benefit nào.
- [ ] Tin ẩn danh → không có chip công ty; các chip khác vẫn hiện.
- [ ] Catalogue roles trả lỗi → không có chip role, các chip khác vẫn hiện, trang không lỗi.
- [ ] Đổi ngôn ngữ trang (VI/EN/KO) → text chip đổi theo, link giữ nguyên code.
- [ ] Không có chip nào dẫn tới `?keyword=`.

---

## Task 2 — Hiển thị dải tag

- **Vị trí:** cuối panel job detail — đúng chỗ `FooterUtilities` đang bị comment (sau company block và relevant-jobs carousel, trước banner quảng cáo). Desktop và mobile giống nhau.
- **Tiêu đề:** “Từ khoá” / “Keywords” / “키워드” (thêm vào dictionary `jobsDetail`).
- **Chip KHÔNG có dấu `#`.** Bỏ việc prepend `#` trong `TagChips` và bỏ `#` trong service (`footerTags`). Style chip giữ như hiện tại.
- **Hiện 10 chip đầu, còn lại ẩn sau nút “+”** (toggle sẵn có của `TagChips`; “−” để thu lại). **Mọi chip phải có trong HTML ngay lần render server đầu tiên**, chỉ ẩn bằng CSS hoặc state. Không được bỏ chip khỏi DOM, để Google vẫn đọc được hết link.
- **Link thật, mở cùng tab:** `<a href>` render phía server, **không** `nofollow`, **không** `target="_blank"`.
- **0 chip → ẩn cả dải**, kể cả tiêu đề, và không để lại khoảng trống.
- **Trang preview** của employer (`/jobs/preview`) hiển thị dải tag giống trang thật.
- Đồng thời sửa luôn label `aria-label` của nút toggle (hiện đang hard-code “Thu gọn” / “Mở rộng”) thành text lấy từ dictionary.

### AC — Task 2
- [ ] Không còn `##` ở bất kỳ chip nào; chip không có `#`.
- [ ] Tin có 14 chip → thấy 10 chip + nút “+”; bấm “+” thấy đủ 14, nút thành “−”.
- [ ] View source (tắt JS) thấy đủ **14** thẻ `<a>`, không có `rel="nofollow"`.
- [ ] Bấm chip → mở `/search?...` **cùng tab**; bấm Back → quay lại đúng job detail.
- [ ] Vào `/search?industry=<code>` từ chip → filter ngành đó **hiện là đã chọn** ở thanh filter và **bỏ chọn được**.
- [ ] Tin không có field nào tạo chip → không thấy tiêu đề “Từ khoá”, không có khoảng trống.
- [ ] `/jobs/preview` hiện dải tag giống trang thật.
- [ ] Chip công ty → mở `/companies/<slug>/jobs`.

---

## Task 3 — Đo lường

Thêm search-entry token mới **`job-tag`** (entry `JOB_TAG`) vào `features/analytics/lib/search-entry.ts` và `analytics-contract`, đặt cạnh `header-panel` / `search-bar` / `suggest`. Mọi link chip tới `/search` đều có thêm `&entry=job-tag`.

Lý do: con số “bao nhiêu lượt search bắt đầu từ tag” là cơ sở để quyết định có làm trang SEO riêng (phương án B) hay không.

### AC — Task 3
- [ ] Link chip có `entry=job-tag`; khi vào trang, param này bị gỡ khỏi thanh địa chỉ (giống các entry khác).
- [ ] Sự kiện search ghi nhận `searchEntry = JOB_TAG`.
- [ ] Link chip công ty (`/companies/...`) **không** có `entry`.

---

## Không làm trong task này

- ❌ **Trang SEO riêng cho từng tag** (URL thân thiện kiểu `/viec-lam/ke-toan-ha-noi`, title/meta riêng) — phương án B, để sau.
- ❌ **Cho nhà tuyển dụng tự nhập tag** — không làm, kể cả phase sau (dễ spam từ khoá, dữ liệu không thống nhất).
- ❌ Quản lý tag trong Admin — tag tự sinh hoàn toàn, không có màn quản lý.
- ❌ Hiện tag trên job card ở danh sách / kết quả tìm kiếm.
- ❌ Đổi gì ở khối “Thông tin việc làm”. Chip lặp lại giá trị của khối này **là có chủ ý**: khối đó là thông tin, còn dải tag là chỗ để bấm.
