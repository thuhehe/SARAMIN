import type { ModuleGuide } from './types'

/*
 * Job management — user guide.
 *
 * Written against the admin console on saramin-vn-admin `dev`, using the QA
 * screenshot set in docs/qa/screenshots, the tester guide in
 * docs/qa/tester-guide-en/05-job-display-job.md, and the shipped strings in
 * src/i18n/messages/en/jobs.json.
 *
 * TWO PLACES THIS GUIDE DESCRIBES THE BUILD AND THE REQUIREMENT DISAGREES, and
 * the guide follows the build because that is what an operator is looking at:
 *   · The console has an IN REVIEW status with Approve / Reject, driven by the
 *     company's `jobApprovalMode = MANUAL` (the backend default). The written
 *     requirement says there is no approval gate on either surface.
 *   · The console's posting setup is PO-first — pick the order, and the product
 *     list becomes that order's paid lines. The requirement describes the same
 *     thing, so only the review gate is a real divergence.
 * Both are flagged in the tasks below rather than quietly written as fact.
 */

const IMG = '/guide/job-management'

export const jobManagementGuide: ModuleGuide = {
  moduleId: 'job-management',
  intro:
    'For HQ operators who post on a customer’s behalf, and for whoever has to answer “why is this job not showing?”. A posting is where the money already paid turns into something a candidate can see: it spends a slot from a purchase order, it goes live under a tier, and that tier decides which areas of the jobseeker site it appears in. This is the last leg of the chain — everything Products & Packages defined and CRM sold is delivered here.',
  before: [
    'Nothing can be posted until the chain in front of it is done: the product exists (**Products & Packages**), it was sold and its **VAT invoice issued** (CRM), so the company holds quota. A posting spends that quota — it never creates it.',
    'THREE things must all be true for a job to be publicly visible: status **Open**, **Exposure = On**, and the company **Active**. Any one of them off and the job is invisible, with no error anywhere.',
    'The company decides the route: with `jobApprovalMode = MANUAL` — the backend **default** — a company’s own posting lands in **In review** and waits for HQ. A posting HQ creates does not.',
    'There is **no delete**, only **Close posting**. A posting is a paid, published record; closing it is the end of its life.',
  ],
  tasks: [
    {
      id: 'find-the-module',
      title: 'Find the module',
      where: 'Left menu → Recruitment → Jobs',
      steps: [
        'Sign in to the admin console and open **Recruitment → Jobs**. This one page is the list, and every posting opens from it.',
        'There is no separate create page in the menu: **+ New job** on the list is the only door in.',
        'Nearby in the same group: **Applicants** (who applied), **Talent pool**, **CV review** and **Resumes / candidates** — all downstream of a posting.',
      ],
      tips: [
        '`/jobs/invites`, `/jobs/applies`, `/jobs/email-campaigns` and `/jobs/categories` do not exist and are not planned — there is no backend behind them.',
      ],
    },
    {
      id: 'browse-the-postings',
      title: 'Browse the postings',
      where: 'Recruitment → Jobs',
      outcome: 'Find any posting across every company, and read its state without opening it.',
      steps: [
        'Pick a tab — **All · Draft · Schedule · In review · Open · Closed · Archived**. They follow the lifecycle, and the count beside each is the size of that bucket.',
        'Narrow with the search box (all columns), the **company** filter and the **start / end date** range.',
        'Read the row: **Job title**, **Category**, **Job ID**, **Company**, **Created by** (Company or Admin), **Status**, **Exposure** and **Posted**.',
        'Click the **job title** to open the posting.',
      ],
      shots: [
        { src: `${IMG}/jobs-list.jpg`, caption: 'The Open tab. Created by separates the company’s own postings from HQ’s.' },
      ],
      tips: [
        '**Created by matters.** Only a posting the company created itself can be routed into **In review** — an HQ posting never is.',
        'The **Exposure** toggle appears on **Open** rows only. On any other status the cell is inert, because exposure means nothing until a job is live.',
        'The list is capped at 500 rows, and search and paging happen in the browser — on a big account, filter by company first.',
      ],
      spec: 'job-list',
    },
    {
      id: 'posting-setup',
      title: 'Create a posting — step 1, the money',
      where: 'Jobs → + New job → 1 Posting setup',
      outcome: 'The posting is pointed at the right company, the right order and the right tier — before any content is written.',
      steps: [
        'Pick the **Company** (searchable by name or ID). A summary card appears with its ID, industry, size, address and an **Open company** link.',
        'Open **Purchase order (PO)**. Only that company’s orders are offered, and only ones whose **invoice has been issued** — an unpaid order buys nothing.',
        'Watch the hint under **Main product** change from *Free tier (no PO)* to *This PO’s paid lines*. That one line is the check that the whole screen is wired correctly.',
        'Pick the **Main product** — the tier, with its display duration shown beside it (*Top job · 30 days*).',
        'Optionally add **Add-on — Display placement** (extra areas beyond the tier’s own) or **Add-on — Label**. Both stay disabled until a PO and a main product are chosen.',
        'Leave **Publish at** blank to post now, or set a future date to schedule it. Set **Exposure** On.',
      ],
      shots: [
        { src: `${IMG}/posting-setup.jpg`, caption: 'Step 1 with nothing picked: Main product reads “Free tier (no PO)” and both add-ons are disabled.' },
        { src: `${IMG}/po-selected.jpg`, caption: 'Company picked, then PO — the hint under Main product has flipped to “This PO’s paid lines”.' },
        { src: `${IMG}/main-product-from-po.jpg`, caption: 'The product list is exactly that order’s paid lines, each with its display duration.' },
      ],
      tips: [
        'WITH NO PO you get only the products flagged **Free** — HQ can post those for any company, any time, unlimited. An employer never sees the free tier; on the company site they post only from what they bought.',
        'Changing the PO re-derives the product list, and changing the **Company** drops the old company’s PO. If a stale PO or product survives the switch, that is a bug worth reporting.',
        'Each add-on spends its **own line** on the same order and runs its **own window** — which is why no PO means no add-ons, free jobs included.',
        'The left rail keeps score: *N of 9 done to post*, with a **STILL MISSING** list where a coloured chip blocks saving and a grey chip blocks publishing.',
      ],
      spec: 'create-job',
    },
    {
      id: 'fill-the-posting',
      title: 'Create a posting — the other three steps',
      where: 'Jobs → + New job → 2 Job information · 3 Job content · 4 Candidate expectation',
      outcome: 'A posting a candidate can read, filter and apply to.',
      steps: [
        '**2 Job information** — the facts candidates filter on: category, role, level, work type, contract type, skills, salary and **Working location**.',
        'Pick the working location from the company’s own saved offices — it is a multi-select, capped at 3, and the **first one picked** is what shows on cards and in search results.',
        '**3 Job content** — title, description, requirements and benefits, each with a Vietnamese and an English tab. Vietnamese is what blocks publishing.',
        '**4 Candidate expectation** is optional: headcount, years of experience, minimum education, and the demographic group.',
        'Finish with **Save as draft**, or **Post** to publish.',
      ],
      tips: [
        'ALL THREE BUTTONS SAVE FIRST. A publish that fails because the quota ran out still leaves the draft — retry from the same screen rather than re-typing it.',
        'The form autosaves to your browser. Reloading mid-entry shows an **Unsaved changes recovered** banner with **Restore** and **Discard**.',
        'A location belonging to another company is refused (the same message as an unknown one, deliberately, so the error cannot be used to probe other accounts).',
        'The demographic fields carry a legal warning: nationality, gender, marital status and age are sensitive in Vietnamese job ads. Confirm with the client before collecting them.',
        'Editing a pre-migration posting drops any legacy detail block it still carries — the form says so in a banner before you save.',
      ],
      spec: 'create-job',
    },
    {
      id: 'read-a-posting',
      title: 'Read a posting, and check the tier landed',
      where: 'Jobs → open a posting',
      outcome: 'You can answer “what is this job doing right now” from one screen.',
      steps: [
        'Read the **POSTING STATE** panel on the right: **Exposure**, **Current tier** and **Publish at**.',
        'Check **Current tier** against the Main product picked in step 1 — they must be the same. This is where a wrong product shows up.',
        '**ENGAGEMENT** carries the only three real counters: Views, Saves, Applications. Nothing there is derived, and nothing is editable.',
        '**CLASSIFICATION** and **HIRING BRIEF** restate what the job asks for; the body has Vietnamese and English tabs.',
        'Act from the header: **Edit**, **Applicants (N)**, **Upgrade tier**, **Close posting**.',
      ],
      shots: [
        { src: `${IMG}/job-detail.jpg`, caption: 'POSTING STATE is the panel to read first — Current tier must equal the Main product that was picked.' },
      ],
      tips: [
        'There is **no delete and no history tab**. Closing is the only way out, and job writes are not audited by the backend.',
        'Card artwork exists only on the two Platinum tiers. A **Basic** posting shows an empty artwork section and always will.',
        '**Close posting** stops applications and takes the job off the public site immediately.',
      ],
      spec: 'job-list',
    },
    {
      id: 'approve-a-company-posting',
      title: 'Approve or reject a company’s posting',
      where: 'Jobs → In review → open a posting',
      outcome: 'A posting the company wrote is either live or back with them, with a reason.',
      steps: [
        'Open the **In review** tab. Everything in it was created by a company whose `jobApprovalMode` is MANUAL — the default.',
        'Read the posting as a candidate would, then decide from the header.',
        '**Approve** moves it straight to Open and it becomes publicly visible immediately.',
        '**Reject** sends it back to **Draft** for the company to revise and resubmit, and a **Reason** is required. That reason is recorded internally and never shown publicly.',
      ],
      tips: [
        '⚠️ THE WRITTEN REQUIREMENT SAYS THERE IS NO APPROVAL GATE. The build has one, on by default. Which behaviour is correct is a client decision, not a bug to file blind — the console is what this guide describes.',
        'Approving does not check the company is Active — but entering Open does. A posting for a non-Active company is refused at that moment.',
      ],
      spec: 'job-list',
    },
    {
      id: 'upgrade-a-tier',
      title: 'Upgrade a live posting to a higher tier',
      where: 'Jobs → open a posting → Upgrade tier',
      outcome: 'The posting moves up a tier, and the company’s slot count moves down by one.',
      steps: [
        'Click **Upgrade tier**. The dialog names what it is published under today and lists the higher tiers.',
        'Read each row before choosing: an available tier says *N slot(s) left · costs 1 slot(s) per post*, **which PO the slot comes from**, and how long the posting stays live.',
        'A tier marked **No slots left** or **Not purchased** is not selectable — the radio is disabled rather than clickable-then-error.',
        'Confirm. It consumes one slot from that tier’s quota and cannot be undone.',
        'Check the result twice: **Current tier** on the posting, and the tier’s slot count on the company’s **Products & billing** — it must have dropped by exactly 1.',
      ],
      shots: [
        { src: `${IMG}/upgrade-tier.jpg`, caption: 'Three states in one dialog: no slots left, available (naming its PO), and never purchased.' },
      ],
      tips: [
        'This dialog is the fastest way to read a company’s posting quota — it shows every tier, its state, and where the slots came from.',
        'Publish, Upgrade, Approve and Reject are all protected against a double click. If a fast double-click ever deducts quota twice, report it.',
        'If the job is already on the highest tier the company owns, the dialog says so — the fix is to sell them a higher one, not to force it here.',
      ],
      spec: 'job-list',
    },
    {
      id: 'check-it-on-the-site',
      title: 'Check the posting on the jobseeker site',
      where: 'The jobseeker site — dev.svn.topdev.asia',
      outcome: 'Proof the posting appears where the tier says it should, and nowhere else.',
      steps: [
        'Open the jobseeker site and scroll the homepage. Each titled band — *Việc làm tiêu điểm* and the rest — is **one placement area**.',
        'Find your posting. It must appear in **exactly** the areas its tier’s **Placement slots** lists: nothing missing, nothing extra.',
        'Turn **Exposure** off on the posting and reload — it must disappear from every area.',
        'Switch the company to non-Active and reload — it must disappear as well.',
      ],
      shots: [
        { src: `${IMG}/web-home.jpg`, caption: 'The homepage is assembled from placement areas: hero banner, hero job rail, mid-page banner, featured companies.' },
        { src: `${IMG}/web-job-bands.jpg`, caption: 'A titled band is one placement. What fills it comes from the products that declare they feed it.' },
      ],
      tips: [
        'WHAT FILLS A BAND IS DECIDED ON THE PRODUCT, not on the Placements page: the product declares which area it feeds (**Placement slots** on the product record).',
        'The legacy **Feeder tiers** column on the Placements page is **no longer the source of truth** — ownership was inverted. Do not debug display through it.',
        'A placement’s **Items shown** is exact: set to N, the area shows N cards. An empty **Rotation period** means the order never changes; a set one means the order holds for that period and changes with the next.',
      ],
      spec: 'job-list',
    },
    {
      id: 'why-is-a-job-not-showing',
      title: 'Work out why a job is not showing',
      where: 'Jobs → the posting, then the company',
      outcome: 'The answer, in the order that finds it fastest.',
      steps: [
        'Check **status = Open** on the posting. Draft, Schedule, In review, Closed and Archived are all invisible to candidates.',
        'Check **Exposure = On** in POSTING STATE. It is independent of status, and Off is the most common single cause.',
        'Check the **company is Active**. A non-Active company’s postings cannot even enter Open — the attempt is refused.',
        'Check **Current tier**: if it is not the tier that was sold, the posting is in the wrong areas because the tier decides them.',
        'Only then look at the placement itself — its **Items shown** cap, and whether the product actually declares that it feeds that area.',
      ],
      tips: [
        'Publishing fails with an out-of-quota error when the tier has no slots left. The draft survives it — sell or grant quota, then retry from the same screen.',
        'If the quota looks wrong rather than the display, the bug is upstream: the product’s **Type** or **code** in Products & Packages, or the invoice that provisioned it in CRM. It is almost never the job.',
      ],
      spec: 'job-list',
    },
  ],
  builtFrom: [
    { repo: 'saramin-vn-admin', branch: 'dev', commit: '07e4b68', date: '2026-09-08', note: 'screens and behaviour' },
    { repo: 'saramin-vn-admin', branch: 'dev', commit: 'deed9d0', date: '2026-09-08', note: 'docs/qa/screenshots — the pictures on this page' },
  ],
}
