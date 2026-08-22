import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SVC_TONE, svcState } from '@/pages/admin/data/content'
import type { SvcState } from '@/pages/admin/data/content'
import { SERVICE_USAGE } from '@/pages/admin/data/services'
import type { ServiceEntitlement } from '@/pages/admin/data/services'
import { LogServiceDeliveryModal } from '@/pages/admin/screens/companies/products'
import { FilterSelect, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

export function AdminManualServices() {
  const [fState, setFState] = useState('')
  const [fSku, setFSku] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [logging, setLogging] = useState<{ e: ServiceEntitlement; company: string } | null>(null)

  const all = Object.entries(SERVICE_USAGE)
    .flatMap(([company, list]) => list.map((e) => ({ company, e, state: svcState(e), left: e.total - e.entries.length })))
  const rows = all
    .filter((r) => (!fState || r.state === fState) && (!fSku || r.e.sku === fSku))
    // Rows that need action first, then rows that lost value, then the settled ones.
    .sort((a, b) => {
      const rank = (x: SvcState) => (x === 'Còn lượt' ? 0 : x === 'Hết hạn' ? 1 : x === 'Đã dùng hết' ? 2 : 3)
      return rank(a.state) - rank(b.state) || b.left - a.left
    })

  const services = [...new Set(all.map((r) => r.e.sku))]

  return (
    <div>
      <ListPage
        cols={[
          { label: 'Dịch vụ', w: '1.9fr' },
          { label: 'Khách hàng', w: '1.4fr' },
          { label: 'Quota', w: '1.2fr' },
          { label: 'Còn lại', w: '0.7fr', align: 'r' },
          { label: 'Hạn dùng', w: '0.9fr' },
          { label: 'Trạng thái', w: '1fr' },
          { label: '', w: '1.1fr', align: 'r' },
        ]}
        rows={rows.map(({ company, e, state, left }) => {
          const key = `${company}|${e.sku}`
          return [
            <button onClick={() => setOpen(open === key ? null : key)} className="min-w-0 max-w-full truncate text-left font-medium text-brand hover:underline">
              {e.name}
            </button>,
            <span className="truncate text-ink/85">{company}</span>,
            <span className="flex items-center gap-2">
              <span className="shrink-0 tabular-nums">{e.entries.length}/{e.total}</span>
              <span className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-line">
                <span className={cn('block h-full rounded-full', state === 'Hết hạn' ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${(e.entries.length / e.total) * 100}%` }} />
              </span>
            </span>,
            <span className={cn('font-semibold tabular-nums', state === 'Hết hạn' ? 'text-rose-600' : left === 0 ? 'text-faint' : 'text-ink')}>{left}</span>,
            <span className={cn('tabular-nums', state === 'Hết hạn' || state === 'Đã kết thúc' ? 'text-faint' : 'text-muted')}>{e.validUntil}</span>,
            <Pill tone={SVC_TONE[state]}>{state}</Pill>,
            <span className="flex items-center justify-end gap-1.5">
              <button onClick={() => setOpen(open === key ? null : key)} className="rounded-md border border-line px-2 py-1 text-[11px] text-muted hover:border-ink/40">
                Lịch sử {e.entries.length > 0 && `(${e.entries.length})`}
              </button>
              {state === 'Còn lượt'
                ? <button onClick={() => setLogging({ e, company })} className="rounded-md border border-brand/30 bg-brand-soft px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand hover:text-white">Ghi nhận</button>
                : <span className="w-[64px] text-center text-[11px] text-faint">—</span>}
            </span>,
          ]
        })}
        filters={
          <>
            <FilterSelect label="Trạng thái" value={fState} onChange={setFState} options={['Còn lượt', 'Đã dùng hết', 'Hết hạn', 'Đã kết thúc']} />
            <FilterSelect label="Dịch vụ" value={fSku} onChange={setFSku} options={services} />
          </>
        }
        total={all.length}
        searchHint="Search dịch vụ, khách hàng…"
        minW={1280}
      />

      {/* A drawer, not a panel under the table. The list is 21 rows and will be
          hundreds: a panel below it opens nowhere near the row that was clicked, so
          the reader loses their place. A drawer holds still, leaves the table where
          it was, and has room for the proof at a size worth looking at. */}
      {open && (() => {
        const r = all.find((x) => `${x.company}|${x.e.sku}` === open)
        if (!r) return null
        const pct = (r.e.entries.length / r.e.total) * 100
        return (
          <>
            <div onClick={() => setOpen(null)} className="fixed inset-0 z-40 bg-black/25" />
            <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[460px] flex-col border-l border-line bg-surface shadow-2xl">
              <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{r.e.name}</p>
                  <p className="truncate text-[11.5px] text-muted">{r.company}</p>
                </div>
                <button onClick={() => setOpen(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
              </div>

              {/* Quota and validity travel with the history: "show me the posts" and
                  "how many are left" are one question, asked in one breath. */}
              <div className="border-b border-line-soft px-4 py-3">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <Pill tone={SVC_TONE[r.state]}>{r.state}</Pill>
                  <span className="text-[12px] tabular-nums">
                    <b>{r.e.entries.length}</b><span className="text-faint">/{r.e.total} {r.e.unit}</span>
                    <span className="ml-2 text-faint">·</span>
                    <span className={cn('ml-2 font-semibold', r.state === 'Hết hạn' ? 'text-rose-600' : r.left === 0 ? 'text-faint' : 'text-ink')}>
                      còn {r.left}
                    </span>
                  </span>
                </div>
                <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <span className={cn('block h-full rounded-full', r.state === 'Hết hạn' ? 'bg-rose-500' : 'bg-brand')} style={{ width: `${pct}%` }} />
                </span>
                <p className="mt-1.5 text-[10.5px] text-faint">Hạn dùng {r.e.validUntil}</p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 py-3.5">
                {r.e.entries.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-[11.5px] text-faint">
                    Chưa ghi nhận lượt nào.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {r.e.entries.map((d, n) => (
                      <li key={d.id} className="rounded-lg border border-line">
                        <div className="flex items-center justify-between gap-2 border-b border-line-soft bg-canvas/50 px-2.5 py-1.5">
                          <span className="flex items-center gap-2 text-[11.5px]">
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-surface text-[9px] font-semibold text-muted">{n + 1}</span>
                            <b className="tabular-nums text-ink">{d.date}</b>
                          </span>
                          <span className="truncate text-[10.5px] text-faint">{d.by}</span>
                        </div>
                        <div className="p-2.5">
                          {/* The screenshot at a size someone can actually judge —
                              a filename in a footnote is not proof of anything. */}
                          <div className={cn('mb-2 grid h-28 place-items-center rounded-md border text-[11px]', d.image ? 'border-line bg-canvas' : 'border-dashed border-amber-200 bg-amber-50 text-amber-700')}>
                            {d.image
                              ? <span className="text-center text-faint"><span className="block text-[20px]">🖼</span><span className="font-mono">{d.image}</span></span>
                              : <span>⚠️ chưa đính ảnh</span>}
                          </div>
                          <p className="text-[11.5px] leading-relaxed text-ink/85">{d.content}</p>
                          <a href={d.link} onClick={(ev) => ev.preventDefault()} className="mt-1.5 block truncate text-[11px] text-brand hover:underline">{d.link}</a>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {r.state === 'Hết hạn' && (
                  <p className="mt-3 flex gap-2 rounded-md bg-rose-50 px-3 py-2 text-[11.5px] leading-relaxed text-rose-700">
                    <span>⚠️</span>
                    <span>Hết hạn <b>{r.e.validUntil}</b> khi còn <b>{r.left} {r.e.unit}</b> chưa giao. Không thể ghi nhận thêm — muốn bù cho khách thì bán/tặng một entitlement mới, đừng sửa hạn của cái cũ.</span>
                  </p>
                )}
              </div>

              {/* The action sits with the history, so logging a delivery happens where
                  the reader just checked what was already delivered. */}
              <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                <span className="text-[10.5px] leading-relaxed text-faint">1 ghi nhận = 1 {r.e.unit}</span>
                {r.state === 'Còn lượt' ? (
                  <button onClick={() => setLogging({ e: r.e, company: r.company })} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">
                    + Ghi nhận đã đăng
                  </button>
                ) : (
                  <span className="rounded-lg border border-line bg-canvas px-3.5 py-2 text-[12.5px] font-medium text-faint">Không thể ghi nhận</span>
                )}
              </div>
            </aside>
          </>
        )
      })()}

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Một dòng = một <b className="text-ink/70">entitlement</b> (công ty × dịch vụ). Trạng thái suy ra từ số còn lại
        và hạn dùng, không nhập tay · chỉ <b className="text-ink/70">Còn lượt</b> mới ghi nhận được
      </p>
      {logging && <LogServiceDeliveryModal e={logging.e} company={logging.company} onClose={() => setLogging(null)} />}
    </div>
  )
}
