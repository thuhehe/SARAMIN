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
 *
 * WORKFLOWS 1–3 (2026-09-11, client request: "which page, which action, in what
 * order"). End-to-end, multi-role. Where a step lands on a screen the build does
 * not have yet — Create company + place, the ERC verification, the Company-site
 * banner — the step follows the requirement and the mockups and the task says
 * so, with a pending screenshot. Labels of BUILT screens are the build's.
 */

const IMG = '/guide/crm'

export const crmGuide: ModuleGuide = {
  moduleId: 'crm',
  intro:
    'For sales reps, sales leads and kế toán. This module is where a company becomes a paying customer: one chain of three documents — quotation → purchase order → VAT e-invoice — and the customer record they hang off. Issuing the invoice is the single most important click in the platform: it is the moment the customer actually receives what they bought.',
  before: [
    'Four end-to-end **workflows** open the list — who does what, on which platform and page, in what order, with the screenshot of each step under its row: a company user signs up and is placed · a company is verified · a quotation discount is approved · a company is claimed from Free data. The tasks after them are the single screens those workflows pass through.',
    'Every workflow step reads the same way: **Who** · *Platform* · **Page** (path) — action → result. Actors: **Employer HR** — the person at the company who signs up and becomes its first Admin · **Saramin Admin** — the CRM operator at HQ · **Sales rep** and **Sales lead** — Saramin sales · **System** — automatic. Platforms: **Employer site** (the company console — dev: dev.hiring.svn.topdev.asia) · **Admin console** (dev: dev.admin-svn.topdev.asia) · **Email**. The Jobseeker site plays no part in these flows.',
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
      id: 'wf-signup-placement',
      title: 'Workflow 1 — Company user signs up → Admin reviews the Sign-ups row → Move · Create company & activate · Archive',
      where: 'Employer site: Sign up (dev.hiring.svn.topdev.asia/auth/sign-up → Employer) → email · Admin console: CRM → Sign-ups (dev.admin-svn.topdev.asia/crm/sign-ups) → ⋯',
      outcome: 'The person can sign in — inside an existing company (Move) or a new company created for them (Create company & activate). Archive ends spam. Nothing else opens a login.',
      flow: [
        { n: '1', who: '**Employer HR**', platform: 'Employer site', page: '**Sign up** (/auth/sign-up → *Employer*)', action: 'Fill **Full name · Email · Phone · Password**, **Company type** (domestic / abroad), **Tax number** (**Verify** looks it up in the national register — informational only), **Company name**; optionally attach the **ERC**; tick the two required consents → **Create account**', result: 'Verification email sent. Nothing exists yet: no login, no company', shot: { src: `${IMG}/wf/wf1-01-signup-form.png`, caption: 'Mockup — the employer sign-up form with the optional ERC upload.' } },
        { n: '2', who: '**Employer HR**', platform: 'Email', page: '*Verify your email*', action: 'Click the link', result: 'Address proven → **one row appears on Sign-ups**. Still no login — the page says Saramin sets the account up within 1 business day', shot: { src: `${IMG}/wf/wf1-02-email-sent.png`, caption: 'Mockup — the success page: the wait for Saramin is named as a step, so the closed door is expected.' } },
        { n: '3', who: '**Saramin Admin**', platform: 'Admin console', page: '**CRM → Sign-ups** (/crm/sign-ups)', action: 'Review the row: **Email verified** ✓ (a row that has not verified is listed but cannot be placed — only archived), **Company type**, tax number, **ERC** (the file name opens the licence), **Match** — Customers · Free data · Not match', result: 'You know which of the three actions fits', shot: { src: `${IMG}/signups.jpg`, caption: 'Admin console → CRM → Sign-ups, as built (QA environment, no rows yet).' } },
        { n: '4a', who: '**Saramin Admin**', platform: 'Admin console', page: 'Sign-ups → **⋯ → Move to existing company**', action: 'Match names an existing customer → pick **Destination company** (matches first, with the reason they matched) and **Role in that company** → **Place sign-up**', result: 'Login created **inside that company** · activation email sent · the company’s sales owner notified · **the person can now sign in**', shot: { src: `${IMG}/wf/wf1-04-move-dialog.png`, caption: 'Mockup — the Move dialog: matched companies first, then the role.' } },
        { n: '4b', who: '**Saramin Admin**', platform: 'Admin console', page: 'Sign-ups → **⋯ → Create company & activate**', action: 'Not match — a genuinely new company → the ordinary **Create company** form opens prefilled (legal name · tax code · contact) → complete the required fields (company type · invoice address · buyer block) → **Create company & activate**', result: 'Company created on Customers with **No paperwork** and no sales owner · the person is its **first Admin** · activation email sent · **can now sign in**. A Free data match is promoted instead of duplicated', shot: { src: `${IMG}/wf/wf1-05-create-activate.png`, caption: 'Mockup — Create company & activate (the build opens the full Create company form prefilled instead of a dialog).' } },
        { n: '4c', who: '**Saramin Admin**', platform: 'Admin console', page: 'Sign-ups → **⋯ → Archive**', action: 'Spam or a test → type the **Reason** → confirm', result: 'Row archived · no account, no email · reversible, audited', shot: { src: `${IMG}/wf/wf1-06-archive.png`, caption: 'Mockup — Archive asks for a reason; nothing is created and nothing is sent.' } },
        { n: '5', who: '**Employer HR**', platform: 'Email → Employer site', page: '*Your account is ready* → **Sign in**', action: 'Click the link, sign in with the password chosen at sign-up', result: 'In the console. A new company shows **No paperwork** in the header → Workflow 2. An existing company shows its current status', shot: { src: `${IMG}/wf/wf1-07-console-no-paperwork.png`, caption: 'Mockup — first sign-in: the No paperwork tag and the button that leads to Company information.' } },
      ],
      tips: [
        '**Every row must be resolved.** An open row is a customer standing outside the door; the SLA is 1 business day and it is customer-facing.',
        '**Match decides nothing — it pre-selects.** A tax code is public; the signal that says *the person* belongs to a company is the **email domain**. Two or more matches (a parent and a branch sharing a domain) show a warning: pick the legal entity the person works for.',
        '**No sales-owner field on Move**, on purpose: the destination already has one. Ownership changes have one home — the company record.',
        '**Built (dev, 11/09/2026):** all three actions exist — Move to existing company · Create company & activate (SRM-484) · Archive; the corporate sign-up asks for company type and the ERC (SRM-483). The screenshots on this workflow are from the mockups; swap in QA captures when available.',
      ],
      spec: 'sign-ups',
    },
    {
      id: 'wf-company-verification',
      title: 'Workflow 2 — Company verification: No paperwork → Waiting to verify → Verified',
      where: 'Employer site: Company information (dev.hiring.svn.topdev.asia/company-join) · Admin console: CRM → Customers (/crm/companies) → company record (/crm/companies/:id) → Verify company',
      outcome: 'Saramin has verified the company’s business registration certificate — which is what unlocks posting a job (even a draft) and Sales requesting the official invoice.',
      flow: [
        { n: '1', who: '**Employer HR**', platform: 'Employer site', page: '**Post a job** (/jobs/new)', action: 'Try to post', result: 'Disabled — “Công ty chưa được xác minh”: the page asks for the ERC with a button to Company information. Header tag: **No paperwork**', shot: { src: `${IMG}/wf/wf2-00-post-job-gate.png`, caption: 'Mockup — Post a job while No paperwork: Save draft and Publish disabled, the certificate asked for.' } },
        { n: '2', who: '**Employer HR**', platform: 'Employer site', page: '**Company information** (/company-join)', action: 'Check and adjust the company details if needed — **Edit** → **Save changes**', result: 'Record up to date. Still **No paperwork** — editing is not what verification waits for', shot: { src: `${IMG}/wf/wf2-01-company-info-no-paperwork.png`, caption: 'Mockup — Company information while No paperwork: the banner asks for one thing.' } },
        { n: '3', who: '**Employer HR**', platform: 'Employer site', page: 'Company information → **Enterprise Registration Documents**', action: '**Upload document** → the business registration certificate (ERC); several pages are fine', result: 'File lands on the admin’s Company documents card → **No paperwork → Waiting to verify** on both sides. Banner: Saramin verifies within 1 business day', shot: { src: `${IMG}/wf/wf2-02-company-info-waiting.png`, caption: 'Mockup — after the upload: Waiting to verify, nothing more asked of the employer.' } },
        { n: '4', who: '**Saramin Admin**', platform: 'Admin console', page: '**CRM → Customers** (/crm/companies)', action: 'Filter **Verified = Waiting to verify** (mockup: chip **Chờ verify · n**)', result: 'Only the companies with paperwork to rule on', shot: { src: `${IMG}/wf/wf2-03-customers-waiting.png`, caption: 'Mockup — Customers filtered to Waiting to verify; the Verified column carries the three labels.' } },
        { n: '5', who: '**Saramin Admin**', platform: 'Admin console', page: '**Company record** (/crm/companies/:id) → **Company documents**', action: 'Open the certificate and read it against the **MST**, **registered address** and **legal name** on the record', result: 'Header shows **Waiting to verify**; **Verify company** is enabled', shot: { src: `${IMG}/wf/wf2-04-company-waiting.png`, caption: 'Mockup — the record in Waiting to verify with Verify company enabled.' } },
        { n: '6', who: '**Saramin Admin**', platform: 'Admin console', page: 'Company record → **Verify company**', action: 'Dialog *Verify this company’s paperwork?* → **Verify**. It only proceeds in Waiting to verify — on No paperwork it says there is nothing to rule on and offers **Go to Company documents**', result: 'Toast *Paperwork verified* → tag **Verified** (blue) on both platforms', shot: { src: `${IMG}/wf/wf2-05-verify-dialog.png`, caption: 'Mockup — the Verify dialog: the certificate as the input, the record’s facts to read it against.' } },
        { n: '6′', who: '**System**', platform: 'Admin console · Employer site', page: 'Company record · console header', action: '—', result: '**Verified** on both sides; the Sign-ups row (if still open) resolves', shot: { src: `${IMG}/wf/wf2-06-verified.png`, caption: 'Mockup — the record after Verify.' } },
        { n: '7', who: '**Employer HR**', platform: 'Employer site', page: '**Post a job** (/jobs/new) · Company information', action: '**Publish** / **Save draft**', result: 'Enabled — a draft needs no invoice. Company information is now **read-only** for the employer; Upload document stays', shot: { src: `${IMG}/wf/wf2-07-employer-verified.png`, caption: 'Mockup — Company information once Verified: no Edit, the page says to contact Saramin for changes.' } },
        { n: '8', who: '**Sales rep**', platform: 'Admin console', page: 'Purchase order (/crm/purchase-orders/:id)', action: '**Request official invoice**', result: 'Enabled once the company is Verified — disabled with a reason before', shot: { src: `${IMG}/purchase-order-detail.jpg`, caption: 'Admin console → Purchase order, as built — the request button reads the company’s verification.' } },
      ],
      tips: [
        '**Three labels, derived — never stored.** Verified = an admin pressed Verify · Waiting to verify = not verified and at least one document on file · No paperwork = not verified and no document. The same rule on both platforms (svn-be V482: the verdict plus any non-rejected document).',
        '**Verify has its own permission** — `company:verify` (HQ admin · VN ops) — separate from editing a company: correcting an address and ruling on legal paperwork are different authorities.',
        '**An admin edit of the legal identity re-opens the check.** Changing the legal name, tax code, registered address or the invoice-buyer block on a Verified company drops it to **Waiting to verify · cần xác minh lại**; press Verify company again after checking. A phone number, a logo or a logged call leave it alone.',
        '**Foreign company:** it has no MST on the Vietnamese register — the tax reference is optional and never blocks; verification reads the certificate all the same.',
        '**Built (dev, 11/09/2026):** Verified column and badge, Verify company and its two dialogs, the disabled invoice request, the employer’s Company information with document upload (SRM-483). Screenshots here are from the mockups.',
      ],
      spec: 'sign-ups',
    },
    {
      id: 'wf-quotation-discount-approval',
      title: 'Workflow 3 — Quotation with an order-level discount: 1–10% the Sales lead approves · above 10% the Sales manager',
      where: 'Admin console: CRM → Quotations (/crm/quotations) → + New quotation (/crm/quotations/new) · approver: CRM → Quotations → filter Waiting on me → the quotation (/crm/quotations/:id)',
      outcome: 'A quotation whose order-level discount was signed off by the right role before it goes to the customer — the Sales lead up to 10%, the Sales manager above that, straight there.',
      flow: [
        { n: '1', who: '**Sales rep**', platform: 'Admin console', page: '**CRM → Quotations → + New quotation** (/crm/quotations/new)', action: 'Build the options; under **Discount programme** type the order-level % (e.g. 8%)', result: 'The builder names the approver: *up to 10% needs a Sales lead, above that the Sales manager — straight there, not queued behind the lead*. Line-level quantity tiers, fixed amounts and Special offers route nowhere', shot: { src: `${IMG}/wf/wf3-05-new-quotation-builder.png`, caption: 'Mockup — the quotation builder; the routing sentence appears under the order-level %.' } },
        { n: '2', who: '**Sales rep**', platform: 'Admin console', page: 'the same page', action: '**Save draft** (mockup: **Gửi Sales lead duyệt →**)', result: 'Quotation stays **Draft** with a request routed to the role; **Mark as sent** is disabled; the list flags it *8% · waiting on Sales lead*', shot: { src: `${IMG}/wf/wf3-01-quotes-waiting-on-me.png`, caption: 'Mockup — the Quotations list with the approver’s Waiting on me filter (⏳ Chờ tôi duyệt) on.' } },
        { n: '3', who: '**Sales lead**', platform: 'Admin console', page: '**CRM → Quotations** → filter **Waiting on me**', action: 'Open the quotation → the approval bar reads *Quantity discount 8% off the order — waiting on Sales lead*', result: 'Only ≤10% requests from their own team are listed — never their own (a lead’s own ≤10% needs nobody)', shot: { src: `${IMG}/wf/wf3-02-quotation-pending-lead.png`, caption: 'Mockup — a quotation pending the Sales lead’s decision.' } },
        { n: '4', who: '**Sales lead**', platform: 'Admin console', page: 'the quotation', action: '**Approve 8%** — or **Refuse discount** with a reason (mandatory: the rep reads it before re-pricing)', result: 'Approved: *Send is unblocked — until the options change*. Refused: still an editable Draft, reason shown to the rep', shot: { src: `${IMG}/wf/wf3-03-approve-panel.png`, caption: 'Mockup — approving: who, when and at what percentage are recorded on the quotation.' } },
        { n: '5', who: '**Sales manager**', platform: 'Admin console', page: 'same list, same bar', action: 'A discount **above 10%** (e.g. 18%) routes straight here — the lead never sees it; a manager’s own rate never routes at all → **Approve 18%** / **Refuse discount**', result: 'Same outcome as the lead’s decision, one band up', shot: { src: `${IMG}/wf/wf3-04-quotation-manager-band.png`, caption: 'Mockup — an 18% request, routed to the Sales manager.' } },
        { n: '6', who: '**Sales rep**', platform: 'Admin console', page: 'the quotation', action: '**Mark as sent** → later **Issue PO**', result: 'Sent to the customer. Changing the % after approval voids it and re-routes — to the higher band if the new figure crosses 10%', shot: { src: `${IMG}/quotation-detail.jpg`, caption: 'Admin console → Quotation detail, as built — Issued to PO with the accepted option marked.' } },
      ],
      tips: [
        '**Routing is on the HIGHEST option in the document.** One option at 8% and another at 18% go straight to the manager — the customer may pick either, so the approver signs the worst case.',
        '**Seniority waives the step, per band.** A Sales lead’s own ≤10% needs nobody; a Sales manager’s rate never routes; a lead typing 15% still goes to the manager, because that band was never theirs to sign.',
        '**Ưu đãi đặc biệt (Special offer) carries no approval at all** — a deliberate client decision. The compensating control is after-the-fact: every Special-offer quotation is visible to the sales lead.',
        '**No Approvals page.** Decisions are taken on the quotation itself; approvers find their requests through the **Waiting on me** filter on the Quotations list.',
        '**Bands confirmed 09/08/2026:** ≤ 10% Sales lead · > 10% Sales manager, no gap. Built: the approval bar, Approve / Refuse discount, the tiers and the Waiting on me filter exist on dev.',
      ],
      spec: 'quotations',
    },
    {
      id: 'wf-claim-from-free-data',
      title: 'Workflow 4 — Sales claims a company from Free data → Admin approves → Sales lead approves',
      where: 'Admin console throughout — Sales rep: CRM → Customers → Free data (/crm/free-data) → company → Ask for this company · Saramin Admin, then Sales lead: the company record (/crm/companies/:id) → tab Claim requests · Sales rep: CRM → Claim requests (/crm/company-claims)',
      outcome: 'The company leaves Free data and lands on Customers with the requesting rep as its sales owner — after two approvals, Saramin Admin then Sales lead.',
      flow: [
        { n: '1', who: '**Sales rep**', platform: 'Admin console', page: '**CRM → Customers → tab Free data** (/crm/free-data)', action: 'Find the company (status **Chưa nhận**) → click its name → **Ask for this company** (mockup: **Xin nhận**). If the button is missing, someone else’s request is pending', result: 'The request form opens', shot: { src: `${IMG}/wf/wf4-01-free-data-list.png`, caption: 'Mockup — Free data: the status column shows Chưa nhận, or the level a pending request is waiting on.' } },
        { n: '2', who: '**Sales rep**', platform: 'Admin console', page: 'the request form (*Tạo yêu cầu*)', action: 'Fill **Request details** as the placeholder shows — your reason, then the contact point (the rep who will take care of them, email, phone) → **Customer type in Free data** → evidence **Link** or file → **Send**', result: 'Company locked: **Waiting · Admin** (mockup: *Đang chờ duyệt · Chờ duyệt lần 1 · Admin*). Nobody else can ask until it is settled', shot: { src: `${IMG}/wf/wf4-02-claim-form.png`, caption: 'Mockup — the claim form, with the client’s own placeholder as the instruction.' } },
        { n: '3', who: '**Saramin Admin**', platform: 'Admin console', page: 'Free data → **Filter Status = Waiting · Admin** → company → tab **Claim requests** (mockup: **Yêu cầu nhận**)', action: 'Read the reason, the evidence and the contact point → optional note for the rep → **Approve** (mockup: **Duyệt · Admin**) or **Reject**', result: 'Approve → **Waiting · Sales lead**, nothing created yet · Reject → closed, company back to **Chưa nhận**', shot: { src: `${IMG}/wf/wf4-03-admin-approves.png`, caption: 'Mockup — level 1: the request card on the company’s Yêu cầu nhận tab.' } },
        { n: '4', who: '**Sales lead**', platform: 'Admin console', page: 'Free data → **Filter Status = Waiting · Sales lead** → company → tab **Claim requests**', action: 'Card stamped *✓ Admin đã duyệt {when} · {who}* → check the record has an **MST** (tab Overview; Approve is disabled without one and blocked if it belongs to another company) → **Approve** (mockup: **Duyệt · Sales lead**) or **Reject**', result: 'Approve = the one write: company on **Customers**, rep = **Sales owner**, contact point = contact #1, pool row gone · Reject → final, company free again (it does not go back to the Admin)', shot: { src: `${IMG}/wf/wf4-04-lead-approves.png`, caption: 'Mockup — level 2: the same card after the Admin’s pass, now the Sales lead’s to decide.' } },
        { n: '5', who: '**Sales rep**', platform: 'Admin console', page: '**CRM → Claim requests** (/crm/company-claims) → **Của tôi**', action: 'Read the status, who decided and when, and the admin’s note verbatim', result: 'Owner of the company — or ask again with a clearer reason and better evidence. No buttons here, on purpose', shot: { src: `${IMG}/wf/wf4-05-claim-log.png`, caption: 'Mockup — the rep’s own log; decisions live on the company record.' } },
        { n: 'bypass', who: '**Saramin Admin**', platform: 'Admin console', page: 'company record → **Owner history** → **Phân trực tiếp**', action: 'Fill MST · invoice address · contact → pick a rep → **Phân ngay**', result: 'Company on Customers with that owner; an open request is auto-rejected with a note' },
      ],
      tips: [
        '**Two levels of yes, one level of no.** Only a request the Admin approved reaches the lead; a rejection is final at whichever level it happens, and the lead’s no never bounces back to the Admin.',
        '**The MST gate sits on the button that creates the company** — the lead’s Approve and the Admin’s direct assign — never on the Admin’s level-1 pass, which creates nothing. Fill or correct the MST on the record (tab Overview), not on the card.',
        '**One request per company at a time.** While one is pending, Ask for this company disappears for everyone else; a refusal frees the row again — “locked” is never “gone”.',
        '**Sales never create companies.** The only routes to owning one are this claim, or being assigned by a Saramin Admin (Phân trực tiếp).',
        '**Built (dev, 11/09/2026):** the claim, its two Waiting statuses and Approve / Reject on the company’s Claim requests tab are in the build (a foreign company is no longer blocked over a tax code it cannot have). Phân trực tiếp is specified and pending.',
      ],
      spec: 'danh-ba-doanh-nghiep-free-company-data',
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
        'The approvals that follow — Admin, then Sales lead — are **Workflow 4** at the top of this page.',
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
        'End to end — the whole sign-up and placement — is **Workflow 1** at the top of this page. Since 11/09/2026 the build also has **Create company & activate** here (SRM-484): it opens the ordinary Create company form prefilled from the row.',
      ],
      spec: 'sign-ups',
    },
  ],
  builtFrom: [
    { repo: 'saramin-vn-admin', branch: 'dev', commit: '4ee8ef2', date: '2026-09-11', note: 'screens and behaviour — Sign-ups’ three actions (SRM-484), the Verified column and Verify company (SRM-483), discount approval' },
    { repo: 'saramin-vn-admin', branch: 'dev', commit: 'deed9d0', date: '2026-09-08', note: 'docs/qa/screenshots — the build pictures on this page' },
    { repo: 'svn-web', branch: 'dev', commit: 'c497942', date: '2026-09-11', note: 'corporate sign-up with company type and the ERC (SRM-483 §1) · Company information (/company-join)' },
    { repo: 'svn-be', branch: 'dev', commit: '2c36371', date: '2026-09-11', note: 'verification verdict derived from the documents (V482) · placement files the sign-up’s ERC (SRM-484)' },
    { repo: 'SARAMIN_REQUIREMENT (this site)', branch: 'main', commit: 'HEAD', date: '2026-09-11', note: 'Workflow screenshots (guide/crm/wf/*) are captured from the Admin / Company mockups by scripts/guide-shots.mjs — swap in QA captures when the screens are on the test environment' },
  ],
}
