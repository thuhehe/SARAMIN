import type { BuildModule } from './types'

/*
 * TEMPLATE MODULE — this is the depth bar for every other module.
 * Each feature carries a full `detail`: overview, user story, UI fields,
 * behaviours, rules, states, backend contract, acceptance criteria and open
 * questions. Authored against VN-market standards (VietnamWorks / TopCV).
 */

export const jobManagement: BuildModule = {
  id: 'job-management',
  title: 'Job management',
  owner: 'Luan',
  requirements: [
    {
      label: 'Jobs are posted from Admin AND the Company site',
      text: 'Company users can now post jobs themselves (previously draft-only). One shared Job entity and one status lifecycle across all three surfaces.',
      table: {
        cols: ['Surface', 'Company field', 'Sees'],
        rows: [
          ['Admin', 'Selected via the Company API (company ID)', 'All jobs'],
          ['Company site', 'Fixed to the user’s own company', 'Own jobs only'],
          ['Jobseeker', '—', 'Homepage + search results + job detail'],
        ],
      },
      warn: 'No HQ approval gate — company posts go live directly, exactly like Admin posts.',
    },
    {
      label: 'Job status lifecycle',
      table: {
        cols: ['Status', 'Means', 'Moves on when'],
        rows: [
          ['Draft', 'Not published', 'Publish is pressed'],
          ['Schedule', 'Will publish at a future time', 'Auto-publishes to Open at the chosen time'],
          ['Open', 'Live on the jobseeker site', 'Auto-moves to Closed at the deadline'],
          ['Closed', 'Post expired', '—'],
        ],
      },
      items: ['The Publish action offers “Post now” (→ Open) or “Schedule for later…” (→ Schedule, with a date/time picker).'],
    },
    {
      label: 'Exposure is a SEPARATE On / Off switch',
      text: 'Independent of status: an Open job can be hidden from jobseekers by turning Exposure Off, without changing its status.',
      warn: 'Only Open + Exposure On is publicly visible.',
    },
    {
      label: 'Bilingual content, per-field language tab',
      text: 'VI / EN / KO tabs sit on the same row as the field, for job title, role & responsibility, skills & qualifications and benefits.',
      table: {
        cols: ['Language', 'Required?', 'Behaviour'],
        rows: [
          ['Vietnamese', 'Always required', 'The default AND the fallback'],
          ['English / Korean', 'Optional', 'If a translation is missing, the Vietnamese value is shown'],
        ],
      },
    },
    {
      label: 'Structured job fields',
      table: {
        cols: ['Field', 'Values'],
        rows: [
          ['Posting package', 'Free · Basic · Basic Plus · Distinction · Top Job — drives visibility / ranking (see Products & Packages)'],
          ['Job level', 'Intern/Student · Fresher/Entry · Experienced (non-manager) · Manager · Director and above'],
          ['Job type', 'Full-time · Part-time · Internship · Online · Freelancer · Seasonal · Other'],
          ['Other', 'Experience range · skills · salary (from–to + currency)'],
        ],
      },
    },
    {
      label: 'Job taxonomy is MASTER DATA, not free text',
      text: 'A two-level Job Category → Role (job title) list, maintained on Admin (System → Job categories & roles). The job form’s dropdowns and the jobseeker search filters both read this list, so adding a role is a data change, not a code change.',
      warn: 'A job “Role” (e.g. Software Developer) is a job TITLE — unrelated to the admin RBAC roles in Admin roles & operators.',
    },
    {
      label: 'JOB SKILLS — the employer half of the match',
      text: 'A job’s skills and a CV’s skills are the SAME master rows seen from two sides — that identity is the entire reason matching works, and it only holds because neither side can type free text. The taxonomy rules (master data, aliases, the request-a-skill loop, curation) are shared and live in Resume management → SKILLS on the CV; this block covers only what is specific to the JOB side.',
      table: {
        cols: ['', 'CV skills', 'Job skills'],
        rows: [
          ['Entity', '`CvSkill` — cvId · skillId', '`JobSkill` — jobId · skillId'],
          ['Cap', '20 per CV', '10 per job'],
          ['Written by', 'the candidate', 'the employer (Admin or Company site)'],
          ['How they are added', 'autocomplete · role suggestions · AI extraction from an uploaded PDF', 'autocomplete only'],
          ['What they do', 'make the candidate findable', 'rank the candidate pool'],
        ],
      },
      items: [
        'NEVER `text[]` — a free-text job skill cannot join to a CV skill, and the failure is SILENT: matching returns nothing and reads as a ranking bug rather than a data bug. Autocomplete against the taxonomy is the only input path on the job form.',
        'THE CAPS DIFFER ON PURPOSE — a CV describes a person’s whole range (20), a job describes one role’s requirements (10). Phase-1 ranks on OVERLAP COUNT, so a job carrying 25 skills would flatten the ranking: everyone overlaps a little and nobody stands out.',
        'YES, CAP BOTH SIDES — unlimited is wrong on both, but for OPPOSITE reasons, and that asymmetry is what sets the numbers. On the JOB side more skills makes the score WORSE (the ratio below), so the cap is mostly self-enforcing and 10 just stops the worst of it. On the CV side more skills is strictly BETTER — the candidate’s own list never enters the denominator, so a 50-skill CV weakly dominates a 10-skill one and the only thing standing between us and skill spam is the cap itself. The CV cap is the load-bearing one: job 10, CV 20.',
        'WHY 10 AND 20 SPECIFICALLY — a real job has 4–8 genuinely differentiating requirements, so 10 is headroom rather than a squeeze; a real person has 10–15 skills worth listing across their range, so 20 is headroom too. Both are deliberately generous: a cap that bites in normal use generates support tickets, and a cap that never bites in normal use only ever stops abuse.',
        'MEASURE BEFORE CHANGING EITHER NUMBER — track the distribution of skills-per-CV and skills-per-job. If the median sits near the middle and the 95th percentile is nowhere near the cap, the cap is doing its job silently. If a mass of CVs sit exactly AT 20, the cap has become a target and the honest fix is lowering it, not raising it.',
        'THE CAP IS A QUALITY GUARDRAIL, NOT A LIMIT TO BE LIFTED — and this is why it must not become a paid tier. The skills component of the match score is a RATIO: matched job skills ÷ all job skills. Adding skills grows the denominator, so every candidate’s score falls. Worked example, same role and same candidate: a job listing 6 skills where they match 5 scores 5⁄6 → 29 of 35. Widen the same job to 18 skills and they now match 7 → 7⁄18 → 14 of 35. Fifteen points lost, and the employer who paid MORE sees a worse-looking shortlist than the one who paid less.',
        'AND THE RANKING GETS NOISIER, not just lower. Skills past the first handful are the universal ones — Excel, Word, Teamwork, communication — which almost every candidate has. They lift the numerator by roughly the same amount for everybody, so they add no discrimination at all: pure noise bought at a premium. Beyond about 8 skills an employer is no longer describing a role, they are describing a team.',
        'THE NORMALISATION IS NOT OPTIONAL, before anyone proposes removing it to make the paid tier “work”. Scoring the RAW COUNT of matched skills instead would make more skills always better — and would then let a job with 30 skills outrank every well-specified job for every candidate, reward skill spam, and make scores incomparable between postings. The dilution is the mechanism that keeps jobs honest; it is not a bug to engineer around.',
        'WHAT TO SELL INSTEAD, since none of this leaves a revenue hole: the catalogue already monetises the things where more genuinely IS more — number and duration of postings, refresh and bump, placement and banner visibility, CV-search unlock credits, recruiter seats. Every one of those grows reach without touching match quality. Skill count is the one lever where the customer pays to make their own result worse.',
        'IF THE COMMERCIAL SIDE WILL NOT LET GO, sell PRECISION rather than QUANTITY — a paid tier that lets an employer mark up to 3 skills as MUST-HAVE, weighted ×3 in the ratio. It sharpens the shortlist instead of blurring it, it is a genuine product difference worth paying for, and it is defensible in a support call. Note it reopens the must-have / nice-to-have split that Phase-1 deliberately parked, so it is a Phase-2 conversation, not a quiet config change.',
        'SKILLS RANK, THEY NEVER EXCLUDE — a flat list where every entry filtered would narrow the pool to nothing by the fourth or fifth pick. Ranking reads skill overlap plus the profile fields (total years, level, location).',
        'THE LIVE POOL LINE — “≈ 224 candidates have all of these”, shown under the field so an employer sees how rare their combination is BEFORE publishing. Informational, never a gate.',
        'DO NOT SHIP THE POOL FORMULA — the prototype multiplies per-skill selectivity rates against a base pool, which assumes skills are INDEPENDENT — they are not: React and TypeScript co-occur heavily, so the product understates the true count, and the error compounds with every skill added. Production must COUNT THE INDEX, not multiply rates.',
        'NO must-have / nice-to-have SPLIT — Phase-1 is one flat list, no per-skill weight, no required flag. This was discussed and parked, then lost when an earlier warn block was removed; recording it here so it is a decision rather than an omission. Revisit when ranking quality is measurable: a required flag that EXCLUDES contradicts the rule above, so any Phase-2 version must weight, not filter.',
        'SUGGESTIONS, keyed on the job’s own ROLE — under the field: “Common for Software Developer · essential first” with one-tap chips. Read from the SAME `occupation_skill` map the candidate side uses; the only difference is which end it is entered from — the JOB keys on its own `job_role` and needs nothing else, while the CANDIDATE side reads their work experience first and falls back to their desired role (see Resume management → Skills). A job has no history to read, so there is no experience source here and no fallback chain. No new table, no demand data.',
        'THE ROLE SUGGESTS, IT NEVER RESTRICTS — this is the distinction to hold. `job_role` decides which 6 skills appear without typing; the autocomplete still reaches EVERY row in the master list. Restricting a job to its role’s skills would break real postings on day one: a Software Developer job at a Japanese outsourcer needs Japanese, at a studio needs Figma, at an ERP shop needs SAP. And `occupation_skill` currently holds ~4 skills per role, so a restriction would make most jobs unpostable. Same rule on the candidate side — desired role drives suggestions, never permission.',
        'MULTIPLE ROLES UNION their suggestions — the job form accepts more than one role, so a job tagged “Software Developer + DevOps Engineer” draws from both maps, de-duplicated. A skill that is ESSENTIAL for ANY of the roles counts as essential. Matches the candidate-side rule for someone with several desired roles; reading only the first role would silently drop half the advice.',
        'ESSENTIAL BEFORE OPTIONAL, and the ordering IS the advice — `occupation_skill` already carries that flag, so “Git and TypeScript before Kubernetes” costs nothing to compute. Essentials render solid, optionals dashed, so the hierarchy survives even when an employer only skims. Excludes what is already on the job; capped at 6; hidden once the job hits 10 skills.',
        'NEVER AUTO-ADD a suggestion. A skill the employer did not choose silently changes who the job ranks, and they would have no reason to look for the cause. One tap each, always.',
        'WHY THIS MATTERS MORE ON THE JOB SIDE — a candidate who omits a skill loses one match. An employer who omits one mis-ranks their whole shortlist, and the pool line makes over-picking visible while nothing at all warned them about under-picking. Suggestions are the counterweight.',
        'NEEDS A COMMERCIAL DECISION, not an engineering one — the position above is a recommendation and the client owns the call. Take it to them with the arithmetic, not the principle: “the customer who buys 18 skills sees their best candidate at 79% where the customer who bought 6 sees the SAME candidate at 94%” is an argument a sales lead can act on. The absolute totals move with the other eight signals; the 15-point gap does not, because widening the skill list is the only thing that changed. “Do not monetise match quality” is not.',
        'NOT the rich-text field — the job form also has a free-text “Your skills & qualifications” block, and the two must never be confused. That one is bilingual prose a human reads and nothing indexes it; JobSkill rows are what matching actually uses.',
      ],
    },
  ],
  features: [
    // 0 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Create job',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-job-create',
      detail: {
        description:
          'Admin-side job create / edit form. HQ staff can post a job on behalf of any company (data-entry / concierge posting) and it is the same Job entity the Company site writes to. Publishing goes straight to Open (or Schedule) — there is no approval gate on either surface.',
        userStory:
          'As an HQ operator, I want to create or edit a job for any company so that we can onboard postings on behalf of clients and fix bad data.',
        uiFields: [
          {
            group: 'Basics',
            items: [
              { name: 'company', type: 'ref → Company', required: true, notes: 'searchable picker resolved via the Company API (company ID); drives branding on the JS side. Fixed to the user’s own company on the Company site.' },
              { name: 'title (vi / en)', type: 'i18n string', required: true, notes: 'bilingual — Vietnamese + English; max 120 chars each' },
              { name: 'exposure', type: 'toggle (On / Off)', required: true, notes: 'separate switch (not a status) — whether an Open job shows on the jobseeker site (hiển thị trên trang jobseeker hay không)' },
              { name: 'purchaseOrder', type: 'ref → PO', notes: 'required ONLY for paid products — pick the PO FIRST (a customer can have more than one active PO), then the product list is scoped to that PO’s lines. The Free package needs no PO.' },
              { name: 'packageType (product)', type: 'enum', required: true, notes: 'Free · Basic · Basic Plus · Distinction · Top Job — the posting tier that drives visibility / ranking. FREE can be chosen by Admin at any time with no PO and no preconditions; paid products are chosen from the selected PO.' },
              { name: 'jobCategory / industry', type: 'enum', required: true, notes: 'category = the role area · industry = the company sector (two different axes)' },
              { name: 'jobLevel', type: 'enum', notes: 'Intern/Student · Fresher/Entry level · Experienced (non-manager) · Manager · Director and above' },
              { name: 'jobType', type: 'enum', required: true, notes: 'Full-time · Part-time · Internship · Online Jobs · Freelancer · Seasonal · Other' },
            ],
          },
          {
            group: 'Location, experience & salary',
            items: [
              { name: 'workLocations', type: 'Location[]', required: true, notes: 'up to 3; each entry is a province/city PLUS a street address — Location field then Address' },
              { name: '· location (province / city)', type: 'enum per entry', required: true, notes: 'the city/province half of each work location' },
              { name: '· address (street · building)', type: 'string per entry', notes: 'the street address half of each work location' },
              { name: 'experienceFrom / experienceTo', type: 'number (years)', notes: 'years of experience as a MIN–MAX range (not a single minimum)' },
              { name: 'salaryType', type: 'radio', required: true, notes: 'Negotiable ("Thỏa thuận") OR a from–to range' },
              { name: 'salaryMin / salaryMax', type: 'number (VND)', notes: 'required only when salaryType = range' },
            ],
          },
          {
            group: 'Content (bilingual)',
            items: [
              { name: 'roleResponsibility (vi / en)', type: 'i18n rich text', required: true, notes: 'Your role & responsibility — 2 languages' },
              { name: 'skillsQualifications (vi / en)', type: 'i18n rich text', required: true, notes: 'Your skills & qualifications — 2 languages' },
              { name: 'benefits (vi / en)', type: 'i18n rich text', notes: '2 languages' },
              { name: 'skills', type: 'JobSkill[] → Skill taxonomy', notes: 'ONE flat list, cap 10, autocomplete only — never free text. Skills rank candidates, they never exclude. A live pool line shows how rare the combination is. Full rules: the JOB SKILLS requirement above; shared taxonomy rules in Resume management → SKILLS on the CV' },
              { name: 'contactPerson', type: 'ref → Company user', required: true, notes: 'the named person candidates see as the recipient of their application' },
              { name: 'applicationRecipientEmails', type: 'string[]', required: true, notes: 'one or more emails that receive each application; the NAME shown to candidates is the contactPerson above' },
              { name: 'deadline / expiry', type: 'date (derived)', notes: 'set by the selected product’s duration (e.g. Free = 14 days) rather than typed by hand; drives auto-expiry (Open → Closed)' },
            ],
          },
        ],
        behaviors: [
          'Save as draft at any time; validation only runs on publish.',
          'Publish offers "Post now" (→ Open immediately) or "Schedule for later…" (→ Schedule, pick a date/time). A Scheduled job auto-publishes to Open at that time.',
          'An Open job auto-moves to Closed when its deadline passes.',
          'Exposure (On / Off) is independent of status: an Open job with Exposure Off stays hidden from jobseekers without changing its status. Only Open + Exposure On is publicly visible & applyable.',
          'Bilingual fields are entered per language via a VI / EN tab; VI is required, EN optional in Phase-1.',
          'Editing an Open job keeps it Open; a full audit entry is written (who / when / what).',
        ],
        rules: [
          'A job must belong to exactly one company.',
          'salaryMax ≥ salaryMin when both are set (range mode only).',
          'experienceTo ≥ experienceFrom when both are set.',
          'deadline must be in the future on publish.',
          'Admin can post regardless of the company’s remaining posting quota (concierge override) — flagged in the audit log.',
        ],
        states: ['Empty new form', 'Editing existing', 'Validation errors', 'Draft', 'Scheduled', 'Open (published)', 'Closed (expired)'],
        backend: {
          dataModel: [
            { name: 'id', type: 'uuid' },
            { name: 'companyId', type: 'uuid', required: true, notes: 'from Company API' },
            { name: 'title / roleResponsibility / skillsQualifications / benefits', type: 'i18n jsonb', notes: '{ vi, en } per field' },
            { name: 'status', type: 'enum', notes: 'draft · schedule · open · closed' },
            { name: 'scheduledAt', type: 'timestamp', notes: 'set when status = schedule; auto-publishes to open at this time' },
            { name: 'exposure', type: 'bool (on/off)', notes: 'independent of status; gates public visibility of an Open job' },
            { name: 'packageType', type: 'enum', notes: 'free · basic · basic_plus · distinction · top_job' },
            { name: 'contractType / jobType', type: 'enum', notes: 'full_time|freelancer / in_office|remote|hybrid|oversea' },
            { name: 'salaryType / salaryMin / salaryMax', type: 'enum(negotiable|range) / int / int' },
            { name: 'experienceFrom / experienceTo', type: 'int (years)' },
            { name: 'locations', type: 'jsonb', notes: 'city list' },
            { name: 'JobSkill', type: 'entity', notes: 'jobId · skillId — NOT text[]. A free-text skill cannot join to a CV skill, and the failure is silent: matching returns nothing and reads as a ranking bug' },
            { name: 'deadline', type: 'date' },
            { name: 'createdBy / source', type: 'uuid / enum(admin|company)' },
          ],
          endpoints: [
            'POST /admin/jobs — create (draft or active)',
            'PUT /admin/jobs/:id — edit',
            'POST /admin/jobs/:id/publish',
            'GET /admin/companies?q= — company picker',
          ],
          notes: 'Same jobs table as the Company site; `source` distinguishes admin vs company-created.',
        },
        acceptance: [
          'HQ can create a job for any company and it appears active on the JS site.',
          'Draft → Publish transitions correctly; audit log records the actor.',
          'Negotiable salary renders as "Thỏa thuận" everywhere downstream.',
        ],
        openQuestions: [
          'Can a job target multiple cities, or exactly one? (client to confirm — spec currently assumes multiple)',
          'Bilingual = VI + EN (assumed) or VI + KO? Is the second language required or optional in Phase-1?',
          'Which job categories/industries are the canonical list for VN? (need the master taxonomy)',
          'Is a gender / age preference field allowed by policy? (legal review)',
        ],
      },
    },
    // 1 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Create job',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      notes: "Company user can't post job today (draft only); SVN wants company users to post by themselves.",
      mockup: 'co-create-job',
      detail: {
        description:
          'Self-service job posting for company (employer) users — the key new capability vs today, where companies can only save drafts. Same fields as the Admin form, constrained by the company’s package quota. No HQ approval gate — company posts go live directly (Open / Schedule), exactly like Admin.',
        userStory:
          'As a company HR user, I want to post a job myself and have it go live immediately, so that I don’t have to wait for HQ.',
        uiFields: [
          {
            group: 'Same job fields as Admin',
            items: [
              { name: '(all Basics / Location / Content fields)', type: '—', notes: 'incl. bilingual title & content, exposure status, experience range, job & contract type — company is fixed to the user’s own company (not editable)' },
            ],
          },
          {
            group: 'Posting options',
            items: [
              { name: 'packageType', type: 'enum', required: true, notes: 'Free · Basic · Basic Plus · Distinction · Top Job — consumes the matching purchased slot' },
              { name: 'featuredUpgrade', type: 'enum', notes: 'optional: main-ad / rank boost (from Products & Packages)' },
            ],
          },
        ],
        behaviors: [
          'Company is auto-set to the logged-in user’s company; not selectable.',
          '"Post now" → Open immediately; "Schedule for later…" → Schedule (auto-publishes to Open at the set time). No HQ approval step.',
          'If no posting quota remains → block publish and deep-link to purchase a package.',
          'Draft is always allowed and does not consume quota.',
          'Exposure (On / Off) lets the company take a live job down without closing it.',
        ],
        rules: [
          'Only HR Manager / HR Specialist roles can create jobs (see Account management).',
          'Publishing (Open / Schedule) consumes exactly one posting slot; drafts do not.',
          'A company can only edit its own jobs.',
        ],
        states: ['Draft', 'Scheduled', 'Open', 'Closed', 'Quota exhausted (blocked)'],
        backend: {
          endpoints: [
            'POST /company/jobs — create draft / publish (open) / schedule',
            'PUT /company/jobs/:id',
            'GET /company/quota — remaining posting slots',
          ],
          integrations: ['Products & Packages (quota)', 'Notifications (publish / scheduled confirmation)'],
          notes: 'Writes the same Job entity; `source = company`, `status = open` on publish (or `schedule`).',
        },
        acceptance: [
          'A company user can post a job and see it go live (Open) immediately — no approval wait.',
          'A posting slot is consumed on publish (Open / Schedule), not on draft.',
          'Company can take a live job down via Exposure Off and re-expose it before the deadline.',
        ],
        openQuestions: [
          'Any post-publish spam / abuse controls now that there is no pre-publish approval gate?',
        ],
      },
    },
    // 2 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-job-list',
      detail: {
        description:
          'HQ master list of every job across all companies for oversight: filter, view, edit, close, or take down (Exposure) any posting. No approval queue — company posts go live directly.',
        userStory: 'As an HQ operator, I want to see and manage every job across all companies so I can oversee and fix any posting.',
        uiFields: [
          {
            // In screen order, left to right — the list is the oversight view, so
            // every column is either an identity, a state, or a performance number.
            group: 'Table columns',
            items: [
              { name: 'job title', type: 'text link', required: true, notes: 'the first column — opens the job detail; shows the Vietnamese title (EN/KO fall back to VI)' },
              { name: 'job ID', type: 'code', required: true, notes: 'second column, right after the title — the posting’s unique reference (e.g. JOB-2109) for support / search / cross-linking' },
              { name: 'category', type: 'ref → master data', notes: 'the Job Category half of the Category → Role taxonomy (System → Master data)' },
              { name: 'company', type: 'ref → Company', required: true, notes: 'the account the posting belongs to' },
              { name: 'product', type: 'enum', required: true, notes: 'which posting package the job is using — Free · Basic · Basic plus · Distinction · Top Job' },
              { name: 'created by', type: 'badge', required: true, notes: 'Company (their own HR user) · Admin (HQ posted on their behalf) — neither goes through an approval gate' },
              { name: 'status', type: 'enum badge', required: true, notes: 'Draft · Schedule · Open · Closed — see the “Status values” table below; also drives the tabs above the table' },
              { name: 'exposure', type: 'enum indicator', required: true, notes: 'On · Off · — (not applicable) — see the “Exposure values” table below. A separate switch, NOT a status' },
              { name: 'posted', type: 'date', notes: 'when it went (or will go) live — “—” while Draft' },
              { name: 'expires', type: 'date', notes: 'the application deadline; the job auto-moves to Closed at this date' },
              { name: 'views', type: 'count', notes: 'job-detail views on the jobseeker site' },
              { name: 'saves', type: 'count', notes: 'how many jobseekers saved it — the demand signal next to views' },
              { name: 'applied', type: 'count → link', notes: 'applications received; opens the Applicants board filtered to this job' },
            ],
          },
          {
            group: 'Status tabs',
            items: [
              { name: 'All · Draft · Schedule · Open · Closed', type: 'tabs with counts', required: true, notes: 'the status filter, shown as counted tabs so the size of each bucket is visible before filtering' },
            ],
          },
          {
            group: 'Filters',
            items: [
              { name: 'keyword', type: 'search', notes: 'job title' },
              { name: 'company', type: 'search / ref' },
              { name: 'category', type: 'select', notes: 'from the same master-data taxonomy as the column' },
              { name: 'created by', type: 'enum', notes: 'Company · Admin' },
              { name: 'status', type: 'multi-select', notes: 'Draft · Schedule · Open · Closed (same as the tabs)' },
              { name: 'exposure', type: 'toggle filter', notes: 'On / Off — only narrows Open jobs, since exposure is undefined for the rest' },
              { name: 'date range', type: 'date range', notes: 'against posted or expires — which one is the open question below' },
            ],
          },
          {
            group: 'Page actions',
            items: [
              { name: '+ New job', type: 'button', notes: 'HQ posts on a company’s behalf — the company is chosen on the form (see Create job, Admin)' },
              { name: 'Duplicate', type: 'button (on the job detail)', notes: 'copies the posting into a new Draft so a similar job can be re-posted without re-typing it' },
              { name: 'Preview / view post', type: 'link (on the job detail)', notes: 'context-aware: Draft or Schedule → a preview link for the unpublished draft; Open → the live jobseeker job post; Closed → the (expired) post' },
            ],
          },
          {
            // The Saves number on its own says how much demand there is; HQ asked to
            // see WHO, because a saver is a warm candidate worth sourcing.
            group: 'Job detail — “Saved by” panel',
            items: [
              { name: 'jobseeker', type: 'ref → Jobseeker', required: true, notes: 'name + current title + years of experience; opens the candidate’s profile' },
              { name: 'location', type: 'text', notes: 'the saver’s city — shows whether the demand matches the job’s location' },
              { name: 'saved at', type: 'relative date', required: true, notes: 'when they saved it; the list is newest first' },
              { name: 'applied?', type: 'badge', required: true, notes: 'whether that saver also applied — separates “interested” from “converted”' },
              { name: 'view all', type: 'link', notes: 'the panel previews the most recent few and expands to the full list of savers' },
            ],
          },
        ],
        behaviors: [
          'Clicking the job title opens the job detail (same record the company sees, with HQ actions).',
          'Row actions: Edit · Close · Toggle exposure (On/Off) · View applicants.',
          'The job detail offers Duplicate — it clones the posting into a new Draft (never a live copy), so the operator edits and publishes it deliberately.',
          'The job detail always exposes a link to see the posting as a jobseeker would: the draft preview while Draft/Schedule, the live post once Open.',
          'The job detail lists WHO saved the job (name · title · location · when · whether they also applied), newest first, expandable to the full list — the Saves count alone does not tell HQ who the interested candidates are.',
          'The Exposure toggle is enabled only on Open jobs; on any other status the cell is inert.',
          'Sortable on posted, expires, views, saves and applied — the ranking questions HQ actually asks.',
          'Server-side pagination + filter + sort.',
        ],
        rules: [
          'Status and Exposure are two independent fields and are never merged into one column: status is the lifecycle (Draft → Schedule → Open → Closed), exposure is public visibility. Only Open + Exposure On is live and applyable on the jobseeker site.',
          'Exposure Off takes a live job down without closing it — reversible any time before the deadline, and it does not change the status.',
          'Closing a job is a manual, deliberate action (separate from auto-Close at the deadline).',
          'Editing an Open job keeps it Open; a full audit entry is written.',
          'The “Saved by” list is candidate PII: it is gated by the same permission as candidate/resume viewing, and opening a saver’s profile from here is written to the audit log. A save is never shown to the company as a contactable lead unless the candidate applied.',
          'Views / saves / applied are read-only counters here — they are never editable from this screen.',
        ],
        states: ['Loading', 'Empty (no jobs)', 'Filtered-empty', 'Has jobs'],
        backend: {
          dataModel: [
            { name: 'row', type: 'projection', notes: 'jobId, title(vi), categoryId + label, companyId + name, product/packageType, createdBySource(company|admin), status, exposure, postedAt, expiresAt, viewCount, saveCount, applicationCount' },
            { name: 'status', type: 'enum', required: true, notes: 'draft | schedule | open | closed — auto-transitions (schedule → open at publishAt, open → closed at expiresAt) are jobs, not user actions' },
            { name: 'exposure', type: 'bool', required: true, notes: 'independent of status; gates public visibility of an Open job' },
            { name: 'viewCount / saveCount / applicationCount', type: 'derived', notes: 'aggregates — never written from this screen' },
          ],
          endpoints: [
            'GET /admin/jobs?q=&status=&exposure=&company=&category=&createdBy=&from=&to=&sort=&page= → rows + per-status counts for the tabs',
            'PATCH /admin/jobs/:id/exposure { on|off }',
            'POST /admin/jobs/:id/close',
          ],
          integrations: ['Master data (Job categories & roles)', 'Application management (applied count → Applicants board)', 'Audit log'],
          notes: 'Edit / close / exposure changes write an audit entry. The tab counts come back with the list so they cannot disagree with the rows.',
        },
        acceptance: [
          'HQ can filter by status & exposure and act on any job (edit / close / toggle exposure).',
          'Company-created jobs appear as Open without any approval step.',
          'Every column in the list is populated from one request: title, category, company, created by, status, exposure, posted, expires, views, saves, applied.',
          'Exposure shows On / Off only for Open jobs and “—” for Draft / Schedule / Closed, and turning it Off hides the job from the jobseeker site without changing its status.',
          'The status tab counts match the number of rows each tab returns.',
        ],
        sections: [
          {
            heading: 'Status values',
            text: 'One field, four values, set by the lifecycle — never by hand except via Publish / Close.',
            table: {
              cols: ['Value', 'Means', 'On the jobseeker site', 'Leaves this value when', 'Exposure column shows'],
              rows: [
                ['Draft', 'Saved but never published', 'Not present', 'Publish is pressed → Open, or scheduled → Schedule', '—'],
                ['Schedule', 'Will publish at a chosen future time', 'Not present yet', 'The scheduled time arrives → Open (automatic)', '—'],
                ['Open', 'Published and within the deadline', 'Live — listed, searchable, applyable (only if Exposure On)', 'The deadline passes → Closed (automatic), or Close is pressed', 'On / Off'],
                ['Closed', 'Deadline passed, or closed by hand', 'Read-only notice, no apply', 'Terminal — a new posting means duplicating the job', '—'],
              ],
            },
            items: [
              'The tabs above the list are exactly these four values plus All, each with a count.',
              'Draft → Schedule → Open → Closed only moves forward; there is no re-open (that is a duplicate).',
            ],
          },
          {
            heading: 'Exposure values',
            text: 'A second, independent field: whether an already-published job is visible. It never changes the status, and the status never changes it.',
            table: {
              cols: ['Value', 'Applies when status is', 'On the jobseeker site', 'What HQ uses it for'],
              rows: [
                ['On', 'Open', 'Visible — listed, searchable, applyable', 'The normal state after publishing (default)'],
                ['Off', 'Open', 'Hidden everywhere — not listed, not searchable, not applyable', 'Take a live job down without closing it; reversible any time before the deadline'],
                ['— (n/a)', 'Draft · Schedule · Closed', 'Not public in any case', 'Nothing — the toggle is inert, the cell shows “—”'],
              ],
            },
            items: [
              'Public visibility is the AND of both fields: status = Open AND exposure = On. Any other combination is invisible to jobseekers.',
              'Turning Exposure Off does not pause the deadline — the job still auto-Closes on its expiry date.',
            ],
          },
        ],
        openQuestions: [
          'Any post-publish moderation / takedown workflow now that there is no pre-publish approval?',
          'Does the date-range filter apply to “posted” or to “expires”? (Or is it two separate filters — HQ asks both questions.)',
          'Are views / saves live counters or refreshed nightly? Live counters on a 1,200-row list is a real cost decision.',
          'Should Exposure Off pause the expiry clock? As specified it does not, so a job hidden for two weeks still expires on time.',
        ],
      },
    },
    // 3 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'co-job-list',
      detail: {
        description:
          'A company’s own postings dashboard: their jobs with live status, applicant counts and quick actions (edit, close, duplicate, upgrade to featured).',
        userStory: 'As a company HR user, I want to manage my own postings and see how many applicants each got.',
        uiFields: [
          {
            group: 'Cards / rows',
            items: [
              { name: 'title', type: 'text' },
              { name: 'status', type: 'badge', notes: 'Draft · Schedule · Open · Closed' },
              { name: 'applicants', type: 'count → links to Application list (CO)' },
              { name: 'views', type: 'count' },
              { name: 'deadline / days left', type: 'date' },
            ],
          },
        ],
        behaviors: [
          'Shows only the logged-in company’s jobs.',
          'Actions per job: Edit · Close · Duplicate · Upgrade (featured) · View applicants.',
          'Status tabs / filter: All · Draft · Schedule · Open · Closed.',
          'Empty state prompts "Post your first job".',
        ],
        rules: ['Scoped strictly to the user’s company.', 'Only Open / Scheduled jobs count against quota.'],
        states: ['Loading', 'No jobs yet (onboarding CTA)', 'Has jobs', 'Filtered-empty'],
        backend: {
          endpoints: ['GET /company/jobs?status=&page=', 'POST /company/jobs/:id/close', 'POST /company/jobs/:id/duplicate'],
          integrations: ['Application management (applicant counts)'],
        },
        acceptance: ['A company sees only its own jobs with accurate applicant counts and can act on each.'],
        openQuestions: ['Can a company re-open an expired job, or must they duplicate it?'],
      },
    },
    // 4 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list (Homepage)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-home',
      detail: {
        description:
          'The public jobseeker homepage: hero search, curated rails (Hot jobs, Top companies, jobs by category) and Admin-managed banner slots. First impression + primary entry into search.',
        userStory: 'As a jobseeker, I want to discover relevant jobs the moment I land, so that I can start applying quickly.',
        uiFields: [
          {
            group: 'Sections',
            items: [
              { name: 'hero search', type: 'keyword + location + CTA' },
              { name: 'quick category chips', type: 'links' },
              { name: 'Hot jobs rail', type: 'JobCard[]', notes: 'featured / boosted first' },
              { name: 'Top companies', type: 'CompanyCard[]' },
              { name: 'banner slots', type: 'Admin-managed', notes: 'see Banners & Popups' },
            ],
          },
        ],
        behaviors: [
          'Hero search submits into the Search-result page.',
          'Featured / boosted jobs (from Products & Packages) rank first in Hot jobs.',
          'Only Open jobs with Exposure On are eligible.',
          'Personalised rails if logged in (by preferences) — otherwise popular fallback.',
        ],
        rules: ['Only show Open jobs with Exposure On (never Draft / Schedule / Closed, or Exposure Off).', 'Respect banner scheduling + targeting.'],
        states: ['Guest', 'Logged-in (personalised)', 'Loading skeleton', 'No jobs (unlikely — fallback to popular)'],
        backend: {
          endpoints: ['GET /jobs/home — curated rails', 'GET /companies/top'],
          integrations: ['Products & Packages (boost ranking)', 'Banners & Popups'],
        },
        acceptance: ['Homepage renders active jobs, boosted ones rank first, hero search routes to results.'],
        openQuestions: ['Which rails are in Phase-1 exactly, and what drives "Hot"? (recency vs boost vs clicks)'],
      },
    },
    // 5 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list (Search result)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-search',
      detail: {
        description:
          'Keyword + filter search results with facets (industry, location, salary, level, experience, employment type), sorting and pagination. The workhorse discovery surface.',
        userStory: 'As a jobseeker, I want to filter and sort jobs so that I can zero in on the right roles.',
        uiFields: [
          {
            group: 'Query & facets',
            items: [
              { name: 'keyword', type: 'string' },
              { name: 'location', type: 'province multi-select' },
              { name: 'industry / category', type: 'multi-select' },
              { name: 'salary range', type: 'range' },
              { name: 'level / experience / employmentType', type: 'multi-select' },
              { name: 'sort', type: 'enum', notes: 'Relevance · Newest · Salary' },
            ],
          },
          {
            group: 'Result item',
            items: [{ name: 'JobCard', type: 'title, company, salary, location, tags, saved ♥, posted-ago' }],
          },
        ],
        behaviors: [
          'Filters reflect in the URL (shareable / back-button safe).',
          'Debounced keyword; facets apply instantly with result counts.',
          'Save (scrap) a job from the card without leaving results.',
          'Boosted jobs get limited priority but stay clearly relevant.',
        ],
        rules: ['Only active, non-expired jobs.', 'Salary sort treats "Thỏa thuận" as unranked / last.'],
        states: ['Loading', 'No results (suggest broadening)', 'Has results', 'Error / retry'],
        backend: {
          endpoints: ['GET /jobs/search?q=&filters…&sort=&page='],
          integrations: ['Search index (facets, relevance)', 'Scraps (saved jobs)'],
          notes: 'Consider a search index (e.g. Meilisearch/ES) vs SQL for facets + relevance — decision needed.',
        },
        acceptance: ['Filters + sort + pagination work and are URL-encoded; only active jobs appear.'],
        openQuestions: ['SQL vs dedicated search engine for Phase-1?', 'Is relevance ranking in scope, or newest-first only?'],
      },
    },
    // 6 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job detail',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      mockup: 'js-job-detail',
      detail: {
        description:
          'Full job posting page: all content, company block, salary/location/deadline meta, and the primary Apply CTA. The conversion surface — everything funnels here.',
        userStory: 'As a jobseeker, I want to read the full job and apply in one click so that applying is effortless.',
        uiFields: [
          {
            group: 'Header',
            items: [
              { name: 'title / company (logo, link to company detail)', type: 'text' },
              { name: 'salary · location · level · deadline', type: 'meta row' },
              { name: 'Apply CTA · Save ♥ · Share', type: 'actions' },
            ],
          },
          {
            group: 'Body',
            items: [
              { name: 'description / requirements / benefits', type: 'rich text' },
              { name: 'skills / tags', type: 'chips' },
              { name: 'similar jobs', type: 'JobCard[]' },
            ],
          },
        ],
        behaviors: [
          'Apply opens the Apply flow (see Application management); prompts login if guest.',
          'Save (scrap) toggles without navigation.',
          'Closed jobs show a notice and disable Apply.',
          'Company block links to the public Company detail page.',
        ],
        rules: ['Only Open jobs (Exposure On) are publicly reachable; Closed jobs are read-only with a notice.', 'Increment a view count (deduped) for analytics.'],
        states: ['Open (apply enabled)', 'Closed (apply disabled)', 'Guest (apply → login)', 'Already applied (show status)'],
        backend: {
          endpoints: ['GET /jobs/:slug', 'POST /jobs/:id/view', 'GET /jobs/:id/similar'],
          integrations: ['Application management (Apply)', 'Scraps', 'Company detail'],
        },
        acceptance: ['Full job renders; Apply routes correctly (with login gate); expired jobs disable Apply.'],
        openQuestions: ['Show "X applicants already applied" as social proof, or hide it?'],
      },
    },
  ],
}
