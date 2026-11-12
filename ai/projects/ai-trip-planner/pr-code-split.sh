#!/usr/bin/env bash
# Prints a markdown table splitting a branch's diff into product code vs dev code.
# Usage (from the ai-trip-planner repo): pr-code-split.sh [base]   (default base: origin/master)
# Works on macOS bash 3.2 — no associative arrays; the totals are summed in awk.
set -euo pipefail

base="${1:-origin/master}"
range="$(git merge-base "$base" HEAD)..HEAD"

classify() {
  case "$1" in
    package-lock.json|deno.lock|*.snap|storybook-static/*) echo "skip" ;;
    *.stories.svelte|*.stories.ts|*.stories.js|.storybook/*) echo "stories" ;;
    *.test.*|*.spec.*|*.itest.*|*_test.ts|tests/*|supabase/itests/*|*/test/*|vitest.config.*|playwright.config.*|*/global-setup.js) echo "tests" ;;
    */__mocks__/*|*/mock/*|*/mocks/*|*Mock*.svelte|public/mockServiceWorker.js|*fixture*|*/fixtures/*|*.test-fixtures/*) echo "mocks" ;;
    scripts/*|tools/*) echo "tooling" ;;
    docs/*|design/*|*.md) echo "docs" ;;
    *) echo "product" ;;
  esac
}

git diff --numstat "$range" | while IFS=$'\t' read -r a d f; do
  # renames show as "old => new" / "dir/{old => new}"; keep the new path
  f="$(sed -E 's#\{[^}]* => ([^}]*)\}#\1#; s#.* => ##; s#//#/#g' <<<"$f")"
  [[ "$a" == "-" ]] && a=0 && d=0   # binary file
  printf '%s\t%s\t%s\n' "$(classify "$f")" "$a" "$d"
done | awk -F'\t' -v base="$base" '
  { n[$1]++; a[$1]+=$2; d[$1]+=$3 }
  function pct(x) { return total ? sprintf("%d%%", (x * 100 + total / 2) / total) : "0%" }
  function row(label, k) { printf "| %s | %d | +%d | -%d | %s |\n", label, n[k], a[k], d[k], pct(a[k] + d[k]) }
  END {
    split("tests stories mocks tooling", dev, " ")
    for (i in dev) { n["dev"] += n[dev[i]]; a["dev"] += a[dev[i]]; d["dev"] += d[dev[i]] }
    total = a["product"] + d["product"] + a["dev"] + d["dev"]
    print "## Code split\n"
    print "| Category | Files | Added | Deleted | Share |"
    print "|---|--:|--:|--:|--:|"
    row("**Product code** (shipped: src, edge fns, workers, migrations, static)", "product")
    row("**Dev code**", "dev")
    row("↳ tests (unit, component, e2e, integration)", "tests")
    row("↳ stories (Storybook)", "stories")
    row("↳ mocks & fixtures", "mocks")
    row("↳ tooling (scripts/, tools/)", "tooling")
    printf "\n_Share = added + deleted lines over product + dev. Not counted: docs (%d files, +%d / -%d), lockfiles & generated (%d files). Base: `%s`._\n", n["docs"], a["docs"], d["docs"], n["skip"], base
  }'
