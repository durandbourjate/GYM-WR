# Session 14 — Bugfixes + UX aus Live-Tests (Runde 3)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 13 Punkte aus Live-Tests fixen: 4 Bugs, 8 UX-Verbesserungen, 1 Entfernung

**Architecture:** Alle Änderungen sind Frontend-only (kein Apps-Script-Update nötig). Grösste Neuerung ist der Frage-für-Frage-Korrekturmodus (U31) als neue Komponente. Rest sind gezielte Einzelfixes.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4

---

## Task 1: B33 — Demo-Prüfung: Nur Warnungen, keine Sperre

**Problem:** `useLockdown.ts` sperrt nach 3 Verstössen unabhängig von `kontrollStufe`. Bei `'keine'` registriert die Hook zwar keine Verstösse über Effects, aber `registriereVerstoss` kann von aussen aufgerufen werden und sperrt trotzdem.

**Files:**
- Modify: `src/hooks/useLockdown.ts:27-45`

- [ ] **Step 1: Guard in registriereVerstoss hinzufügen**

In `useLockdown.ts`, Zeile 28: Nach `if (!aktiv || gesperrt) return` eine weitere Zeile einfügen:

```typescript
const registriereVerstoss = useCallback((typ: Verstoss['typ'], dauer?: number) => {
  if (!aktiv || gesperrt) return
  if (effektiv === 'keine') return  // ← NEU: Demo-Prüfung = nur Warnungen

  const verstoss: Verstoss = { ... }
```

- [ ] **Step 2: Verify** — `npx tsc -b` muss durchlaufen

- [ ] **Step 3: Commit** — `git add src/hooks/useLockdown.ts && git commit -m "B33: Demo-Prüfung keine Sperre bei kontrollStufe 'keine'"`

---

## Task 2: B34 — SuS-Startbildschirm erkennt Freischaltung nicht

**Problem:** `Startbildschirm.tsx` pollt via `ladePruefung` + Heartbeat. Die `ladePruefung`-Response wird auf `config.freigeschaltet` geprüft (Zeile 74). Wenn die LP "Freischalten" klickt, muss der SuS-Polling-Zyklus das erkennen. Debug-Verdacht: entweder gibt `ladePruefung` für SuS vor Freischaltung einen Fehler zurück (SuS hat keinen Zugriff), oder die Response-Struktur stimmt nicht.

**Files:**
- Modify: `src/components/Startbildschirm.tsx:42-80`

- [ ] **Step 1: Heartbeat-Phase für Freischaltung nutzen**

Zusätzlich zum `ladePruefung`-Check: Wenn Heartbeat `phase === 'aktiv'` oder `phase === 'pruefung'` zurückgibt, ist die Prüfung freigeschaltet. Zeile 67-71 erweitern:

```typescript
if (heartbeatResult.status === 'fulfilled' && heartbeatResult.value) {
  setHeartbeatErfolgreich(true)
  const phase = heartbeatResult.value.phase
  if (phase === 'lobby') setLobbyOffen(true)
  // NEU: Wenn Phase aktiv/pruefung → direkt freischalten
  if (phase === 'aktiv' || phase === 'pruefung' || phase === 'live') {
    setIstFreigeschaltet(true)
  }
  if (heartbeatResult.value.sebAusnahme) setHatSebAusnahme(true)
}
```

Dasselbe für den initialen Heartbeat (Zeile 48-52):

```typescript
apiService.heartbeat(config.id, user.email).then((response) => {
  setHeartbeatErfolgreich(true)
  const phase = response.phase
  if (phase === 'lobby') setLobbyOffen(true)
  if (phase === 'aktiv' || phase === 'pruefung' || phase === 'live') {
    setIstFreigeschaltet(true)
  }
  if (response.sebAusnahme) setHatSebAusnahme(true)
}).catch(() => {})
```

- [ ] **Step 2: ladePruefung Fehler abfangen**

Zeile 73-76: Sicherstellen dass ein Fehler bei `ladePruefung` den Polling nicht abbricht. Aktuell via `Promise.allSettled` abgefangen — OK. Aber prüfen ob `pruefungResult.value` die richtige Struktur hat. Log hinzufügen für Debugging:

```typescript
if (pruefungResult.status === 'fulfilled' && pruefungResult.value?.config?.freigeschaltet) {
  setIstFreigeschaltet(true)
}
```

(Optionales Chaining auf `.config` hinzufügen falls Response-Struktur variiert.)

- [ ] **Step 3: Verify** — `npx tsc -b`

- [ ] **Step 4: Commit** — `git add src/components/Startbildschirm.tsx && git commit -m "B34: Freischaltung über Heartbeat-Phase erkennen"`

---

## Task 3: B29 — Material PDF volle Höhe

**Problem:** `MaterialPanel.tsx:264` — iframe hat `min-h-[200px] md:min-h-[300px]` aber kein `h-full`. Der Parent ist `flex flex-col h-full`, aber das iframe nutzt den Platz nicht.

**Files:**
- Modify: `src/components/MaterialPanel.tsx:264` (PDF iframe)
- Modify: `src/components/MaterialPanel.tsx:303` (Link iframe, gleicher Fix)

- [ ] **Step 1: iframe-Klasse anpassen**

Zeile 264, PDF/Datei iframe:
```
alt: className="flex-1 w-full border-0 min-h-[200px] md:min-h-[300px]"
neu: className="flex-1 w-full border-0 min-h-0"
```

`min-h-0` statt `min-h-[200px]` weil `flex-1` den Platz füllt, aber `min-h` das überschreibt. `min-h-0` erlaubt flex-1 korrekt zu schrumpfen/wachsen.

Zeile 303, Link iframe: gleiche Änderung.

- [ ] **Step 2: Parent-Container prüfen**

Der Parent `<div className="h-full flex flex-col">` (Zeile 260) muss tatsächlich `h-full` haben. Prüfen ob der Grossparent ebenfalls Höhe weitergibt. Falls nötig, `h-full` auf den äussersten Container des MaterialPanel sicherstellen.

- [ ] **Step 3: Verify** — `npx tsc -b`

- [ ] **Step 4: Commit** — `git add src/components/MaterialPanel.tsx && git commit -m "B29: Material PDF nutzt volle verfügbare Höhe"`

---

## Task 4: B25 — PDF Text-Annotationen nicht editierbar

**Problem:** Double-Click-Handler existiert (`PDFSeite.tsx:293-327`), funktioniert aber nicht zuverlässig. Vermutung: `data-annotation-id` Attribut fehlt auf gerenderten Text-Annotationen, oder Event-Propagation wird gestoppt.

**Files:**
- Modify: `src/components/fragetypen/pdf/PDFSeite.tsx`

- [ ] **Step 1: Annotation-Rendering prüfen**

In PDFSeite.tsx suchen wo Text-Annotationen gerendert werden (SVG/div mit `data-annotation-id`). Sicherstellen dass jede Text-Annotation ein `data-annotation-id={ann.id}` hat und klickbar ist (kein `pointer-events: none`).

- [ ] **Step 2: Double-Click-Event debuggen**

Falls `data-annotation-id` korrekt gesetzt: Prüfen ob `e.target.closest('[data-annotation-id]')` bei Klick auf den gerenderten Text funktioniert. Problem könnte sein dass der Text in einem `<text>` SVG-Element liegt und `closest` nicht durch SVG/HTML-Grenzen traversiert.

Fix: Falls SVG, `data-annotation-id` direkt auf das `<text>` Element setzen (nicht nur auf den Parent).

- [ ] **Step 3: Verify** — `npx tsc -b`

- [ ] **Step 4: Commit** — `git add src/components/fragetypen/pdf/PDFSeite.tsx && git commit -m "B25: PDF Text-Annotationen editierbar via Doppelklick"`

---

## Task 5: U25 — Markieren in PDF: Standardfarbe Gelb

**Files:**
- Modify: `src/components/fragetypen/pdf/PDFTypes.ts:33-41`

- [ ] **Step 1: Gelb als erstes Element in STANDARD_HIGHLIGHT_FARBEN**

```typescript
export const STANDARD_HIGHLIGHT_FARBEN = [
  '#FEF08A', // Gelb Pastell (Default für Markieren)
  '#FBCFE8', // Rosa Pastell
  '#BAE6FD', // Hellblau Pastell
  '#BBF7D0', // Hellgrün Pastell
  '#000000', // Schwarz
  '#DC2626', // Rot kräftig
  '#2563EB', // Blau kräftig
  '#16A34A', // Grün kräftig
  '#F59E0B', // Orange/Amber
] as const
```

Hinweis: Pastell-Farben zuerst (typische Highlight-Farben), kräftige Farben danach.

- [ ] **Step 2: Stift-Standardfarbe in PDFFrage.tsx anpassen**

`PDFFrage.tsx:88` initialisiert `aktiveFarbe` mit `STANDARD_HIGHLIGHT_FARBEN[0]`. Nach der Umstellung wäre das Gelb — aber der Stift soll Schwarz sein. Lösung: Separate Initialisierung je nach aktivem Werkzeug, ODER eine dedizierte `STANDARD_STIFT_FARBEN` Liste.

Einfachster Ansatz: `aktiveFarbe` bleibt `STANDARD_HIGHLIGHT_FARBEN[0]` (Gelb), aber beim Werkzeug-Wechsel auf Freihand/Text wird die Farbe auf Schwarz gesetzt falls sie noch auf einer Pastell-Farbe steht.

In `PDFFrage.tsx` einen Effect hinzufügen:
```typescript
// Stift/Text: Standardmässig Schwarz, Markieren: Standardmässig Gelb
useEffect(() => {
  if (aktivesWerkzeug === 'freihand' || aktivesWerkzeug === 'text') {
    setAktiveFarbe(prev => {
      // Wenn aktuelle Farbe eine Pastell-Farbe ist, auf Schwarz wechseln
      const pastell = ['#FEF08A', '#FBCFE8', '#BAE6FD', '#BBF7D0']
      return pastell.includes(prev) ? '#000000' : prev
    })
  } else if (aktivesWerkzeug === 'highlight') {
    setAktiveFarbe(prev => {
      // Wenn aktuelle Farbe Schwarz oder kräftig, auf Gelb wechseln
      const kraeftig = ['#000000', '#DC2626', '#2563EB', '#16A34A', '#F59E0B']
      return kraeftig.includes(prev) ? '#FEF08A' : prev
    })
  }
}, [aktivesWerkzeug])
```

- [ ] **Step 3: Verify** — `npx tsc -b`

- [ ] **Step 4: Commit** — `git add src/components/fragetypen/pdf/PDFTypes.ts src/components/fragetypen/PDFFrage.tsx && git commit -m "U25: Markieren Standardfarbe Gelb, Stift Standardfarbe Schwarz"`

---

## Task 6: U28 — Textfeld-Icons bei Bild vereinheitlichen (PDF-Verhalten)

**Problem:** `ZeichnenCanvas.tsx:647-665` hat ✓/✕ Buttons neben dem Text-Input. PDF hat nur Enter/Escape/Blur. Entscheid: Bild soll wie PDF funktionieren — keine sichtbaren Buttons.

**Files:**
- Modify: `src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx:591-679`

- [ ] **Step 1: Buttons entfernen, Blur-Handler hinzufügen**

Das Text-Overlay in ZeichnenCanvas umbauen:
- Die `<button>` Elemente (Zeile 647-665) entfernen
- Den `<div>` Wrapper vereinfachen (nur noch das `<input>`)
- `onBlur` hinzufügen: `onBlur={() => setTimeout(() => textAbschliessen(false), 150)}`

```tsx
{textOverlay.sichtbar && (
  <div
    style={{
      position: 'absolute',
      left: `${textOverlay.cssLeft}%`,
      top: `${textOverlay.cssTop}%`,
      zIndex: 20,
    }}
    onPointerDown={e => e.stopPropagation()}
    onMouseDown={e => e.stopPropagation()}
    onTouchStart={e => e.stopPropagation()}
    onClick={e => e.stopPropagation()}
  >
    <input
      ref={textInputRef}
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCapitalize="sentences"
      value={textOverlay.text}
      onChange={e => setTextOverlay(prev => ({ ...prev, text: e.target.value }))}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); textAbschliessen(false) }
        else if (e.key === 'Escape') { e.preventDefault(); textAbschliessen(true) }
        e.stopPropagation()
      }}
      onBlur={() => setTimeout(() => textAbschliessen(false), 150)}
      style={{
        fontSize: '18px',
        fontFamily: 'sans-serif',
        color: aktiveFarbe,
        background: 'rgba(255,255,255,0.95)',
        border: '2px solid #3b82f6',
        borderRadius: '4px',
        padding: '4px 8px',
        minWidth: '140px',
        outline: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      placeholder="Text eingeben…"
    />
  </div>
)}
```

- [ ] **Step 2: Verify** — `npx tsc -b`

- [ ] **Step 3: Commit** — `git add src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx && git commit -m "U28: Textfeld Bild vereinheitlicht mit PDF (Enter/Escape/Blur statt Buttons)"`

---

## Task 7: U29 — ZeitzuschlagEditor aus Lobby entfernen

**Files:**
- Modify: `src/components/lp/LobbyPhase.tsx:1-4` (Import entfernen)
- Modify: `src/components/lp/LobbyPhase.tsx:18` (State entfernen)
- Modify: `src/components/lp/LobbyPhase.tsx:150-203` (Akkordeon-Block entfernen)

- [ ] **Step 1: Import + State + JSX entfernen**

In `LobbyPhase.tsx`:
1. Import `ZeitzuschlagEditor` entfernen (Zeile 4)
2. State `zeitzuschlagOffen` entfernen (Zeile 18)
3. Props `onConfigUpdate` aus Interface entfernen (Zeile 14) — falls nicht anderweitig genutzt
4. Den gesamten `{/* Nachteilsausgleich-Akkordeon */}`-Block (Zeile 150-203) entfernen

Prüfen ob `onConfigUpdate` noch in LobbyPhase anderweitig gebraucht wird. Falls nicht, auch aus Props-Destructuring entfernen.

- [ ] **Step 2: Verify** — `npx tsc -b` (prüft ob Props-Interface-Änderungen alle Aufrufer brechen)

- [ ] **Step 3: Commit** — `git add src/components/lp/LobbyPhase.tsx && git commit -m "U29: ZeitzuschlagEditor aus Lobby entfernt (Inline-Badge reicht)"`

---

## Task 8: U30 — Auto-korrigierbare Aufgaben als "geprüft" vormarkieren

**Problem:** Nach KI-Korrektur müssen LP jede Bewertung manuell als "geprüft" markieren. Auto-korrigierbare Typen (MC, R/F, Lückentext, Buchungssätze, Zuordnung, Kontenbestimmung, Berechnung) sollten automatisch als `geprueft: true` gesetzt werden.

**Files:**
- Modify: `src/utils/autoKorrektur.ts` (oder wo die Batch-Korrektur-Ergebnisse verarbeitet werden)
- Alternativ: `src/components/lp/KorrekturDashboard.tsx` (wo Korrektur-Daten geladen werden)

- [ ] **Step 1: Auto-korrigierbare Fragetypen definieren**

In `autoKorrektur.ts` (oder neues Utility) eine Konstante:
```typescript
export const AUTO_KORRIGIERBARE_TYPEN = [
  'mc', 'richtigFalsch', 'lueckentext', 'buchungssatz',
  'zuordnung', 'kontenbestimmung', 'berechnung',
  'tKonto', 'bilanzER',
] as const
```

- [ ] **Step 2: Im KorrekturDashboard nach Laden geprueft setzen**

Im `useEffect` wo Korrektur-Daten geladen werden: Nach dem Setzen der Korrektur-Daten, für alle Bewertungen von auto-korrigierbaren Fragen `geprueft: true` setzen falls die Bewertung schon Punkte hat.

```typescript
// Nach korrektur-Laden: Auto-korrigierbare als geprüft markieren
if (korrekturDaten) {
  let geaendert = false
  for (const schueler of korrekturDaten.schueler) {
    for (const [frageId, bewertung] of Object.entries(schueler.bewertungen)) {
      const frage = fragenDaten.find(f => f.id === frageId)
      if (frage && AUTO_KORRIGIERBARE_TYPEN.includes(frage.typ as any) && !bewertung.geprueft && bewertung.punkte !== undefined) {
        bewertung.geprueft = true
        geaendert = true
      }
    }
  }
  if (geaendert) queueSave(korrekturDaten)
}
```

- [ ] **Step 3: Verify** — `npx tsc -b`

- [ ] **Step 4: Commit** — `git add src/utils/autoKorrektur.ts src/components/lp/KorrekturDashboard.tsx && git commit -m "U30: Auto-korrigierbare Aufgaben standardmässig als geprüft markiert"`

---

## Task 9: U27 — Textfeld 90°-Rotation (Bild + PDF)

**Problem:** Textfelder können nicht rotiert werden. 90°-Rotation für z.B. Achsenbeschriftungen gewünscht.

### Ansatz Bild (ZeichnenCanvas)

**Files:**
- Modify: `src/components/fragetypen/zeichnen/ZeichnenTypes.ts` — `DrawCommand` Text-Variante erweitern
- Modify: `src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` — Rendering + Rotation-Toggle
- Modify: `src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx` — Rotation-Button

- [ ] **Step 1: Type erweitern**

In `ZeichnenTypes.ts`, Text-Command um `rotation` erweitern:
```typescript
| { id: CommandId; typ: 'text'; position: Point; text: string; farbe: string; groesse: number; rotation?: 0 | 90 | 180 | 270 }
```

- [ ] **Step 2: Rotation-State in ZeichnenFrage/Canvas**

Neuer State in der übergeordneten Komponente (ZeichnenFrage.tsx oder ZeichnenCanvas.tsx):
```typescript
const [textRotation, setTextRotation] = useState<0 | 90 | 180 | 270>(0)
```

- [ ] **Step 3: Rotation im Text-Rendering anwenden**

In ZeichnenCanvas wo Text-Commands gerendert werden (Canvas `fillText` oder HTML-Overlay):
```typescript
if (cmd.typ === 'text') {
  ctx.save()
  ctx.translate(cmd.position.x * w, cmd.position.y * h)
  ctx.rotate((cmd.rotation ?? 0) * Math.PI / 180)
  ctx.fillStyle = cmd.farbe
  ctx.font = `${cmd.groesse}px sans-serif`
  ctx.fillText(cmd.text, 0, 0)
  ctx.restore()
}
```

- [ ] **Step 4: Rotation-Toggle in Toolbar**

In ZeichnenToolbar, wenn Text-Werkzeug aktiv: Button `⟳ 90°` der durch 0→90→180→270→0 zykliert.

- [ ] **Step 5: Rotation beim Text-Erstellen übergeben**

In `textAbschliessen`: `rotation: textRotation` in den DrawCommand aufnehmen.

### Ansatz PDF (PDFSeite)

**Files:**
- Modify: `src/types/fragen.ts` — PDFTextAnnotation um `rotation` erweitern
- Modify: `src/components/fragetypen/pdf/PDFSeite.tsx` — Rendering + Input-Rotation

- [ ] **Step 6: PDFTextAnnotation erweitern**

```typescript
// In fragen.ts, PDFTextAnnotation:
rotation?: 0 | 90 | 180 | 270
```

- [ ] **Step 7: Rotation im Rendering**

Bei der Text-Annotation in PDFSeite: `transform: rotate(Xdeg)` auf das gerenderte Element anwenden.

- [ ] **Step 8: Rotation-Toggle in PDFToolbar**

Wenn Text-Werkzeug aktiv: `⟳ 90°` Button, analog zu Zeichnen.

- [ ] **Step 9: Verify** — `npx tsc -b`

- [ ] **Step 10: Commit** — `git commit -m "U27: Textfeld 90°-Rotation für Bild und PDF"`

---

## Task 10: U31 — Korrektur: Frage-für-Frage-Modus (Toggle)

**Problem:** Korrektur zeigt aktuell SuS-für-SuS. Neuer Modus: Alle SuS, gleiche Frage — ermöglicht effizientere Korrektur.

**Ansatz:** Toggle-Button im KorrekturDashboard-Header. Neuer State `korrekturModus: 'schueler' | 'frage'`. Im Frage-Modus: Fragen-Auswahl (Dropdown/Tabs) + Liste aller SuS-Antworten für diese Frage.

**Files:**
- Create: `src/components/lp/KorrekturFragenAnsicht.tsx` — Neue Komponente für Frage-für-Frage
- Modify: `src/components/lp/KorrekturDashboard.tsx` — Toggle + conditional render

- [ ] **Step 1: KorrekturFragenAnsicht.tsx erstellen**

Neue Komponente mit Props:
```typescript
interface Props {
  pruefungId: string
  fragen: Frage[]
  korrektur: PruefungsKorrektur
  abgaben: Record<string, SchuelerAbgabe>
  autoErgebnisseAlle: Record<string, Record<string, KorrekturErgebnis>>
  notenConfig: NotenConfig
  onBewertungUpdate: (email: string, frageId: string, updates: Partial<Bewertung>) => void
}
```

Struktur:
1. Fragen-Tabs/Dropdown oben (alle Fragen der Prüfung)
2. Für ausgewählte Frage: Fragentext anzeigen (Header)
3. Darunter: Alle SuS-Antworten als Karten (Name, Antwort, Punkte-Eingabe, geprüft-Checkbox)

```tsx
export default function KorrekturFragenAnsicht({ fragen, korrektur, abgaben, ... }: Props) {
  const [aktiveFrage, setAktiveFrage] = useState(fragen[0]?.id ?? '')

  const frage = fragen.find(f => f.id === aktiveFrage)

  return (
    <div>
      {/* Fragen-Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {fragen.map((f, i) => (
          <button key={f.id} onClick={() => setAktiveFrage(f.id)}
            className={`px-3 py-1.5 text-xs rounded-lg border ... ${aktiveFrage === f.id ? 'aktiv' : ''}`}>
            {i + 1}. {f.titel || f.id}
          </button>
        ))}
      </div>

      {/* Fragentext */}
      {frage && <div className="mb-4 p-3 bg-slate-50 rounded-lg">...</div>}

      {/* Alle SuS-Antworten für diese Frage */}
      <div className="space-y-2">
        {korrektur.schueler.map(schueler => {
          const bewertung = schueler.bewertungen[aktiveFrage]
          const abgabe = abgaben[schueler.email]
          const antwort = abgabe?.antworten?.[aktiveFrage]
          return (
            <div key={schueler.email} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{schueler.name}</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={bewertung?.punkte ?? ''}
                    onChange={...} className="w-16 text-right" />
                  <span className="text-xs text-slate-400">/ {frage.punkte}</span>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={bewertung?.geprueft ?? false} onChange={...} />
                    Geprüft
                  </label>
                </div>
              </div>
              {/* SuS-Antwort anzeigen (vereinfacht) */}
              <div className="text-sm text-slate-600">
                {renderAntwort(frage, antwort)}
              </div>
              {/* KI-Feedback anzeigen falls vorhanden */}
              {bewertung?.feedback && (
                <p className="text-xs text-slate-400 mt-1 italic">{bewertung.feedback}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Toggle in KorrekturDashboard**

In `KorrekturDashboard.tsx`:
1. Neuer State: `const [korrekturModus, setKorrekturModus] = useState<'schueler' | 'frage'>('schueler')`
2. Toggle-Button neben der Sortierung (Zeile ~765):
```tsx
<div className="flex items-center gap-3 mb-4">
  <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
    <button onClick={() => setKorrekturModus('schueler')}
      className={`px-3 py-1.5 text-xs ... ${korrekturModus === 'schueler' ? 'aktiv' : ''}`}>
      SuS-Ansicht
    </button>
    <button onClick={() => setKorrekturModus('frage')}
      className={`px-3 py-1.5 text-xs ... ${korrekturModus === 'frage' ? 'aktiv' : ''}`}>
      Fragen-Ansicht
    </button>
  </div>
  {korrekturModus === 'schueler' && (
    /* bestehende Sortierung */
  )}
</div>
```

3. Conditional Render (Zeile ~796):
```tsx
{korrekturModus === 'schueler' ? (
  <div className="space-y-2">
    {sortierteSchueler.map(schueler => <KorrekturSchuelerZeile ... />)}
  </div>
) : (
  <KorrekturFragenAnsicht
    pruefungId={pruefungId}
    fragen={fragen}
    korrektur={korrektur}
    abgaben={abgaben}
    autoErgebnisseAlle={autoErgebnisseAlle}
    notenConfig={notenConfig}
    onBewertungUpdate={handleBewertungUpdate}
  />
)}
```

- [ ] **Step 3: Verify** — `npx tsc -b`

- [ ] **Step 4: Commit** — `git commit -m "U31: Frage-für-Frage Korrekturmodus mit Toggle"`

---

## Task 11: U32 — Multi-Prüfungs-Auswertung: Tabs pro Prüfung

**Problem:** Bei Nachprüfungsterminen (`?ids=a,b,c`) soll die Beendet-Phase/Auswertung pro Prüfung einen Tab haben.

**Files:**
- Modify: `src/components/lp/MultiDurchfuehrenDashboard.tsx`

- [ ] **Step 1: Auswertungs-Tabs hinzufügen**

Im MultiDurchfuehrenDashboard, wenn Phase 'beendet':
- Tab-Leiste mit einem Tab pro Prüfung (Kurs-Name als Label)
- Jeder Tab zeigt das `KorrekturDashboard` für diese Prüfung

```tsx
// Im 'live' oder 'einzeln' View: Neuer Tab 'auswertung'
{activeView === 'auswertung' && (
  <div>
    <div className="flex gap-1 mb-4 border-b">
      {pruefungIds.map(id => (
        <button key={id} onClick={() => setAktiveAuswertung(id)}
          className={`px-4 py-2 text-sm border-b-2 ${aktiveAuswertung === id ? 'border-slate-800' : 'border-transparent'}`}>
          {datenMap[id]?.titel ?? id}
        </button>
      ))}
    </div>
    {aktiveAuswertung && (
      <KorrekturDashboard pruefungId={aktiveAuswertung} eingebettet />
    )}
  </div>
)}
```

- [ ] **Step 2: Verify** — `npx tsc -b`

- [ ] **Step 3: Commit** — `git commit -m "U32: Multi-Prüfungs-Auswertung mit Tabs pro Kurs"`

---

## Task 12: U13 — Ergebnisse + Korrektur zusammenlegen (Optional)

**Niedrigere Priorität.** Kann in dieser Session gemacht werden falls Zeit bleibt.

**Files:**
- Modify: `src/components/lp/DurchfuehrenDashboard.tsx` — Tab-Struktur vereinfachen

- [ ] **Step 1: "Ergebnisse" und "Korrektur" zu einem Tab "Auswertung" zusammenlegen**

Im DurchfuehrenDashboard: Aktuell 4 Tabs (Vorbereitung, Lobby, Live, Auswertung). Der Auswertung-Tab enthält bereits beides (Ergebnis-Übersicht als Accordion + KorrekturDashboard). Falls es einen separaten "Ergebnisse"-Tab gibt, diesen entfernen und alles in "Auswertung" konsolidieren.

- [ ] **Step 2: Verify** — `npx tsc -b`

- [ ] **Step 3: Commit** — `git commit -m "U13: Ergebnisse und Korrektur in einem Tab zusammengelegt"`

---

## Abschluss

- [ ] **Finaler TypeScript-Check:** `npx tsc -b`
- [ ] **HANDOFF.md aktualisieren:** Offene Punkte, erledigte Tasks, geänderte Dateien
- [ ] **Git commit + push**
