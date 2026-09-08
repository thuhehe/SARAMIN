---
name: sync-doc
description: Reconcile the spec site (saramin-eta.vercel.app) against what the three build repos actually do — propose the doc edits, get the user's approval, then apply them and append a client-facing changelog entry. Use when the user says /sync-doc, "sync the docs", "update the spec from the code", or after /pullcode brought in new commits.
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, AskUserQuestion, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__navigate, mcp__Claude_Browser__read_page, mcp__Claude_Browser__computer, mcp__Claude_Browser__read_console_messages
---

# /sync-doc — make the docs match the build

Two things must agree:

| | Where | What it is |
|---|---|---|
| **Docs** | `~/Documents/SARAMIN` → `saramin-eta.vercel.app` | The client-facing source of truth: requirements in `src/data/build/*.ts`, prototypes in `src/pages/adminPrototypes.tsx` / `Mockups.tsx` / `CompanyMockups.tsx` |
| **Build** | `~/Documents/SARAMIN_BUILD` (3 repos, branch `dev`) | The code that actually shipped |

When they disagree, **the docs are wrong until a decision says otherwise** — but
"the code changed" is not automatically "the spec was wrong". Sometimes the code
drifted from an approved spec, and the answer is a dev ticket, not a doc edit.
Deciding which is which is the whole job here, and it is the user's call, not yours.

## Hard rules

1. **Nothing is edited before the user approves.** The proposal comes first,
   as a table. Read-only until then.
2. **Requirement and mockup move together** — see the standing rule in memory
   (`mockup-and-requirement-together`). A requirement edit whose screen still
   shows the old flow is the exact drift this site exists to prevent.
3. **Every approved change gets a changelog entry** in `src/data/changelog.ts`.
   No entry, no sync.
4. **The baseline in `docs/sync/state.json` advances only for what was applied.**
   If the user rejects a finding, do NOT record its commit as synced — it would
   be silently skipped forever. Leave the baseline where it was, or advance it
   and carry the rejected finding into `docs/sync/deferred.md` with the reason.
5. Never commit or push. Leave the working tree for the user to review.

## Step 1 — make sure you are reading the real code

```bash
bash .claude/skills/sync-doc/scripts/scan.sh
```

The script warns if a repo is not on `dev` or is behind `origin/dev`. If it
warns, stop and run `/pullcode` first — syncing docs against stale code writes
wrong requirements, which is worse than out-of-date ones.

Modes, chosen automatically from `docs/sync/state.json`:

- **incremental** — a baseline SHA exists per repo: the scan reports commits,
  scopes and behaviour-bearing files changed since it.
- **full** (`--full`, or no baseline) — no diff to work from, so the scan dumps
  the current inventory: bounded contexts, controllers + endpoint counts, Flyway
  migrations, domain enums (svn-be); features, routes, live flags (svn-web);
  modules and route config (admin). Compare that against the docs by hand.

## Step 2 — turn the scan into candidate findings

The scan gives you where to look, not what to write. For each candidate, open
the actual code and read it — a commit subject is a claim, the code is evidence.

What counts as doc-relevant (worth a finding):

- A **status or lifecycle** changed — new state, renamed state, a transition
  that is now blocked. These belong in the requirement **as a table**, never as
  an explainer inside a mockup (memory: `status-as-table-in-requirement`).
- A **rule** changed: who may do a thing, what is validated, what a quota or
  entitlement now allows.
- A **field** appeared, disappeared, or changed meaning / required-ness.
- A **screen or flow** exists in the build that the mockups do not show, or the
  build merged/split a step the mockups still show separately.
- **Scope** moved: a feature went live, was parked, or a new module appeared
  (a new `features/` dir in svn-web, a new module in the admin, a new bounded
  context or a batch of migrations in svn-be).

What does NOT get a finding — say so once, in a single line, and move on:

- Refactors, renames, test-only and CI-only commits, dependency bumps,
  performance work, copy edits that keep the meaning.
- Anything whose doc page already says the right thing.

For each finding, resolve the doc target before proposing it:

- Which module file in `src/data/build/*.ts`, and **is that module actually
  wired into `BUILD_MODULES`** (`src/data/buildModules.ts`)? `company-user.ts`
  is authored but trimmed out of the build plan — a feature added there renders
  nowhere. If the target is parked, that is itself the finding to raise.
- Which mockup screen, in which prototype file.

## Step 3 — propose, and wait

Present one table. Nothing else, no edits yet:

| # | What the build now does | Doc says | Proposed edit | Target | Evidence |
|---|---|---|---|---|---|
| 1 | Free CV pack needs Kích hoạt before it runs | silent on activation | add a states table + a mockup button | `products-packages.ts` · `admin-products` | `svn-be@3a2a37c` |

Then ask. Use `AskUserQuestion` when the set is small and the choices are
"apply / skip / it's a dev bug"; ask in prose when the findings need discussion.
Three answers must stay available for every row:

- **apply** — the docs were behind, fix them.
- **skip / defer** — record in `docs/sync/deferred.md`, do not touch the docs.
- **the code is wrong** — the spec stands; the output is a dev ticket, not a doc
  edit (see memory `requirement-vs-task-description` for what a ticket looks like).

Do not bundle unrelated findings into one yes/no. A user who wants rows 1 and 4
but not 2 must be able to say that.

## Step 4 — apply what was approved

Per approved row:

1. Edit the requirement in `src/data/build/<module>.ts`. Statuses and
   lifecycles go in as a `table`. Write what the product does, in the voice the
   surrounding file already uses — do not paste Java or TypeScript into a
   requirement, and do not name classes, endpoints or migrations in the reader's
   text (the `backend` block is where a contract belongs).
2. Edit the matching mockup so the screen shows it. If the feature has no
   screen yet, say so in the report rather than inventing one silently.
3. Terminology is fixed: `v.1` / "version", never "bản"; the admin **rejects**
   the CV and the system compares **versions** (memory `cv-version-terminology`).
4. Append one `ChangeEntry` at the TOP of `CHANGELOG` in `src/data/changelog.ts`:
   - `date` today, `kind` (`requirement` / `mockup` / `both` / `scope` / `decision`),
     `module` + `featureKey` so the entry links to its page,
   - `title` and `detail` **bilingual** (`{ vi, en }`) — the client reads this,
   - `source: [{ repo, sha, note }]` — the commit the change was read out of.
   - Write it for a reader who was not in the meeting: what it was, what it is
     now, why. "Updated job management" tells them nothing.
5. Update `docs/sync/state.json`: per repo, `lastSyncedSha` = the `dev` HEAD you
   actually reconciled, `lastSyncedAt` + `lastSyncAt` = today. Only for repos
   whose findings were all resolved (applied, deferred-with-a-note, or ticketed).

## Step 5 — verify, then report

```bash
npx tsc --noEmit
```

Vite/esbuild does not type-check, so this is the only thing that catches a
malformed entry. Then render it: `preview_start` the spec site, open
`/changelog`, confirm the new entries and their module links resolve (a link to
a module that is not in `BUILD_MODULES` redirects to `/` — that means the target
was parked and the finding is unresolved). Screenshot it for the user.

Report: what changed in the docs, what was deferred and why, what turned into a
dev ticket, and the new baseline SHAs. Then remind the user the change is local
— they review and commit.
