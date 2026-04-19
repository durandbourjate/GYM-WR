# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Session 125 — Phase 5 vorbereitet (19.04.2026 spät)

### Stand
**Branch `feature/apps-script-mediaquelle-migrator` auf Remote, wartet auf User-Deploy. `apps-script-code.js` erweitert — Frontend bleibt kompatibel (412/412 Tests, tsc grün).**

### Umgesetzt (Apps-Script-Port)
- **Migrator-Helper** `mq_mimeType_`, `mq_extrahiereDriveId_`, `mq_klassifiziere_`, `mq_bildQuelleAus_`, `mq_pdfQuelleAus_`, `mq_anhangQuelleAus_`, `mq_ergaenzeMediaQuelle_` (JS-Port der Phase-1 TypeScript-Functions).
- **Load-Pfad:** `ladeFragen()` + 2× LP-Browser-Calls + Einzel-Lookup wrappen `parseFrage(...)` in `mq_ergaenzeMediaQuelle_(...)`. Alle Fragen aus Backend kommen mit ergänztem `bild`/`pdf`/`anhaenge[*].quelle`-Feld.
- **Save-Pfad:** `getTypDaten()` — PDF/Hotspot/Bildbeschriftung/DragDropBild schreiben jetzt `bild`/`pdf` + Alt-Felder parallel (Dual-Write). PDF zusätzlich `pdfBase64` + `pdfUrl` (waren teilweise fehlend).
- **Parse-Pfad:** `parseFrage` PDF-Case liest `pdf` aus `typDaten`.
- **Admin-Endpoint** `aktion: 'admin:migrierMediaQuelle'` mit Dry-Run-Default. Liefert Summary-List (erste 50 Einträge) + Stats pro Sheet.

### User-Deploy-Anleitung

**⚠️ Vorbereitung (Pflicht, nicht während laufender Prüfungen!):**

1. **Backup-Kopien aller Fragenbank-Sheets** im Google-Drive:
   - Öffne Drive → finde die Fragenbank (ID: `1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs`).
   - Rechtsklick → "Kopie erstellen" mit Suffix `-backup-2026-04-19`.
   - Verifiziere dass alle 4 Tabs (VWL/BWL/Recht/Informatik) in der Backup-Datei sind.

2. **Apps-Script-Code deployen:**
   - `ExamLab/apps-script-code.js` komplett in den Apps-Script-Editor kopieren (überschreiben).
   - "Bereitstellen → Bereitstellung verwalten → Bearbeiten (Stift-Icon) → Version: Neu → Bereitstellen".
   - Deployment-URL in `.env.local` prüfen (sollte gleich bleiben).

3. **Dry-Run auf einem Sheet testen** (z.B. `BWL` — hat wenige Bild/PDF-Fragen):
   ```
   POST /macros/s/.../exec
   { "action": "admin:migrierMediaQuelle", "callerEmail": "yannick.durand@gymhofwil.ch",
     "dryRun": true, "sheetName": "BWL" }
   ```
   - Erwartet: `{ success: true, dryRun: true, tabs: [{name:'BWL', rows:X, aktualisiert:Y}], summary: [...] }`
   - Reviewe die ersten 20 summary-Einträge — ergeben die Resultate Sinn?

4. **Echte Migration auf einem Sheet** (nur wenn Dry-Run OK):
   ```
   { "action": "admin:migrierMediaQuelle", "callerEmail": "...",
     "dryRun": false, "sheetName": "BWL" }
   ```
   - Frontend-Verifikation: Eine Frage aus BWL im LP-Editor öffnen — zeigt Pool-Info korrekt?
   - Lade eine Frage im SuS-Flow — rendert korrekt?

5. **Rollout auf alle Sheets** (sheetName weglassen):
   ```
   { "action": "admin:migrierMediaQuelle", "callerEmail": "...", "dryRun": false }
   ```

**Rollback bei Problemen:** Backup-Sheets über Google Drive-Versions-Historie zurückspielen ODER manuell Alt-Felder aus Backup kopieren.

### Was Phase 5 NICHT tut
- **Bereits leere `pdfUrl`-Felder** (S124 Data-Loss) werden NICHT rekonstruiert. Das braucht Pool-Re-Import (via existierenden `importierePoolFragen`-Endpoint). Phase-5-Migrator ergänzt nur `pdf`/`bild` aus bestehenden Alt-Feldern.
- Phase 6 (Cleanup: Alt-Felder entfernen) folgt frühestens +2 Wochen nach erfolgreichem Phase-5-Rollout.

---

## Session 125 — MediaQuelle Phasen 0-4 + Editor-Hotfixes (19.04.2026)

### Stand
**Merge-Commits `52dd695` (MediaQuelle Phasen 0-4) + `5f92449` (2 Editor-Hotfixes) auf `main` + Push. Feature-Branches gelöscht. Staging-E2E verifiziert.**

### Editor-Hotfixes (nach Phase 4)
Auf Branch `fix/editor-pool-bugs` — gemergt + gepusht, 2 offene Editor-Bugs aus Staging-Test behoben:

**Hotfix 1 — pdfUrl im Editor erhalten (strukturell S124 Bug 2):**
- `SharedFragenEditor.tsx` — `pdfUrl` State + State-Init aus `frage.pdfUrl`.
- `TypEditorDispatcher.tsx` — `pdfUrl`/`setPdfUrl` als Props.
- `PDFEditor.tsx` — Info-Box zeigt Pool/Drive-/URL-Referenz auch wenn nur `pdfUrl` oder `pdfDriveFileId` gesetzt (nicht nur bei `pdfBase64`). Entfernen-Button räumt alle drei.
- `fragenFactory.ts` — `typDaten.pdfUrl` wird in `pdfQuelleAus`-Input gesteckt + im Output `pdfUrl` geschrieben.
- Verhindert weiteren Data-Loss beim Speichern Pool-importierter PDF-Fragen.
- **Einschränkung:** Bereits gespeicherte Pool-PDFs ohne `pdfUrl` im Backend brauchen Phase-5-Migrator (Re-Import aus Pool) zur Wiederherstellung.

**Hotfix 2 — SVG-Container-Kollaps im Bild-Editor:**
- `HotspotEditor.tsx`, `BildbeschriftungEditor.tsx`, `DragDropBildEditor.tsx` — Container `inline-block` → `block w-full max-w-2xl`, `<img>` → `block w-full h-auto`.
- Pool-SVGs ohne `width`-Attribut waren unsichtbar (height: 0). Analog zu SuS-Seite (S115).
- **Staging-verifiziert:** SVG jetzt 672×400 sichtbar im Editor.

### Staging-E2E (echte Logins, Fragensammlung)
- Hotspot-Filter → 11 Fragen, keine Errors
- Hotspot-Editor öffnen (`bwl_marketing:hotspot01`) → SVG sichtbar (nach Hotfix 2)
- PDF-Editor öffnen (`vwl_konjunktur:neu09`) → Editor clean (Hotfix 1 strukturell deployed, bestehende Frage hat pdfUrl im Backend bereits verloren)
- Bildbeschriftung-Editor öffnen → Pool-SVG geladen
- DragDropBild-Editor öffnen → Pool-SVG geladen
- Vorherige ErrorBoundary-Crashes beim Typ-Filter (S124 mimeType-startsWith) sind Cache-Artefakte vom alten Chunk — mit dem neuen Chunk 0 Errors.

### Staging-E2E (echte Logins, Fragensammlung)
- Hotspot-Filter → 11 Fragen, keine Errors
- Hotspot-Editor öffnen (`bwl_marketing:hotspot01`) → Pool-SVG geladen (240×150)
- PDF-Editor öffnen (`vwl_konjunktur:neu09`) → clean
- Bildbeschriftung-Editor öffnen → Pool-SVG geladen
- DragDropBild-Editor öffnen → Pool-SVG geladen
- Vorherige ErrorBoundary-Crashes beim Typ-Filter (S124 mimeType-startsWith) sind Cache-Artefakte vom alten Chunk — mit dem neuen Chunk 0 Errors.

### Pre-existing Bugs bestätigt (nicht in Scope Phase 4)
- **PDF-Editor-State-Init liest `pdfUrl` aus Pool-Import nicht** (2. S124-Bug). PDF-Upload-Bereich ist leer beim Pool-Import. Fix in Phase 6 (Editor-Umbau auf MediaUpload/State-Init MediaQuelle).
- **SVG-Container kollabiert auf `height: 0`** im Editor wenn SVG nur `viewBox` hat ohne `width`. CSS-Bug, unabhängig von MediaQuelle.

### Phase 4 (Frontend-Verdrahtung)

**Read-Pfad (Dual-Read via `ermittleBildQuelle`/`ermittlePdfQuelle`):**
- `packages/shared/src/utils/mediaQuelleResolver.ts` — neuer Helper (`frage.bild ?? bildQuelleAus(frage)`), 10 Tests.
- `ExamLab/src/components/fragetypen/{Hotspot,Bildbeschriftung,DragDropBild,PDF}Frage.tsx` — alle 4 SuS-Bild/PDF-Komponenten lesen jetzt über Resolver.
  - PDFFrage: 4-Stufen-Fallback-Kette durch MediaQuelle-Switch ersetzt. Drive bleibt Backend-Proxy (CORS-sicher), Inline → base64 direkt, Pool/App/Extern → URL-Load via `mediaQuelleZuIframeSrc`.
  - **Fixt Pool-PDF-Bug (S124):** Pool-Pfade wurden früher durch `toAssetUrl` fälschlich gegen BASE_URL aufgelöst. Jetzt liefert `mediaQuelleZuIframeSrc` für `typ: 'pool'` die korrekte Cross-Site-URL (`https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/...`).
- `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` — PDF-Anzeige + 3 Bild-Stellen (Hotspot/Bildbeschriftung/DragDrop) auf Resolver.
- `ExamLab/src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` — 3 Bild-Stellen: waren früher `<img src={frage.bildUrl}>` ohne `toAssetUrl` → im Druckpreview kaputt bei Pool-Bildern. Jetzt durch `mediaQuelleZuImgSrc(ermittleBildQuelle(frage), toAssetUrl)` unified.

**Write-Pfad (Dual-Write in Factory):**
- `packages/shared/src/editor/fragenFactory.ts` — `case 'hotspot'|'bildbeschriftung'|'dragdrop_bild'` ergänzen `bild: bildQuelleAus({bildUrl})`; `case 'pdf'` ergänzt `pdf: pdfQuelleAus({...})`. Alt-Felder bleiben parallel (Dual-Write). Jede neu gespeicherte Frage hat die kanonische MediaQuelle.

### Nicht umgesetzt in S125 (Follow-up)
- **MaterialPanel** (Task 10.5): nicht kritisch — LP-uploaded Materialien, kein Pool-PDF-Bug. `toAssetUrl` bereits vorhanden. Kann in Phase 5/6 nachziehen.
- **Editor-Interna** (Task 8.2 State-Init, 8.4 TypEditorDispatcher-Props, 9.1-9.5 MediaUpload/MediaAnzeige im Editor-UI): Nicht nötig für Dual-Write. Die Factory ist der Save-Pfad. Editor-UI bleibt mit den bestehenden Komponenten (BildUpload etc.). Phase 6 (Cleanup) räumt das mit auf.
- **`FrageAnhang.quelle` Dual-Write**: Kein Konsument im Frontend liest das Feld aktuell. Apps-Script-Load kann es in Phase 5 ergänzen.

### Verifikation
- `npx tsc -b` grün über alle Commits.
- `npx vitest run` — 412/412 Tests grün (59 neu in `src/__tests__/media/`).
- `main` unverändert; alle 13 Commits auf Feature-Branch.
- **Noch kein Browser-Test.** Nächster Schritt: Feature-Branch auf `preview` pushen, Staging-E2E mit echten Logins (LP + SuS) für Pool-PDF + Bildfragen.

### Umgesetzt (Plan `2026-04-19-mediaquelle-unification.md`)

**Phase 0 — Inventur:**
- `ExamLab/docs/superpowers/plans/2026-04-19-mediaquelle-callsites.txt` — 285 Zeilen Grep-Output aller Alt-Feld-Referenzen.

**Phase 1 — Foundation (TDD, 36 Tests):**
- `packages/shared/src/types/mediaQuelle.ts` — Discriminated Union (`drive | pool | app | extern | inline`) + 5 Type-Guards. 5 Tests.
- `packages/shared/src/utils/mediaQuelleMigrator.ts` — `bildQuelleAus`/`pdfQuelleAus`/`anhangQuelleAus` inkl. Drive-ID-Extraktion aus lh3/drive.google-URLs + mimeType-Inferenz. 19 Tests.
- `packages/shared/src/utils/mediaQuelleUrl.ts` — `mediaQuelleZuImgSrc`/`mediaQuelleZuIframeSrc` mit DI-`AppAssetResolver` (für BASE_URL-Delegation an ExamLab-seitiges `toAssetUrl`). 8 Tests.
- `packages/shared/src/utils/mediaQuelleBytes.ts` — `mediaQuelleZuArrayBuffer` für pdf.js/Audio (inline → base64-decode, rest → fetch). 4 Tests.

**Phase 2 — UI-Komponenten (TDD, 13 Tests):**
- `packages/shared/src/components/MediaAnzeige.tsx` — Universeller Render-Switch per MIME-Type (img/iframe/audio/video/Badge). 7 Tests.
- `packages/shared/src/components/MediaUpload.tsx` — Upload-Dropzone mit Drive-Detection in URL-Input, Fallback auf inline-base64 wenn `services.istUploadVerfuegbar()` false. 6 Tests.

**Phase 3 — Frage-Types erweitert:**
- `packages/shared/src/types/fragen.ts`: neue optionale Felder `bild?: MediaQuelle` (Hotspot/Bildbeschriftung/DragDropBild), `pdf?: MediaQuelle` (PDFFrage), `quelle?: MediaQuelle` (FrageAnhang). Alt-Felder unangetastet — Dual-Write-fähig ohne Breaking-Change.
- Abweichung vom Plan: HotspotFrage/BildbeschriftungFrage/DragDropBildFrage behalten `bildUrl: string` non-optional. Grund: Konservativer, kein TSC-Breaking-Change im Rest-Code. Phase 6 (Cleanup) entfernt Alt-Felder sauber.

### Verifikation
- `npx tsc -b` grün.
- `npx vitest run` — 402/402 Tests grün (49 neu in `src/__tests__/media/`).
- `main` unverändert; alle Änderungen nur auf Feature-Branch.

### Offen
- **Phase 4 — Verdrahtung Frontend** (Tasks 8-11): SharedFragenEditor State-Init auf MediaQuelle, fragenFactory.ts Dual-Write, Editor-Typen (Hotspot/Bildbeschriftung/DragDropBild/PDF) + AnhangEditor auf MediaUpload/MediaAnzeige, SuS-Fragetypen + Korrektur + DruckAnsicht + Demo-Daten.
- Phase 5 — Apps-Script Backend-Migration + Dry-Run-Migrator.
- Phase 6 — Cooling-Off 2 Wochen → Alt-Felder entfernen, mediaUtils-Hotfix zurückbauen.

### Lehren
- **Test-Convention:** `globalThis.fetch` statt `global.fetch` (tsc-strict ohne @types/node in ExamLab-tsconfig).
- **EditorContext-API:** Exportiert `EditorProvider` (nicht `EditorContext.Provider` direkt) — Plan v2 hatte den falschen Test-Setup-Hint. Korrekt: `<EditorProvider config={...} services={...}>`.

---

---

## Session 124 — Bildfragen-Editor-Hotfix + MediaQuelle-Plan (19.04.2026)

### Stand
**`c7fe4c9` Hotfix + `1df6113` Plan-Dokument auf `main`. Plan wartet auf separate Ausführungs-Session.**

### Hotfix (committed)
Bildfragen-Editor (Hotspot/Bildbeschriftung/DragDrop-Bild) crashte bei Klick in der Fragensammlung mit `Cannot read properties of undefined (reading 'startsWith')`.

**Root Cause (via Source-Map-Recovery des Staging-Chunks verifiziert):** `AnhangEditor.tsx:216` iteriert `anhaenge.map` und ruft `istBild(a.mimeType)`. Pool-importierte oder ältere Anhänge haben kein `mimeType`-Feld → `undefined.startsWith('image/')` → Crash.

**Fix:** `packages/shared/src/editor/utils/mediaUtils.ts` — alle fünf MIME-Helper (`istBild/istAudio/istVideo/istEmbed/istPDF` + `maxGroesseFuerMimeType`) akzeptieren `string | undefined | null` und returnen `false` bei falsy.

Staging-E2E: Bildbeschriftung + Hotspot + DragDrop-Bild im LP-Editor geöffnet ohne Crash — alle drei Editors rendern korrekt.

### Zweiter Bug entdeckt (nicht im Hotfix)
PDF-Fragen aus Pool-Import zeigen im Editor keine PDF-Info — sie nutzen `pdfUrl` (Pool-Pfad), der `SharedFragenEditor`-State-Init liest aber nur `pdfBase64` und `pdfDriveFileId`. Daten gehen beim Speichern verloren.

### Fundamentale Analyse statt zweitem Hotfix
Beide Bugs (Bildfragen-mimeType, PDF-Pool-Quelle) haben dieselbe Ursache: Medien werden über parallele Felder (`bildUrl` + `bildDriveFileId`, `pdfBase64` + `pdfDriveFileId` + `pdfUrl` + `pdfDateiname`, Anhang-Felder vermischt) verteilt, ohne einheitliche Quelle. Jede Komponente hat eine eigene "was gilt zuerst?"-Logik.

**Plan:** `ExamLab/docs/superpowers/plans/2026-04-19-mediaquelle-unification.md` (v2, nach Plan-Review überarbeitet).

**Zielzustand:** Ein Discriminated-Union-Type `MediaQuelle` mit 5 Varianten (`drive | pool | app | extern | inline`). Eine `<MediaAnzeige>` für Read-Only, eine `<MediaUpload>` für Editor. PDF.js bekommt `mediaQuelleZuArrayBuffer`. Apps-Script-Migration mit Backup + Dry-Run + One-Sheet-First.

**6 Phasen, 13 Tasks, ≈8h aktive Arbeit**, verteilbar. Dual-Write in Phasen 3–5, Cooling-Off 2 Wochen vor Phase 6 (Alt-Felder-Entfernung). mediaUtils-Hotfix wird in Phase 6 zurückgebaut.

### Lehren
- **Source-Map-Recovery:** Bei minifizierten Staging-Stacktraces liefert `awk 'NR==94 {print substr($0, colStart, 300)}' chunk.js` oft genug Kontext, um die echte Funktion zu identifizieren — billiger als lokales Rebuild mit Sourcemap. Kandidat für `regression-prevention.md` oder eigene Debugging-Rule.
- **Format-Drift als wiederkehrendes Pattern:** S118 (DragDrop), S123 (Auto-Korrektur), S124 (mimeType, PDF-Quelle) haben alle dasselbe Schema: inkrementell eingeführte Felder ohne Single-Source-of-Truth → silent-wrong + Crashes. Generische Lösung = MediaQuelle-Pattern für Medien, analoger Ansatz für andere Multi-Feld-Zustände (S118 `dragdropBildUtils.ts` war schon ein erster Schritt).
- **Plan-Reviewer-Loop lohnt sich:** Der Agent fand 3 Blocker + 7 Major in Plan v1, u.a. komplett falsche File-Pfade (`packages/shared` ist Repo-Root-Sibling, nicht unter `ExamLab/`). Ohne Review hätte die Execution-Session mit 15+ Min "Cannot find module" begonnen.

---

## Session 123 — LP-Composer-Navigation + Korrektur-Assets + DragDrop-Format (19.04.2026)

### Stand
**Merge `59b4413` auf `main` + Push. Staging-E2E verifiziert (Tests 1-5, 8, 9).**

4 Bugs aus User-Report (Staging 19.04.2026) gebündelt gefixt:

1. **LP "Bearbeiten"/"Duplizieren"/"Neue Prüfung" tat nichts** — `useLPRouteSync` las `:configId` nie aus URL → `store.aktiveConfigId` blieb null → Composer öffnete nie. Fix: URL-Segment parsen + `'neu'`-Sentinel. ~70 Zeilen in `useLPRouteSync.ts`.
2. **Einführungsprüfung F7 dritte Lücke zeigte `{{3}}`** — Daten 1-basiert, Renderer 0-basiert → `{{3}}` → `luecken[3]` = undefined → Text-Fallback. Fix: `einrichtungsFragen.ts` + `einrichtungsUebungFragen.ts` auf 0-basiert.
3. **LP Auswertung: Bilder/PDF/DragDrop-Zuordnungen unsichtbar** — (a) `KorrekturFrageVollansicht.tsx` nutzte `frage.bildUrl` roh statt `toAssetUrl()` (S115 hatte nur SuS-Komponenten gefixt). (b) `pdfUrl`-Fallback fehlte in `PDFAnnotationAnzeige`. (c) **Kritisch**: `zuordnungen[zone.id]` erwartete `{zoneId:label}`, SuS-Store speichert `{label:zoneId}` (S118-Format). Gleicher Bug in `autoKorrektur.ts::korrigiereDragDropBild` → **DragDrop-Bild bei summativen Prüfungen wurde immer als falsch bewertet**. Fix: Neue Utility `utils/dragdropBildUtils.ts` mit `labelsInZone()`/`zoneKorrektBelegt()`. S118-Refactor ist jetzt durchgezogen.
4. **Korrektur-Zurück-Button Full-Reload** — `KorrekturDashboard.tsx:119` nutzte `window.location.href`. Fix: `navigate()` (SPA).

### Verifikation
- TSC + 353/353 Unit-Tests grün + Production-Build grün.
- Staging-E2E (echte Logins): Tests 1-5, 8, 9 durch Claude-in-Chrome bestätigt. Tests 6+7 (Auswertung Assets/DragDrop-Anzeige) per Code-Review + Unit-Tests abgedeckt (kein abgegebener Datensatz im Staging).

### Lehren (Rule-Kandidaten)
- **Format-Drift-Prävention** (`code-quality.md`): Bei Antwort-Daten-Format-Änderungen IMMER alle Konsumenten auflisten (`grep -r "typ: '<fragetyp>'"` + alle utils/*-Auto-Korrektur-Pfade + Korrektur-Anzeige). Single-Source-of-Truth als shared Utility (wie `dragdropBildUtils.ts`) statt duplizierter Reverse-Lookup-Logik.
- **Composer-URL-Sync** (`regression-prevention.md`): Neue URL-Route-Parameter für Composer-State brauchen einen Sync-Hook-Eintrag, der den Derivat-Store-State (`ansicht`, `aktiveConfigId`) setzt. Sonst: silent no-op bei URL-Änderung.
- **Asset-URLs in Korrektur-Pfaden** (`bilder-in-pools.md` Abschnitt G): `toAssetUrl()` muss nicht nur in SuS-Rendering-Komponenten verwendet werden, sondern auch in LP-Korrektur-Ansichten (`KorrekturFrageVollansicht.tsx`).

### Entdeckt, aber nicht gefixt (eigener Task)
**Interaktive SuS-Vorschau im Composer crasht** mit `useFrageMode muss innerhalb eines FrageModeProvider verwendet werden`. Pre-existing, Dateien in S123 nicht angefasst. Als separater Fix-Task im Chip gespawnt.

---

## Session 122 — Phase 2 Backend-Security + Server-Korrektur-Endpoint (19.04.2026)

### Stand
**Phase 2 auf `feature/ueben-security-korrekturendpoint` — wartet auf Staging-Deploy + User-Test.**

Löst den Haupt-Bug aus S119: `lernplattformLadeFragen()` lieferte Lösungsdaten 1:1 an SuS. Neuer Server-Korrektur-Endpoint erlaubt weiterhin sofortiges Feedback im selbstständigen Üben, ohne dass je eine Lösung im SuS-Network-Tab landet.

### Umgesetzt — 11 Tasks auf Branch `feature/ueben-security-korrekturendpoint`

**Backend (`apps-script-code.js`):**
| Task | Inhalt |
|------|--------|
| 6 | `shuffle_` Fisher-Yates Helper |
| 7 | `bereinigeFrageFuerSuSUeben_` — Löschung aller 20-Typen-Lösungsfelder + Mischung für 8 Typen |
| 8 | `lernplattformLadeFragen` bereinigt SuS-Path + Adapter schickt `email` |
| 9 | `pruefeAntwortServer_` + `pruefeFibuAntwortServer_` — 1:1 Port aus `korrektur.ts` |
| 10 | `lernplattformPruefeAntwort` Endpoint + `ladeFrageUnbereinigtById_` + `doPost`-Routing |

**Security-Fixes (nach Code-Review, C1..C6 + I1):**
- **Auth-Bypass-Fix** (C-1/C-2): `lernplattformValidiereToken_` + `istGruppenMitglied_` — Email nur aus validem Token, nicht aus Request-Body. Ohne Token: SuS-Pfad, niemals LP.
- **Legacy-Antwort-Normalizer** (C-3): `normalisiereAntwortServer_` 1:1 Port aus `normalizeAntwort.ts` (Aliases multi/tf/fill/calc/sort/open/zeichnen/bilanz/gruppe).
- **T-Konto Saldo-Leak** (C-4): `saldo` + `anfangsbestand` (wenn nicht vorgegeben) entfernt.
- **MC `erklaerung`-Leak** (C-5): `optionen[].erklaerung` in `bereinigeFrageFuerSuS_` gelöscht.
- **IDOR + Familie-Gruppen** (C-6): `ladeFrageUnbereinigtById_(frageId, gruppe)` — Familie-Sheet-Support + Gruppen-Mitgliedschaft-Validierung.
- **Rate-Limit** (I-1): 30 → 10/min auf `lernplattformRateLimitCheck_`.

**Frontend (Tasks 12-16 via Subagent-Driven-Development):**
| Task | Inhalt |
|------|--------|
| 12 | `PruefResultat`-Type + `uebenKorrekturApi.pruefeAntwortApi` Service |
| 13 | `uebungsStore.pruefeAntwortJetzt` async, neue States `speichertPruefung`/`pruefFehler`/`letzteMusterloesung` |
| 14 | `useFrageAdapter` propagiert neue States |
| 15 | `QuizNavigation` Spinner + `aria-busy`; `UebungsScreen` `role="alert"`-Retry-Banner |
| 16 | `uebenSecurityInvariant.test.ts` Snapshot-Test gegen 11-Felder-Sperrliste |

**Selbstbewertung-Fix (Subagent-Risk-Report):**
Bei Freitext/Visualisierung/PDF/Audio/Code war `frage.musterlosung` nach Bereinigung leer — `SelbstbewertungsDialog` nutzt jetzt `letzteMusterloesung` aus Store (kommt vom Server bei Prüf-Call). `handlePruefen` ruft für alle Typen `pruefeAntwortJetzt`; `useEffect` öffnet den Dialog wenn die Musterlösung eintrifft. Fallback auf `frage.musterlosung` für Demo-Modus.

### Verifikation (lokal)
- tsc -b: ✅
- Tests: ✅ 353/353 (39 Files, 11 neue Tests)
- Build: ✅
- Subagent-Reviews: Code-Quality + Spec-Compliance durchgelaufen, Security-Findings adressiert.

### ⚠️ Kritisch: Phase 2 MUSS atomisch deployen
- Phase-1-Normalizer rekonstruiert `paare[]` NICHT aus `linksItems/rechtsItems` (Paarung = Lösung). Client auf Phase-1-Code mit Phase-2-Backend → Zuordnung-Korrektur immer `false`.
- **Lösung:** Frontend (Tasks 12-16) + Backend (Tasks 6-10) müssen gleichzeitig live gehen. Kein partial-Merge.
- Spec-Dokument ergänzt.

### Apps-Script-Deploy (User)
**Erforderlich vor Merge zu main.** User öffnet Apps-Script-Editor, kopiert `apps-script-code.js`, erstellt neue Bereitstellung.

### Hotfixes nach Staging-E2E-Test (chronologisch)

| Commit | Inhalt |
|--------|--------|
| `7553777` | DragDrop Labels `[object Object]` — `Object.assign({}, "string")` erzeugte Char-Objekt; Fix: `typeof !== 'object'` durchreichen |
| `f92a931` | `frage.musterlosung` leer für SuS → Komponenten zeigen nichts; Fix: `UebungsScreen` patcht `baseFrage.musterlosung = letzteMusterloesung` zentral; + `naechsteFrage`/`vorherigeFrage`/`ueberspringen` resetten `letzteMusterloesung`+`pruefFehler` (vermeidet Vor-Anzeige der vorigen Lösung) |
| `8b5aebf` | Zuordnung zeigte nur Fragetext — Backend hatte `paare[]` durch `linksItems`/`rechtsItems` ersetzt, Frontend liest `paare[]`; Fix: Backend behält `paare[]` und mischt nur die `rechts`-Werte (Paarung verschleiert, UI unverändert kompatibel) |
| `2e287df` | Speed v1: `fachbereich`-Hint vom Client mitgeschickt → Server priorisiert 1 Tab statt 4; CacheService 1h für gefundene Frage; Spalten-First-Lookup (id-Spalte separat, Object-Mapping nur bei Hit) |
| `867b21c` | Speed v2: Pre-Warm Cache beim Initial-Load — `lernplattformLadeFragen` schreibt alle Fragen via `cache.putAll()` (1h TTL), spätere Prüf-Calls finden sie sofort |
| (latest) | UX: Spinner-Text „Korrektur lädt …" statt nur „Prüfe…" — kommuniziert Server-Roundtrip |

### Speed-Befund (aus Apps-Script-Logs, 19.04.2026)
- Pro Prüf-Klick: **2 doPost-Calls** = ca. 4s + 2s ≈ **5.9s gesamt**
- Auch reine `doGet`s dauern **1.1-2.8s** — Apps-Script-Latenz allein ist >1s, **plattform-inhärent**
- Pre-Warm-Cache + fachbereich-Hint sparen Sheet-Reads (~75%) — aber nicht den HTTPS-Roundtrip
- **Untere Grenze pro Apps-Script-Call: ~1.5-2s** (HTTPS-Handshake + V8-Container-Init + Spreadsheet-Auth)
- **Akzeptiert als Tradeoff für Sicherheits-Architektur.** User plant langfristig Backend-Migration auf Cloud-Run/Vercel-Edge → echte Lösung dort.

### Bekannte offene Punkte (eigene Sessions)
- **Bildfragen-Pool-Audit**: Beveridge-Frage hat falsche Korrektur — siehe `memory/project_bildfragen_qualitaet.md`. Generelles Inhalts-Audit aller Pool-Fragen empfohlen.
- **Backend-Migration**: Apps-Script-Latenz ist Plattform-Limit. Echte instant-UX nur durch Edge-Backend.

### Verifikation nach Hotfixes (Staging mit echten Logins)
- ✅ MC: Server-Korrektur → „Richtig!"
- ✅ R/F: Server-Korrektur → „Richtig!"
- ✅ DragDrop: Labels mit echten Texten + Server-Korrektur + Musterlösung
- ✅ Zuordnung: 6 Paare mit Dropdowns, Server-Korrektur
- ✅ Network-Schema: `{success, korrekt, musterlosung}` — keine Lösungs-Leaks
- ✅ Vitest: 353/353 grün
- ✅ tsc + build clean
- ⚠️ Speed: 4-6s pro Prüf-Klick (siehe oben) — UX-Hinweis „Korrektur lädt …" mildert

### Offene Schritte für S122-Abschluss
- [ ] Merge `feature/ueben-security-korrekturendpoint` → `main`
- [ ] Branch-Cleanup
- [ ] Lehre in `rules/` (Apps-Script-Latenz dokumentieren, Pool-Audit-Trigger)

---

## Session 121 — Phase 1 Frontend-Defensive (19.04.2026)

### Stand
**Phase 1 auf `preview` (Staging) — wartet auf LP-Freigabe, dann Merge zu `main`.**

Vorbereitung für das grosse S122-Security-Hardening (eigener Endpoint für Übungs-Korrektur). Phase 1 härtet den Client defensiv, damit während Phase-2-Deploy (wenn das Backend plötzlich Lösungsfelder wegfiltert) keine White-Screen-Race entsteht.

### Umgesetzt — 4 TDD-Tasks auf Branch `phase1/ueben-defensive-normalizer`

| Task | Normalizer | Commit |
|------|-----------|--------|
| 1 | `normalisiereMc` — `optionen[].korrekt` default `false`, `optionen` fallback `[]` | `97f6766` |
| 2 | `normalisiereRichtigFalsch` — `aussagen[].korrekt` default + `aussagen` fallback | `1c4ee54` |
| 3 | `normalisiereSortierung` + `normalisiereZuordnung` — `elemente[]`/`paare[]` fallbacks + `linksItems`/`rechtsItems` Rekonstruktion | `4a0f7d4` |
| 4 | `Array.isArray`-Guards in **allen 14 Array-Cases** von `korrektur.ts::pruefeAntwort` + Fail-closed `length > 0` gegen Vacuous-Truth | `b778685` |

**Begründung Fail-closed `length > 0`:** `[].every(…)` liefert per JS-Spec `true`. Ohne den Guard würde ein SuS-Payload ohne Lösungs-Array als „korrekt" bewertet. Fail-closed `false` ist sicher.

### Verifikation
- tsc -b: ✅
- Tests: ✅ 342/342 (36 Files, +17 neue Tests aus Tasks 1-4)
- Build: ✅
- Subagent-Reviews: Alle 4 Tasks via Spec-Compliance-Review + Code-Quality-Review approved (1× Critical nie, 1× Important nie, einige Minor advisory)
- Browser-Verifikation auf Staging: **steht aus** (Phase 1 hat keine sichtbare UI-Änderung — es geht um Crash-Robustheit. Smoke-Test: SuS öffnet Übung, nichts crasht)

### Apps-Script
**Nicht geändert — kein Deploy nötig.**

### Plan
Phase 2 (Backend-Bereinigung + neuer Endpoint + Async-Refactor) kommt nach Phase-1-Merge zu main auf Branch `feature/ueben-security-korrekturendpoint`. Spec + Plan bereits geschrieben (`docs/superpowers/specs/` + `docs/superpowers/plans/`).

### Offene Schritte für S121
- [ ] Staging-Verifikation (Smoke-Test SuS-Übung)
- [ ] LP-Freigabe
- [ ] Merge `phase1/ueben-defensive-normalizer` → `main`
- [ ] Branch-Cleanup (lokal + remote)

---

## Session 120 — S118-Staging-Verifikation + R/F-Dedup-Followup (19.04.2026)

### Stand
**Staging-Verifikation der S118-Restfixes mit echten Logins (LP + SuS) abgeschlossen:**

| Fix | Ergebnis |
|-----|---------|
| Bildbeschriftung Bild-Kollaps | ✅ 580×362 px, Labels platzierbar |
| Hotspot Bild-Kollaps | ✅ Marker platzierbar (Beveridge-Kurve) |
| DragDrop Mehrfach-Labels pro Zone | ✅ Zone A hält 2 Labels |
| R/F Fragetext-Dedup (UebungsScreen) | ✅ Code-Fix wirkt |

**Neuer Follow-up-Fix: `fix/rf-fragetext-dedup-einzelaussage` (Commit `2375e1b`)**
- Der S118-Fix adressierte den UebungsScreen. Bei Pool-Fragen mit genau 1 Aussage, deren Text identisch zum Fragetext ist, rendet `RichtigFalschFrage.tsx` den Text trotzdem zweimal (Fragetext-Box + Aussagen-Liste).
- Fix: Dedup-Guard `fragetextIstEinzelAussage` in `RichtigFalschFrage.tsx:14`. Wirkt in Übungs- UND Prüfungs-Modus.
- Konkret beobachtet in Pool-Frage "Stellensuchende und Arbeitslose bezeichnen dieselbe Personengruppe" (VWL Arbeitslosigkeit & Armut).
- 3 neue Vitest-Tests in `RichtigFalschFrage.test.tsx`.

### Verifikation
- TypeScript: ✅ tsc -b
- Tests: ✅ 328/328 (33 Files, +3 neue)
- Build: ✅
- Browser auf Staging: Nach Deploy zu prüfen (preview advanced auf `2375e1b`).

### Apps-Script
**Nicht geändert — kein Deploy nötig.**

### Lehre für `bilder-in-pools.md` G-Sektion
R/F-Pool-Daten-Qualität: Wenn eine R/F-Frage nur 1 Aussage hat, sollte diese nicht identisch zum Fragetext sein. Fragetext = allgemeine Frage ("Welche Aussage ist korrekt?"), Aussagen = konkrete Behauptungen. Bei Einzelaussagen-Fragen kann die Aussage direkt als Fragetext dienen, ohne doppelte Box. Der neue Dedup-Guard in `RichtigFalschFrage.tsx` fängt das ab, idealerweise bereinigen wir das langfristig in den Pool-Daten.

---

## Session 119 — Merge A + B + Cleanup S118-Reste (18.-19.04.2026)

### Stand
**Alle drei Bundles auf `main` gemergt + gepusht:**
- Bundle A (S116) + A2-Bugfixes (S118) — Merge-Commit `ec38944` (18.04.)
- S119-Cleanup (Lückentext-Placeholder + rules/) — Merge-Commit `b49da34` (18.04.)
- Bundle B (S117) — Merge-Commit `5cddf2e` (19.04., nach User-Freigabe)

**`main` ist damit komplett auf dem Stand der 18.04.-Planungsrunde. Kein offener Branch mehr.**

### Umgesetzt

1. **Merge Bundle A → main:**
   - CI-Checks grün (tsc, 303/303 Tests, Build)
   - `--no-ff` Merge mit Context-Commit
   - `main` → origin

2. **Rebase Bundle B auf neue main:**
   - 3 Konflikte aufgelöst:
     - HANDOFF.md (2×): main-Version behalten, B-Infos kommen in S119-Update
     - LPStartseite.tsx: doppelter `lazyMitRetry`-Import dedupliziert
     - utils/lazyMitRetry.ts: main-Version behalten (robuster — Generic + sessionStorage-Loop-Schutz statt B-Version ohne Loop-Schutz)
   - Nach Rebase: 325/325 Tests grün (33 Files; +22 Tests durch Bundle B)
   - Force-Push `feature/bundle-b-ux-systemregeln` + `preview`

3. **Lückentext-Placeholder-Kosmetik (S118-Nachzügler):**
   - `LueckentextFrage.tsx:132`: placeholder `Lücke ${lueckenId}` (zeigte `Lücke luecke-0`) → `Lücke ${parseInt(match[1], 10) + 1}` (zeigt `Lücke 1`)

4. **Apps-Script `korrekteAntworten`-Audit:**
   - Normalizer-Fallback bleibt relevant: schützt gegen unvollständig gespeicherte Sheets-Einträge
   - **Security-Hinweis (nicht in S119 gefixt):** `lernplattformLadeFragen()` in `apps-script-code.js:7082` gibt `korrekteAntworten` 1:1 an SuS zurück (kein SuS-Filter wie in `ladePruefung()`). Im Übungsmodus sind Musterlösungen im Network-Tab sichtbar. Da Übungen nicht summativ sind, ist das bisher toleriert — für selbstgesteuerte Maturaprüfungs-Vorbereitung müsste ein eigener Korrektur-Endpoint her (separater Auftrag, Backend-Redesign)

5. **Lehren aus S118 in rules/ integriert:**
   - `code-quality.md`: Abschnitt "Defensive Normalizer für Backend-Daten" mit `normalisiereLueckentext`-Muster
   - `deployment-workflow.md`: "Staging-Deploy-Queue hängt" — leerer Commit als Retrigger
   - `regression-prevention.md`: "Button tut nichts"-Debugging via `window.onerror`

### Offene Punkte nach S119
- **Staging-Verifikation S118-Restfixes (live auf main):** DragDrop Mehrfach-Labels, R/F Fragetext-Dedup, Bildbeschriftung/Hotspot Bild-Kollaps — User-Verify ausstehend (wenn ein Fall noch bricht, eigener Bugfix).
- **Backend-Security `lernplattformLadeFragen()`:** eigener Auftrag für separate Session (siehe oben).

### Verifikation
- TypeScript: ✅ tsc -b (A-Merge + S119 + B-Merge)
- Tests: ✅ 303/303 (main vor B) · 325/325 (main nach B-Merge)
- Build: ✅
- Browser: User hat Bundle B auf Staging freigegeben vor Merge zu main

### Apps-Script
**Nicht geändert — kein Deploy nötig.**

---

## Session 118 — A2-Fragetypen-Bugfixes aus Staging-Test (18.04.2026)

### Stand
**Branch `fix/a2-fragetypen-uebung` auf `preview` gepusht und live verifiziert.** 303/303 Tests grün, tsc clean, Build OK. **Mergt bei Freigabe zu `main`** (zusammen mit Session 116 Bundle A).

Parallel-Branch: `feature/bundle-b-ux-systemregeln` (Session 117) liegt noch von `main` abgezweigt und wartet auf A2-Merge → dann rebase + Browser-Test.

### Umgesetzt — 7 Bugs aus User-Staging-Test

Commits auf `fix/a2-fragetypen-uebung`:
- `b6129ee` Lückentext-Crash bei fehlender `korrekteAntworten` (live verifiziert)
- `c30795f` Lückentext-Prüfen-Button + DragDrop Mehrfach-Labels
- `2c57c37` 5 Fragetypen-Bugs (R/F, Lückentext, Zuordnung, Bildbeschriftung, DragDrop)

**Bugfixes (chronologisch):**

1. **R/F Fragetext doppelt** — `UebungsScreen.tsx` rendert den fragetext zusätzlich zur Fragetyp-Komponente, die ihn schon zeigt. Fix: UebungsScreen überlässt das Rendering den Fragetyp-Komponenten (analog Prüfungs-Modus / `Layout.tsx`).

2. **Lückentext keine Input-Felder** — Pool-Daten nutzen `{0}` als Platzhalter, Regex erwartete nur `{{0}}` → nie gematcht → nur Plaintext. Regex auf beide Formate erweitert (`{\d+}|{{\d+}}`). Fragetext-Duplikat wird unterdrückt wenn `fragetext === textMitLuecken`.

3. **Zuordnung Dropdown-Blocker + Lösungs-Leak** — `disabled={istVergeben}` + `✓`-Suffix blockierte N:1-Zuordnungen (6 Behauptungen, 2 Kategorien) und verriet bisherige Wahl. Entfernt. `rechteOptionen` dedupliziert + immer gemischt (Reihenfolge ≠ Hinweis).

4. **Bildbeschriftung / DragDrop / Hotspot: Bild 0×0** — Pool-SVGs haben nur `viewBox`, kein `width`/`height` → Container `w-fit` kollabierte auf 0. Container umgestellt auf `block w-full max-w-2xl`, Bild `w-full h-auto` → streckt auf Container, Höhe folgt Aspect-Ratio.

5. **Lückentext-Mapping** — Pool-Converter vergibt `genId()` (Zufalls-ID) als Lücken-ID, aber Platzhalter `{0}` liefert Key `"0"`. Keys matchten nie. Fix: Mapping Platzhalter-Nummer → `luecken[index].id`, Input schreibt unter echter Lücken-ID.

6. **DragDrop nur 1 Label/Zone** — UI schrieb `zuordnungen[zoneId] = label` (überschreibt), aber `korrektur.ts` erwartet `zuordnungen[label] = zoneId`. UI auf korrektes Schema umgestellt → Zone hält N Labels vertikal gestapelt, Klick auf Label entfernt nur dieses.

7. **Lückentext "Antwort prüfen" tat scheinbar nichts** — Live-Debug (window.onerror + click) zeigte echten Crash: `TypeError: Cannot read properties of undefined (reading 'some')` in `korrektur.ts`. `luecken[].korrekteAntworten` war undefined → silent geswallowed. Fix in 2 Lagen:
   - **`fragetypNormalizer.ts`**: neue `normalisiereLueckentext` stellt sicher dass `korrekteAntworten` immer ein Array ist (Fallback auf `korrekt`/`antwort`/`alternativen`).
   - **`korrektur.ts`**: defensive Array-Checks für `frage.luecken` und `l.korrekteAntworten` — kein Crash bei fehlenden Daten.

### Verifikation (Staging, echte Logins)
- ✅ Lückentext: Eingabe → "Antwort prüfen" klicken → Feedback ("Leider falsch" + Musterlösung) + "Weiter"-Button (Screenshot dokumentiert).
- ✅ Zuordnung: Dropdown klappt, alle Optionen wählbar (User bestätigt).
- ⏸ DragDrop Mehrfach-Labels: vom User noch nicht live getestet (deployed, wartet auf Verify).
- ⏸ R/F Fragetext doppelt, Bildbeschriftung Bild-Fix, Hotspot: deployed, User-Verify ausstehend.

### Offene Kleinigkeiten
- Lückentext-Placeholder zeigt `Lücke luecke-0` statt `Lücke 1` — Kosmetik, kann in eigenem Commit.
- Korrektur der Lückentext-Daten: Backend-seitig scheint `luecken[].korrekteAntworten` nicht konsistent zu kommen. Die defensive Lösung auf Client-Seite fängt das ab (Frage wird als falsch bewertet), aber für echte Pool-Fragen wäre es wünschenswert, den Datenfluss Pool→Fragenbank→Apps-Script→Client zu auditieren und sicherzustellen dass `korrekteAntworten` mitkommt.

### Apps-Script
**Nicht geändert — kein Deploy nötig.**

### Lehre (Kandidaten für rules/)
- **"Button tut nichts"-Debugging = Live-Browser-Debug (`window.onerror` abonnieren + klicken).** Silent-swallowed Exceptions sind genau bei React-EventHandlers häufig — Ohne window.onerror wird ein TypeError vom Klick nicht sichtbar, wirkt wie "keine Reaktion". Regel: bei "macht nichts"-Bugreports IMMER zuerst `window.onerror`-Patch setzen, dann klicken.
- **Defensive Normalizer für Backend-Daten.** Wenn das Backend Felder inkonsistent liefert (optional, umbenannt, gefiltert), lieber im `fragetypNormalizer` alle Varianten einfangen statt im UI-Code. Siehe `normalisiereLueckentext` als Muster.
- **Staging-Deploy-Queue.** Zwei schnell hintereinander gepushte Commits führten zu "Deploy hängt" — der erste lief, der zweite blieb aus. Leerer Trigger-Commit (`git commit --allow-empty`) setzt den Workflow neu in Gang. Bei verdächtig altem `last-modified` auf Staging → leerer Commit als Retrigger.

---

## Session 117 — Bundle B UX-Systemregeln (18.04.2026)

Parallel-Branch `feature/bundle-b-ux-systemregeln` (von main abgezweigt, NICHT auf A2 aufgebaut). Komplett implementiert, gepusht. Wartet auf A2-Merge → Rebase → Browser-Test.

Siehe Branch-HANDOFF (auf `origin/feature/bundle-b-ux-systemregeln`) für Details. Kurzfassung:

- B-2 Globaler Zurück-Button (`useGlobalZurueck`-Hook)
- B-3 `useTabAutoScroll`-Hook (Auto-Scroll bei Maus nahe Rand, respektiert prefers-reduced-motion)
- B-4 Settings/Hilfe öffnen ohne Re-Mount (Favoriten nutzt Store-Flag statt Route-Change)
- B-5 TabBar-Audit (keine Migration nötig — TabBar wird bereits konsistent genutzt)
- Shared Extracts: `utils/lazyMitRetry.ts` + `ui/LazyFallback.tsx`

326 Tests grün, tsc clean. Bundle-A-Branch (A1+A2) **unabhängig** — der gleiche `lazyMitRetry` wurde auf beiden Branches parallel extrahiert, Merge könnte einen trivialen Konflikt geben (gleicher Inhalt, doppelte Datei-Creation).

---

## Session 116 — Bundle A: Dynamic Import Fix + Übungsmodus-Korrektur-Flow (18.04.2026)

### Stand
**Auf `preview` gepusht (zwei Branches):**
- `fix/dynamic-import-retry` (A1) — bereits am 17.04. zu preview gepusht
- `feature/ueben-zwischenstand-flow` (A2) — pusht jetzt gebündelt mit A1 zu preview

**Wartet auf Staging-Test mit echten Logins (LP + SuS).** Nach Freigabe: Merge zu `main`.

### Umgesetzt

**A1 — Dynamic Import Auto-Retry (Production-Blocker):**
- Neu: `src/utils/lazyMitRetry.ts` (sessionStorage-Loop-Schutz)
- 5 Stellen umgestellt: Router (App, LoginScreen, LPStartseite, Favoriten),
  LPStartseite (5 Sub-Komponenten), FrageText (CodeBlock),
  SuSStartseite (AppUeben)
- Behebt "Failed to fetch dynamically imported module" auf Production nach
  Deploy mit neuem Chunk-Hash (gemeldet von User für SuS-Login App-Chunk
  und LP-Login Favoriten-Chunk)

**A2 — Übungsmodus-Korrektur erst nach "Antwort prüfen" (6 Bugs):**
- Root Cause: Üben-Adapter rief `beantworteById` sofort bei jeder Eingabe →
  Frage wurde gesperrt + sofort als falsch markiert
- Neuer Flow (Pool-Pattern): Eingabe → Zwischenstand → "Antwort prüfen"-Klick →
  bei auto-typen Korrektur+Musterlösung, bei selbstbewerteten Typen
  Musterlösung+3 Buttons (Richtig/Teilweise/Falsch)
- Store: 2 neue Actions `pruefeAntwortJetzt`, `selbstbewertenById`
- Adapter (`useFrageAdapter`): Üben-`onAntwort=speichereZwischenstandById`,
  `disabled=istGeprueft`, neue Felder `onPruefen`, `onSelbstbewerten`,
  `hatZwischenstand`, `istGeprueft`. Pruefungs-Modus unverändert.
- Neue Komponente: `SelbstbewertungsDialog`
- `QuizNavigation`: violetter "Antwort prüfen"-Button hinzugefügt
- `UebungsScreen`: orchestriert Flow + Dialog-State
- Helper `istSelbstbewertungstyp` aus `korrektur.ts` exportiert
- Spot-Fixes: MC `OPT-0)` → `A)` aus Index, Bildbeschriftung `w-28` → `w-auto min-w-120 max-w-220`

### Verifikation
- TypeScript: ✅ tsc -b
- Tests: ✅ 303/303 (Vitest)
- Build: ✅
- Browser-Smoke (Vite dev): ✅ alle neuen Module werden serviert
- **Browser-E2E mit echten Logins: STEHT AUS (User-Test auf Staging)**

### Lehre (für `bilder-in-pools.md` G-Sektion zu ergänzen)
Übungsmodus muss konsequent vom Pruefungs-Modus getrennt werden — der Adapter
muss **per `mode`-Check** unterschiedlich onAntwort-Verhalten zeigen. "Sofort
korrigieren bei jeder Eingabe-Änderung" ist Prüfungs-Verhalten und macht
Üben-Modus unbenutzbar. Der existierende `speichereZwischenstandById` war
schon gestubbed aber nicht verlinkt — Stubs in Stores immer durch Code
referenzieren oder löschen.

### Plan-Dokumentation
`ExamLab/docs/superpowers/plans/2026-04-18-uebungsmodus-korrektur-flow.md`
(am 17.04. geschrieben; Implementation deckt Tasks 1-6 ab; Task 7 Audit
zeigte: keine zusätzlichen Fragetyp-Anpassungen nötig, weil der Adapter-
Refactor zentral wirkt).

---

## Session 115 — Grosse Polish-Session (16.04.2026 → main)

### Stand
**Komplett auf `main` gemergt + gepusht.** Alle Bugs aus dem User-Staging-Test gefixt und auf Staging verifiziert.

### Umgesetzt (chronologisch)

**1. Blocker-Bug Fix "Prüfung/Übung starten"**
- Root Cause: `LPStartseite.tsx` `<a href={pathname}?id={c.id}>` auf den Karten — nach React-Router-Refactor landet Klick auf LPStartseite statt App.tsx, aber LPStartseite las nur `?ids=` (Multi), nicht `?id=` (single).
- Fix: `?id=` Handling ergänzt, rendert `DurchfuehrenDashboard`.
- Commit `e076c7c`

**2. Phase 4 Header-Cleanup**
- Feature-Flag `VITE_ENABLE_NEW_HEADER` entfernt, neuer Header permanent aktiv.
- Alte `LPHeader.tsx` + `UebenTabLeiste.tsx` (+Test) gelöscht.
- Inline-Fallback-Header-Code in SuSStartseite/AppShell/KorrekturEinsicht entfernt.
- Favoriten-Klick → Ziel-L3 direkt (Spec §2.6): `/{typ}?id={ziel}` statt `/{typ}/{ziel}` → öffnet DurchfuehrenDashboard statt Composer.
- Commit `e0a6c39`

**3. TabKaskade Super-Chip + Hover-Cascade**
- Pro L1-Gruppe eigener Super-Chip-Container (slate-100/slate-900, rounded-lg, p-1), 8px Gap zwischen.
- Einheitliche States: inaktiv (plain) / parent (slate ⌐) / aktiv (violet ⌐) / hover (slate ⌐).
- `⌐`-Form = border-l-2 + border-b-2 + rounded-bl-lg → "Ordner-Lasche"
- Hover-Cascade: Non-aktives L1 hover → L2 inline erscheint. React useState (nicht CSS-only), damit Tests DOM-basiert prüfen können.
- L3-Dropdown erscheint bei L2 aktiv ODER L2 hover.
- L3Dropdown-Styling an neue Tab-Optik angepasst.
- Commits `62a5b2e`, `3dce947`, `6cdd4e8`

**4. Admin-Cleanup + Toast**
- `AdminKindDetail.tsx` + `AdminThemaDetail.tsx` gelöscht (unreachable Entry-Points, Bundle 13 I Follow-up).
- `AdminDashboard.tsx` vereinfacht.
- Toast-Banner für "Kurs nicht gefunden" (statt console.warn).
- FarbenTab kompakter: text-sm/text-xs, kleinere Farbfelder.

**5. SuS /pruefen Empty-State**
- `ladeKorrekturenFuerSuS`: Array.isArray-Check statt `?? null`. null = echter Fehler, [] = keine Korrekturen. Verhindert "Korrekturen konnten nicht geladen werden"-Fehler wenn SuS keine hat.
- Commit `38c9d8d`

**6. Design-System Utilities + Unification**
- `.settings-card` (index.css): dezenter Hover-Rand für Einstellungs-Kacheln.
- AllgemeinTab: 6× `.settings-card` statt duplizierter Klassen.
- FarbenTab/MitgliederTab/FaecherTab: Listen-Zeilen bekommen `hover:bg-slate-50 dark:hover:bg-slate-700/30`.
- SuS Dashboard Chip: inaktive Chips haben jetzt Hover-Feedback (Rand + BG).
- Commit `d5cb11b`, `08b3259`

**7. Asset-URL-Bug (Bilder + PDFs laden nicht)**
- Root Cause: Daten-Dateien (einrichtungsPruefung.ts etc.) nutzen `./materialien/` und `./demo-bilder/` (relativ). Bei SPA-Route wie `/sus/ueben/einrichtung-pruefung` löst der Browser relativ gegen die Route → falscher Pfad → GitHub Pages SPA-Fallback liefert `index.html` → im PDF-iframe lädt die App selbst (= "SuS-Üben-Website im PDF-Fenster").
- Fix: Neue Utility `utils/assetUrl.ts` mit `toAssetUrl(url)` absolutiert relative Pfade gegen `BASE_URL`. Angewendet in `MaterialPanel.tsx` + 4 Fragetypen (Hotspot, Bildbeschriftung, DragDrop, PDF).
- Commit `7911a61`

**8. Einrichtungsprüfungs-Fallback**
- `App.tsx` hatte Fallback auf `einrichtung-uebung` wenn Backend Config nicht kennt. Einrichtungsprüfung fehlte im Fallback → SuS sah "Prüfung konnte nicht geladen werden".
- Fix: Fallback-Map mit beiden eingebauten Prüfungen.
- Commit `7911a61`

**9. Design-Wünsche (F1-F3)**
- F1: "Aktuell"-Badges in LP-Themensteuerung nutzen Fachfarbe (statt grün); "z.T. aktuell" = Fachfarbe mit opacity 0.6; "Freigegeben" bleibt slate.
- F2: SuS-Themen-Kacheln bekommen unteren Rand in Fachfarbe zusätzlich zum linken (analog Header-Tabs).
- F3: GlobalSuche-Eingabefeld text-xs → text-sm, Icon-Positionierung per top-1/2 — matcht TabKaskade-Höhe.
- Commit `b2092f5`

### Verifikation (Staging mit echten Logins)

Alle Bugs aus User-Testbericht als gefixt verifiziert:
- ✅ E1 SuS-Lobby-Beitritt: SuS kommt in Prüfung, Frage 1/23
- ✅ E2 Frage 13 (Tierzelle), Frage 14 (Weltkarte/Kontinente), Frage 16 (PDF-Annotation Witzsammlung)
- ✅ E3 Material-PDFs: OR-Auszug Kaufvertrag lädt korrekt (nicht mehr SuS-Website)
- ✅ E4 LP-Live-Monitoring: zeigt SuS `wr.test@stud.gymhofwil.ch`, Aktiv, Frage 1/23
- ✅ F1 Aktuell-Tags in Fachfarbe (Recht grün, VWL orange)
- ✅ F2 Themen-Kacheln ⌐-Rand in Fachfarbe
- ✅ F3 Suchfeld matcht Tab-Höhe

`tsc -b` ✅ | 303 Tests ✅ | Build ✅

### Lehre
- Relative Asset-URLs in Daten-Dateien sind eine Zeitbombe bei SPA-Routing. Bei neuen Assets konsequent `toAssetUrl()` verwenden.
- Deploy-Cache: Browser cacht oft `index.html` selbst, verweist auf alten Chunk-Hash (503). SW-unregister + `caches.delete()` + Cache-Buster in URL hilft. Wenn Kunden das gleiche erleben: Empfehlung für Hard-Reload (Cmd+Shift+R).

---

## Session 114 — Kopfzeilen-Refactor Phase 1-3 (15.04.2026)

### Stand
**Branch `feature/kopfzeile-refactor`, noch nicht gemergt.** Alle neuen Komponenten hinter Feature-Flag `VITE_ENABLE_NEW_HEADER=1`. Ohne Flag: unverändertes Verhalten.
Tests: 306 grün (vorher 251, +55 neue). tsc ✅ | Build ✅. 15 Commits.

### Umgesetzt

**Design-Dokumente:**
- `docs/superpowers/specs/2026-04-15-kopfzeile-refactor-design.md`
- `docs/superpowers/plans/2026-04-15-kopfzeile-refactor.md`
- Mockups (6 HTML-Varianten) unter `.superpowers/brainstorm/mockups/` (nicht deployed)

**Phase 1 — Skeleton (11 Tasks, 55 Tests):**
- `src/components/shared/header/` (neu):
  - `types.ts` — L1Id, L3Mode, L1Tab, L2Tab, L3Config, TabKaskadeConfig, Rolle
  - `L3Dropdown.tsx` — Single/Multi-Select mit "+N"-Pill, Outside-Click + ESC
  - `TabKaskade.tsx` — L1/L2 inline + L3-Dropdown am aktiven L2; Pfeiltasten-Navigation (WAI-ARIA), aria-live für Screenreader
  - `OptionenMenu.tsx` — ⋮-Menü, Rolle-spezifische Inhalte (LP zeigt Einstellungen, SuS zeigt "Problem melden" statt "Feedback senden")
  - `GlobalSuche.tsx` — Input + Ergebnis-Panel, ⌘K/Ctrl+K Fokus, ESC, gruppierte Treffer, Lade-State
  - `useTabKaskadeConfig.lp.ts` / `.sus.ts` — URL→Config pure Functions + React-Hooks
  - `AppHeader.tsx` — integrierende Komponente (TabKaskade + GlobalSuche + OptionenMenu)
  - `useL3Precedence.ts` — URL > localStorage mit replace-Navigation
- `src/hooks/useViewport.ts` — 3 Tiers (desktop/schmal/phone) via matchMedia + 150ms throttle
- `src/hooks/useGlobalSuche.shared.ts` + `useGlobalSucheLP.ts` + `useGlobalSucheSuS.ts` — separate Hooks mit Index-Blacklist (musterlosung, korrekt, bewertungsraster etc.) gegen Datenleck

**Phase 2 — LP-Migration (hinter Flag):**
- `src/components/lp/LPAppHeaderContainer.tsx` — Bridge zu Stores
- `AppHeader` Detail-Modus ergänzt: `onZurueck`, `breadcrumbs`, `aktionsButtons`, `statusText`, `untertitel`
- 5 LP-Pages geswitcht (alle ternary mit Flag): `LPStartseite`, `Favoriten`, `PruefungsComposer`, `KorrekturDashboard`, `DurchfuehrenDashboard`. Alter LPHeader in else-Branch unverändert erhalten.

**Phase 3 — SuS-Migration (hinter Flag):**
- `src/components/sus/SuSAppHeaderContainer.tsx`
- 2 SuS-Pages geswitcht: `SuSStartseite`, `KorrekturEinsicht`. `AktivePruefungen` und `KorrekturListe` haben keine eigenen Header (Sub-Komponenten).

### ⚠️ Bekannte Einschränkung (Finding aus Task 1.5)

ExamLab hat **keine globalen Zustand-Stores für Prüfungen/Kurse** — sie werden per Route via API gefetcht. Die neuen Such-Hooks `useGlobalSucheLP` / `useGlobalSucheSuS` haben daher aktuell nur **Fragensammlung-Treffer** aktiv (via `useFragenbankStore.summaries`). Prüfungen/Kurse-Suche liefert leere Treffer mit TODO-Kommentar. Kann nachgerüstet werden, wenn die Suche im Alltag genutzt wird und der Bedarf zeigt, was wirklich hinzukommen muss (Option: globaler Cache-Store mit SWR-Pattern).

### User-Aufgaben — Browser-Verifikation BEIDER Rollen

```bash
cd ExamLab
VITE_ENABLE_NEW_HEADER=1 npm run dev
```

**LP-Test:**
1. `/favoriten` → L1 "Favoriten" aktiv
2. Klick "Prüfen" → L2 "Durchführen/Analyse" inline
3. Klick "Üben" → L2 "Durchführen/Übungen/Analyse"
4. Kurs via Übungen wählen → L3-Dropdown zeigt Kurs
5. Klick "Fragensammlung" → kein L2
6. Suche "konjunktur" → Fragen-Treffer gruppiert
7. ⌘K fokussiert Suche; ESC räumt auf
8. ⋮-Menü: Benutzer, Einstellungen, Dark Mode, Hilfe, Feedback, Abmelden
9. Detail-View (Prüfung öffnen) → Zurück-Button + Breadcrumbs

**SuS-Test:**
1. `/sus/ueben` → L1 "Üben" aktiv, L2 "Themen/Fortschritt/Ergebnisse"
2. Klick "Prüfen" → L2 "Offen/Ergebnisse"
3. Deep-Link `/sus/ueben?fach=BWL&thema=X` ohne Login → Login → Return mit erhaltener Query
4. ⋮: kein "Einstellungen" (SuS hat keine), "Problem melden" statt "Feedback senden"
5. Suche funktioniert (aktuell nur Fragensammlung-ähnliche Treffer)

**Ohne Flag:** Alter LPHeader + Inline-SuS-Header müssen weiterhin unverändert funktionieren.

### Staging-Bugs Runde 1 (behoben)

- `0e67b0f` LP: Analyse-URL `/pruefung/analyse` → `/pruefung/tracker`, Kurse-Wire-up aus gruppenStore, alte Body-Tabs + Suche ausblenden, L2-Pfade korrigiert
- `8cd3554` L3 Kurs-Dropdown immer sichtbar (auch ohne Auswahl) mit Placeholder "Kurs wählen …"
- `318363f` L3 overflow-x-clip (overflow-x-auto triggerte y-clipping → Dropdown-Panel abgeschnitten) + Admin-Filter entfernt (zeigt alle Kurse des LP, nicht nur Admin-Gruppen)
- `2271f40` SuS AppUeben (AppShell.tsx) hinter Flag migriert
- `542b0d2` SuS Dashboard-Tabs (Themen/Fortschritt/Ergebnisse) synct `dashboardTab` mit URL
- `7b043cd` Router: `/sus/ueben/fortschritt`, `/sus/ueben/ergebnisse`, `/sus/ueben/kurs/:kursId`, `/sus/pruefen/ergebnisse` ergänzt
- `06f451b` `ermittleScreen()` in AppShell.tsx + AppUeben.tsx: neue L2-Routen expliziten als `dashboard` erkennen, bevor das Übungs-Regex zuschlägt (behebt Flash+Rücksprung)
- `<next>` SuS: `SuSAppHeaderContainer` liest echte Kurse aus `useUebenGruppenStore`; `useTabKaskadeConfigSuS` zeigt L3 immer wenn `kurse.length > 0` (analog LP), mit Placeholder "Kurs wählen …". Funktioniert auch bei SuS mit nur einem Kurs.

### Offen (nach User-Freigabe der Staging-Tests)

**Phase 4 Cleanup:**
- Flag permanent aktivieren (alle `{flag ? X : Y}`-Ternaries durch `X` ersetzen)
- `LPHeader.tsx` löschen (nach Verify dass nicht mehr referenziert)
- `UebenTabLeiste.tsx` + Tests löschen
- Inline-Header-Code in SuSStartseite/AppShell/KorrekturEinsicht entfernen (else-Zweige)
- Favoriten-Klick setzt Ziel-L3 direkt (Spec §2.6)
- HANDOFF S115 schreiben, Merge `preview` → `main`

**UX-Wünsche (aus S114 Browser-Test, als eigenes Bundle):**
- Hover-Preview auf L2/L3 (was würde aufklappen?)
- L1 aktiv: linker + unterer Rand hervorheben (zusätzlich zum violetten Unterstrich)
- Striche unter/neben aktiven Tabs inkl. halben abgerundeten Ecken

**Bekannte Randfälle (nicht blockierend):**
- **Suche:** Prüfungen/Kurse-Treffer leer (keine globalen Stores). Kann nachgerüstet werden wenn Suche im Alltag genutzt wird.
- **MultiSelect L3 bei Prüfen → Durchführen:** Aktuell leer (kein globaler Prüfungs-Store). Nachprüfungs-Use-Case noch nicht implementiert.
- **Mobile phone-Layout:** Nur Brand+Version ausgeblendet bei `<900px`. Vollständige L1-Dropdown + Such-Modal + L2-Chip-Row als eigene Session.

**Pre-existing Bugs (NICHT aus diesem Refactor):**
- `X-Frame-Options via meta` Console-Warning (LoginScreen)
- CSP `style-src` blockt `accounts.google.com/gsi/style`
- "Prüfung starten" / "Übung starten" Buttons auf Karten tun nichts (X-Frame-Options bezogen)

### Commits (chronologisch)

Siehe `git log --oneline main..feature/kopfzeile-refactor` (15 Commits).

---

## Session 113 — Bundle 12 + Deep-Link-Fix + Bundle 13 Cluster I (15.04.2026)

### Stand
**Noch nicht auf main gemergt.** Alles auf `origin/preview` (Staging) gepusht, wartet auf User-Freigabe.
tsc ✅ | 246 Tests ✅ | Build ✅ | Browser-Tests in Chrome-in-Chrome durchgeführt.

### Erledigte Arbeiten (auf preview)

**Bundle 12 — Cluster K (Namens-Refactor + Frageneditor-UX + Einstellungen)**
- **K-1 Namens-Refactor (user-sichtbar):** "Fachbereich" → "Fach" in FragenImport, SuSHilfePanel, HilfeSeite, excelImport, FragetextSection-Tooltip. "Lernziele aus der Fragenbank" → "Fragensammlung" (LernzielWaehler). Code-intern Rename (Types/Stores/Files) bewusst **NICHT** durchgeführt (User-Entscheid: eigene Session, Risikoeindämmung).
- **K-1 Cleanup-Script:** `ExamLab/scripts/clean-themen-praefix.mjs` — entfernt "Übungspool: "-Präfix aus thema/unterthema aller Fragen via Apps-Script-API. Dry-Run Default, `--apply` zum Schreiben. **User-Aufgabe:** Einmalig lokal ausführen.
- **K-2 Frageneditor-UX (Teilmenge):** MetadataSection — Fach als Pflichtfeld (`input-pflicht`, Stern), Thema violett, Label "Fachbereich" → "Fach", KI-Klassifizieren-Button blau wenn aktiv. KI-Klassifizieren-Vorschau + Tooltip: "Fachbereich" → "Fach".
- **K-2 Header "Geteilt mit":** Neuer `berechtigungenHeaderSlot` in SharedFragenEditor. Kompakte Status-Badge in Editor-Kopfzeile ("Geteilt: Privat" / "Fachschaft" / "Schulweit" / "Privat + geteilt · N LP"). Voller BerechtigungenEditor bleibt im Metadaten-Body.
- **K-2 Thema-Dropdown (Lernziele):** LernzielWaehler "Neu erstellen"-Block — Thema als Dropdown mit bestehenden Themen pro Fach + "+ Neues Thema …"-Fallback. Label "Fachbereich" → "Fach". Fach-Wechsel leert Thema.
- **K-3 Gefässe konfigurierbar:** Einstellungen → Admin → Gefässe jetzt als Chip-Editor (analog Fächer/Fachschaften). `+ Gefäss`-Inline-Editor mit Duplikat-Schutz.
- **K-4 Zeitpunkt-Grundlagen:** `SchulConfig.zeitpunktModell` (Modus `schuljahr|semester|quartal` + Anzahl) optional mit Fallback auf legacy `semesterModell`. Utility `zeitpunktUtils.ts`. UI-Label "Semester" → "Zeitpunkt" (MetadataSection, ConfigTab, NotenStandPanel).

**Deep-Link SuS-Flow Fix (aus S111 Backlog)**
- `Router.tsx`: LPGuard ergänzt `returnTo=currentUrl`-Param beim Login-Redirect. Neuer **SuSGuard** für alle SuS-Routes (war vorher ohne Guard — App.tsx rendered LoginScreen inline ohne returnTo-Weitergabe).
- Verifiziert: `/sus/ueben?fach=BWL&thema=Einführung` ohne Login → Redirect mit returnTo → nach Demo-SuS-Login zurück mit intaktem Query-String → `useDeepLinkAktivierung` aktiviert Thema.

**Weitere Fixes**
- **Dark-Mode `.filter-btn`:** Basis-BG `bg-white dark:bg-slate-800` — inaktive Filter-Buttons im Dark Mode nicht mehr "unsichtbar" im Parent-Hintergrund.

**Bundle 13 — Cluster I (implementiert)**
- Design-Spec `ExamLab/docs/superpowers/specs/2026-04-15-bundle13-cluster-i-design.md`
- Implementation-Plan `ExamLab/docs/superpowers/plans/2026-04-15-bundle13-cluster-i.md` (8 Tasks)
- Alle 8 Tasks umgesetzt. tsc ✅ | 251 Tests ✅ | Build ✅.
  - I-1 Route `/uebung/kurs/:kursId`
  - I-2 `UebenTabLeiste.tsx` (5 vitest-Tests) — Kurs-Tabs inline bei aktivem "Übungen"-Tab
  - I-3 LPStartseite: `useParams<{kursId}>` + `useNavigate`, localStorage `examlab-ueben-letzter-kurs`, Redirect bei ungültiger ID
  - I-3 `useLPRouteSync.ts`: Case `/uebung/kurs/...` → setzt `uebungsTab='uebungen'`
  - I-4 `UebungsToolView.tsx`: Gruppen-Info-Bar entfernt, neue Prop `aktiverKursId` synct Store
  - I-5 `AdminDashboard.tsx`: interne Tabs "Übersicht"/"Themen" entfernt, rendert Themensteuerung direkt
  - I-6 `AdminUebersicht.tsx` gelöscht (Inhalt war Mitglieder-Stats → Einstellungen→Mitglieder)
  - I-7 ~~Fachfreischaltung pro Kurs in FaecherTab~~ **nach User-Test zurückgerollt:** obere Checkbox-Liste deckt den Use-Case bereits ab (Kurs-Wechsel via Tab-Leiste → Fächer der aktiven Gruppe verwalten). Stattdessen Schrift in oberer Liste verkleinert (`text-sm`/`text-xs`).

### Offen (Bundle 13)
- `AdminKindDetail`/`AdminThemaDetail`: aktuell keine Entry-Points mehr. Follow-up-Löschung möglich.
- Toast-System für "Kurs nicht gefunden" (derzeit console.warn).

### Backlog aus S113 User-Test (für nächste Session)
- **Einstellungen → Übungen → Farben:** Schrift sehr gross (analog FaecherTab verkleinern).
- **Einstellungen → allgemein:** Mouse-over auf Flächen/Kacheln hat keine Hervorhebung.
- **SuS-Version ≠ LP-Version Design:** Mouse-over, Buttons, Tabs, Farben sollten identisch sein. Als generische Regel (CSS-Layer/Tailwind-Preset) global definieren, nicht pro Komponente.
- **Tabs global:** Bei Hover und Aktiv unten Strich, leicht abgerundete Ecken. Design-System-Regel.
- **LP-Login Üben-Übungen:** "Keine Themen gefunden" → nach Wartezeit "Backend konnte nicht erreicht werden". Reproduzieren + Fix (war ev. Restwirkung vom fehlenden Bundle 12; nach Rebase erneut prüfen).
- **Kopfzeilen-Refactor (gross):** Tab-Leiste + Suchfeld in Kopfzeile integrieren (Prüfen/Üben). Rechte Buttons (Einstellungen, Theme, Hilfe, Problem melden, Abmelden) in "⋮"-Menü zusammenfassen. Tab-Vorschläge:
  - LP Prüfen: *Prüfung durchführen / Analyse*
  - LP Üben: *Übung durchführen / Übungen (mit inline Kurs-Tabs) / Analyse* (bereits umgesetzt)
  - SuS Üben: *Themen / Mein Fortschritt / Ergebnisse*
  - SuS Prüfen: analog

### Parkiert im Backlog (eigene Sessions)

- **Code-intern Rename** (Types/Stores/Files): User-Entscheid Bundle 12.
- **K-2 Defaults leer** (nullable Types `fachbereich?`, `bloom?`, `zeitbedarf?`): braucht Type-Refactor, viele Call-Sites.
- **K-2 Header-Umbau "Geteilt mit" voll:** aktuell nur Status-Badge. Popover mit Inline-Edit wäre eigene Session.
- **K-4 Admin-Editor Zeitpunkt-Modell:** braucht Backend-Persistenz (SchulConfig aktuell nur Defaults).

### Commits (chronologisch auf preview)
- `f45de0a` Bundle 12 K-1 + K-2 Teilmenge
- `b474663` K-3 Gefässe Chip-Editor (gemerged)
- `be3867a` K-4 Zeitpunkt-Grundlagen (gemerged)
- `ce81df2` Deep-Link SuS-Flow Fix
- `fb62007` Merge Deep-Link Fix
- `aa5b6b6` Dark-Mode .filter-btn
- `a632155` K-2 Header Geteilt-mit Badge
- `f65759e` K-2 Thema-Dropdown Lernziele
- `cffe9d3` Merge Dark-Mode + K-2 Teilergebnisse
- `5d52fa8` Tooltip-Rest Fachbereich→Fach
- `5c8a3fb` Bundle 13 I-1: Route /uebung/kurs/:kursId
- `4e8bc1e` Bundle 13 I-2: UebenTabLeiste mit Kurs-Tabs
- `6317d89` Bundle 13 I-3+4: LPStartseite + UebungsToolView
- `99b1f2f` Bundle 13 I-5+6: AdminDashboard ohne interne Tabs
- `661817b` Bundle 13 I-7: Fachfreischaltung pro Kurs

### User-Aufgaben

1. **Staging testen** (preview-Branch, GitHub Pages `/staging/` Ordner nach Build):
   - Fragensammlung: "Fach" statt "Fachbereich" in Filtern + Editor
   - Frage öffnen: violetter Rahmen bei Fach/Thema, KI-Button blau, "Geteilt: X" Badge
   - Dark Mode: Filter-Buttons sichtbar
   - Einstellungen → Admin → Gefässe-Chip-Editor (nur für Admin-User sichtbar)
   - Einstellungen → Übungen → Fächer: Label "Zeitpunkt" statt "Semester"
   - Deep-Link: als SuS `/sus/ueben?fach=BWL&thema=X` öffnen ohne Login → Login → Query-String bleibt
2. **Altdaten bereinigen (optional):**
   ```
   cd ExamLab
   node scripts/clean-themen-praefix.mjs          # Dry-Run
   node scripts/clean-themen-praefix.mjs --apply  # Schreibt
   ```
3. **Bei Freigabe:** Merge `preview` → `main` + push

---

## Session 112 — Ueben-Settings-Persistenz + Begriffs-Klärung + UX-Wünsche (15.04.2026)

### Stand
Auf `main` gemergt. tsc ✅ | 246 Tests ✅ | Build ✅. Auf Staging von User grün verifiziert.
**⚠️ Apps-Script-Deploy manuell gemacht** (Backend-Fehlermeldung geändert).

### Erledigte Arbeiten

**Settings-Persistenz (Hauptfix)**
- `useUebenSettingsStore.aktualisiereEinstellungen` schrieb bisher nur in-memory. Backend-Adapter-Methode `speichereEinstellungen` existierte, wurde nie gerufen → maxAktiveThemen, Fachfarben, sichtbare Fächer etc. gingen nach Reload verloren.
- Fix zentral im Store: Optimistic Update sofort, debounced Backend-Save (500 ms), liest Gruppe+User via `getState()` zur Ausführungszeit.
- `setzeEinstellungen` (Load-Pfad) persistiert NICHT zurück — kein Loop.
- `abbrecheSave()` beim Gruppen-Wechsel in `UebenKontextProvider` → keine Cross-Kontamination.
- `saveFehler` + `speichertGerade` als Store-State → roter Dismiss-Banner + dezentes "Speichern…" im `AdminSettings`.
- **Wichtig für künftige Settings:** Jedes neue Feld in `GruppenEinstellungen`, das via `aktualisiereEinstellungen` gesetzt wird, wird automatisch mit persistiert. Kein Extra-Code nötig.
- **7 neue Tests** (`src/tests/uebenSettingsStore.test.ts`): Load-Pfad triggert nicht, Debounce-Verhalten, abbrecheSave, Fehler-Handling, kein Save ohne User/Gruppe.

**Begriffs-Klärung "Admin" → "Kurs-Leitung"**
- Plattform-Admin bleibt **Admin** (darf Fächer/Fachschaften/Klassen/Gefässe/Kurse plattformweit).
- Gruppen-Admin (= Besitzer einer Üben-Gruppe) heisst jetzt **Kurs-Leitung** (darf Einstellungen + Mitglieder + Fragenbank dieser Gruppe).
- UI-Änderungen: `AppShell.tsx` (Rolle unter User-Name), `MitgliederTab.tsx` (Rolle-Label).
- Backend-Fehler spezifischer: "Diese Einstellungen können nur von der Kurs-Leitung gespeichert werden. Kurs-Leitung: {email}" + "Keine Berechtigung (nur Kurs-Leitung)" bei Fragen speichern/löschen.
- **Datenfelder unverändert** (`adminEmail` in Registry, `rolle: 'admin'` im Mitglied-Type) → keine Sheet-Migration.

**UX-Wünsche aus derselben Session**
- `MitgliederTab`: Rolle-Toggle-Button → `<select>`-Dropdown (intuitiver). Amber-Farbe für Kurs-Leitung entfernt, neutrale slate-Optik (Farbkonzept). "Letzte Kurs-Leitung" bleibt disabled.
- Einstellungen → Tab **"Übungen" immer sichtbar** (vorher nur bei aktiver Gruppe). AdminSettings hat jetzt einen **Kurs-Dropdown links neben den Sub-Tabs** in einer Kopfzeile. Ohne Auswahl: Hinweistext statt leere Tabs. Bei Wechsel wird `waehleGruppe()` gerufen → globaler Store updated, AppShell-Header zieht nach.

### Entscheidungen (bestätigt im Chat)
- Gruppen-Einstellungen bleiben **pro Gruppe** (nicht pro LP). Kurs-Leitung ist Single-Admin der Gruppe. Team-Teaching / Multi-Admin → späteres Backlog falls Bedarf.
- Begriff-Scope: Nur UI + User-sichtbare Backend-Fehler umbenannt. Datenstruktur (`admins`-Spalte, `adminEmail`-Feld, `rolle: 'admin'`) bleibt aus Backward-Compat-Gründen identisch.

### Commits
- `99de6b1` Settings-Persistenz (Store + Provider + Banner + 7 Tests)
- `abe6300` Admin → Kurs-Leitung (UI + Backend-Fehler)
- `b8592b1` Rolle-Dropdown + Übungen-Tab immer sichtbar + Kurs-Auswahl
- `f44e73f` Kurs-Dropdown neben Sub-Tabs (eine Kopfzeile)
- Merge-Commit auf main (Session 112)

### Offen / Backlog
- **Apps-Script-Deploy:** User muss `ExamLab/apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen. Sonst sehen Nicht-Kurs-Leitungen die alte generische Fehlermeldung statt der neuen präzisen.
- **Deep-Link SuS-Flow** (aus S111): Gepasteter Deep-Link verliert Query-String beim Login, SuS sieht aktivierte LP-Themen nicht. Eigene Session.
- **Dark-Mode `.filter-btn` Basis-BG:** Bei Bundle 13 global adressieren.
- **Bundle 12 — Cluster K** (Frageneditor + Namens-Refactor + Einstellungen erweitern).
- **K-2 Frageneditor Defaults leer (Type-Refactor, eigene Session):** Zeitbedarf/Bloom/Fach sollen beim Anlegen einer neuen Frage keinen Default haben. Braucht nullable Types (`fachbereich?: Fachbereich`, `bloom?: BloomStufe`, `zeitbedarf?: number`), Backend-Kompatibilität, Validation-Logic. Nicht in K-2 Session 15.04.2026 erledigt — zu grosser Scope.
- **K-2 Header-Umbau "Geteilt mit" (eigene Session):** `BerechtigungenEditor` aus Metadaten-Section in FragenEditor-Header-Leiste links vom KI-Button verschieben. Layout-Arbeit, nicht in K-2 Session erledigt.
- **K-2 Thema-Dropdown (eigene Session):** Im Lernziele-Bereich Thema als Dropdown statt Freitext. "Fachbereich" im Lernziele-Dropdown → "Fach". Braucht Datenquelle + UI.
- **Daten-Migration Übungspool-Präfix (User-Aufgabe):** `node ExamLab/scripts/clean-themen-praefix.mjs` (Dry-Run), dann `--apply` zum Schreiben. Einmalig ausführen, um `thema`/`unterthema` aller Altdaten-Fragen zu bereinigen.
- **K-4 Admin-Editor Zeitpunkt-Modell (eigene Session):** In Bundle 12 K-4 wurde `SchulConfig.zeitpunktModell` (Modus `schuljahr|semester|quartal` + Anzahl) + Utility `generateZeitpunkte()` + UI-Label "Semester" → "Zeitpunkt" eingeführt. **Fehlt:** Admin-Editor in Einstellungen, um Modus/Anzahl zu ändern. Braucht Backend-Persistenz (SchulConfig hat aktuell nur Defaults, kein Sheet-Tab). Alternative: Modell von `SchulConfig` nach `Stammdaten` migrieren (hat Backend). Bei Modus-Wechsel: Bestehende `semester: string[]`-Werte in Fragen (z.B. "S1".."S8") müssen ggf. migriert werden — User-Dokumentation oder Migrations-Skript nötig.
- **Bundle 13 — Cluster I** (Üben-Übungen Tab-Architektur).
- **Cluster L** — Üben-Analyse Heatmap (geparkt bis SuS-Daten).
- **Code-intern Rename (eigene Session, später):** `Fachbereich`/`fachbereich` → `Fach`/`fach` und `Fragenbank`/`fragenbank` → `Fragensammlung`/`fragensammlung` in TypeScript-Typen, Stores (`fragenbankStore`, `fragenbankApi`, `fragenbankCache`), Datenfeldern, CSS-Klassen, Dateinamen, apps-script-code.js, Pool-Configs, Docs. In Bundle 12 K-1 wurden nur user-sichtbare Strings umbenannt (Entscheid User, 15.04.2026, Risikoeindämmung).

---

## Session 111 — Bundle 11: Themen-Kacheln Refactor (Cluster J) (15.04.2026)

### Stand
Auf `main` gemergt. tsc ✅ | 239 Tests ✅ | Build ✅. Auf Staging von User grün verifiziert.

### Erledigte Arbeiten

**AdminThemensteuerung.tsx — Button-Reihenfolge**
- Pro Status feste Reihenfolge rechtsbündig, Lernziele + Link **konstant ganz rechts** (wandern nicht mehr):
  - `aktiv`:              `[Aktuell]`      `Abschliessen`   `Deaktivieren`   `🏁 LZ`  `🔗 Link`
  - `abgeschlossen`:      `[Freigegeben]`  `Aktuell setzen` `Deaktivieren`   `🏁 LZ`  `🔗 Link`
  - `nicht_freigeschaltet`: `Aktivieren`                                     `🏁 LZ`  `🔗 Link`
- **Neu:** Abgeschlossene Themen wieder als "Aktuell" markierbar (`Aktuell setzen`-Button).

**AdminThemensteuerung.tsx — Design-Harmonisierung**
- Thema-Zeile auf globalen `.hover-card` (S110-Utility).
- Alle Aktions-Buttons (Abschliessen/Deaktivieren/Aktuell setzen/Lernziele/Link) via `.filter-btn` + `min-h-[36px]`.
- Farbige Punkt-Marker (`w-2.5 h-2.5 rounded-full`) entfernt.
- `border-l-4` in Fachfarbe auf **allen Status** (vorher nur bei aktiv). `opacity-70` dämpft bei nicht_freigeschaltet.
- Fach-Filter: Border + Text in Fachfarbe bei inaktiv, voll fachfarbig bei aktiv. "Alle"-Button neutral slate (`.filter-btn` + `.filter-btn-active`).

**LernzieleAkkordeon.tsx — LP-Kontext**
- `LernzieleMiniModal.onUeben`-Prop optional gemacht.
- Button "▶ Fragen zu X üben" rendert nur wenn `onUeben` gesetzt.
- `AdminThemensteuerung` übergibt `onUeben` nicht mehr → im LP-Kontext verschwindet der nicht-funktionierende Üben-Button.
- SuS-Kontext (`Dashboard.tsx`) unverändert.

### Entscheidungen (bestätigt im Chat)
- Lernziele + Deep-Link als konstanter Rechts-Anker (kein Layout-Jitter beim Status-Wechsel).
- Dark-Mode-Basis-BG für `.filter-btn` NICHT jetzt angehen — die Fach-Filter werden bei Bundle 13 (Cluster I) ohnehin neben den Tabs neu positioniert. Dann global mitbehandeln.

### Offen / Backlog (neu aus dieser Session)
- **Settings-Persistenz (Bug):** `useUebenSettingsStore.aktualisiereEinstellungen` schreibt nur in-memory. Adapter-Methode `speichereEinstellungen` existiert, wird aber nie aufgerufen → maxAktiveThemen, Fachfarben, sichtbare Fächer etc. gehen nach Reload verloren. **Nächste Session:** Fix-Branch `fix/ueben-settings-persistenz`.
- **Deep-Link SuS-Flow (Bug):** Gepasteter Deep-Link zwingt zum Login, danach landet SuS auf generischer Üben-Themen-Seite — Query-String geht verloren. Zusätzlich: LP-aktivierte Themen sind bei SuS wr.test nicht sichtbar. Zwei separate Probleme, eigene Session.
- **Dark-Mode `.filter-btn` Basis-BG:** Bei Bundle 13 mitnehmen (globaler Fix, nicht Bundle-11-spezifisch).

### Commits
- `89d0ab9` Bundle 11 Teil 1 (Button-Reihenfolge, Aktuell setzen, hover-card, filter-btn)
- `1aa1d71` Bundle 11 Nachtrag (Punkte weg, border-l-4 alle Status, Fach-Filter standardisiert, Üben-Button im LP-Modal)
- `36d9513` Bundle 11 Fix (Fach-Filter inaktiv Text in Fachfarbe)
- Merge-Commit auf main (Session 111)

---

## Session 110 — Bundle 10: Design-System Hover/Active + React #185 Bugfix (14.04.2026)

### Stand
Auf `main` gemergt. tsc ✅ | 239 Tests ✅ | Build ✅. Auf Staging von User grün verifiziert.

### Erledigte Arbeiten

**Bugfix React #185 (Crash beim Klick auf Lernende-Kachel)**
- `AdminKindDetail.tsx`: Zustand-Selector gab neues Array pro Render zurück (`filter()` im Selector) → React #185 Endlos-Loop. Fix: Rohdaten selektieren, mit `useMemo` filtern.
- Neue Rule: `code-quality.md` → "Zustand-Selektoren (React #185 vermeiden)".

**Cluster F — Modal/Sidebar ESC**
- `FeedbackModal.tsx`: ESC-Handler ergänzt (war nur Klick-daneben, kein ESC).
- `FeedbackButton.tsx`: `onClick` togglet jetzt (zweiter Klick schliesst das offene Modal).

**Cluster G — Design-System Hover/Active**
- `index.css`: Utility-Klassen `hover-card`, `hover-card-active`, `hover-card-fach`, `hover-tab`, `hover-tab-active` bereit für künftige Nutzung.
- `index.css` `.filter-btn` Hover: slate-100 → slate-200 + border-darken (nicht mehr "fast weiss").
- `LPStartseite.tsx`: Prüfen-/Üben-Sub-Tabs Hover mit bg-slate-200 (vorher nur Text-Farbe).
- `LPStartseite.tsx`: Filter-Buttons (Fach/Gefäss/Status) `hover:bg-slate-50` → slate-200 + border-slate-400.
- `EditorBausteine.tsx` (shared `Abschnitt`): dezenter Border-Hover auf Editor-Bereichen.
- `FrageTypAuswahl.tsx` (shared): Hover sichtbar (bg-slate-200 + border-slate-400).

**Cluster H — LP-Favoriten**
- `Favoriten.tsx`: Hover-Rand blau → violett (Farbkonzept).
- `Favoriten.tsx`: "Entwurf"-Badge amber → neutral slate (nicht mehr als Warnung codiert).

### Entscheidungen (bestätigt im Chat)
- Active-Akzent = violett, Hover-Akzent = slate.
- Frageneditor-Bereichs-Kacheln: dezenter Hover (Border), Buttons darin stärker.

### Offen (Bundle 11–13, nächste Sessions)
- **Bundle 11 — Cluster J** (Themen-Kacheln Refactor): Kachel-Hover, Button-Harmonisierung, "Aktuell"-Button nach links, abgeschlossene Themen wieder "Aktuell" markierbar, **farbige Fach-Filter-Buttons VWL/BWL/Recht in Themensteuerung** (vom User im Staging-Screenshot markiert).
- **Bundle 12 — Cluster K** (Frageneditor, Metadaten-Defaults, Namens-Refactor Fachbereich→Fach, Fragenbank→Fragensammlung, Semester→Zeitpunkt konfigurierbar, Gefässe in Einstellungen).
- **Bundle 13 — Cluster I** (Üben-Übungen Tab-Architektur: Übersicht/Themen entfernen, Kurs-Sub-Tabs neben "Übungen").
- **Cluster L** — Üben-Analyse Heatmap: geparkt bis SuS-Daten vorliegen.

### Commits
- `62db3f1` Bundle 10 Teil 1 + Bugfix
- `066356a` Bundle 10 Teil 2 (Sub-Tabs, Editor-Bereiche, Fragetyp-Buttons)
- `8059910` Bundle 10 Nachtrag (Prüfen-Tabs + Filter-Buttons)
- Merge-Commit auf main (Session 110)

---

## Backlog — UX-Testrunde 14.04.2026 (offen, Bundle 11–13)

Aus User-Testrunde nach S109. Bundle 10 erledigt (S110). Vorgehen: Bundles nacheinander, jeweils Staging-Test → Freigabe → main.

### Reihenfolge
1. ~~Bugfix React #185~~ ✅ S110
2. ~~Bundle 10 — Cluster F + G + H~~ ✅ S110
3. ~~Bundle 11 — Cluster J~~ ✅ S111
4. ~~Fix: Ueben-Settings-Persistenz~~ ✅ S112 (+ Begriffs-Klärung + UX-Wünsche)
5. **Bundle 12 — Cluster K** (Frageneditor + Namens-Refactor + Einstellungen erweitern)
6. **Bundle 13 — Cluster I** (Üben-Übungen Tab-Architektur, separate Session)
7. **Cluster L** — Üben-Analyse Heatmap-Neudarstellung: geparkt bis echte SuS-Daten vorliegen.

### Cluster F — Modal/Sidebar ESC-Einheitlichkeit
- Problem-Melden-Modal schliesst nicht mit ESC. Einheitlich: ESC + Klick-daneben + auslösender Button toggelt zu. Alle übrigen Modals gegen diesen Standard auditieren.

### Cluster G — Globales Hover/Active-Design
Grundsatz: **Hover = Hintergrund leicht heller + Unterstrich unten** (dem Container-Rand mit Rundung folgend). **Aktiv = gleicher Unterstrich permanent**. Fach-Filter optional Fachfarben (VWL/BWL/Recht).
Nicht mehr: uneinheitliches Hell/Dunkel/Border-Mix.

Betroffene Stellen:
- LP-Favoriten: Prüfungs-/Übungs-Kacheln Hover blau → violett (gemäss Farbkonzept).
- LP-Prüfen Sub-Tabs (Prüfungen/Analyse): Hover-Hintergrund reagiert nicht, muss wie Kopfzeilen-Tabs.
- LP-Prüfen Filter-Buttons (BWL/Recht/SF/aktiv…): werden fast weiss bei Hover — auf neuen Standard.
- LP-Üben Sub-Tabs (Übung durchführen/Übungen/Analyse): analog.
- LP-Üben-Übungen Kurs-Flächen: Standard-Hover, Rand in Fachfarbe.
- LP-Üben-Themen Kacheln: Standard-Hover.
- LP-Üben-Themen Fach-Filter-Buttons: Standard-Hover.
- Fragensammlung Frage-Kacheln: Standard-Hover, Fachfarben-Akzent möglich.
- Fragensammlung Dropdowns + Filter: prüfen ob Dropdowns auch Hover-Feedback haben sollen, Filter-Buttons auf Standard.
- Frageneditor-Bereiche (Metadaten, Fragetyp, Fragetext, Anhänge, Antwortoptionen, Musterlösung, Bewertungsraster): Bereichs-Hover.
- Frageneditor Fragetyp-Buttons: Standard-Hover.

### Cluster H — LP-Favoriten Detail
- "Entwurf"-Badge gelb → neutral (nicht als Warnung codieren).

### Cluster I — Üben-Übungen Tab-Architektur (gross, eigene Session)
- Tab **Übersicht** entfällt → Inhalt (Kurs-Mitglieder, Admins, Fachfreischaltung) wandert in Einstellungen.
- Tab **Themen** entfällt → direkt unter "Übungen" sichtbar.
- **Kurs-Sub-Tabs** klappen beim Klick auf "Übungen" neben dem Tab auf (Analyse-Tab verschiebt sich nach rechts). Klick auf "Übung durchführen" / "Analyse" klappt sie wieder zu.
- Einstellungen: Kurs-Mitglieder-Editor, Admin-Rolle, freigeschaltete Fächer pro Kurs.

### Cluster J — Themen-Kacheln Refactor
- Kachel-Hover auf globalen Standard.
- Interne Buttons (Lernziele / Link / Aktuell / Abschliessen / Deaktivieren…): einheitliche Höhe, Standard-Hover.
- **"Aktuell"-Button ganz links** positionieren, damit andere nicht verschoben werden → aufgeräumter.
- Fach-Filter-Buttons auf Standard.
- **Fehlend:** abgeschlossenes freigegebenes Thema wieder als "Aktuell" markierbar machen (Aktion prüfen / ergänzen).

### Cluster K — Frageneditor, Metadaten, Namens-Refactor
**Defaults:**
- Zeitbedarf: default leer.
- Bloom-Stufe: default leer.
- Fach (früher Fachbereich): default leer + Pflichtfeld-violett hervorgehoben.

**Pflichtfeld-Violett konsequent:**
- Thema hat Stern, aber wird nicht violett eingefärbt → fixen.
- Audit: alle Pflichtfelder mit Stern müssen violett hervorgehoben sein.

**KI-Button-Blau:**
- Metadaten "KI klassifizieren" und Bewertungsraster "KI verbessern" sind nicht blau — prüfen: wenn deaktiviert (weil Voraussetzungen fehlen) ist Weglassen OK, sonst einfärben.

**Namens-Refactor (app-weit):**
- "Fachbereich" → "Fach" **überall** (UI, Labels, Drop-downs).
- "Fragenbank" → "Fragensammlung" **überall** (inkl. Text "Lernziele aus der Fragenbank" unten bei Lernzielen).
- "Übungspool: …" Präfix aus Themen-Namen entfernen (Lernziele-Dropdown etc.).
- ae/oe/ue → ä/ö/ü Audit (Bewertungsraster-Beispiele und andere Stellen).

**Semester → Zeitpunkt (konfigurierbar):**
- Umbenennen "Semester" → "Zeitpunkt".
- Einstellungen: Modus wählbar (Schuljahr / Semester / Quartal) + Anzahl Einheiten. Grund: Schule geht vermehrt auf Quartale, TaF-Klassen haben ein Jahr länger.

**Gefässe konfigurierbar:**
- Einstellungen: Gefässe definierbar. Aktuelle Liste bleibt Default.

**Lernziele:**
- Thema: Dropdown analog Fach (derzeit freitext).
- "Fachbereich" im Lernziele-Dropdown → "Fach".

**Header-Umbau:**
- "Geteilt mit" in Kopfzeile links vom KI-Button.

---

## Session 109 — Cluster B: Sidebars vereinheitlicht (14.04.2026)

### Stand
Auf `main` gemergt (`9a3b6c7`). tsc ✅ | 239 Tests ✅ | Build ✅. Auf Staging vom User verifiziert.

### Erledigte Arbeiten

**Cluster B Quick-Wins (Commit `2197d6c`)**
- B1: Resize-Handles 3 Sidebars (Frageneditor/LP-Hilfe/Fragensammlung) auf konsistenten violetten Hover.
- B3: SuS-Hilfe Tipp-Box von blau auf neutral (Blau bleibt KI-reserviert).
- B4: Problem-melden-Icon 💬 → ⚠️.
- Bonus: launch.json Pfad `/Pruefung` → `/ExamLab` (S107-Relikt).

**Cluster B Nachträge (Commit `caddf09`)**
- HilfeSeite z-50 → z-[60] (lag hinter Frageneditor).
- EinstellungenPanel maxWidth 640 → 2000.

**Refactor: gemeinsame ResizableSidebar (Commit `e68e418`)**
- Eine Komponente in `packages/shared/src/ui/ResizableSidebar.tsx` ersetzt zwei Implementationen (alte ExamLab-`ResizableSidebar` + 3× duplizierte `usePanelResize`-JSX-Blöcke).
- Modi: `layout` (im flex) und `overlay` (fixed + Backdrop).
- ESC + Klick-Backdrop einheitlich (closeOnEsc/closeOnBackdrop, default true).
- Tests: 239/239, vitest.config.ts mit `@shared`-Alias + react-dedupe.

**Auto-z-Index (Commit `42414c0`)**
- Modul-Counter: jede neu geöffnete overlay-Sidebar holt sich nächsthöheren z-Index. Zuletzt geöffnete liegt zuoberst, unabhängig von der Art.
- Einstellungen umgestellt auf `mode='overlay'` + Backdrop + Klick-daneben.

**Toggle-Trigger + einheitliche Breiten (Commit `5097589`)**
- Store-Action `toggleEinstellungen` analog `toggleHilfe`.
- LPStartseite: `setZeigEinstellungen(true)` → `toggleEinstellungen()`.
- LPHeader: `einstellungenOffen`-Prop + `buttonActiveClass` für alle drei Trigger (Fragensammlung/⚙/Hilfe) — aktive Sidebar-Buttons visuell markiert.
- ResizableSidebar einheitliche Defaults: defaultWidth=1008, minWidth=400, maxWidth=2400. Konsumenten setzen nur `storageKey` + `topOffset`.

**Resize-Handle dezent (Commit `cbd07cf`)**
- bg-transparent per Default, hover bleibt violett. Greifbar bleibt der 4px breite Bereich via `cursor-col-resize`.

### Architektonisches Ergebnis
Alle 4 Sidebars (Einstellungen/Frageneditor/Hilfe/Fragensammlung) haben jetzt **identisches Verhalten**:
- Öffnen/Schliessen per Icon-Toggle, Aktiv-Visual am Trigger.
- Schliessen per ESC oder Klick auf Backdrop.
- Resize per violettem Handle links (transparent ohne Hover).
- Gleiche Min/Max/Default-Breiten.
- Auto-z-Index (zuletzt geöffnet zuoberst).

### Gelöscht
- `ExamLab/src/components/ui/ResizableSidebar.tsx` (Duplikat)
- `ExamLab/src/hooks/usePanelResize.ts` (Duplikat)
- `packages/shared/src/editor/hooks/usePanelResize.ts` (kein Konsument mehr)
- Export `usePanelResize` aus `packages/shared/src/index.ts`

### Offen / Nächste Sessions
- **B2 Hover-Zustände konsistent** (vage — konkrete Stellen aus Browser-Test nötig)
- **B5 Icon-Audit** (eigene Session)
- **Cluster D**: Routing/URLs (LP-URL `/lp/...`, D1/D3 Logout-URL Cleanup)
- **Cluster E**: LP-Favoriten-Kacheln, Analyse-Doppelzählung, Übersicht-Tab Sinn klären, Mastery-Hilfe, Excel-Export, KI-PDF-Import (E5 als eigene Session)

---

## Session 108 — Cluster C (Demo-Modus) + Cluster A (SuS-Üben Layout) (14.04.2026)

### Stand
Bereit für main-Merge. Auf preview vollständig im Browser verifiziert (Demo-LP + Demo-SuS).
tsc ✅ | 236 Tests ✅ | Build ✅.

### Backlog-Status (aus LP/SuS-Test 14.04.)
- **Cluster A (SuS-Üben Layout): A1–A7 ALLE GRÜN** ✅
- **Cluster C (Demo-Modus): ALLE GRÜN** ✅
- Cluster B/D/E offen (siehe unten)

### Cluster C — Root Causes & Fixes
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| C1 Demo-LP-URL `/sus` | Folgebug von SW-Cache + istDemoModus-Verlust nach Reload | siehe C4 |
| C2 Fragensammlung leer | `einrichtung`-Tag-Filter in 6 Stellen | `useFragenFilter`+5 weitere: !istDemo Guard |
| C3 Favoriten leer | demoStarten seedet Favoriten nicht | useFavoritenStore.setState im Demo |
| C4 "Backend nicht erreichbar" | istDemoModus aus sessionStorage entfernt nach Reload | restoreDemoFlag aus User-E-Mail (DEMO-EMAILS) |
| C5 Üben keine Übungen (admin-typo) | demo.lp vs demo-lp in UebungsToolView | sed-Fix |
| C6 "Gruppen werden geladen" | Folgebug C4 | identisch |
| C7 Abmelden hängt | nur uebenAuthStore | beide Stores + window.location |
| Neu: weisser Bildschirm /staging/sus | 404.html hatte /ExamLab/ hardcoded | dynamische Bases |
| Neu: TDZ "Vp before init" | DEMO_EMAILS const nach create() | inline in restoreDemoFlag |
| Neu: Demo-LP "0 Themen" Üben | 3 weitere einrichtung-Filter im Üben-Admin | Demo-Guard in 3 Stellen |
| Neu: Demo-SuS keine Übungsfragen | uebenFragenAdapter ruft Backend für 'demo-gruppe' | Lazy-import einrichtungsFragen |
| Neu: Logout URL hängt → Re-Login Loop | abmelden hatte kein Redirect | window.location.href = /login |
| Neu: SuS direkt in Prüfung statt SuSStartseite | App.tsx Guard zu strikt | Deep-Link-Erkennung /sus/ueben\|pruefen |
| Neu: AbgabeBestätigung-Link öffnete Prüfung | href = parent-Pfad | href = /sus/ueben (SuS) bzw. /favoriten (LP) |
| Konsistenz: Daten "Einrichtung" vs UI "Einführung" | Demo-Daten hatten alte Bezeichnung | Tag/Thema umbenannt + Filter abwärtskompatibel |

### Cluster A — Layout/UX-Fixes (Dashboard.tsx, EmpfehlungsKarte, SuSAnalyse)
| # | Fix |
|---|-----|
| A1 | zurueckZuThemen resettet Fach-Filter |
| A2 | Suchfeld in Mix/Repetition-Zeile rechtsbündig |
| A3 | "Alle Themen"-Toggle + Sortier in Fach-Filter-Zeile rechtsbündig |
| A4 | Fach-Sektionen ein-/ausklappbar (localStorage) |
| A5 | "Für dich empfohlen" + "Aktuelle Themen" amber → violett |
| A6 | Sub-Tabs linksbündig (analog LP) |
| A7 | SuSAnalyse: nur freigeschaltete Themen + ausklappbar mit Top-5 schwierigsten Fragen |

### Infrastructure-Patches direkt auf main (notwendig für Staging-Build)
- `0ba9af3` 404.html: dynamische Base (ExamLab + staging)
- `5db1c14` CI: Staging-Build installiert packages/shared deps

### Offen (Cluster B/D/E aus Backlog)
Siehe Backlog-Sektion in Session 107-Block weiter unten.

---

## Session 107 — Rename Pruefung→ExamLab + Kontenrahmen 2850 + Lernziele einklappen (14.04.2026)

### Stand
Auf `main` gemergt (`e5f798a` + `d4c87b6`). tsc ✅ | 236 Tests ✅ | Build ✅. **Noch nicht im Browser verifiziert** — bei nächster Gelegenheit prüfen: FiBu-2850-Label, Lernziele-Einklappen, Deploy-URLs (/ExamLab/ + Redirect /Pruefung/).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| Kontenrahmen 2850 | Runtime-JSON: "Aktienkapital" → "Privat (Privatkonto)" (HANDOFF-S106-Fund: Z295 Privatentnahme zeigte falsches Label) | `ExamLab/src/data/kontenrahmen-kmu.json:37` |
| LP-Einstellungen Lernziele | Fach- und Thema-Gruppen einklappbar (Default collapsed). Bei aktivem Filter/Suche automatisch expandiert. Anzahl pro Gruppe im Header. | `ExamLab/src/components/settings/LernzielTab.tsx` |
| Ordner-Rename | `Pruefung/` → `ExamLab/`, `Uebungen/` → `ExamLab/Uebungen/`. Pfade in CI (`deploy.yml`), Rules, Docs, Scripts angepasst. Deploy-URL `/ExamLab/` bleibt gleich, `/Pruefung/` redirected. | 947 Renames via `git mv`, sed auf `.yml/.md/.html/.mjs` |
| Cleanup | `IMPROVEMENT_PLAN.md` + `PLANUNGSDOKUMENT_v2.md` gelöscht (veraltet) | — |

### Offen / TODO nächste Session
- **E2E-Browser-Test** mit LP + SuS Login nach Merge prüfen: FiBu-Dropdown zeigt 2850 korrekt, Lernziele-Einklappen funktioniert, Deploy nach Push in beiden URLs erreichbar.
- Weitere alte Docs prüfen: `ExamLab/PLANUNGSDOKUMENT_v2.md` (29.03.2026), `ExamLab/Google_Workspace_Setup.md` — bei Bedarf löschen.
- Memory-Einträge aktualisieren: `Pfad: Pruefung/` → `Pfad: ExamLab/`.

---

## Session 106 — E1 FiBu-Fix + Feedback-System-Aufräumarbeiten (14.04.2026)

### Stand
Auf `main`. tsc ✅ | Tests ✅. E2E im Browser verifiziert (3 Fragen).

### E1 — FiBu-Buchungssatz Fixes (Hauptarbeit)

**Bug A** (Dropdown-Konten fehlten) + **Bug B** (richtige Antworten als falsch gewertet) — Root Cause: 19 von 41 FiBu-Fragen im **dritten Format** `{soll, haben, betrag}` (Kurz-Feldnamen ohne `Konto`-Suffix). Auto-Korrektur erwartet `{sollKonto, habenKonto, betrag}`.

| Fix | Datei |
|-----|-------|
| KI-Prompts vereinfachtes Format | `apps-script-code.js` (`generiereBuchungssaetze`, `generiereFallbeispiel`, `generiereBilanzStruktur`, `pruefeBuchungssaetze`) |
| Save-Guard `ergaenzeFehlendeKontenInAuswahl_` | `apps-script-code.js` |
| Diagnose-Script v2 (alle 3 Formate erkennen) | `ExamLab/scripts/diagnose-fibu-fragen-v2.js` |
| Migrations-Script (3. Format unterstützen) | `ExamLab/scripts/migrate-fibu-fragen.js` |

**Migration-Ergebnis (LIVE):** 19/41 Fragen konvertiert, 0 Fehler. Re-Diagnose: 0 Probleme.

**Browser-Test bestätigt:**
- Z292 Warenverkauf 6'000 (1100/3200/6000) → ✅ Richtig
- Z295 Privatentnahme 2'000 (2850/1000/2000) → ✅ Richtig
- Z299 Transitorische Aktive 3'000 (1300/6000/3000) → ✅ Richtig

### Feedback-System neu aufgesetzt

| Schritt | Ergebnis |
|---------|----------|
| Sheet umbenannt: `uebungspool_analyse` → `ExamLab Problemmeldungen` | ✅ |
| Tab `Pruefung-Feedback` → `ExamLab-Problemmeldungen` (15 Spalten) | ✅ |
| Apps Script (gleiches Sheet) Code aktualisiert + neu bereitgestellt | ✅ |
| **Bug:** Image-Ping → 503 wegen Multi-Account-Routing (`/u/N/`) | gefixt → `fetch(no-cors)` in `FeedbackModal.tsx` |
| **Bug:** SuS in aktiver Übung bekam App-Kategorien statt Frage-Kategorien | gefixt → `ort = 'frage-ueben'` bei `aktuellerScreen === 'uebung'` in `AppShell.tsx` |
| Endpoint-URL in `pool.html` + `analytics/SETUP.md` mit aktualisiert | ✅ |

### Offene Punkte (für nächste Session)

- **Kontenrahmen-Labeling-Bug:** Konto **2850 wird als "Aktienkapital" gelistet**, sollte aber im KMU-Schweizer-Kontenrahmen "Privatkonto / Privatbezüge" sein. Sichtbar bei Z295 (Privatentnahme): Korrekturhinweis sagt "Privat (Unterkonto EK)", Dropdown-Label aber "Aktienkapital". Quelle: `packages/shared/src/editor/kontenrahmenDaten.ts`.
- Re-Diagnose nach Re-Migration nochmal nach KI-Generierung neuer Buchungssätze (zur Bestätigung dass der neue KI-Prompt direkt vereinfachtes Format erzeugt).

### Commits
- `2cb9563` E1: KI-Prompts + Save-Guard + Scripts
- `616834e` Feedback: dediziertes Sheet (verworfen)
- `b1699e1` Feedback: Tab-Rename + Spalten
- `0244f5b` Feedback: neue Endpoint-URL
- `760c09e` Pool.html + SETUP.md URL-Update
- `532dfc9` FeedbackModal: Image-Ping → fetch
- `e42339f` AppShell: SuS-Übung Frage-Kategorien
- `9e6e781`, `535d7a7`, `fc03cdc` Diagnose-/Migrations-Iterationen

---

## Session 105 — C11 + C9 + Wording-Nacharbeit (14.04.2026)

### Stand
Auf `main`. tsc ✅ | 236 Tests ✅. E2E-Browser-Test mit echten Logins (LP + SuS Tab-Gruppe) durchgeführt.

### Erledigte Arbeiten

| # | Änderung | Datei |
|---|----------|-------|
| C11 | **LP-Üben "Backend konnte nicht erreicht werden":** Timeout 30s→60s (Apps Script Cold-Start kann >30s dauern). Zusätzlich Ref-Guard (`loginGestartetRef`) gegen Doppel-Login-Effect, Retry-Handler setzt Ref zurück. | `services/ueben/apiClient.ts`, `components/lp/UebungsToolView.tsx` |
| C9 | **Demo-LP Prüfen-Tab:** War SW-Cache. Nach S104-Deploy grün verifiziert — "Einführungsprüfung" lädt korrekt, keine dynamic import errors. Kein Code-Fix. | – |
| Wording | **demoMonitoring.ts:10** — "Einrichtungsprüfung" → "Einführungsprüfung" (S104 hatte diese Datei übersehen, zeigt sich im Demo-Monitoring). | `data/demoMonitoring.ts` |

### Root Cause C11
- `apiClient.ts` hatte 30s Timeout. Apps Script Cold-Start > 30s → AbortController abortet → `null` → `loginStatus: 'fehler'` → "Das Backend konnte nicht erreicht werden."
- Zusätzlich: Login-Effect hatte `loginStatus` in Dep-Array → nach `setLoginStatus('fertig')` triggerte ein Re-Run unter Umständen einen zweiten Login-Call (Logs zeigten 2× "LP-Login starten").

### Offene Punkte
- **E1 FiBu-Buchungssatz-Audit** — richtige Antworten werden als falsch gezählt, fehlende Dropdown-Optionen bei diversen Aufgaben. Sheet-Daten + KI-Generator-Prompt prüfen. Eigener Block.
- Nach Deploy nochmal echten LP-Login testen, ob C11 jetzt stabil läuft (auch bei Cold-Start).

---

## Session 104 — Bundle 8: UX-Harmonisierung (14.04.2026)

### Stand
Auf `main`. tsc ✅ | 236 Tests ✅ | Build ✅. Browser-Test teilweise im Demo-Modus ✅ — E2E-Test mit echtem Backend + Tab-Gruppe steht aus.

### Erledigte Arbeiten (aus User-Test 14.04.)

| Block | Commit | Inhalt |
|-------|--------|--------|
| A+B | `fafa6ab` | **Design-Harmonisierung:** Aktive Tabs grau statt violett (TabBar), primary-Button violett (CTAs "+Neue …"), Filter-Buttons dezent via `.filter-btn` / `.filter-btn-active`-Utility, LP "Durchführen" → "Prüfung starten" + violett, SuS-Startbildschirm violett, Bild-Upload-Dropzone violett (Pflichtfeld). **Wording:** "Einrichtungsprüfung" → "Einführungsprüfung", Folgesatz "Lerne ExamLab kennen" harmonisiert (Prüfung + Übung). |
| C7 | `d0565a1` | **Übungsthemen deaktivieren:** aktive Themen haben zwei Aktionen (Abschliessen + Deaktivieren), abgeschlossene können ebenfalls deaktiviert werden → zurück auf `nicht_freigeschaltet`. |
| D12 | `d0565a1` | **LP-Aufträge-Tab gelöscht** — TabBar nur noch Übersicht + Themen. `AdminAuftraege.tsx` entfernt. Store + SuS-Anzeige bleiben (bei Bedarf neu implementieren). |
| C10 | `2198fdb` | **BerechnungEditor-Layout:** Bezeichnung auf eigene Zeile (volle Breite), darunter 3-Spalten-Grid (Ergebnis / Toleranz / Einheit) mit Mini-Labels. Pro Ergebnis in eigene Card. |
| A4 | `2198fdb` | **Zeitbedarf-Violett-Fix:** Globale Regel `input[type="number"]:not(:placeholder-shown)` färbte alle ausgefüllten Number-Inputs violett. Regel schliesst jetzt `.input-field`, `.input-field-narrow`, `.no-answer-highlight` aus. |
| C8 | `d0fde8b` | **Favoriten-Baum:** Labels = Tab-Namen ("Prüfen" / "Üben"), Kinder = Sub-Tabs (Analyse, Übung durchführen, Multi-Monitoring). Parent-Pfad = Default-Sub-Tab, keine doppelten Pfade. |

### Offene Punkte aus dem User-Test (priorisiert)

| # | Thema | Status |
|---|-------|--------|
| C9 | Demo-LP Prüfen-Tab "keine Prüfung" + dynamic import error | Im Demo-Modus war die Einführungsprüfung vorhanden — evtl. SW-Cache auf GitHub Pages. **Nach Deploy nochmal testen.** |
| C11 | LP-Üben "Backend konnte nicht erreicht werden" | Nur mit echtem Backend reproduzierbar. **E2E mit Tab-Gruppe nötig.** |
| E1 | **FiBu-Buchungssatz inhaltlich** — richtige Antworten werden als falsch gezählt, nötige Konto-Dropdown-Optionen fehlen bei diversen Aufgaben. **Alle bestehenden FiBu-Buchungssatz-Fragen im Sheet auditieren.** Zusätzlich KI-Generierungs-Prompt prüfen. | Eigener Block — braucht Sheet-Zugriff. |

### Dateien (neu / geändert)
- `ExamLab/src/components/ui/TabBar.tsx` — aktives Tab slate statt violett
- `ExamLab/src/components/ui/Button.tsx` — primary = violett
- `ExamLab/src/index.css` — `.filter-btn` / `.filter-btn-active` Utilities, number-input Regel entschärft
- `ExamLab/src/components/lp/LPStartseite.tsx` — CTA + Filter-Pills
- `ExamLab/src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx` — filter-btn-Utility
- `ExamLab/src/components/Startbildschirm.tsx` — SuS-CTA violett
- `ExamLab/src/components/ueben/admin/AdminDashboard.tsx` — Aufträge-Tab weg
- `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx` — Deaktivieren-Button
- `ExamLab/src/components/ueben/admin/AdminAuftraege.tsx` — **gelöscht**
- `ExamLab/src/config/appNavigation.ts` — Labels = Tab-Namen
- `ExamLab/src/data/einrichtungsPruefung.ts` / `einrichtungsUebung.ts` / `demoKorrektur.ts` — Wording
- `packages/shared/src/editor/typen/BerechnungEditor.tsx` — Layout-Umbau
- `packages/shared/src/editor/components/BildUpload.tsx` — Dropzone violett

### Kontext für nächste Session (Tab-Gruppe)
- **Setup:** Tab 1 LP `wr.test@gymhofwil.ch`, Tab 2 SuS `wr.test@stud.gymhofwil.ch`, Kontrollstufe "Locker"
- **Zu testen nach Deploy:**
  1. C9 – Demo-LP ohne Login starten, Prüfen-Tab → dynamic import? Einführungsprüfung sichtbar?
  2. C11 – LP-Üben-Übungen öffnen → Backend-Fehlermeldung reproduzieren (Console + Network)
  3. Regressions: Übungsthemen deaktivieren/abschliessen (echte Gruppe), Frageneditor alle Fragetypen, Favoriten-Stern auf Baum-Einträgen
- **Dann E1:** FiBu-Buchungssatz-Audit. Scripts in `ExamLab/scripts/` (diagnose-fibu-fragen.js / repair-fibu-fragen.js sind aus S95 für Musterlösungen). Neue Problematik ist Dropdown-Optionen + Musterlösung-Fehler bei Buchungssatz-Typ.

---

## Session 103 — Design-Bundle 6+7: Einheitliches Design-System (14.04.2026)

### Stand
Auf `main` (Branch `feature/design-system` gemergt in Session 104).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| 1 | **CSS-Grundlagen** — `.input-pflicht` (violetter Rahmen+BG), Focus-Ring global violet-500, Elevation Dark-Mode-Fixes | index.css |
| 2 | **TabBar-Komponente** — Shared Pill-Tabs mit violettem Akzent, ARIA, Keyboard-Navigation. 6 Tests. | TabBar.tsx, TabBar.test.tsx |
| 3 | **7 Tab-Migrationen** — Alle manuellen Tabs durch TabBar ersetzt: LPHeader, EinstellungenPanel, AdminDashboard (Üben), AdminSettings, PruefungsComposer, DurchfuehrenDashboard, KorrekturDashboard | 7 Dateien |
| 4 | **ResizableSidebar** — Drag-Resize + Maximize, Pointer Events (Touch-kompatibel), localStorage-Persistenz. 4 Tests. | ResizableSidebar.tsx, ResizableSidebar.test.tsx |
| 5 | **EinstellungenPanel → ResizableSidebar** — Fixes Slide-Over durch Side-by-Side ersetzt. Eltern-Container (LPStartseite, DurchfuehrenDashboard) auf Flex-Layout. | EinstellungenPanel.tsx, LPStartseite.tsx, DurchfuehrenDashboard.tsx |
| 6 | **Button ki-Variante** — Blau wenn KI-API aktiv, Grau wenn inaktiv. `getVariantClasses()` Funktion. | Button.tsx |
| 7 | **KI-Buttons blau/grau** — `InlineAktionButton` mit `kiAktiv`-Prop | KIBausteine.tsx |
| 8 | **Pflichtfelder violett** — Fragetext, MC-Optionen, R/F-Aussagen, Punktzahl mit `.input-pflicht` | 4 Editor-Dateien |
| 9 | **Korrektur-Punkte violett** — Focus-Ring violet-500, unbewertete Felder hervorgehoben | 4 Korrektur-Dateien |
| 10 | **Kontrast-Fixes** — 15 gezielte Fixes: Close-Buttons, Form-Labels, Icons von slate-400/500 auf slate-600/300 | 11 Dateien |

### Neue Shared Components
- **`src/components/ui/TabBar.tsx`** — Pill-Tabs, Props: `tabs, activeTab, onTabChange, size`
- **`src/components/ui/ResizableSidebar.tsx`** — Props: `title, onClose, side, defaultWidth, minWidth, maxWidth, storageKey`

### Design-Entscheidungen (validiert via Mockups)
- **Violett (#8b5cf6)** identisch in Light und Dark Mode
- **Farb-Rollen:** Violett = Navigation/Focus, Blau = KI (aktiv), Slate = Primary/Secondary
- **Inaktive Tabs:** slate-700 (Light) / slate-300 (Dark) für besseren Kontrast
- **Icons/Labels:** slate-600 (Light) / slate-300 (Dark)
- **Mockups:** `.superpowers/brainstorm/session-1776118380/` (6 HTML-Dateien)

### Kontext
- **Spec:** `docs/superpowers/specs/2026-04-14-design-bundle-6-7-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-14-design-bundle-6-7.md`
- **Scope-Abgrenzung:** Frageneditor-Sidebar und Korrektur-Sidebar NICHT auf ResizableSidebar migriert — nur EinstellungenPanel als erster Anwender.
- **Nächste Session:** Browser-Test, dann Merge auf main. Danach: weitere Sidebar-Migrationen, KI-Bild-Generator Backend, oder offene Bugs.

---

## Session 102 — Bundle 5: Bildfragen-Editor (14.04.2026)

### Stand
Auf `main`. tsc ✅ | 226 Tests ✅ | Build ✅. Browser-Test ausstehend (violet-Farben + Bild-Persistenz).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| N7 | **Violette Pins/Zonen** — `@source`-Direktive in index.css hinzugefügt, damit Tailwind v4 die violet-Klassen aus `packages/shared/src/` scannt. Klassen waren korrekt im Code, aber nicht im generierten CSS. | index.css |
| N19 | **Bild-Persistenz bei Fragetyp-Wechsel** — 3 separate bildUrl-States (hsBildUrl, bbBildUrl, ddBildUrl) zu einem gemeinsamen `bildUrl`-State konsolidiert. Bild bleibt beim Wechsel zwischen Hotspot/Bildbeschriftung/DragDrop erhalten. | SharedFragenEditor.tsx, TypEditorDispatcher.tsx |

### Kontext
- **Spec:** `docs/superpowers/specs/2026-04-13-bundle5-bildfragen-editor-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-13-bundle5-bildfragen-editor.md`
- **N6 (doppeltes Bild):** War bereits gelöst, kein Handlungsbedarf.
- **@source Direktive:** `@source "../../packages/shared/src";` in Zeile 2 von `index.css`. Muss beibehalten werden, damit shared-package Tailwind-Klassen funktionieren.
- **Nächste Session:** Browser-Test Bundle 5, dann Bundle 6 (KI-UI) oder Bundle 7 (Design-Konzept).

---

## Session 101 — Bundle 4: Layout-Umbau Durchführen (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 226 Tests ✅ | Build ✅. Browser-Test ✅ (Demo-Modus, Prüfen + Üben + Fragensammlung).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| N15 | **Suchfeld in Tab-Zeile** — Suchfeld aus eigener Zeile in die Tab-Zeile verschoben (rechtsbündig). Sort-Dropdown in Filterzeile verschoben. Gilt für Prüfen und Üben. | LPStartseite.tsx |
| N16 | **CTA-Buttons konsistent primary** — "+Neue Prüfung", "+Neue Übung", "+Neue Frage" nutzen jetzt shared `Button` variant="primary". Aus Header in Filterzeile verschoben. Empty-State Buttons ebenfalls umgestellt. `cursor-pointer` in Button.tsx ergänzt. | LPStartseite.tsx, Button.tsx, FragenBrowserHeader.tsx |

### Kontext
- **Spec:** `docs/superpowers/specs/2026-04-13-bundle4-layout-umbau-durchfuehren-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-13-bundle4-layout-umbau-durchfuehren.md`
- **aktionsButtons Prop:** Wird nicht mehr von LPStartseite für Prüfen/Üben übergeben (`undefined`). Prop bleibt auf LPHeader für andere Aufrufer (PruefungsComposer etc.).
- **Nächste Session:** Bundle 5 (Bildfragen-Editor) oder anderes offenes Bundle.

---

## Session 100 — Bundle 3: Übungs-Themen UX (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 226 Tests ✅ | Build ✅. Browser-Test ausstehend.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| N14 | **Übungs-Einstellungen ins globale EinstellungenPanel** — Neuer Tab "Übungen" (sichtbar wenn aktiveGruppe). AdminDashboard hat nur noch 3 Tabs (Übersicht, Aufträge, Themen). | EinstellungenPanel.tsx, AdminDashboard.tsx, lpUIStore.ts |
| N9 | **Konfigurierbares Limit aktuelle Themen** — `maxAktiveThemen` in GruppenEinstellungen (Default 5). Slider in AllgemeinTab (1–20). FIFO-Logik liest dynamisch aus settingsStore. `MAX_AKTIVE_THEMEN`-Konstante entfernt. | settings.ts, themenSichtbarkeit.ts, themenSichtbarkeitStore.ts, AdminThemensteuerung.tsx, AllgemeinTab.tsx |
| N12 | **LP-Status-Differenzierung** — Nicht freigeschaltete Themen: opacity 70% + 🔒-Icon | AdminThemensteuerung.tsx |
| N11 | **SuS-Sortierung mit Sektionen** — Aktuelle Themen zuoberst (fachübergreifend), dann Fach-Sektionen. Sortier-Toggle (alphabetisch / zuletzt geübt). localStorage-Persist. "Weitere Themen"-Sektion für nicht freigeschaltete. | Dashboard.tsx |

### Kontext
- **Spec:** `docs/superpowers/specs/2026-04-13-bundle3-uebungs-themen-ux-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-13-bundle3-uebungs-themen-ux.md`
- **Edge Case maxAktiveThemen:** Wenn Limit unter aktuelle Anzahl gesenkt wird, bleiben bestehende Themen aktiv. Limit greift erst bei nächster Aktivierung.
- **Nächste Session:** Bundle 4 (Layout-Umbau Durchführen) oder eines der anderen offenen Bundles.

---

## Session 99 — Bundle 2: Favoriten-Redesign (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 227 Tests ✅ | Build ✅. Browser-Test ✅ (Demo-Modus, localhost).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| 1 | **Route-Registry `APP_NAVIGATION`** — Zentrale Baumstruktur aller navigierbaren LP-Orte als Single Source of Truth. 4 Kategorien (Prüfen, Üben, Fragensammlung, Einstellungen) mit Kindern. `nurAdmin`-Flag für Admin-Tab. | `src/config/appNavigation.ts` (NEU) |
| 2 | **Home → Favoriten umbenannt** — Route `/home` → `/favoriten`, Komponente Home.tsx → Favoriten.tsx, `navigiereZuHome` → `navigiereZuFavoriten`, alle Redirects (AuthGuard, LoginScreen, Router) aktualisiert | Favoriten.tsx, Router.tsx, AuthGuard.tsx, useLPNavigation.ts, useLPRouteSync.ts, LoginScreen.tsx |
| 3 | **FavoritenTab Baumstruktur** — Flaches Dropdown ersetzt durch aufklappbare Baumansicht aus `APP_NAVIGATION` mit ☆ Stern-Toggle pro Eintrag. `istAdmin` Prop von EinstellungenPanel durchgereicht. | FavoritenTab.tsx, EinstellungenPanel.tsx |
| 4 | **Header-Umbau** — Neuer Tab "Favoriten" (Direktnavigation, nicht via Modus-System). ⭐-Dropdown + FavoritenDropdown komplett entfernt. Logo-Klick → `/favoriten`. `onHome` Prop entfernt (aus LPHeader, Favoriten, LPStartseite, PruefungsComposer). | LPHeader.tsx, Favoriten.tsx, LPStartseite.tsx, PruefungsComposer.tsx |

### Kontext
- **Spec:** `docs/superpowers/specs/2026-04-13-bundle2-favoriten-redesign-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-13-bundle2-favoriten-redesign.md`
- **Tabs im Header:** Favoriten | Prüfen | Üben | Fragensammlung
- **Logo-Klick:** Geht immer zu `/favoriten` (auch aus Composer). "← Zurück"-Button existiert separat fürs Dashboard.
- **Favoriten-Seite:** Inhalt identisch mit ehemaliger Home-Seite (Favoriten-Karten + Korrekturen + Prüfungen/Übungen)
- **FavoritenTab (Einstellungen):** Oben sortierbare Favoriten (Drag & Drop), unten Baumansicht mit Stern-Toggles

---

## Session 98 — Bundle 1: Quick Wins UX-Korrekturen (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 227 Tests ✅ | Build ✅. Browser-Test auf GitHub Pages ausstehend.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| N17 | **Dropdown-Label "Fachbereich" → "Fach"** — Nur UI-Label im Gruppieren-Dropdown, interner Value bleibt `fachbereich` | FragenBrowserHeader.tsx |
| N18 | **Icons bei Fragetyp-Kategorien entfernt** — Emoji-Icons aus der Fragetyp-Auswahl entfernt, nur Text | FrageTypAuswahl.tsx |
| N10 | **Übungs-Labels umbenannt** — "Aktiv"→"Aktuell", "z.T. aktiv"→"z.T. aktuell", "Abgeschl."→"Freigegeben", kein Badge für nicht freigeschaltete Themen | AdminThemensteuerung.tsx |
| N13 | **Fach-Farbpunkt links (SuS)** — Farbpunkt vor den Themennamen verschoben (wie LP-Ansicht) | ThemaKarte.tsx |
| N3 | **Fragensammlung-Button auf Dashboard ausgeblendet** — Button nur noch auf Sub-Pages sichtbar | LPHeader.tsx |
| N5+N6 | **Bildvorschau entfernt** — Kleine Bildvorschau in BildUpload entfernt. "Bild entfernen" als Textbutton rechts neben URL-Feld. | BildUpload.tsx |

### Kontext
- **Task-Liste:** `docs/tasks/2026-04-13-ux-verbesserungen.md` — Alle 21 UX-Punkte aus User-Test, in 7 Bundles gruppiert. Bundle 1 erledigt.

---

## Session 97 — Bild-Upload Fix + Routing + Bild-Editor Farben (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 227 Tests ✅ | Build ✅. Bild-Upload funktioniert. Neues Apps Script Deployment.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| 1 | **Bild-Upload Bug gefixt** — Drive-Berechtigung fehlte. `autorisiereAlleScopes()` + `userinfo.email` Scope. Neues Deployment. | apps-script-code.js, appsscript.json |
| 2 | **Upload-Fehlerbehandlung** — Backend-Fehlermeldungen werden angezeigt | uploadApi.ts, BildUpload.tsx, types.ts, SharedFragenEditor.tsx, ZeichnenEditor.tsx |
| 3 | **Drive Bild-URLs** — `drive.google.com/uc?id=...` → `lh3.googleusercontent.com/d/{id}`. Neue `driveImageUrl()` Hilfsfunktion. | BildUpload.tsx, ZeichnenEditor.tsx, mediaUtils.ts |
| 4 | **404.html SPA-Routing** — Fängt bekannte Routes ohne Base-Path ab | 404.html |
| 5 | **index.html Decoder** — Base-Path beim `?p=` Dekodieren ergänzt | index.html |
| 6 | **LPHeader Navigation** — `useNavigate()` statt `window.location.pathname` | LPHeader.tsx |
| 7 | **Bild-Editoren Farbkonzept** — Pins/Zonen/Rechtecke: violett. Listen-Nummern: slate. | HotspotEditor.tsx, BildbeschriftungEditor.tsx, DragDropBildEditor.tsx |

### Kontext
- **Apps Script URL geändert** — Neues Deployment wegen Drive-Scope. GitHub Secret + `.env.local` aktualisiert.
- **Trick für Scope-Autorisierung**: Temporären Scope in appsscript.json → `autorisiereAlleScopes()` → Popup → genehmigen → Scope entfernen → neu deployen.

---

## Session 96 — A1: Deep Links, Home-Startseite & React Router (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 227 Tests ✅ | Build ✅. Browser-Test ✅ (Demo-Modus, P1-P4).

### Erledigte Arbeiten
- **Phase 1:** React Router Foundation — `react-router-dom`, `404.html` für GitHub Pages, BrowserRouter + AuthGuard + Hash-Migration
- **Phase 2:** LP Hash-Routing ablösen — `useLPNavigation` + `useLPRouteSync` Hooks, Hash-Funktionen entfernt
- **Phase 3:** Home + Favoriten — `favoritenStore` (typ/ziel/label/sortierung), Home-Dashboard (5 Sektionen), FavoritenTab mit @dnd-kit Drag & Drop
- **Phase 4:** SuS-Üben Routes — `useSuSNavigation` + `useSuSRouteSync`, 9 SuS-Routes, navigationStore entkernt

### Neue Dateien (11)
- `404.html`, `src/router/Router.tsx`, `src/router/AuthGuard.tsx`, `src/router/hashMigration.ts`
- `src/hooks/useLPNavigation.ts`, `src/hooks/useLPRouteSync.ts`
- `src/hooks/ueben/useSuSNavigation.ts`, `src/hooks/ueben/useSuSRouteSync.ts`
- `src/store/favoritenStore.ts`, `src/components/lp/Home.tsx`, `src/components/settings/FavoritenTab.tsx`

### Architektur-Hinweise
- BrowserRouter in `src/router/Router.tsx`. LP: `useLPRouteSync` + `useLPNavigation`. SuS: `useSuSRouteSync` + `useSuSNavigation`.
- `lpUIStore.ts` (ehemals lpNavigationStore): Nur noch UI-State.
- `favoritenStore.ts`: Persist via zustand/middleware. **`selectFavoritenSortiert` NIE als Selector** (Infinite Loop) → immer `useMemo`.
- Multi-Dashboard: Unter `/pruefung/monitoring?ids=`.
- Hash-Migration: Alte `#/pruefung/...` URLs werden automatisch migriert.

---

## Session 95 — FiBu-Musterlösungen repariert (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅. 14 FiBu-Fragen im Google Sheet repariert.

### Erledigte Arbeiten
- **14 Fragen** im Sheet hatten Legacy-Format (`correct` statt `erwarteteAntworten`, `nr` statt `kontonummer` etc.)
- Repair-Scripts: `scripts/diagnose-fibu-fragen.js` + `scripts/repair-fibu-fragen.js` (nicht deployed)
- Sync-Version v4→v5 (erzwingt Re-Sync)

---

## Session 94 — FiBu-Fixes + Dashboard-Filter + Black Screen (12.04.2026)

### Stand
Auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| L1-L3 | **T-Konto Layout-Umbau:** Zunahme/Abnahme pro Seite, Kontenkategorie in Kopfzeile | TKontoFrage.tsx |
| K1 | **T-Konto Üben-Korrektur:** `k.id === konto.kontonummer` → `k.id === konto.id` | korrektur.ts |
| D1 | **Themen-Filter repariert:** `nicht_freigeschaltet` aus Default-Filter entfernt | Dashboard.tsx |
| S1-S2 | **Schwarzer Bildschirm gelöst:** Root Cause = `aktuelleFrageIndex` über Array-Ende. Auto-Beendigung + Fallback-Dashboard | AppUeben.tsx, UebungsScreen.tsx |
| E1-E2 | **Editor Null-Guards:** TKontoEditor + KontenbestimmungEditor | TKontoEditor.tsx, KontenbestimmungEditor.tsx |

---

## Session 93 — Browser-Test Bugfixes (12.04.2026)

### Stand
Auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| F1-F3 | **FiBu "Antwort prüfen"-Button:** speichereZwischenstand im Adapter, 4 FiBu-Typen migriert | useFrageAdapter.ts, uebungsStore.ts, uebung.ts, 4× Frage-Komponenten |
| B1 | **Zusammenfassung Race Condition:** Rendering-Guard bei session.beendet | AppUeben.tsx |
| G1 | **Gesperrte Themen:** Dashboard-Filter um `nicht_freigeschaltet` erweitert (mit Overlay) | Dashboard.tsx |
| U1-U4 | **UI-Fixes:** Einstellungsbutton in Durchführen, SuS-Einladen, Lernziele-Tab Links, LernzieleAkkordeon HTML | 5 Dateien |

---

## Offene Punkte (priorisiert)

### UX-Bundles (aus User-Test, 13.04.2026)

> Vollständige Task-Liste: `docs/tasks/2026-04-13-ux-verbesserungen.md`

| Bundle | Inhalt | Status |
|--------|--------|--------|
| **1** | Quick Wins (N3, N5, N6, N10, N13, N17, N18) | ✅ S98 |
| **2** | Favoriten-Redesign (N1 dynamische Struktur, N2 Tab + Home) | ✅ S99 |
| **3** | Übungs-Themen UX (N9 max 5 aktuelle, N11 SuS-Sortierung, N12 LP-Status, N14 Einstellungen verschieben) | ✅ S100 |
| **4** | Layout-Umbau Durchführen (N15 Tabs+Suche+CTA, N16 Buttons konsistent) | ✅ S101 |
| **5** | Bildfragen-Editor (N7 violette Pins/Zonen, N19 Bild-Persistenz) | ✅ S102 |
| **6+7** | Design-Bundle: KI-UI + Design-Konzept (N4 resizable Sidebar, N8 Design-Schliff, N20 KI-Buttons, N21 violette Felder) | ✅ S103 |
| **8** | UX-Harmonisierung: Design (Tabs/CTAs/Filter), Wording (Einführungsprüfung, Prüfung starten), Bugs (Deaktivieren, Berechnung-Layout, Zeitbedarf-Violett, Favoriten-Baum), D12 Aufträge-Tab weg | ✅ S104 (Teil); C9/C11/E1 offen |

### Architektur / Features

| # | Thema | Status |
|---|-------|--------|
| A2 | **KI-Bild-Generator Backend** — `generiereFrageBild` Endpoint (Claude API). Frontend steht. | Offen |
| A3 | **KI-Zusammenfassung Audio-Rückmeldungen** — Konzept erstellen | Offen (braucht A2) |

### Bugs

| # | Bug | Nächster Schritt |
|---|-----|-----------------|
| B2 | **Audio iPhone** — 19s Aufnahme speichert nur 4s | iPhone-spezifisch: MediaRecorder-Settings |
| B3 | **Abgabe-Timeout** — "Übertragung ausstehend" | Apps Script Execution Log prüfen |
| B4 | **Fachkürzel stimmen nicht** | PDF-Abgleich mit stammdaten.ts |

### Verbesserungen

| # | Thema |
|---|-------|
| V1 | **Bilanzstruktur: Gewinn/Verlust-Eingabe** |
| V3 | **Testdaten-Generator** für wr.test |
| V8 | **Ähnliche Fragen erkennen** (Duplikat-Erkennung) |

### Technische Schulden

| # | Thema |
|---|-------|
| T1 | **62 SVGs visuell prüfen** (neutrale Bilder erstellt S87) |
| T2 | **Excel-Import Feinschliff** |

### Browser-Tests (ausstehend)

| # | Test | Session |
|---|------|---------|
| BT1 | S93 Fixes (FiBu Prüfen-Button, Gesperrte Themen, Zusammenfassung) | S93 |
| BT2 | Kontenbestimmung im Browser | S87 |
| BT3 | Buchungssatz + T-Konto Dropdowns | S87 |
| BT4 | Favoriten: Backend-Sync + Direktlinks | S86 |
| BT5 | LP Profil speichern | S88 |
| BT6 | Lernziele-Tab CRUD | S88 |
| BT7 | Bild-Editor: Upload + KI-Tab | S88 |

---

## Offene Punkte (langfristig)

- **SEB / iPad** — SEB deaktiviert (`sebErforderlich: false`)
- **Tier 2 Features:** Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- **TaF Phasen-UI** — klassenTyp-Feld vorhanden, UI verschoben auf nächstes SJ
- **Monitoring-Verzögerung ~28s** — Akzeptabel

---

## Archiv (Sessions 20–92, 26.03.–12.04.2026)

> 73 Sessions komprimiert. Detaillierte Änderungslisten entfernt. Bei Bedarf via `git log` nachvollziehbar.

### Meilensteine

| Datum | Sessions | Meilenstein |
|-------|----------|-------------|
| 26.03. | 20–22 | Root-Cause-Fixes, Live-Test Bugfixes, Scroll-Bug |
| 27.03. | 23–29 | 16 Bugfixes, Toolbar-Redesign, Zeichnen-Features, Multi-Teacher Phase 1–4, Sicherheit |
| 28.03. | 30–32 | Plattform-Öffnung für alle Fachschaften, Demo-Prüfung, LP-Editor UX |
| 30.03. | 33–37 | Übungspools Fragetypen, Security-Audit, iPad-Tests |
| 31.03. | 38–44 | E2E-Tests, Security Hardening, Staging, Workflow-Umstellung |
| 01.04. | 45–49 | Batch-Writes, Request-Queue, Re-Entry-Schutz, 8 neue Pool-Fragetypen |
| 02.04. | 51–53 | Browser-Tests + 75 Pool-Fragen, Bewertungsraster, Lernplattform Design |
| 04.04. | 55–58 | Shared Editor Phase 1–5a (EditorProvider, Typ-Editoren, SharedFragenEditor) |
| 05.04. | 59–64 | Fusion Phase 1–6 (Lernplattform → Prüfungstool), Übungstool A–F, Prompt Injection Schutz |
| 05.–06.04. | 66–67a | ExamLab Overhaul, Performance, Datenbereinigung |
| 07.04. | 68–71 | Tech-Verbesserungen, Lernsteuerung, Navigation, grosses Bugfix-Paket |
| 10.04. | 72–87 | Editor-Crashes, Fragetyp-Korrektur, Navigation, Einstellungen, Stammdaten, Performance, UX-Polish, Analyse, Druckansicht, Excel-Import, Store-Migration, Favoriten, Bild-Fragetypen Reparatur |
| 11.04. | 88–90 | Improvement Plan S1–S5, Deep Links, Fachkürzel, Performance |
| 12.04. | 91–92 | Code-Vereinfachung (Adapter-Hook Refactoring), Save-Resilienz |

### Architektur (etabliert in S66–S92)

- **Adapter-Hook Pattern (S91):** `useFrageAdapter(frageId)` abstrahiert Prüfungs-/Übungs-Store
- **Fragetypen-Registry:** `shared/fragetypenRegistry.ts` (EINE Kopie, nicht zwei)
- **Shared UI:** `ui/BaseDialog.tsx`, `ui/Button.tsx`
- **Antwort-Normalizer:** `utils/normalizeAntwort.ts`
- **FrageModeContext:** `context/FrageModeContext.tsx`
- **SuS-Navigation:** Kein Start-Screen, direkt Üben-Tab. Tabs "Üben"/"Prüfen" in Kopfzeile.
- **kursId-Format:** `{gefaess}-{fach}-{klassen}` wenn gefaess≠fach, sonst `{gefaess}-{klassen}` (ohne Schuljahr)

### Security (alle erledigt ✅)
- Rollen-Bypass → restoreSession() validiert E-Mail-Domain
- Timer-Manipulation → Server-seitige Validierung
- Rate Limiting → 4 SuS-Endpoints (10-15/min)
- Cross-Exam Token Reuse → verhindert
- Prompt Injection → Inputs in `<user_data>` gewrappt
- Session-Lock → Neuer Login invalidiert alten Token

### Improvement Plan (55 Punkte, 6 Sessions) — ✅ Alle erledigt (S88–S90)
