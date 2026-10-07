import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CALLS, LINK_SOURCE, needsLink } from '@/pages/admin/data/callLink'
import type { CallRow, LinkSource } from '@/pages/admin/data/callLink'
import { ME } from '@/pages/admin/data/salesOrg'
import { LinkCallForm } from '@/pages/admin/screens/calls/callLink'
import { ListPage } from '@/pages/admin/ui/list'

/*
 * CRM → CALL LOGS — every call Callio reported, and which company it is on.
 *
 * The build's page (/call-center/logs) already has the columns the client asked for —
 * Company and Contact person — but on dev they are empty for almost half the rows (11,709
 * of 25,617 wait in Needs assigning). The proposal changes how they get FILLED, not the
 * page: a call started from the CRM fills them itself, a call dialled straight in Callio
 * is filled by the rep who made it. This page adds what that needs to be read:
 *
 *   · LINKED BY — how each call got onto its company (CRM call · Number · Rep · Admin), so
 *     the waiting rows are the exception and management can see whether reps start their
 *     calls from the CRM at all;
 *   · MY CALLS TO LINK — the rep's own waiting calls, which they can link themselves;
 *   · the summary line — the same split, counted, for today.
 *
 * Needs assigning stays as the build has it (admin, every waiting call, the three reasons).
 */

type Tab = 'all' | 'mine' | 'queue' | 'archived'

const OUTCOME_TONE: Record<CallRow['outcome'], string> = {
  Answered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Missed: 'border-rose-200 bg-rose-50 text-rose-700',
  Busy: 'border-slate-200 bg-slate-100 text-slate-600',
  Failed: 'border-rose-200 bg-rose-50 text-rose-700',
  Abandoned: 'border-slate-200 bg-slate-100 text-slate-600',
}

function Chip({ tone, children, title }: { tone: string; children: React.ReactNode; title?: string }) {
  return <span title={title} className={cn('inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium', tone)}>{children}</span>
}

export function AdminCallLogs() {
  const [tab, setTab] = useState<Tab>('all')
  /* local overrides so a reviewer can link / archive and watch the row move */
  const [linked, setLinked] = useState<Record<string, { company: string; contact: string; source: LinkSource }>>({})
  const [archived, setArchived] = useState<Record<string, boolean>>({})
  const [linking, setLinking] = useState<CallRow | null>(null)

  const calls: CallRow[] = CALLS.map((r) => {
    const l = linked[r.id]
    const a = archived[r.id]
    return { ...r, ...(l ?? {}), archived: a === undefined ? r.archived : a, reason: l ? undefined : r.reason }
  })
  const waiting = calls.filter(needsLink)
  const mine = waiting.filter((r) => r.rep === ME)
  const answered = calls.filter((r) => r.outcome === 'Answered' && !r.archived)
  const by = (s: LinkSource) => answered.filter((r) => r.source === s).length

  const rows = tab === 'all' ? calls.filter((r) => !r.archived) : tab === 'mine' ? mine : tab === 'queue' ? waiting : calls.filter((r) => r.archived)
  const others = (r: CallRow) => waiting.filter((x) => x.phone === r.phone && x.id !== r.id).length

  const tabs: { k: Tab; label: string; n: number; hint: string }[] = [
    { k: 'all', label: 'All calls', n: calls.filter((r) => !r.archived).length, hint: 'Every call Callio reported' },
    { k: 'mine', label: 'My calls to link', n: mine.length, hint: `Answered calls ${ME} made that no company holds — link them yourself` },
    { k: 'queue', label: 'Needs assigning', n: waiting.length, hint: 'Admin — every waiting call: No company · Several companies · No rep' },
    { k: 'archived', label: 'Archived', n: calls.filter((r) => r.archived).length, hint: 'Not customer work — spam, wrong numbers, personal calls' },
  ]

  return (
    <div>
      {/* how today's answered calls got onto a company — the adoption number. A team
          whose calls are mostly Rep / Admin is dialling from Callio, not from the CRM. */}
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[11.5px]">
        <span className="font-semibold text-ink">Today · {answered.length} answered calls</span>
        {(['crm-call', 'number', 'rep', 'admin'] as LinkSource[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5" title={LINK_SOURCE[s].hint}>
            <Chip tone={LINK_SOURCE[s].tone}>{LINK_SOURCE[s].label}</Chip>
            <b className="tabular-nums text-ink">{by(s)}</b>
          </span>
        ))}
        <span className="flex items-center gap-1.5" title={LINK_SOURCE.none.hint}>
          <Chip tone={LINK_SOURCE.none.tone}>Waiting</Chip>
          <b className="tabular-nums text-amber-800">{waiting.length}</b>
        </span>
        <button className="ml-auto rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Sync from Callio</button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-0.5 border-b border-line-soft">
        {tabs.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            title={t.hint}
            className={cn('relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-medium', tab === t.k ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink')}
          >
            {t.label}
            <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', t.k === 'mine' && t.n > 0 ? 'bg-amber-100 font-bold text-amber-800' : tab === t.k ? 'bg-brand text-white' : 'bg-canvas text-faint')}>{t.n}</span>
          </button>
        ))}
      </div>
      {tab === 'mine' && (
        <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-900">
          Calls you made from Callio that no company holds the number of. You know who was on the line — link them here, or in the <b>Calls to link</b> tray that opens after each such call. Saving the number on the contact makes the next call from it link on its own.
        </p>
      )}

      {/* Column order is the proposal's, not the build's: WHO was called (phone → company →
          contact → how it was linked) reads first, the telephony detail after it, and the
          vendor's call ID last — it is a key for support, not something a rep reads. */}
      <ListPage
        minW={1420}
        searchHint="Phone number, company, contact…"
        cols={[
          { label: 'Phone', w: '0.95fr' },
          { label: 'Company', w: '1.6fr' },
          { label: 'Contact person', w: '1.1fr' },
          { label: 'Linked by', w: '0.8fr' },
          { label: 'Sales owner', w: '1.05fr' },
          { label: 'Start time', w: '0.95fr' },
          { label: 'Call type', w: '0.7fr' },
          { label: 'Status', w: '0.75fr' },
          { label: 'Duration', w: '0.7fr' },
          { label: 'Record', w: '0.5fr' },
          { label: 'Call ID', w: '0.95fr' },
          { label: '', w: '0.55fr', align: 'r' },
        ]}
        rows={rows.map((r) => {
          const canLink = needsLink(r)
          return [
            <span className="font-mono text-[11.5px] text-ink">{r.phone}</span>,
            r.company
              ? <span className="truncate font-medium text-brand">{r.company}</span>
              : (
                <span className="flex min-w-0 items-center gap-1.5">
                  {r.reason && <Chip tone="border-amber-200 bg-amber-50 text-amber-800">{r.reason}</Chip>}
                  {canLink && <button onClick={() => setLinking(r)} className="rounded-md bg-brand px-2 py-0.5 text-[11px] font-semibold text-white hover:opacity-90">Link</button>}
                  {!r.reason && !canLink && <span className="text-faint">—</span>}
                </span>
              ),
            r.contact ? <span className={cn('truncate text-[12px]', r.contact.startsWith('—') ? 'text-faint' : 'text-ink/85')}>{r.contact}</span> : <span className="text-faint">—</span>,
            <Chip tone={LINK_SOURCE[r.source].tone} title={LINK_SOURCE[r.source].hint}>{LINK_SOURCE[r.source].label}</Chip>,
            r.rep ? <span className="truncate text-[12px] text-ink/85">{r.rep}</span> : <span className="truncate text-[11.5px] text-amber-800" title="No admin is bound to this extension — bind it to credit the rep">ext {r.ext} — not bound</span>,
            <span className="text-[11.5px] tabular-nums text-muted">{r.date} {r.time}</span>,
            <span className="text-[11.5px] text-muted">{r.dir}</span>,
            <Chip tone={OUTCOME_TONE[r.outcome]}>{r.outcome}</Chip>,
            <span className="text-[11.5px] tabular-nums text-muted">{r.dur}</span>,
            r.record ? <button className="text-[11.5px] font-medium text-brand hover:underline">▶ Play</button> : <span className="text-faint">—</span>,
            <span className="truncate font-mono text-[11px] text-faint">{r.id}</span>,
            r.archived
              ? <button onClick={() => setArchived((a) => ({ ...a, [r.id]: false }))} className="text-[11.5px] font-medium text-brand hover:underline">Unarchive</button>
              : <span />,
          ]
        })}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b className="text-muted">Linked by</b> says how a call got onto its company: <b className="text-muted">CRM call</b> — started from the Call button on the company (the rep chose the company and contact before dialling) · <b className="text-muted">Number</b> — exactly one company holds the number · <b className="text-muted">Rep</b> — linked by the rep who made the call · <b className="text-muted">Admin</b> — assigned from Needs assigning.
        Only answered calls ask to be linked: a missed call writes no activity, so filing one would be work with nothing at the end of it.
      </p>

      {linking && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
          <div className="my-10 w-full max-w-[440px] rounded-2xl border border-line bg-surface p-5 shadow-2xl">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Link this call</h3>
            <p className="mt-0.5 text-[12px] text-muted">
              <span className="font-mono text-ink/80">{linking.phone}</span> · {linking.dir} · {linking.dur.slice(3)} · {linking.time} · {linking.rep || `ext ${linking.ext}`} — {linking.reason === 'Several companies' ? 'several companies hold this number.' : 'no company holds this number.'}
            </p>
            <div className="mt-3">
              <LinkCallForm
                call={linking}
                others={others(linking)}
                onCancel={() => setLinking(null)}
                onArchive={() => { setArchived((a) => ({ ...a, [linking.id]: true })); setLinking(null) }}
                onLink={(company, contact) => {
                  const src: LinkSource = linking.rep === ME ? 'rep' : 'admin'
                  setLinked((m) => ({ ...m, [linking.id]: { company, contact, source: src } }))
                  setLinking(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
