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
      text: 'Each product carries a price (₫), its fulfilment (what the buyer gets) and an Active / Draft status.',
      table: {
        cols: ['Type', 'Example', 'Fulfilment'],
        rows: [
          ['Posting quota', 'Job Posting — Pro', '10 posts / 3 months'],
          ['Subscription', 'Resume Search — 6 months', '100 CV unlocks'],
          ['Advertising', 'Main ad — Home hero', 'Per week'],
          ['Boost', 'Recommend rank boost', 'Per job / 14 days'],
        ],
      },
      items: ['Job-posting tiers exposed per job: Free · Basic · Basic plus · Distinction — the tier drives visibility / ranking on the jobseeker site (see Job management).'],
    },
    {
      label: 'No separate Packages or Credits page',
      text: 'A “package” is not its own admin object — it is expressed as QUOTATION LINES in CRM (several products on one quotation, at the agreed price). Discounting happens on the quotation line too, so there is never a second place a price can be cut. Credits are likewise not a page: the balance is the entitlement ledger, read on the company account.',
      warn: 'Do not rebuild Packages / Bundles / Promotions / Credits as admin screens. If a customer buys several products together, that is one quotation with several lines — the provisioning result is identical to buying the pieces.',
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
  ],
  features: [
    // 0 · Catalog ─────────────────────────────────────────────────────────────
    {
      name: 'Products management',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-catalog',
      detail: {
        description:
          'The catalogue: every sellable product with its price, its fulfilment (what the buyer actually receives) and its status. Four product types cover the business — Posting quota, Subscription, Advertising and Boost — and each one declares the entitlement it grants when an order is paid. This screen is the definition; it never touches a customer’s balance.',
        userStory:
          'As an HQ product/sales owner, I want to define what we sell and what each product grants, so that quotations price correctly and paid orders provision exactly the right quota with no manual step.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'search', type: 'string', notes: 'product name / code' },
              { name: 'type', type: 'enum', notes: 'Posting quota · Subscription · Advertising · Boost' },
              { name: 'status', type: 'enum', notes: 'Draft · Active · Archived' },
              { name: 'row', type: 'composite', notes: 'code · name · type · price (₫) · fulfilment summary · validity · status · sold count' },
              { name: 'row actions', type: 'buttons', notes: 'Edit · Duplicate · Activate / Deactivate · Archive · New version (price change)' },
            ],
          },
          {
            group: 'Definition',
            items: [
              { name: 'code', type: 'string', required: true, notes: 'stable business key used by quotations and orders — never re-used, never edited after first sale' },
              { name: 'name (vi / en)', type: 'i18n string', required: true, notes: 'VI required; the EN name is what appears on a bilingual quotation PDF' },
              { name: 'type', type: 'enum', required: true, notes: 'posting_quota | subscription | advertising | boost — drives which fulfilment fields apply' },
              { name: 'description (vi / en)', type: 'i18n rich text', notes: 'the benefit list printed on quotations' },
              { name: 'status', type: 'enum', required: true, notes: 'Draft · Active · Archived — only Active can be quoted or sold' },
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
              { name: 'quotaAmount', type: 'int', notes: 'posting_quota: number of posts · subscription: number of CV unlocks · boost: number of boosts' },
              { name: 'validityDays / validityMonths', type: 'int', notes: 'how long the entitlement lives from provisioning, e.g. 3 months for Job Posting Pro' },
              { name: 'postingTier', type: 'enum', notes: 'posting_quota only — Free · Basic · Basic plus · Distinction, the tier the bought slots may use (see Job management)' },
              { name: 'adSlot / adPeriod', type: 'enum / enum', notes: 'advertising only — which banner slot and the sold period (e.g. Home hero, per week; see Banners & popups)' },
              { name: 'boostDurationDays', type: 'int', notes: 'boost only — e.g. Recommend rank boost, 14 days per job' },
              { name: 'entitlementPreview', type: 'derived', notes: 'a plain sentence of what a buyer gets ("10 posts at Basic plus, valid 3 months") — the sanity check before activating' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — Draft · Active · Archived',
            items: [
              'Draft — being defined. Invisible to quotations, orders and the company purchasing surface. Freely editable, and the only status that can be deleted.',
              'Active — sellable. It can be quoted, ordered and provisioned. Price and fulfilment are versioned from here on, not edited in place.',
              'Archived — no longer sold, but every past order, entitlement and report that references it still resolves. This is the replacement for deleting a product.',
              'The transitions: Draft → Active (activate, requires a complete fulfilment definition) · Active → Archived (retire) · Archived → Active (re-list). A product that has ever been sold can never go back to Draft.',
            ],
          },
          {
            heading: 'The four product types and what each grants',
            items: [
              'Posting quota — N job posts at a given tier, valid for a period. Example: Job Posting Pro, 10 posts / 3 months. Consumed by publishing a job.',
              'Subscription — access for a period with a usage allowance. Example: Resume Search, 6 months / 100 CV unlocks. Consumed by unlocking a CV.',
              'Advertising — a banner slot for a sold period. Example: Main ad, Home hero, per week. Consumed by a banner booking occupying that slot (see Banners & popups).',
              'Boost — a ranking boost applied to one job for a number of days. Example: Recommend rank boost, per job / 14 days.',
              'Every type resolves to the same shape downstream: an entitlement of (product, remaining quota, validity). One consumption model, four ways to sell into it.',
            ],
          },
        ],
        behaviors: [
          'Choosing a type shows only the fulfilment fields that type uses, and the entitlement preview updates as they are filled.',
          'Activating validates that the fulfilment is complete — a product cannot become sellable while it is ambiguous about what the buyer receives.',
          'Editing the price of a product that has never been sold edits in place; editing the price of a sold product creates a new version with an effective date.',
          'Existing orders and entitlements keep the product version they were sold at, so an old order never silently reprices.',
          'Duplicate creates a Draft copy with a new code — the normal way to build a variant of an existing product.',
          'Archiving hides the product from quotations and the company purchasing surface but changes nothing already sold.',
          'The list shows a sold count per product, which is what tells the product owner whether something is worth keeping.',
        ],
        rules: [
          'Only an Active product can be quoted, ordered or provisioned.',
          'A product code is immutable once the product has been sold, because quotations, orders and invoices reference it.',
          'A price change on a sold product creates a new version; historical prices are never rewritten.',
          'Fulfilment must be complete before activation: quota and validity for quota-bearing types, slot and period for advertising, duration for boost.',
          'Only a Draft that has never been sold can be deleted; everything else is archived.',
          'Every product must declare a VAT rate, so a quotation and its VAT e-invoice cannot disagree.',
          'Posting tiers (Free · Basic · Basic plus · Distinction) are the same fixed vocabulary the job form uses — this screen selects from it and does not invent tiers.',
        ],
        states: [
          'Loading',
          'Empty catalogue',
          'Filtered-empty',
          'New product (type not yet chosen)',
          'Editing Draft',
          'Editing Active (versioning warning)',
          'Activation blocked (incomplete fulfilment)',
          'Archived (read-only)',
          'Validation errors',
        ],
        backend: {
          dataModel: [
            { name: 'productId', type: 'uuid', required: true },
            { name: 'code', type: 'string', required: true, notes: 'UNIQUE, immutable after first sale' },
            { name: 'name / description', type: 'i18n jsonb', required: true },
            { name: 'type', type: 'enum', required: true, notes: 'posting_quota|subscription|advertising|boost' },
            { name: 'status', type: 'enum', required: true, notes: 'draft|active|archived' },
            { name: 'ProductVersion', type: 'entity', notes: 'productId, version, listPrice, unit, vatRate, fulfilment jsonb, effectiveFrom — orders reference a VERSION, not the product' },
            { name: 'fulfilment', type: 'jsonb', notes: 'quotaAmount, validityDays, postingTier, adSlot, adPeriod, boostDurationDays — shape depends on type' },
            { name: 'soldCount', type: 'derived', notes: 'from paid order lines' },
            { name: 'createdBy / updatedBy / updatedAt', type: 'uuid / uuid / timestamp' },
          ],
          endpoints: [
            'GET /admin/products?type=&status=&q=&page=',
            'POST /admin/products',
            'PUT /admin/products/:id — Draft only, or non-price fields',
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
          'A Draft product never appears in a quotation or on the company purchasing surface.',
          'Archiving a product leaves every past order and entitlement resolvable.',
          'A paid order for each of the four types provisions the correct entitlement with the correct quota and validity.',
        ],
        openQuestions: [
          'Who owns catalogue pricing — is a price change an ops action, or does it need approval?',
          'Do we need customer-specific pricing (a negotiated rate for a key account), or is discounting always done on the quotation?',
          'Is the Talent pool product (named in the Enterprise bundle) a fifth type, or a subscription?',
          'Are prices ever quoted in USD for foreign clients, or is ₫ the only currency?',
        ],
      },
    },
  ],
}
