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
    'This is NOT a second company list. There is ONE company list (the CRM Companies list); this module adds the account-side sections that hang off a company record once it is a customer: account, users, products/quota, and the public page.',
    'Companies are not created here — a company is born as a lead in CRM. On activation (deal Won → convert) the ACCOUNT is created (company level: products + billing) together with its FIRST USER (the login — the HR Manager).',
    'Company user model: exactly 1 HR Manager + up to 3 HR Specialists (4 seats). Users self-register on the Company site or are added on Admin; the HR Manager manages them. Making someone HR Manager is a transfer (swaps the current one). HQ break-glass can reassign the manager.',
    'Public company detail page on the Jobseeker site (profile, benefits, open jobs) — a section on the record, required only for Job Posting customers.',
    'All users share the account’s pooled products/quota (posting slots, CV unlocks).',
    'HQ can view the account’s activity the same way the employer sees it on the Company site: the list of posted Jobs and the Applications received per job (candidate, stage, applied date — read-only, CV opens audited), and the Resume activity (CVs unlocked from Resume Search — who unlocked, when — each spends 1 pooled unlock and is audited).',
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
              { name: 'name', type: 'string' },
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
    { name: 'Company detail', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], notes: 'Public jobseeker-facing profile — required only for Job Posting customers.', mockup: 'crm-company-page' },
  ],
}
