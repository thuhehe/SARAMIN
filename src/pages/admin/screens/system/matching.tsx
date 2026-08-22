import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ListPage } from '@/pages/admin/ui/list'
import { Bars, StatCards } from '@/pages/admin/ui/stats'

/* ── Matching settings — the 8 score weights + the exchange rate ──────────────
   The recommendation and applicant-ranking score is ONE calculation with eight
   weighted signals. The weights are our estimate, not research, so this screen
   exists for one reason: they can be corrected without a code deploy.

   Two things make it safe to hand to an operator. The total must be exactly 100
   before Save is enabled — a set of weights that sums to 93 silently rescales
   every score in the product. And Save creates a new VERSION rather than editing
   the current one, so a score computed last month can still be explained. */
export function AdminMatchingSettings() {
  const [w, setW] = useState<Record<string, number>>({
    skills: 38, years: 18, location: 17, category: 10, salary: 7, industry: 5, education: 3, language: 2,
  })
  const SIGNALS: { key: string; label: string; reads: string }[] = [
    { key: 'skills', label: 'Skills', reads: 'CV skills ↔ job skills (same master list)' },
    { key: 'years', label: 'Years of experience + level', reads: 'Years + seniority derived from job titles' },
    { key: 'location', label: 'Location + work type', reads: 'Desired location & work type ↔ job location' },
    { key: 'category', label: 'Desired job category', reads: 'Work preference ↔ job category' },
    { key: 'salary', label: 'Expected salary', reads: 'Expected salary ↔ job salary range' },
    { key: 'industry', label: 'Industry', reads: 'Desired industry ↔ company industry' },
    { key: 'education', label: 'Education level', reads: 'Highest education ↔ job minimum' },
    { key: 'language', label: 'Foreign language', reads: 'CV language + level ↔ job requirement' },
  ]
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  const ok = total === 100
  const bump = (k: string, d: number) => setW((x) => ({ ...x, [k]: Math.max(0, Math.min(100, x[k] + d)) }))

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800">
        These weights decide the order of <b className="font-semibold">recommended jobs</b> for every jobseeker AND the order of <b className="font-semibold">applicants</b> on every job.
        They are a starting estimate — tune them against the Matching report, not by opinion. Saving creates a new version; scores already computed keep the version that produced them.
      </p>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[1.3fr_1.7fr_auto] gap-3 border-b border-line bg-canvas/60 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
          <span>Signal</span><span>What it compares</span><span className="text-right">Points</span>
        </div>
        {SIGNALS.map((sig) => (
          <div key={sig.key} className="grid grid-cols-[1.3fr_1.7fr_auto] items-center gap-3 border-b border-line-soft px-4 py-2 last:border-b-0">
            <span className="text-[12.5px] font-medium text-ink">{sig.label}</span>
            <span className="text-[11.5px] text-muted">{sig.reads}</span>
            <span className="flex items-center gap-1.5">
              <button onClick={() => bump(sig.key, -1)} className="grid h-6 w-6 place-items-center rounded-md border border-line text-[13px] leading-none text-muted hover:bg-canvas">−</button>
              <span className="w-9 text-center text-[13px] font-semibold tabular-nums text-ink">{w[sig.key]}</span>
              <button onClick={() => bump(sig.key, 1)} className="grid h-6 w-6 place-items-center rounded-md border border-line text-[13px] leading-none text-muted hover:bg-canvas">+</button>
            </span>
          </div>
        ))}
        {/* The guard: Save is impossible unless the weights sum to exactly 100. */}
        <div className={cn('grid grid-cols-[1.3fr_1.7fr_auto] items-center gap-3 border-t px-4 py-2.5', ok ? 'border-line bg-canvas/40' : 'border-rose-200 bg-rose-50')}>
          <span className={cn('text-[12.5px] font-semibold', ok ? 'text-ink' : 'text-rose-700')}>Total</span>
          <span className={cn('text-[11.5px]', ok ? 'text-faint' : 'font-medium text-rose-700')}>
            {ok ? 'Must always be exactly 100.' : `Must be exactly 100 — currently ${total}. Save is disabled.`}
          </span>
          <span className={cn('w-full text-right text-[13px] font-bold tabular-nums', ok ? 'text-emerald-700' : 'text-rose-700')}>{total}</span>
        </div>
      </div>

    </div>
  )
}

/* ── Matching report — does a higher score actually produce applications? ──────
   The one screen that tells us whether the weights above are any good. It reads
   the recommendation log: one row per job SHOWN, with position, score, and what
   the jobseeker did next.

   POSITION IS THE CONTROL. Jobs at the top of a list get clicked more whatever
   they score, so every rate here is read within a position band — otherwise the
   report just measures where a card sat. */
export function AdminMatchingReport() {
  return (
    <div className="space-y-4">
      <StatCards cards={[
        { label: 'Recommendations shown', value: '1.84M', delta: '30 ngày', up: true },
        { label: 'Click rate', value: '11.2%', delta: '0.8pt', up: true },
        { label: 'Apply rate', value: '3.4%', delta: '0.2pt', up: true },
        { label: 'Weight version', value: 'v3' },
      ]} />

      <div>
        <p className="text-[12px] font-semibold text-ink/70">Apply rate by score band — position 1–4 only</p>
        <Bars unit="%" data={[
          { label: '90–100', value: 7.1 },
          { label: '80–89', value: 5.2 },
          { label: '70–79', value: 3.3 },
          { label: '60–69', value: 2.1 },
          { label: 'under 60', value: 1.4 },
        ]} />
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          Rising left to right is what a working score looks like: a higher score really does lead to more applications. A flat chart here means a weight is wrong — that is the whole reason this screen exists.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">Which signal earns its weight</p>
        <ListPage
          cols={[
            { label: 'Signal', w: '1.4fr' },
            { label: 'Points', w: '0.6fr', align: 'r' },
            { label: 'Apply rate when it scored FULL', w: '1.2fr', align: 'r' },
            { label: 'when it scored ZERO', w: '1.2fr', align: 'r' },
            { label: 'Gap', w: '0.8fr', align: 'r' },
            { label: 'Reading', w: '1.8fr' },
          ]}
          rows={[
            ['Skills', '38', '6.8%', '1.1%', '+5.7pt', 'Earns its weight — the strongest single signal.'],
            ['Years of experience + level', '18', '4.4%', '2.0%', '+2.4pt', 'Working as expected.'],
            ['Location + work type', '17', '4.9%', '1.6%', '+3.3pt', 'Stronger than its weight suggests — a candidate for an increase.'],
            ['Desired job category', '10', '3.9%', '2.4%', '+1.5pt', 'Working.'],
            ['Expected salary', '7', '3.6%', '2.9%', '+0.7pt', 'Weak. Many jobseekers leave salary blank, so it scores neutral often.'],
            ['Industry', '5', '3.5%', '3.1%', '+0.4pt', 'Barely moves anything — reduce it and give the points to Location.'],
            ['Education level', '3', '3.4%', '3.2%', '+0.2pt', 'No measurable effect.'],
            ['Foreign language', '2', '5.1%', '3.3%', '+1.8pt', 'Small weight, real effect — only fires on the few jobs that ask.'],
          ]}
        />
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">By page</p>
        <ListPage
          cols={[{ label: 'Page', w: '1.4fr' }, { label: 'Shown', w: '1fr', align: 'r' }, { label: 'Click rate', w: '1fr', align: 'r' }, { label: 'Apply rate', w: '1fr', align: 'r' }]}
          rows={[
            ['Homepage section', '1.21M', '9.8%', '2.6%'],
            ['Job detail — similar jobs', '402K', '14.1%', '4.8%'],
            ['After applying', '186K', '17.6%', '6.2%'],
            ['After onboarding', '51K', '12.4%', '5.1%'],
          ]}
        />
        <p className="mt-1 text-[11px] leading-relaxed text-faint">
          The two job-anchored pages convert about twice as well as the homepage, because they know what the jobseeker is looking at right now. After onboarding is the highest-intent moment a new account ever has.
        </p>
      </div>

      <p className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[11px] leading-relaxed text-muted">
        Reads the recommendation log — one row per job shown: candidate · job · score · weight version · rate version · page · position · shown at · clicked · applied.
        It is personal data, kept about 12 months, and never exposed to employers.
      </p>
    </div>
  )
}
