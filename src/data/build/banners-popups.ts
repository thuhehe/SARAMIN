import type { BuildModule } from './types'

/*
 * Banners & Popups — HQ-managed promotional surfaces on the jobseeker site.
 *
 * Two objects, ONE console page (a Banners / Popups switcher): both are Display
 * placement products sold on the same COMPANY → PO → PRODUCT chain, so an
 * operator should not have to learn the same screen twice.
 *
 * Two objects, one lifecycle. Status is DERIVED from the schedule, never typed
 * by hand — an operator only sets the date range and whether it is published:
 *
 *   Draft ──(publish)──▶ Scheduled ──(start reached)──▶ Live ──(end passed)──▶ Ended
 *     ▲                      │                           │
 *     └──── unpublish ───────┴───────────────────────────┘
 *
 *   Popups add "Always on" (a start with no end) and, unlike banners, carry an
 *   AUDIENCE + FREQUENCY CAP because they interrupt the user.
 *
 * The difference that matters for the build:
 *   Banner = placed in a named SLOT (a page area). Can be backed by a paid ad
 *            product, so a slot booking is commercial inventory.
 *   Popup  = targeted at an AUDIENCE. Only ONE ever shows, priority picks the
 *            winner, and dismissal is remembered per user/device.
 *
 * Depth mirrors ./job-management.ts.
 */

export const bannersPopups: BuildModule = {
  id: 'banners-popups',
  title: 'Banners & Popups',
  owner: 'Luong',
  requirements: [
    {
      label: 'What gets built',
      text: 'Admin creates and manages banners + popups with scheduling and placement/target; the Jobseeker site renders the active ones in the defined slots.',
    },
    {
      label: 'Banners live in named SLOTS',
      text: 'Slots are a fixed, defined set. The jobseeker pages reserve those areas as Admin-managed.',
      table: {
        cols: ['Slot', 'Shape', 'Page'],
        rows: [
          ['Home hero', 'Large', 'Homepage, top'],
          ['Home mid', 'Long banner', 'Homepage, middle'],
          ['Sidebar', 'Square', 'List / search pages'],
        ],
      },
      items: ['Performance is tracked per banner (impressions / clicks) so HQ can report on it.'],
    },
    {
      label: 'Status is DERIVED from the date range, never hand-edited',
      text: 'An operator sets the date range and publishes; the status computes itself — so nothing can sit “Live” with an end date in the past.',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Draft', 'Created but not published (not scheduled yet) — the only status that can be deleted', 'Publish → Scheduled'],
          ['Scheduled', 'Before the start date', 'Start date reached → Live, automatically · Unpublish → Draft'],
          ['Live', 'Inside the date range — what jobseekers see', 'End date passed → Ended, automatically · Unpublish → Draft'],
          ['Ended', 'Past the end date; kept for reporting', 'Cannot return to Live without a new date range · Unpublish → Draft'],
        ],
      },
      warn: 'SUPERSEDED — do not build the old rule. This previously read “a slot holds at most ONE Live banner per period; overlapping date ranges are blocked at save”. The client has confirmed the opposite: a slot renders a FIXED number of positions and rotates an UNLIMITED pool of bookings through them. Overlapping date ranges are therefore NORMAL and must NOT be blocked — blocking them would refuse the ordinary case. What overlapping bookings do change is the share of voice each one gets.',
    },
    {
      label: 'Paid ad slots are sold as products',
      text: 'Every banner has a SOURCE. Sold — bought by a customer, published from a paid PO line. House — Saramin VN’s own promotion (internal hiring, a maintenance notice, a brand campaign), with no company, no PO and no product.',
    },
    {
      label: 'House banners — Saramin VN’s own, and the one rule that matters',
      text: 'A house banner is published straight onto a placement: pick the slot, set both dates, write why, upload. No customer, no PO, no product line to spend — the money side of the record is simply absent.',
      table: {
        cols: ['', 'Sold', 'House'],
        rows: [
          ['Chain to publish', 'Company → PO → product line', 'Placement, directly'],
          ['Requires a paid invoice', 'YES — an uninvoiced PO cannot publish', 'No — there is nothing to invoice'],
          ['End date', 'Derived from the product’s display duration', 'TYPED — no product defines a duration, so it must be set by hand'],
          ['Occupies a rotation slot', 'Yes', 'YES — the same as a sold one'],
          ['Counts toward placement revenue', 'Yes', 'No'],
          ['Extra required field', '—', 'Purpose — the reason it is running'],
        ],
      },
      items: [
        'THE RULE THAT MATTERS: a house banner consumes slot capacity exactly like a sold one. The hero pool is 6; if house banners are excluded from that count, the sixth sold booking has nowhere to render and the oversell is only discovered on the live page.',
        'PURPOSE is required precisely because there is no PO. On a sold banner the order explains why it exists; on a house banner nothing does unless someone writes it down.',
        'The list marks house rows with a “Nội bộ” pill and offers a Nguồn filter, so “what are we running for ourselves?” and “what did customers pay for?” are each one click.',
      ],
      warn:
        'Two things to decide with the business, neither of which the UI can assume: (1) when a pool is full and a paying customer wants in, does a house banner yield — and is that automatic or a human call? (2) who may publish one, given it bypasses the paid-order gate that every other booking passes through.',
    },
    {
      label: 'Publishing a banner — two decisions, and one thing that locks',
      text: 'A banner is an INSTANCE of a Placement product: one company’s creative on one slot for a period. The product already fixed the size, the duration and the slot’s rotation cap when it was sold, so publishing asks for only two things — the START DATE and the IMAGE. Everything else is read from the product and is read-only here.',
      table: {
        cols: ['Status', 'Start date / image editable?', 'Why'],
        rows: [
          ['Draft', 'Both editable', 'Nothing has been promised to anyone yet.'],
          ['Schedule', 'Both editable', 'Not on screen yet, so nothing has been served.'],
          ['Open', 'NEITHER — both frozen', 'The customer paid for the image that is running. Swapping it mid-flight leaves the impressions already counted attributed to an image nobody can retrieve.'],
          ['Expired', 'Neither — read-only', 'A closed booking is a record. Re-book by publishing a new one.'],
        ],
      },
      items: [
        'START DATE IS OPTIONAL, and empty is not "missing" — it MEANS publish now. Leave it blank → Open on save. Set a future date → Schedule until that date. The form states which status it is about to produce rather than describing the rule and leaving the operator to apply it.',
        'EXPOSURE is set at publish, not only afterwards. Publishing with Exposure Off is legitimate: the creative is approved and the dates are fixed, but it is held back a beat. The booking still runs and still expires on time.',
        'To take a running banner off screen, switch EXPOSURE off. That is the mid-flight control — not editing the creative, and not ending the booking early. It is also the ONLY way to stop an Open banner, since the creative and dates are frozen.',
        'Image dimensions must match the slot exactly; a wrong-ratio upload is rejected on save rather than auto-cropped, because a cropped hero banner is a design nobody approved.',
        'The end date is DERIVED from the product’s display duration, never typed — an operator cannot quietly extend a booking the customer did not buy.',
      ],
      warn: 'Never allow a creative swap on an Open banner, and never model Exposure as a fifth status. Both mistakes make the same number un-auditable: clicks and impressions already served would no longer trace to the image that served them.',
    },
    {
      label: 'Popups target an AUDIENCE',
      text: 'Same Draft / Schedule / Open / Expired lifecycle as banners, plus “Always on” (no end date).',
      table: {
        cols: ['Audience', 'Means'],
        rows: [
          ['Guests', 'Not logged in'],
          ['Logged-in jobseekers', 'Authenticated candidates'],
          ['Employers', 'Company users'],
        ],
      },
      items: [
        'FREQUENCY CAPPING is required so a popup is never re-shown too often — e.g. once per session, once per week. Dismissal is remembered per user/device.',
        'Only ONE popup shows at a time. If several are eligible, priority decides which — never stack popups on a page.',
      ],
      warn: 'Eligibility (audience match + frequency cap + priority) is decided SERVER-SIDE and returns at most one popup, so the cap cannot be bypassed from the client.',
    },
    {
      label: 'Popup status',
      text: 'The banner lifecycle plus “Always on” — status is computed from (isPublished, startAt, endAt); operators set dates and publish, never a status.',
      table: {
        cols: ['Status', 'Means', 'Rule'],
        rows: [
          ['Draft', 'Not published; never shown — the only deletable status', 'Publish → Scheduled'],
          ['Scheduled', 'Published, startAt in the future', 'Start reached → Live, automatically · Unpublish → Draft'],
          ['Live', 'Inside startAt–endAt, and still eligible per audience + frequency', 'End passed → Ended, automatically · Unpublish → Draft'],
          ['Always on', 'Published with a startAt and NO endAt; runs indefinitely — the list flags it distinctly so nobody assumes it stops on its own', 'Stays Live until “End now” · Unpublish → Draft'],
          ['Ended', 'endAt has passed; retained with its stats', 'Needs a new date range to run again · Unpublish → Draft'],
        ],
      },
    },
  ],
  features: [
    // 0 · Image gallery ───────────────────────────────────────────────────────
    {
      name: 'Image gallery',
      site: 'Admin',
      scope: ['BE', 'FE'],
      ready: true,
      mockup: 'admin-image-gallery',
      detail: {
        description:
          'The licensed picture library a JOB borrows from when its product feeds a placement with image slots. It stores IMAGE SETS, not loose pictures: one scene carrying up to three formats of the same photograph — ngang (the card at rest), dọc (the card expanded by hover), tròn (the round-thumbnail band). It exists because the premium homepage grid is mostly pictures and most of the companies filling it are SMEs with no photography and no designer: without a library the grid renders holes and the placement they paid for looks cheap. HQ curates it; employers only ever pick from it or upload their own.',
        userStory:
          'As an HQ content operator, I want pictures grouped into sets that already carry all three card formats and the industries they suit, so that a posting gets a complete, consistent card without anyone searching the library three times per job.',
        requirements: [
          {
            label: 'What an image set holds — one required field, three optional',
            text: 'DECIDED 06/11/2026. The set is the unit the library stores and the job form picks. Only ONE field is mandatory, and the choice of which is the whole design: a set with no industry can never be auto-filled, so it would enter the library already invisible. Everything else is optional because a stock pack arrives forty pictures at a time and a rule nobody can satisfy is a rule that gets worked around.',
            table: {
              cols: ['Field', 'Required', 'What it does', 'Why this way'],
              rows: [
                ['**Image set name**', 'No', 'Human label in lists and in the job-form picker', 'Nobody hand-names forty stock pictures. Unnamed sets render as **“Cụm #n”** everywhere, so no list ever shows a blank row.'],
                ['**Industry**', '**Yes**', 'Drives the automatic fill on the job form. Multi-select, at **any of the 3 master-data levels**', 'The only classification the machine reads. Required because an unclassified set is unreachable — see the matching rule below.'],
                ['**Tag**', 'No', 'Free labels for human browsing and filtering. HQ creates, renames and deletes them', 'The loose layer. Industry is the taxonomy that must hold still; tags are what people actually search by.'],
                ['**Expiry date**', 'No', 'Licence expiry', 'The one date that lets a single query find everything to pull when a stock subscription lapses. Blank = perpetual.'],
              ],
            },
            items: [
              'A set also carries its THREE FORMAT SLOTS (below) and a derived usage count. Nothing else.',
              'DROPPED from the earlier draft, and worth flagging: `role` (subject/background) and the mandatory `source`/`licence` fields. Role was feeding the 2-slot hero rule in Placements, and licence/source were the legal-exposure guard. Expiry date now carries part of what licence did. **Open question for the client** — see below.',
            ],
            warn: 'INDUSTRY IS THE ONLY GATE, and it has to stay that way in the API too, not just the form. A set created through bulk import, or through a future API, must be rejected with no industry for exactly the same reason — otherwise the library quietly fills with pictures the resolver can never reach, and the homepage holes come back with nobody able to explain why.',
          },
          {
            label: 'Three formats per set — any of them may be empty',
            table: {
              cols: ['Format', 'Size', 'Where it prints', 'May be empty?'],
              rows: [
                ['**Ngang** (landscape)', '596 × 336 · 16:9', 'The card at rest on the paid bands', 'Yes'],
                ['**Dọc** (portrait)', '600 × 800 · 3:4', 'The card expanded on hover', 'Yes'],
                ['**Tròn** (circle)', '240 × 240 · 1:1', 'The round-thumbnail band', 'Yes'],
              ],
            },
            items: [
              'A set is COMPLETE when all three exist. **Only a complete set may be an automatic default** — a half-set leaves the hover card empty, which is worse than the card the placement was sold as.',
              'An incomplete set stays hand-pickable for the formats it does have. It is not an error; it is a set someone has not finished, and the gallery has a “Phiên bản · Còn thiếu” filter that lists exactly those.',
              'The exact pixel sizes come from the Placements registry, not from this list. Which formats a posting actually REQUIRES is derived from the placements its product feeds — a package that never prints a circle must not block Post over a missing circle.',
            ],
          },
          {
            label: 'Industry is chosen at any of the 3 levels, and matching walks the chain',
            text: 'Industry master data is group (level 1) › industry (level 2) › specialty (level 3) — 636 nodes today: 11 groups, 70 industries, 555 specialties, read from prod on 06/11/2026. The SAME 3-level picker the jobseeker side uses (Jobseeker & user › Onboarding · “Industry picker”), with the same four checkbox states and the same merge rule, because a second implementation of a tree this fiddly diverges within a sprint.',
            table: {
              cols: ['Tier', 'When', 'Rank'],
              rows: [
                ['**Ancestor**', 'The set is tagged at the job’s own node or above it', 'Best. Deeper matched node wins — a set tagged “Kho bãi/lưu trữ” beats one tagged “Bán hàng và phân phối” for a warehouse job.'],
                ['**Descendant**', 'The set is tagged BELOW the job’s node', 'Usable, ranked after every ancestor match — it is a guess about a job that did not commit.'],
                ['**Mọi ngành**', 'The set carries the neutral flag', 'Last resort. Never counted as coverage.'],
              ],
            },
            items: [
              'The resolver orders by (tier, −depth, least-used) and takes the first COMPLETE set. Least-used is not a refinement: plain “first match” puts one photograph on every card of an industry, which is the failure this whole feature exists to prevent.',
              'A set may carry SEVERAL industries, at mixed levels. One office photo honestly serves IT, banking and marketing; single-select would force the same file to be uploaded once per industry.',
              '“Mọi ngành” is an explicit FLAG, not “all 11 groups ticked” — so a new group added to master data inherits it instead of being silently excluded.',
              'Filtering the gallery by a group means its WHOLE BRANCH, or the filter lies about what the library holds.',
            ],
          },
          {
            label: 'Tags are created, renamed and deleted by HQ — not master data',
            items: [
              'A tag is created FROM THE FIELD, as you classify: type a name that does not exist and “＋ Tạo tag «x»” appears. The moment you need a tag is while looking at the picture, not in a separate admin screen beforehand — routing that through a master-data release is how tagging quietly stops happening.',
              'A “Quản lý tag” panel does the tidying: rename in place, and delete. Rename applies instantly to every set carrying the tag.',
              'DELETING A TAG DETACHES IT, NEVER DELETES A SET. Losing a label is not a reason to lose a photograph. The delete confirms with the count of sets affected.',
              'Tags are free text with no hierarchy and no required values, on purpose. INDUSTRY is the axis that must stay stable because the resolver reads it; tags are the human layer and are allowed to be messy.',
            ],
          },
          {
            label: 'Creating a set — one screen: drop a master, crop the frames, classify',
            text: 'REVISED 06/11/2026. The first cut asked you to choose "one master" vs "upload each frame" before you had done anything, then pushed classification onto a second step. Both were wrong, and for the same reason: they made the user commit to a shape before they had seen the picture.',
            items: [
              'ONE SCREEN, NO MODE TOGGLE. A master dropzone at the top; the three frames beneath it; name, expiry, tag and industry underneath that. Drop, check the crops, pick an industry, save — one pass.',
              'THE TWO UPLOAD ROUTES ARE NOT ALTERNATIVES. Dropping a master fills every EMPTY frame by cropping it. Dropping a file straight onto a frame makes that frame use its own picture. MIXING THEM ON ONE SET IS NORMAL — "landscape and portrait cropped from the master, circle shot separately" is a real case, and the old toggle made it impossible to express.',
              'A MASTER NEVER OVERWRITES A FRAME THAT ALREADY HAS ITS OWN FILE. Re-cropping over a deliberate upload is the single behaviour that would make this screen untrustworthy. Removing the master clears only the frames derived FROM it; hand-uploaded frames survive.',
              'CROPPING IS AN OVERLAY ON THE SAME DIALOG, per frame, opened by “Cắt”. The master fills the stage, a scrim darkens everything outside the frame, and the card’s own furniture (the badge box, the ☆) is drawn on top — so the crop is judged against a real card instead of a guess.',
              'THE CIRCLE DEFAULTS TO A 1:1 CROP OF THE PORTRAIT on the same focal point. That is what makes the normal set cost ONE upload rather than three.',
              'Each frame shows where its picture came from — ✂ for cropped-from-master, "tệp riêng" for its own file — because six months later "why does the hover card look different" has to be answerable from the screen.',
              'Per-frame “Bỏ trống” stays explicit and reversible, so an incomplete set is a decision rather than an accident.',
              'CLASSIFICATION IS ON THE SAME SCREEN, not a step 2. Only industry gates the save; name, tag and expiry sit beside it and can be left blank.',
            ],
            warn: 'The counter in the footer states both blockers in plain words — "cụm thiếu, không dùng làm ảnh tự điền" and "chưa chọn ngành" — rather than only disabling the button. A disabled button with no reason is the most common way a form like this stalls.',
          },
        ],
        uiFields: [
          {
            group: 'Image set',
            items: [
              { name: 'name', type: 'string?', notes: 'OPTIONAL. Falls back to “Cụm #n” in every list. Searchable.' },
              { name: 'industries', type: 'ref[] → Industry node, any level', required: true, notes: 'THE ONLY MANDATORY FIELD. Multi-select across levels 1–3. Stored as the chosen node id, never expanded into leaves — tagging a group would otherwise write forty rows that all have to be rewritten when the taxonomy gains a branch.' },
              { name: 'anyIndustry', type: 'bool', notes: 'the neutral flag; the fallback pool for a thin industry. A flag, not 11 ticks.' },
              { name: 'tags', type: 'ref[] → ArtworkTag', notes: 'OPTIONAL. Created inline from the field; HQ renames and deletes them freely.' },
              { name: 'expiresAt', type: 'date?', notes: 'OPTIONAL licence expiry. Blank = perpetual. Indexed — this is the field the “what lapses this month” query reads.' },
              { name: 'masterUrl / focalPoint', type: 'string? / {x,y}?', notes: 'present only for sets created through route ①; route ② has no shared master' },
              { name: 'usageCount', type: 'derived', notes: 'counted from live jobs; drives least-used-first ordering and the “12 tin dùng” badge' },
              { name: 'status', type: "enum('active'|'archived')", required: true, notes: 'Archived leaves the picker but keeps resolving for jobs already using it' },
            ],
          },
          {
            group: 'Format slot (×3 per set)',
            items: [
              { name: 'format', type: "enum('ngang'|'doc'|'tron')", required: true, notes: 'UNIQUE per set. Any of the three may be absent.' },
              { name: 'cropBox / derived', type: '{x,y,w,h}? / bool', required: true, notes: 'derived = cropped from the set’s master (route ①, marked ✂ in the UI). false = its own uploaded file (route ②, or a per-frame override).' },
              { name: 'fileUrl / width / height', type: 'string / int / int', required: true },
              { name: 'version', type: 'int', required: true, notes: 'bumped on replace. Jobs reference the version they were given, so a library edit never repaints a running posting.' },
            ],
          },
          {
            group: 'ArtworkTag',
            items: [
              { name: 'id / name', type: 'uuid / string', required: true, notes: 'name unique, case-insensitive — otherwise “Văn phòng” and “văn phòng” both exist within a week' },
              { name: 'usageCount', type: 'derived', notes: 'shown in the manager so a delete states what it affects' },
            ],
          },
        ],
        behaviors: [
          'The grid lists SETS, each drawn as its three formats side by side at their real aspect ratios — the same hue across all three is the wireframe proving they are one photograph. A missing format renders as a dashed “trống” box rather than being omitted.',
          'Filters: nhóm ngành (whole branch, with each group’s complete-set count printed in the option) · tag · phiên bản (đủ cả 3 / còn thiếu) · đã lưu trữ, plus keyword search over name and tag names.',
          'COVERAGE IS READ OFF THE FILTERS, NOT BANNERS. The group filter prints the count; “Phiên bản · Còn thiếu” lists the unfinished sets. The earlier amber warning panels were removed on the client’s instruction (06/11/2026) — a warning you cannot click is noise sitting above the work.',
          'Saving a set is blocked until it has at least one industry OR the “Mọi ngành” flag. No other field blocks save.',
          'Archiving a set that live jobs use warns with the job count and offers to move those jobs to their industry’s automatic default. Nothing is ever deleted.',
          'Tag create happens inline in the tag field; tag rename and delete happen in the “Quản lý tag” panel. Delete detaches from every set and confirms with the affected count.',
        ],
        rules: [
          'HQ uploads to the shared library; employers never do. An employer’s upload stays on their job (and on their company’s own private sets) and is never promoted into the shared library — we do not hold the right to redistribute their photo to another company.',
          'Industry is REQUIRED on every path that creates a set: the form, the bulk import, and any API.',
          'Industry and tags sit on the SET, never on an individual format. Three formats of one photograph cannot honestly be classified differently.',
          'Only a COMPLETE set can be an automatic default. An incomplete one stays hand-pickable for the formats it has.',
          'A set is never deleted, only archived — live jobs and past renders point at its format files.',
          'Deleting a tag never deletes a set.',
          'The gallery carries no company branding, no baked-in text and no logos — the card draws those itself.',
        ],
        states: [
          'Set: complete (all 3) · incomplete (missing 1–2 formats) · unnamed (renders as “Cụm #n”) · archived',
          'Create · step 1: route ① no master yet · master rejected (<1600×1200) · master accepted with 3 crops · a frame deliberately left empty · route ② with 1–3 files',
          'Create · step 2: no industry (save disabled) · ready',
          'Tag: in use by N sets · unused · delete confirmation',
          'Licence expiring within 30 days · expired',
          'In use by N live jobs (blocks silent archiving)',
        ],
        backend: {
          dataModel: [
            { name: 'ImageSet.id', type: 'uuid', required: true },
            { name: 'name', type: 'text NULL', notes: 'optional; UI falls back to “Cụm #n”' },
            { name: 'industryIds', type: 'uuid[]', required: true, notes: 'FK → master data industry, ANY level; indexed. NOT NULL and length ≥ 1 unless anyIndustry.' },
            { name: 'anyIndustry', type: 'bool', required: true, notes: 'default false' },
            { name: 'tagIds', type: 'uuid[]', notes: 'FK → ArtworkTag; indexed' },
            { name: 'expiresAt', type: 'date NULL', notes: 'indexed — the “what lapses this month” query' },
            { name: 'masterUrl / focalX / focalY', type: 'string? / numeric? / numeric?', notes: 'route ① only' },
            { name: 'status', type: "enum('active'|'archived')", required: true },
            { name: 'ImageSetFormat', type: 'entity', required: true, notes: '(id, setId, format enum(ngang|doc|tron), cropBox, derived, fileUrl, w, h, version) · UNIQUE(setId, format). IMMUTABLE: a replace writes a new row/version. This is the id a job holds.' },
            { name: 'ArtworkTag', type: 'entity', required: true, notes: '(id, name UNIQUE CI, createdBy, createdAt). Delete is a hard delete of the tag plus a detach from every set — never a cascade onto sets.' },
            { name: 'JobArtwork', type: 'entity', required: true, notes: '(jobId, ngangFormatId, docFormatId, tronFormatId, appliedSetId NULL when mixed, source enum(auto|manual|mixed|company)). THREE FILE IDS, not a set id — the reason a library edit cannot repaint a running posting.' },
          ],
          endpoints: [
            'GET /admin/image-sets?industry=&tag=&complete=&status=&q=',
            'POST /admin/image-sets · PATCH /admin/image-sets/:id · POST /admin/image-sets/:id/archive',
            'PUT /admin/image-sets/:id/formats/:format — re-crop or replace one slot (writes a new version)',
            'DELETE /admin/image-sets/:id/formats/:format — leave a slot empty',
            'GET · POST /admin/artwork-tags · PATCH /admin/artwork-tags/:id · DELETE /admin/artwork-tags/:id (detaches from all sets)',
            'GET /artwork/pick?industry=&tag=&format=&completeOnly=&q= — the job-form picker; Active only, best-fit then least-used',
            'GET /artwork/default?industry= — the resolver: complete Active sets ranked (tier, −depth, usage asc), returns the three file ids',
          ],
          integrations: [
            'Master data (Industry, all 3 levels — the automation axis)',
            'Placements registry (which formats a package actually prints, and at what pixel size)',
            'Job management (the Card artwork step; the job holds three file ids)',
            'Object storage / CDN (master + derived crops, cached per format)',
          ],
          notes:
            'Crops are derived and cached per (format file, size) — the master is never served to the site. The resolver ordering (tier, −depth, usage asc) is the single rule that both respects a specific tag and spreads the library out.',
        },
        acceptance: [
          'A set can be saved with ONLY an industry — no name, no tag, no expiry.',
          'A set cannot be saved without an industry, from the form OR the bulk import.',
          'Creating a set from ONE master produces up to three formats without a second upload; the circle defaults to a 1:1 crop of the portrait.',
          'A set saved with a format deliberately left empty is accepted, is hand-pickable for the formats it has, and never appears as an automatic default.',
          'Typing an unknown tag name in the tag field offers to create it, and the new tag is immediately usable on other sets.',
          'Renaming a tag updates every set showing it; deleting a tag removes the label from every set and deletes no set.',
          'Filtering by a level-1 group returns sets tagged anywhere inside that branch, including level-3 ones.',
          'Two jobs created back-to-back in the same industry receive DIFFERENT sets while unused complete sets remain.',
          'Replacing a format in the library does not change the picture on a posting that is already running.',
        ],
        openQuestions: [
          'ROLE (subject / background) was dropped from the set. The Placements 2-slot hero rule assumed it — "one background + one subject", because two subjects side by side fight each other. Does that rule still hold, and if so where does the flag live now?',
          'SOURCE and LICENCE TYPE were dropped; only Expiry date survives. An unlicensed picture on a paid placement is the client’s legal exposure. Is the expiry date alone enough, or do we keep a free-text `source` for the audit trail?',
          'Tag names: free text, or normalised (trim + collapse case) on save? Free text means “Văn phòng” and “văn phòng ” both exist by week two.',
          'Seed volume: the floor is 3 complete sets per level-1 group, 11 groups, with neutral sets counting for none of them — so roughly 35–40 masters, each of which must crop cleanly to 16:9, 3:4 AND 1:1. Who licenses them?',
        ],
      },
    },
    // 0b · Bulk image import ──────────────────────────────────────────────────
    {
      name: 'Bulk image import',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-image-bulk',
      detail: {
        description:
          'A page that turns a filled-in Excel sheet plus a folder of Drive links into image sets. It exists because a stock pack lands forty pictures at a time, the licence is bought and the files are prepared OUTSIDE the admin, and creating forty sets one dialog at a time is work nobody does — which is how a library stays empty.',
        userStory:
          'As an HQ content operator, I want to hand a customer a template, get it back filled in, and import the whole batch in one pass, so that loading a stock pack is minutes rather than an afternoon.',
        requirements: [
          {
            label: 'The sheet is ONE ROW PER IMAGE — rows sharing a Name become one set',
            text: 'The single most important decision on this page. The person filling the sheet never has to hold the idea of a "set" in their head; they only state "this file is the ngang one of Văn phòng HN". Asking a customer to express a 1-to-3 relationship inside a flat spreadsheet is where imports like this usually die.',
            table: {
              cols: ['Column', 'Required', 'Validation'],
              rows: [
                ['**Name**', 'No', 'Free text. Rows with the SAME name are merged into one set. Blank names are never merged with each other — each blank row becomes its own single-image set.'],
                ['**Image link**', '**Yes**', 'Google Drive link, must be openable by link. A row with no link is rejected.'],
                ['**Format**', '**Yes**', 'Exactly one of Ngang · Dọc · Tròn (dropdown in the template). Anything else rejects the row.'],
                ['**Industry**', '**Yes**', 'Must resolve to a real master-data node. The template ships a 636-option dropdown carrying the full path, so all 3 levels are selectable.'],
                ['**Topics tag**', 'No', 'Comma-separated. Unknown tags are CREATED on import — the same free-tag rule as the form.'],
                ['**Licence expiry**', 'No', 'dd/mm/yyyy. Blank = perpetual.'],
              ],
            },
            items: [
              'Two rows with the same Name but DIFFERENT industry/tag/expiry: the first row wins and the import flags the conflict rather than silently picking one.',
              'Two rows with the same Name and the same Format: the second is rejected — a set cannot hold two ngang.',
              'The template is generated FROM master data, not hand-maintained: `scripts/make_gallery_import_template.py`, output `public/templates/gallery-images-import-template.xlsx`. Re-run it when the industry taxonomy changes.',
            ],
            warn: 'The dropdown must be written WITHOUT a leading “=” in the xlsx `dataValidation/formula1`, and backed by a defined name. Excel tolerates the “=”, Google Sheets silently drops the entire rule — which is exactly what happened on the first cut of this template, and the customer sees a plain text cell with no dropdown and no error.',
          },
          {
            label: 'Validate per row, import the rest — never block the batch',
            items: [
              'Every row is checked on upload and the result is shown in a table: the bad rows highlighted in place, each with the reason under it.',
              'INVALID ROWS ARE SKIPPED, THE REST IMPORTS. One misspelt cell must not stop forty pictures. The operator downloads a .xlsx of just the failed rows, the customer fixes those, and re-uploading skips sets that already exist.',
              'Before committing, a preview shows the SETS that will be created — each drawn as its three format slots, with the missing ones dashed, so "this batch gives us 12 sets, 4 of them without a circle" is visible before anything is written.',
              'The page also states the count out loud: “N dòng hợp lệ → M cụm”, because rows and sets are different numbers and an operator who confuses them will think half the batch vanished.',
            ],
          },
        ],
        uiFields: [
          {
            group: 'Upload & review',
            items: [
              { name: 'file', type: 'file (.xlsx)', required: true, notes: 'the filled template' },
              { name: '(per row) status', type: "enum('ok'|'error')", notes: 'with the reason string, shown inline under the row' },
              { name: '(summary) rows / sets / errors', type: 'derived', notes: 'printed before the commit button' },
              { name: 'errorExport', type: 'file (.xlsx)', notes: 'the failed rows only, same columns, ready to hand back' },
            ],
          },
        ],
        behaviors: [
          'Download-template button sits at the top of the page, before the drop zone — the common first visit is "I need the file to send out", not "I have a file to upload".',
          'Drop zone accepts .xlsx only. On parse, the review table renders with per-row validation.',
          'Images are fetched from the Drive links server-side at import time; a link that 403s fails that row with “link không mở được”.',
          'Each imported image is run through the same ≥1600×1200 check as the form. Under that, the row fails rather than being upscaled.',
          'Re-uploading a sheet skips sets whose Name already exists, so fixing five rows and re-importing is safe.',
        ],
        rules: [
          'Industry is required per row, exactly as in the form. No bypass through import.',
          'Unknown tag names are created, not rejected — tags are a free layer by design.',
          'An import never overwrites an existing set; it creates or it skips.',
          'Sets created by import are identical to hand-made ones — no "imported" second class, no separate table.',
        ],
        states: [
          'No file yet (shows the 3-step explainer) · file parsed with all rows valid · file parsed with some rows failing · every row failing · import committed',
        ],
        backend: {
          dataModel: [
            { name: 'ImportBatch', type: 'entity', notes: '(id, fileName, uploadedBy, uploadedAt, rowCount, setCount, errorCount) — kept so "where did this picture come from" has an answer' },
          ],
          endpoints: [
            'POST /admin/image-sets/import/validate — multipart .xlsx → per-row result, no writes',
            'POST /admin/image-sets/import/commit — creates the sets, returns created/skipped/failed',
            'GET /admin/image-sets/import/template.xlsx — the generated template',
          ],
          integrations: ['Master data (industry resolution by path string)', 'ArtworkTag (create-on-import)', 'Google Drive (fetching the linked files)', 'Object storage'],
        },
        acceptance: [
          'Three rows sharing a Name with Ngang / Dọc / Tròn produce ONE complete set.',
          'Two rows sharing a Name with only Ngang / Dọc produce one set missing the circle, and it is flagged in the preview.',
          'A row with an industry string that is not in master data fails with that reason and does not block the other rows.',
          'A row with no industry fails — the import cannot create an unclassified set.',
          'Unknown tag names in the sheet exist as tags after the import.',
          'The downloadable template opens in Google Sheets with a working 636-option Industry dropdown covering all 3 levels.',
        ],
        openQuestions: [
          'Drive links: do we fetch server-side at import (needs the folder shared to a service account), or ask the customer to attach a zip instead? The mockup assumes fetch-by-link.',
          'Should a re-upload be able to UPDATE an existing set (add the missing circle), or only ever create new ones? The mockup assumes skip.',
        ],
      },
    },
    // 1 · Slot occupancy ──────────────────────────────────────────────────────
    {
      name: 'Slot occupancy',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-slots',
      detail: {
        description:
          'KHÔNG phải trang riêng: là tab thứ hai của trang Boosting đang có (Service delivery → Boosting). Trang Boosting chia làm 2 tab — **Ads** (danh sách ad như hiện tại, không đổi) và **By placement** (màn hình này). Tab By placement là một bảng, mỗi dòng là một Display placement (Product settings → Placements): placement đó trông thế nào trên site, bao nhiêu banner đang hiển thị và bao nhiêu banner đang chờ hiển thị. Mở rộng một dòng để xem các banner đang hiển thị và đang chờ; bấm View all để chuyển sang tab Ads với bộ lọc Placement đã chọn sẵn, gồm cả banner đã hết hạn. Mọi con số đều suy ra từ Placements và các ad; tab này không lưu và không cho nhập gì. Chốt ngày 16/10/2026 (cột “No-banner periods” đã bỏ cùng ngày); mockup làm để khách hàng xem trước.',
        userStory:
          'Là admin vận hành banner, tôi muốn thấy mọi placement cùng lúc với số banner đang hiển thị và đang chờ, để biết vị trí nào đang trống hoặc sắp hết banner và xếp banner (của khách hoặc nội bộ) vào.',
        keyPoints: [
          { vi: 'Một trang Boosting, 2 tab: Ads (giữ nguyên như build) · By placement (mới). Không thêm mục menu mới.', en: 'One Boosting page, two tabs: Ads (as built) · By placement (new). No new menu entry.' },
          { vi: 'Một dòng = một Display placement đang bật. Placement chưa từng có ad nào vẫn hiện — một dòng trống chính là câu trả lời.', en: 'One row per active Display placement — including placements that have never had an ad.' },
          { vi: 'View all = chuyển sang tab Ads, bộ lọc Placement đặt sẵn — đúng như `/content/boosting?placement=<placement id>` hiện nay.', en: 'View all switches to the Ads tab with the Placement filter set — the same as `/content/boosting?placement=<placement id>` today.' },
        ],
        uiFields: [
          {
            group: 'Trang Boosting — khung chung của 2 tab',
            items: [
              { name: 'header', type: 'text', notes: 'Tiêu đề Boosting + mô tả + nút **+ New** — như hiện tại, dùng chung cho cả 2 tab' },
              { name: 'tabs', type: 'tabs', notes: '**Ads** (tổng số ad) · **By placement** (số placement). Mặc định mở Ads. Tab nằm trên URL: `/content/boosting` = Ads, `/content/boosting?tab=placements` = By placement, để link chia sẻ mở đúng tab.' },
              { name: 'As of', type: 'date', notes: 'ngày “hôm nay” mà mọi con số tính từ đó — đồng hồ server, hiện ở cuối thanh tab' },
            ],
          },
          {
            group: 'Tab Ads — danh sách Boosting hiện tại, không đổi',
            items: [
              { name: 'toolbar', type: 'filters', notes: 'Search banners and popups · All types · All statuses (Draft · Scheduled · Open · Closed) · All placements' },
              { name: 'cột', type: 'composite', notes: 'Image · Name (+ Purpose) · Type · Placement (+ công ty / “Every company page”) · Source (+ công ty) · Status · Visible · Starts · Ends · ⋯ (Edit · Delete)' },
              { name: 'sort', type: 'rule', notes: 'mặc định Starts, mới nhất trước' },
            ],
          },
          {
            group: 'Tab By placement — bảng chính (một dòng / placement)',
            items: [
              { name: 'expand', type: 'toggle', notes: 'Mở trang thì MỌI placement đều đã mở sẵn danh sách ad đang hiển thị + đang chờ ngay dưới dòng. ▸ / ▾ trên dòng (hoặc bấm tên placement) đóng/mở một placement.' },
              { name: 'Placement', type: 'text', notes: 'Chỉ Name — như trong ô chọn Placement của Boosting. Không hiện key, page, kích thước hay số slide trên bảng.' },
              { name: 'Preview', type: 'image', notes: 'Reference image của placement (upload ở Placements, chỉ admin thấy). Bấm để xem lớn. Chưa có ảnh → “No reference image — add one on Placements”.' },
              { name: 'Showing now', type: 'number', notes: 'Chỉ con số: số ad Open + Visible On (đỏ khi = 0). Có ad Open nhưng Visible Off → thêm dòng “+ n hidden (Visible off)”.' },
              { name: 'Waiting', type: 'number', notes: 'Số ad Scheduled. Dòng phụ: ngày bắt đầu sớm nhất · công ty.' },
              { name: 'View all', type: 'link', notes: 'nhãn chỉ “View all”, không kèm số. Chuyển sang tab Ads với Placement = placement này (URL thành `/content/boosting?placement=<placement.id>`), mọi trạng thái.' },
            ],
          },
          {
            group: 'Tab By placement — thanh công cụ',
            items: [
              { name: 'search', type: 'string', notes: 'khớp name (và key · placement id, dù không hiện trên bảng)' },
              { name: 'Expand all · Collapse all', type: 'buttons', notes: 'mở / đóng danh sách ad của mọi placement cùng lúc' },
            ],
          },
          {
            group: 'Tab By placement — dòng mở rộng (ad đang hiển thị + đang chờ)',
            items: [
              { name: 'cột', type: 'composite', notes: 'Image · Name + ad id · Company ID · Company + Order/PO (hoặc Free product / —) · Banner type · Source (Customer / Internal) · Starts → Ends · Days · Visible · Status' },
              { name: 'Banner type', type: 'derived', notes: 'Paid = đặt trên một dòng của PO trả tiền · Free = đặt trên free product (“— No order (free) —”) · quảng cáo Internal để “—” (Source đã nói rõ)' },
              { name: 'Company ID', type: 'text', notes: 'mã CO-XXXXXXX của khách; quảng cáo Internal để “—”' },
              { name: 'Days', type: 'derived', notes: 'Open: “N d left” (tô vàng khi ≤ 7) hoặc “last day” / “no end”. Scheduled: “starts in N d”.' },
              { name: 'thứ tự', type: 'rule', notes: 'Open + Visible On (theo ngày kết thúc tăng dần) → Open + Visible Off → Scheduled (theo ngày bắt đầu tăng dần)' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Mỗi cột được tính như thế nào',
            text: 'Tính khi đọc, từ bảng placement + các ad của placement đó. “Hôm nay” là ngày theo đồng hồ server (giờ Việt Nam), tính theo NGÀY, không theo giờ. Ngày kết thúc của ad là ngày hiển thị CUỐI CÙNG (inclusive).',
            table: {
              cols: ['Cột', 'Công thức', 'Ghi chú'],
              rows: [
                ['Showing now', 'count(ad: Status = Open, visible = true)', 'Ad không có ngày kết thúc (popup “No end date”) tính là đang hiển thị.'],
                ['hidden', 'count(ad: Status = Open, visible = false)', 'Không lên site nên KHÔNG tính vào Showing now, nhưng vẫn giữ một slide cho kiểm tra sức chứa.'],
                ['Waiting', 'count(ad: Status = Scheduled)', 'Draft KHÔNG tính — chưa được xếp lịch.'],
              ],
            },
          },
          {
            heading: 'Mở rộng dòng và View all',
            table: {
              cols: ['Thao tác', 'Hiện gì', 'Ở đâu'],
              rows: [
                ['▸ trên dòng', 'Ad đang hiển thị (gồm cả Visible Off, có đánh dấu) + ad đang chờ của placement', 'Ngay dưới dòng, trên chính trang này. Mở nhiều dòng cùng lúc được.'],
                ['View all', 'MỌI ad của placement, kể cả Draft và Closed', 'Tab Ads của cùng trang, bộ lọc Placement đặt sẵn — `/content/boosting?placement=<placement.id>`; bộ lọc `placement` đã có trong `use-display-ads-list.ts`. Bấm Clear để bỏ lọc. Không mở modal, không làm trang chi tiết riêng cho từng placement.'],
              ],
            },
          },
          {
            heading: 'Trạng thái dùng trên màn hình',
            text: 'Lấy nguyên cột Status của Boosting (`displayAdPhase` trong build): bốn giá trị, suy ra từ trạng thái lưu + ngày. Không thêm trạng thái mới cho placement.',
            table: {
              cols: ['Status', 'Suy ra từ', 'Đếm vào (tab By placement)'],
              rows: [
                ['Draft', 'chưa Published (Draft, hoặc Review)', 'chỉ View all'],
                ['Scheduled', 'Published, start > hôm nay', 'Waiting'],
                ['Open', 'Published, start ≤ hôm nay ≤ end (không có end = Open mãi)', 'Showing now (Visible On) hoặc hidden (Visible Off)'],
                ['Closed', 'Published và end < hôm nay, hoặc Archived', 'chỉ View all'],
              ],
            },
          },
        ],
        states: [
          'Placement không có ad nào: Showing now 0 (đỏ), Waiting 0; View all mở tab Ads trống.',
          'Placement chưa có Reference image: ô Preview hiện khung nét đứt “No reference image — add one on Placements”.',
          'Placement đang Inactive: KHÔNG hiện trên bảng (không trang nào vẽ nó).',
          'Dòng mở rộng không có ad đang hiển thị hay đang chờ: “Nothing showing and nothing waiting on this placement.”',
          'Tìm kiếm không khớp: “No placement matches.”',
        ],
        backend: {
          dataModel: [
            { name: 'SlotOccupancyRow', type: 'derived (không lưu)', notes: 'placementId, name, referenceImageUrl, showingCount, hiddenCount, waitingCount, totalCount, nextStart {date, company}' },
          ],
          endpoints: [
            'GET /admin/slot-occupancy — một dòng / Display placement đang bật, với các số đã tính theo ngày server',
            'Dòng mở rộng: dùng lại list ad của Boosting với `placement` + `phase=OPEN,SCHEDULED` — không cần endpoint mới',
          ],
          notes:
            'Tính khi đọc, giống cách Boosting suy ra Scheduled / Open / Closed từ ngày. Không thêm cột nào vào bảng placement hay bảng ad. Quyền đọc: như Boosting (`content_display:read`). Không thêm mục menu — tab nằm trong trang Boosting.',
        },
        acceptance: [
          'Trang Boosting có 2 tab Ads · By placement; mở `/content/boosting` vào tab Ads, `?tab=placements` vào tab By placement.',
          'Tab Ads giữ nguyên cột, bộ lọc và sort như build hiện tại.',
          'Mỗi Display placement đang bật có đúng một dòng, kể cả placement chưa từng có ad.',
          'Ad Open + Visible Off không tính vào Showing now và hiện thành “+ n hidden (Visible off)”.',
          'Ad Draft không tính vào Waiting.',
          'View all chuyển sang tab Ads với bộ lọc Placement đã chọn, URL thành `?placement=<placement.id>`, và hiện cả ad Draft và Closed.',
          'Ngày “As of” hiện trên màn hình; mọi “N d left” / “starts in N d” trong dòng mở rộng kiểm được bằng tay từ ngày đó.',
        ],
        openQuestions: [
          'Reference image có cần bắt buộc cho mọi Display placement không? Placement chưa có ảnh thì cột Preview chỉ hiện khung trống.',
          'Có cần nhắc tự động (thông báo / email) khi một placement sắp hết banner đang hiển thị mà không có gì đang chờ không, hay chỉ xem trên màn hình?',
        ],
      },
    },
    // 1 · Banner admin ────────────────────────────────────────────────────────
    {
      name: 'Create banner + Banner list',
      site: 'Admin',
      scope: ['BE', 'FE'],
      mockup: 'admin-banners',
      detail: {
        description:
          'The HQ screen for booking and managing every banner on the jobseeker site: a list with derived status, plus a create / edit form. A banner is an image (per breakpoint), a destination link, a named slot and a date range. Because paid ad slots are sold as products, this is also where a booking is tied back to the ad product the advertiser bought — and where the operator is shown what a new booking does to the share of voice of the bookings already in that slot.',
        userStory:
          'As an HQ marketing operator, I want to book a banner into a slot for a date range, so that the campaign goes live and ends by itself without anyone remembering to switch it off.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'search', type: 'string', notes: 'banner name / advertiser / destination URL' },
              { name: 'slot', type: 'enum', notes: 'Home hero · Home mid (long) · Sidebar (square) · … — the fixed slot list' },
              { name: 'status', type: 'enum', notes: 'Draft · Scheduled · Live · Ended — derived; filter only, never editable' },
              { name: 'date range', type: 'date range', notes: '"what runs in this period" — the booking question sales asks' },
              { name: 'row', type: 'composite', notes: 'thumbnail · name · slot · from–to · status badge · impressions / clicks / CTR · owner' },
              { name: 'row actions', type: 'buttons', notes: 'Edit · Duplicate · Unpublish (→ Draft) · End now · Delete (Draft only)' },
            ],
          },
          {
            group: 'Content',
            items: [
              { name: 'name', type: 'string', required: true, notes: 'internal label — never shown to jobseekers' },
              { name: 'image (desktop)', type: 'file', required: true, notes: 'the exact pixel size is fixed per slot and shown beside the upload field' },
              { name: 'image (mobile)', type: 'file', notes: 'falls back to the desktop image if omitted; slots have very different mobile ratios' },
              { name: 'altText', type: 'string', required: true, notes: 'accessibility — and what shows if the image fails to load' },
              { name: 'destinationUrl', type: 'url', required: true, notes: 'internal path or external link' },
              { name: 'openInNewTab', type: 'bool', notes: 'default on for external destinations' },
            ],
          },
          {
            group: 'Placement & schedule',
            items: [
              { name: 'slot', type: 'enum', required: true, notes: 'the named page area; drives the required image dimensions' },
              { name: 'startAt / endAt', type: 'datetime', required: true, notes: 'the ONLY status input — Scheduled / Live / Ended are computed from it' },
              { name: 'priority', type: 'int', notes: 'tie-break if a slot is ever allowed to rotate several banners (see open questions)' },
              { name: 'targetPages', type: 'enum[]', notes: 'which pages, when a slot exists on more than one' },
            ],
          },
          {
            group: 'Commercial (paid ad bookings)',
            items: [
              { name: 'isPaid', type: 'bool', required: true, notes: 'off = HQ house banner, no product needed; on = sold inventory' },
              { name: 'advertiser', type: 'ref → Company', notes: 'required when isPaid — links the banner to the customer' },
              { name: 'adProduct / orderRef', type: 'ref → Product / Order', notes: 'the purchased ad product (e.g. "Main ad — Home hero", per week) from Products & packages' },
              { name: 'bookedPeriod', type: 'derived', notes: 'what the advertiser actually paid for — the form warns when startAt–endAt exceeds it' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — the SAME four as a job, derived from the schedule, never typed',
            items: [
              'Draft — created but not published. Never rendered on the jobseeker site. The only status that can be deleted.',
              'Schedule — published with a startAt in the future. Nothing shows yet; the list makes the go-live date obvious.',
              'Open — now is between startAt and endAt. This is what jobseekers actually see.',
              'Expired — endAt has passed. Kept for reporting (impressions / clicks stay attached); it cannot return to Open without a new booking.',
              'Schedule → Open and Open → Expired happen with no operator action at all (see the backend note on deriving status on read).',
              'The operator actions that DO exist: Publish (Draft → Schedule / Open), End now (endAt = now → Expired), Duplicate (a fresh Draft, for re-booking the next period).',
              'EXPOSURE is a SEPARATE flag, exactly as on a job: On / Off. An Open banner with Exposure Off is off screen but its booking still runs and still expires on time. That is what an operator reaches for mid-flight — pausing is not the same as ending, and the two must never share one field.',
            ],
          },
        ],
        behaviors: [
          'Selecting a slot shows the required image dimensions inline and validates the upload against them.',
          'Saving without publishing keeps the banner in Draft; image, link and date validation runs on publish.',
          'A banner is never hand-set to Live: the operator publishes with a date range and the status follows.',
          'SUPERSEDED: there is NO double-booking guard. The pool is unlimited, so an overlapping date range in the same slot is a normal second booking, not a conflict. The form instead SHOWS what the new booking does to share of voice — “vị trí này sẽ có N banner xoay vòng, mỗi banner ~X% thời lượng” — so the operator sells with the dilution in front of them rather than discovering it later.',
          '"End now" stops a Live banner immediately (endAt = now) and is the emergency stop for a wrong or complained-about creative.',
          'Duplicate copies the content and slot but clears the dates, which is how a repeat booking for the next period is made.',
          'Impressions and clicks show per row and on the banner detail, with CTR derived — this is the number sales reports back to the advertiser.',
          'Editing the creative of a Live banner takes effect immediately and is written to the audit log; the advertiser is paying for whatever is showing.',
        ],
        rules: [
          'endAt must be after startAt; publishing with an endAt already in the past is refused.',
          'Slots are a fixed, defined set — an operator cannot invent one; adding a slot is a code + design change.',
          'SUPERSEDED: unlimited Live banners per slot. A slot renders `itemsShown` positions and rotates every Live booking through them; overlapping ranges are expected.',
          'A paid banner requires an advertiser and an ad product reference; a house banner requires neither.',
          'Only Draft banners can be deleted. Anything that has ever been Live is Ended, not deleted, so its performance history survives.',
          'Image dimensions must match the slot spec; a mismatched upload is rejected rather than silently scaled.',
          'altText is mandatory — the jobseeker site must stay usable when an image fails.',
        ],
        states: [
          'Loading',
          'Empty (no banners)',
          'Filtered-empty',
          'New form (empty)',
          'Editing Draft',
          'Editing Live (immediate-effect warning)',
          'Validation errors (dimensions / dates / link)',
          'Booking conflict (slot already taken)',
          'Upload in progress',
          'Ended (read-only, stats retained)',
        ],
        backend: {
          dataModel: [
            { name: 'bannerId', type: 'uuid', required: true },
            { name: 'name', type: 'string', required: true },
            { name: 'slot', type: 'enum', required: true, notes: 'home_hero|home_mid|sidebar|… — fixed set' },
            { name: 'imageDesktopUrl / imageMobileUrl', type: 'string / string?' },
            { name: 'altText', type: 'string', required: true },
            { name: 'destinationUrl / openInNewTab', type: 'string / bool' },
            { name: 'startAt / endAt', type: 'timestamp', required: true, notes: 'the source of the status' },
            { name: 'isPublished', type: 'bool', required: true, notes: 'false = Draft; combined with the dates it yields Scheduled / Live / Ended' },
            { name: 'status', type: 'derived enum', notes: 'draft|scheduled|live|ended — computed, NOT a writable column' },
            { name: 'priority', type: 'int' },
            { name: 'isPaid / advertiserId / adProductId / orderId', type: 'bool / uuid? / uuid? / uuid?', notes: 'the commercial link into Products & packages' },
            { name: 'impressions / clicks', type: 'counter', notes: 'aggregated; CTR is derived' },
            { name: 'createdBy / updatedBy / updatedAt', type: 'uuid / uuid / timestamp', notes: 'edits to a Live banner are audited' },
          ],
          endpoints: [
            'GET /admin/banners?slot=&status=&from=&to=&q=&page=',
            'POST /admin/banners — create (Draft)',
            'PUT /admin/banners/:id',
            'POST /admin/banners/:id/publish',
            'POST /admin/banners/:id/unpublish',
            'POST /admin/banners/:id/end-now',
            'GET /admin/banners/:id/stats?from=&to=',
            'GET /admin/banner-slots — the fixed slot list + required dimensions',
          ],
          integrations: [
            'Object storage / CDN (creative upload + delivery)',
            'Products & packages (ad products, orders)',
            'Analytics pipeline (impressions / clicks)',
            'Audit log (edits to Live banners)',
          ],
          notes:
            'Derive status on read from (isPublished, startAt, endAt) so it can never drift; a scheduled job is then only needed for cache invalidation and for telling sales that a paid booking has ended. Do not store a writable status column.',
        },
        acceptance: [
          'A banner published with a future start shows as Scheduled and does not render on the jobseeker site.',
          'It becomes Live at startAt and Ended after endAt with no operator action.',
          'Booking a slot that already has Live banners is ACCEPTED, and the form states the resulting share of voice before save.',
          'An image that does not match the slot dimensions is rejected at upload.',
          '"End now" removes a Live banner from the jobseeker site immediately.',
          'Impressions and clicks are attributed to the right banner and survive it ending.',
        ],
        openQuestions: [
          'Confirm the full slot list and exact pixel dimensions per slot (desktop + mobile) with design.',
          'Can a slot rotate several Live banners (share of voice), or is one-per-period final? `priority` only matters if rotation is allowed.',
          'Is ad inventory sold per week, and should the booking form show remaining availability per slot as a calendar?',
          'Do banners need targeting (city, job category, guest vs logged-in) in Phase-1, or is slot + schedule enough?',
          'Is an impression counted on render or only on viewport entry? The CTR we report to advertisers depends on it.',
        ],
      },
    },

    // 1 · Banner rendering ────────────────────────────────────────────────────
    {
      name: 'Display banner',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-home',
      detail: {
        description:
          'The jobseeker-site rendering of whatever HQ has booked. The pages reserve fixed areas — Home hero, Home mid (long), Sidebar (square) — as Admin-managed slots: the layout must hold its shape whether a banner is booked or not, and must never jump when one loads. Each render counts an impression and each tap a click, which is what HQ reports back to advertisers.',
        userStory:
          'As a jobseeker, I want promotional content to appear in place without breaking or shifting the page, so that browsing jobs stays fast and readable.',
        uiFields: [
          {
            group: 'Slot rendering',
            items: [
              { name: 'slot area', type: 'reserved layout box', required: true, notes: 'fixed aspect ratio per slot — reserved even when empty, so there is no layout shift' },
              { name: 'image', type: 'responsive img', required: true, notes: 'mobile creative below the breakpoint, desktop above; lazy-loaded below the fold' },
              { name: 'alt text', type: 'string', required: true, notes: 'from the banner record' },
              { name: 'link', type: 'anchor', notes: 'destination URL; external links open in a new tab with rel="noopener"' },
              { name: 'ad disclosure', type: 'label', notes: '"Quảng cáo" / "Ad" marker on paid placements — wording is an open question' },
            ],
          },
        ],
        behaviors: [
          'Only Live banners are served — Draft, Scheduled and Ended never reach the client at all.',
          'An empty slot collapses cleanly: with no banner the page must still look deliberate, not broken.',
          'One impression per banner per page view, not per re-render, so React re-renders cannot inflate an advertiser’s numbers.',
          'A tap counts a click and then navigates; the click must not be lost if tracking is slow — fire-and-forget, never blocking.',
          'Below-the-fold slots lazy-load their creative so a banner never delays first paint.',
          'The mobile creative is used below the breakpoint; with none uploaded, the desktop image is used within the slot ratio.',
        ],
        rules: [
          'Status is evaluated server-side. The client is never handed the schedule and asked to decide what is Live.',
          'A banner must never push page content around after load — the slot box is reserved from first paint.',
          'Banner failures degrade silently: a missing image or a failed tracking call must never break the page around it.',
          'Impressions and clicks are attributed to the banner id and stay queryable after it has Ended.',
          'Paid placements are visually distinguishable from editorial content (disclosure label), pending exact wording.',
        ],
        states: [
          'Slot empty (no Live banner)',
          'Loading (skeleton at the slot ratio)',
          'Loaded',
          'Image failed (alt text shown, layout intact)',
          'Mobile creative',
          'Desktop creative',
        ],
        backend: {
          endpoints: [
            'GET /banners?slots=home_hero,home_mid&page=home — returns only Live banners, resolved per slot',
            'POST /banners/:id/impression',
            'POST /banners/:id/click',
          ],
          integrations: ['CDN (creative delivery)', 'Analytics pipeline (impression / click events)'],
          notes:
            'Cache the Live resolution with a short TTL — it changes only at publish / schedule boundaries. Publish and "End now" must invalidate that cache, otherwise the emergency stop is not actually immediate. Impression and click events are best-effort and must never block rendering or navigation.',
        },
        acceptance: [
          'Only Live banners appear; a Scheduled banner is absent from the API response, not merely hidden with CSS.',
          'A slot with no banner leaves no gap and no shifted layout.',
          'Impressions match page views 1:1 for a Live banner, with no double counting.',
          'Clicking a banner navigates to its destination and records exactly one click.',
          '"End now" on Admin removes the banner from the site within the cache TTL.',
        ],
        openQuestions: [
          'Which pages carry which slots — Home only, or search results and job detail too?',
          'Is an ad disclosure label required, and in what wording (VI / EN)?',
          'Impression on render, or on viewport entry? Advertiser-facing CTR depends on the answer.',
          'Do banners need frequency control as well, or is that popups only?',
        ],
      },
    },

    // 2 · Popup admin ─────────────────────────────────────────────────────────
    {
      name: 'Create popup + Popup list',
      site: 'Admin',
      scope: ['BE', 'FE', 'UI'],
      // Same console page as the banner list — the two share one screen with a
      // Banners / Popups switcher, because both are Display placement products.
      mockup: 'admin-banners',
      detail: {
        description:
          'The HQ screen for popups. A popup shares the banner lifecycle but differs in the two things that make it intrusive: it targets an AUDIENCE rather than a page slot, and it must be frequency-capped so the same person is not interrupted repeatedly. Because only one popup ever shows, priority is a real field here rather than a nicety.',
        userStory:
          'As an HQ marketing operator, I want to show a targeted popup to one audience with a strict frequency cap, so that a campaign lands without annoying users into leaving.',
        uiFields: [
          {
            group: 'List',
            items: [
              { name: 'search', type: 'string', notes: 'popup name / campaign' },
              { name: 'audience', type: 'enum', notes: 'Guests · Logged-in jobseekers · Employers (company users)' },
              { name: 'status', type: 'enum', notes: 'Draft · Scheduled · Live · Always on · Ended — derived; filter only' },
              { name: 'row', type: 'composite', notes: 'thumbnail · name · audience · from–to (or "Always on") · priority · status · impressions / clicks / dismissals' },
              { name: 'row actions', type: 'buttons', notes: 'Edit · Duplicate · Unpublish · End now · Delete (Draft only)' },
            ],
          },
          {
            group: 'Content',
            items: [
              { name: 'name', type: 'string', required: true, notes: 'internal label' },
              { name: 'layout', type: 'enum', required: true, notes: 'image-only · image + text + CTA — keep the set small' },
              { name: 'image', type: 'file', notes: 'required for image layouts; fixed max dimensions' },
              { name: 'heading / body', type: 'i18n string / i18n rich text', notes: 'VI required, EN optional — same convention as Job management' },
              { name: 'ctaLabel / ctaUrl', type: 'i18n string / url', notes: 'the popup’s single action' },
              { name: 'dismissible', type: 'bool', required: true, notes: 'default on; a non-dismissible popup needs explicit sign-off' },
            ],
          },
          {
            group: 'Targeting & schedule',
            items: [
              { name: 'audience', type: 'enum', required: true, notes: 'Guests (not logged in) · Logged-in jobseekers · Employers (company users)' },
              { name: 'targetPages', type: 'enum[]', notes: 'where it may appear (e.g. Home only) — keeps a campaign out of the apply flow' },
              { name: 'startAt', type: 'datetime', required: true },
              { name: 'endAt', type: 'datetime', notes: 'empty = "Always on" — the popup-only status' },
              { name: 'priority', type: 'int', required: true, notes: 'picks the winner when several are eligible, because only one ever shows' },
            ],
          },
          {
            group: 'Frequency cap',
            items: [
              { name: 'frequency', type: 'enum', required: true, notes: 'Once per session · Once per day · Once per week · Once ever — the anti-annoyance control' },
              { name: 'showAfter', type: 'seconds / trigger', notes: 'delay or trigger: on load · after N seconds · at scroll depth · on exit intent' },
              { name: 'respectDismissal', type: 'bool', required: true, notes: 'a dismissal suppresses re-showing for the frequency window; default on' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Status options — the banner lifecycle plus "Always on"',
            items: [
              'Draft — not published; never shown. The only deletable status.',
              'Scheduled — published, startAt in the future.',
              'Live — now is inside startAt–endAt (and the popup is still eligible per audience + frequency).',
              'Always on — published with a startAt and NO endAt. Runs indefinitely; the list flags it distinctly so nobody assumes it stops on its own.',
              'Ended — endAt has passed; retained with its stats.',
              'As with banners, status is computed from (isPublished, startAt, endAt) — operators set dates and publish, never a status.',
            ],
          },
          {
            heading: 'Why one popup at a time — the eligibility contest',
            items: [
              'Several popups can be Live at once, but a user may only ever be shown one, so the server picks a single winner per page view.',
              'The contest runs in order: status is Live / Always on → audience matches this visitor → target page matches → the frequency cap is not yet spent for this user or device → highest priority wins → ties broken by the most recent startAt.',
              'That whole decision is server-side. If the client received several popups and chose locally, the cap and the priority would be suggestions rather than rules.',
            ],
          },
        ],
        behaviors: [
          'Choosing an audience filters the preview so the operator sees the popup as that visitor type would.',
          'Leaving endAt empty is deliberate and the form labels the result "Always on", so an unbounded campaign is never created by accident.',
          'A frequency cap is required before a popup can be published — there is no "unlimited" option.',
          'Priority is validated against the other Live popups for the same audience, warning when two share a value.',
          '"End now" stops a Live or Always-on popup immediately.',
          'Dismissals are reported alongside impressions and clicks: a high dismissal rate is the signal that a campaign is hurting rather than helping.',
          'Duplicate clears the dates, which is how a campaign is re-run.',
        ],
        rules: [
          'A frequency cap is mandatory on every published popup.',
          'A popup targets exactly one audience in Phase-1 — no multi-audience popups, so reporting stays comparable.',
          'endAt, when set, must be after startAt.',
          'At most one popup may be delivered per page view, and the choice is made server-side.',
          'Only Draft popups can be deleted; anything that has run becomes Ended and keeps its stats.',
          'Popups are excluded from transactional flows (apply, checkout) regardless of targeting — interrupting a conversion is not a marketing decision.',
          'A non-dismissible popup requires explicit sign-off; the default is dismissible.',
        ],
        states: [
          'Loading',
          'Empty (no popups)',
          'Filtered-empty',
          'New form',
          'Editing Draft',
          'Editing Live (immediate-effect warning)',
          'Always on (no end date)',
          'Priority clash warning',
          'Validation errors (missing cap / dates)',
          'Ended (read-only, stats retained)',
        ],
        backend: {
          dataModel: [
            { name: 'popupId', type: 'uuid', required: true },
            { name: 'name / layout', type: 'string / enum', required: true },
            { name: 'imageUrl / heading / body / ctaLabel / ctaUrl', type: 'string? / i18n jsonb / i18n jsonb / i18n jsonb / string?' },
            { name: 'audience', type: 'enum', required: true, notes: 'guest|jobseeker|employer' },
            { name: 'targetPages', type: 'text[]' },
            { name: 'startAt / endAt', type: 'timestamp / timestamp?', notes: 'endAt null = Always on' },
            { name: 'isPublished', type: 'bool', required: true },
            { name: 'status', type: 'derived enum', notes: 'draft|scheduled|live|always_on|ended — computed, not writable' },
            { name: 'priority', type: 'int', required: true },
            { name: 'frequency', type: 'enum', required: true, notes: 'session|day|week|ever' },
            { name: 'showAfterSeconds / trigger', type: 'int? / enum?' },
            { name: 'dismissible', type: 'bool', required: true },
            { name: 'impressions / clicks / dismissals', type: 'counter' },
            { name: 'PopupSeen', type: 'entity', notes: 'popupId, userId?, deviceId, seenAt, dismissedAt? — the cap ledger; keyed on deviceId so it works for guests' },
          ],
          endpoints: [
            'GET /admin/popups?audience=&status=&q=&page=',
            'POST /admin/popups',
            'PUT /admin/popups/:id',
            'POST /admin/popups/:id/publish · /unpublish · /end-now',
            'GET /admin/popups/:id/stats?from=&to=',
          ],
          integrations: ['Object storage / CDN', 'Analytics pipeline', 'Audit log (edits to Live popups)'],
          notes:
            'PopupSeen IS the frequency cap and must work for guests, so it is keyed on a device id with the user id attached once known. Keep the eligibility decision in one server-side resolver shared by every page.',
        },
        acceptance: [
          'A popup cannot be published without a frequency cap.',
          'A popup with no endAt is stored and displayed as Always on.',
          'When two popups are eligible, only the higher-priority one is delivered.',
          'A dismissed popup does not re-appear inside its frequency window, including for a guest on the same device.',
          '"End now" stops delivery immediately.',
          'Dismissals are counted separately from clicks.',
        ],
        openQuestions: [
          'Confirm the audience list — do we need "new users (first session)" or "returning" in Phase-1?',
          'Is a non-dismissible popup ever acceptable (e.g. a legal / T&C notice)?',
          'Should popups be excluded from more flows than apply — the whole My page area, for instance?',
          'Guest frequency caps rely on a device id / cookie: what happens under consent refusal or private browsing?',
          'Do employers (company site) get popups in Phase-1, or is the audience jobseeker-side only?',
        ],
      },
    },

    // 3 · Popup rendering ─────────────────────────────────────────────────────
    {
      name: 'Display popup',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-home',
      detail: {
        description:
          'The jobseeker-site delivery of at most one popup per page view. The client asks the server "is there a popup for me here?" and renders whatever single popup comes back — the audience match, the frequency cap and the priority contest are all decided server-side, so the cap cannot be defeated by clearing local state alone.',
        userStory:
          'As a jobseeker, I want to see a promotion at most once in a while and be able to dismiss it for good, so that the site never feels like it is nagging me.',
        uiFields: [
          {
            group: 'Popup shell',
            items: [
              { name: 'overlay', type: 'modal + scrim', required: true, notes: 'traps focus; the page behind it must not scroll' },
              { name: 'close affordance', type: 'button', required: true, notes: 'visible ×, plus Esc and a scrim click — never a hidden close' },
              { name: 'content', type: 'image / heading / body / CTA', notes: 'from the popup record, per its layout' },
              { name: 'CTA', type: 'anchor / button', notes: 'taking the CTA also counts as a dismissal — the popup has done its job' },
            ],
          },
        ],
        behaviors: [
          'On page load the client requests eligibility once, passing the page and a device id; the server returns zero or one popup.',
          'The popup appears per its trigger (immediately, after N seconds, at a scroll depth, or on exit intent) — never before the page is usable.',
          'Closing records a dismissal, and the frequency window starts from that moment.',
          'Taking the CTA records a click, closes the popup and navigates.',
          'The cap is remembered per user when signed in and per device when not, so a guest who dismisses does not see it again on the next page.',
          'Never more than one popup per page view, and never stacked on another modal — if a modal is already open the popup is skipped, not queued on top.',
          'Popups do not appear in the apply flow or other transactional screens.',
        ],
        rules: [
          'Eligibility (audience, page, cap, priority) is decided server-side; the client renders what it is given and does not filter.',
          'Focus is trapped while open and returns to the triggering element on close — the popup must be keyboard-escapable.',
          'A popup must never block the page permanently: if its content fails to load, it closes itself.',
          'A dismissal is recorded even when the user closes with Esc or the scrim, not only via the × button.',
          'A signed-in user’s cap follows the account across devices; a guest cap is device-scoped by necessity.',
        ],
        states: [
          'None eligible (nothing renders)',
          'Waiting for trigger',
          'Open',
          'Dismissed (suppressed for the window)',
          'CTA taken',
          'Content failed (self-closes)',
          'Suppressed (another modal open / transactional page)',
        ],
        backend: {
          endpoints: [
            'GET /popups/eligible?page=&deviceId= — returns 0 or 1 popup after audience + cap + priority resolution',
            'POST /popups/:id/impression',
            'POST /popups/:id/dismiss',
            'POST /popups/:id/click',
          ],
          notes:
            'One resolver decides the winner (status → audience → page → cap → priority → recency). Impression and dismissal both write to PopupSeen, which is what the next eligibility call reads. Tracking calls are best-effort, but the dismissal write matters: losing it re-shows the popup.',
        },
        acceptance: [
          'At most one popup is shown per page view.',
          'A dismissed popup does not re-appear within its frequency window — same device for a guest, any device for a signed-in user.',
          'Esc, the scrim and the × all close the popup and all record a dismissal.',
          'A popup targeted at Guests never appears for a signed-in jobseeker.',
          'No popup appears during the apply flow.',
          'The page behind the popup does not scroll and focus is trapped.',
        ],
        openQuestions: [
          'How long is a "session" for the once-per-session cap — tab lifetime, or a 30-minute window?',
          'Does exit intent make sense given the mobile traffic share, or should the trigger set be smaller in Phase-1?',
          'If a guest dismisses a popup and then signs in, do we merge the device cap into their account?',
          'Should a signed-in user be able to turn promotional popups off in their settings?',
        ],
      },
    },
  ],
}
