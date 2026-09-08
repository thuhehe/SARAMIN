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
      label: 'A SALARY BAND MAY BE ONE-SIDED — “Từ 15 triệu” is a legal posting',
      text: 'CANONICAL RULES live in Resume management → CV data & matching architecture → “★ SALARY — the one contract”, which now carries the shapes, the display strings, the validation and the sort rule. Repeated here only as the JOB-FORM behaviour, because the form is where the rule is enforced.',
      table: {
        cols: ['What the employer enters', 'Stored', 'Form behaviour'],
        rows: [
          ['Both bounds', 'salaryMin + salaryMax', 'Normal case. `max ≥ min` checked on save, within one currency.'],
          ['Minimum only', 'salaryMin, salaryMax NULL', 'Accepted. The To field carries a hint saying a blank To means “Từ …”.'],
          ['Maximum only', 'salaryMax, salaryMin NULL', 'Accepted. The From field says a blank From means “Lên đến …”.'],
          ['Neither', '— rejected on save', 'An empty band IS “Thỏa thuận”: the form makes the employer switch salaryType rather than saving an infinite band.'],
        ],
      },
      items: [
        'THE READ SIDE NEEDS NO NEW BRANCH — the canonical comparison is already `band.from ≤ figure ≤ band.to` with an unset from meaning 0 and an unset to meaning +∞, so the job-search salary filter and the match score are unchanged.',
        'THE FORM MUST SHOW THE OPTIONALITY, not just permit it. Two empty number boxes under a required label read as “both required”; the hint on each bound is what turns a rule nobody can see into one an employer can use.',
      ],
      warn: 'Do NOT restate the display strings or the sort rule here. They are specified once in the canonical contract — a salary rule written in two modules is exactly the scatter that block was created to end, and it is how the candidate form once came to take one number while its own requirement said “range”.',
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
    /* ONE requirement for both surfaces. HQ and the employer write the SAME Job
       entity through the same form: identical fields, identical publish rules, no
       approval gate on either side. What differs is scope (whose company) and
       quota (who pays), and that fits in one table — where it stays honest. Two
       requirements for one form is how the field list drifts apart. */
    {
      name: 'Create job',
      site: 'AdminCompanies',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      notes: "Company user can't post job today (draft only); SVN wants company users to post by themselves.",
      mockup: 'admin-job-create',
      mockups: ['co-create-job'],
      detail: {
        description:
          'The job create / edit form, written by BOTH HQ and the employer against the same Job entity. HQ staff can post on behalf of any company (data-entry / concierge posting); a company HR user posts for their own company — the key new capability against today, where a company can only save a draft. Publishing goes straight to Open (or Schedule) on both surfaces: there is no approval gate anywhere.',
        userStory:
          'As an HQ operator I want to create or edit a job for any company so that we can onboard postings on behalf of clients and fix bad data — and as a company HR user I want to post my own job and see it go live immediately, so that I do not have to wait for HQ.',
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
              { name: 'salaryType', type: 'radio', required: true, notes: 'Negotiable ("Thỏa thuận") OR a band. A JOB states a BAND — the candidate side states ONE figure, and the two are compared point-in-range. Canonical rules: Resume management → CV data & matching architecture → "★ SALARY — the one contract"' },
              { name: 'salaryMin / salaryMax', type: 'number', notes: 'In band mode each bound is INDIVIDUALLY OPTIONAL — but at least ONE must be given. Three legal shapes: both (15–25tr) · min only (“Từ 15 triệu”) · max only (“Lên đến 25 triệu”). The unit is whatever salaryCurrency says. See “A SALARY BAND MAY BE ONE-SIDED”' },
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
          {
            // Everything above is identical on both surfaces. These three exist on
            // the Company site only, because they are about the employer's own
            // wallet — HQ posts against the company's PO, never against a balance.
            group: 'Company site only',
            items: [
              { name: 'remaining quota', type: 'read-only count', required: true, notes: 'posting slots left for the tier being chosen, shown next to the picker. At zero the publish is blocked with a deep link to buy a package — never a silent failure, and never a publish that quietly goes over.' },
              { name: 'featuredUpgrade', type: 'enum', notes: 'optional main-ad / rank boost bought at posting time (from Products & Packages)' },
              { name: '(company · purchaseOrder)', type: '—', notes: 'NOT shown. The company is fixed to the signed-in user’s own, and the employer never picks a PO — the tier they can afford is derived from what they hold.' },
            ],
          },
        ],
        behaviors: [
          {
            group: 'Both surfaces',
            items: [
              'Save as draft at any time; validation only runs on publish.',
              'Publish offers "Post now" (→ Open immediately) or "Schedule for later…" (→ Schedule, pick a date/time). A Scheduled job auto-publishes to Open at that time.',
              'An Open job auto-moves to Closed when its deadline passes.',
              'Exposure (On / Off) is independent of status: an Open job with Exposure Off stays hidden from jobseekers without changing its status. Only Open + Exposure On is publicly visible & applyable.',
              'Bilingual fields are entered per language via a VI / EN tab; VI is required, EN optional in Phase-1.',
              'Editing an Open job keeps it Open; a full audit entry is written (who / when / what).',
              'The employer may keep editing an Open job freely, with ONE exception: the job title locks 72 hours after the job went live (counted in hours from `publishedAt`, not calendar days). HQ Admin has no such limit. The form shows the remaining window, then the locked reason — see “Editing an OPEN job is free — EXCEPT the job title after 72 hours (employer only)”.',
            ],
          },
          {
            group: 'Company site only',
            items: [
              'Company is auto-set to the signed-in user’s company and is not selectable.',
              'With no posting quota left, publish is blocked and the screen deep-links to purchasing a package. A draft is always allowed and consumes nothing.',
              'Exposure Off lets the company take a live job down without closing it — the same switch HQ has.',
            ],
          },
        ],
        rules: [
          'A job must belong to exactly one company.',
          'THE PICTURE STEP IS DERIVED, NEVER TYPED. It appears only when the selected product feeds a placement carrying image slots, and asks for exactly as many pictures as that placement declares — two frames, two pictures; one frame, one. Changing the product re-derives the step, and pictures already chosen for a slot that still exists are kept.',
          'The picker opens on the TOPICS mapped to the job’s industry (kho vận · vận tải · ngoài trời for a logistics job) and can be switched to any topic or cleared — a logistics firm hiring a marketer wants an office scene, and locking them to their own industry would send them to the upload button instead.',
          'Every slot previews at the real card size with the badge and star safe areas drawn on. The same photo is a good hero at 3:4 and a beheaded portrait at 3:2, and nobody discovers that from a thumbnail.',
          'Pictures are OPTIONAL to publish. A job posted without them renders on the gallery’s automatic default for its industry rather than blocking the publish — a paid posting must never be held hostage by a step the employer does not understand.',
          'An employer’s uploaded picture belongs to that job only. It is never added to the shared gallery, because we hold no right to redistribute it to another company.',
          'salaryMax ≥ salaryMin when both are set (band mode only) — compared within ONE currency; the two bounds can never be in different currencies.',
          'Band mode requires AT LEAST ONE bound; either may be omitted, but not both. Both blank is “Thỏa thuận”, and the form makes the employer say so rather than saving an infinite band — see “A SALARY BAND MAY BE ONE-SIDED”.',
          'salaryCurrency is required in range mode and irrelevant in negotiable mode; a job that switches to "Thỏa thuận" keeps the stored currency rather than nulling it, so switching back does not lose the choice.',
          'experienceTo ≥ experienceFrom when both are set.',
          'deadline must be in the future on publish.',
          'Admin can post regardless of the company’s remaining posting quota (concierge override) — flagged in the audit log.',
          'ON THE COMPANY SITE, publishing (Open or Schedule) consumes exactly one posting slot of the chosen tier; a draft consumes nothing. This is the one rule the two surfaces genuinely do not share — HQ overrides it, the employer cannot.',
          'Only HR Manager / HR Specialist roles may create a job on the Company site (see Account management), and a company may only edit its own jobs.',
        ],
        states: ['Empty new form', 'Editing existing', 'Validation errors', 'Draft', 'Scheduled', 'Open (published)', 'Closed (expired)', 'Quota exhausted — publish blocked (Company site)'],
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
            'POST /company/jobs — create draft / publish (open) / schedule',
            'PUT /company/jobs/:id',
            'GET /company/quota — remaining posting slots',
          ],
          integrations: ['Products & Packages (quota)', 'Notifications (publish / scheduled confirmation)'],
          notes: 'ONE jobs table behind both surfaces. `source` (admin | company) records which door the row came in through, and it is the only difference the data carries — the two endpoint families must never diverge in what they accept.',
        },
        acceptance: [
          'HQ can create a job for any company and it appears active on the JS site.',
          'A company user can post a job and see it go live (Open) immediately — no approval wait.',
          'Draft → Publish transitions correctly; audit log records the actor.',
          'A posting slot is consumed on a company publish (Open / Schedule), never on a draft.',
          'A company can take a live job down via Exposure Off and re-expose it before the deadline.',
          'Negotiable salary renders as "Thỏa thuận" everywhere downstream.',
        ],
        sections: [
          {
            heading: 'Admin vs Company — one form, two scopes',
            text: 'Everything not in this table is identical, and is specified once above. Read a row as "the same field, answered differently", never as a second form.',
            table: {
              cols: ['', 'Admin (HQ)', 'Company site (employer)'],
              rows: [
                ['Which company', 'Searchable picker — any company', 'Fixed to the signed-in user’s own, not selectable'],
                ['Which tier is offered', 'Pick the PO first; that PO’s paid lines plus any Always-available tier', 'What the company holds — no PO picker, quota shown beside the choice'],
                ['Quota', 'Overridden. HQ may post past a company’s remaining slots (concierge), and the override is audited', 'Enforced. Publish is blocked at zero, with a deep link to buy'],
                ['Who may create', 'Any HQ operator with the job right', 'HR Manager / HR Specialist only (Account management)'],
                ['Editing the title of an Open job', 'No time limit — correcting a bad posting is the point', 'Locked 72 hours after it went live'],
                ['Approval before it goes live', 'None', 'None — the same rule, stated because it is the thing people assume'],
              ],
            },
            items: [
              'The Job entity, the field list and the publish lifecycle are shared. A change to any of them lands on both surfaces at once — that is the reason this is one requirement.',
              '`source` on the row (admin | company) is the only trace of which door was used. It is a fact for the audit log, never a switch for behaviour.',
            ],
          },
        ],
        openQuestions: [
          'Can a job target multiple cities, or exactly one? (client to confirm — spec currently assumes multiple)',
          'Bilingual = VI + EN (assumed) or VI + KO? Is the second language required or optional in Phase-1?',
          'Which job categories/industries are the canonical list for VN? (need the master taxonomy)',
          'Is a gender / age preference field allowed by policy? (legal review)',
          'Any post-publish spam / abuse controls now that a company can publish with no pre-publish approval gate?',
        ],
      },
    },
    /* ONE requirement for both surfaces — the same query, two scopes. HQ reads
       every job, a company reads its own; the columns, the status tabs and the
       row actions are the same list. Status and Exposure in particular must mean
       one thing in both places, which is exactly what two requirements lose. */
    {
      name: 'Job list',
      site: 'AdminCompanies',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      mockup: 'admin-job-list',
      mockups: ['co-job-list'],
      detail: {
        description:
          'The postings list, read at two scopes. HQ gets the master list of every job across all companies for oversight — filter, view, edit, close, or take down (Exposure) any posting. A company gets exactly its own jobs with live status, applicant counts and the same quick actions. No approval queue on either: company posts go live directly.',
        userStory:
          'As an HQ operator I want to see and manage every job across all companies so I can oversee and fix any posting — and as a company HR user I want to manage my own postings and see how many applicants each got.',
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
          {
            // The company reads the same row, minus the columns that only make
            // sense across accounts, plus the one number they ask for daily.
            group: 'Company site — the same row, narrower',
            items: [
              { name: '(company · created by · category)', type: '—', notes: 'NOT shown. Every row is their own company, and “who posted it” is an oversight question, not theirs.' },
              { name: 'days left', type: 'derived count', notes: 'shown beside the deadline — the employer’s question is “how long have I got”, not “what is the expiry date”' },
              { name: 'Upgrade (featured)', type: 'row action', notes: 'buy a boost for a live posting; HQ has no equivalent because HQ does not spend the company’s money' },
            ],
          },
        ],
        behaviors: [
          'Clicking the job title opens the job detail (same record on both surfaces; HQ additionally gets the oversight actions).',
          'Row actions: Edit · Close · Toggle exposure (On/Off) · View applicants.',
          'The job detail offers Duplicate — it clones the posting into a new Draft (never a live copy), so the operator edits and publishes it deliberately.',
          'The job detail always exposes a link to see the posting as a jobseeker would: the draft preview while Draft/Schedule, the live post once Open.',
          'The job detail lists WHO saved the job (name · title · location · when · whether they also applied), newest first, expandable to the full list — the Saves count alone does not tell HQ who the interested candidates are.',
          'The Exposure toggle is enabled only on Open jobs; on any other status the cell is inert.',
          'Sortable on posted, expires, views, saves and applied — the ranking questions HQ actually asks.',
          'Server-side pagination + filter + sort.',
          'ON THE COMPANY SITE the same list is scoped to the signed-in company: the same status tabs (All · Draft · Schedule · Open · Closed), the same row actions plus Upgrade (featured), and an empty state that prompts “Post your first job”.',
        ],
        rules: [
          'Status and Exposure are two independent fields and are never merged into one column: status is the lifecycle (Draft → Schedule → Open → Closed), exposure is public visibility. Only Open + Exposure On is live and applyable on the jobseeker site.',
          'Exposure Off takes a live job down without closing it — reversible any time before the deadline, and it does not change the status.',
          'Closing a job is a manual, deliberate action (separate from auto-Close at the deadline).',
          'Editing an Open job keeps it Open; a full audit entry is written.',
          'The job TITLE is read-only for the employer 72 hours after the job went live (everything else stays freely editable). HQ Admin has NO time limit on any field — correcting a bad posting is the point of this screen — and every change is audited.',
          'The “Saved by” list is candidate PII: it is gated by the same permission as candidate/resume viewing, and opening a saver’s profile from here is written to the audit log. A save is never shown to the company as a contactable lead unless the candidate applied.',
          'Views / saves / applied are read-only counters here — they are never editable from this screen.',
          'A company sees strictly its own jobs, and only Open / Scheduled ones count against its quota. The scope is enforced server-side, never by hiding rows in the client.',
        ],
        states: ['Loading', 'Empty (no jobs)', 'Filtered-empty', 'Has jobs', 'No jobs yet — onboarding CTA (Company site)'],
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
            'GET /company/jobs?status=&page= — the same projection, scoped to the caller’s company',
            'POST /company/jobs/:id/close',
            'POST /company/jobs/:id/duplicate',
          ],
          integrations: ['Master data (Job categories & roles)', 'Application management (applied count → Applicants board / Application list)', 'Audit log'],
          notes: 'Edit / close / exposure changes write an audit entry. The tab counts come back with the list so they cannot disagree with the rows. The company endpoints return the SAME row projection narrowed by scope — a second shape would let the two lists disagree about a job’s status.',
        },
        acceptance: [
          'HQ can filter by status & exposure and act on any job (edit / close / toggle exposure).',
          'A company sees only its own jobs, with accurate applicant counts, and can act on each.',
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
          {
            heading: 'Admin vs Company — one list, two scopes',
            text: 'The row, the status tabs and the lifecycle are the same. Only these differ, and every one of them follows from scope: HQ reads across accounts, a company reads its own.',
            table: {
              cols: ['', 'Admin (HQ)', 'Company site (employer)'],
              rows: [
                ['Rows returned', 'Every job, every company', 'Its own jobs only — enforced server-side'],
                ['Columns dropped', '—', 'Company · Created by · Category — all three answer questions only HQ asks'],
                ['Columns added', '—', 'Days left, beside the deadline'],
                ['Row actions', 'Edit · Close · Toggle exposure · View applicants', 'Edit · Close · Duplicate · Upgrade (featured) · View applicants'],
                ['“Saved by” panel', 'Yes — candidate PII, permission-gated and audited', 'No. A save is never shown to a company as a contactable lead unless the candidate applied'],
                ['Editing an Open job', 'Every field, no time limit', 'Every field except the title, which locks 72 hours after it went live'],
              ],
            },
            items: [
              'Status and Exposure mean exactly the same thing on both surfaces, and the tables above are the single definition. A surface that renders a fifth status, or merges the two fields into one column, is wrong.',
              'The applied count links to Application management on both — the Applicants board for HQ, the company’s own Application list for the employer.',
            ],
          },
        ],
        openQuestions: [
          'Any post-publish moderation / takedown workflow now that there is no pre-publish approval?',
          'Can a company re-open an expired job, or must they duplicate it? (HQ has no re-open either — the spec says duplicate.)',
          'Does the date-range filter apply to “posted” or to “expires”? (Or is it two separate filters — HQ asks both questions.)',
          'Are views / saves live counters or refreshed nightly? Live counters on a 1,200-row list is a real cost decision.',
          'Should Exposure Off pause the expiry clock? As specified it does not, so a job hidden for two weeks still expires on time.',
        ],
      },
    },
    /* MOVED from Resume management (2026-09-08 page feedback). Both are JOB
       matching logic — one ranks jobs for a jobseeker, the other finds jobs like a
       job — so they belong beside the job features that surface them. The slugs are
       unchanged; only the module segment of the URL moved, and every cross-link to
       them in Resume management was rewritten to match. */
    {
      name: 'Recommended jobs — matched to a jobseeker’s profile',
      site: 'Logic',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'JOBSEEKER ↔ JOB. The personal feed — “jobs for you”, from the profile and every CV. Needs a signed-in jobseeker. Not to be confused with Relevant jobs, which compares one job to another and needs nobody signed in.',
      detail: {
        requirements: [
          {
            label: '1 · How we pick the jobs to show',
            text: 'We give every open job a score from 0 to 100 for this jobseeker, then show the highest first. It is the same score the employer side uses to rank applicants — one calculation, read from the other direction. Section 2 below shows exactly how the score is worked out.',
            table: {
              cols: ['Step', 'What we do'],
              rows: [
                ['1', 'Take the jobseeker’s profile (basic info + work preference) and all of their CVs.'],
                ['2', 'Take every job that is open, not expired, and approved.'],
                ['3', 'Score each job against the jobseeker. Higher score = better fit.'],
                ['4', 'Remove jobs they already applied to, already dismissed, or that have expired.'],
                ['5', 'Sort by score. If two jobs score the same, show the newer one first.'],
                ['6', 'Remove duplicates — the same job posted twice by the same company (same title, same location) appears once.'],
                ['7', 'Take at most 2 jobs per company: walk down the list and skip a job if that company already has 2. See section 1b.'],
                ['8', 'Rotate: on a repeat visit the same day, show the same list. On a new day, rotate it so the jobseeker sees something new.'],
              ],
            },
            items: [
              'We use BOTH the profile and the CV. The profile says what they WANT (job role, city, salary). The CV says what they CAN DO (skills, experience). Using only one gives bad results: profile-only recommends jobs they cannot get, CV-only recommends jobs they do not want.',
              'We never hide the list. Even a brand-new user with almost no information sees jobs — just less personalised ones. See section 3.',
              'We calculate fresh each time, we do not save the list. Jobs expire and new ones appear every day.',
            ],
          },
          {
            label: '1b · One extra rule: at most 2 jobs from the same company',
            text: 'Sorting by score alone has one problem. If FPT Software has five matching jobs, the first five cards are all FPT and the page looks like one company’s advertisement.\n\nTHE RULE: go down the list from the highest score. Take a job only if that company has fewer than 2 jobs taken already. Otherwise skip it and keep going. Stop when the row is full.\n\nVN — Đi từ trên xuống theo điểm. Mỗi công ty chỉ lấy tối đa 2 việc. Việc thứ 3 trở đi của công ty đó thì bỏ qua, đi tiếp xuống dưới.',
            table: {
              cols: ['Rule', 'What it means'],
              rows: [
                ['Remove duplicate postings first', 'Same company + same job title + same location = one job. Keep the newest. Do this BEFORE counting, or one job posted twice uses up both of a company’s slots.'],
                ['At most 2 jobs per company', 'The 3rd job from that company is skipped. Nothing is reordered and no score changes.'],
                ['A skipped job is not deleted', 'It still appears in search and on the company’s page, and it can appear on the row tomorrow.'],
                ['Change the order a little each day', 'Only among jobs with close scores (within about 5 points). A 92 never moves below an 80.'],
                ['Push down jobs they ignore', 'If we showed a job 3 times and they never clicked it, move it down the list.'],
              ],
            },
            items: [
              'WHY NOT JUST LOWER THE SCORE of a company’s later jobs? Because the card shows the real score. The row would read 92% → 84% → 90%, and a jobseeker who sees 90 below 84 decides the number is fake. Skipping keeps the order clean.',
              'THE ORDER TO DO IT IN: remove duplicates → sort by score → go down and apply the limit of 2 → stop when the row is full.',
              '2 IS A SETTING, not a fixed rule. On a row of 4 cards it means at most half from one company. On a row of 8 cards, 3 may look better.',
              'DO NOT SHUFFLE RANDOMLY. If the order is random, the jobseeker cannot find the job they saw this morning, and we cannot check what they were shown when they complain. Changing the order by DATE gives something new each day and is still reproducible.',
            ],
          },
          {
            label: '1c · Worked example — the 2-per-company limit',
            text: 'The jobseeker’s six highest-scoring jobs after duplicate postings were removed. The row shows 4 cards. Four of the six jobs are at FPT Software.',
            table: {
              cols: ['Job', 'Company', 'Score', 'Taken?'],
              rows: [
                ['Senior Frontend Engineer', 'FPT Software', '92', '✅ Card 1 — FPT count 1'],
                ['React Developer', 'FPT Software', '90', '✅ Card 2 — FPT count 2'],
                ['Frontend Lead', 'FPT Software', '88', '⤫ Skipped — FPT already has 2'],
                ['Web Developer', 'FPT Software', '86', '⤫ Skipped — same reason'],
                ['Frontend Engineer', 'Tiki', '84', '✅ Card 3'],
                ['UI Engineer', 'VNG', '80', '✅ Card 4'],
              ],
            },
            items: [
              'THE ROW SHOWS: FPT 92% · FPT 90% · Tiki 84% · VNG 80%. Three companies, scores still running high to low, and no extra UI.',
              'WITHOUT THE LIMIT: FPT 92 · FPT 90 · FPT 88 · FPT 86 — every card is the same company, which is the problem this rule exists to prevent.',
              'THE TWO SKIPPED JOBS ARE FINE. They keep their 88 and 86, they still appear in search and on FPT’s company page, and tomorrow they can appear on the row.',
            ],
          },
          {
            label: '2 · How the score is calculated',
            text: 'Eight things are compared between the jobseeker and the job. Each is worth a fixed number of points, adding up to 100. Add up what the jobseeker earns — that is their score for that job.',
            table: {
              cols: ['What we compare', 'Points', 'Full points when…', 'Fewer points when…'],
              rows: [
                ['Skills', '20', '**5 points for each skill that matches, up to 20** — so 4 matching skills is full points.', 'Two matching skills → 10 points. It is a straight count, NOT a fraction of the skills the job listed: a job that lists many skills must not score worse than one that lists few.'],
                ['Years of experience + level', '22', 'Their years are inside the range the job asks for.', 'Below the minimum: points drop in proportion. Above the maximum: a small deduction per extra year, never below 10.'],
                ['Location + work type', '21', 'The job is in a city they want (or it is remote and they accept remote).', '12 for a neighbouring province · 10 if they will relocate · 6 if the city is right but the work type is wrong.'],
                ['Desired job role + category', '18', 'The job’s role is exactly the role they said they want.', '9 if only the category matches · 4 for a related category.'],
                ['Expected salary', '9', 'Their expected salary is inside the job’s range.', '4 if up to 20% above the job’s maximum. 0 if more than 20% above.'],
                ['Industry', '5', 'The company’s industry is one they asked for.', '2 for a related industry.'],
                ['Education level', '3', 'Equal to or higher than the job asks for.', '1.5 for one level below.'],
                ['Foreign language', '2', 'They have the language the job asks for, at the level it asks for.', '1 if they have the language but at a lower level, or no level recorded.'],
              ],
            },
            items: [
              'LANGUAGE AND CERTIFICATES ARE TWO DIFFERENT SECTIONS on the CV, and only the first is scored. **Foreign language** holds a language plus a level, both from master data — that is what the 2 points read. **Certificates** is a separate list and adds NO points, because there is no reliable way to check that a certificate matches what a job needs. Certificates are still shown on the CV for a recruiter to read.',
              'IF THE JOB DOES NOT SAY — skip that item and share its points among the others, so the total is always 100. A job that asks for no language is scored out of the remaining 98 points, then converted back to 100. Otherwise a job written with less detail would always give lower scores, which is not the jobseeker’s fault.\n\nVN — Nếu tin tuyển dụng KHÔNG yêu cầu mục nào thì bỏ mục đó ra, chia lại điểm cho các mục còn lại, tổng luôn là 100.',
              'IF THE JOBSEEKER LEFT IT BLANK — two different rules, and mixing them up turns the score into a test of who filled in the most fields. Salary, education, location → GIVE FULL POINTS: saying nothing means they have no requirement, so do not punish them. Skills and years → GIVE LOW POINTS: saying nothing means we have no proof.\n\nVN — Ứng viên bỏ trống mục “mong muốn” (lương, nơi làm việc, học vấn) thì CHO ĐỦ ĐIỂM, vì không nói nghĩa là không kén. Bỏ trống mục “năng lực” (kỹ năng, số năm) thì CHO ĐIỂM THẤP, vì không có gì chứng minh.',
              'SALARY IN TWO CURRENCIES — convert first, then compare, using one exchange rate stored in master data (an admin types it in and reviews it every few months; it is a setting, not a live service). Never compare the raw numbers. Never show a converted number to anyone — both sides keep seeing the figure they wrote. If no rate is set, give full points. See the worked example below.',
              'NEVER USE gender, age or marital status. Not directly, and not indirectly — for example, do not calculate age from date of birth and use it as “experience”.',
              'SAME INPUT, SAME SCORE — no randomness. Save the weight version and the exchange-rate version with every score, so “why did my match drop from 92 to 84” has an answer.',
              'WHERE THE WEIGHTS COME FROM — our own estimate. NOT research, and NOT from Saramin KR: their public API has no skill list at all and matches on free text, so there was nothing to copy. Do not present these numbers to the client as researched figures. What is defensible is the ORDER — skills first because they are the only thing both sides state on purpose, then experience and location because those are what recruiters actually filter on.',
              'THE WEIGHTS MUST BE CHANGEABLE without a code deploy, and every score must record which version produced it. See section 6.',
              'LOG EVERY RECOMMENDATION SHOWN, together with what the jobseeker did next. It is the only way to check whether a higher score really leads to more applications. See section 6.',
            ],
          },
          {
            label: '2b · Worked example',
            text: 'Job: Senior Frontend Engineer · role **Frontend Engineer** · Hồ Chí Minh · 3–5 years · needs React, TypeScript, Git, Docker, AWS · 30–45 triệu · IT category · Software industry · Bachelor. It states no language requirement.\n\nJobseeker: 4 years’ experience · has React, TypeScript, Git · wants role **Frontend Engineer** · wants Hồ Chí Minh · wants 35 triệu · wants IT · wants Software · has a Bachelor.\n\nRECALCULATED 2026-09-02. The same pair scored 85% under the old model and scores 95% now. The candidate did not change: skills fell from 38 points to 20, and the points moved to signals we can actually read — so a candidate whose PREFERENCES and EXPERIENCE line up scores high even when only 3 of 5 skills matched. If that feels too generous, the lever is the weights, not the formula.',
            table: {
              cols: ['What we compare', 'Points possible', 'Points earned', 'Why'],
              rows: [
                ['Skills', '20', '15', 'Matched 3 skills × 5 points'],
                ['Years + level', '22', '22', '4 years is inside 3–5'],
                ['Location + work type', '21', '21', 'Wants HCMC, job is in HCMC'],
                ['Desired job role + category', '18', '18', 'Wants Frontend Engineer, the job’s role IS Frontend Engineer — an exact role match, so full points rather than the 9 a category-only match would earn'],
                ['Expected salary', '9', '9', '35 triệu is inside 30–45'],
                ['Industry', '5', '5', 'Wants Software, company is Software'],
                ['Education level', '3', '3', 'Bachelor = Bachelor'],
                ['Foreign language', '~~2~~', '—', 'The job asks for no language, so we skip this row'],
                ['**TOTAL**', '**98**', '**93**', 'Out of 98, because language was skipped'],
                ['**FINAL SCORE**', '**100**', '**95%**', '93 ÷ 98 × 100 = 94.9, rounded to 95'],
              ],
            },
            items: [
              'Show whole numbers only. “84.5% match” suggests a precision that nine estimates cannot support.',
              'Show the two reasons that earned the most points next to the number — here “3/5 skills · Hồ Chí Minh”. A percentage on its own tells the jobseeker nothing they can act on.',
            ],
          },
          {
            label: '2bb · Worked example — salary in two currencies',
            text: 'Job: 1,200–1,800 USD / month. Jobseeker: expects 35,000,000 VND / month. Do they fit? The salary signal is worth 7 points, and there are three possible behaviours. Exchange rate held in master data: 1 USD = 25,000 VND.',
            table: {
              cols: ['Approach', 'What the system does', 'Result', 'Verdict'],
              rows: [
                ['① Compare the raw numbers', 'Reads “35,000,000” against “1,200–1,800” and sees a number far above the maximum.', '0 points — “asking far too much”', '❌ WRONG, and the reverse is worse: a jobseeker asking 3,000 USD against a job paying up to 30,000,000 ₫ reads as 3,000 ≤ 30,000,000 → FULL points, when they are really asking 2.5× the maximum.'],
                ['② Skip it (our earlier rule)', 'Sees two different currencies and gives full points — “we cannot tell”.', '7 points', '⚠️ Safe but blind. It gives the same 7 points to someone asking 35 triệu (a good fit) and someone asking 60 triệu (far too expensive).'],
                ['③ Convert, then compare (agreed)', 'Converts the JOB’s range: 1,200–1,800 USD × 25,000 = 30,000,000–45,000,000 ₫. Then checks 35,000,000 against that.', '7 points — genuinely inside the range', '✅ Correct, and it stays correct in the case ② cannot see: a jobseeker asking 60,000,000 ₫ is 33% above the 45,000,000 ₫ maximum → more than 20% over → 0 points.'],
              ],
            },
            items: [
              'THIS IS WHAT THE CLIENT WAS ASKING FOR — not a live currency service, just one number an admin types in and reviews every few months. That is why it is safe: it behaves like a setting, not like an external dependency.',
              'THE JOBSEEKER AND THE EMPLOYER NEVER SEE A CONVERTED NUMBER. The job still shows “1,200–1,800 USD”, the profile still shows “35,000,000 ₫”. The conversion happens only inside the comparison, so nobody is ever shown a figure they did not write.',
              'STORE THE RATE VERSION on every score, next to the weight version. When a score changes after the rate is updated, that is the record which explains it.',
              'IF NO RATE IS CONFIGURED, fall back to approach ② — full points. Never fall back to ①.',
            ],
          },
          {
            label: '2c · How skills are matched (the part that decides the score)',
            text: 'Skills are 20 of the 100 points — cut from 38 on 2026-09-02 because extraction returns only 3–5 skills from a typical CV, so the signal cannot carry more than that. The short version: skills are NOT free text on either side. Both the CV and the job store a link to the same row in one master list, and matching compares those links — not words.',
            table: {
              cols: ['Question', 'Answer'],
              rows: [
                ['Where do a CV’s skills come from?', 'BOTH. The parser reads them from the uploaded file, then the jobseeker confirms or removes them. Nothing is saved as a skill until a person accepts it — see “Upload-only CVs” in this module.'],
                ['Are “JS”, “JavaScript”, “ReactJS”, “React” the same skill?', 'Partly automatic. Lower-casing, removing accents and stripping punctuation already make “reactjs” and “React JS” find “React”, with nothing to maintain. Genuinely different words — “CSKH” ↔ “Chăm sóc khách hàng”, “PTS” ↔ “Photoshop” — need an ALIAS written by hand.'],
                ['Who maintains the dictionary?', 'The client. It is `skill` + `skill_alias` in their own backend. ⚠ TODAY: 731 skill rows and ZERO aliases, and the skill list still contains job titles (Product Manager), languages (Japanese - N2) and typos. This needs an owner and a date before launch.'],
                ['How do we guarantee a job’s skill matches the CV’s skill?', 'By never comparing text. The employer picks from the same master list, the CV resolves to the same master list, and the match is `cv_skill.skill_id = job_skill.skill_id`. If either side could type free text, matching would silently return nothing.'],
                ['Is missing “React” penalised the same as missing “Docker”?', 'No — a skill flagged ESSENTIAL for the job’s occupation counts DOUBLE. But see the gap below: that flag is per OCCUPATION, not per job.'],
              ],
            },
            items: [
              'WHAT IS STILL MISSING — the employer cannot mark which skills are must-have on THEIR job. The double weighting comes from `occupation_skill`, which says “React is essential for a Software Developer” in general, not for this particular posting. RECOMMENDATION: add a must-have checkbox beside each skill on the job form. One click per skill, the employer already knows the answer, and it is the only way “missing React” can cost more than “missing Docker” on a specific job.',
              'MUST-HAVE MUST WEIGHT, NOT FILTER — even brought forward. A required skill that EXCLUDES candidates empties the result set four picks in, and the employer never learns why their shortlist is empty. Double or triple the points instead.',
              'EMERGING AND RELATED SKILLS — a real weakness, and the client’s example is the right one. A growth candidate with Python and n8n scores low against a job asking for SQL and A/B testing, because exact matching cannot see that they are neighbours. Three things soften it, and all three should be said out loud rather than implied.',
              '① THEY ARE NOT FILTERED OUT. Skills rank, they never exclude. That candidate still scores on desired role, category, years, location and salary — 80 of the 100 points do not involve skills at all, so a candidate we could extract nothing from is still ranked on the seven signals we CAN read. They rank lower; they do not disappear.',
              '② `skill_relation` ALREADY EXISTS in the client’s database — skill↔skill edges, currently 0 rows. A few dozen hand-written edges (Python → Data Analysis, n8n → Automation) give partial credit for a neighbouring skill immediately, with no new table and no model.',
              '③ THE UNMATCHED-TERM QUEUE IS THE DISCOVERY MECHANISM. When 200 candidates type “n8n” and it is not in the list, that queue is what tells the taxonomy owner to add it. An emerging skill is invisible until someone tries to type it — which is exactly why the queue has to be staffed.',
              'ONLY 26% OF ROLES HAVE SKILLS TODAY — 122 of 477, in IT, Marketing, Design, HR and Planning. The other 16 categories (service, construction, accounting, driving, education, medical…) have none, so for those candidates and those jobs the score runs on role, location and years. That is fine for the JOB side, because the renormalise rule redistributes the skills points automatically.',
              'IT IS NOT FINE FOR THE CANDIDATE, so one rule protects them: if a CV’s extracted skill terms did not resolve to the taxonomy, score skills as UNKNOWN and redistribute — never as “no evidence”. A chef whose trade has no vocabulary in our list must not rank as though they submitted a blank CV. Our data gap is not their fault, and the unmatched-term queue already tells us which case it is.',
              'AND NEVER SHOW THEM AN EMPTY PICKER — a candidate in an unauthored category gets no suggestions and almost no autocomplete hits. Either hide the skills step, or say what is happening: “Chúng tôi đang xây dựng danh sách kỹ năng cho ngành của bạn — hãy nhập kỹ năng bạn dùng, chúng tôi sẽ thêm vào.”',
              'PHASE 2, no UI change: replace exact skill matching with embedding nearness, so React ↔ Next.js and Python ↔ Pandas score partial credit automatically instead of waiting for someone to write the edge. The screen consumes one number and a reason list either way.',
            ],
          },
          {
            label: '3 · If the jobseeker has not filled in everything',
            text: 'Not everyone completes their profile. The calculation does not change — there is simply less information to work with, so the results are less accurate. What changes is the TITLE we put above the list, so we do not promise more than we can deliver.',
            table: {
              cols: ['The jobseeker has…', 'How good the match can be', 'Title to show'],
              rows: [
                ['Basic info only', 'Weak — we do not know what job they want, or what they can do', '“Việc làm nổi bật” (Featured jobs). Do NOT say “for you”.'],
                ['Basic info + work preference', 'Good on WHAT THEY WANT — right city, right field, right salary. But we do not know their skill level.', '“Việc làm phù hợp” (Matching jobs)'],
                ['Basic info + CV', 'Good on WHAT THEY CAN DO. But we have to guess what they want from their last job title.', '“Việc làm giống hồ sơ của bạn” (Jobs like your CV)'],
                ['Basic info + work preference + CV', 'Best — this is the full calculation', '“Việc làm phù hợp với bạn” (Jobs for you), and show the match % on each card'],
              ],
            },
            items: [
              'Ask for the missing piece under the list, e.g. “Cho biết bạn muốn làm gì để nhận việc phù hợp hơn” (tell us what you want, to get better matches). It is true, not a sales trick — the score really does improve.',
              'A CV that is not finished yet is fine. Fewer skills just means a lower score on those jobs; nothing breaks.',
              'The match % only appears when the score is 60 or higher. Below that we show the job with no number. A “32% match” label helps nobody.',
            ],
          },
          {
            label: '4 · SPECIAL CASE — the jobseeker has more than one CV',
            text: 'A jobseeker can have up to 3 CVs. One of them can be marked “let employers find me by this CV”. That mark is ONLY about employer search. It has nothing to do with recommendations.',
            table: {
              cols: ['Situation', 'What the recommendation feed does'],
              rows: [
                ['3 CVs, one is marked for employer search', 'Uses ALL 3 CVs. The mark is ignored here.'],
                ['3 CVs, none is marked', 'Uses all 3 CVs. Works exactly the same — nothing is missing.'],
                ['1 CV', 'Uses that CV.'],
                ['No CV at all', 'Uses the profile only. See section 3, first or second row.'],
                ['Account is set to Hidden', 'Still gets recommendations. Hidden only stops EMPLOYERS from finding them.'],
              ],
            },
            items: [
              'THE ARITHMETIC, since it is easy to picture wrongly: 3 CVs × 100 jobs = 300 score calculations. Then we COLLAPSE them — for each job keep only its best score — which leaves 100 jobs with one score each. We rank those 100. The list the jobseeker sees has at most 100 rows, never 300: a job appears ONCE, carrying the score of whichever CV suited it best. (3 CVs is the cap, so 300 is the worst case.)',
              'WORKED EXAMPLE: a jobseeker has a Developer CV and a Sales CV. A React job scores 88 against the Developer CV and 31 against the Sales CV → the job is listed once, at 88. An Account Manager job scores 24 and 79 → listed once, at 79. Both appear high in the same list, each judged by the CV that argues for it.',
              'Do NOT merge the CVs into one before scoring. Mixing a Developer CV and a Sales CV creates a profile that is neither, and the jobs recommended would fit neither.',
              'Show which CV matched, on the card: “Phù hợp với CV Business Developer của bạn”. Otherwise a mixed list looks random.',
              'We do NOT add a second setting like “choose a CV for recommendations”. It is one more thing to explain, most people would never touch it, and using all CVs is better anyway.',
              'Note: work preference is ONE record for the whole account, not one per CV. So all CVs share the same desired job role, city and salary. The CVs only differ in skills and experience.',
            ],
          },
          {
            label: '5 · Where recommended jobs appear',
            text: 'Four places. Two of them are attached to a specific job, which changes the calculation slightly.',
            table: {
              cols: ['Page', 'Who sees it', 'Based on'],
              rows: [
                ['After onboarding', 'Only users who just answered the onboarding questions', 'Their new work preference. This is the reward for filling in the form.'],
                ['Homepage section', 'Everyone (all 4 cases in section 3)', 'The jobseeker’s profile + CVs'],
                ['Job detail page', 'Everyone, including visitors who are NOT signed in', 'Mostly the job on screen — a different calculation, specced in **Relevant jobs**'],
                ['After applying to a job', 'Everyone', 'Mostly the job just applied to — the **Relevant jobs** calculation, minus jobs already applied to'],
              ],
            },
            items: [
              'On the job detail page and the after-apply page, “similar jobs” must also look at the job on the screen — same category, similar skills, similar level — not only at the jobseeker. Otherwise someone browsing outside their usual field gets a list that ignores what they are reading.',
              'The after-apply page is the most useful one for a brand-new user. We may know nothing about them, but the job they just applied to tells us a lot.',
            ],
          },
          {
            label: '5b · MY DASHBOARD ① — “Việc làm phù hợp với bạn” (the score rail)',
            text: 'The signed-in dashboard carries TWO job sections, and they must answer two different questions — otherwise they return overlapping lists and the page reads as one rail printed twice. Neither introduces a new ranking model: this one is the match score above, section ② is the [Relevant jobs](/m/job-management/relevant-jobs-matched-to-another-job) job↔job sort. Anything wanting a third model has to justify why the two we have are wrong.',
            items: [
              'SOURCE — the match score, computed against the jobseeker’s PROFILE plus EVERY CV they hold, best score per job. Not the searchable CV specifically.',
              'GATE — open · not expired · moderation approved · exposure on. Deliberately NOT the candidate’s own visibility or searchable flag: a Hidden candidate still gets recommendations, because hiding controls who can find THEM, not what they are shown.',
              'EXCLUDED — already applied · already dismissed · saved (those belong to their own rail) · anything section ② has already taken.',
              'ORDER — score, highest first. Ties break on profile completeness, then last-active, then CV updated-at. Recency never enters the score itself.',
              'THE CARD SHOWS THE SCORE PLUS ONE REASON LINE — “Cùng Hồ Chí Minh · Frontend Engineer”. Never the bare number: a percentage with no reason invites exactly one question and answers none of it.',
              '★ THERE IS A MINIMUM SCORE, and it is not optional. The heading is a PROMISE — “việc làm phù hợp” — and a 28% match printed under it breaks that promise in a way the user can check for themselves. Start at a provisional floor of 50 and SHOW FEWER THAN 3 RATHER THAN PAD. TopDev’s own recommendation engine lists the absence of this threshold as a known defect — a very weak match is still shown as a match whenever nothing better exists. Do not inherit it.',
              'THE FLOOR IS A MEASUREMENT, NOT A GUESS — the recommendation log required in section 6 is what sets it: the score band at which application rate stops falling is the real threshold. 50 is a placeholder until that data exists.',
              '★ COLD START — IT WORKS WITH NO CV AT ALL, and this is the assumption most likely to be got wrong. Work preference is collected at ONBOARDING and is worth 53 of 100 (location + work type 21, role + category 18, salary 9, industry 5); with education and years, a candidate holding ZERO CVs is still scored on about 78 points. Only skills (20) and language (2) need a CV — so “no CV → no recommendations” is false, and the empty state for it must not be built.',
              'IF THEY HAVE NOT DONE ONBOARDING EITHER — show the onboarding prompt, NOT jobs. Newest-jobs padding under a heading that says “phù hợp với bạn” is a claim the user can disprove at a glance, and it teaches them to distrust the rail permanently.',
              'COUNT — 3 cards visible, up to about 9 behind a horizontal scroll.',
            ],
          },
          {
            label: '5c · MY DASHBOARD ② — “Tương tự việc bạn vừa xem” (the seeded rail)',
            text: 'The behaviour rail. It answers a different question from ① — “what else is like the thing I am weighing up right now?” — and it reuses the job↔job list wholesale rather than scoring anything.',
            items: [
              'SOURCE — the Relevant jobs job↔job list for a job the candidate recently VIEWED. That list is already computed and cached per job, so this rail costs one cache lookup and no per-user ranking at all.',
              'ORDER — that feature’s own priority sort, unchanged: same category is a hard gate, then role, then location, then level, then newest breaks ties.',
              '★ ONE SEED PER RAIL, AND NAME IT IN THE HEADING — “Tương tự: Senior Frontend Engineer · FPT Software”. Same principle as the skill suggestion chips: every suggestion carries its source, which makes it checkable and stops it reading as surveillance. For more breadth add a SECOND rail for the second seed; never blend two seeds into one list, which produces a rail nobody can explain.',
              'SEED ONLY FROM THE LAST ~7 DAYS. “Similar to” a job they have forgotten looking at is noise wearing the clothes of personalisation.',
              'EXCLUDED — the seed job itself · other jobs from the SAME COMPANY as the seed (those get their own section, per Relevant jobs) · already applied · saved.',
              'NO SCORE ON THESE CARDS. The rail is not ordered by score, and a number that does not explain the order is worse than no number.',
              'HIDE THE WHOLE RAIL BELOW 3 CARDS — never pad it. A padded “similar jobs” rail is how a recommendation surface starts lying.',
              'NEW USERS SEE NOTHING HERE, and that is correct. No views, no seed, no rail — section ① is the floor that keeps the dashboard from being empty.',
            ],
          },
          {
            label: '5d · MY DASHBOARD — the rules that connect the two sections',
            items: [
              '★ SECTION ② CLAIMS ITS JOBS FIRST, and this is counter-intuitive enough to be worth stating plainly. Its pool is tiny — one category, one seed — while ① draws on the whole board. If ① picked first it could strip ②’s best cards and push it under its 3-card minimum, hiding the rail entirely, while ① backfills without noticing anything was taken. THE NARROW RAIL ALWAYS CLAIMS BEFORE THE WIDE ONE.',
              'ONE JOB APPEARS IN ONE SECTION ONLY. Without this the same card repeats down the page, and a dashboard that repeats itself reads as broken rather than as helpful.',
              'COMPUTE ONCE PER SESSION AND CACHE. A dashboard that reshuffles on every load feels unreliable. Recompute when the profile or a CV changes, or after an application.',
              'THE ONLY NEW DATA EITHER SECTION NEEDS IS LAST-N VIEWED JOB IDS. Everything else — the score, the job↔job lists, their caches — already exists. Worth knowing before anyone scopes this as a large piece of work.',
              'SECTION ② IS PERSONAL, THE LIST BEHIND IT IS NOT. Relevant jobs is deliberately “the same list for everyone, signed in or not” and cached per job; what is personal here is only WHICH job seeds it. Nobody should read this rail as a reason to make that cache per-user.',
            ],
          },
          {
            label: '6 · Two things we must BUILD so the score can be tuned later',
            text: 'The weights on this page are our estimate, not research. We expect some of them to be wrong. These two pieces are what let us find out which ones and fix them — without either, the numbers stay a guess for the life of the product.',
            table: {
              cols: ['#', 'What to build', 'Where it lives', 'Why'],
              rows: [
                ['① Matching settings', 'One screen listing the 8 signals with their point values, plus the VND/USD exchange rate. HQ edits and saves; saving creates a new VERSION rather than overwriting.', 'Admin → **System**, beside Master data and Chất lượng tìm kiếm. It is HQ-only configuration that changes how another module behaves — the same reason Products and Membership tiers sit there.', 'Tuning must not need a code deploy. A deploy means a developer, a release window and a rollback plan, for what is a number change.'],
                ['② Matching report', 'A report over the recommendation log: score band vs application rate, per signal, per page.', 'Admin → **Analytics**, beside Recruit report. NOT a browsable list — the log itself is millions of rows and no operator reads it row by row.', 'It is the only way to answer “do higher scores actually lead to more applications”.'],
                ['— the log table itself', 'One row every time a job is SHOWN to a jobseeker, plus what they did next.', 'No screen. It is a backend table that only the report above reads.', 'Recording it is Phase 1 work even though nobody looks at it until the report exists.'],
              ],
            },
            items: [
              'THE WEIGHTS CONFIG — signal · points · active from · who changed it. Points must total 100 before it can be saved. Old versions are kept, never edited, so any score can still be explained months later.',
              'STAMP THE VERSION ON EVERY SCORE — `weightVersion` and `rateVersion` stored beside the score itself. Without this, changing a weight silently rewrites history and “why did my match drop from 92 to 84” has no answer.',
              'THE LOG ROW — candidateId · jobId · score · weightVersion · rateVersion · which page (homepage / job detail / after apply / onboarding) · position in the list · shown at · clicked (yes/no) · applied (yes/no).',
              'THE THREE QUESTIONS IT ANSWERS — and they are the reason to build it. (1) DOES THE SCORE WORK — if jobs scored 90+ get applied to no more often than jobs scored 70, a weight is wrong. (2) WHICH SIGNAL EARNS ITS POINTS — compare applications on jobs that matched mainly on skills against those that matched mainly on location. (3) IS A CHANGE AN IMPROVEMENT — change one weight, then compare the next period against the last.',
              'POSITION IN THE LIST IS NOT OPTIONAL. Jobs at the top get clicked more no matter what they score, so without position you cannot tell a good score from a good slot. Every conclusion drawn from the log depends on it.',
              'IT IS PERSONAL DATA — it records what a named person was shown and what they did. Keep roughly 12 months, then delete. Never expose it to employers, and never join it into anything employer-facing.',
              'PERMISSIONS: Matching settings is a **System** resource (same level as Master data — very few operators), the Matching report is an **Analytics** resource (read-only for most roles). Neither should be writable by Sales or Content roles.',
              'BUILD BOTH IN PHASE 1 — even though neither is visible to a user. Adding the log later means throwing away every month of data before it existed, which is exactly the data needed to justify the first tuning round.',
            ],
          },
        ],
      },
    },
    {
      name: 'Relevant jobs — matched to another job',
      site: 'Logic',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'JOB ↔ JOB. Shown on a job detail page and after applying — “jobs like this one”. Works for visitors who are not signed in, because it never reads a profile. Not to be confused with Recommended jobs, which is JOBSEEKER ↔ JOB.',
      detail: {
        requirements: [
          {
            label: '1 · How we pick jobs similar to this one — same category, no score',
            text: 'The job detail page and the after-apply page show jobs similar to THE JOB ON SCREEN, not jobs matching the jobseeker. It works exactly like an e-commerce store showing “more from this category”: no weights, no similarity score. We filter to the same job category, then order that shortlist by the few fields that make two jobs interchangeable — role, location, level.\n\nIt exists because a job detail page is PUBLIC. Most people reading it are not signed in and we know nothing about them, so a list that depends on a profile would be empty for the majority of viewers. This one works with zero knowledge of who is reading — and because it is the same list for everyone, it caches cleanly.',
            table: {
              cols: ['Order (most important first)', 'Field', 'How it is used'],
              rows: [
                ['Gate', 'Job category', 'Must be the SAME category as the job on screen. Nothing outside it ever appears — the e-commerce “more from this category” rule. This is a filter, not a score.'],
                ['1', 'Job role', 'Among same-category jobs, the same role ranks first — “React Developer” next to “Frontend Engineer”.'],
                ['2', 'Location', 'Then same province (or either job remote).'],
                ['3', 'Job level', 'Then same seniority.'],
                ['4', 'Posted date', 'Newest breaks any remaining tie.'],
              ],
            },
            items: [
              'THIS IS A PRIORITY SORT, NOT A SCORE. Same category is a hard gate; role, then location, then level decide the ORDER, in that priority; newest breaks ties. Four fields, in the order they matter: category → role → location → level. Nothing else — no skills, no salary, no industry — enters this calculation. That also means the 16 of 21 categories with no skill lists are matched exactly as well as the 5 that have them.',
              'WHY NO SCORE. A category filter plus a priority sort is easier to explain, predict and debug than weighted points, and it can never surface an unrelated job just because a couple of soft signals happened to line up. If someone asks “why is this job here?”, the answer is one line: same category, and it matches on role / location / level ahead of the ones below it.',
              'ALWAYS EXCLUDE: the job being viewed, closed and expired jobs, and jobs with exposure off. On the after-apply page also exclude every job this person has already applied to.',
              'EXCLUDE THE SAME COMPANY from this list, and give it its own section instead — “Việc làm khác tại FPT Software”. A company’s own jobs are the most similar jobs to each other, so without this rule the list fills up with the employer whose page the visitor is already on. Someone reading a job wants ALTERNATIVES; someone who wants more from that company clicks the company.',
              'SHOW 5–8 CARDS, taken off the top of the sorted same-category list. Same category is the floor — if fewer than 3 jobs share the category (after the exclusions above), HIDE the section, because an empty or padded “similar jobs” row is worse than no row: it teaches the reader the suggestions are not worth looking at.',
              'THE SAME LIST FOR EVERYONE, signed in or not. It reads no profile, sets no cookie, stores no personal data — so the list is identical for every viewer of a given job. Personalisation is not this feature’s job; the personal feed lives in → [Recommended jobs](/m/job-management/recommended-jobs-matched-to-a-jobseeker-s-profile).\n\nVN — Danh sách giống nhau cho mọi người xem, không cần đăng nhập. Gợi ý cá nhân hoá nằm ở Recommended jobs.',
              'WHICH MAKES IT CACHEABLE, and this matters more than it looks: job detail pages are the highest-traffic pages on the site. Compute the list ONCE per job and cache it — recompute when the job changes or roughly hourly as new jobs appear. There is no per-request work at all, since the list no longer re-orders for signed-in visitors.',
              'NO NEW DATA IS NEEDED. Job category, role, location and level already exist on every job.',
            ],
          },
          {
            label: '2 · Worked example',
            text: 'The visitor is reading: **Senior Frontend Engineer · FPT Software · Hồ Chí Minh · Senior · IT/Software**. Every candidate below is in the same category (IT/Software) — that is the gate. Role, then location, then level decide the order; ✓ = matches the viewed job.',
            table: {
              cols: ['Candidate job', 'Same role', 'Same location', 'Same level', 'Rank'],
              rows: [
                ['React Developer · Tiki · HCMC · Senior', '✓', '✓', '✓', '**1**'],
                ['Frontend Intern · Base.vn · HCMC · Intern', '✓', '✓', '—', '**2**'],
                ['Frontend Engineer · VNG · Hà Nội · Senior', '✓', '—', '✓', '**3**'],
                ['Backend Engineer · Shopee · HCMC · Senior', '—', '✓', '✓', '**4**'],
                ['React Developer · FPT Software · HCMC', '—', '—', '—', '⤫ excluded — same company'],
              ],
            },
            items: [
              'THE ORDER: Tiki · Base.vn · VNG · Shopee. All are IT/Software, so all are eligible; the order falls straight out of the priority — same role first, then same location, then same level.',
              'WHY THE INTERN (Base.vn) OUTRANKS THE SENIOR IN HÀ NỘI (VNG): location beats level in the priority order, so same-role-same-city ranks above same-role-different-city, even though the viewer is Senior. This is the deliberate consequence of ordering the fields category → role → location → level. If the market says seniority should matter more than city, swap the location and level rows — that is the only change needed, and no numbers move.',
              'WHY BACKEND (Shopee) IS LAST: different role. Role is the first sort key, so once it misses, the job sits below every same-role job regardless of how well location and level line up. It is still a valid alternative — same field, same city, same seniority — just a weaker one than the three Frontend roles.',
              'THE FPT JOB IS EXCLUDED even though it is the closest match of all — it belongs in “Việc làm khác tại FPT Software” underneath, not in the alternatives list.',
            ],
          },
          {
            label: '3 · The after-apply popup — what each card shows',
            text: 'The popup that opens the moment an application is submitted (“Job application complete!”) lists 3–8 relevant jobs from the rule above and lets the candidate apply to several at once. Each card has to answer one question fast — “should I apply to this one too?” — and, per the rule that every suggestion carries its reason, it has to say WHY it is here. Fields below; anything not listed is not on the card.',
            table: {
              cols: ['Field', 'Reads from', 'Rule'],
              rows: [
                ['Checkbox', '—', 'Selects the row for the bulk button. **NOT pre-checked** — see below.'],
                ['Job title', '`job.title` in the UI language', 'One line, ellipsis. Never wraps — the card height is fixed so 5 rows scan as a list.'],
                ['Company', '`company.name`', 'Second line, regular weight. Logo optional; text is the requirement.'],
                ['**Why it is here** — reason chips', 'The same four fields the sort reads: **category** (gate) · **role** · **location** · **level**, compared to the job just applied to', 'Chips for role · location · level. A chip that MATCHES the applied job renders highlighted (the Korean card’s teal); a non-match renders plain. Category is never shown as a chip — it is the gate, so every card matches it by definition.'],
                ['Salary', '`salaryType` · `salaryMin/Max` · `salaryCurrency`', 'Same rendering as every other job card: “Thỏa thuận”, or the band with its one-sided forms (“Từ 15 triệu”, “Lên đến 30 triệu”). One format across the product.'],
                ['Contract · work type', '`contractType` · `jobType`', '“Full-time · Hybrid”. Two words, one line.'],
                ['Deadline', '`deadline`', '“Còn 29 ngày”. Amber at ≤ 3 days. Expired jobs never reach the list (excluded by the rule above).'],
                ['Save', 'Saved jobs', 'Star toggle, same component as the job list.'],
                ['Open', 'Job detail', 'Per-row action is **View job**, never Apply — see “one apply path”.'],
                ['New badge', '`postedAt` < 3 days', 'Optional. Small “Mới” tag on the title line.'],
              ],
            },
            items: [
              'NOT PRE-CHECKED. Saramin KR and TopDev pre-check every suggested row, so one tap on the bulk button fires five applications the candidate may not have read. We start with nothing selected and the button shows the count. Two reasons: an accidental mass-apply is unrecoverable for the candidate, and low-intent applications flood the employer inbox — which is the surface our employer-side quality work is trying to keep clean.',
              'ONE APPLY PATH. The per-row button opens the job; the ONLY way to apply from this popup is the bulk button. Two apply buttons on one screen are two flows to test and two ways to double-apply to the same job.',
              'THE REASON CHIPS ARE THE SORT FIELDS AND NOTHING ELSE. Role · location · level are exactly what ordered the list, so the card explains its own position. Do not add chips that did not decide the order (skills, salary) — a highlighted chip the sort ignored is a lie about why the card ranks where it does.',
              'THE FOOTER NAMES THE CV THAT WILL BE SENT — “CV dùng để ứng tuyển: Frontend Engineer CV ✎”, defaulting to the CV used for the application just made. It MUST be a Qualified CV: if the candidate switches to one that is Not enough information or Can’t read, the bulk button disables and says why (“CV chưa đủ điều kiện”). Applying re-checks nothing — the CV carries its verdict in from upload — so this is the one place the popup has to look at CV status.',
              'THE BULK BUTTON reads “Ứng tuyển (n) việc đã chọn”, disabled at n = 0, one confirmation, then n separate applications each evaluated on its own. The Korean label “Simultaneous support” is a machine translation of 동시지원 and must not ship.',
              'REPLACE THE KOREAN “RESUME HIGHLIGHT” BANNER. That top-right card sells a paid KR product we do not have. The slot is worth keeping for ONE prompt: if the candidate’s CV search is OFF, show “Cho phép nhà tuyển dụng tìm thấy bạn →” linking to the My CVs toggle; hide it when already on. Right after applying is the moment they most want to be found.',
              'NO SORT DROPDOWN. The list is ordered by the rule (role → location → level → newest) and that order is the point; “By registration date” would hide the reasoning. “All Scraps” becomes a plain **Saved jobs** link.',
              'THE INFO STRIP GETS A TOOLTIP, not just an icon: “Same category as the job you applied to, ranked by matching role, then location, then level.” One sentence, the same words as the rule.',
              'BELOW 3 CARDS THE LIST IS HIDDEN (rule above) — the popup then shows only the confirmation, the CV line and a **View my applications** link. A padded list of two is how a recommendation surface starts lying.',
            ],
          },
        ],
      },
    },
  ],
}
