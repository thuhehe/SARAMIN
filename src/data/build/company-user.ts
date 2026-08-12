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
      label: 'Self-serve signup — see CRM → Sign-ups',
      text: 'Company-user sign-up is specified on the CRM → Sign-ups page. In short: a self-serve sign-up (email + company name) creates a LOGIN + a new Unverified company with that person as Admin; they can browse the whole site but every data page is empty until the company buys and is verified. One email = one employer login = at most one company at a time, separate from the jobseeker site.',
      items: [
        'Signup with an already-registered employer email is blocked ("sign in instead") — never a duplicate login.',
        'Duplicate / junk companies are cleaned up by HQ on the Sign-ups page: move the user into the real company and archive the empty shell (see CRM → Sign-ups and the Move-user behavior below).',
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
    {
      label: 'THE LOGO — one file, two fixed frames, and a size tuned against other logos',
      text: 'A logo is never stored "at a size". It is uploaded once at high resolution and CONTAIN-FITTED into whichever frame is rendering. The two frames come straight from the designs: 210 × 86 in the company-detail sidebar (Figma “Company detail”, 228:271) and 96 × 96 on the job card (Figma “New Saramin VN”, 143:463, artwork inset 10px a side). One asset has to survive both, so cropping and stretching are both off the table.',
      table: {
        cols: ['Where', 'Frame', 'Safe area', 'Source'],
        rows: [
          ['Company detail — sidebar', '210 × 86', '186 × 62 (lề 12px)', 'Figma 228:271'],
          ['Job card · company list', '96 × 96', '76 × 76 (lề 10px)', 'Figma 143:463'],
          ['Upload requirement', `PNG nền trong suốt hoặc SVG`, 'cạnh dài ≥ 400px, nên ≥ 800px, ≤ 2MB', '186px × 2 (màn 2×) = 372px là sàn'],
        ],
      },
      items: [
        'CONTAIN-FIT, NEVER CROP AND NEVER STRETCH. The frame is fixed, the artwork is fitted inside it, and whichever axis runs out first sets the scale. A 210×86 landscape frame and a 96×96 square frame cannot both be satisfied by a stored bitmap of one shape.',
        'FIT ALONE IS NOT ENOUGH — this is why the size control exists. Fitted to the same box, a wide wordmark (SAMSUNG is roughly 5:1) is limited by WIDTH and ends up a fifth as tall as a square badge, which fills the frame and reads as shouting. Two logos, same rule, wildly different visual weight. Every logo needs a nudge.',
        'THE SIZE CONTROL IS A SLIDER, 60–130%, where 100% = fitted to the safe area. Above 100% the artwork eats into the padding, which is legitimate — padding is a cushion, not a boundary.',
        'IT HARD-STOPS AT THE FRAME EDGE. Zoom is clamped so the artwork can never exceed the frame itself, and the preview labels the moment it hits the stop (“chạm mép khung”). A logo that crops is always wrong, so the control must refuse rather than clip silently. In the 210×86 frame the effective ceiling is ~113%, in the 96×96 frame ~126%.',
        'THE DECISION IS MADE IN A ROW, NOT IN ISOLATION — the editor renders the logo inside a strip of other companies at the same frame size, with this company ringed. Nobody can judge “is this too big” looking at one logo on a white card; the jobseeker always sees it next to five others, so that is the view the operator sets it in.',
        'THE ZOOM IS STORED PER COMPANY (`logoScale`), not per surface. It is a property of that artwork — a wordmark that needs 115% needs it in both frames.',
        'ONE MASTER FILE, derived renditions. Do not ask for a separate square upload and a separate landscape upload: two files means one of them goes stale, and the stale one is usually the small one nobody looks at while editing.',
      ],
      warn: 'A transparent background is not optional. Both frames render on white, and a logo saved with a white box baked in shows a visible rectangle the moment the surrounding card is tinted or the page goes dark — which is exactly the case the operator cannot see while editing.',
    },
    {
      label: 'HQ AUTHORS the company page — the editor is the page, section by section',
      text: 'Most customers will not fill their own page, at least at the start, so HQ has to be able to author every part of it from the company record (Company page tab). The editor is therefore laid out exactly as the live page is laid out — same eleven sections, same order, same Vietnamese headings as the Figma "Company detail" — so the mapping between what an operator types and what a jobseeker sees needs no explanation.',
      table: {
        cols: ['#', 'Section (as it appears live)', 'Required?'],
        rows: [
          ['1', 'Nhận diện — logo, tên hiển thị, dòng mô tả, ảnh bìa (the sticky sidebar)', 'Logo + tên + ngành gate publishing'],
          ['2', 'Thông tin doanh nghiệp — MST, tên pháp lý, loại hình, người đại diện, địa chỉ ĐK', 'READ-ONLY — comes from the company record'],
          ['3', 'Đặc điểm nổi bật — trait chips, max 6, fixed list', 'No — hidden when empty'],
          ['4', 'Về công ty — introduction, VI / EN / KO tabs', 'VI required'],
          ['5', 'Video giới thiệu — max 3, YouTube / Vimeo links only', 'No'],
          ['6', 'Hình ảnh công ty — 1 hero + 4 tiles, needs ≥3 photos', 'No'],
          ['7', 'Câu chuyện — max 4 blocks + Tầm nhìn / Giá trị / Chương trình', 'No'],
          ['8', 'Phúc lợi & Chế độ — the shared 12 types, general company welfare', 'No'],
          ['9', 'Đội ngũ lãnh đạo — max 6 people, portrait required per person', 'No'],
          ['10', 'Văn phòng — office list + map, THE SAME office book the job form picks from', '≥1 office gates publishing'],
          ['11', 'Thông tin thêm — lĩnh vực, thương hiệu, website, mạng xã hội, lịch sử nhân sự', 'No'],
        ],
      },
      items: [
        'FIVE THINGS GATE PUBLISHING and no more: logo, display name, industry, at least one office, and the Vietnamese introduction. They are listed as pass/fail chips above the form, so "why can I not publish" is answered before it is asked. Every other section is optional BY DESIGN.',
        'AN EMPTY OPTIONAL SECTION HIDES ITS CARD on the live page — it never renders as a blank panel. Each section in the editor says so on its own status pill ("Trống — ẩn"), because an operator who does not know this fills sections defensively with filler.',
        'THE REGISTRY FACTS ARE NOT RE-TYPED HERE. Mã số thuế, tên pháp lý, loại hình, người đại diện and địa chỉ đăng ký are shown read-only with a pointer to the Overview tab. Typing them twice gives one company two tax codes that drift apart, and the public one is the one a candidate would quote back.',
        'THE OFFICE LIST IS THE OFFICE BOOK — the same CompanyLocation rows the job form picks from, not a second address list. Editing an address here updates every live job of that company. See Job management → “A working location is a named office”.',
        'COMPLETENESS IS SHOWN AS A PERCENTAGE, and it counts optional sections that would actually RENDER — not just the publish gate. A page that merely clears the gate must not read 100%: that number is what an account manager quotes to a customer.',
        'READ-ONLY ON A COLLEAGUE’S COMPANY withdraws every action on this tab too — no Save, no Publish, no Unpublish, and every picker disabled. Same rule as the rest of the record.',
        'PUBLISH IS DISABLED, NOT HIDDEN, while a gate is unmet — with the missing items named. A hidden button reads as a broken screen.',
      ],
      warn: 'Trait chips and benefit types are FIXED LISTS, never free text. The entire value of both is that they read identically across 500 companies and can therefore be filtered and compared; one free-text field destroys that on the first company that uses it.',
    },
    {
      label: 'BENEFITS — the company page is the source of truth, a job INHERITS',
      text: 'General welfare is declared ONCE on the company page and inherited read-only by every job of that company. A job writes only what is specific to the position. The two never contradict because they no longer describe the same thing — and one edit on the company page updates every open posting.',
      table: {
        cols: ['', 'Company page', 'Job posting'],
        rows: [
          ['Declares', 'The company’s GENERAL welfare — insurance, leave, shuttle bus, canteen, training…', 'Only what is DIFFERENT for this position — project bonus, night-shift allowance, dedicated laptop…'],
          ['Taxonomy', 'The shared 12 benefit types (Master data → Benefits)', 'The same 12 types — one list, so the two can be merged and de-duplicated'],
          ['On the job page', 'Rendered as “Phúc lợi chung của công ty”, read-only, with a link to the company page', 'Rendered above it as “Phúc lợi riêng của vị trí này”'],
          ['Who edits', 'The company page editor (HQ or the employer)', 'The job form'],
        ],
      },
      items: [
        'The job form SHOWS what it is about to inherit, read-only, next to the picker. An employer who cannot see the company benefits simply retypes them — which is precisely how the two surfaces drift apart.',
        'Descriptions are i18n { vi, en } on BOTH surfaces. VI required, EN optional and falling back to VI — otherwise a foreign candidate reads the company page in Vietnamese and the job in English.',
      ],
      warn: 'A job may NOT override a company benefit. Overriding re-opens exactly the contradiction this closes — “15 ngày phép” on the company page and “12 ngày phép” on the job, with no rule saying which is right. Anything genuinely different for the position is written in the position block, which a reader understands as an addition.',
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
      notes: 'HQ concierge — same roles-and-users model as the CO side, gated + audited. Adds the cross-company power: move a user between companies.',
      detail: {
        description:
          'HQ can build a company’s roles and manage its users on their behalf (support / concierge) — the same Roles builder + assigned-role model as the Company site. Because HQ is the only actor with a cross-company view, it also owns the one action a company can never do itself: MOVE a user from one company to another. The global "Company users" list is primarily an oversight/search view; role edits are best done on the company record (Company detail → Users / Roles), scoped to one company.',
        behaviors: [
          'Same build-role / invite / assign-role / disable actions as the CO side, but performed by HQ.',
          'Move user between companies: HQ picks a user, a target company, and the role they will have there (Admin or any lower role). The login and password never change — only which company the user is in, and their role there. This is how a curious self-signup, or a person invited to the wrong place, is put where they belong.',
          'Break-glass: HQ can reassign Admin for a company when the sole Admin is unavailable (left / lost access) — the one recovery path the single-Admin floor needs.',
        ],
        rules: [
          'A move cannot strand a company: if the user is the SOLE Admin of their current company, the move is blocked until another Admin is assigned there first (the ≥1-Admin floor).',
          'The destination role is chosen at move time; moving in as Admin is allowed (adds/replaces an Admin), subject to the destination’s seat cap.',
          'Only HQ can move users across companies — a company Admin can only invite within its own account, never pull a user from another company.',
          'HQ role/user edits, and every move, are permission-gated (specific HQ roles) and written to the audit log (who moved whom, from → to, role, when).',
          'Prefer the company-scoped Users / Roles sections for edits; keep the global list read-oriented (find a user, see which company).',
        ],
        states: ['User with no company (self-signup)', 'Move blocked (sole Admin of source)', 'Moved (source membership ended, target membership created)', 'Move to Admin', 'Destination seat cap reached'],
        backend: {
          endpoints: [
            'POST /admin/company-users/:userId/move { toCompanyId, role } — ends the source membership, creates the target membership; blocked if it would leave the source with zero Admins or exceed the target’s seat cap',
          ],
          integrations: ['Audit log (move recorded)', 'Notifications (optional: tell the user they were moved)'],
          notes: 'One email = one employer login = one company at a time, so a move is detach-then-attach — not a second membership. Enforce the sole-Admin and seat-cap checks server-side.',
        },
        acceptance: [
          'HQ can resolve support cases (build a role, invite, assign role, disable) with every action audited.',
          'HQ can move a user into another company as Admin or a lower role; the login/password is unchanged.',
          'Moving the sole Admin out of a company is blocked with a clear reason.',
          'A move that would exceed the destination seat cap is blocked.',
          'HQ can reassign a stranded company’s Admin.',
        ],
        openQuestions: [
          'Which HQ roles may edit company users / roles, move users, and use break-glass, and should the global list be read-only?',
          'When a user is moved, is the user notified, and what happens to any work (jobs/notes) they created in the source company?',
        ],
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
              { name: 'logo', type: 'file (image)', required: true, notes: 'ONE master file, contain-fitted into 210×86 (sidebar) and 96×96 (job card). PNG transparent or SVG, long edge ≥400px (≥800 recommended), ≤2MB. The recognition anchor — it also appears on every job card and search result.' },
              { name: 'logoScale', type: 'int (60–130, default 100)', notes: 'per-company display zoom inside the frame. 100 = fitted to the safe area; above 100 eats the padding; clamped so the artwork never passes the frame edge. Exists because a wide wordmark fitted to the same box reads far smaller than a square badge — see the LOGO requirement.' },
              { name: 'coverImage', type: 'file (image)', notes: 'optional banner' },
              { name: 'displayName', type: 'string', required: true, notes: 'the trading name jobseekers know — often not the legal name on the invoice (see rules)' },
              { name: 'industry', type: 'enum', required: true, notes: 'from shared master data, so it matches the search facets' },
              { name: 'companySize', type: 'enum', notes: 'headcount band' },
              { name: 'foundedYear', type: 'int', notes: 'drives the "Năm thành lập" tile and the years-in-business figure — a single number, never a free-text "since 1993"' },
              { name: 'website', type: 'url' },
              { name: 'locations', type: 'CompanyLocation[]', required: true, notes: 'THE OFFICE BOOK — each entry is Office name / label (≤50, OPTIONAL, unique per company when present) + City/Province (Master data) + Office address (≤120) + coords { lat, lng } geocoded from the address on save. The primary one shows in the header, and the JOB FORM picks up to 3 from this same list rather than typing an address per posting. Full rules: Job management → “A working location is a named office”.' },
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
              { name: 'benefits', type: 'Benefit[]', notes: 'the company’s GENERAL welfare — the SAME 12 fixed types the job form uses (Master data → Benefits), each with an i18n description { vi, en }. VI required. One shared taxonomy is what lets a job inherit these and lets both surfaces share icons, translations and the search filter. Replaces the old 8-category `benefitCategories`' },
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
          'An office address is GEOCODED on save and the coordinates are stored on the office, so the map is a static image (no map SDK on the public page, no key exposed, no per-view quota) that opens Google Maps when clicked. If geocoding fails the editor asks the company to drop the pin manually; it never blocks saving, and an office with no coordinates renders as an address card at full width with no map.',
        ],
        rules: [
          'One public page per company, and only for activated customers — a company that has not been activated is never publicly visible.',
          'A Job Posting customer must have a Published page before any of its jobs can go live.',
          'Publishing requires logo, display name, industry, at least one location and a VI introduction. Every field added for the richer page — story, photos, videos, benefit categories, headcount history, leaders — is OPTIONAL and never blocks publishing.',
          'Every optional section hides itself when empty rather than rendering a heading over nothing. A page with only the required fields must still look finished, because that is what most SMEs will publish.',
          'Sections with a minimum bar do not render below it: photos need ≥3, the growth chart needs ≥3 years. Two photos and a two-point chart look worse than no section at all.',
          'Benefit TYPES are a fixed set — companies pick from them, they do not invent them; only the description is theirs. That is what makes two company pages comparable to a jobseeker. It is the SAME 12-type list the job form uses, so a job can inherit the company’s welfare and de-duplicate against it. (The Figma company page draws 8 groups; the 12 shared types supersede that — two taxonomies would make “Lương thưởng” and “Lương & thưởng” different rows.)',
          'The Văn phòng section has THREE layouts, chosen by how many offices exist — one office is the common case (at least one is required to publish), not the edge case, so it is designed first: 1 office = a single horizontal card (address + actions left, map right, no list column and no “Trụ sở chính” label, because naming it HQ implies there are others); 2–3 = the office list + map, the whole card selectable and the map following the selection; 4+ = grouped into City/Province tabs, max 3 offices per city and the rest behind “Xem thêm N…”, defaulting to the city with the most open jobs rather than the one holding the head office.',
          'Each office shows its live open-job count (“Đang tuyển 3 vị trí tại đây”), matched from the jobs that picked that office. An office with none simply omits the line — never “0 vị trí”. This is what turns an address block into something a jobseeker uses: they choose employers by whether they can commute there.',
          '“Chỉ đường” appears only on the selected office, not on every card.',
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
            { name: 'logoUrl / coverImageUrl / photoUrls', type: 'string / string? / text[]', notes: 'photoUrls replaces the old galleryUrls. ONE logo file only — no separate square/landscape uploads, because the second one always goes stale.' },
            { name: 'logoScale', type: 'smallint default 100', notes: 'display zoom 60–130; a property of the artwork, so the same value applies in every frame' },
            { name: 'introduction / workingTime / businessLines', type: 'i18n jsonb', notes: '{ vi, en } per field; VI required on introduction' },
            { name: 'storyBlocks / visionMission / coreValues / programmes', type: 'jsonb', notes: 'all optional; each renders only when non-empty' },
            { name: 'videos / socialLinks / leaders', type: 'jsonb', notes: 'videos capped at 3 and host-allow-listed; leaders capped at 6' },
            { name: 'benefits', type: 'jsonb', notes: '[{ typeKey, description: { vi, en } }] keyed by the shared 12 benefit-type keys (Master data → Benefits) — the same taxonomy the Job entity uses, so a job can inherit them and the jobseeker search filter reads one list, not two. VI description required; EN optional and falls back to VI' },
            { name: 'headcountHistory', type: 'jsonb', notes: '[{ year, count }] — company-declared, not verified' },
            { name: 'CompanyLocation', type: 'entity', required: true, notes: 'companyId · officeName (label) · cityId · officeAddress · lat · lng · geocodedAt · isPrimary · isActive. A TABLE, not jsonb — jobs hold a foreign key to it (JobLocation), so an office that moves is corrected once and every live job follows. Deleting one that is still used by a live job is blocked / soft-deleted.' },
            { name: 'lat / lng / geocodedAt', type: 'numeric? / numeric? / timestamp?', notes: 'set by geocoding the address on save; re-run when the address changes. Nullable so a failed geocode never blocks saving — the section then renders the address without a map. A manual pin overwrite is stored the same way.' },
            { name: 'isPrimary', type: 'bool', notes: 'exactly one per company — the office shown in the page header and the one the map opens on. NOT rendered as a “Trụ sở chính” label when the company has only this one office.' },
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
          integrations: ['Object storage / CDN (logo, cover, gallery)', 'Job management (live job list, publish gate)', 'Master data (industry, locations)', 'Geocoding provider — address → { lat, lng } on save, plus the static-map image for the public page (usage is per SAVE, not per page view)', 'Audit log (HQ edits / unpublish)'],
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
