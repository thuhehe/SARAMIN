export function Overview() {
  return (
    <div className="max-w-[900px] pb-16">
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">
          Saramin Vietnam
        </p>
        <h1 className="text-[28px] font-bold tracking-tight mt-1">
          Feature Inventory &amp; Requirement Spec
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/75 max-w-[70ch]">
          A recruitment platform connecting talent and employers. It spans a public{' '}
          <strong>Job-seeker site</strong> (search &amp; apply for jobs) and a{' '}
          <strong>Company site</strong> (post jobs, manage applicants and hiring). An internal{' '}
          <strong>Admin console</strong> oversees all activity across both sites and integrates a{' '}
          <strong>CRM</strong> to manage the customer and client relationships that drive the business.
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted max-w-[70ch]">
          <span className="font-semibold text-ink/70">Our references:</span>{' '}
          Vietnamworks, TopCV.
        </p>
      </div>

      {/* General requirements — cross-cutting guidelines that apply to every module */}
      <section className="max-w-[70ch] mb-8">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">
          General requirements <span className="font-medium normal-case tracking-normal text-faint/80">· guideline, applies everywhere</span>
        </h2>
        <div className="rounded-xl border border-line divide-y divide-line-soft overflow-hidden">
          {/* 1 · Languages per surface */}
          <div className="px-4 py-3">
            <p className="mb-2.5 text-[13px] font-semibold text-ink">1 · Languages per surface</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ['Jobseeker', 'EN · VI', 'bg-emerald-500'],
                ['Admin', 'EN', 'bg-slate-400'],
                ['Company', 'EN · VI · KO', 'bg-sky-500'],
              ] as const).map(([surface, langs, dot]) => (
                <div key={surface} className="rounded-lg border border-line bg-canvas/40 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                    <span className={`h-2 w-2 rounded-full ${dot}`} /> {surface}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold tracking-wide text-ink/80">{langs}</p>
                </div>
              ))}
            </div>
          </div>
          {/* 2 · Change logs everywhere */}
          <div className="px-4 py-3">
            <p className="mb-1 text-[13px] font-semibold text-ink">2 · Change logs on every page</p>
            <p className="text-[13px] leading-relaxed text-ink/75">
              Every page keeps a history of changes — <strong>who</strong> (a user or the system),{' '}
              <strong>what</strong> changed (before → after) and <strong>when</strong>. See the 3-layer audit model
              (Audit log · page History · record Activity) in the Admin wireframe.
            </p>
          </div>
        </div>
      </section>

      {/* Sites & roles — confirmed shared terminology (who's who) */}
      <section className="max-w-[70ch] mb-8">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">
          Sites &amp; roles <span className="font-medium normal-case tracking-normal text-faint/80">· shared terminology</span>
        </h2>
        <div className="mb-3 grid gap-2 sm:grid-cols-3">
          {([
            ['Jobseeker site', 'JS', 'bg-emerald-500'],
            ['Company site', 'CO', 'bg-sky-500'],
            ['Admin site', 'Admin', 'bg-slate-400'],
          ] as const).map(([site, abbr, dot]) => (
            <div key={site} className="rounded-lg border border-line bg-canvas/40 px-3 py-2">
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
                <span className={`h-2 w-2 rounded-full ${dot}`} /> {site}
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-muted">{abbr}</p>
            </div>
          ))}
        </div>
        <dl className="rounded-xl border border-line divide-y divide-line-soft overflow-hidden">
          {[
            ['Employer', 'The hiring party — umbrella term. Either a Company (organization) or an Individual.'],
            ['Company', 'An employer that is an organization (tax code / MST, HR staff).'],
            ['Individual employer', 'An employer that is a single person hiring directly.'],
            ['Employer user', 'A person who logs into the Company (CO) site. Company → HR Manager / HR Specialist; individual → the person themselves.'],
            ['HR Manager', 'Company user with super-admin rights — 1 per company.'],
            ['HR Specialist', 'Company user with limited rights (job posting / CV search) — up to 3.'],
            ['Jobseeker', 'A person on the JS site looking for work → Candidate once they apply.'],
            ['Admin user (HQ)', 'Internal Saramin staff on the Admin site.'],
          ].map(([term, def]) => (
            <div key={term} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:gap-4">
              <dt className="w-36 shrink-0 text-[13px] font-semibold text-ink">{term}</dt>
              <dd className="text-[13px] leading-relaxed text-ink/75">{def}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed text-ink/70">
          <span className="font-semibold text-ink">Avoid ambiguity:</span> “employer” alone can mean the organization
          or the person — say <strong>Company</strong> (the org) or <strong>Employer user</strong> (the person).
        </p>
      </section>

      {/* Shared vocabulary — keep the whole team on one set of terms */}
      <section className="max-w-[70ch]">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">CRM lifecycle glossary</h2>
        <dl className="rounded-xl border border-line divide-y divide-line-soft overflow-hidden">
          {[
            ['Lead', 'A company we’re tracking in CRM. Not activated, not shown to jobseekers yet.'],
            ['Customer', 'A lead we won. Same company — now a real, paying one.'],
            ['Account', 'The company once activated (company level) — holds its products + its users.'],
            ['User', 'A person inside the company who logs in — e.g. HR Manager, HR Specialist.'],
            ['Company page', 'The public profile jobseekers see. Only for Job Posting customers.'],
          ].map(([term, def]) => (
            <div key={term} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:gap-4">
              <dt className="w-32 shrink-0 text-[13px] font-semibold text-ink">{term}</dt>
              <dd className="text-[13px] leading-relaxed text-ink/75">{def}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed text-ink/70">
          <span className="font-semibold text-ink">In one line:</span>{' '}
          create a <strong>Lead</strong> → win it → it’s a <strong>Customer</strong> → activate it = set up its{' '}
          <strong>Account</strong> (+ first <strong>user</strong> login) → the company appears in the list automatically.
        </p>
      </section>
    </div>
  )
}
