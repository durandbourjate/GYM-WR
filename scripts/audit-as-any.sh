#!/usr/bin/env bash
# Audit-Skript für as-any-Stellen.
# Konvention: Defensive-Casts haben Marker `Defensive` in derselben Zeile wie der Cast (1-Zeilen-Scan).
# Aufruf: ./scripts/audit-as-any.sh [--strict]
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Alle as-any-Stellen
TOTAL=$(grep -rn "as any" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l | tr -d ' ')

# Defensive: Inline-Marker in derselben Zeile (akzeptiert auch as unknown as)
DEFENSIVE=$(grep -rEn "as (unknown as |any).*Defensive" ExamLab/src/ packages/shared/src/ 2>/dev/null | wc -l | tr -d ' ')

UNDOKUMENTIERT=$((TOTAL - DEFENSIVE))

echo "as-any-Audit:"
echo "  Total:                 $TOTAL"
echo "  Defensive (OK):        $DEFENSIVE"
echo "  Undokumentiert (FAIL): $UNDOKUMENTIERT"

if [[ "${1:-}" == "--strict" && "$UNDOKUMENTIERT" -gt 0 ]]; then
  echo "FAIL: $UNDOKUMENTIERT undokumentierte as-any-Stellen"
  exit 1
fi
