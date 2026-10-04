import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { GROUPS, HANDBOOK, siteUrl } from '@/data/handbook'
import type { GuideBlock, GuideSection } from '@/data/types'

/* ── CẨM NANG JOBSEEKER ───────────────────────────────────────────────────────
   The operating handbook for the BUILT jobseeker site (dev.svn.topdev.asia),
   laid out exactly like the admin guide: a grouped navy rail on the left, and a
   page that opens with the questions people actually arrive with before it opens
   with any structure.

   ONE DOCUMENT, TWO AUDIENCES. The user / Developer switch filters blocks rather
   than swapping documents. Every deep link points at the live site. */
export function Guide() {
  const [dev, setDev] = useState(() => readDev())
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(HANDBOOK.sections.map((s) => [s.id, true])),
  )
  const [q, setQ] = useState('')
  const [active, setActive] = useState<string>(HANDBOOK.sections[0].id)

  const visible = useMemo(
    () => HANDBOOK.sections.filter((s) => (dev || !s.dev) && matches(s, q)),
    [dev, q],
  )
  const setAll = (v: boolean) => setOpen(Object.fromEntries(HANDBOOK.sections.map((s) => [s.id, v])))

  const go = (id: string) => {
    setActive(id)
    setOpen((o) => ({ ...o, [id]: true }))
    history.replaceState(null, '', `#${id}`)
    requestAnimationFrame(() => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const toggleDev = () =>
    setDev((v) => {
      try {
        localStorage.setItem('jsg-dev', v ? '0' : '1')
      } catch {
        /* storage blocked — the switch still works for this visit */
      }
      return !v
    })

  /* A shared link to #dang-nhap lands on that section. */
  useEffect(() => {
    const id = location.hash.slice(1)
    if (id && HANDBOOK.sections.some((s) => s.id === id)) go(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* The rail follows the reader: the section whose top last crossed the upper
     third of the viewport is the active one. */
  useEffect(() => {
    const els = visible.map((s) => document.getElementById(`sec-${s.id}`)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id.replace(/^sec-/, ''))
      },
      { rootMargin: '0px 0px -66% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [visible])

  return (
    <div className="mx-auto flex max-w-[1240px] gap-6 px-4 py-4 pb-16 sm:px-6 print:block print:px-0">
      {/* ── rail ───────────────────────────────────────────────────────────── */}
      <aside className="scroll-thin sticky top-4 hidden h-[calc(100vh-2rem)] w-[240px] shrink-0 overflow-y-auto rounded-2xl bg-navy p-3 text-white/90 lg:block print:hidden">
        <div className="px-2 pb-3 pt-1">
          <p className="flex items-center gap-2 text-[14px] font-bold text-white">
            <span className="grid h-6 w-6 place-items-center rounded bg-amber-400 text-[12px] font-black text-navy">S</span>
            Saramin Jobseeker
          </p>
          <p className="mt-0.5 pl-8 text-[11px] text-white/55">{dev ? 'Bản dành cho Developer' : 'Bản dành cho người dùng & QA'}</p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm hướng dẫn…"
          className="mb-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />

        {GROUPS.map((g) => {
          const items = visible.filter((s) => s.group === g)
          if (items.length === 0) return null
          return (
            <div key={g} className="mb-3">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">{g}</p>
              {items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12.5px] transition-colors',
                    active === s.id ? 'bg-white/15 font-medium text-white' : 'text-white/75 hover:bg-white/10',
                  )}
                >
                  <span className="w-7 shrink-0 text-[10px] font-bold text-amber-300">{s.code}</span>
                  <span className="min-w-0 truncate">{s.label}</span>
                  {s.dev && <span className="ml-auto shrink-0 rounded bg-white/10 px-1 text-[9px] font-semibold uppercase text-white/60">Dev</span>}
                </button>
              ))}
            </div>
          )
        })}
      </aside>

      {/* ── page ───────────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {/* narrow screens: the rail collapses to a picker */}
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-navy p-2 lg:hidden print:hidden">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-amber-400 text-[12px] font-black text-navy">S</span>
          <select
            value={active}
            onChange={(e) => go(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-[13px] text-white focus:outline-none"
          >
            {GROUPS.map((g) => (
              <optgroup key={g} label={g} className="text-ink">
                {visible.filter((s) => s.group === g).map((s) => (
                  <option key={s.id} value={s.id} className="text-ink">
                    {s.code} · {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Cẩm nang thao tác · Jobseeker</p>
            <h1 className="mt-1 max-w-[20ch] text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[34px]">{HANDBOOK.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={toggleDev}
              className={cn(
                'rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors',
                dev ? 'bg-brand text-white' : 'bg-navy text-white hover:opacity-90',
              )}
            >
              {dev ? '← Về bản người dùng' : 'Xem bản Developer'}
            </button>
            <button onClick={() => setAll(true)} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Mở hết</button>
            <button onClick={() => setAll(false)} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Thu gọn</button>
            {/* The artifact preview runs in a frame that cannot open the print dialog. */}
            {!import.meta.env.VITE_ARTIFACT && (
              <button onClick={() => window.print()} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">In / Lưu PDF</button>
            )}
          </div>
        </div>

        <p className="mb-4 max-w-[76ch] text-[14px] leading-relaxed text-ink/75">{md(HANDBOOK.lead)}</p>

        {/* the three questions people arrive with */}
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {HANDBOOK.quick.map((c) => (
            <div key={c.q} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[13.5px] font-bold text-ink">{c.q}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{md(c.a)}</p>
            </div>
          ))}
        </div>

        {/* the one rule that answers most support calls */}
        <div className="mb-4 rounded-xl bg-gradient-to-r from-[#0f4c8a] to-[#1466b8] px-5 py-4 text-white">
          <p className="text-[14px] font-bold">{HANDBOOK.keyFact.heading}</p>
          <p className="mt-1.5 max-w-[86ch] text-[13px] leading-relaxed text-white/90">{md(HANDBOOK.keyFact.text, true)}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 print:hidden">
          {HANDBOOK.links.map((l) => (
            <a
              key={l.path}
              href={siteUrl(l.path)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-[12.5px] font-medium text-ink/80 hover:border-brand hover:text-brand"
            >
              {l.label} ↗
            </a>
          ))}
        </div>

        {visible.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[13px] text-muted">
            Không có mục nào khớp “{q}”.
          </p>
        )}

        <div className="space-y-4">
          {visible.map((s) => (
            <Section key={s.id} s={s} dev={dev} open={open[s.id] ?? true} onToggle={() => setOpen((o) => ({ ...o, [s.id]: !(o[s.id] ?? true) }))} />
          ))}
        </div>

        <p className="mt-8 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          Viết từ build thật: <span className="font-mono">svn-web</span> @ <span className="font-mono">{HANDBOOK.source.web}</span> ·{' '}
          <span className="font-mono">svn-be</span> @ <span className="font-mono">{HANDBOOK.source.be}</span> (nhánh <span className="font-mono">dev</span>, {HANDBOOK.source.date}). Site đang mô tả:{' '}
          <a href={siteUrl('/')} target="_blank" rel="noreferrer" className="text-brand hover:underline">dev.svn.topdev.asia</a>.
          Build đổi thì trang này là thứ cũ đi trước.
        </p>
      </div>
    </div>
  )
}

function Section({ s, dev, open, onToggle }: { s: GuideSection; dev: boolean; open: boolean; onToggle: () => void }) {
  const blocks = s.blocks.filter((b) => dev || !b.dev)
  return (
    <section id={`sec-${s.id}`} className="scroll-mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <button onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-canvas/40 sm:px-5">
        <span className="mt-0.5 grid h-6 w-7 shrink-0 place-items-center rounded bg-brand-soft text-[10px] font-bold text-brand">{s.code}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold tracking-tight text-ink">
            {s.title}
            {s.dev && <DevTag inline />}
          </span>
          {s.where && <span className="mt-0.5 block break-words font-mono text-[11px] text-faint">{s.where}</span>}
        </span>
        <span className="shrink-0 pt-1 text-[12px] text-muted print:hidden">{open ? '▾' : '▸'}</span>
      </button>

      <div className={cn('space-y-3.5 border-t border-line-soft px-4 py-4 sm:px-5', !open && 'hidden print:block')}>
        {s.lead && <p className="max-w-[80ch] text-[13px] leading-relaxed text-ink/75">{md(s.lead)}</p>}
        {blocks.map((b, i) => <Block key={i} b={b} />)}
      </div>
    </section>
  )
}

/* A dev-only block keeps a marker even in the Developer view — a reader who has
   just switched needs to see WHICH parts appeared, not a page that silently got
   longer. */
function DevTag({ inline }: { inline?: boolean }) {
  return (
    <span className={cn('inline-block rounded border border-ink/20 bg-ink/5 px-1.5 py-0.5 align-middle text-[9.5px] font-semibold uppercase tracking-wide text-ink/50', inline ? 'ml-2' : 'mb-1')}>
      Developer
    </span>
  )
}

function Block({ b }: { b: GuideBlock }) {
  const devTag = b.dev && <DevTag />

  if (b.kind === 'p') {
    return <div>{devTag}<p className="max-w-[80ch] text-[13px] leading-relaxed text-ink/75">{md(b.text)}</p></div>
  }

  if (b.kind === 'steps') {
    return (
      <div>
        {devTag}
        {b.heading && <p className="mb-1.5 text-[13px] font-bold text-ink">{b.heading}</p>}
        <ol className="space-y-1.5">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink/80">
              <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">{i + 1}</span>
              <span className="min-w-0">{md(it)}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (b.kind === 'flow') {
    return (
      <div>
        {devTag}
        {b.heading && <p className="mb-1.5 text-[13px] font-bold text-ink">{b.heading}</p>}
        <ol className="flex flex-wrap items-stretch gap-y-2">
          {b.items.map((it, i) => (
            <li key={i} className="flex items-center">
              <span className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
                <span className="block text-[12.5px] font-semibold text-ink">{md(it.label)}</span>
                {it.path && <span className="block font-mono text-[10.5px] text-faint">{it.path}</span>}
              </span>
              {i < b.items.length - 1 && <span className="px-1.5 text-[13px] text-faint">→</span>}
            </li>
          ))}
        </ol>
      </div>
    )
  }

  if (b.kind === 'table') {
    return (
      <div>
        {devTag}
        {b.heading && <p className="mb-1 text-[13px] font-bold text-ink">{b.heading}</p>}
        {b.note && <p className="mb-1.5 text-[12px] text-muted">{md(b.note)}</p>}
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="bg-canvas/60">
                {b.table.cols.map((c) => (
                  <th key={c} className="border-b border-line px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.table.rows.map((r, i) => (
                <tr key={i} className="border-b border-line-soft last:border-0">
                  {r.map((cell, j) => (
                    <td key={j} className={cn('px-3 py-2 align-top text-[12.5px] leading-relaxed', j === 0 ? 'font-medium text-ink' : 'text-ink/75')}>{md(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (b.kind === 'warn') {
    return (
      <div className="flex gap-2 rounded-lg bg-warn-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-warn">
        <span className="shrink-0">⚠️</span>
        <span>{devTag}{md(b.text)}</span>
      </div>
    )
  }

  if (b.kind === 'tip') {
    return (
      <div className="flex gap-2 rounded-lg bg-brand-soft px-3.5 py-2.5 text-[12.5px] leading-relaxed text-tip">
        <span className="shrink-0">💡</span>
        <span>{devTag}{md(b.text)}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {b.items.map((l) => (
        <a
          key={l.path}
          href={siteUrl(l.path)}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-brand hover:text-brand"
        >
          {l.label} <span className="font-mono text-[10.5px] text-faint">{l.path}</span> ↗
        </a>
      ))}
    </div>
  )
}

/* **bold** and `code` only. A full markdown renderer would invite the handbook to
   become prose, and the point of these blocks is that they stay short. */
function md(s: string, onDark = false) {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <b key={i} className={cn('font-semibold', onDark ? 'text-white' : 'text-ink')}>{part.slice(2, -2)}</b>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className={cn('rounded px-1 py-0.5 font-mono text-[11.5px]', onDark ? 'bg-white/15 text-white' : 'bg-canvas text-ink/80')}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

function matches(s: GuideSection, q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const hay = [s.title, s.label, s.lead ?? '', s.where ?? '', JSON.stringify(s.blocks)].join(' ').toLowerCase()
  return hay.includes(t)
}

function readDev() {
  if (new URLSearchParams(location.search).get('view') === 'dev') return true
  try {
    return localStorage.getItem('jsg-dev') === '1'
  } catch {
    return false
  }
}
