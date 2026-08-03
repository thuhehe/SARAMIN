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
      text: 'On PO/won → convert, the ACCOUNT is created at company level (products + billing) together with its FIRST USER — the login, which is the Admin (the account owner).',
    },
    {
      label: 'Company user model — Super admin + custom roles',
      text: 'The account has one fixed Admin (the "Super admin") plus other users, and each user is ASSIGNED a role. Admin is the ONLY built-in role; EVERY other role is a custom role the Admin composes from a short permission set (see the next block). The flow is: Admin builds a role, then assigns it to a user.',
      table: {
        cols: ['Role', 'How it is set', 'Can do'],
        rows: [
          ['Admin (Super admin)', 'The one fixed, highest role — the account owner (created at activation). Cannot be edited or renamed.', 'Everything across the 3 modules PLUS manage users & roles: invite, create/edit roles, assign roles, disable users'],
          ['Custom role (e.g. Recruiter, Viewer)', 'Admin builds it from the permission set, then assigns it to the user', 'Only the permissions ticked on that role — never user/role administration'],
        ],
      },
      items: [
        'Admin is the single highest role and is locked — you never edit its permissions; it always has full access. Everything below it is a custom role.',
        'Every account keeps AT LEAST ONE Admin — the last Admin cannot be disabled or downgraded. To hand over ownership, grant Admin to another user first.',
        'Break-glass: if the sole Admin is unavailable (left / lost access), HQ can reassign Admin. This is what makes the single-owner floor safe.',
        'Seats are capped per account (up to 4); users self-register or are invited, and the Admin assigns each one a role.',
        'All users share the account’s POOLED products/quota (posting slots, CV unlocks) — quota is account-level, never per user.',
      ],
    },
    {
      label: 'Roles — composed from a short permission set (not a 30-checkbox tree)',
      text: 'A custom role is a named set of permissions across the 3 modules. Admin builds/edits a role by ticking permissions on a Roles screen, then assigns it to users — the VietnamWorks "build a role, then set users" flow, deliberately trimmed to 7 permissions so a role fits on one screen and cannot be built broken.',
      table: {
        cols: ['Module', 'Permission', 'Notes'],
        rows: [
          ['Job posts', 'View jobs', 'the base of the group'],
          ['', 'Post jobs', 'auto-includes View jobs'],
          ['', 'Edit jobs', 'edit & close a posting — auto-includes View jobs'],
          ['Applications', 'View applications & CVs', 'see who applied + open their CV'],
          ['', 'Manage applications', 'move through the pipeline / shortlist / reject — auto-includes View applications'],
          ['Resume search', 'Search resumes', 'browse masked results'],
          ['', 'View / unlock resume detail', 'spends 1 CV unlock, reveals contact — audited; auto-includes Search resumes'],
        ],
      },
      items: [
        'Prerequisites are auto-included, so a role can never be invalid (no "edit but cannot view"). Ticking a higher action silently checks its base.',
        '"Manage users & roles" is NOT in this list — it belongs to the Admin (Super admin) role only, so a custom role can never grant account administration.',
        'Resume permissions are ENTITLEMENT-gated: they do nothing unless the account actually bought Resume Search.',
        'Starter custom roles ship so no one begins from a blank checklist — Recruiter (all 7 permissions) and Viewer (View jobs + View applications). They are ordinary editable custom roles; Admin can edit them or add new ones.',
      ],
      warn: 'Keep the permission list to these 7 (3 modules only). Do NOT reintroduce a per-page capability tree (~30 checkboxes, VietnamWorks-style) — the short list + auto-prerequisites is exactly what keeps roles simple and always valid.',
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
          ['Active', 'Link clicked / password set — full use', 'Shares the account’s pooled products/quota; can act within their assigned role’s permissions.'],
          ['Disabled', 'Access removed', 'Remove = deactivate, never hard-delete (keep the audit trail); the last Admin can’t be disabled — grant Admin to another user first.'],
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
          'The account is created only when a Won customer is activated in CRM. It sets up the company-level account (products + billing) and its first user (the login — the Admin / account owner) for the company that already exists as the lead. It does not create a company — activation makes the existing company appear in the account/company list automatically. Further users are added under the account afterwards.',
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
      name: 'Roles (permission builder, on CO)',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      notes: 'Admin builds/edits the account’s roles by ticking a short permission set; users are then assigned a role.',
      detail: {
        description:
          'The Roles screen where the Admin composes a custom role from the 7-permission catalog (3 modules) and names it. Roles are then picked when inviting or editing a user. The account ships with starter custom roles (Recruiter, Viewer) so no one starts from a blank checklist; they are ordinary editable roles — Admin can edit them or add new ones. Admin itself (the Super admin) is the one fixed role and is not editable here. "Manage users & roles" is never a tickable permission — it stays on the Admin role only.',
        userStory:
          'As the Admin, I want to build a role from a short list of permissions and reuse it, so that I assign access consistently instead of configuring each person from scratch.',
        uiFields: [
          {
            group: 'Role',
            items: [
              { name: 'roleName', type: 'string', required: true, notes: 'e.g. "Recruiter", "Sourcer", "Viewer"' },
              { name: 'permissions', type: 'permission[]', required: true, notes: 'the 7-permission catalog, grouped by module; prerequisites auto-included' },
              { name: 'isStarter', type: 'bool', notes: 'true for the pre-seeded starter roles (Recruiter / Viewer) — still fully editable. Admin is the one fixed, non-editable role.' },
            ],
          },
        ],
        sections: [
          {
            heading: 'The permission catalog — 7 permissions, 3 modules',
            items: [
              'Job posts: View jobs · Post jobs · Edit jobs (Post/Edit auto-include View).',
              'Applications: View applications & CVs · Manage applications (Manage auto-includes View).',
              'Resume search: Search resumes · View / unlock resume detail (Unlock auto-includes Search, spends 1 unlock, audited).',
              'Not in the list: "Manage users & roles" — Admin only.',
            ],
          },
        ],
        behaviors: [
          'Admin ticks permissions grouped by module; ticking a higher action auto-checks (and locks) its prerequisite so a role can never be invalid.',
          'Resume permissions render but do nothing unless the account owns Resume Search (entitlement gate).',
          'Starter roles (Recruiter = all 7, Viewer = View jobs + View applications) are pre-seeded and are fully editable; Admin can edit them or create new roles.',
          'Editing a role re-scopes every user already assigned to it (roles are shared, not per-user copies).',
        ],
        rules: [
          'Only the Admin can create, edit, or delete roles.',
          'A role composed here can never include user/role administration — that capability lives only on the fixed Admin role.',
          'Prerequisites are enforced server-side too, not just in the UI — an API call that sets "Edit jobs" without "View jobs" is normalised, never stored broken.',
          'A role that is assigned to users cannot be deleted until those users are reassigned.',
        ],
        states: ['Starter roles only (fresh account)', 'Custom role being built', 'Prerequisite auto-checked', 'Resume perms disabled (no Resume Search)', 'Role in use (delete blocked)'],
        backend: {
          dataModel: [
            { name: 'roleId', type: 'uuid' },
            { name: 'accountId', type: 'ref(account)', required: true },
            { name: 'name', type: 'string', required: true },
            { name: 'permissions', type: 'text[]', required: true, notes: 'e.g. jobs.view, jobs.post, jobs.edit, apps.view, apps.move, resume.search, resume.unlock' },
            { name: 'isStarter', type: 'bool', notes: 'pre-seeded starter roles (still editable); Admin is the one fixed role and not an editable row' },
          ],
          endpoints: [
            'GET /company/roles',
            'POST /company/roles { name, permissions } — permissions normalised for prerequisites',
            'PUT /company/roles/:id',
            'DELETE /company/roles/:id — blocked while assigned',
          ],
          integrations: ['Products & quota (Resume entitlement gate)', 'Audit log (role create/edit/delete)'],
          notes: 'Permissions are a flat allow-list of ~7 keys. Prerequisite closure is applied on write so the stored set is always valid.',
        },
        acceptance: [
          'Ticking "Post jobs" auto-selects and locks "View jobs".',
          'A saved role never contains an action without its prerequisite, even via direct API.',
          'Resume permissions are unavailable when the account has no Resume Search.',
          'Deleting an in-use role is blocked with a reassign path.',
        ],
        openQuestions: [
          'Can Admin rename/delete the pre-seeded starter roles, or only edit their permissions?',
          'Is there a hard cap on how many custom roles an account can create?',
        ],
      },
    },
    {
      name: 'Company users (invite & assign role, on CO)',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      notes: 'The Admin invites the company’s users and assigns each one a role, self-serve on the Company site.',
      detail: {
        description:
          'Self-serve team management. Every user is a row with their own email/login and an ASSIGNED role (Admin, or a role built on the Roles screen). Role is a reference to a role, not a bag of per-user permissions — so editing a role re-scopes everyone on it, and changing a person’s access is just picking a different role.',
        userStory:
          'As the Admin, I want to invite my team and assign each person a role so that the right people can post jobs / search CVs without sharing one login.',
        uiFields: [
          {
            group: 'User',
            items: [
              { name: 'email', type: 'string', required: true, notes: 'their own login; they set their own password via the invite link' },
              { name: 'fullName', type: 'string', notes: 'ONE field — no first/last split' },
              { name: 'role', type: 'ref(role)', required: true, notes: 'pick one of the account’s roles (Admin / Recruiter / Viewer / custom); "View role’s permissions" shows exactly what it grants' },
              { name: 'status', type: 'enum', notes: 'Invited → Active → Disabled' },
            ],
          },
        ],
        behaviors: [
          'Invite by email + role → the person receives a link and sets their own password (no one types it for them).',
          'Changing a user’s access = assign a different role. Granting Admin is just assigning the Admin role; there is no separate "transfer" dance.',
          'Remove = deactivate (Disabled), never hard-delete — keep the audit trail.',
          'A self-signup requesting to join an existing company appears here for the Admin to approve and assign a role.',
        ],
        rules: [
          'Only the Admin can invite / remove users and assign roles.',
          'Every account must keep at least one active Admin — the last Admin cannot be disabled or downgraded (assign Admin to someone else first).',
          'Seats are capped per account (up to 4); a beyond-cap invite is blocked.',
          'All users share the account’s pooled products/quota (posting slots, CV unlocks) — quota is account-level, not per user.',
          'Break-glass: if the sole Admin is gone (left / lost access / dead email), HQ can reassign Admin.',
        ],
        states: ['Invited (pending)', 'Active', 'Disabled', 'Join request pending approval', 'Seat limit reached (4)', 'Last Admin (downgrade/disable blocked)'],
        backend: {
          dataModel: [
            { name: 'userId', type: 'uuid' },
            { name: 'accountId', type: 'ref(account)', required: true },
            { name: 'email', type: 'string', required: true, notes: 'unique per user' },
            { name: 'roleId', type: 'ref(role)', required: true, notes: 'Admin is a reserved role id' },
            { name: 'status', type: 'enum', notes: 'invited | active | disabled' },
          ],
          endpoints: [
            'POST /company/users/invite { email, roleId }',
            'PATCH /company/users/:id/role { roleId } — blocked if it would leave zero Admins',
            'PATCH /company/users/:id/disable — blocked for the last Admin',
            'POST /company/join-requests/:id/approve { roleId }',
          ],
          integrations: ['Notifications (invite / set-password link)', 'Roles (permission builder)', 'Products & quota (shared at account level)'],
          notes: 'A user points at a role id. The "at least one Admin" floor is enforced on role-change and disable, replacing the old single-manager transfer swap.',
        },
        acceptance: [
          'Inviting a user emails a set-password link; the account never stores their password.',
          'Assigning a different role changes the user’s access immediately; no email/login changes.',
          'Disabling or downgrading the last Admin is blocked with a clear reason.',
          'Adding a 5th user (beyond the seat cap) is blocked.',
          'HQ can reassign Admin when the company’s Admin is unavailable.',
        ],
        openQuestions: [
          'Confirm seat cap — still 4 total?',
          'Auto-approve join requests whose email domain matches the company’s verified domain?',
          'Which HQ roles may use the break-glass reassign, and is it always audited?',
        ],
      },
    },
    {
      name: 'Company users & roles (on Admin)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'HQ concierge — same roles-and-users model as the CO side, gated + audited. The global list is oversight/search.',
      detail: {
        description:
          'HQ can build a company’s roles and manage its users on their behalf (support / concierge) — the same Roles builder + assigned-role model as the Company site. The global "Company users" list is primarily an oversight/search view; role edits are best done on the company record (Company detail → Users / Roles), scoped to one company.',
        behaviors: [
          'Same build-role / invite / assign-role / disable actions as the CO side, but performed by HQ.',
          'Break-glass: HQ can reassign Admin for a company when the sole Admin is unavailable (left / lost access) — the one recovery path the single-Admin floor needs.',
        ],
        rules: [
          'HQ role/user edits should be permission-gated (specific HQ roles) and written to the audit log.',
          'Prefer the company-scoped Users / Roles sections for edits; keep the global list read-oriented (find a user, see which company).',
        ],
        acceptance: ['HQ can resolve support cases (build a role, invite, assign role, disable) with every action audited.', 'HQ can reassign a stranded company’s Admin.'],
        openQuestions: ['Which HQ roles may edit company users / roles and use break-glass, and should the global list be read-only?'],
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
              { name: 'foundedYear', type: 'int', notes: 'drives the "Năm thành lập" tile and the years-in-business figure — a single number, never a free-text "since 1993"' },
              { name: 'website', type: 'url' },
              { name: 'locations', type: 'Location[]', required: true, notes: 'office locations; the primary one shows in the header' },
              { name: 'openJobsCount', type: 'derived', notes: 'live count of Open + Exposure On jobs — never a typed number' },
            ],
          },
          {
            group: 'About',
            items: [
              { name: 'introduction (vi / en)', type: 'i18n rich text', required: true, notes: 'VI required, EN optional — the same i18n convention as job content' },
              { name: 'workingTime / dressCode', type: 'i18n string', notes: 'optional practical details' },
            ],
          },
          {
            group: 'Story — optional, every block independent',
            items: [
              { name: 'storyBlocks', type: 'StoryBlock[]', notes: 'repeatable { title, body, image?, imageSide } — the alternating text/image blocks. Capped at 4; a company with zero still renders a complete page' },
              { name: 'vision / mission', type: 'i18n rich text', notes: 'shown as one card; both optional, the card is hidden when both are empty' },
              { name: 'coreValues', type: 'i18n text[]', notes: 'a list, not a rich-text blob — so it renders as bullets consistently across companies' },
              { name: 'programmes', type: 'i18n rich text', notes: 'graduate / trainee schemes — the block most likely to be left empty by SMEs' },
            ],
          },
          {
            group: 'Media',
            items: [
              { name: 'photos', type: 'file[]', notes: 'replaces the old single "gallery"; capped at 18, min 3 before the section renders — two photos look worse than none' },
              { name: 'videos', type: 'Video[]', notes: 'max 3 × { url, title, duration }; allow-listed hosts only (YouTube / Vimeo)' },
            ],
          },
          {
            group: 'Benefits & growth',
            items: [
              { name: 'benefitCategories', type: 'BenefitCategory[]', notes: 'the 8 fixed categories (insurance · salary · gifts · training · workplace · culture · commute · time off), each with free-text items. Fixed categories are what make companies comparable — free rich text does not' },
              { name: 'headcountHistory', type: '{ year, count }[]', notes: 'powers the growth chart; needs ≥3 years or the chart is hidden. Company-declared, so label it as such' },
            ],
          },
          {
            group: 'People & public facts',
            items: [
              { name: 'leaders', type: 'Leader[]', notes: '{ name, title, photo? } — max 6; optional and frequently skipped' },
              { name: 'ceoName', type: 'string', notes: 'the public representative — NOT the CRM legal signatory field' },
              { name: 'businessLines', type: 'i18n string', notes: 'what the company actually does, distinct from the industry enum' },
              { name: 'brandNames', type: 'string[]', notes: 'trading brands the company operates — helps jobseekers recognise a holding company' },
              { name: 'socialLinks', type: '{ platform, url }[]', notes: 'allow-listed platforms only; rendered as icons' },
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
          'Publishing requires logo, display name, industry, at least one location and a VI introduction. Every field added for the richer page — story, photos, videos, benefit categories, headcount history, leaders — is OPTIONAL and never blocks publishing.',
          'Every optional section hides itself when empty rather than rendering a heading over nothing. A page with only the required fields must still look finished, because that is what most SMEs will publish.',
          'Sections with a minimum bar do not render below it: photos need ≥3, the growth chart needs ≥3 years. Two photos and a two-point chart look worse than no section at all.',
          'Benefit categories are a fixed set of 8 — companies fill them, they do not invent them. That is what makes two company pages comparable to a jobseeker.',
          'headcountHistory is company-declared and must be labelled as such; the platform does not verify it and must not present it as audited data.',
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
            { name: 'foundedYear / ceoName / brandNames', type: 'int? / string? / text[]' },
            { name: 'logoUrl / coverImageUrl / photoUrls', type: 'string / string? / text[]', notes: 'photoUrls replaces the old galleryUrls' },
            { name: 'introduction / workingTime / businessLines', type: 'i18n jsonb', notes: '{ vi, en } per field; VI required on introduction' },
            { name: 'storyBlocks / visionMission / coreValues / programmes', type: 'jsonb', notes: 'all optional; each renders only when non-empty' },
            { name: 'videos / socialLinks / leaders', type: 'jsonb', notes: 'videos capped at 3 and host-allow-listed; leaders capped at 6' },
            { name: 'benefitCategories', type: 'jsonb', notes: 'keyed by the 8 fixed category slugs so the set stays comparable across companies' },
            { name: 'headcountHistory', type: 'jsonb', notes: '[{ year, count }] — company-declared, not verified' },
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
