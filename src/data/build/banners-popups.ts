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
      warn: 'Phase-1 booking rule: a slot holds at most ONE Live banner per period. Overlapping date ranges in the same slot are a booking conflict and are blocked at save — an ad slot is sold to one advertiser at a time.',
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
          'The stock picture library, classified by industry, that a JOB borrows from when its product feeds a placement with image slots. It exists because the premium homepage grid is mostly pictures, and most of the companies filling it are SMEs with no photography and no designer: without a library the grid renders holes, and the placement they paid for looks cheap. HQ curates it; employers only ever pick from it or upload their own.',
        userStory:
          'As an HQ content operator, I want a library of licensed pictures classified by what they SHOW, so that every job on a picture placement has something good to display without anyone designing per posting.',
        sections: [
          {
            heading: 'Three sources for a placement picture — in this order',
            items: [
              '1 · The employer’s OWN upload on the job. Their real workplace beats stock every time, so it always wins.',
              '2 · A GALLERY pick. The picker opens on the topics that suit the job’s industry (see the map below) and can be widened to any topic. The normal path — thirty seconds and the card looks professional.',
              '3 · The AUTOMATIC DEFAULT, applied when nobody chose anything: the industry’s first mapped topic, least-used picture first. This is the rule that protects the homepage — a paid placement card can never render an empty frame.',
              'The company page’s own `photos` are NOT a fourth source. Those are workplace shots sized for the company profile and often unusable at a card ratio; wiring them in silently would put a blurry canteen photo on the homepage.',
            ],
          },
          {
            heading: 'What this is NOT',
            items: [
              'Not the company page photo set — that belongs to the company and is capped at 18, for the profile page only.',
              'Not banner creatives — a booked banner is a finished design supplied by the client (see Create banner). The gallery is raw pictures the SITE composes a card from, with the logo, title and badge drawn on top by the layout.',
              'Not a general media manager. Nothing outside placement pictures is stored here, because everything here carries a topic and a licence, and a dumping ground has neither.',
            ],
          },
          {
            heading: 'Upload — one batch, MANY topics per picture, and a per-image override',
            text: 'Upload is two steps: choose files, then classify them. Classification applies to the whole batch, because a batch is usually one shoot — but "usually" is not "always", and the override is what stops the exception being mis-tagged.',
            items: [
              'TOPICS IS MULTI-SELECT, always. `topics` is a `ref[]`, and the picker is a row of toggle chips, not a dropdown — a picture of two nurses in a lab is "y tế · chăm sóc" AND "nghiên cứu · phòng lab", and forcing one loses half its reach. The hint under the chips says so out loud, because a chip row can be mistaken for a radio group.',
              'THE BATCH SETS A DEFAULT, NOT A VERDICT. The chips apply to every accepted file in the upload; a collapsed "Đặt chủ đề riêng cho từng ảnh" panel lists the files and lets any one of them differ. A file nobody touches simply follows the batch, so the common case stays two clicks.',
              'WHY THE OVERRIDE EARNS ITS SPACE: a wrongly tagged picture is WORSE than an untagged one. An untagged picture is never chosen; a mis-tagged one becomes the AUTOMATIC DEFAULT on jobs it does not suit, and lands on the homepage without anyone deciding it should.',
              'The per-image control shows the current topics as removable chips plus a "＋ chủ đề" dropdown — the full 19-topic chip row repeated per file would be longer than the modal. A file left with no topics at all is flagged inline ("chưa có chủ đề") rather than silently accepted.',
              'The thin-topic ▲ marker (fewer than 3 pictures) shows on the batch chips, because that is where someone is deciding what to classify as — it is a nudge to fill a gap, not a warning.',
            ],
            warn: 'Role and licence stay BATCH-ONLY on purpose: a shoot shares its rights and a subject/background split is a per-picture judgement made later, in the detail screen. Adding per-image overrides for those two would turn a two-step upload into a form filled once per file, which is how bulk upload stops being used.',
          },
          {
            heading: 'Topic classifies the picture · industry reaches it through a map',
            items: [
              'A picture is classified by TOPIC because that is the only thing intrinsic to it. Industry is a fact about the employer, and tagging a photo of two people at a laptop as “IT / Software” is simply false — the same frame serves banking, marketing and a school office.',
              'Industry access is preserved by a small lookup, INDUSTRY → ordered topics: Logistics → kho vận · vận tải · ngoài trời · business scene; IT / Software → công nghệ · business scene · trừu tượng; Healthcare → y tế · nhóm người; Construction → công trường · toà nhà · engineer scene. Twelve industries × two to four topics is one screen of configuration.',
              'So “filter by industry” in the picker means “topics this industry prefers”, and the automatic default resolves industry → first topic → least-used Active picture. Nobody loses the industry entry point; the pictures simply stop carrying a claim they cannot support.',
              'This also survives the industry list changing. Industries are editable master data — add or rename one and only the map row changes, instead of re-tagging hundreds of pictures.',
              'The map is edited by HQ next to the gallery, and a topic with no pictures is flagged there rather than discovered on the homepage.',
            ],
          },
        ],
        uiFields: [
          {
            group: 'Image',
            items: [
              { name: 'title', type: 'i18n string', required: true, notes: 'what the picture shows ("kho hàng · xe nâng") — the searchable human label, not a filename' },
              { name: 'topics', type: 'ref[] → Master data · Image topic', required: true, notes: 'WHAT THE PICTURE SHOWS. The list was checked against the live saramin.co.kr platinum grid and four topics were missing from the first draft — sản phẩm · bao bì (branded packaging still-life), nghiên cứu · phòng lab, dữ liệu · biểu đồ (charts / holographic overlays), nhà xưởng · ngoại cảnh (plant seen from outside or from a drone, which is a different frame from a production line inside). This is the classification, because a photograph is a SCENE, not an industry: two people at a laptop is a business scene that suits IT, banking, marketing and school administration equally. Usually 1–2 topics, occasionally 3 — a row needing ten values is the sign the axis is wrong. MULTI-SELECT everywhere it is edited: chips on upload (batch, with a per-image override) and on the detail screen; never a single-value dropdown.' },
              { name: 'role', type: "enum('subject'|'background')", required: true, notes: 'a scene with people or objects in it, versus a texture / skyline / abstract that a card lays a logo and title over. The 2-slot hero wants one of each, and asking for “another photo” without this distinction gets you two subjects fighting each other.' },
              { name: 'tags', type: 'string[]', notes: 'free keywords for the search box — xe nâng · phòng họp · ngoài trời · nhóm người. Topics classify, tags find.' },
              { name: 'masterFile', type: 'file (image)', required: true, notes: 'ONE master, ≥1600×1200 (4:3). Every placement ratio is cropped from it at render — 900×1200 for a 3:4 hero, 1600×1067 for a 3:2 card. Never store per-placement crops: the registry still has to gain mobile variants, and pre-cropping means re-cutting the whole library by hand each time a size appears.' },
              { name: 'focalPoint', type: '{ x, y }', required: true, notes: 'the point every crop keeps in frame. Defaults to centre; the editor drags it onto the subject.' },
              { name: 'orientation / dominantColor', type: 'derived', notes: 'orientation drives which slots it can fill; the colour is the loading placeholder and the contrast check against the white logo lockup' },
            ],
          },
          {
            group: 'Rights & lifecycle',
            items: [
              { name: 'source', type: 'string', required: true, notes: 'where it came from — stock provider + asset id, a photographer, or an internal shoot' },
              { name: 'licence', type: 'enum + note', required: true, notes: 'what we are allowed to do with it. A picture with no recorded licence cannot be activated.' },
              { name: 'licenceExpiresAt', type: 'date?', notes: 'stock licences lapse. This is the field that lets one query find everything to pull when a subscription ends — the thing that bites eighteen months later.' },
              { name: 'status', type: "enum('Active'|'Archived')", required: true, notes: 'Archived disappears from the picker but keeps resolving for jobs already using it' },
              { name: 'usageCount / lastUsedAt', type: 'derived', notes: 'shown in the picker ("đang được 12 tin dùng") so employers self-select away from the over-used ones' },
            ],
          },
        ],
        behaviors: [
          'UPLOAD IS TWO STEPS, batched: drop the files, then classify the whole batch at once. A stock pack arrives forty pictures at a time and nobody classifies forty pictures one modal at a time.',
          'Step 1 validates each file and shows the outcome per row — accepted, or REJECTED for being under 1600×1200. A too-small picture is refused at the door, never upscaled: it has to survive both a 3:4 and a 3:2 crop, and upscaling only moves the problem to the homepage. The title is editable here, because that string is what the search box matches — not the filename.',
          'TOPIC IS SET PER PICTURE, ON THE ROW, in step 1 — a multi-select beside each file. A drop is rarely one subject (a warehouse shot, a meeting, an engineer and a clinic corridor arrive in the same batch), and a picture tagged with the wrong topic is worse than an untagged one: it becomes the automatic default on jobs it does not suit. Topics already under the 3-picture floor are marked ▲ in the list.',
          'Step 2 carries what genuinely IS batch-level — role · source · licence — plus a one-click bulk topic shortcut that writes into every row (for the stock pack that really is all one scene) and a read-back of what the rows now hold. The topic is edited in ONE place; step 2 only reports it, because the same field edited on two screens is the fastest way to end up with two answers.',
          'Save is blocked until EVERY accepted picture has at least one topic, and until source and licence are set. An untagged picture can never be found in the picker and can never be an industry’s default, so it would enter the library already invisible. Choosing a subscription licence reveals the expiry date field.',
          'Bulk edit works the same way from the grid — multi-select, then apply topics and tags to the selection.',
          'The editor shows the picture cropped to every live placement ratio side by side, with the safe areas drawn on, so the focal point is set against real cards rather than a guess.',
          'Filter by industry · tag · orientation · status, and a keyword search across title and tags.',
          'A COVERAGE panel lists topics with fewer than 3 Active pictures, and any industry whose mapped topics are all thin — those are the cards about to fall back onto the same photograph.',
          'Archiving a picture that live jobs still use warns with the count and offers to move those jobs to the automatic default for their industry.',
        ],
        rules: [
          'HQ uploads to the gallery; employers never do. An employer’s upload stays on their job and is never promoted into the shared library — we do not hold the right to redistribute their photo to another company.',
          'Every topic that an industry maps to needs at least 3 Active pictures. Below that the automatic default repeats across the grid, which looks worse than no placement at all.',
          'A picture is never deleted, only archived — live jobs and past renders point at it.',
          'Licence and source are mandatory before Activate. An unlicensed picture on a paid placement is the client’s legal exposure, not ours to gamble with.',
          'The gallery is the same picture set for every company. It carries no company branding, no text baked into the image, and no logos — the card draws those itself.',
        ],
        states: [
          'Empty library (first run — the picker tells the employer to upload their own)',
          'Industry below the 3-picture floor (flagged in the coverage panel)',
          'Upload · step 1: no files yet · files validating · batch with some rows rejected (under 1600×1200) · every row rejected',
          'Upload · step 2: nothing classified yet (save disabled) · classified but unlicensed (save still disabled) · ready',
          'Active · Archived · Licence expiring within 30 days',
          'In use by N live jobs (blocks silent archiving)',
        ],
        backend: {
          dataModel: [
            { name: 'galleryImageId', type: 'uuid', required: true },
            { name: 'title', type: 'i18n jsonb', required: true },
            { name: 'topicIds', type: 'uuid[]', required: true, notes: 'FK → master data image-topic; indexed — this is the classification' },
            { name: 'role', type: "enum('subject'|'background')", required: true },
            { name: 'IndustryTopicMap', type: 'entity', required: true, notes: '(industryId, topicId, rank) — the lookup that keeps the industry entry point without putting an industry claim on a photograph. Ranked, because the first row is what the automatic default resolves to.' },
            { name: 'tags', type: 'text[]' },
            { name: 'masterUrl / width / height', type: 'string / int / int', required: true, notes: 'min 1600×1200 enforced on upload' },
            { name: 'focalX / focalY', type: 'numeric', required: true, notes: '0–1 relative, so it survives any re-encode' },
            { name: 'dominantColor', type: 'string' },
            { name: 'source / licence / licenceExpiresAt', type: 'string / enum / date?', required: true },
            { name: 'status', type: "enum('active'|'archived')", required: true },
            { name: 'usageCount', type: 'derived', notes: 'never stored — counted from live jobs referencing it' },
          ],
          endpoints: [
            'GET /admin/gallery?industry=&tag=&status=&q=',
            'POST /admin/gallery (bulk) · PATCH /admin/gallery/:id · POST /admin/gallery/:id/archive',
            'GET /gallery/pick?topic=&industry=&role=&aspect=&q= — the employer-facing picker; Active only, least-used first. `industry` resolves through the map to its topics.',
            'GET /gallery/default?industry=&role=&aspect= — the fallback resolver used at render (industry → first mapped topic → least-used)',
            'GET · PUT /admin/gallery/industry-topics — the map',
          ],
          integrations: [
            'Master data (image-topic enum — the classification; industry enum — the map’s other half)',
            'Placements registry (image slots: how many pictures and at what aspect)',
            'Job management (the job form’s picture step; jobs hold the reference)',
            'Object storage / CDN (master file + derived crops, cached per aspect)',
          ],
          notes:
            'Crops are derived and cached per (image, aspect, size) — the master is never served to the site. Least-used-first ordering in the picker is what spreads the library out instead of letting the first three pictures cover the whole homepage.',
        },
        acceptance: [
          'A job on a 2-slot placement is asked for exactly 2 pictures; on a 1-slot placement, 1; on a tier with no picture placement, none.',
          'The picker opens on the topics mapped to the job’s industry, and the filter can be switched to any topic or cleared.',
          'A job published with no picture still renders a complete card, using its industry default.',
          'Archiving a picture in use warns with the job count and never leaves a card blank.',
          'The coverage panel names every topic under 3 Active pictures, and every industry whose mapped topics are all under it.',
        ],
        openQuestions: [
          'Who licenses the seed set, and at what volume? Three pictures per TOPIC is the floor — roughly a dozen topics, so ~40 pictures, and it does not grow when the industry list does.',
          'Do we want AI auto-tagging on upload (topic + keyword suggestions), or is manual classification acceptable for a library this size?',
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
          'The HQ screen for booking and managing every banner on the jobseeker site: a list with derived status, plus a create / edit form. A banner is an image (per breakpoint), a destination link, a named slot and a date range. Because paid ad slots are sold as products, this is also where a booking is tied back to the ad product the advertiser bought — and where a double-booking of the same slot is caught.',
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
          'A slot with an already-booked overlapping date range is rejected at save, naming the conflicting banner — this is the double-booking guard.',
          '"End now" stops a Live banner immediately (endAt = now) and is the emergency stop for a wrong or complained-about creative.',
          'Duplicate copies the content and slot but clears the dates, which is how a repeat booking for the next period is made.',
          'Impressions and clicks show per row and on the banner detail, with CTR derived — this is the number sales reports back to the advertiser.',
          'Editing the creative of a Live banner takes effect immediately and is written to the audit log; the advertiser is paying for whatever is showing.',
        ],
        rules: [
          'endAt must be after startAt; publishing with an endAt already in the past is refused.',
          'Slots are a fixed, defined set — an operator cannot invent one; adding a slot is a code + design change.',
          'One Live banner per slot per period in Phase-1: overlapping ranges in the same slot are blocked.',
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
          'Booking a slot that already has an overlapping banner is refused, naming the conflict.',
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
