#!/usr/bin/env bash
# Audit-Skript: kein __tests__/-Verzeichnis im Source-Tree.
#
# Hintergrund: Bundle Q (2026-05) — Test-Layer-Strategie konsolidiert.
# Tests sind colocated *.test.{ts,tsx} oder in src/tests/ resp.
# src/tests/regression/. __tests__/-Wrapper-Ordner sind retired.
#
# Aufruf: ./scripts/audit-test-locations.sh [--strict]
#   --strict: exit 1 wenn Treffer > 0 (CI-Gate).
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ROOTS=(
  "ExamLab/src"
  "packages/shared/src"
)

strict=false
[ "${1:-}" = "--strict" ] && strict=true

found=0
for root in "${ROOTS[@]}"; do
  if [ -d "$root" ]; then
    matches=$(find "$root" -type d -name "__tests__" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      while IFS= read -r dir; do
        echo "FAIL: $dir"
        found=$((found + 1))
      done <<< "$matches"
    fi
  fi
done

if [ "$found" -gt 0 ]; then
  echo ""
  echo "Treffer: $found __tests__/-Verzeichnis(se)."
  echo "Siehe .claude/rules/code-quality.md → Test-Layer-Strategie."
  if $strict; then
    exit 1
  fi
else
  echo "OK: keine __tests__/-Verzeichnisse gefunden."
fi
