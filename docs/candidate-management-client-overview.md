# Candidate management — Module overview for testing

**Purpose:** explain how the employer's **Candidate management** console works — where the candidates come from, what a recruiter can do with them, and what costs credits — with enough detail to start using it and write test cases. Not a click-by-click guide.

**Pages covered:**

| Page | URL | What it is |
|---|---|---|
| Candidate management — **Jobs** tab | `/applicants` | The people who **applied to your postings**, one pipeline per posting |
| Candidate management — **Talent pool** tab | `/applicants?tab=talent-pool` | The people **you went looking for** — saved from CV search into folders, each folder with its own pipeline |
| Talent pool (CV search) | `/talent-pool` | Where candidates are found and saved — the feeder of the second tab |

Written against the employer site `dev` branch as of 25/09/2026, and the live screens at `dev.hiring.svn.topdev.asia`.

## 0 · How the pieces fit together

📷 Diagram — two doors into one console

Four things to hold onto:

1. **Two tabs, two different populations.** *Jobs* = people who applied to you. *Talent pool* = people you saved from CV search. A folder membership is never an application, and an applicant is not in any folder — the same person can be in both, as two separate rows.
2. **Applicants arrive already checked, and their contacts are open.** Saramin checks the CV at upload; only an application Saramin has **sent** reaches your board. Applying is the candidate's consent, so there is nothing to unlock and nothing to pay on the Jobs tab.
3. **On the Talent pool tab you pay when you move, not when you save.** Saving a candidate is free and files them into the **Saved** column, masked. Moving the card out of Saved unlocks the person — **one credit, once, for ever**. A candidate you already unlocked moves for free.
4. **The pipeline belongs to the posting (or the folder), and its two ends are pinned.** Every posting has its own columns — default *CV screening · Interview 1 · Interview 2 · Final acceptance* — plus the fixed *Hired* and *Rejected*. First and last columns can be renamed, never deleted or moved.

## 1 · Jobs tab — `/applicants`

### What it is

One posting at a time. The left rail lists your postings (or **All openings**); the header shows the posting, its candidate count and location; the toolbar switches **List view / Board view**, searches candidates, filters and sorts. Under it, one chip per stage with its count — click a chip to filter, drag a chip to reorder the stages, **+** to add one.

### What a row shows

| Column | Meaning |
|---|---|
| **Candidate** | Name, gender · age, and a star (bookmark). Clicking the name opens the candidate's CV page. |
| **Experience** | Years and months, or *Entry level*. |
| **Education** | Highest level (Master's · University 4 yrs · University 3 yrs · College · High school). |
| **Desired role / tags** | The role the candidate wants, plus facet tags. *Placeholder today — see Open items.* |
| **Hiring status** | *Placeholder today — reads "—".* |
| **Stage** | The column the application is in. Change it from the row or by dragging the card in Board view. |
| **Days since stage move** | How long the candidate has waited in the current stage. A repeat move to the same stage does not reset it. |

### Three tags a row can carry

| Tag | Meaning | What you can still do |
|---|---|---|
| **Recalled by Saramin** | Saramin sent this application and then refused the CV. Contacts and CV are hidden; CV-derived cells read *Withheld*. | Nothing — the row is read-only for reference (no move, star, checkbox or removal). |
| **Account deleted** | The candidate closed their Saramin account. The name reads *Deleted candidate*, contacts and CV are withheld. | Move the stage, star, select. The CV cannot be opened. |
| **CV deleted** | The candidate deleted the CV this application was sent with. | As a normal row, without the document. |

### Actions

| Action | Where | What happens |
|---|---|---|
| **Move stage** | row dropdown · drag in Board view · **Multi-select → Move candidate** | The application changes column; counts on the chips update. Moving to the same stage is a no-op. |
| **Hired / Rejected** | the two fixed columns | **Closes** the application. It cannot be moved again — the server refuses with *"This application is closed"*. |
| **Reject with reason** (**Failure**) | Multi-select → Failure | Pick one of six reasons (*Does not meet the required competencies · Not a fit · Withdrew / no-show · Declined the offer · Could not agree on terms · Other*). The reason is visible to your members only, never to the candidate. |
| **Remove from this posting** | Multi-select → Delete candidate | The applicant leaves your board; they keep their own record of applying, stay in CV search (masked again unless you unlocked them) and can apply again. |
| **Star** | on the row | Bookmark; filter *Candidate classification → Bookmarked*. |
| **Save all** | toolbar / selection bar | Downloads the candidate list as a **password-locked Excel** (your account password), after a reason is chosen. Selection = those rows; no selection = the whole list. |
| **Send offer · Select · More** | row | *Not available yet* — disabled on purpose. |

### Stage rules

| Rule | Detail |
|---|---|
| **Per posting** | Each posting owns its stages. Adding *Technical test* to one posting does not add it to the others. |
| **Defaults** | CV screening · Interview 1 · Interview 2 · Final acceptance — up to **8** stages; **Hired** and **Rejected** are fixed and always present. |
| **Pinned ends** | The first and the last column can be **renamed** only. Nothing can be ordered outside them; the menu simply does not offer it. |
| **Rename · reorder · delete** | From the chip's menu (*Modify stage name · Move order left / right · Delete step*) or by dragging the chip. A stage with candidates in it cannot be deleted — move them out first. |
| **Skipping is allowed** | CV screening → Final acceptance in one move is legal; recruiters skip steps in practice. |
| **Closed stays closed** | Hired and Rejected are terminal. There is no re-open; a candidate hired by mistake is handled outside the board. |

### Test it by

1. Move a candidate to *Interview 1*, then to *Interview 1* again → the *Days since stage move* counter does not reset.
2. Move one to *Hired*, then try to drag them back → refused, list refreshed.
3. Add a 9th stage → refused at 8. Try to delete *CV screening* → not offered (pinned).
4. Have Saramin recall an application → the row turns *Recalled by Saramin*, its checkbox disappears, a bulk move reports it as skipped.

## 2 · Talent pool tab — `/applicants?tab=talent-pool`

### What it is

Your **folders** of saved candidates, each with its own pipeline. The left rail shows **Your folders** and the **Holding boxes**: **Unlocked** (people you paid to reveal but have not filed anywhere) and **Archive** (people you removed from a folder). A holding box only appears once something has landed in it.

A folder's board: **Saved** (pinned first — *"Nobody here has been paid for. Moving a card out spends credits."*) · your columns (default *Interview 1 · Interview 2*, add more with **+**) · **Final acceptance** (pinned last, tinted).

### How a candidate gets here

1. Search on **Talent pool** (`/talent-pool`) — filters, three keyword boxes, result rows with the name masked (*Long T\*\*\**).
2. **Save candidate** on a row or on the CV page → pick one or more folders (create a new one inline).
3. The card lands in **Saved**, still masked, with the *Not unlocked* badge. Nothing was charged.

### The move that costs money

| Move | Charge | What the screen does |
|---|---|---|
| **Saved → any other column**, candidate not yet unlocked | **1 credit** | A confirm modal: *"Moving this card spends a credit"*, your remaining balance, **Spend credits and move** / **Keep in Saved**. After it, the name and contacts are revealed everywhere. |
| Same move, candidate **already unlocked** (from CV search, another folder, or earlier) | **Free** — *"Already unlocked — this move is free."* | No modal. |
| Any move between the other columns | Free | — |
| Back **into** Saved | Not allowed | *"A card cannot be moved back to Saved once it has left it."* |
| Out of Saved with **0 credits** | Refused | *"You are out of credits. Top up to continue."* — the card stays in Saved. |
| Out of Saved when the candidate **deleted their account** | Refused | A first unlock can no longer be spent on them. A candidate you already unlocked is unaffected. |

One credit buys the **person, for ever**: re-opening an unlocked CV, filing them into a second folder, archiving and re-saving — none of it charges again.

### Other actions in a folder

| Action | What happens |
|---|---|
| **Star / Bookmarked only** | Bookmark a card; filter the board to bookmarks. |
| **Multi-select → Unlock** | Unlocks the selected cards in one go (max 50 per batch). Already-unlocked ones are skipped and not charged; if credit runs out mid-way the rest are refused, nothing is half-charged. |
| **Move to another folder** | The candidate moves (not copies) to the folder you pick — create one from the same dialog. |
| **Archive** | Leaves the folder and waits in **Archive**. Findable again, never charged again. |
| **Delete for good** (from Archive) | Removed from your saved candidates. Cannot be undone — but the unlock you paid for is kept, so saving them again later costs nothing. |
| **Rename / delete folder** | Delete removes everyone's *place* in the folder; credits already spent are not refunded. |
| **Add / rename / reorder / delete column** | Same rules as the Jobs tab: pinned ends rename only, no deleting an occupied column. |
| **Search candidate** | By name — finds **unlocked** candidates only (a masked name cannot be searched). |
| **Save all** | Same Excel export. Locked members are written **anonymised** — masked name, no contacts, no last workplace / school — and the toast says how many. |

### Test it by

1. Save a candidate from CV search into two folders → they appear in **Saved** in both; balance unchanged.
2. Drag them out of Saved in folder A → modal, confirm, balance −1, name revealed. Drag them out of Saved in folder B → *free*.
3. Set the company's credits to 0, drag a locked card out of Saved → refused; the card is still in Saved.
4. Archive an unlocked candidate, then save them again from search → lands in Saved, moving them out is free.
5. Search the folder for a masked candidate's real name → no result; search an unlocked one → found.

## 3 · Credits — what they are and where they come from

| | |
|---|---|
| **What a credit buys** | One candidate's identity and contacts (name, phone, email, CV file, links) — once, for your whole company. |
| **Where it comes from** | A **CV search** product (e.g. *CV Search 30d · 50 unlocks*), sold through CRM. The credits land on the company's balance when Accounting **issues the invoice** and the package is **activated**; they run for the package's validity window. |
| **Price** | Always **1** per candidate. |
| **What spends it** | *Unlock* on a CV search result or CV page · moving a card **out of Saved** · *Multi-select → Unlock* in a folder. |
| **What never spends it** | Anything on the Jobs tab · saving · archiving · re-opening an unlocked CV · moving an unlocked person. |
| **Unlimited packages** | The modal reads *"You have unlimited credits."* |
| **Lapsed package** | *"Your package term has ended. Renew it to use the opens you still hold."* — credits left over are frozen, not lost. |
| **Balance** | Shown in the charge modal and on Recruitment products → CV search usage. |

## 4 · Related things the client should know

| Where | Why it matters here |
|---|---|
| **HQ Admin → Applicants** | Saramin's own layer: an application is *Sent*, *Not sent* (CV under review or refused) or *Recalled*. Only **Sent** ones reach the Jobs tab; a recall turns the row read-only. HQ never touches your stages. |
| **Talent pool (CV search)** | The feeder of the Talent pool tab and the other place a credit is spent. Its own rules (three access tiers, 10 free views) are on the CV search page. |
| **Recruitment products → CV search usage** | Balance, validity and activation of the CV search package. |
| **Company users → Roles** | *Manage applications* is what allows moving stages; *Unlock CV* is what allows spending credits. A viewer sees the boards read-only; the folder tab says *"Your role cannot manage the talent pool."* |
| **Job postings** | The stages live on the posting — the Jobs tab reads and edits the posting's own recruitment process. |
| **Jobseeker → My applications** | The candidate sees the stage you set (with Saramin's own wording); they never see a rejection reason. |

### Open items to raise with the client

1. **Placeholder columns.** *Desired role / tags* (Listed company, Top university…) and *Hiring status* are the Korean reference's columns with no data behind them yet — decide whether they ship, and with what data.
2. **Disabled actions.** *Send offer*, *Select* and *More* are visible but *Not available yet*. Hide them for this round, or define them.
3. **Default stages differ from the written requirement** — the requirement says *New → Reviewing → Shortlisted → Interview*; the build ships *CV screening · Interview 1 · Interview 2 · Final acceptance*. Pick one so the candidate-facing labels match.
4. **Rejection notice text** is copied from the Korean product (*"their status changes to 'Viewed' automatically…"*) — confirm the Vietnamese behaviour before the client tests it.
5. **Bug observed 25/09:** opening the Talent pool tab shows *"This folder could not be loaded"* until a folder is clicked in the rail.

## 5 · Suggested test scenarios (end-to-end)

| # | Scenario | Passes when |
|---|---|---|
| 1 | A candidate applies with a Qualified CV | The row appears on the posting's board in *CV screening* the same minute, contacts readable, no credit spent |
| 2 | A candidate applies with a CV still under review | Nothing appears until Saramin approves the CV; then the row appears |
| 3 | Saramin recalls a sent application | The row stays with *Recalled by Saramin*, cells read *Withheld*, every action on it is refused |
| 4 | Recruiter moves a candidate CV screening → Interview 2 → Hired | Both moves succeed; a further drag is refused; the candidate's My applications shows the corresponding stage |
| 5 | Add a stage *Technical test* to posting A | Posting B's board is unchanged |
| 6 | Save a search result into a folder, then move it out of Saved | Confirm modal shows the balance; after confirm balance −1 and the name is revealed on the card, in CV search and on the CV page |
| 7 | Same candidate saved into a second folder and moved | No modal, no charge |
| 8 | Company with 0 credits moves a locked card | Refused, card stays in Saved, link to top up |
| 9 | Save all on a folder with 3 unlocked and 2 locked members | Excel opens with the account password; 3 full rows, 2 anonymised; toast says *2 locked* |
| 10 | Candidate deletes their Saramin account | Jobs tab: row stays, name reads *Deleted candidate*, stage still movable. Folder: a locked card can no longer leave Saved; an unlocked one is unaffected |
