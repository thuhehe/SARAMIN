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
          ['Public company page', 'Company record → Jobseeker site', 'Editable for EVERY company; a Published page is only REQUIRED for Job Posting customers (their jobs link to it)'],
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
      text: 'Company-user sign-up is specified on the CRM → Sign-ups page. In short: a self-serve sign-up is a PENDING request — it provisions nothing on its own. HQ resolves it with one of three actions (move the user into an existing company · create a new company + move the user in as Admin · archive), and Move/Create email the user an activation link. Access + a company are granted only after HQ places them and they activate.',
      items: [
        'One email = one employer login = at most one company at a time, separate from the jobseeker site (Phase-1). A second sign-up on the same email is blocked ("sign in instead").',
        'No company or products are created at sign-up — the company comes from HQ (existing or newly created). Duplicate/junk requests are simply archived; a duplicate real company is retired by offboarding its users (the surviving company re-invites them), then archiving it.',
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
          ['Pending', 'Self-serve sign-up submitted, not yet placed by HQ', 'A request only — no company, no access. Becomes Invited/Active once HQ moves or creates a company and sends the activation link (see CRM → Sign-ups).'],
          ['Invited', 'Invite/activation sent, awaiting activation', 'Person sets/confirms their own password via the link — no one types it for them. Applies to both an HR-Manager invite and a self-serve sign-up HQ has placed.'],
          ['Active', 'Link clicked / password set — full use', 'Shares the account’s pooled products/quota; can act within their assigned role’s permissions.'],
          ['Disabled', 'Deactivated — offboarded (“nhân viên nghỉ việc”)', 'Login blocked, SEAT FREED, their work stays with the company. Reversible (Reactivate); never hard-delete — keep the audit trail. The last active Admin can’t be disabled: grant Admin to another user first.'],
        ],
      },
    },
    {
      label: 'Deactivate = offboarding (nhân viên nghỉ việc)',
      text: 'When someone leaves the company, they are DEACTIVATED — not deleted. This is the company-user equivalent of the jobseeker’s "withdraw account", with one deliberate difference: a company user cannot deactivate themselves, because the seat belongs to the company (the same rule Google Workspace / Slack / M365 use). The employer offboards them.',
      table: {
        cols: ['Who can deactivate', 'Scope', 'Typical reason'],
        rows: [
          ['Company Admin', 'Only their own company’s users', 'The normal case — an employee left'],
          ['HQ (Saramin)', 'Any company’s user', 'Support / concierge (the Admin is unreachable), or a trust & safety call'],
          ['The user themselves', '— NOT ALLOWED', 'A company login is the employer’s seat; a personal data-deletion request goes through support, not a self-serve button'],
        ],
      },
      items: [
        'What deactivation does: login blocked immediately · the seat is freed so a replacement can be invited · their jobs, applicants and CV unlocks STAY with the company account · row kept for the audit trail.',
        'Reversible — Reactivate restores access, and consumes a seat again (blocked if the account is already at its seat cap).',
        'Who deactivated matters: a user deactivated by HQ can only be reactivated by HQ, so a company Admin cannot quietly undo a Saramin decision. A user the company deactivated can be reactivated by that company’s Admin.',
        'A reason is optional for the company Admin and REQUIRED for HQ; either way it is internal and written to the audit log with the actor and date.',
        'There is deliberately NO separate "suspend/block" status for company users: HQ deactivation covers an individual bad actor, and archiving the company covers a company-level block (see CRM → Sign-ups, Company status).',
      ],
      warn: 'Never hard-delete a company user. Deactivate keeps the person’s history attributable — deleting the row would silently re-attribute their jobs and CV unlocks, which is what makes an audit trail worthless.',
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
          ['1', 'Nhận diện — logo, tên hiển thị, Business detail (the sticky sidebar)', 'Logo + tên hiển thị gate publishing'],
          ['2', 'Company at a glance — ngày thành lập, Business form, số nhân viên, doanh thu, Business detail, địa chỉ + Google Maps link', 'Địa chỉ gates publishing'],
          ['3', 'Đặc điểm nổi bật — trait chips, max 6, fixed list', 'No — hidden when empty'],
          ['4', 'Company vision — introduction / vision, VI / EN tabs only', 'VI required'],
          ['5', 'Video giới thiệu — max 3, YouTube / Vimeo links only', 'No'],
          ['6', 'Hình ảnh công ty — 1 hero left + 4 tiles right, needs ≥3 photos', 'No'],
          ['7', 'Phúc lợi & Chế độ — the shared 11 benefit codes, general company welfare', 'No'],
                  ],
      },
      items: [
        'FIVE THINGS GATE PUBLISHING and no more: logo, display name, industry, at least one office, and the Vietnamese introduction. They are listed as pass/fail chips above the form, so "why can I not publish" is answered before it is asked. Every other section is optional BY DESIGN.',
        'AN EMPTY OPTIONAL SECTION HIDES ITS CARD on the live page — it never renders as a blank panel. Each section in the editor says so on its own status pill ("Trống — ẩn"), because an operator who does not know this fills sections defensively with filler.',
        'EIGHT SECTIONS, NOT ELEVEN. Câu chuyện, Đội ngũ lãnh đạo and Thông tin thêm are dropped — all three are marked hidden in the Figma, so they are not part of the page being built. Anything they carried that is genuinely needed (website, business lines) lives on the company record already.',
        'THE REGISTRY FACTS ARE GONE FROM THIS PAGE. Mã số thuế, tên pháp lý, loại hình (legal form), tình trạng theo MST and người đại diện are REGISTRATION data — they belong to invoicing and compliance, not to a jobseeker deciding whether to apply. They live on the Overview tab only, and the “↔ Overview” cross-reference badge is removed along with them: what is left on this page is owned BY the page, so there is nothing to cross-reference.',
        'WHAT THE PAGE OWNS INSTEAD is one marketing-facing block — “Company at a glance”, matching Saramin KR’s company-info card, which is BOTH a 4-tile strip and a detail grid under it. The strip: NGÀY THÀNH LẬP (rendered as “Năm thứ 42” over the date) · BUSINESS FORM · SỐ NHÂN VIÊN · DOANH THU, founding date first because it is the one tile making a claim about the company rather than classifying it. The detail grid under it: BUSINESS DETAIL (free rich text) and ĐỊA CHỈ with its Google Maps link.'
        ,'ADDRESS IS NOT ITS OWN SECTION. One address plus a map link does not earn a section header, and Saramin puts 주소 + 지도보기 in the same detail grid as 사업내용. Keeping them together is also what makes the block answer “who is this company” in one place instead of two.'
        ,'NGÀNH IS NOT ONE OF THE FOUR. Industry is a classification that lives on the company record and already drives search facets; putting it in the strip spends a tile on something the candidate filtered by to arrive here. Saramin shows 업종 further down its page, in a secondary detail grid — if we want it public, that is where it goes, not in the strip.',
        'TÊN HIỂN THỊ, INDUSTRY AND SCALE ARE ASKED HERE, NOT ON THE CREATE FORM. All three moved off “New company”: the display name sits beside the logo it appears with, and industry/scale sit inside the facts card they render in. Creation needs only the legal name + MST — every list falls back to the legal name until a display name is set, so nothing is blocked, and a shorter create form is one a rep actually finishes.',
        'THE PANEL IS A RIGHT-HAND RAIL, STICKY. It carries the percentage, the five publish gates, a clickable list of all eight sections with filled/empty state, and the publish actions themselves. The actions belong beside the gate that governs them — otherwise the disabled Publish button sits a full page-scroll away from the reason it is disabled.',
        'ONE ADDRESS ON THE PAGE, PLUS A PASTED GOOGLE MAPS LINK — not the multi-office book. A company page shows where the company IS; picking among three sites is a JOB concern, so the office book stays on the job form (see Job management → “A working location is a named office”). Pasting a share link instead of geocoding means no geocoding provider is needed and the person pasting can see for themselves that the link lands in the right place. Empty link = the page renders the address line with no map.',
        'COMPLETENESS IS SHOWN AS A PERCENTAGE, and it counts optional sections that would actually RENDER — not just the publish gate. A page that merely clears the gate must not read 100%: that number is what an account manager quotes to a customer.',
        'READ-ONLY ON A COLLEAGUE’S COMPANY withdraws every action on this tab too — no Save, no Publish, no Unpublish, and every picker disabled. Same rule as the rest of the record.',
        'PUBLISH IS DISABLED, NOT HIDDEN, while a gate is unmet — with the missing items named. A hidden button reads as a broken screen.',
      ],
      warn: 'Trait chips and benefit types are FIXED LISTS, never free text. The entire value of both is that they read identically across 500 companies and can therefore be filtered and compared; one free-text field destroys that on the first company that uses it.',
    },
    {
      label: 'BENEFITS — the company page is the DEFAULT SET a job starts from',
      text: 'General welfare is declared ONCE on the company page. A new job posting starts PREFILLED with that set (a copy, not a live link), and the editor — HQ or the employer — then edits it freely for that job: add, remove, reword, reorder. Two safety valves keep the company set reachable: a RESET action that returns the job’s benefits to the company default, and a read-only PREVIEW of the full company set next to the picker.',
      table: {
        cols: ['', 'Company page', 'Job posting'],
        rows: [
          ['Declares', 'The company’s GENERAL welfare — insurance, leave, shuttle bus, canteen, training… The DEFAULT every job starts from.', 'The benefits shown on THIS posting — starts as a copy of the company set, then edited per job (position extras added, irrelevant entries removed).'],
          ['Taxonomy', 'The shared 11 benefit codes (Master data → Benefits, the client’s `benefit` list)', 'The same 11 codes — one list, one visual language, so a reset is always possible'],
          ['Editable?', 'By the company page editor (HQ or the employer)', 'Freely, by whoever edits the job — plus “↺ Reset to company default” and “View full company benefits” beside the picker'],
          ['When the company set changes', 'Edited in one place', 'Does NOT rewrite existing jobs — they keep the copy they were posted with. New jobs prefill from the new set; an old job takes the new set by pressing Reset.'],
        ],
      },
      items: [
        'A DEFAULT, NOT A WHITELIST. The company set decides what a new job is PREFILLED with — it never narrows the job’s picker. A job can select any of the 11 codes, including ones the company page does not list (a night-shift allowance for one position, say), and there is no maximum on either surface.',
        'COPY, NOT LIVE LINK — deliberately. The job editor may have removed “Đưa đón & chỗ ở” from a remote role on purpose; a company-page edit silently re-adding it would undo per-job curation. The cost is accepted drift between page and posting; the RESET button is the one-click way back.',
        'The job form shows the full company set read-only (preview) next to the picker, so the editor always sees what the default is before and after diverging from it.',
        'Descriptions are i18n { vi, en } on BOTH surfaces. VI required, EN optional and falling back to VI — otherwise a foreign candidate reads the company page in Vietnamese and the job in English.',
      ],
      warn: 'Reset REPLACES the job’s current benefit list with the company set — it does not merge. The form confirms before discarding per-job edits. There is no cap on either surface, so Reset restores the company set whole, in its display order.',
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
    // MOVED from Job management (2026-09-08 page feedback): the employer's landing
    // screen is an account-management surface, not a job surface — it aggregates
    // products, quota and payment alerts, which is why the features below already
    // referenced it. URL is now /m/account-management/home-dashboard-companies.
    {
      name: 'Home dashboard (company site)',
      site: 'Companies',
      slug: 'home-dashboard-companies',
      scope: ['BE', 'FE', 'UI'],
      notes:
        'The landing screen after an employer logs in. A READ-ONLY aggregate — it owns no data of its own and every panel links into the module that does.',
      mockup: 'co-dashboard',
      ready: true,
      detail: {
        description:
          'Where an employer lands after signing in. It answers three questions in one screen, in priority order: what is BLOCKING or expiring, who is WAITING on me, and what did we buy / how much is left. The layout follows Saramin Korea’s employer home (hiring.saramin.co.kr/home) — a wide work column beside a narrow account rail — because that split keeps daily recruiting work from competing for space with billing and settings.\n\nIt is deliberately an aggregate and nothing else. Every number is derived from a record another module owns: job status and deadline, application stage and waiting days, saved searches, pooled quota, company-page completeness, the CRM sales owner. Home has no entity, no status of its own, and no action that cannot also be done on the screen that owns it.',
        userStory:
          'As an HR user, I want to see what is blocking me and who is waiting on me the moment I log in, so that I do not have to open four screens to find out whether anything needs me today.',
        keyPoints: [
          {
            vi: 'Home CHỈ ĐỌC. Mọi con số đều được suy ra từ module khác — không tạo thực thể, không có trạng thái riêng, không có hành động nào mà màn hình gốc không có.',
            en: 'Home is READ-ONLY. Every number is derived from another module — it creates no entity, holds no status of its own, and offers no action the owning screen does not.',
          },
          {
            vi: 'Tab "Chưa xem" dùng STAGE = New của pipeline, KHÔNG thêm cờ đã đọc/chưa đọc. Một cờ riêng cho Home sẽ tạo nguồn sự thật thứ hai cho "đã có ai xem ứng viên này chưa".',
            en: 'The “Not reviewed” tab is pipeline STAGE = New — no read/unread flag is added. A flag owned by Home would be a second source of truth for “has anyone looked at this candidate”.',
          },
          {
            vi: 'Dải cảnh báo chỉ hiện khi CÓ việc cần xử lý. Không có dòng "mọi thứ ổn" — một dải luôn hiện là một dải mắt học cách bỏ qua.',
            en: 'The alert strip renders only when something needs action. There is no “all clear” row — a strip that is always there is one the eye learns to skip.',
          },
          {
            vi: 'Không sao chép cột quảng cáo và 쿠폰/포인트 của Saramin KR: Phase 1 không bán gì ở đó và mô hình sản phẩm VN không có coupon/point.',
            en: 'Saramin KR’s ad rail and coupon/point counters are NOT copied: Phase 1 sells nothing there, and the VN product model has no coupon or point currency.',
          },
        ],
        requirements: [
          {
            label: 'The alert strip — the only part that can cost money or a hire',
            text: 'Pinned above everything. Each row is a condition that is blocking something or running out of time, plus the one action that clears it. Rows are ordered blocking-first, then by deadline. Everything here is owned elsewhere; Home only surfaces it.',
            table: {
              cols: ['Condition', 'Shows when', 'Action → goes to', 'Owned by'],
              rows: [
                ['Company page not Published', 'Account holds Job Posting AND page status ≠ Published', 'Publish page → Company page', 'Account management → Company detail'],
                ['Product paid but not activated', 'An entitlement exists with no activation date and an activationDeadline in the future', 'Activate → Product usage', 'Products & packages · Account management → Product usage (company site)'],
                ['Job closing soon', 'An Open job’s deadline is ≤7 days away AND it has unreviewed candidates', 'Review → Applicants', 'Job management'],
                ['Quota low / exhausted', 'Remaining posting slots or CV unlocks ≤20% of the pack, or 0', 'Buy again → Product usage', 'Account management → Product usage (company site)'],
                ['Order awaiting payment', 'An order is Unpaid or Overdue — no paidAt recorded by Accounting', 'View order → Payment history', 'CRM → Purchase order (payment fact) · Account management → Payment history (company site)'],
              ],
            },
            warn: 'No “all clear” row, and no alert that Home alone can resolve. If a condition cannot be cleared on the screen the action links to, it does not belong in this strip.',
          },
          {
            label: 'The two states Home must be designed for',
            text: 'A first-run account and an account in flight are genuinely different screens, and the first-run one is what most new customers see for their first week. Both are specified; neither is an afterthought empty state.',
            table: {
              cols: ['State', 'When', 'What Home shows'],
              rows: [
                ['First run', 'Activated, nothing posted, no search saved', 'Alerts: publish page + activate package. Both strips show a tinted panel naming the gap and its one CTA. To-do is empty with “Post a job”. Rail shows products held but not started, with no quota bar yet.'],
                ['In flight', 'At least one job Open or Scheduled', 'Strips list jobs and saved searches with their live counts; to-do carries the stage queues; rail shows quota bars.'],
                ['Resume Search not owned', 'Account holds Job Posting only', 'The Saved searches strip is replaced by the product offer — the rail already lists the unowned product with a Buy path; the strip must not show an empty panel for something the account cannot use.'],
              ],
            },
          },
        ],
        uiFields: [
          {
            group: 'Alert strip (conditional — see the rule block)',
            items: [
              { name: 'alerts[]', type: 'derived', notes: 'each = { severity: warn | info, message, actionLabel, target screen }. Empty array → the strip does not render at all' },
            ],
          },
          {
            group: 'Jobs in progress (KR 진행중 공고)',
            items: [
              { name: 'count', type: 'derived', notes: 'Open + Scheduled. Draft and Closed are NOT “in progress” and are not counted' },
              { name: 'card', type: 'composite', notes: 'title · status chip (Open / Scheduled) · deadline or go-live date · candidate count. Click → Applicants for that job' },
              { name: 'empty state', type: 'panel', notes: 'first-run only: “Post a job and start collecting candidates · it goes live immediately” + Post a job' },
            ],
          },
          {
            group: 'Saved searches (KR 진행중 인재풀)',
            items: [
              { name: 'count', type: 'derived', notes: 'saved searches on the account — see Resume management → “Save this search”' },
              { name: 'card', type: 'composite', notes: 'search name · last-run date · NEW CVs matching since that run. Click → Resume search with the search loaded' },
              { name: 'gating', type: 'rule', notes: 'the whole strip is hidden unless the account is entitled to Resume Search' },
            ],
          },
          {
            group: 'My to-do (KR 내 할일)',
            items: [
              { name: 'tabs', type: 'stage counts', required: true, notes: 'Not reviewed (stage = New) · Screening · Interview · Offer. The counts ARE the pipeline stage counts — no separate computation' },
              { name: 'row', type: 'composite', notes: 'photo · name · job applied to · match % (with its two contributing signals on hover — never a bare number) · days waiting' },
              { name: 'sort', type: 'rule', required: true, notes: 'longest waiting first — the queue exists to surface who has been ignored, so recency sorting would defeat it' },
              { name: 'scope', type: 'rule', notes: 'across ALL of the account’s jobs, not one posting; recalled and withdrawn applications never appear' },
            ],
          },
          {
            group: 'Account rail — company card',
            items: [
              { name: 'identity', type: 'composite', notes: 'logo · company display name · signed-in user with their role badge' },
              { name: 'company page status', type: 'enum', notes: 'Draft · Published · Unpublished — the same status the Company page screen owns' },
              { name: 'completeness', type: 'derived %', notes: 'the same figure the Company page screen shows; the CTA names the highest-value missing block rather than saying “edit”' },
            ],
          },
          {
            group: 'Account rail — products in use (KR 이용중인 상품)',
            items: [
              { name: 'held product', type: 'row', notes: 'name · remaining / total · progress bar · unit + valid-until · “Use →” into the screen that spends it' },
              { name: 'unheld product', type: 'row', notes: 'listed with “—” and a Buy button — KR’s pattern: the rail doubles as the store front' },
              { name: 'low-quota tone', type: 'rule', notes: '≤20% remaining turns the figure and bar amber; this is the same threshold that raises the quota alert' },
            ],
          },
          {
            group: 'Account rail — account manager (KR 고객센터)',
            items: [
              { name: 'salesOwner', type: 'ref → CRM user', notes: 'the company record’s sales owner — a named person, not a generic hotline' },
              { name: 'contact', type: 'composite', notes: 'phone · email · working hours, plus a Help centre link' },
              { name: 'fallback', type: 'rule', notes: 'no sales owner assigned (self-serve signup not yet placed) → the general support block is shown instead' },
            ],
          },
        ],
        behaviors: [
          'Home loads as ONE aggregate request; no panel fetches on its own, so the page never renders half-populated.',
          'Every panel is a link into the owning screen. Nothing on Home mutates a record — the alert actions navigate, they do not resolve the condition in place.',
          'A panel whose product is not entitled is hidden entirely, not shown empty: an employer without Resume Search never sees a Saved searches box.',
          'To-do counts and the Applicants screen read the same stage data, so they cannot disagree.',
          'The alert strip is absent — not empty — when nothing needs action.',
        ],
        rules: [
          'Home owns no entity and no status. Any field a panel needs belongs to the module that owns the record.',
          'The “Not reviewed” queue is stage = New. No read/unread flag is introduced for this screen.',
          'Counts are scoped to the ACCOUNT, not to the signed-in user — quota is pooled and the pipeline is shared, so a personal view would misreport the team’s work.',
          'Role permissions apply: a user without “View applications” sees no to-do queue, and one without Resume Search permissions sees no saved searches — the dashboard never leaks what the role cannot open.',
          'A match % is never shown as a bare number; it carries its contributing signals, the same rule as Applicants and the jobseeker side.',
        ],
        states: [
          'First run — activated, nothing posted, page still Draft, package not activated',
          'In flight — jobs Open, candidates waiting, quota burning down',
          'Job Posting only — Saved searches strip hidden, product offered on the rail',
          'Quota exhausted — alert raised, the related CTA points at Buy rather than at the blocked action',
          'No sales owner assigned — account-manager card falls back to general support',
          'Loading / aggregate request failed — the page shows a single retry, never a grid of empty boxes',
        ],
        backend: {
          endpoints: [
            'GET /company/dashboard → { alerts[], jobsInProgress[], savedSearches[], todo{ byStage }, account{ page, entitlements[], salesOwner } }',
          ],
          integrations: [
            'Job management (status, deadline, applicant counts)',
            'Application management (stage counts, waiting days, match)',
            'Resume management (saved searches + new-match counts)',
            'Products & packages (entitlements, quota, activation deadline)',
            'Account management (company page status + completeness, roles)',
            'CRM (sales owner, pending-payment orders)',
          ],
          notes:
            'One read-only projection assembled server-side. It is a VIEW: no dashboard table, no cached counters that can drift from the records they summarise. Permission filtering happens in this endpoint, so the client never receives a panel the role may not see.',
        },
        acceptance: [
          'A first-run account sees exactly two alerts (publish page, activate package) and both strips render their CTA panel, not an empty table.',
          'Publishing the company page removes its alert on the next load without any other change.',
          'The “Not reviewed” count equals the number of New-stage applications across the account’s jobs, and matches the Applicants screen exactly.',
          'The to-do list is ordered longest-waiting first.',
          'An account without Resume Search sees no Saved searches strip, and sees Resume Search on the rail with a Buy button.',
          'A user whose role lacks “View applications” loads Home without a to-do queue and without an application count anywhere on it.',
          'Quota at or below 20% shows amber on the rail and raises exactly one quota alert.',
          'No action on Home changes a record; each one navigates to the screen that owns it.',
        ],
        openQuestions: [
          'Does “new CVs since last run” on a saved search require storing lastRunAt per search, or is it computed from the search’s created date until the first run? (Recommendation: store lastRunAt — otherwise the count is wrong for every search after the first visit.)',
          'Should the job “closing soon” alert fire on deadline alone, or only when unreviewed candidates exist? Specified as the latter, so a fully-processed job closing quietly raises nothing.',
          'Is the account manager’s direct phone shown to the customer, or only an email + the general hotline? Needs a sales decision before the field is exposed.',
          'Should Home offer a “what changed since your last visit” marker, and if so does that need a per-user lastSeenAt — the one piece of state Home would have to own?',
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
          'The employer reads the SAME rows on Product usage (company site) — one entitlement record, two viewers (see “HQ sees what the employer sees”).',
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
    /* ── The employer's “Products & Payment Management” section ──────────────
       Two Companies-site pages that READ the records the sale created: the
       entitlements (Product usage) and the orders that paid for them (Payment
       history). Neither page owns data — one is the employer's view of the same
       entitlement rows the Admin “Products & quota” screen shows, the other is
       the employer's view of CRM's PO + invoice + payment fact. Written for a
       developer new to the project, so the first block of Product usage is a
       glossary and every rule names the module that owns it. */
    {
      name: 'Product usage (company site)',
      site: 'Companies',
      slug: 'product-usage-companies',
      scope: ['BE', 'FE', 'UI'],
      notes:
        'What the account bought, as live rows the employer can act on — grouped under the order that paid for them. The employer-side view of the SAME entitlement record the Admin “Products & quota” screen shows.',
      ready: true,
      detail: {
        refDocs: [
          {
            label: 'Figma — Product usage',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=3087-11571',
            meta: 'Figma frame · 1440 wide · chosen 13/09/2026',
            note: 'The screen this requirement describes — filters, the grouped list, the row anatomy (type chip · name · usage text + bar · status pill + validity dates · one button) and the footer notes. Includes the two unlimited-quota rows under PO-2026-0909.',
          },
          {
            label: 'Figma — Activate flow (CV Search 30d)',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2249-9438',
            meta: 'Figma frame',
            note: 'What clicking “Activate” does: confirmation modal → toast → the same row in its In use state.',
          },
        ],
        description:
          'The first of the two pages under “Products & Payment Management” on the company site. It lists every product the account holds — posting slots, add-on labels, CV-search windows, the branding page, manual services — as rows the employer can act on, grouped under the order that paid for them. Nothing on it is typed by anyone: every row is an ENTITLEMENT (Products & Packages → “Entitlement is the single downstream record”), created automatically the moment Accounting issues the official VAT invoice for an order, and decremented by the screens that spend it — publishing a job, applying a label, unlocking a CV. This page is where the employer sees the balance, sees the deadline to use it, and — for the one product type that needs it — starts the clock.\n\nIf you are new to the project, read the glossary block first. “Order”, “invoice”, “entitlement”, “activation” and “usage” are five different things here, and the client’s own documents use the words loosely. The page follows the layout of Saramin Korea’s billing.saramin.co.kr/manage (a status-tab list under a left menu) because employers already know that shape; the content model underneath is ours, not KR’s.',
        userStory:
          'As an employer, I want to see what we bought, how much is left and until when we can use it — on one screen, per order — so that I know whether I can post today and what I must start before it lapses.',
        keyPoints: [
          {
            vi: 'Mỗi dòng là một ENTITLEMENT = sản phẩm + hạn mức còn lại + hiệu lực. Không ai nhập tay: hệ thống tạo khi Kế toán xuất hóa đơn GTGT chính thức, và trừ dần khi đăng tin / gắn nhãn / mở CV.',
            en: 'Every row is an ENTITLEMENT = product + remaining quota + validity. Nobody types it: the system creates it when Accounting issues the official VAT invoice, and the screens that publish a job, apply a label or unlock a CV decrement it.',
          },
          {
            vi: 'Chỉ CV search có nút Activate. Tin đăng kích hoạt bằng cách ĐĂNG, nhãn kích hoạt bằng cách GẮN vào tin — nút trên dòng đổi theo loại sản phẩm, còn chip “Not activated” thì giống nhau.',
            en: 'Only CV search has an Activate button. A posting slot activates by PUBLISHING, a label by being APPLIED to a job — the row’s button follows the product type, while the “Not activated” pill is the same for all.',
          },
          {
            vi: 'Ba trạng thái — Not activated · In use · Completed — được SUY RA, không lưu. Lý do (Expired · Not used by … · Withdrawn) là dòng chữ xám dưới trạng thái, không phải trạng thái thứ tư.',
            en: 'Three statuses — Not activated · In use · Completed — are DERIVED, never stored. The reason (Expired · Not used by … · Withdrawn) is a grey line under the status, not a fourth status.',
          },
          {
            vi: 'Gom theo ĐƠN HÀNG (PO) đã thanh toán cho sản phẩm. Ngày trên header là ngày xuất hóa đơn chính thức — vì mọi “Activate by” trong nhóm đều tính từ ngày đó. Không gộp hạn mức giữa hai đơn.',
            en: 'Grouped by the ORDER (PO) that paid for the products. The header date is the official invoice’s issue date, because every “Activate by” in the group counts from it. Quota is never merged across two orders.',
          },
          {
            vi: 'Trang này không có tiền. Số tiền, trạng thái thanh toán và chứng từ nằm ở Payment history; ở đây header chỉ mang chip thanh toán để giải thích vì sao một nhóm có thể chưa trả tiền mà vẫn có sản phẩm.',
            en: 'No money on this page. Amounts, payment status and documents live on Payment history; here the header only carries the payment pill, to explain why a group can be unpaid and still hold products.',
          },
        ],
        requirements: [
          {
            label: 'Words a new developer must know before reading on',
            text: 'Five terms, five different records. The client’s documents — and Saramin Korea’s UI — use “invoice” for several of them; this spec does not.',
            table: {
              cols: ['Term', 'Means here', 'Defined in'],
              rows: [
                ['Order (PO · đơn hàng)', 'The commercial document the customer received and pays against — numbered **PO-…**, one per purchase. Carries the lines (product × qty), the total incl. VAT, the bank details and the 14-day payment terms. It is never edited or cancelled: it expires at the end of its issue month if no official invoice follows.', 'CRM → Purchase order'],
                ['VAT invoice (hóa đơn GTGT)', 'The fiscal document Accounting issues for an order, with a legal number from the e-invoice provider. Issuing the **official** invoice is what provisions the products. A **draft** invoice provisions nothing and is never shown to the customer. At most one invoice per order.', 'CRM → Invoices'],
                ['Entitlement', 'product + remaining quota + validity — one row on this page. Created by provisioning, decremented by use, never typed.', 'Products & Packages → “Entitlement is the single downstream record”'],
                ['Provisioning', 'The system turning the order’s lines into entitlements when the official invoice is issued. Immediate, and idempotent on the invoice id (the provider’s issue event can fire twice).', 'CRM → “Provisioning — what happens when the OFFICIAL invoice is issued”'],
                ['Activation', 'The first USE of a unit: a slot is used when a job is published, a label when it is applied, a CV-search window when the employer clicks Activate. It must happen inside the activation window — 12 months by default, per product — counted from the invoice date, or the unused quota lapses.', 'Products & Packages → activationWindowMonths · client T&C clause 4'],
                ['Usage (validity)', 'How long an activated unit runs: 30 days for a posting, 10 days for a label, 30 / 90 days for a CV-search window, one delivery for a manual service.', 'Product fulfilment · client T&C clause 5'],
              ],
            },
            items: [
              'Provisioning ≠ activation. Buying 5 posts today provisions all 5 at once; each one activates separately when a job is published and burns its own 30 days. The page shows both clocks: “Activate by” for what is still unused, the running window for what is live.',
              'The number on a group header is the ORDER number (PO-…), never the tax invoice’s legal number. The client’s live system labels its payment request “INV-…”; CRM renamed it PO-… precisely so the two documents cannot be confused — see CRM → “PO vs VAT invoice”.',
            ],
          },
          {
            label: 'Which products appear, and what “activate” means for each',
            text: 'Every product type in the catalogue lands here as a row, but the clock starts differently for each — which is why the row’s button is not the same for all of them.',
            table: {
              cols: ['Product type', 'Examples', 'Quota unit', 'The clock starts when…', 'Row button'],
              rows: [
                ['Posting tier (slots)', 'Basic Job · Basic Plus Job · Top Job', 'posts', 'a job is **published** with that tier — that job then runs 30 days', '{{btn:Post a job}} — Create job opens with the tier preselected and “using 1 of N posts”'],
                ['Add-on', 'Hot job label · Popular Jobs premium · Highlight Companies premium', 'labels · slots', 'the add-on is **applied** to one of the account’s Open jobs — it runs 10 days from then', '{{btn:Apply to a job}} — a picker of Open jobs that do not carry it yet'],
                ['CV search', 'CV Search 30d · CV Search 90d', 'CV unlocks + a window', 'the employer clicks **Activate** and confirms — the window runs continuously from that moment', '{{btn:Activate}} → after confirming, {{btn:Search CVs}}'],
                ['Branding', 'Employer Branding Page', '1 page', 'the company page is **published**', '{{btn:Publish page}} — the Company page editor'],
                ['Manual service', 'Facebook fanpage post · Email marketing / Job alert banner', 'deliveries', 'Ops delivers and logs it — the employer cannot start it', '— (row shows “2 of 4 delivered” from the delivery log)'],
                ['Free job (Always-available tier)', 'Free Job', 'posts', 'HQ publishes it for the company — an employer can never post a free job', '{{btn:View job}}'],
              ],
            },
            warn: 'Only CV search has an Activate button. A posting slot has no separate activation step — publishing IS the activation — so an “Activate” button on a posting row would be an extra click that does nothing. The button label follows the product type; the “Not activated” pill is the same for every type.',
          },
          {
            label: 'Row status — three values, derived, never stored',
            text: 'REVISED 2026-09-08 (Thu): the three values are still COMPUTED — they choose the row’s action button and feed the “Expiring” filter — but they are NOT drawn as coloured pills any more, and the status tab bar is gone. A posting pack has no lifecycle of its own (each job does), so a pill on it read as a status the product does not have, while CV search rows did carry one; the page looked half-labelled. Every row now shows the same two-line STATE CELL instead — see “One state cell for every row”. The derivation below is unchanged.',
            table: {
              cols: ['Status', 'Means', 'Derived from', 'Shown with'],
              rows: [
                ['**Not activated**', 'Bought and provisioned; nothing used yet. The activation window is running.', 'quotaUsed = 0 AND no unit live AND today ≤ activateBy', '{{tagmute:Not started · 30 days}} then “Activate by dd/mm/yyyy” · the type’s start button'],
                ['**In use**', 'Something has happened and something can still happen: units remaining, or a unit still running.', '(quotaUsed < quotaTotal AND today ≤ activateBy) OR a unit’s window has not ended', 'units remaining → “Use remaining by dd/mm/yyyy” + “n live” · last unit running → its window + “d days left” · CV search → window + days left'],
                ['**Completed**', 'Nothing more can happen on this row.', 'quota exhausted AND no unit running · OR activateBy passed with quota unused · OR the invoice was cancelled', 'the last end date + the REASON as a grey line: {{tagmute:Expired}} · {{tagmute:Not used by 02/09/2027}} · {{tagmute:Withdrawn — invoice cancelled}} · button {{btn:Buy again}}'],
              ],
            },
            items: [
              'Reasons are not statuses. The tabs count three statuses; the grey line under Completed explains WHICH way the row ended. Adding “Expired” or “Lapsed” as a fourth tab would split one question (“can I still use this?”) across two answers.',
              'Pill colours match the mockup: In use green · Not activated amber · Completed grey.',
              '“Scheduled” is not a status either. A placement booked for a future period is **Not activated** with the reason line “Booked · starts dd/mm/yyyy” and no button.',
              'A free-job row is only ever In use or Completed — HQ publishes it directly, so it is never waiting to be activated.',
              'A group whose invoice Accounting cancelled (CRM → “A PO is never cancelled — the invoice is”) keeps its rows for the 2-year window as Completed · Withdrawn, so the employer can see what disappeared and why.',
            ],
          },
          {
            label: 'One state cell for every row — remaining on line 1, time on line 2, no pills',
            text: 'Column 3 has the same shape on every product type, which is what makes the list read as one list. Line 1 answers “what is left” in the product’s own unit; line 2 answers “until when”. Lifecycle words appear only where a lifecycle exists (CV search: “not activated”, “ended”) and only as words in line 1, coloured amber or grey — never as a badge. Column 4 always holds exactly one button.',
            table: {
              cols: ['Product · state', 'Line 1 (SemiBold 13)', 'Line 2 (Regular 12, grey)', 'Button'],
              rows: [
                ['Posting pack · posts left', '2 posts left', 'Use by 02/09/2027 · 3 jobs live', '{{btn:Post a job}}'],
                ['Posting pack · all posted', 'All posted', 'Last job ends 08/09/2026', '{{btn:View jobs}}'],
                ['Add-on · labels left', '2 labels left', 'Use by 02/09/2027', '{{btn:Apply to a job}}'],
                ['Add-on · all used', 'All used (grey)', 'Label ran 28/08 – 07/09/2026', '{{btn:View job}}'],
                ['CV search · not activated', '50 unlocks · not activated (amber)', 'Activate by 02/09/2027', '{{btn:Activate}}'],
                ['CV search · active', '158 unlocks left', '73 days left · ends 16/11/2026', '{{btn:Search CVs}}'],
                ['CV search · ended', '50 unused · ended (grey) — or “0 unlocks left”', 'Window ended 03/10/2026', '{{btn:Buy again}}'],
                ['Free job', '1 job live', 'Runs until 08/09/2026', '{{btn:View job}}'],
                ['Any product · lapsed', 'Not used by 02/09/2027 (grey)', 'Order PO-…', '{{btn:Buy again}}'],
              ],
            },
            items: [
              'Why remaining, not used: the usage column already says “3 of 5 posts used” with a bar; repeating “used” in column 3 wastes the cell. Remaining is the number a recruiter acts on.',
              'The three computed statuses still exist behind the scenes: they pick the button (Not activated → Activate · In use → the product’s use action · Completed → Buy again) and the “Expiring within 7 days” filter still reads line 2’s date. Only the pill and the tab bar were removed.',
              'Colour is reserved for the two states that need a decision: amber for “not activated” (money not yet working), grey for “ended / all used” (nothing to do here but buy). Everything else is the default dark text, so a healthy list is visually quiet.',
              'Filters that remain: the product-type select · “Expiring within 7 days” · search. If a status filter is wanted later it can return as a select, not as tabs — a select does not imply every row has a lifecycle.',
            ],
          },
          {
            label: 'The date column — one deadline per row, and the filter reads it',
            text: 'Line 1 is a window or a deadline; line 2 is the countdown or the reason. Whatever line 2 counts down to is the row’s DEADLINE, and the “Expiring within 7 days” checkbox keeps exactly the rows whose deadline is ≤ 7 days away — so the filter can never disagree with the row.',
            table: {
              cols: ['Row state', 'Line 1', 'Line 2', 'Tone'],
              rows: [
                ['Not activated', 'Not started · 30 days (the unit’s duration)', 'Activate by 02/09/2027', 'grey'],
                ['In use — units remaining', 'Use remaining by 01/08/2027', '3 jobs live', 'grey'],
                ['In use — last unit running', '28/08/2026 – 07/09/2026', '3 days left', 'amber when ≤ 7 days'],
                ['In use — CV-search window', '18/08/2026 – 16/11/2026', '73 days left', 'amber when ≤ 7 days'],
                ['Completed', '18/08/2026 – 01/09/2026 (the last window)', 'Expired · Not used by … · Withdrawn', 'grey'],
              ],
            },
            items: [
              'The deadline of a pack with units remaining is its ACTIVATE-BY date, not the end of a running job. A pack with 2 posts left is not “expiring” because one of its jobs ends on Friday — that job’s own deadline lives on My jobs.',
              'days left = ceil((deadline − now) / 24 h) in Asia/Ho_Chi_Minh; on the last day the line reads “Ends today”. Never negative — a passed deadline is a Completed reason, not “−3 days”.',
              'Dates are dd/mm/yyyy everywhere on the company site.',
            ],
          },
          {
            label: 'Unlimited quota — the count stays, the bar goes, the clock is the limit',
            text: 'A package can sell a product with NO quantity cap — unlimited Basic Plus posts for 90 days, unlimited CV unlocks for 30 days. The row keeps its four columns; only the quota cell changes. Line 1 still counts what was used, because the employer and Accounting both want that number. Line 2 swaps the bar for a chip: a bar answers “how much is left”, and nothing is left to run out of — the validity dates in column 3 are the real limit.',
            table: {
              cols: ['Quota', 'Line 1 — usage text', 'Line 2', 'The row ends when', 'Data'],
              rows: [
                ['Limited (today)', '3 of 5 posts used · 42 of 200 CVs unlocked', 'bar quotaUsed / quotaTotal — blue, grey at 100 %', 'the quota is exhausted, OR the activate-by / validity date passes', 'quotaTotal = 5'],
                ['**Unlimited**', '12 posts used · 137 CVs unlocked — **no “of N”**', '{{tag:∞ Unlimited}} chip, the same 22 px height as the type chip, in place of the bar', 'ONLY by date — the validity end (CV search) or the activate-by / pack window (posting). Never by count', 'quotaTotal = **null**'],
                ['Free job', '1 free post', 'nothing', 'the job closes', 'quotaTotal = null too, but productType = free-job draws no chip'],
              ],
            },
            items: [
              'quotaTotal is NULLABLE, and null means unlimited. Never a sentinel (0, −1, 999 999): a sentinel leaks into “0 of 0 used” or a 0 % bar on the first bug, null cannot.',
              'Status derivation is unchanged except the count branch: an unlimited row is never Completed by exhaustion — only by its validity end, its activate-by passing unused, or a cancelled invoice. In the status table, “quotaUsed < quotaTotal” reads as TRUE when quotaTotal is null.',
              'The chip is quota information, not a lifecycle. It is drawn on Not activated, In use and Completed rows alike and never changes colour; the status pill in column 3 keeps that job.',
              'Nothing that alerts on remaining quota fires for an unlimited row: the Home dashboard “Quota low / exhausted” alert skips it, and the Create job form shows “Unlimited posts · until dd/mm/yyyy” instead of “using 1 of N posts”.',
              'Chip style: blue-50 background, blue-700 SemiBold 12 text, 4 px radius. Blue because the bar is blue — everything about quota is blue, everything about lifecycle is green / amber / grey — and 4 px (not a pill) because it is an attribute like the type chip, not a status.',
              'Drawn in the Figma frame under PO-2026-0909: “Basic Plus Unlimited 90d” (12 posts used) and “CV Search Unlimited 30d” (137 CVs unlocked).',
            ],
            warn: 'Open — does an unlimited CV-search product carry a DAILY unlock cap (the usual anti-scraping guard on unlimited CV packs)? If yes, line 2 becomes a small daily meter — “17 of 50 today · resets 00:00” — and the chip moves onto line 1 after the count. Decide before the product is sold: it changes the entitlement schema (dailyCap · dailyUsed).',
          },
          {
            label: 'Grouped by order — the header carries the money, the rows carry the product',
            text: 'Rows sit under the order that paid for them, newest invoice date first. One order can carry several products (the demo order PO-2026-0912 has three), and “which order gave me these two Top Job posts?” is the question an employer asks when quota looks wrong — so the order is the group, not a tag on the row.',
            table: {
              cols: ['Header element', 'Shows', 'Source'],
              rows: [
                ['Order number', 'PO-2026-0912', 'order.code — the CRM PO series, never the tax invoice’s legal number'],
                ['Date', '02/09/2026 — the OFFICIAL invoice’s issue date', 'invoice.issuedAt — the date every “Activate by” in the group counts from'],
                ['Payment pill', '{{tagok:Paid 03/09/2026}} · {{tagwarn:Unpaid}} · {{tag:Overdue · 32 days}}', 'the order’s payment status — the same fact Payment history shows'],
                ['Count', '3 products', 'rows in the group'],
              ],
            },
            items: [
              'The same product bought on two orders is two rows in two groups. Quota is NOT merged across orders, because each order has its own activate-by date and its own invoice to reverse.',
              'Within a group, rows sort by type: Job posting → Add-on → CV search → Branding → Manual service. Across groups: invoice date, newest first. The Free group is pinned first.',
              'Groups are never split across pages. Paginate by group, targeting ~20 rows per page; the page count line says “N products”, the tab counts follow the current filters.',
              'The header shows no amount and no document button — money is Payment history’s job. Keeping it off this page is what lets every company user see quota without seeing prices.',
            ],
            warn: 'An UNPAID order can appear here. Provisioning fires when the official invoice is issued, which may be before the money arrives (CRM decision — a deviation from T&C clause 3 still to be confirmed with the client). The header then reads Unpaid or Overdue and the group carries one amber line: “Payment pending — these products are withdrawn if the invoice is cancelled.” If the client insists on activation-after-payment, the only change on this page is the trigger: a group appears at Paid instead of at Invoice issued.',
          },
          {
            label: 'Free job posting — a group with no order',
            text: 'HQ may publish a Free Job (the Always-available tier) for any company. The employer cannot post one, cannot upgrade it and never received an order for it — but it runs under their name, so it belongs on this page.',
            table: {
              cols: ['Element', 'Value'],
              rows: [
                ['Header', '“Free job posting” · {{tagmute:No invoice}} · “n products · posted for you by Saramin”'],
                ['Row usage', '“n free posts” — no “of N”: there is no purchased quota to count against'],
                ['Row dates', 'the job’s 30-day window · days left — the posting rules apply unchanged'],
                ['Status', 'In use while the job is live · Completed once it closes — never Not activated'],
                ['Button', '{{btn:View job}} — never Post a job'],
              ],
            },
            items: [
              'The group is hidden entirely when HQ has posted nothing for the account — not shown empty.',
              'A free job closed early creates nothing to refund, and it never earns premium placement — Products & Packages → “Entitlement source”.',
            ],
          },
          {
            label: 'Clicking Activate — CV search only',
            text: 'The one button on this page that starts a paid clock, so it confirms first and prints the end date before the click. The flow is drawn in the Figma frame “Activate flow — CV Search 30d”.',
            table: {
              cols: ['Step', 'What happens'],
              rows: [
                ['1 · Click {{btn:Activate}}', 'A confirmation modal: title “Activate CV Search 30d?” · body “Your 30-day search window starts the moment you confirm and ends on dd/mm/yyyy. It runs continuously and cannot be paused or moved.” · details box: **Included** 50 CV unlocks · 30 days — **From order** PO-2026-0912 · paid 03/09/2026 — **Activate by** 02/09/2027, after which the product lapses · buttons {{btn:Cancel}} · {{btn:Activate now}}'],
                ['2 · Confirm', 'POST /company/entitlements/:id/activate. The server sets activatedAt = now, validFrom = now, validTo = now + durationDays, and writes an audit entry (who, when, from which IP). Idempotent: a repeated call returns the existing window instead of moving it.'],
                ['3 · Done', 'Toast “✓ CV Search 30d is active until dd/mm/yyyy”. The row re-renders in place as **In use**: “0 of 50 CVs unlocked” · 04/09/2026 – 04/10/2026 · “30 days left” · button {{btn:Search CVs}}.'],
              ],
            },
            items: [
              'The end date is computed and shown BEFORE the click. Because the window cannot be paused, an employer who activates on a Friday evening burns a weekend — the modal is where they find that out.',
              'Activate is offered to the account Admin only; other roles see the row with the pill and no button. Starting a paid clock is an account decision, and the 7-permission role set deliberately has no billing permission.',
              'The server rejects activation after activateBy (the row is already Completed · Not used by …) and while the order’s invoice is cancelled.',
            ],
          },
          {
            label: 'Who can see and do what',
            text: 'Quota is pooled across the account, so everyone with a login can read the page; what each person can click follows their role (Account management → Roles).',
            table: {
              cols: ['Action', 'Who', 'Why'],
              rows: [
                ['See the page — rows, quota, dates', 'Every company user', 'A recruiter needs to know whether they can post today. No prices are shown, so nothing here is confidential.'],
                ['{{btn:Post a job}} · {{btn:Apply to a job}}', 'Roles with “Post jobs”', 'The button is hidden for others; the row still shows.'],
                ['{{btn:Search CVs}}', 'Roles with “Search resumes”', 'Resume permissions are entitlement-gated — the row is what shows the entitlement exists.'],
                ['{{btn:Activate}} (CV search)', 'Account Admin only', 'It starts a paid clock.'],
                ['{{btn:Buy again}}', 'Every company user', 'Opens a short “Request a quotation” form prefilled with the product; the account’s sales owner receives it as a CRM task. Phase 1 has no online checkout.'],
              ],
            },
          },
        ],
        uiFields: [
          {
            group: 'Tabs and filters',
            items: [
              { name: 'tabs', type: 'REMOVED 2026-09-08', notes: 'the All · In use · Not activated · Completed tab bar is gone — statuses are no longer drawn, so there is nothing to tab on. Type select, Expiring filter and search remain.' },
              { name: 'count line', type: 'derived', notes: '“8 products” — rows matching the current tab and filters, not groups' },
              { name: 'expiring', type: 'checkbox', notes: '“Expiring within 7 days” — keeps rows whose deadline (the date line 2 counts down to) is ≤ 7 days away' },
              { name: 'type', type: 'select', notes: 'All product types · Job posting · Add-on · CV search · Branding · Manual service' },
              { name: 'search', type: 'text', notes: 'matches product name or order number (PO-…)' },
            ],
          },
          {
            group: 'Group header (one per order)',
            items: [
              { name: 'order.code', type: 'string', required: true, notes: 'PO-2026-0912 — bold' },
              { name: 'invoice.issuedAt', type: 'date', required: true, notes: 'the official invoice’s issue date; the anchor for every Activate by in the group' },
              { name: 'payment pill', type: 'enum', required: true, notes: 'Paid dd/mm/yyyy (green) · Unpaid (amber) · Overdue · N days (rose) — read from the order’s payment fact' },
              { name: 'count', type: 'derived', notes: '“3 products”' },
              { name: 'Free group', type: 'variant', notes: '“Free job posting” · pill “No invoice” · “n products · posted for you by Saramin”. Pinned first, hidden when empty.' },
            ],
          },
          {
            group: 'Row (Figma component “Product usage · row”)',
            items: [
              { name: 'type chip', type: 'enum', notes: 'Job posting · Add-on · CV search · Branding · Manual service — grey outline chip above the name' },
              { name: 'product name', type: 'string', required: true, notes: 'the catalogue name — Top Job, Hot job label, CV Search 30d…' },
              { name: 'usage text', type: 'derived', required: true, notes: '“0 of 2 posts used” · “1 of 1 used” · “42 of 200 CVs unlocked” · “2 of 4 delivered” · free job: “1 free post” · unlimited: “12 posts used” / “137 CVs unlocked” — no “of N”' },
              { name: 'usage bar', type: 'progress', notes: 'quotaUsed / quotaTotal; blue while In use, grey at 100 %; hidden on the free-job row. On an UNLIMITED row (quotaTotal null) the {{tag:∞ Unlimited}} chip stands in its place — see “Unlimited quota”' },
              { name: 'deadline', type: 'derived', required: true, notes: 'the date line 2 counts to — the “Expiring within 7 days” filter reads it (see “The date column”)' },
              { name: 'state cell', type: 'two lines', required: true, notes: 'line 1 = remaining in the product’s unit (amber when not activated, grey when ended / all used) · line 2 = the date it counts to — see “One state cell for every row”. No pill (REVISED 2026-09-08).' },
              { name: 'reason wording', type: 'derived', notes: 'folded into line 1 / line 2 for ended rows: “ended” · “Not used by dd/mm/yyyy” · “Withdrawn — invoice cancelled”' },
              { name: 'button', type: 'action', required: true, notes: 'EXACTLY ONE per row, same size, per type and state — see “One state cell for every row”; hidden when the role may not use it' },
            ],
          },
          {
            group: 'Footer notes (static)',
            items: [
              { name: 'note 1', type: 'text', notes: '“Usage from the last 2 years is shown here.”' },
              { name: 'note 2', type: 'text', notes: '“Closing a posting early does not refund the unused days of a product in use.”' },
              { name: 'note 3', type: 'text + links', notes: '“Usage & payment: [FAQ] · Help center …” — the help-center block is the account’s sales owner when one is assigned (Home dashboard rule), else the general hotline' },
            ],
          },
        ],
        behaviors: [
          'One request loads the grouped list for the current tab and filters; the page never renders half-populated. Tab and filter changes re-query with counts.',
          'Publishing a job spends a slot AT PUBLISH, not at draft; the row’s usage text and bar update on the next load, and the Create job form already showed “using 1 of N posts” before the click.',
          '{{btn:Post a job}} opens Create job with this row’s tier preselected and locked to this order’s slots. {{btn:Apply to a job}} opens a picker of the account’s Open jobs that do not already carry the add-on; choosing one applies it and starts its 10 days. {{btn:Search CVs}} opens Resume search. {{btn:View job}} opens the job. {{btn:Buy again}} opens the request-a-quotation form.',
          '{{btn:Activate}} opens the confirmation modal; Cancel closes it with no call; Activate now calls the endpoint once (the button disables while in flight) and shows the toast.',
          'A row whose deadline is ≤ 7 days shows its line 2 in amber; the same threshold raises the “Product expiring” alert on the Home dashboard, so the two cannot disagree.',
          'The Free group renders only when it has rows. No “all clear” or “no free jobs” header.',
        ],
        rules: [
          'This page WRITES nothing except the CV-search activation. Quota is decremented by the screens that spend it, and every decrement is idempotent and attributed (Products & Packages → “Entitlement is the single downstream record”).',
          'activateBy is snapshotted on the entitlement at provisioning (invoice.issuedAt + the product’s activationWindowMonths). Changing the product later does not move it; a customer extension is an explicit, logged change on the entitlement.',
          'Status is computed at read time from the counters and dates in the status table. No stored status column — a stored one would go stale the day a job closes.',
          'The number that identifies a group is the order (PO-…). The tax invoice’s legal number appears only on Payment history, next to the document it belongs to.',
          'Nothing from Saramin Korea’s billing page that the VN product model lacks is copied: no points, no coupons, no cart, no “Scheduled” status.',
          'Rows Completed more than 2 years ago are omitted (footer note 1). Older history stays in the account’s audit log and on Payment history, which keeps 5 years.',
        ],
        states: [
          'No products yet — nothing provisioned: “No products yet” with {{btn:See products}} and the sales owner’s contact; tabs and filters hidden',
          'First order, nothing used — every row Not activated; the Home dashboard shows its “Product paid but not activated” alert pointing here',
          'Unpaid order already provisioned — header pill Unpaid / Overdue and the amber “Payment pending” line under it',
          'All rows Completed — a lapsed or returning customer: {{btn:Buy again}} on every row, the empty-state offer is NOT shown (they have history)',
          'Filters match nothing — “No products match these filters” with a reset link; the count line reads “0 products”',
          'Loading / request failed — a single retry, never a grid of empty groups',
        ],
        backend: {
          dataModel: [
            { name: 'id', type: 'uuid', required: true },
            { name: 'accountId', type: 'ref → Account', required: true },
            { name: 'orderId · orderCode', type: 'ref → PO', required: true, notes: 'the group; null only for the free-job rows' },
            { name: 'invoiceId · invoiceIssuedAt', type: 'ref → Invoice · date', required: true, notes: 'the provisioning event; issuedAt is the header date and the activate-by anchor' },
            { name: 'productId · productName · productType', type: 'ref → Product · string · enum', required: true, notes: 'posting-tier · add-on · cv-search · branding · manual-service · free-job' },
            { name: 'quotaTotal · quotaUsed', type: 'int? · int', required: true, notes: 'unit per type: posts · labels · slots · CV unlocks · deliveries. quotaTotal null = UNLIMITED — never a sentinel (see “Unlimited quota”)' },
            { name: 'unitDurationDays', type: 'int', notes: '30 postings · 10 labels · 30 / 90 CV search — from product fulfilment' },
            { name: 'activateBy', type: 'date', required: true, notes: 'snapshot: invoiceIssuedAt + activationWindowMonths' },
            { name: 'activatedAt · validFrom · validTo', type: 'datetime', notes: 'CV search and branding only — set by Activate / Publish' },
            { name: 'liveUnits[]', type: 'derived', notes: 'for posting and add-on rows: the jobs currently running from this row, each with its window — drives “n live” and the last-unit countdown' },
            { name: 'withdrawnAt', type: 'datetime', notes: 'set when the invoice is cancelled — the row becomes Completed · Withdrawn' },
            { name: 'paymentStatus · paidAt', type: 'derived · date', notes: 'copied onto the group header from the order — see Payment history' },
          ],
          endpoints: [
            'GET /company/entitlements?tab=all|in-use|not-activated|completed&type=&expiring=7&q=&page= → { counts{ byTab }, groups[ { order{ code, invoiceIssuedAt, paymentStatus, paidAt }, rows[] } ], freeGroup?{ rows[] } }',
            'POST /company/entitlements/:id/activate → { validFrom, validTo } — CV search only · Admin only · idempotent · audited',
            '(consumers, owned elsewhere) publish job → spends a posting slot · apply add-on → spends a label/slot · unlock CV → spends an unlock',
          ],
          integrations: [
            'CRM → Invoices (provisioning trigger, invoice date, cancellation → withdrawn)',
            'CRM → Purchase order (order code, payment fact for the header pill)',
            'Products & Packages (product type, unit, duration, activation window)',
            'Job management (publish spends a slot; live jobs per row; Create job preselection)',
            'Resume management (Search CVs; unlocks spend quota)',
            'Account management → Roles (which buttons a user sees) · Home dashboard (the alerts that link here)',
          ],
          notes:
            'A projection over the entitlement ledger, grouped server-side. Status, deadline and days-left are computed in the query (or a view) — never stored — so the page and the Home dashboard alerts read the same numbers. The only write is the CV-search activation, keyed on the entitlement id so a double click cannot start two windows.',
        },
        acceptance: [
          'Issuing the official invoice for an order with three lines shows one new group with three rows, all Not activated, header dated with the invoice date and pill Paid / Unpaid as CRM records it.',
          'Publishing a Top Job from that group changes its row to “1 of 2 posts used”, status In use, line 1 “Use remaining by <invoice date + 12 months>”, line 2 “1 job live”.',
          'Applying the last Hot job label shows “2 of 2 used”, the label’s 10-day window and “10 days left”; when it ends with no unit running, the row reads Completed · Expired and offers Buy again.',
          'Clicking Activate on CV Search 30d shows the modal with the correct end date; confirming sets the window, shows the toast, and the row reads In use · “0 of 50 CVs unlocked” · “30 days left” · Search CVs. Calling activate again returns the same window.',
          'A row whose activateBy passed with quota unused reads Completed · “Not used by dd/mm/yyyy” and its buttons are gone except Buy again.',
          'The “Expiring within 7 days” checkbox returns exactly the rows whose line 2 is amber.',
          'An unlimited product (quotaTotal null) shows “12 posts used” with the ∞ Unlimited chip and no bar; it never turns Completed by count, and the Home dashboard raises no quota alert for it.',
          'A user whose role lacks “Post jobs” sees the posting rows with no button; a non-Admin sees the CV-search row with no Activate.',
          'A free job HQ posted appears in a pinned “Free job posting” group with pill No invoice, usage “1 free post”, button View job; with no free job the group is absent.',
          'The group header never shows an amount; the search box finds a group by its PO- number.',
        ],
        openQuestions: [
          'Free Job quota for employers — one live free job at a time, N per month, or a one-time trial? Today only HQ posts them and the row shows a plain count; the answer changes the usage text (“1 of 1”) and whether a Post a free job button ever exists.',
          'Two CV-search products at once (a 30d and a 90d on the same account) — may both windows run, and if so which one an unlock is drawn from (recommendation: the window that ends first)?',
          'Client confirmation of provisioning-before-payment (T&C clause 3 vs the CRM model). Decides whether an Unpaid group can ever appear on this page.',
          '“Buy again” lands in CRM as a task for the sales owner (recommended — it leaves a record); the alternative is a mailto, which does not.',
        ],
      },
    },
    {
      name: 'Payment history (company site)',
      site: 'Companies',
      slug: 'payment-history-companies',
      scope: ['BE', 'FE', 'UI'],
      notes:
        'The account’s orders with their payment status and documents. One row = one order (PO). Read-only: money is recorded by Accounting in CRM, this page reflects it.',
      ready: true,
      detail: {
        refDocs: [
          {
            label: 'Figma — Payment history',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2159-36117',
            meta: 'Figma frame · 1440 wide',
            note: 'Tabs, period filter, the order table with its status pills and document buttons, the empty state (hidden layer “빈 상품”) and the footer notes.',
          },
        ],
        description:
          'The second page under “Products & Payment Management”. A read-only list of the account’s ORDERS: what was bought, for how much, whether it has been paid, and the two documents the employer needs — the order itself (the payment request with the bank details) and the VAT e-invoice once Accounting has issued it. One row is one order, because an order can exist without an invoice but an invoice never exists without an order.\n\nNothing is paid on this page. Phase 1 has no online checkout: the customer transfers against the order (or pays cash, or offsets a debt), and Accounting confirms the payment in CRM. So there is no “Pay now” — the button on an unpaid row opens the order, which is the document that tells the employer where to send the money and by when.',
        userStory:
          'As the account Admin, I want to see every order we placed with its payment status and download the VAT invoice for our accountant, so that I never have to email Saramin for a document we already have.',
        keyPoints: [
          {
            vi: 'Một dòng = một ĐƠN HÀNG (PO-…), không phải một hóa đơn. Đơn hàng có thể chưa có hóa đơn; hóa đơn không bao giờ tồn tại mà không có đơn hàng.',
            en: 'One row = one ORDER (PO-…), not one invoice. An order can exist without an invoice; an invoice never exists without an order.',
          },
          {
            vi: 'Trạng thái thanh toán là sự thật bên CRM: Paid được LƯU (paidAt, do Kế toán xác nhận); Unpaid và Overdue được SUY RA từ 14 ngày kể từ ngày xuất đơn hàng. Trang này không ghi gì.',
            en: 'Payment status is CRM’s fact: Paid is STORED (paidAt, confirmed by Accounting); Unpaid and Overdue are DERIVED from the 14 days since the order’s issue date. This page writes nothing.',
          },
          {
            vi: 'Không có nút “Pay now”. Giai đoạn 1 không thanh toán trực tuyến — nút trên dòng chưa trả mở ĐƠN HÀNG với thông tin chuyển khoản và hạn trả.',
            en: 'No “Pay now”. Phase 1 has no online payment — the button on an unpaid row opens the ORDER with the bank details and the due date.',
          },
          {
            vi: 'Chỉ hóa đơn GTGT CHÍNH THỨC được đưa cho khách. Hóa đơn nháp không bao giờ hiện ở đây; khi cần chứng từ trước hóa đơn, chứng từ đó là đơn hàng.',
            en: 'Only the OFFICIAL VAT invoice is offered to the customer. A draft never appears here; when a document is needed before the invoice, that document is the order.',
          },
        ],
        requirements: [
          {
            label: 'Payment status — the same three values Accounting sees',
            text: 'The status on a row is the order’s payment status from CRM → “Payment status — a third axis”. One stored fact (paidAt), two derived values, and the same 14-day clock — so the employer and the rep are always looking at the same answer.',
            table: {
              cols: ['Status', 'Means', 'Stored or derived', 'Pill'],
              rows: [
                ['**Paid**', 'Accounting confirmed the money arrived', 'STORED — paidAt', '{{tagok:Paid 03/09/2026}}'],
                ['**Unpaid**', 'No payment yet, still inside the 14 days counted from the order’s issue date', 'DERIVED — no paidAt, within terms', '{{tagwarn:Unpaid · due 16/09/2026}}'],
                ['**Overdue**', 'No payment and more than 14 days since the order was issued', 'DERIVED — turns over by itself at midnight', '{{tag:Overdue · 32 days}}'],
                ['**Expired**', 'The order lapsed at the end of its issue month with no official invoice — there is nothing to pay', 'DERIVED from the PO status', '{{tagmute:Expired}} — All tab only'],
              ],
            },
            items: [
              'The 14 days count from the ORDER’s issue date, never the invoice’s — the customer’s obligation starts when the order is confirmed, and an invoice issued late must not reset a clock they are already behind on.',
              'Partial payment (terms “50 / 50”) shows under Unpaid or Overdue with the remainder: “Paid 50 % · 8,450,000 ₫ remaining”. It is not a fourth tab.',
              'Expired is a row state, not a payment status: it sits under All with a grey pill and is excluded from the three payment tabs. It stays visible so an employer who let an order lapse sees why nothing was provisioned.',
              'The Home dashboard alert “Order awaiting payment” links here filtered to Unpaid + Overdue.',
            ],
            warn: 'This page never confirms a payment, never edits an amount and never creates a document. Every one of those is a Kế toán action in CRM, and the customer-facing copy must not imply otherwise (“your payment will be confirmed by our Accounting team within 1 working day of receipt”).',
          },
          {
            label: 'What a row shows',
            table: {
              cols: ['Column', 'Content', 'Source'],
              rows: [
                ['Order', 'PO-2026-0912 (bold) · 02/09/2026 — the order’s issue date', 'order.code · order.issuedAt'],
                ['Products', 'one line per order line, “Top Job × 2” · “Hot job label × 2” · “CV Search 30d × 1”; gift lines end with “(gift)”; more than 3 lines collapse to “+n more”', 'order.lines'],
                ['Amount', '28,100,000 ₫ — the total after VAT as printed on the order; discounts are already inside it', 'order.totalAfterVat'],
                ['Status', 'the payment pill from the table above', 'order.paidAt · order.issuedAt · PO status'],
                ['Documents', 'one primary button — see “Documents”', 'invoice.status · order.pdf'],
              ],
            },
            items: [
              'Amounts are VND with thousands separators and the ₫ sign after the number, the same format as the quotation and the order PDF.',
              'The row is not expandable and has no detail page in Phase 1: everything a detail page would show is on the two PDFs, and a third rendering of the same lines would drift from the documents that legally count.',
            ],
          },
          {
            label: 'Documents — which button, when',
            text: 'Two documents matter to an employer: the order (to pay, and to show procurement) and the official VAT e-invoice (to claim VAT). Which one is the primary button depends only on whether the official invoice exists yet — never on payment status, because invoicing before payment is ordinary here.',
            table: {
              cols: ['Order state', 'Primary button', 'Also on the row'],
              rows: [
                ['Official VAT invoice issued (paid or not)', '{{btn:Invoice}} — the official e-invoice PDF, with the provider’s legal number and lookup code', 'text link “Order PDF”'],
                ['No official invoice yet — PO Active · Draft invoice · Invoice requested', '{{btn:View order}} — the order PDF: lines, total, bank details, due date. This is how the employer pays.', 'grey note “VAT invoice pending”'],
                ['Expired', '{{btn:View order}} — a read-only copy', 'grey note “No longer payable — ask your sales contact for a new order”'],
              ],
            },
            items: [
              'A DRAFT invoice is never offered. It has no legal force and must not be delivered to the customer as a hóa đơn GTGT (CRM → “Invoice status”). Where a customer needs a document before the official one, that document is the order.',
              'Both PDFs are the files CRM already holds — served through short-lived signed URLs, never re-rendered for this page. Opening one is logged (who, when) on the order.',
              'A cancelled invoice (Kế toán cancel + credit note + re-issue) shows the RE-ISSUED invoice as the button and the cancelled one as a struck-through link beneath it — both stay on record, exactly as CRM keeps them.',
            ],
          },
          {
            label: 'Tabs, period and search',
            table: {
              cols: ['Control', 'Values', 'Rule'],
              rows: [
                ['Tabs', 'All · Paid · Unpaid · Overdue', 'Counts follow the selected period. Expired rows appear under All only.'],
                ['Period chips', '1M · 3M · 6M · 1Y', 'Default 3M. A chip fills the from–to fields; editing a field clears the chip.'],
                ['From – to', 'dd/mm/yyyy · dd/mm/yyyy', 'Filters on the order’s issue date. Maximum reach: 5 years back (footer note 1).'],
                ['Search', 'button', 'Applies period + tab; the count line “N payments” updates.'],
                ['Sort', '—', 'Order issue date, newest first. No sort control.'],
                ['Pagination', '20 rows', 'Standard pagination under the table.'],
              ],
            },
          },
          {
            label: 'Who sees it',
            text: 'The account Admin (Super admin) only. The VAT invoice carries the company’s tax code, legal name and billing address, and the 7-permission role set deliberately has no billing permission (Account management → Roles) — so this menu item is simply absent for custom roles.',
            items: [
              'Alternative considered and rejected: read-only for every user. A recruiter needs quota, not invoices — and quota is on Product usage, which every user can read.',
              'HQ sees the same list on the company record (Account management → “HQ sees what the employer sees”), read from the same CRM documents.',
            ],
          },
        ],
        uiFields: [
          {
            group: 'Filters',
            items: [
              { name: 'tabs', type: 'enum + counts', required: true, notes: 'All · Paid · Unpaid · Overdue' },
              { name: 'period chips', type: 'enum', notes: '1M · 3M · 6M · 1Y — default 3M' },
              { name: 'from · to', type: 'date · date', notes: 'issue-date range; max 5 years back' },
              { name: 'count line', type: 'derived', notes: '“5 payments”' },
            ],
          },
          {
            group: 'Row',
            items: [
              { name: 'order.code · order.issuedAt', type: 'string · date', required: true },
              { name: 'lines[]', type: 'name × qty', required: true, notes: 'gift lines marked; >3 collapse' },
              { name: 'totalAfterVat', type: 'money (₫)', required: true },
              { name: 'payment pill', type: 'enum', required: true, notes: 'Paid dd/mm/yyyy · Unpaid · due dd/mm/yyyy · Overdue · N days · Expired' },
              { name: 'primary button', type: 'action', required: true, notes: 'Invoice · View order' },
              { name: 'secondary', type: 'link / note', notes: '“Order PDF” · “VAT invoice pending” · “No longer payable…”' },
            ],
          },
          {
            group: 'Footer notes (static)',
            items: [
              { name: 'note 1', type: 'text', notes: '“Orders from the last 5 years are shown. Open an invoice to see discounts, quantities and the products it covers.”' },
              { name: 'note 2', type: 'text', notes: '“The VAT e-invoice for an order appears here once Accounting issues it — ask your sales contact if you need it sooner.”' },
              { name: 'note 3', type: 'text + links', notes: '“Usage & payment: [FAQ] · Help center …”' },
            ],
          },
        ],
        behaviors: [
          'The list loads for the default period (3M) on All; changing a tab, chip or date and pressing Search re-queries with counts.',
          '{{btn:Invoice}} and {{btn:View order}} open the PDF in a new tab through a signed URL; the click is logged on the order.',
          'An Unpaid row shows its due date; at midnight after the 14th day it reads Overdue with the day count — no job, no stored flag.',
          'When Accounting confirms a payment in CRM, the row reads Paid dd/mm/yyyy on the next load and the Home dashboard alert clears.',
          'Saramin Korea’s points / coupons / cart quick menu is not rendered — the VN product model has none of them.',
        ],
        rules: [
          'One row per order; never one per invoice and never one per product line.',
          'Payment status is read from CRM’s single stored fact (paidAt) and the order’s issue date. This page has no payment state of its own.',
          'Only the OFFICIAL VAT invoice is downloadable. The draft exists for Sales and Accounting, not for the customer.',
          'Amount = total after VAT as printed on the order. Discount lines are visible on the invoice, not recomputed here.',
          'Visible to the account Admin only.',
        ],
        states: [
          'No orders yet — “No orders yet. Products you order from Saramin appear here with their invoices.” + {{btn:See products}}; filters hidden',
          'Unpaid order — amber pill with due date; button View order; note “VAT invoice pending” if none issued',
          'Overdue order — rose pill with the day count; same buttons; if the invoice was issued first the products are already on Product usage with the “Payment pending” line',
          'Expired order — grey pill, View order, “No longer payable”; excluded from the payment tabs',
          'Cancelled + re-issued invoice — the re-issued one as the button, the cancelled one struck through beneath',
          'Period matches nothing — “No payments in this period” with the chips still shown',
        ],
        backend: {
          endpoints: [
            'GET /company/orders?tab=all|paid|unpaid|overdue&from=&to=&page= → { counts{ byTab }, rows[ { code, issuedAt, lines[{ name, qty, gift }], totalAfterVat, paymentStatus, paidAt, dueAt, overdueDays, poStatus, invoice?{ number, issuedAt, cancelled?, reissuedFrom? } } ] }',
            'GET /company/orders/:id/order.pdf · GET /company/orders/:id/invoice.pdf → 302 to a short-lived signed URL; 404 for a draft-only or missing invoice',
          ],
          integrations: [
            'CRM → Purchase order (code, issue date, lines, total, PO status, payment fact)',
            'CRM → Invoices (official issue date, legal number, cancellation / re-issue, PDF)',
            'Account management → Roles (Admin-only menu item)',
            'Home dashboard (“Order awaiting payment” alert links here)',
          ],
          notes:
            'A read model over CRM’s PO + invoice + payment fact. No table of its own, no writes. Unpaid / Overdue are computed in the query from issuedAt and today, so the customer and the rep see the same value at the same moment.',
        },
        acceptance: [
          'An order issued today with no payment shows Unpaid with a due date 14 days out; on the 15th morning it shows Overdue · 1 day with no other change.',
          'Confirming the payment in CRM turns the pill to Paid dd/mm/yyyy on the next load.',
          'A row whose official invoice exists offers Invoice as the primary button whatever its payment status; a row without one offers View order and the note “VAT invoice pending”; a draft is never downloadable.',
          'The Amount equals the total after VAT on the order PDF to the đồng.',
          'The 3M chip is preselected on first load and the from–to fields show the matching dates; editing a date clears the chip.',
          'A user with a custom role does not see Payment history in the left menu and gets 403 on the endpoints.',
          'An expired order appears under All with the grey pill and under none of the three payment tabs.',
        ],
        openQuestions: [
          'Show the e-invoice lookup code (mã tra cứu) on the row so the customer can verify the invoice on the provider portal without opening the PDF? Recommended — it is the number their accountant actually types.',
          'Should Expired orders be shown at all, or only in HQ’s view? Recommended shown — it explains a missing provisioning.',
          'Partial payments: do we show the paid instalments as separate dates, or only the remainder? Depends on whether CRM records one paidAt or a list.',
        ],
      },
    },
    /* ── Company information (company site) ──────────────────────────────────
       The employer's own view of the company RECORD — legal identity, basic
       facts and the Enterprise Registration Documents. Not the public company
       page (that is HQ-authored, see "HQ AUTHORS the company page"). TWO states,
       set by the verification flag: while Unverified the account Admin edits
       everything here directly and uploads the certificate Saramin verifies
       against; once Verified the page is read-only. Rewritten 09/09/2026 when the
       change-request regime was dropped — verification IS the review. */
    {
      name: 'Company information (company site)',
      site: 'Companies',
      slug: 'company-information-companies',
      scope: ['BE', 'FE', 'UI'],
      notes:
        'The employer’s own company record — legal identity, basic facts, Enterprise Registration Documents. While Unverified the account Admin edits it directly and uploads the one thing Saramin needs to verify the company — the ERC (Giấy chứng nhận đăng ký doanh nghiệp); a banner says so until it is on file (No paperwork → Waiting to verify). Once Verified the page is read-only — only Saramin changes it.',
      ready: true,
      detail: {
        refDocs: [
          {
            label: 'Figma — Company information · view mode',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2311-10289',
            meta: 'Figma frame · 1440 wide',
            note: 'Three sections in Saramin Korea’s table style (label cell · value cell) — Company information · Basic information · Enterprise Registration Documents — one Edit button for the page, an Upload button on the documents section, and the FAQ. While Unverified: a banner above the first section asking for the ERC (✓ / ✗).',
          },
          {
            label: 'Figma — Company information · edit mode',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2313-10289',
            meta: 'Figma frame · 1440 wide',
            note: 'The same rows as inputs / selects, the “※” notes box and Save changes · Cancel. The three verification inputs carry the marker “Saramin đối chiếu với ERC khi xác minh”; the banner stays above the section. Edit mode exists only while the company is Unverified.',
          },
        ],
        description:
          'The first tab under “Company information management” on the company site. It shows the company RECORD — the same fields HQ reads on the CRM company card, minus what only HQ needs (Company ID, lead source, sales owner, deal value) — and it is where a self-registered company becomes verifiable: the account Admin uploads the certificate Saramin verifies against (**tax code · registered address · Enterprise Registration Certificate**), and a banner above the record says which are still missing. The page has TWO states, set by the verification flag. **Unverified**: everything on it is edited directly by the account Admin — there is nothing verified to protect yet, and the admin’s Verify is the review. **Verified**: read-only; only Saramin changes the record, and that change drops the flag until an admin re-verifies (CRM → Sign-up & company verification (ERC)).\n\nIt is deliberately not the public company page. That page is what jobseekers see and HQ authors it section by section (Account management → “HQ AUTHORS the company page”); this page is what the tax office and the invoice see. The layout follows Saramin Korea’s 기업정보 관리 (a label / value table under a left tab bar) because employers know the shape; every field on it is ours.',
        userStory:
          'As the account Admin, I want to see exactly what Saramin still needs from my company to verify it, fill it in and upload our registration documents myself, so that we are verified within a day and can post our first job — and once verified, I want to be sure nobody on my side can accidentally change what prints on our VAT invoices.',
        keyPoints: [
          {
            vi: 'Trang này là HỒ SƠ CÔNG TY (pháp lý · thông tin cơ bản · giấy tờ) — không phải trang công ty công khai. Trang công khai do HQ soạn, ở tab “Company page”.',
            en: 'This page is the COMPANY RECORD (legal · basic facts · documents) — not the public company page. The public page is HQ-authored and lives under the “Company page” tab.',
          },
          {
            vi: 'HAI TRẠNG THÁI theo cờ xác minh. Chưa xác minh → Admin tài khoản sửa trực tiếp mọi trường (kể cả MST, địa chỉ đăng ký) — chưa có gì đã xác minh để bảo vệ, Verify của admin chính là bước duyệt. Đã xác minh → chỉ đọc; chỉ Saramin sửa, và sửa là rớt cờ, phải Verify lại.',
            en: 'TWO STATES, set by the verification flag. Unverified → the account Admin edits every field directly (tax code and registered address included) — nothing verified exists yet to protect; the admin’s Verify is the review. Verified → read-only; only Saramin edits, and that edit drops the flag until re-verified.',
          },
          {
            vi: 'BANNER “No paperwork — để được xác minh, Saramin cần Giấy chứng nhận đăng ký doanh nghiệp (ERC)” với nút Upload document. Cùng một luật với cột Verified của admin: có giấy → Waiting to verify (Saramin xác minh trong 1 ngày làm việc) → Verified.',
            en: 'THE BANNER “No paperwork — to be verified, Saramin needs your business registration certificate (ERC)” with the Upload document button. The same rule as the admin’s Verified column: certificate on file → Waiting to verify (Saramin verifies within 1 business day) → Verified.',
          },
          {
            vi: 'Không có Company ID, không có nhóm Sales (nguồn lead, sales phụ trách, giá trị deal) và không có “người liên hệ chính” của CRM trên trang này. Người của công ty quản lý ở Users & roles.',
            en: 'No Company ID, no Sales group (lead source, sales owner, deal value) and no CRM “primary contact” on this page. The company’s own people are managed under Users & roles.',
          },
          {
            vi: 'Một nút Edit cho cả trang (chỉ khi Chưa xác minh), không phải bút chì trên từng dòng. Chỉ Admin tài khoản được Edit và tải giấy tờ; user khác xem được và vẫn thấy banner — để biết Admin còn phải làm gì.',
            en: 'One Edit button for the whole page (Unverified only), not a pencil per row. Only the account Admin can Edit and upload; every other user reads the page — banner included, so they know what the Admin still has to do.',
          },
        ],
        requirements: [
          {
            label: 'What the customer sees — and what never appears',
            text: 'Field for field the CRM company card (Account management → Company detail, Admin), in the same groups and the same order, so a rep and a customer talking on the phone are looking at the same rows. Three sections on the frame (Figma 2311-10289): Company information · Basic information · Enterprise Registration Documents, then the FAQ. Invoice information moved to the **Billing information** tab on the same frame (see open questions). Three things on the CRM card are HQ’s business and are left off.',
            table: {
              cols: ['Section', 'Rows (★ = required · ◆ = a verification input)', 'Editable by the employer'],
              rows: [
                ['Company information', '★ Company type (Vietnamese company · Foreign company) · ★ Legal name · ★◆ Tax code (MST) — “Foreign tax reference, optional” for a foreign company · ★◆ Registered address — “Registered address” label for a foreign company · Display name', '**Unverified: all of them**, through the page’s one Edit. **Verified: none** — read-only, contact Saramin'],
                ['Basic information', '★ Industry · ★ Company size · ★ Registered country · Province / City (Vietnamese companies only) · Website', 'Same rule — the page has one state, not one per field'],
                ['Enterprise Registration Documents ◆', 'One row per file: file name (link) · Uploaded dd/mm/yyyy · by (you · Saramin). No status chip', 'Upload in BOTH states (button on the section heading); delete only while Unverified'],
              ],
            },
            items: [
              'LEFT OFF on purpose: **Company ID** (an HQ handle, not a fact about the company), the **Sales** group (lead source · sales owner · products interested · estimated deal value · description — CRM qualification data), and the CRM **primary contact** (a sales-side contact person; the customer’s own people are Company users).',
              '◆ MARKS THE VERIFICATION INPUT — at least one ERC file. It is the only thing the banner asks for: the tax code and the registered address were required when the admin created the company, so they are never missing on a record that exists. While No paperwork the documents section carries the chip “Bắt buộc để xác minh” and its empty state is a dropzone.',
              'Company type drives two labels and one requirement exactly as on the CRM form: a Foreign company sees “Foreign tax reference (optional)” and “Registered address” (CRM → “Loại công ty gates the invoice classifications”).',
              'The documents card is called **Enterprise Registration Documents** on both sites since 09/2026 (the admin card was renamed to match) — same records, one store.',
            ],
          },
          {
            label: 'Để được xác minh — the banner, and the one thing it asks for',
            text: 'The answer to “what do you still need from me?” sits on the page that collects it. Above the first section, while the company is not verified, a banner asks for the **Enterprise Registration Certificate (ERC)** and names the control that files it — Upload document. It is computed from the record on every load by the same rule the admin’s Customers list uses (CRM → Sign-up & company verification → “Admin verifies”), so the employer and the admin are never told two different things.',
            table: {
              cols: ['Status', 'Banner', 'What moves it'],
              rows: [
                ['**No paperwork**', 'Amber — “No paperwork — để được xác minh, Saramin cần Giấy chứng nhận đăng ký doanh nghiệp (ERC)”, the certificate row ✗, the documents section a dropzone marked “Bắt buộc để xác minh”', '**Upload document** — one file is enough; several pages are normal'],
                ['**Waiting to verify**', 'Blue — “Waiting to verify — Saramin xác minh trong 1 ngày làm việc”; nothing asked of the employer', 'A Saramin Admin presses **Verify company** on the record'],
                ['**Verified**', 'No banner — the blue tag beside the company name is the statement; the page is read-only', 'A Saramin Admin editing the legal identity drops it back to Waiting to verify · cần xác minh lại'],
              ],
            },
            items: [
              'WHY ONLY THE CERTIFICATE (client, 11/09/2026): the company was created by a Saramin Admin through the Create company form, which already required the legal name, the tax code and the invoice address — so on this page those rows are never empty, and correcting them is not what verification waits for. The certificate is the one thing only the employer can supply.',
              'THE SAME ASK, THREE PLACES on the Company site: the console header button reads “Tải lên ERC để được xác minh →” and turns into the quiet line “Waiting to verify · Saramin xác minh trong 1 ngày làm việc” once a file is on record; Post job shows the same ask in place of its disabled actions; this page shows it above the record. One function renders all three.',
              'It is shown in edit mode too (Figma 2313-10289); the “※” notes box under the rows repeats the rule as its first line.',
            ],
            warn: 'DO NOT STORE “waiting”. It is the verdict plus the documents already on the record; compute it where it is read, on both sites — the build derives it the same way (svn-be V482). A stored flag is how the banner says “Waiting to verify” while the admin’s button says “No paperwork”.',
          },
          {
            label: 'Two states of this page — Unverified: the account Admin edits directly · Verified: read-only',
            text: 'Editability follows the verification flag and nothing else. While Unverified there is nothing verified to protect — the admin’s Verify IS the review of whatever the record says — so the account Admin edits every row directly, including the tax code and the registered address. Once Verified, two parties editing one identity is how the invoice and the certificate stop matching, so the employer’s side goes read-only and only Saramin changes it; an admin edit drops the flag, and the page becomes editable again until the record is re-verified.',
            table: {
              cols: ['', 'Unverified (new · or re-verification needed)', 'Verified'],
              rows: [
                ['Edit button · Save changes · Cancel', 'Shown to the account Admin', 'Gone. A line under the heading: “Đã xác minh — để thay đổi thông tin công ty, liên hệ Saramin.”'],
                ['Upload document', 'Shown', 'Shown — more pages of the certificate never hurt'],
                ['Delete a document (×)', 'Allowed', 'Not allowed — the files are what the check was done against; kept for audit'],
                ['What a Save does', 'Writes the record directly, audited (who · when · field · old → new); the banner recomputes', '— (PATCH returns 403)'],
                ['Who changes the identity', 'The account Admin, or a Saramin admin in Basic info', 'Only a Saramin admin — and that Save drops the flag to Unverified · cần xác minh lại'],
              ],
            },
            items: [
              'THE CHANGE-REQUEST QUEUE IS GONE (09/09/2026). The previous draft routed legal name · tax code · registered address · company type through “Pending review → Applied / Declined” requests that HQ confirmed. Verification replaces it: the fields are edited freely until an admin verifies them, and frozen after. A second approval queue for the same fields would be two places to confirm one fact, and it contradicted the sign-up flow, in which the employer types the MST themselves.',
              'ALTERNATIVES CONSIDERED: (a) keep change requests for verified companies instead of read-only — rejected: the request still ends in an admin Save, which drops the flag anyway, so the queue adds a state and no protection; (b) let the employer edit a verified record and simply drop the flag — rejected: that makes the customer the one who un-verifies their own invoices, silently, from a typo.',
              'HQ SEES THE SAME PAGE read-only from the CRM company record (“HQ sees what the employer sees”), with the Verified tag and the same banner — so support and the customer read one screen on the phone.',
            ],
          },
          {
            label: 'Enterprise Registration Documents — several files, no per-file status',
            text: 'The files that prove the tax code is theirs — the same store the admin’s Enterprise Registration Documents card reads. Several files are normal (the certificate has pages; an amendment is its own sheet). There is NO per-file status: a file is on the record or it is not, and the company-level Verified flag is the only verdict — a per-file Under review / Verified / Rejected chip added a second state to read without anything to act on.',
            table: {
              cols: ['Row shows', 'Rule'],
              rows: [
                ['File name (link, opens a signed URL)', 'PDF · JPG · PNG, ≤ 10 MB each. The type of document is not asked at upload — the certificate IS the type; anything else the customer wants to add (tax registration, signed contract) is welcome and harmless'],
                ['Uploaded dd/mm/yyyy · by you / by Saramin', 'Records which side uploaded; the admin may upload on the customer’s behalf when the file arrives by email'],
                ['× (delete)', 'Only while Unverified. After Verify the files are evidence and stay; a newer version is added, never replaces'],
              ],
            },
            items: [
              'Uploading is offered in view mode too (button on the section heading) — adding a document is not an edit of the record, so it never needs Edit mode.',
              'An empty list reads “Chưa có tệp nào” with the format hint, and the banner’s third line is ✗. Files attached at sign-up appear here from the first load.',
              'Uploading a file does not move the flag — an upload is evidence, not a decision. What it does is flip the admin’s row from “No paperwork” to “Waiting to verify”.',
            ],
          },
          {
            label: 'Edit mode — one toggle for the whole page (Unverified only)',
            table: {
              cols: ['Step', 'What happens'],
              rows: [
                ['{{btn:Edit}} (view mode, first section heading)', 'Every row turns into its input: text fields (Legal name · Tax code · Registered address · Display name · Website), selects (Company type · Industry · Company size · Registered country · Province / City). The three verification inputs carry the marker “Saramin đối chiếu với ERC khi xác minh — in trên hóa đơn GTGT”. The Edit button is replaced by “★ Required”. The banner stays above the section.'],
                ['Typing', 'Company type switches the tax-code label and requirement live. Registered country ≠ Việt Nam hides Province / City.'],
                ['{{btn:Save changes}}', 'Validates required marks and formats (tax code 10 or 13 digits; website is a hostname). Writes the record directly with an audit entry per changed field, returns to view mode and recomputes the banner: “Saved.” — the banner is untouched by a Save; only an upload moves it'],
                ['{{btn:Cancel}}', 'Discards the whole draft — every input returns to the record. Nothing survives a cancelled edit.'],
              ],
            },
            items: [
              'A server-side pre-check on Save WARNS when the tax code already belongs to another Saramin account: “Mã số thuế này đã đăng ký trên một tài khoản Saramin khác — Saramin sẽ liên hệ.” It does not block the Save — a duplicate is a real HR person at an existing customer more often than fraud — but the admin’s Verify is blocked until the duplicate is resolved (Sign-ups → Move, or archive the duplicate). Uniqueness is enforced at Verify, not at typing.',
              'The “※” notes box above the buttons carries four fixed lines: the certificate Saramin verifies against · required marks and the MST format · document formats and size · after verification the page is read-only.',
            ],
          },
          {
            label: 'Tabs on this screen, and who can do what',
            table: {
              cols: ['Tab', 'Shows', 'Owned by'],
              rows: [
                ['Company information', 'This page', 'this feature'],
                ['Billing information', 'Label as set on the Figma frame (05/09/2026). The billing side of the account — invoice defaults and payment documents; the Invoice information section is assumed to live here. Decision pending (see open questions).', 'Products & Payment Management (Product usage · Payment history) · CRM → Invoices'],
                ['Users & roles', 'The account’s logins and custom roles', 'Account management → Company users · Roles (on CO)'],
              ],
            },
            items: [
              'View: every company user. Edit, Save, Upload and delete: the account Admin only — everyone else sees the page without those buttons, but WITH the banner, so a recruiter who cannot post knows what the Admin still has to do.',
              'Unverified → Edit / Save / Upload / × shown to the Admin. Verified → Upload only; the heading line says to contact Saramin.',
              'HQ sees the same page read-only from the company record, plus its own Verify button on Company detail — the two sides of one flag.',
            ],
          },
        ],
        uiFields: [
          {
            group: 'Page chrome',
            items: [
              { name: 'title', type: 'text', notes: '“Company information management”' },
              { name: 'tabs', type: 'enum', notes: 'Company information (active) · Billing information · Users & roles — the public company page is reached from the Company page screen, not from this tab bar' },
              { name: 'verification banner', type: 'derived', notes: 'above the first section while not verified: amber “No paperwork — Saramin cần Giấy chứng nhận đăng ký doanh nghiệp (ERC)” with the Upload document button, or blue “Waiting to verify” with the SLA once a file is on record. Absent when Verified. Same derivation as the admin’s Verified column' },
              { name: 'section heading', type: 'text + action', notes: 'Company information carries {{btn:Edit}} (view) / “★ Required” (edit) — Unverified only; Enterprise Registration Documents carries {{btn:Upload document}} in both modes and both states' },
              { name: 'FAQ', type: 'accordion', notes: 'six questions; the first becomes “What does Saramin need to verify my company, and what can I change after that?” · which files count · effect on VAT invoices · where the public page is edited · who can edit · adding HR users' },
            ],
          },
          {
            group: 'Row (KR table style)',
            items: [
              { name: 'label cell', type: 'text', notes: '200 px, grey background, ★ in red when required' },
              { name: 'value cell', type: 'text | input | select | document line', notes: 'view: value in dark text, or “—” · edit: 500 px input / select, marker “Saramin đối chiếu với ERC khi xác minh” under the tax code and address rows' },
              { name: 'document line', type: 'composite', notes: 'file name (link) · “Uploaded dd/mm/yyyy” · by you / by Saramin · × while Unverified. No status chip' },
            ],
          },
          {
            group: 'Edit mode footer',
            items: [
              { name: 'notes box', type: 'static “※” list', notes: '4 lines — see the Edit mode block; the verification rule is the first' },
              { name: 'buttons', type: 'action', notes: '{{btn:Save changes}} primary · {{btn:Cancel}} secondary, centred' },
            ],
          },
        ],
        behaviors: [
          'The page loads the record, the documents and the verification state in one request; the banner is computed from the three fields — client and server use the same rule.',
          '{{btn:Edit}} switches every section at once; there is no per-row edit. Leaving the page with unsaved changes asks for confirmation. Edit is absent when the company is Verified.',
          'Company type and Registered country re-render dependent rows live in edit mode, using the same gating table as the CRM form.',
          '{{btn:Save changes}} writes the fields in one transaction with one audit entry per changed field and recomputes the banner; the toast names what is still missing, or that the record is complete.',
          '{{btn:Upload document}} opens a file picker (several files); the new rows appear immediately, the banner’s ERC line turns ✓, and the admin’s Customers row reads ready if nothing else is missing.',
          'When an admin verifies the company, the page re-renders read-only on next load with the blue tag; when an admin later edits identity data, it re-renders editable with the tag reading Chưa xác minh · cần xác minh lại.',
        ],
        rules: [
          'Editable ⇔ Unverified. No field-level exceptions in either direction: an Unverified record is fully the Admin’s to edit (MST and registered address included); a Verified one is fully read-only to the employer. Upload document is the one action outside the rule — allowed always.',
          'Only the account Admin writes here (PATCH · POST · DELETE); every other role reads. The 7-permission role set deliberately has no “company record” permission.',
          'MST format: 10 or 13 digits for a Vietnamese company; free text and optional for a Foreign company. A duplicate MST warns at Save and blocks the admin’s Verify.',
          'Documents have no status. Delete only while Unverified; never replaced, only added.',
          '“Waiting to verify” = at least one ERC file on the record — computed, not stored, on both sites from one derivation (the build’s, svn-be V482).',
          'Every write on this page is audited: who, when, field, old → new (or file added / removed).',
          'The public company page is not edited here and is never affected by a change on this page except the display name, which it reads.',
        ],
        states: [
          'No paperwork — amber banner asking for the ERC; Edit shown to the Admin',
          'Waiting to verify — blue banner with the SLA; Edit still shown (the record can be corrected until an admin verifies it)',
          'Verified — no banner, blue tag; Edit gone, Upload stays, the heading line says to contact Saramin',
          'Waiting to verify · cần xác minh lại — an admin edited a verified record: amber tag with the reason, Edit back',
          'Foreign company — tax code optional (“Foreign tax reference”); no Province / City',
          'No documents yet — the documents section is a dropzone “Tải lên Giấy chứng nhận đăng ký doanh nghiệp”; the tag reads No paperwork',
          'Non-Admin user — page renders with the banner but without Edit, Upload and ×',
          'Loading / failed — one retry, never a half-rendered form',
        ],
        backend: {
          dataModel: [
            { name: 'company (read / write)', type: 'ref → CRM Company', required: true, notes: 'companyType · legalName · tax · address · shortName · industry · size · country · city · domain — the CRM record itself, no copy. PATCH allowed only while verification.state = unverified' },
            { name: 'company.verification', type: 'read', required: true, notes: 'verified | unverified (+ reason new | edited) — owned by CRM → Sign-up & company verification (ERC); this page only reads it' },
            { name: 'CompanyDocument', type: 'entity', required: true, notes: 'id · companyId · file (id, name, size, mime) · uploadedBy (company user | admin) · uploadedAt. NO status field. Delete allowed only while the company is unverified' },
            { name: 'verificationLabel', type: 'derived', notes: 'VERIFIED · WAITING_TO_VERIFY · UNVERIFIED (No paperwork), computed in the GET from the verdict + documents; never a column' },
            { name: 'audit', type: 'append-only', required: true, notes: 'every write on this page' },
          ],
          endpoints: [
            'GET /company/profile → { company, verification (label + verifiedAt), documents[] }',
            'PATCH /company/profile { companyType?, legalName?, tax?, address?, shortName?, industry?, size?, country?, city?, domain? } — account Admin only; 403 when the company is verified; validates the MST format; warns (does not block) on a duplicate MST',
            'POST /company/documents (multipart, several files) → rows · DELETE /company/documents/:id — only while unverified · GET /company/documents/:id → 302 signed URL',
            '(HQ, CRM) the same record through Company detail · Basic info; POST /admin/crm/companies/:id/verify proceeds only in Waiting to verify',
          ],
          integrations: [
            'CRM → Company record (the single store; the same rules as the CRM card: company type gating, MST format)',
            'CRM → Sign-up & company verification (ERC) — the flag this page reads, the label derivation it shares, the Verify that freezes it',
            'Account management → Roles (Admin-only writes) · Company users (the Users & roles tab)',
            'Job management → Post job on the Company site reads the same flag and asks for the same certificate',
            'Company page (reads display name) · Notifications (company verified · re-verification needed)',
          ],
          notes:
            'No second company table. The company site reads and writes the CRM record directly while the company is unverified, and only reads it once verified — one rule (editable ⇔ unverified) enforced in one place (the PATCH). Documents are the CompanyDocument rows the admin card lists — a rename in the UI, not a new store, and with no status column.',
        },
        acceptance: [
          'A newly placed Admin opens the page: three sections, an amber banner “No paperwork — để được xác minh, Saramin cần Giấy chứng nhận đăng ký doanh nghiệp (ERC)”, Edit and Upload document shown; Company ID, lead source, sales owner, deal value and the CRM primary contact appear nowhere.',
          'Edit → correct the registered address → Save changes: the record is written with an audit entry and the row shows the new value; the banner is unchanged — the address is not what verification waits for.',
          'Upload document with two PDFs: two rows appear immediately, the banner turns blue “Waiting to verify — Saramin xác minh trong 1 ngày làm việc”; the admin’s Customers row reads Waiting to verify and its Verify company button enables.',
          'An admin verifies the company: on next load the page shows the blue Verified tag, no banner, no Edit; Upload document still works; PATCH returns 403.',
          'An admin edits the legal name of the verified company: the page shows Waiting to verify · cần xác minh lại — the documents never left the record — and Edit is back.',
          'Switching Company type to Foreign company relabels the tax code as optional; Registered country ≠ Việt Nam hides Province / City. Neither touches the banner.',
          'Saving a tax code that belongs to another account shows the warning and still saves; the admin’s Verify on this record is blocked until the duplicate is resolved.',
          'A non-Admin user loads the page with the banner and without Edit, Upload or ×; PATCH, POST and DELETE return 403 for them.',
          'Cancel after edits restores every field, including dependent-row state, to the record.',
        ],
        openQuestions: [
          'Billing information tab: the Figma frame (09/2026) shows no Invoice information section on this page, so the invoice defaults are assumed to live on the Billing information tab. Confirm, and spec that tab — who edits buyer classification · buyer name · ID card · invoice address, and whether a verified company may.',
          'Should the employer be shown WHEN the company was verified (“Đã xác minh 09/09/2026”), or only the tag? Recommendation: the date — it answers “is this recent?” without exposing the admin’s name.',
          'Duplicate MST at Save — warn (current) or block? Recommendation: warn; blocking would stop a real HR person at an existing customer from completing a record that Sign-ups → Move will merge anyway.',
          'Individual-buyer fields (Buyer name · ID card) are personal data of a director. If they stay on the Billing information tab, decide whether the customer types them or only Saramin does from a signed document.',
        ],
      },
    },
    {
      name: 'Roles (permission builder, on CO)',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      notes: 'Admin builds/edits the account’s roles by ticking a short permission set; users are then assigned a role.',
      detail: {
        refDocs: [
          { label: 'Figma — Users & roles · Roles tab', href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2330-10878', meta: 'Figma frame · 1440 wide', note: 'Role name (Admin locked, starter badge) · users count · permissions summary · Edit / Delete. Toolbar: Add role.' },
          { label: 'Figma — Create role', href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2332-10499', meta: 'Figma frame', note: 'Role name + the 7-permission builder in 3 groups; prerequisites auto-ticked and locked; Resume group greyed without Resume Search; Save role · Cancel.' },
        ],
        description:
          'The Roles screen where the Admin composes a custom role from the 7-permission catalog (3 modules) and names it. Roles are then picked when inviting or editing a user. The account ships with starter custom roles (Recruiter, Viewer) so no one starts from a blank checklist; they are ordinary editable roles — Admin can edit them or add new ones. Admin itself (the Super admin) is the one fixed role and is not editable here. "Manage users & roles" is never a tickable permission — it stays on the Admin role only.',
        userStory:
          'As the Admin, I want to build a role from a short list of permissions and reuse it, so that I assign access consistently instead of configuring each person from scratch.',
        requirements: [
          {
            label: 'The Roles tab',
            table: {
              cols: ['Column', 'Shows', 'Rule'],
              rows: [
                ['Role', 'Name · {{tagok:Admin}} on the fixed role · {{tagmute:Starter}} on Recruiter and Viewer', 'Admin is never editable; starter roles are ordinary editable roles'],
                ['Users', 'How many users hold the role', 'Click → Users tab filtered by that role'],
                ['Permissions', '“7 of 7” plus the ticked permissions as chips', 'Admin reads “All permissions + manage users & roles”'],
                ['Actions', '{{btn:Edit}} · {{btn:Delete}}', 'Delete is disabled while any user holds the role (tooltip names the count); Admin has no actions'],
              ],
            },
            items: [
              'Toolbar: {{btn:Add role}}. No search or filter — an account has a handful of roles, and a list that fits on one screen needs neither.',
              'VietnamWorks’ role list shows only a name and a count; the permissions column is added so the Admin can compare roles without opening each one.',
            ],
          },
          {
            label: 'Create / edit role — the 7-permission builder',
            text: 'The whole VietnamWorks “Thêm vai trò” idea (name + checkbox groups) with the catalogue cut to 7 permissions in 3 groups — the module rule “not a 30-checkbox tree”. Prerequisites are auto-included, so a role cannot be built broken.',
            table: {
              cols: ['Group', 'Permission', 'Prerequisite (auto-ticked, locked)'],
              rows: [
                ['Job posts', 'View jobs', '—'],
                ['', 'Post jobs', 'View jobs'],
                ['', 'Edit jobs — edit and close a posting', 'View jobs'],
                ['Applications', 'View applications & CVs', '—'],
                ['', 'Manage applications — move through the pipeline, shortlist, reject', 'View applications & CVs'],
                ['Resume search', 'Search resumes — browse masked results', '—'],
                ['', 'View / unlock resume detail — spends 1 CV unlock, reveals contact', 'Search resumes'],
              ],
            },
            items: [
              'Ticking a higher action ticks and locks its prerequisite; unticking a prerequisite unticks what depends on it, with an inline note saying so.',
              'The Resume search group is greyed with “Requires Resume Search — not on this account” when the entitlement is missing; the boxes still exist so a role built today works the day the product is bought.',
              'Role name is required and unique within the account. A role must have at least one permission — a role with none is a Viewer with nothing to view.',
              'A fixed last line reads: “Manage users & roles is part of the Admin role and cannot be added to a custom role.”',
              '{{btn:Save role}} returns to the Roles tab; on edit, every user holding the role is re-scoped at their next action. {{btn:Cancel}} discards the draft.',
            ],
          },
        ],
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
        refDocs: [
          { label: 'Figma — Users & roles · Users tab', href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2330-10191', meta: 'Figma frame · 1440 wide', note: 'One row per login: name + Admin badge + email · role as an inline select · status chip · last active · ⋯ actions. Toolbar: count + seats, search, filter, Invite user.' },
          { label: 'Figma — Invite user', href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2332-10191', meta: 'Figma frame', note: 'Email · Full name (one field) · Role select with “View permissions” · Send invitation. The seat counter is shown above the form.' },
          { label: 'Figma — Invitations tab', href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2330-10556', meta: 'Figma frame', note: 'Pending and Expired invitations with sent date, expiry, Resend and Cancel. Accepted and Cancelled rows leave the tab.' },
        ],
        description:
          'Self-serve team management. Every user is a row with their own email/login and an ASSIGNED role (Admin, or a role built on the Roles screen). Role is a reference to a role, not a bag of per-user permissions — so editing a role re-scopes everyone on it, and changing a person’s access is just picking a different role.',
        userStory:
          'As the Admin, I want to invite my team and assign each person a role so that the right people can post jobs / search CVs without sharing one login.',
        keyPoints: [
          {
            vi: 'Một dòng = một login. Mỗi dòng có MỘT ô chọn vai trò — đổi vai trò ngay trên danh sách. Không có quyền theo từng user, không có “Assigned job”: quyền là theo tài khoản, qua vai trò.',
            en: 'One row = one login. Each row has ONE role select — change the role right on the list. No per-user permissions and no “Assigned job” column: access is account-wide, through the role.',
          },
          {
            vi: 'Mời = email + Họ và tên (MỘT ô) + vai trò. Người được mời tự đặt mật khẩu qua link 7 ngày. Lời mời chiếm chỗ (seat) ngay khi gửi — huỷ hoặc hết hạn thì trả chỗ.',
            en: 'Invite = email + Full name (ONE field) + role. The invitee sets their own password through a 7-day link. An invitation takes a seat the moment it is sent — cancelling or expiry frees it.',
          },
          {
            vi: 'Trạng thái lời mời là bảng riêng: Pending · Accepted · Expired · Cancelled. Tab Invitations chỉ giữ Pending và Expired — những thứ Admin còn phải xử lý.',
            en: 'Invitation status is its own table: Pending · Accepted · Expired · Cancelled. The Invitations tab keeps only Pending and Expired — what the Admin still has to act on.',
          },
          {
            vi: 'Admin cuối cùng không bao giờ bị hạ vai trò hay vô hiệu hoá — ô chọn của họ bị khoá kèm lý do. Muốn chuyển giao thì cấp Admin cho người khác trước.',
            en: 'The last Admin is never downgraded or disabled — their select is locked with the reason. To hand over, grant Admin to someone else first.',
          },
        ],
        requirements: [
          {
            label: 'The Users tab — one row per login',
            text: 'The layout is Saramin Korea’s 멤버 권한 설정 table (name cell with a badge, per-row selects, 68 px rows); the flow is VietnamWorks’ (users → invite → invitations sent → roles). What changed from both: KR’s three per-module selects became ONE role select, and VietnamWorks’ “Assigned job” column is gone, because a role is account-wide.',
            table: {
              cols: ['Column', 'Shows', 'Rule'],
              rows: [
                ['Name', 'Full name (bold) · {{tagok:Admin}} badge on the fixed role · email underneath', 'Sorted by name; search matches name and email'],
                ['Role', 'An inline select listing the account’s roles — Admin · Recruiter · Viewer · custom', 'Applies immediately with a toast. Locked (with tooltip) on the last active Admin and on Disabled rows'],
                ['Status', '**Active** · **Invited** · **Disabled**', 'The account-status table above. Invited rows are the same person as their Pending invitation — one row here, one in the Invitations tab, same record'],
                ['Last active', 'dd/mm/yyyy hh:mm of the last request', '“—” while Invited; keeps the last value when Disabled'],
                ['Actions (⋯)', 'Resend invite (Invited) · Deactivate (Active) · Reactivate (Disabled)', 'Deactivate confirms with the offboarding wording; Reactivate is blocked at the seat cap; nothing here deletes'],
              ],
            },
            items: [
              'Toolbar: “Users 3” with “3 of 4 seats used” beside it · search (name, email) · Filter (role · status) · {{btn:Invite user}}. The button is disabled at the cap with the reason in a tooltip.',
              'Disabled rows stay in the list, greyed, so the audit trail stays visible — they are filtered out only when the Status filter says so.',
              'Everything on this tab is Admin-only. A non-Admin who opens the page sees the list read-only, without selects, actions or the Invite button.',
            ],
          },
          {
            label: 'Invite a user — email, one Full name, one role',
            table: {
              cols: ['Field', 'Rule'],
              rows: [
                ['Email ★', 'Their login. One email = one employer login platform-wide: an email already on THIS account says “already a member”, one on another company says “this email belongs to another company account — contact Saramin”. An email with a Pending invitation offers Resend instead of a second invitation.'],
                ['Full name ★', 'ONE field. VietnamWorks splits Họ / Tên; the platform standard is a single Full name (see “Full name — one field”). Shown in the Users list from day one, before they accept.'],
                ['Role ★', 'One of the account’s roles, Admin included. “View permissions” beside the select opens the role’s 7-permission summary so the Admin sees what they are granting.'],
              ],
            },
            items: [
              '{{btn:Send invitation}} creates the invitation (Pending), takes one seat, and emails a set-password link valid 7 days. Nobody types a password for anyone.',
              'The form shows the seat counter above it. At the cap it does not open: the Users tab’s Invite button is disabled with “All 4 seats are in use — deactivate a user or cancel an invitation first”.',
              'Granting Admin is just choosing Admin here; there is no separate transfer flow.',
            ],
          },
          {
            label: 'Invitation status',
            table: {
              cols: ['Status', 'Means', 'Rule'],
              rows: [
                ['**Pending**', 'Sent; the link is still valid (7 days)', 'Row in the Invitations tab with “Sent dd/mm · expires dd/mm” · actions {{btn:Resend}} · {{btn:Cancel}}. Holds a seat.'],
                ['**Accepted**', 'The person opened the link and set a password', 'Becomes an **Active** user; the row leaves the Invitations tab. The seat it held is now the user’s.'],
                ['**Expired**', '7 days passed without acceptance', 'Stays in the tab as “Expired dd/mm” with {{btn:Resend}} · {{btn:Cancel}}; the seat is freed. Resend issues a new 7-day link.'],
                ['**Cancelled**', 'The Admin cancelled it', 'The link stops working at once; the row leaves the tab; the seat is freed; the record stays in the audit log.'],
              ],
            },
            items: [
              'Resend invalidates the previous link and restarts the 7 days; the row shows “Resent dd/mm”. There is no limit, but every resend is audited.',
              'The tab label counts what needs attention: Invitations (Pending + Expired).',
              'An Invited user who never accepts never becomes a row you have to deactivate — Cancel is the exit, and it frees the seat.',
            ],
          },
          {
            label: 'Changing a role inline — and the guards',
            items: [
              'Choosing another role in the row applies immediately: toast “Role changed to Recruiter — takes effect on their next action”. No confirmation dialog: the change is reversible with the same select.',
              'The last active Admin’s select is locked, tooltip “Grant Admin to another user before changing this role”. The same guard blocks Deactivate on that row.',
              'An Admin changing their OWN role to a non-Admin role is allowed only when another active Admin exists — the same rule, applied to yourself.',
              'A Disabled user keeps their role but cannot log in; the select is locked until Reactivate.',
              'HQ break-glass (reassign Admin when the sole Admin is gone) lives on the CRM company record, not on this page.',
            ],
          },
        ],
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
        states: ['Invited (pending)', 'Active', 'Disabled', 'Invitation expired — Resend offered, seat freed', 'Invitation cancelled — leaves the tab, kept in audit', 'Join request pending approval', 'Seat limit reached (4) — Invite disabled with reason', 'Last Admin (downgrade/disable blocked)', 'Non-Admin viewing — read-only list, no selects or actions'],
        backend: {
          dataModel: [
            { name: 'userId', type: 'uuid' },
            { name: 'accountId', type: 'ref(account)', required: true },
            { name: 'email', type: 'string', required: true, notes: 'unique per user' },
            { name: 'roleId', type: 'ref(role)', required: true, notes: 'Admin is a reserved role id' },
            { name: 'status', type: 'enum', notes: 'invited | active | disabled' },
          ],
          endpoints: [
            'GET /company/users?role=&status=&q= → rows { id, fullName, email, roleId, status, lastActiveAt } + seats { used, cap } (used = Active + Invited/Pending)',
            'POST /company/invitations { email, fullName, roleId } → Pending · takes a seat · emails a 7-day set-password link',
            'POST /company/invitations/:id/resend — new link, old one invalid, expiry reset · DELETE /company/invitations/:id — cancel, frees the seat',
            'GET /company/invitations?status=pending|expired',
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
    /* ── My account (company site) ────────────────────────────────────────────
       The signed-in employer user's OWN settings: who they are, how they sign
       in, what they are notified about, and what their role is. Everything
       about the COMPANY lives on Company information; everything about OTHER
       people lives on Users & roles. This page is the last screen of the
       employer account area and the left menu on it ties the area together. */
    {
      name: 'My account (company site)',
      site: 'Companies',
      slug: 'my-account-companies',
      scope: ['BE', 'FE', 'UI'],
      notes:
        'The signed-in user’s own details, password and sessions, notification preferences and role. No self-serve “delete account” — a company login is the employer’s seat (see “Deactivate = offboarding”).',
      ready: true,
      detail: {
        refDocs: [
          {
            label: 'Figma — My account',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2348-10253',
            meta: 'Figma frame · 1440 wide',
            note: 'Left menu of the account area · My details · Sign-in & security · My role · Email notifications · Leaving the company. KR 계정정보 설정 table style (label / value / action link).',
          },
          {
            label: 'Figma — Change password',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=2348-10729',
            meta: 'Figma frame',
            note: 'The modal: current password · new password with the live rule checklist · confirm · “Sign out of my other devices” · Update password.',
          },
        ],
        description:
          'The signed-in user’s page about themselves. Four things live here and nowhere else: their own details (name, login email, phone, job title, language), how they sign in (password, sessions, last sign-in), what they are emailed about, and which role they hold — read-only, because roles are assigned by the account Admin on Users & roles. The left menu is the map of the whole employer account area: My account · Change password · Notification settings · Company information · Users & roles · Products & payment · Log out.\n\nWhat is deliberately NOT here: a delete or leave button. A company login is a seat that belongs to the company, so leaving is the Admin deactivating the user (Account management → “Deactivate = offboarding”), and a personal-data request goes to Saramin support. The page says so in words, where Saramin Korea puts its 회원 탈퇴 link.',
        userStory:
          'As an employer user, I want to keep my own name, email and password current and choose what I am emailed about, so that my login stays mine and my inbox stays useful — without being able to change anything that belongs to the company or to my colleagues.',
        keyPoints: [
          {
            vi: 'Trang này là về CHÍNH NGƯỜI ĐANG ĐĂNG NHẬP. Thông tin công ty ở Company information; người khác và vai trò ở Users & roles — ở đây vai trò chỉ để xem.',
            en: 'This page is about the SIGNED-IN PERSON. Company facts live on Company information; other people and roles live on Users & roles — here the role is read-only.',
          },
          {
            vi: 'Một chính sách mật khẩu cho cả nền tảng: 12+ ký tự · 1 chữ hoa · 1 số · 1 ký hiệu, kiểm tra trực tiếp khi gõ. Đổi mật khẩu cần mật khẩu hiện tại, và mặc định đăng xuất các thiết bị khác.',
            en: 'One password policy for the whole platform: 12+ characters · 1 uppercase · 1 number · 1 symbol, checked live while typing. Changing it needs the current password, and signs out other devices by default.',
          },
          {
            vi: 'Đổi email đăng nhập chỉ có hiệu lực sau khi email MỚI được xác minh; email cũ nhận thông báo. Trong lúc chờ, đăng nhập vẫn bằng email cũ.',
            en: 'A login-email change takes effect only after the NEW address is verified; the old address is told. Until then, sign-in stays on the old email.',
          },
          {
            vi: 'Không có nút xoá hay rời tài khoản. Login là chỗ ngồi của công ty — Admin vô hiệu hoá (Users & roles); yêu cầu dữ liệu cá nhân gửi cho Saramin support. Trang viết rõ điều đó.',
            en: 'No delete or leave button. The login is the company’s seat — the Admin deactivates it (Users & roles); a personal-data request goes to Saramin support. The page says exactly that.',
          },
        ],
        requirements: [
          {
            label: 'What is on the page — five sections and a left menu',
            text: 'Saramin Korea’s 계정정보 설정 layout: a left menu for the account area, then sections as bordered tables of label · value · action link. The sections and the menu are ours.',
            table: {
              cols: ['Section', 'Rows', 'Action'],
              rows: [
                ['My details', 'Full name · Login email · Phone · Job title · Language (Tiếng Việt · English)', '{{btn:Edit}} per row (inline field) — Login email opens the change-email flow'],
                ['Sign-in & security', 'Password (“Last changed dd/mm/yyyy”) · Active sessions (“2 devices”) · Last sign-in (date · city · browser)', '{{btn:Change password}} → modal · {{btn:Sign out other devices}}'],
                ['My role in <Company>', 'Role ({{tagok:Admin}} or the role name) · Permissions summary · Company · Member since', 'read-only · link “Managed by your account Admin — Users & roles”'],
                ['Email notifications', 'New application received · Daily applicant digest · Interview / stage reminders · Product expiring or quota low · Invoice issued / payment confirmed · Saramin news', 'toggles, saved on change'],
                ['Leaving the company', 'One paragraph: the login is the company’s seat; the Admin deactivates it; personal-data requests go to support', 'no button'],
              ],
            },
            items: [
              'Left menu: My account (this page) · Change password (opens the modal) · Notification settings (scrolls to the section) · Company information · Users & roles · Products & payment · Log out. The same menu appears on every page of the account area.',
              'Header of the account area: logo · “Account” · links Go to Saramin · Company site · Help center. It is the account area’s own header, not the recruiting header.',
              'A non-Admin sees the same page; only the “My role” section differs (their role, and the note that the Admin manages it).',
            ],
          },
          {
            label: 'Change password — the platform policy',
            text: 'The same rule set the jobseeker site uses (Jobseeker user → Sign up), so one person with two Saramin logins never meets two policies.',
            table: {
              cols: ['Field', 'Rule'],
              rows: [
                ['Current password ★', 'Required. Wrong value → one generic error “Current password is incorrect”; 5 wrong attempts in 15 minutes lock the form for 15 minutes.'],
                ['New password ★', '12+ characters · 1 uppercase · 1 number · 1 symbol — a live checklist under the field, each line ticking as it is met. Must differ from the current password and from the login email. Never silently truncated.'],
                ['Confirm new password ★', 'Must match; the mismatch shows on blur, not on every keystroke.'],
                ['Sign out of my other devices', 'Checkbox, ON by default. Off keeps other sessions alive — for someone changing a password on a shared office PC while their phone stays signed in.'],
              ],
            },
            items: [
              '{{btn:Update password}} rehashes and saves, invalidates the other sessions when the box is ticked, keeps THIS session signed in, and emails “Your password was changed” to the login email with a “this wasn’t me” link to support.',
              'The modal never shows password strength as a score or a colour bar — the checklist is the whole feedback. A bar invites “make it green”, the list says what is missing.',
              'Forgot-password (reset by email) is on the sign-in page, not here; this modal is for a user who knows their current password.',
              'The “Last changed” date on the row updates immediately. Every change is audited (who, when, IP).',
            ],
          },
          {
            label: 'Change login email — verified before it counts',
            text: 'The email is the login and the invitation identity, so it changes only after the new address proves it is theirs.',
            table: {
              cols: ['Status', 'Means', 'Rule'],
              rows: [
                ['**Pending verification**', 'A new email was requested; a link was sent to it', 'The row shows “Pending: new@company.vn — check that inbox” with {{btn:Resend}} · {{btn:Cancel}}. Sign-in still uses the OLD email. The link is valid 24 hours.'],
                ['**Verified**', 'The link was clicked', 'The login email changes; the old address receives “Your login email was changed to …” with a support link. Active sessions stay.'],
                ['**Expired**', '24 hours passed', 'The row shows “Expired — Resend” and nothing changed.'],
                ['**Cancelled**', 'The user cancelled, or requested a different address', 'Nothing changed; a new request replaces the old one.'],
              ],
            },
            items: [
              'The new address must be free platform-wide (one email = one employer login) and is checked when the request is made, then again at verification.',
              'Requesting a change asks for the current password — an unattended session must not be able to redirect the login.',
              'The Admin badge, role and seat are unaffected: the person is the same record with a new login.',
            ],
          },
          {
            label: 'Sessions and sign-in history',
            table: {
              cols: ['Row', 'Shows', 'Action'],
              rows: [
                ['Active sessions', '“N devices” — this device is always one of them', '{{btn:Sign out other devices}} — ends every session except this one, confirms with a toast'],
                ['Last sign-in', 'dd/mm/yyyy hh:mm · city (from IP) · browser / OS', 'none — informational, so a stolen password is noticed'],
              ],
            },
            items: [
              'Session lifetime and refresh rules are platform-level (Roles & permissions module); this page only exposes “sign out the others”.',
              'Two-factor authentication is not in Phase 1. The row is not shown greyed — a setting that cannot be turned on should not be on the page.',
            ],
          },
          {
            label: 'Email notifications — mine, not the account’s',
            text: 'These toggles are per user. Alerts that concern the account as a whole are also sent to the account Admin regardless of these toggles, so nothing that costs money or a hire depends on one person’s inbox settings.',
            table: {
              cols: ['Toggle', 'Default', 'Also always sent to'],
              rows: [
                ['New application received', 'on', '—'],
                ['Daily applicant digest', 'on', '—'],
                ['Interview / stage reminders', 'on', '—'],
                ['Product expiring or quota low', 'on', 'account Admin'],
                ['Invoice issued / payment confirmed', 'on for Admin · off for others', 'account Admin'],
                ['Saramin news and tips', 'off', '—'],
              ],
            },
            items: [
              'Saving is immediate per toggle with a small “Saved” confirmation; no Save button for the section.',
              'Security emails (password changed, email changed, new device sign-in) have no toggle — they always go out.',
            ],
          },
          {
            label: 'Leaving the company — words, not a button',
            text: 'Saramin Korea ends the page with 회원 탈퇴 (withdraw). Here the same spot carries a paragraph, because the rule is different: a company login cannot deactivate itself.',
            table: {
              cols: ['Who is reading', 'The paragraph says'],
              rows: [
                ['A non-Admin user', '“Your login is a seat on <Company>’s account. To leave, ask your account Admin to deactivate you on Users & roles. For a request about your personal data, contact Saramin support.”'],
                ['The only Admin', '“You are the only Admin of <Company>. Grant Admin to another user on Users & roles before you can be deactivated — or contact Saramin support.”'],
              ],
            },
            items: [
              'Rule source: Account management → “Deactivate = offboarding” — the user themselves is NOT allowed to deactivate; HQ or the company Admin does. Nothing here changes that.',
              'Log out is in the left menu, not in this section; leaving and signing out are different acts.',
            ],
          },
        ],
        uiFields: [
          {
            group: 'My details',
            items: [
              { name: 'fullName', type: 'string', required: true, notes: 'ONE field — platform standard' },
              { name: 'email', type: 'email', required: true, notes: 'login; changes through the verified flow' },
              { name: 'phone', type: 'string', notes: 'optional; shown to colleagues on Users & roles? — no, private to the user and Saramin support' },
              { name: 'jobTitle', type: 'string', notes: 'e.g. HR Manager — free text' },
              { name: 'language', type: 'enum', notes: 'vi · en — the UI language for this user' },
            ],
          },
          {
            group: 'Sign-in & security',
            items: [
              { name: 'passwordChangedAt', type: 'date', notes: '“Last changed dd/mm/yyyy”' },
              { name: 'sessions[]', type: 'derived', notes: 'count of active sessions; “this device” flagged' },
              { name: 'lastSignIn', type: 'composite', notes: 'at · city · userAgent summary' },
            ],
          },
          {
            group: 'Change password modal',
            items: [
              { name: 'currentPassword', type: 'password', required: true },
              { name: 'newPassword', type: 'password', required: true, notes: 'live checklist: 12+ · uppercase · number · symbol' },
              { name: 'confirmPassword', type: 'password', required: true },
              { name: 'signOutOthers', type: 'bool', notes: 'default true' },
            ],
          },
          {
            group: 'My role (read-only)',
            items: [
              { name: 'role', type: 'ref → role', notes: 'Admin badge or role name' },
              { name: 'permissionsSummary', type: 'derived', notes: '“7 of 7” + chips, or “All permissions + manage users & roles”' },
              { name: 'company · memberSince', type: 'string · date' },
            ],
          },
          {
            group: 'Email notifications',
            items: [
              { name: 'prefs{}', type: 'bool per key', notes: 'newApplication · dailyDigest · stageReminders · productExpiring · invoicePayment · news' },
            ],
          },
        ],
        behaviors: [
          '{{btn:Edit}} on a My-details row turns that row into an inline field with Save / Cancel; other rows stay read-only. Full name and Job title save at once; Login email starts the verified flow; Language applies on save and reloads the UI.',
          '{{btn:Change password}} opens the modal; the checklist updates on every keystroke; Update is disabled until all four rules and the match pass.',
          '{{btn:Sign out other devices}} asks for no password (the user is signed in) but confirms with a toast naming how many sessions ended.',
          'Toggles save on change; a failed save flips back with an error toast.',
          'The left menu highlights the current page; Log out ends this session only.',
        ],
        rules: [
          'This page edits the signed-in user’s own record only. It never shows or edits another user, and never edits the company record.',
          'Password policy: 12+ characters · 1 uppercase · 1 number · 1 symbol; must differ from the current password; the platform never stores or displays a plaintext password.',
          'Login email changes only after the new address is verified; one email = one employer login is enforced at request and at verification.',
          'No self-serve deactivate or delete. The paragraph replaces the button; the rule lives in “Deactivate = offboarding”.',
          'Security emails are not subject to notification toggles.',
          'Every write here is audited: who, when, field, and for passwords only the fact that it changed.',
        ],
        states: [
          'Default — details complete, password changed recently, 1 device',
          'Pending email change — amber line under Login email with Resend · Cancel; sign-in still on the old email',
          'Only Admin — the “My role” section shows the Admin badge and the Leaving paragraph names the Admin-first rule',
          'Password form locked — 5 wrong current passwords: the modal shows “Try again in 15 minutes”',
          'Several devices — “3 devices” with Sign out other devices; after use: “1 device” and a toast',
          'Invoice toggle for a non-Admin — off by default, note “Payment emails always reach your account Admin”',
        ],
        backend: {
          dataModel: [
            { name: 'user (own record)', type: 'ref → CompanyUser', required: true, notes: 'fullName · email · phone · jobTitle · language · passwordHash · passwordChangedAt · notificationPrefs · roleId · accountId · createdAt' },
            { name: 'EmailChangeRequest', type: 'entity', notes: 'userId · newEmail · token · status (pending · verified · expired · cancelled) · requestedAt · expiresAt (24 h)' },
            { name: 'Session', type: 'entity', notes: 'userId · createdAt · lastSeenAt · ip · city · userAgent · current flag' },
          ],
          endpoints: [
            'GET /company/me → { user, sessions{ count, lastSignIn }, role{ name, permissions }, company{ name }, emailChange? }',
            'PATCH /company/me { fullName?, phone?, jobTitle?, language? }',
            'POST /company/me/password { currentPassword, newPassword, signOutOthers } — 401 on wrong current (rate-limited 5 / 15 min); emails a confirmation',
            'POST /company/me/email-change { newEmail, currentPassword } → pending · POST …/resend · DELETE …/cancel · GET /verify-email?token= (24 h) → applies the change, notifies the old address',
            'POST /company/me/sessions/sign-out-others → { ended: n }',
            'PATCH /company/me/notifications { key: bool }',
          ],
          integrations: [
            'Account management → Roles / Company users (role, Admin floor, offboarding)',
            'Notifications (security emails, preference-gated emails, Admin-always alerts)',
            'Jobseeker user → Sign up (shared password policy and rate-limit rules)',
            'Audit log',
          ],
          notes:
            'Everything is scoped to the caller: there is no :userId in these endpoints, so a bug cannot address someone else’s record. The email change is a separate entity so that the login email column is only ever written by the verification step.',
        },
        acceptance: [
          'Editing Full name and saving updates the header name immediately and writes an audit entry.',
          'Changing the password with a correct current password and a policy-compliant new one succeeds, keeps this session, ends the others when the box is ticked, and sends the confirmation email; a new password missing the symbol keeps Update disabled with that checklist line unticked.',
          'Five wrong current passwords within 15 minutes lock the form and the API for 15 minutes.',
          'Requesting a login-email change leaves sign-in on the old email until the link is clicked; clicking it switches the login and emails the old address.',
          'A non-Admin sees their role read-only with the link to Users & roles; the only Admin sees the Admin-first paragraph under Leaving the company; nobody sees a delete or leave button.',
          'Turning “Invoice issued / payment confirmed” off as a non-Admin stops those emails to them and leaves the Admin’s unchanged.',
          'Sign out other devices ends every session but the current one and reports the count.',
        ],
        openQuestions: [
          'Phone on the user record — visible to colleagues (Users & roles) or private? Specced private; confirm.',
          'Language: per user (specced) or per account? Per user matches a Korean HR manager and a Vietnamese recruiter sharing one account.',
          'Session lifetime and “remember this device” duration — platform decision, not yet written anywhere.',
          'Two-factor authentication timing (Phase 2?) — when it arrives it lands in Sign-in & security as a row.',
        ],
      },
    },
    {
      name: 'Company users & roles (on Admin)',
      site: 'Admin',
      scope: ['BE', 'FE'],
      notes: 'HQ concierge, done on the company record — same roles-and-users model as the CO side, gated + audited. A global Company users list exists alongside it for the two cross-company questions the record cannot answer (2026-09-09). Still NO cross-company move of an existing user.',
      mockup: 'admin-company-users',
      detail: {
        description:
          'HQ can build a company’s roles and manage its users on their behalf (support / concierge) — the same Roles builder + assigned-role model as the Company site. It is done on the COMPANY RECORD: Company detail → Users / Roles, scoped to one company.',
        behaviors: [
          'Same build-role / invite / assign-role / deactivate actions as the CO side, but performed by HQ.',
          'Break-glass: HQ can reassign Admin for a company when the sole Admin is unavailable (left / lost access) — the one recovery path the single-Admin floor needs.',
        ],
        rules: [
          'There is deliberately NO "move a user between companies" action for existing users. A user in the wrong company is fixed the boring way: deactivate the login there, and the right company invites their email fresh (or, for a brand-new sign-up, HQ places it correctly on the Sign-ups screen). One email = one login = one company at a time.',
          'HQ role/user edits are permission-gated (specific HQ roles) and written to the audit log.',
          'THERE IS NO GLOBAL "Company users" LIST (removed 2026-09-08). Every HQ action happens on the company record, which already carries seats, invite, resend/cancel, change role and disable. A second cross-company list was a second place to maintain the same data.',
          'THE GLOBAL LIST IS BACK (2026-09-09), for exactly the two questions the company record cannot answer: resolve an email address to a login WITHOUT knowing its company first, and see every disabled user in one place. Company detail → Users stays the place the work is done — it is scoped to one company you have already found — and the global list is how you find it. The two are one dataset seen at two scopes, never two models: any action offered on the list obeys the same permission gate, the same audit entry and the same single-Admin floor as the tab.',
        ],
        acceptance: [
          'HQ can resolve support cases (build a role, invite, assign role, deactivate) with every action audited.',
          'HQ can reassign a stranded company’s Admin.',
        ],
        openQuestions: [
          'Which HQ roles may edit company users / roles and use break-glass?',
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
          'The public company page on the jobseeker site: who the employer is, what it is like to work there, and every job it currently has open. It is the only place in this module where a company becomes visible to the outside world, which makes publishing it a deliberate, gated step rather than a side effect of activation. The EDITOR is open for every company — no product required: a rep fills the page during the sales conversation (“this is how you’ll look on Saramin”), and gating it on the purchase keeps the page one step behind the deal. What the products decide is only what is REQUIRED: a Job Posting customer must have a Published page before any job goes live; for everyone else the page is optional.',
        userStory:
          'As a jobseeker, I want to see who an employer is and what else they are hiring for, so that I can decide whether to apply.',
        uiFields: [
          {
            group: 'Header',
            items: [
              { name: 'logo', type: 'file (image)', required: true, notes: 'ONE master file, contain-fitted into 210×86 (sidebar) and 96×96 (job card). PNG transparent or SVG, long edge ≥400px (≥800 recommended), ≤2MB. The recognition anchor — it also appears on every job card and search result.' },
              { name: 'displayName (Tên hiển thị)', type: 'string', required: true, notes: 'asked on the COMPANY PAGE tab, not on the create form. Falls back to legalName everywhere until set.' },
              { name: 'businessDetail', type: 'text (max 80 WORDS)', notes: 'free text the company writes about what it does — the line under the name in the sidebar. A word cap, not a character cap: the counter has to mean something to the person typing.' },
              { name: 'businessForm', type: 'enum', notes: 'Mid-sized company · Large enterprise/Corporation · SME · Startup · Foreign-invested (FDI) · Joint venture · State-owned · Branch/Rep office · Non-profit/NGO. Scale + ownership character — NOT the legal form on the ĐKKD (that is `businessType` on the company record).' },
              { name: 'foundedOn', type: 'date', notes: 'a full DATE, not a year — the page derives years-in-business from it. Supersedes the earlier `foundedYear`.' },
              { name: 'employeeCount', type: 'int', notes: 'ONE exact number, not a band. The CRM size band used by list filters is DERIVED from it — storing both independently guarantees they disagree.' },
              { name: 'revenue', type: 'bigint (VND)', notes: 'latest-year revenue, plain integer in đồng. Entered raw; the UI reads it back thousand-separated so a stray zero is visible. Nullable — most SMEs will not publish it.' },
              { name: 'displayAddress', type: 'string', notes: 'the address shown publicly. Separate from the REGISTERED address on the company record, which prints on invoices.' },
              { name: 'mapsUrl', type: 'string?', notes: 'a pasted Google Maps share link. No geocoding provider: the person pasting can verify it themselves, and an empty value simply renders the address with no map.' },
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
              { name: 'benefits', type: 'Benefit[]', notes: 'the company’s GENERAL welfare — the SAME 11 fixed codes the job form uses (Master data → Benefits — the client’s `benefit` list), each with an i18n description { vi, en } stored as RICH TEXT (bold/italic + bulleted & numbered lists). VI required. One shared taxonomy is what lets a job inherit these and lets both surfaces share icons, translations and the search filter. Replaces the old 8-category `benefitCategories`' },
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
              'The page is REQUIRED for a Job Posting customer — a job cannot be published while its company page is not Published, because the job links to it. Any other company (Resume-Search-only, or not yet a customer) MAY have one, and HQ can prepare and even publish it ahead of the sale; nothing else depends on it.',
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
          'Benefit TYPES are a fixed set — companies pick from them, they do not invent them; only the description is theirs. That is what makes two company pages comparable to a jobseeker. It is the SAME 11-code list the job form uses, so a job can inherit the company’s welfare and de-duplicate against it. (The Figma company page draws 8 groups; the client’s 11 `benefit` codes supersede both that and our earlier 12-type draft — two taxonomies would make “Lương thưởng” and “Lương & thưởng” different rows.)',
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
          'Prepared but unpublished (no Job Posting product — page is optional, editor still open)',
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
            { name: 'benefits', type: 'jsonb', notes: '[{ typeKey, description: { vi, en } }] keyed by the shared 11 benefit codes (Master data → Benefits, the client’s `benefit` list) — the same taxonomy the Job entity uses, so a job can inherit them and the jobseeker search filter reads one list, not two. VI description required; EN optional and falls back to VI' },
            { name: 'headcountHistory', type: 'jsonb', notes: '[{ year, count }] — company-declared, not verified' },
            { name: 'displayName / businessDetail / businessForm', type: 'string / text / enum', notes: 'businessDetail is word-capped at 80 — validate on words, not characters, or the UI counter and the server disagree' },
            { name: 'foundedOn / employeeCount / revenue', type: 'date / int / bigint(VND)', notes: 'replaces foundedYear and the size BAND. The band stays a derived read for list filters.' },
            { name: 'displayAddress / mapsUrl', type: 'string / string?', notes: 'the public address + a pasted Maps link. The multi-office CompanyLocation book is a JOB-side concern and is no longer read by this page.' },
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
