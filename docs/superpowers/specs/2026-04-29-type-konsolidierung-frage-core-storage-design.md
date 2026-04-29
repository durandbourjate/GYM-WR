# Spec — Type-Konsolidierung Frage: Core + Storage

**Datum:** 2026-04-29
**Bundle:** noch zu nummerieren (Vorschlag: Bundle K)
**Geschätzte Sessions:** 3
**Backend-Risiko:** keiner — kein Apps-Script-Deploy nötig

---

## Ziel

Auflösung der FrageBase-Divergenz zwischen `packages/shared/src/types/fragen.ts` (691 Z.) und `ExamLab/src/types/fragen.ts` (682 Z.) durch eine klare Schichtung in zwei Type-Files: `fragen-core.ts` (UI/Editor-Layer in shared) und `fragen-storage.ts` (Backend-Layer in ExamLab).

**Drei systematische Probleme die gelöst werden:**

1. **Drift:** Beide Files sind ~98% identisch, müssen aber manuell synchron gehalten werden. Änderungen werden vergessen, `unknown`-Stellen in shared driften gegenüber konkreten Typen in ExamLab.
2. **Schicht-Vermischung:** shared definiert UI-Editor-Konzepte UND verwässerte Backend-Konzepte (`unknown` für Berechtigungs-Modell). Externe shared-Konsumenten (Übungspool, eventuell Unterrichtsplaner) schleppen Backend-Konzepte mit.
3. **Inkonsistente Imports:** 14+ ExamLab-Files importieren bereits aus `@shared/types/fragen`, andere nutzen den lokalen `ExamLab/src/types/fragen.ts`. Kein klares Pattern.

**Was NICHT in dieses Bundle gehört (TODO für später):**

- **Media-Phase 3-5 Dual-Write Migration** — die `MediaQuelle`-Felder (`quelle?`, `bild?`, `pdf?: MediaQuelle`) sind in shared definiert, aber Apps-Script kennt sie nicht. Echte Migration ist eigenes Bundle in Bundle-J-Grösse (~3-4 Sessions, Apps-Script-Deploy, evtl. Daten-Migration).
- **`as any`-Cleanup** — 72 Stellen aktuell (von 58 gewachsen), eigenes Hygiene-Bundle.

---

## Architektur

### Datei-Layout

**Neu erstellt:**

```
packages/shared/src/types/fragen-core.ts        (NEU — UI/Editor-Layer)
ExamLab/src/types/fragen-storage.ts             (NEU — Backend-Layer)
```

**Bleibt unverändert:**

```
packages/shared/src/types/auth.ts               (Pool-Welt: Rolle = 'admin' | 'lernend')
packages/shared/src/types/mediaQuelle.ts
ExamLab/src/types/auth.ts                       (ExamLab-Welt: Rolle = 'sus' | 'lp' | 'unbekannt' + Berechtigung + EffektivesRecht)
ExamLab/src/types/ueben/auth.ts                 (Standalone-Üben-Auth, separater Kontext)
ExamLab/src/types/pool.ts                       (PoolFrageSnapshot)
ExamLab/src/types/tags.ts                       (Tag-Interface mit farbe/ebene)
ExamLab/src/types/ueben/fragen.ts               (Üben-spezifische Erweiterungen, importiert künftig aus core)
```

**Gelöscht (am Ende von Phase 5):**

```
packages/shared/src/types/fragen.ts             (durch fragen-core.ts ersetzt)
ExamLab/src/types/fragen.ts                     (durch fragen-storage.ts ersetzt)
```

### Inhalt von `fragen-core.ts` (shared)

UI/Editor-Layer ohne Auth-/Sharing-/Pool-Konzepte:

- `FrageBase` — gemeinsame Felder ohne `berechtigungen`/`_recht`/`geteilt`/`poolVersion`
  - `tags: string[]` (nur Namen)
- Discriminated Union `Frage`
- Enums: `Fachbereich`, `BloomStufe`
- Alle 18 Fragetyp-Interfaces als named exports: `MCFrage`, `RichtigFalschFrage`, `LueckentextFrage`, `FreitextFrage`, `BerechnungFrage`, `ZuordnungFrage`, `SortierungFrage`, `HotspotFrage`, `BildbeschriftungFrage`, `DragDropBildFrage`, `CodeFrage`, `AudioFrage`, `BuchungssatzFrage`, `TKontoFrage`, `BilanzERFrage`, `KontenbestimmungFrage`, `PDFFrage`, `ZeichnenFrage`
- Alle Sub-Types als named exports: `Luecke`, `ZuordnungPaar`, `BildbeschriftungLabel`, `HotspotBereich`, `DragDropBildLabel`, `DragDropBildZielzone`, `MCOption`, `BerechnungBeispiel`, `Buchung`, `BilanzPosten`, `KontenbestimmungEintrag`
- `Lernziel`, `FragenPerformance`, `FrageAnhang` (UI-relevant), `FrageTyp`-String-Union
- `pruefungstauglich?: boolean` bleibt in core (Editor zeigt's an)

### Inhalt von `fragen-storage.ts` (ExamLab)

Backend-Storage-Layer mit Pruefungstool-spezifischen Konzepten:

```ts
import type * as Core from '@shared/types/fragen-core'
import type { Berechtigung, EffektivesRecht } from './auth'
import type { Tag } from './tags'
import type { PoolFrageSnapshot } from './pool'

// FrageBase erweitert um Backend-Felder
export interface FrageBase extends Omit<Core.FrageBase, 'tags'> {
  tags: (string | Tag)[]                  // Override: erlaubt Tag-Objekte
  berechtigungen?: Berechtigung[]
  _recht?: EffektivesRecht
  geteilt?: 'privat' | 'fachschaft' | 'schule'   // Legacy
  poolVersion?: PoolFrageSnapshot
}

// Eigene Storage-Frage-Union: jeder Typ extends Core.X mit erweiterter Base
export type Frage =
  | (Core.MCFrage & { tags: (string | Tag)[]; berechtigungen?: Berechtigung[]; _recht?: EffektivesRecht; geteilt?: ...; poolVersion?: PoolFrageSnapshot })
  | (Core.RichtigFalschFrage & { ... })
  | ...

// Re-Exports der Sub-Types damit ein Storage-Caller nur eine Datei importieren muss
export type { MCOption, Luecke, ZuordnungPaar, ... } from '@shared/types/fragen-core'

// FrageSummary mit Berechtigung — bleibt storage-only
export interface FrageSummary {
  id: string
  typ: string
  // ... alle Summary-Felder
  berechtigungen?: Berechtigung[]
  _recht?: EffektivesRecht
}
```

**Anmerkung zur Storage-Frage-Union:** Die Union-Konstruktion via Intersection ist verbose. Alternative ist generic FrageBase: `FrageBase<TExt = {}>`. Wir wählen den verbosen Intersection-Ansatz für Plain-TypeScript-Lesbarkeit; die ~18 Zeilen Union-Definition sind übersichtlich genug.

### Type-Strategie für Editor-Komponenten in shared

- Editor-Props nehmen `Core.MCFrage`, `Core.LueckentextFrage`, etc.
- Storage-Frage-Objekte aus ExamLab sind **structurally compatible** (zusätzliche Felder werden ignoriert) → kein Mapping nötig
- TypeScript-strukturelles Subtyping erledigt das automatisch
- Editor-Code muss niemals `frage.berechtigungen` lesen (Audit in Phase 1 verifiziert das)

### Update `packages/shared/src/index.ts`

```ts
// VORHER
export * from './types/fragen'

// NACHHER
export * from './types/fragen-core'
```

Während Phase 1-4 (Übergangsphase) sind beide Exports parallel:
```ts
export * from './types/fragen-core'  // NEU
export * from './types/fragen'        // ALT, in Phase 5 weg
```

Konflikte bei doppeltem Export: shared hat keine `Berechtigung[]`/`_recht`-Felder, deshalb sind die Symbole überlappungsfrei. Im Zweifel `export type { ... }` explizit listen statt `export *`.

---

## Migrations-Phasen

### Phase 0: Branch + Audit

- Branch `refactor/type-konsolidierung-frage-core-storage`
- Audit-Skript:
  ```bash
  grep -rn "from '@shared/types/fragen'" ExamLab/src/ packages/shared/src/ > audit-shared-imports.txt
  grep -rn "from '\\.\\./types/fragen'\\|from '\\./types/fragen'\\|from '\\.\\./\\.\\./types/fragen'" ExamLab/src/ > audit-local-imports.txt
  grep -rn "frage\\.berechtigungen\\|frage\\._recht\\|frage\\.poolVersion\\|frage\\.geteilt" packages/shared/src/ > audit-storage-leak.txt
  grep -rn "tag\\.farbe\\|tag\\.ebene" packages/shared/src/ > audit-tag-leak.txt
  ```
- **Erwartung:** `audit-storage-leak.txt` und `audit-tag-leak.txt` müssen leer sein. Falls Treffer: Storage-Felder sickern in Editor-Code → Editor anpassen, NICHT core erweitern.

### Phase 1: `fragen-core.ts` in shared anlegen

- Neue Datei mit kanonischen Sub-Types als named exports (statt inline)
- Backend-Konzepte raus: `tags: string[]` (nicht union), keine Berechtigung-/Pool-Felder, `unknown`-Stellen entfernt (sie waren nur Platzhalter für ExamLab-Konzepte)
- `FrageBase` ohne Backend-Felder
- Discriminated Union `Frage` als Core-Variante
- `packages/shared/src/index.ts`: parallel exportieren — alt + neu
- **Validierung:** `npx tsc -b` clean, `vitest` 1098 grün, `npm run build` erfolgreich

### Phase 2: `fragen-storage.ts` in ExamLab anlegen

- Neue Datei mit erweiterter `FrageBase` + Storage-Frage-Union + `FrageSummary`
- Re-Exports der Core-Sub-Types
- **Validierung:** `npx tsc -b` clean, `vitest` grün

### Phase 3: Editor-Imports umstellen

- Tests in `ExamLab/src/tests/`: `*PflichtTests.tsx`, `MultiZone.test.tsx`, etc. — Imports `@shared/types/fragen` → `@shared/types/fragen-core`
- shared/editor-Code: bereits meist via `./types/fragen` lokal — Pfad anpassen
- ~10 Dateien
- **Validierung:** `tsc -b` clean, `vitest` grün

### Phase 4: ExamLab-Storage-Imports umstellen

- ExamLab-Stores (`fragenbankStore.ts`, `pruefungStore.ts`, …): `from '../types/fragen'` → `from '../types/fragen-storage'`
- Apps-Script-Adapter (`adapters/ueben/appsScriptAdapter.ts`): storage-Layer
- Service-Layer (`services/ueben/interfaces.ts`): storage-Layer
- Komponenten die Frage-Daten lesen (FragenBrowser, KorrekturFrageVollansicht, …): storage-Layer
- ~10 Dateien
- **Validierung:** `tsc -b` clean, `vitest` grün

### Phase 5: Cleanup

- `ExamLab/src/types/fragen.ts` löschen
- `packages/shared/src/types/fragen.ts` löschen (durch core ersetzt)
- `packages/shared/src/index.ts`: nur noch `export * from './types/fragen-core'`
- Verifikation:
  ```bash
  grep -rn "from '@shared/types/fragen'" ExamLab/src/ packages/shared/src/  # muss leer sein
  grep -rn "from '\\.\\./types/fragen'" ExamLab/src/                          # muss leer sein
  ```
- **Validierung:** `tsc -b` clean, `vitest` grün, `npm run build` erfolgreich

### Phase 6: Browser-E2E

- Test-Plan laut `regression-prevention.md` Phase 3.0
- Tab-Gruppe LP+SuS, echte Logins
- Kritische Pfade:
  - Fragensammlung: alle 18 Fragetypen einmal im LP-Editor öffnen, Pflichtfeld-Outlines wirken, prev/next sync
  - SuS-Üben: 1 Frage pro Typ-Gruppe (Bild/Drag, FiBu, Standard) — Auto-Korrektur funktioniert
  - LP-Korrektur: Vollansicht für 1 Frage pro Typ-Gruppe, Bewertungsraster + Teilerklärungen sichtbar
  - Berechtigungs-Anzeige: Kachel zeigt korrektes Recht auf Test-Frage (Inhaber/Bearbeiter/Betrachter)
  - Tag-Rendering: Tag-Objekte mit Farbe + String-Tags rendern beide korrekt
- **Verifikation:** keine Console-Errors, alle Editor-Felder bleiben stabil über prev/next, Korrektur-Daten werden geladen

### Phase 7: Merge

- Pre-Merge-Checks: `tsc -b` clean, alle Tests grün, build clean, HANDOFF aktualisiert
- Merge auf main mit `--no-ff`
- Branch lokal+remote löschen

---

## Risiken & Mitigation

| # | Risiko | Mitigation |
|---|---|---|
| 1 | Übersehener Import-Pfad — eine Stelle bleibt auf altem `fragen.ts` und compiliert weil `index.ts` während Übergang beide exportiert | Phase 5 grep-Verifikation: alte Pfade müssen leer sein, sonst Rollback. CI würde danach scheitern. |
| 2 | Strukturelles Subtyping reicht nicht — eine Editor-Funktion erwartet doch ein storage-Feld (Berechtigung) | Phase 0 Audit: `frage.berechtigungen`/`frage._recht`/`poolVersion` in `packages/shared/` muss 0 sein. Falls nicht: betroffenen Code in ExamLab umsiedeln, NICHT core erweitern. |
| 3 | `tags`-Type-Drift — core hat `string[]`, storage hat `(string \| Tag)[]`, ein Editor will `tag.farbe` lesen | Phase 0 Audit: `tag\\.farbe`/`tag\\.ebene` in `packages/shared/` muss 0 sein. Wahrscheinlich kein Issue (Tag-Rendering ist ExamLab-UX-Komponente). |
| 4 | Apps-Script-Adapter liest Backend-Daten (mit Berechtigung) — muss `fragen-storage` importieren | Phase 4 explizit: `appsScriptAdapter.ts` auf storage. Verifikation per Type-Test in Adapter-Tests. |
| 5 | Test-Suite-Updates aufwendiger als geschätzt — Tests mocken `FrageBase` mit Pflichtfeldern die wir verschieben | Tests laufen meist auf core (Editor-Tests). Storage-relevante Tests (Stores) auf storage. Falls ein Test beides braucht → storage. |
| 6 | Re-Export-Reihenfolge in `index.ts` — falsche Reihenfolge → Type-Konflikt bei doppeltem `export *` | Pattern: in Übergangsphase `export type { ... }` explizit listen statt `export *`, falls Konflikte auftreten. |
| 7 | `Frage`-Union wird via Intersection groß — Editor-Code mit `Frage`-Union kommt mit Storage-Frage in Kontakt und Discriminator wird ambig | TypeScript löst Discriminated Unions strukturell — `typ`-Discriminator funktioniert in beiden Welten gleich. Verify mit einem Test der `frage.typ === 'mc'` narrowing macht. |
| 8 | `FrageSummary` wird ausserhalb ExamLab gebraucht | Audit: `grep -rn "FrageSummary" packages/shared/` — falls Treffer, in core nachziehen (ohne Berechtigung) und storage erweitert. |

---

## Rollback-Strategie

- Branch ist isoliert, jede Phase committet
- Bei kritischem Fail: Revert auf letzten grünen Phase-Commit, Issue analysieren, neu starten
- Hard-Rollback (Branch verwerfen) jederzeit möglich da main unangetastet
- Apps-Script bleibt unverändert — kein Backend-Rollback nötig

---

## Test-Strategie

| Stufe | Verifikation |
|---|---|
| Unit (vitest) | 1098 bestehende Tests müssen nach jeder Phase grün sein. Keine neuen Tests nötig — Type-Refactor ist verhaltensneutral. |
| Type (`tsc -b`) | Pflicht nach jeder Phase. CI-äquivalent. |
| Build (`npm run build`) | Vor Phase 5 + Vor Merge — verifiziert Bundling/Tree-Shaking. |
| Browser-E2E | Phase 6 — alle 18 Fragetypen einmal im LP-Editor öffnen + 1 SuS-Übungs-Pfad pro Typ-Gruppe (Bild/Drag, FiBu, Standard) + Korrektur-Vollansicht. |
| Security-Check | Phase 6 — Fragenbank-Sharing-Anzeige zeigt korrektes Recht (Berechtigungs-Felder kommen in Storage-Layer richtig durch). |

---

## Erfolgs-Kriterien

- [x] 0 Treffer für `from '@shared/types/fragen'` und `from '*types/fragen'` (alte Pfade weg) → in Phase 5
- [x] 1098 vitest grün
- [x] `npx tsc -b` clean
- [x] `npm run build` clean
- [x] Browser-E2E ohne Errors auf staging mit echten Logins (Phase 6)
- [x] HANDOFF.md aktualisiert mit Bundle-K-Status
- [x] Spec + Plan committet
- [x] FrageBase-Divergenz aus „Aktiv offen" in HANDOFF.md entfernt

---

## Annahmen & Constraints

- Apps-Script bleibt unverändert (kein Backend-Deploy)
- Kein Datenmodell-Wechsel — alle Frage-Records bleiben strukturell gleich, nur TypeScript-Sicht wird neu organisiert
- Subagent-Driven-Development bei Phase 3-4 möglich (parallele Import-Updates)
- Ferien/Schul-Pause nicht erforderlich — Refactor ist zur Compile-Zeit, Verhalten unverändert
- Keine aktive Prüfung darf während Phase 6/7 laufen (Vorsicht beim Browser-E2E)
