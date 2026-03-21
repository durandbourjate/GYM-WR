# Pool-Rück-Sync — Design-Dokument

> Änderungen an importierten Pool-Fragen zurück in die Übungspools schreiben + neue Fragen in bestehende Pools exportieren.
> Datum: 21.03.2026

## Kontext

Die Pool-Brücke (Phase 5d) importiert Fragen aus 27 Übungspools (GitHub Pages) in die Fragenbank der Prüfungsplattform. Der Import ist einweg. Wenn LP Fragen im Prüfungstool verbessert (Typos, bessere Erklärungen, Bloom-Korrekturen) oder neue Fragen erstellt, divergieren die beiden Sammlungen. Der Rück-Sync schliesst die Brücke.

## Entscheide

| Aspekt | Entscheid |
|--------|-----------|
| Technischer Weg | GitHub API via Apps Script als Proxy |
| Scope | Inhaltsfelder + Metadaten (q, options, correct, explain, context, blanks, rows, tax, diff, reviewed) |
| Neue Fragen | Export in bestehende Pools (Pool + Topic wählen) |
| Diff-Vorschau | Feld-für-Feld mit Checkboxen (LP wählt pro Feld) |
| GitHub Token | Script Property in Apps Script (nie im Frontend) |
| Neue Pools erstellen | Out of scope |

## Architektur

### Datenfluss

```
LP ändert Pool-Frage im FragenEditor (oder erstellt neue Frage)
  → Button "↑ An Pool" / "↑ In Pool exportieren"
  → RueckSyncDialog: Feld-für-Feld Vorschau mit Checkboxen
  → LP bestätigt
  → apiService.schreibePoolAenderung(payload)
  → Apps Script: schreibePoolAenderung
    → GitHub API: GET aktuelle Pool-Datei (Base64 + SHA)
    → JS parsen: QUESTIONS-Array extrahieren
    → Frage finden (Update) oder anhängen (Export)
    → Gewählte Felder überschreiben
    → JS-Datei neu generieren
    → GitHub API: PUT (Commit mit aktualisierter Datei)
  → Erfolg → poolContentHash + poolId aktualisieren
```

### Bündelung

Mehrere Änderungen am selben Pool werden in einem Commit gebündelt (ein GET + ein PUT pro Pool-Datei). Änderungen an verschiedenen Pools = je ein Commit.

## Backend — Apps Script

### Neuer Endpoint: `schreibePoolAenderung`

```
Input: {
  action: 'schreibePoolAenderung',
  email: string,
  poolDatei: string,            // z.B. "vwl_geld.js"
  aenderungen: [{
    poolFrageId: string | null, // z.B. "t01" (null bei Export)
    typ: 'update' | 'export',
    felder: {
      q?: string,
      options?: Array<{v: string, t: string}>,
      correct?: string | string[] | boolean,
      explain?: string,
      tax?: string,
      diff?: number,
      reviewed?: boolean,
      // Bei Export zusätzlich:
      type?: string,
      topic?: string,
      id?: string,
      blanks?: Array<{answer: string, alts?: string[]}>,
      rows?: Array<{label: string, answer: number, tolerance: number, unit?: string}>,
      categories?: string[],
      items?: Array<{t: string, cat: number}>,
      sample?: string,
      context?: string,
    }
  }]
}

Output: {
  erfolg: boolean,
  aktualisiert: number,
  exportiert: number,
  commitSha: string,
  neueHashes: Record<string, string>,     // poolFrageId → neuer Content-Hash
  exportierteIds: Record<string, string>, // temp-Key → generierte Pool-ID
  fehler: string[]
}
```

### GitHub API Flow

1. **GET** `/repos/durandbourjate/GYM-WR-DUY/contents/Uebungen/Uebungspools/config/{poolDatei}`
   - Response: `{ content: Base64, sha: string }`
2. **Parsen:** Base64 dekodieren → JS-String → QUESTIONS-Array per Regex extrahieren
3. **Manipulieren:** Frage finden (by id) und Felder überschreiben, oder neue Frage anhängen
4. **Generieren:** QUESTIONS-Array neu serialisieren, in JS-Datei einsetzen
5. **PUT** `/repos/.../contents/...` mit:
   - `content`: Base64-encodierter neuer Inhalt
   - `sha`: SHA vom GET (Konflikt-Erkennung)
   - `message`: `Pool-Sync: {poolId} — {n} aktualisiert, {m} neu`
   - `branch`: `main`

### GitHub Token

- Fine-Grained PAT mit `contents: write` nur auf `durandbourjate/GYM-WR-DUY`
- Gespeichert als Script Property `GITHUB_TOKEN`
- Setup: Apps Script Editor → Projekteinstellungen → Skripteigenschaften

### JS-Parsing-Strategie

Die Pool-Dateien haben unquoted Keys, Kommentare und teils fehlende Kommas — kein valides JSON. Strategie: **gezielte Frage-Ersetzung statt Full-Parse**.

**Für Updates (bestehende Fragen):**
1. Regex: Frage-Objekt anhand `id: "{fragenId}"` im JS-String finden
2. Start: Position von `{` vor dem `id:`-Match (rückwärts suchen)
3. Ende: Bracket-Matching (`{}`-Zähler) bis zum schliessenden `}`
4. Nur die gewählten Felder innerhalb dieses Objekts per Regex ersetzen (z.B. `q: "alter Text"` → `q: "neuer Text"`)
5. Rest der Datei bleibt byte-identisch (Kommentare, Formatting, andere Fragen)

**Für Export (neue Fragen):**
1. Regex: `window\.QUESTIONS\s*=\s*\[` → Array-Start finden
2. Letzte `}` vor dem schliessenden `];` finden (= letzte Frage)
3. Neue Frage als JS-Objekt-String serialisieren (unquoted Keys, 2-Space Indent, Komma nach letztem bestehenden Objekt)
4. Pool-Format beibehalten: `{id: "x01", topic: "...", type: "mc", ...}`

**Serialisierung neuer Fragen:**
```javascript
// Beispiel-Output für eine neue MC-Frage
{id: "g15", topic: "geldfunktionen", type: "mc", diff: 2, tax: "K2", reviewed: false,
  q: "Fragetext hier",
  options: [
    {v: "A", t: "Option A"},
    {v: "B", t: "Option B"},
    {v: "C", t: "Option C"},
    {v: "D", t: "Option D"}
  ],
  correct: "B",
  explain: "Erklärung hier"}
```

**Vorteile gegenüber Full-Parse:**
- Kommentare im File bleiben erhalten
- Kein Risiko durch `eval()`/`new Function()` im Backend
- Minimale Diffs in Git (nur geänderte Zeilen)
- Robuster: funktioniert auch bei leicht abweichendem Formatting

Fallback bei Parse-Fehler (Frage nicht gefunden, Bracket-Mismatch): Abbruch, keine Datei-Änderung, Fehlermeldung an Frontend.

## Frontend

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/utils/poolExporter.ts` | Konvertierung Prüfungstool → Pool-Format (Gegenstück zu poolConverter.ts) |
| `src/components/lp/RueckSyncDialog.tsx` | Modal für Diff-Vorschau + Export-Formular |

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/components/lp/frageneditor/FragenEditor.tsx` | Buttons "↑ An Pool" / "↑ In Pool exportieren" |
| `src/components/lp/FragenBrowser.tsx` | Button "↑ Pool-Export" für Batch |
| `src/services/apiService.ts` | Neuer Call `schreibePoolAenderung()` |
| `src/services/poolSync.ts` | Hilfsfunktionen für Rück-Diff-Berechnung |
| `apps-script-code.js` | Neuer Endpoint + GitHub API Integration |

### poolExporter.ts — Typ-Mapping

| Prüfungstool | Pool |
|-------------|------|
| MCFrage (mehrfachauswahl: false) | mc |
| MCFrage (mehrfachauswahl: true) | multi |
| FreitextFrage | open |
| LueckentextFrage | fill |
| ZuordnungFrage | sort |
| RichtigFalschFrage | tf |
| BerechnungFrage | calc |
| VisualisierungFrage | — (nicht exportierbar, Validierungsfehler) |

Zusätzlich:
- `bloom` (K1–K6) → `tax`
- `schwierigkeit` → `diff`
- `musterlosung` → `sample` bei `open`-Typ, `explain` bei allen anderen Typen
- Bei `open`-Typ: bestehendes `explain` im Pool wird beibehalten (nicht überschrieben), nur `sample` wird aktualisiert
- `fachbereich` + `thema` → Topic-Zuordnung (bei Export)

### RueckSyncDialog — Zwei Modi

**Update-Modus** (Frage hat `poolId`):
- Überschrift: "Änderungen an Pool zurückschreiben"
- Info: Pool-Name + Frage-ID
- Feld-für-Feld-Liste: nur geänderte Felder
  - Checkbox (default: an)
  - Feldname
  - Alt-Wert (grau) → Neu-Wert (grün)
- Footer: "Zurückschreiben" + "Abbrechen"

**Export-Modus** (Frage ohne `poolId`):
- Überschrift: "Frage in Pool exportieren"
- Pool-Dropdown (gruppiert nach Fachbereich, vorselektiert)
- Topic-Dropdown (aus gewähltem Pool)
- Vorschau aller Felder im Pool-Format
- ID wird automatisch generiert (Topic-Prefix + laufende Nummer)
- Footer: "Exportieren" + "Abbrechen"

### Batch-Export (FragenBrowser)

- Button "↑ Pool-Export" öffnet Dialog
- Liste: Fragen ohne `poolId` + Fragen mit Änderungen
- Pro Frage: Checkbox + Pool/Topic-Auswahl
- "Alle exportieren" → gebündelt pro Pool-Datei

### Änderungs-Erkennung (Update)

Um zu erkennen, welche Felder geändert wurden, wird der aktuelle Frage-Stand mit dem gespeicherten `poolVersion`-Snapshot verglichen. Neue Hilfsfunktion `berechneRueckSyncDiff(frage, snapshot)` in `poolSync.ts`:
- Vergleicht jeden Inhaltsfeldwert
- Gibt Array von `{feld, alt, neu}` zurück
- Nur Felder mit Unterschied werden im Dialog angezeigt

### Nach erfolgreichem Sync

**Update:**
- Backend gibt `neueHashes: Record<string, string>` zurück (pro Frage-ID den neuen Content-Hash, berechnet aus dem tatsächlich geschriebenen Pool-Inhalt)
- Frontend setzt `poolContentHash` auf den vom Backend gelieferten Hash (vermeidet Hash-Divergenz bei nächstem Vorwärts-Sync)
- `poolUpdateVerfuegbar = false`, `poolVersion` aktualisieren (neuer Snapshot)
- Frage in Fragenbank-Sheet aktualisieren (via `speichereFrage`)
- Toast: "✓ 3 Änderungen an vwl_geld zurückgeschrieben"

**Export:**
- Backend gibt `exportierteIds: Record<string, string>` zurück (generierte Pool-Frage-ID + Content-Hash)
- `poolId` setzen auf `{pool}:{id}` (Compound-Key)
- `quelle = 'pool'`, `poolContentHash` vom Backend
- Frage in Fragenbank-Sheet aktualisieren
- Toast: "✓ Frage in recht_or_at exportiert"

## Fehlerbehandlung

### SHA-Konflikt (Pool extern geändert)
GitHub PUT schlägt fehl bei SHA-Mismatch → Fehlermeldung: "Pool wurde extern geändert. Bitte zuerst Pool-Sync (vorwärts) durchführen, dann erneut versuchen."

### Frage nicht gefunden (gelöscht im Pool)
Frage-ID existiert nicht mehr in QUESTIONS → Fehlermeldung + Option: stattdessen als neue Frage exportieren.

### Parse-Fehler
JS-Datei kann nicht geparst werden → Abbruch, keine Änderung, Fehlermeldung mit Details.

### Validierung (vor Schreiben)
- Pflichtfelder: id, type, q, correct (MC/TF), blanks (fill), rows (calc)
- Topic muss in TOPICS des Pools existieren
- Frage-ID darf bei Export nicht bereits existieren

### Berechtigungen
Nur LP (`@gymhofwil.ch`) — wie alle Backend-Endpoints.

## Rate Limits

GitHub API: 5000 Requests/Stunde (authentifiziert). Ein Rück-Sync = 2 Calls pro Pool-Datei. Selbst ein grosser Batch-Export (20 Fragen in 5 Pools) = 10 Calls. Kein Engpass.

## `context`-Feld (Recht-Pools)

9 Recht-Pools verwenden `context` für Fallbeschreibungen (154 Vorkommen). Dieses Feld existiert aktuell nicht im Prüfungstool-Datenmodell und wird beim Vorwärts-Import stillschweigend verworfen.

**Für den Rück-Sync:**
- Bei **Updates**: `context` im Pool bleibt unverändert (wird nicht angefasst, da nicht im Prüfungstool vorhanden)
- Bei **Export** neuer Fragen in Recht-Pools: Kein `context`-Feld wird geschrieben. Ist akzeptabel, da nicht alle Recht-Fragen einen Kontext haben.
- **Parallel-Fix (optional, nicht blockierend):** `kontext`-Feld zu `FrageBase` hinzufügen und im Vorwärts-Import befüllen. Dann wäre auch Rück-Sync von `context` möglich. Diesen Fix als separaten Task behandeln.

## `reviewed`-Feld Semantik

- Pool: `reviewed: boolean` — ob die Frage im Pool geprüft wurde
- Prüfungstool: `poolGeprueft: boolean` (= Pool's reviewed) + `pruefungstauglich: boolean` (LP-Absegnung)
- **Rück-Sync-Mapping:** `poolGeprueft` → `reviewed` im Pool. `pruefungstauglich` wird NICHT zurückgeschrieben (prüfungsspezifisch).

## ID-Generierung (Export)

Für neue Fragen in einem Pool:
1. Topic-Key ermitteln (z.B. `geldfunktionen`)
2. Prefix = erster Buchstabe des Topic-Keys (z.B. `g`)
3. Bestehende IDs mit diesem Prefix scannen (z.B. `g01`...`g14`)
4. Nächste freie Nummer: `g15` (zweistellig, bei >99: `g100`)
5. Kollisionsprüfung: Falls Prefix-Logik zu Duplikat führt, Suffix hochzählen

## Partielle Fehler (Batch)

Bei Batch-Operationen über mehrere Pool-Dateien:
- Jede Pool-Datei = ein separater GitHub-Commit
- Bei Fehler nach teilweisem Erfolg: bereits committete Pools können nicht zurückgerollt werden
- Backend meldet partiellen Erfolg: `erfolg: true` + `fehler: ["vwl_geld.js: SHA-Konflikt"]`
- Frontend zeigt: "✓ 3 Pools aktualisiert, ✗ 1 Pool fehlgeschlagen: ..."

## GitHub Pages Cache-Delay

Nach erfolgreichem PUT → GitHub Actions Build → Pages-Update dauert 1–5 Minuten. Ein sofortiger Vorwärts-Sync nach Rück-Sync könnte noch alte Daten sehen. Toast-Hinweis: "Änderungen sind in ~2 Min. auf GitHub Pages sichtbar."

## Nicht im Scope

- Neue Pools erstellen (nur in bestehende exportieren)
- TOPICS oder POOL_META ändern (nur QUESTIONS)
- Lernziele zurückschreiben
- Multi-User-Konfliktlösung (nur DUY als User)
- Automatischer Rück-Sync (immer manuell mit Vorschau)
- `context`-Feld im Prüfungstool-Datenmodell ergänzen (separater Task)
