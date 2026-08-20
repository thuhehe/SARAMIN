import type { BuildModule } from './types'

/*
 * System — HQ-only configuration (the admin console's System-settings area).
 *
 * Everything here changes how the REST of the platform behaves, which is why it
 * sits behind the strictest role grants. Two groups of features:
 *
 *   Config    Company information (our issuer identity on every sales document),
 *             Membership tiers, Master data (every reference list).
 *   Platform  Audit log (the change trail), Environment (feature flags),
 *             Departments (internal org reference data).
 *
 * Identity & access — Staff directory, Roles & permissions, Operators (users) —
 * used to live here too; it is now its own module ("Roles & permissions"), since
 * it is a feature in its own right. Products also appears under the System menu
 * but is specified in the Products & Packages module.
 *
 * The interactive prototypes live on the Admin wireframe; each feature's
 * "Screen UI" panel embeds that same live prototype.
 */

export const adminSystem: BuildModule = {
  id: 'admin-system',
  title: 'System',
  owner: 'Luong',
  requirements: [
    {
      label: 'What the System menu contains',
      text: 'Everything under System is HQ-only configuration — it changes how the rest of the platform behaves, so it sits behind the strictest role grants. Identity & access (Staff · Users · Roles & permissions) is specified separately in the Roles & permissions module; the pages below are what this module owns.',
      table: {
        cols: ['Page', 'What it configures', 'Who needs it'],
        rows: [
          ['Company information', 'Our own issuer identity on every sales document', 'Finance / super admin'],
          ['Products', 'The catalogue — what is sellable and at what price (see Products & Packages)', 'Finance / super admin'],
          ['Membership tiers', 'The loyalty programme — tier thresholds, per year, plus a manual benefit note per tier (see CRM)', 'Sales lead / marketing'],
          ['Master data', 'Every reference list (dropdowns + search filters)', 'Operations'],
          ['Audit log', 'The platform-wide change trail', 'Super admin / compliance'],
          ['Environment', 'Feature flags', 'Engineering'],
          ['Departments', 'Internal org reference data', 'Operations'],
        ],
      },
    },
    {
      label: 'Console shell — one bar, one sidebar',
      text: 'Every admin page is framed by the same chrome: a single top bar and a left sidebar. The bar carries the breadcrumb (Group / Page / Record) as well as global search, so there is never a second bar under it — a page’s own title and its create action belong to the page body, not the frame. The sidebar’s switcher block (logo + console name) sits at the sidebar’s width, so the top-left corner reads as one piece with the nav below it.',
      items: [
        'The bar holds no dividers and no global search: breadcrumb on the left, then History · View full spec · language (one globe icon carrying the active code) · notifications · account.',
        'Nav groups are foldable; “Expand all / Collapse all” turns the tree into a short index and back.',
        'A folded group holding the current page shows a dot on its header, so the reader never loses their position.',
        'Role permissions still decide what is in the nav at all: a page granted None is not rendered in either state.',
      ],
    },
    {
      label: 'Sidebar states — collapse is a saved preference',
      text: 'Wide tables (pipeline, quotations, jobs) need the horizontal room, so the sidebar collapses to an icon rail. Collapsing never costs access to a page — only the labels being permanently on screen.',
      table: {
        cols: ['State', 'Width', 'How the reader navigates'],
        rows: [
          ['Expanded', '236 px', 'Full grouped tree, one page per row'],
          ['Collapsed', '56 px (icon rail)', 'Hover a group icon → flyout of its pages; click the icon → the sidebar expands with that group open'],
          ['Narrow viewport (< 768 px)', '56 px (forced)', 'Rail only — the labelled panel has nowhere to go, so the flyout is the nav'],
        ],
      },
      items: [
        'Toggled from the sidebar’s own header — a ‹ arrow beside the console name, and the logo itself turns into a › to expand — or with the “[” shortcut. The page bar carries no sidebar control.',
        'Both the collapsed state and which groups are open persist per operator (browser storage), so the console reopens the way it was left.',
      ],
    },
    {
      label: 'List pages — one toolbar, one footer',
      text: 'Every list in the console is built from the same two strips, so a page never explains itself in prose: the reader sees the data.',
      table: {
        cols: ['Strip', 'Holds', 'Rule'],
        rows: [
          ['Line 1 — tabs', 'Status tabs (All / Draft / Open …) · the page’s create button on the right', 'No description paragraph above a table, and no rule under the toolbar.'],
          ['Line 2 — narrowing', 'Search box FIRST, then the filters', 'Search leads the row: it is the control people reach for first, and both live on one line.'],
          ['Count line', '“Search <n> / Total <N>”', 'Sits directly on top of the table it describes. Total is the whole list, not what survived the filters.'],
          ['Table', 'Columns only', 'Empty search result reads “No rows match …”'],
          ['Footer (below the table)', 'Rows per page (10 / 20 / 50 / 100) · pagination', 'No explanatory footnote — the count belongs to the count line, not a sentence.'],
        ],
      },
      items: [
        'ONE search box per list, matching against every column — no field picker to learn and no guessing which column a value lives in. It also matches fields the table does not print (company ID, MST) when the placeholder promises them.',
        'Search ignores diacritics and case, so “cong ty” finds “Công ty” — required for VN data entered both ways.',
        'Rows per page is the operator’s choice, not a fixed page size.',
      ],
    },
    {
      label: 'Company information — the issuer identity (Saramin, not a customer)',
      text: 'Our own legal identity, set ONCE here and read by every quotation, sales order and VAT invoice. Nobody retypes it per document, and a sent document keeps the version it was sent with.',
      table: {
        cols: ['Group', 'Fields'],
        rows: [
          ['Legal identity', 'Company name (VI + EN), tax code (MST), address (VI + EN), website'],
          ['Brand', 'Logo used on the letterhead'],
          ['Document defaults', 'VAT rate, quotation validity, discount threshold needing approval, quotation / sales-order number formats, support email'],
          ['Bank details', 'Bank, account number, account name — printed on the order so the customer can pay'],
        ],
      },
      items: [
        'Bilingual by design: VI and EN both print on the letterhead, so one document serves local and foreign customers.',
        'The "proposed by" line is the SIGNED-IN rep, not a setting here.',
        'Changing these values must not retroactively alter documents already issued — documents store a snapshot.',
      ],
    },
    {
      label: 'Membership tiers — the loyalty programme, configured not coded',
      text: 'Chương trình Khách hàng Thân thiết. Two tables: the thresholds that earn a tier, and what each tier gets. Both are data because the programme is re-issued every year and the bands move. The tier itself is never typed — it is computed from the value of the orders a company paid for inside the current programme year, and it is displayed on the company record in the CRM.',
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
        'Only the LOWER bound of a band is stored — "đến dưới" is read from the next band up, so bands can never overlap or leave a gap.',
        'Benefits are NOT tracked by the system. Each tier carries a free rich-text note that CSKH writes and reads; quyền lợi are agreed and delivered by hand. A benefits × tiers matrix was rejected because it implied the system grants, counts and decrements each cell — it does none of those.',
        'Editing a threshold re-tiers the affected companies with no release, and the page shows the live per-band company count so the effect is visible before leaving it.',
        'Same principle as Master data and the Tools rate tables: a policy change is an admin edit, never a deployment.',
      ],
      warn: 'The accumulator RESETS to 0 ₫ on 1 January and nothing carries over — a Kim Cương customer starts the new year with no tier and climbs again. So a tier is a fact about (company, YEAR), never a single column on the company: that column is what leaves stale badges behind every January. Editing this page is not retroactive — a benefit already granted keeps the terms it was granted under.',
    },
    {
      label: 'Master data — one source of truth for every reference list',
      text: 'All dropdown / filter vocabularies live here, so the job form, the CV form and the Store search filters can never drift apart. Vietnamese is mandatory; English and Korean are optional.',
      table: {
        cols: ['Domain', 'Shape'],
        rows: [
          ['Job categories & roles', 'Two-level taxonomy (Category → Role)'],
          ['Locations', 'Grouped (region → province / city)'],
          ['Skills', 'Tag set — the canonical list CV extraction and search must resolve to'],
          ['Industry · Job level · Job type · Education level · Application language · Salary currency', 'Flat lists'],
        ],
      },
      items: [
        'Each domain feeds the matching form dropdown; an operator can also add a value inline from that dropdown (＋ Create new…) and it is saved back here.',
        'Adding a value is a DATA change, never a release — this is the same principle as the job taxonomy (see Job management) and the tool rate tables (see Tools).',
        'A value in use cannot simply vanish: renaming is safe, removing needs a merge/replace path so existing records keep resolving.',
      ],
    },
    {
      label: 'Master-data entry status',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Active', 'Usable / selectable in every picker', 'Renaming is safe — records store the id, not the label'],
          ['Retired', 'No longer offered, but stays resolvable for existing records', 'A value in use is retired or merged, never hard-deleted'],
        ],
      },
    },
    {
      label: 'Audit logging — everything, platform-wide',
      text: 'Who (operator · company user · jobseeker · System) changed what, when, and the before → after value. Covers every create / update / delete / status change and system actions (auto-expiry, auto-publish, provisioning, notifications).',
      table: {
        cols: ['Scope', 'Shows', 'Reached from'],
        rows: [
          ['System → Audit log', 'The whole firehose — searchable, filterable', 'System menu'],
          ['Per-page History drawer', 'Recent activity in that section', 'Any admin page'],
          ['Record Activity / History', 'That one record’s trail', 'The record itself (e.g. company Overview)'],
        ],
      },
      items: [
        'The three scopes must not overlap.',
        'The log is immutable and exportable — entries are never edited or deleted, including when the actor is disabled.',
        'PII-view actions are audited even though nothing changed: opening a resume / unlocking a CV records actor + candidate + timestamp.',
      ],
    },
    {
      label: 'Environment — feature flags',
      text: 'Flags gate which surfaces are live and which still read mock data, so a half-finished area can ship dark instead of blocking a release (e.g. store.jobs.realData, store.companies.reviews, crm.purchaseOrders, notifications.zaloZNS).',
      items: [
        'Some flags are UI-editable here; others are environment-only and read-only in the console — the page must show which is which.',
        'Every flag change is audited: a flag flip changes behaviour for real users.',
      ],
    },
    {
      label: 'Departments — internal org reference data',
      text: 'The HQ department list (name, member count, lead) used to group operators and to route work.',
      warn: 'Prototype only — no backend counterpart yet. Confirm with the client whether departments are actually needed in Phase 1, or whether the role on each operator is enough.',
    },
  ],
  features: [
    // 1 · Company information ─────────────────────────────────────────────────
    {
      name: 'Company information',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'Our OWN issuer identity — not a customer record. Set once; every sales document reads it.',
      mockup: 'admin-issuer',
      detail: {
        description:
          'Saramin’s own legal identity, set once and read by every quotation, sales order and VAT invoice. It exists so nobody retypes the letterhead per document and so the numbers, VAT rate and bank details are consistent across everything we send. A live letterhead preview shows exactly what the customer will see, in VI and EN.',
        userStory:
          'As finance, I want our legal identity and document defaults in one place, so that every document we send is correct and identical without anyone retyping it.',
        uiFields: [
          {
            group: 'Legal identity',
            items: [
              { name: 'companyName (vi / en)', type: 'i18n string', required: true, notes: 'both print on the letterhead — line 1 VI, line 2 EN' },
              { name: 'taxCode (MST)', type: 'string', required: true, notes: 'prints on the VAT invoice' },
              { name: 'address (vi / en)', type: 'i18n string', required: true },
              { name: 'website', type: 'url' },
            ],
          },
          {
            group: 'Brand',
            items: [{ name: 'logo', type: 'image', notes: 'shown top-right of the letterhead' }],
          },
          {
            group: 'Document defaults',
            items: [
              { name: 'vatRate', type: 'percent', required: true, notes: 'default VAT applied to quotation / invoice lines' },
              { name: 'quotationValidity', type: 'number (days)', notes: 'drives the "valid until" date' },
              { name: 'discountApprovalThreshold', type: 'percent', notes: 'above this, a quotation needs approval' },
              { name: 'quotationNoFormat / salesOrderNoFormat', type: 'pattern', notes: 'e.g. EST-xxxxxx-MM-YYYY' },
              { name: 'supportEmail', type: 'email' },
            ],
          },
          {
            group: 'Bank details (printed on the order)',
            items: [
              { name: 'bankName', type: 'string', required: true },
              { name: 'accountNo', type: 'string', required: true },
              { name: 'accountName', type: 'string', required: true },
            ],
          },
        ],
        behaviors: [
          'A VI / EN toggle switches the letterhead preview so both languages can be proof-read before saving.',
          'Saving does NOT touch documents already issued — each document keeps the snapshot it was sent with.',
          'The "proposed by" line on a document is the signed-in rep, resolved at send time, not a field here.',
        ],
        rules: [
          'There is exactly ONE issuer record — this is configuration, never a list.',
          'Tax code and bank details are required before any VAT invoice can be issued.',
          'A change is audited: these values appear on legal documents.',
        ],
        states: ['Viewing', 'Editing (unsaved)', 'Saved', 'Incomplete — blocks invoicing'],
        backend: {
          dataModel: [
            { name: 'issuerId', type: 'singleton' },
            { name: 'name / address', type: 'i18n jsonb' },
            { name: 'taxCode', type: 'string', required: true },
            { name: 'vatRate / quotationValidity / discountThreshold', type: 'numeric' },
            { name: 'numberFormats', type: 'jsonb' },
            { name: 'bank', type: 'jsonb', notes: 'bankName · accountNo · accountName' },
          ],
          endpoints: ['GET /admin/issuer', 'PUT /admin/issuer'],
          integrations: ['CRM documents (quotation · sales order · VAT invoice) read this at render time'],
          notes: 'Documents must persist a snapshot of these values, not a live reference.',
        },
        acceptance: [
          'A new quotation renders the letterhead, VAT rate, numbering and bank details from this page with nothing retyped.',
          'Editing the issuer leaves an already-sent quotation byte-identical to what the customer received.',
        ],
        openQuestions: [
          'Is there more than one issuing legal entity (e.g. a second entity for KR billing)? If so this stops being a singleton.',
          'Who is allowed to edit this — finance only, or any super admin?',
        ],
      },
    },

    // 2 · Membership tiers ───────────────────────────────────────────────────
    {
      name: 'Membership tiers',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'The loyalty programme’s configuration: tier thresholds per programme year, plus a free note per tier recording what that tier gets. The tier itself is COMPUTED and displayed in the CRM (see CRM → Companies); the benefits are delivered by hand.',
      mockup: 'admin-membership',
      detail: {
        description:
          'The settings page behind Chương trình Khách hàng Thân thiết. One table and one note per tier: the thresholds that earn a tier, and free rich text describing what that tier gets. The thresholds are data because the programme is re-issued every year and the bands move — 2025’s figures already differ from 2026’s, and that must never be a code change. The benefits are a NOTE rather than a table because nothing grants, counts or decrements them — CSKH agrees and delivers them by hand. This page configures; it does not display. The tier badge, the accumulated-in-year figure and the gap to the next band live on the company record in the CRM, and the arithmetic that produces them is described here because this is where its inputs are set.',
        userStory:
          'As a sales lead, I want to set the tier thresholds and what each tier gets, so the loyalty programme can be re-issued each year without a release and without anyone maintaining a spreadsheet.',
        uiFields: [
          {
            group: 'Programme — the cycle and what counts toward it',
            items: [
              { name: 'programmeName', type: 'string', required: true, notes: 'e.g. "Chương trình Khách hàng Thân thiết 2026" — used on anything customer-facing' },
              { name: 'cycle', type: 'enum', required: true, notes: 'the accumulation window. Calendar year (01/01 – 31/12) per the client: reset once at the start of each new year.' },
              { name: 'basis', type: 'enum', required: true, notes: 'what the accumulator sums: paid order value (default) · issued VAT-invoice value · PO value. NOT yet confirmed with business — the three give different totals for the same customer.' },
              { name: 'groupRollUp', type: 'boolean', required: true, notes: 'default OFF. A subsidiary’s orders do not raise its parent’s tier — the same “the parent/subsidiary link inherits NOTHING” rule the CRM applies to quota and billing.' },
              { name: 'refundBehaviour', type: 'enum', required: true, notes: 'whether a cancelled / refunded order is subtracted, and if so whether a company may DROP a tier mid-cycle or keeps the tier it reached until the reset' },
              { name: 'recomputeMode', type: 'enum', required: true, notes: 'live (on every order.paid) or periodic (a scheduled roll-up). Decides how soon a customer sees a new entitlement.' },
            ],
          },
          {
            group: 'Tier thresholds — one row per band, ascending',
            items: [
              { name: '“Chưa có hạng” row', type: 'derived row', notes: 'the table OPENS with a non-editable row for the below-threshold population: 0 ₫ → 30.000.000 ₫, with its own live company count. It is rendered inside the band table because in practice it IS a band — the one nobody configures. Showing it is what stops "no tier" reading as missing data.' },
              { name: 'labelVi / labelEn', type: 'string', required: true, notes: 'Thành viên / Member · Đồng / Bronze · Bạc / Silver · Vàng / Gold · Kim Cương / Diamond. Rendered as the tier badge so the settings page and the CRM company record show the same visual token.' },
              { name: 'fromAmount', type: 'currency (₫)', required: true, notes: 'the LOWER bound: 30M · 50M · 100M · 200M · 300M. The ONLY editable cell in the row, and the only number stored — rendered as a text input, while everything beside it is plain text.' },
              { name: '“đến dưới”', type: 'derived', notes: 'read from the next band’s fromAmount — never entered, so bands cannot overlap or leave a gap. The top band renders “không giới hạn” rather than a number.' },
              { name: 'sortOrder', type: 'int', required: true, notes: 'the ascending order every lookup depends on; adding or removing a band is adding or removing a row' },
              { name: 'companiesInBand', type: 'derived', notes: 'live count next to every row, the no-tier row included — the sanity check that a threshold edit did what the editor expected, shown BEFORE they leave the page' },
            ],
          },
          {
            group: 'Quyền lợi theo hạng — a note per tier, not a matrix',
            items: [
              { name: 'benefitNote', type: 'rich text', notes: 'ONE rich-text field per tier (bold / italic / list / link). Free prose — the system neither parses it nor acts on it.' },
              { name: 'nothing derived', type: 'note', notes: 'No grant record is created here, nothing is counted down, and no downstream screen reads it. It is documentation for the people who deliver the benefit by hand.' },
            ],
          },
        ],
        behaviors: [
          'Editing a threshold re-tiers every affected company immediately; the per-band company count on this page updates so the effect of the edit is visible before leaving it.',
          'The threshold table renders "Từ" as an editable input and "Đến dưới" plus the company count as plain derived text. The read/write split is visible in the page itself, not explained in a footnote.',
          'The band table opens with a "Chưa có hạng" row (0 ₫ → the first threshold) carrying its own company count, so the below-threshold population is counted rather than hidden.',
          'The reward matrix is edited cell by cell — every cell is an input, including the not-granted ones. An EMPTY cell (dimmed “—” placeholder) is how "this tier does not get this benefit" is expressed, mirroring the absent grant row in the data model, so it can never be read as a zero-value benefit.',
          'Edits are staged and committed with an explicit Save — nothing on this page autosaves, because a mistyped threshold re-tiers the whole customer base.',
          'The footer pairs the two guarantees that make editing safe: every change is audited, and no change is retroactive. They are stated together because either one alone is not enough to make an edit reversible in practice.',
          'The page states the reset date explicitly, because the reset is the rule most likely to be forgotten when the programme is re-issued.',
          'Unresolved policy questions are listed ON this page, numbered, and labelled as build blockers — so they cannot be lost in a chat thread while the page is being built.',
        ],
        rules: [
          'A tier is NEVER set by hand. There is no override field anywhere in the admin: if a tier is wrong, the orders behind it are wrong.',
          'The accumulator resets to 0 ₫ at the start of each cycle and nothing carries over. The previous cycle’s total and tier stay readable, for reporting and for answering "what did they have last year".',
          'A tier is a fact about (company, cycle) — never a single column on the company. See the CRM data model note.',
          'Thresholds and catalogue values are per programme year, and editing them is not retroactive: a benefit already granted keeps the terms it was granted under.',
          'Only the lower bound of a band is stored; the upper bound is derived from the next band, so overlaps and gaps are impossible by construction.',
          'This page is CONFIGURATION, not fulfilment. Actually delivering a Top-Companies slot or a Facebook post is scheduled work owned by the module that owns that surface.',
        ],
        states: [
          'Programme configured for the current year (normal)',
          'No programme configured for this year — the CRM shows no Tier column at all rather than an empty one',
          'Threshold edited (companies re-tiered, edit audited)',
          'Cycle rolled over (accumulator back to 0 ₫, previous cycle archived)',
        ],
        backend: {
          dataModel: [
            { name: '— MembershipProgramme (config) —', type: 'config table' },
            { name: 'year / cycleStart / cycleEnd', type: 'int / date / date', required: true, notes: 'one row per programme year; the cycle is what makes the reset a NEW row instead of a destructive update' },
            { name: 'basis / groupRollUp / refundBehaviour / recomputeMode', type: 'enum / bool / enum / enum', required: true },
            { name: '— MembershipTier (config) —', type: 'config table' },
            { name: 'programmeId / sortOrder', type: 'ref / int', required: true },
            { name: 'labelVi / labelEn / fromAmount', type: 'string / string / bigint', required: true, notes: 'VND minor units. Only the lower bound is stored — the upper bound is the next row’s fromAmount.' },
            { name: 'benefitNote', type: 'text', notes: 'On MembershipTier. Rich text, free prose. There is NO MembershipBenefitGrant table — benefits are delivered manually, so there is nothing to grant, count or decrement.' },
            { name: '— CompanyTierCycle (computed) —', type: 'table' },
            { name: 'companyId / programmeId', type: 'ref / ref', required: true, notes: 'UNIQUE together — one row per company per cycle. This composite key IS the reset mechanism.' },
            { name: 'accumulatedAmount / tierId / computedAt', type: 'bigint / ref? / timestamp', required: true, notes: 'tierId nullable = chưa có hạng. A cache of a sum over orders: always rebuildable, never the source of truth.' },
          ],
          endpoints: [
            'GET /admin/system/membership/:year (programme + tiers + catalogue)',
            'PUT /admin/system/membership/:year (audited; re-tiers affected companies)',
            'GET /admin/crm/customers/:id/membership (tier, accumulated, gap, entitlement, resetsOn — read by the CRM company record)',
            'GET /admin/crm/customers?tier= (the CRM list column / filter source)',
            'job: recompute on order.paid · nightly reconcile against orders · cycle rollover on 1 January',
          ],
          integrations: ['CRM Purchase order / payments (the orders the accumulator sums)', 'CRM Companies (where the tier is displayed)', 'System → Audit log (threshold + catalogue edits)', 'Products & packages (the services a voucher discounts)'],
          notes:
            'CompanyTierCycle is a CACHE with a composite (company, programme) key, not a status column. Two consequences that matter: a corrected or refunded order can be replayed into a correct tier by re-running the sum, and the 1 January reset is simply "no row for the new programme yet" rather than a destructive UPDATE across the whole customer base. Keeping the previous cycle’s row is what lets reporting answer "how many Kim Cương did we have last year" — a question a single overwritten column can never answer. Fulfilment of the benefits themselves (booking a Top-Companies slot, scheduling a Facebook post) is deliberately NOT modelled here: it needs the slot-capacity answer first, or it will oversell.',
        },
        acceptance: [
          'Changing a threshold on this page re-tiers the affected companies and the per-band counts update, with no release.',
          'Every band shows a company count, the "chưa có hạng" row included, and the counts sum to the total number of companies — no company is unaccounted for.',
          'Only the "Từ" cell is editable in the threshold table; "Đến dưới" and the count cannot be typed into.',
          'Nothing on this page persists until Save is pressed; leaving with unsaved edits loses them rather than half-applying them.',
          'A company with 29.999.999 ₫ accumulated resolves to "chưa có hạng"; at 30.000.000 ₫ it resolves to Thành viên — with no operator action in between.',
          'At the start of a new cycle every company reads 0 ₫ accumulated and no tier, and the previous cycle’s total and tier are still queryable.',
          'A subsidiary’s paid order raises the subsidiary’s accumulated total and leaves its parent’s tier unchanged.',
          'A cleared matrix cell renders as "not granted" on the company record, never as a zero-value benefit.',
          'There is no field anywhere in the admin that sets a company’s tier by hand.',
          'Every edit here appears in the audit log with actor, before and after.',
        ],
        openQuestions: [
          'BLOCKS BUILD (1) — what happens to an UNUSED benefit at the reset: forfeited on 1 January, or does it carry its own validity that outlives the cycle? This decides whether benefits are entitlements (computed) or issued objects (stored with an expiry) — two different data models, not a detail.',
          'BLOCKS BUILD (2) — who triggers a benefit: does the customer choose the moment themselves (needs a self-serve surface on the company site), or does the customer ask sales and ops schedules it (needs an internal request queue)? The client asked this exact question about the voucher and about Top Companies.',
          'BLOCKS BUILD (3) — voucher mechanics: a fixed amount, or a percentage with a cap ("tối đa")? How many per cycle, what validity, is there a minimum order value, does leftover value survive a smaller order — and does it stack with the volume discount (Existing) and the 50% Churn & New offer? The Churn & New rule says "không áp dụng đồng thời với các chương trình khác", which currently reads as a direct conflict with this programme.',
          'BLOCKS BUILD (4) — do Top Companies and the search banner have a LIMITED number of slots? If they do, promising them to every Bạc / Vàng / Kim Cương customer oversells: it needs booking with an availability check, not a boolean. This is the largest piece of effort in the whole programme.',
          'BLOCKS BUILD (5) — is a mid-cycle DROP allowed when an order is refunded, or does a company keep the highest tier it reached until the reset? The "Đơn bị hủy / hoàn tiền" setting on this page cannot be given a safe default until this is answered.',
          'Confirm the basis: paid order value, issued VAT-invoice value, or PO value? The three give different totals for the same customer and the policy document does not say. Surfaced as a hint on the "Căn cứ tính tích lũy" field rather than a blocker, because the page ships with a defensible default.',
          'Can the Top-Companies allowance be split into several runs (e.g. 180 days as 2 × 90), or must it be continuous? Not on the page — it is a fulfilment rule, and fulfilment is out of scope here until (4) is answered.',
        ],
      },
    },

    // 3 · Master data ─────────────────────────────────────────────────────────
    {
      name: 'Master data',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'Every reference list in one place — the vocabulary the job form, CV form and Store filters all share.',
      mockup: 'admin-master-data',
      detail: {
        description:
          'One editor for every reference list used across the three sites. It exists so the job form, the CV form and the jobseeker search filters can never drift apart: they all read the same domain. Adding a value is a data change, not a release. Vietnamese is mandatory; English and Korean are optional and fall back to VI.',
        userStory:
          'As operations, I want to add or rename a value in one place and have every form and filter pick it up, so that nobody waits for a deploy to add a job category.',
        uiFields: [
          {
            group: 'Domain list (left rail)',
            items: [
              { name: 'domain', type: 'enum', required: true, notes: 'Industry · Job categories & roles · Job level · Skills · Education level · Application language · Job types · Locations · Salary currency · Company tag · Image topic' },
              { name: 'entryCount', type: 'derived', notes: 'per domain, so an empty or bloated list is obvious' },
            ],
          },
          {
            group: 'Entry (shape depends on the domain)',
            items: [
              { name: 'label (vi / en / ko)', type: 'i18n string', required: true, notes: 'VI required; EN / KO optional and fall back to VI' },
              { name: 'parent', type: 'ref', notes: 'taxonomy + grouped domains only — Category → Role, region → province' },
              { name: 'status', type: 'enum', notes: 'active · retired — retired stays resolvable for existing records' },
              { name: 'usageCount', type: 'derived', notes: 'how many records reference it — gates removal' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Domain shapes — not every list is flat',
            items: [
              'Taxonomy (two-level): Job categories → Roles. The job form reads Category then filters Role.',
              'Grouped: Locations — region → province / city.',
              'Tag set: Skills — the canonical list CV extraction and CV search must resolve to.',
              'Flat: Industry · Job level · Job type · Education level · Application language · Salary currency.',
            ],
          },
        ],
        behaviors: [
          'Pick a domain on the left, edit its entries on the right; each domain feeds the matching form dropdown.',
          'Operators can also add a value inline from that form dropdown (＋ Create new…) — it is saved back here, not stored as free text.',
          'Renaming a value updates it everywhere, because records reference the id and not the label.',
          'Removing a value that is in use is blocked; the flow is retire (hide from pickers) or merge into another value.',
        ],
        rules: [
          'VI is mandatory for every entry; a missing EN / KO falls back to VI rather than rendering blank.',
          'Records store the entry ID, never the display label — that is what makes rename safe.',
          'A value in use can never be hard-deleted: retire or merge, so historical records still resolve.',
          'Skills must be normalised here — a free-typed skill that never resolves silently breaks CV search and matching.',
        ],
        states: ['Domain selected', 'Adding an entry', 'Editing an entry', 'Remove blocked (in use)', 'Retired entry (hidden from pickers)'],
        backend: {
          dataModel: [
            { name: 'domain', type: 'enum', required: true },
            { name: 'entryId', type: 'uuid', required: true, notes: 'the stable value records reference' },
            { name: 'label', type: 'i18n jsonb', required: true, notes: '{ vi, en?, ko? }' },
            { name: 'parentId', type: 'uuid', notes: 'taxonomy / grouped domains' },
            { name: 'status', type: 'enum', notes: 'active · retired' },
            { name: 'sortOrder', type: 'int' },
          ],
          endpoints: [
            'GET /master-data/:domain — public read (forms + Store filters)',
            'POST /admin/master-data/:domain',
            'PATCH /admin/master-data/:domain/:entryId',
            'POST /admin/master-data/:domain/:entryId/merge { intoId }',
          ],
          integrations: ['Job form + job search (Job management)', 'CV form + CV search (Resume management)', 'Tools rate tables'],
          notes: 'Read path is cache-friendly and public; write path is admin-only and audited.',
        },
        acceptance: [
          'Adding a Role appears in the job form and the jobseeker filter without a deploy.',
          'Renaming an Industry updates every existing job and CV that referenced it.',
          'Attempting to delete an in-use value offers retire / merge instead of failing silently.',
        ],
        openQuestions: [
          'Which domains does the client want to own themselves, and which should stay engineering-managed?',
          'Do we need approval before a new value goes live, or is any operator edit immediate?',
        ],
      },
    },

    // 4 · Audit log ───────────────────────────────────────────────────────────
    {
      name: 'Audit log',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'The whole-platform change trail — the firehose behind the per-page History drawer.',
      mockup: 'admin-audit-log',
      detail: {
        description:
          'The searchable, filterable record of every change on the platform: who did it, what changed (before → after), and when. This is the widest of the three audit scopes — the per-page History drawer and a record’s own Activity tab are filtered views of the same data.',
        userStory:
          'As a super admin, I want to search the full change trail so that I can answer “who changed this, and when” for any record on the platform.',
        uiFields: [
          {
            group: 'Entry',
            items: [
              { name: 'timestamp', type: 'datetime', required: true },
              { name: 'actor', type: 'ref | "System"', required: true, notes: 'operator · company user · jobseeker · System' },
              { name: 'action', type: 'string', required: true, notes: 'e.g. Approved job · Activated customer · Viewed resume (PII)' },
              { name: 'target', type: 'ref', required: true, notes: 'entity + id the action applied to' },
              { name: 'before → after', type: 'jsonb diff', notes: 'the changed fields only' },
            ],
          },
          {
            group: 'Filters',
            items: [
              { name: 'actor / actorType', type: 'select' },
              { name: 'entity type', type: 'select' },
              { name: 'date range', type: 'range' },
              { name: 'keyword', type: 'string' },
            ],
          },
        ],
        behaviors: [
          'Filter by actor, entity, action type and date range; search by keyword.',
          'Export the filtered set (CSV) for compliance requests.',
          'System actions appear with a System actor — auto-expiry, auto-publish, provisioning, notifications.',
        ],
        rules: [
          'Append-only and immutable — entries are never edited or deleted, including when the actor is later disabled.',
          'PII-view actions are recorded even though nothing changed (opening a resume / unlocking a CV).',
          'The three scopes must not overlap: this page is the firehose, the drawer is per-section, Activity is per-record.',
          'Reading the audit log is itself a permissioned action.',
        ],
        states: ['Unfiltered (latest first)', 'Filtered', 'Filtered-empty', 'Exporting'],
        backend: {
          dataModel: [
            { name: 'entryId', type: 'uuid' },
            { name: 'at', type: 'timestamp', required: true },
            { name: 'actorId / actorType', type: 'uuid / enum' },
            { name: 'action', type: 'string', required: true },
            { name: 'entity / entityId', type: 'string / uuid', required: true },
            { name: 'diff', type: 'jsonb', notes: 'before → after, changed fields only' },
          ],
          endpoints: ['GET /admin/audit?actor=&entity=&from=&to=&q=&page=', 'GET /admin/audit/export'],
          notes: 'Write path is a shared service every module calls; retention policy needs a decision.',
        },
        acceptance: [
          'Every create / update / delete / status change produces exactly one entry with a usable before → after.',
          'Opening a resume appears in the log with actor, candidate and timestamp.',
          'An entry cannot be edited or removed through any interface.',
        ],
        openQuestions: [
          'How long do we retain audit entries, and is archived data still searchable?',
          'Is the export self-service, or does a compliance request go through engineering?',
        ],
      },
    },

    // 5 · Environment ─────────────────────────────────────────────────────────
    {
      name: 'Environment',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'Feature flags — how a half-finished area ships dark instead of blocking a release.',
      mockup: 'admin-environment',
      detail: {
        description:
          'The feature-flag board. Flags gate which surfaces are live and which still read mock data, so an unfinished module can be merged and shipped switched off. Some flags are editable here; others are environment-only and read-only in the console.',
        userStory:
          'As engineering, I want to switch a surface between mock and real data without a deploy, so that we can ship incrementally and roll back instantly.',
        uiFields: [
          {
            group: 'Flag',
            items: [
              { name: 'key', type: 'string', required: true, notes: 'namespaced, e.g. store.jobs.realData · crm.purchaseOrders · notifications.zaloZNS' },
              { name: 'description', type: 'string', required: true, notes: 'what actually changes when this is on — required, or nobody dares flip it' },
              { name: 'value', type: 'boolean', required: true },
              { name: 'editability', type: 'enum', required: true, notes: 'UI-editable · environment-only (read-only here)' },
            ],
          },
        ],
        behaviors: [
          'Toggling a UI-editable flag takes effect without a deploy.',
          'Environment-only flags render read-only, with their source shown — the page must never imply a flag is editable when it is not.',
          'Every flip is audited: a flag changes behaviour for real users.',
        ],
        rules: [
          'A flag needs a human-readable description before it can be shown here.',
          'Flags are booleans, not config values — anything with a value belongs in Master data or Company information.',
          'Flags are meant to be temporary: each one should have an owner and an expected removal point, or the codebase accumulates dead branches.',
        ],
        states: ['On', 'Off', 'Read-only (environment-managed)'],
        backend: {
          dataModel: [
            { name: 'key', type: 'string', required: true },
            { name: 'value', type: 'boolean', required: true },
            { name: 'editable', type: 'boolean' },
            { name: 'description / owner', type: 'string' },
          ],
          endpoints: ['GET /admin/flags', 'PATCH /admin/flags/:key'],
          integrations: ['Every surface that reads a flag', 'Audit log'],
        },
        acceptance: [
          'Flipping store.jobs.realData switches the Store between mock and real data with no deploy.',
          'An environment-only flag cannot be changed from the console.',
          'Each flip appears in the audit log with the actor.',
        ],
        openQuestions: [
          'Do flags need per-environment values (dev / staging / prod) in one view, or is this prod-only?',
          'Should any flag support a percentage rollout, or are booleans enough for Phase 1?',
        ],
      },
    },

    // 6 · Departments ─────────────────────────────────────────────────────────
    {
      name: 'Departments',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'Internal org reference data. Prototype only — confirm it is needed before building.',
      mockup: 'admin-departments',
      detail: {
        description:
          'The HQ department list (name, member count, lead) used to group staff and route work. It is reference data for the Staff directory, not an access mechanism — permissions come from the role, never the department.',
        userStory:
          'As operations, I want staff grouped by department so that ownership and routing reflect how the team is actually organised.',
        uiFields: [
          {
            group: 'Department',
            items: [
              { name: 'name', type: 'string', required: true, notes: 'e.g. Sales, Operations, Content, Engineering' },
              { name: 'lead', type: 'ref → staff', notes: 'the person accountable for the group' },
              { name: 'memberCount', type: 'derived', notes: 'from the Staff directory — never typed' },
            ],
          },
        ],
        behaviors: [
          'Each staff member belongs to one department, set on their Staff directory record.',
          'Member count is derived from staff, so it cannot drift from reality.',
          'A department in use cannot be deleted — reassign its members first.',
        ],
        rules: [
          'A department grants NO permissions. Access is the role, always (see Roles & permissions).',
          'Deleting is blocked while staff are assigned; retire instead.',
        ],
        states: ['Empty', 'Has members', 'Delete blocked (in use)'],
        backend: {
          dataModel: [
            { name: 'departmentId', type: 'uuid' },
            { name: 'name', type: 'string', required: true },
            { name: 'leadStaffId', type: 'uuid' },
          ],
          endpoints: ['GET /admin/departments', 'POST /admin/departments', 'PATCH /admin/departments/:id'],
          integrations: ['Staff directory (membership)', 'CRM ownership (Sales department members are assignable owners)'],
        },
        acceptance: [
          'A staff member can be assigned a department and the count updates without manual entry.',
          'A department with members cannot be deleted.',
        ],
        openQuestions: [
          'Is Departments actually needed in Phase 1, or is the role on each operator enough? The prototype has no backend counterpart yet.',
          'Do departments ever nest (a team inside a department), or is one flat level enough?',
        ],
      },
    },
  ],
}
