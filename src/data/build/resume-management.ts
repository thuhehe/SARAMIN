import type { BuildModule } from './types'

export const resumeManagement: BuildModule = {
  id: 'resume-management',
  title: 'Resume management',
  owner: 'Luong',
  requirements: [
    {
      label: 'What gets built',
      table: {
        cols: ['Surface', 'What it is', 'Gate'],
        rows: [
          ['Create CV — Jobseeker', 'Online builder + uploaded CV; “My CVs” on My page', '—'],
          ['Resume list — Admin', 'HQ oversight of the CV pool', 'HQ role'],
          ['Resume list — Companies', 'CV search / talent search', 'Package + candidate visibility consent'],
        ],
      },
      items: ['One jobseeker = one primary CV in Phase 1 — to CONFIRM with the client.'],
    },
    {
      label: 'CV search is a DISCOVERY task first',
      text: 'How the CV pool is structured, indexed, searched and ranked must be researched before any build. See the “Resume list — Companies” feature.',
    },
    {
      label: 'Do NOT burden candidates with heavy forms',
      text: 'Unlike VietnamWorks, the structured data needed for matching and CV search is EXTRACTED from the uploaded CV by AI — not typed by the user. See “CV data & matching architecture”.',
    },
    {
      label: 'CV visibility (candidate-owned)',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Discoverable', 'The primary CV can appear in employer CV search as a LOCKED preview; a company must spend an unlock to see the full CV.', 'Can only be changed by the candidate — no system action and no HQ action may flip it.'],
          ['Hidden', 'The candidate does not appear in employer search at all; applying still works.', 'Candidate-set only; Hidden takes effect on the search index synchronously.'],
        ],
      },
    },
    {
      label: 'CV moderation status (HQ-owned)',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Normal', 'Default; participates in employer search subject to the candidate’s own visibility consent.', 'Moderation can only subtract from discoverability, never add.'],
          ['Flagged', 'Marked for review (suspected fake, spam, or offensive); still searchable in Phase-1 — a work queue, not a punishment.', 'Moderation can only subtract from discoverability, never add.'],
          ['Removed from pool', 'Excluded from employer CV search by HQ with a mandatory reason; the candidate keeps their CV and can still apply.', 'Restore returns a Removed CV to Normal, audited.'],
        ],
      },
      warn: 'The index reads one derived flag: searchExcluded = true when moderation = Removed OR visibility = Hidden.',
    },
  ],
  features: [
    // ── CANDIDATE SIDE ────────────────────────────────────────────────────────
    {
      name: 'Create CV',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-create-cv',
      detail: {
        description:
          'How a candidate gets a CV onto the platform. Two routes into the same object: UPLOAD an existing CV (the primary path, and the one the whole data strategy is built around) or BUILD one online for candidates who have no file. Either way the outcome is a CV document plus an extracted structured Candidate Profile — the upload path gets that profile from AI extraction, the builder path gets it from the fields as typed. The screen is deliberately light: we do not ask for what a CV already contains.',
        userStory:
          'As a jobseeker, I want to upload the CV I already have — or build one quickly if I don’t — so that I can start applying without filling in a long profile form.',
        uiFields: [
          {
            group: 'Route choice',
            items: [
              { name: 'method', type: 'enum', required: true, notes: 'Upload a CV (recommended, pre-selected) · Build one online. Upload is the primary path by design — see the module’s "extract, don’t ask" principle.' },
              { name: 'file', type: 'file (pdf/doc/docx)', notes: 'upload route — max ~5MB; PDF is the safest for both viewing and extraction' },
              { name: 'cvName', type: 'string', notes: 'defaults to the file name; the label the candidate recognises in My CVs' },
            ],
          },
          {
            group: 'Builder — sections (online route)',
            items: [
              { name: 'personal', type: 'group', required: true, notes: 'name, headline / current role, location, contact — pre-filled from the profile, never re-typed' },
              { name: 'summary', type: 'rich text', notes: 'short "about me"' },
              { name: 'workHistory', type: 'repeatable', notes: 'company, title, from–to (or current), description — the section that drives years-of-experience' },
              { name: 'education', type: 'repeatable', notes: 'school, degree/major, from–to' },
              { name: 'skills', type: 'tags → taxonomy', required: true, notes: 'must resolve to the canonical Skill taxonomy, not free strings — otherwise search and matching silently fail' },
              { name: 'languages / certificates', type: 'repeatable', notes: 'optional' },
              { name: 'template', type: 'enum', notes: 'a small set of layouts for the generated PDF' },
            ],
          },
          {
            group: 'Extraction review (upload route)',
            items: [
              { name: 'extracted fields', type: 'derived + editable', required: true, notes: 'role, years, skills, work history, education, industry, location, languages — each shown with its confidence' },
              { name: 'lowConfidence flags', type: 'derived', notes: 'only the uncertain fields are surfaced for confirmation; high-confidence fields are not put in front of the user' },
              { name: 'the ~5 asks', type: 'group', notes: 'desired salary, desired role/location, availability — the fields no CV contains (see CV data & matching architecture)' },
              { name: 'visibility consent', type: 'enum', required: true, notes: 'Discoverable · Hidden — an explicit choice, never inferred, never defaulted silently' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Two routes, one object',
            items: [
              'Upload → the file IS the CV employers read, and AI extraction produces the structured profile behind it. This is the path the platform optimises for.',
              'Builder → the typed fields produce both a generated CV document (PDF) and the structured profile directly, with no extraction step and no confidence scores.',
              'Downstream, nothing cares which route was used: an application attaches a CV document, and search reads the Candidate Profile. Keeping that boundary clean is what allows Phase-1 to ship without AI at all.',
              'Phase-1 without AI: an upload still produces a CV; the structured profile is then only what the candidate confirms in the light review step. Phase-2 turns extraction on and the review step gets shorter, not longer.',
            ],
          },
        ],
        behaviors: [
          'Upload is pre-selected because it is the fastest route and the one that yields the best data.',
          'A file is validated for type and size before upload, with an explicit error rather than a silent failure.',
          'After upload, extraction runs and the candidate is shown only the low-confidence fields to confirm — a high-confidence extraction is not put in their way.',
          'Any extracted value is editable, and a user edit always beats the extracted value.',
          'The builder saves as a draft continuously, because losing a half-typed work history is the fastest way to lose the candidate.',
          'Skills autocomplete against the canonical taxonomy; a free-typed skill offers the closest canonical match rather than being stored raw.',
          'The builder generates a downloadable PDF, so a candidate who builds here ends up with a file they can use elsewhere.',
          'Finishing routes back to whatever the candidate was doing — usually the job they wanted to apply to.',
          'Re-uploading to replace a CV keeps the same CV record and version history; it does not silently create a second CV.',
        ],
        rules: [
          'A CV must have a document (uploaded or generated) — a structured profile alone is not a CV.',
          'Extraction never overwrites a field the candidate has edited; on a re-parse, changes are proposed rather than applied.',
          'Skills, titles and industries must resolve to the canonical taxonomy — this is the join that makes CV search and matching work at all.',
          'Visibility consent is explicit and defaults to the safer value; uploading a CV is not consent to be discovered by employers.',
          'File types are restricted to PDF / DOC / DOCX and scanned for malware before they are ever served to an employer.',
          'The document served to an employer is the snapshot attached to their application, not the candidate’s latest edit (see Application management).',
          'Phase-1 assumes one primary CV per candidate — flagged for confirmation in the module requirements.',
        ],
        states: [
          'Route choice',
          'Uploading',
          'Upload rejected (type / size)',
          'Extracting',
          'Extraction review (low-confidence fields)',
          'Extraction failed (CV still saved, profile left to the light form)',
          'Builder — empty',
          'Builder — draft saved',
          'Validation errors',
          'Generating PDF',
          'Saved (routed back to apply, if applicable)',
          'Replacing an existing CV',
        ],
        backend: {
          dataModel: [
            { name: 'cvId', type: 'uuid', required: true },
            { name: 'jobseekerId', type: 'uuid', required: true },
            { name: 'source', type: 'enum', required: true, notes: 'uploaded|built — decides whether extraction applies' },
            { name: 'documentUrl / mimeType / sizeBytes', type: 'string / string / int', notes: 'the file employers actually read' },
            { name: 'name / isPrimary', type: 'string / bool', notes: 'Phase-1: exactly one primary' },
            { name: 'builderData', type: 'jsonb?', notes: 'built route only — the typed sections the PDF is generated from' },
            { name: 'extractionStatus', type: 'enum', notes: 'not_applicable|pending|done|failed' },
            { name: 'CvVersion', type: 'entity', notes: 'cvId, version, documentUrl, createdAt — a replace adds a version rather than destroying the old file, since applications reference snapshots' },
            { name: 'CandidateProfile', type: 'entity', notes: 'the extracted structured layer — see CV data & matching architecture for the full model' },
          ],
          endpoints: [
            'POST /jobseeker/cvs/upload (multipart) → { cvId, extractionStatus }',
            'GET /jobseeker/cvs/:id/extraction — extracted fields + confidence',
            'PATCH /jobseeker/cvs/:id/extraction — confirm / correct extracted fields',
            'POST /jobseeker/cvs — create via the builder',
            'PUT /jobseeker/cvs/:id — builder autosave',
            'POST /jobseeker/cvs/:id/generate-pdf',
            'POST /jobseeker/cvs/:id/replace (multipart) — new version, same record',
          ],
          integrations: ['Object storage + malware scanning', 'AI CV parsing (Phase-2)', 'Skill/Title/Industry taxonomy', 'PDF generation (builder route)'],
          notes:
            'Extraction must be asynchronous and non-blocking: the CV is usable the moment it is uploaded, and a failed parse degrades to the light manual form rather than blocking the candidate. Version documents rather than overwriting them, because applications reference the snapshot that was actually sent.',
        },
        acceptance: [
          'A candidate can upload a CV and apply to a job immediately afterwards.',
          'Extraction failure still leaves a usable CV, with the candidate asked only for the few fields needed.',
          'An edited field is never overwritten by a subsequent re-parse without asking.',
          'Skills saved from the builder resolve to canonical taxonomy ids, not free text.',
          'A CV built online produces a downloadable PDF.',
          'Replacing a CV keeps one CV record and preserves the earlier document version.',
          'A newly uploaded CV is not discoverable in employer search until visibility consent is given.',
        ],
        openQuestions: [
          'Is one primary CV per candidate firm for Phase-1, or should multiple CVs be supported from the start?',
          'Which builder templates does the client want, and who designs them?',
          'Do we localise the builder output (a VI CV and an EN CV from the same data)?',
          'For Phase-1 without AI, how many fields is it acceptable to ask for after an upload?',
          'Should an uploaded CV be virus-scanned synchronously (slower upload) or asynchronously (a brief window before it can be served)?',
        ],
      },
    },
    {
      name: 'My CVs (My page)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-mypage',
      detail: {
        description:
          'The candidate’s CV shelf inside My page: what CVs they have, which one is primary, how complete each is, and the single control that decides whether employers can discover them at all. It is also where the consequences are made legible — a candidate should be able to see, in one place, who can find their CV and what they can see of it.',
        userStory:
          'As a jobseeker, I want to manage my CV and control who can see it, so that I stay in charge of my own data while still being findable by employers.',
        uiFields: [
          {
            group: 'CV list',
            items: [
              { name: 'cv card', type: 'composite', required: true, notes: 'name · file type · last updated · primary badge · completeness' },
              { name: 'primary', type: 'radio', required: true, notes: 'the CV used for quick apply and for employer search (Phase-1: exactly one)' },
              { name: 'actions', type: 'buttons', notes: 'View · Download · Replace · Rename · Delete' },
              { name: 'add CV', type: 'button', notes: 'routes to Create CV' },
              { name: 'completeness', type: 'derived %', notes: 'the same server-side formula as profile completeness — and a real CV-search ranking signal' },
            ],
          },
          {
            group: 'Visibility & privacy',
            items: [
              { name: 'cvVisibility', type: 'enum', required: true, notes: 'Discoverable · Hidden — one control, plainly worded, with its consequence stated next to it' },
              { name: 'what employers see', type: 'static copy', required: true, notes: 'locked preview vs. full CV after an unlock — so consent is informed rather than nominal' },
              { name: 'unlock history', type: 'list', notes: 'which companies unlocked this CV and when — the transparency counterpart to the employer’s paid unlock' },
              { name: 'hide from specific companies', type: 'ref[]', notes: 'the "not my current employer" case — see open questions' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Visibility — one switch, stated consequences',
            items: [
              'Discoverable — the primary CV can appear in employer CV search as a LOCKED preview; a company must spend an unlock to see the full CV and contact details.',
              'Hidden — the candidate does not appear in employer search at all. Applying still works, and an application still delivers the CV to that employer.',
              'Turning Hidden on removes the candidate from the search index immediately, not at the next re-index — a privacy control that lags is not a control.',
              'Hidden never affects applications already sent, and the screen says so, because "hide me" is easily read as "recall everything".',
              'The default is the safer value at account creation; the candidate opts in deliberately (default direction is flagged as an open question in the module).',
            ],
          },
        ],
        behaviors: [
          'Setting a CV as primary is a single tap and takes effect for quick apply immediately.',
          'Deleting a CV asks for confirmation and explains that CVs already sent with applications are not withdrawn.',
          'Replacing a CV keeps the record and its history, so applications that referenced the old snapshot still resolve.',
          'Toggling visibility to Hidden shows a confirmation stating exactly what stops and what does not.',
          'Completeness names one next action rather than only showing a percentage.',
          'The unlock history is read-only and appears only for candidates who are or have been Discoverable.',
          'Downloading returns the exact file an employer would see, so there is never a surprise about presentation.',
        ],
        rules: [
          'Exactly one CV is primary at any time (Phase-1).',
          'A candidate can read and write only their own CVs.',
          'Deleting a CV does not delete the snapshots already delivered with applications — the screen must not imply otherwise.',
          'Visibility is the candidate’s consent and can only be changed by the candidate; no system action and no HQ action may flip it.',
          'Hidden takes effect on the search index synchronously.',
          'Employer access to a full CV always requires either an application or a paid unlock — browsing alone never reveals a full CV or contact details.',
          'The last remaining CV can be deleted, but the screen warns that quick apply will stop working until another is added.',
        ],
        states: [
          'Empty (no CV — upload CTA)',
          'One CV (primary)',
          'Multiple CVs (if Phase-2 allows)',
          'Extraction still running on a new CV',
          'Discoverable',
          'Hidden',
          'Visibility change confirm',
          'Delete confirm',
          'Replacing (new version)',
          'Unlock history (empty / populated)',
        ],
        backend: {
          dataModel: [
            { name: 'cvId / isPrimary', type: 'uuid / bool', required: true, notes: 'a partial unique index enforces one primary per jobseeker' },
            { name: 'cvVisibility', type: 'enum', required: true, notes: 'discoverable|hidden — consent, stored on the candidate' },
            { name: 'hiddenFromCompanyIds', type: 'uuid[]', notes: 'the targeted-exclusion case, if the client wants it' },
            { name: 'CvUnlock', type: 'entity', notes: 'cvId, companyId, unlockedByUserId, unlockedAt, creditEntryId — the employer’s paid unlock, and the candidate’s transparency record' },
            { name: 'completenessScore', type: 'derived', notes: 'one server-side formula shared with My page and search ranking' },
          ],
          endpoints: [
            'GET /jobseeker/cvs',
            'PATCH /jobseeker/cvs/:id { name, isPrimary }',
            'DELETE /jobseeker/cvs/:id',
            'PATCH /jobseeker/privacy { cvVisibility, hiddenFromCompanyIds }',
            'GET /jobseeker/cvs/:id/unlocks — who unlocked this CV',
          ],
          integrations: ['CV search index (synchronous removal on Hidden)', 'Products & packages (unlock consumption)', 'Object storage'],
          notes:
            'Enforce one primary CV with a partial unique index rather than application logic. The visibility flag must be honoured by the search index itself, not filtered at read time — filtering after the fact is how a hidden candidate ends up in a result count.',
        },
        acceptance: [
          'Setting a CV primary changes what quick apply attaches.',
          'Switching to Hidden removes the candidate from employer search results and result counts immediately.',
          'Switching to Hidden does not affect applications already sent, and the UI says so before confirming.',
          'A candidate can see which companies unlocked their CV and when.',
          'Deleting a CV leaves previously sent application snapshots intact.',
          'No HQ or system action can change a candidate’s visibility setting.',
        ],
        openQuestions: [
          'Is visibility opt-in or opt-out by default at account creation? (Also open at module level.)',
          'Do candidates get the "hide from specific companies" control in Phase-1?',
          'Should a candidate be notified when a company unlocks their CV?',
          'Can a candidate ask for a CV already delivered to an employer to be deleted, and is that a manual HQ process?',
        ],
      },
    },
    // ── HQ OVERSIGHT ──────────────────────────────────────────────────────────
    {
      name: 'Resume list',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-resumes',
      detail: {
        description:
          'HQ’s view of the CV pool. It exists for three jobs: quality (is the pool real and usable?), support (a candidate or employer has a problem with a specific CV), and moderation (remove a fake, spam or abusive CV). It is not a second CV search — HQ does not source candidates for employers, and every open of a CV here is a PII event that gets logged. It is also the reference implementation the employer-facing CV search is researched against (see "Resume list — Companies").',
        userStory:
          'As an HQ operator, I want to inspect the CV pool and act on bad CVs, so that employers paying for CV search get a pool worth paying for — without HQ becoming a back channel to candidate data.',
        uiFields: [
          {
            group: 'List & filters',
            items: [
              { name: 'search', type: 'string', notes: 'candidate name / email / CV name — HQ arrives here looking for one record' },
              { name: 'source', type: 'enum', notes: 'Uploaded · Built online — the two Create CV routes' },
              { name: 'extractionStatus', type: 'enum', notes: 'Pending · Done · Failed — a pile of Failed is an extraction-quality problem, which is the point of showing it' },
              { name: 'visibility', type: 'enum', notes: 'Discoverable · Hidden — read-only; this is the candidate’s consent, not an HQ setting' },
              { name: 'completeness', type: 'range', notes: 'the pool-quality filter' },
              { name: 'moderationStatus', type: 'enum', notes: 'Normal · Flagged · Removed — the only status HQ owns here' },
              { name: 'updatedAt range', type: 'date range', notes: 'freshness of the pool' },
              { name: 'row', type: 'composite', notes: 'candidate (masked) · CV name · source · completeness · visibility · extraction · applications · unlocks · updated' },
            ],
          },
          {
            group: 'Detail',
            items: [
              { name: 'CV document', type: 'viewer', notes: 'opening it is a PII action and is audited — no silent inline preview in the list' },
              { name: 'extracted profile', type: 'read-only', notes: 'the structured layer with per-field confidence — the diagnostic view for extraction quality' },
              { name: 'candidate link', type: 'ref → Jobseeker', notes: 'through to the account (see Job seeker user management)' },
              { name: 'applications / unlocks', type: 'lists', notes: 'where this CV has been used — read-only' },
              { name: 'moderation', type: 'buttons + reason', notes: 'Flag · Remove from pool · Restore — a reason is required, and the action is audited' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — moderation is the only status HQ owns',
            items: [
              'Normal — the default. The CV participates in employer search subject to the candidate’s own visibility consent.',
              'Flagged — marked for review (suspected fake, spam, or offensive content). Still searchable in Phase-1 unless the client wants otherwise; the flag is a work queue, not a punishment.',
              'Removed from pool — excluded from employer CV search by HQ, with a mandatory reason. The candidate keeps their CV and can still apply with it; this removes discovery, not the person.',
              'Restore — returns a Removed CV to Normal; also audited.',
              'What HQ can never do: change the candidate’s visibility consent, edit CV content, or make a Hidden candidate discoverable. Moderation can only subtract from discoverability, never add to it.',
            ],
          },
          {
            heading: 'PII discipline — why this screen is deliberately awkward',
            items: [
              'Candidate contact details are masked in the list; unmasking is per-record and logged.',
              'Opening a CV document opens a viewer and writes an audit entry naming the operator, the candidate and the time.',
              'There is no bulk download and no bulk export of CV documents — the absence is the control.',
              'A tabular export of metadata is possible but audited, and it never includes the document or unmasked contact details.',
              'Every one of these entries lands in the same audit log as the rest of Admin (see Admin & access → Audit log), which is what makes "HQ looked at this CV" answerable.',
            ],
          },
        ],
        behaviors: [
          'Search is the primary interaction; HQ uses this to find a specific CV, not to browse candidates.',
          'Contact details are masked until deliberately revealed, and revealing is logged.',
          'Opening a CV requires an explicit action and is audited — there is no hover preview.',
          'Flag and Remove both require a reason; Remove takes the CV out of the employer search index immediately.',
          'Restoring returns the CV to Normal but does not touch the candidate’s own visibility setting.',
          'The extracted-profile view shows per-field confidence, which is how extraction quality problems get diagnosed against real CVs.',
          'A high count of Failed extractions is surfaced as a filter, because it is the leading indicator that the parser needs work.',
        ],
        rules: [
          'HQ is read-only on CV content and on candidate visibility consent. Moderation status is the only writable field.',
          'A reason is mandatory to Flag or Remove, and it is internal.',
          'Removing from the pool never deletes the candidate’s CV and never blocks them from applying with it.',
          'HQ cannot make a Hidden candidate discoverable under any circumstance — consent only moves in the candidate’s direction.',
          'Every CV document open, contact unmask and export is written to the audit log.',
          'No bulk export of CV documents exists.',
          'Which operators may moderate CVs is a permission, not a convention (see Admin roles & operators).',
        ],
        states: [
          'Loading',
          'Empty pool',
          'Filtered-empty',
          'Search result',
          'Detail open',
          'CV viewer open (audited)',
          'PII unmasked (audited)',
          'Flag / Remove confirm (reason required)',
          'Removed (excluded from search)',
          'Extraction failed (diagnostic view)',
          'Read-only (no moderation permission)',
        ],
        backend: {
          dataModel: [
            { name: 'moderationStatus', type: 'enum', required: true, notes: 'normal|flagged|removed' },
            { name: 'moderationReason / moderatedBy / moderatedAt', type: 'text / uuid / timestamp', notes: 'reason mandatory on flag and remove' },
            { name: 'searchExcluded', type: 'derived', notes: 'true when moderationStatus = removed OR the candidate’s visibility = hidden — the index reads this one flag' },
            { name: 'PiiAccessLog', type: 'entity', notes: 'actorId, cvId, jobseekerId, action(view_document|reveal_contact|export), at' },
          ],
          endpoints: [
            'GET /admin/resumes?q=&source=&extraction=&visibility=&moderation=&from=&to=&page=',
            'GET /admin/resumes/:id',
            'GET /admin/resumes/:id/document — streams the file, writes a PII audit entry',
            'POST /admin/resumes/:id/flag { reason }',
            'POST /admin/resumes/:id/remove { reason }',
            'POST /admin/resumes/:id/restore { reason }',
            'POST /admin/resumes/export — metadata only, audited',
          ],
          integrations: ['CV search index (immediate exclusion on remove)', 'Audit log', 'Job seeker user management (the account behind the CV)'],
          notes:
            'Collapse "should this CV be findable?" into a single derived flag the index reads, combining candidate consent and HQ moderation — two separate filters at query time is how a removed or hidden CV eventually leaks into a result. There is deliberately no endpoint that writes candidate visibility from Admin.',
        },
        acceptance: [
          'An operator can find a CV by candidate email and see its source, completeness and moderation status.',
          'Removing a CV from the pool excludes it from employer search immediately and does not stop the candidate applying with it.',
          'No Admin action can change a candidate’s visibility consent.',
          'Opening a CV document writes an audit entry naming the operator and the candidate.',
          'Flagging or removing without a reason is refused by the API.',
          'There is no endpoint that bulk-downloads CV documents.',
        ],
        openQuestions: [
          'Does a Flagged CV stay searchable while under review, or is it suspended pending a decision?',
          'Fixed moderation reason codes, or free text?',
          'Is the candidate told their CV was removed from the employer pool, and in what words?',
          'Who may moderate CVs — is this a dedicated trust & safety role rather than general ops?',
          'Do we need a duplicate-CV detector (the same CV uploaded under several accounts) for pool quality?',
        ],
      },
    },

    // ── CV DATA & MATCHING ARCHITECTURE — how data is sourced, structured & connected.
    {
      name: 'CV data & matching architecture',
      site: 'Jobseekers',
      scope: ['BE', 'FE'],
      notes: 'Cross-cutting foundation — connects the Jobseeker CV, the Job JD, employer CV-search and the CV↔JD match score. Data model, not a single screen.',
      detail: {
        description:
          'The plan for getting the structured data that matching and CV-search need WITHOUT asking candidates to fill long forms. Instead of VietnamWorks-style manual profiles, the candidate just uploads their CV and AI extracts a structured Candidate Profile from it. That one profile powers both (a) the CV↔JD match score and (b) employer CV search — so we never ask the user for data the CV already contains.',
        userStory:
          'As a candidate, I want to just upload my CV and be discoverable & matched, without filling in dozens of fields — so that applying is effortless while recruiters still get searchable, rankable data.',
        sections: [
          {
            heading: 'Principle — extract, don’t ask',
            items: [
              'Structured data is required for two things: matching (CV↔JD score) and CV search (facets + the general info shown to recruiters).',
              'The tension: asking users to type it = friction & drop-off (the VNW problem); not having it = weak matching & unsearchable CVs.',
              'Resolution: extract the structured layer from the uploaded CV with AI. The user only supplies the handful of things a CV cannot contain.',
            ],
          },
          {
            heading: 'Three data sources',
            items: [
              'CV (uploaded PDF/doc) → via AI parse: current role/title, years of experience, skills, work history, education, industry, location, languages. This is the bulk of the data — zero typing.',
              'User input (keep to ~4–5, optional): desired salary, desired role/location, availability / notice period, visibility consent, verified phone/email. Only what AI can’t read.',
              'Job description (JD) → already structured from the Create-job form: title, category, level, skills, experience range, industry, location, salary. See Job management.',
            ],
          },
          {
            heading: 'What AI can vs. cannot extract from a CV',
            items: [
              'CAN (auto-fill, high value): role/title, years of experience, skills, education, work history, industry, location, languages.',
              'CANNOT — must ask (optional): current/expected salary, desired role & location, availability. CVs rarely state these. This is the real (small) boundary of user input — not laziness.',
              'CONSENT is never inferred: candidate visibility (discoverable / hidden) is always an explicit user choice.',
            ],
          },
          {
            heading: 'Data flow — upload → profile → matching + search',
            items: [
              '1. Candidate uploads a CV (the only required action).',
              '2. AI parses it → a structured Candidate Profile, each field tagged with a confidence score + source.',
              '3. Candidate confirms low-confidence fields and adds the ~4–5 things AI can’t read (salary, preferences, consent) — one light screen, optional.',
              '4. The profile is normalised against a shared Skill/Title/Industry taxonomy, then indexed.',
              '5. That single profile powers BOTH employer CV search (facets + ranking) AND the CV↔JD match score.',
            ],
          },
          {
            heading: 'The join — a normalised taxonomy (the linchpin)',
            items: [
              'CV says “ReactJS”, JD says “React”, another says “React.js” — without a canonical vocabulary, matching & search silently fail.',
              'One canonical Skill / Title / Industry taxonomy that BOTH the AI extractor and the Create-job form map into.',
              'This is the highest-value backend investment — it is what actually lets CV and JD data connect.',
            ],
          },
          {
            heading: 'Matching score (CV ↔ JD)',
            items: [
              'Compare the Candidate Profile vector (skills, title, years, level, location, industry, salary) against the JD’s structured fields → a % fit.',
              'Phase 1 (no AI): simple field overlap + weights (skills ∩, years ≥, location =) — labelled “basic match”.',
              'Phase 2 (AI): embeddings / LLM for semantic match (React ≈ Frontend, “điều dưỡng” ≈ nurse) so exact tags aren’t needed.',
              'Store a match-score snapshot on the Application at apply time (stable + auditable).',
            ],
          },
          {
            heading: 'CV search (employer)',
            items: [
              'Faceted query over the extracted fields: role, skills, years, location, industry, salary expectation, last-updated.',
              'The extracted fields ARE the “general info to show” (current role, industry, years) AND the searchable facets — solved without asking the user.',
              'Ranking: relevance + recency (lastUpdatedAt) + completenessScore. Gated by package/credits + candidate visibility consent (see “Resume list — Companies”).',
            ],
          },
          {
            heading: 'Phasing',
            items: [
              'Phase 1 — launch without AI: upload CV + capture ~5 fields; keyword search + field-overlap matching. Ships fast, gathers CV volume.',
              'Phase 2 — turn on AI: parse each CV → auto-fill the Candidate Profile → real match % + rich CV search. Removes the user-input burden entirely.',
            ],
          },
        ],
        backend: {
          notes: 'One extracted structured layer (Candidate Profile) is the source of truth for both matching and search. Search likely needs a dedicated faceted index; matching may need a vector store in Phase 2.',
          dataModel: [
            { name: 'RawCV', type: 'file (pdf/doc)', notes: 'the uploaded document — human-readable, sent to employers' },
            { name: 'CandidateProfile', type: 'entity', notes: 'AI-extracted structured fields (role, skills[], years, education, industry, location, languages)' },
            { name: '  fieldSource / fieldConfidence', type: 'enum / 0–1', notes: 'per field: parsed vs user-confirmed, and extraction confidence' },
            { name: '  desiredSalary / desiredLocation / availability', type: 'user input', notes: 'the ~4–5 fields AI cannot read' },
            { name: '  visibility', type: 'enum(discoverable|hidden)', notes: 'explicit consent — never inferred' },
            { name: '  lastUpdatedAt / completenessScore', type: 'timestamp / number', notes: 'search-ranking signals' },
            { name: 'Skill/Title/Industry taxonomy', type: 'canonical lists', notes: 'the join both CV extraction and JD map into (normalisation)' },
            { name: 'MatchScore(profile, job)', type: 'computed', notes: 'field-overlap (P1) → embeddings/LLM (P2); snapshotted on Application' },
          ],
          integrations: [
            'AI CV-parsing (LLM or a vendor e.g. Affinda/Daxtra) — Phase 2',
            'Job management (JD structured fields)',
            'Application management (match-score snapshot)',
            'Products & packages + visibility consent (CV-search gating)',
          ],
        },
        openQuestions: [
          'Build vs. buy the CV parser — LLM prompt vs. a dedicated resume-parsing vendor? How good is Vietnamese-language extraction?',
          'Where does the canonical Skill/Title/Industry taxonomy come from — adopt an existing one, or curate our own?',
          'Matching: field-weighted score vs. embeddings — and is a match % shown to candidates, employers, or both?',
          'Salary data: ask candidates (optional) or leave blank — and do we ever show it in search?',
          'Does the match score run at apply time only, or continuously for recommendations?',
        ],
      },
    },

    // ── CV DATABASE & SEARCH (paid) — the employer-facing search over the CV pool.
    //    Authored as a research/discovery brief because we have no data model yet.
    {
      name: 'Resume list',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'co-resume-search',
      detail: {
        description:
          'The paid CV-search feature (Phase-1 flow #3): an employer buys a package, searches our pool of CVs by criteria, sees matching results with details LOCKED, then unlocks a candidate to view the full CV and contact them. ' +
          'This is a DISCOVERY / RESEARCH task before it is a build task. We do not yet have a CV data model, a criteria set, or ranking logic. The developer + BA must first investigate how a CV pool should be organised, indexed, searched and ranked — validate it against real sample CVs (2–3, provided later) and against reference products — and maintain a living design document as they go. Nothing here is final; treat the data model and endpoints below as a starting sketch to refine, not a spec to implement.',
        userStory:
          'As an employer, I want to search the CV database by the criteria that matter to me (title, skills, experience, location, salary…) and see the most relevant candidates first, so that I can find and contact the right people directly instead of waiting for applications.',

        sections: [
          {
            heading: 'Research scope — what to investigate',
            items: [
              'A. DATA & STRUCTURE — what fields make up a CV; which are structured (searchable/filterable) vs. free text; how each CV is stored so search is fast; how we "featurize" a CV (which attributes we extract and index).',
              'B. SEARCH & FILTER CRITERIA — the realistic criteria employers search by: keyword, job title, skills, years of experience, location, industry, education level, salary expectation, availability, last-active/updated date. Which are hard filters vs. soft/optional, and which matter most.',
              'C. MATCHING & RANKING — how results are ordered (relevance scoring, field weighting, recency, profile completeness); how to handle "no exact match" (fuzzy / related results).',
              'D. REFERENCE STUDY — how existing products organise and expose CV search, what to copy / avoid / do better (see Reference products below).',
              'E. GATING & PRIVACY — how results stay LOCKED until a package is bought; candidate visibility consent (a seeker must be discoverable); what an unlock consumes (credits) and reveals.',
            ],
          },
          {
            heading: 'Living document — maintain as you go (not just a final answer)',
            items: [
              'Findings — data structure, criteria, ranking approach.',
              'Reference notes — screenshots + notes from VietnamWorks and others.',
              'Proposed data model & search logic — recommended fields, filters, index, ranking.',
              'Open questions / decisions needed — anything blocking, for us to decide or provide.',
              'Assumptions — what was assumed where information was missing.',
              'Keep it updated continuously and flag blockers early so we can support you.',
            ],
          },
          {
            heading: 'Reference products to study',
            items: [
              'VietnamWorks — primary reference. We provide a login/account ID and buy the credits needed to test search, filters, result presentation and the unlock/credit model.',
              'Our own Admin "Resume list" — how HQ already views CVs.',
              'Secondary comparisons: TopCV, ITviec, LinkedIn Recruiter — filter sets and ranking cues.',
            ],
          },
          {
            heading: 'What we provide / how we support',
            items: [
              'Sample CV data — a small set (~2–3 CVs) to validate the model against, provided later.',
              'VietnamWorks access — account ID + purchased test credits.',
              'Fast product decisions — raise questions in the living document or directly.',
            ],
          },
          {
            heading: 'Suggested phases',
            items: [
              '1. Study references (VietnamWorks + our Admin resume list) → notes.',
              '2. Draft data model + criteria list → review with BA / product.',
              '3. Validate against real sample CVs once provided → refine.',
              '4. Propose search + ranking logic → review before any build.',
            ],
          },
        ],

        backend: {
          notes:
            'STARTING SKETCH ONLY — to be confirmed by the research. The point of the discovery task is to decide the real shape of this. Search likely needs a dedicated index (e.g. full-text / faceted) separate from the primary CV store.',
          dataModel: [
            { name: 'cvId', type: 'uuid', notes: 'one primary CV per seeker (Phase-1) — confirm' },
            { name: 'seekerId', type: 'uuid' },
            { name: 'title / desiredPosition', type: 'string', notes: 'primary keyword field' },
            { name: 'skills', type: 'string[]', notes: 'tag/faceted — a key search facet; needs normalisation' },
            { name: 'experienceYears', type: 'enum/number', notes: 'derived from work history?' },
            { name: 'location', type: 'enum (province/city)' },
            { name: 'industry / category', type: 'enum' },
            { name: 'educationLevel', type: 'enum' },
            { name: 'salaryExpectation', type: 'int (VND) / negotiable' },
            { name: 'visibility', type: 'enum', notes: 'discoverable · hidden — candidate consent gate' },
            { name: 'lastUpdatedAt / lastActiveAt', type: 'timestamp', notes: 'recency signal for ranking' },
            { name: 'completenessScore', type: 'number', notes: 'ranking signal — how filled-in the CV is' },
          ],
          endpoints: [
            'GET /company/resumes/search — faceted search; returns LOCKED previews + result count (TBD by research)',
            'POST /company/resumes/:id/unlock — consume a credit/package to reveal full CV + contact',
            'GET /company/resumes/:id — full CV (only after unlock)',
          ],
          integrations: ['Package / credit balance (Products & packages)', 'Candidate visibility consent'],
        },

        openQuestions: [
          'What exactly does a search result show while LOCKED (which fields are teased vs. hidden)?',
          'Does an unlock consume credits per-CV, and does re-viewing an already-unlocked CV cost again?',
          'Is "one seeker = one CV" firm for Phase-1, or can a seeker have multiple CVs to search over?',
          'What is the default candidate visibility — opt-in (discoverable only if the seeker allows) or opt-out?',
          'Which criteria are the priority filters for launch, and what drives default result ranking?',
          'Do we need our own search index (full-text/faceted), or is DB querying enough for Phase-1 volume?',
        ],
      },
    },
  ],
}
