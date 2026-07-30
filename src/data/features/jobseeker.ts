import type { FeatureSpec } from '../types'

const SURFACE = 'Store Site · Job-seeker'

/**
 * A1 — Job-seeker (candidate) features of the public store site (svn-web).
 * One codebase, mock-first: a screen only talks to the real backend when its
 * live-feature flag is flipped.
 */
export const JOBSEEKER_SPECS: FeatureSpec[] = [
  // ── Authentication — the DEPTH EXEMPLAR (fully specced) ──────────────────
  {
    id: 'js-auth',
    code: 'JS-AUTH-01',
    surface: SURFACE,
    title: 'Authentication',
    status: 'live-wired',
    summary:
      'Candidate sign-up / sign-in (email + social), a member-join detail step, sign-out, and account withdrawal.',
    description:
      'The candidate account gateway. Sign-up is modelled on ITviec: email + password with a live password-rule checklist, plus social login. After a first sign-up the user completes a short join-detail step, then signs in with email + password on subsequent visits. Withdrawal deactivates the member account.',
    uiFields: [
      {
        group: 'Sign-up form (email)',
        items: [
          { name: 'Full name', type: 'text', required: true, notes: 'Stored as ONE field. We do NOT split into first name / last name.' },
          { name: 'Email', type: 'email', required: true, notes: 'Validated format, must be unique.' },
          { name: 'Password', type: 'password', required: true, notes: 'Live rule checklist below the field, each rule flips red→green as satisfied.' },
          { name: 'Show / hide password', type: 'toggle (eye icon)', notes: 'Reveals the password value.' },
          { name: 'Terms & Privacy consent', type: 'checkbox', required: true, notes: 'Must be ticked before submit. Links to Terms & Conditions and Privacy Policy.' },
        ],
      },
      {
        group: 'Password rules (live checklist)',
        items: [
          { name: 'At least 12 characters', type: 'rule' },
          { name: 'At least 1 symbol (! @ # $ …)', type: 'rule' },
          { name: 'At least 1 number', type: 'rule' },
          { name: 'At least 1 uppercase letter', type: 'rule' },
          { name: 'At least 1 lowercase letter', type: 'rule' },
        ],
      },
    ],
    behaviors: [
      'Primary button "Sign up with Email"; footer link "Already have an account? Sign in".',
      'Submit is disabled until all required fields are valid AND the consent box is checked.',
      'Inline validation: green border when a field is valid, red border + message when not.',
      'Duplicate email → clear error: "email already registered, sign in instead".',
      'Google login: a separate consent line ("By signing up with Google, I agree to…"), one-tap OAuth.',
      'Facebook login: same OAuth pattern (see open question on Facebook vs Zalo for VN).',
      'Sign-out and "withdraw account" (with a confirm dialog) live in My Applications / account actions.',
    ],
    backend: {
      dataModel: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'fullName', type: 'string', required: true, notes: 'single field — no first/last split' },
        { name: 'email', type: 'string (unique)', required: true },
        { name: 'passwordHash', type: 'string', notes: 'Null for social-only accounts.' },
        { name: 'authProvider', type: "enum('email','google','facebook','zalo')", required: true },
        { name: 'providerUserId', type: 'string', notes: 'Set for social accounts.' },
        { name: 'emailVerified', type: 'boolean', required: true },
        { name: 'termsAcceptedAt', type: 'timestamp', required: true },
        { name: 'privacyAcceptedAt', type: 'timestamp', required: true },
        { name: 'status', type: "enum('active','withdrawn')", required: true },
        { name: 'locale', type: "enum('vi','en')", notes: 'Default vi.' },
        { name: 'createdAt', type: 'timestamp', required: true },
        { name: 'lastLoginAt', type: 'timestamp' },
      ],
      endpoints: [
        'POST /auth/signup — create account (email)',
        'POST /auth/login — email + password',
        'POST /auth/oauth/{provider} — social sign-in / sign-up',
        'GET /auth/check-email?email= — duplicate-email pre-check',
        'POST /auth/verify-email — confirm verification token',
        'POST /auth/logout',
        'POST /auth/withdraw — deactivate member account',
      ],
      integrations: ['Google OAuth', 'Facebook / Zalo OAuth (TBD)', 'Transactional email provider (verification)'],
      notes:
        'Session / JWT ownership and refresh strategy not yet confirmed. Password-reset ("Forgot password") flow needs its own spec.',
    },
    known: [
      'Email/password sign-in + Google button are present and live-wired today.',
      'Sign-up collects a single Full name field — no first/last split.',
      'A join-detail step collects profile basics after first sign-up.',
      'Withdrawal has a confirm dialog and deactivates the account.',
    ],
    unknown: [
      'On success: does the user get email/password login only, or auto-login + a verification email?',
      'On first Google sign-up, do we take the provider\'s display name straight into the single Full name field?',
      'Password-reset flow (email link? OTP?) is not specced.',
      'Session model: who issues/refreshes the JWT and how long it lives.',
    ],
    clientQuestions: [
      'Is social login approved for VN launch, and which providers — Google only, or also Facebook / Zalo? (Zalo is far more common locally than Facebook.)',
      'After email sign-up, do we auto-login or require email verification first?',
      'Any password-strength or lockout policy the client mandates beyond the 5 rules above?',
    ],
    adminStoreRelation:
      'Creates the member account that HQ Admin manages (Admin → Resumes / member records). Withdrawal deactivates it.',
    externalSystems: ['Google OAuth', 'Email provider'],
    related: ['js-my-applications', 'js-my-home', 'js-resumes'],
    hasWireframe: false,
  },

  // ── Home / landing ────────────────────────────────────────────────────────
  {
    id: 'js-home',
    code: 'JS-HOME-01',
    surface: SURFACE,
    title: 'Home / landing',
    status: 'built-mock',
    summary:
      'Personalised homepage: hot banners, platinum/prime/special job sections, recommendations, mobile carousel, sticky side nav.',
    description:
      'The homepage is built from configurable sections, UI similar to PITB. Section types are fixed / pre-built; Admin picks a type and fills its content — it is not free-form layout. The Store renders the enabled sections in the Admin-defined order, and each section pulls its own content (recommended jobs, banners, announcements).',
    sections: [
      {
        heading: 'Admin side (manage sections)',
        items: [
          'Create / edit / delete sections.',
          'Per section: section name, display title, section type (UI is pre-defined), and what the UI looks like (hard-coded per type).',
          'Drag to reorder — controls the order sections appear on Store.',
        ],
      },
      {
        heading: 'Store side (render)',
        items: [
          'Homepage renders the enabled sections in the Admin-defined order.',
          'Each section pulls its own content (recommended jobs, banners, announcements).',
        ],
      },
      {
        heading: 'Candidate slot types to define (from client)',
        items: [
          'Recommended job postings for members',
          'Square banner',
          'Long banner',
          'Must-see announcements for members',
          'Less-highlight jobs (different UI)',
          'Tools',
        ],
      },
    ],
    known: [
      'UI similar to PITB — homepage built from configurable, pre-defined section types.',
      'Admin manages sections (CRUD + drag-to-reorder); Store renders in that order.',
    ],
    unknown: [
      'The exact catalogue of section / slot types (must be defined with the client, following Saramin KR or VN).',
      'Recommendation logic for the "recommended jobs" slot.',
    ],
    clientQuestions: [
      'Client to define the section types (following Saramin KR or VN).',
      'Overlap with the Curation page — is that a separate page or part of Home?',
    ],
    clientTeam: ['Jason (Sales / CRM)', 'Trân Nguyễn (Sales)'],
    adminStoreRelation:
      'Display management flows from Admin (Content / section builder) to Store. Ties into Banners + Notifications modules.',
    related: ['js-curation', 'admin-banners', 'js-recommendations'],
  },

  // ── Job search ──────────────────────────────────────────────────────────
  {
    id: 'js-search',
    code: 'JS-SEARCH-01',
    surface: SURFACE,
    title: 'Job search',
    status: 'live-wired',
    summary:
      'Keyword search + autocomplete, recent-search history, detailed filters, and 6 job-card layouts.',
    description:
      'Top search bar + left filter panel, results shown as job cards. Autocomplete drops down as the user types; recent searches show when the box is empty.',
    uiFields: [
      {
        group: 'Filters (standard job-board set)',
        items: [
          { name: 'Location / region', type: 'multi-select' },
          { name: 'Category / industry', type: 'multi-select' },
          { name: 'Salary range', type: 'range', notes: 'Standard filter — currently missing; add.' },
          { name: 'Employment type', type: 'multi-select', notes: 'Full-time / part-time / contract / internship.' },
          { name: 'Work arrangement', type: 'multi-select', notes: 'Onsite / hybrid / remote — now expected.' },
          { name: 'Career level', type: 'multi-select' },
          { name: 'Education', type: 'multi-select' },
          { name: 'Date posted', type: "enum('24h','3d','7d','30d')", notes: 'Standard recency filter — add.' },
        ],
      },
    ],
    behaviors: [
      'Autocomplete dropdown as the user types; search by title, skill, company.',
      'Recent searches shown when the search box is empty.',
      'Six job-card layouts exist — pick ONE as the default (confirm with client).',
      'Sort by relevance / most recent (standard); save-search / job-alert is a common follow-up.',
    ],
    backend: {
      integrations: ['Search / relevance service', 'Admin master data (categories, locations)'],
      notes:
        'Filter options (categories, locations) come from Admin master data; job cards read live job postings. Search relevance is fed by the behaviour-tracking pipeline.',
    },
    known: ['Live-wired. Filters read Admin master data; cards read live postings.'],
    unknown: [
      'Which of the 6 card layouts is the launch default.',
      'Full filter set to launch — salary, employment type, work arrangement, date-posted are standard and should be added.',
      'Saved searches / job alerts (email) — a common companion feature; in scope?',
    ],
    clientQuestions: [
      'Confirm the default job-card layout (1 of 6).',
      'Confirm the launch filter set (recommend the standard: location, category, salary, type, work arrangement, level, date posted).',
      'Do we want saved searches + job alerts at launch?',
    ],
    adminStoreRelation:
      'Filter options come from Admin master data; job cards read live job postings.',
    related: ['js-job-detail', 'js-lists', 'js-behavior-tracking'],
  },

  // ── Job lists by type ───────────────────────────────────────────────────
  {
    id: 'js-lists',
    code: 'JS-LIST-01',
    surface: SURFACE,
    title: 'Job lists by type',
    status: 'built-mock',
    summary:
      'Separate browse lists: domestic, dispatch (파견), headhunting, plus a "Hot 100" ranking.',
    description:
      'Tabbed list page — Domestic / Dispatch / Headhunting / Hot 100. The same job-card list appears under each tab with a different filter query behind it. Hot 100 is a ranked list (1–100) with a rank-number badge on each card.',
    behaviors: [
      'Tabs: Domestic / Dispatch / Headhunting / Hot 100.',
      'Same card list per tab, different filter query behind it.',
      'Hot 100 shows a rank number badge (1–100) on each card.',
    ],
    known: ['Hot-100 currently uses mock ranking data.'],
    unknown: ['Hot-100 ranking logic — Admin-configured vs auto-computed, and refresh cadence.'],
    clientQuestions: ['Who owns the Hot-100 ranking logic and how often does it refresh?'],
    adminStoreRelation:
      "Which list a job appears in is driven by the job's type set in Admin.",
    related: ['js-search', 'js-salary'],
  },

  // ── Job detail ──────────────────────────────────────────────────────────
  {
    id: 'js-job-detail',
    code: 'JS-JOB-01',
    surface: SURFACE,
    title: 'Job detail',
    status: 'live-wired',
    summary: 'Full posting view with apply button and scrap (찜 / save) toggle.',
    description:
      'Single job page: title/company header, body, sticky Apply + Save (heart) buttons. The save toggle flips filled/empty instantly; Apply opens the apply flow; the company block links to company detail.',
    behaviors: [
      'Save (heart) toggle flips filled/empty instantly.',
      'Apply opens the apply flow.',
      'Company block links to the company detail page.',
    ],
    known: ['Live-wired. Renders a live posting created / edited in Admin; save + apply write back to the member account.'],
    unknown: [
      'UI like Saramin KR — any changes for VN?',
      'Client to provide the full details of "Creating a job" (fields, flow); show a demo (currently based on Saramin KR).',
      'AI-assisted job creation — after Sept?',
    ],
    clientQuestions: [
      'Job detail UI like Saramin KR, or any changes?',
      'Provide full details of Creating a job; walk through a demo (currently from Saramin KR).',
      'Do we want create-jobs-by-AI (targeted after Sept)?',
    ],
    adminStoreRelation:
      'Renders a live job posting created/edited in Admin OR on the employer site — job creation happens in 2 places and should be its own "Create job" module (see Jobs module M2). Save + apply write back to the member’s account.',
    related: ['js-apply', 'js-scraps', 'js-companies', 'emp-jobs', 'admin-job-new'],
  },

  // ── Apply to job ────────────────────────────────────────────────────────
  {
    id: 'js-apply',
    code: 'JS-APPLY-01',
    surface: SURFACE,
    title: 'Apply to job',
    status: 'built-mock',
    summary:
      'One-click apply from job detail; application recorded to history. Must be very easy to apply (reference: Vietnamworks).',
    description:
      'Apply button → confirm modal (pick resume) → success toast. The bar for the flow is deliberately low: the client wants applying to be "very easy", modelled on Vietnamworks. Prevents double-apply (button shows "Applied" afterwards). Requires login; if logged out, the user is sent to sign-in first.',
    uiFields: [
      {
        group: 'Apply confirm modal',
        items: [
          { name: 'Resume', type: 'select', required: true, notes: 'Pick which resume/CV to send (online or uploaded).' },
          { name: 'Cover message', type: 'textarea', notes: 'Optional — confirm with client if wanted at launch.' },
          { name: 'Screening questions', type: 'dynamic', notes: 'Shown only if the employer set them on the job (Indeed/LinkedIn standard).' },
        ],
      },
    ],
    behaviors: [
      'Confirm modal lets the candidate pick a resume, then submit.',
      'Success toast on completion; button flips to "Applied" to prevent double-apply.',
      'Requires login; logged-out users are routed to sign-in first, then returned to apply.',
    ],
    backend: {
      dataModel: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'jobId', type: 'ref → job', required: true },
        { name: 'candidateId', type: 'ref → member', required: true },
        { name: 'resumeId', type: 'ref → resume', required: true },
        { name: 'status', type: 'enum (application status)', required: true, notes: 'See My applications for the status set.' },
        { name: 'appliedAt', type: 'timestamp', required: true },
      ],
      endpoints: ['POST /jobs/{id}/apply', 'GET /jobs/{id}/apply/eligibility — already-applied / login check'],
      notes: 'Currently mock (built UI, not wired). One application record is the single source read by the employer ATS, HQ applicants board, and the candidate’s My applications.',
    },
    known: [
      'UI built (mock). Confirm-modal → toast flow exists.',
      'Creates one application record shared across candidate / employer / HQ views.',
      'Standard: quick / 1-click apply (LinkedIn "Easy Apply", Indeed Apply, VietnamWorks) — that is what "very easy to apply" maps to.',
    ],
    unknown: [
      'Exact apply flow — client wants it modelled on Vietnamworks (confirm steps).',
      'Whether an optional cover message / screening questions are collected at apply time.',
      'Admin-side: do we filter CVs for reference (e.g. match required experience years)?',
    ],
    clientQuestions: [
      'How should the apply flow look? It should be very easy to apply (reference: Vietnamworks).',
      'On the Admin side, do we filter/flag CVs for reference — e.g. match experience years?',
    ],
    adminStoreRelation:
      'Creates an application record the employer sees in their applicant board (ATS) and Admin sees under Jobs → applicants.',
    related: ['js-job-detail', 'js-my-applications', 'emp-ats', 'admin-job-applicants'],
  },

  // ── My applications ─────────────────────────────────────────────────────
  {
    id: 'js-my-applications',
    code: 'JS-APP-HIST-01',
    surface: SURFACE,
    title: 'My applications',
    status: 'live-wired',
    summary:
      'Candidate’s history of applied jobs with status + date; the employer/HQ side manages the same records through an evaluation pipeline.',
    description:
      'Two sides of one record. Candidate (JS): a list of applied jobs with status; view application, no cancel. Employer/HQ (Admin): manage the application through an evaluation pipeline with rich candidate + company fields.',
    uiFields: [
      {
        group: 'Candidate list row (JS)',
        items: [
          { name: 'Job title', type: 'text', required: true },
          { name: 'Company', type: 'text', required: true },
          { name: 'Applied date', type: 'date', required: true },
          { name: 'Status', type: 'enum', required: true, notes: 'Candidate-facing status label (see below).' },
        ],
      },
      {
        group: 'Admin fields — about the candidate (JS)',
        items: [
          { name: 'Name / email / phone', type: 'text' },
          { name: 'Experience years', type: 'number' },
          { name: 'Submitted', type: 'date', notes: 'Modified date? — confirm with client.' },
          { name: 'Sent to employer', type: 'date' },
        ],
      },
      {
        group: 'Admin fields — about the company (CO)',
        items: [
          { name: 'Company name', type: 'text' },
          { name: 'Job title', type: 'text' },
        ],
      },
    ],
    behaviors: [
      'Candidate: view application; NO cancel application.',
      'Candidate actions area also hosts sign-out + "withdraw account" (with confirm).',
      'Admin: view CV, manually change the application evaluation, send to employer, mark ready, send/confirm candidate.',
    ],
    sections: [
      {
        heading: 'Standard candidate status pipeline (industry reference)',
        items: [
          'Applied → Application viewed → Under review / Screening → Shortlisted → Interview → Offer → Hired',
          'Terminal: Not selected / Rejected · Withdrawn',
          'Standard practice: an automated email/notification fires on every status change (see Notifications module).',
        ],
      },
      {
        heading: 'Candidate-facing statuses (client wording — confirm)',
        items: [
          'Submitted / Đã gửi ứng viên',
          'Sent to employer / Đã gửi nhà tuyển dụng',
          '(map these onto the standard pipeline above; confirm exact set + transitions)',
        ],
      },
      {
        heading: 'Admin application-evaluation states',
        items: [
          'Waiting',
          'Ready',
          'Not matching',
          'Not enough info',
          'Spam — e.g. reason: CV duplicate detected across multiple accounts (root application_id, account_id)',
          'Recall (?)',
        ],
      },
    ],
    backend: {
      dataModel: [
        { name: 'applicationId', type: 'uuid', required: true },
        { name: 'candidateId / jobId / companyId', type: 'refs', required: true },
        { name: 'candidateStatus', type: 'enum', required: true, notes: 'What the candidate sees.' },
        { name: 'evaluation', type: "enum('waiting','ready','not_matching','not_enough_info','spam','recall')" },
        { name: 'experienceYears', type: 'number' },
        { name: 'submittedAt / sentToEmployerAt', type: 'timestamp' },
        { name: 'bestSkills', type: 'string[]', notes: 'How derived? — open.' },
      ],
      notes:
        'Candidate view and Admin evaluation read the same application record. How candidate status maps to / is derived from the Admin evaluation must be defined.',
    },
    known: [
      'Candidate list is live-wired (reads the member’s own application records).',
      'Admin evaluation states enumerated: waiting / ready / not matching / not enough info / spam / recall.',
      'Candidate cannot cancel an application; withdrawal deactivates the account.',
    ],
    unknown: [
      'Exact candidate-facing status set + wording (vi) and how statuses change.',
      'Is evaluation automatic, manual, or both? How "Best skills" is computed.',
      'Whether "Submitted" also tracks a Modified date.',
    ],
    clientQuestions: [
      'What are the application statuses, and how do they change (auto vs manual)?',
      'Is application evaluation automatic? How are "Best skills" determined?',
      'Confirm which candidate + company fields Admin must see on each application.',
    ],
    adminStoreRelation:
      'One application record: candidate reads their own history; Admin manages evaluation and routing to the employer.',
    related: ['js-apply', 'js-auth', 'admin-job-applicants', 'emp-ats'],
  },

  // ── Scraps (saved jobs) ─────────────────────────────────────────────────
  {
    id: 'js-scraps',
    code: 'JS-SCRAP-01',
    surface: SURFACE,
    title: 'Scraps (saved jobs)',
    status: 'live-wired',
    summary: 'Save / un-save jobs; a dedicated "my scraps" screen.',
    description:
      'Grid/list of saved jobs; the heart icon un-saves inline. Empty state when nothing is saved. Same job-card style as search results.',
    known: ['Live-wired. Purely member-side data (saved job IDs) — no Admin management needed.'],
    adminStoreRelation: 'Purely member-side data (saved job IDs); no Admin management needed.',
    related: ['js-job-detail', 'js-my-home'],
  },

  // ── Candidate dashboard ─────────────────────────────────────────────────
  {
    id: 'js-my-home',
    code: 'JS-MYHOME-01',
    surface: SURFACE,
    title: 'Candidate dashboard (my-home)',
    status: 'built-mock',
    summary:
      'Composed dashboard pulling applications + scraps + notifications into one view.',
    description:
      '"My home" landing after login: summary cards / widgets — recent applications, saved jobs, latest notifications, recommended jobs. Each widget links to its full screen.',
    known: ['Aggregates member-side data.'],
    unknown: ['Recommended-jobs widget may need Admin / logic to define recommendations.'],
    adminStoreRelation:
      'Aggregates member-side data; the recommended-jobs widget may need Admin / logic to define recommendations.',
    related: ['js-my-applications', 'js-scraps', 'js-notifications'],
  },

  // ── Resumes ─────────────────────────────────────────────────────────────
  {
    id: 'js-resumes',
    code: 'JS-RESUME-01',
    surface: SURFACE,
    title: 'Resumes',
    status: 'built-mock',
    summary:
      'Two CV types like Vietnamworks — Online CV (built in-app) and Uploaded CV (file). Create / edit / list; "unlock price" concept for paid CV reveal.',
    description:
      'Following Vietnamworks, there are 2 kinds of CV: an Online CV built through a multi-section form, and Uploaded CVs (files the candidate uploads). Resume list → form (for online) / upload (for files). List rows: resume name, last edited, actions (edit / duplicate / delete / set default).',
    sections: [
      {
        heading: 'Two CV types (reference: Vietnamworks)',
        items: [
          'Online CV — built in-app via a multi-section form (profile, education, experience, skills, …).',
          'Uploaded CV — candidate uploads a file (PDF/DOC); stored + shown in the list.',
        ],
      },
    ],
    uiFields: [
      {
        group: 'Online CV — standard sections',
        items: [
          { name: 'Contact / profile', type: 'section', required: true, notes: 'Name, headline, email, phone, location, photo.' },
          { name: 'Professional summary / objective', type: 'section' },
          { name: 'Work experience', type: 'repeatable', notes: 'Role, company, dates, achievements.' },
          { name: 'Education', type: 'repeatable' },
          { name: 'Skills', type: 'tags' },
          { name: 'Languages', type: 'repeatable', notes: 'Important in the VN / bilingual market.' },
          { name: 'Certifications', type: 'repeatable' },
          { name: 'Projects / awards / volunteering', type: 'repeatable', notes: 'Optional additive sections (standard).' },
        ],
      },
      {
        group: 'CV settings',
        items: [
          { name: 'Set default CV', type: 'toggle', notes: 'Candidates can keep multiple CVs.' },
          { name: 'Searchable by employers', type: 'toggle (visibility)', required: true, notes: 'Privacy standard — controls whether the CV appears in employer talent search / consent.' },
        ],
      },
    ],
    known: [
      'Two CV types: Online CV (form) + Uploaded CV (file) — modelled on Vietnamworks.',
      'Resumes are member-created.',
    ],
    unknown: [
      'The "unlock price" model — candidate-paid paywall vs employer-side unlock.',
      'The permission model for employer / Admin viewing candidate CVs.',
      'Full Online-CV section set + file types/size limits for Uploaded CVs.',
    ],
    clientQuestions: [
      'Resume "unlock price" implies paid CV access — is that a candidate-facing paywall, or purely an employer-side unlock? Confirm the monetisation model.',
    ],
    adminStoreRelation:
      'Resumes are member-created; employers / Admin view them via candidate search — needs the unlock / permission model defined.',
    related: ['emp-talent-search', 'emp-credits', 'admin-resumes'],
  },

  // ── Resume templates & downloads ────────────────────────────────────────
  {
    id: 'js-resume-templates',
    code: 'JS-RESUME-TPL-01',
    surface: SURFACE,
    title: 'Resume templates & downloads',
    status: 'built-mock',
    summary: 'Browse downloadable resume templates (PDS-resume download pages).',
    description:
      'Gallery of template thumbnails; click → preview + download. Card = thumbnail image + name + download button. Optional category / filter tabs.',
    unknown: ['Templates are currently hard-coded — should move to Admin.'],
    adminStoreRelation:
      'Templates (files + thumbnails) should be uploaded / managed in Admin (likely Content module) rather than hard-coded.',
    related: ['js-resumes', 'admin-pages'],
  },

  // ── Notifications ───────────────────────────────────────────────────────
  {
    id: 'js-notifications',
    code: 'JS-NOTIF-01',
    surface: SURFACE,
    title: 'Notifications',
    status: 'live-wired',
    summary: 'In-app bell (list + read-marking); the same events also reach the candidate by email / push / SMS / Zalo.',
    description:
      'Bell icon in the header with an unread-count badge → dropdown list. Unread rows highlighted; "mark all read" action; click navigates to the related screen. In-app is one channel of the wider Notifications system (email / push / SMS / Zalo ZNS).',
    sections: [
      {
        heading: 'What the candidate is notified about (standard)',
        items: [
          'Application status changes (viewed / shortlisted / interview / offer / rejected).',
          'New matching jobs — job alerts from a saved search / followed company.',
          'Employer messages & interview invites; CV viewed by an employer.',
          'Account: email verification, password reset, security alerts.',
        ],
      },
    ],
    behaviors: [
      'Unread badge + "mark all read"; click → deep-link to the related screen.',
      'Standard: a notification preferences screen lets the candidate choose channels per type (email / push / SMS / Zalo) and opt out.',
    ],
    known: ['In-app bell is live-wired on the Store side.'],
    unknown: [
      'Which channels beyond in-app at launch (email / push / SMS / Zalo ZNS).',
      'Per-user notification preferences + opt-out (standard, and needed for compliance).',
    ],
    clientQuestions: ['Which channels at launch, and do we ship a notification-preferences screen?'],
    adminStoreRelation:
      'Messages are generated by system events; content / templates / channels are defined in the Admin Notifications module.',
    externalSystems: ['Zalo ZNS', 'Email', 'Push', 'SMS'],
    related: ['admin-notif-templates', 'admin-notif-events', 'admin-notif-workflows'],
  },

  // ── Companies directory ─────────────────────────────────────────────────
  {
    id: 'js-companies',
    code: 'JS-COMPANY-01',
    surface: SURFACE,
    title: 'Companies directory',
    status: 'live-wired',
    summary:
      'Company list + rich company detail: info-at-a-glance, welfare/benefits, reviews & ratings, photos, that company’s jobs, and a follow button.',
    description:
      'Company list → company profile page with tabbed sections. The client’s open question is depth: "simple like Vietnamworks" vs "rich like ITviec". The rich model (ITviec/Glassdoor-style) is the current standard — company reviews with sub-ratings drive candidate trust.',
    uiFields: [
      {
        group: 'Profile header',
        items: [
          { name: 'Logo + cover image', type: 'image' },
          { name: 'Name, industry, size, location(s), website', type: 'fields' },
          { name: 'Follow company', type: 'button', notes: 'Standard — feeds job alerts for that company.' },
          { name: 'Overall rating', type: '★ + count', notes: 'Aggregated from reviews (ITviec/Glassdoor pattern).' },
        ],
      },
      {
        group: 'Tabs / sections',
        items: [
          { name: 'About / overview', type: 'rich text' },
          { name: 'Why join us / culture', type: 'rich text + media' },
          { name: 'Benefits / welfare', type: 'list' },
          { name: 'Photos / gallery', type: 'images' },
          { name: 'Reviews & ratings (UGC)', type: 'section', notes: 'Sub-ratings: work-life balance, culture & values, career, compensation.' },
          { name: 'Open jobs', type: 'job-card list' },
        ],
      },
    ],
    sections: [
      {
        heading: 'Depth options (client decision)',
        items: [
          'Simple (VietnamWorks-style): header + about + benefits + open jobs.',
          'Rich (ITviec / Glassdoor-style, current standard): adds reviews & ratings, "why join us", photos, follow — bigger trust signal but a UGC/moderation surface.',
        ],
      },
    ],
    unknown: [
      'Simple vs rich profile (client): "simple like Vietnamworks or more info like ITviec?".',
      'Reviews / interviews are UGC — in scope? who moderates, and legal exposure.',
      'Review model: overall + sub-ratings (work-life / culture / career / compensation)?',
    ],
    clientQuestions: [
      'Company detail UI: simple like VietnamWorks, or rich like ITviec (reviews, ratings, "why join us")?',
      'Is user-generated review / interview content in scope, and who moderates it? (Big legal / moderation surface.)',
      'Which company-profile sections launch first?',
    ],
    adminStoreRelation:
      'Company profile fields come from Admin (Companies module); reviews / interviews are member-submitted — needs a moderation flow (approve/reject) in Admin.',
    externalSystems: ['Company master data (Admin)'],
    related: ['admin-company-list', 'admin-company-detail', 'js-job-detail', 'xc-ugc'],
  },

  // ── Salary explorer ─────────────────────────────────────────────────────
  {
    id: 'js-salary',
    code: 'JS-SALARY-01',
    surface: SURFACE,
    title: 'Salary explorer',
    status: 'built-mock',
    summary:
      'Salary data by category with charts, top-5 / hot-100, trend arrows, tabs, filters, an AI callout and a disclaimer.',
    description:
      'Salary explorer page: filters on top, charts + ranked lists below. Category/role filter → salary chart (range, average) with up/down trend arrows. Top-5 / Hot-100 salary lists; a small AI insight callout; a legal disclaimer footer.',
    unknown: [
      'Origin of the salary data (aggregated / licensed / manual).',
      'How the data is loaded / refreshed.',
      'Legal / accuracy disclaimer wording.',
    ],
    clientQuestions: [
      'Where does salary data come from — real aggregated data, licensed data, or manually curated?',
      'What disclaimer wording is required for accuracy / legal?',
    ],
    adminStoreRelation:
      'Depends entirely on a salary data source — confirm origin and refresh mechanism.',
    related: ['js-lists'],
  },

  // ── Senior list / career info ───────────────────────────────────────────
  {
    id: 'js-career-info',
    code: 'JS-CAREER-01',
    surface: SURFACE,
    title: 'Senior list / career info',
    status: 'built-mock',
    summary: 'Career-information hub including a "senior list" surface.',
    description:
      'Content hub: article/list layout for career info + a "senior" section. List of articles/guides with thumbnails; detail = article page.',
    unknown: ['What "senior list" means in the VN context (senior jobs? senior talent?).'],
    clientQuestions: ['Confirm what "senior list" means in VN — senior-level jobs, or senior (older) talent?'],
    adminStoreRelation:
      'Articles should be managed via Admin Content / CMS (currently prototype-only) rather than hard-coded.',
    related: ['admin-boards', 'admin-blog'],
  },

  // ── Curation ────────────────────────────────────────────────────────────
  {
    id: 'js-curation',
    code: 'JS-CURATION-01',
    surface: SURFACE,
    title: 'Curation',
    status: 'built-mock',
    summary:
      'Editorialised / personalised job recommendation page with promo banners and info panels.',
    description:
      'Curated landing: promo banners on top, themed job sections below. Editor-picked groupings ("jobs for you", themed collections) + info panels.',
    unknown: ['Overlap with Home sections — is Curation a separate page or part of Home?'],
    clientQuestions: ['Is Curation a separate page, or part of the Home section-builder?'],
    adminStoreRelation:
      'Banners + which collections show should be Admin-managed (ties into the Home section-builder + Banners module).',
    related: ['js-home', 'admin-banners'],
  },

  // ── Tools — character counter ────────────────────────────────────────────
  {
    id: 'js-tool-counter',
    code: 'JS-TOOL-01',
    surface: SURFACE,
    title: 'Tools — character counter',
    status: 'built-mock',
    summary: 'Self-intro character counter with live stats, spell-check results, and a hot-jobs sidebar.',
    description:
      'Text editor tool: type/paste text, live counters + checks on the side. Live char/word count, byte count; spell-check result list. Sidebar with hot jobs (promo).',
    unknown: ['Whether this ships at launch (nice-to-have).', 'Spell-check needs a VN language service.'],
    clientQuestions: ['Does the character-counter tool ship at launch?'],
    adminStoreRelation:
      'Mostly self-contained; spell-check needs a VN language service; hot-jobs sidebar reads live jobs.',
    related: ['js-tool-coaching'],
  },

  // ── Tools — personal-statement coaching ───────────────────────────────────
  {
    id: 'js-tool-coaching',
    code: 'JS-TOOL-02',
    surface: SURFACE,
    title: 'Tools — personal-statement coaching',
    status: 'built-mock',
    summary: 'AI-style self-introduction / cover-letter coaching tool with analysis results.',
    description:
      'Input box → "analyze" → results panel with feedback / scores. The user writes a cover letter / self-intro and gets AI suggestions + a rating. Needs a real AI service behind it (currently mock).',
    unknown: ['Launch scope.', 'Which AI provider and cost.'],
    clientQuestions: ['Does the AI coaching tool ship at launch, and which AI provider / cost model?'],
    adminStoreRelation: 'Self-contained but depends on an AI backend; no Admin management beyond enabling it.',
    externalSystems: ['AI service (TBD)'],
    related: ['js-tool-counter'],
  },

  // ── Behaviour tracking ────────────────────────────────────────────────────
  {
    id: 'js-behavior-tracking',
    code: 'JS-TRACK-01',
    surface: SURFACE,
    title: 'Behaviour tracking',
    status: 'live-wired',
    summary: 'Batched user-behaviour logging to backend (for search relevance / analytics).',
    description:
      'No UI — background tracking of clicks / views / searches. Silently batches events and sends them to the backend. Powers search relevance and feeds the Admin Analytics module.',
    unknown: ['Privacy / consent handling for VN.'],
    clientQuestions: ['Confirm privacy / consent handling for behaviour tracking under VN law.'],
    adminStoreRelation: 'Store logs the events; Admin Analytics reads them.',
    externalSystems: ['Analytics pipeline'],
    related: ['js-search', 'admin-analytics-dashboard', 'admin-user-behavior'],
  },
]
