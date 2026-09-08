import { BUILD_MODULES } from '@/data/buildModules'
import { cn } from '@/lib/utils'

/**
 * How BB and the SVN test team hand work back and forth during the testing
 * window. Process, not product — it sits beside the requirement rather than
 * inside a module, because it applies to every module equally.
 *
 * The lead table is deliberately four columns: a reader's question is always
 * "whose turn is it, and where do I do it?", so WHO and PLATFORM are columns
 * rather than prose a reader has to mine.
 */

/* Three surfaces the work actually happens on. Colour-coded because "which
   platform" is the thing people get wrong — a bug written in the test case
   file instead of BBPM is invisible to dev. */
const SUMMARY_SHEET =
  'https://docs.google.com/spreadsheets/d/1PJwjR5nWhgof182M2QQZyqcyDLE75DZmZ3io7oRssOU/edit?gid=1532103019#gid=1532103019'
const CASE_SHEET =
  'https://docs.google.com/spreadsheets/d/1PbmV9ngmoX2CyJ-R4MNXu0rkTDmryeodWWOeOGnlxrM/edit?usp=sharing'

const PLATFORM: Record<string, { label: string; pill: string; href?: string }> = {
  summary: {
    label: 'Summary sheet',
    pill: 'bg-sky-50 text-sky-700 border-sky-200',
    href: SUMMARY_SHEET,
  },
  cases: {
    label: 'Test case file',
    pill: 'bg-sky-50 text-sky-700 border-sky-200',
    href: CASE_SHEET,
  },
  bbpm: { label: 'BBPM', pill: 'bg-violet-50 text-violet-700 border-violet-200' },
  slack: { label: 'Slack', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

type PlatformKey = 'summary' | 'cases' | 'bbpm' | 'slack'

/* The pill is the link when there is somewhere to go — a reader who has just
   read "do it on the Summary sheet" wants to open it from here, not hunt for
   the URL in Slack. */
function Platform({ k, note }: { k: PlatformKey; note?: string }) {
  const p = PLATFORM[k]
  const pill = cn(
    'inline-block w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium',
    p.pill,
  )
  return (
    <span className="inline-flex flex-col gap-0.5">
      {p.href ? (
        <a
          href={p.href}
          target="_blank"
          rel="noreferrer"
          className={cn(pill, 'hover:underline')}
          title={`Open ${p.label}`}
        >
          {p.label} ↗
        </a>
      ) : (
        <span className={pill}>{p.label}</span>
      )}
      {note && <code className="text-[10.5px] text-muted">{note}</code>}
    </span>
  )
}

interface Step {
  step: string
  who: string
  team: 'BB' | 'SVN' | 'Both'
  action: React.ReactNode
  platform: PlatformKey
  platformNote?: string
}

const STEPS: Step[] = [
  {
    step: '1. Mark ready',
    who: 'Module owner',
    team: 'BB',
    action: (
      <>
        Finish the feature and do a basic QA pass, then mark <code>Ready to test</code> on the{' '}
        <a
          href={SUMMARY_SHEET}
          target="_blank"
          rel="noreferrer"
          className="text-brand hover:underline"
        >
          Summary sheet
        </a>{' '}
        of <em>Saramin VN &times; BB</em>. Anything unfinished stays <code>Pending</code>.
      </>
    ),
    platform: 'summary',
  },
  {
    step: '2. Test',
    who: 'Tester',
    team: 'SVN',
    action: (
      <>
        <strong>
          Run only the cases whose status is <code>To do</code>
        </strong>{' '}
        — if the status is <code>Pending</code>, do not test it. Record the result:{' '}
        <code>Pass</code>, <code>Failed</code> or <code>Pending</code>. A <code>Pending</code>{' '}
        result must carry a note saying why it could not be run.
      </>
    ),
    platform: 'cases',
  },
  {
    step: '3. Report the bug',
    who: 'Tester',
    team: 'SVN',
    action: (
      <>
        For every <code>Failed</code> case, create an issue — <strong>Type = Bug</strong>,{' '}
        <strong>Assignee = the module owner</strong>, plus <strong>one label</strong>. Extra
        detail goes in comments on the issue.
      </>
    ),
    platform: 'bbpm',
  },
  {
    step: '4. Triage and fix',
    who: 'BA + Dev',
    team: 'BB',
    action: (
      <>
        Review the bug and assign it to a Dev. Once the fix is done, move the status to{' '}
        <code>Review/QA</code>.
      </>
    ),
    platform: 'bbpm',
  },
  {
    step: '5. Verify',
    who: 'Tester',
    team: 'SVN',
    action: (
      <>
        Check the fix. <code>Done</code> if it is fixed, <code>Recheck</code> if it is still
        broken — which sends it back to step 4.
      </>
    ),
    platform: 'bbpm',
  },
  {
    step: 'Any time',
    who: 'Anyone',
    team: 'Both',
    action: (
      <>
        Ask a question — one question per thread, opening with the module name in brackets.
      </>
    ),
    platform: 'slack',
    platformNote: '#saramin-testing',
  },
]

const TEAM_PILL: Record<Step['team'], string> = {
  BB: 'bg-amber-50 text-amber-800 border-amber-200',
  SVN: 'bg-blue-50 text-blue-700 border-blue-200',
  Both: 'bg-canvas text-muted border-line',
}

const READY_VALUES: [string, React.ReactNode][] = [
  ['Ready to test', 'BB has finished the feature and done basic QA. SVN can start.'],
  [
    'Pending',
    <>
      Not ready. <strong>Do not test it and do not report bugs on it.</strong>
    </>,
  ],
]

const RESULT_VALUES: [string, string, React.ReactNode][] = [
  ['Pass', 'Everything in the expected result was true', '—'],
  ['Failed', 'Any part of the expected result was not true', 'A bug on BBPM (step 3)'],
  [
    'Pending',
    'The case could not be run at all',
    <>
      <strong>A note telling BB why</strong>, so we can unblock it
    </>,
  ],
]

/* The only three labels a tester picks. BBPM's create rule auto-attaches `Bug`
   when Type = Bug, so these sit on top of it and sub-classify.
   Deliberately NOT labels: module (the Epic field carries it), urgency
   (Priority), and bug-vs-task (Type) — a second copy of a field only drifts. */
const LABELS: { label: string; dot: string; when: React.ReactNode; goes: string }[] = [
  {
    label: 'Feature bug',
    dot: 'bg-red-500',
    when: 'The behaviour or the logic is wrong',
    goes: 'A Dev',
  },
  {
    label: 'UI bug',
    dot: 'bg-pink-500',
    when: 'It works, but it looks wrong — layout, spacing, wrong state shown',
    goes: 'Front-end',
  },
  {
    label: 'Improvement',
    dot: 'bg-purple-500',
    when: (
      <>
        Nothing is broken &mdash; you would like it to work differently
      </>
    ),
    goes: 'A BA decides — never straight to a Dev',
  },
]

/* BB name on the build plan → the handle to pick in BBPM's assignee box.
   Kept as a map rather than renaming the owners in build/*.ts, because those
   files mirror the SVN team's own sheet. */
const BBPM_HANDLE: Record<string, string> = {
  Luan: '@luan',
  Luong: '@DucLuong',
}

/* Every module and its owner, read straight from the build plan so this table
   cannot drift from the spec. Adding a module to build/*.ts adds a row here. */
const OWNERS = BUILD_MODULES.map((m) => ({
  module: m.title,
  id: m.id,
  owner: m.owner,
  handle: BBPM_HANDLE[m.owner] ?? `@${m.owner}`,
}))

/* BBPM's own issue statuses, in the order its dropdown lists them, with the
   dot colour each one carries there — so a reader recognises the status in the
   tool rather than translating from a word. */
const LIFECYCLE: { status: string; dot: string; who: string; meaning: string }[] = [
  { status: 'Backlog', dot: 'bg-gray-400', who: 'BB', meaning: 'Accepted, but not scheduled yet' },
  { status: 'To Do', dot: 'bg-blue-500', who: 'SVN', meaning: 'Reported, waiting for BB to triage' },
  { status: 'In Progress', dot: 'bg-amber-500', who: 'BB', meaning: 'Assigned to a Dev and being worked on' },
  { status: 'Review/QA', dot: 'bg-purple-500', who: 'BB', meaning: 'Fix is done, waiting for SVN to verify' },
  { status: 'Recheck', dot: 'bg-orange-500', who: 'SVN', meaning: 'Still broken — returns to BB' },
  { status: 'Done', dot: 'bg-green-500', who: 'SVN', meaning: 'Verified fixed' },
  { status: 'Canceled', dot: 'bg-red-500', who: 'BB', meaning: 'Not a bug, or agreed with SVN that it will not be fixed' },
]

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-9 mb-3 text-[15px] font-semibold">{children}</h2>
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full text-[12.5px] border-collapse">
        <thead>
          <tr className="bg-canvas/70 text-left text-[11px] uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TestingWorkflow() {
  return (
    <div className="max-w-[900px] pb-16">
      <h1 className="mb-2 text-[24px] font-bold tracking-tight">Testing workflow — BB &times; SVN</h1>
      <p className="mb-7 max-w-[70ch] text-[14px] leading-relaxed text-ink/75">
        How work passes between the two teams during the testing window. Every step below names{' '}
        <strong>who acts</strong>, <strong>what they do</strong>, and{' '}
        <strong>which platform they do it on</strong>.
      </p>

      <Table head={['Step', 'Who acts', 'Action', 'Platform']}>
        {STEPS.map((s) => (
          <tr key={s.step} className="border-t border-line-soft align-top">
            <td className="px-3 py-2.5 font-medium whitespace-nowrap">{s.step}</td>
            <td className="px-3 py-2.5 whitespace-nowrap">
              <span
                className={cn(
                  'inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                  TEAM_PILL[s.team],
                )}
              >
                {s.team}
              </span>
              <span className="ml-1.5 text-[12px] text-muted">{s.who}</span>
            </td>
            <td className="px-3 py-2.5 leading-relaxed text-ink/80">{s.action}</td>
            <td className="px-3 py-2.5">
              <Platform k={s.platform} note={s.platformNote} />
            </td>
          </tr>
        ))}
      </Table>

      <H2>Step 1 — Ready status values</H2>
      <Table head={['Value', 'Meaning']}>
        {READY_VALUES.map(([v, m]) => (
          <tr key={v} className="border-t border-line-soft align-top">
            <td className="px-3 py-2 whitespace-nowrap">
              <code className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-ink/70">{v}</code>
            </td>
            <td className="px-3 py-2 text-ink/80">{m}</td>
          </tr>
        ))}
      </Table>
      <p className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900">
        A case left on <code>Pending</code> after the feature is finished never gets tested.
        Moving it to <code>Ready to test</code> is part of finishing the work.
      </p>

      <H2>Step 2 — Test result values</H2>
      <Table head={['Value', 'When to use', 'Also required']}>
        {RESULT_VALUES.map(([v, w, r]) => (
          <tr key={v} className="border-t border-line-soft align-top">
            <td className="px-3 py-2 whitespace-nowrap">
              <code className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-ink/70">{v}</code>
            </td>
            <td className="px-3 py-2 text-ink/80">{w}</td>
            <td className="px-3 py-2 text-ink/80">{r}</td>
          </tr>
        ))}
      </Table>
      <p className="mt-2.5 rounded-lg border border-line bg-canvas/60 px-3 py-2 text-[12.5px] leading-relaxed text-ink/75">
        <strong>
          <code>Pending</code> always needs the note.
        </strong>{' '}
        Without a reason we cannot tell &ldquo;blocked on missing data&rdquo; from &ldquo;nobody
        got to it&rdquo;, and the case quietly disappears.
      </p>

      <H2>The test cases are a starting point, not the whole list</H2>
      <p className="mb-3 max-w-[70ch] text-[13.5px] leading-relaxed text-ink/80">
        BB wrote the cases in the sheet, but they cannot cover everything — the SVN team knows
        the business better than the document does. <strong>Please explore beyond them</strong>,
        and if you find a case we missed, add it straight into the{' '}
        <a href={CASE_SHEET} target="_blank" rel="noreferrer" className="text-brand hover:underline">
          test case file
        </a>
        .
      </p>
      <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink/75">
        <strong>
          When you add a case, select <code>SVN</code> in the <em>Created by</em> column.
        </strong>{' '}
        That one field is what lets us review your additions separately from ours and fold the
        good ones into the master set — without it, a new case is indistinguishable from one of
        ours and gets lost.
      </p>

      <H2>Step 3 — Which label to pick</H2>
      <Table head={['Label', 'Use it when', 'Goes to']}>
        {LABELS.map((l) => (
          <tr key={l.label} className="border-t border-line-soft align-top">
            <td className="px-3 py-2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', l.dot)} />
                {l.label}
              </span>
            </td>
            <td className="px-3 py-2 text-ink/80">{l.when}</td>
            <td className="px-3 py-2 whitespace-nowrap text-muted">{l.goes}</td>
          </tr>
        ))}
      </Table>
      <p className="mt-2.5 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink/75">
        <strong>Three labels, no more.</strong> BBPM attaches <code>Bug</code> on its own when
        Type is Bug. Do not add a label for the module, the urgency, or bug-versus-task —{' '}
        <strong>Epic</strong>, <strong>Priority</strong> and <strong>Type</strong> already carry
        those, and a second copy only disagrees with the first.
      </p>

      <H2>Step 3 — Who to assign the bug to</H2>
      <Table head={['Module', 'Owner', 'Assign to in BBPM']}>
        {OWNERS.map((o) => (
          <tr key={o.id} className="border-t border-line-soft align-top">
            <td className="px-3 py-2">{o.module}</td>
            <td className="px-3 py-2 whitespace-nowrap text-muted">{o.owner}</td>
            <td className="px-3 py-2 whitespace-nowrap font-medium">{o.handle}</td>
          </tr>
        ))}
      </Table>

      <H2>Steps 4&ndash;5 — The bug lifecycle on BBPM</H2>
      <Table head={['Status', 'Who sets it', 'Meaning']}>
        {LIFECYCLE.map((l) => (
          <tr key={l.status} className="border-t border-line-soft align-top">
            <td className="px-3 py-2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', l.dot)} />
                {l.status}
              </span>
            </td>
            <td className="px-3 py-2 whitespace-nowrap text-muted">{l.who}</td>
            <td className="px-3 py-2 text-ink/80">{l.meaning}</td>
          </tr>
        ))}
      </Table>

      <H2>Asking questions</H2>
      <p className="mb-3 max-w-[70ch] text-[13.5px] leading-relaxed text-ink/80">
        Channel <code className="rounded bg-canvas px-1.5 py-0.5 text-[11.5px]">#saramin-testing</code>.
        Anyone can ask. Two requests so we can answer fast:
      </p>
      <ul className="mb-4 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink/80">
        <li>
          <strong>One question, one thread</strong> — replies stay with the question instead of
          scrolling away.
        </li>
        <li>
          <strong>Start with the module name in brackets</strong>, so the right person picks it up.
        </li>
      </ul>
      <div className="space-y-1.5 rounded-lg border border-line bg-surface px-3.5 py-3 font-mono text-[12px] text-ink/75">
        <p>[JOB] Where do I set the exposure switch?</p>
        <p>[CRM] The quotation total does not include VAT — is that expected?</p>
        <p>[PRODUCTS] Can a package contain two of the same product?</p>
      </div>
    </div>
  )
}
