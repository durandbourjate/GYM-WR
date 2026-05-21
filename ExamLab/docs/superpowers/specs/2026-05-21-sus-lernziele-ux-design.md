---
title: SuS-Lernziele-UX — Üben nach Lernziel
date: 2026-05-21
status: Spec-Review ausstehend
verwandt: 2026-05-21-lernziele-backend-bridge-design.md (Datenschicht — kanonische Lernziele + fragenIds), 2026-05-11-cluster-g-icon-system-design.md (Icon-Registry), 2026-05-17-cluster-e-3-bis-e-5-favoriten-design.md (Star = Favorit)
---

# SuS-Lernziele-UX — Üben nach Lernziel

## 1. Zweck

Die Übungspools (`Uebungen/Uebungspools/pool.html`) haben eine etablierte Lernziele-UX: ein Header-Einstieg fürs Voll-Modal und ein Flaggen-Icon am Thema-Chip fürs Mini-Modal — beides führt zu „Fragen zu diesem Thema üben". Schüler:innen (SuS) kennen dieses Muster.

ExamLab hat das Gegenstück — `LernzieleAkkordeon` — bereits gebaut, aber **nicht verdrahtet**: `AppShell` rendert es hinter dem State `lernzieleOffen`, doch `setLernzieleOffen(true)` wird nirgends aufgerufen, und die SuS-Kopfzeile hat keinen Button dafür. Das volle Akkordeon ist toter, unerreichbarer Code.

Ziel: die Lernziele-UX der Pools in den SuS-Bereich von ExamLab bringen — und einen Schritt weiter gehen. Wo die Pools nur thema-genau üben lassen, kann ExamLab **pro einzelnem Lernziel** üben, weil Fragen dort bereits mit einzelnen Lernzielen verknüpft sind.

Gewählter Umfang (Scope C, mit dem Nutzer abgestimmt): Header-Einstieg **+** Lernziele-Icon je Unterthema **+** feinere Üben-Granularität pro Lernziel.

## 2. Befund — was bereits existiert

Der Befund ist die Grundlage der zentralen Architektur-Entscheidung (§4 #1). Die Datenschicht ist im Wesentlichen fertig; es fehlt fast nur SuS-seitige UI.

### 2.1 Frage ↔ Lernziel-Verknüpfung — vorhanden
- **Storage-Type:** `FrageSummary.lernzielIds?: string[]` (`src/types/fragen-storage.ts:133`).
- **Tagging-Wege (LP-seitig):** Excel-Import (`src/utils/excelImport.ts`), Batch-Operation (`src/components/lp/fragensammlung/BatchConfirmModal.tsx`), Frageneditor-Multiselect `LernzielWaehler` (`packages/shared/src/editor/components/LernzielWaehler.tsx`, eingebunden in `MetadataSection.tsx`).
- **Backend:** `apps-script-code.js` speichert `lernzielIds` als komma-getrennte Sheet-Spalte (Schreiben + Lesen).
- **Anzeige LP:** `DetailKarte.tsx` / `KompaktZeile.tsx` zeigen ein Lernziele-Zähler-Badge.

### 2.2 Lernziel-Entität — vorhanden
`Lernziel` (`packages/shared/src/types/fragen-core.ts`): `{ id, fach, thema, unterthema?, text, bloom, poolId?, aktiv?, fragenIds? }`. Das Feld **`fragenIds?: string[]` ist nicht gespeichert, sondern wird vom Backend pro Abruf berechnet** (`uebenLadeLernzieleV2`). Es ist die Liste der Fragen, die zu diesem Lernziel gehören — der Schlüssel für „Üben nach Lernziel".

### 2.3 SuS-seitige Lernziele-UI — teilweise vorhanden, unverdrahtet
- `LernzieleAkkordeon` (`src/components/ueben/LernzieleAkkordeon.tsx`, Default-Export): Voll-Modal Fach → Thema → Lernziele mit Status-Icons. Props: `lernziele`, `fortschritte`, `onSchliessen`, `onThemaUeben`. **Nur „Fragen üben" pro Thema** — kein Einstieg pro Lernziel.
- `LernzieleMiniModal` (gleiche Datei, Named-Export, Z. 204–270): Mini-Modal für ein Thema, Lernziele nach Unterthema gruppiert, „üben"-Button thema-genau.
- `AppShell.tsx` (`src/components/ueben/layout/`): `const [lernzieleOffen, setLernzieleOffen] = useState(false)` (Z. 32). `setLernzieleOffen(true)` wird **nie** aufgerufen — Akkordeon unerreichbar.
- `LernzieleMiniModal` **ist** erreichbar: `ThemaKarte.tsx` hat einen Flag-Button (`onLernzieleKlick`), `Dashboard.tsx` öffnet damit `setLzMiniModal({fach, thema})` (Z. 486–497).
- Lernziele werden geladen: `useUebenFortschrittStore.ladeLernziele(gruppeId)` (`fortschrittStore.ts:227-234`) → `appsScriptAdapter.ladeLernziele` → `uebenLadeLernzieleV2` → `Lernziel[]` inkl. `fragenIds`.

### 2.4 Üben-Start — vorhanden, parametrisierbar
`uebungsStore.starteSession(gruppeId, email, fach, thema, fragenOverride?, modus, quellen, freiwillig)` (`uebungsStore.ts:69-147`) akzeptiert bereits einen **`fragenOverride?: Frage[]`** — eine vorgefilterte Fragenliste statt eines Backend-Ladens (Z. 75–76). `Dashboard.tsx` lädt `alleFragen` ohnehin client-seitig (`useDashboardLoad`, Z. 47).

### 2.5 Themen-Detail / Unterthema-Auswahl — vorhanden
`ThemaDetailView.tsx` (`src/components/ueben/dashboard/`) rendert die Unterthemen als `<Chip label count aktiv farbe onClick>` in einer `<FilterSection titel="Unterthemen">`. Helper in `themaDetailHelpers.tsx`: `FilterSection`, `Chip`, `FortschrittsBalken`, `MasteryBadges`.

### 2.6 Was fehlt
1. Header-Button, der das Akkordeon öffnet.
2. Klickbarkeit **pro Lernziel** in Akkordeon + Mini-Modal (heute nur pro Thema).
3. Die Lernziel-Karte mit Fortschrittsdetails.
4. Lernziele-Icon je Unterthema in `ThemaDetailView`.
5. Üben-Start gefiltert auf die Fragen eines Lernziels.

## 3. Begriffe

- **Lernziel:** Kanonische Lerneinheit mit stabiler `id`, `bloom`-Stufe (K1–K6), Zugehörigkeit `fach`/`thema`/`unterthema?`. Trägt bei Abruf das berechnete `fragenIds`.
- **`fragenIds`:** Pro-Abruf vom Backend berechnete Liste der Frage-IDs eines Lernziels. Quelle der Üben-Auswahl.
- **`FragenFortschritt`:** Pro-Frage-Fortschritt (`fortschrittStore`): `{ versuche, richtig, richtigInFolge, sessionIds, letzterVersuch: ISO-String, mastery }`.
- **`MasteryStufe`:** Pro-Frage-Niveau — `neu | ueben | gefestigt | gemeistert`.
- **`LernzielStatus`:** Pro-Lernziel-Status — `gemeistert | gefestigt | inArbeit | offen`, berechnet von `lernzielStatus(lernziel, fortschritte)` (`mastery.ts:49-74`).
- **Lernziel-Karte:** Neue Komponente. Detailansicht eines einzelnen Lernziels mit Fortschritt; der Übergangspunkt vom „Lernziel ansehen" zum „Lernziel üben".
- **`fragenOverride`:** Optionaler Parameter von `starteSession` — eine fertige Fragenliste, die das Backend-Laden ersetzt.

## 4. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Keine Backend-Änderung.** Üben nach Lernziel ist ein reiner Client-Filter. | `lernziel.fragenIds` kommt schon vom Backend, die Fragen sind client-seitig geladen, `starteSession` kann via `fragenOverride` eine fertige Liste übernehmen. Kein neuer Endpoint, kein `FragenFilter`-Umbau, kein Apps-Script-Deploy — sinnvoll, weil das Backend ohnehin migriert wird (siehe `2026-05-18-backend-migration-design.md`). |
| 2 | **Klick auf ein Lernziel öffnet eine Lernziel-Karte** (kein Sofort-Start, kein vorgefiltertes Dashboard). | Mit dem Nutzer abgestimmt. Die Karte gibt Fortschritt/Motivation vor dem Üben — ein bewusster Klick mehr für mehr Lern-Kontext. |
| 3 | **Die Lernziel-Karte ist „Variante 3" (reich):** Breadcrumb, Lernziel-Text, Bloom-Badge, Status, Fortschrittsbalken, 4-Stufen-Aufschlüsselung, Empfehlung, „zuletzt geübt". | Mit dem Nutzer abgestimmt. Alle Werte sind aus vorhandenen Daten berechenbar (§6.3) — keine neuen Felder. |
| 4 | **Die Karte erscheint inline im Modal** (Master-Detail), nicht als gestapeltes Modal und nicht als eigene Route. | Konsistent mit `ThemaDetailView` (Dashboard wechselt Liste ↔ Detail). Kein Modal-Stacking. Zurück-Button führt zur Lernziel-Liste. |
| 5 | **Üben-Start über eine neue Store-Action `starteLernzielSession`**, die intern `starteSession` mit `fragenOverride` aufruft. | Kapselt den Client-Filter an einer Stelle, hält die Aufrufer (Karte) dünn. Wiederverwendet die gesamte bestehende Session-Maschinerie. |
| 6 | **Lernziele-Icon = Lucide `Flag`** — durchgängig LP + SuS. LP-seitiges `Target` wird angeglichen. | SuS-Seite (`LernzieleAkkordeon`, `ThemaKarte`) nutzt `Flag` bereits; es ist auch die Pool-Konvention (Zielfahne). LP-Fragensammlung nutzt abweichend `Target` — wird auf `Flag` umgestellt (§7). |
| 7 | **`Star` wird eindeutig „Favorit".** Die SuS-Mastery-Anzeige „Gemeistert" wandert von `Star` auf `CircleCheck`, die Schwierigkeit von `⭐`-Emoji auf Signal-Balken. | Mit dem Nutzer abgestimmt. Beseitigt die Mehrfachbelegung von `Star`. `CircleCheck` ist im `LernzieleAkkordeon` bereits das „erledigt"-Icon → macht die SuS-Seite auch intern konsistent. |
| 8 | **Schwierigkeits-Icon = Lucide `SignalLow / SignalMedium / SignalHigh`.** | Fertige 3-Stufen-Familie, passt zum `BarChart3` der Schwierigkeits-Filtersektion, Stufe an der Balkenzahl ablesbar. Ersetzt das `⭐`-Emoji (Emoji widerspricht ExamLabs Lucide-/`lint:no-emoji`-Konvention). |
| 9 | **Beide Einstiege (Header-Akkordeon, Unterthema-Icon) bleiben erhalten — bewusste Doppelstruktur.** | Entspricht den Pools (Header-Button + Chip-Icon): ein globaler und ein kontextueller Zugang. Der bestehende Thema-Flag-Button auf der `ThemaKarte` bleibt zusätzlich. |
| 10 | **`onThemaUeben` (Üben des ganzen Themas) bleibt neben dem neuen `onLernzielUeben` bestehen.** | Beide Granularitäten sind sinnvoll; das Thema-Üben ist kein Regressionsrisiko und kein Mehraufwand zu erhalten. |

## 5. Komponenten & UI

### 5.1 Einstieg 1 — Header-Button + Voll-Akkordeon

- Die SuS-Kopfzeile (`SuSAppHeaderContainer`) erhält einen Button „Lernziele" mit Lucide-`Flag`-Icon, rechts bei den bestehenden Aktionen (Suche, Theme, Hilfe, Abmelden).
- `AppShell` reicht einen Callback `onLernziele={() => setLernzieleOffen(true)}` an die Kopfzeile durch — verdrahtet den toten State.
- Das `LernzieleAkkordeon` selbst wird **nicht** umgebaut; es rendert bereits korrekt, sobald `lernzieleOffen === true`.

### 5.2 Einstieg 2 — Lernziele-Icon je Unterthema

- Jeder Unterthema-`Chip` in `ThemaDetailView` erhält am Ende ein kleines `Flag`-Icon, durch eine Trennlinie vom Chip-Körper abgesetzt.
- **Klick auf das Icon** → öffnet `LernzieleMiniModal`, fokussiert auf dieses Unterthema (das Modal scrollt zur / hebt die Unterthema-Gruppe hervor). **Klick auf den Chip-Körper** → Filter-Toggle wie bisher. `stopPropagation` trennt beide Klickziele.
- Das Icon erscheint nur, wenn das Unterthema Lernziele hat.
- `Chip` (`themaDetailHelpers.tsx`) bekommt dafür zwei optionale Props (`onLernzieleKlick?`, `lernzieleAnzahl?`); ohne diese verhält er sich unverändert (Schwierigkeit-/Fragetyp-Chips bleiben gleich).

### 5.3 Per-Lernziel-Klick im Akkordeon und Mini-Modal

- In `LernzieleAkkordeon` und `LernzieleMiniModal` wird jede Lernziel-Zeile klickbar.
- Beide Modals erhalten internen State `gewaehltesLernziel: Lernziel | null`. Ist er gesetzt, rendert das Modal die `<LernzielKarte>` statt der Liste; `onZurueck` setzt ihn zurück (Master-Detail, Entscheidung #4).
- Der bestehende „Fragen üben"-Button pro Thema bleibt (Entscheidung #10).

### 5.4 Die Lernziel-Karte (`LernzielKarte`, NEU)

**Pfad:** `src/components/ueben/LernzielKarte.tsx`
**Props:** `{ lernziel: Lernziel, fortschritte: Record<string, FragenFortschritt>, onUeben: (lernziel: Lernziel) => void, onZurueck: () => void }`

Inhalt (von oben nach unten):
- Zurück-Affordanz (führt zur Lernziel-Liste).
- Breadcrumb `fach › thema`.
- Lernziel-Text (`lernziel.text`).
- Bloom-Badge (`lernziel.bloom`, z. B. „K3 Anwenden") + Status-Wort (`lernzielStatus(...)`).
- Fortschrittsbalken + „X / Y gemeistert".
- 4-Stufen-Aufschlüsselung mit farbigen Markern: gemeistert / gefestigt / in Arbeit / offen.
- Empfehlungs-Banner: „N Fragen noch nicht sicher — dranbleiben."
- „Zuletzt geübt: …".
- „Üben"-Button → `onUeben(lernziel)`.

Styling reuse: wo passend, die vorhandenen `FortschrittsBalken`-/`MasteryBadges`-Muster aus `themaDetailHelpers.tsx` nutzen. Light/Dark Mode beachten (`.claude/rules/design-system.md`).

### 5.5 Üben-Flow

Neue Action `uebungsStore.starteLernzielSession(gruppeId, email, lernziel)`:
1. Gruppen-Fragen holen — bestehendes `uebenFragenAdapter.ladeFragen(gruppeId)` (adapter-gecacht, kein neuer Backend-Call).
2. Auf das Lernziel filtern: `fragen.filter(f => lernziel.fragenIds?.includes(f.id))`.
3. `starteSession(gruppeId, email, lernziel.fach, lernziel.thema, gefilterte, 'standard', undefined, freiwillig)` aufrufen. `freiwillig` = `getStatus(lernziel.fach, lernziel.thema) === 'nicht_freigeschaltet'` — gleiche Logik wie beim Thema-Üben.
4. Danach `openUebung(...)` und das Modal schliessen.

Der Session-Kopf zeigt — wie heute — `fach`/`thema`. Den konkreten Lernziel-Namen zusätzlich im Session-Kopf zu nennen ist eine kleine optionale Ergänzung (kein MVP-Bestandteil, siehe §12).

## 6. Datenfluss

### 6.1 Laden
Lernziele inkl. `fragenIds` werden bereits beim App-Mount geladen (`AppShell` → `ladeLernziele(gruppeId)`). Akkordeon und Mini-Modal bekommen `lernziele` + `fortschritte` als Props (wie heute). Kein zusätzlicher Ladepfad.

### 6.2 Üben
`LernzielKarte.onUeben` → `starteLernzielSession` → Client-Filter → `starteSession(fragenOverride)`. Kein Netzwerk-Roundtrip ausser dem ohnehin gecachten `ladeFragen`.

### 6.3 Karten-Berechnung (alles aus `lernziel` + `fortschritte`)
| Element | Quelle |
|---|---|
| Text / Fach / Thema / Bloom | `Lernziel`-Felder |
| Status | `lernzielStatus(lernziel, fortschritte)` |
| Balken & 4-Stufen | je `id` aus `lernziel.fragenIds`: `fortschritte[id]?.mastery ?? 'neu'`, gezählt nach `gemeistert / gefestigt / ueben / neu` |
| „X / Y gemeistert" | Y = `fragenIds.length`, X = Anzahl `mastery === 'gemeistert'` |
| Empfehlung „N noch nicht sicher" | Anzahl `mastery ∈ {neu, ueben}` |
| „Zuletzt geübt" | grösstes `letzterVersuch` über die Fragen des Lernziels (entfällt, wenn keine) |

## 7. Icon-Konsistenz (LP ↔ SuS)

Audit-Ergebnis: die einzige echte „gleiches Konzept, anderes Icon"-Abweichung ist Lernziele. Zusätzlich wird die `Star`-Mehrfachbelegung aufgelöst (Nutzer-Wunsch).

| Konzept | Vorher | Nachher | Dateien (Plan-Phase verifiziert exakte Zeilen) |
|---|---|---|---|
| Lernziele (LP) | `Target` | `Flag` | `DetailKarte.tsx`, `KompaktZeile.tsx` (Import + Nutzung) |
| Mastery „Gemeistert" (SuS) | `Star` | `CircleCheck` | SuS-Fortschritt-Analyse (`SuSAnalyse.tsx` o. ä.) |
| Schwierigkeit (SuS) | `⭐`-Emoji (1–3×) | `SignalLow/Medium/High` | `ThemaDetailView.tsx` (`SCHWIERIGKEIT_STERNE`) |
| Favorit | `Star` | `Star` (unverändert) | — |

- Neuer kleiner Helper `SchwierigkeitIcon({ stufe: 1|2|3 })`, der das passende `Signal*`-Icon wählt.
- `Chip.label` wird ggf. von `string` auf `ReactNode` erweitert, damit das Signal-Icon im Schwierigkeits-Chip eingebettet werden kann.
- **Nicht** Teil dieser Spec: die Gamification-Sterne pro Thema (`sterneText`, eine Spiel-Wertung) — eigener, eindeutiger Kontext.
- Fragetyp-Icons sind bereits konsistent (gemeinsame `FragetypIcon`-Registry) — keine Änderung.

## 8. Phasierung

Phasen sequentiell, je 1 Commit, jeweils `tsc -b` + `vitest` grün, `ci-check` clean.

### Phase 1 — Header-Einstieg verdrahten
- `AppShell`: `onLernziele`-Callback an `SuSAppHeaderContainer` durchreichen → `setLernzieleOffen(true)`.
- `SuSAppHeaderContainer`: `Flag`-Button „Lernziele".
- Ergebnis: das Voll-Akkordeon ist erreichbar (zunächst mit dem bestehenden Thema-Üben).
- Test: Unit für den Header-Button; E2E-Smoke folgt in Phase 6.

### Phase 2 — `LernzielKarte` + `starteLernzielSession`
- `LernzielKarte.tsx` neu (§5.4) — reine Präsentation, Berechnung aus Props.
- `uebungsStore.starteLernzielSession` neu (§5.5).
- Unit-Tests: Karten-Berechnungen (Status, 4-Stufen, „X/Y", Empfehlung, „zuletzt geübt"); Filter-Logik der Action.
- Noch nicht in die Modals eingebunden — eigenständig tsc-clean.

### Phase 3 — Per-Lernziel-Klick in Akkordeon + Mini-Modal
- `LernzieleAkkordeon` + `LernzieleMiniModal`: `gewaehltesLernziel`-State, klickbare Lernziel-Zeilen, Inline-Render der `LernzielKarte` mit Zurück.
- `onUeben` → `starteLernzielSession`; Modal schliesst, `openUebung`.
- Tests: Master-Detail-Umschaltung, Klick startet die Session mit der richtigen Fragenmenge.

### Phase 4 — Einstieg 2: Unterthema-Icon
- `Chip` (`themaDetailHelpers.tsx`): optionale Props `onLernzieleKlick?` / `lernzieleAnzahl?`.
- `ThemaDetailView`: Unterthema-Chips bekommen das `Flag`-Icon; Klick öffnet `LernzieleMiniModal` fokussiert auf das Unterthema.
- Tests: Icon erscheint nur bei vorhandenen Lernzielen; `stopPropagation` trennt Icon-Klick vom Filter-Toggle.

### Phase 5 — Icon-Konsistenz
- LP `Target` → `Flag` (`DetailKarte`, `KompaktZeile`).
- SuS Mastery `Star` → `CircleCheck`.
- `SchwierigkeitIcon`-Helper + `⭐` → `Signal*` in `ThemaDetailView`; `Chip.label` auf `ReactNode` falls nötig.
- Tests: betroffene Komponenten-Tests / Snapshots regenerieren.

### Phase 6 — Browser-E2E auf Staging
- Echte LP- + SuS-Logins (kein Demo-Modus), gemäss `.claude/rules/regression-prevention.md`.

## 9. Test-Strategie

### Unit (vitest, colocated)
| File | Coverage |
|---|---|
| `LernzielKarte.test.tsx` | Status, 4-Stufen-Aufschlüsselung, „X/Y", Empfehlung, „zuletzt geübt", Randfall 0 Fragen |
| `uebungsStore.test.ts` (erweitert) | `starteLernzielSession`: Filter auf `fragenIds`, `fragenOverride`-Übergabe, `freiwillig`-Logik |
| `LernzieleAkkordeon.test.tsx` (erweitert) | Master-Detail-Umschaltung, Klick pro Lernziel |
| `themaDetailHelpers`/`ThemaDetailView`-Tests | Unterthema-Icon-Sichtbarkeit, `stopPropagation` |
| Icon-Phase | betroffene Komponenten-Tests aktualisiert |

### Browser-E2E (Staging, echte Logins)
1. SuS-Login → Header-`Flag`-Button → Akkordeon öffnet.
2. Akkordeon: Lernziel anklicken → Lernziel-Karte mit Fortschritt erscheint inline → Zurück.
3. „Üben" auf der Karte → Session läuft mit genau den Fragen des Lernziels.
4. Themen-Detail: Unterthema-`Flag`-Icon → Mini-Modal → Lernziel → Karte → Üben.
5. Filter-Toggle des Unterthema-Chips funktioniert weiterhin (Klick neben dem Icon).
6. Icon-Konsistenz visuell: LP-Fragensammlung zeigt `Flag`; Schwierigkeit zeigt Signal-Balken.
7. Light/Dark Mode der neuen Karte.

## 10. Randfälle / Error-Handling

- **Lernziel ohne Fragen** (`fragenIds` leer/fehlt): Karte zeigt „Noch keine Fragen mit diesem Lernziel verknüpft", „Üben" deaktiviert.
- **Noch nie geübt:** „Zuletzt geübt" entfällt; Empfehlung wird zum Einstieg („Leg los — N Fragen warten").
- **Inaktive Lernziele** (`aktiv === false`): erscheinen nicht — `Dashboard` filtert das bereits (`renderThemaKarte`-Logik); Akkordeon/Mini-Modal müssen denselben Filter anwenden.
- **`fragenIds` zeigt auf eine Frage, die nicht (mehr) in den geladenen Fragen ist:** Filter ergibt eine kürzere Liste; ist das Ergebnis leer, „Üben" deaktiviert wie oben.
- **Verblasste Mastery** (lange nicht geübt): MVP nutzt den einfachen `lernzielStatus`; `berechneMasteryMitRecency` bleibt optional für später.
- Keine neuen `alert()`; Fehlerfälle über vorhandene Toast-/Inline-Muster (`.claude/rules/code-quality.md`).

## 11. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| `fragenIds` nicht in der SuS-Antwort befüllt | Niedrig | Hoch (Üben lädt 0 Fragen) | Phase 2 E2E/Smoke prüft eine echte `uebenLadeLernzieleV2`-Antwort; bei leerem `fragenIds` Randfall „keine Fragen" greift sauber. |
| Adapter-Cache (`ladeFragen`) noch nicht warm, wenn das Akkordeon vor dem Dashboard geöffnet wird | Niedrig | Mittel | `starteLernzielSession` ruft `ladeFragen(gruppeId)` und awaitet — der Adapter lädt bei kaltem Cache nach. Kein Sonderpfad nötig. |
| `Chip.label` `string` → `ReactNode` bricht andere Chip-Nutzungen | Niedrig | Niedrig (Build-Time) | Erweiterung ist additiv; `tsc -b` fängt Aufrufer; betroffene Tests in Phase 5. |
| Icon-Phase berührt LP-Code (ausserhalb des SuS-Feature-Kerns) | — | Niedrig | Auf Lernziele/`Star`/Schwierigkeit begrenzt (§7); kein breiteres Icon-Refactoring. |
| Modal-im-Modal-Eindruck beim Unterthema-Mini-Modal | Niedrig | Niedrig | Mini-Modal ersetzt keine andere Modal-Ebene; Karte erscheint inline (Entscheidung #4). |

## 12. Out of Scope

- Backend-Filter `lernzielIds` in `FragenFilter` / `uebenLadeFragenV2` — durch Entscheidung #1 unnötig.
- LP-seitiges Üben nach Lernziel (dies ist ein SuS-Feature).
- Eigener Session-Modus `'lernziel'` mit dediziertem Session-Kopf — MVP nutzt `'standard'`; Lernziel-Name im Session-Kopf ist eine spätere optionale Ergänzung.
- Schwierigkeits-Icon auf der LP-Seite, falls die LP-Fragensammlung Schwierigkeit nur als Text zeigt — keine echte Abweichung; das `SchwierigkeitIcon` steht bereit, falls die LP-Seite es später adoptiert.
- Gamification-Sterne (`sterneText`) — eigener Kontext, bleibt `Star`.
- Recency-verblasste Mastery auf der Karte (`berechneMasteryMitRecency`).
- `.superpowers/` in `.gitignore` aufnehmen — separates Housekeeping, eigener Commit (nicht in diesem Feature-Branch).

## 13. Erfolgs-Kriterien

- Der tote `lernzieleOffen`-State ist verdrahtet; das Voll-Akkordeon ist über einen Header-`Flag`-Button erreichbar.
- SuS kann ein einzelnes Lernziel anklicken, sieht die Lernziel-Karte mit Fortschritt und übt mit genau dessen Fragen.
- Unterthema-Chips im Themen-Detail haben ein `Flag`-Icon zum Mini-Modal; der Filter-Toggle funktioniert weiterhin.
- Lernziele zeigen LP + SuS dasselbe `Flag`-Icon; `Star` ist eindeutig „Favorit"; Schwierigkeit nutzt Signal-Balken.
- Keine Backend-/Apps-Script-Änderung.
- `tsc -b`, `vitest`, alle Lint-Gates, `vite build` grün.
- Browser-E2E auf Staging mit echten Logins bestanden (§9).
