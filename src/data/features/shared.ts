import type { FeatureSpec } from '../types'

const SURFACE = 'Store Site · Shared / content'

/** A3 — Shared / content / marketing pages. Bilingual (vi default, en). */
export const SHARED_SPECS: FeatureSpec[] = [
  {
    id: 'shared-top-brand',
    code: 'SH-BRAND-01',
    surface: SURFACE,
    title: 'Top Brand Award',
    status: 'built-mock',
    summary: 'Standalone landing / campaign page (hero, awards, who-is, navigation menu).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Standalone marketing landing with its own hero, awards list, “who is” block and its own nav menu — sits outside the main app shell.',
          'Content is largely static/editorial. Decide if it is hard-coded or CMS-driven (Admin → Pages).',
        ],
      },
    ],
    whatToBuild: [
      'Decide hard-coded vs CMS-driven page',
      'Design: finalise hero + award content (client-supplied copy/assets)',
      'FE: responsive campaign page + i18n',
    ],
    related: ['shared-service-guide', 'admin-pages'],
  },
  {
    id: 'shared-service-guide',
    code: 'SH-GUIDE-01',
    surface: SURFACE,
    title: 'Service guide',
    status: 'built-mock',
    summary: 'Service guide including a point / coupon guide page.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Informational guide pages (how the service works + a point/coupon guide). Static content, low risk.',
          'The point/coupon guide only matters if points/coupons are in launch scope — confirm with the monetisation model.',
        ],
      },
    ],
    whatToBuild: [
      'Confirm whether points/coupons are in scope at launch',
      'Design + copy for the guide pages (client-supplied)',
      'FE: content pages + i18n',
    ],
    related: ['shared-help-legal'],
  },
  {
    id: 'shared-help-legal',
    code: 'SH-LEGAL-01',
    surface: SURFACE,
    title: 'Help / legal',
    status: 'built-mock',
    summary:
      'Help word page, privacy policy, terms of service (with a separate company / employer terms).',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'Help + legal pages: help/FAQ, privacy policy, terms of service, plus a separate company/employer terms.',
          'Legal copy must be client/legal-supplied and localised (vi mandatory). Best managed as CMS pages so legal can update without a deploy.',
        ],
      },
      {
        heading: 'Consent linkage',
        items: [
          'The sign-up Terms & Privacy consent (Authentication) links here — the accepted version should be recorded against the account.',
        ],
      },
    ],
    whatToBuild: [
      'Obtain final VN privacy + terms + employer-terms copy (client / legal)',
      'Decide CMS-driven vs static; support versioning for consent records',
      'FE: legal pages + i18n; link from sign-up consent',
    ],
    unknown: ['Final legal copy for VN (privacy, terms, employer terms) needs client / legal sign-off.'],
    clientQuestions: ['Who supplies the final VN privacy policy and terms copy?'],
    related: ['js-auth', 'admin-pages'],
  },
  {
    id: 'shared-i18n',
    code: 'SH-I18N-01',
    surface: SURFACE,
    title: 'i18n & multilingual content',
    status: 'built-mock',
    summary:
      'Vietnamese is the default on the two public sites; the Admin console is English-only. Languages differ by audience; empty English falls back to Vietnamese. Locale from cookie → browser → the site default. No language in the URL.',
    description:
      'Framework-wide. Two concerns: (1) UI locale — which display languages each audience gets; ' +
      '(2) multilingual content — specific data fields (job title, job description, …) are stored per-language.',
    known: [
      'Three sites: Admin, Jobseeker (JS), Company (CO).',
      'Vietnamese (vi) is the default language on the two public sites (JS, CO). The Admin console has no Vietnamese UI at all.',
      'Jobseeker (JS): Vietnamese + English.',
      'Company (CO): Vietnamese + English + Korean.',
      'Admin: English only.',
    ],
    rules: [
      'UI language and content language are separate concerns. The Admin console is English-only as an INTERFACE; that says nothing about the languages of the data edited through it.',
      'Vietnamese is mandatory for content: whoever edits in Admin must always input the Vietnamese value for any multilingual field, because the public sites display Vietnamese by default.',
      'English (and other non-default languages) are optional inputs.',
      'Fallback: when the English value is empty, display the Vietnamese value instead.',
      'Fallback applies per-field, not per-record — a record can mix present and fallen-back languages.',
    ],
    sections: [
      {
        heading: 'Multilingual fields (stored per-language)',
        items: [
          'Job title',
          'Job description',
          '(more to be added — list grows as features are specced)',
        ],
      },
    ],
    bbNotes: [
      {
        heading: 'UI locale',
        items: [
          'Per-audience display languages: JS = vi/en, CO = vi/en/ko, Admin = en. Locale resolved cookie → browser → the site default (vi on JS/CO, en on Admin). No locale segment in the URL.',
          'Admin ships a single catalogue, so it needs no locale switcher in the chrome — one less control in the busiest bar on the site.',
          'Standard i18n message catalogues per site; missing UI strings fall back to the site default locale.',
        ],
      },
      {
        heading: 'Multilingual data (the harder part)',
        items: [
          'Certain data fields (job title, job description, …) are stored per-language on the record, not just in UI catalogues.',
          'Admin edit forms need a per-language input (vi mandatory, others optional). Store/Company render the requested language, falling back per-field to vi when empty.',
          'Applies per-field, not per-record — a record can mix present and fallen-back languages.',
        ],
      },
    ],
    whatToBuild: [
      'Finalise the complete list of multilingual data fields',
      'BE: per-language column/JSON on multilingual entities + fallback resolver',
      'Admin FE: per-language input tabs (vi required, others optional)',
      'Confirm Korean fallback chain (ko → vi?) for the Company site',
    ],
    unknown: [
      'Complete list of which fields are multilingual (beyond job title / job description).',
      'Does the Korean fallback follow the same chain (ko → vi) as English?',
    ],
    related: ['admin-environment', 'xc-localization'],
  },
  {
    id: 'shared-layout',
    code: 'SH-SHELL-01',
    surface: SURFACE,
    title: 'Header / footer / layout',
    status: 'built-mock',
    summary: 'Global shell, navigation, feedback, modals, toolbars.',
    bbNotes: [
      {
        heading: 'Approach',
        items: [
          'The global app shell: header (nav, search entry, notification bell, account menu), footer, feedback widget, shared modals + toolbars.',
          'Header content is role-aware (logged-out vs candidate vs employer). Notification bell wires into the Notifications feature.',
        ],
      },
    ],
    whatToBuild: [
      'Finalise header nav per audience (logged-out / candidate / employer)',
      'FE: responsive shell + shared modal/toast system + i18n',
      'Wire header bell + account menu to real data',
    ],
    related: ['js-home', 'js-notifications', 'js-auth'],
  },
]
