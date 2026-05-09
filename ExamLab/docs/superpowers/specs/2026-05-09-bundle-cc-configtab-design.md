# Bundle CC — ConfigTab MaterialienSection-Cut Design Spec

**Datum:** 2026-05-09
**Branch:** `bundle-cc/configtab`
**Vorgänger:** Bundle BB (`4f53910`).
**Pattern:** Single-Cut, Self-Review-Modus.

## Ziel

Hotspot-Bilanz Files >500 Z. (ohne `data/` und Test-Files): **1 → 0** ✅ — Phase-5+ Hotspot-Reduction-Roadmap KOMPLETT.

| File | Vorher | Nachher | Cut |
|------|--------|---------|-----|
| `components/lp/vorbereitung/composer/ConfigTab.tsx` | 747 Z. | ~300 Z. | MaterialienSection (~447 Z.) + Helpers in Sub-Folder |

## Risiko-Bewertung

**Niedrig** trotz HANDOFF-Klassifikation „hoch-Risiko". Bundle-BB-Lehre 1 (Größe ≠ Risiko) bestätigt: MaterialienSection ist eine **isolierte Sub-Komponente** mit eigenem State (kein State-Sharing mit ConfigTab), nimmt nur 2 Props (`materialien` + `setMaterialien`). Cut ist byte-identischer Move.

## Layout

```
ExamLab/src/components/lp/vorbereitung/composer/ConfigTab.tsx   (Wrapper + 4 Sections, ~300 Z.)
ExamLab/src/components/lp/vorbereitung/composer/materialien/
├── MaterialienSection.tsx   (~447 Z., Default-Export, byte-identisch)
└── materialienHelpers.ts    (formatGroesse + MAX_MATERIAL_GROESSE + ERLAUBTE_TYPEN, ~10 Z.)
```

## Test-Strategie

**Kein neuer Vitest** — byte-identischer Komponenten-Move ohne Logik-Änderung. Bestehende ConfigTab-Tests (falls vorhanden) bleiben grün.

## Code-Quality-Invarianten

- MaterialienSection als Default-Export im neuen File.
- `formatGroesse` als Named Export aus `materialienHelpers.ts` (verwendet in MaterialienSection).
- `MAX_MATERIAL_GROESSE` + `ERLAUBTE_TYPEN` als Named Exports aus `materialienHelpers.ts`.
- Imports in MaterialienSection: `Section`, `Field` aus `../ComposerUI.tsx` (ein Verzeichnis hoch); `apiService`, `parseVideoUrl` aus existing relative-Pfade angepasst um eine Tiefe.
- ConfigTab Imports: `MaterialienSection` aus `./materialien/MaterialienSection`.
- Keine Re-Export-Bridge in ConfigTab.tsx — direkter Import.

## Verifikation

Pre-Merge-Gates (alle müssen grün sein):
- `npx vitest run` → 1523 passed (drift = 0).
- `npx tsc -b` clean.
- `npm run lint:as-any` Total 0.
- `npm run lint:no-alert` 0 Treffer.
- `npm run lint:no-tests-dir` clean.
- `npm run lint:musterloesung` Drift bestätigt aus pre-existing untracked Test-Files (wie Bundle BB), nicht aus Bundle CC — verifiziert via `git stash -u`.
- `npx vite build` grün, PWA generateSW OK.

## Browser-E2E

Auf staging mit echten LP-Logins:
- Composer öffnen → Config-Tab → Section "Materialien (Hilfsmittel)" → "+ Material hinzufügen" → Typ "PDF-Link" → Titel + URL → Hinzufügen → Material erscheint in Liste.
- Material-Item löschen via X-Button.
- Material-Inline-Edit (Titel-Input ändern).
- 0 Console-Errors.

## Lehren / Patterns wiederverwendet

- **Sub-Komponenten-Cut** (Bundle T.b TKontoFrage / Bundle BB EinstellungenPanel): isolierte Sub-Komponente mit Props-Interface in eigenes Default-Export-File.
- **Helpers-Co-Location**: pure Helpers + Konstanten zusammen mit der Sub-Komponente in Sub-Folder, nicht in shared/.
- **Größe ≠ Risiko** (Bundle BB Lehre 1): static Sub-Komponente trotz Größe Low-Risk via byte-identischem Move.
