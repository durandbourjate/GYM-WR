# iPad-Test Bugfixes — Session 36 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all issues from 30.03.2026 iPad test session — Korrektur-Regression, iPad touch-compatibility, and UX improvements.

**Architecture:** 3 Stränge (Korrektur A, iPad-Touch B, UX C). Strang A fixes the LP correction view to show full question context + all question types. Strang B adds touch support for drag-drop and fixes iPad-specific keyboard/rendering issues. Strang C handles status tracking, keyboard modes, and smaller UX fixes.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + KaTeX + CodeMirror 6 + Tiptap

**KRITISCH:** Vor Code-Änderungen IMMER im Browser (Chrome-in-Chrome) verifizieren. Nicht raten!

---

## Strang A: Korrektur-Regression — LP sieht vollen Fragekontext

### Problem-Zusammenfassung

`KorrekturFrageVollansicht.tsx` (LP per-SuS-Ansicht) zeigt:
- Nur den Fragetext, KEINE Anhänge (Bilder, PDFs)
- KEINE Rendering-Cases für: `formel`, `visualisierung`, `pdf`, `audio`, `code`, `sortierung`, `hotspot`, `bildbeschriftung`, `dragdrop_bild`
- `KorrekturFragenAnsicht.tsx` (per-Frage-Ansicht) zeigt nur Text-Zusammenfassungen (`[Zeichnung]`, `[LaTeX]...`)
- Auto-Korrektur-Punkte werden nicht automatisch als LP-Punkte übernommen
- Lückentext zeigt keine Musterlösung (fehlt in MusterloesungBox)

### Task A1: Anhänge + Materialien in KorrekturFrageVollansicht anzeigen

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Im Browser (Chrome-in-Chrome) die LP-Korrektur-Ansicht für einen SuS öffnen und verifizieren, dass Bilder/PDFs fehlen.

- [ ] **Step 2:** In `KorrekturFrageVollansicht.tsx` nach dem Fragetext (Zeile ~442) Anhänge rendern:

```tsx
// Nach <p className="text-sm ...">{text}</p>

{/* Anhänge (Bilder, PDFs) */}
{frage.anhaenge && frage.anhaenge.length > 0 && (
  <div className="space-y-2 my-2">
    {frage.anhaenge.map((a) => (
      <MediaAnhang key={a.id} anhang={a} />
    ))}
  </div>
)}
```

Import `MediaAnhang` oben: `import MediaAnhang from '../../MediaAnhang.tsx'`

- [ ] **Step 3:** Im Browser verifizieren, dass Bilder/PDFs jetzt angezeigt werden.

- [ ] **Step 4:** `npx tsc -b` ausführen.

### Task A2: Formel-Antwort rendern (KaTeX)

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Neue Komponente `FormelAnzeige` in KorrekturFrageVollansicht.tsx:

```tsx
/** Formel-Antwort (LaTeX-Rendering via KaTeX) */
function FormelAnzeige({ antwort }: { antwort: { typ: 'formel'; latex: string } | undefined }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (!antwort?.latex) return
    import('katex').then((katex) => {
      try {
        setHtml(katex.default.renderToString(antwort.latex, { throwOnError: false, displayMode: true }))
      } catch {
        setHtml(`<code>${antwort.latex}</code>`)
      }
    })
  }, [antwort?.latex])

  if (!antwort?.latex) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">Eingegebene Formel:</span>
      {html ? (
        <div className="mt-1" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code className="text-sm text-slate-700 dark:text-slate-200 block mt-1">{antwort.latex}</code>
      )}
    </div>
  )
}
```

Import `useState, useEffect` falls noch nicht vorhanden.

- [ ] **Step 2:** Case in der Hauptkomponente einfügen (nach `bilanzstruktur`):

```tsx
{frage.typ === 'formel' && (
  <FormelAnzeige antwort={antwort?.typ === 'formel' ? antwort : undefined} />
)}
```

- [ ] **Step 3:** Im Browser verifizieren — Formel soll mit KaTeX gerendert werden.

- [ ] **Step 4:** `npx tsc -b` ausführen.

### Task A3: Zeichnen/Visualisierung-Antwort rendern

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Neue Komponente `VisualisierungAnzeige`:

```tsx
/** Zeichnung anzeigen (PNG aus Canvas-Export) */
function VisualisierungAnzeige({ antwort }: { antwort: { typ: 'visualisierung'; bildDaten?: string; zeichenDaten?: string } | undefined }) {
  if (!antwort) return <KeineAntwort />

  // bildDaten ist der PNG-Export (base64 data URL)
  if (antwort.bildDaten) {
    return (
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
        <img src={antwort.bildDaten} alt="SuS-Zeichnung" className="max-w-full border border-slate-200 dark:border-slate-600 rounded" />
      </div>
    )
  }

  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-sm italic text-slate-400">[Zeichnung ohne Bilddaten]</span>
    </div>
  )
}
```

- [ ] **Step 2:** Case einfügen:

```tsx
{frage.typ === 'visualisierung' && (
  <VisualisierungAnzeige antwort={antwort?.typ === 'visualisierung' ? antwort : undefined} />
)}
```

- [ ] **Step 3:** Im Browser verifizieren.

### Task A4: PDF-Annotation-Antwort rendern

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Prüfen, ob `ZeichnenKorrektur` oder `PDFKorrektur` Komponenten existieren, die wiederverwendet werden können. Falls nicht, Minimalansicht:

```tsx
/** PDF-Annotation anzeigen (Platzhalter — zeigt Annotationsanzahl) */
function PDFAnnotationAnzeige({ antwort }: { antwort: { typ: 'pdf'; annotationen?: unknown[] } | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-sm text-slate-700 dark:text-slate-200">
        PDF-Annotation: {antwort.annotationen?.length ?? 0} Markierungen
      </span>
      <span className="text-xs text-slate-400 block mt-1">(Vollansicht in SuS-Detailkorrektur)</span>
    </div>
  )
}
```

- [ ] **Step 2:** Case einfügen.

- [ ] **Step 3:** Im Browser verifizieren.

### Task A5: Code-Antwort rendern

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Neue Komponente:

```tsx
/** Code-Antwort mit Syntax-Highlighting (minimal) */
function CodeAnzeige({ antwort }: { antwort: { typ: 'code'; code?: string; sprache?: string } | undefined }) {
  if (!antwort?.code) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 mt-2 overflow-x-auto">
      <pre className="text-sm text-slate-700 dark:text-slate-200 px-3 py-2 font-mono whitespace-pre-wrap">{antwort.code}</pre>
    </div>
  )
}
```

- [ ] **Step 2:** Case einfügen.

### Task A6: Audio-Antwort rendern

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Neue Komponente:

```tsx
/** Audio-Antwort abspielen */
function AudioAnzeige({ antwort }: { antwort: { typ: 'audio'; audioDaten?: string; driveFileId?: string } | undefined }) {
  if (!antwort) return <KeineAntwort />
  const src = antwort.audioDaten || (antwort.driveFileId ? driveStreamUrl(antwort.driveFileId) : '')
  if (!src) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <AudioPlayer src={src} />
    </div>
  )
}
```

Import `AudioPlayer` und `driveStreamUrl`.

- [ ] **Step 2:** Case einfügen.

### Task A7: Sortierung, Hotspot, Bildbeschriftung, DragDrop — Text-Anzeigen

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Fallback-Anzeigen für verbleibende Typen:

```tsx
{frage.typ === 'sortierung' && antwort?.typ === 'sortierung' && (
  <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
    {antwort.reihenfolge.map((item, i) => (
      <div key={i} className="text-sm text-slate-700 dark:text-slate-200">
        {i + 1}. {item}
      </div>
    ))}
  </div>
)}

{frage.typ === 'hotspot' && antwort?.typ === 'hotspot' && (
  <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
    <span className="text-sm text-slate-700 dark:text-slate-200">
      Markierte Bereiche: {antwort.markierungen?.length ?? 0}
    </span>
  </div>
)}

{frage.typ === 'bildbeschriftung' && antwort?.typ === 'bildbeschriftung' && (
  <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
    {Object.entries(antwort.beschriftungen ?? {}).map(([key, val]) => (
      <div key={key} className="text-sm text-slate-700 dark:text-slate-200">
        {key}: {val as string}
      </div>
    ))}
  </div>
)}

{frage.typ === 'dragdrop_bild' && antwort?.typ === 'dragdrop_bild' && (
  <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
    {Object.entries(antwort.zuordnungen ?? {}).map(([zone, label]) => (
      <div key={zone} className="text-sm text-slate-700 dark:text-slate-200">
        {zone} → {label as string}
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2:** Im Browser verifizieren.

- [ ] **Step 3:** `npx tsc -b` ausführen.

### Task A8: Lückentext Musterlösung in MusterloesungBox

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** In `MusterloesungBox`, vor dem allgemeinen `frage.musterlosung`-Block, Lückentext-Case einfügen:

```tsx
// Lückentext: Korrekte Antworten anzeigen
if (frage.typ === 'lueckentext') {
  const lf = frage as LueckentextFrage
  if (lf.luecken?.some(l => l.korrekteAntworten?.length > 0)) {
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        {lf.luecken.map((l, i) => (
          <div key={l.id} className="text-sm mt-1 text-amber-800 dark:text-amber-200">
            <span className="text-xs text-amber-600 dark:text-amber-400">Lücke {i + 1}: </span>
            {l.korrekteAntworten?.join(' / ') || '–'}
          </div>
        ))}
      </div>
    )
  }
}
```

- [ ] **Step 2:** Im Browser verifizieren.

### Task A9: Lückentext — vollständigen Aufgabentext mit Lücken anzeigen

**Files:**
- Modify: `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx`

- [ ] **Step 1:** Die `LueckentextAnzeige` erweitern, um den Aufgabentext (mit eingesetzten SuS-Antworten) anzuzeigen, nicht nur "Lücke 1: xyz":

Prüfen wie `frage.textMitLuecken` oder `frage.fragetext` strukturiert ist. Falls der Fragetext Platzhalter enthält (z.B. `{luecke1}`), diese mit den SuS-Antworten ersetzen. Falls nicht, Fragetext + Lücken-Liste belassen.

- [ ] **Step 2:** Im Browser verifizieren, dass der Aufgabentext jetzt sichtbar ist.

### Task A10: Browser-Verifikation Strang A komplett

- [ ] **Step 1:** Im Browser als LP einloggen, SuS-Korrektur öffnen.
- [ ] **Step 2:** Für jede Frage prüfen: Fragetext ✓, Anhänge/Bilder ✓, SuS-Antwort gerendert ✓, Punkte ✓, Musterlösung ✓.
- [ ] **Step 3:** `npx tsc -b` und Tests laufen lassen.
- [ ] **Step 4:** Commit.

---

## Strang B: iPad Touch-Kompatibilität

### Task B1: Sticky Header auf iPad fixen

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1:** Im Browser (iPad-Simulation) verifizieren, dass der Header nicht sticky ist. Eltern-Container prüfen auf `overflow` Konflikte.

- [ ] **Step 2:** Mögliche Fixes:
  - `position: sticky` funktioniert nicht, wenn ein Eltern-Container `overflow: hidden` hat
  - Falls `overflow-hidden` auf dem Eltern-Container der Grund ist, auf `overflow-clip` wechseln (CSS `clip` behält sticky, `hidden` nicht)
  - Alternativ: Header aus dem scrollbaren Container herausnehmen (z.B. in die `flex-col` Ebene darüber)

- [ ] **Step 3:** Im Browser verifizieren: Header bleibt oben beim Scrollen, Fragen scrollen darunter.

### Task B2: Touch-DnD für SortierungFrage

**Files:**
- Modify: `src/components/fragetypen/SortierungFrage.tsx`

- [ ] **Step 1:** Custom Touch-DnD implementieren, da HTML5 DnD auf iOS nicht funktioniert:

```tsx
// Touch-Event-Handler
const handleTouchStart = (e: React.TouchEvent, index: number) => {
  if (abgegeben) return
  setDragIndex(index)
  // Visuelles Feedback
}

const handleTouchMove = (e: React.TouchEvent) => {
  if (dragIndex === null) return
  e.preventDefault() // Scroll verhindern
  const touch = e.touches[0]
  const element = document.elementFromPoint(touch.clientX, touch.clientY)
  // dragOverIndex aus Element-Position berechnen
}

const handleTouchEnd = () => {
  if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
    // Swap-Logik (gleich wie bei onDrop)
  }
  setDragIndex(null)
  setDragOverIndex(null)
}
```

Zusätzlich `onTouchStart`, `onTouchMove`, `onTouchEnd` auf die Items binden.

- [ ] **Step 2:** Im Browser (Touch-Simulation) verifizieren.

- [ ] **Step 3:** `npx tsc -b` ausführen.

### Task B3: Touch-DnD für DragDropBildFrage

**Files:**
- Modify: `src/components/fragetypen/DragDropBildFrage.tsx`

- [ ] **Step 1:** Gleiches Pattern wie B2 — Touch-Events für Labels auf Zonen ziehen.

- [ ] **Step 2:** Alternativ: Tap-to-select + Tap-to-place Mechanismus (mobil-freundlicher):
  - Tap auf Label → Label wird "ausgewählt" (hervorgehoben)
  - Tap auf Zone → Label wird platziert
  - Das funktioniert zuverlässig auf allen Touch-Geräten

- [ ] **Step 3:** Im Browser verifizieren.

### Task B4: Freitext Auto-Focus + Grosse Tastatur

**Files:**
- Modify: `src/components/fragetypen/FreitextFrage.tsx`

- [ ] **Step 1:** Prüfen, ob `editor.commands.focus('end')` auf iPad tatsächlich die Tastatur öffnet. iOS erlaubt Keyboard-Öffnung nur durch direkte User-Interaktion, nicht per `setTimeout`.

- [ ] **Step 2:** Statt automatischem Focus bei Seitenwechsel: Grossen "Tippen zum Schreiben"-Button anzeigen, der bei Tap den Editor fokussiert. So wird die Tastatur durch eine echte User-Geste geöffnet.

```tsx
{!isFocused && !abgegeben && (
  <button
    onClick={() => editor?.commands.focus('end')}
    className="w-full py-3 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg"
  >
    Tippen zum Schreiben...
  </button>
)}
```

- [ ] **Step 3:** `enterkeyhint="done"` auf den Editor setzen (für Return-Taste Beschriftung).

### Task B5: Code-Frage Tastatur auf iPad

**Files:**
- Modify: `src/components/fragetypen/CodeFrageComponent.tsx`

- [ ] **Step 1:** Gleicher Ansatz wie B4 — "Tippen zum Schreiben"-Button für initiale Fokussierung.

- [ ] **Step 2:** CodeMirror mobile-Konfiguration prüfen: `EditorView.contentAttributes.of({ enterkeyhint: 'enter' })`.

### Task B6: Zeichnen — Performance + Selection Fix

**Files:**
- Modify: `src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx`
- Modify: `src/components/fragetypen/zeichnen/useDrawingEngine.ts`

- [ ] **Step 1:** Im Browser das Zeichnen-Tool auf iPad-Simulation testen. Verifizieren:
  - Schreibgeschwindigkeit (jeden Buchstaben)
  - Selection-Dauer (bleibt es angewählt?)

- [ ] **Step 2:** Performance: Canvas-Redraw optimieren — nur geänderte Bereiche neu zeichnen statt ganzes Canvas bei jedem Strich.

- [ ] **Step 3:** Selection-Bug: Prüfen ob `pointercancel` auf iPad fälschlicherweise die Selektion aufhebt. `pointercancel` Event ignorieren wenn gerade selektiert.

- [ ] **Step 4:** Text-Tool: Sicherstellen, dass das Auswählen eines bestehenden Textfeldes nicht ein neues erstellt. Die Hit-Test-Logik muss zuerst prüfen, ob ein Element getroffen wurde, bevor ein neues erstellt wird.

- [ ] **Step 5:** Im Browser verifizieren.

### Task B7: PDF-Annotation — Standardzoom + Touch-Fixes

**Files:**
- Modify: `src/components/fragetypen/pdf/PDFTypes.ts`
- Modify: `src/components/fragetypen/pdf/PDFFrage.tsx`
- Modify: `src/components/fragetypen/pdf/PDFSeite.tsx`

- [ ] **Step 1:** Zoom-Stufen erweitern:

In `PDFTypes.ts`:
```typescript
export const ZOOM_STUFEN = [0.75, 1, 1.25, 1.5, 2, 3] as const
```
Neue Stufen: 200% und 300%.

- [ ] **Step 2:** Standard-Zoom auf "Seitenbreite" berechnen statt fester Wert:

In `PDFFrage.tsx` (oder wo der initiale Zoom gesetzt wird):
```tsx
// Berechne Zoom so dass PDF-Breite = Container-Breite
const berechnePassendenZoom = (containerBreite: number): ZoomStufe => {
  const pdfBreite = 595 // A4 in PDF-Punkten
  const idealZoom = containerBreite / pdfBreite
  // Nächste verfügbare Stufe finden
  return ZOOM_STUFEN.reduce((prev, curr) =>
    Math.abs(curr - idealZoom) < Math.abs(prev - idealZoom) ? curr : prev
  )
}
```

- [ ] **Step 3:** Touch-Tools reparieren. Das Highlight-Tool darf nicht das PDF verschieben. In `PDFSeite.tsx`:
  - Wenn ein Werkzeug aktiv ist (nicht Auswahl), `touchAction: 'none'` auf der PDF-Seite setzen
  - Pointer-Events für Werkzeuge korrekt abfangen

- [ ] **Step 4:** Text-, Kommentar-, Stifteingabe: Touch-Events verifizieren. Prüfen ob `pointerdown` korrekt registriert wird.

- [ ] **Step 5:** Im Browser verifizieren.

### Task B8: Material-PDFs laden nicht (weisser Screen)

**Files:**
- Modify: `src/components/MaterialPanel.tsx`

- [ ] **Step 1:** Im Browser den Material-PDF-Ladevorgang inspizieren. Console + Network-Tab prüfen.

- [ ] **Step 2:** Mögliche Ursachen:
  - iframe mit Google Drive Preview URL auf iPad blockiert
  - CSP blockiert das Laden (Session 35: CSP hinzugefügt!)
  - CORS-Fehler bei Drive-URLs
  - iframe `sandbox` Attribut zu restriktiv

- [ ] **Step 3:** CSP in `index.html` prüfen — `frame-src` muss `https://drive.google.com` und `https://docs.google.com` erlauben.

- [ ] **Step 4:** Fix implementieren und im Browser verifizieren.

---

## Strang C: UX-Verbesserungen + Status-Bugs

### Task C1: Formel — Mehr Operatoren + Undo + Doppel-Anzeige Fix

**Files:**
- Modify: `src/components/fragetypen/FormelFrageComponent.tsx`

- [ ] **Step 1:** Im Browser die Formel-Frage öffnen und das Doppel-Anzeige-Problem verifizieren.

- [ ] **Step 2:** Operatoren-Toolbar erweitern:
  - Neue Gruppe: Vergleiche (=, <, >, ≤, ≥)
  - Neue Gruppe: Klammern/Brüche (\frac{}{}, \left(\right))
  - Ggf. Umstrukturierung in ein aufklappbares Panel

- [ ] **Step 3:** Rückgängig-Button (Undo) implementieren:
```tsx
const [verlauf, setVerlauf] = useState<string[]>([])
// Bei jeder Eingabe: alten Wert in Verlauf pushen
// Undo: Letzten Wert aus Verlauf holen
```

- [ ] **Step 4:** Doppel-Anzeige-Bug: Prüfen ob zwei `dangerouslySetInnerHTML`-Divs gerendert werden. Vermutlich wird sowohl die Raw-LaTeX als auch die gerenderte Version angezeigt. Nur die gerenderte Version anzeigen, Raw-LaTeX als Fallback.

- [ ] **Step 5:** Im Browser verifizieren.

### Task C2: Audio — Error-Handling + AirPlay

**Files:**
- Modify: `src/components/fragetypen/AudioFrage.tsx`

- [ ] **Step 1:** AirPlay-Button entfernen: `controlsList="nodownload noplaybackrate"` auf `<audio>` Element setzen. Auf iOS: `disableRemotePlayback` Attribut.

```tsx
<audio
  controls
  controlsList="nodownload noplaybackrate"
  disableRemotePlayback
  src={...}
/>
```

- [ ] **Step 2:** Error-Handling für Demo-Modus verbessern: Klare Meldung wenn `getUserMedia` fehlschlägt.

### Task C3: Zahlenfeld-Tastatur für FiBu-Betragsfelder

**Files:**
- Modify: FiBu-Komponenten (Buchungssatz, TKonto, etc.)

- [ ] **Step 1:** Suche alle `<input>` in FiBu-Komponenten die Beträge akzeptieren.

- [ ] **Step 2:** `inputMode="decimal"` hinzufügen (gleich wie BerechnungFrage):

```tsx
<input
  type="text"
  inputMode="decimal"
  // ...
/>
```

- [ ] **Step 3:** Auch für Lückentext-Inputs prüfen ob numerische Lücken existieren.

### Task C4: iPad Dictation deaktivieren

**Files:**
- Recherche nötig

- [ ] **Step 1:** Recherche: Das Diktat-Symbol auf iPad-Tastatur kann NICHT per HTML/JS deaktiviert werden. Es ist ein iOS-System-Feature.

- [ ] **Step 2:** Alternative Massnahmen dokumentieren:
  - SEB (Safe Exam Browser) kann Dictation deaktivieren über Konfiguration
  - MDM-Profile können Dictation systemweit deaktivieren
  - Hinweis in Prüfungskonfiguration für LP: "Dictation muss über SEB/MDM deaktiviert werden"

### Task C5: Status "aktiv" nach Abgabe + "erzwungen" nach LP-Beenden

**Files:**
- Modify: Backend `apps-script-code.js`

- [ ] **Step 1:** Prüfen was passiert wenn SuS abgibt (`speichereAntworten` mit `istAbgabe: true`) und dann LP die Prüfung beendet (`beendePruefung`):
  - Backend muss prüfen: Wenn SuS-Status bereits `abgegeben` → Status nicht auf `beendet-lp` überschreiben
  - LP-Monitoring muss nach Abgabe den Status sofort auf `abgegeben` setzen

- [ ] **Step 2:** In `beendePruefung()` im Backend: Nur SuS mit Status `aktiv` oder `inaktiv` auf `beendet-lp` setzen. Bereits `abgegeben` beibehalten.

- [ ] **Step 3:** Im LP-Monitoring: Heartbeat-Response prüfen — sendet das Backend den korrekten Status nach Abgabe?

### Task C6: SuS lädt Prüfung vor LP-Freigabe

**Files:**
- Modify: `src/components/Startbildschirm.tsx`
- Möglicherweise: `src/store/pruefungStore.ts`

- [ ] **Step 1:** Im Browser verifizieren: SuS öffnet Prüfung bevor LP freigibt → "Wiederherstellung"-Meldung?

- [ ] **Step 2:** Ursache: Wenn aus einer früheren Session (Demo) noch `phase: 'pruefung'` im localStorage liegt, versucht die App die Prüfung wiederherzustellen, obwohl es eine ANDERE Prüfung ist.

- [ ] **Step 3:** Fix: Bei `ladePruefung` die `pruefungId` aus dem Backend mit der gespeicherten vergleichen. Bei Mismatch → localStorage komplett leeren.

```tsx
// In App.tsx oder Startbildschirm.tsx:
if (gespeichertePruefungId && gespeichertePruefungId !== backendPruefungId) {
  usePruefungStore.getState().zuruecksetzen()
  localStorage.removeItem('pruefung-state-...')
}
```

### Task C7: Abschluss — Tests + Build + Commit

- [ ] **Step 1:** `npx vitest run` — Alle Tests grün.
- [ ] **Step 2:** `npx tsc -b` — Keine Fehler.
- [ ] **Step 3:** Git commit + push.
- [ ] **Step 4:** HANDOFF.md aktualisieren mit Session 36 Einträgen.

---

## Zusammenfassung

| Strang | Tasks | Fokus |
|--------|-------|-------|
| A (1-10) | Korrektur-Regression | LP sieht vollen Fragekontext + alle Fragetypen |
| B (1-8) | iPad Touch | Sticky, DnD, Keyboard, Zeichnen, PDF, Material |
| C (1-7) | UX + Status | Formel, Audio, Tastatur, Dictation, Status-Bug |

**Abhängigkeiten:** A und B sind unabhängig. C5/C6 sind Backend-Änderungen (Apps Script muss nach Code-Änderung manuell deployed werden — User muss das tun).

**Reihenfolge:** A → B → C (oder A+B parallel, dann C).
