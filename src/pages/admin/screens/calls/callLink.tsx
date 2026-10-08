import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { CALL } from '@/pages/admin/data/companyRecord'
import type { CoEvent } from '@/pages/admin/data/companyRecord'
import { callTargets } from '@/pages/admin/data/callLink'
import type { CallTarget } from '@/pages/admin/data/callLink'
import { ME } from '@/pages/admin/data/salesOrg'

/*
 * THE CALL CARD — "Log an activity → Call" on the company record, rebuilt around the one
 * thing the CRM can know that Callio cannot: WHICH company and WHICH person the rep meant
 * to ring.
 *
 * Callio cannot be dialled from here (no dial endpoint, no auto-dial URL parameter — the
 * build's own finding). So the card does not pretend to place the call, nor open Callio —
 * reps keep it open in a tab of its own. Its one button, COPY, does what the rep already
 * does by hand, and in the same click records a CRM CALL: rep · company · contact ·
 * number · time. The rep pastes the number into Callio as today. When Callio's
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

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
)

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
      straight in "calling", because that click WAS the Copy */
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

  const row = (s: CallState, t: CallTarget): CoEvent | null => {
    const base = { icon: '', time: 'just now', kind: 'sales' as const, days: 0, by: ME }
    const who = t.companyLine ? `${t.name} (${t.number})` : t.name
    if (s === 'calling') return { ...base, tone: WAITING, title: `Call · ${who}`, sub: `Calling ${t.number} — waiting for Callio. Linked to ${coLabel(c)} by the Copy click.` }
    if (s === 'answered') return { ...base, tone: CALL, title: `Call · ${who}`, sub: `${note.trim() || 'No note yet.'}${result ? ` · ${result}` : ''} · Outbound · Answered · 2m 14s · ▶ recording · Linked by: CRM call` }
    if (s === 'noanswer') return { ...base, tone: ATTEMPT, title: `Call attempt · ${who}`, sub: 'Callio: Busy · 0:00 — on the call log for this company; not contact, Idle unchanged.' }
    return null
  }

  useEffect(() => {
    if (preferred) onLive(row('calling', preferred))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = (t: CallTarget) => {
    setTarget(t); setState('calling')
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
            Callio can’t be dialled from the CRM. <b className="text-muted">Copy</b> copies the number for you to paste in Callio, and links the call to <b className="text-muted">{coLabel(c)}</b> the moment Callio reports it — usually seconds after you hang up.
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
                  <span className="font-mono text-ink/70">{t.number}</span> · {t.title}
                </p>
              </div>
              <Btn primary small onClick={() => start(t)}><CopyIcon />Copy</Btn>
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
            <Btn small disabled={other.trim().length < 9} onClick={() => start({ key: 'other', name: targets[0]?.name ?? 'Contact', title: 'new number', number: other.trim() })}><CopyIcon />Copy</Btn>
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
            <b>{t.number}</b> copied — paste it in Callio and press Call.{' '}
            <button className="font-semibold text-amber-900 underline-offset-2 hover:underline">Copy again</button>
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
          <p className="mt-1 text-[11px] text-emerald-900/75">Linked by your Copy click — same number, the Callio call started 1 minute after it. It is on {coLabel(c)}’s activity and on the call log with {t.companyLine ? 'the company line' : t.name}.</p>
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
