import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AUTO_APPLY, BUILDER_STEPS, SUGGESTED_TAGS } from '@/pages/admin/data/resume'
import type { BuilderForm } from '@/pages/admin/data/resume'
import { TagChip } from '@/pages/admin/screens/recruitment/resumeNew/review'
import { BField } from '@/pages/admin/ui/fields'

export function BuilderRoute({ onContinue }: { onContinue: (f: BuilderForm) => void }) {
  const [step, setStep] = useState(1)
  const [err, setErr] = useState<string | null>(null)
  const [f, setF] = useState<BuilderForm>({ fullName: '', email: '', phone: '', location: '', headline: '', body: '', tags: [] })
  const [tagPhase, setTagPhase] = useState<'idle' | 'running' | 'done'>('idle')

  const up = <K extends keyof BuilderForm>(k: K, v: BuilderForm[K]) => setF((p) => ({ ...p, [k]: v }))

  // The gate per step. Step 3 and 4 have none — zero tags is a valid resume.
  function canAdvance() {
    if (step === 1) return f.fullName.trim() !== '' && /.+@.+\..+/.test(f.email) && f.phone.trim() !== '' && f.location.trim() !== ''
    if (step === 2) return f.headline.trim() !== '' && f.body.trim() !== ''
    return true
  }

  function runTags() {
    setTagPhase('running')
    setTimeout(() => {
      setTagPhase('done')
      // Re-running replaces the SUGGESTION set, not the operator's checkmarks —
      // so only seed the auto-apply set when nothing has been checked yet.
      setF((p) => (p.tags.length > 0 ? p : { ...p, tags: SUGGESTED_TAGS.filter((t) => t.conf >= AUTO_APPLY).map((t) => t.value) }))
    }, 1600)
  }

  const cur = BUILDER_STEPS[step - 1]

  return (
    <div className="max-w-[820px]">
      <ol className="mb-4 flex flex-wrap items-center gap-1.5">
        {BUILDER_STEPS.map((s, i) => {
          const done = step > i + 1
          const active = step === i + 1
          return (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className={cn('grid h-6 w-6 place-items-center rounded-full border text-[10.5px] font-semibold', done ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-brand bg-brand text-white' : 'border-line text-faint')}>
                {done ? '✓' : i + 1}
              </span>
              <span className={cn('text-[11.5px]', active ? 'font-semibold text-ink' : 'text-muted')}>{s.label}</span>
              {i < BUILDER_STEPS.length - 1 && <span className="text-faint">›</span>}
            </li>
          )
        })}
      </ol>

      <div className="rounded-xl border border-line bg-surface">
        <header className="border-b border-line-soft px-4 py-3">
          <h3 className="text-[14px] font-semibold">Step {step}: {cur.label}</h3>
          <p className="mt-0.5 text-[11.5px] text-muted">{cur.desc}</p>
        </header>
        <div className="space-y-3 p-4">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <BField label="Full name" req value={f.fullName} onChange={(v) => up('fullName', v)} placeholder="Nguyễn Văn An" />
              <BField label="Email" req value={f.email} onChange={(v) => up('email', v)} placeholder="you@example.com" />
              <BField label="Phone" req value={f.phone} onChange={(v) => up('phone', v)} placeholder="0901234567" />
              <BField label="Location" req value={f.location} onChange={(v) => up('location', v)} placeholder="Hồ Chí Minh" />
            </div>
          )}

          {step === 2 && (
            <>
              <BField label="Headline" req value={f.headline} onChange={(v) => up('headline', v)} placeholder="Backend developer with 3 years of experience" />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-ink/80">Resume body<span className="text-rose-500"> *</span></label>
                <textarea
                  rows={7}
                  value={f.body}
                  onChange={(e) => up('body', e.target.value)}
                  placeholder="Describe the experience, skills, education…"
                  className="w-full resize-y rounded-md border border-line bg-surface px-2.5 py-2 text-[12px] outline-none focus:border-brand"
                />
                <p className="mt-1 text-[10.5px] text-faint">The headline and body become the VI summary of the standard resume — its first line is the resume headline.</p>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="rounded-lg border border-line bg-canvas/30 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-[12.5px] font-semibold">AI tag suggestions</h4>
                  <p className="text-[11px] text-muted">The same suggestion set the Upload pipeline produces — both routes converge on identical tags.</p>
                </div>
                {tagPhase === 'idle' && (
                  <button onClick={runTags} disabled={f.body.trim() === ''} className="rounded-md bg-brand px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:opacity-90 disabled:opacity-40">Run AI suggestion</button>
                )}
                {tagPhase === 'running' && <button disabled className="rounded-md bg-brand/60 px-2.5 py-1.5 text-[11.5px] font-semibold text-white">◍ Analysing…</button>}
                {tagPhase === 'done' && <button onClick={runTags} className="rounded-md border border-line px-2.5 py-1.5 text-[11.5px] font-medium text-muted hover:border-brand hover:text-brand">↻ Re-run</button>}
              </div>

              {f.body.trim() === '' && tagPhase === 'idle' && <p className="mt-2 text-[11px] italic text-faint">Fill in the resume body on the previous step first.</p>}
              {f.body.trim() !== '' && tagPhase === 'idle' && <p className="mt-2 text-[11px] italic text-faint">Run AI suggestion to see tags here.</p>}

              {tagPhase !== 'idle' && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.map((t) => (
                    <TagChip
                      key={t.value}
                      kind={t.kind}
                      value={t.value}
                      conf={t.conf}
                      checked={f.tags.includes(t.value)}
                      onClick={() => tagPhase === 'done' && up('tags', f.tags.includes(t.value) ? f.tags.filter((x) => x !== t.value) : [...f.tags, t.value])}
                    />
                  ))}
                </div>
              )}
              {tagPhase === 'done' && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                  <span className="rounded-md bg-canvas px-2 py-0.5 text-[10.5px] text-muted tabular-nums">{f.tags.length} selected</span>
                  <p className="text-[10.5px] text-faint">Only checked tags are applied. Below {AUTO_APPLY * 100}% confidence goes to the operator approval queue.</p>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2.5">
              {([['Name', f.fullName], ['Email', f.email], ['Phone', f.phone], ['Location', f.location], ['Headline', f.headline]] as [string, string][]).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 border-b border-line-soft pb-2 text-[12px] last:border-b-0">
                  <span className="text-muted">{k}</span>
                  <span className={cn('col-span-2', v ? 'font-medium text-ink' : 'italic text-faint')}>{v || 'not provided'}</span>
                </div>
              ))}
              <div>
                <p className="mb-1 text-[11px] font-medium text-ink/80">Body</p>
                <p className="whitespace-pre-wrap rounded-md border border-line bg-canvas/40 p-2.5 text-[11.5px] text-ink/80">{f.body || <span className="italic text-faint">not provided</span>}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-ink/80">Tags</span>
                {f.tags.length === 0
                  ? <span className="text-[11.5px] italic text-faint">none selected</span>
                  : f.tags.map((t) => <span key={t} className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10.5px] text-muted">{t}</span>)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-ink/80">Source</span>
                <span className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted">SELF_REGISTER</span>
                <span className="text-[10.5px] text-faint">— set by the route, not chosen here</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-faint">
                This is a read-back, not the review. Continue hands off to the Saramin standard screen, where the resume is actually
                edited and registered.
              </p>
            </div>
          )}

          {err && <p role="alert" className="text-[11.5px] text-rose-600">{err}</p>}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button onClick={() => { setErr(null); setStep((s) => Math.max(1, s - 1)) }} disabled={step === 1} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted disabled:opacity-40">‹ Back</button>
        {step < BUILDER_STEPS.length ? (
          <button
            onClick={() => { if (!canAdvance()) { setErr('Please complete the required fields on this step.'); return } setErr(null); setStep((s) => s + 1) }}
            className="rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90"
          >Next ›</button>
        ) : (
          <button onClick={() => onContinue(f)} className="rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Continue to review →</button>
        )}
      </div>
    </div>
  )
}
