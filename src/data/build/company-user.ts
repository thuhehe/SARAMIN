import type { BuildModule } from './types'

/*
 * Account management (formerly "Company user management").
 *
 * IMPORTANT: companies are NOT created here. A company is born as a lead in the
 * CRM and appears automatically once it is activated. This module manages the
 * ACCOUNT — login + access + products — for activated customers, their users
 * and roles, and the public company detail page (Job Posting customers only).
 */

export const companyUser: BuildModule = {
  id: 'account-management',
  title: 'Account management',
  owner: 'Luong',
  requirements: [
    {
      label: 'NOT a second company list',
      text: 'There is ONE company list — the CRM Companies list. This module adds the account-side sections that hang off a company record once it becomes a customer.',
      table: {
        cols: ['Section', 'Lives on', 'Exists when'],
        rows: [
          ['Account (products + billing)', 'Company record', 'From activation'],
          ['Users & roles', 'Company record', 'From activation (first user created with it)'],
          ['Products / quota', 'Company record', 'Provisioned from the paid order'],
          ['Public company page', 'Company record → Jobseeker site', 'Only for Job Posting customers'],
        ],
      },
      warn: 'Companies are NEVER created here. A company is born as a lead in the CRM; activation only adds the account to that existing record.',
    },
    {
      label: 'Activation — what it creates',
      text: 'On PO/won → convert, the ACCOUNT is created at company level (products + billing) together with its FIRST USER — the login, which is the HR Manager.',
    },
    {
      label: 'Company user model — 4 seats',
      table: {
        cols: ['Role', 'Seats', 'Can do'],
        rows: [
          ['HR Manager', 'Exactly 1', 'Admin: invite / remove users, transfer the manager role'],
          ['HR Specialist', 'Up to 3', 'Post jobs, search resumes — no user administration'],
        ],
      },
      items: [
        'Users self-register on the Company site or are added on Admin; the HR Manager manages them.',
        'Making someone HR Manager is a TRANSFER — the chosen Specialist is promoted and the current Manager becomes a Specialist, in one atomic swap. No email or login ever changes.',
        'Break-glass: if the sole HR Manager is unavailable (left / lost access), HQ can reassign the role. This is what makes single-owner safe.',
        'All users share the account’s POOLED products/quota (posting slots, CV unlocks) — quota is account-level, never per user.',
      ],
    },
    {
      label: 'HQ sees what the employer sees',
      text: 'On the company record HQ can review the account’s activity exactly as the employer sees it on the Company site.',
      table: {
        cols: ['View', 'Shows', 'Notes'],
        rows: [
          ['Jobs', 'Every job this account posted', 'Read-only oversight'],
          ['Applications', 'Candidate · applied-to job · stage · applied date', 'Read-only; opening a CV is audited'],
          ['Resume activity', 'CVs unlocked from Resume Search — who unlocked, when', 'Each unlock spends 1 pooled unlock and is audited'],
        ],
      },
    },
    {
      label: 'Company user account status',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Invited', 'Invite sent, awaiting activation', 'Person sets their own password via the invite link — no one types it for them.'],
          ['Active', 'Link clicked / password set — full use', 'Shares the account’s pooled products/quota; role is just a flag on the user.'],
          ['Disabled', 'Access removed', 'Remove = deactivate, never hard-delete (keep the audit trail); the sole HR Manager can’t be disabled directly — transfer the manager role first.'],
        ],
      },
    },
    {
      label: 'Public company page status',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Draft', 'Created, not public — the URL 404s', 'Created as Draft when a Job Posting customer is activated, so it is never public by accident; the slug can still change while Draft.'],
          ['Published', 'Publicly visible & indexable — requires logo + display name + industry + ≥1 location + a VI introduction', 'The company can publish and edit its own page; a Job Posting customer must have a Published page before any job can go live.'],
          ['Unpublished', 'Deliberately taken down — the URL stops resolving', 'HQ can unpublish for moderation with a required, audited reason; HQ cannot delete a page a customer still owns.'],
        ],
      },
    },
    {
      label: 'Full name — one field, no first/last split',
      text: 'A company (employer) user’s name is stored and captured in a SINGLE "Full name" field — same platform-wide standard as jobseekers and HQ staff.',
      warn: 'Do NOT split any person’s name into first name / last name anywhere. One field: Full name.',
    },
  ],
  features: [
    {
      name: 'Create account (from CRM activation)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'Not a "create company" step — the company already exists as the CRM lead. Activating a Won customer creates its account (login + products) and links it back to the CRM record.',
      mockup: 'crm-activate',
      detail: {
        description:
          'The account is created only when a Won customer is activated in CRM. It sets up the company-level account (products + billing) and its first user (the login — usually the HR Manager) for the company that already exists as the lead. It does not create a company — activation makes the existing company appear in the account/company list automatically. Further users are added under the account afterwards.',
        userStory:
          'As a sales/ops user, when I activate a won customer I want its account created and linked to the existing company, so that there is never a duplicate company record.',
        uiFields: [
          {
            group: 'Account',
            items: [
              { name: 'company', type: 'ref → Customer/Company', required: true, notes: 'locked; linked 🔗 from the CRM record — not entered here' },
              { name: 'accountOwnerEmail', type: 'email', required: true, notes: 'login for the company’s first user' },
              { name: 'products', type: 'enum[]', notes: 'Job Posting / Resume Search — Job Posting requires the company detail page' },
            ],
          },
        ],
        behaviors: [
          'Enabled only for customers whose deal is Won (initiated from CRM activation).',
          'Creates the account, sets customer.accountId (1:1), and the company auto-appears in the account/company list.',
          'Idempotent — re-activating never creates a second account or a duplicate company.',
        ],
        rules: [
          'No manual company creation; the company is the CRM lead record.',
          'One account per company (1:1), created only at/after Won.',
        ],
        states: ['Won (ready to activate)', 'Account created', 'Already active (no-op)'],
        backend: {
          endpoints: ['POST /admin/crm/customers/:id/activate → creates + links Account'],
          integrations: ['CRM (source lead/customer)', 'Products & packages (entitlements)', 'Notifications (welcome / set-password)'],
          notes: 'Account entity is created here but the company entity is the same record as the CRM customer.',
        },
        acceptance: [
          'Activating a Won customer creates exactly one linked account.',
          'The company appears in the list without any manual create-company action.',
          'Re-activation does not duplicate the account or company.',
        ],
        openQuestions: [
          'Does account creation fire automatically on Won, or is it a manual activation click?',
          'If a company arrives outside sales (self-signup), what auto-creates its CRM lead so "always via CRM" holds?',
        ],
      },
    },
    {
      name: 'Products & quota (entitlements)',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
      notes: 'What the account bought, as live quota. Auto-provisioned from the paid order — never picked by hand.',
      mockup: 'crm-products',
      detail: {
        description:
          'The account’s entitlements: which products it holds (Job Posting / Resume Search) and how much quota is left. These are provisioned automatically when the order is paid (see CRM → Payments) — an admin does not manually select products. Downstream screens (post a job, resume search) read and decrement this quota; they never re-pick a product. Job Posting is also the flag that requires a public company page.',
        userStory:
          'As sales/ops, I want the account’s products to appear automatically after payment so that the company can immediately use exactly what they paid for.',
        uiFields: [
          {
            group: 'Entitlements',
            items: [
              { name: 'jobPosting', type: 'quota', notes: 'e.g. 10 posting slots / 3 months — decrements when a job is published; requires a company page' },
              { name: 'resumeSearch', type: 'subscription + quota', notes: 'active until DD/MM + N CV unlocks — unlocks the search screen; each CV unlock spends 1' },
              { name: 'sourceOrder', type: 'ref → Invoice/Order', notes: 'the paid order the entitlements came from' },
            ],
          },
        ],
        behaviors: [
          'Provisioned automatically on payment — no manual product selection.',
          'Job Posting on → the account requires a public company page before it can post.',
          'Resume Search on → unlocks the talent-search screen; CV unlocks draw from the quota.',
          'When a quota hits zero, the related action is blocked with a "buy more" path.',
        ],
        rules: [
          'Entitlements come only from a paid order (or a manual grant with an audit entry).',
          'Public company profile exists only while Job Posting is entitled.',
        ],
        states: ['No products yet (before payment)', 'Provisioned', 'Quota low', 'Quota exhausted (blocked)', 'Expired'],
        backend: {
          endpoints: ['GET /admin/accounts/:id/entitlements', 'POST /admin/accounts/:id/entitlements (from paid order)'],
          integrations: ['CRM Payments (trigger)', 'Products & packages (definitions)', 'Job posting + Resume search (consume)'],
          notes: 'Entitlement = product + remaining quota + validity. The single source downstream screens read.',
        },
        acceptance: [
          'Paying an order provisions the exact products bought, with correct quota.',
          'Posting a job and unlocking a CV both decrement the right quota.',
          'A zero quota blocks the action and offers a buy-more path.',
        ],
        openQuestions: [
          'Self-serve purchases (Store checkout) vs sales-assisted (CRM) — both provision here?',
          'Do unused Job Posting slots expire with the package, or roll over?',
        ],
      },
    },
    {
      name: 'Company users & roles (on CO)',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      notes: 'The HR Manager invites and manages the company’s users, self-serve on the Company site.',
      detail: {
        description:
          'Self-serve team management for the company. All users (HR Manager AND HR Specialist) are rows in one users table, each with their own email/login; role is just a flag on the user — not a special field on the account. This is what makes role changes clean (no email is ever created, moved, or replaced).',
        userStory:
          'As the HR Manager, I want to invite my team and set each person’s role so that the right people can post jobs / search CVs without sharing one login.',
        uiFields: [
          {
            group: 'User',
            items: [
              { name: 'email', type: 'string', required: true, notes: 'their own login; they set their own password via the invite link' },
              { name: 'fullName', type: 'string', notes: 'ONE field — no first/last split' },
              { name: 'role', type: "enum('HR Manager'|'HR Specialist')", required: true, notes: 'a flag on the user — HR Manager = admin, HR Specialist = post jobs / search resumes only' },
              { name: 'status', type: 'enum', notes: 'Invited → Active → Disabled' },
            ],
          },
        ],
        behaviors: [
          'Invite by email + role → the person receives a link and sets their own password (no one types it for them). New invites are always HR Specialists.',
          'Making someone HR Manager is a TRANSFER: the chosen HR Specialist becomes Manager AND the current Manager becomes an HR Specialist — one atomic swap. No email/login changes for either person.',
          'The role change is reachable from two entry points (the current Manager’s “Transfer role”, or a Specialist’s “Make manager”) but is the same single transfer action.',
          'Remove = deactivate (Disabled), never hard-delete — keep the audit trail. The HR Manager can’t be disabled directly; transfer the role first.',
          'A self-signup requesting to join an existing company appears here for the HR Manager to approve.',
        ],
        rules: [
          'Policy: EXACTLY 1 HR Manager + up to 3 HR Specialists per account (4 seats max).',
          'You cannot demote or disable the sole HR Manager on its own — the only way to change the Manager is to Transfer the role to a Specialist (which needs at least one Specialist to exist).',
          'All users share the account’s pooled products/quota (posting slots, CV unlocks) — quota is account-level, not per user.',
          'Only the HR Manager (admin) can invite / remove / transfer roles.',
          'Break-glass: if the sole HR Manager is ever gone (left / lost access / dead email), HQ (Admin side) can reassign the HR Manager. This is what makes single-owner safe.',
        ],
        states: ['Invited (pending)', 'Active', 'Disabled', 'Join request pending approval', 'Seat limit reached (4)', 'No specialist to transfer to'],
        backend: {
          dataModel: [
            { name: 'userId', type: 'uuid' },
            { name: 'accountId', type: 'ref(account)', required: true },
            { name: 'email', type: 'string', required: true, notes: 'unique per user' },
            { name: 'role', type: 'enum', required: true, notes: 'hr_manager | hr_specialist' },
            { name: 'status', type: 'enum', notes: 'invited | active | disabled' },
          ],
          endpoints: [
            'POST /company/users/invite { email } — always a specialist',
            'POST /company/manager/transfer { toUserId } — atomically demotes current manager, promotes target',
            'PATCH /company/users/:id/disable — blocked for the sole manager',
            'POST /company/join-requests/:id/approve',
          ],
          integrations: ['Notifications (invite / set-password link)', 'Products & quota (shared at account level)'],
          notes: 'Role is a column on the user row — no separate "owner email" on the account. The single-manager rule is enforced by making the manager change a transfer, not a free field edit.',
        },
        acceptance: [
          'Inviting a user emails a set-password link; the account never stores their password.',
          'Transferring the manager role atomically swaps the two users’ roles; neither email/login changes.',
          'Disabling or standalone-demoting the sole HR Manager is blocked; transfer is offered instead.',
          'Adding a 5th user (beyond 1 + 3) is blocked.',
          'HQ can reassign the HR Manager when the company’s manager is unavailable.',
        ],
        openQuestions: [
          'Confirm seats: 1 HR Manager + 3 HR Specialists (4 total)?',
          'Auto-approve join requests whose email domain matches the company’s verified domain?',
          'Which HQ roles may use the break-glass reassign, and is it always audited?',
        ],
      },
    },
    {
      name: 'Company users & roles (on Admin)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'HQ concierge — same users/roles model as the CO side, gated + audited. The global list is oversight/search.',
      detail: {
        description:
          'HQ can add/manage a company’s users on their behalf (support / concierge) — the same users-table + role-flag model as the Company site. The global "Company users" list is primarily an oversight/search view; role edits are best done on the company record (Company detail → Users), scoped to one company.',
        behaviors: [
          'Same invite / transfer-manager / disable actions as the CO side, but performed by HQ.',
          'Break-glass: HQ can reassign the HR Manager for a company when the sole manager is unavailable (left / lost access) — the one recovery path single-owner needs.',
        ],
        rules: [
          'HQ role/user edits should be permission-gated (specific HQ roles) and written to the audit log.',
          'Prefer the company-scoped Users section for edits; keep the global list read-oriented (find a user, see which company).',
        ],
        acceptance: ['HQ can resolve support cases (invite, transfer manager, disable) with every action audited.', 'HQ can reassign a stranded company’s HR Manager.'],
        openQuestions: ['Which HQ roles may edit company users / use break-glass, and should the global list be read-only?'],
      },
    },
    {
      name: 'Company detail',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      notes: 'Public jobseeker-facing profile — required only for Job Posting customers.',
      mockup: 'crm-company-page',
      detail: {
        description:
          'The public company page on the jobseeker site: who the employer is, what it is like to work there, and every job it currently has open. It is the only place in this module where a company becomes visible to the outside world, which makes publishing it a deliberate, gated step rather than a side effect of activation. It is required for Job Posting customers (a job posting links to it) and unnecessary for a customer who only buys Resume Search.',
        userStory:
          'As a jobseeker, I want to see who an employer is and what else they are hiring for, so that I can decide whether to apply.',
        uiFields: [
          {
            group: 'Header',
            items: [
              { name: 'logo', type: 'file (image)', required: true, notes: 'the recognition anchor — it also appears on every job card and search result' },
              { name: 'coverImage', type: 'file (image)', notes: 'optional banner' },
              { name: 'displayName', type: 'string', required: true, notes: 'the trading name jobseekers know — often not the legal name on the invoice (see rules)' },
              { name: 'industry', type: 'enum', required: true, notes: 'from shared master data, so it matches the search facets' },
              { name: 'companySize', type: 'enum', notes: 'headcount band' },
              { name: 'website', type: 'url' },
              { name: 'locations', type: 'Location[]', required: true, notes: 'office locations; the primary one shows in the header' },
              { name: 'openJobsCount', type: 'derived', notes: 'live count of Open + Exposure On jobs — never a typed number' },
            ],
          },
          {
            group: 'About',
            items: [
              { name: 'introduction (vi / en)', type: 'i18n rich text', required: true, notes: 'VI required, EN optional — the same i18n convention as job content' },
              { name: 'benefits (vi / en)', type: 'i18n rich text', notes: 'what the company offers; this is the section jobseekers actually read' },
              { name: 'workingTime / dressCode', type: 'i18n string', notes: 'optional practical details' },
              { name: 'gallery', type: 'file[]', notes: 'workplace photos, capped in count' },
              { name: 'video', type: 'url', notes: 'optional embed — allow-listed hosts only' },
            ],
          },
          {
            group: 'Open jobs',
            items: [
              { name: 'job list', type: 'derived', required: true, notes: 'only Open + Exposure On jobs, ordered by posting tier then recency (see Job management)' },
              { name: 'filters', type: 'enum', notes: 'location / category, shown only when there are enough jobs to warrant them' },
              { name: 'empty state', type: 'static copy', notes: '"No open positions right now" — the page must stand on its own with zero jobs' },
            ],
          },
          {
            group: 'Page status (Admin / Company side)',
            items: [
              { name: 'status', type: 'enum', required: true, notes: 'Draft · Published · Unpublished — the gate on public visibility' },
              { name: 'completeness', type: 'derived', notes: 'which required fields are still missing; publishing is blocked until they are filled' },
              { name: 'slug', type: 'string', required: true, notes: 'the public URL — stable once published, because it gets linked and indexed' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — publishing is a deliberate act',
            items: [
              'Draft — created (usually at activation for a Job Posting customer) and not yet public. A jobseeker visiting the URL gets a 404, not an empty shell.',
              'Published — publicly visible and indexable. Requires logo, display name, industry, at least one location and a VI introduction; publishing is refused while any of those are missing.',
              'Unpublished — deliberately taken down (a customer request, a dispute, or a moderation decision). The URL stops resolving publicly and any linked jobs lose their company page link.',
              'Status is owned jointly: the company can publish and edit its own page, and HQ can unpublish for moderation. HQ unpublishing requires a reason and is audited.',
              'The page is REQUIRED for a Job Posting customer — a job cannot be published while its company page is not Published, because the job links to it. A Resume-Search-only customer never needs one.',
            ],
          },
          {
            heading: 'Public vs. internal identity — the distinction to get right',
            items: [
              'The public page shows the TRADING name, logo and story. It is marketing.',
              'The CRM/company record holds the LEGAL name, tax code (MST) and billing address. That is what appears on a quotation and a VAT e-invoice.',
              'They are frequently different, and conflating them puts a legal entity name on a job ad or a trading name on an invoice. Both are wrong.',
              'One company record still holds both (see the CRM Companies list) — this page renders only the public subset, and nothing on it is derived from the billing fields.',
            ],
          },
        ],
        behaviors: [
          'The page is created as a Draft when a Job Posting customer is activated, so it is never forgotten and never public by accident.',
          'The company edits it on the Company site; HQ can edit it on Admin for concierge onboarding, with edits audited.',
          'Publishing validates the required fields and names exactly what is missing.',
          'The open-jobs list is always derived from live job status — an expired job disappears from the page with no action.',
          'Publishing a job is blocked while the company page is not Published, with a direct link to finish the page.',
          'The slug is generated from the display name and can be changed while Draft; after publishing it is fixed, and a change would need a redirect.',
          'Unpublishing removes the page from public access and from search-engine indexing, and takes effect immediately.',
          'The page renders and reads correctly with zero open jobs — companies between campaigns are the normal case, not an edge case.',
        ],
        rules: [
          'One public page per company, and only for activated customers — a company that has not been activated is never publicly visible.',
          'A Job Posting customer must have a Published page before any of its jobs can go live.',
          'Publishing requires logo, display name, industry, at least one location and a VI introduction.',
          'Only Open + Exposure On jobs appear; Draft, Scheduled, Closed and hidden jobs never do.',
          'The public page never exposes internal data: no tax code, no billing address, no CRM stage, no customer status, no account or contact details.',
          'The public URL slug is immutable once published; a rename needs an explicit redirect decision.',
          'Company-supplied content is treated as untrusted input: rich text is sanitised and embeds are restricted to allow-listed hosts.',
          'HQ can unpublish for moderation with a reason; HQ cannot delete a page a customer still owns.',
        ],
        states: [
          'Draft (not public — URL 404s)',
          'Publish blocked (missing required fields)',
          'Published',
          'Published with zero open jobs',
          'Unpublished (by company)',
          'Unpublished (by HQ moderation, reason logged)',
          'Editing (unsaved changes)',
          'Image upload error',
          'Not applicable (Resume-Search-only customer)',
        ],
        backend: {
          dataModel: [
            { name: 'companyPageId', type: 'uuid', required: true },
            { name: 'companyId', type: 'uuid', required: true, notes: 'the same company record as the CRM customer — not a second entity' },
            { name: 'slug', type: 'string', required: true, notes: 'UNIQUE; immutable after publish' },
            { name: 'status', type: 'enum', required: true, notes: 'draft|published|unpublished' },
            { name: 'displayName / industry / companySize / website', type: 'string / enum / enum? / string?' },
            { name: 'logoUrl / coverImageUrl / galleryUrls', type: 'string / string? / text[]' },
            { name: 'introduction / benefits / workingTime', type: 'i18n jsonb', notes: '{ vi, en } per field; VI required' },
            { name: 'locations', type: 'jsonb', required: true },
            { name: 'publishedAt / unpublishedAt / unpublishedReason', type: 'timestamp? / timestamp? / text?' },
            { name: 'updatedBy / updatedAt', type: 'uuid / timestamp', notes: 'HQ edits are audited' },
            { name: 'openJobsCount', type: 'derived', notes: 'never stored — computed from live job status' },
          ],
          endpoints: [
            'GET /companies/:slug — public; returns 404 unless Published',
            'GET /companies/:slug/jobs — Open + Exposure On only',
            'GET /company/page — the owning company’s own editable view',
            'PUT /company/page',
            'POST /company/page/publish · /unpublish',
            'PUT /admin/companies/:id/page — HQ concierge edit (audited)',
            'POST /admin/companies/:id/page/unpublish { reason } — moderation',
          ],
          integrations: ['Object storage / CDN (logo, cover, gallery)', 'Job management (live job list, publish gate)', 'Master data (industry, locations)', 'Audit log (HQ edits / unpublish)'],
          notes:
            'The public endpoint must select only public fields explicitly rather than serialising the company record and removing the private ones — an allow-list is the difference between never leaking a tax code and leaking it the first time a field is added. Serve Published pages from cache and invalidate on publish, edit and unpublish.',
        },
        acceptance: [
          'A Draft page is not publicly reachable — the URL 404s rather than rendering an empty page.',
          'Publishing is refused while any required field is missing, and the response names them.',
          'A Job Posting customer cannot publish a job until its company page is Published.',
          'Only Open + Exposure On jobs appear in the page’s job list, and an expired job disappears with no action.',
          'The public API response contains no tax code, billing address, CRM stage or customer status.',
          'HQ unpublishing takes effect immediately, requires a reason and is audited.',
          'The page renders correctly with zero open jobs.',
        ],
        openQuestions: [
          'Does HQ or the company own the page content at onboarding — is the first version written by HQ as concierge, or by the customer?',
          'Should an unpublished page 404 or show "this employer is no longer listed"? The second is friendlier but confirms the company existed.',
          'Do we need company follows / job alerts per company in Phase-1?',
          'Are company reviews or ratings in scope at any point? They change the moderation burden entirely.',
          'What is the URL pattern — /companies/:slug or /cong-ty/:slug — and does it need a VI/EN split for SEO?',
        ],
      },
    },
  ],
}
