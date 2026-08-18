import { cn } from '@/lib/utils'

/*
 * CV status → the two views derived from it.
 *
 * The whole model on one picture, because the thing readers get wrong is not any
 * single status — it is the DIRECTION. Application status and CV-search status
 * are not decided anywhere; they are read off the CV. So the diagram is drawn
 * left-to-right with exactly one arrow crossing the middle, and nothing ever
 * flows back the other way.
 *
 * Static on purpose. This is a diagram in a specification, not a widget: it has
 * to be legible in a screenshot pasted into a chat, and it has to print.
 */

type Kind = 'final' | 'doubt'

const TONE: Record<string, { box: string; dot: string; text: string }> = {
  qualified: { box: 'border-emerald-200 bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  doubt: { box: 'border-amber-200 bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700' },
  rejected: { box: 'border-rose-200 bg-rose-50', dot: 'bg-rose-500', text: 'text-rose-700' },
}

const ROWS: {
  key: keyof typeof TONE
  status: string
  kind: Kind
  written: string
  application: string
  search: string
}[] = [
  {
    key: 'qualified',
    status: 'Qualified',
    kind: 'final',
    written: 'the scan, or an admin Approve',
    application: 'Sent',
    search: 'Showing',
  },
  {
    key: 'doubt',
    status: 'Not enough information',
    kind: 'doubt',
    written: 'the scan — below the rule',
    application: 'Pending — auto-sends at 24h',
    search: 'Hidden – pending review',
  },
  {
    key: 'doubt',
    status: 'Can’t read',
    kind: 'doubt',
    written: 'the scan — no text layer',
    application: 'Pending — auto-sends at 24h',
    search: 'Hidden – pending review',
  },
  {
    key: 'rejected',
    status: 'Rejected',
    kind: 'final',
    written: 'an admin only — never the scan',
    application: 'Not sent — no timer',
    search: 'Hidden',
  },
]

function Derived({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-faint">{label}</p>
      <p className={cn('truncate text-[11.5px] font-medium', muted ? 'text-muted' : 'text-ink/85')}>{value}</p>
    </div>
  )
}

export function CvStatusFlow() {
  return (
    <div className="mt-2 overflow-x-auto">
      <div className="min-w-[620px] rounded-xl border border-line bg-canvas/30 p-3">
        {/* where a status comes from */}
        <div className="mb-2 flex items-center gap-2 text-[10.5px] text-muted">
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-medium text-ink/80">
            Upload / save a CV
          </span>
          <span className="text-faint">→</span>
          <span className="rounded-md border border-line bg-surface px-2 py-1 font-medium text-ink/80">
            automatic scan
          </span>
          <span className="text-faint">→ writes ONE field:</span>
        </div>

        <div className="grid grid-cols-[minmax(190px,1.1fr)_16px_minmax(0,1.6fr)] items-center gap-x-2 gap-y-1.5">
          {/* column headers */}
          <p className="text-[9.5px] font-bold uppercase tracking-wide text-faint">CV status · the only stored fact</p>
          <span />
          <p className="text-[9.5px] font-bold uppercase tracking-wide text-faint">Derived — never stored, never edited</p>

          {ROWS.map((r, i) => {
            const t = TONE[r.key]
            return (
              <div key={i} className="contents">
                <div className={cn('rounded-lg border px-2.5 py-2', t.box)}>
                  <p className={cn('flex items-center gap-1.5 text-[12px] font-bold', t.text)}>
                    <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} />
                    {r.status}
                    <span className="ml-auto shrink-0 rounded bg-white/70 px-1 text-[9px] font-semibold uppercase tracking-wide">
                      {r.kind}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">written by {r.written}</p>
                </div>
                <span className="grid place-items-center text-[13px] text-faint">→</span>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface px-2.5 py-2">
                  <Derived label="Application status" value={r.application} muted={r.kind === 'doubt'} />
                  <Derived label="CV search status" value={r.search} muted={r.kind === 'doubt'} />
                </div>
              </div>
            )
          })}
        </div>

        {/* the only transitions that exist */}
        <div className="mt-3 border-t border-line-soft pt-2">
          <p className="mb-1 text-[9.5px] font-bold uppercase tracking-wide text-faint">
            The only way anything changes — every one of these is a write to CV status
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink/80">
            <span>
              <b className="font-semibold text-amber-700">Doubt</b> <span className="text-faint">— admin Approve →</span>{' '}
              <b className="font-semibold text-emerald-700">Qualified</b>
            </span>
            <span>
              <b className="font-semibold text-amber-700">Doubt</b> <span className="text-faint">— admin Reject →</span>{' '}
              <b className="font-semibold text-rose-700">Rejected</b>
            </span>
            <span>
              <b className="font-semibold text-emerald-700">Qualified</b> <span className="text-faint">— reported / spam →</span>{' '}
              <b className="font-semibold text-rose-700">Rejected</b>
            </span>
            <span>
              <b className="font-semibold text-rose-700">Rejected</b> <span className="text-faint">— undo →</span>{' '}
              <b className="font-semibold text-emerald-700">Qualified</b>
            </span>
            <span className="text-muted">
              candidate edits the CV <span className="text-faint">— scan re-runs →</span> any status
            </span>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
            Nothing writes to the right-hand column. There is no “send this application” and no admin “hide from search” —
            both views recompute from the CV, so they can never disagree with it.
          </p>
        </div>
      </div>
    </div>
  )
}
