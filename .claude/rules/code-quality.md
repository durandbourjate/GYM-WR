# Code Quality

## Dateigrössen

Komponenten über 500 Zeilen sind ein Warnsignal. Über 800 Zeilen → vor neuen Features aufteilen.

Aktueller Stand (bekannte Ausnahmen, nicht weiter wachsen lassen):
- SettingsPanel.tsx (2137 Z.) — enthält 6+ Editoren, Kandidat für Split
- plannerStore.ts (1503 Z.) — Hauptstore, schwer teilbar, aber keine neuen Actions hinzufügen ohne Prüfung
- WeekRows.tsx (1445 Z.) und DetailPanel.tsx (1396 Z.) — an der Grenze

Bei neuen Features: Prüfe ob eine bestehende Datei über 800 Zeilen wächst. Falls ja, erst refactorn (Extract Component/Hook), dann Feature bauen.

## TypeScript-Strenge

- **Build-Check VOR jedem Commit: `npx tsc -b` (NICHT `tsc --noEmit`!)** — `tsc -b` entspricht dem CI. `tsc --noEmit` ist weniger streng und findet nicht alle Fehler. Gilt für Pruefung UND Unterrichtsplaner.
- Kein neues `as any` einführen (aktuell 58 Stellen — nicht erhöhen)
- Neue Funktionen: explizite Parameter- und Return-Types
- `JSON.parse()` immer in try/catch wrappen und Rückgabetyp validieren

## Komplexität vermeiden

- Keine verschachtelten ternären Ausdrücke (max. 1 Ebene)
- Event-Handler über 15 Zeilen → in eigene Funktion extrahieren
- Neue Helper/Utils in eigene Dateien unter `utils/`, nicht inline in Komponenten

## Performance-Bewusstsein

- `useMemo`/`useCallback` nur bei messbarem Bedarf (nicht prophylaktisch)
- Grosse Listen: Prüfe ob virtualisiert werden muss (>100 Einträge sichtbar)
- Keine neuen `useEffect` ohne Cleanup-Funktion wenn Event-Listener oder Timer verwendet werden

## Zustand-Selektoren (React #185 vermeiden)

**Problem (S110, AdminKindDetail):** Selektoren, die ein neues Objekt/Array pro Render erzeugen, führen zu Endlos-Re-Renders (React #185: "Maximum update depth exceeded"). Zustand vergleicht Selector-Ergebnisse per `Object.is` — neue Referenz = "State geändert" → Re-Render → Selector läuft erneut → neues Array → Schleife.

**Verboten:**
```ts
// ❌ .filter()/.map()/Object-Literal im Selector
const items = useStore(s => s.list.filter(x => x.email === email))
const stats = useStore(s => ({ a: s.a, b: s.b }))
```

**Erlaubt:**
```ts
// ✅ Rohdaten-Slice subscriben, mit useMemo filtern
const list = useStore(s => s.list)
const items = useMemo(() => list.filter(x => x.email === email), [list, email])

// ✅ Einzelne Felder pro Selector
const a = useStore(s => s.a)
const b = useStore(s => s.b)

// ✅ useShallow für Objekt-Selektionen
import { useShallow } from 'zustand/shallow'
const { a, b } = useStore(useShallow(s => ({ a: s.a, b: s.b })))
```

Auch Store-Getter-Methoden wie `getFoo(id)` sind nicht sicher im Selector, wenn sie intern filtern/mappen. Rohdaten selektieren, im Component transformieren.

## Inline Styles vs. Tailwind

- Tailwind-Klassen bevorzugen (1220 className vs. 359 style= aktuell)
- `style=` nur für dynamische Werte (berechnete Breiten, Farben aus Daten, Positionen)
- Keine neuen hardcodierten Hex-Farben in style= — immer über `generateColorVariants()` oder CSS Custom Properties
