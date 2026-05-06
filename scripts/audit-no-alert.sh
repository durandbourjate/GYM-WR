#!/usr/bin/env bash
# Audit: alert() / window.alert in produktivem ExamLab-Code.
# Test-Code (*.test.*, __tests__/, tests/) ist erlaubt.
#
# Aufruf:
#   ./scripts/audit-no-alert.sh
#   ./scripts/audit-no-alert.sh --strict   # exit 1 bei Treffern (CI-Gate)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STRICT=0
[[ "${1:-}" == "--strict" ]] && STRICT=1

HITS=$(grep -rEn '\balert\(|window\.alert\(' ExamLab/src \
  --include='*.ts' --include='*.tsx' \
  | grep -v '\.test\.' | grep -v '__tests__' | grep -v '/tests/' || true)

COUNT=0
[[ -n "$HITS" ]] && COUNT=$(echo "$HITS" | grep -c .)

echo "Bundle-R alert()-Audit: $COUNT Treffer in produktivem Code"
[[ -n "$HITS" ]] && echo "$HITS"

if [[ "$STRICT" -eq 1 && "$COUNT" -gt 0 ]]; then
  echo "FEHLER: alert() in produktivem Code nicht erlaubt (Bundle R Konvention). Verwende useToast()."
  exit 1
fi
exit 0
