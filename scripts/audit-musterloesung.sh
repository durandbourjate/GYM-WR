#!/usr/bin/env bash
# Audit-Skript für `musterlosung`/`musterloesung`/`musterLoesung`-Field-Drift.
#
# Hintergrund: Das Musterlösungs-Konzept hat aus historischen Gründen drei
# Identifier-Lager im Code (siehe `.claude/rules/code-quality.md`, Sektion
# "Field-Drift: Musterlösung"):
#   - Lager 1 — Backend-Vertrag: `musterlosung` (no `e`)
#   - Lager 2 — Frontend-Drift:  `musterloesung*` (mit `e`, lowercase)
#   - Lager 3 — CodeFrage:        `musterLoesung` (mit `e`, mixed-case)
# Plus PascalCase-Treffer (UI-Strings + JSX-Comments — kein Identifier-Lager,
# aber via Baseline gelockt).
#
# Aufruf: ./scripts/audit-musterloesung.sh [--strict]
#   --strict: exit 1 wenn ein Token-Count über Baseline (CI-Gate).
#
# Baseline-Werte stammen aus
# `docs/superpowers/specs/2026-05-06-bundle-p-musterloesung-doku-design.md`,
# Sektion 4 (Drift-Inventar). Bei Bundle P-Migration neu setzen.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SOURCES=(
  ExamLab/src
  packages/shared/src
  ExamLab/apps-script-code.js
)

# Parallele Arrays statt `declare -A` (bash 3.2 macOS-kompatibel, analog audit-as-any.sh).
TOKENS=(
  "musterlosung"
  "Musterlosung"
  "musterloesung"
  "Musterloesung"
  "musterLoesung"
  "MusterLoesung"
)
BASELINES=(310 0 70 14 12 0)

# Counts werden parallel zu TOKENS in COUNTS[] geschrieben.
COUNTS=()
DRIFT_INDICES=()

for i in "${!TOKENS[@]}"; do
  token="${TOKENS[$i]}"
  baseline="${BASELINES[$i]}"
  hits=$(grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' "\b$token\b" "${SOURCES[@]}" 2>/dev/null \
    | grep -vE "^[^:]+:[0-9]+:[[:space:]]*(//|/\*|\*)" || true)
  if [[ -z "$hits" ]]; then
    count=0
  else
    count=$(echo "$hits" | grep -c . || true)
  fi
  COUNTS+=("$count")
  if [[ "$count" -gt "$baseline" ]]; then
    DRIFT_INDICES+=("$i")
  fi
done

echo "musterloesung-Audit:"
printf "  %-20s %6s %10s   %s\n" "Token" "Count" "Baseline" "Status"
for i in "${!TOKENS[@]}"; do
  token="${TOKENS[$i]}"
  count="${COUNTS[$i]}"
  baseline="${BASELINES[$i]}"
  status="OK"
  if [[ "$count" -gt "$baseline" ]]; then
    status="DRIFT +$(( count - baseline ))"
  elif [[ "$count" -lt "$baseline" ]]; then
    status="UNDER -$(( baseline - count ))"
  fi
  printf "  %-20s %6d %10d   %s\n" "$token" "$count" "$baseline" "$status"
done

if [[ "${#DRIFT_INDICES[@]}" -gt 0 ]]; then
  echo ""
  echo "Drift erkannt: ${#DRIFT_INDICES[@]} Token über Baseline."
  if [[ "${1:-}" == "--strict" ]]; then
    echo ""
    echo "Verbose-Treffer (max 20 pro Drift-Token):"
    for i in "${DRIFT_INDICES[@]}"; do
      token="${TOKENS[$i]}"
      echo "  --- $token ---"
      grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' "\b$token\b" "${SOURCES[@]}" 2>/dev/null \
        | grep -vE "^[^:]+:[0-9]+:[[:space:]]*(//|/\*|\*)" \
        | head -20
    done
    echo ""
    echo "FAIL: ${#DRIFT_INDICES[@]} Token über Baseline."
    exit 1
  fi
else
  echo ""
  echo "OK: alle Tokens auf oder unter Baseline."
fi
