# Bundle G.f.2 — App-weit Skeleton-Pattern (Design-Spec)

> **Status:** Design — wartet auf Spec-Review + User-Freigabe
> **Datum:** 2026-04-27
> **Session:** S155
> **Vorgänger:** G.f LP-Startseite-Skeleton (Merge `899be9c` am 27.04.2026)

## Zielsetzung

Das in G.f etablierte Skeleton-Pattern (Header sofort sichtbar, Per-Section-Skeletons, layout-akkurate Anzahl aus localStorage) auf zwei weitere LP-Hochlast-Views ausrollen:

1. **DurchfuehrenDashboard** — der **grösste Wahrnehmungs-Gewinn**: aktueller globaler Early-Return blendet Header + Tabs komplett aus während 1-3s API-Roundtrip (`ladeMonitoring + ladeAbgaben + ladePruefung`)
2. **FragenBrowser** — ersetzt den zentrierten „Fragensammlung wird geladen…"-Text durch einen Listen-Skeleton; Header + Filter waren bereits sofort sichtbar

**Erwartbarer Win:**
- DurchfuehrenDashboard: Header + Tabs sofort nutzbar (~100ms statt 1-3s blanker Bildschirm), Tab-Inhalt zeigt Skeleton-SuS-Reihen statt nichts
- FragenBrowser: Liste hat von Anfang an visuelle Struktur — wirkt aktiv statt geladen

## Bundle-G-Roadmap-Kontext

| Sub-Bundle | Inhalt | Status |
|---|---|---|
| G.a | Server-Cache-Pre-Warming | ✅ S147 (`ddba22c`) |
| G.b | Editor-Material-Prefetch | ✅ S148 (`cd1c269`) |
| G.c | Login-Pre-Fetch + IDB-Cache Fragenbank | ✅ S149 (`f57de40`) |
| G.d.1 | Polling + Backend-Pre-Warm | ✅ S152 (`654c4f7` Bundle) |
| G.d.2 | Stammdaten-IDB-Cache | ✅ S153 (`131c2fb`) |
| G.e | Fragensammlung Virtualisierung | ✅ S154 (`654c4f7`) |
| G.f | LP-Startseite Skeleton-Pattern | ✅ S154 (`899be9c`) |
| **G.f.2** | **App-weit Skeleton (Durchführen + FragenBrowser)** | **diese Spec** |

G.f.2 ist Frontend-only und unabhängig — kein Apps-Script-Deploy nötig.

## Out-of-Scope (explizit)

- **KorrekturDashboard-Skeleton** (eingebettete + standalone Variante) — Pre-Warm-Cache aus G.d.1 macht Lade-Flash <500ms, separate Komponente nicht gerechtfertigt. Kann später als G.f.3 nachgezogen werden falls UX-Feedback negativ.
- **Phase-Komponenten-Skeletons** (LobbyPhase, AktivPhase, BeendetPhase, VorbereitungPhase intern) — diese rendern erst nach Daten-Load und haben eigene Empty-States, die nicht angefasst werden.
- **Apps-Script-Änderungen** — frontend-only.
- **Skeleton mit echten Vorab-Daten aus IDB-Cache** — G.c IDB-Cache liefert Liste in 1ms (Cache-Hit), Skeleton flashed praktisch nicht; YAGNI.
- **Animations-Framework** (Framer-Motion, Shimmer) — Tailwind `animate-pulse` reicht (Konsistenz mit G.f).

## Architektur

### Drei neue Skeleton-Komponenten

Pfad: `src/components/lp/skeletons/`

```
+ DurchfuehrenVorbereitungSkeleton.tsx    (~50 Z., Settings-Karten + Teilnehmer-Liste)
+ DurchfuehrenSusReihenSkeleton.tsx        (~45 Z., Reihen-Tabelle für Lobby/Live/Auswertung)
+ FragenListeSkeleton.tsx                   (~45 Z., virtualisierte-Karten-Liste, fest 8)
```

Alle drei nutzen das Pattern aus G.f (`bg-slate-200 dark:bg-slate-700 rounded animate-pulse`, `data-testid` für Tests).

### View 1 — DurchfuehrenDashboard

**Aktueller Zustand** ([DurchfuehrenDashboard.tsx:346-352](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L346)):

```tsx
if (ladeStatus === 'laden') {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <p className="text-slate-500 dark:text-slate-400">Wird geladen...</p>
    </div>
  )
}
```

Der globale Early-Return blendet Header + TabBar + Tab-Content gleichzeitig aus.

**Neuer Zustand:** Globaler Early-Return entfällt. Header + TabBar rendern immer. Tab-Content rendert Skeleton wenn:

```ts
const istLadenOderConfigFehlt = ladeStatus === 'laden' || !config
```

```tsx
{istLadenOderConfigFehlt ? (
  activeTab === 'vorbereitung'
    ? <DurchfuehrenVorbereitungSkeleton />
    : <DurchfuehrenSusReihenSkeleton pruefungId={pruefungId} />
) : (
  // bestehende activeTab-Render-Logik (Vorbereitung/Lobby/Live/Auswertung)
)}
```

**Sekundärer Loading-Text entfällt** ([DurchfuehrenDashboard.tsx:617-623](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L617)) — wenn `!config` zeigt jetzt der Tab-Skeleton.

**Header-Aktions-Buttons während Lade:**
- `LPAppHeaderContainer` rendert immer (Logo, Untertitel, Hilfe, Einstellungen)
- `aktionsButtons` (Live-Toggle, ↻-Refresh, Timer): `Live`/`↻` sichtbar aber **disabled** wenn `ladeStatus === 'laden'` — keine Click-Handler-Calls bevor Daten da sind
- Timer (`⏱`): rendert wie heute nur in `phase === 'aktiv'` — kein Bedarf während Lade
- `untertitel`: aus `titel = config?.titel || daten.pruefungTitel || pruefungId` → bei `!config && !daten` zeigt es `pruefungId` (URL-derived) als Fallback. Akzeptabel — zeigt z.B. „einrichtung-pruefung"

**Fehlerpfad bleibt unverändert:**
```tsx
if (ladeStatus === 'fehler' || !daten) { ... }
```
greift nach Skeleton-Phase, zeigt die existierende Fehler-Box mit „Erneut versuchen" / „← Zurück". `daten === null` ist nach `ladeDaten` mit `result === null` beim ersten Lade (`ladeStatus !== 'laden'` Bedingung in Z. 179) wirklich Fehler — kein Race mit Skeleton.

### View 2 — FragenBrowser

**Aktueller Zustand** ([FragenBrowser.tsx:333-337 + Z. 508-512](../../../src/components/lp/fragenbank/FragenBrowser.tsx#L333)):

```tsx
{ladeStatus === 'laden' && (
  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
    Fragensammlung wird geladen...
  </p>
)}
```

**Beide Stellen** (inline + overlay) durch `<FragenListeSkeleton />` ersetzen. Layout-Container (`flex-1 min-h-0 relative overflow-hidden`) und Header bleiben unangetastet.

**Empty-State „Keine Fragen gefunden"** (Z. 346 + 521) prüft schon `ladeStatus === 'fertig'` — kein Flash erwartet.

**`detailLaden`-Overlay** (Z. 339-344 + 514-519) bleibt unangetastet — anderer Use-Case (Editor-Open lädt Frage-Details).

### localStorage-Persistenz

**Helper** wird wiederverwendet aus G.f:
- [`leseGespeicherteAnzahl(key, fallback, max)`](../../../src/utils/skeletonAnzahl.ts) — bestehend
- [`schreibeGespeicherteAnzahl(key, wert)`](../../../src/utils/skeletonAnzahl.ts) — bestehend

**Neue Keys:**

| Key | View | Default | Cap | Schreib-Trigger |
|---|---|---|---|---|
| `examlab-lp-letzte-sus-anzahl-{pruefungId}` | DurchfuehrenSusReihenSkeleton | 8 | 60 | nach erfolgreichem `setDaten(...)` mit `daten.schueler.length > 0` |
| (kein Persist) | FragenListeSkeleton | 8 | — | — |

**Pattern (DurchfuehrenDashboard):**
```ts
useEffect(() => {
  if (ladeStatus === 'fertig' && daten?.schueler && daten.schueler.length > 0 && pruefungId) {
    schreibeGespeicherteAnzahl(`examlab-lp-letzte-sus-anzahl-${pruefungId}`, daten.schueler.length)
  }
}, [ladeStatus, daten?.schueler.length, pruefungId])
```

**Sanity-Cap 60:** typische Klassengrösse 18-25, max realistisch ~30. Cap 60 verhindert garbled-localStorage-Effekte ohne legitime Nutzung zu blockieren.

**FragenBrowser ohne Persist:** Liste ist via G.e virtualisiert — visuell sind nur ~10 Karten im Viewport sichtbar. Persistierte Anzahl bringt keinen messbaren Effekt; YAGNI.

**Skeleton-Komponenten-Signatur:**

```tsx
// DurchfuehrenSusReihenSkeleton — Anzahl Reihen aus pruefungId-spezifischem localStorage
export default function DurchfuehrenSusReihenSkeleton({ pruefungId }: { pruefungId: string | null }) {
  const key = pruefungId ? `examlab-lp-letzte-sus-anzahl-${pruefungId}` : ''
  const anzahl = pruefungId ? leseGespeicherteAnzahl(key, 8, 60) : 8
  const rendered = Math.max(anzahl, 5)  // visuelle Konsistenz: nie weniger als 5
  // ... render N rows
}

// DurchfuehrenVorbereitungSkeleton — fester Layout (Settings-Karten oben + Teilnehmer-Liste unten)
export default function DurchfuehrenVorbereitungSkeleton() { ... }

// FragenListeSkeleton — fester 8 Karten
export default function FragenListeSkeleton() { ... }
```

### Komponenten-Layouts

**`DurchfuehrenVorbereitungSkeleton`:**
- 2 Settings-Karten oben (Konfigurations-Bereich, je `bg-white dark:bg-slate-800 rounded-xl p-4 border`)
  - Karte 1: 3 Zeilen Settings (Höhe-3-w-3/4 / w-1/2 / w-2/3)
  - Karte 2: 4 Zeilen Settings
- 1 Teilnehmer-Tabellen-Container unten (`rounded-xl border`)
  - Header (h-5 w-40)
  - 5-6 Reihen (je h-12 mit Avatar-Kreis links + Name + Status-Pill rechts)

**`DurchfuehrenSusReihenSkeleton`:**
- Optionale Stat-Karten-Reihe (4-6 Karten oben, falls Tab=auswertung — heuristisch bei Reihen-Tabelle ohnehin nicht relevant; weglassen, einheitlich für Lobby/Live/Auswertung)
- Tabellen-Container mit N Reihen
- Jede Reihe: Avatar-Kreis (h-10 w-10), Name (h-4 w-32), Status-Pill rechts (h-6 w-20 rounded-full), Fortschrittsbalken (h-2 w-24 darunter)

**`FragenListeSkeleton`:**
- Vertikale Liste mit 8 Karten (jede `bg-white dark:bg-slate-800 rounded-lg p-4 border space-y-2`)
- Karte: Frage-Titel (h-5 w-3/4), 2 Tags (h-5 w-16 rounded-full + h-5 w-20 rounded-full), Footer mit Punktzahl (h-4 w-12)

### Render-Pattern in DurchfuehrenDashboard

**Vorher** (Z. 346-352, 617-623):
```tsx
if (ladeStatus === 'laden') return <BlankerSpinnerScreen />

return (
  <div className="h-screen ...">
    <LPAppHeaderContainer ... />
    <div className="flex flex-1 ...">
      ...
      {config && <TabContent />}
      {!config && <p>Prüfungskonfiguration wird geladen…</p>}
    </div>
  </div>
)
```

**Nachher:**
```tsx
// Kein globaler Early-Return mehr für 'laden'
if (ladeStatus === 'fehler' || (!daten && ladeStatus !== 'laden')) {
  return <FehlerBox />
}

const istLadenOderConfigFehlt = ladeStatus === 'laden' || !config

return (
  <div className="h-screen ...">
    <LPAppHeaderContainer
      ...
      aktionsButtons={istLadenOderConfigFehlt ? <ButtonsDisabled /> : <ButtonsAktiv />}
    />
    <div className="flex flex-1 ...">
      <div className="flex-1 overflow-y-auto">
        <VerbindungsBanner />
        <TabBar tabs={...} disabled={istLadenOderConfigFehlt ? alleDisabled : normalLogik} />

        {istLadenOderConfigFehlt ? (
          activeTab === 'vorbereitung'
            ? <DurchfuehrenVorbereitungSkeleton />
            : <DurchfuehrenSusReihenSkeleton pruefungId={pruefungId} />
        ) : (
          // bestehende activeTab-Logik
        )}
      </div>
    </div>
  </div>
)
```

**TabBar während Lade:** alle 4 Tabs disabled gerendert (visueller Hinweis dass Lade läuft). Sobald `config` da ist, normale `istTabVerfuegbar`-Logik greift.

### Datenfluss pro Use-Case

**Use-Case A — LP klickt Prüfungs-Karte (frisch):**
```
LP-Klick → /pruefung/<id> Route mountet DurchfuehrenDashboard
  ↓ [<10ms]
LPAppHeaderContainer + TabBar + Tab-Skeleton sichtbar
  ↓
ladeMonitoring + ladePruefung parallel (Pre-Warm via G.a/G.d.1)
  ↓ [~500-2000ms]
ladeStatus = 'fertig', config gesetzt → Skeleton ausgeblendet
  ↓
echter Tab-Content rendert (Vorbereitung/Lobby/Live/Auswertung je nach Phase)
  ↓
useEffect triggert: schreibeGespeicherteAnzahl(`examlab-lp-letzte-sus-anzahl-${pruefungId}`, anzahl)
```

**Use-Case B — LP öffnet beendete Prüfung mit `?tab=auswertung`:**
```
URL → activeTab='auswertung'
  ↓ [<10ms]
Header + Tabs sofort, DurchfuehrenSusReihenSkeleton sichtbar (mit gespeicherter SuS-Anzahl)
  ↓ [~1-3s]
config + daten geladen → Skeleton verschwindet
  ↓
Auswertung-Tab rendert Ergebnis-Übersicht-Akkordeon + eingebettetes <KorrekturDashboard />
  ↓
KorrekturDashboard hat eigenen Lade-Text „Korrektur wird geladen…" — sichtbar bis Korrektur-Daten da
  ↓ [Pre-Warm-Cache via G.d.1: meist <500ms]
Korrektur-Inhalt rendert
```
**Akzeptanz:** Mini-Flash am eingebetteten KorrekturDashboard ist Out-of-Scope (siehe oben).

**Use-Case C — Re-Login mit gespeicherter SuS-Anzahl:**
```
LP öffnet Prüfung 3a (letztes Mal: 22 SuS gespeichert)
  ↓
DurchfuehrenSusReihenSkeleton liest `examlab-lp-letzte-sus-anzahl-3a-pruefung1` = 22
  ↓
22 Reihen-Skeleton sichtbar — match der echten Klassengrösse
  ↓
Echte Daten rendern, layout springt nicht
```

**Use-Case D — LP öffnet Fragensammlung:**
```
LP klickt „Fragensammlung" → FragenBrowser overlay öffnet
  ↓ [<10ms]
ResizableSidebar + Header (Suche/Filter) sofort sichtbar
  ↓
useFragenbankStore liefert Liste aus G.c IDB-Cache (typisch 1ms)
  ↓
ladeStatus = 'fertig' fast sofort → Skeleton flashed kaum
  ↓
VirtualisierteFragenListe rendert
```
**Bei Cache-Miss** (z.B. erstmaliger Login ohne Pre-Fetch — sollte nach G.c selten sein):
```
ladeStatus = 'laden' → FragenListeSkeleton sichtbar (~2-3s)
  ↓
Backend-Fetch resolved → echte Liste
```

**Use-Case E — Demo-Modus / fehlerhafter Backend:**
```
istDemoModus → setDaten(erstelleDemoMonitoring()) + setLadeStatus('fertig') synchron
  ↓
Skeleton blitzt nicht auf, Inhalt direkt
```

**Use-Case F — Daten-Lade-Fehler:**
```
ladeMonitoring → result null + ladeStatus !== 'laden' (= bereits einmal geladen)
  ↓
fehlerCountRef erhöht, ab 3 → zeigeVerbindungsBanner = true
  ↓
Banner sichtbar, bestehende Daten bleiben angezeigt (kein Skeleton-Re-Show)
```

### Fehlerbehandlung

| Fehler | Verhalten |
|---|---|
| `ladeMonitoring` schlägt initial fehl | `ladeStatus = 'fehler'` → Fehler-Box (existierende Logik) |
| `ladePruefung` schlägt fehl, `daten` aber da | Skeleton verschwindet sobald `ladeStatus = 'fertig'` (auch ohne config) — aber Tab-Content rendert nichts (config-Guard im JSX). Edge-Case: LP sieht Tabs aber leeren Tab-Content. Akzeptabel — heutiger Code zeigt „Prüfungskonfiguration wird geladen…" — das wird durch Skeleton ersetzt der ggf. nicht verschwindet. **Lösung:** wenn `ladeStatus === 'fertig' && !config`, Tab-Content zeigt einen kleinen Inline-Hinweis „Prüfung konnte nicht geladen werden" mit Reload-Button (statt endlos-Skeleton). |
| localStorage nicht verfügbar | `leseGespeicherteAnzahl` fällt auf Default zurück |
| localStorage liefert garbled value | parseInt + Sanity-Cap → Default |
| `pruefungId === null` | Skeleton mit Default-Anzahl 8, kein localStorage-Read/Write |
| FragenBrowser: Store noch nicht geladen, Demo-Modus | `ladeStatus === 'fertig'` direkt (Demo-Pfad), kein Skeleton |

### Edge-Cases

| Edge-Case | Verhalten |
|---|---|
| Erst-Öffnung Prüfung (kein localStorage) | `DurchfuehrenSusReihenSkeleton` zeigt 8 Reihen (Default) |
| Pruefung mit 0 Teilnehmern | Skeleton zeigt 8 Reihen (`Math.max(0, 5) || Default`); echte UI zeigt dann „Keine Teilnehmer" — kein Layout-Sprung-Problem (Phase-Komponente hat eigenes Empty-Layout) |
| Pruefung mit 60+ Teilnehmern | Cap 60 → max 60 Skeleton-Reihen (Performance-OK, keine Virtualisierung nötig für so kurze Lade-Zeit) |
| User wechselt Tab während Lade | `activeTab` bleibt der gewählte → Skeleton wechselt zwischen Vorbereitung/SuS-Reihen entsprechend |
| URL `?tab=auswertung` bei laufender Prüfung (noch nicht beendet) | activeTab='auswertung' beim Mount → SuS-Reihen-Skeleton sichtbar bis Daten da, dann phase-derived Auto-Switch zu 'live' (existierende Logik) |
| Eingebettetes KorrekturDashboard im Auswertung-Tab | sieht G.d.1-Pre-Warm-Cache, lädt typisch <500ms — kein eigener Skeleton (Out-of-Scope) |
| FragenBrowser inline-Modus + overlay-Modus | beide Render-Stellen ersetzt — Skeleton funktioniert in beiden |
| Re-deploy während User offen | Service-Worker-Cache-Bust + Reload → frisch Skeleton, dann Inhalt |

## Test-Strategie

### Unit-Tests (vitest)

**`DurchfuehrenVorbereitungSkeleton.test.tsx` (~3 Cases):**
- Render zeigt 2 Settings-Karten + 1 Teilnehmer-Container
- `data-testid` Marker pro Section vorhanden
- Light/Dark-Klassen vorhanden (`dark:bg-slate-800`)

**`DurchfuehrenSusReihenSkeleton.test.tsx` (~5 Cases):**
- Render mit `pruefungId='abc'` und gespeicherter Anzahl 22 → 22 Reihen im DOM
- Render ohne localStorage → 8 Reihen (Default)
- Render mit Anzahl 100 (über Cap) → 60 Reihen (Cap)
- Render mit Anzahl 2 (unter Min) → 5 Reihen (`Math.max`)
- Render mit `pruefungId=null` → 8 Reihen, kein localStorage-Read

**`FragenListeSkeleton.test.tsx` (~2 Cases):**
- Render zeigt 8 Karten-Skeletons
- `animate-pulse`-Klasse und `data-testid="fragen-liste-skeleton-karte"` vorhanden

**`DurchfuehrenDashboard.test.tsx` Erweiterung (~5 Cases):**
- Wenn `ladeStatus === 'laden'`: `LPAppHeaderContainer` gerendert (sichtbar via Header-Test-ID)
- Wenn `ladeStatus === 'laden'` + `activeTab === 'vorbereitung'`: `DurchfuehrenVorbereitungSkeleton` rendert
- Wenn `ladeStatus === 'laden'` + `activeTab === 'auswertung'`: `DurchfuehrenSusReihenSkeleton` rendert
- Wenn `ladeStatus === 'fertig'` + `config` da: bestehende Tab-Logik rendert (Skeleton weg)
- localStorage-Schreib-Trigger nach erfolgreichem `setDaten`: `examlab-lp-letzte-sus-anzahl-{id}` ist gesetzt

**`FragenBrowser.test.tsx` Erweiterung (~2 Cases):**
- Wenn `ladeStatus === 'laden'` (inline-Modus): `FragenListeSkeleton` gerendert, kein „Fragensammlung wird geladen..."-Text
- Wenn `ladeStatus === 'laden'` (overlay-Modus): dito

**Erwarteter neuer Test-Stand:** ~800 baseline (S154) + ~17 neue = ~817 vitest grün.

### Browser-E2E (preview, echte Logins)

| # | Pfad | Erwartung |
|---|---|---|
| 1 | LP klickt Prüfungs-Karte (Vorbereitung) | Header + Tabs sofort sichtbar (≤100ms), `DurchfuehrenVorbereitungSkeleton` rendert |
| 2 | LP klickt beendete Prüfung mit `?tab=auswertung` | Header + Tabs + `DurchfuehrenSusReihenSkeleton` sichtbar, dann echte Auswertung |
| 3 | Re-Login auf selbe Prüfung | SuS-Reihen-Skeleton zeigt persistierte Anzahl (z.B. 22) — match echte Klassengrösse |
| 4 | LP öffnet Fragensammlung | Header+Filter sofort, `FragenListeSkeleton` statt Lade-Text (oder direkt Liste bei Cache-Hit) |
| 5 | Light + Dark Mode | beide Skeletons lesbar |
| 6 | localStorage-Inspektion DevTools | nach Step 1: `examlab-lp-letzte-sus-anzahl-{pruefungId}` ist gesetzt |

### Inverse-Tests (Code-Revert beweist Skeleton-Wirksamkeit)

Pattern aus G.f wiederverwenden: Vor jedem Skeleton-Render-Test einen `data-testid="durchfuehren-vorbereitung-skeleton"`-Marker setzen. Im Test prüfen dass der Marker bei `ladeStatus === 'laden'` da ist und bei `ladeStatus === 'fertig'` weg.

## Akzeptanz-Kriterien

| Kriterium | Wert |
|---|---|
| DurchfuehrenDashboard: Header + Tabs sichtbar nach Mount | ≤100ms |
| DurchfuehrenDashboard: Tab-Skeleton statt blanker Bildschirm | ja, Vorbereitung-Variante + SuS-Reihen-Variante |
| DurchfuehrenDashboard: SuS-Reihen-Anzahl aus localStorage layout-akkurat (Range 5-60) | ja, pro pruefungId |
| FragenBrowser: Listen-Skeleton statt Lade-Text in beiden Render-Stellen | ja |
| FragenBrowser: 8 Karten fest, kein Persist | ja |
| Light/Dark Mode beide funktional | ja |
| Bestehende Fehler-Box bleibt funktional bei `ladeStatus === 'fehler'` | ja |
| Eingebettetes KorrekturDashboard unangetastet | ja |
| Apps-Script unverändert | ja |
| Eingebettetes KorrekturDashboard zeigt seinen eigenen „Korrektur wird geladen…"-Text bei Cache-Miss | erwartet (kein Regression-Indikator) — siehe Out-of-Scope |
| Alle vitest grün | ~800 baseline + ~17 neue |
| `tsc -b` clean | ja |
| `npm run build` erfolgreich | ja |
| Browser-E2E grün | 6/6 Punkte |

## Reihenfolge der Implementierung (Plan-Phase)

1. **Drei Skeleton-Komponenten** als isolierte Files mit Unit-Tests:
   - `DurchfuehrenVorbereitungSkeleton.tsx` + Tests
   - `DurchfuehrenSusReihenSkeleton.tsx` + Tests (mit pruefungId-Persist)
   - `FragenListeSkeleton.tsx` + Tests
2. **`DurchfuehrenDashboard.tsx`** Refactor:
   - Globalen Early-Return entfernt (Z. 346-352)
   - `istLadenOderConfigFehlt` abgeleitet
   - Header + TabBar immer rendern
   - Tab-Content: Skeleton-Switch je `activeTab`
   - Sekundären „Prüfungskonfiguration wird geladen…"-Text entfernt (Z. 617-623)
   - Fehler-Pfad bei `ladeStatus === 'fertig' && !config` (kleiner Inline-Hinweis)
   - localStorage-Persist `useEffect`
   - aktionsButtons disabled-Variante während Lade
3. **`FragenBrowser.tsx`** Refactor:
   - Beide „Fragensammlung wird geladen..."-Stellen durch `<FragenListeSkeleton />` ersetzen (inline + overlay)
4. **`tsc -b`** + **`npm run build`** + **`npm test`** komplett grün
5. **Browser-E2E** auf preview mit echtem LP-Login + Beobachtung der Lade-Phasen
6. **Visual Smoke-Test** Light + Dark Mode für alle 3 Skeletons
7. **Merge auf main** nach LP-Freigabe

Geschätzte Implementierung: ~6-8 Commits in 1 Subagent-Driven-Session.

## Verifizierte Annahmen (Code-Read 2026-04-27)

- **`DurchfuehrenDashboard.tsx`** ist 648 Z. ([DurchfuehrenDashboard.tsx](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx))
- **Globaler Early-Return** in [Z. 346-352](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L346): blendet Header + Tabs aus
- **Sekundärer Loading-Text** in [Z. 617-623](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L617): „Prüfungskonfiguration wird geladen…"
- **`activeTab`-Default** beim Mount aus URL-Param oder `'vorbereitung'` ([Z. 93-94](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L93)) — Skeleton kann den richtigen Tab antizipieren
- **`config + daten`** parallel via `Promise.all` aus `ladePruefung + ladeMonitoring` ([Z. 246-249](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L246))
- **`FragenBrowser.tsx`** ist 627 Z. ([FragenBrowser.tsx](../../../src/components/lp/fragenbank/FragenBrowser.tsx))
- **Zwei Lade-Text-Stellen** in [Z. 333-337](../../../src/components/lp/fragenbank/FragenBrowser.tsx#L333) (inline) und [Z. 508-512](../../../src/components/lp/fragenbank/FragenBrowser.tsx#L508) (overlay)
- **`detailLaden`-Overlay** ist separater Use-Case (Editor-Open) — bleibt unangetastet
- **G.c IDB-Cache** liefert Fragenbank-Liste in 1ms (Cache-Hit) — typische Lade-Phase ist <50ms, Skeleton flashed kaum
- **`useFragenbankStore.status`** kennt `idle | summary_laden | summary_fertig | detail_laden | fertig` — Skeleton-Schwelle ist `idle | summary_laden`
- **`leseGespeicherteAnzahl` + `schreibeGespeicherteAnzahl`** existieren in [`src/utils/skeletonAnzahl.ts`](../../../src/utils/skeletonAnzahl.ts) — werden wiederverwendet
- **G.f Skeleton-Komponenten** in [`src/components/lp/skeletons/`](../../../src/components/lp/skeletons/) sind Pattern-Vorlage

## Im Plan zu lokalisieren

- **Exakte Disabled-Variante** für `aktionsButtons` während Lade — Buttons rendern in disabled-State oder ganz auslassen?
- **TabBar mit `disabled=true` für alle Tabs während Lade** — passt zu existierender `istTabVerfuegbar`-Logik oder eigene Variante?
- **Inline-Hinweis bei `ladeStatus === 'fertig' && !config`** — exakte Copy + Reload-Button-Pfad
- **Eingebettetes KorrekturDashboard im Auswertung-Tab**: prüfen ob die Tab-Switch-Logik beim ersten Render Skeleton-fertig-Übergang ohne Layout-Sprung handhabt
- **Visual Smoke-Test Pfade**: konkrete Test-Pruefung wählen (Einrichtungsprüfung), Klassen-Variante (z.B. mit 5 vs 22 SuS) für Persist-Effekt
- **Persist-Trigger-`useEffect` redundante Writes vermeiden**: `useRef<number | null>` für zuletzt geschriebenen Wert — nur schreiben wenn `aktuellerWert !== refWert`. Verhindert localStorage-I/O bei jedem Polling-Update wenn Schüler-Anzahl konstant bleibt. Optional, aber konsistent mit Pattern in `LPStartseite.tsx` (G.f).
