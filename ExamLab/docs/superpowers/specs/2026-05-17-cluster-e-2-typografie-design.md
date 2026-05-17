---
title: Cluster E.2 — Typografie-Migration (Heading-Sweep + Lint-Gate)
date: 2026-05-17
status: Spec-Review ausstehend
verwandt: Cluster E (2026-05-11), Cluster G (Icon-System)
ausgegliedert_aus: 2026-05-11-cluster-e-konsistenz-design.md (Phase 2)
---

# Cluster E.2 — Typografie-Migration (Heading-Sweep + Lint-Gate)

## 1. Zweck

ExamLab hat heute eine inkonsistente Typografie-Landschaft: `<h1>`/`<h2>`/`<h3>` werden nebeneinander mit verschiedenen Klassen-Kombinationen genutzt (`text-xs`/`text-sm`/`text-lg`/`font-bold`/`font-semibold` in beliebigen Mischungen). Tab-Headings sind teilweise als `<h3 text-sm>` zu klein für ihre Hierarchie-Ebene. Manche Top-Level-Seiten haben Display-Titel, andere nicht.

Die `TYPO`-Konstanten (`src/styles/typografie.ts`) und der Tab-Registry (`src/utils/tabRegistry.ts`) wurden bereits in einer früheren Cluster-E-Arbeit angelegt, sind aber nur in 4 Files (BatchConfirmModal + 3 Suche-UI-Files) tatsächlich verwendet.

Ziel von E.2: Vollständige Migration aller App-Chrome-Headings auf die 5-Tier-Skala, neues Page-Title-Pattern auf allen 5 Top-Level-Seiten, und ein Lint-Gate, das Drift verhindert. E.3-E.5 (Favoriten-Backend-Sync, Star-Toggle, Favoriten-Picker) sind **explizit nicht** Teil dieser Spec und werden in einer Folge-Spec behandelt.

## 2. Begriffe

- **App-Chrome:** Alles in der UI was nicht User-Content ist — Headings die vom Entwickler im JSX gesetzt werden. Migration-Pflicht.
- **User-Content:** Headings die zur Runtime aus Tiptap-Editor-State gerendert werden (z.B. Aufgaben-Text mit User-eingegebener Überschrift). Nicht im Source greppbar, kein TYPO. Ausgenommen.
- **TYPO-Skala:** Fünf Tiers in `src/styles/typografie.ts`: Display (24/700), H1 (20/700), H2 (18/600), Body (14/400), Caption (12/500). Bereits existiert, unverändert.
- **PageTitle:** Neue Komponente die das Display-Pattern (Padding + Border-Bottom + `<h1 className={TYPO.display}>`) wrapped.
- **Top-Level-Seite:** Surface mit eigenem Route-Eintrag und eigenem Display-Titel. Heute fünf: Prüfen, Üben, Fragensammlung, Einstellungen, Hilfe.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **TYPO bleibt unverändert.** `src/styles/typografie.ts` schon korrekt, kein Refactor. | Foundation existiert. |
| 2 | **Neue Komponente `<PageTitle titel="…" />`** für Display-Pattern. | Vermeidet Copy-Paste über 5 Top-Level-Seiten; konsistenter Padding/Border-Style. |
| 3 | **Migration vollständig** (Top-Level + Tab + Modals + Karten + Sub-Sections), NICHT phasenweise reduziert. | User-Entscheidung — saubere Skala statt graduelle Mischung. |
| 4 | **Lint-Gate `lint:typo-tokens` mit Baseline-Whitelist + Drift-Watch.** Format wie `audit-no-emoji.mjs`. | Pragmatisch für Restbestände nach Migration; verhindert Wachstum zuverlässig. |
| 5 | **Tiptap-Editor-Files via Whitelist ausgenommen.** Hardcoded Regex-Liste im Audit-Script. | User-Content darf nicht auf TYPO gemappt werden — Editor-Headings sind dynamisch. |
| 6 | **Phasenweise Migration in 6 Commits** auf Feature-Branch, jeder Commit ci-check grün. | Reviewbarkeit + Roll-Back-Granularität. |
| 7 | **Lint-Gate erst in Phase 6 aktiviert** (nicht in Phase 1). Baseline-File wird in Phase 1 initial befüllt mit Pre-Migration-Stand, in Phase 6 mit Post-Migration-Stand neu generiert. | Verhindert dass Migration-Commits selbst gegen das Gate failen. |
| 8 | **Keine responsive Type-Scale.** TYPO bleibt fix (text-2xl/-xl/-lg/-sm/-xs). | OoS; falls Mobile-Optimierung später nötig → Folge-Spec. |
| 9 | **PageTitle-Props minimal:** nur `titel: string`. Kein Aktion-Slot. | YAGNI; nachträglich ergänzen wenn echter Use-Case auftaucht. |

## 4. Komponenten

### 4.1 `<PageTitle>` (`src/components/shared/PageTitle.tsx` — neu)

```tsx
import { TYPO } from '@/styles/typografie'

interface Props {
  titel: string
}

export function PageTitle({ titel }: Props) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
      <h1 className={TYPO.display}>{titel}</h1>
    </div>
  )
}
```

**Verwendung:**
```tsx
// EinstellungenPanel.tsx
<PageTitle titel="Einstellungen" />
{/* darunter Tabs + Tab-Content */}
```

**Test (`PageTitle.test.tsx`):**
- Rendert `<h1>` mit korrekter ARIA-Rolle.
- Heading-Text = `titel`-Prop.
- TYPO.display-Klassen sind im className enthalten.

### 4.2 Audit-Skript (`scripts/audit-typo-tokens.mjs` — neu)

Analog zu `scripts/audit-no-emoji.mjs` und `scripts/audit-no-inline-svg.mjs`. Scannt rekursiv `ExamLab/src/**/*.tsx` (NICHT `packages/shared/src/editor/**`) nach `<h1`/`<h2`/`<h3` und prüft ob in derselben Zeile ODER innerhalb derselben JSX-Expression `TYPO.` oder ein Template-Literal mit `${TYPO.` referenziert wird.

**Modi:**
- `--strict` (CI): failt bei jedem Treffer der nicht in der Baseline ist. Exit 1 bei Wachstum, Exit 0 bei Schrumpfung (mit Hinweis Baseline updaten).
- `--baseline` (Dev): generiert/aktualisiert `scripts/typo-tokens-baseline.json` mit aktuellen Treffern.

**Baseline-Format (`scripts/typo-tokens-baseline.json`):**
```json
{
  "totalCount": 87,
  "byFile": {
    "ExamLab/src/components/lp/FragenBrowser.tsx": 3,
    "ExamLab/src/components/sus/SusStartseite.tsx": 1,
    ...
  }
}
```

**Whitelist im Script-Code:**
```js
const WHITELIST_DIRS = [
  /packages\/shared\/src\/editor\//,
]
const WHITELIST_FILES = [
  // Wird in Phase 1 nach Audit-Lauf befüllt, falls False-Positives auftreten
]
```

### 4.3 Bestehende Dateien zu migrieren (Schätzung)

| Bereich | Schätzung Files | Pattern |
|---|---|---|
| Top-Level-Seiten (LP+SuS) | ~5 | `<PageTitle titel="…" />` |
| Tab-Inhalte (Einstellungen 10 + Hilfe 10) | ~20 | `<h1 className={TYPO.h1}>` |
| Modal/Dialog-Titel | ~30-40 | `<h2 className={TYPO.h2}>` |
| Karten-Header (PruefungsKarte, ConfigListe, etc.) | ~15-20 | `<h2 className={TYPO.h2}>` |
| Sub-Section-Header | ~10-15 | `<h3 className={TYPO.body + ' font-semibold'}>` oder analog |
| `package.json` (ExamLab) | 1 | Neuer Script + ci-check-Eintrag |

Tatsächliche Liste wird in Plan-Phase via Audit-Skript-Erstlauf bestimmt.

## 5. Migration-Phasen

Jede Phase = 1 Commit auf `feature/cluster-e-2-typografie`. `cd ExamLab && npm run ci-check` grün vor jedem Commit. Browser-E2E am Ende von Phase 2, 3, 4 (visuelle Verifikation).

### Phase 1 — Foundation + Audit-Skript
- `PageTitle.tsx` + `PageTitle.test.tsx` erstellen.
- `audit-typo-tokens.mjs` schreiben (ohne CI-Hook).
- `npm run audit-typo-tokens -- --baseline` ausführen → `typo-tokens-baseline.json` initial mit Pre-Migration-Trefferzahl füllen.
- Commit: „Cluster E.2 Phase 1: PageTitle-Komponente + Audit-Skript-Foundation".
- **Verhalten unverändert**, Foundation steht.

### Phase 2 — Page-Title-Pattern auf 5 Top-Level-Seiten
- Identifiziere die 5 Top-Level-Komponenten via `App.tsx`/Router-Grep.
- Aktuelle Kandidaten (Plan-Phase verifiziert):
  - `src/components/settings/EinstellungenPanel.tsx`
  - `src/components/lp/HilfeSeite.tsx`
  - `src/components/lp/LPStartseite.tsx` (oder Prüfen-Root)
  - SuS-Üben-Root
  - `src/components/lp/fragensammlung/FragenBrowser.tsx`
- Jede bekommt `<PageTitle titel="…" />` oben.
- Existierende Top-Level-Headings die jetzt redundant sind, entfernen oder herabsetzen.
- Browser-E2E: 5 Seiten zeigen einheitlichen Display-Titel.
- Commit: „Cluster E.2 Phase 2: Page-Title-Pattern auf 5 Top-Level-Seiten".

### Phase 3 — Tab-Inhalt-Header (Einstellungen + Hilfe)
- 10 Einstellungen-Tab-Komponenten (Profil, Lernziele, Favoriten, Problemmeldungen, Übungen, Fragensammlung, Testdaten, Tags, Admin, KI-Kalibrierung).
- 10 Hilfe-Tab-Komponenten.
- Tab-Haupttitel: `<h1 className={TYPO.h1}>{tab.titel}</h1>`.
- Sub-Section-Header innerhalb Tab: `<h2 className={TYPO.h2}>`.
- Browser-E2E: Tab-Header sehen konsistent aus, kein Hierarchie-Bruch.
- Commit: „Cluster E.2 Phase 3: Tab-Inhalt-Header (20 Tabs auf TYPO.h1/h2)".

### Phase 4 — Modal/Dialog-Titel
- `src/components/shared/BaseDialog.tsx` Default-Title-Style auf `TYPO.h2` setzen (falls schon zentral).
- Alle direkten BaseDialog-Konsumenten die eigene Title-Klassen haben durchsuchen.
- ConfirmModal, BatchConfirmModal, BatchLoeschConfirmModal, EditModal (Tags), MergeModal (Tags), ResetConfirmModal etc.
- Editor-Modals (KI-Editor, Fragen-Editor-Wrappers) — Whitelist-Check.
- Commit: „Cluster E.2 Phase 4: Modal/Dialog-Titel auf TYPO.h2".

### Phase 5 — Karten + Sub-Section-Header
- `PruefungsKarte`, `ConfigListe`, `KorrekturFrageKarte`, `FragenZeile`/`KompaktZeile`/`DetailKarte`, `TagsListe`, `FavoritenListe`-Items, etc.
- Karten-Titel: `<h2 className={TYPO.h2}>` oder kleiner je nach Visual-Hierarchie.
- Inline-Sub-Sections in komplexen Komponenten.
- Caption-Texte (`<p>`-Tags) bleiben unberührt — nur explizit getaggte `<h*>` werden migriert.
- Commit: „Cluster E.2 Phase 5: Karten + Sub-Section-Header".

### Phase 6 — Lint-Gate aktivieren
- `npm run audit-typo-tokens -- --baseline` neu ausführen → Post-Migration-Baseline.
- Verbleibende legitime Treffer (z.B. Editor-Whitelist-Lücken) explizit in Baseline-File festschreiben.
- `package.json` ExamLab:
  ```diff
   "lint:no-emoji": "node ../scripts/audit-no-emoji.mjs --strict",
  +"lint:typo-tokens": "node ../scripts/audit-typo-tokens.mjs --strict",
   "ci-check": "... && npm run lint:no-emoji && npm run lint:typo-tokens && ..."
  ```
- Commit: „Cluster E.2 Phase 6: lint:typo-tokens als CI-Gate aktiviert (Baseline N Treffer)".

## 6. Edge-Cases

1. **Conditional ClassName auf Heading:**
   ```tsx
   <h2 className={istAktiv ? 'text-lg font-semibold' : 'text-sm'}>
   ```
   Lint-Gate sieht keinen `TYPO.*`-Substring. Lösung: dynamische Heading-Styles via `${TYPO.h2}`-Template oder Hilfsfunktion `mitTypo(tier, extra)`. Im Audit als Verstoss markiert, im Plan via grep vor Phase 3 identifiziert.

2. **Tiptap-Editor-Renderer:** Tags entstehen zur Runtime aus Editor-Schema. Source-Grep findet sie nicht. Whitelist `packages/shared/src/editor/**`. Falls in `ExamLab/src/**` Tiptap-Mount-Points sind, einzeln in Phase 1 prüfen.

3. **AppHeader-Title vs. PageTitle:** AppHeader hat eigene Top-Bar. PageTitle ist Surface-Titel darunter. Beide parallel OK. Plan-Phase prüft visuell ob Padding/Border zusammen funktionieren (kein doppelter Border).

4. **Bestehende Komponenten mit eigener Heading-Hierarchie:** FragenBrowser hat heute Filter+Header in komplexerer Struktur. Plan-Phase entscheidet pro Fall: PageTitle ergänzen oder existing Header zum Display upgraden. Default: PageTitle ergänzen, alten Inline-Header herabstufen oder entfernen.

5. **Tests mit Heading-Selector:** Vitest-Tests die `screen.getByRole('heading', { level: 1 })` o.ä. nutzen können brechen wenn Hierarchie sich verschiebt. Pro Phase: `grep -l "getByRole.*heading" src/` durchgehen, ggf. Tests anpassen.

6. **Dark-Mode:** TYPO enthält keine Farb-Klassen. Dark-Mode-Farben bleiben getrennt (z.B. `text-slate-900 dark:text-slate-100`). Migration verändert Dark-Mode-Verhalten NICHT. Trotzdem in jeder Phase visuell prüfen.

7. **Karten-Header doppelte Hierarchie:** Wenn eine Karten-Liste innerhalb eines Tabs lebt (z.B. PruefungsKarte in LPStartseite), ist die Karte ein `<h2>` (Sub-Section unter Tab-H1). Aber wenn Karten in Modal lebt, ist Modal-Titel `<h2>` und Karte `<h3>`. Plan-Phase legt Heuristik fest.

8. **PageTitle-Padding kollidiert mit existierendem Layout:** Manche Top-Level-Seiten haben heute eigene Layout-Container mit eigenem Padding. `<PageTitle>` würde doppeltes Padding produzieren. Plan-Phase: pro Top-Level-Seite prüfen + anpassen.

## 7. Test-Strategie

### 7.1 Unit-Tests (Vitest)

- `PageTitle.test.tsx`: Rendert `<h1>` mit korrekter ARIA-Rolle, Heading-Text = Prop, TYPO.display-Klassen enthalten.
- `typografie.test.ts`: Bestehender Snapshot-Test bleibt, kein Refactor.

### 7.2 Lint-Gate-Test

`npm run lint:typo-tokens` in CI:
- Initial-Lauf nach Phase 6 grün gegen Baseline.
- Test: künstlich einen `<h3 className="text-sm">` ohne TYPO einfügen → Gate failt mit Exit 1.

### 7.3 Browser-E2E (Live-Backend, echte Logins)

Phase 2: Login als LP → durch alle 5 Top-Level-Seiten klicken → jede zeigt Display-Titel oben links, Border-Bottom darunter.

Phase 3: Einstellungen + Hilfe öffnen → alle Tab-Inhalte zeigen `TYPO.h1`-Titel oben.

Phase 4: Ein Modal pro Kategorie öffnen (BaseDialog, ConfirmModal, EditModal) → Titel auf TYPO.h2.

Phase 5: Karten-Listen besuchen (LPStartseite, FragenBrowser, Korrektur-Vollansicht) → Karten-Titel visuell konsistent.

### 7.4 Visuelle Verifikation

- Vor/Nach-Screenshots der 5 Top-Level-Seiten (Light + Dark).
- Vor/Nach-Screenshots einer Tab-Seite (Einstellungen → Profil).
- Vor/Nach-Screenshots eines Modals (BaseDialog).

## 8. Out-of-Scope (für späteren Cluster oder eigenes Spec)

- **Favoriten-Backend-Migration (E.3):** localStorage → `LPProfil.favoriten`. Eigene Spec.
- **Star-Toggle in Tab-Headers (E.4):** `<TabStarToggle>`-Komponente. Eigene Spec.
- **Favoriten-Picker (E.5):** Modal mit gruppierten Tab-Liste. Eigene Spec.
- **Responsive Type-Scale:** Mobile-Variante mit kleineren Sizes. Wenn nötig, separate Spec.
- **Storybook für Typografie-Galerie:** Cluster G OoS, falls Storybook später aufgesetzt wird.
- **`<p>`-Tag-Migration auf TYPO.body/caption:** Body-Texte sind heute meist ohne explizite Größenklasse oder mit `text-sm`. Migration wäre Mega-Sweep, OoS.
- **Karten-Header-Hierarchie-Refactor:** Falls Plan-Phase grobe Inkonsistenzen findet (z.B. inkonsistente h2/h3-Nutzung in Karten), nur dokumentieren, nicht fixen.

## 9. Abhängigkeiten zu anderen Clustern

- **Cluster G (Icon-System):** Lucide-Icons werden ggf. neben Headings stehen (z.B. Tab-Header mit Icon + Titel). Keine direkte Abhängigkeit, aber Visual-Pair-Konsistenz (Icon-Größe `md` = 20px, harmoniert mit `TYPO.h1` = 20px Font).
- **Cluster B (Header-Redesign):** AppHeader bleibt unberührt. PageTitle ist darunter.
- **Cluster H (Tag-Modell):** TagsTab (Cluster H Phase 2) wird in Phase 3 migriert (eines der 10 Einstellungen-Tabs).
- **Cluster C (Globale Suche):** Such-UI-Komponenten (`TrefferZeile`, `EmptyState`, `QuellSektion`) nutzen bereits TYPO — nichts zu tun.

## 10. Offene Punkte (vor Implementation klären)

- **Top-Level-Seiten-Liste:** Plan-Phase greppt App.tsx/Router exakt. Aktuell 5 vermutet, könnte 6 sein (Korrektur-Vollansicht? Live-Durchführen?). Plan-Phase verifiziert.
- **PageTitle in SuS-Pfaden:** SuS hat eigene Surfaces (Üben, Live-Prüfung, Beendet-Screen). Plan-Phase entscheidet ob PageTitle dort auch sinnvoll ist oder ob SuS-spezifisches Layout-Pattern besser passt.
- **BaseDialog Title-Default:** Existiert bereits ein zentraler Title-Style in BaseDialog, oder werden Title-Klassen pro Konsument neu gesetzt? Phase-4-Plan prüft + setzt ggf. Default in BaseDialog selbst (single source).
- **Sub-Section-Header in komplexen Tabs:** Z.B. KI-Kalibrierung hat mehrere Sub-Sections — wie strukturieren? Plan-Phase definiert Faustregel: zweistufig (`TYPO.h1` für Tab, `TYPO.h2` für Sub-Sections), dreistufig (`+ TYPO.h2`+`TYPO.body font-semibold` für tieferes Nesting) nur wenn echt nötig.
- **Tests die `getByText('Titel')` statt `getByRole('heading')` nutzen:** Migration kann Tests unbemerkt brechen wenn dort die Größe geprüft wird via class. Phase 1: greppen.

## 11. Akzeptanzkriterien

1. `PageTitle`-Komponente existiert + ist getestet.
2. Audit-Skript `audit-typo-tokens.mjs` existiert und läuft als `lint:typo-tokens` in CI-check.
3. Alle 5 Top-Level-Seiten zeigen einen einzigen Display-Titel oben links via PageTitle (Browser-verifiziert Light+Dark).
4. Alle 10 Einstellungen-Tabs + 10 Hilfe-Tabs haben `<h1 className={TYPO.h1}>` als Tab-Inhalt-Titel (Browser-verifiziert).
5. Mindestens 80% der Modals/Dialoge nutzen `TYPO.h2` für Titel (Rest in Baseline-Whitelist mit Begründung).
6. Mindestens 80% der Karten-Header nutzen `TYPO.h2` für Karten-Titel (Rest in Baseline-Whitelist).
7. `npm run ci-check` grün auf Feature-Branch + auf main nach Merge.
8. Vitest-Suite bleibt grün (1839 + 4 todo Baseline ggf. korrigieren wenn Heading-Selector-Tests angepasst werden müssen).
9. Spec-Status-Header der bestehenden `2026-05-11-cluster-e-konsistenz-design.md` annotiert: „E.2 ausgelagert in 2026-05-17-cluster-e-2-typografie-design.md".
