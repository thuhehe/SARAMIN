import type { BuildModule } from './types'

/*
 * Job seeker user management — the candidate's identity, profile and exit.
 *
 * ONE account status drives every gate on the jobseeker side, and — unlike the
 * company side — a jobseeker self-registers, so the lifecycle starts unverified:
 *
 *   Pending verification ──(email link)──▶ Active ──(user withdraws)──▶ Deactivated
 *          │                                 │                              │
 *          │                                 └──(HQ blocks)──▶ Suspended    │
 *          └────────── never verified, ages out ──────────────────▶ (purge)  │
 *                                                       reactivate ─────────┘
 *
 * Social login (Facebook / Google / LinkedIn / GitHub) arrives with a verified
 * EMAIL, so it skips the email-verification wait — but it does NOT skip straight
 * to Active. It lands on a COMPLETION STEP (confirm name · add phone · accept
 * terms) because a provider cannot accept our terms and never returns a phone.
 * That asymmetry is worth remembering across every screen here.
 *
 * Two things stay strictly separate:
 *   ACCOUNT status  — can this person sign in at all (this module).
 *   CV visibility   — can employers discover them in CV search (Resume management).
 * An Active account with visibility off is a normal, common state.
 *
 * Depth mirrors ./job-management.ts.
 */

export const jobseekerUser: BuildModule = {
  id: 'jobseeker-user',
  title: 'Job seeker user management',
  owner: 'Luong',
  requirements: [
    {
      label: 'Sign up / sign in',
      table: {
        cols: ['Method', 'Verification', 'Lands on'],
        rows: [
          ['Email + password', 'Email verification required', 'Pending verification → Active'],
          ['Social — Facebook · Google · LinkedIn · GitHub', 'Email pre-verified by the provider', 'COMPLETION STEP → Active'],
        ],
      },
      items: [
        'ONE feature, two routes. Both must end with the SAME NINE fields on the record: 1 Full name · 2 Email · 3 Phone · 4 Nationality · 5 Gender · 6 Marital status · 7 Date of birth · 8 Highest education · 9 Years of work experience — plus a password (email route only) and the terms consent. The routes differ only in how the identity arrives.',
        'Highest education and years of work experience are asked HERE, not in onboarding and not on the CV, because CV search filters on both — an account without them is invisible to employers from the moment it exists. They are totals; the schools and jobs themselves go on the CV.',
        'Password reset is available for email accounts.',
        'A social sign-up is NOT finished at the OAuth callback. A provider gives us a verified email and nothing else we can rely on, so it lands on a completion step — which collects the same Basic information the email form does — and only then becomes Active.',
      ],
      warn: 'Email is the IDENTITY KEY — one account per email address. A social login on an email that already exists LINKS to that account; it never creates a second one.',
    },
    {
      label: 'Social sign-up completion step — where the social route collects Basic information',
      text: 'OAuth returns a verified email. It does not return anything else the platform can act on, which is why a social sign-up finishes on its own screen rather than dropping the candidate straight into the site. The step is the social route’s copy of the sign-up form, not a small confirmation dialog.',
      table: {
        cols: ['Field', 'Why the provider cannot settle it', 'On the completion step'],
        rows: [
          ['Terms consent', 'A provider cannot accept our terms on someone’s behalf. This ALONE makes the step mandatory — there is no legal route around it.', 'One required consent checkbox, then “Create account”'],
          ['Full name', 'What comes back is a DISPLAY name — a nickname, a handle, or the wrong capitalisation. It is the name employers will read.', 'Pre-filled, always editable'],
          ['Mobile phone', 'None of the four providers returns one, ever. In Vietnam this is the field a recruiter calls.', 'Required, with an “I live abroad” escape'],
          ['Highest education', 'No provider knows it — and CV search filters on it, so the account is undiscoverable without it.', 'Required, Master-data value'],
          ['Years of work experience', 'Same: no provider has it, and it is the other CV-search filter.', 'Required, Master-data value'],
          ['Personal details', 'Not returned by any provider. Shown on the CV, never a search facet.', 'Date of birth · nationality · gender · marital status'],
        ],
      },
      items: [
        'The login email is shown LOCKED with the provider chip — it is the identity key and cannot be changed here.',
        'Because the step is unavoidable for consent, the rest of Basic information costs nothing extra: the candidate is already stopped, so this is where the phone, personal details and Background fields are asked.',
        'It ends with the same control pair as the email form — one consent checkbox, then “Create account”. Only the consent gates the button.',
      ],
      warn: 'An account that has not passed the completion step is NOT Active — it cannot apply, and it must never be counted as a registration. Abandoning here is a drop-off to measure, not a signed-up user.',
    },
    {
      label: 'Login email vs. contact email — two fields, one identity',
      text: 'Because email is the identity key, a provider-supplied address cannot be edited: changing it would change which account it is. But the Google address someone signs in with is often not the one they want a recruiter emailing. Splitting the two keeps the identity rule intact without sending employers the wrong address.',
      table: {
        cols: ['Field', 'Editable?', 'Used for'],
        rows: [
          ['loginEmail', 'No, when provider-supplied', 'Identity + sign-in. Shown read-only with the provider named ("🔒 Google").'],
          ['contactEmail', 'Always', 'What employers see. Defaults to loginEmail, and is what an application delivers.'],
        ],
      },
      warn: 'The identity key is loginEmail. Employer-facing surfaces — applications, unlocked CVs, notifications to employers — must read contactEmail. Reading loginEmail there is how a candidate ends up unreachable at the address they chose.',
    },
    {
      label: 'Account status model',
      table: {
        cols: ['Status', 'Means', 'Reversible?', 'Rule'],
        rows: [
          ['Pending verification', 'Signed up, email not confirmed — cannot apply', 'Yes, by verifying', 'Can sign in and browse, but cannot apply or be discovered in CV search'],
          ['Active', 'Verified, full use', '—', 'Full use of the site. An email sign-up reaches it by verifying; a social sign-up reaches it by finishing the completion step'],
          ['Suspended', 'Blocked by HQ — a reason is required', 'Yes, by HQ', 'Sign-in is refused with a support contact, never the reason text'],
          ['Deactivated', 'Withdrawn by the user', 'Yes, on sign-in within the grace window', 'Reinstate returns to the previous status, not blindly Active'],
        ],
      },
      items: ['An unverified account can BROWSE jobs but cannot APPLY — verification gates writing, not reading.'],
    },
    {
      label: 'Deactivation is a withdrawal, not a deletion',
      items: [
        'Applications already sent to employers stay with those employers.',
        'The CV is removed from CV search immediately.',
        'Personal data is retained only for the legally required period — retention period TO CONFIRM.',
      ],
    },
    {
      label: 'Independence: account status vs CV visibility',
      text: 'An Active account whose CV is hidden from employers is a NORMAL state, not an error (see Resume management).',
    },
    {
      label: 'What HQ can and cannot do',
      table: {
        cols: ['HQ can', 'HQ cannot'],
        rows: [
          ['Search accounts, view detail', 'See or set a password, ever'],
          ['Suspend / reinstate (with a reason)', 'Read any credential'],
          ['Trigger a password reset', '—'],
        ],
      },
      warn: 'Opening a jobseeker’s CV or contact details from Admin is a PII action and is always audited.',
    },
    {
      label: 'Jobseeker surfaces',
      text: 'My page — profile info, avatar, contact, job preferences, profile completeness. Deactivate (withdraw) with a confirm step.',
    },
    {
      label: 'Full name — one field, no first/last split',
      text: 'A jobseeker’s name is stored and captured in a SINGLE "Full name" field, the same platform-wide standard as HQ staff and company (employer) users.',
      warn: 'Do NOT split any person’s name into first name / last name anywhere. One field: Full name.',
    },
  ],
  features: [
    // 0 · Sign up — ONE feature, two routes ───────────────────────────────────
    // Deliberately not split into "email sign-up" and "social sign-up": the two
    // routes differ only in how the identity arrives. Both must end with the SAME
    // Basic information on the record, which is the whole point of the screen —
    // so specifying them apart is what let the social route quietly collect less.
    {
      name: 'Sign up',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      mockup: 'js-signup',
      // Two screens, one requirement: the entry screen and the step that finishes a
      // social sign-up. The completion step is where the social route collects the
      // same fields the email form does, so it has to be reviewable right here.
      mockups: ['js-signup-social'],
      notes: 'Email + password OR a social provider. Either way the account ends up with the same NINE fields — including highest education and years of work experience. Sign-in, verification and password reset live here too.',
      detail: {
        keyPoints: [
          {
            vi: 'Màn hình đăng ký gom đúng **9 field**: **1** Họ và tên (một ô duy nhất) · **2** Email · **3** Số điện thoại · **4** Quốc tịch · **5** Giới tính · **6** Tình trạng hôn nhân · **7** Ngày sinh · **8** Trình độ học vấn cao nhất · **9** Số năm kinh nghiệm. Cả 9 đều bắt buộc, và biểu mẫu cũng dừng lại ở đó — kèm theo là mật khẩu (chỉ ở lối email) và ô xác nhận đồng ý điều khoản.',
            en: 'Sign-up gathers exactly **9 fields**: **1** Full name (a single field) · **2** Email · **3** Phone · **4** Nationality · **5** Gender · **6** Marital status · **7** Date of birth · **8** Highest education · **9** Years of work experience. All nine are required and the form stops there — alongside them sit a password (email route only) and the terms consent.',
          },
          {
            vi: '**Trình độ học vấn** và **số năm kinh nghiệm** là hai câu trả lời đáng giá nhất ở bước này: nhà tuyển dụng lọc CV theo đúng hai tiêu chí đó, nên hỏi ngay khi đăng ký giúp ứng viên có thể được tìm thấy ngay từ ngày đầu. Ở đây chỉ cần con số tổng — trường học và từng công ty sẽ được kể chi tiết trong CV.',
            en: '**Highest education** and **years of work experience** are the two most valuable answers on this screen: they are exactly what employers filter CVs by, so asking at sign-up lets a candidate be found from day one. Totals are enough here — the schools and the individual jobs tell their story on the CV.',
          },
          {
            vi: 'Hai lối vào, một bộ dữ liệu: form email và bước hoàn tất sau social login cùng hỏi một bộ field như nhau, chỉ khác ở cách danh tính đến (người dùng tự nhập rồi xác thực email, hoặc provider cung cấp sẵn và được khoá lại). Dùng chung một validator cho cả hai là cách gọn nhất để hai lối luôn thu về đủ như nhau.',
            en: 'Two doors, one data set: the email form and the post-social completion step ask for the same fields — only the identity arrives differently (typed then verified, or supplied by the provider and locked). Sharing one validator between them is the simplest way to keep both doors collecting the same set.',
          },
          {
            vi: 'Quay về từ provider vẫn chưa phải là đăng ký xong: OAuth chỉ xác thực email, không thể đồng ý điều khoản thay người dùng, và cũng không mang theo số điện thoại, học vấn hay kinh nghiệm. Đó là lý do có bước hoàn tất — tài khoản được tính là một lượt đăng ký khi bước này được gửi đi.',
            en: 'Coming back from the provider is not yet a finished sign-up: OAuth verifies an email, but it cannot accept the terms on someone’s behalf and carries no phone, education or experience. That is what the completion step is for — the account counts as a registration once that step is submitted.',
          },
          {
            vi: 'Email là khoá danh tính: mỗi địa chỉ một tài khoản. Khi ai đó dùng social login với email đã có sẵn, provider được liên kết vào tài khoản cũ thay vì mở thêm một tài khoản mới.',
            en: 'Email is the identity key: one account per address. When someone signs in socially with an email we already know, the provider is linked to the existing account rather than opening a second one.',
          },
        ],
        // One sentence on purpose. The nine fields, the two routes and the
        // completion step are all spelled out in Key points and the table below —
        // an overview that repeats them is a paragraph nobody needs to read twice.
        description:
          'The jobseeker’s way in: one form with two routes — email + password, or a social provider — collecting the nine fields every account starts with, including highest education and years of work experience.',
        userStory:
          'As a jobseeker, I want to sign up in one short form — with my email or an account I already have — so that I am immediately findable by recruiters without having built a CV yet.',
        uiFields: [
          {
            // The nine. Both routes must produce all of them; only the WHERE differs.
            group: 'The 9 fields — collected on BOTH routes',
            items: [
              { name: '1 · fullName', type: 'string', required: true, notes: 'ONE field, no first/last split. Typed on the email route; pre-filled but always editable on the social route' },
              { name: '2 · email', type: 'email', required: true, notes: 'the identity key — unique, lower-cased. Typed + verified by link (email route) or supplied by the provider and locked (social route)' },
              { name: '3 · phone', type: 'string (+84)', required: true, notes: 'in Vietnam this is the field a recruiter calls. No provider ever returns one, which is why the social route must ask' },
              { name: '4 · nationality', type: 'enum', required: true, notes: 'Người Việt Nam / Người nước ngoài — picking “Người nước ngoài” opens the work-permit follow-up' },
              { name: '5 · gender', type: 'enum', required: true, notes: 'shown on the CV; never a search facet' },
              { name: '6 · maritalStatus', type: 'enum', required: true, notes: 'shown on the CV; never a search facet' },
              { name: '7 · dateOfBirth', type: 'date', required: true, notes: 'DD/MM/YYYY. Shown on the CV as age; never a search facet' },
              { name: '8 · highestEducation', type: 'enum', required: true, notes: 'from Master data. A TOTAL, not history — the schools go on the CV. Employers FILTER on it, so it cannot wait for the CV' },
              { name: '9 · yearsOfExperience', type: 'enum', required: true, notes: 'from Master data. Also a total — the jobs go on the CV. Also a CV-search filter, so it is asked the moment the account exists' },
            ],
          },
          {
            // Not part of the nine: a credential and a consent, not profile data.
            group: 'Alongside the nine — a credential and a consent',
            items: [
              { name: 'termsAccepted', type: 'checkbox', required: true, notes: 'T&C + privacy policy, version stored against the account. A provider cannot consent on someone’s behalf, so it is asked on both routes' },
              { name: 'password', type: 'password', required: true, notes: 'EMAIL ROUTE ONLY — a social account has none. Live rule checklist (12+ chars · 1 number · 1 symbol · 1 uppercase); never silently truncated' },
            ],
          },
          {
            group: 'Email route — verification & reset',
            items: [
              { name: 'verification email', type: 'email + token', required: true, notes: 'single-use link, expires in 24h, resend with a 60s cooldown' },
              { name: 'reset email', type: 'email + token', notes: 'single-use, expires in 1h; using it invalidates existing sessions' },
            ],
          },
          {
            group: 'Social route — the completion step (2nd screen below)',
            items: [
              { name: 'social buttons', type: 'oauth', notes: 'on the entry screen, above the email form. The mockup draws Google + Facebook; whether LinkedIn and GitHub ship in Phase-1 is the open question below' },
              { name: 'loginEmail (locked)', type: 'derived (read-only)', required: true, notes: 'from the provider, shown read-only with the provider chip — it is the identity key and cannot change here' },
              { name: 'fullName (pre-filled)', type: 'string', required: true, notes: 'a provider display name is often a nickname or wrongly capitalised — and it is what employers read, so it stays editable' },
              { name: 'phone (empty)', type: 'string (+84)', required: true, notes: 'always blank — includes an "I live abroad — I don’t have a Vietnamese number" escape' },
              { name: 'personalDetails + Background', type: 'group', required: true, notes: 'the SAME two groups the email form renders, including highest education and years of experience — this is why the step is a full screen, not a confirmation modal' },
              { name: 'termsAccepted + Create account', type: 'checkbox + button', required: true, notes: 'one consent line, then the same “Create account” submit as the email form — the two screens deliberately end identically' },
            ],
          },
          {
            group: 'Sign in / reset',
            items: [
              { name: 'email / password', type: 'email / password', required: true },
              { name: 'rememberMe', type: 'checkbox', notes: 'longer refresh-token lifetime; off by default on shared devices' },
              { name: 'forgot password', type: 'link', notes: 'starts the reset flow; on a social-only account it offers to SET a password' },
              { name: 'error', type: 'message', notes: 'one generic "email or password is incorrect" — never reveals whether the email exists' },
            ],
          },
        ],
        sections: [
          {
            heading: 'The 9 fields — what sign-up collects, and where each route collects it',
            early: true,
            text: 'Exactly nine, the same nine on the record either way. Read this table as the definition of the feature: the two routes are two doors into one form. Every field is required — the screens carry an asterisk on each label rather than a blanket "all fields required" note.',
            table: {
              cols: ['#', 'Field', 'Email route — the sign-up form', 'Social route — the completion step', 'Why it is asked at sign-up'],
              rows: [
                ['1', 'Full name', 'Typed — one field, no first/last split', 'Pre-filled by the provider, always editable', 'The name employers read — a provider display name is often a nickname'],
                ['2', 'Email', 'Typed, then verified by an emailed link', 'From the provider: shown locked with the provider chip', 'The identity key — one account per email address'],
                ['3', 'Phone', 'Required, +84 country picker', 'Required, +84 picker + “I live abroad” escape', 'No provider returns one, and in VN a recruiter calls before emailing'],
                ['4', 'Nationality', 'Người Việt Nam / Người nước ngoài', 'The same picker', 'Choosing “Người nước ngoài” opens the work-permit follow-up'],
                ['5', 'Gender', 'Select', 'Select', 'Shown on the CV, never a search facet'],
                ['6', 'Marital status', 'Select', 'Select', 'Shown on the CV, never a search facet'],
                ['7', 'Date of birth', 'DD/MM/YYYY', 'DD/MM/YYYY', 'Shown on the CV as age, never a search facet'],
                ['8', 'Highest education', 'Background group — select from Master data', 'The same Background group', 'Employers filter on it in CV search, so a brand-new account needs it to be findable'],
                ['9', 'Years of work experience', 'Background group — select from Master data', 'The same Background group', 'The other CV-search filter, so it cannot wait for the CV to be built'],
              ],
            },
            items: [
              'Two more things travel with the nine without being profile fields: a **password** (email route only — a social account has none) and the **terms & privacy consent** (a checkbox on both routes, stored with its version).',
              'Fields 8 and 9 are totals, not history: the schools and the individual jobs are told in full on the CV. The totals are what make a brand-new account discoverable.',
              'Nothing beyond the nine is asked here — work preference belongs to onboarding, career content to the CV. One group per step.',
              '→ Next: ONBOARDING — Work preference (this module) → CREATE CV (Resume management) → Apply (Application management).',
            ],
          },
          {
            heading: 'Status after sign-up — the two routes do not land in the same place',
            table: {
              cols: ['Route', 'Right after submit', 'Reaches Active when', 'Verification email'],
              rows: [
                ['Email + password', 'Pending verification — can browse, cannot apply', 'The emailed link is clicked', 'Sent immediately'],
                ['Social provider', 'Not a registration at all until the step is submitted (signupCompletedAt is null)', 'The completion step is submitted', 'None — the provider already verified the address'],
              ],
            },
            items: [
              'An abandoned completion step is a DROP-OFF to measure, not a signed-up user: it must never be counted as a registration.',
              'Suspended (blocked by HQ) and Deactivated (withdrawn) are the other two statuses — see the module’s account status model.',
            ],
          },
          {
            heading: 'FLOW — email + password',
            items: [
              '1. Jobseeker opens Sign up (header button, or from a job when they try to apply).',
              '2. Fills ONE form: Full name · Email · Password (live rule checklist) · Phone · Personal details · Background (highest education, years of work experience) · accept Terms & Privacy.',
              '3. "Create account" → the account is created as Pending verification and a verification email is sent.',
              '4. They continue straight into ONBOARDING — verification never blocks browsing or finishing the profile.',
              '5. Clicking the emailed link sets the account Active. Applying is blocked until it is.',
            ],
          },
          {
            heading: 'FLOW — social provider',
            items: [
              '1. Jobseeker opens Sign up and picks a provider (Google · Facebook · LinkedIn · GitHub).',
              '2. OAuth runs at the provider and returns a VERIFIED email.',
              '3. If that email already has an account → the provider is LINKED and they are signed in. A social login never creates a second account on an existing email.',
              '4. Otherwise the COMPLETION STEP opens: locked email · editable full name · empty phone · personal details · Background (highest education, years of experience) · accept terms.',
              '5. Submitting it creates the account as Active — no verification email, because the provider already verified the address.',
              '6. Continue into ONBOARDING, exactly as the email route does.',
            ],
          },
          {
            heading: 'Social login — linking, not duplicating',
            items: [
              'If the provider does not release an email (a real case with some Facebook and GitHub accounts), we cannot key the identity: ask for an email and verify it before creating the account.',
              'An account created socially has no password. "Forgot password" on it offers to set one — that is how a social-only user gains an email login.',
              'Linked providers are listed in My page; any one can be unlinked as long as one login method remains.',
              'The provider email is immutable. A candidate who wants employers to use a different address changes contactEmail, not the login email.',
            ],
          },
        ],
        behaviors: [
          'One entry screen for both routes: the provider buttons sit above the email form, so the choice is made before anything is typed.',
          'Nationality is a two-option picker (Người Việt Nam / Người nước ngoài); choosing “Người nước ngoài” asks the work-permit follow-up questions.',
          'Both screens end with the same control pair — one consent checkbox, then “Create account”. The consent gates the button; nothing else on either screen does.',
          'Sign-up sends the verification email immediately and lands the user on the site with a persistent "confirm your email" banner — never on a dead-end "check your inbox" page.',
          'Tapping the verification link sets Active, signs the user in and returns them to whatever they were doing (the job they wanted to apply to, if any).',
          'The completion step cannot be skipped or dismissed — leaving it means the account is never created as a registration.',
          'Attempting to apply while Pending opens the verification prompt rather than a bare error.',
          'A guest who tries to apply is brought here and returned to the apply screen with the job kept (see Application management → Apply flow).',
          'Password reset always reports "if that email exists we have sent a link", so the form cannot be used to enumerate accounts.',
          'Completing a reset invalidates every other session — the standard assumption is that the old password is compromised.',
          'Repeated failed sign-ins are rate-limited per email and per IP, with a lockout window rather than a permanent block.',
          'Signing in to a Deactivated account inside the grace window offers "reactivate your account" instead of refusing.',
        ],
        rules: [
          'BOTH routes must collect all nine fields, including highest education and years of work experience — a route that collects eight is incomplete, not lighter.',
          'Highest education and years of experience are single-value totals from Master data, never free text, because they are search facets.',
          'One account per email address. Uniqueness is enforced in the DB on a lower-cased email, not just in the form.',
          'A social login on an existing email links to that account; it never creates a second one.',
          'A social sign-up is NOT a registration until the completion step is submitted — an abandoned completion leaves an unusable account.',
          'Verification is required before applying, and it gates writes only — browsing stays open.',
          'Passwords are stored only as a salted hash (bcrypt / argon2). No plaintext, no reversible encryption, and no password is ever emailed.',
          'Verification tokens are single-use and expire (24h verify, 1h reset); a used or expired token offers a clean resend path.',
          'A Suspended account cannot sign in, and the reason is never shown to the user.',
          'The accepted T&C version is stored with the account, because it is what we can later prove.',
          'Sign-in must not reveal whether an email exists — the same message for a wrong password and an unknown email.',
        ],
        states: [
          'Entry screen (providers + email form)',
          'Validation errors',
          'Email already registered (offer sign-in / reset)',
          'OAuth in progress',
          'Completion step (empty phone)',
          'Completion step abandoned (account not created)',
          'Existing email → signed in instead',
          'Provider released no email (blocked)',
          'Pending verification (banner)',
          'Verification link expired / already used',
          'Active',
          'Wrong credentials',
          'Rate-limited / locked out',
          'Suspended (blocked message)',
          'Deactivated (reactivate offer)',
        ],
        backend: {
          dataModel: [
            { name: 'jobseekerId', type: 'uuid', required: true },
            { name: 'loginEmail', type: 'string', required: true, notes: 'UNIQUE, lower-cased — the identity key' },
            { name: 'passwordHash', type: 'string?', notes: 'null for social-only accounts' },
            { name: 'fullName', type: 'string', required: true, notes: 'one field — never split' },
            { name: 'phone', type: 'string', required: true, notes: 'collected on both routes; blank only for the "I live abroad" case' },
            { name: 'highestEducation / yearsOfExperience', type: 'enum / enum', required: true, notes: 'Master-data values, set at sign-up on BOTH routes — the two CV-search facets a new account must already have' },
            { name: 'dateOfBirth / nationality / gender / maritalStatus', type: 'date / enum / enum / enum', notes: 'personal details — displayed on the CV, never queryable' },
            { name: 'status', type: 'enum', required: true, notes: 'pending_verification|active|suspended|deactivated' },
            { name: 'emailVerifiedAt', type: 'timestamp?', notes: 'set by the link, or immediately on the social route' },
            { name: 'signupCompletedAt', type: 'timestamp?', notes: 'social accounts only — null until the completion step is submitted. Null here means NOT a registration' },
            { name: 'SocialIdentity', type: 'entity', notes: 'jobseekerId, provider(facebook|google|linkedin|github), providerUserId, linkedAt — UNIQUE (provider, providerUserId)' },
            { name: 'VerificationToken', type: 'entity', notes: 'token hash, purpose(verify|reset), expiresAt, usedAt — single-use' },
            { name: 'termsVersion / termsAcceptedAt', type: 'string / timestamp' },
            { name: 'lastLoginAt / failedAttempts / lockedUntil', type: 'timestamp / int / timestamp?' },
          ],
          endpoints: [
            'POST /auth/signup { fullName, email, password, phone, nationality, gender, maritalStatus, dateOfBirth, highestEducation, yearsOfExperience, termsAccepted }',
            'POST /auth/social/:provider/callback → { needsCompletion: true, prefill } | signs in to the linked account',
            'POST /auth/social/:provider/complete { fullName, phone, nationality, gender, maritalStatus, dateOfBirth, highestEducation, yearsOfExperience, termsAccepted } → Active (email comes from the provider, never from the body)',
            'POST /auth/login { email, password }',
            'POST /auth/verify { token }',
            'POST /auth/verify/resend',
            'POST /auth/password/forgot { email }',
            'POST /auth/password/reset { token, password }',
            'POST /auth/logout',
          ],
          integrations: [
            'Facebook Login · Google · LinkedIn · GitHub OAuth',
            'Master data (education levels, experience bands, nationality)',
            'Transactional email (verification, reset)',
            'Rate limiting / abuse protection',
          ],
          notes:
            'Validate the Basic-information set in ONE shared validator used by both the /signup and /social/:provider/complete handlers — two separate validators is exactly how the social route drifts into collecting less. Store social identities in their own table so one account can carry several providers. Keep token hashes, not tokens. The lower-cased unique index on email is what actually prevents the duplicate-account class of bug; form validation alone will not.',
        },
        acceptance: [
          'After either route, the account holds all nine fields — full name, email, phone, nationality, gender, marital status, date of birth, highest education, years of work experience — plus a recorded terms acceptance.',
          'Every field on both screens is required — a submit with any of them empty is refused, with the error against the field.',
          'A social sign-up cannot be completed without highest education and years of experience — the same two fields the email form requires.',
          'A brand-new account, with no CV yet, is already filterable in CV search by education level and experience band.',
          'A new email/password sign-up lands on Pending verification and cannot apply until verified.',
          'Abandoning the completion step leaves no registration — the account is not Active and is not counted.',
          'Clicking the verification link sets Active and returns the user to where they left off.',
          'A social sign-in on an email that already has an account signs into that account and does not create a second one.',
          'Signing up with an existing email offers sign-in or reset rather than creating a duplicate.',
          'A completed password reset invalidates other sessions.',
          'Neither sign-in nor password reset reveals whether an email is registered.',
          'A Suspended account cannot sign in and sees a support message with no internal reason.',
        ],
        openQuestions: [
          'Which providers ship in Phase-1? The screens draw Google + Facebook; LinkedIn and GitHub are named in the module requirement but not yet drawn.',
          'What do the work-permit follow-up questions ask, for a candidate who picks “Người nước ngoài”? The screen opens the branch but the fields are not specified.',
          'What happens when a provider releases no email at all (some Facebook accounts) — support it with a typed email, or drop that provider?',
          '[C5] Do we need phone / OTP sign-in for the Vietnamese market, where phone is often the primary identity?',
          'Is 2FA in scope for jobseekers in Phase-1, or employer-side only?',
          'How long may an unverified account live before it is purged?',
          'Session lifetime and "remember me" duration — what do we commit to?',
        ],
      },
    },

    // 0c · Onboarding ─────────────────────────────────────────────────────────
    {
      name: 'Onboarding',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-onboarding',
      notes: 'The 3-step wizard that collects WORK PREFERENCE. Basic information is already collected at sign-up.',
      detail: {
        description:
          'Straight after an account is created, a short guided wizard collects WORK PREFERENCE — the Saramin-KR pattern, deliberately NOT a VietnamWorks-style long form. THREE topic-grouped steps, each framed with a live job-count carrot, ending on a page of MATCHED JOBS that leads into creating a CV. Every field here is a Work-preference field (group 2 — see Resume management → Candidate data). Basic information was already taken at sign-up, and CV content comes from the CV: the wizard asks nothing from either.',
        userStory:
          'As a new jobseeker, I want to answer a few quick questions and immediately see jobs that match, so that I know the site is worth my time before I invest in a CV.',
        requirements: [
          {
            label: 'The six fields this wizard writes — and nothing else',
            text: 'The wizard has three steps: step 1 asks what kind of work, step 2 asks where and how, step 3 asks the expected salary. Between them they collect these six fields and no others — the screen and this table must always agree, and a field that appears in one but not the other is the mistake this table exists to catch.',
            table: {
              cols: ['Step', 'Field', 'How the candidate enters it', 'How many they may pick'],
              rows: [
                ['Step 1', 'Desired job category', 'Dropdown, from the Category master data', 'Exactly one — it is picked first because it narrows the job-role list below it'],
                ['Step 1', 'Desired job role', 'Text box with suggestions, from the Job-title master data', 'Exactly one'],
                ['Step 1', 'Desired industry', 'Dropdown, more than one allowed, from the Industry master data', 'Up to 3'],
                ['Step 2', 'Desired work location', 'Dropdown the candidate types into to search, more than one allowed — province / city', 'Up to 3'],
                ['Step 2', 'Desired work type', 'Chips: in office · remote · hybrid · oversea', 'Up to 3 of the 4 — or none at all'],
                ['Step 3', 'Expected salary', 'One amount, typed. It is always a monthly VND figure, so "triệu / tháng" is printed beside the box rather than being a control the candidate sets', 'One amount only, never a from–to range'],
              ],
            },
            items: [
              'Desired job role is the field recruiters search on most, which is why it sits on the very first step.',
              'The four fields drawn from master data are dropdowns or type-to-search lists, never a grid of chips: the real lists are far longer than any screen (34 provincial units, roughly 30 industries, hundreds of job titles), so a grid would either hide most of the options or scroll forever. Desired work type is the one exception — it has only four values, so all of them can be shown at once.',
              'Whatever the candidate picks stays visible as removable chips underneath the field, so they can see what they chose without reopening the list.',
              'Desired work type is capped at 3 of its 4 values, which needs the reason stated or someone will “fix” it: selecting all four matches exactly the same jobs as selecting none, so the fourth pick adds nothing. Capping at 3 keeps every selection meaningful and sends the “anything goes” answer to the control that already means it — leaving them all off. It also matches the ≤3 cap on desired industry and desired work location, so all three multi-selects read the same.',
              'Leaving desired work type empty does NOT narrow anything — it simply rules nothing out, so the candidate still sees every kind of job.',
            ],
            warn: 'ONE GROUP PER STEP is what keeps this wizard short: sign-up takes Basic information, this wizard takes Work preference, the CV carries work history, education detail and skills. Years of experience and highest education are Basic information and were ALREADY taken at registration — do not re-add them here.',
          },
        ],
        uiFields: [
          {
            group: 'Step 1 · What kind of work are you looking for?',
            items: [
              { name: 'desiredJobCategory', type: 'select → Category taxonomy', notes: 'picked FIRST because it narrows the role suggestions below it' },
              { name: 'desiredJobRole', type: 'text → Title taxonomy', notes: 'the #1 recruiter filter; suggestions come from the chosen category' },
              { name: 'desiredIndustry', type: 'multi-select (≤3)', notes: 'the COMPANY’s sector — a different axis from category (a designer can work in Banking or FMCG)' },
            ],
          },
          {
            group: 'Step 2 · Where and how would you like to work?',
            items: [
              { name: 'desiredWorkLocation', type: 'multi-select (≤3)', notes: 'province / city level' },
              { name: 'desiredWorkType', type: 'multi-select', notes: 'in office · remote · hybrid · oversea — the same `job_type` master the job side uses. A SEPARATE axis from location: it is what lets someone say "I live in HCMC and want remote". Leaving all off rules nothing out' },
            ],
          },
          {
            group: 'Step 3 · What salary are you expecting?',
            items: [
              { name: 'expectedSalary', type: 'ONE figure — stored in `min`', notes: 'CANONICAL RULES: Resume management → "★ SALARY — the one contract". A SINGLE figure ("Từ 20 triệu"), never a range: the employer searches by a BAND and a CV matches when this figure falls INSIDE it (point-in-range, not two ranges overlapping — there is no second candidate number to overlap with). Stored as { kind, currency, min, max } with max NULL, so the shape still works if a range is ever wanted. The most-requested employer filter, and the one thing no CV ever supplies' },
              { name: 'period + currency', type: 'fixed — MONTHLY / VND', notes: 'ONBOARDING ONLY, client direction: this step has NO period or currency control. The figure is always monthly VND and the screen prints "triệu / tháng" beside the box. `kind` and `currency` are still stored (MONTHLY, VND) so the record matches every other surface — see the open question about where a USD or annual expectation is then entered' },
              { name: 'negotiable — "Thỏa thuận"', type: 'NOT on this step', notes: 'CUT from onboarding on client direction. "Thỏa thuận" remains a valid stored value (`kind = INTERVIEW`) that PASSES an employer salary bound rather than being dropped by it — a candidate who wants it must set it elsewhere (My page / CV quick-edit). Do not re-add it here without asking' },
            ],
          },
        ],
        sections: [
          {
            heading: 'FLOW — onboarding',
            items: [
              '1. Account created (email or social), with Basic information already captured on the registration form → the wizard opens automatically at step 1 of 3.',
              '2. Step 1 · what work — desired job category → desired job role → desired industry.',
              '3. Step 2 · where and how — desired work location (up to 3) + desired work type.',
              '4. Step 3 · the ask — expected salary.',
              '5. RESULTS — a full page of matched jobs ("We found the best job postings based on the information you entered"), each saveable.',
              '6. "Complete your CV and go apply →" leads to My CVs, where the candidate uploads a PDF or builds a Saramin CV.',
              '→ Next: Create CV (Resume management).',
            ],
          },
          {
            heading: 'Design principles — why it is short',
            items: [
              'Motivate with carrots, not required-asterisks: every step shows the payoff ("✨ 12,231 jobs match so far"), the Saramin-KR pattern.',
              'Topic-grouped, never one field per screen: category/role/industry answer ONE question, so they share a screen.',
              'Nothing here is asked twice — and the rule that keeps it that way is ONE GROUP PER STEP: sign up takes Basic information, this wizard takes Work preference, the CV carries work history, education detail and skills. Years of experience and highest education are NOT asked here; they are Basic information and were taken at registration.',
              'Skippable — nothing in onboarding blocks browsing or applying; an incomplete profile is a normal state.',
            ],
          },
        ],
        rules: [
          'Onboarding collects WORK PREFERENCE only (group 2). Basic information belongs to the sign-up form and CV content to the CV — neither is ever asked here.',
          'Every profile field is collected at sign-up (Basic information) or in this wizard (Work preference) — there is no separate "fill in your profile later" form.',
          'The wizard is skippable at any step; the profile is simply less complete, which lowers search ranking but blocks nothing.',
          'The final step must show matched jobs before asking for a CV — proving value precedes asking for effort.',
        ],
        states: ['Step 1–3', 'Skipped step', 'Results — matched jobs', 'Results — no matches yet (broaden suggestions)'],
        backend: {
          dataModel: [
            { name: 'Profile (Work preference)', type: 'entity', notes: 'desiredJobCategory · desiredJobRole · desiredIndustry[] · desiredWorkLocation[] · desiredWorkType[] · expectedSalary — the six fields this wizard writes, and the whole of what it writes' },
            { name: 'Profile (Basic information)', type: 'entity', notes: 'READ-ONLY to this wizard — all nine fields are written by the sign-up form. Nothing here updates them' },
            { name: 'onboardingCompletedAt', type: 'timestamp?', notes: 'null while skipped — drives the "finish your profile" nudge' },
          ],
          endpoints: ['PATCH /jobseeker/profile — one call per step (autosave, so a drop-off keeps what was answered)', 'GET /jobs/match-count?… — the live carrot count', 'GET /jobs/matches — the results page'],
          integrations: ['Job / Title / Category / Industry taxonomies', 'Job matching (the count + the results list)'],
        },
        acceptance: [
          'A new account lands in the wizard automatically after sign-up.',
          'All six Work-preference fields are collected across the three steps, and the wizard asks for no Basic-information field.',
          'The job-count carrot updates between steps.',
          'The last step shows matched jobs and routes to My CVs.',
          'Skipping any step still creates a usable account and profile.',
        ],
        openQuestions: [
          'Are the match counts real (a live query) in Phase-1, or an approximation?',
          'Do we re-prompt the wizard later if it was skipped, and after how long?',
          'CONFLICT TO SETTLE — onboarding step 3 now has no currency picker (monthly VND only), but Resume management → "★ SALARY — the one contract" states the candidate control is "Từ [n] [period] [currency]" and Job management → "SALARY CURRENCY (decided 2026-08-13)" decided VND + USD precisely so the IT / FDI segment does not leave salary blank. Where does a candidate who thinks in USD, or in an annual figure, enter it — My page only? If the answer is "nowhere", the two-currency decision needs revisiting rather than quietly differing per screen.',
          'Same for "Thỏa thuận": it is cut from this step but remains a valid stored value that passes employer salary filters. Which screen lets a candidate choose it, now that onboarding does not?',
        ],
      },
    },

    // 1 · HQ oversight ────────────────────────────────────────────────────────
    {
      name: 'User management',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-jobseekers',
      detail: {
        description:
          'HQ’s jobseeker account list: search, open a detail view, and activate or deactivate. It exists for support ("I cannot sign in"), for trust & safety (block a fake or abusive account) and for quality checks on the candidate pool. It is deliberately narrow — HQ manages ACCESS, not the candidate’s content, and never handles a password.',
        userStory:
          'As an HQ operator, I want to find a jobseeker account and change its status, so that I can resolve support requests and remove abusive accounts without touching their personal data.',
        uiFields: [
          {
            group: 'List & filters',
            items: [
              { name: 'search', type: 'string', notes: 'name / email / phone — email is the reliable key' },
              { name: 'status', type: 'enum', notes: 'Pending verification · Active · Suspended · Deactivated' },
              { name: 'signupMethod', type: 'enum', notes: 'Email · Facebook · Google · LinkedIn · GitHub — useful when a provider misbehaves' },
              { name: 'hasCV / visibility', type: 'bool / enum', notes: 'quality signal for the candidate pool; visibility is the candidate’s consent, read-only here' },
              { name: 'registeredAt / lastLoginAt range', type: 'date range', notes: 'find dormant or newly created accounts' },
              { name: 'row', type: 'composite', notes: 'name · masked email · status badge · signup method · CVs · applications · registered · last login' },
            ],
          },
          {
            group: 'Detail',
            items: [
              { name: 'profile summary', type: 'read-only', notes: 'name, masked contact, location, current role — unmasking contact is audited' },
              { name: 'status + reason', type: 'enum + text', required: true, notes: 'reason is mandatory when suspending' },
              { name: 'linked providers', type: 'list', notes: 'which social identities are attached to this account' },
              { name: 'CVs', type: 'list', notes: 'count + last updated; opening a CV is a PII action and is audited' },
              { name: 'applications', type: 'list', notes: 'read-only — the jobs applied to and each stage (see Application management)' },
              { name: 'activity', type: 'timeline', notes: 'sign-ups, verification, status changes, password resets, PII access by staff' },
              { name: 'actions', type: 'buttons', notes: 'Suspend · Reinstate · Resend verification · Send password reset — never "view password", never "set password"' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — and what HQ may do with each',
            items: [
              'Pending verification — HQ can resend the verification email. This is the single most common support request and needs no other power.',
              'Active — HQ can Suspend (reason required) or trigger a password reset email.',
              'Suspended — HQ can Reinstate, which returns the account to whatever it was before (Active or Pending verification, not blindly Active).',
              'Deactivated — set by the user, not by HQ. HQ can see it and, on a support request, reactivate within the grace window; both are logged.',
              'HQ cannot set a password, read a password, or change a candidate’s CV or profile content. Access only.',
            ],
          },
        ],
        behaviors: [
          'Search is the primary interaction — this list is used to find one specific person, not to browse.',
          'Suspending asks for a reason and takes effect on the next request: existing sessions are invalidated immediately, not at expiry.',
          'Reinstating restores the previous status rather than forcing Active, so an unverified account stays unverified.',
          '"Send password reset" emails the user a link; the operator never sees or sets the password.',
          'Contact details are masked in both the list and the detail; unmasking is a deliberate per-record action that writes an audit entry.',
          'Opening a CV opens a viewer and is audited with the operator, the candidate and the timestamp.',
          'Every status change appears on the account timeline with the actor, the timestamp and the reason.',
          'Export is available but audited, because the export carries PII.',
        ],
        rules: [
          'A reason is mandatory to suspend and is internal — it is never shown to the user.',
          'HQ can change status only. Profile content, CVs and visibility consent belong to the candidate.',
          'HQ never sets or views a password; the only credential action is triggering a reset email.',
          'Deactivation is the user’s action; HQ reactivating an account requires the user’s request and is logged as such.',
          'Suspending invalidates active sessions immediately.',
          'Every PII access (unmask, CV open, export) is written to the audit log — see Admin & access → Audit log.',
          'Which operators can suspend an account is a permission, not a convention (see Admin roles & operators).',
        ],
        states: [
          'Loading',
          'Empty (no accounts)',
          'Filtered-empty',
          'Search result',
          'Detail open',
          'Suspend confirm (reason required)',
          'Reinstate confirm',
          'PII unmasked (audited)',
          'CV viewer open (audited)',
          'Read-only (insufficient permission)',
        ],
        backend: {
          dataModel: [
            { name: 'status / statusReason', type: 'enum / text?', notes: 'reason required for suspended' },
            { name: 'statusChangedBy / statusChangedAt', type: 'uuid / timestamp' },
            { name: 'previousStatus', type: 'enum?', notes: 'what Reinstate restores — so an unverified account is not silently promoted' },
            { name: 'AccountStatusLog', type: 'entity', notes: 'jobseekerId, from, to, reason, actorId, at' },
            { name: 'PiiAccessLog', type: 'entity', notes: 'actorId, jobseekerId, action(reveal_contact|view_cv|export), at' },
          ],
          endpoints: [
            'GET /admin/jobseekers?q=&status=&method=&from=&to=&page=',
            'GET /admin/jobseekers/:id',
            'POST /admin/jobseekers/:id/suspend { reason }',
            'POST /admin/jobseekers/:id/reinstate',
            'POST /admin/jobseekers/:id/resend-verification',
            'POST /admin/jobseekers/:id/send-password-reset',
            'POST /admin/jobseekers/export',
          ],
          integrations: ['Transactional email', 'Audit log', 'Session store (revocation on suspend)'],
          notes:
            'There is no admin endpoint that accepts a password for a jobseeker — that absence is the control. Suspension must revoke sessions in the session store, or a suspended user keeps working until their token expires.',
        },
        acceptance: [
          'An operator can find an account by email and see its status and history.',
          'Suspending without a reason is refused by the API.',
          'A suspended user is signed out immediately, not when their token expires.',
          'Reinstating a previously unverified account returns it to Pending verification, not Active.',
          'No admin screen or endpoint can set or reveal a jobseeker password.',
          'Unmasking contact details or opening a CV writes an audit entry naming the operator.',
        ],
        openQuestions: [
          'Fixed suspension reason codes, or free text?',
          'Does a suspended user get an email telling them, and with what wording?',
          'Is there a hard-delete path for a data-deletion request (and who may run it)?',
          'How long is jobseeker data retained after deactivation? This is a legal answer, not an engineering one.',
        ],
      },
    },

    // 2 · Profile ─────────────────────────────────────────────────────────────
    {
      name: 'My page',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      mockup: 'js-mypage',
      detail: {
        description:
          'The candidate’s home: profile and contact details, avatar, job preferences, a profile-completeness signal, and the way into their CVs, applications and account settings. It is deliberately light on typing — the structured data employers search on is extracted from the uploaded CV, so this page asks only for what a CV cannot contain (see Resume management → CV data & matching architecture).',
        userStory:
          'As a jobseeker, I want one place that shows how complete my profile is and lets me set what I am looking for, so that I get relevant jobs without filling in a long form.',
        uiFields: [
          {
            group: 'Profile',
            items: [
              { name: 'avatar', type: 'file (image)', notes: 'optional; cropped client-side, max ~2MB' },
              { name: 'fullName', type: 'string', required: true },
              { name: 'headline / current role', type: 'string', notes: 'pre-filled from the CV extraction where available' },
              { name: 'location', type: 'enum (province/city)', notes: 'from the shared location master data' },
              { name: 'date of birth / nationality / gender / marital status', type: 'date / enum / enum / enum', notes: 'REINSTATED 2026-08-09 on client direction, reversing the 2026-08-05 cut. Keep all four OPTIONAL — none is read by search or matching, and marital status needs legal review before launch (see Application management → open questions)' },
            ],
          },
          {
            group: 'Contact',
            items: [
              { name: 'email', type: 'email', required: true, notes: 'the identity key; changing it re-triggers verification' },
              { name: 'phone', type: 'string', notes: 'shown to an employer only after they have the application or an unlock' },
            ],
          },
          {
            group: 'Job preferences (what a CV cannot tell us)',
            items: [
              { name: 'desiredRole / desiredCategory', type: 'enum', notes: 'from the shared Job category → Role master data (see Job management)' },
              { name: 'desiredLocation', type: 'enum[]' },
              { name: 'desiredSalary', type: 'money range', notes: 'optional; drives matching, and whether it is ever shown to employers is an open question' },
              { name: 'availability / noticePeriod', type: 'enum', notes: 'Immediately · 2 weeks · 1 month · … — a real ranking signal for recruiters' },
              { name: 'jobType', type: 'enum[]', notes: 'Full-time · Part-time · Internship · Freelance — same vocabulary as a job posting' },
            ],
          },
          {
            group: 'Account & privacy',
            items: [
              { name: 'cvVisibility', type: 'enum', required: true, notes: 'Discoverable · Hidden — explicit consent for employer CV search, never inferred' },
              { name: 'linked social logins', type: 'list + unlink', notes: 'unlink is allowed while at least one login method remains' },
              { name: 'change password', type: 'form', notes: 'current + new; absent on social-only accounts, which are offered "set a password" instead' },
              { name: 'notification preferences', type: 'toggles', notes: 'job alerts, application updates, marketing — marketing is opt-in' },
              { name: 'deactivate account', type: 'link', notes: 'the withdrawal entry point — see Deactivate account' },
            ],
          },
          {
            group: 'Signals & shortcuts',
            items: [
              { name: 'profileCompleteness', type: 'derived %', notes: 'weighted: CV uploaded, preferences set, contact verified — with the single next best action named' },
              { name: 'my CVs', type: 'link + count', notes: 'see Resume management' },
              { name: 'my applications', type: 'link + count', notes: 'see Application management → My application' },
              { name: 'saved jobs', type: 'link + count' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Completeness — a nudge, never a gate',
            items: [
              'Completeness is computed from what actually helps a candidate get hired: a CV uploaded (the heaviest weight), preferences set, and a verified contact.',
              'It always names ONE next action ("add your desired salary") rather than showing a bare percentage the user cannot act on.',
              'It never blocks anything. An incomplete profile can still apply — the gate on applying is email verification, not completeness.',
              'It doubles as a search-ranking signal for employers (see Resume management), which is why it is worth computing consistently in one place.',
            ],
          },
        ],
        behaviors: [
          'Fields save per section with an explicit save, and a discard prompt guards navigating away from unsaved edits.',
          'Fields that came from the CV extraction are marked as such and are freely editable — a user correction always wins over an extracted value.',
          'Changing the email address sends a verification link to the NEW address and keeps the old one active until it is confirmed.',
          'Turning cvVisibility to Hidden removes the candidate from employer CV search immediately; it does not affect applications already sent.',
          'A social-only account sees "set a password" rather than "change password".',
          'Unlinking the last remaining login method is refused, with an explanation.',
          'Uploading an avatar crops client-side and rejects oversized files before upload.',
        ],
        rules: [
          'A candidate can read and write only their own profile.',
          'Email changes always require verification of the new address; the account is never left addressable at an unconfirmed email.',
          'cvVisibility is explicit consent — it must default to the safer value and never be flipped by any system action.',
          'Phone is not exposed to employers by browsing; it comes with an application or a paid unlock.',
          'Preferences use the same master-data vocabulary as job postings, otherwise matching silently fails (see Job management → job taxonomy).',
          'Completeness is derived on read, never stored as an editable field.',
          'At least one login method (password or a linked provider) must remain on the account at all times.',
        ],
        states: [
          'Loading',
          'Empty profile (new account — CV upload CTA)',
          'Partially complete',
          'Editing (unsaved changes)',
          'Saving / saved',
          'Validation errors',
          'Email change pending verification',
          'Pending verification banner',
          'Social-only account (no password section)',
          'Avatar upload error',
        ],
        backend: {
          dataModel: [
            { name: 'jobseekerId', type: 'uuid', required: true },
            { name: 'fullName / headline / location', type: 'string / string? / enum', notes: 'plus dateOfBirth · nationality · gender · maritalStatus — all four NULLABLE, reinstated 2026-08-09 on client direction (reversing the 2026-08-05 cut). Nullable is the point: none is required to apply, and nothing in search or matching reads them' },
            { name: 'avatarUrl', type: 'string?' },
            { name: 'phone / phoneVerifiedAt', type: 'string? / timestamp?', notes: 'no social provider supplies a phone — captured at first apply' },
            { name: 'loginEmail', type: 'string', required: true, notes: 'the IDENTITY KEY. Immutable when it came from a social provider' },
            { name: 'contactEmail', type: 'string', required: true, notes: 'what employers see; defaults to loginEmail and is always editable. Employer-facing surfaces must read THIS, never loginEmail' },
            { name: 'contactConfirmedAt', type: 'timestamp?', notes: 'set on the first apply-time confirmation; drives the "ask once" rule and the staleness re-prompt' },
            { name: 'pendingEmail / pendingEmailToken', type: 'string? / hash?', notes: 'changing the LOGIN email only (email accounts); a contactEmail change needs no confirmation loop' },
            { name: 'desiredRole / desiredLocations / desiredSalaryMin / desiredSalaryMax / availability / jobTypes', type: 'enum / text[] / int? / int? / enum / text[]', notes: 'the ~5 fields AI cannot read from a CV' },
            { name: 'cvVisibility', type: 'enum', required: true, notes: 'discoverable|hidden — consent' },
            { name: 'notificationPrefs', type: 'jsonb' },
            { name: 'completenessScore', type: 'derived', notes: 'computed server-side in one place; also a CV-search ranking signal' },
          ],
          endpoints: [
            'GET /jobseeker/profile',
            'PATCH /jobseeker/profile',
            'POST /jobseeker/profile/avatar',
            'POST /jobseeker/email/change { email } → verification to the new address',
            'PATCH /jobseeker/privacy { cvVisibility }',
            'PATCH /jobseeker/notifications',
            'DELETE /jobseeker/social/:provider — unlink',
          ],
          integrations: ['Object storage (avatar)', 'Transactional email (email change)', 'Master data (locations, job categories & roles)'],
          notes:
            'Keep the completeness formula server-side so My page, CV search ranking and any nudge email agree. Preference fields must reference the same master-data ids the job form writes — matching depends on that shared vocabulary, not on similar-looking strings.',
        },
        acceptance: [
          'A candidate can set preferences and see completeness rise accordingly.',
          'An incomplete profile can still apply to a job.',
          'Changing the email verifies the new address before it becomes the login.',
          'Setting visibility to Hidden removes the candidate from employer CV search immediately.',
          'A social-only account can set a password and then sign in with email.',
          'Unlinking the only login method is refused.',
          'Extracted CV values are editable and a user edit is never overwritten by a later re-parse without asking.',
        ],
        openQuestions: [
          'Is desired salary ever shown to employers in CV search, or used only for matching?',
          '[C5] Is phone verification (OTP) needed in Phase-1?',
          'Which fields, if any, are mandatory before a candidate may be discoverable in CV search?',
          'Should a re-parse of an updated CV overwrite extracted fields, or always propose changes?',
        ],
      },
    },

    // 3 · Exit ────────────────────────────────────────────────────────────────
    {
      name: 'Deactivate account',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      mockup: 'js-mypage',
      detail: {
        description:
          'The candidate’s way out, with a confirm step. Deactivation is a WITHDRAWAL, not a deletion: the account stops working and the CV leaves employer CV search immediately, but applications already sent stay with those employers, and data retention follows the legal period rather than the button press. The screen has to say all of that plainly, because a user pressing this is making a decision about their own data.',
        userStory:
          'As a jobseeker, I want to withdraw my account and stop being contacted, and I want to know exactly what happens to my data before I confirm.',
        uiFields: [
          {
            group: 'Confirm step',
            items: [
              { name: 'consequences', type: 'static copy', required: true, notes: 'what stops (sign-in, CV search visibility, alerts) and what does not (applications already sent to employers)' },
              { name: 'reason', type: 'enum', notes: 'Found a job · Too many emails · Privacy concern · Not useful · Other — optional, and the most valuable product feedback we get' },
              { name: 'reasonNote', type: 'text', notes: 'free text when Other' },
              { name: 'confirm', type: 'checkbox / typed confirmation', required: true, notes: 'an explicit act, not a single accidental tap' },
              { name: 'password / re-auth', type: 'password or provider re-auth', required: true, notes: 'proves it is the account owner; social accounts re-auth with the provider' },
              { name: 'grace window notice', type: 'static copy', notes: '"Sign in within N days to reactivate" — N to be confirmed' },
            ],
          },
        ],
        sections: [
          {
            heading: 'What deactivation does — and does not — do',
            items: [
              'Sign-in stops; the account status becomes Deactivated.',
              'The CV leaves employer CV search immediately: nobody new can discover the candidate.',
              'Job alerts, application notifications and marketing email all stop.',
              'Applications already sent stay with those employers. We cannot retract a CV a recruiter has already received, and the screen must say so rather than imply otherwise.',
              'Personal data is retained only for the legally required period and then removed — the exact period is an open question for legal.',
              'Signing in inside the grace window reactivates the account and restores everything except CV-search visibility, which stays off until the candidate turns it back on.',
              'This is not the same as a data-deletion request. If the client needs a hard delete for a legal request, it is a separate, HQ-run, audited path (see User management open questions).',
            ],
          },
        ],
        behaviors: [
          'Reached from My page → Account & privacy; never a one-tap action from a menu.',
          'The consequences are shown before the confirm control, not after it.',
          'Re-authentication is required at the moment of confirming — a stale session is not sufficient proof of ownership.',
          'Confirming signs the user out of every session immediately.',
          'A confirmation email is sent, which is also the detection path if the account was compromised.',
          'The reason is optional and the flow completes without one; it is never a blocker.',
          'Before the confirm step, the flow offers the lighter alternatives that solve most cases: hide the CV from employers, or turn notifications off.',
          'Signing in during the grace window offers reactivation rather than an error.',
        ],
        rules: [
          'Deactivation requires an explicit confirm plus re-authentication.',
          'CV-search visibility is revoked immediately — this is the part with a privacy consequence and it cannot wait for a batch job.',
          'Applications already delivered to employers are not withdrawn or deleted by deactivation.',
          'All sessions are invalidated on deactivation.',
          'Reactivation inside the grace window restores the account but NOT CV visibility; consent is re-given deliberately.',
          'Data retention after deactivation follows the confirmed legal period, not the moment of the click.',
          'A deactivated email cannot be reused to create a new account while the record is retained — re-entry is reactivation, so no duplicate accounts appear.',
        ],
        states: [
          'Entry (alternatives offered)',
          'Confirm step',
          'Re-authentication required',
          'Re-auth failed',
          'Deactivating',
          'Done (signed out + email sent)',
          'Sign-in during grace window (reactivate offer)',
          'Reactivated',
          'Grace window expired',
        ],
        backend: {
          dataModel: [
            { name: 'status', type: 'enum', required: true, notes: 'set to deactivated' },
            { name: 'deactivatedAt / reactivateBefore', type: 'timestamp / timestamp', notes: 'the grace window' },
            { name: 'deactivationReason / reasonNote', type: 'enum? / text?', notes: 'optional; aggregated for product reporting' },
            { name: 'cvVisibility', type: 'enum', notes: 'forced to hidden — and NOT restored automatically on reactivation' },
            { name: 'retentionDeleteAfter', type: 'timestamp', notes: 'when the retained personal data is purged (legal period)' },
          ],
          endpoints: [
            'POST /jobseeker/account/deactivate { reason?, reasonNote?, password|providerToken }',
            'POST /auth/reactivate — offered when a deactivated user signs in inside the window',
          ],
          integrations: ['Transactional email (confirmation)', 'Session store (revoke all)', 'CV search index (immediate removal)', 'Audit log'],
          notes:
            'Deactivation must remove the candidate from the CV-search index synchronously, not on the next re-index — that is the difference between a privacy promise kept and one merely intended. A retention job handles the eventual purge; the deactivate call only stamps the deadline.',
        },
        acceptance: [
          'Deactivation cannot happen without an explicit confirm and re-authentication.',
          'The consequences, including that sent applications remain with employers, are visible before confirming.',
          'The candidate disappears from employer CV search immediately after confirming.',
          'All sessions are invalidated and a confirmation email is sent.',
          'Signing in inside the grace window reactivates the account with CV visibility still off.',
          'A deactivated email cannot be used to register a second account.',
        ],
        openQuestions: [
          'How long is the reactivation grace window (7 / 30 days)?',
          'What is the legal retention period for jobseeker data after deactivation — and who signs off on it?',
          'Do we need a separate hard-delete request path (right to erasure) in Phase-1?',
          'Should employers with an in-flight application be told the candidate withdrew their account?',
          'Can a deactivated candidate ask employers to delete the CV they already received, and is that a manual HQ process?',
        ],
      },
    },

    // 5 · Delete account — the one-way door ────────────────────────────────────
    {
      name: 'Delete account',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-mypage',
      // The two employer-side consequences are drawn on the screens that show them:
      // the company Applicants list and the company CV-search unlocked row.
      mockups: ['co-application-list', 'co-resume-search'],
      notes: 'Permanent, unlike Deactivate: the account is gone and the same email can never register again. Requested by the client because candidates were deleting and re-registering to qualify as new users for promotions.',
      detail: {
        keyPoints: [
          {
            vi: 'Đây là cửa một chiều, khác hoàn toàn với **Deactivate**: tài khoản không quay lại được, và **email đó không bao giờ đăng ký lại được**. Lý do nghiệp vụ: ứng viên đang xoá tài khoản rồi đăng ký lại để hưởng ưu đãi dành cho người mới.',
            en: 'A one-way door, unlike **Deactivate**: the account never comes back, and **that email can never register again**. The business reason: candidates were deleting and re-registering to qualify for new-user promotions.',
          },
          {
            vi: 'QUYẾT ĐỊNH CỦA KHÁCH HÀNG — những gì NTD đã có thì **giữ nguyên**. CV đã unlock vẫn nằm trong danh sách unlock; đơn ứng tuyển vẫn nằm trong applicant list. Chỉ thêm tag **“Tài khoản không còn tồn tại”**; NTD vẫn xem CV và liên hệ bình thường.',
            en: 'CLIENT DECISION — whatever the employer already has **stays**. An unlocked CV stays in their unlocked list; an application stays in the applicant list. Only a **“Tài khoản không còn tồn tại”** tag is added; the employer still views the CV and makes contact as normal.',
          },
          {
            vi: '**Không hoàn lượt unlock.** NTD đã nhận đúng thứ họ mua và vẫn dùng được — khác với trường hợp Saramin thu hồi CV (lỗi của mình, nên hoàn 1 lượt).',
            en: '**No unlock refund.** The employer received exactly what they paid for and can still use it — unlike a Saramin recall, which is our mistake and does refund the credit.',
          },
          {
            vi: 'Vì CV vẫn ở lại phía NTD, **màn hình xác nhận phải nói rõ điều đó** trước khi ứng viên bấm xoá. Một chữ “xoá” hàm ý nhiều hơn thực tế là rủi ro pháp lý, không chỉ là vấn đề trải nghiệm.',
            en: 'Because those CVs stay with employers, **the confirm screen has to say so** before the candidate presses delete. A “delete” that implies more than it does is a legal risk, not just a UX one.',
          },
        ],
        description:
          'The permanent way out: the account is closed, the candidate is purged from the platform, and the email is barred from ever registering again — the point of the feature, since re-registering was how promotion terms were being farmed.',
        userStory:
          'As a jobseeker, I want to delete my account for good and know exactly what stays with employers who already have my CV, so that I am not surprised afterwards.',
        sections: [
          {
            early: true,
            heading: 'DECIDED — what happens to what the employer already holds',
            text: 'Both cases resolve the same way, and the reason is the same in both: the employer obtained the CV legitimately and may already be acting on it. The candidate leaving Saramin does not undo that.',
            table: {
              cols: ['Case', 'What the employer sees', 'CV & contact', 'Refund'],
              rows: [
                ['NTD unlocked the CV, candidate then deletes', 'The row stays in the unlocked-CV list with a **Tài khoản không còn tồn tại** tag. Not greyed, name not struck through.', 'Views the CV and contacts the candidate as normal', 'None — nothing was taken back'],
                ['Candidate applied, then deletes', 'The application stays in the applicant list, in the same stage, with the same tag. The detail panel adds a neutral notice and the date.', 'Views the CV and contacts the candidate as normal', 'None — receiving an application is free'],
              ],
            },
            items: [
              'The tag is deliberately plain, never the rose treatment used for a Saramin recall: nothing is wrong with these CVs, and a recruiter must be able to tell the two events apart at a glance (see Resume management → “A deleted account is not a recall”).',
              'What deletion DOES remove is only what depends on the account: no Saramin profile left to open, and Saramin messages / notifications no longer reach the person — so both surfaces tell the recruiter to contact them directly.',
              'The CV also leaves CV search, so it never appears in a NEW search. Only the employers who already have it keep it.',
            ],
          },
          {
            heading: 'What the candidate must be told before confirming',
            items: [
              'This is permanent — the account cannot be recovered and **this email can never be used to sign up again**.',
              'Employers who already unlocked your CV, or already received your application, KEEP it and can still contact you.',
              'Your CV is removed from CV search immediately, so no new employer can discover you.',
              'Files an employer already downloaded are outside Saramin and cannot be recalled by us.',
              'If you only want a break, use **Deactivate** instead — offered on this screen, before the delete control.',
            ],
            warn: 'The confirm step needs re-authentication and an explicit typed confirmation, exactly like Deactivate. A one-way door reached by one tap is a support queue.',
          },
        ],
        rules: [
          'Deletion is permanent: no reactivation path, and the email (normalised), the phone and every linked social identity are barred from registering again.',
          'The bar is stored as a one-way HASH, not as readable contact data — the minimum needed to enforce it (see the backend contract).',
          'Unlocked CVs and delivered applications are NOT withdrawn, and no unlock credit is refunded.',
          'The candidate leaves the CV-search index synchronously at the moment of confirming, not on the next re-index.',
          'All sessions are invalidated and a confirmation email is sent.',
          'Historical counts (registrations, applications, unlocks) are never rewritten — only identity is removed.',
          'Audit-log entries about the account are retained, including the deletion itself; the internal id stays, the name goes.',
        ],
        states: [
          'Entry (Deactivate offered first)',
          'Consequences shown',
          'Re-authentication required',
          'Typed confirmation',
          'Deleted (confirmation email sent)',
          'Blocked sign-up attempt with a deleted email',
        ],
        backend: {
          dataModel: [
            { name: 'status', type: 'enum', required: true, notes: 'adds `deleted` — terminal, with no path back to any other status' },
            { name: 'deletedAt', type: 'timestamp', required: true },
            { name: 'BlockedIdentity', type: 'entity', required: true, notes: 'hash(normalisedEmail + server pepper), hash(phone), hash(provider + providerUserId), deletedAt — the only thing that outlives the purge, and the reason a re-signup can be refused at all' },
            { name: 'purge job', type: 'process', notes: 'clears name, phone, DOB, avatar, alerts and the candidate-side CV records; leaves the shell row, the audit trail and what employers already hold' },
          ],
          endpoints: [
            'POST /account/delete { reauth, typedConfirmation } → status=deleted, sessions revoked, index removal',
            'GET  /auth/signup/precheck { email | phone } → 409 when it matches a BlockedIdentity',
          ],
          integrations: ['CV search index (immediate removal)', 'Transactional email (confirmation)', 'Session store (revoke all)', 'Audit log'],
          notes:
            'Normalise before hashing (lower-case, strip Gmail dots and +tags) or the bar is bypassed by writing the same address differently. Hash the phone and the social identities too — otherwise the same person returns with the same Google account on a new address. The sign-up check must run on the server, never only in the form.',
        },
        acceptance: [
          'A deleted account cannot sign in, cannot be reactivated, and its email is refused at sign-up with a clear message.',
          'An employer who had unlocked the CV still sees the row, still opens the CV, still has the contact details, and is NOT refunded.',
          'An application from a deleted candidate stays in its stage with the tag, and the recruiter can still read the CV and make contact.',
          'The candidate disappears from CV search immediately on confirming.',
          'The confirm screen states, before the control, that already-unlocked CVs and delivered applications stay with employers.',
          'Historical reports are unchanged by a deletion.',
        ],
        openQuestions: [
          'Is there a grace window before the purge (e.g. 30 days recoverable), or is Delete instantaneous? A one-way door with no window means every mistaken click is a support case with no answer.',
          'May a SUSPENDED account delete itself? If yes, deleting becomes a way to shed a ban — recommend blocking the path for suspended accounts.',
          'Is an UNVERIFIED email barred too? Recommend no: otherwise anyone can sign up with someone else’s address, delete, and lock that person out of Saramin permanently.',
          'How long do the CV and contact details stay readable on the employer surfaces — forever, or a fixed retention (e.g. 12 months)? Needs legal sign-off.',
          'Does HQ get an audited break-glass unblock for genuine mistakes?',
          'Legal: does retaining a hashed identifier to enforce a permanent bar sit correctly with the erasure right under Decree 13/2023 — and does the T&C say the address can never be reused?',
        ],
      },
    },
  ],
}
