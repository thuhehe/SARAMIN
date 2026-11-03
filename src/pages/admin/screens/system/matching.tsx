import { ListPage } from '@/pages/admin/ui/list'
import { Bars, StatCards } from '@/pages/admin/ui/stats'

/* ── There is NO matching-settings screen any more (SRM-1338, 2026-11-03) ───────
   The seven score weights are part of the calculation, not configuration: they
   live in code under a version number and change through a reviewed code change
   (Recommended jobs (NEW logic) §22). The editor that used to sit here — eight
   signals, a sum-to-100 guard, Save-creates-a-version — is removed together with
   the build's General settings → Recommended jobs tab. The VND/USD exchange rate
   stays a setting, on its own page. What remains below is the REPORT: the one
   screen that can say whether the weights are any good. */

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
        { label: 'Weight version', value: 'v4 (in code)' },
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
            ['Occupation & role (Category › Group › Role)', '42', '4.6%', '1.9%', '+2.7pt', 'Carries the model, as intended — what the person would actually do all day.'],
            ['Location + work type', '20', '4.9%', '1.6%', '+3.3pt', 'Stronger than its weight suggests — the first dial to turn.'],
            ['Experience + level', '14', '4.4%', '2.0%', '+2.4pt', 'Working. The level-rung fallback is what keeps it alive on postings with no year band.'],
            ['Expected salary', '12', '3.6%', '2.9%', '+0.7pt', 'Weak. Many jobseekers leave salary blank, so it scores 0 often.'],
            ['Industry', '5', '3.5%', '3.1%', '+0.4pt', 'Barely moves anything.'],
            ['Skills', '4', '6.8%', '1.1%', '+5.7pt', 'Strong gap where it fires — but it fires only on the 26% of roles with taxonomy skills. This gap is the case for raising it once coverage and aliases exist.'],
            ['Education level', '3', '3.4%', '3.2%', '+0.2pt', 'No measurable effect.'],
          ]}
        />
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">By page</p>
        <ListPage
          cols={[{ label: 'Page', w: '1.4fr' }, { label: 'Shown', w: '1fr', align: 'r' }, { label: 'Click rate', w: '1fr', align: 'r' }, { label: 'Apply rate', w: '1fr', align: 'r' }]}
          rows={[
            ['Homepage section', '1.21M', '9.8%', '2.6%'],
            ['Job detail — recommended jobs', '402K', '14.1%', '4.8%'],
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
