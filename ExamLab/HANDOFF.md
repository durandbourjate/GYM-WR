# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Letzter Stand auf main

### Bundle L.b — poolConverter (Discriminated Union + FiBu-Konverter-Bugfix) 🟡 IN REVIEW

**Branch:** `refactor/bundle-l-b-pool-converter` (29.04.2026). 1127/1127 vitest (+14 vs L.a 1113), tsc + build clean.

**Geliefert (Type-Cleanup):**
- `packages/shared/src/types/pool-frage.ts` (neu, ~250 Zeilen) — `PoolFrage` als Discriminated Union mit 20 Sub-Types. `explain` und `img` als gemeinsame Base-Felder. **FiBu-Sub-Types modellieren das echte Pool-Rohformat**, nicht das Storage-Format (siehe M1-Fix unten).
- `packages/shared/src/types/pool-frage.test.ts` (neu, 9 Tests inkl. Discriminator-Narrowing, exhaustive-Switch, Pool-Rohformat).
- `ExamLab/src/types/pool.ts`: Fat-Union-Interface ersetzt durch Re-Export aus `@shared/types/pool-frage`.
- `ExamLab/src/utils/poolConverter.ts`: 19 → 0 `as any`. Discriminator-Narrowing in den Switch-Bodies. `erzeugeSnapshot` mit `'X' in poolFrage`-Guards.
- `ExamLab/src/utils/poolConverter.test.ts`: 7 → 0 `as any` plus 5 neue FiBu-Mapping-Tests.
- `ExamLab/src/services/poolSync.ts`: `berechneContentHash` mit `'X' in frage`-Guards. Field-Order stabil zu Apps-Script-Backend (Reviewer-Finding C1).

**Geliefert (M1-Fix — bestehender Konverter-Bug repariert):**
Die Reviewer-Recherche in `Uebungen/Uebungspools/config/bwl_fibu.js` hat aufgedeckt, dass das echte Pool-Format strukturell vom Storage-Format abweicht (`{soll, haben, betrag}` ≠ `BuchungssatzZeile{id, sollKonto, habenKonto, betrag}`). Der alte `as any`-Cast hat das maskiert; mit der typisierten Discriminated Union wird die Diskrepanz sichtbar. User-Entscheidung: nichts Kaputtes weiterziehen → Bug im selben Bundle repariert.
- **buchungssatz**: `correct[].soll/haben/betrag` → `buchungen[].sollKonto/habenKonto/betrag` (mit generierter ID). `konten[{nr,name}]` → `kontenauswahl.konten[]` (nur `nr`).
- **tkonto**: `konten[].correctSoll/correctHaben` zu `eintraege[]` mit Seiten-Markierung gemerged. `correctSaldo` direkt übernommen. `ab` → `anfangsbestand` mit `anfangsbestandVorgegeben = ab !== undefined`. `gegenkonten[]` → `kontenauswahl.konten[]`.
- **kontenbestimmung**: `aufgaben[].correct[{konto, seite}]` → `aufgaben[].erwarteteAntworten[{kontonummer, seite}]`.
- **bilanz**: `correct.{aktiven, passiven, bilanzsumme}` → strukturierte `BilanzERLoesung.bilanz.{aktivSeite, passivSeite, bilanzsumme}` mit Default-Gruppen.

Auswirkung: `fibuAutoKorrektur.ts:70-94` und `BuchungssatzFrage.tsx` lesen `frage.buchungen[i].sollKonto` — vor Bundle L.b war das immer `undefined` für Pool-importierte Buchungssätze, was zu "Soll-Konto falsch" für jede Antwort führte. Latent-Bug seit S107, jetzt behoben.

**Audit-Stand:** 96 → 71 (-25). 26 Defensive-Marker unverändert. 45 undokumentierte verbleiben (alle in L.c-Scope).

**Strategie-Entscheidung:** (a) Discriminated Union — gewählt, weil Pool-Format seit S107 stabil + klar `type`-diskriminiert.

**Reviewer-Findings adressiert:**
- C1 (Hash-Stabilität): Field-Order in `inhalt`-Object zurück zu Apps-Script-Reihenfolge (`apps-script-code.js:195`).
- C2 (Test-Type-Error nicht von tsc -b gefangen): `BilanzERLoesung`-Shape korrigiert. Cross-Project-Verifikation via `tsc -b ../packages/shared --force` zur Routine gemacht.
- M1 (FiBu Pool-Format-Mismatch): vollständig repariert wie oben beschrieben.
- M2 (Redundanz): `explain`/`img` aus 14 Sub-Types entfernt.
- M3 (Type-Bypass in case 'gruppe'): Defensive-Marker.

**Lehren:**
1. **Discriminated Union erfordert vor-Switch-Lesepfade auf `'X' in frage`-Guards.** Generischer Field-Access (wie in `erzeugeSnapshot`/`berechneContentHash`) klappt mit Fat-Union, bricht bei Discriminated Union. Common-Felder (`explain`, `img`) ins Base; Sub-Type-spezifische Felder mit `'X' in frage` defensiv prüfen.
2. **Hash-Stabilität: `JSON.stringify` respektiert Insertion-Order.** Wenn ein Konsument (hier Apps-Script-Backend) den Hash exakt reproduzieren muss, ist die Field-Reihenfolge im Object-Literal Teil der Vertrags-Schnittstelle. Kommentar `// REIHENFOLGE STABIL — siehe <Backend>` einfügen.
3. **`as any` versteckt nicht nur Type-Lücken, sondern auch Daten-Mapping-Bugs.** Beim Pool-FiBu-Import lautete der Cast formal `(poolFrage as any).correct ?? []` und schrieb das Pool-Objekt 1:1 ins Storage-Feld — strukturell falsch, aber zur Compile-Zeit unsichtbar. Beim as-any-Cleanup IMMER prüfen: was wird auf der anderen Seite des Casts erwartet? Ist die Daten-Form identisch?
4. **`tsc -b` aus ExamLab kaschiert Cross-Project-Errors in Test-Files.** Die L.a-Lehre (Lehre 2 oben) gilt auch für L.b — beim ersten Lauf hatten wir einen TS2353 in `pool-frage.test.ts:61` (BilanzStruktur-Shape falsch), den `cd ExamLab && npx tsc -b` mit Exit 0 verschluckt hat. Erst `npx tsc -b ../packages/shared --force` zeigte ihn. Routine: vor jedem L.x-Commit beide Befehle laufen lassen.

**Offen (User-Tasks für Merge-Freigabe):**
- Browser-E2E mit echten Logins, Schwerpunkte:
  - Pool-Sync-Dialog öffnen (LP-Fragensammlung) — Hash-Stabilität: kein "Update verfügbar"-Spam für unveränderte Pool-Fragen.
  - FiBu-Pool-Frage importieren (z.B. `bwl_fibu.js:bs01` als Buchungssatz, `kb01`/`tk01`/`bi01`) und in einer Prüfung an Test-SuS schalten.
  - SuS löst FiBu-Aufgaben → Auto-Korrektur muss korrekt bewerten (war vorher "Soll-Konto falsch" für jeden korrekten Eintrag, jetzt richtig).

---

### Bundle L.a — Mock-Helper + pflichtfeldValidation-Pilot ✅ MERGED

**Branch:** `refactor/bundle-l-a-mock-helper-pflichtfeld` (29.04.2026). 1113/1113 vitest (+15 vs main 1098), tsc + build clean.

**Geliefert:**
- `packages/shared/src/test-helpers/frageCoreMocks.ts` (neu, generischer `mockCoreFrage<T>`-Helper für 20 Sub-Types)
- `packages/shared/src/test-helpers/frageCoreMocks.test.ts` (11 Tests inkl. deterministische Defaults + Array-Instanz-pro-Aufruf)
- `ExamLab/src/__tests__/helpers/frageStorageMocks.ts` (neu, Storage-Wrapper delegiert an Core)
- `ExamLab/src/__tests__/helpers/frageStorageMocks.test.ts` (4 Tests)
- `scripts/audit-as-any.sh` (neu, 1-Zeilen-Defensive-Scan, `--strict`-Mode für CI-Gate)
- `pflichtfeldValidation.ts`: 24 → 0 `as any` (19 Sub-Funktion-Signaturen typisiert von `any` → konkrete Sub-Types, Switch-Casts entfernt durch TS-Discriminator-Narrowing, 14 Defensive-Casts für Legacy-Field-Aliases aus `buildFragePreview`)
- `pflichtfeldValidation.test.ts`: 79 → 0 `as any` (Migration auf `mockCoreFrage`, 12 Defensive-Marker)

**Audit-Stand:** 199 → 96 (-103). 26 Defensive-Marker dokumentiert. 70 undokumentierte verbleiben (alle in L.b/L.c-Scope).

**Lehren:**
1. **Plan-Defaults sind grobe Skizze, nicht Source-of-Truth.** Plan hatte ~14 von 20 Sub-Type-Defaults mit falschen Feldnamen oder fehlenden Pflichtfeldern (z.B. `hotspots` statt `bereiche`, `zonen` statt `zielzonen`, `maxDauerSek` statt `maxDauerSekunden`). Implementer-Subagent korrigierte alle gegen `fragen-core.ts`. **Regel für künftige Pläne:** Bei Type-erzeugenden Helpern den Plan explizit als „Skizze" markieren und darauf hinweisen, gegen die echten Type-Defs zu verifizieren.
2. **TS2352 in `tsc -b` mit EXIT=0 möglich.** Incrementelles Build kaschiert Errors aus Cross-Project-Files (nur tsc-Output prüfen, NICHT auf Exit-Code verlassen). Subagent + Quality-Reviewer hatten den TS2352 in Helper-Cast übersehen — beim nachgelagerten direkten tsc-Check erst sichtbar. Fix: `as Extract<...>` → `as unknown as Extract<...>`.
3. **Legacy-Field-Aliases in `pflichtfeldValidation` sind genuine Defensive-Pattern.** Validator wird mit Editor-State aus `buildFragePreview.ts` aufgerufen, der heterogene Form-State-Shapes synthetisiert (z.B. `tkAufgabentext`, `pdfErlaubteWerkzeuge`). 14 Defensive-Casts dokumentieren das. Removal erfordert separaten Refactor von `buildFragePreview` (Out-of-Scope für Bundle L; Follow-up als „Bundle M / future" notiert).

**Out of Scope (für L.b/L.c oder eigenes Bundle):**
- `buildFragePreview` Output-Canonicalization (würde Defensive-Casts in pflichtfeldValidation überflüssig machen)
- 70 weitere `as any` in poolConverter, fragetypNormalizer, PruefungFragenEditor, etc.

---

### Bundle K-Followup — Storage-Sub-Type-Hygiene ✅ MERGED

**Branch:** `refactor/bundle-k-followup` (29.04.2026). 1098/1098 vitest, tsc + build clean.

**Geliefert:**
- `fragen-storage.ts`: `export type *` durch explizite Helper-Re-Export-Liste ersetzt; 20 Storage-Sub-Types (`MCFrage = WithStorageBase<Core.MCFrage>` etc.) zentral exportiert. `Frage`-Union nutzt jetzt die zentralen Aliases statt inline `WithStorageBase<...>`.
- `FrageSummary.berechtigungen` von Inline-Type-Expression (`import('./auth').Berechtigung[]`) auf Top-Level-Import umgestellt.
- `autoKorrektur.ts`, `fibuAutoKorrektur.ts`, `KorrekturFrageVollansicht.tsx`: 23 lokale `Extract<Frage, {typ:'X'}>`-Aliase entfernt — direkt aus `fragen-storage` importiert.
- `DruckAnsicht.tsx`: 16 `frage as XFrage`-Casts im Typ-Dispatcher entfernt (TS-narrowing der Storage-Frage-Union liefert die korrekten Sub-Types automatisch). Kein `alsCoreFrage<T>`-Helper nötig.

**Item 3 (leereEingabenDetektor auf core) als obsolet eingestuft:** Der Wechsel würde alle Caller (8 SuS-Komponenten) auf Core-Frage-Casts zwingen, weil Storage's `tags: (string | Tag)[]` strukturell nicht zuweisbar ist an Core's `tags: string[]`. Der Helper liest weder `tags` noch `_recht`/`poolVersion` — semantisch ist der SuS-Pfad sauber.

**Lehre für künftige Type-Migrationen:** Wenn ein Storage-Type strukturell breiter ist als der Core-Type (z.B. erweiterter Tag-Union), ist der Storage-Type NICHT zuweisbar an Core. Helper, die nur Schnittmengen-Felder lesen, bleiben deshalb sinnvollerweise auf der Storage-Variante getypt — ein Wechsel auf Core braucht entweder Pick-basierte Schmal-Types oder Generic-Constraints, was die API verkompliziert.

---

### Bundle K — Type-Konsolidierung Frage Core + Storage ✅ MERGED

**Merge:** `de01e01` auf `main` (29.04.2026). 16 Commits Feature-Arbeit auf `refactor/type-konsolidierung-frage-core-storage` (Branch gelöscht). Audit-Files (Phase 0) post-Merge entfernt.

**Geliefert:**
- `packages/shared/src/types/fragen-core.ts` (kanonische Editor-Types in shared, 699 Z.)
- `ExamLab/src/types/fragen-storage.ts` (Storage-Erweiterung mit `WithStorageBase<T>`-Helper, 108 Z.)
- `ExamLab/src/types/auth.ts` re-exportet `Berechtigung`/`RechteStufe` aus `@shared/types/auth`
- Alte `packages/shared/src/types/fragen.ts` + `ExamLab/src/types/fragen.ts` gelöscht
- index.ts re-exportet nur fragen-core (single-export wegen TS2308-Ambiguität bei Dual-Export)

**Cut-Entscheidung umgesetzt:** `berechtigungen`/`geteilt`/`autor` in core (Editor-Felder), nur `_recht`/`poolVersion` storage-only. `tags: string[]` in core, `tags: (string|Tag)[]` in storage. Strukturelles Subtyping erlaubt Storage-Frage als Editor-Input ohne Mapping; an einer Stelle (`PruefungFragenEditor.poolSyncSlot`) Cast am Callback-Boundary nötig.

**E2E-Verifikation auf staging mit echten Logins:**
- LP-Fragensammlung lädt 2363 Fragen, Tags rendern, Filter funktionieren
- MC-Editor öffnet sauber: Pflichtfeld-Outlines violett, Pool-Info-Slot, Sharing-Badge
- prev/next-Navigation synchronisiert (S129-Regel intakt)
- SuS-Üben-Modus: MC-Frage Auto-Korrektur funktioniert, Musterlösung mit C9-Phase-2-Layout
- Privacy: SuS-UI rendert keine Storage-Felder (Pool-Info, Sharing fehlen wie erwartet)

**Lehren aus der Implementation (für künftige Type-Migrationen):**
1. **Audit-Pattern muss Extension- und inline-import-Varianten erfassen** — Phase-0-Audit `from '...types/fragen'` (single-quote-Ende) hat ~95 Files mit `.ts`-Extension verpasst (`from '../types/fragen.ts'`) und alle inline `import('...types/fragen').X`-Type-Expressions. Phase 5 musste die nachziehen. Künftig: Pattern-Set mit `'`, `.ts'`, `.tsx'`, `.js'` UND `import\\(['"`]` einbeziehen.
2. **Doppel-`export *` aus zwei strukturell-identischen Files erzeugt 78× TS2308** — TS resolviert duplicate symbols nicht silent zu „identisch", sondern droppt sie. Plan-Achtung-Fallback (single-export) war richtig.
3. **`fragen-storage` re-exportet via `export type *` Core-Sub-Type-Namen mit Core-Tags** — `MCFrage` etc. aus fragen-storage sind die Core-Variante (string-tags), nicht Storage. Storage-Caller die narrow Sub-Types brauchen, müssen `Extract<Frage, {typ:'mc'}>`-Aliase oder explizite `WithStorageBase<Core.MCFrage>`-Exports nutzen. Dokumentiert in 3 Files (autoKorrektur.ts, fibuAutoKorrektur.ts, KorrekturFrageVollansicht.tsx).
4. **Storage-Felder sind nicht in shared erlaubt** — `poolVersion?: unknown` darf NICHT in fragen-core wieder eingebaut werden, auch wenn ein TS-Fehler an einem Callback-Boundary „nur ein Feld" verlangt. Lösung ist Cast am Callback-Boundary (Spec Risiko-Mitigation #3), nicht Storage-Feld-Leak in Core.

**Tech-Debt aus Code-Review:** Erledigt durch Bundle K-Followup (siehe oben) — Items 1, 2, 4 umgesetzt; Item 3 (`leereEingabenDetektor` auf core) als obsolet eingestuft.

---

## Eintrittspunkte für nächste Session

Bundle L.a abgeschlossen. Drei Eintrittspunkte:

### Bundle L.b — poolConverter (~1 Session) ← NÄCHSTES
26 `as any`-Stellen in `ExamLab/src/utils/poolConverter.{ts,test.ts}`. Eigene Komplexität: Pool-Frage-Type ist nicht Storage/Core, sondern Pool-Format. Plan-Sub-Brainstorm in L.b.0 entscheidet zwischen (a) `PoolFrage`-Discriminated-Union, (b) Per-Sub-Type Type-Guards, (c) zod-Schema-Validator. Plan: [docs/superpowers/plans/2026-04-29-bundle-l-as-any-cleanup.md](../docs/superpowers/plans/2026-04-29-bundle-l-as-any-cleanup.md) Phase L.b.

### Bundle L.c — Restliche Production + Tests + CI-Gate (~1 Session)
~70 verbliebene `as any`-Stellen in fragetypNormalizer (6), PruefungFragenEditor (6), fragenbankStore (3), VorschauTab (2) + 9 Einzel-Files + 15 Test-Dateien. Plus CI-Gate-Aktivierung (`npm run lint:as-any`). Mechanischer Sweep mit etablierten Helpern. Plan-Phase L.c.

### Option C: Media-Phase-3-5 Dual-Write (groß, ~3-4 Sessions)
`MediaQuelle`-Type ist in shared definiert, aber Apps-Script kennt ihn nicht. Echte Migration: Backend liest+schreibt beide Formate (`bildUrl`/`pdfBase64` UND `MediaQuelle`), Frontend-Migrator existiert (`mediaQuelleMigrator.ts`). Apps-Script-Deploy nötig. Phase 6 (alte Felder weg, Daten-Migration) als separates Bundle danach.

---

## Aktiv offen

### Kleine Follow-Ups (nicht blockierend)

**G.d.1 Final-Review Follow-Ups** (aus S152):
- `preWarmKorrektur` extrahiert `sessionToken` aus `useUebenAuthStore`, wird aber von LP-Context aufgerufen → expliziter `sessionToken`-Argument wäre klarer
- Network-Error-Test für `preWarmKorrektur` fehlt (6 Cases statt G.a-7)
- `setKorrekturStatus` triggert 3-4× Cache-Invalidierung während laufender `batchKorrektur` — korrekt aber dokumentationswürdig

**autoSave-IDB-Race Restbestände** (S150-Sweep, niedrige Priorität — kein Hard-Nav direkt danach):
- `cleanupNachAbgabe.ts:13` — `clearIndexedDB(...).catch(...)` ohne await
- `App.tsx:180` — `clearIndexedDB`/`clearQueue` bei `durchfuehrungId`-Wechsel

~~**FrageBase-Divergenz** (S159 Spawn-Task M2)~~ → wird durch Bundle K aufgelöst (siehe oben).

### Future Bundles (geplant)

- **Media-Phase-3-5 Dual-Write Migration** — `MediaQuelle`-Type ist in shared definiert (`packages/shared/src/types/mediaQuelle.ts`), aber Apps-Script kennt ihn nicht. Echte Migration ist eigenes Bundle in Bundle-J-Grösse: Backend liest+schreibt beide Formate (`bildUrl`/`pdfBase64` UND `MediaQuelle`), Frontend-Migrator ist bereits da (`mediaQuelleMigrator.ts`). ~3-4 Sessions, Apps-Script-Deploy nötig. Phase 6 (alte Felder weg, Daten-Migration) als separates Bundle danach.
- **`as any`-Cleanup** — 72 Stellen aktuell (von 58 gewachsen), eigenes Hygiene-Bundle, ~1 Session.
- **Backend-Migration weg von Apps-Script** (langfristig, strategisch) — Edge-Runtime / Cloud Run / Cloudflare Workers. Vorbereitend: API-Contract (Zod/JSON-Schema), Endpoint-Inventar, Schema-Doku. Kein konkreter Trigger jetzt, aber Vorarbeit lohnt während anderer Bundles.

### Future / YAGNI (nur falls UX-Feedback negativ)

- Bundle G.f.3 — KorrekturDashboard-Skeleton (eingebettet + standalone) falls G.d.1 Pre-Warm-Cache-Miss-Flash spürbar
- Phase-Komponenten-Skeletons (LobbyPhase / AktivPhase / BeendetPhase intern)
- Doppel-Header-Optik G.e — falls Sticky-Lane-Header parallel zum virtuellen Header sichtbar
- IDB-Verschlüsselung als eigenes Sub-Bundle (separates Threat-Model)

### Backlog (älter, low-priority)

| # | Thema | Notiz |
|---|---|---|
| A2 | KI-Bild-Generator Backend (`generiereFrageBild`-Endpoint) | Frontend steht |
| A3 | KI-Zusammenfassung Audio-Rückmeldungen | Braucht A2 |
| B2 | Audio iPhone — 19s Aufnahme speichert nur 4s | iPhone MediaRecorder |
| B3 | Abgabe-Timeout „Übertragung ausstehend" | Apps-Script Execution Log |
| B4 | Fachkürzel stimmen nicht (PDF-Abgleich mit `stammdaten.ts`) | — |
| V1 | Bilanzstruktur: Gewinn/Verlust-Eingabe | — |
| V3 | Testdaten-Generator für `wr.test` | — |
| V8 | Ähnliche Fragen erkennen (Duplikat-Erkennung) | — |
| T1 | 62 SVGs visuell prüfen (neutrale Bilder erstellt S87) | — |
| T2 | Excel-Import Feinschliff | — |

### Langfristig

- SEB / iPad — SEB deaktiviert (`sebErforderlich: false`)
- Tier 2 Features: Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- TaF Phasen-UI — `klassenTyp`-Feld vorhanden, UI verschoben auf nächstes SJ
- Monitoring-Verzögerung ~28s — Akzeptabel

---

## Letzter Stand auf main

### Bundle J — DnD-Bild Multi-Zone-Datenmodell (S160 + S161)

**Merges:** `eae1cec` (Migration) + `000de2e` (Cleanup) + S161 Apps-Script-Cleanup-Deploy.

- DragDrop-Bild-Datenmodell auf Multi-Zone (`korrekteLabels: string[]` pro Zone) und Multi-Label-Akzeptanz (Synonym-Listen).
- Pool-Tokens als `DragDropBildLabel{id, text}` mit Stack-Counter für Duplikate. Deterministische `stabilId(frageId, text, index)` Cross-Env-Hashes (TS+ESM-Mirror).
- Generic `felder`-Patch am `batchUpdateFragenMigrationEndpoint` (Erweiterung des C9-Endpoints) — nutzbar für künftige Migrationen.
- 28/28 dragdrop_bild-Fragen migriert (5 BWL + 10 Recht + 12 VWL + 1 Demo `einr-dd-kontinente`).
- **Apps-Script 3× deployed:** Phase 4 (LOESUNGS_FELDER + Privacy-Test), Phase 9.0 (generic `felder`-Patch), S161-Cleanup (`pruefeAntwortServer_` Multi-Label-Match).
- **Browser-E2E (S161):** LP+SuS mit echten Logins, Security-Check, kritische Pfade, verwandte Fragetypen, Mobile/iPad Stack-Mechanik geprüft.
- **Lückentext Phase 8 E2E (S161):** Browser-Test mit echten Logins (LP-Pfade Editor + Bulk-Toggle, SuS-Pfade Freitext + Dropdown, Security-Invarianten Network-Tab) abgeschlossen.
- **Tests:** 1098 vitest passes, tsc/build clean.
- **Cleanup auf main** (vorgezogen statt 12.05.): `korrektesLabel?:` aus `DragDropBildZielzone` weg in 3 Type-Files, Dual-Read-Pfade entfernt, `zoneKorrektBelegt`-Helper raus, Demo-Frage `einr-dd-kontinente` aufs neue Format. Scheduled-Task `bundle-j-cleanup-check` deaktiviert.

**Memory-Detail:** `project_s158_bundle_j_specplan.md` (Spec+Plan) · `project_s159_bundle_j_phase_1_8.md` (Phase 1-8) · `project_s160_bundle_j_komplett.md` (Migration+Cleanup) · `project_s161_bundle_j_lueckentext_e2e.md` (E2E+Deploy)

---

## Bundle J Browser-E2E Test-Plan (Referenz für DnD-Bild-Regressionen)

In S161 abgeschlossen — Test-Plan-Details bleiben als Referenz für künftige DnD-Bild-Regressionen.

<details>
<summary>Test-Plan-Details (Referenz)</summary>

### Setup
- Tab-Gruppe mit LP (`wr.test@gymhofwil.ch`) + SuS (`wr.test@stud.gymhofwil.ch`).
- Test-Prüfung: Einrichtungsprüfung mit DnD-Bild-Frage `einr-dd-kontinente`.
- Stichprobe-Migration via `node upload.mjs --ids=<5-10 IDs>` vor dem E2E.

### Zu testende Änderungen

| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|----------|---------------------|-------------------|
| 1 | LP-Editor Multi-Zone-Frage | Bilanz-Schema mit 2× `Aktiva`-Zonen + 2 `Aktiva`-Pool-Tokens speicherbar | Editor crasht bei alten Fragen |
| 2 | LP-Editor Multi-Label | Zone akzeptiert `['Marketing-Mix', '4P']` | Chip-Input verliert Daten |
| 3 | SuS-Stack-Counter | Pool zeigt `Aktiva ×2`, Counter dekrementiert beim Drop | Stack verschwindet falsch |
| 4 | SuS-Korrektur Multi-Zone | 2 `Aktiva`-Tokens in 2 `Aktiva`-Zonen → beide korrekt | Eine Zone fälschlich falsch |
| 5 | Bestand-Frage (vor Mig) | Frage öffnen + lösen wie vorher (Demo-Frage `einr-dd-kontinente`) | Antwort orphaned |
| 6 | Bestand-Frage (nach Mig) | Frage öffnen + lösen wie vorher (1:1-Mapping) | Antwort orphaned |

### Security-Check

- SuS-API-Response: keine `korrekteLabels`, kein `korrektesLabel`.
- SuS-API-Response: `labels` hat `id+text` (IDs sind base32-Hashes).
- LP-API-Response: `korrekteLabels` vollständig (LP-Editor / Korrektur).

### Kritische Pfade (regression-prevention.md §1.3)

- SuS lädt Üben-Modus mit DnD-Frage.
- LP Korrektur-Vollansicht für DnD-Frage.
- LP Druck-Ansicht (`/lp/druck`).
- SuS-Heartbeat speichert `zuordnungen`.
- SuS-Abgabe persistiert.

### Regressions-Tests (verwandte Fragetypen)

- Hotspot, Bildbeschriftung.
- Sortierung, Zuordnung.
- FiBu-Tabellen-Eingabe (Buchungssatz, T-Konto, Bilanz/ER).

### Mobile / iPad-Test (Stack-Touch-Mechanik)

- Tap-to-Select auf Stack `Soll ×3`.
- Tap auf Zone → Counter dekrementiert.
- Bei Counter = 0: Stack verschwindet aus Pool.
- Tap auf platzierten Token → entfernt, Counter +1.
- Touch-Targets ≥ 44×44px.
- `touchAction: 'none'` auf interaktiven Elementen.

</details>

---

## Historie

| Session | Datum | Inhalt | Memory |
|---|---|---|---|
| S161 | ~Apr/Mai 26 | Bundle J Browser-E2E + Lückentext Phase 8 E2E + Apps-Script-Cleanup-Deploy | `project_s161_bundle_j_lueckentext_e2e.md` |
| S160 | 28.04.26 | Bundle J KOMPLETT auf main + Cleanup vorgezogen | `project_s160_bundle_j_komplett.md` |
| S159 | 28.04.26 | Bundle J Phase 1-8 auf Branch | `project_s159_bundle_j_phase_1_8.md` |
| S158 | 28.04.26 | Bundle J Spec + Plan | `project_s158_bundle_j_specplan.md` |
| S157 | 28.04.26 | Bundle H Editor-UX-Feinschliff (Violett-Pflichtfeld + 4 Vereinfachungen + SuS-Tastatur) | `project_s157_bundle_h_phasen_0_4.md` |
| S156 | 28.04.26 | Bundle H Spec + Plan | `project_s156_bundle_h_plan.md` |
| S155 | 27.04.26 | Bundle G.f.2 (Skeleton-Pattern für DurchfuehrenDashboard + FragenBrowser) | `project_s155_bundle_g_f_2.md` |
| S154 | 27.04.26 | Bundle G.e (Fragensammlung-Virtualisierung) + G.f (LP-Startseite Skeleton) | `project_s154_bundle_g_e_f.md` |
| S153 | 27.04.26 | Bundle G.d.2 (IDB-Cache Klassenlisten + Gruppen) | `project_s153_bundle_g_d_2.md` |
| S152 | 27.04.26 | Bundle G.d.1 (4 Hebel: Lobby-Polling, schalteFrei Pre-Warm, Korrektur-Cache, SuS-Warteraum) | `project_s152_bundle_g_d_1.md` · `..._plan.md` |
| S151 | 27.04.26 | Bundle G.d/e/f Specs (4 Specs reviewer-approved) | `project_s151_bundle_g_specs.md` |
| S150 | 27.04.26 | autoSave-IDB-Race-Fix (Folge-Hotfix S149) | `project_s150_autosave_idb_race.md` |
| S149 | 27.04.26 | Bundle G.c (LP-Login Pre-Fetch + Logout-Cleanup, IDB-Race-Hotfix) | `project_s149_bundle_gc.md` |
| S148 | 26.04.26 | Bundle G.b (Editor-Nachbar + Anhang-PDF-Prefetch, frontend-only) | `project_s148_bundle_gb.md` |
| S147 | 26.04.26 | Bundle G.a (Server-Cache-Pre-Warming, 4 Trigger) | `project_s147_bundle_ga.md` |
| S146 | 26.04.26 | Bundle E (Übungsstart-Latenz N=10 cold 4'322ms→1'036ms) + Repo-Cleanup | `project_s146_bundle_e.md` |
| S145 | 24.04.26 | Auth-Session-Restore-Fix (Standalone-Üben-Refresh) | `project_s145_auth_fix.md` |
| S144 | 24.04.26 | Lückentext Phase 7 Migration (253/253 Fragen) | `project_s144_lueckentext_phase7.md` |
| S142 | 24.04.26 | Bildeditor-Bundle + Lückentext-Modus Phase 1-6 | `project_s142_bildeditor_lueckentext.md` · `..._lueckentext_modus.md` |
| S141 | 24.04.26 | Altlasten-Bundle (Audio raus aus Einführung, AdminFragenbank weg, useResizableHandle) | `project_s141_altlasten_bundle.md` |
| S140 | 24.04.26 | Bundle F1 (Probleme-Dashboard) + F2 (Bugfix-Bundle, Audio-Fragetyp deaktiviert) | inline MEMORY.md |
| S137-138 | 23.04.26 | UI/Autokorrektur-Bundle | `project_s137_ui_bundle.md` |

### Archiv (Sessions 20–136)

100+ Sessions komprimiert. Bei Bedarf via `git log` + Memory-Files nachvollziehbar.

| Datum | Sessions | Meilenstein |
|-------|----------|-------------|
| 26.03. | 20–22 | Root-Cause-Fixes, Live-Test Bugfixes, Scroll-Bug |
| 27.03. | 23–29 | 16 Bugfixes, Toolbar-Redesign, Zeichnen-Features, Multi-Teacher Phase 1–4, Sicherheit |
| 28.03. | 30–32 | Plattform-Öffnung für alle Fachschaften, Demo-Prüfung, LP-Editor UX |
| 31.03. | 38–44 | E2E-Tests, Security Hardening, Staging, Workflow-Umstellung |
| 01.04. | 45–49 | Batch-Writes, Request-Queue, Re-Entry-Schutz, 8 neue Pool-Fragetypen |
| 02.04. | 51–53 | Browser-Tests + 75 Pool-Fragen, Bewertungsraster, Lernplattform Design |
| 04.04. | 55–58 | Shared Editor Phase 1–5a (EditorProvider, Typ-Editoren, SharedFragenEditor) |
| 05.04. | 59–64 | Fusion Phase 1–6 (Lernplattform → Prüfungstool), Übungstool A–F, Prompt Injection Schutz |
| 05.–06.04. | 66–67a | ExamLab Overhaul, Performance, Datenbereinigung |
| 07.04. | 68–71 | Tech-Verbesserungen, Lernsteuerung, Navigation, grosses Bugfix-Paket |
| 10.04. | 72–87 | Editor-Crashes, Fragetyp-Korrektur, Navigation, Einstellungen, Stammdaten, Performance, UX-Polish, Druckansicht, Excel-Import, Store-Migration, Favoriten, Bild-Fragetypen Reparatur |
| 11.04. | 88–90 | Improvement Plan S1–S5, Deep Links, Fachkürzel, Performance |
| 12.04. | 91–92 | Code-Vereinfachung (Adapter-Hook Refactoring), Save-Resilienz |
| 13.04. | 93–97 | Browser-Test Bugfixes, FiBu-Fixes, Bild-Upload, Deep Links + React Router |
| 13.04. | 98–104 | UX-Bundles 1–8 (Quick Wins, Favoriten-Redesign, Übungs-Themen, Layout-Umbau, Bildfragen-Editor, Design-System, UX-Harmonisierung) |
| 14.04. | 105–107 | C11+C9+Wording, E1 FiBu-Fix + Feedback-System, Rename Pruefung→ExamLab + Kontenrahmen 2850 |
| 14.–22.04. | 108–136 | C9 Phase 1–4 Migration (2412 Fragen), KI-Kalibrierung, Detaillierte Lösungen |

---

## Architektur (etabliert in S66–S92, weiterhin gültig)

- **Adapter-Hook Pattern:** `useFrageAdapter(frageId)` abstrahiert Prüfungs-/Übungs-Store
- **Fragetypen-Registry:** `shared/fragetypenRegistry.ts` (EINE Kopie, nicht zwei)
- **Shared UI:** `ui/BaseDialog.tsx`, `ui/Button.tsx`
- **Antwort-Normalizer:** `utils/normalizeAntwort.ts`
- **FrageModeContext:** `context/FrageModeContext.tsx`
- **SuS-Navigation:** Kein Start-Screen, direkt Üben-Tab. Tabs „Üben"/„Prüfen" in Kopfzeile.
- **kursId-Format:** `{gefaess}-{fach}-{klassen}` wenn `gefaess≠fach`, sonst `{gefaess}-{klassen}` (ohne Schuljahr)
- **Shared-Editoren:** `packages/shared/src/editor/` auf **Repo-Root**, nicht in ExamLab. Vite-Alias `@shared` mappt von ExamLab via `../packages/shared/src` (S156-Lehre).

## Security (alle erledigt ✅)

- Rollen-Bypass → `restoreSession()` validiert E-Mail-Domain
- Timer-Manipulation → Server-seitige Validierung
- Rate Limiting → 4 SuS-Endpoints (10–15/min)
- Cross-Exam Token Reuse → verhindert
- Prompt Injection → Inputs in `<user_data>` gewrappt
- Session-Lock → Neuer Login invalidiert alten Token
- IDB-Privacy nach Logout → `tx.oncomplete`-await vor Hard-Nav (S149-Lehre)
