import type { BuildModule } from './types'

/*
 * Tools — two jobseeker utilities MIGRATED from the current web, not redesigned.
 *
 * The defining constraint of this module: the calculation logic already exists
 * and must be preserved. Both tools are therefore build tasks with a discovery
 * step in front of them — extract the current rules, pin them as test cases,
 * then re-implement against those cases:
 *
 *   1. Extract   — read the existing implementation, capture every rule + rate
 *   2. Pin       — turn known input → output pairs into a fixture set
 *   3. Port      — re-implement so every fixture matches to the đồng / to the
 *                  exact result label
 *   4. Verify    — same inputs, same outputs as the live site, side by side
 *
 * Anything the current tool does that we cannot explain is a question for the
 * client, NOT a place to invent better behaviour. A salary figure or a
 * personality result that differs from the old site is a bug, even if the new
 * answer is arguably more correct.
 *
 * Both tools are public (no sign-in) and are traffic/SEO surfaces as much as
 * utilities — which is why they carry a route into the job search.
 */

export const tools: BuildModule = {
  id: 'tools',
  title: 'Tools',
  owner: 'Luong',
  requirements: [
    {
      label: 'Two tools, migrated from the current web',
      table: {
        cols: ['Tool', 'Audience', 'Rule'],
        rows: [
          ['Personality testing', 'Jobseekers, public', 'Keep the existing question bank + scoring'],
          ['Gross ↔ Net salary calculator', 'Jobseekers, public', 'Keep the existing calculation logic'],
        ],
      },
      warn: 'These are MIGRATIONS, not redesigns. The ported logic must reproduce the current site’s output for the same input — a discovery step extracts the existing rules and rates into a fixture set before anything is rewritten.',
    },
    {
      label: 'Rates and question banks are DATA, not code',
      text: 'Insurance rates, tax brackets, the regional minimum wage and the personality question set live in configurable master data with an effective date — so a legal change is an admin edit, not a release.',
    },
    {
      label: 'Public, with sign-in optional',
      text: 'Both tools are usable without signing in. Sign-in is offered to SAVE a result, never required to get one.',
    },
    {
      label: 'Both are acquisition surfaces',
      text: 'Each ends with a relevant route into the job search (or CV upload) — that is what makes them worth hosting.',
    },
    {
      label: 'Neither tool gives regulated advice',
      table: {
        cols: ['Tool', 'What it is', 'What it is NOT'],
        rows: [
          ['Salary calculator', 'An estimate, with a visible basis + effective date', 'Tax or payroll advice'],
          ['Personality test', 'A self-insight aid', 'An assessment used to screen candidates'],
        ],
      },
    },
  ],
  features: [
    // 0 · Personality testing ─────────────────────────────────────────────────
    {
      name: 'Personality testing',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      notes: 'migrate logic from current web — question bank and scoring must be extracted from the existing tool first, then held as master data',
      detail: {
        description:
          'A self-service personality questionnaire that returns a result type with a description and suggested job directions. The questionnaire and its scoring already exist on the current web and must be carried over unchanged: the same answers must produce the same result type. The work is therefore extraction first (question bank, scoring rules, result copy), then a clean re-implementation with the content held as data rather than hard-coded.',
        userStory:
          'As a jobseeker, I want to answer a short questionnaire and learn what kind of work suits me, so that I have a direction for my job search.',
        uiFields: [
          {
            group: 'Intro',
            items: [
              { name: 'explanation', type: 'static copy', required: true, notes: 'what the test is, how long it takes, and that it is guidance rather than an assessment' },
              { name: 'question count / estimated time', type: 'derived', notes: 'from the active question bank — the single biggest driver of completion rate' },
              { name: 'start', type: 'button', required: true, notes: 'no sign-in required' },
            ],
          },
          {
            group: 'Questionnaire',
            items: [
              { name: 'question', type: 'i18n string', required: true, notes: 'VI required, EN optional — same i18n convention as the rest of the site' },
              { name: 'answer options', type: 'enum / scale', required: true, notes: 'the exact option set must match the current tool — a 5-point scale and an A/B choice score very differently' },
              { name: 'progress', type: 'derived', notes: 'question N of M plus a progress bar; the main defence against mid-test abandonment' },
              { name: 'navigation', type: 'buttons', notes: 'next / back — back must not lose an earlier answer' },
              { name: 'resume draft', type: 'local state', notes: 'answers survive a reload so a long test is not lost' },
            ],
          },
          {
            group: 'Result',
            items: [
              { name: 'resultType', type: 'enum', required: true, notes: 'the type code from the scoring rules — the value that must match the old tool exactly' },
              { name: 'title / description', type: 'i18n string / i18n rich text', required: true, notes: 'result copy, migrated verbatim unless the client asks for a rewrite' },
              { name: 'strengths / suitable directions', type: 'i18n list', notes: 'the actionable part of the result' },
              { name: 'suggested job categories', type: 'enum[] → master data', notes: 'must map to real Job category / Role ids so the CTA leads to a live search (see Job management taxonomy)' },
              { name: 'CTA', type: 'link', required: true, notes: '"See jobs that fit" → a pre-filtered job search; the reason this tool earns its place' },
              { name: 'share / save', type: 'buttons', notes: 'share link; saving to My page offers sign-in without demanding it' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Migration discovery — do this before writing any scoring code',
            items: [
              'Extract the full question bank from the current web: every question, every option, and the language versions that exist.',
              'Extract the scoring rules: how options map to scores, how scores map to a result type, and every tie-break.',
              'Extract the result content: each type’s title, description, strengths and suggested directions.',
              'Build a fixture set of known answer-sets → expected result types from the live tool, and treat it as the acceptance suite.',
              'List anything unexplainable (a weight with no rationale, a type nobody can define) as a client question rather than quietly redesigning it.',
              'Confirm provenance: if the test derives from a licensed instrument (MBTI, DISC and similar are trademarked), the client has to confirm we are entitled to publish it. This is a legal check, not a build task.',
            ],
          },
          {
            heading: 'Content as master data',
            items: [
              'The question bank, the scoring map and the result copy are admin-editable data with a version, not constants in the codebase.',
              'A result stores the question-bank VERSION it was produced under, so an old saved result still explains itself after the bank changes.',
              'Editing a live question bank creates a new version rather than mutating the one existing results were scored against.',
              'This is the same principle the rest of the platform uses for taxonomies: content changes are data changes (see Job management → job taxonomy).',
            ],
          },
        ],
        behaviors: [
          'The test runs without an account; a result is produced for a guest.',
          'Answers are kept locally as the user progresses, so a reload or an accidental back-navigation does not restart the test.',
          'Back navigation preserves previously given answers.',
          'Submitting scores server-side and returns the result type — the scoring rules are not shipped to the client, so a result cannot be reverse-engineered or faked from the browser.',
          'The result page is shareable via a link that does not expose the raw answers.',
          'A signed-in user’s result is saved to My page automatically; a guest is offered sign-in to keep it, and the result is not lost if they decline.',
          'The result’s suggested categories deep-link into a real, pre-filtered job search.',
          'Incomplete tests are never scored — the result requires every question answered (per the current tool; confirm whether it allowed skips).',
        ],
        rules: [
          'The ported scoring must reproduce the current tool’s result for every fixture. A difference is a bug, not an improvement.',
          'Scoring happens server-side; the question bank may be delivered to the client but the mapping to a result must not be.',
          'A result records the question-bank version used, so it stays interpretable after the bank changes.',
          'No sign-in is required to take the test or see a result.',
          'The result is framed as self-insight. It is never presented as a psychometric assessment and never surfaced to employers as a screening signal.',
          'A saved result is the candidate’s own data: it is not exposed in employer CV search (see Resume management → visibility consent).',
          'Question and result copy follow the VI-required / EN-optional i18n convention.',
        ],
        states: [
          'Intro',
          'In progress (partial answers)',
          'Resumed from a saved draft',
          'Validation (unanswered question)',
          'Scoring',
          'Result (guest)',
          'Result (signed in, saved)',
          'Scoring failed (answers retained, retry)',
          'Question bank unavailable',
        ],
        backend: {
          dataModel: [
            { name: 'QuestionBank', type: 'entity', required: true, notes: 'version, status(draft|active|archived), locale coverage — only one Active at a time' },
            { name: 'Question', type: 'entity', required: true, notes: 'bankVersion, order, text i18n, optionSet, dimension/trait the question feeds' },
            { name: 'ScoringRule', type: 'entity', required: true, notes: 'the extracted mapping: option → score, score ranges → resultType, tie-breaks' },
            { name: 'ResultType', type: 'entity', required: true, notes: 'code, title i18n, description i18n, strengths, suggestedJobCategoryIds' },
            { name: 'TestSubmission', type: 'entity', notes: 'jobseekerId?, bankVersion, answers jsonb, resultTypeCode, completedAt — jobseekerId null for guests' },
          ],
          endpoints: [
            'GET /tools/personality/questions — the Active bank, without scoring rules',
            'POST /tools/personality/submit { answers } → { resultTypeCode, content }',
            'GET /tools/personality/results/:token — shareable result view',
            'POST /jobseeker/personality/save — attach a guest result to an account after sign-in',
            'GET /admin/tools/personality/banks — admin maintenance of bank versions',
          ],
          integrations: ['Master data (job categories & roles, for the suggested directions)', 'Job search (the result CTA)'],
          notes:
            'Keep scoring rules server-side and versioned; ship only questions to the client. The extraction fixtures from the current site belong in the test suite, because they are the only definition of "correct" this feature has.',
        },
        acceptance: [
          'Every extracted fixture from the current site produces the identical result type in the new implementation.',
          'A guest can complete the test and see a result without signing in.',
          'A reload mid-test does not lose answers.',
          'The result links to a job search that actually returns jobs for the suggested categories.',
          'Scoring rules are not present in any client payload.',
          'A saved result still renders correctly after the question bank is versioned forward.',
          'An admin can edit the bank and result copy without a code release.',
        ],
        openQuestions: [
          'Where exactly does the current test come from, and is the instrument licensed? (Blocker if it is trademarked.)',
          'How many questions and which option scale does the current tool use?',
          'Does the current tool allow skipping questions, and how does it score a partial test?',
          'Is the existing result copy reusable as-is, or does the client want it rewritten?',
          'Should results ever inform job recommendations, or stay purely informational?',
        ],
      },
    },

    // 1 · Gross ↔ Net calculator ──────────────────────────────────────────────
    {
      name: 'Gross - Net calculation',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      notes: 'migrate logic from current web — rates, caps and brackets must be extracted and held as dated master data, not hard-coded',
      detail: {
        description:
          'A bidirectional Vietnamese salary calculator: enter gross and see net, or enter net and see the gross needed to reach it, with the deductions broken out (compulsory insurance, personal and dependant relief, progressive personal income tax). The calculation logic exists on the current web and must be preserved exactly. The important structural change is that every rate, cap, bracket and relief amount becomes dated master data — these figures change by regulation, and a change must be an admin edit with an effective date, not a code deployment.',
        userStory:
          'As a jobseeker, I want to convert a gross salary offer into what I will actually receive (and back again), so that I can compare offers and negotiate with a real number.',
        uiFields: [
          {
            group: 'Input',
            items: [
              { name: 'direction', type: 'toggle', required: true, notes: 'Gross → Net · Net → Gross. Net → Gross is a solve, not a formula — see Behaviours.' },
              { name: 'amount', type: 'money (₫)', required: true, notes: 'thousands-separated as typed; the single most-used field on the screen' },
              { name: 'currency', type: 'enum', notes: '₫ primary; whether USD input is supported is an open question' },
              { name: 'region', type: 'enum', required: true, notes: 'Region I–IV — the regional minimum wage affects the unemployment-insurance cap' },
              { name: 'dependants', type: 'int', required: true, notes: 'count of registered dependants; each adds a relief amount. Default 0.' },
              { name: 'insuranceBase', type: 'enum / money', notes: 'whether contributions are computed on the full salary or a declared lower base — the current tool’s behaviour here must be matched exactly' },
              { name: 'effectiveDate', type: 'date', notes: 'which rate set to apply; defaults to today, and is what makes an old shared result reproducible' },
            ],
          },
          {
            group: 'Result breakdown',
            items: [
              { name: 'gross', type: 'money (₫)', required: true },
              { name: 'social insurance (BHXH)', type: 'money (₫)', required: true, notes: 'employee portion, subject to its cap' },
              { name: 'health insurance (BHYT)', type: 'money (₫)', required: true, notes: 'employee portion, subject to its cap' },
              { name: 'unemployment insurance (BHTN)', type: 'money (₫)', required: true, notes: 'employee portion, capped against the regional minimum wage — this is why region is an input' },
              { name: 'taxable income', type: 'derived', notes: 'gross − insurance − personal relief − dependant relief' },
              { name: 'personal income tax (TNCN)', type: 'money (₫)', required: true, notes: 'progressive; the per-bracket breakdown is shown, not just the total' },
              { name: 'net', type: 'money (₫)', required: true, notes: 'the number the user actually came for — the visual focus of the result' },
              { name: 'employer cost', type: 'money (₫)', notes: 'employer-side contributions, if the current tool shows them — a genuinely useful extra' },
              { name: 'basis note', type: 'static copy', required: true, notes: 'which rate set and effective date were applied, plus that this is an estimate' },
            ],
          },
        ],
        sections: [
          {
            heading: 'Rates as dated master data — the one structural change from the old tool',
            items: [
              'Insurance rates and their caps, the regional minimum wage per region, personal and dependant relief amounts, and the progressive tax brackets are all admin-editable records with an effectiveFrom date.',
              'A calculation resolves the rate set applicable to its effective date, so a result can be reproduced later and a shared link does not silently change meaning.',
              'A regulatory change is then an admin edit plus a new effective date — no release, no code change, no risk of a stale figure surviving in a constant somewhere.',
              'The current tool’s live figures are the starting data set, not the specification: extract them as data, do not re-type them into code.',
              'Deliberately NOT asserted in this spec: the specific percentages, caps and bracket boundaries. Those are extracted from the current tool and confirmed against the prevailing regulation at build time — a spec is the wrong place to freeze a number that legally changes.',
            ],
          },
          {
            heading: 'Net → Gross is a solve, not a rearrangement',
            items: [
              'Progressive tax plus capped insurance is not algebraically invertible in one step, so Net → Gross is solved numerically (binary search / iteration on gross until the computed net matches the target).',
              'It must converge to the đồng and be deterministic: the same target net always yields the same gross.',
              'Rounding is where a migration usually diverges. The old tool’s rounding — per component or only at the end, round vs floor — must be matched, because a 1,000₫ difference reads as a bug to a user comparing with the old site.',
              'The result should state that gross was solved to reach the requested net, so the user understands the direction of the calculation.',
            ],
          },
        ],
        behaviors: [
          'The result recalculates as the user types, with a short debounce — this tool is used by fiddling with the number, so a submit button would be friction.',
          'Switching direction carries the current amount over as the new input, rather than clearing the form.',
          'The breakdown is expandable: the headline net is always visible, the per-bracket tax detail on demand.',
          'Amounts are formatted with Vietnamese thousands separators as typed, and paste of a formatted number is parsed rather than rejected.',
          'A shareable link encodes the inputs (including the effective date), so a shared calculation reproduces exactly.',
          'The basis note always states which rate set and effective date were used.',
          'The result offers a route into the job search for the salary band entered — the acquisition purpose of the tool.',
          'No sign-in, no server round trip required for a result to feel instant; the authoritative computation is still server-side or shared-module so client and server cannot disagree.',
        ],
        rules: [
          'The ported calculation must match the current tool to the đồng for every extracted fixture. Any difference — including rounding — is a bug until the client says otherwise.',
          'No rate, cap, bracket or relief amount is hard-coded; all resolve from dated master data.',
          'A calculation always resolves the rate set for its effective date, defaulting to today.',
          'Insurance caps are applied before tax, and the unemployment cap resolves against the selected region’s minimum wage.',
          'Net → Gross must converge deterministically and be exact to the đồng.',
          'The result is labelled an estimate with its basis stated; the tool does not present itself as tax or legal advice.',
          'The calculation module is shared between client and server, so an inline preview can never differ from an authoritative result.',
          'Inputs are validated: no negative amounts, a sane upper bound, dependants a non-negative integer.',
        ],
        states: [
          'Empty (no amount yet)',
          'Typing (debounced recalculation)',
          'Gross → Net result',
          'Net → Gross result (solved)',
          'Zero / below-threshold amount (no tax due)',
          'Above the insurance caps (caps visibly applied)',
          'Validation error (negative / non-numeric / implausible)',
          'Historical effective date (older rate set applied)',
          'Rate set missing for the requested date',
        ],
        backend: {
          dataModel: [
            { name: 'RateSet', type: 'entity', required: true, notes: 'effectiveFrom, effectiveTo?, status — one resolved set per calculation date' },
            { name: 'InsuranceRate', type: 'entity', required: true, notes: 'rateSetId, type(social|health|unemployment), employeeRate, employerRate, capBasis(salary|min_wage_multiple), capValue' },
            { name: 'RegionalMinimumWage', type: 'entity', required: true, notes: 'rateSetId, region(I|II|III|IV), amount — drives the unemployment cap' },
            { name: 'TaxBracket', type: 'entity', required: true, notes: 'rateSetId, fromAmount, toAmount?, rate — the progressive ladder' },
            { name: 'Relief', type: 'entity', required: true, notes: 'rateSetId, personalRelief, dependantRelief' },
            { name: 'CalculationRequest', type: 'transient', notes: 'not persisted per user; only aggregate usage is tracked for analytics' },
          ],
          endpoints: [
            'GET /tools/salary/rates?date= — the resolved rate set for a date',
            'POST /tools/salary/calculate { direction, amount, region, dependants, insuranceBase, effectiveDate }',
            'GET /admin/tools/salary/rate-sets — admin maintenance',
            'POST /admin/tools/salary/rate-sets — new set with an effective date',
          ],
          integrations: ['Master data (regions)', 'Job search (salary-band CTA)'],
          notes:
            'Implement the calculation once, in a module both the API and the client import, and drive it entirely from the resolved rate set. Keep the extracted fixtures from the current site as the regression suite — they are the only definition of correct for this migration. Do not persist individual calculations: they are personal financial inputs with no reason to be stored.',
        },
        acceptance: [
          'Every fixture extracted from the current tool produces an identical net (and identical component breakdown) in the new implementation.',
          'Net → Gross round-trips: solving for a target net and then converting that gross back returns the original net to the đồng.',
          'Changing a rate in admin with a future effective date does not alter results for earlier dates.',
          'The insurance caps are visibly applied for high salaries, and changing region changes the unemployment component.',
          'Each additional dependant reduces taxable income by exactly the dependant relief in the resolved rate set.',
          'A shared link reproduces the identical result, including its effective date.',
          'No rate, cap or bracket value appears as a literal anywhere in the source.',
          'The result states its basis and that it is an estimate.',
        ],
        openQuestions: [
          'Which exact rates, caps, brackets and relief amounts does the current tool use — and are they still current? (Extraction task; confirm with the client before launch.)',
          'Does the current tool show employer-side cost, or employee net only?',
          'How does the current tool round — per component or at the end, round or floor? This decides whether the migration matches.',
          'Does it support a declared insurance base lower than the salary, as some employers use?',
          'Are foreign-worker cases in scope (different insurance participation), or local employment only?',
          'Is USD input needed, and if so at which exchange rate source?',
        ],
      },
    },
  ],
}
