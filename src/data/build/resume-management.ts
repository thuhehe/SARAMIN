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
          ['Create resume — Admin', 'HQ registers a candidate: upload + CV Convert, or the Builder wizard', 'HQ role'],
          ['Resume list — Companies', 'CV search / talent search', 'Package + candidate visibility consent'],
        ],
      },
      items: ['One jobseeker = one primary CV in Phase 1 — to CONFIRM with the client.'],
    },
    {
      label: 'The Saramin Standard Resume is the ONE model every route normalises to',
      text: 'A resume can arrive four ways — a candidate uploads a CV, a candidate builds one online, HQ uploads a CV on their behalf, HQ types one in. All four produce the same object: a CV document plus one Saramin Standard Resume (12 sections + job preferences + tags). Nothing downstream may branch on which route was used.',
      table: {
        cols: ['Route', 'Document set', 'How the structured layer is produced'],
        rows: [
          ['Upload (candidate or HQ)', 'original CV; + generated Saramin CV only after the OPTIONAL convert offer', 'CV Convert pipeline — parse, extract, AI-tag, generate'],
          ['Builder (candidate or HQ)', 'generated Saramin CV only', 'the typed fields, plus AI tagging over the body'],
        ],
      },
      warn: 'Search, matching and the employer-facing CV all read the standard model — never the route. If a Builder resume behaves differently in CV search from an uploaded one, the boundary has leaked.',
    },
    {
      label: 'DATA MODEL (decided): two tables — Profile + CV content',
      text: 'One Profile per jobseeker (collected during onboarding, Saramin-KR style) plus up to 3 CVs whose content the user creates or uploads (VietnamWorks-style). Employer search & matching read the Profile PLUS the one searchable CV.',
      table: {
        cols: ['Table', 'Cardinality', 'Holds', 'Collected'],
        rows: [
          ['Profile', '1 per jobseeker', 'Identity (full name, phone, email, photo) + preferences: desired role, desired locations (≤3), total experience, education level, desired salary, availability, visibility consent', 'Onboarding wizard (required core) + later nudges (optional fields)'],
          ['CV', 'up to 3 per jobseeker', 'Career content: summary, work experience[], education[], skills[], certifications[], languages[], projects[] — plus the document (uploaded file or generated Saramin PDF)', 'Created in the CV editor, or uploaded PDF → converted to the CV template with missing fields flagged'],
        ],
      },
      items: [
        'Exactly ONE CV is the searchable/main CV at any time; the other CVs are for applying to different kinds of jobs (e.g. tailored Dev vs Sales versions).',
        'Visibility is ONE account-level switch (Discoverable / Hidden, Indeed-style) — no per-CV searchable toggles. "Searchable CV" only decides WHICH CV\'s content feeds search and which document an unlocking employer sees.',
        'CV header (name, title, contact) is read from the Profile — never re-typed per CV.',
        'Upload → convert: an uploaded PDF is parsed into the CV template; missing REQUIRED fields are flagged and gate applying (this is also the anti-spam quality gate). Uploading a file to attach to ONE application does not touch the searchable CV.',
        'If Profile and a CV disagree, employer search reads Profile + the searchable CV — mismatches on the searchable CV are surfaced to the user, never silent.',
      ],
      warn: 'This supersedes any earlier profile-centric wording: career content lives in the CV table, not on the Profile. Search = Profile (identity + preferences) JOIN searchable CV (content).',
    },
    {
      label: 'Add a new CV — ONE entry, two routes, shared everywhere',
      text: 'Everywhere a candidate adds a CV — the My CVs page AND Apply → “Add a new CV” — opens the SAME flow: a single “Add new CV” action offering (1) Upload a CV or (2) Build a Saramin CV. The two surfaces must never diverge.',
      table: {
        cols: ['Step', 'What happens'],
        rows: [
          ['Upload a CV', 'AI reads the file and fills the Standard Resume — the candidate does NOT re-type what the CV already contains.'],
          ['Review = COMPARE', 'A full-screen side-by-side: the uploaded PDF on the LEFT, the same information restructured as a Saramin CV on the RIGHT. Gaps are flagged inline in the structure (the candidate reads missing details straight off their own PDF); AI-SUGGESTED skills appear as one-tap add chips.'],
          ['Document choice', 'Save my PDF only · Saramin CV only · BOTH (each saved document counts toward the 3-CV cap). The confirmed information is saved to the CV record regardless of the choice.'],
          ['Build a Saramin CV', 'For candidates with no file: the guided builder produces the document + the Standard Resume directly (no extraction step).'],
        ],
      },
      items: [
        'Upload ACCEPTANCE gate (anti-spam): a file is accepted as a CV only if parsing yields at least SOME core career content (work experience OR education). A file with none — a blank page, an image-only scan, an unrelated document — is refused with a helpful path: build manually or upload a clearer file. Missing but less-critical fields (skills, summary) never refuse the upload; they are asked for in Review.',
        'Saving an uploaded PDF as the CV document also SAVES the filled-in missing fields to the CV record — the structured layer is captured either way; “keep my PDF” never means “skip the data”.',
        'Two tiers of missing fields in Review: REQUIRED (the CV is not usable / searchable without them — e.g. desired title, visibility consent) shown in red; RECOMMENDED (optional, boosts ranking — skill-years, languages, desired salary, availability) shown with an impact hint, never blocking.',
        'One profile, many documents: the Standard Resume (the searchable / matchable layer) is SINGULAR and authoritative; a candidate may hold several CV DOCUMENTS (their original PDF + a Saramin version) and pick which to attach per application. This is the answer to “why not save two files?” — yes to two documents, no to two profiles.',
      ],
    },
    {
      label: 'Onboarding — CV-first, progressive, extract-don’t-ask',
      text: 'Profile creation at sign-up is short and CV-first, NOT a VietnamWorks-style long form. AI extraction gives us rich search/matching data without heavy typing: collect a small core by hand, get the rest from the CV, nudge the optional extras over time.',
      table: {
        cols: ['Tier', 'Fields', 'How we get them'],
        rows: [
          ['Required (to start)', 'Full name · desired title · location (city) · contact · visibility consent', 'Asked — a tiny set'],
          ['From AI (never ask)', 'Years of exp · occupation · industry · highest degree · skills · work history · education · languages', 'Extracted from the uploaded CV; DERIVE years & degree rather than asking'],
          ['Recommended (nudge later)', 'Desired salary · availability · years-per-skill · benefits wanted', 'Progressive prompts with an impact hint (“+X% recruiter views”)'],
          ['Optional / minimise', 'DOB · gender · nationality · marital status · street address · current salary · current title/level/industry · district · benefits wish-list', 'DROP: marital status, gender, nationality (VN default), current salary (desired salary is the signal), district, benefits picker. DERIVE current title/level/industry from the CV — never ask. DOB at most optional birth-year. Address = city only. Profile = the onboarding fields exactly — one form, one mental model, nothing asked twice.'],
        ],
      },
      items: [
        'Sign-up onboarding is a short GUIDED wizard (Saramin-KR style): job wanted → region → experience → education → get-seen, each step with a live job-count carrot. The LAST step shows matched jobs, then leads the candidate into creating their CV (upload or build — that fork lives on My CVs, not in onboarding).',
        'Progressive & skippable: collect the minimum to start, let the candidate browse/apply immediately, then raise completeness over time. Nothing in onboarding blocks applying.',
        'Motivate with carrots, not required-asterisks: show the payoff at each step (“12,400 jobs match your info so far”, “+40% recruiter views”) — the Saramin-KR pattern. This is also why a partly-filled profile reads as a guided to-do list, not a broken page.',
      ],
      warn: 'Do NOT rebuild VietnamWorks’ long basic-info form. Rich data comes from AI extraction + progressive nudges, never a wall of required fields at sign-up.',
    },
    {
      label: 'CV search is a DISCOVERY task first',
      text: 'How the CV pool is structured, indexed, searched and ranked must be researched before any build. See the “Resume list — Companies” feature.',
    },
    {
      label: 'Do NOT burden candidates with heavy TYPING',
      text: 'The structured data needed for matching and CV search is EXTRACTED from the uploaded CV by AI — not typed by the user. See “CV data & matching architecture”.',
      items: [
        'The objection is to typing, NOT to a complete profile. The apply form collects the full profile (~24 fields, grouped) — every field the CV can supply arrives pre-filled, and the candidate confirms rather than types. See Application management → Apply flow.',
        'Read the rule as: never ask for anything a CV already contains. A pre-filled field costs a glance; the same field blank costs a candidate.',
      ],
      warn: 'This rule DEPENDS on extraction being live. With the parser off, a pre-filled confirmation form degrades into a 24-field blank form at the exact moment a candidate is trying to apply — flagged as an open question on Apply flow.',
    },
    {
      label: 'Why we parse the CV into a structured database (not just store the PDF)',
      text: 'A PDF is opaque to software — you cannot search, filter, rank or match on it. Parsing every CV into one structured Candidate Profile is the foundation that unlocks the whole employer side.',
      table: {
        cols: ['Capability', 'Needs structured data because…'],
        rows: [
          ['CV search (the paid feature)', 'Recruiters search by facets — title, skills, years, location. A PDF has no facets.'],
          ['CV ↔ JD match score', 'A % fit is computed by comparing profile fields to the job’s fields — impossible on raw text.'],
          ['Filter & rank a large pool', 'Narrow thousands of CVs and order them by relevance / recency / completeness.'],
          ['Recommendations & alerts', 'Suggest jobs to candidates, surface new matching CVs to recruiters.'],
          ['Quick-apply autofill', 'Pre-fill the application from the profile so applying is one tap.'],
          ['Pool quality & dedup', 'Completeness scoring, spotting duplicate / thin CVs.'],
          ['Market analytics', 'What skills the pool holds vs. what employers demand.'],
        ],
      },
      warn: 'This is the foundation feature: CV search, matching and recommendations ALL depend on it. It is the first thing to assign — see “CV data & matching architecture” → Kick-off.',
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
              { name: 'optional sections', type: 'repeatable ×8', notes: 'Foreign Language · Highlight Project · Certificates · Awards · Activities · Publications · References · Recommendations — the SAME full section set as My Profile, added from the completeness rail. Each renders its real field form (one shared field catalogue with the profile edit sheets), so a CV built here can carry everything the profile can' },
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
              'Upload → the mindset is “I want my PDF there, that’s it.” The file is saved as a CV in ONE step, byte-identical, immediately usable for applying. Conversion to a Saramin CV is an OFFER shown right after saving — never a step in the way. Accepting moves the candidate onto the create-Saramin-CV path with AI pre-fill; declining costs nothing, and the offer stays available from My CVs.',
              'Create Saramin CV → the structured, searchable CV. The form can be filled two ways that land in IDENTICAL fields: typed manually, or pre-filled by uploading a PDF (“Upload & pre-fill”) — the PDF is just a faster pen. Output is a generated CV document plus the structured profile.',
              'The post-upload convert offer and the Builder’s pre-fill option are two entrances to the SAME extraction flow and the same review/compare screen — one pipeline, never two.',
              'Downstream, nothing cares which route was used: an application attaches a CV document, and search reads the Candidate Profile. Keeping that boundary clean is what allows Phase-1 to ship without AI at all.',
              'Phase-1 without AI: an upload still produces a CV; the structured profile is then only what the candidate confirms in the light review step. Phase-2 turns extraction on and the review step gets shorter, not longer.',
            ],
          },
          {
            heading: 'Missing fields after a PDF upload — four tiers, one rule each',
            text: 'Extraction WILL miss things — scanned pages, two-column layouts, dates written as "spring 2020". The policy is tiered by how much the missing piece matters, and the one global rule is: a gap never destroys the upload. The only hard gate is at the file level.',
            table: {
              cols: ['Tier', 'Example', 'What happens'],
              rows: [
                ['File unusable as a CV', 'No readable work experience AND no readable education', 'The upload is refused as a CV with a plain reason, and the candidate is offered the Builder instead. This is the ONLY blocking tier.'],
                ['Core field unreadable', 'Employment dates, a job title, a school name', 'Flagged INLINE in the structured view, at the exact spot in the structure where it belongs, with an empty field to type into — while the PDF sits beside it, so the answer is on screen. Saving is still allowed with the gap open.'],
                ['Optional section absent', 'Languages, projects, certificates, awards', 'Never flagged as an error — shown as compact “＋ Add” prompts. Absence of an optional section is normal, not a defect.'],
                ['Contact field missing', 'Phone (no social provider returns one), email', 'Not this screen’s problem alone: the apply flow asks for name / email / phone before the first application is delivered (see Application management → Apply flow). That is the last net — a candidate can never reach an employer contactless.'],
              ],
            },
            items: [
              'Gaps are not free: an unfilled core field costs completeness score and search ranking, and the screen says so — the candidate is nudged with consequences, never blocked.',
              'Every gap the candidate fills here is written to the structured profile only. The PDF is never modified — recruiters who download the original get the original.',
              'The same tiering serves Phase-1 without AI: with the parser off, every core field is simply “unreadable” and the review step becomes the light manual form.',
            ],
          },
        ],
        behaviors: [
          'Upload never forces conversion: the PDF is saved as a CV first, and “Also create a Saramin CV?” is asked after — a candidate who declines still has a complete, usable CV.',
          'The convert offer is asked ONCE at save time and then lives as a quiet action on the CV card in My CVs — it is never a recurring nag.',
          'A file is validated for type and size before upload, with an explicit error rather than a silent failure.',
          'After upload, extraction runs and the candidate is shown only the low-confidence fields to confirm — a high-confidence extraction is not put in their way.',
          'Any extracted value is editable, and a user edit always beats the extracted value.',
          'The builder saves as a draft continuously, because losing a half-typed work history is the fastest way to lose the candidate.',
          'Skills autocomplete against the canonical taxonomy; a free-typed skill offers the closest canonical match rather than being stored raw.',
          'The builder generates a downloadable PDF, so a candidate who builds here ends up with a file they can use elsewhere.',
          'Finishing routes back to whatever the candidate was doing — usually the job they wanted to apply to.',
          'Re-uploading to replace a CV keeps the same CV record and version history; it does not silently create a second CV.',
          '“Fill profile from CV” is available on demand from My CV & Profile — not only at first upload. The candidate picks an existing CV (or uploads a new one), extraction runs behind a short “reading your CV” state, and a success step lists the sections that were filled (Personal info, Work experience, Education, Skills) before dropping them into the review step. It is review-and-confirm, never “fill 11 forms”, and it is the on-ramp that turns an uploaded PDF into the structured Saramin CV.',
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
          'Fill from CV — select which CV (current / new upload)',
          'Extracting',
          'Fill from CV — success (sections filled) → review',
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

    {
      name: 'Create resume',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'admin-resume-new',
      detail: {
        description:
          'How HQ gets a candidate into the resume master. Two routes into one object: ① UPLOAD an existing CV (PDF/DOC/DOCX) and run it through the CV Convert pipeline, or ② the CV BUILDER WIZARD for a candidate who has no file. Both routes converge on a single “Saramin standard resume — review & edit” screen, and neither writes to the master until an operator has reviewed it there. This is the same object the candidate-facing Create CV produces — see that feature for the jobseeker-side route.',
        userStory:
          'As an HQ operator, I want to register a candidate from either an uploaded CV or a typed form, so that the resume master holds one consistent, searchable, matchable object no matter where the candidate came from.',
        sections: [
          {
            heading: 'Two paths, one Saramin standard model',
            items: [
              '① Upload CV (PDF/DOC/DOCX) — AI parses the file and converts it into the Saramin standard format. This is the primary route and the one the data strategy is built around.',
              '② CV Builder wizard — a step-by-step form (basics · headline & body · tags) that ends on the same standard resume, for the candidate who has no file to give.',
              '“Choose another path” is available at any point before the review screen. Switching costs nothing because neither route has written to the master yet.',
              'Only the DOCUMENT SET differs between the routes: Upload carries the original PDF plus the generated Saramin PDF, Builder carries only the generated one. The review screen, the standard JSON and the register action are identical.',
            ],
          },
          {
            heading: 'CV Convert pipeline — the four steps of the Upload route',
            text: 'Strictly sequential, and a progress disclosure rather than a stepper the operator can jump around in. Each step reveals its own result card as it completes.',
            table: {
              cols: ['#', 'Step', 'What it does', 'Result card shows'],
              rows: [
                ['①', 'Parse PDF', 'Extract text and layout from the original CV.', 'the raw parse — file, page count, token count, and the lines it found'],
                ['②', 'Extract structured fields', 'Map name, contact, experience, education and skills onto the Saramin schema.', 'the headline fields: headline, location, experience, education'],
                ['③', 'AI tag suggestions', 'Suggest Skill / Role / Domain tags, each with a confidence.', 'the confidence-scored tag chips + the auto-apply threshold notice'],
                ['④', 'Generate Saramin-standard resume', 'Render a new Saramin CV PDF from the standard template.', 'the generated PDF handle, ready for review'],
              ],
            },
            items: [
              '“Review & edit extracted result” appears only once the pipeline reaches done — an operator cannot carry a half-parsed resume onto the review screen.',
              'Changing or removing the selected file resets the pipeline to idle; a stale result is never shown against a new file.',
              'The same pipeline is reused on an already-registered resume as “Re-analyse & regenerate”, so extraction quality can be improved later without re-uploading (see Resume list → detail).',
              'Extraction must be asynchronous and non-blocking in the real build: the CV is usable the moment it is uploaded, and a failed parse degrades to the manual form rather than blocking registration.',
            ],
          },
          {
            heading: 'AI tagging — confidence decides who reviews',
            table: {
              cols: ['Confidence', 'What happens'],
              rows: [
                ['≥ 80%', 'Auto-applied — pre-checked on the tag panel and carried into the standard resume.'],
                ['< 80%', 'Suggested but left unchecked; it goes to the operator approval queue rather than into the resume.'],
              ],
            },
            items: [
              'Every tag carries a kind: Skill · Role · Domain. Only CHECKED tags are applied — a suggestion is not a decision.',
              'The Builder route runs the same suggestion over the typed resume body, so both routes produce identically-shaped tags. A Builder resume is not second-class in CV search.',
              'Tag suggestion needs content: the panel is disabled until the resume body has been filled in.',
              'Re-running suggestion replaces the suggestion set, not the operator’s checkmarks.',
            ],
          },
          {
            heading: 'CV Builder wizard — four steps, with gates',
            table: {
              cols: ['Step', 'Captures', 'Cannot advance until'],
              rows: [
                ['1. Personal info', 'Full name, email, phone, location', 'name, phone and location are non-empty AND the email is a valid address'],
                ['2. Headline & content', 'Headline + free-text resume body', 'both the headline and the body are non-empty'],
                ['3. AI tags', 'Runs tag suggestion over the body; the operator checks what applies', '— no gate; zero tags is allowed'],
                ['4. Preview & submit', 'Read-back of every field, the tag set, and source = SELF_REGISTER', '— Continue hands off to the review screen'],
              ],
            },
            items: [
              'Back is always available and never clears a step.',
              'An incomplete step shows ONE error line rather than per-field red states.',
              'Step 4 is a read-back, not the real review — the convergence screen is where the standard resume is actually edited.',
              'Hand-off folds the free text into the standard model: headline + body become the VI summary, location becomes the address city, and each checked tag becomes a Skill tag at 0.95 confidence. Every other section starts empty for the operator to fill on the review screen.',
            ],
          },
          {
            heading: 'Convergence screen — “Saramin standard resume, review & edit”',
            items: [
              'LEFT — the CV documents, as a viewer with one tab per document. The badge states which documents exist: Original + Saramin · Original only · Saramin only · No CV.',
              'RIGHT — the job-matching keys panel, then one editor card per section of the standard model.',
              '“Register to resume master” is the ONLY write in the whole flow. Until it is pressed nothing exists in the master, so abandoning costs nothing and creates no orphan record.',
              'Back returns to whichever route the operator came from — but note that today it RESETS that route: the pipeline drops to idle and the wizard to step 1. Cheap to live with while nothing is committed, annoying after a four-step parse. Flagged as an open question.',
              'The same screen serves EDIT mode on an existing resume: it PATCHes instead of POSTs, and additionally exposes the admin CV unlock-price override.',
            ],
          },
          {
            heading: 'Job matching keys — “can this resume actually be found?”',
            text: 'Nine derived readiness indicators, each Ready or Missing with a short preview of the value. They are named after the JOB-POSTING filters, not after the resume’s own fields, because the question they answer is which job filters this resume can be matched by.',
            table: {
              cols: ['Key', 'Ready when', 'Preview shows'],
              rows: [
                ['Job categories', 'desiredJobCategories is non-empty', 'the first 3, · separated'],
                ['Employment types', 'desiredEmploymentTypes is non-empty', 'all selected values'],
                ['Career', 'careerLevel ≠ ANY OR yearsOfExp > 0', '“EXPERIENCED · 3y”, else just the level'],
                ['Education', 'at least one education entry', 'degree · school of the first entry'],
                ['Industries', 'targetIndustries is non-empty', 'the first 3'],
                ['Language certs', 'at least one language entry', 'language:cert:score, first 3'],
                ['Salary', 'an expected salary with a min, OR kind = INTERVIEW', '“min~max CURRENCY”, or INTERVIEW'],
                ['Locations', 'desiredLocations is non-empty', 'the first 3'],
                ['Remote / relocate / overseas', 'any of remoteOk · relocate · overseas is on', 'which ones are on'],
              ],
            },
            items: [
              'The keys are derived LIVE from the draft, so an operator watches a key flip to Ready as they fill the section that feeds it.',
              'An all-Missing resume registers fine but is close to invisible in CV search — which is exactly what the panel is there to make obvious before the operator commits.',
            ],
          },
          {
            heading: 'Source — where the resume came from',
            table: {
              cols: ['Value', 'Means'],
              rows: [
                ['IMPORT', 'the Upload route — a real CV file was parsed'],
                ['SELF_REGISTER', 'the Builder route (accepted by the API, stored as DIRECT)'],
                ['DIRECT', 'registered by HQ directly'],
                ['PARTNER', 'supplied by a partner channel'],
                ['REFERRAL', 'came in through a referral'],
              ],
            },
            items: [
              'source is set BY THE ROUTE, not chosen by the operator: Upload → IMPORT, Builder → SELF_REGISTER.',
              'An unknown source token is a hard 400 rather than being coerced to a default — a mystery source is worse than a rejected request.',
            ],
          },
        ],
        uiFields: [
          {
            group: 'Route choice',
            items: [
              { name: 'path', type: 'enum', required: true, notes: 'Upload CV · CV Builder wizard — decides `source` and the document set' },
              { name: 'file', type: 'file (pdf/doc/docx)', notes: 'upload route — type and size validated before upload, with an explicit error' },
              { name: 'pipeline', type: 'derived state', notes: 'idle · running(step 1–4) · done — resets whenever the file changes' },
            ],
          },
          {
            group: 'Identity & contact',
            items: [
              { name: 'fullNameVi', type: 'string', required: true, notes: 'the VI name is the canonical one; EN/KO are alternates, not translations to be generated' },
              { name: 'fullNameEn / fullNameKr', type: 'string', notes: 'real VN CVs carry a Latin and sometimes a Korean transliteration' },
              { name: 'dob', type: 'date', notes: '—' },
              { name: 'gender', type: 'enum', notes: 'M · F · OTHER · unset' },
              { name: 'email', type: 'string', required: true, notes: 'the de-duplication key for the master' },
              { name: 'phone', type: 'string', required: true, notes: '—' },
              { name: 'address.city / district / road', type: 'string', notes: 'city is what search facets on; district and road are display only' },
              { name: 'photoUrl', type: 'string', notes: 'optional — VN CVs commonly carry a photo' },
            ],
          },
          {
            group: 'Summary — trilingual',
            items: [
              { name: 'summary.vi', type: 'text', required: true, notes: 'the default and fallback language; its FIRST LINE becomes the resume headline' },
              { name: 'summary.en / summary.ko', type: 'text', notes: 'optional — a Korean-facing employer reads the KO summary when present' },
            ],
          },
          {
            group: 'Experience — repeatable',
            items: [
              { name: 'company / position', type: 'string', required: true, notes: 'position normalises to the Title taxonomy' },
              { name: 'location', type: 'string', notes: '—' },
              { name: 'startYm / endYm', type: 'YYYY-MM', required: true, notes: 'an empty endYm means “present” — this drives years-of-experience' },
              { name: 'areas', type: 'string[]', notes: 'comma-entered — the part of the business worked on (Storefront, Admin…)' },
              { name: 'bullets', type: 'string[]', notes: 'one achievement per line' },
              { name: 'techStack', type: 'string[]', notes: 'comma-entered — a source for skill extraction' },
            ],
          },
          {
            group: 'Education — repeatable',
            items: [
              { name: 'school', type: 'string', required: true, notes: '—' },
              { name: 'faculty / major', type: 'string', notes: '—' },
              { name: 'degree', type: 'enum', required: true, notes: 'HIGH_SCHOOL · ASSOCIATE · BACHELOR · MASTER · DOCTOR' },
              { name: 'startYm / endYm', type: 'YYYY-MM', notes: 'derives highestEducationLevel' },
              { name: 'gpa', type: 'string', notes: 'free text — “3.4 / 4.0” is how CVs actually write it' },
              { name: 'achievements', type: 'string[]', notes: 'one per line' },
            ],
          },
          {
            group: 'Skills — grouped, not a flat list',
            items: [
              { name: 'group', type: 'string', required: true, notes: 'Frontend · State & Data · Tools · Office · Soft Skills — real CVs group their stack' },
              { name: 'items', type: 'string[]', required: true, notes: 'comma-entered; each must resolve to the canonical Skill taxonomy, not a free string' },
            ],
          },
          {
            group: 'Languages — repeatable',
            items: [
              { name: 'language', type: 'enum', required: true, notes: 'vi · en · ko · ja · zh' },
              { name: 'cert', type: 'enum', notes: 'TOPIK · TOEIC · TOEFL · IELTS · OPIC · JLPT · HSK — the cert lines VN CVs actually carry' },
              { name: 'score', type: 'string', notes: 'free text because the scales differ: “5급”, “805”, “N3”' },
              { name: 'levelHint', type: 'enum', notes: 'BASIC · INTERMEDIATE · ADVANCED · FLUENT · NATIVE — for the CV with no cert' },
            ],
          },
          {
            group: 'Certifications · Projects · Awards',
            items: [
              { name: 'certification', type: '{ name, issuer?, score?, year? }', notes: 'MOS, AWS and the like' },
              { name: 'project', type: '{ name, role?, startYm?, endYm?, techStack[], bullets[], links[] }', notes: 'link kinds: demo · github · docs' },
              { name: 'award', type: '{ name, year?, issuer? }', notes: 'awards and activities share one section' },
            ],
          },
          {
            group: 'References · Portfolio',
            items: [
              { name: 'reference', type: '{ name, role, relation?, phone? }', notes: 'VN CVs routinely list a referee WITH a phone number — this section is PII-heavy' },
              { name: 'portfolioLink', type: '{ kind, url }', notes: 'github · linkedin · behance · web' },
            ],
          },
          {
            group: 'Job preferences — what the matching keys read',
            items: [
              { name: 'careerLevel', type: 'enum', required: true, notes: 'FRESHER · EXPERIENCED · ANY' },
              { name: 'yearsOfExp', type: 'number', notes: 'derived from work history, overridable' },
              { name: 'desiredJobCategories', type: 'string[]', notes: 'comma-entered — matches the job form’s category filter' },
              { name: 'desiredEmploymentTypes', type: 'enum[]', notes: 'FULL_TIME · CONTRACT · FREELANCE · INTERN · DISPATCH · ENTRUSTED · PART_TIME' },
              { name: 'desiredLocations', type: 'string[]', notes: 'comma-entered' },
              { name: 'targetIndustries', type: 'string[]', notes: 'comma-entered' },
              { name: 'expectedSalary', type: '{ kind, currency, min?, max? }', notes: 'kind: ANNUAL · MONTHLY · INTERVIEW · INTERNAL_RULE; currency: VND · USD' },
              { name: 'remoteOk / relocate / overseas', type: 'bool', notes: 'the three mobility flags, read as one matching key' },
            ],
          },
          {
            group: 'Tags',
            items: [
              { name: 'kind', type: 'enum', required: true, notes: 'Skill · Role · Domain' },
              { name: 'value', type: 'string', required: true, notes: 'must resolve to the canonical taxonomy; a blank entry is a 400' },
              { name: 'confidence', type: '0–1', notes: 'from the AI suggestion; ≥ 0.8 auto-applies. A hand-added tag is 1.0' },
            ],
          },
          {
            group: 'Admin-only — edit mode',
            items: [
              { name: 'unlockPrice', type: 'int [1, 1000]', notes: 'credits an employer spends to unlock this CV. WRITE-ONLY “set to”: the current price is not returned by the detail endpoint, so blank means unchanged' },
            ],
          },
        ],
        behaviors: [
          'The picker is the entry point; neither route is pre-selected for HQ, because an operator with a file in hand and an operator on the phone with a candidate are equally common.',
          'A file is validated for type and size before upload, with an explicit error rather than a silent failure.',
          'The pipeline runs on an explicit “Start analysis” — it does not auto-start on file select, so an operator can swap a wrong file without watching a run they will discard.',
          'While the pipeline is running, removing the file is disabled; the run is either finished or reset, never orphaned.',
          'Tags at ≥ 80% confidence arrive pre-checked; the operator unchecks rather than hunts for what to add.',
          'Every extracted value is editable on the review screen, and an operator edit always beats the extracted value.',
          'The matching-keys panel recomputes on every keystroke, so filling “desired locations” flips its key to Ready immediately.',
          'Register navigates to the new resume’s detail page; a failure keeps the draft on screen with the server’s message, and never silently discards the work.',
          'In edit mode, a blank unlock price is omitted from the request entirely — an absent key means “leave it”, and an explicit null would be rejected.',
        ],
        rules: [
          'Nothing is written to the resume master until Register — the pipeline, the wizard and the review screen are all pre-commit.',
          'A resume must have a document: uploaded, generated, or both. A structured profile alone is not a resume.',
          'The flat columns are DERIVED from the standard model on register, never the other way round: headline = the first line of the VI summary, content = the VI summary (falling back to EN, then KO).',
          'Register requires a real name and a real email. The wireframe substitutes placeholders to keep the demo moving; the production build must validate and refuse instead.',
          'source is determined by the route, and an unrecognised source token is a 400.',
          'A blank tag entry is a 400 — an empty tag pollutes the taxonomy join that CV search depends on.',
          'unlockPrice is an integer in [1, 1000]; it is validated client-side for a clear message and re-validated by BE, which owns the invariant.',
          'Skills, titles and industries must resolve to the canonical taxonomy — this is the join that makes CV search and matching work at all.',
          'Registering a resume on a candidate’s behalf does not grant visibility consent: an HQ-created resume is not discoverable until the candidate consents (see My CVs).',
          'Opening or generating a CV document from this flow is a PII event and is audited like every other document access (see Resume list — Admin).',
        ],
        states: [
          'Path picker',
          'Upload — no file selected',
          'Upload — file selected, pipeline idle',
          'Upload rejected (type / size)',
          'Pipeline running (step 1–4, one result card per completed step)',
          'Pipeline done → “Review & edit extracted result” unlocked',
          'Pipeline failed (CV still attachable; profile falls back to the manual form)',
          'Builder — step 1–4',
          'Builder — step gate not met (one error line)',
          'AI tags — idle / needs content / analysing / suggested',
          'Review & edit — draft (documents: both · original only · saramin only · none)',
          'Review & edit — matching keys all Missing (registers, but near-invisible in search)',
          'Registering',
          'Register failed (draft preserved, server message shown)',
          'Registered → resume detail',
          'Edit mode (PATCH + unlock-price override)',
        ],
        backend: {
          dataModel: [
            { name: 'standardJson', type: 'text', required: true, notes: 'the whole Saramin Standard Resume, serialised. BE stores it VERBATIM and opaque — no schema validation — so the FE must hydrate defensively: a partial or foreign JSON falls back per-section instead of crashing the detail page' },
            { name: 'fullName / email / phone / locationVi', type: 'string', required: true, notes: 'flat columns derived from identity on register — these are what the list and search read' },
            { name: 'headline / content', type: 'string / text', notes: 'derived from the VI summary (first line / whole); the list hard-nulls content and standardJson in rows — the detail endpoint returns the full payload' },
            { name: 'source', type: 'enum', required: true, notes: 'DIRECT · PARTNER · IMPORT · REFERRAL · SELF_REGISTER (stored as DIRECT)' },
            { name: 'tags', type: 'string[]', notes: 'the checked tag values, flattened' },
            { name: 'originalCvUrl / saraminCvUrl', type: 'string?', notes: 'Upload carries both; Builder carries only the generated Saramin PDF' },
            { name: 'unlockPrice', type: 'int [1,1000]', notes: 'admin override, edit mode only — not present in the detail response, so the field is write-only' },
          ],
          endpoints: [
            'POST /api/admin/resumes — register; body carries the flat columns + standardJson + tags + document urls → { resume: { id } }',
            'PATCH /api/admin/resumes/:id — edit mode; an OMITTED unlockPrice means untouched, an explicit null is a 400',
            'GET /api/admin/resumes — list; updatedAt desc, 500-row cap, tags included, content and standardJson hard-nulled',
            'GET /api/admin/resumes/:id — detail, including the full standardJson',
            'POST /api/admin/resumes/:id/reanalyze — re-run the CV Convert pipeline on an existing resume',
          ],
          integrations: [
            'Object storage + malware scanning (the uploaded original)',
            'AI CV parsing — the CV Convert pipeline (Phase-2)',
            'Skill / Title / Industry taxonomy (the tag + skill join)',
            'PDF generation (the Saramin standard template)',
            'Audit log (document access, PII)',
          ],
          notes:
            'The standard resume lives in ONE serialised column rather than twelve normalised tables, and the search index is fed from the flat columns plus tags. That is a deliberate trade: the model is still moving, and a JSON sidecar absorbs a schema change that twelve tables would not. The cost is that BE cannot validate it, which is exactly why defensive hydration on read is a hard requirement and not a nicety. Revisit once the schema stops moving and CV search needs to facet on a section the flat columns do not carry.',
        },
        acceptance: [
          'An operator can register a candidate from an uploaded PDF, and the resume appears in the master with both document urls set.',
          'An operator can register a candidate through the Builder with no file, and the resume carries only the generated Saramin PDF.',
          'Both routes produce the same standard-resume shape, and the review screen is identical for each.',
          'The pipeline cannot be skipped: “Review & edit” is unreachable until all four steps complete.',
          'Changing the selected file resets the pipeline; no stale result is ever shown against a new file.',
          'Tags at ≥ 80% confidence arrive pre-checked; tags below it arrive unchecked.',
          'The matching-keys panel flips a key from Missing to Ready as soon as the section feeding it is filled.',
          'Abandoning the flow at any point before Register leaves nothing in the resume master.',
          'A failed register keeps the draft on screen and shows the server’s message.',
          'In edit mode, leaving the unlock price blank does not change the stored price; a value outside [1, 1000] is refused with a clear message.',
          'A resume registered by HQ is not discoverable in employer search until the candidate consents.',
        ],
        openQuestions: [
          'Does HQ registering a resume on a candidate’s behalf create a jobseeker ACCOUNT too, or a resume with no login behind it?',
          'How is a duplicate caught when HQ uploads a CV for a candidate who already has an account — match on email, phone, or both?',
          'Who tells the candidate a resume exists for them, and does the flow send anything?',
          'Is the operator approval queue for sub-80% tags a real screen in Phase-1, or do those tags simply get dropped?',
          'Should the Builder route generate the Saramin PDF at register time, or lazily on first employer view?',
          'Does the client want the trilingual summary (VI/EN/KO) in Phase-1, or is VI-only enough to launch?',
          'Should Back preserve the route state (pipeline result / wizard answers), or is resetting acceptable given nothing is committed yet?',
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
        uiFields: [
          {
            group: 'Candidate Profile — the canonical schema (the contract everything builds on)',
            items: [
              { name: 'headline / currentTitle', type: 'string → Title taxonomy', notes: 'from CV; the primary keyword field for search' },
              { name: 'location', type: 'enum (province/city)', notes: 'from CV; a core search facet' },
              { name: 'totalYearsExperience', type: 'number (derived)', notes: 'computed from work history — a core filter' },
              { name: 'seniorityLevel', type: 'enum', notes: 'Intern · Fresher · Junior · Senior · Manager · Director — derived from titles/years' },
              { name: 'industry', type: 'enum → Industry taxonomy', notes: 'from CV' },
            ],
          },
          {
            group: 'Work experience (repeatable)',
            items: [
              { name: 'company / title', type: 'string', notes: 'title normalises to the Title taxonomy' },
              { name: 'startDate / endDate / isCurrent', type: 'date / date / bool', notes: 'drives totalYearsExperience and "currently employed"' },
              { name: 'description', type: 'text', notes: 'free text — a source for skill extraction' },
            ],
          },
          {
            group: 'Education (repeatable)',
            items: [
              { name: 'school / degree / major', type: 'string', notes: 'degree maps to a level enum' },
              { name: 'startDate / endDate', type: 'date', notes: 'derives highestEducationLevel' },
            ],
          },
          {
            group: 'Skills & languages',
            items: [
              { name: 'skills', type: 'ref[] → Skill taxonomy', notes: 'THE key facet — must be normalised, never free strings (see “The join”)' },
              { name: 'skill.yearsUsed / proficiency', type: 'number / enum', notes: 'optional — richer ranking when present' },
              { name: 'languages', type: '{ language, proficiency }[]', notes: 'e.g. English — Professional; a search facet' },
              { name: 'certifications', type: '{ name, issuer, date }[]', notes: 'optional' },
            ],
          },
          {
            group: 'Candidate asks — the ~5 fields AI cannot read (user input, optional)',
            items: [
              { name: 'desiredSalary', type: 'int (VND) / negotiable', notes: 'CVs rarely state this — ask, do not infer' },
              { name: 'desiredRole / desiredLocation', type: 'string / enum', notes: 'preferences for matching & recommendations' },
              { name: 'availability / noticePeriod', type: 'enum', notes: 'Immediate · 1 month · … — a recruiter filter' },
              { name: 'visibility', type: 'enum (discoverable|hidden)', required: true, notes: 'explicit consent — NEVER inferred' },
            ],
          },
          {
            group: 'System / derived (not shown as inputs)',
            items: [
              { name: 'fieldSource / fieldConfidence', type: 'enum / 0–1', notes: 'per field: parsed vs user-confirmed, and how sure the parser was' },
              { name: 'lastUpdatedAt', type: 'timestamp', notes: 'recency — a ranking signal' },
              { name: 'completenessScore', type: 'number', notes: 'how filled-in the profile is — a ranking signal' },
            ],
          },
        ],
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
          {
            heading: 'Kick-off — what the developer starts NOW (a research spike, before any build)',
            items: [
              '1. GATHER SAMPLE CVs — 10–20 real ones: Vietnamese + English, mixed formats (clean PDF, exported-from-Word, scanned). The 2–3 client test CVs are the seed. (PM/BA supplies.)',
              '2. LOCK THE SCHEMA — turn the Candidate Profile above into a concrete JSON contract. Everything (search, matching, storage) builds on it, so it is decided first. Deliverable: schema doc + example JSON.',
              '3. DECIDE THE TAXONOMY — where the canonical Skill / Title / Industry lists come from (adopt an existing set vs. curate our own). This is the linchpin that lets CV and JD data connect.',
              '4. PARSER SPIKE — run 2–3 approaches (LLM prompt vs. a resume-parsing vendor e.g. Affinda / Daxtra) over the sample CVs and MEASURE per-field accuracy, especially Vietnamese. Deliverable: comparison table + a build-vs-buy recommendation.',
              '5. STORAGE DESIGN — RawCV (file) + CandidateProfile (structured, with per-field source & confidence) + how the search index is fed from it.',
              '6. PHASE-1 FALLBACK — define the ≤5 fields to ask when AI is off, and the light review screen, so we can ship before the parser is ready.',
              '7. CONFIDENCE & REVIEW RULE — the confidence threshold below which a field is shown to the candidate to confirm (human-in-the-loop).',
              'Output: the living design doc + a recommendation reviewed with PM/BA BEFORE the build starts. Do not build the parser into production until step 4 has a verdict.',
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
