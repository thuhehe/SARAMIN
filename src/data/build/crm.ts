import type { BuildModule } from './types'

/*
 * CRM — Sales & customer lifecycle (HQ Admin).
 *
 * A module separate from the jobseeker flow: the sales team manages companies
 * as customers and tracks each deal from Lead → Won. The CRM's job ENDS at Won —
 * on Won, the rep hands off to Account management, which activates the customer
 * (creates the account, provisions products/quota, and — for Job Posting — the
 * public company page). One company record is born here as a lead and grows up.
 *
 * Also here: the sales back office (Quotes → PO → Invoices → Payments, Contracts).
 * Depth mirrors ./job-management.ts. UI mockups link per feature via `mockup`.
 */

export const crm: BuildModule = {
  id: 'crm',
  title: 'CRM — Sales & customer lifecycle',
  owner: 'Luan',
  requirements: [
    'A CRM separate from the jobseeker flow: sales manage companies as customers and track deals from lead to won.',
    'Sales pipeline (kanban) with stages Lead → Qualified → Proposal → Negotiation → Won / Lost; deal value + owner per card. The pipeline ENDS at Won.',
    'One company record throughout: created in the CRM as a lead. It has no login and is invisible to jobseekers until it is activated. No duplicate company records.',
    'On Won, hand off to Account management for activation (create account → provision products/quota → company page for Job Posting). Activation itself lives in the Account management module, not here.',
    'Quote-to-cash back office: Quotes → Purchase orders → Invoices → Payments, plus Contracts, each with its own status lifecycle. Payment is what provisions the account’s products/quota.',
    'Connects to Account management (the activated customer) and Products & packages (what they bought).',
  ],
  features: [
    // 0 · Pipeline ────────────────────────────────────────────────────────────
    {
      name: 'Sales pipeline',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'crm-pipeline',
      detail: {
        description:
          'The sales team’s home screen: a kanban of customer deals grouped by stage, each column showing a deal count and total value. A rep drags a card forward as a deal progresses; reaching "Won" is the trigger to activate the company as a real customer.',
        userStory:
          'As a sales rep, I want to see all my deals by stage and move them forward, so that I always know what to work on next and what to close.',
        uiFields: [
          {
            group: 'Board',
            items: [
              { name: 'stage columns', type: 'enum', required: true, notes: 'Lead · Qualified · Proposal · Negotiation · Won · Lost' },
              { name: 'column total', type: 'derived', notes: 'deal count + summed deal value (₫) per stage' },
              { name: 'view toggle', type: 'enum', notes: 'board · list · grid' },
            ],
          },
          {
            group: 'Deal card',
            items: [
              { name: 'company', type: 'ref → Customer', required: true },
              { name: 'industry', type: 'enum', notes: 'Y tế · IT · BĐS · Logistics · Bán lẻ · Giáo dục · Tài chính…' },
              { name: 'value', type: 'money (₫)' },
              { name: 'owner', type: 'ref → admin user' },
              { name: 'lastActivity', type: 'relative date' },
              { name: 'activityBadges', type: 'counts', notes: 'linked quotes / POs / invoices / contracts' },
            ],
          },
        ],
        behaviors: [
          'Filter by owner, industry, recency and min deal value; sort (default updated-desc).',
          'Activity quick-filters: has quote / has PO / has invoice / has contract.',
          'Drag a card between columns to change its stage; dropping into Won opens the activation flow.',
          '"New quote" / "Invoices" shortcuts jump to those sub-modules for the selected deal.',
        ],
        rules: [
          'A deal belongs to exactly one customer and one owner.',
          'Won and Lost are terminal columns; a Lost deal can be re-opened to an earlier stage.',
        ],
        states: ['Loading', 'Empty (no deals)', 'Filtered-empty', 'Won just reached (activation CTA)'],
        backend: {
          dataModel: [
            { name: 'dealId', type: 'uuid', required: true },
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'stage', type: 'enum', required: true, notes: 'lead|qualified|proposal|negotiation|won|lost' },
            { name: 'value', type: 'money' },
            { name: 'ownerId', type: 'uuid' },
            { name: 'updatedAt', type: 'timestamp' },
          ],
          endpoints: ['GET /admin/crm/deals?stage=&owner=&industry=&page=', 'PATCH /admin/crm/deals/:id { stage }'],
          notes: 'Deals reference the Customer entity; moving to won emits an event the activation flow listens to.',
        },
        acceptance: [
          'Deals render grouped by stage with correct per-column totals.',
          'Dragging a card changes its stage and persists.',
          'Reaching Won surfaces the "Activate customer" path.',
        ],
        openQuestions: [
          'Confirm the exact stage names + order with the sales team.',
          'Is deal value typed by the rep, or rolled up from the accepted quote?',
          'Are stages fixed, or configurable per team?',
        ],
      },
    },
    // 1 · Customers ─────────────────────────────────────────────────────────────
    {
      name: 'Companies (one list)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'crm-customer',
      detail: {
        description:
          'ONE list of every company — the single source of truth. A record is born as a cold Lead and carries a status through the whole journey: Lead → Qualified → Proposal → Won (customer) → Expired → Lost. The Pipeline is the SAME list shown as a board (grouped by status). There is no separate "account list" — Account management (users, products, public page) is just sections on this same record, shown only for customers who bought them. No duplicate company.',
        userStory:
          'As a sales rep, I want one list that holds every company — from cold lead through paying customer to renewal — so history, account, and status never fragment across two lists.',
        uiFields: [
          {
            group: 'Customer record (CRM — internal only)',
            items: [
              { name: 'legalName', type: 'string', required: true },
              { name: 'taxCode (MST)', type: 'string', notes: 'de-dup key + VAT invoicing' },
              { name: 'industry', type: 'enum' },
              { name: 'address / location', type: 'string' },
              { name: 'primaryContact', type: 'person', notes: 'name, role, phone, email' },
              { name: 'lifecycleStatus', type: 'enum', required: true, notes: 'Lead → Qualified → Proposal → Won (customer) → Expired (renewal) → Lost — one status across the whole journey' },
              { name: 'owner', type: 'ref → admin user' },
              { name: 'accountId', type: 'ref → Account', notes: 'set at activation; empty while a prospect' },
              { name: 'companyId', type: 'ref → Company', notes: 'set only if the customer posts jobs' },
            ],
          },
        ],
        behaviors: [
          'One list, filterable by status (Lead / Qualified / Proposal / Won / Expired / Lost), owner, industry, activity (has quote/PO/invoice/contract).',
          'The Pipeline board is this same list grouped by status — a view, not a second dataset.',
          'Row → the company record: contact, deal(s), quote/PO/invoice history, and — for customers — its account, products/quota, users, and public page as sections.',
          'From a Won company, "Convert / Activate" provisions the account. Renewal loop: after the product period ends → Expired → the company re-enters the pipeline for renewal (no new record).',
        ],
        rules: [
          'A company is always created here first — the CRM is the single front door, even for a company that arrives already large.',
          'De-duplicate on tax code / legal name at creation; block or offer merge on a match.',
          'A Lead has no login and is invisible to jobseekers; account + public page exist only after Won + activation.',
          'Products and the public company page are per-record sections gated by product (Job Posting) — never a reason for a separate list.',
          'Expired ≠ a new record — it is the same company looping back for renewal.',
        ],
        states: ['Lead', 'Qualified', 'Proposal', 'Won (customer)', 'Expired (renewal candidate)', 'Lost', 'Duplicate detected'],
        backend: {
          dataModel: [
            { name: 'customerId', type: 'uuid', required: true },
            { name: 'legalName', type: 'string', required: true },
            { name: 'taxCode', type: 'string', notes: 'unique — dedup key' },
            { name: 'lifecycleStatus', type: 'enum', required: true },
            { name: 'accountId', type: 'uuid?', notes: 'nullable until activation' },
            { name: 'companyId', type: 'uuid?', notes: 'nullable; set when Job Posting enabled' },
            { name: 'ownerId', type: 'uuid' },
          ],
          endpoints: ['GET /admin/crm/customers?…', 'POST /admin/crm/customers (dedup check)', 'GET /admin/crm/customers/:id'],
          notes: 'ONE company table. The Pipeline is a status-grouped view of it; Account management adds the account/users/products/page as related sections on the same record — never a second company list.',
        },
        acceptance: [
          'A lead can be created with internal-only data and no login.',
          'Duplicate tax code / legal name is caught at creation.',
          'A Won customer exposes the activation entry point.',
        ],
        openQuestions: [
          'Confirm: is a CRM customer the SAME record as a Company, or two records linked at activation? (recommended: same record + lifecycle status)',
          'When a company arrives outside sales (self-signup), auto-create a CRM customer so "always via CRM" still holds?',
          'Required fields to create a lead vs to activate a customer?',
        ],
      },
    },
    // 2 · Quotes ──────────────────────────────────────────────────────────────
    {
      name: 'Quotes',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'Price quotes to a customer with a full status lifecycle. A quote proposes catalog line items + total; an accepted quote is the basis for a PO / order and, ultimately, an invoice.',
        userStory: 'As a sales rep, I want to send a priced quote and track whether it was accepted so that I can move the deal to close.',
        uiFields: [
          {
            group: 'Quote list',
            items: [
              { name: 'quoteCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)' },
              { name: 'status', type: 'enum', notes: 'Draft · Sent · Accepted · Rejected · Expired' },
              { name: 'validUntil', type: 'date' },
              { name: 'createdAt', type: 'date' },
            ],
          },
        ],
        behaviors: [
          'Create → add catalog line items → send → customer accepts/rejects; auto-expires past "valid until".',
          'An accepted quote can convert to a PO / order.',
        ],
        rules: ['Line items come from the product catalog.', 'Only Draft quotes are editable; Sent quotes are versioned / re-issued.'],
        states: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
        backend: {
          endpoints: ['GET /admin/crm/quotes', 'POST /admin/crm/quotes', 'POST /admin/crm/quotes/:id/send', 'POST /admin/crm/quotes/:id/convert'],
          integrations: ['Products & packages (line items)', 'Purchase orders / Orders (conversion)'],
        },
        acceptance: ['A quote moves through its lifecycle and an accepted quote can produce a PO.'],
        openQuestions: ['Quote → order/invoice conversion path?', 'PDF / e-signature needed?'],
      },
    },
    // 3 · Purchase orders ─────────────────────────────────────────────────────
    {
      name: 'Purchase orders',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'PO → payment → contract cluster needs backend build together if in launch scope.',
      detail: {
        description:
          'A PO records the customer’s commitment to buy (typically from an accepted quote) and links forward to one or more invoices.',
        userStory: 'As finance, I want to track customer POs so that I know what has been committed and what to invoice.',
        uiFields: [
          {
            group: 'PO list',
            items: [
              { name: 'poCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)' },
              { name: 'status', type: 'enum', notes: 'Draft · Sent · Accepted' },
              { name: 'invoiceCount', type: 'count', notes: 'invoices raised against this PO' },
              { name: 'issueDate', type: 'date' },
            ],
          },
        ],
        behaviors: ['Created from an accepted quote; once accepted, invoices are raised against it.'],
        rules: ['A PO belongs to one customer.', 'Invoices link back to their PO.'],
        states: ['Draft', 'Sent', 'Accepted', 'Invoiced (partial/full)'],
        backend: {
          endpoints: ['GET /admin/crm/pos', 'POST /admin/crm/pos (from quote)', 'GET /admin/crm/pos/:id'],
          integrations: ['Quotes (source)', 'Invoices (downstream)'],
          notes: 'Confirm launch scope — real svn-be build if yes.',
        },
        acceptance: ['A PO can be created from an accepted quote and tracks its invoices.'],
        openQuestions: ['Are POs / payments / contracts in launch scope? (significant backend build)', 'PO approval flow needed?'],
      },
    },
    // 4 · Invoices ────────────────────────────────────────────────────────────
    {
      name: 'Invoices',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'Invoices bill the customer against a PO/order. Each tracks total vs amount collected and a payment status; VN e-invoice (hóa đơn điện tử) compliance is likely required.',
        userStory: 'As finance, I want to issue invoices and see what has been collected so that I can chase overdue balances.',
        uiFields: [
          {
            group: 'Invoice list',
            items: [
              { name: 'invoiceCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'total', type: 'money (₫)' },
              { name: 'collected', type: 'money (₫)', notes: 'sum of payments applied' },
              { name: 'status', type: 'enum', notes: 'Draft · Issued · Paid · Partially paid · Overdue' },
              { name: 'dueDate', type: 'date' },
            ],
          },
        ],
        behaviors: ['Issue → collect payments → auto-flip to Paid / Partially paid; past due date → Overdue.'],
        rules: ['Status is derived from payments applied + due date.', 'VN VAT e-invoice issued on payment (mandatory).'],
        states: ['Draft', 'Issued', 'Partially paid', 'Paid', 'Overdue'],
        backend: {
          endpoints: ['GET /admin/crm/invoices', 'POST /admin/crm/invoices (from PO)', 'POST /admin/crm/invoices/:id/issue'],
          integrations: ['Purchase orders / Orders', 'Payments', 'VN e-invoice provider (licensed)'],
        },
        acceptance: ['Invoice status reflects payments applied and due date; e-invoice issues on payment.'],
        openQuestions: ['Which licensed VN e-invoice provider do we integrate?'],
      },
    },
    // 5 · Payments ────────────────────────────────────────────────────────────
    {
      name: 'Payments',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'A payment applies an amount (by method) to an invoice; the invoice’s collected total and status update accordingly. Reconciles against the payment gateway once wired.',
        userStory: 'As finance, I want to record payments against invoices so that balances and revenue stay accurate.',
        uiFields: [
          {
            group: 'Payment list',
            items: [
              { name: 'reference', type: 'string', required: true, notes: 'e.g. PAY-1039' },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'amount', type: 'money (₫)' },
              { name: 'method', type: 'enum', notes: 'Cash · Bank transfer · Credit card' },
              { name: 'date', type: 'date' },
              { name: 'invoice', type: 'ref → Invoice' },
            ],
          },
        ],
        behaviors: ['Recording a payment updates the linked invoice’s collected amount + status.'],
        rules: ['A payment applies to exactly one invoice.', 'Total collected cannot silently exceed the invoice total without a flag.'],
        states: ['Recorded', 'Reconciled (gateway)', 'Unmatched'],
        backend: {
          endpoints: ['GET /admin/crm/payments', 'POST /admin/crm/payments { invoiceId, amount, method }'],
          integrations: ['Invoices', 'Payment gateway (VNPay / MoMo / bank) — reconciliation'],
          notes: 'Gateway not wired anywhere yet — signed-webhook reconciliation is the missing piece.',
        },
        acceptance: ['Recording a payment updates the linked invoice status correctly.'],
        openQuestions: ['Which VN gateway do we integrate first?', 'Manual entry only at launch, or gateway-reconciled?'],
      },
    },
    // 6 · Contracts ───────────────────────────────────────────────────────────
    {
      name: 'Contracts',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'The signed agreement tied to a customer, with a value and a start/end validity window; possibly e-signature + document storage.',
        userStory: 'As sales ops, I want to record contracts and their validity so that we know which customers are under active agreement.',
        uiFields: [
          {
            group: 'Contract list',
            items: [
              { name: 'contractCode', type: 'string', required: true },
              { name: 'customer', type: 'ref → Customer', required: true },
              { name: 'value', type: 'money (₫)' },
              { name: 'status', type: 'enum', notes: 'Draft · Active · Expired' },
              { name: 'start / end', type: 'date range' },
            ],
          },
        ],
        behaviors: ['Draft → Active on signing; auto-flips to Expired past the end date.'],
        rules: ['A contract belongs to one customer.', 'Active contracts drive renewal reminders.'],
        states: ['Draft', 'Active', 'Expired', 'Up for renewal'],
        backend: {
          endpoints: ['GET /admin/crm/contracts', 'POST /admin/crm/contracts', 'GET /admin/crm/contracts/:id'],
          integrations: ['E-signature provider (optional)', 'Document storage (optional)'],
        },
        acceptance: ['Contracts track validity and flip to Expired past the end date.'],
        openQuestions: ['Do contracts need e-signature and document storage, or just record-keeping?'],
      },
    },
  ],
}
