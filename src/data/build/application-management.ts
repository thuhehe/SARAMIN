import type { BuildModule } from './types'

/*
 * Application management — the apply flow and the three screens that watch an
 * application move.
 *
 * ⚠️ STATUS MODEL IS UNDER REVIEW (Aug 2026). Requirement blocks 1–3 below are
 * the decision doc, in reading order: (1) the client's own "AMS status model"
 * document from Huyền, (2) the resulting model, (3) what they must decide. Keep
 * them short — a PM reads them to make a call, not to build from.
 *
 * The two intermediate blocks — what the client asked for after reading their own
 * document, and our counter-suggestion — were REMOVED on request. They recorded
 * how we got here; block 2 already states where we landed. Recover them from git
 * history if the reasoning is ever challenged.
 *
 * The pre-review model (a stored screeningStatus of Pending → Forwarded /
 * Rejected-by-HQ) is GONE, column and all. Nothing stores a per-application
 * screening verdict any more: the CV carries the verdict, and this module's
 * `status` is computed from it. Recover the old model from git history if the
 * client rejects the change. The buildable detail lives on the Admin
 * "Application list" feature, and cv.status itself is defined in
 * Resume management → "CV qualification — apply & CV search".
 *
 * ONE application = one jobseeker + one job, and it carries TWO status
 * dimensions that must never be confused:
 *
 *   1. status  — Saramin's, DERIVED from the CV's status. Sent · Pending (the CV
 *                is in doubt; auto-sends at 24h) · Not sent (the CV was Rejected
 *                by an admin — never delivered, no timer) · Recalled. Blocked is
 *                user-level and recalls everything.
 *   2. stage   — the employer's hiring pipeline, defaulting to New → Reviewing
 *                → Shortlisted → Interview → Hired / Rejected. Owned by the
 *                company, which can RENAME/ADD/REMOVE stages, so these six are
 *                a default set and never a hard-coded enum. HQ is read-only.
 *
 *   Jobseeker applies ──┬─ CV Qualified ─▶ Sent ──▶ stage = New (employer's queue)
 *                       ├─ CV in doubt ──▶ Pending ──┬─ admin approves the CV ─▶ Sent
 *                       │                            ├─ admin rejects the CV ──▶ Not sent
 *                       │                            └─ 24h with no review ────▶ Sent (timer)
 *                       └─ CV Rejected ──▶ refused with the reason (fix or approve first)
 *
 *   The CV carries its verdict in from upload; applying re-checks nothing. The hold
 *   belongs to the CV, and ONE decision resolves every application waiting on it.
 *
 * The candidate-facing status in "My application" is a LABEL derived from those
 * two — never a third source of truth.
 *
 * Depth mirrors ./job-management.ts.
 */

export const applicationManagement: BuildModule = {
  id: 'application-management',
  title: 'Application management',
  owner: 'Luong',
  requirements: [
    {
      label: '1 · What the client sent us — “AMS status model” (Huyền)',
      text: 'Their document, summarised faithfully. 3 layers, 5 screening statuses. Nothing here is our opinion.',
      table: {
        cols: ['Layer', 'Statuses', 'Who sees it'],
        rows: [
          ['Layer 1 — LỌC (filter)', 'Waiting · Ready · NEI · Pending · Spam', 'Admin only'],
          ['Layer 2 — GỬI (send)', 'Đã gửi NTD · Đã thu hồi (Recall)', 'Admin'],
          ['Layer 3 — PHỄU NTD (funnel)', 'Chưa xem → Đã xem → Tiềm năng → Phỏng vấn → Nhận / Loại', 'Employer'],
        ],
      },
      items: [
        'Ready = sent to the employer immediately. There is no hold window, so a recall can only notify — it cannot un-send the email.',
        'A risk score decides the status: 0–29 Ready · 60–89 Pending · 90+ Spam.',
        'Spam is USER-level: one bad application blocks every application that person has, on every job.',
        'Admin has 7 actions, incl. Mark ready, Approve hàng loạt, Đánh Spam, Gỡ Spam.',
      ],
    },
    {
      label: '2 · BB suggested model',
      text: 'Same 3 layers as the client’s document, but Layer 1 keeps only ONE status — Pending — and it is a technical hold, not a judgement on the candidate.',
      table: {
        cols: ['Layer', 'Status', 'When it happens', 'Action admin can do'],
        rows: [
          [
            'Layer 1 — Check (Saramin)',
            'Pending',
            'The CV cannot be scanned, the upload failed, or required information is missing.',
            'Fix the information · Mark as ready (sends it) · Block user · Note',
          ],
          [
            '',
            '(passed — never shown)',
            'Everything else. The application goes straight to the employer.',
            'Nothing — there is no queue to work',
          ],
          [
            'Layer 2 — Send (Saramin)',
            'Sent',
            'Passed the check. The employer has it and the candidate is notified.',
            'Recall · Block user · Edit · Note',
          ],
          ['', 'Recalled', 'Admin pulled it back from the employer.', 'Note only — Recalled is final'],
          ['', 'Blocked', 'The user was blocked; every application of theirs was recalled.', 'Unblock user · Note'],
          [
            'Layer 3 — Employer funnel',
            'New → Reviewing → Shortlisted → Interview → Hired / Rejected',
            'The employer works their own pipeline.',
            'Read-only — admin can never change these',
          ],
        ],
      },
      items: [
        'The employer can CUSTOMISE their own stages — rename them, add or remove steps. The list above is only the default set, so nothing in Saramin may assume these exact six.',
        'Pending replaces four of the client’s statuses at once (Waiting, NEI, Pending, Spam). It is the only thing that ever holds an application back.',
        'Spam is gone as an automatic status. What is left is a manual Block user, which recalls everything that user has sent.',
        'Admin actions drop from 7 to 6: Mark as ready · Recall · Block/Unblock user · Fix information · Edit · Note.',
      ],
      warn: 'REFINED BY BLOCK 4 — Pending survives, but it is narrower and bounded than this table implies. It is written only when the applied-with CV has an unresolved verdict from upload, it is resolved by a decision on the CV rather than on the application, and it auto-sends at 24h no matter what. Everything else in Layer 1 is still gone.',
    },
    {
      label: '3 · What we need you to decide',
      items: [
        'Does blocking a user also pull back the applications already sent? We recommend YES.',
        'Can a candidate apply to the same job twice? We recommend one live application per job, re-apply only after a recall.',
        'When do we build screening if spam does show up? We recommend agreeing a trigger now — first abuse case, or the first promotion campaign.',
        'DECIDED, recorded here because it is counter-intuitive — the two review queues fail in OPPOSITE directions. A held APPLICATION auto-sends at 24h (an employer and a deadline are waiting, so an unworked queue must not cost a job). A held CV never auto-passes into CV search (nobody is waiting, so it can wait for a human). Same verdict, opposite defaults, on purpose. See Resume management → “CV qualification — apply & CV search”.'
      ],
    },
    {
      label: '4 · CV quality is evaluated at UPLOAD — what reaches this module is the verdict',
      text: 'DECIDED — an uploaded PDF is parsed into the Saramin CV fields and evaluated ONCE, at upload. Applying re-checks nothing; it READS the verdict the CV already carries. A CV that failed the rule does not refuse the apply — it holds DELIVERY while a human looks at the CV, and the application auto-sends within 24h regardless. One review covers every application on that CV. The rule itself lives on one page: Resume management → “CV qualification — apply & CV search”.',
      table: {
        cols: ['CV status at apply time', 'Application status', 'CV search'],
        rows: [
          ['Qualified (scan passed, or admin approved)', 'SENT immediately', 'Showing'],
          ['Doubt — Not enough information · Can’t read (interim)', 'PENDING — auto-sends at 24h. The apply itself always succeeds; refusing it would punish the candidate for OUR parser.', 'Hidden – pending review'],
          ['Rejected (an admin decided — the scan never writes this)', 'NOT SENT — never delivered, no timer. New applies with this CV are refused with the reason.', 'Hidden'],
          ['Saramin CV below the rule', 'Refused BEFORE submit — greyed and unselectable, missing fields named.', 'No — toggle disabled.'],
        ],
      },
      items: [
        'THE HOLD IS ON THE CV, NOT THE APPLICATION — an application waits only because the CV it references is unresolved. The review queue is a CV queue (Admin → CV check); the Applicants list shows the consequence and links to it.',
        'ONE EVALUATION PER CV, and ONE DECISION — a candidate applying to thirty jobs with the same file is evaluated once at upload and reviewed once. The verdict releases or recalls all thirty in the same transaction.',
        'THE 24h TIMER IS A CEILING ON OUR OWN FAILURE, not a review target. A held application auto-sends whether or not anyone looked, so an unworked queue can never cost a candidate a deadline. Releases are stamped review or timer, and a rising share of `timer` means the queue is not being staffed.',
        'A REJECTION PROPAGATES BOTH WAYS — rejecting a CV drops its Pending applications, recalls any already sent, and blocks new applies with that CV until it is fixed or approved. The candidate is told, with the fix one tap away.',
        'THE ONLY APPLY-TIME GATE besides a Rejected CV is the Saramin one, and it is deterministic: ≥1 experience (or education) and ≥3 skills. It is enforced server-side at POST /applications, not merely greyed in the UI.',
        'QUALITY IS NEVER A SIGNAL — match score, skill count above the minimum, or a missing cover letter may not affect anything here.',
      ],
    },
  ],
  features: [
    // 0 · Apply ───────────────────────────────────────────────────────────────
    {
      name: 'Apply flow',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-apply',
      detail: {
        description:
          'The one-screen quick apply. From a job detail page the candidate picks one of their existing CVs, optionally adds a short message, and submits — nothing from their profile is re-typed. Because HQ screens applications in Phase-1, the screen states plainly that Saramin reviews the application before the employer sees it, so the candidate is not confused by the waiting period.',
        userStory:
          'As a jobseeker, I want to apply to a job with a CV I already uploaded, so that applying takes seconds and I know what happens next.',
        uiFields: [
          {
            group: 'Job being applied to (read-only)',
            items: [
              { name: 'job', type: 'ref → Job', required: true, notes: 'title + company + location, echoed back so the candidate is sure what they are applying to' },
              { name: 'deadline', type: 'date', notes: 'shown as a reminder; apply is blocked once it has passed' },
            ],
          },
          {
            group: 'Application',
            items: [
              { name: 'cvId', type: 'ref → CV', required: true, notes: 'radio list of ALL the candidate’s CVs (≤3), same row shape as My CVs. A Saramin CV below the qualification rule renders GREYED and unselectable with the missing fields NAMED plus one Cập nhật link into the editor — the VNW pattern. Uploaded files are NEVER gated here, whatever their extraction produced: they were evaluated at upload, and failing costs CV-search entry only (Resume management → “CV qualification — one rule, two sources”).' },
              { name: 'upload new CV', type: 'file (pdf/doc)', notes: 'inline escape hatch — a CV uploaded here is also saved to My CVs, never an orphan one-off file' },
              { name: 'coverMessage', type: 'text (optional)', notes: 'short note to the employer; max 1,000 chars' },
              { name: 'fullName', type: 'string', required: true, notes: 'pre-filled from the profile and ALWAYS editable — a social login supplies a display name, a nickname or the wrong capitalisation often enough that a read-only name sends the employer the wrong one' },
              { name: 'contactEmail', type: 'string', required: true, notes: 'what the employer gets. Defaults to the login email and stays editable even when the login email is provider-locked — see Job seeker user management for the loginEmail / contactEmail split' },
              { name: 'loginEmail', type: 'derived (read-only)', notes: 'shown locked with the provider named ("🔒 Google") when it came from social sign-up — it is the identity key and cannot change' },
              { name: 'phone', type: 'string', required: true, notes: 'no provider returns one, so it is captured at sign-up — email accounts on the email flow, social accounts on the social COMPLETION STEP (see Job seeker user management). By apply time it is normally already filled, and this is a confirm rather than a first ask' },
              { name: 'consent', type: 'checkbox', required: true, notes: '"I agree to share my profile & CV with this employer, per Saramin’s privacy policy" — the per-employer disclosure' },
            ],
          },
          {
            group: '② Application information',
            items: [
              { name: 'location (province/city)', type: 'enum', required: true, notes: 'the one location field — a CV-search facet. NO district, NO street address (data-minimisation decision, see Resume management)' },
              { name: 'yearsOfExperience', type: 'number', required: true, notes: 'pre-filled from the profile — Basic information, collected at SIGN UP. Overridable here, and an edit writes back to the profile' },
              { name: 'highestDegree', type: 'enum', required: true, notes: 'pre-filled from the profile — Basic information, collected at SIGN UP' },
              { name: 'current title / level / industry', type: 'derived (never asked)', notes: 'DERIVED from the CV work history — never a form field. The demographic set (DOB, gender, nationality, marital status, current salary) is CUT platform-wide; see Resume management → field tiers' },
            ],
          },
          {
            group: '③ Desired job',
            items: [
              { name: 'desiredLocation', type: 'enum', required: true, notes: 'was the standalone "Preferred work location" field; now grouped with the rest of the preferences' },
              { name: 'desiredLevel', type: 'enum', required: true },
              { name: 'desiredSalary', type: 'int + unit', notes: 'optional — the most-requested employer filter that no CV supplies; nudged, never blocking' },
              { name: 'availability', type: 'enum', notes: 'optional — Immediately · 2 weeks · 1 month · 2 months' },
              { name: 'desiredIndustry / desiredField', type: 'enum / enum', required: true },
            ],
          },
        ],
        sections: [
          {
            heading: 'FLOW — how a jobseeker applies',
            items: [
              '1. Find a job — Homepage / Search results → Job detail.',
              '2. "Apply now" → the apply modal opens over the job.',
              '3. ① Your CV — pick one of your CVs (radio list, name + kind). No CV yet, or want a different one? "Add a new CV" opens the SAME Add-a-new-CV flow as My CVs.',
              '4. ② Application information — pre-filled from your profile: full name · email (locked when from a social provider) · PHONE (the one field a social sign-up must add) · location · years of experience · highest education.',
              '5. ③ Desired job — desired location · work type · industry · field · expected salary, pre-filled from ONBOARDING (Work preference).',
              '6. ④ Cover message (optional) → tick the consent to share your profile & CV with this employer → "Submit application".',
              '7. The application is created and the candidate lands on MY APPLICATIONS, where its status is tracked.',
              '→ Next: HQ screening (Admin) → forwarded to the employer (Company) → status flows back to My applications.',
            ],
          },
          {
            heading: 'Profile confirmation — asked here, and only here',
            text: 'The apply modal CONFIRMS what the candidate already gave us; it collects nothing new. Four numbered sections: ① Your CV (Hồ sơ của bạn) · ② Application information — contact, location, experience and education, all Basic information from SIGN UP · ③ Desired job (Công việc mong muốn) — Work preference, from ONBOARDING · ④ Cover message. Phone is captured at sign-up (a social account supplies it on the completion step), so by apply time it is a confirm rather than a first ask — this screen stays the last net that stops an application reaching an employer with no way to reply. Street address and current salary are not collected anywhere; the demographic four (DOB, gender, nationality, marital status) WERE cut on 2026-08-05 and REINSTATED on 2026-08-09, so they are part of Basic information again and appear on this read-back — see Resume management → the order: sign up → onboarding → create CV.',
            table: {
              cols: ['Field', 'Editable?', 'Why'],
              rows: [
                ['Full name', 'Always', 'Social logins supply display names, nicknames and odd capitalisation. This is the name the employer reads, so the candidate must be able to correct it.'],
                ['Login email', 'Never, when provider-supplied', 'Email is the identity key — one account per address. Shown locked with the provider named.'],
                ['Contact email', 'Always', 'The address employers use. Defaults to the login email; a candidate whose Google address is personal can point employers elsewhere without touching their identity.'],
                ['Phone', 'Always', 'Captured at sign-up (social accounts on the completion step), so this is usually a confirm. In Vietnam recruiters call before they email — this is the field that decides whether a candidate hears back, so it stays required here as the last net.'],
              ],
            },
            items: [
              'PRE-FILLED, not blank — and after the slim-profile cut, not even a form. Apply renders the SAME ProfileSummaryCard as My CVs (Basic information + Work preference) read-only, with a per-group Edit opening the shared quick-edit popup. The candidate CONFIRMS; they only type when something is wrong or missing.',
              'Grouped, never one long run. Six numbered sections, two fields per row. VietnamWorks proves the field count is workable in this market; the grouping is what makes it scannable.',
              'Asked ONCE, and stored on the PROFILE. An edit made while applying is written back to the profile, not to that one application — so a correction is made once and never re-typed on the next apply.',
              'Confirming writes back to the profile, so the answer is captured permanently rather than per-application.',
              'Labels only — no helper copy, no reassurance paragraphs. A field that needs a sentence of explanation is a field that is wrongly labelled.',
            ],
          },
          {
            heading: 'When it is asked again',
            text: 'Neither once-forever nor every time. The block re-expands when, and only when:',
            table: {
              cols: ['Trigger', 'Why'],
              rows: [
                ['A required field is empty', 'The application cannot be delivered without it.'],
                ['Phone is unverified', 'Only if OTP ships — see open questions.'],
                ['Last confirmed > 6–12 months ago', 'Numbers and addresses go stale; a recruiter calling a dead line is the failure this prevents.'],
                ['An employer reported the number unreachable', 'A signal the stored value is wrong.'],
              ],
            },
            items: ['In every other case the candidate sees the compact read-back and submits without a form.'],
          },
        ],
        behaviors: [
          'Apply is reachable only from a job that is Open + Exposure On (see Job management); a Closed or hidden job shows the job page with no Apply button.',
          'On a first apply the contact block is expanded and pre-filled; on later applies it is a one-line read-back with a Change link.',
          'The name field is editable on every apply, including repeat ones via Change — it is never locked.',
          'A provider-locked login email is shown greyed with the provider named, alongside a "use a different email for employers" affordance rather than a dead end.',
          'Editing a contact field and submitting updates the profile in the same request — the candidate is never asked to go and update their profile separately.',
          'A guest who taps Apply is sent to sign-in / sign-up and returned here with the job kept.',
          'A candidate with no CV yet is routed to Create CV first, then back here with the new CV pre-selected.',
          'Submitting creates the application as Sent with stage = New when the CV is cleared. When the CV still has an unresolved verdict from upload, it is created as PENDING — the apply itself never fails — and the candidate is told: “Đang kiểm tra CV — sẽ gửi tới nhà tuyển dụng trong 24 giờ.” Nothing is evaluated here; the CV carries its verdict in.',
          'On success the candidate lands on a confirmation that links to My application and explains the screening step.',
          'Re-opening the same job after applying replaces the Apply button with "Applied — view application", linking to the existing record.',
        ],
        rules: [
          'One application per (jobseeker, job). A second attempt is blocked and resolves to the existing application — never a duplicate row.',
          'A CV is required; a cover message is not. Any uploaded CV may be used, whatever its qualification status.',
          'A Saramin CV can be sent only when its CV CONTENT meets the apply gate — ≥1 work experience (or ≥1 education entry when there is no experience yet) and ≥3 skills. Named fields, never a percentage; the greyed row says WHAT is missing, and the same gate is enforced server-side at POST /applications — the greyed row is a courtesy, not the control.',
          'An application is never delivered without a name, a contact email and a phone number — the three are required at apply time, server-side.',
          'The login email can never be changed from this screen; it is the identity key. Only the contact email is writable.',
          'Confirming contact details writes them to the jobseeker profile. Apply-time capture is a shortcut to the profile, not a parallel store — there is exactly one name, contact email and phone per candidate.',
          'The CV is snapshotted, but contact details resolve LIVE from the profile: a candidate who changes their number must become reachable on the new one, including on applications already sent. Changes are audited so "what the employer saw" stays answerable.',
          'Apply is rejected server-side if the job is not Open + Exposure On, or if the deadline has passed — the client-side guard is not the control.',
          'The CV is snapshotted onto the application: later edits to the candidate’s CV do not silently change what the employer already received.',
          'A match-score snapshot is written at apply time so it is stable and auditable (see Resume management → CV data & matching architecture).',
        ],
        states: [
          'Guest (must sign in)',
          'No CV yet (routed to Create CV)',
          'Contact confirm — first apply (expanded, pre-filled)',
          'Contact confirm — social login (email locked, phone pre-filled from the completion step)',
          'Contact confirm — repeat apply (collapsed read-back)',
          'Contact confirm — re-asked (stale / empty / reported unreachable)',
          'Contact validation error (missing phone, malformed email)',
          'Ready to submit',
          'Submitting',
          'Success (screening explained)',
          'Already applied',
          'Job closed / hidden',
          'Deadline passed',
          'Upload error (type / size)',
          'Saramin CV unqualified (greyed — missing fields named + Cập nhật link)',
          'Submitted, held — the applied-with CV is unresolved; “sẽ gửi trong 24 giờ”',
          'Released — the CV was cleared, or the 24h timer fired',
          'Dropped — the CV was rejected as not a CV',
        ],
        backend: {
          dataModel: [
            { name: 'applicationId', type: 'uuid', required: true },
            { name: 'jobseekerId', type: 'uuid', required: true },
            { name: 'jobId', type: 'uuid', required: true, notes: 'UNIQUE (jobseekerId, jobId) — the duplicate-apply guard lives in the DB, not the form' },
            { name: 'companyId', type: 'uuid', required: true, notes: 'denormalised from the job — every list filters by it' },
            { name: 'cvId / cvSnapshot', type: 'uuid / file ref', notes: 'snapshot so the employer keeps what was actually sent' },
            { name: 'coverMessage', type: 'text?' },
            { name: 'status', type: 'derived, NOT stored', required: true, notes: 'sent | pending | not_sent — COMPUTED from the applied-with CV’s cv.status (Qualified → sent · doubt → pending · Rejected → not_sent). There is no screeningStatus column any more: storing it would be a second copy of a fact the CV already holds, and the two would eventually disagree. See Resume management → CV qualification' },
            { name: 'holdReleasedBy', type: 'enum?', notes: 'review | timer — how a held application left Pending. A rising share of `timer` means the CV queue is not being staffed' },
            { name: 'stage', type: 'enum?', notes: 'null until forwarded, then new|reviewing|shortlisted|interview|hired|rejected' },
            { name: 'matchScore', type: 'number?', notes: 'snapshotted at apply time' },
            { name: 'appliedAt', type: 'timestamp', required: true },
            { name: 'contactConfirmedAt', type: 'timestamp?', notes: 'on the JOBSEEKER, not the application — drives the "asked once" behaviour and the staleness re-prompt' },
            { name: 'ContactChangeLog', type: 'entity', notes: 'jobseekerId, field(fullName|contactEmail|phone), oldValue, newValue, changedAt, source(apply|profile) — because contact details resolve live, this is what makes "what the employer saw" answerable' },
          ],
          endpoints: [
            'POST /applications { jobId, cvId, coverMessage, contact: { fullName, contactEmail, phone } } — contact is upserted onto the profile in the same transaction',
            'GET /jobseeker/cvs — CV picker',
            'GET /jobs/:id/apply-eligibility — already applied? / still open? / contact confirmation needed?',
            'PATCH /jobseeker/contact { fullName, contactEmail, phone } — the same write, from the profile screen',
          ],
          notes:
            'Creating an application reads the CV’s stored verdict and writes Sent, or Pending when it is unresolved — no check RUNS here, because the CV was evaluated at upload. The unique (jobseekerId, jobId) index is the real duplicate guard. Contact details are written to the jobseeker in the SAME transaction as the application, so a submitted application can never reference contact data that failed to save. The apply-eligibility response tells the client whether to expand the contact block or render the read-back, so the "ask once" rule is decided server-side rather than by client state that a new device would get wrong.',
        },
        acceptance: [
          'A candidate with an existing CV can apply in one screen without typing profile data.',
          'Applying twice to the same job never creates a second application — the UI shows the existing one.',
          'A submitted application is visible to the company immediately — there is no screening queue and no “screened by Saramin” promise on the apply screen.',
          'An apply is NEVER refused for an uploaded CV, whatever its verdict — what waits is delivery, for at most 24h. The only apply-time refusal is a Saramin CV below the rule, and it is refused BEFORE submit: greyed with the missing fields named, never accepted and then held.',
          'A held application is resolved by the decision on its CV, never by a decision on the application itself. One verdict releases or drops every application waiting on that CV.',
          'No application may wait longer than 24h. The timer is a ceiling on our own failure, not a review target, and every release records whether it came from a reviewer or the timer.',
          'A social-login candidate applying for the first time is asked for a phone number, because no provider supplied one.',
          'A candidate can correct a name that came from their social provider, and the employer receives the corrected name.',
          'The login email cannot be edited from the apply screen; the contact email can.',
          'A second apply shows a one-line contact read-back, not a form.',
          'Contact details confirmed at apply time appear in the candidate’s profile afterwards, with no second step.',
          'An application cannot be submitted with an empty phone number, enforced server-side.',
        ],
        openQuestions: [
          'Is the cover message shown to employers in Phase-1, or only captured for later?',
          'Can a candidate withdraw an application, and if so up to which stage?',
          'Should apply be blocked for a job the candidate was already Rejected on, or allowed after a cool-down?',
          'DECISION TAKEN, needs client sign-off: contact details resolve LIVE while the CV stays a snapshot — so a candidate who updates their phone becomes reachable on already-sent applications. The alternative (snapshot contact too) is more auditable but leaves recruiters calling dead numbers. Confirm which the client wants.',
          '[C5] ASSUMED, needs confirmation: a failed phone OTP does NOT block submission — the number is captured and marked unverified, and the employer sees "phone unverified". Blocking on an SMS that did not arrive loses the candidate at the moment they decided to convert, and applying is already gated on account verification. Does the client accept unverified phones reaching employers?',
          '[C7] RESOLVED — applications are never held, so there is nothing to explain and no delay to account for. The equivalent question now lives on the CV: what a candidate is told when their uploaded CV does not qualify for CV search (Resume management → “CV qualification — one rule, two sources”).',
          'REOPENED (2026-08-09) — the 2026-08-05 cut was REVERSED on client direction: nationality, gender, marital status and date of birth ARE collected again, and appear in Basic information on My CVs, Create CV and the apply read-back. UPDATED 2026-08-12: ALL FOUR now have a consumer. Gender and date of birth (as an age) show on the employer CV-search row, and all four — gender, age, nationality, marital status — are filters in the Profile group of the CV-search rail (see Resume management → Resume list). The "adds length without adding findability" objection is therefore answered, and replaced by a sharper one: a field that is merely stored is a privacy question, a field an employer can FILTER a pool by is a discrimination question. Recommend: all four optional and never required to apply; all four facets reviewed and signed off by the client’s legal side before launch; and MARITAL STATUS specifically reconsidered, because it is the one field of the four with no defensible hiring purpose we can identify, and filtering by it is in practice a proxy for guessing who might take maternity leave. Nationality is different — work-permit eligibility and native-speaker roles are genuine uses.',
          'BLOCKER — if the CV parser is not live in Phase-1, the profile card at apply time is mostly EMPTY rather than pre-filled, and "confirm your details" becomes "fill them in now", at the exact moment the candidate wanted to apply. The slim field set softens this but does not remove it. Is apply gated on extraction shipping, or do we accept a partly-blank card at launch?',
          'How long before a confirmation goes stale — 6 months or 12?',
          'Should the employer see that a phone number is unverified, or is that internal only?',
          'Is there a route for an employer to report a number as unreachable, which is what triggers the re-prompt?',
        ],
      },
    },

    // 1 · HQ oversight + screening queue ──────────────────────────────────────
    {
      name: 'Application list',
      site: 'Admin',
      slug: 'application-list-admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-job-applicants',
      detail: {
        description:
          'HQ’s cross-company view of every application. Written to STATUS MODEL v2 (see the module requirements): there is no screening queue and no pre-send gate — an application reaches the employer the moment it is submitted. HQ’s job here is oversight after the fact: read what the employer sees, pull a bad application back (Recall), or shut an abusive account off (Block). HQ never moves a candidate through the employer’s own pipeline.',
        userStory:
          'As an HQ operator, I want one list of every application across all companies with both status dimensions visible, so that I can spot a problem after it has gone out and pull it back or block the account.',
        uiFields: [
          {
            group: 'Filters',
            items: [
              { name: 'search', type: 'string', notes: 'candidate name / email / job title / company' },
              { name: 'status', type: 'enum', notes: 'Sent · Recalled · Blocked — the Saramin-owned dimension' },
              { name: 'stage', type: 'enum', notes: 'New · Reviewing · Shortlisted · Interview · Hired · Rejected — the employer-owned funnel' },
              { name: 'company', type: 'ref → Company', notes: 'HQ-only filter — the company side never has this' },
              { name: 'location', type: 'enum' },
              { name: 'CV type', type: 'enum', notes: 'Saramin CV · Uploaded file' },
              { name: 'appliedAt range', type: 'date range' },
              { name: 'sort', type: 'enum', notes: 'default applied-desc. No SLA ordering — there is no queue to work' },
            ],
          },
          {
            group: 'Row — TWO status columns, different owners',
            items: [
              { name: 'candidate', type: 'ref → Jobseeker', required: true, notes: 'name + masked contact; full contact and the CV need an explicit, audited open' },
              { name: 'snapshot', type: 'derived', notes: 'role · years / location · education — enough to recognise the person without opening the CV' },
              { name: 'job / company', type: 'ref → Job / ref → Company', required: true },
              { name: 'cv', type: 'file', notes: 'file name + whether it is a Saramin CV or an uploaded file' },
              { name: 'status', type: 'badge', required: true, notes: 'Saramin-owned: Sent · Recalled · Blocked. Labelled "Status · Saramin" in the header so the owner is unambiguous' },
              { name: 'stage', type: 'badge', notes: 'employer-owned, read-only. Labelled "Stage · employer". Renders an EM-DASH when status ≠ Sent — a recalled or blocked CV is off the dashboard, so the funnel no longer applies' },
              { name: 'appliedAt', type: 'timestamp' },
            ],
          },
        ],
        sections: [
          {
            heading: 'FLOW — application management on ADMIN (HQ)',
            items: [
              '1. Recruitment → Applicants. Every application across all companies lands here first.',
              '2. Tabs split the list: All · Pending (CV in doubt) · Sent · Recalled · Interview · Hired · Rejected. Filters: search · stage · company · location · CV kind. There is no "to screen" tab — screening happens on the CV, in Resume management → CV qualification, not on an application.',
              '3. Each row shows candidate · snapshot (role · years · location · education) · applied-to job · company · the CV (name + Saramin CV / Uploaded tag) · stage · applied.',
              '4. Click a candidate → the SCREENING DETAIL: the CV under review, a quality checklist, and the match-to-job score.',
              '5. Decide — "✓ Approve & forward to employer" (the company pipeline starts) or "✕ Reject…" with a mandatory, audited reason.',
              '6. Both decisions notify the candidate and the employer, and are written to the audit log.',
              '→ HQ is READ-ONLY on the employer pipeline: it never moves a company’s candidates through their stages.',
            ],
          },
          {
            heading: 'Status options — status (Layer 2, Saramin-owned)',
            items: [
              'Sent — written at apply, after two synchronous hard checks: the user is not blocked, and has no live application to this job. The employer sees it immediately.',
              'Recalled — HQ pulled it from the employer dashboard and notified them to ignore it. Terminal; the candidate must apply again.',
              'Blocked — the user was blocked; every application of theirs was bulk-recalled. User-level, not application-level.',
              'THERE IS NO SCREENING COLUMN, because there is no per-application screening fact. What holds an application is the CV’s status, and the row surfaces that as "Pending — CV đang kiểm tra" with a link to the CV, not as a status the admin can edit here.',
            ],
          },
          {
            heading: 'Status options — stage (Layer 3, company-owned, read-only for HQ)',
            items: [
              'New — sent and untouched by the recruiter.',
              'Reviewing — the recruiter is reading the CV.',
              'Shortlisted — kept for the next round.',
              'Interview — interviewing; the employer contacts the candidate directly (no scheduling in Phase-1).',
              'Hired — terminal, the successful outcome.',
              'Rejected — terminal, employer-side. In v2 there is no "Rejected by HQ" to confuse it with.',
              'HQ shows these badges but can never write them — hovering explains "owned by the company".',
            ],
          },
          {
            heading: 'Applicant detail — oversight, not a gate',
            text: 'Opening a row shows the same information the employer has. There is no Approve and no Reject: the employer already holds this CV.',
            items: [
              'Labels, never blocking: độ phù hợp (match), mức hoàn thiện hồ sơ (e.g. 3/4), kênh liên hệ, nguồn dữ liệu.',
              'Actions: Recall · Block user · Edit · Note. Recall and Block both open a confirmation step before they run.',
              'Recall warns plainly that the employer’s email cannot be un-sent — recall removes the CV from the dashboard and notifies.',
              'Block requires a reason code and states its blast radius: future applies rejected, and every sent application recalled across every job.',
            ],
          },
        ],
        behaviors: [
          'The list has NO status tabs — the filter row is the only way to narrow it. One control set covers every combination, instead of tabs and filters overlapping on the same field.',
          'A one-line legend above the table names both owners, because two status badges on one row is exactly where a reader guesses wrong.',
          'Recall removes the CV from the employer dashboard and notifies them; it cannot un-send the original email.',
          'Block user is user-level: it rejects future applies and bulk-recalls every sent application the user has, across all companies.',
          'Unblock lets the user apply again but does NOT resurrect recalled applications.',
          'Opening a candidate’s CV or unmasking contact details is a PII action: it opens in a viewer and writes an audit entry (who, which candidate, when) — see Admin & access → Audit log.',
          'Every stage badge is read-only for HQ, always.',
          'Export the filtered list (CSV) — itself an audited action, since the export carries PII.',
        ],
        rules: [
          'HQ writes NOTHING on this screen except Recall. `status` is derived from the CV and is changed by acting on the CV (Resume management → CV qualification); `stage` belongs to the company. An editable status control on this list would be a second source of truth for a fact the CV already owns.',
          'A reason code is mandatory on Block (free-text note optional). Recall captures an optional note.',
          'Recalled is terminal: there is no Recalled → Sent transition.',
          'Candidate contact details are masked in the list; unmasking is per-row, deliberate and logged.',
          'HQ sees applications for all companies, including companies that are not yet activated.',
        ],
        states: [
          'Loading',
          'Empty (no applications at all)',
          'Filtered-empty',
          'Recall confirmation open',
          'Block confirmation open (reason required)',
          'CV viewer open (audited)',
          'Export running',
        ],
        backend: {
          dataModel: [
            { name: 'status', type: 'derived, NOT stored', required: true, notes: 'sent | pending | not_sent | recalled. The first three are computed from cv.status on read; only `recalled` is a stored fact of its own, because it is the one thing that happens to an APPLICATION rather than to a CV' },
            { name: 'status (delivery)', type: 'enum', required: true, notes: 'sent|recalled — the only status HQ writes' },
            { name: 'recalledBy / recalledAt / recallNote', type: 'uuid / timestamp / text?', notes: 'who pulled it back' },
            { name: 'Jobseeker.blockedAt / blockedBy / blockReasonCode', type: 'timestamp? / uuid? / enum?', notes: 'on the JOBSEEKER, not the application — Block is user-level' },
            { name: 'ApplicationStatusLog', type: 'entity', notes: 'applicationId, dimension(status|stage), from, to, actorId, actorSide(hq|company), reasonCode?, at — one row per transition' },
            { name: 'PiiAccessLog', type: 'entity', notes: 'actorId, applicationId, jobseekerId, action(view_cv|reveal_contact|export), at' },
          ],
          endpoints: [
            'GET /admin/applications?status=&stage=&company=&location=&cvType=&from=&to=&page=',
            'POST /admin/applications/:id/recall { note? }',
            'POST /admin/jobseekers/:id/block { reasonCode, note? } — bulk-recalls every sent application in the same transaction',
            'POST /admin/jobseekers/:id/unblock { note? }',
            'GET /admin/applications/:id/cv — streams the CV, writes a PII audit entry',
            'POST /admin/applications/export',
          ],
          notes:
            'Same Application entity as the company list — HQ differs only in row scope (all companies) and in write permission (delivery status only). Apply must stay SYNCHRONOUS: it runs the blocked-user and duplicate-apply checks inline and writes `sent` in the same request. If a slow or failure-prone check is ever added, a queued state has to be reintroduced before it ships — that is what the deleted Waiting status was for.',
        },
        acceptance: [
          'A submitted application is visible to the company immediately — there is no state in which it exists but the employer cannot see it.',
          'Both status columns are visible on every row and are labelled with their owner.',
          'A recalled or blocked row shows an em-dash in the Stage column, not a stale badge.',
          'Recall removes the CV from the company list and notifies the employer; it does not claim to un-send the email.',
          'Blocking a user recalls every one of their sent applications across all companies, in one transaction.',
          'Unblocking a user does not resurrect recalled applications.',
          'Block without a reason code is refused by the API, not just by the form.',
          'Opening a CV writes an audit entry naming the operator and the candidate.',
          'No HQ action can change a stage set by the company.',
        ],
        openQuestions: [
          'Does Block recall already-sent applications, or only stop future ones? BB recommends recall — see the module’s open questions.',
          'Who owns the fixed list of Block reason codes?',
          'Is the candidate told their application was recalled, or their account blocked, and in what words?',
          'Does the employer see WHY a CV was recalled, or only that it was?',
          'Phase-2 trigger: what event makes us build the screening layer that this list currently has no room for?',
        ],
      },
    },

    // 2 · Employer pipeline ───────────────────────────────────────────────────
    {
      name: 'Application list',
      site: 'Companies',
      slug: 'application-list-companies',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'co-application-list',
      detail: {
        description:
          'The employer’s applicant pipeline — the screen recruiters actually live in. It lists only this company’s applications (already screened and forwarded by HQ), filterable by job and stage, and it is the only place `stage` is written. HQ mirrors this same view read-only on the company record, so recruiter and HQ always discuss the same board.',
        userStory:
          'As a recruiter, I want to work my candidates through New → Reviewing → Shortlisted → Interview → Hired / Rejected per job, so that I always know who is waiting on me.',
        uiFields: [
          {
            group: 'Scope & filters',
            items: [
              { name: 'job', type: 'ref → Job (own)', required: true, notes: 'defaults to all own jobs; per-job is the normal working mode' },
              { name: 'stage', type: 'enum', notes: 'New · Reviewing · Shortlisted · Interview · Hired · Rejected' },
              { name: 'search', type: 'string', notes: 'candidate name / title / skill' },
              { name: 'appliedAt range', type: 'date range' },
              { name: 'view', type: 'enum', notes: 'list · board (columns = stages)' },
              { name: 'stage counters', type: 'derived', notes: 'count per stage for the current filter — the "what do I owe" number' },
            ],
          },
          {
            group: 'Applicant row / card',
            items: [
              { name: 'photo', type: 'image (derived)', notes: 'the candidate’s profile image when they uploaded one; initials on a tinted circle otherwise. A face is what makes a board column scannable — never a required field, and never a screening criterion' },
              { name: 'candidate', type: 'ref → Jobseeker', required: true, notes: 'name, current role, years, location' },
              { name: 'cv', type: 'file', required: true, notes: 'the card shows which KIND arrived (Saramin CV · uploaded file); the full document renders in the detail panel. Downloading depends on the company’s entitlement' },
              { name: 'desiredSalary', type: 'int + unit', notes: 'on the card — the first thing a recruiter checks before opening anything, and the most common silent mismatch' },
              { name: 'matchScore', type: 'derived', notes: 'basic match in Phase-1 (field overlap) — see Resume management. On the card so a column can be worked highest-match-first instead of newest-first' },
              { name: 'stage', type: 'enum', required: true, notes: 'the only editable status on this screen' },
              { name: 'appliedAt / lastStageChange', type: 'timestamp / relative date', notes: '"waiting 6 days" is the pressure signal' },
              { name: 'internalNote', type: 'text', notes: 'visible to this company’s users only — never to the candidate, never in the HQ payload' },
            ],
          },
        ],
        sections: [
          {
            heading: 'FLOW — application management on the COMPANY site',
            items: [
              '1. Recruiting → Applicants. Only applications HQ has FORWARDED appear here — the company never sees the screening queue.',
              '2. A per-job board with the hiring stages as columns: New · Screening · Interview · Offer · Rejected, each showing its count.',
              '3. Click a candidate card → the application detail: the CV snapshot that was actually sent (+ download), contact details, candidate info (expected salary · availability · location), and team-visible notes.',
              '4. Move the candidate by changing the stage; every move is logged (who · when · from → to).',
              '5. The stage the company sets is what the candidate sees in My applications — one truth, three surfaces.',
              '→ The employer can customise their own stages; nothing in Saramin may assume the default six.',
            ],
          },
          {
            heading: 'Status options — the employer pipeline (`stage`)',
            text: 'The employer can CUSTOMISE these stages — rename them, add or remove steps. What follows is the DEFAULT set every company starts with, NOT a fixed enum: nothing (reports, filters, the admin list, the candidate-facing label) may hard-code these six values.',
            items: [
              'New — just arrived, nobody has looked yet. The default landing stage.',
              'Reviewing — a recruiter has picked it up and is reading the CV.',
              'Shortlisted — kept for the next round; the "yes for now" bucket.',
              'Interview — interviewing. The employer contacts the candidate off-platform in Phase-1; no scheduling here.',
              'Hired — terminal. Confirmed on set, because it is the outcome that ends the pipeline.',
              'Rejected — terminal. An optional reason is captured for the employer’s own records.',
              'Moves need not be sequential — New → Interview is legal, because recruiters skip steps in practice.',
              'Both terminal stages can be re-opened to an earlier stage; the log records it as a re-open rather than a normal move.',
            ],
          },
        ],
        behaviors: [
          'Change stage from a row dropdown, or by dragging a card between columns in board view.',
          'Every stage change is logged (who moved it, when, from → to) and shown on the applicant timeline.',
          'Moving to Rejected asks for an optional reason; moving to Hired asks for confirmation.',
          'Bulk stage change on selected rows — the common case is a bulk Rejected after a screening pass.',
          'Opening a CV that arrived via an application does NOT spend a CV-search unlock: applying already granted access. Only CV search spends entitlement (see Products & packages).',
          'The candidate’s My application label updates from this change with no separate action.',
        ],
        rules: [
          'A company sees only its own applications. Company and job scope are enforced server-side, not by hiding UI.',
          'Only applications whose CV is Qualified appear here. One held by a CV in doubt, or dropped by a Rejected CV, never reaches the company — and an approval on the CV can make several appear at once.',
          'Hired and Rejected are terminal; re-opening to an earlier stage is allowed but logged as a re-open.',
          'Only company users with the recruiting permission can change a stage; viewers can read (see Company user management → roles).',
          'The employer’s rejection reason is private to the company unless the client decides otherwise.',
        ],
        states: [
          'Loading',
          'Empty (no applications yet)',
          'Empty for this job',
          'Filtered-empty',
          'Board view / list view',
          'Bulk selection active',
          'Stage-change confirm (Hired / Rejected)',
          'CV viewer open',
          'Read-only (viewer role)',
        ],
        backend: {
          dataModel: [
            { name: 'stage', type: 'enum', required: true, notes: 'new|reviewing|shortlisted|interview|hired|rejected' },
            { name: 'stageChangedBy / stageChangedAt', type: 'uuid / timestamp' },
            { name: 'rejectionReason', type: 'text?', notes: 'employer-side, optional; distinct from the HQ screening reason' },
            { name: 'internalNote', type: 'text?', notes: 'company-scoped; excluded from every jobseeker and HQ payload' },
          ],
          endpoints: [
            'GET /company/applications?jobId=&stage=&q=&from=&to=&page=',
            'PATCH /company/applications/:id { stage, reason? }',
            'POST /company/applications/bulk { ids[], stage, reason? }',
            'GET /company/applications/:id/cv',
          ],
          notes: 'Row scope is derived from the authenticated user’s companyId — never from a query parameter. Stage writes append to ApplicationStageLog.',
        },
        acceptance: [
          'A recruiter can move a candidate through every stage and the change persists.',
          'Stage counters match the rows for the active filter.',
          'A company cannot read or write another company’s application, even by guessing an id.',
          'The stage a recruiter sets is the stage the candidate sees in My application.',
          'Every stage change is retrievable from the log with actor and timestamp.',
        ],
        openQuestions: [
          'Are stages fixed, or configurable per company?',
          'Does Interview need scheduling (date, mode, interviewer) in Phase-1, or is it just a stage?',
          'Is the employer’s rejection reason ever shown to the candidate?',
          'Should the employer be notified of newly forwarded applications by email, in-app, or both?',
        ],
      },
    },

    // 3 · Candidate-facing ────────────────────────────────────────────────────
    {
      name: 'My application',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-applications',
      detail: {
        description:
          'The candidate’s list of everything they applied to, with the date applied and where it stands. The status shown here is DERIVED from the two internal dimensions (HQ screening + employer stage) — a label, not a third status column — so a candidate can never see something the recruiter disagrees with.',
        userStory:
          'As a jobseeker, I want to see every job I applied to and what is happening with it, so that I am not left guessing after I hit apply.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'filter', type: 'enum', notes: 'All · In progress · Closed (Hired / Not selected)' },
              { name: 'sort', type: 'enum', notes: 'applied-desc default' },
              { name: 'count', type: 'derived', notes: 'total applications' },
            ],
          },
          {
            group: 'Application row',
            items: [
              { name: 'job', type: 'ref → Job', required: true, notes: 'title + company + location; still links to the job page after it closes' },
              { name: 'appliedAt', type: 'date', required: true },
              { name: 'displayStatus', type: 'derived', required: true, notes: 'Screening · Sent to employer · Reviewing · Shortlisted · Interview · Hired · Not selected — the candidate-safe label, see Status options' },
              { name: 'cvUsed', type: 'ref → CV', notes: 'which CV was sent — the snapshot, not the current file' },
              { name: 'lastUpdatedAt', type: 'relative date', notes: '"updated 2 days ago", without exposing internal notes' },
            ],
          },
        ],
        sections: [
          {
            heading: 'FLOW — the jobseeker tracks their applications',
            items: [
              '1. My account → My applications.',
              '2. The list shows every application: job · company · date applied · WHICH CV was sent · a status chip · and a one-line note ("Interview scheduled — 08/08, 10:00"). Filter tabs: All · In progress · Offer · Closed.',
              '3. Click one → the detail: the CV SNAPSHOT that was sent ("later edits don’t change it") and a PROGRESS TIMELINE — Submitted → Đang kiểm tra CV (only if the CV was in doubt) → Sent to employer → Viewed → Interview → Result.',
              '4. "Withdraw application" is available from the detail.',
              '→ The status shown here is DERIVED from the CV’s status + the employer stage — never a third source of truth.',
            ],
          },
          {
            heading: 'Status options — the candidate-facing label and where each one comes from',
            text: 'DERIVED from (cv.status, stage). There is no stored application status and no third source of truth — see Resume management → CV qualification, which is where cv.status is defined and where every admin action writes.',
            items: [
              'Đang kiểm tra CV — cv.status is a DOUBT state (Not enough information · Can’t read). Copy: "Đang kiểm tra CV — sẽ gửi trong 24 giờ." Shown only when it is true; a Qualified CV never passes through this label.',
              'Sent to employer — cv.status = Qualified, stage = New. The employer has it and has not opened it yet.',
              'Reviewing — stage = Reviewing. The employer is reading it.',
              'Shortlisted — stage = Shortlisted. Safe to show: it is good news and unambiguous.',
              'Interview — stage = Interview. The employer makes contact directly; the platform does not schedule in Phase-1.',
              'Hired — stage = Hired. Terminal.',
              'Not selected — stage = Rejected. Terminal; no reason is exposed unless the employer opts in.',
              'CV rejected — cv.status = Rejected. UNLIKE the old HQ-rejection case this IS told, because it is actionable and the fix belongs to the candidate: the reason is named and "Tải lên CV khác / Chỉnh sửa CV" sits beside it. Rejecting a CV also drops its pending applications and recalls any already sent, so several rows can change at once.',
            ],
          },
        ],
        behaviors: [
          'Tapping a row opens the application detail: the job, the CV that was sent, the applied date and a plain-language status timeline.',
          'The label recomputes from the source dimensions on read — there is no candidate-side status to keep in sync.',
          'A job that has since closed still resolves; the row never becomes a dead link.',
          'Re-applying is blocked from here as it is everywhere else — this row is the canonical record for that job.',
        ],
        rules: [
          'displayStatus is derived, never stored. If the mapping changes, every existing application re-labels correctly with no migration.',
          'Internal notes, the employer’s rejection reason and the HQ screening reason are never sent to the jobseeker payload.',
          'The candidate’s label must never contradict the recruiter’s stage — which is why it is a projection of `stage`, not a parallel field.',
          'The CV shown is the snapshot that was sent, so the candidate sees what the employer actually received.',
          'A candidate sees only their own applications.',
        ],
        states: [
          'Loading',
          'Empty (never applied — CTA to search jobs)',
          'In progress only',
          'All closed',
          'Job since closed / removed',
        ],
        backend: {
          endpoints: [
            'GET /jobseeker/applications?filter=&page=',
            'GET /jobseeker/applications/:id',
          ],
          notes: 'A read-only projection over Application JOIN Cv. The mapping from (cv.status, stage) → displayStatus lives in ONE place server-side, shared by the list, the detail and any notification copy — so a CV approval changes every affected row with no write to the applications themselves.',
        },
        acceptance: [
          'Every application the candidate submitted appears with the correct applied date.',
          'The label matches the employer’s current stage for every forwarded application.',
          'No internal note or rejection reason is present anywhere in the jobseeker API response.',
          'A Pending application reads as "Screening", never as an employer stage.',
        ],
        openQuestions: [
          'How is an HQ screening rejection worded to the candidate — or is it shown at all?',
          'Do stage changes trigger a notification (email / push), and for which stages?',
          'Can a candidate withdraw from here, and does that free them to re-apply later?',
        ],
      },
    },
  ],
}
