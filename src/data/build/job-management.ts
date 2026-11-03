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
  owner: 'Luong',
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
        'SKILL SLOTS ARE NOT SELLABLE, and after 2026-09-02 the reason is arithmetic rather than judgement. The skills component is **1 point per matched skill, capped at 4** (weights v4, 2026-09-19; it was 5 per skill capped at 20 from 2026-09-02) — four matched skills is full marks. An employer who buys the right to list 25 skills instead of 10 gains NOTHING: no candidate can score above the cap, and the extra entries are the universal ones (Excel, Word, Teamwork) that almost everyone holds, so they lift the bottom of the shortlist toward the middle and make it sort worse. There is no version of this that is worth money to a customer, and selling it would be selling a downgrade.',
        'AND THE RANKING GETS NOISIER, not just lower. Skills past the first handful are the universal ones — Excel, Word, Teamwork, communication — which almost every candidate has. They lift the numerator by roughly the same amount for everybody, so they add no discrimination at all: pure noise bought at a premium. Beyond about 8 skills an employer is no longer describing a role, they are describing a team.',
        'WHAT WAS ADOPTED IS A **BOUNDED** COUNT, AND THE BOUND IS THE WHOLE POINT. A count with no ceiling would make more skills always better, let a job with 30 skills outrank every well-specified posting in every candidate’s feed, and make scores incomparable between postings — that version stays rejected. Capping the count at 4 keeps the honest incentive (describe the role properly, up to about 8) while removing the perverse one the ratio created (describe it as thinly as possible, so the denominator stays small). See Resume management → MATCH SCORE for the defect this fixed and the worked numbers.',
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
    {
      label: 'JOB DISCOVERY \u2014 the name for every page that gets a candidate TO a job list',
      text:
        '\u201cJob discovery\u201d (VI: Kh\u00e1m ph\u00e1 vi\u1ec7c l\u00e0m) is the internal name for the family of jobseeker pages whose job is to deliver a job list \u2014 as opposed to the search box that queries one, or the job detail at the end of one. It is a SPEC word, not a label: the menu a jobseeker reads says \u201cVi\u1ec7c l\u00e0m / Jobs\u201d.',
      table: {
        cols: ['Page', 'What it is', 'Saramin KR equivalent'],
        rows: [
          ['Jobs by location', 'The job list, faceted by province / district', '\uc9c0\uc5ed\ubcc4'],
          ['Jobs by job category', 'The job list, faceted by the job-category taxonomy', '\uc9c1\uc885\ubcc4'],
          ['Search result', 'The job list from a keyword query \u2014 already specced as \u201cJob list (Search result)\u201d', '\u2014'],
          ['Recommended jobs', 'Matched to the signed-in jobseeker\u2019s profile \u2014 already specced', '\ucd94\ucc9c'],
          ['Relevant jobs', 'Matched to another job \u2014 already specced', '\u2014'],
          ['HOT100', 'A RANKING, not a filter \u2014 the most-viewed / most-applied postings', 'HOT100'],
          ['Zone', 'A branded campaign landing page, banner + copy + two job lists', '\ucc44\uc6a9\uad00'],
          ['Collection', 'A curated saved set of jobs published under a slug', '\ud050\ub808\uc774\uc158'],
          ['Jobs for foreign nationals', 'The job list, filtered to visa-friendly postings', '\uc678\uad6d\uc778 \ucc44\uc6a9'],
          ['Staffing agencies', 'A directory of COMPANIES, not jobs \u2014 the odd member', '\ud30c\uacac\uc5c5\uccb4'],
        ],
      },
      items: [
        'THE TEST for whether a new page joins this family: does it hand the candidate a job list? That is the only thing the name has to settle, and it settles it without a meeting.',
        'THE FACETED ROWS ARE ONE PAGE, NOT MANY. Location, category and \u201cforeign nationals\u201d are the same list with a filter pre-applied and a different entry point. Specifying them as separate screens is how three copies of one search end up maintained apart.',
        'TWO OF THESE ARE ALREADY BUILT and must not be re-invented under a new name: a ZONE is svn-be\u2019s `zone` (public `/khu-tuyen-dung/{slug}`) and a COLLECTION is `job_collection` (public `/bo-suu-tap/{slug}`). A zone does not own its lists \u2014 it points at collections.',
        'SARAMIN KR\u2019s \uc5ed\uc138\uad8c\ubcc4 (jobs by subway station) is deliberately NOT on this list. It rests on a dense metro network; HCMC has one line.',
        'GOOGLE TRANSLATE RENDERS \ucc44\uc6a9\uad00 AS \u201cRecruitment Center\u201d, which is wrong and has already caused confusion \u2014 it is a campaign page, not a place. Use Zone.',
      ],
      warn: 'Do not name this family after the navigation widget (\u201cmega menu pages\u201d) or after one of its own members (\u201cjob collection pages\u201d). The first is false the moment the nav becomes a mobile drawer; the second overloads `job_collection`, which already means one specific thing in the database.',
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
        requirements: [
          {
            label: 'How a job gets created — two doors, one entity, one lifecycle',
            text: 'Drawn for the client (15/09/2026). Admin (HQ) posts on a company’s behalf from the Free tier or from a PO line; the employer posts from the products the company holds. The form and the lifecycle are shared — only WHAT MAY BE POSTED FROM and WHO MAY PUBLISH differ. Every box is a rule already on this page; the drawing adds none.',
            diagram: 'job-create',
          },
          {
            label: 'Employer: what the form allows in each situation — Verified is the only gate that stops a draft',
            text: 'ADDED 15/09/2026 after the client review surfaced a case the spec had only implied: a verified company with NO official invoice yet can still create a job. The form opens, there is no tier to choose, the Free tier is not offered (it is Admin-only), Publish is off — and Save draft works. Nothing is spent, nothing is approved, and the draft waits for a product.',
            table: {
              cols: ['Situation', 'Tier picker', 'Save draft', 'Publish', 'The form says'],
              rows: [
                ['Company NOT verified', 'hidden', '**Not shown**', '**Not shown**', '“Công ty chưa được xác minh — chưa đăng tin được, kể cả bản nháp” + link to Company information (upload the ERC)'],
                ['Verified · **no product yet** — no official invoice issued, nothing provisioned', 'empty — no tier to choose, and **no Free tier**', '**On**', '**Off**', '“Chưa có sản phẩm đăng tin — lưu nháp trước, mua gói để đăng” + link to request a quotation / Product usage'],
                ['Verified · holds a product · slots left', 'the held tiers, remaining quota beside each', 'On', '**On** — Post now / Schedule, spends exactly 1 slot', 'remaining quota next to the picker (“using 1 of 5 posts”)'],
                ['Verified · holds a product · 0 slots left', 'the held tiers, all at 0', 'On', '**Off**', '“Hết lượt đăng của gói này” + deep link to buy'],
              ],
            },
            items: [
              'The two Publish-off rows are ONE form state, not two: “nothing to publish from”. The draft is kept unchanged; when Accounting issues the invoice (or the company buys again) the employer reopens the draft, picks the tier and publishes. No re-entry, no approval.',
              'Why the employer never sees the Free tier: its entitlementSource is Always available — Admin-only by definition (“What each surface may post FROM”). Offering it here would let any verified company post for free, the one thing the product model forbids.',
              'Why a draft needs no invoice: a draft is text in a table — it consumes nothing and nobody can see it. Blocking it would only stop the employer from preparing the posting while Accounting works, the exact wait the invoice-first rule was never meant to create.',
              'Admin is unaffected by every row here: HQ picks the Free tier or a PO line and may publish past the company’s remaining slots (concierge override, audited).',
            ],
          },
        ],
        uiFields: [
          {
            group: 'Basics',
            items: [
              { name: 'company', type: 'ref → Company', required: true, notes: 'searchable picker resolved via the Company API (company ID); drives branding on the JS side. Fixed to the user’s own company on the Company site.' },
              { name: 'title (vi / en)', type: 'i18n string', required: true, notes: 'bilingual — Vietnamese + English; max 120 chars each' },
              { name: 'exposure', type: 'toggle (On / Off)', required: true, notes: 'separate switch (not a status) — whether an Open job shows on the jobseeker site (hiển thị trên trang jobseeker hay không)' },
              { name: 'purchaseOrder', type: 'ref → PO', notes: 'required ONLY for products whose entitlementSource = Requires purchase. Pick the PO FIRST (a customer can have more than one active PO) and the product list becomes that PO’s lines. A product flagged Always available needs no PO.' },
              { name: 'packageType (product)', type: 'ref → Product', required: true, notes: 'the posting tier that drives visibility / ranking. The options offered are filtered by the product’s entitlementSource (Products & Packages), NOT by matching the product name: with no PO only Always-available tiers appear; with a PO, that PO’s paid lines appear.' },
              { name: 'jobCategory / industry', type: 'enum / ref → Industry node, any level', required: true, notes: 'category = the role area · industry = the company sector (two different axes). Industry uses the shared 3-level picker (Jobseeker & user › Onboarding · “Industry picker”): a group, an industry or a specialty can be chosen; limit 1 (to confirm).' },
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
              'With no posting product yet (no official invoice) OR no posting quota left, Publish is blocked and the screen deep-links to buying a package; the Free tier is never offered. A draft is always allowed and consumes nothing — see “Employer: what the form allows in each situation”.',
              'Exposure Off lets the company take a live job down without closing it — the same switch HQ has.',
            ],
          },
        ],
        rules: [
          'COMPANY SITE — an UNVERIFIED company cannot post. Neither **Publish** nor **Save draft** is shown, and the page says why in one sentence with the fix attached: “Công ty chưa được xác minh — chưa đăng tin được, kể cả bản nháp. Để được xác minh, tải lên Giấy chứng nhận đăng ký doanh nghiệp (ERC) ở Company information” → the certificate row ✓ or ✗ and a button to Company information. Once uploaded: “Waiting to verify — Saramin xác minh trong 1 ngày làm việc; sau đó bạn đăng tin được ngay.” The row is rendered by the same rule the admin’s Customers filter uses (readyToVerify), never a hand-written sentence. The employer can still open the form and read it. Verification is the ONE gate on posting: once the company is Verified a draft needs no invoice, no PO and no product — see CRM → Sign-up & company verification (ERC). ADMIN SIDE is not gated: HQ may still post on behalf of any company (concierge), verified or not.',
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
        states: ['Empty new form', 'Editing existing', 'Validation errors', 'Draft', 'Scheduled', 'Open (published)', 'Closed (expired)', 'Quota exhausted — publish blocked (Company site)', 'No product yet — draft only, Publish off (Company site)'],
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
          'A verified company with no official invoice can create a job and Save draft: the tier picker offers nothing (no Free tier), Publish is disabled with the buy link, and no slot or quota changes.',
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
            heading: 'Tab Placement (Admin) — job nào đang chạy ở mỗi vị trí trả tiền',
            early: true,
            text: 'Trang Jobs của Admin chia 2 tab, giống trang Boosting (chốt 17/10/2026): **Jobs** — danh sách như hiện tại, không đổi · **Placement** — mỗi dòng là một placement tin tuyển dụng trả tiền ở **Trang chủ** và **phần đầu trang Tìm kiếm**, thay cho sheet “Super Hot Job Today / Job Highlight” của CS. Một tin nằm trong placement vì **product nó được đăng phủ placement đó** (fill route TIER) — không ai xếp tay tin vào ô. Mở trang thì mọi placement đều mở sẵn; có nút **Expand all / Collapse all**, ▸/▾ trên dòng đóng/mở một placement. **View all** chuyển sang tab Jobs với bộ lọc Placement đặt sẵn (`/recruitment/jobs?placement=<placement id>`), gồm cả lượt chạy đã kết thúc. Chỉ có ở Admin — trang Company site không có tab này.',
            table: {
              cols: ['Placement (tên theo tiêu đề trên site)', 'Placement id', 'Product đưa tin vào'],
              rows: [
                ['Homepage — Super Hot Job Plus (thẻ lớn)', '`placement_home_super_hot_large`', 'Job Hero'],
                ['Homepage — Super Hot Job (“Super hot jobs” · sheet: Công việc Hot hôm nay)', '`placement_home_super_hot_image`', 'Super Hot Job'],
                ['Homepage — Top Job', '`placement_home_top_job`', 'Top Job'],
                ['Homepage — Distinction', '`placement_home_distinction`', 'Distinction'],
                ['Homepage — Recommended jobs (rail)', '`placement_home_recommended`', 'Top Job · Distinction'],
                ['Homepage — Highlight jobs (sheet: Job Highlight)', '`placement_home_job_card_basic_plus`', 'Basic Plus'],
                ['Search — Top search', '`placement_top_search`', 'các product phủ Top search'],
              ],
            },
            items: [
              'Bảng placement: Placement (tên + product đưa tin vào) · Preview (reference image) · **Showing now** (số tin đang chạy ở đó hôm nay) · **Waiting** (số tin sẽ bắt đầu sau, kèm ngày sớm nhất · công ty) · View all.',
              'Danh sách mở rộng — đúng các cột của sheet, thêm Company ID và Status: # · Job ID · Title · Internal tag (sheet: Phân loại — Paid package · Gift · CS Support) · Activated (Ngày kích hoạt) · Expires (Ngày hết hạn) · Days left (Số ngày còn lại; ≤ 3 tô đỏ) · Company ID · Company (Tên công ty) · Status.',
              'Status của một lượt chạy, suy ra từ ngày: Scheduled (Activated > hôm nay) · Open (Activated ≤ hôm nay ≤ Expires) · Closed (Expires < hôm nay). Danh sách mở rộng chỉ hiện Open + Scheduled; Closed chỉ thấy ở View all.',
              'Lọc theo trang (Home · Search); ô tìm kiếm khớp tên placement, Job ID, title, công ty, Company ID.',
              'Phần “Latest jobs” (Basic) và tin Free của trang chủ KHÔNG nằm trong tab này — chỉ các band trả tiền ở phần đầu trang. Xem câu hỏi mở.',
            ],
          },
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
          'Tab Placement: có cần đưa thêm “Latest jobs” (Basic) và tin Free của trang chủ, hay các vùng tin ở trang Job list / Mega menu không? Hiện chỉ gồm các band trả tiền ở Trang chủ + Top search.',
          'Tab Placement: Internal tag (CS Support · Gift · Paid package) lấy từ đâu — cùng câu hỏi với Internal tag ở Quota usage.',
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
    // Jobseeker search — restored 2026-09-11. The 5ee4358 merge of the Admin and
    // Company job lists also removed this feature, which was never a duplicate of
    // either, and resume-management kept linking to it. Rewritten to the decided
    // "Recommended" model: tier band → field priority → refresh, body-only hits in a tail.
    {
      name: 'Job list (Search result)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      ready: true,
      detail: {
        refDocs: [
          {
            label: 'Figma — Job search result (three sections)',
            href: 'https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=1693-9276',
            meta: 'Figma frame · 1440 wide',
            note: 'The search page as designed: the Top section carousel, the Job search result list with its sort control, and the Blue zone carousel inside the list. The three-section rules below were written against it (24/09/2026).',
          },
        ],
        description:
          'Keyword + facet search results with three sorts and pagination — the workhorse discovery surface. Ranking is decided by what the candidate TYPED and by the posting tier the employer PAID for, in that order of construction: relevance decides which jobs qualify and how they order inside a band; the tier decides which band. The candidate’s profile and match score never enter.',
        userStory: 'As a jobseeker, I want to type what I am looking for and get jobs that actually match it — with the paid placements clearly marked — so I can trust the list and zero in on the right roles.',
        keyPoints: [
          { vi: 'Lấy tất cả job có từ khoá trong ít nhất 1 trường: tiêu đề · kỹ năng · ngành / vị trí · công ty · mô tả + yêu cầu.', en: 'Take every job whose title, skills, category / role, company, or description + requirements contains the keyword.' },
          { vi: 'Sort mặc định “Recommended”: xếp theo gói trước — Top Job → Distinction → Basic Plus → Basic → Free.', en: 'Default sort “Recommended”: group by paid tier first — Top Job → Distinction → Basic Plus → Basic → Free.' },
          { vi: 'Trong một gói: job có từ khoá ở tiêu đề lên trước, rồi kỹ năng, ngành, công ty (mô tả / yêu cầu không xếp trong gói — xem điểm 4). Bằng nhau thì job auto-refresh mới hơn lên trước — KHÔNG tính lần sửa tin.', en: 'Inside one tier: title matches first, then skills, category, company (description / requirements do not rank inside a tier — see point 4). Ties go to the newest auto-refresh — NOT the last edit.' },
          { vi: 'Job chỉ khớp ở mô tả / yêu cầu không được xếp vào gói — nằm cuối danh sách, sau mọi gói.', en: 'A job matched only in description / requirements is not grouped — it goes to the very end, after every tier.' },
          { vi: 'Hai sort còn lại — Date posted, Closing soonest — không phân gói, không ưu tiên gói trả tiền.', en: 'The other two sorts — Date posted and Closing soonest — have no tiers and no paid priority.' },
          { vi: 'Không dùng CV hay điểm phù hợp của ứng viên ở đây.', en: 'The candidate’s CV and match score are never used here.' },
        ],
        uiFields: [
          {
            group: 'Query & facets',
            items: [
              { name: 'keyword', type: 'string', notes: 'matched against the searchable fields only — see the module block “WHICH FIELDS THE KEYWORD MATCHES”. Every WORD must hit somewhere; the fields it may hit are title · skills · role/category · company · body' },
              { name: 'location', type: 'province multi-select' },
              { name: 'job category / role', type: 'multi-select', notes: 'master data — the same two-level taxonomy the job form writes' },
              { name: 'level · experience', type: 'multi-select · range' },
              { name: 'work type · contract type', type: 'two multi-selects', notes: 'two axes, never one list — see “WORK TYPE and CONTRACT TYPE are TWO fields”' },
              { name: 'benefits', type: 'multi-select', notes: 'the 12 typed benefits — a facet, never a keyword target' },
              { name: 'salary range', type: 'range + currency', notes: 'the currency SCOPES rather than converts; ÷12 for annual; “Thỏa thuận” jobs always included; say what the scope hid. Canonical rules: Resume management → “★ SALARY — the one contract”' },
              { name: 'sort', type: 'enum', required: true, notes: 'Recommended · Date posted · Closing soonest. Recommended is the DEFAULT and the ONLY sort that bands by tier — see “THE THREE SORTS”' },
            ],
          },
          {
            group: 'Result item',
            items: [
              { name: 'JobCard', type: 'title · company · salary · location · tier badge · saved ♥ · refreshed-ago' },
              { name: 'tier badge', type: '“Tin ưu tiên · <tier>”', required: true, notes: 'on every paid card in Recommended — a band can outrank relevance, so the reader is owed the disclosure' },
              { name: 'band header', type: 'section label', notes: 'RECOMMENDED — render each band as a labelled section (“Top Job”, “Distinction”…) on the page where the band starts, as the KR reference does, rather than one flat list with badges. Makes the paid structure legible at a glance' },
            ],
          },
        ],
        behaviors: [
          'Filters AND the sort reflect in the URL (shareable / back-button safe) and survive pagination — a candidate on page 3 is never silently moved to another sort.',
          'Debounced keyword; facets apply instantly with live result counts.',
          'Save a job from the card without leaving results.',
          'RANKING IS QUERY-ONLY: every word must hit a searchable field → tier band (Recommended only) → field priority inside the band → last refreshed. The candidate’s CV, preferences and match score are NOT read — the same query returns the same results logged in or out.',
          'BODY-ONLY MATCHES ARE NEVER BANDED. A job whose only hit is in the description or requirements goes to an unbanded tail after all bands, so a Top Job that merely mentions the keyword cannot sit above a Distinction job titled with it.',
          'Switching sort re-orders the same jobs and never changes WHICH jobs are returned. Date posted and Closing soonest carry no bands.',
          'ZERO RESULTS RELAX IN A FIXED ORDER and always disclose it: salary → experience → contract type → province (widen to region) → keyword AND→OR. Show what was relaxed (“Không có việc nào ở Đà Nẵng — đang hiện cả miền Trung”).',
          'DE-DUPLICATE BY COMPANY BEFORE BANDING: one employer posting five near-identical titles collapses to one card plus “3 vị trí tương tự tại X”.',
        ],
        rules: [
          'Gate = Open + Exposure On + not past deadline + moderation approved. No domain field (salary, industry, experience) may ever act as a gate.',
          'Retrieval: a job qualifies when EVERY word of the query hits at least one searchable field — any field per word (OR across fields, AND across words). Relax to OR across words only when the AND set is empty, and say so.',
          'Facets: OR within one facet, AND across facets — stated because it is the commonest cause of an unexplained empty result.',
          'The match score never participates in search ranking, in any form. It belongs to the recommendations feed only.',
          '“Last refreshed” means the AUTO-REFRESH timestamp (the paid cadence, or an explicit refresh the employer buys). EDITING A JOB NEVER BUMPS IT — otherwise employers edit-spam to the top of their band.',
          'No randomness anywhere. Every ordering ends in `jobId`, so the order is total and pagination is stable across page loads.',
        ],
        requirements: [
          {
            label: 'THE SEARCH PAGE IS THREE SECTIONS — Top · Result list · Blue zone: one match set, three orders',
            text: 'DECIDED 24/09/2026 (Thu, against the Figma search frame). After a keyword search the page is three sections, top to bottom: the TOP SECTION (the “UX UI jobs for you” carousel), the JOB SEARCH RESULT list, and the BLUE ZONE (“The choice that sets you apart”) inserted into that list. All three start from the SAME set — every job that contains the keyword in at least one of the five matchable fields (title · skills · category / roles / specialisations · company · description + requirements, see “WHICH FIELDS THE KEYWORD MATCHES”). What differs is which of those jobs a section takes and how it orders them.',
            table: {
              cols: ['Section', 'Takes which of the matching jobs', 'Order', 'Rules'],
              rows: [
                ['**Top section**', 'Jobs whose PRODUCT covers this placement — the tier’s Placement slots include the search-top area. Membership is set on the product, never on the posting.', '**Last refreshed** first — `lastRefreshedAt`, the auto-refresh the product gives the job. NOT the last edit.', 'A paged carousel (“1 / 2”). Renders nothing when no matching job sits on such a product.'],
                ['**Job search result** — sort Recommended (default)', 'EVERY matching job.', '1 · Group by the product’s **Sort priority** (Posting ladder), highest rung first. 2 · Inside a group, by **which field held the keyword**: title → skills → category / roles → company → description. 3 · Ties: newest `lastRefreshedAt`.', 'Super star / Hot job are add-on BADGES — they never change the order. **Date posted** and **Closing soonest** sort the same set by that one date and ignore tiers (see “THE THREE SORTS”).'],
                ['**Blue zone**', 'Matching jobs whose product is sold in a **Premium package** (the Premium package checkbox — Products & Packages → Packages).', '**Companies interleaved** — one job per company in turn (A, B, C, A, B…), then `lastRefreshedAt` inside that rotation.', '**Hidden entirely when fewer than 3 jobs qualify** — no half-empty band. The heading names the companies shown (“Jobs for MB Bank & NIPPA”).'],
              ],
            },
            items: [
              'LAST REFRESHED MEANS AUTO-REFRESH, in every section. A job moves when its product refreshes it (Auto-refresh on the product record) — never when someone edits the posting. Otherwise every employer edits a comma each morning to climb the list. Same rule as step 5 of the pipeline below.',
              'THE TOP SECTION AND THE BLUE ZONE ARE PRODUCT FACTS, not posting facts. A posting cannot opt into either; the product it was published on either covers the search-top placement / sits in a Premium package, or it does not. This is what keeps both sections sellable.',
              'INTERLEAVING IS A ROUND-ROBIN over companies ordered by their newest refreshed job; when a company runs out of jobs the rotation continues with the rest. Recommended reading — the client has not stated the tie-break, flagged below.',
              'THE < 3 RULE IS A RENDER RULE, not a search rule: the jobs still appear in the result list under their tier. Only the band is withheld.',
            ],
            warn: 'Open — (1) interleaving tie-break when one company holds most of the qualifying jobs (round-robin then remainder is the recommendation); (2) whether a job may appear in BOTH the Top section and the Blue zone at once (recommendation: yes — they are two placements, and de-duplicating would hide a paid product), and whether a job shown in either is also repeated in the result list (recommendation: yes, the list is complete).',
          },
          {
            label: 'JOB SEARCH — gate → filter → score → band → order → tail, and relevance is ONLY what the candidate typed',
            text: 'How the result list is built when a candidate searches — six steps, in order. The paid tier matters at step 4 only, and only in the Recommended sort. The candidate’s own CV and match score are never used.',
            table: {
              cols: ['Step', 'What happens', 'Rule in plain words'],
              rows: [
                ['1 · Only live jobs', 'Drop everything that is not currently visible', 'The job must be Open, Exposure On, not past its deadline, and approved. Nothing else is excluded at this step — not salary, not industry, not experience.'],
                ['2 · Apply the filters', 'The boxes the candidate ticked', 'Inside one filter, any ticked value passes (OR). Across filters, all must pass (AND). The keyword is not a filter — it is handled in step 3.'],
                ['3 · Find the keyword', 'Which jobs match, and how well', 'Every word of the query must appear in at least one of: job title · skills · job category / role · company · description + requirements. Remember WHICH field matched — title is the best match, then skills, then category, then company, then description.'],
                ['4 · Group by paid tier', 'Recommended sort only', 'Top Job → Distinction → Basic Plus → Basic → Free. Only jobs matched in title, skills, category or company are grouped. A job matched only in description / requirements skips this step.'],
                ['5 · Order inside each group', 'Relevance first, then freshness', 'Title matches first, then skills, then category, then company. Description / requirements never decide the order inside a group — a job matched ONLY there is not in any group (see step 6). Ties: the job with the newest auto-refresh comes first. Editing a job does NOT count as a refresh.'],
                ['6 · The end of the list', 'Description-only matches', 'After all the groups, ordered by newest auto-refresh. The paid tier has no effect here.'],
              ],
            },
            items: [
              'Which fields count as searchable is written once — “Which fields the keyword matches”, on the module page. Do not copy the list anywhere else.',
              'Same text matching as skill typeahead: lowercase, accents ignored (“ke toan” finds Kế toán), punctuation ignored (“nodejs” finds Node.js).',
              'Words: all must match. Fields: any may match. “kế toán Hà Nội” needs both words, and each may sit in a different field. If nothing matches, retry with either word — and tell the candidate that happened.',
              'One company posting many similar jobs shows as one card plus “3 vị trí tương tự tại X”. Do this before step 4, or one employer fills the whole top group.',
              'The salary filter follows the salary contract: filter within one currency, never convert, always include “Thỏa thuận”.',
              'No randomness. The same URL gives the same order every time, so paging is stable.',
            ],
            warn: 'The candidate’s CV, preferences and match score are never used in search. Someone searching “kế toán” gets accounting jobs even if their CV is all backend engineering. The match score lives only in employer CV search and the recommendations feed.',
          },
          {
            label: 'THE THREE SORTS — bands belong to Recommended, and nothing else',
            text: 'Three sorts. Only “Recommended” uses the paid tiers. The other two are plain lists — no tiers, no paid priority — otherwise their names would mislead.',
            table: {
              cols: ['Sort', 'Paid tiers?', 'Order', 'Why this name'],
              rows: [
                ['Recommended (default)', 'Yes — the only one', 'Tier group → which field matched → newest auto-refresh. Description-only matches come at the very end.', 'It is our pick for the query: tier, relevance and freshness together. Renamed from “Mới cập nhật” on 2026-09-11 — a list that puts relevance first cannot honestly be called “last updated”.'],
                ['Date posted', 'No', 'Newest posting first — the date it went live. Auto-refresh does not move it.', 'It says “posted”, so it must be the posting date.'],
                ['Closing soonest', 'No', 'Earliest deadline first. Jobs with no deadline go last.', 'For candidates in a hurry.'],
              ],
            },
            items: [
              'Switching sort never changes WHICH jobs appear — only their order.',
              'There is no “pure relevance” sort, so there is no view with the paid tiers switched off. That is a deliberate business choice; the “Tin ưu tiên” badge is what keeps it honest.',
              'There is no salary sort in this version. ⚠️ Not decided by us — please confirm with the client. The salary rules already exist if it is wanted later.',
              'The chosen sort is part of the URL and stays when the candidate pages forward.',
            ],
          },
        ],
        states: ['Loading', 'No results (relaxation offered, and what was relaxed shown)', 'Has results — banded (Recommended)', 'Has results — flat (Date posted / Closing soonest)', 'Error / retry'],
        backend: {
          endpoints: ['GET /jobs/search?q=&filters…&sort=recommended|posted|closing&page='],
          integrations: ['Search index — facets with counts, VN ASCII folding, field-weighted relevance (see the module block “FILTER-ONLY and NEVER-INDEXED fields” for the index recommendation)', 'Saved jobs'],
          notes: 'The index returns, per hit, WHICH field matched best (title/skills/category/company/body) — stage 5 orders on that, and stage 4 needs it to decide band vs tail. A job leaves the index synchronously on Close / expiry / Exposure Off.',
        },
        acceptance: [
          'Every word of the query hits at least one searchable field for every returned job; body-only matches appear after all banded results.',
          'On Recommended, results are grouped Top Job → Distinction → Basic Plus → Basic → Free, ordered inside each band by field priority then last refreshed; paid cards carry the tier badge.',
          'Date posted and Closing soonest show no grouping and are unaffected by tier.',
          'Filters + sort + page are URL-encoded; the same URL yields the same order logged in or out; the order is stable across reloads.',
        ],
        openQuestions: [
          'SALARY SORT — absent in this version. Intentional? The currency contract already defines its behaviour; adding it later is cheap.',
          'AUTO-REFRESH CADENCE for Distinction and Top Job is undefined (only Basic = 15 days and Basic Plus = 10 days exist). Step 5 cannot ship for those two tiers until the client sets both.',
          'BAND SECTION HEADERS (labelled groups as in the KR reference) vs badges only — recommended, but a UI decision for the client.',
          'RESERVED PAGE-1 SLOT for the best unpaid declared-field match — recommended as insurance, but a commercial decision the client owns.',
          'SQL vs dedicated search engine — recommendation on the table (dedicated index, for VN ASCII folding + live facet counts + per-hit best-field). The SQL fallback costs the facet counts.',
        ],
      },
    },
    {
      name: 'Search suggestions — the dropdown under the search box',
      site: 'Jobseekers',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'The live list under the job search box while the candidate types or pastes. THREE groups, 2 rows each by default and 6 rows in total, in this order: companies (names) → keywords (job categories only) → jobs (titles of open postings). A group with fewer than 2 gives its rows to the others — jobs first, then companies, then keywords. Decided 2026-10-28 for SRM-1052, where a pasted job title showed “Không có kết quả” in the dropdown yet found the job on Enter.',
      detail: {
        requirements: [
          {
            label: '1 · Three groups, two rows each — Companies → Keywords → Jobs',
            text: 'Until 2026-10 the dropdown read **master data only**, so a title an employer typed (“Business Analyst (Fintech)”) could never appear in it — and the dropdown said “Không có kết quả” while Enter found the job. That is the bug in SRM-1052: two parts of one search box disagreeing.\n\nThe dropdown now reads three sources, shown as three groups in this order — **2 rows each by default, 6 rows at most in total** (rule 2 moves spare rows between groups).',
            table: {
              cols: ['Order', 'Group', 'Source', 'Base rows', 'Click opens'],
              rows: [
                ['1', '**Công ty** — Companies', 'Names of active companies with at least one open, named posting', '2', 'The **company detail page** `/companies/<slug>`'],
                ['2', '**Từ khoá** — Keywords', 'Master data — **job categories only**', '2', '`/search?category=<code>` — that category **applied as a filter**, the same link the job tags use'],
                ['3', '**Việc làm** — Jobs', 'Titles of OPEN, publicly visible postings', '2', 'That job’s **detail page** `/jobs/<slug>`'],
              ],
            },
            items: [
              '**DECIDED 2026-10-28 — 6 rows, 2 / 2 / 2 by default, in the order of the design “Search - Clicked & entered keyword”.** Replaces the earlier draft of 10 rows. The dropdown is a shortcut, not a results page: six rows fit without scrolling, and everything else is one Enter away.',
              '**KEYWORDS = JOB CATEGORIES ONLY.** Not occupation, specialisation, industry or skill. A category is broad, there are few of them, and each opens a large, clean list. Industry, skill and the narrower role levels stay reachable from the filter panel on the results page.',
              '**A JOB TITLE IS NEVER A KEYWORD ROW.** It appears only as a specific job that opens that job. Raw titles as search terms give rows like “UI UX Designer” and “UI/UX Designer” side by side.',
              '**LOCATIONS ARE NOT IN THE DROPDOWN.** The search bar has its own location picker; the build’s `location` suggestion group is dropped from this list.',
            ],
          },
          {
            label: '2 · A short group gives its rows to the others — Jobs, then Companies, then Keywords',
            text: '1. Each group first takes what it matched, **up to 2**.\n2. Spare rows = 6 − rows used.\n3. Spare rows go to the other groups in this order: **Jobs → Companies → Keywords**. A group takes as many as it still has before the next one gets any.\n4. Rows still spare → the list is simply shorter. Never pad it with rows that do not match what was typed.\n\nThe DISPLAY order never changes — Companies, Keywords, Jobs — only how many rows each group gets. A group with no match is hidden, heading and all.',
            table: {
              cols: ['Found (company / keyword / job)', 'Shown', 'Rows'],
              rows: [
                ['5 / 3 / 9', '**2 / 2 / 2**', '6 — every group has enough'],
                ['3 / **0** / 9', '2 / 0 / **4**', '6 — no keyword: its 2 rows go to Jobs'],
                ['**1** / 2 / 9', '1 / 2 / **3**', '6 — one company: its spare row goes to Jobs'],
                ['6 / **0** / **1**', '**5** / 0 / 1', '6 — Jobs have only 1, so the 3 spare rows go to Companies'],
                ['**0** / 5 / **0**', '0 / **5** / 0', '5 — only keywords match; Jobs and Companies have nothing to take, Keywords take the rest'],
                ['0 / 1 / 2', '0 / 1 / 2', '3 — nothing left anywhere, so the list is shorter'],
                ['0 / 0 / 0', '—', '0 — empty state (rule 3)'],
              ],
            },
            items: [
              '**WHAT COUNTS AS A MATCH** — the only gate, in every group: the name CONTAINS the query, ignoring Vietnamese accents (“ke toan” finds “Kế toán”), in either language (“accountant” finds “Kế toán”); and the row leads somewhere live — a company or category with ZERO open jobs is not a match.',
              '**WHY JOBS FIRST, KEYWORDS LAST:** a pasted or typed job title is what SRM-1052 was about, so jobs get the spare room first; there are only ~20 categories, so Keywords rarely have more to give anyway.',
              '**WHICH ROWS WIN inside a group:** name starts with the query → a word in it starts with the query → contains it. Ties: companies and categories by most open jobs; jobs by newest auto-refresh (the same tie rule as the results list).',
              '**NO DUPLICATE ROWS.** The same company, category or job never appears twice.',
            ],
          },
          {
            label: '3 · How the dropdown behaves',
            items: [
              '**EACH ROW:** Company — building icon + name, label *Công ty*. Keyword — search icon + category name. Job — briefcase icon + job title (one line, ellipsis), label *Việc làm*. The part matching the query is **bold**.',
              '**PASTING IS TYPING.** A pasted keyword triggers the same suggestions as a typed one — the SRM-1052 report was a paste.',
              '**STARTS AT 2 CHARACTERS.** One letter only returns noise.',
              '**ANONYMOUS POSTINGS (SRM-737)** appear in Jobs as a normal job row and NEVER make their employer appear in Companies or count toward its open jobs. Typing the real company name must not reveal them.',
              '**NO “KHÔNG CÓ KẾT QUẢ”.** The dropdown cannot know what a full search will find (Enter also reads descriptions and requirements), so it never claims there is nothing. With no suggestion it says **“Không có gợi ý cho ‘…’ — nhấn Enter để tìm”** / *“No suggestions for ‘…’ — press Enter to search”*.',
              '**ENTER WITHOUT PICKING A ROW** runs the full keyword search on what was typed — unchanged.',
              '**LOCATION CHIP** filters the Jobs group only. Companies and Keywords ignore it.',
              '**KEYBOARD:** ↑ ↓ move through all rows across groups, Enter opens the highlighted row, Esc closes.',
              '**UNCHANGED:** the panel footer (turn off suggestions · close), the followed-companies panel beside the list, and what shows before anything is typed.',
            ],
          },
        ],
      },
    },
    {
      name: 'Recommended jobs (NEW logic) — matched to a jobseeker’s profile',
      slug: 'recommended-jobs-new-logic',
      site: 'Logic',
      scope: ['BE', 'FE'],
      ready: true,
      notes: '✅ NEW LOGIC — BUILD FROM THIS PAGE. Supersedes → Recommended jobs (OLD logic), which is kept only for reference. JOBSEEKER ↔ JOB. The personal feed — “jobs for you”, from the profile and every CV. Needs a signed-in jobseeker. Not to be confused with Relevant jobs, which compares one job to another and needs nobody signed in.',
      detail: {
        requirements: [
          {
            label: '0 · The idea in one minute',
            text: 'If you only need the idea, read this section and stop.\n\nWe know two things about a jobseeker. **What they told us** — their profile, their work preference, their CV. And **what they actually do** — the jobs they open, save and apply to. Put the two together and you have a picture of the work they want.\n\nWe score every open job against that picture, keep the **80 closest**, throw away the ones they have already applied to, and spread those 80 across the four places on the site where recommendations appear. Only **Batch apply** shows them in strict score order, because that is the screen where getting the order right matters most.\n\nVN — Ghép “những gì ứng viên khai” với “những gì ứng viên thực sự bấm vào” thành một chân dung. Chấm điểm mọi tin đang mở so với chân dung đó, giữ 80 tin gần nhất, bỏ tin đã ứng tuyển, rồi rải ra 4 chỗ. Riêng Batch apply xếp đúng theo điểm.',
            table: {
              cols: ['Step', 'In one line', 'Detail in'],
              rows: [
                ['**1 · Who are they?**', 'What they declared **+** what their behaviour says. One wider set of roles, categories and cities.', 'sections 5 and 8'],
                ['**2 · Which jobs fit?**', 'Score every open job out of 100 against that set.', 'sections 7 and 9'],
                ['**3 · Keep the best 80.**', 'Drop anything they already applied to.', 'sections 4 and 6'],
                ['**4 · Spread them out.**', 'The 80 are shuffled across the four surfaces — except Batch apply, which takes them in score order.', 'sections 2 and 3'],
              ],
            },
            items: [
              'THE FOUR PLACES RECOMMENDATIONS APPEAR: the end of **onboarding** · the **job detail** page · **Batch apply** · **My dashboard**. One pool of 80 feeds all four, so a jobseeker does not meet the same six cards everywhere they go.',
              'WHY SHUFFLE AT ALL. Showing the same ranked list on four screens wastes three of them. Spreading one pool around means each surface shows something the jobseeker has not already scrolled past — and the pool is already the 80 best, so nothing poor gets through either way.',
              'WHY BATCH APPLY IS THE EXCEPTION. It is the screen where somebody ticks several jobs at once, so position really does decide what gets applied to. There the order is strictly by score, highest first, and nothing is shuffled.',
              'THE SCORE IS INTERNAL. The jobseeker never sees a percentage anywhere. It picks the 80 and orders Batch apply; that is all it does.',
            ],
          },
          {
            label: '1 · How we pick the jobs to show',
            text: 'Four stages: NARROW → SCORE → REMOVE → ARRANGE.\n\nThe score is an internal number. The jobseeker never sees it — it only decides what order the cards come in.\n\nVN — Bốn bước: thu hẹp → chấm điểm → loại bỏ → sắp xếp. Điểm số chỉ dùng nội bộ để xếp thứ tự, ứng viên không nhìn thấy con số đó.',
            table: {
              cols: ['Stage', 'What happens', 'Written up in'],
              rows: [
                ['**1 · Narrow**', 'One database query picks the jobs worth scoring, from what the jobseeker wants and what they have been doing.', 'sections 5 and 6'],
                ['**2 · Score**', 'Every job in that set gets a number from 0 to 100.', 'sections 7 and 13'],
                ['**3 · Remove**', 'Drop jobs they already applied to, dismissed, or that expired.', 'section 4'],
                ['**4 · Arrange**', 'Keep the top 80, then shuffle them across the four surfaces — except Batch apply, which takes them in score order.', 'sections 2 and 3'],
              ],
            },
            items: [
              'WE USE WHAT THEY SAID **AND** WHAT THEY DID. Work preference and CV say what they want and what they can do. Their saves, views and applications say what they actually go for. The second one is new, and section 5 is where it is written up.',
              'WE NEVER HIDE THE LIST. Even a brand-new jobseeker still sees jobs — just less personalised ones, under the same heading as everybody else. Section 14.',
              'WE CALCULATE FRESH EVERY TIME and never store the list. Jobs expire and new ones arrive daily, so a stored list is wrong within hours.',
              'EVERY TIME THE FEED IS SHOWN, IT ALSO WRITES — one log row per card displayed. That log is the only way the score can ever be checked or improved. Section 20.',
            ],
          },
          {
            label: '2 · One pool of 80, shuffled across the four surfaces',
            text: 'Scoring produces a ranked list. We do NOT then print the top 6 of that list on every screen.\n\nTHE RULE: keep the **top 80**, and let each surface draw from that pool in a shuffled order. The jobseeker meets different cards on the dashboard than on a job detail page, and all of them are still drawn from their own 80 best.\n\nTHE ONE EXCEPTION: **Batch apply** takes the pool in strict score order, highest first, with no shuffling.\n\nVN — Giữ 80 tin tốt nhất, rồi mỗi chỗ lấy ra theo thứ tự xáo trộn. Riêng Batch apply xếp đúng theo điểm, không xáo.',
            table: {
              cols: ['Surface', 'Order', 'Why'],
              rows: [
                ['End of **onboarding**', 'Shuffled', 'First impression. Variety matters more than precision — they have told us very little at this point anyway.'],
                ['**Job detail** page', 'Shuffled', 'Sits beside the job↔job list, which is already ordered. Two ranked lists on one page compete with each other.'],
                ['**My dashboard**', 'Shuffled', 'The screen they return to most. A list frozen in rank order looks dead on the third visit.'],
                ['**Batch apply**', '**Strict score order**', 'They tick several jobs at once here, so position decides what actually gets applied to. This is the one place rank has to be honest.'],
              ],
            },
            items: [
              'SEEDED SHUFFLE — REQUIRED. Never call a plain random function. The seed is the jobseeker’s id plus today’s date. Then the order is **stable all day** — they can find the card they saw this morning — and **different tomorrow**. A truly random order means they can never go back to a job they half-remember, and we can never reproduce what they were shown when they complain.',
              'NO PER-COMPANY SCORING RULE. We do not compare companies or reserve slots for them. The pool is the 80 best jobs for this person, full stop.',
              'ONE COMPANY PER ROW — REQUIRED. Within a single rendered row, never show the same company twice: take the first card from that company, skip the rest, and pull the next card from the pool instead. Shuffling 80 can still deal three FPT Software cards side by side, and a row that reads as one employer’s advertisement is exactly what the shuffle exists to prevent. This is a de-duplication pass while rendering the row — it compares company ids, it does not compare scores and it reserves nothing.',
              'REMOVE DUPLICATE POSTINGS BEFORE THE 80 IS CUT. Same company + same job title + same location = one job, keep the newest. Otherwise one job posted twice takes two of the 80 places.',
              '80 IS A SETTING, not a fixed rule. It wants to be large enough that four surfaces do not run out of distinct cards, and small enough that everything in it is genuinely a good match. Start at 80 and let the log say whether it should move.',
            ],
          },
          {
            label: '3 · Worked example — one pool, four surfaces',
            text: 'The jobseeker’s pool after scoring and after applied jobs were removed. Showing the top 8 of the 80; the row on each surface holds 4 cards.',
            table: {
              cols: ['Job', 'Company', 'Score', 'In the pool?'],
              rows: [
                ['Senior Frontend Engineer', 'FPT Software', '92', '✅ 1st'],
                ['React Developer', 'FPT Software', '90', '✅ 2nd'],
                ['Frontend Lead', 'FPT Software', '88', '✅ 3rd'],
                ['Web Developer', 'FPT Software', '86', '✅ 4th'],
                ['Frontend Engineer', 'Tiki', '84', '✅ 5th'],
                ['UI Engineer', 'VNG', '80', '✅ 6th'],
                ['React Native Dev', 'MoMo', '78', '✅ 7th'],
                ['Frontend Intern', 'Base.vn', '71', '✅ 8th'],
              ],
            },
            items: [
              'ALL EIGHT ARE IN. Nothing is skipped for belonging to FPT Software — there is no per-company rule any more. They are simply the eight best matches for this person.',
              'WHAT EACH SURFACE SHOWS. **Batch apply** takes them in order: Senior Frontend Engineer, React Developer, Frontend Lead, Web Developer. **My dashboard** draws 4 from the shuffled 80 and might show UI Engineer, Frontend Lead, React Native Dev, Frontend Intern. **Job detail** and **onboarding** draw their own four the same way. Same pool, four different rows.',
              'THE ROW GUARD IN ACTION. If the dashboard’s shuffle happened to deal Senior Frontend Engineer, React Developer and Frontend Lead together, the row keeps the first and takes the next non-FPT card instead. One company per row, decided while rendering.',
              'THE SAME ROW ALL DAY. The jobseeker reloads the dashboard at lunch and sees the same four cards, because the shuffle is seeded on their id and today’s date. Tomorrow it deals a different four from the same pool.',
            ],
          },
          {
            label: '4 · A job they applied to never comes back',
            text: 'Once a jobseeker has applied to a job, that job is gone from their recommendations. Permanently.\n\nIt does not matter what happened to the application afterwards — whether they withdrew it, the employer rejected it, or they were hired. Applied is applied.\n\nVN — Đã ứng tuyển là ẩn vĩnh viễn. Không quan tâm hồ sơ sau đó bị huỷ, bị từ chối hay đã trúng tuyển.',
            items: [
              'ONE CHECK, NOT A STATUS TABLE: does an application row exist for this jobseeker and this job? Yes → the job never appears in the feed again. There is nothing else to look at.',
              'THE SAME ANSWER ON EVERY SCREEN that asks this question — this feed, the relevant-jobs list on a job detail page, and the “ẩn việc đã ứng tuyển” switch on Saved jobs. One definition, no per-screen variation.',
              'HIDDEN IS NOT DELETED. The job still appears in search, on the company page, and in the jobseeker’s own “Việc làm đã ứng tuyển” list. It is only kept out of a feed whose whole purpose is “what to do next”.',
              'IT STILL COUNTS AS BEHAVIOUR. An application is the strongest signal we have about what this person wants, so the job’s role, category and city go on shaping their feed (section 5) even though the job itself is now hidden.',
              'REMOVE THEM BEFORE THE 80 IS CUT, not after. Otherwise a jobseeker who has applied to twenty jobs this month gets a pool of 60, and the pool quietly shrinks as they use the product.',
            ],
          },
          {
            label: '5 · What we know about the jobseeker — what they SAID and what they DID',
            text: 'Until now the feed only read what the jobseeker TYPED: their work preference and their CV. That is one wizard, filled in once, often in a hurry.\n\nWhat they actually open, save and apply to describes them better — and we already store all three. Nothing new has to be collected.\n\nTHE RULE: behaviour does not replace what they typed. It ADDS to it. The result is a slightly wider set of job roles, categories and cities. The scoring in section 7 then runs exactly as before, on the wider set.\n\nVN — Hành vi KHÔNG thay thế những gì ứng viên khai, chỉ MỞ RỘNG thêm. Kết quả là tập job role / category / tỉnh thành rộng hơn một chút; cách chấm điểm giữ nguyên.',
            table: {
              cols: ['What they did', 'How many times before it counts', 'Why'],
              rows: [
                ['**Applied** to a job', '**1**', 'Applying takes real effort. One application is already a clear statement.'],
                ['**Saved** a job', '**1**', 'Nobody saves a job by accident either.'],
                ['**Opened** a job', '**3 different jobs**', 'One click means almost nothing — a title caught their eye. Three jobs of the same role is a pattern.'],
              ],
            },
            items: [
              'WHAT WE TAKE FROM EACH JOB THEY ACTED ON: its **job role**, its **category**, its **city**. Nothing else — not the salary, not the company, not the skills.',
              'ONLY THE LAST 90 DAYS. What somebody looked at a year ago is not what they want now.',
              'KEEP AT MOST 3 OF EACH — top 3 roles, top 3 categories, top 3 cities, by how often they appear. Without a limit the set grows until it matches everything, and the feed stops being personal at all.',
              'WORKED EXAMPLE. The jobseeker declared *Marketing · HCMC* in their profile. Over the last month they saved 2 accounting jobs and opened 5 more. **Kế toán** now joins their role set, so accounting jobs in HCMC start appearing beside the marketing ones — and we never had to ask them to go back and edit their profile.',
              'DO **NOT** ALSO GIVE BONUS POINTS FOR BEHAVIOUR. That would count the same evidence twice — once by widening the set, once by scoring it. Behaviour changes **which jobs are considered**, never **how a job is scored**.',
              'ONE MORE USE, AND ONLY ONE: when two jobs have the SAME score, show the one they have not opened yet first. A job they already looked at and walked away from should not take the top slot twice.',
              'NOTHING HERE NEEDS A NEW TABLE. `job_view`, `scrap` and `job_application` all exist today and the feed reads none of them. ⚠ One limit to design around: `job_view` keeps ONE row per (jobseeker, job) holding the LAST view time — so we can count how many DIFFERENT jobs they opened, never how many times they opened one.',
              'IT IS PERSONAL DATA. Behaviour is read to order one person’s own feed and for nothing else. It is never shown to employers, never joined into anything employer-facing, and never used to explain a card (“because you looked at…” is not copy we want to write).',
            ],
          },
          {
            label: '6 · The job pool — why a good match can be missed entirely',
            text: 'Stage 1 does not score every open job. It takes at most **500**, and today it takes the **500 newest** that pass the filter.\n\nSo if 3,000 jobs pass the filter, 2,500 are thrown away before anybody scores them. A job that would have matched 98% but was posted last month never appears — not because it lost, but because it was never judged.\n\nVN — Hệ thống chỉ chấm điểm tối đa 500 tin, và hiện lấy theo NGÀY ĐĂNG mới nhất chứ không phải theo độ phù hợp.',
            table: {
              cols: ['The jobseeker', 'How many jobs pass the filter', 'Is the 500 limit reached?'],
              rows: [
                ['Filled in work preference properly', 'roughly 200–400', 'No — never reaches 500.'],
                ['Left work preference mostly empty', 'almost every open job', '**Yes, hard.** They only ever see the newest 500.'],
              ],
            },
            items: [
              'IT HURTS THE PEOPLE WE CAN HELP LEAST. Someone who told us nothing has the widest filter, so they are the one who gets cut — and their feed is already the weakest one we produce.',
              'THE FAILURE IS INVISIBLE. The row still comes back full. It is full of RECENT jobs that do not fit, which reads as a bad algorithm rather than a missing pool, so nobody thinks to raise the number.',
              '**① RECORD IT FIRST — Phase 1.** Add one flag to the log row saying the 500 limit was reached. It is one column, and it is the only way to find out whether this ever actually happens before building anything to fix it.',
              '② THEN, IF THE LOG SAYS IT MATTERS: count before fetching. If fewer than about 2,000 jobs pass the filter, score all of them. The counting query is cheap.',
              '③ THE PROPER FIX: order the pool by how many of the jobseeker’s wanted roles / categories / cities each job hits, and only then by date. Then the 500 we keep are the 500 most likely to score well, instead of the 500 most recent.',
              'WHY NOT JUST SCORE ALL 3,000? The arithmetic is cheap — 8 comparisons per job. The cost is READING 3,000 jobs together with their roles, skills and locations, and then repeating that once per CV. The goal is to keep 500, but to keep the RIGHT 500.',
            ],
          },
          {
            label: '7 · How the score is calculated',
            text: 'Eight signals, 100 points in total. Each signal compares ONE thing between the job and the jobseeker, and the points are added up.\n\nThe point values are FIXED IN THE CODE. There is no admin screen for them — section 20 says why, and what replaces it.\n\nVN — Tám tiêu chí, tổng 100 điểm. Trọng số cố định trong code, không có màn hình admin để chỉnh.',
            table: {
              cols: ['Signal', 'Points', 'What is compared'],
              rows: [
                ['**Occupation & role**', '**42**', 'ONE signal, not two. How close the posting sits to what this jobseeker wants in the **Category › Group › Role** tree — their declared roles and category, plus the ones learned from behaviour (section 5). Four rungs: same role → same group → same category → unrelated. See section 9.'],
                ['**Location & work type**', '**20**', 'City, plus remote / hybrid / on-site.'],
                ['**Experience & level**', '**14**', 'Years of experience, and seniority.'],
                ['**Salary**', '**12**', 'The job’s band against what they asked for. Across currencies, converted with the stored rate.'],
                ['**Industry**', '**5**', 'The company’s industry against the industries they want.'],
                ['**Skills**', '**4**', 'CV skills against job skills. Small ON PURPOSE — section 12.'],
                ['**Education**', '**3**', 'Education level required against education held.'],
                ['**Total**', '**100**', ''],
              ],
            },
            items: [
              'OCCUPATION & ROLE IS THE BIGGEST SIGNAL, and it should be: it is the one thing that says what the person would actually DO all day. Every other signal describes the circumstances around the job rather than the job itself.',
              'ROLE AND CATEGORY ARE **ONE** SIGNAL, NOT TWO, because every job role belongs to exactly one category (`job_role.job_category_id`). Matching the role therefore matches the category automatically — scoring both would award 42 points twice over for a single fact, and would hand 24 of them to a job that only shares the category. They are the SAME measurement at two resolutions, so they share one budget and the finer answer wins. Section 9 has the rungs.',
              'SKILLS IS ONLY 4 POINTS — a decision about DATA, not about importance. The skill list has 731 rows, zero aliases, and skills authored for 26% of job roles. Section 12 states what has to be true before it goes up.',
              'THE JOBSEEKER NEVER SEES THIS NUMBER. It sorts the cards and does nothing else. What tells them how confident we are is the HEADING above the list — section 14.',
              'THE EMPLOYER SIDE RUNS THE SAME CALCULATION read from the other end, and there the number IS printed beside an applicant. That is the one place the rules differ — section 13.',
            ],
          },
          {
            label: '8 · Every signal — where it comes from, and what it scores',
            text: 'One row per signal. Read it across: where we get that fact about the jobseeker, then what a job earns for matching it.\n\nThe jobseeker has three sources and only the first is guaranteed: **Profile** (always there), **Work preference** (often empty), **CV** (often absent). So the middle column lists everything we look at, and says what to do when all of it is empty.\n\nVN — Mỗi tiêu chí một dòng. Đọc ngang: lấy thông tin ứng viên từ đâu, rồi tin tuyển dụng khớp thì được bao nhiêu điểm.',
            table: {
              cols: ['Signal', 'Where it comes from on the jobseeker', 'What a job scores for matching it'],
              rows: [
                ['**Occupation & role**\n**42**',
                 'Use ALL at once: desired roles (≤3) **+** desired category **+** roles and categories learned from behaviour.\n\n**If all of that is empty:** the job title and its category from the most recent position on their CV.',
                 'Same **role** → **42** declared / **34** inferred\nSame **Group**, other role → **30** / **24**\nSame **Category**, other group → **17** / **14**\nDifferent category → **0**'],
                ['**Location**\n**20**',
                 'Use ALL at once: desired cities **+** cities learned from behaviour.\n\n**If empty:** the city on their Profile.',
                 'Right city **and** right work type → **20** declared / **16** inferred\nA **REMOTE** posting → **20**, from anywhere\nRight city, other work type → **14**\nNeighbouring province → **10**\nAny other province → **0**'],
                ['**Experience**\n**14**',
                 'Years of experience on their **Profile**.\n\n**If empty:** computed from the work history on their CV.',
                 'Inside the posting’s range → **14**\nPosting says “no experience required” → **14**\nUp to 2 years over → **10**\nUp to 1 year under → **7**\nMore than 2 years over → **5**\nMore than 1 year under → **0**'],
                ['**Salary**\n**12**',
                 'Desired salary in their work preference.\n\n**No fallback** — nobody can guess this.',
                 'Inside the band, or the band is entirely above it → **12**\nAsking up to 10% over → **8**\nAsking 10–20% over → **4**\nEither side says “Thỏa thuận” → **6**\nAsking more than 20% over → **0**'],
                ['**Industry**\n**5**',
                 'Desired industries in their work preference.\n\n**If empty:** the industries of the companies on their CV.',
                 'The company’s industry is one they want → **5** declared / **4** inferred\nA sibling industry under the same parent → **3**\nUnrelated → **0**'],
                ['**Skills**\n**4**',
                 'The skills on their CV.\n\n**No fallback.**',
                 'Every skill the posting asks for is on the CV → **4**\nSome of them → 4 × (matched ÷ required); a skill marked ESSENTIAL counts twice on both sides of that fraction\nNone in common → **0**'],
                ['**Education**\n**3**',
                 'The education on their CV.\n\n**No fallback.**',
                 'Meets or exceeds what is asked → **3**\nPosting says “no requirement” → **3**\nOne level below → **1**\nTwo or more levels below → **0**'],
              ],
            },
            items: [
              'THE MIDDLE COLUMN HAS TWO HALVES AND THEY WORK DIFFERENTLY. The list before the break is **combined** — use every part of it at the same time. The line after **If empty** is a **last resort** — read it only when that whole list came out with nothing in it, never as an extra on top.',
              'THE ORDER TO IMPLEMENT IT IN, per signal — three steps, no ambiguity. **①** Build the set from the combined list. **②** Is it EMPTY? Only then read the “If empty” line. **③** Still nothing → that signal scores **0** (section 13).',
              'DECLARED vs INFERRED. A value the jobseeker TYPED scores the left number. A value we worked out ourselves — from their behaviour, or from the “If empty” line — scores the right one, which is **80% of it, rounded**. They never said it, so we claim slightly less. Experience, salary, skills and education have one number each because they are read from one place.',
              'WITH PROFILE + CV AND NO WORK PREFERENCE AT ALL, the “If empty” lines still reach occupation, location, experience, industry and education — 84 of the 100 points. Only salary (12) is out of reach entirely. That is the whole reason that column exists.',
              'WITH PROFILE ONLY — no CV, no work preference, no behaviour yet — almost nothing can be compared and nearly every signal scores 0. That is honest: we have been told nothing. The feed then falls back to the newest and most-applied-to jobs, in the jobseeker’s own city if the Profile states one.',
            ],
          },
          {
            label: '9 · The rules behind that scoring table',
            text: 'Six rules that apply across every signal in section 8. None of them is visible in the numbers themselves.',
            items: [
              'ONE RUNG ONLY, THE HIGHEST THAT APPLIES. Any job matching the declared role scores 42 and does NOT also collect the Group and Category rungs underneath it — they are steps on one ladder, not points to be added up.',
              'READ THE TREE THE RIGHT WAY UP: a **Category** contains **Groups**, and a Group contains **Roles**. 21 categories, 477 roles. The middle rung is the one that earns its place — without it the ladder jumps straight from one role to a bucket holding 42 of them, and a Frontend Developer lands level with a Data Engineer.',
              'THE SAME TREE AS → [Relevant jobs](/m/job-management/relevant-jobs-matched-to-another-job), deliberately. That page scores job-against-job on **Category › Group › Role** with the same four rungs at the same proportions (45 / 32 / 18 / 0 against our 42 / 30 / 17 / 0). Two recommendation surfaces built on two different models of one tree is how a dev ends up writing the distance function twice and getting different answers.',
              '**UNTIL SRM-1315 LANDS THERE IS NO GROUP TIER** — `job_role` carries only `job_category_id` today. Build the ladder with all four rungs anyway and let the Group rung return nothing; the score then steps 42 → 17 → 0. Writing it as two rungs now means rewriting the distance function later.',
              'A DIFFERENT CATEGORY SCORES 0 BUT IS NOT EXCLUDED HERE. The filtering happens in stage 1 (section 6), which already narrows to the jobseeker’s categories — so do NOT add a second gate inside the score.',
              'OVER-QUALIFIED BEATS UNDER-QUALIFIED, on purpose. Someone with 6 years against a 2–4 year posting can do the job; someone with 1 year cannot yet. The points say so.',
              'A POSTING WITH SEVERAL ROLES takes its BEST-SCORING role, not an average. A posting looking for either a Content Marketer or a Brand Manager should not be punished for being open to two.',
              '“THỎA THUẬN” IS A STATED ANSWER, NOT A BLANK — 6 points, half credit. A large share of Vietnamese postings say it, and scoring them 0 would push most of the market to the bottom of every feed. A posting whose salary field is genuinely EMPTY still scores 0 (section 13). Same rule on the jobseeker’s side when they tick “lương thương lượng”.',
              'THE NEIGHBOURING-PROVINCE BAND NEEDS A SMALL TABLE in master data — roughly 10 pairs covering the two metro areas (HCMC ↔ Bình Dương / Đồng Nai / Long An, Hà Nội ↔ Bắc Ninh / Hưng Yên). Without it that band scores 0 and somebody in Thủ Đức never sees a job in Dĩ An, 8km away.',
              'ROUND ONCE, AT THE END. Round each signal and the rounding errors add up to a visible difference between two jobs that matched identically.',
              'THE OTHER SIGNALS DO NOT OVERLAP THE WAY ROLE AND CATEGORY DID. **Industry** is what the COMPANY does, **occupation** is what the JOB is — a Marketing role at a bank is Marketing × Banking, two independent facts. **Experience** and **level** already share one budget. **Skills** are derived from roles in the occupation graph, so they correlate — but the skills come off the CV (what the person CAN do) and the role off their preference (what they WANT), which are different claims, and 4 points is too small to distort anything either way.',
            ],
          },
          {
            label: '10 · Worked example',
            text: 'Job: Senior Frontend Engineer · role **Frontend Engineer** · Hồ Chí Minh · 3–5 years · needs React, TypeScript, Git, Docker, AWS · 30–45 triệu · IT category · Software industry. **It states no education requirement.**\n\nJobseeker: 4 years’ experience · has React, TypeScript, Git · wants role **Frontend Engineer** · wants Hồ Chí Minh · wants 35 triệu · wants IT · wants Software · has a Bachelor.',
            table: {
              cols: ['Signal', 'Points possible', 'Points earned', 'Why'],
              rows: [
                ['Occupation & role', '42', '**42**', 'Wants Frontend Engineer; the job’s role IS Frontend Engineer — the top rung. Its group and the IT category come with it and are NOT scored again.'],
                ['Location & work type', '20', '**20**', 'Wants HCMC, job is in HCMC.'],
                ['Experience & level', '14', '**14**', '4 years sits inside 3–5.'],
                ['Salary', '12', '**12**', '35 triệu sits inside 30–45.'],
                ['Industry', '5', '**5**', 'Wants Software, company is Software.'],
                ['Skills', '4', '**2**', 'Matched 3 of the job’s 5 skills → 4 × ⅗ = 2.4, rounded to 2.'],
                ['Education', '3', '**0**', '⚠ The job states no education requirement, so there is nothing to compare. **0 points — and the 3 points are NOT redistributed.**'],
                ['**TOTAL**', '**100**', '**95**', 'Always out of 100. Section 13.'],
              ],
            },
            items: [
              'LOOK AT THE EDUCATION ROW — it is the whole of section 13 in one line. The job stayed silent, so it lost 3 points. Had those 3 points been spread over the other signals instead, this job would come back as 98% rather than 95%: a higher score for saying less.',
              'MISSING TWO SKILLS COSTS 2 POINTS. That is deliberate while the skill list is unfinished (section 12) and it is the lever to pull once it is fixed — not the formula.',
              'THE JOBSEEKER SEES NONE OF THIS. No percentage on the card. What they see is the heading (section 14) and, if we show a reason at all, the two signals that earned the most: here “Frontend Engineer · Hồ Chí Minh”. A bare percentage tells them nothing they can act on.',
            ],
          },
          {
            label: '11 · Worked example — salary in two currencies',
            text: 'Job: 1,200–1,800 USD / month. Jobseeker: expects 35,000,000 VND / month. Do they fit? The salary signal is worth 12 points, and there are three possible behaviours. Exchange rate held in master data: 1 USD = 25,000 VND.',
            table: {
              cols: ['Approach', 'What the system does', 'Result', 'Verdict'],
              rows: [
                ['① Compare the raw numbers', 'Reads “35,000,000” against “1,200–1,800” and sees a number far above the maximum.', '0 points — “asking far too much”', '❌ WRONG, and the reverse is worse: a jobseeker asking 3,000 USD against a job paying up to 30,000,000 ₫ reads as 3,000 ≤ 30,000,000 → FULL points, when they are really asking 2.5× the maximum.'],
                ['② Skip it', 'Sees two different currencies and gives full points — “we cannot tell”.', '12 points', '⚠️ Safe but blind. It gives the same 12 points to someone asking 35 triệu (a good fit) and someone asking 60 triệu (far too expensive).'],
                ['③ Convert, then compare (agreed)', 'Converts the JOB’s range: 1,200–1,800 USD × 25,000 = 30,000,000–45,000,000 ₫. Then checks 35,000,000 against that.', '12 points — genuinely inside the range', '✅ Correct, and it stays correct in the case ② cannot see: a jobseeker asking 60,000,000 ₫ is 33% above the 45,000,000 ₫ maximum → more than 20% over → 0 points.'],
              ],
            },
            items: [
              'THIS IS WHAT THE CLIENT WAS ASKING FOR — not a live currency service, just one number an admin types in and reviews every few months. That is why it is safe: it behaves like a setting, not like an external dependency.',
              'THE JOBSEEKER AND THE EMPLOYER NEVER SEE A CONVERTED NUMBER. The job still shows “1,200–1,800 USD”, the profile still shows “35,000,000 ₫”. The conversion happens only inside the comparison, so nobody is ever shown a figure they did not write.',
              'THE SALARY SIGNAL IS 12 POINTS (section 7). STORE THE RATE VERSION on every score, next to the weight version. When a score changes after the rate is updated, that is the record which explains it.',
              'IF NO RATE IS CONFIGURED, salary scores **0** for that job — not full points. Full points would hand every USD posting 12 free points over a VND posting that actually had to match, which is the same defect section 13 exists to remove. Scoring 0 is also what creates the pressure to set the rate: one number, typed once, and it stops being a problem. Never fall back to ①.',
            ],
          },
          {
            label: '12 · How skills are matched (the part that decides the score)',
            text: 'Skills are 4 of the 100 points. They are worth so little because the data behind them is not ready: 731 skill rows, zero aliases, job titles and typos still in the list, and skills authored for only 26% of job roles. Extraction also returns just 3–5 skills from a typical CV. The signal cannot carry more than 4 points yet, and it goes up by measurement, not by opinion — coverage past ~70% of roles with aliases in place, and a median of 5+ readable skills per uploaded CV. The short version: skills are NOT free text on either side. Both the CV and the job store a link to the same row in one master list, and matching compares those links — not words.',
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
              '① THEY ARE NOT FILTERED OUT. Skills rank, they never exclude. That candidate still scores on desired role, category, years, location and salary — 96 of the 100 points do not involve skills at all, so a candidate we could extract nothing from is still ranked on the seven signals we CAN read. They rank lower; they do not disappear.',
              '② `skill_relation` ALREADY EXISTS in the client’s database — skill↔skill edges, currently 0 rows. A few dozen hand-written edges (Python → Data Analysis, n8n → Automation) give partial credit for a neighbouring skill immediately, with no new table and no model.',
              '③ THE UNMATCHED-TERM QUEUE IS THE DISCOVERY MECHANISM. When 200 candidates type “n8n” and it is not in the list, that queue is what tells the taxonomy owner to add it. An emerging skill is invisible until someone tries to type it — which is exactly why the queue has to be staffed.',
              'ONLY 26% OF ROLES HAVE SKILLS TODAY — 122 of 477, in IT, Marketing, Design, HR and Planning. The other 16 categories (service, construction, accounting, driving, education, medical…) have none, so for those candidates and those jobs the score runs on role, location and years. On the feed that costs those jobs 4 points and nothing else — which is exactly why skills are weighted at 4 and not at 20. The points are not redistributed (section 13); there are simply too few of them to distort anything.',
              'ON THE EMPLOYER BOARD IT IS NOT FINE FOR THE CANDIDATE, so one rule protects them THERE — and only there, because that screen ranks people against each other. If a CV’s extracted skill terms did not resolve to the taxonomy, score skills as UNKNOWN and redistribute — never as “no evidence”. (On the jobseeker’s own feed this does not arise: a gap in their CV costs the same 4 points against every job, so no order moves. Section 13.) A chef whose trade has no vocabulary in our list must not rank as though they submitted a blank CV. Our data gap is not their fault, and the unmatched-term queue already tells us which case it is.',
              'AND NEVER SHOW THEM AN EMPTY PICKER — a candidate in an unauthored category gets no suggestions and almost no autocomplete hits. Either hide the skills step, or say what is happening: “Chúng tôi đang xây dựng danh sách kỹ năng cho ngành của bạn — hãy nhập kỹ năng bạn dùng, chúng tôi sẽ thêm vào.”',
              'PHASE 2, no UI change: replace exact skill matching with embedding nearness, so React ↔ Next.js and Python ↔ Pandas score partial credit automatically instead of waiting for someone to write the edge. The screen consumes one number and a reason list either way.',
            ],
          },
          {
            label: '13 · A signal with nothing to compare scores 0 — we never re-scale',
            text: 'This is the most important rule on the page.\n\nA signal with nothing to compare scores **0**, and the total is still out of 100. The points are never stretched to fill the gap.\n\nVN — Tiêu chí nào không so sánh được thì 0 điểm. KHÔNG chia lại điểm. Tổng luôn trên thang 100.',
            table: {
              cols: ['Signal', 'Job A — states everything', 'Job B — no experience / industry / education'],
              rows: [
                ['Occupation & role', '17 / 42 — same category, different group', '17 / 42'],
                ['Location & work type', '20 / 20', '20 / 20'],
                ['Experience & level', '0 / 14 — stated, did not match', '— not stated'],
                ['Salary', '12 / 12', '12 / 12'],
                ['Industry', '0 / 5 — stated, did not match', '— not stated'],
                ['Skills', '4 / 4', '4 / 4'],
                ['Education', '0 / 3 — stated, did not match', '— not stated'],
                ['**Points actually earned**', '**53**', '**53**'],
                ['**The rule — missing scores 0**', '53 / 100 = **53%**', '53 / 100 = **53%**'],
                ['*If the points were stretched instead*', '*53 / 100 = 53%*', '*53 / 78 = **68%** — wrong*'],
              ],
            },
            items: [
              'READ THE TWO COLUMNS AGAIN. Both jobs earned exactly **53 points** from exactly the same comparisons, so they must score the same. Stretching the points to fill the gap would put Job B 15 points ahead — not for being a better match, but for giving itself fewer chances to lose. That is why we do not do it: it REWARDS A JOB FOR STAYING SILENT.',
              'WHO THIS ACTUALLY AFFECTS. Every field on the job form is required, so a job created on the site always states everything. This rule exists for **migrated jobs**, which may arrive with gaps. Without it those migrated jobs float to the top of every feed — quietly, with nothing broken, nothing logged and nobody able to see why.',
              'A FIELD THE **JOBSEEKER** LEFT BLANK IS SCORED 0 TOO, and that costs nothing. A blank in their profile takes the same points off EVERY job, so the order does not move at all — and since they never see the number, a lower total is not something they can notice.',
              '⚠ THE EMPLOYER BOARD IS THE EXCEPTION, because there the number is printed next to a person. Two rules hold only on that screen. ① When FEWER THAN HALF the signals could be compared, show no percentage at all rather than a low one — an applicant with a thin profile must not read as a weak candidate. The back end already has a value meaning “nothing measurable”; this is what it is for. ② Keep the protection in section 12: when a CV’s skill terms failed to RESOLVE against our list — a chef, a driver, a site foreman — skills count as unknown and are redistributed, never scored as “no evidence”. Our data gap is not their fault.',
              'WHY THE EXCEPTION IS SAFE THERE BUT NOT HERE. On the feed we rank JOBS for one person, so a gap in the person affects every card equally and changes no order. On the employer board we rank PEOPLE for one job, so a gap in a person moves them against the others — which is exactly when re-scaling earns its keep.',
            ],
          },
          {
            label: '14 · If the jobseeker has not filled in everything',
            text: 'Not everyone completes their profile. The calculation does not change — there is simply less to compare, so the results are less accurate.\n\nTHE HEADING DOES NOT CHANGE EITHER. It is always **“Gợi ý việc làm”**. One heading, on every surface, for every jobseeker.\n\nVN — Luôn dùng một tiêu đề duy nhất: “Gợi ý việc làm”. Không đổi theo lượng thông tin.',
            table: {
              cols: ['The jobseeker has…', 'What the feed can judge', 'What carries the weight'],
              rows: [
                ['Profile only', 'Almost nothing — most signals score 0', 'Newest and most-applied-to jobs, in their city if the Profile states one'],
                ['Profile + work preference', 'What they WANT — right city, right field, right salary', 'Role, location, category, salary'],
                ['Profile + CV', 'What they CAN DO, plus role and city via the fallbacks in 2a', 'Role (from the CV’s job title), experience, skills, education'],
                ['Profile + work preference + CV', 'Everything — the full 100 points are reachable', 'All eight signals'],
                ['Any of the above, **plus 90 days of behaviour**', 'Wider and more accurate, without them typing anything', 'Roles, categories and cities learned from what they opened, saved and applied to (section 5)'],
              ],
            },
            items: [
              'WHY ONE HEADING. Wording that changes per jobseeker is a heading that has to be translated three ways, tested three ways, and explained to anyone who asks why their friend’s page says something different. The quality difference is already visible in the cards themselves.',
              'ASK FOR THE MISSING PIECE UNDER THE LIST instead — “Cho biết bạn muốn làm gì để nhận gợi ý chính xác hơn”. It is true, not a sales line: the score really does improve, and work preference also feeds employer search and job alerts.',
              'A HALF-FINISHED CV IS FINE. Fewer skills simply means fewer of the 4 skill points; nothing breaks and nothing is hidden.',
              'NO PERCENTAGE ON THE CARD, ever. The score orders the list and does nothing else.',
            ],
          },
          {
            label: '15 · SPECIAL CASE — the jobseeker has more than one CV',
            text: 'A jobseeker can have up to 3 CVs. One of them can be marked “let employers find me by this CV”. That mark is ONLY about employer search. It has nothing to do with recommendations.',
            table: {
              cols: ['Situation', 'What the recommendation feed does'],
              rows: [
                ['3 CVs, one is marked for employer search', 'Uses ALL 3 CVs. The mark is ignored here.'],
                ['3 CVs, none is marked', 'Uses all 3 CVs. Works exactly the same — nothing is missing.'],
                ['1 CV', 'Uses that CV.'],
                ['No CV at all', 'Uses the profile only. See section 14, first or second row.'],
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
            label: '16 · Where recommended jobs appear',
            text: 'Four places. Two of them are attached to a specific job, which changes the calculation slightly.',
            table: {
              cols: ['Page', 'Who sees it', 'Based on'],
              rows: [
                ['After onboarding', 'Only users who just answered the onboarding questions', 'Their new work preference. This is the reward for filling in the form.'],
                ['Homepage section', 'Everyone (all 4 cases in section 14)', 'The jobseeker’s profile + CVs'],
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
            label: '17 · MY DASHBOARD ① — “Việc làm phù hợp với bạn” (the score rail)',
            text: 'The signed-in dashboard carries TWO job sections, and they must answer two different questions — otherwise they return overlapping lists and the page reads as one rail printed twice. Neither introduces a new ranking model: this one is the match score above, section ② is the [Relevant jobs](/m/job-management/relevant-jobs-matched-to-another-job) job↔job sort. Anything wanting a third model has to justify why the two we have are wrong.',
            items: [
              'SOURCE — the match score, computed against the jobseeker’s PROFILE plus EVERY CV they hold, best score per job. Not the searchable CV specifically.',
              'GATE — open · not expired · moderation approved · exposure on. Deliberately NOT the candidate’s own visibility or searchable flag: a Hidden candidate still gets recommendations, because hiding controls who can find THEM, not what they are shown.',
              'EXCLUDED — already applied · already dismissed · saved (those belong to their own rail) · anything section ② has already taken.',
              'ORDER — drawn from the pool of 80 in the seeded shuffle, like every surface except Batch apply (section 2). The score picks WHICH 80; it does not rank this rail. Ties inside the pool cut break on profile completeness, then last-active, then CV updated-at. Recency never enters the score itself.',
              'THE CARD SHOWS THE SCORE PLUS ONE REASON LINE — “Cùng Hồ Chí Minh · Frontend Engineer”. Never the bare number: a percentage with no reason invites exactly one question and answers none of it.',
              '★ THERE IS A MINIMUM SCORE, and it is not optional. The heading is a PROMISE — “việc làm phù hợp” — and a 28% match printed under it breaks that promise in a way the user can check for themselves. Start at a provisional floor of 50 and SHOW FEWER THAN 3 RATHER THAN PAD. TopDev’s own recommendation engine lists the absence of this threshold as a known defect — a very weak match is still shown as a match whenever nothing better exists. Do not inherit it.',
              'THE FLOOR IS A MEASUREMENT, NOT A GUESS — the recommendation log required in section 20 is what sets it: the score band at which application rate stops falling is the real threshold. 50 is a placeholder until that data exists.',
              '★ COLD START — IT WORKS WITH NO CV AT ALL, and this is the assumption most likely to be got wrong. Work preference is collected at ONBOARDING and is worth 63 of 100 (location + work type 26, role + category 23, salary 9, industry 5); with education and years, a candidate holding ZERO CVs is still scored on about 94 points. Only skills (4) and language (2) need a CV — so “no CV → no recommendations” is false, and the empty state for it must not be built.',
              'IF THEY HAVE NOT DONE ONBOARDING EITHER — show the onboarding prompt, NOT jobs. Newest-jobs padding under a heading that says “phù hợp với bạn” is a claim the user can disprove at a glance, and it teaches them to distrust the rail permanently.',
              'COUNT — 3 cards visible, up to about 9 behind a horizontal scroll.',
            ],
          },
          {
            label: '18 · MY DASHBOARD ② — “Tương tự việc bạn vừa xem” (the seeded rail)',
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
            label: '19 · MY DASHBOARD — the rules that connect the two sections',
            items: [
              '★ SECTION ② CLAIMS ITS JOBS FIRST, and this is counter-intuitive enough to be worth stating plainly. Its pool is tiny — one category, one seed — while ① draws on the whole board. If ① picked first it could strip ②’s best cards and push it under its 3-card minimum, hiding the rail entirely, while ① backfills without noticing anything was taken. THE NARROW RAIL ALWAYS CLAIMS BEFORE THE WIDE ONE.',
              'ONE JOB APPEARS IN ONE SECTION ONLY. Without this the same card repeats down the page, and a dashboard that repeats itself reads as broken rather than as helpful.',
              'COMPUTE ONCE PER SESSION AND CACHE. Any dashboard that reshuffles on every load feels unreliable. Recompute when the profile or a CV changes, or after an application.',
              'THE ONLY NEW DATA EITHER SECTION NEEDS IS LAST-N VIEWED JOB IDS. Everything else — the score, the job↔job lists, their caches — already exists. Worth knowing before anyone scopes this as a large piece of work.',
              'SECTION ② IS PERSONAL, THE LIST BEHIND IT IS NOT. Relevant jobs is deliberately “the same list for everyone, signed in or not” and cached per job; what is personal here is only WHICH job seeds it. Nobody should read this rail as a reason to make that cache per-user.',
            ],
          },
          {
            label: '20 · The log — the one thing we must build so the score can be improved',
            text: 'The point values in section 7 are our estimate. Some of them are wrong. This section is about how we find out WHICH.\n\nDECIDED: there is **no admin screen for the weights**. They live in the code, as a numbered version. Changing one is a code change, reviewed like any other.\n\nVN — Không làm màn hình admin cho trọng số; trọng số nằm trong code và có đánh số version. Nhưng BẮT BUỘC phải có log.',
            table: {
              cols: ['What', 'Build it?', 'Why'],
              rows: [
                ['The weights', 'In code, with a version number', 'A weight is part of the calculation, not a setting — see below.'],
                ['**The log**', '**Yes — Phase 1**', 'One row every time a job is SHOWN, plus what happened next. Without it the numbers stay a guess for the life of the product.'],
                ['A report over the log', 'Later', 'The log runs to millions of rows and nobody reads it by hand. But the TABLE has to exist from day one.'],
                ['Admin screen for the weights', '**No**', 'Dropped.'],
                ['Admin screen for the VND/USD rate', 'Yes — keep', 'Different thing entirely: a rate is a number an operator maintains and reviews, not part of the formula.'],
              ],
            },
            items: [
              'WHY DROPPING THE WEIGHTS SCREEN IS RIGHT. Weights are not configuration — they are part of the calculation. Moving one changes what every score on the site means, so it deserves the review a code change gets, not a text box. A screen like this is also easy to get wrong in a way nobody notices: once the stored row and the code drift apart, the row is rejected for not totalling 100 and the screen goes on displaying numbers that are **not the ones being used**. A setting nobody can trust is worse than no setting.',
              'KEEP THE VERSION NUMBER even with no screen. Every score that is stored or logged carries the version that produced it. Without that, “why did my match drop from 92 to 84 after Tuesday’s release” has no answer.',
              'THE LOG ROW — candidateId · jobId · score · weightVersion · rateVersion · which page (homepage / job detail / after apply / onboarding) · **position in the list** · **whether the 500-job limit was hit** (section 6) · shown at · clicked yes/no · applied yes/no.',
              'POSITION IS NOT OPTIONAL. Cards at the top get clicked more whatever they score, so without position a good SCORE cannot be told apart from a good SLOT — and every conclusion drawn from this log depends on telling them apart.',
              'THE THREE QUESTIONS IT ANSWERS, which are the whole reason to build it. ① **Does the score work** — if jobs scored 90+ are applied to no more often than jobs scored 70, a weight is wrong. ② **Which signal earns its points** — compare applications on jobs that matched mainly on role against those that matched mainly on location. ③ **Was a change an improvement** — move one weight, ship it, compare the next period against the last.',
              'IT IS PERSONAL DATA. It records what a named person was shown and what they did. Keep roughly 12 months, then delete. Never exposed to employers and never joined into anything employer-facing.',
              'BUILD IT IN PHASE 1, even though nobody looks at it until the report exists. Adding the log later means throwing away every month of data from before it existed — which is precisely the data needed to justify the first tuning round.',
            ],
          },
        ],
      },
    },
    {
      name: 'Recommended jobs (OLD logic) — matched to a jobseeker’s profile',
      // The slug is PINNED to what the name used to slugify to, so every link already
      // shared with the client and the dev team still lands on this page.
      slug: 'recommended-jobs-matched-to-a-jobseeker-s-profile',
      site: 'Logic',
      scope: ['BE', 'FE'],
      ready: true,
      notes: '⚠ OLD LOGIC — KEPT FOR REFERENCE ONLY, do not build from this page. The design we are building is → Recommended jobs (NEW logic). JOBSEEKER ↔ JOB. The personal feed — “jobs for you”, from the profile and every CV. Needs a signed-in jobseeker. Not to be confused with Relevant jobs, which compares one job to another and needs nobody signed in.',
      detail: {
        requirements: [
          {
            label: '0 · This page is the OLD logic, kept for reference',
            text: 'Nothing on this page is being built. It is here so the reasoning behind the earlier design stays readable — the weights, the renormalise rule and the four different headings.',
            warn: 'DO NOT IMPLEMENT FROM THIS PAGE. The current design is → [Recommended jobs (NEW logic)](/m/job-management/recommended-jobs-new-logic). Where the two disagree, the NEW page wins.',
            items: [
              'WHAT CHANGED, in one line each, so you know why to look at the other page. Role and category became ONE signal on a four-rung Category › Group › Role ladder. A signal with nothing to compare now scores 0 instead of having its points redistributed. Behaviour — views, saves, applications — now widens what the jobseeker is matched against. The admin weights screen is gone. The four headings became one.',
            ],
          },
          {
            label: '1 · How we pick the jobs to show',
            text: 'We give every open job a score from 0 to 100 for this jobseeker, then show the highest first. It is the same score the employer side uses to rank applicants — one calculation, read from the other direction. Section 2 below shows exactly how the score is worked out.',
            table: {
              cols: ['Step', 'What we do'],
              rows: [
                ['1', 'Take the jobseeker’s profile (basic info + work preference) and all of their CVs.'],
                ['2', 'Take every job that is open, not expired, and approved.'],
                ['3', 'Score each job against the jobseeker. Higher score = better fit.'],
                ['4', 'Remove jobs they already applied to (section 1d), jobs they dismissed, and jobs that have expired.'],
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
            label: '1d · Jobs they are already applying to are hidden — and what “applied” means',
            text: 'Step 4 above removes jobs the jobseeker has already applied to. “Applied” needs ONE definition, because three different screens ask this same question: this feed, the relevant-jobs list on a job detail page, and the “ẩn việc đã ứng tuyển” switch on Saved jobs.\n\nTHE RULE: hide the job while the application is still LIVE. Once the application has ENDED — the jobseeker cancelled it, the employer rejected it, or they were hired — the job is allowed to appear again, because the product lets them apply to it again.\n\nVN — Ẩn việc làm khi hồ sơ ứng tuyển còn hiệu lực. Hồ sơ đã kết thúc (tự huỷ / bị từ chối / đã trúng tuyển) thì việc làm được phép hiện lại.',
            table: {
              cols: ['State of the application', 'Hide the job?', 'Why'],
              rows: [
                ['Đã nộp · Đang sàng lọc · Phỏng vấn · Đã nhận offer', '**Hidden**', 'The application is live. Showing the job again offers something they cannot do — the apply button refuses a second application while one is live.'],
                ['Đã huỷ — the jobseeker withdrew', 'Not hidden', 'They told us they are no longer applying, and they are allowed to apply again. Hiding it for good would be us making that decision for them.'],
                ['Bị từ chối', 'Not hidden', 'Re-applying is allowed — they may have added the missing skill or a better CV since. One rejection does not blacklist a job.'],
                ['Đã trúng tuyển', 'Not hidden', 'Allowed by the same rule, but almost never seen: an employer closes the posting once they hire, and closed jobs never reach this feed anyway.'],
              ],
            },
            items: [
              'ONLY FOR A SIGNED-IN JOBSEEKER — which is automatic here, because this feed does not exist for a visitor. The same rule on the PUBLIC job detail page is harder and is written up separately in → [Relevant jobs](/m/job-management/relevant-jobs-matched-to-another-job), section 1b.',
              'WHY NOT HIDE REJECTED JOBS TOO? Because the apply button does not block them. A feed that hides what the product still allows is a feed the jobseeker cannot trust — they see the job in search, open it, and the apply button works. If we ever decide a rejection should hide the job permanently, it has to change in BOTH places on the same day, or the feed and the apply button will disagree about the same job.',
              'HIDDEN IS NOT DELETED. The job still appears in search, on the company page, and in the jobseeker’s own “Việc làm đã ứng tuyển” list. We are only keeping it out of a list whose entire purpose is “what to do next”.',
              'REMOVE THEM BEFORE THE LIMIT OF 2 PER COMPANY IS APPLIED. If a company’s two slots are filled by jobs the jobseeker already applied to and only then removed, that company contributes nothing and the row quietly loses a card.',
            ],
          },
          {
            label: '2 · How the score is calculated',
            text: 'Eight things are compared between the jobseeker and the job. Each is worth a fixed number of points, adding up to 100. Add up what the jobseeker earns — that is their score for that job.\n\nWEIGHTS v4 (2026-09-19): skills cut from 20 to 4 because the skill master data is not ready. The 16 points moved to years, location and role — the three signals both sides state on purpose and that we can read for every category today.',
            table: {
              cols: ['What we compare', 'Points', 'Full points when…', 'Fewer points when…'],
              rows: [
                ['Skills', '4', '**1 point for each skill that matches, up to 4** — so 4 matching skills is full points. Deliberately small (cut from 20 on 2026-09-19): the taxonomy covers 26% of roles and has no aliases yet, so this is a tie-breaker, not a driver, until the data earns more — see 2c.', 'Two matching skills → 2 points. It is a straight count, NOT a fraction of the skills the job listed: a job that lists many skills must not score worse than one that lists few.'],
                ['Years of experience + level', '28', 'Their years are inside the range the job asks for.', 'Below the minimum: points drop in proportion. Above the maximum: a small deduction per extra year, never below 14.'],
                ['Location + work type', '26', 'The job is in a city they want (or it is remote and they accept remote).', '18 for a neighbouring province · 15 if they will relocate · 9 if the city is right but the work type is wrong.'],
                ['Desired job role + category', '23', 'The job’s role is exactly the role they said they want.', '12 if only the category matches · 5 for a related category.'],
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
              'WHERE THE WEIGHTS COME FROM — our own estimate. NOT research, and NOT from Saramin KR: their public API has no skill list at all and matches on free text, so there was nothing to copy. Do not present these numbers to the client as researched figures. What is defensible is the ORDER — years and location first because those are what recruiters actually filter on, role next because both sides state it on purpose, and skills LAST of the real signals for now: the one field whose master data is not ready (26% of roles covered, zero aliases, 3–5 skills extracted per CV). A weight must fit the data it reads. See 2c for what raises it again.',
              'THE WEIGHTS MUST BE CHANGEABLE without a code deploy, and every score must record which version produced it. See section 6.',
              'WHY 4 AND NOT 0 (2026-09-19). Removing skills outright was considered. Kept at 4 for three reasons: the plumbing — reason chips, the unmatched-term queue, the must-have flag — keeps running on real pairs instead of going dark; the Matching report can only tell us whether the signal works while it still scores something; and the weight is a CONFIG value (Matching settings, version v4), so raising it later is a saved version, not a release. At 4 points a typical 2-skill match moves a score by 2 — invisible against the 77 points of years, location and role, which is the intent.',
              'LOG EVERY RECOMMENDATION SHOWN, together with what the jobseeker did next. It is the only way to check whether a higher score really leads to more applications. See section 6.',
            ],
          },
          {
            label: '2b · Worked example',
            text: 'Job: Senior Frontend Engineer · role **Frontend Engineer** · Hồ Chí Minh · 3–5 years · needs React, TypeScript, Git, Docker, AWS · 30–45 triệu · IT category · Software industry · Bachelor. It states no language requirement.\n\nJobseeker: 4 years’ experience · has React, TypeScript, Git · wants role **Frontend Engineer** · wants Hồ Chí Minh · wants 35 triệu · wants IT · wants Software · has a Bachelor.\n\nRECALCULATED 2026-09-19 (weights v4). The same pair scored 85% under v2, 95% under v3 and scores 99% now. The candidate did not change: skills fell from 38 to 20 to 4 points, and the points moved to signals we can actually read — so a candidate whose PREFERENCES and EXPERIENCE line up scores high even when only 3 of 5 skills matched. Missing two skills now costs 2 points, where it cost 15 under v2. If that feels too generous, the lever is the weights, not the formula.',
            table: {
              cols: ['What we compare', 'Points possible', 'Points earned', 'Why'],
              rows: [
                ['Skills', '4', '3', 'Matched 3 skills × 1 point'],
                ['Years + level', '28', '28', '4 years is inside 3–5'],
                ['Location + work type', '26', '26', 'Wants HCMC, job is in HCMC'],
                ['Desired job role + category', '23', '23', 'Wants Frontend Engineer, the job’s role IS Frontend Engineer — an exact role match, so full points rather than the 12 a category-only match would earn'],
                ['Expected salary', '9', '9', '35 triệu is inside 30–45'],
                ['Industry', '5', '5', 'Wants Software, company is Software'],
                ['Education level', '3', '3', 'Bachelor = Bachelor'],
                ['Foreign language', '~~2~~', '—', 'The job asks for no language, so we skip this row'],
                ['**TOTAL**', '**98**', '**97**', 'Out of 98, because language was skipped'],
                ['**FINAL SCORE**', '**100**', '**99%**', '97 ÷ 98 × 100 = 98.98, rounded to 99'],
              ],
            },
            items: [
              'Show whole numbers only. “84.5% match” suggests a precision that nine estimates cannot support.',
              'Show the two reasons that earned the most points next to the number — here “4 năm kinh nghiệm · Hồ Chí Minh” — the two highest-CONTRIBUTING signals (weight × credit earned), which is why skills, worth 3 of 4 points, no longer make the cut. A percentage on its own tells the jobseeker nothing they can act on.',
            ],
          },
          {
            label: '2bb · Worked example — salary in two currencies',
            text: 'Job: 1,200–1,800 USD / month. Jobseeker: expects 35,000,000 VND / month. Do they fit? The salary signal is worth 9 points, and there are three possible behaviours. Exchange rate held in master data: 1 USD = 25,000 VND.',
            table: {
              cols: ['Approach', 'What the system does', 'Result', 'Verdict'],
              rows: [
                ['① Compare the raw numbers', 'Reads “35,000,000” against “1,200–1,800” and sees a number far above the maximum.', '0 points — “asking far too much”', '❌ WRONG, and the reverse is worse: a jobseeker asking 3,000 USD against a job paying up to 30,000,000 ₫ reads as 3,000 ≤ 30,000,000 → FULL points, when they are really asking 2.5× the maximum.'],
                ['② Skip it (our earlier rule)', 'Sees two different currencies and gives full points — “we cannot tell”.', '9 points', '⚠️ Safe but blind. It gives the same 9 points to someone asking 35 triệu (a good fit) and someone asking 60 triệu (far too expensive).'],
                ['③ Convert, then compare (agreed)', 'Converts the JOB’s range: 1,200–1,800 USD × 25,000 = 30,000,000–45,000,000 ₫. Then checks 35,000,000 against that.', '9 points — genuinely inside the range', '✅ Correct, and it stays correct in the case ② cannot see: a jobseeker asking 60,000,000 ₫ is 33% above the 45,000,000 ₫ maximum → more than 20% over → 0 points.'],
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
            text: 'Skills are 4 of the 100 points — cut from 38 to 20 on 2026-09-02 because extraction returns only 3–5 skills from a typical CV, and to 4 on 2026-09-19 because the master data itself is not ready: 731 rows, zero aliases, job titles and typos still in the list, skills authored for 26% of roles. The signal cannot carry more than that yet, and it is raised by measurement, not by opinion — coverage past ~70% of roles with aliases in place, and a median of 5+ readable skills per uploaded CV. The short version: skills are NOT free text on either side. Both the CV and the job store a link to the same row in one master list, and matching compares those links — not words.',
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
              '① THEY ARE NOT FILTERED OUT. Skills rank, they never exclude. That candidate still scores on desired role, category, years, location and salary — 96 of the 100 points do not involve skills at all, so a candidate we could extract nothing from is still ranked on the seven signals we CAN read. They rank lower; they do not disappear.',
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
              'ORDER — drawn from the pool of 80 in the seeded shuffle, like every surface except Batch apply (section 2). The score picks WHICH 80; it does not rank this rail. Ties inside the pool cut break on profile completeness, then last-active, then CV updated-at. Recency never enters the score itself.',
              'THE CARD SHOWS THE SCORE PLUS ONE REASON LINE — “Cùng Hồ Chí Minh · Frontend Engineer”. Never the bare number: a percentage with no reason invites exactly one question and answers none of it.',
              '★ THERE IS A MINIMUM SCORE, and it is not optional. The heading is a PROMISE — “việc làm phù hợp” — and a 28% match printed under it breaks that promise in a way the user can check for themselves. Start at a provisional floor of 50 and SHOW FEWER THAN 3 RATHER THAN PAD. TopDev’s own recommendation engine lists the absence of this threshold as a known defect — a very weak match is still shown as a match whenever nothing better exists. Do not inherit it.',
              'THE FLOOR IS A MEASUREMENT, NOT A GUESS — the recommendation log required in section 6 is what sets it: the score band at which application rate stops falling is the real threshold. 50 is a placeholder until that data exists.',
              '★ COLD START — IT WORKS WITH NO CV AT ALL, and this is the assumption most likely to be got wrong. Work preference is collected at ONBOARDING and is worth 63 of 100 (location + work type 26, role + category 23, salary 9, industry 5); with education and years, a candidate holding ZERO CVs is still scored on about 94 points. Only skills (4) and language (2) need a CV — so “no CV → no recommendations” is false, and the empty state for it must not be built.',
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
              'COMPUTE ONCE PER SESSION AND CACHE. Any dashboard that reshuffles on every load feels unreliable. Recompute when the profile or a CV changes, or after an application.',
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
      notes: 'JOB ↔ JOB. Shown on a job detail page and in the after-apply popup — “jobs like this one”. Works for visitors who are not signed in, because it never reads a profile. Not to be confused with Recommended jobs, which is JOBSEEKER ↔ JOB.',
      detail: {
        requirements: [
          {
            label: '1 · EVERY job is scored — there is no category gate',
            text: 'The job detail page and the after-apply popup show jobs similar to THE JOB ON SCREEN, not jobs matching the jobseeker. Every open posting is scored against the anchor out of 100 and the best six are shown.\n\nTHERE IS NO HARD FILTER. An earlier draft required the same job category and dropped everything else; that can leave a posting with no similar jobs at all, and an empty section is the one outcome this feature must never produce. Scoring everything removes that failure by construction — and the fallback writes itself: a posting with nothing in its own field still scores on location, level, salary and work type, so the list becomes “same city, same seniority, similar pay”. That is a reasonable suggestion, not filler.\n\nIt also has to work for a reader we know nothing about: a job detail page is PUBLIC, most readers are not signed in, and the same list is served to all of them — which is what lets it cache.\n\nVN — Mọi tin đều được chấm điểm, không lọc cứng theo category. Nhờ vậy không bao giờ có tin nào thiếu “việc làm tương tự”.',
            table: {
              cols: ['Signal', 'Points', 'Full points when…', 'Partial'],
              rows: [
                ['**Taxonomy** — where the two postings sit in the Category › Group › Role tree', '**45**', 'Same ROLE.', 'Same **Group**, different role → **32**. Same **Category**, different group → **18**. Different category → **0**.'],
                ['**Job level**', '**15**', 'Same seniority.', 'One rung apart → **9**. Two rungs → **4**. Three or more → **0**.'],
                ['**Location**', '**15**', 'Same province — or either posting is REMOTE, which is reachable from anywhere.', 'Neighbouring province in the same region → **9**. Different region → **0**.'],
                ['**Salary band**', '**10**', 'The two bands overlap. Convert first when the currencies differ, using the rate in master data.', 'Within 20% of each other → **5**. No overlap → **0**.'],
                ['**Skills**', '**8**', 'The candidate posting lists every skill the anchor lists.', 'Proportional to the ANCHOR’s count: 3 shared of 5 → 8 × 3/5 = **4.8**.'],
                ['**Industry**', '**4**', 'Same industry.', 'Same industry group → **2**.'],
                ['**Work type**', '**3**', 'Same job type.', 'Compatible (remote ↔ hybrid) → **2**.'],
              ],
            },
            items: [
              'THE TAXONOMY IS THE BACKBONE, and the middle tier is why. With 21 categories and 477 roles, jumping straight from “same role” to “same category” is too big a step — 42 roles share “IT Development · Data”, and a Frontend Developer is not a Data Engineer. **Group** is the missing rung, and the new master data has it. Until the new taxonomy is imported, Group scores as Category.\n\nVN — Cùng Role 45 · cùng Group 32 · cùng Category 18. Tầng Group là nấc thang mà build hiện tại đang thiếu.',
              'MULTI-ROLE POSTINGS TAKE THE STRONGEST RELATIONSHIP, not a ratio: compare every role of the anchor against every role of the candidate and keep the closest one. A posting that lists five roles is not penalised for being broad, and cannot raise its own score by listing more.',
              'LOCATION EARNS POINTS — it is not a tie-break. A Senior role in Hà Nội is not a substitute for someone reading a posting in Hồ Chí Minh, however well the titles line up. Jobseekers filter on location harder than on anything else, so it carries real weight here. **This is the dial to turn first** if the list feels wrong: raising it to 20 makes “same city, nearby role” beat “same role, far away”.',
              'SKILLS ARE DELIBERATELY SMALL — 8 of 100. Both sides pick from one master list, so the comparison is exact rather than text matching, but the OVERLAP between two postings is thin in practice: a typical posting lists 5–6 skills and two related postings share two or three. At 8 points a strong overlap is a useful nudge between near-equal postings, and a thin one cannot overturn the taxonomy relationship. It also degrades safely while the skill list is being rebuilt — a category whose postings carry few skills simply scores near zero here instead of behaving differently from the rest.\n\nVN — Kỹ năng chỉ 8 điểm: đủ để tách hai tin xấp xỉ nhau, không đủ để lật ngược quan hệ taxonomy.',
              'WHAT IS NOT IN THE SCORE: company size, benefits, education level, contract type, posting age. Age is the final tie-break only. Everything else either repeats a signal already counted or does not change whether one posting substitutes for another.',
            ],
          },
          {
            label: '1a · Missing data — who gets penalised and who does not',
            text: 'Two postings rarely state the same fields. The rule turns on WHICH side is silent, because the two cases mean different things.',
            table: {
              cols: ['Case', 'What we do', 'Why'],
              rows: [
                ['The ANCHOR does not state it', 'DROP that signal and redistribute its points across the rest, so the total is still 100.', 'We have no basis to compare. Scoring every candidate 0 on it would punish all of them for the anchor’s silence, and would cap every score below 100 for no reason the reader could see.'],
                ['The anchor states it, the CANDIDATE does not', 'The candidate scores **0** on that signal. No redistribution.', 'The anchor asked a question this posting does not answer, so it genuinely is less comparable. Redistributing here would promote a vague posting above one that stated its level and differed.'],
                ['Neither states it', 'Dropped, like the first row.', 'Same reason — nothing to compare.'],
              ],
            },
            items: [
              'VN — Tin đang xem không khai → bỏ mục đó, chia lại điểm, tổng vẫn 100. Tin đang xem có khai mà tin kia không khai → tin kia ăn 0 điểm mục đó.',
              'THIS IS THE OPPOSITE OF THE OLD RULE, which scored every missing signal 0 and never redistributed — so a posting that stated no level could never exceed 85 and a sparsely-filled anchor produced uniformly low scores. With no category gate to guarantee a result, redistribution is what keeps the ranking meaningful at the thin end of the market.',
              'SALARY IN TWO CURRENCIES is converted before comparing, using the admin-held rate — never a raw number comparison. Same rule as the jobseeker match score.',
            ],
          },
          {
            label: '1b · Filtering, ordering, and what the reader finally sees',
            table: {
              cols: ['Step', 'Rule'],
              rows: [
                ['Always exclude', 'The job being viewed · closed and expired postings · exposure off · companies that are not active. For a SIGNED-IN reader, also every job they have a LIVE application on — see 1c.'],
                ['Per company', 'At most **2** postings from one company, keeping its two highest-scoring.'],
                ['Order', 'Score ↓ → posted date ↓ → id ↓.'],
                ['Show', '**6 cards.** No minimum score — the list is always full while the market has six postings to give.'],
                ['Headline', 'If the TOP score is below 40, the section renders as “Việc làm khác tại {tỉnh/thành}” instead of “Việc làm tương tự”. Still six cards, no false promise.'],
              ],
            },
            items: [
              'NO MINIMUM SCORE, by design — that is the whole point of removing the gate. A low-scoring list is still the six most related postings that exist, and the reader is better served by them than by an empty strip.',
              'THE HEADLINE CHANGES INSTEAD OF THE LIST. When nothing scores well we show the same six cards under an honest title rather than hiding them. 40 is the suggested line: below it, taxonomy contributed nothing and the cards are held together by location and level alone.\n\nVN — Nếu điểm cao nhất < 40, đổi tiêu đề thành “Việc làm khác tại {tỉnh}”, vẫn hiện đủ 6 thẻ.',
              'THE SAME COMPANY IS CAPPED, NOT EXCLUDED. Two postings is enough to stop one employer filling the row, and excluding it outright throws away genuinely good matches when that company is the main employer in a niche. A separate “Việc làm khác tại {công ty}” section is a nice-to-have, not part of this rule.',
              'CACHEABLE, and this matters more than it looks: job detail pages are the highest-traffic pages on the site, and the score reads nothing about the viewer. Compute once per job, cache, recompute hourly or when the job changes. The signed-in subtraction in 1c must not break this.',
              'COST CONTROL: scoring every open posting is one pass over an indexed set, and the result is cached per job. If the pool grows past comfort, score only the most recent 2,000 open postings — still far wider than a category gate, and the ordering inside the top six does not change in practice.',
            ],
          },
          {
            label: '1c · A signed-in reader does not see jobs they are already applying to',
            text: 'Someone signed in should not be offered a job they already have a live application on — opening it would only show an apply button that refuses. So we SUBTRACT those rows. Nothing else changes: same scores, same order, same cards.\n\nThe difficulty is that this page is cached and must STAY cached. So the subtraction does not happen on the server.\n\nVN — Người đã đăng nhập không thấy những việc mình đang ứng tuyển. Chỉ bỏ bớt dòng, không đổi thứ tự.',
            table: {
              cols: ['Who is reading', 'What they see'],
              rows: [
                ['Not signed in', 'The full list, exactly as cached. Nothing is hidden — we do not know who they are.'],
                ['Signed in, nothing live', 'The same list as everyone else.'],
                ['Signed in, with live applications', 'The same list minus those jobs. Everything left keeps its position.'],
              ],
            },
            items: [
              '“LIVE APPLICATION” MEANS THE SAME THING HERE AS EVERYWHERE ELSE — đã nộp, đang sàng lọc, phỏng vấn, đã nhận offer. A withdrawn, rejected or hired application does NOT hide the job, because the jobseeker may apply again. One definition, three screens.',
              'HOW: THE SERVER SENDS ONE CACHED LIST TO EVERYBODY and the browser removes the reader’s own rows. The page already asks “have I applied to this one?” to draw the apply button, so the answer is already on its way — no extra round trip. Filtering on the server would make every job detail page a per-person page and the cache would be gone.',
              'ASK FOR MORE ROWS THAN THE SECTION SHOWS — about 12 for a row of 6. Removing two or three out of twelve still fills the row; removing them out of exactly six leaves a visibly short one.',
              'DO NOT LET CARDS VANISH IN FRONT OF THE READER. Draw the row once the answer about their own applications has arrived — the page already waits for it. Showing six cards and then deleting two makes the page jump and reads as a bug.',
            ],
          },
          {
            label: '2 · Worked example — the full arithmetic',
            text: 'The reader is on: **Senior Frontend Engineer · FPT Software · Hồ Chí Minh · Senior · IT/Software · 30–45 triệu · skills: React, TypeScript, Git, Docker, AWS** (5 skills — the denominator for the skills signal).',
            table: {
              cols: ['Candidate posting', 'Taxonomy 45', 'Level 15', 'Loc 15', 'Salary 10', 'Skills 8', 'Ind 4', 'Type 3', '**Total**'],
              rows: [
                ['React Developer · Tiki · HCM · Senior · 32–48tr · shares React, TypeScript, Git', 'same role **45**', '**15**', '**15**', '**10**', '3/5 → **4.8**', '**4**', '**3**', '**96.8 → 97**'],
                ['Backend Engineer · Shopee · HCM · Senior · 30–45tr · shares Docker', 'same group **32**', '**15**', '**15**', '**10**', '1/5 → **1.6**', '**4**', '**3**', '**80.6 → 81**'],
                ['Frontend Engineer · VNG · **Hà Nội** · Senior · 30–45tr · shares React, TypeScript', 'same role **45**', '**15**', 'khác vùng **0**', '**10**', '2/5 → **3.2**', '**4**', '**3**', '**80.2 → 80**'],
                ['Frontend **Intern** · Base.vn · HCM · Intern · 8–12tr · shares React', 'same role **45**', 'lệch 3 → **0**', '**15**', 'no overlap **0**', '1/5 → **1.6**', '**4**', '**3**', '**68.6 → 69**'],
                ['Data Engineer · MoMo · HCM · Senior · 35–50tr · shares AWS', 'same category **18**', '**15**', '**15**', '**10**', '1/5 → **1.6**', '**4**', '**3**', '**66.6 → 67**'],
                ['**Kế toán trưởng** · VNG · HCM · Manager · 30–45tr · shares nothing', 'khác category **0**', 'lệch 1 → **9**', '**15**', '**10**', '**0**', '**0**', '**3**', '**37**'],
              ],
            },
            items: [
              'THE ORDER: Tiki 97 · Shopee 81 · VNG 80 · Base.vn 69 · MoMo 67 · Kế toán trưởng 37.',
              'SHOPEE (81) EDGES VNG (80) — and this is the design working, not a rounding accident. “Different role, same city” and “same role, another region” are genuinely close substitutes, and the model says so by one point. Raise Location to 20 and VNG drops below Base.vn; that single number is the main dial on this feature.',
              'THE ACCOUNTING JOB IS STILL THERE at 37, and that is deliberate. If these six are all the market has, the reader sees six cards rather than an empty strip — under the honest headline “Việc làm khác tại Hồ Chí Minh”, because the top score cleared 40 here but would not in a thinner market. With fifty IT postings available it never appears at all.',
              'THE INTERN POSTING (69) OUTSCORES Data Engineer (67) despite paying a fifth as much: same role and same city beat same category. If that reads wrong in production, the fix is Level — raising it from 15 to 20 pushes a three-rung gap further down. Do not fix it by filtering out levels; that reintroduces the empty-section failure this design exists to remove.',
              'NOTHING HERE DEPENDS ON THE READER. Every number above is the same for a signed-out visitor and for a logged-in jobseeker, which is what lets the whole list be cached per job.',
            ],
          },
          {
            label: '3 · Phase 2 — the two things to change once there is data',
            table: {
              cols: ['When', 'Change', 'Why wait'],
              rows: [
                ['The rebuilt skill master data is live and postings routinely carry 5+ resolved skills', 'Raise **Skills** from 8 to about 15, taking the points from Taxonomy (45 → 38).', 'Skill overlap only becomes a reliable signal once both sides reliably have skills. Raising it early would make the five authored categories behave differently from the other sixteen.'],
                ['There is enough click data in the recommendation log', 'Tune every weight against it, same method as the jobseeker match score.', 'The numbers above are a reasoned starting point, not research. They are configuration and should be moved on evidence, never on opinion.'],
              ],
            },
            items: [
              'THE WEIGHTS ARE CONFIGURATION, not code — one version row, stamped on nothing (this score is never stored or shown), but changeable without a deploy and recorded so “why did this list change” has an answer.',
              'THE SCORE IS NEVER SHOWN AND NEVER LEAVES THE BACKEND. No percentage on the card, no field in the response. A reader comparing two jobs does not need a number, and publishing one invites arguments about a model that is admittedly approximate.',
            ],
          },
          {
            label: '4 · The after-apply popup — what each card shows',
            text: 'The popup that opens the moment an application is submitted (“Job application complete!”) lists 3–8 relevant jobs from the rule above and lets the candidate apply to several at once. Each card has to answer one question fast — “should I apply to this one too?” — and, per the rule that every suggestion carries its reason, it has to say WHY it is here. Fields below; anything not listed is not on the card.',
            table: {
              cols: ['Field', 'Reads from', 'Rule'],
              rows: [
                ['Checkbox', '—', 'Selects the row for the bulk button. **NOT pre-checked** — see below.'],
                ['Job title', '`job.title` in the UI language', 'One line, ellipsis. Never wraps — the card height is fixed so 5 rows scan as a list.'],
                ['Company', '`company.name`', 'Second line, regular weight. Logo optional; text is the requirement.'],
                ['**Why it is here** — reason chips', 'The signals that earned this card its points, compared to the job just applied to: **role / group / category** · **location** · **level** · **shared skills**', 'Up to three chips, highest-scoring signal first. A chip that MATCHES renders highlighted (the Korean card’s teal); a near-match renders plain with its relation — “Cùng nhóm ngành”, “Tỉnh lân cận”, “Lệch 1 bậc”. Skills appear only as a count and only when at least two are shared: “2 kỹ năng chung”.'],
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
              'THE REASON CHIPS ARE SCORING SIGNALS AND NOTHING ELSE. Every chip is a signal that actually earned points, so the card explains its own position. Do not add chips for things the score ignores (company size, benefits, contract type) — a highlighted chip the sort ignored is a lie about why the card ranks where it does.',
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

    {
      name: 'Recommended candidates — matched to an employer’s job',
      site: 'Logic',
      scope: ['BE', 'FE'],
      ready: true,
      notes: 'JOB ↔ JOBSEEKER — the EMPLOYER’S half of the match, on the company Home. The same calculation as Recommended jobs, read from the other end: there we rank jobs for one person, here we rank people for one job. SRM-1345.',
      detail: {
        requirements: [
          {
            label: '1 · What the list is anchored to — the employer’s most recent job',
            text: 'The section is anchored on A JOB. It used to be anchored on a Talent pool folder, and that can never work: `talent_pool` holds `id · company_id · name · kind · created_by · created_at · updated_at` and nothing else. No role, no level, no location, nothing to match against. **A folder is where results are SAVED. It is not the brief that produces them.**\n\nTHE ANCHOR IS THE MOST RECENT JOB THE EMPLOYER CREATED — draft or published, whichever was edited last.\n\nVN — Neo vào tin tuyển dụng gần nhất mà NTD tạo, kể cả tin nháp. Không neo vào thư mục.',
            table: {
              cols: ['The company has', 'Anchor', 'Heading'],
              rows: [
                ['One or more jobs (draft or published)', 'The one edited most recently', 'Ứng viên phù hợp với vị trí — *tên tin*'],
                ['No job at all', 'Nothing — see section 5', '**Hồ sơ mới cập nhật**'],
              ],
            },
            items: [
              'ORDER BY LAST UPDATED, NOT BY CREATED. A draft abandoned six months ago must not drive the Home page over a job the recruiter was editing this morning.',
              'THE HEADING NAMES THE JOB, and the Figma already does this — the chip reads “Backend developer with 3+ years experience…”, not a folder name. A recruiter has to be able to see what the list is answering without clicking anything.',
              'GIVE THEM A DROPDOWN to switch to another of their jobs. The most recent one is only the default.',
              'THE FOLDER DOES NOT DISAPPEAR — it changes job. It stops being the question and becomes the destination: “Lưu vào thư mục…” on each card.',
            ],
          },
          {
            label: '2 · ONE calculation — a draft is NOT a special case',
            text: 'A draft and a published job go through exactly the same scoring. There is no minimum-information check on a draft, no “is this draft good enough” gate, and no second code path.\n\nA half-filled draft is not rejected — it simply scores LOW, automatically, because of the rule in section 3. That is the whole mechanism.\n\n**Decided 2026-11-03.** VN — Một logic duy nhất. Tin nháp thiếu thông tin thì tự khắc điểm thấp, không cần luật riêng.',
            items: [
              'WHY NO GATE. A gate is a second rule that has to be maintained, argued about and kept in sync with the first one — and it would have to answer “how much information is enough?”, which nobody can answer. Letting the score fall on its own needs no answer and no extra code.',
              'A DRAFT IS WORTH ANCHORING ON. The moment a recruiter is writing a job is the single best moment in the funnel to show them matching people. Nothing is leaked: it is their own company’s draft.',
              'THE SCORING ENGINE IS `ApplicantMatch`, UNCHANGED IN STRUCTURE — the same seven signals the applicant board already uses. It does not care whether the job is published. Only the rule in section 3 changes.',
            ],
          },
          {
            label: '2b · Who counts as a candidate for this job at all — the step that carries the logic',
            text: 'Before anything is scored, the pool is narrowed to people who are plausibly candidates FOR THIS JOB. This is not a performance trick. It is the definition.\n\nTake a candidate when ANY of these is true:\n\n• their desired roles overlap the job’s roles\n• their desired category is the job’s category\n• the skills on their CV overlap the skills on the job\n\nCap the pool at **500** — the same constant the jobseeker-side feed already uses.\n\nVN — Chỉ lấy người trùng role, hoặc trùng nhóm nghề, hoặc trùng kỹ năng. Tối đa 500 người rồi mới chấm điểm.',
            table: {
              cols: ['Read from the job', 'Compared against'],
              rows: [
                ['`job_role_link` — every role on the posting', '`candidate_desired_role` (up to 3)'],
                ['`job_category_id`', '`candidate_profile.desired_category_id`'],
                ['The job’s skills', 'The skills on the candidate’s CV'],
              ],
            },
            items: [
              'WITHOUT THIS STEP THE SCORE LETS STRANGERS THROUGH. Location (21) plus experience (22) alone is 43 — over the floor in section 4 — so somebody in the same city with roughly the right number of years would qualify for a job in a completely unrelated field. The floor cannot catch that; only this step can.',
              'IT IS AN **OR**, NOT AN AND. This is a recommendation, not a search: cast wide here, then let the score in section 3 do the ranking. An AND would return almost nobody on a VN database this size.',
              'IT IS ALSO WHAT MAKES A THIN DRAFT RESOLVE ITSELF. A draft with no role, no category and no skills matches nobody at this step, so the list comes back empty and the panel falls through to section 5 — no draft-specific rule anywhere, exactly as decided in section 2.',
              'MATCH ON BOTH WHAT THEY WANT AND WHAT THEY CAN DO. Desired role and category say what they are looking for; the CV’s skills say what they are able to do. An employer needs both to be true, so both are allowed to admit a candidate here and both are scored later.',
            ],
          },
          {
            label: '3 · Information the job does not state is worth 0 — it is NOT thrown away',
            text: 'This is the one real change, and everything else above depends on it.\n\nTODAY the calculation **renormalises**: a signal the job does not state is removed, and the remaining weights are stretched back up to 100. A job that states only a location would score every candidate in that city at 100%.\n\nFROM NOW: every signal keeps its full weight, and a signal the job does not state earns **0** of it. The total is always out of the same 100.\n\nVN — Tín hiệu nào tin không khai thì được 0 điểm, không bị loại ra khỏi mẫu số. Luôn tính trên thang 100.',
            table: {
              cols: ['Signal', 'Full weight', 'Draft states only a location'],
              rows: [
                ['Kinh nghiệm', '22', '0'],
                ['Địa điểm', '21', '**21**'],
                ['Kỹ năng', '20', '0'],
                ['Nhóm nghề', '20', '0'],
                ['Lương', '9', '0'],
                ['Ngành', '5', '0'],
                ['Học vấn', '3', '0'],
                ['**Tổng tối đa**', '**100**', '**21**'],
              ],
            },
            items: [
              'THAT IS THE POINT: a draft with only a city in it can never produce a card above 21%, so it can never look like a confident match. No gate needed — the number tells the truth by itself.',
              'IT ALSO FIXES A REAL DEFECT. With renormalising, two cards side by side in one row are not on the same scale: one was scored out of 4 signals and the other out of 7, and both print a percentage. A job that states LESS scores HIGHER. Absolute scoring puts every card on the same 100.',
              '**KNOCK-ON FOR THE APPLICANT BOARD — needs a decision from the BA before build.** `ApplicantMatch` is shared with the employer’s applicant list. Switching to absolute scoring does NOT change the ORDER there (every applicant to one job is divided by the same number, so the ranking is identical either way) — it only lowers the percentage shown on a lightly-filled posting. Pick one: hide the % badge below a floor, or print “3/7 tiêu chí khớp” instead of a percentage. Do not leave it unstated, or a thin posting will show 14% against every applicant and the board will look broken.',
            ],
          },
          {
            label: '4 · One floor, applied to the result — not to the draft',
            text: 'Because a thin job scores low on purpose, there has to be a point below which the row is not worth showing. This is a floor on the OUTPUT and it applies to published jobs exactly as it does to drafts — it is not a draft rule.\n\nTHE RULE: if the best candidate scores below **40**, the anchor produced nothing usable. Drop to section 5 and change the heading.',
            items: [
              'WHY A FLOOR AT ALL: at 15% the cards are not wrong, they are meaningless, and a row of meaningless cards under a confident heading is how a recruiter learns to stop looking at that part of the page.',
              '40 IS A SETTING, not a constant in the code — it should sit beside the match weights so it can be moved without a deploy.',
              'ONE RULE, BOTH CASES. A published job with nothing filled in gets the same treatment as a thin draft. No branch, no exception.',
            ],
          },
          {
            label: '5 · When there is no usable job — “Hồ sơ mới cập nhật”',
            text: 'The section still renders. It does NOT go blank and it does NOT show an empty state here — but **the heading changes**, because the content changed.\n\nThe original problem was never “showing people when there is no job”. It was **promising a match that never happened**. Rename the section and the problem is gone.\n\nVN — Vẫn hiện section, nhưng đổi tiêu đề thành “Hồ sơ mới cập nhật”. Không gắn badge.',
            table: {
              cols: ['Step', 'Rule'],
              rows: [
                ['1 · Filter', 'The hard filters in section 6. Nothing else may appear.'],
                ['2 · Prefer', 'Candidates whose desired industry or job category matches **the company’s own industry** (`company.industry_id`) come first. Even with no job posted, we know what business they are in.'],
                ['3 · Sort', 'Most recently updated CV first — a fresh CV means someone actually looking.'],
                ['4 · Spread', 'At most ONE card per job category, or the row comes out as three QA testers.'],
                ['5 · Rotate', 'Change the set daily. Otherwise a handful of people who edit their CV often take every slot and the recruiter sees the same three faces all week.'],
              ],
            },
            items: [
              'NO “TOP PICK!” BADGE IN THIS MODE, and no percentage. There is no score, so a confidence label would be a lie. The badge belongs only to section 1–4.',
              'SAY WHY THEY ARE THERE — one quiet line under the heading: “Hồ sơ vừa cập nhật trong ngành Truyền thông – Giải trí”. One sentence is the whole difference between a suggestion and a random list.',
              'DO NOT USE YEARS OF EXPERIENCE AS A QUALITY SIGNAL, and never age or gender. More years is not better, it is only different, and it depends entirely on the role.',
            ],
          },
          {
            label: '6 · Who is allowed to appear at all',
            text: 'These run BEFORE any scoring or sorting, in every mode including section 5. A candidate who fails any of them is not in the pool.',
            table: {
              cols: ['Filter', 'Why'],
              rows: [
                ['CV search is switched ON by the candidate', 'We have no right to show someone who did not agree to be found. Non-negotiable.'],
                ['The CV is Qualified', 'The CV-quality gate already exists — see → [CV qualification](/m/resume-management/cv-qualification-apply-cv-search). A CV we could not read must never reach the company Home.'],
                ['The CV has experience, skills and education filled in', 'Below that there is nothing for a recruiter to judge, whatever the score says.'],
                ['Not already in one of this company’s pools', 'A person the company has already saved is not a discovery. Showing them again wastes the slot.'],
              ],
            },
            items: [
              'THE CARD IS THE EXISTING ONE from the Figma — years of experience, latest company, skill chips. The only additions this feature makes are the heading, the optional “Top pick!” badge, and “Lưu vào thư mục…”.',
              'THE KOREAN CHIPS IN THE FIGMA (응답률, 평균 근속) ARE NOT PART OF THIS TICKET. We hold neither a response rate nor an average tenure for a VN candidate, so they must not ship as empty chips.',
            ],
          },
        ],
      },
    },
    {
      name: 'Job tags — keyword links on the job detail',
      site: 'Jobseekers',
      scope: ['FE'],
      ready: true,
      notes: 'A strip of keyword chips at the foot of the job detail, BUILT FROM FIELDS THE JOB ALREADY HAS — industry, category, role, level, location, skills, company. Each chip opens the job search with that filter already applied. Nothing new for the employer to fill in. Decided 2026-10-28 after a client asked why the page has no tags; option A only (no SEO landing pages).',
      detail: {
        requirements: [
          {
            label: '1 · What a job tag is, and why the page has them',
            text: 'A job tag is a **link**, not a label. It takes one value the job already carries — “Kế toán / Kiểm toán”, “Hà Nội”, “React” — and opens the list of OTHER open jobs with that same value. Saramin KR (hashtags under the posting) and VietnamWorks (“Từ khoá”) both ship it.\n\nIt does two jobs, neither of them for the employer:\n\n1. **Keeps a candidate who landed on the wrong job.** Most job-detail visits come from Google or a shared link. When the job is close but not right, the reader has nowhere to go but back. One tap on “Kiểm toán” or “Hà Nội” gives them the alternatives.\n2. **Internal links for search engines.** Every job page links to the same handful of filtered lists, which tells Google those lists matter. This comes free with the chips; building real SEO landing pages for them is a separate, LATER piece of work and is NOT part of this feature.',
            items: [
              '**DECIDED 2026-10-28 — option A only.** Auto-generated chips linking to the existing search page with a filter pre-applied.\n\nConsidered and NOT taken now: (B) dedicated SEO landing pages per tag (clean URL, own title / meta) — real SEO work, deferred, not dropped; (C) employers typing their own tags — rejected outright: free-text tags invite keyword stuffing, spell the same thing five ways, and would need moderation.',
              '**THE STRIP THE BUILD HID ON 2026-09-15 IS THE STARTING POINT, NOT A NEW COMPONENT.** svn-web already has `FooterUtilities` → `TagChips` at the foot of the job detail, commented out because it (1) only printed the skill list a second time, as keyword searches, and (2) rendered a doubled hash (`##A/B Testing`). This feature replaces its DATA and fixes both faults; the slot and the chip component stay.',
              '**YES, THE CHIPS REPEAT VALUES FROM “THÔNG TIN VIỆC LÀM” — ON PURPOSE.** That block states facts; the strip is the place to act on them. VietnamWorks repeats them the same way. What was wrong in September was repeating ONLY the skills, as plain keyword searches, which added nothing.',
            ],
          },
          {
            label: '2 · Which chips, in what order, and where each one goes',
            text: 'Chips are built from the posting’s STRUCTURED fields, in the order below. A field the posting leaves empty simply produces no chip. The chip text is the catalogue name in the page language (VI / EN / KO) — the same words the “Thông tin việc làm” block prints.',
            table: {
              cols: ['#', 'Chip from', 'Posting field', 'Click opens', 'Max'],
              rows: [
                ['1', 'Industry', '`hiringBrief.industryId`', '`/search?industry=<code>`', '1'],
                ['2', 'Job category', '`jobCategoryId`', '`/search?category=<code>`', '1'],
                ['3', 'Job role', '`roleIds`', '`/search?role=<code>` — one chip per role', '3'],
                ['4', 'Job level', '`jobLevelIds`', '`/search?level=<code>` — one chip per level', '3'],
                ['5', 'Location (province)', '`hiringBrief.cityCodes`, else the working locations’ provinces', '`/search?province-code=<code>` — one chip per province', '3'],
                ['6', 'Skill', '`tags[]` where `kind = SKILL`', '`/search?skill=<code>`', '8'],
                ['7', 'Company', '`company.slug`', 'The company’s jobs page `/companies/<slug>/jobs`', '1'],
              ],
            },
            items: [
              '**ORDER IS BROAD → NARROW → COMPANY.** Industry and category first (the widest lists), then role, level, place, skills, and the employer last. The reader who wants alternatives meets the broad links first.',
              '**NEVER A CHIP FOR:** benefits (`kind = BENEFIT` — “Bảo hiểm” is not a way to find a job), salary, contract or work type, education, headcount. Only fields the search page can filter on become chips.',
              '**NO DUPLICATES.** Two chips with the same text in the same language (e.g. an industry and a category both named “Bất động sản”) collapse into the FIRST one in the order above.',
              '**ANONYMOUS POSTING (SRM-737) — NO COMPANY CHIP.** The posting hides its employer everywhere else; a company link here would undo that.',
              '**NO CODE, NO CHIP.** The search page filters on catalogue CODES; the job detail payload carries ids (and skill names). Resolve id → code through the catalogues the page already fetches. A value that cannot be resolved to a code (catalogue down, row deactivated) is DROPPED — never fall back to a free-text `?keyword=` link, which lands on a different, fuzzier list than the chip promises. If the skill tags do not carry a code today, svn-be adds it to the tag payload.',
            ],
          },
          {
            label: '3 · How the strip looks and behaves',
            items: [
              '**WHERE:** the foot of the job detail panel — the slot `FooterUtilities` already occupies — after the company block and the relevant-jobs carousel, before the page’s ad banner. Same on desktop and mobile.',
              '**HEADING:** “Từ khoá” / “Keywords” / “키워드”, then the chips wrapping onto as many lines as they need.',
              '**CHIP TEXT HAS NO “#”.** Plain catalogue name, so nothing can double it. Same chip style the page uses elsewhere; hover darkens it.',
              '**FIRST 10 CHIPS SHOW, THE REST BEHIND “+”** (the existing `TagChips` toggle; “−” collapses again). The collapse is in the markup only — every chip is in the HTML from the first render, so search engines see all the links.',
              '**REAL LINKS, SAME TAB.** Each chip is an `<a href>` rendered on the server, followable (no `nofollow`). Opening in the same tab is deliberate: the reader is leaving this job for a list, and “back” returns them here.',
              '**ZERO CHIPS → NO STRIP.** No heading, no empty gap.',
              '**THE SEARCH PAGE SHOWS THE FILTER IT WAS GIVEN.** Landing on `/search?industry=…` shows that industry selected in the filter bar, removable like any filter the reader picked. Nothing new to build here as long as the param is one `/search` already reads.',
              '**MEASURED.** Every chip link carries `entry=job-tag`, a new search-entry token next to `header-panel` / `search-bar` / `suggest`, so analytics can say how many searches the tags start. That number is what decides whether option B is ever worth building.',
              '**PREVIEW PAGE:** the employer’s job preview (`/jobs/preview`) shows the strip exactly as the live page will.',
            ],
          },
        ],
      },
    },
  ],
}
