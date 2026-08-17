import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink, ImageIcon } from 'lucide-react'
import { BUILD_MODULES, SITE_META } from '@/data/buildModules'
import type { BuildFeature, BulletItem, FeatureDetail, KeyPoint, ReqTable, Requirement } from '@/data/buildModules'
import type { FieldGroup, BackendSpec } from '@/data/types'
import { resolveScreen, mockupHref } from '@/pages/screenRegistry'
import { CopySectionLink, slugify, useHashTarget } from '@/components/ShareLink'
import { cn } from '@/lib/utils'

/* Emphasis inside spec prose. The data is plain strings, so **double asterisks**
   mark the words that carry the rule — bold reads as emphasis without SHOUTING,
   which is hard to scan and reads as anger in a document people work from. */
function Rich({ t }: { t: string }) {
  if (!t.includes('**')) return <>{t}</>
  return (
    <>
      {t.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <b key={i} className="font-semibold text-ink">{part.slice(2, -2)}</b>
          : <span key={i}>{part}</span>,
      )}
    </>
  )
}

/* ── Requirements ─────────────────────────────────────────────────────────────
   A requirement renders either as one bullet (plain string) or as a labelled
   card with an optional table / sub-points. Tables are the point: a rule set with
   more than three entries is far faster to read as rows than as a paragraph. */
function ReqTableView({ t, dense }: { t: ReqTable; dense?: boolean }) {
  const tmpl = `minmax(120px, 0.9fr) ${t.cols.slice(1).map(() => '1fr').join(' ')}`
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-line">
      <div
        style={{ gridTemplateColumns: tmpl, minWidth: 480 }}
        className={cn('grid gap-x-4 bg-canvas/60 px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted', dense && 'text-[10px]')}
      >
        {t.cols.map((c, i) => <span key={i}>{c}</span>)}
      </div>
      {t.rows.map((r, ri) => (
        <div
          key={ri}
          style={{ gridTemplateColumns: tmpl, minWidth: 480 }}
          className={cn('grid gap-x-4 border-t border-line-soft px-3 py-1.5', dense ? 'text-[11.5px]' : 'text-[12.5px]')}
        >
          {r.map((cell, ci) => (
            <span key={ci} className={ci === 0 ? 'font-medium text-ink' : 'text-ink/75'}><Rich t={cell} /></span>
          ))}
        </div>
      ))}
    </div>
  )
}

/* Sub-points.

   These are dense: two to four sentences each, a dozen of them. Run together
   under identical dots they read as one grey mass, which is the actual "too
   long" problem — not the word count. So each point is set as a small
   HEADING + BODY pair:

     3   ALIAS RULES
         an alias is a way people WRITE a skill, never a different thing…

   The heading is the short phrase authors already write before a "—" or ":",
   lifted onto its own line. That makes the list skimmable on headings alone,
   and gives the body a clean left edge to read down. A hairline separates the
   rows, the number gives position, and long lists keep the tail one click
   away. Points with no such lead-in simply render as one line of text. */
const LEAD_IN = /^([^—:]{2,44}?)(\s*—\s+|:\s+)([\s\S]+)$/

/* Sub-points render as a TABLE, same shell as ReqTableView so a requirement
   reads as one document rather than a table plus a loose list. The lead-in
   becomes the left column — that column is the index you skim; the right column
   is the detail you read only when the left one is relevant. Points with no
   lead-in span the full width. Everything is shown: no truncation. */
function ReqBullets({ items, dense }: { items: string[]; dense?: boolean }) {
  const tmpl = 'minmax(150px, 0.85fr) 1fr'
  return (
    <div className="mt-2.5 overflow-hidden rounded-lg border border-line">
      <div
        style={{ gridTemplateColumns: tmpl, minWidth: 480 }}
        className={cn('grid gap-x-4 bg-canvas/60 px-3 py-1.5 font-semibold uppercase tracking-wide text-muted', dense ? 'text-[10px]' : 'text-[10.5px]')}
      >
        <span>Rule</span>
        <span>What it means</span>
      </div>
      {items.map((t, j) => {
        const m = t.includes('**') ? null : t.match(LEAD_IN)
        return (
          <div
            key={j}
            style={m ? { gridTemplateColumns: tmpl, minWidth: 480 } : undefined}
            className={cn(
              'gap-x-4 border-t border-line-soft px-3 py-2 leading-relaxed',
              m ? 'grid' : 'block',
              dense ? 'text-[11.5px]' : 'text-[12.5px]',
            )}
          >
            {m ? (
              <>
                <span className="font-medium text-ink">{m[1]}</span>
                <span className="min-w-0 text-ink/75"><Rich t={m[3]} /></span>
              </>
            ) : (
              <span className="text-ink/75"><Rich t={t} /></span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* One requirement card. Label · lead sentence · table · sub-points · warning —
   all of it visible, nothing truncated. Prose is capped at a readable measure
   instead of running the full window width. */
function ReqCard({ r, dense }: { r: Exclude<Requirement, string>; dense?: boolean }) {
  const measure = 'max-w-[80ch]'
  /* Addressable on its own: the id comes from the label so a shared link keeps
     pointing at the right block when the list is reordered. scroll-mt keeps the
     card clear of the top edge when a link lands on it. */
  const id = slugify(r.label)
  return (
    <div
      id={id}
      className={cn(
        'group/req scroll-mt-6 rounded-xl border border-line bg-surface transition-shadow',
        dense ? 'px-3 py-2.5' : 'px-4 py-3.5',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('font-semibold leading-snug text-ink', dense ? 'text-[12px]' : 'text-[13.5px]')}>
          <Rich t={r.label} />
        </p>
        <CopySectionLink hash={id} className={dense ? 'mt-px' : 'mt-0.5'} />
      </div>
      {r.text && (
        <p className={cn('mt-1.5 leading-relaxed', measure, dense ? 'text-[12px] text-muted' : 'text-[13px] text-ink/75')}>
          <Rich t={r.text} />
        </p>
      )}
      {r.table && <ReqTableView t={r.table} dense={dense} />}
      {r.items && <ReqBullets items={r.items} dense={dense} />}
      {r.warn && (
        <p className={cn('mt-2.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 leading-relaxed text-amber-800', measure, dense ? 'text-[11.5px]' : 'text-[12px]')}>
          ⚠️ <Rich t={r.warn} />
        </p>
      )}
    </div>
  )
}

function Requirements({ items, dense }: { items: Requirement[]; dense?: boolean }) {
  return (
    <div className={dense ? 'space-y-2' : 'space-y-2.5'}>
      {items.map((r, i) =>
        typeof r === 'string' ? (
          <div key={i} className={cn('flex gap-2 leading-relaxed max-w-[78ch]', dense ? 'text-[12.5px] text-muted' : 'text-[13.5px] text-ink/80')}>
            <span className={cn('mt-2 h-1 w-1 shrink-0 rounded-full', dense ? 'bg-faint' : 'bg-brand')} />
            <Rich t={r} />
          </div>
        ) : (
          <ReqCard key={i} r={r} dense={dense} />
        ),
      )}
    </div>
  )
}

function SiteTag({ site }: { site: BuildFeature['site'] }) {
  return (
    <span className={cn('rounded border px-1 py-0.5 font-mono text-[10px] font-medium', SITE_META[site].pill)}>
      {SITE_META[site].tag}
    </span>
  )
}

/* No scope pills anywhere: BE and FE carried no information (every feature needs
   both), and the UI pill duplicated what the header already said. Scope still lives
   on the data — it is just not rendered on these pages. */

/* ── Rich per-feature detail renderers ────────────────────────────────────── */
/* Every feature-detail section is one CARD with a titled header — the same shape as
   the requirement blocks, so a long spec reads as a stack of labelled groups
   instead of an undifferentiated wall of headings and text. */
function SpecBlock({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-soft bg-canvas/40 px-4 py-2">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-muted">{title}</h2>
        {note && <span className="text-[11px] text-faint">{note}</span>}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  )
}

/** The leaf list — plain bullets, used on its own or inside a group. */
function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/80">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
          <Rich t={t} />
        </li>
      ))}
    </ul>
  )
}

/** Bullets that may be grouped under headings. A flat list stays flat. */
function Bullets({ items }: { items: BulletItem[] }) {
  const groups = items.filter((i): i is { group: string; items: string[] } => typeof i !== 'string')
  const loose = items.filter((i): i is string => typeof i === 'string')
  if (!groups.length) return <BulletList items={loose} />
  return (
    <div className="space-y-4">
      {loose.length > 0 && <BulletList items={loose} />}
      {groups.map((g, i) => (
        <div key={i}>
          <p className="mb-1.5 border-b border-line-soft pb-1 text-[12px] font-bold uppercase tracking-wide text-ink/60">{g.group}</p>
          <BulletList items={g.items} />
        </div>
      ))}
    </div>
  )
}

/** Numbered leaf list. Numbering restarts inside each group — a reader refers to
    "step 2 of Sending", not to "step 11 of eighteen". */
function OrderedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink/80">
          <span className="mt-0.5 shrink-0 font-mono text-[11px] text-faint">{i + 1}.</span>
          <Rich t={t} />
        </li>
      ))}
    </ol>
  )
}

function Ordered({ items }: { items: BulletItem[] }) {
  const groups = items.filter((i): i is { group: string; items: string[] } => typeof i !== 'string')
  const loose = items.filter((i): i is string => typeof i === 'string')
  if (!groups.length) return <OrderedList items={loose} />
  return (
    <div className="space-y-4">
      {loose.length > 0 && <OrderedList items={loose} />}
      {groups.map((g, i) => (
        <div key={i}>
          <p className="mb-1.5 border-b border-line-soft pb-1 text-[12px] font-bold uppercase tracking-wide text-ink/60">{g.group}</p>
          <OrderedList items={g.items} />
        </div>
      ))}
    </div>
  )
}

function FieldTable({ groups }: { groups: FieldGroup[] }) {
  return (
    <div className="space-y-4">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.group && <p className="mb-1.5 text-[12px] font-semibold text-ink/70">{g.group}</p>}
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-[12.5px]">
              <tbody>
                {g.items.map((f, fi) => (
                  <tr key={fi} className="border-b border-line-soft last:border-0">
                    <td className="w-[34%] px-3 py-2 align-top font-mono text-[11.5px] text-ink/80">
                      <Rich t={f.name} />
                      {f.required && <span className="text-rose-500"> *</span>}
                    </td>
                    <td className="w-[24%] px-3 py-2 align-top text-muted">{f.type}</td>
                    <td className="px-3 py-2 align-top text-muted"><Rich t={f.notes ?? ''} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

function BackendBlock({ b }: { b: BackendSpec }) {
  return (
    <div className="space-y-3">
      {b.dataModel && <FieldTable groups={[{ group: 'Data model', items: b.dataModel }]} />}
      {b.endpoints && (
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-ink/70">Endpoints</p>
          <div className="space-y-1">
            {b.endpoints.map((e, i) => (
              <code key={i} className="block rounded-md bg-canvas/70 px-2.5 py-1 font-mono text-[11.5px] text-ink/80">
                {e}
              </code>
            ))}
          </div>
        </div>
      )}
      {b.integrations && (
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-ink/70">Integrations</p>
          <div className="flex flex-wrap gap-1.5">
            {b.integrations.map((x, i) => (
              <span key={i} className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] text-muted">
                {x}
              </span>
            ))}
          </div>
        </div>
      )}
      {b.notes && <p className="text-[12.5px] leading-relaxed text-muted">{b.notes}</p>}
    </div>
  )
}

/* Client source documents, rendered FIRST — above the written requirement.
   A reader who wants the original should not have to scroll past our summary of it
   to find out one exists. Opens in a new tab; the browser decides whether to preview
   or download, which is why this is a plain link and not a forced `download`. */
function RefDocs({ docs }: { docs: NonNullable<FeatureDetail['refDocs']> }) {
  return (
    <SpecBlock title="Reference documents" note="Client source — the requirement below was written from these">
      <div className="space-y-2">
        {docs.map((doc) => (
          <a
            key={doc.href}
            href={doc.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-colors hover:border-brand/50 hover:bg-brand-soft/30"
          >
            <span className="mt-0.5 shrink-0 text-[15px]" aria-hidden>📎</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold text-brand underline-offset-2 group-hover:underline">
                {doc.label}
              </span>
              {doc.meta && <span className="mt-0.5 block text-[11.5px] text-faint">{doc.meta}</span>}
              {doc.note && <span className="mt-1 block text-[12.5px] leading-relaxed text-ink/70">{doc.note}</span>}
            </span>
            <span className="mt-0.5 shrink-0 text-[11.5px] font-medium text-brand">Open ↗</span>
          </a>
        ))}
      </div>
    </SpecBlock>
  )
}

/* One freeform spec section. Extracted so a section renders identically whether it
   is pinned early (under Overview) or left in the trailing group. */
function SectionBlock({ s }: { s: NonNullable<FeatureDetail['sections']>[number] }) {
  return (
    <SpecBlock title={s.heading}>
      {/* A section's lead may carry blank-line paragraph breaks, same as an overview. */}
      {s.text && (
        <div className="mb-2 space-y-2">
          {s.text.split('\n\n').map((para, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-ink/75"><Rich t={para.trim()} /></p>
          ))}
        </div>
      )}
      {s.table && <ReqTableView t={s.table} />}
      {s.items && <div className={cn(s.table && 'mt-3')}><Bullets items={s.items} /></div>}
      {s.warn && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] leading-relaxed text-amber-800">
          ⚠️ {s.warn}
        </p>
      )}
    </SpecBlock>
  )
}

/**
 * Key points — the few rules that decide the build, pulled out of a long document
 * so they cannot be scrolled past. Deliberately loud: numbered, on a coloured card,
 * directly under Overview. Everything here is ALSO stated in full further down;
 * this is a signpost, never the only place a rule lives.
 */
function KeyPoints({ items }: { items: KeyPoint[] }) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border-2 border-amber-300 bg-amber-50/70">
      <div className="border-b border-amber-200 bg-amber-100/60 px-4 py-2">
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-amber-900">
          ⚠ Điểm cốt lõi — đọc trước khi build
        </h2>
        <p className="text-[11px] font-medium italic tracking-wide text-amber-700/80">
          Key points — read before building
        </p>
      </div>
      <ol className="divide-y divide-amber-200/70">
        {items.map((t, i) => (
          <li key={i} className="flex gap-3 px-4 py-2.5">
            <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            {/* Bilingual points stack: Vietnamese leads, English sits underneath in
                muted italic. Running the two together on one line is what makes a
                bilingual document unreadable in BOTH languages. */}
            {typeof t === 'string' ? (
              <p className="text-[13px] font-medium leading-relaxed text-amber-950"><Rich t={t} /></p>
            ) : (
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-relaxed text-amber-950"><Rich t={t.vi} /></p>
                <p className="mt-0.5 text-[12.5px] italic leading-relaxed text-amber-800/70"><Rich t={t.en} /></p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

function FeatureDetailBlocks({ d, screenBlock }: { d: FeatureDetail; screenBlock?: React.ReactNode }) {
  /* A section marked `early` describes what the screen/document actually IS, so it
     belongs directly under Overview — above the field list, not below the backend
     contract. Everything else keeps its place in the trailing group. */
  const early = d.sections?.filter((s) => s.early) ?? []
  const rest = d.sections?.filter((s) => !s.early) ?? []
  return (
    <>
      {d.refDocs && <RefDocs docs={d.refDocs} />}
      {(d.description || d.userStory) && (
        <SpecBlock title="Overview">
          {/* A description may carry blank-line breaks; render them as real paragraphs
              so a long overview reads as prose instead of one dense block. */}
          {d.description && (
            <div className="space-y-2.5">
              {d.description.split('\n\n').map((para, i) => (
                <p key={i} className="text-[13.5px] leading-relaxed text-ink/80"><Rich t={para.trim()} /></p>
              ))}
            </div>
          )}
          {d.userStory && (
            <p className={cn('rounded-r-lg border-l-2 border-brand bg-brand-soft/50 px-3 py-2 text-[13px] italic text-ink/75', d.description && 'mt-3')}>
              {d.userStory}
            </p>
          )}
        </SpecBlock>
      )}
      {/* Key points sit as high as they can: their whole purpose is to be read
          before anything else, including the screen. The rules that govern the
          screen follow immediately — Key points are a signpost TO them, so putting
          the field list or the mockup in between breaks the thought. */}
      {d.keyPoints && d.keyPoints.length > 0 && <KeyPoints items={d.keyPoints} />}
      {d.requirements && (
        <SpecBlock title="Rules for this screen">
          <Requirements items={d.requirements} />
        </SpecBlock>
      )}
      {screenBlock}
      {early.map((s, i) => <SectionBlock key={`early-${i}`} s={s} />)}
      {d.uiFields && (
        <SpecBlock title="UI fields">
          <FieldTable groups={d.uiFields} />
        </SpecBlock>
      )}
      {d.behaviors && (
        <SpecBlock title="Behaviours">
          <Ordered items={d.behaviors} />
        </SpecBlock>
      )}
      {d.rules && (
        <SpecBlock title="Rules & validation">
          <Bullets items={d.rules} />
        </SpecBlock>
      )}
      {d.states && (
        <SpecBlock title="States">
          <div className="flex flex-wrap gap-1.5">
            {d.states.map((s, i) => (
              <span key={i} className="rounded-md border border-line bg-canvas/50 px-2 py-0.5 text-[11.5px] text-ink/70">
                {s}
              </span>
            ))}
          </div>
        </SpecBlock>
      )}
      {d.backend && (
        <SpecBlock title="Backend contract">
          <BackendBlock b={d.backend} />
        </SpecBlock>
      )}
      {d.acceptance && (
        <SpecBlock title="Acceptance criteria">
          <ul className="space-y-1.5">
            {d.acceptance.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/80">
                <span className="mt-0.5 shrink-0 text-emerald-500">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </SpecBlock>
      )}
      {rest.map((s, i) => <SectionBlock key={i} s={s} />)}
      {d.openQuestions && (
        <SpecBlock title="Open questions">
          <ul className="space-y-1.5">
            {d.openQuestions.map((t, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink/80">
                <span className="mt-px shrink-0 font-semibold text-amber-500">?</span>
                {t}
              </li>
            ))}
          </ul>
        </SpecBlock>
      )}
    </>
  )
}

/* ── Module view: goal / requirements + feature flow ──────────────────────── */
export function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>()
  // before the early return below — a hook cannot sit after a conditional exit
  useHashTarget()
  const m = BUILD_MODULES.find((x) => x.id === moduleId)
  if (!m) return <Navigate to="/" replace />

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-16 sm:px-8">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Module</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{m.title}</h1>
        <span className="rounded-full border border-line bg-canvas/50 px-2.5 py-0.5 text-[11.5px] text-muted">
          Owner · {m.owner}
        </span>
        <span className="text-[11.5px] text-faint">{m.features.length} features</span>
      </div>

      {/* Edge cases first — the awkward real-world shapes this module answers. Pinned
          above the requirements because it is what a client checks to see whether we
          understood their business before reading how we built for it. */}
      {m.edgeCases && m.edgeCases.length > 0 && (
        <section className="mt-7 overflow-hidden rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="border-b border-amber-200/70 px-4 py-2">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-amber-800">
              Edge cases covered · trường hợp đặc biệt đã xử lý
            </h2>
          </div>
          <ol className="divide-y divide-amber-200/60">
            {m.edgeCases.map((e, i) => (
              <li key={i} className="flex gap-3 px-4 py-3">
                <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-200/80 text-[11px] font-bold text-amber-900">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-amber-950">{e.label}</p>
                  {/* Blank lines are real paragraph breaks — a long edge case reads as
                      prose instead of one wall of amber text. */}
                  <div className="mt-0.5 space-y-1.5">
                    {e.text.split('\n\n').map((para, j) => (
                      <p key={j} className="text-[12.5px] leading-relaxed text-amber-900/85"><Rich t={para.trim()} /></p>
                    ))}
                  </div>
                  {e.warn && (
                    <p className="mt-2 rounded-md border border-amber-300 bg-amber-100/70 px-2.5 py-1.5 text-[12px] leading-relaxed text-amber-950">
                      ⚠️ {e.warn}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* what it delivers */}
      <section className="mt-7">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-faint mb-3">What it delivers</h2>
        <Requirements items={m.requirements} />
      </section>

      {/* The "Flow · features" list used to sit here. Removed: the sidebar already
          lists every feature in this module, so the section was a second copy of the
          same navigation. Feature pages are still routed at /m/:moduleId/:index. */}
    </div>
  )
}

/* ── Feature view: detail + related UI mockup ─────────────────────────────── */
export function FeatureDetail() {
  const { moduleId, featureIndex } = useParams<{ moduleId: string; featureIndex: string }>()
  // before the early returns below — a hook cannot sit after a conditional exit
  useHashTarget()
  const m = BUILD_MODULES.find((x) => x.id === moduleId)
  const idx = Number(featureIndex)
  const f = m && Number.isInteger(idx) ? m.features[idx] : undefined
  if (!m) return <Navigate to="/" replace />
  if (!f) return <Navigate to={`/m/${m.id}`} replace />

  const prev = idx > 0 ? { i: idx - 1, f: m.features[idx - 1] } : undefined
  const next = idx < m.features.length - 1 ? { i: idx + 1, f: m.features[idx + 1] } : undefined
  const screen = resolveScreen(f.mockup)
  const href = screen ? mockupHref(screen) : null

  /* The screen sits BELOW Overview (and below Key points), not above them: a reader
     who lands here needs to know what the screen is for before looking at it, and
     the key rules before either. This is NOT a second copy of the screen —
     resolveScreen returns the very component the mockup gallery renders, so a screen
     is only ever built in one place. The link opens it in that gallery. */
  const screenBlock = (
    <SpecBlock
      title="Screen UI"
      note={
        screen ? (
          <span className="flex items-center gap-3">
            {/* the route, as plain text — it was the only real information the
                fake browser chrome carried */}
            {screen.url && <span className="hidden font-mono text-[11px] text-faint sm:inline">{screen.url}</span>}
            {href && (
              <Link to={href} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:underline">
                Open in {screen.src === 'admin' ? 'Admin' : screen.src === 'co' ? 'Company' : 'Jobseeker'} mockups
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </span>
        ) : (
          'not wired yet'
        )
      }
    >
      {screen ? (
        /* No <Browser> frame here. The SpecBlock card is already a frame, so the
           chrome was a second border around the first plus a fake URL bar; the
           URL now sits in the block header. The gallery keeps its chrome, where
           it is the only frame. */
        <div className="max-h-[640px] overflow-y-auto scroll-thin">
          <screen.Comp />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-canvas/40 p-6 text-center">
          <ImageIcon className="mx-auto h-5 w-5 text-faint" />
          <p className="mt-2 text-[13px] text-muted">No screen mockup wired for this feature yet.</p>
        </div>
      )}
    </SpecBlock>
  )

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 pb-16 sm:px-8">
      {/* breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted">
        <Link to={`/m/${m.id}`} className="inline-flex items-center gap-1 hover:text-brand">
          <ArrowLeft className="h-3.5 w-3.5" /> {m.title}
        </Link>
        <ChevronRight className="h-3 w-3 text-faint" />
        <span className="text-ink/70">{f.name}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SiteTag site={f.site} />
        <h1 className="text-[24px] font-bold tracking-tight">{f.name}</h1>
      </div>


      {f.notes && (
        <div className="mt-5 rounded-xl border border-line bg-canvas/40 p-4">
          <p className="text-[12px] font-semibold text-ink/70 mb-1">Notes</p>
          <p className="text-[13px] leading-relaxed text-ink/80">{f.notes}</p>
        </div>
      )}

      {/* rich per-feature detail — the screen is handed in so it can be placed
          after Overview + Key points rather than before them. */}
      {f.detail ? <FeatureDetailBlocks d={f.detail} screenBlock={screenBlock} /> : screenBlock}

      {/* The "Module context" block used to repeat m.requirements at the foot of
          every feature page. Removed: the module page is where those rules live, and
          a copy on each of its features meant the same text was read (and reviewed)
          N times. The breadcrumb at the top links straight back to it. */}

      {/* prev / next within the module */}
      <div className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-5">
        {prev ? (
          <Link
            to={`/m/${m.id}/${prev.i}`}
            className="group flex max-w-[46%] flex-col items-start rounded-xl border border-line bg-surface px-4 py-2.5 transition-colors hover:border-brand"
          >
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <ArrowLeft className="h-3 w-3" /> Previous
            </span>
            <span className="truncate text-[13px] font-medium group-hover:text-brand">{prev.f.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/m/${m.id}/${next.i}`}
            className="group flex max-w-[46%] flex-col items-end rounded-xl border border-line bg-surface px-4 py-2.5 text-right transition-colors hover:border-brand"
          >
            <span className="flex items-center gap-1 text-[11px] text-muted">
              Next <ArrowRight className="h-3 w-3" />
            </span>
            <span className="truncate text-[13px] font-medium group-hover:text-brand">{next.f.name}</span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
