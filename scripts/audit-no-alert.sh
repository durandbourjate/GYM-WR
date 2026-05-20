#!/usr/bin/env bash
# Audit: alert() / window.alert in produktivem ExamLab-Code.
# Test-Code (*.test.*, __tests__/, tests/) ist erlaubt.
#
# Aufruf:
#   ./scripts/audit-no-alert.sh
#   ./scripts/audit-no-alert.sh --strict              # exit 1 bei Treffern (CI-Gate)
#   ./scripts/audit-no-alert.sh --target=<dir>        # Audit anderes Verzeichnis statt ExamLab/src
#   ./scripts/audit-no-alert.sh --strict --target=<dir>

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STRICT=0
TARGET_OVERRIDE=""
for arg in "$@"; do
  case "$arg" in
    --strict)
      STRICT=1
      ;;
    --target=*)
      TARGET_OVERRIDE="${arg#--target=}"
      ;;
  esac
done

if [[ -n "$TARGET_OVERRIDE" ]]; then
  SOURCE="$TARGET_OVERRIDE"
else
  SOURCE="ExamLab/src"
fi

HITS=$(grep -rEn '\balert\(|window\.alert\(' "$SOURCE" \
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
