import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Company } from '@/pages/admin/data/companies'
import { CALL, CHAT, CHAT_CHANNELS, KIND_META, MEET, companyActivity } from '@/pages/admin/data/companyRecord'
import type { CoAtt, CoEvent, CoKind } from '@/pages/admin/data/companyRecord'
import { ME } from '@/pages/admin/data/salesOrg'
import { Table } from '@/pages/admin/ui/table'

/** Attachment tray shared by every activity type — images and forwarded emails. */
/* What may be attached depends on the activity: a chat is screenshots (you cannot
   attach an email to a Zalo thread), a meeting can carry both a photo of the room
   and the follow-up email. A CALL gets no attach row at all — Calio syncs the
   recording and outcome automatically, so a manual control there is noise. */
function AttachRow({ atts, onAdd, onDrop, allow = ['image', 'email'] }: { atts: CoAtt[]; onAdd: (a: CoAtt) => void; onDrop: (i: number) => void; allow?: CoAtt['kind'][] }) {
  const n = atts.filter((a) => a.kind === 'image').length
  return (
    <div>
      <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Đính kèm</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {atts.map((a, i) => (
          <span key={i} className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]', a.kind === 'email' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-line bg-canvas text-muted')}>
            <span>{a.kind === 'email' ? '' : ''}</span>
            <span className="max-w-[150px] truncate">{a.label}</span>
            <button onClick={() => onDrop(i)} className="ml-0.5 text-faint hover:text-ink">✕</button>
          </span>
        ))}
        {allow.includes('image') && <button onClick={() => onAdd({ kind: 'image', label: `anh-${n + 1}.png` })} className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">+ Ảnh</button>}
        {allow.includes('email') && <button onClick={() => onAdd({ kind: 'email', label: 'RE- trao đổi.eml' })} className="rounded-md border border-dashed border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-brand hover:text-brand">+ Email</button>}
      </div>
    </div>
  )
}

export function CompanyActivities({ c }: { c: Company }) {
  const [kind, setKind] = useState<null | 'chat' | 'call' | 'meeting'>(null)
  const [channel, setChannel] = useState('Zalo')
  const [note, setNote] = useState('')
  const [atts, setAtts] = useState<CoAtt[]>([])
  const [when, setWhen] = useState('20/07/2026')
  const [time, setTime] = useState('14:00')
  const [mins, setMins] = useState('60')
  const [place, setPlace] = useState('Tại văn phòng khách hàng')
  const [logged, setLogged] = useState<CoEvent[]>([])
  /* SINGLE-select, not a set of toggles. The old chips were multi-select, so tapping
     "Sales" while everything was on REMOVED sales — the opposite of what a tap looks
     like it should do. One active view at a time is what a tab bar promises.
     Defaults to Sales: contact with the client is what this panel is read for, and
     it is the only kind that resets Idle. */
  const [feed, setFeed] = useState<'sales' | 'client' | 'system' | 'all'>('sales')
  const all = [...logged, ...companyActivity(c)]
  const rows = feed === 'all' ? all : all.filter((e) => e.kind === feed)
  const countOf = (k: CoKind) => all.filter((e) => e.kind === k).length

  const save = () => {
    const base = { time: 'just now', kind: 'sales' as CoKind, days: 0, by: ME, atts: atts.length ? atts : undefined }
    const entry: CoEvent =
      kind === 'chat'
        ? { ...base, icon: '', tone: CHAT, title: `Chat · ${channel}`, sub: note.trim() || 'No note added.' }
        : kind === 'meeting'
          ? { ...base, icon: '', tone: MEET, title: `Meeting · ${place.toLowerCase()}`, sub: `${note.trim() || 'No note added.'} ${mins} phút · ${time} ${when}.` }
          : { ...base, icon: '', tone: CALL, title: 'Call · logged via Calio', sub: note.trim() || 'Call synced from Calio — outcome & recording attached.' }
    setLogged((p) => [entry, ...p])
    setKind(null); setNote(''); setChannel('Zalo'); setAtts([])
  }
  const addAtt = (a: CoAtt) => setAtts((p) => [...p, a])
  const dropAtt = (i: number) => setAtts((p) => p.filter((_, j) => j !== i))

  return (
    // min-w-0 so the trail's table scrolls inside this column instead of forcing
    // the whole Overview grid wider than the page.
    <div className="min-w-0 space-y-4">
      {/* composer — OPEN to anyone who can see the company (owner, teammates, lead,
          manager). Logging is append-only and is credited to the SIGNED-IN user,
          not the sales owner — whoever does the work gets the KPI. Editing the
          company's own fields stays owner-only, but that gate lives on the Overview
          card, not here. */}
      {(
      <div className="rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line-soft px-3.5 py-2.5">
          <p className="text-[12.5px] font-bold">Log an activity</p>
          <span className="ml-auto text-[10.5px] text-faint">Ghi cho <b className="text-ink/70">bạn</b> (người đăng nhập), không phải chủ sở hữu</span>
        </div>
        <div className="p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setKind('chat')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'chat' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Chat</button>
            <button onClick={() => setKind('call')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'call' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Call</button>
            <button onClick={() => setKind('meeting')} className={cn('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium', kind === 'meeting' ? 'border-brand bg-brand-soft text-brand' : 'border-line text-muted hover:border-ink/30')}>Meeting</button>
            {/* Stamped with the signed-in account, not the company's sales owner —
                whoever actually does the work is who gets the KPI for it. */}
            {kind && <span className="ml-auto text-[11px] text-faint">Ghi nhận cho <b className="font-medium text-ink/70">{ME}</b></span>}
          </div>

          {kind === 'chat' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Channel <span className="text-rose-500">*</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {CHAT_CHANNELS.map((ch) => (
                    <button key={ch} onClick={() => setChannel(ch)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', channel === ch ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{ch}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={`What did you discuss on ${channel}?`} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              {/* Screenshots only — an email is its own thread, not an attachment to a chat. */}
              <AttachRow atts={atts} onAdd={addAtt} onDrop={dropAtt} allow={['image']} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log chat</button>
              </div>
            </div>
          )}

          {kind === 'meeting' && (
            <div className="mt-3 space-y-2.5">
              {/* A meeting is the only activity with a scheduled MOMENT of its own —
                  a chat or a call is logged when it happened, a meeting is logged
                  against the slot it was held in (or will be held in). */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Ngày <span className="text-rose-500">*</span></label>
                  {/* Backdating is allowed, but only inside the current month: a rep
                      writing up yesterday's meeting is normal, one editing last
                      month's numbers after the period closed is not. */}
                  <input value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand" />
                  <p className="mt-1 text-[10px] leading-relaxed text-faint">Từ 01/08/2026 đến hôm nay</p>
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Giờ <span className="text-rose-500">*</span></label>
                  <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Thời lượng</label>
                  <select value={mins} onChange={(e) => setMins(e.target.value)} className="w-full cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-brand">
                    {['15', '30', '45', '60', '90', '120'].map((m) => <option key={m} value={m}>{m} phút</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Hình thức</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Tại văn phòng khách hàng', 'Tại văn phòng Saramin', 'Online — Google Meet', 'Online — Zoom', 'Khác'].map((pl) => (
                    <button key={pl} onClick={() => setPlace(pl)} className={cn('rounded-lg border px-2.5 py-1 text-[11.5px]', place === pl ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line text-muted hover:border-ink/30')}>{pl}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Nội dung <span className="text-rose-500">*</span></label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Nội dung trao đổi, thống nhất, việc cần làm tiếp…" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              <AttachRow atts={atts} onAdd={addAtt} onDrop={dropAtt} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log meeting</button>
              </div>
            </div>
          )}

          {kind === 'call' && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-ink/80">Note</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Call summary / next step… (auto-filled from Calio when available)" className="w-full rounded-md border border-line bg-surface px-3 py-2 text-[12.5px] text-ink outline-none placeholder:text-faint focus:border-brand" />
              </div>
              {/* No attach row: Calio syncs the recording and outcome onto the call
                  automatically, so a manual attach control here is dead weight. */}
              <div className="flex justify-end gap-2">
                <button onClick={() => setKind(null)} className="rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted hover:border-ink/40">Cancel</button>
                <button onClick={save} className="rounded-lg bg-brand px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90">Log call</button>
              </div>
            </div>
          )}

        </div>
      </div>
      )}

      {/* history — table so the whole trail is scannable at a glance */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">Activity <span className="font-normal text-muted">— everything that happened on this account</span></p>

        </div>
        {/* One active view at a time. Sales sits first and is the default because it
            is the reason the panel exists; Client and System are context. */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-line">
            {([
              { k: 'sales' as const, label: 'Sales', n: countOf('sales') },
              { k: 'client' as const, label: 'Client', n: countOf('client') },
              { k: 'system' as const, label: 'System', n: countOf('system') },
              { k: 'all' as const, label: 'Tất cả', n: all.length },
            ]).map((t, i) => {
              const on = feed === t.k
              return (
                <button
                  key={t.k}
                  onClick={() => setFeed(t.k)}
                  title={t.k === 'all' ? 'Toàn bộ dòng thời gian' : KIND_META[t.k].hint}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 text-[11.5px] transition-colors',
                    i > 0 && 'border-l border-line',
                    on ? 'bg-brand font-medium text-white' : 'text-muted hover:bg-canvas',
                  )}
                >
                  {t.label}
                  <span className={cn('rounded-full px-1.5 text-[10px] tabular-nums', on ? 'bg-white/25 text-white' : 'bg-canvas text-faint')}>{t.n}</span>
                </button>
              )
            })}
          </div>
          {feed === 'sales' && <span className="text-[10.5px] text-faint">Chat · call · meeting · tài liệu đã gửi — chỉ nhóm này reset Idle.</span>}
        </div>
        {/* "Never contacted" is an ALARM about the relationship, so it may only fire
            when there is genuinely no sales activity — not merely because the reader
            is standing on an empty Client or System tab. */}
        {rows.length === 0 && countOf('sales') === 0 ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50/50 px-3.5 py-4 text-center">
            <p className="text-[12.5px] font-medium text-rose-700">Never contacted</p>
            <p className="mt-0.5 text-[11.5px] text-rose-700/80">No sales activity has ever been logged for this company — the highest-priority follow-up, not the lowest.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-canvas/40 px-3.5 py-4 text-center">
            <p className="text-[12px] text-muted">Chưa có hoạt động nào thuộc nhóm <b className="text-ink/70">{feed === 'client' ? 'Client' : 'System'}</b> cho công ty này.</p>
          </div>
        ) : (
          <Table
            cols={[{ label: 'When', w: '0.8fr' }, { label: 'Activity', w: '1.3fr' }, { label: 'Who', w: '1fr' }, { label: 'Details', w: '2.4fr' }]}
            rows={rows.map((e) => [
              <span className="text-[11.5px] text-muted">{e.time}</span>,
              <span className="flex min-w-0 items-center gap-1.5">
                <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px]', e.tone)}>{e.icon}</span>
                <span className="truncate font-medium text-ink">{e.title}</span>
              </span>,
              /* The NAMED account, with the side it acted for underneath. The KPI
                 counts this name — a colleague covering for the owner gets the credit. */
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[11.5px] font-medium text-ink/80">{e.by}</span>
                <span className="text-[10px] text-faint">{KIND_META[e.kind].label}</span>
              </span>,
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-muted">{e.sub}</span>
                {e.atts && e.atts.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    {e.atts.map((a, i) => (
                      <span key={i} className={cn('inline-flex max-w-[160px] items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]', a.kind === 'email' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-line bg-canvas text-muted')}>
                        <span>{a.kind === 'email' ? '' : ''}</span>
                        <span className="truncate">{a.label}</span>
                      </span>
                    ))}
                  </span>
                )}
              </span>,
            ])}
          />
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-faint">
          One trail for the whole account: <b>Sales</b> (what we did), <b>Client</b> (what the customer did — posted a job, opened a CV, paid) and <b>System</b> (invoice issued, products provisioned, quota warnings).
          <b> Idle counts from the newest Sales row only</b>, so a client opening a CV can never make a silent account look freshly contacted. PII actions (CV unlocks) are always audited.
          <b className="text-ink/70"> Who</b> is the account that actually performed the activity, not the company’s sales owner — that is the account the KPI counts, so a colleague covering for a busy owner gets the credit.
        </p>
      </div>
    </div>
  )
}
