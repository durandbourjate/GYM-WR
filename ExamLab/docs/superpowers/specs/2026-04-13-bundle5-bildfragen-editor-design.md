# Bundle 5: Bildfragen-Editor — Design Spec

> 2 Tasks: N7 (violette Pins/Zonen) + N19 (Bild-Persistenz bei Fragetyp-Wechsel)
> N6 (doppeltes Bild) wurde bereits in einer früheren Session gelöst.

---

## N7 — Violette Pins/Zonen im Bild-Editor

### Problem

Die drei Bild-Editoren (HotspotEditor, BildbeschriftungEditor, DragDropBildEditor) verwenden korrekte Tailwind-Klassen (`bg-violet-500`, `border-violet-500`, `bg-violet-500/20` etc.), aber die Farben erscheinen nicht im Browser. Stattdessen werden die Elemente in schwarz/weiss dargestellt.

### Root Cause

Tailwind CSS v4 mit dem `@tailwindcss/vite` Plugin scannt automatisch das Projektverzeichnis (`ExamLab/src/`). Die Bild-Editoren liegen jedoch in `packages/shared/src/editor/typen/` — ausserhalb des Scan-Bereichs. Die `violet`-Klassen werden deshalb nie ins generierte CSS aufgenommen.

Der Vite-Alias `@shared` löst die Imports zur Buildzeit korrekt auf, aber der Tailwind Content-Scanner kennt diesen Alias nicht.

### Lösung

Eine `@source`-Direktive in `ExamLab/src/index.css` hinzufügen, direkt nach Zeile 1 (`@import "tailwindcss";`):

```css
@import "tailwindcss";
@source "../../packages/shared/src";
```

Dies teilt Tailwind v4 mit, auch Dateien in `packages/shared/src/` nach Klassen zu scannen. Die bestehenden Klassen in den Editoren werden dann korrekt ins CSS generiert.

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `ExamLab/src/index.css` | `@source`-Direktive hinzufügen |

### Keine Code-Änderungen nötig an

- `packages/shared/src/editor/typen/HotspotEditor.tsx` — Klassen korrekt (Z.77: `bg-violet-500`, Z.87: `border-violet-500 bg-violet-500/20`)
- `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` — Klassen korrekt (Z.64: `bg-violet-500 text-white`)
- `packages/shared/src/editor/typen/DragDropBildEditor.tsx` — Klassen korrekt (Z.98: `bg-violet-500/20 border-violet-500`, Z.107: `text-violet-800`)

---

## N19 — Bild-Persistenz bei Fragetyp-Wechsel

### Problem

Wenn im Frageneditor ein Bild hochgeladen wird und dann auf einen anderen Bild-Fragetyp gewechselt wird (z.B. Hotspot → Bildbeschriftung), geht das Bild verloren. Der User muss das gleiche Bild erneut hochladen.

### Root Cause

In `SharedFragenEditor.tsx` (Z.398–424) hat jeder Bild-Fragetyp einen eigenen `useState` für die Bild-URL:

```ts
const [hsBildUrl, setHsBildUrl] = useState(
  frage?.typ === 'hotspot' ? (frage as HotspotFrage).bildUrl : ''
)
const [bbBildUrl, setBbBildUrl] = useState(
  frage?.typ === 'bildbeschriftung' ? (frage as BildbeschriftungFrage).bildUrl : ''
)
const [ddBildUrl, setDdBildUrl] = useState(
  frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).bildUrl : ''
)
```

Beim Fragetyp-Wechsel wird der neue State leer initialisiert, weil `frage?.typ` nicht dem neuen Typ entspricht.

### Lösung

Die drei separaten `bildUrl`-States durch einen gemeinsamen State ersetzen:

```ts
const BILD_FRAGETYPEN = ['hotspot', 'bildbeschriftung', 'dragdrop_bild'] as const
type BildFragetyp = typeof BILD_FRAGETYPEN[number]

const [bildUrl, setBildUrl] = useState(() => {
  if (frage && BILD_FRAGETYPEN.includes(frage.typ as BildFragetyp)) {
    return (frage as { bildUrl?: string }).bildUrl ?? ''
  }
  return ''
})
```

**Verhalten:**
- Bestehende Frage mit Bild: `bildUrl` wird aus der Frage gelesen (egal welcher Bild-Fragetyp)
- Neue Frage: `bildUrl` startet leer
- Fragetyp-Wechsel (z.B. Hotspot → Bildbeschriftung): `bildUrl` bleibt erhalten
- Wechsel zu Nicht-Bild-Typ (z.B. Hotspot → Freitext): `bildUrl` bleibt im State, wird aber nicht angezeigt/gespeichert
- Zurückwechsel zu Bild-Typ: `bildUrl` ist noch da

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `packages/shared/src/editor/SharedFragenEditor.tsx` | 3 separate `bildUrl`-States → 1 gemeinsamer State. `onSpeichern()` verwendet `bildUrl` für alle 3 Bild-Typen. |
| `packages/shared/src/editor/sections/TypEditorDispatcher.tsx` | Props-Interface: `hsBildUrl/bbBildUrl/ddBildUrl` → `bildUrl/setBildUrl`. Übergabe an alle 3 Editoren vereinheitlicht. |

### Props-Änderung TypEditorDispatcher

**Vorher:**
```ts
hsBildUrl: string
setHsBildUrl: (v: string) => void
bbBildUrl: string
setBbBildUrl: (v: string) => void
ddBildUrl: string
setDdBildUrl: (v: string) => void
```

**Nachher:**
```ts
bildUrl: string
setBildUrl: (v: string) => void
```

Alle drei Editoren (HotspotEditor, BildbeschriftungEditor, DragDropBildEditor) erhalten `bildUrl={props.bildUrl}` und `setBildUrl={props.setBildUrl}`.

### onSpeichern() Anpassung

```ts
case 'hotspot':
  typDaten = { typ: 'hotspot', fragetext, bildUrl, bereiche: hsBereiche, ... }; break
case 'bildbeschriftung':
  typDaten = { typ: 'bildbeschriftung', fragetext, bildUrl, beschriftungen: bbBeschriftungen }; break
case 'dragdrop_bild':
  typDaten = { typ: 'dragdrop_bild', fragetext, bildUrl, zielzonen: ddZielzonen, labels: ddLabels }; break
```

---

## Zusammenfassung

| Task | Dateien | Umfang |
|------|---------|--------|
| N7 | `index.css` | 1 Zeile hinzufügen |
| N19 | `SharedFragenEditor.tsx`, `TypEditorDispatcher.tsx` | ~30 Zeilen ändern (3 States → 1, Props vereinfachen) |

## Risiken

- **N7:** Gering. `@source` erweitert nur den Scan-Bereich. Könnte theoretisch Klassen-Konflikte erzeugen falls `packages/shared/` Klassen enthält die mit bestehenden kollidieren — unwahrscheinlich.
- **N19:** Gering. Die typ-spezifischen Daten (Bereiche, Beschriftungen, Zielzonen) bleiben in separaten States. Nur `bildUrl` wird geteilt. Bei `onSpeichern()` wird `bildUrl` nur für Bild-Fragetypen in die Daten geschrieben.

## Tests

- `npx tsc -b` — TypeScript-Kompatibilität
- `npx vitest run` — Bestehende Tests (226+)
- `npm run build` — Build-Erfolg
- Browser-Test: Hotspot-Editor öffnen → Pins/Zonen müssen violett sein
- Browser-Test: Bild hochladen → Fragetyp wechseln (z.B. Hotspot → Bildbeschriftung) → Bild muss erhalten bleiben
- Browser-Test: Neue Frage erstellen → Bild-Feld muss leer sein
