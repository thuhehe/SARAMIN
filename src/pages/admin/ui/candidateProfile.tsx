import { cn } from '@/lib/utils'
import { Pill } from '@/pages/admin/ui/status'

/* The candidate drill-in, in the SAME three groups the jobseeker sees on their own
   profile — Basic information · Work preference · CV content. Reading HQ's view in
   a different shape from the candidate's is how support ends up describing a screen
   the caller is not looking at, so this modal is the ONE place the shape lives:
   Talent pool (CV review) and the Jobseeker account both open it, never a copy.

   HQ is read-only on all three. The only thing HQ owns is the CV's status, and that
   lives on the row's actions, not here. */
export function CandidateProfileModal({ name, onClose }: { name: string; onClose: () => void }) {
  /* Every CV carries a CV STATUS; the derived SEARCH status is shown only on the
     one toggled on — the others are not candidates for the index at all, so a
     search pill on them would claim a fact that does not exist. */
  const cvs = [
    { label: 'Frontend Engineer CV', kind: 'Saramin CV', searchable: true, updated: '2 days ago', st: 'Qualified', content: '3 experience · 8 skills' },
    { label: 'CV_An_EN.pdf', kind: 'Upload', searchable: false, updated: '1 week ago', st: 'Qualified', content: '2 experience · 6 skills' },
    { label: 'scan_old.pdf', kind: 'Upload', searchable: false, updated: '3 weeks ago', st: "Can't read", content: 'No readable content' },
  ]
  const Group = ({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) => (
    <div>
      <p className="mb-1.5 flex flex-wrap items-baseline gap-2 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
        {title}{note && <span className="font-normal normal-case tracking-normal text-faint/80">{note}</span>}
      </p>
      {children}
    </div>
  )
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <p className="flex items-baseline justify-between gap-3 text-[11.5px]"><span className="shrink-0 text-muted">{k}</span><span className="text-right font-medium text-ink">{v}</span></p>
  )
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 px-4 pt-10">
      <div className="flex max-h-[600px] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <p className="text-[14px] font-bold text-ink">{name}</p>
            <p className="text-[11px] text-muted">The same three groups the jobseeker sees on their own profile · HQ is read-only</p>
          </div>
          <span className="cursor-pointer text-faint" onClick={onClose}>✕</span>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <Group title="1 · Basic information" note="sign-up · 9 fields">
            <div className="grid gap-x-6 gap-y-1 rounded-lg border border-line p-3 sm:grid-cols-2">
              <Row k="Full name" v={name} />
              <Row k="Email" v={<span className="text-muted">masked · <span className="cursor-pointer text-brand">reveal (logged)</span></span>} />
              <Row k="Phone" v={<span className="text-muted">masked · <span className="cursor-pointer text-brand">reveal (logged)</span></span>} />
              <Row k="Nationality" v="Vietnamese" />
              <Row k="Gender" v="Male" />
              <Row k="Marital status" v="Single" />
              <Row k="Date of birth" v="12/04/1996" />
              <Row k="Highest education" v="Bachelor" />
              <Row k="Years of experience" v="4 yrs" />
            </div>
          </Group>
          <Group title="2 · Work preference" note="onboarding · 6 fields">
            <div className="grid gap-x-6 gap-y-1 rounded-lg border border-line p-3 sm:grid-cols-2">
              <Row k="Desired job role" v="Senior Frontend Engineer" />
              <Row k="Desired job category" v="Information Technology" />
              <Row k="Desired industry" v="IT / Software" />
              <Row k="Desired work location" v="Hồ Chí Minh · Hà Nội" />
              <Row k="Expected salary" v="25 – 35M" />
              <Row k="Desired work type" v="In office" />
            </div>
          </Group>
          <Group title="3 · CV content" note={`${cvs.length} / 3 · exactly one is searchable`}>
            <div className="space-y-2">
              {cvs.map((cv) => (
                <div key={cv.label} className={cn('flex items-center gap-3 rounded-lg border p-3', cv.searchable ? 'border-brand/40 bg-brand-soft/30' : 'border-line')}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-rose-50 text-[13px]">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-ink">
                      {cv.label}
                      <Pill tone={cv.kind === 'Saramin CV' ? 'neutral' : 'draft'}>{cv.kind}</Pill>
                      <Pill tone={cv.st === 'Qualified' ? 'active' : 'draft'}>{cv.st}</Pill>
                      {cv.searchable && <Pill tone={cv.st === 'Qualified' ? 'active' : 'pending'}>{cv.st === 'Qualified' ? 'Showing' : 'Hidden'}</Pill>}
                    </p>
                    <p className="text-[10.5px] text-faint">{cv.content} · updated {cv.updated}</p>
                  </div>
                  <span className="cursor-pointer text-[11px] font-medium text-brand">Mở (ghi log)</span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-faint">Which CV is toggled on for search is the candidate’s choice — HQ cannot change it. Every CV carries a CV STATUS; the search pill appears only on the toggled-on one. HQ can only change the STATUS, and that action lives on the ⋯ menu in the list.</p>
          </Group>
        </div>
        <div className="flex justify-end border-t border-line px-4 py-3"><button onClick={onClose} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-medium text-ink/70">Close</button></div>
      </div>
    </div>
  )
}
