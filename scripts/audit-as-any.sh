#!/usr/bin/env bash
# Audit-Skript für undokumentierte `any`-Verwendungen in TypeScript-Code.
#
# Erfasst drei Token:
#   - `as any` (Type-Cast)
#   - `: any` (Parameter-/Variable-/Property-Type-Annotation)
#   - `= any` (Type-Alias-Definition, z.B. `type X = any`)
#
# Defensive-Konvention: das Token steht auf der gleichen Zeile wie ein
# Inline-Kommentar mit dem Wort `Defensive` (1-Zeilen-Scan, robust gegen
# Mehrzeilen-Casts).
#
# Filter:
#   - Block-/Single-Line-Kommentare am Zeilenanfang werden ignoriert.
#   - Inline-Kommentar-Treffer (`// ... as any ...`) werden ignoriert.
#   - String-Literal-Treffer (`'as any'`, `"as any"`) werden ignoriert.
#
# Aufruf: ./scripts/audit-as-any.sh [--strict] [--target=<dir>]
#   --strict:        exit 1 wenn UNDOKUMENTIERT > 0 (CI-Gate).
#   --target=<dir>:  Audit nur dieses Verzeichnis statt ExamLab/src + packages/shared/src.
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
  SOURCES=("$TARGET_OVERRIDE")
else
  SOURCES=(ExamLab/src packages/shared/src)
fi

# Alle Treffer (`as any` oder `: any` als Token), ohne Kommentar-Zeilen
# und ohne String-Literal-Wrapping.
RAW_HITS=$(grep -rEn '\bas any\b|: any\b|= any\b' "${SOURCES[@]}" 2>/dev/null | \
  grep -vE '^[^:]+:[0-9]+:\s*(//|/\*|\*)' | \
  grep -vE "['\"]as any['\"]" || true)

TOTAL=$(echo "$RAW_HITS" | grep -c . || true)

# Davon: Treffer mit `Defensive`-Marker auf derselben Zeile.
DEFENSIVE=$(echo "$RAW_HITS" | grep -c 'Defensive' || true)

UNDOKUMENTIERT=$((TOTAL - DEFENSIVE))

echo "as-any-Audit:"
echo "  Total:                 $TOTAL"
echo "  Defensive (OK):        $DEFENSIVE"
echo "  Undokumentiert (FAIL): $UNDOKUMENTIERT"

if [[ "$STRICT" -eq 1 && "$UNDOKUMENTIERT" -gt 0 ]]; then
  echo ""
  echo "FAIL: $UNDOKUMENTIERT undokumentierte any-Verwendungen."
  echo "Verbose:"
  echo "$RAW_HITS" | grep -v 'Defensive' | head -20
  exit 1
fi
