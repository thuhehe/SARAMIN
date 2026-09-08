---
name: pullcode
description: Put the three Saramin build repos (saramin-vn-admin, svn-be, svn-web) on the `dev` branch and fast-forward them to origin. Use when the user says /pullcode, "pull code", "update the build repos", or before any task that reads the live build code.
allowed-tools: Bash, Read
---

# /pullcode — refresh the three build repos

The build code lives in three sibling repos under `~/Documents/SARAMIN_BUILD`:

| Repo | What it is |
|---|---|
| `saramin-vn-admin` | Admin console — React SPA (Vite 8 + antd 5) |
| `svn-be` | Backend — Spring Boot 4, hexagonal, 11 bounded contexts |
| `svn-web` | Jobseeker + Company site — Next.js 16 App Router |

**`dev` is the real branch.** `main` on all three is a stale release pointer,
hundreds of commits behind. Any task that reads build code must read `dev`.

## Run it

```bash
bash .claude/skills/pullcode/scripts/pull.sh
```

Optionally pass another branch: `bash .claude/skills/pullcode/scripts/pull.sh main`.
Override the root with `SVN_BUILD_ROOT=/path bash …` if the repos move.

The script does, per repo: `fetch --prune` → skip if the working tree is dirty →
checkout `dev` (creating the tracking branch if it does not exist yet) →
`pull --ff-only` → print the new commits.

## Rules the script enforces — do not work around them

- **A dirty repo is skipped, never stashed.** Report it to the user with the file
  list the script printed and let them decide. Do not `git stash`, `git checkout --`,
  or `git reset` on their behalf.
- **Fast-forward only.** If local `dev` has diverged from `origin/dev`, the script
  reports it and stops for that repo. Do not force-reset or rebase without the
  user asking for it explicitly.
- Nothing is pushed. This skill only reads from origin.

## What to report back

Relay the script's summary, compressed to what matters:

1. One line per repo: branch, commits pulled (or "up to date"), HEAD date.
2. **What actually changed**, grouped by theme — read the commit subjects and say
   e.g. "billing: PO issuing reworked (7 commits); masterdata: V450–V454 migrations".
   The raw `git log` dump is not a report.
3. Anything skipped or diverged, and what the user has to do about it.

If the user pulled in order to work on something specific, say whether the new
commits touch it.

## Follow-on

If new commits landed, the spec site at `saramin-eta.vercel.app` may now be
behind the build. Offer `/sync-doc` — do not run it unprompted; it edits the
client-facing docs and needs the user's review.
