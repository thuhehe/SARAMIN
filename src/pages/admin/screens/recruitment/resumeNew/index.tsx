import { useState } from 'react'
import { useDetailCrumb } from '@/pages/admin/ctx'
import { builderStd, importedStd } from '@/pages/admin/data/resume'
import type { Std } from '@/pages/admin/data/resume'
import { BuilderRoute } from '@/pages/admin/screens/recruitment/resumeNew/builder'
import { ResumeReview } from '@/pages/admin/screens/recruitment/resumeNew/review'
import { UploadRoute } from '@/pages/admin/screens/recruitment/resumeNew/upload'

/* ── the flow ────────────────────────────────────────────────────────────────── */

export function AdminResumeNew({ onBack }: { onBack: () => void }) {
  useDetailCrumb('New resume', onBack)
  const [path, setPath] = useState<'picker' | 'upload' | 'builder' | 'review'>('picker')
  const [draft, setDraft] = useState<Std | null>(null)
  const [source, setSource] = useState<'IMPORT' | 'SELF_REGISTER'>('IMPORT')

  function handoff(std: Std, src: 'IMPORT' | 'SELF_REGISTER') {
    setDraft(std)
    setSource(src)
    setPath('review')
  }

  if (path === 'review' && draft) {
    return (
      <ResumeReview
        std={draft}
        setStd={setDraft as (s: Std) => void}
        source={source}
        onBack={() => setPath(source === 'IMPORT' ? 'upload' : 'builder')}
        onRegistered={onBack}
      />
    )
  }

  if (path === 'picker') {
    return (
      <div className="max-w-[860px]">
        <h2 className="text-[20px] font-bold tracking-tight">Two paths, one Saramin standard model</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Upload an existing CV or fill it in by hand — either path normalises to the same standard resume. Nothing is written to the
          resume master until you register on the review screen.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {([
            ['① Upload CV', 'Upload CV (PDF / DOC / DOCX)', 'AI parses and converts the file into the Saramin standard format. Carries the original PDF alongside the generated one.', 'upload'],
            ['② Fill by hand', 'CV Builder wizard', 'Step-by-step form for basics · headline & body · tags, ending on the same standard resume. No original file.', 'builder'],
          ] as const).map(([badge, title, desc, target]) => (
            <div key={target} className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-soft text-[15px]">{target === 'upload' ? '' : ''}</span>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">{badge}</span>
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-ink">{title}</p>
              <p className="mt-1 flex-1 text-[11.5px] leading-relaxed text-muted">{desc}</p>
              <button onClick={() => setPath(target)} className="mt-3 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Use this path</button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-faint">
          The route decides only two things: <b>source</b> (Upload → IMPORT, Builder → SELF_REGISTER) and which CV documents exist.
          The review screen, the stored standard JSON and the register action are identical for both.
        </p>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setPath('picker')} className="mb-3 text-[11.5px] font-medium text-muted hover:text-brand">← Choose another path</button>
      {path === 'upload'
        ? <UploadRoute onContinue={() => handoff(importedStd(), 'IMPORT')} />
        : <BuilderRoute onContinue={(f) => handoff(builderStd(f), 'SELF_REGISTER')} />}
    </div>
  )
}
