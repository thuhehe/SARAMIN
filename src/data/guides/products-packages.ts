import type { ModuleGuide } from './types'

/*
 * Products & Packages — user guide.
 *
 * Written against the admin console on saramin-vn-admin `dev`, using the QA
 * screenshot set in docs/qa/screenshots and the tester guide in
 * docs/qa/tester-guide-en/02-product-packages.md. Where the two screens without
 * a screenshot are concerned (Discount programmes, CV search usage) the steps
 * come from the screen's own strings (src/i18n/messages/en/*.json) and the
 * module notes in docs/features/.
 */

const IMG = '/guide/products-packages'

export const productsPackagesGuide: ModuleGuide = {
  moduleId: 'products-packages',
  intro:
    'For the people who set up what Saramin sells: product owners, sales admin and ops. This module is the catalogue — every quotation line has to point at something defined here. Everything below happens in the admin console; the employer and jobseeker sites only show the result.',
  before: [
    'The first time, work in this order: **Placements** (the display areas) → **Products** (which point at those areas) → **Packages** (which group products). Each step only offers what the previous one defined.',
    'What you see depends on your permissions. Products, Packages, Placements, Discount programmes and CV search usage each need their own right — a page missing from your menu is a permission, not a bug.',
    'Nothing here gives a customer anything by itself. A customer receives a product only when its VAT invoice is issued in CRM — this module just defines what that invoice will deliver.',
  ],
  tasks: [
    {
      id: 'find-the-module',
      title: 'Find the module',
      where: 'Left menu → Products & Packages',
      steps: [
        'Sign in to the admin console.',
        'In the left menu, scroll to the **Products & Packages** group. It holds five pages: **Products**, **Packages**, **Placements**, **CV search usage** and **Discount programmes**.',
        'The breadcrumb at the top of every page tells you where you are.',
      ],
      shots: [{ src: `${IMG}/menu.jpg`, caption: 'The Products & Packages group in the left menu, below User.' }],
    },
    {
      id: 'browse-the-catalogue',
      title: 'Browse the catalogue',
      where: 'Products & Packages → Products',
      outcome: 'Find any sellable item and see at a glance what it delivers.',
      steps: [
        'Search by code or name, or narrow the list with the **type**, **role** and **status** filters.',
        'Read the row: **Type** is what the invoice will deliver, **Role** is Main or Add-on, **Fulfilment** shows the display days of a posting, **Status** says whether it can be quoted.',
        'Click a product **name** to open its details. The **⋮** menu at the end of the row has Edit, Duplicate and Activate / Deactivate.',
      ],
      shots: [{ src: `${IMG}/products-list.jpg`, caption: 'The catalogue. Only Active rows can be put on a quotation.' }],
      tips: [
        '**Deactivate** hides a product from new quotations; orders already placed keep working.',
        'A product that is part of a package cannot be deleted — deactivate it instead.',
        '**Duplicate** makes a Draft copy with an empty Product ID, so you fill in the code before saving.',
      ],
      spec: 'products-management',
    },
    {
      id: 'create-a-product',
      title: 'Create a product',
      where: 'Products → New product',
      outcome: 'A new item sales can quote.',
      steps: [
        'Pick the **Type** first — Job posting, CV search, Placement booking or Manual service. It decides what the customer receives when the invoice is issued, and which fields appear below.',
        'Type the **Name** in Vietnamese. The **Product ID** fills in by itself; change it only if you need a specific code.',
        'Choose the **Selling unit** and the **Role**: Main is sold on its own, Add-on is sold on top of a main posting.',
        'Set **Status**. Active can be quoted; Inactive is hidden from quotations.',
        'Write the **Product description** — Vietnamese is required, English is optional. This is what prints on the quotation.',
        'Fill the **Fulfilment** section for that type. For a Job posting that is the activation window, the **Display duration** and the auto-refresh rhythm. Then **Save**.',
      ],
      shots: [
        { src: `${IMG}/product-new-type.jpg`, caption: 'Step 1 — the four types. The line under each one says what it grants.' },
        { src: `${IMG}/product-new-fulfilment.jpg`, caption: 'Step 6 — Fulfilment for a Job posting. The three clocks are explained on the form itself.' },
      ],
      tips: [
        'The **Product ID** is locked after the first sale. Check it before the product is quoted.',
        'A wrong **Type** delivers the wrong thing to the customer — it is the one field to double-check before Save.',
        'An Active product needs a complete fulfilment. If Save is refused, a fulfilment field is missing.',
      ],
      spec: 'products-management',
    },
    {
      id: 'set-where-a-tier-appears',
      title: 'Set where a job-posting tier appears',
      where: 'Products → open the product → Edit → Placement slots',
      outcome: 'Every job posted under this tier shows up in the chosen areas by itself.',
      steps: [
        'Open the product and click **Edit**.',
        'Under **Placement slots**, click **Add placement** and pick an area — for example *Trang chủ — Công việc Hot hôm nay · Home*.',
        'Pick the coverage: **Whole display window** or **First 10 days**.',
        'Repeat for every area this tier should appear in, then **Save**.',
      ],
      shots: [
        { src: `${IMG}/product-placement-slots.jpg`, caption: 'The Super hot job plus tier appears in four areas: three on Home and Top jobs on Search.' },
      ],
      tips: [
        'The areas come from the **Placements** page. If the one you need is not offered, it has to exist there first.',
        '**Includes**, just below, is a different thing: products granted together with this one, which the customer sees as a single line.',
        'After changing the slots, open a job under this tier on the jobseeker site and check where it appears.',
      ],
      spec: 'products-management',
    },
    {
      id: 'create-a-package',
      title: 'Create a package',
      where: 'Packages → New bundle',
      outcome: 'Several products sold as one line, at one price.',
      steps: [
        'Enter the **Name** (internal) and the **Display name** (what customers see on the quotation).',
        'Click **Add component** and pick a product and a quantity. A package needs **at least two** components.',
        'Check the **Price (VND)**. It is prefilled with the components total; type the price the package actually sells for. **Sum of parts** and **Implied discount** update underneath.',
        '**Save**. The package is ready to be quoted.',
      ],
      shots: [
        { src: `${IMG}/packages-list.jpg`, caption: 'The Packages list — components and the package price side by side.' },
        { src: `${IMG}/package-new.jpg`, caption: 'New bundle: components on top, pricing underneath.' },
      ],
      tips: [
        'Use a package when the customer should see one combined item with its own name and price. When a product should simply come with extras, use **Includes** on that product instead.',
        'Approve / Reject in the row menu only concern older one-off packages. A package created here needs no approval.',
      ],
      spec: 'packages-management',
    },
    {
      id: 'configure-a-display-area',
      title: 'Configure a display area',
      where: 'Products & Packages → Placements → pencil icon',
      outcome: 'The area shows the right number of items, at the right size, in the right rhythm.',
      steps: [
        'Find the area. Filter by **Page** (Home, Search, Job detail, Company page), **Format** or **Fill route**.',
        'Click the **pencil** at the end of the row. Page, Name, Key and Fill route are fixed and shown at the top for reference.',
        'For a content pool (fed by posting tiers): set **Items shown**, **Pool cap**, **Rotation period** and **Size (px)**. The **Preview** on the right restates the setting in one sentence — read it before saving.',
        'For a banner or popup (booked by customers): set **Creative width / height** (both or neither), **Concurrent bookings** and **Rotation period**.',
        'Set **Status** and **Save**. Inactive means the area shows nothing at all, even when there are qualifying jobs.',
      ],
      shots: [
        { src: `${IMG}/placements-list.jpg`, caption: 'The registry — one row per display area on the jobseeker site.' },
        { src: `${IMG}/placement-edit.jpg`, caption: 'Editing a content pool. The Preview sentence is the check.' },
      ],
      tips: [
        'There is no create and no delete: the areas ship with the system.',
        'Which tiers land in an area is set on each **Product** (previous task), not here.',
        'An empty **Rotation period** means the order never reshuffles.',
      ],
      spec: 'placements-registry',
    },
    {
      id: 'check-a-discount-programme',
      title: 'Check a discount programme',
      where: 'Products & Packages → Discount programmes',
      outcome: 'You know which discount the quotation builder will apply to a customer, and can adjust its rates and dates.',
      steps: [
        'Open the list. Each programme shows who it **applies to** (New, Existing, Churn), the **discount**, its **condition**, whether it **stacks** with others, and its **validity**.',
        'Click a programme to see its tiers — from this quantity, this rate — or its flat rate, and how it computes.',
        '**Edit** to change the rates, the quantity limit and the effective window. Who it applies to and how it computes are fixed on the screen: changing them is a product decision, not a setting.',
        'Save. The quotation builder applies the new rates by itself — there is no code for a rep to type.',
      ],
      shots: [
        {
          caption: 'Discount programmes list and detail.',
          pending: 'Not in the QA screenshot set yet. The screen exists in the build — capture it on the next pass.',
        },
      ],
      tips: [
        'No create and no delete: the programmes come from the client’s promo sheet, and a programme ends by its dates.',
        'If two active programmes cover the same customer status, the page warns you — archive or re-date one of them.',
      ],
      spec: 'discount-programmes',
    },
    {
      id: 'see-who-uses-cv-search',
      title: 'See who is actually using their CV search package',
      where: 'Products & Packages → CV search usage',
      outcome: 'A call list: packages that were bought and are not being used.',
      steps: [
        'Read the four cards on top: **Searches · 30 days**, **CV unlocks used**, **CV unlocks left** and **Bought but idle**.',
        'Switch the scope to **Not used** to list the idle packages. Each row shows the customer, the **sales owner**, what is **left** and **valid until**.',
        'Search by package or product code to find one customer’s package.',
        'Only when a customer must lose the package (a refund, for example): open **Withdraw this package** on the row, write the reason the customer will be told, and confirm. Unused unlocks are removed at once; CVs already opened stay open.',
      ],
      shots: [
        {
          caption: 'CV search usage — cards, scope and the package list.',
          pending: 'Not in the QA screenshot set yet. The screen exists in the build — capture it on the next pass.',
        },
      ],
      tips: [
        'Searches are free and unlimited. Only CV **unlocks** count against the quota.',
        'Withdrawing moves no money — a refund is recorded on the invoice, not here.',
      ],
      spec: 'cv-search-usage',
    },
  ],
  builtFrom: [
    { repo: 'saramin-vn-admin', branch: 'dev', commit: '07e4b68', date: '2026-09-08', note: 'screens and behaviour' },
    { repo: 'saramin-vn-admin', branch: 'dev', commit: 'deed9d0', date: '2026-09-08', note: 'docs/qa/screenshots — the pictures on this page' },
  ],
}
