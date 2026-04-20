# KI-Kalibrierung durch LP-Korrekturen — Design-Spec

**Datum:** 2026-04-20
**Autor:** Yannick Durand (Auftrag) + Claude (Brainstorming + Design)
**Status:** Draft v1 — wartet auf User-Review nach Spec-Reviewer-Loop
**Scope:** ExamLab — Frageneditor + LP-Korrektur
**Follow-Up:** Implementation-Plan (via `writing-plans` skill)

---

## 1. Ziel & Problem

LP verwendet KI-Vorschläge im Frageneditor (Musterlösung, Klassifizierung, Bewertungsraster) und in der Freitext-Korrektur. Sie korrigiert die Vorschläge häufig — passt Musterlösungen an, ändert Bloom-Stufen, schreibt Bewertungsraster um, gibt andere Punkte als die KI.

**Heute** werden diese Korrekturen nirgends gespeichert oder zurück in die KI gefüttert. Die KI liefert bei identischem Input identische Vorschläge — auch wenn sie beim 50. Mal genauso danebenliegt wie beim ersten.

**Ziel:** Die KI lernt aus LP-Korrekturen, sodass Vorschläge über die Zeit näher am LP-Stil liegen. Für die LP spürbar als „KI trifft öfter direkt, weniger Edits nötig".

## 2. Nicht-Ziele (Scope-Grenzen)

- **Kein Fine-Tuning** — Claude Sonnet 4 bietet öffentlich keines, wäre auch überdimensioniert.
- **Keine übergreifende Kalibrierung in v1** — nur pro-LP. Fachschafts-/schulweit später (Ansatz 3).
- **Kein neues Bewertungsraster-UI** im Korrektur-Panel — bleibt Follow-Up-Arbeit. Feature funktioniert auch ohne.
- **Keine automatische Batch-KI-Korrektur** — LP löst KI-Vorschläge in der Korrektur wie heute pro SuS-Antwort manuell aus.

## 3. Ansatz & Mechanismus

**Ansatz 2 (Balanced)** aus Brainstorming: Sheet-basiertes Logging + Few-Shot-Injection im Prompt + Review-UI für LP.

**Kernidee:**
1. Jeder KI-Call schreibt eine „offene" Zeile in ein neues `KIFeedback`-Sheet.
2. Beim Speichern der Frage/Korrektur wird die Zeile mit der finalen LP-Version geschlossen.
3. Bei künftigen KI-Calls derselben LP/Aktion/Fachbereich werden die besten N Zeilen als Few-Shot-Beispiele vor den Prompt gehängt.
4. LP sieht alles in einem Review-Tab in den Einstellungen, kann Einträge markieren/löschen/deaktivieren.

**Infrastruktur-Hooks für spätere Ansatz-3-Erweiterung** (Embedding-Retrieval, Fachschafts-/Schul-Sharing) sind von Tag 1 berücksichtigt.

## 4. Instrumentierte KI-Aktionen (v1)

Von 23 KI-Aktionen insgesamt werden vier instrumentiert:

| Aktion | Kontext | Begründung |
|---|---|---|
| `generiereMusterloesung` | Editor | Höchst-individuell (Stil, Länge, Struktur) |
| `klassifiziereFrage` | Editor | Bloom-Einschätzung variiert stark pro LP |
| `bewertungsrasterGenerieren` | Editor | LP-Raster-Struktur sehr persönlich |
| `korrigiereFreitext` | Korrektur | Punkte-Strenge + Begründungsstil individuell |

Die übrigen 19 Aktionen laufen unverändert weiter (keine Feedback-Zeile, kein Few-Shot).

## 5. Architektur & Datenfluss

```
(1) LP klickt KI-Aktion
    Frontend useKIAssistent.ausfuehren(aktion, daten)
      → POST kiAssistentEndpoint
          → holeFewShotBeispiele_(lpEmail, aktion, fachbereich, bloom)
          → baueFewShotBlock_(aktion, beispiele)
          → systemPrompt + [fewShotBlock] + userPrompt → Claude
          → starteFeedbackEintrag_(...)  → status='offen'
      ← { daten: <KI-Output>, feedbackId }
    Frontend Hook speichert { daten, feedbackId, wichtig:false }

(2) LP klickt "Übernehmen" (optional) oder editiert direkt
    State des Editors ändert sich, feedbackId bleibt registriert

(3) LP klickt "Speichern" (Frage / Korrektur)
    Frontend sendet offeneKIFeedbacks: [{feedbackId, wichtig}, ...]
      → speichereFrage / speichereKorrekturZeile
          → schliesseFeedbackEintrag_(id, finaleVersion, {wichtig})
              → diffScore berechnen
              → qualifiziert = heuristik(diff, wichtig)
              → status='geschlossen'

(4) LP klickt "Verwerfen"
    → markiereFeedbackAlsIgnoriert(feedbackId)  → status='ignoriert'
```

## 6. Datenmodell — `KIFeedback`-Sheet

Ein zentrales Sheet im Lernplattform/ExamLab-Spreadsheet. Eine Zeile pro KI-Call. Felder:

| Spalte | Typ | Beispiel | Zweck |
|---|---|---|---|
| `feedbackId` | string | `fb_2026-04-20_a3f1` | Primär-Key |
| `zeitstempel` | ISO | `2026-04-20T15:32:01Z` | Recency |
| `lpEmail` | string | `yannick.durand@gymhofwil.ch` | Pro-LP-Filter (v1) |
| `fachschaft` | string | `WR` | Erweiterung v3, heute nur geschrieben |
| `aktion` | string | `generiereMusterloesung` | Eine der 4 instrumentierten |
| `fachbereich` | string | `VWL` | Retrieval-Filter |
| `bloom` | string | `K3` | Retrieval-Feinschnitt (wenn vorhanden) |
| `inputJson` | JSON-string | `{"fragetext":"..."}` | An Claude gegangene User-Daten |
| `kiOutputJson` | JSON-string | `{"loesung":"..."}` | Claude-Antwort |
| `finaleVersionJson` | JSON-string | `{"loesung":"..."}` | LP-Endversion nach Edit |
| `diffScore` | float 0..1 | `0.23` | Wie stark LP abgewichen ist |
| `status` | enum | `offen`\|`geschlossen`\|`ignoriert` | Lifecycle |
| `qualifiziert` | bool | `true` | Taugt als Few-Shot? |
| `wichtig` | bool | `false` | LP-Stern-Flag (Boost) |
| `aktiv` | bool | `true` | Per LP-Review deaktivierbar ohne Löschen |
| `teilen` | enum | `privat`\|`fachschaft`\|`schule` | v1 fix `privat`, später UI |
| `embeddingHash` | string | leer | Ansatz-3-Hook, heute unbenutzt |

**Auth:** LP-only (`istZugelasseneLP`-Check). Queries streng gefiltert auf `lpEmail`.

## 7. Backend-Änderungen (Apps Script)

### 7.1 Sheet-Setup
`stelleKIFeedbackSheetBereit_()` — idempotent, legt Sheet + Header an, wenn fehlt.

### 7.2 Neue interne Helper
```js
holeFewShotBeispiele_({ lpEmail, aktion, fachbereich, bloom, limit, sortierung='recency' })
baueFewShotBlock_(aktion, beispiele)          // Aktions-spezifisches Rendering
starteFeedbackEintrag_({ lpEmail, aktion, fachbereich, bloom, inputJson, kiOutputJson }) → feedbackId
schliesseFeedbackEintrag_(feedbackId, finaleVersionJson, { wichtig })
markiereFeedbackAlsIgnoriert_(feedbackId)
ladeLPKalibrierungsEinstellungen_(lpEmail)    // global-Toggle + pro-Aktion + minBeispiele + beispielAnzahl
```

### 7.3 Neue öffentliche Endpoints
- `listeKIFeedbacks({ filter, seite })` — Review-Tab-Liste (paginiert)
- `aktualisiereKIFeedback({ feedbackId, wichtig?, aktiv? })`
- `loescheKIFeedback({ feedbackId })` + `bulkLoescheKIFeedbacks({ filter })` (mit `auditLog_`)
- `kalibrierungsEinstellungen` (GET/POST) — Einstellungen-Tab-State
- `kalibrierungsStatistik({ lpEmail, zeitraum })` — aggregiert für Stat-Karten

### 7.4 Angepasste bestehende Endpoints

**`kiAssistentEndpoint`:**
```
if (instrumentiert + global_aktiv + aktion_aktiv) {
  beispiele = holeFewShotBeispiele_(...)
  if (beispiele.length >= minBeispiele) fewShotBlock = baueFewShotBlock_(aktion, beispiele)
  feedbackId = starteFeedbackEintrag_(...)
}
userPrompt = (fewShotBlock ? fewShotBlock + '\n\n' : '') + baueUserPrompt_(aktion, daten)
claudeAntwort = rufeClaudeAuf(systemPrompt, userPrompt, ...)
return { daten: claudeAntwort, feedbackId }
```

**`speichereFrage`** (Editor-Save): akzeptiert `offeneKIFeedbacks: [{feedbackId, wichtig}]`, schliesst alle.

**`speichereKorrekturZeile`** (Korrektur-Save):
- Persistenz-Fix: akzeptiert + speichert jetzt auch `kiPunkte`, `kiBegruendung`, `kriterienBewertung`, `quelle` (Spalten im Korrektur_-Sheet existieren bereits, werden nur nicht geschrieben — blockierender Bug)
- Akzeptiert `offeneKIFeedbacks` analog Editor

### 7.5 Unverändert
- Modell bleibt `claude-sonnet-4-20250514`
- System-Prompt unverändert (behält Anthropic-Prompt-Caching)
- Token-Limits pro Aktion unverändert (+1500 Token Few-Shot reserviert, bleibt <8k)
- 19 nicht-instrumentierte Aktionen unverändert

### 7.6 SuS-Content-Privacy (Korrektur-Spezifikum)

**Problem:** `korrigiereFreitext` hat SuS-Antwort im Input. Darf nicht per Few-Shot an Claude-Prompts anderer Korrekturen gelangen.

**Lösung:** `baueFewShotBlock_('korrigiereFreitext', ...)` rendert KEINE SuS-Antworten. Stattdessen nur:
- Bewertungsraster (LP-Eigentum, nicht SuS-gebunden)
- KI-Punktevergabe pro Kriterium
- LP-Endentscheid pro Kriterium + finale Punkte + Begründung

→ KI lernt „wie streng bewertet diese LP Kriterium X", nicht „so sehen SuS-Antworten aus".

`inputJson` enthält weiterhin SuS-Antwort für Audit/Review-Tab-Anzeige (nur LP sichtbar).

## 8. Frontend-Änderungen

### 8.1 Editor (`SharedFragenEditor` + `useKIAssistent`)

**Hook erweitern:**
```ts
// useKIAssistent.ts
offeneKIFeedbacks: Array<{ aktion, feedbackId, wichtig }>
markiereWichtig(aktion, wert)        // setzt wichtig auf letzten Eintrag der Aktion
alleOffenenFeedbacks(): {...}[]      // für Save-Payload
reset()                              // nach Save
```

**`ErgebnisAnzeige` erweitern:** Stern-Toggle (☆/★) rechts oben, neben Übernehmen/Verwerfen. Tooltip: „Als wichtiges Trainings-Beispiel markieren".

**`SharedFragenEditor.handleSpeichern`:** Sendet zusätzlich `offeneKIFeedbacks` im Save-Payload. Nach erfolgreichem Save: `ki.reset()`.

**Verwerfen-Flow:** `onVerwerfen` ruft zusätzlich Backend-Endpoint `markiereFeedbackAlsIgnoriert`. UI-State wie heute.

### 8.2 Korrektur (`KorrekturFrageZeile`)

**`handleKiVorschlag` erweitern:** Speichert `feedbackId` aus Response zusätzlich zum KI-Ergebnis. Stern-Toggle neben „KI-Vorschlag"-Button, State lokal.

**Save-Pfad (`onUpdate` → Backend):** Sendet zusätzlich `offeneKIFeedbacks`, `kiPunkte`, `kiBegruendung`, `kriterienBewertung`, `quelle`. Nach Save: Stern-State zurücksetzen.

### 8.3 Neuer Settings-Tab „KI-Kalibrierung"

In `EinstellungenPanel.tsx`, sichtbar für alle LP (nicht admin-gated). Drei interne Sub-Tabs:

**Beispiele-Tab:**
- Paginierte Tabelle (50/Seite) aller Feedback-Einträge der LP
- Spalten: Datum, Aktion (Badge), Fach/Bloom, Input-Vorschau (60 Zeichen), „KI → LP"-Diff (klickbar modal), Status, ⭐, 🗑 / ⊘
- Filter: Aktion, Fachbereich, Status (Default: `qualifiziert`), Datum-Range, „nur ⭐"

**Statistik-Tab:**
- Zeitraum-Toggle: 7d / 30d / 90d
- Eine Karte pro Aktion mit: Anzahl Vorschläge / unverändert übernommen / leicht angepasst / deutlich umgeschrieben / verworfen — jeweils mit Prozent
- Aktive Trainings-Beispiele: N (M wichtig)
- Few-Shot-Treffer in Zeitraum: X
- Globale Kennzahl oben: „Akzeptanz-Trend (30d): 39% unverändert übernommen ↑"
- Readonly-Sektion „Details zu Few-Shot-Verwendung" als Ansatz-3-Placeholder

**Einstellungen-Tab:**
- **Master-Toggle „KI-Kalibrierung aktiv"** (Default: AN) — Kill-Switch für Kostenkontrolle. Wenn AUS: kein Few-Shot, kein Logging, Feature ist effektiv dark.
- Pro-Aktion-Toggles (4 Checkboxen) — disabled/dimmed wenn Master AUS
- `Minimum Beispiele` (Slider/Dropdown, 0–10, Default **3**) — erst ab N qualifizierten Beispielen wird Kalibrierung aktiv
- `Beispiele pro KI-Call` (Dropdown 3/5/10, Default **5**)
- Aufräumen-Buttons: „Alle ignorierten löschen (X)", „Älter als 180 Tage löschen (Y)"
- Readonly „Ausblick: Teilen" (Fachschaft/Schule) — Ansatz-3-Placeholder, mit „noch nicht verfügbar"

## 9. Heuristik: Wann ist ein Paar „qualifiziert"?

Für Few-Shot-Kandidatur gilt: unverändert übernommen (positives Signal) ODER deutlich geändert (Korrektur-Signal). Mikro-Edits (Komma, Typo) werden rausgefiltert — wenig Lernsignal.

**Text-Aktionen** (`generiereMusterloesung`, `bewertungsrasterGenerieren`):
```js
diff = levenshteinNormalized(kiText, lpText)  // 0..1
qualifiziert = diff === 0 || diff >= 0.15
```

**`klassifiziereFrage`** (4 Felder: fachbereich, thema, bloom, unterthema):
```js
anzahlGeaendert = count(feld => ki[feld] !== lp[feld])
strukturDiff = anzahlGeaendert / 4
qualifiziert = strukturDiff === 0 || strukturDiff >= 0.5   // ≥ 2/4 Felder
```

**`korrigiereFreitext`**:
```js
punkteDiff = abs(ki.punkte - lp.punkte) / max(maxPunkte, 1)
qualifiziert = punkteDiff === 0 || punkteDiff >= 0.15
```

**Wichtig-Flag überschreibt:** `qualifiziert = qualifiziert || wichtig` — LP-Stern bootet auch Mikro-Edits zum Few-Shot-Kandidat.

## 10. Few-Shot-Prompt-Format

Block kommt VOR dem User-Prompt-Template (nicht im System-Prompt → behält Anthropic-Caching).

**Beispiel `generiereMusterloesung`:**
```
--- 3 Beispiele aus deinen bisherigen Musterlösungen ---

Beispiel 1 (VWL, K2):
Frage: "Was ist der Konsumentenpreisindex (CPI)?"
Musterlösung: "CPI = Konsumentenpreisindex. Misst die mittlere Preisveränderung
eines festgelegten Warenkorbs gegenüber einem Basisjahr (Basis = 100)..."

Beispiel 2 (VWL, K2):
...

--- Ende der Beispiele ---

Jetzt die neue Frage (gleiches Fach + Bloom-Niveau):
Frage: "{{aktuelleFrage}}"
Liefere Musterlösung im JSON-Format {{schema}}.
```

Aktions-spezifische Renderer für alle 4 Aktionen. Für `korrigiereFreitext` siehe 7.6.

**Hart-Cap:** Few-Shot-Block max. ~1500 Token. Wenn Beispiele länger: ältere/kürzere werden entfernt bis Cap eingehalten.

## 11. Extension-Hooks für Ansatz 3 (Similarity-Retrieval + Sharing)

Ohne v1-Refactor später ergänzbar:

| Hook | Ort | Was v1 macht | Was v3 macht |
|---|---|---|---|
| `holeFewShotBeispiele_(opts)` | apps-script-code.js | nur `sortierung='recency'` | `similarity` via Embedding |
| `embeddingHash`-Feld | KIFeedback-Sheet | leer | SHA-256 des Input-Embeddings |
| `teilen`-Feld + Default | KIFeedback-Sheet | fix `privat` | LP wählt privat/fachschaft/schule |
| „Details zu Few-Shot"-Block | Statistik-Tab | Placeholder | Live-Metrics welche Beispiele pro Call |
| „Teilen"-Settings-Sektion | Einstellungen-Tab | readonly, „coming soon" | Live |

## 12. Offene Risiken / Mitigatoren

| # | Risiko | Mitigator |
|---|---|---|
| 1 | Few-Shot-Block erhöht Input-Tokens ~30-50% | Master-Toggle (Kill-Switch), Hart-Cap 1500 Token, Pro-Aktion-Deaktivierung |
| 2 | Kalt-Start (erste 10 Korrekturen ohne Nutzen) | `minBeispiele`-Schwelle (Default 3) — darunter läuft KI wie heute ohne Few-Shot |
| 3 | Schlechte/schnelle LP-Korrekturen → schlechte KI | 15%-Heuristik filtert Mikro-Edits, Stern-Priorisierung, LP kann Einträge löschen/deaktivieren |
| 4 | Freitext-Korrektur-Stern visuell übersehen | V1 ohne aktives Nudging; bei tiefer Adoption später Tooltip |
| 5 | Token-Explosion bei 10 langen Beispielen | Hart-Cap 1500 Token, alte Beispiele fallen raus |
| 6 | Ansatz-3-Sharing datenschutzsensibel (Arbeitsrecht?) | v1 `teilen` nur intern, readonly UI. Vor v3 formal klären. |

## 13. Security-Invarianten

- SuS sehen KIFeedback-Sheet NIE. `istZugelasseneLP`-Check auf allen Endpoints.
- Queries streng auf `lpEmail = aktuelleLP` gefiltert (v1 Pro-LP-Scope).
- Keine SuS-Antworten im Few-Shot-Block (Privacy 7.6).
- `loescheKIFeedback` + `bulkLoescheKIFeedbacks` schreiben `auditLog_` für Transparenz.
- Master-Toggle „AUS" stoppt auch Logging — LP hat volle Kontrolle.

## 14. Was NICHT zum Spec gehört (Follow-Up-Tickets)

- Bewertungsraster-Rendering im Korrektur-Panel (eigener UX-Auftrag)
- LP kann Bewertungsraster pro Kriterium einzeln anpassen beim Korrigieren
- Periodischer Cleanup-Cron für „offen"-Einträge >30 Tage (optional später)
- Ansatz-3-Release (Similarity + Sharing) — eigener Spec, wenn v1 stabil läuft

## 15. Erfolgsmessung

Nach 4–6 Wochen produktivem Einsatz sollte messbar sein:
- **Primär:** Akzeptanz-Trend pro Aktion — „unverändert übernommen"-Rate steigt ggü. Baseline (erste 2 Wochen ohne Few-Shot).
- **Sekundär:** LP-Feedback qualitativ: „KI trifft häufiger meinen Stil".
- **Gegen-Kennzahl:** Input-Token-Cost pro KI-Call (Monitoring in Apps-Script — falls über Budget → Master-Toggle aus / limit senken).
