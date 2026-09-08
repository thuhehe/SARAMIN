#!/usr/bin/env bash
#
# Put all three build repos on `dev` and fast-forward them.
#
# Safety rules, in order of priority:
#   1. Never lose work. A repo with uncommitted changes is SKIPPED, not stashed.
#   2. Never rewrite history. Only `--ff-only` pulls; a diverged local `dev`
#      is reported, never force-reset.
#   3. Say what happened. Every repo prints one line, plus the new commits.
#
# Exit code is 0 even when a repo is skipped — the report is the deliverable,
# and the caller decides what to do about a skip. A non-zero exit means the
# script itself could not run (missing root, missing repo).

set -uo pipefail

ROOT="${SVN_BUILD_ROOT:-$HOME/Documents/SARAMIN_BUILD}"
REPOS=(saramin-vn-admin svn-be svn-web)
BRANCH="${1:-dev}"

if [[ ! -d "$ROOT" ]]; then
  echo "FATAL: build root not found: $ROOT" >&2
  exit 1
fi

skipped=()
diverged=()

for repo in "${REPOS[@]}"; do
  dir="$ROOT/$repo"
  echo "════════════════════════════════════════════════════════════"
  echo "  $repo"
  echo "════════════════════════════════════════════════════════════"

  if [[ ! -d "$dir/.git" ]]; then
    echo "  ✗ not a git repo: $dir"
    skipped+=("$repo (not a git repo)")
    echo
    continue
  fi

  git -C "$dir" fetch origin --prune --quiet || echo "  ! fetch failed (offline?) — working from what is already local"

  # Uncommitted work: report exactly what, then leave the repo alone.
  dirty="$(git -C "$dir" status --porcelain)"
  if [[ -n "$dirty" ]]; then
    echo "  ⚠ SKIPPED — uncommitted changes ($(echo "$dirty" | wc -l | tr -d ' ') file(s)):"
    echo "$dirty" | sed 's/^/      /' | head -20
    echo "    Commit, stash or discard them, then run /pullcode again."
    skipped+=("$repo (uncommitted changes)")
    echo
    continue
  fi

  current="$(git -C "$dir" branch --show-current)"
  before="$(git -C "$dir" rev-parse HEAD)"

  if [[ "$current" != "$BRANCH" ]]; then
    if git -C "$dir" show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git -C "$dir" checkout --quiet "$BRANCH" || { skipped+=("$repo (checkout failed)"); echo; continue; }
    elif git -C "$dir" show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
      git -C "$dir" checkout --quiet -b "$BRANCH" --track "origin/$BRANCH" || { skipped+=("$repo (checkout failed)"); echo; continue; }
      echo "  + created local $BRANCH tracking origin/$BRANCH"
    else
      echo "  ✗ no branch '$BRANCH' locally or on origin"
      skipped+=("$repo (no $BRANCH branch)")
      echo
      continue
    fi
    echo "  branch: $current → $BRANCH"
  else
    echo "  branch: $BRANCH"
  fi

  if ! git -C "$dir" pull --ff-only --quiet origin "$BRANCH" 2>/dev/null; then
    ahead_behind="$(git -C "$dir" rev-list --left-right --count "$BRANCH...origin/$BRANCH" 2>/dev/null || echo '? ?')"
    echo "  ⚠ NOT fast-forward — local/remote have diverged (ahead/behind: $ahead_behind)"
    echo "    Nothing was rewritten. Resolve by hand (rebase or merge) — this script will not force."
    diverged+=("$repo")
    echo
    continue
  fi

  after="$(git -C "$dir" rev-parse HEAD)"
  if [[ "$before" == "$after" ]]; then
    echo "  ✓ already up to date ($(git -C "$dir" log -1 --format='%h %s' | cut -c1-72))"
  else
    n="$(git -C "$dir" rev-list --count "$before..$after")"
    files="$(git -C "$dir" diff --name-only "$before..$after" | wc -l | tr -d ' ')"
    echo "  ✓ pulled $n commit(s), $files file(s) changed"
    echo "    HEAD: $(git -C "$dir" log -1 --format='%h %s · %an · %ci' | cut -c1-100)"
    echo "    new commits (excluding merges):"
    git -C "$dir" log --no-merges --oneline "$before..$after" | head -25 | sed 's/^/      /'
    total_nm="$(git -C "$dir" rev-list --no-merges --count "$before..$after")"
    if (( total_nm > 25 )); then echo "      … and $((total_nm - 25)) more"; fi
  fi
  echo
done

echo "════════════════════════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════════════════════════"
for repo in "${REPOS[@]}"; do
  dir="$ROOT/$repo"
  [[ -d "$dir/.git" ]] || { printf "  %-18s —\n" "$repo"; continue; }
  printf "  %-18s %-6s %s\n" "$repo" "$(git -C "$dir" branch --show-current)" "$(git -C "$dir" log -1 --format='%h %ci' 2>/dev/null)"
done
if (( ${#skipped[@]} )); then
  echo
  echo "  Skipped: ${skipped[*]}"
fi
if (( ${#diverged[@]} )); then
  echo "  Diverged (needs a human): ${diverged[*]}"
fi
