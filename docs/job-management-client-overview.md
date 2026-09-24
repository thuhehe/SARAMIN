# Job management — Module overview for testing

**Purpose:** give the client the key flow of the module and enough detail on each screen to start using it and writing test cases. Not a click-by-click guide — the obvious controls are left to the screen itself.

**Pages covered:**

| Page | URL | What it defines |
|---|---|---|
| Jobs | `/recruitment/jobs` | Every posting across all companies — find one, read its state, show / hide or close it |
| New job posting | `/recruitment/jobs/new` | Post on a company's behalf: the invoice and product it spends, then what candidates read |
| Job detail | `/recruitment/jobs/:id` | What one posting is doing right now — tier, exposure, counters, upgrade, close |
| Jobseeker site | `dev.svn.topdev.asia` | Where the posting lands — the closing check |

Written against the admin console `dev` branch as of 24/09/2026.

## 0 · How the pieces fit together

Read this once — every screen below is one step in this chain.

📷 Diagram — how a posting is created, published and found

Four things to hold onto:

1. **A posting spends quota, it never creates it.** Quota arrives when CRM issues the **VAT invoice** for a product (Products & Packages). The posting picks that invoice and one of its paid lines. With no invoice only **Free** products are offered — and only HQ can post those.
2. **Saving costs nothing; Post costs one slot.** A draft needs Company, Title and a Working location. Post needs 10 fields, and the rail lists what is still missing. A Post that fails (no quota, tier full) keeps the draft.
3. **Status and Exposure are two different switches.** Status is the lifecycle — Draft → Schedule → Open → Closed. Exposure is On / Off and only means anything while Open. A candidate sees a job only when **Open + Exposure On + company Active**.
4. **The product decides where the job appears and how high.** Display duration, the areas it appears in, its place in the Recommended sort, the card perks it may carry — all come from the Main product picked in Posting setup. The posting inherits them; nothing on the posting overrides them.

## 1 · Jobs — `/recruitment/jobs`

### What it is

The **master list of every posting across all companies**, one row per posting, newest first. HQ reads it for oversight; the company site shows the same rows scoped to one company.

Tabs follow the lifecycle: **All · Draft · Schedule · Open · Closed**. There is **no In review tab** since 09/09/2026 — a company's own posting goes live directly, exactly like an HQ posting, which is what the requirement always said.

The list is capped at **500 rows**; search and paging happen in the browser. On a large account, filter by company first.

### Columns worth understanding

| Column | Meaning |
|---|---|
| **Job ID** | The link **into the console** — opens the posting. Titles repeat; the ID names one posting. |
| **Job title** | Goes **straight to the live posting** on the jobseeker site (new tab). **Open jobs only** — a Draft or Schedule title is plain text; preview those from the detail page. |
| **Category · Product · Job type** | Category from the job taxonomy. **Product** is the tier the posting runs on. **Job type** is *Paid* or *Free* — Free only when the product is flagged Free; a tier the catalogue cannot name reads Paid. |
| **Company · Company ID · Type of customer** | `CO-XXXXXXX`. *New / Existing / Churn* is a fact about the **company** (Existing from its first VAT e-invoice), not about the posting. |
| **Job location** | The company offices the posting references, de-duplicated by province. |
| **Created by** | **Company** (their own HR user) · **Admin** (HQ posted on their behalf). Neither goes through an approval gate. |
| **Status · Exposure** | The **Exposure** toggle appears on **Open rows only**. On any other status the cell reads *Exposure applies only to open jobs*. |
| **Expiry date · Posted** | Expiry is the **application deadline** the form sets — what the *Expiring soon* sort counts. It is not the day the tier stops displaying the posting. |
| **Views · Saves · Applied** | The only three real counters. Nothing is derived. |
| **Sent CV · Not sent CV** | Two **independent** counts: *Sent* = forwarded to the employer, *Not sent* = still waiting for HQ CV review. **Not a split of Applied** — a recalled or rejected application is in neither, so 1 / 1 beside Applied 3 is correct. A non-zero *Not sent* is HQ's backlog, drawn in the warning colour. |

### Filters and actions

- **Search** matches title, job code and company name. Filters: status, exposure (*Shown and hidden*), company, date range. Sorts: **Most viewed · Most saved · Expiring soon**.
- A **column picker** hides columns you do not need; **Export** downloads the current view.
- Row actions on an Open posting: **Show publicly / Hide from public** (the Exposure toggle) and **Close posting**. Closing asks once — *It will stop accepting applications and come off the public site immediately.*
- **There is no delete.** A posting is a paid, published record; Close is the end of its life. A delete button anywhere is the bug, not its absence.

### Test it by

1. Hide an Open posting → it leaves every area of the jobseeker site within a reload; its status is still Open.
2. Open a Draft's title → plain text, no link; open the same posting's Job ID → the console detail page.
3. A posting with Applied 3, Sent CV 1, Not sent 1 → correct, not a bug: one application was recalled or rejected.

## 2 · New job posting — `/recruitment/jobs/new`

### What it is

One form, seven sections in the left rail: **1 Posting setup · 2 Job information · 3 Applications · 4 Job content · 5 Card artwork · 6 Candidate expectation · 7 Internal (HQ only)**. The rail keeps score — *N of 10 done to post* — with a **Still missing** list: a coloured chip blocks saving, a grey *· to publish* chip blocks Post.

The company site has the same form with two differences: the company is fixed to the signed-in employer, and there is **no invoice picker** — the employer posts from the products the company holds, and never sees the Free tier.

### 2.1 · Posting setup — the money

| Field | Meaning | Test it by |
|---|---|---|
| **Company** | Searchable by name or ID (`CO-XXXXXXX`). A summary card shows ID, head office and an *Open company →* link. A company with **no tax code (MST)** or an **archived** company can be saved as a draft but **cannot go live** — the form says so. | Pick a company without MST → Post refused, Save as draft works. |
| **Invoice** | *Paid products only — declared invoices, newest first.* Only this company's **issued** invoices are offered; an unpaid order buys nothing. **— none (Free job) —** for a free posting. | Pick company A's invoice, switch to company B → A's invoice must disappear. |
| **Main product** | The tier the posting runs on, with its display duration (*30 days*). The hint under it flips from **Free tier (no invoice)** to **This invoice's paid lines** — that one line is the check that the screen is wired correctly. | Pick an invoice → the list is exactly that invoice's paid lines. Switch invoice → the old product is reset, not kept. |
| **Add-on — Label** | A badge on top of the posting (*Hot job*, *Super star*). Comes from its own line on the invoice **or** from a product on it that includes it. | Pick an add-on before a main product → blocked: *Pick an invoice and a main product first.* |
| **Add-on — Display placement** | Records the premium placement purchase. Same gate as Label. | Same as above. |
| **Publish at** | Blank = post now. A future time = **Schedule**; changing it later reschedules. | Set a past time → refused: *Publish time must be in the future.* |
| **Exposure** | On / Off, independent of status. | Post with Exposure Off → status Open, invisible on the site. |

> *Products come from the selected invoice. With no invoice, only free products are offered.* — the copy under the field is the rule. HQ posting a Free job for a company is the **only** way a free posting exists; the company site never offers one.

### 2.2 · Job information — the facts a candidate filters and searches on

| Field | Meaning |
|---|---|
| **Title** | VI required (this is what blocks Post); EN optional, falls back to VI. Max 120. |
| **Job category** | **Pick this first** — the job roles and specialisations below are the ones under it. Required to post; a draft saves without it. Changing it clears the roles picked under the old one. |
| **Job roles** | At least **one** to publish. Scoped to the category. These are job *titles* (Backend developer), nothing to do with admin roles. |
| **Specialisations** | The taxonomy's third level, grouped by what the category has — *Chuyên môn*, *Tech stack*, *Công cụ*, *Chuyên khoa*… **Up to 3 per group.** Optional. They exist for the jobseeker's filter, not for display. |
| **Work type · Contract type** | Two questions, two fields. Work type = **where / how** the work happens (In office · Remote · Hybrid · Oversea). Contract type = **the employment relationship** (Fulltime · Part-time · Contract · Internship · Probation · Freelance · Seasonal). *Fulltime + Remote* is a normal posting. |
| **Job level · Industry** | Job level: Intern / Fresher / Experienced / Manager / Director and above. Industry is the **company's** sector, a different axis from the job category. |
| **Skills** | **Up to 10**, catalogue only — no free text. Once a category is picked, *Suggested for this category* lists first, *Other skills* below; aliases are searchable (typing *ReactJS* finds React). An old free-text skill shows as *· unrecognised — replace* and is never dropped silently. Skills **rank** candidates; they never exclude. |
| **Working locations** | Picked from the **company's own offices**, up to 3. **The first one picked is what cards and search results show** (*Shown on cards*). *New location* creates an office inline; another company's office is refused. |
| **Salary range** | **Negotiable**, or **From / To** — either bound may be blank: From only → *Từ 15 triệu*, To only → *Lên đến 25 triệu*. Currency **VND or USD** (a USD posting prints a settlement line: paid in VND at the contract-date rate). *Show to Job Seekers* controls whether the figures print. |
| **Benefits** | **Prefilled from the company's benefit set**, then edited freely for this posting — add, remove, reword. *Back to company defaults* and *View company benefits* sit beside the list. **Order here is the order on the job page.** Each benefit is a fixed type plus a description; the description accepts lists only. |

### 2.3 · Applications — who receives them

One picker over the **company's contact people**. Everyone picked receives the applications by email; **the first pick is also the name candidates see** on the posting (*Candidates will see: …*). The pick is **copied**, not linked — renaming the contact in CRM later does not rewrite a live posting. A contact with no email opens for editing instead of being selected. *New contact* creates one inline.

### 2.4 · Job content — what candidates read

**Description** and **Requirements**, each with a VI and an EN tab. Vietnamese is required to post; English falls back to Vietnamese. The editor accepts **structure only** — paragraphs, bullets, numbering — no bold or italics, so every posting on the site keeps one typography. A paste from Word arrives clean.

### 2.5 · Card artwork — offered only for what the product sells

Appears only when the chosen Main product covers it; a **Basic posting has no artwork section and never will**.

| Frame | What it is |
|---|---|
| **Card photo (at rest)** | 596 × 258 — the card on the paid bands. Picked from the licensed gallery (images suited to the industry first, *show all* to widen) or uploaded. |
| **Card photo (on hover)** | 600 × 1120 — the tall card when hovered. |
| **Short description** | Up to 400 characters, shown on hover. |
| **Card tag** | One pill at a time, rotating through **three groups** — *Company tag* (days 1–10), *Job tag* (days 11–20), *Benefit tag* (days 21–30). Picked from the **Job tags** catalogue by its **criteria**, not typed. |

Artwork is optional to publish — an empty frame leaves the card plain, it does not block Post.

### 2.6 · Candidate expectation — used for matching and filtering, not shown as requirements

| Field | Rule |
|---|---|
| **Number of headcount** | Optional. |
| **Years of experience (min – max)** | **Required** — or tick **No experience required**, which writes 0 with no ceiling and prints *Không yêu cầu kinh nghiệm* on the job page. |
| **Minimum education level** | **Required** — the job page states it unconditionally. |
| **Nationality · Gender · Age** | Optional, each with its own *Show to Job Seekers* switch. Legally sensitive in Vietnamese job ads — needs the client's decision on collecting and displaying them. *Marital status* was removed on 21/09. |
| **Cover letter requirement** | Always required · Optional · Never required. |

### 2.7 · Internal (HQ only)

Notes never shown publicly — visible to HQ operators only.

### 2.8 · Saving vs posting

| | Save as draft | Post |
|---|---|---|
| **Needs** | Company · Title (VI) · Working location | The same three plus Main product · Job category · Job role · Skill · Salary · Description (VI) · Requirements (VI) — **10 in all** |
| **Costs** | Nothing | **One slot** of the Main product's quota, spent the moment the job goes Open (or is scheduled) |
| **If it fails** | — | **The draft is kept.** *No quota left* → grant or sell quota, retry from the same screen. *Tier has no capacity* → pick another tier. |

Post reports **every** missing field at once, not one per press. The browser also autosaves: reloading mid-entry shows **Unsaved changes recovered** with *Restore* and *Discard*.

## 3 · Job detail — `/recruitment/jobs/:id`

### What it is

One screen that answers *what is this job doing right now*.

| Panel | Read it for |
|---|---|
| **Posting state** | **Exposure**, **Current tier**, **Publish at**, *Posting valid until …*. **Current tier must equal the Main product picked in Posting setup** — this is where a wrong product shows up. |
| **Engagement** | Views · Saves · Applications — the three real counters. |
| **Classification · Hiring brief** | What the job asks for, restated. |
| **Card artwork** | The frames the posting draws on the paid bands. Present only on the top tiers. |
| **Body** | Description and Requirements, VI / EN tabs. |

### Actions in the header

| Action | What it does |
|---|---|
| **Edit** | Opens the form. An old posting carries a one-line warning: *Saving replaces the description; structured details carried over from the previous admin are not kept.* |
| **Applications (N)** | The applicants for this posting. |
| **Preview draft** | Draft and Schedule only — opens the unpublished posting as a candidate would see it. Open postings link to the live page from the list instead. |
| **Upgrade tier** | Move a live posting to a **higher** tier the company holds — see below. |
| **Close posting** | Stops applications and removes the job from the public site **immediately**. Terminal — a new posting means creating one. |

### Upgrade tier — also the fastest way to read a company's quota

The dialog says *Currently published under X* and lists the higher tiers, each in one of these states:

| State | Reads | Selectable? |
|---|---|---|
| **Available** | *N slot(s) left · costs 1 slot(s) per post · From <invoice or package>* — or *Unlimited posts* | Yes |
| **No slots left** | *No slots remaining in the current package.* | No — the radio is disabled, not clickable-then-error |
| **Not purchased** | *Not included in the company's current package.* | No |
| **Expired** | *Expired on dd/mm/yyyy.* | No |

Confirming **consumes one slot of the new tier and cannot be undone**. Check it twice: *Current tier* on the posting, and the tier's slot count on the company's **Products & billing**, which must drop by exactly 1. If the posting is already on the highest tier the company owns, the dialog says so — the fix is to sell a higher one.

> Publish, Upgrade and Close are protected against a double click. If a fast double-click ever deducts quota twice, report it.

## 4 · Status and Exposure — two switches, one rule

### Status

| Status | Means | On the jobseeker site | Leaves this value when |
|---|---|---|---|
| **Draft** | Saved, never published | Not present | Post → Open, or a future Publish at → Schedule |
| **Schedule** | Will publish at a chosen time | Not present yet | The time arrives → Open, automatically |
| **Open** | Published and within the deadline | Live — listed, searchable, applyable **if Exposure is On** | The deadline passes → Closed, or Close posting |
| **Closed** | Deadline passed, or closed by hand | Read-only notice, no apply | Terminal |

The lifecycle only moves forward. There is no re-open — a similar job is a new posting.

### Exposure

| Status | Exposure shows | Meaning |
|---|---|---|
| **Open** | **On / Off** | On = public. Off = the job stays Open (applications already received are kept) but disappears from every list, search and band. |
| Draft · Schedule · Closed | — | Not applicable — nothing to expose. |

### The three conditions to be public

**Open** and **Exposure On** and **company Active**. Any one of them off and the job is invisible, with no error anywhere. A non-Active company's posting cannot even enter Open — the attempt is refused. This is the checklist for every *"why is my job not showing"* question, in that order.

## 5 · Where the posting goes on the jobseeker site

| Question | Answer | Set where |
|---|---|---|
| **Which areas?** | Exactly the areas the tier's **Placement slots** list — a homepage band, the search strip. Nothing missing, nothing extra. | Products & Packages → the product |
| **How high in Job search?** | The default **Recommended** sort groups results by paid tier in **Posting ladder** order; inside a tier, title matches first, then skills, category, company; ties go to the newest auto-refresh. **Date posted** and **Closing soonest** ignore tiers. | Posting ladder · the product's Auto-refresh |
| **Found by which filter?** | The *Select a job* picker — **category → roles + specialisations** — plus province, level, work type, contract type, benefits and salary. Inside the job picker everything ticked is OR; the other filters AND. | Job information |
| **Found by which keyword?** | Title first, then skills, then role / category, then company name, then the body text. A word that appears **only** in the description still finds the job, but at the end of the list. | Job information · Job content |
| **For how long?** | The product's **Display duration** — the posting closes at its deadline automatically. | Products & Packages → the product |

### 5.1 · The Job search page — three sections, one match set, three orders

After a keyword search the page is three sections, top to bottom: the **Top section** (the *"UX UI jobs for you"* carousel), the **Job search result** list, and the **Blue zone** (*"The choice that sets you apart"*) inserted into that list. Design: [Search result — Figma](https://www.figma.com/design/ljutPxIbZWjbmpaZfSyeBN/Saramin?node-id=1693-9276).

**All three start from the same set of jobs** — every job that contains the keyword in at least one of five fields: **job title · skills · job category / roles / specialisations · company · description + requirements**. What differs is *which* of those jobs a section takes and *how it orders them*.

| Section | Takes which of the matching jobs | Order | Rules |
|---|---|---|---|
| **Top section** | Jobs whose **product covers this placement** — the tier's *Placement slots* include the search-top area. Set on the product, never on the posting. | **Last refreshed** first — the auto-refresh time the product gives the job. **Not the last edit.** | A paged carousel (*1 / 2*). Empty when no matching job is on such a product — the section then does not render. |
| **Job search result** — sort *Recommended* (default) | **Every** matching job. | 1 · **Group by the product's Sort priority** (Posting ladder), highest first — Top job, then the next rung, and so on. 2 · Inside a group, by **which field held the keyword**: title → skills → category / roles → company → description. 3 · Ties: **newest auto-refresh** first. | *Super star* and *Hot job* are add-on badges — they do not change the order. **Date posted** and **Closing soonest** sort the same set by that one date and ignore tiers. |
| **Blue zone** | Matching jobs whose product is sold in a **Premium package** (the *Premium package* checkbox on Packages). | **Companies interleaved** — one job per company in turn (A, B, C, A, B…) so one big buyer cannot fill the zone — then, within that, **Last refreshed**. | **Hidden entirely when fewer than 3 jobs qualify** — no half-empty band. The heading names the companies shown (*Jobs for MB Bank & NIPPA*). |

> **Last refreshed means auto-refresh, in every section.** A job's position moves when its product refreshes it (*Auto-refresh* on the product record) — never when someone edits the posting. Otherwise every employer would edit a comma each morning to climb the list.

### Test it by

1. Search *UX*. A Top job whose product does **not** cover the search-top area appears in the result list under its tier, but not in the Top section.
2. Two matching Top job postings: the one with the keyword in its **title** sits above the one that matches only on a skill — even if the skill match was refreshed more recently.
3. Edit the description of a matching job → its position does not change. Wait for its product's auto-refresh → it moves to the front of its group.
4. Two Premium-package jobs match → **no Blue zone**. A third one publishes → the zone appears, companies alternating.
5. Switch the sort to *Date posted* → Top job and Basic postings mix freely by date; the Top section and the Blue zone are unchanged.

## 6 · Related things the client should know

Not on these screens, but they decide whether what is done here works.

| Where | Why it matters here |
|---|---|
| **Products & Packages → Products** | A Job posting product **is** its tier: display duration, Placement slots, auto-refresh, card perks, ladder rank. Everything the posting inherits is set there. |
| **CRM → Invoice** | **Issuing the VAT invoice is the moment quota is granted.** The Invoice picker on Posting setup offers only issued invoices. |
| **CRM → Customers → Products & billing** | Where to **verify** quota before and after a Post or an Upgrade: each product with slots left and expiry. |
| **System → Master data** | Job categories, roles and specialisations · Skills · Benefits · Job tags — every list the form picks from. Adding a value is a data change, not a release. |
| **Company site → Create job** | The employer's copy of the same form: company fixed, no invoice picker, tiers offered from what the company holds with the remaining quota beside each, **no Free tier**. A company that is **not verified** cannot even save a draft. |
| **Jobseeker site** | The closing check: the posting appears in exactly the areas its tier lists, and **Exposure Off removes it from every one of them**. |

### Open items to raise with the client

1. **Job title lock** — the requirement locks an employer's job title 72 hours after it goes live (HQ exempt); confirm it is built on the company site before writing cases against it.
2. **Taxonomy data** — the *Y tế* category has no job roles (its "medical professionals" were imported as a filter group), so a hospital cannot satisfy *Job role required to publish*. Decision needed before the master data is loaded.
3. **Free job** — cannot be upgraded to a paid tier later and takes no premium placement. Confirm the client agrees this is the intended limit.
4. **Duplicate posting** — the requirement offers *Duplicate* on the detail page (copy into a new Draft); the console does not have it yet. In scope for this round or not?

## 7 · Suggested test scenarios (end-to-end)

Short list to seed the test plan — each crosses several screens, which is where bugs hide.

| # | Scenario | Passes when |
|---|---|---|
| 1 | Issue an invoice with 2 Basic Plus posts; post a job on it | Main product lists *Basic Plus · 30 days*; after Post the company's Products & billing reads *1 of 2 posts used* |
| 2 | Post a second job, then a third on the same line | The third Post is refused with the quota message; **the draft is still there** |
| 3 | Post with **no invoice** for a company | Only Free products are offered; the job publishes with nothing deducted; Job type reads *Free*; the employer never sees this option on the company site |
| 4 | Post with Exposure Off, then turn it On from the list | Invisible on the site while Off; appears in the tier's areas within a reload once On; status stayed Open throughout |
| 5 | Set Publish at to tomorrow 09:00 | Status Schedule, title not a link, *Preview draft* works; at 09:00 it turns Open by itself |
| 6 | Upgrade a live Basic job to Top Job | Dialog names the invoice the slot comes from; *Current tier* changes; the Top Job slot count drops by exactly 1; a double-click deducts once |
| 7 | Pick category IT, 2 roles, 4 tech-stack specialisations | The 4th tech-stack pick is disabled at 3; on the jobseeker site the job is found by any of the 3 and by *Select all IT* |
| 8 | Post for a company with no MST, or one that is archived | Save as draft works; Post is refused and the reason names the company record |
| 9 | Close an Open posting with 3 applicants | Gone from every area immediately; the 3 applications are still on the Applications screen; no delete exists anywhere |
