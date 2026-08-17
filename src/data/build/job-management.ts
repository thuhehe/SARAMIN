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
      label: 'What each surface may post FROM',
      text: 'Posting rights differ even though the Job entity is shared. Which products a surface may draw on comes from the product’s entitlementSource flag (Products & Packages) — never from the product name.',
      table: {
        cols: ['Surface', 'May post from', 'Rule'],
        rows: [
          ['Admin (HQ)', 'Any product — the Admin-only free tier, or any line on the company’s active POs', 'The free tier needs no PO and has NO limit: HQ can post it for any company at any time, with no preconditions.'],
          ['Company site', 'Only the products the company bought (active PO lines)', 'An employer can NEVER post a free job — the free tier is not offered on the Company site at all.'],
        ],
      },
      warn: 'A free job links to no PO, consumes no quota, is excluded from revenue reporting, cannot be upgraded to a paid tier later, and gets no premium placement slots (default listing only).',
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
      label: 'Editing an OPEN job is free — EXCEPT the job title after 72 hours (employer only)',
      text: 'Once a job is Open the EMPLOYER keeps editing it as much as they like; there is no re-approval and the status stays Open. The single exception is the JOB TITLE, which locks 72 hours after the job went live. HQ Admin is not restricted at all — it can edit any field of any posting at any time.',
      table: {
        cols: ['Field', 'Employer (Company site)', 'HQ Admin'],
        rows: [
          ['Job title', 'Editable for the first 72 HOURS after it went live; read-only afterwards. Typos must be fixed inside that window — after it, the posting keeps the title candidates applied to.', 'Always editable, no time limit. HQ correcting a bad posting is the point of the Admin screen; the change is audited.'],
          ['Everything else — description, requirements, benefits, salary, skills, locations, deadline, headcount, recipients…', 'Freely editable for the whole life of the posting. No limit, no re-approval; the job stays Open.', 'Same — freely editable.'],
        ],
      },
      items: [
        'THE WINDOW IS 72 HOURS, COUNTED IN HOURS — not 3 calendar days. A job published at 17:00 on Monday locks at 17:00 on Thursday, regardless of date boundaries. Store `publishedAt` as a timestamp and compare against it; do not truncate to a date, or a job posted late in the evening silently loses most of a day.',
        'THE CLOCK RUNS FROM WHEN THE JOB WENT OPEN (`publishedAt`), not from when the Draft was created and not from the last edit. Editing or refreshing the posting never restarts it. A Scheduled job starts its 72 hours when it auto-publishes, not when it was scheduled.',
        'WHY THE TITLE IS THE ONE LOCKED FIELD: it is the identity of the posting everywhere it has already travelled — search results, the applications already received, job alerts already emailed, and any external index. Renaming a live job on day 20 silently turns it into a different job, and every candidate who applied did so to a title that no longer exists.',
        'The employer form shows the remaining window rather than a bare disabled input — hours while it is short (“Còn 8 giờ để sửa tiêu đề”), then the locked reason (“Tiêu đề đã khoá — tin đã đăng hơn 72 giờ”). A greyed field with no explanation reads as a bug and generates a support ticket.',
        'Draft and Schedule are unaffected: the title is freely editable until the job actually goes live, because nothing has been shown to a candidate yet.',
        'To genuinely change the role, the employer closes this posting and creates a new one (Duplicate on the job detail copies it into a Draft) — a different job gets its own posting and its own applicant list.',
      ],
      warn: 'The lock is a COMPANY-SITE rule, enforced server-side on the employer’s own edit endpoint — not a UI-only disable, or it is bypassed by anyone posting the request directly. HQ Admin edits bypass it by design, and every title change (either surface) is audited with before → after.',
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
          ['Work type (job_type)', 'In office · Remote · Hybrid · Oversea — WHERE and HOW the work happens'],
          ['Contract type (contract_type)', 'Fulltime · Part-time · Fixed-term contract · Internship · Probation · Freelance · Seasonal — the EMPLOYMENT RELATIONSHIP'],
          ['Other', 'Experience range · skills · salary (from–to + currency)'],
        ],
      },
    },
    {
      label: 'WORK TYPE and CONTRACT TYPE are TWO fields — keep the client’s two tables',
      text: 'DECIDED: two lists, not one. Our earlier single “Job type” field (Full-time · Part-time · Internship · Online Jobs · Freelancer · Seasonal · Other) conflated two independent axes, and the client’s backend already models them correctly as `job_type` (4 values) and `contract_type` (7 values). Collapsing them would destroy information that already exists.',
      table: {
        cols: ['', 'Work type — `job_type`', 'Contract type — `contract_type`'],
        rows: [
          ['Answers', 'WHERE and HOW the work happens', 'What the EMPLOYMENT RELATIONSHIP is'],
          ['Values', 'in-office · remote · hybrid · oversea', 'fulltime · part-time · contract · internship · probation · freelance · seasonal'],
          ['Candidate side', '`desiredWorkTypes` — multi-select on the same 4 values', 'NOT collected — asking every candidate to serve a fulltime-dominated minority costs more than it returns.'],
          ['Collected at', 'Onboarding step 2, then editable in My CVs → Desired work condition', 'Nowhere on the jobseeker side. It is a SEARCH FILTER on the job list instead.'],
          ['Scored as', 'folded into Location + work type (17)', 'NOT scored — nothing to match against.'],
        ],
      },
      items: [
        'THEY COMBINE FREELY, which is the definition of two axes rather than one list: “Fulltime + Remote”, “Internship + In office”, “Freelance + Oversea” are all real postings. One field forces the employer to pick a side and lose the other half.',
        'THE FAILURE IS CONCRETE, not theoretical. A full-time remote developer role on a single list means the employer picks “Online Jobs” — and the posting no longer says it is full-time — or picks “Full-time”, and it no longer says it is remote. Either way a candidate filtering on the other one never sees the job, and nothing on screen shows what was lost.',
        '“OTHER” WAS THE TELL. A catch-all value in an enum means the enum does not fit the domain. With two clean axes nothing needs an escape hatch, and “Other” is dropped from both lists.',
        'PROBATION (Thử việc) is a genuinely Vietnamese contract type and our single list did not have it. That is a second reason to take the client’s tables rather than reconcile them to ours: their list was built for this market.',
        'THE LABEL NEEDS FIXING EVEN THOUGH THE COLUMN DOES NOT — `job_type` reads like “contract type” to anybody who has not seen the table, which is very likely how the two got merged in the first place. Keep the column name (no schema churn), but label it “Work type / Hình thức làm việc” everywhere a human sees it.',
        'MASTER-DATA QUALITY, worth fixing while the list is small: the codes mix conventions (`fulltime` vs `part-time`), `oversea` should be `overseas`, and the Vietnamese names for freelance / fulltime / part-time are still the English words — they need real VN labels (Toàn thời gian · Bán thời gian · Tự do) since these are what a candidate reads.',
      ],
    },
    {
      label: 'Job taxonomy is MASTER DATA, not free text',
      text: 'A two-level Job Category → Role (job title) list, maintained on Admin (System → Job categories & roles). The job form’s dropdowns and the jobseeker search filters both read this list, so adding a role is a data change, not a code change.',
      warn: 'A job “Role” (e.g. Software Developer) is a job TITLE — unrelated to the admin RBAC roles in Admin roles & operators.',
    },
    {
      label: 'BENEFITS are a picked LIST, not a paragraph',
      text: 'A benefit is a fixed TYPE (icon + bilingual label, from Master data → Benefits) plus a DESCRIPTION the company writes for that job. The type is what gives each benefit an icon on the jobseeker page, a translation, and — the reason this is worth doing at all — a SEARCH FILTER. A free-text welfare paragraph can never answer “show me jobs with a shuttle bus”; a typed list can.',
      table: {
        cols: ['', 'Type', 'Description'],
        rows: [
          ['Comes from', 'Master data → Benefits — the client’s `benefit` list, 11 fixed codes', 'Written per job by the employer'],
          ['Editable by the employer?', 'No — picked from the list', 'Yes, free text'],
          ['Gives you', 'Icon · vi/en/ko label · search filter · consistency across 500 companies', 'The specifics: amounts, days, routes, conditions'],
        ],
      },
      items: [
        'ELEVEN TYPES — THE CLIENT’S OWN `benefit` MASTER DATA, taken verbatim: insurance · health · bonus · salary-13th · allowance · paid-leave · training · laptop · remote-support · company-trip · stock-esop. The CODES are theirs and must not be renamed: they are the stored value and what the search filter joins on. Our earlier 12-type draft is superseded.',
        'WHAT WE ADD ON TOP OF THE CODE — an ICON and a suggested DESCRIPTION per type. A code alone cannot make a benefit read at a glance on a job card, and a blank description box gets skipped. Neither addition changes the stored data.',
        'THE WHOLE LIST FITS ONE SCREEN, so no accordion and no search box — those exist to cope with a list too long to show. An early draft of ours ran to 66 types across 9 groups, at which size an employer scrolls instead of choosing.',
        'A DESCRIPTION CARRIES THE DETAIL THE CODE CANNOT: one “Phụ cấp” covers ăn trưa / xăng xe / điện thoại / chuyên cần, which is why the list needs no separate code for each.',
        'NO MAXIMUM per job. Each type can be picked once, so the list is self-limiting at the size of the taxonomy; a hard cap only ever blocked a benefit the employer genuinely offers. Ranking, not truncation, is what keeps a long list readable — selection order is display order, so the employer leads with their strongest benefit.',
        'Selection ORDER is display order on the jobseeker page, so an employer can lead with their strongest benefit.',
        'Each type carries a suggested description that is PREFILLED when it is picked. An employer given a blank box writes nothing or one dead word; given a sentence to edit, they edit it — and the edited version is always better than the empty one. This is the single biggest lever on benefit-content quality.',
        'THERE IS NO “KHÁC” CODE, and no free-text benefit name. The client’s list has no catch-all, so nothing can be typed as a benefit title — which is exactly what keeps every company’s benefits comparable and filterable. Anything unusual goes in the DESCRIPTION of the nearest type.',
        'Same picker on BOTH surfaces (HQ Admin job form and the Company site job form), so the two produce identical structured data.',
      ],
      warn: 'Do not keep the old free-text Benefits field alongside this. Two places to write welfare means every job eventually has two versions that disagree, and the search filter silently reads only one of them.',
    },
    {
      label: 'A job’s benefits START as a copy of the company set — then edited freely per job',
      text: 'The company page declares the default welfare set (see Account management → company page). A NEW job form opens with its benefits PREFILLED from that set — a copy, not a live link — and the editor (HQ or the employer) adds, removes, rewords and reorders freely for that posting. Two safety valves sit beside the picker: “↺ Reset to company default” and a read-only “View full company benefits” preview.',
      table: {
        cols: ['Moment', 'What happens', 'Rule'],
        rows: [
          ['Create job', 'Picker is prefilled with the company set, whole, in the company’s display order', 'A DEFAULT, not a restriction — the picker still offers all 11 types, and there is no cap, so nothing is ever truncated or greyed out'],
          ['Editing the job', 'Add / remove / reword / reorder freely — the full 11-type picker, including types the company never declared', 'Per-job curation is the point: a remote role drops “Trang bị laptop” in favour of “Hỗ trợ làm từ xa”, a night-shift role adds its allowance even though no company-level entry exists for it'],
          ['Reset', 'One click returns the job’s list to the current company default', 'REPLACES, never merges — confirm before discarding per-job edits'],
          ['Company set changes later', 'Existing jobs are untouched; new jobs prefill from the new set', 'An old job adopts the new set only by pressing Reset — a company-page edit must not silently undo per-job curation'],
        ],
      },
      items: [
        'THE COMPANY SET NEVER NARROWS THE PICKER. All 11 types stay selectable on every job, including ones the company page does not list — the company set only decides what is PREFILLED. Nothing in the grid is ever disabled, so it can never read as “you may only use the company’s benefits”.',
        'One taxonomy (the shared 11 codes) is what makes Reset and the preview possible — the two surfaces stay mutually convertible even when their content diverges.',
        'The prefill means the form is STILL not retyping: the employer starts from the company set and only touches what differs for the position.',
        'The jobseeker job page renders ONE benefits list — the job’s own. There is no separate read-only company block on the posting; the company page remains one click away for the full picture.',
      ],
      warn: 'Accepted trade-off: a job CAN drift from the company page (e.g. “15 ngày phép” vs “12 ngày phép”). That flexibility is deliberate — the Reset button and the preview are the guardrails, not a hard lock.',
    },
    {
      label: 'A WORKING LOCATION is a NAMED office, saved on the company',
      text: 'A location is not typed into the job form. The company keeps an OFFICE BOOK — each entry is Office name + City/Province + Office address — and a job picks up to 3 of them. The new part is the NAME: a location used to be city + address, and neither works as a label. A company with three sites in Hồ Chí Minh gets three identical-looking rows, and a full street address is too long to read inside a dropdown. “Trụ sở chính”, “Nhà máy Bình Dương” is what an HR user actually recognises.',
      table: {
        cols: ['Field', 'Required', 'Why it exists'],
        rows: [
          ['Office name', 'No · max 50', 'The label in every list, dropdown and job card. The only thing that separates two offices in the same province — strongly recommended, never enforced.'],
          ['City / Province', 'No · Master data enum', 'The filterable half — jobseeker search filters on province, never on the address string. The picker opens on a province rather than blank, so in practice it is always set.'],
          ['Office address', 'No · max 120', 'Street · building. Shown on the job detail and the company page; never parsed for search.'],
          ['Coordinates (lat / lng)', 'Derived on save', 'Geocoded from the address so the company page can render a map and a distance ("cách ga Cát Linh 600 m"). Nullable — a failed geocode never blocks saving, the map simply does not render.'],
        ],
      },
      items: [
        'SAVED ON THE COMPANY, NOT THE JOB. A company posts from the same two or three sites all year; retyping the address on every posting is exactly where “Q.1” / “Quận 1” / “District 1” duplicates come from. Create once, reuse afterwards — and when an office moves, ONE edit corrects every live job.',
        'The picker offers the saved offices plus a “＋ Create a new location” row that opens the create modal inline. An employer who is missing an office must not have to abandon a half-filled job form to go and add one.',
        'NONE OF THE THREE FIELDS IS REQUIRED — decided by the BA. The create modal shows no asterisks and blocks nothing; the only two refusals left are a completely EMPTY record (which would put a blank row in the office book permanently) and a DUPLICATE NAME. The consequence to accept: an office saved without a name is harder to tell apart in the picker, so the UI falls back to the address and then the province as its label. The name is advice, not a gate.',
        'THE NAME IS UNIQUE per company, checked in the modal, and the check only runs once a name has actually been typed — several unnamed offices are allowed, two called “Văn phòng” are not. A duplicate name defeats the entire reason the field exists.',
        'MAX 3 per job, and the SAME office cannot be picked twice on one job — blocked in the dropdown rather than caught on save, because a silent duplicate row reads as a UI glitch.',
        'ONLY City/Province is filterable. Search facets, the match score’s location component and the jobseeker Location filter all read the province enum — never the address string and never the coordinates.',
        'The address IS geocoded on save, but for DISPLAY only: it powers the map on the company page and a distance line, and it is re-run when the address changes. Geocoding is charged per save, not per page view, because the public page renders a static map image rather than loading a map SDK.',
        'Same field on BOTH surfaces (HQ Admin job form and the Company site job form) writing the same company-level record — otherwise HQ posting on a customer’s behalf silently creates a second, divergent office list.',
        'Deleting an office that is used by a live job must be BLOCKED (or soft-deleted and hidden from the picker). A hard delete leaves published jobs pointing at nothing.',
      ],
      warn: 'The old shape — `locations: jsonb` holding a city list — cannot express this and must not survive. A job needs a foreign key to a company location row; a JSON city list has no name, no id, and no way to be corrected in one place when an office moves.',
    },
    {
      label: 'SALARY CURRENCY (decided 2026-08-13) — VND and USD, and USD is a DISPLAY denomination',
      text: 'Both sides of the market may state salary in VND or USD. This is a marketing decision, not a payroll one: employment for work in Vietnam settles in VND regardless, and the number on a job ad is a market SIGNAL aimed at the audience that shops in that unit — “40–75 triệu” and “$1,700–3,200” describe the same job to two different readers.',
      table: {
        cols: ['Where', 'Field', 'Rule'],
        rows: [
          ['Job posting', '`salaryCurrency` enum VND · USD, default VND', 'NEW. Required in range mode; irrelevant when salaryType = negotiable.'],
          ['Candidate expected salary', '`expectedSalary { kind, currency, min, max }`', 'Already carried VND · USD — no data work, see Resume management.'],
          ['Master data', '`currency` list', 'CUT from 9 entries to 2. No “create currency” affordance on the job form.'],
        ],
      },
      items: [
        'THE BUSINESS ARGUMENT IN ONE LINE — the alternative to a USD field is not a VND field, it is an EMPTY one. An employer who thinks in USD and cannot say so selects “Thỏa thuận”, and we lose the salary data entirely on exactly the jobs where salary transparency drives the most applications. The same holds for the candidate: a senior IT candidate who cannot express “$3,000” leaves the field blank.',
        'WHY THE HIGH-VALUE SEGMENT — IT and foreign-invested employers are the high-ARPU buyers (CV unlocks, Top Job, Distinction), they advertise in USD today on ITviec / TopDev / VietnamWorks, and forcing VND reads as “local-only” to precisely the clients being pitched hardest.',
        'TWO CURRENCIES, THE LIST NEVER GROWS — a JPY, RUB or SGD salary is unfilterable, unrankable and unmaintainable here. Do NOT reuse the billing BC’s currency table: what you invoice a customer in has nothing to do with what a job pays.',
        'NEVER CONVERT FOR DISPLAY — show the figure that was written, in the currency it was written in. A converted salary is a number nobody stated, and it silently changes as the rate moves, so the same posting implies a different figure next month.',
        'THE SETTLEMENT LINE on a USD job: “Lương thỏa thuận và chi trả bằng VND theo tỷ giá tại thời điểm ký hợp đồng.” It is accurate, it sets expectations before the interview, and it answers the legal question before anyone asks it.',
        'FOR LEGAL TO CONFIRM, not for us to assert — Vietnam’s foreign-exchange rules restrict quoting and settling in foreign currency for domestic transactions. Agreeing a figure in USD and paying the VND equivalent is standard practice, especially for FDI employers and foreign nationals, and every major VN board quotes USD today. But “everyone does it” is a commercial observation, not a legal opinion: get the client’s counsel to confirm a public advertisement may quote USD before this ships.',
        'SORTING: “Thỏa thuận” stays unranked / last, unchanged. Cross-currency sorting has no defined order without a rate — sort WITHIN a currency, or sort on the requested currency and place the others after, never interleave raw numbers.',
      ],
      warn: 'THE FAILURE THIS PREVENTS — comparing raw numbers across currencies produces FALSE POSITIVES, not misses. A candidate asking $3,000/mo against a job whose maximum is 30,000,000 ₫ evaluates as `3000 ≤ 30000000` → “ranges overlap” → full salary marks, when the candidate is really asking ≈2.5× the job’s maximum. See Resume management → match weights for the cross-currency rule that closes this.',
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
      slug: 'create-job-admin',
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
              { name: 'purchaseOrder', type: 'ref → PO', notes: 'required ONLY for products whose entitlementSource = Requires purchase. Pick the PO FIRST (a customer can have more than one active PO) and the product list becomes that PO’s lines. A product flagged Always available needs no PO.' },
              { name: 'packageType (product)', type: 'ref → Product', required: true, notes: 'the posting tier that drives visibility / ranking. The options offered are filtered by the product’s entitlementSource (Products & Packages), NOT by matching the product name: with no PO only Always-available tiers appear; with a PO, that PO’s paid lines appear.' },
              { name: 'jobCategory / industry', type: 'enum', required: true, notes: 'category = the role area · industry = the company sector (two different axes)' },
              { name: 'jobLevel', type: 'enum', notes: 'Intern/Student · Fresher/Entry level · Experienced (non-manager) · Manager · Director and above' },
              { name: 'jobType (work type)', type: 'enum', required: true, notes: 'in-office · remote · hybrid · oversea. Reads the client’s EXISTING `job_type` master list (4 values).' },
              { name: 'contractType', type: 'enum', required: true, notes: 'fulltime · part-time · contract · internship · probation · freelance · seasonal. Reads the client’s EXISTING `contract_type` master list (7 values). A SECOND field, not a longer version of the first — see the two-axes requirement.' },
            ],
          },
          {
            group: 'Location, experience & salary',
            items: [
              { name: 'workLocations', type: 'ref[] → CompanyLocation', required: true, notes: 'up to 3, PICKED from the company’s saved office book — not typed. Each row shows Office name · City · Address. “＋ Create a new location” opens the create modal inline. See the working-location requirement.' },
              { name: '· officeName', type: 'string (max 50)', notes: 'OPTIONAL — no asterisk in the create modal. The label in every dropdown and list, so it is the only thing separating two offices in the same province; when it is blank the UI falls back to the address, then the province. Unique per company when present.' },
              { name: '· city / province', type: 'enum (Master data)', notes: 'OPTIONAL, but the picker opens on a province rather than blank. The filterable half — search facets and the location match read this, never the address.' },
              { name: '· officeAddress', type: 'string (max 120)', notes: 'OPTIONAL. Street · building; display only.' },
              { name: 'experienceFrom / experienceTo', type: 'number (years)', notes: 'years of experience as a MIN–MAX range (not a single minimum)' },
              { name: 'salaryType', type: 'radio', required: true, notes: 'Negotiable ("Thỏa thuận") OR a from–to range. A JOB states a BAND — the candidate side states ONE figure, and the two are compared point-in-range. Canonical rules: Resume management → CV data & matching architecture → "★ SALARY — the one contract"' },
              { name: 'salaryMin / salaryMax', type: 'number', notes: 'required only when salaryType = range; the unit is whatever salaryCurrency says' },
              { name: 'salaryCurrency', type: 'enum VND · USD', required: true, notes: 'DECIDED 2026-08-13. Default VND. Two values only — never grows. USD is a DISPLAY denomination for the IT / FDI segment, not a payment currency; payroll settles in VND regardless. A USD job renders a settlement line to candidates' },
            ],
          },
          {
            group: 'Content (bilingual)',
            items: [
              { name: 'roleResponsibility (vi / en)', type: 'i18n rich text', required: true, notes: 'Your role & responsibility — 2 languages' },
              { name: 'skillsQualifications (vi / en)', type: 'i18n rich text', required: true, notes: 'Your skills & qualifications — 2 languages' },
              { name: 'benefits', type: 'BenefitItem[]', notes: 'up to 6 · each = benefitTypeId (Master data → Benefits) + description { vi, en }. NOT a rich-text field — see the Benefits requirement.' },
              { name: 'skills', type: 'JobSkill[] → Skill taxonomy', notes: 'ONE flat list, cap 10, autocomplete only — never free text. Skills rank candidates, they never exclude. A live pool line shows how rare the combination is. Full rules: the JOB SKILLS requirement above; shared taxonomy rules in Resume management → SKILLS on the CV' },
              { name: 'contactPerson', type: 'ref → Company user', required: true, notes: 'the named person candidates see as the recipient of their application' },
              { name: 'applicationRecipientEmails', type: 'string[]', required: true, notes: 'one or more emails that receive each application; the NAME shown to candidates is the contactPerson above' },
              { name: 'deadline / expiry', type: 'date (derived)', notes: 'set by the selected product’s duration (e.g. Free = 14 days) rather than typed by hand; drives auto-expiry (Open → Closed)' },
            ],
          },
          {
            group: 'Display pictures — only when the product feeds a picture placement',
            items: [
              { name: 'placementImages', type: 'JobPlacementImage[]', notes: 'ONE entry per image slot on the placements the selected product feeds. Two slots → two pictures, one slot → one, no picture placement → the step does not exist. The COUNT comes from the Placements registry, never from the job and never hard-coded in the form.' },
              { name: '· slotKey', type: 'ref → Placement.imageSlots[].key', required: true, notes: 'which frame this fills, and therefore which aspect and safe areas the preview draws' },
              { name: '· source', type: "enum('upload'|'gallery')", required: true, notes: 'the employer’s own photo, or a pick from the Image gallery' },
              { name: '· galleryImageId / uploadUrl', type: 'uuid? / string?', notes: 'exactly one is set, per source' },
              { name: '· focalPointOverride', type: '{ x, y }?', notes: 'lets this job nudge the crop without touching the shared library picture' },
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
          'The employer may keep editing an Open job freely, with ONE exception: the job title locks 72 hours after the job went live (counted in hours from `publishedAt`, not calendar days). HQ Admin has no such limit. The form shows the remaining window, then the locked reason — see “Editing an OPEN job is free — EXCEPT the job title after 72 hours (employer only)”.',
        ],
        rules: [
          'A job must belong to exactly one company.',
          'THE PICTURE STEP IS DERIVED, NEVER TYPED. It appears only when the selected product feeds a placement carrying image slots, and asks for exactly as many pictures as that placement declares — two frames, two pictures; one frame, one. Changing the product re-derives the step, and pictures already chosen for a slot that still exists are kept.',
          'The picker opens on the TOPICS mapped to the job’s industry (kho vận · vận tải · ngoài trời for a logistics job) and can be switched to any topic or cleared — a logistics firm hiring a marketer wants an office scene, and locking them to their own industry would send them to the upload button instead.',
          'Every slot previews at the real card size with the badge and star safe areas drawn on. The same photo is a good hero at 3:4 and a beheaded portrait at 3:2, and nobody discovers that from a thumbnail.',
          'Pictures are OPTIONAL to publish. A job posted without them renders on the gallery’s automatic default for its industry rather than blocking the publish — a paid posting must never be held hostage by a step the employer does not understand.',
          'An employer’s uploaded picture belongs to that job only. It is never added to the shared gallery, because we hold no right to redistribute it to another company.',
          'salaryMax ≥ salaryMin when both are set (range mode only) — compared within ONE currency; the two bounds can never be in different currencies.',
          'salaryCurrency is required in range mode and irrelevant in negotiable mode; a job that switches to "Thỏa thuận" keeps the stored currency rather than nulling it, so switching back does not lose the choice.',
          'experienceTo ≥ experienceFrom when both are set.',
          'deadline must be in the future on publish.',
          'Admin can post regardless of the company’s remaining posting quota (concierge override) — flagged in the audit log.',
        ],
        states: ['Empty new form', 'Editing existing', 'Validation errors', 'Draft', 'Scheduled', 'Open (published)', 'Closed (expired)'],
        backend: {
          dataModel: [
            { name: 'id', type: 'uuid' },
            { name: 'companyId', type: 'uuid', required: true, notes: 'from Company API' },
            { name: 'title / roleResponsibility / skillsQualifications', type: 'i18n jsonb', notes: '{ vi, en } per field' },
            { name: 'benefits', type: 'JobBenefit[]', notes: 'jobId · benefitTypeId · sortOrder · description { vi, en } · customTitle (only for the “Khác” type). A ROW PER BENEFIT, so it can be indexed and filtered.' },
            { name: 'status', type: 'enum', notes: 'draft · schedule · open · closed' },
            { name: 'scheduledAt', type: 'timestamp', notes: 'set when status = schedule; auto-publishes to open at this time' },
            { name: 'exposure', type: 'bool (on/off)', notes: 'independent of status; gates public visibility of an Open job' },
            { name: 'packageType', type: 'enum', notes: 'free · basic · basic_plus · distinction · top_job' },
            { name: 'contractType / jobType', type: 'enum', notes: 'full_time|freelancer / in_office|remote|hybrid|oversea' },
            { name: 'salaryType / salaryMin / salaryMax / salaryCurrency', type: 'enum(negotiable|range) / int / int / enum(VND|USD)' },
            { name: 'experienceFrom / experienceTo', type: 'int (years)' },
            { name: 'CompanyLocation', type: 'entity', notes: 'companyId · officeName (≤50, NULLABLE, unique per company when present) · cityId → Master data → Locations · officeAddress (≤120, nullable) · isActive. All three input fields are nullable — the unique index must therefore allow multiple NULL names. Lives on the COMPANY, so one edit fixes every live job when an office moves.' },
            { name: 'JobLocation', type: 'entity', notes: 'jobId · companyLocationId · sortOrder — max 3 per job, unique (jobId, companyLocationId). NOT `locations: jsonb`: a JSON city list has no id, so it cannot be corrected in one place or joined to a province facet.' },
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
      slug: 'create-job-companies',
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
      slug: 'job-list-admin',
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
          'The job TITLE is read-only for the employer 72 hours after the job went live (everything else stays freely editable). HQ Admin has NO time limit on any field — correcting a bad posting is the point of this screen — and every change is audited.',
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
      slug: 'job-list-companies',
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
              { name: 'salary range', type: 'range + currency', notes: 'GAP CLOSED 2026-08-13 — this facet had no currency, which silently broke it: jobs are posted in VND OR USD, so a bare "15 – 25" band either hides every USD job or, worse, compares raw numbers and surfaces a $3,000 job as if it were 3,000 ₫. Same rules as every other salary surface — a VND · USD switch that SCOPES rather than converts, ÷12 for annual, and "Thỏa thuận" jobs always included. Say what the scope hid: "8 jobs quote USD — switch to see them." Canonical rules: Resume management → CV data & matching architecture → "★ SALARY — the one contract"' },
              { name: 'level / experience / employmentType', type: 'multi-select' },
              { name: 'sort', type: 'enum', notes: 'Relevance · Newest · Salary. Salary sort is WITHIN one currency — cross-currency has no defined order without a rate; place the other currency after, never interleaved (see the SALARY CURRENCY block)' },
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
