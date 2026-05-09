# Bundle BB — HilfeSeite + EinstellungenPanel Doppel-Cut Design Spec

**Datum:** 2026-05-09
**Branch:** `bundle-bb/hilfeseite-einstellungen`
**Vorgänger:** Bundle AA (`fc8f191`).
**Pattern:** Doppel-Cut (analog Bundle Z + Bundle AA), Self-Review-Modus (kein 2-Iter-Reviewer-Loop).

## Ziel

Hotspot-Bilanz Files >500 Z. (ohne `data/` und Test-Files): **3 → 1**.

| File | Vorher | Nachher | Cut |
|------|--------|---------|-----|
| `components/lp/HilfeSeite.tsx` | 906 Z. | ≤120 Z. | 10 Tab-Sektionen + 5 Layout-Helper in Sub-Files |
| `components/settings/EinstellungenPanel.tsx` | 607 Z. | ≤150 Z. | 4 Sub-Files (ProfilTab/AdminTab/InlineEditoren/SharedFelder) |

Verbleibend nach BB: **ConfigTab (747)** als Bundle CC (eigener hoch-Risiko Cut wegen MaterialienSection mit Datei-Upload).

## Phase A — HilfeSeite (906 → ≤120 Z.)

**Risiko: niedrig.** Reines static content in 10 Tab-Sektionen, keinerlei State-Sharing zwischen den Sub-Komponenten. Pattern bewährt aus Bundle T.f LPStartseite (1043→382).

### Layout

```
ExamLab/src/components/lp/HilfeSeite.tsx           (Wrapper + Tab-Switch, ~92 Z.)
ExamLab/src/components/lp/hilfe/
├── layoutHelpers.tsx      (Titel/Untertitel/Text/Schritt/Hinweis, ~35 Z.)
├── HilfeEinstieg.tsx      (~52 Z.)
├── HilfeUeben.tsx         (~49 Z.)
├── HilfePruefung.tsx      (~34 Z.)
├── HilfeFragen.tsx        (~130 Z.)
├── HilfeZusammenarbeit.tsx (~46 Z.)
├── HilfeKI.tsx            (~90 Z.)
├── HilfeDurchfuehrung.tsx (~63 Z.)
├── HilfeKorrektur.tsx     (~54 Z.)
├── HilfeBloom.tsx         (HilfeBloom + BloomStufe, ~129 Z.)
└── HilfeFAQ.tsx           (HilfeFAQ + FAQItem, ~130 Z.)
```

### Test-Strategie

**Kein neuer Vitest** — pure JSX-Render-Komponenten ohne Logik. Stattdessen Browser-E2E im LP-Tab: Hilfe-Sidebar öffnen, alle 10 Tabs durchklicken, Konsole muss leer bleiben.

### Code-Quality-Invarianten

- Layout-Helper als `export` aus `hilfe/layoutHelpers.tsx` (nicht Default), damit Multi-Import möglich.
- JSX/Strings byte-identisch zum Original (kein Wording-Tweak).
- HilfeSeite.tsx behält Tab-Layout + Tab-Switch + ResizableSidebar-Wrapper.

## Phase B — EinstellungenPanel (607 → ≤150 Z.)

**Risiko: mittel.** Form-State-rich Sub-Komponenten mit `useStammdatenStore`-Zugriffen. Pattern: Sub-Komponenten-Cut analog Bundle T.b TKontoFrage (763→155 via 5 Sub-Files).

### Layout

```
ExamLab/src/components/settings/EinstellungenPanel.tsx    (Wrapper + Tab-Switch, ~120 Z.)
ExamLab/src/components/settings/einstellungen/
├── ProfilTab.tsx          (~115 Z., LP-Profil mit 3 CheckboxChip-Listen + speichern)
├── AdminTab.tsx           (~240 Z., 4 CRUD-Sektionen für Gefässe/Kurse/Fachschaften/Fächer)
├── InlineEditoren.tsx     (InlineKursEditor + InlineTextEditor, ~75 Z.)
└── sharedFelder.tsx       (CheckboxChip + SettingsField, ~55 Z.)
```

### Test-Strategie

**Kein neuer Vitest** — bestehende Hooks/Stores ungeändert (`useStammdatenStore`, `useAuthStore`), nur Component-Splits. Pattern entspricht Bundle T.b: keine neue Logik, byte-identische Move-Cuts. Stattdessen Browser-E2E: Einstellungen öffnen, Profil-Tab + Admin-Tab durchklicken.

### Code-Quality-Invarianten

- ProfilTab/AdminTab als named exports oder defaults — Konsistenz mit existierender Struktur.
- `useStammdatenStore.getState().fehler` Zugriff in ProfilTab erhalten (Fehler-Pfad).
- Keine Re-Export-Wrapper in EinstellungenPanel.tsx — direkte Imports aus Sub-Folder.
- Sub-Folder `einstellungen/` (NICHT `settings/sub/` o.ä.) — folgt Bundle-T.b/V/W-Konvention.

## Verifikation

Pre-Merge-Gates (alle müssen grün sein):
- `npx vitest run` → 1512 passed (drift = 0, kein neuer Test).
- `npx tsc -b` clean.
- `npm run lint:as-any` Total 0.
- `npm run lint:no-alert` 0 Treffer.
- `npm run lint:no-tests-dir` clean.
- `npm run lint:musterloesung` Baseline-Drift 0.
- `npx vite build` grün, PWA generateSW OK.

## Browser-E2E

Auf staging mit echten Logins (LP + SuS):
- LP-Tab: Hilfe-Sidebar → alle 10 Tabs durchklicken (Einstieg/Üben/Prüfung/Fragen/Zusammenarbeit/KI/Durchführung/Korrektur/Bloom/FAQ); Einstellungen-Sidebar → Profil-Tab + Admin-Tab (sichtbar nur für Admin) inspizieren.
- SuS-Tab: kein direkter Touch (HilfeSeite + EinstellungenPanel sind LP-only). SuS-Smoke-Test: Login + Übung-Liste sichtbar (Regression-Sicherheit).
- 0 Console-Errors auf beiden Tabs.

## Lehren / Patterns wiederverwendet

- **Tab-Sektion-Cut** (Bundle T.f LPStartseite, 1043→382): static content in Tab-Switch-Renderern → 1 Sub-File pro Tab + 1 Layout-Helper-File.
- **Render-Sub-Komponente in eigene Datei** (Bundle T.b/Y/Z): state-rich Sub-Komponenten (ProfilTab/AdminTab) als Default-Export in eigenes File, Hauptdatei nur noch Tab-Switch.
- **Doppel-Cut in 1 Bundle** (Bundle Z/AA): zwei unabhängige Files mit Spec-Plan-Reviewer-Overhead 1× statt 2×.
