#!/usr/bin/env bash
#
# Read-only scan of the three build repos, for /sync-doc.
#
# Two modes:
#   incremental (default, when docs/sync/state.json carries a baseline SHA)
#       → what changed in the build since the docs were last synced
#   full (--full, or no baseline yet)
#       → the current inventory of the build, to compare against the docs
#
# Writes nothing. Touches no branch. Output is meant to be read by the agent,
# not by a person — it is deliberately verbose and grouped by repo.

set -uo pipefail

ROOT="${SVN_BUILD_ROOT:-$HOME/Documents/SARAMIN_BUILD}"
SPEC_ROOT="${SPEC_ROOT:-$HOME/Documents/SARAMIN}"
STATE="$SPEC_ROOT/docs/sync/state.json"
BRANCH="${BRANCH:-dev}"
MODE="incremental"
[[ "${1:-}" == "--full" ]] && MODE="full"

sha_for() { # repo -> baseline sha from state.json, empty when absent
  python3 - "$STATE" "$1" <<'PY' 2>/dev/null
import json,sys
try:
    d=json.load(open(sys.argv[1]))
except Exception:
    print(""); raise SystemExit
print((d.get("repos",{}).get(sys.argv[2],{}) or {}).get("lastSyncedSha") or "")
PY
}

echo "SCAN MODE (requested): $MODE"
echo "build root: $ROOT   branch: $BRANCH"
echo "state file: $STATE $( [[ -f $STATE ]] && echo '(present)' || echo '(missing)' )"
echo

for repo in saramin-vn-admin svn-be svn-web; do
  dir="$ROOT/$repo"
  echo "###############################################################"
  echo "# $repo"
  echo "###############################################################"
  if [[ ! -d "$dir/.git" ]]; then echo "  (missing)"; echo; continue; fi

  head_branch="$(git -C "$dir" branch --show-current)"
  echo "checked-out branch: $head_branch   HEAD: $(git -C "$dir" log -1 --format='%h %ci')"
  if [[ "$head_branch" != "$BRANCH" ]]; then
    echo "!! WARNING: not on $BRANCH — run /pullcode first, this scan is reading $head_branch"
  fi
  behind="$(git -C "$dir" rev-list --count "HEAD..origin/$BRANCH" 2>/dev/null || echo 0)"
  [[ "$behind" != "0" ]] && echo "!! WARNING: $behind commit(s) behind origin/$BRANCH — run /pullcode first"

  base="$(sha_for "$repo")"
  if [[ "$MODE" == "incremental" && -n "$base" ]] && git -C "$dir" cat-file -e "$base^{commit}" 2>/dev/null; then
    echo "baseline: $base ($(git -C "$dir" log -1 --format=%ci "$base"))"
    n="$(git -C "$dir" rev-list --no-merges --count "$base..HEAD")"
    echo "commits since baseline (no merges): $n"
    echo
    echo "--- commit subjects (grouped by conventional-commit scope) ---"
    git -C "$dir" log --no-merges --format='%s' "$base..HEAD" \
      | sed -E 's/^([a-z]+)\(([^)]+)\):/[\2] \1:/' | sort | uniq -c | sort -rn | head -120
    echo
    echo "--- files changed (top dirs) ---"
    git -C "$dir" diff --name-only "$base..HEAD" \
      | awk -F/ '{print $1"/"$2}' | sort | uniq -c | sort -rn | head -30
    echo
    echo "--- behaviour-bearing files changed ---"
    git -C "$dir" diff --name-only "$base..HEAD" | grep -E \
      '(Controller|Service|UseCase|Handler|Policy|Status|Enum|migration/.*\.sql|\.api\.ts|\.service\.ts|schema\.ts|routes?\.(ts|tsx)|live-features\.ts|page\.tsx)' \
      | head -80
  else
    [[ "$MODE" == "incremental" ]] && echo "no usable baseline → falling back to FULL inventory for this repo"
    echo
    case "$repo" in
      svn-be)
        echo "--- bounded contexts (domain) ---"
        ls "$dir/svn-domain/src/main/java/com/saramin/svn/domain" 2>/dev/null | tr '\n' ' '; echo
        echo "--- REST controllers ---"
        find "$dir/svn-adapter-in-web" -name '*Controller.java' -not -path '*/build/*' 2>/dev/null \
          | sed "s|$dir/||" | sort
        echo "--- endpoint count per controller ---"
        find "$dir/svn-adapter-in-web" -name '*Controller.java' -not -path '*/build/*' 2>/dev/null \
          | while read -r f; do printf "%4s  %s\n" "$(grep -cE '@(Get|Post|Put|Patch|Delete)Mapping' "$f")" "$(basename "$f")"; done | sort -rn
        echo "--- flyway migrations (last 25) ---"
        find "$dir" -path '*db/migration*' -name 'V*.sql' -not -path '*/build/*' 2>/dev/null \
          | xargs -n1 basename 2>/dev/null | sort -V | tail -25
        echo "--- domain enums / status lifecycles ---"
        grep -rlE '^public enum' "$dir/svn-domain/src/main/java" 2>/dev/null | xargs -n1 basename | sort | tr '\n' ' '; echo
        ;;
      svn-web)
        echo "--- features ---"
        ls "$dir/features" 2>/dev/null | tr '\n' ' '; echo
        echo "--- routes (app/[lang]) ---"
        find "$dir/app" -name 'page.tsx' 2>/dev/null | sed "s|$dir/app/||;s|/page.tsx||" | sort
        echo "--- live feature flags ---"
        cat "$dir/const/live-features.ts" 2>/dev/null | grep -vE '^\s*(//|/\*|\*)' | head -60
        ;;
      saramin-vn-admin)
        echo "--- modules ---"
        ls "$dir/src/modules" 2>/dev/null | tr '\n' ' '; echo
        echo "--- routes / navigation config ---"
        ls "$dir/src/configs" 2>/dev/null | tr '\n' ' '; echo
        grep -rhoE "path: *'[^']+'" "$dir/src/configs" 2>/dev/null | sort -u | head -80
        ;;
    esac
  fi
  echo
done

echo "###############################################################"
echo "# spec site (docs target)"
echo "###############################################################"
echo "--- modules wired into BUILD_MODULES ---"
grep -oE '^\s+[a-zA-Z]+,' "$SPEC_ROOT/src/data/buildModules.ts" 2>/dev/null | tr -d ' ,' | tr '\n' ' '; echo
echo "--- build data files ---"
ls "$SPEC_ROOT/src/data/build" 2>/dev/null | tr '\n' ' '; echo
echo "--- changelog entries on record ---"
grep -cE "^\s+\{" "$SPEC_ROOT/src/data/changelog.ts" 2>/dev/null || echo "0 (no changelog file yet)"
