# Bundle 5: Bildfragen-Editor — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Violette Pins/Zonen in Bild-Editoren sichtbar machen (Tailwind-Fix) und Bild-Persistenz bei Fragetyp-Wechsel ermöglichen.

**Architecture:** N7 ist ein einzeiliger CSS-Fix (`@source`-Direktive für Tailwind v4). N19 konsolidiert drei separate `bildUrl`-States zu einem gemeinsamen State in `SharedFragenEditor.tsx` und vereinfacht die Props in `TypEditorDispatcher.tsx`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite

**Spec:** `docs/superpowers/specs/2026-04-13-bundle5-bildfragen-editor-design.md`

---

## File Map

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `ExamLab/src/index.css` | Modify (Z.1) | `@source`-Direktive für shared package |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | Modify (Z.397–424, Z.635–642, Z.836–842) | 3 bildUrl-States → 1, onSpeichern anpassen, Props anpassen |
| `packages/shared/src/editor/sections/TypEditorDispatcher.tsx` | Modify (Z.166–190, Z.747–775) | Props-Interface und Editor-Übergabe vereinfachen |

---

## Task 1: N7 — Tailwind @source Direktive

**Files:**
- Modify: `ExamLab/src/index.css:1`

- [ ] **Step 1: Add @source directive**

In `ExamLab/src/index.css`, nach Zeile 1 (`@import "tailwindcss";`) einfügen:

```css
@source "../../packages/shared/src";
```

- [ ] **Step 2: Verify build**

```bash
cd ExamLab && npm run build
```

Expected: Build erfolgreich. Keine Fehler.

- [ ] **Step 3: Verify violet classes in CSS output**

```bash
cd ExamLab && npx vite build 2>&1 | head -5
grep -r "violet" dist/assets/*.css | head -3
```

Expected: `violet`-bezogene CSS-Regeln im Build-Output vorhanden.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/index.css
git commit -m "N7: @source Direktive für shared package (Tailwind violet-Klassen)"
```

---

## Task 2: N19 — Gemeinsamer bildUrl-State

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx:397-424, 635-642, 836-842`
- Modify: `packages/shared/src/editor/sections/TypEditorDispatcher.tsx:166-190, 747-775`

### Step-Gruppe A: SharedFragenEditor — State konsolidieren

- [ ] **Step 5: Replace 3 bildUrl states with 1 shared state**

In `packages/shared/src/editor/SharedFragenEditor.tsx`, ersetze die drei separaten States (Z.397–424):

**Vorher (Z.397–424):**
```ts
  // Hotspot-spezifisch
  const [hsBildUrl, setHsBildUrl] = useState(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).bildUrl : ''
  )
  const [hsBereiche, setHsBereiche] = useState<HotspotBereich[]>(
    ...
  )
  const [hsMehrfachauswahl, setHsMehrfachauswahl] = useState(
    ...
  )

  // Bildbeschriftung-spezifisch
  const [bbBildUrl, setBbBildUrl] = useState(
    frage?.typ === 'bildbeschriftung' ? (frage as BildbeschriftungFrage).bildUrl : ''
  )
  ...

  // DragDrop-Bild-spezifisch
  const [ddBildUrl, setDdBildUrl] = useState(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).bildUrl : ''
  )
```

**Nachher:** Ersetze die drei `*BildUrl`-States durch einen gemeinsamen State. Platziere ihn VOR dem Hotspot-Block:

```ts
  // Gemeinsamer Bild-State für alle Bild-Fragetypen (Hotspot, Bildbeschriftung, DragDrop-Bild)
  const BILD_FRAGETYPEN = ['hotspot', 'bildbeschriftung', 'dragdrop_bild'] as const
  const [bildUrl, setBildUrl] = useState(() => {
    if (frage && (BILD_FRAGETYPEN as readonly string[]).includes(frage.typ)) {
      return (frage as { bildUrl?: string }).bildUrl ?? ''
    }
    return ''
  })

  // Hotspot-spezifisch
  const [hsBereiche, setHsBereiche] = useState<HotspotBereich[]>(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).bereiche ?? [] : []
  )
  const [hsMehrfachauswahl, setHsMehrfachauswahl] = useState(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).mehrfachauswahl : false
  )

  // Bildbeschriftung-spezifisch
  const [bbBeschriftungen, setBbBeschriftungen] = useState<BildbeschriftungLabel[]>(
    frage?.typ === 'bildbeschriftung' ? (frage as BildbeschriftungFrage).beschriftungen ?? [] : []
  )

  // Audio-spezifisch
  const [audioMaxDauer, setAudioMaxDauer] = useState<number | undefined>(
    frage?.typ === 'audio' ? (frage as AudioFrage).maxDauerSekunden : undefined
  )

  // DragDrop-Bild-spezifisch
  const [ddZielzonen, setDdZielzonen] = useState<DragDropBildZielzone[]>(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).zielzonen ?? [] : []
  )
  const [ddLabels, setDdLabels] = useState<string[]>(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).labels ?? [] : []
  )
```

Wichtig: Die `hsBildUrl`, `bbBildUrl`, `ddBildUrl` States werden komplett entfernt. Die anderen typ-spezifischen States (hsBereiche, bbBeschriftungen, ddZielzonen etc.) bleiben unverändert.

- [ ] **Step 6: Update onSpeichern() to use shared bildUrl**

In `SharedFragenEditor.tsx`, in der `onSpeichern()`-Funktion (Z.635–642):

**Vorher:**
```ts
      case 'hotspot':
        typDaten = { typ: 'hotspot', fragetext, bildUrl: hsBildUrl, bereiche: hsBereiche, mehrfachauswahl: hsMehrfachauswahl }; break
      case 'bildbeschriftung':
        typDaten = { typ: 'bildbeschriftung', fragetext, bildUrl: bbBildUrl, beschriftungen: bbBeschriftungen }; break
      ...
      case 'dragdrop_bild':
        typDaten = { typ: 'dragdrop_bild', fragetext, bildUrl: ddBildUrl, zielzonen: ddZielzonen, labels: ddLabels }; break
```

**Nachher:**
```ts
      case 'hotspot':
        typDaten = { typ: 'hotspot', fragetext, bildUrl, bereiche: hsBereiche, mehrfachauswahl: hsMehrfachauswahl }; break
      case 'bildbeschriftung':
        typDaten = { typ: 'bildbeschriftung', fragetext, bildUrl, beschriftungen: bbBeschriftungen }; break
      ...
      case 'dragdrop_bild':
        typDaten = { typ: 'dragdrop_bild', fragetext, bildUrl, zielzonen: ddZielzonen, labels: ddLabels }; break
```

- [ ] **Step 7: Update TypEditorDispatcher props in SharedFragenEditor**

In `SharedFragenEditor.tsx`, bei der JSX-Übergabe an TypEditorDispatcher (Z.836–842):

**Vorher:**
```tsx
            hsBildUrl={hsBildUrl} setHsBildUrl={setHsBildUrl}
            hsBereiche={hsBereiche} setHsBereiche={setHsBereiche}
            hsMehrfachauswahl={hsMehrfachauswahl} setHsMehrfachauswahl={setHsMehrfachauswahl}
            bbBildUrl={bbBildUrl} setBbBildUrl={setBbBildUrl}
            bbBeschriftungen={bbBeschriftungen} setBbBeschriftungen={setBbBeschriftungen}
            ...
            ddBildUrl={ddBildUrl} setDdBildUrl={setDdBildUrl}
            ddZielzonen={ddZielzonen} setDdZielzonen={setDdZielzonen}
            ddLabels={ddLabels} setDdLabels={setDdLabels}
```

**Nachher:**
```tsx
            bildUrl={bildUrl} setBildUrl={setBildUrl}
            hsBereiche={hsBereiche} setHsBereiche={setHsBereiche}
            hsMehrfachauswahl={hsMehrfachauswahl} setHsMehrfachauswahl={setHsMehrfachauswahl}
            bbBeschriftungen={bbBeschriftungen} setBbBeschriftungen={setBbBeschriftungen}
            ...
            ddZielzonen={ddZielzonen} setDdZielzonen={setDdZielzonen}
            ddLabels={ddLabels} setDdLabels={setDdLabels}
```

### Step-Gruppe B: TypEditorDispatcher — Props anpassen

- [ ] **Step 8: Update TypEditorDispatcher props interface**

In `packages/shared/src/editor/sections/TypEditorDispatcher.tsx`, Props-Interface (Z.166–190):

**Vorher:**
```ts
  // Hotspot
  hsBildUrl: string
  setHsBildUrl: (v: string) => void
  hsBereiche: HotspotBereich[]
  ...

  // Bildbeschriftung
  bbBildUrl: string
  setBbBildUrl: (v: string) => void
  bbBeschriftungen: BildbeschriftungLabel[]
  ...

  // DragDrop Bild
  ddBildUrl: string
  setDdBildUrl: (v: string) => void
  ddZielzonen: DragDropBildZielzone[]
  ...
```

**Nachher:**
```ts
  // Gemeinsam: Bild-URL für alle Bild-Fragetypen
  bildUrl: string
  setBildUrl: (v: string) => void

  // Hotspot
  hsBereiche: HotspotBereich[]
  setHsBereiche: React.Dispatch<React.SetStateAction<HotspotBereich[]>>
  hsMehrfachauswahl: boolean
  setHsMehrfachauswahl: (v: boolean) => void

  // Bildbeschriftung
  bbBeschriftungen: BildbeschriftungLabel[]
  setBbBeschriftungen: React.Dispatch<React.SetStateAction<BildbeschriftungLabel[]>>

  // Audio
  audioMaxDauer: number | undefined
  setAudioMaxDauer: (v: number | undefined) => void

  // DragDrop Bild
  ddZielzonen: DragDropBildZielzone[]
  setDdZielzonen: React.Dispatch<React.SetStateAction<DragDropBildZielzone[]>>
  ddLabels: string[]
  setDdLabels: React.Dispatch<React.SetStateAction<string[]>>
```

- [ ] **Step 9: Update editor prop passing in TypEditorDispatcher**

In `TypEditorDispatcher.tsx`, die Übergabe an die drei Editoren (Z.747–780):

**Vorher:**
```tsx
      {typ === 'hotspot' && (
        <HotspotEditor
          bildUrl={props.hsBildUrl}
          setBildUrl={props.setHsBildUrl}
          ...
        />
      )}

      {typ === 'bildbeschriftung' && (
        <BildbeschriftungEditor
          bildUrl={props.bbBildUrl}
          setBildUrl={props.setBbBildUrl}
          ...
        />
      )}

      ...

      {typ === 'dragdrop_bild' && (
        <DragDropBildEditor
          bildUrl={props.ddBildUrl}
          setBildUrl={props.setDdBildUrl}
          ...
        />
      )}
```

**Nachher:**
```tsx
      {typ === 'hotspot' && (
        <HotspotEditor
          bildUrl={props.bildUrl}
          setBildUrl={props.setBildUrl}
          ...
        />
      )}

      {typ === 'bildbeschriftung' && (
        <BildbeschriftungEditor
          bildUrl={props.bildUrl}
          setBildUrl={props.setBildUrl}
          ...
        />
      )}

      ...

      {typ === 'dragdrop_bild' && (
        <DragDropBildEditor
          bildUrl={props.bildUrl}
          setBildUrl={props.setBildUrl}
          ...
        />
      )}
```

### Step-Gruppe C: Verifikation

- [ ] **Step 10: TypeScript-Check**

```bash
cd ExamLab && npx tsc -b
```

Expected: Keine Fehler. Alle Typ-Referenzen auf `hsBildUrl/bbBildUrl/ddBildUrl` sind eliminiert.

- [ ] **Step 11: Tests**

```bash
cd ExamLab && npx vitest run
```

Expected: 226+ Tests grün.

- [ ] **Step 12: Build**

```bash
cd ExamLab && npm run build
```

Expected: Build erfolgreich.

- [ ] **Step 13: Commit**

```bash
git add packages/shared/src/editor/SharedFragenEditor.tsx packages/shared/src/editor/sections/TypEditorDispatcher.tsx
git commit -m "N19: Gemeinsamer bildUrl-State für alle Bild-Fragetypen"
```

---

## Browser-Test-Plan

Nach Implementierung, im Browser verifizieren:

| # | Test | Erwartetes Verhalten |
|---|------|---------------------|
| 1 | Hotspot-Editor öffnen, Bereiche definieren | Rechtecke violett (`border-violet-500`), Fläche halbtransparent violett |
| 2 | Bildbeschriftung-Editor, Labels setzen | Kreise violett (`bg-violet-500`) mit weisser Zahl |
| 3 | DragDrop-Bild-Editor, Zielzonen definieren | Zonen violett, Labels violett |
| 4 | Bild hochladen als Hotspot → Typ wechseln zu Bildbeschriftung | Bild bleibt erhalten |
| 5 | Bild hochladen als Bildbeschriftung → Typ wechseln zu DragDrop-Bild | Bild bleibt erhalten |
| 6 | Bild hochladen → Typ wechseln zu Freitext → zurück zu Hotspot | Bild bleibt erhalten |
| 7 | Neue Frage erstellen (kein vorheriges Bild) | Bild-Feld ist leer |
| 8 | Gespeicherte Hotspot-Frage öffnen | Bild wird korrekt geladen |
| 9 | Light + Dark Mode prüfen | Violett in beiden Modi sichtbar |
