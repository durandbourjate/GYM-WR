# Bundle E — Übungsstart-Latenz (Design-Spec)

> **Status:** Design — wartet auf Spec-Review + User-Freigabe
> **Datum:** 2026-04-26
> **Session:** S146

## Zielsetzung

`lernplattformLadeLoesungen` beim ersten Übungsstart pro SuS-Cache-Fenster von **~6 s** (gemessen) auf **~2.5 s** drücken. Single-Klassen-Optimierung im aktuellen Apps-Script-Backend. Multi-Klassen-Concurrent-Skalierung bleibt explizit Edge-Migration-Scope.

## Mess-Beleg (S146 Z-Phase, 26.04.2026)

`testLadeLoesungenLatenz` — BWL-Tab, gezielter Cache-Reset vor jedem Run:

| N Fragen | Cold Total | Pro Frage | Warm Total |
|---|---|---|---|
| 1 | 438 ms | 438 ms | 25 ms |
| 3 | 1'725 ms | 575 ms | 78 ms |
| 5 | 1'924 ms | 385 ms | 98 ms |
| 10 | **4'322 ms** | **432 ms** | 227 ms |

**Root-Cause:** [`ladeFrageUnbereinigtById_`](../../../apps-script-code.js) (Zeile 8871) führt pro Frage einen kompletten `sheet.getDataRange().getValues()`-Read aus. Bei N Fragen: N × ~400 ms Tab-Read + N × Linear-Scan über ~2'400 Zeilen.

Plus Apps-Script-Plattform-Overhead (~1.5-2 s, dokumentiert in `code-quality.md` §„Apps-Script-Latenz") = **~6 s spürbare Übungsstart-Latenz** bei 10 Fragen.

Warm-Cache (CacheService 1 h TTL pro `frage_v1_<sheetId>_<frageId>`): ~25 ms/Frage.

## Architektur — B1 (Bulk-Read pro Sheet)

### Kern-Änderung

**Heute** ([`lernplattformLadeLoesungen`](../../../apps-script-code.js#L8807) Zeile 8807-8858):
```js
for (var i = 0; i < fragenIds.length; i++) {
  var frage = ladeFrageUnbereinigtById_(fragenIds[i], gruppe, body.fachbereich);
  if (!frage) continue;
  loesungen[fragenIds[i]] = extrahiereLoesungsSlice_(frage);
  // Aufgabengruppe-Teilaufgaben ergänzen
}
```

**Nach Bundle E:**
```js
// 1) fragenIds nach Sheet+Tab gruppieren
var byTab = gruppiereFragenIdsNachTab_(fragenIds, gruppe, body.fachbereich);

// 2) Pro Tab 1× Bulk-Read (statt N× Per-Frage-Read)
var fragenMap = {};
for (var sheetId in byTab) {
  for (var tab in byTab[sheetId]) {
    var idSet = byTab[sheetId][tab];
    var found = bulkLadeFragenAusSheet_(sheetId, tab, idSet);
    Object.assign(fragenMap, found); // {frageId → Frage}
  }
}

// 3) Response wie heute aufbauen
for (var i = 0; i < fragenIds.length; i++) {
  var frage = fragenMap[fragenIds[i]];
  if (!frage) continue;
  loesungen[fragenIds[i]] = extrahiereLoesungsSlice_(frage);
  // Aufgabengruppe-Teilaufgaben ergänzen (unverändert)
}
```

### Neue Helper

**`bulkLadeFragenAusSheet_(sheetId, tab, idSet)`**
- Cache-Lookup zuerst: für jede ID in `idSet` `cache.get('frage_v1_<sheetId>_<id>')` → bei Treffer aus `idSet` entfernen, in Result-Map einfügen
- Falls nach Cache-Lookup `idSet.size === 0`: zurück (kein Sheet-Read)
- Sonst: 1× `sheet.getDataRange().getValues()`, einmaliger Scan, jede Match-Row via `parseFrageKanonisch_(row, tab)` parsen
- Pro Treffer: `cache.put('frage_v1_<sheetId>_<id>', JSON.stringify(frage), 3600)` mit existierendem `< 100'000`-Bytes-Guard
- Returns: Map `{frageId → Frage}` (nur Treffer; Lücken fehlen — Caller handelt das wie heute mit `if (!frage) continue`)

**`gruppiereFragenIdsNachTab_(fragenIds, gruppe, fachbereichHint)`**
- Bei Familie-Gruppe (`gruppe.typ === 'familie' && gruppe.fragebankSheetId`): alle IDs gehören zu `gruppe.fragebankSheetId` Tab `'Fragen'`
- Sonst: pro `fragenIds[i]` Tab via `fachbereichHint` (wenn gesetzt) ODER alle Tabs durchsuchen — gleiche Logik wie aktueller `ladeFrageUnbereinigtById_`-Tab-Scan, aber 1× pro Call statt N×
- Returns: `{[sheetId]: {[tab]: Set<frageId>}}`

### Was passiert mit `ladeFrageUnbereinigtById_`?

**Bleibt unverändert.** Andere Aufrufer (`pruefeAntwortJetzt` für Per-Antwort-Korrektur, `holeFrage` für Einzel-Frage-Anzeige) lesen weiterhin per ID. Vorteil: nach `lernplattformLadeLoesungen`-Bulk-Read sind alle relevanten Fragen im Per-Frage-Cache (1 h TTL) → spätere Per-Frage-Calls sind warm (~25 ms).

## Skalierung & Concurrency

### Single-Klasse (heute, ~25 SuS)

- 1. SuS startet Übung → Bulk-Read warmt Cache → ~2.5 s
- SuS 2-25 starten innerhalb 1 h dieselbe Übung → alle 10 Cache-Hits → ~250-500 ms
- Mix-Modus / verschiedene Übungen → Cache-Sharing nur bei Frage-ID-Überlappung; sonst je eigener ~2.5-s-Cold-Read

### Multi-Klassen (Edge-Migration-Zukunft, 100-200 SuS)

**Außerhalb Bundle-E-Scope.** Apps-Script-Concurrent-Execution-Limit (~30 simultane Web-App-Calls) und Sheets-API-Read-Quota werden vor unserer Cache-Architektur zur Decke. Edge-Migration löst beides (persistente DB-Connection, Per-Thema-Index, Redis-Cache).

### Sammlungs-Wachstum

Heute 2'400 Fragen, geplant 10×-Wachstum. **Per-Frage-Cache skaliert linear** (jeder gecachte Eintrag bleibt ~2 KB). Bulk-Read-Memory-Verbrauch bleibt der heutige `getDataRange().getValues()`-Memory-Verbrauch — **identisch zur heutigen Per-Frage-Logik**, nur 1× statt N× pro Call.

## Sicherheits-Invarianten (unverändert)

- Token-Pflicht via `lernplattformValidiereToken_` vor Bulk-Read
- Mitgliedschafts-Check via `istGruppenMitglied_(body, gruppeId)`
- Rate-Limit 5/Minute pro SuS bleibt
- Audit-Log-Zeile (`gruppe`, `email`, `n=fragenIds.length`) bleibt
- `extrahiereLoesungsSlice_` filtert weiterhin auf Lösungs-Felder — **kein Daten-Leak via Bulk-Read** (Bulk-Read liefert vollständige Frage; das Slicing passiert wie heute danach)
- Bulk-Read ist Lese-Pfad — keine neuen Schreib-Berechtigungen
- Cache-Schreib-Path nutzt existierenden `< 100'000` Bytes-Guard

## Was Bundle E NICHT enthält

| Optimierung | Begründung |
|---|---|
| Pre-Warm pro Tab | User-Argument: Schüler üben thematisch, Per-Tab-Pre-Warm = Cache-Slot-Verschwendung. Sprengt Cache-Limit bei 10×-Skalierung |
| Pre-Warm pro Thema | Sinnvoll als Folge-Bundle, wenn E2E zeigt dass Themen-Wechsel-Latenz stört. Erfordert Frontend-API-Erweiterung (`aktiveThemen[]`-Mitsenden) |
| Frontend-Skeleton (A3) | Marginaler Zusatz-Gewinn (~150-200 ms) gegenüber zusätzlicher Komplexität (zweiter Backend-Call mit eigenem ~2-s-Overhead). Nach Bundle E sind 2.5 s-Übungsstart wahrscheinlich akzeptabel |
| Multi-Klassen-Concurrent-Skalierung | Apps-Script-Bottleneck nicht via Cache-Optimierung lösbar. Edge-Migration ist die echte Antwort |

Diese Punkte bleiben in der HANDOFF/Memory als „mögliche Folge-Optimierungen" vermerkt.

## Erwartete Latenzen nach Bundle E

| Szenario | Heute | Nach Bundle E |
|---|---|---|
| 1. SuS, 10 Fragen, cold | ~6 s | **~2.5 s** |
| SuS 2-25 derselben Klasse, dieselbe Übung | je ~6 s | **~250-500 ms** |
| Wiederholter Übungsstart innerhalb 1 h | ~250 ms | ~250 ms (unverändert) |
| Multi-Fachbereich-Mix (3 Fächer × 4 Fragen) | ~5-7 s | **~3-4 s** (3 Bulk-Reads sequentiell) |
| `pruefeAntwortJetzt` nach Bundle-E-Übungsstart | ~25 ms | ~25 ms (Cache wurde von Bulk-Read pre-warmt) |

## Test-Strategie

### Apps-Script Unit-Test (Test-Shim, nicht im Dispatcher)

`testBulkLadeFragenAusSheet_` (analog zu `testC9BatchUpdateFragenMigration_`):
1. **Happy-Path:** 10 IDs aus BWL-Tab → 10/10 in Map gefunden, 10 Cache-Slots gefüllt
2. **Lücken:** 1 nicht-existierende ID + 9 valide → 9/10 in Map (Lücke fehlt schweigend, kein Crash)
3. **Multi-Tab:** 3 IDs BWL + 3 IDs VWL via `lernplattformLadeLoesungen` mit gemischten `fragenIds` → 6/6 gefunden via 2 Sheet-Reads
4. **Familie-Sheet:** 3 IDs aus eigener Familie-Fragebank → 3/3 gefunden, kein Bank-Sheet-Read
5. **Cache-Effekt:** Nach `bulkLadeFragenAusSheet_` mit 10 IDs erfolgt direkter `ladeFrageUnbereinigtById_(id_5)` ohne Sheet-Read (Cache-Hit verifiziert via Logger)

### Apps-Script Latenz-Re-Messung

`testLadeLoesungenLatenzNachBundleE` (analog zu Z-Phase Shim):
- Cold-Cache N=1, 3, 5, 10
- **Akzeptanz-Kriterium:** N=10 cold ≤ 800 ms (intern, ohne Plattform-Overhead) → von heute 4'322 ms → -80% interner Cold-Cost

### Frontend (vitest)

- `uebenLoesungsApi.test.ts` — bestehender Vertrag (gleiche Request/Response-Shape) → bleibt grün
- `uebungsStoreLoesungsPreload.test.ts` — bestehende Mock-Tests → bleiben grün
- Keine neuen Frontend-Tests nötig (kein Frontend-Code-Change)

### Browser-E2E (regression-prevention.md Phase 3)

**Setup:** Tab-Gruppe „Bundle E" mit 1 LP-Tab + 2 SuS-Tabs.
- LP: `yannick.durand@gymhofwil.ch`
- SuS-1: `wr.test@stud.gymhofwil.ch`
- SuS-2: `mathys.test@stud.gymhofwil.ch` (oder beliebiger 2. Test-SuS)

**Test-Szenarien:**
1. **Single-SuS:** SuS-1 startet leere-Cache-Übung mit 10 Fragen → Stoppuhr ≤ 3 s vom Klick „Übung starten" bis erste Frage sichtbar
2. **Concurrent-Cache-Share:** SuS-1 startet (cold), SuS-2 startet 30 s später dieselbe Übung → SuS-2 ≤ 1 s (warm)
3. **Multi-Fachbereich-Mix:** Mix-Modus mit 4 Fragen aus 2 Fächern → ≤ 4 s
4. **Pool-Frage-Familie:** Familie-Gruppe mit eigener Fragenbank → Bulk-Read aus Familie-Sheet, ≤ 3 s
5. **Antwort-Korrektur:** Nach Übungsstart auf Frage 3 antworten → instant Feedback (Per-Frage-Cache via Bulk-Read pre-warmt) — kein zusätzlicher `pruefeAntwortJetzt`-Server-Call

**Security-Check (Network-Tab):**
- SuS-Response von `lernplattformLadeLoesungen` enthält für jede Frage nur Lösungs-Felder (`korrekt`, `musterlosung`, `bewertungsraster`, `korrekteAntworten`, etc.) — keine Veränderung gegenüber heute, da `extrahiereLoesungsSlice_` unverändert
- LP-Korrektur-Pfad unbeeinflusst

### Apps-Script Deploy

Backend-Änderungen: 2 neue Helper-Funktionen + Umbau `lernplattformLadeLoesungen`. **User-Action nötig:** GAS-Editor → neue Bereitstellung. Vor Browser-E2E.

## Risiken & Mitigationen

| Risiko | Mitigation |
|---|---|
| Bulk-Read sprengt Apps-Script-Memory bei zukünftiger 10×-Skalierung (24'000 Zeilen × 30 Spalten) | Heute schon problemlos bei 2'400 Zeilen. Bei 24'000 re-evaluieren — ggf. Pagination via `getRange(start, …)` oder Per-Thema-Bulk |
| `cache.put` für eine Frage > 100'000 Bytes (sehr selten, aber möglich bei großen Anhängen) | Existierender Guard `if (serialized.length < 100000)` übernehmen — sonst Cache überspringen, Per-Frage-Read bleibt Fallback |
| `Object.assign` mit String-Items (siehe code-quality.md S122 Lehre) | Nicht relevant — wir mergen Map-Objekte, keine `Object.assign({}, item)`-Pattern auf Sub-Arrays |
| Bulk-Read-Crash via unerwarteten Sheet-Daten | `try/catch` um Bulk-Read-Block; bei Exception Fallback auf existierenden Per-Frage-`ladeFrageUnbereinigtById_`-Loop. User sieht alte Latenz statt Funktions-Regression |
| Frontend `mergeLoesungen` unerwartet mit fehlenden Lösungen umgehen müssen | Bestehender Pro-Frage-Server-Call-Fallback (`pruefeAntwortJetzt`) bleibt aktiv. Lücken im `loesungen`-Map sind heute schon möglich (z.B. via Rate-Limit) und korrekt gehandhabt |

## Backwards-Kompatibilität

- API-Vertrag `lernplattformLadeLoesungen` unverändert: Request-Body + Response-Shape identisch
- Frontend `ladeLoesungenApi` + `uebungsStore.starteUebung` unverändert
- Cache-Schema (`frage_v1_<sheetId>_<frageId>`, 1 h TTL) unverändert
- Bestehende `ladeFrageUnbereinigtById_`-Aufrufer (`pruefeAntwortJetzt`, `holeFrage`) profitieren automatisch via Per-Frage-Cache, ohne Code-Änderung
- Kein Apps-Script-Schema-Migration, kein Frontend-Schema-Migration

## Folge-Optimierungen (außerhalb Bundle-E-Scope)

Wenn Browser-E2E zeigt, dass Übungsstart zu langsam ist:

1. **Frontend-Skeleton-Pattern (A3-Variante)** — erste Frage rendert sofort, Lösungs-Preload läuft im Hintergrund
2. **Per-aktive-Themen-Pre-Warm** — Frontend schickt `aktiveThemen[]` mit, Backend pre-warmt diese Themen via Background-Bulk-Read
3. **Edge-Backend-Migration** — finale Lösung für Multi-Klassen-Concurrency und Sub-200-ms-Calls
