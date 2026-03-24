# Backup-Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein "Backup exportieren"-Button der ein .xlsx mit Übersicht + Detail-Tabs pro SuS generiert.

**Architecture:** Neue Utility `backupExport.ts` nutzt SheetJS (lazy-loaded) für Excel-Generierung. Button in BeendetPhase und KorrekturDashboard, gleiche Funktion, phasenabhängige Daten.

**Tech Stack:** SheetJS (`xlsx`), TypeScript, React

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/utils/backupExport.ts` | Create | Excel-Generierung (Übersicht-Tab + SuS-Tabs) |
| `src/components/lp/BeendetPhase.tsx` | Modify | Backup-Button + Loading-State |
| `src/components/lp/DurchfuehrenDashboard.tsx` | Modify | `fragen` + `abgaben` an BeendetPhase weiterreichen |
| `src/components/lp/KorrekturDashboard.tsx` | Modify | Backup-Button neben bestehenden CSV-Buttons |

---

### Task 1: Install SheetJS Dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install xlsx**

```bash
cd Pruefung && npm install xlsx
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('xlsx'); console.log('OK')"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add xlsx (SheetJS) for Excel backup export"
```

---

### Task 2: Create backupExport.ts

**Files:**
- Create: `src/utils/backupExport.ts`

**Spec:** `docs/superpowers/specs/2026-03-24-backup-export-design.md`

- [ ] **Step 1: Create the export utility**

```typescript
// src/utils/backupExport.ts
import type { PruefungsConfig } from '../types/pruefung'
import type { Frage } from '../types/fragen'
import type { SchuelerAbgabe, PruefungsKorrektur, SchuelerKorrektur, FragenBewertung } from '../types/korrektur'
import { antwortAlsText } from './exportUtils'

export interface BackupExportInput {
  config: PruefungsConfig
  fragen: Frage[]
  abgaben: Record<string, SchuelerAbgabe>
  korrektur?: PruefungsKorrektur
}

/** Effektive Punkte: LP-Override hat Vorrang, sonst KI */
function effektivePunkte(b?: FragenBewertung): number | null {
  if (!b) return null
  return b.lpPunkte ?? b.kiPunkte ?? null
}

/** Effektiver Kommentar: LP-Override hat Vorrang, sonst KI-Feedback */
function effektiverKommentar(b?: FragenBewertung): string {
  if (!b) return ''
  return b.lpKommentar || b.kiFeedback || ''
}

/** Fragetext bereinigen (HTML/Markdown entfernen, kürzen) */
function bereinigterFragetext(frage: Frage, maxLen = 200): string {
  const raw = ('fragetext' in frage && typeof frage.fragetext === 'string')
    ? frage.fragetext
    : frage.id
  const clean = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean
}

/** Excel-Tab-Name bereinigen (max 31 Zeichen, ungültige Zeichen entfernen) */
function sichererTabName(name: string, benutzte: Set<string>): string {
  let clean = name.replace(/[[\]:*?/\\]/g, '').trim().slice(0, 31)
  if (!clean) clean = 'Unbekannt'
  let final = clean
  let counter = 2
  while (benutzte.has(final)) {
    final = clean.slice(0, 28) + ` (${counter})`
    counter++
  }
  benutzte.add(final)
  return final
}

/** Korrektur-Daten für einen SuS finden */
function findeBewertungen(
  email: string,
  korrektur?: PruefungsKorrektur
): Record<string, FragenBewertung> {
  if (!korrektur) return {}
  const sk = korrektur.schueler.find(s => s.email === email)
  return sk?.bewertungen ?? {}
}

function findeSchuelerKorrektur(
  email: string,
  korrektur?: PruefungsKorrektur
): SchuelerKorrektur | undefined {
  return korrektur?.schueler.find(s => s.email === email)
}

export async function exportiereBackupXlsx(input: BackupExportInput): Promise<void> {
  const XLSX = await import('xlsx')
  const { config, fragen, abgaben, korrektur } = input

  const wb = XLSX.utils.book_new()
  const benutzteTabs = new Set<string>()
  benutzteTabs.add('Übersicht')

  // === Alle SuS sammeln (aus abgaben + korrektur) ===
  const alleEmails = new Set<string>()
  Object.keys(abgaben).forEach(e => alleEmails.add(e))
  korrektur?.schueler.forEach(s => alleEmails.add(s.email))
  const emailListe = Array.from(alleEmails).sort()

  // === Tab 1: Übersicht ===
  const headerRow = [
    'Name', 'E-Mail', 'Klasse', 'Total', 'Max', 'Note',
    ...fragen.flatMap(f => [`${f.id} Pkt`, `${f.id} Kommentar`])
  ]
  const uebersichtDaten = [headerRow]

  for (const email of emailListe) {
    const abgabe = abgaben[email]
    const sk = findeSchuelerKorrektur(email, korrektur)
    const bewertungen = findeBewertungen(email, korrektur)
    const name = sk?.name || abgabe?.name || email
    const klasse = sk?.klasse || ''

    const total = sk ? sk.gesamtPunkte : null
    const max = sk ? sk.maxPunkte : null
    const note = sk?.noteOverride ?? sk?.note ?? null

    const fragenDaten = fragen.flatMap(f => {
      const b = bewertungen[f.id]
      return [effektivePunkte(b), effektiverKommentar(b)]
    })

    uebersichtDaten.push([
      name, email, klasse,
      total, max, note !== null ? note : '',
      ...fragenDaten,
    ])
  }

  const wsUebersicht = XLSX.utils.aoa_to_sheet(uebersichtDaten)
  XLSX.utils.book_append_sheet(wb, wsUebersicht, 'Übersicht')

  // === Tabs pro SuS ===
  for (const email of emailListe) {
    const abgabe = abgaben[email]
    const sk = findeSchuelerKorrektur(email, korrektur)
    const bewertungen = findeBewertungen(email, korrektur)
    const name = sk?.name || abgabe?.name || email
    const tabName = sichererTabName(name, benutzteTabs)

    const rows: (string | number | null)[][] = [
      ['#', 'Frage', 'Typ', 'Antwort', 'Punkte', 'Max', 'Kommentar']
    ]

    fragen.forEach((frage, idx) => {
      const antwort = abgabe?.antworten?.[frage.id]
      const b = bewertungen[frage.id]
      rows.push([
        idx + 1,
        bereinigterFragetext(frage),
        ('typ' in frage && typeof frage.typ === 'string') ? frage.typ : '?',
        antwort ? antwortAlsText(antwort, frage) : (abgabe ? '(leer)' : 'Keine Abgabe'),
        effektivePunkte(b),
        frage.punkte,
        effektiverKommentar(b),
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, tabName)
  }

  // === Download ===
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const titel = (config.titel || config.id || 'Pruefung').replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')
  a.href = url
  a.download = `${titel}_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/backupExport.ts
git commit -m "feat: add backupExport.ts — Excel backup generation with SheetJS"
```

---

### Task 3: Wire up DurchfuehrenDashboard → BeendetPhase

**Files:**
- Modify: `src/components/lp/DurchfuehrenDashboard.tsx` (lines ~206-220)
- Modify: `src/components/lp/BeendetPhase.tsx` (lines 1-6, 48-58)

- [ ] **Step 1: Extend BeendetPhase Props**

In `BeendetPhase.tsx`, change the Props interface (line 3-6):

```typescript
interface Props {
  config: PruefungsConfig
  schuelerStatus: SchuelerStatus[]
  fragen: Frage[]
  abgaben: Record<string, SchuelerAbgabe>
  korrektur?: PruefungsKorrektur
  onExportieren: () => void
}
```

Add imports:
```typescript
import type { Frage } from '../../types/fragen'
import type { SchuelerAbgabe, PruefungsKorrektur } from '../../types/korrektur'
import { exportiereBackupXlsx } from '../../utils/backupExport'
```

- [ ] **Step 2: Add Backup button in BeendetPhase**

After the existing "Ergebnisse exportieren" button (line ~58), add:

```typescript
const [backupLaden, setBackupLaden] = useState(false)

// In the JSX, after the existing button:
<button
  type="button"
  disabled={backupLaden}
  onClick={async () => {
    setBackupLaden(true)
    try {
      await exportiereBackupXlsx({ config, fragen, abgaben, korrektur })
    } catch (e) {
      console.error('[Backup] Export fehlgeschlagen:', e)
      alert('Backup-Export fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setBackupLaden(false)
    }
  }}
  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
>
  {backupLaden ? 'Exportiert…' : '📥 Backup exportieren'}
</button>
```

Add `useState` import if not present.

- [ ] **Step 3: Pass data from DurchfuehrenDashboard to BeendetPhase**

In `DurchfuehrenDashboard.tsx` (lines ~206-220), update the BeendetPhase component call:

```tsx
{activeTab === 'ergebnisse' && daten && (
  <BeendetPhase
    config={config}
    schuelerStatus={daten.schueler}
    fragen={fragen}
    abgaben={abgaben}
    onExportieren={() => {
      const csv = exportiereTeilnahmeCSV(config, daten.schueler)
      if (csv) {
        const dateiname = `${config.titel || config.id}_Teilnahme_${new Date().toISOString().slice(0, 10)}.csv`
        downloadCSV(csv, dateiname)
      }
    }}
  />
)}
```

Note: `fragen` and `abgaben` are already loaded in DurchfuehrenDashboard state (lines ~88-90). Just pass them.

- [ ] **Step 4: TypeScript check + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/BeendetPhase.tsx src/components/lp/DurchfuehrenDashboard.tsx
git commit -m "feat: add Backup button in BeendetPhase with fragen/abgaben passthrough"
```

---

### Task 4: Add Backup button in KorrekturDashboard

**Files:**
- Modify: `src/components/lp/KorrekturDashboard.tsx` (lines ~170-190, ~338-363)

- [ ] **Step 1: Add import and handler**

Add import at top:
```typescript
import { exportiereBackupXlsx } from '../../utils/backupExport'
```

Add handler next to `handleCSVExport` and `handleDetailExport` (around line 190):
```typescript
const [backupLaden, setBackupLaden] = useState(false)

async function handleBackupExport(): Promise<void> {
  if (!korrektur || !fragen.length) return
  setBackupLaden(true)
  try {
    await exportiereBackupXlsx({
      config: { titel: korrektur.pruefungTitel, id: pruefungId } as PruefungsConfig,
      fragen,
      abgaben,
      korrektur,
    })
  } catch (e) {
    console.error('[Backup] Export fehlgeschlagen:', e)
  } finally {
    setBackupLaden(false)
  }
}
```

Note: KorrekturDashboard may not have the full `config` object — construct a minimal one from `korrektur` fields. Check what's available and adapt.

- [ ] **Step 2: Add button in the UI**

After the existing CSV-Export buttons (around line 355), add:

```tsx
<button
  onClick={handleBackupExport}
  disabled={backupLaden || !korrektur}
  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
>
  {backupLaden ? 'Exportiert…' : '📥 Backup (.xlsx)'}
</button>
```

- [ ] **Step 3: TypeScript check + build**

```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/KorrekturDashboard.tsx
git commit -m "feat: add Backup button in KorrekturDashboard"
```

---

### Task 5: Manual Verification

- [ ] **Step 1: Start dev server**

```bash
cd Pruefung && npm run dev
```

- [ ] **Step 2: Test BeendetPhase export**

1. Login als Demo-LP
2. Demo-Prüfung → Durchführen → Tab "Ergebnisse"
3. Klick "Backup exportieren"
4. Verifiziere: .xlsx wird heruntergeladen mit Tab "Übersicht" + je 1 Tab pro Demo-SuS
5. Öffne in Excel/Numbers: Antworten lesbar, Punkte-Spalten leer (keine Korrektur)

- [ ] **Step 3: Test KorrekturDashboard export**

1. Demo-Prüfung → Tab "Korrektur"
2. Klick "Backup (.xlsx)"
3. Verifiziere: .xlsx mit befüllten Punkte- und Kommentar-Spalten

- [ ] **Step 4: Final commit + push**

```bash
git add -A && git commit -m "v1.1: Backup-Export als Excel (PT-1)" && git push
```
