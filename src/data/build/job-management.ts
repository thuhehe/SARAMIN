import type { BuildModule } from './types'

/*
 * TEMPLATE MODULE — this is the depth bar for every other module.
 * Each feature carries a full `detail`: overview, user story, UI fields,
 * behaviours, rules, states, backend contract, acceptance criteria and open
 * questions. Authored against VN-market standards (VietnamWorks / TopCV).
 */

export const jobManagement: BuildModule = {
  id: 'job-management',
  title: 'Job management',
  owner: 'Luan',
  requirements: [
    'Create a job on Admin AND on the Company site — company users can now post jobs themselves (previously draft-only).',
    'Standard VN job fields: title, company, salary (incl. "Thỏa thuận"), work location, level, experience, deadline, description / requirements / benefits.',
    'Job list on Admin (all jobs) and Company (own jobs) with status + filters.',
    'Jobseeker: job lists on the Homepage and Search-result page, plus the Job detail page.',
    'One shared Job entity + status lifecycle across all three surfaces (draft → pending → active → expired / closed).',
  ],
  features: [
    // 0 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Create job',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'Admin-side job create / edit form. HQ staff can post a job on behalf of any company (data-entry / concierge posting) and it is the same Job entity the Company site writes to. Admin posts are auto-approved (no approval gate) since they originate from HQ.',
        userStory:
          'As an HQ operator, I want to create or edit a job for any company so that we can onboard postings on behalf of clients and fix bad data.',
        uiFields: [
          {
            group: 'Basics',
            items: [
              { name: 'company', type: 'ref → Company', required: true, notes: 'searchable picker; drives branding on the JS side' },
              { name: 'title', type: 'string', required: true, notes: 'max 120 chars' },
              { name: 'category / industry', type: 'enum', required: true },
              { name: 'positionLevel', type: 'enum', notes: 'Intern · Fresher · Junior · Senior · Manager · Director' },
              { name: 'employmentType', type: 'enum', required: true, notes: 'Full-time · Part-time · Contract · Freelance · Internship' },
              { name: 'quantity', type: 'number', notes: 'number of openings; default 1' },
            ],
          },
          {
            group: 'Salary & location',
            items: [
              { name: 'salaryNegotiable', type: 'boolean', notes: 'when true → show "Thỏa thuận", hide min/max' },
              { name: 'salaryMin / salaryMax', type: 'number (VND)', notes: 'required unless negotiable' },
              { name: 'workLocations', type: 'Location[]', required: true, notes: 'province/city + address; supports multiple' },
              { name: 'workArrangement', type: 'enum', notes: 'Onsite · Hybrid · Remote' },
            ],
          },
          {
            group: 'Content',
            items: [
              { name: 'description', type: 'rich text', required: true },
              { name: 'requirements', type: 'rich text', required: true },
              { name: 'benefits', type: 'rich text' },
              { name: 'skills', type: 'string[]', notes: 'tag input; used by search' },
              { name: 'experienceYears', type: 'enum', notes: 'None · <1 · 1–2 · 3–5 · 5+' },
              { name: 'deadline', type: 'date', required: true, notes: 'drives auto-expiry' },
            ],
          },
        ],
        behaviors: [
          'Save as draft at any time; validation only runs on Publish.',
          'On Publish from Admin → status jumps straight to "active" (no approval step).',
          'Editing an active job keeps it active; a full audit entry is written (who / when / what).',
          '"Thỏa thuận" toggle disables and clears the min/max salary inputs.',
        ],
        rules: [
          'A job must belong to exactly one company.',
          'salaryMax ≥ salaryMin when both are set.',
          'deadline must be in the future on publish.',
          'Admin can post regardless of the company’s remaining posting quota (concierge override) — flagged in the audit log.',
        ],
        states: ['Empty new form', 'Editing existing', 'Validation errors', 'Saved draft', 'Published (active)'],
        backend: {
          dataModel: [
            { name: 'id', type: 'uuid' },
            { name: 'companyId', type: 'uuid', required: true },
            { name: 'title', type: 'string', required: true },
            { name: 'status', type: 'enum', notes: 'draft · pending_approval · active · expired · closed · rejected' },
            { name: 'salaryMin/Max/Negotiable', type: 'int / bool' },
            { name: 'locations', type: 'jsonb' },
            { name: 'deadline', type: 'date' },
            { name: 'createdBy / source', type: 'uuid / enum(admin|company)' },
          ],
          endpoints: [
            'POST /admin/jobs — create (draft or active)',
            'PUT /admin/jobs/:id — edit',
            'POST /admin/jobs/:id/publish',
            'GET /admin/companies?q= — company picker',
          ],
          notes: 'Same jobs table as the Company site; `source` distinguishes admin vs company-created.',
        },
        acceptance: [
          'HQ can create a job for any company and it appears active on the JS site.',
          'Draft → Publish transitions correctly; audit log records the actor.',
          'Negotiable salary renders as "Thỏa thuận" everywhere downstream.',
        ],
        openQuestions: [
          'Which job categories/industries are the canonical list for VN? (need the master taxonomy)',
          'Is a gender / age preference field allowed by policy? (legal review)',
        ],
      },
    },
    // 1 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Create job',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      notes: "Company user can't post job today (draft only); SVN wants company users to post by themselves.",
      mockup: 'co-create-job',
      detail: {
        description:
          'Self-service job posting for company (employer) users — the key new capability vs today, where companies can only save drafts. Same fields as the Admin form, but constrained by the company’s package quota and gated by an HQ approval step (Phase-1 quality gate).',
        userStory:
          'As a company HR user, I want to post a job myself so that I don’t have to wait for HQ to enter it for me.',
        uiFields: [
          {
            group: 'Same job fields as Admin',
            items: [
              { name: '(all Basics / Salary / Content fields)', type: '—', notes: 'company is fixed to the user’s own company (not editable)' },
            ],
          },
          {
            group: 'Posting options',
            items: [
              { name: 'productSlot / package', type: 'ref', notes: 'which purchased slot this posting consumes' },
              { name: 'featuredUpgrade', type: 'enum', notes: 'optional: main-ad / rank boost (from Products & Packages)' },
            ],
          },
        ],
        behaviors: [
          'Company is auto-set to the logged-in user’s company; not selectable.',
          'On submit → status = "pending_approval"; HQ reviews before it goes live.',
          'If no posting quota remains → block submit and deep-link to purchase a package.',
          'Draft is always allowed and does not consume quota.',
          'After HQ approval → "active"; on rejection → "rejected" with a reason shown to the company.',
        ],
        rules: [
          'Only HR Manager / HR Specialist roles can create jobs (see Account management).',
          'Publishing consumes exactly one posting slot on approval, not on submit.',
          'A company can only edit its own jobs.',
        ],
        states: ['Draft', 'Submitted / pending approval', 'Rejected (with reason)', 'Active', 'Quota exhausted (blocked)'],
        backend: {
          endpoints: [
            'POST /company/jobs — create draft / submit for approval',
            'PUT /company/jobs/:id',
            'GET /company/quota — remaining posting slots',
          ],
          integrations: ['Products & Packages (quota)', 'Notifications (approval / rejection to company)'],
          notes: 'Writes the same Job entity; `source = company`, `status = pending_approval` on submit.',
        },
        acceptance: [
          'A company user can submit a job and see it enter "pending approval".',
          'Quota is decremented on HQ approval, not on submit.',
          'Rejected jobs show the HQ reason and can be edited + resubmitted.',
        ],
        openQuestions: [
          'Does every company posting require HQ approval in Phase-1, or only first-time companies?',
          'SLA for HQ approval turnaround?',
        ],
      },
    },
    // 2 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list',
      site: 'Admin',
      scope: ['BE', 'FE'],
      detail: {
        description:
          'HQ master list of every job across all companies, with the approval queue front-and-centre. Primary tool for the Phase-1 quality gate: review, approve, reject, close or edit any posting.',
        userStory: 'As an HQ operator, I want to see and moderate all jobs so that only quality postings go live.',
        uiFields: [
          {
            group: 'Table columns',
            items: [
              { name: 'title / company', type: 'text' },
              { name: 'status', type: 'badge' },
              { name: 'source', type: 'badge', notes: 'admin vs company-created' },
              { name: 'created / deadline', type: 'date' },
              { name: 'applicants', type: 'count' },
            ],
          },
          {
            group: 'Filters',
            items: [
              { name: 'status', type: 'multi-select', notes: 'default filter = pending_approval first' },
              { name: 'company', type: 'search' },
              { name: 'date range / keyword', type: 'input' },
            ],
          },
        ],
        behaviors: [
          'Default sort surfaces "pending_approval" at the top (the work queue).',
          'Row actions: Approve · Reject (with reason) · Edit · Close · View applicants.',
          'Bulk approve / reject on selected rows.',
          'Server-side pagination + filter + sort.',
        ],
        rules: [
          'Approve is only valid from "pending_approval".',
          'Reject requires a reason (sent to the company).',
        ],
        states: ['Loading', 'Empty (no jobs)', 'Filtered-empty', 'Approval queue non-empty'],
        backend: {
          endpoints: [
            'GET /admin/jobs?status=&company=&q=&page=',
            'POST /admin/jobs/:id/approve',
            'POST /admin/jobs/:id/reject { reason }',
            'POST /admin/jobs/:id/close',
          ],
          notes: 'Approve/reject writes an audit entry and fires a notification to the company.',
        },
        acceptance: [
          'Pending jobs are easy to find and can be approved/rejected in one click.',
          'Rejecting requires and stores a reason.',
        ],
        openQuestions: ['Do we need a separate saved view per operator, or is one shared queue enough for Phase-1?'],
      },
    },
    // 3 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list',
      site: 'Companies',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'co-job-list',
      detail: {
        description:
          'A company’s own postings dashboard: their jobs with live status, applicant counts and quick actions (edit, close, duplicate, upgrade to featured).',
        userStory: 'As a company HR user, I want to manage my own postings and see how many applicants each got.',
        uiFields: [
          {
            group: 'Cards / rows',
            items: [
              { name: 'title', type: 'text' },
              { name: 'status', type: 'badge', notes: 'draft · pending · active · expired · rejected' },
              { name: 'applicants', type: 'count → links to Application list (CO)' },
              { name: 'views', type: 'count' },
              { name: 'deadline / days left', type: 'date' },
            ],
          },
        ],
        behaviors: [
          'Shows only the logged-in company’s jobs.',
          'Actions per job: Edit · Close · Duplicate · Upgrade (featured) · View applicants.',
          'Status tabs / filter: All · Active · Pending · Draft · Expired.',
          'Empty state prompts "Post your first job".',
        ],
        rules: ['Scoped strictly to the user’s company.', 'Only active/pending jobs count against quota.'],
        states: ['Loading', 'No jobs yet (onboarding CTA)', 'Has jobs', 'Filtered-empty'],
        backend: {
          endpoints: ['GET /company/jobs?status=&page=', 'POST /company/jobs/:id/close', 'POST /company/jobs/:id/duplicate'],
          integrations: ['Application management (applicant counts)'],
        },
        acceptance: ['A company sees only its own jobs with accurate applicant counts and can act on each.'],
        openQuestions: ['Can a company re-open an expired job, or must they duplicate it?'],
      },
    },
    // 4 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list (Homepage)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-home',
      detail: {
        description:
          'The public jobseeker homepage: hero search, curated rails (Hot jobs, Top companies, jobs by category) and Admin-managed banner slots. First impression + primary entry into search.',
        userStory: 'As a jobseeker, I want to discover relevant jobs the moment I land, so that I can start applying quickly.',
        uiFields: [
          {
            group: 'Sections',
            items: [
              { name: 'hero search', type: 'keyword + location + CTA' },
              { name: 'quick category chips', type: 'links' },
              { name: 'Hot jobs rail', type: 'JobCard[]', notes: 'featured / boosted first' },
              { name: 'Top companies', type: 'CompanyCard[]' },
              { name: 'banner slots', type: 'Admin-managed', notes: 'see Banners & Popups' },
            ],
          },
        ],
        behaviors: [
          'Hero search submits into the Search-result page.',
          'Featured / boosted jobs (from Products & Packages) rank first in Hot jobs.',
          'Only "active" and non-expired jobs are eligible.',
          'Personalised rails if logged in (by preferences) — otherwise popular fallback.',
        ],
        rules: ['Never show draft / pending / expired jobs.', 'Respect banner scheduling + targeting.'],
        states: ['Guest', 'Logged-in (personalised)', 'Loading skeleton', 'No jobs (unlikely — fallback to popular)'],
        backend: {
          endpoints: ['GET /jobs/home — curated rails', 'GET /companies/top'],
          integrations: ['Products & Packages (boost ranking)', 'Banners & Popups'],
        },
        acceptance: ['Homepage renders active jobs, boosted ones rank first, hero search routes to results.'],
        openQuestions: ['Which rails are in Phase-1 exactly, and what drives "Hot"? (recency vs boost vs clicks)'],
      },
    },
    // 5 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job list (Search result)',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-search',
      detail: {
        description:
          'Keyword + filter search results with facets (industry, location, salary, level, experience, employment type), sorting and pagination. The workhorse discovery surface.',
        userStory: 'As a jobseeker, I want to filter and sort jobs so that I can zero in on the right roles.',
        uiFields: [
          {
            group: 'Query & facets',
            items: [
              { name: 'keyword', type: 'string' },
              { name: 'location', type: 'province multi-select' },
              { name: 'industry / category', type: 'multi-select' },
              { name: 'salary range', type: 'range' },
              { name: 'level / experience / employmentType', type: 'multi-select' },
              { name: 'sort', type: 'enum', notes: 'Relevance · Newest · Salary' },
            ],
          },
          {
            group: 'Result item',
            items: [{ name: 'JobCard', type: 'title, company, salary, location, tags, saved ♥, posted-ago' }],
          },
        ],
        behaviors: [
          'Filters reflect in the URL (shareable / back-button safe).',
          'Debounced keyword; facets apply instantly with result counts.',
          'Save (scrap) a job from the card without leaving results.',
          'Boosted jobs get limited priority but stay clearly relevant.',
        ],
        rules: ['Only active, non-expired jobs.', 'Salary sort treats "Thỏa thuận" as unranked / last.'],
        states: ['Loading', 'No results (suggest broadening)', 'Has results', 'Error / retry'],
        backend: {
          endpoints: ['GET /jobs/search?q=&filters…&sort=&page='],
          integrations: ['Search index (facets, relevance)', 'Scraps (saved jobs)'],
          notes: 'Consider a search index (e.g. Meilisearch/ES) vs SQL for facets + relevance — decision needed.',
        },
        acceptance: ['Filters + sort + pagination work and are URL-encoded; only active jobs appear.'],
        openQuestions: ['SQL vs dedicated search engine for Phase-1?', 'Is relevance ranking in scope, or newest-first only?'],
      },
    },
    // 6 ──────────────────────────────────────────────────────────────────────
    {
      name: 'Job detail',
      site: 'Jobseekers',
      scope: ['BE', 'FE', 'UI'],
      mockup: 'js-job-detail',
      detail: {
        description:
          'Full job posting page: all content, company block, salary/location/deadline meta, and the primary Apply CTA. The conversion surface — everything funnels here.',
        userStory: 'As a jobseeker, I want to read the full job and apply in one click so that applying is effortless.',
        uiFields: [
          {
            group: 'Header',
            items: [
              { name: 'title / company (logo, link to company detail)', type: 'text' },
              { name: 'salary · location · level · deadline', type: 'meta row' },
              { name: 'Apply CTA · Save ♥ · Share', type: 'actions' },
            ],
          },
          {
            group: 'Body',
            items: [
              { name: 'description / requirements / benefits', type: 'rich text' },
              { name: 'skills / tags', type: 'chips' },
              { name: 'similar jobs', type: 'JobCard[]' },
            ],
          },
        ],
        behaviors: [
          'Apply opens the Apply flow (see Application management); prompts login if guest.',
          'Save (scrap) toggles without navigation.',
          'Expired / closed jobs show a notice and disable Apply.',
          'Company block links to the public Company detail page.',
        ],
        rules: ['Only active jobs are publicly reachable; expired/closed are read-only with a notice.', 'Increment a view count (deduped) for analytics.'],
        states: ['Active (apply enabled)', 'Expired / closed (apply disabled)', 'Guest (apply → login)', 'Already applied (show status)'],
        backend: {
          endpoints: ['GET /jobs/:slug', 'POST /jobs/:id/view', 'GET /jobs/:id/similar'],
          integrations: ['Application management (Apply)', 'Scraps', 'Company detail'],
        },
        acceptance: ['Full job renders; Apply routes correctly (with login gate); expired jobs disable Apply.'],
        openQuestions: ['Show "X applicants already applied" as social proof, or hide it?'],
      },
    },
  ],
}
