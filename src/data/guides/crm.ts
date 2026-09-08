import type { ModuleGuide } from './types'

/*
 * CRM — user guide.
 *
 * Written against the admin console on saramin-vn-admin `dev`, using the QA
 * screenshot set in docs/qa/screenshots, the tester guide in
 * docs/qa/tester-guide-en/03-company.md + 04-crm.md, and the module notes in
 * docs/features/ (companies, quotations, purchase-orders, invoices, pipeline,
 * sign-ups, company-documents).
 *
 * Where the module notes and the tester guide disagree, the tester guide wins:
 * it was written last, against the running console, and the screenshots prove
 * it. The one that matters: issuing the VAT invoice happens on the INVOICE
 * screen; the purchase order's own action is "Request official invoice".
 */

const IMG = '/guide/crm'

export const crmGuide: ModuleGuide = {
  moduleId: 'crm',
  intro:
    'For sales reps, sales leads and kế toán. This module is where a company becomes a paying customer: one chain of three documents — quotation → purchase order → VAT e-invoice — and the customer record they hang off. Issuing the invoice is the single most important click in the platform: it is the moment the customer actually receives what they bought.',
  before: [
    'Work in this order: **Customers** (the company must exist, with its tax code) → **Quotations** → **Purchase order** → **Invoice**. Each document is created from the one before it, and nothing is ever retyped between them.',
    'A company needs an **MST (tax code)**, an invoice address and a **Sales owner** before it can be quoted — every quotation and VAT invoice prints them.',
    'Two things only accounting can do: **issue the official invoice** and **review company documents**. A rep who cannot see those pages is looking at a permission, not a bug.',
    'The three documents must agree **to the last đồng**. If the invoice total differs from the PO, or the PO from the accepted option, something is wrong — do not correct it by editing, because none of these documents can be edited after issue.',
  ],
  tasks: [
    {
      id: 'find-the-module',
      title: 'Find the module',
      where: 'Left menu → CRM',
      steps: [
        'Sign in to the admin console. The **CRM** group sits near the bottom of the left menu, under Call center.',
        'It holds eight pages: **Customers**, **Pipeline**, **Quotations**, **Purchase order**, **Invoice**, **Claim requests**, **Sign-ups** and **Company documents**.',
        'The breadcrumb at the top of every page tells you where you are.',
      ],
      tips: [
        '**Company documents** is accounting-only — it is the queue for verification papers employers upload and for requests to change a legal record. It needs its own right, so most reps will not see it.',
        'Owned, Free data and Archived are **tabs of Customers**, not separate menu entries.',
      ],
    },
    {
      id: 'find-a-customer',
      title: 'Find a customer',
      where: 'CRM → Customers',
      outcome: 'The right company record, whoever owns it.',
      steps: [
        'Pick the tab: **Owned** is the customer book (a company with a sales owner), **Free data** is the unclaimed pool, **Archived** is the register of companies taken out of service.',
        'Pick the scope: **Mine**, **My team’s** or **All**. The row count changes with it — that is how you tell you are looking at the right book.',
        'Search by name or short name, or narrow with **Filter** (industry, region, customer status, pipeline stage) and **Newest first** to sort.',
        'Click a company **name** to open its record. **+ New company** creates one that does not exist yet.',
      ],
      shots: [
        { src: `${IMG}/companies-list.jpg`, caption: 'The Owned tab. Status, tier, pipeline and idle days are read across one row.' },
      ],
      tips: [
        'Adding a company is not claiming it — a company created without an owner lands in **Free data**.',
        '**Idle** counts days since the last contact. “Never contacted” is the strongest call-list signal on the page.',
      ],
      spec: 'companies',
    },
    {
      id: 'read-a-company-account',
      title: 'Read a company account',
      where: 'CRM → Customers → open a company',
      outcome: 'You know what this customer is worth, what they hold, and who owns them.',
      steps: [
        'Read the stat row: **Tier** with cumulative revenue and the gap to the next one, **Customer since**, **Open jobs**, **Team**, **Job quota** (slots left), **CV unlocks** and **Sales owner**.',
        'Use the tabs for the detail: **Overview** (profile, billing information, activity), **Contacts**, **Users**, **Products & billing**, **Company page**, **Jobs**, **Claim requests**, **Owner history**, **Applications**, **Resumes**.',
        'Log what happened with **Chat**, **Call** or **Meeting** on the right. Everything logged lands in the activity feed underneath.',
        'The header carries the actions: **Call**, **Archive**, **View on jobseeker** and **+ Create quotation**.',
      ],
      shots: [
        { src: `${IMG}/company-detail.jpg`, caption: 'The account summary, the tabs, and the activity feed on the right.' },
      ],
      tips: [
        'A company must be **Active** before any of its jobs can be published — the platform refuses the publish, it does not just hide the button.',
        '**Edit** on the Company profile card is where the MST and the invoice address are fixed. Clearing the MST really clears it; every other field ignores an empty value.',
        'Working locations belong to the company, and jobs only point at them. Deleting one changes how those jobs read.',
      ],
      spec: 'companies',
    },
    {
      id: 'claim-a-company',
      title: 'Claim a company from Free data',
      where: 'CRM → Customers → Free data → open a company → Ask for this company',
      outcome: 'The company is in your book, with you as its sales owner.',
      steps: [
        'Open the company from the **Free data** tab and click **Ask for this company**.',
        'Fill **Request details** — the placeholder gives the format: your reason, then the contact point (the rep who takes care of them, with email and phone).',
        'Pick the **Customer type in Free data**, and paste an **evidence** link or attach a file if you have one.',
        'Send it. It goes to **Waiting · Admin**, then **Waiting · Sales lead** — two approvals, in that order — and you are the owner once the lead approves.',
      ],
      shots: [
        { src: `${IMG}/claim-requests.jpg`, caption: 'CRM → Claim requests: your own log of what you asked for. Empty on the QA environment.' },
      ],
      tips: [
        'The **Claim requests** page in the menu is a log, not a queue — it deliberately has no Approve or Reject buttons. Decisions are made on the company’s own **Claim requests** tab.',
        'A company with no tax code cannot be approved or assigned to anyone, because a quotation and an invoice both print it. Fill the MST first; a rejection is still possible without it.',
        'A rejected request frees the company again — ask a second time with a clearer reason and better evidence.',
      ],
      spec: 'danh-ba-doanh-nghiep-free-company-data',
    },
    {
      id: 'raise-a-quotation',
      title: 'Raise a quotation',
      where: 'Company → Create quotation (or CRM → Quotations → New quotation)',
      outcome: 'One document offering the customer one to three priced options.',
      steps: [
        'Section 1 **Document header** fills itself: the **Quotation no.** reads *Assigned on save* from a gapless sequence, the **Expiry date** defaults to end of month, and **Proposed by** is you.',
        'Section 2 **Client**: pick the company — searchable by name or tax code. Its legal name, tax code, contact and billing data appear underneath for you to confirm.',
        'Section 3 **Options**: build **Option 1** with **+ Line item** — pick a service, quantity, unit price, discount. Add **+ Gift** for anything given free.',
        'Add **Option 2** and **Option 3** only if the customer is genuinely choosing between them, and mark one **Recommended**.',
        'Pick a **Discount programme** if one applies, then read the totals panel: Subtotal, Discount, Amount off, After discount, VAT (8%), Total after VAT, and the amount spelled out in Vietnamese.',
        '**Save draft**, then **Mark as sent** when it goes to the customer.',
      ],
      shots: [
        { src: `${IMG}/quotation-new.jpg`, caption: 'The builder, numbered in the reading order of the real document.' },
      ],
      tips: [
        '**Options are alternatives, never add-ons.** The quotation is worth the option the customer picks — there is no grand total, and nothing anywhere sums them.',
        'A **Gift** line is price 0, discount 0, total 0. It cannot be given a price.',
        'Only products with **Status = Active** appear in the **Pick a service** picker. If something is missing, it is inactive in the catalogue.',
        'Saving the first quotation for a company puts it on the pipeline board at **Proposal** — there is no separate “new deal” action.',
      ],
      spec: 'quotations',
    },
    {
      id: 'issue-the-purchase-order',
      title: 'Record the accepted option and issue the PO',
      where: 'CRM → Quotations → open the quotation → Issue PO',
      outcome: 'A committed order, frozen from exactly the option the customer accepted.',
      steps: [
        'Open the quotation and click **Issue PO**.',
        'Answer **Which option did the customer accept?** — the order is copied from that one option and nothing else.',
        'Check the **VAT billing** block. The buyer’s details come from the company record; tick the box only if this classification should become that company’s default.',
        'Set **Payment terms** — *100% in advance* is the default, and *50/50* opens two receivables instead of one — plus the method and the expected payment date.',
        'Confirm. The quotation now reads **Issued to PO**, the accepted option is labelled, and **View the order** takes you to it.',
      ],
      shots: [
        { src: `${IMG}/quotation-detail.jpg`, caption: 'Issued to PO. Option 1 carries both Recommended and Accepted, and Issue PO is spent.' },
      ],
      tips: [
        '**A PO can only be issued once.** After that the button is disabled and the quotation’s figures are frozen — to quote something else, **Duplicate** it.',
        'Issuing the PO is the “won” moment for the deal, and it moves the pipeline card to **PO** by itself. It provisions **nothing** for the customer.',
        'The expected payment date is what the customer said, not a deadline — nothing goes overdue because it passed.',
      ],
      spec: 'quotations',
    },
    {
      id: 'hand-the-order-to-accounting',
      title: 'Hand the order to accounting',
      where: 'CRM → Purchase order → open the order → Request official invoice',
      outcome: 'The order is in accounting’s queue, with the figures the invoice will carry.',
      steps: [
        'Read the header: the status badge plus one line saying what it means today — *Valid until … month end* for **Active**, *Products are on the customer’s account* once it is invoiced.',
        'Check the document: seller on the left with its MST, recipient on the right with theirs, the **From quotation** link back to the accepted option, and the line table with its money ladder.',
        'Fix anything wrong with **Edit services** — possible only while the order is **Active**.',
        'Click **Request official invoice**. It goes to accounting, who issue it from the invoice screen.',
      ],
      shots: [
        { src: `${IMG}/purchase-order-detail.jpg`, caption: 'One card holds the whole document, because a purchase order is one object.' },
      ],
      tips: [
        'There is **no New order button and no delete** — an order exists only because a quotation option was accepted. Once it is with accounting, even **Edit services** closes.',
        'An order **expires at the end of its month**, never after a rolling 30 days. An expired order can no longer be invoiced: raise a new one from a live quotation.',
        'A missing MST on either party is a real problem, not a display gap — the VAT invoice cannot be made out without it.',
      ],
      spec: 'purchase-order',
    },
    {
      id: 'issue-the-vat-invoice',
      title: 'Issue the VAT e-invoice — accounting only',
      where: 'CRM → Invoice → open the invoice → Issue official invoice',
      outcome: 'The customer receives what they bought, immediately.',
      steps: [
        'Open the requested invoice. It grants nothing until it is issued.',
        'Click **Issue official invoice**. The dialog says what it does: this closes the deal and puts the products on the customer’s account at once, with no undo.',
        'Type the **Legal invoice number** your e-invoice provider returned — that is the number the tax office recognises — and set the **Issue date**, which starts the 12-month activation window.',
        'Optionally tick **Email the invoice to the customer now**, then confirm with **Issue invoice**.',
        'When the customer pays, use **Confirm payment**: which tranche, amount received, deposited on, and the bank transaction ID.',
      ],
      shots: [
        { src: `${IMG}/invoice-detail.jpg`, caption: 'Issued alongside Unpaid — two different things. The quota did not wait for the payment.' },
      ],
      tips: [
        '**Issued and Unpaid are independent.** Quota is granted on Issued; payment is tracked separately, and invoicing is not gated on it.',
        '**An issued invoice is immutable and there is nothing to cancel.** A wrong one is corrected with the e-invoice provider, outside this system.',
        'Two numbers, both shown: the provider’s legal number and our own INV- reference.',
        '**Activate by** is the issue date + 12 months. Quota not used by then is lost, so it belongs in the conversation with the customer.',
      ],
      spec: 'invoice-vat-e-invoice',
    },
    {
      id: 'confirm-the-quota-landed',
      title: 'Confirm the quota landed',
      where: 'Company → Products & billing',
      outcome: 'Proof the customer really holds what the invoice sold them.',
      steps: [
        'Open the company and go to **Products & billing**.',
        'Under **Products & quota → IN USE**, find the product just sold. Each row shows its **job slots** and the date it runs **until**.',
        'Check the **Manual services** panel on the right for anything ops has to deliver by hand — it provisions nothing.',
        'The **Job quota** card at the top of the company is the roll-up; this tab is where you see it per product.',
      ],
      shots: [
        { src: `${IMG}/company-products-billing.jpg`, caption: 'IN USE — what the customer holds, with slots and expiry per product.' },
      ],
      tips: [
        'Quota moves for exactly three reasons: an invoice grants it, publishing or upgrading a job spends it, unlocking a CV deducts credit. There is no manual grant.',
        'A quota number that changed without one of those three is a bug worth reporting.',
      ],
      spec: 'companies',
    },
    {
      id: 'work-the-pipeline',
      title: 'Work the pipeline',
      where: 'CRM → Pipeline',
      outcome: 'The board shows where every open deal actually stands.',
      steps: [
        'Filter with **Mine / My team’s / All** and the **Owner** dropdown, or search by company.',
        'Drag a card between **Proposal**, **Qualified** and **Negotiation** as the conversation moves — backwards too, when it genuinely goes backwards.',
        'Leave **PO** and **Invoice** alone: they are written when the document is issued and cannot be set by hand.',
        'When a deal dies, **Close as lost** and pick a reason — lost to competitor, price, no budget this cycle, no response, not a fit, internal approval rejected — with a note.',
      ],
      shots: [
        { src: `${IMG}/pipeline.jpg`, caption: 'The six columns. Empty on the QA environment; each column shows its count and total.' },
      ],
      tips: [
        '**Each card is a quotation** — there is no separate deal record behind it, and clicking a card opens that quotation.',
        'Closing a deal as lost closes the deal, not the company: it keeps its record, its history and its customer status, and a new quotation opens a new deal.',
        'Losing a deal never changes the customer status. New stays New, Existing stays Existing.',
      ],
      spec: 'sales-pipeline',
    },
    {
      id: 'place-a-sign-up',
      title: 'Place a self-registered employer',
      where: 'CRM → Sign-ups',
      outcome: 'The person can sign in, inside the right company.',
      steps: [
        'Read the two gates on the row: **Email verified** is the person’s own step, **Match** says whether the tax code they typed already belongs to a company.',
        'Use **Move to existing company**. Pick the **Destination company** — the picker offers companies that already have a sales owner, and pre-selects the tax-code match when one qualifies — and the **Role in that company**; leaving the role empty makes them a Company Admin.',
        'Confirm with **Place sign-up**. That creates the login and emails the person to sign in with the password they chose at sign-up — it is not a set-password link.',
        'If the dialog says the tax code reaches no company, or that the company is still in **Free data**, it stops there on purpose: create the company, or promote it out of Free data, then come back and the row moves in one click.',
        'For spam or a duplicate, **Archive**. It is a rejection, recorded, never a delete.',
      ],
      shots: [
        { src: `${IMG}/signups.jpg`, caption: 'The inbox, with both gate columns. Empty on the QA environment.' },
      ],
      tips: [
        'Placement is the only thing that creates an account — submitting the form provisions nothing.',
        '**The Match column decides nothing.** It only pre-selects the company in the Move dialog; it is not an approval.',
        'A row that has not verified its email can still be **archived**, but not placed — the platform refuses it whatever the screen offers.',
      ],
      spec: 'sign-ups',
    },
  ],
  builtFrom: [
    { repo: 'saramin-vn-admin', branch: 'dev', commit: '07e4b68', date: '2026-09-08', note: 'screens and behaviour' },
    { repo: 'saramin-vn-admin', branch: 'dev', commit: 'deed9d0', date: '2026-09-08', note: 'docs/qa/screenshots — the pictures on this page' },
  ],
}
