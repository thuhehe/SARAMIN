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
  owner: 'Luan',
  requirements: [
    {
      label: 'What this module is',
      text: 'Admin-only. Manage sellable products, bundle them into packages with price / duration / quota, and feed the Company purchasing surface.',
    },
    {
      label: 'Product types in the catalog',
      text: 'FOUR types, derived from the client Products deck by grouping its ~24 line items on HOW each is fulfilled. The type is the discriminator: it decides which fulfilment fields apply, so the create form asks for different things per type. Each product carries a price (₫), its fulfilment and an Active / Inactive status.',
      table: {
        cols: ['Type', 'Deck items', 'Fulfilment mechanic'],
        rows: [
          ['Job posting', 'Basic · Basic Plus · Distinction · Top Job', 'N posting slots; publishing a job spends one. THIS product is the tier definition — display days, refresh cadence, styling and the placements it feeds all live on it.'],
          ['CV search', 'COMBO 30 / 50 / 100 / 300', 'Unlock quota + validity, decremented per CV opened.'],
          ['Placement booking', 'Main banner · Công ty nổi bật · Top Companies · adsense (home + search) · Highlight Company (search) · homepage pop-up · the premium fixed positions', 'A time window on a named slot, capacity-capped — needs an availability calendar.'],
          ['Manual service', 'Facebook fanpage post · Email Marketing / Job Alert banner', 'Ops fulfils it — opens a task (Requested → Scheduled → Delivered) with proof, NOT an auto-provisioned entitlement.'],
        ],
      },
      items: [
        'Job-posting tiers exposed per job: Basic · Basic Plus · Distinction · Top Job (plus Free for unpaid posts) — the tier drives visibility / ranking on the jobseeker site (see Job management).',
        'ONE product per capability. The current CRM sells Basic Plus as four separate SKUs (Basic Plus SMEs 3.949.000 · Basic Plus Enterprise 5.544.000 · Basic Plus Job 6.100.000 · Basic Plus 15 days 30.000.000). Segment and duration are a PRICE LIST on the product, not extra products — otherwise what a tier grants is defined in four places and drifts.',
        'THERE IS NO SEPARATE TIER-CONFIG SCREEN. A Job posting product IS its tier definition: display days, auto-refresh cadence, max skill tags, title styling, the placements it feeds and for how many days. Because segments are a price list rather than extra products, there is exactly one Top Job record, so what Top Job grants can only be defined in one place.',
        'ATTACHABILITY IS A FLAG, NOT A TYPE. “Add-on” was a fifth type until we noticed it describes how a thing is SOLD, not what it is: an email blast is a Manual service whether sold alone or included in Top Job; a premium fixed position is a Placement either way. So each product carries `standalone` — false means it exists with its own definition but may never be a quotation line on its own.',
        'A Job posting product carries `includes[]` — references to Placement and Manual service products it grants. Top Job includes the Popular Jobs premium position, the TopDev fanpage post and the Email Marketing send. This is why the catalogue must be built BOTTOM-UP: placements and services first, then the Job posting products that reference them.',
      ],
      warn:
        'The deck lists ~24 “services”, but only ~14 are sellable. Popular Jobs, Highlight Jobs, Job Basic, Jobs Tailored For You and Super Hot Jobs are EFFECTS of a posting tier — the deck pitches them as benefits because that is how sales presents them. Making them products would bill twice for the same thing.',
    },
    {
      label: 'Placements — where a product surfaces on the site',
      text: 'A placement is a display area on the jobseeker site (size, how many are shown, the rotation cap). Defined ONCE in System → Placements, so a banner sale points at a row instead of restating “1536×371, max 6, rotate 3s”. Each placement records how it gets filled — this is the product ⇄ page relationship.',
      table: {
        cols: ['Placement (deck §)', 'Size / cap', 'Filled by', 'Route'],
        rows: [
          ['Main Banner — Hero (1.1)', '1536×371 · 1 shown, max 6, rotate 3s', 'Banner placement product', 'Booked'],
          ['Feature company (1.2)', 'Logo from profile · 6 shown, max 12', 'Feature company product', 'Booked'],
          ['Công việc Hot hôm nay (1.3)', '4 jobs shown', 'Top Job tier (first 10 days) AND sold standalone', 'Both ⚠'],
          ['Top Companies Hiring Now (1.4)', '2 shown, max 5, rotate 5s', 'Công ty nổi bật product (10 ngày)', 'Booked'],
          ['Popular Jobs (1.5)', '20 postings + 4 fixed premium', 'Distinction + Top Job tiers · 4 positions as add-on', 'Both ⚠'],
          ['Highlight Companies (1.6)', '20 postings + 5 fixed premium', 'Basic Plus tier · 5 positions as add-on', 'Both ⚠'],
          ['Công việc mới (1.7)', 'List, bottom of page', 'Basic tier', 'Tier'],
          ['Banner adsense — Home (1.8)', '1260×120 · 1 shown, max 6', 'Banner placement product', 'Booked'],
          ['Jobs Tailored For You (1.9)', 'List', 'Guests: Distinction + Top Job · Logged in: personalised', 'Tier'],
          ['Homepage pop-up (1.10)', '1 at a time, priority + frequency cap', 'Popup placement product', 'Booked'],
          ['Highlight Company — Search (2.1)', '1 company, unlimited', 'Highlight Company product', 'Booked'],
          ['Highlight Jobs — Search (2.2)', 'Unlimited, random per reload', 'Basic Plus · Distinction · Top Job', 'Tier'],
          ['Banner adsense — Search (2.3)', '425×160 · unlimited, interleaved', 'Banner placement product', 'Booked'],
        ],
      },
      items: [
        'Tier-driven — membership is DERIVED from the job’s posting tier. Nothing is booked, nothing is assigned by hand. The site query is “jobs where tier = X, ordered by last refresh, randomised per page load”.',
        'Booked — a company buys the slot for N days. The site query is “active bookings for this slot today, rotate through them”. Capacity is a hard cap, so selling it needs an availability calendar.',
      ],
      warn:
        'THREE placements have two supply routes at once. “Công việc Hot hôm nay” shows 4 jobs but is both a Top Job perk and a standalone purchase; Popular Jobs and Highlight Companies each have a fixed premium block (4 and 5 positions) sold on top of the tier-driven list. Each needs ONE resolver with an explicit priority rule, or the finite positions get oversold.',
    },
    {
      label: 'Included ≠ bundled — why Top Job is a PRODUCT, not a package',
      text: 'Top Job comes with an email send and a fanpage post, so it looks like a bundle. It is not. The test is whether the customer could buy the pieces instead, and whether the thing maps to a single choice when publishing a job.',
      table: {
        cols: ['', 'Product with includes[]', 'Package'],
        rows: [
          ['Example', 'Tin Top Job', 'Gói Ultimate'],
          ['Quotation shows', 'ONE line, one price — “Tin Top Job”', 'One package price, component lines visible'],
          ['Can you buy it without a part?', 'No — the email send IS part of what Top Job means', 'Yes, every component is separately sellable'],
          ['Provisioning', 'One posting entitlement; each include fires on top', 'One entitlement PER component, independently'],
          ['Picked when publishing a job?', 'YES — it is a value of the job’s packageType', 'No — a package is never a job’s tier'],
        ],
      },
      items: [
        'That last row is decisive. Publishing a job is ONE selection (Basic / Basic Plus / Distinction / Top Job). If Top Job were a package, publishing would have to resolve a package into components and the job’s packageType enum would break. So a tier must stay a single product.',
        'A Placement or Manual service product is defined ONCE and reached two ways: bought standalone (a booking on the slot) or fired as an include when a job of that tier is published. Same definition either way — which is the whole reason “Công ty nổi bật” is not duplicated.',
        'Scaling test: a new tier → a new Job posting product, tick its slots and includes, no code. A new homepage area → a new Placements row, then any tier may reference it. A new promo service → a new Manual service, then include it where wanted. A cross-category offer → a Package.',
      ],
      warn:
        'Do NOT model a tier as a package to express its extras, and do NOT model a segment price as a package (see the next block). Both mistakes produce the same failure: the same capability defined in several records that then drift apart, which is exactly what happened to Basic Plus.',
    },
    {
      label: 'Packages are a catalogue object — but “Gói Enterprise / Gói SME” are NOT packages',
      text: 'A PACKAGE is several catalogue products sold together at one package price, reusable across customers. The client has a real one: Gói Ultimate at 16.489.000 ₫ bundles posting + CV sourcing + email marketing + a Popular Companies logo + HackerRank + CSKH support. That earns its own admin screen, because it is defined once and quoted many times.',
      table: {
        cols: ['CRM group today', 'What it actually is', 'How we model it'],
        rows: [
          ['Gói Ultimate', 'One price covering many different products', 'PACKAGE — component lines + one package price'],
          ['Gói Enterprise', 'Basic / Basic Plus / Distinction at Enterprise prices — identical benefit lists to the SME rows, only the price differs', 'PRICE LIST on each tier product (segment = Enterprise). NOT a package.'],
          ['Gói SME / Startup', 'The same three tiers at SME prices', 'PRICE LIST on each tier product (segment = SME). NOT a package.'],
          ['New 2024', 'A release batch — mixes tiers, 15-day variants and test data', 'Not a grouping we carry over; duration is a price-list variant.'],
        ],
      },
      items: [
        'A package with one component line is not a package — it is a product at a price. “Basic Plus SMEs” must be the Basic Plus product with an SME price, never a one-line bundle, or the tier’s benefits get defined once per segment and drift (they already have).',
        'A package is a SELLING WRAPPER, not a new entitlement: paying for one provisions each component separately at the component quota, so consumption and reporting are identical whether the customer bought the package or the pieces.',
        'A one-off deal-specific combination is still just quotation lines in CRM — a package is for a combination worth naming and reselling.',
      ],
      warn:
        'Promotions and a Credits page stay dropped, for the original reason: discounting happens on the quotation line so a price can only be cut in one place, and the credit balance is the entitlement ledger read on the company account. Bringing packages back does not bring those back.',
    },
    {
      label: 'Entitlement is the single downstream record',
      text: 'Every product maps to an ENTITLEMENT = product + remaining quota + validity. That is the one record downstream screens read and decrement.',
      table: {
        cols: ['Step', 'Rule'],
        rows: [
          ['Provisioning', 'Automatic on payment — an admin NEVER hand-picks products for an account'],
          ['Consumption', 'Publishing a job spends a posting slot; unlocking a CV spends one unlock'],
          ['At zero', 'The action is blocked, with a buy-more path'],
        ],
      },
      warn: 'Nothing is entitled without a paid order. Every consumption must be idempotent and attributable: the same publish or unlock can never spend quota twice, and each spend records who spent it on what.',
    },
    {
      label: 'Admin surface — one page, under System',
      text: 'The catalogue side only: what is sellable and at what price. It is HQ configuration, so it lives in the admin console under System → Products, alongside Company information and Master data — not in its own top-level menu.',
      table: {
        cols: ['Surface', 'Holds', 'Where'],
        rows: [
          ['Products', 'Sellable products — definition, price, fulfilment', 'System → Products'],
        ],
      },
      items: [
        'Orders are NOT a surface here: the order/payment chain is one object, owned by CRM → Purchase order (Draft → Pending payment → Paid → Fulfilled).',
        'Discount codes are out of scope — discounting happens on the quotation line in CRM, so there is no second place a price can be cut.',
        'Packages, Promotions and a Credits page were all dropped for the reason above — one place to define a price, one place to cut it.',
      ],
    },
    {
      label: 'Money rules that must not be broken',
      items: [
        'A price is NEVER edited in place once it has been sold — a price change creates a new version, so an old order always reprices to what the customer actually agreed.',
        'Credits are a LEDGER, not a number: every grant, consumption, expiry and correction is an append-only entry and the balance is their sum. A balance is never overwritten, because it must reconcile against paid orders.',
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
            group: 'Definition',
            items: [
              { name: 'SKU', type: 'string', required: true, notes: 'stable business key used by quotations and orders — never re-used, never edited after first sale. Shape TYPE-CAPABILITY (JOB-BASIC, CV-050, PLC-HOMEHERO, ADD-POPULARJOBS, SVC-FB-TOPDEV) so a row is self-describing in an export or a support ticket, where the Type column is not there to help. It must survive a rename — the name is marketing copy, the SKU is the reference' },
              { name: 'name (vi / en)', type: 'i18n string', required: true, notes: 'VI required; the EN name is what appears on a bilingual quotation PDF' },
              { name: 'type', type: 'enum', required: true, notes: 'posting_tier | placement | credit_pack | addon | manual_service — drives which fulfilment fields apply' },
              { name: 'description (vi / en)', type: 'i18n rich text', notes: 'the benefit list printed on quotations' },
              { name: 'status', type: 'enum', required: true, notes: 'Active · Inactive — only Active can be quoted or sold' },
            ],
          },
          {
            group: 'Price',
            items: [
              { name: 'listPrice', type: 'money (₫)', required: true, notes: 'the catalogue price; a quotation may discount from it but the list price is the anchor' },
              { name: 'unit', type: 'enum', required: true, notes: 'per pack · per job · per week · per month — what the price is "per"' },
              { name: 'vatRate', type: 'percent', required: true, notes: 'so quotation totals and the VAT e-invoice agree (see CRM → Quotations)' },
              { name: 'version / effectiveFrom', type: 'int / date', notes: 'a price change on a sold product creates a new version rather than editing history' },
            ],
          },
          {
            group: 'Fulfilment — the entitlement this product grants',
            items: [
              { name: 'quotaAmount', type: 'int', notes: 'posting_tier: number of slots · credit_pack: number of CV unlocks' },
              { name: 'validityDays / validityMonths', type: 'int', notes: 'how long the entitlement lives from provisioning — CV combos are 30 or 90 days; unused posting slots bank for 1 year (deck)' },
              { name: 'postingTier', type: 'enum', notes: 'posting_tier only — Basic · Basic Plus · Distinction · Top Job, the tier the bought slots may use (see Job management)' },
              { name: 'placementId', type: 'ref', notes: 'placement only — FK to the Placements registry. Size, items shown and rotation cap are READ from that row, never retyped here.' },
              { name: 'bookingUnit / slotsConsumed', type: 'enum / int', notes: 'placement only — per day/week/month, and how many of the slot’s pool one sale occupies (e.g. 1 of 6 on the hero)' },
              { name: 'creativeSource', type: 'enum', notes: 'placement only — client upload · company profile (logo auto-pulled) · job posting' },
              { name: 'attachesTo', type: 'ref[]', notes: 'addon only — the parent tier products it may be sold with (Popular Jobs premium → Distinction + Top Job; Highlight premium → Basic Plus only). Empty = not sellable.' },
              { name: 'capacity', type: 'int', notes: 'addon only — finite positions (4 for Popular Jobs, 5 for Highlight Companies); needs the same availability check as a placement' },
              { name: 'slaDays / owningTeam / requiredInputs', type: 'int / enum / text', notes: 'manual_service only — fulfilment SLA, the team that does the work, and what the buyer must supply (copy, image, audience, publish date)' },
              { name: 'displayEffects', type: 'structured', notes: 'STRUCTURED, not prose: title style · top-search on/off · benefits shown in search (count) · homepage placements + days · badges + days. Today the CRM holds these as a free-text Description list, which the site cannot query.' },
              { name: 'entitlementPreview', type: 'derived', notes: 'a plain sentence of what a buyer gets ("10 slots at Top Job, valid 12 months") — the sanity check before activating' },
              { name: 'avgUnitPrice', type: 'derived', notes: 'credit_pack — price ÷ unlocks, e.g. 3.700.000 ₫ / 50 = ~74.000 ₫/CV. The deck sells on this number, so it is computed and never typed.' },
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
              'Tier-driven — membership is DERIVED from a job’s posting tier. Nothing is booked and nothing is assigned by hand. Site query: “jobs where tier = X, ordered by last refresh, randomised per page load.”',
              'Booked — a company buys the slot for N days. Site query: “active bookings for this slot today, rotate through them.” Capacity is a hard cap, so the sale needs an availability check.',
              'Both — the same area is fed by a tier AND sold standalone. Three placements are in this state and each needs one resolver with an explicit priority rule.',
            ],
          },
        ],
        rules: [
          'A placement is created and edited by HQ only, and only when the jobseeker site actually gains or changes an area — it describes the site, it does not drive it.',
          'Size, items shown and rotation cap are defined here once. A placement product references the row; it never restates them.',
          'A tier-driven placement is not bookable and must not appear in the placement product picker.',
          'A booked placement may never have more concurrent bookings than its pool cap.',
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
  ],
}
