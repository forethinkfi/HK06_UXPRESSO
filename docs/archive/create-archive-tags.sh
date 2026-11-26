#!/usr/bin/env bash
# Creates the archive/* and backup/* tags recorded in docs/archive/README.md.
# Only creates tags (no branch is deleted). Run from the repository root:
#   bash docs/archive/create-archive-tags.sh           # create local tags, check SHAs
#   git push origin --tags
#   bash docs/archive/create-archive-tags.sh --verify  # check the tags on GitHub
set -euo pipefail
git fetch origin --prune --quiet

# branch | archive tag | last commit recorded on 2026-11-26
ARCHIVE="
integration/final-ai|archive/integration-final-ai|4d5d24b
mega-ver.2|archive/mega-ver.2|cf9209c
feat/v2-i-prototype-app|archive/feat-v2-i-prototype-app|cf6c887
docs/add-personas|archive/docs-add-personas|a29568e
feat/v2-logo-assets|archive/feat-v2-logo-assets|0f90103
docs/v2-i-artboard|archive/docs-v2-i-artboard|073b4f2
feature/motion-mega-coffee|archive/feature-motion-mega-coffee|31a9d65
claude/wonderful-volta-bp3aia|archive/claude-wonderful-volta-bp3aia|a8ecc07
integration/v2-ai-test-r2|archive/integration-v2-ai-test-r2|fe78a12
integration/v2-ai-test|archive/integration-v2-ai-test|b653970
experiment/ai-poc|archive/experiment-ai-poc|ba831c9
feat/photos-lucide-type-scale|archive/feat-photos-lucide-type-scale|3fa0823
"
# Snapshot of every branch head before the cleanup
BACKUP="
main|4d5d24b
feature/supabase-orders|d19077c
backup/ai-studio-1126|8da554a
claude/zealous-meitner-05f4g0|4d5d24b
$(echo "$ARCHIVE" | awk -F'|' 'NF==3 {print $1"|"$3}')
"

fail=0
check() { # name expected-short-sha actual-full-sha
  if [[ "$3" == "$2"* ]]; then echo "OK    $1 -> ${3:0:7}"; else echo "FAIL  $1 -> ${3:-missing} (expected $2)"; fail=1; fi
}

if [[ "${1:-}" == "--verify" ]]; then
  remote=$(git ls-remote --tags origin)
  sha_of() { echo "$remote" | awk -v t="refs/tags/$1^{}" -v l="refs/tags/$1" '$2==t {d=$1} $2==l && !d {d=$1} END {print d}'; }
  while IFS='|' read -r b t s; do [[ -n "$b" ]] && check "$t" "$s" "$(sha_of "$t")"; done <<< "$ARCHIVE"
  while IFS='|' read -r b s; do [[ -n "$b" ]] && check "backup/pre-cleanup-2026-11-26/$b" "$s" "$(sha_of "backup/pre-cleanup-2026-11-26/$b")"; done <<< "$BACKUP"
  exit $fail
fi

make_tag() { # tag sha message
  if git rev-parse -q --verify "refs/tags/$1" >/dev/null; then echo "skip  $1 (exists)"; return; fi
  git tag -a "$1" "$2" -m "$3"
}
while IFS='|' read -r b t s; do
  [[ -z "$b" ]] && continue
  head=$(git rev-parse -q --verify "origin/$b" || true)
  if [[ -n "$head" && "$head" != "$s"* ]]; then echo "NOTE  origin/$b moved to ${head:0:7} since 2026-11-26; tagging the recorded commit $s. Review the new commits before deleting the branch."; fi
  make_tag "$t" "$s" "Archive of branch $b (last commit $s, recorded 2026-11-26). See docs/archive/README.md"
  check "$t" "$s" "$(git rev-parse "$t^{commit}")"
done <<< "$ARCHIVE"
while IFS='|' read -r b s; do
  [[ -z "$b" ]] && continue
  make_tag "backup/pre-cleanup-2026-11-26/$b" "$s" "Branch $b before the repository cleanup (2026-11-26)"
  check "backup/pre-cleanup-2026-11-26/$b" "$s" "$(git rev-parse "backup/pre-cleanup-2026-11-26/$b^{commit}")"
done <<< "$BACKUP"
exit $fail
