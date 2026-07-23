import type { FeatureSpec } from '../types'

const SURFACE = 'Cross-cutting'

/**
 * Part C — themes that cut across both apps and are the decisions most likely
 * to block development. Worth resolving with leadership first.
 */
export const CROSSCUTTING_SPECS: FeatureSpec[] = [
  {
    id: 'xc-payments',
    surface: SURFACE,
    title: 'Payments & monetisation',
    status: 'not-started',
    summary: 'No payment gateway is wired anywhere — the single biggest unknown.',
    description:
      'The store site has NO payment integration wired. This blocks the entire employer billing surface (8 paid products) and the credits economy.',
    sections: [
      {
        heading: 'VN payment landscape (standard)',
        items: [
          'E-wallet + QR dominate: MoMo, VNPay, ZaloPay lead by volume.',
          'VNPay as a single gateway covers domestic + international cards, QR, and many wallets — usually the quickest one integration.',
          'Bank transfer / VietQR is common for B2B; corporate invoice (NET terms) for enterprise deals.',
          'VAT (8–10%) + e-invoice (hóa đơn điện tử) are mandatory — issue on payment via a licensed provider (MISA / Viettel / VNPT).',
          'Hybrid model is standard: self-serve checkout for standard products, quote/sales-assisted for large deals.',
        ],
      },
    ],
    unknown: [
      'Credits vs cash — is the B2B economy credit-based (prepaid wallet, KR/Saramin style), cash-based, or both?',
      'Which VN methods at launch (VNPay / MoMo / ZaloPay / bank transfer / corporate invoice)?',
      'Self-serve vs sales-assisted vs hybrid.',
      'VAT e-invoice provider + whether a Merchant-of-Record is used to offload tax/reconciliation.',
    ],
    clientQuestions: [
      'Decide the monetisation model (credits vs cash) and the VN payment method set before wiring billing.',
      'Recommended first step: VNPay (covers cards + QR + wallets) + VAT e-invoice; add MoMo/ZaloPay direct later.',
    ],
    externalSystems: ['VNPay', 'MoMo', 'ZaloPay', 'VietQR / bank', 'VAT e-invoice'],
    related: ['bill-catalog', 'emp-credits', 'admin-orders', 'admin-invoices'],
  },
  {
    id: 'xc-backend-readiness',
    surface: SURFACE,
    title: 'Backend readiness',
    status: 'not-started',
    summary: 'The store site is mostly mock; only ~8 features are live-wired. Whole admin modules have no real backend.',
    description:
      '"UI exists" is not "done". The admin has whole modules (sales PO/payments/contracts, notifications, CMS) with no real backend. Use the status label as the effort signal.',
    unknown: ['Which mock / seam modules get a real backend, and in what order.'],
    related: ['admin-purchase-orders', 'admin-notif-templates', 'admin-pages'],
  },
  {
    id: 'xc-multi-platform',
    surface: SURFACE,
    title: 'Multi-platform job distribution',
    status: 'built-mock',
    summary: 'Saramin / Komate / Worknet / Senior — confirm which are real integrations.',
    description: 'Likely the largest single integration effort if in scope.',
    unknown: ['Which target platforms are real contracted integrations vs UI placeholders.'],
    externalSystems: ['Saramin', 'Komate', 'Worknet', 'Senior'],
    related: ['emp-multi-platform'],
  },
  {
    id: 'xc-notifications',
    surface: SURFACE,
    title: 'Notifications delivery',
    status: 'prototype',
    summary: 'Channels + provider undecided; blocks both the candidate bell and the admin module.',
    unknown: ['Which channels (email / SMS / Zalo / in-app push) and which provider.'],
    clientQuestions: ['Confirm notification channels and provider.'],
    related: ['js-notifications', 'admin-notif-templates'],
  },
  {
    id: 'xc-ugc',
    surface: SURFACE,
    title: 'User-generated content',
    status: 'built-mock',
    summary: 'Company reviews / interviews — moderation, legal, and abuse handling if in scope.',
    unknown: ['Whether UGC is in scope, and the moderation flow.'],
    clientQuestions: ['Is UGC (reviews / interviews) in scope, and who moderates it?'],
    related: ['js-companies'],
  },
  {
    id: 'xc-data-sourcing',
    surface: SURFACE,
    title: 'Data sourcing',
    status: 'built-mock',
    summary: 'Salary data, company data, rankings: origin, licensing, refresh cadence, accuracy disclaimers.',
    unknown: ['Origin, licensing and refresh cadence of salary / ranking data.'],
    related: ['js-salary', 'js-lists'],
  },
  {
    id: 'xc-localization',
    surface: SURFACE,
    title: 'Localisation scope',
    status: 'built-mock',
    summary:
      'Three sites: Admin, Jobseeker (JS), Company (CO). Vietnamese is the default everywhere. JS = vi/en, CO = vi/en/ko, Admin = vi/en. Empty English falls back to Vietnamese.',
    known: [
      'Three sites: Admin, Jobseeker (JS), Company (CO).',
      'Default language: Vietnamese (all sites).',
      'Jobseeker (JS): vi + en · Company (CO): vi + en + ko · Admin: vi + en.',
      'Admin must always input Vietnamese; English optional, falls back to vi when empty.',
      'Multilingual data fields (job title, job description, …) are stored per-language.',
    ],
    unknown: ['Full list of multilingual fields; Korean fallback behaviour on the employer site.'],
    related: ['shared-i18n'],
  },
]
