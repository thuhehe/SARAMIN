import type { BuildModule } from './types'

/*
 * CRM — Sales & customer lifecycle (HQ Admin).
 *
 * A module separate from the jobseeker flow: the sales team manages companies
 * as customers and moves each deal through the document flow Proposal → Qualified
 * → Negotiation → PO → Invoice (+ Lost). sending the PO is the "won" moment — the rep then
 * hands off to Account management, which activates the customer (creates the
 * account, provisions products/quota, and — for Job Posting — the public company
 * page). One company record is born here as New — a company that has never bought
 * anything from us yet — and grows up.
 *
 * Also here: the sales back office (Quotations → PO → VAT e-invoice, plus
 * Payments and Contracts). One document chain, each step created from the one
 * before it and never retyped:
 *
 *   Quotation (Báo giá, 1–3 options)   Sales, QUO-xxxxxx-MM-YYYY
 *        │ expires at the END OF ITS MONTH · customer picks one option
 *        ▼
 *   PO  ── issued to the customer ──▶ deal = PO (won). Provisions NOTHING.
 *        │ PO-xxxxxx-MM-YYYY · also expires at the end of its month
 *        │
 *        ├─ (optional) Sales issues a DRAFT invoice — hóa đơn nháp.
 *        │             No legal number, grants the customer nothing.
 *        ▼
 *   Sales requests the official invoice ──▶ it sits in Kế toán's queue
 *        │
 *        ▼
 *   OFFICIAL VAT e-invoice — hóa đơn chính, 1C26TTD-nnn, filed by Kế toán
 *        ──▶ deal = Invoice (closed) · customer status New→Existing
 *        ──▶ Account management provisions products + gifts IMMEDIATELY
 *        ──▶ the product's activation window starts (12 months by default)
 *
 * Two rules shape the whole chain:
 *
 *   ONLY THE OFFICIAL INVOICE RELEASES THE PRODUCT. A PO grants nothing and a
 *   draft invoice grants nothing, however long either has existed.
 *
 *   EXPIRY BEATS EVERYTHING. A PO still short of an official invoice at the end
 *   of its issue month lapses — Active, Draft invoice or Invoice requested, no
 *   matter what — and its draft invoice is archived with it.
 *
 * Payment is deliberately NOT a gate. Many customers cannot release money until
 * they hold the invoice, so the official invoice may be issued before or after
 * the transfer; payment is tracked as its own axis on both lists. That is a
 * conscious deviation from the client's T&C clause 3 ("the service will be
 * activated after the customer completes the payment & the invoice is issued",
 * source PDF EST-009909-07-2026) — flagged for confirmation on the PO page.
 * Field names and the document layout are modelled on that live PDF.
 *
 * Depth mirrors ./job-management.ts. UI mockups link per feature via `mockup`.
 */

export const crm: BuildModule = {
  id: 'crm',
  title: 'CRM — Sales & customer lifecycle',
  owner: 'Luan',
  edgeCases: [
    {
      label: 'Công ty mẹ & công ty con',
      text: 'A parent and its subsidiary are separate legal entities, so they are separate records with their own tax code, account, billing, quota and sales owner — linked upward by a single parentCompanyId, any number of levels deep. The link is context and navigation only; nothing is shared or inherited down the tree, so a subsidiary can never spend its parent’s quota. A parent and its subsidiary may even belong to different reps.',
    },
    {
      label: 'Mã số thuế trùng nhau',
      text: 'Only an identical full tax code is a duplicate and gets blocked. Same 10-digit root with a different suffix (0301234567 vs 0301234567-001) is a branch — offered as a link, never blocked. A near-identical legal name on a different tax code is a subsidiary ("… Miền Nam", "… Hà Nội") — also offered as a link. Blocking either of the last two is what would stop sales from entering a legitimate new customer.',
    },
    {
      label: 'Một công ty vừa là công ty mẹ, vừa là công ty con',
      text: 'This is normal in Vietnam, not an anomaly, and the model must not assume a company holds only one role. Điều 195 Luật Doanh nghiệp 2020 defines the mẹ/con relationship purely by control — owning >50% of charter capital / ordinary shares, or the right to appoint a majority of the Board or the Director/General Director, or the right to amend the charter — and nothing in it restricts a company to one side of that relationship. A state economic group is written out in exactly these tiers: công ty mẹ = doanh nghiệp cấp I, its subsidiary = cấp II, and that company’s subsidiary = cấp iii, so cấp II is by definition both. Private groups (Vingroup, FPT, Masan…) are not bound by that three-tier cap and often run deeper.\n\nWhat the law forbids is the cycle, not the chain: a subsidiary may not invest in, buy shares of, or contribute capital to its own parent, and subsidiaries of the same parent may not cross-own one another (stricter again where the parent is ≥65% state-owned). So A → B → C is legitimate; A → B → A is not.\n\nThe data model already answers this: parentCompanyId points only at the direct parent, so "both mẹ and con" needs no special case — it is simply a record that has a parent and also has children. The cycle guard on the link modal is therefore enforcing a legal rule, not merely protecting the ancestor walk.',
      warn: 'DECIDED: the UI does not distinguish chi nhánh from công ty con. Every link is labelled “Công ty con”. The split was derived from the tax code and changed nothing a rep could act on — a branch and a subsidiary are both separate customers with their own MST, quota, contracts and invoices, which is the only fact the screen needs to convey. The legal difference (a branch is an đơn vị phụ thuộc with no legal personality, so it cannot own another company) still holds and can be reinstated as a validation rule if a real case demands it; it is not shown as a label. Customers sharing the 10-digit tax root are still surfaced FIRST in the link picker and badged “cùng gốc MST” — the same signal, offered as a suggestion instead of a taxonomy.',
    },
  ],
  requirements: [
    {
      label: 'Record & document numbering — the whole scheme',
      text: 'Two different kinds of identifier, and they follow opposite rules on purpose. A record id (a company) must not be guessable, because it is long-lived and its sequence would reveal how many customers we have. A document number must be sequential and date-stamped, because that is what makes it filable, referenceable on the phone, and — for the VAT invoice — legal.',
      table: {
        cols: ['What', 'Format', 'Example', 'Sequential?'],
        rows: [
          ['Company (record)', 'CO- + 6 encoded chars + 1 check char', 'CO-P9FCEPD', 'NO — deliberately scrambled'],
          ['Quotation', 'QUO-{seq6}-{MM}-{YYYY}', 'QUO-009909-07-2026', 'Yes'],
          ['PO', 'PO-{seq6}-{MM}-{YYYY}', 'PO-005864-08-2026', 'Yes'],
          ['Invoice', 'The e-invoice provider’s own series', '1C26TTD-173', 'Yes — gapless, required by law'],
          ['Customer’s own PO no.', 'Free text, recorded exactly as they give it', 'PO-VP/2026/044', 'Theirs, not ours'],
        ],
      },
      items: [
        'Every number is system-assigned and never editable, except the customer’s own PO number, which is typed in as given.',
        'A company gets its CO- id the moment the record is created — a lead has one before it is ever a customer, and it never changes through lead → customer → churn → win-back.',
        'Sequential numbers DO leak volume: a customer holding QUO-009909 can infer roughly how many quotations we have issued, and two documents dated a month apart reveal the rate. That is accepted for documents and unavoidable for the legal series.',
        'The quotation number leaks the most, because quotations go to every prospect — including ones comparing us with a competitor — while invoices only go to customers. It is also the one number with **no** legal constraint, so it is the only one we could scramble if the client wants to.',
      ],
      warn: 'Resolved — the two documents WE number share one shape, {PREFIX}-{seq6}-{MM}-{YYYY}: QUO- quotation, PO- purchase order. The invoice is the exception and always was — its number comes from the licensed e-invoice provider (1C26TTD-173) and the law requires that series to be the one on record, so a second internal INV- code would only give support two numbers to ask about. The client’s live system numbered the sales order INV-…, which collided with the tax invoice; migrating existing PO records to PO- is a data task to plan, not a format question.',
    },
    {
      label: 'A company has two statuses — they answer different questions',
      table: {
        cols: ['Axis', 'Question it answers', 'Values', 'Stored?'],
        rows: [
          ['Pipeline status', '“Is there a live opportunity right now, and where is it?”', 'Not in pipeline · Proposal · Qualified · Negotiation · PO · Invoice', 'Derived from the open deal'],
          ['Customer status', '“Have they ever paid us, and are they still current?”', 'New · Existing · Churn', 'Stored on the company'],
        ],
      },
      warn: 'The two axes are independent and must never be wired to each other. Losing a deal does not change customer status; winning one does not by itself make them Existing (the invoice does). A company can be Existing AND in Negotiation at the same time — that is a healthy account.',
    },
    {
      label: 'Quote-to-cash — one document chain, each step created from the previous',
      text: 'Nothing is retyped between steps, and nothing is provisioned before the invoice. The invoice is the only event that turns money into product — and it does so immediately.',
      table: {
        cols: ['Step', 'Who', 'Produces', 'Effect'],
        rows: [
          ['Quotation', 'Sales', 'Bilingual PDF, 1–3 options, QUO-xxxxxx-MM-YYYY', 'Deal → Proposal · expires end of month'],
          ['PO', 'Sales', 'PO + payment request; can hold the customer’s own PO no. + file', 'Deal → PO (won) · PO is Active · expires end of month'],
          ['Draft invoice', 'Sales', 'Hóa đơn nháp on the PO — no legal number, nothing filed', 'Nothing. The customer still cannot post a job or open a CV'],
          ['Official VAT e-invoice', 'Kế toán', 'Hóa đơn chính — signed, filed, in the provider’s series', 'Deal closed · New → Existing · **products provisioned immediately** · activation clock starts'],
          ['Payment', 'Kế toán', 'Confirmation against the bank', 'Recorded as a fact on the PO. It may land before or after the invoice — it does not gate it'],
        ],
      },
      items: [
        'A quotation presents 2–3 priced options as alternatives in one document, each with its own line items, VAT, total-after-VAT, amount-in-words and benefits. Exactly one is accepted — reporting must never sum the options.',
        'A quotation’s deal value is one option’s total-after-VAT: the accepted option, or the recommended one while still open.',
        '“Sent” is a state a human declares, not something only our mailer can produce — reps routinely send a PDF by Zalo or from their own mail client.',
        'Separation of duties: **Sales** creates and sends quotations and issues POs; **Kế toán** alone issues the VAT e-invoice and confirms money against the bank. Since the invoice now releases the product, that single Accounting-only click is the whole control — which is why cancelling an issued invoice is also Accounting-only.',
        'The payment step sits last in the table because it is no longer a gate. Where a customer needs the invoice in order to pay, the invoice is issued first and the PO can be cancelled if the money never comes.',
      ],
    },
    {
      label: 'Issuer identity — one setting, every document (System → Issuer identity)',
      text: 'Everything about US that prints on a selling document is configured in one place, never typed per document and never hard-coded in a template. That covers the letterhead the customer sees first — logo, VN + EN legal name, VN + EN address, website — plus the issuer tax code, the VAT rate, the numbering formats and the bank details. Retyping any of it per quotation guarantees the same company eventually appears three different ways across three documents, and a change of office means editing every template.',
      table: {
        cols: ['Setting', 'Prints on', 'Why it must be central'],
        rows: [
          ['Logo + VN/EN legal name + VN/EN address + website', 'Letterhead of quotation, sales order, invoice', 'The block the customer reads first. Both languages always print, exactly as on the client’s source PDF EST-009909-07-2026.'],
          ['Issuer tax code (MST)', 'PO, VAT e-invoice', 'Ours, not the customer’s — the two are adjacent on the page and easy to confuse.'],
          ['VAT rate (currently 8%)', 'Every option total, every invoice', 'A State rate change (T&C clause 6) is then one edit, not a code release.'],
          ['Quotation validity (end OF month)', 'Expiry date', 'Sales policy, so it belongs to sales ops rather than to engineering.'],
          ['Numbering formats — QUO-{seq}-{MM}-{YYYY}, SO-…', 'Document numbers', 'The sequence must stay gapless and concurrency-safe; the format is configurable, the counter is not.'],
          ['Bank details', 'PO', 'Sent with the PO — it is the payment request. The invoice may still be issued before the money arrives.'],
        ],
      },
      items: [
        'Changes are versioned, not retroactive. A quotation already sent keeps the letterhead, VAT rate and bank details it was issued with — reprinting a year-old document must produce the identical page. This is the same snapshot rule the quotation applies to prices and terms.',
        'The rep’s own name and email ("Báo giá bởi / Proposed by") is not a setting — it comes from the signed-in user.',
        'The customer-side billing block (their legal name, Địa chỉ ĐKKD, MST) is not here either: it is read from the company record. Issuer data is central; customer data is per-company.',
      ],
    },
    {
      label: 'Where each document is created — two buttons, two homes',
      text: 'The two create-actions live in different places on purpose, and the reason is that one is always valid and the other almost never is. A quotation can be raised for any company at any time; a sales order can only ever come from an accepted quotation option. Putting each button where it is always meaningful removes the need for a disabled button that has to explain itself.',
      table: {
        cols: ['Action', 'Lives on', 'Availability', 'Why there'],
        rows: [
          ['Tạo báo giá / Create quotation', 'Company detail header (+ the Quotations list title row)', 'always — every company, every status', 'A first quote for a Prospect, a renewal for an Existing customer, a win-back for a Churn — all legitimate. There is no company you may not quote.'],
          ['Tạo PO / Create sales order', 'The accepted row of the Quotations list', 'Only on a quotation with an accepted option that has not lapsed', 'An order copies one accepted option forward. The accepted quotation is the only context where that is possible, so the action belongs on it.'],
        ],
      },
      items: [
        'The company detail header therefore carries exactly one create action — Create quotation — and no Create-PO or Convert-to-customer button. Convert/activation is driven by the invoice, not by a rep pressing a button on the company record.',
        'Opening Create quotation from a company pre-selects that company; opening it from the Quotations list asks for one. Either way the quotation is attached to a company and its deal — never floating.',
        'The order modal copies the accepted option forward: line items (gifts included at 0 ₫), quantities, unit prices, VAT and total-after-VAT, plus the billing data read from the company record — legal name, registered address, tax code. Nothing is retyped, because these are the values the e-invoice must eventually match.',
        'It captures what the quotation cannot: payment terms (100% in advance by default, per clause 3 — though the invoice is not held for them), and the customer’s own PO number + file for customers whose procurement issues one. Customers without a procurement process simply confirm the order we send.',
        'It states the two things reps most often get wrong: issuing the PO is the “won” moment (deal → PO), and it provisions nothing — no account, no quota, no company page — until Kế toán issues the VAT invoice on it. Customer status is unchanged at this step.',
        'A lapsed quotation cannot produce an order even if an option was accepted — extend validity or re-issue as v2 first (T&C clause 2). Enforced server-side on POST /orders, not just by hiding the button.',
      ],
    },
    {
      label: 'PO vs VAT invoice — two different documents, not two names for one',
      text: 'A PO is a commercial document: it records the commitment and asks for money. A VAT e-invoice (hóa đơn GTGT) is a fiscal document: it is legal proof to the tax authority that a taxable sale happened. Conflating them is the most expensive mistake available here — a customer who is sent a PO believing it is the tax invoice cannot claim VAT against it.',
      table: {
        cols: ['', 'PO / Đơn hàng', 'Hóa đơn GTGT / VAT invoice'],
        rows: [
          ['What it is', 'The commitment + the request for payment', 'Legal proof of a taxable sale'],
          ['Binds', 'Us and the customer', 'Us and the tax AUTHORITY'],
          ['Numbering', 'Our own series — PO-005864-08-2026', 'The provider’s legal series — e.g. 1C26TTD-173, gapless, government-controlled. A draft already carries one, which is why there is no second internal code'],
          ['Editable', 'no — issue a new PO instead', 'never — fix by cancel + credit note + re-issue (VN regulation)'],
          ['Cancellable', '**no** — an unused PO simply expires', 'yes — this is where a sale is undone'],
          ['Expires', 'end of the month it was issued in', 'never — an issued invoice is permanent unless cancelled'],
          ['Timing', 'first — the commitment', 'may be issued before OR after the money lands, whichever the customer needs'],
          ['Owner', 'Sales', 'Kế toán only'],
          ['Effect', 'Deal = won', 'Only the OFFICIAL one: deal closed · customer status → New · **products provisioned immediately** · activation clock starts. A draft has no effect at all'],
        ],
      },
      items: [
        'One line: the PO says “you agreed to buy this, please pay”. The invoice says “you paid, and here is the document the tax office recognises”.',
        'The PO carries “Ngày xuất hóa đơn” and “Hạn trả”, so it is really acting as a proforma (payment request) rather than a pure purchase order — a legitimate VN pattern. The prefix now keeps the two apart: the proforma is PO-…, the tax invoice INV-…. The client’s live system numbered the PO INV-…, so existing records need migrating.',
        'The PO’s “Ngày xuất hóa đơn” is a planned date. The VAT invoice’s issue date is a fact — and it is the one that starts the activation window (clause 4). Reports must read the invoice date, never the PO’s.',
      ],
    },
    {
      label: 'Provisioning — what happens when the OFFICIAL invoice is issued',
      text: 'Provisioning is the moment a line item becomes usable balance on the customer’s account. It is the only step where a document turns into product, it runs on the **official** invoice being issued — **immediately**, with no queue and no second click — and it lives in Account management; CRM never writes quota directly.\n\nA **draft** invoice provisions nothing. That is enforced in the listener, which subscribes to the official issue event only, not merely in the UI.\n\nWhat the customer sees the instant it runs: the products appear on their company detail page, and they can post a job and open CVs. Nothing else in the chain grants any of that.',
      table: {
        cols: ['Line item on the PO', 'What provisioning grants'],
        rows: [
          ['Dịch vụ tin đăng (Basic / Basic Plus / Premium Job) × N', '+N job-posting slots at that tier → jobTotal'],
          ['Dịch vụ tin đăng … (Tặng) × N', '+N slots as well — gift lines provision identically despite being 0 ₫'],
          ['Dịch vụ tìm kiếm hồ sơ (30 / 90 ngày)', '+N CV unlocks → cvTotal, with the 30- or 90-day usage window'],
          ['Employer Branding Page', 'Enables the public company page → hasPage'],
          ['First purchase only', 'Creates the Account · creates the first login (HR Manager, exactly 1) · creates the public company page for Job Posting customers'],
        ],
      },
      items: [
        '**Provisioning ≠ activation** — two events, two clocks, and T&C separates them. Provisioning: quota lands in the account when the OFFICIAL invoice is issued — a draft grants nothing; nothing is running yet. Activation (clause 4): the customer uses a slot, which must happen within the window declared on that PRODUCT — 12 months by default, 3 on the trial posting — counted from the invoice date, or the unused quota expires. Usage (clause 5): once activated, that posting runs 30 days.',
        'So a customer can buy 10 slots today, use one next week and one in eight months. Provisioning granted all ten at once; each activates separately and burns its own 30-day window. The Invoice list’s “Activate by” column is invoice date + the product’s own activation window — see Products & Packages → Products management.',
        '**Idempotency** (the most likely production bug in the whole chain): the official invoice.issued event can fire twice — an e-invoice provider timeout followed by a retry is normal. Provisioning must be keyed on the invoice ID, or the customer silently receives double quota.',
        '**Reversal** — now a designed path, not a corner case, and still unanswered: cancelling an invoice withdraws quota it has already provisioned. What happens to quota partly consumed? Options: claw back the unused portion · leave it and reconcile on the credit note · block cancellation once any quota is consumed. **This blocks build** — the invoice cancel exists precisely for the invoice-before-payment case, so the claw-back rule will be exercised.',
      ],
    },
    'One company record throughout: created in the CRM with customer status New. It has no login and is invisible to jobseekers until it is activated. No duplicate company records.',
    'On the OFFICIAL invoice being issued (not on the PO, and not on a draft invoice), hand off to Account management: create account → provision products/quota → company page for Job Posting. It runs immediately and it is the only trigger. Activation of an individual slot then follows the customer’s own use, inside the Account management module.',
  ],
  features: [
    // 0 · Customers ───────────────────────────────────────────────────
    {
      name: 'Customers',
      /* Slug PINNED to the pre-rename name (2026-08-23) — a feature's URL derives
         from its name and comment threads are keyed by pathname, so renaming
         without pinning orphans every thread and breaks shared links. */
      slug: 'companies',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'crm-customer',
      detail: {
        requirements: [
          {
            label: 'New company is a page, and what it asks for',
            text: 'Creating a company is a screen of its own, not a dialog: it is long enough to need the whole viewport, it can be linked to and reloaded, and it is reached three ways — “+ New company” on the list, “+ New lead” on the pipeline, and “+ Thêm công ty con” on a company record (which locks the parent).',
            table: {
              cols: ['Section', 'Holds', 'Required in it'],
              rows: [
                ['**Thông tin công ty**', 'The record’s own identity — **defined in its own block, “Tạo Company — Thông tin công ty”**. Leads the form because Loại công ty gates everything under it.', 'Legal name · MST · Địa chỉ đăng ký'],
                ['**Thông tin xuất hóa đơn**', 'Who the invoice is issued to — **defined in “Thông tin xuất hóa đơn — mặc định trên hồ sơ”**. Inherits from the group above when the buyer IS the company.', 'Phân loại người mua'],
                ['Thông tin cơ bản', 'Industry, company size, quốc gia đăng ký, tỉnh/thành, website. THIRD — identity and invoice come first.', 'None'],
                ['Company verification document', 'Business licence / tax registration / signed contract upload', 'None at creation — see below'],
                ['Primary contact', 'Name, title, phone, email', 'Name · Phone · Email'],
                ['Sales', 'Lead source, sales owner, products interested, estimated value, description', 'Sales owner'],
              ],
            },
          },
          {
            label: 'Tạo Company — Thông tin công ty: 3 field định danh, một field phân loại',
            text: 'Nhóm đầu của form tạo (và của Basic-info card — luật mirror) là **định danh của chính công ty**: nó trả lời *“pháp nhân này là ai”*, tách khỏi *“hóa đơn xuất cho ai”* của nhóm dưới. Ba field định danh là bắt buộc; cộng **Người liên hệ** và **Sales owner** thành 5 field của cửa Customers — **4** với công ty nước ngoài, vì MST của họ chỉ còn là mã tham chiếu.\n\n**Điều kiện CHẶN tạo công ty chỉ có một: MST không trùng** — unique trên cả Customers lẫn Free data. Mọi thứ khác trong nhóm (Verify, chip kết quả, danh sách trùng gốc) là thông tin, không phải cổng.',
            table: {
              cols: ['Field', 'Bắt buộc', 'Hành vi'],
              rows: [
                ['**Loại công ty**', '✓ — mặc định *Công ty trong nước*', 'Hỏi ĐẦU TIÊN: nó đổi nghĩa của ô MST ngay dưới và gate các phân loại ở Thông tin xuất hóa đơn (block riêng). Đổi loại thì kết quả Verify cũ bị xóa.'],
                ['**Tên đơn vị / Legal name**', '✓', 'Đúng như ĐKKD. Verify “có tồn tại” thì TỰ ĐIỀN từ cơ quan thuế — rep vẫn sửa được (đăng ký thuế thường ghi trụ sở, không phải nơi làm việc).'],
                ['**Mã số thuế (MST)**', '✓ trong nước · **không bắt buộc** nước ngoài', 'Trong nước: 10 số hoặc 10 + “-001”, kèm nút **Verify**. Nước ngoài: nhãn đổi thành *Mã số thuế nước ngoài (tham chiếu)* — mã của nước sở tại, **không có nút Verify** vì không kiểm tra được trên hệ thống thuế VN; đã nhập thì giá trị vẫn chạy check trùng.'],
                ['**Địa chỉ đăng ký MST**', '✓', 'Verify “có tồn tại” thì tự điền. Nước ngoài: nhãn là *Địa chỉ đăng ký* (nước sở tại) — in lên chứng từ thay địa chỉ đăng ký MST.'],
                ['Tên hiển thị', '—', 'Brand name ứng viên biết; bỏ trống thì mọi danh sách dùng tên pháp lý.'],
              ],
            },
            items: [
              'Header form nói luật trước khi nhập: *“bắt buộc 5 thông tin”* (trong nước) / *“bắt buộc 4 thông tin”* (nước ngoài) — đổi Loại công ty là con số và danh sách field trong header đổi theo.',
              'Danh sách “trùng 10 số gốc MST” (gợi ý liên kết chi nhánh / công ty mẹ) chỉ hiện với công ty trong nước — gốc MST là khái niệm của mã số thuế Việt Nam.',
            ],
            warn: 'MST unique so trên FULL STRING (10 số và 10+“-001” là hai giá trị khác nhau, đều hợp lệ) và quét CẢ HAI kho. Trùng Customers → chặn hẳn (banner đỏ duy nhất của form), chỉ về hồ sơ đang giữ số đó. Trùng Free data → cũng không tạo mới: banner amber mở thẳng dòng pool để phân trực tiếp — công ty lên Customers mang theo dữ liệu danh bạ, thay vì thành bản ghi thứ hai.',
          },
          {
            label: 'Nút Verify — hai chip kết quả, chip nào cũng chỉ để biết',
            table: {
              cols: ['Tình huống', 'Hiển thị', 'Chặn tạo?'],
              rows: [
                ['Verify → số CÓ trên hệ thống thuế', 'Chip xanh **“✓ Có tồn tại trên MST”** — đồng thời tự điền Tên đơn vị + Địa chỉ đăng ký từ cơ quan thuế', 'Không'],
                ['Verify → số KHÔNG có', 'Chip vàng **“✕ Không có tồn tại trên MST”**, kèm câu *“vẫn tạo được công ty, miễn MST không trùng”*', '**Không** — công ty vừa đăng ký có thể chưa lên hệ thống; độ trễ đó là của registry, không phải của khách'],
                ['Không bấm Verify', 'Không chip nào', 'Không — Verify không bắt buộc'],
                ['Sửa ô MST / đổi Loại công ty sau khi verify', 'Chip cũ BIẾN MẤT', '— kết quả verify thuộc về đúng chuỗi đã kiểm, không phải về ô nói chung'],
                ['Loại công ty = nước ngoài', '**Không có nút Verify**', '— không áp dụng: một nút chỉ có thể fail dạy người ta bỏ qua nút'],
                ['Service thuế lỗi / chậm / trả về rỗng', 'Hiện lỗi, không chip', '**Không** — rep nhập tay và đi tiếp. Báo lỗi, đừng khoá form'],
              ],
            },
            items: [
              'AUTOFILL CHỈ ĐIỀN VÀO Ô ĐANG TRỐNG — bấm Verify lần nữa không được ghi đè giá trị rep đã sửa.',
              'ĐỊA CHỈ ĐĂNG KÝ LUÔN SỬA ĐƯỢC: đăng ký thuế ghi trụ sở, thường không phải nơi làm việc. Khoá ô này là in sai địa chỉ lên mọi hoá đơn.',
              'GHI LẠI NGUỒN — field nào đến từ Verify và vào lúc nào, để sau này lệch thì truy được về nguồn.',
            ],
            warn: 'FEASIBILITY — câu hỏi mở cho BA. Không có API công khai chính thức, miễn phí và cam kết uptime: dữ liệu đến từ nhà cung cấp thương mại (VNPT · Viettel · MISA, hoặc đại lý bán lại feed của Tổng cục Thuế), điều khoản · chi phí · rate limit · uptime đều khác nhau. Cần chốt: mua dịch vụ, hay bỏ nút. Build form sao cho câu trả lời chỉ đổi MỘT lời gọi, không đổi luồng.',
          },
          {
            label: 'MST check — three outcomes, and the affiliate list that replaces the warning',
            text: 'The check runs on the tax code as it is typed. Only an identical full MST is a duplicate and blocks the save. A shared 10-digit root is not a duplicate — it is the same legal entity’s branches, or two companies that happen to collide — so the form does not judge it. It lists every company on that root and lets the rep link, in either direction, or ignore it. Blocking here is what would stop sales entering a legitimate new customer.',
            table: {
              cols: ['Outcome', 'What the rep sees', 'Blocks the save?'],
              rows: [
                ['Identical full MST', 'Error naming the existing company, with a link to open it', 'YES — the company already exists'],
                ['Same 10-digit root', 'A list of every company on that root: name, full MST, location, sales owner. Each row offers two link directions.', 'No'],
                ['Near-identical legal name on a different MST', 'The same list, matched on name', 'No'],
                ['No match', 'Nothing at all', 'No'],
              ],
            },
            items: [
              'Each row has two buttons, and they have deliberately different cardinality: “↑ Là con của” (the new company is a subsidiary of this one) can be set on at most one row — choosing another releases the first — while “↓ Là mẹ của” (the new company is the parent of this one) can be set on many rows at once. That mirrors the data: one parentCompanyId per record, any number of children.',
              'A running summary states the outcome in words — “Sẽ liên kết: công ty con của X, công ty mẹ của Y, Z” — so the rep never has to read the button states back to know what will be saved.',
              'Using both directions at once is legal: it means the new company sits in the middle of a group. It is also the only way to describe a loop, so the save validates the whole chain and rejects a link that would make a company its own ancestor.',
              'Linking is optional and never blocks the save. A rep who ignores the list creates a standalone record, which is the correct outcome for a genuine MST collision.',
              'Branch (same 10-digit root, -001 suffix) and subsidiary (a different MST) are stored identically — one parentCompanyId. The label shown is derived from comparing the two tax codes.',
            ],
            warn: 'Nothing is inherited across the link, in any direction: each record keeps its own MST, package/quota, quotations, VAT invoices, users and sales owner. A branch can never spend its parent’s quota.',
          },
          {
            label: 'Loại công ty gates the invoice classifications',
            text: '**Loại công ty** — *trong nước* / *nước ngoài* — is asked once, first in Thông tin công ty, and it decides which of the four invoice classifications Thông tin xuất hóa đơn may offer. Offering all four everywhere invites a combination that cannot produce a legal invoice: a Vietnamese company invoiced as a foreign entity, or a foreign one invoiced against a Vietnamese MST it does not have.',
            table: {
              cols: ['Loại công ty', 'Phân loại người mua được phép', 'Vì sao'],
              rows: [
                ['**Công ty trong nước**', 'Doanh nghiệp Việt Nam · Cá nhân có CCCD · Cá nhân không có CCCD', 'MST Việt Nam là mặc định. Hai dạng cá nhân vẫn có, vì **người mua** có thể là một người ngay khi khách hàng là công ty — giám đốc tự trả tiền.'],
                ['**Công ty nước ngoài**', 'Doanh nghiệp nước ngoài · Cá nhân có CCCD · Cá nhân không có CCCD', 'Không có MST Việt Nam để xuất, nên *Doanh nghiệp Việt Nam* không bao giờ là lựa chọn hợp lệ. Hai dạng cá nhân giữ nguyên vì lý do trên.'],
              ],
            },
            items: [
              'Đổi Loại công ty mà phân loại đang chọn không còn hợp lệ → hệ thống **tự chuyển sang phân loại đầu tiên hợp lệ** của loại mới. Để nguyên một lựa chọn đã bị vô hiệu là cách chắc chắn nhất để nó được lưu.',
              'Hint dưới field liệt kê thẳng các lựa chọn sẽ có: “Quyết định các lựa chọn ở Thông tin xuất hóa đơn: … · … · …” — người dùng thấy hệ quả trước khi chọn, không phải sau.',
              'Field này cũng đứng đầu nhóm trên **Basic-info card**, đúng luật mirror. Hồ sơ cũ chưa có field thì suy ra từ phân loại đang lưu (`dn-nn` → nước ngoài, còn lại → trong nước).',
            ],
          },
          {
            label: 'Thông tin xuất hóa đơn — mặc định trên hồ sơ, đổi được theo từng PO',
            text: 'Ở Việt Nam, “xuất hóa đơn theo thông tin nào?” là câu hỏi của **từng giao dịch**, không phải cố định một lần lúc tạo khách hàng: cùng một khách có deal do công ty mẹ trả tiền, deal sếp mua bằng tên cá nhân, deal thanh toán từ pháp nhân nước ngoài. Phần mềm kế toán/bán hàng VN (MISA, Fast…) đều theo một mẫu: **hồ sơ khách giữ thông tin xuất hóa đơn MẶC ĐỊNH, mỗi chứng từ prefill từ đó và cho sửa theo từng chứng từ**.\n\nSaramin làm đúng mẫu đó, ở hai tầng:',
            table: {
              cols: ['Tầng', 'Ở đâu', 'Hành vi'],
              rows: [
                ['**Mặc định** — của hồ sơ', 'Company create / Basic info card', 'Phân loại người mua lưu trên hồ sơ. Khi người mua là **chính công ty** (DN Việt Nam trên hồ sơ trong nước, DN nước ngoài trên hồ sơ nước ngoài) thì mọi dòng hóa đơn **kế thừa từ Thông tin công ty — không nhập tay** (riêng DN nước ngoài không có dòng MST); sửa ở nguồn thì mọi nơi đổi theo, không có bản chép thứ hai. Chỉ hai dạng cá nhân mới nhập field riêng (họ tên, CCCD).'],
                ['**Theo chứng từ** — của PO/hóa đơn', 'Dialog **Issue PO** (từ quotation)', 'Dropdown **“Xuất cho / Phân loại người mua”**, mặc định theo hồ sơ (đánh dấu “— theo hồ sơ”). Đổi loại → bộ field đổi theo đúng bốn hình dạng. **Chỉ áp dụng cho PO/hóa đơn này — không sửa ngược hồ sơ**, trừ khi tích ô “Đặt làm mặc định cho công ty này”.'],
              ],
            },
          },
          {
            label: 'Company detail — Basic info card: what belongs here, and how it is edited',
            text: 'One card holds the company identity. Everything about people lives on the Contacts tab and everything about what they bought lives on Products & billing — so no contact name, email or phone appears on this card. A “primary contact” copy here would be a second place to update and would drift from the Contacts tab within a week.',
            table: {
              cols: ['Field', 'Editable', 'Input', 'Note'],
              rows: [
                ['Company ID', 'never', '—', 'System-assigned at creation, permanent.'],
                ['Legal name', 'Yes', 'Text', 'Required. As written on the MST registration.'],
                ['Tên hiển thị', 'Yes', 'Text', 'The brand name candidates know — last row of **Thông tin công ty** on BOTH this card and the create form (the identity group owns every name the record has). Optional: empty falls back to the legal name everywhere, so it never blocks creation. The Company page tab reads it, never edits it.'],
                ['Tax code (MST)', 'Yes', 'Text', 'Duplicate check on save — see the MST edge case.'],
                ['Công ty mẹ', 'Yes', 'Select — company', 'The direct parent only. Empty = standalone or group root.'],
                ['Industry', 'Yes', 'Select — Master data', 'Its own field, not joined to size. Asked here and on the create form; the Company page does not carry it.'],
                ['Company size', 'Yes', 'Select — band', 'Typed here and on the create form. Its own field, not joined to Industry: the two are filtered separately. See the warn about `employeeCount` below.'],
                ['Loại hình doanh nghiệp', 'Yes', 'Select — 8 values', 'TNHH MTV · TNHH 2TV+ · Cổ phần · DNTN · Hợp danh · Chi nhánh/VPĐD · HTX · Khác. An enum, never parsed out of the legal name — printed on the public company page.'],
                ['Tình trạng (theo MST)', 'Yes', 'Select — 5 values', 'The registration status — see the TÌNH TRẠNG THEO MST requirement. Only “Đang hoạt động” should be invoiced; manual in Phase-1.'],
                ['Ngày thành lập', 'Yes', 'Date picker', 'A full DATE, not a year — the public page derives the years-in-business figure from it. Entered on the Company page tab (“Company at a glance”); shown here too.'],
                ['Người đại diện', 'Yes', 'Text', 'The legal representative on the ĐKKD, printed on the public page. NOT a Contact — contacts are the people we sell to, on the Contacts tab.'],
                ['Company tags', 'Yes', 'Tag picker', 'Editorial labels, many per company.'],
                ['Quốc gia đăng ký / Country of registration', 'Yes', 'Select — Master data (full ISO 3166-1)', 'Gates the province field below. NOT “Quốc tịch”: a company has a country of registration, not a nationality.'],
                ['Tỉnh / Thành phố', 'Yes', 'Select — 34 provincial units', 'Shown only when country = Việt Nam.'],
                ['Địa chỉ xuất hóa đơn', 'Yes', 'Text', 'Named for what it is FOR, not “Address”: this is the line that prints on the VAT invoice. Required for every buyer type, including a foreign company with no MST. Sits directly under Phân loại người mua, because it belongs to the same decision. NO map picker — a pin is not what gets printed, and offering one invites a mismatch between the coordinates and the text on a filed document.'],
                ['Website', 'Yes', 'Text', 'Sits after address. Read mode renders it as a link.'],
                ['Lead source', 'Yes', 'Select — Master data', 'How the company first reached us.'],
                ['Sales owner', 'Yes', 'Select — user', 'Reassignment is an audited change.'],
                ['Products interested', 'Yes', 'Checkboxes', 'Pre-sale intent. What they actually bought is a different fact, on Products & billing.'],
                ['Estimated deal value', 'Yes', 'Number (₫)', 'The rep’s own estimate; the quotation total supersedes it.'],
                ['Description', 'Yes', 'Text', 'Free notes about the company.'],
              ],
            },
          },
          {
            label: 'Basic-info card — sửa hồ sơ chạy đúng luật của form tạo',
            table: {
              cols: ['Luật', 'Trên form tạo', 'Trên Basic-info card (Edit)'],
              rows: [
                ['**Loại công ty** đổi nghĩa ô MST', 'Đổi label · bỏ dấu `*` · ẩn nút Verify khi là công ty nước ngoài', '**Giống hệt** — và đổi cả label *Địa chỉ đăng ký MST* → *Địa chỉ đăng ký*'],
                ['**Loại công ty** gate phân loại người mua', 'Phân loại không hợp lệ → tự chuyển sang phân loại hợp lệ đầu tiên', '**Giống hệt**, ngay trong chế độ Edit'],
                ['**Verify** MST', '2 chip, không chặn; sửa ô MST hoặc đổi loại công ty → chip biến mất', '**Có mặt** — số MST cũng đổi ở đây, người đổi cũng có đúng câu hỏi đó'],
                ['**MST unique**, cả hai kho', 'Trùng Customers → banner đỏ, chặn tạo · trùng Free data → banner amber, mở dòng pool', 'Giống, **trừ một điều**: hồ sơ không được tính là trùng với chính nó — so sánh phải loại bản ghi đang sửa ra'],
                ['**Thông tin xuất hóa đơn** kế thừa', 'Người mua là chính công ty → không có input nào', '**Không có input nào** — chỗ đó là một câu nói rõ “kế thừa từ Thông tin công ty, sửa ở nhóm trên”'],
                ['**Không có “Set as default”**', 'Phân loại chọn lúc tạo chính là mặc định', 'Card ghi một dòng: đây là **mặc định** của công ty, từng PO đổi được lúc phát hành mà không sửa hồ sơ'],
              ],
            },
          },
          {
            label: 'Verified — một cột trên Customers, một nút trên Company detail, và Save làm rớt cờ',
            text: 'Trạng thái xác minh của công ty (**CRM → Sign-up & company verification (ERC)** định nghĩa nó) hiện ở ba chỗ trong CRM, và chỉ ba.',
            table: {
              cols: ['Chỗ', 'Hiện gì', 'Luật'],
              rows: [
                ['**Customers — cột Verified**', 'Tag **Verified** (xanh, hình khiên) · **Waiting to verify** (amber — đã có ERC, chờ admin) · **No paperwork** (slate — chưa có ERC) — đúng tag employer thấy trên Company site. Dưới tag No paperwork một dòng nhỏ: *Chưa có ERC — chờ employer upload*', 'Filter **Verified** có **3 giá trị** = 3 nhãn trên. Nhãn tính lúc đọc từ **verdict + có/không có ERC** (như build: svn-be V482), không lưu. Chip **Chờ verify · n** trên toolbar: một click = lọc *Waiting to verify* — đúng các công ty bấm Verify được ngay. Ở view phòng ban, danh sách hiện luôn các công ty **chưa có owner** — sổ của ai cũng không chứa họ, không hiện ở đây thì không ai thấy để verify.'],
                ['**Company detail — header**', 'Cùng tag đó cạnh tên; Waiting to verify do sửa thì kèm *cần xác minh lại*', 'Nút **Verify company** hiện khi chưa Verified và **chỉ bấm được ở Waiting to verify** — ở No paperwork nút disabled, tooltip nói chưa có gì để đối chiếu và chỉ sang card Enterprise Registration Documents. Không gate theo owner — xác minh là việc của admin, hồ sơ có thể chưa có owner.'],
                ['**Company detail — Verify dialog**', 'Một input: **ERC đã có trên hồ sơ** (≥ 1 tệp). Dưới đó bốn dòng **chỉ để đọc** và đối chiếu với giấy: MST · địa chỉ đăng ký MST · tên pháp lý · sales owner', 'Nút Verify **disabled** khi chưa có ERC. MST và địa chỉ **không chặn** — form Create company đã bắt buộc chúng lúc tạo, nên không thể thiếu trên một hồ sơ đã tồn tại; việc của admin là đọc giấy đối chiếu với hồ sơ. Owner là việc của Sales (Ownership).'],
                ['**Company detail — Basic info · Save**', 'Sửa định danh của hồ sơ **đang Verified** → hồ sơ về **Unverified · cần xác minh lại**', 'Cùng trạng thái với chưa-verify; lý do là thứ nói cho admin sau biết hồ sơ này đã được xem một lần. Bấm Verify lại là xóa.'],
              ],
            },
            items: [
              'CARD “ENTERPRISE REGISTRATION DOCUMENTS (ERC)” — đổi tên từ “Verification documents”. **Nhiều tệp**: giấy chứng nhận có nhiều trang, bản sửa đổi là tờ riêng. Mỗi tệp ghi ai upload: employer (Company site) hay admin upload hộ. Đây là bằng chứng checklist đối chiếu.',
              'PHÂN OWNER LÀ MỘT MỤC CỦA CHECKLIST, không phải bước riêng: công ty đã verified là công ty Sales yêu cầu xuất hóa đơn được, mà yêu cầu là việc của người phụ trách — verified mà không có owner là một hồ sơ không ai đứng tên.',
            ],
          },
        {
          label: 'Company ID — format CO-XXXXXXX',
          text: 'Every company gets a permanent public identifier the moment it is created: the prefix CO- plus 7 characters. It is assigned by the system, never typed, and never changes for the life of the company (lead → customer → churn → win-back). It is not the database key — the database keeps its own bigint primary key and the ID is a reversible encoding of it.\n\nThe breakdown below is the parse contract: it tells the developer which characters decode back to the key and which one is the checksum, so validation is not guesswork.',
          table: {
            cols: ['Part', 'Length', 'In CO-P9FCEPD', 'What it is'],
            rows: [
              ['CO-', '3', 'CO-', 'Fixed prefix, so an ID is self-describing in a log, an export or a support ticket'],
              ['Payload', '6 chars', 'P9FCEP', 'The internal key, scrambled then encoded in Crockford Base32 — decodes back to the bigint key'],
              ['Check character', '1 char', 'D', 'Computed from the 6 payload chars. Rejects a mistyped ID instead of opening the wrong company'],
            ],
          },
          warn: 'The ID is immutable. Never re-issue, re-sequence or “tidy up” company IDs — quotations, orders, invoices, contracts and audit-log entries all reference it, so changing one silently breaks the paper trail.',
        },
        {
          label: 'Company ID — where it is actually used',
          table: {
            cols: ['Surface', 'Shown?', 'Why'],
            rows: [
              ['Company detail — header', 'Yes', 'Confirms you are on the right record; the string support quotes back'],
              ['Company detail — Basic info, first row', 'Yes', 'Copyable field, next to legal name and MST'],
              ['Customers list — search box', 'Searchable', 'Paste an ID and the row is found'],
              ['Customers list — as a column', 'Yes — next to the company name', 'So a rep can read back the ID of a row they are looking at, and match it against an export or a support ticket without opening the record. Rendered small and monospaced so it stays a reference, not a thing to scan by.'],
              ['Record URL', 'Yes — /companies/CO-P9FCEPD', 'Shareable, and does not leak a sequential database key'],
              ['Exports (csv / Excel)', 'Yes', 'The join key when the client reconciles our data against theirs'],
              ['Quotation / PO / invoice PDFs', 'NO', 'Documents identify the customer by legal name + MST — those are the legally meaningful fields'],
            ],
          },
        },
        {
          label: 'TÌNH TRẠNG THEO MST — five statuses, not the tax authority’s eight',
          table: {
            cols: ['Status we store', 'Tax-authority codes folded in', 'What HQ may do'],
            rows: [
              ['Đang hoạt động', '00, 04 — “đang hoạt động” and “đã được cấp GCN ĐKT”', 'Everything: quote, invoice, publish the page, post jobs'],
              ['Tạm ngừng kinh doanh có thời hạn', '05', 'Keep the page live; do NOT start a new contract until it resumes — the suspension has an end date, so this is a pause, not a loss'],
              ['Không hoạt động tại địa chỉ đã đăng ký', '06', 'Stop invoicing and flag to the rep. This is the single strongest predictor of a bad debt in the VN market'],
              ['Đang làm thủ tục giải thể / chờ đóng MST', '03, 07', 'No new PO and no renewal; collect what is outstanding'],
              ['Đã chấm dứt hiệu lực MST', '01', 'Unpublish the page and close the jobs — the legal entity no longer exists'],
            ],
          },
        },
        {
          label: 'Company verification document',
          table: {
            cols: ['Stage', 'Rule'],
            rows: [
              ['At creation', 'Optional. Requiring it here would block a rep entering a lead they just met at an event.'],
              ['Selling — quotation, PO', 'Optional. Warn, do not block.'],
              ['Issuing the VAT e-invoice', 'required to be on file. This is the point where the tax identity has to be real.'],
            ],
          },
        },
        {
          label: 'Công ty con — the UI, in both directions',
          table: {
            cols: ['Case', 'Where it is done', 'Screen'],
            rows: [
              ['Create a subsidiary — from the subsidiary', 'New-company form → Công ty mẹ (tuỳ chọn)', 'A subsidiary is created exactly like any other company; picking a parent is one field on the same form.'],
              ['Create a subsidiary — from the parent', 'Company detail → Công ty liên kết → + Thêm công ty con', 'Opens the same New-company form, titled “Thêm công ty con”, with Công ty mẹ pre-filled and locked (shown as a fixed row, not a picker). This is the answer to “where is the công ty con field” — it is an action, not a field.'],
              ['Attach or move an existing company', 'Company detail → Công ty liên kết → 🔗 Gán quan hệ mẹ / con', 'A modal that works in either direction: “công ty này là công ty con của …” or “… là công ty mẹ của …”. It searches by name / MST / Company ID, lists companies sharing the 10-digit tax root FIRST with a “cùng gốc MST” badge, previews the resulting mẹ → con pair, and warns when the target already has a parent (saving moves it out of its current group). Whichever direction is chosen, the write is the same one field on the child.'],
              ['Detach a company from its group', 'Company detail → Basic info → Edit → Công ty mẹ → clear', 'Clearing the field is what detaches; there is no separate “remove from group” action.'],
              ['See a company’s parent', 'Company detail → Basic info → Công ty mẹ', 'One row, links to the parent record.'],
              ['See a company’s subsidiaries', 'Company detail → “Công ty liên kết — Affiliated companies”', 'derived from the children — never typed. Shows the group tree with each member’s status.'],
              ['See a whole group at once', 'Customers list → click a group tag', 'A banner appears (“🏢 Tập đoàn …”) and the list narrows to that group at every level, across sales owners, with a “Bỏ lọc” to clear it.'],
            ],
          },
        },
        {
          label: 'Contact people vs login users — two independent lists',
          text: 'A company carries two separate populations of people, and neither is ever generated from the other. Confusing them is what makes CRMs rot: sales loses the accountant who has no login, and the seat count fills with people nobody ever spoke to.',
          table: {
            cols: ['', 'Contact person', 'Login user'],
            rows: [
              ['What it is', 'Someone we do business with', 'A login on the Company site'],
              ['Owned by', 'Sales (CRM record)', 'The customer’s HR Manager'],
              ['Needs a login?', 'No — most never have one', 'Yes, that is what it IS'],
              ['Consumes a seat?', 'No', 'Yes — 1 of the 4 seats'],
              ['Typical example', 'CFO who signs off · accountant who receives invoices', 'HR Specialist the customer invited themselves'],
            ],
          },
          items: [
            'Where the same human is both, the two rows are linked and the UI shows 🔗. The link is informational — deleting or disabling one never touches the other.',
            'A contact can be promoted with “Invite as user”, which creates a user row and links it. That is an explicit action, never automatic.',
            'Exactly one contact is the primary contact — the person quotations, orders and invoices are addressed to. A separate optional flag marks decision makers.',
          ],
          warn: 'Never auto-create one from the other, and never delete in pairs. A user leaving the seat does not delete the sales relationship; removing a contact must not lock someone out of the product.',
        },
        {
          label: 'Contact status — five values, each one an instruction',
          table: {
            cols: ['Status', 'Vietnamese', 'What it means', 'What the rep does'],
            rows: [
              ['Active', 'Đang liên hệ', 'Our working contact — reachable and expecting to hear from us', 'Call or email as normal'],
              ['Needs verifying', 'Cần xác minh', 'Details not confirmed — from a name card / web form, or the email has started bouncing', 'Confirm email + phone before this contact goes on a quotation'],
              ['Paused', 'Tạm dừng liên hệ', 'On leave, or they asked us to come back later — still our contact, just not now', 'Do not chase until the resume date (required); use the cover person if urgent'],
              ['No longer here', 'Không còn phụ trách', 'Left the company, retired, or moved department — either way they no longer buy from us', 'Find the successor; record where they went if known'],
              ['Do not contact', 'Không liên hệ', 'They asked not to be contacted — a compliance flag, not an opinion', 'No outreach at all; only a manager can clear it'],
            ],
          },
        },
        {
          label: 'Contact flags — the role a contact plays, separate from their status',
          table: {
            cols: ['Flag', 'Who it usually is', 'What the system does with it'],
            rows: [
              ['primary (exactly one)', 'The HR Manager / buyer', 'Quotations and orders are addressed to them; they are the contact shown on the company row'],
              ['BILLING', 'Kế toán trưởng — often never speaks to Sales', 'Receives the VAT e-invoice and payment chasing'],
              ['◆ Decision maker', 'Director / CFO who signs off', 'Read-only marker for the rep — no automation hangs off it'],
            ],
          },
        },
        {
          label: 'Quốc tịch (country) — and the address fields it gates',
          table: {
            cols: ['Field', 'Vietnamese company', 'Foreign company', 'Source'],
            rows: [
              ['Quốc gia đăng ký / Country of registration', 'Việt Nam (the default)', 'Any other country', 'Master data → Country — the FULL ISO 3166-1 list'],
              ['Tỉnh / Thành phố · City', 'required — pick a province', 'Not shown at all', 'Master data → Locations — all 34 provincial units, International last'],
              ['Address', 'required — số nhà, đường, phường/xã, quận/huyện', 'required — street, city, postal code, country', 'Free text'],
            ],
          },
        },
        {
          label: 'Company name — what is displayed vs what is stored',
          table: {
            cols: ['Surface', 'Shows', 'Falls back to'],
            rows: [
              ['Customers list', 'Short name', 'Legal name'],
              ['Pipeline board card', 'Short name', 'Legal name'],
              ['Company detail header', 'Short name', 'Legal name'],
              ['Quotation / order / invoice', 'legal name always', '— (never the short name)'],
            ],
          },
        },
        {
          label: 'Customer status values — exactly three',
          text: 'Driven by the invoice, not the order. New means “has never bought anything from us”, so every company starts there the moment it is created — there is no separate Prospect status.',
          table: {
            cols: ['Status', 'Means', 'Moves in when', 'Rule'],
            rows: [
              ['New', 'Has never bought from us — no VAT e-invoice has ever been issued', 'Created in the CRM', '**System** sets this at creation — **Sales** never picks it, and there is no field to. Leaves only when **Kế toán** issues the first VAT e-invoice; never on a sent quotation or a confirmed order alone. → Next action: **Sales** quotes them.'],
              ['Existing', 'Has bought at least once — active paid service or a past order', 'First OFFICIAL VAT e-invoice issued', '**System** flips it on invoice.issued. One-way: a win-back after Churn returns here, never to New. **Sales** may override only with a reason, and **System** logs the override. → Next action: **Sales** works the renewal before the 12-month clock runs out.'],
              ['Churn', 'Lapsed — win-back candidate', 'No new order for 12 months since the last invoice', '**System** sets this 12 months past lastInvoicedAt with no new order — nobody clicks it. The same record looping back; a won win-back returns it to Existing, never a new record. → Next action: **Sales** runs the win-back on the quarterly churn cadence.'],
            ],
          },
        },
        {
          label: 'Membership tier — a third axis, and the only one that is pure arithmetic',
          text: 'Chương trình Khách hàng Thân thiết. The tier is a function of one number: the value of the orders this company paid for inside the current programme year. It is never typed and never granted by a rep, and it is independent of the other two axes — a Churn company holds no tier, and an Existing company can be Kim Cương while a deal sits in Negotiation.',
          table: {
            cols: ['Danh hiệu', 'Tích lũy trong năm — từ', 'Đến dưới'],
            rows: [
              ['— (chưa có hạng)', '0 ₫', '30.000.000 ₫'],
              ['Thành viên / Member', '30.000.000 ₫', '50.000.000 ₫'],
              ['Đồng / Bronze', '50.000.000 ₫', '100.000.000 ₫'],
              ['Bạc / Silver', '100.000.000 ₫', '200.000.000 ₫'],
              ['Vàng / Gold', '200.000.000 ₫', '300.000.000 ₫'],
              ['Kim Cương / Diamond', '300.000.000 ₫', '— (không giới hạn)'],
            ],
          },
          items: [
            'Only the lower bound of each band is stored — "đến dưới" is read from the next band up, so the bands can never overlap or leave a gap.',
            'Below the first threshold is a real state ("chưa có hạng"), not an error or missing data: most of the book sits there every January.',
            'Thresholds and the reward catalogue are settings (System → Membership tiers), never code — the programme is re-issued every year and the bands move.',
            'The tier is per legal entity, like everything else on the company: a subsidiary’s orders never raise its parent’s tier.',
          ],
          warn: 'The accumulator resets to 0 ₫ on 1 January and nothing carries over — a Kim Cương customer starts the new year with no tier and climbs again. So the tier must never be a plain stored column someone forgets to clear: it is always computed against a year window, and last year’s figure stays readable as its own row.',
        },
        {
          label: 'Ending a customer relationship — TWO exits, and the question that picks between them',
          text: 'A company leaves a rep’s book by one of exactly two doors, and picking the wrong one is expensive in opposite directions. The question that decides it: **should another sales rep be allowed to pick this company up?**',
          table: {
            cols: ['', 'Trả về bể dữ liệu (release)', 'Archive'],
            rows: [
              ['When', 'The company **still exists** but is no longer worth chasing — hết tiềm năng, không muốn chăm sóc', 'The company is **gone**, or must never be worked again — phá sản · giải thể · sáp nhập · trùng lặp · vi phạm'],
              ['Another rep may claim it?', 'YES — that is the point', 'NO — that is the point'],
              ['Sales owner', 'Cleared', 'Cleared'],
              ['Danh bạ row', 'Flips back to **Chưa nhận** — claimable again via the normal Xin nhận flow', 'Stays consumed. The company never returns to the pool'],
              ['CRM record', 'KEPT, unowned. A re-claim reattaches to it — no duplicate is created', 'KEPT, out of every list. Reversible only as a correction (Unarchive)'],
              ['Reason required?', 'No — an everyday call, one click, reversible with “Nhận lại công ty”', 'YES, from a fixed enum'],
              ['Who can do it', 'The owning rep', 'Sales lead / HQ admin — it hides revenue and pipeline value'],
            ],
          },
          items: [
            'CHURN IS NEITHER OF THESE. Không gia hạn, chuyển sang đối thủ and mất liên lạc are churn: the company exists, the account still works, and it is still worth a win-back call. Churn lives on `account` and the company stays **Active and owned**. Only reach for a door when the rep has decided to stop caring.',
            'RELEASING IS THE COMMON CASE and should feel cheap — no reason, no approval, no confirmation beyond one dialog. It is how a rep hands back a lead that went nowhere, and making it heavy is how books fill with dead weight instead.',
            'ARCHIVING A COMPANY THAT SHOULD HAVE BEEN RELEASED strands a live prospect where nobody will ever see it. RELEASING ONE THAT SHOULD HAVE BEEN ARCHIVED is worse and louder: the row returns to the pool as a lead, another rep claims it, and calls a company that no longer exists — or, for a vi phạm, re-engages one we deliberately barred.',
            'ARCHIVED COMPANIES GET THEIR OWN SCREEN — CRM → **Công ty đã lưu trữ** — not a filter in Customers. A state whose entire purpose is to stop a company generating work must not sit one wrong dropdown away from appearing among live customers, and an operator who wants “the archived list” should not have to find it inside a filter panel. The Customers list therefore has NO archive filter at all: it shows active companies, always.',
            'IT IS A REGISTER, NOT A WORK LIST, and its columns say so: reason · note · date archived · who archived it · sales owner · total revenue. No pipeline, no idle, no last-contact — none of them mean anything for a company nobody will contact again. Sorted by date archived, newest first, because the question asked here is “what happened recently”, never “who do I call”. No “+ New” action: nothing is created on this screen.',
            'IT IS NOT SCOPED TO THE VIEWER’S BOOK. “My archived companies” is not a question anyone asks, but “was this company archived, and why” is — and it is usually asked about a company that was never yours. Search reaches every archived record regardless of owner; the owner is a column and a filter, not a gate.',
            'VI PHẠM IS THE ONE REASON RENDERED IN RED on this screen. Every other reason is a neutral fact; a barred company is the only one where re-engaging it would be a mistake, so it is the only one worth an alarm colour. This is a register, not a company row, so it does not conflict with the row-colour rule.',
            'THE CRM RECORD SURVIVES BOTH. Invoices, POs, quotations, activity and owner history are never deleted by either action — closed-period revenue does not move because a rep gave a lead back.',
            'A RE-CLAIM MUST REATTACH, NOT RE-CREATE. The released pool row keeps its link to the existing CRM company, so approving a new Xin nhận returns the same record with its history intact. Creating a second company for the same MST is the failure this link exists to prevent.',
          ],
          warn: 'Releasing amends the pool’s “a claim never expires” rule — see Danh bạ doanh nghiệp → Pool state. A claim still never expires ON ITS OWN; the owner can hand it back deliberately, which is a different thing and the only way a row moves from Đã nhận back to Chưa nhận.',
        },
        {
          label: 'Sales owner — one current owner, and a full reassignment history',
          text: 'Every company has exactly one current sales owner (account manager), assigned by hand. But the owner changes over an account’s life — a rep leaves, territories are rebalanced, a growing account moves to a key-account rep. The record must keep the whole chain, never silently overwrite it: the company detail carries an **Owner history tab**, so anyone can see who held the account when and — the point of the request — who reassigned it and why.',
          table: {
            cols: ['What the history records', 'Meaning', 'Example'],
            rows: [
              ['Owner (current)', 'The one rep responsible now — derived from the newest entry, not a free field that can drift', 'Nguyễn Thị Lan'],
              ['From → To', 'The tenure window for each owner in the chain', '05/2024 → 02/2025'],
              ['Reassigned by', 'The actor who performed the handover — a Sales lead, and not either the old or new owner', 'Lê Hữu Phong · Sales Lead'],
              ['Reason', 'Why it moved', 'Previous rep left — handed over'],
              ['First entry', 'The creation row: who owned it the moment the lead was created', 'Tạo lead (hệ thống)'],
            ],
          },
          items: [
            'The current owner is derived from the newest history entry — it is never a standalone column that could disagree with the log.',
            'REASSIGNMENT IS ITS OWN ACTION — **“Chuyển giao”** on the Owner history tab — not a field edit on the Basic-info card. It was the card’s Sales-owner dropdown until 2026-08-27, and that had two faults the history tab made visible. It captured no REASON, so this table’s Reason column rendered a field nothing could populate. And because the card is read-only only when you are NOT the owner, the dropdown was offered to precisely the person the rule below excludes: the owning rep could move their own account, silently. The card now shows the owner read-only and points here. The audit line (field · old · new · who · when) is still written; the dialog just also demands the reason.',
            'Only a Sales lead / admin may reassign an owner; a rep cannot quietly pass their own accounts around. ENFORCED, not just stated: the control is gated on the viewer’s ROLE (lead · manager), never on the “are you the owner” flag that gates the rest of the record — that flag would have handed the action to the one person it is meant to exclude.',
            'THE REASON IS REQUIRED, and the dialog will not submit without it. It is the field the history is actually read for months later, when nobody remembers why an account moved — optional, it would be blank on every row that mattered.',
            'Reassigning the owner touches nothing else — contacts, deals, quota, membership tier and the customer relationship all stay put. It changes who is responsible, not what the customer has.',
            'Parent and subsidiary owners are independent (see the edge case): moving the parent’s owner never moves the subsidiary’s.',
            'A brand-new lead shows a single entry — whoever created it still owns it. “Never reassigned” is a real state, not missing history. THE MOCKUP DOES NOT SEED THAT STATE (client, 2026-08-27): every record’s chain is generated FULL — created → reassigned (actor + reason) → released to the pool → claimed back (2-cấp duyệt, or phân trực tiếp) → reassigned → current — because the wireframe exists to show a dev every event type on whichever company they happen to open, and a one-row example demonstrates nothing about the layout or the vocabulary.',
            'IT IS ITS OWN TAB, and the LAST one, not a card in Overview. The chain answers a question asked on purpose a few times a year — “who held this when, and who moved it” — so on Overview it charged every visit a card’s height for an answer almost nobody was looking for. The tab is also kept NARROW: the entries are short rows, and stretched to a wide screen each one becomes a name at the far left and a date at the far right with nothing in between.',
          ],
          warn: 'The owner history is append-only. Never edit or delete a past tenure to “tidy up”: quotations, sales targets and commission all reference who owned the account at the time, so rewriting it breaks the trail.',
        },
        {
          label: 'Ownership actions — one home per action, on BOTH record types',
          text: 'Until 2026-08-27 the direct assignment lived on the pool record’s **Yêu cầu nhận** tab while the owner change lived on the customer’s **Owner history** tab — the same kind of act, in two different places depending on which list the record came from (client feedback). One rule now, and it holds on both record types:\n\n**Owner history** = the timeline plus the DIRECT ownership action. **Yêu cầu nhận** = the request queue and its log — and it exists on customers too, read-only, because the log follows the company in.',
          table: {
            cols: ['Hành động', 'Record', 'Tab', 'Ai'],
            rows: [
              ['**Phân trực tiếp** — gán chủ lần đầu, không qua yêu cầu', 'Free data', '**Owner history**', 'Admin'],
              ['**Chuyển giao** — đổi người phụ trách, lý do bắt buộc', 'Customers', '**Owner history**', 'Sales lead · Manager'],
              ['**Duyệt / Từ chối yêu cầu xin nhận** (2 cấp)', 'Free data', '**Yêu cầu nhận**', 'Admin → Sales lead'],
              ['Đọc **lịch sử yêu cầu** (ai xin, ai bị từ chối, note)', 'CẢ HAI', '**Yêu cầu nhận**', 'mọi người — trên customer là log chỉ đọc'],
              ['Đọc **chuỗi chủ sở hữu** (tenure, release, reclaim)', 'CẢ HAI', '**Owner history**', 'mọi người'],
            ],
          },
          items: [
            'The line between the two tabs is REQUEST vs OWNERSHIP, not read vs write. Approving a claim resolves a REQUEST (and ownership follows); Phân trực tiếp and Chuyển giao write ownership with no request involved — which is why they sit with the timeline they extend, on both record types.',
            'ON A CUSTOMER the Yêu cầu nhận tab is read-only by construction: requests only exist while a company sits in Free data. The tab shows how it got claimed — the approved request there and the reclaim tenure in Owner history are the SAME EVENT seen from two sides, generated from one source so the tabs cannot disagree.',
            'A direct assignment that bypassed a pending request stays visible on the customer’s log as the auto-rejected request with its note (“Đã phân trực tiếp cho {X}”) — the bypass is a bypass of the queue, never of the record.',
          ],
        },
        {
      label: 'Duplicate a quotation — the company is already known',
      table: {
        cols: ['Rule', 'Detail'],
        rows: [
          ['Opens with the company already selected', 'Re-quoting the same customer after a quotation lapsed is the common case. Quoting someone else is the exception the rep opts into by changing the field.'],
          ['“— Chọn công ty —” is not the default', 'It is offered only when the quotation’s company cannot be resolved at all — never as the opening state when it can.'],
          ['Resolution matches every name a company is known by', 'Record name · legal name · short name. A quotation stores the legal name while older rows carry only the display name, so a near-miss must not silently fall back to “no company”.'],
          ['The hint states which case the rep is in', 'Keeping the same company, or switching — and that billing details follow the new company if they switch.'],
          ['**Duplicate is not Revise**', 'Revise makes v2 and supersedes this quotation — same deal, same company. Duplicate starts a new quotation on any company, with no link back beyond a “copied from” reference. Using duplicate where revise was meant leaves two live quotes on one deal.'],
        ],
      },
    },
    {
      label: 'Pipeline card — what a card has to say',
      table: {
        cols: ['Line', 'Shows', 'Why'],
        rows: [
          ['1', 'Company short name', 'Falls back to the legal name when empty.'],
          ['2', 'Industry tag', 'What a rep scans to spot a sector play.'],
          ['3', 'Deal value + last-contact date', 'The money and the freshness, side by side.'],
          ['4', 'Sales owner — Sales-lead view only', 'In Sales view every card is the rep’s own.'],
        ],
      },
    },
    {
      label: 'Contacts table — every field the form asks for',
      table: {
        cols: ['Column', 'From the form', 'Note'],
        rows: [
          ['Contact', 'Full name + Role on this account', 'PRIMARY / BILLING / ◆ decision-maker as inline badges. The name is the link into the contact panel.'],
          ['Title', 'Job title', 'Free text or picked from Master data.'],
          ['Email', 'Email', 'Verified before it is used on a quotation.'],
          ['Phone', 'Phone', 'Was missing from the table entirely.'],
          ['Status', 'Status', 'Five values, each one an instruction — hover gives the action.'],
          ['Has login?', '— derived', 'Whether this person is linked to a login user. Not asked on the form: adding a contact never creates a login.'],
          ['Note', 'Note', 'The human context a status cannot carry.'],
        ],
      },
    },
    {
      label: 'Phân loại người mua — four shapes of one VAT invoice',
      table: {
        cols: ['Phân loại', 'MST', 'CCCD', 'Họ tên người mua hàng', 'Also required'],
        rows: [
          ['Doanh nghiệp Việt Nam', 'REQUIRED', '—', '— (blank)', 'Legal name · address'],
          ['Doanh nghiệp nước ngoài — **only if it has no VN tax code**', 'EMPTY', '—', '— (blank)', 'Legal name · address — STILL required: the invoice must say who it was issued to'],
          ['Cá nhân có CCCD', 'EMPTY', 'REQUIRED', 'REQUIRED — the person’s name', 'Địa chỉ xuất hóa đơn'],
          ['Cá nhân không cung cấp thông tin', 'EMPTY', 'EMPTY', '“Bán cho người tiêu dùng” — printed by the SYSTEM, not typed', 'NOTHING else — no address either. The whole buyer block is that one line.'],
        ],
      },
    },
    {
      label: 'Who does what, and on which screen',
      text: 'The PO screen and the Invoice screen own different halves of the same transaction, and an action belongs on the screen that shows the document it produces. Duplicating an action across both is how a fiscal document ends up created from a screen that cannot display it.',
      table: {
        cols: ['Action', 'Who', 'Where', 'Why there'],
        rows: [
          ['Xuất PO (PDF)', 'Sales', 'PO screen — every state', 'It is the PO’s own document. Available even when expired or cancelled: a copy is what gets asked for after the deal is over.'],
          ['Xuất hóa đơn nháp', 'Sales', 'PO screen — Active only', 'The PO is what a draft is produced FROM. Once the draft exists it is a row on the Invoice list with its own screen.'],
          ['Xem hóa đơn nháp / chính', 'Anyone', 'Invoice screen', 'The invoice screen owns the invoice. One button, and its label names which document it opens.'],
          ['Yêu cầu xuất hóa đơn chính', 'Sales', 'PO screen', 'Asking is a sales act — and it is **disabled while the company is Unverified**, with the reason on the button: an invoice prints the legal name and MST, and nobody has checked those against the certificate yet. Verify first (Company detail), then request.'],
          ['Xuất hóa đơn chính', 'KẾ TOÁN', 'Invoice screen ONLY, and ONLY from status “Invoice requested”', 'Issuing is the fiscal act: it must happen where the number, the signature and the tax code are visible, and only after Sales has asked for it. The PO screen shows “Đang chờ Kế toán” instead of a button.'],
          ['Hủy hóa đơn', 'KẾ TOÁN', 'Invoice screen ONLY', 'Undoing a sale is a fiscal act on the document that granted the quota.'],
        ],
      },
      items: [
        'REMOVED from the PO screen: “Xuất hóa đơn chính” (it is Kế toán’s, and belongs on the invoice), “Xem hóa đơn nháp” (the invoice screen views invoices) and “Tải PDF” / “Xem PO nguồn” on the invoice screen (one was a duplicate download, the other a link to a record the row already names).',
        'A PO whose month lapsed before the OFFICIAL invoice was issued has its draft WITHDRAWN from the invoice list. A draft never had legal force and granted nothing, so leaving it there would pad the invoice register — and the register is what gets reconciled at month end. The record stays on its PO and in the audit log, which is where “what happened to that draft?” is actually asked.',
      ],
      warn: 'KẾ TOÁN MAY ONLY ISSUE FROM “Invoice requested”. A Draft has no Kế toán action at all — it carries the Sales action “Yêu cầu xuất hóa đơn chính”, and the screen says so, because “the request has not been made yet” is a different problem from “I lack the permission” and a missing button cannot tell them apart. There is no path from Draft straight to issued: the request is what records WHO asked and WHEN, which is the first thing anyone reconstructs when an invoice turns out to be wrong.\n\nThe draft preview on the PO renders through the SAME component the Invoice screen uses, in its draft form. A separate “preview” implementation would drift from the document that actually gets issued — which is the one difference nobody would notice until a customer did.',
    },
    {
      label: 'Products & billing tab — what a company bought, and what it still has',
      text: 'Two cards. The left one is the ENTITLEMENT (what they hold now, and what they used to hold); the right one is the DOCUMENT trail (which purchase orders produced it).',
      table: {
        cols: ['Card', 'Shows', 'Rule'],
        rows: [
          ['Products & quota', 'One flat list **grouped by product type** — Job posting · CV search · Display/placement · Manual service — then the items with no PO', 'PRODUCT-FIRST: the product name and its quota are the headline, the PO that bought it is a small line underneath. CURRENT entitlement only — no Đang dùng / Đã kết thúc toggle, because an ended purchase is a document fact and PO history next door already carries its dates. **No grand total.** A CV pack additionally carries its activation state and the Kích hoạt button — this card is one of the two places that button exists (see Products & packages → activation).'],
          ['PO history', 'One row per PURCHASE ORDER: PO number · products in it · value · invoice date · **hạn dùng**', 'One row per thing actually bought. Order / Invoice / Payment as three separate rows was one purchase told three times. Derived from the same source list as the quota card, so the two can never disagree about which PO paid for what. Free jobs are absent from it, correctly — they have no PO.'],
        ],
      },
      items: [
        'NO status column on the PO list. A PO only appears here once it exists, and every row carried the same value — the INVOICE DATE is the useful fact, and an empty one says “agreed but not yet invoiced”, which is money not yet collected.',
        'NO paid/expired badge on a purchase row either. Everything listed was paid — an unpaid product never provisions — so the badge was true of every row. Whether a purchase has ended is said by which list it is in, and by the row being muted.',
        'The PRODUCTS in each PO are named on the row. A PO number alone forces a click to answer the question the row exists to answer.',
        'No “Manage in Account mgmt →” link and no “from CRM · Orders” caption: this IS the place, and where the data comes from is not the reader’s problem.',
      ],
      warn: 'Entitlement is provisioned from the PAID invoice, never picked by hand. A PO with no invoice date has therefore provisioned nothing — the customer has agreed, but the quota does not exist yet. A free job is outside this entirely: it needs no entitlement, because Admin posts it without a PO.',
    },
    {
      label: 'Products & quota — product first, PO underneath',
      text: 'The card is **one flat list of what the company holds**, grouped by product type. The PO is provenance on each line, not the structure of the page.\n\nThe earlier version grouped by purchase order, with the PO as the block header. That put a document number where the answer belongs: a reader opens this card to learn *how many CV unlocks are left*, and had to first work out which order paid for them. The product is the headline; the PO is the small print.',
      table: {
        cols: ['Group', 'Contains', 'Provenance line'],
        rows: [
          ['**Job posting**', 'One row per PO that bought slots — a renewal is its own row, because it has its own expiry.', '`PO-005929-08-2026 · HĐ 15/06/2026 · hạn 31/12/2026`'],
          ['**CV search**', 'ONE ROW PER PACK, each with its own quota and its own activation state — not a merged balance. A pack carries a **Kích hoạt** button when it may be started, and the reason it may not when another pack is running.', 'Same shape, plus the activation line: which clock is running (hạn kích hoạt before, hạn dùng after) and who pressed it.'],
          ['**Display / placement**', 'One row per placement line bought (Main banner, Công ty nổi bật…), quota = lượt đặt.', 'Same shape.'],
          ['**Manual service**', 'One row per service, **plus its delivery log inline** — expandable where the quota is shown, with `+ Ghi nhận đã đăng`.', 'Same shape + “ghi nhận tay”.'],
          ['**Job free**', 'Tin Free (Admin đăng hộ) and Tặng — both are free postings with no PO. Last group, dashed amber border.', '**“N tin đã đăng”, and nothing else.** No provenance line (the heading already says there is no PO) and no status.'],
        ],
      },
      items: [
        'A type with nothing in it is OMITTED, not shown empty — an empty heading tells a reader they are missing something they never bought.',
        'NO grand total. “12/50 slots across 2 POs” is a number nobody quotes: a rep quotes what is left on the line that is still valid, and the lines expire on different days. When there are 2+ POs the card says so once, at the top, and each line names its own.',
        'MANUAL SERVICE is not a separate card any more. It is entitlement bought on a PO like everything else, so it is a line in this list — with its log underneath, because the remaining figure is only trustworthy because those entries are under it.',
        'The free group is titled **Job free** — what those rows ARE. It was “Không thuộc PO nào”, which named only what they lack; the missing PO is already said on each row’s provenance line, so the heading did not need to repeat it.',
        'A free row reports ONE number: **“N tin đã đăng”**. A quota row records that a job was posted; a free row records the same thing, so the two read alike. It carries no running/finished breakdown — a posting counts the moment it goes up, exactly as a paid slot does, and where each job stands is the Jobs tab’s job.',
        'A free row carries NO provenance line either. “Không thuộc PO nào — không qua báo giá…” repeated what the group heading already said, on every row.',
        'TẶNG is grouped WITH Tin Free rather than under its PO. A gifted posting costs the customer nothing and draws on no quota, so from every angle that matters on this card it behaves like a free job — the difference is only how it was agreed.',
        'Every line’s PO appears in PO history, and every PO history row names the products bought on it — both are derived from the same list, so they cannot disagree.',
        'The Jobs tab’s **Trừ từ** column names the PO for a paid posting and the Miễn phí chip for a free one — the same attribution, at the point where the question is asked.',
      ],
      warn: 'A GIFT and a FREE JOB have no PO and no quota. Do not attach them to a PO to make the list uniform, and do not give them a quota number: a gift was negotiated, not ordered, and a free job is defined by the absence of an order. Report them by the postings they produced instead.',
    },
    {
      label: 'One worked example — FPT Software carries every case at once',
      table: {
        cols: ['Case', 'On FPT Software'],
        rows: [
          ['All four product types', 'Job posting (2 lines) · CV search (2 packs — see below) · Display (Main Banner + Công ty nổi bật) · Manual service (Bài đăng Facebook, with its log).'],
          ['**TWO CV packs, one running**', 'The activation rule shown rather than described: `COMBO 400` is **Đang dùng** (kích hoạt 02/08, hạn dùng 31/10) while `COMBO 100 (gia hạn)` sits **Chưa kích hoạt** with its button disabled and the reason on the row — mỗi lúc chỉ một gói CV được kích hoạt.'],
          ['More than one PO', '**2 live POs.** `PO-005649-07-2026` (hạn 31/10/2026) holds the original 25 slots, now **0/25 — đã dùng hết**; `PO-005929-08-2026` (hạn 31/12/2026) holds the renewal plus CV search, both placements and the manual service.'],
          ['A free job', '`Thực tập sinh Kiểm thử (QA Intern)` — no PO, sits beside 6 paid postings. The Jobs header counts it apart: “38/50 posting slots · 1 tin miễn phí (không PO, không trừ slot)”.'],
          ['A gift', '`Tin đăng Basic (Tặng)` under **Job free** — “1 tin đã đăng”. Beside it `Tin Free (Admin đăng hộ)`, also 1. Two rows, one number each.'],
          ['Deduction order visible', 'The older PO is drained to 0 while the newer one still has 12 — that IS the rule (soonest expiry first) shown rather than described.'],
          ['Link', '`?screen=admin-company-list&record=CO-XHWCYJB&tab=Products %26 billing` — the shell takes `record` and `tab` so an example can be linked, not described.'],
        ],
      },
    },
    {
      label: 'Tin miễn phí — Admin just does not pick a PO',
      table: {
        cols: ['Question', 'Answer'],
        rows: [
          ['How is a free job posted?', 'On Create job, leave the PO as **— none (Free job) —** and pick the free product. Selecting a PO instead swaps the list to that PO’s paid lines.'],
          ['Any limit?', '**No.** No cap per company, no cap per month, no expiry on the right to post one, no approval step. The only limit is the product’s own duration (14 ngày, no featured position).'],
          ['Who can?', 'Admin only. Employers never see the free tier — on the Company site they can post only from what they bought, so an employer with no PO has nothing to post from.'],
          ['Does it touch quota?', 'No. Nothing is deducted, because there is no bucket. A company with only free jobs has **no quota at all** — the header stat reads *chỉ tin miễn phí*, not “0 slots left”.'],
          ['Does it make them a customer?', '**No.** Account status stays New (or Churn), revenue stays 0 ₫, membership tier untouched. Customer status means they bought, and they did not.'],
          ['Does it appear on PO history?', 'No, and it should not — there is no PO. When a company has free jobs and no PO the card says exactly that, so a reader does not conclude a PO went missing.'],
          ['How do I tell which jobs were free?', 'The Jobs tab **Trừ từ** column: a **Miễn phí · không chọn PO** chip instead of a PO code. Same column that names the PO for a paid posting.'],
          ['Is a free job a real job?', 'Yes — visible to jobseekers, collects applications, closes on its deadline. The only things it does not do are consume quota and produce a document.'],
        ],
      },
    },
    {
      label: 'List toolbar — Search · Filter · Sort, and nothing else',
      table: {
        cols: ['Control', 'What it is', 'Rule'],
        rows: [
          ['Search', 'One box', 'Filters the rep’s own book, and reaches records outside it via the dropdown — see the search block.'],
          ['▽ Filter', 'One button opening a panel: Industry · Location · Status · Pipeline (· Owner in Sales-lead view)', 'The button carries a count of active filters, so a filtered list is obvious with the panel closed. “Xoá tất cả” resets from inside the panel. Clicking away closes it.'],
          ['Sắp xếp', 'One select', 'Chưa liên hệ lâu nhất (default) · Liên hệ gần đây nhất · Tên công ty A → Z · Doanh thu cao nhất.'],
        ],
      },
    },
    {
      label: 'Search — a rep lists only their own book, but can reach any company',
      table: {
        cols: ['What the rep types', 'What happens', 'Why'],
        rows: [
          ['Nothing', 'Their own book, as always. No dropdown.', 'An empty box must never enumerate other reps’ customers.'],
          ['1 character', 'Dropdown says “gõ ít nhất 2 ký tự”.', 'One letter matches half the database — that is browsing.'],
          ['2+ characters', 'The table filters their own book. A dropdown lists up to 5 matches outside it.', 'Filter and reach at once, from one box.'],
          ['More matches than the cap', 'Footer: “Chỉ hiện 5 kết quả đầu — gõ chính xác hơn (MST hoặc Company ID)”.', 'No pagination and no “see all”: the cap **is** the rule. Pushing toward MST/Company ID pushes toward reaching one record.'],
          ['No match anywhere', '“Không có công ty nào khớp” + a “+ Tạo công ty mới” button.', 'This is the exact moment a duplicate is created. Confirming it exists nowhere, and offering create right there, is the whole point.'],
        ],
      },
    },
    {
      label: 'Read-only on a colleague’s company — what is actually withdrawn',
      table: {
        cols: ['Surface', 'Owned by me', 'Owned by another rep'],
        rows: [
          ['Header', 'Edit · Tạo báo giá · View on jobseeker', 'View on jobseeker only — quoting someone else’s customer is the exact collision ownership exists to prevent'],
          ['Basic info', 'Edit toggle turns the card into fields', 'No Edit; fields render as values'],
          ['Company tags', 'Multi-select picker', 'Disabled, with the reason on hover'],
          ['Enterprise Registration Documents (ERC)', 'Upload · remove', '“Chỉ xem tài liệu” — list stays readable, no upload, no ✕'],
          ['Affiliated companies', 'Gán quan hệ mẹ / con', 'Tree and badges stay; the link action is gone'],
          ['Contacts · Users', '+ Add contact · + Invite user · row actions', 'Lists stay; the Actions cell collapses to “—”'],
          ['Company page', 'Save changes · Publish', 'Editor and preview stay; a “chỉ đọc” note replaces the buttons'],
          ['Log an activity', 'Chat · Call · Meeting composer', 'Composer replaced by a locked note — see the rule below'],
        ],
      },
    },
    {
          label: 'Activities on the company record — **Sales** activity only',
          table: {
            cols: ['Type', 'Sales must provide', 'Integration'],
            rows: [
              ['Chat', 'Channel (Zalo · Facebook Messenger · Email · SMS · Zalo OA · Phone) + a note', '—'],
              ['Call', 'A note; duration / outcome / recording arrive automatically', 'Placed & auto-logged via Calio'],
              ['Document sent / confirmed', 'Nothing — written when the rep sends a quotation or confirms an order', 'From the document chain'],
            ],
          },
        },
        {
          label: 'Logging an activity — three types, and who gets the credit',
          table: {
            cols: ['Type', 'Asks for', 'Notes'],
            rows: [
              ['💬 Chat', 'Channel (Zalo · Messenger · Email · SMS · Zalo OA · Phone · Other) + note + ảnh đính kèm', 'Channel is required — “we chatted” without saying where is not a record. Attachments are screenshots only: an email is its own thread, not a file hanging off a Zalo log.'],
              ['📞 Call', 'Note only', '**no** attachment control: Calio syncs the duration, outcome and recording onto the call automatically, so a manual attach box there is dead weight.'],
              ['🤝 Meeting', 'Date · time · duration · format (their office / our office / Meet / Zoom / other) · note + attachments (ảnh + email)', 'The only type with a moment of its own — a chat is logged when it happened, a meeting is logged against the slot it was held in. The date is constrained — see the block below. No attendee list: the client side is the contact on the record, our side is whoever logs it.'],
            ],
          },
        },
        {
          label: 'Meeting date — the allowed window',
          table: {
            cols: ['Date chosen', 'Allowed?', 'Why'],
            rows: [
              ['Today', 'Yes', 'The normal case.'],
              ['Earlier this month', 'Yes', 'Writing a meeting up a few days late is ordinary work — forcing today’s date would make the record wrong.'],
              ['Any day in a previous month', 'NO', 'That month is a closed KPI period. Backdating into it changes a number that has already been reported.'],
              ['Any future date', 'NO', 'An activity log records what happened. A meeting that has not happened yet is a plan, not an activity — and a future date would push Last contact to a date that has not arrived.'],
            ],
          },
        },
        {
          label: 'last contact (idle) — what it is',
          table: {
            cols: ['Rule', 'Detail'],
            rows: [
              ['Definition', '`idle = today − date of the last contact with the client`. An independent field on the company, unrelated to the pipeline — defined for every company, with or without a deal, and it never blanks out.'],
              ['Resets on', 'Real human contact only: a logged activity (chat · call · meeting), or a document actually sent to or confirmed by the client.'],
              ['Never resets on', 'System events — auto-reminders, provisioning, quota decrements, page publishes, housekeeping stage changes. Otherwise a silent client looks healthy.'],
              ['One rule everywhere', 'Same definition, same thresholds table, same display in Customers and on the Pipeline board. A number must not mean two things in two places.'],
            ],
          },
        },
        {
          label: 'idle — thresholds by expected contact cadence',
          table: {
            cols: ['Relationship type', 'Expected cadence', 'Amber (needs a touch)', 'Red (at risk / escalate)'],
            rows: [
              ['Open deal — any stage', 'Weekly', '7 days', '14 days'],
              ['Existing — onboarding, first 90 days after the first invoice', 'Fortnightly', '14 days', '30 days'],
              ['Existing — active paid service', 'Monthly', '30 days', '60 days'],
              ['New (never bought), no open deal — nurture', 'Monthly', '30 days', '60 days'],
              ['Churn / win-back', 'Quarterly', '60 days', '90 days'],
            ],
          },
        },
        {
          label: 'last contact — the column shows a date, not a gap',
          table: {
            cols: ['State', 'Shows as', 'Example'],
            rows: [
              ['Contacted at some point', 'dd/mm/yyyy of the newest **Sales** activity', '05/07/2026'],
              ['No contact ever logged', 'A distinct state, never a date and never 0', '“Chưa liên hệ” — red'],
              ['Anywhere a duration is what is being said', 'Days, rolling up past 30 days', '“12d ago” · “2m 4d ago” on the activity trail'],
            ],
          },
        },
        {
          label: 'idle — build rules for the developer',
          table: {
            cols: ['Rule', 'Why it is stated'],
            rows: [
              ['Store `lastContactAt` as a timestamp; compute idle at read time', 'A stored day counter goes stale overnight.'],
              ['Sort and filter on the raw timestamp, never the formatted string', 'Otherwise “2m” sorts before “9d”.'],
              ['The event types that reset idle are an explicit allowlist in config', 'This is the single most likely thing to be built wrong.'],
              ['`lastContactAt = null` renders “Never contacted”', 'A distinct state from 0d — and the HIGHEST-priority follow-up, not the lowest.'],
              ['Calendar days · timezone Asia/Ho_Chi_Minh · day boundary at local midnight', 'Public holidays and Tết are NOT excluded.'],
              ['Every threshold lives in settings, editable by the sales lead', 'No deploy to retune a cadence.'],
            ],
          },
        },
        ],
        description:
          'one list of every company — the single source of truth. Each record carries two status dimensions: a pipeline stage (the current deal: Proposal → Qualified → Negotiation → PO → Invoice / Lost) shown on the Pipeline board, and a customer status (account health: New → Existing → Churn) shown on this directory. The Pipeline board is the same list grouped by stage. There is no separate "account list" — Account management (users, products, public page) is just sections on this same record, shown only for customers who bought them. No duplicate company. Corporate groups are modelled inside this list, not beside it: every company — parent, subsidiary, sub-subsidiary — is its own record with its own tax code, its own account, its own billing and its own owner, linked upward by a single parentCompanyId. The link is navigation and context only; nothing is shared or inherited down the tree.',
        userStory:
          'As a sales rep, I want one list that holds every company — from cold lead through paying customer to renewal — so history, account, and status never fragment across two lists.',
        uiFields: [
          {
            group: 'Identity & legal — the “New company” form, top block',
            items: [
              { name: 'legalName', type: 'string', required: true, notes: 'the registered name. Documents (quotation, order, VAT invoice) always print this, never the short name.' },
              { name: 'shortName', type: 'string', notes: 'display / brand name — “Tiki”, “FPT Software”. Every list, board card and detail header shows it and falls back to legalName when empty.' },
              { name: 'taxCode (MST)', type: 'string', notes: 'de-dup key + VAT invoicing. Stored as the full string — 10 digits for a company, 10 + "-" + 3 for a branch (0301234567-001). 0301234567 and 0301234567-001 are two different, both-valid values.' },
              { name: 'parentCompanyId', type: 'ref → Company?', notes: 'the direct parent in the corporate tree; null = a root (a top parent, or a company that stands alone). At most one direct parent — a tree, not a graph — with unlimited depth (parent → subsidiary → sub-subsidiary), the way a Jira subtask chain nests. Picker searches by name or tax code.' },
              { name: 'affiliates', type: 'derived', notes: 'not stored — read from the tree: the ancestor chain up to the root plus the direct children. This is what the "Công ty liên kết / Affiliated companies" block renders.' },
              { name: 'industry', type: 'enum', notes: 'single select from master data — also a list filter and the basis for a sector play' },
              { name: 'companySize', type: 'enum', notes: 'headcount band — 1–9 · 10–49 · 50–200 · 200–500 · 500–1000 · 1000–5000 · 5000+. TYPED on the create form and the Basic info card; it is the value list filters and search facets read.' },
              { name: 'employeeCount', type: 'int', notes: 'the EXACT headcount shown publicly, entered on the Company page tab. Stored separately from `companySize` — see the warn: the two can disagree and nothing currently stops that.' },
              { name: 'location', type: 'enum', notes: 'city / province of the head office, picked from the master-data list — a select, not free text, because it is a list column and a filter' },
              { name: 'address', type: 'string', notes: 'full head-office address (số nhà, đường, phường/xã, quận/huyện). Free text, printed on quotations, invoices and contracts — distinct from location, which is only the province' },
              { name: 'website', type: 'string', notes: 'domain; also the seed for contact-email addresses' },
              { name: 'businessType (Loại hình)', type: 'enum', notes: 'Công ty TNHH một thành viên · Công ty TNHH hai thành viên trở lên · Công ty cổ phần · Doanh nghiệp tư nhân · Công ty hợp danh · Chi nhánh / VPĐD · Hợp tác xã · Khác. An ENUM, not derived from the legal name — “Công ty TNHH MTV Xây dựng Cổ Phần Hoá” would parse wrong, and it is printed on the public company page.' },
              { name: 'taxStatus (Tình trạng theo MST)', type: 'enum', notes: 'FIVE values — see the tax-status requirement. Drives whether the company may be invoiced and whether its public page and jobs stay live.' },
              { name: 'foundedOn', type: 'date', notes: 'a full DATE — supersedes the earlier year-only `foundedYear`. The public page derives “33 năm” from it, so it must be arithmetic, not free text.' },
              { name: 'legalRepresentative (Người đại diện)', type: 'string', notes: 'the legal representative on the ĐKKD — printed on the public company page. NOT the same as a Contact: contacts are people we sell to and live on the Contacts tab with their own statuses.' },
              { name: 'archived', type: '{ at, by, reason, note? }?', notes: 'null = active. Set together, never separately — an archive with no reason is the thing the enum exists to prevent. `reason` is one of dissolved · merged · duplicate · banned · other. Drives the Lưu trữ filter and the inline reason line on the row.' },
            ],
          },
          {
            group: 'Primary contact',
            items: [
              { name: 'contactName', type: 'string', required: true },
              { name: 'contactTitle', type: 'combo', notes: 'select-or-type: HR Manager · HR Director · Talent Acquisition · Recruiter · ceo / Founder · Office Manager — free text allowed, so the list never blocks a real title' },
              { name: 'contactPhone', type: 'string' },
              { name: 'contactEmail', type: 'string' },
            ],
          },
          {
            group: 'Sales qualification — captured at creation, editable after',
            items: [
              { name: 'owner', type: 'ref → admin user', notes: 'assigned by hand, per company. The parent/subsidiary link never propagates it — a parent and its subsidiary can be owned by two different reps.' },
              { name: 'leadSource', type: 'combo', notes: 'select-or-type: Website sign-up · Inbound call · Referral · Event / job fair · Outbound · Partner. Drives the “where do deals come from” report, so it must be a controlled list with an escape hatch.' },
              { name: 'productsInterested', type: 'multi-select', notes: 'Job Posting · Resume Search. Intent only — it provisions nothing; entitlements come from a paid order.' },
              { name: 'estimatedDealValue', type: 'currency (₫)', notes: 'the rep’s first guess, before any quotation exists. Once a quotation is sent, the deal value comes from the quotation and this stops being used.' },
              { name: 'description', type: 'text', notes: 'free-form: how we heard about them, what they need, the next step. The one place for context that has no field of its own.' },
              { name: 'nextStep', type: 'string', notes: 'the single action this company is waiting on — shown on the board card and in the follow-up queue' },
            ],
          },
          {
            group: 'Lifecycle & activity — system-maintained, not typed',
            items: [
              { name: 'pipelineStatus', type: 'derived', required: true, notes: 'not stored on the company — read from its open deal: Not in pipeline (no open deal, OR an open deal whose quotation has not been sent yet) · Proposal · Qualified · Negotiation · PO · Invoice. "Lost" never appears here; a lost deal just leaves the company with no open deal.' },
              { name: 'openDeal', type: 'ref → Deal?', notes: 'at most one open deal at a time (see rules); null = not in pipeline. A deal still at draft-quotation stage exists but does not put the company in the pipeline.' },
              { name: 'dealHistory', type: 'list → Deal[]', notes: 'every past deal, won and lost, with its reason — the account’s sales history' },
              { name: 'customerStatus', type: 'enum', required: true, notes: 'account health, exactly three values: New (has never bought — no VAT invoice ever issued) → Existing (first VAT invoice issued; active paid service or a past order) → Churn (no new order 12 months after the last invoice)' },
              { name: 'firstInvoicedAt / lastInvoicedAt', type: 'derived', notes: 'the two dates that drive New→Existing and Existing→Churn' },
              { name: 'lastContactAt → idle', type: 'derived', notes: 'days since the last human contact, rendered with the adaptive display rule (3d · 1m 18d · “Never contacted”) and coloured against the cadence table' },
              { name: 'latestNote', type: 'derived', notes: 'the most recent activity note, shown as a list column so a rep can scan the book without opening records' },
              { name: 'totalRevenue', type: 'derived', notes: 'sum of issued VAT invoices for this company only — never rolled up across a corporate group' },
              { name: 'membershipTier', type: 'derived', notes: 'the loyalty badge — Thành viên · Đồng · Bạc · Vàng · Kim Cương, or null for "chưa có hạng". Read-only here: it is resolved from accumulatedThisCycle against the threshold table, never typed (see System → Membership tiers).' },
              { name: 'accumulatedThisCycle', type: 'derived (₫)', notes: 'orders paid inside the current programme year — the one number the tier depends on. Distinct from totalRevenue, which is lifetime and never resets.' },
              { name: 'accountId', type: 'ref → Account', notes: 'set at activation; empty until then — independent of customerStatus' },
              { name: 'companyId', type: 'ref → Company', notes: 'set only if the customer posts jobs' },
            ],
          },
        ],
        behaviors: [
          'The directory filters by customer status (New / Existing / Churn), owner, industry, activity (has quote/PO/invoice/contract); Sales sees only their own book (no whole-system list), reaching any other customer solely by direct search; Sales-lead sees the whole team.',
          'The list sorts, and the default sort carries the triage: "Chưa liên hệ lâu nhất" puts the most-neglected rows on top (never-contacted first), with "Liên hệ gần đây nhất", "Tên công ty A → Z" and "Doanh thu cao nhất" as the other options. Ordering by neglect is what replaced a "Needs attention" filter button on this list — the same rows rise to the top without spending a filter or a colour on it. (The rot / Needs-attention treatment stays on the pipeline board, where a deal — not a company — is what is going stale.)',
          'The Last-contact column prints a plain date — no rot dot and no colour. A company row already carries customer status, pipeline stage and tier; a fourth colour channel makes none of them readable. Urgency is carried by the sort instead.',
          'The list carries a Tier column — the membership badge plus the accumulated-in-year figure beneath it — and the record carries a Membership block with the gap to the next band. Both are read-only: the tier is computed, never set here; the thresholds and the reward catalogue are configured in System → Membership tiers.',
          'The Pipeline board is this same list grouped by pipeline stage — a view, not a second dataset.',
          'Row → the company record: contact, deal(s), quote/PO/invoice history, and — for customers — its account, products/quota, users, and public page as sections.',
          'The company record carries a "Công ty liên kết / Affiliated companies" block: a breadcrumb of the ancestor chain (Tập đoàn A › Tổng cty B › this company) plus the list of direct children — every row showing that company’s own tax code and linking through to its record. One level up and one level down only; "Xem sơ đồ tập đoàn / View group tree" opens the full tree for the rare deep group.',
          'Each affiliate row carries ONE label — “Công ty con”. There is no Chi nhánh / Công ty con split in the UI: it was derived from the tax codes and changed nothing a rep could act on. The affiliated-companies card also carries no explainer block about what a link does or does not inherit — that rule lives here, not on the record.',
          'The directory can filter by corporate group — every company under a chosen root — so a rep can pull up a whole group at once. Grouping is a view; ownership stays per company.',
          'On PO, "Convert / Activate" provisions the account. Renewal loop: when no new PO is issued within a year of the last PO, customer status flips to Churn and the company re-enters the pipeline for a win-back (no new record).',
          'Customer status is recomputed by the system, not set by hand: a company is created New; the first OFFICIAL invoice.issued flips it to Existing; 12 months past lastInvoicedAt with no new order → Churn; a win-back invoice returns it to Existing. Sales can only override with a reason, and the override is logged.',
        ],
        rules: [
          'A company is always created here first — the CRM is the single front door, even for a company that arrives already large.',
          'De-duplication at creation has three branches, not one. (1) The full tax code already exists → block, it is a real duplicate. (2) Same 10-digit root, different branch suffix → do not block; prompt "Đây là chi nhánh của X?" and offer to set parentCompanyId. (3) Different tax code but a near-identical legal name → do not block; prompt "Đây là công ty con của X?" and offer to set parentCompanyId. Subsidiaries are routinely named "… Miền Nam" / "… Hà Nội", so a name-only match must never be treated as a duplicate.',
          'The parent/subsidiary link inherits nothing. Packages/quota, contracts, quotations, VAT invoices, users, the public company page, deals and pipeline are all per company, on that company’s own tax code. A subsidiary can never spend its parent’s quota, and vice versa — the link exists for information, navigation and reporting only.',
          'Corporate-tree integrity: at most one direct parent per company; a company can never be its own ancestor (reject cycles, including indirect ones); depth is soft-capped (≈5 levels) to keep junk data out.',
          'Owner is per company and set by hand — the tree never propagates it. A parent and its subsidiary may belong to different reps.',
          'A company with no account has no login and is invisible to jobseekers; account + public page exist only after PO + activation. That is independent of customer status — New is about buying history, not about having a login.',
          'Products and the public company page are per-record sections gated by product (Job Posting) — never a reason for a separate list.',
          'Churn ≠ a new record — it is the same company looping back for a win-back / renewal.',
          'A company leaves New only when a VAT e-invoice is issued — never on a sent quotation or a confirmed order alone.',
          'New → Existing is one-way. A win-back after Churn goes back to Existing, never to New: “has never bought from us” can only be true once in a company’s life.',
        ],
        states: ['New (never bought)', 'Existing (customer)', 'Churn (win-back candidate)', 'Duplicate detected (full tax code match — blocked)', 'Possible affiliate detected (shared tax root or similar name — offered as a link, not blocked)', 'Standalone company (no parent, no children)'],
        backend: {
          dataModel: [
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'legalName', type: 'string', required: true },
            { name: 'shortName', type: 'string?', notes: 'brand name; nullable — every read path falls back to legalName, so no backfill is needed' },
            { name: 'taxCode', type: 'string', notes: 'UNIQUE on the full string — 10 digits, or 10 + "-" + 3 for a branch. Validate both formats. Index the 10-digit root separately: that index is what powers the "is this a branch of…" prompt.' },
            { name: 'parentCompanyId', type: 'uuid?', notes: 'self-reference, nullable; null = root. Unlimited depth. Enforce no-cycle on write by walking the ancestors — an FK constraint alone will not catch an indirect cycle.' },
            { name: '— **no** pipelineStage column on this table —', type: 'note', notes: 'pipeline status is a join to the open deal, not a company field. Storing it here is the mistake that makes the two axes drift out of sync.' },
            { name: 'customerStatus', type: 'enum', required: true, notes: 'new|existing|churn — exactly three; the only status actually stored on the company' },
            { name: '— **no** membershipTier column on this table —', type: 'note', notes: 'the loyalty tier is a fact about (company, programme year) and lives in CompanyTierCycle. A single column here is the mistake that leaves stale Kim Cương badges behind every 1 January reset.' },
            { name: 'firstInvoicedAt / lastInvoicedAt', type: 'timestamp?', notes: 'drive New→Existing and Existing→Churn' },
            { name: 'nurtureUntil', type: 'date?', notes: 'set when a deal closes lost — the re-engage date' },
            { name: 'industryId / companySize / locationId', type: 'ref / enum / ref', notes: 'all three come from master data and are list filters — enums or FKs, never free text' },
            { name: 'address', type: 'string', notes: 'full head-office address, free text; separate from locationId, which is only the province' },
            { name: 'website', type: 'string?' },
            { name: 'contactName / contactTitle / contactPhone / contactEmail', type: 'string', notes: 'the primary contact, denormalised onto the company; contactTitle is free text with a suggested list' },
            { name: 'leadSource', type: 'string', notes: 'controlled list + free text — the “where do deals come from” report reads this' },
            { name: 'productsInterested', type: 'enum[]', notes: 'intent only; grants nothing' },
            { name: 'estimatedDealValue', type: 'bigint?', notes: 'VND minor units; superseded by the quotation total once one is sent' },
            { name: 'description / nextStep', type: 'text? / string?' },
            { name: 'lastContactAt', type: 'timestamp?', notes: 'drives idle — computed at read time, never stored as a day counter. null = “Never contacted”' },
            { name: 'accountId', type: 'uuid?', notes: 'nullable until activation' },
            { name: 'companyId', type: 'uuid?', notes: 'nullable; set when Job Posting enabled' },
            { name: 'ownerId', type: 'uuid' },
          ],
          endpoints: [
            'GET /admin/crm/customers?… (+ groupRoot=:id filter — recursive cte from that root)',
            'POST /admin/crm/customers (three-branch dedup check)',
            'GET /admin/crm/customers/:id',
            'GET /admin/crm/customers/:id/affiliates (ancestor chain + direct children)',
            'PATCH /admin/crm/customers/:id/parent (set / clear parentCompanyId — rejects cycles)',
          ],
          notes: 'one company table. The Pipeline is a status-grouped view of it; Account management adds the account/users/products/page as related sections on the same record — never a second company list. The corporate hierarchy lives in that same table as a self-referencing parentCompanyId — deliberately NO CompanyGroup table: nothing is owned, shared or billed at group level, so a group has no data of its own and needs no row. A group is just a recursive cte from a chosen root.',
        },
        acceptance: [
          'A lead can be created with internal-only data and no login.',
          'An identical full tax code is blocked at creation; a shared 10-digit root, or a near-identical legal name on a different tax code, is not blocked and instead offers to link the new record as a branch / subsidiary.',
          'A company record shows its ancestor chain and its direct children, each with its own tax code and each clickable through to that record.',
          'Setting a parent that would create a cycle — direct or indirect — is rejected.',
          'A subsidiary cannot consume its parent’s quota, and its invoice carries its own tax code.',
          'A parent and its subsidiary can be assigned to two different sales reps.',
          'Issuing a PO exposes the activation entry point.',
        ],
        openQuestions: [
          'Confirm: is a CRM customer the same record as a Company, or two records linked at activation? (recommended: same record + lifecycle status)',
          'When a company arrives outside sales (self-signup), auto-create a CRM customer so "always via CRM" still holds?',
          'Required fields to create a lead vs to activate a customer?',
          'Does not block build — the model already handles both answers: does the client have customers that are branches (same tax code as the parent, only the -001 suffix differs) needing their own account and their own invoices? Worth asking, but only to set expectations.',
          'Deferred nice-to-have: do reps re-assign a whole group often enough to want a bulk "assign the whole group to…" action? It writes N rows and adds no rule, so it can land any time.',
        ],
      },
    },
    {
      name: 'Free data',
      /* Slug PINNED — see the note on Invoices above. The name is still shorter
         than the slug because this feature was renamed from “Danh bạ doanh nghiệp
         (free company data)”; a brief spell as “Company directory” was reverted
         2026-08-23 — “Free data” is what the team actually calls it. */
      slug: 'danh-ba-doanh-nghiep-free-company-data',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'A large, dirty, unowned reference list of companies — OUTSIDE the CRM. A rep cannot take one by clicking: they must supply a contact phone number and evidence the company is hiring, and an admin approves. Approval is what creates the CRM company.',
      mockup: 'crm-company-directory',
      // The tracking table is the second screen of this feature: the pool is where a
      // company is claimed and assigned, this is where a request's outcome is read.
      mockups: ['crm-claim-requests'],
      detail: {
        requirements: [
          {
            label: 'ONE company table, two states — and TWO admin-only create doors',
            text: 'Free data và Customers **là một bảng công ty, ở hai mức hoàn thiện**. “Đưa lên Customers” không phải copy sang kho khác — nó là **hoàn thiện dữ liệu + gán chủ**.\n\n| | bắt buộc | chủ sở hữu |\n|---|---|---|\n| **Free data** | tên công ty | chưa có |\n| **Customers** | tên legal + **MST** + **địa chỉ đăng ký MST** + **người liên hệ** + **sales owner** | có |\n\nHai cửa tạo của **Admin**, và **người tạo chọn màn hình trước** — màn nào thì form bắt buộc đúng field của màn đó. Từ 09/2026 có thêm **cửa thứ ba: employer tự đăng ký** — ra thẳng Customers nhưng ở trạng thái **Chưa xác minh, chưa có owner**, và bất động cho tới khi admin Verify (không đăng tin, không xuất hóa đơn). **Sales vẫn không tạo công ty**: đường duy nhất để sở hữu là *xin nhận* từ Free data qua hai cấp duyệt, hoặc được phân khi admin verify một công ty tự đăng ký.',
            diagram: 'company-intake',
            table: {
              cols: ['Cửa', 'Ai', 'Bắt buộc', 'Đích'],
              rows: [
                ['**Free data → Thêm công ty**', 'Admin', '**1 field: tên công ty** (import hàng loạt, hoặc gặp ở hội chợ)', '**Free data** — chưa có chủ'],
                ['**Customers → New company**', 'Admin', '**5 field: tên legal · MST · địa chỉ đăng ký MST · người liên hệ · sales owner**', '**Customers** — có chủ, đếm vào mọi số của CRM'],
                ['**Company site → Sign up** (cửa ③, từ 09/2026)', 'Employer tự đăng ký', '**Họ tên · email · SĐT · mật khẩu · MST · tên công ty** (+ ERC tuỳ chọn). Cửa mở khi bấm link xác minh email', '**Customers — Chưa xác minh, chưa có owner.** Đăng nhập được ngay; đăng tin và xuất hóa đơn khóa tới khi admin Verify (xem CRM → Sign-up & company verification)'],
                ['*(không có cửa nào)*', 'Sales', '—', 'Sales **không tạo công ty**. Đường duy nhất: Xin nhận từ Free data → Admin duyệt → Sales lead duyệt.'],
              ],
            },
          },
          {
            label: 'Sign-up user — xác minh email chưa vào được; admin place (Move / Create) mới mở login',
            text: 'Đổi lại từ 09/2026 (khách hàng chốt). Employer tự đăng ký, **bấm link xác minh email chỉ để xác thực địa chỉ** — chưa có login, chưa có công ty, chỉ có **một dòng trên Sign-ups**. Admin resolve dòng đó: **Move** vào công ty đã có · **Create** công ty + đặt người đó làm Admin đầu tiên · **Archive** nếu là spam. Move/Create gửi **email kích hoạt**, và đó mới là lúc user đăng nhập được.\n\nSau khi vào, thứ còn chờ admin là *xác minh*: bấm **Verify** ở Company detail — nút chỉ mở khi hồ sơ **đã có ERC** (Waiting to verify); admin đối chiếu ERC với hồ sơ rồi bấm. Phân owner là việc riêng (Ownership), không chặn Verify. Chưa verify thì employer đăng nhập, đọc, cập nhật, upload đều được — chỉ **không đăng tin** (kể cả draft) và **Sales không yêu cầu xuất hóa đơn** được.',
            table: {
              cols: ['Dòng Sign-ups cho thấy', 'Hành động', 'Vì sao'],
              rows: [
                ['**Trùng một công ty đã có** trên Customers (Match)', '**Move to existing company** — tạo login ngay trong công ty đó, chọn role, gửi email kích hoạt', 'Một nhân sự HR mới ở khách hàng cũ. Không tạo thêm bản ghi công ty nào'],
                ['**Trùng một dòng Free data**', '**Đưa dòng Free data lên Customers + place** — dòng rời Free data, dữ liệu (SĐT · địa chỉ · ngành · nguồn) đi theo, người đó là Admin đầu tiên', 'Một MST một bản ghi. Không tạo bản ghi thứ hai cho công ty đã có trong danh bạ'],
                ['**Không trùng gì** — công ty mới thật', '**Create company & activate** — tạo công ty ở **Chưa xác minh**, người đó là **Admin đầu tiên**, gửi email kích hoạt', 'Trường hợp phổ biến nhất. Không còn tuỳ chọn “để đó” — chưa resolve là khách còn đứng ngoài'],
                ['Rác / spam', '**Archive** — chặn email kích hoạt, không tạo công ty, không tạo login', 'Không tạo gì cả, và không gửi mail cho spam'],
              ],
            },
            items: [
              'Cột **Match** vẫn là **danh sách công ty có link** — xem block “Match — một danh sách, không phải một cái tên”.',
              'ĐÃ CÓ LẠI GATE LOGIN Ở ĐÂY (khách hàng chốt 09/2026). Move và Create là hai hành động **mở khoá login** và gửi email kích hoạt; Archive chặn hẳn. Dòng chưa resolve = một khách hàng chưa vào được, nên tuổi của dòng cũ nhất là thứ đáng nhìn nhất trên màn hình này.', 
              'MỘT MST MỘT BẢN GHI. Vì không còn công ty vỏ tạo tự động lúc bấm link, câu hỏi trùng lặp được trả lời TRƯỚC khi có bản ghi nào — không phải archive gì cả.', 
            ],
            warn: 'NÚT CREATE ĐÃ TRỞ LẠI Sign-ups (khách hàng chốt 09/2026) — và nó là trường hợp phổ biến nhất, vì phần lớn sign-up là công ty mới thật. Nó không phải “cửa tạo công ty thứ ba”: vẫn là admin tạo đúng một bản ghi trên Customers, từ chính dòng yêu cầu nó.',
          },
          {
            label: 'Pool state — TWO states, and there is no “Từ chối” among them',
            text: 'A pool row is **Chưa nhận** or **Đang chờ duyệt**. That is the whole enum, and rejection does not add a third.\n\nWhen a request is refused the company goes **straight back to Chưa nhận**. What was refused is a REQUEST, not the company: it is still an un-owned company somebody may legitimately want, and the next rep — or the same one with better evidence — must be able to ask. A “Từ chối” state on the company would claim the company is refused, which is not what happened, and it would then need a second mechanism to clear it.\n\nApproval is the only thing that removes a row: the company **leaves the pool**, because it is a CRM company now and listing it in both places would show one company twice.',
            table: {
              cols: ['State', 'Means', 'In the Danh bạ list?'],
              rows: [
                ['Chưa nhận', 'Free. Nobody has asked for it.', 'Yes — with **Xin nhận**.'],
                ['Đang chờ duyệt', 'At least one rep has asked; admin has not decided. The row names the first requester and, when there is more than one, the request count.', 'Yes — still claimable, button reads *Xin nhận (đã có người xin)*.'],
                ['Đã nhận', 'Approved. A CRM company exists.', '**No — the row is gone from the list.** It keeps its state so the promotion stays traceable and the “already in CRM” check can still see it; it simply stops being part of the pool.'],
                ['*(bị từ chối)*', '**Not a state.** The REQUEST becomes Từ chối; the company itself returns to **Chưa nhận**.', 'Yes — free again, and anyone may ask, including the rep just refused. The row shows **“đã từ chối N lần”**, derived from the request history, as a warning to the next approver.'],
              ],
            },
            items: [
              'The row is NOT deleted. Approving removes it from the LIST, not from the store — the record of how a company entered the CRM is the audit trail, and the duplicate check reads it.',
              'The Trạng thái filter therefore offers two options, not three. A filter for a state no row in the list can have is a dead option.',
              'A rejection carries an optional **note to that rep** (per request, not per company). It is not mandatory — the company is free again either way — but it is the only channel telling a refused rep what a better request would look like, and the rep reads it verbatim on the log.',
              'If the ROW itself is bad (the company does not exist, the data is junk), rejecting a request is the wrong tool — admin hides the row instead. Two different problems: one is about a rep’s claim, the other about the data.',
              'The list has NO action button on the row. Clicking the company name opens its detail page, and Xin nhận lives there — one way in, at the point where the rep has actually read the record they are asking for.',
            ],
          },
          {
            label: 'The approve/reject flow — TWO levels, one open request, and a direct-assign bypass',
            text: '**One open request at a time**: the moment a rep sends Xin nhận, the row locks — nobody else can ask until that request is settled. A refusal frees the row again, so “locked” is never “gone”.\n\n**Two approval levels, in order**: Admin (bước 1) → Sales lead (bước 2). Only a request Admin passed reaches the lead, and a rejection is **terminal at whichever level it happens** — Admin’s no never reaches the lead, the lead’s no does not bounce back to Admin. Two levels of yes, one level of no.\n\n**Yêu cầu nhận công ty** stays a pure **log**: append-only, no action buttons — a rejection is otherwise silent for the rep who asked.',
            table: {
              cols: ['Step', 'Who', 'Where', 'What they see / do'],
              rows: [
                ['1 · Xin nhận', 'Sales', 'Free data → company record → **Xin nhận**', 'The request form (mô tả + phân loại + link/tệp). The record warns if others already asked.'],
                ['2 · Khoá', 'System', 'The pool row', 'Sending a request flips the row to **Đang chờ duyệt** and Xin nhận disappears for everyone else — the claim form hard-blocks with “mỗi công ty chỉ nhận một yêu cầu một lúc”, and says when it unlocks. The status pill on the list IS the level: *Chờ duyệt lần 1 · Admin* / *Chờ duyệt lần 2 · Sales lead*.'],
                ['3 · Duyệt bước 1', 'Admin', 'Open the company → **tab Yêu cầu nhận** (amber badge; the banner offers “Duyệt yêu cầu ({level}) →”)', 'The request card shows lý do · bằng chứng (link/📎/⚠) · contact point, a note field, and **Duyệt · Admin / Từ chối · Admin** (role on the button, the Kế toán convention). Duyệt moves it to **Chờ Sales lead** — nothing is created yet. Từ chối ends it: công ty về Chưa nhận.'],
                ['4 · Duyệt bước 2', 'Sales lead', 'Same card, now stamped “✓ Admin đã duyệt {when} · {who}”', 'The lead sees level 1’s pass — they never approve something with no provenance — plus **the MST field (see the MST gate below)**, their own note field, and **Duyệt · Sales lead / Từ chối · Sales lead**. Duyệt is the ONE WRITE: CRM company + owner + contact #1 + pool removal — so the MST gate sits on this button and nowhere earlier: Admin’s level-1 pass creates nothing. Từ chối ends it, and it does NOT go back to Admin.'],
                ['(bypass) · Phân trực tiếp', 'Admin', 'The **Phân trực tiếp · Admin** card, on the pool record’s **Owner history** tab — beside the timeline it extends, the same home Chuyển giao has on a customer (moved 2026-08-27)', 'Admin fills the record to the **same 3-field gate** (MST · địa chỉ ĐK xuất hóa đơn · contact person) and picks a rep → **Phân ngay** — no request, no level 2. A bypass of the QUEUE is not a bypass of the DEDUP: this button creates the company too. If a request is open it is auto-rejected with the note “Admin đã phân trực tiếp cho {X}”, and the card warns about that BEFORE the click.'],
                ['(gate) · MST', 'Whoever creates', 'On every button that CREATES the company — lead approve, direct assign, sign-up promote', 'The MST lives in **ONE place: the record itself** (tab Overview), where the admin fills or corrects it — the assign/approve cards **read** that value and never carry their own input, or the same number is asked for twice and the two copies drift. Three states, told inline on the card: **chưa có MST** → button disabled + a jump “Điền MST ở tab Overview →”; **trùng** → red block naming the company, its Company ID and its sales owner (“không tạo được hồ sơ mới — nếu đúng là công ty này, dùng Yêu cầu chuyển giao; nếu là chi nhánh, tạo từ hồ sơ công ty mẹ”); **hợp lệ** → “✓ MST … không trùng” và nút mở. A duplicate BLOCKS, never warns-and-allows: two records with one MST is two invoices claiming the same legal entity. (Sign-up promote is the one door that keeps an input — the record is not open on that screen.)'],
                ['5 · Theo dõi', 'Sales', '**Yêu cầu nhận công ty** — the log, default **Của tôi**', 'Status pill + what it means (*được chọn — là sales phụ trách* / *công ty về lại Chưa nhận — xin lại được*), who decided and when, and **the admin’s note to this rep, verbatim**. Plus the banner on the company’s own record. NO action buttons here — one place to decide, or two places disagree.'],
              ],
            },
          },
          {
            label: 'Worked example — a released company carries all three at once',
            text: 'The Owner history tab of a Free-data record can hold **three** things at the same time, and one company in the mockup shows all of them: **Công ty TNHH Logistics Đại Hưng** (Free data → Đang chờ duyệt).\n\nIts story: a customer since 03/2025 → handed back to the pool on 15/07/2026 → one rep refused right after → two reps waiting now. That is the case the layout has to survive, because a released company is the one pool row that arrives with a past.\n\nOrder is **decision first, history after**: a pending request is the only thing here that needs acting on today, and burying the buttons under a timeline is how a queue goes stale.',
            table: {
              cols: ['#', 'Block', 'Why it is there'],
              rows: [
                ['1', '**Tab Yêu cầu nhận** — the approval card (bước 2/2, chờ Sales lead) + một dòng chỉ sang Phân trực tiếp + Lịch sử yêu cầu nhận', 'The queue and its log, with the amber badge. The admin still sees, in the log right below the card, that this company was refused once already — and the timeline next tab over says it was given up by the very rep who owned it in 2025.'],
                ['2', '**Tab Owner history** — the Phân trực tiếp card above one timeline, release included: *↩ Trả về bể dữ liệu — Nguyễn Thị Lan · 15/07/2026* → Nguyễn Thị Lan 11/2025–15/07/2026 → Phạm Quang Huy 03/2025–11/2025', 'Pure history. A release IS an ownership event — the only one nobody picks up — so it is an entry in the chain (amber dot, single date, no range) rather than a banner beside it. The chain renders **closed**: no “Current” badge, header *“chuỗi đã đóng — hiện không ai phụ trách”*, because badging the rep who handed it back would name them as the person to call.'],
                ['3', '**Lịch sử yêu cầu nhận** (on the Yêu cầu nhận tab) — every request, newest first', 'Includes the earlier refusal with its note, so the admin sees the precedent they set weeks ago while deciding the same company again.'],
              ],
            },
          },
        ],
        rules: [
          'The pool is a separate table from CRM companies. No pool row is counted in any CRM figure, appears on the pipeline, or can carry a quotation, PO or invoice.',
          'Tên công ty is the only required field on a pool row. MST is optional and stored unverified — it is never uniqueness-checked and never copied on promotion.',
          'A pool row has no sales owner and no last-contact clock. Assigning an owner is what approval does.',
          'Xin nhận requires the DESCRIPTION only. Phân loại, Link and Tệp đính kèm are optional — the form mirrors the FreeDB form in use. The contact point is asked for inside the description via the format template.',
          'The two classifications that describe an existing Saramin package block submit — that company is a customer, not free data, and belongs to the transfer flow.',
          'An APPROVED company leaves the Danh bạ list — it is a CRM company with an owner, and leaving it in the pool would let a second rep request a company that already has one. The row itself is not deleted.',
          'No reason is collected on either decision. Resolved requests stay listed under the Free-data screen, filterable by Trạng thái, defaulting to the viewer’s OWN requests.',
          'The requesting rep must be able to see the outcome in TWO places: a banner on that company’s record, and their own request list. Approval also announces itself, by the company appearing in their book with them as owner.',
          'The CRM-duplicate check runs when the claim form opens, not at approval. A match disables submit and names the Company ID + current owner.',
          'ONE open request at a time: a row Đang chờ duyệt accepts no second request — the form hard-blocks and says when it unlocks (a rejection frees the row). REVERSED from the earlier competing-requests design, per the client.',
          'Two approval levels in order: Admin, then Sales lead. A request the Admin passed shows “✓ Admin đã duyệt {when} · {who}” to the lead. Rejection is terminal at either level; only the lead’s Duyệt creates the company.',
          'Admin can assign a company to a rep DIRECTLY — no request, no lead approval. Any open request is auto-rejected with a note naming who was assigned.',
          'Only an ADMIN approves. Approval creates the company, sets the requester as owner, files contact #1, and links the pool row — one atomic action.',
          'Rejection requires a reason, returns the row to Chưa nhận, and shows the reason to the requesting rep.',
          'Claims never expire and nothing returns a claimed company to the pool. `claimed → first quotation within 30 days` is therefore the only hoarding check.',
          'Both search surfaces return pool hits (Chưa nhận only) in a separate labelled section, and "+ Tạo công ty mới" is hidden while a pool hit exists.',
          'Sales have read + claim only. Admin may import, correct or hide a row; nobody hard-deletes.',
          'A promoted company carries a Từ danh bạ provenance mark with the claim date and approving admin.',
        ],
        states: ['— pool row —', 'Chưa nhận', 'Đang chờ duyệt (locked — one request at a time)', 'Đã nhận (leaves the list)', '— request —', 'Chờ duyệt lần 1 · Admin', 'Chờ duyệt lần 2 · Sales lead', 'Đã duyệt', 'Từ chối (terminal at either level)'],
        backend: {
          dataModel: [
            { name: 'poolCompanyId', type: 'uuid', required: true, notes: 'separate table from `company` — never a company row' },
            { name: 'name', type: 'string', required: true, notes: 'the ONLY required field' },
            { name: 'phone / website / address / province / industry', type: 'string?' },
            { name: 'taxCodeRaw', type: 'string?', notes: 'UNVERIFIED. No uniqueness constraint. Never written to company.taxCode' },
            { name: 'source', type: 'string', required: true, notes: 'import batch / fair / job board — lets a bad source be measured' },
            { name: 'importedAt', type: 'date', required: true },
            { name: 'state', type: 'enum', required: true, notes: 'free | pending | claimed' },
            { name: 'claimedCompanyId', type: 'uuid?', notes: 'the CRM company created on approval' },
            { name: 'claimId', type: 'uuid?', notes: 'the open request while pending' },
            { name: '— claim request —', type: '', notes: '' },
            { name: 'claimId', type: 'uuid', required: true },
            { name: 'poolCompanyId / requestedBy / requestedAt', type: '', required: true },
            { name: 'reason', type: 'text', required: true, notes: 'lý do tạo yêu cầu — the first thing the approver reads' },
            { name: 'freeDataKind', type: 'enum', required: true, notes: 'one of the 8 classifications; the two Saramin-package values are rejected at the API, not only in the UI' },
            { name: 'contactName / contactPhone', type: 'string', required: true, notes: 'promoted to contact #1' },
            { name: 'contactEmail', type: 'string?', notes: 'also promoted when present' },
            { name: 'evidenceUrl', type: 'string?', notes: 'a link the approver can open' },
            { name: 'evidenceFileId', type: 'uuid?', notes: 'attachment; second best' },
            { name: '(constraint)', type: '', notes: 'evidenceUrl OR evidenceFileId must be present' },
            { name: 'requestCountOnCompany', type: 'int (derived)', notes: 'the Số YC column / the contest signal' },
            { name: 'status', type: 'enum', required: true, notes: 'pending (chờ Admin) | admin_ok (chờ Sales lead) | approved | rejected' },
            { name: 'adminBy / adminAt', type: 'uuid? / timestamp?', notes: 'level 1’s pass. Kept apart from the final decision — the lead must see who let it through' },
            { name: 'decidedBy / decidedAt', type: 'uuid? / timestamp?', notes: 'the FINAL decision (lead’s approve, or whoever rejected)' },
            { name: 'rejectedLevel', type: 'enum?', notes: '“Admin” | “Sales lead” — who said no. Terminal either way, so this is the whole explanation' },
            { name: 'resultCompanyId', type: 'uuid?', notes: 'on the APPROVED row only: the CRM company the approval created. “Ai được chọn” is this row; its requestedBy is the first owner' },
            { name: 'note', type: 'string?', notes: 'the admin’s note to THIS rep, written at decision time. Optional; auto-filled “Đã phân công ty cho {winner}” on an auto-rejection. Read by the rep on the log' },
          ],
          endpoints: [
            'GET /admin/crm/company-pool?q=&state= — searchable by sales, read-only',
            'GET /admin/crm/company-pool/:id/crm-match — the pre-submit duplicate check (normalised name + domain; MST deliberately excluded)',
            'POST /admin/crm/company-pool/:id/claim { reason, freeDataKind, contactName, contactPhone, contactEmail?, evidenceUrl?, evidenceFileId? } — 409 if a CRM match exists OR the row already has an open request (one at a time); 422 if freeDataKind is one of the two customer values.',
            'GET /admin/crm/company-claims?status=pending',
            'POST /admin/crm/company-claims/:id/admin-approve { note? } — level 1 (Admin role). status → admin_ok; nothing is created yet',
            'POST /admin/crm/company-claims/:id/lead-approve { note? } — level 2 (Sales-lead role); 409 unless status = admin_ok; 422 if the POOL ROW’s taxCode is empty; 409 with the existing companyId if it duplicates a CRM company. THE write: creates the company with the record’s taxCode, sets salesOwner = requestedBy, creates contact #1, sets pool state = claimed + claimedCompanyId',
            'POST /admin/crm/company-claims/:id/reject { note? } — either role at its own level; terminal. rejectedLevel recorded; pool state returns to free',
            'POST /admin/crm/company-pool/:id/direct-assign { salesOwnerId, note? } — Admin only, no approval chain, SAME MST rules as lead-approve (reads the pool row’s taxCode; 422 empty · 409 duplicate): creates the company + owner + contact #1, auto-rejects any open claim with a note naming the assignee',
            'GET /admin/crm/free-data-kinds — the 8 classifications (master data, so the list can be tuned without a release)',
            'POST /admin/crm/company-pool/import — admin only; records `source` on every row',
          ],
          integrations: ['CRM Customers (the promotion target + the duplicate check)', 'Global company search (second result section)', 'Contacts (contact #1 written on approval)', 'Notifications (claim submitted · approved · rejected with reason)', 'Audit log (every claim decision)'],
          notes: 'Approve is one transaction: company + owner + contact + pool link, or nothing. The pool table is never joined into CRM aggregate queries — keeping it a separate table is what makes that a structural guarantee rather than a filter everyone must remember.',
        },
        acceptance: [
          'A pool row can be created with a name and nothing else.',
          'A pool MST is displayed as unverified and is absent from the created company after approval — the rep must type it on the company form.',
          'Lưu lại is disabled while Mô tả thông tin chi tiết is empty, and enabled once it has text — Phân loại, Link and Tệp are optional.',
          'Once a claim is approved the company no longer appears in the Danh bạ list, and its Trạng thái filter offers only Chưa nhận / Đang chờ duyệt.',
          'Opening a company whose request of mine was refused shows a rejection banner naming the request and date; opening one I am still waiting on shows a pending banner.',
          'Choosing either Saramin-package classification blocks submit and points the rep at the transfer flow.',
          'A second rep can submit a request on a row that is already Đang chờ duyệt; the count rises to 2 and both requests appear in the queue.',
          'Approving one of two competing requests sets the other to Từ chối, and the company leaves the pool.',
          'A request with no evidence renders ⚠ không có bằng chứng in the queue; a very short reason renders in amber.',
          'Rejecting is one click with no reason; the company returns to Chưa nhận and the row shows “đã từ chối 1 lần”. Resolved requests remain listed and are filterable by Trạng thái.',
          'Opening Xin nhận on a row that matches an existing CRM company shows that company’s ID and owner and blocks submit — no request is created.',
          'A second rep cannot request a row that is already Đang chờ duyệt.',
          'Approving creates the CRM company with the requesting rep as sales owner and the submitted phone/name as contact #1, and the pool row shows Đã nhận with a link to the new Company ID.',
          'Rejecting is one click with no reason; the row returns to Chưa nhận and shows “đã từ chối 1 lần”.',
          'Searching a free pool company in the shell search returns it under Danh bạ · chưa ai nhận, and "+ Tạo công ty mới" is not offered.',
          'No pool row appears in any CRM count, on the pipeline, or as a quotation/PO/invoice target.',
          'A promoted company shows the Từ danh bạ mark with claim date and approving admin.',
        ],
        openQuestions: [
          'Should Contact Point become real fields and Link/Tệp be made mandatory? Today’s form leaves both optional, which is how “test” reaches ĐANG CHỜ — and free-text contact details cannot be promoted to contact #1 without someone re-typing them. Deliberately kept as-is to match the existing form; revisit once the queue volume is real.',
          'The current FreeDB queue records TWO notes — **Ghi chú SA** and **Ghi chú Leader**. This spec collects NO note on either decision, per the client (“tạm thời từ chối không cần lý do”). Two open questions follow: does Saramin need both roles to sign, and — since a refused rep is told nothing — will they simply re-submit the same request until it is approved out of fatigue? The derived “đã từ chối N lần” marker is the cheap guard; a reason field is the other option.',
          'Evidence: is a screenshot/file genuinely acceptable, or must it be a URL? A file has to be opened and believed. Today’s form makes both optional — which is why "test" reaches ĐANG CHỜ.',
          'Tie-break on competing requests: is "strongest evidence, then earliest timestamp" the rule, or does the sales leader decide case by case?',
          'Does the admin approving claims need to be a specific role (e.g. CRM admin), or is any HQ operator with company-write permission enough?',
          'Import ownership: who loads batches into the pool, how often, and is there a de-duplication pass against existing CRM companies at import time (which would shrink the queue)?',
          'Should a rejected row be re-requestable by the same rep immediately, or after a cooling-off period?',
          'Cap on unworked claims per rep — worth adding at launch, or wait until hoarding actually shows up in the data?',
        ],
      },
    },
    {
      name: 'Sign-up & company verification (ERC)',
      /* Slug PINNED to the pre-merge name (2026-09-09). This page absorbed the
         Company verification feature from Account management — the sign-up and the
         verification it leads to are one flow, and the admin's Sign-ups screen is
         where its row is worked. Comment threads and shared links keep resolving. */
      slug: 'sign-ups',
      site: 'AdminCompanies',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'Company-user sign-up AND the company verification it leads to — one flow, two sides. Sign-up creates a REQUEST, not access: the email link only proves the address and puts one row here, and an ADMIN PLACING THE PERSON INTO A COMPANY is what opens sign-in (client, 09/2026 — the 08/2026 gate restored). Placement is one of three: Move into an existing customer · Create the company and place them as its first Admin · Archive as spam. Verification is the SECOND, later gate — Verify opens only when the record carries MST · registered (tax) address · ERC, and it gates exactly two things: the employer posting a job, and Sales requesting the official invoice.',
      mockup: 'crm-signups',
      mockups: ['co-signup', 'co-post-job', 'admin-company-list'],
      detail: {
        requirements: [
          /* MOVED here from Free data (2026-09-08 page feedback): matching is a
             SIGN-UP concern — this screen is where a typed company name has to be
             resolved against what we already hold. The Free-data page only consumed
             the result. `matchResult` on the Sign-up entity is the field it governs. */
        {
          label: 'The flow — employer on the Company site, admin in the console, one flag between them',
          text: 'TWO GATES, IN THIS ORDER. **① Placement opens sign-in.** The email link only proves the address; until an admin places the person into a company — Move into one that exists, or Create one and make them its first Admin — there is no login and no company. **② Verification opens posting.** Once inside, the ERC check on Company detail blocks exactly two things: posting a job (even a draft) and Sales requesting the official invoice. Everything else in the console — reading, uploading the certificate, correcting company information — is open while the company is still unverified. The reason for gate ① is the one to keep in mind: only people who belong to a company Saramin has looked at are inside the platform.',
          diagram: 'company-verification',
          items: [
            'THE SUCCESS PAGE SETS EXPECTATIONS HONESTLY, and what it now describes is a wait: (1) verify your email; (2) **Saramin sets up your account — we email you a link when it is ready**, usually within 1 business day; (3) once you are in, complete your company record (MST · địa chỉ đăng ký MST · ERC) — Saramin verifies it, and that is what unlocks posting.',
            'THE PLACEMENT SLA IS THE ONE THAT MATTERS NOW: an open Sign-ups row is a customer standing outside the door, not a record waiting to be tidied. Commit to 1 business day, and alarm the ADMIN QUEUE when it slips — never the customer, who can do nothing about it. Verification keeps its own softer SLA, because the person is already inside while it runs.',
            'TWO ADMIN JOBS, IN ORDER. **(A) Placement — first, and blocking.** Move the person into a company that exists, or create the company and place them in it as first Admin. Until this is done there is no login and no company. **(B) Verification — after, and non-blocking.** The ERC check, which opens Post job and the official invoice once the ERC is on file and an admin has read it. The diagram draws A before B, because A is now a gate rather than a tidy-up.',
          ],
          table: {
            cols: ['#', 'Where', 'Who', 'What happens', 'State after'],
            rows: [
              ['①', 'Company site · Sign up', 'Employer', 'Fills the form (full name · email · phone · password · tax number · company name) + **ERC upload (optional, several files)**. Register sends the verification email.', 'Nothing exists yet'],
              ['②', 'Email', 'Employer', 'Clicks the link. **This proves the address — it does NOT open the console.**', 'Email verified · **one row on Sign-ups** · still no login, no company'],
              ['③', 'Admin · Sign-ups', 'Admin', 'Resolves the row — **Move** into the matched customer (pick the role) · **Create company & activate** the person as its first Admin · **Archive** as spam. Move and Create send the activation email.', 'Company exists (**Unverified**) · login **Active** once they open the link'],
              ['④', 'Company site · console', 'Employer', 'Signs in for the first time. Tag **No paperwork** beside the company name with a button → Company information. **Post job disabled**, and the page asks for the one thing still owed — the **ERC** (Giấy chứng nhận đăng ký doanh nghiệp) — with the link.', 'Unverified · **No paperwork**'],
              ['⑤', 'Company site · Company information', 'Employer', 'Adjusts company information if anything is off, and **uploads the ERC** (several pages are fine). The file lands on the admin’s Enterprise Registration Documents card; the tag flips to **Waiting to verify** on both sides — the MST and address were filled in when the admin created the company, so the certificate is all that was missing.', 'Unverified · **Waiting to verify**'],
              ['⑥', 'Admin · Customers → Company detail', 'Admin', 'Clicks **Chờ verify · n** (= filter *Waiting to verify*), opens the record, reads the ERC against the MST, address and legal name on it, presses **Verify company** — the button only proceeds in *Waiting to verify*; on *No paperwork* there is nothing to rule on and the dialog points at Company documents instead. Assigning a sales owner is a separate Ownership action, not part of Verify.', '**Verified**'],
              ['⑦', 'Both sites', 'System', 'Tag turns **blue Verified**. Employer: Post job unlocked (a draft needs no invoice), Company information read-only. Sales: “Yêu cầu xuất hóa đơn chính” enabled.', 'Verified'],
              ['⑧', 'Admin · Company detail · Save', 'Admin', 'Edits identity data on a Verified record.', '**Waiting to verify · cần xác minh lại** — back to ⑥'],
            ],
          },
        },
        {
          label: 'What Verified gates — exactly two things',
          table: {
            cols: ['Action', 'Unverified', 'Verified', 'Why the gate sits here'],
            rows: [
              ['Employer posts a job (Publish **or Save draft**)', '**Disabled** — the page says “Công ty chưa được xác minh” and asks for the one thing owed, the **ERC**, with a button to Company information; once it is uploaded: “Waiting to verify — Saramin xác minh trong 1 ngày làm việc”', '**Enabled.** A draft needs no invoice, no PO, no product', 'A posting carries the company’s name in public. Nobody should be able to publish under an identity Saramin has not checked.'],
              ['Sales requests the official invoice (“Yêu cầu xuất hóa đơn chính”)', '**Disabled**, reason on the button', 'Enabled', 'The invoice prints the legal name and MST. Issuing one against an unchecked identity is a cancel-and-reissue waiting to happen.'],
              ['Sign in · read the console · upload ERC · edit Company information', 'Allowed **once placed** — placement, not Verified, is what opens sign-in', 'Allowed — except editing Company information (see below)', 'None of these commit Saramin to anything.'],
              ['Admin posts on the company’s behalf (concierge)', 'Allowed', 'Allowed', 'HQ is the party doing the checking; the gate is on the customer’s own hand.'],
              ['Quotation · PO', 'Allowed', 'Allowed', 'A quotation is an offer, a PO is the customer’s agreement — neither is a filed document. The filed one is the invoice, and that is where the gate is.'],
            ],
          },
          warn: 'Do not gate anything else on Verified. The temptation will be to lock the whole console “until they upload”. That turns a one-day admin check into a customer who cannot even see what they are being asked for — and the page that asks them for it is INSIDE the console.',
        },
        {
          label: 'Verification status — three labels an admin can act on',
          text: 'Client decision, 09/09/2026. The tag beside a company name has **three** values, not two, because an unverified record raises two different questions — *can I clear this now?* and *is the customer still owing us paperwork?* — and one amber tag answered neither. The same three labels render on the admin’s Customers list, on Company detail, and beside the company name on the Company site, so an admin and a customer on the phone read one vocabulary.',
          table: {
            cols: ['Status', 'Means', 'When it shows', 'Whose move', 'Tone'],
            rows: [
              ['**Verified**', 'An admin pressed Verify against the ERC', 'After Verify — until an admin edits identity data', 'Nobody. Posting a job and the official invoice are unlocked', 'Blue shield'],
              ['**Waiting to verify** · *Chờ xác minh*', 'Not verified yet, but an ERC is on the record — there is paperwork to rule on', 'The moment the first ERC file lands, without anyone setting it', '**Admin** — this is the queue the *Chờ verify · n* chip counts, and the only state in which Verify proceeds', 'Amber — work we can do'],
              ['**No paperwork** · *Chưa có hồ sơ*', 'Not verified, and no ERC on the record yet', 'From placement until the employer (or an admin on their behalf) uploads the certificate', '**The employer** — the tag names what is owed, and the Company site says where to upload it', 'Slate — work we are waiting on'],
            ],
          },
          items: [
            'THE TWO UNVERIFIED LABELS ARE ONE STATE in the data (`unverified`) told apart by whether an ERC is on file, computed on read — exactly how the build derives it (svn-be V482: the verdict plus any non-rejected document). That is what keeps the tag, the filter, the counter and the Verify button from ever disagreeing — see the warning below.',
            'AMBER vs SLATE IS THE LOAD-BEARING PART: amber means an admin can act today, slate means we are waiting on the customer. A screen full of amber is a real queue; if both unverified cases shared a colour, the queue would be unreadable — which is why the split exists at all.',
            '“Verified, then an admin edited it” is NOT a fourth status. It lands in Waiting to verify (the documents are still on file) with the modifier *· cần xác minh lại* and its own tooltip, because re-checking a changed record is a different task from checking a new one.',
            'There is no “Rejected”: an admin who cannot verify a company does not stamp it — the record stays Unverified and the reason lives in the activity log. Archiving is what ends a company that should not be pursued.',
          ],
        },
        {
          label: 'Admin verifies — paperwork on file opens the button, and “Waiting to verify” is how the admin finds them',
          text: '“Verify company” is a button on Company detail, shown while the company is not Verified — and it **only proceeds in Waiting to verify, i.e. when at least one ERC is on the record**. On No paperwork the dialog says there is nothing to rule on and points at Company documents (the build does exactly this). The dialog lists the certificate as the one input, and the MST, registered address, legal name and sales owner as facts to read the certificate against — not gates. Whether a record is waiting is **derived from the verdict plus the documents on every read, never stored** — so the filter, the counter, the row hint, the header button and the dialog can never disagree.',
          table: {
            cols: ['Input', 'Read from', 'Missing when', 'Who fills it'],
            rows: [
              ['**ERC** (Giấy chứng nhận đăng ký doanh nghiệp)', 'Enterprise Registration Documents card — at least one file', 'No file → **No paperwork**', 'The employer, at sign-up or on Company information (Upload document); or an admin uploads on their behalf. Placement files an ERC attached at sign-up automatically'],
            ],
          },
          items: [
            'WHY ONLY THE CERTIFICATE (client, 11/09/2026 — supersedes the 09/09 three-input rule): a company is created by an admin through the ordinary Create company form, which requires the legal name, the MST and the invoice address, so none of them can be missing on a record that exists. What the employer still owes is the certificate; what the admin does is read it against the record. The build derives the label the same way (svn-be V482: `verified_at` + any non-rejected company_document).',
            'NOT INPUTS, SHOWN TO READ: **MST**, **registered address**, **legal name** (compared with the certificate — that comparison *is* the act of verifying) and **sales owner** (Chưa phân is allowed — ownership has its own home, the Ownership actions, and a company can be verified before a rep is found).',
            'WHERE “WAITING” SHOWS — one derived value on five surfaces: (1) Customers · Verified filter, whose three values ARE the three status labels; (2) Customers toolbar chip **Chờ verify · n** — one click filters to *Waiting to verify*, a second clears it, hidden when n = 0; (3) the tag itself on every row, plus *Chưa có ERC — chờ employer upload* under a No-paperwork tag; (4) Company detail header: the tag, and the Verify button enabled only in Waiting; (5) Sign-ups · Move dialog, no-match panel: the same line.',
            'Pressing Verify writes `verifiedAt`, `verifiedBy`, flips the tag blue on both sites, enables Post job on the Company site and the invoice request in the CRM, and resolves the Sign-ups row if one is open.',
            'Verify is an ADMIN duty with its own permission (`company:verify`, build), not the sales owner’s and not `company:update`: correcting a customer’s address and ruling on their legal paperwork are different authorities. The button is not hidden on a colleague’s record, and it works on a record with no owner.',
            'Admin may also upload the ERC on the employer’s behalf (customer emailed it) — same card, marked “Admin upload hộ”; that alone moves the company to Waiting to verify.',
          ],
          warn: 'WAITING IS A LABEL, NOT A STORED STATE. The record still holds `verified | unverified` only; do NOT add a third value to the enum or persist it. It is a function of the verdict and the documents that already exist, and storing it is how a tag says “Waiting to verify” while the button says “No paperwork”. Compute it where it is read — on both sites.',
        },
        {
          label: 'After Verified — the employer’s Company information is read-only; an admin edit drops the flag',
          table: {
            cols: ['Who edits identity data', 'Unverified company', 'Verified company'],
            rows: [
              ['Employer (Company site · Company information)', '**Allowed** — Edit / Save changes / Upload document all shown', '**Read-only.** Edit and Save are gone; Upload document stays (more pages of the ERC never hurt). The page says: “Đã xác minh — để thay đổi thông tin công ty, liên hệ Saramin.”'],
              ['Admin (Company detail · Basic info)', 'Allowed', 'Allowed — **and Save drops the flag to Unverified · cần xác minh lại**, with who/when recorded. The same Verify button clears it.'],
            ],
            },
          items: [
            'WHY FREEZE THE EMPLOYER: two parties editing a verified identity independently is how the invoice and the certificate stop matching. One editor (admin), one consequence (re-check), one button.',
            'IDENTITY DATA = the fields the checklist reads: legal name · MST · registered address · company type. Basic facts (industry, size, website) and Company page content do not touch the flag.',
          ],
          warn: 'The re-verify drop is on SAVE, not on opening the editor — and it is silent by design except for the tag and the reason line. An admin correcting a typo has done the right thing; the flag simply says the check is owed again, and the same admin can press Verify in the next click.',
        },
        {
          label: 'The tag on the Company site — where it shows and what sits beside it',
          items: [
            'BESIDE THE COMPANY NAME — in the account menu (Figma [2791-10975](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2791-10975) · [2302-44567](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2302-44567)), in the console header, and **in the page title of Company information** (client, 09/2026 — the page is titled with the company, so the state reads as a property of the company rather than of the page). Verified: blue shield pill. Unverified: the amber / slate pill **plus one action, whose label is the EMPLOYER’s verb** — “Cập nhật hồ sơ để được xác minh · còn N mục →” (EN: “Update your details to get verified · N left →”), shortened to “Cập nhật hồ sơ · còn N mục →” in the one-line header strip. Once all three inputs are in, the action becomes a quiet line “Waiting to verify · Saramin xác minh trong 1 ngày làm việc” — an action with nothing left to do behind it is a nag people learn to ignore.',
            'ON POST JOB: in place of the disabled actions — “Công ty chưa được xác minh — chưa đăng tin được, kể cả bản nháp. Để được xác minh, tải lên Giấy chứng nhận đăng ký doanh nghiệp (ERC) ở Company information:” followed by the certificate row (✓ or ✗) and the button “Company information →”. Once uploaded: “Waiting to verify — Saramin xác minh trong 1 ngày làm việc; sau đó bạn đăng tin được ngay.” The form is still visible; only Publish and Save draft are disabled.',
            'ON COMPANY INFORMATION (Figma [view 2311-10289](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2311-10289) · [edit 2313-10289](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2313-10289)): the tag sits in the page title beside the company name, with the primary action **Tải lên ERC để được xác minh →** scrolling to the documents section. While No paperwork an amber banner says “No paperwork — để được xác minh, Saramin cần Giấy chứng nhận đăng ký doanh nghiệp (ERC)” and the documents section is a dropzone marked “Bắt buộc để xác minh”; once a file is on record the banner turns blue — “Waiting to verify — Saramin xác minh trong 1 ngày làm việc”. Verified: no banner, the page is read-only (next block). Full page spec: Account management → Company information (company site).',
            'NAME THE DOCUMENT THE WAY THE USER KNOWS IT (client, 09/2026). “ERC” is OUR shorthand — an HR person in Vietnam recognises **giấy chứng nhận đăng ký doanh nghiệp**. So every employer-facing string leads with the Vietnamese name and carries the acronym in parentheses at most once per screen: the sign-up field is “Giấy chứng nhận đăng ký doanh nghiệp (ERC) — không bắt buộc”, the upload card is titled the same, and running copy says “giấy chứng nhận đăng ký doanh nghiệp” or “giấy này”, never a bare “ERC”. Inside this spec and on the admin console, ERC stays the shorthand.',
            'THE ERC CARD IS A DROPZONE WHILE EMPTY, not a grey “no files” line (client, 09/2026): “Tải lên Giấy chứng nhận đăng ký doanh nghiệp (ERC)” · “Kéo thả hoặc bấm để chọn tệp · PDF hoặc ảnh · nhiều trang là bình thường” · and the reason underneath — “Saramin đối chiếu ERC với MST và địa chỉ đăng ký MST ở trên, rồi xác minh trong 1 ngày làm việc.” The card header also carries a **Bắt buộc để xác minh** chip while no file is on the record. This upload is the single control that moves a company from No paperwork to Chờ xác minh, so it is the most prominent thing on the page.',
            'ON THE SIGN-UP SUCCESS PAGE: the tracker names the step (“Saramin verifies your company”) so the tag is expected, not alarming, when they first see it.',
          ],
        },
          {
            label: 'Match — một danh sách công ty có link, không phải một cái tên',
            text: 'Câu hỏi *“công ty này mình đã có chưa?”* **không có một đáp án duy nhất**. Một đuôi email thường thuộc về nhiều bản ghi của mình — công ty mẹ và chi nhánh dùng chung `@truongson.vn` — còn tên công ty thì người đăng ký gõ kiểu gì cũng được (“Trường Sơn Group”).\n\nMột ô `matchName` chỉ giữ được **một** đáp án, nên nó **im lặng giấu đi** các ứng viên còn lại: admin chọn từ dropdown mà không hề biết có bản ghi thứ hai giống hệt. Vì vậy Match là **danh sách các công ty khớp**, mỗi dòng **link thẳng sang bản ghi đó**, và **suy ra lúc đọc** chứ không lưu.',
            table: {
              cols: ['Tín hiệu khớp', 'So sánh cái gì', 'Vì sao đủ tin'],
              rows: [
                ['**tên**', 'Tên công ty người dùng gõ ↔ `name` / `legalName`, đã chuẩn hóa: bỏ dấu, bỏ “Công ty · TNHH · CP · Cổ phần · Group · Corporation”, bỏ khoảng trắng', 'Bắt được “viet tien”, “Việt Tiến Logistics”, “Công ty TNHH Việt Tiến” là một'],
                ['**đuôi email**', 'Domain của email đăng ký ↔ `website` của công ty (bỏ `http(s)://`, `www.`, path)', 'Email công ty là bằng chứng mạnh nhất — nhưng **bỏ qua mail công cộng** (gmail · yahoo · outlook · hotmail · icloud · proton): khớp mọi @gmail với mọi công ty là cách dạy admin bỏ qua cả cột'],
                ['**MST**', 'Mã số thuế khai lúc đăng ký ↔ `taxCode`, khớp chính xác', 'Chính xác nhất, nhưng thường bỏ trống lúc sign-up'],
              ],
            },
            items: [
              'MỖI DÒNG CÓ CHIP NGUỒN, GHI THẲNG TÊN LIST: **Customers** (xanh) hoặc **Free data** (amber). Hai nguồn dẫn tới hai hành động khác nhau — hit Customers thì Move được ngay, hit Free data thì phải đưa lên trước — nên đó là dữ kiện phải đọc được trên dòng. Không dùng chữ viết tắt nội bộ (“CRM”, “Bể”): operator đọc tên list mà họ sắp bấm vào.',
              'LÝ DO KHỚP (`tên+đuôi email`, `đuôi email`, `MST`) nằm ở **hover title**, không in trên dòng: nó giải thích cách *bộ máy* tìm ra bản ghi, không phải câu hỏi của operator — họ mở công ty ra xem là biết. Vẫn giữ được cho ca mơ hồ, mà không tốn một cột chữ nhỏ trên mọi dòng.',
              'THỨ TỰ: CRM trước Bể, rồi tới số tín hiệu khớp nhiều hơn. Đó đúng là thứ tự admin nên cân nhắc.',
              'HYPERLINK mở thẳng bản ghi — CRM sang Customers, Bể sang Free data. Không có link thì admin phải nhớ tên rồi đi tìm ở màn khác, và sẽ đoán thay vì kiểm.',
              'KHÔNG KHỚP GÌ → một nhãn `Not match`. Đó là câu trả lời thật, không phải danh sách rỗng.',
              'DROPDOWN “Move into company” ĐỌC ĐÚNG DANH SÁCH ẤY: nhóm **“Khớp với sign-up này (N)”** lên đầu kèm lý do khớp, phần còn lại của sổ khách nằm dưới nhóm “Tất cả công ty”. Mặc định chọn ứng viên đầu tiên.',
              'KHỚP TỪ 2 CÔNG TY TRỞ LÊN → modal **cảnh báo**: thường là mẹ và chi nhánh dùng chung đuôi email, gán nhầm thì user thấy sai tin tuyển dụng và sai quota. Admin phải tự chọn — hệ thống không đoán hộ.',
              'CỔNG “ĐƯỢC MOVE HAY CHƯA” ĐỌC CHUNG MỘT HÀM với cột Match (có ít nhất một ứng viên CRM). Tính riêng ra hai chỗ là kiểu bug mà cột hiện một đằng, nút chặn một nẻo.',
            ],
            warn: 'ĐỪNG LƯU kết quả match vào bản ghi sign-up. Danh sách phải được tính lại mỗi lần đọc: công ty mới được tạo, dòng Free data được đưa lên Customers, website được sửa — mọi thay đổi đó đều đổi câu trả lời. Một `matched: boolean` + `matchName` lưu sẵn sẽ đúng đúng một lần, ngay lúc ghi.',
          },
        {
          label: 'Sign-up creates a REQUEST — no login and no company until an admin places the person',
          text: 'Anyone can self-register on the Company site. The form captures the person (full name, email, phone, password set here), their company (tax number, company name, “is your company currently hiring?”), a Terms agreement — and, **new since 09/2026, an optional ERC upload** (Giấy chứng nhận đăng ký doanh nghiệp, several files allowed).\n\nOn submit a verification email goes out immediately. **Clicking the link is the whole gate**: it creates the login, creates the company on Customers with **Verified = Unverified** and no sales owner, and the person is inside the console at once. What waits for an admin is not access — it is **verification**, and verification gates exactly two things: posting a job and being invoiced. See the flow blocks at the top of this page.',
          table: {
            cols: ['Action', 'Result'],
            rows: [
              ['Sign up (new email)', 'Verification email sent immediately. Nothing exists yet — no login, no company, not even a row on this screen.'],
              ['Click the verification link', '**Email verified · one row appears on Sign-ups.** Still no login and no company: the page tells them Saramin is setting the account up, and gives the SLA.'],
              ['**Admin Moves or Creates**', '**Company exists (or is joined) · login activated · activation email sent.** This is the moment they can sign in — and the only one.'],
              ['Sign up with an already-registered employer email', 'Blocked — “this email already has an account, sign in instead”.'],
              ['Sign up with an MST that already belongs to a Customers row', 'Allowed — the row appears with the Match column flagging the existing company, which is exactly what Move is for. Blocking here would stop a real new HR person at a real customer from getting in.'],
            ],
          },
          items: [
            'One email = one employer login = at most one company at a time, separate from the jobseeker site. A second sign-up on the same email is blocked.',
            'THIS RESTORES THE 08/2026 MODEL (client, 09/2026). The 09/2026 experiment let the link itself open the console; it is reverted, deliberately. Both waits still exist — the person waits for **placement**, then their company waits for **verification** — but only the first one keeps them out. What a placed-but-unverified employer can do: sign in, read everything, upload the ERC, fix company information; what they cannot do: post a job (even a draft) or be issued the official invoice.',
            'THE PASSWORD IS STILL SET AT SIGN-UP, so the activation email is a “your account is ready, here is your company” link rather than a set-password step.',
          ],
          warn: 'A SELF-REGISTRATION IS NOT A CREATE DOOR ANY MORE. A company is created in exactly three ways and an admin operates all three: created on Customers, promoted from Free data, or created while resolving a sign-up. Nothing reaches the platform that an admin has not looked at — which is the property the client asked for when the gate was put back.',
        },
        {
          label: 'The Sign-ups screen — three actions, and Create is back',
          /* THE INTAKE DRAWING BELONGS HERE TOO, not only on Free data: this screen is
             where its sign-up row is actually worked. Same component, rendered twice
             on purpose — one drawing, two audiences. */
          diagram: 'company-intake',
          text: 'The Match column is information: it lists the companies this sign-up might already be, and which list each is in. What the operator DOES is exactly one of three things — and every one of them is a decision about a person who cannot get in until it is made.',
          table: {
            cols: ['Action', 'When', 'What it does', 'The person'],
            rows: [
              ['**Move to existing company**', 'Match names a **Customers** record', 'Creates the login **inside that company** with the role picked here; an ERC uploaded at sign-up moves across. No new company is created', '**Can now sign in.** Emailed the activation link and told which company they belong to. The destination’s roles and seat cap apply'],
              ['**Create company & activate**', 'Not match — a genuinely new company. Also the **Free data** case, where the pool row is PROMOTED instead of created fresh', 'Creates the Customers company (**Unverified**) with this person as its **first Admin**. A promoted pool row brings its phone / address / industry / source and leaves Free data', '**Can now sign in.** Emailed the activation link. Lands on the console with **No paperwork** and Post job disabled'],
              ['**Archive**', 'Spam, junk, not real', 'Resolves the row and blocks the email from ever activating. No company, no login. Reversible, audited', 'Never gets in. No email — spam gets no receipt'],
            ],
          },
          items: [
            'EVERY ROW MUST BE RESOLVED — there is no “leave it” option any more. An unresolved row is a person waiting outside the platform, which makes the age of the oldest row the real content of this screen, and the SLA a customer-facing promise.',
            'EMAIL VERIFICATION HAPPENS BEFORE THE ROW EXISTS. An unverified sign-up is not a row here — it is nothing yet. So there is no “awaiting email verification” state on this screen and no Email-verified column: every visible row has already passed it.',
            'CREATE IS BACK, and it is the COMMON case: most sign-ups are genuinely new companies. It is not a second create door — it is the same admin creating the same Customers record, from the row that asked for it.',
            'THE ACTIVATION EMAIL IS THE PRODUCT OF THIS SCREEN. Move and Create both send it — it is what turns the login on. Archive sends nothing, because spam gets no receipt.',
          ],
        },
        {
          label: 'Company status — Active / Archived, and the REASON it was archived',
          text: 'TWO system states, no more. The state answers one question — can this company get in, and does it show up — and nothing about the commercial relationship, which is what `account` (New / Existing / Churn) is for. Archive is soft and reversible; never a hard delete.',
          table: {
            cols: ['Status', 'Means', 'Rule'],
            rows: [
              ['Active', 'Normal — appears in all lists, logins work', 'The default, INCLUDING a churned customer. Không gia hạn, chuyển sang đối thủ and mất liên lạc are all churn: the company still exists and is still worth calling, so it stays Active and stays in the rep’s list.'],
              ['Archived', 'The company no longer exists, or no longer needs any care', 'Requires a REASON. Reversible (Unarchive). Never hard-deleted.'],
            ],
          },
          items: [
            'THE POINT IS NOT HIDING THE RECORD, IT IS STOPPING IT FROM GENERATING WORK. An archived company leaves every rep’s list, round-robin assignment, idle reminders, nurture campaigns and KPI counts, and stops appearing in search suggestions unless “include archived” is ticked. That — not visibility — is what “không cần chăm sóc nữa” means in system terms, and it is why a boolean is enough where an enum of a dozen states is not.',
            'THE REASON IS AN ENUM, NOT FREE TEXT — Phá sản / giải thể · Sáp nhập vào công ty khác · Trùng lặp / tạo nhầm · Vi phạm — ngừng phục vụ · Khác, with an optional note beside it. The follow-up genuinely differs per reason: a dissolved company means writing off what it owes, a merger means the obligations transfer to the surviving company (Điều 201 Luật Doanh nghiệp 2020), a duplicate means nothing at all. Free text also cannot be counted — “phá sản”, “Phá sản” and “pha san” are three different strings to anyone reporting on churn causes.',
            'NO “INACTIVE” STATE. A third state between Active and Archived was considered and dropped: every case for it (tạm ngừng kinh doanh, overdue payment, gone dark) is either still-worth-chasing — which is Active — or not worth any care, which is Archived. “Vi phạm” is the only case where the company still exists but needs no care; it is the same state with a different reason, and splitting it out buys nothing.',
            'THE REASON IS SHOWN ON THE RECORD, not just written to the log — the Archived pill reads “Archived · Sáp nhập vào công ty khác”. A tombstone with no cause of death sends the next rep to look it up.',
            'ARCHIVING IS NOT A REP’S CALL ALONE. It hides revenue and removes pipeline value, so it sits with a sales lead or HQ admin, and every archive/unarchive is audited with who, when and why.',
          ],
          warn: 'To retire a duplicate company: OFFBOARD its users first (deactivate there; the surviving company invites their emails fresh), THEN archive the empty one — never archive a company that still has active users or paid products without resolving them. And never archive a churned customer: they are still Active, still assigned, still worth a win-back call.',
        },
        {
          label: 'Sign-up status — three tracks now: the login, the company, the inbox row',
          text: 'Three things move, and they must not be confused: the LOGIN (can this email get in?), the COMPANY (has an admin verified it?) and the INBOX ROW (has an admin dealt with this sign-up?). Since 09/2026 the first and the third are chained — resolving the row is what activates the login — while the second runs on afterwards, on its own clock.',
          table: {
            cols: ['Track', 'States', 'Rule'],
            rows: [
              ['Login', 'Pending email verification → **Pending placement** → Active', '**Active only after an admin Moves or Creates**, and the person opens the activation link. The password was set at sign-up. Archive on Sign-ups blocks the email for good.'],
              ['Company', '**Unverified → Verified** (and back to Unverified if an admin edits identity data)', 'Two states — see “Verification status” above. This is the only track an admin gates.'],
              ['Inbox row (Sign-ups)', 'New → Resolved (moved · created · promoted) / Archived', 'Resolving it is what lets the person in, so this is the queue that carries the customer-facing SLA — 1 business day.'],
            ],
          },
          warn: 'THE LOGIN GATE IS DELIBERATE (client, 09/2026). It was removed in 09/2026 and has been put back: only people who belong to a company an admin has looked at get into the platform. The cost is real and has to be managed rather than ignored — while a row is open, a customer who has done everything asked of them cannot sign in. That makes the SLA on this screen a promise to a customer, not housekeeping.',
        },
        ],
        description:
          /* Kept to three sentences on purpose: the flow table, the status table and
             the Verify-inputs table below say the rest, and an overview that
             repeats them is a paragraph nobody reads twice. */
          'Self sign-up and the company verification it leads to, as one flow. The email link only proves the address — **an admin placing the person into a company is what opens sign-in** (Move into an existing customer · Create the company · Archive as spam), so an open row here is a customer standing outside the door. Verification of the ERC is the second, later gate: it happens on Company detail and unlocks exactly two things — the employer posting a job, and Sales requesting the official invoice.',
        userStory:
          'As a sales/ops user, I want every email-verified sign-up matched against companies we already have and resolved with one action, so that a real one lands in the right company on Customers and spam is discarded — while the user always knows where they are in the process.',
        uiFields: [
          {
            group: 'Sign-up row',
            items: [
              { name: 'personName', type: 'string', required: true },
              { name: 'email', type: 'email', required: true, notes: 'unique across employer logins; the matching key after tax code — a public domain can never auto-match' },
              { name: 'phone', type: 'string' },
              { name: 'companyNameTyped', type: 'string', required: true, notes: 'the company name the person entered at sign-up' },
              { name: 'taxCode (MST)', type: 'string', notes: 'the match key; also what verifies the company later' },
              { name: 'hiring', type: 'bool', notes: '"is your company currently hiring?" from the form — a priority signal, not a disposition' },
              { name: 'emailVerified', type: 'bool', notes: 'set true when the user clicks the link — which is also the moment the login and the Unverified company are created and the row appears. Reads true on every row HQ can see.' },
              { name: 'companyId', type: 'ref → Company', notes: 'the Unverified company the sign-up created. Move re-points the login to another company and archives this one; Verify on Company detail resolves the row.' },
              { name: 'ercFiles', type: 'file[]', notes: 'optional at sign-up, several files. Attached to the created company’s Enterprise Registration Documents card — never held on the sign-up row itself.' },
              { name: 'matchResult', type: 'derived (bool)', notes: 'derived, NOT stored — a RANKED LIST of candidate companies from three signals (name · email domain · MST) across Customers and Free data, each carrying which list it is in. Never binary, never tax-only, and it never changes the two actions. See the matching rule.' },
              { name: 'receivedAt', type: 'timestamp' },
              { name: 'status', type: 'enum', notes: 'New → Resolved (moved to existing · company verified) / Archived. Resolution by verification is automatic.' },
            ],
          },
          {
            group: 'Company · verification (stored on the company, shown on both sites)',
            items: [
              { name: 'verificationState', type: 'enum', required: true, notes: 'verified | unverified — exactly two. Default unverified on self sign-up.' },
              { name: 'verifiedAt / verifiedBy', type: 'timestamp / ref → admin', notes: 'set by Verify; cleared when the flag drops' },
              { name: 'unverifiedReason', type: 'enum', notes: 'new | edited — the line under the amber tag; `edited` carries wasVerifiedAt · editedAt · editedBy' },
              { name: 'salesOwner', type: 'ref → admin user?', notes: 'nullable — a self-registered company has none until Sales assigns one (Ownership). Shown as “Chưa phân”. NOT a Verify input.' },
              { name: 'ercDocuments', type: 'file[]', notes: 'several; each with uploadedBy (company | admin) and uploadedAt. Never deleted on re-upload.' },
              { name: 'verificationLabel', type: 'derived — never stored', notes: 'VERIFIED · WAITING_TO_VERIFY (unverified, ≥ 1 ERC on record) · UNVERIFIED = No paperwork (unverified, no ERC). Drives the Customers filter, the Chờ verify chip, the row hint, the Verify company button and the Company-site tag. One derivation, both sites — the build’s (svn-be V482).' },
            ],
          },
        ],
        behaviors: [
          'On submit the system holds the form (person, company, chosen password, any ERC files) and sends an email-verification link immediately. Nothing else exists yet.',
          'Clicking the link does THREE things at once: creates the login (Active), creates the company on Customers (Verified = Unverified, sales owner = Chưa phân, ERC files attached to its Enterprise Registration Documents card), and creates the row here. The three-signal company match (name · email domain · MST) runs as the row appears.',
          'Two actions on a row, both about DUPLICATES and junk, never about access: **Move to existing company** re-attaches the login to the company the admin picks and archives the Unverified duplicate the sign-up created (its ERC files move across); **Archive** deactivates the login and archives the shell company. A row with no match and no problem is left alone — it resolves when the company is verified. This REVERSES the 08/2026 model in which Move unlocked login: the person is already inside.',
          'Match is informational and never changes the two actions. It is a RANKED LIST of candidate companies, not a yes/no — see the matching rule for the three signals and how ties are ordered.',
          'Move emails the person which company they now belong to. Archive emails nothing — spam gets no receipt.',
          'The user sees the state in the console itself: the No paperwork tag beside the company name, a button to Company information, and a disabled Post job that asks for the ERC. There is no “under review” login screen any more, because there is no review before login.',
        ],
        rules: [
          'TWO gates, in order (client, 09/2026). The email link is the USER’s own and only proves the address — every row here has cleared it by definition. **Placement is the ADMIN’s first gate and it opens sign-in**: until Move or Create, the person is not in the platform. Verification is the admin’s second gate, on Company detail, and it gates posting and invoicing, not access.',
          'TWO actions on EVERY row, always the same two: **Move to existing company** · **Archive**. One affordance — the ⋯ menu — on every unresolved row. A table whose rows offer four different controls makes the operator read each row before they can act on any of them.',
          'THE TWO “NO CUSTOMER MATCH” OUTCOMES LIVE INSIDE THE MOVE DIALOG, and neither is a blocker any more (09/2026 — the sign-up already created the company). Company đang ở **Free data** → amber panel with **Gộp dòng Free data vào công ty này**: the pool row is absorbed into the shell (leaves Free data, fills empty fields, its open Xin nhận becomes an owner candidate) — never the reverse. No match at all → “đây là công ty mới”, with **Mở Company detail →**; the row resolves when the company is verified. The old “Đưa công ty lên Customers → / Tạo công ty trước →” blockers are gone: with a shell already on Customers they would have produced a third record.',
          '★ EMAIL VERIFICATION HAPPENS BEFORE THE ROW EXISTS (tightened 2026-08-23). An unverified sign-up is not a disabled row in this inbox — it is not a row at all; the request sits with the USER until they click the link. Consequences that follow, and each one removes something from the screen: there is no “awaiting verification” state, no Email-verified column (it would read the same value on every row), and no branch in the Move dialog. Placement and login are the same moment again — Move unlocks the login and sends the “you’re in” email. This REVERSES the earlier model in which an unverified person could be placed and their login opened later; that split made the operator hold two states apart for a case they can no longer meet. Spam never reaches the queue either, which is what the old rule was protecting against by keeping it archivable.',
          'REMOVED: “Create new company + move” and “Promote from Free data + move”. Both were extra doors into the company table, placed on a screen that does not ask for phân loại người mua, địa chỉ xuất hoá đơn or người liên hệ — a record created there would stall at the VAT-invoice step, by which time the company already has users signing in.',
          'The result is the invariant: **the company is always created first, then the user is assigned.** See the intake flow diagram on this page.',
          'Moving a user into a company picks their role there and respects its seat cap. There is no “creating” branch on this screen, so there is no Admin-by-creation case either.',
          'NO SALES-OWNER FIELD on this screen (was required on both actions when one of them created a company). A sign-up is only ever moved into a company that is already on Customers, and the promotion gate guarantees every such record HAS an owner — asking again here invited the operator to change ownership in passing, from a dialog about a person. Ownership changes have one home: Chuyển giao on the company record.',
          'Password is set at sign-up; the approval email is a sign-in notice, not a set-password link.',
          'One email = one employer login; a second sign-up on the same email is blocked. Every resolution is audited.',
          '★ COMPANY MATCHING — THREE SIGNALS, TWO LISTS, AND IT IS A LIST NOT A VERDICT. The matcher reads (1) **company name** typed at sign-up, normalised, against both `name` and `legalName`; (2) **email domain** — the part after @ in the sign-up email, against the company’s website domain; (3) **MST**, exact. It scans **Customers AND Free data**, because knowing the company exists but is unclaimed is the whole reason the Move dialog can send the operator to promote it.',
          'A ROW CAN MATCH MORE THAN ONE COMPANY, so the cell shows a LIST, ordered: Customers before Free data (one is actionable now, the other is not), then by NUMBER OF SIGNALS matched, then by name. Two signals agreeing is materially stronger evidence than one, and the order is what puts the likely answer first without hiding the others.',
          'THE NAME COMPARISON IS EXACT AFTER NORMALISATION, not fuzzy: lower-cased, diacritics stripped, whitespace removed, and the legal-form noise dropped (`công ty` · `tnhh` · `cp` · `cổ phần` · `group` · `corporation`). So “Công ty TNHH Việt Tiến” and “viet tien” are the same string, while “Việt Tiến” and “Việt Tiến Logistics” are NOT — a substring match would pull in every company sharing a common word, which on Vietnamese company names is most of them. Fuzzy matching here is a Phase-2 question, and it needs the alias problem solved first.',
          'FREE-MAIL DOMAINS ARE EXCLUDED from the domain signal by an explicit list (gmail · yahoo · outlook · hotmail · icloud · proton · yopmail). Matching every `@gmail.com` sign-up against every company that ever listed a gmail address would fill the column with noise and teach the operator to ignore it — and the column is only worth having if it is trusted.',
          'EACH SIGNAL FAILS DIFFERENTLY, which is why three are read rather than one. A NAME hit alone is weak — “Công ty TNHH Minh Long” is a dozen companies. A DOMAIN hit alone is strong for a company domain and worthless for a public one: `@gmail.com` must never match anything, so free-mail domains are excluded from matching entirely. An MST hit is the only exact one, and it is also the one most often absent, because MST is optional at sign-up.',
          'NO AUTO-PLACEMENT ON A MATCH, ever, however many signals agree. A confident match still only pre-selects the company in the Move dialog — a person is being given access to a company’s candidate pipeline, and that is not a decision to make on a string comparison. The operator confirms.',
          'THE SOURCE IS SHOWN, THE REASON IS NOT (2026-08-23). Each match renders as its list badge — **Customers** or **Free data** — plus the company name. The old cell also printed WHY it matched (“tên+đuôi email”); that described our matcher rather than answering the operator’s question, and the operator answers it by opening the company. The reason survives in the hover title for the genuinely ambiguous case.',
        ],
        states: ['Login: Pending email verification → Active — the moment the link is clicked', 'Company: Unverified (new) → Verified → Unverified (edited) → Verified', 'Inbox row: New → Resolved (moved · merged · verified) / Archived'],
        backend: {
          dataModel: [
            { name: 'signupId', type: 'uuid', required: true },
            { name: 'personName / phone', type: 'string' },
            { name: 'email', type: 'string', required: true, notes: 'unique across employer logins' },
            { name: 'companyNameTyped', type: 'string', required: true },
            { name: 'taxCode', type: 'string', required: true, notes: 'NOT uniqueness-blocked at sign-up — a duplicate is a new HR person at an existing customer more often than fraud; Match + Move resolves it. Uniqueness is enforced at Verify' },
            { name: 'hiring', type: 'bool' },
            { name: 'ercFiles', type: 'file[]', notes: 'optional at sign-up; attached to the created company when the email is verified — never kept on the row' },
            { name: 'emailVerified', type: 'bool', notes: 'the ONLY gate before sign-in. Flipping it creates the login and the company' },
            { name: 'companyId', type: 'uuid', notes: 'the Unverified company this sign-up created. Move re-points the login elsewhere and archives it' },
            { name: 'outcome', type: 'enum?', notes: 'moved_to_existing | merged_pool_row | verified | archived' },
            { name: 'status', type: 'enum', required: true, notes: 'new | resolved | archived — resolved by Move, by merge, or automatically when the company is verified' },
            { name: 'company.verification', type: 'enum + audit', required: true, notes: 'ON THE COMPANY, not the row: verified | unverified, with verifiedAt/verifiedBy, or unverifiedReason (new | edited) + wasVerifiedAt/editedAt/editedBy. The row is resolved and forgotten; the flag lives for the life of the record' },
            { name: 'company.salesOwner', type: 'ref?', notes: 'nullable — the only place a Customers row may have no owner. Shown as Chưa phân; assigned through Ownership, not by Verify' },
          ],
          endpoints: [
            'POST /company/signup — holds the form (+ ERC files), sends the verification email; nothing exists yet',
            'GET /company/signup/verify?token= — creates the login (Active, Admin of the new company), the company (unverified/new, owner null, ERC attached) and the Sign-ups row; runs the three-signal match',
            'GET /admin/crm/signups?status=',
            'POST /admin/crm/signups/:id/move-to-existing { companyId, role } — re-point the login, archive the shell as duplicate, move its ERC files, email “you now belong to X”',
            'POST /admin/crm/signups/:id/merge-pool-row { poolRowId } — pool row leaves Free data, fills the shell’s empty fields, its open claim requests become owner candidates',
            'POST /admin/crm/signups/:id/archive { reason } — deactivate the login, archive the shell',
            'POST /admin/crm/companies/:id/verify — 409 unless at least one non-rejected ERC is on the record (Waiting to verify), the same derivation the list filters on; sets verifiedAt/verifiedBy; resolves the Sign-ups row. Permission company:verify',
            'GET /admin/crm/companies?verification=VERIFIED|WAITING_TO_VERIFY|UNVERIFIED — the Customers filter and the Chờ verify count; the label is computed in the query from the verdict + documents, never read from a column',
            'PATCH /admin/crm/companies/:id (identity fields) — on a verified company sets unverified/edited with wasVerifiedAt · editedAt · editedBy',
          ],
          integrations: ['Company site — sign-up form (source) · Company information (ERC upload; read-only when verified) · the header tag', 'CRM Customers — Verified column + filter, Verify button, Enterprise Registration Documents card', 'Job management — Create job on the Company site reads the flag', 'Invoices — “Yêu cầu xuất hóa đơn chính” reads the flag', 'Auth — email verification creates the login; no placement gate', 'Notifications — verification email · “you now belong to X” · verify-queue SLA nudge'],
          notes: 'ONE gate before sign-in (email) and ONE admin gate after it (verification), gating different things: the first gates access, the second gates posting and invoicing. Store the verification state on the COMPANY, never on the sign-up row.',
        },
        acceptance: [
          'On submit a verification email is sent immediately; nothing exists yet — no login, no company, no row in this inbox.',
          'Clicking the link creates the login, a company on Customers with Verified = Unverified and no owner (ERC files attached if given), and ONE row here. The person can sign in at once.',
          'Signed in, not yet verified: the console header shows No paperwork with a button to Company information; Post job shows Publish and Save draft disabled, the ERC asked for and a link to Company information; Company information opens with the same banner; reading, editing Company information and uploading the ERC all work.',
          'The row never lists the company this sign-up created as its own match; a real duplicate on Customers or Free data does appear, with the signal that found it.',
          'Move re-attaches the login to the chosen company, archives the shell as duplicate, carries its ERC files over, and emails the person which company they belong to.',
          'A Free data match offers “Gộp dòng Free data vào công ty này”: the pool row leaves Free data and the shell keeps its data; no third record is created.',
          'Admin: Customers → the Verified filter offers Verified · Waiting to verify · No paperwork; a newly placed company with no ERC lists under No paperwork with “Chưa có ERC — chờ employer upload” under its tag — in the department view even with no owner. The Chờ verify chip shows the count of Waiting rows and applies that filter in one click.',
          'Verify company on a No-paperwork record → the button is disabled and its tooltip says there is nothing to rule on yet; the employer uploads the ERC (or the admin does) → the tag reads Waiting to verify, the button enables, the dialog shows the ERC ✓ and the MST, address, legal name and owner as facts to read against it. Verify with owner = Chưa phân is allowed. Verify → tag blue on both sites, Post job enabled, Company information read-only for the employer, “Yêu cầu xuất hóa đơn chính” enabled, this row reads Resolved.',
          'Admin edits the legal name of a verified company and saves → Chờ xác minh · cần xác minh lại on both sites; Post job disabled again; Verify company reappears.',
        ],
        openQuestions: [
          'Who approves a Move into an EXISTING company — Saramin admin alone (current default) or that company’s own Admin (safer: an MST is public, and a wrong Move exposes the customer’s jobs, applicants and quota)? Recommendation: the company’s Admin, with Saramin override only when the company has no active Admin.',
          'Fast-path: when the sign-up’s email domain matches an already-verified company, auto-propose the Move (or attach as a pending member) instead of waiting for an operator?',
          'Should an admin-created company (Customers → New company) be Verified at creation when an ERC is attached, or always start Unverified? Recommendation: Verified-at-creation — that admin has just done the checklist.',
          'Grace period on the re-verify drop for a typo fixed by the same admin within minutes? Recommendation: no — one rule, one button.',
          'Should stale Unverified companies still missing an input after N days nudge the employer (naming the missing item), and stale Sign-ups rows auto-archive?',
        ],
      },
    },
    // 1 · Pipeline ────────────────────────────────────────────────────
    {
      name: 'Sales pipeline',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'crm-pipeline',
      detail: {
        requirements: [
          {
            label: 'Changing the pipeline stage — who may set what',
            text: 'The stage is editable from the company detail page, on the stage badge in the header. It is NOT a free dropdown of six values: three stages are a sales judgement, one is a sales decision that needs a reason, and two are consequences the system writes. Letting a rep pick PO or Invoice by hand would put a deal in a state no document supports.',
            table: {
              cols: ['Stage', 'Who sets it', 'How'],
              rows: [
                ['Proposal', 'SALES', 'Picked from the badge. Also set by SYSTEM when the first quotation is created.'],
                ['Qualified', 'SALES', 'Picked from the badge, when the customer engages with the quotation.'],
                ['Negotiation', 'SALES', 'Picked from the badge, when the customer asks for changes or starts internal approval.'],
                ['PO', 'SYSTEM ONLY', 'Written when **Sales** issues the PO from the accepted option. NOT in the menu.'],
                ['Invoice', 'SYSTEM ONLY', 'Written when **Kế toán** issues the OFFICIAL VAT e-invoice. A draft invoice does not move the stage. NOT in the menu.'],
                ['Lost', 'SALES', 'Picked from the badge, from ANY stage, and only with a reason.'],
              ],
            },
            items: [
              'Movement between Proposal / Qualified / Negotiation is FREE and bidirectional. A deal genuinely goes backwards — the champion leaves and it returns to Proposal — so this is not a one-way ladder and the UI must not model it as one.',
              'LOST is reachable from every stage and is the only exit a person takes at will. It asks for a reason (Giá cao · Chọn đối thủ · Cắt ngân sách · Không còn nhu cầu · Mất liên lạc) and the save is blocked until one is chosen — an unreasoned loss is what makes a loss report worthless.',
              'Closing as Lost does NOT change the customer status and does not remove the company: it stays in nurture, and a new quotation re-opens the deal.',
              'A LOST deal keeps the control so it can be re-opened to an earlier stage. Hiding the badge there would leave no way back.',
              'INVOICE is terminal and closed-won: the control is not shown at all. There is no stage left to move to.',
              'The two system stages are NOT in the menu at all — not even greyed. A menu exists to offer the choices that exist; listing two that can never be picked only invites “why can’t I select this?”. Where PO and Invoice come from is documented here and visible in the document chain itself.',
              'The control must LOOK editable, with ONE signal: a chevron INSIDE the stage chip, which flips when the menu is open. A plain badge said nothing — but a wrapper border plus a hover label was three signals doing one signal’s job, and it stopped the control reading as a badge among the others. Chevron in the chip, nothing around it.',
              'The control is read-only when the company belongs to another rep — same rule as every other field on the record, with the same reason shown.',
              'Every stage change is audited: from, to, who, when, and the reason when there is one.',
            ],
            warn: 'The stage lives on the DEAL, not on the company. Editing it from the company header is a convenience for the common case of one live deal — with several open deals the control has to move onto the deal, not the company.',
          },
        {
          label: 'Pipeline stages (the kanban)',
          text: 'The board mirrors the document chain. A card carries deal value + owner. Stage lives on the deal, never on the company.',
          table: {
            cols: ['Stage', 'What it means', 'Entered when', 'Rule'],
            rows: [
              ['Proposal', 'A quotation exists for this company — being written or already out', 'Quotation created (Draft)', '**System** puts the card here the moment **Sales** creates the quotation, while it is still Draft — the stage is a consequence, never a manual drag. Working on a quote **is** the proposal activity, so the deal is visible on the board from the first keystroke rather than appearing only once it is sent. → Next action: **Sales** finishes it and clicks “Mark as sent”, then chases a reply.'],
              ['Qualified', 'HR manager is willing to discuss that quotation', 'Customer engages / replies', '**Sales** moves the card when the customer engages. May be skipped entirely — Proposal → Negotiation is legal. → Next action: **Sales** agrees the option and the price.'],
              ['Negotiation', 'HR manager is running it through internal approval', 'Customer asks for changes or approval starts', '**Sales** moves the card; a revision to v2 / v3 happens here without leaving the stage. → Next action: **Sales** creates the PO from the option the customer accepted.'],
              ['PO', 'A PO has been issued to the customer — this is “won”.', 'PO issued', '**Sales** reaches this by issuing the PO (with bank details) off the accepted option. The “won” moment — but it provisions **nothing**, and the customer has neither paid nor received anything. The PO expires at the end of its month unless an OFFICIAL invoice follows. → Next action: **Sales** requests the official invoice; **Kế toán** issues it.'],
              ['Invoice', 'The OFFICIAL VAT e-invoice is filed — closed won', 'Official invoice issued', '**Kế toán only** reaches this, by filing the official invoice (hóa đơn chính). A draft invoice does **not** move the card. **System** then closes the deal won, flips the customer to Existing and provisions the products immediately. Payment may still be outstanding — that is a receivables matter, not a stage.'],
              ['Lost', 'Ended without a PO — declined / competitor / budget cut / went silent', 'A human closes it and picks a reason', '**Sales** only, by hand, with a reason — **System** never auto-closes a deal however long it sits (a stale deal is flagged rotting, not lost). → To re-open: **Sales** moves it back to an earlier stage; a win-back is a new deal on the same company.'],
            ],
          },
          items: [
            'Invoice and Lost are terminal; a Lost deal can be re-opened to an earlier stage, and win-back means a new deal on the same company.',
            'A company appears on the board as soon as a quotation is created for it — Draft included. Writing the quote is the proposal work, so hiding it until Send would leave live deals invisible.',
          ],
        },
        {
          label: 'A deal is its own record',
          text: 'The Account/Opportunity split every mature CRM uses. A company has zero, one or many deals over its life — deal #1 won in 2026, deal #2 lost, deal #3 open now.',
        },
        {
          label: 'Leaving the pipeline — exactly three ways',
          table: {
            cols: ['Way out', 'Trigger', 'Where the company lands'],
            rows: [
              ['Closed-won', 'VAT e-invoice issued', 'Customer status Existing'],
              ['Closed-lost', 'A human marks it, with a reason', 'NURTURE list — customer status unchanged (still New if they never bought, still Existing if they had), no open deal, with a re-engage date'],
              ['Quotation expired', 'Month-end passes with no PO issued — **System**, not a human', 'Off the board, customer status unchanged, not counted as Lost. The company stays a live prospect; it simply has no live offer. A new quotation (or a v2) puts it straight back at Proposal.'],
            ],
          },
          items: [
            'The third way is a consequence of what puts a company ON the board: a quotation exists. When the quotation stops existing as a live offer, the reason for the card is gone, so the card goes too.',
            'Expiry is not Lost. Lost means a human decided the deal is dead and gave a reason; expired means an offer ran out of time. Counting expiries as losses would make the loss rate meaningless and hide the real reason — nobody followed up before month-end.',
          ],
          warn: 'INACTIVITY alone still never removes a company, and a deal is never auto-closed as Lost — a stale deal is flagged so a human is forced to decide. Only the quotation’s own expiry date takes a company off the board automatically.',
        },
        {
          label: 'Pipeline hygiene',
          text: 'Each stage has its own inactivity threshold (days since the last meaningful activity). Past it the deal is flagged rotting — amber then red — lands in a “Needs attention” filter, then escalates to the sales lead. Thresholds live in settings, not in code.',
        },
        {
          label: 'idle vs deal rot — not the same thing',
          table: {
            cols: ['', 'Deal rot (pipeline hygiene)', 'Idle'],
            rows: [
              ['Measures', 'Neglect of an opportunity', 'Health of the relationship'],
              ['Scope', 'Only while a deal is open', 'Always, every company'],
              ['Thresholds', 'Per stage', 'Per relationship type (table above)'],
              ['Escalation', 'Flagged rotting → “Needs attention” filter → sales lead', 'Amber / red on the list; drives follow-up queue'],
            ],
          },
          items: ['A won customer has no rot but still has an idle age — which is exactly the early signal for churn.'],
        },
        ],
        description:
          'The sales team’s home screen: a kanban of customer deals grouped by stage, following the document flow Proposal → Qualified → Negotiation → PO → Invoice (+ Lost). Each column shows a deal count and total value. A rep drags a card forward as a deal progresses; reaching PO (the Purchase Order) is the "won" trigger to activate the company as a real customer.',
        userStory:
          'As a sales rep, I want to see all my deals by stage and move them forward, so that I always know what to work on next and what to close.',
        uiFields: [
          {
            group: 'Board',
            items: [
              { name: 'stage columns', type: 'enum', required: true, notes: 'Proposal · Qualified · Negotiation · PO · Invoice · Lost — Proposal: quotation actually sent (platform Send or "Mark as sent"; a draft never lands here) · Qualified: HR mgr willing to discuss it · Negotiation: HR mgr in internal approval · PO: customer agreed, Sales issued PO (won) · Invoice: paid, Accounting issued invoice (closed) · Lost: ended without a PO' },
              { name: 'column total', type: 'derived', notes: 'deal count + summed deal value (₫) per stage — each deal counted once at one option’s value (accepted, else highest), never the sum of its options' },
              { name: 'view toggle', type: 'enum', notes: 'board · list · grid' },
            ],
          },
          {
            group: 'Deal card',
            items: [
              { name: 'company', type: 'ref → Customer', required: true },
              { name: 'industry', type: 'enum', notes: 'Y tế · IT · bđs · Logistics · Bán lẻ · Giáo dục · Tài chính…' },
              { name: 'value', type: 'money (₫)', notes: 'the accepted option’s total-after-VAT once decided, else the highest option’s — one option, never a sum' },
              { name: 'owner', type: 'ref → admin user' },
              { name: 'lastActivity', type: 'relative date', notes: 'lastMeaningfulAt = max(last clock-resetting timeline activity, stage change). Two inputs only — document events already write a timeline activity, so they are covered by the first.' },
              { name: 'awaitingReply', type: 'derived', notes: 'set when the last logged activity was inbound (customer wrote/called and nobody answered). Separate from rotting — shown as its own badge.' },
              { name: 'idle', type: 'derived', required: true, notes: 'one field, held on the company/deal record and read unchanged by every screen — the Customers directory, the Pipeline board and any report all show the same number. There is no per-screen idle.' },
              { name: 'daysInStage', type: 'derived', notes: 'days since the card entered its current stage — context only, never drives the colour' },
              { name: 'healthDot', type: 'enum', notes: 'green (fresh) · amber (approaching the stage threshold) · red (rotting — past it). The one idle number, coloured by the stage it currently sits in. Purely a visual warning; it never moves the card.' },
              { name: 'activityBadges', type: 'counts', notes: 'linked quotes / POs / invoices / contracts' },
            ],
          },
        ],
        behaviors: [
          'Filter by owner, industry, recency and min deal value; sort (default updated-desc).',
          'Activity quick-filters: has quote / has PO / has invoice / has contract.',
          'Drag a card between columns to change its stage; dropping into PO opens the activation flow.',
          '"New quote" / "Invoices" shortcuts jump to those sub-modules for the selected deal.',
          'Rotting: a deal with no meaningful activity past its stage threshold turns amber, then red, and surfaces in a "Needs attention" filter. The card never moves on its own.',
          'A red card prompts the owner to disposition it: log an activity (resets the clock) · move the stage · push out with a next-step date · or close as Lost with a reason.',
          'If a red card is untouched for a further 14 days it escalates to the sales lead’s review queue; only a human closes it as Lost (reason: "No response / went silent").',
        ],
        rules: [
          'A deal belongs to exactly one customer and one owner. A company may have at most one open deal at a time (so "pipeline status" is unambiguous), plus any number of closed ones in its history.',
          'The company has no stage column. Pipeline status is read from the open deal, and is "Not in pipeline" when there is none — including before the first deal, and after every deal has closed.',
          'A company only ever leaves the pipeline because a deal closed: won (invoice issued) or lost (a human clicked, with a reason). Never because time passed.',
          'A deal only appears on the board once one of its quotations reaches sent. Opening a deal and drafting a quote is pre-pipeline work: the company still reads "Not in pipeline", carries no deal value and runs no rot clock, and the card materialises at Proposal on quote.sent. A deal whose only quotation is a Draft is invisible here by design — that is what stops half-finished quotes inflating the forecast.',
          '"Sent" is whatever the rep declared, through the platform Send or through "Mark as sent" for a PDF that left from their own mailbox / Zalo. The stage gate reads the quotation’s status field and nothing else, because most quotations are delivered outside this system and a mail-log-based gate would leave those deals permanently off the board.',
          'Proposal requires a Quotation in Draft state or later; PO requires an Active PO; Invoice requires an Accounting-confirmed payment AND an issued VAT e-invoice.',
          'Deal value is one option, never a sum: the accepted option’s total-after-VAT once the customer has decided, and the highest option’s total before that. A quote offering ₫6,588,000 and ₫2,926,800 shows ₫6,588,000 on the card — 9,514,800 must appear nowhere.',
          'The "recommended" flag drives the PDF highlight only; it does not set the deal value. Value is a deterministic max so one quotation can never read as two different numbers across the card, the column total and a report.',
          'Invoice and Lost are terminal columns; a Lost deal can be re-opened to an earlier stage.',
          'A deal is never auto-closed as Lost. Inactivity flags it as rotting; a human always makes the Lost call and picks the reason. Auto-closing corrupts win-rate (a deal nobody worked reads as a competitive loss) and silently kills follow-up.',
          'The rotting clock has exactly two inputs: lastMeaningfulAt = max(last clock-resetting timeline activity, stageEnteredAt). Whichever is more recent resets it.',
          'Document events are not a third input — they are folded into the first, because every document action writes a timeline entry (quotation sent/revised/accepted, order sent/confirmed, payment recorded/confirmed, invoice issued). Most of them also change the stage, but two do not — a quote revision (v2/v3 while in Negotiation) and a payment (while in PO) — and those are exactly the moments a deal is most alive, so they must reset the clock.',
          'Stage change alone must reset it too: a rep who advances a card but forgets to log the call would otherwise go red for making progress, which teaches the team to distrust the colour.',
          'not every timeline entry resets the clock. Decay markers must not, or a deal resets itself and can never rot: "quotation auto-expired", "escalated to sales lead", rot-state transitions, and plain field edits are all excluded. Each activity type carries a resetsRotClock flag — human actions and inbound customer contact reset; the system noting that something lapsed does not.',
          'one idle field, one rule. Idle is a property of the company/deal, computed once, and every screen reads that same value — the Customers directory, the Pipeline board, the deal card and any report. What varies is only the threshold applied to it, which comes from the stage the deal currently sits in. Never let a screen compute or store its own idle.',
          'Rotting is measured against time-since-last-meaningful-event, not against days-in-stage. A deal legitimately sitting in Negotiation for weeks while the rep works it stays green; a deal sitting there untouched goes red. daysInStage is shown for context only and never drives the colour.',
          'The threshold applied is always the current stage’s. Stages may be skipped — a card dragged Proposal → Negotiation drops Qualified entirely, resets to green on the move, and is then judged by Negotiation’s 21d/45d, not Proposal’s 7d/21d.',
          'Closing a deal as Lost closes the deal, not the company. The company record stays, keeps its history, and can start a new deal any time.',
          'A stale or Lost deal never changes customerStatus. Pipeline stage and customer status are independent: an Existing customer with a rotting new deal is still Existing, and Churn has its own 12-month clock from the last invoice.',
        ],
        states: ['Loading', 'Empty (no deals)', 'Filtered-empty', 'PO just reached (activation CTA)', 'Rotting (amber / red)', 'Escalated to sales lead'],
        sections: [
          {
            heading: 'The full event walkthrough — what changes, and who/what triggers it',
            items: [
              '1 · Company created (Sales adds a lead, or a sign-up is triaged) → no deal · pipeline "Not in pipeline" · customer status New (they have never bought).',
              '2 · Deal opened and a quotation drafted (Sales decides to work it) → Deal #1 exists but is not on the board: pipeline still reads "Not in pipeline", no deal value, no rot clock · still New. A draft is not an opportunity.',
              '3 · Quotation sent — the rep clicks Send, or clicks "Mark as sent" after emailing the PDF from their own mailbox; either writes quote.sent → the card appears on the board at Proposal, valued at the highest option · rot clock starts from sentAt · still New.',
              '4 · HR manager willing to discuss (rep moves the card) → stage Qualified · still New.',
              '5 · HR manager in internal approval (rep moves the card) → stage Negotiation · still New.',
              '6 · 21 days with no meaningful activity in Proposal (nightly job) → card turns red and joins "Needs attention". Stage does not change. Company does not leave the pipeline. Customer status untouched.',
              '7 · A further 14 days untouched (nightly job) → the deal enters the sales lead’s review queue. Still Proposal. Still in the pipeline. This is a forcing function to make a human decide — nothing more.',
              '8a · Sales gives up, or the customer says no (human clicks "Close as Lost" + picks a reason) → Deal #1 becomes CLOSED-LOST · the company now has no open deal, so pipeline reads "Not in pipeline" and it moves to the Nurture list with a re-engage date · customer status unchanged (New stays New; an Existing customer stays Existing).',
              '8b · Customer accepts an option and confirms the order → stage PO (won the commitment) · still New — they have not paid yet.',
              '9 · Accounting confirms the payment against the bank → stage still PO · still New.',
              '10 · Accounting issues the VAT e-invoice (invoice.issued) → Deal #1 becomes CLOSED-won · the company has no open deal, so pipeline reads "Not in pipeline" · customer status flips New → existing · provisioning is released. This is the only event that writes it.',
              '11 · Onboarding runs for the first 90 days after that first invoice — a tighter contact cadence, not a status. The company is already Existing.',
              '12 · Sales opens a renewal deal months later → Deal #2 opens · pipeline reads Proposal again · customer status stays Existing throughout. This is the normal healthy state: Existing customer, live deal.',
              '13 · 12 months after the last invoice with no new order (nightly job) → customer status → churn. The company appears in the win-back list. Still one record, still all its history.',
              'Read steps 6–8 together: rotting flags, escalation forces a decision, and only step 8a — a human click — removes the company from the pipeline. There is no step where time alone does it.',
            ],
          },
          {
            heading: 'Why no auto-Lost (the question this rule exists to answer)',
            items: [
              'A background job never closes a deal. Two concrete reasons, both expensive.',
              'It corrupts the numbers: a deal nobody ever called shows up in reporting as a competitive loss, so win-rate, forecast accuracy and the Lost-reason split all become fiction — and the Lost-reason split is the only thing that tells you whether you have a pricing, follow-up or targeting problem.',
              'It silently kills live deals: the most common reason for 45 days of silence in this market is that the HR manager is waiting on an internal budget approval. Auto-closing that deal loses revenue you had already won.',
              'What replaces it: escalation with an owner. Red cards go to the sales lead’s review queue, and clearing that queue is a person’s job. The board stays clean because someone decides, not because a timer fired.',
              'Optional backstop if the queue is ignored: a hard age cap (suggested 180 days) that archives the deal off the active board into a nurture list with reason "No response" — still not a competitive loss, still re-openable, and still visible. Recommended as a safety net only; the escalation queue should be doing the work.',
            ],
          },
          {
            heading: 'The two status axes — how they interact (and how they must not)',
            items: [
              'Axis 1 · Pipeline status (derived from the open deal): Not in pipeline · Proposal · Qualified · Negotiation · PO · Invoice.',
              'Axis 2 · Customer status (stored on the company): New · Existing · Churn. Exactly three.',
              'Only invoice.issued and the nightly 12-month churn clock ever write axis 2. Nothing a rep does on the board writes it.',
              'Legal combinations that must all work: New + Not in pipeline (cold lead / nurture) · New + Proposal (first-time quote out) · New + PO (PO issued but not yet invoiced — they still have not paid) · Existing + Not in pipeline (bought, nothing live) · Existing + Negotiation (renewal in flight — very common) · Churn + Proposal (win-back attempt underway).',
              'Illegal by construction: any company showing "Lost" as a pipeline status; any rule that changes customer status because a deal was lost; and any transition back into New — it is the one status a company can never return to.',
              'Naming: "New" means "has never bought from us", not "recently signed up" and not "newly paying". A company can sit at New for years while being quoted repeatedly. If the sales team reads it the other way, relabel it in the UI ("Chưa từng mua") rather than redefining it.',
            ],
          },
          {
            heading: 'Board display — Won and Lost are closed, not columns companies live in',
            items: [
              'The board shows open deals from the moment a quotation exists for them — **including a Draft one**, which is what puts the card at Proposal. A closed-won or closed-lost deal is history on the company record, not a card that sits on the board forever.',
              'CORRECTED — an earlier draft of this requirement kept Draft quotations off the board. It does not: a Draft quotation is exactly what enters the company at Proposal (see the stage table above), and a quotation awaiting special-discount approval is still a Draft on the board. What the FORECAST may exclude is a different question — column totals can be filtered to quotations the customer has actually seen, without hiding the card.',
              'Keep PO and Invoice as visible columns so reps see recent wins, but auto-archive cards off the board 30 days after they close (configurable). Otherwise the right-hand columns grow without limit and the board stops being a work list.',
              'Lost is best rendered as a filter / drawer rather than a permanent column, for the same reason.',
              'Column totals must count only open deals, or the pipeline value is meaningless for forecasting — and each deal contributes exactly one option (accepted, else highest), never the sum of the options it offered.',
            ],
          },
          {
            heading: 'Pipeline hygiene — how long before a deal is considered stale (starting defaults)',
            items: [
              'Thresholds are per stage, not one number for the whole pipeline — each stage has a different natural rhythm. Measured in days since the last meaningful activity.',
              'Proposal — amber 7d, red 21d. not anchored to the quotation’s expiry any more: since every quote lapses at month-end, a quote raised on the 28th would otherwise turn red almost immediately. The rot clock runs on contact, the expiry on the calendar, and they are deliberately independent.',
              'Qualified (HR manager willing to discuss) — amber 7d, red 14d. Interest is warm here; a fortnight of silence means it cooled.',
              'Negotiation (HR manager in internal approval) — amber 21d, red 45d. Deliberately the most generous: VN internal approval and budget cycles genuinely run to month-end, and killing these early is the most expensive mistake.',
              'PO (PO issued, no invoice yet) — amber 7d, red 21d. They already said yes; silence here usually means a signature or a budget line is stuck. Note the PO expires at the end of its month regardless.',
              'Awaiting payment (invoice issued, nothing received) — amber 14d, red 30d. Past 30 days this stops being a sales problem and becomes a collections one — escalate to Kế toán, not to Lost. The product is already live, which is what makes this urgent.',
              'Overall age cap: any deal older than 90 days total goes to the sales lead’s review queue regardless of stage, so nothing hides by getting nudged every few weeks.',
              'First-touch SLA: a new deal with no activity within 3 working days flags to the owner and the lead — the cheapest deals to lose are the ones nobody called.',
            ],
          },
          {
            heading: 'Two separate signals — "is the deal alive?" vs "did we reply?"',
            items: [
              'Deal rot (amber/red) answers "is this deal still moving?" — it resets on any meaningful event, inbound or outbound. It is a health measure, not a performance measure.',
              'Awaiting reply answers "is the customer waiting on US?" — it is on whenever the last logged activity was inbound. Suggested escalation: badge immediately, notify the owner after 1 working day, notify the lead after 2.',
              'The case this exists for: the customer replies on Zalo on Thursday and nobody answers. Deal rot reads green — there was activity — while it is quietly the most urgent card on the board. Rot alone cannot catch this.',
              'The two are independent and can both be on at once (customer wrote 20 days ago, still no reply — red AND awaiting reply). Show them as separate badges, never merge them into one colour.',
              'Cheap to build because the activity log already captures channel and timestamp — it only needs a direction flag (inbound/outbound) on every logged chat and call. Calio call logs supply direction natively.',
            ],
          },
          {
            heading: 'Calibrating these numbers from real data (do this after ~3 months live)',
            items: [
              'The defaults above are a starting point sized to a transactional job-posting sale (₫2.7M–₫40M, short cycle). They are not a law — the real ones come from your own pipeline.',
              'Standard method: measure the median days-in-stage per stage from closed-won deals only, then set amber = median, red = 2× median (or the 90th percentile). Won deals are the right sample — losses skew long by definition.',
              'Re-check quarterly, and per segment if enterprise deals behave differently from sme ones. Make thresholds configurable in settings rather than hard-coded.',
              'Sanity check: if more than ~20% of the board is red at any time the thresholds are too tight and reps will start ignoring the colour, which is worse than having no rule.',
            ],
          },
          {
            heading: 'Lost reasons (required on close — this is what makes the rule worth having)',
            items: [
              'Lost to competitor — name the competitor.',
              'Price / over budget.',
              'No budget this cycle — timing, not rejection; set a follow-up date and it becomes a nurture candidate.',
              'No response / went silent — the outcome of the rotting path above.',
              'Not a fit / no hiring need right now.',
              'Internal approval rejected.',
              'Without a mandatory reason the whole hygiene rule produces nothing but a cleaner-looking board. The reason split is what tells you whether you have a pricing problem, a follow-up problem, or a targeting problem.',
            ],
          },
        ],
        backend: {
          dataModel: [
            { name: 'dealId', type: 'uuid', required: true },
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'stage', type: 'enum', required: true, notes: 'proposal|qualified|negotiation|po|invoice' },
            { name: 'state', type: 'enum', required: true, notes: 'open|won|lost — separate from stage. Only one open deal per company; won/lost deals stay as history. Pipeline status = open deal’s stage, else "not in pipeline".' },
            { name: 'closedAt', type: 'timestamp?', notes: 'set on won or lost; drives the 30-day auto-archive off the board' },
            { name: 'value', type: 'money' },
            { name: 'ownerId', type: 'uuid' },
            { name: 'updatedAt', type: 'timestamp' },
            { name: 'stageEnteredAt', type: 'timestamp', required: true, notes: 'reset on every stage change — drives daysInStage' },
            { name: 'lastMeaningfulAt', type: 'timestamp', required: true, notes: 'MAX(lastActivityAt, stageEnteredAt) — the rotting clock. Two inputs; derive, do not store.' },
            { name: 'lastActivityAt', type: 'timestamp?', notes: 'newest timeline entry whose type has resetsRotClock = true. Document events write timeline entries, so they land here rather than in a separate column.' },
            { name: 'lastInboundAt / lastOutboundAt', type: 'timestamp?', notes: 'activities carry a direction. lastInbound > lastOutbound means the customer is waiting on us — drives awaitingReply.' },
            { name: '— ActivityType (settings) —', type: 'config table' },
            { name: 'type / resetsRotClock / direction', type: 'enum/bool/enum', required: true, notes: 'chat, call, quote_sent, quote_revised, order_confirmed, payment_recorded → true. quote_expired, deal_escalated, rot_changed, field_edit → false (decay markers must never reset the clock, or a deal resets itself and can never rot).' },
            { name: 'nextStepAt', type: 'date?', notes: 'rep-set follow-up date; pauses rotting until it passes' },
            { name: 'rotState', type: 'derived', notes: 'fresh|amber|red — computed from lastMeaningfulAt vs the current stage’s threshold, never stored stale' },
            { name: 'escalatedAt', type: 'timestamp?', notes: 'set when a red deal enters the sales lead’s review queue' },
            { name: 'lostReason', type: 'enum?', required: true, notes: 'mandatory when stage = lost: competitor|price|no_budget_this_cycle|no_response|not_a_fit|approval_rejected' },
            { name: 'lostNote / lostBy / lostAt', type: 'string?/uuid?/timestamp?', notes: 'who closed it and why — always a human' },
            { name: '— StageThreshold (settings) —', type: 'config table' },
            { name: 'stage / amberDays / redDays', type: 'enum/int/int', required: true, notes: 'configurable per stage, not hard-coded' },
          ],
          endpoints: [
            'GET /admin/crm/deals?stage=&owner=&industry=&rot=amber|red&page=',
            'PATCH /admin/crm/deals/:id { stage }',
            'PATCH /admin/crm/deals/:id { nextStepAt }',
            'POST /admin/crm/deals/:id/lose { reason, note }',
            'POST /admin/crm/deals/:id/reopen { stage }',
            'GET /admin/crm/deals/review-queue — sales-lead escalations',
            'GET /admin/crm/settings/stage-thresholds | PUT (same)',
          ],
          notes:
            'Deals reference the Customer entity; moving to won emits an event the activation flow listens to. Compute rotState on read from lastMeaningfulAt + the configured threshold — do not persist it, or every threshold change needs a backfill. A nightly job only handles escalation and notifications, never a stage change. Two constraints that cannot be retrofitted: every logged activity must carry a direction (inbound/outbound), or the awaiting-reply signal is impossible; and every document action must write a timeline entry, or the rot clock needs a third input and quote revisions/payments silently stop resetting it.',
        },
        acceptance: [
          'Deals render grouped by stage with correct per-column totals.',
          'Dragging a card changes its stage and persists.',
          'Reaching PO surfaces the "Activate customer" path.',
          'A deal past its stage threshold shows amber/red and appears in the "Needs attention" filter — without its stage changing.',
          'Two things reset the rotting clock: a clock-resetting timeline activity (a logged chat/call, or a document action — which writes its own timeline entry), and a stage change. Setting a next-step date suspends it until that date passes.',
          'A quote revision (v2 sent while in Negotiation) and a payment recorded (while in PO) reset the clock without changing the stage — these are the two document events that are not also stage changes.',
          'Decay markers — quotation auto-expired, escalation, rot-state changes — appear on the timeline but never reset the clock.',
          'A card moved Proposal → Negotiation (skipping Qualified) returns to green and is then judged by Negotiation’s thresholds, not Proposal’s.',
          'A deal whose last logged activity was inbound shows an "awaiting reply" badge independently of its rot colour — including while it is still green.',
          'No background job ever moves a deal to Lost; closing as Lost requires a human and a reason.',
          'Closing a deal as Lost leaves the company record and its customerStatus untouched.',
          'Changing a stage threshold in settings immediately re-colours the board with no data migration.',
        ],
        openQuestions: [
          'Confirm the exact stage names + order with the sales team.',
          'Are stages fixed, or configurable per team?',
          'Should the PO stage be renamed "Order confirmed"? In standard B2B the customer issues the PO to us — what we send is an order confirmation.',
          'Sign off the per-stage rotting thresholds — the defaults above are sized to a short transactional cycle and need the sales team’s gut-check before launch.',
          'Who owns the escalation queue — the sales lead, or a sales-ops role?',
          'Is 90 days the right hard age cap for a deal, given the longest real approval cycles you have seen?',
        ],
      },
    },
    // 2 · Quotations ──────────────────────────────────────────────────
    {
      name: 'Quotations',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-quotes',
      detail: {
        keyPoints: [
          {
            vi: 'Báo giá có đúng bốn trạng thái: Draft → Sent → Issued to PO, cộng thêm Expired. **Sales** bấm “Mark as sent” để sang Sent, bấm “Issue PO” để sang Issued to PO. Không có gì khác đặt được hai trạng thái này.',
            en: 'A quotation has exactly four statuses: Draft → Sent → Issued to PO, plus Expired. Sent is reached by **Sales** clicking “Mark as sent”; Issued to PO by **Sales** clicking “Issue PO”. Nothing else sets either one.',
          },
          {
            vi: '**Mọi** báo giá chưa lên PO đều hết hạn vào cuối tháng — không phải 14 hay 30 ngày sau khi gửi. Cả sổ chung một mốc, bất kể gửi ngày nào.',
            en: '**Every** quotation not yet issued to PO expires at the end of the month — not 14 or 30 days after it was sent. One shared deadline for the whole book, whatever day it went out.',
          },
          {
            vi: 'Chỉ cần báo giá ở trạng thái draft là công ty đã lên bảng pipeline, tại cột Proposal. Bảng có card ngay khi rep bắt đầu soạn, không phải lúc gửi.',
            en: 'A draft quotation is already enough to put the company on the pipeline board, at Proposal. The board fills the moment a rep starts writing, not when they send.',
          },
          {
            vi: 'Khi báo giá hết hạn, công ty rời khỏi pipeline. Đây không phải Lost — không có lý do, không ai quyết định, và customer status không đổi. Một báo giá mới (hoặc bản v2) đưa công ty trở lại ngay cột Proposal.',
            en: 'When the quotation expires, the company comes off the pipeline. This is not Lost — no reason, no human decision, and the customer status does not change. A new quotation (or a v2) puts it straight back at Proposal.',
          },
        ],
        description:
          'The first document in quote-to-cash, and the only one the customer sees before committing. Field-for-field modelled on the client’s live PDF EST-009909-07-2026.\n\nA rep builds it in five steps: pick the company → confirm its client + VAT-billing details → build 1–3 priced options → review the auto-composed terms and benefit lists → generate the bilingual PDF and send.\n\nThe printed output must reproduce the existing PDF exactly. See “What prints on the page” below for the block-by-block list.',
        userStory:
          'As a sales rep, I want to build one quotation that offers the customer 2–3 priced alternatives and send it as the same bilingual PDF we send today, so that the customer can pick a package without me re-quoting.',
        uiFields: [
          {
            group: 'Step 1 · Document header (auto)',
            items: [
              { name: 'quoteCode', type: 'string', required: true, notes: 'auto — QUO-{seq6}-{MM}-{YYYY}, e.g. QUO-009909-07-2026. Never editable.' },
              { name: 'version', type: 'int', required: true, notes: 'v1, v2… a re-issue after negotiation bumps the version; code stays the same' },
              { name: 'vendorBlock', type: 'ref → Settings', required: true, notes: 'The issuer letterhead — logo, VN + EN legal name, VN + EN address, website. never typed per quotation and never hard-coded: it comes from System → Issuer identity (issuer). One place to change it when the entity, address or logo changes, and every past quotation keeps the version it was sent with.' },
              { name: 'proposedBy', type: 'derived', notes: '"Báo giá bởi / Proposed by: {rep name} | {rep email}" — the signed-in rep' },
              { name: 'proposalDate', type: 'date', required: true, notes: 'Ngày báo giá / Proposal Date — defaults today' },
              { name: 'expiryDate', type: 'date', required: true, notes: 'Ngày hết hạn / Expiry Date — always the last day of the month the quotation was created in (20/07/2026 → 31/07/2026). derived, never typed: every quotation raised in a month lapses together on the same date, which is what keeps pricing and promotions tied to a monthly policy cycle.' },
            ],
          },
          {
            group: 'Step 2a · Thông tin khách hàng / Client information',
            items: [
              { name: 'company', type: 'ref → Customer', required: true, notes: 'picked from the CRM company list — this is what links the quote to the deal' },
              { name: 'clientName', type: 'string', required: true, notes: 'Tên khách hàng / Client name — the contact person as addressed, e.g. "anh Huy"' },
              { name: 'clientEmail', type: 'email', required: true, notes: 'prefilled from primaryContact; also the send-to address' },
              { name: 'clientPhone', type: 'string', notes: 'Số điện thoại / Phone number' },
            ],
          },
          {
            group: 'Step 2b · Thông tin xuất hóa đơn VAT / Billing information for VAT-invoice',
            items: [
              { name: 'billingCompanyName', type: 'string', required: true, notes: 'Tên công ty / Company name — the legal entity, may differ from the CRM display name (PDF: CÔNG TY TNHH AM software việt nam)' },
              { name: 'billingAddress', type: 'string', required: true, notes: 'Địa chỉ kkd / Billing Address — registered-business address' },
              { name: 'taxCode', type: 'string', required: true, notes: 'Mã số thuế / Tax code — 10 or 13 digits; carried straight to the e-invoice, so validate format' },
              { name: 'sameAsCompany', type: 'toggle', notes: 'copy from the CRM record in one click; edits here write back to the company record' },
            ],
          },
          {
            group: 'Step 3 · Options (1–3 per quotation) — repeatable block',
            items: [
              { name: 'optionLabel', type: 'string', required: true, notes: 'auto "Option 1/2/3" + the composed title: "Option 1: Dịch vụ tin đăng (Basic Plus Job) + Dịch vụ tin đăng (Basic Plus Job) (Tặng)"' },
              { name: 'recommended', type: 'toggle', notes: 'at most one option flagged — drives the PDF highlight only. It does not set the quotation or deal value; that is always one option’s total (accepted, else highest).' },
              { name: 'lineItems[]', type: 'table', required: true, notes: 'columns exactly as the PDF: STT/No. · Dịch vụ/Type of service · Đơn vị tính/Unit · Số lượng/Quantity · Đơn giá/Unit price · Giảm giá/Discount · Tổng giá/Total price' },
              { name: '↳ product', type: 'ref → Product/Package', required: true, notes: 'from Products & packages — pulls name (VN/EN), unit and list price' },
              { name: '↳ unit', type: 'enum', notes: 'tin / post · hồ sơ / CV · tháng / month · gói / package' },
              { name: '↳ quantity', type: 'int', required: true, notes: 'min 1' },
              { name: '↳ unitPrice', type: 'money (₫)', required: true, notes: 'defaults to list price, rep may override (logged)' },
              { name: '↳ discountPct', type: 'percent', notes: '0–100, WRITTEN BY THE PROGRAMME and never by a rep — 0 whenever Chiết khấu đặc biệt is on. Stored on the line so a later change to the programme cannot reprice a quotation already sent' },
              { name: '↳ lineTotal', type: 'derived', notes: 'quantity × unitPrice × (1 − discount) — read-only' },
              { name: '↳ isGift', type: 'toggle', notes: 'the "(Tặng)" bonus line — forces unitPrice 0 and lineTotal 0, but still provisions quota on activation' },
              { name: 'subtotal', type: 'derived', notes: 'sum of that option’s line totals' },
              { name: 'vatRate / vatAmount', type: 'derived', notes: 'Thuế GTGT — rate from settings (currently 8%); PDF: 488,000 on 6,100,000' },
              { name: 'totalAfterVat', type: 'derived', notes: 'Tổng đơn hàng sau thuế VAT 8% / Total price after VAT 8% — PDF: 6,588,000' },
              { name: 'amountInWords', type: 'derived', notes: 'auto-generated both languages — "Bằng chữ: Sáu triệu năm trăm tám mươi tám nghìn đồng." / "In words: Six million five hundred eighty-eight thousand VND." Never hand-typed.' },
              { name: 'packageFeatures', type: 'derived', notes: '"Quyền lợi gói {package} trên TopDev.vn / Features of {package} Package on TopDev.vn" — the numbered benefit list pulled from the catalog per package, including the gift package’s own list' },
              { name: 'giftNote', type: 'text', notes: 'the gift / Employer-Branding note that T&C clause 5 refers back to ("theo ghi chú quà tặng phía trên")' },
            ],
          },
          {
            group: 'Step 4 · Terms & signature (auto, editable per quote)',
            items: [
              { name: 'termsTemplate', type: 'ref → template', required: true, notes: 'the 6 bilingual clauses; versioned so an old quote keeps the terms it was sent with' },
              { name: 'signatureBlock', type: 'derived', notes: '"Đại diện TopDev / TopDev" · "Ngày {DD} tháng {MM} năm {YYYY} / {Month} {D}th, {YYYY}" · "Authorized Signature ____"' },
              { name: 'internalNote', type: 'text', notes: 'not printed — why this pricing, what the customer asked for' },
            ],
          },
          {
            group: 'Step 5 · Send — or record a send that happened elsewhere',
            items: [
              { name: 'sendMode', type: 'enum', required: true, notes: '"Send via platform" (we email the client, cc the rep) · "Mark as sent" (the rep already delivered it themselves). Both put the quotation in Sent — these are the only two ways it gets there.' },
              { name: 'sentVia', type: 'enum', required: true, notes: 'Platform email · Rep’s own email · Zalo · Facebook Messenger · Printed / in person · Other — how the customer actually received it. Auto-set to Platform email on Send.' },
              { name: 'sentAt', type: 'datetime', required: true, notes: 'defaults now; back-datable when the rep is recording a send from a few days ago, never future-dated. This is the date Proposal-stage rot and the expiry warning are both measured from.' },
              { name: 'sentTo', type: 'string', required: true, notes: 'recipient as sent (email address / Zalo handle) — prefilled from clientEmail' },
              { name: 'sentBy', type: 'derived', notes: 'the signed-in rep — who declared it sent, kept for audit' },
              { name: 'sendNote', type: 'text', notes: 'optional; stored on the timeline entry ("sent with the Option 2 comparison he asked for")' },
            ],
          },
          {
            group: 'Quotation list',
            items: [
              { name: 'quoteCode / version', type: 'string', required: true },
              { name: 'company', type: 'ref → Customer', required: true },
              { name: 'options', type: 'count', notes: 'e.g. "2 options" — with the accepted one named once decided' },
              { name: 'value', type: 'money (₫)', notes: 'accepted option if decided, else the highest option — one option’s total-after-VAT, never the sum of the options' },
              { name: 'status', type: 'enum', notes: 'Draft · Sent · Issued to PO · Expired — four statuses, deliberately. Creating a Draft already puts the deal at Proposal' },
              { name: 'sentVia / sentAt', type: 'derived', notes: 'blank while Draft; shows e.g. "Zalo · 22/07" so the lead can see which quotes went out off-platform' },
              { name: 'expiryDate', type: 'date', notes: 'with a "expires in N days" warning inside 3 days' },
              { name: 'owner', type: 'ref → admin user' },
              { name: 'in pipeline?', type: 'derived', notes: 'a small marker showing whether this quotation is what is holding its deal on the board — the rep’s cue that an unsent draft is invisible to the forecast' },
            ],
          },
        ],
        behaviors: [
          {
            group: 'Building it',
            items: [
              'Create from the company record or the deal card, so the quotation is always attached to a customer and a deal — never floating.',
              'Selecting the company prefills client info + VAT billing block from the CRM record; the rep only edits what differs.',
              'Adding a product pulls its VN/EN name, unit, list price and benefit list from Products & packages — the “Quyền lợi” section is composed, never typed.',
              '“Add option” duplicates the current option as a starting point (same package, different quantity/tier), up to 3. “Duplicate as gift” adds the paired “(Tặng)” line at 0₫.',
              'Each option totals independently — VAT, total-after-VAT and amount-in-words are computed per option. The document has **no** grand total.',
              'Live bilingual PDF preview beside the form, page-for-page identical to the sent file.',
            ],
          },
          {
            group: 'Sending it',
            items: [
              '“Send via platform” → generates the PDF, emails the client contact (cc the rep), sets the quotation Sent and logs it on the company timeline.',
              '“Mark as sent” → the same state change for a quotation the rep delivered themselves: pick the channel, confirm the date and the recipient. This is the normal path, because most quotations leave through the rep’s own mailbox or Zalo.',
              'Neither action moves the company onto the pipeline — it has been there since the quotation was created. Sending changes the quotation, not the board.',
            ],
          },
          {
            group: 'After it goes out',
            items: [
              'Customer replies picking an option → the rep records which option was accepted and how it was agreed (email / Zalo / call); the others are marked Not chosen.',
              'Acceptance is recorded ON the quotation but is not a status of its own — the status moves to Issued to PO the moment the PO is created from that option, which is the very next click.',
              'Accepting an option is the single entry point to Create Sales Order / PO — the accepted option’s lines are copied into it.',
              'Negotiation → Revise clones the quotation as v2 with a revision reason. v1 stays in history marked by its version, not by a separate status — the list shows v1 greyed with “replaced by v2”.',
            ],
          },
          {
            group: 'Expiry — month-end',
            items: [
              'Expiry is derived, never typed: every quotation not yet Issued to PO expires at the end of the calendar month, whatever day it was created or sent.',
              'A month-end job sets those quotations Expired and takes their companies off the pipeline board — the quotation was the reason the card existed.',
              'Leaving the board this way is not Lost: no reason is recorded, no human decided, and the customer status does not change. The company is a live prospect with no live offer.',
              'An expired quotation cannot be issued to a PO. Revise to v2 (or extend) first; the action is disabled with that reason shown.',
              'A v2 — or any new quotation — puts the company straight back on the board at Proposal.',
            ],
          },
        ],
        rules: [
          {
            group: 'Options and value',
            items: [
              'A quotation has 1–3 options. Options are alternatives, not add-ons: exactly one may be accepted, and reporting must never sum them.',
              'A quotation’s value is one option’s total-after-VAT: the accepted option once the customer decides, otherwise the highest option. Two options at ₫6,588,000 and ₫2,926,800 give a ₫6,588,000 quotation — 9,514,800 is not a number that exists anywhere in the system.',
              'The value may go down on acceptance (the customer picks the cheaper option) and that is correct, not a bug — the pending figure was the ceiling, replaced by the committed figure the moment there is one.',
              'Every option needs at least one paid line item — an option cannot be gifts only.',
              'Gift (“Tặng”) lines are always 0₫ at 0% discount and are excluded from revenue, but are provisioned as real quota on activation.',
              'Amount-in-words is always machine-generated in VN and EN; it is never an input field.',
            ],
          },
          {
            group: 'Status and editing',
            items: [
              'Four statuses, no more: Draft → Sent → Issued to PO, plus Expired.',
              'Only Draft is editable. A Sent quotation is immutable — a change is a new version, never an edit.',
              'Exactly two actions put a quotation into sent — “Send via platform” and “Mark as sent”. We never infer it from a mail log or a delivery webhook, because most quotations are sent outside this system and those deals must still show up.',
              '“Mark as sent” is subject to every pre-send gate that Send is: mandatory tax code, billing name and billing address, and sales-lead approval when the discount is over the threshold. It is an alternative channel, not a way around the controls.',
              'REMOVED — the discount-approval gate. The rate comes from the programme and cannot be typed, so there was nothing left to approves own — the row shows Draft with an “awaiting approval” flag, so the status list stays four values long.',
              'sentAt may be back-dated (a rep records Monday’s send on Wednesday) but never future-dated. The back-dated timestamp is what the rot clock, the idle reset and the expiry warning all use — recording a send late must not hand the rep a fresh week of silence.',
            ],
          },
          {
            group: 'Pipeline effect',
            items: [
              'CREATING a quotation puts the company on the board at Proposal — while it is still Draft. Writing the quote **is** the proposal work, so the deal is visible from the first keystroke.',
              'Abandoning a draft therefore has a consequence: the deal is on the forecast, so it must be closed as Lost with a reason, not silently deleted.',
              'EXPIRY takes the company off the board, automatically and without a reason. It is the only automatic way off; inactivity alone never removes anything.',
              'Expiry is not Lost, and reporting must not merge them. Lost is a human decision with a reason; expired is an offer that ran out of time — usually because nobody followed up before month-end, which is exactly what the number should surface.',
            ],
          },
          {
            group: 'Commercial terms it commits us to',
            items: [
              'Tax code, billing name and billing address are mandatory before Send — they flow verbatim to the VAT e-invoice and cannot be fixed later without re-issuing it.',
              'Per T&C clause 2 the discounts, incentives and gifts hold only until the expiry date — which is why an expired quote can never be converted: it would issue an order on pricing we no longer stand behind.',
              'VAT rate comes from settings so a State rate change (T&C clause 6) does not require a code change; a sent quotation keeps the rate it was sent with.',
              'The quotation states the terms the whole chain inherits: service is released on the OFFICIAL invoice (a deliberate deviation from clause 3, which says payment + invoice), must be activated within 12 months of the invoice date (clause 4), and runs 30 days once activated (clause 5).',
            ],
          },
        ],
        states: [
          'Draft (editable · already on the board at Proposal · may carry a pending special-discount approval)',
          'Sent (immutable, awaiting the customer — via platform Send or "Mark as sent"; this is what puts the deal on the board at Proposal)',
          'Sent + offer lapsed (past the expiry date — the flag that forces a human decision)',
          'Issued to PO (an option was accepted and the PO was created from it — terminal success)',
          'Expired (lapsed and closed out with no PO — terminal until extended or revised)',
        ],        requirements: [
          {
            label: 'Chương trình chiết khấu — four modes, one per quotation',
            text: 'A rep picks exactly **one** discount mode for a quotation, and the customer’s status decides which are on offer. They are exclusive: two programmes layered on one document produce a total nobody planned and an approver signing off on half of it.\n\nWhat makes this more than a picker is that each mode decides, independently, what happens to the **three** discount inputs the client’s live system has — the per-line %, the whole-order % (“Addition Discount”) and the fixed amount (“Voucher”). Three inputs × four modes is twelve rules, which is why they belong in one table rather than scattered through the form.',
            table: {
              cols: ['Mode', 'Offered to', 'Chiết khấu từng dòng', 'Chiết khấu tổng đơn', 'Giảm số tiền (₫)', 'Approval'],
              rows: [
                ['**Ưu đãi khách mới / quay lại** — New & Churn', 'New · Churn', 'Locked at 0', '**Rule-driven**: 50%, or 0% the moment any non-gift line exceeds 5', 'Sales types it', 'None'],
                ['**Chiết khấu theo số lượng** — Existing', 'New · Churn · Existing', '**Rule-driven**: the volume tiers, on the summed quantity per product', 'Sales types it', 'Sales types it', '**On the order % only** — see the bands'],
                ['**Gói dùng thử** — Trial', 'New · Churn', 'Locked at 0', 'Locked at 0', 'Locked at 0', 'None'],
                ['**Ưu đãi đặc biệt** — Special offer', 'New · Churn · Existing', 'Sales types it', 'Sales types it', 'Sales types it', '**None**'],
              ],
            },
            items: [
              'A New or Churn customer may be quoted under the **Existing** programme instead — that is the client’s own escape route when the order is too big for the 5-unit cap. An Existing customer has no welcome offer to fall back to, so only two modes are offered there.',
              'Changing mode **clears every discount figure** on the quotation. Carrying 50% over into a Special offer would leave the rep owning a number they never typed.',
              'The three discounts stack in one fixed order and it is not interchangeable: **line % → order % → fixed ₫ → VAT on what is left**. Taking the voucher off before the percentage would quietly make it worth more, and charging VAT on the pre-discount figure would overcharge the customer on a filed invoice.',
              'The fixed amount is capped at the remaining subtotal — an option can reach 0 ₫ but never a negative total.',
              'Only the mode is a decision. Within a mode the rep never chooses whether a field is editable; that is declared once, and the form reads it.',
            ],
          },
          {
            label: 'Công thức tính tiền — the order the three discounts stack in',
            text: 'The formula, stated so the client can confirm it rather than infer it from a column of totals. Every figure on the quotation, the PO and the invoice comes from this, and the part genuinely open to disagreement is the **order** — not the arithmetic.\n\nEach option computes independently. Options are alternatives, so nothing is ever summed across them. The panel below is the actual screen, with the step numbers on the rows they produce.',
            figure: 'quotation-totals',
            table: {
              cols: ['#', 'Step', 'Formula', 'Note'],
              rows: [
                ['1', 'Line total', '`SL × đơn giá × (1 − CK dòng %)`', 'Per line. A gift line is 0 ₫ at 0% and contributes nothing.'],
                ['2', '**Tạm tính** (subtotal)', '`Σ line totals`', 'Before any order-level discount.'],
                ['3', 'CK tổng đơn', '`tạm tính × CK tổng đơn %`', 'The client’s “Addition Discount”. A percentage of the SUBTOTAL, not of the list price.'],
                ['4', 'Giảm số tiền', '`min(voucher, tạm tính − CK tổng đơn)`', 'The client’s “Voucher”. A flat amount, taken **after** the percentage, and capped at what is left.'],
                ['5', '**Sau chiết khấu**', '`tạm tính − CK tổng đơn − giảm số tiền`', 'This is the taxable base.'],
                ['6', 'Thuế GTGT', '`sau chiết khấu × VAT %`', 'VAT is charged on what is LEFT, never on the pre-discount figure.'],
                ['7', '**Tổng sau VAT**', '`sau chiết khấu + thuế GTGT`', 'The figure that prints, and the figure the deal is valued at.'],
              ],
            },
            items: [
              'The order of steps 3 and 4 is not interchangeable. Taking the voucher off **before** the percentage would quietly make the voucher worth more — on a 100.000.000 ₫ subtotal with 10% and a 5.000.000 ₫ voucher, the two orders differ by 500.000 ₫.',
              'Step 6 is the one that must not be got wrong: VAT on the **discounted** base. Charging it on the subtotal overcharges the customer on a document that has been filed with the tax authority, and the only fix is cancel + biên bản + re-issue.',
              'The voucher can take an option to **0 ₫** but never below it. There is no negative line and no credit carried forward.',
              'Rounding is to the đồng at each step, not once at the end, so the printed lines add up to the printed total. A reader who checks the arithmetic by hand must reach the same figure.',
              'Amount-in-words is generated from step 7 and is never typed.',
              'The same formula runs on the PO and on the invoice. Those documents copy the accepted option’s figures rather than recomputing them from the catalogue — prices change, and a filed invoice must not move when they do.',
            ],
            warn: 'For the client to confirm: the ORDER above (percentage first, then the fixed amount, then VAT on the remainder) and the rounding rule (per step, to the đồng). Both are visible on the quotation builder’s totals panel, which shows the working for every line.',
          },
          {
            label: 'Gói dùng thử — products, not a discount',
            text: 'The trial is **not** a percentage. It is a small set of real products priced low — Tin đăng dùng thử at 500.000 ₫, Tìm kiếm hồ sơ dùng thử at 300.000 ₫ — carrying a trial flag and offered **only** inside a trial quotation.',
            items: [
              'Modelling it as products rather than a 95% write-down is what makes it auditable: the invoice states what was actually sold at what price, and revenue reporting sees a cheap SKU instead of a discount nobody can explain a year later.',
              'A trial quotation offers **only** trial SKUs, and a normal quotation offers **none** of them. Switching into or out of trial mode therefore resets the product on every line — a leftover full-price SKU inside a trial quotation is a line the mode does not permit.',
              'All three discount cells are locked at 0. The price already is the concession.',
              'The per-MST limit (“01 lần trên mỗi MST”) lives on the product, not on this mode — see Products & Packages.',
            ],
          },
          {
            label: 'Approval — only the order-level % under Existing',
            text: 'One number in the whole module routes for approval: the **order-level percentage under the Existing programme**. It routes on the highest rate in the document, because options are alternatives and the approver must be able to sign off on the worst case rather than an average.',
            table: {
              cols: ['What', 'Approver'],
              rows: [
                ['Order % ≤ 10% (Existing), raised by a **rep**', '**Sales lead**'],
                ['Order % ≤ 10% (Existing), raised by a **Sales lead**', '— none. It was already their decision'],
                ['Order % > 10% (Existing), raised by a rep **or a Sales lead**', '**Sales manager** — straight there, not queued behind the lead'],
                ['Any rate raised by the **Sales manager**', '— none, whatever the figure'],
                ['Volume tiers on the lines', '— none. The rate came from the programme, and no rep can type it.'],
                ['Fixed amount (₫)', '— none. It is a voucher agreed elsewhere, not a rate the rep invented.'],
                ['New & Churn 50%', '— none. Rule-driven and not typed.'],
                ['**Ưu đãi đặc biệt**, all three fields', '— **none at all**. The rep sets it and owns it; that is the difference between this mode and the Existing one.'],
              ],
            },
            items: [
              'Escalation is by **amount, not by chain**. Two signatures on one discount slows the deal without adding a second real decision, so above the band the lead is skipped entirely.',
              'The flow: rep types the % → **Gửi {approver} duyệt** → the quotation stays **Draft** with a request assigned to that role → the approver **Duyệt** or **Từ chối** with a reason → approved unlocks Send / Export; rejected returns it with the reason.',
              '**Changing the % after approval voids it**, and re-routes to the higher band if the new figure crosses 10%. Without this a rep could get 5% signed and send 25%.',
              'Recorded on the quotation: who approved, when, and **at what percentage** — that last field is what makes the void-on-change rule enforceable.',
              'That Special offer carries **no** approval is a deliberate client decision, not an oversight. It means an unlimited discount can leave the building unreviewed, so the compensating control has to be reporting: every Special-offer quotation should be visible to the sales lead after the fact.',
            '**Who raised it can waive it.** The requester’s own seniority is compared with the role the rate routes to, and if it is at or above it there is no approval step: a **Sales lead**’s own ≤10% needs nobody, and a **Sales manager**’s rate never routes at all whatever it is. Sending a request to yourself is not a control, it is a click — and an approval queue full of self-approvals stops being read.',
            'The waiver is **per band, not per person**. A Sales lead who types 15% still goes to the manager, because that band was never theirs to sign. Seniority removes the step only where it was already their decision.',
            'A rep who sees no approval step needs to be told **why** — the builder says “không cần trình duyệt, {name} là {role}” rather than silently hiding the banner. Otherwise the absence reads as the rule having lapsed.',
            'This also answers what used to be an open question here: an approver can never be their own approver, because in that case there is no request at all.',
            '**Multi-option routing**: the document goes to the role the **highest** option requires, and only there. One option at 8% and another at 18% goes **straight to the manager** — the lead never sees it. Two approvals on a document that offers the customer a choice would mean signing off on a price they may never take, and would leave the quotation half-approved if only one came back. The builder names the reason when this escalation happens.',
            ],
            warn: 'CONFIRMED 09/08/2026 — the bands are **≤ 10% sales lead** and **> 10% sales manager**, with no gap between them. An earlier reading of the client sheet said “bigger than 11%”, which left 11% itself undefined; that wording is superseded.',
          },
        {
          label: 'Where approval happens — no new screen',
          text: 'The decision is taken on the **quotation itself**, and the approver finds their requests through a filter on the **existing Quotations list**. There is no “Approvals” page.\n\nApproving a percentage without the lines, the options and the customer in front of you is signing a number blind — so the action has to live where the document is. A separate queue screen would be a second, thinner copy of the quotation list plus a link back to it; what an approver needs is a way to FIND their requests, which is a filter.',
          table: {
            cols: ['Who', 'Where they see it', 'What they can do'],
            rows: [
              ['The rep', 'Their own quotation, and the list', 'Sees the bar: the %, who it routed to, when they asked. **Mark as sent is disabled** while pending or rejected. No buttons.'],
              ['**Sales lead**', 'Quotations list → **⏳ Chờ tôi duyệt (n)**', 'Sees only ≤10% requests **from their own team**, and never their own — those were waived. Opens the quotation → **Duyệt** or **Từ chối**.'],
              ['**Sales manager**', 'Same control, same list', 'Sees only >10% requests, department-wide. Same two buttons.'],
              ['Anyone else', 'The quotation', '“Bạn không phải người duyệt mức này” — the bar is informative, the buttons are absent rather than disabled.'],
            ],
          },
          items: [
            'The list row carries the flag beside the status: **⏳ 8% · chờ Sales lead** · **✓ 10% đã duyệt** · **✕ từ chối**. A pending request is not a status — the quotation is still a Draft, it simply cannot be sent yet.',
            'The inbox control is **absent for a plain rep**, not present and permanently empty. A control that can never do anything teaches people to stop reading the toolbar.',
            'Who the approver is comes from the SAME persona switcher and the same SALES_TEAMS org the Customers screen uses — one answer to “who am I”, everywhere. A lead approves their own team’s requests; there is one department manager.',
            'A rejection **requires a reason**; an approval does not. A rep can only act on “no” if told what would be a yes, so the field is mandatory and the placeholder asks for the number that would pass.',
            'Notification is out of scope here but assumed: the approver gets one when a request routes to them, the rep gets one on the decision. The shell already carries a bell.',
          ],
          warn: 'RESOLVED — an approver is never their own approver, because seniority waives the step: a Sales lead’s own ≤10% and any rate of the Sales manager’s never become a request. What still needs the client’s word is whether a Sales lead’s >10% should reach the manager as an ordinary request (it does today) or be flagged as coming from a lead.',
        },
        {
          label: 'Quotation expiry — always the end of the month',
          text: 'A quotation does not live for a fixed number of days. It expires on the last day OF the month it was created in, whatever date that is — raised 02/07 or raised 28/07, both lapse on 31/07. Every quotation issued in a month therefore dies together, which is what ties pricing, discounts and promotions to one monthly policy cycle instead of to hundreds of rolling per-quote deadlines.',
          table: {
            cols: ['Created', 'Expires', 'Days valid'],
            rows: [
              ['02/07/2026', '31/07/2026', '29'],
              ['20/07/2026', '31/07/2026', '11'],
              ['28/07/2026', '31/07/2026', '3'],
              ['01/08/2026', '31/08/2026', '30'],
            ],
          },
          items: [
            'derived, never typed. expiryDate = last day of month(createdAt). There is no validity-days setting to get wrong, and no nightly job can leave a quotation stale — a quotation is expired when today > expiryDate, computed on read.',
            'Consequence the rep must see: validity shrinks through the month. The builder shows the expiry date and the days remaining next to it, so a quote raised on the 28th visibly says "3 days" rather than looking the same as one raised on the 2nd.',
            'The rot clock is deliberately not anchored to expiry any more. With a fixed 14-day validity the two could be aligned; with month-end they cannot, or a quote raised late in the month would turn red almost the moment it was sent. Expiry runs on the calendar, rot runs on contact.',
            'Expiring still moves nothing on its own: the deal stays where it is and a human either extends validity, revises to v2, or closes the deal as Lost. A re-issued v2 gets a fresh end-of-month date — which, if it is re-issued in a new month, is the end of that month.',
            '**Unresolved** — a quotation raised on the 30th is valid for one day. Either roll quotations raised in the last few days of a month to the end of the next month, or accept the short window. This needs a business answer before build.',
          ],
        },
        {
          label: 'Quotation status — exactly four',
          text: 'The four statuses on the Quotations list. Acceptance is recorded ON the quotation but is not a status of its own — it moves straight to Issued to PO the moment the PO is created from the accepted option.',
          table: {
            cols: ['Status', 'Means', 'Rule'],
            rows: [
              ['Draft', 'Being written — editable, not yet out', '**Sales** builds and edits it; the only editable status. Creating it puts the deal on the board at proposal immediately, so a draft already counts in the pipeline — abandoning one therefore needs the deal closing as Lost, it does not just evaporate. → Next action: **Sales** clicks “Mark as sent”.'],
              ['Sent', 'Delivered to the customer, awaiting their pick', '**Sales** declares this by clicking “Mark as sent” — reps routinely deliver the PDF by Zalo or from their own mailbox, so the status cannot depend on our mailer firing. Immutable from here. The deal is already on the board (it went there at Draft); sending does not move it. → Next action: **Sales** clicks “Issue PO” and picks the option the customer chose.'],
              ['Issued to PO', 'An option was accepted and the PO was created from it', 'Reached automatically the moment **Sales** issues the PO. Terminal success — no further action on the quotation.'],
              ['Expired', 'Month-end passed with no PO issued', '**System** sets this at the end of the month — nobody clicks it. It also removes the company from the pipeline: the quotation was the reason the deal was on the board, so when it lapses the deal leaves with it. → To re-open: **Sales** revises to v2, which is a new quotation and puts the company back at Proposal.'],
            ],
          },
          warn: 'Only Draft is editable. A Sent quotation is immutable — a change is a new version, never an edit.',
        },
        ],
        sections: [
          {
            heading: 'What prints on the page — block by block, top to bottom',
            // Pinned under Overview, above "UI fields": this **is** the document being
            // specified, so it has to be read before the field list — not five
            // blocks below the backend contract.
            early: true,
            items: [
              '1 · Issuer letterhead — CÔNG TY TNHH daoukiwoom innovation / daoukiwoom innovation company limited, the VN and EN address and https://topdev.vn on the left; on the right the GROUP BRANDING — the Saramin wordmark in brand blue #2D65F2 above “TopDev Vietnam”: parent brand first, then the brand the customer actually buys on. From System → Issuer identity (issuer), never typed here. The mark ships as an INLINE VECTOR, not a link to saramin.co.kr — a document must render identically offline, in print, and a year from now.',
              '2 · "Báo giá bởi / Proposed by" — the signed-in rep’s name + email.',
              '3 · Title band — "báo giá / proposal" with Ngày báo giá / Proposal Date and Ngày hết hạn / Expiry Date.',
              '4 · Thông tin khách hàng / Client information — client name, email, phone.',
              '5 · Thông tin xuất hóa đơn VAT / Billing information — company legal name, Địa chỉ ĐKKD, Mã số thuế. Read from the company record.',
              '6 · One line-item table per option — stt · Dịch vụ · Đơn vị tính · Số lượng · Đơn giá · Giảm giá · Tổng giá.',
              '7 · Per option: Thuế GTGT (8%), Tổng đơn hàng sau thuế VAT, and Bằng chữ / In words in both languages.',
              '8 · Per option: "Quyền lợi gói … trên TopDev.vn" — the numbered benefit list, composed from the catalog.',
              '9 · Điều khoản và điều kiện / Terms & Conditions — the 6 numbered bilingual clauses below.',
              '10 · Signature block — "Đại diện TopDev", the date in VN + EN, and Authorized Signature.',
            ],
          },
          {
            heading: 'Export to PDF — same information as the client’s current file, refined presentation',
            early: true,
            text: 'The rep opens one action — “Xuất PDF / Export” — which renders the document above and offers Download / Print from the same screen. Preview and export are deliberately not two separate buttons: a rep must never be able to send a PDF they have not looked at.\n\nThe content is a faithful reproduction of the client’s live file (EST-009909-07-2026): every block, every field, both languages, nothing added and nothing removed. What changes is only the presentation — the client’s file runs the Vietnamese and English of each label together on one line, wraps the two customer blocks as prose, and prints unaligned figures, all of which cost the reader time without carrying information.',
            table: {
              cols: ['Kept exactly as today', 'Refined in the export'],
              rows: [
                ['Every block and field, in the same order (letterhead → proposed-by → title band → client + VAT billing → options → benefits → T&C → signature)', 'Bilingual pairs are stacked — Vietnamese leads, English sits underneath in muted italic — instead of being run together on one line'],
                ['All figures, VAT 8%, totals, amount-in-words (VN + EN), gift lines at 0 ₫', 'Line tables get real columns, tabular figures and right-aligned money; the total-after-VAT is the one bold figure per option'],
                ['1–3 options as alternatives, each with its own totals', 'Each option is a self-contained card with its own totals box, so the document can never be misread as summing across options'],
                ['The 6 bilingual T&C clauses, verbatim', 'Numbered clauses with a VN/EN pair each, indented sub-points preserved'],
                ['Client + VAT-billing details read from the company record', 'Shown as two side-by-side labelled cards rather than wrapped prose'],
              ],
            },
            items: [
              'File name is the quotation number: QUO-009909-07-2026.pdf. Page setup A4 portrait; the viewer states this so nobody has to check the print dialog.',
              'GIFT lines print at 0 ₫ with a “Quà tặng / Gift” marker and are never dropped from the table — they are real entitlements that provision identically (see Provisioning).',
              'Everything on the page is derived at render time — line totals, VAT, total-after-VAT, both amount-in-words strings, and the per-package benefit lists come from the catalog. Nothing on this document is typed twice.',
              'Issuer identity (logo, VN/EN name, VN/EN address, website, support email) comes from System → Issuer identity; the “Báo giá bởi / Proposed by” line comes from the signed-in rep. Neither is entered on the quotation.',
              'The export is available on any quotation regardless of status — a Draft can be previewed before it is sent, and a Sent one can be re-downloaded. Re-exporting a sent quotation must reproduce the identical page: the issuer block, VAT rate and prices are snapshotted at send time, never re-read live.',
            ],
            warn: 'Do not “improve” the content while refining the layout. The wording, the clause order and the figures are the client’s and are already correct — a redesign that quietly rephrases a T&C clause or drops the English half of a label changes a document the customer signs against.',
          },
          {
            heading: 'Sharing the quotation with the customer — a link, not an attachment',
            early: true,
            text: 'How the PDF actually reaches the client. From the export viewer, “Chia sẻ / Share” issues a tokenised link (saramin.vn/q/<token>) that opens the same document with no login and no edit rights. The link is the PRIMARY action and the download is secondary, because only the link can be revoked, can expire with the offer, and can tell the rep whether the customer ever opened it — an emailed file does none of the three and lives forever in someone’s inbox.',
            table: {
              cols: ['Control', 'Rule'],
              rows: [
                ['The link', 'Random and unguessable. Anyone holding it can READ the PDF — no account, no edit. It is not a login, so it must never expose anything beyond this one document.'],
                ['Expiry', 'LOCKED to the quotation’s own validity (end of month) and not separately editable. A link that outlives the quotation lets a customer open a lapsed price and believe it still stands.'],
                ['Channels', 'Email · Zalo · copy link. Zalo is a first-class channel, not an afterthought — it is how VN reps actually deliver documents.'],
                ['Revoke', 'Kills access immediately for everyone who already has the link, and disables sending until a new link is issued.'],
                ['Open tracking', 'Open count + last-opened, shown to the rep. This is the answer to “did they even look at it?”, which is otherwise a phone call.'],
              ],
            },
            items: [
              'Sharing is available on a DRAFT too — sending a draft to the client is precisely how a quotation becomes Sent. The share dialog therefore carries a “mark as Sent” tick.',
              'Sharing NEVER sets the status by itself. Sent is declared by a HUMAN (see Quotation status); the tick in the share dialog IS that declaration, made explicitly rather than inferred from a delivery event we cannot even observe when the rep sends by Zalo.',
              'A lapsed quotation warns before sharing: extend the validity or re-issue as v2 first, because the discounts and gifts expired with the date (T&C clause 2).',
              'The customer OPENING the link is logged on the company record as a CLIENT activity — and it must NOT reset Idle. A customer reading our quotation is not us contacting the customer; treating it as contact would make a silent account look freshly touched.',
              'Acceptance is still recorded by the rep, not by the link. There is no “Accept” button for the customer — the quotation has no per-option status, and the option they chose is captured when the PO is raised.',
            ],
            warn: 'The link exposes pricing AND the customer’s own billing block (legal name, Địa chỉ ĐKKD, MST). It must be a random token — never the quotation number, never a sequential id — or one customer can walk the URL space and read another customer’s commercial terms.',
          },
          {
            heading: 'Terms & Conditions printed on every quotation (bilingual, from the client’s PDF)',
            items: [
              '1. Giá đã bao gồm 8% thuế VAT. / Price is inclusive of 8% VAT.',
              '2. Báo giá bao gồm chính sách chiết khấu, ưu đãi và quà tặng có hiệu lực đến hết ngày hết hạn; sau thời gian này chính sách có thể thay đổi. / The quote includes discounts, incentives and gifts valid until the expiration date; after this, policies may change.',
              '3. Dịch vụ được kích hoạt sau khi khách hàng thanh toán đơn hàng & hóa đơn cho đơn hàng được xuất. / The service will be activated after the customer completes the payment & the invoice is issued. — this is the rule that makes payment-confirmation the gate for provisioning.',
              '4. Thời hạn dịch vụ: dịch vụ đã mua phải được kích hoạt trong vòng 12 tháng kể từ ngày xuất hóa đơn (tin đăng và tìm kiếm hồ sơ); sau thời hạn, dịch vụ chưa kích hoạt không còn giá trị nếu không có thỏa thuận khác. / Service term: purchased services must be activated within 12 months from the invoice date; unactivated services expire thereafter.',
              '5. Thời hạn sử dụng sau khi kích hoạt (áp dụng cho cả dịch vụ đặt mua và dịch vụ tặng kèm): tin đăng 30 ngày; tìm kiếm hồ sơ 30 hoặc 90 ngày; quà tặng theo ghi chú phía trên. / Usage period after activation (both purchased and bonus service): job posting 30 days; Search CV 30 or 90 days; gift per the note above.',
              '6. TopDev cam kết chính sách giá & ưu đãi tại thời điểm báo giá là tốt nhất theo chương trình khách hàng thân thiết & chính sách hiện hành (trừ trường hợp thay đổi thuế suất VAT theo quy định Nhà nước). Liên hệ hỗ trợ: customercare@topdev.vn',
            ],
          },
          {
            heading: 'Worked example — the client’s EST-009909-07-2026, as this builder would produce it',
            items: [
              'Header: QUO-009909-07-2026 · Proposal 20/07/2026 · Expiry 31/07/2026 (end of the month it was raised in) · Proposed by Đoàn Thị Phượng | phuongdoan@topdev.vn',
              'Client: anh Huy · huy.nguyen@aoimirai.co.jp · 0978490363',
              'VAT billing: CÔNG TY TNHH AM software việt nam · 115/2A Lê Trọng Tấn, Phường Sơn Kỳ, Quận Tân Phú, TP. Hồ Chí Minh · MST 0317110315',
              'Option 1 — Basic Plus Job + Basic Plus Job (Tặng): line 1 = 1 tin × 6,100,000 − 0% = 6,100,000; line 2 = 1 tin × 0 (Tặng) = 0. VAT 8% = 488,000. Total = 6,588,000. In words auto: "Sáu triệu năm trăm tám mươi tám nghìn đồng." Features: 5 numbered benefits (30-day posting, ≤03 skill tags, bold blue title, Top Search, refresh every 10 days, Highlight-companies homepage slot) + the gift package’s own list.',
              'Option 2 — Basic Job + Basic Job (Tặng): 1 tin × 2,710,000 = 2,710,000. VAT 8% = 216,800. Total = 2,926,800. In words: "Hai triệu chín trăm hai mươi sáu nghìn tám trăm đồng." Features: 2 numbered benefits (30-day posting ≤03 skill tags, refresh every 15 days).',
              'Then: the 6 T&C clauses, then the TopDev signature block dated "Ngày 20 tháng 07 năm 2026 / July 20th, 2026".',
              'Note the document has no combined total — 6,588,000 and 2,926,800 are alternatives. While the customer is deciding, the quotation and the deal are both worth 6,588,000 (the higher option), and 9,514,800 appears nowhere. If anh Huy then picks Option 2, both drop to 2,926,800.',
              'And if Phượng had emailed this PDF from her own Outlook rather than through the CRM, she would open the quotation and click "Mark as sent · Rep’s own email · 20/07 · huy.nguyen@aoimirai.co.jp" — that click, not the mail, is what puts AM Software on the board at Proposal.',
            ],
          },
        ],
        backend: {
          dataModel: [
            { name: 'quotationId', type: 'uuid', required: true },
            { name: 'quoteCode', type: 'string', required: true, notes: 'QUO-{seq}-{MM}-{YYYY}; unique per version-family' },
            { name: 'version', type: 'int', required: true },
            { name: 'supersedesId', type: 'uuid?', notes: 'previous version' },
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'dealId', type: 'uuid', required: true },
            { name: 'ownerId', type: 'uuid', required: true, notes: 'proposedBy' },
            { name: 'proposalDate / expiryDate', type: 'date', required: true },
            { name: 'clientName / clientEmail / clientPhone', type: 'string' },
            { name: 'billingName / billingAddress / taxCode', type: 'string', required: true, notes: 'snapshot at send time — the e-invoice must match what the customer signed off' },
            { name: 'status', type: 'enum', required: true, notes: 'draft|sent|issued_to_po|expired' },
            { name: 'acceptedOptionId', type: 'uuid?', notes: 'null until the customer picks' },
            { name: 'termsVersion', type: 'string', required: true },
            { name: 'vatRate', type: 'decimal', required: true, notes: 'snapshot, e.g. 0.08' },
            { name: 'sentAt / acceptedAt', type: 'timestamp?', notes: 'sentAt null ⇔ the quotation has never gone out. It is still ON the pipeline at Proposal — a Draft is what puts it there — but a forecast may choose to exclude unsent value. Set by both /send and /mark-sent; back-datable, never future.' },
            { name: 'sentVia', type: 'enum?', required: false, notes: 'platform_email|own_email|zalo|messenger|printed|other — how it actually reached the customer. Non-platform values are the common case, not the exception.' },
            { name: 'sentBy / sentTo', type: 'uuid? / string?', notes: 'who declared it sent, and the address or handle it went to — the audit trail for an off-platform send' },
            { name: 'valueSnapshot', type: 'money', notes: 'derived and cached: acceptedOption.totalAfterVat ?? max(options.totalAfterVat). Never sum. One column so the board, the list and every report read the identical number.' },
            { name: '— Special discount + approval —', type: 'group' },
            { name: 'discountMode', type: 'enum', required: true, notes: 'new_churn | existing | trial | special. ONE per quotation. Decides which of the three discount inputs the rep may touch — see the mode table. Changing it clears every discount figure' },
            { name: 'appliedProgrammeId', type: 'uuid?', notes: 'which programme priced this quotation, null under trial and special. Stored so a later change to the programme cannot reprice a quotation already sent' },
            { name: 'approvalState', type: 'enum?', notes: 'pending | approved | rejected — ONLY when discountMode = existing and the order-level % is > 0. No other mode and no other field ever routes' },
            { name: 'approvalRole', type: 'enum?', notes: 'sales_lead (≤10%) | sales_manager (>10%), from the HIGHEST option in the document. Routed by AMOUNT, not by chain: above the band the lead is skipped entirely. Null when the requester’s own role is at or above it — see approvalWaivedBy' },
            { name: 'approvalWaivedBy', type: 'enum?', notes: 'the requester’s role, recorded when seniority removed the step (a lead’s own ≤10%, or any rate of the manager’s). Stored rather than re-derived, so an audit can see WHY a 15% quotation went out unapproved' },
            { name: 'requestedBy / requestedAt', type: 'uuid? / timestamp?' },
            { name: 'approvedBy / approvedAt', type: 'uuid? / timestamp?' },
            { name: 'approvedPct', type: 'decimal?', required: false, notes: 'WHAT was approved. Editing the rate away from this value voids the approval and re-routes — without this field that rule cannot be enforced' },
            { name: 'rejectReason', type: 'string?', notes: 'mandatory on a rejection; the rep can only act on “no” if told what would be a yes' },
            { name: '— QuotationOption —', type: 'child table' },
            { name: 'optionId / quotationId', type: 'uuid', required: true },
            { name: 'sortOrder', type: 'int', required: true, notes: '1..3 → Option 1/2/3' },
            { name: 'title', type: 'string', notes: 'composed from its packages' },
            { name: 'isRecommended', type: 'bool' },
            { name: 'optionDiscountPct', type: 'decimal', notes: 'the “Addition Discount”. Rule-driven under new_churn (50% or 0%), typed by the rep under existing and special, locked at 0 under trial. Applied to the subtotal, before VAT and before the fixed amount' },
            { name: 'fixedDiscountAmount', type: 'money (₫)', notes: 'the client’s “Voucher” — a flat amount, not a percentage. Comes off AFTER the order %, capped at the remaining subtotal so a total can reach 0 but never go negative. Locked at 0 under trial only, and never routes for approval' },
            { name: 'subtotal / vatAmount / totalAfterVat', type: 'money', notes: 'persisted, not recomputed on read — prices change' },
            { name: 'amountInWordsVi / amountInWordsEn', type: 'string' },
            { name: '— QuotationLine —', type: 'child table' },
            { name: 'lineId / optionId', type: 'uuid', required: true },
            { name: 'productId', type: 'uuid', required: true },
            { name: 'nameVi / nameEn / unitVi / unitEn', type: 'string', notes: 'snapshot for the PDF' },
            { name: 'quantity', type: 'int', required: true },
            { name: 'unitPrice', type: 'money', required: true },
            { name: 'discountPct', type: 'decimal', notes: 'rule-driven under existing (the volume tiers), typed by the rep under special, locked at 0 under new_churn and trial' },
            { name: 'lineTotal', type: 'money', required: true },
            { name: 'isGift', type: 'bool', required: true },
            { name: 'featuresSnapshot', type: 'json', notes: 'the numbered benefit list as printed' },
          ],
          endpoints: [
            'GET /admin/crm/quotations?status=&customer=&owner=&page=',
            'POST /admin/crm/quotations { customerId, dealId }',
            'PUT /admin/crm/quotations/:id (Draft only)',
            'POST /admin/crm/quotations/:id/options — add option (max 3)',
            'DELETE /admin/crm/quotations/:id/options/:optionId',
            'POST /admin/crm/quotations/:id/special-discount { pct } — sets the option-subtotal rate and voids any standing approval',
            'POST /admin/crm/quotations/:id/request-approval — routes by the HIGHEST option pct: ≤10% sales_lead, >10% sales_manager. Returns 204 with approvalWaivedBy set when the caller’s own role is at or above the routed role — no request is created',
            'POST /admin/crm/quotations/:id/approve { pct } — 403 unless the caller holds the role the pct routed to; records approver + timestamp + the approved pct',
            'POST /admin/crm/quotations/:id/reject { reason } — returns it to the rep',
            'GET /admin/crm/quotations/:id/pdf?lang=vi-en — render',
            'POST /admin/crm/quotations/:id/send { to[], cc[], message } — we deliver it; sets status Sent, sentVia platform_email',
            'POST /admin/crm/quotations/:id/mark-sent { sentVia, sentAt, sentTo, note } — records a send that happened outside the platform; same validation gates as /send, same status transition and same pipeline effect',
            'POST /admin/crm/quotations/:id/accept { optionId, agreedVia, agreedBy, note }',
            'POST /admin/crm/quotations/:id/reject { reason }',
            'POST /admin/crm/quotations/:id/revise → returns v+1 draft',
            'POST /admin/crm/quotations/:id/issue-po { optionId } → creates the PO from that ONE accepted option',
          ],
          integrations: [
            'Products & packages — line items, units, list prices, benefit lists',
            'PDF renderer — bilingual, must match the current template pixel-for-pixel',
            'Transactional email — send + delivery/open tracking, logged to the timeline',
            'Sales Order / PO (conversion target)',
            'Settings — vendor letterhead, VAT rate, expiry default, quote-number sequence',
          ],
          notes:
            'Snapshot everything printed (names, units, prices, features, terms, VAT rate) onto the quotation rows. A quotation is a legal offer — reprinting it a year later must produce the identical document even after the catalog changes. Number sequence must be gapless and concurrency-safe.',
        },
        acceptance: [
          'A quotation with 2 options renders a PDF identical in structure and content to the client’s EST-009909-07-2026, including per-option VAT, total-after-VAT, bilingual amount-in-words, per-package benefit lists, the 6 T&C clauses and the signature block.',
          'Options total independently and no grand total appears anywhere in the document or the pipeline value.',
          'A gift line prints as 0₫ / 0% and is excluded from revenue, but appears as provisionable quota after activation.',
          'Accepting exactly one option locks the quotation and reveals "Issue PO" prefilled with that option’s lines.',
          'Editing a Sent quotation is impossible; "Revise" produces v2 and marks v1 Superseded, both visible in history.',
          'A quotation past its expiry date shows as Expired without anyone touching it, and its deal’s stage and rot colour are unaffected by the flip.',
          'Issue PO is disabled on an Expired quotation, with the reason shown; extending validity or revising to v2 re-enables it.',
          'A programme discount — any rate, up to 60% — sends with no approval step and no banner.',
          'With Chiết khấu đặc biệt on, the programme is not applied, every line discount is 0 and locked, and only the option-subtotal field accepts a number.',
          'A special discount of 8% routes to the Sales lead and 18% to the Sales manager; "Mark as sent" is disabled until it is approved, and disabled after a rejection.',
          'The Sales lead sees only their own team’s ≤10% requests in "Chờ tôi duyệt", the manager only the >10% ones; a plain rep has no such control at all.',
          'A quotation raised BY the Sales lead at ≤10% exports with no approval step; the same lead at 15% still routes to the manager.',
          'A quotation raised by the Sales manager exports with no approval step at any rate.',
          'A quotation with one option at 8% and another at 18% routes to the Sales manager only, and says why.',
          'A rejection cannot be submitted without a reason, and the reason is shown on the quotation afterwards.',
          'A quotation the rep emailed from their own mailbox and then recorded with "Mark as sent" moves its deal onto the board at Proposal, with the same value, timeline entry and rot clock as a platform-sent one.',
          'A company whose only quotation is a Draft appears on the pipeline board at Proposal — the Draft is what puts it there; sending it does not move the card, and no forecast number changed before that.',
          'A quotation with options at ₫6,588,000 and ₫2,926,800 reads ₫6,588,000 on the quotation list, the deal card and the stage column total; accepting the ₫2,926,800 option changes all three to ₫2,926,800. 9,514,800 is not produced by any screen or export.',
          'A "Mark as sent" back-dated to three days ago makes the Proposal rot clock read 3 days, not 0.',
        ],
        openQuestions: [
          'Max options per quotation — is 3 the cap, or should it be unlimited?',
          'Pending value = the highest option is the rule written here. If Sales would rather forecast the most-likely option, the existing "recommended" flag could drive it instead — confirm with the sales lead before reporting is built, since the two give different pipeline totals.',
          'Channel list for "Mark as sent" — is Platform email · Own email · Zalo · Messenger · Printed enough, and do we want optional proof (a forwarded copy / screenshot) attached on the off-platform ones?',
          'Should an unsent Draft older than N days nag its owner? It IS on the board at Proposal, so the rot clock already covers it — the question is whether an unsent draft deserves a louder signal than a sent one that went quiet.',
          'Who exactly is “Sales leader” and “Sales manager” — is the leader the rep’s own team lead, and is there one manager or one per region? The approval routes to a ROLE today; it needs to resolve to a person.',
          'Does the customer accept by replying (rep marks it), or do we want a signed accept link in the PDF/email so the customer picks the option themselves?',
          'Is e-signature required on the quotation, or is the current authorized-signature image enough?',
          'Confirm the quote-number format QUO-{seq}-{MM}-{YYYY} — is the sequence global or per month/per rep?',
          'End-of-month expiry: a quotation raised on the 30th is valid for one day. Do we roll those to the end of the next month (e.g. anything raised in the last 5 days), or is a one-day offer intended?',
        ],
      },
    },
    // 3 · Purchase order ──────────────────────────────────────────────
    {
      name: 'Purchase order',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-purchase-orders',
      notes: 'PO → invoice → contract cluster needs backend build together if in launch scope. naming: in standard B2B the customer issues the PO to us; the document WE send back is an Order Confirmation / Sales Order. Modelled here as one PO record that can also hold the customer’s own PO number + file, so both practices are covered.',
      detail: {
        requirements: [
        {
          label: 'PO status — five statuses, and the invoice moves with them',
          text: 'A PO and the invoice on it are two views of one thing. The PO status **is** the invoice’s status, seen from the commercial side — which is why there is no state where the two can disagree.\n\nWhat gives the list its shape is that a VN e-invoice exists in two forms. A **draft** (hóa đơn nháp) is a working document: no legal force, nothing filed with the tax authority, and it grants the customer **nothing**. An **official** invoice (hóa đơn chính) is signed, filed and irreversible — and it is the only thing that releases the product.',
          table: {
            cols: ['PO status', 'Invoice status', 'Reached by', 'Who'],
            rows: [
              ['**Active**', '— none yet', 'Issuing the PO from an accepted quotation option. **This is the “won” moment.** Provisions nothing.', '**Sales**'],
              ['**Draft invoice**', 'Draft', 'Issuing a draft invoice off the PO. **Optional** — see below.', '**Sales**'],
              ['**Invoice requested**', 'Invoice requested', 'Asking Accounting to issue the official invoice. Reachable from Active **or** from Draft invoice.', '**Sales**'],
              ['**Invoice issued**', 'Invoice issued', 'Kế toán filing the official invoice. **Provisions the products immediately** — this is the only status that releases anything.', '**Kế toán only**'],
              ['**Expired**', 'Archived', 'The end of the month the PO was issued in, with no official invoice. Fires from Active, Draft invoice **or** Invoice requested.', '**System** — nobody clicks it'],
            ],
          },
          items: [
            '**The draft is optional.** From Active, Sales chooses: issue a draft first, or go straight to requesting the official invoice. A draft is never a precondition for anything.',
            '**Expiry beats everything.** A PO lapses at the end of its issue month whether it is Active, Draft invoice or Invoice requested — no matter what, and regardless of how far along the paperwork looks. Only an official invoice takes a PO out of reach of the clock. “We already made the invoice” is not a reason the deal survives into next month.',
            '**Only the official invoice releases the product.** A draft can sit on a PO for weeks and the customer still cannot post a job or open a CV.',
            'There is no **Cancelled** on a PO, in any status. A PO that goes nowhere expires.',
            'Payment is **not** a status. It is a fact recorded against the PO (paymentState: unpaid · partially paid · paid), because the official invoice may legitimately precede it.',
          ],
          warn: 'Deviation from the client T&C to confirm. Clause 3 says the service activates after payment **and** invoice; this model releases the product on the official invoice alone, so a customer who has not yet paid can already post jobs and open CVs.',
        },
        {
          label: 'Buttons on the PO detail — one row, per status',
          text: 'The screen offers exactly what the status permits, and nothing else. No cancel, no export, no explanatory banners — the status pill, the expiry date beside it and these buttons are the whole control surface.',
          table: {
            cols: ['PO status', 'Buttons shown', 'What they do'],
            rows: [
              ['Active', '`Xem hóa đơn nháp` · `Yêu cầu xuất hóa đơn chính`', 'The first **creates** the draft and opens it (→ Draft invoice). The second skips the draft entirely (→ Invoice requested).'],
              ['Draft invoice', '`Xem hóa đơn nháp` · `Yêu cầu xuất hóa đơn chính`', 'The same two buttons. The first now just **opens** the draft that exists; the second moves it on.'],
              ['Invoice requested', '`Xem hóa đơn nháp` + a waiting note', 'Nothing left for Sales to do. Issuing the official invoice is Kế toán’s act and it is taken **on the invoice**, where the document and its number live.'],
              ['Invoice issued', '`Xem hóa đơn chính`', 'The official invoice is the document worth reading now, and it has its own screen. The draft button is gone.'],
              ['Expired', '— none', 'Nothing on this PO is live. The rep issues a new PO from a live quotation.'],
            ],
          },
          items: [
            '`Xem hóa đơn nháp` and “xuất hóa đơn nháp” are **one action, not two**. A rep issues a draft precisely in order to look at it, so the first click creates it and every click after that opens it. Two buttons for that would be two names for the same intention.',
            'The draft button appears on exactly the three statuses where a draft is the live document, and disappears at Invoice issued (the official one is what you read then) and at Expired (nothing is live).',
            'Issuing the official invoice is deliberately **not** offered here. A duplicate button on the PO would let the fiscal document be created from a screen that does not show it.',
          ],
        },
        {
          label: 'A PO is never cancelled — the invoice is',
          text: 'There is exactly **one** place a sale is undone, and it is the VAT invoice. A second cancel on the PO would give two records that can disagree about whether the sale happened, and only one of them is the document the tax office recognises.',
          table: {
            cols: ['Situation', 'What actually happens', 'Who'],
            rows: [
              ['An Active PO the customer walks away from', 'Nothing. It **expires** at the end of its month. No cancellation, no reason field, no click.', '**System**'],
              ['The invoice was issued before the payment, and the payment never came', 'Cancel the **invoice** (kèm biên bản). The quota it granted is withdrawn with it. The PO stays “Issued invoice” and points at a cancelled invoice.', '**Kế toán only**'],
              ['A wrong invoice — wrong amount, wrong billing details', 'Cancel + biên bản + re-issue. Both invoices stay on record, linked.', '**Kế toán only**'],
              ['The customer wants different lines', 'Issue a **new PO** from a live quotation. A PO is never edited after issue.', '**Sales**'],
            ],
          },
          items: [
            'A PO with a cancelled invoice against it is not a cancelled PO. It is a PO whose invoice was withdrawn — reports must read the invoice, not the PO, when they ask whether revenue happened.',
            'This is also why the PO detail screen offers no destructive action at all. The only thing it can do is take you to the invoice.',
          ],
        },
        {
          label: 'Issuing the invoice provisions the product immediately',
          text: 'The single most consequential rule in the module. The moment **Kế toán** issues the VAT invoice on a PO, the purchased lines land on the customer’s account — there is no queue, no approval and no separate “activate” step for anyone to forget.',
          table: {
            cols: ['Where it shows', 'What the customer can do'],
            rows: [
              ['Company detail → Purchased', 'The product lines from the PO appear on the company record, with the quantity that was invoiced'],
              ['Company detail → Quota in use', 'Job-posting slots and CV unlocks appear as usable balance'],
              ['Employer account', 'The company can **post a job** immediately'],
              ['Employer account', 'The company can **view / unlock CVs** immediately'],
              ['Company page', 'For Job Posting customers, the public company page is enabled'],
            ],
          },
          items: [
            'Gift lines (0 ₫, “Tặng”) provision identically to paid lines — they are quota, not a discount.',
            'This is the ONLY event that grants quota. A PO on its own grants nothing, no matter how long it has been Active.',
            '**Idempotency** — invoice.issued can fire twice (a provider timeout followed by a retry is normal). Provisioning must be keyed on the invoice ID, or the customer silently receives double quota.',
            'Reverse of the same rule: cancelling the invoice withdraws what it granted. See the claw-back question on the status block above.',
          ],
        },
                  {
            label: 'Payment status — a third axis, independent of both document statuses',
            text: 'Money is not a stage of a document. A PO can be Active and already paid; an invoice can be Issued and still unpaid, because invoicing ahead of the transfer is ordinary practice here. So payment is its own axis on both the PO list and the Invoice list, shown NEXT TO the document status and never folded into it — the moment it becomes a stage, one of the two statuses has to lie.',
            table: {
              cols: ['Payment status', 'Means', 'Stored or derived?'],
              rows: [
                ['Paid', 'Kế toán confirmed the money arrived', 'STORED — a single date, `paidAt`. The only payment fact a human records.'],
                ['Unpaid', 'No payment yet, still inside the 14-day window', 'DERIVED — no `paidAt`, and within terms.'],
                ['Overdue', `No payment and MORE THAN 14 DAYS since the PO's issue date`, 'DERIVED — so it turns over by itself at midnight. There is no stored “overdue” that can go stale, and nothing to run.'],
              ],
            },
            items: [
              'The 14 days count from the PO’s ISSUE DATE, not the invoice’s. The customer’s obligation starts when the order is confirmed, and an invoice issued late must not reset a clock the customer is already behind on.',
              'The Overdue cell also says HOW late (“+9d”). “Overdue” alone does not tell a rep whether to send a reminder or escalate to collections.',
              'ONE stored fact, read by two screens. An invoice’s payment status IS its PO’s — so confirming on the invoice updates the PO by construction, not by a second write that could fail on its own and leave the two disagreeing.',
              'CONFIRM PAYMENT is KẾ TOÁN ONLY, on the invoice detail, and only while the status is Unpaid or Overdue. It is independent of the document status: a draft invoice can be confirmed paid, and an issued one can sit unpaid for weeks.',
              'Sales never confirms payment. Reading a bank statement is Accounting’s job, and it is the one fact in the chain that releases the product.',
            ],
            warn: 'Do NOT add a “paid” value to PoStep or InvStep. That was the shape this replaced: it forced a PO that was paid but not yet invoiced to pick one of the two truths, and made “Active” mean different things depending on who was reading it.',
          },
                  {
            label: 'PO as PDF — the document the customer signs',
            text: 'A purchase order can be exported as a PDF, field-for-field the client’s live document (PO-003971-08-2026). It shares the quotation’s letterhead, line table and service terms on purpose: the customer receives both in the same week, and a PO that looks different reads as coming from a different company.',
            table: {
              cols: ['Block', 'Content', 'Differs from the quotation'],
              rows: [
                ['Letterhead', 'Issuer VN + EN name, both addresses, website, Saramin mark + TopDev Vietnam', 'Same.'],
                ['Title band', '“XÁC NHẬN ĐƠN HÀNG / PURCHASE ORDER” + the PO number', 'Different title; the two header cells are Ngày đặt hàng and Số đơn hàng — the customer’s own PO number when they gave one.'],
                ['Client / VAT billing', 'Two blocks: contact + email + phone, and legal name + ĐKKD address + tax code', 'Same. These print verbatim on the VAT invoice, which is why they are mandatory before Send.'],
                ['Line table', 'STT · Dịch vụ · Đơn vị tính · Số lượng · Đơn giá · Giảm giá · Tổng giá, then subtotal, VAT and total-after-VAT', 'ONE block, never options. The customer already chose; a PO showing alternatives would be an offer, not an order.'],
                ['Bằng chữ / In words', 'The total spelled out in VN and EN', 'Same, machine-generated.'],
                ['Quyền lợi', 'The benefits of the package ordered', 'One package, not one per option.'],
                ['Điều kiện sử dụng dịch vụ', 'The service terms', 'Same clauses as the quotation.'],
                ['TRANG KÝ', 'TWO signature columns: Đại diện TopDev (dated) and Đại diện Khách hàng (blank date + signature line)', 'The quotation has one. A PO is a mutual confirmation, so the customer signs it too.'],
              ],
            },
            items: [
              'Export is available in EVERY state, including cancelled and expired. A copy of the document is what gets asked for long after the deal is over, and refusing it then would be the one time it mattered.',
              'The viewer is print/download only — never an editor. A PO is composed when it is issued from an accepted quotation option; this screen renders it and hands over the file.',
              'The customer’s signature date is deliberately left blank on the page: they date it when they sign.',
            ],
          },
        ],
        description:
          'The PO is what turns an accepted quotation option into a committed, billable order. It is created from exactly one accepted option — never from the whole quotation — and it carries that option’s lines forward unchanged. Two real-world variants both land on this one record: customers with a procurement process send us their own PO (we attach its number and file), and customers without one simply act on the PO we send them.\n\nIt is Active from the moment it is issued and it lapses at the end of that month. What it never does is deliver anything — the PO is what Kế toán bills against, and the invoice is what provisions.',
        userStory:
          'As a sales rep, I want the option the customer agreed to become a PO I can issue to them straight away, so that what we bill and what we deliver both come from one committed document.',
        uiFields: [
          {
            group: 'Order header',
            items: [
              { name: 'orderCode', type: 'string', required: true, notes: 'auto — PO-{seq6}-{MM}-{YYYY}, the same shape as the quotation and the invoice; gapless and concurrency-safe' },
              { name: 'sourceQuotation', type: 'ref → Quotation + option', required: true, notes: 'shows "QUO-009909-07-2026 · Option 1" — the audit link back' },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'customerPoNumber', type: 'string', notes: 'the customer’s own PO number, when their procurement issues one' },
              { name: 'customerPoFile', type: 'file', notes: 'their signed PO / confirmation email as an attachment' },
              { name: 'billingSnapshot', type: 'derived', notes: 'billing name / address / tax code carried from the quotation — what the e-invoice will say' },
              { name: 'lineItems[]', type: 'table', required: true, notes: 'copied from the accepted option, gifts included; editable only while Draft' },
              { name: 'subtotal / vatAmount / totalAfterVat', type: 'derived', notes: 'recomputed from the lines; must equal the accepted option unless the order was edited' },
              { name: 'paymentTerms', type: 'enum', notes: '100% in advance (default — T&C clause 3) · 50/50 · net 30 after invoice' },
              { name: 'issueDate', type: 'date', required: true, notes: 'the day the PO went to the customer — a PO is Active from this moment' },
              { name: 'status', type: 'enum', required: true, notes: 'Active (won) · Issued invoice · Expired · Cancelled' },
              { name: 'expiresAt', type: 'derived', required: true, notes: 'last day of the month the PO was issued in — the same end-of-month rule as the quotation' },
            ],
          },
          {
            group: 'Order list',
            items: [
              { name: 'orderCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)' },
              { name: 'status', type: 'enum' },
              { name: 'paymentState', type: 'derived', notes: 'unpaid · partially paid · paid — rolled up from Payments. A FACT about the PO, not a status of it: an invoice may be issued while this still reads unpaid' },
              { name: 'invoiceCount', type: 'count', notes: 'invoices raised against this order' },
              { name: 'owner', type: 'ref → admin user' },
            ],
          },
        ],
        behaviors: [
          'Created only from an accepted quotation option — the "Issue PO" action on the quotation. Lines, totals, VAT and billing details are copied, not retyped.',
          'Issuing the PO sends the PDF with the payment request (bank details + amount) and sets it Active. This is the "won" moment: the deal moves to the PO stage.',
          'Where a customer\u2019s procurement issues its own PO, the rep attaches that number and file. It is evidence, not a status — the PO does not wait for it.',
          '**Sales** requests that an official invoice be issued, optionally preparing a draft first. The PO enters Accounting\u2019s queue at the request, not before, and not because a draft exists.',
          '**Kế toán** issues the official invoice — before or after the money arrives, whichever the customer needs. That, and only that, provisions the products onto the company account, immediately.',
          'A PO still Active on the last day of its month is expired by the system overnight. Nobody presses anything; the rep issues a new PO from a live quotation.',
          'A PO offers no cancel in any status. Withdrawing a sale is done on the invoice by **Kế toán**, and that is what claws the quota back.',
        ],
        rules: [
          'An order comes from exactly one accepted quotation option. The alternatives the customer did not choose never become orders.',
          'The source quotation must be Accepted and not expired. POST /orders rejects an expired quotation server-side, not just in the UI — the commercial terms lapsed with it (T&C clause 2).',
          'An order belongs to one customer; the billing details are the ones snapshotted on the quotation.',
          'Issuing the PO is what counts as won — not the invoice. The invoice closes the deal financially; the commitment is claimed when the PO goes out. Accepted trade-off: the customer has not paid at that point, so the PO column will always hold some deals that never convert.',
          'A PO expires at the end of the month it was issued in — never a rolling 30 days. It is the same rule as the quotation, so the two documents can never disagree about how long the commercial terms stand.',
          'Editing lines after issue requires a new PO (and, if the price changes, a re-issued quotation) so the paper trail stays intact.',
          'A PO grants nothing on its own, and neither does a draft invoice. Provisioning happens on the **official** invoice, and it happens immediately.',
          'A PO has no cancelled state and no cancel endpoint. An Active PO that goes nowhere expires; an invoiced one is corrected by cancelling the invoice.',
          'Invoices always link back to their order; an order may carry more than one invoice under a 50/50 term.',
        ],
        states: ['Đang hiệu lực / Active — won', 'Đã xuất hóa đơn nháp / Draft invoice', 'Đang yêu cầu xuất hóa đơn chính / Invoice requested', 'Đã xuất hóa đơn chính / Invoice issued', 'Hết hạn / Expired — end of month'],
        sections: [
          {
            heading: 'Mô tả tổng quát các trạng thái — four statuses, one forward step, two exits',
            items: [
              'five statuses: Active → (Draft invoice) → Invoice requested → Invoice issued, plus one exit. Draft invoice is the one optional step — everything else runs strictly in order. Each names exactly one action and exactly one role allowed to take it. The screen shows the current status and that one action; the full model below is the reference, not something restated on the page.',
              '**The test** for whether a status earns its place: two statuses are really one if they permit the same actions and carry the same obligations. Applying it removed four — “Nháp / Draft”, “Đã gửi khách / Sent”, “Đã thanh toán / Paid” and “Đã hủy / Cancelled” — see the notes at the end.',
              '1 · Đang hiệu lực / Active — the PO has been issued to the customer, with bank details, off the one accepted quotation option. **This is the “won” moment**: the deal moves to the PO stage as soon as the PO exists. It provisions **nothing**. The customer’s own PO number / file is attached here as evidence when their procurement issues one. → Action: “Yêu cầu xuất hóa đơn chính”, with “Xuất hóa đơn nháp” available beside it. → Who: **Sales**.',
              '2 · Đã xuất hóa đơn nháp / Draft invoice — **optional**. A working invoice exists: no legal number, nothing filed with the tax authority, and it grants the customer **nothing**. It is not sent to the customer as a hóa đơn GTGT. A PO that does not need one skips straight from Active to step 3. → Action: “Yêu cầu xuất hóa đơn chính”. → Who: **Sales**.',
              '3 · Đang yêu cầu xuất hóa đơn chính / Invoice requested — Sales has handed it to Accounting. The PO sits in Kế toán’s queue. Still nothing provisioned, and the month-end clock is still running. → Action: “Xuất hóa đơn chính”. → Who: **Kế toán only**.',
              '4 · Đã xuất hóa đơn chính / Invoice issued — the official VAT e-invoice exists with its legal number. The deal closes, customer status flips out of Prospect, the activation window opens, and **the products land on the customer’s account in the same moment** — they can post a job or open a CV immediately. → Terminal on the PO. Any correction is made on the invoice.',
              '· Hết hạn / Expired — an exit nobody clicks. A PO still short of an official invoice on the last day of the month it was issued in lapses overnight — **no matter what**, whether it is Active, Draft invoice or Invoice requested, exactly like the quotation it came from: issued 05/07 and issued 28/07 both expire on 31/07. It can lapse from any of the first three statuses, draft included. An expired PO can no longer be invoiced; the rep issues a new one from a live quotation.',
              '**Rule** — only the **official** invoice provisions, and it does so immediately. There is no queue and no second “activate” click: the quota is usable the moment the legal number comes back. A draft provisions nothing, ever.',
              '**Rule** — the draft and the request are **Sales**; making it official is **Kế toán only**. Preparing a document is not the same act as filing one with the tax authority, which is exactly why they are two statuses and two roles.',
              '**Rule** — a PO has **no cancel action**, in any status. An Active one expires; an invoiced one is undone by cancelling the invoice. There is no /cancel endpoint on the order at all, so the UI is not the only thing preventing it.',
              '**Rule** — issuing the invoice is **Kế toán** only. The person whose target depends on the deal closing must not be the person who releases the product.',
              '**Rule** — expiry is a nightly job on expiresAt, not a rolling 30-day window and not something a rep sets. It fires regardless of whether a draft invoice exists, and expires that draft with the PO.',
              'Not paying is not a status. An unpaid PO sits at Active (or at Issued invoice, if the customer needed the invoice first) and goes to collections — a receivables problem owned by Accounting, never “Lost”, because the deal was already won.',
              '**Removed** — “Nháp / Draft” and “Đã gửi khách / Sent”. A PO comes into existence **by** being issued to the customer, so nothing distinguished the two: same document, same permissions, same obligations. Consequence: “won” is claimed when the PO is created.',
              '**Removed** — “Đã thanh toán / Paid”. It gated invoicing, and invoicing is no longer gated on it — customers routinely need the invoice in hand to release payment. Payment survives as a **fact** on the PO (paymentState, from the Payments register), not as a stage of it.',
              '**Removed** — “Đã hủy / Cancelled”. It only ever meant “the invoice against this PO was withdrawn”. A PO that goes nowhere expires instead, and the fiscal side of a withdrawal is an invoice matter — see the open question about where cancel/replace now lives. Two cancel paths for one event give two records that can disagree about whether the sale happened, and only the invoice is the document the tax office recognises. An Active PO needs no cancellation either — it expires.',
              '**Removed** earlier, and still removed — “Khách đã xác nhận / Confirmed” and “Đã yêu cầu xuất hóa đơn / Invoice requested”. The first is covered by the evidence fields (customerPoNumber / confirmedAt); the second was a task assignment, not a document state. The client’s current system has the latter as a button, so confirm nobody relies on it as a handoff signal; if they do, model it as a flag + a queue filter, never as a status.',
            ],
          },
        ],
        backend: {
          dataModel: [
            { name: 'orderId', type: 'uuid', required: true },
            { name: 'orderCode', type: 'string', required: true, notes: 'unique' },
            { name: 'quotationId / optionId', type: 'uuid', required: true, notes: 'the accepted option' },
            { name: 'customerId / dealId', type: 'uuid', required: true },
            { name: 'customerPoNumber', type: 'string?' },
            { name: 'customerPoFileUrl', type: 'string?' },
            { name: 'billingName / billingAddress / taxCode', type: 'string', required: true, notes: 'snapshot' },
            { name: 'subtotal / vatRate / vatAmount / totalAfterVat', type: 'money/decimal', required: true },
            { name: 'paymentTerms', type: 'enum' },
            { name: 'status', type: 'enum', required: true, notes: 'active|draft_invoice|invoice_requested|invoiced|expired. Strictly ordered forward; →expired is a job, not a call, and fires from any of the first three. There is no cancelled value: withdrawing a sale is an invoice operation. Validated server-side, never only by the UI' },
            { name: 'expiresAt', type: 'date', required: true, notes: 'last day of the issue month — computed on create, not a rolling window' },
            { name: 'paymentState', type: 'derived', notes: 'unpaid|partial|paid — rolled up from Payments; deliberately NOT part of status' },
            { name: 'confirmedAt / confirmedBy / confirmationEvidence', type: 'timestamp/uuid/string' },
            // no cancelledAt / cancelReason: a PO is never cancelled. Whether the sale
            // was withdrawn is answered by the invoice it points at.
          ],
          endpoints: [
            'GET /admin/crm/orders?status=&customer=&page=',
            'POST /admin/crm/orders (from quotation option)',
            'GET /admin/crm/orders/:id',
            'PUT /admin/crm/orders/:id (Draft only)',
            'POST /admin/crm/orders/:id/attach-customer-po { customerPoNumber?, file? }',
            'POST /admin/crm/orders/:id/draft-invoice — Sales; optional. Creates the draft invoice and moves the PO to draft_invoice',
            'POST /admin/crm/orders/:id/request-invoice — Sales; accepted from active OR draft_invoice, so a draft is never a precondition. Moves the PO to invoice_requested and puts it in Accounting’s queue',
            'JOB expire-orders — nightly; sets every PO past expiresAt that has no OFFICIAL invoice to expired, and expires its draft invoice with it',
            '(no /cancel on orders — cancellation is POST /admin/crm/invoices/:id/cancel, and only on an issued invoice)',
          ],
          integrations: ['Quotations (source)', 'Invoices (the PO\u2019s fiscal half) + Payments (an independent axis)', 'Account management (provisioning target, on the OFFICIAL invoice)'],
          notes: 'Confirm launch scope — real svn-be build if yes. Emits order.issued (pipeline → PO / won), order.draft_invoiced, order.invoice_requested and order.expired. Provisioning listens to invoice.issued — the OFFICIAL one — and the claw-back to invoice.cancelled. Never to an order event, and never to a draft.',
        },
        acceptance: [
          'A PO can only be created from an accepted quotation option and matches that option’s lines and totals exactly.',
          'A new PO is Active immediately, and its expiry is the last day of the month it was issued in.',
          'Issuing the PO moves the deal to the PO stage and provisions nothing.',
          'The customer’s own PO number and file can be attached without changing the status.',
          'Issuing a draft invoice changes the PO status and nothing else — no quota appears on the company, and the company still cannot post a job or open a CV.',
          'An official invoice can be requested straight from Active, with no draft in between.',
          'Issuing the OFFICIAL invoice puts the purchased and gift lines on the company record in the same transaction, and the company can post a job and open a CV straight away.',
          'A PO past its expiry date without an official invoice is Expired by the nightly job — including one that already has a draft — and can no longer be invoiced.',
          'An expired PO’s draft invoice becomes Archived, drops out of the default Invoice list, and nothing has to be clawed back because it never granted anything. Opening the PO — or the Archived tab — still shows it.',
          'No status of a PO offers a cancel action, and POST /orders/:id/cancel does not exist.',
          'Cancelling the invoice on an invoiced PO withdraws the quota and leaves the PO reading “Issued invoice” against a cancelled invoice.',
        ],
        openQuestions: [
          'Are orders / payments / invoices / contracts in launch scope? (significant backend build)',
          'Do we send an Order Confirmation document, or do we only ever wait for the customer’s PO?',
          'Is an internal approval needed before an order is sent, or is quotation approval enough?',
          'Standard payment term — always 100% in advance, or are instalments real?',
          'Claw-back on invoice cancellation: what happens to quota already consumed? (blocks build — see the status block)',
          'Does an expired PO reopen if the customer pays late, or is a new PO always issued?',
        ],
      },
    },
    // 4 · Invoice ─────────────────────────────────────────────────────────────
    {
      name: 'Invoices',
      /* Slug PINNED to the pre-rename name (2026-08-23). A feature's URL derives
         from its name, and comment threads are keyed by pathname — renaming
         without pinning orphans every thread on this page and breaks links
         already shared. The ugly slug is the price of not losing them. */
      slug: 'invoice-vat-e-invoice',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-invoices',
      detail: {
        requirements: [
        {
          label: 'Invoice status — four statuses, moving with the PO',
          text: 'A VN e-invoice exists in two forms and the difference is not cosmetic. A **draft** (hóa đơn nháp) is a working document: no legal force, nothing filed with the tax authority, and it grants the customer **nothing**. An **official** invoice (hóa đơn chính) is signed, filed, immutable — and it is the only thing that releases the product.\n\nThe four statuses are the PO’s five seen from the fiscal side. **Sales** prepares the draft and asks for it to be made official; **Kế toán** alone can file it.',
          table: {
            cols: ['Status', 'Created when', 'Who', 'Rule'],
            rows: [
              ['Draft', 'The PO issues a draft invoice', '**Sales**', 'No legal number, nothing filed, and it **provisions nothing** — the customer cannot post a job or open a CV. It must never be sent to the customer as a hóa đơn GTGT. → Next: “Yêu cầu xuất hóa đơn chính”.'],
              ['Invoice requested', 'Sales asks Accounting to make it official', '**Sales**', 'A hand-off, and the only status that names a queue rather than a document state. Still provisions nothing, and the PO underneath is still running out of month. → Next: **Kế toán only** clicks “Xuất hóa đơn chính”.'],
              ['Invoice issued', '**Kế toán** clicks “Xuất hóa đơn chính”', '**Kế toán only**', 'The provider signs it and returns the legal number. Immutable. This closes the deal, moves the company out of Prospect, starts the activation clock and **provisions the products immediately**.'],
              ['Archived', 'The PO expired before the invoice was made official', '**System** — nobody clicks it', 'The draft dies with its PO. Nothing is clawed back, because it never granted anything. **Withdrawn from the Invoice list** — it is not an invoice to reconcile — but reachable through the Archived tab and from its PO.'],
            ],
          },
          items: [
            'Archived, not Cancelled and not deleted. Cancelled would imply somebody acted, and nobody did — the month simply ended. Deleting it would lose the record that a rep prepared an invoice the customer never received, which is exactly what a month-end review wants to see.',
            'That is safe precisely **because** a draft grants nothing: no quota to withdraw, no credit note, no tax filing to reverse.',
            'A draft is never delivered to the customer as a tax invoice. Where a customer needs a document before the official one, that document is the **PO**, which already carries the amount and the bank details.',
          ],
          warn: 'There is no Cancelled status and no cancel action anywhere in the module any more. VN regulation still requires cancel + biên bản + re-issue for a wrong FILED invoice, so this needs an answer before build — see the open question below.',
        },
        {
          label: 'The invoice status is DERIVED from the PO, never stored beside it',
          text: 'An invoice is not a record with a lifecycle of its own. It is the fiscal half of a PO, so its status is a **function of the PO’s status** and of nothing else. There is no field a rep or a job sets independently, and therefore no state in which the two can disagree.',
          table: {
            cols: ['PO status', 'Invoice status', 'Invoice record exists?'],
            rows: [
              ['Active', '—', 'No. Nothing has been drafted yet.'],
              ['Draft invoice', 'Draft', 'Yes — created, and given its provider number, at the moment the first draft is issued.'],
              ['Invoice requested', 'Invoice requested', 'Yes, the same record.'],
              ['Invoice issued', 'Invoice issued', 'Yes, the same record — now filed, with an issue date.'],
              ['Expired', 'Archived', 'Only if a draft had been issued. A PO that lapsed while still Active has no invoice at all.'],
            ],
          },
          items: [
            'Expiry is derived the same way, and it **overrides** the recorded step. A PO left at Draft invoice or Invoice requested when its month ends reads **Expired**, and its invoice reads **Archived** — nobody has to have run anything for the two to agree. Storing a step and a separate expiry date and hoping they match is the same class of bug as storing the invoice status beside the PO’s.',
            'The invoice number is allocated **when the first draft is issued**, not at official filing. That is what distinguishes a PO that produced a draft from one that never did, and it is why an archived row still has a number.',
            'A PO carries **at most one** invoice. Two invoices on one PO — one reading “issued” while the PO reads “requested” — is exactly the drift this rule exists to prevent, and it is unrepresentable once the status is derived.',
            'Consequence for build: `invoice.status` is a computed column or a view, not a writable field. Any migration that copies it into a stored column re-opens the possibility of the two disagreeing.',
          ],
        },
        {
          label: 'Ngôn ngữ trên hóa đơn — tiếng Việt là bắt buộc, tiếng Anh chỉ là phụ',
          text: 'Nghị định 123/2020 điều 10 khoản 13: the writing on a VAT invoice **is Vietnamese**. Foreign text is allowed, but only as an addition — placed **in parentheses to the right** of the Vietnamese, or **on the line directly below it**, and in a **smaller font**. It may never replace the Vietnamese, and it may never be printed at equal size.',
          table: {
            cols: ['Document', 'Language treatment', 'Why'],
            rows: [
              ['Quotation', 'Fully bilingual, `Tên đơn vị / Legal name` at equal size', 'A commercial document. No rule applies, and the customer’s foreign HQ often reads it.'],
              ['PO', 'Same as the quotation', 'Also commercial — it is a payment request, not a fiscal document.'],
              ['**VAT invoice**', 'Vietnamese leads. English follows **in parentheses, one size smaller** — beside the label on the buyer block, on the line below inside table headers', 'Fiscal document. The slash-at-equal-size format used on the other two would not meet điều 10 khoản 13.'],
            ],
          },
          items: [
            'This is not optional polish: the same template serves a **Doanh nghiệp nước ngoài** buyer who cannot read the Vietnamese at all, and printing English-only or English-equal would make the invoice non-compliant rather than merely unhelpful.',
            'Amounts stay in **VND** and the amount-in-words line stays Vietnamese. Where the law permits a foreign-currency transaction, the currency and the exchange rate print alongside — out of scope for now, but the field is on the document (Đơn vị tiền tệ).',
            'Every label on the invoice goes through one component so the shape cannot drift per field. A rep can never introduce an English-only line by editing text.',
          ],
        },
        {
          label: 'Buttons on the invoice detail — one row, per status',
          text: 'Read left to right: the action, then the documents. An issued invoice has **two** documents worth opening — checking the filed sheet against the draft it came from is a real task — so each gets its own button rather than one that silently changes meaning.',
          table: {
            cols: ['Invoice status', 'Buttons shown', 'Who acts'],
            rows: [
              ['Draft', '`Yêu cầu xuất hóa đơn chính` · `Xem hóa đơn nháp`', '**Sales**. A note beside it tells Kế toán why there is nothing for them here yet — “not requested” is a different problem from “I lack the permission”.'],
              ['Invoice requested', '`Xuất hóa đơn chính · Kế toán` · `Xem hóa đơn nháp`', '**Kế toán only**'],
              ['Invoice issued', '`Xem hóa đơn nháp` · `Xem hóa đơn chính`', 'Read-only. The official one sits furthest right: it is the one that counts.'],
              ['Archived', '`Xem hóa đơn nháp`', 'Read-only. The draft is the only thing left to look at.'],
            ],
          },
        },
                  {
            label: 'VAT invoice as PDF — nháp vs chính',
            text: 'One template, two forms, off the same component. A draft is a working proof the customer checks their own details against; an official invoice is the fiscal document. The differences are exactly what makes one legally binding, so none of them may be faked on the other.',
            table: {
              cols: ['On the document', 'Nháp (draft)', 'Chính (issued)'],
              rows: [
                ['Số (invoice number)', '“<Chưa cấp số>” — the provider has not allocated one', 'The number, e.g. 175 — sequential and gapless, allocated by the provider'],
                ['QR code', 'Absent', 'Present'],
                ['Người bán hàng', '“chưa ký số” placeholder', 'Digital signature block: Signature Valid · bởi <issuer> · Ký ngày'],
                ['Mã của cơ quan thuế', 'Absent', 'Present — the tax authority’s own code'],
                ['Trang tra cứu + Mã tra cứu', 'Absent', 'The provider’s lookup URL and code, so anyone can verify it'],
                ['Legal force', 'NONE. Filed nowhere, grants the customer nothing.', 'This is what releases the product and starts the activation clock (length comes from the product, 12 months by default).'],
              ],
            },
            items: [
              'A draft carries a loud banner — “HÓA ĐƠN NHÁP — chưa có giá trị pháp lý” — because the sheet otherwise looks identical to a real invoice and will be forwarded by email.',
              'ONE export button, and what it produces follows the invoice’s own status. There is deliberately no way to print an official-looking sheet for an invoice that was never filed.',
              'Both forms carry the provider’s full VAT-rate summary block (KCT · 0% · 5% · 8% · 10% · KKKNT · KHAC) with only the applicable band filled, because that is the template Kế toán and the customer both reconcile against.',
              'Which buyer lines carry a value comes from the company’s Phân loại người mua — see the block above.',
            ],
          },
        ],
        description:
          'The closing document, and the only fiscal one in the chain. It exists in two forms: a draft that Sales prepares and that grants nothing, and the official invoice that Kế toán files — before or after the money lands, whichever the customer needs.\n\nIssuing the official one is the single most consequential click in the module: it closes the deal, moves the company out of Prospect, starts the activation window, and puts the products on the customer’s account immediately. Nothing before it grants the customer anything at all.',
        userStory:
          'As Kế toán, I want to turn a draft invoice that Sales prepared into the official VAT e-invoice, so that the customer gets a legal invoice and their service is released — and so that nothing is released before I have done it.',
        uiFields: [
          {
            group: 'Invoice list',
            items: [
              { name: 'invoiceNo', type: 'string', required: true, notes: 'ONE number, the e-invoice provider’s own series — e.g. 1C26TTD-173. A draft already carries a number in this series, so the separate internal INV-{seq6}-{MM}-{YYYY} code has been dropped: it bought nothing and gave support two numbers to ask about. Sequential and gapless, required by law.' },
              { name: 'purchaseOrder', type: 'ref → PO', required: true },
              { name: 'payment', type: 'ref → Payment', notes: 'optional — the payment this invoice settles, linked whenever it exists. An invoice issued ahead of the money has none until the payment is confirmed' },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)', notes: 'subtotal · VAT 8% · total-after-VAT, matching the PO exactly' },
              { name: 'status', type: 'enum', required: true, notes: 'draft | requested | issued | archived. Issuing is a spinner, not a status. There is no Blocked (“cannot issue yet” is a state of the PO) and no Cancelled — see the open question' },
              { name: 'issueDate', type: 'date', notes: 'the day the OFFICIAL invoice was filed — a fact, not a plan, and it starts the activation clock. Empty on a draft' },
              { name: 'activationDeadline', type: 'derived', notes: 'issueDate + the activation window declared on the PRODUCT (activationWindowMonths — 12 by default per clause 4, but 3 on the trial posting). Snapshotted per entitlement at provisioning; a later change to the product must not move a deadline already sold. The “Activate by” column' },
            ],
          },
        ],
        behaviors: [
          'Sales creates a draft off an Active PO and then requests that it be made official. Neither step grants the customer anything.',
          '"Xuất hóa đơn chính" is enabled on a requested draft whose PO is not expired, paid or not. It is disabled otherwise, and says why.',
          'Issuing the OFFICIAL invoice provisions the purchased and gift lines onto the company account in the same transaction — the customer can post a job or open a CV immediately.',
          'When the nightly job expires a PO, any invoice on it that is still Draft or Invoice requested becomes Archived in the same transaction and drops out of the default Invoice list. It stays reachable from the PO and from the Archived tab.',
          'Issue → call the licensed provider, which signs the invoice and returns the legal number + PDF/XML; store both and email them to the customer.',
          'Issuing emits invoice.issued — the event Account management listens to in order to provision the purchased **and** gift services.',
          'A wrong invoice is never edited: cancel + credit note + re-issue, per VN regulation.',
          'The activation countdown is tracked and surfaced per line, so paid-for-but-unused quota does not silently expire. The length comes from the product, not from a constant.',
        ],
        rules: [
          'Draft and official are two states of ONE record, not two records. They share a number, a PO and a line set; what changes is whether it has been filed.',
          'A draft grants nothing. This is enforced in the provisioning listener, which subscribes to the official issue event only — not merely in the UI.',
          'There is no Issuing status — the provider round-trip takes seconds and belongs in a spinner; if it fails the row stays as it was with the provider message and a Retry.',
          'The PO must not be expired. An expired PO cannot be invoiced, and this is enforced server-side rather than by disabling a button.',
          'A draft is never delivered to the customer as a tax invoice. The customer-facing pre-invoice document is the PO.',
          'A confirmed payment is NOT a precondition. Deviation from client T&C clause 3, taken deliberately so customers whose finance process needs the invoice first are not blocked — the compensating control is that Kế toán can cancel the PO, and with it this invoice.',
          'Only the Kế toán role may issue. The person whose target depends on the deal closing must not be the person who declares the money arrived.',
          'Billing name, address and tax code must equal the values snapshotted on the quotation; a mismatch blocks issuing rather than being silently corrected.',
          'Gift lines appear at 0 ₫ so the customer has legal record of what they receive, but contribute nothing to the VAT base.',
          'Issued invoices are immutable. Corrections go through cancel/replace with a credit note.',
          'The VAT rate printed is the rate snapshotted on the quotation, even if the State rate has since changed (clause 6).',
          'invoice.issued must be idempotent on the invoice ID — a provider timeout followed by a retry is normal, and double-firing would grant double quota.',
        ],
        states: [
          'To issue (payment confirmed, invoice not yet stamped by the provider — this is the Accounting work queue)',
          'To issue + provider error (last attempt failed — shows the provider message and a Retry; still To issue, not a separate status)',
          'Issued (carries the provider code and legal number — the only legally valid state)',
          'Cancelled (cancelled, or replaced by a later invoice which is linked both ways)',
        ],
        backend: {
          endpoints: [
            'GET /admin/crm/invoices?status=&customer=&page=',
            'POST /admin/crm/invoices (from an Active PO; no payment precondition) — 403 unless role = accounting',
            'POST /admin/crm/invoices/:id/issue — calls the provider; emits invoice.issued',
            'POST /admin/crm/invoices/:id/cancel { reason } → credit note',
            'GET /admin/crm/invoices/:id/pdf | /xml',
          ],
          integrations: [
            'VN e-invoice provider (licensed — Viettel / VNPT / MISA meInvoice)',
            'Payments (the required predecessor)',
            'Purchase orders (source)',
            'Account management — consumes invoice.issued to provision products, quota and the company page',
          ],
          notes:
            'invoice.issued is the most important event in the module: it closes the deal, flips customer status and releases provisioning. Make it transactional and replay-safe — a provider timeout must never produce two legal invoice numbers, nor two quota grants.',
        },
        acceptance: [
          'Issuing is impossible until a payment is confirmed, and the UI states why.',
          'Only an Accounting-role user can issue; the issuer and timestamp are stored and shown.',
          'invoice.issued closes the deal, updates customer status and provisions both purchased and gift services.',
          'activationDeadline is issueDate + the product’s activationWindowMonths, snapshotted per line at provisioning, and drives an expiry reminder.',
          'A replayed invoice.issued does not grant quota twice.',
          'A corrected invoice is a cancel/replace pair, never an edit.',
        ],
        openQuestions: [
          'BLOCKING — when is the provider’s number assigned? If a draft takes 1C26TTD-176 and then expires, and the next OFFICIAL invoice takes -177, the filed series has a hole — and VN law requires the issued series to be gapless. Two ways out: (a) drafts draw from a separate internal sequence and only get a 1C26TTD- number at official issue, or (b) drafts share the series and the provider re-uses withdrawn numbers. The mockup currently shows (b); the client’s e-invoice provider decides which is actually possible.',
          'BLOCKING — where is a cancel/replace performed? Cancelled has been removed as a status and there is no cancel action left anywhere in the module, but VN regulation still requires cancel + biên bản + re-issue for a wrong FILED invoice, and an official invoice issued ahead of a payment that never arrives still needs an exit. Either the action belongs back on this screen (Kế toán only), or cancellation happens in the provider’s own portal and we only mirror the resulting status — which needs a webhook or a poll, and a rule for what to do if the two disagree.',
          'Which licensed VN e-invoice provider do we integrate?',
          'For 50/50 terms — one invoice per instalment, or a single invoice on final payment?',
          'On cancel/replace, what happens to quota already granted and partly consumed — claw back the unused portion, reconcile on the credit note, or block cancellation once any quota is used?',
        ],
      },
    },
    // 6 · Free data (danh bạ doanh nghiệp) ───────────────────────────────────
    // 5 · Sign-ups ────────────────────────────────────────────────────────────
  ],
}
