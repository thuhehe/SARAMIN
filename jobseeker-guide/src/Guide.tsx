import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { CURRENT_DOC, DOCS, HANDBOOK, siteUrl } from '@/data/handbook'
import type { GuideBlock, GuideModule, GuideSection } from '@/data/types'
import { copyHaystack } from '@/data/copyReview'
import { SHOTS_SOURCE } from '@/data/shots'
import { CopyAll, CopyPrefsProvider, CopyTable } from '@/CopyReview'

/* ── CẨM NANG JOBSEEKER ───────────────────────────────────────────────────────
   The operating handbook for the BUILT jobseeker site (dev.svn.topdev.asia).

   MODULE → SUB-MODULE → PAGE. One page is on screen at a time; a module opens on
   its overview (the questions people arrive with, then one card per sub-module),
   and a page carries the tabs of its sub-module and Trước / Sau across the
   module. The reader picks a place instead of scrolling a single column past
   forty sections to reach it.

   The URL hash is the place: `#tai-khoan` (a module) or `#dang-nhap` (a page).
   Plain tokens only, so the same links work inside an artifact frame.

   ONE DOCUMENT, TWO AUDIENCES. The user / Developer switch filters pages and
   blocks rather than swapping documents. Every deep link points at the live site. */

const MODULES = HANDBOOK.modules
const moduleOf = (s: GuideSection) => MODULES.find((m) => m.id === s.module)!

export function Guide() {
  const [dev, setDev] = useState(() => readDev())
  const [q, setQ] = useState('')
  const [place, setPlace] = useState<string>(() => location.hash.slice(1) || MODULES[0].id)

  /* the pages this audience can reach, in reading order: module, then sub-module */
  const pages = useMemo(
    () =>
      MODULES.flatMap((m) =>
        m.subs.flatMap((sub) => HANDBOOK.sections.filter((s) => s.module === m.id && s.group === sub.label && (dev || !s.dev))),
      ),
    [dev],
  )
  const page = pages.find((s) => s.id === place)
  const module = page ? moduleOf(page) : (MODULES.find((m) => m.id === place) ?? MODULES[0])
  const hits = useMemo(() => (q.trim() ? pages.filter((s) => matches(s, q)) : null), [pages, q])

  const go = (id: string) => {
    setPlace(id)
    history.replaceState(null, '', `#${id}`)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onHash = () => setPlace(location.hash.slice(1) || MODULES[0].id)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const toggleDev = () =>
    setDev((v) => {
      try {
        localStorage.setItem('jsg-dev', v ? '0' : '1')
      } catch {
        /* storage blocked — the switch still works for this visit */
      }
      return !v
    })

  return (
    <div className="mx-auto flex max-w-[1240px] gap-6 px-4 py-4 pb-16 sm:px-6 print:block print:px-0">
      {/* ── rail ───────────────────────────────────────────────────────────── */}
      <aside className="scroll-thin sticky top-4 hidden h-[calc(100vh-2rem)] w-[248px] shrink-0 overflow-y-auto rounded-2xl bg-navy p-3 text-white/90 lg:block print:hidden">
        <div className="relative px-2 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-amber-400 text-[12px] font-black text-navy">S</span>
            <DocSwitcher />
          </div>
          <p className="mt-0.5 pl-8 text-[11px] text-white/55">{dev ? 'Bản dành cho Developer' : 'Bản dành cho người dùng & QA'}</p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm trong cẩm nang…"
          className="mb-3 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
        />

        {hits ? (
          <div className="flex flex-col gap-1">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">{hits.length} kết quả</p>
            {hits.length === 0 && <p className="px-2 py-2 text-[12px] text-white/55">Không có trang nào khớp “{q}”.</p>}
            {hits.map((s) => (
              <RailPage key={s.id} s={s} active={s.id === place} onClick={() => go(s.id)} trail={`${moduleOf(s).label} › ${s.group}`} />
            ))}
          </div>
        ) : (
          <nav className="flex flex-col gap-1.5">
            {MODULES.map((m) => {
              const open = m.id === module.id
              return (
                <div key={m.id}>
                  <button
                    onClick={() => go(m.id)}
                    aria-expanded={open}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
                      place === m.id ? 'bg-white/15 text-white' : open ? 'text-white' : 'text-white/75 hover:bg-white/10',
                    )}
                  >
                    <span className="grid h-5 w-7 shrink-0 place-items-center rounded bg-amber-400/90 text-[9.5px] font-black text-navy">{m.code}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{m.label}</span>
                    <Chevron open={open} />
                  </button>
                  {open && (
                    <div className="mb-2 ml-3 mt-1.5 flex flex-col gap-1 border-l border-white/10 pl-2">
                      {m.subs.map((sub) => {
                        const items = pages.filter((s) => s.module === m.id && s.group === sub.label)
                        if (items.length === 0) return null
                        /* Only the sub-module being read is unfolded; the rest stay one
                           line each, so the rail never outgrows the screen. */
                        const here = page?.module === m.id && page.group === sub.label
                        return (
                          <div key={sub.label}>
                            <button
                              onClick={() => go(here ? m.id : items[0].id)}
                              aria-expanded={here}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] transition-colors',
                                here ? 'font-semibold text-white' : 'text-white/70 hover:bg-white/10 hover:text-white',
                              )}
                            >
                              <span className="min-w-0 flex-1 truncate">{sub.label}</span>
                              <Chevron open={here} small />
                            </button>
                            {here && (
                              <div className="mb-1 ml-2 mt-1 flex flex-col gap-1">
                                {items.map((s) => (
                                  <RailPage key={s.id} s={s} active={s.id === place} onClick={() => go(s.id)} />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        )}
      </aside>

      {/* ── page ───────────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {/* narrow screens: the rail collapses to a picker */}
        <div className="relative mb-4 flex items-center gap-2 rounded-xl bg-navy p-2 lg:hidden print:hidden">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-amber-400 text-[12px] font-black text-navy">S</span>
          <DocSwitcher compact />
          <select
            value={page ? page.id : module.id}
            onChange={(e) => go(e.target.value)}
            aria-label="Chọn trang"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-[13px] text-white focus:outline-none"
          >
            {MODULES.map((m) => (
              <optgroup key={m.id} label={m.label} className="text-ink">
                <option value={m.id} className="text-ink">
                  {m.code} · Tổng quan module
                </option>
                {pages.filter((s) => s.module === m.id).map((s) => (
                  <option key={s.id} value={s.id} className="text-ink">
                    {s.group} › {s.code} · {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* breadcrumb + audience switch */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Vị trí" className="flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] text-muted">
            <span className="font-semibold uppercase tracking-widest text-brand">Cẩm nang Jobseeker</span>
            <span className="text-faint">/</span>
            {page ? (
              <>
                <button onClick={() => go(module.id)} className="font-medium hover:text-brand hover:underline">{module.label}</button>
                <span className="text-faint">/</span>
                <span className="font-medium text-ink">{page.group}</span>
              </>
            ) : (
              <span className="font-medium text-ink">{module.label}</span>
            )}
          </nav>
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
            {/* The artifact preview runs in a frame that cannot open the print dialog. */}
            {!import.meta.env.VITE_ARTIFACT && (
              <button onClick={() => window.print()} className="rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium text-muted hover:border-ink/40">In trang này</button>
            )}
          </div>
        </div>

        <CopyPrefsProvider dev={dev}>
          {page ? (
            <PageView s={page} dev={dev} pages={pages} go={go} />
          ) : (
            <ModuleOverview m={module} pages={pages} go={go} />
          )}
        </CopyPrefsProvider>

        <p className="mt-8 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
          Viết từ build thật: <span className="font-mono">svn-web</span> @ <span className="font-mono">{HANDBOOK.source.web}</span> ·{' '}
          <span className="font-mono">svn-be</span> @ <span className="font-mono">{HANDBOOK.source.be}</span> (nhánh <span className="font-mono">dev</span>, {HANDBOOK.source.date}). Site đang mô tả:{' '}
          <a href={siteUrl('/')} target="_blank" rel="noreferrer" className="text-brand hover:underline">dev.svn.topdev.asia</a>.
          Build đổi thì trang này là thứ cũ đi trước. Ảnh chụp màn hình: {SHOTS_SOURCE} (ứng viên mẫu, tin tuyển dụng mẫu).
        </p>
      </div>
    </div>
  )
}

/* Down when folded, up when open — the direction the list will move. */
function Chevron({ open, small }: { open: boolean; small?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn('shrink-0 fill-none stroke-current text-white/55', small ? 'h-3 w-3' : 'h-3.5 w-3.5')}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={open ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'} />
    </svg>
  )
}

function RailPage({ s, active, onClick, trail }: { s: GuideSection; active: boolean; onClick: () => void; trail?: string }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors',
        active ? 'bg-white/15 font-medium text-white' : 'text-white/75 hover:bg-white/10',
      )}
    >
      <span className="w-7 shrink-0 text-[10px] font-bold text-amber-300">{s.code}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{s.label}</span>
        {trail && <span className="block truncate text-[10.5px] text-white/45">{trail}</span>}
      </span>
      {s.dev && <span className="shrink-0 rounded bg-white/10 px-1 text-[9px] font-semibold uppercase text-white/60">Dev</span>}
    </button>
  )
}

/* ── a module's landing page ──────────────────────────────────────────────── */
function ModuleOverview({ m, pages, go }: { m: GuideModule; pages: GuideSection[]; go: (id: string) => void }) {
  const mine = pages.filter((s) => s.module === m.id)
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Module · {m.code}</p>
      <h1 className="mt-1 max-w-[24ch] text-[28px] font-bold leading-[1.1] tracking-tight [text-wrap:balance] sm:text-[34px]">{m.title}</h1>
      <p className="mb-5 mt-3 max-w-[76ch] text-[14px] leading-relaxed text-ink/75">{md(m.lead)}</p>

      {m.quick && (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {m.quick.map((c) => (
            <div key={c.q} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-[13.5px] font-bold text-ink">{c.q}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{md(c.a)}</p>
            </div>
          ))}
        </div>
      )}

      {m.keyFact && (
        <div className="mb-4 rounded-xl bg-gradient-to-r from-[#0f4c8a] to-[#1466b8] px-5 py-4 text-white">
          <p className="text-[14px] font-bold">{m.keyFact.heading}</p>
          <p className="mt-1.5 max-w-[86ch] text-[13px] leading-relaxed text-white/90">{md(m.keyFact.text, true)}</p>
        </div>
      )}

      {m.links && (
        <div className="mb-6 flex flex-wrap gap-2 print:hidden">
          {m.links.map((l) => (
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
      )}

      {m.blocks && <div className="mb-6 space-y-3.5">{m.blocks.map((b, i) => <Block key={i} b={b} />)}</div>}

      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-muted">Trong module này</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {m.subs.map((sub, i) => {
          const items = mine.filter((s) => s.group === sub.label)
          if (items.length === 0) return null
          return (
            <div key={sub.label} className="flex flex-col rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[15px] font-bold text-ink">
                  <span className="mr-2 text-[12px] tabular-nums text-faint">{String(i + 1).padStart(2, '0')}</span>
                  {sub.label}
                </p>
                <span className="shrink-0 text-[11px] tabular-nums text-faint">{items.length} trang</span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{sub.blurb}</p>
              <ul className="mt-3 space-y-0.5 border-t border-line-soft pt-2">
                {items.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => go(s.id)} className="group flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 text-left hover:bg-brand-soft">
                      <span className="w-7 shrink-0 text-[10px] font-bold text-brand">{s.code}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink/85 group-hover:text-brand">{s.label}</span>
                      {s.dev && <DevTag inline />}
                      <span className="text-[12px] text-faint group-hover:text-brand">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── one page, with its sub-module's tabs and the way on ──────────────────── */
function PageView({ s, dev, pages, go }: { s: GuideSection; dev: boolean; pages: GuideSection[]; go: (id: string) => void }) {
  const blocks = s.blocks.filter((b) => dev || !b.dev)
  const siblings = pages.filter((p) => p.module === s.module && p.group === s.group)
  const inModule = pages.filter((p) => p.module === s.module)
  const i = inModule.findIndex((p) => p.id === s.id)
  const prev = inModule[i - 1]
  const next = inModule[i + 1]

  return (
    <div>
      {siblings.length > 1 && (
        <div role="tablist" aria-label={s.group} className="mb-3 flex gap-1.5 overflow-x-auto pb-1 print:hidden">
          {siblings.map((p) => {
            const on = p.id === s.id
            return (
              <button
                key={p.id}
                ref={on ? (el) => el?.scrollIntoView({ block: 'nearest', inline: 'nearest' }) : undefined}
                role="tab"
                aria-selected={on}
                onClick={() => go(p.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors',
                  on ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line bg-surface text-ink/75 hover:border-brand/50',
                )}
              >
                <span className={cn('text-[10px] font-bold', on ? 'text-brand' : 'text-faint')}>{p.code}</span>
                {p.label}
              </button>
            )
          })}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <header className="flex items-start gap-3 border-b border-line-soft px-4 py-4 sm:px-5">
          <span className="mt-1 grid h-6 w-8 shrink-0 place-items-center rounded bg-brand-soft text-[10px] font-bold text-brand">{s.code}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-bold leading-tight tracking-tight text-ink [text-wrap:balance]">
              {s.title}
              {s.dev && <DevTag inline />}
            </h1>
            {s.where && <p className="mt-1 break-words font-mono text-[11px] text-faint">{s.where}</p>}
          </div>
        </header>
        <div className="space-y-3.5 px-4 py-4 sm:px-5">
          {s.lead && <p className="max-w-[80ch] text-[13px] leading-relaxed text-ink/75">{md(s.lead)}</p>}
          {s.shots && s.shots.length > 0 && <Shots shots={s.shots} />}
          {blocks.map((b, j) => <Block key={j} b={b} />)}
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 print:hidden">
        {prev ? <PagerLink dir="prev" s={prev} onClick={() => go(prev.id)} /> : <span />}
        {next ? (
          <PagerLink dir="next" s={next} onClick={() => go(next.id)} />
        ) : (
          <button onClick={() => go(s.module)} className="rounded-xl border border-dashed border-line px-4 py-3 text-right text-[12.5px] text-muted hover:border-brand hover:text-brand">
            Hết module · về trang tổng quan ↑
          </button>
        )}
      </div>
    </div>
  )
}

/* The screen first, then the steps: a reader who can see the screen needs half
   the words. One shot runs full width; several sit two to a row. Each opens full
   size on this page — the screens are 1440px wide and the column is narrower. */
function Shots({ shots }: { shots: { src: string; caption: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % shots.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + shots.length) % shots.length))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, shots.length])

  return (
    <>
      <div className={cn('grid gap-3', shots.length > 1 && 'sm:grid-cols-2')}>
        {shots.map((sh, i) => (
          <figure key={sh.src} className={cn('min-w-0', shots.length > 1 && i === 0 && shots.length % 2 === 1 && 'sm:col-span-2')}>
            <ShotThumb sh={sh} onOpen={() => setOpen(i)} />
            <figcaption className="mt-1.5 text-[12px] leading-snug text-muted">{sh.caption}</figcaption>
          </figure>
        ))}
      </div>
      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={shots[open].caption}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex flex-col bg-[#0b1220]/90 print:hidden"
        >
          <div className="flex shrink-0 items-center gap-3 px-4 py-3 text-white">
            <p className="min-w-0 flex-1 text-[13px] text-white/90">
              {shots[open].caption}
              {shots.length > 1 && <span className="ml-2 tabular-nums text-white/55">{open + 1} / {shots.length} · ← →</span>}
            </p>
            <button type="button" onClick={() => setOpen(null)} className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold hover:bg-white/25">
              Đóng (Esc)
            </button>
          </div>
          {/* Scrolls, so a full-page capture reads at its real size instead of
              being squeezed into the window height. */}
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-6">
            <img
              src={shots[open].src}
              alt={shots[open].caption}
              onClick={(e) => e.stopPropagation()}
              className="mx-auto block h-auto max-w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}

/* A capture narrower than the column is shown at its own size (an element crop
   scaled up only blurs); a wide one fills the column, and a tall one shows its
   top with a fade and a hint — the whole page is one click away. */
function ShotThumb({ sh, onOpen }: { sh: { src: string; caption: string }; onOpen: () => void }) {
  const [dim, setDim] = useState<{ w: number; h: number } | null>(null)
  const small = dim !== null && dim.w < 900
  const tall = dim !== null && !small && dim.h / dim.w > 0.8
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Xem cỡ lớn"
      className={cn(
        'relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line hover:border-brand',
        small ? 'bg-canvas p-3' : 'bg-surface',
      )}
    >
      <img
        src={sh.src}
        alt={sh.caption}
        loading="lazy"
        onLoad={(e) => setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
        className={cn(
          'block h-auto',
          small ? 'mx-auto max-w-full rounded-md border border-line' : 'w-full',
          tall && 'max-h-[540px] object-cover object-top',
        )}
      />
      {tall && (
        <span className="absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-surface via-surface/85 to-transparent pb-2.5 text-[12px] font-semibold text-brand">
          Bấm để xem toàn trang ↓
        </span>
      )}
    </button>
  )
}

function PagerLink({ dir, s, onClick }: { dir: 'prev' | 'next'; s: GuideSection; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand',
        dir === 'next' ? 'text-right sm:col-start-2' : 'text-left',
      )}
    >
      <span className="block text-[11px] text-muted">
        {dir === 'prev' ? '← Trước' : 'Tiếp theo →'} · {s.group}
      </span>
      <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-ink group-hover:text-brand">
        <span className="mr-1.5 text-[11px] font-bold text-brand">{s.code}</span>
        {s.label}
      </span>
    </button>
  )
}

/* The two handbooks are one family: the admin console's and this one. The
   switcher names the document, so a reader always knows which site they are on
   and can cross to the other in one click. */
function DocSwitcher({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-md font-bold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300',
          compact ? 'px-1.5 py-1 text-[13px]' : '-mx-1 px-1 py-0.5 text-[14px]',
        )}
      >
        {CURRENT_DOC}
        <span className="grid h-5 w-5 place-items-center rounded bg-white/10">
          <svg viewBox="0 0 16 16" aria-hidden="true" className={cn('h-4 w-4 fill-none stroke-current text-white/85 transition-transform', open && 'rotate-180')} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-20 mt-1 w-[216px] max-w-full overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
          {DOCS.map((d) => {
            const current = d.label === CURRENT_DOC
            return (
              <a
                key={d.label}
                role="menuitem"
                href={current ? undefined : d.href}
                aria-current={current ? 'page' : undefined}
                onClick={current ? () => setOpen(false) : undefined}
                className={cn(
                  'flex items-start gap-2 px-3 py-2 text-left',
                  current ? 'cursor-default bg-brand-soft' : 'hover:bg-canvas',
                )}
              >
                <span className={cn('mt-0.5 w-3 shrink-0 text-[11px] font-bold', current ? 'text-brand' : 'text-transparent')}>✓</span>
                <span className="min-w-0">
                  <span className={cn('block text-[13px] font-semibold', current ? 'text-brand' : 'text-ink')}>{d.label}</span>
                  <span className="block text-[11px] text-muted">{d.note}</span>
                </span>
              </a>
            )
          })}
        </div>
      )}
    </div>
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

  if (b.kind === 'copy') return <CopyTable screenId={b.screen} />
  if (b.kind === 'copy-all') return <CopyAll />

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

/* Inline markup, deliberately small:
     **bold**                 emphasis
     `code`                   a path, a key, a value
     [[Tên VI|English name]]  a name AS IT READS ON SCREEN — menu, screen, tab,
                              button, field. Both languages, so a reader can find
                              it on the site whichever language it is set to.
   A full markdown renderer would invite the handbook to become prose. */
function md(s: string, onDark = false) {
  return s.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const [vi, en] = part.slice(2, -2).split('|')
      return <UiName key={i} vi={vi} en={en} onDark={onDark} />
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <b key={i} className={cn('font-semibold', onDark ? 'text-white' : 'text-ink')}>{part.slice(2, -2)}</b>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className={cn('rounded px-1 py-0.5 font-mono text-[11.5px]', onDark ? 'bg-white/15 text-white' : 'bg-canvas text-ink/80')}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

/* An on-screen name: the Vietnamese label in bold, the English one beside it,
   set in a faint chip so it reads as "a thing on the screen" rather than prose. */
function UiName({ vi, en, onDark }: { vi: string; en?: string; onDark?: boolean }) {
  const showEn = en && en.trim() && en.trim() !== vi.trim()
  return (
    <span
      className={cn(
        'whitespace-normal rounded px-1 py-px [box-decoration-break:clone]',
        onDark ? 'bg-white/15' : 'bg-brand-soft/70',
      )}
    >
      <b className={cn('font-semibold', onDark ? 'text-white' : 'text-ink')}>{vi}</b>
      {showEn && (
        <span lang="en" className={cn('text-[0.92em] font-normal', onDark ? 'text-white/75' : 'text-muted')}>
          {' / '}
          {en}
        </span>
      )}
    </span>
  )
}

function matches(s: GuideSection, q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return true
  const rows = s.blocks.map((b) => (b.kind === 'copy' ? copyHaystack(b.screen) : '')).join(' ')
  const hay = [s.title, s.label, s.lead ?? '', s.where ?? '', JSON.stringify(s.blocks), rows].join(' ').toLowerCase()
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
