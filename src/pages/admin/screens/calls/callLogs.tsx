import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CALLS, LINK_SOURCE, needsLink } from '@/pages/admin/data/callLink'
import type { CallRow, LinkSource } from '@/pages/admin/data/callLink'
import { ME } from '@/pages/admin/data/salesOrg'
import { ListPage } from '@/pages/admin/ui/list'

/*
 * CRM → CALL LOGS — every call Callio reported, and which company it is on.
 *
 * The build's page (/call-center/logs) already has the columns the client asked for —
 * Company and Contact person — but on dev they are empty for almost half the rows (11,709
 * of 25,617 wait in Needs assigning). The proposal changes how they get FILLED, not the
 * page: a call started from the CRM fills them itself, and a call dialled straight in
 * Callio gets the two fixes its number cannot give it:
 *
 *   · SEVERAL COMPANIES hold the number → the Company cell lists them and the rep picks
 *     the one they called (no form — the candidates ARE the choice);
 *   · NO COMPANY holds it → the rep saves the number on the contact, then SYNC FROM CRM
 *     re-matches the waiting calls. The build never re-matches them on its own: UNMATCHED
 *     and AMBIGUOUS rows stay waiting even after the number is in the CRM.
 *
 * Plus what that needs to be read: LINKED BY (how each call got onto its company), MY
 * CALLS TO LINK (the rep's own waiting calls) and the summary line (the same split,
 * counted, for today). Needs assigning stays as the build has it.
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

/** "Công ty TNHH Đại Dương" → "Đại Dương" — two candidates have to fit one cell */
const short = (name: string) => name.replace(/^Công ty (TNHH|CP)\s+/, '')

export function AdminCallLogs() {
  const [tab, setTab] = useState<Tab>('all')
  /* local overrides so a reviewer can pick / sync and watch the row move */
  const [linked, setLinked] = useState<Record<string, { company: string; contact: string; source: LinkSource }>>({})
  const [archived, setArchived] = useState<Record<string, boolean>>({})
  const [synced, setSynced] = useState<string | null>(null)

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

  /* The rep who made the call picks; anyone else picking is an admin settling the queue. */
  const pick = (r: CallRow, k: { company: string; contact: string }) =>
    setLinked((m) => ({ ...m, [r.id]: { company: k.company, contact: k.contact, source: r.rep === ME ? 'rep' : 'admin' } }))
  /* SYNC FROM CRM — the number match again, for every call still waiting, against the
     numbers the CRM holds NOW. In the prototype "now" is the seed's savedSince. */
  const syncFromCrm = () => {
    const hits = waiting.filter((r) => r.savedSince)
    setLinked((m) => ({ ...m, ...Object.fromEntries(hits.map((r) => [r.id, { ...r.savedSince!, source: 'number' as const }])) }))
    setSynced(`${hits.length} call${hits.length === 1 ? '' : 's'} linked by Number · ${waiting.length - hits.length} still waiting`)
  }

  const tabs: { k: Tab; label: string; n: number; hint: string }[] = [
    { k: 'all', label: 'All calls', n: calls.filter((r) => !r.archived).length, hint: 'Every call Callio reported' },
    { k: 'mine', label: 'My calls to link', n: mine.length, hint: `Answered calls ${ME} made that are on no company yet` },
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
        {/* Two syncs, because they close different gaps: Callio → the calls themselves;
            CRM → numbers saved on contacts since a call came in. */}
        <span className="ml-auto flex items-center gap-2">
          {synced && <span className="text-[11px] font-medium text-emerald-700">✓ {synced}</span>}
          <button
            onClick={syncFromCrm}
            title="Re-match every waiting call against the numbers in the CRM now — a number saved on a contact links the calls already waiting from it"
            className="rounded-lg border border-brand/40 bg-surface px-3 py-1.5 text-[12px] font-semibold text-brand hover:border-brand"
          >
            Sync from CRM
          </button>
          <button className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Sync from Callio</button>
        </span>
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
          Your answered calls that are on no company yet. <b>Several companies</b> hold the number → pick the one you called. <b>No company</b> holds it → save the number on the contact in the CRM, then <b>Sync from CRM</b>: this call and every later one from that number link on their own.
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
        rows={rows.map((r) => [
          <span className="font-mono text-[11.5px] text-ink">{r.phone}</span>,
          r.company
            ? <span className="truncate font-medium text-brand">{r.company}</span>
            : r.candidates && !r.archived
              ? (
                /* a shared number: the companies holding it ARE the choice — one click
                   files the call there, with the contact who holds the number there */
                <span className="flex min-w-0 flex-col gap-1 py-0.5">
                  <span className="text-[10.5px] font-medium text-amber-800">Several companies — pick one</span>
                  <span className="flex flex-wrap gap-1">
                    {r.candidates.map((k) => (
                      <button
                        key={k.company}
                        onClick={() => pick(r, k)}
                        title={`File this call on ${k.company} — ${k.contact} holds this number there`}
                        className="max-w-full truncate rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-brand hover:border-brand hover:bg-brand-soft"
                      >
                        {short(k.company)}
                      </button>
                    ))}
                  </span>
                </span>
              )
              : r.reason
                ? <Chip tone="border-amber-200 bg-amber-50 text-amber-800" title="No company holds this number — save it on the contact, then Sync from CRM">{r.reason}</Chip>
                : <span className="text-faint">—</span>,
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
        ])}
      />
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        <b className="text-muted">Linked by</b> says how a call got onto its company: <b className="text-muted">CRM call</b> — copied from the Call card on the company (the rep chose the company and contact before dialling) · <b className="text-muted">Number</b> — exactly one company holds the number, when the call came in or on Sync from CRM · <b className="text-muted">Rep</b> — picked by the rep who made the call, when several companies hold the number · <b className="text-muted">Admin</b> — assigned from Needs assigning.
        Only answered calls wait to be linked: a missed call writes no activity, so filing one would be work with nothing at the end of it.
      </p>
    </div>
  )
}
