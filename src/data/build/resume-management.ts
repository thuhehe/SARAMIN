import type { BuildModule } from './types'

export const resumeManagement: BuildModule = {
  id: 'resume-management',
  title: 'Resume management',
  owner: 'Luong',
  requirements: [
    'Create CV — online builder (+ uploaded CV); My CVs on the My page.',
    'One jobseeker = one primary CV (Phase-1) — confirm.',
    'Resume list on Admin and Company (CV search / talent), gated by package + candidate visibility consent.',
    'CV database & search for employers is a DISCOVERY task first: research how the CV pool is structured, indexed, searched and ranked before any build. See "Resume list — Companies".',
  ],
  features: [
    { name: 'Create CV', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-create-cv' },
    { name: 'My CVs (My page)', site: 'Jobseekers', scope: ['BE', 'FE', 'UI'], mockup: 'js-mypage' },
    { name: 'Resume list', site: 'Admin', scope: ['BE', 'FE'] },

    // ── CV DATABASE & SEARCH (paid) — the employer-facing search over the CV pool.
    //    Authored as a research/discovery brief because we have no data model yet.
    {
      name: 'Resume list',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      detail: {
        description:
          'The paid CV-search feature (Phase-1 flow #3): an employer buys a package, searches our pool of CVs by criteria, sees matching results with details LOCKED, then unlocks a candidate to view the full CV and contact them. ' +
          'This is a DISCOVERY / RESEARCH task before it is a build task. We do not yet have a CV data model, a criteria set, or ranking logic. The developer + BA must first investigate how a CV pool should be organised, indexed, searched and ranked — validate it against real sample CVs (2–3, provided later) and against reference products — and maintain a living design document as they go. Nothing here is final; treat the data model and endpoints below as a starting sketch to refine, not a spec to implement.',
        userStory:
          'As an employer, I want to search the CV database by the criteria that matter to me (title, skills, experience, location, salary…) and see the most relevant candidates first, so that I can find and contact the right people directly instead of waiting for applications.',

        sections: [
          {
            heading: 'Research scope — what to investigate',
            items: [
              'A. DATA & STRUCTURE — what fields make up a CV; which are structured (searchable/filterable) vs. free text; how each CV is stored so search is fast; how we "featurize" a CV (which attributes we extract and index).',
              'B. SEARCH & FILTER CRITERIA — the realistic criteria employers search by: keyword, job title, skills, years of experience, location, industry, education level, salary expectation, availability, last-active/updated date. Which are hard filters vs. soft/optional, and which matter most.',
              'C. MATCHING & RANKING — how results are ordered (relevance scoring, field weighting, recency, profile completeness); how to handle "no exact match" (fuzzy / related results).',
              'D. REFERENCE STUDY — how existing products organise and expose CV search, what to copy / avoid / do better (see Reference products below).',
              'E. GATING & PRIVACY — how results stay LOCKED until a package is bought; candidate visibility consent (a seeker must be discoverable); what an unlock consumes (credits) and reveals.',
            ],
          },
          {
            heading: 'Living document — maintain as you go (not just a final answer)',
            items: [
              'Findings — data structure, criteria, ranking approach.',
              'Reference notes — screenshots + notes from VietnamWorks and others.',
              'Proposed data model & search logic — recommended fields, filters, index, ranking.',
              'Open questions / decisions needed — anything blocking, for us to decide or provide.',
              'Assumptions — what was assumed where information was missing.',
              'Keep it updated continuously and flag blockers early so we can support you.',
            ],
          },
          {
            heading: 'Reference products to study',
            items: [
              'VietnamWorks — primary reference. We provide a login/account ID and buy the credits needed to test search, filters, result presentation and the unlock/credit model.',
              'Our own Admin "Resume list" — how HQ already views CVs.',
              'Secondary comparisons: TopCV, ITviec, LinkedIn Recruiter — filter sets and ranking cues.',
            ],
          },
          {
            heading: 'What we provide / how we support',
            items: [
              'Sample CV data — a small set (~2–3 CVs) to validate the model against, provided later.',
              'VietnamWorks access — account ID + purchased test credits.',
              'Fast product decisions — raise questions in the living document or directly.',
            ],
          },
          {
            heading: 'Suggested phases',
            items: [
              '1. Study references (VietnamWorks + our Admin resume list) → notes.',
              '2. Draft data model + criteria list → review with BA / product.',
              '3. Validate against real sample CVs once provided → refine.',
              '4. Propose search + ranking logic → review before any build.',
            ],
          },
        ],

        backend: {
          notes:
            'STARTING SKETCH ONLY — to be confirmed by the research. The point of the discovery task is to decide the real shape of this. Search likely needs a dedicated index (e.g. full-text / faceted) separate from the primary CV store.',
          dataModel: [
            { name: 'cvId', type: 'uuid', notes: 'one primary CV per seeker (Phase-1) — confirm' },
            { name: 'seekerId', type: 'uuid' },
            { name: 'title / desiredPosition', type: 'string', notes: 'primary keyword field' },
            { name: 'skills', type: 'string[]', notes: 'tag/faceted — a key search facet; needs normalisation' },
            { name: 'experienceYears', type: 'enum/number', notes: 'derived from work history?' },
            { name: 'location', type: 'enum (province/city)' },
            { name: 'industry / category', type: 'enum' },
            { name: 'educationLevel', type: 'enum' },
            { name: 'salaryExpectation', type: 'int (VND) / negotiable' },
            { name: 'visibility', type: 'enum', notes: 'discoverable · hidden — candidate consent gate' },
            { name: 'lastUpdatedAt / lastActiveAt', type: 'timestamp', notes: 'recency signal for ranking' },
            { name: 'completenessScore', type: 'number', notes: 'ranking signal — how filled-in the CV is' },
          ],
          endpoints: [
            'GET /company/resumes/search — faceted search; returns LOCKED previews + result count (TBD by research)',
            'POST /company/resumes/:id/unlock — consume a credit/package to reveal full CV + contact',
            'GET /company/resumes/:id — full CV (only after unlock)',
          ],
          integrations: ['Package / credit balance (Products & packages)', 'Candidate visibility consent'],
        },

        openQuestions: [
          'What exactly does a search result show while LOCKED (which fields are teased vs. hidden)?',
          'Does an unlock consume credits per-CV, and does re-viewing an already-unlocked CV cost again?',
          'Is "one seeker = one CV" firm for Phase-1, or can a seeker have multiple CVs to search over?',
          'What is the default candidate visibility — opt-in (discoverable only if the seeker allows) or opt-out?',
          'Which criteria are the priority filters for launch, and what drives default result ranking?',
          'Do we need our own search index (full-text/faceted), or is DB querying enough for Phase-1 volume?',
        ],
      },
    },
  ],
}
