import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { WF_GROUPS, WORKFLOW, adminUrl } from '@/data/workflow'
import type { WfBlock, WfSection } from '@/data/workflow'

/* ── CẨM NANG THAO TÁC ────────────────────────────────────────────────────────
   The operating handbook for the real Admin console, laid out to the client's
   own proposal: a grouped rail on the left, and a page that opens with the three
   questions people actually arrive with before it opens with any structure.

   ONE DOCUMENT, TWO AUDIENCES. The Sales / Developer switch filters blocks rather
   than swapping documents. Two documents drift — the operator's copy quietly
   loses a rule the developer's copy gained — and the rule they disagree on is
   always the one that mattered.

   Everything here describes the BUILT admin (dev.admin-svn.topdev.asia), not this
   site's spec, so every deep link points at the live console. */
export function Workflow() {
  const [dev, setDev] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(WORKFLOW.sections.map((s) => [s.id, true])),
  )
  const [q, setQ] = useState('')
  const [active, setActive] = useState<string>(WORKFLOW.sections[0].id)

  const visible = useMemo(
    () => WORKFLOW.sections.filter((s) => (dev || !s.dev) && matches(s, q)),
    [dev, q],
  )
  const setAll = (v: boolean) => setOpen(Object.fromEntries(WORKFLOW.sections.map((s) => [s.id, v])))

  const go = (id: string) => {
    setActive(id)
    setOpen((o) => ({ ...o, [id]: true }))
    document.getElementById(`wf-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex gap-6 pb-16 print:block">
      {/* ── rail ───────────────────────────────────────────────────────────── */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[232px] shrink-0 overflow-y-auto rounded-2xl bg-[#0f2744] p-3 text-white/90 lg:block print:hidden">
        <div className="px-2 pb-3 pt-1">
          <p className="flex items-center gap-2 text-[14px] font-bold text-white">
            <span className="grid h-6 w-6 place-items-center rounded bg-amber-400 text-[12px] font-black text-[#0f2744]">S</span>
            Saramin Workflow
          </p>
          <p className="mt-0.5 pl-8 text-[11px] text-white/55">{dev ? 'Bản dành cho Developer' : 'Bản dành cho Sales'}</p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm quy trình…"
          className="mb-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />

        {WF_GROUPS.map((g) => {
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
                  <span className="w-6 shrink-0 text-[10px] font-bold text-amber-300">{s.code}</span>
                  <span className="min-w-0 truncate">{s.label}</span>
                </button>
              ))}
            </div>
          )
        })}
      </aside>

      {/* ── page ───────────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Cẩm nang thao tác</p>
            <h1 className="mt-1 max-w-[18ch] text-[34px] font-bold leading-[1.1] tracking-tight">{WORKFLOW.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={() => setDev((v) => !v)}
              className={cn(
                'rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors',
                dev ? 'bg-ink text-white' : 'bg-[#0f2744] text-white hover:opacity-90',
              )}
            >
              {dev ? '← Về bản Sales' : 'Xem bản Developer'}
            </button>
            <button onClick={() => setAll(true)} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Mở hết</button>
            <button onClick={() => setAll(false)} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">Thu gọn</button>
            <button onClick={() => window.print()} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">In / Lưu PDF</button>
          </div>
        </div>

        <p className="mb-4 max-w-[76ch] text-[14px] leading-relaxed text-ink/75">{WORKFLOW.lead}</p>

        {/* the three questions people arrive with */}
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {WORKFLOW.quick.map((c) => (
            <div key={c.q} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[13.5px] font-bold text-ink">{c.q}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{c.a}</p>
            </div>
          ))}
        </div>

        {/* the one rule that answers most support calls */}
        <div className="mb-4 rounded-xl bg-gradient-to-r from-[#0f4c8a] to-[#1466b8] px-5 py-4 text-white">
          <p className="text-[14px] font-bold">{WORKFLOW.keyFact.heading}</p>
          <p className="mt-1.5 max-w-[86ch] text-[13px] leading-relaxed text-white/90">{WORKFLOW.keyFact.text}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 print:hidden">
          {WORKFLOW.links.map((l) => (
            <a
              key={l.path}
              href={adminUrl(l.path)}
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
          Viết từ build thật: <span className="font-mono">saramin-vn-admin</span> (docs/business-logic.md ·
          docs/qa/tester-guide · navigation.config.tsx). Console đang mô tả:{' '}
          <a href={adminUrl('/')} target="_blank" rel="noreferrer" className="text-brand hover:underline">dev.admin-svn.topdev.asia</a>.
          Build đổi thì trang này là thứ cũ đi trước.
        </p>
      </div>
    </div>
  )
}

function Section({ s, dev, open, onToggle }: { s: WfSection; dev: boolean; open: boolean; onToggle: () => void }) {
  const blocks = s.blocks.filter((b) => dev || !b.dev)
  return (
    <section id={`wf-${s.id}`} className="scroll-mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <button onClick={onToggle} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-canvas/40 print:hidden">
        <span className="mt-0.5 grid h-6 w-7 shrink-0 place-items-center rounded bg-brand-soft text-[10px] font-bold text-brand">{s.code}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold tracking-tight text-ink">{s.title}</span>
          {s.where && <span className="mt-0.5 block font-mono text-[11px] text-faint">{s.where}</span>}
        </span>
        <span className="shrink-0 pt-1 text-[12px] text-muted">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="space-y-3.5 border-t border-line-soft px-5 py-4">
          {s.lead && <p className="max-w-[80ch] text-[13px] leading-relaxed text-ink/75">{s.lead}</p>}
          {blocks.map((b, i) => <Block key={i} b={b} />)}
        </div>
      )}
    </section>
  )
}

function Block({ b }: { b: WfBlock }) {
  /* A dev-only block keeps a marker even in the Developer view — a reader who has
     just switched needs to see WHICH parts appeared, not a page that silently
     got longer. */
  const devTag = b.dev && (
    <span className="mb-1 inline-block rounded border border-ink/20 bg-ink/5 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink/50">Developer</span>
  )

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

  if (b.kind === 'table') {
    return (
      <div>
        {devTag}
        {b.heading && <p className="mb-1 text-[13px] font-bold text-ink">{b.heading}</p>}
        {b.note && <p className="mb-1.5 text-[12px] text-muted">{b.note}</p>}
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
      <p className="flex gap-2 rounded-lg bg-amber-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
        <span className="shrink-0">⚠️</span>
        <span>{devTag}{md(b.text)}</span>
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {b.items.map((l) => (
        <a
          key={l.path}
          href={adminUrl(l.path)}
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
function md(s: string) {
  return s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <b key={i} className="font-semibold text-ink">{part.slice(2, -2)}</b>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="rounded bg-canvas px-1 py-0.5 font-mono text-[11.5px] text-ink/80">{part.slice(1, -1)}</code>
    return part
  })
}

function matches(s: WfSection, q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const hay = [s.title, s.label, s.lead ?? '', s.where ?? '', JSON.stringify(s.blocks)].join(' ').toLowerCase()
  return hay.includes(t)
}
