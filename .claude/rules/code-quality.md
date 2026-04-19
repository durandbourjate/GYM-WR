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

## Defensive Normalizer für Backend-Daten (S118)

**Problem:** Wenn das Backend (Apps Script / Sheets) Felder inkonsistent liefert — optional, umbenannt, für SuS gefiltert — crashen Korrektur-/Render-Pfade mit unklaren `TypeError: Cannot read properties of undefined`-Fehlern. Im Event-Handler werden diese Exceptions oft silent geswallowed, die UI wirkt "tut nichts".

**Regel:** Daten aus externen Quellen (Apps Script, Sheets, Pools) werden am Eintrittspunkt durch einen Normalizer geschickt, nicht im UI-Code verzweigt.

**Muster (`ExamLab/src/utils/ueben/fragetypNormalizer.ts::normalisiereLueckentext`):**
```ts
// Akzeptiert unterschiedliche Feldnamen, stellt Array-Typ sicher
function normalisiereLueckentext(frage: any): LueckentextFrage {
  const luecken = (frage.luecken ?? []).map((l: any) => ({
    ...l,
    korrekteAntworten: Array.isArray(l.korrekteAntworten)
      ? l.korrekteAntworten
      : l.korrekt
        ? [l.korrekt]
        : Array.isArray(l.alternativen) ? l.alternativen : [],
  }))
  return { ...frage, luecken }
}
```

**Komplementär:** In Pfaden die trotzdem gegen unvollständige Daten laufen können (z.B. `korrektur.ts`), defensive Array-Checks (`Array.isArray(x) && x.some(...)`) statt direkter Methodenaufrufe.

## Backend-Bereinigung von Strings vs. Objekten (S122)

**Problem:** Beim Bereinigen einer Pool-Frage darf `Object.assign({}, item)` NICHT auf String-Items angewendet werden — `Object.assign({}, "foo")` erzeugt `{0:'f',1:'o',2:'o'}` (Char-Objekt). Im Frontend wird das dann als `[object Object]` gerendert.

**Konkret aufgetreten:** `bereinigeFrageFuerSuSUeben_` in `apps-script-code.js` für DragDrop-Bild-Labels — `frage.labels[]` ist je nach Pool string[] oder {id, text, zoneId}[].

**Regel:** Bei `.map(Object.assign)` über heterogene Arrays IMMER `typeof item !== 'object'`-Guard einbauen:
```js
f.labels = f.labels.map(function(l) {
  if (typeof l !== 'object' || l === null) return l; // String oder primitiv: durchreichen
  var c = Object.assign({}, l);
  delete c.zoneId;
  return c;
});
```

## Apps-Script-Latenz ist Plattform-Limit (S122)

Jeder Apps-Script-Web-App-Call dauert **mindestens ~1.5-2s** (HTTPS-Handshake + V8-Container-Init + Spreadsheet-Auth). Das gilt auch für triviale Endpoints, unabhängig von der Funktion.

**Optimierungs-Patterns:**
- `CacheService.putAll()` für Batch-Caching beim Initial-Load (spart Sheet-Reads, NICHT Roundtrip)
- `fachbereich`-Hint mitsenden um Sheet-Lookups zu reduzieren
- `scheduleSyncFlush` debouncen (5s) um Klick-Frequency-Spam zu vermeiden
- Spinner-Text „Korrektur lädt …" damit User die Latenz versteht

**Echte instant-UX nur durch:** Backend-Migration auf Edge-Runtime (Cloud Run / Vercel / Cloudflare Workers). Im Apps-Script-System ist <1s pro Call faktisch nicht erreichbar.

**Bei neuen Latenz-sensitiven Features:** entweder Server-Roundtrip akzeptieren ODER Architektur-Refactor mit Pre-Loading + Client-Verifikation (Hash-Approach hat Sicherheits-Probleme bei kleinen Antworträumen wie R/F).
