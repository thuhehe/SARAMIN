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
          ['Create CV — Jobseeker', 'Add a CV: upload a file, or build a Saramin CV; “My CVs” on My page', '—'],
          ['CV compare — Jobseeker', 'After an upload is converted: the PDF beside the structured version, gaps flagged inline', '—'],
          ['Resume list — Admin', 'HQ oversight of the CV pool', 'HQ role'],
          ['Create resume — Admin', 'HQ registers a candidate: upload + CV Convert, or the Builder wizard', 'HQ role'],
          ['Resume list — Companies', 'CV search / talent search', 'Package + candidate visibility consent'],
        ],
      },
      items: ['Up to 3 CVs per jobseeker, exactly ONE of them searchable — decided; see the data model below.'],
    },
    {
      label: 'Route never leaks: four ways in, one shape out',
      text: 'A resume arrives four ways — candidate uploads · candidate builds · HQ uploads on their behalf · HQ types one in. All four end as the same thing: a CV document plus one structured CV-content record. Nothing downstream may branch on which route was used.',
      table: {
        cols: ['Route', 'Document set', 'How the structured layer is produced'],
        rows: [
          ['Upload (candidate or HQ)', 'the original file; a generated Saramin CV only if the OPTIONAL convert offer is accepted', 'CV Convert pipeline — parse, extract, AI-tag, generate'],
          ['Build (candidate or HQ)', 'generated Saramin CV only', 'the typed fields, plus AI tagging over the body'],
        ],
      },
      items: [
        'The “Saramin Standard Resume” (12 sections + preferences + tags, `standardJson`) is the RENDERED CONTRACT — the shape a resume is serialised to and read back in. It is not a third storage location: identity and preferences resolve from the Profile, career content from the CV record (see the data model below).',
      ],
      warn: 'Search, matching and the employer-facing CV all read the structured layer — never the route. If a built CV behaves differently in CV search from an uploaded one, the boundary has leaked.',
    },
    {
      label: 'DATA MODEL (decided): CANDIDATE DATA = 3 groups — Basic information · Work preference · CV content',
      text: 'Everything we hold about a jobseeker is CANDIDATE DATA (VN: Dữ liệu ứng viên), made of THREE field groups stored as TWO records: Basic information + Work preference together are the PROFILE (1 per jobseeker, collected at sign-up and onboarding); CV content is the CV (up to 3 per jobseeker, created or uploaded). Employer search & matching read the Profile PLUS the one searchable CV.',
      table: {
        cols: ['Group', 'Stored in', 'Cardinality', 'Holds', 'Collected'],
        rows: [
          ['1 · Basic information', 'Profile', '1 per jobseeker', 'Full name · email · phone · date of birth · nationality · gender · marital status · highest education · years of work experience. The demographic four were reinstated 2026-08-09 (reversing the 05-08 cut) — none is read by search or matching; see the open question on Application management. CURRENT location is NOT held: matching reads DESIRED location, which sits in Work preference.', 'Sign up (name, email) · social completion step (phone) · Onboarding (education, years, demographics)'],
          ['2 · Desired work condition', 'Profile', '1 per jobseeker', 'Desired job role · desired job category · desired industry · desired work location · expected salary — all five, per the client field sheet', 'Onboarding / Add later (none blocks sign-up)'],
          ['3 · CV content', 'CV', 'up to 3 per jobseeker', 'About · work experience[] · education[] · skills[] · certificates[] · languages[] · projects[] — plus the document (uploaded file or generated Saramin PDF)', 'Created in the CV editor, or uploaded PDF → converted to the CV template with missing fields flagged'],
        ],
      },
      items: [
        'Naming: "Candidate data" is the umbrella (spec + database only). Jobseekers never see that term — they see "My CVs" and their profile card.',
        'Why Basic information and Work preference are ONE table: they are 1:1, written by the same sign-up/onboarding flow and always read together. Splitting them would only add a join.',
        'Every profile field is collected at SIGN UP or during ONBOARDING — there is no separate "fill in your profile later" form; the profile IS those answers, editable afterwards.',
        'Exactly ONE CV is the searchable/main CV at any time; the other CVs are for applying to different kinds of jobs (e.g. tailored Dev vs Sales versions).',
        'Visibility is ONE account-level switch (Discoverable / Hidden, Indeed-style) — no per-CV searchable toggles. "Searchable CV" only decides WHICH CV\'s content feeds search and which document an unlocking employer sees.',
        'CV header (name, title, contact) is read from the Profile — never re-typed per CV.',
        'Upload → convert: an uploaded PDF is parsed into the CV template; missing REQUIRED fields are flagged and gate applying (this is also the anti-spam quality gate). Uploading a file to attach to ONE application does not touch the searchable CV.',
        'If Profile and a CV disagree, employer search reads Profile + the searchable CV — mismatches on the searchable CV are surfaced to the user, never silent.',
      ],
      warn: 'This supersedes any earlier profile-centric wording: career content lives in the CV table (group 3), never on the Profile. Search = Profile (Basic information + Work preference) JOIN the searchable CV (CV content).',
    },
    {
      label: 'CANDIDATE DATA · TABLE 1 of 3 — BASIC INFORMATION, and WHERE each field is collected',
      text: 'From the client’s field sheet. 9 fields, and the collection point matters as much as the field: what is asked at SIGN-UP is a barrier to registering, what is asked at onboarding is not.',
      table: {
        cols: ['Basic information', 'Collected when'],
        rows: [
          ['Full name', 'Sign up'],
          ['Email', 'Sign up'],
          ['Phone', 'Sign up'],
          ['Nationality', 'Sign up'],
          ['Gender', 'Sign up'],
          ['Marital status', 'Sign up'],
          ['Date of birth', 'Sign up'],
          ['Highest education', 'Onboarding / Add later'],
          ['Years of work experience', 'Onboarding / Add later'],
        ],
      },
      items: [
        'Each field renders its own control in the editor — a date box, a phone box with country code, a select, a number with a unit. A screen where every field looks like a dropdown tells the candidate nothing about what it wants.',
        'Profile photo sits above these nine and is OPTIONAL — recruiters see it on the application card, and initials where there is none.',
        'GENDER AND MARITAL STATUS ARE PROTECTED — and this is the CLIENT’S OWN RULE, not ours. Their master-data export marks both tables 🔒 and states it plainly: “stored but never a filter/matching key; enforce at API + search when wired.” Quote that line back whenever someone asks for a gender filter on CV search — it is far easier to hold a constraint the client wrote themselves. Enforce it in TWO places (the API layer and the search index), because a field that never enters the index cannot be filtered on by accident.',
      ],
      warn: 'SEVEN fields at SIGN-UP is a lot for a registration form, and four of them (nationality, gender, marital status, date of birth) are read by nothing — not search, not matching. Every one is a chance to abandon the sign-up. Recommend they are optional at minimum, or moved to “Onboarding / Add later” with the other two.',
    },
    {
      label: 'CANDIDATE DATA · TABLE 2 of 3 — DESIRED WORK CONDITION, and WHERE each field is collected',
      text: 'The other six of the 15. This is the group matching actually reads, and not one of them is asked before the candidate is registered.',
      table: {
        cols: ['Desired work condition', 'Collected when'],
        rows: [
          ['Desired job role', 'Onboarding / Add later'],
          ['Desired job category', 'Onboarding / Add later'],
          ['Desired industry', 'Onboarding / Add later'],
          ['Desired work location', 'Onboarding / Add later'],
          ['Expected salary', 'Onboarding / Add later'],
          ['Desired work type', 'Onboarding / Add later'],
        ],
      },
      items: [
        'DESIRED WORK TYPE is the sixth field and it is NOT a new question — “Remote” and “Overseas” used to sit inside the province picker, where they could not express “I live in HCMC and want remote” and could not join to the job’s `job_type` at all. Same question, asked on the right axis. Values: in office · remote · hybrid · oversea, matching the job side exactly.',
        'Nothing here blocks sign-up — all five are onboarding or later, so a candidate can register and browse before deciding what they want.',
        'CURRENT location is not a field. Matching reads DESIRED work location; where someone lives today is not a search facet.',
        'Expected salary is the one an employer filters on most and the one no CV ever states — which is why onboarding gives it a step of its own rather than burying it in a list.',
      ],
    },
    {
      label: 'HOW THIS DIFFERS FROM VIETNAMWORKS — “Saramin CV” is a FORMAT, not a second kind of thing',
      text: 'Worth stating explicitly, because the two models look similar on screen and are not the same underneath. VietnamWorks holds ONE structured profile plus any number of uploaded PDFs — two different KINDS of object, presented as peers only at the moment of applying. We hold up to 3 CVs of ONE kind; “Saramin template” and “PDF” are just the FORMAT a CV happens to be in.',
      table: {
        cols: ['', 'VietnamWorks', 'Saramin VN (ours)'],
        rows: [
          ['Structured record', 'Exactly ONE profile per person. Cannot be tailored — there is only one.', 'Up to 3 CVs, each carrying its OWN structured content.'],
          ['Uploaded files', 'N PDFs, held as opaque attachments beside the profile.', 'A PDF IS a CV. Same object, same list, same level.'],
          ['What “format” means', 'Profile vs PDF are different KINDS of thing that happen to sit next to each other.', 'Saramin-template vs PDF is only how one CV is rendered.'],
          ['Tailoring for a role', 'Upload a different PDF — it can NEVER be searched: the profile is the only structured record and there is exactly one of it.', 'Create a second CV and CONVERT it — a tailored version CAN be structured, which is what VietnamWorks cannot do. An unconverted PDF is unstructured here too; the difference is that converting is available.'],
          ['What recruiters search', 'The single profile, always.', 'The ONE CV the candidate marks searchable, plus the Profile.'],
          ['Applying', 'Pick the profile OR one of the PDFs.', 'Pick any one of your CVs.'],
        ],
      },
      items: [
        'The practical gain: on VietnamWorks a tailored CV ALWAYS costs searchability — there is one profile, it cannot be tailored, so any tailored version is a PDF and PDFs are not searched. Here that trade-off is OPTIONAL: convert the tailored CV and it is searchable too.',
        'The practical cost, and it is real: only ONE of the 3 CVs feeds search at a time. A candidate with a Developer CV and a Sales CV is discoverable as one of them, never both. VietnamWorks has no such ambiguity because it only ever has one profile.',
        'Naming follows the model: a CV is labelled by its FORMAT (“Uploaded” / “Saramin”), never by a class of object. Wording that implies “your profile vs your files” recreates the VietnamWorks split we deliberately avoided.',
      ],
      warn: 'A raw uploaded PDF has NO structured layer — we never parse a file the candidate did not ask us to convert. A candidate whose searchable CV is an unconverted PDF is therefore findable on Profile facets only (desired title, location, salary, years, education) and INVISIBLE to skill search, the most-used facet of all. OPEN: may an unconverted PDF be marked searchable at all, or does choosing it trigger the conversion offer?\n\nBecause 2 of 3 CVs are invisible to search at any moment, the control that picks the searchable one is load-bearing UI, not a nicety. It reads “Cho nhà tuyển dụng tìm thấy” with the helper “Chỉ 1 CV được tìm thấy. Các CV khác vẫn ứng tuyển được.”, and the chosen CV carries an “Đang hiển thị” badge in the list. The earlier label “Cho phép tìm kiếm” was dropped: it reads as a privacy switch (“allow searching”) when it actually means “THIS is the CV employers see” — the most likely source of a “my skills are on my CV but nobody finds me” support ticket.',
    },
    {
      label: 'Add a new CV — ONE entry, two routes, shared everywhere',
      text: 'Everywhere a candidate adds a CV — the My CVs page AND Apply → “Add a new CV” — opens the SAME flow: a single “Add new CV” action offering (1) Upload a CV or (2) Build a Saramin CV. The two surfaces must never diverge. The two routes answer two different intents, and the wording must respect that: upload means “my PDF is there, that’s it”, build means “make me the searchable one”.',
      table: {
        cols: ['Step', 'What happens'],
        rows: [
          ['Upload a CV', 'The file is saved as a CV in ONE step, byte-identical, immediately usable for applying. No extraction is forced on the candidate here.'],
          ['Convert? — an OFFER, not a step', 'Right after saving: “Also create a Saramin CV from it?” Accepting runs the CV Convert pipeline and moves the candidate onto the build route. Declining costs nothing and leaves a complete, usable CV; the offer stays available from My CVs. Asked ONCE — never a recurring nag.'],
          ['Review = COMPARE (only if converting)', 'Side-by-side: the uploaded PDF on the LEFT as a small reference, the same information restructured as a Saramin CV on the RIGHT as the main subject. Gaps are flagged inline in the structure (the candidate reads missing details straight off their own PDF); AI-SUGGESTED skills appear as one-tap add chips. One Save — the original PDF is untouched and stays in My CVs either way.'],
          ['Build a Saramin CV', 'For candidates with no file: the guided builder produces the document + the structured record directly. It ALSO offers “Upload & pre-fill” — the same pipeline, entered from the other end, landing on the same compare screen.'],
        ],
      },
      items: [
        'Upload ACCEPTANCE gate (anti-spam): a file is accepted as a CV only if parsing yields at least SOME core career content (work experience OR education). A file with none — a blank page, an image-only scan, an unrelated document — is refused with a helpful path: build manually or upload a clearer file. Missing but less-critical fields (skills, summary) never refuse the upload; they are asked for in Review.',
        'Saving an uploaded PDF as the CV document also SAVES the filled-in missing fields to the CV record — the structured layer is captured either way; “keep my PDF” never means “skip the data”.',
        'Two tiers of missing fields in Review: REQUIRED (the CV is not usable / searchable without them — e.g. desired title, visibility consent) shown in red; RECOMMENDED (optional, boosts ranking — more skills, languages, desired salary, availability) shown with an impact hint, never blocking.',
        'One profile, many documents: the Standard Resume (the searchable / matchable layer) is SINGULAR and authoritative; a candidate may hold several CV DOCUMENTS (their original PDF + a Saramin version) and pick which to attach per application. This is the answer to “why not save two files?” — yes to two documents, no to two profiles.',
      ],
    },
    {
      label: 'CV completeness — the weights, and what they are based on',
      text: 'The completeness meter must total exactly 100%. Weights are derived from ONE rule: a section is worth what it contributes to being FOUND and SHORTLISTED — i.e. how much employer CV search and the CV↔JD match actually read it. That makes every number traceable to a search facet in our own product rather than to taste.',
      table: {
        cols: ['Section', 'Weight', 'Basis — what it feeds'],
        rows: [
          ['Work experience', '30%', 'Employer filters: years of experience, job title, seniority. Also the largest input to the CV↔JD match. The single biggest signal in any CV.'],
          ['Skills', '20%', 'The #1 CV-search facet — skill is the field recruiters query most, and the one the matching taxonomy joins on.'],
          ['Education', '15%', 'A standard employer filter (highest education level), but secondary once a candidate has real experience.'],
          ['About / summary', '10%', 'Not a filter, but the first thing a recruiter reads after unlocking. Cheap to write, high effect on response.'],
          ['— core subtotal —', '75%', 'A candidate who fills only the essentials already sees a healthy number, so the meter encourages rather than shames.'],
          ['Foreign Language', '7%', 'A real employer filter in VN (English level), so it leads the optional set.'],
          ['Highlight projects · Certificates', '6% · 4%', 'Evidence of skill — read at shortlist time, not filtered on. Highlight projects also absorbs published papers and articles.'],
          ['Awards · Activities', '4% · 3%', 'Differentiators, rarely filtered.'],
          ['References', '1%', 'A trust signal, checked late in the process.'],
          ['— optional subtotal —', '25%', '75 + 25 = 100%.'],
        ],
      },
      items: [
        'HOW TO DEFEND THESE NUMBERS TO THE CLIENT — the honest framing: they are a reasoned STARTING HEURISTIC, not a research finding. Three legs support them:',
        '1 · Internal logic (verifiable today): every weight maps to a field our own employer CV search filters on. Rank the fields by how often they appear in a search query and the order falls out — skills, title/years, location, education. Nothing here is a matter of taste.',
        '2 · Reference benchmark (cheap to verify): LinkedIn "Profile Strength", Indeed and VietnamWorks all run completeness meters and all weight experience + skills highest. The BA can screenshot each — we already have VietnamWorks credits — and put the comparison beside our table. That is observable evidence, not opinion.',
        '3 · Calibration with our own data (the real evidence, Phase 2): once the pool has traffic, re-derive each weight from the correlation between “section filled” and an actual outcome — recruiter unlock, CV view, or interview. Weight = measured contribution. Until that data exists, no honest source can give exact numbers for OUR market.',
      ],
      warn: 'Do NOT present these as researched figures. Present them as: a defensible default derived from our own search facets, benchmarked against LinkedIn / Indeed / VietnamWorks, and scheduled for recalibration against real outcome data in Phase 2. The client is buying the METHOD, not the specific integers — and the method is what makes the numbers replaceable without redesigning anything.',
    },
    {
      label: 'Onboarding — CV-first, progressive, extract-don’t-ask',
      text: 'Profile creation at sign-up is short and CV-first, NOT a VietnamWorks-style long form. AI extraction gives us rich search/matching data without heavy typing: collect a small core by hand, get the rest from the CV, nudge the optional extras over time.',
      table: {
        cols: ['Tier', 'Fields', 'How we get them'],
        rows: [
          ['Required (to start)', 'Full name · desired title · location (city) · contact · visibility consent', 'Asked — a tiny set'],
          ['From AI (never ask)', 'Years of exp · occupation · industry · highest degree · skills · work history · education · languages', 'Extracted from the uploaded CV; DERIVE years & degree rather than asking'],
          ['Recommended (nudge later)', 'Desired salary · availability · more skills · languages', 'Progressive prompts with an impact hint (“+X% recruiter views”). NOT years-per-skill — that is Phase-2 (see the SKILLS block)'],
          ['Optional / minimise', 'DOB · gender · nationality · marital status · street address · current salary · current title/level/industry · district · benefits wish-list', 'DROP: marital status, gender, nationality (VN default), current salary (desired salary is the signal), district, benefits picker. DERIVE current title/level/industry from the CV — never ask. DOB at most optional birth-year. Address = city only. Profile = the onboarding fields exactly — one form, one mental model, nothing asked twice.'],
        ],
      },
      items: [
        'Sign-up onboarding is a short GUIDED wizard (Saramin-KR style): job wanted → region → experience → education → get-seen, each step with a live job-count carrot. The LAST step shows matched jobs, then leads the candidate into creating their CV (upload or build — that fork lives on My CVs, not in onboarding).',
        'Progressive & skippable: collect the minimum to start, let the candidate browse/apply immediately, then raise completeness over time. Nothing in onboarding blocks applying.',
        'Motivate with carrots, not required-asterisks: show the payoff at each step (“12,400 jobs match your info so far”, “+40% recruiter views”) — the Saramin-KR pattern. This is also why a partly-filled profile reads as a guided to-do list, not a broken page.',
      ],
      warn: 'Do NOT rebuild VietnamWorks’ long basic-info form at SIGN-UP. Rich data comes from AI extraction + progressive nudges, never a wall of required fields at registration.\n\n✅ RESOLVED (was a conflict with Application management → Apply flow). Apply is no longer a FORM: it renders the same ProfileSummaryCard as My CVs — Basic information + Work preference, read-only, with a per-group Edit that opens the shared quick-edit popup. So the demographic fields are CONFIRMED, never typed, and an edit made while applying writes back to the profile rather than to that one application. Separately REVERSED (2026-08-09): the 2026-08-05 cut no longer holds — the demographic four are collected again on client direction, so they DO appear in Basic information here and on the apply read-back. See the open question on Application management for the trade-off and the legal review recommended for marital status.',
    },
    {
      label: 'THE PRINCIPLE: extract, don’t ask — and why a PDF alone is worthless',
      text: 'A PDF is opaque to software: you cannot search, filter, rank or match on it. So every CV is parsed into structured candidate data — and that data is EXTRACTED by AI, not typed by the candidate. Both halves matter: without the structure the employer side does not exist, and without extraction the candidate abandons the form.',
      table: {
        cols: ['Capability', 'Needs structured data because…'],
        rows: [
          ['CV search (the paid feature)', 'Recruiters search by facets — title, skills, years, location. A PDF has no facets.'],
          ['CV ↔ JD match score', 'A % fit is computed by comparing candidate fields to the job’s fields — impossible on raw text.'],
          ['Filter & rank a large pool', 'Narrow thousands of CVs and order them by relevance / recency / completeness.'],
          ['Recommendations & alerts', 'Suggest jobs to candidates, surface new matching CVs to recruiters.'],
          ['Quick-apply autofill', 'Pre-fill the application so applying is one tap.'],
          ['Pool quality & dedup', 'Completeness scoring, spotting duplicate / thin CVs.'],
          ['Market analytics', 'What skills the pool holds vs. what employers demand.'],
        ],
      },
      items: [
        'The objection is to TYPING, not to complete data. A form may be long if it arrives PRE-FILLED — the candidate confirms rather than types. Read the rule as: never ask for anything a CV already contains.',
        'A pre-filled field costs a glance; the same field blank costs a candidate.',
        'Corollary — DERIVE rather than ask: years of experience from work history, seniority from titles + years, highest degree from education. Asking for a number the CV already implies is the same mistake as asking for the CV again.',
      ],
      warn: 'This principle DEPENDS on extraction being live. With the parser off, every pre-filled form degrades into a blank one at the worst possible moment — and the fields we justified by “it’s only a confirmation” become real work. Phase-1 must either ship the parser or ship a reduced field set; see Apply flow → open questions.',
    },
    {
      label: 'SKILLS on the CV — the complete logic',
      text: 'ONE MASTER LIST, TWO LINKS TO IT — **Skill (master)** is the only place a skill is defined; **CvSkill** = a skill on a CV (cvId + skillId, cap 20 per CV); **JobSkill** = a skill on a job (jobId + skillId, cap 10 per job). Both store nothing but a pointer, so “React on this CV” and “React on that job” are literally the SAME master row seen from two sides — and that identity is the entire reason matching works. Everything below is how a skill gets into those lists and what happens to it there.',
      table: {
        cols: ['Stage', 'What the candidate sees', 'The rule'],
        rows: [
          ['1 · Add', 'One combobox: the chips already added and the input live in the same box. Backspace on an empty input removes the last chip.', 'A candidate NEVER types a raw skill. Every entry resolves to a canonical taxonomy row or is not saved.'],
          ['2 · Match', 'A dropdown of canonical names, each with its group on the right.', 'A SEARCH INDEX over nameVi + nameEn + any aliases, analysed with lower-casing, ASCII FOLDING and punctuation stripping — so “ke toan” finds Kế toán and “nodejs” finds Node.js with NO curated alias at all. Rank exact → prefix → contains. Typeahead may also run FUZZY (edit distance ≤ 1–2), because a human is looking at the dropdown and clicks the row they meant.'],
          ['3 · No match', '“Skills come from a fixed list — request «x»”.', 'The request routes to `unmatched_term` for the taxonomy owner — that loop is what stops the list rotting, AND it is how we learn which aliases are worth writing. Never invent a row from the candidate’s text.'],
          ['4 · Suggest', 'Chips grouped by WHERE they came from — “From your time as Product Designer · Lantern Digital: ＋Figma ＋Wireframing”, then “For your Senior Product Designer · desired role: ＋Prototyping”. One tap each.', 'TWO SOURCES, IN THIS ORDER — ① the CV’s own WORK EXPERIENCE: each job title resolves to an occupation via `job_role_alias`, most recent role first; ② the profile’s DESIRED JOB ROLE, filling whatever is left of the cap. Both read the same `occupation_skill` map (occupation ↔ skill, each row flagged ESSENTIAL or OPTIONAL). Within each source: ESSENTIAL first, then OPTIONAL, then taxonomy order. Dedupe across sources keeping the FIRST occurrence, exclude what is already on the CV, cap 6 total.'],
          ['5 · Extract (upload route)', 'AI-proposed skills appear as confirm / reject chips, each with a confidence.', 'A suggestion is not a decision — only CHECKED chips are applied. Extraction proposes; the candidate always decides.'],
          ['6 · Save', 'Chips become the CV’s skill list.', 'Stored as CvSkill rows: skillId only. Cap 20 per CV, enforced on save. No years, no featured flag, no ordering weight.'],
          ['7 · Employer view', 'Skills shown on a search result or locked preview.', 'CONTEXTUAL, not curated: show the skills that OVERLAP the job being matched, most relevant first. Better than a candidate-picked top-5, and needs no extra UI or data.'],
        ],
      },
      items: [
        '1 · ONE master list, TWO users of it — the Skill master (taxonomy) is the only place a skill is defined. CV SKILLS (CvSkill: cvId · skillId, cap 20 per CV) and JOB SKILLS (JobSkill: jobId · skillId, cap 10 per job) are both just links to a master row. Same row, two sides of the match.',
        '2 · Master data only, never free text — a candidate and an employer both SELECT from the master list; neither can type a new skill. This is the whole point: a `text[]` cannot join to a taxonomy reference, and the failure is SILENT — matching returns nothing and looks like a ranking bug.',
        '3 · Suggestions come from WORK EXPERIENCE FIRST, desired role second — what someone HAS DONE is stronger evidence than what they WANT to do next, and it is also more persuasive: "From your time as Product Designer at Lantern Digital" is a reason to tap, "common for people like you" is not. See stage 4 in the table above for the full ordering rule, and the block below for the fallbacks.',
        'SKILLS BELONG TO A CV, NOT TO THE ACCOUNT — this is what the `cvId · skillId` key in rule 1 actually means, and it is easy to read past. Skills are group 3 (CV content), the record there are up to THREE of; they are NOT on the Profile, which holds only Basic information and Work preference. A jobseeker with 3 CVs has THREE independent skill lists, and that is deliberate: the Dev CV says React, the Sales CV says Account Management, because they are aimed at different jobs.',
        'WHAT THAT COSTS THE CANDIDATE — and the UI must say it out loud. Exactly ONE CV is searchable, so employer search reads ONLY that CV’s skills. Skills on the other two are invisible to search until the candidate switches which CV is searchable, and deleting a CV deletes its skills with it. Expect “why can’t employers find my Java?” unless My CVs makes it obvious which list is the live one.',
        'THE ALTERNATIVE WAS REJECTED — skills on the PROFILE (one list per account, shared by every CV) would make everything findable at once, but it destroys the reason for having 3 CVs: a candidate aiming at Dev and Sales would broadcast one merged list and match badly for both. Per-CV skills are the deliberate trade — sharper matching, at the cost of only one list being live at a time.',
        'WHERE EACH PIECE LIVES — all three already exist in svn-be, so nothing here is a new table: `skill` (id · code · name_vi · name_en · active, arranged group → skill → version) is the master; `skill_alias` (alias + `lower(alias)` index) holds the lookup keys; `occupation_skill` (occupation ↔ skill, ESSENTIAL / OPTIONAL) drives suggestions. Our /docs/skill-taxonomy-seed.csv is no longer a proposal for a NEW table — read it as a worked example of the alias and role columns we need filled on THEIR 731 rows.',
        'Skills RANK candidates, they never exclude them — a flat list where every entry filtered would narrow the pool to nothing after four or five picks. Phase-1 ranks on skill OVERLAP COUNT plus the profile fields (total years, level, location).',
        'A CERTIFICATE IS NOT A SKILL — skills may be evidenced by work experience, projects, education or certificates, but certificates stay their own section and may attest a skill; they never become taxonomy rows themselves.',
        'ESSENTIAL vs OPTIONAL is the ordering, and it is better than the flat role list we drafted — “Figma is essential for a Product Designer, Zeplin is optional” gives suggestion order for free and needs no demand data. Cross-role skills (Excel, Word, Teamwork) are mapped to many occupations and land last by taxonomy order. A skill mapped to NO occupation is never suggested — only found by search.',
        'Suggestions are a CURATED map, not a model call — deterministic, explainable to a candidate, and maintained by the same person who owns the master list. Phase-2 upgrade with no UI change: replace it with CO-OCCURRENCE from our own pool ("candidates who held this role also list…"), computed from CvSkill rows once there is volume. The component reads a list of skillIds either way.',
        'WHY EXPERIENCE OUTRANKS DESIRED ROLE — a job title someone actually held is evidence; a desired role is an intention, and intentions run ahead of skills. Suggesting from the desired role alone puts aspirational skills in front of a candidate who has never used them, and a one-tap chip makes claiming one effortless. Reading their history first suggests things they can honestly stand behind.',
        'JOB TITLE → OCCUPATION is a lookup, never a guess. Titles resolve through `job_role_alias` (the same normalise-then-exact-match pipeline as skills), so “Sr. Product Designer”, “Senior Product Designer” and “Product Designer (Senior)” all land on one occupation. A title that resolves to nothing contributes NO suggestions — it must never fall back to fuzzy matching, for the same reason skills must not.',
        'RECENCY ORDERS THE EXPERIENCE SOURCE — most recent role first, and roles that ended more than ~5 years ago are skipped entirely. A skill from a job someone left in 2016 is not what they want on today’s CV, and offering it reads as if we had not looked at the dates.',
        'THE FALLBACK CHAIN, and each step is a real population: ① work experience, for anyone with history · ② desired job role, for FRESHERS with no experience at all — and for any UPLOADED CV, because upload-only creates no structured experience rows, so the desired role is genuinely all we have · ③ desired job CATEGORY, when the role is set but resolves to no occupation · ④ nothing. An empty suggestion row is a fine outcome; a row of irrelevant chips is not.',
        'EVERY CHIP CARRIES ITS SOURCE, grouped under a label naming the job it came from. This is not decoration: it is what makes the suggestion checkable by the person best placed to judge it, and it is the same principle as showing the match score with its reasons.',
        'BOTH SOURCES STILL DEDUPE AGAINST THE CV. A skill already on the CV is never suggested from either source, and a skill suggested by both appears once, under the EXPERIENCE label — the stronger reason wins the attribution.',
        'DEFERRED — a per-CV `targetRole` so each of the 3 CVs could be tailored. Not in Phase-1: no evidence candidates target several roles here, it adds a field to every CV forever, and it is free to add later (optional column, no backfill, identical UI). Revisit IF candidates routinely keep 2–3 CVs aimed at visibly different roles, or the client asks for role-tailored CVs. Until then the CV NAME carries that intent informally.',
        'SEARCH ENGINE FIRST — aliases are the curated TAIL, not the foundation. Phase-1 ships with ZERO hand-written aliases, because an analysed index already solves most of what we were going to curate: ASCII folding gives “ke toan” → Kế toán free, punctuation stripping gives Node.Js / node js / nodejs, prefix matching gives reactjs → React, and fuzzy covers ordinary typos. The client does NOT have to prepare an alias list before launch — this removes the delivery risk that made the question worth asking.',
        'THREE TIERS, only one needs a person — (1) FREE: folding, lower-casing, punctuation stripping, prefix matching, done by the index config. (2) MECHANICAL: their 731 rows ALREADY hold the variants as separate rows (React · React JS · ReactJS · React/Typescript), so merging duplicates GENERATES aliases — nobody invents them; this is the “36 duplicates merged” job, half-done. (3) HUMAN, and only where it pays: abbreviations and cross-language pairs the index can never derive — CSKH ↔ Chăm sóc khách hàng, PTS ↔ Photoshop, Kế toán ↔ Accounting. Perhaps 50–100 entries, chosen from what `unmatched_term` actually reports rather than guessed up front.',
        'WHAT AN INDEX CANNOT DO — connect DIFFERENT WORDS for the same thing. “CSKH” and “Chăm sóc khách hàng” are edit distance 20-odd; no analyser, folding rule or fuzziness setting links them. Elasticsearch’s own answer is a SYNONYM FILE, which is an alias table stored somewhere worse: a config file, redeployed to change, with no admin UI, no audit and no per-row ownership. Keep the aliases in `skill_alias` where the client can curate them.',
        'FUZZY IS SAFE ONLY WITH A HUMAN PRESENT — the hard line, and the reason “just use a search engine” cannot be the whole answer. In TYPEAHEAD, fuzziness is fine: the candidate sees the dropdown and clicks the row they meant. At PDF IMPORT there is no human at the moment of resolution, so fuzziness must be OFF and a near-miss must fall through to `unmatched_term` rather than resolve to a guess. This is a per-caller config difference, not extra work.',
        'THE PROOF IS IN THEIR OWN DATA — these are all SEPARATE, genuinely different rows in the client’s 731, and fuzzy matching would happily conflate every pair: `Angular` / `AngularJS` (edit distance 2, different frameworks), `React` / `React Native` (web vs mobile), `.NET` / `.NET Core`, `MVC` / `MVC 4` / `MVC 5`, `SASS` / `SCSS`. A wrong fuzzy hit is invisible — the employer just gets the wrong people in their shortlist and reads it as bad ranking.',
        'IT FINDS THE ROW, IT DOES NOT REPLACE IT — whatever resolves the text, the output must still be a `skillId`, because matching runs on `cv_skill.skill_id = job_skill.skill_id` and not on text similarity. So “search engine INSTEAD OF a taxonomy” is not a real option — “search engine instead of hand-written ALIASES” is, and it is mostly right.',
        'ALIAS RULES — write ONLY what the index cannot derive. An alias is a way people WRITE a skill, never a different thing. WORTH CURATING: the EN↔VN pair (Kế toán ↔ Accounting), abbreviations (CSKH ↔ Chăm sóc khách hàng, PTS ↔ Photoshop), and vendor prefixes — “msexcel” resolves to NOTHING under folding alone, so MS Excel → Microsoft Excel still earns its row. NO LONGER WORTH CURATING: diacritic-free spellings (“ke toan”), punctuation and spacing variants (Node.Js · node js · nodejs), and casing — the analyser handles all of these, and writing them as aliases is duplicated work that then has to be maintained. Misspellings only when `unmatched_term` shows the SAME one repeatedly; typeahead fuzziness already catches the rest.',
        'NEVER AN ALIAS — and fuzzy typeahead raises the stakes. Job titles (Project Manager is not an alias of Project Management) and ambiguous abbreviations that belong to something else: “JS” is JavaScript only and must never sit under Java; “AI” is never an alias of Adobe Illustrator; “PM” is never an alias of Project Management. Fuzziness widens what an index will reach for, so the rejects are the part of this list doing real work.',
        'Every alias must be UNIQUE across the whole taxonomy — two rows sharing a lookup key makes resolution non-deterministic. Validate this in CI, not by review; the seed file ships 127 aliases resolving to 169 distinct normalised lookup keys across 47 rows, with zero cross-row collisions.',
        'ALIASES ARE CHEAP, ROWS ARE PERMANENT — and this asymmetry is why the search-engine-first plan works. An alias only ever means "people write it this way too": cheap to add, cheap to undo, safe to defer until the queue proves it is needed. A canonical ROW is a decision — it becomes a facet employers filter on forever, and merging two rows later means rewriting every CvSkill and JobSkill that pointed at the loser. That is the whole reason the ROW cleanup blocks launch while an empty `skill_alias` does not. Retire rows with isActive = FALSE rather than deleting them, so historic CVs and jobs still resolve (see the Adobe Flash row in the seed).',
        'The job form shows a live pool line ("≈ 224 candidates have all of these") so an employer can see how rare their combination is before publishing. Informational, not a gate.',
      ],
    },
    {
      label: 'SKILL MASTER DATA — the seven columns, and exactly what goes in each',
      text: 'FOR WHOEVER FILLS THE SHEET. Worked example at /docs/skill-taxonomy-seed.csv — 47 rows across 7 groups, meant to be read as a filled-in template rather than a final list. One row, read out in full: `1001, IT — Software, React, React, ReactJS|React.js|react js|Reactjs, Frontend Engineer:E|Fullstack Engineer:O, TRUE` — that is ONE skill, four ways people write it, two roles it belongs to (essential for one, optional for the other), currently in use.',
      table: {
        cols: ['Column', 'Example value', 'What goes in it — and what must not'],
        rows: [
          ['id', '1001', 'Stable number, never reused. Group it by thousands (1xxx = IT, 2xxx = Design) so a human can read an id. NEVER renumber: CvSkill and JobSkill rows point at this forever.'],
          ['group', 'IT — Software', 'One of the 7 groups, spelled identically on every row. This is what the candidate sees on the right of each dropdown option, so a typo here shows up in the UI.'],
          ['name_vi', 'Kế toán thuế', 'The Vietnamese name WITH diacritics, exactly as it should display. For skills with no Vietnamese form (React, Figma, SAP) repeat the English — do not leave it blank, and do not invent a translation.'],
          ['name_en', 'Tax Accounting', 'The English name. For Vietnamese-only concepts, give the closest English gloss — it is a lookup key too, so an English-typing candidate can still find the row.'],
          ['aliases', 'ke toan thue|Thuế|Kế toán thuế GTGT', 'Pipe-separated. Every way people WRITE this skill: diacritic-free spellings, abbreviations, vendor prefixes, common misspellings. May be EMPTY (Figma, Docker) — an empty aliases cell is a fine answer, a wrong alias is not. See the alias table below.'],
          ['roles', 'Tax Accountant:E|General Accountant:O', 'Pipe-separated `Role:E` (essential) or `Role:O` (optional). Drives suggestion ORDER in the editor, nothing else. `*` = universal (Excel, Word, Teamwork) and always sorts last. EMPTY is allowed and means "never suggested, only found by search".'],
          ['is_active', 'TRUE', 'FALSE retires a row without deleting it — historic CVs and jobs still resolve. See the Adobe Flash row. A retired row stops being offered in the dropdown and stops being suggested.'],
        ],
      },
      items: [
        'THE ONE RULE THAT MATTERS: a canonical row is a SKILL, and everything else is a way of writing that skill. Getting this boundary wrong is the only mistake that cannot be fixed cheaply later — see the alias table below for the five shapes it takes.',
        'This maps onto tables that already exist in svn-be, so the sheet is not a new schema: `id/group/name_vi/name_en/is_active` → `skill`, `aliases` → one `skill_alias` row per pipe-separated value, `roles` → one `occupation_skill` row per value with the E/O flag as its ESSENTIAL / OPTIONAL column. The client is filling in the alias and role columns of THEIR 731 existing rows, not authoring a new list.',
        'HOW MANY ROWS: 500–1,500 is the working range. Fewer than ~300 and employers cannot express what they want; more than ~2,000 and two rows start meaning the same thing, which splits the candidate pool in half and looks like a matching bug.',
        'The E / O calls in the seed are ILLUSTRATIVE — "Figma is essential for a Product Designer, Zeplin is optional" is the shape of the judgement, and the taxonomy owner confirms each one. Getting E and O backwards only reorders suggestion chips; it breaks nothing.',
        'WHO OWNS IT: one named person. The "request «x»" path from the editor lands on their desk, and that loop is the only thing that stops the list rotting — a taxonomy with no owner is a taxonomy that is 18 months stale.',
      ],
      warn: 'Two rows must NEVER share a lookup key — not a name, not an alias, not across languages. If “BA” sits under both Business Analysis and Bachelor of Arts, resolution becomes non-deterministic: the same CV imports differently on different days, and nothing in the UI reveals why. Validate uniqueness in CI on every upload of the sheet, not by eye; the seed ships with zero collisions.',
    },
    {
      label: 'ALIASES — worked examples, and the five kinds to reject',
      text: 'An alias is a way people WRITE a skill, never a different thing. This is the table to hand to whoever fills the aliases column, because the rejects are less obvious than the includes.',
      table: {
        cols: ['Canonical row', 'Aliases to INCLUDE', 'Why these', 'NEVER an alias of this row'],
        rows: [
          ['JavaScript', 'JS · Javascript · ECMAScript · java script', 'Abbreviation, wrong casing, the formal name, and the space people type by accident.', '“Java” — a different language. This pair is the classic silent mismatch: a Java backend role must never surface JavaScript candidates.'],
          ['Kế toán thuế', 'ke toan thue · Thuế · Kế toán thuế GTGT', 'The diacritic-free spelling (people type fast without accents), the everyday short form, and the specific-tax variant.', '“Kế toán” alone — that is a BROADER skill with its own row. An alias must never be a parent or a child of its row.'],
          ['Microsoft Excel', 'Excel · MS Excel · Excel nâng cao · excel nang cao', 'Vendor prefix dropped, vendor prefix abbreviated, and the “advanced Excel” phrasing VN CVs use, with and without diacritics.', '“Google Sheets” — a different product. Competitors are never aliases of each other, however interchangeable in practice.'],
          ['Thiết kế UI/UX', 'UIUX · UX/UI · UI UX · thiet ke ui ux · Thiết kế giao diện', 'Every punctuation and ordering variant of the same phrase, plus the VN long form.', '“Product Designer” — that is a JOB TITLE. Titles describe a person, skills describe a capability, and the taxonomy holds only the second.'],
          ['Adobe Illustrator', 'Illustrator · Adobe Ai', 'The product name alone, and the file-extension shorthand designers use.', '“AI” — it reads as artificial intelligence far more often. An abbreviation that is ambiguous in the wild belongs to NOBODY.'],
        ],
      },
      items: [
        'THE FIVE REJECTS, in one line each — ① job titles (Project Manager is not Project Management) · ② broader or narrower skills (Kế toán is not Kế toán thuế) · ③ competing products (Sheets is not Excel) · ④ ambiguous abbreviations (AI, PM, BA, BD) · ⑤ anything that is already another row’s name or alias.',
        'THE FOUR INCLUDES, in one line each — ① diacritic-free VN spellings · ② the EN ↔ VN pair · ③ common misspellings and spacing variants · ④ vendor prefixes added or dropped (MS Excel ↔ Excel ↔ Microsoft Excel).',
        'THE COST IS ASYMMETRIC, and this is why the rejects matter more than the includes. Adding an alias is cheap and reversible — it only ever means "people write it this way too". Adding a canonical ROW is a permanent decision: it becomes a facet employers filter on, and merging two rows later means rewriting every CvSkill and JobSkill row that pointed at the loser.',
        'A WRONG alias is worse than a MISSING one. A missing alias means a candidate types “ke toan” and sees “request this skill” — visible, annoying, fixed in a day. A wrong alias silently files them under the wrong skill, and neither the candidate nor the employer ever sees the mistake.',
        'Aliases are for WRITING variants, not for search convenience. The temptation is to add “frontend” as an alias of React so a search for frontend finds React people — do not. That is what the group column and role suggestions are for.',
      ],
    },
    {
      label: 'MATCH SCORE — the recommended model: one hard gate, then a weighted 0–100',
      text: 'RECOMMENDATION, for sign-off. Two stages, and keeping them separate is the whole design. Stage 1 GATES on eligibility only — searchable CV, not hidden, moderation approved, account active. Nothing about the work itself may exclude anybody, because every domain filter can empty the result set and none of them can explain why. Stage 2 SCORES the survivors on nine signals summing to 100. The score orders results; it never removes them.',
      table: {
        cols: ['Signal', 'Weight', 'Full credit', 'Partial credit', 'Zero'],
        rows: [
          ['Skills', '38', 'Every skill on the job is on the CV.', 'Weighted overlap ratio: a job skill that is ESSENTIAL for the job’s occupation counts ×2, the rest ×1. 7 of 10 by weight → 0.7 × 38.', 'No overlap at all.'],
          ['Years of experience + career level', '18', 'Candidate years fall inside the job’s stated range and the level agrees.', 'Under the minimum → 16 × (years ÷ min). Over the maximum → 16 − 1.5 per year over, floor 10; over-qualified is still a real candidate.', 'Zero years against a role with a stated minimum.'],
          ['Location + work type', '17', 'The job is remote and the candidate accepts remote (city is then irrelevant) — OR a desired location contains the job’s location and the candidate accepts the job’s work type.', '12 for an adjacent province in the same region · 10 for a city miss where the candidate will relocate · 6 for a city hit where the work type is wrong (remote-only candidate, in-office job).', 'No location overlap, no relocation, and no work-type overlap.'],
          ['Desired job category', '10', 'The job’s category is one the candidate asked for.', '4 for a sibling category in the same group.', 'Unrelated category.'],
          ['Expected salary', '7', 'The ranges overlap — or the candidate’s salary is INTERVIEW / unset.', '3 when the candidate’s minimum is within 20% above the job’s maximum.', 'Candidate’s minimum exceeds the job maximum by more than 20%.'],
          ['Industry', '5', 'The company’s industry is one the candidate asked for.', '2 for the same industry group.', 'Unrelated industry.'],
          ['Education level', '3', 'At or above the job’s stated minimum.', '1.5 for exactly one level below.', 'More than one level below.'],
          ['Language certification', '2', 'Holds the required certification at or above the stated score.', '1 for holding the language with no certification.', 'Does not hold it.'],
        ],
      },
      items: [
        'WORK TYPE IS COLLECTED, CONTRACT TYPE IS NOT — deliberately asymmetric. Work type is asked once at onboarding step 2 (“Where and how would you like to work?”) and edited afterwards in My CVs → Desired work condition. Contract type is asked nowhere on the jobseeker side.',
        'WHY CONTRACT TYPE WAS DROPPED, after being drafted in and taken back out: it is a question every candidate answers so that a minority benefits. Roughly nine in ten candidates and nine in ten postings are fulltime, so the signal returns the same value for almost every pair. Even asked optionally it costs a control, a line of help text and a tile on the profile card — and the onboarding step is the most expensive screen in the product to add anything to.',
        'WHERE THE INTENT LIVES INSTEAD — a SEARCH FILTER on the job list. Someone hunting an internship filters for it in that session, which is where the intent actually is: situational, not a standing preference. The job side keeps `contract_type` in full, so the filter has real data to work on.',
        'WORK TYPE STAYED BECAUSE IT COST NOTHING NEW — it was already being collected, mislabelled as a location. “Remote” and “Overseas” sat inside the province picker, where they could not express “I live in HCMC and want remote” and could not join to the job’s `job_type` at all. Splitting them out is the same question asked on the right axis, not an extra question.',
        'THE RULE THIS ILLUSTRATES, worth applying to any future signal: a scoring signal may only read a field the candidate ACTUALLY FILLS on the self-serve path, and it must score NEUTRAL when they leave it blank. A signal that reads an Admin-only field, or that punishes silence, compresses every score toward the middle and makes the ranking look broken.',
        'THE RENORMALISE RULE, and it is the load-bearing one: any signal the JOB does not specify is DROPPED and its weight redistributed proportionally across the rest, so the total is always exactly 100. A job that states no language requirement does not score language — it does not score it as zero either. Without this, every under-specified job posting quietly compresses its own scores into the 60s and the number stops meaning anything.',
        'MISSING CANDIDATE DATA — and the distinction matters, because getting it wrong turns the score into a measure of form-filling. CONSTRAINT signals (salary, employment type, education, mobility) score NEUTRAL when the candidate is silent: silence means "no constraint", and punishing it would rank the fussy above the flexible. EVIDENCE signals (skills, years) score LOW when absent: silence means "no evidence", and ranking below someone who provided it is correct, not unfair.',
        'A CONSEQUENCE WORTH STATING OUT LOUD: a candidate whose searchable CV is an unconverted PDF has no CvSkill rows, so they forfeit the 35-point skills block and cap out at 65. That is honest — we genuinely do not know their skills — and it is the strongest incentive to convert that we can offer without nagging. Say it plainly in the conversion offer rather than hiding it.',
        'The score is DETERMINISTIC: same inputs, same output, no randomness and no time decay inside it. Recency belongs in the TIE-BREAK, applied only to equal scores, in this order — profile completeness, then last-active, then CV updated-at. This keeps fresh candidates surfacing without letting freshness masquerade as fit.',
        'WEIGHTS ARE CONFIGURATION, NOT CODE, and every displayed score is stored with the `scoreVersion` that produced it. The first question after launch is always "why did my match drop from 92 to 84" and it is unanswerable without this.',
        'THE SCORE HAS EXACTLY TWO CONSUMERS, and both are the SAME computation read from opposite ends — CV × job. ① EMPLOYER · application list: applicants ranked by match against THIS job, so the column order stops being “who applied last”. ② JOBSEEKER · recommended jobs: open jobs ranked by match against the candidate’s searchable CV. Anything else that wants a “relevance” number reuses this one; a second scoring path is how two screens start disagreeing about who fits what.',
        'WHICH MEANS THE NUMBER OF SKILL TAGS IS A MATCHING-QUALITY QUESTION AND NOTHING ELSE. It is not a packaging lever and not a price tier — the caps exist to make the ranking sharp, and any commercial rule that moves them moves the quality of both screens above. Reach is what a job posting can legitimately be priced on: placement, duration, refresh, visibility. See Job management → Skills for the arithmetic.',
        'THE POOL LINE IS NOT THE SCORE. "≈ 224 candidates have all of these" on the job form is a hard set intersection on skills — a different computation, a different question, and it must never be derived from or confused with the ranking score.',
        'PHASE 2, no UI change and no schema change: replace the binary skill overlap with embedding nearness so React ↔ Next.js scores partial rather than zero, and feed the ESSENTIAL/OPTIONAL weighting from our own CvSkill co-occurrence once there is volume. The component still consumes one number and a reason list.',
      ],
      warn: 'PROTECTED FIELDS MUST NEVER ENTER THE SCORE — gender and marital status are marked 🔒 in the client’s own master data ("stored but never a filter/matching key"), and nationality and date of birth are read by nothing either. Enforce it at BOTH the API layer and the search index, and close the obvious back door explicitly: AGE MUST NOT BE DERIVED FROM DATE OF BIRTH and fed in as an “experience proxy”. A weighted score is exactly where this kind of thing enters unnoticed, because no single field name appears in the query.',
    },
    {
      label: 'MATCH SCORE — what each side actually sees',
      text: 'The number is only useful if it comes with its reasons. A bare percentage invites exactly one question and answers none of it, so no surface shows the score alone.',
      table: {
        cols: ['Surface', 'What it shows', 'Why'],
        rows: [
          ['Jobseeker · matched job card', '“92% match” plus the top two contributing signals — “8/10 skills · Hồ Chí Minh”.', 'The candidate can only act on reasons. A score they cannot decompose reads as a verdict on them.'],
          ['Jobseeker · below the floor', 'No number. The card sits under a “Related” heading instead.', '“34% match” is both useless and insulting, and it invites a support ticket we cannot answer well. Recommended floor: 60.'],
          ['Employer · search result row', 'Rank position and the same signal breakdown — never a bare percentage.', 'An employer paying to unlock needs to know WHICH candidate is stronger and on what. A percentage implies a precision the model does not have.'],
          ['Employer · job form pool line', '“≈ 224 candidates have all of these”, updating as skills are picked.', 'Set intersection, not score. It answers “is my skill combination too rare to fill” BEFORE publishing, which is when it can still be changed.'],
          ['Nobody', 'The score’s inputs for protected fields.', 'They are not in the model at all, so there is nothing to show — see the warning above.'],
        ],
      },
      items: [
        'Round to whole numbers and never show decimals. “87.4% match” claims a precision that nine weighted signals cannot support.',
        'The two reasons shown are the two highest-CONTRIBUTING signals (weight × credit earned), not the two highest-weighted ones. Showing “Skills” on a candidate who matched 1 of 10 is worse than showing nothing.',
        'Never show a candidate a score built on something they cannot see or change. Every one of the nine signals maps to a field in their own Profile or CV, and that is deliberate — it is what makes “complete your CV” an honest suggestion rather than a growth tactic.',
      ],
    },
    {
      label: 'PDF → SKILLS: how an uploaded CV becomes CvSkill rows',
      text: 'EXTRACTION IS NOT RESOLUTION. The AI reads the PDF and returns raw words — “ReactJS”, “JS”, “Quản lý dự án”, “MS Office”. Turning those words into `skillId`s is a separate, deterministic step, and it does NOT compare each word against the alias table as its own pass: canonical names and aliases are loaded into ONE lookup index, and every term gets ONE exact match against it.',
      table: {
        cols: ['Step', 'What happens', 'The rule'],
        rows: [
          ['1 · Extract', 'The parser returns a flat list of candidate terms from the Skills section and, optionally, from job descriptions.', 'Deliberately dumb — extraction knows nothing about our taxonomy. Its job is to find words, not to judge them.'],
          ['2 · Normalise', 'lower-case · trim · strip diacritics · collapse spaces and punctuation. `Node.Js` → `nodejs`, `React JS` → `reactjs`, `Kế toán` → `ke toan`.', 'ONE normaliser, three callers — import, typeahead, and alias insert. If they diverge, the index and the query stop agreeing and lookups fail for reasons nobody can see.'],
          ['3 · Resolve', 'One lookup against the same analysed index the typeahead uses — `skill.name_vi` + `skill.name_en` + any `skill_alias.alias`, folded and normalised.', 'SAME INDEX, FUZZINESS OFF. Folding and punctuation stripping still apply (so “ke toan” and “nodejs” resolve), but edit-distance matching is disabled for this caller: an unattended import has no human to catch a wrong guess, and `Angular` vs `AngularJS` are two real rows one character apart.'],
          ['4 · Branch on the outcome', 'Hit → a CvSkill row with `source = EXTRACTED`. Miss → nothing saved, and the term is written to `unmatched_term`. Ambiguous → treated as a MISS.', 'Ambiguity can only arise if two rows share a lookup key, which CI forbids — but if it happens, import must never pick. See the alias rules: this is why “PM” is nobody’s alias.'],
          ['5 · Candidate sees the result', 'CONVERT route: the compare screen shows matched skills as chips and unmatched terms separately, each offering “pick from the list” or “request it”. UPLOAD-ONLY route: the skills line on the CV row, editable from the first render.', 'The two routes differ in WHEN, not in WHETHER. Extraction writes rows either way; what is guaranteed is that the candidate can always SEE and CHANGE what we derived. That is the answer when the client asks “what if the AI is wrong” — not that we withhold the result, but that nothing we derive is ever beyond their reach.'],
        ],
      },
      items: [
        'The miss path is the LEARNING LOOP, not an error. `unmatched_term` already exists in svn-be as an admin approve / merge / reject queue. A term arriving 200×/month is not a failure — it is next month’s alias, or next month’s canonical row. Without this queue the taxonomy rots silently.',
        'VERSION ROLL-UP — decide this before import ships. `skill` is a three-level tree (group → skill → version) and `Angular` alone has FIFTEEN version children (Angular 2, 2+, 4, 4+, 5 …). If a CV resolves to the version node, one candidate pool fragments across nine spellings of the same skill and search silently under-returns. Recommendation: CV import resolves UP to the base skill; version nodes stay available to job posts, where a specific version is a real requirement.',
        'Confidence is a display cue, never a threshold — showing “92%” next to a chip helps the candidate skim. Auto-accepting above some score does not: the failure it creates is a skill the candidate never chose, discovered months later by an employer.',
        'The same pipeline serves the typeahead — the only difference is that a human is present, so an ambiguous key MAY offer both rows instead of falling through to a miss.',
        'This pipeline is why “extract, don’t ask” is safe to promise. Exact-match-only resolution means a bad extraction produces a MISS, not a wrong row — so the cost is one skill the candidate adds by hand, never a claim they have to discover and undo.',
      ],
    },
    {
      label: 'UPLOAD-ONLY CVs — we still parse them, and the skills are simply THERE',
      text: 'CONVERT ≠ PARSE. Choosing “upload my PDF, don’t convert it” is a promise about the FILE, not about the data. The file is stored untouched and is what recruiters download — but the PDF is still parsed in the background, because a file with no facets cannot be found by anyone. There are THREE layers here, and collapsing the middle two is what makes this confusing.',
      table: {
        cols: ['Layer', 'Convert route', 'Upload-only route'],
        rows: [
          ['1 · The file', 'PDF stored, untouched.', 'PDF stored, untouched. This is what an employer downloads.'],
          ['2 · CV content — structured sections a recruiter READS, and the candidate EDITS', 'Created. This is the Saramin CV.', 'NOT created. There is no CV to read or edit — only the file.'],
          ['3 · Derived facets — skills and the rest, read by the SEARCH INDEX only', 'Created, and reviewed on the compare screen.', 'Created in the background and shown on the CV row from the first render — no confirmation step.'],
        ],
      },
      items: [
        'BACKGROUND, NOT INVISIBLE — the distinction the whole design turns on. Background = no form, no extra step, no interruption; the candidate uploads and we parse. Invisible = the candidate cannot see or correct what we hold about them, which fails twice over: a parser that reads “Java” out of “JavaScript” mis-matches them forever with no way to notice, and PDPD (Decree 13/2023) expects a data subject to be able to see and correct derived personal data. Deriving facets from a CV uploaded in order to apply is within the stated purpose; hiding the result is not.',
        'DECIDED — NO CONFIRMATION STEP. Extracted skills are the CV’s skills: written on save, shown on the CV row from the first render, editable from that moment. There is no “That’s right / Not now” strip, no pending state and no unconfirmed state. A prompt asking the candidate to approve something already saved offers no alternative, and a decision with no alternative is not a decision — it is a dialog in the way.',
        'WHAT REPLACES IT is the same thing that made the strip safe, minus the ceremony: the list is VISIBLE on the row and one tap from editable, permanently. That is what satisfies “the candidate can see and correct what we derived” (PDPD, Decree 13/2023) — and it satisfies it in every state, where the strip only did so until someone tapped “Not now”.',
        'DECIDED, skills only — nothing else derived is surfaced on the row. Skills are the highest-value facet, the one both sides of a match write, and the one extraction gets wrong most visibly.',
        'WHY NOT years, title, education too — because a row that lists eight derived facts is the compare screen wearing a disguise, at which point the two upload routes have collapsed into one and the candidate who would not sit through a review screen is lost anyway.',
        'THE PROFILE WINS, never re-ask it — name, email and phone come from sign-up and are more reliable than any CV. And the entire Work preference group (desired role · location · salary · job type) cannot be extracted at all: a CV records where someone HAS BEEN, never where they want to go. Onboarding owns those, permanently.',
        'ONE STATE, so extracted skills both index AND display. There is no findable-but-not-claimed tier any more: what the search index holds is what the candidate sees on their row. Simpler to build, simpler to explain, and it removes the ranking rule that said confirmed skills outrank unconfirmed ones.',
        'CvSkill needs ONE extra column and no new table: `source` (EXTRACTED · ADDED). No `confirmedAt`, no CONFIRMED value — there is nothing to record. Keep `source` even so: it is what lets a re-upload replace the extracted rows without touching the hand-added ones, and what tells support whether a wrong skill came from us or from the candidate. An uploaded CV is still a Cv row — it simply holds a file instead of sections — so skills attach to it exactly as they do to a Saramin CV.',
        'THE SKILLS LINE APPEARS ON EVERY CV, uploaded and Saramin alike. Skills are per-CV (CvSkill: cvId · skillId), so two CVs genuinely hold different lists — and comparing them at a glance is exactly how a candidate decides WHICH CV employers should find. A line on one row and nothing on the next reads as “this CV has no skills”, which is both wrong and alarming.',
        'SAME DISPLAY, DIFFERENT EDIT DESTINATION — this is what keeps one source of truth. An UPLOADED CV’s ✎ Edit opens a small popup holding the SAME skills combobox the CV editor uses, because nothing else can hold its skills. A SARAMIN CV’s ✎ Edit opens the CV editor’s skills section; it must never edit in a popup, or the same field becomes writable from two places and they drift.',
        'LABEL IT “SKILLS”, nothing cleverer. An earlier draft read “Employers find you by …”, which implies skills are the ONLY searchable facet — they are not: desired role, location, years, level and education all filter too. For the same reason the extraction prompt says skills “HELP employers find you”, never “are how”.',
        'RE-UPLOADING the same CV re-parses it and REPLACES the `source = EXTRACTED` rows, leaving `source = ADDED` untouched. This is the one place the source column earns its keep: keeping the old extracted list against a new file would mean the skills no longer describe the CV an employer downloads, and dropping the hand-added ones would delete the candidate’s own work without asking.',
        'NOTHING BLOCKS AND NOTHING INTERRUPTS — parsing happens in the background, the row shows the result, and a candidate who never touches it is exactly as findable as one who curates it. That was always the goal; the strip was one way to reach it, and the plain line is a shorter one.',
        'UNREADABLE PDFs must be TOLD, not left silent. Image scans and heavily designed CVs extract nothing; that candidate is then findable only on Profile facets — degraded, not invisible, but they will never know unless we say so: “We couldn’t read this PDF, so employers can’t find you on your skills — add them (30 seconds).”',
        'KNOWN GAP, deliberately accepted for Phase-1 — a mis-parsed DATE is more damaging than a mis-parsed skill and we are not asking about it. A wrong skill puts the candidate in searches they do not fit: noise, and VISIBLE to them. A wrong years-of-experience drops them out of every “5+ years” filter: invisible, untraceable, and they never learn why. Revisit if pool analytics show a mass of candidates sitting at implausibly low years.',
        'Upload-only CVs should score LOW on CV completeness with the reason stated — not as a punishment, as the honest signal that this CV performs worse in search.',
        'The argument for the client, if they object to parsing a file the candidate asked us to leave alone: CV SEARCH IS THE PAID PRODUCT. Unparsed uploads are dead inventory. If most candidates take the upload route and we do not parse them, the thing employers are buying is mostly empty.',
      ],
    },
    {
      label: 'CLIENT MASTER DATA (svn-be, migrations through V80) — the structure is there, the CONTENT is not',
      text: 'Reviewed against the client’s own master-data export. Good news first: every table our skills design needs ALREADY EXISTS, including the `lower(alias)` index and the unmatched-term queue. We are not asking them to build anything. The blocker is that the alias tables hold ZERO rows, on top of a skill list that needs cleaning before aliases are worth writing.',
      table: {
        cols: ['Table', 'What it gives us', 'Rows', 'Verdict'],
        rows: [
          ['`skill`', 'The master list — 17 groups, three-level tree group → skill → version.', '731', 'Exists, but dirty — see below.'],
          ['`skill_alias` / `industry_alias` / `job_role_alias`', 'The curated TAIL — abbreviations and EN↔VN pairs the search index cannot derive (CSKH, PTS). Their own doc calls it “node aliases (CV/typeahead normalization)”, with a `lower(alias)` index.', '**0**', '🟢 Not a launch blocker — Phase-1 ships empty and fills from `unmatched_term`.'],
          ['`occupation_skill`', 'Occupation ↔ skill, flagged ESSENTIAL / OPTIONAL. This is our role-based suggestion source.', '233', '🟡 Too thin — ≈ 4 skills across 60 roles; suggestion needs ~10 each.'],
          ['`unmatched_term`', 'Admin approve / merge / reject queue — the miss path in the import pipeline above, and the source of every alias worth writing.', '—', '🔴 Exists, unused — and Phase-1 now DEPENDS on it. Wire it before launch or the taxonomy never learns.'],
          ['`skill_relation`', 'Skill ↔ skill edges for search expansion. Phase-2 for us.', '0', 'Not needed in Phase-1.'],
          ['`language` + `language_proficiency`', 'Proper language master with CEFR levels.', '8 + 7', '✅ Use these — languages must NOT be skills.'],
        ],
      },
      items: [
        'CONTRADICTION TO RAISE — the export says “36 duplicate names merged (→ aliases)”, but `skill_alias` has zero rows. So either the merge DELETED the losing spellings (in which case a CV saying “ReactJS” now resolves to nothing) or that arrow was aspirational. The merge also did not finish: `React` sits in Frontend/UI while `React JS`, `ReactJS` and `React/Typescript` are still separate rows in Ungrouped.',
        'CLEANUP IS THE REAL ASK, not aliases. A search index finds a wrong row faster; it does not make it right. And writing aliases onto a broken list entrenches the breakage — map “pm” onto the row literally named `Project Manager` and the mistake is permanent. Rows first, aliases later, driven by the queue.',
        'JOB TITLES ARE STORED AS SKILLS — `Product Manager`, `Project Manager`, `Business Analyst`, `Software Engineer`, `Solution Architect`, `Technical Director`, `IT Manager`. These are `job_role` values wearing the wrong hat, and they are precisely what our alias rules exclude.',
        'LANGUAGES ARE STORED AS SKILLS — `English`, `English - Good`, `English Skills`, `Japanese - N1`, `Japanese ( N1 Or N2)`, `Korean`, `French`, `German`, `Chinese`, `Arabic` — while `language` + `language_proficiency` sit right there unused. Move them; a CEFR level is not something you tap as a chip.',
        'TYPOS ARE LIVE ROWS — `Emtuty Famework 6` (Entity Framework 6), `Commucation`, `Organizaion`, `mcv`, `Kubernete`, `Postgre`, and the bare tokens `no`, `hub`, `oss`, `backlog`. Each one is a facet an employer could theoretically filter on.',
        '141 ROWS ARE “Ungrouped” — a fifth of the taxonomy has no group, so it cannot be reached by group-based browsing or suggestion.',
        'NON-IT COVERAGE IS EFFECTIVELY ZERO — the `Soft skill` group holds TWO rows (Organization, Problem Solving Skill). Meanwhile `job_role` covers Accounting, Banking, Customer Service, Insurance, Retail, Securities, Interior/Exterior, Photography. A sales or accounting candidate opens the skill picker and finds nothing that describes them — and their CV then carries no searchable skills at all. This is the single biggest risk to CV search quality at launch, and it is invisible in a demo built on IT profiles.',
        'WHAT TO ASK FOR, in order: (1) a cleanup pass — retire job titles and languages, fix typos, merge spelling variants INTO `skill_alias` rather than deleting them, group the 141; (2) grow the non-IT groups to usable depth; (3) grow `occupation_skill` to ~10 rows per role, which drives suggestions on BOTH sides. Diacritic-free spellings are NOT on this list any more — folding handles them — and the alias tail comes later from `unmatched_term`, not from a homework assignment. Steps 1–2 are the client’s taxonomy work; step 3 is where our seed file is the worked example.',
      ],
      warn: 'NARROWED — the ZERO alias rows are no longer a launch blocker. An analysed index (folding + prefix + typeahead fuzziness) covers most of what aliases were for, so Phase-1 ships without a curated list and `unmatched_term` tells the client which aliases are worth writing; see SKILLS → “search engine first”.\n\nWhat DOES still block is the CANONICAL ROWS, which no search engine can fix — it only finds a wrong row faster. `Product Manager`, `Project Manager` and `Business Analyst` are stored as skills; `English`, `Japanese - N2` and `Korean` are stored as skills while a proper `language` table sits unused; 141 rows are Ungrouped; and `Soft skill` holds two rows, so non-IT candidates find nothing that describes them. Agree an owner and a date for THAT cleanup before the skills screens are estimated.',
    },
    {
      label: 'CV search is a DISCOVERY task before it is a build task',
      text: 'How the CV pool is structured, indexed, searched and ranked must be researched before any build — see “Resume list — Companies”, and “CV data & matching architecture” → Kick-off for the research spike. That spike is the first thing to assign: CV search, matching and recommendations all sit on top of it.',
    },
    {
      label: 'CV visibility (candidate-owned) — ONE account-level switch',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Discoverable', 'The candidate appears in employer CV search as a LOCKED preview built from their Profile + searchable CV; a company must spend an unlock to see the full CV and contact details.', 'Can only be changed by the candidate — no system action and no HQ action may flip it.'],
          ['Hidden', 'The candidate does not appear in employer search at all; applying still works, and applications already sent are unaffected.', 'Candidate-set only; Hidden takes effect on the search index synchronously, not at the next re-index.'],
        ],
      },
      items: [
        'Visibility is ACCOUNT-level, not per-CV. The per-CV control in My CVs answers a different question — WHICH of the candidate’s CVs feeds search and is delivered on an unlock — and must not be worded as if it were a visibility toggle.',
      ],
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
              { name: 'skills', type: 'CvSkill[] → Skill taxonomy', required: true, notes: 'skillId only — a pure tag. Autocomplete against the taxonomy, never free strings; see the module SKILLS block' },
              { name: 'languages / certificates', type: 'repeatable', notes: 'optional' },
              { name: 'optional sections', type: 'repeatable ×6', notes: 'Foreign Language · Highlight projects · Certificates · Awards · Activities · References — the SAME set as My Profile, added from the completeness rail. Each renders its real field form (one shared field catalogue with the profile edit sheets). DROPPED: Publications (not a search facet, near-zero fill rate on a general VN job board — Saramin KR and VietnamWorks have none; papers go under Highlight projects) and Recommendations (a request-and-wait flow that depends on a third party replying — too much machinery for a 1% signal in Phase 1)' },
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
            heading: 'FLOW — create a CV (both routes)',
            items: [
              '1. My CVs → "+ Add new CV" (the SAME entry point is reached from Apply → "Add a new CV") → the Add-a-new-CV screen.',
              '2. Choose a route: UPLOAD a CV, or CREATE a Saramin CV.',
              'UPLOAD · 3a. Pick the file → the PDF preview shows on the left, what-happens-next on the right → "Save my PDF" → the file is in My CVs, byte-identical, usable for applying right away.',
              'UPLOAD · 4a. An OFFER follows (never a step in the way): "Also create a Saramin CV from it?" — decline and you are done; accept and AI reads the file.',
              'UPLOAD · 5a. CV COMPARE screen — your PDF on the LEFT, the same information restructured as a Saramin CV on the RIGHT. Gaps are inline editable fields; AI suggests skills as one-tap chips. Save as original PDF, or as a Saramin CV.',
              'CREATE · 3b. The CV builder opens (Saramin-KR layout): profile header on top, stacked section forms, right rail with CV completeness + the item list (＋/− optional sections).',
              'CREATE · 4b. Fill Education (essential) · Work experience · Skills · About, add optional sections from the rail, name the CV in the bottom bar → "Completed".',
              '6. Either route lands back in My CVs with the new CV in the list.',
              '→ Next: CV management (which CV is searchable) · Apply (Application management).',
            ],
          },
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
          'Up to 3 CVs per candidate, exactly ONE of them searchable — decided; see the module data model.',
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
          '[C4] The 3-CV cap is decided — is 3 the right number, and what happens when a candidate wants a 4th (replace-oldest vs. hard stop)?',
          'Which builder templates does the client want, and who designs them?',
          'Do we localise the builder output (a VI CV and an EN CV from the same data)?',
          'For Phase-1 without AI, how many fields is it acceptable to ask for after an upload?',
          'Should an uploaded CV be virus-scanned synchronously (slower upload) or asynchronously (a brief window before it can be served)?',
        ],
      },
    },
    {
      name: 'CV management (My CVs)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-my-cvs',
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
            heading: 'FLOW — manage my CVs',
            items: [
              '1. My account → My CVs. The page opens with the PROFILE SUMMARY on top (name · visibility badge · contact · desired job, level, locations, industries, salary, experience, education, availability) plus the counters (proposals received · CV views · applications sent).',
              '2. Below it, the CV list — up to 3, each showing its NAME ("Product Designer CV") and a kind tag (Uploaded PDF / Saramin template).',
              '3. ONE named action per row — "View as employer", a text link stacked under the CV name and date in the left column. Everything else sits behind a ⋯ icon button at the row\'s top-right: Tải xuống · Đổi tên · Xoá (destructive, in red) · and the searchable switch. Four peer text links put Xoá one stray click away from View; the menu costs one click and removes that risk.',
              '4. "Cho nhà tuyển dụng tìm thấy" switch, inside the ⋯ menu, one per CV — switching one ON switches the others OFF, because exactly one CV is searchable at a time. The ON row also carries an "Đang hiển thị" badge next to the CV name, so the state is readable without opening any menu. Helper line under the switch: "Chỉ 1 CV được tìm thấy. Các CV khác vẫn ứng tuyển được." The old label "Cho phép tìm kiếm" is retired — it read as a privacy switch ("allow searching") when it actually picks WHICH CV employers see.',
              '5. "+ Add new CV" → the Add-a-new-CV flow (see Create CV).',
              '→ Feeds: employer CV search reads the Profile + the searchable CV; Apply lets the candidate pick any CV to send.',
            ],
          },
          {
            heading: 'Visibility — one switch, stated consequences',
            items: [
              'Discoverable — the candidate appears in employer CV search as a LOCKED preview built from their Profile + searchable CV; a company must spend an unlock to see the full CV and contact details.',
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
            'Enforce exactly one SEARCHABLE CV per jobseeker with a partial unique index rather than application logic. The visibility flag must be honoured by the search index itself, not filtered at read time — filtering after the fact is how a hidden candidate ends up in a result count.',
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
          '[C6] Is visibility opt-in or opt-out by default at account creation? (Also open at module level.)',
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
                ['Career', 'careerLevel ≠ ANY OR yearsOfExp > 0', '“EXPERIENCED · 3y”, else just the level'],
                ['Education', 'at least one education entry', 'degree · school of the first entry'],
                ['Industries', 'targetIndustries is non-empty', 'the first 3'],
                ['Language certs', 'at least one language entry', 'language:cert:score, first 3'],
                ['Salary', 'an expected salary with a min, OR kind = INTERVIEW', '“min~max CURRENCY”, or INTERVIEW'],
                ['Locations', 'desiredLocations is non-empty', 'the first 3'],
                ['Work types', 'desiredWorkTypes is non-empty', 'the selected values, e.g. “remote · hybrid”'],
                ['Willing to relocate', 'the flag is on', 'Yes, else blank'],
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
              { name: 'items', type: 'skillId[]', required: true, notes: 'references into the Skill taxonomy. Grouping is a DISPLAY concern of the generated PDF only — storage is the flat CvSkill list' },
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
              { name: 'desiredWorkTypes', type: 'enum[]', notes: 'multi-select on the SAME `job_type` master list the job uses: in-office · remote · hybrid · oversea. Replaces the old remoteOk and overseas booleans — those were two of these four values wearing a different name.' },
              { name: 'willingToRelocate', type: 'bool', notes: 'the one mobility flag that is NOT a work type: it is about moving city, not about work arrangement. Read with Locations, not with work type.' },
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
              { name: 'skills', type: 'CvSkill[] → Skill taxonomy', notes: 'THE key facet — must be normalised, never free strings (see “The join”)' },
              { name: 'totalYearsExperience', type: 'int', notes: 'PROFILE-level, not per skill — this is the seniority signal ranking uses now that CvSkill carries no years' },
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
          '[C2] Build vs. buy the CV parser — LLM prompt vs. a dedicated resume-parsing vendor? How good is Vietnamese-language extraction?',
          '[C1] Where does the canonical Skill/Title/Industry taxonomy come from — adopt an existing one, or curate our own? Who owns it after launch?',
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

        keyPoints: [
          {
            vi: 'Một dòng kết quả phải đủ để quyết định có mở khoá hay không: giới tính · tuổi, số năm kinh nghiệm, công ty gần nhất (tên, chức danh, thời gian, mô tả), học vấn gần nhất (trường, bằng, đã tốt nghiệp hay dự kiến tốt nghiệp) và kỹ năng.',
            en: 'A result row must be enough to decide whether to spend a credit: gender · age, years of experience, the LATEST company (name, title, period, description), the LATEST education (school, degree, graduated or expected), and skills.',
          },
          {
            vi: 'Danh tính bị che cho tới khi mở khoá: họ tên đầy đủ, email, số điện thoại và file CV. Mọi thứ khác ở trên đều hiển thị khi còn khoá.',
            en: 'Identity stays masked until unlock: full name, email, phone and the CV file. Everything listed above IS shown while locked.',
          },
          {
            vi: 'Mỗi trường hiển thị trên dòng kết quả cũng phải là một bộ lọc — hiển thị mà không lọc được thì nhà tuyển dụng vẫn phải cuộn 248 kết quả.',
            en: 'Every field shown on the row must also be a filter — a field you can read but not filter on still leaves the recruiter scrolling 248 results.',
          },
          {
            vi: 'Giới tính và tuổi là dữ liệu nhạy cảm về phân biệt đối xử. Hai trường này chỉ hiển thị/lọc được nếu ứng viên đã điền (tuỳ chọn) và cần được pháp lý của khách hàng duyệt trước khi ra mắt.',
            en: 'Gender and age are discrimination-sensitive. They render and filter only when the candidate supplied them (both optional), and the client’s legal side must sign the facets off before launch.',
          },
        ],

        uiFields: [
          {
            group: 'Result row — identity line (masked while locked)',
            items: [
              { name: 'maskedName', type: 'derived string', required: true, notes: 'surname + ○○ (e.g. "Trần ○○"). The full name appears only after unlock — never send the real name to the locked endpoint, mask it server-side' },
              { name: 'gender', type: 'enum (Nam · Nữ · Khác)', notes: 'OPTIONAL on the candidate side — the row omits it silently when blank, it never renders "Not specified". Shown as "Nữ · 28 tuổi" on one line, Saramin-KR style' },
              { name: 'age', type: 'int (derived)', notes: 'computed from dateOfBirth at query time — never stored as a number, or it goes stale. Blank DOB → no age shown' },
              { name: 'headline / currentTitle', type: 'string → Title taxonomy', required: true, notes: 'the candidate’s own job title line, e.g. "Điều dưỡng trưởng"' },
              { name: 'totalYearsExperience', type: 'int (derived)', required: true, notes: 'summed from work history. 0 renders as "Fresher · under 1 yr", not "0 years"' },
              { name: 'lockState', type: 'derived', required: true, notes: 'Locked → "Name & contact locked" + [Unlock · 1 credit]; Unlocked → "Unlocked" + [View CV], free to re-open' },
            ],
          },
          {
            group: 'Result row — latest company (most recent work-experience entry)',
            items: [
              { name: 'company.name', type: 'string', notes: 'the employer name as written on the CV. See the re-identification note in the locked/unlocked table' },
              { name: 'company.title', type: 'string → Title taxonomy', notes: 'role held at that company — may differ from the headline' },
              { name: 'company.period', type: 'derived string', notes: 'from–to plus duration, e.g. "03/2023 – now · 2 yrs 5 mos". "now" when isCurrent' },
              { name: 'company.description', type: 'text (truncated)', notes: 'the CV’s own description of the role, clamped to 2 lines on the row and shown in full after unlock' },
              { name: 'no-experience case', type: 'empty state', notes: 'a candidate with no work history shows the block as "No work experience yet" rather than hiding it — absence is a screening signal for campus hiring' },
            ],
          },
          {
            group: 'Result row — latest education (most recent education entry)',
            items: [
              { name: 'education.school', type: 'string', required: true },
              { name: 'education.degree / major', type: 'string + level enum', required: true, notes: 'e.g. "Cử nhân Điều dưỡng"; the level enum (High school · College · Bachelor · Master · Doctor) is what the Education-level facet filters on' },
              { name: 'education.graduationStatus', type: 'enum', required: true, notes: 'Graduated (MM/YYYY) · Expected (MM/YYYY) · Attending · Left. Rendered as a small badge; Expected is toned differently so campus candidates are visible at a glance' },
            ],
          },
          {
            group: 'Result row — skills & asks',
            items: [
              { name: 'skills', type: 'skillId[] → Skill taxonomy', required: true, notes: 'top N by taxonomy weight, the rest collapsed into "+N more". Query-matched skills sort first so the recruiter sees why the row matched' },
              { name: 'location', type: 'enum (province/city)', required: true },
              { name: 'desiredSalary', type: 'int (VND) / Thỏa thuận', notes: 'optional candidate ask — see the open question on whether it is shown while locked' },
              { name: 'availability', type: 'enum', notes: 'Open now · 1 month · 2+ months' },
              { name: 'lastUpdatedAt', type: 'relative date', required: true, notes: '"Updated 2 days ago" — the freshness cue that stops a recruiter spending a credit on a dead CV' },
            ],
          },
          {
            group: 'Filter rail — one facet per field shown on the row',
            items: [
              { name: 'gender', type: 'enum facet', notes: 'Any · Nam · Nữ — legal sign-off required (see key points)' },
              { name: 'age', type: 'range facet', notes: 'Under 25 · 25–34 · 35–44 · 45+ — buckets, never a free min/max, so the UI cannot be used to target a single birth year' },
              { name: 'experience', type: 'range facet', notes: 'No experience / fresher · 1–3 · 3–5 · 5+ years' },
              { name: 'location / industry', type: 'enum facets' },
              { name: 'educationLevel', type: 'enum facet', notes: 'College · Bachelor · Master' },
              { name: 'graduationStatus', type: 'enum facet', notes: 'Graduated · Expected graduate — the campus-hiring facet' },
              { name: 'skills', type: 'multi-select facet', notes: 'autocompletes against the Skill taxonomy, ids not strings — the same join the CV extractor writes' },
              { name: 'desiredSalary / availability / lastUpdated', type: 'range + enum facets' },
            ],
          },
        ],

        sections: [
          {
            heading: 'Result row — what is visible while LOCKED, and what an unlock adds',
            early: true,
            text: 'The commercial design of the whole feature sits in this one table. Too little on the locked row and no recruiter risks a credit; too much and there is nothing left to buy. The line we draw: everything that describes the CANDIDATE’S FIT is free to read, everything that lets you CONTACT them is paid.',
            table: {
              cols: ['Field on the row', 'While locked', 'After unlock'],
              rows: [
                ['Name', 'Masked — surname + ○○ ("Trần ○○")', 'Full name'],
                ['Gender · age', 'Shown, when the candidate supplied them', 'Shown, plus date of birth'],
                ['Years of experience', 'Shown', 'Shown'],
                ['Latest company — name, title, period', 'Shown', 'Shown, plus the full work history'],
                ['Latest company — description', 'Shown, clamped to 2 lines', 'Shown in full'],
                ['Latest education — school, degree, graduated / expected', 'Shown', 'Shown, plus the full education history'],
                ['Skills', 'Top skills + "+N more"', 'All skills, languages and certificates'],
                ['Location · desired salary · availability · last updated', 'Shown', 'Shown'],
                ['Email · phone', 'Hidden', 'Shown'],
                ['CV file (the PDF)', 'Hidden — no preview, no thumbnail', 'Viewable and downloadable'],
              ],
            },
            warn: 'An unlock costs 1 credit, is logged with the user who spent it, and pools across the company team. Re-opening an already-unlocked CV is free forever and must never re-charge.',
          },
          {
            heading: 'Re-identification — the risk this field set creates',
            text: 'Masking the name is not the same as anonymity. Gender + age + employer name + job title + school is, in a market the size of Vietnam, frequently enough to identify one person — a recruiter who reads "Nữ · 34 · Điều dưỡng trưởng khoa Ngoại · BV Quốc tế Mỹ" has effectively identified the candidate without spending a credit. This is a deliberate trade, not an oversight, and it needs a decision rather than a default.',
            items: [
              'The value case: a recruiter who cannot see the current employer cannot judge seniority or sector fit, and will not spend credits blind. Reference products (Saramin KR, VietnamWorks) all show it.',
              'Mitigation held in Phase-1: contact details and the CV file stay locked, every unlock is logged and attributed, and the candidate can leave the pool at any time via visibility consent.',
              'Alternative if legal objects to the employer name: show industry + company size instead ("Bệnh viện tư · 500–1000 nhân sự"), keeping the signal and dropping the identifier. Costs a mapping table, nothing more.',
              'Third option, candidate-controlled: let the candidate hide their current employer from search the way they already control overall visibility — Saramin KR and LinkedIn both do this. Costs one more field on the CV visibility screen.',
            ],
            warn: 'Do not ship gender and age as facets before the client’s legal side has signed them off. Filtering a candidate pool by gender or age is the textbook shape of a discrimination claim, and the log of who filtered by what is discoverable.',
          },
          {
            heading: 'Where each field comes from — nothing new is asked of the candidate',
            text: 'Every field on the row already exists upstream. This screen is a read model, not a new collection point; if a field is blank here the fix is upstream, in extraction or in the CV form.',
            table: {
              cols: ['Row field', 'Source', 'If missing'],
              rows: [
                ['Gender, date of birth → age', 'Basic information on the CV (reinstated 2026-08-09, both optional)', 'The row silently omits the demographic line — never a placeholder'],
                ['Years of experience', 'Derived from CV work history (totalYearsExperience)', 'No work history → "Fresher · under 1 yr"'],
                ['Latest company block', 'The most recent Work-experience entry (isCurrent first, else latest endDate)', '"No work experience yet"'],
                ['Latest education block', 'The most recent Education entry', 'The block is omitted; the CV loses completeness score and drops in ranking'],
                ['Skills', 'CvSkill[] resolved to the Skill taxonomy', 'The row still renders; unresolved free-text skills are NOT shown, because they are not searchable'],
              ],
            },
          },
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
            { name: 'cvId', type: 'uuid', notes: 'the searchable CV — one per seeker (up to 3 held)' },
            { name: 'seekerId', type: 'uuid' },
            { name: 'title / desiredPosition', type: 'string', notes: 'primary keyword field' },
            { name: 'skills', type: 'skillId[]', notes: 'the indexed facet, denormalised from CvSkill — taxonomy ids, never strings' },
            { name: 'experienceYears', type: 'enum/number', notes: 'derived from work history?' },
            { name: 'location', type: 'enum (province/city)' },
            { name: 'industry / category', type: 'enum' },
            { name: 'educationLevel', type: 'enum' },
            { name: 'salaryExpectation', type: 'int (VND) / negotiable' },
            { name: 'gender', type: 'enum? (nam|nu|khac)', notes: 'ROW + FACET. Denormalised from Basic information; nullable because the field is optional. A null must be excluded from a gender facet query, not bucketed into "other"' },
            { name: 'dateOfBirth', type: 'date?', notes: 'INDEXED, but age is computed at query time — storing an integer age silently rots. Age buckets are the only exposed form (see the UI fields)' },
            { name: 'latestExperience', type: 'embedded object', notes: 'ROW BLOCK — { companyName, title, titleId, startDate, endDate, isCurrent, description }. Denormalised onto the search document at index time: the row must never fan out a second query per result' },
            { name: 'latestEducation', type: 'embedded object', notes: 'ROW BLOCK — { school, degree, major, level, graduationStatus, graduationDate }' },
            { name: 'graduationStatus', type: 'enum', notes: 'FACET — graduated · expected · attending · left. Derived from the latest education entry’s dates when the candidate did not state it explicitly' },
            { name: 'visibility', type: 'enum', notes: 'discoverable · hidden — candidate consent gate' },
            { name: 'lastUpdatedAt / lastActiveAt', type: 'timestamp', notes: 'recency signal for ranking' },
            { name: 'completenessScore', type: 'number', notes: 'ranking signal — how filled-in the CV is' },
            { name: 'FacetAudit', type: 'entity', notes: 'companyUserId, filters used, resultCount, timestamp — a query log kept because gender/age filtering has to be answerable after the fact. Retention to be set with legal' },
          ],
          endpoints: [
            'GET /company/resumes/search — faceted search; returns LOCKED previews + result count (TBD by research)',
            'POST /company/resumes/:id/unlock — consume a credit/package to reveal full CV + contact',
            'GET /company/resumes/:id — full CV (only after unlock)',
          ],
          integrations: ['Package / credit balance (Products & packages)', 'Candidate visibility consent'],
        },

        openQuestions: [
          'ANSWERED (2026-08-10, client direction) — what a locked row shows: masked name, gender · age, years of experience, latest company (name, title, period, description), latest education (school, degree, graduated / expected) and skills. See the locked/unlocked table above. What remains open is only the four items below.',
          '[LEGAL — blocker for the facets, not for the display] Gender and age as FILTERS. Showing them on a row is one thing; letting an employer exclude a pool by them is another, and it is the shape a discrimination claim takes. Does the client accept the facets, and does their legal side sign them off? If not, we keep the fields on the row and drop the two facets — a one-line change.',
          'Does the locked row show the latest company by NAME, or by industry + size? Name is what the reference products do and what makes the field worth reading; it is also, combined with gender + age + title, usually enough to identify the candidate before any credit is spent. Client decision.',
          'Should a candidate be able to hide their current employer from search while staying discoverable (the LinkedIn / Saramin-KR control)? Costs one field on the CV visibility screen and closes most of the re-identification objection.',
          'Is desired salary shown on the LOCKED row, or only after unlock? It is one of the strongest screening signals, so showing it lifts unlock rates — and it is also the field candidates are least comfortable broadcasting.',
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
