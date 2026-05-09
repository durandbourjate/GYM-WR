# Media-Phase 3-5 Dual-Write — Design Spec

**Datum:** 2026-05-09
**Branches:** `media-phase-3/apps-script-pdf-save`, `media-phase-4a/bild-stack`, `media-phase-4b/pdf-stack`, `media-phase-5/renderer-cleanup`
**Phase:** Media-Migration Phasen 3-5 (Phase 1+2 done auf main, Phase 6 separates Bundle danach)
**Strategie:** Sequenzielle Sub-Bundles, Clean-Break-Editor-Writes, Voller State-Refactor

---

## 1 · Kontext & Ziel

### Was Phase 1+2 hinterlassen hat (auf main)

- `MediaQuelle` Discriminated Union (5 Varianten: `drive`/`pool`/`app`/`extern`/`inline`) in `packages/shared/src/types/mediaQuelle.ts`
- 3 Migratoren (`bildQuelleAus`/`pdfQuelleAus`/`anhangQuelleAus`) in `packages/shared/src/utils/mediaQuelleMigrator.ts` — ~597 Zeilen Shared-Utility-Code total
- 3 Resolver (`ermittleBildQuelle`/`ermittlePdfQuelle`/`ermittleAnhangQuelle`) in `packages/shared/src/utils/mediaQuelleResolver.ts` — Read-Pfad mit Fallback auf Migrator
- Apps-Script `mq_ergaenzeMediaQuelle_` (apps-script-code.js Z. 1797+) ergänzt `frage.bild`/`frage.pdf`/`anhang.quelle` aus Alt-Feldern bei jedem Read (5 Read-Endpoints)
- Frontend-Renderer haben `ermittleBildQuelle` für Hotspot/Bildbeschriftung/DragDrop in 13+ Stellen (Frage-Renderer + Korrektur + DruckAnsicht)
- Apps-Script SAVE Bild-Block (Z. 4580+ in `typenSpezifischeFelder`) schreibt schon `bild: frage.bild` mit
- Apps-Script READ PDF-Block (parseFrage Z. 3023) liest schon `pdf: typDaten.pdf`

### Was fehlt (diese Spec adressiert)

| Bereich | Lücke |
|---------|-------|
| ~~Apps-Script PDF SAVE~~ | ✅ **Bereits erledigt seit `82dcb4db` (2026-04-19)** — `pdf: frage.pdf` in `typenSpezifischeFelder` PDF-case Z. 4563. Initialer Audit hatte übersehen (zu enger grep-Pattern). Phase 3 entfällt. |
| Frontend Bild-Editor-Stack | `BildUpload`/`BildMitGenerator`/`HotspotEditor`/`BildbeschriftungEditor`/`DragDropBildEditor` schreiben Alt-Felder |
| Frontend PDF-Editor-Stack | `PDFEditor` schreibt 4 Alt-Felder (`pdfBase64`/`pdfDriveFileId`/`pdfUrl`/`pdfDateiname`) |
| Frontend Editor-Orchestrator | `fragenFactory.ts` + `buildFragePreview.ts` + `SharedFragenEditor.tsx` Bild- und PDF-Pfade |
| Frontend Renderer-Cleanup | 4 Files in `ExamLab/src/` mit direkten Alt-Feld-Refs (`PDFKorrektur`/`PDFAnnotationAnzeige`/`VorschauTab`/`PDFFrage`) |

### Ziel

- Editoren halten `MediaQuelle | null` als internen State und schreiben nur `frage.bild`/`frage.pdf` (Clean Break)
- Apps-Script SAVE persistiert `bild` und `pdf` als JSON-Spalten zusätzlich zu Alt-Spalten (parallele Persistenz für Bestandsdaten)
- Renderer lesen via `ermittleBildQuelle`/`ermittlePdfQuelle`-Resolver (Single-Read-Path)
- Phase 6 (Type-Cleanup, Sheet-Daten-Migration, Resolver-Rückbau) bleibt explizit out-of-scope

### NICHT-Ziele (Spawn-Tasks oder Phase 6)

- Demo-Daten-Migration (`einrichtungsFragen.ts`/`einrichtungsUebungFragen.ts`) — Spawn-Task S3
- Pool-Konverter (`utils/poolConverter/konvertiereBild.ts`) — Spawn-Task S4
- Token-Rename in Validation (`bildUrl`/`pdfDriveFileId` → `bild`/`pdf`) — Spawn-Task S2
- Orphan-Validator-Duplikat (`ExamLab/src/utils/fragenValidierung.ts`) — Spawn-Task S1
- Sheet-Daten-Migration via `admin:migrierMediaQuelle` — Phase 6
- Apps-Script `mq_ergaenzeMediaQuelle_` Rückbau — Phase 6
- Type-Cleanup (Alt-Felder aus `fragen-core.ts`) — Phase 6

---

## 2 · Architektur-Entscheidungen

### 2.1 Phasen-Granularität — Sequenzielle Sub-Bundles

| Sub-Bundle | Branch | Ziel | Apps-Script-Deploy | Schätzung |
|------------|--------|------|--------------------|-----------|
| ~~Phase 3~~ | — | ~~Apps-Script SAVE für PDF~~ | — | ✅ Bereits erledigt seit `82dcb4db` (2026-04-19) |
| Phase 4.a | `media-phase-4a/bild-stack` | Bild-Editor-State auf MediaQuelle | Nein | 1-2 Sessions, 8 Files |
| Phase 4.b | `media-phase-4b/pdf-stack` | PDF-Editor-State auf MediaQuelle | Nein | 1 Session, 4 Files |
| Phase 5 | `media-phase-5/renderer-cleanup` | Renderer-Cleanup ExamLab/src | Nein | 1 Session, 4 Files |

**Reihenfolge zwingend:** Phase 4.a → 4.b → 5. Phase-3-Deploy entfällt (ist live seit Bundle N im April).

### 2.2 Editor-Write-Strategie — Clean Break (Option A)

Editoren schreiben ab Phase 4 NUR `frage.bild`/`frage.pdf` (nicht mehr `frage.bildUrl`/`frage.pdfBase64`/etc.). Bestehende Frage-Objekte mit Alt-Feldern bleiben im Frontend-State erhalten (`delete` ist out-of-scope), aber Apps-Script-SAVE schreibt sie als parallele Sheet-Spalten weiter (typenSpezifischeFelder schreibt beide).

**Begründung:**
- Sauberer Code-Zustand im Editor — keine "string-basiertes Denken bleibt"-Schuld
- Backend `mq_ergaenzeMediaQuelle_` macht Read-Backwards-Compat für Alt-Daten
- Phase-6-Cleanup nur noch Apps-Script + Sheet-Daten + Type-Cleanup, kein Editor-Code mehr

**Risiko-Mitigation:** Apps-Script-Deploy für Phase 3 muss vor Phase-4-Frontend-Merge stehen, sonst geht im Deploy-Fenster `pdf`-Feld verloren.

### 2.3 Editor-State-Refactor — Voll auf MediaQuelle (Option A)

Editor-State ist `MediaQuelle | null`, nicht mehr `bildUrl: string`. Read via `ermittleBildQuelle(frage)` beim Mount, Write via `frage.bild = state` beim Save. Touchiert internes State-Management, aber sauber für Phase 6.

### 2.4 Phase-4-Granularität — Per Media-Type (Option A2)

- Phase 4.a = Bild-Stack (8 Files)
- Phase 4.b = PDF-Stack (4 Files, davon 3 in Phase 4.a schon angefasst für Bild-Pfade)

Konsistente Test-Matrix pro Media-Typ (Bild: Hotspot+Bildbeschriftung+DragDrop; PDF: PDFFrage+PDFEditor).

### 2.5 Storage-Format — Single typDaten-Spalte mit JSON-Object (bereits etabliert)

Es gibt **eine** `typDaten`-Spalte im Sheet pro Frage-Row. `typenSpezifischeFelder(frage)` produziert ein typ-spezifisches Object, das via `JSON.stringify(typDaten)` in diese Spalte geschrieben wird. `bild`/`pdf` sind **Keys innerhalb dieses JSON-Blobs** (nicht eigene Sheet-Spalten). MediaQuelle-Werte werden als JSON.stringify-Discriminated-Union persistiert. Anhänge: `anhaenge`-Spalte separat als JSON-Array, jeder Eintrag enthält `quelle: MediaQuelle`. Pattern ist seit Phase 1+2 in Place.

---

## 3 · Phase 3 — Apps-Script SAVE für PDF ✅ BEREITS ERLEDIGT

> **STATUS-UPDATE 2026-05-09:** Phase-3-Implementation ist **bereits auf main vorhanden** seit commit `82dcb4db` (Bundle N Apps-Script-Bereich, 2026-04-19). `git blame ExamLab/apps-script-code.js Z. 4563` bestätigt `pdf: frage.pdf` ist seit ~3 Wochen Teil des `typenSpezifischeFelder` PDF-case. Initialer Spec-Audit hat das übersehen weil der grep-Pattern auf Alt-Feldnamen beschränkt war (`pdfBase64|pdfDriveFileId|pdfUrl|pdfDateiname`) — das neue `pdf:`-Feld matchte keinen davon. **Lehre:** Bei "ist X schon implementiert"-Audits explizit nach X greppen, nicht aus Abwesenheit von Alt-Pattern schliessen.
>
> **Konsequenz:** Phase 3 hat keine Implementation-Arbeit. Die ursprünglich geplante 1-Zeilen-Änderung ist seit `82dcb4db` Live, READ-Pfad in `parseFrage` Z. 3023 ist Phase-2-ready, Apps-Script ist deployed. **User-Apps-Script-Deploy für Phase 3 entfällt.** Direkter Sprung zu Phase 4.a möglich.
>
> Phase-3-Plan-Datei (`docs/superpowers/plans/2026-05-09-media-phase-3-apps-script-pdf-save.md`) wurde gelöscht.
>
> Folgende Sub-Sections beschreiben den ursprünglich geplanten Scope (zur Dokumentation der getätigten Annahmen, nicht zur Ausführung).

### 3.1 Was geliefert

| File | Zeile | Änderung |
|------|-------|----------|
| `ExamLab/apps-script-code.js` | 4559-4562 (innerhalb `case 'pdf':` von `typenSpezifischeFelder`) | Ergänze `pdf: frage.pdf` zum return-Object (analog Z. 4580+ für Bild) |

**Vorher:**
```js
case 'pdf':
  return {
    pdfDriveFileId: frage.pdfDriveFileId,
    pdfUrl: frage.pdfUrl,
    pdfBase64: frage.pdfBase64,
    pdfDateiname: frage.pdfDateiname,
    seitenAnzahl: frage.seitenAnzahl, ...
  };
```

**Nachher:**
```js
case 'pdf':
  return {
    pdfDriveFileId: frage.pdfDriveFileId,
    pdfUrl: frage.pdfUrl,
    pdfBase64: frage.pdfBase64,
    pdfDateiname: frage.pdfDateiname,
    pdf: frage.pdf,  // ← NEU
    seitenAnzahl: frage.seitenAnzahl, ...
  };
```

### 3.2 Optional defensiv

Console.log wenn payload sowohl `pdf` als auch `pdfXxx`-Alt-Felder enthält (Debug-Hilfe für Übergang Phase 3→4.b). Kann weggelassen werden.

### 3.3 Was UNVERÄNDERT bleibt

- READ-Pfad: `parseFrage` Z. 3023 liest schon `pdf: typDaten.pdf`
- READ-Defensive: `mq_ergaenzeMediaQuelle_` ergänzt `frage.pdf` falls fehlend (für Alt-Daten)
- Bild-SAVE: Z. 4580+ schreibt schon `bild: frage.bild`
- Anhänge-SAVE: transparent JSON pass-through (Z. 3840 + 4456)

### 3.4 DoD

- Apps-Script-Deploy (manuell, User) nach Frontend-Merge
- Browser-E2E mit echtem LP-Login: bestehende PDF-Frage laden, ohne Editor-Änderung speichern, Sheet-Inspektion: `pdf`-Spalte gefüllt (auch wenn Editor noch Alt-Felder schickt — `frage.pdf` undefined ist OK, Sheet-Spalte leer)
- Curl-Test (User): Apps-Script-Endpoint mit beispielhaftem `frage.pdf = { typ: 'drive', driveFileId: 'xxx', mimeType: 'application/pdf' }`-payload → Sheet-Spalte enthält JSON-stringified MediaQuelle
- vitest/tsc/lint/build — drift = 0 (keine Frontend-Änderungen)
- SW-Clear nicht zwingend (kein Frontend-Change, aber empfohlen vor manuellem Test wegen Wire-Vertrag)

### 3.5 Risiko

Niedrig. Additive 1-Zeilen-Änderung, keine Brechung bestehender Saves.

### 3.6 Rollback

Apps-Script Re-Deploy alter Version (User-Aufgabe). Frontend-Code ist Wire-Vertrag-additiv und harmlos.

---

## 4 · Phase 4.a — Bild-Stack Editor-State-Refactor

### 4.1 Was geliefert (8 Files)

| # | File | Änderung |
|---|------|---------|
| 1 | `packages/shared/src/editor/components/BildUpload.tsx` | State `bildUrl: string` → `bild: MediaQuelle \| null`. Props `bildUrl/onBildUrlChange` → `bild/onBildChange`. Upload-Resultate als typisierte MediaQuelle-Varianten konstruieren (Drive/URL/Inline/Pool) |
| 2 | `packages/shared/src/editor/components/BildMitGenerator.tsx` | Analog #1, KI-Generator-Output als `{typ:'drive', driveFileId, mimeType:'image/png'}` |
| 3 | `packages/shared/src/editor/typen/HotspotEditor.tsx` | Konsument von BildUpload. Read via `ermittleBildQuelle(frage)`, pass to BildUpload. onBildChange: `setFrage({...frage, bild: neuesBild})` |
| 4 | `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` | Analog #3 |
| 5 | `packages/shared/src/editor/typen/DragDropBildEditor.tsx` | Analog #3 |
| 6 | `packages/shared/src/editor/fragenFactory.ts` | Neue-Frage-Init: `bild: undefined` statt `bildUrl: ''`. Typ-Definitionen Z. 74-77: hotspot/bildbeschriftung/dragdrop_bild |
| 7 | `packages/shared/src/editor/buildFragePreview.ts` | Z. 149-159 (Bild-Cases): `bild: s.bild` statt `bildUrl: s.bildUrl` |
| 8 | `packages/shared/src/editor/SharedFragenEditor.tsx` | Bild-State-Felder im Editor-Orchestrator (Read+Write-Pfad für Bild-Frage-Initialisierung + Save) |

### 4.2 Interim-Patches (kein Token-Rename, in Spawn-Task)

- `packages/shared/src/editor/pflichtfeldValidation.ts` Z. 216/256/285: `bildOk = !!frage.bild || !!frage.bildUrl` (Boolean-OR-Check als Pflicht-Erfüllung). Token-Namen unverändert (`bildUrl: 'pflicht-leer'` bleibt — Spawn-Task S2)

### 4.3 Backwards-Compat-Strategie für Editor-Mount

- Frage hat ggf. nur `bildUrl` (Alt-Daten) ODER `bild` (neu) ODER beides (Apps-Script READ ergänzt `bild` via mq_ergaenzeMediaQuelle_)
- Editor-Init: `const [bild, setBild] = useState(ermittleBildQuelle(frage))` — funktioniert für beide Fälle
- Beim Save: nur `frage.bild = state` setzen, `frage.bildUrl` wird im Save-Objekt nicht überschrieben (kein delete)
- Apps-Script `typenSpezifischeFelder` Z. 4580+ schreibt `bildUrl: frage.bildUrl, bild: frage.bild` parallel — alte Spalte bleibt für bestehende Rows gefüllt, neue Spalte wird befüllt
- Sheet retention: alte `bildUrl`-Spalte bleibt für Bestandsdaten gefüllt → Phase-6-Cleanup räumt auf

### 4.4 Tests

- Bestehende: `HotspotEditorPflicht.test.tsx`, `BildbeschriftungEditorPflicht.test.tsx`, `DragDropBildEditorMultiZone.test.tsx` — Test-State-Updates, eventuell Mock-Frage-Format anpassen
- Neu: vitest für `BildUpload` State-Übergänge auf MediaQuelle-Varianten (Drive/Inline/Pool/Extern), wenn nicht schon vorhanden

### 4.5 DoD

- vitest grün (drift erwartet ≤ +5 für neue MediaQuelle-State-Tests)
- tsc/4×lint/build clean
- Browser-E2E mit echten LP-Login: 3 Bild-Fragetypen (Hotspot, Bildbeschriftung, DragDrop) — neu erstellen mit Drive-Upload + Pool-Auswahl + URL → speichern → reload → Sheet-Inspektion (`bild`-Feld gefüllt, MediaQuelle-typed JSON)
- Bestandsfragen mit nur `bildUrl` öffnen → Editor zeigt Bild (Resolver-Fallback) → speichern → Sheet hat jetzt `bild`-Feld zusätzlich gefüllt
- Browser-E2E mit echten SuS-Login: 3 Bild-Fragetypen rendern weiter korrekt
- SW-Clear vor E2E

### 4.6 Risiko

Mittel. Touchiert State-Management von 6 Komponenten + 2 Orchestrator-Files. Mitigation: schrittweise per-File-Cuts mit Per-File-Reviewer (Bundle-T-Style), Bild-Fragetypen sind gut isoliert vom Rest des Composers.

### 4.7 Rollback

`git revert` Bundle-Merge auf main. Apps-Script bleibt (Phase 3 unverändert). Neue Saves haben `bild` parallel zu Alt-Feldern, beim Revert lesen alte Editoren weiter Alt-Felder. Keine Datenverluste.

---

## 5 · Phase 4.b — PDF-Stack Editor-State-Refactor

### 5.1 Was geliefert (4 Files)

| # | File | Änderung |
|---|------|---------|
| 1 | `packages/shared/src/editor/components/PDFEditor.tsx` | State 4 separate Felder (`pdfBase64/pdfDriveFileId/pdfUrl/pdfDateiname`) → 1 Feld `pdf: MediaQuelle \| null`. Upload-Resultate: Drive→`{typ:'drive',driveFileId,mimeType:'application/pdf',dateiname}`, URL→`{typ:'extern',url,mimeType:'application/pdf',dateiname}`, Material-Auswahl→`{typ:'app',appPfad,mimeType:'application/pdf',dateiname}`, Base64→`{typ:'inline',base64,mimeType:'application/pdf',dateiname}` |
| 2 | `packages/shared/src/editor/fragenFactory.ts` | Z. 72 PDF-Typ-Def: `pdf: MediaQuelle \| undefined` ersetzt 4 Alt-Felder. Z. 216-219 + 225-228 Frage-Init: `pdf: undefined` |
| 3 | `packages/shared/src/editor/buildFragePreview.ts` | Z. 141-143 PDF-Case: `pdf: s.pdf` statt 3 separate Felder |
| 4 | `packages/shared/src/editor/SharedFragenEditor.tsx` | Z. 924-926: Save-Payload schickt `pdf` statt 3 separate Felder |

### 5.2 Interim-Patch

- `packages/shared/src/editor/fragenValidierung.ts` Z. 87 (PDF-Pflicht): `!!frage.pdf || !!frage.pdfBase64 || !!frage.pdfDriveFileId || !!frage.pdfUrl` (OR-Check). Token-Name unverändert (Spawn-Task S2).

### 5.3 Backwards-Compat-Strategie

Identisch zu Phase 4.a:
- Editor-Mount: `useState(ermittlePdfQuelle(frage))` — funktioniert für Alt-Daten + neue Daten + Mischformen
- Save: nur `frage.pdf` setzen, Alt-Felder unverändert im Frontend-State
- Apps-Script-Save persistiert beide parallel via typenSpezifischeFelder Z. 4559-4562 (4 Alt-Felder) + neuer Z. (`pdf: frage.pdf` aus Phase 3)
- Sheet retention: Alt-Spalten bleiben für bestehende Rows gefüllt

### 5.4 Tests

- Suchen nach existing PDFEditor-Tests
- Neu: vitest für PDFEditor State-Übergänge auf MediaQuelle-Varianten
- Mock-Frage-Format in betroffenen Editor-Tests anpassen

### 5.5 DoD

- vitest grün (drift erwartet ≤ +5)
- tsc/4×lint/build clean
- Browser-E2E mit echten LP-Login: PDF-Frage neu erstellen mit allen 4 Quellen (Drive-Upload, URL-Eingabe, Material-Auswahl, ggf. Inline-Base64) → speichern → reload → Sheet-Inspektion: `pdf`-Feld gefüllt mit korrektem MediaQuelle-Format
- Bestandsfrage mit Alt-Feldern öffnen → Editor zeigt PDF (Resolver-Fallback) → speichern → Sheet hat zusätzlich `pdf`-Feld
- Browser-E2E mit echtem SuS-Login: PDF-Frage rendert (PDFFrage.tsx liest noch teils Alt-Felder direkt — Phase 5)
- SW-Clear vor E2E

### 5.6 Risiko

Niedrig-Mittel. Weniger Files als 4.a (4 statt 8), aber PDFEditor hat komplexere Upload-Pipeline (4 Quellen-Varianten statt 2 für Bild). Mitigation: PDFEditor-Cut mit Reviewer.

### 5.7 Rollback

Wie Phase 4.a — `git revert`, Apps-Script bleibt, Daten safe.

### 5.8 Was Phase 4.b NICHT macht

- `PDFFrage.tsx` (Renderer mit `frage.pdfDateiname`-Fallback) — Phase 5
- `PDFKorrektur.tsx` (Korrektur-Renderer) — Phase 5
- `PDFAnnotationAnzeige.tsx`/`VorschauTab` (Anzeige `pdfDateiname`) — Phase 5

---

## 6 · Phase 5 — Renderer-Cleanup ExamLab/src/

### 6.1 Was geliefert (4 Files)

| # | File | Änderung |
|---|------|---------|
| 1 | `ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx` | Z. 66-93: Direkte Reads (`frage.pdfBase64`/`frage.pdfDriveFileId`/`frage.pdfUrl`/`frage.anhaenge[*].driveFileId`) → `const pdfQuelle = ermittlePdfQuelle(frage)` einmal oben, dann `pdfQuelle?.typ === 'inline' ? pdfQuelle.base64 : ...` switch über die 5 Varianten. Dependency-Array vom useEffect entsprechend |
| 2 | `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/PDFAnnotationAnzeige.tsx` | Z. 12: `(frage as { pdfDateiname?: string }).pdfDateiname` → `pdfQuelle?.dateiname ?? 'Dokument'` (pdfQuelle wird via `ermittlePdfQuelle(frage)` schon geholt) |
| 3 | `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/index.tsx` | Z. 255-256: `frage.pdfDateiname` → `ermittlePdfQuelle(frage)?.dateiname` |
| 4 | `ExamLab/src/components/fragetypen/PDFFrage.tsx` | Z. 143-147 (Fallback-Logik) + Z. 234 (Loading-Condition): drop `frage.pdfDateiname`/`frage.pdfBase64`/`frage.pdfUrl`/`frage.pdfDriveFileId` Fallback-Pfade, nur noch `pdfQuelle = ermittlePdfQuelle(frage)` und switch über Varianten |

### 6.2 DoD

- vitest grün (drift = 0 erwartet — kein neuer Test-Code, nur consumer-Updates)
- tsc/4×lint/build clean
- Browser-E2E mit echten LP-Login: PDF-Frage in Composer-Vorschau ✓ + LP-Korrektur eines abgegebenen PDF ✓ + Annotation-Anzeige ✓
- Browser-E2E mit echten SuS-Login: PDF-Frage rendert (Drive + URL + Inline + App-Material — alle 4 Varianten falls testbar)
- KEIN Service-Worker-clear nötig (reine Frontend-Read-Pfad-Änderung, kein Wire-Vertrag)

### 6.3 Risiko

Niedrig. Pure Read-Pfad-Refactor ohne Side-Effects. PDFKorrektur.tsx hat komplexere Loading-Logik (3 verschiedene Fetch-Pfade je nach Quelle), erfordert sorgfältige Switch-über-Varianten + dep-Array-Update.

### 6.4 Rollback

`git revert`. Resolver-Fallback existiert noch, alte Renderer-Logik unverändert.

### 6.5 Was Phase 5 NICHT macht

- Bild-Renderer in `ExamLab/src/` — sind alle schon migriert (Hotspot/Bildbeschriftung/DragDrop in Frage-Renderern + Korrektur + DruckAnsicht via `ermittleBildQuelle` seit Phase 1+2)
- `mq_ergaenzeMediaQuelle_` Read-Pfad in Apps-Script bleibt aktiv (defensiv, Phase 6)
- Resolver-Functions selbst (`ermittleBildQuelle`/`ermittlePdfQuelle`) bleiben — Phase 6 kann entscheiden ob Renderer auf direkten Field-Read umsteigen oder Resolver als API-Surface beibehalten

---

## 7 · Cross-cutting Concerns

### 7.1 Apps-Script-Deploy-Workflow (nur Phase 3)

**Reihenfolge zwingend:**

1. Phase-3-Frontend-Branch mergen (1-Zeilen-Apps-Script-Änderung committed in main)
2. User öffnet Apps-Script-Editor im Browser
3. User deployed via "Bereitstellen → Bereitstellung verwalten"
4. User testet im Browser mit echtem LP-Login (Verifikation siehe 3.4)
5. User bestätigt im Chat
6. Erst dann Phase-4.a-Branch starten

**Bei Apps-Script-Deploy-Fehler:** Frontend-Code (1-Zeilen-Apps-Script-Änderung) ist im Repo committed aber bleibt ohne Wirkung bis Deploy. Re-Deploy mit Fix oder Revert.

### 7.2 Service-Worker-Cache-Clear-Pattern

Per Memory-Lehre [feedback_service_worker_cache_wire_bundle](../../00 Automatisierung Unterricht/memory/feedback_service_worker_cache_wire_bundle.md): Wire-Vertrag-Bundles benötigen vor Browser-E2E:

1. DevTools → Application → Service Workers → "Unregister"
2. Application → Storage → "Clear site data"
3. Reload

**Anwendbar:** Phase 3 + 4.a + 4.b (alle Wire-Vertrag-Bundles).
**Nicht zwingend:** Phase 5 (pure Read-Pfad-Refactor, kein API-Payload-Change).

### 7.3 Test-Strategie Konsolidierung

| Test-Typ | Phase 3 | Phase 4.a | Phase 4.b | Phase 5 |
|----------|---------|-----------|-----------|---------|
| **vitest** (frontend unit) | n/a | Drift +5 max | Drift +5 max | Drift = 0 |
| **tsc/lint/build** | Drift = 0 | Clean | Clean | Clean |
| **Browser-E2E LP** | PDF-Frage save+reload | Hotspot/Bildbeschriftung/DragDrop neu+Bestand | PDF-Frage neu+Bestand | PDFKorrektur+VorschauTab+PDFAnnotation |
| **Browser-E2E SuS** | optional | 3 Bild-Fragetypen rendern | PDF-Frage rendern | PDFFrage rendern (alle 4 Quellen) |
| **Sheet-Inspektion** | `pdf`-Spalte gefüllt | `bild`-Spalte für neu | `pdf`-Spalte für neu | n/a |
| **Apps-Script-Deploy** | Ja (User) | Nein | Nein | Nein |
| **SW-Clear vor E2E** | Empfohlen | Ja | Ja | Optional |

### 7.4 Rollback-Strategie pro Phase

| Phase | Rollback-Aufwand | Datenrisiko |
|-------|------------------|-------------|
| 3 | Apps-Script Re-Deploy alter Version (User) | Keine — additiv, alte Pfade unverändert |
| 4.a | `git revert` Bundle-Merge auf main, Apps-Script bleibt | Keine — neue Saves haben `bild` parallel zu Alt-Feldern |
| 4.b | Wie 4.a | Keine — analog |
| 5 | `git revert` | Keine — pure Read-Pfad-Änderung, Resolver-Fallback existiert noch |

---

## 8 · Spawn-Tasks (entstehen nach Phase 5)

| # | Task | Aufwand | Priorität |
|---|------|---------|-----------|
| S1 | `ExamLab/src/utils/fragenValidierung.ts` Orphan-Duplikat löschen (0 Konsumenten, identisch zu shared-Version) | 5 Min | Niedrig |
| S2 | `pflichtfeldValidation.ts` + shared `fragenValidierung.ts` Token-Rename (`bildUrl` → `bild`, `pdfDriveFileId` → `pdf`) | 30 Min | Niedrig (Validator funktioniert via OR-Check) |
| S3 | Demo-Daten-MediaQuelle-Migration (`einrichtungsFragen.ts` + `einrichtungsUebungFragen.ts`) | 1 Session | Niedrig (Demo-Daten) |
| S4 | Pool-Konverter (`utils/poolConverter/konvertiereBild.ts`) auf MediaQuelle-Output | 30 Min | Niedrig (initial-Pool-Import war einmaliger Vorgang) |

---

## 9 · Out-of-Scope (Phase 6, separates Bundle)

- Sheet-Daten-Migration via `admin:migrierMediaQuelle`-Endpoint (bestehende Rows: Alt-Spalten leeren, MediaQuelle-Spalten verifiziert gefüllt)
- Type-Cleanup: `bildUrl`/`bildDriveFileId`/`pdfBase64`/`pdfDriveFileId`/`pdfUrl`/`pdfDateiname` aus `packages/shared/src/types/fragen-core.ts` entfernen
- Apps-Script `mq_ergaenzeMediaQuelle_` Read-Pfad rückbauen (Read-Defense nicht mehr nötig wenn alle Daten migriert)
- Apps-Script `typenSpezifischeFelder` Alt-Spalten-Schreiben rückbauen (nur noch `bild`/`pdf` schreiben)
- Renderer-Resolver-Funktionen (`ermittleBildQuelle`/`ermittlePdfQuelle`) ggf. zu reinen Field-Reads vereinfachen oder als API-Surface behalten

---

## 10 · Dateien-Inventar (Total 17 Files in Phase 3-5)

| Phase | Files | Cumulative |
|-------|-------|------------|
| 3 | 1 (apps-script-code.js) | 1 |
| 4.a | 8 (BildUpload, BildMitGenerator, HotspotEditor, BildbeschriftungEditor, DragDropBildEditor, fragenFactory*, buildFragePreview*, SharedFragenEditor*) | 9 |
| 4.b | 4 (PDFEditor, fragenFactory*, buildFragePreview*, SharedFragenEditor*) | 13 (3 Files überlappen mit 4.a, beide Phasen touchieren sie für jeweils Bild-/PDF-Pfade) |
| 5 | 4 (PDFKorrektur, PDFAnnotationAnzeige, VorschauTab, PDFFrage) | 17 |

\* `fragenFactory.ts` + `buildFragePreview.ts` + `SharedFragenEditor.tsx` werden in Phase 4.a für Bild-Pfade angefasst und in Phase 4.b nochmal für PDF-Pfade. Per-Phase-Cut isoliert die Änderungen pro Media-Typ.
