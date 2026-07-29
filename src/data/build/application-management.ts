import type { BuildModule } from './types'

/*
 * Application management — the apply flow and the three screens that watch an
 * application move.
 *
 * ONE application = one jobseeker + one job, and it carries TWO status
 * dimensions that must never be confused:
 *
 *   1. screeningStatus  — HQ's Phase-1 quality gate. Pending → Forwarded / Rejected.
 *                         Owned by HQ. Nothing reaches the employer until Forwarded.
 *   2. stage            — the employer's hiring pipeline. New → Reviewing →
 *                         Shortlisted → Interview → Hired / Rejected.
 *                         Owned by the company. HQ is read-only here.
 *
 *   Jobseeker applies ──▶ screeningStatus = Pending  (candidate sees "Screening")
 *          │ HQ screener passes it
 *          ▼
 *   screeningStatus = Forwarded ──▶ stage = New      (employer's queue starts)
 *          │ company works the pipeline
 *          ▼
 *   Reviewing → Shortlisted → Interview → Hired / Rejected  (terminal)
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
      label: 'Apply flow (Jobseeker)',
      text: 'Quick apply with a selected CV — the jobseeker picks one of their existing CVs. No re-typing of profile data.',
      items: [
        'One application = one jobseeker + one job. Applying twice to the same job is blocked; the jobseeker is shown their existing application instead.',
        'At apply time the jobseeker is told about the HQ gate: “screened by Saramin before it reaches the employer”.',
      ],
    },
    {
      label: 'TWO independent status dimensions per application',
      text: 'The employer pipeline does not start until HQ forwards. The candidate-facing status is DERIVED from these two — never stored separately.',
      table: {
        cols: ['Dimension', 'Owned by', 'Values'],
        rows: [
          ['screeningStatus (the HQ gate)', 'HQ — Phase-1 quality gate', 'Pending → Forwarded / Rejected'],
          ['stage (employer pipeline)', 'The company, after forwarding', 'New → Reviewing → Shortlisted → Interview → Hired / Rejected'],
        ],
      },
      warn: 'One application, one truth, three surfaces. The status a candidate sees must always match the company-side stage.',
      items: ['Stage changes are logged: who moved it, when, from → to.'],
    },
    {
      label: 'Who sees what',
      table: {
        cols: ['Surface', 'Sees', 'Can do'],
        rows: [
          ['Admin (HQ)', 'Applications across ALL companies — candidate · job · company · stage', 'Screening queue + quality checks. READ-ONLY on the employer pipeline'],
          ['Company', 'Only its own applications, filterable by job and stage', 'Owns the stage pipeline after HQ forwards'],
          ['Jobseeker — My application', 'Each application with its current stage + date applied', 'View only'],
        ],
      },
      warn: 'HQ never moves a company’s candidates through their pipeline. Opening a candidate’s CV is a PII action and is always written to the audit log.',
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
              { name: 'cvId', type: 'ref → CV', required: true, notes: 'radio list of the candidate’s CVs (file name + last-updated). Pre-selects the primary CV. Phase-1 = one primary CV — see Resume management.' },
              { name: 'upload new CV', type: 'file (pdf/doc)', notes: 'inline escape hatch — a CV uploaded here is also saved to My CVs, never an orphan one-off file' },
              { name: 'coverMessage', type: 'text (optional)', notes: 'short note to the employer; max 1,000 chars' },
              { name: 'contact snapshot', type: 'derived (read-only)', notes: 'name / phone / email pulled from the profile — shown for confirmation, not editable here' },
              { name: 'screening notice', type: 'static copy', required: true, notes: '"Your application is screened by Saramin before it reaches the employer" — the Phase-1 gate, disclosed at apply time' },
            ],
          },
        ],
        behaviors: [
          'Apply is reachable only from a job that is Open + Exposure On (see Job management); a Closed or hidden job shows the job page with no Apply button.',
          'A guest who taps Apply is sent to sign-in / sign-up and returned here with the job kept.',
          'A candidate with no CV yet is routed to Create CV first, then back here with the new CV pre-selected.',
          'Submitting creates the application with screeningStatus = Pending and NO stage yet — the employer queue has not started.',
          'On success the candidate lands on a confirmation that links to My application and explains the screening step.',
          'Re-opening the same job after applying replaces the Apply button with "Applied — view application", linking to the existing record.',
        ],
        rules: [
          'One application per (jobseeker, job). A second attempt is blocked and resolves to the existing application — never a duplicate row.',
          'A CV is required; a cover message is not.',
          'Apply is rejected server-side if the job is not Open + Exposure On, or if the deadline has passed — the client-side guard is not the control.',
          'The CV is snapshotted onto the application: later edits to the candidate’s CV do not silently change what the employer already received.',
          'A match-score snapshot is written at apply time so it is stable and auditable (see Resume management → CV data & matching architecture).',
        ],
        states: [
          'Guest (must sign in)',
          'No CV yet (routed to Create CV)',
          'Ready to submit',
          'Submitting',
          'Success (screening explained)',
          'Already applied',
          'Job closed / hidden',
          'Deadline passed',
          'Upload error (type / size)',
        ],
        backend: {
          dataModel: [
            { name: 'applicationId', type: 'uuid', required: true },
            { name: 'jobseekerId', type: 'uuid', required: true },
            { name: 'jobId', type: 'uuid', required: true, notes: 'UNIQUE (jobseekerId, jobId) — the duplicate-apply guard lives in the DB, not the form' },
            { name: 'companyId', type: 'uuid', required: true, notes: 'denormalised from the job — every list filters by it' },
            { name: 'cvId / cvSnapshot', type: 'uuid / file ref', notes: 'snapshot so the employer keeps what was actually sent' },
            { name: 'coverMessage', type: 'text?' },
            { name: 'screeningStatus', type: 'enum', required: true, notes: 'pending|forwarded|rejected — starts at pending' },
            { name: 'stage', type: 'enum?', notes: 'null until forwarded, then new|reviewing|shortlisted|interview|hired|rejected' },
            { name: 'matchScore', type: 'number?', notes: 'snapshotted at apply time' },
            { name: 'appliedAt', type: 'timestamp', required: true },
          ],
          endpoints: [
            'POST /applications { jobId, cvId, coverMessage }',
            'GET /jobseeker/cvs — CV picker',
            'GET /jobs/:id/apply-eligibility — already applied? / still open?',
          ],
          notes: 'Creating an application emits an event the HQ screening queue listens to. The unique (jobseekerId, jobId) index is the real duplicate guard.',
        },
        acceptance: [
          'A candidate with an existing CV can apply in one screen without typing profile data.',
          'Applying twice to the same job never creates a second application — the UI shows the existing one.',
          'A submitted application appears in the HQ screening queue as Pending and is NOT visible to the company.',
          'The screening notice is visible before submit, not only after.',
        ],
        openQuestions: [
          'Is the cover message shown to employers in Phase-1, or only captured for later?',
          'Can a candidate withdraw an application, and if so up to which stage?',
          'Should apply be blocked for a job the candidate was already Rejected on, or allowed after a cool-down?',
        ],
      },
    },

    // 1 · HQ oversight + screening queue ──────────────────────────────────────
    {
      name: 'Application list',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-job-applicants',
      detail: {
        description:
          'HQ’s cross-company view of every application, and the home of the Phase-1 screening queue. Two jobs in one screen: work the Pending queue (forward or reject each application before the employer sees it), then audit quality across all companies afterwards. HQ never moves a candidate through the employer’s own pipeline — past the screening gate this list is read-only.',
        userStory:
          'As an HQ operator, I want to screen incoming applications and see every application across all companies, so that employers only receive genuine candidates and we can spot quality problems early.',
        uiFields: [
          {
            group: 'Queue & filters',
            items: [
              { name: 'tab', type: 'enum', required: true, notes: 'Screening queue (screeningStatus = Pending) · All applications' },
              { name: 'search', type: 'string', notes: 'candidate name / email / job title / company' },
              { name: 'company', type: 'ref → Company', notes: 'HQ-only filter — the company side never has this' },
              { name: 'job', type: 'ref → Job' },
              { name: 'screeningStatus', type: 'enum', notes: 'Pending · Forwarded · Rejected by HQ' },
              { name: 'stage', type: 'enum', notes: 'New · Reviewing · Shortlisted · Interview · Hired · Rejected — only meaningful once forwarded' },
              { name: 'appliedAt range', type: 'date range' },
              { name: 'sort', type: 'enum', notes: 'default applied-desc; oldest-first is the useful order for the queue (SLA)' },
            ],
          },
          {
            group: 'Row',
            items: [
              { name: 'candidate', type: 'ref → Jobseeker', required: true, notes: 'name + masked contact; full contact and the CV need an explicit, audited open' },
              { name: 'job', type: 'ref → Job', required: true },
              { name: 'company', type: 'ref → Company', required: true },
              { name: 'screeningStatus', type: 'badge', required: true },
              { name: 'stage', type: 'badge', notes: 'em-dash while screeningStatus = Pending — the pipeline has not started' },
              { name: 'matchScore', type: 'derived', notes: 'basic match in Phase-1' },
              { name: 'appliedAt / waitingFor', type: 'timestamp / derived', notes: 'age of a Pending row — the screening SLA signal' },
              { name: 'actions', type: 'buttons', notes: 'Open CV (audited) · Forward · Reject — the two decisions appear only on Pending rows' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — screeningStatus (HQ-owned, the only status HQ can write)',
            items: [
              'Pending — the default on submit. The application exists but the company cannot see it. This is the queue.',
              'Forwarded — HQ passed it. Sets stage = New and hands ownership to the company. Irreversible except by an audited re-open.',
              'Rejected by HQ — HQ stopped it. A reason code is mandatory. It never reaches the company and never gets a stage.',
            ],
          },
          {
            heading: 'Status options — stage (company-owned, read-only for HQ)',
            items: [
              'New — forwarded and untouched by the recruiter.',
              'Reviewing — the recruiter is reading the CV.',
              'Shortlisted — kept for the next round.',
              'Interview — interviewing; the employer contacts the candidate directly (no scheduling in Phase-1).',
              'Hired — terminal, the successful outcome.',
              'Rejected — terminal, employer-side (distinct from Rejected by HQ, which is a screening decision).',
              'HQ shows these badges but can never write them — hovering explains "owned by the company".',
            ],
          },
        ],
        behaviors: [
          'The screening queue defaults to oldest-first: the longest-waiting candidate is the next one to screen.',
          'Forward sets screeningStatus = Forwarded and creates the employer pipeline at stage = New — this is the moment the company can see the application.',
          'Reject sets screeningStatus = Rejected with a required reason; the application never reaches the company.',
          'Bulk forward / bulk reject on selected Pending rows, with the same reason requirement on reject.',
          'Opening a candidate’s CV or unmasking contact details is a PII action: it opens in a viewer and writes an audit entry (who, which candidate, when) — see Admin & access → Audit log.',
          'Past the gate every stage badge is read-only for HQ.',
          'Export the filtered list (CSV) — itself an audited action, since the export carries PII.',
        ],
        rules: [
          'HQ can set screeningStatus only. HQ can never write `stage` — that column belongs to the company.',
          'A rejection reason is mandatory on Reject (a reason code is required; a free-text note is optional).',
          'Screening decisions are irreversible in Phase-1 except by an explicit re-open, which is itself audited.',
          'Candidate contact details are masked in the list; unmasking is per-row, deliberate and logged.',
          'HQ sees applications for all companies, including companies that are not yet activated.',
        ],
        states: [
          'Loading',
          'Empty queue (nothing to screen)',
          'Empty (no applications at all)',
          'Filtered-empty',
          'Bulk selection active',
          'Reject reason required',
          'CV viewer open (audited)',
          'Export running',
        ],
        backend: {
          dataModel: [
            { name: 'screeningStatus', type: 'enum', required: true, notes: 'pending|forwarded|rejected' },
            { name: 'screenedBy / screenedAt', type: 'uuid / timestamp', notes: 'who cleared or rejected it' },
            { name: 'rejectionReasonCode / rejectionNote', type: 'enum / text', notes: 'mandatory on HQ reject' },
            { name: 'ApplicationStageLog', type: 'entity', notes: 'applicationId, from, to, actorId, actorSide(hq|company), at — one row per transition' },
            { name: 'PiiAccessLog', type: 'entity', notes: 'actorId, applicationId, jobseekerId, action(view_cv|reveal_contact|export), at' },
          ],
          endpoints: [
            'GET /admin/applications?tab=&company=&job=&screeningStatus=&stage=&from=&to=&page=',
            'POST /admin/applications/:id/forward',
            'POST /admin/applications/:id/reject { reasonCode, note }',
            'POST /admin/applications/bulk { ids[], action, reasonCode? }',
            'GET /admin/applications/:id/cv — streams the CV, writes a PII audit entry',
            'POST /admin/applications/export',
          ],
          notes: 'Same Application entity as the company list — HQ differs only in row scope (all companies) and in write permission (screeningStatus only).',
        },
        acceptance: [
          'A Pending application is invisible to the company until HQ forwards it.',
          'Forward creates the employer pipeline at New; the company list shows it immediately.',
          'Reject without a reason is refused by the API, not just by the form.',
          'Opening a CV writes an audit entry naming the operator and the candidate.',
          'No HQ action can change a stage set by the company.',
        ],
        openQuestions: [
          'What is the screening SLA (hours), and should the queue warn when a row breaches it?',
          'Who owns the fixed list of HQ rejection reason codes?',
          'Is the candidate told an application was rejected at screening, and in what words?',
          'Does screening survive Phase-1, or is it removed once employers trust the pool?',
        ],
      },
    },

    // 2 · Employer pipeline ───────────────────────────────────────────────────
    {
      name: 'Application list',
      site: 'Companies',
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
              { name: 'candidate', type: 'ref → Jobseeker', required: true, notes: 'name, current role, years, location' },
              { name: 'cv', type: 'file', required: true, notes: 'opens in a viewer; whether it can be downloaded depends on the company’s entitlement' },
              { name: 'matchScore', type: 'derived', notes: 'basic match in Phase-1 (field overlap) — see Resume management' },
              { name: 'stage', type: 'enum', required: true, notes: 'the only editable status on this screen' },
              { name: 'appliedAt / lastStageChange', type: 'timestamp / relative date', notes: '"waiting 6 days" is the pressure signal' },
              { name: 'internalNote', type: 'text', notes: 'visible to this company’s users only — never to the candidate, never in the HQ payload' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — the employer pipeline (`stage`)',
            items: [
              'New — just forwarded by HQ, nobody has looked yet. The default landing stage.',
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
          'Only forwarded applications appear here; Pending and HQ-Rejected ones never do.',
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
            heading: 'Status options — the candidate-facing label and where each one comes from',
            items: [
              'Screening — screeningStatus = Pending. Copy: "Saramin is reviewing your application." Keeps the promise the apply screen made.',
              'Sent to employer — screeningStatus = Forwarded, stage = New. The employer has it and has not opened it yet.',
              'Reviewing — stage = Reviewing. The employer is reading it.',
              'Shortlisted — stage = Shortlisted. Safe to show: it is good news and unambiguous.',
              'Interview — stage = Interview. The employer makes contact directly; the platform does not schedule in Phase-1.',
              'Hired — stage = Hired. Terminal.',
              'Not selected — stage = Rejected. Terminal; no reason is exposed unless the employer opts in.',
              'An HQ rejection (screeningStatus = Rejected) is the one case with NO distinct label — pending a client decision it also renders as "Not selected", so a candidate is never told "Saramin blocked you". Flagged in open questions.',
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
          notes: 'A read-only projection over Application. The mapping from (screeningStatus, stage) → displayStatus lives in ONE place server-side, shared by the list, the detail and any notification copy.',
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
