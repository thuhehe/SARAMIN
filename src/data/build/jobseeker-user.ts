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
 * Social login (Facebook / Google / LinkedIn / GitHub) arrives pre-verified by
 * the provider, so it skips straight to Active — that is the one asymmetry worth
 * remembering across every screen here.
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
          ['Social — Facebook · Google · LinkedIn · GitHub', 'Pre-verified by the provider', 'Active directly'],
        ],
      },
      items: ['Password reset is available for email accounts.'],
      warn: 'Email is the IDENTITY KEY — one account per email address. A social login on an email that already exists LINKS to that account; it never creates a second one.',
    },
    {
      label: 'Account status model',
      table: {
        cols: ['Status', 'Means', 'Reversible?'],
        rows: [
          ['Pending verification', 'Signed up, email not confirmed — cannot apply', 'Yes, by verifying'],
          ['Active', 'Verified, full use', '—'],
          ['Suspended', 'Blocked by HQ — a reason is required', 'Yes, by HQ'],
          ['Deactivated', 'Withdrawn by the user', 'Yes, on sign-in within the grace window'],
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
  ],
  features: [
    // 0 · Identity ────────────────────────────────────────────────────────────
    {
      name: 'Sign up / Sign in',
      site: 'Jobseekers',
      scope: ['BE', 'FE'],
      ready: true,
      notes: '4 social login (Facebook, Gmail, LinkedIn, Github)',
      detail: {
        description:
          'The jobseeker’s way in: email + password, or one of four social providers (Facebook, Google, LinkedIn, GitHub). Email sign-ups must confirm their address before they can apply; social sign-ups are already verified by the provider and go straight to Active. The same screen pair covers sign-in, forgotten password and re-entry after a withdrawal, because email is the single identity key for all of them.',
        userStory:
          'As a jobseeker, I want to sign up in seconds — ideally with an account I already have — so that I can apply to a job without filling in a registration form first.',
        uiFields: [
          {
            group: 'Sign up',
            items: [
              { name: 'email', type: 'email', required: true, notes: 'the identity key — unique across all jobseeker accounts, stored lower-cased' },
              { name: 'password', type: 'password', required: true, notes: 'min 8 chars with a mix of letters and digits; strength meter shown, never a silent truncation' },
              { name: 'fullName', type: 'string', required: true, notes: 'the only profile field asked at sign-up — everything else comes later or from the CV' },
              { name: 'termsAccepted', type: 'checkbox', required: true, notes: 'T&C + privacy policy, with the version stored against the account' },
              { name: 'social buttons', type: 'oauth', notes: 'Facebook · Google · LinkedIn · GitHub — same four on sign-up and sign-in' },
            ],
          },
          {
            group: 'Sign in',
            items: [
              { name: 'email / password', type: 'email / password', required: true },
              { name: 'rememberMe', type: 'checkbox', notes: 'longer refresh-token lifetime; off by default on shared devices' },
              { name: 'forgot password', type: 'link', notes: 'starts the reset flow' },
              { name: 'error', type: 'message', notes: 'one generic "email or password is incorrect" — never reveals whether the email exists' },
            ],
          },
          {
            group: 'Verification & reset',
            items: [
              { name: 'verification email', type: 'email + token', required: true, notes: 'single-use link, expires in 24h, resend allowed with a cooldown' },
              { name: 'reset email', type: 'email + token', notes: 'single-use, expires in 1h; using it invalidates existing sessions' },
              { name: 'resend cooldown', type: 'derived', notes: '60s between sends — the anti-spam control' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — what each account status allows',
            items: [
              'Pending verification — created by an email/password sign-up. Can sign in and browse, CANNOT apply or be discovered in CV search. The whole UI carries a "confirm your email" banner with a resend action.',
              'Active — verified email, or any social sign-up. Full use of the site.',
              'Suspended — blocked by HQ with a reason. Sign-in is refused with a support contact, never with the reason text (which is internal).',
              'Deactivated — the user withdrew. Sign-in inside the grace window offers reactivation; after it, the account is treated as gone.',
              'Only Active can apply to a job. Every other status is a read-only visitor with an account.',
            ],
          },
          {
            heading: 'Social login — linking, not duplicating',
            items: [
              'A provider returns a verified email. If an account already exists on that email, the provider is LINKED to it and the user is signed in — we never create a second account on the same address.',
              'If the provider does not release an email (a real case with some Facebook and GitHub accounts), we cannot key the identity: ask for an email and verify it before creating the account.',
              'An account created socially has no password. "Forgot password" on such an account offers to set one, which is how a social-only user gains an email login.',
              'The linked providers are listed in My page so a user can see how they sign in, and unlink any provider as long as one login method remains.',
            ],
          },
        ],
        behaviors: [
          'Sign-up sends the verification email immediately and lands the user on the site with a persistent "confirm your email" banner — never on a dead-end "check your inbox" page.',
          'Tapping the verification link sets Active, signs the user in and returns them to whatever they were doing (the job they wanted to apply to, if any).',
          'Attempting to apply while Pending opens the verification prompt rather than a bare error.',
          'A guest who tries to apply is brought here and returned to the apply screen with the job kept (see Application management → Apply flow).',
          'Social sign-in on a new email creates an Active account and asks for nothing more.',
          'Password reset always reports "if that email exists we have sent a link", so the form cannot be used to enumerate accounts.',
          'Completing a reset invalidates every other session — the standard assumption is that the old password is compromised.',
          'Repeated failed sign-ins are rate-limited per email and per IP, with a lockout window rather than a permanent block.',
          'Signing in to a Deactivated account inside the grace window offers "reactivate your account" instead of refusing.',
        ],
        rules: [
          'One account per email address. Uniqueness is enforced in the DB on a lower-cased email, not just in the form.',
          'A social login on an existing email links to that account; it never creates a second one.',
          'Verification is required before applying, and it gates writes only — browsing stays open.',
          'Passwords are stored only as a salted hash (bcrypt / argon2). No plaintext, no reversible encryption, and no password is ever emailed.',
          'Verification tokens are single-use and expire (24h verify, 1h reset); a used or expired token offers a clean resend path.',
          'A Suspended account cannot sign in, and the reason is never shown to the user.',
          'The accepted T&C version is stored with the account, because it is what we can later prove.',
          'Sign-in must not reveal whether an email exists — the same message for a wrong password and an unknown email.',
        ],
        states: [
          'Sign-up (empty)',
          'Validation errors',
          'Email already registered (offer sign-in / reset)',
          'Pending verification (banner)',
          'Verification link expired / already used',
          'Active',
          'Wrong credentials',
          'Rate-limited / locked out',
          'Suspended (blocked message)',
          'Deactivated (reactivate offer)',
          'Social provider cancelled / returned no email',
        ],
        backend: {
          dataModel: [
            { name: 'jobseekerId', type: 'uuid', required: true },
            { name: 'email', type: 'string', required: true, notes: 'UNIQUE, lower-cased — the identity key' },
            { name: 'passwordHash', type: 'string?', notes: 'null for social-only accounts' },
            { name: 'fullName', type: 'string', required: true },
            { name: 'status', type: 'enum', required: true, notes: 'pending_verification|active|suspended|deactivated' },
            { name: 'emailVerifiedAt', type: 'timestamp?', notes: 'set by the link, or immediately on social sign-up' },
            { name: 'SocialIdentity', type: 'entity', notes: 'jobseekerId, provider(facebook|google|linkedin|github), providerUserId, linkedAt — UNIQUE (provider, providerUserId)' },
            { name: 'VerificationToken', type: 'entity', notes: 'token hash, purpose(verify|reset), expiresAt, usedAt — single-use' },
            { name: 'termsVersion / termsAcceptedAt', type: 'string / timestamp' },
            { name: 'lastLoginAt / failedAttempts / lockedUntil', type: 'timestamp / int / timestamp?' },
          ],
          endpoints: [
            'POST /auth/signup { email, password, fullName, termsAccepted }',
            'POST /auth/login { email, password }',
            'POST /auth/social/:provider/callback',
            'POST /auth/verify { token }',
            'POST /auth/verify/resend',
            'POST /auth/password/forgot { email }',
            'POST /auth/password/reset { token, password }',
            'POST /auth/logout',
          ],
          integrations: [
            'Facebook Login · Google · LinkedIn · GitHub OAuth',
            'Transactional email (verification, reset)',
            'Rate limiting / abuse protection',
          ],
          notes:
            'Store social identities in their own table rather than as columns, so one account can carry several providers. Keep token hashes, not tokens. The lower-cased unique index on email is what actually prevents the duplicate-account class of bug — form validation alone will not.',
        },
        acceptance: [
          'A new email/password sign-up lands on Pending verification and cannot apply until verified.',
          'Clicking the verification link sets Active and returns the user to where they left off.',
          'A social sign-in on an email that already has an account signs into that account and does not create a second one.',
          'Signing up with an existing email offers sign-in or reset rather than creating a duplicate.',
          'A completed password reset invalidates other sessions.',
          'Neither sign-in nor password reset reveals whether an email is registered.',
          'A Suspended account cannot sign in and sees a support message with no internal reason.',
        ],
        openQuestions: [
          'Do we need phone / OTP sign-in for the Vietnamese market, where phone is often the primary identity?',
          'Is 2FA in scope for jobseekers in Phase-1, or employer-side only?',
          'How long may an unverified account live before it is purged?',
          'Should a social provider that releases no email be supported at all, or dropped?',
          'Session lifetime and "remember me" duration — what do we commit to?',
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
              { name: 'dateOfBirth / gender', type: 'date / enum', notes: 'optional — collect only what is actually used' },
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
            { name: 'fullName / headline / location / dateOfBirth / gender', type: 'string / string? / enum / date? / enum?' },
            { name: 'avatarUrl', type: 'string?' },
            { name: 'phone / phoneVerifiedAt', type: 'string? / timestamp?' },
            { name: 'pendingEmail / pendingEmailToken', type: 'string? / hash?', notes: 'the new address stays pending until confirmed' },
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
          'Is phone verification (OTP) needed in Phase-1?',
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
  ],
}
