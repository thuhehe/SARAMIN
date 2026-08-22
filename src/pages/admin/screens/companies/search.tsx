import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { companyId } from '@/lib/companyId'
import { AC_STATUS, COMPANIES, CO_STATUS, coKey, coLabel, inPipeline } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { DIRECTORY } from '@/pages/admin/data/directory'
import { ME } from '@/pages/admin/data/salesOrg'
import { Pill } from '@/pages/admin/ui/status'
import { searchKey } from '@/pages/admin/ui/table'

/* ── Global company search ───────────────────────────────────────────────────
   One search box in the shell, reachable from every page. The Companies list has
   its own search, but that one narrows a LIST the rep is already looking at; this
   one answers a different question — "does this customer exist at all, and where
   is it?" — from wherever they happen to be.

   Deliberately unscoped: it searches EVERY company, not the signed-in rep's book.
   A rep who cannot find a customer because it belongs to a colleague creates it
   again, and a duplicate MST costs far more than the privacy of a company name.
   What the rep gets is REACH: one record, opened by name / MST / Company ID.
   Browsing someone else's book is still not possible — there is no listing here,
   the result set is capped, and it dies with the query.

   Companies only. A quotation or a PO is always reached THROUGH its company, and
   a box that answers with four kinds of record needs the user to read every row
   before they can act on any of them. */
export function GlobalCompanySearch({ onOpen }: { onOpen: (specId: string, record: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  /* ⌘K / Ctrl-K from anywhere. The shortcut is printed in the box: a hotkey nobody
     can see is a hotkey nobody uses. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.current?.focus(); input.current?.select() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // clicking anywhere else dismisses the results without clearing the query
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => { setCursor(0) }, [q])

  const ql = searchKey(q.trim())
  /* Identity fields plus the contact's NAME — not their job title, and not the
     city. "Trưởng phòng HC-NS" and "HCMC" are on almost every record, so matching
     them turns a search into a way to page through everyone's book, which is the
     one thing this box must not become. */
  const hay = (c: Company) => searchKey([coLabel(c), c.name, c.legalName, c.tax, companyId(coKey(c)), c.contact.split('·')[0], c.domain].join(' '))
  const all = ql.length >= 2 ? COMPANIES.filter((c) => hay(c).includes(ql)) : []
  const hits = all.slice(0, 7)
  /* The free Danh bạ answers the same query. Without this the box says "it does not
     exist yet" about a company sitting unclaimed in the pool — and that sentence is
     the whole reason the box exists, so it has to be true of BOTH stores. */
  const pool = ql.length >= 2
    ? DIRECTORY.filter((d) => d.state === 'free' && searchKey([d.name, d.phone ?? '', d.web ?? '', d.tax ?? ''].join(' ')).includes(ql)).slice(0, 4)
    : []

  /* Hands the shell the Company ID, not the row: the shell switches to Companies
     and that page resolves the id, so the breadcrumb names Companies and Back
     returns to the Companies list — not to whatever page the search was used on. */
  const go = (c: Company) => {
    setOpen(false)
    setQ('')
    input.current?.blur()
    onOpen('admin-company-list', companyId(coKey(c)))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setQ(''); setOpen(false); input.current?.blur(); return }
    if (!hits.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((i) => (i + 1) % hits.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((i) => (i - 1 + hits.length) % hits.length) }
    if (e.key === 'Enter') { e.preventDefault(); go(hits[cursor]) }
  }

  return (
    <div ref={box} className="relative min-w-0 flex-1">
      <div className={cn('flex items-center gap-2 rounded-lg border bg-canvas px-2.5 py-1.5 transition-colors', open ? 'border-brand/50 bg-surface' : 'border-line hover:border-ink/25')}>
        <span className="shrink-0 text-[12px] text-faint"></span>
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Tìm công ty — tên, mã số thuế, mã công ty…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
        />
        {q ? (
          <button onClick={() => { setQ(''); input.current?.focus() }} className="shrink-0 text-[12px] text-faint hover:text-ink" aria-label="Clear search">✕</button>
        ) : (
          <span className="hidden shrink-0 rounded border border-line px-1.5 py-px font-mono text-[10px] text-faint lg:inline">⌘K</span>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          {ql.length < 2 ? (
            <p className="px-3 py-2.5 text-[11.5px] text-muted">Type at least <b className="text-ink">2 characters</b> — company name, tax code (MST) or Company ID.</p>
          ) : hits.length === 0 && pool.length === 0 ? (
            <div className="px-3 py-2.5">
              <p className="text-[11.5px] text-muted">No company matches “<b className="text-ink">{q.trim()}</b>”.</p>
              {/* The point of searching before creating: this line is what stops the
                  rep from making a duplicate they could not find. Both stores, named
                  — a rep who is told "nowhere" must be able to trust it. */}
              <p className="mt-0.5 text-[10.5px] text-faint">Checked every CRM company including other reps’, and the free <b className="text-muted">Danh bạ doanh nghiệp</b> — if it is not in either, it does not exist yet.</p>
            </div>
          ) : (
            <>
              {hits.length > 0 && (<>
              <div className="flex items-center gap-2 border-b border-line-soft bg-canvas/60 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Companies</span>
                <span className="ml-auto text-[10.5px] text-faint">{hits.length}/{all.length} result{all.length === 1 ? '' : 's'}</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-1">
                {hits.map((c, i) => (
                  <button
                    key={c.name}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(c)}
                    className={cn('flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left', i === cursor ? 'bg-canvas' : 'hover:bg-canvas')}
                  >
                    <span className="mt-px text-[12px]"></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{coLabel(c)}</span>
                        <Pill tone={AC_STATUS[c.account].tone}>{c.account}</Pill>
                        {/* Pipeline is a second, independent axis — a rep opening a
                            record wants to know if a deal is live on it. */}
                        {inPipeline(c) && <Pill tone={CO_STATUS[c.status].tone}>{CO_STATUS[c.status].label}</Pill>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-faint">
                        <span className="font-mono">{companyId(coKey(c))}</span>
                        <span>·</span>
                        <span>MST {c.tax}</span>
                        <span>·</span>
                        <span>{c.owner}{c.owner === ME && <span className="text-brand"> (you)</span>}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              </>)}

              {/* Second store, second section — never mixed into the list above. A
                  CRM company is a customer with an owner; a Danh bạ row is reference
                  data nobody holds. Ranking them together would hide that. */}
              {pool.length > 0 && (
                <>
                  <div className="flex items-center gap-2 border-y border-line-soft bg-canvas/60 px-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Danh bạ · chưa ai nhận</span>
                    <span className="ml-auto text-[10.5px] text-faint">{pool.length} kết quả</span>
                  </div>
                  <div className="p-1">
                    {pool.map((d) => (
                      <button
                        key={d.name}
                        onClick={() => { setOpen(false); setQ(''); input.current?.blur(); onOpen('admin-company-directory', '') }}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-canvas"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="min-w-0 truncate text-[12.5px] font-medium text-ink">{d.name}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-faint">
                            <span>{d.addr ?? '—'}</span>
                            {d.phone && <><span>·</span><span>{d.phone}</span></>}
                            <span>·</span>
                            <span>chưa có sales phụ trách</span>
                          </span>
                        </span>
                        <span className="mt-0.5 shrink-0 text-[10.5px] font-medium text-brand">Xin nhận →</span>
                      </button>
                    ))}
                  </div>
                  <p className="border-t border-line-soft bg-canvas/60 px-3 py-1.5 text-[10px] leading-relaxed text-faint">
                    Chưa phải khách hàng — <b className="text-muted">dữ liệu tham chiếu</b>, không đếm vào số nào của CRM. Xin nhận cần SĐT liên hệ + bằng chứng đang tuyển, và admin duyệt.
                  </p>
                </>
              )}

              <div className="flex items-center gap-3 border-t border-line-soft bg-canvas/60 px-3 py-1.5 text-[10px] text-faint">
                <span><b className="font-mono text-muted">↑↓</b> navigate</span>
                <span><b className="font-mono text-muted">↵</b> open</span>
                <span><b className="font-mono text-muted">esc</b> close</span>
                {all.length > hits.length && <span className="ml-auto">Refine to see the other {all.length - hits.length}</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
