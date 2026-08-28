import type { FeatureSpec } from '../types'

const S = 'HQ Admin'

/**
 * Part B — HQ Admin Console (saramin-vn-admin). A BFF in front of a Spring
 * backend (svn-be). Permission-gated per module (resource:action).
 *
 * BB notes / whatToBuild are BurningBros build notes — for BE-migrated modules
 * the remaining work is mostly confirmation + wiring; for prototype / empty-seam
 * modules it is real backend build.
 */
export const ADMIN_SPECS: FeatureSpec[] = [
  // ── B1 · Companies ─────────────────────────────────────────────────────────
  {
    id: 'admin-company-list',
    code: 'ADM-CO-01',
    surface: `${S} · Companies`,
    title: 'Customers',
    status: 'be-migrated',
    summary: 'Browse / manage all companies.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Searchable, paginated table of all companies; row → company detail. Already on the real backend.',
          'This master record powers the Store companies directory — the two must stay in sync.',
          'A company that belongs to a corporate group shows a group tag under its name, which doubles as the filter into that group (parent + subsidiaries + branches, every level). Group filtering ignores the owner filter, because a group routinely spans several reps.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm list columns + filters (industry, size, status) with the client',
      'Group tag on the row + a “filter to this corporate group” view (recursive from the group root)',
      'Verify the sync path to the Store companies directory',
    ],
    adminStoreRelation: 'Company profile fields power the Store companies directory.',
    related: ['js-companies', 'admin-company-detail'],
  },
  {
    id: 'admin-company-detail',
    code: 'ADM-CO-02',
    surface: `${S} · Companies`,
    title: 'Company detail',
    status: 'be-migrated',
    summary: 'Full company record view / edit.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Full record view/edit powering the Store profile: logo/cover, industry, size, locations, website, about, "why join us", benefits/welfare, photos, open jobs.',
          'Multilingual fields (about, why-join-us, benefits) — vi mandatory, en/ko optional.',
          'This public profile is required only for customers who use Job Posting; Resume-Search-only customers have no public page (see Lead → customer activation).',
        ],
      },
      {
        heading: 'Công ty liên kết (corporate group)',
        items: [
          'Internal-only block: the ancestor chain as a breadcrumb, plus the direct children as rows — each with its own tax code, its own sales owner, and a link through to that record. One level up and one level down; a “Xem sơ đồ tập đoàn” link opens the full tree.',
          'Branch vs subsidiary is derived from the tax codes, never typed: same 10-digit root as the parent → Chi nhánh; a different tax code → Công ty con.',
          'The link inherits nothing — quota, contracts, invoices, users, the public page and the sales owner all stay on the record that owns them. This block is context and navigation only.',
          'None of this reaches the public Store profile — a jobseeker never sees who owns whom.',
        ],
      },
      {
        heading: 'Reviews moderation (if UGC in scope)',
        items: [
          'ITviec/Glassdoor-style reviews carry an overall rating + sub-ratings (work-life, culture, career, compensation).',
          'Each review needs a moderation state (pending → approved / rejected) + reporting; only approved reviews show on the Store.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm the editable field set + which fields are multilingual (vi mandatory)',
      '“Công ty liên kết” block (breadcrumb up, direct children down, auto-badged branch vs subsidiary) + a “set parent company” action that rejects cycles',
      'Standard company-profile schema (header, about, why-join-us, benefits, photos, reviews)',
      'If reviews launch: review model (overall + sub-ratings) + moderation queue (approve/reject/report)',
    ],
    adminStoreRelation: 'Edits here surface on the Store company profile page; only approved reviews are shown.',
    related: ['admin-company-list', 'admin-company-new', 'admin-customer-activation', 'js-companies', 'xc-ugc'],
  },
  {
    id: 'admin-company-new',
    code: 'ADM-CO-03',
    surface: `${S} · Companies`,
    title: 'New company',
    status: 'be-migrated',
    summary: 'Create a company record.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Create form for a new company record. Shares the field schema with Company detail.',
          'Guard against duplicates (tax code / name) — but only a full tax-code match is a duplicate. A shared 10-digit tax root, or a near-identical legal name on a different tax code, is offered as an affiliate link instead of being blocked; subsidiaries are routinely named “… Miền Nam” / “… Hà Nội”.',
          'Optional “Công ty mẹ” field at creation — search by name or tax code. It only records the link; the new company still gets its own tax code, contract, quota and sales owner.',
          'Tax code accepts 10 digits, or 10 + “-” + 3 for a branch. The full string is what must be unique.',
          'Origin: a company is created from the CRM (on customer activation), not as a standalone entry — this screen is the underlying create step. The public profile is filled only when the customer uses Job Posting.',
        ],
      },
    ],
    whatToBuild: [
      'Three-branch duplicate detection: full tax code blocks; shared tax root or similar name offers a branch / subsidiary link',
      'Tax-code format validation (10 digits or 10-3) with uniqueness on the full string',
      'Optional parent-company picker at creation',
      'Confirm required vs optional fields at creation',
      'Align creation with the CRM activation flow (single company record, no duplicates)',
    ],
    related: ['admin-company-list', 'admin-customers', 'admin-customer-activation'],
  },

  // ── B2 · Products & billing ─────────────────────────────────────────────────
  {
    id: 'admin-catalog',
    code: 'ADM-BILL-01',
    surface: `${S} · Products & billing`,
    title: 'Catalog',
    status: 'be-migrated',
    summary: 'Product catalog list + product detail + create new product.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'CRUD over the paid-product catalog that the Store employer-billing surface sells (main ad, boosts, talent pool, etc.).',
          'Each product needs attributes (price, duration, targeting) AND a fulfilment definition — what activating it actually does on the Store.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm product attribute set + how each maps to a Store paid product',
      'Define fulfilment per product type (what activation does + expiry)',
    ],
    adminStoreRelation: 'Products here are what the Store billing catalog sells.',
    related: ['bill-catalog', 'admin-bundles'],
  },
  {
    id: 'admin-bundles',
    code: 'ADM-BILL-02',
    surface: `${S} · Products & billing`,
    title: 'Bundles',
    status: 'be-migrated',
    summary: 'Product bundles: list, detail, create.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Bundle several catalog products at a package price (maps to the Store “Recruit package”).',
          'Fulfilment activates each contained product.',
        ],
      },
    ],
    whatToBuild: [
      'Define bundle composition rules + package pricing',
      'Confirm fulfilment of each contained product on purchase',
    ],
    related: ['bill-package', 'admin-catalog'],
  },
  {
    id: 'admin-credits',
    code: 'ADM-BILL-03',
    surface: `${S} · Products & billing`,
    title: 'Credits',
    status: 'be-migrated',
    summary: 'Credit management.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Manage employer credit balances (grant / adjust). Backing ledger for the Store credits feature + CV unlocks.',
          'Blocked conceptually on the credits-vs-cash monetisation decision.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm who can grant/adjust credits + approval rules',
      'Ensure every change writes to an auditable credit ledger',
    ],
    adminStoreRelation: 'Sets the balances the Store employer Credits widget reads.',
    related: ['emp-credits'],
  },
  {
    id: 'admin-orders',
    code: 'ADM-BILL-04',
    surface: `${S} · Products & billing`,
    title: 'Orders',
    status: 'be-migrated',
    summary: 'Order list + order detail + create order (billing connector).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'The billing connector: order list/detail + create-order (for the sales-assisted path where HQ raises the order).',
          'Data model migrated, but no payment gateway is wired — the pay → reconcile → fulfil → invoice loop is the missing piece.',
        ],
      },
      {
        heading: 'Standard order lifecycle',
        items: [
          'Draft → Pending payment → Paid → Fulfilled (product activated) → (Refunded / Cancelled).',
          'On Paid: trigger product fulfilment AND issue a VAT e-invoice (hóa đơn điện tử) — mandatory in VN.',
          'Reconcile against the gateway via signed webhooks + a daily settlement report.',
        ],
      },
    ],
    whatToBuild: [
      'Integrate the chosen VN gateway(s) (VNPay/MoMo/ZaloPay/bank) + signed-webhook reconciliation',
      'Order → fulfilment trigger (activate the purchased product) + refund/cancel path',
      'VAT e-invoice issuance on payment (licensed provider)',
      'Confirm self-serve (Store checkout) vs HQ-created orders vs hybrid',
    ],
    unknown: ['Payment gateway not wired — order fulfilment + e-invoice path unconfirmed.'],
    adminStoreRelation: 'Receives orders from the Store billing catalog; links to invoices + payments in Sales/CRM.',
    related: ['bill-catalog', 'admin-invoices', 'admin-payments', 'xc-payments'],
  },
  {
    id: 'admin-promotions',
    code: 'ADM-BILL-05',
    surface: `${S} · Products & billing`,
    title: 'Promotions',
    status: 'prototype',
    summary: 'Promotion management.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Prototype only (Prisma) — no Spring backend counterpart.',
          'If kept, needs a promo model: codes / auto-discounts, applicable products, validity window, usage limits.',
        ],
      },
    ],
    whatToBuild: [
      'Decide: promote to the real backend or drop (client Q)',
      'If kept: define promo model + apply logic at checkout + BE migration',
    ],
    unknown: ['No BE counterpart — confirm whether it stays prototype-only or gets promoted to the real backend.'],
    clientQuestions: ['Do Promotions get a real backend, or stay prototype-only?'],
    related: ['admin-catalog'],
  },

  // ── B3 · Jobs ─────────────────────────────────────────────────────────────
  {
    id: 'admin-job-list',
    code: 'ADM-JOB-01',
    surface: `${S} · Jobs`,
    title: 'Job list',
    status: 'be-migrated',
    summary: 'All job postings across the platform.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'HQ view of every posting (all employers). Same job entity as the employer console + Store, unfiltered.',
          'Decide whether HQ moderates/approves postings before they go live.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm filters/columns (employer, status, region, date)',
      'Decide posting moderation/approval flow (if any)',
    ],
    adminStoreRelation: 'Same job entity that the Store search and employer console read/write.',
    related: ['emp-jobs', 'js-search'],
  },
  {
    id: 'admin-job-detail',
    code: 'ADM-JOB-02',
    surface: `${S} · Jobs`,
    title: 'Job detail',
    status: 'be-migrated',
    summary: 'View / edit a posting.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'View/edit a single posting. Field schema must match the employer form + Admin “New job”.',
          'Title/description are multilingual (vi mandatory).',
        ],
      },
    ],
    whatToBuild: [
      'Keep the field schema aligned across the three job surfaces',
      'Per-language inputs for title/description',
    ],
    related: ['admin-job-list'],
  },
  {
    id: 'admin-job-applicants',
    code: 'ADM-JOB-03',
    surface: `${S} · Jobs`,
    title: 'Applicants board',
    status: 'be-migrated',
    summary: 'Per-job applicants board (HQ-side ATS view).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'HQ mirror of the employer ATS for a given job. Reads the same application + stage data.',
          'Decide read-only (oversight) vs editable (HQ can move applicants).',
        ],
      },
    ],
    whatToBuild: [
      'Decide read-only vs editable at HQ',
      'Keep stage model aligned with the employer ATS',
    ],
    adminStoreRelation: 'HQ mirror of the employer ATS; reads candidate application records.',
    related: ['emp-ats', 'js-apply'],
  },
  {
    id: 'admin-job-new',
    code: 'ADM-JOB-04',
    surface: `${S} · Jobs`,
    title: 'New job',
    status: 'be-migrated',
    summary: 'Multi-step job creation (incl. a step-4 preview).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Multi-step create wizard (with a step-4 preview). This is the canonical posting schema the employer form should mirror.',
          'Category/region options come from Master data.',
        ],
      },
    ],
    whatToBuild: [
      'Treat this schema as the single source; align employer form to it',
      'Wire category/region selects to Master data',
    ],
    related: ['admin-job-list', 'admin-master-data'],
  },

  // ── B4 · Resumes ─────────────────────────────────────────────────────────
  {
    id: 'admin-resumes',
    code: 'ADM-CV-01',
    surface: `${S} · Resumes`,
    title: 'Resume list',
    status: 'be-migrated',
    summary: 'All candidate resumes.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'HQ view of all candidate resumes. Sensitive PII — access should be permission-gated + audited.',
          'Ties into the CV-unlock model used by employer talent search.',
        ],
      },
    ],
    whatToBuild: [
      'Define who at HQ may view CVs + audit every view (privacy)',
      'Confirm relationship to the employer CV-unlock model',
    ],
    adminStoreRelation: 'Mirrors member-created resumes; ties into the CV-unlock model.',
    related: ['js-resumes', 'emp-talent-search'],
  },
  {
    id: 'admin-resume-detail',
    code: 'ADM-CV-02',
    surface: `${S} · Resumes`,
    title: 'Resume detail',
    status: 'be-migrated',
    summary: 'View a resume.',
    bbNotes: [
      { heading: 'Approach', items: ['Full resume view. Read-oriented; edits (if any) should be tightly scoped + audited.'] },
    ],
    whatToBuild: ['Confirm admin edit scope (view-only vs correct data)', 'Audit access to PII'],
    related: ['admin-resumes'],
  },
  {
    id: 'admin-resume-new',
    code: 'ADM-CV-03',
    surface: `${S} · Resumes`,
    title: 'New resume',
    status: 'be-migrated',
    summary: 'Create a resume record (admin-side).',
    bbNotes: [
      { heading: 'Approach', items: ['Admin-side resume creation (e.g. for assisted candidates). Same schema as the Store resume form.'] },
    ],
    whatToBuild: ['Confirm the admin-create use case with the client', 'Share the resume schema with the Store form'],
    related: ['admin-resumes'],
  },

  // ── B5 · Content ─────────────────────────────────────────────────────────
  {
    id: 'admin-banners',
    code: 'ADM-CNT-01',
    surface: `${S} · Content`,
    title: 'Banners & Popups',
    status: 'be-migrated',
    summary: 'Manage site banners and popups — one page, two placement kinds.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'ONE console page with a Banners / Popups switcher. Both are Display placement products: same COMPANY → PO → PRODUCT chain, same Draft → Schedule → Open → Expired lifecycle (derived from the dates, never typed), same separate Exposure switch. Backend migrated.',
          'Banner = placed in a named SLOT (square / long / hero) and backed by a paid ad product, so a slot booking is commercial inventory.',
          'Popup = targeted at an AUDIENCE and interrupts the user, so it adds a frequency cap, remembered dismissal, and a priority order — only ONE popup ever shows.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm banner slot types (square / long / hero) + scheduling + targeting',
      'Link banner slots to the paid “Main ad” / targeted-ad products',
      'Define popup targeting + frequency capping + the priority rule that picks the single winner',
      'Confirm popup dismissal / “don’t show again” behaviour',
    ],
    adminStoreRelation: 'Banners render in Store Home sections and Curation; popups are shown over the jobseeker site.',
    related: ['js-home', 'js-curation', 'bill-main-ad'],
  },
  {
    id: 'admin-pages',
    code: 'ADM-CNT-04',
    surface: `${S} · Content`,
    title: 'Pages',
    status: 'prototype',
    summary: 'CMS pages: list + detail.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Prototype CMS (Prisma). Would back the marketing/legal/guide pages + resume-template gallery + event landings.',
          'Big scope lever: a real CMS is significant build; “just banners + popups” is much less.',
        ],
      },
    ],
    whatToBuild: [
      'Decide CMS scope at launch (full CMS vs banners+popups only) — client Q',
      'If in scope: page model + i18n + versioning + BE migration',
    ],
    unknown: ['Prototype-only (Prisma). Do we need a full CMS at launch or just banners + popups?'],
    clientQuestions: ['Full CMS (boards / pages / blog) at launch, or just banners + popups?'],
    related: ['admin-blog', 'js-resume-templates'],
  },
  {
    id: 'admin-blog',
    code: 'ADM-CNT-05',
    surface: `${S} · Content`,
    title: 'Blog / articles',
    status: 'prototype',
    summary: 'Article surface (route /content/blog; model = article). Built but intentionally hidden from the menu pending backend migration.',
    bbNotes: [
      { heading: 'Approach', items: ['Article model exists but the menu entry is hidden pending BE migration. Overlaps with the career-info hub on the Store.'] },
    ],
    whatToBuild: ['Decide launch scope', 'If in scope: BE-migrate + unhide the menu + wire to the Store career-info hub'],
    unknown: ['Hidden pending BE migration.'],
    related: ['admin-pages', 'js-career-info'],
  },

  // ── B6 · Notifications (all prototype) ─────────────────────────────────────
  {
    id: 'admin-notif-templates',
    code: 'ADM-NOTIF-01',
    surface: `${S} · Notifications`,
    title: 'Templates',
    status: 'prototype',
    summary: 'Notification templates: list, detail, create.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Whole module is on the prototype DB. Templates define message content per channel + language, with variable interpolation ({{candidateName}}, {{jobTitle}}, …).',
          'Blocked on the channel + provider decision — that determines most of the build.',
        ],
      },
      {
        heading: 'Standard channels (VN market)',
        items: [
          'In-app (the store bell) · Email · Mobile push · SMS · Zalo ZNS (Zalo Notification Service).',
          'In VN, Zalo ZNS is a primary transactional channel — users prefer it; SMS is the common failover when Zalo/app is unavailable.',
          'Providers are typically CPaaS aggregators (Infobip / VietGuys / 8x8) for ZNS + SMS; a transactional email provider; a push service (FCM/APNs).',
        ],
      },
    ],
    whatToBuild: [
      'Decide channel set + provider(s): In-app · Email · Push · SMS · Zalo ZNS — client Q, blocker',
      'Template model: per-channel, per-language (vi/en/ko), variable interpolation; ZNS templates need Zalo OA approval',
      'Fallback chain (e.g. Zalo → SMS) for critical messages',
      'BE migration off the prototype DB',
    ],
    unknown: ['Entire module on prototype DB. Channel set + providers undecided.'],
    clientQuestions: ['Which channels do we send — In-app / Email / Push / SMS / Zalo ZNS? Which providers, and is a Zalo Official Account available?'],
    adminStoreRelation: 'Feeds the Store notification bell (in-app) plus email / push / SMS / Zalo to the candidate & employer.',
    externalSystems: ['Zalo ZNS', 'SMS / CPaaS', 'Email provider', 'Push (FCM/APNs)'],
    related: ['js-notifications', 'admin-notif-events', 'admin-notif-workflows'],
  },
  {
    id: 'admin-notif-events',
    code: 'ADM-NOTIF-02',
    surface: `${S} · Notifications`,
    title: 'Events',
    status: 'prototype',
    summary: 'Notification-triggering events.',
    bbNotes: [
      { heading: 'Approach', items: ['Catalogue of system events that can trigger notifications. Must map to real emitted events in Store/Admin.'] },
      {
        heading: 'Standard job-platform event catalogue',
        items: [
          'Candidate: application submitted · application viewed by employer · status changed (shortlisted / interview / offer / rejected) · new matching jobs (job alert / saved search) · employer message / interview invite · CV viewed by employer.',
          'Employer: new applicant · credit / order / payment events · job about to expire.',
          'Account/system: welcome + email verification · password reset · security alerts.',
        ],
      },
    ],
    whatToBuild: ['Define the trigger-event catalogue (standard set above)', 'Ensure Store/Admin actually emit those events', 'Per-event: which channels + which template', 'BE migration'],
    related: ['admin-notif-templates', 'admin-notif-workflows', 'js-notifications'],
  },
  {
    id: 'admin-notif-workflows',
    code: 'ADM-NOTIF-03',
    surface: `${S} · Notifications`,
    title: 'Workflows',
    status: 'prototype',
    summary: 'Notification workflows: list, detail, create.',
    bbNotes: [
      { heading: 'Approach', items: ['Routing rules: event → template → channel(s) → audience, with conditions + throttling. The glue between events and delivery.'] },
    ],
    whatToBuild: ['Define workflow rule model (routing + conditions + throttle)', 'BE migration + a runtime that executes workflows'],
    related: ['admin-notif-templates', 'admin-notif-events'],
  },
  {
    id: 'admin-notif-log',
    code: 'ADM-NOTIF-04',
    surface: `${S} · Notifications`,
    title: 'Delivery log',
    status: 'prototype',
    summary: 'Log of sent notifications.',
    bbNotes: [
      { heading: 'Approach', items: ['Record of every send + its outcome. Needs provider delivery/read receipts once a provider is chosen.'] },
    ],
    whatToBuild: ['Capture provider delivery/read receipts', 'Define retention + search/filter', 'BE migration'],
    related: ['admin-notif-templates'],
  },

  // ── B7 · Analytics ─────────────────────────────────────────────────────────
  {
    id: 'admin-analytics-dashboard',
    code: 'ADM-ANL-01',
    surface: `${S} · Analytics`,
    title: 'Analytics dashboard',
    status: 'be-migrated',
    summary: 'KPI overview with stat cards + sparklines (revenue live).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'KPI overview (stat cards + sparklines). Revenue is live; some series are still deterministic mock timeseries.',
          'Confirm the KPI set with leadership, then replace mock series with real aggregations.',
        ],
      },
    ],
    whatToBuild: [
      'Agree the launch KPI set',
      'Replace mock timeseries with real aggregations (which reports must be real at launch — client Q)',
    ],
    unknown: ['Some charts are deterministic mock timeseries.'],
    related: ['admin-revenue-report', 'js-behavior-tracking'],
  },
  {
    id: 'admin-sales-report',
    code: 'ADM-ANL-02',
    surface: `${S} · Analytics`,
    title: 'Sales report',
    status: 'built-mock',
    summary: 'Sales analytics.',
    bbNotes: [
      { heading: 'Approach', items: ['Currently mock timeseries. Needs a real sales-aggregation read model (by product, period, employer).'] },
    ],
    whatToBuild: ['Define sales dimensions/measures', 'BE: real aggregation read model', 'Confirm launch priority vs fast-follow'],
    unknown: ['Mixed — mock timeseries.'],
    clientQuestions: ['Which reports must show real data at launch vs can wait?'],
    related: ['admin-analytics-dashboard'],
  },
  {
    id: 'admin-recruit-report',
    code: 'ADM-ANL-03',
    surface: `${S} · Analytics`,
    title: 'Recruit report',
    status: 'built-mock',
    summary: 'Recruiting funnel analytics.',
    bbNotes: [
      { heading: 'Approach', items: ['Mock funnel today. Real version aggregates the application pipeline (views → applies → stages → hires).'] },
    ],
    whatToBuild: ['Define the funnel stages/measures', 'BE: aggregation from application + stage data'],
    unknown: ['Mixed — mock timeseries.'],
    related: ['admin-analytics-dashboard', 'emp-ats'],
  },
  {
    id: 'admin-revenue-report',
    code: 'ADM-ANL-04',
    surface: `${S} · Analytics`,
    title: 'Revenue report',
    status: 'be-migrated',
    summary: 'Revenue read model.',
    bbNotes: [
      { heading: 'Approach', items: ['Backed by a real revenue read model — the most complete analytics surface. Mostly confirmation work.'] },
    ],
    whatToBuild: ['Confirm revenue dimensions (product, period, currency) + reconciliation with orders'],
    related: ['admin-analytics-dashboard', 'admin-orders'],
  },
  {
    id: 'admin-user-behavior',
    code: 'ADM-ANL-05',
    surface: `${S} · Analytics`,
    title: 'User behavior',
    status: 'built-mock',
    summary: 'User-behaviour analytics.',
    bbNotes: [
      { heading: 'Approach', items: ['Mock today; should read the Store behaviour-tracking pipeline (clicks/views/searches). Privacy/consent applies.'] },
    ],
    whatToBuild: ['Connect to the behaviour-tracking pipeline', 'Define behaviour metrics', 'Confirm privacy/consent (VN)'],
    unknown: ['Mixed — mock timeseries.'],
    related: ['js-behavior-tracking'],
  },

  // ── B8 · Sales (CRM / pipeline) ─────────────────────────────────────────────
  {
    id: 'admin-sales-pipeline',
    code: 'ADM-CRM-01',
    surface: `${S} · Sales (CRM)`,
    title: 'Pipeline',
    status: 'be-migrated',
    summary: 'Kanban of customer deals grouped by stage; each column totals its deal value.',
    description:
      'The sales team’s home screen. Every deal is a card in one of six stage columns; a rep drags a card forward as the deal progresses. Reaching “Won” is the trigger to activate the company as a real customer (see Lead → customer activation).',
    uiFields: [
      {
        group: 'Board',
        items: [
          { name: 'Stage columns', type: 'enum', notes: 'Lead → Qualified → Proposal → Negotiation → Won / Lost' },
          { name: 'Column count + total ₫', type: 'derived', notes: 'Deal count and summed deal value per stage' },
          { name: 'View toggle', type: 'enum', notes: 'Board / list / grid' },
        ],
      },
      {
        group: 'Deal card',
        items: [
          { name: 'Company name', type: 'string', required: true },
          { name: 'Industry tag', type: 'enum', notes: 'Healthcare, IT, Real estate, Logistics, Retail, Education, Finance…' },
          { name: 'Deal value', type: 'money (₫)' },
          { name: 'Owner', type: 'ref(admin user)', notes: 'Sales rep the deal is assigned to' },
          { name: 'Last activity', type: 'relative date' },
          { name: 'Activity badges', type: 'counts', notes: 'Linked quotes / POs / invoices / contracts' },
        ],
      },
    ],
    behaviors: [
      'Filter by owner, industry, recency and min deal value; sort (default: updated-desc).',
      'Activity quick-filters: has quote / has PO / has invoice / has contract.',
      'Drag a card between stages to change its stage; moving to Won opens the activation flow.',
      '“New quote” / “Invoices” shortcuts jump to those sub-modules for the selected deal.',
    ],
    rules: [
      'A deal belongs to exactly one customer (company) and one owner.',
      'Won and Lost are terminal display columns; a Lost deal can be re-opened to an earlier stage.',
    ],
    backend: {
      dataModel: [
        { name: 'deal_id', type: 'uuid', required: true },
        { name: 'customer_id', type: 'ref(customer)', required: true },
        { name: 'stage', type: 'enum', required: true, notes: 'lead|qualified|proposal|negotiation|won|lost' },
        { name: 'value', type: 'money', notes: 'expected deal value' },
        { name: 'owner_id', type: 'ref(admin_user)' },
        { name: 'updated_at', type: 'timestamp' },
      ],
    },
    known: ['Backend migrated; board renders real deals grouped by stage.'],
    unknown: ['Exact stage names + whether stages are configurable per team.', 'Is deal value entered manually or rolled up from quotes?'],
    clientQuestions: ['Confirm the pipeline stage names and their order with the sales team.', 'Should deal value be typed by the rep, or computed from the accepted quote?'],
    whatToBuild: ['Confirm stages with sales', 'Wire drag-to-Won → activation flow', 'Confirm deal-value source (manual vs quote roll-up)'],
    adminStoreRelation: 'Deals reference the same customer record used across Companies + accounts.',
    related: ['admin-customers', 'admin-customer-activation', 'admin-quotes'],
  },
  {
    id: 'admin-customers',
    code: 'ADM-CRM-02',
    surface: `${S} · Sales (CRM)`,
    title: 'Customers',
    status: 'be-migrated',
    summary: 'The customer master — one company record that grows from lead to activated customer.',
    description:
      'This is the single source of truth for a company. A record is born here as a lead (sales-internal data only, no login, invisible to jobseekers). As it moves through the pipeline nothing is provisioned; only when the deal is Won and the rep activates it does the company gain a login (an account) and — if it posts jobs — a public company detail page. The Companies module (B1) is the filtered view of customers that reached that stage. The same record carries a CRM link throughout, so there is never a duplicate company.',
    uiFields: [
      {
        group: 'Customer record (CRM — internal only)',
        items: [
          { name: 'Legal name', type: 'string', required: true },
          { name: 'Tax code (MST)', type: 'string', notes: 'Used for de-duplication + VAT invoicing. Stored as the full string — 10 digits, or 10 + "-" + 3 for a branch (0301234567-001); the two are different, both-valid values' },
          { name: 'Parent company', type: 'ref(company)', notes: 'Optional; the direct parent in the corporate tree. One parent only, unlimited depth (parent → subsidiary → sub-subsidiary). Empty = a root' },
          { name: 'Affiliated companies', type: 'derived', notes: 'Read from the tree: the ancestor chain plus the direct children — rendered as the "Công ty liên kết" block on the record' },
          { name: 'Industry', type: 'enum' },
          { name: 'Address / location', type: 'string' },
          { name: 'Primary contact', type: 'person', notes: 'Name, role, phone, email' },
          { name: 'Lifecycle status', type: 'enum', required: true, notes: 'Lead → Qualified → … → Won → Active customer / Lost' },
          { name: 'Owner', type: 'ref(admin user)', notes: 'Assigned by hand, per company — the corporate tree never propagates it; a parent and its subsidiary may belong to different reps' },
          { name: 'Linked account', type: 'ref(account)', notes: 'Set at activation; empty until then — independent of customer status' },
          { name: 'Linked company profile', type: 'ref(company)', notes: 'Set only if the customer posts jobs' },
        ],
      },
    ],
    behaviors: [
      'List is searchable/filterable by owner, industry, lifecycle status and activity (has quote/PO/invoice/contract).',
      'Row → customer detail: contact info, deal(s), quote/PO/invoice/payment/contract history, and the linked account/company (if any).',
      'The record carries a “Công ty liên kết / Affiliated companies” block: a breadcrumb of the ancestor chain and a list of direct children, each row showing that company’s own tax code and linking through to its record. One level up, one level down; a “Xem sơ đồ tập đoàn” link opens the full tree.',
      'Each affiliate row is badged automatically from the tax codes — same 10-digit root as the parent → “Chi nhánh / Branch”, a different tax code → “Công ty con / Subsidiary”. Never typed by hand.',
      'The list can be filtered to a corporate group (every company under a chosen root), ignoring the owner filter — a group routinely spans reps.',
      'From a Won customer, “Activate” launches the account-creation flow (see Lead → customer activation).',
    ],
    rules: [
      'A company is always created here first — the CRM is the single front door, even for a company that arrives already large.',
      'Parent and subsidiary are SEPARATE records with separate tax codes — a subsidiary is its own legal entity. Only a branch shares its parent’s tax code, and then only the -001 suffix differs.',
      'De-duplication at creation has three branches: (1) the full tax code already exists → block, a real duplicate; (2) same 10-digit root, different suffix → do NOT block, offer to link as a branch; (3) different tax code, near-identical legal name → do NOT block, offer to link as a subsidiary. Subsidiaries are routinely named “… Miền Nam” / “… Hà Nội”, so a name match alone is never a duplicate.',
      'The parent link inherits NOTHING — packages/quota, contracts, quotations, VAT invoices, users, the public page, deals and the sales owner all stay per company, on its own tax code. A subsidiary can never spend its parent’s quota.',
      'Tree integrity: at most one direct parent; a company can never be its own ancestor (reject direct and indirect cycles); depth soft-capped around 5 levels.',
      'A lead has no login and is not shown to jobseekers; those exist only after activation.',
      'Customer ↔ account is 1:1; a customer has a public company profile only when it uses Job Posting.',
    ],
    backend: {
      dataModel: [
        { name: 'customer_id', type: 'uuid', required: true },
        { name: 'legal_name', type: 'string', required: true },
        { name: 'tax_code', type: 'string', notes: 'unique on the FULL string (10 digits, or 10 + "-" + 3 for a branch); index the 10-digit root separately — that index powers the "is this a branch of…" prompt' },
        { name: 'parent_company_id', type: 'ref(company)', notes: 'self-reference, nullable; null = root. Unlimited depth. Enforce no-cycle on write by walking the ancestors — an FK alone will not catch an indirect cycle' },
        { name: 'lifecycle_status', type: 'enum', required: true },
        { name: 'account_id', type: 'ref(account)', notes: 'nullable until activation' },
        { name: 'company_id', type: 'ref(company)', notes: 'nullable; set when Job Posting is enabled' },
        { name: 'owner_id', type: 'ref(admin_user)' },
      ],
      notes: 'Same underlying company entity as B1 Companies — Companies is a filtered/enriched view, not a separate table. The corporate hierarchy lives in that same table as a self-referencing parent_company_id; there is deliberately NO company_group table, because nothing is owned, shared or billed at group level, so a group has no data of its own. A group is a recursive CTE from a chosen root.',
    },
    known: ['Backend migrated; customer records exist and link to deals.'],
    unknown: [
      'Is the CRM customer the same entity as a B1 company, or a separate record that links on activation? (Recommended: same entity.)',
      'How an inbound company that signs up directly (not via sales) is represented — auto-create a CRM record?',
    ],
    clientQuestions: [
      'Confirm: is a CRM customer the same record as a Company, or two records linked at activation?',
      'When a company arrives outside sales (self-signup), should the system auto-create a CRM customer so “always via CRM” still holds?',
      'What are the required fields to create a lead vs to activate a customer?',
      'Does not block the build — the model handles either answer: are there customers that are BRANCHES (same tax code as the parent, only the -001 suffix differs) needing their own account and their own invoices? Useful for expectations only.',
    ],
    whatToBuild: [
      'Confirm customer ↔ company ↔ account relationship (recommend: one company record, lifecycle status)',
      'Corporate tree: parent_company_id self-reference, unlimited depth, cycle guard',
      '“Công ty liên kết” block on the record (breadcrumb up + direct children, auto-badged branch vs subsidiary) and a group filter on the list',
      'De-duplication rules — three branches (full tax code blocks; shared tax root or similar name offers an affiliate link)',
      'Lifecycle status model + who can advance it',
    ],
    adminStoreRelation: 'The activated customer becomes the company shown in the Store companies directory (if it posts jobs).',
    related: ['admin-sales-pipeline', 'admin-customer-activation', 'admin-company-list', 'admin-company-new'],
  },
  {
    id: 'admin-customer-activation',
    code: 'ADM-CRM-02b',
    surface: `${S} · Sales (CRM)`,
    title: 'Lead → customer activation',
    status: 'not-started',
    summary: 'The flow that turns a Won deal into a live customer: create the account, pick products, and (only for Job Posting) create the company detail page.',
    description:
      'This is the hand-off between Sales and the rest of the platform, and the answer to “what do I do after a lead becomes a customer?”. It is a guided flow, not a single screen. The product choice branches the flow: Job Posting requires a public company page; Resume Search alone does not.',
    sections: [
      {
        heading: 'The five steps',
        items: [
          '1 · Lead in CRM — company tracked with internal data only. No login, not visible to jobseekers.',
          '2 · Deal won — the rep moves the deal to Won. Nothing is provisioned automatically; an “Activate customer” action appears.',
          '3 · Create account — from the Won customer, create an account in Account management, pre-filled from and linked to the CRM record (no re-typing). This is where the company gets a login.',
          '4 · Choose products — select what they bought: Job Posting and/or Resume Search.',
          '5 · Company detail page — required only if Job Posting is on: fill the public profile jobseekers see. If Resume Search only, skip — they stay invisible to jobseekers.',
        ],
      },
      {
        heading: 'The branch (why the UI must be explicit)',
        items: [
          'Job Posting → a public Company Detail Page is mandatory (logo, about, benefits, jobs) — it renders on the jobseeker side.',
          'Resume Search only → no public page needed; the account can search/contact candidates immediately.',
          'A customer can add Job Posting later — that is the point at which the company page becomes required.',
        ],
      },
    ],
    behaviors: [
      '“Activate customer” is enabled only when the deal is in the Won stage.',
      'Activation creates the account and links it to the CRM customer (customer.account_id set).',
      'Selecting Job Posting marks the company profile as required and routes to the company-detail form; the account cannot post jobs until the profile is complete.',
      'Selecting Resume Search only completes activation immediately with no company profile.',
    ],
    rules: [
      'One account per customer (1:1), created only at/after Won.',
      'Public company profile exists only for customers with Job Posting enabled.',
      'Activation must be idempotent — re-running on an already-active customer does not create a second account.',
    ],
    known: ['The desired end-to-end flow is agreed as the working model (validate with client).'],
    unknown: [
      'Exactly which steps auto-fire on Won vs are manual rep actions.',
      'Whether account creation lives in a dedicated Account-management module or inside the customer detail.',
      'Minimum required fields to publish a company detail page.',
    ],
    clientQuestions: [
      'On “Won”, what should happen automatically vs be a manual step (account creation, product selection, notifications)?',
      'Confirm the product list that drives the branch (Job Posting, Resume Search, others?).',
      'Who fills the company detail page — HQ sales, or the company after they get their login?',
    ],
    whatToBuild: [
      'Design the guided activation flow (Won → account → products → company page)',
      'Account entity + customer↔account link',
      'Product-selection step that gates the company-profile requirement',
      'Wire Job Posting → required company detail page; Resume Search → skip',
    ],
    adminStoreRelation: 'The output of this flow is what appears on the Store: an employer account, and (for Job Posting) a public company profile + jobs.',
    related: ['admin-customers', 'admin-sales-pipeline', 'admin-company-new', 'admin-company-detail', 'emp-talent-search', 'bill-catalog'],
  },
  {
    id: 'admin-quotes',
    code: 'ADM-CRM-03',
    surface: `${S} · Sales (CRM)`,
    title: 'Quotes',
    status: 'be-migrated',
    summary: 'Price quotes to a customer, with a full status lifecycle.',
    description: 'A quote proposes catalog line items + total to a customer and moves through a status lifecycle. An accepted quote is the basis for a PO / order and, ultimately, an invoice.',
    uiFields: [
      {
        group: 'Quote list',
        items: [
          { name: 'Quote code', type: 'string', required: true },
          { name: 'Customer', type: 'ref(customer)', required: true },
          { name: 'Total (₫)', type: 'money' },
          { name: 'Status', type: 'enum', notes: 'Draft · Sent · Accepted · Rejected · Expired' },
          { name: 'Valid until', type: 'date' },
          { name: 'Created', type: 'date' },
        ],
      },
    ],
    behaviors: [
      'Create → add catalog line items → send → customer accepts/rejects; expires past “valid until”.',
      'An accepted quote can convert to a PO / order.',
    ],
    rules: ['Line items come from the product catalog.', 'Only Draft quotes are editable; Sent quotes are versioned/re-issued.'],
    known: ['Backend migrated; status lifecycle (Draft/Sent/Accepted/Rejected/Expired) present.'],
    unknown: ['Quote → order/invoice conversion path.', 'PDF/export + e-signature need?'],
    whatToBuild: ['Define quote → order/invoice conversion', 'Line items from the product catalog', 'Confirm PDF/export + validity rules'],
    related: ['admin-invoices', 'admin-purchase-orders', 'admin-catalog'],
  },
  {
    id: 'admin-invoices',
    code: 'ADM-CRM-04',
    surface: `${S} · Sales (CRM)`,
    title: 'Invoices',
    status: 'be-migrated',
    summary: 'Invoices with amount collected, due date and overdue tracking.',
    description: 'Invoices bill the customer against a PO/order. Each tracks total vs amount collected and a payment status; VN e-invoice (hóa đơn điện tử) compliance is likely required.',
    uiFields: [
      {
        group: 'Invoice list',
        items: [
          { name: 'Invoice code', type: 'string', required: true },
          { name: 'Customer', type: 'ref(customer)', required: true },
          { name: 'Total (₫)', type: 'money' },
          { name: 'Collected (₫)', type: 'money', notes: 'Sum of payments applied' },
          { name: 'Status', type: 'enum', notes: 'Draft · Issued · Paid · Partially paid · Overdue' },
          { name: 'Due date', type: 'date' },
        ],
      },
    ],
    behaviors: ['Issue → collect payments → auto-flip to Paid/Partially paid; past due date → Overdue.'],
    rules: ['Status is derived from payments applied + due date.', 'VN VAT e-invoice issued on payment (mandatory).'],
    known: ['Backend migrated; status + collected tracking present.'],
    unknown: ['VN e-invoice provider + compliance.', 'Link path invoice ↔ order ↔ payments.'],
    clientQuestions: ['Which licensed VN e-invoice provider do we integrate?'],
    whatToBuild: ['Confirm VN e-invoice compliance + provider', 'Link invoices to orders + payments'],
    related: ['admin-quotes', 'admin-purchase-orders', 'admin-orders', 'admin-payments'],
  },
  {
    id: 'admin-purchase-orders',
    code: 'ADM-CRM-05',
    surface: `${S} · Sales (CRM)`,
    title: 'Purchase orders',
    status: 'built-mock',
    summary: 'Customer POs tracked from quote to invoice.',
    description: 'A PO records the customer’s commitment to buy (typically from an accepted quote) and links forward to one or more invoices.',
    uiFields: [
      {
        group: 'PO list',
        items: [
          { name: 'PO code', type: 'string', required: true },
          { name: 'Customer', type: 'ref(customer)', required: true },
          { name: 'Total (₫)', type: 'money' },
          { name: 'Status', type: 'enum', notes: 'Draft · Sent · Accepted' },
          { name: 'Invoices', type: 'count', notes: 'Number of invoices raised against this PO' },
          { name: 'Issue date', type: 'date' },
        ],
      },
    ],
    behaviors: ['Created from an accepted quote; once accepted, invoices are raised against it.'],
    known: ['List UI + statuses exist on mock data.'],
    unknown: ['Backend model + approval flow.', 'In launch scope? (PO → payment → contract cluster needs BE together.)'],
    clientQuestions: ['Are purchase orders / payments / contracts in launch scope? If yes they need backend build (svn-be) — significant effort.'],
    whatToBuild: ['Confirm launch scope', 'Define PO model + approval flow', 'Quote → PO conversion + PO → invoice link', 'BE build in svn-be'],
    related: ['admin-quotes', 'admin-invoices', 'admin-payments', 'admin-contracts'],
  },
  {
    id: 'admin-payments',
    code: 'ADM-CRM-06',
    surface: `${S} · Sales (CRM)`,
    title: 'Payments',
    status: 'built-mock',
    summary: 'Payments recorded against issued invoices.',
    description: 'A payment applies an amount (by method) to an invoice; the invoice’s collected total and status update accordingly. Reconciles against the payment gateway once wired.',
    uiFields: [
      {
        group: 'Payment list',
        items: [
          { name: 'Reference', type: 'string', required: true, notes: 'e.g. PAY-1039' },
          { name: 'Customer', type: 'ref(customer)', required: true },
          { name: 'Amount (₫)', type: 'money' },
          { name: 'Method', type: 'enum', notes: 'Cash · Bank transfer · Credit card' },
          { name: 'Date', type: 'date' },
          { name: 'Invoice', type: 'ref(invoice)', notes: 'Invoice the payment is applied to' },
        ],
      },
    ],
    behaviors: ['Recording a payment updates the linked invoice’s collected amount + status.'],
    known: ['List UI + methods + invoice link exist on mock data.'],
    unknown: ['Backend model + gateway reconciliation.'],
    whatToBuild: ['Confirm scope', 'Payment record model + apply-to-invoice logic', 'Gateway reconciliation (signed webhooks)', 'BE build in svn-be'],
    related: ['admin-invoices', 'admin-purchase-orders', 'xc-payments'],
  },
  {
    id: 'admin-contracts',
    code: 'ADM-CRM-07',
    surface: `${S} · Sales (CRM)`,
    title: 'Contracts',
    status: 'built-mock',
    summary: 'Customer contracts with value and validity period.',
    description: 'A contract is the signed agreement tied to a customer, with a value and a start/end validity window; possibly e-signature + document storage.',
    uiFields: [
      {
        group: 'Contract list',
        items: [
          { name: 'Contract code', type: 'string', required: true },
          { name: 'Customer', type: 'ref(customer)', required: true },
          { name: 'Value (₫)', type: 'money' },
          { name: 'Status', type: 'enum', notes: 'Draft · Active · Expired' },
          { name: 'Start / End', type: 'date range' },
        ],
      },
    ],
    behaviors: ['Draft → Active on signing; auto-flips to Expired past the end date.'],
    known: ['List UI + statuses exist on mock data.'],
    unknown: ['Backend model.', 'E-signature + document storage in scope?'],
    clientQuestions: ['Do contracts need e-signature and document storage, or just record-keeping?'],
    whatToBuild: ['Confirm scope', 'Define contract model (+ e-sign / document storage?)', 'BE build in svn-be'],
    related: ['admin-purchase-orders', 'admin-customers'],
  },

  // ── B9 · System settings ─────────────────────────────────────────────────
  {
    id: 'admin-staff',
    code: 'ADM-SYS-00',
    surface: `${S} · System settings`,
    title: 'Staff directory',
    status: 'be-migrated',
    summary: 'Master list of HQ people (name · email · phone · department).',
    description:
      'The single registry of Saramin HQ staff. A person is added once here — name, email, phone, department — and that record is reused everywhere: creating an operator (console login) picks a staff member from this list, and CRM assigns companies to a sales staff member as their owner. Adding someone here grants no access on its own.',
    uiFields: [
      {
        group: 'Staff member',
        items: [
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'email', required: true, notes: 'unique; becomes the login if they are later made an operator' },
          { name: 'phone', type: 'string', notes: 'contact number' },
          { name: 'department', type: 'ref → Department', notes: 'org unit (System → Departments)' },
          { name: 'title', type: 'string', notes: 'job title, e.g. Account executive' },
        ],
      },
    ],
    behaviors: [
      'Add a staff member with name + email (phone / department / title optional).',
      'A staff row is the source for two things: Users → “Create operator” selects a staff member from a dropdown, and CRM company ownership assigns a company to a sales staff member.',
      'Console access is shown per row (their operator role, or “No access”) but is granted in Users, not here.',
      'For Sales staff, the number of CRM companies they own is shown.',
      'Remove = deactivate, never a hard delete — historical CRM ownership and the audit trail must survive.',
    ],
    rules: [
      'Email is unique across staff and is the login identity if the person becomes an operator.',
      'Being in the directory ≠ having console access — an operator record (with a role) is separate.',
      'A staff member with owned companies or an active operator login cannot be hard-deleted; deactivate instead.',
    ],
    related: ['admin-users', 'admin-roles', 'admin-departments'],
    clientQuestions: [
      'Is staff created manually here, or synced from an HR system / directory (e.g. Google Workspace)?',
      'Can a staff member belong to more than one department?',
    ],
  },
  {
    id: 'admin-roles',
    code: 'ADM-SYS-01',
    surface: `${S} · System settings`,
    title: 'Roles & permissions',
    status: 'be-migrated',
    summary: 'Role list + detail; permission grants (resource:action).',
    description:
      'Step 1 of the operator lifecycle — a role is defined before any operator can be assigned it. A role is a permission tree: for every page/resource, pick None, Read (view only), or Read & write (create / edit / delete). Group- and "apply to all" toggles cascade to the rows below them. Saved roles are then assigned to operators in System → Users.',
    behaviors: [
      'All roles are managed by the team — there is no separate locked "system" role type. Every role can be created, edited, duplicated, or deleted.',
      'A set of sensible defaults is seeded (e.g. Super admin, Sales, Operations), but they are ordinary editable roles, not protected ones.',
      'Duplicating an existing role is the quickest way to create a new one — copy, rename, adjust the grants.',
      'A role cannot be deleted while operators are still assigned to it; its operator count is shown, and the operators must be reassigned first.',
      'Lockout guard: at least one role must always retain full access (roles & operator management), so the last full-access role cannot be downgraded or deleted.',
    ],
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'The permission engine exists (resource:action grants) and is backend-migrated. What is missing is the actual role matrix.',
          'Needs sign-off on the admin personas (sales, ops, content, super-admin) and what each can do.',
        ],
      },
    ],
    whatToBuild: [
      'Define the role matrix / personas (client sign-off) — client Q',
      'Seed default roles + map every module’s resource:action grants',
    ],
    unknown: ['The actual role matrix (sales / ops / content / super-admin) needs sign-off.'],
    clientQuestions: ['Who are the admin user roles / personas, and what does each get access to?'],
    related: ['admin-users'],
  },
  {
    id: 'admin-users',
    code: 'ADM-SYS-02',
    surface: `${S} · System settings`,
    title: 'Users',
    status: 'be-migrated',
    summary: 'Admin user management + users-roles assignment.',
    description:
      'Internal HQ operators. Each operator is assigned exactly one role that controls what they can see and do (see Roles & permissions). Creating an operator emails them a one-time invite link and they set their own password — no one sets it for them. This uses the same invitation flow and statuses as the company HR Manager / HR Specialist invite, so there is one consistent pattern across the product.',
    sections: [
      {
        heading: 'Setup flow (in order)',
        items: [
          '1. Define the role first — in Roles & permissions, set None / Read / Read & write per page. The role must exist before it can be assigned.',
          '2. Create the operator — enter full name + work email.',
          '3. Assign a role — pick one of the saved roles.',
          '4. Send the invite — an activation email goes out; the operator clicks the link and sets their own password.',
        ],
      },
    ],
    behaviors: [
      'Status = Pending immediately after the invite is sent — the operator has not yet activated. Last-login shows "—".',
      'Status flips to Active once the operator opens the invite link and sets a password.',
      'Pending rows can be Resent (new link) or Cancelled (revoke the invite).',
      'Active rows can have their role changed, or be Disabled.',
      'Remove = Disable, never a hard delete, so the audit trail stays intact. Disabled operators can be Re-enabled.',
      'Invite links are single-use and time-limited (confirm expiry window with client).',
    ],
    bbNotes: [
      { heading: 'Approach', items: ['Admin user CRUD + role assignment. Confirm the auth story (SSO? shared with Common?) and user lifecycle (invite, disable). Mirror the company HR Manager / HR Specialist invite flow for consistency.'] },
    ],
    whatToBuild: ['Confirm admin auth (SSO vs local)', 'User lifecycle: invite / disable / re-enable / resend', 'Role assignment UI', 'Invite email + activation (set-own-password) link', 'Invite-link expiry window — client Q'],
    clientQuestions: ['How long should an operator invite link stay valid before it expires?'],
    related: ['admin-roles'],
  },
  {
    id: 'admin-master-data',
    code: 'ADM-SYS-03',
    surface: `${S} · System settings`,
    title: 'Master data',
    status: 'be-migrated',
    summary: 'Reference / master data management (categories, locations, etc.).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Reference data (categories, locations, industries, career levels, education) that powers Store search filters + job form dropdowns.',
          'These values are multilingual (vi mandatory) and must stay consistent across Store + Admin.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm the full list of master-data domains',
      'Per-language values (vi required)',
      'Verify Store filters + job forms read from here',
    ],
    adminStoreRelation: 'Powers Store search filters and dropdowns.',
    related: ['js-search', 'admin-job-new'],
  },
  {
    id: 'admin-audit-log',
    code: 'ADM-SYS-04',
    surface: `${S} · System settings`,
    title: 'Audit log',
    status: 'be-migrated',
    summary: 'Immutable log of admin actions.',
    bbNotes: [
      { heading: 'Approach', items: ['Immutable record of admin actions. Confirm which actions are audited, retention period, and whether export is needed.'] },
    ],
    whatToBuild: ['Confirm audited action coverage + retention', 'Search/filter + export', 'Ensure PII-view actions (resumes) are audited'],
    related: ['admin-users', 'admin-resumes'],
  },
  {
    id: 'admin-environment',
    code: 'ADM-SYS-05',
    surface: `${S} · System settings`,
    title: 'Environment',
    status: 'be-migrated',
    summary: 'Environment / config settings.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Config / environment settings. This is the natural home for the Store “live-features” flag registry that flips a screen from mock to real data.',
          'Confirm which flags/config are safe to expose in the UI vs env-only.',
        ],
      },
    ],
    whatToBuild: [
      'Define the feature-flag / config registry (ties to Store live-features)',
      'Decide UI-editable vs env-only config',
    ],
    adminStoreRelation: 'Feature flags here gate which Store screens use real data vs mock.',
    related: ['shared-i18n', 'xc-backend-readiness'],
  },
  {
    id: 'admin-departments',
    code: 'ADM-SYS-06',
    surface: `${S} · System settings`,
    title: 'Departments',
    status: 'prototype',
    summary: 'Org departments.',
    bbNotes: [
      { heading: 'Approach', items: ['Prototype only (Prisma) — no BE counterpart. Org-department reference data (likely for admin-user org structure).'] },
    ],
    whatToBuild: ['Decide: promote to real backend or drop', 'If kept: define usage + BE migration'],
    unknown: ['No BE counterpart — confirm whether it stays prototype-only.'],
    related: ['admin-users'],
  },
]
