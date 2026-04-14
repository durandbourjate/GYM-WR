# Lernplattform Shared Editor Integration

**Datum:** 2026-04-04
**Branch:** `feature/shared-editor-phase1` (bestehend)
**Vorgänger:** Shared Editor Phase 1–4 (EditorContext, Typ-Editoren, Sections, Provider in Pruefung)

## Ziel

Die Lernplattform soll die shared Editor-Komponenten nutzen, damit Admins (Eltern, LP) Fragen erstellen und bearbeiten können — gleiche Editoren wie im Prüfungstool, aber mit Lernplattform-spezifischer Config.

## Kern-Problem: Inkompatible Frage-Typen

| Aspekt | Shared (`packages/shared/src/types/fragen.ts`) | Lernplattform (`Lernplattform/src/types/fragen.ts`) |
|---|---|---|
| Struktur | Inheritance: `MCFrage extends FrageBase`, Union Type | Flaches Interface, alle Felder optional |
| Fragetext | `fragetext` (pro Typ) | `frage` |
| Bloom | `bloom: BloomStufe` (K1–K6) | `taxonomie: string` (optional) |
| Fachbereich | `fachbereich: Fachbereich` | `fach: string` |
| Schwierigkeit | Nicht in FrageBase (in Metadaten) | `schwierigkeit: 1 \| 2 \| 3` |
| Semester/Gefässe | `semester: string[]`, `gefaesse: string[]` | Nicht vorhanden |
| Sharing | `autor`, `berechtigungen`, `geteilt` | Nicht vorhanden |

**Lösung:** Ein Adapter-Layer der zwischen den Formaten konvertiert.

## Scope

### In Scope

1. **Type-Adapter** — `toSharedFrage(lernFrage)` und `fromSharedFrage(sharedFrage)` Konvertierungsfunktionen
2. **`LernplattformEditorProvider.tsx`** — EditorProvider-Wrapper mit LP-spezifischer Config/Services
3. **`AdminFragenbank.tsx`** — Admin-Screen: Fragen-Liste + Neu/Bearbeiten mit shared Editor
4. **Navigation** — `'adminFragenbank'` Screen in navigationStore einbinden

5. **Backend-Endpoint** — `lernplattformSpeichereFrage` im Apps Script (Frage ins Gruppen-Sheet schreiben)
6. **Alle 20 Fragetypen** verfügbar (inkl. FiBu)

### Out of Scope

- KI-Assistent Backend für LP (Feature-Flag `false`)
- Upload-Backend für LP (Feature-Flag `false`)
- Fragen-Sync zwischen Pruefung und Lernplattform
- Migration der Lernplattform-Frage-Typen auf shared (separates Projekt)
- Lernziel-Laden (kein Endpoint in LP — `ladeLernziele: () => []`)

## Technisches Design

### 1. Type-Adapter (`Lernplattform/src/adapters/frageAdapter.ts`)

```typescript
import type { Frage as SharedFrage } from '@shared/types/fragen'
import type { Frage as LernFrage } from '../types/fragen'

/** Lernplattform-Frage → Shared-Format (für Editor) */
export function toSharedFrage(lf: LernFrage): SharedFrage {
  return {
    id: lf.id,
    typ: mapTyp(lf.typ),
    fragetext: lf.frage,
    fachbereich: lf.fach as Fachbereich,
    thema: lf.thema,
    bloom: (lf.taxonomie as BloomStufe) || 'K2',
    punkte: 1,
    semester: [],
    gefaesse: [],
    tags: lf.tags || [],
    // Typ-spezifische Felder mappen...
    ...mapTypSpezifisch(lf),
  } as SharedFrage
}

/** Shared-Format → Lernplattform-Frage (nach Editor-Save) */
export function fromSharedFrage(sf: SharedFrage): LernFrage {
  return {
    id: sf.id,
    typ: sf.typ as FrageTyp,
    frage: sf.fragetext,
    fach: sf.fachbereich,
    thema: sf.thema,
    schwierigkeit: 2,
    taxonomie: sf.bloom,
    tags: sf.tags,
    uebung: true,
    pruefungstauglich: false,
    // Typ-spezifische Felder zurückmappen...
    ...unmapTypSpezifisch(sf),
  }
}
```

Die Typ-spezifischen Felder (optionen, luecken, paare, etc.) sind in beiden Formaten ähnlich strukturiert — der Adapter mappt primär die Metadaten-Felder.

### 2. LernplattformEditorProvider (`Lernplattform/src/components/admin/LernplattformEditorProvider.tsx`)

```typescript
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { useAuthStore } from '../../store/authStore'
import { useGruppenStore } from '../../store/gruppenStore'

export function LernplattformEditorProvider({ children }) {
  const user = useAuthStore(s => s.user)
  const gruppe = useGruppenStore(s => s.aktiveGruppe)

  const config: EditorConfig = useMemo(() => ({
    benutzer: {
      email: user?.email ?? '',
      name: user?.name,
    },
    verfuegbareGefaesse: [],      // LP hat keine Gef��sse
    verfuegbareSemester: [],       // LP hat keine Semester
    zeigeFiBuTypen: false,         // Nur wenn Gruppe WR-Fach hat
    features: {
      kiAssistent: false,          // Kein KI-Backend in LP (vorerst)
      anhangUpload: false,         // Kein Upload-Backend in LP (vorerst)
      bewertungsraster: false,     // LP braucht kein Bewertungsraster
      sharing: false,              // LP hat kein Sharing-System
      poolSync: false,             // Kein Pool-Sync
      performance: false,          // Keine Performance-Daten
    },
  }), [user, gruppe])

  const services: EditorServices = useMemo(() => ({
    istKIVerfuegbar: () => false,
    istUploadVerfuegbar: () => false,
  }), [])

  return <EditorProvider config={config} services={services}>{children}</EditorProvider>
}
```

Feature-Flags auf `false` → Editor zeigt keine KI-Buttons, keinen Upload, kein Bewertungsraster, kein Sharing. Nur die Kern-Editor-Funktionalität (Fragetext, Typ-Auswahl, Typ-spezifische Felder, Musterlösung).

### 3. AdminFragenbank (`Lernplattform/src/components/admin/AdminFragenbank.tsx`)

- **Liste:** Fragen der aktuellen Gruppe anzeigen (aus fragenAdapter)
- **Neu/Bearbeiten:** Shared FragenEditor in Modal öffnen
- **Speichern:** `fromSharedFrage()` → API-Call zum Speichern im Gruppen-Sheet

### 4. Navigation

In `navigationStore`: Neuer Screen `'adminFragenbank'`. Zugang über Admin-Dashboard-Button.

### 5. Backend: `lernplattformSpeichereFrage`

Neuer Endpoint im `lernplattform-backend.js`:

```javascript
case 'lernplattformSpeichereFrage': {
  // 1. Validiere Admin-Berechtigung (email === gruppe.adminEmail)
  // 2. Lade Gruppen-Sheet (fragebankSheetId aus Registry)
  // 3. Finde Tab für frage.fach (oder erstelle neuen)
  // 4. Suche bestehende Zeile nach frage.id → Update oder Append
  // 5. Schreibe alle Frage-Felder in Spalten
  // 6. Return { success: true, id: frage.id }
}
```

**Wichtig:** User muss nach Code-Änderungen eine neue Apps Script Bereitstellung erstellen.

### 6. FiBu-Typen

`zeigeFiBuTypen: true` für alle Gruppen — alle 20 Fragetypen verfügbar. Kann später pro Gruppe eingeschränkt werden.

## Betroffene Dateien

| Datei | Aktion |
|---|---|
| `Lernplattform/src/adapters/frageAdapter.ts` | Neu — Typ-Konvertierung shared ↔ LP |
| `Lernplattform/src/components/admin/LernplattformEditorProvider.tsx` | Neu — EditorProvider |
| `Lernplattform/src/components/admin/AdminFragenbank.tsx` | Neu — Admin-Screen |
| `Lernplattform/src/store/navigationStore.ts` | Modify — Screen hinzufügen |
| `Lernplattform/src/components/AdminLayout.tsx` | Modify — Navigation-Link |
| `Lernplattform/apps-script/lernplattform-backend.js` | Modify — neuer Endpoint |
| `Lernplattform/src/adapters/appsScriptAdapter.ts` | Modify — speichereFrage Methode |

## Verifikation

1. `cd Lernplattform && npx tsc -b` — TypeScript grün
2. `cd Lernplattform && npx vitest run` — 93+ Tests grün
3. `cd Lernplattform && npm run build` — Build erfolgreich
4. `cd ExamLab && npx tsc -b && npx vitest run` — Keine Regressions

## Risiko

**Mittel.** Der Type-Adapter ist die grösste Fehlerquelle ��� Felder können beim Mapping verloren gehen. Unit-Tests für den Adapter sind Pflicht.

## Geklärte Fragen

- **Backend-Endpoint:** Existiert NICHT — wird neu erstellt als `lernplattformSpeichereFrage` im Apps Script.
- **Fragetypen:** Alle 20 verfügbar, inkl. FiBu. `zeigeFiBuTypen: true` für alle Gruppen.
