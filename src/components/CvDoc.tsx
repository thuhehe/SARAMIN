import { useEffect, useRef, useState } from 'react'
import { Heading2, List } from 'lucide-react'
import { cn } from '@/lib/utils'

/*
 * SARAMIN STANDARD — the ONE generated-CV template, and the small structure
 * vocabulary its free-text fields accept.
 *
 * The problem this settles: a CV can be laid out a thousand ways and we cannot
 * chase them. So we do not try. Everything — typed here, or parsed out of an
 * uploaded PDF — is normalised into ONE template with THREE block types, and
 * anything richer is dropped rather than approximated.
 *
 * THE CONSTRAINT THAT DECIDES THE REST — ROUND-TRIP. A CV we generate, run back
 * through our OWN upload parser, must return every field identical. Candidates
 * re-upload our PDF elsewhere, and a template our own parser cannot read is a
 * template no ATS can read either. That single test rules out the two-column
 * layouts, tables, text boxes and side-by-side headers that would otherwise be
 * argued about one at a time — including a photo with the name set BESIDE it,
 * which is why the header stacks instead.
 *
 * THREE BLOCKS, and nothing else:
 *
 *     paragraph      running text
 *     sub-heading    groups bullets inside one role
 *     bullet         one level, no nesting
 *
 * MARKERS ARE STORAGE, NEVER UI (decided 2026-08-22). They are stored as literal
 * "## " and "• " prefixes in plain text — no HTML, so nothing to sanitise on any
 * of the five surfaces that render a CV, and the value stays greppable and
 * diffable. But a jobseeker must never SEE a "##": the editor is a block list
 * where each row shows its type and renders like the finished document. Markdown
 * is a developer's convenience and this audience did not ask for it.
 *
 * WHY THERE IS NO INLINE BOLD. It was in an earlier draft and is now cut, because
 * a plain input cannot render half a line bold — keeping it meant either showing
 * "**40%**" to the candidate (the thing this file just decided against) or moving
 * to contenteditable, which is a large fragile dependency for one mark. What bold
 * was carrying is better carried elsewhere: technology names live in the
 * structured Skills field that search actually reads, and a metric reads fine
 * unbolded. Uploaded CVs lose their bold in the same pass that drops italic,
 * underline and colour.
 *
 * WHAT WE NORMALISE AWAY, on purpose: bold, italic and underline (in real CVs
 * italic/underline only ever mark sub-headings, which is now its own block),
 * numbered lists (→ bullets), nested bullets (→ flattened), tables and columns
 * (→ linear text), fonts, sizes and colours (→ the template's).
 */

/** The block markers, as one exported contract — the editor, the renderer and the
 *  extraction normaliser must not disagree about what a line means. */
export const CV_MARKS = { heading: '## ', bullet: '• ' } as const

export type BlockKind = 'p' | 'h' | 'li'
export type CvBlock = { kind: BlockKind; text: string }

const HEADING = /^\s*##\s+(.*)$/
const BULLET = /^\s*[•‣▪●○]\s+(.*)$/
/* What an EXTRACTOR sees, which is messier than what our editor writes: any glyph
   a PDF might use for a bullet, plus numbered lists we fold into bullets because
   the template has one list type. */
const ANY_BULLET = /^\s*(?:[•‣▪●○∙·*+]|[-–—]|\d+[.)])\s+(.*)$/

/** Stored text → blocks. The editor never parses anything else. */
export function parseBlocks(value: string): CvBlock[] {
  return value.split('\n').filter((l) => l.trim()).map((line) => {
    const h = HEADING.exec(line)
    if (h) return { kind: 'h' as const, text: h[1].trim() }
    const b = BULLET.exec(line)
    if (b) return { kind: 'li' as const, text: b[1].trim() }
    return { kind: 'p' as const, text: line.trim() }
  })
}

/** Blocks → stored text. The ONLY place a marker is ever written. */
export function serializeBlocks(blocks: CvBlock[]): string {
  return blocks
    .filter((b) => b.text.trim())
    .map((b) => (b.kind === 'h' ? CV_MARKS.heading : b.kind === 'li' ? CV_MARKS.bullet : '') + b.text.trim())
    .join('\n')
}

/**
 * PDF → the three blocks. The rule that is cheap to state now and expensive to
 * discover later: **a line that follows a bullet and does not itself start with a
 * bullet glyph is a CONTINUATION**, not a new bullet. A long bullet wraps across
 * three lines in the source PDF, and a naive line-per-bullet parser shatters it
 * into three, two of which begin mid-sentence.
 */
export function normalizeCvText(raw: string): string {
  const out: string[] = []
  for (const line of raw.split('\n')) {
    /* Character formatting is dropped here rather than at render time, so what is
       STORED is already only what the template can show. */
    const t = line.replace(/\*\*|__|\*|_/g, '').trim()
    if (!t) { out.push(''); continue }
    const b = ANY_BULLET.exec(t)
    if (b) { out.push(CV_MARKS.bullet + b[1].trim()); continue }
    /* not a bullet — join it onto the open bullet or paragraph above, unless the
       previous line was blank (a real new block) or a heading (which never wraps
       into its body). */
    const prev = out[out.length - 1]
    if (prev && !HEADING.test(prev)) { out[out.length - 1] = `${prev} ${t}`; continue }
    out.push(t)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Renders the three blocks. The template decides how each one LOOKS — that is the
 * whole trade: the candidate chooses structure, we choose style, and fifty CVs in
 * a recruiter's morning look like fifty CVs rather than fifty posters.
 */
export function CvRichText({ value, className }: { value: string; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      {parseBlocks(value).map((b, i) =>
        b.kind === 'h' ? (
          <p key={i} className="pt-1.5 text-[11.5px] font-semibold text-ink/80">{b.text}</p>
        ) : b.kind === 'li' ? (
          <p key={i} className="flex gap-1.5 text-[11.5px] leading-relaxed text-ink/85">
            <span className="shrink-0 text-faint">•</span>
            <span className="min-w-0">{b.text}</span>
          </p>
        ) : (
          <p key={i} className="text-[11.5px] leading-relaxed text-ink/85">{b.text}</p>
        ),
      )}
    </div>
  )
}

/**
 * THE EDITOR — one field, one toolbar, two buttons. The Slack composer model.
 *
 * Three shapes were tried and two were rejected by review, which is worth
 * recording so they are not proposed again:
 *
 *   1. A markdown textarea — rejected: a jobseeker was shown raw "## ".
 *   2. A list of rows, each with its own type picker — rejected: a control per
 *      line is visual noise, and the thing being written stopped looking like
 *      the paragraph it is.
 *   3. THIS — one continuous field, formatting applied to the line the caret is
 *      on, rendered the way it will print.
 *
 * Shape 3 needs contenteditable, which is a real cost and was resisted twice
 * above. What makes it affordable here is how little it has to do: TWO block
 * types and no inline marks at all, so there is no selection-spanning bold, no
 * nested list, and no paste-fidelity question — paste is forced to plain text.
 * The DOM is kept to a flat list of block divs, each carrying data-k, and is
 * serialised straight back to the same "## " / "• " plain text everything else
 * in this file already speaks. Storage never learns that the editor changed.
 */
const KIND_LABEL: Record<BlockKind, string> = { p: 'Đoạn văn', h: 'Tiêu đề nhỏ', li: 'Gạch đầu dòng' }

function makeBlock(kind: BlockKind, text: string): HTMLDivElement {
  const d = document.createElement('div')
  d.dataset.k = kind
  if (text) d.textContent = text
  else d.appendChild(document.createElement('br'))
  return d
}

export function CvComposer({ value, onChange, minRows = 6 }: { value: string; onChange: (v: string) => void; minRows?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  /* The last value WE emitted. A contenteditable re-rendered from props on every
     keystroke loses the caret, so the DOM is repainted only when the value
     arrived from somewhere else. */
  const mine = useRef<string | null>(null)
  const [active, setActive] = useState<BlockKind>('p')

  useEffect(() => {
    const el = ref.current
    if (!el || value === mine.current) return
    el.replaceChildren()
    const bs = parseBlocks(value)
    ;(bs.length ? bs : [{ kind: 'p' as const, text: '' }]).forEach((b) => el.appendChild(makeBlock(b.kind, b.text)))
  }, [value])

  /** The block div the caret sits in — a direct child of the container. */
  const caretBlock = (): HTMLElement | null => {
    const el = ref.current
    const sel = window.getSelection()
    if (!el || !sel?.anchorNode || !el.contains(sel.anchorNode)) return null
    let n: Node | null = sel.anchorNode
    while (n && n.parentNode !== el) n = n.parentNode
    return (n as HTMLElement) ?? null
  }

  const emit = () => {
    const el = ref.current
    if (!el) return
    /* Anything the browser invented — a stray text node from a paste, a nested
       div — is folded back into the flat block list before it is read. */
    const blocks: CvBlock[] = [...el.children].map((c) => ({
      kind: ((c as HTMLElement).dataset.k as BlockKind) || 'p',
      text: (c.textContent ?? '').trim(),
    }))
    const out = serializeBlocks(blocks)
    mine.current = out
    onChange(out)
  }

  /** Toggle the caret's line (or every line the selection touches) to `kind`. */
  const apply = (kind: BlockKind) => {
    const el = ref.current
    const sel = window.getSelection()
    if (!el) return
    let targets: HTMLElement[] = []
    if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0)
      targets = [...el.children].filter((c) => r.intersectsNode(c)) as HTMLElement[]
    }
    const b = caretBlock()
    if (!targets.length && b) targets = [b]
    if (!targets.length) return
    /* Pressing the button a second time returns the line to a paragraph, so the
       two buttons are toggles rather than a one-way trip. */
    const allSame = targets.every((t) => t.dataset.k === kind)
    targets.forEach((t) => { t.dataset.k = allSame ? 'p' : kind })
    setActive(allSame ? 'p' : kind)
    el.focus()
    emit()
  }

  /* Enter behaviour, copied from every list editor people already know:
     a heading never continues into another heading, and Enter on an EMPTY
     bullet leaves the list instead of adding a blank one. */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey) return
    const b = caretBlock()
    if (!b) return
    if (b.dataset.k === 'li' && !(b.textContent ?? '').trim()) {
      e.preventDefault()
      b.dataset.k = 'p'
      setActive('p')
      emit()
      return
    }
    if (b.dataset.k === 'h') {
      requestAnimationFrame(() => {
        const n = caretBlock()
        if (n && n !== b) { n.dataset.k = 'p'; setActive('p'); emit() }
      })
    }
  }

  /* Paste is forced to PLAIN TEXT — the one place a contenteditable normally
     swallows a document's worth of foreign markup. A multi-line paste is run
     through the same normaliser an uploaded PDF goes through, so pasting a CV
     out of Word and pasting one out of our own parser land identically. */
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const el = ref.current
    const text = normalizeCvText(e.clipboardData.getData('text/plain'))
    if (!el || !text) return
    const b = caretBlock()
    const frag = document.createDocumentFragment()
    parseBlocks(text).forEach((x) => frag.appendChild(makeBlock(x.kind, x.text)))
    if (b) b.replaceWith(frag)
    else el.appendChild(frag)
    emit()
  }

  useEffect(() => {
    const onSel = () => { const b = caretBlock(); if (b) setActive((b.dataset.k as BlockKind) || 'p') }
    document.addEventListener('selectionchange', onSel)
    return () => document.removeEventListener('selectionchange', onSel)
  }, [])

  /* Real toolbar ICONS, from the same lucide set the rest of the app uses. A
     literal "•" as the list button was a bullet, not a picture of a list — every
     editor a candidate has met (Slack, Docs, Notion) draws lines-with-dots, and
     borrowing that shape is free recognition. */
  const Tool = ({ kind, glyph }: { kind: BlockKind; glyph: React.ReactNode }) => (
    <button
      type="button"
      title={KIND_LABEL[kind]}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => apply(kind)}
      className={cn(
        'grid h-7 w-7 place-items-center rounded',
        active === kind ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-canvas hover:text-ink',
      )}
    >{glyph}</button>
  )

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface focus-within:border-brand">
      {/* The whole toolbar. Two buttons is not a reduced version of a rich-text
          bar — it is the complete vocabulary, which is why nothing is greyed. */}
      <div className="flex items-center gap-0.5 border-b border-line-soft bg-canvas/40 px-1.5 py-1">
        <Tool kind="h" glyph={<Heading2 size={15} strokeWidth={2} />} />
        <Tool kind="li" glyph={<List size={15} strokeWidth={2} />} />
        <span className="ml-auto pr-0.5 text-[9.5px] text-faint">Tiêu đề nhỏ · Gạch đầu dòng</span>
      </div>
      <style>{`
        .cv-composer [data-k]{ padding:1px 0; }
        .cv-composer [data-k="h"]{ font-weight:600; color:var(--color-ink); margin-top:6px; }
        .cv-composer [data-k="li"]{ padding-left:15px; position:relative; }
        .cv-composer [data-k="li"]::before{ content:"\\2022"; position:absolute; left:3px; color:var(--color-faint); }
        .cv-composer:empty::before, .cv-composer [data-k]:only-child:has(br:only-child)::after{
          content:attr(data-ph); color:var(--color-faint);
        }
      `}</style>
      <div
        ref={ref}
        className="cv-composer w-full px-2.5 py-2 text-[11.5px] leading-relaxed text-ink/85 outline-none"
        style={{ minHeight: minRows * 20 }}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
    </div>
  )
}

/* ── the document itself ──────────────────────────────────────────────────── */

export type CvRole = { title: string; company: string; place?: string; from: string; to: string; body: string }
/* `body` on a school is the ACHIEVEMENTS list — scholarships, thesis,
   competitions. It takes the same two block types as a role's description,
   because it is the same kind of content and a second vocabulary for it would
   be a second thing to learn and a second thing to render. */
export type CvSchool = { school: string; degree: string; major?: string; from: string; to: string; body?: string }
/* An optional-section entry: a title line, an optional meta line, and the same
   block body. Projects, awards and activities are all this shape — which is why
   they share one renderer instead of three. */
export type CvEntry = { title: string; meta?: string; body?: string }

export type CvData = {
  name: string; headline: string; email: string; phone: string; location: string
  photo?: boolean
  summary?: string
  roles: CvRole[]
  schools: CvSchool[]
  skills: string[]
  extras?: { heading: string; entries: CvEntry[] }[]
}

/** One section heading, in the one style the template has for them. */
function Head({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 border-b border-line pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink/70">
      {children}
    </p>
  )
}

/**
 * SARAMIN STANDARD, rendered. One column, fixed section order, no theme and no
 * candidate-chosen layout — see the file header for why.
 *
 * `frame` draws it as a sheet of paper (the generated-PDF preview). Without it
 * the same markup drops into a panel on My CVs or the employer's viewer, so the
 * document is defined once and never re-implemented per surface.
 */
export function SaraminCvDoc({ cv, frame }: { cv: CvData; frame?: boolean }) {
  return (
    <div className={cn(frame && 'rounded-lg border border-line bg-surface p-6 shadow-sm')}>
      {/* HEADER — stacked, never a text column beside the photo. A name set to the
          RIGHT of an image is the two-column header the round-trip test forbids:
          parsers read it out of order, and ours has to read our own document. */}
      {cv.photo && <div className="mb-2.5 h-14 w-14 rounded-md bg-canvas ring-1 ring-line" />}
      <p className="text-[17px] font-bold leading-tight text-ink">{cv.name}</p>
      <p className="text-[12px] font-medium text-ink/75">{cv.headline}</p>
      <p className="mt-1 text-[11px] text-muted">{cv.email} · {cv.phone} · {cv.location}</p>

      {cv.summary && (
        <div className="mt-5">
          <Head>Tóm tắt</Head>
          <CvRichText value={cv.summary} />
        </div>
      )}

      {/* EXPERIENCE — the section the whole template is arranged around, and the
          only one whose body takes the four marks. */}
      <div className="mt-5">
        <Head>Kinh nghiệm làm việc</Head>
        <div className="space-y-3.5">
          {cv.roles.map((r) => (
            <div key={r.company + r.title}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-[12.5px] font-bold text-ink">{r.title}</p>
                <p className="shrink-0 text-[11px] text-muted">{r.from} – {r.to}</p>
              </div>
              <p className="mb-1 text-[11.5px] text-ink/75">{r.company}{r.place && ` · ${r.place}`}</p>
              <CvRichText value={r.body} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Head>Học vấn</Head>
        <div className="space-y-2">
          {cv.schools.map((s) => (
            <div key={s.school}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <div>
                  <p className="text-[12px] font-semibold text-ink">{s.school}</p>
                  <p className="text-[11.5px] text-ink/75">{s.degree}{s.major && ` · ${s.major}`}</p>
                </div>
                <p className="shrink-0 text-[11px] text-muted">{s.from} – {s.to}</p>
              </div>
              {s.body && <CvRichText value={s.body} className="mt-0.5" />}
            </div>
          ))}
        </div>
      </div>

      {/* SKILLS — from the taxonomy, so they render as uniform chips rather than
          whatever the candidate typed. This is also why inline bold on tech names
          inside a description is a nice-to-have and not the mechanism: the
          structured field is what search and matching actually read. */}
      <div className="mt-5">
        <Head>Kỹ năng</Head>
        <div className="flex flex-wrap gap-1.5">
          {cv.skills.map((s) => (
            <span key={s} className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[11px] text-ink/80">{s}</span>
          ))}
        </div>
      </div>

      {/* The optional sections, in the FIXED order the spec already lists them —
          candidates cannot reorder, which is the consistency half of the trade. */}
      {/* Projects, awards, activities — one shape, one renderer. Each entry's body
          runs through CvRichText exactly like a role's, so a candidate who groups
          a project's work under sub-headings gets the same result wherever they
          write it. Nothing here has its own formatting rules. */}
      {cv.extras?.map((x) => (
        <div key={x.heading} className="mt-5">
          <Head>{x.heading}</Head>
          <div className="space-y-2.5">
            {x.entries.map((e) => (
              <div key={e.title}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-[12px] font-semibold text-ink">{e.title}</p>
                  {e.meta && <p className="shrink-0 text-[11px] text-muted">{e.meta}</p>}
                </div>
                {e.body && <CvRichText value={e.body} className="mt-0.5" />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
