import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AUTO_APPLY, matchKeys } from '@/pages/admin/data/resume'
import type { Prefs, Std } from '@/pages/admin/data/resume'
import { BField, RField } from '@/pages/admin/ui/fields'
import { EmptySec } from '@/pages/admin/ui/form'

/** One section of the standard resume on the review screen. */
function StdSection({ title, count, repeatable, children }: { title: string; count?: number; repeatable?: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center gap-2 border-b border-line-soft px-3.5 py-2">
        <h4 className="text-[12.5px] font-semibold text-ink">{title}</h4>
        {count != null && <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] tabular-nums text-faint">{count}</span>}
        {repeatable && <button className="ml-auto rounded-md border border-line px-2 py-0.5 text-[10.5px] text-muted hover:border-brand hover:text-brand">＋ Add item</button>}
      </header>
      <div className="space-y-3 p-3.5">{children}</div>
    </section>
  )
}

/** A repeatable entry inside a section, with its own remove affordance. */
function StdItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-lg border border-line-soft bg-canvas/30 p-3">
      <button className="absolute right-2 top-2 text-[10.5px] text-faint hover:text-rose-500">Remove</button>
      {children}
    </div>
  )
}

/** Confidence-scored tag chip. Checked state is the operator's decision, not the
    model's — the score only decides what arrives pre-checked. */
export function TagChip({ kind, value, conf, checked, onClick }: { kind: string; value: string; conf: number; checked: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
        checked ? 'border-brand bg-brand-soft text-ink' : 'border-line bg-surface text-muted hover:text-ink',
      )}
    >
      <span className={cn('text-[9.5px]', checked ? 'text-brand' : 'text-faint')}>{checked ? '☑' : '☐'}</span>
      <span className="rounded bg-canvas px-1 text-[9px] uppercase tracking-wide text-faint">{kind}</span>
      <span className="font-medium">{value}</span>
      <span className={cn('rounded px-1 text-[9.5px] tabular-nums', conf >= AUTO_APPLY ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
        {(conf * 100).toFixed(0)}%
      </span>
    </button>
  )
}

/* ── convergence — Saramin standard resume, review & edit ────────────────────── */

export function ResumeReview({ std, setStd, source, onBack, onRegistered }: {
  std: Std
  setStd: (s: Std) => void
  source: 'IMPORT' | 'SELF_REGISTER'
  onBack: () => void
  onRegistered: () => void
}) {
  const hasOriginal = source === 'IMPORT'
  const [tab, setTab] = useState<'original' | 'saramin'>(hasOriginal ? 'original' : 'saramin')
  const [registered, setRegistered] = useState(false)
  const keys = matchKeys(std)
  const ready = keys.filter((k) => k.ready).length

  const setPref = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setStd({ ...std, prefs: { ...std.prefs, [k]: v } })

  if (registered) {
    return (
      <div className="max-w-[560px] rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
        <p className="text-[15px] font-bold text-emerald-800">Registered to the resume master</p>
        <p className="mt-1 text-[12px] leading-relaxed text-emerald-900/80">
          The standard resume was saved with <b>source = {source}</b>{hasOriginal ? ', both the original and the generated Saramin PDF' : ', the generated Saramin PDF only'}, and {std.tags.length} tag{std.tags.length === 1 ? '' : 's'}.
          The console would now open the new resume’s detail page.
        </p>
        <p className="mt-2 text-[11px] text-emerald-900/70">
          The candidate is <b>not</b> discoverable in employer CV search yet — that needs their own visibility consent.
        </p>
        <button onClick={onRegistered} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Back to resume list</button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="text-[11.5px] font-medium text-muted hover:text-brand">← Previous step</button>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted">source: {source}</span>
          <button onClick={() => setRegistered(true)} className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white hover:opacity-90">Register to resume master</button>
        </div>
      </div>

      <h2 className="text-[19px] font-bold tracking-tight">Saramin standard resume — review &amp; edit</h2>
      <p className="mt-1 max-w-[760px] text-[12px] text-muted">
        One unified view of the extracted or entered content in the Saramin standard format. Edit any section, then register. This is the
        only write in the flow — until you press Register, nothing exists in the resume master.
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* LEFT — CV documents */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-line bg-surface">
            <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line-soft px-3.5 py-2.5">
              <div>
                <h3 className="text-[12.5px] font-semibold">CV documents</h3>
                <p className="text-[10.5px] text-faint">Opening a CV document is a PII event and is written to the audit log.</p>
              </div>
              <span className="rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">{hasOriginal ? 'Original + Saramin' : 'Saramin only'}</span>
            </header>
            <div className="flex gap-1 border-b border-line-soft px-3.5 pt-2.5">
              {([['original', 'Original CV'], ['saramin', 'Saramin standard']] as const).map(([k, label]) => {
                const disabled = k === 'original' && !hasOriginal
                return (
                  <button
                    key={k}
                    disabled={disabled}
                    onClick={() => setTab(k)}
                    title={disabled ? 'The Builder route produces no original file' : undefined}
                    className={cn('rounded-t-md px-2.5 py-1.5 text-[11.5px]', tab === k ? 'border-b-2 border-brand font-semibold text-brand' : 'text-muted', disabled && 'opacity-40')}
                  >{label}</button>
                )
              })}
            </div>
            <div className="p-3.5">
              <div className="grid min-h-[380px] place-items-center rounded-lg border border-dashed border-line bg-canvas/30 text-center">
                <div className="px-6">
                  <p className="text-[22px]"></p>
                  <p className="mt-1 text-[12px] font-medium text-ink">
                    {tab === 'original' ? 'original-cv.pdf' : 'saramin-cv.pdf'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {tab === 'original'
                      ? 'The file as the candidate supplied it — the document an employer reads.'
                      : 'Generated from the standard template. Regenerated whenever the standard resume changes.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — matching keys + section editors */}
        <div className="space-y-4">
          <div className="rounded-xl border border-line bg-surface">
            <header className="border-b border-line-soft px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[12.5px] font-semibold">Job matching keys</h3>
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums', ready >= 7 ? 'bg-emerald-50 text-emerald-700' : ready >= 4 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600')}>
                  {ready} / {keys.length} ready
                </span>
              </div>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-faint">
                Which job-posting filters this resume can be found by. Derived live — fill a section below and its key flips to Ready.
                An all-Missing resume registers fine but is close to invisible in CV search.
              </p>
            </header>
            <div className="grid gap-2 p-3.5 sm:grid-cols-2">
              {keys.map((k) => (
                <div key={k.label} className={cn('flex items-start gap-2 rounded-md border p-2', k.ready ? 'border-emerald-200 bg-emerald-50/50' : 'border-line bg-surface')}>
                  <span className={cn('mt-0.5 text-[10px]', k.ready ? 'text-emerald-600' : 'text-faint')}>{k.ready ? '✓' : '◌'}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink">{k.label}</p>
                    <p className="truncate text-[10.5px] text-faint">{k.preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <StdSection title="Identity & contact">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <RField label="Name (VI) *" value={std.nameVi} />
              <RField label="Name (EN)" value={std.nameEn} />
              <RField label="Name (KO)" value={std.nameKr} />
              <RField label="Date of birth" value={std.dob} />
              <RField label="Gender" value={std.gender} />
              <RField label="Email *" value={std.email} />
              <RField label="Phone *" value={std.phone} />
              <RField label="City" value={std.city} />
              <RField label="District" value={std.district} />
              <RField label="Road" value={std.road} span="sm:col-span-2" />
            </div>
          </StdSection>

          <StdSection title="Summary">
            <div className="space-y-2.5">
              <RField label="Summary (VI) — its first line becomes the resume headline" value={std.sumVi} />
              <RField label="Summary (EN)" value={std.sumEn} />
              <RField label="Summary (KO)" value={std.sumKo} />
            </div>
          </StdSection>

          <StdSection title="Experience" count={std.experiences.length} repeatable>
            {std.experiences.length === 0 && <EmptySec what="No experience yet — this is what drives years-of-experience and the Career matching key." />}
            {std.experiences.map((e, i) => (
              <StdItem key={i}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <RField label="Company *" value={e.company} />
                  <RField label="Position *" value={e.position} />
                  <RField label="Location" value={e.location} />
                  <RField label="Areas (comma-separated)" value={e.areas} />
                  <RField label="Start (YYYY-MM) *" value={e.startYm} />
                  <RField label="End (YYYY-MM — empty = present)" value={e.endYm} />
                  <RField label="Tech stack (comma-separated)" value={e.tech} span="sm:col-span-2" />
                </div>
                <p className="mt-2 mb-1 text-[10.5px] font-medium text-ink/70">Achievements (one per line)</p>
                <ul className="space-y-1">
                  {e.bullets.map((b) => <li key={b} className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] text-ink/80">{b}</li>)}
                </ul>
              </StdItem>
            ))}
          </StdSection>

          <StdSection title="Education" count={std.educations.length} repeatable>
            {std.educations.length === 0 && <EmptySec what="No education yet — the Education matching key stays Missing until one entry exists." />}
            {std.educations.map((e, i) => (
              <StdItem key={i}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <RField label="School *" value={e.school} span="sm:col-span-2" />
                  <RField label="Faculty" value={e.faculty} />
                  <RField label="Major" value={e.major} />
                  <RField label="Degree * (HIGH_SCHOOL · ASSOCIATE · BACHELOR · MASTER · DOCTOR)" value={e.degree} span="sm:col-span-2" />
                  <RField label="Start (YYYY-MM)" value={e.startYm} />
                  <RField label="End (YYYY-MM)" value={e.endYm} />
                  <RField label="GPA" value={e.gpa} />
                </div>
              </StdItem>
            ))}
          </StdSection>

          <StdSection title="Skills" count={std.skills.length} repeatable>
            {std.skills.length === 0 && <EmptySec what="No skills yet. Real CVs group their stack — keep the groups rather than flattening to one list." />}
            {std.skills.map((s, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-[150px_1fr]">
                <RField label="Group" value={s.group} />
                <RField label="Items (comma-separated — must resolve to the Skill taxonomy)" value={s.items} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Languages" count={std.languages.length} repeatable>
            {std.languages.length === 0 && <EmptySec what="No languages yet — this feeds the Language certs matching key." />}
            {std.languages.map((l, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-4">
                <RField label="Language" value={l.language} />
                <RField label="Cert" value={l.cert} />
                <RField label="Score / level" value={l.score} />
                <RField label="Level" value={l.level} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Certifications" count={std.certifications.length} repeatable>
            {std.certifications.length === 0 && <EmptySec what="None." />}
            {std.certifications.map((c, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-4">
                <RField label="Certificate" value={c.name} />
                <RField label="Issuer" value={c.issuer} />
                <RField label="Score" value={c.score} />
                <RField label="Year" value={c.year} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Projects" count={std.projects.length} repeatable>
            {std.projects.length === 0 && <EmptySec what="None." />}
            {std.projects.map((p, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-2">
                <RField label="Project" value={p.name} />
                <RField label="Role" value={p.role} />
                <RField label="Period" value={p.period} />
                <RField label="Tech stack" value={p.tech} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Awards / activities" count={std.awards.length} repeatable>
            {std.awards.length === 0 && <EmptySec what="None." />}
            {std.awards.map((a, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-3">
                <RField label="Award" value={a.name} />
                <RField label="Issuer" value={a.issuer} />
                <RField label="Year" value={a.year} />
              </div>
            ))}
          </StdSection>

          <StdSection title="References" count={std.references.length} repeatable>
            <p className="-mt-1 mb-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10.5px] text-amber-800">
              VN CVs routinely list a referee with a phone number. This section is PII about a THIRD party — masked in the list, and revealing it is audited.
            </p>
            {std.references.length === 0 && <EmptySec what="None." />}
            {std.references.map((r, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-4">
                <RField label="Name" value={r.name} />
                <RField label="Role" value={r.role} />
                <RField label="Relation" value={r.relation} />
                <RField label="Phone" value={r.phone} />
              </div>
            ))}
          </StdSection>

          <StdSection title="Portfolio / links" count={std.links.length} repeatable>
            {std.links.length === 0 && <EmptySec what="None." />}
            {std.links.map((l, i) => (
              <div key={i} className="grid gap-2.5 sm:grid-cols-[120px_1fr]">
                <RField label="Kind" value={l.kind} />
                <RField label="URL" value={l.url} />
              </div>
            ))}
          </StdSection>

          {/* The one editable section, so the matching keys can be watched flipping. */}
          <StdSection title="Job preferences">
            <p className="-mt-1 text-[10.5px] text-faint">Editable here — change a field and watch its matching key above flip to Ready.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <PrefSelect label="Career level" value={std.prefs.careerLevel} options={['FRESHER', 'EXPERIENCED', 'ANY']} onChange={(v) => setPref('careerLevel', v)} />
              <BField label="Years of experience" value={std.prefs.yearsOfExp} onChange={(v) => setPref('yearsOfExp', v)} />
              <BField label="Desired job categories (comma-separated)" value={std.prefs.cats} onChange={(v) => setPref('cats', v)} placeholder="Frontend Developer, Full-stack Developer" />
              <BField label="Desired employment types (comma-separated)" value={std.prefs.empTypes} onChange={(v) => setPref('empTypes', v)} placeholder="FULL_TIME, CONTRACT" />
              <BField label="Desired locations (comma-separated)" value={std.prefs.locs} onChange={(v) => setPref('locs', v)} placeholder="Hà Nội, Hồ Chí Minh" />
              <BField label="Target industries (comma-separated)" value={std.prefs.inds} onChange={(v) => setPref('inds', v)} placeholder="E-commerce, SaaS" />
              <PrefSelect label="Salary kind" value={std.prefs.salKind} options={['', 'ANNUAL', 'MONTHLY', 'INTERVIEW', 'INTERNAL_RULE']} onChange={(v) => setPref('salKind', v)} />
              <PrefSelect label="Currency" value={std.prefs.salCur} options={['VND', 'USD']} onChange={(v) => setPref('salCur', v)} />
              <BField label="Salary min" value={std.prefs.salMin} onChange={(v) => setPref('salMin', v)} placeholder="30000000" />
              <BField label="Salary max" value={std.prefs.salMax} onChange={(v) => setPref('salMax', v)} placeholder="45000000" />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {([['Remote OK', 'remoteOk'], ['Open to relocate', 'relocate'], ['Open to overseas', 'overseas']] as [string, 'remoteOk' | 'relocate' | 'overseas'][]).map(([label, k]) => (
                <button
                  key={k}
                  onClick={() => setPref(k, !std.prefs[k])}
                  className={cn('rounded-full border px-2.5 py-1 text-[11px] transition-colors', std.prefs[k] ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-line bg-surface text-muted hover:text-ink')}
                >
                  {std.prefs[k] ? '☑' : '☐'} {label}
                </button>
              ))}
            </div>
          </StdSection>

          <StdSection title="Tags" count={std.tags.length}>
            {std.tags.length === 0
              ? <EmptySec what="No tags applied. The resume registers, but it will not surface for skill or role searches." />
              : (
                <div className="flex flex-wrap gap-1.5">
                  {std.tags.map((t) => <TagChip key={t.value} kind={t.kind} value={t.value} conf={t.conf} checked />)}
                </div>
              )}
            <p className="text-[10.5px] text-faint">Only checked tags were applied. A blank tag value is rejected by the API — an empty tag pollutes the taxonomy join CV search depends on.</p>
          </StdSection>

          <p className="rounded-lg border border-line bg-canvas/40 px-3 py-2.5 text-[10.5px] leading-relaxed text-faint">
            <b className="text-muted">On register:</b> the whole standard resume is stored as one serialised <code className="font-mono">standardJson</code>, and the flat
            columns the list and search read are DERIVED from it — <code className="font-mono">headline</code> = the first line of the VI summary,{' '}
            <code className="font-mono">content</code> = the VI summary (falling back to EN, then KO). Never the other way round.
          </p>
        </div>
      </div>
    </div>
  )
}

function PrefSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink/80">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-surface px-2 py-2 text-[12px] outline-none focus:border-brand"
      >
        {options.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
      </select>
    </div>
  )
}
