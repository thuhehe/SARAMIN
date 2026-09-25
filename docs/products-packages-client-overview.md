# Products & Packages — Module overview for testing

**Purpose:** give the client the key flow of the module and enough detail on each setting to start using the screens and writing test cases. Not a click-by-click guide — the obvious controls are left to the screen itself.

**Pages covered:**

| Page | URL | What it defines |
|---|---|---|
| Placements | `/system/placements` | The display areas on the jobseeker site |
| Products | `/system/products` | What is sellable, what each product grants |
| Posting ladder | `/system/product-ladder` | The order paid jobs sit in on Job search |
| Packages | `/system/packages` | Several products sold as one line, at one price |

Written against the admin console `dev` branch as of 23/09/2026.

---

## 0 · How the pieces fit together

Read this once — every setting below is one step in this chain.

```
PLACEMENTS            PRODUCTS                      PACKAGES            POSTING LADDER
display areas   →     what is sold                  several products    order of paid jobs
on the site           · a Job posting product       sold as one line    on Job search
                        IS a posting tier
                      · it points at placements
                        ("Placement slots")
        │                     │                            │
        └────────── sold on a QUOTATION → PURCHASE ORDER → VAT INVOICE ──────────┘
                                                           │
                                            invoice ISSUED = quota granted
                                                           │
                                            company publishes a job on that tier
                                                           │
                                     job appears in the areas the tier's Placement slots list,
                                     in the position the Posting ladder gives its tier
```

Four things to hold onto:

1. **Nothing on these four pages gives a customer anything.** A customer receives a product only when its **VAT invoice is issued** (CRM). These pages define what that invoice will deliver.
2. **A Job posting product IS its tier.** There is no separate "tier settings" screen. Display duration, auto-refresh, the areas it appears in, what it includes — all live on the product.
3. **The product decides where a job appears, not the Placements page.** Placements describes the *area*; the product's **Placement slots** says which tiers *fill* it.
4. **There are three different "order" settings, and they do different things** — see §2.9. Most confusion in this module comes from mixing them up.

---

## 1 · Placements — `/system/placements`

### What it is

The **registry of display areas** on the jobseeker site: one row per area — a homepage band, a search-results strip, a banner region. It describes the *shape* of each area: how many items it shows, how large a creative must be, how often it reshuffles.

Areas are **seeded by the BB team**. There is no *Create* and no *Delete* — the list is the site's layout, and adding an area means changing the site. Every row can be **edited** (pencil icon).

### Two kinds of area

The **Format** column splits the registry in two, and the edit drawer shows only the fields that apply:

| Format | What fills it | Fields that matter |
|---|---|---|
| **Job** (content pool) | Job postings — via each product's **Placement slots** | Items shown · Pool cap · Rotation period · Size |
| **Display** (banner / popup) | A creative published against a **paid booking** | Creative width × height · Concurrent bookings · Rotation period (banner only) |

### Pages that have areas

Home · Search · Job list · Job detail · Company page · Candidate profile.

> The draft said "Home, Search page, Mega menu pages". *Mega menu* is not a page value in the registry — the job-collection pages (by category / location / industry) are the **Job list** page. Worth confirming which area the client means before writing test cases against it.

### Settings worth understanding

| Setting | Meaning | Test it by |
|---|---|---|
| **Name** | Vietnamese display name. Editable — the only free-text column. | Rename an area; the change is admin-only, nothing on the public site is retitled. |
| **Key** | The machine key the public site queries by (`HOMEPAGE_TOP`). **Fixed** — cannot be edited. | — |
| **Items shown** | Exactly how many cards the area renders. | Set N; the area shows exactly N, never more. |
| **Pool cap** | Max jobs eligible to rotate through the area. Blank = unlimited. | Clear it and confirm the area takes any number of eligible jobs. |
| **Rotation period (s)** | The length of **one period**, not an animation speed. Within a period the order is stable; a new period reshuffles. Blank = never reshuffles. | Reload inside the same period → same order. Wait for the next period → new order. |
| **Creative size** | Display areas only. Set **both** width and height to turn on the upload gate; leaving both blank accepts any size. Setting only one is rejected. | Upload a wrong-ratio banner → refused, not auto-cropped. |
| **Concurrent bookings** | Display areas only — how many bookings may overlap here. Blank = 1. | Try to book a second banner into a 1-slot area for overlapping dates → blocked. |
| **Reference image** | Admin-only preview image on the row. Never shown publicly. | — |
| **Status** | **Inactive** → the area shows **nothing**, even when qualifying jobs exist. | Set Inactive; the band disappears from the public page. |

### The rule that matters most

**Which tiers feed a Job area is NOT set here.** It is set on each **Product**, under *Placement slots*. The Placements page only describes the area. If a job is missing from a band, look at its product first, not at this page.

---

## 2 · Products — `/system/products`

### What it is

The **catalogue**: every sellable item, its price, and its **fulfilment** — what the buyer actually receives when the invoice is issued. This screen is the definition; it never touches a customer's balance.

Only **Active** products can be quoted. **Inactive** replaces deletion: the product vanishes from quotations, but every past order that references it still resolves.

### 2.1 · Type — the field with the most reach

Type decides **what the invoice delivers**, and which fulfilment fields appear below. Four types:

| Type | What the customer receives at invoice | Consumed by |
|---|---|---|
| **Job posting** | N posting slots on this tier | Publishing a job |
| **CV search** | N CV unlocks, valid for 30 / 90 days once activated | Opening a CV |
| **Placement booking** | A display area held for a period | The booking occupying that slot |
| **Manual service** | Nothing automatic — an ops **task** is opened instead | Ops delivering it by hand (fanpage post, email send) |

A wrong Type delivers the wrong thing. It is the one field to double-check before Save.

### 2.2 · Identity

| Field | Meaning |
|---|---|
| **Name** | Vietnamese required, English optional. Prints on quotation, PO and invoice. |
| **Product ID** | The SKU. Auto-generated from type + name; editable until the product's **first sale**, then locked — it is printed on those orders. |
| **Selling unit** | The unit printed in the quotation's *Đơn vị tính* column (*tin, lượt, gói*). Display only — nothing computes from it. |
| **Product description** | The sales copy printed under the line on quotations. |

### 2.3 · Role — Main / Add-on

| Role | Meaning |
|---|---|
| **Main** | Sold on its own — quotable and orderable, never inside another product. Every posting tier is Main. |
| **Add-on** | Attaches on top of a main posting. **Still sold like any product**: the quotation picker lists add-ons in their own group, at their own price, on their own PO line. On the posting screen it stays disabled until a PO and a main product are chosen. |

**Add-on type** (Add-on role only):

| Add-on type | What it does | Status |
|---|---|---|
| **Label** | A badge on the posting, in search and on the home page — **Hot job** or **Super star** | Available |
| **Display placement** | Puts the job in a premium position | **Not available yet** — no area is marked as having a premium block for add-ons. Raised with the client. |

### 2.4 · Trial product

A checkbox that decides **which quotations may contain the product**:

| | Appears in |
|---|---|
| **Off** (default) | Every quotation **except** one whose Discount programme is *Trial package* |
| **On** | **Only** a quotation whose Discount programme is set to **Trial package** (*Gói dùng thử*) |

- The two sets never mix: a trial quotation offers trial products and **nothing else** — not ordinary products, and not packages (a package has no trial flag).
- Switching a quotation into or out of Trial package **resets the product on every line**.
- Enforced server-side, not just in the picker.
- It is a **visibility axis, not a discount**: a trial product carries its own (low) price and goes on a purchase order. Its activation window is **3 months** instead of 12.

### 2.5 · Free product

A toggle in Pricing. When **on**:

- Price is **0** and cannot be edited.
- HQ can post it for **any company, with no purchase order and no quota**.
- This is what fills the **"Free job"** option on the job posting screen (Main product with no PO selected).
- **Employers never see it** on the company site — they can only post from what they bought.

It is a **stored flag, not derived from a price of 0**: a promotional line can be 0 ₫ and still have to come out of a PO.

### 2.6 · Status

| Status | Means |
|---|---|
| **Active** | Sellable — can be quoted, ordered, provisioned. Activation is **refused while fulfilment is incomplete**, and the message names the missing field. |
| **Inactive** | Not sellable. Covers both "still being written" and "withdrawn from sale". Past orders still resolve. **This is the replacement for deleting.** |

### 2.7 · Fulfilment — Job posting

The block that makes a Job posting product **be** its tier.

| Setting | Meaning |
|---|---|
| **Must be used within** | Counted from the invoice date; 12 months default. Quota is granted the moment the invoice is issued; whatever is unused when this window closes expires. |
| **Display duration (days)** | How long **one published job** stays live. This is what the posting screen shows beside the tier (*Top job · 30 days*). |
| **Auto-refresh** | How often a published job is bumped back to the top of the lists it appears in. Blank = never. |
| **Placement slots** | **Where a job of this tier appears**, and for how much of its display window — *Whole display window* or *First 10 days*. Areas come from the Placements registry. **This is the tier definition.** |
| **Includes** | Products granted together with this one. The customer sees a **single line** — this is not a package. Each include is still provisioned separately. |
| **Card perks this tier sells** | What a job card on this tier may carry (banner photo, card tag). A new product sells none until ticked, whatever its rank. **Covering Top search in Placement slots sells both automatically** — and every job on that tier then needs a photo before it can publish. |
| **Ladder rank** | Where this tier sits among the tiers — see §2.9. |
| **Display order** | Read-only here. Set on the Posting ladder screen — see §3. |

### 2.8 · Fulfilment — the other three types

| Type | Fields | Worth knowing |
|---|---|---|
| **CV search** | Credit amount · Validity (30 / 90 days) | Credit amount = how many CVs one purchase unlocks. Validity runs from the moment the customer presses **Kích hoạt**. No "Must be used within" here: the activation window is fixed at 12 months (3 for trial) by T&C §4. The per-CV price shown underneath is computed, never typed. |
| **Placement booking** | Placement · Duration (days) · Slots consumed | Only **Active** areas are offered. Slots consumed = how many of the area's pool one sale occupies; blank = 1. |
| **Manual service** | Quantity · Unit | Provisions no entitlement — opens an ops task. Unit is how the task is counted (a post, a send). |

### 2.9 · Three "order" settings — and what each actually changes

This is where testers get confused, so it earns its own table.

| Setting | Where | What it changes | What it does NOT change |
|---|---|---|---|
| **Placement slots** | Product form | **Which areas** a tier's jobs appear in, and for how long | Order within an area |
| **Ladder rank** | Product form | **Upgrade legality** — a job may only be upgraded into a strictly higher rank — and the order the tier catalogue is listed in on quota screens | Job display order · card perks · price |
| **Display order** | Posting ladder screen (drag) | **The "Recommended" ordering on Job search** — which tier's jobs sit above which | Rank · price · perks · which areas a job appears in |

Two tiers cannot share a **Ladder rank** while both are Active — Save is refused and names the other product.

---

## 3 · Posting ladder — `/system/product-ladder`

### What it is

One list of the **paid posting tiers**, top rung first. **Drag a rung** (or focus its handle and press ↑ / ↓) to move it. The saved order is the **"Recommended" sort on Job search**: when jobs on different tiers land in the same list, the job whose tier sits higher on the ladder shows higher.

> This is the built form of ticket **SRM-561 "Sort priority on Product"**. The ticket described a numeric field per product; the build delivers it as this drag screen writing a **Display order** number per tier.

### Which products appear on it

A product is a rung when it is **Job posting** type, **Active**, and has a **Display duration**. Anything else is not a posting tier and is not on the ladder. The list is short by design — no filters, no paging.

### What a drag does and does not do

- **Changes:** only the Recommended ordering on Job search.
- **Does not change:** Ladder rank, price, card perks, Placement slots, upgrade rules, or the catalogue order on quota screens.

### Respace

**Respace the ladder** renumbers every rung 10, 20, 30… — same order, new spacing — so a new tier can be inserted between any two. If two rungs ever share a Display order the screen says so and **refuses to save** until you respace.

### Scope to confirm

The ticket says the ordering applies to *Job search results, Jobs by location, Jobs by category, Jobs by industry — any list that mixes products in one placement*. The build's own copy says it changes **"only the Recommended ordering on job search"**, and the team's note was *"we only test it on Job search page"*. **Ask the client to confirm whether collection pages are in scope for this round** before writing cases against them.

### Test it by

1. Drag tier B above tier A. Save. On Job search, Recommended sort: B's jobs sit above A's. **Product prices, ranks and perks are unchanged.**
2. Open two tabs, reorder in both, save both → the second save is refused with *"the ladder changed while you were editing"*, and the screen reloads.
3. Deactivate a tier → it leaves the ladder. Reactivate → it returns at its old Display order.
4. A product with no Display duration never appears, whatever its rank.

---

## 4 · Packages — `/system/packages`

### What it is

**Several products sold as one line, at one price.** A package is priced as a whole, not as the sum of what it grants. On a quotation it is one row; at invoice each component is **provisioned separately**, so the company's quota reads as the individual products.

Use a package when the customer should see the parts **priced together under one name**. When a product should simply *come with* extras as one line, use **Includes** on the product instead.

### Settings

| Setting | Meaning |
|---|---|
| **Name** | Internal — how the console lists it. |
| **Display name** | What customers see on quotations and the public site. Blank = the name above. |
| **Components** | At least **two** products, each with a quantity. |
| **Package price (VND)** | Prefilled from the components total; adjust to what the package actually sells for. **Sum of parts** and **Implied discount / markup** update underneath. A warning appears if the price exceeds the sum of parts. |
| **Status** | Active / Inactive. **Activation fails if any component product is Inactive** — the message names it. |

### 4.1 · Premium package

When ticked, **job postings sold on this package's products appear in the Premium section (the blue section) of the public search page.**

Two things to test carefully, because both are counter-intuitive:

- **It follows the PRODUCTS, not the buyer.** If the package includes a widely sold tier, **every posting on that tier is promoted — including ones bought separately, outside the package.**
- **It is not placement-driven.** Jobs reach the Premium section because of this checkbox, not because of any Placement slots setting. A tester looking for the Premium section on the Placements page will not find it.

This is how the *Unlimited* packages in the current system are represented.

### 4.2 · No limit (unlimited quantity)

A **No limit** switch on a component line, in place of a quantity.

- Only a **Job posting** product **with a validity period** may be sold unlimited — unlimited in quantity, bounded in time. The switch is disabled for anything else.
- **Sum of parts leaves the unlimited line out** — there is no price for "no limit". The package sells at the price you set; the usual "price exceeds sum of parts" warning is replaced by a note saying so.
- The line total reads **—**, not 0 ₫; the list column reads **Unlimited**.

### Test it by

1. Build a package of 3 products → quotation shows **1 row**; after invoice, the company's *Products & billing* shows **3 products**.
2. Tick Premium package on a package containing tier X → a job on tier X bought **outside** the package also appears in the Premium section.
3. Set No limit on a CV search line → refused (needs a Job posting with validity).
4. Deactivate a component product → activating the package fails and names that product.

---

## 5 · Related things the client should know

Not on these four pages, but they decide whether what's set here works.

| Where | Why it matters here |
|---|---|
| **Discount programmes** (`/system/discount-programmes`) | The **Trial package** programme lives here. Trial products only appear once a quotation selects it. |
| **CRM → Invoice** | **Issuing the VAT invoice is the moment quota is granted.** Nothing on these four pages grants anything by itself. |
| **CRM → Customers → Products & billing** | Where to **verify** a product landed on a company: *IN USE* shows each product with slots and expiry. |
| **Recruitment → Jobs → New job** | Where the product is **spent**: pick the company, then the PO, and the Main product list becomes that PO's paid lines. Free products appear only when no PO is chosen. |
| **Products & Packages → CV search usage** | Bought-but-idle CV packages, and the one place a package can be **withdrawn**. |
| **Jobseeker site** | The closing check: a published job appears in **exactly** the areas its tier's Placement slots list, and Exposure Off removes it from every area. |

### Open items to raise with the client

1. **Display placement add-on** — not available; no area is marked as having a premium block. Decision needed on whether Popular Jobs / Highlight Companies premium positions exist in this system.
2. **Posting ladder scope** — Job search only (build) vs. also collection pages (ticket SRM-561). Confirm.
3. **"Mega menu pages"** in the draft — not a placement page value. Confirm which area is meant.

---

## 6 · Suggested test scenarios (end-to-end)

Short list to seed the test plan — each crosses several screens, which is where bugs hide.

| # | Scenario | Passes when |
|---|---|---|
| 1 | Create a Job posting product on a new tier, set Placement slots to *Home — Việc làm tiêu điểm (Whole window)*, sell it, issue the invoice, publish a job | The job appears in that band and **nowhere else**; the company's slot count drops by 1 |
| 2 | Same job, then set the placement's Status to Inactive | The band disappears from Home; the job is still on Search |
| 3 | Drag the new tier to the top of the Posting ladder | Its jobs lead the Recommended sort on Search; product price and rank are unchanged |
| 4 | Tick Free product on a Basic tier; post a job with **no PO** | *Free job* offers it; publishes with no quota deducted; an employer on the company site never sees it |
| 5 | Tick Trial product; open a normal quotation, then one with Discount programme = Trial package | Hidden in the first; the **only** product offered in the second |
| 6 | Build a Premium package containing tier X; buy tier X **separately** for another company | That company's tier-X job **also** appears in the Premium section |
| 7 | Change Ladder rank of tier B below tier A; try to **Upgrade tier** a job from A to B | Upgrade refused — only a higher rank is legal |
| 8 | Set Rotation period = 60s on a band with 30 eligible jobs and Items shown = 8 | Exactly 8 cards; same order on reload within the minute; different order after |
