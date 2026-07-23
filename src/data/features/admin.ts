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
    title: 'Company list',
    status: 'be-migrated',
    summary: 'Browse / manage all companies.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Searchable, paginated table of all companies; row → company detail. Already on the real backend.',
          'This master record powers the Store companies directory — the two must stay in sync.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm list columns + filters (industry, size, status) with the client',
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
      'Standard company-profile schema (header, about, why-join-us, benefits, photos, reviews)',
      'If reviews launch: review model (overall + sub-ratings) + moderation queue (approve/reject/report)',
    ],
    adminStoreRelation: 'Edits here surface on the Store company profile page; only approved reviews are shown.',
    related: ['admin-company-list', 'admin-company-new', 'js-companies', 'xc-ugc'],
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
          'Guard against duplicates (tax code / name).',
        ],
      },
    ],
    whatToBuild: [
      'Field validation + duplicate detection (tax code / registered name)',
      'Confirm required vs optional fields at creation',
    ],
    related: ['admin-company-list'],
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
    title: 'Banners',
    status: 'be-migrated',
    summary: 'Manage site banners.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'CRUD banners that render in Store Home sections + Curation. Backend migrated.',
          'Likely needs slot types + scheduling (start/end) + targeting, and a link to paid ad products.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm banner slot types (square / long / hero) + scheduling + targeting',
      'Link banner slots to the paid “Main ad” / targeted-ad products',
    ],
    adminStoreRelation: 'Banners render in Store Home sections and Curation.',
    related: ['js-home', 'js-curation', 'bill-main-ad'],
  },
  {
    id: 'admin-popups',
    code: 'ADM-CNT-02',
    surface: `${S} · Content`,
    title: 'Popups',
    status: 'be-migrated',
    summary: 'Manage site popups.',
    bbNotes: [
      { heading: 'Approach', items: ['CRUD site popups. Needs targeting (audience/page), scheduling, and frequency capping (don’t re-show).'] },
    ],
    whatToBuild: ['Define targeting + scheduling + frequency capping', 'Confirm dismissal/“don’t show again” behaviour'],
    related: ['admin-banners'],
  },
  {
    id: 'admin-boards',
    code: 'ADM-CNT-03',
    surface: `${S} · Content`,
    title: 'Boards',
    status: 'prototype',
    summary: 'Content boards: list + detail.',
    bbNotes: [
      { heading: 'Approach', items: ['Prototype only (Prisma). Content-board model (e.g. notices / help boards). Needs BE migration if in launch scope.'] },
    ],
    whatToBuild: ['Decide launch scope vs later', 'If in scope: define content model + BE migration'],
    unknown: ['Prototype-only (Prisma).'],
    related: ['admin-pages', 'js-career-info'],
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
    related: ['admin-boards', 'admin-blog', 'js-resume-templates'],
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
    summary: 'Sales pipeline overview (kanban).',
    bbNotes: [
      { heading: 'Approach', items: ['Kanban of sales opportunities by stage. Backend migrated. Links out to customers → quotes → invoices.'] },
    ],
    whatToBuild: ['Confirm pipeline stages with the sales team', 'Wire opportunity → quote → invoice transitions'],
    related: ['admin-customers', 'admin-quotes'],
  },
  {
    id: 'admin-customers',
    code: 'ADM-CRM-02',
    surface: `${S} · Sales (CRM)`,
    title: 'Customers',
    status: 'be-migrated',
    summary: 'Customer list + detail (CRM).',
    bbNotes: [
      { heading: 'Approach', items: ['CRM customer records. Clarify the relationship to Companies + employer accounts (is a CRM customer the same entity as a company?).'] },
    ],
    whatToBuild: ['Define customer ↔ company ↔ employer-account relationship', 'De-duplication rules'],
    related: ['admin-sales-pipeline', 'admin-company-list'],
  },
  {
    id: 'admin-quotes',
    code: 'ADM-CRM-03',
    surface: `${S} · Sales (CRM)`,
    title: 'Quotes',
    status: 'be-migrated',
    summary: 'Quote list, detail, create.',
    bbNotes: [
      { heading: 'Approach', items: ['Quote CRUD. Needs a quote → order/invoice conversion path and product-catalog line items.'] },
    ],
    whatToBuild: ['Define quote → order/invoice conversion', 'Line items from the product catalog', 'PDF/export?'],
    related: ['admin-invoices', 'admin-catalog'],
  },
  {
    id: 'admin-invoices',
    code: 'ADM-CRM-04',
    surface: `${S} · Sales (CRM)`,
    title: 'Invoices',
    status: 'be-migrated',
    summary: 'Invoice list + detail.',
    bbNotes: [
      { heading: 'Approach', items: ['Invoice records tied to orders/quotes. VN e-invoice (hóa đơn điện tử) compliance is likely required — confirm.'] },
    ],
    whatToBuild: ['Confirm VN e-invoice compliance + provider', 'Link invoices to orders + payments'],
    related: ['admin-quotes', 'admin-orders', 'admin-payments'],
  },
  {
    id: 'admin-purchase-orders',
    code: 'ADM-CRM-05',
    surface: `${S} · Sales (CRM)`,
    title: 'Purchase orders',
    status: 'empty-seam',
    summary: 'PO list + detail.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Empty placeholder — route/menu exists, no backend. Real build needed in svn-be if in scope.',
          'Part of the PO → payment → contract cluster that all need backend build together.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm launch scope (client Q) — significant backend effort if yes',
      'Define the PO model + approval flow',
      'BE build in svn-be',
    ],
    unknown: ['Empty placeholder — awaiting BE. In launch scope?'],
    clientQuestions: ['Are purchase orders / payments / contracts in launch scope? If yes, they need backend build (svn-be) — significant effort.'],
    related: ['admin-payments', 'admin-contracts'],
  },
  {
    id: 'admin-payments',
    code: 'ADM-CRM-06',
    surface: `${S} · Sales (CRM)`,
    title: 'Payments',
    status: 'empty-seam',
    summary: 'Payment records.',
    bbNotes: [
      { heading: 'Approach', items: ['Empty placeholder. Would record payments against invoices/orders and reconcile with the payment gateway.'] },
    ],
    whatToBuild: ['Confirm scope', 'Define payment record model + gateway reconciliation', 'BE build in svn-be'],
    unknown: ['Empty placeholder — awaiting BE.'],
    related: ['admin-purchase-orders', 'admin-invoices'],
  },
  {
    id: 'admin-contracts',
    code: 'ADM-CRM-07',
    surface: `${S} · Sales (CRM)`,
    title: 'Contracts',
    status: 'empty-seam',
    summary: 'Contract records.',
    bbNotes: [
      { heading: 'Approach', items: ['Empty placeholder. Contract records tied to customers/quotes; possibly e-signature + document storage.'] },
    ],
    whatToBuild: ['Confirm scope', 'Define contract model (+ e-sign / document storage?)', 'BE build in svn-be'],
    unknown: ['Empty placeholder — awaiting BE.'],
    related: ['admin-purchase-orders'],
  },

  // ── B9 · System settings ─────────────────────────────────────────────────
  {
    id: 'admin-roles',
    code: 'ADM-SYS-01',
    surface: `${S} · System settings`,
    title: 'Roles & permissions',
    status: 'be-migrated',
    summary: 'Role list + detail; permission grants (resource:action).',
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
    bbNotes: [
      { heading: 'Approach', items: ['Admin user CRUD + role assignment. Confirm the auth story (SSO? shared with Common?) and user lifecycle (invite, disable).'] },
    ],
    whatToBuild: ['Confirm admin auth (SSO vs local)', 'User lifecycle: invite / disable / reset', 'Role assignment UI'],
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
