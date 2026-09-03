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
        'THE DESCRIPTION IS RICH TEXT — bold, italic, bulleted and numbered lists. A benefit description is naturally a LIST (“15 ngày phép · nghỉ sinh nhật · company trip”); a plain textarea forces it into a run-on sentence, or into whatever dash the writer happens to type that day. Storing the list structure is what lets the jobseeker page render an actual list.',
        'WHATEVER THE EDITOR CAN EMIT, THE READER MUST RENDER. The jobseeker card and the company page both parse the same markup — the moment an editor can produce bullets and the reader prints a raw “•” or “**”, every description written as a list looks broken. Editor and renderer ship together, never one before the other.',
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
          ['Cap', '**none** — uncapped (2026-09-02)', '**10** per job'],
          ['Written by', 'the candidate', 'the employer (Admin or Company site)'],
          ['How they are added', 'autocomplete · role suggestions · AI extraction from an uploaded PDF', 'autocomplete only'],
          ['What they do', 'make the candidate findable', 'rank the candidate pool'],
        ],
      },
      items: [
        'NEVER `text[]` — a free-text job skill cannot join to a CV skill, and the failure is SILENT: matching returns nothing and reads as a ranking bug rather than a data bug. Autocomplete against the taxonomy is the only input path on the job form.',
        'ONLY THE JOB SIDE IS CAPPED, and the asymmetry is the point. A job’s list is a REQUIREMENT SET — it has to stay tight to mean anything, and 10 is already twice the 4–8 a real role differentiates on. A CV’s list is a DESCRIPTION of a person; capping it caps what someone may say about themselves, and an uploaded PDF can carry more than any number we pick. So the CV side is UNCAPPED (2026-09-02) and its abuse case is handled inside the score instead — see Resume management → SKILLS on the CV.',
        'YES, CAP BOTH SIDES — unlimited is wrong on both, but for OPPOSITE reasons, and that asymmetry is what sets the numbers. On the JOB side the cap USED to be mostly self-enforcing, because the old ratio meant more skills lowered everyone’s score. The score now counts matched skills and caps the count at 4, so padding a job neither deflates nor helps — past about 4 differentiating skills the extra entries change nobody’s score at all. That makes the cap of 10 pure input hygiene, and it kills the paid-slot idea outright: there is nothing left to sell, because the points stop at 4. On the CV side more skills is strictly BETTER — the candidate’s own list never enters the denominator, so a 50-skill CV weakly dominates a 10-skill one and the only thing standing between us and skill spam is the cap itself. The CV cap is the load-bearing one: job 10, CV 20.',
        'WHY 10 ON THE JOB SIDE — a real job has 4–8 genuinely differentiating requirements, so 10 is headroom rather than a squeeze, and it sits comfortably above the 4 the score actually reads. Deliberately generous: a cap that bites in normal use generates support tickets, and a cap that never bites in normal use only ever stops abuse.',
        'MEASURE BEFORE CHANGING THE NUMBER — track the distribution of skills-per-job, and skills-per-CV against the soft 25 threshold on the CV side. If a mass of jobs sit exactly AT 10 the cap has become a target and the honest fix is lowering it, not raising it.',
        'SKILL SLOTS ARE NOT SELLABLE, and after 2026-09-02 the reason is arithmetic rather than judgement. The skills component is **5 points per matched skill, capped at 20** — four matched skills is full marks. An employer who buys the right to list 25 skills instead of 10 gains NOTHING: no candidate can score above the cap, and the extra entries are the universal ones (Excel, Word, Teamwork) that almost everyone holds, so they lift the bottom of the shortlist toward the middle and make it sort worse. There is no version of this that is worth money to a customer, and selling it would be selling a downgrade.',
        'AND THE RANKING GETS NOISIER, not just lower. Skills past the first handful are the universal ones — Excel, Word, Teamwork, communication — which almost every candidate has. They lift the numerator by roughly the same amount for everybody, so they add no discrimination at all: pure noise bought at a premium. Beyond about 8 skills an employer is no longer describing a role, they are describing a team.',
        'WHAT WAS ADOPTED IS A **BOUNDED** COUNT, AND THE BOUND IS THE WHOLE POINT. A count with no ceiling would make more skills always better, let a job with 30 skills outrank every well-specified posting in every candidate’s feed, and make scores incomparable between postings — that version stays rejected. Capping the count at 8 keeps the honest incentive (describe the role properly, up to about 8) while removing the perverse one the ratio created (describe it as thinly as possible, so the denominator stays small). See Resume management → MATCH SCORE for the defect this fixed and the worked numbers.',
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
    {
      label: 'WHICH FIELDS THE KEYWORD MATCHES — ranked, not equal',
      text: 'The keyword is matched against FIVE fields, and their weights differ. The order below is the specification: a hit in a higher row outranks a hit in a lower one, so the same word found in a title beats the same word found in a paragraph.',
      table: {
        cols: ['#', 'Field', 'Why it sits there'],
        rows: [
          ['1', 'Job title (vi + en)', 'What the candidate is actually looking for. Typing “kế toán” must put the posting NAMED “Kế toán tổng hợp” at the top.'],
          ['2', 'Skills — JobSkill rows', 'Canonical names from Master data, which is what lets “nodejs” resolve to Node.js. NOT the free-text “Your skills & qualifications” block — that prose counts only at body weight.'],
          ['3', 'Job role / category label', 'Carries the broad queries: “IT”, “marketing”.'],
          ['4', 'Company display name', 'Typing “FPT” has to return FPT’s jobs.'],
          ['5', 'Prose body — description · requirements · benefit descriptions', 'LOWEST, deliberately. A long JD that repeats “kế toán” five times must never outrank a posting titled “Kế toán tổng hợp”; equal weighting turns search into a reward for writing at length instead of writing accurately.'],
        ],
      },
      warn: 'Nothing outside these five is keyword-matchable. Province, work type, contract type, level, experience, salary and tier are FILTERS — typing “Hà Nội” in the keyword box hits it through the title or body if those words appear, it does not switch on the province facet. See the next block for the fields that must never be indexed at all.',
    },
    {
      label: 'FILTER-ONLY and NEVER-INDEXED fields, and when a job leaves the index',
      text: 'The other two buckets. A field sits in exactly one of the three — listing everything in one flat “indexed fields” line is how province ids end up keyword-matchable, a mistake nothing on screen would reveal.',
      table: {
        cols: ['Bucket', 'Fields', 'Rule'],
        rows: [
          ['FILTER-ONLY (never touched by the keyword)', 'Province · work type · contract type · level · experience range · salary min/max + currency · posting tier · publishedAt / expiresAt / lastRefreshedAt', 'These are facets, not text. Narrowing by province is done by ticking the facet, never by typing the province name.'],
          ['NEVER INDEXED', 'Internal notes (HQ only) · contact person · application recipient emails · linked PO / product / entitlement · applicant data', 'A safety rule, not an optimisation. Internal notes can hold negotiation context, and a searchable recipient mailbox publishes an internal address to the whole internet.'],
        ],
      },
      items: [
        'ONE ANALYSER FOR THE WHOLE PLATFORM — the one already decided for skill typeahead: lower-casing → ASCII folding (“ke toan” finds Kế toán) → punctuation stripping (“nodejs” finds Node.js), ranked exact → prefix → contains. Never a second analyser for search, or “ke toan” works in one box and fails in the other.',
        'BILINGUAL BY DEFAULT: a query matches title.vi OR title.en. The candidate is never asked to pick a language first.',
        'MULTI-WORD QUERIES AND their terms by default, relaxing to OR only when the result set is empty — and the relaxation is disclosed, like every other one.',
        'SKILLS MEANS JobSkill ROWS, not the free-text “Your skills & qualifications” block. That prose counts only at body weight; the canonical rows are what make “nodejs” resolve to Node.js.',
        'A JOB LEAVES THE INDEX SYNCHRONOUSLY when it closes, expires, or has Exposure turned Off — not on a nightly sweep. This mirrors the rule already decided for CVs (“Hidden takes effect on the search index synchronously”); the same reasoning applies in the other direction, and the expensive failure is a candidate applying to a posting that is already closed.',
        'RECOMMENDATION — a dedicated search index (Meilisearch / Typesense) for Phase-1, and the reason is not speed. Two requirements are already decided elsewhere and both are awkward in SQL: Vietnamese ASCII folding with typo tolerance, and FACET COUNTS shown live beside each filter. Postgres can fold with `unaccent` + GIN, but multi-dimension facet counts is where it gets expensive and fiddly. If the client prefers to stay on SQL in Phase-1 the cost is concrete and must be stated up front: drop the counts next to the facets.',
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
    /* The company console's landing page. It lives in THIS module because the
       module owns the employer's other primary screens (Post job, My jobs) and
       Home's largest strip and primary CTA are jobs — but it READS from five
       modules, and the alert table below names the owner of every row. */
    {
      name: 'Home dashboard (company site)',
      site: 'Companies',
      slug: 'home-dashboard-companies',
      scope: ['BE', 'FE', 'UI'],
      notes:
        'The landing screen after an employer logs in. A READ-ONLY aggregate — it owns no data of its own and every panel links into the module that does.',
      mockup: 'co-dashboard',
      ready: true,
      detail: {
        description:
          'Where an employer lands after signing in. It answers three questions in one screen, in priority order: what is BLOCKING or expiring, who is WAITING on me, and what did we buy / how much is left. The layout follows Saramin Korea’s employer home (hiring.saramin.co.kr/home) — a wide work column beside a narrow account rail — because that split keeps daily recruiting work from competing for space with billing and settings.\n\nIt is deliberately an aggregate and nothing else. Every number is derived from a record another module owns: job status and deadline, application stage and waiting days, saved searches, pooled quota, company-page completeness, the CRM sales owner. Home has no entity, no status of its own, and no action that cannot also be done on the screen that owns it.',
        userStory:
          'As an HR user, I want to see what is blocking me and who is waiting on me the moment I log in, so that I do not have to open four screens to find out whether anything needs me today.',
        keyPoints: [
          {
            vi: 'Home CHỈ ĐỌC. Mọi con số đều được suy ra từ module khác — không tạo thực thể, không có trạng thái riêng, không có hành động nào mà màn hình gốc không có.',
            en: 'Home is READ-ONLY. Every number is derived from another module — it creates no entity, holds no status of its own, and offers no action the owning screen does not.',
          },
          {
            vi: 'Tab "Chưa xem" dùng STAGE = New của pipeline, KHÔNG thêm cờ đã đọc/chưa đọc. Một cờ riêng cho Home sẽ tạo nguồn sự thật thứ hai cho "đã có ai xem ứng viên này chưa".',
            en: 'The “Not reviewed” tab is pipeline STAGE = New — no read/unread flag is added. A flag owned by Home would be a second source of truth for “has anyone looked at this candidate”.',
          },
          {
            vi: 'Dải cảnh báo chỉ hiện khi CÓ việc cần xử lý. Không có dòng "mọi thứ ổn" — một dải luôn hiện là một dải mắt học cách bỏ qua.',
            en: 'The alert strip renders only when something needs action. There is no “all clear” row — a strip that is always there is one the eye learns to skip.',
          },
          {
            vi: 'Không sao chép cột quảng cáo và 쿠폰/포인트 của Saramin KR: Phase 1 không bán gì ở đó và mô hình sản phẩm VN không có coupon/point.',
            en: 'Saramin KR’s ad rail and coupon/point counters are NOT copied: Phase 1 sells nothing there, and the VN product model has no coupon or point currency.',
          },
        ],
        requirements: [
          {
            label: 'The alert strip — the only part that can cost money or a hire',
            text: 'Pinned above everything. Each row is a condition that is blocking something or running out of time, plus the one action that clears it. Rows are ordered blocking-first, then by deadline. Everything here is owned elsewhere; Home only surfaces it.',
            table: {
              cols: ['Condition', 'Shows when', 'Action → goes to', 'Owned by'],
              rows: [
                ['Company page not Published', 'Account holds Job Posting AND page status ≠ Published', 'Publish page → Company page', 'Account management → Company detail'],
                ['Product paid but not activated', 'An entitlement exists with no activation date and an activationDeadline in the future', 'Activate → Products & quota', 'Products & packages'],
                ['Job closing soon', 'An Open job’s deadline is ≤7 days away AND it has unreviewed candidates', 'Review → Applicants', 'Job management'],
                ['Quota low / exhausted', 'Remaining posting slots or CV unlocks ≤20% of the pack, or 0', 'Buy more → Products & quota', 'Account management → Products & quota'],
                ['Order awaiting payment', 'An order exists in Pending payment', 'View order → Orders & invoices', 'CRM → Payments'],
              ],
            },
            warn: 'No “all clear” row, and no alert that Home alone can resolve. If a condition cannot be cleared on the screen the action links to, it does not belong in this strip.',
          },
          {
            label: 'The two states Home must be designed for',
            text: 'A first-run account and an account in flight are genuinely different screens, and the first-run one is what most new customers see for their first week. Both are specified; neither is an afterthought empty state.',
            table: {
              cols: ['State', 'When', 'What Home shows'],
              rows: [
                ['First run', 'Activated, nothing posted, no search saved', 'Alerts: publish page + activate package. Both strips show a tinted panel naming the gap and its one CTA. To-do is empty with “Post a job”. Rail shows products held but not started, with no quota bar yet.'],
                ['In flight', 'At least one job Open or Scheduled', 'Strips list jobs and saved searches with their live counts; to-do carries the stage queues; rail shows quota bars.'],
                ['Resume Search not owned', 'Account holds Job Posting only', 'The Saved searches strip is replaced by the product offer — the rail already lists the unowned product with a Buy path; the strip must not show an empty panel for something the account cannot use.'],
              ],
            },
          },
        ],
        uiFields: [
          {
            group: 'Alert strip (conditional — see the rule block)',
            items: [
              { name: 'alerts[]', type: 'derived', notes: 'each = { severity: warn | info, message, actionLabel, target screen }. Empty array → the strip does not render at all' },
            ],
          },
          {
            group: 'Jobs in progress (KR 진행중 공고)',
            items: [
              { name: 'count', type: 'derived', notes: 'Open + Scheduled. Draft and Closed are NOT “in progress” and are not counted' },
              { name: 'card', type: 'composite', notes: 'title · status chip (Open / Scheduled) · deadline or go-live date · candidate count. Click → Applicants for that job' },
              { name: 'empty state', type: 'panel', notes: 'first-run only: “Post a job and start collecting candidates · it goes live immediately” + Post a job' },
            ],
          },
          {
            group: 'Saved searches (KR 진행중 인재풀)',
            items: [
              { name: 'count', type: 'derived', notes: 'saved searches on the account — see Resume management → “Save this search”' },
              { name: 'card', type: 'composite', notes: 'search name · last-run date · NEW CVs matching since that run. Click → Resume search with the search loaded' },
              { name: 'gating', type: 'rule', notes: 'the whole strip is hidden unless the account is entitled to Resume Search' },
            ],
          },
          {
            group: 'My to-do (KR 내 할일)',
            items: [
              { name: 'tabs', type: 'stage counts', required: true, notes: 'Not reviewed (stage = New) · Screening · Interview · Offer. The counts ARE the pipeline stage counts — no separate computation' },
              { name: 'row', type: 'composite', notes: 'photo · name · job applied to · match % (with its two contributing signals on hover — never a bare number) · days waiting' },
              { name: 'sort', type: 'rule', required: true, notes: 'longest waiting first — the queue exists to surface who has been ignored, so recency sorting would defeat it' },
              { name: 'scope', type: 'rule', notes: 'across ALL of the account’s jobs, not one posting; recalled and withdrawn applications never appear' },
            ],
          },
          {
            group: 'Account rail — company card',
            items: [
              { name: 'identity', type: 'composite', notes: 'logo · company display name · signed-in user with their role badge' },
              { name: 'company page status', type: 'enum', notes: 'Draft · Published · Unpublished — the same status the Company page screen owns' },
              { name: 'completeness', type: 'derived %', notes: 'the same figure the Company page screen shows; the CTA names the highest-value missing block rather than saying “edit”' },
            ],
          },
          {
            group: 'Account rail — products in use (KR 이용중인 상품)',
            items: [
              { name: 'held product', type: 'row', notes: 'name · remaining / total · progress bar · unit + valid-until · “Use →” into the screen that spends it' },
              { name: 'unheld product', type: 'row', notes: 'listed with “—” and a Buy button — KR’s pattern: the rail doubles as the store front' },
              { name: 'low-quota tone', type: 'rule', notes: '≤20% remaining turns the figure and bar amber; this is the same threshold that raises the quota alert' },
            ],
          },
          {
            group: 'Account rail — account manager (KR 고객센터)',
            items: [
              { name: 'salesOwner', type: 'ref → CRM user', notes: 'the company record’s sales owner — a named person, not a generic hotline' },
              { name: 'contact', type: 'composite', notes: 'phone · email · working hours, plus a Help centre link' },
              { name: 'fallback', type: 'rule', notes: 'no sales owner assigned (self-serve signup not yet placed) → the general support block is shown instead' },
            ],
          },
        ],
        behaviors: [
          'Home loads as ONE aggregate request; no panel fetches on its own, so the page never renders half-populated.',
          'Every panel is a link into the owning screen. Nothing on Home mutates a record — the alert actions navigate, they do not resolve the condition in place.',
          'A panel whose product is not entitled is hidden entirely, not shown empty: an employer without Resume Search never sees a Saved searches box.',
          'To-do counts and the Applicants screen read the same stage data, so they cannot disagree.',
          'The alert strip is absent — not empty — when nothing needs action.',
        ],
        rules: [
          'Home owns no entity and no status. Any field a panel needs belongs to the module that owns the record.',
          'The “Not reviewed” queue is stage = New. No read/unread flag is introduced for this screen.',
          'Counts are scoped to the ACCOUNT, not to the signed-in user — quota is pooled and the pipeline is shared, so a personal view would misreport the team’s work.',
          'Role permissions apply: a user without “View applications” sees no to-do queue, and one without Resume Search permissions sees no saved searches — the dashboard never leaks what the role cannot open.',
          'A match % is never shown as a bare number; it carries its contributing signals, the same rule as Applicants and the jobseeker side.',
        ],
        states: [
          'First run — activated, nothing posted, page still Draft, package not activated',
          'In flight — jobs Open, candidates waiting, quota burning down',
          'Job Posting only — Saved searches strip hidden, product offered on the rail',
          'Quota exhausted — alert raised, the related CTA points at Buy rather than at the blocked action',
          'No sales owner assigned — account-manager card falls back to general support',
          'Loading / aggregate request failed — the page shows a single retry, never a grid of empty boxes',
        ],
        backend: {
          endpoints: [
            'GET /company/dashboard → { alerts[], jobsInProgress[], savedSearches[], todo{ byStage }, account{ page, entitlements[], salesOwner } }',
          ],
          integrations: [
            'Job management (status, deadline, applicant counts)',
            'Application management (stage counts, waiting days, match)',
            'Resume management (saved searches + new-match counts)',
            'Products & packages (entitlements, quota, activation deadline)',
            'Account management (company page status + completeness, roles)',
            'CRM (sales owner, pending-payment orders)',
          ],
          notes:
            'One read-only projection assembled server-side. It is a VIEW: no dashboard table, no cached counters that can drift from the records they summarise. Permission filtering happens in this endpoint, so the client never receives a panel the role may not see.',
        },
        acceptance: [
          'A first-run account sees exactly two alerts (publish page, activate package) and both strips render their CTA panel, not an empty table.',
          'Publishing the company page removes its alert on the next load without any other change.',
          'The “Not reviewed” count equals the number of New-stage applications across the account’s jobs, and matches the Applicants screen exactly.',
          'The to-do list is ordered longest-waiting first.',
          'An account without Resume Search sees no Saved searches strip, and sees Resume Search on the rail with a Buy button.',
          'A user whose role lacks “View applications” loads Home without a to-do queue and without an application count anywhere on it.',
          'Quota at or below 20% shows amber on the rail and raises exactly one quota alert.',
          'No action on Home changes a record; each one navigates to the screen that owns it.',
        ],
        openQuestions: [
          'Does “new CVs since last run” on a saved search require storing lastRunAt per search, or is it computed from the search’s created date until the first run? (Recommendation: store lastRunAt — otherwise the count is wrong for every search after the first visit.)',
          'Should the job “closing soon” alert fire on deadline alone, or only when unreviewed candidates exist? Specified as the latter, so a fully-processed job closing quietly raises nothing.',
          'Is the account manager’s direct phone shown to the customer, or only an email + the general hotline? Needs a sales decision before the field is exposed.',
          'Should Home offer a “what changed since your last visit” marker, and if so does that need a per-user lastSeenAt — the one piece of state Home would have to own?',
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
          'Boosted jobs get limited priority but stay clearly relevant — implemented as TIER BANDING inside the “Mới cập nhật” sort only: the pool is filtered by a relevance floor first, then Top Job → Distinction → Basic Plus → Basic → Free. A tier can reorder a relevant job but can never pull an irrelevant one into the pool, and on every other sort the bands do not exist.',
          'Ranking is QUERY-ONLY: relevance → pool → band, then a deterministic tie-break. The candidate’s CV, preferences and match score are NOT read here — the same query returns the same results logged in or out.',
          'The SORT chooses whether the bands apply: “Mới cập nhật” bands, Relevance / Mới nhất / Salary do not. Switching sort re-orders the same jobs and never changes which jobs are returned.',
          'Choosing Relevance, Mới nhất or Salary drops the tier banding entirely; only the tie-break remains, and Mới nhất sorts on publishedAt so auto-refresh cannot reorder it.',
        ],
        rules: [
          'Only active, non-expired jobs.',
          'Salary sort treats "Thỏa thuận" as unranked / last.',
          'Gate = Open + Exposure On + not past deadline + moderation approved. No domain field (salary, industry, experience) may ever act as a gate — see “JOB SEARCH — gate → filter → pool → band” below.',
          'Facet semantics are OR within a facet, AND across facets — stated because it is the commonest cause of an unexplained empty result set.',
          'The match score never participates in search ranking, in any form. It belongs to the recommendations feed only.',
          'No randomness in the ordering — pagination must be stable across page loads.',
        ],
        requirements: [
          {
            label: 'JOB SEARCH — gate → filter → pool → band, and relevance is ONLY what the candidate typed',
            text: 'DECIDED: job search ranks on QUERY RELEVANCE alone. It does NOT read the candidate’s CV, preferences or match score. Search answers “how well does this job match what I typed”; the match score answers “how well does this job fit me”, and that second question belongs to the recommendations feed, not here. The consequence is a property worth having: the same query returns the SAME results for everyone, logged in or out — so a result URL is shareable, cacheable and debuggable, and “why am I seeing this?” is always answerable from the query.\n\nThe seven stages run in order. Stages 1–3 decide RELEVANCE and money touches none of them. Stages 5–6 — the paid bands — run on the “Mới cập nhật” sort and on NO other, so money owns exactly one clearly-labelled sort and every other sort stays honest.',
            table: {
              cols: ['Stage', 'What it does', 'Rule'],
              rows: [
                ['1 · GATE', 'Decides what is eligible at all — binary', 'status = Open · exposure = On · not past deadline · moderation approved. The same jobseeker-direction gate the match score uses. NEVER gate on a domain field (salary, industry, experience): every one of those can empty the result set and none can explain why.'],
                ['2 · FILTER', 'The facets the candidate ticked — binary', 'OR within one facet, AND across facets. Location (province, multi) · category/role · level · work type · contract type · benefits · salary band. The keyword is NOT a filter — it is the input to stage 3.'],
                ['3 · SCORE', 'Field-weighted keyword relevance', 'title → skills → role/category → company name → prose body, body last. No profile, no match score, no tier — this stage answers only “how well does this job match the words typed”.'],
                ['4 · POOL', 'Takes the boost window — only when a keyword was typed', 'Keep every job at or above the relevance FLOOR, best relevance first, capped at the pool size (default 80). With no keyword there is no relevance to pool by, so the pool is simply everything that passed stages 1–2. This pool is the ONLY place a paid tier may reorder anything.'],
                ['5 · BAND', '⚠️ “Mới cập nhật” SORT ONLY — groups the pool by posting tier', 'Top Job → Distinction → Basic Plus → Basic → Free. Every Top Job in the pool outranks every Distinction, and so on down. Bands are contiguous slots, not a nudge. This stage does NOT run on any other sort — see “WHICH SORT THE BANDS APPLY TO” below.'],
                ['6 · ORDER', 'Orders WITHIN each band', 'lastRefreshedAt ↓ → publishedAt ↓ → jobId. This is the “Mới cập nhật” ordering, applied inside the band: auto-refresh moves a job up among its own tier and can never move it out of that tier.'],
                ['7 · TAIL', 'Everything past the pool', 'Jobs beyond the pool size continue unbanded — by relevance if a keyword was typed, otherwise by lastRefreshedAt. Money reaches the first 80 results and nothing after them.'],
              ],
            },
            items: [
              'RELEVANCE IS FIELD-WEIGHTED, and the ranked field list lives in exactly one place — “WHICH FIELDS THE KEYWORD MATCHES — ranked, not equal”, on the Job management module page. Summary: title → skills → role/category → company name → prose body, body last. Kept in one place deliberately: a field list restated in two requirements is a field list that will disagree with itself.',
              'ONE TEXT ANALYSER FOR THE WHOLE PLATFORM — reuse the one already decided for skill typeahead: lower-casing, ASCII FOLDING (“ke toan” finds Kế toán), punctuation stripping (“nodejs” finds Node.js), ranked exact → prefix → contains, with fuzzy (edit distance ≤ 1–2) on the typeahead. Do not define a second analyser for search; two analysers means “ke toan” works in one box and not the other.',
              'DE-DUPLICATE BY COMPANY, AND DO IT BEFORE STAGE 5. One employer posting five near-identical titles must collapse to one card plus “3 vị trí tương tự tại X”. This matters far more under banding than it did under a multiplier: one company holding five Top Job slots would otherwise own the entire top band, and the whole first page with it.',
              'THE BANDS BELONG TO ONE SORT AND ONE ONLY. Relevance, “Mới nhất” and Salary all drop stages 5–6 entirely — no tier, no bands, just the honest ordering the control names. Money owning one clearly-labelled sort is defensible; money quietly touching all four is not.\n\nAND “MỚI NHẤT” SORTS ON `publishedAt`, NEVER `lastRefreshedAt` — otherwise auto-refresh silently reorders it and the honest sort is not honest. The refresh-ordered view is the separately named “Mới cập nhật”, which is the one sort that carries the bands.',
              'SALARY FILTER + SORT follow the already-decided currency contract — the currency SCOPES rather than converts, ÷12 for an annual figure, “Thỏa thuận” jobs are ALWAYS included, sorting is within one currency with the other placed after rather than interleaved, and the UI says what the scope hid (“8 jobs quote USD — switch to see them”).',
              'ZERO RESULTS RELAX IN A FIXED ORDER, and always disclose it: salary → experience → contract type → province (widen to region) → keyword AND→OR. Show what was relaxed (“Không có việc nào ở Đà Nẵng — đang hiện cả miền Trung”), or the candidate believes a filter is still in force when it is not.',
              'NO RANDOMNESS ANYWHERE. The stage-6 tie-break ends in `jobId`, so the order is total and pagination is stable across page loads.',
            ],
            warn: 'The match score must NEVER enter job search — not as a signal, not as a tie-break, and above all not as a gate. A candidate searching “kế toán” gets accounting jobs even if their CV is all backend engineering. The match score keeps exactly one home: Resume management → Recommended jobs — matched to a jobseeker’s profile.',
          },
          {
            label: 'WHICH SORT THE BANDS APPLY TO — “Mới cập nhật”, and nothing else',
            text: 'The tier bands are a property of ONE sort, not of the result set. The band order Top Job → Distinction → Basic Plus → Basic → Free exists only while the list is sorted by “Mới cập nhật” (last updated). Every other sort returns the same jobs with no tier grouping at all.\n\nThis is what makes the paid product defensible: the sort that money reorders is the sort whose NAME makes no relevance promise. “Mới cập nhật” claims to be ordered by refresh time, and the tier is what buys refresh — so the ordering matches its own label.',
            table: {
              cols: ['Sort', 'Bands apply?', 'Ordered by', 'What the label promises'],
              rows: [
                ['**Mới cập nhật** (last updated)', '✅ YES — the only one', 'band, then `lastRefreshedAt` ↓ inside the band', 'Refresh recency — and the tier is what buys refresh, so the promise holds.'],
                ['Relevance', '❌ no', '`relevance` ↓ alone, then the tie-break', 'Best textual match. A tier must not touch it.'],
                ['Mới nhất (newest)', '❌ no', '`publishedAt` ↓ alone', 'When it was POSTED. Never `lastRefreshedAt`.'],
                ['Salary', '❌ no', 'salary within one currency, then the tie-break', 'Pay order. “Thỏa thuận” ranks last.'],
              ],
            },
            items: [
              'THE SAME 80 JOBS, TWO ORDERS. Switching between “Mới cập nhật” and Relevance must never change WHICH jobs are returned — only their order. The gate, the facets and the relevance floor are identical either way; stages 5–6 are the whole difference. That makes the pair directly testable: same result count, same job ids, different sequence.',
              'THE DEFAULT SORT DECIDES WHETHER THE PAID PRODUCT IS VISIBLE AT ALL, so it is a commercial decision and not a technical one. ⚠️ ASSUMED: “Mới cập nhật” is the default, matching the VN market norm — TopCV and VietnamWorks both load a refresh-ordered list rather than a pure relevance list. Needs the client’s explicit confirmation, because choosing Relevance as the default means a Top Job buyer gets no placement on a keyword search unless the candidate changes the sort themselves.',
              'THE SORT MUST BE IN THE URL like every other filter, and it must SURVIVE pagination. A candidate on page 3 of “Mới cập nhật” who is silently moved to relevance order between pages sees jobs repeat and jobs vanish.',
              'WITH NO KEYWORD there is no relevance signal, so Relevance is not offered — the control is hidden or disabled rather than shown sorting by nothing. “Mới cập nhật” is the sensible default for a bare browse, and the bands still apply there.',
            ],
          },
          {
            label: 'THE PAID BANDS — tier buys the band, auto-refresh buys the place inside it',
            text: 'DECIDED (2026-09-03): paid priority is TIER BANDING inside the “Mới cập nhật” sort — not a relevance multiplier applied to everything. Within that sort the tiers occupy contiguous slots in price order, and the job’s auto-refresh only decides where it sits among its own tier.\n\nThis REPLACES the earlier multiplicative boost (Top Job ×1.5 · Distinction ×1.3 · Basic Plus ×1.15). Banding is the stronger instrument where it applies — under the multiplier a strong Distinction match could outrank a weak Top Job, and under banding it never can — but it now applies to ONE sort instead of leaking into all four.',
            table: {
              cols: ['Band', 'Tier', 'Price (SME)', 'Auto-refresh cadence'],
              rows: [
                ['1 — top slots', 'Top Job', '13,800,000 ₫', '⚠️ NOT SPECIFIED — see the gap below'],
                ['2', 'Distinction', '12,000,000 ₫', '⚠️ NOT SPECIFIED'],
                ['3', 'Basic Plus', '6,100,000 ₫', 'every 10 days'],
                ['4', 'Basic', '2,710,000 ₫', 'every 15 days'],
                ['5 — last', 'Free', '—', 'never refreshed'],
              ],
            },
            items: [
              'THE RELEVANCE FLOOR IS MANDATORY, NOT A TUNING NICETY. Banding gives up the safety the multiplier had for free — “0 × 1.5 = 0” meant an irrelevant job could never be resurrected. With contiguous bands, the floor at stage 4 is the ONLY thing standing between the ranking and an employer who buys Top Job on a warehouse posting to own position 1 for “sales”. Ship the floor with the banding or ship neither.',
              'NEVER PAD THE POOL. The pool size is a CAP, never a quota: if only 12 jobs clear the floor for a query, the pool is 12. Padding to 80 with weak matches converts the floor into decoration.',
              'WHAT THIS FIXES — a free job can no longer reach position 1. Under refresh-ordered ranking a brand-new free post was, for a few minutes, the freshest record in the index and therefore sat above every 13,800,000 ₫ Top Job. Bands close that hole by construction: a Free job is structurally locked in band 5 and cannot leave it.',
              'AUTO-REFRESH BECOMES A WITHIN-BAND LEVER, which is a far cleaner thing to sell. Before, cadence decided whether you were on top and only briefly — a sawtooth that handed the top slot to whoever refreshed last. Now the tier guarantees the band and refresh decides your position inside it, so “what did my 13.8 million buy?” has a straight answer: the top band, permanently, for the life of the posting.',
              'DISCLOSE PAID POSITION. Banding lets money outrank relevance inside the pool, so the paid slots must be visibly marked — “Tin ưu tiên”, or the existing HOT label add-on. Candidates accept paid placement they can see and stop trusting a ranking that hides it; an undisclosed paid band is also the version most likely to attract a consumer-protection complaint.',
              'POOL SIZE, FLOOR AND BAND ORDER ARE CONFIG, NOT CODE. All three belong in Matching settings (a System resource) so the ranking can be tuned against real queries without a release. The band ORDER especially: it is a commercial decision and it will be revisited.',
              'OPTIONAL — RESERVE 1–2 PAGE-1 SLOTS for the highest-relevance unpaid job. Cheap insurance against the failure mode where page 1 is entirely bought: it keeps the result set credible to candidates, and stops a perfect free match landing on page 3. Recommended, but it is the client’s call.',
              '⚠️ GAP TO CLOSE FIRST: the two most expensive tiers have NO defined refresh cadence. Only Basic (15 days) and Basic Plus (10 days) exist, and both are documented inside CRM quotation examples rather than on the tier product — even though Products & Packages states the tier product IS where cadence lives. Distinction (12,000,000 ₫) and Top Job (13,800,000 ₫) need cadences defined on the tier before stage 6 can be implemented.',
            ],
            warn: 'INSIDE “MỚI CẬP NHẬT”, BANDING LETS MONEY OUTRANK RELEVANCE. That is the deliberate trade, and it is held in check by exactly two things: the SORT SCOPE and the relevance FLOOR at stage 4. Neither is optional and neither may be quietly widened. Let the bands leak into the Relevance sort and the product silently becomes “paid jobs first, relevance second” — a different product, sold under the old name.',
          },
          {
            label: 'Worked example — the query “sales”, 80 pooled',
            text: 'A candidate searches **sales** with the sort left on **“Mới cập nhật”** — the one sort that bands. 1,240 jobs pass the gate and facets; 312 clear the relevance floor; the pool takes the best **80**. Those 80 are then banded. A realistic tier mix — Top Job costs 13,800,000 ₫, so there are very few of them:',
            table: {
              cols: ['Band', 'Tier', 'Jobs in pool', 'Positions', 'Lands on'],
              rows: [
                ['1', 'Top Job', '3', '1–3', 'page 1'],
                ['2', 'Distinction', '5', '4–8', 'page 1'],
                ['3', 'Basic Plus', '12', '9–20', 'page 1'],
                ['4', 'Basic', '30', '21–50', 'pages 2–3'],
                ['5', 'Free', '30', '51–80', 'pages 3–4'],
                ['tail', 'any tier', '232', '81+', 'pages 5+, PURE relevance order'],
              ],
            },
            items: [
              'PAGE 1 IS A CLEAN PAID GRADIENT — 3 Top Job, 5 Distinction, 12 Basic Plus — which is the commercial intent. It works out this way because the expensive tiers are rare, not because anything reserves the shape; no quota per band is needed or wanted.',
              'INSIDE BAND 3 the 12 Basic Plus jobs are ordered by `lastRefreshedAt` — this is the “Mới cập nhật” sort, so the most recently refreshed Basic Plus job leads its band. Refresh is the ordering WITHIN a band, never a way into a higher one.',
              'SWITCH THE SORT TO RELEVANCE and this entire table collapses: the same 80 jobs re-order by relevance alone, the “Tin ưu tiên” badges remain but the grouping disappears. Same query, same 80 jobs, different sequence — which is exactly the difference QA should be testing for.',
              'A PERFECT-MATCH FREE JOB LANDS AT POSITION 51 even if it is the single best textual match for “sales”. This is the cost of banding, stated plainly so nobody is surprised by it in UAT — and it is the reason the optional reserved page-1 slot is worth considering.',
              'JOB 81 ONWARDS IS UNTOUCHED BY MONEY. The 232 tail jobs are ordered by relevance alone, so a candidate who pages deep gets a progressively more honest list — and the paid inventory has a hard, countable ceiling of 80 positions per query.',
            ],
          },
        ],
        states: ['Loading', 'No results (suggest broadening)', 'Has results', 'Error / retry'],
        backend: {
          endpoints: ['GET /jobs/search?q=&filters…&sort=&page='],
          integrations: ['Search index (facets, relevance)', 'Scraps (saved jobs)'],
          notes: 'Consider a search index (e.g. Meilisearch/ES) vs SQL for facets + relevance — decision needed.',
        },
        acceptance: ['Filters + sort + pagination work and are URL-encoded; only active jobs appear.'],
        openQuestions: [
          'CLOSED — relevance ranking IS in scope, and it is the ONLY ranking input: query relevance, then tier banding inside the pool on the “Mới cập nhật” sort, with no profile matching. See “JOB SEARCH — gate → filter → pool → band” above.',
          'WHICH SORT LOADS FIRST — needs the client’s answer, and it is the single highest-value open question on this screen. The bands exist only in “Mới cập nhật”, so the default sort decides whether a Top Job buyer gets placement on a keyword search at all. Assumed “Mới cập nhật” (the TopCV / VietnamWorks norm); if the client wants Relevance as the default, say so now because it materially changes what the posting tiers are worth.',
          'SQL vs dedicated search engine — recommendation on the table (dedicated index, for VN ASCII folding + live facet counts); still needs the client’s sign-off, and the SQL fallback costs the facet counts. See “FILTER-ONLY and NEVER-INDEXED fields” on the module page.',
          'THE RELEVANCE FLOOR — now load-bearing, not a nicety. Under tier banding the floor is the only guardrail preventing a paid tier from taking position 1 on a query it barely matches, so it needs a real number tuned against real queries before launch, not a guess. Same for the POOL SIZE (80 is a starting proposal).',
          'AUTO-REFRESH CADENCE for Distinction and Top Job is undefined — see “THE PAID BANDS”. Stage 6 cannot be implemented until the client sets both, and they belong on the tier product in Products & Packages.',
          'RESERVED PAGE-1 SLOT for the best unpaid match — recommended as insurance against an entirely bought first page, but it is a commercial decision the client owns.',
        ],
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
