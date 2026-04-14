# F1–F15 LP-Live-Test-Feedback — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 15 feedback points from the first LP live test, making the correction mode usable, connection handling robust, and UX polished.

**Architecture:** 4 clusters executed sequentially. Cluster 1 rebuilds the correction UI with auto-correction + Musterlösung display. Cluster 2 adds error resilience. Cluster 3 applies isolated quick-fixes. Cluster 4 investigates remaining issues and adds features.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4. Backend: Google Apps Script + Google Sheets.

**Spec:** `docs/superpowers/specs/2026-03-25-f1-f15-lp-live-test-feedback-design.md`

**Working directory:** Alle `src/` Pfade relativ zu `ExamLab/`. `apps-script-code.js` liegt im Repo-Root. Git-Befehle vom Repo-Root ausführen (`10 Github/GYM-WR-DUY/`).

---

## Review-Korrekturen (nach Plan-Review)

Die folgenden Korrekturen gelten beim Implementieren. Wenn Plan-Code und Korrektur widersprechen, gilt die Korrektur.

1. **FiBu-Funktionsname:** `korrigiereBilanzStruktur` → `korrigiereBilanzER` (Export aus `fibuAutoKorrektur.ts`). Typ heisst `BilanzERFrage` mit `typ: 'bilanzstruktur'`.
2. **F1 — verbindungsFehler nicht in useCallback-deps:** `verbindungsFehler` als `useRef` statt `useState`, um infinite Re-Creation des Callbacks zu vermeiden. Funktionales Update-Pattern: `fehlerRef.current++; if (fehlerRef.current >= 3) setZeigeVerbindungsBanner(true)`.
3. **F2 — Recovery-Banner bei Korrektur-Daten aus IndexedDB:** Beim Laden in `KorrekturDashboard.tsx`: `loadKorrekturFromIndexedDB(pruefungId)` aufrufen. Wenn timestamp neuer als Backend-Daten → Info-Banner "Nicht gespeicherte Korrekturen gefunden — wiederherstellen?" mit Ja/Nein-Buttons.
4. **F2 — VerbindungsStatus im Korrektur-Tab:** `VerbindungsStatus`-Komponente auch in `KorrekturDashboard.tsx` einbinden (gleiche wie SuS-Ansicht).
5. **F2 — useKorrekturAutoSave Stale-Closure:** `korrekturDaten` als `useRef` statt direkt in dependency-Array. `speichereKorrekturZeile` importieren aus `../services/korrekturApi` (nicht `apiService`).
6. **F9 — beantworteteFragen:** Heartbeat sendet zusätzlich `beantworteteFragen` (Anzahl beantworteter Fragen). Backend schreibt beide Werte (`aktuelleFrage` + `beantworteteFragen`) in Monitoring-Spalten.
7. **F10 — Icon-Refactor:** `WERKZEUG_DEFS` Typ von `icon: string` auf `icon: string | ReactNode` erweitern. Render-Stelle: `typeof w.icon === 'string' ? <span>{w.icon}</span> : w.icon`. Highlighter-Icon: `<span className="inline-block w-4 h-1.5 bg-yellow-400 rounded-sm" />`.
8. **F11 — Container-Höhe:** Neben `min-h` auf dem iframe: Parent-Element (Split-Container in MaterialPanel) braucht `h-[calc(100vh-12rem)]` wenn es aktuell kein festes `h-*` hat. Beim Implementieren: Parent-Chain nach oben prüfen bis `h-full` oder feste Höhe gefunden.
9. **F12/F3/F4 — FiBu-Musterlösung:** Für Buchungssatz/TKonto/Kontenbestimmung/BilanzER: Die korrekte Lösung steckt in den Frage-Daten selbst (z.B. `frage.buchungen` bei Buchungssatz). `KorrekturFrageVollansicht` muss für diese Typen die strukturierte Lösung aus der Frage rendern (z.B. "Soll: 1000 Kasse 500 CHF / Haben: 3200 Warenertrag 500 CHF"). Kein separates `musterlosung`-Textfeld nötig.
10. **F15 — Frontend-Fetch:** In `TrackerSection.tsx`: `useEffect` mit `apiService`-Call zum neuen `ladeKorrekturStatus`-Endpoint. State: `korrekturStatus: { korrigiert: number, offen: number, gesamt: number }`.

---

## File Map

### New files
- `src/utils/autoKorrektur.ts` — Auto-correction engine for deterministic question types
- `src/hooks/useKorrekturAutoSave.ts` — Debounced autosave + IndexedDB backup for correction data
- `src/components/lp/KorrekturFrageVollansicht.tsx` — Full question view with answer + Musterlösung for correction

### Modified files
- `src/components/lp/KorrekturFrageZeile.tsx` — Replace truncated display with KorrekturFrageVollansicht
- `src/components/lp/KorrekturSchuelerZeile.tsx` — Pass frage objects to child components
- `src/components/lp/KorrekturDashboard.tsx` — Add autosave hook, auto-correction on load, error recovery
- `src/components/lp/DurchfuehrenDashboard.tsx` — Add connection error banner (F1)
- `src/components/Startbildschirm.tsx` — Lobby feedback (F7), faster polling (F8)
- `src/components/fragetypen/pdf/PDFToolbar.tsx` — Fix highlighter icon (F10)
- `src/components/MaterialPanel.tsx` — Fix PDF height (F11), hide "new tab" link (F12)
- `src/components/lp/BeendenDialog.tsx` — Single-click end (F14)
- `src/components/lp/TrackerSection.tsx` — Add correction status (F15)
- `src/services/autoSave.ts` — Add korrektur-specific IndexedDB store
- `src/components/lp/PDFKorrektur.tsx` — Load PDF via Drive fallback (F6)
- `apps-script-code.js` — Multiple backend fixes (F5, F6, F9, F15)

---

## Task 1: Auto-Korrektur Engine (F3/F4 Foundation)

**Files:**
- Create: `src/utils/autoKorrektur.ts`

- [ ] **Step 1: Create autoKorrektur.ts**

```typescript
// src/utils/autoKorrektur.ts
import type { Frage, MCFrage, RichtFalschFrage, LueckentextFrage, ZuordnungFrage, BerechnungFrage } from '../types/fragen'
import type { Antwort } from '../types/antworten'
import { korrigiereBuchungssatz, korrigiereTKonto, korrigiereKontenbestimmung, korrigiereBilanzER } from './fibuAutoKorrektur'
import type { KorrekturErgebnis, KorrekturDetail } from './fibuAutoKorrektur'

export type { KorrekturErgebnis, KorrekturDetail }

/**
 * Auto-Korrektur für deterministische Fragetypen.
 * Gibt null zurück wenn der Fragetyp nicht automatisch korrigierbar ist.
 */
export function autoKorrigiere(frage: Frage, antwort: Antwort | undefined): KorrekturErgebnis | null {
  if (!antwort) return { erreichtePunkte: 0, maxPunkte: frage.punkte, details: [{ bezeichnung: 'Keine Antwort', korrekt: false, erreicht: 0, max: frage.punkte }] }

  try {
    switch (frage.typ) {
      case 'mc': return korrigiereMC(frage, antwort)
      case 'richtigfalsch': return korrigiereRF(frage, antwort)
      case 'lueckentext': return korrigiereLueckentext(frage, antwort)
      case 'zuordnung': return korrigiereZuordnung(frage, antwort)
      case 'berechnung': return korrigiereBerechnung(frage, antwort)
      case 'buchungssatz': return korrigiereBuchungssatz(frage, antwort.typ === 'buchungssatz' ? antwort.buchungen : [])
      case 'tkonto': return korrigiereTKonto(frage, antwort.typ === 'tkonto' ? antwort.konten : [])
      case 'kontenbestimmung': return korrigiereKontenbestimmung(frage, antwort.typ === 'kontenbestimmung' ? antwort.aufgaben : {})
      case 'bilanzstruktur': return korrigiereBilanzER(frage, antwort.typ === 'bilanzstruktur' ? antwort.bilanz : undefined)
      // Nicht auto-korrigierbar:
      case 'freitext':
      case 'visualisierung':
      case 'pdf':
        return null
      default:
        return null
    }
  } catch (e) {
    console.warn(`[AutoKorrektur] Fehler bei ${frage.id} (${frage.typ}):`, e)
    return null // Fallback auf manuelle Korrektur
  }
}

/** Prüft ob ein Fragetyp automatisch korrigierbar ist */
export function istAutoKorrigierbar(typ: string): boolean {
  return ['mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung',
    'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'].includes(typ)
}

// === MC ===
function korrigiereMC(frage: MCFrage, antwort: Antwort): KorrekturErgebnis {
  if (antwort.typ !== 'mc') return { erreichtePunkte: 0, maxPunkte: frage.punkte, details: [] }

  const korrekteIds = new Set(frage.optionen.filter(o => o.korrekt).map(o => o.id))
  const gewaehlteIds = new Set(antwort.gewaehlteOptionen)

  if (frage.mehrfachauswahl) {
    // Teilpunkte: korrekte Auswahl / Gesamtzahl Optionen
    let richtig = 0
    for (const opt of frage.optionen) {
      const sollGewaehlt = korrekteIds.has(opt.id)
      const istGewaehlt = gewaehlteIds.has(opt.id)
      if (sollGewaehlt === istGewaehlt) richtig++
    }
    const quote = richtig / frage.optionen.length
    const punkte = Math.round(quote * frage.punkte * 100) / 100
    return {
      erreichtePunkte: punkte,
      maxPunkte: frage.punkte,
      details: frage.optionen.map(o => ({
        bezeichnung: o.text,
        korrekt: korrekteIds.has(o.id) === gewaehlteIds.has(o.id),
        erreicht: korrekteIds.has(o.id) === gewaehlteIds.has(o.id) ? frage.punkte / frage.optionen.length : 0,
        max: frage.punkte / frage.optionen.length,
      })),
    }
  } else {
    // Einfachauswahl: alles oder nichts
    const korrekt = gewaehlteIds.size === 1 && korrekteIds.has([...gewaehlteIds][0])
    return {
      erreichtePunkte: korrekt ? frage.punkte : 0,
      maxPunkte: frage.punkte,
      details: [{ bezeichnung: 'Auswahl', korrekt, erreicht: korrekt ? frage.punkte : 0, max: frage.punkte }],
    }
  }
}

// === Richtig/Falsch ===
function korrigiereRF(frage: RichtFalschFrage, antwort: Antwort): KorrekturErgebnis {
  if (antwort.typ !== 'richtigfalsch') return { erreichtePunkte: 0, maxPunkte: frage.punkte, details: [] }

  const punkteProAussage = frage.punkte / Math.max(1, frage.aussagen.length)
  const details: KorrekturDetail[] = frage.aussagen.map(a => {
    const bewertung = antwort.bewertungen[a.id]
    const korrekt = bewertung === a.korrekt
    return {
      bezeichnung: a.text.substring(0, 60),
      korrekt,
      erreicht: korrekt ? punkteProAussage : 0,
      max: punkteProAussage,
    }
  })

  return {
    erreichtePunkte: Math.round(details.reduce((s, d) => s + d.erreicht, 0) * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

// === Lückentext ===
function korrigiereLueckentext(frage: LueckentextFrage, antwort: Antwort): KorrekturErgebnis {
  if (antwort.typ !== 'lueckentext') return { erreichtePunkte: 0, maxPunkte: frage.punkte, details: [] }

  const punkteProLuecke = frage.punkte / Math.max(1, frage.luecken.length)
  const details: KorrekturDetail[] = frage.luecken.map(l => {
    const eingabe = (antwort.eintraege[l.id] ?? '').trim()
    const korrekt = l.korrekteAntworten.some(k =>
      l.caseSensitive ? eingabe === k.trim() : eingabe.toLowerCase() === k.trim().toLowerCase()
    )
    return {
      bezeichnung: `Lücke: "${eingabe || '(leer)'}"`,
      korrekt,
      erreicht: korrekt ? punkteProLuecke : 0,
      max: punkteProLuecke,
      kommentar: korrekt ? undefined : `Erwartet: ${l.korrekteAntworten.join(' / ')}`,
    }
  })

  return {
    erreichtePunkte: Math.round(details.reduce((s, d) => s + d.erreicht, 0) * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

// === Zuordnung ===
function korrigiereZuordnung(frage: ZuordnungFrage, antwort: Antwort): KorrekturErgebnis {
  if (antwort.typ !== 'zuordnung') return { erreichtePunkte: 0, maxPunkte: frage.punkte, details: [] }

  const punkteProPaar = frage.punkte / Math.max(1, frage.paare.length)
  const details: KorrekturDetail[] = frage.paare.map((p, i) => {
    const zuordnung = antwort.zuordnungen[p.links] ?? antwort.zuordnungen[String(i)]
    const korrekt = zuordnung === p.rechts
    return {
      bezeichnung: `${p.links} → ${zuordnung ?? '(leer)'}`,
      korrekt,
      erreicht: korrekt ? punkteProPaar : 0,
      max: punkteProPaar,
      kommentar: korrekt ? undefined : `Erwartet: ${p.rechts}`,
    }
  })

  return {
    erreichtePunkte: Math.round(details.reduce((s, d) => s + d.erreicht, 0) * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

// === Berechnung ===
function korrigiereBerechnung(frage: BerechnungFrage, antwort: Antwort): KorrekturErgebnis {
  if (antwort.typ !== 'berechnung') return { erreichtePunkte: 0, maxPunkte: frage.punkte, details: [] }

  const punkteProErgebnis = frage.punkte / Math.max(1, frage.ergebnisse.length)
  const details: KorrekturDetail[] = frage.ergebnisse.map(e => {
    const eingabe = parseFloat(antwort.ergebnisse[e.id] ?? '')
    const toleranz = e.toleranz ?? 0
    // Akzeptierte Formeln als alternative Antworten (numerisch)
    const akzeptiert = (e.akzeptierteFormeln ?? []).map(f => parseFloat(f)).filter(n => !isNaN(n))
    const erwartet = akzeptiert.length > 0 ? akzeptiert[0] : NaN

    let korrekt = false
    if (!isNaN(eingabe) && !isNaN(erwartet)) {
      korrekt = Math.abs(eingabe - erwartet) <= toleranz
    }

    return {
      bezeichnung: e.beschreibung,
      korrekt,
      erreicht: korrekt ? punkteProErgebnis : 0,
      max: punkteProErgebnis,
      kommentar: korrekt ? undefined : `Erwartet: ${erwartet}${toleranz > 0 ? ` (±${toleranz})` : ''}`,
    }
  })

  return {
    erreichtePunkte: Math.round(details.reduce((s, d) => s + d.erreicht, 0) * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd ExamLab && npx tsc --noEmit src/utils/autoKorrektur.ts 2>&1 | head -20`

Fix any type errors. Note: FiBu-Funktionen (`korrigiereKontenbestimmung`, `korrigiereBilanzstruktur`) müssen eventuell als Exports in `fibuAutoKorrektur.ts` ergänzt werden falls sie fehlen.

- [ ] **Step 3: Commit**

```bash
git add src/utils/autoKorrektur.ts
git commit -m "feat(korrektur): Auto-Korrektur-Engine für deterministische Fragetypen (F3/F4)"
```

---

## Task 2: Korrektur-Vollansicht Komponente (F3/F4)

**Files:**
- Create: `src/components/lp/KorrekturFrageVollansicht.tsx`
- Modify: `src/components/lp/KorrekturFrageZeile.tsx`
- Modify: `src/components/lp/KorrekturSchuelerZeile.tsx`

- [ ] **Step 1: Create KorrekturFrageVollansicht.tsx**

Neue Komponente die Frage + Antwort + Musterlösung + Auto-Korrektur-Details zusammen anzeigt. Ersetzt die bisherige 1-Zeile-Darstellung.

```typescript
// src/components/lp/KorrekturFrageVollansicht.tsx
import type { Frage } from '../../types/fragen'
import type { Antwort } from '../../types/antworten'
import type { KorrekturErgebnis } from '../../utils/autoKorrektur'

interface Props {
  frage: Frage
  antwort: Antwort | undefined
  autoErgebnis: KorrekturErgebnis | null // null = nicht auto-korrigierbar
}

export default function KorrekturFrageVollansicht({ frage, antwort, autoErgebnis }: Props) {
  return (
    <div className="space-y-3">
      {/* 1. Voller Fragetext */}
      <div>
        <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Frage</h4>
        <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
          {'fragetext' in frage ? (frage as { fragetext: string }).fragetext :
           'geschaeftsfall' in frage ? (frage as { geschaeftsfall: string }).geschaeftsfall :
           'aufgabentext' in frage ? (frage as { aufgabentext: string }).aufgabentext : ''}
        </div>
        {/* MC-Optionen anzeigen */}
        {frage.typ === 'mc' && 'optionen' in frage && (
          <div className="mt-2 space-y-1">
            {(frage as import('../../types/fragen').MCFrage).optionen.map(opt => {
              const gewaehlt = antwort?.typ === 'mc' && antwort.gewaehlteOptionen.includes(opt.id)
              const detail = autoErgebnis?.details.find(d => d.bezeichnung === opt.text)
              return (
                <div key={opt.id} className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                  detail?.korrekt ? 'bg-green-50 dark:bg-green-900/20' :
                  gewaehlt ? 'bg-red-50 dark:bg-red-900/20' :
                  'bg-slate-50 dark:bg-slate-700/30'
                }`}>
                  <span className="w-5 text-center">{gewaehlt ? '☑' : '☐'}</span>
                  <span className={opt.korrekt ? 'font-medium' : ''}>{opt.text}</span>
                  {opt.korrekt && <span className="text-xs text-green-600 dark:text-green-400 ml-auto">✓ korrekt</span>}
                </div>
              )
            })}
          </div>
        )}
        {/* R/F-Aussagen anzeigen */}
        {frage.typ === 'richtigfalsch' && 'aussagen' in frage && (
          <div className="mt-2 space-y-1">
            {(frage as import('../../types/fragen').RichtFalschFrage).aussagen.map(a => {
              const bewertung = antwort?.typ === 'richtigfalsch' ? antwort.bewertungen[a.id] : undefined
              const korrektGewaehlt = bewertung === a.korrekt
              return (
                <div key={a.id} className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                  bewertung === undefined ? '' :
                  korrektGewaehlt ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                  <span className="text-xs w-8 text-center font-medium">{bewertung === true ? 'R' : bewertung === false ? 'F' : '—'}</span>
                  <span>{a.text}</span>
                  <span className="text-xs text-slate-400 ml-auto">(korrekt: {a.korrekt ? 'R' : 'F'})</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 2. SuS-Antwort (für Freitext, Berechnung, Lückentext etc.) */}
      {antwort && !['mc', 'richtigfalsch'].includes(antwort.typ) && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Antwort SuS</h4>
          <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
            {antwortAlsText(antwort)}
          </div>
        </div>
      )}

      {/* 3. Auto-Korrektur Details */}
      {autoErgebnis && autoErgebnis.details.length > 0 && !['mc', 'richtigfalsch'].includes(frage.typ) && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
            Auto-Korrektur: {autoErgebnis.erreichtePunkte}/{autoErgebnis.maxPunkte} Pkt.
          </h4>
          <div className="space-y-0.5">
            {autoErgebnis.details.map((d, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                d.korrekt ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                <span>{d.korrekt ? '✓' : '✗'}</span>
                <span>{d.bezeichnung}</span>
                {d.kommentar && <span className="ml-auto text-slate-500 dark:text-slate-400 italic">{d.kommentar}</span>}
                <span className="ml-auto tabular-nums">{d.erreicht}/{d.max}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Musterlösung */}
      {frage.musterlosung && (
        <div>
          <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Musterlösung</h4>
          <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-700/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
            {frage.musterlosung}
          </div>
        </div>
      )}
      {'musterloesungBild' in frage && (frage as { musterloesungBild?: string }).musterloesungBild && (
        <div>
          <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Musterlösung (Bild)</h4>
          <img src={(frage as { musterloesungBild: string }).musterloesungBild} alt="Musterlösung" className="max-w-full rounded border border-amber-200 dark:border-amber-700" />
        </div>
      )}
    </div>
  )
}

/** Antwort als lesbaren Text darstellen */
function antwortAlsText(antwort: Antwort): string {
  switch (antwort.typ) {
    case 'freitext': return antwort.text.replace(/<[^>]*>/g, '') || '(leer)'
    case 'lueckentext': return Object.entries(antwort.eintraege).map(([k, v]) => `${k}: ${v || '(leer)'}`).join('\n')
    case 'berechnung': return Object.entries(antwort.ergebnisse).map(([k, v]) => `${k}: ${v || '(leer)'}`).join('\n')
    case 'zuordnung': return Object.entries(antwort.zuordnungen).map(([k, v]) => `${k} → ${v}`).join('\n')
    case 'buchungssatz': return `${antwort.buchungen?.length ?? 0} Buchung(en)`
    case 'tkonto': return `${antwort.konten?.length ?? 0} T-Konto(en)`
    case 'visualisierung': return '(Zeichnung)'
    case 'pdf': return `${(antwort.annotationen ?? []).length} Annotation(en)`
    default: return JSON.stringify(antwort).substring(0, 200)
  }
}
```

- [ ] **Step 2: Update KorrekturFrageZeile.tsx — integrate Vollansicht**

Modify `KorrekturFrageZeile.tsx`: Add `frage` and `antwort` props, replace truncated display with `KorrekturFrageVollansicht`.

Key changes to the Props interface (line 5-13):
```typescript
interface Props {
  frageId: string
  frage: Frage          // NEU: vollständiges Frage-Objekt
  antwort: Antwort | undefined  // NEU: SuS-Antwort
  autoErgebnis: KorrekturErgebnis | null  // NEU: Auto-Korrektur-Ergebnis
  bewertung: FragenBewertung
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null }) => void
  onAudioUpload: (frageId: string, blob: Blob) => Promise<string | null>
}
```

Replace lines 76-86 (truncated fragetext + answer box) with:
```tsx
<KorrekturFrageVollansicht frage={frage} antwort={antwort} autoErgebnis={autoErgebnis} />
```

Remove `fragetext`, `fragenTyp`, `antwortText` from Props (replaced by `frage`, `antwort`, `autoErgebnis`).

- [ ] **Step 3: Update KorrekturSchuelerZeile.tsx — pass frage + antwort**

In `KorrekturSchuelerZeile.tsx`, where `KorrekturFrageZeile` is rendered (around line 320-340), pass the full `frage` object and `antwort`:

```tsx
<KorrekturFrageZeile
  key={frageId}
  frageId={frageId}
  frage={frageDaten}           // statt fragetext={...}
  antwort={schuelerAntwort}    // statt antwortText={...}
  autoErgebnis={autoErgebnisse[frageId] ?? null}
  bewertung={bewertung}
  onUpdate={(updates) => onBewertungUpdate(schueler.email, frageId, updates)}
  onAudioUpload={(fId, blob) => onAudioUpload(schueler.email, fId, blob)}
/>
```

`frageDaten` lookup: `const frageDaten = fragen.find(f => f.id === frageId)` — `fragen` prop muss von `KorrekturDashboard` durchgereicht werden.

- [ ] **Step 4: Update KorrekturDashboard.tsx — run auto-correction on load**

In `KorrekturDashboard.tsx`, nach dem Laden der Korrektur-Daten (ca. Zeile 70-100), Auto-Korrektur ausführen:

```typescript
import { autoKorrigiere } from '../../utils/autoKorrektur'
import type { KorrekturErgebnis } from '../../utils/autoKorrektur'

// State für Auto-Korrektur-Ergebnisse
const [autoErgebnisse, setAutoErgebnisse] = useState<Record<string, Record<string, KorrekturErgebnis | null>>>({})

// Nach dem Laden (im useEffect nach setKorrektur):
// Auto-Korrektur für alle SuS × Fragen berechnen
if (pruefungResult?.fragen && abgabenResult) {
  const ergebnisse: Record<string, Record<string, KorrekturErgebnis | null>> = {}
  for (const [email, abgabe] of Object.entries(abgabenResult)) {
    ergebnisse[email] = {}
    for (const frage of pruefungResult.fragen) {
      ergebnisse[email][frage.id] = autoKorrigiere(frage, abgabe.antworten[frage.id])
    }
  }
  setAutoErgebnisse(ergebnisse)
}
```

Pass `autoErgebnisse[schueler.email]` to `KorrekturSchuelerZeile`.

- [ ] **Step 5: Verify build compiles**

Run: `cd ExamLab && npx tsc --noEmit 2>&1 | head -30`

Fix type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/KorrekturFrageVollansicht.tsx src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/KorrekturDashboard.tsx
git commit -m "feat(korrektur): Vollansicht mit Frage + Musterlösung + Auto-Korrektur (F3/F4)"
```

---

## Task 3: KI-Punkte Investigation (F5)

**Files:**
- Modify: `apps-script-code.js`

- [ ] **Step 1: Audit apps-script-code.js**

Read the `starteKorrektur` function. Check:
1. Wird `kiPunkte` in die Korrektur-Zeile geschrieben?
2. Existiert `ensureColumns()` für die KI-Spalten?
3. Feldnamen-Mismatch?

- [ ] **Step 2: Fix — ensureColumns für KI-Felder**

In der `starteKorrektur` Funktion, vor dem Schreiben der KI-Ergebnisse:
```javascript
ensureColumns(korrekturSheet, ['kiPunkte', 'kiBegruendung', 'kiFeedback', 'lpPunkte', 'lpKommentar', 'geprueft', 'quelle'])
```

- [ ] **Step 3: Commit**

```bash
git add apps-script-code.js
git commit -m "fix(backend): ensureColumns für KI-Korrektur-Felder (F5)"
```

---

## Task 4: PDF in Korrektur laden (F6)

**Files:**
- Modify: `src/components/lp/PDFKorrektur.tsx`
- Modify: `apps-script-code.js` (ladeFragen: musterlosung + materialien mitliefern)

- [ ] **Step 1: PDFKorrektur — Drive-Fallback**

In `PDFKorrektur.tsx`, wenn `pdfBase64` fehlt aber `driveFileId` vorhanden:

```typescript
useEffect(() => {
  if (!frage.pdfBase64 && frage.driveFileId) {
    apiService.ladeDriveFile(frage.driveFileId).then(base64 => {
      if (base64) setPdfBase64(base64)
    })
  }
}, [frage])
```

- [ ] **Step 2: Backend — musterlosung + materialien in ladeFragen**

In `apps-script-code.js`, `ladeFragen` Endpoint: Sicherstellen dass `musterlosung`, `musterloesungBild` und `materialien` Felder in der Response enthalten sind.

- [ ] **Step 3: Commit**

```bash
git add src/components/lp/PDFKorrektur.tsx apps-script-code.js
git commit -m "fix(korrektur): PDF via Drive laden + Musterlösung-Felder in API (F6)"
```

---

## Task 5: LP Verbindungs-Resilienz (F1)

**Files:**
- Modify: `src/components/lp/DurchfuehrenDashboard.tsx`

- [ ] **Step 1: Add error counter + banner state**

```typescript
const [verbindungsFehler, setVerbindungsFehler] = useState(0)
const [zeigeVerbindungsBanner, setZeigeVerbindungsBanner] = useState(false)
```

- [ ] **Step 2: Update ladeDaten error handling**

In `ladeDaten()` (ca. Zeile 121-161), nach dem try-catch:

```typescript
const ladeDaten = useCallback(async () => {
  if (!user) return
  // ... existing code ...

  monitoringAbortRef.current?.abort()
  const controller = new AbortController()
  monitoringAbortRef.current = controller

  try {
    const result = await apiService.ladeMonitoring(pruefungId, user.email, { signal: controller.signal })
    if (controller.signal.aborted) return

    // Erfolg → Fehler-Counter zurücksetzen
    if (verbindungsFehler > 0) {
      setVerbindungsFehler(0)
      setZeigeVerbindungsBanner(false)
    }

    // ... existing mapping code ...
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return

    setVerbindungsFehler(prev => {
      const neu = prev + 1
      if (neu >= 3) setZeigeVerbindungsBanner(true)
      return neu
    })
    // NICHT als Crash behandeln — bestehende Daten bleiben
  }
}, [user, istDemoModus, pruefungId, verbindungsFehler])
```

- [ ] **Step 3: Add warning banner in JSX**

Above the `<main>` tag:

```tsx
{zeigeVerbindungsBanner && (
  <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-4 py-2 text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
    <span>⚠️</span>
    <span>Verbindung unterbrochen — wird automatisch erneut versucht...</span>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/DurchfuehrenDashboard.tsx
git commit -m "fix(monitoring): Verbindungsverlust als Banner statt Crash (F1)"
```

---

## Task 6: Korrektur-Autosave (F2)

**Files:**
- Create: `src/hooks/useKorrekturAutoSave.ts`
- Modify: `src/services/autoSave.ts`
- Modify: `src/components/lp/KorrekturDashboard.tsx`

- [ ] **Step 1: Extend autoSave.ts — Korrektur-Store**

Add to `autoSave.ts`:

```typescript
const IDB_KORREKTUR_STORE = 'korrektur'

// openDB erweitern: zweiten Store anlegen
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 2) // Version bump!
    request.onupgradeneeded = (event) => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
      if (!db.objectStoreNames.contains(IDB_KORREKTUR_STORE)) {
        db.createObjectStore(IDB_KORREKTUR_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveKorrekturToIndexedDB(pruefungId: string, data: unknown): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_KORREKTUR_STORE, 'readwrite')
    tx.objectStore(IDB_KORREKTUR_STORE).put({ data, timestamp: new Date().toISOString() }, pruefungId)
    await new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
  } catch (e) { console.warn('IndexedDB Korrektur-Save fehlgeschlagen:', e) }
}

export async function loadKorrekturFromIndexedDB(pruefungId: string): Promise<{ data: unknown; timestamp: string } | null> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_KORREKTUR_STORE, 'readonly')
    const request = tx.objectStore(IDB_KORREKTUR_STORE).get(pruefungId)
    return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result ?? null); request.onerror = () => reject(request.error) })
  } catch { return null }
}

export async function clearKorrekturIndexedDB(pruefungId: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_KORREKTUR_STORE, 'readwrite')
    tx.objectStore(IDB_KORREKTUR_STORE).delete(pruefungId)
  } catch (e) { console.warn('IndexedDB Korrektur-Clear fehlgeschlagen:', e) }
}
```

- [ ] **Step 2: Create useKorrekturAutoSave.ts**

```typescript
import { useEffect, useRef, useCallback } from 'react'
import { saveKorrekturToIndexedDB } from '../services/autoSave'
import { apiService } from '../services/apiService'
import type { KorrekturZeileUpdate } from '../types/korrektur'

interface AutoSaveOptions {
  pruefungId: string
  email: string
  korrekturDaten: unknown
  debounceMs?: number
}

export function useKorrekturAutoSave({ pruefungId, email, korrekturDaten, debounceMs = 3000 }: AutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<KorrekturZeileUpdate[]>([])

  // IndexedDB-Backup alle 10s
  useEffect(() => {
    const interval = setInterval(() => {
      saveKorrekturToIndexedDB(pruefungId, korrekturDaten)
    }, 10000)
    return () => clearInterval(interval)
  }, [pruefungId, korrekturDaten])

  // Debounced remote save
  const queueSave = useCallback((update: KorrekturZeileUpdate) => {
    pendingUpdates.current.push(update)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const updates = [...pendingUpdates.current]
      pendingUpdates.current = []

      for (const u of updates) {
        await apiService.speichereKorrekturZeile(u, email)
      }
    }, debounceMs)
  }, [email, debounceMs])

  // Cleanup
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { queueSave }
}
```

- [ ] **Step 3: Integrate in KorrekturDashboard**

Replace fire-and-forget `apiService.speichereKorrekturZeile()` calls in `handleBewertungUpdate` with `queueSave()`:

```typescript
const { queueSave } = useKorrekturAutoSave({
  pruefungId,
  email: user?.email ?? '',
  korrekturDaten: korrektur,
})

// In handleBewertungUpdate: replace apiService.speichereKorrekturZeile() with:
queueSave({ pruefungId, schuelerEmail, frageId, ...updates })
```

- [ ] **Step 4: Commit**

```bash
git add src/services/autoSave.ts src/hooks/useKorrekturAutoSave.ts src/components/lp/KorrekturDashboard.tsx
git commit -m "feat(korrektur): Autosave mit Debounce + IndexedDB-Backup (F2)"
```

---

## Task 7: Quick-Wins — F7, F8 (Lobby)

**Files:**
- Modify: `src/components/Startbildschirm.tsx`

- [ ] **Step 1: F7 — Lobby-Feedback nach erfolgreichem Heartbeat**

Add state + update in Startbildschirm.tsx:

```typescript
const [heartbeatErfolgreich, setHeartbeatErfolgreich] = useState(false)

// Im Polling-Interval, nach erfolgreichem Heartbeat:
if (heartbeatResult.status === 'fulfilled' && heartbeatResult.value?.success) {
  setHeartbeatErfolgreich(true)
}
```

In der Warteraum-UI, Status-Text ersetzen:

```tsx
<p className="text-slate-500 dark:text-slate-400">
  {heartbeatErfolgreich
    ? '✓ Verbunden — warte auf Freischaltung durch Lehrperson'
    : 'Verbinde mit Prüfungsserver...'}
</p>
```

- [ ] **Step 2: F8 — Polling auf 2s verkürzen**

```typescript
// Zeile mit setInterval(..., 3000) ändern auf:
const interval = setInterval(async () => { /* ... */ }, 2000)
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Startbildschirm.tsx
git commit -m "fix(sus): Lobby-Feedback + schnelleres Polling (F7, F8)"
```

---

## Task 8: Quick-Wins — F10, F11, F12 (Icons, PDF, Tab-Link)

**Files:**
- Modify: `src/components/fragetypen/pdf/PDFToolbar.tsx`
- Modify: `src/components/MaterialPanel.tsx`

- [ ] **Step 1: F10 — Highlighter-Icon ersetzen**

In `PDFToolbar.tsx` (Zeile 41), `icon: '🖍'` ersetzen mit einem SVG das Textanstreichen darstellt:

```typescript
{ id: 'highlighter', icon: '▬', label: 'Markieren' },
```

Oder besser: Mini-SVG-Komponente mit einer horizontalen Linie und einem Marker-Symbol. Inline als JSX rendern statt als String-Icon. Dann muss die Render-Logik angepasst werden (String → ReactNode).

Alternative: Unicode-Zeichen `🖊` (Stift) oder ein einfaches `<span>` mit farbigem Hintergrund als visueller Marker.

Entscheidung: Am einfachsten ein `<span>` mit visueller Marker-Darstellung:
```tsx
// Statt icon-String: Funktion die JSX zurückgibt
{ id: 'highlighter', icon: <span className="inline-block w-4 h-1.5 bg-yellow-400 rounded-sm" />, label: 'Markieren' },
```

Falls `icon` aktuell als String gerendert wird, muss die Render-Stelle auf `ReactNode` umgestellt werden.

- [ ] **Step 2: F11 — PDF-Höhe im Split-Modus**

In `MaterialPanel.tsx` (Zeile 294-296), iframe-Klasse ergänzen:

```tsx
<iframe
  src={material.url}
  className="flex-1 w-full border-0 min-h-[200px] md:min-h-[300px]"
  title={material.titel}
  sandbox="allow-scripts allow-same-origin"
/>
```

Auch für Drive-Embed-iframes (Zeilen 254-264) die gleiche `min-h` ergänzen.

Container-Check: Parent muss `h-full` oder definierte Höhe haben. Falls nötig, `h-[calc(100vh-200px)]` auf den Split-Container setzen.

- [ ] **Step 3: F12 — "In neuem Tab öffnen" nur für LP**

In `MaterialPanel.tsx` (Zeile 285-292), den Link conditional rendern:

```tsx
import { useAuthStore } from '../store/authStore'

// Im Component:
const user = useAuthStore(s => s.user)

// Statt immer den Link zu zeigen:
{user?.rolle === 'lp' && (
  <a href={material.url} target="_blank" rel="noopener noreferrer"
    className="text-blue-500 dark:text-blue-400 hover:underline ml-auto">
    In neuem Tab öffnen ↗
  </a>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/fragetypen/pdf/PDFToolbar.tsx src/components/MaterialPanel.tsx
git commit -m "fix(ux): Highlighter-Icon, PDF-Höhe, Tab-Link nur LP (F10, F11, F12)"
```

---

## Task 9: Quick-Win — F14 (Beenden 1-Klick)

**Files:**
- Modify: `src/components/lp/BeendenDialog.tsx`

- [ ] **Step 1: Vereinfachter Dialog bei 0 aktiven SuS**

In `BeendenDialog.tsx` (ca. Zeile 83-92), den Block für `anzahlAktiv === 0` ersetzen:

```tsx
if (anzahlAktiv === 0) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Prüfung beenden</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Alle SuS haben bereits abgegeben.
        </p>
        <textarea
          rows={2}
          value={bemerkung}
          onChange={(e) => setBemerkung(e.target.value)}
          placeholder="Bemerkungen (optional)..."
          className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm mb-4 resize-none"
        />
        {fehler && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{fehler}</p>}
        <div className="flex gap-3">
          <button onClick={onAbbrechen} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-medium text-sm">
            Abbrechen
          </button>
          <button onClick={handleBeenden} disabled={lade}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 rounded-lg cursor-pointer font-medium text-sm disabled:opacity-50">
            {lade ? 'Wird beendet...' : 'Prüfung beenden'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/lp/BeendenDialog.tsx
git commit -m "fix(ux): Beenden 1-Klick wenn alle SuS abgegeben (F14)"
```

---

## Task 10: Fortschritt schneller anzeigen (F9)

**Files:**
- Modify: `apps-script-code.js`
- Modify: `src/components/lp/DurchfuehrenDashboard.tsx`

- [ ] **Step 1: Backend — Heartbeat persistiert aktuelleFrage**

In `apps-script-code.js`, im `heartbeat`-Endpoint: `aktuelleFrage` in die Monitoring-Spalte schreiben.

```javascript
// Im heartbeat case:
const fortschritt = params.aktuelleFrage ?? null
// In die Zeile des SuS im Antworten-Sheet schreiben:
// ensureColumns(sheet, ['aktuelleFrage'])
// ... Zelle setzen
```

- [ ] **Step 2: Frontend — Fortschritt aus Monitoring darstellen**

In `DurchfuehrenDashboard.tsx`, Mapping (Zeile 155-157): `aktuelleFrage` ist bereits gemapped. Wird schon im Monitoring angezeigt. Prüfen ob das Feld aus dem Backend kommt.

- [ ] **Step 3: Commit**

```bash
git add apps-script-code.js src/components/lp/DurchfuehrenDashboard.tsx
git commit -m "feat(monitoring): Fortschritt via Heartbeat statt Autosave (F9)"
```

---

## Task 11: F13 Investigation (MC-Frage nicht beantwortet)

**Files:**
- Modify: `src/utils/antwortStatus.ts` (eventuell)
- Modify: `src/store/pruefungStore.ts` (eventuell)

- [ ] **Step 1: Einrichtungsprüfung starten + Frage 15 testen**

Manuell oder via Import-Script: Einrichtungsprüfung laden, als SuS einloggen, zu Frage 15 navigieren, MC-Option auswählen.

- [ ] **Step 2: State inspizieren**

Browser DevTools → Zustand Store auslesen:
- `antworten['einr-ag-material-mc']` vorhanden?
- `istVollstaendigBeantwortet()` prüfen

- [ ] **Step 3: Root Cause identifizieren + Fix**

Hypothesen prüfen:
1. Aufgabengruppe: Key-Mismatch
2. Material-Split blockiert Mount
3. Race Condition bei Teilaufgaben-Nachladen

Fix implementieren basierend auf Befund.

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(sus): MC-Frage in Aufgabengruppe korrekt als beantwortet markieren (F13)"
```

---

## Task 12: Korrektur-Status in Übersicht (F15)

**Files:**
- Modify: `src/components/lp/TrackerSection.tsx`
- Modify: `apps-script-code.js`

- [ ] **Step 1: Backend — neuer Endpoint ladeKorrekturStatus**

```javascript
// In apps-script-code.js:
case 'ladeKorrekturStatus': {
  const pruefungId = params.pruefungId || params.id
  const korrekturSheet = findSheet(pruefungId + '_korrektur')
  if (!korrekturSheet) return jsonResponse({ korrigiert: 0, offen: 0, gesamt: 0 })

  const daten = korrekturSheet.getDataRange().getValues()
  const header = daten[0]
  const geprueftCol = header.indexOf('geprueft')

  let korrigiert = 0
  for (let i = 1; i < daten.length; i++) {
    if (daten[i][geprueftCol] === true || daten[i][geprueftCol] === 'true') korrigiert++
  }

  return jsonResponse({ korrigiert, offen: daten.length - 1 - korrigiert, gesamt: daten.length - 1 })
}
```

- [ ] **Step 2: Frontend — TrackerSection erweitern**

In `TrackerSection.tsx`, Kennzahl "Korrigiert" hinzufügen:

```tsx
<KennzahlBox label="Korrigiert" wert={`${korrekturStatus.korrigiert}/${korrekturStatus.gesamt}`}
  farbe={korrekturStatus.korrigiert === korrekturStatus.gesamt ? 'gruen' : 'amber'} />
```

Status-Badge pro Prüfung: "offen" | "in Korrektur" | "korrigiert"

- [ ] **Step 3: Commit**

```bash
git add src/components/lp/TrackerSection.tsx apps-script-code.js
git commit -m "feat(tracker): Korrektur-Status in Prüfungsübersicht (F15)"
```

---

## Task 13: Apps Script gebündelt deployen

- [ ] **Step 1: Alle Backend-Änderungen prüfen**

Zusammenfassung aller `apps-script-code.js` Änderungen:
- Task 3: `ensureColumns` für KI-Felder
- Task 4: `musterlosung` + `materialien` in `ladeFragen`
- Task 10: `aktuelleFrage` in Heartbeat persistieren
- Task 12: Neuer Endpoint `ladeKorrekturStatus`

- [ ] **Step 2: User informieren**

```
HINWEIS: apps-script-code.js wurde aktualisiert.
Bitte den Code in den Apps Script Editor kopieren:
1. https://script.google.com/ öffnen
2. Code ersetzen
3. "Bereitstellungen verwalten" → bestehende Version aktualisieren (Stift-Icon)
4. NICHT "Neue Bereitstellung" (ändert URL!)
```

- [ ] **Step 3: Final commit + push**

```bash
git add -A
git commit -m "F1-F15: LP-Live-Test-Feedback komplett"
git push
```

---

## Task 14: HANDOFF.md aktualisieren

- [ ] **Step 1: F1-F15 Status-Tabelle aktualisieren**

Alle 15 Punkte auf ✅ ERLEDIGT setzen (oder jeweiligen Status wenn Investigation noch offen).

- [ ] **Step 2: Commit + Push**

```bash
git add ExamLab/HANDOFF.md
git commit -m "docs: HANDOFF.md — F1-F15 Status aktualisiert"
git push
```
