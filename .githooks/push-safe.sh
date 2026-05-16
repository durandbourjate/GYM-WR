#!/usr/bin/env bash
#
# push-safe.sh — Pusht 1 Branch und wartet auf Deploy-grün.
#
# **WICHTIG:** der `.github/workflows/deploy.yml` baut bei JEDEM Push BEIDE
# Branches (main + preview) in 1 Pages-Site. Doppel-Push ist überflüssig +
# erzeugt Cancellations. Standard-Pattern: nur einen Branch pushen.
#
# Memory: `feedback_github_push_gruen.md`
#
# Usage: ./push-safe.sh [branch1 [branch2 ...]]
#   ohne args: pusht aktuellen branch nur
#   mit args: pusht jeden Branch sequenziell und wartet auf Deploy
#            (nur sinnvoll wenn echt unterschiedliche SHAs zu deployen sind)
#

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [ $# -eq 0 ]; then
  BRANCHES=("$(git rev-parse --abbrev-ref HEAD)")
else
  BRANCHES=("$@")
fi

for branch in "${BRANCHES[@]}"; do
  echo ""
  echo "📤 Pushing $branch..."
  git push origin "$branch"

  # Kurz warten dass GitHub den neuen Run sieht
  sleep 5

  # Run-ID für den eben gepushten Commit + Branch finden
  sha=$(git rev-parse "$branch")
  run_id=$(gh run list --branch="$branch" --limit=1 --json databaseId,headSha -q ".[] | select(.headSha == \"$sha\") | .databaseId" | head -1)

  if [ -z "$run_id" ]; then
    echo "⚠️  Kein Workflow-Run gefunden für $branch@$sha — überspringe Wait"
    continue
  fi

  echo "⏳ Warte auf Deploy $run_id ($branch@${sha:0:7})..."
  if ! gh run watch "$run_id" --exit-status; then
    echo "❌ Deploy $run_id für $branch failed!"
    exit 1
  fi
  echo "✅ Deploy für $branch grün."
done

echo ""
echo "🎉 Alle Branches sequenziell gepusht + deployed."
