# Bundle 3 — Übungs-Themen UX Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 UX-Verbesserungen im Übungsbereich: konfigurierbares Themen-Limit, SuS-Sortierung mit Sektionen, LP-Status-Differenzierung, Einstellungen ins globale Panel verschieben.

**Architecture:** Zustand-Stores für State, React-Komponenten für UI. Bestehende Adapter-Hooks und Settings-Sync-Patterns wiederverwenden. Keine Backend-Änderungen nötig.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Vitest

**Spec:** `docs/superpowers/specs/2026-04-13-bundle3-uebungs-themen-ux-design.md`

---

## File Structure

### Modifizierte Dateien

| Datei | Änderung |
|-------|----------|
| `src/types/ueben/themenSichtbarkeit.ts` | `MAX_AKTIVE_THEMEN` entfernen |
| `src/types/ueben/settings.ts` | `maxAktiveThemen` Feld hinzufügen |
| `src/store/ueben/themenSichtbarkeitStore.ts` | FIFO-Logik: Limit aus settingsStore lesen |
| `src/store/lpUIStore.ts` | `EinstellungenTab` um `'uebungen'` erweitern |
| `src/components/settings/EinstellungenPanel.tsx` | Tab "Übungen" hinzufügen |
| `src/components/ueben/admin/AdminDashboard.tsx` | Tab "Einstellungen" entfernen |
| `src/components/ueben/admin/AdminThemensteuerung.tsx` | Dynamisches Limit + Status-Styling |
| `src/components/ueben/admin/settings/AllgemeinTab.tsx` | Max-Themen-Input hinzufügen |
| `src/components/ueben/Dashboard.tsx` | Sektionen + Sortier-Toggle |

### Keine neuen Dateien nötig

---

## Task 0: Feature Branch erstellen

- [ ] **Step 1: Branch erstellen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout -b feature/bundle3-uebungs-themen-ux
```

---

## Task 1: N14 — Einstellungen ins globale EinstellungenPanel verschieben

**Files:**
- Modify: `src/store/lpUIStore.ts:7` (EinstellungenTab type)
- Modify: `src/components/settings/EinstellungenPanel.tsx:36-41` (tabs array)
- Modify: `src/components/ueben/admin/AdminDashboard.tsx` (Tab + Ansicht entfernen)

- [ ] **Step 1: EinstellungenTab-Type erweitern**

In `src/store/lpUIStore.ts` Zeile 7:

```typescript
// Vorher:
export type EinstellungenTab = 'profil' | 'lernziele' | 'favoriten' | 'admin'

// Nachher:
export type EinstellungenTab = 'profil' | 'lernziele' | 'favoriten' | 'uebungen' | 'admin'
```

- [ ] **Step 2: Tab "Übungen" in EinstellungenPanel einfügen**

In `src/components/settings/EinstellungenPanel.tsx`:

Import hinzufügen:
```typescript
import AdminSettings from '../ueben/admin/AdminSettings'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
```

Im Komponenten-Body (nach den bestehenden Hooks):
```typescript
const aktiveGruppe = useUebenGruppenStore(s => s.aktiveGruppe)
```

Im `tabs`-Array (Zeile 36-41), neuen Eintrag vor `admin` einfügen:
```typescript
const tabs: { key: EinstellungenTab; label: string; sichtbar: boolean }[] = [
  { key: 'profil', label: 'Mein Profil', sichtbar: true },
  { key: 'lernziele', label: 'Lernziele', sichtbar: true },
  { key: 'favoriten', label: 'Favoriten', sichtbar: true },
  { key: 'uebungen', label: 'Übungen', sichtbar: !!aktiveGruppe },
  { key: 'admin', label: 'Admin', sichtbar: admin },
]
```

Im Render-Bereich (dort wo `tab === 'admin'` geprüft wird), neuen Case einfügen:
```typescript
{tab === 'uebungen' && <AdminSettings />}
```

- [ ] **Step 3: Tab "Einstellungen" aus AdminDashboard entfernen**

In `src/components/ueben/admin/AdminDashboard.tsx`:

`AdminAnsicht`-Type ändern — `| { typ: 'einstellungen' }` entfernen:
```typescript
type AdminAnsicht = 
  | { typ: 'uebersicht' }
  | { typ: 'auftraege' }
  | { typ: 'themensteuerung' }
  | { typ: 'kind'; email: string; name: string }
  | { typ: 'thema'; email: string; name: string; fach: string; thema: string }
```

Tab-Button "Einstellungen" aus dem Tab-Bar-Rendering entfernen. AdminSettings-Import entfernen. Den `ansicht.typ === 'einstellungen'`-Case aus dem Render-Switch entfernen.

Zusätzlich: `istHauptTab`-Variable aktualisieren — `|| ansicht.typ === 'einstellungen'` entfernen:
```typescript
// Vorher:
const istHauptTab = ansicht.typ === 'uebersicht' || ansicht.typ === 'auftraege' || ansicht.typ === 'themensteuerung' || ansicht.typ === 'einstellungen'

// Nachher:
const istHauptTab = ansicht.typ === 'uebersicht' || ansicht.typ === 'auftraege' || ansicht.typ === 'themensteuerung'
```

- [ ] **Step 4: TypeScript-Check**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx tsc -b`
Expected: Keine Fehler

- [ ] **Step 5: Tests laufen lassen**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx vitest run`
Expected: 227 Tests grün

- [ ] **Step 6: Commit**

```bash
git add src/store/lpUIStore.ts src/components/settings/EinstellungenPanel.tsx src/components/ueben/admin/AdminDashboard.tsx
git commit -m "N14: Übungs-Einstellungen ins globale EinstellungenPanel verschoben"
```

---

## Task 2: N9 — Konfigurierbares Limit aktuelle Themen

**Files:**
- Modify: `src/types/ueben/settings.ts` (maxAktiveThemen Feld)
- Modify: `src/types/ueben/themenSichtbarkeit.ts` (Konstante entfernen)
- Modify: `src/store/ueben/themenSichtbarkeitStore.ts` (FIFO-Logik)
- Modify: `src/components/ueben/admin/AdminThemensteuerung.tsx` (dynamische Anzeige)
- Modify: `src/components/ueben/admin/settings/AllgemeinTab.tsx` (UI für Setting)

- [ ] **Step 1: maxAktiveThemen in Settings-Type hinzufügen**

In `src/types/ueben/settings.ts`, im Interface `GruppenEinstellungen`:
```typescript
maxAktiveThemen: number
```

In den Default-Konstanten `DEFAULT_GYM` und `DEFAULT_FAMILIE`:
```typescript
maxAktiveThemen: 5,
```

- [ ] **Step 2: MAX_AKTIVE_THEMEN-Konstante entfernen**

In `src/types/ueben/themenSichtbarkeit.ts`:
```typescript
// Diese Zeile entfernen:
export const MAX_AKTIVE_THEMEN = 3
```

- [ ] **Step 3: Alle Imports von MAX_AKTIVE_THEMEN finden und entfernen**

Run: `grep -rn "MAX_AKTIVE_THEMEN" src/`

Jeden Import entfernen. Die Stellen werden in den folgenden Steps durch die neue Logik ersetzt.

- [ ] **Step 4: FIFO-Logik in themenSichtbarkeitStore anpassen**

In `src/store/ueben/themenSichtbarkeitStore.ts`, in der `setzeStatus`-Methode:

Den Import von `MAX_AKTIVE_THEMEN` entfernen. Stattdessen das Limit aus dem settingsStore lesen:

```typescript
import { useUebenSettingsStore } from './settingsStore'
```

In der FIFO-Logik (wo `MAX_AKTIVE_THEMEN` direkt in der Vergleichsanweisung verwendet wird):
```typescript
// Vorher (Zeile 74-75, MAX_AKTIVE_THEMEN direkt in if-Bedingung):
if (aktive.length > MAX_AKTIVE_THEMEN)

// Nachher:
const maxAktive = useUebenSettingsStore.getState().einstellungen?.maxAktiveThemen ?? 5
if (aktive.length > maxAktive)
```

Alle Stellen wo `MAX_AKTIVE_THEMEN` vorkommt durch `maxAktive` ersetzen. Rest der FIFO-Logik bleibt identisch.

- [ ] **Step 5: AdminThemensteuerung — dynamisches Limit**

In `src/components/ueben/admin/AdminThemensteuerung.tsx`:

Import von `MAX_AKTIVE_THEMEN` entfernen. Stattdessen:
```typescript
import { useUebenSettingsStore } from '../../../store/ueben/settingsStore'
```

Im Komponenten-Body:
```typescript
const maxAktiveThemen = useUebenSettingsStore(s => s.einstellungen?.maxAktiveThemen ?? 5)
```

Alle Stellen wo `MAX_AKTIVE_THEMEN` verwendet wird durch `maxAktiveThemen` ersetzen (Anzeige `{n}/{max}`, Amber-Warnung).

- [ ] **Step 6: AllgemeinTab — UI für Max-Themen-Setting**

In `src/components/ueben/admin/settings/AllgemeinTab.tsx`, nach dem letzten Einstellungs-Block (vor dem Speichern-Button, ca. Zeile 224), neuen Abschnitt einfügen. Styling analog zu den bestehenden Blöcken (`bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700`):

```tsx
{/* Max aktuelle Themen */}
<div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
  <h4 className="font-medium mb-1">Maximale aktuelle Themen</h4>
  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
    Wie viele Themen dürfen gleichzeitig als «aktuell» markiert sein?
    Bei Überschreitung wird das älteste automatisch freigegeben.
  </p>
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={1}
      max={20}
      value={einstellungen.maxAktiveThemen ?? 5}
      onChange={e => aktualisiereEinstellungen({ maxAktiveThemen: Number(e.target.value) })}
      className="flex-1"
    />
    <span className="text-sm font-mono w-8 text-center">
      {einstellungen.maxAktiveThemen ?? 5}
    </span>
  </div>
</div>
```

Muster: Identisch wie Mastery-Schwellwerte (Zeile 196-223).

- [ ] **Step 7: TypeScript-Check + Tests**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx tsc -b && npx vitest run`
Expected: Keine TS-Fehler, 227 Tests grün

- [ ] **Step 8: Commit**

```bash
git add src/types/ueben/settings.ts src/types/ueben/themenSichtbarkeit.ts src/store/ueben/themenSichtbarkeitStore.ts src/components/ueben/admin/AdminThemensteuerung.tsx src/components/ueben/admin/settings/AllgemeinTab.tsx
git commit -m "N9: Konfigurierbares Limit aktuelle Themen (Default 5, FIFO beibehalten)"
```

---

## Task 3: N12 — LP-Status-Differenzierung

**Files:**
- Modify: `src/components/ueben/admin/AdminThemensteuerung.tsx`

- [ ] **Step 1: Nicht freigeschaltete Themen stylen**

In `src/components/ueben/admin/AdminThemensteuerung.tsx`, dort wo die Thema-Zeilen gerendert werden:

Für jede Thema-Zeile den Status prüfen und styling anpassen:

```tsx
// Wrapper-div der Thema-Zeile:
<div className={`... ${status === 'nicht_freigeschaltet' ? 'opacity-70' : ''}`}>
```

Vor dem Themennamen ein 🔒-Icon einfügen wenn `status === 'nicht_freigeschaltet'`:
```tsx
{status === 'nicht_freigeschaltet' && <span className="mr-1">🔒</span>}
<span>{thema}</span>
```

Kein Status-Badge für `nicht_freigeschaltet` (bestehende Logik zeigt bereits kein Badge, nur verifizieren).

- [ ] **Step 2: TypeScript-Check + Tests**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx tsc -b && npx vitest run`
Expected: Keine Fehler

- [ ] **Step 3: Commit**

```bash
git add src/components/ueben/admin/AdminThemensteuerung.tsx
git commit -m "N12: LP-Status-Differenzierung (opacity 70% + Lock-Icon für nicht freigeschaltete)"
```

---

## Task 4: N11 — SuS-Sortierung mit Sektionen

**Files:**
- Modify: `src/components/ueben/Dashboard.tsx`

- [ ] **Step 1: Sortier-State und localStorage-Persist hinzufügen**

In `src/components/ueben/Dashboard.tsx`, am Anfang der Komponente:

```typescript
const [sortierung, setSortierung] = useState<'alphabetisch' | 'zuletztGeuebt'>(() => {
  try {
    const gespeichert = localStorage.getItem('examlab-ueben-sortierung')
    if (gespeichert === 'zuletztGeuebt') return 'zuletztGeuebt'
  } catch { /* ignorieren */ }
  return 'alphabetisch'
})

const handleSortierungAendern = (neu: 'alphabetisch' | 'zuletztGeuebt') => {
  setSortierung(neu)
  try { localStorage.setItem('examlab-ueben-sortierung', neu) } catch { /* ignorieren */ }
}
```

- [ ] **Step 2: "Zuletzt geübt"-Timestamps berechnen**

Neues `useMemo` für letzte Übungszeitpunkte pro Thema. Wichtig: `fortschritte` ist bereits via `useUebenFortschrittStore()` subscribed (Zeile 60 im Dashboard) — NICHT `getState()` verwenden, da sonst Änderungen nicht reaktiv sind.

```typescript
// fortschritte ist bereits destructured aus useUebenFortschrittStore() (Zeile 60)
const letzteUebungProThema = useMemo(() => {
  const map = new Map<string, string>() // "fach|thema" → ISO-Timestamp
  for (const f of Object.values(fortschritte)) {
    if (!f.letzterVersuch) continue
    for (const thema of sichtbareThemenListe) {
      const gehoertZuThema = thema.fragen.some(frage => frage.id === f.fragenId)
      if (gehoertZuThema) {
        const key = `${thema.fach}|${thema.thema}`
        const bisheriger = map.get(key)
        if (!bisheriger || f.letzterVersuch > bisheriger) {
          map.set(key, f.letzterVersuch)
        }
      }
    }
  }
  return map
}, [sichtbareThemenListe, fortschritte])
```

- [ ] **Step 3: Themen in Sektionen aufteilen**

Neues `useMemo` das `sichtbareThemenListe` in Sektionen aufteilt:

```typescript
const themenSektionen = useMemo(() => {
  const aktuelle: ThemenInfo[] = []
  const freigegebeneNachFach = new Map<string, ThemenInfo[]>()

  for (const t of sichtbareThemenListe) {
    const status = freischaltungen.length > 0 ? getStatus(t.fach, t.thema) : 'abgeschlossen'
    if (status === 'aktiv') {
      aktuelle.push(t)
    } else if (status === 'abgeschlossen') {
      const liste = freigegebeneNachFach.get(t.fach) ?? []
      liste.push(t)
      freigegebeneNachFach.set(t.fach, liste)
    }
    // nicht_freigeschaltet: nur bei "Alle Themen anzeigen" → werden via sichtbareThemenListe bereits gefiltert
  }

  // Sortierung anwenden
  const sortiereFn = (a: ThemenInfo, b: ThemenInfo) => {
    if (sortierung === 'zuletztGeuebt') {
      const tA = letzteUebungProThema.get(`${a.fach}|${a.thema}`) ?? ''
      const tB = letzteUebungProThema.get(`${b.fach}|${b.thema}`) ?? ''
      if (tA !== tB) return tB.localeCompare(tA) // neueste zuerst
    }
    return a.thema.localeCompare(b.thema)
  }

  aktuelle.sort(sortiereFn)
  for (const [fach, themen] of freigegebeneNachFach) {
    themen.sort(sortiereFn)
  }

  // Fächer alphabetisch sortieren
  const faecherSortiert = [...freigegebeneNachFach.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return { aktuelle, faecherSortiert }
}, [sichtbareThemenListe, freischaltungen, sortierung, letzteUebungProThema, getStatus])
```

- [ ] **Step 4: Rendering umbauen — Sortier-Toggle + Sektionen**

Das bestehende Grid-Rendering der Themen-Karten ersetzen durch Sektions-basiertes Layout:

```tsx
{/* Sortier-Toggle */}
<div className="flex justify-end mb-3">
  <select
    value={sortierung}
    onChange={e => handleSortierungAendern(e.target.value as 'alphabetisch' | 'zuletztGeuebt')}
    className="text-sm border rounded px-2 py-1 dark:bg-slate-800 dark:border-slate-600"
  >
    <option value="alphabetisch">Alphabetisch</option>
    <option value="zuletztGeuebt">Zuletzt geübt</option>
  </select>
</div>

{/* Sektion: Aktuelle Themen */}
{themenSektionen.aktuelle.length > 0 && (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
      ★ Aktuelle Themen
    </h3>
    <div className="grid gap-3 sm:grid-cols-2">
      {themenSektionen.aktuelle.map(thema => (
        <ThemaKarte key={`${thema.fach}-${thema.thema}`} /* alle bestehenden Props wie in aktuellem Rendering (Zeile 489-501): thema, fach, anzahlFragen, fortschritt, fachFarben, onClick etc. */ themenStatus="aktiv" />
      ))}
    </div>
  </div>
)}

{/* Sektionen: Pro Fach */}
{themenSektionen.faecherSortiert.map(([fach, themen]) => (
  <div key={fach} className="mb-6">
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getFachFarbe(fach, fachFarben) }} />
      {fach}
    </h3>
    <div className="grid gap-3 sm:grid-cols-2">
      {themen.map(thema => (
        <ThemaKarte key={`${thema.fach}-${thema.thema}`} /* alle bestehenden Props wie in aktuellem Rendering (Zeile 489-501): thema, fach, anzahlFragen, fortschritt, fachFarben, onClick etc. */ themenStatus="abgeschlossen" />
      ))}
    </div>
  </div>
))}
```

Die bestehenden ThemaKarte-Props (onClick, fortschritt, fachFarbe, etc.) beibehalten — nur das Mapping-Pattern anpassen.

- [ ] **Step 5: "Alle Themen anzeigen" kompatibel halten**

Wenn `alleThemenAnzeigen === true`, werden auch `nicht_freigeschaltet`-Themen angezeigt. Diese in eine dritte Sektion "Weitere Themen" am Ende einfügen (mit opacity-60 wie für SuS).

In `themenSektionen`-Memo ergänzen:
```typescript
const weitere: ThemenInfo[] = [] // für nicht_freigeschaltet
// ... im Loop:
if (status === 'nicht_freigeschaltet') {
  weitere.push(t)
}
// ...
return { aktuelle, faecherSortiert, weitere }
```

Rendering:
```tsx
{themenSektionen.weitere.length > 0 && (
  <div className="mb-6 opacity-60">
    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
      🔒 Weitere Themen
    </h3>
    <div className="grid gap-3 sm:grid-cols-2">
      {themenSektionen.weitere.map(thema => (
        <ThemaKarte key={`${thema.fach}-${thema.thema}`} /* props */ themenStatus="nicht_freigeschaltet" />
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 6: TypeScript-Check + Tests**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx tsc -b && npx vitest run`
Expected: Keine Fehler

- [ ] **Step 7: Commit**

```bash
git add src/components/ueben/Dashboard.tsx
git commit -m "N11: SuS-Sortierung mit Sektionen (aktuelle oben, Fach-Gruppierung, Sortier-Toggle)"
```

---

## Task 5: Abschluss — Build + HANDOFF

- [ ] **Step 1: Vollständiger Build**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx tsc -b && npx vitest run && npm run build`
Expected: Alles grün

- [ ] **Step 2: HANDOFF.md aktualisieren**

Neue Session 100 eintragen mit:
- Stand: Auf Branch `feature/bundle3-uebungs-themen-ux`. tsc/Tests/Build Status.
- Erledigte Arbeiten: N14, N9, N12, N11 mit betroffenen Dateien
- Bundle 3 in der offenen Punkte-Tabelle als ✅ markieren

- [ ] **Step 3: Commit HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: Session 100 — Bundle 3 Übungs-Themen UX"
```
