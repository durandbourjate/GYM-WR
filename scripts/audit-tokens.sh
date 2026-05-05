#!/usr/bin/env bash
# Audit-Skript für Legacy-Begriffe + deutsch/englisch-Mix in ExamLab.
#
# Erfasst Vorkommen pro Token in:
#   - ExamLab/src (Production-Code, ohne Tests)
#   - ExamLab/src Tests (*.test.*, *.spec.*, __tests__/, tests/)
#   - packages/shared/src (Editor-Code, Types, Test-Helpers, ohne Tests)
#   - packages/shared/src Tests
#   - apps-script-code.js (Backend)
#
# Output: Markdown-Tabelle pro Token-Gruppe.
#
# Aufruf: ./scripts/audit-tokens.sh [token1 token2 ...]
#   Ohne Argument: alle Tokens aus DEFAULT_TOKENS.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Default-Token-Liste aus Audit-Spec §3.1 A1.1
# (case-sensitive, da Bedeutung kontext-abhängig)
DEFAULT_TOKENS=(
  fragenbank Fragenbank FRAGENBANK
  pool Pool POOL
  pruefung Pruefung
  prüfung Prüfung
  uebung Uebung ueben Ueben uebungs
  übung Übung üben
  schueler Schueler
  schüler Schüler
  sus SuS
  lehrer Lehrer
  aktion Aktion
  action Action
  frage Frage
  question Question
  korrekt Korrekt
  loesung Loesung musterloesung
  lösung Lösung musterlösung
  bewertungsraster Bewertungsraster
)

TOKENS=("${@:-${DEFAULT_TOKENS[@]}}")

# Helper: count token in a path (case-sensitive, word-boundary)
# Args: $1=token, $2=path-glob, $3=include-tests (1=yes, 0=no)
count_in() {
  local token="$1"
  local include_path="$2"
  local include_tests="$3"

  if [[ ! -e "$include_path" ]]; then
    echo 0
    return
  fi

  # File-Pattern für TS/TSX/JS Code
  local files
  if [[ "$include_path" == *.js ]]; then
    files="$include_path"
  else
    if [[ "$include_tests" == "1" ]]; then
      files=$(find "$include_path" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" \) \
        \( -name "*.test.*" -o -name "*.spec.*" -o -path "*/__tests__/*" -o -path "*/tests/*" \) 2>/dev/null)
    else
      files=$(find "$include_path" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" \) \
        ! -name "*.test.*" ! -name "*.spec.*" ! -path "*/__tests__/*" ! -path "*/tests/*" 2>/dev/null)
    fi
  fi

  if [[ -z "$files" ]]; then
    echo 0
    return
  fi

  # Word-boundary grep, case-sensitive
  echo "$files" | xargs grep -E "\b${token}\b" 2>/dev/null | wc -l | tr -d ' '
}

# Header
echo "# Token-Audit (case-sensitive, word-boundary)"
echo
echo "| Token | src (prod) | src (test) | shared (prod) | shared (test) | apps-script | Total |"
echo "|-------|-----------:|-----------:|--------------:|--------------:|------------:|------:|"

for token in "${TOKENS[@]}"; do
  src_prod=$(count_in "$token" "ExamLab/src" "0")
  src_test=$(count_in "$token" "ExamLab/src" "1")
  shared_prod=$(count_in "$token" "packages/shared/src" "0")
  shared_test=$(count_in "$token" "packages/shared/src" "1")
  apps=$(count_in "$token" "ExamLab/apps-script-code.js" "0")
  total=$((src_prod + src_test + shared_prod + shared_test + apps))

  printf "| %s | %d | %d | %d | %d | %d | %d |\n" \
    "$token" "$src_prod" "$src_test" "$shared_prod" "$shared_test" "$apps" "$total"
done
