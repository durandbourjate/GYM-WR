# Bundle N + V — `action`/`aktion`-Vereinheitlichung + Sprach-Konvention dokumentieren

**Status:** Design-Spec, ungemergt
**Datum:** 2026-05-05
**Branch:** `refactor/bundle-n-action-aktion-vereinheitlichung`
**Audit-Bezug:** [`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md) — Phase 1 Roadmap-Item nach Bundle M
**Aufwand:** S (3.5–5 h, single-Session-Bundle)
**Risiko:** mech-rename + atomic Wire-Vertrag-Anpassung; keine aktiven Nutzer → Synchron-Deploy ohne Backward-Compat

## Zusammenfassung

Bundle N vereinheitlicht den `aktion`-Begriff in zwei semantisch verschiedene Lager und schreibt die zugrundeliegende Hybrid-Sprach-Konvention als Annex (Bundle V) in die Code-Quality-Rules. Das Audit empfahl ursprünglich „aktion → action mechanisch", aber eine genauere Analyse zeigt zwei Lager mit unterschiedlicher Bedeutung:

- **Lager A — Operation-Tag** (`rateLimitCheck_`, `auditLog_`, `LP_AKTIONEN`-Konstanten): generischer „was passiert hier"-Tag im HTTP-/Audit-Kontext → **`action`** (englisch, mit Wire-Vertrag konsistent)
- **Lager B — KI-Sub-Action** (`kiAssistentEndpoint`, KI-Feedback-Sheet): Domain-Konzept, welche KI-Hilfe wird angefordert (`generiereFragetext`, `klassifiziereFrage` etc.) → **`kiAktion`** (deutsch, Hybrid-Schema-konsistent als Domain-Wort)

Die simultane Existenz beider Konzepte (Frontend-Body `{ action: 'kiAssistent', email, aktion, daten }`) macht das Audit-Empfohlene Mech-Rename unmöglich — beide Felder hätten denselben Namen. Die Disambiguierung löst das.

## Scope & Ziel

### Erfolgs-Kriterien

Audit-Re-Run nach Bundle zeigt:
- `aktion`/`Aktion`/`AKTIONEN` als Lager-A-Begriff in `apps-script-code.js`: **0 Treffer**
- `kiAktion`/`kiAktionen`/`kiAktionenAktiv` als neuer Lager-B-Begriff: ~35-40 Treffer
- `LP_AKTIONEN`/`SUS_AKTIONEN`/`SCHREIBENDE_AKTIONEN`: **0 Treffer**, ersetzt durch `LP_ACTIONS`/`SUS_ACTIONS`/`SCHREIBENDE_ACTIONS`
- `.claude/rules/code-quality.md` enthält neue Section „Sprach-Konvention (Hybrid Deutsch/Englisch)"

### In Scope

- **Apps-Script** (`ExamLab/apps-script-code.js`): Lager A → `action`, Lager B → `kiAktion`
- **Frontend** (`ExamLab/src/services/`, `packages/shared/src/editor/`): Lager B → `kiAktion`
- **Sheet-Header** in 2 Sheets: Audit-Log-Sheet (`aktion` → `action`), KI-Feedback-Sheet (`aktion` → `kiAktion`)
- **Doku** (`code-quality.md`): Hybrid-Sprach-Konvention als Annex (Bundle V)

### Out of Scope

- HTTP-Wire-Werte (z.B. `body.action: 'kiAssistent'` bleibt unverändert — API-Vertrag, hat schon englischen Property-Namen)
- Sheet-Spalten ausserhalb der 2 betroffenen Sheets (bleiben Storage-Vertrag, Audit-Empfehlung „Sheet-Spalten nicht anfassen")
- Bundle Q (Test-Verzeichnis-Konsolidierung) — separates nächstes Phase-1-Bundle
- Backward-Compat-Phase im Backend (`body.kiAktion ?? body.aktion`) — entfällt, weil ExamLab keine aktiven Nutzer hat (User-Bestätigung 2026-05-05)

### User-Entscheidungen (Brainstorming-Session 2026-05-05)

| # | Frage | Entscheidung |
|---|---|---|
| Q1 | Scope-Schnitt: Lager A allein, A+B disambiguieren, oder alles zu `action`? | (b) **Lager A + Lager B disambiguieren** |
| Q2 | Lager-B-Name: `kiAktion`, `kiAction`, `subAction`, andere? | (a) **`kiAktion`** (deutsch, Hybrid-Schema-konsistent) |
| Q3 | Wire-Vertrag-Übergang Frontend ↔ Backend: synchron, backward-compat, beides? | (a) **Synchron-Deploy ohne Backward-Compat** (keine aktiven Nutzer) |
| Q4 | Sheet-Spalte `aktion` im KI-Feedback-Sheet: mit-umbenennen oder belassen? | (a) **Mit-umbenennen zu `kiAktion`** |
| Q5 | Bundle V (Sprach-Konvention dokumentieren): im selben Branch oder separat? | (a) **Im selben Branch wie Bundle N** (Annex) |
| Q6 | Bundle Q (`__tests__/` retiren): wann? | (a) **Sequenziell, separates Bundle nach N+V** |
| Q7 | Plural-Formen `aktionenAktiv`/`aktionen`: konsistent mit-umbenennen? | **Ja** (`kiAktionenAktiv`/`kiAktionen`) |
| Q8 | Sheet-Header-Migration: manuell, Migrations-Endpoint, Sheets neu anlegen? | (a) **Manuelle Cell-Edits durch User** nach Apps-Script-Deploy |

## Architektur & Schnitt

### Layer 1 — Apps-Script (`ExamLab/apps-script-code.js`)

#### Lager A — `aktion` → `action` (~10-15 Stellen, mech-rename, kein Wire-Vertrag)

| Stelle | Z. | Vorher | Nachher |
|---|---:|---|---|
| `rateLimitCheck_` Signatur + Body | 218, 221, 224 | `function rateLimitCheck_(aktion, …)`, `'rl_' + aktion`, Error-Message | `function rateLimitCheck_(action, …)`, `'rl_' + action`, dito |
| `lernplattformRateLimitCheck_` Signatur + Body | 265, 268 | `function lernplattformRateLimitCheck_(aktion, …)`, `'lp_rl_' + aktion` | analog |
| `auditLog_` Signatur + Body + Header | 360, 366, 369 | `function auditLog_(aktion, email, details)`, `appendRow(['timestamp', 'aktion', 'email', 'details'])`, `appendRow([…, aktion, email, …])` | `function auditLog_(action, …)`, Header-Row mit `'action'`, dito Body |
| Error-Strings „Unbekannte Aktion" | 1141, 1498 | `'Unbekannte Aktion'` | `'Unbekannte Action'` |
| `LP_AKTIONEN` Konstante + Verweise | 1150, 1160 | `var LP_AKTIONEN = […]`, `LP_AKTIONEN.indexOf(action)` | `var LP_ACTIONS = […]`, `LP_ACTIONS.indexOf(action)` |
| `SUS_AKTIONEN` Konstante + Verweise | 1168, 1169 | `var SUS_AKTIONEN`, `SUS_AKTIONEN.indexOf(action)` | `var SUS_ACTIONS`, `SUS_ACTIONS.indexOf(action)` |
| `SCHREIBENDE_AKTIONEN` Konstante + Verweise | 1177, 1178 | `var SCHREIBENDE_AKTIONEN = LP_AKTIONEN.concat(…)`, `SCHREIBENDE_AKTIONEN.indexOf(action)` | `var SCHREIBENDE_ACTIONS = LP_ACTIONS.concat(…)`, dito |
| `auditLog_`-Detail-Object-Property | 6723, 6748 | `{ aktion: 'auto-disable-attempt', … }` | `{ action: 'auto-disable-attempt', … }` |

**Aufrufer-Audit Lager A:** `rateLimitCheck_('load', …)`, `rateLimitCheck_('save', …)`, `rateLimitCheck_('hb-wr', …)`, `rateLimitCheck_('hb', …)`, `rateLimitCheck_('korr', …)` — keine Argumente sind `aktion`-Token, alle bleiben unverändert (sind Operation-Tag-Werte, kein Bezeichner).

#### Lager B — `aktion` → `kiAktion` (~30+ Stellen, semantischer Rename + Wire-Vertrag-Anpassung)

| Stelle | Z. | Vorher | Nachher |
|---|---:|---|---|
| `kiAssistentEndpoint(body)` Body-Read | 6109, 6115-6116 | `var aktion = body.aktion`, `if (!aktion)`, Error-Message „Keine Aktion angegeben" | `var kiAktion = body.kiAktion`, `if (!kiAktion)`, „Keine kiAktion angegeben" |
| `switch (aktion)` Dispatcher | 6128 | `switch (aktion) { … }` | `switch (kiAktion) { … }` |
| Default-Case Error | 6684 | `'Unbekannte KI-Aktion: ' + aktion` | `'Unbekannte KI-Aktion: ' + kiAktion` |
| Zweiter `body.aktion`-Switch (Statistik/Cleanup) | 11011, 11024, 11058 | analog Z. 6109/6128/6684 | analog Z. 6109/6128/6684 |
| `injiziereKalibrierung_(email, aktion, daten)` Signatur + Body | 5984, 5990, 5993, 5995 | `function injiziereKalibrierung_(email, aktion, daten)`, `lpEmail: email, aktion: aktion`, `baueFewShotBlock_(aktion, …)` | `(email, kiAktion, daten)`, `lpEmail: email, kiAktion: kiAktion`, `baueFewShotBlock_(kiAktion, …)` |
| KI-Feedback-Sheet-Header-Array | 11895 | `['feedbackId','zeitstempel','lpEmail','fachschaft','aktion','fachbereich', …]` | `['feedbackId','zeitstempel','lpEmail','fachschaft','kiAktion','fachbereich', …]` |
| `args.aktion` Schreib-Pfad | 12041 | `args.aktion` | `args.kiAktion` |
| Statistik-Read-Pfade `col('aktion')` | 12086, weitere | `rows[i][col('aktion')]` | `rows[i][col('kiAktion')]` |
| Helper-Funktionen-Signaturen | 12133, 12154, 12158 | `berechneDiffScore_(aktion, ki, lp)`, `istQualifiziert_(aktion, diff)`, `extrahiereText_(aktion, daten)` | analog mit `kiAktion`-Param |
| `extrahiereText_`-Body | 12159 | `if (aktion === 'generiereMusterloesung')` | `if (kiAktion === 'generiereMusterloesung')` |
| Feedback-Eintrag-Property-Read | 3895 | `extrahiereFinaleVersionEditor_(fb.aktion, frage)` | `(fb.kiAktion, frage)` |
| `kalibrierungsEinstellungen.aktionenAktiv`-Read/Write-Endpoints | (Plan-Task: grep) | Property-Lookups `aktionenAktiv` | `kiAktionenAktiv` |
| `KalibrierungsStatistik.aktionen`-Aufbau | (Plan-Task: grep) | `aktionen` als Statistik-Map | `kiAktionen` |

#### Lager-A-vs-Lager-B-Klassifizierungs-Tabelle (Audit-Backstop)

Bei Code-Review gegen diese Tabelle prüfen:

| Stelle ist… | …Lager A wenn… | …Lager B wenn… |
|---|---|---|
| Funktions-Param `aktion` | im Operation-Tag-Kontext (Rate-Limit, Audit-Log) und Aufrufer übergibt freie Strings (`'load'`, `'save'`, `'speichereLernziel:CREATE'`) | KI-Endpoint-Workflow oder Helper innerhalb (z.B. `extrahiereText_`-Helper, `injiziereKalibrierung_`) |
| Property `aktion` in Object-Literal | Detail-Object für `auditLog_`-Call | KI-Feedback-Eintrag, Kalibrierungs-Daten |
| String `'aktion'` als Sheet-Lookup-Key | Audit-Log-Sheet-Header | KI-Feedback-Sheet-Header |
| Konstante `*_AKTIONEN` | HTTP-Endpoint-Discriminator-Liste | (kein Lager-B-Vorkommen) |

### Layer 2 — Frontend

#### `ExamLab/src/services/uploadApi.ts`

```ts
// VORHER
export async function kiAssistent(email: string, aktion: string, daten: Record<string, unknown>): Promise<KIAssistentRueckgabe | null> {
  …
  body: JSON.stringify({ action: 'kiAssistent', email, aktion, daten }),
  …
}

// NACHHER
export async function kiAssistent(email: string, kiAktion: string, daten: Record<string, unknown>): Promise<KIAssistentRueckgabe | null> {
  …
  body: JSON.stringify({ action: 'kiAssistent', email, kiAktion, daten }),
  …
}
```

#### `ExamLab/src/services/kalibrierungApi.ts`

```ts
// VORHER (Z. 5-10)
export type KalibrierungsEinstellungen = {
  global: boolean
  aktionenAktiv: { generiereMusterloesung: boolean, klassifiziereFrage: boolean, … }
  …
}

// VORHER (Z. 17-30)
export type KIFeedbackEintragLP = {
  feedbackId: string
  zeitstempel: string
  aktion: string
  …
}

// VORHER (Z. 33-40)
export type KalibrierungsStatistik = {
  aktionen: Record<string, { vorschlaege: number, … }>
}

// NACHHER
export type KalibrierungsEinstellungen = {
  global: boolean
  kiAktionenAktiv: { … }
  …
}
export type KIFeedbackEintragLP = { …; kiAktion: string; … }
export type KalibrierungsStatistik = { kiAktionen: Record<string, { … }> }
```

#### `ExamLab/src/services/fragensammlungApi.ts`

```ts
// VORHER (Z. 75-78)
interface OffenerKIFeedbackPayload {
  aktion: string
  feedbackId: string
  wichtig: boolean
}

// NACHHER
interface OffenerKIFeedbackPayload {
  kiAktion: string
  feedbackId: string
  wichtig: boolean
}
```

#### `packages/shared/src/editor/` — `useKIAssistent`-Hook + Aufrufer

Vollständiger Aufrufer-Audit nötig in:
- `packages/shared/src/index.ts`
- `packages/shared/src/editor/musterloesungNormalizer.ts`
- `packages/shared/src/editor/types.ts`
- `packages/shared/src/editor/sections/MusterloesungSection.tsx`
- `packages/shared/src/editor/SharedFragenEditor.tsx`

Hook-Signatur (vermutet, in Plan-Task per `grep` verifizieren):
```ts
function useKIAssistent({ aktion, … }: UseKIAssistentArgs): UseKIAssistentReturn
```
→ `kiAktion` als Param-Name + alle Caller anpassen.

#### Settings-UI (Toggle-Tab für `KalibrierungsEinstellungen.kiAktionenAktiv`)

Component-Stelle TBD per Plan-Task `grep -rn 'aktionenAktiv' ExamLab/src/components/`. Erwartung: 1-2 Components mit Toggle-State, Property-Access mit-renamen.

### Layer 3 — Doku (Bundle V Annex)

`.claude/rules/code-quality.md` (Pfad bestätigt: Repo-Root) erhält neue Section:

```markdown
## Sprach-Konvention (Hybrid Deutsch/Englisch)

ExamLab folgt einem Hybrid-Schema: Domain-Konzepte deutsch, Programming-Primitives englisch.

| Bereich | Sprache | Beispiele | Begründung |
|---|---|---|---|
| Domain-Entitäten | Deutsch | Frage, Pruefung, Schueler, Lehrer, Korrektur, Lernziel, Fachbereich, Bewertungsraster, Musterloesung, Aufgabengruppe, Lückentext, **kiAktion** | Bildungs-Domain ist deutsch |
| UI-Strings + Comments | Deutsch (mit Umlaut) | „Prüfung laden", „Schüler" | Deutsche Schule, Lehrer-User |
| Identifier-Form von Domain-Wörtern | Deutsch ohne Umlaut | pruefung, schueler, loesung, **kiAktion** | Cross-Tool-Portabilität (Filenames, IDB-Keys, URLs) |
| Technische Primitives | Englisch | id, data, error, success, dispatch, subscribe, cache, reset, clear | Programming-Universalsprache |
| Programming-Konvention-Präfixe | Englisch | set*, get*, toggle*, use*, on*, handle* | React/Zustand-Ecosystem |
| HTTP-API-Vertrag | Englisch | **action**, body, payload, params | HTTP-Standard |
| Sheet-Spalten | Mix (Backend-Vertrag) | id/typ/status vs. fachbereich/pruefungId/zeitstempel | Storage-Vertrag, sticky |

### Anwendungs-Beispiel: action vs. kiAktion (Bundle N)

Beide Begriffe existieren parallel in HTTP-Bodies:

\`\`\`ts
body: JSON.stringify({
  action: 'kiAssistent',  // HTTP-Endpoint-Discriminator (englisch, Wire-Vertrag)
  email,
  kiAktion: 'generiereMusterloesung',  // KI-Sub-Action (deutsch, Domain-Konzept)
  daten,
})
\`\`\`

`action` ist Wire-Vertrag → englisch. `kiAktion` ist Domain-Konzept (welche pädagogische KI-Hilfe wird angefordert) → deutsch ohne Umlaut.

### Re-Evaluation

Bei einer **Backend-Migration weg von Apps-Script** ist der natürliche Re-Entry-Point für vollständige Vereinheitlichung — dann wäre der Daten-Migrations-Aufwand sowieso anstehend, und Sheet-Spalten + Endpoint-Naming könnten in einem Schritt mit-vereinheitlicht werden.
```

## Migrations-Reihenfolge & Atomic-Bundle

```
Phase 1 — Doku (kein Code-Risiko, kann zuerst gepushed werden)
  Task 1.1  Branch refactor/bundle-n-action-aktion-vereinheitlichung von main (DONE bei Spec-Commit)
  Task 1.2  Bundle V: Section "Sprach-Konvention" in code-quality.md

Phase 2 — Lager A (interne Bezeichner, KEIN Wire-Vertrag, sicher zwischen-pushbar)
  Task 2.1  apps-script-code.js: rateLimitCheck_ + Body
  Task 2.2  apps-script-code.js: lernplattformRateLimitCheck_
  Task 2.3  apps-script-code.js: auditLog_ + Header-Row + Body + Aufrufer-Detail-Objects
  Task 2.4  apps-script-code.js: LP_AKTIONEN/SUS_AKTIONEN/SCHREIBENDE_AKTIONEN + Verweise
  Task 2.5  apps-script-code.js: "Unbekannte Aktion"-Strings

Phase 3 — Lager B Atomic (Wire-Vertrag-Bruch in EINEM Push, Apps-Script + Frontend zusammen)
  Pre-Check Task 3.0  Backend-Read-Pfade-Audit (Memory-Regel):
                       grep -n "body\.aktion\|args\.aktion\|fb\.aktion\|col('aktion')\|aktionenAktiv" apps-script-code.js
                       grep -nE "\.aktionen\b|KalibrierungsStatistik\.aktionen" apps-script-code.js packages/shared/src/ ExamLab/src/
                       grep -rn "\baktion\b\|\baktionen\b" packages/shared/src/editor/ ExamLab/src/services/ ExamLab/src/components/
                       Liste vollständig in Plan-Tasks abdecken (jede Stelle in Lager-A oder Lager-B-Klassifizierungs-Tabelle einsortieren)
  Task 3.1  Apps-Script: kiAssistentEndpoint Body-Read + switch + Default-Case
  Task 3.2  Apps-Script: zweiter switch (body.aktion) Z. 11011 (Statistik/Cleanup-Endpoint)
  Task 3.3  Apps-Script: KI-Feedback-Sheet-Header-Array Z. 11895 + alle col('aktion')-Reads
  Task 3.4  Apps-Script: injiziereKalibrierung_ + Statistik-Helpers
            (berechneDiffScore_, istQualifiziert_, extrahiereText_)
  Task 3.5  Apps-Script: KalibrierungsEinstellungen Read/Write-Endpoints für kiAktionenAktiv
  Task 3.6  Apps-Script: KalibrierungsStatistik kiAktionen-Aufbau
  Task 3.7  Frontend uploadApi.ts: kiAssistent Signatur + Body
  Task 3.8  Frontend kalibrierungApi.ts: KIFeedbackEintragLP, KalibrierungsEinstellungen,
            KalibrierungsStatistik Types
  Task 3.9  Frontend fragensammlungApi.ts: OffenerKIFeedbackPayload
  Task 3.10 shared/src/editor: useKIAssistent-Hook Signatur + alle Aufrufer
  Task 3.11 Settings-UI: Toggle-Tab für kiAktionenAktiv (Component-Rename + Property-Access)
  Task 3.12 Tests anpassen: useKIAssistent.test.tsx, 6 indirekte Test-Files,
            Mock-Updates wo nötig
  Task 3.13 String-Literal-Sweep: grep -n "'aktion'\|\"aktion\"\|\baktion\b" — letzten Sweep
  Task 3.14 Audit-Tokens-Lokal-Re-Run + Klassifizierung-Tabelle gegen-prüfen

Phase 4 — Sheet-Migration & Deploy
  Task 4.1  Apps-Script clasp push (Phase 2 + 3 zusammen — ein Deploy)
  Task 4.2  Manuelle User-Sheet-Edits:
              - Audit-Log-Sheet: Header-Zelle 'aktion' → 'action'
              - KI-Feedback-Sheet: Header-Zelle 'aktion' → 'kiAktion'
  Task 4.3  Frontend Build + Deploy auf staging
  Task 4.4  Browser-E2E mit echten LP-Logins (7 Pflicht-Pfade, siehe Test-Strategie)
  Task 4.5  Audit-Tokens-Re-Run auf Repo-Root: ./scripts/audit-tokens.sh

Phase 5 — Merge auf main
  Task 5.1  Pre-Commit-Checklist (Memory): vitest, tsc, lint, lint:as-any, build
  Task 5.2  Merge auf main (squash oder merge — User-Wahl)
  Task 5.3  Memory-Eintrag „Bundle N+V Komplett auf main" mit Hashes + Lehren
  Task 5.4  HANDOFF.md aktualisieren
  Task 5.5  Branch lokal + remote löschen
```

**Atomic-Bundle-Disziplin Phase 3:** Tasks 3.1-3.14 müssen zusammen gepushed werden (nicht zwischen Apps-Script-Push und Frontend-Push trennen). Phase 2 darf separat gepushed werden, da rein interne Apps-Script-Bezeichner ohne Wire-Vertrag.

## Test- & Verifikations-Strategie

### Automatisierte Tests

| Layer | Test | Erwartung |
|---|---|---|
| Frontend Unit | `ExamLab/src/tests/useKIAssistent.test.tsx` | grün, mit `kiAktion`-Param-Names |
| Frontend Integration | `SharedFragenEditor.autoSave.test.tsx`, `FrageTypAuswahlAudio.test.tsx`, `DragDropBildEditorMultiZone.test.tsx`, `HotspotEditorPflicht.test.tsx`, `BildbeschriftungEditorPflicht.test.tsx`, `SharedFragenEditorSaveHook.test.tsx` | grün, ggf. Mock-Updates |
| Frontend Type-Check | `tsc -b` cross-package | clean |
| Lint | `npm run lint`, `npm run lint:as-any` | clean (kein neues `as any`) |
| Build | `npm run build` | clean |
| Apps-Script | `clasp push` Syntax-Check | success |

### Browser-E2E (Phase 4 Task 4.4)

Auf staging mit echten LP-Logins (Memory-Regel: keine Demo).

**Hintergrund:** Der `switch (kiAktion)`-Dispatcher in `kiAssistentEndpoint` hat 20+ Cases (`generiereFragetext`, `verbessereFragetext`, `pruefeMusterloesung`, `generiereOptionen`, `generiereDistraktoren`, `generiereMusterloesung`, `generierePaare`, `pruefePaare`, `generiereAussagen`, `pruefeAussagen`, `generiereLuecken`, `pruefeLueckenAntworten`, `berechneErgebnis`, `pruefeToleranz`, `bewertungsrasterGenerieren`, `bewertungsrasterVerbessern`, `klassifiziereFrage`, `importiereFragen`, `analysierePruefung`, `generiereFrageZuLernziel`, weitere). Vollständiges E2E-Testen aller wäre Overkill. Stattdessen: Stichprobe pro UI-Aufruf-Kategorie, ergänzt um die zwei Sheet-Lese-Pfade.

**Pflicht-Pfade (mind. 1 pro Kategorie):**

1. **Generierungs-Pfad** (Beispiel: `kiAktion: 'generiereFragetext'` über LP-Editor) — verifiziert Body-Send + Backend-Dispatch + Apps-Script-Read von `body.kiAktion`.
2. **Klassifizierungs-Pfad** (`kiAktion: 'klassifiziereFrage'`) — verifiziert separater Dispatcher-Branch, Bloom-Output.
3. **Musterlösungs-Pfad** (`kiAktion: 'generiereMusterloesung'`) — verifiziert `extrahiereText_(kiAktion === 'generiereMusterloesung')`-Helper.
4. **Bewertungsraster-Pfad** (`kiAktion: 'bewertungsrasterGenerieren'`) — verifiziert weiterer Dispatcher-Branch.
5. **Kalibrierungs-Einstellungen-Tab** — Toggle für `kiAktionenAktiv`-Flags, Speichern + Reload, Werte persistent (verifiziert Read + Write von `kiAktionenAktiv` Property).
6. **KI-Feedback-Eintrag verändern** — `wichtig` setzen + `qualifiziert` togglen + `aktiv`-Status ändern, persist im Sheet (verifiziert `col('kiAktion')`-Read im Statistik-Code + `args.kiAktion`-Write).
7. **Statistik-Tab anzeigen** (falls UI vorhanden) — verifiziert `KalibrierungsStatistik.kiAktionen`-Read + `berechneDiffScore_`/`istQualifiziert_`-Helper.

**Zusätzliches Smoke-Test Cluster:** Nach Phase 4 mind. 3 weitere zufällig gewählte `kiAktion`-Werte aufrufen (z.B. `verbessereFragetext`, `generiereOptionen`, `analysierePruefung`) — kein E2E, nur Smoke (Aufruf returnt success).

**Frontend-Aufruf-Mapping als Plan-Task:** In Phase 3 Task 3.0 zusätzlich `grep -rn "kiAssistent(" ExamLab/src/ packages/shared/src/` machen, alle Frontend-Aufrufer mit ihren `kiAktion`-Werten auflisten und gegen die obigen 7 Pflicht-Pfade abgleichen — falls UI-Aufrufer existieren, die keine der 7 Kategorien treffen, wird die Liste erweitert.

### Audit-Erfolg (Phase 4 Task 4.5)

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-post-bundle-n.md
```

Verifikation:
- `aktion` (Lager A) in `apps-script-code.js`: 0
- `kiAktion`/`kiAktionen`/`kiAktionenAktiv`: ~35-40 Treffer (neuer Token)
- `LP_AKTIONEN`/`SUS_AKTIONEN`/`SCHREIBENDE_AKTIONEN`: 0
- `LP_ACTIONS`/`SUS_ACTIONS`/`SCHREIBENDE_ACTIONS`: existieren

## Risiken & Mitigation

| # | Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|---|
| **R1** | Lager-A vs Lager-B-Disambiguierung falsch | mittel | hoch | Per-Stelle-Klassifizierung in Plan-Tasks; Code-Review gegen Klassifizierungs-Tabelle (Layer 1); Audit-Re-Run als finaler Backstop |
| **R2** | Vergessene Frontend-Aufrufer von `useKIAssistent` oder `kiAssistent()` | niedrig | mittel | `tsc -b` cross-package fängt jeden Type-Mismatch; explizite `grep -rn 'kiAssistent\|useKIAssistent'`-Aufrufer-Suche als Task |
| **R3** | Sheet-Header-Edit vergessen → `col('kiAktion')` returnt -1 | niedrig | mittel | Phase-4-Task-4.2 explizit; E2E-Pfade 6+7 verifizieren beide Sheet-Reads end-to-end |
| **R4** | **Backend-Read-Pfade Audit unvollständig** (Memory-Lehre Bundle 3 hotfix#3+#4) | mittel | hoch | Pre-Check Task 3.0 als eigener Task; vollständige `grep`-Liste in Plan einbetten; jede Stelle in Phase-3-Tasks abhaken |
| **R5** | Atomic-Bundle-Disziplin verletzt | niedrig | niedrig | Phase 2 ist intern (kein Wire-Vertrag) — Push okay; Phase 3 muss atomic in einem Push |
| **R6** | String-Literal-Drift (`'aktion'` als String-Lookup übersehen) | mittel | niedrig | Task 3.13 finaler `grep`-Sweep auf `\baktion\b`/quoted-strings; Audit-Re-Run als Backstop |
| **R7** | Apps-Script `clasp push` Syntax-Bruch | niedrig | niedrig | Lokaler `clasp push` mit Test-Run vor Production-Deploy |
| **R8** | Settings-UI-Component-Rename bricht Toggle-State | niedrig | mittel | E2E-Pfad 6 verifiziert State-Persist nach Reload |

**Memory-Lehren explizit angewandt:**
- **„Backend-Read-Pfade Audit bei Schema-Erweiterung"** (Bundle 3 hotfix#3+#4) → R4 als expliziter Pre-Check Task 3.0
- **„Sorgfalt vor Geschwindigkeit"** → 5 Phasen mit klaren Boundaries statt eines Mega-Commits
- **„Echte Logins statt Demo"** → Browser-E2E Task 4.4 explizit mit echten LP-Logins
- **„Regressions-Prävention"** → Pre-Commit-Checklist + Feature-Branch + Atomic-Bundle Phase 3

## Aufwand & Komplettheits-Kriterium

### Aufwand-Schätzung

| Phase | Aufwand | Begründung |
|---|---|---|
| Phase 1 (Bundle V Annex) | 20-30 min | Tabelle aus Audit umkopieren, Bundle-N-Beispiele dazu |
| Phase 2 (Lager A) | 30-45 min | ~15 Stellen, mech-rename |
| Phase 3 (Lager B Atomic) | 90-120 min | ~35 Apps-Script + 4-6 Frontend + Hook-Aufrufer-Audit + Tests |
| Phase 4 (Deploy + E2E) | 60-90 min | clasp push, 2 Sheet-Edits, staging-Build, 7 Browser-Pfade |
| Phase 5 (Merge + Memory) | 20-30 min | Squash, Memory + HANDOFF |
| **Total** | **~3.5-5 h** | = S-Aufwand-Schätzung des Audits ✅ |

Single-Session-Bundle, bei Reviewer-Loop oder unerwarteten E2E-Failures bis zu 1.5 Sessions.

### Bundle-Komplettheits-Kriterium

Bundle ist „done" wenn:

1. ✅ Audit-Tokens-Re-Run zeigt: `aktion` (Lager A): 0, `kiAktion` als neuer Token: ~35-40
2. ✅ vitest grün, tsc clean, lint clean, lint:as-any clean, build clean
3. ✅ Browser-E2E 7/7 Pflicht-Pfade mit echten LP-Logins + 3 zufällige Smoke-Tests
4. ✅ 2 Sheet-Header korrekt: Audit-Log-Sheet (`action`), KI-Feedback-Sheet (`kiAktion`)
5. ✅ `code-quality.md` enthält Hybrid-Sprach-Konvention-Section + Bundle-N-Beispiel
6. ✅ Branch gemerged auf main, lokal + remote gelöscht
7. ✅ Memory-Eintrag „Bundle N+V Komplett auf main" mit Hashes + Lehren

## Reihenfolge im Vereinfachungs-Audit-Roadmap

Bundle N+V ist das **zweite** Phase-1-Bundle (nach M = Fragenbank-Rename, schon auf main, Merge `606f256`). Danach:

- **Bundle Q** (`__tests__/`-Konsolidierung) — Phase 1, separates Bundle
- Phase 2 startet erst nach Phase-1-Trio (M ✅ + N+V + Q)

## Referenzen

- Audit: [`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md) (Bundle N + Bundle V Sektionen)
- Audit-Tokens-Skript: [`scripts/audit-tokens.sh`](../../../scripts/audit-tokens.sh)
- Bundle M (Vorgänger, gemergt `606f256`): [Memory-Eintrag](../../../../../.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_m_fragensammlung_rename.md)
- Memory-Regeln: „Backend-Read-Pfade Audit", „Sorgfalt vor Geschwindigkeit", „Echte Logins statt Demo", „Regressions-Prävention"
