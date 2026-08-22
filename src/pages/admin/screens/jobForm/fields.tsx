import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BASE_POOL, ROLE_SKILL_MAP, SKILL_CAP, SKILL_POOL, SUGGEST_CAP } from '@/pages/admin/data/jobForm'
import { LabelRow } from '@/pages/admin/ui/fields'

export function JobSkillsField({ roles = ['Software Developer'] }: { roles?: string[] } = {}) {
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'GraphQL'])
  const [adding, setAdding] = useState(false)

  const sel = (n: string) => SKILL_POOL.find((s) => s.name === n)?.sel ?? 0.25
  const count = Math.max(1, Math.round(skills.reduce((acc, n) => acc * sel(n), BASE_POOL)))
  const available = SKILL_POOL.filter((s) => !skills.includes(s.name))
  const full = skills.length >= SKILL_CAP
  /* UNION across every role on the job, not just the first — a job tagged
     "Software Developer + DevOps Engineer" wants both lists. A skill that is
     ESSENTIAL for ANY of the roles counts as essential; essentials first, then
     optionals, minus what is already on the job, capped at 6. Same rule as the
     candidate side with several desired roles — only the key differs. */
  const merged = new Map<string, boolean>()
  for (const r of roles) {
    for (const s of ROLE_SKILL_MAP[r] ?? []) {
      merged.set(s.name, (merged.get(s.name) ?? false) || s.essential)
    }
  }
  const suggestions = [...merged]
    .map(([name, essential]) => ({ name, essential }))
    .filter((s) => !skills.includes(s.name))
    .sort((a, b) => Number(b.essential) - Number(a.essential))
    .slice(0, SUGGEST_CAP)

  return (
    <div>
      <LabelRow label="Skills" req right={<span className={cn('text-[10.5px] tabular-nums', full ? 'font-medium text-amber-600' : 'text-faint')}>{skills.length}/{SKILL_CAP}</span>} />
      <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5">
        {skills.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded border border-brand/30 bg-brand-soft px-2 py-0.5 text-[11px] text-brand">
            {c}
            <span onClick={() => setSkills((a) => a.filter((x) => x !== c))} className="cursor-pointer opacity-60 hover:opacity-100">×</span>
          </span>
        ))}
        {!full && <button onClick={() => setAdding((o) => !o)} className="px-1 text-[11.5px] font-medium text-brand">＋ Add skill</button>}
      </div>

      {adding && (
        <div className="mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-sm">
          <p className="border-b border-line-soft bg-canvas/50 px-2.5 py-1 text-[10px] text-faint">From the Skill taxonomy — type to search</p>
          {available.slice(0, 6).map((s) => (
            <button
              key={s.name}
              onClick={() => { setSkills((a) => [...a, s.name]); setAdding(false) }}
              className="flex w-full items-center border-b border-line-soft px-2.5 py-1.5 text-left text-[11.5px] text-ink/80 last:border-b-0 hover:bg-canvas/60"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions — read from occupation_skill, keyed on the job's own Job
          role. One tap each; essentials first so the ordering itself tells the
          employer what matters. Never auto-added: a suggestion the employer did
          not choose would silently change who the job ranks. */}
      {!full && suggestions.length > 0 && (
        <div className="mt-1.5 rounded-md border border-line bg-canvas/40 px-2.5 py-2">
          <p className="text-[10.5px] text-muted">
            Common for <b className="font-medium text-ink/80">{roles.join(' + ')}</b> <span className="text-faint">· essential first</span>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <span
                key={s.name}
                onClick={() => setSkills((a) => [...a, s.name])}
                title={s.essential ? 'Essential for this role' : 'Optional for this role'}
                className={cn(
                  'cursor-pointer rounded-full border px-2 py-0.5 text-[11px]',
                  s.essential
                    ? 'border-brand/40 bg-surface font-medium text-brand'
                    : 'border-dashed border-line bg-surface text-muted',
                )}
              >＋ {s.name}</span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-1 text-[10.5px] text-faint">
        <b className="font-medium text-muted tabular-nums">≈ {count.toLocaleString()}</b> candidates have all of these · skills rank candidates, they never exclude anyone.
      </p>
    </div>
  )
}

/** Company summary chip — click to open the company detail page on Admin. */
export function CompanyInfoCard() {
  return (
    <button className="flex w-full items-center gap-3 rounded-lg border border-line bg-canvas/40 p-3 text-left transition-colors hover:border-brand/40">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-surface text-[12px] font-bold text-brand">NEC</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">NEC Vietnam <span className="text-[11px] font-normal text-muted">· ID CO-1042</span></p>
        <p className="text-[11px] text-muted">IT / Software · 100–499 staff · Head office: Hồ Chí Minh</p>
      </div>
      <span className="ml-auto text-[15px] text-muted">→</span>
    </button>
  )
}
