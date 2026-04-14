# Shared Editor Phase 5a: SharedFragenEditor extrahieren

**Datum:** 2026-04-04
**Branch:** `feature/shared-editor-phase1` (bestehend)
**Vorgänger:** Phase 1–4 (EditorContext, Typ-Editoren, Sections, Provider in Pruefung)

## Ziel

`FragenEditor.tsx` (973 Zeilen, Pruefung) in einen **generischen SharedFragenEditor** (shared) und einen **dünnen Pruefung-Wrapper** aufteilen. Damit kann die Lernplattform denselben Editor-Hub nutzen, ohne 973 Zeilen zu duplizieren.

## Architektur-Entscheidung: Slots statt Move

FragenEditor.tsx hat Pruefung-spezifische Teile (AnhangEditor, PDFEditor, BerechtigungenEditor, PoolUpdateVergleich, RueckSyncDialog). Statt diese alle nach shared zu verschieben, nutzen wir **Slots (React-Props)**: Der SharedFragenEditor akzeptiert optionale Slot-Props für Host-spezifische UI-Elemente.

```
Pruefung:                         Lernplattform:
┌──────────────────────┐          ┌──────────────────────┐
│ PruefungFragenEditor │          │ LPFragenEditor       │
│ (dünner Wrapper)     │          │ (dünner Wrapper)     │
│  - EditorProvider    │          │  - EditorProvider    │
│  - Slots befüllen    │          │  - Slots leer/anders │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                  │
           ▼                                  ▼
    ┌──────────────────────────────────────────────┐
    │ SharedFragenEditor (packages/shared)          │
    │ - 80 useState (Frage-State)                   │
    │ - handleSpeichern (validiereFrage + Factory)  │
    │ - MetadataSection, FragetextSection            │
    │ - TypEditorDispatcher, MusterloesungSection    │
    │ - BewertungsrasterEditor                       │
    │ - Slots: anhangEditor, poolSync, berechtigungen│
    └──────────────────────────────────────────────┘
```

## Scope

### In Scope

1. **`SharedFragenEditor.tsx`** in `packages/shared/src/editor/` — generischer Editor-Hub mit Slot-Props
2. **`PruefungFragenEditor.tsx`** — dünner Wrapper in Pruefung der SharedFragenEditor mit Pruefung-Slots nutzt
3. **Pruefung FragenEditor.tsx** → Re-Export-Proxy auf PruefungFragenEditor (keine Import-Änderungen in Konsumenten)

### Out of Scope

- Lernplattform-Integration (Phase 5b — nutzt SharedFragenEditor mit eigenen Slots)
- PDFEditor verschieben (bleibt als Slot)
- State-Migration in Context (80 useState bleiben im SharedFragenEditor)

## Technisches Design

### 1. SharedFragenEditor Props

```typescript
interface SharedFragenEditorProps {
  /** Bestehende Frage zum Bearbeiten, oder null für neue */
  frage: Frage | null
  /** Callback beim Speichern */
  onSpeichern: (frage: Frage) => void
  /** Callback beim Abbrechen */
  onAbbrechen: () => void
  /** Performance-Daten (optional) */
  performance?: FragenPerformance

  // === Slot-Props (Host-spezifische UI) ===

  /** Anhang-Editor Slot (optional, z.B. Pruefung's AnhangEditor) */
  anhangEditorSlot?: (props: {
    anhaenge: FrageAnhang[]
    neueAnhaenge: File[]
    onAnhangHinzu: (file: File) => void
    onAnhangEntfernen: (id: string) => void
    onNeuenAnhangEntfernen: (idx: number) => void
    onUrlAnhangHinzu: (anhang: FrageAnhang) => void
  }) => React.ReactNode

  /** Berechtigungen-Editor Slot (optional) */
  berechtigungenSlot?: (props: {
    berechtigungen: Berechtigung[]
    onChange: (b: Berechtigung[]) => void
  }) => React.ReactNode

  /** Pool-Info Block Slot (pruefungstauglich-Toggle + PoolUpdateVergleich, optional) */
  poolInfoSlot?: (props: {
    frage: Frage | null
    typ: string
    onSpeichern: (frage: Frage) => void
  }) => React.ReactNode

  /** Pool-Sync Header-Buttons Slot (optional, "An Pool"/"In Pool exportieren") */
  poolSyncSlot?: (props: {
    frage: Frage | null
    typ: string
    onRueckSync: () => void
  }) => React.ReactNode

  /** PDF-Editor Komponente (optional, wird an TypEditorDispatcher durchgereicht) */
  PDFEditorComponent?: React.ComponentType<any>

  /** Rück-Sync Dialog (optional) */
  rueckSyncSlot?: (props: {
    offen: boolean
    onSchliessen: () => void
    onErfolg: (updates: Partial<Frage>) => void
  }) => React.ReactNode
}
```

### 2. Was SharedFragenEditor enthält (aus FragenEditor.tsx extrahiert)

**State:** Alle ~80 useState (typ, fachbereich, thema, bloom, punkte, optionen, etc.)
**Logic:** handleSpeichern (validiereFrage + erstelleFrageObjekt), ESC-Handler
**UI:** MetadataSection, FragetextSection, TypEditorDispatcher, MusterloesungSection, BewertungsrasterEditor
**Hooks:** useFocusTrap, usePanelResize, useKIAssistent
**Layout:** Fullscreen-Modal mit Header, Scroll-Content, Resize-Handle

### 3. Was SharedFragenEditor NICHT enthält

- **EditorProvider** — wird vom Host (Wrapper) bereitgestellt
- **AnhangEditor** — Slot (Pruefung befüllt, LP kann leer lassen)
- **BerechtigungenEditor** — Slot
- **PDFEditor** — als PDFEditorComponent Prop an TypEditorDispatcher
- **PoolUpdateVergleich, RueckSyncDialog** — Slots
- **Store-Zugriffe** (authStore, schulConfigStore) — über EditorProvider/Props
- **API-Calls** (uploadAnhang, kiAssistent) — über EditorServices

### 4. PruefungFragenEditor (dünner Wrapper)

```typescript
// ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'
import { EditorProvider } from '@shared/editor/EditorContext'
import AnhangEditor from './AnhangEditor'
import PDFEditor from './PDFEditor'
import BerechtigungenEditor from '../../shared/BerechtigungenEditor'
import PoolUpdateVergleich from './PoolUpdateVergleich'
import RueckSyncDialog from '../fragenbank/RueckSyncDialog'

export default function PruefungFragenEditor(props) {
  // EditorProvider config/services (wie Phase 4)
  return (
    <EditorProvider config={editorConfig} services={editorServices}>
      <SharedFragenEditor
        {...props}
        anhangEditorSlot={(slotProps) => <AnhangEditor {...slotProps} />}
        berechtigungenSlot={(slotProps) => <BerechtigungenEditor {...slotProps} lpListe={lpListe} eigeneFachschaft={user?.fachschaft} />}
        PDFEditorComponent={PDFEditor}
        poolSyncSlot={...}
        rueckSyncSlot={...}
      />
    </EditorProvider>
  )
}
```

### 5. Re-Export für Backwards Compatibility

```typescript
// ExamLab/src/components/lp/frageneditor/FragenEditor.tsx
// Re-Export damit bestehende Imports funktionieren
export { default } from './PruefungFragenEditor'
```

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| `packages/shared/src/editor/SharedFragenEditor.tsx` | **Neu** — generischer Editor-Hub (~700 Zeilen) |
| `packages/shared/src/index.ts` | Modify — SharedFragenEditor exportieren |
| `ExamLab/.../PruefungFragenEditor.tsx` | **Neu** — Wrapper (~120 Zeilen) |
| `ExamLab/.../FragenEditor.tsx` | **Ersetzen** — wird zu Re-Export-Proxy |

## Import-Änderungen in Pruefung

**Keine.** Alle Konsumenten importieren weiterhin `FragenEditor.tsx`, das jetzt ein Re-Export ist. Keine Import-Pfade ändern sich.

## Verifikation

1. `cd ExamLab && npx tsc -b` — TypeScript grün
2. `cd ExamLab && npx vitest run` — 193+ Tests grün
3. `cd ExamLab && npm run build` — Build erfolgreich

## Risiko

**Mittel.** Die grösste Gefahr ist, dass beim Extrahieren der 80 useState + handleSpeichern etwas vergessen geht oder falsch verdrahtet wird. Aber: tsc + 193 Tests + Build fangen das ab. Kein Verhalten ändert sich — reines Refactoring.

## Nicht-triviale Details

### Anhang-Upload in handleSpeichern

`handleSpeichern` ruft aktuell `apiService.uploadAnhang` und `apiService.istKonfiguriert()` direkt auf (Zeilen 512-527). Im SharedFragenEditor muss das über `useEditorServices().uploadAnhang` und `useEditorServices().istUploadVerfuegbar()` laufen. Konkreter Codeumbau:
- `apiService.istKonfiguriert()` → `services.istUploadVerfuegbar()`
- `apiService.uploadAnhang(user.email, id, datei)` → `services.uploadAnhang?.(id, datei)` (email wird vom Service-Adapter injiziert)

### istGueltigesGefaess

Wird in handleSpeichern aufgerufen: `gefaesse.filter(g => istGueltigesGefaess(g, schulConfig))`. Diese Validierung ist Pruefung-spezifisch (prüft gegen SchulConfig). Im SharedFragenEditor: gefaesse unvalidiert durchreichen. Optional: `onBeforeSave` Callback der dem Host erlaubt, die Frage vor dem Speichern zu transformieren.

### lpListe + BerechtigungenEditor

Die lpListe (useState + useEffect mit `ladeUndCacheLPs()`) ist Pruefung-spezifisch. Im SharedFragenEditor entfällt das komplett — der Wrapper befüllt den `berechtigungenSlot` mit eigenen Daten.

### defaultFachbereich + generiereFrageId

Beide Funktionen existieren bereits in `packages/shared/src/editor/` (`fachUtils.ts` und `editorUtils.ts`). SharedFragenEditor importiert direkt von dort. `defaultFachbereich` nutzt `config.benutzer.fachschaft` aus dem EditorContext.

### berechneZeitbedarf

Existiert bereits in `packages/shared/src/editor/zeitbedarf.ts`. SharedFragenEditor importiert direkt von dort.

### Pool-Info Block (pruefungstauglich-Toggle)

Die Zeilen 696-731 in FragenEditor.tsx zeigen einen Pool-Info-Block mit `pruefungstauglich`-Toggle und `PoolUpdateVergleich`. Das ist komplett Pruefung-spezifisch und wird über `poolInfoSlot` abgebildet. Der Slot erhält `frage`, `typ` und `onSpeichern`, damit der Wrapper den Toggle implementieren kann.

### Pool-Sync Header-Buttons

Zwei bedingte Buttons im Header ("An Pool" und "In Pool exportieren"). Der `poolSyncSlot` erhält `frage`, `typ` und `onRueckSync`. Der Wrapper entscheidet, welche Buttons gezeigt werden.
