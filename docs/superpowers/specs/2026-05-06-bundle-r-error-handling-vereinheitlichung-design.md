# Bundle R — Error-Handling-Vereinheitlichung

**Datum:** 2026-05-06
**Bundle:** R (5. Cleanup-Bundle aus Vereinfachungs-Audit, nach M/N+V/Q/O)
**Scope-Section im Audit:** A2.9 Error-Handling (`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md` Z. 192-204, 455-469)
**Aufwand:** M, ~2 Sessions (geschätzt ~12h)
**Risiko:** mittel (UI-Verhalten ändert sich, A/B-Verifizierung pro `alert()` nötig)
**Abhängigkeiten:** keine

## Problem

ExamLab hat drei parallele Error-Surface-Patterns:

- **`alert()`** (9 Stellen) — blockierend, modal, App-eigene Stilrichtung wird ignoriert.
- **`setError`-State + Inline-Render** (8 Stellen, z.B. `LueckentextBulkToggle.tsx`, `FeedbackModal.tsx`) — gut für Form-Validation, aber komponenten-lokal.
- **`console.error()` only** (64 Stellen, davon ~10-20 ohne weitere User-Surface) — User sieht **nichts**, der Pfad fällt silent in den Fail-State (z.B. `SuSStartseite.tsx` Login-Bridge: bei Fehlschlag wird `setLoginBridged(true)` gesetzt und der Demo-Modus aktiviert, ohne dass der User je erfährt, dass etwas schiefging).

Eine ad-hoc Toast-Implementierung existiert bereits in `LPStartseite.tsx` (Z. 107-122, 504-520, gelber Banner mit 4s-Auto-Hide für „Kurs nicht gefunden"-Redirect), wird aber nirgendwo wiederverwendet.

**Folge:** Inkonsistente UX, schlechtes Debugging-Erlebnis (silent-fail), keine Konvention für künftige Sessions.

## Ziel

Eine einheitliche Toast-Surface app-weit etablieren, alle 9 `alert()` migrieren, alle silent-fail `console.error`-Stellen mit User-Feedback ergänzen, Konvention in `.claude/rules/code-quality.md` festschreiben.

## Architektur

### Komponenten (3 neue Files in `ExamLab/`)

#### 1. `ExamLab/src/store/toastStore.ts`
Zustand-Store, konsistent mit dem Projekt-Pattern (statt React-Context-Provider — vermeidet Re-Render-Hell und Provider-Wrapping in `App.tsx`).

```ts
interface Toast {
  id: string             // crypto.randomUUID()
  variant: 'error' | 'success' | 'info' | 'warning'
  message: string
  sticky: boolean        // true → kein Auto-Hide
  createdAt: number
}

interface ToastStore {
  toasts: Toast[]
  add: (variant, message, opts?: { sticky?: boolean, autoHideMs?: number }) => string  // returns id
  dismiss: (id: string) => void
  clear: () => void
}
```

Default-Verhalten:
- `error` → `sticky: true` (User muss aktiv dismissen)
- `success`/`info`/`warning` → `sticky: false`, Auto-Hide via Konstante `DEFAULT_TOAST_AUTO_HIDE_MS = 4000` (im selben File exportiert; kein Magic-Number-Inline)

Action-Naming folgt **Bundle-O-Konvention** (Programming-Primitives englisch: `add`/`dismiss`/`clear`).

#### 2. `ExamLab/src/hooks/useToast.ts`
Hook-Wrapper für ergonomischen Aufruf:

```ts
const toast = useToast()
toast.error('Speichern fehlgeschlagen')
toast.success('Gespeichert')
toast.info('Keine gespeicherten Daten gefunden.')
toast.warning('…')
toast.dismiss(id)  // optional, falls Caller die ID braucht
```

Intern: ruft `useToastStore.getState().add(...)`. Kein Re-Render-Bezug.

#### 3. `ExamLab/src/components/shared/ToastContainer.tsx`
Liest `useToastStore(s => s.toasts)`, rendert vertikalen Stack oben-rechts. Container: `fixed top-4 right-4 z-[1000] flex flex-col gap-2` (z-index 1000 liegt über existierenden Modal-Layern; wird in Phase 1 gegen vorhandene `z-`-Klassen verifiziert).

Stil: Tailwind, identisch zum bestehenden `LPStartseite`-Banner-Pattern:
- `error` → rot (`bg-red-100 dark:bg-red-900 border-red-300 text-red-800 dark:text-red-200`)
- `success` → grün
- `info` → blau
- `warning` → gelb (wie LPStartseite-Original)

Jeder Toast: Icon + Message + X-Button (manueller Dismiss, immer verfügbar — auch bei Auto-Hide-Variants).

Mount-Punkt: `App.tsx` als Sibling unter `<Routes>` (nicht innerhalb), damit Routenwechsel den Container nicht unmounten.

### ErrorBoundary (Class-Component) Sonderfall

`ErrorBoundary.tsx` ist eine class-component und kann keinen Hook nutzen. Dort wird direkt `useToastStore.getState().add('error', '…', { sticky: true })` aufgerufen. **Pattern in Zustand explizit erlaubt** und wird in der Convention-Doku festgehalten.

## API-Verträge

```ts
// Standard-Aufruf in Function-Components:
const toast = useToast()
try { await saveX() }
catch (e) { toast.error('Speichern fehlgeschlagen') }

// Außerhalb von Components (ErrorBoundary, Util-Hooks):
import { useToastStore } from '@/store/toastStore'
useToastStore.getState().add('error', '…')
```

## Migration-Mapping

### `alert()` → Toast (9 Stellen)

| # | Datei : Zeile | Aktuell | Neu |
|---|---|---|---|
| 1 | `src/components/ErrorBoundary.tsx:47` | `alert('Keine gespeicherten Daten gefunden.')` | `toastStore.getState().add('info', ...)` |
| 2 | `src/components/ErrorBoundary.tsx:59` | `alert('Export fehlgeschlagen. Bitte Lehrperson kontaktieren.')` | `toastStore.getState().add('error', ..., { sticky: true })` |
| 3 | `src/components/ueben/admin/settings/MitgliederTab.tsx:30` | `alert('Entfernen fehlgeschlagen.')` | `toast.error(...)` |
| 4 | `src/components/settings/kiKalibrierung/BeispieleListe.tsx:42` | `alert('Speichern fehlgeschlagen')` (Wichtig-Toggle) | `toast.error(...)` |
| 5 | `src/components/settings/kiKalibrierung/BeispieleListe.tsx:50` | `alert('Speichern fehlgeschlagen')` (Aktiv-Toggle) | `toast.error(...)` |
| 6 | `src/components/settings/kiKalibrierung/BeispieleListe.tsx:57` | `alert('Löschen fehlgeschlagen')` | `toast.error(...)` |
| 7 | `src/components/lp/papierkorb/PapierkorbView.tsx:92` | `window.alert('Fehler beim Wiederherstellen: ' + msg)` | `toast.error(`Fehler beim Wiederherstellen: ${msg}`)` (sticky default) |
| 8 | `src/components/lp/papierkorb/PapierkorbView.tsx:116` | `window.alert('Fehler beim Löschen: ' + msg)` | `toast.error(`Fehler beim Löschen: ${msg}`)` |
| 9 | `src/components/lp/durchfuehrung/BeendetPhase.tsx:89` | `alert('Export fehlgeschlagen. Bitte erneut versuchen.')` | `toast.error(...)` |

**Konsequenz:** alle `alert()`-Aufrufe in produktivem Code entfernt (Test-Code unberührt). CI-Gate optional (Bundle-V-analog) — wird in Phase 5 entschieden.

### Silent-Fail-`console.error` → Toast ergänzen (Phase 3)

**Methode:**

```bash
rg -n "console\.error" ExamLab/src/components --type ts --type tsx
```

Pro Treffer 3-Bucket-Klassifikation:

- **(a) Hat eigene Error-UI** (catch setzt `setError`-State / `setLadeStatus('fehler')` / hat ErrorBoundary-Fallback) → **Behalten**, console.error ergänzt das, ersetzt nicht.
- **(b) Silent-Fail** (catch macht *nur* console.error oder console.error + Continue-Fallback) → **Toast ergänzen** (`toast.error('…')`), console.error bleibt zusätzlich.
- **(c) Service/Util/Hook ohne UI-Bezug** (`src/services/*`, `src/utils/*`, generische Hooks) → **Behalten**, kein UI-Surface, Caller verantwortet.

**Erwartete Anzahl Bucket (b):** 10-20 Stellen. Exakte File-Liste wird in der Plan-Phase erstellt (kein Implementierungsschritt im Spec).

**Bekannte Kandidaten** (aus Audit explizit genannt):
- `src/components/sus/SuSStartseite.tsx` Z. 55, 79 — Login-Bridge-Failure → Demo-Modus stillschweigend
- `src/components/LoginScreen.tsx` — vom Audit gelistet, aktuell kein `console.error` gefunden, in Plan-Phase re-verifizieren

### `LPStartseite.tsx` ad-hoc Toast → `useToast()` (Phase 4)

Bestehender lokaler `kursNichtGefundenToast`-State (Z. 107-122, JSX Z. 504-520) wird ersetzt durch:

```tsx
const toast = useToast()
// im useEffect:
toast.warning(`Kurs "${urlKursId}" nicht gefunden — zu ${zielName} umgeleitet`)
```

— kein Duplicate-Pattern.

## Convention-Doku (`.claude/rules/code-quality.md`)

Neue Sektion **„Error-Handling"** (am Ende, nach Test-Layer-Strategie):

```markdown
## Error-Handling

### User-Surface

| Pattern | Verwendung |
|---|---|
| `useToast().error(...)` | Standard für API-Fehler, async-Catch in Components |
| `useToast().success(...)` / `.info(...)` / `.warning(...)` | Erfolgs- und Hinweis-Surface |
| `setError`-State + Inline-Render | Form-Validation (Pflichtfeld leer, ungültige Eingabe) |
| ErrorBoundary-Fallback-UI | Render-Fehler (unverändert) |

### Konventionen

- **`alert()` deprecated** — keine Neuanlagen. Bestehende Aufrufe wurden in Bundle R migriert.
- **Niemals silent-fail**: jeder catch-Block in einer Component muss entweder Toast/setError setzen
  oder ein bewusstes Fallback-UI rendern. `console.error()` allein ist kein User-Feedback.
- `console.error()` ergänzt User-Surface, ersetzt es nicht (Debugging-Hilfe für DevTools).
- Außerhalb von Function-Components (ErrorBoundary, Util-Hooks) wird der Toast direkt via
  `useToastStore.getState().add(...)` aufgerufen — kein Hook nötig.

### Wo lebt der Toast-Code

- Komponenten: `ExamLab/src/components/shared/ToastContainer.tsx`
- Store: `ExamLab/src/store/toastStore.ts`
- Hook: `ExamLab/src/hooks/useToast.ts`
- (Migration nach `packages/shared` erst wenn externer Konsument auftaucht — YAGNI.)
```

## Phasen-Plan

| Phase | Inhalt | Aufwand |
|---|---|---|
| 1 | Toast-Store + useToast-Hook + ToastContainer + Mount in `App.tsx` + Vitest-Tests | ~3h |
| 2 | 9 `alert()`-Stellen auf Toast migrieren | ~2h |
| 3 | Silent-`console.error`-Audit (rg-Scan + Klassifikation) + ~10-20 Bucket-(b)-Stellen ergänzen | ~3h |
| 4 | `LPStartseite.tsx` ad-hoc Toast → `useToast()` | ~30min |
| 5 | Convention in `.claude/rules/code-quality.md` ergänzen | ~30min |
| 6 | Browser-E2E mit echten Logins (LP+SuS), pro alert-Pfad A/B verifizieren | ~3h |

**Total: ~12h ≈ 2 Sessions** (Audit-Schätzung „M, ~2 Sessions" passt).

## Test-Plan

### Vitest (Phase 1)

- `toastStore.test.ts`: `add` mit Default-Sticky pro Variant, `dismiss(id)` entfernt, `clear()` leert, Auto-Hide-Timer (Fake-Timer)
- `useToast.test.tsx`: Hook ruft korrekt `store.add` mit Variant + Message
- `ToastContainer.test.tsx`: rendert Liste, X-Button ruft `dismiss(id)`, korrekte Variant-Styles, Dark-Mode-Pairing

**Ziel:** +10-15 Tests. Bestehende 1234 vitest passes bleiben grün.

### Browser-E2E (Phase 6) — A/B pro alert-Stelle

**A-Zustand (vorher):** Aktueller `alert()`-Code reproduziert auf branch-base.
**B-Zustand (nachher):** Neuer Toast-Code auf Bundle-R-Branch.

Für die 9 `alert()`-Pfade:
- Network-Drop (DevTools Offline) bzw. Backend-Fehler reproduzieren
- Toast erscheint mit erwartetem Text + Variant
- X-Button dismisses
- `error`-Variant (sticky) verschwindet **nicht** von selbst
- `info`/`warning`/`success` verschwinden nach 4s

Pro silent-fail-Stelle (Phase 3): den Code-Pfad provozieren (z.B. SuSStartseite Login-Bridge: gefakter 500er via `read_network_requests`-Fixture im fetch-hook), prüfen dass User Toast sieht (vorher: nichts).

**Reihenfolge im E2E:** LP-Login → 5 LP-`alert()`-Pfade → Logout → SuS-Login → 4 SuS-Pfade + silent-fail-Pfade.

**Service-Worker-Cache:** Bundle R ändert keine Backend-Wire-Verträge (rein UI-Surface), die `feedback_service_worker_cache_wire_bundle.md`-Regel für SW-unregister vor E2E ist hier **optional, nicht Pflicht**. Empfohlen vor erstem E2E-Lauf einmalig SW-unregister + caches.delete + reload, um sicherzustellen dass die neue ToastContainer-Komponente nicht aus altem PWA-Cache geladen wird.

### Verifikations-Checks

- `rg -n "alert\(" ExamLab/src --type ts --type tsx -g '!*.test.*'` → **0 Treffer** (außer Test-Code).
- `rg -n "window\.alert" ExamLab/src --type ts --type tsx -g '!*.test.*'` → **0 Treffer**.
- `npm run lint`, `npm run lint:as-any`, `npm run build`, `npm run test` → grün.
- Optional CI-Gate `lint:no-alert` analog `lint:as-any` (in Phase 5 entscheiden).

## Out of Scope

- Service-Layer-`console.error` (Bucket c) — kein UI-Bezug, Caller-Verantwortung
- ErrorBoundary-Render-Fallback-UI — bereits etabliert, nur das interne `alert()` darin wird migriert
- Toast-Animation/Transitions (CSS-fade ok, kein Framer-Motion oder andere Animation-Lib)
- Migration nach `packages/shared` — YAGNI bis externer Konsument
- Apps-Script-Backend-`Logger.log`/`SpreadsheetApp` Error-Patterns — nicht UI-Bezogen
- Pre-existing `setError`-Pattern in `LueckentextBulkToggle.tsx`/`FeedbackModal.tsx` — bleiben (Form-Validation)
- 64 → ~44-54 `console.error` (Bucket a + c) — bleiben unverändert

## Bundle-Sequenz-Kontext

Bundle R ist das **5. Cleanup-Bundle** aus dem 2026-05-05-Audit:

| # | Bundle | Status |
|---|---|---|
| 1 | M Fragenbank → Fragensammlung Rename | ✅ Merge `606f256` (05.05.2026) |
| 2 | N action/aktion + V Sprach-Konvention | ✅ Merge `fd64322` (06.05.2026) |
| 3 | Q Test-Verzeichnis-Konsolidierung | ✅ Merge `dc25f9a` (06.05.2026) |
| 4 | O Store-Action-Naming | ✅ Merge `b025b2d` (06.05.2026) |
| 5 | **R Error-Handling-Vereinheitlichung** | **⏳ dieses Bundle** |
| 6 | S Datei-Hotspots Niedrig-Risiko-Splits | offen |
| 7 | P musterlosung Field-Drift | offen |
| 8 | T Datei-Hotspots Mittel-Risiko-Splits | offen |
| 9 | U Hoch-Risiko-Splits (optional) | offen |

## Branch-Setup

- Branch: `feature/bundle-r-error-handling-vereinheitlichung`
- Ausgangspunkt: `main` aktuell `9aa8b51` (Bundle O post-merge)
- Merge-Strategie: Sub-Commits pro Phase, am Ende Squash oder Rebase-Merge wie Bundles N+O
