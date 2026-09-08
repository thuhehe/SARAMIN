import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Camera, Lightbulb, MapPin } from 'lucide-react'
import { BUILD_MODULES } from '@/data/buildModules'
import { GUIDES } from '@/data/guides'
import type { GuideShot, GuideTask, ModuleGuide as Guide } from '@/data/guides'
import { featurePath, featureSlug } from '@/data/featureSlug'
import { CopySectionLink, useHashTarget } from '@/components/ShareLink'
import { LightboxProvider, useLightbox } from '@/components/Lightbox'
import type { BuildModule } from '@/data/buildModules'

/*
 * ── Module user guide ────────────────────────────────────────────────────────
 *
 * The module page answers WHY (the requirement). This page answers HOW: the key
 * steps an operator takes on the real admin screens, each with a screenshot of
 * the console as built. Data lives in src/data/guides/<module>.ts; this file
 * only lays it out.
 *
 * Deliberately sparse. A reader who has used a web admin before does not need
 * "click Save" spelled out — they need the field that decides the outcome, the
 * order that matters, and the one fact that saves a support call.
 */

/* **bold** marks a field or button exactly as it reads on screen; *italic* a
   value or an example. Same convention as the requirement prose. */
function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {p.slice(2, -2)}
            </strong>
          )
        }
        if (p.startsWith('*') && p.endsWith('*')) {
          return (
            <em key={i} className="text-ink/80">
              {p.slice(1, -1)}
            </em>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

function Shot({ s }: { s: GuideShot }) {
  const lightbox = useLightbox()
  if (!s.src) {
    return (
      <figure className="mt-4">
        <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-line bg-canvas/50 px-5 py-6">
          <Camera className="h-5 w-5 shrink-0 text-faint" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted">Screenshot pending</p>
            {s.pending && <p className="mt-0.5 text-[12px] leading-relaxed text-faint">{s.pending}</p>}
          </div>
        </div>
        <figcaption className="mt-1.5 text-[12px] text-muted">{s.caption}</figcaption>
      </figure>
    )
  }
  /* Opens full size in a lightbox ON this page — the screens are 1400px wide and
     the column is narrower, so the small text in a table is only legible at full
     size, but a new tab would cost the reader their place in the guide. */
  const src = s.src
  return (
    <figure className="mt-4">
      <button
        type="button"
        onClick={() => lightbox?.open(src)}
        title="Open full size"
        className="block w-full cursor-zoom-in"
      >
        <img
          src={src}
          alt={s.caption}
          loading="lazy"
          className="w-full rounded-xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md"
        />
      </button>
      <figcaption className="mt-1.5 text-[12px] text-muted">{s.caption}</figcaption>
    </figure>
  )
}

function Task({ m, t, n }: { m: BuildModule; t: GuideTask; n: number }) {
  const spec = t.spec ? m.features.find((f) => featureSlug(f) === t.spec) : undefined
  return (
    <section id={t.id} className="group/task mt-12 scroll-mt-6">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">
          {n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-[18px] font-semibold leading-tight tracking-tight">
            {t.title}
            <CopySectionLink hash={t.id} className="opacity-0 transition-opacity group-hover/task:opacity-100" />
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-faint" />
            <span className="truncate">{t.where}</span>
          </p>
          {t.outcome && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
              <Inline t={t.outcome} />
            </p>
          )}
        </div>
      </header>

      <ol className="mt-4 space-y-2 pl-10">
        {t.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-line bg-surface font-mono text-[10px] font-semibold text-muted">
              {i + 1}
            </span>
            <p className="text-[13.5px] leading-relaxed text-ink/90">
              <Inline t={s} />
            </p>
          </li>
        ))}
      </ol>

      <div className="pl-10">
        {t.shots?.map((s, i) => <Shot key={i} s={s} />)}

        {t.tips && t.tips.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-800">
              <Lightbulb className="h-3.5 w-3.5" /> Good to know
            </p>
            <ul className="mt-1.5 space-y-1">
              {t.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-amber-950/90">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  <span>
                    <Inline t={tip} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {spec && (
          <Link
            to={featurePath(m, spec)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-brand"
          >
            Why it works this way — <span className="font-medium">{spec.name}</span> requirement
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </section>
  )
}

function BuiltFrom({ g }: { g: Guide }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-faint">
      <span className="font-semibold uppercase tracking-widest">Built from</span>
      {g.builtFrom.map((s, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="font-mono text-muted">
            {s.repo} · {s.branch} @ {s.commit}
          </span>
          <span>· {s.date}</span>
          <span>— {s.note}</span>
        </span>
      ))}
    </div>
  )
}

export function ModuleGuide() {
  const { moduleId } = useParams<{ moduleId: string }>()
  // before the early returns below — a hook cannot sit after a conditional exit
  useHashTarget()
  const m = BUILD_MODULES.find((x) => x.id === moduleId)
  const g = moduleId ? GUIDES[moduleId] : undefined
  if (!m) return <Navigate to="/" replace />
  if (!g) return <Navigate to={`/m/${m.id}`} replace />

  const pendingShots = g.tasks.reduce((n, t) => n + (t.shots?.filter((s) => !s.src).length ?? 0), 0)
  /* Every picture on the page, in reading order — this is what the lightbox
     arrows walk through, so a shot added to a task joins it for free. */
  const shots = g.tasks.flatMap(
    (t) => t.shots?.flatMap((s) => (s.src ? [{ src: s.src, caption: s.caption }] : [])) ?? [],
  )

  return (
    <LightboxProvider items={shots}>
      <div className="mx-auto w-full max-w-[1100px] px-6 pb-16 sm:px-8">
        <Link
          to={`/m/${m.id}`}
          className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-brand"
        >
          <ArrowLeft className="h-3 w-3" /> {m.title} · requirement
        </Link>

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-brand">Module · User guide</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-bold tracking-tight">{m.title}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas/50 px-2.5 py-0.5 text-[11.5px] text-muted">
            <BookOpen className="h-3.5 w-3.5" /> How to use it · {g.tasks.length} tasks
          </span>
        </div>
        <p className="mt-3 max-w-[760px] text-[14px] leading-relaxed text-ink/85">
          <Inline t={g.intro} />
        </p>
        <BuiltFrom g={g} />
        {pendingShots > 0 && (
          <p className="mt-2 text-[11.5px] text-faint">
            {pendingShots} screenshot{pendingShots === 1 ? '' : 's'} still to capture — marked on the page.
          </p>
        )}

        <div className="mt-7 grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
          {g.before && g.before.length > 0 && (
            <section className="rounded-xl border border-line bg-surface px-5 py-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">Before you start</h2>
              <ul className="mt-2 space-y-1.5">
                {g.before.map((b, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/85">
                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                    <span>
                      <Inline t={b} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <nav className="rounded-xl border border-line bg-canvas/40 px-5 py-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">On this page</h2>
            <ol className="mt-2 space-y-1">
              {g.tasks.map((t, i) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="flex gap-2 text-[12.5px] text-ink/80 hover:text-brand">
                    <span className="w-4 shrink-0 font-mono text-[11px] text-faint">{i + 1}</span>
                    <span>{t.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {g.tasks.map((t, i) => (
          <Task key={t.id} m={m} t={t} n={i + 1} />
        ))}

        <div className="mt-14 flex items-stretch justify-between gap-3 border-t border-line pt-5">
          <Link
            to={`/m/${m.id}`}
            className="group flex flex-col items-start rounded-xl border border-line bg-surface px-4 py-2.5 transition-colors hover:border-brand"
          >
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <ArrowLeft className="h-3 w-3" /> The rules behind these screens
            </span>
            <span className="text-[13px] font-medium group-hover:text-brand">{m.title} · requirement</span>
          </Link>
        </div>
      </div>
    </LightboxProvider>
  )
}
