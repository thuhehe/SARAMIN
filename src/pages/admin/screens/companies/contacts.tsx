import { useState } from 'react'
import { cn } from '@/lib/utils'
import { coLabel } from '@/pages/admin/data/companies'
import type { Company } from '@/pages/admin/data/companies'
import { CONTACT_STATUS } from '@/pages/admin/data/companyRecord'
import type { CoContact, ContactStatus } from '@/pages/admin/data/companyRecord'
import { ComboField, DetailCard, EField, KV, LField } from '@/pages/admin/ui/fields'
import { Pill } from '@/pages/admin/ui/status'

export function ContactDetail({ p, c, onClose }: { p: CoContact; c: Company; onClose: () => void }) {
  /* Edit is in-place rather than a second modal: the reader is already looking at
     the record, and a modal on top of a slide-over is one layer too many. Changes
     are held in a draft so Cancel is a true revert. */
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CoContact>(p)
  const [justSaved, setJustSaved] = useState(false)
  const set = <K extends keyof CoContact>(k: K, v: CoContact[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const cancel = () => { setDraft(p); setEditing(false) }
  const save = () => { setEditing(false); setJustSaved(true) }
  const startEdit = () => { setJustSaved(false); setEditing(true) }

  const st = CONTACT_STATUS[draft.status]
  const blocked = draft.status === 'No longer here' || draft.status === 'Do not contact'
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-full max-w-[560px] flex-col bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-faint">Contact · {coLabel(c)}</p>
            <h3 className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[16px] font-bold tracking-tight">
              {draft.name}
              {draft.primary && <span className="rounded border border-brand/30 bg-brand-soft px-1 py-0.5 text-[9.5px] font-semibold text-brand">PRIMARY</span>}
              {draft.billing && <span className="rounded border border-line bg-canvas px-1 py-0.5 text-[9.5px] font-semibold text-muted">BILLING</span>}
              {editing && <span className="rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9.5px] font-semibold text-amber-700">EDITING</span>}
            </h3>
            <p className="text-[11.5px] text-muted">{draft.title}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* status, with the "what do I do instead" line spelled out */}
          <div className={cn('rounded-lg border px-3 py-2.5', blocked ? 'border-rose-200 bg-rose-50' : 'border-line bg-canvas/40')}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={st.tone}>{draft.status}</Pill>
              <span className="text-[11.5px] text-muted">{st.vi}</span>
              {draft.snoozedUntil && <span className="text-[11.5px] text-amber-700">· đến {draft.snoozedUntil}</span>}
            </div>
            <p className={cn('mt-1.5 text-[11.5px] leading-relaxed', blocked ? 'text-rose-800' : 'text-muted')}>{st.hint}</p>
            {/* what to DO is a separate line from what it MEANS — the rep is here to act */}
            <p className={cn('mt-1 text-[11.5px] font-medium', blocked ? 'text-rose-900' : 'text-ink/80')}>→ {st.action}</p>
            {draft.movedTo && (
              <p className="mt-1.5 text-[11.5px] text-brand">Nay ở <b>{draft.movedTo}</b> — a warm lead at their new employer.</p>
            )}
            {editing && (
              <div className="mt-2.5 border-t border-line-soft pt-2.5">
                <p className="mb-1.5 text-[10.5px] uppercase tracking-wide text-faint">Change status</p>
                {/* Rows, not chips: five statuses each need their meaning beside them,
                    otherwise a rep guesses what "Paused" covers. */}
                <div className="space-y-1">
                  {(Object.keys(CONTACT_STATUS) as ContactStatus[]).map((k) => {
                    const m = CONTACT_STATUS[k]
                    const on = draft.status === k
                    return (
                      <button
                        key={k}
                        onClick={() => set('status', k)}
                        className={cn('flex w-full items-start gap-2 rounded-lg border px-2.5 py-1.5 text-left', on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-ink/30')}
                      >
                        <span className={cn('mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-line')}>
                          {on && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className={cn('text-[12px] font-medium', on ? 'text-brand' : 'text-ink')}>{k}</span>
                            <span className="text-[10.5px] text-faint">{m.vi}</span>
                          </span>
                          <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">{m.hint}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                {draft.status === 'Paused' && (
                  <div className="mt-2"><EField label="Resume contact on" value={draft.snoozedUntil ?? ''} onChange={(v) => set('snoozedUntil', v)} hint="Required for Paused — reminders stay off until this date." /></div>
                )}
                {draft.status === 'No longer here' && (
                  <div className="mt-2"><EField label="Now at (if known)" value={draft.movedTo ?? ''} onChange={(v) => set('movedTo', v)} hint="Optional — creates a warm lead at their new employer." /></div>
                )}
              </div>
            )}
          </div>

          <DetailCard title="Details" action={justSaved ? <span className="text-[11px] font-medium text-emerald-700">✓ Saved</span> : undefined}>
            {editing ? (
              <>
                <EField label="Full name" value={draft.name} onChange={(v) => set('name', v)} />
                <EField label="Job title" value={draft.title} onChange={(v) => set('title', v)} />
                <EField label="Email" value={draft.email} onChange={(v) => set('email', v)} mono hint="Verified before it is used on a quotation." />
                <EField label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} />
                <div className="py-2">
                  <p className="mb-1 text-[10.5px] uppercase tracking-wide text-faint">Role on this account</p>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      ['primary', 'Primary (receives quotations)'],
                      ['billing', 'Billing (receives invoices)'],
                      ['decisionMaker', 'Decision maker'],
                    ] as [keyof CoContact, string][]).map(([k, label]) => {
                      const on = Boolean(draft[k])
                      return (
                        <button key={String(k)} onClick={() => set(k, (!on) as never)} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px]', on ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>
                          <span className={cn('grid h-3.5 w-3.5 place-items-center rounded border text-[9px]', on ? 'border-brand bg-brand text-white' : 'border-line')}>{on ? '✓' : ''}</span>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-[10.5px] text-faint">Only one contact per company can be Primary or Billing — setting it here moves it off whoever held it.</p>
                </div>
                <KV label="Login user" value={draft.linkedUser ? `${draft.linkedUser}` : 'No login — contact only'} />
                <KV label="Last contacted" value={draft.lastContact} />
              </>
            ) : (
              <>
                <KV label="Full name" value={draft.name} />
                <KV label="Job title" value={draft.title} />
                <KV label="Email" value={draft.email} link />
                <KV label="Phone" value={draft.phone} />
                <KV label="Decision maker" value={draft.decisionMaker ? 'Yes — signs off on the purchase' : 'No'} />
                <KV label="Receives quotations" value={draft.primary ? 'Yes — PRIMARY contact' : 'No'} />
                <KV label="Receives invoices" value={draft.billing ? 'Yes — BILLING contact' : 'No'} />
                <KV label="Login user" value={draft.linkedUser ? `${draft.linkedUser}` : 'No login — contact only'} />
                <KV label="Last contacted" value={draft.lastContact} />
              </>
            )}
          </DetailCard>

          <DetailCard title="Note" action={<span className="text-[11px] text-faint">one note per contact</span>}>
            {editing ? (
              <textarea value={draft.note} onChange={(e) => set('note', e.target.value)} rows={4} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink outline-none focus:border-brand" />
            ) : (
              <div className="rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink/85">{draft.note}</div>
            )}
            <p className="mt-1.5 text-[10.5px] text-faint">The human context a status cannot carry — preferred channel, who they defer to, what went wrong last time.</p>
          </DetailCard>

          </div>

        {/* every contact action lives here, not on the list row */}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          {editing ? (
            <>
              <span className="mr-auto text-[11px] text-faint">Editing — Cancel discards every change.</span>
              <button onClick={cancel} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
              <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Save changes</button>
            </>
          ) : (
            <>
              {draft.status === 'Needs verifying' && <button onClick={startEdit} className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand">Verify details</button>}
              {draft.status === 'No longer here' && <button className="rounded-lg border border-brand/40 bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand">Find successor</button>}
              {!draft.linkedUser && !blocked && <button className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-brand hover:border-brand">Invite as user</button>}
              {!draft.primary && !blocked && <button onClick={() => { set('primary', true); setJustSaved(true) }} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Make primary</button>}
              <button onClick={startEdit} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Change status</button>
              <button onClick={startEdit} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* Add a contact by hand — the name-card path. Deliberately short: a contact is
   cheap to create and details get verified later, which is what Unverified is for. */
export function AddContactModal({ c, onClose }: { c: Company; onClose: () => void }) {
  const [status, setStatus] = useState<ContactStatus>('Needs verifying')
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="my-4 w-full max-w-[560px] rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <p className="text-[15px] font-bold">Add contact</p>
            <p className="text-[11px] text-muted">To {coLabel(c)} · a contact needs no login</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            <LField label="Full name" req value="Họ và tên" />
            <ComboField label="Job title" value="" placeholder="Select or type a title…" options={['HR Manager', 'HR Director', 'Talent Acquisition', 'Recruiter', 'Kế toán trưởng / Chief accountant', 'CEO / Founder', 'Office Manager']} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LField label="Email" value="name@company.vn" hint="Verified before it is used on a quotation." />
            <LField label="Phone" value="09xx xxx xxx" />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CONTACT_STATUS) as ContactStatus[]).map((k) => (
                <button key={k} onClick={() => setStatus(k)} title={CONTACT_STATUS[k].hint} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', status === k ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>
                  {k} <span className="text-[10px] opacity-70">{CONTACT_STATUS[k].vi}</span>
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{CONTACT_STATUS[status].hint} <b className="text-ink/70">→ {CONTACT_STATUS[status].action}</b></p>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Role on this account</label>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Primary contact (receives quotations)</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Billing contact (receives invoices)</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[12px] text-muted"><span className="h-3.5 w-3.5 rounded border border-line" /> Decision maker</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
            <div className="h-16 rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-faint">Preferred channel, who they defer to, anything the next rep should know…</div>
          </div>
          <p className="rounded-md bg-brand-soft px-2.5 py-2 text-[11px] leading-relaxed text-brand">
            Adding a contact does <b>not</b> create a login. Use <b>Invite as user</b> on the contact afterwards if they need to sign in — that is an explicit, separate step.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
          <button onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-[13px] font-medium text-muted hover:border-ink/40">Cancel</button>
          <button onClick={onClose} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">Add contact</button>
        </div>
      </div>
    </div>
  )
}
