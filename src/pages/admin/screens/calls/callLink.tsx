import { useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { COMPANIES, coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { CALL, companyContacts } from '@/pages/admin/data/companyRecord'
import type { CoEvent } from '@/pages/admin/data/companyRecord'
import { callTargets } from '@/pages/admin/data/callLink'
import type { CallRow, CallTarget } from '@/pages/admin/data/callLink'
import { ME } from '@/pages/admin/data/salesOrg'
import { EmbeddedCtx } from '@/pages/admin/ctx'
import { searchKey } from '@/pages/admin/ui/table'

/*
 * THE CALL CARD — "Log an activity → Call" on the company record, rebuilt around the one
 * thing the CRM can know that Callio cannot: WHICH company and WHICH person the rep meant
 * to ring.
 *
 * Callio cannot be dialled from here (no dial endpoint, no auto-dial URL parameter — the
 * build's own finding). So the card does not pretend to place the call. Its button does
 * what the rep already does by hand — copy the number, open Callio — and in the same
 * click records a CRM CALL: rep · company · contact · number · time. When Callio's
 * call-end webhook lands (seconds after hang-up), svn-be pairs the two and the call is on
 * this company, with this contact, before the rep has finished typing the note.
 *
 * Five states, in the order a call lives through them. Tones follow the build's status
 * vocabulary: amber = waiting on someone, green = done, grey = nothing to do, rose = gone.
 */

type CallState = 'pick' | 'calling' | 'answered' | 'noanswer' | 'notfound'

const RESULTS = ['Interested', 'Call back later', 'Not interested', 'Wrong number'] as const

const WAITING = 'bg-amber-100 text-amber-700'
const ATTEMPT = 'bg-slate-100 text-slate-500'

function Btn({ children, onClick, primary, small, disabled, title }: { children: React.ReactNode; onClick?: () => void; primary?: boolean; small?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-40',
        small ? 'px-2.5 py-1 text-[11.5px]' : 'px-3.5 py-1.5 text-[12px]',
        primary ? 'bg-brand text-white hover:opacity-90' : 'border border-line font-medium text-muted hover:border-ink/40 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

const PhoneIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
)

/** The prototype's stand-in for Callio, so a reviewer can walk every state. Drawn as a
    dashed amber box and labelled, so nobody reads it as part of the screen. */
function Simulate({ onPick }: { onPick: (s: 'answered' | 'noanswer' | 'notfound') => void }) {
  return (
    <div className="mt-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2">
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-amber-800">Prototype only — simulate what Callio reports</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button onClick={() => onPick('answered')} className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-900 hover:border-amber-500">Call-end webhook · Answered · 2m 14s</button>
        <button onClick={() => onPick('noanswer')} className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-900 hover:border-amber-500">Missed-call webhook · Busy</button>
        <button onClick={() => onPick('notfound')} className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-900 hover:border-amber-500">Nothing arrives within 30 min</button>
      </div>
    </div>
  )
}

export function CallCard({ c, prefer, onLive, onDone, onClose }: {
  c: Company
  /** a target already chosen elsewhere (the phone icon on a contact row) — the card opens
      straight in "calling", because that click WAS the Copy & open Callio */
  prefer?: string
  /** the row the feed shows while this call is live; null clears it */
  onLive: (row: CoEvent | null) => void
  /** the row to keep in the feed once the rep is done; null = nothing to keep */
  onDone: (row: CoEvent | null) => void
  onClose: () => void
}) {
  const targets = callTargets(c)
  const preferred = targets.find((t) => t.name === prefer)
  const [state, setState] = useState<CallState>(preferred ? 'calling' : 'pick')
  const [target, setTarget] = useState<CallTarget | null>(preferred ?? null)
  const [result, setResult] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [other, setOther] = useState('')
  const [copied, setCopied] = useState(false)

  const row = (s: CallState, t: CallTarget): CoEvent | null => {
    const base = { icon: '', time: 'just now', kind: 'sales' as const, days: 0, by: ME }
    const who = t.companyLine ? `${t.name} (${t.number})` : t.name
    if (s === 'calling') return { ...base, tone: WAITING, title: `Call · ${who}`, sub: `Calling ${t.number} — waiting for Callio. Linked to ${coLabel(c)} by the Call click.` }
    if (s === 'answered') return { ...base, tone: CALL, title: `Call · ${who}`, sub: `${note.trim() || 'No note yet.'}${result ? ` · ${result}` : ''} · Outbound · Answered · 2m 14s · ▶ recording · Linked by: CRM call` }
    if (s === 'noanswer') return { ...base, tone: ATTEMPT, title: `Call attempt · ${who}`, sub: 'Callio: Busy · 0:00 — on the call log for this company; not contact, Idle unchanged.' }
    return null
  }

  useEffect(() => {
    if (preferred) onLive(row('calling', preferred))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = (t: CallTarget) => {
    setTarget(t); setState('calling'); setCopied(true)
    onLive(row('calling', t))
  }
  const report = (s: 'answered' | 'noanswer' | 'notfound') => {
    setState(s)
    if (target) onLive(s === 'notfound' ? row('calling', target) : row(s, target))
  }

  /* ── 1 · pick — who are you calling? ───────────────────────────────────────── */
  if (state === 'pick') {
    return (
      <div className="mt-3 space-y-2.5">
        <div>
          <p className="text-[12px] font-semibold text-ink">Who are you calling?</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
            Callio can’t be dialled from the CRM. <b className="text-muted">Copy &amp; open Callio</b> copies the number, opens Callio, and links the call to <b className="text-muted">{coLabel(c)}</b> the moment Callio reports it — usually seconds after you hang up.
          </p>
        </div>
        <div className="divide-y divide-line-soft overflow-hidden rounded-lg border border-line">
          {targets.map((t) => (
            <div key={t.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                  {t.name}
                  {t.companyLine && <span className="rounded border border-line bg-canvas px-1 py-0.5 text-[9.5px] font-semibold text-muted">COMPANY LINE</span>}
                </p>
                <p className="text-[11px] text-faint">
                  <span className="font-mono text-ink/70">{t.number}</span> · {t.title} · {t.inCallio ? 'opens their Callio inbox' : 'opens Callio — paste the number'}
                </p>
              </div>
              <Btn primary small onClick={() => start(t)}><PhoneIcon />Copy &amp; open Callio</Btn>
            </div>
          ))}
          {/* A number the record does not hold yet — the call still links, and the
              number is offered for saving once Callio confirms it was the one dialled. */}
          <div className="flex flex-wrap items-center gap-2 bg-canvas/40 px-3 py-2">
            <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Another number…" className="w-[150px] rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[12px] outline-none placeholder:font-sans placeholder:text-faint focus:border-brand" />
            <span className="text-[11px] text-faint">for</span>
            <select className="cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] text-ink/80 outline-none focus:border-brand">
              {targets.filter((t) => !t.companyLine).map((t) => <option key={t.key}>{t.name}</option>)}
              <option>Company only</option>
            </select>
            <Btn small disabled={other.trim().length < 9} onClick={() => start({ key: 'other', name: targets[0]?.name ?? 'Contact', title: 'new number', number: other.trim(), inCallio: false })}><PhoneIcon />Copy &amp; open Callio</Btn>
          </div>
        </div>
        <div className="flex justify-end">
          <Btn onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    )
  }

  const t = target!
  const noteBlock = (
    <>
      <div>
        <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Result <span className="font-normal text-faint">optional</span></label>
        <div className="flex flex-wrap gap-1.5">
          {RESULTS.map((r) => (
            <button key={r} onClick={() => setResult(result === r ? null : r)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', result === r ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{r}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What did you talk about? What happens next?" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
      </div>
    </>
  )

  return (
    <div className="mt-3 space-y-2.5">
      {/* the strip that says what the call IS right now — one line, one tone */}
      {state === 'calling' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" /></span>
            <p className="text-[12.5px] font-semibold text-amber-900">Calling {t.name} · <span className="font-mono">{t.number}</span></p>
            <span className="ml-auto text-[11px] text-amber-800">started 14:05 · waiting for Callio</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-900/80">
            {copied ? <><b>{t.number}</b> copied — paste it in Callio and press Call. </> : 'Callio opened in a new tab. '}
            <button className="font-semibold text-amber-900 underline-offset-2 hover:underline">Open Callio again ↗</button>
            {' · '}
            <button onClick={() => setCopied(true)} className="font-semibold text-amber-900 underline-offset-2 hover:underline">Copy again</button>
          </p>
        </div>
      )}
      {state === 'answered' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-semibold text-emerald-800">✓ Callio call found</span>
            <span className="text-[11.5px] text-emerald-900/80">{t.name} · <span className="font-mono">{t.number}</span> · Outbound · Answered · <b>2m 14s</b> · ext 10005</span>
            <button className="ml-auto rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:border-emerald-500">▶ Play recording</button>
          </div>
          <p className="mt-1 text-[11px] text-emerald-900/75">Linked by your Call click — same number, the Callio call started 1 minute after it. It is on {coLabel(c)}’s activity and on the call log with {t.companyLine ? 'the company line' : t.name}.</p>
        </div>
      )}
      {state === 'noanswer' && (
        <div className="rounded-lg border border-line bg-canvas px-3 py-2">
          <p className="text-[12.5px] font-semibold text-ink/80">Callio: no answer <span className="font-normal text-muted">(Busy · 0:00)</span></p>
          <p className="mt-0.5 text-[11px] text-muted">The attempt is on the call log under {coLabel(c)}, but nobody spoke — it is not contact, so Idle does not change and it does not count as a KPI call.</p>
        </div>
      )}
      {state === 'notfound' && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
          <p className="text-[12.5px] font-semibold text-rose-800">No Callio call to <span className="font-mono">{t.number}</span> within 30 minutes</p>
          <p className="mt-0.5 text-[11px] text-rose-900/80">A call made from a mobile or Zalo leaves no Callio record — no recording, no ranking. Keep it as a manual call note (counts as contact, nothing to play), or discard it.</p>
        </div>
      )}

      {(state === 'calling' || state === 'answered') && noteBlock}

      <div className="flex flex-wrap justify-end gap-2">
        {state === 'calling' && <><Btn onClick={() => { onLive(null); onClose() }}>Cancel call</Btn><Btn primary onClick={() => { onDone(row('calling', t)); onLive(null); onClose() }} title="The note is saved now; Callio's facts join it when the call arrives">Save note</Btn></>}
        {state === 'answered' && <Btn primary onClick={() => { onDone(row('answered', t)); onLive(null); onClose() }}>Save</Btn>}
        {state === 'noanswer' && <><Btn onClick={() => { onDone(row('noanswer', t)); onLive(null); onClose() }}>Close</Btn><Btn primary onClick={() => { onDone(row('noanswer', t)); start(t) }}><PhoneIcon />Call again</Btn></>}
        {state === 'notfound' && <><Btn onClick={() => { onLive(null); onClose() }}>Discard</Btn><Btn primary onClick={() => { onDone({ icon: '', tone: CALL, title: `Call · ${t.name} (manual)`, sub: `${note.trim() || 'Logged by hand — no Callio record.'} · no recording`, time: 'just now', kind: 'sales', days: 0, by: ME }); onLive(null); onClose() }}>Keep as manual note</Btn></>}
      </div>

      {state === 'calling' && <Simulate onPick={report} />}
    </div>
  )
}

/*
 * THE LINK FORM — one form for every place a call is put on a company by hand: the rep's
 * Calls to link tray and the admin's Needs assigning. Same fields as the build's Assign
 * dialog (company · contact person · save the number · the other waiting calls from it),
 * plus the one suggestion only the rep's own session can make: the companies they had
 * open just before the call.
 */
export function LinkCallForm({ call, others, onLink, onArchive, onCancel }: {
  call: CallRow
  /** other waiting calls from the same number */
  others: number
  onLink: (company: string, contact: string) => void
  onArchive: () => void
  onCancel?: () => void
}) {
  const [q, setQ] = useState('')
  const [company, setCompany] = useState<Company | null>(null)
  const [contact, setContact] = useState<string>('')
  const [save, setSave] = useState(true)
  const [all, setAll] = useState(true)
  const live = COMPANIES.filter((x) => !x.archived)
  const hits = q.trim() ? live.filter((x) => searchKey(`${x.name} ${x.shortName} ${x.tax}`).includes(searchKey(q.trim()))).slice(0, 5) : []
  /* The rep almost always looked the company up right before dialling — so the records
     they opened in the last hour are the best guess the system has. For a shared number,
     the companies that hold it come first. */
  const suggested = call.reason === 'Several companies'
    ? [{ c: live.find((x) => x.name === 'Công ty TNHH Đại Dương')!, why: 'holds this number' }, { c: live.find((x) => x.name === 'Công ty CP Bình Minh') ?? live[1], why: 'holds this number' }]
    : [{ c: live.find((x) => x.name === 'Công ty CP An Khang') ?? live[0], why: 'opened by you 2 min before the call' }, { c: live.find((x) => x.name === 'Công ty TNHH Phú Thịnh') ?? live[2], why: 'opened by you today' }]
  const people = company ? companyContacts(company).filter((p) => p.status !== 'No longer here') : []

  return (
    <div className="space-y-2.5">
      {!company ? (
        <div>
          <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Company <span className="text-rose-500">*</span></label>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company — name or MST" className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-faint focus:border-brand" />
          <div className="mt-1.5 overflow-hidden rounded-md border border-line">
            {(hits.length ? hits.map((x) => ({ c: x, why: '' })) : suggested).map(({ c: x, why }) => (
              <button key={x.name} onClick={() => setCompany(x)} className="flex w-full items-center justify-between gap-2 border-t border-line-soft px-2.5 py-1.5 text-left first:border-t-0 hover:bg-canvas">
                <span className="min-w-0 truncate text-[12px] font-medium text-ink">{coLabel(x)}</span>
                <span className="shrink-0 text-[10.5px] text-faint">{why || x.owner}</span>
              </button>
            ))}
          </div>
          {!hits.length && <p className="mt-1 text-[10.5px] text-faint">{call.reason === 'Several companies' ? 'Several companies hold this number — pick the one you were calling.' : 'Suggested: the companies you had open around the call.'}</p>}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-canvas/50 px-2.5 py-1.5">
            <span className="min-w-0 truncate text-[12px]"><span className="text-faint">Company · </span><b className="text-ink">{coLabel(company)}</b></span>
            <button onClick={() => { setCompany(null); setContact('') }} className="shrink-0 text-[11px] font-medium text-brand hover:underline">Change</button>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Contact person</label>
            <div className="space-y-1">
              {[...people.map((p) => p.name), '+ New contact with this number', 'Company only'].map((name) => (
                <label key={name} className={cn('flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px]', contact === name ? 'border-brand bg-brand-soft/60' : 'border-line hover:border-ink/30')}>
                  <input type="radio" checked={contact === name} onChange={() => setContact(name)} className="accent-brand" />
                  <span className={cn(name.startsWith('+') ? 'font-medium text-brand' : 'text-ink/85')}>{name}</span>
                  {name === people[0]?.name && <span className="ml-auto text-[10px] text-faint">primary</span>}
                </label>
              ))}
            </div>
          </div>
          {contact && contact !== 'Company only' && (
            <label className="flex items-start gap-2 text-[11.5px] text-ink/80">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="mt-0.5 accent-brand" />
              <span>Save <b className="font-mono">{call.phone}</b> on {contact.startsWith('+') ? 'the new contact' : contact} — later calls from it link on their own.</span>
            </label>
          )}
          {contact === 'Company only' && <p className="text-[10.5px] leading-relaxed text-amber-800">Only this call is filed. The number is not saved, so the next call from it will ask again.</p>}
          {others > 0 && (
            <label className="flex items-start gap-2 text-[11.5px] text-ink/80">
              <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="mt-0.5 accent-brand" />
              <span>Also link the {others} other waiting call{others > 1 ? 's' : ''} from this number</span>
            </label>
          )}
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <button onClick={onArchive} className="text-[11px] font-medium text-muted hover:text-rose-700" title="Spam, wrong number, personal call — archived, never put on a company">Not a customer — archive</button>
        <div className="flex gap-2">
          {onCancel && <Btn small onClick={onCancel}>Cancel</Btn>}
          <Btn primary small disabled={!company || !contact} onClick={() => company && onLink(coLabel(company), contact === 'Company only' ? '—' : contact.startsWith('+') ? `New contact (${call.phone})` : contact)}>Link</Btn>
        </div>
      </div>
    </div>
  )
}

/*
 * CALLS TO LINK — the rep's own answered calls Callio could not place, in a tray at the
 * bottom-right of the console. It opens by itself when the call-end webhook brings one in
 * ("You just called…"), because the rep is the only person who knows who was on the line,
 * and the best moment to ask is the minute after they hung up — not an admin, tomorrow.
 */
export function CallsToLinkTray({ calls, onLinked, onArchived, floating = true }: {
  calls: CallRow[]
  onLinked: (id: string, company: string, contact: string) => void
  onArchived: (id: string) => void
  floating?: boolean
}) {
  /* Three sizes, so it asks once and then gets out of the way: the TOAST is what pops when
     Callio reports a call nobody can place ("You just called…"); LATER folds it to a pill
     that keeps the count; the PANEL is the backlog, opened from either. */
  const [mode, setMode] = useState<'toast' | 'pill' | 'panel'>('toast')
  const [linking, setLinking] = useState<string | null>(null)
  const embedded = useContext(EmbeddedCtx)
  if (calls.length === 0 && mode !== 'panel') return null
  const fresh = calls[0]
  /* Fixed to the console window — but inside a spec page's preview box it is STICKY to
     the box instead, or it would escape the preview and sit on top of the spec page. The
     screen mounts it as its LAST child, which is what sticky needs. */
  const wrap = !floating ? '' : embedded ? 'sticky bottom-4 z-40 ml-auto' : 'fixed bottom-24 right-6 z-40'
  if (mode === 'pill') {
    return (
      <div className={cn(wrap, 'w-fit')}>
        <button onClick={() => setMode('panel')} className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-[12px] font-semibold text-amber-900 shadow-lg hover:border-amber-500">
          <PhoneIcon /> {calls.length} call{calls.length === 1 ? '' : 's'} to link
        </button>
      </div>
    )
  }
  if (mode === 'toast' && fresh) {
    return (
      <div className={cn(wrap, 'w-[340px] overflow-hidden rounded-xl border border-amber-300 bg-surface shadow-2xl')}>
        <div className="flex items-start gap-2.5 px-3.5 py-3">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800"><PhoneIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-ink">You just called <span className="font-mono">{fresh.phone}</span></p>
            <p className="text-[11px] text-muted">{fresh.dur.slice(3)} · no company has this number. Which company was it?</p>
            <div className="mt-2 flex gap-2">
              <Btn small primary onClick={() => { setLinking(fresh.id); setMode('panel') }}>Link now</Btn>
              <Btn small onClick={() => setMode('pill')}>Later</Btn>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={cn(wrap, floating ? 'w-[380px]' : 'w-full max-w-[420px]')}>
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-line-soft bg-canvas/60 px-3.5 py-2.5">
          <div>
            <p className="text-[13px] font-bold text-ink">Calls to link <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10.5px] font-semibold text-amber-800">{calls.length}</span></p>
            <p className="text-[10.5px] text-faint">Your answered calls Callio couldn’t put on a company.</p>
          </div>
          <button onClick={() => { setMode('pill'); setLinking(null) }} className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-canvas" title="Minimise">–</button>
        </div>
        {calls.length === 0 ? (
          <p className="px-3.5 py-4 text-center text-[12px] text-muted">All your calls are on a company. ✓</p>
        ) : (
          <div className="max-h-[440px] divide-y divide-line-soft overflow-y-auto">
            {calls.map((r) => (
              <div key={r.id} className="px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12.5px] font-semibold text-ink">{r.phone}</p>
                    <p className="text-[10.5px] text-faint">{r.dir} · {r.dur.slice(3)} · {r.time} · {r.reason}</p>
                  </div>
                  {linking !== r.id && <Btn small primary onClick={() => setLinking(r.id)}>Link</Btn>}
                </div>
                {linking === r.id && (
                  <div className="mt-2">
                    <LinkCallForm
                      call={r}
                      others={0}
                      onCancel={() => setLinking(null)}
                      onArchive={() => { onArchived(r.id); setLinking(null) }}
                      onLink={(co, ct) => { onLinked(r.id, co, ct); setLinking(null) }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
