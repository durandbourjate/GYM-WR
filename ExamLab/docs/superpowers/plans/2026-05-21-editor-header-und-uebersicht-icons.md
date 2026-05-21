# Editor-Header & Übersichts-Icons — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zwei unabhängige UI-Verbesserungen in ExamLab umsetzen — kompakte Aktions-Icons mit Löschen in der Prüfungs-/Übungs-Übersicht (Teil #3) und eine eigene Editor-Leiste im Prüfungs-Composer, damit die globale `TabKaskade` im Header die volle Breite bekommt (Teil #2).

**Architecture:** Beide Teile sind reine Frontend-Änderungen (React/TS). Teil #3 ersetzt Text-Buttons in `PruefungsKarte` durch Icon-Buttons nach dem etablierten `DetailKarte`-Muster, fädelt ein neues `onLoeschen`-Prop durch die zwei Ansichts-Komponenten bis `LPStartseite` und nutzt dort `BaseDialog` + die bestehende `apiService.loeschePruefung`-API. Teil #2 extrahiert die Composer-Tabzeile in eine neue Komponente `PruefungsComposerLeiste`, die Titel + Editor-Tabs + Speicher-Status + Aktions-Icons trägt; der globale Header (`LPAppHeaderContainer`) bekommt drei Props weniger.

**Tech Stack:** React 18, TypeScript (strict, `tsc -b`), Vite, Tailwind, Zustand, lucide-react, vitest + @testing-library/react.

---

## Kontext

- **Spec:** `ExamLab/docs/superpowers/specs/2026-05-21-design-trio-header-icons-lernziele-design.md` (genehmigt).
- Dieser Plan deckt **Teil #2 und Teil #3** der Spec ab. **Teil #4 («Lernziele bis Unterthema») ist NICHT Teil dieses Plans** — siehe unten.
- Reihenfolge laut Spec: erst #3 (kleiner, rein präsentational), dann #2.
- Ausgangs-Commit: `bbc2635` (`main` = `preview` = `HEAD`, working tree clean).

### Teil #4 — bewusst aufgeschoben

Die Spec nahm an, dass Editor und SuS-Anzeige dieselben Lernziel-Daten teilen. Eine Backend-Prüfung zeigt: es gibt **zwei getrennte Systeme** —

| | Editor (`LernzielTab`) | SuS-Anzeige (`LernzieleAkkordeon`/`MiniModal`) |
|---|---|---|
| Endpoint | `ladeLernziele` / `speichereLernziel` | `uebenLadeLernzieleV2` |
| Sheet | `Lehrplanziele` (in `LEHRPLAN_SHEET_ID`) | `Lernziele` (in `FRAGENSAMMLUNG_ID`) |

Ein im Editor erstelltes Lernziel erreicht die SuS-Anzeige nie. Der User hat «volle Backend-Bridge» gewählt — das ist eine eigene Architektur-Entscheidung (Source of Truth, Daten-Migration, Schema-Konflikt zwischen drei Lernziel-Schemata) und braucht eine eigene Brainstorming→Spec→Plan-Runde. Wird nach diesem Plan separat angegangen.

### Design-Entscheidungen

1. **Icon-Button-Stil:** Beide Teile nutzen exakt das `DetailKarte`-Muster: `p-2 rounded-md`, Icon `w-[18px] h-[18px]`, `title` + `aria-label`, Hover-Akzentfarbe, `transition-colors cursor-pointer`. Effektive Grösse ~34 px. Die Spec nennt «44 px Touch-Target»; `DetailKarte` (die zitierte Referenz) erreicht real 34 px und ist die etablierte, reviewte LP-Desktop-Norm. Die strikte 44-px-Regel gilt primär für die SuS-Prüfungs-UI auf iPads, nicht für LP-Desktop-Steuerelemente. Bewusste Abweichung — Konsistenz mit der Referenz schlägt hier den Richtwert.
2. **`onLoeschen` ist ein Pflicht-Prop** auf `PruefungsKarte` (analog `onBearbeiten`/`onDuplizieren`). Das Durchfädeln über `PruefungsKarte` → 2 Ansichten → `LPStartseite` ist über mehrere Dateien nicht commit-isoliert tsc-clean — deshalb ist Teil #3 **ein atomarer Task / ein Commit** (analog `.claude/rules/code-quality.md`, «TS-Field-Removal braucht atomic-bundle Commit»).
3. **Bottom-«Prüfung löschen»-Link entfällt:** In `PruefungsComposer` ersetzt das `Trash2`-Icon der neuen Leiste den bestehenden Text-Link am Seitenende (Z. 369–379). Doppelte Lösch-Trigger vermeiden.
4. **`onLoeschen`/`onDuplizieren` auf der Composer-Leiste sind optional:** Löschen + Duplizieren existieren nur bei bereits gespeicherten Prüfungen (`config` vorhanden). Die Leiste rendert die Icons nur, wenn der Callback gesetzt ist.
5. **Branching:** Pro Teil ein Branch (`feature/uebersicht-aktions-icons`, `feature/editor-header-leiste`), beide einzeln mergebar. KEIN direkter Commit auf `main` (siehe `.claude/rules/deployment-workflow.md`). Ausführung in einem Worktree (@superpowers:using-git-worktrees).

### File Structure

| Datei | Verantwortung | Aktion |
|---|---|---|
| `src/components/lp/startseite/PruefungsKarte.tsx` | Karten-Rendering inkl. Aktions-Icons | Modify |
| `src/components/lp/startseite/PruefungsKarte.test.tsx` | Unit-Tests der Karte | Modify |
| `src/components/lp/startseite/LPPruefungenAnsicht.tsx` | Prüfen-Liste, reicht Props durch | Modify |
| `src/components/lp/startseite/LPUebungenAnsicht.tsx` | Übungen-Liste, reicht Props durch | Modify |
| `src/components/lp/LPStartseite.tsx` | Eltern-Dispatcher, hält Lösch-Flow | Modify |
| `src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.tsx` | Editor-Leiste: Titel + Tabs + Status + Aktionen | **Create** |
| `src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.test.tsx` | Unit-Tests der Leiste | **Create** |
| `src/components/lp/vorbereitung/PruefungsComposer.tsx` | Composer, hängt Leiste ein, entschlackt Header | Modify |

---

## Task 1 — Teil #3: Aktions-Icons + Löschen in der Übersicht

**Atomarer Task, EIN Commit.** Touch: `PruefungsKarte.tsx`, `PruefungsKarte.test.tsx`, `LPPruefungenAnsicht.tsx`, `LPUebungenAnsicht.tsx`, `LPStartseite.tsx`.

**Files:**
- Modify: `src/components/lp/startseite/PruefungsKarte.tsx`
- Modify: `src/components/lp/startseite/PruefungsKarte.test.tsx`
- Modify: `src/components/lp/startseite/LPPruefungenAnsicht.tsx`
- Modify: `src/components/lp/startseite/LPUebungenAnsicht.tsx`
- Modify: `src/components/lp/LPStartseite.tsx`

Verwendet @superpowers:test-driven-development — Tests zuerst.

- [ ] **Step 1: Tests in `PruefungsKarte.test.tsx` erweitern**

Die 4 bestehenden Tests rufen `render(<PruefungsKarte ... onBearbeiten={noop} onDuplizieren={noop} />)`. Mit dem neuen Pflicht-Prop `onLoeschen` müssen alle 4 `onLoeschen={noop}` ergänzt bekommen. Zusätzlich `fireEvent` importieren und einen neuen `describe`-Block anhängen:

```tsx
// Import-Zeile 1 anpassen:
import { render, screen, fireEvent } from '@testing-library/react'
```

```tsx
// Die 4 bestehenden render(...)-Aufrufe um onLoeschen={noop} ergänzen, z.B.:
render(<PruefungsKarte config={mkConfig({ id: 'test-p1' })} onBearbeiten={noop} onDuplizieren={noop} onLoeschen={noop} />)
```

```tsx
// Neuer Block ans Datei-Ende:
describe('PruefungsKarte — Aktions-Icons', () => {
  it('ruft onBearbeiten beim Klick auf das Bearbeiten-Icon', () => {
    mockStammdatenStore.lpProfil = null
    const onBearbeiten = vi.fn()
    const cfg = mkConfig({ id: 'p1' })
    render(<PruefungsKarte config={cfg} onBearbeiten={onBearbeiten} onDuplizieren={noop} onLoeschen={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }))
    expect(onBearbeiten).toHaveBeenCalledWith(cfg)
  })

  it('ruft onDuplizieren beim Klick auf das Duplizieren-Icon', () => {
    mockStammdatenStore.lpProfil = null
    const onDuplizieren = vi.fn()
    const cfg = mkConfig({ id: 'p1' })
    render(<PruefungsKarte config={cfg} onBearbeiten={noop} onDuplizieren={onDuplizieren} onLoeschen={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    expect(onDuplizieren).toHaveBeenCalledWith(cfg)
  })

  it('ruft onLoeschen beim Klick auf das Löschen-Icon', () => {
    mockStammdatenStore.lpProfil = null
    const onLoeschen = vi.fn()
    const cfg = mkConfig({ id: 'p1' })
    render(<PruefungsKarte config={cfg} onBearbeiten={noop} onDuplizieren={noop} onLoeschen={onLoeschen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(onLoeschen).toHaveBeenCalledWith(cfg)
  })
})
```

- [ ] **Step 2: Test laufen lassen → muss fehlschlagen**

Run: `npx vitest run src/components/lp/startseite/PruefungsKarte.test.tsx`
Expected: FAIL — Bearbeiten/Duplizieren sind noch Text-Buttons (kein `aria-label`), `onLoeschen` existiert noch nicht. TS-Fehler im Test (`onLoeschen` unbekannt) sind ebenfalls erwartet.

- [ ] **Step 3: `PruefungsKarte.tsx` umbauen**

Import-Zeile 2 erweitern:
```tsx
import { Star, Check, Link as LinkIcon, Pencil, Copy, Trash2 } from 'lucide-react'
```

Props-Signatur (Z. 13–18) um `onLoeschen` ergänzen:
```tsx
export function PruefungsKarte({ config: c, onBearbeiten, onDuplizieren, onLoeschen, trackerSummary }: {
  config: PruefungsConfig
  onBearbeiten: (c: PruefungsConfig) => void
  onDuplizieren: (c: PruefungsConfig) => void
  onLoeschen: (c: PruefungsConfig) => void
  trackerSummary?: TrackerPruefungSummary
}) {
```

Die «Duplizieren»- und «Bearbeiten»-Text-Buttons (Z. 97–108) ersetzen. Neuer Aktions-Block — der Primär-Button (`<a>`) und der «Link kopieren»-Button bleiben unverändert; danach drei Icon-Buttons:
```tsx
        <button
          onClick={() => onBearbeiten(c)}
          title="Bearbeiten"
          aria-label="Bearbeiten"
          className="p-2 rounded-md text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer"
        >
          <Pencil className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => onDuplizieren(c)}
          title="Duplizieren"
          aria-label="Duplizieren"
          className="p-2 rounded-md text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer"
        >
          <Copy className="w-[18px] h-[18px]" />
        </button>
        <button
          onClick={() => onLoeschen(c)}
          title="Löschen"
          aria-label="Löschen"
          className="p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
        >
          <Trash2 className="w-[18px] h-[18px]" />
        </button>
```

- [ ] **Step 4: `LPPruefungenAnsicht.tsx` + `LPUebungenAnsicht.tsx` — Prop durchreichen**

`LPPruefungenAnsicht.tsx`: Im `LPPruefungenAnsichtProps`-Interface nach `handleDuplizieren` ergänzen:
```tsx
  handleLoeschen: (c: PruefungsConfig) => void
```
In der Destrukturierung (Z. 64) `handleDuplizieren, handleLoeschen, findeTrackerSummary,` aufnehmen. Alle **drei** `<PruefungsKarte ... />`-Aufrufe (Favoriten, Zuletzt, Hauptliste) um `onLoeschen={handleLoeschen}` ergänzen.

`LPUebungenAnsicht.tsx`: Analog — `handleLoeschen` ins `LPUebungenAnsichtProps`-Interface, in die Destrukturierung (Z. 45), und an **beide** `<PruefungsKarte ... />`-Aufrufe `onLoeschen={handleLoeschen}` anhängen.

- [ ] **Step 5: `LPStartseite.tsx` — Lösch-Flow**

Imports ergänzen (bei den bestehenden Import-Zeilen):
```tsx
import BaseDialog from '../ui/BaseDialog'
import { apiService } from '../../services/apiService.ts'
```

State neben `editConfig` (Z. 143–145):
```tsx
  const [loeschConfig, setLoeschConfig] = useState<PruefungsConfig | null>(null)
  const [loescht, setLoescht] = useState(false)
```

Handler neben `handleDuplizieren` (nach Z. 294):
```tsx
  function handleLoeschen(config: PruefungsConfig): void {
    setLoeschConfig(config)
  }

  async function bestaetigeLoeschen(): Promise<void> {
    if (!loeschConfig) return
    setLoescht(true)
    try {
      if (!istDemoModus && apiService.istKonfiguriert()) {
        const ok = await apiService.loeschePruefung(user!.email, loeschConfig.id)
        if (!ok) {
          toast.error('Löschen fehlgeschlagen')
          return
        }
      }
      toast.success(loeschConfig.typ === 'formativ' ? 'Übung gelöscht' : 'Prüfung gelöscht')
      setLoeschConfig(null)
      reload()
    } finally {
      setLoescht(false)
    }
  }
```

`handleLoeschen={handleLoeschen}` an `<LPPruefungenAnsicht>` (nach Z. 399) UND an `<LPUebungenAnsicht>` (nach Z. 358) übergeben.

Lösch-Dialog vor dem schliessenden `</div>` (vor Z. 454) rendern:
```tsx
      <BaseDialog
        open={!!loeschConfig}
        onClose={() => { if (!loescht) setLoeschConfig(null) }}
        title={loeschConfig?.typ === 'formativ' ? 'Übung löschen?' : 'Prüfung löschen?'}
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={() => setLoeschConfig(null)}
              disabled={loescht}
              className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm disabled:opacity-40"
            >
              Abbrechen
            </button>
            <button
              onClick={bestaetigeLoeschen}
              disabled={loescht}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loescht && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loescht ? 'Wird gelöscht...' : 'Endgültig löschen'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
          &laquo;{loeschConfig?.titel || 'Unbenannt'}&raquo; unwiderruflich löschen?
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Die Konfiguration wird aus dem System entfernt. Bereits abgegebene Antworten bleiben in Google Drive erhalten.
        </p>
      </BaseDialog>
```

- [ ] **Step 6: Verifizieren**

Run: `npx tsc -b`
Expected: keine Fehler.

Run: `npx vitest run src/components/lp/startseite/PruefungsKarte.test.tsx`
Expected: PASS (alle Tests, inkl. der 3 neuen).

Run: `npx vitest run`
Expected: PASS (Baseline 1994+ Tests, keine Regression).

- [ ] **Step 7: Commit**

```bash
git add src/components/lp/startseite/PruefungsKarte.tsx \
        src/components/lp/startseite/PruefungsKarte.test.tsx \
        src/components/lp/startseite/LPPruefungenAnsicht.tsx \
        src/components/lp/startseite/LPUebungenAnsicht.tsx \
        src/components/lp/LPStartseite.tsx
git commit -m "feat(uebersicht): Aktions-Icons + Löschen in Prüfungs-/Übungs-Karten"
```

---

## Task 2 — Teil #2: `PruefungsComposerLeiste` erstellen

**Files:**
- Create: `src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.tsx`
- Create: `src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.test.tsx`

Verwendet @superpowers:test-driven-development. Neue, noch nicht eingehängte Komponente — isoliert testbar.

- [ ] **Step 1: Test-Datei `PruefungsComposerLeiste.test.tsx` schreiben**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PruefungsComposerLeiste from './PruefungsComposerLeiste'

const baseProps = {
  titel: 'Test-Prüfung',
  typ: 'summativ' as const,
  aktiverTab: 'config',
  onTabChange: vi.fn(),
  gesamtFragen: 3,
  speichertGerade: false,
  speichernDeaktiviert: false,
  onSpeichern: vi.fn(),
  onLoeschen: vi.fn(),
}

describe('PruefungsComposerLeiste', () => {
  it('zeigt den Prüfungstitel', () => {
    render(<PruefungsComposerLeiste {...baseProps} />)
    expect(screen.getByText('Test-Prüfung')).toBeInTheDocument()
  })

  it('zeigt die Editor-Tabs inkl. Fragenzahl', () => {
    render(<PruefungsComposerLeiste {...baseProps} />)
    expect(screen.getByRole('tab', { name: 'Einstellungen' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Abschnitte & Fragen (3)' })).toBeInTheDocument()
  })

  it('Speichern-Button ruft onSpeichern', () => {
    const onSpeichern = vi.fn()
    render(<PruefungsComposerLeiste {...baseProps} onSpeichern={onSpeichern} />)
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(onSpeichern).toHaveBeenCalled()
  })

  it('blendet Duplizieren aus, wenn kein onDuplizieren übergeben wird', () => {
    render(<PruefungsComposerLeiste {...baseProps} />)
    expect(screen.queryByRole('button', { name: 'Duplizieren' })).not.toBeInTheDocument()
  })

  it('zeigt Duplizieren und ruft den Callback', () => {
    const onDuplizieren = vi.fn()
    render(<PruefungsComposerLeiste {...baseProps} onDuplizieren={onDuplizieren} />)
    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    expect(onDuplizieren).toHaveBeenCalled()
  })

  it('Löschen-Button ruft onLoeschen', () => {
    const onLoeschen = vi.fn()
    render(<PruefungsComposerLeiste {...baseProps} onLoeschen={onLoeschen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(onLoeschen).toHaveBeenCalled()
  })

  it('blendet Löschen aus, wenn kein onLoeschen übergeben wird', () => {
    const { onLoeschen, ...ohneLoeschen } = baseProps
    void onLoeschen
    render(<PruefungsComposerLeiste {...ohneLoeschen} />)
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument()
  })

  it('Speichern ist deaktiviert wenn speichernDeaktiviert=true', () => {
    render(<PruefungsComposerLeiste {...baseProps} speichernDeaktiviert />)
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Test laufen lassen → muss fehlschlagen**

Run: `npx vitest run src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.test.tsx`
Expected: FAIL — Modul `./PruefungsComposerLeiste` existiert noch nicht.

- [ ] **Step 3: `PruefungsComposerLeiste.tsx` implementieren**

```tsx
import { Save, Copy, Trash2 } from 'lucide-react'
import { TabBar } from '../../../ui/TabBar'

interface Props {
  titel: string
  typ: 'summativ' | 'formativ'
  aktiverTab: string
  onTabChange: (id: string) => void
  gesamtFragen: number
  statusText?: string
  speichertGerade: boolean
  speichernDeaktiviert: boolean
  onSpeichern: () => void
  onDuplizieren?: () => void
  onLoeschen?: () => void
}

const ICON_BUTTON =
  'p-2 rounded-md text-slate-500 dark:text-slate-300 transition-colors cursor-pointer ' +
  'disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center'
const ICON_VIOLETT = `${ICON_BUTTON} hover:text-violet-600 hover:bg-violet-50 dark:hover:text-violet-300 dark:hover:bg-violet-900/30`
const ICON_ROT = `${ICON_BUTTON} hover:text-red-600 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-900/30`

/**
 * Editor-Leiste des Prüfungs-Composers: Prüfungstitel + Editor-Tabs links,
 * Speicher-Status + Aktions-Icons (Speichern/Duplizieren/Löschen) rechts.
 * Der globale Header bleibt dadurch rein global (volle Breite für die TabKaskade).
 */
export default function PruefungsComposerLeiste({
  titel, typ, aktiverTab, onTabChange, gesamtFragen,
  statusText, speichertGerade, speichernDeaktiviert,
  onSpeichern, onDuplizieren, onLoeschen,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2 flex items-center gap-4">
      {/* Links: Prüfungstitel */}
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[16rem] shrink-0">
        {titel || (typ === 'formativ' ? 'Neue Übung' : 'Neue Prüfung')}
      </span>

      {/* Editor-Tabs */}
      <TabBar
        tabs={[
          { id: 'config', label: 'Einstellungen' },
          { id: 'abschnitte', label: `Abschnitte & Fragen (${gesamtFragen})` },
          { id: 'vorschau', label: 'Vorschau' },
          { id: 'analyse', label: 'Analyse', disabled: gesamtFragen === 0 },
        ]}
        activeTab={aktiverTab}
        onTabChange={onTabChange}
        size="md"
      />

      {/* Rechts: Speicher-Status + Aktions-Icons */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        {statusText && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">{statusText}</span>
        )}
        <button
          type="button"
          onClick={onSpeichern}
          disabled={speichernDeaktiviert}
          title="Speichern"
          aria-label="Speichern"
          className={ICON_VIOLETT}
        >
          {speichertGerade
            ? <span className="inline-block w-[18px] h-[18px] border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            : <Save className="w-[18px] h-[18px]" />}
        </button>
        {onDuplizieren && (
          <button
            type="button"
            onClick={onDuplizieren}
            title="Duplizieren"
            aria-label="Duplizieren"
            className={ICON_VIOLETT}
          >
            <Copy className="w-[18px] h-[18px]" />
          </button>
        )}
        {onLoeschen && (
          <button
            type="button"
            onClick={onLoeschen}
            title="Löschen"
            aria-label="Löschen"
            className={ICON_ROT}
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Test laufen lassen → muss bestehen**

Run: `npx vitest run src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.test.tsx`
Expected: PASS (alle 8 Tests).

Run: `npx tsc -b`
Expected: keine Fehler (neue Datei, noch nicht eingehängt — unbenutzt ist tsc-clean).

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.tsx \
        src/components/lp/vorbereitung/composer/PruefungsComposerLeiste.test.tsx
git commit -m "feat(composer): PruefungsComposerLeiste — Editor-Leiste-Komponente"
```

---

## Task 3 — Teil #2: Leiste in `PruefungsComposer` einhängen

**Files:**
- Modify: `src/components/lp/vorbereitung/PruefungsComposer.tsx`

- [ ] **Step 1: Header entschlacken + Leiste einsetzen**

Import oben ergänzen (bei den anderen `./composer/*`-Imports):
```tsx
import PruefungsComposerLeiste from './composer/PruefungsComposerLeiste'
```

Den `<LPAppHeaderContainer>`-Aufruf (Z. 289–319) auf die globalen Props reduzieren — `breadcrumbs`, `statusText`, `aktionsButtons` **entfernen**. (`LPAppHeaderContainer` deklariert `breadcrumbs?`, `statusText?`, `aktionsButtons?` bereits als optionale Props — `src/components/lp/LPAppHeaderContainer.tsx:24-29` — das Weglassen ist tsc-clean.)
```tsx
      <LPAppHeaderContainer
        onHilfe={() => { setZeigFragenBrowser(false); setZeigHilfe(!zeigHilfe) }}
        onEinstellungen={() => {}}
        onZurueck={onZurueck}
      />
```

Der `ComposerTab`-Typ (Z. 33) und der `tab`-State bleiben in `PruefungsComposer` unverändert — die Leiste nimmt `aktiverTab: string` entgegen, der bestehende `as ComposerTab`-Cast im `onTabChange` überbrückt das.

Den `{/* Tabs */}`-Block (Z. 321–334) komplett ersetzen durch:
```tsx
      <PruefungsComposerLeiste
        titel={pruefung.titel}
        typ={pruefung.typ}
        aktiverTab={tab}
        onTabChange={(id) => setTab(id as ComposerTab)}
        gesamtFragen={gesamtFragen}
        statusText={
          speicherStatus === 'erfolg' ? 'Gespeichert'
          : speicherStatus === 'fehler' ? 'Fehler beim Speichern'
          : autoSaveStatus === 'gespeichert' && speicherStatus === 'idle' ? 'Automatisch gespeichert'
          : undefined
        }
        speichertGerade={speicherStatus === 'speichern'}
        speichernDeaktiviert={speicherStatus === 'speichern' || !pruefung.titel.trim()}
        onSpeichern={handleSpeichern}
        onDuplizieren={config && onDuplizieren ? () => onDuplizieren(pruefung) : undefined}
        onLoeschen={config ? () => setZeigLoeschPruefung(true) : undefined}
      />
```

- [ ] **Step 2: Bottom-«Prüfung löschen»-Link entfernen**

Den Block `{config && ( <div className="mt-12 pt-6 border-t ...">...</div> )}` (Z. 369–379) im `<main>` ersatzlos löschen — der `Trash2`-Button der Leiste ist jetzt der Lösch-Trigger. `handleLoeschePruefung`, `setZeigLoeschPruefung`, `zeigLoeschPruefung` und die `<LoeschDialoge>`-Einbindung bleiben unverändert.

- [ ] **Step 3: Ungenutzte Imports entfernen**

Nach den Änderungen sind zwei Imports tot:
- `import { TabBar } from '../../ui/TabBar'` (Z. 2) — TabBar wird jetzt nur noch in der Leiste verwendet.
- `import { useLPNavigationStore } from '../../../store/lpUIStore.ts'` (Z. 7) — wurde nur für `breadcrumbs={useLPNavigationStore.getState().breadcrumbs}` gebraucht.

Beide Import-Zeilen löschen. Vor dem Löschen mit `grep -n "TabBar\|useLPNavigationStore" src/components/lp/vorbereitung/PruefungsComposer.tsx` bestätigen, dass keine weitere Verwendung übrig ist (eslint `no-unused-vars` würde sonst greifen).

- [ ] **Step 4: Verifizieren**

Run: `npx tsc -b`
Expected: keine Fehler.

Run: `npx vitest run`
Expected: PASS (keine Regression).

Run: `npm run lint`
Expected: keine Fehler (keine ungenutzten Imports).

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/vorbereitung/PruefungsComposer.tsx
git commit -m "feat(composer): Editor-Leiste statt Header-Props — TabKaskade volle Breite"
```

---

## Finale Verifikation (vor jedem Merge)

Pro Branch (Teil #3 und Teil #2 getrennt):

- [ ] `npm run ci-check` — alle 9 Audit-Gates + vitest + build grün. Achtung: Teil #2 fügt `Save`/`Copy`/`Trash2` als lucide-Komponenten ein (kein Emoji — `lint:no-emoji` ok); kein `as any`, kein `alert()`.
- [ ] Browser-E2E auf Staging mit echtem LP-Login (siehe Test-Plan unten).
- [ ] `.claude/rules/regression-prevention.md` Phase 4 (Security) abgehakt.
- [ ] `HANDOFF.md` aktualisiert.
- [ ] LP-Freigabe eingeholt.

### Browser-E2E Test-Plan

**Teil #3 — Aktions-Icons:**
| # | Aktion | Erwartetes Verhalten | Regressions-Risiko |
|---|---|---|---|
| 1 | Prüfen-Übersicht öffnen | Pro Karte: Primär-Button, Link-Icon, Bearbeiten (Pencil), Duplizieren (Copy), Löschen (Trash2) | Karten-Layout bricht bei langen Titeln |
| 2 | Bearbeiten-Icon klicken | Composer öffnet die Prüfung | — |
| 3 | Duplizieren-Icon klicken | Composer öffnet «… (Kopie)» | — |
| 4 | Löschen-Icon → Dialog → «Endgültig löschen» | Bestätigungsdialog, danach Prüfung weg, Liste neu geladen, Erfolgs-Toast | Falsche Prüfung gelöscht; Liste nicht aktualisiert |
| 5 | Löschen → «Abbrechen» | Dialog schliesst, nichts gelöscht | — |
| 6 | Gleiche Tests in der **Übungen**-Ansicht | Identisches Verhalten, Toast sagt «Übung gelöscht» | — |

**Teil #2 — Editor-Leiste:**
| # | Aktion | Erwartetes Verhalten | Regressions-Risiko |
|---|---|---|---|
| 1 | Prüfung im Composer öffnen | Header: `TabKaskade` über volle Breite, keine Breadcrumbs/Status/Buttons mehr | TabKaskade-Navigation defekt |
| 2 | Editor-Leiste (2. Zeile) | Links: Titel + 4 Tabs; rechts: Status + Speichern/Duplizieren/Löschen-Icons | Tab-Wechsel funktioniert nicht |
| 3 | Speichern-Icon | Speichert; während des Speicherns Spinner; Status «Gespeichert» | Autosave-Status-Anzeige weg |
| 4 | Duplizieren-Icon (bestehende Prüfung) | Composer öffnet Kopie | Bei neuer Prüfung KEIN Duplizieren-Icon |
| 5 | Löschen-Icon → `LoeschDialoge` → löschen | Bestehender Lösch-Dialog erscheint, Prüfung wird gelöscht | Bei neuer (ungespeicherter) Prüfung KEIN Löschen-Icon |
| 6 | Neue Prüfung anlegen | Leiste zeigt «Neue Prüfung», nur Speichern-Icon (kein Dupl./Löschen) | — |
| 7 | Light/Dark-Mode | Leiste in beiden Modi korrekt | — |

### Security-Check (Phase 4)
- [ ] Löschen nutzt `apiService.loeschePruefung` (bestehende API, IDOR-Schutz im Backend vorhanden) — kein neuer Endpoint.
- [ ] Übersicht zeigt nur eigene Configs des eingeloggten LP — Lösch-Trigger erbt diese Beschränkung.
- [ ] Keine Lösungsdaten betroffen, keine Rollen-Logik geändert, kein neues `localStorage`.
- [ ] Dialog nutzt `BaseDialog` (React-Modal) — kein `window.confirm`.

## Done-Kriterien

- Teil #3: `PruefungsKarte` zeigt Bearbeiten/Duplizieren/Löschen als Icon-Buttons; Löschen mit Bestätigung funktioniert in Prüfen- und Übungen-Ansicht.
- Teil #2: Composer-Header trägt nur noch globales Chrome; die `PruefungsComposerLeiste` trägt Titel + Tabs + Status + Aktions-Icons; Bottom-Lösch-Link entfernt.
- `npm run ci-check` grün; Browser-E2E bestanden; beide Teile einzeln auf `main` gemergt.
