import { useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { OpenRecordCtx, ScreenNavCtx } from '@/pages/admin/ctx'
import type { Company } from '@/pages/admin/data/companies'
import { POS, QUOTES, QUOTE_CATALOG, QUOTE_SORTS, QUOTE_TONE, apprRole } from '@/pages/admin/data/sales'
import type { Quote, QuoteSort, QuoteStatus } from '@/pages/admin/data/sales'
import { SALES_PERSONAS, SALES_ROLE_LABEL, teamBookOf } from '@/pages/admin/data/salesOrg'
import type { SalesPersona } from '@/pages/admin/data/salesOrg'
import { CreatePOModal } from '@/pages/admin/screens/sales/createPO'
import { NewQuotationModal } from '@/pages/admin/screens/sales/newQuotation'
import { QuotationDetail } from '@/pages/admin/screens/sales/quotationDetail'
import { FilterBar, FilterRow, ListPage } from '@/pages/admin/ui/list'
import { Pill } from '@/pages/admin/ui/status'

/** Products, compactly: first name + "+N" when there are more. Full list on hover. */
function ProductCell({ ids }: { ids: number[] }) {
  if (!ids.length) return <span className="text-faint">—</span>
  return (
    <span className="flex min-w-0 items-center gap-1.5" title={ids.map((i) => QUOTE_CATALOG[i].vi).join(' · ')}>
      <span className="truncate">{QUOTE_CATALOG[ids[0]].short}</span>
      {ids.length > 1 && <span className="shrink-0 rounded border border-line bg-canvas px-1 text-[10px] text-muted">+{ids.length - 1}</span>}
    </span>
  )
}

export function AdminQuotes() {
  /* PO creation lives HERE, not on the company detail page: an order can only come
     from an ACCEPTED quotation option, so the accepted row is the only place the
     action is ever valid. Company detail carries "Create quotation" instead. */
  const [poFor, setPoFor] = useState<Company | null>(null)
  const [open, setOpen] = useState<Quote | null>(null)
  /* Duplicating hands the copy straight to the builder, pre-filled with the target
     company — the rep lands on an editable draft rather than a confirmation. */
  const [dupFor, setDupFor] = useState<string | null>(null)
  const [fStatus, setFStatus] = useState('')
  const [qSort, setQSort] = useState<QuoteSort>('expires')
  /* Approval happens HERE, not on a screen of its own. An approver has to see the
     lines, the options and the customer before signing off on a percentage, and
     all of that already lives on the quotation — a separate "Approvals" page
     would be a second, thinner copy of this list plus a link back to it.
     What the approver needs is a way to FIND their requests, which is a filter.

     Same persona switcher as the Companies list, so "who am I" is answered once
     and the same way everywhere. */
  const [persona, setPersona] = useState<SalesPersona>(SALES_PERSONAS[1])
  const [queue, setQueue] = useState(false)
  /** Requests routed to THIS persona: matched on the role the rate escalates to. */
  const mine = (q: Quote) =>
    q.appr === 'pending' && q.special != null && apprRole(q.special) === persona.role &&
    (persona.role === 'manager' || teamBookOf(persona.name).has(q.reqBy ?? ''))
  const inbox = QUOTES.filter(mine)
  const goTo = useContext(ScreenNavCtx)
  /* Arrived via a cross-page link (e.g. from a PO row): open that quotation. Falls
     back to a stub so a PO can always link to its source even if the quotation is
     not one of the demo rows. */
  const handed = useContext(OpenRecordCtx)
  const linked = handed
    ? QUOTES.find((x) => x.code === handed) ?? {
        code: handed, customer: POS.find((p) => p.quote === handed)?.customer ?? '—', products: [1], options: 2,
        value: POS.find((p) => p.quote === handed)?.total ?? 0, status: 'Issued to PO' as QuoteStatus,
        created: '—', expires: '—',
      }
    : null
  const showing = open ?? linked
  if (showing) return (
    <>
      <QuotationDetail q={showing} persona={persona} onBack={() => { setOpen(null); if (handed) goTo('admin-quotes') }} onCreatePO={setPoFor} onDuplicate={setDupFor} />
      {dupFor && <NewQuotationModal company={dupFor} onClose={() => setDupFor(null)} />}
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </>
  )

  /* Status left the tab strip and moved into Filter, so this list carries the same
     Search · Filter · Sort toolbar as Companies. Tabs made status the ONE dimension
     worth narrowing by and spent a whole row saying so. */
  const shown = QUOTES
    .filter((q) => (queue ? mine(q) : true))
    .filter((q) => !fStatus || q.status === fStatus)
    .slice()
    .sort(QUOTE_SORTS[qSort].cmp)
  const rows = shown.map((q) => {
    return [
      <button onClick={() => setOpen(q)} className="min-w-0 truncate text-left font-mono text-[11.5px] font-medium text-brand hover:underline">{q.code}</button>,
      <span className="truncate">{q.customer}</span>,
      <ProductCell ids={q.products} />,
      <span className="tabular-nums text-muted">{q.options}</span>,
      <span className="tabular-nums">{q.value.toLocaleString('en-US')} ₫</span>,
      /* Status AND the approval flag, because a pending request is not a status —
         the quotation is still a Draft, it simply cannot be sent yet. */
      <span className="flex min-w-0 flex-wrap items-center gap-1">
        <Pill tone={QUOTE_TONE[q.status]}>{q.status}</Pill>
        {q.appr === 'pending' && q.special != null && (
          <Pill tone="schedule">⏳ {q.special}% · chờ {SALES_ROLE_LABEL[apprRole(q.special)]}</Pill>
        )}
        {q.appr === 'approved' && q.special != null && <Pill tone="active">✓ {q.special}% đã duyệt</Pill>}
        {q.appr === 'rejected' && <Pill tone="rejected">✕ từ chối</Pill>}
      </span>,
      <span className="tabular-nums text-muted">{q.created}</span>,
      <span className="tabular-nums text-muted">{q.expires}</span>,
    ]
  })

  return (
    <div>
      {/* Create action lives on the page title row (see PRIMARY_ACTION in AdminWireframe). */}
      <ListPage
        total={shown.length}
        searchHint="Tìm số báo giá, khách hàng…"
        leading={
          <span className="flex flex-wrap items-center gap-2">
            {/* Same control as the Companies list — one answer to "who am I". */}
            <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
              <span className="text-faint">Đang xem với tư cách</span>
              <select
                value={persona.name}
                onChange={(e) => { setPersona(SALES_PERSONAS.find((x) => x.name === e.target.value)!); setQueue(false) }}
                className="max-w-[210px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
              >
                {SALES_PERSONAS.map((x) => <option key={x.name} value={x.name}>{x.name} — {SALES_ROLE_LABEL[x.role]}</option>)}
              </select>
            </label>
            {/* Only a lead or a manager can have an inbox, so the control is absent
                for a plain rep rather than present and permanently empty. */}
            {persona.role !== 'rep' && (
              <button
                onClick={() => setQueue((v) => !v)}
                className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                  queue ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-line bg-surface text-muted hover:border-ink/30')}
              >
                ⏳ Chờ tôi duyệt
                <span className={cn('rounded-full px-1.5 text-[10px] font-semibold', queue ? 'bg-amber-600 text-white' : inbox.length ? 'bg-amber-100 text-amber-800' : 'bg-canvas text-faint')}>{inbox.length}</span>
              </button>
            )}
          </span>
        }
        filters={
          <FilterBar count={fStatus ? 1 : 0} onClear={() => setFStatus('')}>
            <FilterRow label="Status" value={fStatus} onChange={setFStatus} options={['Draft', 'Sent', 'Issued to PO', 'Expired']} />
          </FilterBar>
        }
        sort={
          <label className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-muted">
            <span className="text-faint">Sắp xếp</span>
            <select
              value={qSort}
              onChange={(e) => setQSort(e.target.value as QuoteSort)}
              className="max-w-[170px] cursor-pointer bg-transparent text-[11.5px] font-medium text-ink outline-none"
            >
              {(Object.keys(QUOTE_SORTS) as QuoteSort[]).map((k) => <option key={k} value={k}>{QUOTE_SORTS[k].label}</option>)}
            </select>
          </label>
        }
        cols={[
          { label: 'Quotation', w: '1.4fr' }, { label: 'Customer', w: '1.3fr' }, { label: 'Products', w: '1.2fr' },
          { label: 'Options', w: '0.6fr' }, { label: 'Value', w: '1.1fr', align: 'r' }, { label: 'Status', w: '2.3fr' },
          { label: 'Created', w: '0.8fr' }, { label: 'Expires', w: '0.8fr' },
        ]}
        rows={rows}
        minW={1000}
      />
      {poFor && <CreatePOModal c={poFor} onClose={() => setPoFor(null)} />}
    </div>
  )
}
