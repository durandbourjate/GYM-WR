# no-derived-state Triage (29.05.2026)

**Quelle:** react-doctor `no-derived-state` — 41 Findings / 24 Files (Stand main `a0ca31d`).

**Ergebnis: 0 echte Refactors.** Alle 41 Findings sind intentional — `useState` ist
korrekt, `useMemo` / Render-Compute würde Bugs einführen (read-only Inputs,
Cursor-Sprünge, verlorene async-Daten, gebrochene Navigation). Wie schon bei
`no-cascading-set-state` / `no-adjust-state-on-prop-change` (28.05.) ist die Konsequenz
**Gate statt Churn-Refactor**: `no-derived-state` als 4. Regel ins bestehende
`scripts/audit-react-doctor-state.mjs` aufgenommen, Baseline 93 → 134.

Jede der 41 Stellen wurde per Code-Lesung verifiziert (kein Subagent-Verlass — die
teure exhaustive-deps-Lehre: Flags selbst gegenlesen). Vier Kategorien:

## 1. Editierbare Kopien mit sync-on-id
State wird aus prop / gespeichertem Wert initialisiert, per `useEffect` bei
`frage.id` / `config.durchfuehrungId`-Wechsel neu gesynct UND vom User unabhängig
editiert. `useMemo` würde das Feld read-only machen.
- FiBu-Editoren: `BilanzERAufgabe:88/89` (bilanz/er — expliziter Kommentar „verhindert Cursor-Sprung bei Inputs"), `BuchungssatzFrage:82` (buchungen), `TKontoFrage:40` (konten)
- `FormelFrageComponent:88` (eingabe — LaTeX-Input), `ZeitzuschlagInline:22` (editWert — Inline-Edit)
- `AdminTab:76–81` (admins/klassen/gefaesse/kurse/faecher/fachschaften — edit-then-save Textareas)
- `ProfilTab:20–22` (gewaehlteKurse/-Fachschaften/-Gefaesse — Multi-Select)
- `VorbereitungPhase:88/90/91/92` (ausgewaehlteSuS/zeitverlaengerungen/kontrollStufe/einladungGesendetMap)
- `useFragenEditor:48` (liveFrage — editierbarer Draft, divergiert von editFrage)

## 2. Async-geladener State
Wird nach fetch/await in einem Effect gesetzt — nicht render-berechenbar.
- `useKorrekturDaten:95/171/201` (korrektur/ladeStatus), `useDurchfuehrenLoad:89` (fragen),
  `useDurchfuehrenMonitoring:80` (daten), `useDashboardLoad:48` (laden),
  `PDFKorrektur:74` (geladenesPdf), `LernzielTab:72` (ladeStatus), `BeispieleListe:165` (lade)

## 3. Optimistische Toggles
Sofort gesetzt, bei API-Fehler zurückgerollt (`setX(!neu)` im catch) — nicht ableitbar.
- `BeispieleListe:38/39` (wichtig/aktiv)

## 4. UI-Interaktions- / Lifecycle-State
Vom User oder Events verändert (Tastatur, Tabs, Expand, Lockdown-Events).
- `Dropdown:92` (fokusIdx), `LPGlobalSuche:106` (query), `useDurchfuehrenPhasenTab:64` (activeTab),
  `Dashboard:176/190` (aktiverFach), `useFragenFilter:144` (aufgeklappteGruppen — Kommentar: Loop-Vermeidung),
  `Layout:110` (letzterVerstoss — event-getrieben), `DurchfuehrenDashboard:72` (phase — Kommentar „ersetzt die alte per-render-Computation"),
  `RueckSyncDialog:53/54` (diffs/gewaehlteFelder — Dialog-Lifecycle-Effect, gewaehlteFelder ist editierbare Checkbox-Auswahl)

## Gate
`audit-react-doctor-state.mjs` RULES += `no-derived-state` (jetzt 4 Regeln). Baseline
134 Findings / 68 Files. Regressions-Test: kanonisches editierbare-Kopie-Muster als
Probe-Datei → exit 1 (135 > 134); nach Entfernen → exit 0. Neue derived-state-Stellen
über Baseline failen CI → erzwingen bewussten Review oder Baseline-Bump mit Begründung.
