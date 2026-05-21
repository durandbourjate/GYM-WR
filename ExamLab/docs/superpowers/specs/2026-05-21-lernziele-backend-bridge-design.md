# Lernziele-Backend-Bridge (Design-Trio Teil #4)

- **Datum:** 2026-05-21
- **Status:** Genehmigt (User-Approval pro Design-Abschnitt)
- **Kontext:** Design-Trio Teil #4 «Lernziele bis Unterthema». Die Plan-Session
  vom 21.05.2026 hat aufgedeckt, dass Editor und SuS-Anzeige getrennte Backends
  nutzen — Teil #4 wurde deshalb zur eigenen Brainstorming→Spec→Plan-Runde
  ausgelagert.

---

## Problem

ExamLab hat drei getrennte «Lernziel»-Systeme mit eigenen Sheets und
inkompatiblen Schemata:

| | Editor (CRUD) | SuS-Anzeige | Pool-Import |
|---|---|---|---|
| **Sheet** | `Lehrplanziele` (`LEHRPLAN_SHEET_ID`) | `Lernziele` (`FRAGENSAMMLUNG_ID`) | `Lernziele` (`FRAGENSAMMLUNG_ID`) |
| **Schema** | 9 Spalten, `ebene`+`parentId`, **kein** `unterthema` | liest 7 Felder, **mit** `unterthema` | schreibt 8 Spalten, `uebenSpeichereLernziel` nur 6 |

**Kernbefund:** Der Editor (`LernzielTab`) schreibt nach `Lehrplanziele`, die
SuS-Anzeige (`uebenLadeLernzieleV2`) liest aus `Lernziele` — sie treffen sich
nie. Ein im Editor erstelltes Lernziel erscheint nicht im SuS-Akkordeon.

**Weitere Befunde aus der Code-Recherche:**

- Der Editor modelliert faktisch eine flache Liste `{fach, thema, text, bloom}`.
  Die Felder `ebene`, `parentId`, `gefaess`, `semester` im `Lehrplanziele`-Schema
  sind **vestigial** — `ebene` wird hartcodiert auf `'fein'` gesetzt, der Rest
  bleibt leer. Der «Baum» existiert nur auf dem Papier.
- `uebenSpeichereLernziel` (`apps-script-code.js:12608`) schreibt **6 Spalten
  positionsbasiert** (`getRange(zeile,1,1,6).setValues(...)`). Hat der
  `Lernziele`-Tab das 8-Spalten-Schema von `importiereLernziele`, landet `text`
  in der `fach`-Spalte usw. — ein gravierender Daten-Korruptions-Bug.
- `loescheLernziel` führt einen Hard-Delete (`deleteRow`) aus, obwohl der
  Funktions-Kommentar «Soft-Delete» behauptet. Fragen, die per `lernzielIds` auf
  das Lernziel zeigen, behalten danach eine tote Referenz.
- `lernzielStatus()` (`mastery.ts:53`) braucht `lernziel.fragenIds`, um den
  Fortschritts-Status zu berechnen. `importiereLernziele` schreibt `fragenIds`
  gar nicht — Pool-Lernziele zeigen daher oft dauerhaft «offen».
- Das SuS-Akkordeon (`LernzieleAkkordeon`) gruppiert bereits nach `unterthema`
  (`meta` vs. `unterthemen`) — die **Anzeige-Seite ist schon Unterthema-fähig**.
- Es existieren drei `Lernziel`-Typdefinitionen im Frontend (lokal in
  `LernzielTab`, `types/pool`, `@shared/types/fragen-core`).

## Ziel

Ein im Editor erstelltes Lernziel — inkl. Unterthema — erscheint im SuS-Akkordeon
an der richtigen Stelle und zeigt dort einen korrekten Fortschritts-Status. Editor
und SuS-Anzeige teilen einen Store.

## Scope-Entscheidung: Umsetzung jetzt auf Apps-Script

Die Bridge wird **jetzt auf Apps-Script** gebaut, obwohl die Backend-Migration
auf Supabase (Schuljahresstart 10.08.2026) sie später neu implementiert. Grund:
Der August-Termin ist durch offene ISDS-Konzept-/DSA-Approval-Schritte unsicher;
ein Slip hielte die Apps-Script-Lernziele länger relevant. Das vereinheitlichte
Datenmodell überträgt sich ohnehin in die Supabase-Migration.

---

## Zielschema & Architektur

**Ein Store:** Der `Lernziele`-Tab in `FRAGENSAMMLUNG_ID` ist die einzige Quelle.
`Lehrplanziele` (in `LEHRPLAN_SHEET_ID`) wird stillgelegt — Daten migriert, das
Sheet bleibt als Backup liegen, wird aber von keinem Endpoint mehr gelesen oder
geschrieben.

**Kanonisches Schema** des `Lernziele`-Tabs:

| Spalte | Bedeutung |
|---|---|
| `id` | eindeutige ID |
| `fach` | BWL / VWL / Recht / Informatik |
| `thema` | Gruppierungs-Ebene 1 |
| `unterthema` | Gruppierungs-Ebene 2 (optional) — neu für den Editor |
| `text` | Lernziel-Text |
| `bloom` | K1–K6 |
| `poolId` | gesetzt bei Pool-importierten, leer bei Editor-erstellten |
| `aktiv` | `true`/`false` — Soft-Delete-Flag |

**Entfernt:** `ebene`, `parentId`, `gefaess`, `semester` (vestigial). `fragenIds`
ist **keine gespeicherte Spalte mehr** — es wird beim Laden frisch berechnet.

**Harte Invariante:** Alle Endpoints lesen und schreiben den `Lernziele`-Tab
**ausschliesslich über Spalten-Namen (Header-Lookup), nie positionsbasiert.** Der
`uebenSpeichereLernziel`-Bug war genau ein positionsbasierter Schreibzugriff —
header-basiert kann das nicht mehr passieren, auch wenn Spalten dazukommen.

**Ein Typ:** Statt heute drei `Lernziel`-Typdefinitionen gibt es einen geteilten
Typ in `@shared/types/fragen-core`:
`{ id, fach, thema, unterthema?, text, bloom, poolId?, aktiv?, fragenIds? }`.
`fragenIds` bleibt im Typ (das Frontend `lernzielStatus()` braucht es), ist aber
ein **berechnetes** Feld, das `uebenLadeLernzieleV2` befüllt — keine Sheet-Spalte.
Die lokale `interface Lernziel` in `LernzielTab` und `types/pool::Lernziel`
werden durch den geteilten Typ ersetzt.

**Tenancy-Grenze:** Der Editor verwaltet den `Lernziele`-Tab der Haupt-
`FRAGENSAMMLUNG_ID`. Custom-Gruppen (`typ:'familie'` mit eigener
`fragensammlungSheetId`) behalten ihren eigenen `Lernziele`-Tab — vom Editor
nicht berührt, aber dieselben Schema- und Bug-Fixes gelten generisch auch dort.

---

## Backend-Umbau

Sieben Endpoints in `apps-script-code.js`, alle auf den `Lernziele`-Tab in
`FRAGENSAMMLUNG_ID`, alle header-basiert:

| Endpoint | Heute | Neu |
|---|---|---|
| `ladeLernziele` (Editor READ) | bevorzugt `Lehrplanziele`, Fallback `Lernziele` | Nur `Lernziele`-Tab, header-basiert. Liefert alle Felder inkl. `unterthema`, `aktiv`, `poolId`. |
| `speichereLernziel` (Editor CREATE) | schreibt `Lehrplanziele`, 9 Spalten, `ebene='fein'` hartcodiert | schreibt `Lernziele` header-basiert: `fach, thema, unterthema, text, bloom`, `aktiv=true`, `poolId=''` |
| `aktualisiereLernziel` (Editor UPDATE) | updatet `Lehrplanziele` positionsbasiert | updatet `Lernziele` header-basiert, akzeptiert `unterthema` |
| `loescheLernziel` (Editor DELETE) | `deleteRow` (Hard-Delete) | **Soft-Delete:** setzt `aktiv=false`. Fragen-Referenzen bleiben gültig |
| `uebenSpeichereLernziel` (Pool/SuS Upsert) | **Bug:** 6 Spalten positionsbasiert → Daten-Korruption | header-basiert, kanonisches Schema |
| `uebenLadeLernzieleV2` (SuS READ) | liest `Lernziele`-Tab, `fragenIds` aus (oft leerer) Spalte | `fragenIds` frisch berechnet (s.u.); filtert `aktiv=false` serverseitig raus |
| `importiereLernziele` (Pool-Import) | header-basiert, 8 Spalten, self-heal `unterthema` | an kanonisches Schema angeglichen (weitgehend unverändert) |

**`fragenIds` frisch berechnen** (in `uebenLadeLernzieleV2`): Nach dem Laden der
Lernziele werden die Fragen-Tabs der Fragensammlung (`getFragensammlungTabs_()`)
gescannt, die `lernzielIds`-Spalte jeder Frage gelesen (kommagetrennt) und eine
Umkehr-Map `Lernziel-ID → [Fragen-IDs]` gebaut. Jedes Lernziel bekommt sein
`fragenIds` daraus. Die alte `uebenLadeLernziele` V1 (`apps-script-code.js:12380`)
macht diesen Scan bereits — das Muster wird wiederverwendet. Kosten: ein
Lese-Scan der Fragen-Tabs pro Akkordeon-Öffnen (akzeptabel, kein Hot-Path).
Das gilt für **alle** Lernziele (Editor- und Pool-erstellte) — die
`fragenIds`-Veraltungs-Bug-Klasse verschwindet vollständig.

**Aufräumen:** Die Plan-Phase prüft, ob `uebenLadeLernziele` V1 noch aufgerufen
wird (Dispatcher-Case + Frontend-Caller). Wenn tot → entfernen; wenn live → auf
V2 zusammenführen.

---

## Editor-UI — Unterthema-Ebene

Änderungen an `LernzielTab.tsx`:

**Unterthema-Feld:** Das Erstellen- und das Bearbeiten-Formular bekommen ein
`unterthema`-Feld — Freitext-Input wie `thema`, optional.

**Dreistufige Gruppierung:** Die Liste gruppiert neu **Fach → Thema → Unterthema
→ Lernziele** (heute nur Fach → Thema). Lernziele ohne `unterthema` erscheinen in
einer «Übergeordnet»-Gruppe direkt unter dem Thema — exakt wie das SuS-Akkordeon
es bereits macht (`meta` vs. `unterthemen`). Aufklapp-Zustand bekommt eine dritte
Ebene (`expandedUnterthemen`), Default eingeklappt. Die Gruppierungs-Logik wird
als getestete Pure-Function gebaut.

**Soft-Delete:** «Löschen» ruft weiterhin `loescheLernziel`, das jetzt
`aktiv=false` setzt. Der Editor lädt alle Zeilen, filtert aber `aktiv === false`
beim Laden raus — das gelöschte Lernziel verschwindet aus der Liste (gleiches
Gefühl wie bisher), bleibt aber im Sheet und bricht keine Fragen-Referenzen. Eine
Reaktivierungs-UI ist bewusst nicht v1-Scope.

**Ein Typ:** Die lokale `interface Lernziel` und `types/pool::Lernziel` werden
durch den geteilten `@shared/types/fragen-core::Lernziel` ersetzt; `unterthema`
wird überall durchgezogen.

**Pool-Lernziele im Editor:** Da Editor und Pool denselben Store teilen,
erscheinen Pool-importierte Lernziele (mit `poolId`) jetzt auch im Editor und
sind dort editierbar — gewollte Konsequenz der vollen Bridge. Optionaler Polish:
ein kleines `poolId`-Herkunfts-Badge.

`LernzielWaehler` (Lernziel-Picker im Frageneditor) bekommt die vereinheitlichten
Daten automatisch über `ladeLernziele` — nur die Typ-Umstellung ist nötig.

---

## Migration

Ein einmaliges Apps-Script-Skript `ExamLab/scripts/migrate-lernziele-bridge.js`
(paste-into-editor, `DRY_RUN`-Default):

1. Liest `Lehrplanziele` (`LEHRPLAN_SHEET_ID`) und den `Lernziele`-Tab
   (`FRAGENSAMMLUNG_ID`) — beide header-basiert, egal in welchem historischen
   Schema.
2. Mappt beide auf das kanonische Schema (`Lehrplanziele`-Zeilen: `unterthema=''`,
   `poolId=''`, `aktiv=true`).
3. **Auto-Dedup** über `(fach, text)`-Exaktmatch. Survivor-Präferenz: native
   `Lernziele`-Zeile vor migrierter `Lehrplanziele`-Zeile; bei Gleichstand die
   Zeile mit mehr gefüllten Feldern. Baut `idRemap: {verworfeneId → SurvivorId}`.
4. **Frage-Referenzen umschreiben:** scannt alle Fragen-Tabs, ersetzt in jeder
   `lernzielIds`-Spalte verworfene IDs durch die Survivor-ID, dedupliziert die
   resultierende Liste.
5. Schreibt den `Lernziele`-Tab mit kanonischem Header + deduplizierten Zeilen.
6. `Lehrplanziele` bleibt unangetastet liegen (Backup), wird nicht mehr
   referenziert.
7. `DRY_RUN`-Log: Zeilen je Quelle, Dedup-Merges, Referenz-Umschreibungen, finale
   Zeilenzahl.

---

## Testing

Gemischtes Projekt — anders als reine Apps-Script-Tooling-Projekte:

- **Frontend** (`LernzielTab.tsx`, geteilter `Lernziel`-Typ, Typ-Updates in
  `types/pool`): normal testbar — `tsc -b` + `vitest` + `npm run build` +
  Browser-E2E. TDD gilt; die 3-Ebenen-Gruppierung wird als getestete
  Pure-Function gebaut.
- **Apps-Script** (7 Endpoint-Änderungen + Migrations-Skript): `node --check` +
  `DRY_RUN` + Logger + Browser-E2E (Apps-Script läuft nicht in der lokalen
  Dev-Umgebung).
- **E2E** (echte Logins, kein Demo-Modus, gemäss `regression-prevention.md`):
  - LP erstellt im Editor ein Lernziel mit Fach + Thema + Unterthema.
  - SuS-Akkordeon zeigt es an der richtigen Fach→Thema→Unterthema-Stelle.
  - Eine verknüpfte, geübte Frage hebt den Status von «offen» weg
    (Frisch-Berechnung von `fragenIds` wirkt).
  - Soft-Delete: gelöschtes Lernziel verschwindet aus Editor und Akkordeon.
  - Regression: Pool-importierte Lernziele erscheinen weiter, `importiereLernziele`
    funktioniert.

---

## Deployment

Frontend via GitHub Actions, `apps-script-code.js` via manuellem
Apps-Script-Web-App-Deploy — **zusammen** in einem Wartungsfenster (Schema-/
Vertrag-Änderung, keine aktiven Prüfungen, gemäss `deployment-workflow.md`).
Direkt nach dem Deploy das Migrations-Skript einmalig laufen lassen (`DRY_RUN`
zuerst, dann echt), damit die bisherigen Editor-Lernziele aus `Lehrplanziele`
nicht aus dem Editor verschwinden.

---

## Neue / betroffene Dateien

| Datei | Änderung |
|---|---|
| `ExamLab/apps-script-code.js` | **Modify.** 7 Endpoints umgebaut (s.o.). |
| `ExamLab/src/components/settings/LernzielTab.tsx` | **Modify.** Unterthema-Feld, 3-Ebenen-Gruppierung, Soft-Delete-Filter, geteilter Typ. |
| `packages/shared/src/types/fragen-core.ts` | **Modify.** `Lernziel`-Typ um `unterthema`, `aktiv`, `poolId` ergänzt — der eine geteilte Typ. |
| `ExamLab/src/types/pool.ts` | **Modify.** `Lernziel` re-exportiert/ersetzt durch den geteilten Typ. |
| `ExamLab/src/components/ueben/LernzieleAkkordeon.tsx` | **Modify (minimal).** Nutzt den geteilten Typ. Anzeige-Logik bereits unterthema-fähig. |
| `ExamLab/scripts/migrate-lernziele-bridge.js` | **Create.** Einmal-Migrations-Skript, `DRY_RUN`-Default. |

---

## Komponentengrenzen

- Der `Lernziele`-Tab ist der einzige Store; der kanonische Header-Satz ist der
  Vertrag; alle Endpoints sind header-basiert.
- `migrate-lernziele-bridge.js` ist ein separates Einmal-Skript.
- `LernzielTab.tsx` ist eine self-contained Einstellungen-Tab-Komponente.
- Es gibt einen `Lernziel`-Typ.
- Die `fragenIds`-Berechnung lebt allein in `uebenLadeLernzieleV2` — kein
  denormalisierter Cache, keine Pflege-Logik verteilt über Schreibpfade.

---

## Reihenfolge / Deliverables

1. **Geteilter `Lernziel`-Typ** in `@shared` (Foundation für Frontend + Editor).
2. **Backend-Endpoints** umbauen (alle 7) — header-basiert, Soft-Delete,
   `fragenIds`-Frisch-Berechnung.
3. **Editor-UI** — `LernzielTab` Unterthema-Ebene + Soft-Delete-Filter.
4. **Migrations-Skript** schreiben.
5. **Deploy + Migration** im Wartungsfenster, E2E-Verifikation.

---

## Offene Punkte / Risiken

- **`Lehrplanziele`-Volumen** ist erst im Migrations-`DRY_RUN` sichtbar — bei
  grosser Menge ist die Dedup-Durchsicht aufwändiger.
- **`uebenLadeLernziele` V1** dead-or-alive — in der Plan-Phase zu klären.
- **`fragenIds`-Frisch-Berechnung** fügt `uebenLadeLernzieleV2` einen
  Fragen-Tab-Scan hinzu — Latenz im E2E zu messen.
- **Auto-Dedup** kann zwei gleichlautende Lernziele aus verschiedenen Themen
  zusammenführen (vom User bewusst akzeptiert).
- **Backend + Frontend müssen zusammen deployen** (Vertrag-Änderung) — kein
  Teil-Rollout.

---

## Explizit verworfen (YAGNI)

- **Generischer Lernziel-Baum** (`ebene`/`parentId`): vestigial, nie genutzt —
  ersatzlos gestrichen zugunsten fixer Ebenen Fach→Thema→Unterthema.
- **`gefaess`/`semester`-Felder**: nie befüllt — gestrichen.
- **Denormalisiertes `fragenIds`** als Sheet-Spalte: ersetzt durch
  Frisch-Berechnung.
- **Reaktivierungs-UI für soft-gelöschte Lernziele**: nicht v1-Scope
  (Wiederherstellung über das Sheet möglich).
- **Multi-Tenancy-Editor** für Custom-Gruppen-Fragensammlungen: der Editor
  verwaltet nur die Haupt-Fragensammlung.
- **Vereinheitlichung mit der Supabase-Backend-Migration in einem Schritt**: die
  Bridge wird jetzt eigenständig auf Apps-Script gebaut (Scope-Entscheidung oben).
