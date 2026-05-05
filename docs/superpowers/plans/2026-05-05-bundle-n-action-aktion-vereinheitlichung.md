# Bundle N+V Implementation Plan — `action`/`aktion`-Vereinheitlichung + Sprach-Konvention

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. Apps-Script-Deploys (`clasp push`), Sheet-Cell-Edits, und Browser-E2E sind User-Aktionen — Subagents führen sie NICHT aus.

**Goal:** `aktion`-Begriff in Apps-Script + Frontend disambiguieren in zwei Lager (Lager A → `action` für Operation-Tags, Lager B → `kiAktion` für KI-Sub-Action-Domain-Konzept) plus Hybrid-Sprach-Konvention als Annex in `code-quality.md` festhalten.

**Architecture:** 5 Phasen. Phase 1 = Doku (Bundle V Annex), Phase 2 = Lager A intern (Apps-Script-Bezeichner ohne Wire-Vertrag), Phase 3 = Lager B atomic (Wire-Vertrag-Bruch in einem Push: Apps-Script + Frontend zusammen), Phase 4 = User-Deploy + Sheet-Edits + E2E-Test, Phase 5 = Merge.

**Tech Stack:** TypeScript (React 19/Zustand), Apps-Script (Google), vitest, eslint, clasp, audit-tokens.sh

**Spec:** [`docs/superpowers/specs/2026-05-05-bundle-n-action-aktion-vereinheitlichung-design.md`](../specs/2026-05-05-bundle-n-action-aktion-vereinheitlichung-design.md)

**Branch:** `refactor/bundle-n-action-aktion-vereinheitlichung` (auf Commit `fa67d57`)

**Repo:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY` (NICHT der Master-Working-Dir des Sessions)

**Baseline (für Verifikations-Vergleiche):**
- `grep -wc 'aktion\|Aktion\|AKTIONEN' ExamLab/apps-script-code.js` = **56**
- `grep -wc 'kiAktion' ExamLab/apps-script-code.js` = **0**
- vitest: Baseline beim Phase-3-Start neu messen, alle bestehenden Tests müssen grün bleiben

---

## File-Struktur

| Datei | Aktion | Verantwortlichkeit |
|---|---|---|
| `.claude/rules/code-quality.md` | Modify (Append) | Bundle V Annex: Sprach-Konvention-Section |
| `ExamLab/apps-script-code.js` | Modify (~50 Stellen) | Lager A → `action`, Lager B → `kiAktion`, Sheet-Header-Arrays |
| `ExamLab/src/services/uploadApi.ts` | Modify (Z. 179, 186) | `kiAssistent`-Funktion-Signatur + Body |
| `ExamLab/src/services/kalibrierungApi.ts` | Modify (Z. 5-40) | Type-Felder `aktion`/`aktionen`/`aktionenAktiv` |
| `ExamLab/src/services/fragensammlungApi.ts` | Modify (Z. 75-78) | `OffenerKIFeedbackPayload.aktion` |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | Modify | `useKIAssistent`-Hook-Aufrufer |
| `packages/shared/src/editor/sections/MusterloesungSection.tsx` | Modify | `useKIAssistent`-Hook-Aufrufer |
| `packages/shared/src/editor/musterloesungNormalizer.ts` | Modify (falls `aktion`-Param) | TBD-grep |
| `packages/shared/src/editor/types.ts` | Modify (falls Type-Felder) | TBD-grep |
| `packages/shared/src/index.ts` | Modify (Re-Exports) | TBD-grep |
| `ExamLab/src/components/lp/**/*.tsx` (Settings-UI) | Modify (1-2 Files) | Toggle-Component für `kiAktionenAktiv` |
| `ExamLab/src/tests/useKIAssistent.test.tsx` | Modify | Direkter Hook-Test |
| `ExamLab/src/tests/SharedFragenEditor.autoSave.test.tsx` | Modify (falls Mock-Updates nötig) | Indirekt |
| `ExamLab/src/tests/FrageTypAuswahlAudio.test.tsx` | Modify | Indirekt |
| `ExamLab/src/tests/DragDropBildEditorMultiZone.test.tsx` | Modify | Indirekt |
| `ExamLab/src/tests/HotspotEditorPflicht.test.tsx` | Modify | Indirekt |
| `ExamLab/src/tests/BildbeschriftungEditorPflicht.test.tsx` | Modify | Indirekt |
| `ExamLab/src/tests/SharedFragenEditorSaveHook.test.tsx` | Modify | Indirekt |
| `ExamLab/HANDOFF.md` | Modify (Append) | Bundle-N+V-Eintrag |
| Memory-Files | Create | `project_bundle_n_v_komplett.md` + Index-Update |

**User-Aktionen (NICHT Subagent-scope):**
- Apps-Script-Deploy via `clasp push`
- Manuelle Sheet-Header-Edits (Audit-Log-Sheet, KI-Feedback-Sheet)
- Frontend Build + Deploy auf staging
- Browser-E2E mit echten LP-Logins
- Final-Merge auf main

---

## Phase 1 — Doku (Bundle V Annex)

### Task 1.1: Sprach-Konvention-Section in code-quality.md schreiben

**Files:**
- Modify: `.claude/rules/code-quality.md` (Append am Ende)

- [ ] **Step 1: Aktuelles Ende von code-quality.md lesen, Stil-Konsistenz prüfen**

```bash
tail -30 .claude/rules/code-quality.md
```

Beobachten: Wie sind bestehende Sections formatiert (## vs ###, Code-Block-Stil, Tabellen-Stil)?

- [ ] **Step 2: Section "Sprach-Konvention (Hybrid Deutsch/Englisch)" anhängen**

Append am Ende von `.claude/rules/code-quality.md`:

```markdown

## Sprach-Konvention (Hybrid Deutsch/Englisch)

ExamLab folgt einem Hybrid-Schema: Domain-Konzepte deutsch, Programming-Primitives englisch. Geltungsbereich: alles unter `ExamLab/`, `packages/shared/`, sowie Apps-Script-Code.

| Bereich | Sprache | Beispiele | Begründung |
|---|---|---|---|
| Domain-Entitäten | Deutsch | `Frage`, `Pruefung`, `Schueler`, `Lehrer`, `Korrektur`, `Lernziel`, `Fachbereich`, `Bewertungsraster`, `Musterloesung`, `Aufgabengruppe`, `Lückentext`, `kiAktion` | Bildungs-Domain ist deutsch, keine sauberen englischen Übersetzungen |
| UI-Strings + Comments | Deutsch (mit Umlaut) | „Prüfung laden", „Schüler", „Lösung" | Lehrer-User, deutsche Schule |
| Identifier-Form von Domain-Wörtern | Deutsch ohne Umlaut | `pruefung`, `schueler`, `loesung`, `musterloesung`, `kiAktion` | Cross-Tool-Portabilität (Filenames, IDB-Keys, URLs) |
| Technische Primitives | Englisch | `id`, `data`, `error`, `success`, `dispatch`, `subscribe`, `cache`, `reset`, `clear` | Programming-Universalsprache |
| Programming-Konvention-Präfixe | Englisch | `set*`, `get*`, `toggle*`, `use*`, `on*`, `handle*` | React/Zustand-Ecosystem |
| HTTP-API-Vertrag | Englisch | `action`, `body`, `payload`, `params` | HTTP-Standard |
| Sheet-Spalten | Mix (Backend-Vertrag) | `id`/`typ`/`status` vs. `fachbereich`/`pruefungId`/`zeitstempel` | Storage-Vertrag, sticky |

### Anwendungs-Beispiel: `action` vs. `kiAktion` (Bundle N)

Beide Begriffe existieren parallel im selben HTTP-Body:

\`\`\`ts
body: JSON.stringify({
  action: 'kiAssistent',                  // HTTP-Endpoint-Discriminator (englisch, Wire-Vertrag)
  email,
  kiAktion: 'generiereMusterloesung',     // KI-Sub-Action (deutsch, Domain-Konzept)
  daten,
})
\`\`\`

`action` ist Wire-Vertrag → englisch. `kiAktion` ist Domain-Konzept (welche pädagogische KI-Hilfe wird angefordert) → deutsch ohne Umlaut.

### Anwendungs-Heuristik

Wenn Du einen neuen Bezeichner einführst, frag:
1. Ist es ein **HTTP-Property/Wire-Vertrag-Feld**? → englisch (`action`, `body`, `id`, `data`)
2. Ist es ein **Programming-Primitive** (Hook, State-Setter, Event-Handler)? → englisch (`useFoo`, `setFoo`, `onFoo`)
3. Ist es ein **Domain-Begriff aus dem Schul-Kontext**? → deutsch ohne Umlaut für Identifier (`pruefung`, `schueler`), mit Umlaut für UI-Strings („Prüfung", „Schüler")
4. Ist es eine **Sheet-Spalte**? → bestehender Storage-Vertrag, nicht anfassen

### Re-Evaluation

Bei einer **Backend-Migration weg von Apps-Script** ist der natürliche Re-Entry-Point für vollständige Vereinheitlichung — dann wäre der Daten-Migrations-Aufwand sowieso anstehend, und Sheet-Spalten + Endpoint-Naming könnten in einem Schritt mit-vereinheitlicht werden.
```

- [ ] **Step 3: Datei lesen + visuelle Verifikation der Tabellen-Formatierung**

```bash
tail -60 .claude/rules/code-quality.md
```

Erwartung: Tabelle gerendert sauber, Code-Block-Escaping korrekt (Backslash-Backticks bleiben in Source als `\`\`\`ts`).

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/code-quality.md
git commit -m "Bundle V: Sprach-Konvention Hybrid Deutsch/Englisch in code-quality.md

Annex zu Bundle N. Dokumentiert das etablierte Hybrid-Schema mit Beispiel
action vs kiAktion aus dem KI-Endpoint, Anwendungs-Heuristik (4 Fragen)
für neue Bezeichner-Entscheidungen, Re-Evaluation-Hinweis bei
Backend-Migration."
```

---

## Phase 2 — Lager A (Apps-Script intern, kein Wire-Vertrag)

### Task 2.1: Pre-Audit Lager A — Vollständigkeits-Grep

**Files:** Read-only, keine Modifikation.

- [ ] **Step 1: Alle Lager-A-Stellen auflisten**

```bash
grep -nE '\b(aktion|Aktion|AKTION|aktionen|AKTIONEN)\b' ExamLab/apps-script-code.js | grep -vE 'kiAssistent|kalibrier|Feedback|fb\.aktion|args\.aktion|body\.aktion|extrahiereText_|berechneDiffScore_|istQualifiziert_|injiziereKalibrierung_|switch \(aktion\)|case .generiereFragetext|case .verbessere|case .pruefe|case .klassifiziere|case .bewertung|col\(.aktion'
```

Erwartung: ~10-15 Stellen, alle aus dem Set: `rateLimitCheck_`, `lernplattformRateLimitCheck_`, `auditLog_`, `LP_AKTIONEN`, `SUS_AKTIONEN`, `SCHREIBENDE_AKTIONEN`, „Unbekannte Aktion"-Strings, `auditLog_(…, { aktion: '…' })`-Detail-Object-Properties (Z. 6723, 6748).

Speichere die Output-Liste als Referenz für Task 2.6 (Verification).

### Task 2.2: `rateLimitCheck_` und `lernplattformRateLimitCheck_` umbenennen

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 218, 221, 224, 265, 268)

- [ ] **Step 1: rateLimitCheck_ Signatur + Body**

In `ExamLab/apps-script-code.js` Z. 218-225:

```js
// VORHER
function rateLimitCheck_(aktion, email, maxProFenster, fensterSekunden) {
  …
  var key = 'rl_' + aktion + '_' + email.toLowerCase();
  …
    return { blocked: true, error: 'Zu viele Anfragen (' + aktion + '). Bitte ' + Math.ceil(fensterSekunden / 60) + ' Min. warten.' };
}

// NACHHER
function rateLimitCheck_(action, email, maxProFenster, fensterSekunden) {
  …
  var key = 'rl_' + action + '_' + email.toLowerCase();
  …
    return { blocked: true, error: 'Zu viele Anfragen (' + action + '). Bitte ' + Math.ceil(fensterSekunden / 60) + ' Min. warten.' };
}
```

- [ ] **Step 2: lernplattformRateLimitCheck_ Signatur + Body**

In `ExamLab/apps-script-code.js` Z. 265-270 analog:

```js
function lernplattformRateLimitCheck_(action, key, maxProFenster, fensterSekunden) {
  …
  var cacheKey = 'lp_rl_' + action + '_' + key.toLowerCase();
  …
}
```

- [ ] **Step 3: Aufrufer prüfen (read-only)**

```bash
grep -n 'rateLimitCheck_\|lernplattformRateLimitCheck_' ExamLab/apps-script-code.js
```

Erwartung: Aufrufer übergeben Operation-Tag-Strings (`'load'`, `'save'`, `'hb-wr'`, `'hb'`, `'korr'`, `'lp_login'` etc.) — keine sind `aktion`-Token, alle bleiben unverändert.

- [ ] **Step 4: Verifikation Datei-Syntax**

Falls lokal `clasp` verfügbar:

```bash
cd ExamLab && clasp push --force --watch
# CTRL-C nach success
```

Sonst nur visuell prüfen, dass keine Klammer-/Kommata-Schäden eingebracht wurden.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle N Lager A: rateLimitCheck_ + lernplattformRateLimitCheck_ aktion → action"
```

### Task 2.3: `auditLog_` Signatur + Header-Row + Body + Aufrufer-Detail-Objects

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 360-369, 6723, 6748)

- [ ] **Step 1: auditLog_ Signatur + Header-Row + Body**

Z. 360-369:

```js
// VORHER
function auditLog_(aktion, email, details) {
  …
      sheet.appendRow(['timestamp', 'aktion', 'email', 'details']);
  …
    sheet.appendRow([new Date().toISOString(), aktion, email, JSON.stringify(details)]);
}

// NACHHER
function auditLog_(action, email, details) {
  …
      sheet.appendRow(['timestamp', 'action', 'email', 'details']);
  …
    sheet.appendRow([new Date().toISOString(), action, email, JSON.stringify(details)]);
}
```

- [ ] **Step 2: Detail-Object-Properties in zwei `auditLog_`-Aufrufern (Z. 6723, 6748)**

```js
// VORHER (Z. 6723)
auditLog_('kiAssistent:quotaExceeded', callerEmail, { aktion: 'auto-disable-attempt', status: status });

// NACHHER
auditLog_('kiAssistent:quotaExceeded', callerEmail, { action: 'auto-disable-attempt', status: status });
```

```js
// VORHER (Z. 6748)
auditLog_('kiAssistent:quotaExceeded', callerEmail, { aktion: 'auto-disable-attempt', fehler: String(e.message || e).substring(0, 200) });

// NACHHER
auditLog_('kiAssistent:quotaExceeded', callerEmail, { action: 'auto-disable-attempt', fehler: String(e.message || e).substring(0, 200) });
```

- [ ] **Step 3: Verifikation — keine `aktion` mehr in auditLog_-Kontext**

```bash
grep -nE 'auditLog_.*aktion|aktion.*auditLog_' ExamLab/apps-script-code.js
```

Erwartung: 0 Treffer.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle N Lager A: auditLog_ aktion → action (Header + Body + 2 Aufrufer-Detail-Objects)"
```

### Task 2.4: `LP_AKTIONEN`/`SUS_AKTIONEN`/`SCHREIBENDE_AKTIONEN` Konstanten

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 1150, 1160, 1168, 1169, 1177, 1178)

- [ ] **Step 1: Drei Konstanten + ihre `.indexOf(action)`-Verweise umbenennen**

```js
// VORHER (Z. 1150-1178)
var LP_AKTIONEN = [
  …
];
…
if (LP_AKTIONEN.indexOf(action) >= 0) {
  …
}
…
var SUS_AKTIONEN = ['speichereAntworten', 'heartbeat', 'ladeKorrekturenFuerSuS', 'ladeKorrekturDetail'];
if (SUS_AKTIONEN.indexOf(action) >= 0) {
  …
}
…
var SCHREIBENDE_AKTIONEN = LP_AKTIONEN.concat(['speichereAntworten']);
if (SCHREIBENDE_AKTIONEN.indexOf(action) >= 0) {
  …
}

// NACHHER — alle drei *_AKTIONEN → *_ACTIONS
var LP_ACTIONS = [
  …
];
…
if (LP_ACTIONS.indexOf(action) >= 0) {
  …
}
…
var SUS_ACTIONS = ['speichereAntworten', 'heartbeat', 'ladeKorrekturenFuerSuS', 'ladeKorrekturDetail'];
if (SUS_ACTIONS.indexOf(action) >= 0) {
  …
}
…
var SCHREIBENDE_ACTIONS = LP_ACTIONS.concat(['speichereAntworten']);
if (SCHREIBENDE_ACTIONS.indexOf(action) >= 0) {
  …
}
```

- [ ] **Step 2: Verifikation — keine `*_AKTIONEN` mehr**

```bash
grep -nE '(LP_AKTIONEN|SUS_AKTIONEN|SCHREIBENDE_AKTIONEN)' ExamLab/apps-script-code.js
```

Erwartung: 0 Treffer.

```bash
grep -nE '(LP_ACTIONS|SUS_ACTIONS|SCHREIBENDE_ACTIONS)' ExamLab/apps-script-code.js
```

Erwartung: 6 Treffer (3 Definitionen + 3 .indexOf-Verweise).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle N Lager A: LP_AKTIONEN/SUS_AKTIONEN/SCHREIBENDE_AKTIONEN → *_ACTIONS"
```

### Task 2.5: „Unbekannte Aktion"-Error-Strings + Audit-Sheet-Initial-Header

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 1141, 1498)

- [ ] **Step 1: Beide Error-Messages umbenennen**

```js
// VORHER (Z. 1141, 1498)
return jsonResponse({ error: 'Unbekannte Aktion' });

// NACHHER
return jsonResponse({ error: 'Unbekannte Action' });
```

Hinweis: Falls die User-facing-Sichtbarkeit dieser Strings unklar ist (Frontend zeigt Server-Error-Message?), prüfen ob das ein UI-String wäre (dann müsste deutsch bleiben). Im KI-Endpoint-Kontext ist es ein Internal-API-Error (sieht User nicht), also rename safe.

- [ ] **Step 2: Verifikation**

```bash
grep -n 'Unbekannte Aktion' ExamLab/apps-script-code.js
```

Erwartung: 0 Treffer.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m 'Bundle N Lager A: "Unbekannte Aktion"-Error-Strings → Action'
```

### Task 2.6: Phase-2-Verification-Grep + Lager-A-Komplettheits-Check

**Files:** Read-only.

- [ ] **Step 1: Re-grep Lager-A-Pattern**

```bash
grep -nE '\b(aktion|Aktion|AKTION|aktionen|AKTIONEN)\b' ExamLab/apps-script-code.js | grep -vE 'kiAssistent|kalibrier|Feedback|fb\.aktion|args\.aktion|body\.aktion|extrahiereText_|berechneDiffScore_|istQualifiziert_|injiziereKalibrierung_|switch \(aktion\)|case .generiereFragetext|case .verbessere|case .pruefe|case .klassifiziere|case .bewertung|col\(.aktion'
```

Erwartung: 0 Treffer.

- [ ] **Step 2: Falls Treffer übrig — manuell klassifizieren**

Jede verbleibende Stelle gegen Lager-A-vs-Lager-B-Tabelle der Spec (Section „Layer 1") prüfen. Falls Lager A: in einem Follow-up-Commit anpassen. Falls Lager B: in Phase 3 verschieben.

- [ ] **Step 3: Phase-2-Snapshot-Commit (optional)**

Falls Step 2 Anpassungen erzwungen hat, separater Commit mit Begründung.

---

## Phase 3 — Lager B Atomic (Wire-Vertrag-Bruch in einem Push)

### Task 3.0: Pre-Check Backend-Read-Pfade-Audit (Memory-Lehre Bundle 3)

**Files:** Read-only.

- [ ] **Step 1: Alle Lager-B-Lese-Pfade in Apps-Script grep**

```bash
grep -nE "body\.aktion|args\.aktion|fb\.aktion|col\('aktion'\)|aktionenAktiv" ExamLab/apps-script-code.js
```

```bash
grep -nE "\.aktionen\b|KalibrierungsStatistik\.aktionen" ExamLab/apps-script-code.js
```

- [ ] **Step 2: Alle Frontend-Lager-B-Stellen grep**

```bash
grep -rnE "\baktion\b|\baktionen\b|aktionenAktiv" packages/shared/src/editor/ ExamLab/src/services/ ExamLab/src/components/
```

```bash
grep -rn "kiAssistent\(" ExamLab/src/ packages/shared/src/
```

```bash
grep -rn "useKIAssistent" ExamLab/src/ packages/shared/src/
```

- [ ] **Step 3: Liste in Stelle-für-Stelle-Tabelle einsortieren**

Pro Treffer entscheiden:
- Lager B → wird in Phase 3 angefasst
- Lager A → war schon Phase 2, sollte 0 sein
- Out-of-Scope (z.B. Sheet-Spalten ausserhalb der 2 betroffenen Sheets)

Output: Aktualisierte Spec-Tabellen oder Plan-interne TODO-Liste.

- [ ] **Step 4: Frontend-Aufrufer-Mapping zu E2E-Pfaden**

Aus Step 2 Output: Welche `kiAktion`-Werte werden vom Frontend tatsächlich aufgerufen? Vergleichen mit den 7 Pflicht-E2E-Pfaden (Phase 4). Falls Frontend-UI-Aufrufer existieren, die keine der 7 Kategorien treffen, E2E-Liste in Phase 4 erweitern.

### Task 3.1: Apps-Script `kiAssistentEndpoint` Body-Read + Switch + Default-Case

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 6105-6135, 6680-6685)

- [ ] **Step 1: Body-Read + Validierung umbenennen**

Z. 6105-6120:

```js
// VORHER
function kiAssistentEndpoint(body) {
  try {
    var email = body.email;
    var aktion = body.aktion;
    var daten = body.daten || {};

    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!aktion) {
      return jsonResponse({ error: 'Keine Aktion angegeben' });
    }
    …

// NACHHER
function kiAssistentEndpoint(body) {
  try {
    var email = body.email;
    var kiAktion = body.kiAktion;
    var daten = body.daten || {};

    if (!email || !istZugelasseneLP(email)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!kiAktion) {
      return jsonResponse({ error: 'Keine kiAktion angegeben' });
    }
    …
```

- [ ] **Step 2: switch-Statement + Default-Case**

Z. 6128 + Z. 6680-6685:

```js
// VORHER
    switch (aktion) {
      …
      default:
        return jsonResponse({ error: 'Unbekannte KI-Aktion: ' + aktion });
    }

// NACHHER
    switch (kiAktion) {
      …
      default:
        return jsonResponse({ error: 'Unbekannte KI-Aktion: ' + kiAktion });
    }
```

(Cases bleiben unverändert — die KI-Sub-Action-Werte wie `'generiereMusterloesung'` sind ein separates Konzept, kein Token-Rename.)

- [ ] **Step 3: Verifikation**

```bash
sed -n '6105,6135p' ExamLab/apps-script-code.js | grep -E 'aktion|kiAktion'
```

Erwartung: nur `kiAktion`, kein nacktes `aktion`.

### Task 3.2: Apps-Script zweiter `body.aktion`-Switch (Z. 11011)

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 11011, 11024, 11058)

- [ ] **Step 1: Zweiten Switch-Block lesen + analog umbenennen**

Vorgehen wie Task 3.1, aber für den zweiten Endpoint (Statistik/Cleanup).

```bash
sed -n '11005,11062p' ExamLab/apps-script-code.js
```

Stellen:
- Z. 11011: `var aktion = body.aktion` → `var kiAktion = body.kiAktion`
- Z. 11024: `switch (aktion)` → `switch (kiAktion)`
- Z. 11058: `'Unbekannte KI-Aktion: ' + aktion` → `'Unbekannte KI-Aktion: ' + kiAktion`

- [ ] **Step 2: Verifikation**

```bash
sed -n '11005,11062p' ExamLab/apps-script-code.js | grep -E '\baktion\b'
```

Erwartung: 0 Treffer.

### Task 3.3: KI-Feedback-Sheet-Header-Array + alle `col('aktion')`-Reads

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 11895, 12086, weitere via grep)

- [ ] **Step 1: Header-Array umbenennen**

Z. 11895:

```js
// VORHER
var headers = ['feedbackId','zeitstempel','lpEmail','fachschaft','aktion','fachbereich', …]

// NACHHER
var headers = ['feedbackId','zeitstempel','lpEmail','fachschaft','kiAktion','fachbereich', …]
```

- [ ] **Step 2: Alle `col('aktion')`-Reads grep + ersetzen**

```bash
grep -n "col\('aktion'\)" ExamLab/apps-script-code.js
```

Pro Treffer: `col('aktion')` → `col('kiAktion')`.

- [ ] **Step 3: Verifikation**

```bash
grep -n "col\('aktion'\)\|'aktion'" ExamLab/apps-script-code.js | grep -v 'kiAktion'
```

Erwartung: 0 Treffer (oder nur Lager-A-Reste, die in Phase 2 hätten angefasst werden müssen).

### Task 3.4: `injiziereKalibrierung_` + Statistik-Helpers

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 5984-5995, 12041, 12086, 12133, 12154, 12158-12159, 3895)

- [ ] **Step 1: `injiziereKalibrierung_` Signatur + Body**

Z. 5984-5995:

```js
// VORHER
function injiziereKalibrierung_(email, aktion, daten) {
    …
    var out = {
      lpEmail: email, aktion: aktion,
      …
    };
    out.userPromptPrefix = baueFewShotBlock_(aktion, beispiele);
    …

// NACHHER
function injiziereKalibrierung_(email, kiAktion, daten) {
    …
    var out = {
      lpEmail: email, kiAktion: kiAktion,
      …
    };
    out.userPromptPrefix = baueFewShotBlock_(kiAktion, beispiele);
    …
```

Aufrufer in `kiAssistentEndpoint` (innerhalb Cases, vermutlich `injiziereKalibrierung_(email, aktion, …)` → `(email, kiAktion, …)`) — grep + adjust:

```bash
grep -n 'injiziereKalibrierung_' ExamLab/apps-script-code.js
```

- [ ] **Step 2: `baueFewShotBlock_` Signatur**

```bash
grep -n 'function baueFewShotBlock_\|baueFewShotBlock_(' ExamLab/apps-script-code.js
```

Falls Signatur `function baueFewShotBlock_(aktion, …)` → umbenennen auf `(kiAktion, …)` + alle Aufrufer.

- [ ] **Step 3: `args.aktion` Schreib-Pfad (Z. 12041)**

```js
// VORHER
args.aktion,

// NACHHER
args.kiAktion,
```

- [ ] **Step 4: `berechneDiffScore_`, `istQualifiziert_`, `extrahiereText_` Signaturen + Bodies**

Z. 12133, 12154, 12158:

```js
// VORHER
function berechneDiffScore_(aktion, ki, lp) {
  …
  switch (aktion) {
  …
}

function istQualifiziert_(aktion, diff) {
  …
}

function extrahiereText_(aktion, daten) {
  if (aktion === 'generiereMusterloesung') return daten.loesung || daten.musterlosung || '';
  …
}

// NACHHER
function berechneDiffScore_(kiAktion, ki, lp) {
  …
  switch (kiAktion) {
  …
}

function istQualifiziert_(kiAktion, diff) {
  …
}

function extrahiereText_(kiAktion, daten) {
  if (kiAktion === 'generiereMusterloesung') return daten.loesung || daten.musterlosung || '';
  …
}
```

Aufrufer dieser drei Helpers (vermutlich in `KalibrierungsStatistik`-Builder):

```bash
grep -n 'berechneDiffScore_\|istQualifiziert_\|extrahiereText_' ExamLab/apps-script-code.js
```

- [ ] **Step 5: `fb.aktion` (Z. 3895)**

```js
// VORHER (Z. 3895)
var final = extrahiereFinaleVersionEditor_(fb.aktion, frage);

// NACHHER
var final = extrahiereFinaleVersionEditor_(fb.kiAktion, frage);
```

- [ ] **Step 6: Verifikation**

```bash
grep -nE '\baktion\b' ExamLab/apps-script-code.js | grep -v "case '\|switch\|//\|/\*"
```

Erwartung: 0 Treffer (alle `aktion`-Bezeichner sind jetzt `action` oder `kiAktion`, nur die KI-Sub-Action-Werte selbst (`'generiereFragetext'` etc.) bleiben unverändert).

### Task 3.5: KalibrierungsEinstellungen Read/Write — `aktionenAktiv` → `kiAktionenAktiv`

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Stellen via grep)

- [ ] **Step 1: Stellen identifizieren**

```bash
grep -n 'aktionenAktiv' ExamLab/apps-script-code.js
```

Erwartung: 5-10 Treffer in `kalibrierungsEinstellungenLaden`/`-Speichern`-Endpoints + Default-Setup.

- [ ] **Step 2: Pro Treffer ersetzen**

`aktionenAktiv` → `kiAktionenAktiv` (sowohl als Object-Property als auch in JSON-Strings).

- [ ] **Step 3: Verifikation**

```bash
grep -n 'aktionenAktiv' ExamLab/apps-script-code.js
```

Erwartung: 0 Treffer.

### Task 3.6: KalibrierungsStatistik `aktionen` → `kiAktionen` (Plural-Map)

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Stellen via grep)

- [ ] **Step 1: Stellen identifizieren**

```bash
grep -nE '\.aktionen\b|aktionen:' ExamLab/apps-script-code.js
```

Erwartung: 3-5 Treffer in der Statistik-Endpoint-Antwort.

- [ ] **Step 2: Pro Treffer ersetzen**

`statistik.aktionen` → `statistik.kiAktionen`, `aktionen: { ... }` → `kiAktionen: { ... }` etc.

- [ ] **Step 3: Verifikation**

```bash
grep -nE '\.aktionen\b|\baktionen:' ExamLab/apps-script-code.js
```

Erwartung: 0 Treffer.

### Task 3.7: Frontend `uploadApi.ts::kiAssistent` Signatur + Body

**Files:**
- Modify: `ExamLab/src/services/uploadApi.ts` (Z. 179, 186)

- [ ] **Step 1: Test-First (TDD): `useKIAssistent.test.tsx` mit `kiAktion`-Param-Names erweitern**

Vor dem Code-Change: in `ExamLab/src/tests/useKIAssistent.test.tsx` einen Test ergänzen, der prüft dass der Body-POST `kiAktion`-Property hat (nicht `aktion`):

```bash
grep -n 'aktion' ExamLab/src/tests/useKIAssistent.test.tsx
```

Bestehende Tests anschauen, wo der Body geprüft wird (vermutlich Mock-fetch + Body-Assertion). Test-Update:

```ts
// In Body-Assertion-Test
expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
  action: 'kiAssistent',
  kiAktion: 'generiereFragetext',  // statt aktion
  …
})
```

- [ ] **Step 2: Test laufen lassen — Erwartung: FAIL**

```bash
cd ExamLab && npm run test -- useKIAssistent.test.tsx
```

Erwartung: Test FAIL mit „expected `kiAktion` but received `aktion`".

- [ ] **Step 3: `uploadApi.ts::kiAssistent` umbenennen**

Z. 179 + 186:

```ts
// VORHER
export async function kiAssistent(email: string, aktion: string, daten: Record<string, unknown>): Promise<KIAssistentRueckgabe | null> {
  …
      body: JSON.stringify({ action: 'kiAssistent', email, aktion, daten }),

// NACHHER
export async function kiAssistent(email: string, kiAktion: string, daten: Record<string, unknown>): Promise<KIAssistentRueckgabe | null> {
  …
      body: JSON.stringify({ action: 'kiAssistent', email, kiAktion, daten }),
```

- [ ] **Step 4: Test laufen lassen — Erwartung: PASS**

```bash
cd ExamLab && npm run test -- useKIAssistent.test.tsx
```

### Task 3.8: Frontend `kalibrierungApi.ts` Type-Felder

**Files:**
- Modify: `ExamLab/src/services/kalibrierungApi.ts` (Z. 5-10, 17-30, 33-40)

- [ ] **Step 1: `KalibrierungsEinstellungen.aktionenAktiv` → `kiAktionenAktiv`**

Z. 5-10:

```ts
// VORHER
export type KalibrierungsEinstellungen = {
  global: boolean
  aktionenAktiv: { generiereMusterloesung: boolean, klassifiziereFrage: boolean, … }
  …
}

// NACHHER
export type KalibrierungsEinstellungen = {
  global: boolean
  kiAktionenAktiv: { generiereMusterloesung: boolean, klassifiziereFrage: boolean, … }
  …
}
```

- [ ] **Step 2: `KIFeedbackEintragLP.aktion` → `kiAktion`**

Z. 17-30:

```ts
// VORHER
export type KIFeedbackEintragLP = {
  …
  aktion: string
  …
}

// NACHHER
export type KIFeedbackEintragLP = {
  …
  kiAktion: string
  …
}
```

- [ ] **Step 3: `KalibrierungsStatistik.aktionen` → `kiAktionen`**

Z. 33-40:

```ts
// VORHER
export type KalibrierungsStatistik = {
  aktionen: Record<string, { vorschlaege: number, … }>
}

// NACHHER
export type KalibrierungsStatistik = {
  kiAktionen: Record<string, { vorschlaege: number, … }>
}
```

- [ ] **Step 4: `tsc -b` als Verifikation**

```bash
cd ExamLab && npx tsc -b
```

Erwartung: tsc fängt jeden Aufrufer der diese Felder verwendet → Liste der zu fixenden Stellen für Task 3.10/3.11.

### Task 3.9: Frontend `fragensammlungApi.ts::OffenerKIFeedbackPayload`

**Files:**
- Modify: `ExamLab/src/services/fragensammlungApi.ts` (Z. 75-78)

- [ ] **Step 1: Type-Field umbenennen**

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

- [ ] **Step 2: tsc-Aufrufer-Audit**

```bash
cd ExamLab && npx tsc -b 2>&1 | grep -E 'aktion|kiAktion'
```

Erwartung: Liste der Frontend-Aufrufer-Files, die das Field verwenden.

### Task 3.10: shared `useKIAssistent`-Hook + Aufrufer

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx`
- Modify: `packages/shared/src/editor/sections/MusterloesungSection.tsx`
- Modify: `packages/shared/src/editor/types.ts` (falls Type-Felder)
- Modify: `packages/shared/src/editor/musterloesungNormalizer.ts` (falls `aktion`-Param)
- Modify: `packages/shared/src/index.ts` (Re-Exports falls betroffen)

- [ ] **Step 1: Hook-Signatur + Argumente**

```bash
grep -rn 'useKIAssistent' packages/shared/src/
```

Hook-Definition lesen (vermutlich in `packages/shared/src/editor/`-Subverzeichnis). Falls Hook-Param-Name `aktion`: zu `kiAktion` umbenennen. Falls Internal-Property: ebenso.

- [ ] **Step 2: Alle Aufrufer durch tsc finden lassen**

```bash
cd ExamLab && npx tsc -b 2>&1 | head -30
```

- [ ] **Step 3: Aufrufer-Files anpassen**

Pro Fehler-File: `aktion` → `kiAktion` an entsprechenden Stellen. Erwartung: 5-15 Stellen über 4-6 Files.

- [ ] **Step 4: tsc clean**

```bash
cd ExamLab && npx tsc -b
```

Erwartung: 0 Errors.

### Task 3.11: Settings-UI Toggle-Component für `kiAktionenAktiv`

**Files:**
- Modify: `ExamLab/src/components/lp/**/*.tsx` (1-2 Files via grep)

- [ ] **Step 1: Toggle-Component-Stelle finden**

```bash
grep -rn 'aktionenAktiv' ExamLab/src/components/
```

- [ ] **Step 2: Property-Access + Toggle-State umbenennen**

Pro Treffer: `aktionenAktiv` → `kiAktionenAktiv` (Read- und Write-Pfade, JSX-Props, Component-Internal-State).

- [ ] **Step 3: tsc + Tests laufen lassen**

```bash
cd ExamLab && npx tsc -b && npm run test
```

Erwartung: tsc clean, alle Tests grün (oder gezielte Test-Updates für Settings-UI-Snapshots).

### Task 3.12: Tests anpassen (alle indirekt betroffenen)

**Files:**
- Modify: `ExamLab/src/tests/useKIAssistent.test.tsx` (bereits Task 3.7)
- Modify (falls Mock-Updates nötig): `SharedFragenEditor.autoSave.test.tsx`, `FrageTypAuswahlAudio.test.tsx`, `DragDropBildEditorMultiZone.test.tsx`, `HotspotEditorPflicht.test.tsx`, `BildbeschriftungEditorPflicht.test.tsx`, `SharedFragenEditorSaveHook.test.tsx`

- [ ] **Step 1: vitest komplett laufen lassen**

```bash
cd ExamLab && npm run test 2>&1 | tail -40
```

- [ ] **Step 2: Pro rotem Test diagnostizieren + fixen**

Häufige Ursachen:
- Mock-Helper hatte `aktion: '…'` als Mock-Property → zu `kiAktion: '…'` updaten
- Snapshot-Test hat Component-State serialisiert → Snapshot regenerieren via `npm run test -- -u`
- Hook-Mock hatte alten Param-Namen → updaten

- [ ] **Step 3: Alle Tests grün**

```bash
cd ExamLab && npm run test
```

Erwartung: gleicher Pass-Count wie Baseline (Phase-2-Pre-Snapshot).

### Task 3.13: String-Literal-Sweep

**Files:** Read-only.

- [ ] **Step 1: Vollständiger `aktion`-Sweep**

```bash
grep -rnE "'aktion'|\"aktion\"" ExamLab/ packages/shared/src/ | grep -v 'kiAktion\|node_modules\|\.test\.\|fixtures'
```

Erwartung: 0 Treffer (alle Sheet-Header-Lookup-Strings sind in Phase-3-Tasks angefasst).

```bash
grep -rnE '\baktion\b' ExamLab/ packages/shared/src/ | grep -v 'kiAktion\|node_modules\|\.test\.\|fixtures'
```

Erwartung: 0 Treffer (oder nur in Comments/Docs, die als Lager-A-Korrektur-Reste angesehen werden).

- [ ] **Step 2: Falls Treffer → klassifizieren + fixen**

Pro Treffer entscheiden: Lager A (sollte `action` sein) oder Lager B (sollte `kiAktion` sein) oder Backend-Vertrag (Sheet-Spalte ausserhalb Scope).

### Task 3.14: Audit-Tokens-Lokal-Re-Run

**Files:** Read-only.

- [ ] **Step 1: Audit-Tokens-Skript ausführen**

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-bundle-n-pre-deploy.md
```

- [ ] **Step 2: `aktion`-Vorkommen prüfen**

```bash
grep -A 2 '`aktion`' /tmp/audit-tokens-bundle-n-pre-deploy.md
grep -A 2 '`Aktion`' /tmp/audit-tokens-bundle-n-pre-deploy.md
grep -A 2 '`AKTIONEN`' /tmp/audit-tokens-bundle-n-pre-deploy.md
```

Erwartung: alle 0 oder nur in Comments/Docs.

- [ ] **Step 3: `kiAktion`-Vorkommen prüfen**

```bash
grep -A 2 '`kiAktion`' /tmp/audit-tokens-bundle-n-pre-deploy.md || echo 'kiAktion not yet in audit-tokens.sh patterns'
```

Falls `audit-tokens.sh` `kiAktion` nicht erkennt (weil neuer Token), das ist OK — der Audit-Run nach Bundle Q würde es hinzufügen.

- [ ] **Step 4: Phase-3-Mega-Commit**

Phase 3 ist atomic — alle Tasks 3.1 bis 3.13 zusammen committen, falls bisher nicht stattgefunden:

```bash
git status
git add -A
git commit -m "Bundle N Lager B: aktion → kiAktion atomic (Apps-Script + Frontend)

Atomic-Bundle mit Wire-Vertrag-Anpassung:
- kiAssistentEndpoint body.aktion → body.kiAktion (2 Switches)
- KI-Feedback-Sheet-Header + col()-Reads
- injiziereKalibrierung_, berechneDiffScore_, istQualifiziert_, extrahiereText_
- KalibrierungsEinstellungen.aktionenAktiv → kiAktionenAktiv
- KalibrierungsStatistik.aktionen → kiAktionen
- Frontend uploadApi.ts::kiAssistent + 3 Type-Files
- shared/useKIAssistent-Hook + Aufrufer
- Settings-UI Toggle-Components
- Tests aktualisiert"
```

---

## Phase 4 — User-Aktionen: Deploy + Sheet-Edits + E2E-Test

> **Diese Phase wird NICHT durch Subagents ausgeführt.** Subagent-Driven-Development pausiert hier; User führt Schritte manuell aus, Subagent (oder Master-Agent) verifiziert die Ergebnisse danach.

### Task 4.1: Apps-Script via clasp push deployen

**Verantwortlich:** User (Yannick)

- [ ] **Step 1: Aktuellen Branch pushen auf origin**

```bash
git push -u origin refactor/bundle-n-action-aktion-vereinheitlichung
```

- [ ] **Step 2: User triggert clasp push**

User-Aktion (in eigenem Terminal):

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab"
clasp push --force
```

Erwartung: Success-Output, neue Apps-Script-Version sichtbar im Editor.

- [ ] **Step 3: User-Confirmation an Master-Agent**

Master fragt: „Apps-Script deployed?" — User bestätigt.

### Task 4.2: Manuelle Sheet-Cell-Edits

**Verantwortlich:** User

- [ ] **Step 1: Audit-Log-Sheet öffnen**

User öffnet das Audit-Log-Sheet im Apps-Script-Spreadsheet (ggf. via Apps-Script-Editor → Resources → Spreadsheets).

- [ ] **Step 2: Header-Zelle B1 (oder wo `aktion` steht) editieren**

`aktion` → `action`. Speichern.

- [ ] **Step 3: KI-Feedback-Sheet (`KI_FEEDBACK`) öffnen**

User öffnet das KI-Feedback-Sheet.

- [ ] **Step 4: Header-Zelle E1 (oder wo `aktion` steht) editieren**

`aktion` → `kiAktion`. Speichern.

- [ ] **Step 5: User-Confirmation**

User bestätigt: „Sheet-Header-Edits gemacht."

### Task 4.3: Frontend Build + Deploy auf staging

**Verantwortlich:** User

- [ ] **Step 1: Build verifizieren**

```bash
cd ExamLab && npm run build
```

Erwartung: clean.

- [ ] **Step 2: Staging-Deploy**

User triggert den staging-Deploy (vermutlich via GitHub-Actions oder manuelles `gh-pages`-Push).

- [ ] **Step 3: User-Confirmation**

User bestätigt: „Frontend auf staging deployed."

### Task 4.4: Browser-E2E mit echten LP-Logins

**Verantwortlich:** User (Browser-Test) + Master-Agent (Verifikations-Subagent)

- [ ] **Step 1: User loggt sich auf staging mit echtem LP-Account ein**

Memory-Regel: keine Demo, echte Login-Credentials.

- [ ] **Step 2: 7 Pflicht-E2E-Pfade durchgehen**

1. **Generierungs-Pfad** — Frage anlegen, KI „Fragetext generieren" anfordern. Verifikation: KI antwortet mit Text, kein „Keine kiAktion angegeben"-Error.
2. **Klassifizierungs-Pfad** — Bestehende Frage klassifizieren lassen. Verifikation: Bloom-Output erscheint.
3. **Musterlösungs-Pfad** — KI-Musterlösung generieren. Verifikation: Lösungstext erscheint.
4. **Bewertungsraster-Pfad** — KI-Bewertungsraster generieren. Verifikation: Kriterien-Liste erscheint.
5. **Kalibrierungs-Einstellungen-Tab** — Toggle für `kiAktionenAktiv`-Flags umschalten, Speichern, Reload, Werte persistent.
6. **KI-Feedback-Eintrag verändern** — `wichtig`-Flag setzen, `qualifiziert` togglen, `aktiv` ändern. Reload prüfen — Werte persistent im Sheet.
7. **Statistik-Tab** (falls UI vorhanden) — Statistik anzeigen, prüfen dass `kiAktionen`-Map angezeigt wird (KI-Sub-Action-Statistik nicht leer).

- [ ] **Step 3: 3 zusätzliche Smoke-Tests**

Drei zufällige `kiAktion`-Werte aus dem 20+-Pool aufrufen (z.B. `verbessereFragetext`, `generiereOptionen`, `analysierePruefung`). Erwartung: kein „Unbekannte KI-Aktion"-Error.

- [ ] **Step 4: User-Confirmation**

User bestätigt: „7 Pflicht-Pfade + 3 Smoke-Tests grün." Master verifiziert ggf. via screenshots/network-traffic-logs.

### Task 4.5: Audit-Tokens-Re-Run (post-deploy)

**Verantwortlich:** Master-Agent

- [ ] **Step 1: Re-Run Audit-Tokens**

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-bundle-n-post-deploy.md
diff /tmp/audit-tokens-bundle-n-pre-deploy.md /tmp/audit-tokens-bundle-n-post-deploy.md
```

- [ ] **Step 2: Erfolgs-Kriterium-Check**

Verifizieren:
- `aktion` (Lager A): 0 oder nur Comments
- `kiAktion`: ~35-40 Treffer (neuer Token)
- `LP_AKTIONEN`/`SUS_AKTIONEN`/`SCHREIBENDE_AKTIONEN`: 0
- `LP_ACTIONS`/`SUS_ACTIONS`/`SCHREIBENDE_ACTIONS`: existieren

---

## Phase 5 — Merge auf main

### Task 5.1: Pre-Commit-Checklist

**Files:** Read-only.

- [ ] **Step 1: vitest grün**

```bash
cd ExamLab && npm run test
```

- [ ] **Step 2: tsc clean**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 3: lint clean**

```bash
cd ExamLab && npm run lint
```

- [ ] **Step 4: lint:as-any clean**

```bash
cd ExamLab && npm run lint:as-any
```

- [ ] **Step 5: build clean**

```bash
cd ExamLab && npm run build
```

Alle 5 grün → bereit für Merge.

### Task 5.2: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md` (Append am Ende)

- [ ] **Step 1: Bundle-N+V-Eintrag schreiben**

In `ExamLab/HANDOFF.md` neuer Bundle-Eintrag:

```markdown
## Bundle N+V — action/aktion-Vereinheitlichung + Sprach-Konvention (DD.MM.YYYY)

**Status:** ✅ Merged auf main (Merge-Commit: TBD)
**Branch:** refactor/bundle-n-action-aktion-vereinheitlichung (gelöscht)

**Was umgesetzt:**
- Lager A (HTTP-Operation-Tag-Kontext): `aktion` → `action` in apps-script-code.js
  - rateLimitCheck_, lernplattformRateLimitCheck_, auditLog_
  - LP_AKTIONEN/SUS_AKTIONEN/SCHREIBENDE_AKTIONEN → *_ACTIONS
  - "Unbekannte Aktion"-Error-Strings
- Lager B (KI-Sub-Action-Domain-Konzept): `aktion` → `kiAktion` in Apps-Script + Frontend
  - kiAssistentEndpoint Body-Read + 2 Switches
  - KI-Feedback-Sheet-Header + col()-Reads
  - Frontend uploadApi.ts/kalibrierungApi.ts/fragensammlungApi.ts
  - shared/useKIAssistent-Hook + Aufrufer
  - KalibrierungsEinstellungen.kiAktionenAktiv, KalibrierungsStatistik.kiAktionen
- Bundle V Annex: Sprach-Konvention-Section in code-quality.md mit Bundle-N-Beispiel

**Verifikation:**
- vitest: TBD/TBD passes
- tsc + lint + lint:as-any + build: clean
- Browser-E2E: 7/7 Pflicht-Pfade + 3 Smoke-Tests mit echten LP-Logins ✅
- Audit-Tokens-Re-Run: aktion (Lager A) = 0, kiAktion = TBD Treffer
- Sheet-Header-Edits: Audit-Log-Sheet `action`, KI-Feedback-Sheet `kiAktion`

**Lehren:**
- Audit-Empfehlungen kritisch hinterfragen, wenn Wire-Vertrag betroffen ist
  (Lager-A-vs-Lager-B-Disambiguierung war im Audit nicht reflektiert)
- Hybrid-Sprach-Konvention jetzt formell dokumentiert (code-quality.md)
- Sheet-Header-Edit ist trivial bei nicht-aktiven-Nutzern, schwerer bei
  Daten-Volumen
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: Bundle N+V dokumentiert"
```

### Task 5.3: Branch auf main mergen

**Verantwortlich:** User (Master triggert vorbereitete Befehle)

- [ ] **Step 1: Auf main wechseln + pull**

```bash
git checkout main
git pull origin main
```

- [ ] **Step 2: Merge-Strategie entscheiden**

User-Wahl: Squash-Merge (empfohlen für klare Bundle-Granularität in main-History) oder Merge-Commit (wenn Phase-Schnitt sichtbar bleiben soll).

- [ ] **Step 3a: Squash-Merge (Empfehlung)**

```bash
git merge --squash refactor/bundle-n-action-aktion-vereinheitlichung
git commit -m "Bundle N+V: action/aktion-Vereinheitlichung + Sprach-Konvention

Lager A (HTTP-Operation-Tag): aktion → action
Lager B (KI-Sub-Action-Domain-Konzept): aktion → kiAktion (Apps-Script + Frontend Wire-Vertrag)
Bundle V Annex: Hybrid-Sprach-Konvention in .claude/rules/code-quality.md

E2E mit echten LP-Logins verifiziert.
Audit-Tokens-Re-Run: aktion (Lager A) = 0, kiAktion = TBD Treffer.
Sheet-Header-Edits: Audit-Log-Sheet 'action', KI-Feedback-Sheet 'kiAktion'."
git push origin main
```

- [ ] **Step 3b: Merge-Commit (falls bevorzugt)**

```bash
git merge --no-ff refactor/bundle-n-action-aktion-vereinheitlichung -m "Merge Bundle N+V auf main"
git push origin main
```

- [ ] **Step 4: Branch lokal + remote löschen**

```bash
git branch -d refactor/bundle-n-action-aktion-vereinheitlichung
git push origin --delete refactor/bundle-n-action-aktion-vereinheitlichung
```

### Task 5.4: Memory-Eintrag schreiben

**Files:**
- Create: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_n_v_komplett.md`
- Modify: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/MEMORY.md` (Index-Update)

- [ ] **Step 1: Memory-File schreiben**

Inhalt analog zu Bundle-M-Memory-Eintrag, mit:
- Frontmatter (name, description, type=project)
- Was umgesetzt + Hash + Datum
- Lehren (insbesondere: Audit-Empfehlungen können bei Wire-Vertrag-Konflikten unvollständig sein → eigener Brainstorming-Pass nötig)

- [ ] **Step 2: MEMORY.md Index-Eintrag**

Eine Zeile in der ExamLab-Sektion ergänzen, analog zu Bundle M:

```markdown
- **[Bundle N+V auf main](project_bundle_n_v_komplett.md)** — DD.MM.YYYY Merge `<hash>`. action/aktion-Disambiguierung in 2 Lager + Sprach-Konvention dokumentiert. […einliner-Zusammenfassung mit Lehren-Kürzel…]
```

- [ ] **Step 3: Bundle abgeschlossen**

User-Notification: „Bundle N+V auf main, Branch gelöscht, Memory + HANDOFF aktualisiert. Bundle Q (Test-Verzeichnis-Konsolidierung) ist das nächste Phase-1-Bundle der Vereinfachungs-Roadmap."

---

## Skills referenziert

- @superpowers:subagent-driven-development — Implementation-Mode für Phase 1, 2, 3, 5
- @superpowers:test-driven-development — Frontend-Tasks (3.7, 3.10, 3.11, 3.12)
- @superpowers:verification-before-completion — Pre-Commit-Checklist (Task 5.1)
- @superpowers:requesting-code-review — Optionaler Review-Pass nach Phase 3 vor Phase 4
- @superpowers:finishing-a-development-branch — Phase 5 Merge-Optionen
