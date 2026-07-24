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
    'Companies are NOT created here — a company is born as a lead in CRM and appears automatically in the account/company list once activated. There is no manual "create company" step.',
    'On activation (from CRM, when a deal is Won) the ACCOUNT is created (company level: products + billing) together with its FIRST USER (the login — usually the HR Manager). The company record already exists from the lead; more users are added under the account afterwards.',
    'Company user model: create users on Admin and self-register on the Company site; roles + permissions — HR Manager (super admin) vs HR Specialist (job posting / resume search only).',
    'Decide member limit per company.',
    'Public company detail page on the Jobseeker site (profile, benefits, open jobs) — required only for Job Posting customers.',
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
    { name: 'Create company user (on Admin)', site: 'Admin', scope: ['BE', 'FE'], notes: 'Add users to an activated company’s account + assign roles.' },
    { name: 'Create company user (on CO)', site: 'Companies', scope: ['BE', 'FE', 'UI'], notes: 'Member count per company, limits, and roles (HR manager = super admin; HR specialist = job posting / resume search only) — TBD.' },
    { name: 'Company detail', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], notes: 'Public jobseeker-facing profile — required only for Job Posting customers.', mockup: 'crm-company-page' },
  ],
}
