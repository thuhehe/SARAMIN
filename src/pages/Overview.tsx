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

      {/* Shared vocabulary — keep the whole team on one set of terms */}
      <section className="max-w-[70ch]">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">Glossary</h2>
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
