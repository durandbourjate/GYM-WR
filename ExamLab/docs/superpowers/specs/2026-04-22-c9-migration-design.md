# C9 Phase 4 — Teilerklärungs-Migration (Design)

**Status:** Design-Draft 2026-04-22
**Ziel:** Einmalige Backfill-Migration für ~2400 ExamLab-Fragen: Musterlösung + pro-Sub-Element Teilerklärungen über Claude Code generieren, sicher + einheitlich einspielen.
**Zeitrahmen:** ~24 Sessions × 100 Fragen, über mehrere Tage verteilt.
**Risikoprofil:** Einmalige Daten-Massen-Modifikation — „nichts geht kaputt" ist nicht verhandelbar.

## 1. Kontext & Motivation

Phase 3 (Tasks 22–25) hat die Feature-Pipeline aufgebaut:
- Apps-Script `generiereMusterloesung` liefert strukturierte Teilerklärungen pro Sub-Element
- Editor-Preview lässt LP neue Fragen mit Teilerklärungen ausstatten
- Privacy-Invariante sorgt dafür dass SuS im Prüfen-Modus keine Teilerklärungen sieht

Aber: **alle ~2400 bestehenden Fragen in der DB haben keine Teilerklärungen**. Das neue Üben-Layout (Phase-2-Komponenten mit `modus='loesung'`) rendert darum nur die alte Gesamterklärung, nicht die pro-Option-Erklärung die den eigentlichen Lern-Mehrwert bringt.

Phase 4 migriert diese 2400 Fragen.

## 2. Design-Entscheidungen (vom User)

| # | Entscheidung | Wert |
|---|---|---|
| 1 | Backup | **Manuelle Google-Sheets-Kopie** der Fragenbank vor Migration |
| 2 | Qualitäts-Gate | **Stichprobe (30 Fragen)** via Markdown-Review → dann Full-Run |
| 3 | Override-Policy | **Alles überschreiben** — bestehende Musterlösungen sind KI-generiert, einheitliche Qualität gewünscht |
| 4 | Race-Condition | **Migrations-Fenster blockieren** (kein Produktions-Betrieb) |
| 5 | Review-Format | **Markdown-Datei** mit Frage-Text + alte + neue Musterlösung + Teilerklärungen |
| 6 | Qualitätskriterien | **1–2 Sätze**, Schweizer Hochdeutsch, fachlich präzise, Distraktor-Denkfehler benennen, keine Füllwörter |
| 7 | Stichproben-Zusammensetzung | **10 Recht + 10 VWL + 10 BWL** (Informatik raus), alle 9 Teilerklärungs-Typen abgedeckt |
| 8 | Endpoint-Semantik | **Partial-Update** (nur Musterlösung + Teilerklärungen), `pruefungstauglich→false`, `geaendertAm→now`, `poolContentHash` neu |
| 9 | Batch-Size | **100 Fragen/Session** (~24 Sessions) |

## 3. Architektur-Überblick

```
┌─────────────────────────────────────────────────────────────────┐
│  User-Aktionen                                                  │
├─────────────────────────────────────────────────────────────────┤
│  (1) Manuelles Google-Sheets-Backup (vor Migration)             │
│  (2) Review der Stichprobe-MD                                   │
│  (3) Freigabe zum Full-Run                                      │
│  (4) Post-Migration: Per Editor pruefungstauglich=true setzen   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4 Pipeline                                               │
│                                                                 │
│  Apps Script                    Claude Code                     │
│  ───────────                    ────────────                    │
│                                                                 │
│  holeAlleFragenFuer  ──┐                                        │
│    Migration           │                                        │
│                        ▼                                        │
│                    dump.mjs ──► fragen-input.jsonl (~2400)      │
│                                                                 │
│                                 ┌──────────────────┐            │
│                                 │ Claude Code      │            │
│                                 │ Session N        │            │
│                                 │ (100 Fragen)     │            │
│                                 │                  │            │
│                                 │ in: input.jsonl  │            │
│                                 │     + state.json │            │
│                                 │                  │            │
│                                 │ out: append to   │            │
│                                 │  updates.jsonl   │            │
│                                 │  state update    │            │
│                                 └──────────────────┘            │
│                                       ↓                         │
│                                 (24x über Tage)                 │
│                                       ↓                         │
│                                 updates.jsonl (~2400)           │
│                                       ↓                         │
│                           review-generator.mjs                  │
│                                 ↓                               │
│                           stichprobe-review.md (first 30)       │
│                                                                 │
│                                       ↓ (nach Freigabe)         │
│                                                                 │
│  batchUpdateFragen    ◄── upload.mjs (3 Calls: VWL/BWL/Recht)   │
│    Migration                                                    │
│      ↓                                                          │
│   Fragenbank-Sheet                                              │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Komponenten im Detail

### 4.1 `dump.mjs` (Node, einmalig)

- Liest `APPS_SCRIPT_URL` + `MIGRATION_EMAIL` aus env
- POST an `holeAlleFragenFuerMigration` → erhält `{data: Frage[]}`
- Schreibt **eine Frage pro Zeile** nach `fragen-input.jsonl` (JSONL-Format, einfach streambar)
- Zusätzlicher Check: zählt Fragen pro Fachbereich, gibt Zusammenfassung aus (erwartet ~600/600/600/wenige Info)
- Kein Anthropic-SDK nötig — einfacher fetch-Wrapper

**Input:** `holeAlleFragenFuerMigration`-Endpoint (Apps Script)
**Output:** `ExamLab/scripts/migrate-teilerklaerungen/fragen-input.jsonl`
**Idempotent:** Ja (Datei wird bei erneutem Aufruf überschrieben — aber dann bitte state.json zurücksetzen!)

### 4.2 Claude-Code-Migration (dieses Tool, 24 Sessions)

Kein Skript — **Ich selbst** (Claude Opus 4.7 in Claude Code) lese `fragen-input.jsonl` + `state.json`, bearbeite den nächsten Batch.

**Pro Session:**
1. Read `state.json` — letzter verarbeiteter Index + done-IDs
2. Read nächste 100 Fragen aus `fragen-input.jsonl`
3. Pro Frage:
   - Generiere Musterlösung (2–4 Sätze) + Teilerklärungen nach Qualitätskriterien (siehe §5)
   - Append als JSON-Zeile an `fragen-updates.jsonl`: `{id, fachbereich, musterlosung, teilerklaerungen: [{feld, id, text}]}`
   - Update `state.json`: `{[frageId]: "done"}`
4. Am Session-Ende: Progress-Summary (wie viele done, wie viele offen)

**Idempotent:** Ja (bei Restart derselben Session werden done-IDs übersprungen)
**State-Datei-Format** (`state.json`):
```json
{
  "migrationGestartet": "2026-04-22T10:00:00Z",
  "letzteSession": "2026-04-22T14:30:00Z",
  "totalFragen": 2400,
  "verarbeitet": 430,
  "fragen": {
    "uuid-1": { "status": "done", "zeitpunkt": "...", "teile": 4 },
    "uuid-2": { "status": "error", "fehler": "...", "zeitpunkt": "..." }
  }
}
```

### 4.3 `review-generator.mjs` (Node, für Stichprobe)

Nimmt `fragen-input.jsonl` + `fragen-updates.jsonl` + Liste von 30 Stichproben-IDs (zufällig gewählt, seed-basiert reproduzierbar).

**Output:** `stichprobe-review.md` — pro Frage:

```markdown
## [Recht · K2 · MC] Frage aa11bb22
**Fragetext:** Lorem ipsum?

### Optionen (original)
- A) Option A (korrekt)
- B) Option B
- ...

### Alte Musterlösung (aus DB)
> Lorem ipsum…

### Neue Musterlösung (Claude Code)
> Lorem dolor…

### Neue Teilerklärungen (Claude Code)
- **A)** Korrekt weil…
- **B)** Distraktor-Denkfehler: …
- **C)** …
- **D)** …

---
```

Lesbar in ~10 Minuten pro 30 Fragen.

### 4.4 `upload.mjs` (Node, am Ende)

- Liest `fragen-updates.jsonl`
- Gruppiert nach `fachbereich` (Recht, VWL, BWL)
- Ruft pro Fachbereich **einmal** `batchUpdateFragenMigration` auf: `{email, fachbereich, updates: [{id, musterlosung, teilerklaerungen}]}`
- **3 Apps-Script-Calls** total (Info-Fachbereich wird übersprungen)
- Timeout-Guard: bei Apps-Script 5-Min-Limit, split den Call in 2 Hälften und nochmal

**Verifikation nach Upload:**
- Pro Fachbereich: `success`-Flag prüfen, `aktualisiert`-Count mit Erwartung abgleichen
- Stichprobe: 5 Fragen pro Fachbereich via `ladeFrageById` nachholen, prüfen dass Musterlösung + Teilerklärungen gesetzt sind

### 4.5 Apps-Script `batchUpdateFragenMigration` (neu)

**Signatur:**
```js
body: {
  action: 'batchUpdateFragenMigration',
  email: '<admin-lp>',
  fachbereich: 'VWL' | 'BWL' | 'Recht' | 'Informatik',
  updates: [
    {
      id: 'uuid-...',
      musterlosung: 'Gesamterklärung als Text',
      teilerklaerungen: [
        { feld: 'optionen', id: 'opt-a', text: 'Richtig weil…' },
        // ...
      ]
    },
    // ... bis zu ~800 Updates
  ]
}
```

**Logik:**
1. Admin-Check via `getLPInfo(email).rolle === 'admin'`
2. Öffne Fachbereichs-Sheet, lese alle Rows mit `getSheetData`
3. Baue ID→RowIndex-Map
4. Pro Update:
   - Finde Row via ID (Skip + Log wenn ID nicht existiert)
   - Parse `typDaten`-JSON, merge Teilerklärungen in `typDaten[feld][i].erklaerung` via ID-Match
   - Setze `musterlosung`, `typDaten`, `geaendertAm = now`, `pruefungstauglich = ''` (false), `poolContentHash = ''` (kein Hash-Versuch nötig)
   - Akkumuliere alle geänderten Rows in `alleRowData[]`
5. Ein `setValues`-Call pro modifizierter Row (oder, wenn praktikabel: ein grosser setValues über den ganzen Sheet-Range — schneller)
6. Cache invalidieren
7. Response: `{success: true, aktualisiert: n, nichtGefunden: ['id-xyz', ...]}`

**Admin-Endpoint** — nur LP mit `rolle='admin'` (dasselbe Check wie `holeAlleFragenFuerMigration`).

**Fehlerbehandlung:**
- ID nicht gefunden → in Response als `nichtGefunden[]` zurückgeben, nicht crashen
- JSON-Parse-Fehler pro Row → überspringen + loggen, nicht crashen
- Apps-Script-Timeout → User muss upload.mjs neu starten, der Endpoint muss bereits erledigte Updates überspringen

### 4.6 Verzeichnis-Struktur (nach Umbau)

```
ExamLab/scripts/migrate-teilerklaerungen/
├── package.json             (nur "type": "module", keine SDK-Dep)
├── dump.mjs                 (Fragen laden)
├── upload.mjs               (Updates schreiben)
├── review-generator.mjs     (Markdown-Report)
├── README.md                (Workflow, Resume, Rollback)
├── .gitignore               (alle .jsonl, state.json)
└── SESSION-PROTOCOL.md      (wie Claude Code pro Session arbeitet)
```

**Zu löschen:** bisheriges `migrate.mjs` + `prompts.mjs` (Anthropic-SDK-basiert, jetzt obsolet).

## 5. Qualitätskriterien für Teilerklärungen

**Kontext:** Ich (Claude Code) bin verantwortlich für ~14'000 Teilerklärungen. Konsistenz + Fachlichkeit sind kritisch.

**Regeln:**
1. **Länge:** 1–2 Sätze, max. 30 Wörter pro Teilerklärung. Musterlösung: 2–4 Sätze (60–80 Wörter).
2. **Sprache:** Schweizer Hochdeutsch (ss statt ß, Schweizer Institutionen).
3. **Präzision:** Fachlich korrekt. Bei Unsicherheit lieber allgemeiner formulieren als halluzinieren.
4. **Distraktoren (MC, RF falsch):** Denkfehler benennen + korrekten Gedanken ergänzen. Nicht nur „ist falsch".
5. **Korrekte Optionen:** Begründen warum, nicht wiederholen.
6. **Recht:** OR/ZGB-Artikel NUR wenn sicher (bekannte Artikel wie OR 1, 41, 62, 184, 394, 538; ZGB 1, 2, 8, 641, 817). Im Zweifel Formulierung ohne Artikelnummer.
7. **Zahlen:** Schweizer Format (`1'500` mit Apostroph als Tausendertrenner, `4.5` mit Punkt als Dezimal).
8. **Zitate:** Chevrons («…»).
9. **Stil:** Neutrale 3. Person, keine Anrede, keine Füllwörter („selbstverständlich", „offensichtlich", „man sieht leicht ein").
10. **Formatierung:** Kein Markdown in Teilerklärungen (keine `**fett**`, `_kursiv_`) — wird als Plain-Text gespeichert.

**Fachbereichs-Besonderheiten:**
- **VWL:** Modelle präzise (Angebot/Nachfrage-Diagramm-Axen, Konjunktur-Zyklus-Phasen, SNB-Funktionen)
- **BWL:** Kontenrahmen-Nummern (Schweizer KMU-Standard), Buchhaltungs-Soll/Haben-Logik
- **Recht:** Tatbestands-Struktur (Vertragsabschluss: Antrag + Annahme; Eigentum: Besitz + Wille zum Eigentum; etc.)

## 6. Migration-Workflow

### Phase A: Setup (User)
1. Google-Sheets-Backup: Drive → Fragenbank-Datei → Datei → Kopie erstellen → `ExamLab_Fragenbank_Backup_YYYY-MM-DD`
2. Apps-Script: neue Bereitstellung (`batchUpdateFragenMigration` + `holeAlleFragenFuerMigration` aktivieren)
3. Produktions-Pause: keine Frage-Bearbeitung während Migration aktiv

### Phase B: Dump (Claude Code, einmalig)
1. Claude Code führt `dump.mjs` aus → `fragen-input.jsonl` (~2400 Zeilen)
2. Summary: Fragen-Count pro Fachbereich ausgeben

### Phase C: Stichprobe (Session 1)
1. Claude Code: Zufalls-Sample 30 Fragen (seed=42, reproduzierbar), deckt alle 9 Teilerklärungs-Typen ab
2. Bearbeitet die 30, appendet an `fragen-updates.jsonl`
3. Führt `review-generator.mjs` aus → `stichprobe-review.md`
4. User reviewt MD. Feedback → Claude Code passt Prompt-Kriterien (in dieser Spec §5) an und wiederholt falls nötig
5. Bei Freigabe: weiter zu Phase D

### Phase D: Full-Run (Sessions 2–24)
1. Pro Session: 100 Fragen, Resume via state.json
2. Updates werden appended an `fragen-updates.jsonl` (keine Überschreibung)
3. Nach 24 Sessions: alle 2400 Fragen in `fragen-updates.jsonl`

### Phase E: Upload (einmalig, nach Phase D)
1. Claude Code führt `upload.mjs` aus
2. 3 Apps-Script-Calls (Recht, VWL, BWL)
3. Response-Check: `aktualisiert`-Count == erwartete Count pro Fachbereich
4. Verifikation: 5 Fragen pro Fachbereich via Browser-Test im SuS-Üben-Modus prüfen

### Phase F: Nachbereitung (User, Tage/Wochen)
1. Alle 2400 Fragen sind `pruefungstauglich=false`
2. User reviewt im Editor Frage für Frage → setzt `pruefungstauglich=true` oder passt an
3. Das ist ausdrücklich **out of scope** von Phase 4 — gehört zur normalen LP-Pflege

## 7. Rollback

**Bei Problemen während der Migration:**
1. User öffnet Drive → öffnet die Backup-Kopie
2. User benennt Live-Fragenbank um (`Fragenbank → Fragenbank-KAPUTT`)
3. User benennt Backup um (`Backup-2026-04-22 → Fragenbank`)
4. Apps-Script Cache invalidieren (neue Bereitstellung oder via Admin-Endpoint)
5. Kein Frontend-Deploy nötig — nur der Sheet-Content ist zurückgesetzt

**Bei Einzelfrage-Problem (nach Migration):**
- LP korrigiert im Editor direkt
- Kein Bulk-Rollback nötig

## 8. Datenmodell-Details

### 8.1 `holeAlleFragenFuerMigration` liefert

```ts
Frage[] = Array of {
  // Basis-Felder
  id: string
  typ: FrageTyp
  fachbereich: 'VWL' | 'BWL' | 'Recht' | 'Informatik' | 'Allgemein'
  fragetext: string
  musterlosung: string  // alte LP- oder KI-Version (wird überschrieben)
  bloom: 'K1'..'K6'
  // Typ-spezifisch
  optionen?: [{id, text, korrekt, erklaerung?}]  // MC
  aussagen?: [{id, text, korrekt, erklaerung?}]  // RF
  // ... usw. (siehe types/fragen.ts)
}
```

### 8.2 `fragen-updates.jsonl` Format

```
{"id":"uuid-1","fachbereich":"VWL","musterlosung":"...","teilerklaerungen":[{"feld":"optionen","id":"opt-a","text":"..."},...]}
{"id":"uuid-2","fachbereich":"BWL","musterlosung":"...","teilerklaerungen":[]}
```

Eine JSON pro Zeile, kein trailing comma. Simpel parsbar, append-only.

### 8.3 `batchUpdateFragenMigration` Write-Semantik

**Überschrieben:** `musterlosung`, `typDaten` (nur `erklaerung`-Subfelder, Rest unverändert), `pruefungstauglich` (→ ''), `geaendertAm` (→ now), `poolContentHash` (→ '')

**Unverändert:** `id`, `typ`, `fachbereich`, `fach`, `thema`, `unterthema`, `fragetext`, `bloom`, `tags`, `punkte`, `semester`, `gefaesse`, `bewertungsraster`, `anhaenge`, `autor`, `quelle`, `geteilt`, `schwierigkeit`, `poolId`, `poolGeprueft`, `lernzielIds`, `version`, `erstelltAm`. Alle Sub-Element-Felder außer `erklaerung` (`text`, `korrekt`, `label`, `punkte`, usw.).

## 9. Out of Scope (bewusst ausgelassen)

1. **Informatik-Fragen** — User unterrichtet kaum noch Informatik, daher keine Migration nötig. Falls später doch: gleicher Prozess, separater Run.
2. **Pool-Fragen-Update-Hash** — `poolContentHash` wird leer gesetzt; beim nächsten Pool-Sync-Check zeigt das System wahrscheinlich "Update verfügbar" an. Das ist akzeptabel (LP merged dann manuell).
3. **Post-Migration-Review-UI** — das Durchklicken aller 2400 Fragen zur Freigabe (`pruefungstauglich=true`) ist normale LP-Arbeit. Falls ein Batch-Review-Tool gewünscht wird: separater Feature-Request.
4. **Halluzinations-Checks im Backend** — keine Validation dass Claude Code-Teilerklärungen fachlich korrekt sind. Stichproben-Review ist der einzige Qualitäts-Gate.
5. **Rate-Limiting im Apps-Script** — die 3 Upload-Calls sind Admin-only und einmalig, keine Schutzmaßnahme nötig.

## 10. Risiken & Mitigation

| # | Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Datenverlust durch Bug im Upload | niedrig | kritisch | Google-Sheets-Backup vor Migration. Partial-Update-Endpoint (nur definierte Felder werden angerührt). |
| 2 | Claude Code halluziniert bei Recht-Fragen | mittel | mittel | Stichprobe mit 10 Recht-Fragen → Pattern erkennen. Artikel-Zitate nur wenn sicher. |
| 3 | Apps-Script-Timeout bei 800+ Updates pro Fachbereich | mittel | niedrig | Upload splittet in Hälften bei Timeout. Skript ist idempotent. |
| 4 | User bearbeitet Frage während Migration | niedrig | mittel | Migrations-Fenster-Regel. Nicht-in-Produktion-Bestätigung. |
| 5 | ID-Match im Upload findet Frage nicht (z.B. Frage zwischenzeitlich gelöscht) | niedrig | niedrig | Endpoint loggt `nichtGefunden`, kein Crash. |
| 6 | Claude Code verliert Context während Session | niedrig | niedrig | Append-only JSONL + State pro Frage → Resume an genau der Stelle wo Abbruch war. |
| 7 | Apps-Script-Deploy vergessen vor Upload | mittel | niedrig | README checkt das als ersten Schritt. Endpoint-404 im Upload ist sofort erkennbar. |
| 8 | Kosten (Tokens) höher als erwartet | niedrig | niedrig | Claude-Code-Subscription des Users, keine Extra-Kosten pro Token. |

## 11. Testing-Strategie

### Unit/Integration (automatisch)
- **Apps-Script:** keine neuen Tests — bestehender `testC9Privacy_` + Dispatcher-Logik deckt die Pfade ab. `batchUpdateFragenMigration` wird via Dry-Run im GAS-Editor manuell getestet (5 Fake-Fragen, Log-Output prüfen).
- **Node-Skripte:** `dump.mjs` und `upload.mjs` sind einfache Wrapper, kein Test-Framework nötig. Manuelle Ad-hoc-Checks.

### Manuell (User)
- **Nach Phase B (Dump):** Zählung pro Fachbereich prüfen, grob-plausibel?
- **Nach Phase C (Stichprobe):** MD-Review — 30 Fragen durchlesen, Qualität bewerten.
- **Nach Phase E (Upload):** 5 Stichproben-Fragen im SuS-Üben-Modus öffnen → Teilerklärungen sichtbar pro Option?

## 12. Erfolgs-Kriterium

Phase 4 ist erfolgreich wenn:
- [ ] Alle 2400 Fragen (ohne Informatik) haben `erklaerung`-Felder in ihren Sub-Arrays gesetzt (sofern der Typ eine Sub-Struktur hat)
- [ ] Alle 2400 Fragen haben eine neue Musterlösung
- [ ] Alle 2400 Fragen sind `pruefungstauglich=false` (erwarteter Zustand)
- [ ] SuS-Üben-Modus zeigt pro Option die Teilerklärung nach „Antwort prüfen"
- [ ] Keine Frage wurde versehentlich gelöscht oder in anderen Feldern modifiziert (Stichprobe: 5 Fragen pro Fachbereich mit Backup vergleichen)
- [ ] LP-Frontend-Editor kann alle Fragen weiterhin öffnen und bearbeiten

## Anhang A: Stichproben-ID-Auswahl

30 Fragen werden zufallsbasiert ausgewählt mit Seed `42` für Reproduzierbarkeit:

```js
// In review-generator.mjs / Claude-Code-Session
function getStichprobenIds(alleFragen) {
  const proFach = {
    Recht: { mc: 3, richtigfalsch: 3, lueckentext: 2, zuordnung: 2 },
    VWL:   { mc: 2, richtigfalsch: 2, berechnung: 2, hotspot: 2, bildbeschriftung: 1, dragdrop_bild: 1 },
    BWL:   { mc: 2, buchungssatz: 2, kontenbestimmung: 2, tkonto: 1, bilanzstruktur: 2, dragdrop_bild: 1 },
  }
  // Pro Fachbereich + Typ: mit seed=42 die gewünschte Anzahl random pickens
  // Return: Array of frage-IDs (30 Stück)
}
```

Bei nicht-genug-Fragen pro Typ: hochzählen auf nächsten verfügbaren Typ im selben Fachbereich.

## Anhang B: Beispiel Claude-Code-Output pro Frage

**Input (aus `fragen-input.jsonl`):**
```json
{
  "id": "uuid-42",
  "typ": "mc",
  "fachbereich": "BWL",
  "fragetext": "Welche Zielbeziehung besteht zwischen hoher Lieferbereitschaft und niedrigen Lagerhaltungskosten?",
  "musterlosung": "Alter Text (wird überschrieben)",
  "optionen": [
    {"id":"opt-0", "text":"Zielharmonie", "korrekt":false},
    {"id":"opt-1", "text":"Zielidentität", "korrekt":false},
    {"id":"opt-2", "text":"Zielneutralität", "korrekt":false},
    {"id":"opt-3", "text":"Zielkonkurrenz", "korrekt":true}
  ],
  "bloom": "K4"
}
```

**Output (appended an `fragen-updates.jsonl`):**
```json
{"id":"uuid-42","fachbereich":"BWL","musterlosung":"Es besteht Zielkonkurrenz: Eine hohe Lieferbereitschaft setzt grosse Lagerbestände voraus, diese verursachen aber hohe Lagerhaltungskosten. Eine Verbesserung des einen Ziels verschlechtert automatisch das andere.","teilerklaerungen":[{"feld":"optionen","id":"opt-0","text":"Zielharmonie liegt vor, wenn zwei Ziele sich gegenseitig fördern. Hier behindern sie sich jedoch."},{"feld":"optionen","id":"opt-1","text":"Zielidentität bedeutet dass die Ziele inhaltlich deckungsgleich sind. Lieferbereitschaft und Lagerkosten sind aber unterschiedliche Messgrössen."},{"feld":"optionen","id":"opt-2","text":"Zielneutralität setzt voraus dass sich die Ziele nicht beeinflussen. Hier besteht jedoch ein direkter Zielkonflikt."},{"feld":"optionen","id":"opt-3","text":"Zielkonkurrenz ist korrekt: Hohe Bestände (für Lieferbereitschaft) erhöhen zwingend die Lagerhaltungskosten."}]}
```
