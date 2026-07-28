import type { BuildModule } from './types'

/*
 * CRM — Sales & customer lifecycle (HQ Admin).
 *
 * A module separate from the jobseeker flow: the sales team manages companies
 * as customers and moves each deal through the document flow Proposal → Qualified
 * → Negotiation → PO → Invoice (+ Lost). A PO is the "won" moment — the rep then
 * hands off to Account management, which activates the customer (creates the
 * account, provisions products/quota, and — for Job Posting — the public company
 * page). One company record is born here as a prospect and grows up.
 *
 * Also here: the sales back office (Quotations → Sales order/PO → Payments →
 * VAT e-invoice, plus Contracts). One document chain, each step created from the
 * one before it and never retyped:
 *
 *   Quotation (Báo giá, 1–3 OPTIONS)   Sales, EST-xxxxxx-MM-YYYY
 *        │ customer picks ONE option
 *        ▼
 *   Sales order / PO  ── customer confirms ──▶ deal = PO (won)
 *        │ Accounting: awaiting payment
 *        ▼
 *   Payment  ── Accounting CONFIRMS against the bank ──▶ unlocks invoicing
 *        │
 *        ▼
 *   VAT e-invoice issued ──▶ deal = Invoice (closed) · customer status Prospect→New
 *                            · 12-month activation window starts
 *                            · Account management provisions products + gifts
 *
 * The order is payment-before-invoice on purpose: the client's own terms say
 * "the service will be activated after the customer completes the payment & the
 * invoice is issued" (T&C clause 3 of EST-009909-07-2026). Field names and the
 * document layout in ./crm.ts Quotations are modelled on that live PDF.
 *
 * Depth mirrors ./job-management.ts. UI mockups link per feature via `mockup`.
 */

export const crm: BuildModule = {
  id: 'crm',
  title: 'CRM — Sales & customer lifecycle',
  owner: 'Luan',
  requirements: [
    'A CRM separate from the jobseeker flow: sales manage companies as customers and move deals through the sales/document flow.',
    'Sales pipeline (kanban) mirrors the document flow — stages Proposal → Qualified → Negotiation → PO → Invoice, plus Lost; deal value + owner per card. Stage meanings: Proposal = the quotation has been sent to the customer; Qualified = the HR manager is willing to discuss that quotation; Negotiation = HR manager is going through their internal approval process; PO = customer agreed to buy and Sales issued the Purchase Order (this is "won"); Invoice = customer paid and Accounting issued the invoice (closed); Lost = ended without a PO (declined / lost to a competitor / budget cut / went silent — record a reason; can re-enter later as a new deal).',
    'Two independent status dimensions on a company: pipeline stage (the deal, above) and customer status (account health) — Prospect (never invoiced) → New (first VAT invoice issued, still inside the onboarding window) → Existing (active, using a paid service, or a repeat order) → Churn (no new order for 12 months since the last invoice).',
    'Customer status is driven by the INVOICE, not by the order: issuing the first VAT e-invoice is what takes a company out of Prospect. It becomes New (not straight to Existing) so CS knows who needs onboarding, then Existing on a second paid order or once the first service is activated / the onboarding window passes. Churn is the same record looping back for win-back, never a new one.',
    'Quote-to-cash is one document chain, each step created from the previous one: Quotation (1–3 options, bilingual PDF, EST-xxxxxx-MM-YYYY) → customer accepts ONE option → Sales order / PO (customer confirms = won) → Payment (Accounting confirms it against the bank) → VAT e-invoice issued (deal closed, provisioning released). Nothing is retyped between steps and nothing is provisioned before the invoice — per the client’s T&C clause 3.',
    'A quotation must be able to present 2–3 priced OPTIONS as alternatives in one document, each with its own line items, VAT, total-after-VAT, amount-in-words and package benefit list. Exactly one option is accepted; reporting must never sum the options.',
    'Separation of duties: Sales creates and sends quotations and confirms orders; Accounting alone confirms that money landed and issues the VAT e-invoice. The Accounting confirmation is the control that stops a service being provisioned against a payment nobody verified.',
    'One company record throughout: created in the CRM as a prospect. It has no login and is invisible to jobseekers until it is activated. No duplicate company records.',
    'On PO (won), hand off to Account management for activation (create account → provision products/quota → company page for Job Posting). Activation itself lives in the Account management module, not here.',
    'Quote-to-cash back office: Quotes → Purchase orders → Invoices → Payments, plus Contracts, each with its own status lifecycle. Payment is what provisions the account’s products/quota.',
    'Connects to Account management (the activated customer) and Products & packages (what they bought).',
    'Activities on the company record: sales log a Chat (pick a channel — Zalo / Facebook Messenger / Email / SMS / Zalo OA / Phone — plus a note) or a Call (placed & auto-logged via the Calio integration: duration, outcome, recording). A single timeline merges these sales activities with system events (payments, provisioning, page publish).',
  ],
  features: [
    // 0 · Pipeline ────────────────────────────────────────────────────────────
    {
      name: 'Sales pipeline',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'crm-pipeline',
      detail: {
        description:
          'The sales team’s home screen: a kanban of customer deals grouped by stage, following the document flow Proposal → Qualified → Negotiation → PO → Invoice (+ Lost). Each column shows a deal count and total value. A rep drags a card forward as a deal progresses; reaching PO (the Purchase Order) is the "won" trigger to activate the company as a real customer.',
        userStory:
          'As a sales rep, I want to see all my deals by stage and move them forward, so that I always know what to work on next and what to close.',
        uiFields: [
          {
            group: 'Board',
            items: [
              { name: 'stage columns', type: 'enum', required: true, notes: 'Proposal · Qualified · Negotiation · PO · Invoice · Lost — Proposal: quotation sent · Qualified: HR mgr willing to discuss it · Negotiation: HR mgr in internal approval · PO: customer agreed, Sales issued PO (won) · Invoice: paid, Accounting issued invoice (closed) · Lost: ended without a PO' },
              { name: 'column total', type: 'derived', notes: 'deal count + summed deal value (₫) per stage' },
              { name: 'view toggle', type: 'enum', notes: 'board · list · grid' },
            ],
          },
          {
            group: 'Deal card',
            items: [
              { name: 'company', type: 'ref → Customer', required: true },
              { name: 'industry', type: 'enum', notes: 'Y tế · IT · BĐS · Logistics · Bán lẻ · Giáo dục · Tài chính…' },
              { name: 'value', type: 'money (₫)' },
              { name: 'owner', type: 'ref → admin user' },
              { name: 'lastActivity', type: 'relative date' },
              { name: 'activityBadges', type: 'counts', notes: 'linked quotes / POs / invoices / contracts' },
            ],
          },
        ],
        behaviors: [
          'Filter by owner, industry, recency and min deal value; sort (default updated-desc).',
          'Activity quick-filters: has quote / has PO / has invoice / has contract.',
          'Drag a card between columns to change its stage; dropping into PO opens the activation flow.',
          '"New quote" / "Invoices" shortcuts jump to those sub-modules for the selected deal.',
        ],
        rules: [
          'A deal belongs to exactly one customer and one owner.',
          'Proposal requires a Quotation to have been sent; PO requires a confirmed Sales order / customer PO; Invoice requires an Accounting-confirmed payment AND an issued VAT e-invoice.',
          'Deal value rolls up from the quotation: while the quote is pending it shows the recommended option, once accepted it shows the accepted option — never the sum of the options offered.',
          'Invoice and Lost are terminal columns; a Lost deal can be re-opened to an earlier stage.',
        ],
        states: ['Loading', 'Empty (no deals)', 'Filtered-empty', 'PO just reached (activation CTA)'],
        backend: {
          dataModel: [
            { name: 'dealId', type: 'uuid', required: true },
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'stage', type: 'enum', required: true, notes: 'proposal|qualified|negotiation|po|invoice|lost' },
            { name: 'value', type: 'money' },
            { name: 'ownerId', type: 'uuid' },
            { name: 'updatedAt', type: 'timestamp' },
          ],
          endpoints: ['GET /admin/crm/deals?stage=&owner=&industry=&page=', 'PATCH /admin/crm/deals/:id { stage }'],
          notes: 'Deals reference the Customer entity; moving to won emits an event the activation flow listens to.',
        },
        acceptance: [
          'Deals render grouped by stage with correct per-column totals.',
          'Dragging a card changes its stage and persists.',
          'Reaching PO surfaces the "Activate customer" path.',
        ],
        openQuestions: [
          'Confirm the exact stage names + order with the sales team.',
          'Are stages fixed, or configurable per team?',
          'Should the PO stage be renamed "Order confirmed"? In standard B2B the customer issues the PO to us — what we send is an order confirmation.',
        ],
      },
    },
    // 1 · Customers ─────────────────────────────────────────────────────────────
    {
      name: 'Companies (one list)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'crm-customer',
      detail: {
        description:
          'ONE list of every company — the single source of truth. Each record carries TWO status dimensions: a pipeline stage (the current deal: Proposal → Qualified → Negotiation → PO → Invoice / Lost) shown on the Pipeline board, and a customer status (account health: Prospect → New → Existing → Churn) shown on this directory. The Pipeline board is the SAME list grouped by stage. There is no separate "account list" — Account management (users, products, public page) is just sections on this same record, shown only for customers who bought them. No duplicate company.',
        userStory:
          'As a sales rep, I want one list that holds every company — from cold lead through paying customer to renewal — so history, account, and status never fragment across two lists.',
        uiFields: [
          {
            group: 'Customer record (CRM — internal only)',
            items: [
              { name: 'legalName', type: 'string', required: true },
              { name: 'taxCode (MST)', type: 'string', notes: 'de-dup key + VAT invoicing' },
              { name: 'industry', type: 'enum' },
              { name: 'address / location', type: 'string' },
              { name: 'primaryContact', type: 'person', notes: 'name, role, phone, email' },
              { name: 'pipelineStage', type: 'enum', required: true, notes: 'the current deal: Proposal → Qualified → Negotiation → PO → Invoice / Lost' },
              { name: 'customerStatus', type: 'enum', required: true, notes: 'account health: Prospect (never invoiced) → New (first VAT invoice issued, in onboarding window) → Existing (active paid service or repeat order) → Churn (no new order 12 months after the last invoice)' },
              { name: 'firstInvoicedAt / lastInvoicedAt', type: 'derived', notes: 'the two dates that drive Prospect→New and Existing→Churn' },
              { name: 'owner', type: 'ref → admin user' },
              { name: 'accountId', type: 'ref → Account', notes: 'set at activation; empty while a prospect' },
              { name: 'companyId', type: 'ref → Company', notes: 'set only if the customer posts jobs' },
            ],
          },
        ],
        behaviors: [
          'The directory filters by customer status (Prospect / New / Existing / Churn), owner, industry, activity (has quote/PO/invoice/contract); Sales sees their own book, Sales-lead sees the whole team.',
          'The Pipeline board is this same list grouped by pipeline stage — a view, not a second dataset.',
          'Row → the company record: contact, deal(s), quote/PO/invoice history, and — for customers — its account, products/quota, users, and public page as sections.',
          'On PO, "Convert / Activate" provisions the account. Renewal loop: when no new PO is issued within a year of the last PO, customer status flips to Churn and the company re-enters the pipeline for a win-back (no new record).',
          'Customer status is recomputed by the system, not set by hand: invoice.issued on a company with no prior invoice → New; a second paid order (or the first service activated / the onboarding window elapsed) → Existing; 12 months past lastInvoicedAt with no new order → Churn. Sales can only override with a reason, and the override is logged.',
        ],
        rules: [
          'A company is always created here first — the CRM is the single front door, even for a company that arrives already large.',
          'De-duplicate on tax code / legal name at creation; block or offer merge on a match.',
          'A Prospect has no login and is invisible to jobseekers; account + public page exist only after PO + activation.',
          'Products and the public company page are per-record sections gated by product (Job Posting) — never a reason for a separate list.',
          'Churn ≠ a new record — it is the same company looping back for a win-back / renewal.',
          'A company leaves Prospect only when a VAT e-invoice is issued — never on a sent quotation or a confirmed order alone.',
          'Prospect → New → Existing never skips New: a first-time paying customer is always New first, so onboarding is visible.',
        ],
        states: ['Prospect', 'New (customer)', 'Existing (customer)', 'Churn (win-back candidate)', 'Duplicate detected'],
        backend: {
          dataModel: [
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'legalName', type: 'string', required: true },
            { name: 'taxCode', type: 'string', notes: 'unique — dedup key' },
            { name: 'pipelineStage', type: 'enum', required: true, notes: 'proposal|qualified|negotiation|po|invoice|lost' },
            { name: 'customerStatus', type: 'enum', required: true, notes: 'prospect|new|existing|churn' },
            { name: 'accountId', type: 'uuid?', notes: 'nullable until activation' },
            { name: 'companyId', type: 'uuid?', notes: 'nullable; set when Job Posting enabled' },
            { name: 'ownerId', type: 'uuid' },
          ],
          endpoints: ['GET /admin/crm/customers?…', 'POST /admin/crm/customers (dedup check)', 'GET /admin/crm/customers/:id'],
          notes: 'ONE company table. The Pipeline is a status-grouped view of it; Account management adds the account/users/products/page as related sections on the same record — never a second company list.',
        },
        acceptance: [
          'A lead can be created with internal-only data and no login.',
          'Duplicate tax code / legal name is caught at creation.',
          'Issuing a PO exposes the activation entry point.',
        ],
        openQuestions: [
          'Confirm: is a CRM customer the SAME record as a Company, or two records linked at activation? (recommended: same record + lifecycle status)',
          'When a company arrives outside sales (self-signup), auto-create a CRM customer so "always via CRM" still holds?',
          'Required fields to create a lead vs to activate a customer?',
        ],
      },
    },
    // 2 · Quotations ──────────────────────────────────────────────────────────
    {
      name: 'Quotations (Báo giá)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'Field-for-field modelled on the client’s live PDF (EST-009909-07-2026). Bilingual VN/EN, multi-option (1–3 options per document), one option accepted.',
      detail: {
        description:
          'The first document in quote-to-cash and the only one the customer sees before committing. A rep builds it in five steps — (1) pick the company, (2) fill the client + VAT-billing block, (3) build 1–3 priced OPTIONS, (4) review the auto-composed T&C / features / signature block, (5) generate the bilingual PDF and send. The output must reproduce the client’s existing PDF exactly: vendor letterhead, "BÁO GIÁ / PROPOSAL", proposal + expiry date, client information, VAT billing information, one line-item table per option (STT · Dịch vụ · Đơn vị tính · Số lượng · Đơn giá · Giảm giá · Tổng giá), VAT 8% row, total-after-VAT, amount in words (VN + EN), the package features ("Quyền lợi gói … trên TopDev.vn"), 6 numbered Terms & Conditions, and the TopDev authorized-signature block.',
        userStory:
          'As a sales rep, I want to build one quotation that offers the customer 2–3 priced alternatives and send it as the same bilingual PDF we send today, so that the customer can pick a package without me re-quoting.',
        uiFields: [
          {
            group: 'Step 1 · Document header (auto)',
            items: [
              { name: 'quoteCode', type: 'string', required: true, notes: 'auto — EST-{seq6}-{MM}-{YYYY}, e.g. EST-009909-07-2026. Never editable.' },
              { name: 'version', type: 'int', required: true, notes: 'v1, v2… a re-issue after negotiation bumps the version; code stays the same' },
              { name: 'vendorBlock', type: 'derived', notes: 'fixed letterhead: CÔNG TY TNHH DAOUKIWOOM INNOVATION / DAOUKIWOOM INNOVATION COMPANY LIMITED · Tầng 12, 13 & 14, Tòa nhà AP, 518B Điện Biên Phủ, Phường Thạnh Mỹ Tây, TP. Hồ Chí Minh · https://topdev.vn — from settings, not typed' },
              { name: 'proposedBy', type: 'derived', notes: '"Báo giá bởi / Proposed by: {rep name} | {rep email}" — the signed-in rep' },
              { name: 'proposalDate', type: 'date', required: true, notes: 'Ngày báo giá / Proposal Date — defaults today' },
              { name: 'expiryDate', type: 'date', required: true, notes: 'Ngày hết hạn / Expiry Date — defaults proposal + 14 days (PDF: 20/07 → 03/08); editable, must be > proposalDate' },
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
              { name: 'billingCompanyName', type: 'string', required: true, notes: 'Tên công ty / Company name — the LEGAL entity, may differ from the CRM display name (PDF: CÔNG TY TNHH AM SOFTWARE VIỆT NAM)' },
              { name: 'billingAddress', type: 'string', required: true, notes: 'Địa chỉ KKD / Billing Address — registered-business address' },
              { name: 'taxCode', type: 'string', required: true, notes: 'Mã số thuế / Tax code — 10 or 13 digits; carried straight to the e-invoice, so validate format' },
              { name: 'sameAsCompany', type: 'toggle', notes: 'copy from the CRM record in one click; edits here write back to the company record' },
            ],
          },
          {
            group: 'Step 3 · Options (1–3 per quotation) — repeatable block',
            items: [
              { name: 'optionLabel', type: 'string', required: true, notes: 'auto "Option 1/2/3" + the composed title: "Option 1: Dịch vụ tin đăng (Basic Plus Job) + Dịch vụ tin đăng (Basic Plus Job) (Tặng)"' },
              { name: 'recommended', type: 'toggle', notes: 'at most one option flagged — drives the PDF highlight and the forecast value while pending' },
              { name: 'lineItems[]', type: 'table', required: true, notes: 'columns exactly as the PDF: STT/No. · Dịch vụ/Type of service · Đơn vị tính/Unit · Số lượng/Quantity · Đơn giá/Unit price · Giảm giá/Discount · Tổng giá/Total price' },
              { name: '↳ product', type: 'ref → Product/Package', required: true, notes: 'from Products & packages — pulls name (VN/EN), unit and list price' },
              { name: '↳ unit', type: 'enum', notes: 'tin / post · hồ sơ / CV · tháng / month · gói / package' },
              { name: '↳ quantity', type: 'int', required: true, notes: 'min 1' },
              { name: '↳ unitPrice', type: 'money (₫)', required: true, notes: 'defaults to list price, rep may override (logged)' },
              { name: '↳ discountPct', type: 'percent', notes: '0–100; > threshold requires sales-lead approval before Send' },
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
            group: 'Quotation list',
            items: [
              { name: 'quoteCode / version', type: 'string', required: true },
              { name: 'company', type: 'ref → Customer', required: true },
              { name: 'options', type: 'count', notes: 'e.g. "2 options" — with the accepted one named once decided' },
              { name: 'value', type: 'money (₫)', notes: 'accepted option if decided, else the recommended option (never the sum of options)' },
              { name: 'status', type: 'enum', notes: 'Draft · Pending approval · Sent · Accepted · Rejected · Expired · Superseded' },
              { name: 'expiryDate', type: 'date', notes: 'with a "expires in N days" warning inside 3 days' },
              { name: 'owner', type: 'ref → admin user' },
            ],
          },
        ],
        behaviors: [
          'Create from the company record or the deal card, so the quotation is always attached to a customer and a deal — never floating.',
          'Selecting the company prefills client info + VAT billing block from the CRM record; the rep only edits what differs.',
          'Adding a product pulls its VN/EN name, unit, list price and benefit list from Products & packages — the "Quyền lợi" section is composed, never typed.',
          '"Add option" duplicates the current option as a starting point (typical use: same package, different quantity/tier), up to 3. "Duplicate as gift" adds the paired "(Tặng)" line at 0₫.',
          'Each option totals independently — VAT, total-after-VAT and amount-in-words are computed per option. The document has NO grand total.',
          'Live bilingual PDF preview beside the form, page-for-page identical to the sent file.',
          'Send → generates the PDF, emails the client contact (cc the rep), logs it on the company timeline, and moves the deal to Proposal.',
          'Customer replies picking an option → the rep marks that option Accepted (recording who agreed and how — email / Zalo / call). The other options are marked Not chosen and the quotation becomes read-only.',
          'Negotiation → "Revise" clones the quotation as v2 with a revision reason; v1 becomes Superseded. Both stay in history.',
          'Auto-flips to Expired past the expiry date; "Extend validity" re-dates and re-sends as a new version.',
          'Accepting an option is the single entry point to "Create Sales Order / PO" — the accepted option’s lines are copied into it.',
        ],
        rules: [
          'A quotation has 1–3 options. Options are ALTERNATIVES, not add-ons: exactly one may be accepted, and reporting must never sum them.',
          'Every option needs at least one paid line item — an option cannot be gifts only.',
          'Gift ("Tặng") lines are always 0₫ at 0% discount and are excluded from revenue, but are provisioned as real quota on activation.',
          'Tax code, billing name and billing address are mandatory before Send — they flow verbatim to the VAT e-invoice and cannot be fixed later without re-issuing it.',
          'Discount above the configured threshold blocks Send until a sales lead approves (Pending approval).',
          'Only Draft is editable. A Sent quotation is immutable — changes create a new version.',
          'Amount-in-words is always machine-generated in VN and EN; it is never an input field.',
          'VAT rate comes from settings so a State rate change (T&C clause 6) does not require a code change; a sent quotation keeps the rate it was sent with.',
          'The quotation states the commercial terms the whole chain inherits: service activates only after payment + invoice (clause 3), must be activated within 12 months of the invoice date (clause 4), and runs 30 days once activated (clause 5).',
        ],
        states: [
          'Draft (editable)',
          'Pending approval (discount over threshold)',
          'Sent (immutable, awaiting the customer)',
          'Accepted (one option chosen)',
          'Rejected',
          'Expired (past expiry date)',
          'Superseded (replaced by a newer version)',
        ],
        sections: [
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
              'Header: EST-009909-07-2026 · Proposal 20/07/2026 · Expiry 03/08/2026 · Proposed by Đoàn Thị Phượng | phuongdoan@topdev.vn',
              'Client: anh Huy · huy.nguyen@aoimirai.co.jp · 0978490363',
              'VAT billing: CÔNG TY TNHH AM SOFTWARE VIỆT NAM · 115/2A Lê Trọng Tấn, Phường Sơn Kỳ, Quận Tân Phú, TP. Hồ Chí Minh · MST 0317110315',
              'Option 1 — Basic Plus Job + Basic Plus Job (Tặng): line 1 = 1 tin × 6,100,000 − 0% = 6,100,000; line 2 = 1 tin × 0 (Tặng) = 0. VAT 8% = 488,000. Total = 6,588,000. In words auto: "Sáu triệu năm trăm tám mươi tám nghìn đồng." Features: 5 numbered benefits (30-day posting, ≤03 skill tags, bold blue title, Top Search, refresh every 10 days, Highlight-companies homepage slot) + the gift package’s own list.',
              'Option 2 — Basic Job + Basic Job (Tặng): 1 tin × 2,710,000 = 2,710,000. VAT 8% = 216,800. Total = 2,926,800. In words: "Hai triệu chín trăm hai mươi sáu nghìn tám trăm đồng." Features: 2 numbered benefits (30-day posting ≤03 skill tags, refresh every 15 days).',
              'Then: the 6 T&C clauses, then the TopDev signature block dated "Ngày 20 tháng 07 năm 2026 / July 20th, 2026".',
              'Note the document has no combined total — 6,588,000 and 2,926,800 are alternatives. The deal forecast shows one of them, not 9,514,800.',
            ],
          },
        ],
        backend: {
          dataModel: [
            { name: 'quotationId', type: 'uuid', required: true },
            { name: 'quoteCode', type: 'string', required: true, notes: 'EST-{seq}-{MM}-{YYYY}; unique per version-family' },
            { name: 'version', type: 'int', required: true },
            { name: 'supersedesId', type: 'uuid?', notes: 'previous version' },
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'dealId', type: 'uuid', required: true },
            { name: 'ownerId', type: 'uuid', required: true, notes: 'proposedBy' },
            { name: 'proposalDate / expiryDate', type: 'date', required: true },
            { name: 'clientName / clientEmail / clientPhone', type: 'string' },
            { name: 'billingName / billingAddress / taxCode', type: 'string', required: true, notes: 'snapshot at send time — the e-invoice must match what the customer signed off' },
            { name: 'status', type: 'enum', required: true, notes: 'draft|pending_approval|sent|accepted|rejected|expired|superseded' },
            { name: 'acceptedOptionId', type: 'uuid?', notes: 'null until the customer picks' },
            { name: 'termsVersion', type: 'string', required: true },
            { name: 'vatRate', type: 'decimal', required: true, notes: 'snapshot, e.g. 0.08' },
            { name: 'sentAt / acceptedAt', type: 'timestamp?' },
            { name: '— QuotationOption —', type: 'child table' },
            { name: 'optionId / quotationId', type: 'uuid', required: true },
            { name: 'sortOrder', type: 'int', required: true, notes: '1..3 → Option 1/2/3' },
            { name: 'title', type: 'string', notes: 'composed from its packages' },
            { name: 'isRecommended', type: 'bool' },
            { name: 'subtotal / vatAmount / totalAfterVat', type: 'money', notes: 'persisted, not recomputed on read — prices change' },
            { name: 'amountInWordsVi / amountInWordsEn', type: 'string' },
            { name: '— QuotationLine —', type: 'child table' },
            { name: 'lineId / optionId', type: 'uuid', required: true },
            { name: 'productId', type: 'uuid', required: true },
            { name: 'nameVi / nameEn / unitVi / unitEn', type: 'string', notes: 'snapshot for the PDF' },
            { name: 'quantity', type: 'int', required: true },
            { name: 'unitPrice', type: 'money', required: true },
            { name: 'discountPct', type: 'decimal' },
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
            'POST /admin/crm/quotations/:id/request-approval',
            'POST /admin/crm/quotations/:id/approve | /reject-approval',
            'GET /admin/crm/quotations/:id/pdf?lang=vi-en — render',
            'POST /admin/crm/quotations/:id/send { to[], cc[], message }',
            'POST /admin/crm/quotations/:id/accept { optionId, agreedVia, agreedBy, note }',
            'POST /admin/crm/quotations/:id/reject { reason }',
            'POST /admin/crm/quotations/:id/revise → returns v+1 draft',
            'POST /admin/crm/quotations/:id/convert { optionId } → Sales Order / PO',
          ],
          integrations: [
            'Products & packages — line items, units, list prices, benefit lists',
            'PDF renderer — bilingual, must match the current template pixel-for-pixel',
            'Transactional email — send + delivery/open tracking, logged to the timeline',
            'Sales Order / PO (conversion target)',
            'Settings — vendor letterhead, VAT rate, expiry default, discount-approval threshold, quote-number sequence',
          ],
          notes:
            'Snapshot everything printed (names, units, prices, features, terms, VAT rate) onto the quotation rows. A quotation is a legal offer — reprinting it a year later must produce the identical document even after the catalog changes. Number sequence must be gapless and concurrency-safe.',
        },
        acceptance: [
          'A quotation with 2 options renders a PDF identical in structure and content to EST-009909-07-2026, including per-option VAT, total-after-VAT, bilingual amount-in-words, per-package benefit lists, the 6 T&C clauses and the signature block.',
          'Options total independently and no grand total appears anywhere in the document or the pipeline value.',
          'A gift line prints as 0₫ / 0% and is excluded from revenue, but appears as provisionable quota after activation.',
          'Accepting exactly one option locks the quotation and reveals "Create Sales Order / PO" prefilled with that option’s lines.',
          'Editing a Sent quotation is impossible; "Revise" produces v2 and marks v1 Superseded, both visible in history.',
          'A quotation past its expiry date shows as Expired without anyone touching it.',
          'A discount over the threshold cannot be sent until a sales lead approves.',
        ],
        openQuestions: [
          'Max options per quotation — is 3 the cap, or should it be unlimited?',
          'Discount threshold that triggers sales-lead approval, and who the approvers are?',
          'Does the customer accept by replying (rep marks it), or do we want a signed accept link in the PDF/email so the customer picks the option themselves?',
          'Is e-signature required on the quotation, or is the current authorized-signature image enough?',
          'Confirm the quote-number format EST-{seq}-{MM}-{YYYY} — is the sequence global or per month/per rep?',
          'Default validity: is 14 days the standing rule?',
        ],
      },
    },
    // 3 · Sales orders / PO ───────────────────────────────────────────────────
    {
      name: 'Sales orders / PO',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'PO → payment → invoice → contract cluster needs backend build together if in launch scope. NAMING: in standard B2B the customer issues the PO to us; the document WE send back is an Order Confirmation / Sales Order. Modelled here as one Sales Order record that can also hold the customer’s own PO number + file, so both practices are covered.',
      detail: {
        description:
          'The order is what turns an accepted quotation option into a committed, billable order. It is created from exactly one accepted option — never from the whole quotation — and it carries that option’s lines forward unchanged. Two real-world variants both land on this one record: customers with a procurement process send us their own PO (we attach its number and file), and customers without one simply confirm the order we send them. Once confirmed, the order is what Accounting bills and what Account management provisions against.',
        userStory:
          'As a sales rep, I want the option the customer agreed to become an order I can send them for confirmation, so that what we bill and what we deliver both come from one committed document.',
        uiFields: [
          {
            group: 'Order header',
            items: [
              { name: 'orderCode', type: 'string', required: true, notes: 'auto — SO-{seq}-{MM}-{YYYY}; kept in sync with the quote it came from' },
              { name: 'sourceQuotation', type: 'ref → Quotation + option', required: true, notes: 'shows "EST-009909-07-2026 · Option 1" — the audit link back' },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'customerPoNumber', type: 'string', notes: 'the customer’s OWN PO number, when their procurement issues one' },
              { name: 'customerPoFile', type: 'file', notes: 'their signed PO / confirmation email as an attachment' },
              { name: 'billingSnapshot', type: 'derived', notes: 'billing name / address / tax code carried from the quotation — what the e-invoice will say' },
              { name: 'lineItems[]', type: 'table', required: true, notes: 'copied from the accepted option, gifts included; editable only while Draft' },
              { name: 'subtotal / vatAmount / totalAfterVat', type: 'derived', notes: 'recomputed from the lines; must equal the accepted option unless the order was edited' },
              { name: 'paymentTerms', type: 'enum', notes: '100% in advance (default — T&C clause 3) · 50/50 · net 30 after invoice' },
              { name: 'issueDate', type: 'date', required: true },
              { name: 'status', type: 'enum', required: true, notes: 'Draft · Sent · Confirmed · Awaiting payment · Paid · Invoiced · Cancelled' },
            ],
          },
          {
            group: 'Order list',
            items: [
              { name: 'orderCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)' },
              { name: 'status', type: 'enum' },
              { name: 'paymentState', type: 'derived', notes: 'unpaid · partially paid · paid — rolled up from Payments' },
              { name: 'invoiceCount', type: 'count', notes: 'invoices raised against this order' },
              { name: 'owner', type: 'ref → admin user' },
            ],
          },
        ],
        behaviors: [
          'Created only from an accepted quotation option — the "Convert" action on the quotation. Lines, totals, VAT and billing details are copied, not retyped.',
          'Send → the order PDF goes to the customer for confirmation, together with the payment request (bank details + amount) since the default term is payment in advance.',
          'Customer confirms (their PO, a signed order, or an email) → the rep sets Confirmed and attaches the evidence. This is the "won" moment for the pipeline: the deal moves to the PO stage.',
          'Confirmed → Accounting sees it in their queue as awaiting payment.',
          'Payment recorded and confirmed by Accounting → the order flips to Paid and Accounting can issue the VAT e-invoice against it.',
          'Cancel with a reason — allowed until a payment is confirmed; after that it needs a credit note, not a cancellation.',
        ],
        rules: [
          'An order comes from exactly ONE accepted quotation option. The alternatives the customer did not choose never become orders.',
          'An order belongs to one customer; the billing details are the ones snapshotted on the quotation.',
          'Reaching Confirmed is what counts as won — not the invoice. The invoice closes the deal financially, but commitment happens here.',
          'Editing lines after Confirmed requires a new version of the order (and, if the price changes, a re-issued quotation) so the paper trail stays intact.',
          'Per T&C clause 3, nothing is provisioned at this stage — Confirmed alone provisions nothing. Payment + invoice do.',
          'Invoices always link back to their order; an order may carry more than one invoice under a 50/50 term.',
        ],
        states: ['Draft', 'Sent (awaiting customer confirmation)', 'Confirmed (won)', 'Awaiting payment', 'Paid', 'Invoiced', 'Cancelled'],
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
            { name: 'status', type: 'enum', required: true, notes: 'draft|sent|confirmed|awaiting_payment|paid|invoiced|cancelled' },
            { name: 'confirmedAt / confirmedBy / confirmationEvidence', type: 'timestamp/uuid/string' },
            { name: 'cancelledAt / cancelReason', type: 'timestamp?/string?' },
          ],
          endpoints: [
            'GET /admin/crm/orders?status=&customer=&page=',
            'POST /admin/crm/orders (from quotation option)',
            'GET /admin/crm/orders/:id',
            'PUT /admin/crm/orders/:id (Draft only)',
            'POST /admin/crm/orders/:id/send',
            'POST /admin/crm/orders/:id/confirm { customerPoNumber?, file?, evidence }',
            'POST /admin/crm/orders/:id/cancel { reason }',
          ],
          integrations: ['Quotations (source)', 'Invoices + Payments (downstream)', 'Account management (provisioning target, after payment)'],
          notes: 'Confirm launch scope — real svn-be build if yes. Emits order.confirmed (pipeline → PO / won) and order.paid (unlocks invoicing).',
        },
        acceptance: [
          'An order can only be created from an accepted quotation option and matches that option’s lines and totals exactly.',
          'Confirming an order moves the deal to the PO stage and records who confirmed and how.',
          'The customer’s own PO number and file can be attached without changing the flow.',
          'Nothing is provisioned on confirmation alone.',
        ],
        openQuestions: [
          'Are orders / payments / invoices / contracts in launch scope? (significant backend build)',
          'Do we send an Order Confirmation document, or do we only ever wait for the customer’s PO?',
          'Is an internal approval needed before an order is sent, or is quotation approval enough?',
          'Standard payment term — always 100% in advance, or are instalments real?',
        ],
      },
    },
    // 4 · Payments ────────────────────────────────────────────────────────────
    // Deliberately BEFORE Invoices: per T&C clause 3 the customer pays first and
    // the VAT e-invoice is issued after. Accounting’s confirmation here is the gate.
    {
      name: 'Payments (Accounting confirmation)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'Payments sit against a confirmed order and are the gate for everything downstream. Because the customer pays before the VAT invoice is issued (T&C clause 3), the money arrives against the ORDER, not against an existing invoice. Accounting’s job here is a deliberate two-step: a payment is first Recorded (someone saw a transfer receipt) and only becomes Confirmed when Accounting has matched it to the bank statement. That confirmation is the single action that unlocks invoicing, marks the deal won financially, and releases provisioning — so it is separated from Sales by permission on purpose.',
        userStory:
          'As Accounting, I want to confirm that a customer’s payment has actually landed in our bank, so that we only issue the VAT invoice and activate the service against money we really received.',
        uiFields: [
          {
            group: 'Payment record',
            items: [
              { name: 'reference', type: 'string', required: true, notes: 'auto — e.g. PAY-1039' },
              { name: 'order', type: 'ref → Sales order', required: true, notes: 'the confirmed order being paid' },
              { name: 'customer', type: 'derived', notes: 'from the order' },
              { name: 'amountDue', type: 'derived', notes: 'the order’s total-after-VAT minus already-confirmed payments' },
              { name: 'amount', type: 'money (₫)', required: true },
              { name: 'method', type: 'enum', required: true, notes: 'Bank transfer (default in VN B2B) · Cash · Credit card · Gateway' },
              { name: 'paidDate', type: 'date', required: true, notes: 'value date on the bank statement, not the entry date' },
              { name: 'bankReference', type: 'string', notes: 'transaction ref / statement line used to match' },
              { name: 'proofFile', type: 'file', notes: 'transfer receipt the customer sent' },
              { name: 'status', type: 'enum', required: true, notes: 'Recorded · Confirmed · Unmatched · Refunded' },
              { name: 'confirmedBy / confirmedAt', type: 'derived', notes: 'the Accounting user who confirmed — audit trail' },
              { name: 'note', type: 'text' },
            ],
          },
          {
            group: 'Accounting queue',
            items: [
              { name: 'tabs', type: 'enum', notes: 'Awaiting payment (confirmed orders, unpaid) · To confirm (recorded, unmatched) · Confirmed · To invoice' },
              { name: 'ageing', type: 'derived', notes: 'days since the order was confirmed — the chase list' },
              { name: 'bulk confirm', type: 'action', notes: 'confirm several matched payments in one pass' },
            ],
          },
        ],
        behaviors: [
          'A confirmed order appears in Accounting’s "Awaiting payment" tab with the amount and the customer’s billing details.',
          'Sales or Accounting records the payment when the customer sends a receipt → status Recorded. Nothing downstream unlocks yet.',
          'Accounting matches it against the bank statement and clicks Confirm payment → status Confirmed. This emits payment.confirmed.',
          'payment.confirmed is what enables "Issue VAT invoice" on the order. Until then the invoice action is disabled.',
          'Partial payment (50/50 terms) leaves the order Partially paid; each instalment is confirmed separately and can carry its own invoice.',
          'A payment that cannot be matched to the bank is flagged Unmatched and chased — it never silently counts as revenue.',
          'Once the gateway is wired, a signed webhook auto-creates the payment as Recorded and auto-matches it; Accounting still owns the Confirm click unless the match is exact.',
        ],
        rules: [
          'A payment applies to exactly one order (and, once issued, is linked to that order’s invoice).',
          'Only a user with the Accounting role can move a payment to Confirmed — Sales can record, not confirm. This separation is the control.',
          'Confirmed payments cannot be edited or deleted, only refunded/reversed with a reason.',
          'Total confirmed cannot exceed the order total without an explicit overpayment flag.',
          'Provisioning never reads payment status directly — it reacts to the invoice being issued (T&C clause 3 wording: payment AND invoice).',
        ],
        states: ['Awaiting payment', 'Recorded (unconfirmed)', 'Confirmed', 'Partially paid', 'Unmatched', 'Refunded / reversed'],
        backend: {
          dataModel: [
            { name: 'paymentId', type: 'uuid', required: true },
            { name: 'reference', type: 'string', required: true, notes: 'unique' },
            { name: 'orderId', type: 'uuid', required: true },
            { name: 'invoiceId', type: 'uuid?', notes: 'set when the invoice is issued against it' },
            { name: 'amount', type: 'money', required: true },
            { name: 'method', type: 'enum', required: true },
            { name: 'paidDate', type: 'date', required: true },
            { name: 'bankReference', type: 'string?' },
            { name: 'proofFileUrl', type: 'string?' },
            { name: 'status', type: 'enum', required: true, notes: 'recorded|confirmed|unmatched|refunded' },
            { name: 'recordedBy / recordedAt', type: 'uuid/timestamp' },
            { name: 'confirmedBy / confirmedAt', type: 'uuid?/timestamp?' },
          ],
          endpoints: [
            'GET /admin/crm/payments?status=&orderId=&page=',
            'POST /admin/crm/payments { orderId, amount, method, paidDate, bankReference?, proof? }',
            'POST /admin/crm/payments/:id/confirm — Accounting role only; emits payment.confirmed',
            'POST /admin/crm/payments/:id/flag-unmatched { reason }',
            'POST /admin/crm/payments/:id/refund { reason }',
            'POST /webhooks/payments/:provider — signed, idempotent',
          ],
          integrations: ['Sales orders', 'Invoices (issued after confirmation)', 'Payment gateway / bank statement (VNPay / MoMo / bank API) — reconciliation', 'Admin roles & permissions (Accounting-only confirm)'],
          notes:
            'Gateway not wired anywhere yet — signed-webhook reconciliation is the missing piece. Webhooks must be idempotent on the provider transaction id so a retry cannot double-count. Confirm is the money-truth event; keep it auditable and irreversible-except-by-refund.',
        },
        acceptance: [
          'A recorded-but-unconfirmed payment does not enable invoicing or provisioning.',
          'Only an Accounting-role user can confirm; the confirmer and timestamp are stored and shown.',
          'Confirming enables "Issue VAT invoice" on the order and updates the order’s payment state.',
          'A partial payment leaves the order Partially paid with the remaining balance correct.',
          'A replayed gateway webhook does not create a second payment.',
        ],
        openQuestions: [
          'Which VN gateway do we integrate first, or is bank transfer + manual confirmation enough at launch?',
          'Do we auto-confirm on an exact gateway match, or is a human Confirm always required?',
          'Who exactly holds the Accounting role, and does a Sales lead need visibility into it?',
        ],
      },
    },
    // 5 · Invoices ────────────────────────────────────────────────────────────
    {
      name: 'Invoices (VAT e-invoice)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'The VAT e-invoice (hóa đơn điện tử) is the closing document and, per T&C clause 3, is issued AFTER the customer has paid — not as a request for payment. Issuing it is therefore the financial close of the deal: it moves the deal to the Invoice stage, starts the 12-month activation window from its issue date (clause 4), and is the event Account management listens to in order to provision the purchased and gift services. It bills against one confirmed order and prints the billing name / address / tax code snapshotted all the way back on the quotation.',
        userStory:
          'As Accounting, I want to issue the VAT e-invoice once payment is confirmed, so that the customer gets a legal invoice and their service is released for activation.',
        uiFields: [
          {
            group: 'Invoice',
            items: [
              { name: 'invoiceCode', type: 'string', required: true, notes: 'the provider’s legal series + number, plus our internal INV-{seq}' },
              { name: 'order', type: 'ref → Sales order', required: true },
              { name: 'payment', type: 'ref → Payment', required: true, notes: 'the confirmed payment this invoice follows' },
              { name: 'billingName / billingAddress / taxCode', type: 'derived', required: true, notes: 'snapshot from the quotation — must match exactly or the invoice is legally wrong' },
              { name: 'lineItems[]', type: 'table', required: true, notes: 'from the order, gifts included at 0₫' },
              { name: 'subtotal / vatRate / vatAmount / total', type: 'derived', notes: 'VAT 8% as quoted' },
              { name: 'issueDate', type: 'date', required: true, notes: 'starts the 12-month activation window (T&C clause 4)' },
              { name: 'status', type: 'enum', required: true, notes: 'Draft · Issued · Cancelled / replaced (credit note)' },
              { name: 'providerStatus', type: 'derived', notes: 'signed / sent to tax authority / delivered to customer' },
              { name: 'pdfXml', type: 'file', notes: 'the signed e-invoice PDF + XML returned by the provider' },
            ],
          },
          {
            group: 'Invoice list',
            items: [
              { name: 'invoiceCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)' },
              { name: 'status', type: 'enum', notes: 'Draft · Issued · Cancelled / replaced' },
              { name: 'issueDate', type: 'date' },
              { name: 'activationDeadline', type: 'derived', notes: 'issueDate + 12 months — drives the "unactivated service expiring" reminder' },
            ],
          },
        ],
        behaviors: [
          '"Issue VAT invoice" is only enabled on an order with a Confirmed payment; the button is disabled and explains why otherwise.',
          'Issue → we call the licensed e-invoice provider, which signs the invoice and returns the legal number + PDF/XML; we store both and email them to the customer.',
          'Issuing emits invoice.issued, which is the trigger for: deal → Invoice stage (closed/won), customer status → New/Existing, and Account management provisioning of the purchased AND gift services.',
          'A wrong invoice is never edited — it is cancelled/replaced with a credit note and a corrected invoice, per VN regulation.',
          'The 12-month activation countdown from issueDate is tracked and surfaced as a reminder so unactivated services do not silently expire (clause 4).',
        ],
        rules: [
          'An invoice requires a confirmed payment. No payment, no invoice — this is the client’s own T&C clause 3.',
          'Billing name, address and tax code must equal the quotation snapshot; a mismatch blocks issuing rather than being auto-corrected.',
          'Gift lines appear on the invoice at 0₫ so the customer has legal record of what they receive, but contribute nothing to the VAT base.',
          'Invoice issuance is what releases provisioning — order confirmation alone never does.',
          'Issued invoices are immutable; corrections go through cancel/replace with a credit note.',
          'VAT rate printed is the rate snapshotted on the quotation, even if the State rate has since changed (T&C clause 6).',
        ],
        states: ['Blocked (payment not confirmed)', 'Draft', 'Issuing (provider call in flight)', 'Issued', 'Provider error', 'Cancelled / replaced'],
        backend: {
          dataModel: [
            { name: 'invoiceId', type: 'uuid', required: true },
            { name: 'invoiceCode / providerSeries / providerNumber', type: 'string', required: true },
            { name: 'orderId / paymentId / customerId', type: 'uuid', required: true },
            { name: 'billingName / billingAddress / taxCode', type: 'string', required: true, notes: 'snapshot' },
            { name: 'subtotal / vatRate / vatAmount / total', type: 'money/decimal', required: true },
            { name: 'issueDate', type: 'date', required: true },
            { name: 'activationDeadline', type: 'date', required: true, notes: 'issueDate + 12 months' },
            { name: 'status', type: 'enum', required: true, notes: 'draft|issuing|issued|error|cancelled' },
            { name: 'providerPayload / pdfUrl / xmlUrl', type: 'json/string' },
            { name: 'replacesInvoiceId', type: 'uuid?', notes: 'set on a corrected invoice' },
          ],
          endpoints: [
            'GET /admin/crm/invoices?status=&customer=&page=',
            'POST /admin/crm/invoices (from order + confirmed payment)',
            'POST /admin/crm/invoices/:id/issue — calls the provider; emits invoice.issued',
            'POST /admin/crm/invoices/:id/cancel { reason } → credit note',
            'POST /admin/crm/invoices/:id/resend { to[] }',
            'GET /admin/crm/invoices/:id/pdf | /xml',
          ],
          integrations: [
            'VN e-invoice provider (licensed — Viettel / VNPT / MISA meInvoice etc.)',
            'Payments (the required predecessor)',
            'Sales orders',
            'Account management — consumes invoice.issued to provision products/quota and the public company page',
            'Email — deliver the signed PDF/XML',
          ],
          notes:
            'invoice.issued is the most important event in the module: it closes the deal, flips customer status, and releases provisioning. Make it transactional and replay-safe — a provider timeout must not produce two legal invoice numbers.',
        },
        acceptance: [
          'Issuing is impossible until a payment is confirmed, and the UI says why.',
          'An issued invoice carries the exact billing name / address / tax code from the quotation.',
          'invoice.issued moves the deal to the Invoice stage, updates customer status, and triggers provisioning of both purchased and gift services.',
          'activationDeadline is issueDate + 12 months and drives an expiry reminder.',
          'A corrected invoice is a cancel/replace pair, never an edit.',
        ],
        openQuestions: [
          'Which licensed VN e-invoice provider do we integrate?',
          'Do we ever issue a proforma / payment request document before payment, or is the order + bank details enough?',
          'For 50/50 terms, one invoice per instalment or a single invoice on final payment?',
        ],
      },
    },
    // 6 · Contracts ───────────────────────────────────────────────────────────
    {
      name: 'Contracts',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'The signed agreement tied to a customer, with a value and a start/end validity window; possibly e-signature + document storage.',
        userStory: 'As sales ops, I want to record contracts and their validity so that we know which customers are under active agreement.',
        uiFields: [
          {
            group: 'Contract list',
            items: [
              { name: 'contractCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'value', type: 'money (₫)' },
              { name: 'status', type: 'enum', notes: 'Draft · Active · Expired' },
              { name: 'start / end', type: 'date range' },
            ],
          },
        ],
        behaviors: ['Draft → Active on signing; auto-flips to Expired past the end date.'],
        rules: ['A contract belongs to one customer.', 'Active contracts drive renewal reminders.'],
        states: ['Draft', 'Active', 'Expired', 'Up for renewal'],
        backend: {
          endpoints: ['GET /admin/crm/contracts', 'POST /admin/crm/contracts', 'GET /admin/crm/contracts/:id'],
          integrations: ['E-signature provider (optional)', 'Document storage (optional)'],
        },
        acceptance: ['Contracts track validity and flip to Expired past the end date.'],
        openQuestions: ['Do contracts need e-signature and document storage, or just record-keeping?'],
      },
    },
  ],
}
