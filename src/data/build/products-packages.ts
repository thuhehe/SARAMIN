import type { BuildModule } from './types'

/*
 * Products & Packages — the catalogue side of monetisation.
 *
 * This module answers only two questions: WHAT is sellable, and at WHAT price.
 * The selling itself (quotation → sales order → payment → VAT invoice) lives in
 * CRM; what the customer then holds lives on the account. The chain:
 *
 *   Catalog product / Bundle   ← here: definition + price + fulfilment
 *          │ quoted & sold (CRM)
 *          ▼
 *   Order  Draft → Pending payment → Paid → Fulfilled
 *          │ payment confirmed by Accounting (CRM)
 *          ▼
 *   ENTITLEMENT  (product + remaining quota + validity)  ← the ONE record
 *          │      downstream screens read and decrement
 *          ▼
 *   Consumption: publish a job spends a posting slot · unlock a CV spends an
 *                unlock · a boost spends a boost · an ad booking spends a period
 *
 * The invariant that keeps the money honest: nothing is entitled without a paid
 * order, and no admin hand-picks products for an account. Provisioning is a
 * consequence of payment, never a manual favour.
 *
 * Depth mirrors ./job-management.ts.
 */

export const productsPackages: BuildModule = {
  id: 'products-packages',
  title: 'Products & Packages',
  owner: 'Luong',
  requirements: [
    {
      label: 'What this module is',
      text: 'Admin-only. Manage sellable products, bundle them into packages with price / duration / quota, and feed the Company purchasing surface.',
    },
    {
      label: 'Product types in the catalog',
      text: 'FOUR types, derived from the client Products deck by grouping its line items on HOW each is fulfilled. The type is the discriminator: it decides which fulfilment fields apply, so the create form asks for different things per type. Each product carries a price (₫), its fulfilment and an Active / Inactive status.',
      table: {
        cols: ['Type', 'Deck items', 'Fulfilment mechanic'],
        rows: [
          ['Job posting', 'Basic · Basic Plus · Distinction · Top Job', 'N posting slots; publishing a job spends one. THIS product is the tier definition — display days, refresh cadence, styling and the placements it feeds all live on it.'],
          ['CV search', 'COMBO 30 / 50 / 100 / 300', 'Unlock quota + validity, decremented per CV opened.'],
          ['Placement booking', 'Main banner · Công ty nổi bật · Top Companies · adsense (home + search) · Highlight Company (search) · homepage pop-up', 'A time window on a named slot, capacity-capped — needs an availability calendar. Only for slots a customer can BOOK standalone.'],
          ['Manual service', 'Facebook fanpage post · Email Marketing / Job Alert banner', 'Ops fulfils it — opens a task (Requested → Scheduled → Delivered) with proof, NOT an auto-provisioned entitlement.'],
        ],
      },
      /* Rules only. The narrative this block used to carry — how the four types were
         derived from the client deck, and what the old CRM's Basic Plus SKUs cost —
         was removed: it recorded how we ARRIVED at the model, which nobody building
         from this needs. Every line below is a constraint on what may be built. */
      items: [
        'THE TIERS ARE Basic · Basic Plus · Distinction · Top Job, plus the Free tier for Admin-posted jobs (entitlementSource = Always available). The tier is what drives visibility and ranking on the jobseeker site — see Job management.',
        'ONE PRODUCT PER CAPABILITY. Segment and duration are a PRICE LIST on the product, never extra products. Sell one tier as four SKUs and what that tier grants is defined in four places, which then drift apart.',
        'THERE IS NO SEPARATE TIER-CONFIG SCREEN. A Job posting product IS its tier definition: display days, auto-refresh cadence, max skill tags, title styling, and the placements it feeds and for how many days. One record per tier is what keeps that definition in a single place.',
        'ATTACHABILITY IS A FLAG, NOT A TYPE — it describes how a thing is SOLD, not what it is. An email blast is a Manual service whether sold alone or included in Top Job; a premium fixed position is a Placement either way. So each product carries `standalone`: false means it exists with its own definition but may never be a quotation line on its own.',
        'A Job posting product carries `includes[]` — the Placement and Manual service products it grants. Top Job includes the Popular Jobs premium position, the fanpage post and the Email Marketing send. This is why the catalogue is built BOTTOM-UP: placements and services first, then the Job posting products that reference them.',
        'AN EFFECT OF A TIER IS NOT A PRODUCT. Popular Jobs, Highlight Jobs, Job Basic, Jobs Tailored For You and Super Hot Jobs are things a posting tier already grants — making any of them sellable would bill the customer twice for one thing.',
      ],
    },
    {
      label: 'Manual service — usage is asserted, not measured',
      text: 'Nothing on the platform can observe a fanpage post going up or an email blast going out. So “how many of the 4 posts has this customer used?” is only answerable if the person who did the work records it. Each Manual service entitlement carries a DELIVERY LOG, and the log is the meter.',
      table: {
        cols: ['Field', 'Required', 'Why'],
        rows: [
          ['Ngày đăng', 'Yes', 'When the unit was actually delivered — not when it was logged.'],
          ['Link bài đăng', 'Yes', 'What the customer asks for when they reconcile the invoice: “show me the post”. Without it the entry is one person’s word that a unit was spent.'],
          ['Nội dung đã đăng', 'Yes', 'What was said. A link can rot; the copy is the durable record.'],
          ['Ảnh chụp / ảnh đã dùng', 'No', 'A fanpage post has a screenshot worth keeping; an email blast usually does not.'],
          ['Người thực hiện', 'Auto', 'From the signed-in operator, never picked — this is the accountability half of the record.'],
        ],
      },
      items: [
        'ONE LOG ENTRY = ONE UNIT CONSUMED. Remaining is DERIVED (total − entries), never stored and never editable. A typed remaining count is exactly the field that drifts out of step with what was actually delivered.',
        'At zero the log button is disabled — the entitlement is spent, and more delivery needs another purchase, not a bigger number.',
        'Correcting a delivery means editing THAT ENTRY, not adjusting a balance. The balance has no independent existence to adjust.',
        'This lives on the company record next to the metered quota (Products & billing), because a reader wants one answer to “what has this customer used?” — but the two are different in kind: job slots and CV unlocks are OBSERVED by the platform, manual-service units are ASSERTED by a person.',
      ],
      warn:
        'Never give a Manual service an editable remaining count, and never let it decrement automatically on payment. Paying for 4 posts means 4 are owed, not that any were delivered — the gap between those two is the whole reason this log exists.',
    },
    {
      label: 'Placements — where a product surfaces on the site',
      text: 'A PLACEMENT is a named display area on the jobseeker site — the hero banner, a featured-company strip, a homepage job section. Each area is defined ONCE in System → Placements with its size, how many items it shows and its cap, so a product points at that row instead of restating it. An area is filled one of two ways: TIER-DRIVEN (membership is derived from a job’s posting tier — nothing is booked, nothing is assigned by hand) or BOOKED (a company buys the slot for N days, and capacity is a hard cap). The authoritative list of areas lives in the Placements registry screen, not in this document.',
    },
    {
      label: 'Entitlement is the single downstream record',
      text: 'Every product maps to an ENTITLEMENT = product + remaining quota + validity. That is the one record downstream screens read and decrement.',
      table: {
        cols: ['Step', 'Rule'],
        rows: [
          ['Provisioning', 'Automatic on payment — an admin NEVER hand-picks products for an account'],
          ['Activation', 'Every product except a CV pack is usable the moment it is provisioned. A **CV pack does not run until someone presses Kích hoạt** — see the activation block'],
          ['Consumption', 'Publishing a job spends a posting slot; unlocking a CV spends one unlock **from the activated pack it was spent under**, never from a pooled balance'],
          ['At zero', 'The action is blocked, with a buy-more path. For CV search, hitting zero also ENDS that pack and frees the next one to be activated'],
        ],
      },
    },
    {
      label: 'Kích hoạt — gói CV search phải bấm, mọi sản phẩm khác thì không',
      text: 'Một sản phẩm đã xuất hóa đơn thì **dùng được ngay**, bất cứ lúc nào trong cửa sổ kích hoạt 12 tháng — không có nút nào phải bấm. **Gói CV search là ngoại lệ duy nhất**, và nó cần một nút **Kích hoạt** rõ ràng.\n\nVì sao chỉ CV search: thời hạn dùng của nó chỉ **30 hoặc 90 ngày**. Nếu đồng hồ đó chạy từ ngày xuất hóa đơn thì phần lớn thời hạn đã cháy trước khi có người ngồi xuống tìm CV — khách trả tiền cho 90 ngày và nhận về 20. Nút kích hoạt đẩy điểm bắt đầu về đúng lúc khách thật sự bắt đầu dùng.',
      table: {
        cols: ['Loại sản phẩm', 'Cần kích hoạt?', 'Dùng được từ khi nào', 'Đồng hồ đang chạy'],
        rows: [
          ['**Job posting** (slots)', 'Không', 'Ngay khi có hóa đơn VAT', 'Cửa sổ kích hoạt 12 tháng. Mỗi tin đăng tự có 30 ngày hiển thị của riêng nó'],
          ['**Display / placement**', 'Không', 'Ngay khi có hóa đơn VAT', 'Cửa sổ 12 tháng; lượt đặt chạy theo ngày/tuần/tháng đã book'],
          ['**Manual service**', 'Không', 'Ngay khi có hóa đơn VAT', 'Cửa sổ 12 tháng'],
          ['**CV search** (credit pack)', '**CÓ — nút Kích hoạt**', 'Chỉ sau khi bấm Kích hoạt', 'Trước khi bấm: cửa sổ 12 tháng. Sau khi bấm: **30 hoặc 90 ngày** thời hạn dùng'],
        ],
      },
      items: [
        'HAI ĐỒNG HỒ, KHÔNG BAO GIỜ CHẠY CÙNG LÚC. **Thời gian kích hoạt** — 12 tháng kể từ ngày xuất hóa đơn, là khoảng thời gian khách được quyền *bắt đầu*. **Validity / thời hạn sử dụng** — 30 hoặc 90 ngày kể từ lúc bấm kích hoạt, là khoảng thời gian khách phải *dùng hết quota*. Bấm kích hoạt là lúc đồng hồ 1 dừng và đồng hồ 2 bắt đầu.',
        'UNLOCK TRỪ VÀO QUOTA CỦA CHÍNH GÓI ĐANG KÍCH HOẠT, không trừ vào một số dư gộp. Hai gói 100 CV **không phải là 200 CV**: mỗi lượt mở CV ghi nhận thuộc gói nào, nên khi một gói hết hạn thì phần chưa dùng của nó mất mà không ảnh hưởng gói còn lại.',
        'MỖI LÚC CHỈ MỘT GÓI CV ĐƯỢC KÍCH HOẠT. Khách mua nhiều gói thì các gói còn lại nằm ở **Chưa kích hoạt** và nút Kích hoạt của chúng **bị chặn**, kèm câu nói rõ gói nào đang giữ. Gói tiếp theo chỉ bấm được khi gói đang chạy **hết quota** hoặc **hết thời hạn sử dụng** — cả hai kết thúc đều mở đường cho gói sau.',
        'AI BẤM ĐƯỢC: **Admin** trên trang admin (Company detail → Products & billing) **hoặc NTD** trên Company site (Products & quota). Hai cửa cùng một hành động, và bản ghi lưu ai bấm — admin bấm hộ là để xử lý ca khách gọi lên, không phải cửa riêng có luật riêng.',
        'CÓ HỎI LẠI TRƯỚC KHI KÍCH HOẠT, ở cả hai surface. Hộp xác nhận nói thẳng ngày kết thúc mà cú bấm này sẽ tạo ra, vì hệ quả **không đảo lại được**: đồng hồ 30/90 ngày không dừng, không tạm ngưng, và quota còn lại lúc hết hạn thì mất.',
        'GÓI CHƯA KÍCH HOẠT KHÔNG HIỆN THANH QUOTA. “100/100 còn lại” là đúng nhưng gây hiểu sai hoàn toàn — chưa bấm thì chưa tiêu được gì. Chỗ đó hiện số CV của gói cộng ngày phải kích hoạt trước.',
        'TÌM CV THÌ ĐƯỢC, MỞ CV THÌ KHÔNG — khi chưa có gói nào kích hoạt. Chặn cả việc tìm kiếm là chặn đúng thứ giúp khách quyết định có nên bắt đầu 30 ngày hay chưa.',
      ],
      warn: 'HỆ QUẢ PHẢI NÓI TRƯỚC VỚI KHÁCH: luật “mỗi lúc một gói” làm quota có thể bị mắc kẹt. Gói đang chạy còn 5 CV nhưng còn 2 ngày, khách vẫn **không** được kích hoạt gói sau để dùng tiếp — phải đợi gói đó kết thúc, và 5 CV kia mất. Đó là đánh đổi có chủ ý (nó giữ cho mỗi lượt unlock quy được về đúng một gói), nhưng nó phải in trên báo giá và PO, không được để khách phát hiện ở lần gia hạn.',
    },
    {
      label: 'Trạng thái một gói CV search — bốn trạng thái, và cái thứ tư là cái làm mất tiền',
      text: 'Trạng thái nằm trên **entitlement** (gói khách đã mua), không nằm trên product. Cùng một SKU bán cho hai khách sẽ ở hai trạng thái khác nhau.',
      table: {
        cols: ['Trạng thái', 'Nghĩa là', 'Đồng hồ đang chạy', 'Ra khỏi trạng thái này khi'],
        rows: [
          ['**Chưa kích hoạt**', 'Đã thanh toán, chưa bấm. Không mở được CV nào từ gói này.', 'Thời gian kích hoạt — đến `activateBy`', 'Admin/NTD bấm **Kích hoạt** → *Đang dùng*. Hoặc quá `activateBy` → *Hết hạn kích hoạt*'],
          ['**Đang dùng**', 'Đang là gói duy nhất được tiêu. Mỗi unlock trừ vào đây.', 'Validity — `validDays` kể từ `activatedAt`', 'Hết quota, hoặc hết `validUntil` → *Đã kết thúc*'],
          ['**Đã kết thúc**', 'Xong, vì hết quota **hoặc** hết hạn dùng. Lưu lại lý do kết thúc.', '— không còn đồng hồ nào', '— trạng thái cuối. Và đây là lúc gói *Chưa kích hoạt* kế tiếp bấm được'],
          ['**Hết hạn kích hoạt**', 'Chưa bao giờ được bấm, và đã quá 12 tháng. Quota hết hiệu lực, **không hoàn tiền**.', '— không còn đồng hồ nào', '— trạng thái cuối. Chỉ thoát được bằng một lần gia hạn có ghi log trên entitlement'],
        ],
      },
      items: [
        'HAI KIỂU KẾT THÚC GỘP VÀO MỘT TRẠNG THÁI, vì hệ thống xử lý chúng y như nhau: gói đóng lại, gói sau mở ra. Lý do (`hết quota` / `hết hạn dùng`) là một field trên bản ghi, không phải một trạng thái thứ năm — tách ra thành hai trạng thái sẽ nhân đôi mọi câu điều kiện đọc nó mà không thêm hành vi nào.',
        '“HẾT HẠN KÍCH HOẠT” TÁCH RIÊNG, dù cũng là kết thúc, vì đó là trạng thái duy nhất khách **mất tiền mà chưa dùng gì**. Gộp nó vào *Đã kết thúc* là bỏ mất đúng con số cần cảnh báo trước hạn và cần báo cáo lại cho sales.',
        'CẦN JOB NHẮC HẠN cho cả hai đồng hồ: sắp hết thời gian kích hoạt (60/30/7 ngày) và sắp hết validity (7 ngày, khi còn quota chưa dùng). Đồng hồ thứ hai gấp hơn nhiều — 90 ngày mà còn 40 CV chưa mở là một cuộc gọi của sales, không phải một email.',
      ],
    },
    {
      label: 'Product catalogue status',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Active', 'Sellable — it can be quoted, ordered and provisioned. Once it has been sold, price and fulfilment are versioned from here on, not edited in place.', 'Active → Inactive to withdraw it from sale.'],
          ['Inactive', 'Not sellable — invisible to quotations, orders and the company purchasing surface. Covers BOTH a product still being defined and one withdrawn from sale. Every past order, entitlement and report that references it still resolves.', 'Inactive → Active requires a price and a complete fulfilment definition. This is also the replacement for deleting a product.'],
        ],
      },
    },
    {
      label: 'Entitlement source — how a product reaches a job',
      text: 'A second axis on job-posting products, independent of status and of price. It is a STORED flag on the product, never inferred from price: a promo line can be 0 ₫ and still have to be consumed from a PO, so deriving “postable any time” from price = 0 would turn every giveaway into an unlimited loophole.',
      table: {
        cols: ['Source', 'Means', 'Rule'],
        rows: [
          ['Requires purchase', 'The default. The job must draw the product from an active PO line.', 'Admin picks the PO first (a customer can have more than one active PO), then a product inside it. Consumes that PO line.'],
          ['Always available', 'The Admin-only free tier — no PO, no limit.', 'HQ may post it for any company at any time with no preconditions. Needs no price (exempt from the “Active needs a price” rule), links to no PO, consumes no quota, and is excluded from revenue reporting.'],
        ],
      },
      warn: 'Employers can NEVER post a free job. The Always-available tier is Admin-only and is not offered on the Company site — a company posts only from the products it bought. A free job also cannot be upgraded to a paid tier later, and it gets no premium placement slots (default listing only).',
    },
    {
      label: 'Order lifecycle',
      text: 'The order/payment object is owned by CRM → Purchase order; this module only references it.',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Draft', 'The order is still being assembled.', 'Nothing is entitled without a paid order — a Draft order grants no entitlement.'],
          ['Pending payment', 'Awaiting payment.', 'Still no entitlement until the order is Paid.'],
          ['Paid', 'Payment confirmed by Accounting (CRM).', 'Provisioning is automatic on payment — an admin never hand-picks products for an account.'],
          ['Fulfilled', 'The entitlement has been provisioned.', 'Each product on the order maps to an entitlement of product + remaining quota + validity.'],
        ],
      },
    },
  ],
  features: [
    // 0 · Catalog ─────────────────────────────────────────────────────────────
    {
      name: 'Products management',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-catalog',
      detail: {
        requirements: [
          {
            label: 'Sản phẩm dùng thử — a checkbox, not a discount',
            text: 'A product can be flagged **Sản phẩm dùng thử / Trial product** on the create form. It is a third visibility axis alongside role: role says whether a product can be quoted on its own, and this says **which quotations** may contain it at all. The switch on the other side is the quotation’s **Discount programme** — set it to **Trial package** (*Gói dùng thử*) and the service picker offers trial products and NOTHING else; leave it on anything else and it offers no trial product at all.',
            table: {
              cols: ['', 'Normal product', 'Trial product'],
              rows: [
                ['Appears in', 'Every quotation **except** one using the Gói dùng thử programme', '**Only** a quotation using Gói dùng thử'],
                ['Mixed with the other kind?', 'No', 'No — a trial quotation holds trial SKUs only'],
                ['Packages', 'Offered normally', 'NOT offered. A package carries no trial flag, so it cannot match a trial quotation and drops out of the picker entirely'],
                ['Price', 'List price', 'Its own, low, real price — 500.000 ₫ / 300.000 ₫ today'],
                ['Discount cells on the quotation', 'Per the discount programme', 'All three locked at 0 — the price already is the concession'],
                ['On the invoice', 'A normal line', 'A normal line. Nothing marks it as a giveaway'],
              ],
            },
            items: [
              'This is why the trial is modelled as **products** rather than as a 95% discount: the invoice states what was actually sold at what price, and revenue reporting sees a cheap SKU instead of a write-down nobody can explain a year later. It also means a trial can be priced, versioned and withdrawn like anything else in the catalogue.',
              'Switching a quotation into or out of trial mode **resets the product on every line**, because a leftover full-price SKU inside a trial quotation would be a line the programme does not permit.',
              'THE SPLIT IS ENFORCED SERVER-SIDE, not just in the picker: the save is refused either way. Hiding the wrong products is a courtesy to the rep — it stops a line being built that could never be sold — and never the control itself.',
              'The per-customer limit (“01 lần trên mỗi MST”) belongs to the PRODUCT, not to the discount programme — it is the same kind of rule as a quota, and it has to survive the customer being quoted twice.',
              'Trial SKUs carry an activation window like anything else, set to **3 months** rather than 12: a trial nobody starts within a quarter has stopped being a trial.',
            ],
            warn: 'Open — is the per-MST limit enforced at quotation time (block the line), at PO time, or only reported? Blocking earliest is cheapest to explain to the customer, but the check has to run across every company sharing a tax-code root, not just the one being quoted.',
          },
          {
            label: 'Thời gian phải kích hoạt — kể từ ngày xuất hóa đơn',
            text: 'Every sellable product declares how long the buyer has to **start using** it, counted from the **invoice date** — not from the PO, not from the payment, and not from the day they first log in.\n\nThis is the middle of three clocks that are constantly confused with one another, and it is the only one that can silently destroy quota the customer has already paid for.',
            table: {
              cols: ['#', 'Clock', 'Starts at', 'Set by', 'What happens at the end'],
              rows: [
                ['①', 'Provisioning', 'The OFFICIAL VAT invoice is issued — a draft grants nothing', '— immediate, no field', 'Quota is on the account. The customer can post a job / open a CV at once'],
                ['②', '**Activation window** — this field', 'The invoice date', '**activationWindowMonths** on the product', 'Quota still unused **expires**. It is not refunded and not extended by default'],
                ['③', 'Usage / display', 'A posting: the day it is published. **A CV pack: the day someone presses Kích hoạt** — nothing starts it automatically', 'validityDays on the product (30-day posting, 30/90-day CV pack)', 'That one slot/pack finishes. Other unused slots keep running clock ② — and for CV, the pack ending is what frees the next pack to be activated'],
              ],
            },
            items: [
              'Default **12 months**, which is what the client T&C states (clause 4). The options are 3 · 6 · 12 · 18 · 24 months.',
              'It lives on the **product**, not in a global setting. A 12-month bank on a 13.800.000 ₫ Top Job slot and a 12-month bank on a free trial posting are not the same commercial promise — the trial is set to 3 months for exactly that reason, since a giveaway that banks for a year is a liability rather than an incentive to start.',
              'Products with entitlementSource = **Always available** have no window at all: they are never invoiced, so there is no date to count from.',
              'CLOCK ② AND CLOCK ③ ARE THE TWO CLOCKS THE CLIENT CALLS **“thời gian kích hoạt”** and **“validity”**. For every product except a CV pack, clock ③ starts on its own (a posting starts when published), so the buyer never has to think about the handover. For a CV pack the handover is a BUTTON, and only one pack may be on clock ③ at a time — see the activation requirement.',
              'A quotation and a PO print the window alongside the line, so the customer agrees to it before they buy — it must never first appear on the invoice.',
              'The deadline is snapshotted onto the entitlement at provisioning (invoiceDate + activationWindowMonths). Changing the product afterwards must not move the deadline for quota already sold.',
              'The window pauses for nothing. If the deadline needs moving for a customer, that is an explicit, logged extension on the entitlement, not an edit to this field.',
            ],
            warn: 'Open — what happens at the deadline. Expire silently · warn the customer at 60/30/7 days · or let the sales owner extend. Expiring paid quota with no warning is the version most likely to produce a dispute, so at minimum the 12-month deadline needs a reminder job. Also confirm whether an expiry is reversible within a grace period.',
          },
        ],
        refDocs: [
          {
            label: 'Products.pptx — TopDev × Saramin, “New look new era”',
            href: '/docs/Products.pptx',
            meta: 'PPTX · 26 slides · 20 MB · client deck, received 24/07/2026',
            note:
              'The client’s own catalogue of every sellable service, and the authoritative source for product names, display counts, sizes and durations. Six sections: (1) Homepage services — main banner 1536×371, Feature company logos, Super Hot Jobs, Top Companies Hiring Now, Popular Jobs, Highlight Company, Job Basic, adsense banner 1260×120, Jobs Tailored For You, homepage pop-up · (2) Search-page services — Highlight Company, Highlight Jobs, adsense banner 425×160 · (3) Job-posting tiers — Basic, Basic Plus, Distinction, Top Job (30-day display, differing auto-refresh cadences) · (4) CV search — COMBO 30 at 2.400.000 ₫, COMBO 50 at 3.700.000 ₫ · (5) Brand-boost add-ons — “HOT” label, Công việc HOT hôm nay, Facebook post · (6) Company Page. NOTE: the deck spans far more than this screen — sections 1, 2 and 5 are placement/banner inventory (see Banners & popups) and section 6 is the company page. Read it as the product catalogue for the whole platform, not just for this page.',
          },
        ],
        description:
          'The catalogue: every sellable product with its price, its fulfilment (what the buyer actually receives) and its status. Five product types cover the business — Posting tier, Placement booking, Credit pack, Add-on and Manual service — and each declares what it grants when an order is paid. Four of the five provision an entitlement automatically; a Manual service opens an ops task instead. This screen is the definition; it never touches a customer’s balance.',
        userStory:
          'As an HQ product/sales owner, I want to define what we sell and what each product grants, so that quotations price correctly and paid orders provision exactly the right quota with no manual step.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'search', type: 'string', notes: 'product name / SKU' },
              { name: 'type', type: 'filter (dropdown)', notes: 'Posting tier · Placement booking · Credit pack · Add-on · Manual service. A DROPDOWN, not a tab strip — the list has to be narrowed by Type and Status at the same time, which tabs cannot express' },
              { name: 'status', type: 'filter (dropdown)', notes: 'Active · Inactive' },
              { name: 'row', type: 'composite', notes: 'SKU · name · type · price (₫) · fulfilment summary · validity · status · sold count' },
              { name: 'name (cell)', type: 'link', notes: 'opens the product record — the per-segment price list, the entitlement it grants and its change history. The SKU stays plain text: it is the handle you copy, not a place to go' },
              { name: 'row actions', type: 'buttons', notes: 'Edit · Duplicate · Activate / Deactivate · Archive · New version (price change)' },
            ],
          },
          {
            /* THE FORM AS BUILT, section by section, field names exactly as they
               read on screen. Written from saramin-vn-admin `origin/dev` — the
               user guide's field reference is the same source, so the two cannot
               drift. Anything specified but NOT on the form yet is in its own
               group at the end rather than mixed in here, where it would read as
               something an operator can go and fill in. */
            group: 'New product — Type',
            items: [
              { name: 'Type', type: 'radio (4 values)', required: true, notes: 'Job posting · CV search · Placement booking · Manual service. On screen: “decides what this SKU grants — and which fulfilment fields appear below”. FOUR, not five: Add-on is a ROLE, not a type (see the next group) — an email blast is a Manual service whether it is sold alone or attached, so attachability describes how a thing is SOLD, not what it is.' },
            ],
          },
          {
            group: 'New product — Identity',
            items: [
              { name: 'Name', type: 'i18n string', required: true, notes: 'Vietnamese required (placeholder: “e.g. Tin Top Job”), English optional. Printed on the quotation, the PO and the invoice.' },
              { name: 'Product ID', type: 'string', required: true, notes: 'THE SKU, under its on-screen name. Generated from the type and name, editable only when a specific code is needed. Shape TYPE-CAPABILITY (JOB-BASIC, CV-050, PLC-HOMEHERO, ADD-POPULARJOBS, SVC-FB-TOPDEV) so a row is self-describing in an export or a support ticket. LOCKED once the product has been sold — it is printed on those orders — and it must survive a rename: the name is marketing copy, this is the reference.' },
              { name: 'Selling unit', type: 'enum (picker)', notes: 'The unit this is counted in — tin, lượt, gói. Printed as the quotation’s Đơn vị tính column and copied onto the PO and the invoice. DISPLAY ONLY: nothing computes from it, which is why it is not the same field as the fulfilment quantities below.' },
              { name: 'Role', type: 'radio (Main · Add-on)', required: true, notes: 'MAIN — “sold on its own — quotable and orderable, never inside another product”. ADD-ON — “attaches on top of a main posting — quotable on its own line, and spends its own order line”. An add-on IS sold like any other product: the quotation’s service picker lists it under its own Add-ons group at its own price. What differs is where it lands — the posting screen keeps add-ons disabled until a PO and a main product are chosen.' },
              { name: 'Add-on type', type: 'enum', notes: 'Add-on role only. LABEL — a badge printed on the posting (Hot job · Super star, from Master data); DISPLAY PLACEMENT — puts the job in a premium position, and consumes that area’s finite capacity exactly as a booking does.' },
              { name: 'Trial product', type: 'checkbox', notes: 'Default OFF: “ordinary product — appears in every quotation EXCEPT a Trial-package quotation”. ON: it appears in exactly ONE place — a quotation whose Discount programme is set to Trial package (Gói dùng thử) — and nowhere else. A VISIBILITY AXIS, NOT A DISCOUNT: the product still carries its own low price and goes on a purchase order; what changes is that its activation window is 3 months instead of 12. See the “Sản phẩm dùng thử” rule block.' },
              { name: 'Status', type: 'radio (Active · Inactive)', required: true, notes: 'Only Active can be quoted or sold. Inactive covers BOTH a product still being written and one withdrawn from sale, and every past order, entitlement and report that references it still resolves — this is the replacement for deleting a product. Activating is refused while the fulfilment is incomplete, and the message names the missing field.' },
              { name: 'Product description', type: 'i18n rich text', notes: 'Vietnamese required, English optional — the benefit list printed under the line on quotations.' },
            ],
          },
          {
            group: 'New product — Pricing',
            items: [
              { name: 'Price (đ)', type: 'money', notes: 'The catalogue list price. A quotation may discount from it, but this is the anchor — discounting happens on the quotation line so a price can only be cut in one place.' },
              { name: 'Free product', type: 'toggle', notes: 'THE FREE TIER, as built. On: “price is 0, and HQ can post it for any company with no purchase order and no quota. This is what fills the Free job option on the posting screen. Employers never see it on the company site.” A STORED FLAG, never inferred from a price of 0 — a promo line can be 0 ₫ and still have to be drawn from a PO, so deriving this from price would turn every giveaway into an unlimited loophole. Turning it on forces the price to 0.' },
              { name: '≈ per CV', type: 'derived', notes: 'CV search only — price ÷ credit amount, shown live under the price. The deck sells on this number, so it is computed and never typed.' },
            ],
          },
          {
            group: 'New product — Fulfilment (the block changes with Type)',
            items: [
              { name: 'Must be used within', type: 'enum (months)', required: true, notes: 'EVERY TYPE EXCEPT CV SEARCH. Counted from the invoice date; 12 months default (T&C §4). Two clocks, and this is the second: ① quota is granted the moment the invoice is issued, ② it must be used within this window or the unused balance expires. These types have no activation step, so the clause is enforced as a usage window rather than a deadline to press something.' },
              { name: 'Display duration (days) · Auto-refresh', type: 'int · enum', notes: 'Job posting. Display duration is how long ONE published job stays live — a third clock, and what the posting screen shows beside the tier (“Top job · 30 days”). Auto-refresh is “how often a published job is bumped back to the top of the lists it appears in”; blank means never.' },
              { name: 'Placement slots', type: 'row[]', notes: 'Job posting. “Where a job of this tier appears, and for how much of its display window.” Areas come from the Placements registry; coverage per area is Whole display window or First N days. THIS IS THE TIER DEFINITION — there is no separate tier screen, so what Top Job grants is defined here and only here.' },
              { name: 'Includes', type: 'ref[] → Product', notes: 'Job posting. “Products granted with this one. The customer sees a single line — this is not a package.” One quotation line, one price; each include is still provisioned separately. Use a Package when the customer should see the parts priced together.' },
              { name: 'Credit amount · Validity', type: 'int · enum (30 · 90 days)', notes: 'CV search. Credit amount is how many CVs one purchase unlocks. Validity is the term the customer buys, and it runs from the moment they press Kích hoạt. There is deliberately NO “Must be used within” field here: the activation window is fixed at 12 months from the invoice (3 for a trial) by T&C §4 and is not set per product.' },
              { name: 'Placement · Duration (days) · Slots consumed', type: 'ref · int · int', notes: 'Placement booking. Only ACTIVE placements are offered — booking an inactive display area would have nowhere to render. Slots consumed is how many of that area’s pool one sale occupies (1 of 6 on the hero); blank means 1.' },
              { name: 'Quantity · Unit', type: 'int · enum', notes: 'Manual service. Ops fulfils it by hand, so it provisions no entitlement at all — it opens a task. Unit is how an ops task for this service is counted (a post, a send); Quantity is how many the purchase owes.' },
            ],
          },
          {
            /* Kept OUT of the form groups above on purpose: these are specified and
               still true, but the built form does not ask for them today. Mixing
               them in would send an operator hunting for a field that is not there. */
            group: 'Specified, not on the form yet',
            items: [
              { name: 'vatRate', type: 'percent', notes: 'so quotation totals and the VAT e-invoice agree (see CRM → Quotations). The built quotation applies 8% globally rather than reading it per product.' },
              { name: 'version / effectiveFrom', type: 'int / date', notes: 'a price change on a sold product creates a new version rather than editing history — the rule stands, the form has no version control yet.' },
              { name: 'attachesTo', type: 'ref[]', notes: 'add-on only — the parent tiers it may be sold with (Popular Jobs premium → Distinction + Top Job; Highlight premium → Basic Plus only). The build lets any add-on ride any posting.' },
              { name: 'capacity', type: 'int', notes: 'add-on only — finite positions (4 for Popular Jobs, 5 for Highlight Companies); needs the same availability check as a placement booking.' },
              { name: 'slaDays / owningTeam / requiredInputs', type: 'int / enum / text', notes: 'manual_service only — fulfilment SLA, the team that does the work, and what the buyer must supply (copy, image, audience, publish date).' },
              { name: 'entitlementPreview', type: 'derived', notes: 'a plain sentence of what a buyer gets (“10 slots at Top Job, valid 12 months”) — the sanity check before activating.' },
            ],
          },
          {
            /* The entitlement side of the same product — what the ROW means once a
               paid order provisions it. Kept separate from the form groups above
               because these are consequences and derivations, not controls: an
               operator fills in the form, the platform computes these. */
            group: 'What the product grants, once invoiced',
            items: [
              { name: 'activationDeadline', type: 'derived', notes: 'on the entitlement, not the product: invoiceDate + the “Must be used within” window. This is the “Activate by” column on the Invoice list and the date the expiry job reads.' },
              { name: 'quotaAmount', type: 'int', notes: 'how many the buyer receives — CV unlocks come from Credit amount on the product; posting slots come from the QUANTITY on the order line, not from the product, because the same tier is sold in fives and tens.' },
              { name: 'requiresActivation', type: 'bool', notes: 'TRUE only for CV search: the entitlement sits at Chưa kích hoạt until Admin or the employer presses Kích hoạt, and Validity counts from that press. Everything else is usable the moment the invoice is issued — which is why only CV search asks for Validity instead of a usage window. Only ONE activated CV pack per company at a time.' },
              { name: 'creativeSource', type: 'enum', notes: 'placement booking — client upload · company profile (logo auto-pulled) · job posting. Decides what publishing the booking asks the customer for; the form does not capture it yet.' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — Active · Inactive',
            items: [
              'Inactive — not sellable. Invisible to quotations, orders and the company purchasing surface. Covers both "not launched yet" and "withdrawn from sale"; the UI distinguishes them by whether the product has ever been sold, not by a third status.',
              'Active — sellable. It can be quoted, ordered and provisioned. Price and fulfilment are versioned from here on, not edited in place.',
              'Active — sellable: quotable, orderable, provisionable. Deactivating never affects anything already sold — past orders, entitlements and reports keep resolving, which is why nothing is ever deleted.',
              'The transitions are a toggle: Inactive → Active (Activate — requires a price and a complete fulfilment definition) · Active → Inactive (Deactivate). A product that has ever been sold can still be deactivated, but it can never be deleted, and its price becomes version-only from the first sale.',
            ],
          },
          {
            heading: 'The five product types and what each grants',
            items: [
              'Posting tier — N job slots at a given tier, valid for a period. Example: Tin Top Job, 10 slots, 30 days display each. Consumed by publishing a job. What the tier GRANTS (duration, refresh cadence, title styling, search rank, homepage placements, badges) comes from tier config, not from the SKU — otherwise two Top Job products could grant different things.',
              'Placement booking — a named display area for a sold period. Example: Main Banner, Home hero, per week. Consumed by the booking occupying that slot (see Banners & popups + the Placements registry).',
              'Credit pack — a usage allowance with a validity. Example: COMBO 50, 50 CV unlocks / 30 days. Consumed by unlocking a CV.',
              'Add-on (attach-only) — rides on a parent tier and cannot be quoted alone. Example: the 4 fixed premium positions in Popular Jobs, sold only with Distinction or Top Job. Capacity is finite, so it books like a placement.',
              'Manual service — work an ops team performs. Example: a TopDev fanpage post, or an email send to the developer database. Paying it does NOT provision quota; it opens a fulfilment task (Requested → Scheduled → Delivered) that needs proof of delivery before the line counts as fulfilled.',
              'Four of the five resolve to the same shape downstream: an entitlement of (product, remaining quota, validity). Manual service is the exception, and that exception is why it is its own type rather than a flag.',
            ],
          },
          {
            heading: 'What the current CRM catalogue gets wrong (and this screen must not repeat)',
            items: [
              'One capability sold as many SKUs — Basic Plus exists four times at four prices (SMEs, Enterprise, Job, 15 days). Fix: one product, a price list per segment / duration.',
              'Every product has a “(0) … (Tặng)” zero-price twin, doubling the catalogue. A giveaway is a property of the ORDER LINE, not a different product.',
              'Benefits live in a free-text Description as a numbered bilingual list. That text contains the homepage relationship (“Logo công ty được ưu tiên hiển thị tại mục Highlight Companies trên trang chủ”) but the site cannot query it and the VI/EN halves have already drifted. Fix: structured displayEffects + a placementId FK.',
              'Duration variants are separate SKUs (“Basic Plus 15 days”), and test data sits in the live catalogue (“Basic Job - Test Prod”, 10.000 ₫).',
            ],
          },
        ],
        behaviors: [
          'Choosing a type shows only the fulfilment fields that type uses, and the entitlement preview updates as they are filled.',
          'Activating validates that the fulfilment is complete — a product cannot become sellable while it is ambiguous about what the buyer receives.',
          'Editing the price of a product that has never been sold edits in place; editing the price of a sold product creates a new version with an effective date.',
          'Existing orders and entitlements keep the product version they were sold at, so an old order never silently reprices.',
          'Duplicate creates an Inactive copy with a new code — the normal way to build a variant of an existing product.',
          'Archiving hides the product from quotations and the company purchasing surface but changes nothing already sold.',
          'The list shows a sold count per product, which is what tells the product owner whether something is worth keeping.',
        ],
        rules: [
          'Only an Active product can be quoted, ordered or provisioned.',
          'A product SKU is immutable once the product has been sold, because quotations, orders and invoices reference it. Renaming the product is always allowed — that is the point of having a SKU.',
          'A price change on a sold product creates a new version; historical prices are never rewritten.',
          'Fulfilment must be complete before activation: quota and validity for quota-bearing types, a placement + period for placements, attachesTo + capacity for add-ons, SLA + owning team for manual services.',
          'Only an Inactive product that has never been sold can be deleted; everything else is deactivated, never removed.',
          'Every product must declare a VAT rate, so a quotation and its VAT e-invoice cannot disagree.',
          'Posting tiers (Basic · Basic Plus · Distinction · Top Job, plus Free for unpaid posts) are the same fixed vocabulary the job form uses — this screen selects from it and does not invent tiers.',
          'An add-on with an empty attachesTo is not sellable — it can never appear as a standalone quotation line.',
          'A placement product must reference a row in the Placements registry. Size, items shown and rotation cap are read from that row and are read-only here, so a sale cannot invent a slot or contradict the site.',
          'A placement or add-on cannot be sold into a period where its capacity is already full — the quotation line must fail the availability check, not the fulfilment step.',
        ],
        states: [
          'Loading',
          'Empty catalogue',
          'Filtered-empty',
          'New product (type not yet chosen)',
          'Editing Inactive',
          'Editing Active (versioning warning)',
          'Activation blocked (incomplete fulfilment)',
          'Sold product (price is version-only)',
          'Validation errors',
        ],
        backend: {
          dataModel: [
            { name: 'productId', type: 'uuid', required: true },
            { name: 'sku', type: 'string', required: true, notes: 'UNIQUE, immutable after first sale — the column quotation lines, orders, invoices and entitlements all foreign-key against' },
            { name: 'name / description', type: 'i18n jsonb', required: true },
            { name: 'type', type: 'enum', required: true, notes: 'posting_tier|placement|credit_pack|addon|manual_service' },
            { name: 'status', type: 'enum', required: true, notes: 'draft|active|archived' },
            { name: 'ProductVersion', type: 'entity', notes: 'productId, version, listPrice, unit, vatRate, fulfilment jsonb, effectiveFrom — orders reference a VERSION, not the product' },
            { name: 'ProductPrice', type: 'entity', notes: 'productVersionId, segment (SME | Enterprise | …), durationVariant, listPrice — the price list that replaces the CRM’s duplicate per-segment SKUs' },
            { name: 'fulfilment', type: 'jsonb', notes: 'quotaAmount, validityDays, postingTier, placementId, bookingUnit, slotsConsumed, attachesTo[], capacity, slaDays, displayEffects — shape depends on type' },
            { name: 'Placement', type: 'entity', notes: 'placementId, page, name, sizePx, itemsShown, poolCap, rotationSeconds, fillRoute (tier|booked|both), fedBy — the registry the jobseeker site and the catalogue both read' },
            { name: 'PlacementBooking', type: 'entity', notes: 'placementId, companyId, orderLineId, startDate, endDate — the availability ledger. A booking may not push concurrent count past poolCap.' },
            { name: 'ServiceTask', type: 'entity', notes: 'orderLineId, owningTeam, status (requested|scheduled|delivered), dueAt, proofUrl — what a manual_service creates instead of an entitlement' },
            { name: 'soldCount', type: 'derived', notes: 'from paid order lines' },
            { name: 'createdBy / updatedBy / updatedAt', type: 'uuid / uuid / timestamp' },
          ],
          endpoints: [
            'GET /admin/products?type=&status=&q=&page=',
            'POST /admin/products',
            'PUT /admin/products/:id — never-sold products, or non-price fields',
            'POST /admin/products/:id/versions { listPrice, fulfilment, effectiveFrom }',
            'POST /admin/products/:id/activate · /archive',
            'GET /admin/products/:id/usage — orders + entitlements referencing it',
          ],
          integrations: ['CRM (quotations, orders)', 'Account management (entitlements / provisioning)', 'Banners & popups (ad products)', 'Job management (posting tiers)'],
          notes:
            'Order lines must reference a ProductVersion, not a product — that single decision is what makes historical pricing correct and makes a price change safe. The fulfilment jsonb is validated per type at activation, so provisioning can trust it later without defensive checks.',
        },
        acceptance: [
          'A product cannot be activated until its fulfilment says exactly what the buyer receives.',
          'Changing the price of a sold product leaves existing orders priced as sold.',
          'An Inactive product never appears in a quotation or on the company purchasing surface.',
          'Deactivating a product leaves every past order and entitlement resolvable.',
          'A paid order for each of the four types provisions the correct entitlement with the correct quota and validity.',
        ],
        openQuestions: [
          'Who owns catalogue pricing — is a price change an ops action, or does it need approval?',
          'Do we need customer-specific pricing (a negotiated rate for a key account), or is discounting always done on the quotation?',
          'Are prices ever quoted in USD for foreign clients, or is ₫ the only currency?',
          'PRICES MISSING FROM THE DECK: it prices only the CV combos. No price for the hero banner, either adsense placement, the homepage pop-up, or the two premium-position add-ons. The tier prices we have come from the current CRM picker (Basic 2.710.000 · Basic Plus 6.100.000 · Distinction 12.000.000 · Top Job 13.800.000) — confirm those are current.',
          'EMAIL REACH IS STATED FOUR WAYS: 7.500 (Basic Plus), 9.500 (Ultimate), and both 650.000 and 300.000 on the same deck slide 23. Which is the real addressable database?',
          'NAMING COLLISIONS in the deck, which become slot IDs in code: “Highlight Company” is two different things (§1.6 a homepage JOB area for Basic Plus; §2.1 a COMPANY block on search). §1.5 is headed “Các công ty phổ biến” but the product is Popular JOBS; §1.6 is headed “Các công ty nổi bật” but describes jobs. Fix the names before they are built.',
          'The three dual-route placements (Công việc Hot hôm nay, Popular Jobs premium, Highlight Companies premium) need a priority rule: when tier-included jobs and purchased positions compete for the same finite slots, who wins?',
          'Segment vocabulary: the CRM has SMEs / Startup / Enterprise groups. Is that the definitive price-list dimension, and who assigns a company to a segment?',
          'The deck’s Gói Ultimate (16.489.000 ₫, 16 numbered benefits) bundles service commitments we have nowhere to model — CV quality screening, CSKH follow-up, two CV-support milestones (day 11 and 31), one job change before day 15, 60-day display (30 official + 30 warranty), HackerRank assessment integration. Are these sold, or contractual promises?',
        ],
      },
    },
    // 1 · Packages ────────────────────────────────────────────────────────────
    {
      name: 'Packages management',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-bundles',
      detail: {
        description:
          'Bundles: several catalogue products sold together at one package price — Recruit Starter, Recruit Growth, Enterprise. A bundle is a selling wrapper, not a new kind of entitlement: paying for one provisions each of its component products separately, at the component quota. That is what keeps consumption and reporting identical whether a customer bought a bundle or the pieces.',
        userStory:
          'As an HQ product/sales owner, I want to package products at a single price, so that sales can sell a simple story while provisioning and reporting stay per-product.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'search', type: 'string' },
              { name: 'status', type: 'enum', notes: 'Active · Inactive' },
              { name: 'row', type: 'composite', notes: 'name · components · package price · implied discount vs. sum of parts · status · sold count' },
              { name: 'row actions', type: 'buttons', notes: 'Edit · Duplicate · Activate / Deactivate · Archive' },
            ],
          },
          {
            group: 'Definition',
            items: [
              { name: 'code / name (vi / en)', type: 'string / i18n string', required: true },
              { name: 'components', type: 'ProductLine[]', required: true, notes: 'product (Active only) + quantity per line — e.g. Job Posting Pro ×1 + Recommend boost ×1' },
              { name: 'packagePrice', type: 'money (₫)', required: true, notes: 'the single price; "custom / on request" is allowed for Enterprise' },
              { name: 'isCustomPrice', type: 'bool', notes: 'Enterprise-style: no fixed price, quoted per deal' },
              { name: 'sumOfParts / discount', type: 'derived', notes: 'the sum of component list prices and the implied discount — the number the product owner is really deciding on' },
              { name: 'validity', type: 'derived / override', notes: 'defaults to each component’s own validity; an override sets a single bundle validity' },
              { name: 'benefits (vi / en)', type: 'i18n rich text', notes: 'the benefit list printed on the quotation for this package' },
              { name: 'status', type: 'enum', required: true, notes: 'Active · Inactive — same lifecycle as a product' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — same two as a product, one extra constraint',
            items: [
              'Inactive — not sellable. Covers both "still being composed" and "withdrawn from sale".',
              'Active — sellable and quotable. Requires at least two component lines and every component itself Active.',
              'Deactivating a package never touches anything already sold — past orders and entitlements still resolve.',
              'The extra constraint: a package can only be Active while ALL its components are Active. Deactivating a component forces its packages to be revisited rather than silently selling something unprovisionable.',
            ],
          },
          {
            heading: 'A bundle is a selling wrapper, not an entitlement',
            items: [
              'Paying for a bundle provisions each component as its own entitlement, with that component’s quota and validity.',
              'Consumption never knows a bundle existed: publishing a job spends a posting slot from the posting-quota entitlement, whether it arrived alone or inside Recruit Growth.',
              'Reporting is therefore per product AND per bundle: revenue is attributed to the bundle, usage to the components.',
              'This is why the bundle price is stored as a package price with the component list, rather than as a discount rewritten onto each product.',
            ],
          },
        ],
        behaviors: [
          'Adding a component shows its fulfilment inline, so the composer can see what the bundle actually grants.',
          'The sum of parts and the implied discount recalculate live as components are added or quantities change.',
          'Only Active products can be added as components; archived ones are not offered.',
          'Marking a bundle as custom-price hides the package price field and flags it for per-deal quoting (the Enterprise case).',
          'Activation is blocked while any component is Inactive, naming the offending component.',
          'Deactivating a product warns which Active packages reference it, before it is applied.',
          'Duplicate creates an Inactive copy — the way a seasonal variant of a package is made.',
        ],
        rules: [
          'A bundle needs at least two component lines; a single-product "bundle" is just a product.',
          'Every component must be Active for the bundle to be Active.',
          'A bundle provisions its components individually — it never creates a bundle-level entitlement.',
          'The package price is independent of the component prices and is not recomputed from them; the discount shown is informational.',
          'A custom-price bundle cannot be self-served by a company — it must go through a quotation.',
          'Only a never-sold Inactive package can be deleted; everything else is deactivated.',
          'Component quantities are integers of at least 1.',
        ],
        states: [
          'Loading',
          'Empty (no bundles)',
          'New bundle (no components yet)',
          'Composing (discount preview)',
          'Activation blocked (component Inactive)',
          'Custom price (Enterprise)',
          'Editing Active (versioning warning)',
          'Sold package (components pinned)',
        ],
        backend: {
          dataModel: [
            { name: 'bundleId', type: 'uuid', required: true },
            { name: 'code / name / benefits', type: 'string / i18n jsonb / i18n jsonb', required: true },
            { name: 'status', type: 'enum', required: true, notes: 'draft|active|archived' },
            { name: 'BundleLine', type: 'entity', notes: 'bundleId, productVersionId, quantity — pins the component version, like an order line' },
            { name: 'packagePrice / isCustomPrice / vatRate', type: 'money? / bool / percent' },
            { name: 'validityOverrideDays', type: 'int?', notes: 'null = each component keeps its own validity' },
            { name: 'sumOfParts / impliedDiscount', type: 'derived' },
            { name: 'soldCount', type: 'derived' },
          ],
          endpoints: [
            'GET /admin/bundles?status=&q=&page=',
            'POST /admin/bundles',
            'PUT /admin/bundles/:id',
            'POST /admin/bundles/:id/activate · /archive',
            'GET /admin/bundles/:id/usage',
          ],
          integrations: ['CRM (quotations / orders)', 'Account management (per-component provisioning)'],
          notes:
            'Pin component versions on BundleLine exactly as order lines pin product versions, so a component price change does not retroactively alter a bundle that was already sold. Provisioning expands a paid bundle line into one entitlement per component.',
        },
        acceptance: [
          'A package cannot be activated while any component is Inactive.',
          'Paying for a bundle creates one entitlement per component with the right quota and validity.',
          'Consuming quota provisioned by a bundle behaves identically to quota bought directly.',
          'The implied discount shown matches the package price against the sum of component list prices.',
          'Archiving a component surfaces the Active bundles that depend on it before it is applied.',
        ],
        openQuestions: [
          'Can a bundle contain another bundle? (Recommendation: no — it makes provisioning and reporting ambiguous.)',
          'Does the Enterprise "Talent pool" component exist as a catalogue product yet?',
          'If a bundle has an override validity, does it apply to every component or only to quota-bearing ones?',
          'Are bundles ever self-service on the company site, or always sold via a quotation?',
        ],
      },
    },
    // 2 · Placements ──────────────────────────────────────────────────────────
    {
      name: 'Placements registry',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-placements',
      detail: {
        description:
          'The list of display areas on the jobseeker site — 10 on the homepage, 3 on search — each with its size, how many items it shows, its rotation cap and how it gets filled. This is configuration, not content: it mirrors what the jobseeker pages actually render, and both the catalogue and the site read it. Without it, every banner sale restates “1536×371, max 6, rotate 3s” in prose and the two drift.',
        userStory:
          'As an HQ product owner, I want one list of the site’s display areas and how each is filled, so that a placement sale cannot invent a slot, and so anyone can see which products feed which part of the homepage.',
        sections: [
          {
            heading: 'The two fill routes',
            items: [
              'Tier-driven — membership is DERIVED from a job’s posting tier. Nothing is booked and nothing is assigned by hand. Site query: “jobs where tier = X, ordered by last refresh”, with any shuffle SEEDED per (session, query) rather than per reload — a per-reload shuffle breaks pagination.',
              'Booked — a company buys the slot for N days. Site query: “active bookings for this slot today, rotate through them.” Capacity is a hard cap, so the sale needs an availability check.',
              'Both — the same area is fed by a tier AND sold standalone. Three placements are in this state and each needs one resolver with an explicit priority rule.',
            ],
          },
          {
            heading: 'Image slots — the placement decides how many pictures a job must supply',
            items: [
              'A placement row carries `imageSlots: ImageSlot[]` — 0, 1 or 2 entries, each `{ key, label, aspect, minWidth, safeAreas, prefersRole }`. The reference site runs two very different frames on the same grid: the small platinum card is 596×258 (a 2.3:1 strip) and the hero is 600×1120 (a 1:1.9 tower). A card area that shows one thumbnail declares one slot; the large hero card that shows a background AND a thumbnail declares two. Zero means the area is text + logo only. `prefersRole` says whether the frame wants a SUBJECT (a scene) or a BACKGROUND (skyline, texture) — a two-frame hero asking for two subjects gets two photographs fighting each other.',
              'This is what the JOB FORM reads: a job posted on a product feeding a 2-slot placement is asked for 2 images, on a 1-slot placement 1 image, and on a tier with no image-bearing placement it is never asked at all. The count is never typed on the job and never hard-coded in the form.',
              'The LOGO is not a slot. It is pulled from the company profile (creativeSource = company profile) and cannot be replaced per job — that is what keeps a company recognisable across the grid.',
              'ONE PICTURE CANNOT SERVE BOTH FRAMES. A 2.3:1 strip and a 1:1.9 tower share almost no pixels, so a two-frame placement genuinely needs two pictures — not one master cropped twice. Merging asks is only correct for slots with the SAME aspect. Being made to upload the same 3:2 photo three times because a tier lights up three areas is how employers learn to skip the step.',
              'safeAreas records where the card paints its own furniture — the badge bottom-left, the save-star top-right, the gradient behind the title. The picker draws them over the preview so nobody chooses a photo whose subject sits under a chip.',
            ],
          },
        ],
        rules: [
          'A placement is created and edited by HQ only, and only when the jobseeker site actually gains or changes an area — it describes the site, it does not drive it.',
          'Size, items shown and rotation cap are defined here once. A placement product references the row; it never restates them.',
          'A tier-driven placement is not bookable and must not appear in the placement product picker.',
          'A booked placement may never have more concurrent bookings than its pool cap.',
          'A placement with ≥1 image slot may never render an empty frame. The resolver falls through job image → company default → the image gallery’s AUTOMATIC DEFAULT (the job’s industry → its first mapped topic → least-used picture), so a card always has a picture even when the employer skipped the step. Changing a placement from 0 to 1 slots is blocked until every topic those industries map to is stocked.',
          'The same gallery image must not appear twice in one render of one placement. Two logistics companies picking the same warehouse photo, shown side by side, reads as a bug — the resolver pushes the duplicate apart or falls through to the next candidate.',
        ],
        acceptance: [
          'Every homepage and search area in the client deck has exactly one row, with its size and cap.',
          'The placement product picker offers only bookable rows.',
          'Each row states which products or tiers feed it.',
          'The three dual-route placements are visibly flagged as needing a priority rule.',
        ],
        openQuestions: [
          'Are the deck’s sizes final, and are there mobile variants for each placement?',
          'Who may edit a placement — is this locked to engineering, or may an ops owner change a cap?',
        ],
      },
    },
    // 3 · Discount programmes ─────────────────────────────────────────────────
    {
      name: 'Discount programmes',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-promotions',
      detail: {
        requirements: [
          {
            label: 'Two programmes, two different shapes',
            text: 'The client’s promo sheet configured as settings, so the thresholds are a commercial decision somebody edits — not a number compiled into the quotation builder. A programme is matched to a customer by their **customer status** (New · Existing · Churn). There is no code to type and no button for a rep to press.\n\nThe two programmes are not one table with an audience column, because they compute differently: one earns a percentage **per product** from that product’s total quantity, the other applies **one percentage to the whole order** but only while every line stays under a cap.',
            table: {
              cols: ['', 'Chiết khấu theo số lượng', 'Giảm 50% tất cả dịch vụ'],
              rows: [
                ['Customer status', '**Existing**', '**New** and **Churn**'],
                ['Applies to', 'Each **product** — “cùng loại”. Quantities of the same product are summed across the option', 'The whole order, before VAT'],
                ['Rate', '25 → 60%, from that product’s total quantity', 'A flat 50%'],
                ['Condition', 'Total quantity of that product ≥ 2', '**Every** non-gift line ≤ 5 · first PO of the current status spell'],
                ['If the condition fails', 'That line simply earns 0%. Other lines are unaffected', '**The entire 50% is lost** — not just the offending line'],
                ['Stacks with other programmes', 'Yes — it is section 1 of 3 on the client sheet', 'No — explicitly exclusive'],
              ],
            },
            items: [
              'The client sheet says the Existing programme applies **“đồng thời 3 mục”** — three sections at once. Only the volume table has been supplied; the other two sections are missing and are an open question below.',
              'Gift lines (0 ₫, “Tặng”) take no discount, and they must **not** count toward the quantity cap either — otherwise adding a gift would silently destroy the customer’s 50%.',
              'On the New/Churn programme the gift postings carry the **same activation window as the purchased ones** (12 tháng) rather than a window of their own — see Products management → activationWindowMonths.',
            ],
          },
          {
            label: 'Chiết khấu theo số lượng — per product, and the tiers are thresholds',
            text: 'For an Existing customer, the tier is looked up on the **total quantity of each product** in the option — that is what “cùng loại” means — and the resulting percentage is applied to every line of that product.\n\nSo 3 Basic Plus on one line and 4 Basic Plus on another is **7 Basic Plus**: both lines earn 30%, not 25% each for being under 5 separately. Splitting or merging lines must never change the price. Different products in the same option are summed separately.',
            table: {
              cols: ['Tổng số lượng của một sản phẩm trong option', 'Đến', 'Chiết khấu áp dụng cho mọi dòng của sản phẩm đó'],
              rows: [
                ['1', '1', '0% — no discount. The sheet does not print this row, and a rep will otherwise assume 25%'],
                ['2', '4', '25%'],
                ['5', '9', '30%'],
                ['10', '19', '35%'],
                ['20', '29', '40%'],
                ['30', '49', '45%'],
                ['50', '99', '50%'],
                ['100', '∞', '60%'],
              ],
            },
            items: [
              'They are **thresholds**. A total of 7 earns the 5-tier at 30%, not nothing — reading them as exact matches is the single most likely misimplementation here.',
              'Gift lines are excluded from the sum: they are 0 ₫ and were not bought, so a gift must not push a product into a higher tier.',
              'The rate is written onto each **line**, before the option-level discount and before VAT, exactly where the quotation builder already computes it.',
              'Quantities are summed **within one option**, never across options — options are alternatives, so summing across them would price a quotation on services the customer will never buy together.',
            ],
          },
          {
            label: 'Giảm 50% — all-or-nothing on the quantity cap',
            text: 'For a **New** or **Churn** customer, everything on the order is 50% off — but only while every non-gift line is at 5 or under. One line at 6 and the whole 50% disappears, including from the lines that were within the cap.',
            items: [
              'That cliff is the client’s own rule, so the builder must show **which line broke it** rather than silently dropping the total to full price.',
              'The sheet gives two ways out, both of which are a **rep decision** rather than something the system does by itself: quote the Existing volume programme instead, or **split into two documents** (“tách 2 Hóa đơn”) so the customer takes the 50% on one and the volume discount on the other.',
              'First PO **of the current status spell**, not first in the customer’s history: for a Churn customer that is the first PO since they came back, so a returning customer earns it again. It is self-enforcing — that first invoice flips the company to Existing, so the programme simply stops matching.',
              'Not combinable with any other programme.',
            ],
            warn: 'Splitting into two documents is a manual workaround the client already uses, and it produces two POs and two invoices for what the customer experiences as one purchase. Confirm this is acceptable before build — the alternative is to let one quotation carry two programmes, which contradicts “không áp dụng đồng thời”.',
          },
        ],
        description:
          'Where the promotional rules live. A programme states who it applies to (by customer status), how the discount is computed, and what conditions must hold — and the quotation builder reads it and applies it automatically.\n\nThis is deliberately not a coupon-code screen. Nobody types a code, and no rep decides which programme a customer gets: the customer status decides, which is what makes the discounting consistent across the sales team.',
        userStory:
          'As a sales manager, I want the promotion rules configured once, so that every rep quotes the same discount for the same customer and quantity without having to remember a table.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'row', type: 'composite', notes: 'programme · applies to (customer status) · discount · condition · stacks · validity · status' },
              { name: 'name (cell)', type: 'link', notes: 'opens the programme record — the tier table and the conditions around it' },
            ],
          },
          {
            group: 'Programme',
            items: [
              { name: 'programmeId / name', type: 'string', required: true },
              { name: 'audience', type: 'enum[]', required: true, notes: 'the customer statuses this applies to — New · Existing · Churn. This is the ONLY matching input; there is no code and no manual selection' },
              { name: 'kind', type: 'enum', required: true, notes: 'volume_per_product | flat_order — decides which of the fields below apply' },
              { name: 'tiers[]', type: 'table', notes: 'volume_per_product — { minQty, pct }, evaluated as thresholds (highest minQty the SUMMED quantity reaches wins)' },
              { name: 'pct', type: 'percent', notes: 'flat_order — one rate on the option subtotal, before VAT' },
              { name: 'maxQtyPerLine', type: 'int', notes: 'flat_order — every non-gift line must be at or under this or the programme does not apply at all' },
              { name: 'firstPoOfCurrentSpell', type: 'bool', notes: 'flat_order — restricts it to the first PO since the customer entered their current status. For Churn that is the first PO after the win-back, NOT the first in their history' },
          { name: 'exemptFromDiscountApproval', type: 'bool', notes: 'true, and there is no other kind of rate on a quotation — see the rule below. Kept as a field so a future programme could be made approvable without a schema change' },
              { name: 'stackable', type: 'bool', required: true, notes: 'whether it may run alongside another programme on the same quotation' },
              { name: 'giftActivationFollowsPaid', type: 'bool', notes: 'gift lines inherit the paid line’s activation window instead of one of their own' },
              { name: 'status / effectiveFrom / effectiveTo', type: 'enum / date / date', required: true },
            ],
          },
        ],
        behaviors: [
          'Picking a company in the quotation builder resolves the programme from that company’s customer status and applies it immediately — before the rep touches a line.',
          'Changing any quantity — or changing which product a line points at — recomputes the discount, because the tier is looked up on the summed quantity per product.',
          'The discount cells on the quotation are **read-only, always**. They show what the programme granted, and there is no control that hands them back to the rep — the number is a consequence of the quantity and the customer status, not a negotiating position.',
          'A blocked flat programme names the option and the line that blocked it, and restates the two documented ways out.',
          'There is no promotion banner on the quotation either. The programme never varies and is never chosen, so a permanent box restating it would describe something that cannot change; the rates on the lines are the whole interaction.',
        ],
        rules: [
          'The programme is decided by customer status alone. A rep never picks one, so two reps quoting the same customer for the same quantities always produce the same price.',
          'Volume tiers are thresholds, evaluated as the highest tier the SUMMED per-product quantity reaches.',
          'Gift lines earn no discount, are excluded from the quantity cap, and are excluded from the per-product sum.',
          'The flat programme is all-or-nothing across the whole option, not per line.',
          '**No discount approval exists on a quotation.** Every customer is Existing, New or Churn, so a programme always applies; its rate was approved when the programme was configured, and no rep can type a different one. A gate that can never fire is a control in name only, so it was removed rather than left as decoration.',
          'Consequence to accept: a genuine one-off concession cannot be given on the quotation screen at all. If the client wants that, it needs its own programme (or an explicit exception flow) rather than a free-text percentage — which is the point, since a typed percentage is exactly what made the discounting inconsistent between reps.',
          'The programme applied and the rate granted are stored on the quotation line, not recomputed at read time: a later edit to the programme must not silently reprice a quotation already sent.',
        ],
        acceptance: [
          'An Existing customer with a line of 7 gets 30% on that line, and a line of a different product at 1 in the same option gets 0%.',
          'Two lines of the SAME product at 3 and 4 both get 30% — splitting the line does not change the price.',
          'A quotation at 60% exports with no approval step and no warning banner.',
          
          'A New customer with every line at 5 or under gets 50% on the option subtotal, before VAT.',
          'Raising one line to 6 removes the whole 50% and the builder names that line.',
          'Adding a gift line never changes the discount either way.',
          'The discount cells cannot be focused or typed into in any state.',
          'A quotation records which programme was applied and at what rate.',
        ],
        openQuestions: [
          'BLOCKING — the Existing programme is “section 1 of 3”: the sheet says “áp dụng đồng thời 3 mục bên dưới”, but only the volume table was supplied. Needed from the client: (a) the heading and content of sections 1.1.2 and 1.1.3, (b) the qualifying condition in “nếu KH thỏa điều kiện”, and (c) how the three combine — additive (25 + 10 + 5 = 40%) or compounding (100 × 0.75 × 0.90 × 0.95 = 64% of list, i.e. 36% off). The two give different prices on every quotation, so this cannot be guessed.',
          'Also needed for sections 2 and 3: is there a ceiling on the combined discount, and does it apply per line or to the order?',
          'Is the split-into-two-documents workaround acceptable as the answer for a New/Churn customer over the cap, or should one quotation be allowed to carry both programmes?',
          'RESOLVED 09/08/2026 — “cùng loại” is per PRODUCT: quantities of the same product are summed within an option before the tier is looked up.',
          'RESOLVED 09/08/2026 — “PO đầu tiên” is the first PO since the customer entered their current status, so a Churn customer coming back qualifies again.',
          'RESOLVED 09/08/2026 — there is no discount approval on a quotation at all, and no manual-override path for a rep to type their own percentage.',
        ],
      },
    },
    // 4 · CV search usage ─────────────────────────────────────────────────────
    {
      name: 'CV search usage',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-cv-search-usage',
      detail: {
        description:
          'HQ\u2019s view of the CV-search product AFTER it is sold \u2014 one row per package sold, showing how much of it is actually being used. It sits first in the Service menu because CV search is the service customers buy and then quietly fail to use, and an unused package is a renewal that will not happen. This page is not a report anybody reads monthly; it is a WORK QUEUE for Sales, and every column exists to answer "who do I call today".',
        userStory:
          'As HQ / Sales, I want to see which customers bought CV search and are not using it, so that I can reach them while the package still has time left instead of finding out at renewal.',
        keyPoints: [
          {
            vi: 'Ch\u1ec9 s\u1ed1 quan tr\u1ecdng nh\u1ea5t kh\u00f4ng ph\u1ea3i doanh thu, m\u00e0 l\u00e0 \u201cmua nh\u01b0ng ch\u01b0a d\u00f9ng\u201d \u2014 g\u00f3i kh\u00f4ng d\u00f9ng l\u00e0 h\u1ee3p \u0111\u1ed3ng s\u1ebd kh\u00f4ng gia h\u1ea1n.',
            en: 'The number that matters here is not revenue, it is BOUGHT-BUT-IDLE. An unused package is a renewal that will not happen, and it is only fixable while the package still has time on it.',
          },
          {
            vi: 'Hai th\u1ee9 kh\u00e1c nhau: LO\u1ea0T T\u00ccM (mi\u1ec5n ph\u00ed, kh\u00f4ng gi\u1edbi h\u1ea1n) v\u00e0 L\u01af\u1ee2T M\u1ede CV (t\u00ednh ti\u1ec1n, tr\u1eeb v\u00e0o h\u1ea1n m\u1ee9c). M\u1ed9t kh\u00e1ch t\u00ecm nhi\u1ec1u nh\u01b0ng kh\u00f4ng m\u1edf CV l\u00e0 m\u1ed9t v\u1ea5n \u0111\u1ec1 kh\u00e1c h\u1eb3n kh\u00e1ch kh\u00f4ng \u0111\u0103ng nh\u1eadp.',
            en: 'SEARCHES and CV UNLOCKS are different numbers and must never be merged. Searching is free and unlimited; unlocking is what the package meters. A customer searching hard but never unlocking has a RELEVANCE problem; a customer not searching at all has an ONBOARDING problem. Same low usage, opposite phone call.',
          },
        ],
        sections: [
          {
            heading: 'Package state \u2014 derived, never stored',
            early: true,
            text: 'One pill per row, computed from the two counters. It is derived on read because a stored status would need a job to keep it true, and the inputs already say everything.',
            table: {
              cols: ['State', 'Derived when', 'What Sales does about it'],
              rows: [
                ['Ch\u01b0a d\u00f9ng (idle)', 'searches = 0', 'The urgent one. They paid and never arrived \u2014 call, walk them through one search, book the first unlock.'],
                ['C\u00f2n l\u01b0\u1ee3t (in use)', 'unlocks used < quota, and they are searching', 'Healthy. Watch the burn rate against the expiry date.'],
                ['\u0110\u00e3 d\u00f9ng h\u1ebft (exhausted)', 'unlocks used \u2265 quota', 'The upsell moment \u2014 they exhausted the pack before it expired, so a bigger one is an easy conversation.'],
              ],
            },
            warn: 'A package near expiry with unlocks unspent is the worst combination on this page and currently reads as an ordinary "C\u00f2n l\u01b0\u1ee3t" row. Surface it \u2014 see the open questions.',
          },
          {
            heading: 'Zero-result searches \u2014 two causes, and only one is ours',
            text: 'Every search returning nothing is classified AT QUERY TIME into exactly one of two buckets, never re-guessed afterwards. The page shows the count and links to the queue; the queue itself lives in System \u2192 T\u1eeb kho\u00e1 ch\u01b0a kh\u1edbp, because working a row needs a status, an owner and a decision, none of which fit in a panel.',
            table: {
              cols: ['Bucket', 'Means', 'Owner', 'Target'],
              rows: [
                ['1 \u00b7 Thi\u1ebfu \u1ee9ng vi\u00ean (supply gap)', 'The logic worked: the term was understood, the filters applied, and the pool genuinely holds nobody. NOT a defect.', 'Sales / sourcing', 'Never zero \u2014 it is market information, not a bug.'],
                ['2 \u00b7 Logic ch\u01b0a \u0111\u00fang (our defect)', 'We should have returned somebody and did not \u2014 the term was not understood, a filter excluded the wrong people, a CV was not indexed, or the query errored.', 'Dev + whoever owns the skill taxonomy', 'MUST TREND TO ZERO. This is the one number on the page that is a scorecard.'],
              ],
            },
            warn: 'Keeping these two apart is the whole point of the panel. Merged into one "zero results" figure, a sourcing problem and a broken index look identical, and the number stops meaning anything to either team.',
          },
          {
            heading: 'N\u0103m c\u00e2u h\u1ecfi c\u1ea7n kh\u00e1ch h\u00e0ng quy\u1ebft \u2014 gi\u1ea3i th\u00edch',
            text: 'Nh\u1eefng g\u00ec c\u00f2n \u0111ang m\u1edf tr\u00ean trang n\u00e0y, vi\u1ebft \u0111\u1ec3 \u0111\u1ecdc l\u00e0 quy\u1ebft \u0111\u01b0\u1ee3c ngay. M\u1ed7i d\u00f2ng: hi\u1ec7n t\u1ea1i \u0111ang th\u1ebf n\u00e0o, v\u00ec sao c\u1ea7n ch\u1ed1t, v\u00e0 BB \u0111\u1ec1 xu\u1ea5t g\u00ec.',
            table: {
              cols: ['C\u00e2u h\u1ecfi', 'Hi\u1ec7n t\u1ea1i', 'V\u00ec sao c\u1ea7n ch\u1ed1t', 'BB \u0111\u1ec1 xu\u1ea5t'],
              rows: [
                [
                  '1 \u00b7 G\u00f3i s\u1eafp h\u1ebft h\u1ea1n m\u00e0 c\u00f2n nhi\u1ec1u l\u01b0\u1ee3t m\u1edf CV \u2014 c\u00f3 c\u1ea7n tr\u1ea1ng th\u00e1i ri\u00eang?',
                  'Hi\u1ec3n th\u1ecb nh\u01b0 m\u1ecdi g\u00f3i kh\u00e1c, pill \u201cC\u00f2n l\u01b0\u1ee3t\u201d. Kh\u00f4ng c\u00f3 g\u00ec l\u00e0m n\u00f3 n\u1ed5i l\u00ean.',
                  '\u0110\u00e2y l\u00e0 d\u00f2ng \u0111\u00e1ng g\u1ecdi nh\u1ea5t c\u1ea3 trang: kh\u00e1ch \u0111\u00e3 tr\u1ea3 ti\u1ec1n, ch\u01b0a d\u00f9ng h\u1ebft, v\u00e0 s\u1eafp m\u1ea5t quy\u1ec1n. G\u00f3i c\u00f2n 5 th\u00e1ng th\u00ec ch\u1edd \u0111\u01b0\u1ee3c; g\u00f3i c\u00f2n 2 tu\u1ea7n th\u00ec kh\u00f4ng.',
                  'Th\u00eam tr\u1ea1ng th\u00e1i th\u1ee9 t\u01b0 (c\u00f2n l\u01b0\u1ee3t + d\u01b0\u1edbi 30 ng\u00e0y) ho\u1eb7c m\u1ed9t tab ri\u00eang. Kh\u00e1ch ch\u1ed1t gi\u00fap ng\u01b0\u1ee1ng bao nhi\u00eau ng\u00e0y.',
                ],
                [
                  '2 \u00b7 Tab \u201cCh\u01b0a d\u00f9ng\u201d s\u1eafp x\u1ebfp theo g\u00ec?',
                  '\u0110ang s\u1eafp theo s\u1ed1 l\u01b0\u1ee3t t\u00ecm nhi\u1ec1u nh\u1ea5t.',
                  'Trong ch\u00ednh tab \u201cCh\u01b0a d\u00f9ng\u201d th\u00ec s\u1ed1 l\u01b0\u1ee3t t\u00ecm g\u1ea7n nh\u01b0 b\u1eb1ng 0 h\u1ebft \u2014 s\u1eafp theo n\u00f3 kh\u00f4ng ph\u00e2n bi\u1ec7t \u0111\u01b0\u1ee3c d\u00f2ng n\u00e0o g\u1ea5p h\u01a1n d\u00f2ng n\u00e0o.',
                  'S\u1eafp theo H\u1ea0N D\u00d9NG g\u1ea7n nh\u1ea5t tr\u01b0\u1edbc. G\u1ea5p hay kh\u00f4ng l\u00e0 do c\u00f2n bao nhi\u00eau ng\u00e0y, kh\u00f4ng ph\u1ea3i do h\u1ecd t\u00ecm bao nhi\u00eau l\u1ea7n.',
                ],
                [
                  '3 \u00b7 \u201cCh\u01b0a d\u00f9ng\u201d = d\u01b0\u1edbi 10 l\u01b0\u1ee3t t\u00ecm, hay 0 l\u01b0\u1ee3t m\u1edf CV?',
                  '\u0110ang l\u00e0 d\u01b0\u1edbi 10 l\u01b0\u1ee3t t\u00ecm.',
                  'Hai \u0111\u1ecbnh ngh\u0129a ch\u1ecdn ra hai nh\u00f3m kh\u00e1ch kh\u00e1c h\u1eb3n nhau. Kh\u00e1ch T\u00ccM NHI\u1ec0U nh\u01b0ng KH\u00d4NG M\u1ede CV n\u00e0o l\u00e0 v\u1ea5n \u0111\u1ec1 ch\u1ea5t l\u01b0\u1ee3ng k\u1ebft qu\u1ea3 \u2014 Sales g\u1ecdi \u0111i\u1ec7n kh\u00f4ng gi\u1ea3i quy\u1ebft \u0111\u01b0\u1ee3c, ph\u1ea3i l\u00e0 dev + ng\u01b0\u1eddi qu\u1ea3n l\u00fd danh m\u1ee5c k\u1ef9 n\u0103ng.',
                  'T\u00e1ch l\u00e0m HAI: \u201cCh\u01b0a v\u00e0o d\u00f9ng\u201d (0 l\u01b0\u1ee3t t\u00ecm \u2014 vi\u1ec7c c\u1ee7a Sales) v\u00e0 \u201cT\u00ecm nh\u01b0ng kh\u00f4ng m\u1edf\u201d (c\u00f3 t\u00ecm, 0 l\u01b0\u1ee3t m\u1edf \u2014 vi\u1ec7c c\u1ee7a s\u1ea3n ph\u1ea9m). C\u00f9ng \u201c\u00edt d\u00f9ng\u201d nh\u01b0ng hai cu\u1ed9c g\u1ecdi ho\u00e0n to\u00e0n kh\u00e1c nhau.',
                ],
                [
                  '4 \u00b7 HQ c\u00f3 c\u1ea7n xem chi ti\u1ebft t\u1eebng kh\u00e1ch \u2014 ai t\u00ecm, \u0111\u00e3 m\u1edf CV n\u00e0o?',
                  'Kh\u00f4ng c\u00f3. Trang ch\u1ec9 d\u1eebng \u1edf m\u1ee9c g\u00f3i.',
                  'H\u1eefu \u00edch khi h\u1ed7 tr\u1ee3 kh\u00e1ch, nh\u01b0ng m\u1edf ra l\u00e0 nh\u00ecn th\u1ea5y d\u1eef li\u1ec7u c\u00e1 nh\u00e2n c\u1ee7a \u1ee9ng vi\u00ean V\u00c0 h\u00e0nh vi c\u1ee7a t\u1eebng nh\u00e2n vi\u00ean b\u00ean kh\u00e1ch h\u00e0ng \u2014 hai lo\u1ea1i d\u1eef li\u1ec7u nh\u1ea1y c\u1ea3m kh\u00e1c nhau.',
                  'Ch\u01b0a l\u00e0m \u1edf Phase 1: console c\u1ee7a ch\u00ednh kh\u00e1ch \u0111\u00e3 c\u00f3 l\u1ecbch s\u1eed d\u00f9ng. N\u1ebfu l\u00e0m th\u00ec b\u1eaft bu\u1ed9c ghi log truy c\u1eadp nh\u01b0 m\u1ecdi thao t\u00e1c PII kh\u00e1c.',
                ],
                [
                  '5 \u00b7 Ai ch\u1ecbu tr\u00e1ch nhi\u1ec7m nh\u00f3m 2 \u201cLogic ch\u01b0a \u0111\u00fang\u201d?',
                  'Ch\u01b0a ai. Trang hi\u1ec7n con s\u1ed1 nh\u01b0ng kh\u00f4ng g\u1eafn v\u1edbi ng\u01b0\u1eddi n\u00e0o.',
                  'Ch\u1ec9 s\u1ed1 n\u00e0y ch\u1ec9 gi\u1ea3m v\u1ec1 0 n\u1ebfu c\u00f3 M\u1ed8T ng\u01b0\u1eddi theo d\u00f5i n\u00f3 \u0111\u1ec1u \u0111\u1eb7n. Kh\u00f4ng c\u00f3 t\u00ean c\u1ee5 th\u1ec3 th\u00ec n\u00f3 ch\u1ec9 l\u00e0 m\u1ed9t con s\u1ed1 \u0111\u1eb9p tr\u00ean dashboard.',
                  'Giao cho ng\u01b0\u1eddi qu\u1ea3n l\u00fd danh m\u1ee5c k\u1ef9 n\u0103ng (master data), dev h\u1ed7 tr\u1ee3. \u0110\u1eb7t l\u1ecbch xem l\u1ea1i h\u1eb1ng tu\u1ea7n.',
                ],
              ],
            },
            warn: 'C\u00e2u 1 v\u00e0 c\u00e2u 3 \u1ea3nh h\u01b0\u1edfng \u0111\u1ebfn c\u00e1ch t\u00ednh tr\u1ea1ng th\u00e1i, n\u00ean c\u1ea7n ch\u1ed1t TR\u01af\u1edaC khi build. C\u00e2u 2, 4, 5 c\u00f3 th\u1ec3 quy\u1ebft sau m\u00e0 kh\u00f4ng ph\u1ea3i s\u1eeda d\u1eef li\u1ec7u.',
          },
        ],
        uiFields: [
          {
            group: 'Summary cards',
            items: [
              { name: 'searches \u00b7 30 days', type: 'derived count', notes: 'free and unmetered \u2014 the demand signal' },
              { name: 'CV unlocks used / quota', type: 'derived', notes: 'the metered number, summed across live packages' },
              { name: 'unlocks remaining', type: 'derived', notes: 'money already paid for and not yet consumed' },
              { name: 'bought but idle', type: 'derived count of packages', required: true, notes: 'the headline. Counts packages with almost no searching \u2014 the call list' },
            ],
          },
          {
            group: 'Package list \u2014 one row per package sold',
            items: [
              { name: 'package', type: 'link', required: true, notes: 'SKU + validity as sold, e.g. "CV Search 100 \u00b7 6 th\u00e1ng"' },
              { name: 'customer + company code', type: 'link', required: true, notes: 'the code is the handle support and Sales quote to each other' },
              { name: 'quota', type: 'used / total + bar', required: true, notes: 'CV UNLOCKS, not searches' },
              { name: 'remaining', type: 'int', required: true },
              { name: 'sales owner', type: 'ref \u2192 staff', required: true, notes: 'the page is a call list, so it must say whose call it is' },
              { name: 'valid until', type: 'date', required: true, notes: 'read together with remaining \u2014 unspent quota plus a near date is the churn signal' },
              { name: 'state', type: 'derived enum', required: true, notes: 'Ch\u01b0a d\u00f9ng \u00b7 C\u00f2n l\u01b0\u1ee3t \u00b7 \u0110\u00e3 d\u00f9ng h\u1ebft \u2014 see the state table' },
              { name: 'last search', type: 'relative date', required: true, notes: 'recency beats totals: "3 tu\u1ea7n tr\u01b0\u1edbc" on a live package is the row to act on' },
            ],
          },
          {
            group: 'Controls',
            items: [
              { name: 'scope', type: 'segmented', notes: 'T\u1ea5t c\u1ea3 \u00b7 D\u00f9ng nhi\u1ec1u \u00b7 Ch\u01b0a d\u00f9ng \u2014 three saved views, because those are the three questions actually asked' },
              { name: 'search', type: 'string', notes: 'matches package, customer AND company code' },
              { name: 'default sort', type: 'rule', required: true, notes: 'busiest first today. Consider defaulting the "Ch\u01b0a d\u00f9ng" view to soonest-expiry instead \u2014 see open questions' },
            ],
          },
        ],
        backend: {
          dataModel: [
            { name: 'CvSearchEntitlement', type: 'entity', notes: 'companyId \u00b7 productSku \u00b7 unlockQuota \u00b7 unlockUsed \u00b7 validFrom / validUntil \u00b7 orderId \u2014 the sold package. Already exists as the quota the company console reads' },
            { name: 'CvSearchQuery', type: 'event', notes: 'companyId \u00b7 userId \u00b7 terms \u00b7 filters \u00b7 resultCount \u00b7 zeroReason(null|supply_gap|logic) \u00b7 at. `zeroReason` is written AT QUERY TIME by the search service, which is the only place that knows whether the term resolved and whether a filter did the excluding' },
            { name: 'CvUnlock', type: 'event', notes: 'the existing unlock ledger \u2014 companyId \u00b7 userId \u00b7 cvId \u00b7 at. Decrements unlockUsed; already the source for the company-side usage history' },
          ],
          endpoints: [
            'GET /admin/cv-search/usage \u2014 package rows + the four summary counts',
            'GET /admin/cv-search/zero-results?bucket=supply|logic \u2014 counts for the panel; the working queue is served by the unresolved-terms page',
          ],
          integrations: ['Products & packages (the SKU and its quota)', 'CRM (the sales owner and the company record)', 'Resume management \u2192 Resume list (the search and unlock events)', 'Master data \u2192 skill taxonomy (bucket 2 fixes)'],
          notes:
            'Nothing here is a new counter. Both events already exist for the company-facing quota and usage history; this page is a second READ of them, grouped by package instead of by company. Aggregate on read for Phase-1 volumes and revisit only if the list gets slow.',
        },
        acceptance: [
          'A package sold but never searched appears in "Ch\u01b0a d\u00f9ng" with its sales owner named.',
          'Searches and CV unlocks are shown as separate numbers everywhere on the page.',
          'A zero-result search is attributed to exactly one bucket at query time, and the two counts never overlap.',
          '"M\u1edf danh s\u00e1ch x\u1eed l\u00fd" opens the unresolved-terms queue in System \u2014 the panel here never becomes a second place to work rows.',
          'Every row states who at Saramin owns the customer.',
        ],
        openQuestions: [
          '1 \u00b7 G\u00f3i s\u1eafp h\u1ebft h\u1ea1n m\u00e0 v\u1eabn c\u00f2n nhi\u1ec1u l\u01b0\u1ee3t m\u1edf CV \u2014 c\u00f3 c\u1ea7n m\u1ed9t tr\u1ea1ng th\u00e1i ri\u00eang kh\u00f4ng? (Expiring with quota unspent has no state of its own.)',
          '2 \u00b7 Tab \u201cCh\u01b0a d\u00f9ng\u201d n\u00ean s\u1eafp x\u1ebfp theo h\u1ea1n d\u00f9ng g\u1ea7n nh\u1ea5t, thay v\u00ec theo s\u1ed1 l\u01b0\u1ee3t t\u00ecm? (Default sort for the idle view.)',
          '3 \u00b7 \u201cCh\u01b0a d\u00f9ng\u201d ngh\u0129a l\u00e0 d\u01b0\u1edbi 10 l\u01b0\u1ee3t t\u00ecm, hay 0 l\u01b0\u1ee3t m\u1edf CV? (Two definitions pick two different customers.)',
          '4 \u00b7 HQ c\u00f3 c\u1ea7n xem chi ti\u1ebft t\u1eebng kh\u00e1ch \u2014 ai t\u00ecm, m\u1edf CV n\u00e0o? (Per-customer drill-down \u2014 a PII action.)',
          '5 \u00b7 Ai ch\u1ecbu tr\u00e1ch nhi\u1ec7m nh\u00f3m 2 \u201cLogic ch\u01b0a \u0111\u00fang\u201d h\u1eb1ng tu\u1ea7n? (Who owns the defect bucket.)',
          '\u2192 Gi\u1ea3i th\u00edch \u0111\u1ea7y \u0111\u1ee7 t\u1eebng c\u00e2u \u1edf b\u1ea3ng \u201cN\u0103m c\u00e2u h\u1ecfi c\u1ea7n kh\u00e1ch h\u00e0ng quy\u1ebft\u201d ngay tr\u00ean \u2014 c\u00f3 hi\u1ec7n tr\u1ea1ng, l\u00fd do v\u00e0 \u0111\u1ec1 xu\u1ea5t c\u1ee7a BB.',
        ],
      },
    },
  ],
}
