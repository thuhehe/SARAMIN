import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { COPY_LANGS, COPY_SCREENS, copyScreen, toCsv, toTsv } from '@/data/copyReview'
import type { CopyLang, CopyScreen } from '@/data/copyReview'

/* Which language columns are on is one choice for the whole review, not per
   table: a reader comparing VI with KO wants every table to show KO. */
interface CopyPrefs {
  langs: CopyLang[]
  toggle: (l: CopyLang) => void
  dev: boolean
}
const Ctx = createContext<CopyPrefs>({ langs: ['vi', 'en'], toggle: () => {}, dev: false })

export function CopyPrefsProvider({ dev, children }: { dev: boolean; children: ReactNode }) {
  const [langs, setLangs] = useState<CopyLang[]>(() => readLangs())
  const toggle = (l: CopyLang) =>
    setLangs((cur) => {
      const next = cur.includes(l) ? cur.filter((x) => x !== l) : COPY_LANGS.map((x) => x.id).filter((x) => x === l || cur.includes(x))
      const safe = next.length ? next : cur // never zero columns
      try {
        localStorage.setItem('jsg-copy-langs', safe.join(','))
      } catch {
        /* storage blocked — the toggle still works for this visit */
      }
      return safe
    })
  return <Ctx.Provider value={{ langs, toggle, dev }}>{children}</Ctx.Provider>
}

function readLangs(): CopyLang[] {
  try {
    const v = localStorage.getItem('jsg-copy-langs')
    const ids = COPY_LANGS.map((l) => l.id) as string[]
    const picked = (v ?? '').split(',').filter((x) => ids.includes(x)) as CopyLang[]
    if (picked.length) return picked
  } catch {
    /* fall through to the default */
  }
  return ['vi', 'en']
}

/* ── one screen ───────────────────────────────────────────────────────────── */
export function CopyTable({ screenId }: { screenId: string }) {
  const { langs, dev } = useContext(Ctx)
  const s = copyScreen(screenId)
  if (!s) return <p className="text-[12.5px] text-muted">Chưa có dữ liệu cho màn hình {screenId}.</p>
  const cols = COPY_LANGS.filter((l) => langs.includes(l.id))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <LangToggles />
        <div className="flex items-center gap-2">
          <span className="text-[11.5px] tabular-nums text-faint">{s.items.length} dòng</span>
          <CopyButton label="Sao chép bảng này" text={() => toTsv([s])} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-canvas/60">
              <th className="w-[72px] border-b border-line px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Mã</th>
              <th className="w-[22%] border-b border-line px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Vị trí</th>
              {cols.map((l) => (
                <th key={l.id} className="border-b border-line px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-muted">{l.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.items.map((r) => (
              <tr key={r.id} id={`copy-${r.id}`} className="scroll-mt-4 border-b border-line-soft align-top last:border-0 target:bg-brand-soft">
                <td className="px-3 py-2">
                  <span className="font-mono text-[11.5px] font-semibold tabular-nums text-brand">{r.id}</span>
                  {dev && (
                    <span className="mt-1 block break-all font-mono text-[10px] leading-snug text-faint">{r.keys.join(' + ')}</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span className="block text-[12.5px] font-medium leading-snug text-ink">{r.where}</span>
                  {r.note && <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{r.note}</span>}
                </td>
                {cols.map((l) => (
                  <td key={l.id} className="px-3 py-2 text-[13px] leading-relaxed text-ink/85">
                    <Text value={r[l.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* The text as it reads on screen: line breaks kept, the build's {slots} set
   apart so nobody "corrects" them, and an empty string called out instead of
   silently rendering as a blank cell. */
function Text({ value }: { value: string }) {
  if (!value.trim()) return <span className="text-[11.5px] italic text-faint">(trống)</span>
  return (
    <span className="whitespace-pre-line">
      {value.split(/(\{[a-zA-Z]+\})/g).map((p, i) =>
        /^\{[a-zA-Z]+\}$/.test(p) ? (
          <code key={i} className="rounded bg-canvas px-1 py-0.5 font-mono text-[11px] text-brand">{p}</code>
        ) : (
          p
        ),
      )}
    </span>
  )
}

function LangToggles() {
  const { langs, toggle } = useContext(Ctx)
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Cột ngôn ngữ">
      {COPY_LANGS.map((l) => {
        const on = langs.includes(l.id)
        return (
          <button
            key={l.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(l.id)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
              on ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/40',
            )}
          >
            {on ? '✓ ' : ''}
            {l.label}
          </button>
        )
      })}
    </div>
  )
}

function CopyButton({ label, text, primary }: { label: string; text: () => string; primary?: boolean }) {
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle')
  const onClick = () => {
    navigator.clipboard.writeText(text()).then(
      () => setState('done'),
      () => setState('failed'),
    )
    window.setTimeout(() => setState('idle'), 2200)
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors',
        primary ? 'bg-navy text-white hover:opacity-90' : 'border border-line text-ink/80 hover:border-brand hover:text-brand',
      )}
    >
      {state === 'done' ? 'Đã sao chép — dán vào Excel / Sheets' : state === 'failed' ? 'Trình duyệt chặn sao chép' : label}
    </button>
  )
}

/* ── the whole review ─────────────────────────────────────────────────────── */
export function CopyAll() {
  const download = () => {
    const blob = new Blob([toCsv(COPY_SCREENS)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'saramin-jobseeker-noi-dung-tai-khoan.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const total = COPY_SCREENS.reduce((n, s: CopyScreen) => n + s.items.length, 0)
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-canvas/50 px-4 py-3">
      <div className="mr-auto min-w-0">
        <p className="text-[13px] font-bold text-ink">Toàn bộ nội dung</p>
        <p className="text-[12px] tabular-nums text-muted">
          {COPY_SCREENS.length} màn hình · {total} dòng · 3 ngôn ngữ
        </p>
      </div>
      <CopyButton primary label="Sao chép tất cả" text={() => toTsv(COPY_SCREENS)} />
      {/* The artifact preview's frame blocks downloads the page starts itself. */}
      {!import.meta.env.VITE_ARTIFACT && (
        <button type="button" onClick={download} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-semibold text-ink/80 hover:border-brand hover:text-brand">
          Tải file Excel (CSV)
        </button>
      )}
    </div>
  )
}
