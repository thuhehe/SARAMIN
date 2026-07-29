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
      label: 'Bundles',
      text: 'Several catalog products at one package price, with their own Active / Draft status.',
      table: {
        cols: ['Bundle', 'Contains'],
        rows: [
          ['Recruit Starter', 'Job Posting Pro + 1 boost'],
          ['Recruit Growth', 'Job Posting Pro + Resume Search'],
          ['Enterprise', 'All products + Talent pool — custom price'],
        ],
      },
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
      label: 'Admin surfaces',
      table: {
        cols: ['Surface', 'Holds'],
        rows: [
          ['Catalog', 'Products'],
          ['Bundles', 'Packages'],
          ['Credits', 'Auditable balance ledger per company'],
          ['Orders', 'Draft → Pending payment → Paid → Fulfilled'],
          ['Promotions', 'Discount codes with scope, validity and usage cap'],
        ],
      },
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

    // 1 · Bundles ─────────────────────────────────────────────────────────────
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
              { name: 'status', type: 'enum', notes: 'Draft · Active · Archived' },
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
              { name: 'status', type: 'enum', required: true, notes: 'Draft · Active · Archived — same lifecycle as a product' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — same three as a product, one extra constraint',
            items: [
              'Draft — being composed; not sellable, freely editable, deletable.',
              'Active — sellable and quotable. Requires at least two component lines and every component itself Active.',
              'Archived — retired; past orders and entitlements still resolve.',
              'The extra constraint: a bundle can only be Active while ALL its components are Active. Archiving a component forces its bundles to be revisited rather than silently selling something unprovisionable.',
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
          'Activation is blocked while any component is Draft or Archived, naming the offending component.',
          'Archiving a product warns which Active bundles reference it, before the archive is applied.',
          'Duplicate creates a Draft copy — the way a seasonal variant of a bundle is made.',
        ],
        rules: [
          'A bundle needs at least two component lines; a single-product "bundle" is just a product.',
          'Every component must be Active for the bundle to be Active.',
          'A bundle provisions its components individually — it never creates a bundle-level entitlement.',
          'The package price is independent of the component prices and is not recomputed from them; the discount shown is informational.',
          'A custom-price bundle cannot be self-served by a company — it must go through a quotation.',
          'Only a never-sold Draft can be deleted; everything else is archived.',
          'Component quantities are integers of at least 1.',
        ],
        states: [
          'Loading',
          'Empty (no bundles)',
          'New bundle (no components yet)',
          'Composing (discount preview)',
          'Activation blocked (component not Active)',
          'Custom price (Enterprise)',
          'Editing Active (versioning warning)',
          'Archived (read-only)',
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
          'A bundle cannot be activated while any component is Draft or Archived.',
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

    // 2 · Credits ledger ──────────────────────────────────────────────────────
    {
      name: 'Credits (balance ledger)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-credits',
      notes: 'Named in the module requirements as an Admin surface; the auditable balance behind every entitlement.',
      detail: {
        description:
          'The auditable balance per company. Credits are an append-only LEDGER, not a stored number: a paid order grants entries, every publish or unlock consumes one, expiry and corrections are entries too, and the balance is the sum. It is built this way because the balance has to reconcile against paid orders — a number that can be overwritten cannot be audited.',
        userStory:
          'As an HQ operator, I want to see exactly how a company’s remaining quota was earned and spent, so that I can answer "why do I only have 3 posts left?" with evidence rather than a guess.',
        uiFields: [
          {
            group: 'Per-company balances',
            items: [
              { name: 'search', type: 'string', notes: 'company name / tax code' },
              { name: 'entitlement type', type: 'enum', notes: 'Posting slots · CV unlocks · Boosts · Ad periods' },
              { name: 'row', type: 'composite', notes: 'company · entitlement · granted · consumed · expired · remaining · validity window · status' },
              { name: 'expiring soon', type: 'filter', notes: 'the sales trigger — quota about to expire unused is a renewal conversation' },
              { name: 'exhausted', type: 'filter', notes: 'remaining = 0 — the other sales trigger' },
            ],
          },
          {
            group: 'Ledger (one company + entitlement)',
            items: [
              { name: 'entry type', type: 'enum', required: true, notes: 'Grant · Consumption · Expiry · Correction · Reversal' },
              { name: 'amount', type: 'int (signed)', required: true, notes: 'positive grants, negative consumption — the sum IS the balance' },
              { name: 'source', type: 'ref', required: true, notes: 'grant → order line · consumption → the job published or CV unlocked · correction → an operator + reason' },
              { name: 'actor', type: 'ref → user', required: true, notes: 'the company user who spent it, or the operator who corrected it' },
              { name: 'occurredAt', type: 'timestamp', required: true },
              { name: 'runningBalance', type: 'derived', notes: 'shown per row so the story reads top to bottom' },
              { name: 'note', type: 'text', notes: 'mandatory on Correction and Reversal' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Entry types — the only five ways a balance moves',
            items: [
              'Grant — a paid order line provisioned. The only positive entry that arises automatically, and it always names the order that caused it.',
              'Consumption — a job published, a CV unlocked, a boost applied, an ad period taken. Negative, idempotent, and attributed to the company user who did it.',
              'Expiry — validity passed with quota unused. Negative, written by the expiry job, never by a person.',
              'Correction — an operator adjustment (goodwill, a support fix, a data error). Requires a reason and a permission; this is the only place a human moves a balance.',
              'Reversal — undoing a specific earlier entry (a refunded order, a mistaken consumption). References the entry it reverses rather than quietly deleting it.',
              'Nothing else may write to the ledger. There is no "set balance to N" operation, by design.',
            ],
          },
          {
            heading: 'Entitlement status — derived, like everything else here',
            items: [
              'Active — inside its validity window with remaining > 0. The only status that can be consumed.',
              'Exhausted — inside validity, remaining = 0. Consumption is blocked with a buy-more path (see Job management → publish, Resume management → CV search).',
              'Expired — past validity. Any remaining quota is written off by an Expiry entry, so the ledger and the balance never disagree.',
              'Status is computed from (validity window, sum of entries) — it is not a column an operator can set.',
            ],
          },
        ],
        behaviors: [
          'Opening a company shows one row per entitlement and, beneath it, the full ledger in date order with a running balance.',
          'Every consumption row links to the thing it paid for — the published job, the unlocked CV — so a dispute is resolved by clicking, not by asking.',
          'A correction requires an amount, a reason and a permission, and appears in the ledger like any other entry.',
          'A reversal always references the entry it undoes; entries are never edited or deleted.',
          'Expiring-soon and exhausted are one-click filters, because both are sales conversations.',
          'A refund in CRM produces a Reversal here rather than a hand-typed negative correction.',
          'Export per company for reconciliation, audited like any PII-adjacent export.',
        ],
        rules: [
          'The ledger is append-only. No entry is ever edited or deleted; mistakes are corrected by Reversal or Correction.',
          'Balance = the sum of entries. It may be cached for reads, but the cache is never the source of truth.',
          'Consumption is idempotent per action id: the same publish or unlock cannot spend twice, even on a retry.',
          'Consumption is refused when remaining = 0 or the entitlement has expired — the block happens server-side, at the moment of use.',
          'Only a Grant caused by a paid order may create quota automatically; a human-created positive entry is always a Correction with a reason.',
          'Corrections require an explicit permission and are audited (see Admin roles & operators).',
          'Quota is pooled at the account level: all of a company’s users draw from the same balance (see Account management).',
        ],
        states: [
          'Loading',
          'Empty (company has never bought)',
          'Active balance',
          'Expiring soon (warning)',
          'Exhausted (blocked + buy-more path)',
          'Expired (written off)',
          'Correction dialog (reason required)',
          'Reversal confirm',
          'Read-only (no correction permission)',
        ],
        backend: {
          dataModel: [
            { name: 'Entitlement', type: 'entity', required: true, notes: 'companyId, productVersionId, type, grantedTotal, validFrom, validUntil — one per provisioned product line' },
            { name: 'CreditLedgerEntry', type: 'entity', required: true, notes: 'entitlementId, entryType(grant|consumption|expiry|correction|reversal), amount (signed), sourceType, sourceId, actorId, note?, occurredAt' },
            { name: 'idempotencyKey', type: 'string', required: true, notes: 'UNIQUE per consumption action — the real double-spend guard' },
            { name: 'reversesEntryId', type: 'uuid?', notes: 'set on reversal entries' },
            { name: 'balance', type: 'derived', notes: 'SUM(amount) per entitlement; may be cached but never authoritative' },
          ],
          endpoints: [
            'GET /admin/credits?company=&type=&filter=expiring|exhausted&page=',
            'GET /admin/credits/:entitlementId/ledger',
            'POST /admin/credits/:entitlementId/correction { amount, reason }',
            'POST /admin/credits/entries/:id/reverse { reason }',
            'POST /internal/credits/consume { entitlementId, amount, sourceType, sourceId, idempotencyKey }',
            'GET /admin/credits/export?company=',
          ],
          integrations: ['CRM (paid orders, refunds)', 'Job management (publish consumption)', 'Resume management (CV unlock consumption)', 'Banners & popups (ad period consumption)', 'Audit log'],
          notes:
            'The unique idempotency key on consumption is what actually prevents double-spending under retries and double-clicks — application-level checks are not enough. Cache the balance for hot reads, invalidate on write, and always recompute from entries when reconciling.',
        },
        acceptance: [
          'Publishing a job decrements posting slots exactly once, even if the request is retried.',
          'Consumption is refused at zero remaining and at expiry, with a buy-more path offered.',
          'The ledger explains every unit of a company’s balance, each entry linked to its cause.',
          'A correction cannot be made without a reason and the right permission.',
          'A refunded order produces a Reversal, and the balance moves accordingly.',
          'Recomputing the balance from the ledger matches the displayed balance for every company.',
        ],
        openQuestions: [
          'Do unused posting slots roll over on renewal, or expire hard at validity?',
          'Is quota ever transferable between companies in a group?',
          'What happens to remaining quota when an account is suspended — frozen, or does validity keep running?',
          'Who is allowed to make a Correction, and is there an amount above which it needs a second approval?',
        ],
      },
    },

    // 3 · Orders ──────────────────────────────────────────────────────────────
    {
      name: 'Orders',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-orders',
      notes: 'Named in the module requirements (Draft → Pending payment → Paid → Fulfilled). The document chain itself lives in CRM — see open questions on the boundary.',
      detail: {
        description:
          'The order queue: what has been bought, what is waiting on money, and what has been provisioned. An order is the hinge between the catalogue and a customer’s entitlements — Paid is the moment provisioning is released, and Fulfilled is the confirmation that entitlements were actually created. The selling documents around it (quotation, VAT e-invoice, payment confirmation) live in CRM; this screen is the fulfilment view of the same chain.',
        userStory:
          'As an HQ operator, I want to see every order and where it is stuck, so that a paying customer is never left without the products they bought.',
        uiFields: [
          {
            group: 'List & filters',
            items: [
              { name: 'search', type: 'string', notes: 'order code / company / tax code' },
              { name: 'status', type: 'enum', notes: 'Draft · Pending payment · Paid · Fulfilled · Cancelled · Refunded' },
              { name: 'company', type: 'ref → Company' },
              { name: 'source', type: 'enum', notes: 'CRM quotation · Company self-service — how the order was raised' },
              { name: 'date range', type: 'date range' },
              { name: 'row', type: 'composite', notes: 'order code · company · lines summary · total (₫, incl. VAT) · status · created · paid at · fulfilled at' },
              { name: 'stuck filter', type: 'filter', notes: 'Paid but not Fulfilled — the one queue that must always be empty' },
            ],
          },
          {
            group: 'Order detail',
            items: [
              { name: 'orderCode', type: 'string', required: true, notes: 'auto, immutable' },
              { name: 'company', type: 'ref → Company', required: true },
              { name: 'lines', type: 'OrderLine[]', required: true, notes: 'product VERSION or bundle + quantity + unit price as sold — never re-read from the current catalogue' },
              { name: 'promotion', type: 'ref → Promotion', notes: 'the code applied, with the discount it produced' },
              { name: 'subtotal / discount / vat / total', type: 'money (₫)', required: true, notes: 'must reconcile with the quotation and the VAT e-invoice' },
              { name: 'linked documents', type: 'refs', notes: 'quotation · sales order/PO · payment · VAT e-invoice (all in CRM)' },
              { name: 'provisioned entitlements', type: 'list', notes: 'what Paid actually created — the proof of fulfilment' },
              { name: 'timeline', type: 'events', notes: 'created → payment confirmed → provisioned, each with actor and timestamp' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — Draft → Pending payment → Paid → Fulfilled',
            items: [
              'Draft — being assembled (from a quotation, or by a company self-serving). Lines are still editable; nothing is owed and nothing is provisioned.',
              'Pending payment — confirmed and awaiting money. Lines are frozen: this is what the customer agreed to pay. No entitlement exists yet.',
              'Paid — Accounting has confirmed the payment against the bank (the control lives in CRM → Payments). This is the trigger that releases provisioning.',
              'Fulfilled — entitlements have been created for every line. The order is done, and the company can consume its quota.',
              'Cancelled — abandoned before payment. Terminal; reachable only from Draft or Pending payment.',
              'Refunded — money returned after Paid. Provisioned entitlements are reversed in the credits ledger, so the balance follows the refund.',
              'The one queue that must always be empty is "Paid but not Fulfilled": a customer who paid and holds nothing is the worst failure this module can produce, so it is a first-class filter rather than a log line.',
            ],
          },
        ],
        behaviors: [
          'Confirming a Draft freezes its lines and moves it to Pending payment.',
          'Payment confirmation arrives from CRM (Accounting confirms against the bank); this screen does not confirm money, it reacts to it.',
          'Paid automatically provisions every line: products become entitlements, bundles expand into one entitlement per component. No operator picks products.',
          'Successful provisioning moves the order to Fulfilled and lists the entitlements it created.',
          'A provisioning failure leaves the order Paid with a visible error and a Retry — it is never marked Fulfilled optimistically.',
          'Cancelling is possible only before payment; after payment the path is a refund.',
          'A refund reverses the provisioned entitlements through the credits ledger rather than deleting them.',
          'The order detail links to the quotation, payment and VAT e-invoice in CRM, so the whole chain is one click away.',
        ],
        rules: [
          'Nothing is provisioned before Paid — the client’s own T&C makes payment and invoicing the precondition for activation (see CRM).',
          'Order lines pin the product VERSION and the price as sold; the current catalogue price never rewrites an existing order.',
          'Paid is set only by a confirmed payment, never by hand on this screen. Separation of duties: Sales confirms orders, Accounting confirms money.',
          'Provisioning is idempotent per order line — a retry cannot double-grant quota.',
          'Fulfilled requires an entitlement for every line; a partial provision is not Fulfilled.',
          'Cancelled and Refunded are terminal.',
          'Totals on the order must reconcile with the quotation and the VAT e-invoice to the đồng.',
        ],
        states: [
          'Loading',
          'Empty',
          'Filtered-empty',
          'Draft (editable)',
          'Pending payment (frozen)',
          'Paid (provisioning)',
          'Provisioning failed (retry)',
          'Fulfilled',
          'Cancelled',
          'Refunded (entitlements reversed)',
        ],
        backend: {
          dataModel: [
            { name: 'orderId / orderCode', type: 'uuid / string', required: true },
            { name: 'companyId', type: 'uuid', required: true },
            { name: 'status', type: 'enum', required: true, notes: 'draft|pending_payment|paid|fulfilled|cancelled|refunded' },
            { name: 'OrderLine', type: 'entity', required: true, notes: 'orderId, productVersionId | bundleId, quantity, unitPriceAsSold, vatRate' },
            { name: 'promotionId / discountAmount', type: 'uuid? / money' },
            { name: 'subtotal / vatAmount / total', type: 'money', required: true },
            { name: 'quotationId / paymentId / invoiceId', type: 'uuid?', notes: 'the CRM document chain' },
            { name: 'paidAt / fulfilledAt / cancelledAt / refundedAt', type: 'timestamp?' },
            { name: 'provisioningAttempts / lastProvisioningError', type: 'int / text?', notes: 'so a stuck Paid order is diagnosable' },
          ],
          endpoints: [
            'GET /admin/orders?status=&company=&source=&from=&to=&q=&page=',
            'GET /admin/orders/:id',
            'POST /admin/orders/:id/confirm — Draft → Pending payment',
            'POST /admin/orders/:id/cancel',
            'POST /admin/orders/:id/provision/retry',
            'POST /internal/orders/:id/mark-paid — called by the CRM payment confirmation, not by a person',
          ],
          integrations: ['CRM (quotation, payment confirmation, VAT e-invoice, refunds)', 'Credits ledger (provisioning + reversal)', 'Account management (entitlements)', 'Notifications (order paid / provisioned)'],
          notes:
            'Provisioning should be an idempotent worker keyed on the order line, triggered by the paid event and retryable. The "Paid but not Fulfilled" query is the health check worth alerting on.',
        },
        acceptance: [
          'Confirming a Draft freezes its lines and prices.',
          'An order becomes Paid only from a confirmed payment, never from an operator action on this screen.',
          'Paid provisions every line exactly once, including bundle components, and then reads Fulfilled.',
          'A provisioning failure leaves the order visibly Paid-not-Fulfilled with a working Retry.',
          'A refund reverses the provisioned quota in the credits ledger.',
          'Order totals reconcile with the linked quotation and VAT e-invoice.',
        ],
        openQuestions: [
          'Boundary question for the client: CRM already owns Quotation → Sales order → Payment → Invoice. Is this Orders screen the same object viewed from fulfilment, or a second entity? One object viewed twice is strongly preferable — two would need reconciliation.',
          'Can a company self-serve an order (card / bank transfer) in Phase-1, or is every order sales-raised?',
          'Are partial payments / instalments in scope? They would break the single Paid trigger.',
          'Who may issue a refund, and does it always reverse the full entitlement or only the unused remainder?',
        ],
      },
    },

    // 4 · Promotions ──────────────────────────────────────────────────────────
    {
      name: 'Promotions',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-promotions',
      notes: 'Named in the module requirements: discount codes with scope, validity and usage cap.',
      detail: {
        description:
          'Discount codes with a scope, a validity window and a usage cap. Every part of a promotion exists to bound the discount: what it applies to, when it works, how many times, and for whom. The status is derived from the validity window and the cap, exactly like a banner schedule, so a promotion cannot be "Active" after it has run out.',
        userStory:
          'As an HQ marketing/sales owner, I want to issue a bounded discount code, so that a campaign has a predictable maximum cost and cannot be shared beyond its intent.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'search', type: 'string', notes: 'code / campaign name' },
              { name: 'status', type: 'enum', notes: 'Draft · Scheduled · Active · Exhausted · Expired · Disabled' },
              { name: 'row', type: 'composite', notes: 'code · discount · scope · validity · used / cap · total discount given (₫) · status' },
              { name: 'row actions', type: 'buttons', notes: 'Edit · Duplicate · Disable (kill switch) · View redemptions' },
            ],
          },
          {
            group: 'Definition',
            items: [
              { name: 'code', type: 'string', required: true, notes: 'what the customer types — unique, case-insensitive, immutable once redeemed' },
              { name: 'campaignName', type: 'string', required: true, notes: 'internal label for reporting' },
              { name: 'discountType', type: 'enum', required: true, notes: 'Percent · Fixed amount (₫)' },
              { name: 'discountValue', type: 'percent / money', required: true },
              { name: 'maxDiscountAmount', type: 'money', notes: 'caps a percent discount — the guard against a percent code hitting an Enterprise order' },
              { name: 'minOrderAmount', type: 'money', notes: 'the floor at which the code applies' },
            ],
          },
          {
            group: 'Scope — what it may discount',
            items: [
              { name: 'appliesTo', type: 'enum', required: true, notes: 'All products · Specific products · Specific bundles · A product type' },
              { name: 'productIds / bundleIds / productType', type: 'uuid[] / uuid[] / enum', notes: 'the concrete scope for the chosen mode' },
              { name: 'eligibleCompanies', type: 'enum + refs', notes: 'Anyone · New customers only · Specific companies — "new customer" means never invoiced (see CRM customer status)' },
            ],
          },
          {
            group: 'Validity & caps',
            items: [
              { name: 'startAt / endAt', type: 'datetime', required: true, notes: 'as with banners, this drives the status — Scheduled / Active / Expired' },
              { name: 'totalUsageCap', type: 'int', required: true, notes: 'the maximum redemptions overall — this is the campaign budget in units' },
              { name: 'perCompanyCap', type: 'int', required: true, notes: 'redemptions per company, usually 1' },
              { name: 'usedCount / remaining', type: 'derived', notes: 'live counters against both caps' },
              { name: 'stackable', type: 'bool', required: true, notes: 'default off — one promotion per order unless deliberately allowed' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — derived from validity and the cap',
            items: [
              'Draft — not issued; the code cannot be redeemed. Editable and deletable.',
              'Scheduled — issued with a startAt in the future.',
              'Active — inside the window with redemptions remaining. The only status that can be applied to an order.',
              'Exhausted — the total usage cap has been reached, even though the window is still open. Derived, not typed.',
              'Expired — endAt has passed.',
              'Disabled — switched off by an operator. The kill switch for a leaked or mis-priced code; it takes effect immediately and is reversible.',
              'Status is computed from (isIssued, startAt, endAt, usedCount vs cap, disabledAt) — there is no writable status column, so a code can never be Active while exhausted.',
            ],
          },
          {
            heading: 'Redemption — where a code is actually validated',
            items: [
              'A code is validated at the moment it is applied to an order, server-side, against every bound: status, scope, company eligibility, minimum order, per-company cap and total cap.',
              'The discount is then FROZEN onto the order line, so a later change to the promotion cannot alter an order the customer already agreed to.',
              'The redemption is recorded (code, company, order, discount amount, when) — that record is both the cap counter and the campaign report.',
              'If an order is cancelled before payment, its redemption is released back to the cap; a refund after payment is a reporting event, not a released redemption. That asymmetry needs client confirmation.',
              'Reaching the total cap flips the status to Exhausted with no operator action.',
            ],
          },
        ],
        behaviors: [
          'A code is validated for uniqueness as it is typed, case-insensitively.',
          'Choosing a scope mode reveals only the fields that mode needs.',
          'A percent discount without a max amount raises a warning before issuing — this is the mistake that costs real money.',
          'Usage counters are live on the list, so a campaign burning too fast is visible early.',
          '"Disable" stops redemption immediately and does not touch orders that already used the code.',
          'The redemptions view lists every use with company, order and discount amount, and totals the discount given.',
          'Duplicate copies the definition with a new code and cleared counters — how a campaign is re-run.',
        ],
        rules: [
          'A code can be redeemed only while Active — every other status refuses it.',
          'Both caps are enforced server-side and atomically: concurrent redemptions must not exceed the total cap.',
          'The discount is frozen on the order at redemption; later edits to the promotion never reprice an existing order.',
          'A percent discount must have either a max discount amount or an explicit sign-off, so it cannot be unbounded.',
          'Promotions are not stackable unless explicitly marked so; the default is one per order.',
          'A code that has ever been redeemed cannot be renamed or have its discount changed — issue a new code instead.',
          '"New customers only" resolves against the CRM customer status (never invoiced = Prospect), not against the account creation date.',
          'Only Draft promotions can be deleted; anything redeemed is kept for reporting.',
        ],
        states: [
          'Loading',
          'Empty',
          'New promotion',
          'Editing Draft',
          'Issued (read-only definition)',
          'Uncapped percent warning',
          'Scheduled',
          'Active',
          'Exhausted (cap reached)',
          'Expired',
          'Disabled',
          'Redemption refused (out of scope / cap / expired)',
        ],
        backend: {
          dataModel: [
            { name: 'promotionId / code', type: 'uuid / string', required: true, notes: 'code UNIQUE, case-insensitive, immutable after first redemption' },
            { name: 'campaignName', type: 'string', required: true },
            { name: 'discountType / discountValue / maxDiscountAmount / minOrderAmount', type: 'enum / numeric / money? / money?' },
            { name: 'appliesTo / productIds / bundleIds / productType', type: 'enum / uuid[] / uuid[] / enum?' },
            { name: 'eligibility / eligibleCompanyIds', type: 'enum / uuid[]', notes: 'anyone|new_customers|specific' },
            { name: 'startAt / endAt', type: 'timestamp', required: true },
            { name: 'totalUsageCap / perCompanyCap', type: 'int', required: true },
            { name: 'isIssued / disabledAt', type: 'bool / timestamp?' },
            { name: 'status', type: 'derived enum', notes: 'draft|scheduled|active|exhausted|expired|disabled — computed, not writable' },
            { name: 'PromotionRedemption', type: 'entity', required: true, notes: 'promotionId, companyId, orderId, discountAmount, redeemedAt — UNIQUE (promotionId, orderId); this is the cap counter and the report' },
          ],
          endpoints: [
            'GET /admin/promotions?status=&q=&page=',
            'POST /admin/promotions',
            'PUT /admin/promotions/:id — Draft only, or non-pricing fields',
            'POST /admin/promotions/:id/issue · /disable',
            'GET /admin/promotions/:id/redemptions',
            'POST /orders/:id/apply-promotion { code } — validates every bound and freezes the discount',
          ],
          integrations: ['Orders (discount application)', 'CRM (quotation discounts, customer status for new-customer eligibility)', 'Reporting (campaign cost)'],
          notes:
            'Enforce the total cap with an atomic counter or a unique-constrained redemption insert — a read-then-write check will overshoot under concurrency, and overshooting a cap is real money. Derive status rather than storing it, so Exhausted needs no job to become true.',
        },
        acceptance: [
          'A code outside its window, out of scope, or over cap is refused at application with a clear reason.',
          'Concurrent redemptions never exceed the total usage cap.',
          'The discount frozen on an order does not change when the promotion is later edited or disabled.',
          'Reaching the cap flips the status to Exhausted with no operator action.',
          '"Disable" stops all further redemption immediately and leaves past orders untouched.',
          '"New customers only" correctly excludes a company that has already been invoiced.',
          'The redemptions view totals the discount given, matching what the orders show.',
        ],
        openQuestions: [
          'Does a cancelled or refunded order release its redemption back to the cap?',
          'Are single-use personalised codes needed (one per company), or only shared campaign codes?',
          'Can a promotion apply to a quotation in CRM as well as to an order, and does sales discounting go through promotions at all or stay free-form on the quote?',
          'Is there an approval threshold above which a discount needs a second approver?',
        ],
      },
    },
  ],
}
