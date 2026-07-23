import type { FeatureSpec } from '../types'

const SURFACE = 'Store Site · Employer console'
const BILLING = 'Store Site · Employer billing'

/**
 * A2 — Employer / B2B console (/hiring) and the billing / paid-products
 * surface (/billing). All currently Built (mock UI) — no payment gateway is
 * wired anywhere yet.
 */
export const EMPLOYER_SPECS: FeatureSpec[] = [
  {
    id: 'emp-dashboard',
    code: 'EMP-DASH-01',
    surface: SURFACE,
    title: 'Employer dashboard',
    status: 'built-mock',
    summary:
      'Enterprise home: welcome card, action cards, services grid, hot talents, business highlights, support section, sidebar.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Landing screen after employer login — a fixed grid of widget cards (not free-form).',
          'Widgets: welcome, quick actions, services grid, hot talents, business highlights, support.',
          'Services grid = static entry links into the other console modules (jobs, ATS, talent search, billing).',
        ],
      },
      {
        heading: 'Data sources',
        items: [
          '“Hot talents” reads the candidate/talent pool; “business highlights” reads the employer’s own postings + applicant counts.',
          'Everything is mock today — each widget needs its own aggregate endpoint before it shows real data.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm which widgets are live vs mock at launch (and their priority order)',
      'BE: one aggregate/summary endpoint per data-backed widget',
      'FE: responsive widget grid + empty states',
      'Design: widget layout + priority',
    ],
    unknown: ['Which widgets read live data vs mock at launch.'],
    related: ['emp-jobs', 'emp-ats', 'emp-talent-search'],
  },
  {
    id: 'emp-jobs',
    code: 'EMP-JOB-01',
    surface: SURFACE,
    title: 'Job postings (CRUD) — Create job',
    status: 'built-mock',
    summary:
      'The canonical "Create job" flow. Employer creates / edits / lists own job posts; region, salary-range, status badges, list filters. Jobs are created in 2 places (employer site + Admin) — this is the shared module.',
    description:
      'Client has flagged this as a priority: they will provide the full details of creating a job and walk through a demo (currently based on Saramin KR). The field list below is a first draft to confirm. The same posting entity is created here and in Admin → New job, and rendered on the JS store — one schema, three surfaces.',
    uiFields: [
      {
        group: 'Basics',
        items: [
          { name: 'Job title', type: 'text (multilingual)', required: true, notes: 'vi mandatory, en optional.' },
          { name: 'Job category / occupation', type: 'select (master data)', required: true },
          { name: 'Industry', type: 'select (master data)', notes: 'Standard on VietnamWorks/TopCV, separate from category.' },
          { name: 'Employment type', type: "enum('full-time','part-time','contract','internship','freelance')", required: true },
          { name: 'Work arrangement', type: "enum('onsite','hybrid','remote')", required: true, notes: 'Now table-stakes (VietnamWorks/LinkedIn). Drives the remote/hybrid search filter.' },
          { name: 'Number of openings', type: 'number' },
          { name: 'Work location / region', type: 'multi-select (master data)', required: true },
        ],
      },
      {
        group: 'Compensation',
        items: [
          { name: 'Salary type', type: "enum('range','fixed','negotiable')", required: true },
          { name: 'Salary min / max', type: 'number (VND)', notes: 'Gross/net — confirm with client.' },
          { name: 'Salary period', type: "enum('month','year')", notes: 'VN default = monthly.' },
          { name: 'Show salary', type: 'toggle', notes: 'If off, display "Thỏa thuận" (negotiable) — standard in VN.' },
          { name: 'Currency', type: 'enum', notes: 'Default VND.' },
        ],
      },
      {
        group: 'Requirements',
        items: [
          { name: 'Career level / seniority', type: 'select — 5 tiers', required: true, notes: 'Intern/Student · Fresh graduate/Entry · Experienced · Manager · Director/Exec (VietnamWorks standard).' },
          { name: 'Experience required (years)', type: 'number' },
          { name: 'Education level', type: 'select (master data)' },
          { name: 'Skills / keywords', type: 'tags' },
        ],
      },
      {
        group: 'Content',
        items: [
          { name: 'Job description', type: 'rich text (multilingual)', required: true },
          { name: 'Requirements / qualifications', type: 'rich text' },
          { name: 'Benefits / welfare', type: 'rich text' },
        ],
      },
      {
        group: 'Publishing',
        items: [
          { name: 'Application deadline / posting period', type: 'date range' },
          { name: 'How to apply', type: "enum('on-platform','external URL')" },
          { name: 'Contact / hiring manager', type: 'text' },
          { name: 'Company', type: 'ref', notes: 'Auto from employer; selectable in Admin.' },
          { name: 'Status', type: "enum('draft','open','closed')", notes: 'Shown as a badge.' },
        ],
      },
      {
        group: 'Applications setup (optional — standard)',
        items: [
          { name: 'Screening questions', type: 'repeatable Q (+ knockout)', notes: 'Optional pre-application questions (Indeed/LinkedIn standard); knockout answers auto-filter.' },
          { name: 'Hiring pipeline', type: 'stages config', notes: 'Choose the ATS stages this job uses (see Applicant board).' },
        ],
      },
    ],
    behaviors: [
      'Multi-step form (Admin has a step-4 preview) with save-as-draft.',
      'Preview before publish; publishing makes the job appear on the JS store.',
      'List has status badges + filters (status, date, keyword).',
    ],
    backend: {
      dataModel: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'companyId', type: 'ref → company', required: true },
        { name: 'title', type: 'i18n string (vi req)', required: true },
        { name: 'category / careerLevel / education', type: 'refs → master data' },
        { name: 'employmentType', type: 'enum', required: true },
        { name: 'locations', type: 'ref[] → master data', required: true },
        { name: 'salaryType / salaryMin / salaryMax / currency', type: 'enum + number' },
        { name: 'description / requirements / benefits', type: 'i18n rich text' },
        { name: 'skills', type: 'string[]' },
        { name: 'openings', type: 'number' },
        { name: 'deadline / postedAt / closedAt', type: 'timestamp' },
        { name: 'status', type: "enum('draft','open','closed')", required: true },
        { name: 'createdBy', type: "enum('employer','admin')" },
      ],
      endpoints: [
        'POST /jobs — create (employer-scoped or admin)',
        'PUT /jobs/{id} — edit',
        'GET /jobs?company={id} — employer’s own postings',
        'POST /jobs/{id}/status — lifecycle transition',
      ],
      integrations: ['Admin master data (category, location, career level, education)'],
      notes: 'One job entity shared by employer console, Admin → Jobs, and the JS store. AI-assisted creation is a possible later add (client: “after Sept”).',
    },
    known: [
      'UI built (mock). Employer-scoped list + create/edit form exist.',
      'Jobs are created in 2 places — employer site and Admin — over one shared entity.',
    ],
    unknown: [
      'The authoritative field list + flow — client will provide full "Create a job" details + a demo (based on Saramin KR).',
      'Salary format (gross vs net), negotiable handling.',
      'AI-assisted job creation — after Sept?',
    ],
    clientQuestions: [
      'Provide the full details of Creating a job (fields + flow); walk through a demo (currently from Saramin KR).',
      'Job UI like Saramin KR, or any changes for VN?',
      'Do we want create-jobs-by-AI (targeted after Sept)?',
      'Salary: gross or net, and is "negotiable" allowed?',
    ],
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Employer-scoped posting list + a create/edit form. Same underlying job entity as HQ Admin → Jobs, filtered to the employer’s company.',
          'Treat this as the single "Create job" module reused by the employer site and Admin.',
        ],
      },
      {
        heading: 'Single source of truth',
        items: [
          'Posting fields MUST match the Admin “New job” multi-step schema so store, employer and admin all read/write one shape.',
          'Region + category + career level + education options come from Admin master data.',
        ],
      },
      {
        heading: 'Standards alignment (job-seeker platforms today)',
        items: [
          'Fields modelled on VietnamWorks / TopCV / LinkedIn: work arrangement (remote/hybrid/onsite), 5-tier seniority, salary show/hide ("Thỏa thuận"), industry, screening questions, configurable hiring pipeline.',
          'AI 1-click job posting is now an industry-standard feature (VietnamWorks ships it) — supports the client’s "create by AI" ask rather than being a nice-to-have.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm the authoritative field list + flow with the client (demo walkthrough)',
      'Align the posting schema across employer form + Admin “New job” + JS detail (one model)',
      'BE: job CRUD with company-ownership checks + lifecycle transitions',
      'FE: multi-step create/edit form + preview + inline validation',
      'Decide salary format (gross/net, negotiable) + multilingual fields (vi required)',
    ],
    adminStoreRelation:
      'Employer-created postings surface in the candidate Job search / detail and in Admin → Jobs (one job entity, three views).',
    related: ['emp-job-lifecycle', 'admin-job-new', 'admin-job-list', 'js-job-detail', 'js-search'],
  },
  {
    id: 'emp-job-lifecycle',
    code: 'EMP-JOB-02',
    surface: SURFACE,
    title: 'Job lifecycle',
    status: 'built-mock',
    summary:
      'Actions to move a posting through its lifecycle (open / close / etc.) via lifecycle-action controls.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Contextual action buttons on a posting: open, close, pause, reopen, expire. Which buttons show depends on the current state.',
          'Needs a defined state machine shared with Admin so both sides agree on legal transitions.',
        ],
      },
      {
        heading: 'Billing interaction',
        items: [
          'Closing/expiring may affect paid boosts (does a paid rank expire early? refund?). Must be defined with the billing model.',
        ],
      },
    ],
    whatToBuild: [
      'Define the posting state machine (states, allowed transitions, who can trigger)',
      'BE: transition endpoints + guards + audit trail',
      'Decide lifecycle ↔ billing rules (boost expiry / refund on early close)',
    ],
    unknown: ['The full state machine (which states, which transitions, who can trigger).'],
    related: ['emp-jobs', 'bill-recommend-rank'],
  },
  {
    id: 'emp-ats',
    code: 'EMP-ATS-01',
    surface: SURFACE,
    title: 'Applicant board (ATS)',
    status: 'built-mock',
    summary:
      'Kanban-style applicant board with per-candidate cards and a process / stage editor (move applicants through hiring stages).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Kanban per posting: columns = pipeline stages, cards = applicants. Drag a card to move an applicant between stages.',
          'A stage/process editor lets the employer rename / add / reorder stages.',
          'Reads the application records created by the candidate Apply flow; HQ Admin has a read view of the same board.',
        ],
      },
      {
        heading: 'Open design point',
        items: [
          'Decide default fixed stages (e.g. Applied → Screening → Interview → Offer → Hired/Rejected) vs per-employer configurable stages.',
          'Stage changes should be able to trigger notifications to the candidate (ties into the Notifications module).',
        ],
      },
    ],
    whatToBuild: [
      'Decide fixed vs configurable pipeline stages (client Q)',
      'BE: application + stage model, move-stage endpoint, stage-change audit',
      'FE: drag-drop kanban + stage editor + candidate card detail',
      'Wire stage-change → candidate notification',
      'Links out to interview schedule + candidate contact',
    ],
    unknown: ['Number of pipeline stages, and whether they are fixed or configurable per employer.'],
    clientQuestions: ['How many pipeline stages, and are they fixed or configurable per employer?'],
    adminStoreRelation:
      'Reads application records created by candidate Apply; HQ Admin has its own applicants-board view per job.',
    related: ['js-apply', 'emp-schedule', 'admin-job-applicants'],
  },
  {
    id: 'emp-schedule',
    code: 'EMP-SCHED-01',
    surface: SURFACE,
    title: 'Applicant schedule',
    status: 'built-mock',
    summary:
      'Interview scheduling in both calendar view (month + time grid) and list view, with toolbar / filters.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Interview scheduling tied to ATS candidates. Two views over the same data: calendar (month + time grid) and list.',
          'Toolbar/filters by posting, interviewer, status.',
        ],
      },
    ],
    whatToBuild: [
      'BE: interview/event model (candidate, posting, time, interviewer, location or video link, status)',
      'FE: calendar + list views, create/edit interview',
      'Reminders/notifications to candidate + interviewer',
      'Confirm timezone handling + online (video link) vs onsite',
    ],
    related: ['emp-ats'],
  },
  {
    id: 'emp-talent-search',
    code: 'EMP-TALENT-01',
    surface: SURFACE,
    title: 'Candidate search (talent search)',
    status: 'built-mock',
    summary: 'Employer searches the candidate / talent pool; CV-unlock concept.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Filtered search over the candidate pool; results are candidate cards with the CV locked until unlocked.',
          'Unlock reveals the full resume + contact details and consumes credits (or a paid product).',
          'Depends on the CV-unlock / monetisation model shared with Resumes + Credits.',
        ],
      },
      {
        heading: 'Privacy',
        items: [
          'Candidates must consent to appear in talent search — confirm the opt-in/opt-out model for VN.',
        ],
      },
    ],
    whatToBuild: [
      'Define the CV-unlock model (credits vs cash, what unlock reveals, expiry) — client Q',
      'BE: candidate search index + unlock ledger + permission checks',
      'FE: filters, candidate cards, unlock confirm flow',
      'Candidate consent / visibility controls (VN privacy)',
    ],
    unknown: ['CV-unlock / credit model (ties into Resumes "unlock price").'],
    clientQuestions: ['Is CV access credit-based (employer pays), and how does unlock work?'],
    adminStoreRelation: 'Reads member-created resumes; unlock / permission model must be defined.',
    related: ['js-resumes', 'emp-credits', 'bill-talent-pool'],
  },
  {
    id: 'emp-credits',
    code: 'EMP-CREDIT-01',
    surface: SURFACE,
    title: 'Credits',
    status: 'built-mock',
    summary: 'Employer credit balance / credit-based actions (e.g. to unlock CVs).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'A credit balance display + credit-consuming actions (unlock CV, boosts). Balance is granted/managed HQ-side in Admin → Products & billing → Credits.',
          'Blocked on the monetisation decision: is the B2B economy credit-based, cash-based, or both?',
        ],
      },
    ],
    whatToBuild: [
      'Confirm the credit model + the cost of each credit-consuming action',
      'BE: credit ledger (grants, spends, expiry) + balance endpoint',
      'FE: balance widget + transaction history + top-up',
      'Tie credit top-up to the payment gateway (VNPay/MoMo/ZaloPay) once chosen',
    ],
    unknown: [
      'Whether the B2B economy is credit-based, cash-based, or both.',
      'Credit expiry policy + refund handling.',
    ],
    clientQuestions: [
      'Is the whole B2B economy credit-based, cash-based, or both? Needs a clear monetisation spec before wiring billing.',
      'Standard in KR/Saramin is a prepaid credit/point wallet — confirm if VN follows that or pay-per-product.',
    ],
    adminStoreRelation: 'Credit balances managed in Admin → Products & billing → Credits; top-ups create orders + VAT e-invoices.',
    related: ['emp-talent-search', 'admin-credits', 'bill-catalog', 'bill-talent-pool'],
  },
  {
    id: 'emp-members',
    code: 'EMP-MEMBER-01',
    surface: SURFACE,
    title: 'Company members',
    status: 'built-mock',
    summary: 'Manage members of the employer account: roster + add-member form (team access).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Roster of users under one employer account + an add/invite-member form.',
          'Needs an employer-side role model: who can post jobs, who can see applicants, who can buy/manage billing.',
        ],
      },
    ],
    whatToBuild: [
      'Define the employer-side role model + permission matrix',
      'BE: company-user membership + invite flow',
      'FE: roster, add/invite, role assignment',
      'Invite email (Notifications module)',
    ],
    unknown: ['Employer-side roles / permissions model.'],
    related: ['emp-dashboard'],
  },
  {
    id: 'emp-multi-platform',
    code: 'EMP-RECRUIT-01',
    surface: SURFACE,
    title: 'Multi-platform recruit posting',
    status: 'built-mock',
    summary:
      '"Recruit add" flow that posts a role across multiple platforms — Saramin, Komate, Worknet, Senior — each with its own form + activation list + progress tracker.',
    description:
      'The largest single integration surface on the employer side. Each target platform has its own form, an activation list and a progress tracker.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'A “Recruit add” wizard distributes one role to multiple external platforms. Each target (Saramin / Komate / Worknet / Senior) has its own form, activation list and progress tracker.',
          'Currently all mock — the real work is per-target API integration, field mapping, auth and status polling.',
        ],
      },
      {
        heading: 'Biggest unknown',
        items: [
          'Which targets are real, contracted integrations vs UI placeholders. Worknet / Komate are Korean — VN equivalents may not exist.',
          'Effort scales with the number of real integrations; recommend confirming scope before estimating.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm which platforms are real contracted integrations (client Q — scope-defining)',
      'Per real target: API integration, field mapping, auth, status polling',
      'BE: distribution orchestrator + per-target status store',
      'FE: wizard, activation list, progress tracker, per-target failure UX',
    ],
    unknown: [
      'Which external platforms are real, contracted integrations vs UI placeholders.',
      'Worknet / Komate are Korean — whether VN equivalents exist.',
    ],
    clientQuestions: [
      'Which of Saramin / Komate / Worknet / Senior are real contracted integrations vs placeholders? Worknet / Komate are Korean — do VN equivalents exist?',
    ],
    externalSystems: ['Saramin', 'Komate', 'Worknet', 'Senior'],
    related: ['emp-recruit-list', 'emp-jobs'],
  },
  {
    id: 'emp-recruit-list',
    code: 'EMP-RECRUIT-02',
    surface: SURFACE,
    title: 'Recruit list',
    status: 'built-mock',
    summary: 'List / manage recruit entries with tabs, filters, side info.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Companion to the recruit wizard: lists the multi-platform recruit entries with tabs + filters + a side info panel showing per-platform status.',
        ],
      },
    ],
    whatToBuild: [
      'BE: recruit-entry list + per-platform status read',
      'FE: tabbed list, filters, detail side panel',
    ],
    related: ['emp-multi-platform'],
  },
  {
    id: 'emp-tutorial',
    code: 'EMP-ONBOARD-01',
    surface: SURFACE,
    title: 'Employer tutorial / onboarding',
    status: 'built-mock',
    summary:
      'Guided intro: service intro, job-posting, candidate view / management / contact, collaboration & evaluation, closing.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Static step-through onboarding for new employers: service intro → posting → candidate view/manage/contact → collaboration & evaluation → closing.',
          'Content-driven; low technical risk. Decide whether it gates first use.',
        ],
      },
    ],
    whatToBuild: [
      'Design: finalise step content + copy (client-supplied?)',
      'FE: step walkthrough, show-once / dismissible',
      'Decide gating (must complete before first posting?)',
    ],
    related: ['emp-dashboard'],
  },

  // ── Billing / paid products ───────────────────────────────────────────────
  {
    id: 'bill-catalog',
    code: 'BILL-CAT-01',
    surface: BILLING,
    title: 'Product catalog / select + checkout',
    status: 'built-mock',
    summary: 'Product-select + purchase flow across the billing surface. No payment gateway is wired yet — the single biggest gap.',
    description:
      'The shared purchase surface for all 8 paid products. Today it can only raise an "inquiry" (lead to sales); a real checkout needs a VN payment gateway + VAT e-invoicing. The recommended shape is a hybrid: self-serve checkout for standard products, quote/sales-assisted for large deals.',
    uiFields: [
      {
        group: 'Checkout',
        items: [
          { name: 'Cart / selected products', type: 'list', notes: 'Product, duration, quantity, price.' },
          { name: 'Buyer / company + tax code', type: 'fields', required: true, notes: 'Company MST (mã số thuế) needed for the VAT e-invoice.' },
          { name: 'Payment method', type: 'select', required: true, notes: 'See standard VN methods below.' },
          { name: 'Promo / coupon code', type: 'text' },
          { name: 'VAT (8–10%) + total', type: 'computed', required: true },
        ],
      },
      {
        group: 'Payment methods (standard VN set)',
        items: [
          { name: 'VNPay gateway', type: 'redirect', notes: 'Aggregates domestic/intl cards + QR + many wallets — usually the fastest single integration.' },
          { name: 'MoMo', type: 'e-wallet', notes: 'Largest e-wallet.' },
          { name: 'ZaloPay', type: 'e-wallet' },
          { name: 'Bank transfer / VietQR', type: 'manual/QR', notes: 'Common for B2B; reconcile by reference code.' },
          { name: 'Corporate invoice (NET terms)', type: 'offline', notes: 'Sales-assisted / enterprise — pay against an issued invoice.' },
        ],
      },
    ],
    behaviors: [
      'Self-serve: pick product → checkout → pay (gateway redirect / QR) → success → product auto-activates.',
      'Sales-assisted: request a quote → HQ creates the order → pay by transfer / invoice.',
      'On payment success, issue a VAT e-invoice (hóa đơn điện tử) — mandatory in VN.',
    ],
    backend: {
      dataModel: [
        { name: 'orderId', type: 'uuid', required: true },
        { name: 'companyId / buyerTaxCode', type: 'ref + string', required: true },
        { name: 'lineItems', type: 'product[] (qty, duration, price)', required: true },
        { name: 'subtotal / vat / total / currency', type: 'number (VND)', required: true },
        { name: 'paymentMethod', type: "enum('vnpay','momo','zalopay','bank','invoice')", required: true },
        { name: 'paymentStatus', type: "enum('pending','paid','failed','refunded')", required: true },
        { name: 'einvoiceId', type: 'ref', notes: 'VAT e-invoice issued on payment.' },
      ],
      endpoints: [
        'POST /billing/checkout — create order + payment intent',
        'POST /billing/webhook/{provider} — payment result callback (verify signature)',
        'POST /billing/orders/{id}/invoice — issue VAT e-invoice',
        'POST /billing/orders/{id}/refund',
      ],
      integrations: ['VNPay', 'MoMo', 'ZaloPay', 'VietQR / bank', 'VAT e-invoice provider'],
      notes: 'Consider a Merchant-of-Record / aggregator to offload tax + reconciliation. E-invoice via a licensed VN provider (MISA/Viettel/VNPT).',
    },
    known: ['UI built (mock). Product-select + inquiry modals exist; completed orders map to Admin → Orders.'],
    unknown: [
      'No payment gateway wired — which VN methods at launch.',
      'VAT e-invoice provider + flow (mandatory).',
      'Self-serve vs sales-assisted split (recommend hybrid).',
    ],
    clientQuestions: [
      'Which VN payment methods at launch — VNPay (cards+QR+wallets) / MoMo / ZaloPay / bank transfer / corporate invoice?',
      'Self-serve checkout, sales-assisted (HQ creates orders), or hybrid?',
      'VAT e-invoice: which provider (MISA / Viettel / VNPT), and is a company tax code required at checkout?',
      'Which of the 8 paid products launch first?',
    ],
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Shared product-select + checkout reused across all 8 paid products; orders flow into Admin → Orders.',
          'Recommend VNPay as the first integration (one gateway covers cards + QR + most wallets), then add MoMo/ZaloPay direct if needed.',
        ],
      },
      {
        heading: 'Standards alignment (VN payments)',
        items: [
          'E-wallet + QR dominate VN; MoMo / VNPay / ZaloPay lead. Bank transfer / VietQR common for B2B.',
          'VAT (8–10%) + e-invoice (hóa đơn điện tử) are mandatory — capture company tax code at checkout.',
          'Hybrid billing (self-serve checkout + quote-based sales) is the B2B SaaS standard.',
        ],
      },
    ],
    whatToBuild: [
      'Decide the VN payment method set + provider(s) — client Q, blocker',
      'Decide self-serve vs sales-assisted vs hybrid',
      'BE: checkout + payment intent + signed webhook reconciliation + refund',
      'VAT e-invoice issuance via a licensed provider',
      'FE: cart, checkout, payment redirect/QR, success/activation',
      'Prioritise which of the 8 paid products launch first',
    ],
    adminStoreRelation: 'Orders flow into Admin → Products & billing → Orders (billing connector); e-invoices + payments reconcile in Sales/CRM.',
    externalSystems: ['VNPay', 'MoMo', 'ZaloPay', 'VietQR / bank', 'VAT e-invoice (MISA/Viettel/VNPT)'],
    related: ['admin-orders', 'emp-credits', 'admin-invoices', 'xc-payments'],
  },
  {
    id: 'bill-main-ad',
    code: 'BILL-AD-01',
    surface: BILLING,
    title: 'Main ad',
    status: 'built-mock',
    summary: 'Premium homepage advertising slot purchase.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Paid product = a premium slot on the Store homepage. Purchase runs through the shared catalog/checkout.',
          'Fulfilment must activate the placement in the Home section builder (Admin → Content → Banners / sections) for the paid period.',
        ],
      },
    ],
    whatToBuild: [
      'Define pricing + duration + slot inventory (how many main-ad slots exist)',
      'BE: product + fulfilment that activates/expires the Home slot',
      'FE: product page + purchase; ties to payment',
    ],
    related: ['bill-catalog', 'js-home', 'admin-banners'],
  },
  {
    id: 'bill-targeted-ad',
    code: 'BILL-AD-02',
    surface: BILLING,
    title: 'Area / job / industry ad',
    status: 'built-mock',
    summary: 'Targeted ad placement by region, job type, industry.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Like Main ad but targeted by region / job type / industry. Purchase → checkout → placement activated for the matching audience.',
        ],
      },
    ],
    whatToBuild: [
      'Define targeting dimensions + pricing per dimension',
      'BE: product + targeted fulfilment + expiry',
      'FE: targeting selector + product page',
    ],
    related: ['bill-catalog'],
  },
  {
    id: 'bill-recommend-rank',
    code: 'BILL-RANK-01',
    surface: BILLING,
    title: 'Recommend rank',
    status: 'built-mock',
    summary: 'Paid ranking boost for a posting in recommendations.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Paid boost that lifts a posting’s rank in recommendation surfaces (Home “recommended jobs”, curation) for a paid period.',
          'Fulfilment must feed the recommendation/ranking logic — depends on how ranking is computed.',
        ],
      },
    ],
    whatToBuild: [
      'Define how a boost interacts with the ranking algorithm + duration',
      'BE: product + boost flag consumed by ranking + expiry',
      'FE: product page + purchase',
    ],
    related: ['bill-catalog', 'js-home', 'emp-job-lifecycle'],
  },
  {
    id: 'bill-search-product',
    code: 'BILL-SEARCH-01',
    surface: BILLING,
    title: 'Search product',
    status: 'built-mock',
    summary: 'Paid boost / placement within search results.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Paid placement/boost inside candidate search results (sponsored posting). Fulfilment feeds the search ranking.',
        ],
      },
    ],
    whatToBuild: [
      'Define sponsored-result rules (how many per page, labelling)',
      'BE: product + search-boost flag + expiry',
      'FE: product page + purchase',
    ],
    related: ['bill-catalog', 'js-search'],
  },
  {
    id: 'bill-package',
    code: 'BILL-PKG-01',
    surface: BILLING,
    title: 'Recruit package',
    status: 'built-mock',
    summary: 'Bundled recruiting product packages.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Bundles of the individual paid products at a package price. Maps to Admin → Products & billing → Bundles.',
        ],
      },
    ],
    whatToBuild: [
      'Define bundle contents + pricing (with client)',
      'BE: bundle model (reuses Admin Bundles) + fulfilment of each contained product',
      'FE: package product page + purchase',
    ],
    related: ['bill-catalog', 'admin-bundles'],
  },
  {
    id: 'bill-talent-pool',
    code: 'BILL-TALENT-01',
    surface: BILLING,
    title: 'Talent pool',
    status: 'built-mock',
    summary: 'Paid access product to the talent / candidate pool.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Paid access product that grants the employer entitlement to search + unlock candidates (Candidate search).',
          'Ties directly to the CV-unlock / credits model — define together.',
        ],
      },
    ],
    whatToBuild: [
      'Define access model (subscription vs credits vs per-unlock)',
      'BE: entitlement + integration with talent-search unlock',
      'FE: product page + purchase',
    ],
    related: ['emp-talent-search', 'emp-credits'],
  },
  {
    id: 'bill-events',
    code: 'BILL-EVENT-01',
    surface: BILLING,
    title: 'Events',
    status: 'built-mock',
    summary: 'Event / promotion product pages (per-slug landing).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Per-slug promotional landing pages for time-boxed events/campaigns. Mostly content + a CTA into a product/checkout.',
          'Overlaps with the CMS (Pages) — decide if these are CMS-driven or hard-coded per event.',
        ],
      },
    ],
    whatToBuild: [
      'Decide CMS-driven vs hard-coded event pages',
      'BE/CMS: event landing content model (if CMS-driven)',
      'FE: per-slug landing + CTA into checkout',
    ],
    related: ['bill-catalog', 'admin-pages'],
  },
]
