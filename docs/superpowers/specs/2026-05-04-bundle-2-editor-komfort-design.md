# Bundle 2 — Editor-Komfort

**Datum:** 2026-05-04
**Branch:** `feature/bundle-2-editor-komfort`
**Vorgänger:** User-Tickets (Triage 04.05.2026, siehe `HANDOFF.md` „Fragetyp- und Suche-Bugs"). Ticket 5 (Punkte pro Option für DnD-Bild + Bildbeschriftung) verworfen — Status-quo ist äquivalent (proportionale Verteilung).

## Problem

Drei Editor-UX-Schwachstellen, von User in derselben Triage-Runde gemeldet:

1. **Lernzieldropdown reagiert nicht auf Fachwechsel** — Wenn der LP im Frageneditor das Fach wechselt, bleibt die Lernziel-Liste auf dem alten Fach. `apiLadeLernziele(email, fachbereich)` ist fach-spezifisch, aber der Caller in `SharedFragenEditor.tsx:172` hat keinen Trigger auf `fachbereich`-Wechsel. Dazu kommt: bestehende Lernziel-IDs sind nach Fachwechsel invalid (gehören dem alten Fach), bleiben aber im `frage.lernzielIds`.

2. **Thema-Eingabe ohne Vorschläge** — Der LP tippt ein Thema in das `thema`-Pflichtfeld (z.B. „Konjunkturindikatoren"), aber das Editor-Input ist eine plain-text-Eingabe ohne Autocomplete. Bei mehreren LPs in derselben Fachschaft entstehen Duplikate-mit-Schreibvariationen („Konjunktur" vs. „Konjunkturindikatoren" vs. „Konjunkturzyklus") — dies fragmentiert den Fragensammlung-Pool und verschlechtert Filter/Suche.

3. **Zielzonen ohne Namen bei DnD-Bild und Bildbeschriftung** — Hotspot hat bereits `HotspotBereich.label: string` (z.B. „Konjunkturindikator") als Zonennamen, der im LP-Editor und in der Korrektur-Vollansicht angezeigt wird. `DragDropBildZielzone` und `BildbeschriftungLabel` haben hingegen kein Beschriftungsfeld — der LP sieht im Editor und in der Korrektur nur „Zone 1, Zone 2, …". Das erschwert die Übersicht bei mehreren Zonen erheblich (besonders DnD-Bild mit oft 6-8 Zonen).

## Lösung

Drei unabhängige UI-Features, gemeinsam als Bundle 2 implementiert (additiv, kein Breaking Change, keine Daten-Migration nötig).

### Feature 1: Lernziel-Auto auf Fach (Bug 2)

**Trigger:** Wenn `fachbereich` im Frageneditor wechselt, dann:
- `frage.lernzielIds = []` (Reset, weil alte Auswahl invalid für neues Fach)
- Lernziel-Dropdown lädt frisch via `apiLadeLernziele(email, neuerFachbereich)`
- Reset-Banner („Lernziele wurden bei Fachwechsel zurückgesetzt") in LernzielWaehler für 5s sichtbar (Auto-Hide-Timer, nicht dismissible — Hint, nicht Action)

**Implementation-Stellen (zwei Edits in SharedFragenEditor):**
- Z. 172 `setFachbereich`-State-Setter wrappen: bei Fachwechsel `setLernzielIds([])` triggern + Banner-Flag setzen
- Z. ~619 (`useEffect` für Lernziele-Load mit `[]`-deps): Fachbereich als Dep ergänzen oder separaten Effect, sodass Lernziele bei Wechsel neu geladen werden

**Begründung Reset (vs. Behalten):** Lernziele sind in `apiLadeLernziele` über `fachbereich`-Parameter geladen, also fach-spezifisch. Eine Lernziel-ID aus VWL macht in BWL keinen Sinn (würde nicht im Dropdown auftauchen, aber im Storage referenzieren). Reset ist der einzig konsistente State.

### Feature 2: Themen-Autocomplete (Bug 3)

**UI:** Native HTML `<datalist>`-Element neben dem Themen-`<input>`. Browser handhabt adaptive Filterung (substring-match) selbst.

**Datenquelle:** Themen aus `useFragenbankStore.summaries`, gefiltert nach aktuellem `fachbereich`, dedupliziert via `Set<string>`. Memo-Hook `useThemenVorschlaege(fachbereich)`.

**Begründung Native datalist (vs. Custom-Dropdown):**
- Browser-native, accessibility-OK out of the box
- Kein eigener JS-Filter-Code nötig
- Keine z-index/Stacking-Probleme (Browser rendert overlay)
- Konsistent mit existing Editor-Inputs (kein Stylebreak)

### Feature 3: Zielzonen-Namen (Bug 6)

**Type-Erweiterung in `packages/shared/src/types/fragen-core.ts`:**
- `DragDropBildZielzone.label?: string` (neu, optional)
- `BildbeschriftungLabel.label?: string` (neu, optional)
- `HotspotBereich.label: string` bleibt unverändert (schon required)

**Editor-UI:** Pro Zone ein optionales Input-Feld „Zonenname" (placeholder: „z.B. Aktiva, Eingang, Konjunkturindikator"), neben dem polygon/position-Editor.

**LP-Korrektur-Vollansicht:** Zone-Header zeigt `label` (Fallback: „Zone N") für DnD/Bildbeschriftung. Konsistent zum Hotspot-Header-Format.

**Privacy:** `label` wird in der Apps-Script-Bereinigung `bereinigeFrageFuerSuS_` aus `zielzonen[]` und `beschriftungen[]` gestripped — bei diesen Fragetypen würde der Zonenname die Lösung verraten (z.B. Zone „Aktiva" mit `korrekteLabels: ['Aktiva']`).

**Hotspot-Sonderfall:** `HotspotBereich.label` wird NICHT gestripped — bei Hotspot ist `label` semantisch die Aufgabenstellung pro Bereich („Klick auf Konjunkturindikator"). SuS braucht das.

## Scope

### Frontend

**Type-Definition** (`packages/shared/src/types/fragen-core.ts`):
- Z. 587-595 (`BildbeschriftungLabel`): `label?: string` ergänzen
- Z. 618-629 (`DragDropBildZielzone`): `label?: string` ergänzen

**Editor-Komponenten:**
- `packages/shared/src/editor/SharedFragenEditor.tsx`: `setFachbereich`-Wrapper, Lernziel-Reset bei Fachwechsel
- `packages/shared/src/editor/components/LernzielWaehler.tsx`: Reset-Banner-Prop + 5s-Timer
- `packages/shared/src/editor/sections/MetadataSection.tsx`: `<datalist>` für Themen-Input
- `packages/shared/src/editor/typen/HotspotEditor.tsx`: keine Änderung (label schon vorhanden)
- `ExamLab/src/components/lp/frageneditor/DragDropBildEditor.tsx`: Zonennamen-Input pro Zielzone
- `ExamLab/src/components/lp/frageneditor/BildbeschriftungEditor.tsx`: Zonennamen-Input pro Beschriftung

**Hooks:**
- `ExamLab/src/hooks/useThemenVorschlaege.ts` (neu): Memo-Selector über fragenbankStore.summaries

**Korrektur:**
- `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`: Zone-Header für DnD/Bildbeschriftung mit `label`-Fallback

**SuS-Renderer:** unverändert (label kommt durch Backend-Stripping gar nicht erst an)

### Backend (Apps-Script)

**`ExamLab/apps-script-code.js` Z. 2206:**
```js
{ feld: 'zielzonen', subFelder: ['korrekteLabels', 'erklaerung', 'label'] }
{ feld: 'beschriftungen', subFelder: ['korrekt', 'caseSensitive', 'erklaerung', 'label'] }
```

Hotspot-Stelle (`{ feld: 'bereiche', subFelder: ['korrekt', 'erklaerung'] }`) bleibt unverändert.

**Call-Graph-Hinweis:** Die Erweiterung von `LOESUNGS_FELDER_` wirkt automatisch in `bereinigeFrageFuerSuSUeben_`, weil dieses `bereinigeFrageFuerSuS_` aufruft (S135-Memory-Lehre: indirekte Abhängigkeiten via Call-Graph). SuS-Üben-Modus wird also auch für DnD/Bildbeschriftung das `label` korrekt strippen.

**Apps-Script-Deploy:** nötig (1 neue Bereitstellung).

### Tests

- **`packages/shared/src/editor/pflichtfeldValidation.test.ts`** — verifizieren dass `label` für DragDropBildZielzone + BildbeschriftungLabel optional ist (kein Pflicht-Outline-Trigger).
- **`ExamLab/src/hooks/useThemenVorschlaege.test.ts`** (neu) — Selector dedupes + filtert nach Fachbereich.
- **`packages/shared/src/editor/SharedFragenEditor.test.tsx`** (existierend, falls vorhanden — sonst neu) — Lernziel-Reset bei Fachwechsel.
- **GAS-Test-Shim `testBundle2Privacy_`** — Apps-Script-Test dass `label` aus `zielzonen[]` und `beschriftungen[]` für SuS-Aufgaben-Response gestripped wird, aber NICHT aus `bereiche[]` (Hotspot bleibt sichtbar).

## Risiken / Out of Scope

### Risiken

**1. Bestehende Pool-Fragen ohne `label`:** Alle existierenden DnD-Bild + Bildbeschriftung-Fragen haben kein `label` (Feld ist neu). UI muss damit umgehen (Fallback „Zone N"). Test verifiziert das.

**2. Apps-Script-Deploy + Frontend-Deploy müssen synchron:** Wenn Frontend zuerst deployed wird (User schreibt `label`), aber Apps-Script noch alt ist, würde `label` im SuS-Response durchkommen → Lösungsverrat. Mitigation: Apps-Script ZUERST deployen (additive subFelder-Liste ist abwärtskompatibel — alte Fragen ohne `label` bleiben unverändert), dann Frontend. Plus: User-Tasks im Plan dokumentieren (analog Bundle J).

**3. LernzielWaehler-Reset könnte LP überraschen:** Wenn LP unbedacht das Fach wechselt und die bestehende Lernziel-Auswahl verlieren möchte. Mitigation: 5s-Banner-Hinweis. Confirm-Dialog vor Reset wäre overkill (Lernziel-Auswahl ist metadata, kann wieder gewählt werden).

### Out of Scope

- **Bug 1 (Icons-Vereinheitlichung):** eigenes Bundle 3, eigenes Brainstorming
- **Bug 5 (Punkte pro Option):** verworfen, Status-quo OK
- **Hotspot-`label`-Migration:** nicht nötig, Hotspot bleibt unverändert
- **Themen-Autocomplete unterhalb des Fachs (z.B. Unterthema):** Out of Scope, nur top-level Thema
- **Lernziel-Multi-Fach-Verknüpfung:** nicht unterstützt, 1 Lernziel = 1 Fach (per existing Datenmodell)

## Implementation-Reihenfolge

1. **Phase 1 — Type + Backend (Apps-Script)**
   - Type-Erweiterung in fragen-core.ts
   - Apps-Script LOESUNGS_FELDER_ ergänzen
   - GAS-Test-Shim schreiben
   - **User-Task: Apps-Script-Deploy**

2. **Phase 2 — Bug 6 Frontend (Zielzonen-Namen)**
   - DragDropBildEditor + BildbeschriftungEditor: Input-Feld pro Zone
   - KorrekturFrageVollansicht: Zone-Header mit Fallback
   - Tests + Verifikation

3. **Phase 3 — Bug 3 (Themen-Autocomplete)**
   - useThemenVorschlaege Hook
   - MetadataSection datalist-Anbindung
   - Test

4. **Phase 4 — Bug 2 (Lernziel-Auto)**
   - SharedFragenEditor setFachbereich-Wrapper
   - LernzielWaehler Reset-Banner
   - Test

5. **Phase 5 — Browser-E2E + Merge**
   - Staging-Push, User-Test mit echten Logins (LP wr.test@gymhofwil.ch)
   - Merge → main, push → Production

## Verifikation

- `tsc -b` clean
- `vitest run` alle bestehenden Tests grün, neue Tests grün
- `lint:as-any` 0/0/0
- `npm run build` clean
- Browser-E2E mit echten Logins:
  - LP wechselt Fach im Editor → Lernziele resetten + Reset-Banner sichtbar
  - LP tippt Thema → Vorschläge erscheinen, Tab-Completion funktioniert
  - LP setzt Zonennamen in DnD-Bild + Bildbeschriftung → in Korrektur-Vollansicht sichtbar
  - SuS startet Übung mit DnD-Bild-Frage → Zonen ohne Namen (nur Nummern), keine Lösungsverrat-Hint via DevTools-Network
  - SuS startet Hotspot-Frage → Zonen mit `label` sichtbar (Aufgabenstellung)

## Aufwand-Schätzung

- **Frontend:** ~6-8 Files, ~150 Zeilen Code
- **Backend:** 1 Apps-Script-Datei, 2 Zeilen-Änderung + Test-Shim
- **Tests:** 3-5 neue
- **Sessions:** 1 (eine Session mit Phasen 1-5, alle drei Features)
- **Branch-Größe:** ~3 atomare Commits + Doku/HANDOFF-Update
