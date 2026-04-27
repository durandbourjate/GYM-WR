# Bundle G.e — Fragensammlung Virtualisierung (Design-Spec)

> **Status:** Design — wartet auf Spec-Review + User-Freigabe
> **Datum:** 2026-04-27
> **Session:** S151
> **Vorgänger:** G.d.1 + G.d.2 (in dieser Session designed)

## Zielsetzung

Die Fragensammlung skaliert heute schlecht: 2412 Fragen führen zu mehrfachen Sekunden Initial-Render und spürbarem Scroll-Lag. Der "Lade-Mehr"-Workaround ist UX-Reibung und greift bei Gruppierung gar nicht.

G.e ersetzt die `.map()`-Listenrenderung durch Virtualisierung mit `@tanstack/react-virtual`. Nur sichtbare Items + 10er-Overscan-Puffer landen im DOM.

**Erwartbarer Win:**
- DOM-Knoten in Fragenliste bei 2412 Fragen: ~2'400+ → ≤80 (konstant)
- Initial-Render bei 2412 Fragen: mehrere Sekunden → ≤500ms
- Scroll FPS: spürbarer Lag → ≥58fps
- "Lade-Mehr"-Button verschwindet — alle Fragen direkt scrollbar
- Skaliert linear nicht im DOM, sondern nur in den Daten — bei 10'000 Fragen unverändert performant

## Bundle-G-Roadmap-Kontext

| Sub-Bundle | Inhalt | Architektur-Familie |
|---|---|---|
| G.d.1 | Polling + Backend-Pre-Warm | G.a-Familie |
| G.d.2 | Stammdaten-IDB-Cache | G.c-Familie |
| **G.e** | Fragensammlung Virtualisierung | **Neu — UI-Performance** |
| G.f | LP-Startseite Skeleton-Pattern | UI-Pattern (folgt) |

G.e ist eine eigenständige UI-Performance-Optimierung, unabhängig von G.d.x. Kann parallel oder nach G.d.x gemerged werden.

## Architektur

### Neue Library

`@tanstack/react-virtual` (~6 KB gzipped, Hook-API, TanStack-Familie). Begründung gegenüber Alternativen:
- `react-virtuoso` würde Sticky-Group-Headers eingebaut bringen, ist aber höher Level mit weniger Customization. Bei custom KompaktZeile/DetailKarte und projektspezifischer Sticky-Header-Styling überwiegt `@tanstack/react-virtual`s Kontrolle.
- `react-window` ist älter, weniger Features (kein `measureElement` standardmässig).

### Neue Komponente — `VirtualisierteFragenListe.tsx`

Pfad: `src/components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe.tsx`

```ts
interface Props {
  gruppierteAnzeige: GruppierteAnzeige[]
  gruppierung: Gruppierung
  aufgeklappteGruppen: Set<string>
  kompaktModus: boolean
  bereitsVerwendetSet: Set<string>
  fragenStats: Map<string, Performance>
  toggleGruppe: (key: string) => void
  toggleFrageInPruefung: (id: string) => void
  handleEditFrage: (frage: Frage) => void
  handleFrageDuplizieren: (frage: Frage) => void
  // Optional: scrollResetTrigger (für Filter-Wechsel-Reset)
  scrollResetTrigger: unknown
}
```

**Internes flat-array** (FlatItem):
```ts
type FlatItem =
  | { typ: 'header'; gruppeKey: string; gruppeLabel: string; istAufgeklappt: boolean; fragenAnzahl: number; inPruefungAnzahl: number }
  | { typ: 'frage'; frage: Frage; gruppeKey: string }
```

Bauen via `useMemo`:
- Wenn `gruppierung === 'keine'`: alle Fragen als `{typ:'frage'}` (kein Header)
- Sonst: pro Gruppe ein `{typ:'header'}` + (wenn aufgeklappt) deren Fragen als `{typ:'frage'}`

**`useVirtualizer`-Konfiguration:**
```ts
const virtualizer = useVirtualizer({
  count: flatItems.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: (i) => {
    const item = flatItems[i]
    if (item.typ === 'header') return 36
    return kompaktModus ? 56 : 200  // Initial-Schätzung; measureElement korrigiert
  },
  overscan: 10,
})
```

**Render-Pattern:**
```tsx
<div ref={scrollRef} className="h-full overflow-y-auto">
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
    {virtualizer.getVirtualItems().map((vItem) => {
      const item = flatItems[vItem.index]
      return (
        <div
          key={vItem.key}
          ref={virtualizer.measureElement}
          data-index={vItem.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${vItem.start}px)`,
          }}
        >
          {item.typ === 'header' ? <GroupHeader item={item} onToggle={toggleGruppe} /> : <FrageZeile item={item} ... />}
        </div>
      )
    })}
  </div>
</div>
```

**Sticky Group Headers — Risiko:** Sticky-Headers in `@tanstack/react-virtual` sind nicht trivial. Theoretisch funktioniert `position: sticky; top: 0; z-index: 10` auf den Header-Items, aber weil die virtuellen Items selbst absolute-positioniert sind via `transform: translateY(...)`, kann der Sticky-Effekt brechen — bekannte Limitation der Library.

**Plan-Phase Spike** zur Verifikation: erster Implementations-Schritt soll mit echten Daten (Test-Pool 100 Fragen + 5 Gruppen) testen, ob Sticky-Headers im virtualisierten Modus korrekt halten. Falls nicht, fallback auf:
- **Variante A: Sticky-Header-Lane** — Headers ausserhalb der Virtualisierung als separater Layer; `useVirtualizer` virtualisiert nur Frage-Items pro Gruppe in eigenen Sub-Listen.
- **Variante B: Header-as-Pseudo-Sticky** via `position: fixed` + manuelles Berechnen anhand `virtualizer.getVirtualItems()[0].index` — komplexer, aber möglich.

Die "FlatItem-mit-Header"-Lösung ist Default. Variante A/B werden im Plan nur geöffnet falls Spike negativ ausgeht.

**Scroll-Reset bei Filter-Wechsel:** useEffect mit `scrollResetTrigger`-Dep ruft `virtualizer.scrollToIndex(0)`. Trigger ist eine Kombination aus `gefilterteFragen.length`, `gruppierung` und einer `filter-version`-Hash (für Suche-Änderungen).

### Refactor — `FragenBrowser.tsx`

FragenBrowser hat **zwei separate Render-Pfade** (inline-Modus ab Z. 274 + overlay-Modus ab Z. 498), beide enthalten dieselbe `.map`-Logic (Duplikat). **Beide** Render-Pfade rufen `<VirtualisierteFragenListe />` mit identischen Props auf:

```tsx
<VirtualisierteFragenListe
  gruppierteAnzeige={filter.gruppierteAnzeige}
  gruppierung={filter.gruppierung}
  aufgeklappteGruppen={filter.aufgeklappteGruppen}
  kompaktModus={filter.kompaktModus}
  bereitsVerwendetSet={bereitsVerwendetSet}
  fragenStats={fragenStats}
  toggleGruppe={toggleGruppe}
  toggleFrageInPruefung={toggleFrageInPruefung}
  handleEditFrage={handleEditFrage}
  handleFrageDuplizieren={handleFrageDuplizieren}
  scrollResetTrigger={[filter.suchtext, filter.gruppierung, filter.gefilterteFragen.length].join('|')}
/>
```

- Aufrufpunkt 1 ersetzt Z. 344-414 (inline-Modus)
- Aufrufpunkt 2 ersetzt Z. 569-639 (overlay-Modus)

Beide "Lade-Mehr"-Buttons (Z. 403-412 + 637-647) entfernt.

FragenBrowser sinkt von 732 → ~600 Zeilen.

### Cleanup — `useFragenFilter.ts` + `FragenBrowserHeader.tsx`

`useFragenFilter.ts`:
- `SEITEN_GROESSE` Konstante (Z. 22) entfernen
- `angezeigteMenge`-State + `setAngezeigteMenge` (Z. 73-74, 115) entfernen
- `slice(0, angezeigteMenge)` Logic in `gruppierteAnzeige` (Z. 222) entfernen
- `seitenGroesse` Property im Return (Z. 304) entfernen

`FragenBrowserHeader.tsx` (wird von FragenBrowser mit Pagination-Props aufgerufen):
- Props `angezeigteMenge` und `setAngezeigteMenge` entfernen (FragenBrowser.tsx Z. 311 + 541)
- Falls Header die Werte für ein "Anzeige X von Y"-Label nutzt: ersetzt durch `gefilterteFragen.length` Anzeige

`gruppierteAnzeige` returnt nach Cleanup alle Fragen pro Gruppe (vorher nur die ersten 30 wenn nicht-gruppiert).

**Tests-Cleanup:** `useFragenFilter.test.ts`-Cases die `SEITEN_GROESSE`/`angezeigteMenge`-Verhalten testen werden entfernt. Replacement-Test: `gruppierteAnzeige liefert alle Fragen ohne Slice` (auch ohne Gruppierung).

## Datenfluss pro Use-Case

### Use-Case A — LP öffnet Fragensammlung mit 2412 Fragen

```
LP klickt Fragensammlung-Tab → FragenBrowser mountet
  ↓
useFragenbankStore liefert Fragen (G.c-IDB-Cache-Hit oder API-Load)
  ↓
useFragenFilter berechnet gefilterteFragen (alle 2412)
  ↓
gruppierteAnzeige = [{key:'BWL', fragen:[...]}, ...]
  ↓
VirtualisierteFragenListe baut flat-array (~2412 + ~5 Headers)
  ↓
useVirtualizer berechnet sichtbare Items im Viewport
  ↓
React rendert ~30-50 DOM-Knoten (sichtbare + 10 Overscan)
  ↓
User sieht erste Seite, Scrollbar zeigt korrekte Höhe
```

### Use-Case B — User scrollt durch alle Fragen

```
User scrollt
  ↓
Browser feuert scroll-Event
  ↓
useVirtualizer berechnet neue sichtbare Range
  ↓
React rendert NEUE DOM-Knoten für neue Items, recycelt alte (per key)
  ↓
DOM-Anzahl bleibt konstant (~30-50)
  ↓
User sieht nahtlos Scroll, Sticky-Header bleibt am oberen Rand
```

### Use-Case C — User wechselt Filter (z.B. neuer Suchtext)

```
User tippt Suchtext
  ↓
useFragenFilter recomputed gefilterteFragen
  ↓
gruppierteAnzeige aktualisiert
  ↓
VirtualisierteFragenListe baut flat-array neu
  ↓
useEffect mit scrollResetTrigger (suchtext-Änderung) feuert
  ↓
virtualizer.scrollToIndex(0) → Scroll springt nach oben
  ↓
User sieht erste Resultate des neuen Filters
```

### Use-Case D — User klappt Gruppe zu

```
User klickt Gruppe-Header → toggleGruppe(key)
  ↓
aufgeklappteGruppen-State aktualisiert
  ↓
flat-array recomputed: Items dieser Gruppe entfernt
  ↓
useVirtualizer detektiert geänderten count
  ↓
DOM rendert weniger Items, Scroll-Position bleibt
  ↓
Header bleibt sichtbar, alle Items darunter weg
```

## Fehlerbehandlung

### Frontend-Pfade

| Fehler | Verhalten |
|---|---|
| `useVirtualizer` wirft (theoretisch) | Try/catch in VirtualisierteFragenListe → Fallback `<p>Listenfehler</p>` |
| `flatItems` leer (alle gefiltert weg) | Bestehende Empty-State-Logik in FragenBrowser bleibt (Z. 338-342) |
| `measureElement` schlägt fehl | Initial-Estimate bleibt → Scroll-Position approximativ → unkritisch |
| Scroll-Container-Höhe = 0 (z.B. Tab nicht aktiv) | useVirtualizer rendert 0 Items → kein Crash |
| `scrollToIndex` während Mount | useVirtualizer puffert Calls, kein Crash |

### Performance-Edge-Cases

| Szenario | Verhalten |
|---|---|
| 50'000+ Fragen | DOM bleibt konstant, aber `flat-array`-Build dauert länger (~200ms). Bei wirklich grossen Mengen wäre Server-Pagination nötig. Wird in "Was NICHT" als Future-Punkt genannt. |
| Variable DetailKarte-Höhe stark schwankend | `measureElement` korrigiert nach erstem Render, Scrollbar passt sich an (kleines Jiggle möglich beim Initial-Scroll). Bekannter `@tanstack/react-virtual`-Trade-off. |
| Resize-Events | useVirtualizer hört automatisch auf Container-Resize via ResizeObserver |
| Mobile Touch-Scroll | unterstützt von useVirtualizer out-of-the-box |

## Edge-Cases

| Edge-Case | Verhalten |
|---|---|
| Gruppe leer (0 Fragen nach Filter) | Header bleibt sichtbar mit "0" — bestehendes Verhalten, unverändert |
| Alle Gruppen zugeklappt | flat-array enthält nur Headers — virtualisierte Liste sehr kurz, OK |
| Modus-Wechsel Kompakt → Detail mit Scroll-Position | `estimateSize` ändert sich → useVirtualizer recomputed → Scroll-Position wird **prozentual** beibehalten (kann leicht springen, akzeptabel) |
| Sticky-Header overlap | Sticky-Header sind position:sticky relativ zu scroll-container; Items darunter haben transform:translateY und werden vom Header überdeckt, OK |
| FragenEditor öffnet (Overlay) | Scroll-Container bleibt mounted im Hintergrund, kein Re-Render der Liste — Editor schliesst → Scroll-Position erhalten |

## Test-Strategie

### Unit-Tests (vitest)

`VirtualisierteFragenListe.test.tsx` (~10 Cases):
- Render mit 100 Fragen + 5 Gruppen → flat-array korrekt aufgebaut (Header + Items)
- Render mit `gruppierung === 'keine'` → keine Headers im flat-array
- Aufklappen/Zuklappen Gruppe → flat-array updated
- KompaktModus-Toggle → estimateSize-Funktion liefert andere Werte
- `toggleFrageInPruefung` Callback wird mit korrekter ID aufgerufen
- Scroll-Reset-Trigger ändert sich → `virtualizer.scrollToIndex(0)` wird aufgerufen (mock)
- Empty `gruppierteAnzeige` → Empty-State (kein Render von Items)

**jsdom-Limitation:** jsdom hat keine echte Layout-Engine, `measureElement` funktioniert nicht voll. Tests mocken `useVirtualizer` mit Stub-Implementierung die ein konfigurierbares `getVirtualItems`-Array liefert. Logic der flat-array-Konstruktion ist dadurch unabhängig testbar.

`useFragenFilter.test.ts` Erweiterung:
- Bestehende Tests grün (filter, sortieren, gruppieren bleiben unverändert)
- Entfernte Pagination-Tests gelöscht

### Browser-E2E (preview, echte LP-Login)

| # | Pfad | Erwartung |
|---|---|---|
| 1 | LP-Login → Fragensammlung-Tab | Initial-Render ≤500ms, Sammlung sichtbar |
| 2 | Chrome DevTools Elements → Anzahl `<div data-index>` zählen | ≤80 (auch bei 2412 Fragen) |
| 3 | Scroll von Anfang bis Ende der 2412 Fragen | Scroll smooth, ≥58fps (Performance-Tab) |
| 4 | Suchtext eingeben → Filter wirkt | Scroll springt nach oben, Resultate sichtbar ≤200ms |
| 5 | Gruppe aufklappen | Items erscheinen, Scroll-Position bleibt |
| 6 | Gruppe zuklappen | Items verschwinden, Scroll-Position bleibt |
| 7 | KompaktModus-Toggle | Höhen ändern sich, Liste bleibt scrollbar |
| 8 | Frage editieren (Editor öffnet/schliesst) | Scroll-Position erhalten |
| 9 | Memory-Snapshot in DevTools | <70% des heutigen Heap-Verbrauchs |
| 10 | Mobile/Touch-Scroll auf iPad | Smooth, keine UI-Brüche |

## Akzeptanz-Kriterien

| Kriterium | Wert |
|---|---|
| DOM-Knoten in Fragenliste bei 2412 Fragen | ≤80 (statt 2'400+) |
| Initial-Render bei 2412 Fragen | ≤500ms |
| Scroll FPS in Chrome | ≥58fps |
| Memory-Footprint Heap-Snapshot | reduziert um >70% |
| Beide Anzeige-Modi (Kompakt/Detail) funktional | ja |
| Sticky Group Headers funktional | ja |
| Filter/Suche/Gruppieren reaktiv | ja |
| Filter-Wechsel resetted Scroll auf 0 | ja |
| Bundle-Grösse-Zuwachs | <10 KB gzipped |
| FragenBrowser.tsx Zeilen-Anzahl | ~600 (von 732, -132) |
| useFragenFilter.ts: Pagination-State entfernt | ja |
| Alle vitest grün | 731 baseline + ~10 neue |
| `tsc -b` clean | ja |
| `npm run build` erfolgreich | ja |
| Browser-E2E grün | 10/10 Punkte |

## Reihenfolge der Implementierung (Plan-Phase)

0. **Preflight-Messungen** (Baseline vor Implementierung):
   - Bundle-Size baseline (`npm run build` Output)
   - Heap-Snapshot mit 2412 Fragen geöffnet
   - DOM-Knoten-Anzahl in Fragenliste
   - Initial-Render-Latenz (Performance-Tab)
1. **`@tanstack/react-virtual`** als Dependency hinzufügen + Bundle-Size-Vergleich vs. Baseline
2. **Sticky-Header-Spike** (siehe Risiko in Architektur): Test mit 100 Fragen + 5 Gruppen, ob Sticky-Headers im virtualisierten Modus halten. Bei Negativ-Ergebnis Fallback-Variante wählen.
3. **`VirtualisierteFragenListe.tsx`** als neue Komponente mit Unit-Tests
4. **`useFragenFilter.ts` + `FragenBrowserHeader.tsx`** Pagination-Cleanup mit Test-Updates
5. **`FragenBrowser.tsx`** Refactor: beide `.map`-Blocks (inline + overlay) ersetzt durch `<VirtualisierteFragenListe />`
6. **`tsc -b`** + **`npm run build`** + **`npm test`** komplett grün
7. **Browser-E2E** auf preview mit echtem LP-Login + 2412 Fragen
8. **Performance-Mess-Verifikation vs. Preflight-Baseline**: DOM-Anzahl, FPS, Memory in Chrome DevTools
9. **Merge auf main** nach LP-Freigabe

Geschätzte Subagent-Sessions: ~6-10 Commits in 1 Implementations-Session.

## Was wir explizit NICHT in G.e machen

- **Server-side Pagination** für >50k Fragen — Future, derzeit irrelevant
- **Refactor anderer 500+ Z.-Komponenten** — Stay focused
- **Re-Design KompaktZeile/DetailKarte** — Inhalt unverändert
- **Skeleton-Loading-Placeholders** während Initial-Load — das ist G.f-Pattern
- **Pagination-Backend-Endpoint** — keiner geplant
- **Infinite-Scroll-Loading-Indikator** (Spinner unten) — bei Virtualisierung nicht nötig
- **Polling-Tuning** — ist G.d.1
- **IDB-Cache** — ist G.d.2

## Verifizierte Annahmen (Code-Read 2026-04-27)

- **`FragenBrowser.tsx` ist 732 Z.** ([FragenBrowser.tsx](../../../src/components/lp/fragenbank/FragenBrowser.tsx)), enthält zwei .map-Blöcke (Z. 344-414, Z. 569-639) plus zwei "Lade-Mehr"-Button-Blöcke (Z. 403-412, Z. 637-647)
- **`useFragenFilter.ts`** definiert Pagination-State ([useFragenFilter.ts:22](../../../src/hooks/useFragenFilter.ts#L22), Z. 73-74, 115, 222, 293, 304)
- **2 Duplikate des Render-Blocks** im FragenBrowser deuten auf Refactor-Schuld hin — Konsolidierung in `VirtualisierteFragenListe` löst beides
- **`KompaktZeile`** und **`DetailKarte`** als Sub-Komponenten existieren in `fragenbrowser/`-Subordner
- **Sticky Group Headers** existieren bereits via `position:sticky` (Z. 354)
- **Empty-State** existiert (Z. 338-342)
- **Aktive Pool-Anzahl: 2412 Fragen** (Memory-Eintrag aus 23.04.2026)
- **`@tanstack/react-virtual`** ist nicht installiert — neue Dependency
- **TanStack-Familie** ist im Projekt-Stack (Vitest verwendet z.B. TanStack-Router nicht, aber `@tanstack/react-virtual` ist standalone)

## Im Plan zu lokalisieren

- **Genauer Pfad zu FlatItem-Konsumenten:** wo werden `gruppenLabel`, `gruppenLabelFarbe` Helper für Headers definiert? (in `fragenbrowser/gruppenHelfer.ts`-Datei vermutet)
- **`fragenStats` Type:** Performance-Map-Struktur muss konsistent zwischen FragenBrowser und VirtualisierteFragenListe übergeben werden
- **`bereitsVerwendetSet` Source:** stammt aus FragenBrowser-State, muss als Prop reaktiv durchgereicht werden
- **`scrollResetTrigger`-Hash-Strategie:** beste Kombination aus `suchtext`, `gruppierung`, `gefilterteFragen.length` und ggf. weiteren Filter-Bits zu finden
- **Test-Setup für `useVirtualizer`-Mock:** etablierter Pattern aus TanStack-Docs in vitest-Test einbauen
