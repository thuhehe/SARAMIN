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
 * Also here: the sales back office (Quotations → Sales order/PO → Payments →
 * VAT e-invoice, plus Contracts). One document chain, each step created from the
 * one before it and never retyped:
 *
 *   Quotation (Báo giá, 1–3 options)   Sales, QUO-xxxxxx-MM-YYYY
 *        │ customer picks one option
 *        ▼
 *   Sales order / PO  ── sent to the customer ──▶ deal = PO (won)
 *        │ Accounting: awaiting payment
 *        ▼
 *   Payment  ── Accounting confirms against the bank ──▶ unlocks invoicing
 *        │
 *        ▼
 *   VAT e-invoice issued ──▶ deal = Invoice (closed) · customer status New→Existing
 *                            · 12-month activation window starts
 *                            · Account management provisions products + gifts
 *
 * The order is payment-before-invoice on purpose: the client's own terms say
 * "the service will be activated after the customer completes the payment & the
 * invoice is issued" (T&C clause 3 of the client’s source PDF EST-009909-07-2026). Field names and the
 * document layout in ./crm.ts Quotations are modelled on that live PDF.
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
      warn: 'DECIDED: the UI does not distinguish chi nhánh from công ty con. Every link is labelled “Công ty con”. The split was derived from the tax code and changed nothing a rep could act on — a branch and a subsidiary are both separate customers with their own MST, quota, contracts and invoices, which is the only fact the screen needs to convey. The legal difference (a branch is an đơn vị phụ thuộc with no legal personality, so it cannot own another company) still holds and can be reinstated as a validation rule if a real case demands it; it is not shown as a label. Companies sharing the 10-digit tax root are still surfaced FIRST in the link picker and badged “cùng gốc MST” — the same signal, offered as a suggestion instead of a taxonomy.',
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
          ['Sales order / PO', 'PO-{seq6}-{MM}-{YYYY}', 'PO-005864-07-2026', 'Yes'],
          ['Invoice — internal', 'INV-{seq6}-{MM}-{YYYY}', 'INV-003390-07-2026', 'Yes'],
          ['Invoice — legal series', 'Issued by the e-invoice provider', '1C26TAA/0041', 'Yes — required by law'],
          ['Customer’s own PO no.', 'Free text, recorded exactly as they give it', 'PO-VP/2026/044', 'Theirs, not ours'],
        ],
      },
      items: [
        'Every number is system-assigned and never editable, except the customer’s own PO number, which is typed in as given.',
        'A company gets its CO- id the moment the record is created — a lead has one before it is ever a customer, and it never changes through lead → customer → churn → win-back.',
        'Sequential numbers DO leak volume: a customer holding QUO-009909 can infer roughly how many quotations we have issued, and two documents dated a month apart reveal the rate. That is accepted for documents and unavoidable for the legal series.',
        'The quotation number leaks the most, because quotations go to every prospect — including ones comparing us with a competitor — while invoices only go to customers. It is also the one number with **no** legal constraint, so it is the only one we could scramble if the client wants to.',
      ],
      warn: 'Resolved — all three documents share one shape, {PREFIX}-{seq6}-{MM}-{YYYY}, and the prefix alone says which document it is: QUO- quotation, PO- sales order, INV- VAT invoice. The client’s live system numbered the sales order INV-…, which collided with the tax invoice; migrating existing PO records to PO- is a data task to plan, not a format question.',
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
      label: 'Status colour — red is reserved for “act today”, never for a lifecycle state',
      text: 'A company row already carries several signals at once, so colour has to mean one thing. red belongs exclusively to things a rep must act on today. A customer status describes what a company **is** — it is never itself an alarm.',
      table: {
        cols: ['Colour', 'Reserved for', 'On a company row'],
        rows: [
          ['🔴 Red', 'ACT TODAY', 'Idle past its red threshold · ⚠ lapsed quotation · “Never contacted” · Do not contact'],
          ['🟡 Amber', 'Attention, not alarm', 'Customer status Churn · idle in its amber band'],
          ['🟢 Green', 'Healthy', 'Customer status Existing'],
          ['⚪ Grey', 'Nothing has happened yet', 'Customer status New (never bought) · “—” where a value does not apply'],
        ],
      },
      items: [
        'Churn is deliberately amber, not red. It is a factual state (no new order in 12 months), and commercially it is an opportunity — a churned customer is the warmest win-back lead in the system. Red would read as “broken, avoid”, which is the opposite of the intended action.',
        'The urgency signal lives in Idle and in the “Needs attention” filter, never in the status pill. Status says what they are; idle says what you must DO. Keeping those on separate channels is what lets a rep read a row at a glance.',
      ],
      warn: 'If red ever appears on more than one kind of thing, it stops meaning “act today” and the whole row becomes unreadable. Any new red must displace an existing one, not join it.',
    },
    {
      label: 'Quote-to-cash — one document chain, each step created from the previous',
      text: 'Nothing is retyped between steps, and nothing is provisioned before the invoice. The invoice is the only event that turns money into product — and it does so immediately.',
      table: {
        cols: ['Step', 'Who', 'Produces', 'Effect'],
        rows: [
          ['Quotation', 'Sales', 'Bilingual PDF, 1–3 options, QUO-xxxxxx-MM-YYYY', 'Deal → Proposal · expires end of month'],
          ['PO', 'Sales', 'PO + payment request; can hold the customer’s own PO no. + file', 'Deal → PO (won) · PO is Active · expires end of month'],
          ['VAT e-invoice', 'Kế toán', 'Invoice issued against the PO', 'Deal closed · New → Existing · **products provisioned immediately** · 12-month clock starts'],
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
      label: 'Issuer identity — one setting, every document (System → Company information)',
      text: 'Everything about US that prints on a selling document is configured in one place, never typed per document and never hard-coded in a template. That covers the letterhead the customer sees first — logo, VN + EN legal name, VN + EN address, website — plus the issuer tax code, the VAT rate, the numbering formats and the bank details. Retyping any of it per quotation guarantees the same company eventually appears three different ways across three documents, and a change of office means editing every template.',
      table: {
        cols: ['Setting', 'Prints on', 'Why it must be central'],
        rows: [
          ['Logo + VN/EN legal name + VN/EN address + website', 'Letterhead of quotation, sales order, invoice', 'The block the customer reads first. Both languages always print, exactly as on the client’s source PDF EST-009909-07-2026.'],
          ['Issuer tax code (MST)', 'Sales order, VAT e-invoice', 'Ours, not the customer’s — the two are adjacent on the page and easy to confuse.'],
          ['VAT rate (currently 8%)', 'Every option total, every invoice', 'A State rate change (T&C clause 6) is then one edit, not a code release.'],
          ['Quotation validity (end OF month) · discount-approval threshold (20%)', 'Expiry date · the Send gate', 'Sales policy, so it belongs to sales ops rather than to engineering.'],
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
          ['Numbering', 'Our own series — PO-005864-07-2026', 'The provider’s legal series — e.g. 1C26TAA/0041, gapless, government-controlled'],
          ['Editable', 'no — re-issue a new PO instead', 'never — fix by cancel + credit note + re-issue (VN regulation)'],
          ['Expires', 'end of the month it was issued in', 'never — an issued invoice is permanent unless cancelled'],
          ['Timing', 'first — the commitment', 'may be issued before OR after the money lands, whichever the customer needs'],
          ['Owner', 'Sales', 'Kế toán only'],
          ['Effect', 'Deal = won', 'Deal closed · customer status → New · **products provisioned immediately** · 12-month activation clock starts'],
        ],
      },
      items: [
        'One line: the PO says “you agreed to buy this, please pay”. The invoice says “you paid, and here is the document the tax office recognises”.',
        'The PO carries “Ngày xuất hóa đơn” and “Hạn trả”, so it is really acting as a proforma (payment request) rather than a pure purchase order — a legitimate VN pattern. The prefix now keeps the two apart: the proforma is PO-…, the tax invoice INV-…. The client’s live system numbered the PO INV-…, so existing records need migrating.',
        'The PO’s “Ngày xuất hóa đơn” is a planned date. The VAT invoice’s issue date is a fact — and it is the one that starts the activation window (clause 4). Reports must read the invoice date, never the PO’s.',
      ],
    },
    {
      label: 'Who acts at each step — Sales vs Kế toán',
      text: 'Sales owns everything up to the commitment. Accounting owns everything about money and tax. The handover is exactly at step 7, and it is a control, not an inconvenience.',
      table: {
        cols: ['#', 'Who', 'Action', 'What it unlocks'],
        rows: [
          ['1', 'Sales', 'Send the quotation (1–3 options)', 'Deal → Proposal'],
          ['2', 'Sales', 'Record which option the customer accepted', 'Enables Issue PO'],
          ['3', 'Sales', 'Issue the PO from that one option, with bank details', 'PO is Active · deal = won (deal → PO stage) · provisions nothing'],
          ['4', 'Sales', 'Attach the customer’s own PO number / file, if their procurement issues one', 'Evidence only — never a status'],
          ['5', 'Kế toán only', 'Issue the VAT e-invoice on the PO', 'Deal closed · status → New · **products provisioned immediately**'],
          ['6', 'System', 'Provision the purchased **and** gift services on invoice.issued', 'Customer can post a job / open a CV at once'],
          ['7', 'Sales or Kế toán', 'Record the payment when a receipt arrives', 'nothing — this is the trap'],
          ['8', 'Kế toán only', 'Confirm the payment against the bank statement', 'Closes the receivable. It does not gate anything upstream'],
          ['9', 'Kế toán only', 'Cancel the PO, if the invoice went out first and the money never came', 'Invoice withdrawn · quota clawed back'],
          ['—', 'System', 'Expire any PO still Active at the end of its month', 'PO → Expired · no invoice possible'],
        ],
      },
      items: [
        'Step 7 ≠ step 8. Someone seeing a transfer receipt is not the money being in the bank. Recording is anyone; confirming is Accounting matching the bank statement. The split still matters for the receivables ledger even though it no longer gates the invoice.',
        'Steps 5, 8 and 9 are Accounting-only — not because Sales is untrusted, but because the person whose target depends on the deal closing must not be the person who releases the product.',
        'Note what moved: the product is now released at step 5, before the money is verified at step 8. That is a deliberate trade for the customers who cannot pay without an invoice, and step 9 is the compensating control.',
        'The UI offers exactly one primary action at a time rather than a row of independent toggles, and every transition is enforced server-side.',
        'Exception — customer never pays and no invoice went out: the PO expires at the end of its month. It is not “Lost” — the deal was won; chasing it is a receivables problem owned by Accounting.',
        'Exception — customer never pays and the invoice already went out: **Kế toán** cancels the PO, which withdraws the invoice and the quota with it. This is the only cancel path.',
        'Exception — wrong invoice: Accounting cancels + issues a credit note + re-issues. Never an edit.',
      ],
    },
    {
      label: 'Provisioning — what actually happens when the invoice is issued',
      text: 'Provisioning is the moment a line item becomes usable balance on the customer’s account. It is the only step where a document turns into product, it runs on invoice.issued — **immediately**, with no queue and no second click — and it lives in Account management; CRM never writes quota directly.\n\nWhat the customer sees the instant it runs: the products appear on their company detail page, and they can post a job and open CVs. Nothing else in the chain grants any of that.',
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
        '**Provisioning ≠ activation** — two events, two clocks, and T&C separates them. Provisioning (clause 3): quota lands in the account when the invoice is issued; nothing is running yet. Activation (clause 4): the customer uses a slot, which must happen within the window declared on that PRODUCT — 12 months by default, 3 on the trial posting — counted from the invoice date, or the unused quota expires. Usage (clause 5): once activated, that posting runs 30 days.',
        'So a customer can buy 10 slots today, use one next week and one in eight months. Provisioning granted all ten at once; each activates separately and burns its own 30-day window. The Invoice list’s “Activate by” column is invoice date + the product’s own activation window — see Products & Packages → Products management.',
        '**Idempotency** (the most likely production bug in the whole chain): invoice.issued can fire twice — an e-invoice provider timeout followed by a retry is normal. Provisioning must be keyed on the invoice ID, or the customer silently receives double quota.',
        '**Reversal** — now a designed path, not a corner case, and still unanswered: cancelling a PO withdraws an invoice that has already provisioned. What happens to quota partly consumed? Options: claw back the unused portion · leave it and reconcile on the credit note · block cancellation once any quota is consumed. **This blocks build** — the cancel button exists precisely for the invoice-before-payment case, so the claw-back rule will be exercised.',
      ],
    },
    'One company record throughout: created in the CRM with customer status New. It has no login and is invisible to jobseekers until it is activated. No duplicate company records.',
    'On invoice issued (not on PO), hand off to Account management: create account → provision products/quota → company page for Job Posting. It runs immediately and it is the only trigger. Activation of an individual slot then follows the customer’s own use, inside the Account management module.',
  ],
  features: [
    // 0 · Companies ───────────────────────────────────────────────────
    {
      name: 'Companies',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'crm-customer',
      detail: {
        requirements: [
        {
          label: 'Global company search — one box in the shell, reach without browse',
          text: 'The admin shell carries a single search box in the top bar, on every page: **Search any company — name, tax code, company ID**. It answers a question a rep asks from wherever they happen to be — does this customer already exist, and where? — without first navigating to Companies.\n\nIt is deliberately **unscoped**: it searches every company in the system, not the signed-in rep\u2019s book. A rep who cannot find a customer because a colleague owns it creates it again, and a duplicate MST costs far more than the privacy of a company name.',
          table: {
            cols: ['Aspect', 'Rule'],
            rows: [
              ['Where', 'Admin shell top bar, between the breadcrumb and the page actions. Present on every screen, not only on Companies.'],
              ['Shortcut', '⌘K / Ctrl-K focuses it from anywhere. ↑↓ move, ↵ opens, Esc closes. The shortcut is printed in the box.'],
              ['Searches', 'Company name (short + legal), tax code (MST), Company ID, website domain, and the contact person\u2019s **name**.'],
              ['Does not search', 'The contact\u2019s job title and the city — “Trưởng phòng HC-NS” and “HCMC” sit on nearly every record, so matching them turns search into a way to page through everyone\u2019s book.'],
              ['Minimum query', '2 characters. Below that the box explains what it accepts rather than returning half the database.'],
              ['Result cap', 'Top 7, with the total shown (“7/11 results”) and a prompt to refine. There is no “see all”, and no listing — reach, never browse.'],
              ['Each result shows', 'Company name · customer status · pipeline status (if a deal is open) · Company ID · MST · sales owner, marked “(you)” when it is the searcher\u2019s own.'],
              ['No match', 'Says so explicitly and states that every company was checked, including other reps\u2019 — this is the line that stops a rep creating a duplicate.'],
              ['Opening a result', 'Switches to CRM → Companies and opens that company. The breadcrumb reads Companies / {company} and Back returns to the Companies list — not to the page the search was used from.'],
              ['Scope', 'Companies only. A quotation, PO or invoice is always reached through its company; a box that answers with four kinds of record forces the user to read every row before acting on any of them.'],
            ],
          },
          items: [
            'The Companies list keeps its own search — that one narrows a list the rep is already looking at, and still shows out-of-book matches in a dropdown. The two are not duplicates: one filters, the other locates.',
            'Reaching a colleague\u2019s company is a **read**, not a hand-over. Ownership does not change, and the record opens without any claim on it.',
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
          items: [
            'WHY this AND not just 7 random base32 chars: it **is** 7 Base32 chars — capacity was never in question. The point is what the seven are. one of them is a check character (catches a mistyped ID before it opens the wrong company); the other six are the database key run through a reversible scramble, not random. That buys two things random codes cannot: uniqueness BY construction (no unique-index clash, no collision-and-retry loop on insert) and a code that decodes straight back to the row. Seven random chars would instead need a collision check + regenerate loop, and give zero typo protection unless you still reserve a check char — at which point it is this scheme with a worse failure mode. So this is not "more than 7 letters"; it is those 7 letters, chosen so they can never collide and a fat-finger is rejected.',
            'ALPHABET (Crockford Base32, 32 symbols, uppercase): 0 1 2 3 4 5 6 7 8 9 A B C D E F G H J K M N P Q R S T V W X Y Z — note I, L, O and U are absent, so 1/I/l and 0/O can never be confused.',
            'WORKED examples — internal key → company ID (a developer can test an implementation against these exact values): 1 → CO-1mqjxe4 · 2 → CO-33tzvks · 3 → CO-4jycsrg · 1042 → CO-Y2fky36 · 999,999 → CO-9BJ7V4W · 12,345,678 → CO-ZWH0QF9. Consecutive keys land far apart, which is what hides the customer count.',
            'VALIDATION examples — CO-Y2fky36 accepted · y2fky36 accepted (lowercase + prefix optional) · CO-Y2fky3Z rejected (check character fails, a typo must never resolve to another company) · CO-Y2fky36 with O typed for 0 accepted (I/L→1, O→0, U→V are folded on input).',
            'ALGORITHM: payload = base32( (key × 0x2F1B3C5 + 0x5A17E9) mod 2^30 ), 6 chars, zero-padded left. The multiplier is odd, so it is invertible mod 2^30 — that is what makes decoding possible AND guarantees no two keys ever collide. Check char = alphabet[ Σ(index(payload[i]) × (i+2)) mod 32 ].',
            'Reference implementation with tests already exists: src/lib/companyId.ts — companyId(key) and parseCompanyId(code).',
            'CAPACITY: 32^6 − 1 = 1,073,741,823 companies (~1.07 billion). For scale, Vietnam has roughly 1 million active registered enterprises, so this is about 1,000× the entire national market.',
            'Uniqueness is by construction, not by luck: the encoding is a bijection over the key space, so two different keys can never produce the same ID. There is no collision check to get wrong and no retry loop.',
            'The payload is scrambled (multiply by an odd constant mod 2^30) so consecutive companies land far apart. An ID therefore does not reveal how many companies exist, and nobody can guess the next one.',
            'Input is tolerant, output is strict: lookups are case-insensitive, the CO- prefix is optional, and I/L→1, O→0, U→V are folded — but a bad check character is rejected, never resolved to a different company. Stored and displayed always uppercase.',
            'The tax code (MST) stays a separate field and remains the business de-duplication key — it is a government identifier we do not control, so it is never the primary ID.',
          ],
          warn: 'The ID is immutable. Never re-issue, re-sequence or “tidy up” company IDs — quotations, orders, invoices, contracts and audit-log entries all reference it, so changing one silently breaks the paper trail.',
        },
        {
          label: 'Company ID — where it is actually used',
          text: 'The ID is a lookup key rather than something a rep reads all day, but it has to be visible where a row must be identified or quoted back: support is given an ID and has to land on the record, and an export has to join on it.',
          table: {
            cols: ['Surface', 'Shown?', 'Why'],
            rows: [
              ['Company detail — header', 'Yes', 'Confirms you are on the right record; the string support quotes back'],
              ['Company detail — Basic info, first row', 'Yes', 'Copyable field, next to legal name and MST'],
              ['Companies list — search box', 'Searchable', 'Paste an ID and the row is found'],
              ['Companies list — as a column', 'Yes — next to the company name', 'So a rep can read back the ID of a row they are looking at, and match it against an export or a support ticket without opening the record. Rendered small and monospaced so it stays a reference, not a thing to scan by.'],
              ['Record URL', 'Yes — /companies/CO-P9FCEPD', 'Shareable, and does not leak a sequential database key'],
              ['Exports (csv / Excel)', 'Yes', 'The join key when the client reconciles our data against theirs'],
              ['Quotation / PO / invoice PDFs', 'NO', 'Documents identify the customer by legal name + MST — those are the legally meaningful fields'],
            ],
          },
          items: [
            'Search must match the ID even though no cell prints it — the search box says “company ID”, so it has to be true. Same for MST, legal name and the contact’s name.',
            'Search input is forgiving: lowercase, missing CO- prefix, and I/L→1 O→0 U→V folded — because the ID usually arrives pasted from an email or read out over the phone.',
          ],
        },
        {
          label: 'Company detail — Basic info card: what belongs here, and how it is edited',
          text: 'One card holds the company identity. Everything about people lives on the Contacts tab and everything about what they bought lives on Products & billing — so no contact name, email or phone appears on this card. A “primary contact” copy here would be a second place to update and would drift from the Contacts tab within a week.',
          table: {
            cols: ['Field', 'Editable', 'Input', 'Note'],
            rows: [
              ['Company ID', 'never', '—', 'System-assigned at creation, permanent.'],
              ['Legal name', 'Yes', 'Text', 'Required. As written on the MST registration.'],
              ['Short name', 'Yes', 'Text', 'Optional. Empty falls back to the legal name everywhere.'],
              ['Tax code (MST)', 'Yes', 'Text', 'Duplicate check on save — see the MST edge case.'],
              ['Công ty mẹ', 'Yes', 'Select — company', 'The direct parent only. Empty = standalone or group root.'],
              ['Industry', 'Yes', 'Select — Master data', 'Its own field, not joined to size.'],
              ['Company size', 'Yes', 'Select — band', 'Its own field: the two are filtered separately.'],
              ['Company tags', 'Yes', 'Tag picker', 'Editorial labels, many per company.'],
              ['Quốc tịch / Country', 'Yes', 'Select — Master data', 'Gates the province field below.'],
              ['Tỉnh / Thành phố', 'Yes', 'Select — VN provinces', 'Shown only when country = Việt Nam.'],
              ['Address', 'Yes', 'Text', 'Required for every country — it prints on the documents.'],
              ['Website', 'Yes', 'Text', 'Sits after address. Read mode renders it as a link.'],
              ['Lead source', 'Yes', 'Select — Master data', 'How the company first reached us.'],
              ['Sales owner', 'Yes', 'Select — user', 'Reassignment is an audited change.'],
              ['Products interested', 'Yes', 'Checkboxes', 'Pre-sale intent. What they actually bought is a different fact, on Products & billing.'],
              ['Estimated deal value', 'Yes', 'Number (₫)', 'The rep’s own estimate; the quotation total supersedes it.'],
              ['Description', 'Yes', 'Text', 'Free notes about the company.'],
            ],
          },
          items: [
            'one Edit toggle for the whole card, not a pencil per row: Edit turns every editable row into its input, Cancel reverts all of them, Save writes all of them. Fourteen independent inline editors is fourteen chances to leave one half-saved.',
            'Read mode shows a placeholder, never a blank: Short name shows “— (falls back to the legal name)”, Công ty mẹ shows “— (không thuộc tập đoàn nào)”, and for a non-Vietnamese company the province row reads “— (không phải công ty Việt Nam · xem Address)”.',
            'The card and the New-company form must expose the same field set. When one gains a field, the other gains it in the same change — a field that can only be set at creation, or only after, is a data hole.',
            'Every save is audited: field, old value, new value, who, when. Sales owner, tax code and country changes are the ones support will need to trace.',
            'COMPANY TAGS ARE CROSS-CHECKED AGAINST THE OPEN JOBS. A tag that makes a claim a posting can contradict — “Có vị trí làm việc từ xa” being the clear case — shows a non-blocking warning when NO open job of that company has the matching `job_type` (remote). The tag is a company-level editorial label by decision, which is exactly why it can go stale: nothing about closing the last remote job removes it. Warn, never block — the company may be about to post one.',
          ],
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
          label: 'MST lookup — auto-fill from the tax authority',
          text: 'Once 10 digits are entered, a “Tra cứu” button queries the Vietnamese tax registry and fills legal name, registered address and business line. It is a convenience, not a gate: every field it fills stays editable, and the form saves with or without it.',
          items: [
            'The registered address is the registered office, which is frequently not where the people work. The rep must be able to overwrite it — a locked auto-filled address would put the wrong address on every invoice.',
            'The lookup must never block the save: if the service is down, slow, or returns nothing, the rep types the fields by hand and carries on. Show the failure, do not trap the form.',
            'Only fill empty fields. Re-running the lookup must not silently overwrite something the rep has already corrected.',
            'Record which fields came from the lookup and when, so a later mismatch can be traced to the source.',
          ],
          warn: 'Feasibility is an open question for the BA. There is no free, official, guaranteed public API — data comes from commercial providers (invoice/e-signature vendors such as VNPT, Viettel, MISA, or resellers of the General Department of Taxation feed), and terms, cost, rate limits and uptime vary. Decide: paid provider, or drop the button. Build the form so the answer changes one call, not the flow.',
        },
        {
          label: 'New company is a page, and what it asks for',
          text: 'Creating a company is a screen of its own, not a dialog: it is long enough to need the whole viewport, it can be linked to and reloaded, and it is reached three ways — “+ New company” on the list, “+ New lead” on the pipeline, and “+ Thêm công ty con” on a company record (which locks the parent). Four sections, in this order.',
          table: {
            cols: ['Section', 'Holds', 'Required in it'],
            rows: [
              ['Company information', 'Legal name, short name, MST (+ lookup + affiliate list), industry, size, tags, country, province, address (+ map picker), website', 'Legal name · Tax code (MST)'],
              ['Company verification document', 'Business licence / tax registration / signed contract upload', 'None at creation — see below'],
              ['Primary contact', 'Name, title, phone, email', 'Name · Phone · Email'],
              ['Sales', 'Lead source, sales owner, products interested, estimated value, description', 'None'],
            ],
          },
          items: [
            'Phone AND email are both required on the primary contact: a contact nobody can reach is not a contact, and one channel is not enough when the other bounces.',
            'The Company ID is assigned on save and is not mentioned on the form — a field the rep can neither fill nor change is noise while they are filling one in. It appears on the record afterwards.',
            'Address gets an optional “Chọn trên bản đồ” picker storing coordinates alongside the typed text. Sales use the pin to find the office; the documents always print the typed address, never the map’s.',
            'The form and the Basic-info card on the record must expose the same field set — a field that can only be set at creation, or only after, is a data hole.',
          ],
        },
        {
          label: 'Company verification document',
          text: 'The document that proves the tax code belongs to them — business licence (giấy phép kinh doanh), tax registration certificate, or a signed contract. Uploaded on the create page, and again at any time from the company record.\n\nA document has **no** status. It is on the record or it is not, and the file list already says which — a per-file Chờ duyệt / Đã duyệt badge added a second state to read without adding anything to act on, and it implied a review queue with no owner and no screen.',
          table: {
            cols: ['Stage', 'Rule'],
            rows: [
              ['At creation', 'Optional. Requiring it here would block a rep entering a lead they just met at an event.'],
              ['Selling — quotation, PO', 'Optional. Warn, do not block.'],
              ['Issuing the VAT e-invoice', 'required to be on file. This is the point where the tax identity has to be real.'],
            ],
          },
          items: [
            'Several files per company. A licence can be superseded when the company re-registers; the old one stays for the audit trail rather than being replaced.',
            'PDF / jpg / png, 10MB per file.',
            'The card shows the file count, the files themselves, and — when there are none — one warning that invoicing will be blocked. Nothing else.',
          ],
        },
        {
          label: 'Công ty con — the UI, in both directions',
          text: 'The parent/subsidiary relationship is stored once, as parentCompanyId on the child, pointing at its direct parent. There is no “subsidiaries” list to maintain on the parent — that side is derived by querying children.\n\nSo the create form has a “Công ty mẹ” field and deliberately NO “công ty con” field. A subsidiary field would be a second way to write the same relationship, and the two would eventually disagree; it is also usually unfillable, because when a parent is being created its subsidiaries are not records yet. The parent → child direction is an action, not a field: “+ Thêm công ty con” on the parent record opens this same form with the parent pre-filled and locked.',
          table: {
            cols: ['Case', 'Where it is done', 'Screen'],
            rows: [
              ['Create a subsidiary — from the subsidiary', 'New-company form → Công ty mẹ (tuỳ chọn)', 'A subsidiary is created exactly like any other company; picking a parent is one field on the same form.'],
              ['Create a subsidiary — from the parent', 'Company detail → Công ty liên kết → + Thêm công ty con', 'Opens the same New-company form, titled “Thêm công ty con”, with Công ty mẹ pre-filled and locked (shown as a fixed row, not a picker). This is the answer to “where is the công ty con field” — it is an action, not a field.'],
              ['Attach or move an existing company', 'Company detail → Công ty liên kết → 🔗 Gán quan hệ mẹ / con', 'A modal that works in either direction: “công ty này là công ty con của …” or “… là công ty mẹ của …”. It searches by name / MST / Company ID, lists companies sharing the 10-digit tax root FIRST with a “cùng gốc MST” badge, previews the resulting mẹ → con pair, and warns when the target already has a parent (saving moves it out of its current group). Whichever direction is chosen, the write is the same one field on the child.'],
              ['Detach a company from its group', 'Company detail → Basic info → Edit → Công ty mẹ → clear', 'Clearing the field is what detaches; there is no separate “remove from group” action.'],
              ['See a company’s parent', 'Company detail → Basic info → Công ty mẹ', 'One row, links to the parent record.'],
              ['See a company’s subsidiaries', 'Company detail → “Công ty liên kết — Affiliated companies”', 'derived from the children — never typed. Shows the group tree with each member’s status.'],
              ['See a whole group at once', 'Companies list → click a group tag', 'A banner appears (“🏢 Tập đoàn …”) and the list narrows to that group at every level, across sales owners, with a “Bỏ lọc” to clear it.'],
            ],
          },
          items: [
            'Nothing is inherited down the tree: each entity has its own tax code, account, quota, membership tier and sales owner, and a subsidiary can never spend its parent’s quota.',
            'A company may not be its own ancestor — reject a parent choice that would create a cycle, at any depth.',
            'The parent picker excludes the company itself, and the list is searchable: with 5,000 companies a plain dropdown is unusable.',
            'The Công ty liên kết card renders on every company, including a standalone one with no parent and no children, so there is always a way to start a group. It carries no “Đứng độc lập” badge, though — a company with no group is the normal case, and labelling the default state is noise.',
            'Both directions are offered on that card, and they are not symmetrical: “+ Thêm công ty con” creates a record (the subsidiary does not exist yet), while “🔗 Gán quan hệ mẹ / con” only links an existing one. Either way, the value written is parentCompanyId on the child.',
            'The link modal must preview the outcome before saving — which record becomes the parent and which the child. A rep should never have to work out which of the two records is the one being edited.',
            'The candidate list is cycle-filtered on both directions: choosing a parent excludes anything already under this company, choosing a child excludes any of its ancestors. Enforced server-side too, not just by hiding rows.',
          ],
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
          text: 'The status exists to stop wasted outreach and compliance mistakes, so every value answers “what do I do about this person now?”. Two situations that lead to the same action are one status — the sub-reason goes in the note, where a human reads it.',
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
          items: [
            'Collapsed on purpose: "on leave" and "asked us to come back" both mean wait, so they are one status (Paused). "Left", "retired" and "moved department" all mean find the successor, so they are one status (No longer here). "Never verified" and "email now bouncing" both mean fix the details (Needs verifying). Nine statuses that produced five behaviours were five statuses wearing costumes.',
            'No longer here surfaces a “Find successor” action, and can carry where they went — the person who bought from us is now buying for someone else, which is the cheapest warm lead in the system.',
            'A company with no Active contact is a silent churn risk and belongs in Needs attention, whatever its revenue looks like.',
            'Paused requires a resume date; without one it is just a rep avoiding a call.',
            'Do not contact suppresses automated email as well as manual outreach (PDPA-style consent withdrawal) and cannot be cleared by a rep alone.',
            'A contact is never hard-deleted — status is what changes, so the history of who we dealt with stays intact.',
          ],
        },
        {
          label: 'Contact flags — the role a contact plays, separate from their status',
          text: 'Status says whether we can reach the person; flags say what they are for. A company usually needs two different people on the paperwork, so both flags are set independently.',
          table: {
            cols: ['Flag', 'Who it usually is', 'What the system does with it'],
            rows: [
              ['primary (exactly one)', 'The HR Manager / buyer', 'Quotations and orders are addressed to them; they are the contact shown on the company row'],
              ['BILLING', 'Kế toán trưởng — often never speaks to Sales', 'Receives the VAT e-invoice and payment chasing'],
              ['◆ Decision maker', 'Director / CFO who signs off', 'Read-only marker for the rep — no automation hangs off it'],
            ],
          },
          items: [
            'primary and billing are frequently different humans — an invoice sent to the buyer instead of the accountant is a real cause of late payment.',
            'The company Overview shows a People summary (contacts + login users, with the unreachable count); the full two lists live on the record’s “Contacts & users” tab.',
          ],
        },
        {
          label: 'Quốc tịch (country) — and the address fields it gates',
          text: 'Quốc tịch is the country the company is registered in, not where its office happens to be. It is asked on the New-company form and shown on the company record, and it decides whether the Vietnamese province picker appears at all. The country list is Master data (System → Master data → Country), never free text.',
          table: {
            cols: ['Field', 'Vietnamese company', 'Foreign company', 'Source'],
            rows: [
              ['Quốc tịch / Country', 'Việt Nam (the default)', 'Any other country', 'Master data → Country'],
              ['Tỉnh / Thành phố · City', 'required — pick a province', 'Not shown at all', 'Master data → Locations (63 provinces)'],
              ['Address', 'required — số nhà, đường, phường/xã, quận/huyện', 'required — street, city, postal code, country', 'Free text'],
            ],
          },
          items: [
            'Address is asked for every country — a quotation, order, invoice and contract all print it, so it can never be optional.',
            'A foreign company writes its city into the address, because a province dropdown of Vietnamese provinces cannot express “Seoul” or “Singapore”. The form says so explicitly rather than leaving an unusable empty picker on screen.',
            'The Companies list Location column and its Location filter read the Vietnamese province. A foreign company therefore has no city to group by — that is expected, not missing data.',
            'Quốc tịch is a property of the company, not of a contact or a job. A Korean-owned company registered in Vietnam is Việt Nam; use the Company tag “Korean company” for the ownership angle, which is a separate, editorial fact.',
          ],
          warn: 'Do not infer the country from the tax code or the address. MST only exists for Vietnamese entities, and an address string is not parseable — so quốc tịch is always an explicit choice.',
        },
        {
          label: 'Company name — what is displayed vs what is stored',
          text: 'A company stores a legal name and an optional short (brand) name. Every list and card shows the short name, falling back to the legal name when it is empty — one rule, so the same company never reads two different ways on two screens.',
          table: {
            cols: ['Surface', 'Shows', 'Falls back to'],
            rows: [
              ['Companies list', 'Short name', 'Legal name'],
              ['Pipeline board card', 'Short name', 'Legal name'],
              ['Company detail header', 'Short name', 'Legal name'],
              ['Quotation / order / invoice', 'legal name always', '— (never the short name)'],
            ],
          },
          warn: 'Documents are the exception and must use the legal name: a quotation, order or VAT invoice is a legal instrument, so “Tiki” is never acceptable where “Công ty TNHH tiki” is required.',
        },
        {
          label: 'Customer status values — exactly three',
          text: 'Driven by the invoice, not the order. New means “has never bought anything from us”, so every company starts there the moment it is created — there is no separate Prospect status.',
          table: {
            cols: ['Status', 'Means', 'Moves in when', 'Rule'],
            rows: [
              ['New', 'Has never bought from us — no VAT e-invoice has ever been issued', 'Created in the CRM', '**System** sets this at creation — **Sales** never picks it, and there is no field to. Leaves only when **Kế toán** issues the first VAT e-invoice; never on a sent quotation or a confirmed order alone. → Next action: **Sales** quotes them.'],
              ['Existing', 'Has paid at least once — active paid service or a past order', 'First VAT e-invoice issued', '**System** flips it on invoice.issued. One-way: a win-back after Churn returns here, never to New. **Sales** may override only with a reason, and **System** logs the override. → Next action: **Sales** works the renewal before the 12-month clock runs out.'],
              ['Churn', 'Lapsed — win-back candidate', 'No new order for 12 months since the last invoice', '**System** sets this 12 months past lastInvoicedAt with no new order — nobody clicks it. The same record looping back; a won win-back returns it to Existing, never a new record. → Next action: **Sales** runs the win-back on the quarterly churn cadence.'],
            ],
          },
          items: [
            'Churn is the same record looping back for win-back, never a new company. A won win-back returns it to Existing, never to New — “never bought” can only ever be true once.',
            'New is not a synonym for “no login”. Whether an account exists is a separate fact (accountId), driven by activation; a company can be New for years while being quoted repeatedly.',
          ],
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
          label: 'Sales owner — one current owner, and a full reassignment history',
          text: 'Every company has exactly one current sales owner (account manager), assigned by hand. But the owner changes over an account’s life — a rep leaves, territories are rebalanced, a growing account moves to a key-account rep. The record must keep the whole chain, never silently overwrite it: the company detail shows an Owner history, so anyone can see who held the account when and — the point of the request — who reassigned it and why.',
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
            'A reassignment **is** the audited change the edit form already writes for “Sales owner” (field · old · new · who · when) — the Owner history is that audit surfaced as a readable timeline instead of a raw log row.',
            'Only a Sales lead / admin may reassign an owner; a rep cannot quietly pass their own accounts around.',
            'Reassigning the owner touches nothing else — contacts, deals, quota, membership tier and the customer relationship all stay put. It changes who is responsible, not what the customer has.',
            'Parent and subsidiary owners are independent (see the edge case): moving the parent’s owner never moves the subsidiary’s.',
            'A brand-new lead shows a single entry — whoever created it still owns it. “Never reassigned” is a real state, not missing history.',
          ],
          warn: 'The owner history is append-only. Never edit or delete a past tenure to “tidy up”: quotations, sales targets and commission all reference who owned the account at the time, so rewriting it breaks the trail.',
        },
        {
      label: 'Duplicate a quotation — the company is already known',
      text: 'Duplicating opens with THIS quotation’s company already selected. Re-quoting the same customer after a quotation lapsed is the common case; quoting a different company is the exception the rep opts into by changing the field.',
      items: [
        'Starting on “— Chọn công ty —” asked a question that already had an answer, and blocked the primary button until it was answered again.',
        'The placeholder option is only offered when the quotation’s company cannot be resolved at all — never as the default when it can.',
        'Resolution matches on every name a company is known by (record name, legal name, short name), because a quotation stores the legal name while older rows carry only the display name. A near-miss must not silently fall back to “no company”.',
        'The hint under the field states which case the rep is in: keeping the same company, or switching to another — and that billing details will follow the new company if they switch.',
        'DUPLICATE is not REVISE. Revise makes v2 of this quotation and supersedes it — same deal, same company. Duplicate starts a new quotation, on any company, with no link back beyond a “copied from” reference. Using duplicate where revise was meant leaves two live quotes on one deal.',
      ],
    },
    {
      label: 'Pipeline card — what a card has to say',
      text: 'A board is read to answer one question at a glance: what is on the table, and is any of it going cold. At ~130px per column the card can carry four lines before it starts truncating, so it carries the four that answer that and nothing else.',
      table: {
        cols: ['Line', 'Shows', 'Why'],
        rows: [
          ['1', 'Company short name', 'Falls back to the legal name when empty.'],
          ['2', 'Industry tag', 'What a rep scans to spot a sector play.'],
          ['3', 'Deal value + last-contact date', 'The money and the freshness, side by side.'],
          ['4', 'Sales owner — Sales-lead view only', 'In Sales view every card is the rep’s own.'],
        ],
      },
      items: [
        'FOUR lines, and no more. A ~130px column truncates anything longer, and a card that has to be hovered to be read is not doing the job a board is for. Quotation number, option count and next step were all tried on the card and all removed — they live on the record, one click away.',
        'The value shown is the deal value, which for a multi-option quotation is the HIGHEST option — options are alternatives and are never summed. The card does not explain that; the Quotations rules do.',
        'A company with an EXPIRED quotation is not on the board at all — the quotation is why the card existed. The closed columns (Invoice, Lost) are unaffected: those were resolved by a person, not by a lapse.',
      ],
    },
    {
      label: 'Contacts table — every field the form asks for',
      text: 'The contact list shows the same fields the Add-contact form captures, in the same order: name (with its role flags), title, email, PHONE, status, whether they have a login, and the note. A field worth asking for is a field worth showing — otherwise a rep types a phone number and then has to open the record to read it back.',
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
      items: [
        'The table is wide enough to scroll horizontally rather than dropping a column. Hiding a captured field is what sends a rep into the detail panel for something the list should have answered.',
        'No Actions column: the name is the link and every action lives in the contact panel.',
      ],
    },
    {
      label: 'Products & billing tab — what a company bought, and what it still has',
      text: 'Two cards. The left one is the ENTITLEMENT (what they hold now, and what they used to hold); the right one is the DOCUMENT trail (which purchase orders produced it).',
      table: {
        cols: ['Card', 'Shows', 'Rule'],
        rows: [
          ['Products & quota', 'Đang dùng / Đã kết thúc toggle, then quota bars', 'Past purchases are a second list behind the toggle, not a third card — “what did they buy last year, and for how much” is the first question on a renewal call, and it must not require leaving the record.'],
          ['PO history', 'One row per PURCHASE ORDER: PO number · products in it · value · invoice date', 'One row per thing actually bought. Order / Invoice / Payment as three separate rows was one purchase told three times.'],
        ],
      },
      items: [
        'NO status column on the PO list. A PO only appears here once it exists, and every row carried the same value — the INVOICE DATE is the useful fact, and an empty one says “agreed but not yet invoiced”, which is money not yet collected.',
        'NO paid/expired badge on a purchase row either. Everything listed was paid — an unpaid product never provisions — so the badge was true of every row. Whether a purchase has ended is said by which list it is in, and by the row being muted.',
        'The PRODUCTS in each PO are named on the row. A PO number alone forces a click to answer the question the row exists to answer.',
        'No “Manage in Account mgmt →” link and no “from CRM · Orders” caption: this IS the place, and where the data comes from is not the reader’s problem.',
      ],
      warn: 'Entitlement is provisioned from the PAID invoice, never picked by hand. A PO with no invoice date has therefore provisioned nothing — the customer has agreed, but the quota does not exist yet.',
    },
    {
      label: 'List toolbar — Search · Filter · Sort, and nothing else',
      text: 'Three controls, one line, in this order, on EVERY table in the admin — all 28 of them, not just this module. All field filters live behind the single Filter button, the three controls sit together on the left, and no list carries a statistics strip or a tab row.\n\nIt is implemented ONCE, in the shared list component, and derived from the table itself. A screen added next month gets the same toolbar without anyone remembering to add it — which is the only way a convention like this survives.',
      table: {
        cols: ['Control', 'What it is', 'Rule'],
        rows: [
          ['Search', 'One box', 'Filters the rep’s own book, and reaches records outside it via the dropdown — see the search block.'],
          ['▽ Filter', 'One button opening a panel: Industry · Location · Status · Pipeline (· Owner in Sales-lead view)', 'The button carries a count of active filters, so a filtered list is obvious with the panel closed. “Xoá tất cả” resets from inside the panel. Clicking away closes it.'],
          ['Sắp xếp', 'One select', 'Chưa liên hệ lâu nhất (default) · Liên hệ gần đây nhất · Tên công ty A → Z · Doanh thu cao nhất.'],
        ],
      },
      items: [
        'Five selects sitting open on the toolbar spent a line of the page permanently on a narrowing that happens occasionally — and the row grew every time a filter was added. One button does not.',
        'The active-filter count is what makes collapsing safe: hiding the controls is fine, hiding the fact that a list is filtered is not — that is how a rep concludes a company is missing.',
        'Owner appears in the panel only in Sales-lead view, where rows can belong to different reps. In Sales view every row is the rep’s own, so the filter would have one option.',
        'The default sort is the WORK, not the alphabet: Companies opens on “Chưa liên hệ lâu nhất”, Quotations on “Sắp hết hạn trước” — every quotation dies at month-end, so what runs out soonest is what a rep needs to see first.',
        'Sort sits immediately after Filter, not pushed to the right edge. Narrowing a list and ordering it are the same job; a control alone on the far side reads as belonging to the table rather than to the toolbar.',
        'NO STATUS TABS anywhere. A tab strip makes status the one dimension worth narrowing by and spends a whole row saying so — status is one filter among several, so it belongs in the Filter panel like the rest. Every tab row in the admin became a Status filter with the same options.',
        'HOW THE FILTER IS BUILT when a screen does not define its own: the old tab labels become a Status filter, and any other column whose values REPEAT and come from a small set (2–8 distinct values) becomes a filter row too, up to four. A column where every row differs is an identity or a number — a dropdown of 40 unique values is not a filter, it is a second table.',
        'Filter options are read from the rows BEFORE the column filters apply. Reading them after would collapse a dropdown to the single value just chosen, leaving no way back.',
        'When NO column qualifies — every value unique, as on a short audit log — the Filter control still renders, greyed, with the reason on hover. A toolbar that changes shape from page to page is harder to learn than one control that is occasionally unavailable.',
        'Default sort is “Mặc định”, which keeps the order the screen chose — usually meaningful (newest first, most idle first). The generic A → Z / Z → A on the first column is offered alongside it, never instead of it.',
      ],
      warn: '**Removed**: the five-card statistics strip (Revenue vs target · Activity today · In pipeline · My customers · Churn risk). Those are dashboard KPIs about the rep, not facts about the companies in the table — they belong on Analytics → Dashboard / Sales report, where a target can be set and a period chosen. On the list they pushed the first row below the fold on a laptop.',
    },
    {
      label: 'Search — a rep lists only their own book, but can reach any company',
      text: 'Two different rights, and conflating them is what causes duplicate companies. browsing everyone’s customers is a role (Sales-lead view), not a switch on a rep’s list. reaching one company the rep knows exists is a necessity for every rep: without it, “not in my list” reads as “does not exist”, and they create a second record for a company that already has an owner. So one search box does both jobs, and the second job is a dropdown on the query — never a second list on the page.',
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
      items: [
        'The dropdown is neutral, not a warning. Finding a colleague’s customer is a success, not an error — an amber alert box teaches reps that searching was a mistake.',
        'It is anchored to the input and dies with the query: it is a property of what was typed, not a region of the page.',
        'Each row carries Company ID + MST + owner + customer status — enough to be sure it is the right record before opening it, and to know whose it is.',
        'The placeholder states both jobs: “Tìm trong 28 công ty của tôi · gõ tên / MST để mở nhanh một KH bất kỳ…”.',
        'Search matches name, short name, legal name, MST, Company ID, contact and domain — including fields the table does not print. A box promising “MST” has to match MST.',
        '**Removed**: the earlier “Của tôi · Toàn hệ thống” toggle. A toggle makes browsing everyone a mode a rep can sit in; the dropdown makes reaching one record an act they perform.',
      ],
      warn: 'Opening a colleague’s company is READ-only, and the record says so: a banner names the owner, states “chỉ đọc”, and offers “Yêu cầu chuyển giao”. Without the banner the read-only rule is invisible until a button silently does nothing. Who may approve a transfer — the current owner, a sales lead, either — is still the client’s decision.',
    },
    {
      label: 'Read-only on a colleague’s company — what is actually withdrawn',
      text: 'Reach is generous; write is not. Everything on the record stays READABLE — every tab, every figure, the full activity trail — because reading is what stops a duplicate being created. What is withdrawn is every action that would write to a book that is not yours.\n\nThe gate is carried as **record-level context**, not as a flag threaded through each card. The detail page is deep (basic info, docs, affiliates, contacts, users, company page, activities), and a prop passed component-by-component means the next button someone adds to a nested card silently stays writable.',
      table: {
        cols: ['Surface', 'Owned by me', 'Owned by another rep'],
        rows: [
          ['Header', 'Edit · Tạo báo giá · View on jobseeker', 'View on jobseeker only — quoting someone else’s customer is the exact collision ownership exists to prevent'],
          ['Basic info', 'Edit toggle turns the card into fields', 'No Edit; fields render as values'],
          ['Company tags', 'Multi-select picker', 'Disabled, with the reason on hover'],
          ['Verification documents', 'Upload · remove', '“Chỉ xem tài liệu” — list stays readable, no upload, no ✕'],
          ['Affiliated companies', 'Gán quan hệ mẹ / con', 'Tree and badges stay; the link action is gone'],
          ['Contacts · Users', '+ Add contact · + Invite user · row actions', 'Lists stay; the Actions cell collapses to “—”'],
          ['Company page', 'Save changes · Publish', 'Editor and preview stay; a “chỉ đọc” note replaces the buttons'],
          ['Log an activity', 'Chat · Call · Meeting composer', 'Composer replaced by a locked note — see the rule below'],
        ],
      },
      items: [
        'THE ONE THAT MATTERS: logging an activity is withdrawn even though it looks harmless. It stamps ANOTHER rep’s company with MY contact and **resets their Idle clock** — so a colleague’s account would read as freshly touched when nobody has spoken to the customer. The locked note says exactly that, rather than just greying a button.',
        'Read is never reduced to make the point. A rep who cannot see the trail, the quota or the contacts cannot tell whether the company they found is the one they were about to create.',
        'The way back is an explicit **Yêu cầu chuyển giao**, not a silent edit. Ownership changes through the audited reassignment that already exists (see Owner history), so the trail shows who moved it and why.',
        'Sales-lead view is unaffected: that role legitimately spans the team, so the read-only gate keys off record ownership, not off which list the rep arrived from.',
      ],
      warn: 'Do not implement this by hiding the buttons only in the UI. Every withdrawn action must be refused server-side against the signed-in user’s ownership — a hidden button is a UI convenience, not a permission.',
    },
    {
          label: 'Activities on the company record — **Sales** activity only',
          text: 'The activity panel holds contact with the client and nothing else: chats, calls, and documents actually sent to or confirmed by them. It is not a merged “everything that happened” feed.',
          table: {
            cols: ['Type', 'Sales must provide', 'Integration'],
            rows: [
              ['Chat', 'Channel (Zalo · Facebook Messenger · Email · SMS · Zalo OA · Phone) + a note', '—'],
              ['Call', 'A note; duration / outcome / recording arrive automatically', 'Placed & auto-logged via Calio'],
              ['Document sent / confirmed', 'Nothing — written when the rep sends a quotation or confirms an order', 'From the document chain'],
            ],
          },
          items: [
            'System and usage events are excluded: CV unlocked, job published, company page published, payment received, products provisioned, account activated. Each already has its own tab on the record (Resume activity · Jobs · Company page · Products & billing), so nothing is lost by keeping them out.',
            'The newest row in this panel is what idle counts from. That is the whole reason for the exclusion — if a nightly provisioning job or a customer’s own CV unlock could land here, a client nobody has spoken to in two months would read as freshly touched.',
            'A company with no logged activity shows “Never contacted” — an explicit state and the highest-priority follow-up, never an empty table.',
            'The trail is read through a SINGLE-SELECT tab bar — Sales · Client · System · Tất cả, each with its count — and it opens on **Sales**. Sales activity is what the panel exists for and the only kind that resets Idle; Client and System are context. This must not be a set of multi-select chips: with everything on, tapping “Sales” then removes sales, which is the opposite of what a tab tap promises.',
            'Not to be confused with the deal timeline, which is a different surface: that one does carry decay markers (quotation auto-expired, escalation, rot-state changes) because the sales lead needs to see them. Company-level sales activity stays clean; deal-level keeps its markers. Do not merge the two.',
          ],
          warn: 'Do not “fix” this later by merging system events back in for a fuller timeline. The merged feed is the version that was removed, and it silently breaks idle, the follow-up queue and the churn early-warning that all read from it.',
        },
        {
          label: 'Logging an activity — three types, and who gets the credit',
          text: 'Sales log what they did on the company record. Three types, because they carry different facts.',
          table: {
            cols: ['Type', 'Asks for', 'Notes'],
            rows: [
              ['💬 Chat', 'Channel (Zalo · Messenger · Email · SMS · Zalo OA · Phone · Other) + note + ảnh đính kèm', 'Channel is required — “we chatted” without saying where is not a record. Attachments are screenshots only: an email is its own thread, not a file hanging off a Zalo log.'],
              ['📞 Call', 'Note only', '**no** attachment control: Calio syncs the duration, outcome and recording onto the call automatically, so a manual attach box there is dead weight.'],
              ['🤝 Meeting', 'Date · time · duration · format (their office / our office / Meet / Zoom / other) · note + attachments (ảnh + email)', 'The only type with a moment of its own — a chat is logged when it happened, a meeting is logged against the slot it was held in. The date is constrained — see the block below. No attendee list: the client side is the contact on the record, our side is whoever logs it.'],
            ],
          },
          items: [
            'ATTACHMENTS on every type, several per activity: screenshots of a Zalo thread, meeting minutes, photos. They belong to the activity row, not to a separate document library — the point is that the row proves what happened.',
            'EMAIL is attached two ways: (1) the rep forwards or BCCs the message to a system address (crm@saramin.vn) and the system files it against the company by matching the sender/recipient domain — this is the one reps actually use, because it needs no upload; (2) uploading a saved .eml / .msg file, as the fallback when the address is not reachable.',
            'The composer explains none of this: the control is labelled “Đính kèm” and nothing more. How email forwarding works belongs in onboarding and in this document, not in a paragraph every rep reads once and then scrolls past forever.',
            'Every activity is stamped with the account that performed it — not the company’s sales owner. A colleague covering for a busy owner is the one shown, and the one the KPI counts. The composer states whose KPI it will land on before the rep saves.',
            'The activity table shows that account by name, with the side it acted for underneath, and marks a row “hỗ trợ” when the performer is not the company’s owner — so a sales lead can see help being given without opening anything.',
            'Idle still counts from the newest **Sales** row regardless of who performed it: any colleague’s contact is contact.',
          ],
        },
        {
          label: 'Meeting date — the allowed window',
          text: 'The meeting date can be backdated, but only inside the current month. Two different abuses are being prevented, and they need different answers.',
          table: {
            cols: ['Date chosen', 'Allowed?', 'Why'],
            rows: [
              ['Today', 'Yes', 'The normal case.'],
              ['Earlier this month', 'Yes', 'Writing a meeting up a few days late is ordinary work — forcing today’s date would make the record wrong.'],
              ['Any day in a previous month', 'NO', 'That month is a closed KPI period. Backdating into it changes a number that has already been reported.'],
              ['Any future date', 'NO', 'An activity log records what happened. A meeting that has not happened yet is a plan, not an activity — and a future date would push Last contact to a date that has not arrived.'],
            ],
          },
          items: [
            'The picker enforces it rather than validating after the fact: days outside the window are disabled, and the field states the range under it — “Từ 01/08/2026 đến hôm nay”.',
            'The boundary is the 1st of the current month, not a rolling 30 days. The rule exists to protect the closed reporting period, so it moves with the calendar — on 01/09 the whole of August closes at once.',
            'This constrains the meeting date only. The created-at stamp is always the real moment of saving, and both are stored: a meeting held on the 3rd and written up on the 7th keeps both facts, which is what makes late write-ups auditable instead of invisible.',
            'Same window applies to Chat and Call if they are ever given an explicit date field. Today they are stamped at the moment of saving and have no date field at all.',
          ],
          warn: 'Open question for the client: may anyone log into a closed month — a sales lead, an admin, nobody? Recommend nobody, and handle corrections as a note on the current month instead, so a reported number never changes after it has been reported.',
        },
        {
          label: 'last contact (idle) — what it is',
          text: 'An independent field on the company, deliberately unrelated to the pipeline: idle = today − the date of the last contact with the client. It answers one question only — “how long since anyone talked to them?” — so it is defined for every company, with or without a deal. It never blanks out.',
          items: [
            'Resets only on real human contact: a logged activity (chat / call / meeting) or a document actually sent or confirmed to the client.',
            'Must not reset on system events: auto-reminders, provisioning, quota decrements, page publishes, housekeeping stage changes — otherwise a silent client looks healthy.',
            'one rule everywhere — same definition, thresholds table and display on the Companies list and the Pipeline board, so a number never means two different things in two places.',
          ],
        },
        {
          label: 'idle — thresholds by expected contact cadence',
          text: 'One formula reading a settings table, not per-stage logic in code. A company with an open deal always uses the Open deal row — the live opportunity sets the pace.',
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
          text: 'The column is called “Last contact” and it shows the date of that contact — 05/07/2026. It used to show the gap (“1m 4d”), which made the reader do two conversions: from a duration back to a date, and from a date back to “is that bad?”. The date answers the first directly, and the health dot answers the second, so neither has to be worked out.',
          table: {
            cols: ['State', 'Shows as', 'Example'],
            rows: [
              ['Contacted at some point', 'dd/mm/yyyy of the newest **Sales** activity', '05/07/2026'],
              ['No contact ever logged', 'A distinct state, never a date and never 0', '“Chưa liên hệ” — red'],
              ['Anywhere a duration is what is being said', 'Days, rolling up past 30 days', '“12d ago” · “2m 4d ago” on the activity trail'],
            ],
          },
          items: [
            'The coloured dot beside the date is unchanged: green / amber / red from the same cadence thresholds. The date says when, the dot says whether IT IS late — the reader should not have to subtract to learn the second.',
            'The gap in days moves into the tooltip, together with the threshold being applied: “Liên hệ gần nhất 05/07/2026 — 34 ngày trước. Existing expects monthly contact: amber from 30d, red from 60d.”',
            'the kanban card **is** the exception: dd/mm with no year, no dot and no colour. A card already carries its stage, its value and its owner, so a fourth coloured signal there competes with the stage rather than adding to it — and the year is four characters of noise on a narrow card. The full date, the gap in days and the threshold all stay one hover away, and “Chưa liên hệ” shortens to “—”.',
            'The health dot and colour stay on the list, where the column exists precisely to be scanned for what is late, and there is room for the full date.',
            'THRESHOLDS are still expressed in days — they are durations, and “amber from 30d” is the natural way to state a rule. Only the read-out is a date.',
          ],
          warn: 'The stored value stays a timestamp; the date is presentation only, and sorting always uses the underlying value so the order is by recency, not by the rendered string.',
        },
        {
          label: 'idle — build rules for the developer',
          items: [
            'Store a timestamp `lastContactAt` on the company and compute idle at read time — never store a day counter, it goes stale overnight.',
            'Sort and filter on the raw timestamp, never the formatted string, or “2m” sorts before “9d”.',
            'The event types that reset idle must be an explicit allowlist in config — this is the single most likely thing to be built wrong.',
            '`lastContactAt = null` renders “Never contacted” — a distinct state from 0d, and the HIGHQUO-priority follow-up, not the lowest.',
            'Calendar days, timezone Asia/Ho_Chi_Minh, day boundary at local midnight. Public holidays and Tết are not excluded.',
            'Every threshold lives in settings and is editable by the sales lead without a deploy.',
          ],
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
              { name: 'companySize', type: 'enum', notes: 'headcount band: 1–49 · 50–200 · 200–500 · 500–1000 · 1000–5000 · 5000+' },
              { name: 'location', type: 'enum', notes: 'city / province of the head office, picked from the master-data list — a select, not free text, because it is a list column and a filter' },
              { name: 'address', type: 'string', notes: 'full head-office address (số nhà, đường, phường/xã, quận/huyện). Free text, printed on quotations, invoices and contracts — distinct from location, which is only the province' },
              { name: 'website', type: 'string', notes: 'domain; also the seed for contact-email addresses' },
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
          'Customer status is recomputed by the system, not set by hand: a company is created New; the first invoice.issued flips it to Existing; 12 months past lastInvoicedAt with no new order → Churn; a win-back invoice returns it to Existing. Sales can only override with a reason, and the override is logged.',
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
                ['PO', 'SYSTEM ONLY', 'Written when SALES issues the Sales order from the accepted option. NOT in the menu.'],
                ['Invoice', 'SYSTEM ONLY', 'Written when KẾ TOÁN issues the VAT e-invoice after confirming payment. NOT in the menu.'],
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
              ['Negotiation', 'HR manager is running it through internal approval', 'Customer asks for changes or approval starts', '**Sales** moves the card; a revision to v2 / v3 happens here without leaving the stage. → Next action: **Sales** creates the Sales order from the option the customer accepted.'],
              ['PO', 'The Sales order has been sent to the customer — this is “won”.', 'PO sent', '**Sales** reaches this by sending the Sales order (with bank details). The “won” moment — but it provisions nothing yet, and the customer has neither agreed nor paid. → Next action: **Kế toán only** confirms the payment against the bank statement.'],
              ['Invoice', 'Customer paid and Accounting issued the VAT e-invoice — closed', 'Payment confirmed + invoice issued', '**Kế toán only** reaches this, by issuing the VAT e-invoice after confirming payment. **System** then closes the deal won, flips customer status to Existing, starts the 12-month clock and releases provisioning. Terminal — no further action on the deal.'],
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
              { name: 'idle', type: 'derived', required: true, notes: 'one field, held on the company/deal record and read unchanged by every screen — the Companies directory, the Pipeline board and any report all show the same number. There is no per-screen idle.' },
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
          'one idle field, one rule. Idle is a property of the company/deal, computed once, and every screen reads that same value — the Companies directory, the Pipeline board, the deal card and any report. What varies is only the threshold applied to it, which comes from the stage the deal currently sits in. Never let a screen compute or store its own idle.',
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
              'Legal combinations that must all work: New + Not in pipeline (cold lead / nurture) · New + Proposal (first-time quote out) · New + PO (order confirmed but not yet invoiced — they still have not paid) · Existing + Not in pipeline (bought, nothing live) · Existing + Negotiation (renewal in flight — very common) · Churn + Proposal (win-back attempt underway).',
              'Illegal by construction: any company showing "Lost" as a pipeline status; any rule that changes customer status because a deal was lost; and any transition back into New — it is the one status a company can never return to.',
              'Naming: "New" means "has never bought from us", not "recently signed up" and not "newly paying". A company can sit at New for years while being quoted repeatedly. If the sales team reads it the other way, relabel it in the UI ("Chưa từng mua") rather than redefining it.',
            ],
          },
          {
            heading: 'Board display — Won and Lost are closed, not columns companies live in',
            items: [
              'The board shows open deals that already have a quotation out. A closed-won or closed-lost deal is history on the company record, not a card that sits on the board forever — and a deal still at the drafting stage has not entered yet.',
              'Draft and Pending-approval quotations are deliberately absent from the board. The forecast may only contain numbers a customer has actually seen; a rep’s unsent working draft is not a commitment to anybody. Drafts live on the Quotations list instead, where the rep can find them.',
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
              { name: 'vendorBlock', type: 'ref → Settings', required: true, notes: 'The issuer letterhead — logo, VN + EN legal name, VN + EN address, website. never typed per quotation and never hard-coded: it comes from System → Company information (issuer). One place to change it when the entity, address or logo changes, and every past quotation keeps the version it was sent with.' },
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
              'Acceptance is recorded ON the quotation but is not a status of its own — the status moves to Issued to PO the moment the Sales order is created from that option, which is the very next click.',
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
              'An expired quotation cannot be converted to a Sales order. Revise to v2 (or extend) first; the convert action is disabled with that reason shown.',
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
              'Discount above the configured threshold blocks Send until a sales lead approves. That is a gate on the Draft, not a status of its own — the row shows Draft with an “awaiting approval” flag, so the status list stays four values long.',
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
              'The quotation states the terms the whole chain inherits: service is released on the invoice (a deliberate deviation from clause 3, which says payment + invoice), must be activated within 12 months of the invoice date (clause 4), and runs 30 days once activated (clause 5).',
            ],
          },
        ],
        states: [
          'Draft (editable · already on the board at Proposal · may carry an "awaiting discount approval" flag)',
          'Sent (immutable, awaiting the customer — via platform Send or "Mark as sent"; this is what puts the deal on the board at Proposal)',
          'Sent + offer lapsed (past the expiry date — the flag that forces a human decision)',
          'Issued to PO (an option was accepted and the Sales order was created from it — terminal success)',
          'Expired (lapsed and closed out with no PO — terminal until extended or revised)',
        ],        requirements: [
          {
            label: 'Chiết khấu — the promotion applies itself, the rep does not choose it',
            text: 'Discount is **not** a number a rep types. Picking the company resolves a discount programme from that company’s **customer status**, and the builder applies it to the lines immediately — before the rep touches anything.\n\nThe programmes themselves are configured in **Products → Discount programmes**, not here. This screen only obeys them.',
            table: {
              cols: ['Customer status', 'Programme', 'What the builder does'],
              rows: [
                ['**Existing**', 'Chiết khấu theo số lượng', 'Sets each line’s discount from that line’s own quantity — 2+ → 25%, 5+ → 30%, 10+ → 35%, 20+ → 40%, 30+ → 45%, 50+ → 50%, 100+ → 60%. A line of 1 gets 0%. The tiers are thresholds: 7 earns 30%.'],
                ['**New** or **Churn**', 'Giảm 50% tất cả dịch vụ', 'Sets the option-level discount to 50% — but only while **every** non-gift line is ≤ 5. One line at 6 and the whole 50% is gone, including from the lines that were within the cap.'],
                ['No programme', '—', 'Discount stays manual and still needs approval above the standing threshold.'],
              ],
            },
            items: [
              'While a programme is applied the discount cells are **read-only** and show what it granted. A rep who needs a different number turns auto-apply off — one visible act, rather than a quiet edit on each line.',
              'Gift (“Tặng”) lines take no discount and do **not** count toward the quantity cap. Adding a gift must never destroy the customer’s 50%.',
              'When the cap is broken the builder names the option and the line that broke it, and restates the client’s own two ways out: reduce the quantity, or split into two documents so the customer takes one programme on each. Splitting is a rep decision — the system never does it automatically.',
              'A programme grants a discount; it does not waive the approval control. A 60% volume tier still routes to a sales lead before Send.',
              'The programme applied and the rate granted are **stored on the line**, not recomputed at read time — editing a programme later must not silently reprice a quotation that has already gone out.',
            ],
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
          text: 'The four statuses on the Quotations list. Acceptance is recorded ON the quotation but is not a status of its own — it moves straight to Issued to PO the moment the Sales order is created from the accepted option.',
          table: {
            cols: ['Status', 'Means', 'Rule'],
            rows: [
              ['Draft', 'Being written — editable, not yet out', '**Sales** builds and edits it; the only editable status. Creating it puts the deal on the board at proposal immediately, so a draft already counts in the pipeline — abandoning one therefore needs the deal closing as Lost, it does not just evaporate. → Next action: **Sales** clicks “Mark as sent”.'],
              ['Sent', 'Delivered to the customer, awaiting their pick', '**Sales** declares this by clicking “Mark as sent” — reps routinely deliver the PDF by Zalo or from their own mailbox, so the status cannot depend on our mailer firing. Immutable from here. The deal is already on the board (it went there at Draft); sending does not move it. → Next action: **Sales** clicks “Issue PO” and picks the option the customer chose.'],
              ['Issued to PO', 'An option was accepted and the Sales order was created from it', 'Reached automatically the moment **Sales** creates the Sales order. Terminal success — no further action on the quotation.'],
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
              '1 · Issuer letterhead — CÔNG TY TNHH daoukiwoom innovation / daoukiwoom innovation company limited, the VN and EN address and https://topdev.vn on the left; on the right the GROUP BRANDING — the Saramin wordmark in brand blue #2D65F2 above “TopDev Vietnam”: parent brand first, then the brand the customer actually buys on. From System → Company information (issuer), never typed here. The mark ships as an INLINE VECTOR, not a link to saramin.co.kr — a document must render identically offline, in print, and a year from now.',
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
              'Issuer identity (logo, VN/EN name, VN/EN address, website, support email) comes from System → Company information; the “Báo giá bởi / Proposed by” line comes from the signed-in rep. Neither is entered on the quotation.',
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
            { name: 'sentAt / acceptedAt', type: 'timestamp?', notes: 'sentAt null ⇔ the quotation has never gone out ⇔ it is invisible to the pipeline. Set by both /send and /mark-sent; back-datable, never future.' },
            { name: 'sentVia', type: 'enum?', required: false, notes: 'platform_email|own_email|zalo|messenger|printed|other — how it actually reached the customer. Non-platform values are the common case, not the exception.' },
            { name: 'sentBy / sentTo', type: 'uuid? / string?', notes: 'who declared it sent, and the address or handle it went to — the audit trail for an off-platform send' },
            { name: 'valueSnapshot', type: 'money', notes: 'derived and cached: acceptedOption.totalAfterVat ?? max(options.totalAfterVat). Never sum. One column so the board, the list and every report read the identical number.' },
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
            'POST /admin/crm/quotations/:id/send { to[], cc[], message } — we deliver it; sets status Sent, sentVia platform_email',
            'POST /admin/crm/quotations/:id/mark-sent { sentVia, sentAt, sentTo, note } — records a send that happened outside the platform; same validation gates as /send, same status transition and same pipeline effect',
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
          'A quotation with 2 options renders a PDF identical in structure and content to the client’s EST-009909-07-2026, including per-option VAT, total-after-VAT, bilingual amount-in-words, per-package benefit lists, the 6 T&C clauses and the signature block.',
          'Options total independently and no grand total appears anywhere in the document or the pipeline value.',
          'A gift line prints as 0₫ / 0% and is excluded from revenue, but appears as provisionable quota after activation.',
          'Accepting exactly one option locks the quotation and reveals "Create Sales Order / PO" prefilled with that option’s lines.',
          'Editing a Sent quotation is impossible; "Revise" produces v2 and marks v1 Superseded, both visible in history.',
          'A quotation past its expiry date shows as Expired without anyone touching it, and its deal’s stage and rot colour are unaffected by the flip.',
          'Convert to Sales order is disabled on an Expired quotation, with the reason shown; extending validity or revising to v2 re-enables it.',
          'A discount over the threshold cannot be sent until a sales lead approves — through "Mark as sent" as well as through Send.',
          'A quotation the rep emailed from their own mailbox and then recorded with "Mark as sent" moves its deal onto the board at Proposal, with the same value, timeline entry and rot clock as a platform-sent one.',
          'A company whose only quotation is a Draft appears nowhere on the pipeline board and reads "Not in pipeline"; sending that draft makes the card appear, and no forecast number changed before that.',
          'A quotation with options at ₫6,588,000 and ₫2,926,800 reads ₫6,588,000 on the quotation list, the deal card and the stage column total; accepting the ₫2,926,800 option changes all three to ₫2,926,800. 9,514,800 is not produced by any screen or export.',
          'A "Mark as sent" back-dated to three days ago makes the Proposal rot clock read 3 days, not 0.',
        ],
        openQuestions: [
          'Max options per quotation — is 3 the cap, or should it be unlimited?',
          'Pending value = the highest option is the rule written here. If Sales would rather forecast the most-likely option, the existing "recommended" flag could drive it instead — confirm with the sales lead before reporting is built, since the two give different pipeline totals.',
          'Channel list for "Mark as sent" — is Platform email · Own email · Zalo · Messenger · Printed enough, and do we want optional proof (a forwarded copy / screenshot) attached on the off-platform ones?',
          'Should an unsent Draft older than N days nag its owner, given it is invisible to the pipeline and so cannot rot?',
          'Discount threshold that triggers sales-lead approval, and who the approvers are?',
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
          label: 'PO status — four statuses, only one of them a step',
          text: 'The status carried on the PO record and the PO list. A PO is created from exactly one accepted quotation option, carries that option’s lines forward unchanged, and is **Active** from the moment it is issued — there is no draft and no unsent state.\n\nOnly one action ever moves a PO forward: **Kế toán** issuing the VAT invoice on it. The other two statuses are exits — one nobody clicks (Expired) and one that only exists to undo an invoice (Cancelled).',
          table: {
            cols: ['Status', 'Means', 'Who acts', 'Rule'],
            rows: [
              ['Active', 'The PO has been issued to the customer from the accepted option, and payment is requested', '**Sales** issues it', '**This is the “won” moment** — the deal moves to the PO stage as soon as the PO exists. It provisions **nothing**: no account, no quota, no company page. The source quotation must be accepted and not expired. → Next action: **Kế toán** clicks “Xuất hóa đơn”.'],
              ['Issued invoice', 'A VAT e-invoice has been issued against this PO', '**Kế toán only**', 'The consequential status. Issuing provisions the products **immediately** — see the rule below. The deal closes, the customer leaves Prospect and the 12-month activation clock starts. → Only remaining action: cancel.'],
              ['Expired', 'The PO lapsed without an invoice being issued', '**System** — nobody clicks it', 'A PO expires at **the end of the month it was issued in**, the same rule as the quotation it came from. 05/07 and 28/07 both expire on 31/07. An expired PO cannot be invoiced; the rep issues a new PO from a live quotation.'],
              ['Cancelled', 'An issued invoice was withdrawn', '**Kế toán only**', 'Reachable **only from Issued invoice**. It exists for one case: the invoice was issued **before** the payment — which customers routinely need in order to release the money internally — and the payment never came. Cancelling withdraws the invoice and the quota granted with it.'],
            ],
          },
          items: [
            'Cancel is not offered on an Active PO. There is nothing to undo — an Active PO that goes nowhere simply expires at the end of the month.',
            'Payment is **not** a status. It is a fact recorded against the PO (paymentState: unpaid · partially paid · paid), because the invoice may legitimately precede it. A PO can therefore be “Issued invoice” and still unpaid — that is a receivables problem for **Kế toán**, never “Lost”, and it is the state Cancelled exists to resolve.',
            'Draft and Sent were removed together: a PO comes into existence **by** being issued, so no status separated “written” from “sent”. Paid was removed because it no longer gates anything.',
          ],
          warn: 'Deviation from the client T&C to confirm. Clause 3 says the service activates after payment **and** invoice; this model releases the product on the invoice alone, so a customer who has not yet paid can already post jobs and open CVs. That is what makes Cancelled necessary — and it means a cancellation may have to claw back quota that has already been consumed. Decide the claw-back rule before build: refuse to cancel once any quota is used · cancel and let the balance go negative · cancel and settle on the credit note.',
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
          'An Active PO appears in Accounting\u2019s queue. **Kế toán** issues the VAT invoice against it — before or after the money arrives, whichever the customer needs.',
          'Issuing the invoice provisions the products onto the company account immediately, and the PO becomes Issued invoice.',
          'A PO still Active on the last day of its month is expired by the system overnight. Nobody presses anything; the rep issues a new PO from a live quotation.',
          'Cancel is offered only on an Issued invoice PO, with a reason, and by **Kế toán** — it withdraws the invoice and the quota it granted.',
        ],
        rules: [
          'An order comes from exactly one accepted quotation option. The alternatives the customer did not choose never become orders.',
          'The source quotation must be Accepted and not expired. POST /orders rejects an expired quotation server-side, not just in the UI — the commercial terms lapsed with it (T&C clause 2).',
          'An order belongs to one customer; the billing details are the ones snapshotted on the quotation.',
          'Issuing the PO is what counts as won — not the invoice. The invoice closes the deal financially; the commitment is claimed when the PO goes out. Accepted trade-off: the customer has not paid at that point, so the PO column will always hold some deals that never convert.',
          'A PO expires at the end of the month it was issued in — never a rolling 30 days. It is the same rule as the quotation, so the two documents can never disagree about how long the commercial terms stand.',
          'Editing lines after issue requires a new PO (and, if the price changes, a re-issued quotation) so the paper trail stays intact.',
          'A PO grants nothing on its own. Provisioning happens on the invoice, and it happens immediately.',
          'Cancel is only valid from Issued invoice. The UI must not offer it on Active or Expired, and the server must reject it there.',
          'Invoices always link back to their order; an order may carry more than one invoice under a 50/50 term.',
        ],
        states: ['Đang hiệu lực / Active — won', 'Đã xuất hóa đơn / Issued invoice', 'Hết hạn / Expired — end of month', 'Đã hủy / Cancelled'],
        sections: [
          {
            heading: 'Mô tả tổng quát các trạng thái — four statuses, one forward step, two exits',
            items: [
              'four statuses, but only **one forward step**: Active → Issued invoice. The other two are exits. The screen shows the current status and at most one action; the full model below is the reference, not something restated on the page.',
              '**The test** for whether a status earns its place: two statuses are really one if they permit the same actions and carry the same obligations. Applying it removed three — “Nháp / Draft”, “Đã gửi khách / Sent” and “Đã thanh toán / Paid” — see the notes at the end.',
              '1 · Đang hiệu lực / Active — the PO has been issued to the customer, with bank details, off the one accepted quotation option. **This is the “won” moment**: the deal moves to the PO stage as soon as the PO exists. It provisions **nothing** — no account, no quota, no company page. The customer’s own PO number / file is attached here as evidence when their procurement issues one. → Action: “Xuất hóa đơn”. → Who: **Kế toán only**.',
              '2 · Đã xuất hóa đơn / Issued invoice — the VAT e-invoice exists with its legal number. The deal closes, customer status flips out of Prospect, the 12-month activation window opens, and **the products land on the customer’s account in the same moment** — they can post a job or open a CV immediately. → Only remaining action: “Hủy PO”. → Who: **Kế toán only**.',
              '· Hết hạn / Expired — an exit nobody clicks. A PO that is still Active on the last day of the month it was issued in lapses overnight, exactly like the quotation it came from: issued 05/07 and issued 28/07 both expire on 31/07. An expired PO can no longer be invoiced; the rep issues a new one from a live quotation.',
              '· Đã hủy / Cancelled — an exit reachable **only from Issued invoice**, and only by **Kế toán**, always with a reason. It exists for one situation: the invoice was issued **before** the payment — which many customers need in order to release the money internally — and the payment never arrived. Cancelling withdraws the invoice and the quota granted with it.',
              '**Rule** — issuing the invoice provisions immediately. There is no queue and no second “activate” click: the quota is usable the moment the legal number comes back.',
              '**Rule** — cancel is offered on Issued invoice and on nothing else. On an Active PO there is nothing to undo; it simply expires. The server rejects a cancel from any other status rather than the UI merely hiding the button.',
              '**Rule** — issuing the invoice is **Kế toán** only. The person whose target depends on the deal closing must not be the person who releases the product.',
              '**Rule** — expiry is a nightly job on expiresAt, not a rolling 30-day window and not something a rep sets.',
              'Not paying is not a status. An unpaid PO sits at Active (or at Issued invoice, if the customer needed the invoice first) and goes to collections — a receivables problem owned by Accounting, never “Lost”, because the deal was already won.',
              '**Removed** — “Nháp / Draft” and “Đã gửi khách / Sent”. A PO comes into existence **by** being issued to the customer, so nothing distinguished the two: same document, same permissions, same obligations. Consequence: “won” is claimed when the PO is created.',
              '**Removed** — “Đã thanh toán / Paid”. It gated invoicing, and invoicing is no longer gated on it — customers routinely need the invoice in hand to release payment. Payment survives as a **fact** on the PO (paymentState, from the Payments register), not as a stage of it. That is precisely why Cancelled exists.',
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
            { name: 'status', type: 'enum', required: true, notes: 'active|invoiced|expired|cancelled. active→invoiced is the only forward transition; active→expired is a job, not a call; invoiced→cancelled is the only cancel path. All validated server-side, never only by the UI' },
            { name: 'expiresAt', type: 'date', required: true, notes: 'last day of the issue month — computed on create, not a rolling window' },
            { name: 'paymentState', type: 'derived', notes: 'unpaid|partial|paid — rolled up from Payments; deliberately NOT part of status' },
            { name: 'confirmedAt / confirmedBy / confirmationEvidence', type: 'timestamp/uuid/string' },
            { name: 'cancelledAt / cancelReason', type: 'timestamp?/string?' },
          ],
          endpoints: [
            'GET /admin/crm/orders?status=&customer=&page=',
            'POST /admin/crm/orders (from quotation option)',
            'GET /admin/crm/orders/:id',
            'PUT /admin/crm/orders/:id (Draft only)',
            'POST /admin/crm/orders/:id/attach-customer-po { customerPoNumber?, file? }',
            'POST /admin/crm/orders/:id/cancel { reason } — rejects unless status = invoiced',
            'JOB expire-orders — nightly; sets every still-active PO past expiresAt to expired',
          ],
          integrations: ['Quotations (source)', 'Invoices + Payments (downstream)', 'Account management (provisioning target, after payment)'],
          notes: 'Confirm launch scope — real svn-be build if yes. Emits order.issued (pipeline → PO / won), order.expired and order.cancelled. Provisioning listens to invoice.issued, not to any of these.',
        },
        acceptance: [
          'A PO can only be created from an accepted quotation option and matches that option’s lines and totals exactly.',
          'A new PO is Active immediately, and its expiry is the last day of the month it was issued in.',
          'Issuing the PO moves the deal to the PO stage and provisions nothing.',
          'The customer’s own PO number and file can be attached without changing the status.',
          'Issuing the VAT invoice puts the purchased and gift lines on the company record in the same transaction, and the company can post a job and open a CV straight away.',
          'A PO still Active after its expiry date is Expired by the nightly job and can no longer be invoiced.',
          'Cancel is available on an Issued invoice PO and on no other status — the API rejects it elsewhere.',
        ],
        openQuestions: [
          'Are orders / payments / invoices / contracts in launch scope? (significant backend build)',
          'Do we send an Order Confirmation document, or do we only ever wait for the customer’s PO?',
          'Is an internal approval needed before an order is sent, or is quotation approval enough?',
          'Standard payment term — always 100% in advance, or are instalments real?',
          'Claw-back on cancel: what happens to quota already consumed when an issued invoice is cancelled? (blocks build — see the status block)',
          'Does an expired PO reopen if the customer pays late, or is a new PO always issued?',
        ],
      },
    },
    // 4 · Invoice ─────────────────────────────────────────────────────────────
    {
      name: 'Invoice (VAT e-invoice)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-invoices',
      detail: {
        requirements: [
        {
          label: 'Invoice (VAT e-invoice) status',
          text: 'The status on the Invoice list. The VAT e-invoice is the only fiscal document in the chain, it is issued from an **Active** PO by **Kế toán**, and issuing it is the event that closes the deal and provisions the products — immediately.\n\nIt is **not** gated on the payment: many customers need the invoice in hand before their finance team will release the money. Where the invoice goes out first and the money never follows, the PO is cancelled, which withdraws this invoice with it.',
          table: {
            cols: ['Status', 'Means', 'Rule'],
            rows: [
              ['Issued', 'The provider signed it and returned the legal number', '**Kế toán only** issues it, from an Active (not expired) PO. Immutable. This is the event that closes the deal, moves the company out of Prospect, starts the 12-month clock and **provisions the products immediately** — the customer can post a job or open a CV at once.'],
              ['Cancelled / replaced', 'The invoice was withdrawn — either a wrong invoice being superseded, or an invoice that was issued before a payment that never arrived', '**Kế toán only**. Corrections go through cancel + biên bản + re-issue, never an edit (VN regulation). Both invoices stay on record, linked. Cancelling withdraws the quota it granted — see the claw-back question on the PO status block.'],
              ['— Issuing (transient)', 'The provider call is in flight — seconds, not a state anyone browses', '**System**. invoice.issued must be idempotent on the invoice ID: a timeout + retry must never produce two legal numbers nor grant double quota.'],
              ['— Provider error (transient)', 'The provider call failed', '**System** surfaces it to **Kế toán** to retry. Retry must be safe for the same reason.'],
            ],
          },
          warn: 'Issued invoices are immutable. A correction is always cancel + credit note + re-issue — never an edit. And note the deviation from client T&C clause 3: the product is released on this invoice, not on the payment, so an unpaid customer can already be using their quota when a cancellation lands.',
        },
        ],
        description:
          'The closing document, and the only fiscal one in the chain. Issued from an Active PO by Kế toán — before or after the money lands, whichever the customer needs.\n\nIssuing it is the single most consequential click in the module: it closes the deal, moves the company out of Prospect, starts the 12-month activation window, and puts the products on the customer’s account immediately.',
        userStory:
          'As Kế toán, I want to issue the VAT e-invoice once I have confirmed the money landed, so that the customer gets a legal invoice and their service is released for activation.',
        uiFields: [
          {
            group: 'Invoice list',
            items: [
              { name: 'invoiceCode', type: 'string', required: true, notes: 'both numbers: our internal INV-{seq6}-{MM}-{YYYY} and the provider’s legal series (e.g. 1C26TAA/0041). The legal one is what the tax office recognises.' },
              { name: 'purchaseOrder', type: 'ref → PO', required: true },
              { name: 'payment', type: 'ref → Payment', notes: 'optional — the payment this invoice settles, linked whenever it exists. An invoice issued ahead of the money has none until the payment is confirmed' },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)', notes: 'subtotal · VAT 8% · total-after-VAT, matching the PO exactly' },
              { name: 'status', type: 'enum', notes: 'To issue · Issued · Cancelled — three statuses. An invoice record does not exist until Kế toán issues it, so there is no Blocked or Draft; Issuing is a spinner, not a status' },
              { name: 'issueDate', type: 'date', required: true, notes: 'a fact, not a plan — starts the 12-month clock' },
              { name: 'activationDeadline', type: 'derived', notes: 'issueDate + the activation window declared on the PRODUCT (activationWindowMonths — 12 by default per clause 4, but 3 on the trial posting). Snapshotted per entitlement at provisioning; a later change to the product must not move a deadline already sold. The “Activate by” column' },
            ],
          },
        ],
        behaviors: [
          '"Issue VAT invoice" is enabled on any Active PO, paid or not. It is disabled on an Expired or Cancelled PO, and says why.',
          'Issuing provisions the purchased and gift lines onto the company account in the same transaction — the customer can post a job or open a CV immediately.',
          'Issue → call the licensed provider, which signs the invoice and returns the legal number + PDF/XML; store both and email them to the customer.',
          'Issuing emits invoice.issued — the event Account management listens to in order to provision the purchased **and** gift services.',
          'A wrong invoice is never edited: cancel + credit note + re-issue, per VN regulation.',
          'The activation countdown is tracked and surfaced per line, so paid-for-but-unused quota does not silently expire. The length comes from the product, not from a constant.',
        ],
        rules: [
          'three statuses only — To issue · Issued · Cancelled. There is no Blocked and no Draft: an invoice record is not created until Kế toán issues it, so "cannot issue yet" is a state of the PO, not of an invoice that does not exist. There is no Issuing status either — the provider round-trip takes seconds and belongs in a spinner; if it fails the row stays To issue with the provider message and a Retry.',
          'The PO must be Active. An expired or cancelled PO cannot be invoiced, and this is enforced server-side rather than by disabling a button.',
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
          'Which licensed VN e-invoice provider do we integrate?',
          'For 50/50 terms — one invoice per instalment, or a single invoice on final payment?',
          'On cancel/replace, what happens to quota already granted and partly consumed — claw back the unused portion, reconcile on the credit note, or block cancellation once any quota is used?',
        ],
      },
    },
    // 5 · Sign-ups ────────────────────────────────────────────────────────────
    {
      name: 'Sign-ups',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'Company-user sign-up lives here. A self-serve sign-up is a PENDING request — it provisions nothing on its own. HQ resolves each one with the same three actions (move the user into an existing company · create a new company + move the user in · archive), and Move/Create email the user an activation link.',
      mockup: 'crm-signups',
      detail: {
        requirements: [
        {
          label: 'Sign-up = a self-serve request (provisions nothing on its own)',
          text: 'Anyone can self-register on the Company site. The form captures the person (full name, email, phone, password) and their company (tax number, company name, "is your company currently hiring?" yes/no) plus a Terms/Privacy agreement. On submit it creates a PENDING sign-up — it does NOT create a company, grant access, or provision products. HQ decides where the person lands; the account becomes active only after HQ places them AND they click an activation email.',
          table: {
            cols: ['Action', 'Result'],
            rows: [
              ['Sign up (new email)', 'A PENDING sign-up is created and appears in this inbox. No company, no access, no products yet.'],
              ['Sign up with an already-registered employer email', 'Blocked — "this email already has an account, sign in instead".'],
            ],
          },
          items: [
            'One email = one employer login = at most one company at a time. Employer identity is SEPARATE from the jobseeker site (Phase-1) — a person who is both keeps one login per site.',
            'No company or products are created at sign-up. The company comes from HQ — an existing one (Move) or a new one HQ creates (Create + move). Products still come only from a paid order.',
            'The tax number is used to match against companies we already have (below), and later to verify the company before it can post or buy — unique across verified companies.',
          ],
          warn: 'A sign-up is a REQUEST, not an account with access. Access + a company are granted only when HQ dispositions it and the user activates via the emailed link.',
        },
        {
          label: 'HQ resolves every sign-up with the SAME three actions',
          text: 'The Match column is just information — the tax code either hits a company we already have (Match) or it does not (Not match). It never changes the choices. Every sign-up, matched or not, is resolved with exactly one of the same three actions.',
          table: {
            cols: ['Action', 'What it does', 'User outcome'],
            rows: [
              ['Move to existing company', 'Assign the user to a company we already have (the matched one, or any company HQ picks)', 'User gets an activation email to set their password & sign in'],
              ['Create new company + move user', 'Create a fresh company, then move the user into it as Admin', 'User gets an activation email to set their password & sign in'],
              ['Archive', 'Discard the sign-up (spam / junk / not real)', 'No account, no email — the request is removed (reversible, audited)'],
            ],
          },
          items: [
            'Match is binary and informational only: tax code found → "Match" (shows which company); no tax match → "Not match". It hints which action fits, but the three actions are always the same.',
            'Move / Create both end the same way — the user receives a set-password / activation email; they are not active until they complete it.',
            'Assigning a user into a company follows the Move-user rules (destination role chosen, seat cap respected) — see Account management.',
          ],
        },
        {
          label: 'Company status — Active / Archived (cleanup)',
          text: 'The state HQ uses to remove a duplicate or junk company. Archive is a soft, reversible action — never a hard delete — consistent with how users and public pages are handled.',
          table: {
            cols: ['Status', 'Means', 'Rule'],
            rows: [
              ['Active', 'Normal — appears in all lists, logins work', 'Default'],
              ['Archived', 'Removed from active lists, logins blocked, jobs hidden — record + audit kept', 'Reversible (Unarchive). An Unverified company with no products and no other users can be archived freely; archiving a company with active products / other users / verified activity needs a reason and is confirmed. Never hard-deleted.'],
            ],
          },
          warn: 'To retire a duplicate company: MOVE its users into the surviving company first, THEN archive the empty one — never archive a company that still has active users or paid products without resolving them.',
        },
        {
          label: 'Sign-up status',
          text: 'A sign-up row tracks whether HQ has resolved the request. The user’s own account has a separate pending → active state that flips only when they click the activation email.',
          table: {
            cols: ['Status', 'Means', 'Rule'],
            rows: [
              ['New', 'Submitted, not yet resolved by HQ', '**System** creates it, runs the tax match, opens the row. **Sales** must disposition it — it stays New until an outcome is recorded. No access is granted while New.'],
              ['Resolved', 'HQ moved the user into a company (existing or newly created) and an activation email was sent', '**Sales** picks Move to existing or Create + move. The user becomes active only after clicking the activation link.'],
              ['Archived', 'Discarded by HQ (spam / junk / not real)', 'No account, no email. Reversible and audited.'],
            ],
          },
        },
        ],
        description:
          'The inbox for people who self-register on the Company site. A sign-up is a pending request that provisions nothing; HQ matches it against the companies we already have (by tax code) and resolves it with one of three actions — move the user into an existing company, create a new company and move them in as Admin, or archive the request. Move and Create email the user an activation link; only then are they active. It keeps the company list clean and every new employer HQ-placed and verified.',
        userStory:
          'As a sales/ops user, I want each self-serve sign-up matched against companies we already have and resolved with one action, so that a real one lands in the right company (existing or new) and spam is discarded — and the user is activated only once we have placed them.',
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
              { name: 'matchResult', type: 'derived (bool)', notes: 'binary + informational: Match (tax code hit an existing company, shows which) · Not match. Never changes the three actions.' },
              { name: 'receivedAt', type: 'timestamp' },
              { name: 'status', type: 'enum', notes: 'New → Resolved (Moved to existing / Created + moved) / Archived' },
            ],
          },
        ],
        behaviors: [
          'On submit the system creates a pending sign-up (holding the person’s chosen password for activation), runs a tax-code match against existing companies, and opens a row.',
          'Match is binary + informational: the tax code hits a company (Match, shows which) or it does not (Not match). A public email domain (gmail, yahoo…) can never auto-match and is flagged for manual verification. Match never changes the three actions.',
          'HQ resolves each row with exactly one of the same three actions — Move to existing · Create new company + move · Archive.',
          'Move and Create both create/attach the company membership and email the user an activation link; the account stays inactive until they complete it. Archive discards the request — no account, no email.',
          'Nothing is provisioned (no company, no products) until HQ resolves; products still come only from a paid order after activation.',
        ],
        rules: [
          'Three actions, one per sign-up, the SAME regardless of match: Move to existing company · Create new company + move · Archive.',
          'Creating a new company makes the user its Admin; moving into an existing company follows the Move-user rules (destination role chosen, seat cap respected) — see Account management.',
          'Move / Create both send the user an activation link; the user is not active until they click it.',
          'One email = one employer login; a second sign-up on the same email is blocked.',
          'A row cannot be left half-resolved — it is New until an outcome is recorded. Every resolution is written to the audit log with the actor + outcome.',
        ],
        states: ['New (unresolved)', 'Match (tax hit)', 'Not match', 'Public-domain email — verify manually', 'Resolved (moved to existing)', 'Resolved (new company created)', 'Archived', 'Awaiting activation (email sent)', 'Activated'],
        backend: {
          dataModel: [
            { name: 'signupId', type: 'uuid', required: true },
            { name: 'personName / phone', type: 'string' },
            { name: 'email', type: 'string', required: true, notes: 'unique across employer logins' },
            { name: 'companyNameTyped', type: 'string', required: true },
            { name: 'taxCode', type: 'string?' },
            { name: 'hiring', type: 'bool' },
            { name: 'matched', type: 'bool (derived)', notes: 'tax code hit a company' },
            { name: 'matchedCompanyId', type: 'uuid?', notes: 'the tax-matched company, if any' },
            { name: 'outcome', type: 'enum?', notes: 'moved_to_existing | created_and_moved | archived' },
            { name: 'status', type: 'enum', required: true, notes: 'new | resolved | archived' },
          ],
          endpoints: [
            'GET /admin/crm/signups?status=',
            'POST /admin/crm/signups/:id/move-to-existing { companyId, role } — attach the user; send activation email',
            'POST /admin/crm/signups/:id/create-and-move { companyName, taxCode } — create the company, user = Admin; send activation email',
            'POST /admin/crm/signups/:id/archive { reason } — discard the request',
          ],
          integrations: ['Company site sign-up form (source — creates the pending request)', 'CRM Companies (match / create / archive)', 'Account management (membership + roles)', 'Auth (pending account + activation link)', 'Notifications (activation email)'],
          notes: 'The sign-up provisions nothing; company + membership are created on Move/Create. Uniqueness among VERIFIED companies is enforced on the business registration number at verify/buy, not here.',
        },
        acceptance: [
          'Signing up creates a pending sign-up and provisions nothing — the person cannot access the site yet.',
          'Signing up with an already-registered employer email is blocked with a "sign in instead" message.',
          'Move to existing attaches the user to the chosen company with the chosen role and emails an activation link.',
          'Create new company + move creates the company with the user as Admin and emails an activation link.',
          'Archive discards the request with a reason; no account or email results.',
          'The user becomes active only after clicking the activation link; every resolution is audited.',
        ],
        openQuestions: [
          'Confirm the access model: pending-until-HQ+activation (documented here, "Model B") vs. immediate self-serve access at sign-up ("Model A"). This is the one decision that flips the whole flow.',
          'Is the password set at sign-up (held until activation), or only via the activation email?',
          'When moving a user into an existing company, does that company’s Admin approve first, or does HQ place them directly?',
          'Should stale New sign-ups auto-archive after N days, and what is N?',
        ],
      },
    },
  ],
}
