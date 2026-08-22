import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { AUTO_APPLY, CONVERT_STEPS, EXTRACTED_FIELDS, SUGGESTED_TAGS, useConvertProgress } from '@/pages/admin/data/resume'
import { TagChip } from '@/pages/admin/screens/recruitment/resumeNew/review'
import { Pill } from '@/pages/admin/ui/status'

/* ── ① Upload route — file + CV Convert pipeline ─────────────────────────────── */

export function UploadRoute({ onContinue }: { onContinue: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<{ name: string; kb: string } | null>(null)
  const { phase, step, start, reset } = useConvertProgress()

  // A stale pipeline result must never be shown against a new file, so any change
  // to the selection resets the run.
  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    setFile(f ? { name: f.name, kb: (f.size / 1024).toFixed(1) } : null)
    reset()
  }
  function clear() {
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    reset()
  }

  const shown = (i: number) => phase === 'done' || step >= i

  return (
    <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
      {/* left — file + step rail */}
      <aside className="space-y-3">
        <div className="rounded-xl border border-line bg-surface p-3.5">
          <h3 className="text-[12.5px] font-semibold">Upload original CV</h3>
          <p className="mt-0.5 text-[11px] text-faint">PDF · DOC · DOCX — max ~5 MB. Type and size are validated before upload.</p>
          {file ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-md border border-line bg-canvas/40 p-2.5">
              <span className="text-[15px]"></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-medium text-ink">{file.name}</p>
                <p className="text-[10.5px] text-faint tabular-nums">{file.kb} KB</p>
              </div>
              <button
                onClick={clear}
                disabled={phase === 'running'}
                title={phase === 'running' ? 'Cannot change the file while the pipeline is running' : 'Remove'}
                className="rounded-md border border-line px-1.5 py-1 text-[10.5px] text-muted disabled:opacity-40"
              ></button>
            </div>
          ) : (
            <>
              <button onClick={() => fileRef.current?.click()} className="mt-3 flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-line bg-canvas/30 px-4 py-7 text-[11.5px] text-muted transition-colors hover:border-brand hover:text-ink">
                <span className="text-[18px]"></span>
                Choose file
              </button>
              {/* Prototype affordance only — the real console has just the file input.
                  A spec reviewer should not have to find a PDF on their machine to see
                  the pipeline, which is the part of this screen worth reviewing. */}
              <button onClick={() => setFile({ name: 'original-cv.pdf', kb: '184.2' })} className="mt-2 w-full text-[10.5px] text-faint underline hover:text-brand">
                or use a sample CV (prototype only)
              </button>
            </>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={pick} />
        </div>

        <ol className="space-y-2">
          {CONVERT_STEPS.map((s, i) => {
            const state = phase === 'done' || i < step ? 'done' : i === step && phase === 'running' ? 'active' : 'pending'
            return (
              <li key={s.title} className={cn('flex gap-2.5 rounded-lg border p-2.5', state === 'active' ? 'border-brand bg-brand-soft/40' : state === 'done' ? 'border-emerald-200 bg-emerald-50/50' : 'border-line bg-surface')}>
                <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold', state === 'active' ? 'bg-brand text-white' : state === 'done' ? 'bg-emerald-600 text-white' : 'bg-canvas text-faint')}>
                  {state === 'done' ? '✓' : state === 'active' ? '◍' : s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium text-ink">{s.title}</p>
                  <p className="text-[10.5px] leading-snug text-faint">{s.desc}</p>
                </div>
              </li>
            )
          })}
        </ol>

        {phase === 'idle' && (
          <button onClick={start} disabled={!file} className="w-full rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-40">
            Start analysis
          </button>
        )}
        {phase === 'running' && (
          <button disabled className="w-full rounded-lg bg-brand/60 px-3 py-2 text-[12.5px] font-semibold text-white">◍ Processing…</button>
        )}
        {phase === 'done' && (
          <>
            <button onClick={onContinue} className="w-full rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Review &amp; edit extracted result →</button>
            <p className="text-[10.5px] leading-relaxed text-faint">The extracted fields and tags are carried to the review screen. Nothing is saved until you register there.</p>
          </>
        )}
        {phase === 'idle' && !file && (
          <p className="text-[10.5px] text-faint">The pipeline runs on an explicit start — pick a file first, so a wrong file can be swapped without watching a run you would discard.</p>
        )}
      </aside>

      {/* right — stage panel, one result card per completed step */}
      {phase === 'idle' ? (
        <section className="grid min-h-[420px] place-items-center rounded-xl border border-dashed border-line p-8 text-center">
          <div>
            <p className="text-[24px]"></p>
            <h3 className="mt-1 text-[14px] font-semibold">Normalise this CV into the Saramin standard model</h3>
            <p className="mx-auto mt-1 max-w-[420px] text-[11.5px] leading-relaxed text-muted">
              The pipeline parses the original PDF, extracts structured fields and searchable tags, and generates a new resume in the
              Saramin standard format. Every result is reviewable before anything is saved.
            </p>
            {file && <span className="mt-3 inline-block rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] text-muted">{file.name}</span>}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {shown(0) && (
            <ResultCard title="PDF parsing result" active={step === 0 && phase === 'running'} done={phase === 'done' || step > 0}>
              <pre className="overflow-x-auto rounded-md bg-canvas/60 p-3 font-mono text-[10.5px] leading-relaxed text-muted">{`original-cv.pdf · 1 page · 312 tokens
  ├─ Frontend Engineer · Tiki  (2023.03 – present)
  ├─ Junior Web Developer · Sendo  (2022.01 – 2023.02)
  ├─ HUST · B.S. Computer Science (2018 – 2022)
  └─ Skills: React, TS, Next.js, Tailwind, GraphQL, PG`}</pre>
            </ResultCard>
          )}
          {shown(1) && (
            <ResultCard title="Structured fields" active={step === 1 && phase === 'running'} done={phase === 'done' || step > 1}>
              <dl className="grid gap-2 sm:grid-cols-2">
                {EXTRACTED_FIELDS.map(([k, v]) => (
                  <div key={k} className="rounded-md border border-line bg-surface p-2.5">
                    <dt className="text-[9.5px] uppercase tracking-wide text-faint">{k}</dt>
                    <dd className="mt-0.5 text-[11.5px] text-ink/80">{v}</dd>
                  </div>
                ))}
              </dl>
            </ResultCard>
          )}
          {shown(2) && (
            <ResultCard title="AI suggested tags" active={step === 2 && phase === 'running'} done={phase === 'done' || step > 2}>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((t) => (
                  <TagChip key={t.value} kind={t.kind} value={t.value} conf={t.conf} checked={t.conf >= AUTO_APPLY} />
                ))}
              </div>
              <p className="mt-2 text-[10.5px] text-faint">Confidence ≥ {AUTO_APPLY * 100}% is auto-applied. The rest move to the operator approval queue.</p>
            </ResultCard>
          )}
          {shown(3) && (
            <ResultCard title="Saramin-standard resume" active={step === 3 && phase === 'running'} done={phase === 'done'}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-soft text-[16px]"></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-medium text-ink">saramin-cv.pdf · 1 page · ready for review</p>
                  <p className="text-[10.5px] text-faint">Open the “Saramin standard” tab on the review screen to preview it.</p>
                </div>
                {phase === 'done' && <Pill tone="active">Preview ready</Pill>}
              </div>
            </ResultCard>
          )}
        </section>
      )}
    </div>
  )
}

function ResultCard({ title, active, done, children }: { title: string; active: boolean; done: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-xl border bg-surface', active ? 'border-brand/60 shadow-sm' : done ? 'border-emerald-200' : 'border-line')}>
      <div className="flex items-center justify-between border-b border-line-soft px-3.5 py-2">
        <h4 className="text-[12px] font-semibold text-ink">{title}</h4>
        <span className={cn('text-[11px]', active ? 'text-brand' : done ? 'text-emerald-600' : 'text-faint')}>{active ? '◍' : done ? '✓' : '◌'}</span>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  )
}
