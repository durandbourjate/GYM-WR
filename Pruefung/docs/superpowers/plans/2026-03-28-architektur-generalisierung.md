# Architektur-Generalisierung — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Prüfungsplattform von WR-spezifisch zu fachunabhängig umbauen — konfigurierbare Fächer, Tags, Branding, Gefässe und LP-Profile.

**Architecture:** Zentrale `schulConfig` im Backend (CONFIGS-Sheet) liefert alle konfigurierbaren Werte. Frontend lädt die Config beim Start in einen Zustand-Store. Hardcodierte Enums (`Fachbereich`, `Gefaess`) werden durch Config-gesteuerte Strings ersetzt. Bestehende Daten werden per Backend-Script migriert.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Google Apps Script, Google Sheets

**Spec:** `docs/superpowers/specs/2026-03-28-oeffnung-plattform-design.md`

---

## Dateistruktur (Übersicht)

### Neue Dateien
| Datei | Verantwortung |
|-------|---------------|
| `src/store/schulConfigStore.ts` | Zustand-Store für schulConfig (laden, cachen, Fallback) |
| `src/types/schulConfig.ts` | TypeScript-Interface für SchulConfig |
| `src/types/tags.ts` | Tag-Interface (name, farbe, ebene) |
| `src/utils/gefaessUtils.ts` | Validierungsfunktion `istGueltigesGefaess()` |
| `src/__tests__/schulConfig.test.ts` | Tests für schulConfigStore |
| `src/__tests__/fachUtils.test.ts` | Tests für das neue fachUtils (ersetzt fachbereich.test.ts) |
| `src/__tests__/gefaessUtils.test.ts` | Tests für Gefäss-Validierung |

### Geänderte Dateien (Kernänderungen)
| Datei | Änderung |
|-------|----------|
| `src/utils/fachbereich.ts` → `src/utils/fachUtils.ts` | Rename + generische Logik statt WR-hardcodiert |
| `src/types/fragen.ts` | `Fachbereich`-Typ entfernen, `fach: string` + `tags: Tag[]` auf FrageBase |
| `src/types/auth.ts` | `fachschaft?: string` → `fachschaften: string[]` auf AuthUser |
| `src/types/pruefung.ts` | `fachbereiche: string[]` → `fach: string`, `gefaess` → `string` |
| `src/services/lpApi.ts` | `fachschaft: string` → `fachschaften: string[]` auf LPInfo |
| `src/store/authStore.ts` | Demo-LPs + Login-Mapping anpassen, Domains aus Config |
| `src/hooks/useFragenFilter.ts` | Filter nach `fach` + `tags` statt `fachbereich` |
| `src/utils/fragenFactory.ts` | Default-Werte auf `fach`/`tags` umstellen |
| `src/components/LoginScreen.tsx` | Branding aus schulConfig |
| `src/components/lp/frageneditor/FragenEditor.tsx` | `fach` + `tags` statt `fachbereich` |
| `src/components/lp/frageneditor/sections/MetadataSection.tsx` | Fach-Dropdown + Tag-Picker, Gefässe aus Config |
| `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx` | Filter-UI auf Fach/Tags umstellen |
| `src/components/lp/vorbereitung/composer/ConfigTab.tsx` | Gefäss-Auswahl aus Config |
| `src/components/lp/korrektur/KorrekturPDFAnsicht.tsx` | Schulname aus Config |
| `src/utils/sebConfigGenerator.ts` | Schulname aus Config |
| `apps-script-code.js` | schulConfig-Endpoint, Migration, fachschaft→fachschaften |

---

## Task 1: SchulConfig-Typen und Store

**Files:**
- Create: `src/types/schulConfig.ts`
- Create: `src/types/tags.ts`
- Create: `src/store/schulConfigStore.ts`
- Create: `src/__tests__/schulConfig.test.ts`

- [ ] **Step 1: SchulConfig-Interface schreiben**

```typescript
// src/types/schulConfig.ts
export interface SchulConfig {
  schulName: string
  schulKuerzel: string
  logoUrl: string
  lpDomain: string
  susDomain: string
  faecher: string[]
  gefaesse: string[]
  querschnittsTags: { name: string; farbe: string }[]
  semesterModell: {
    regel: { anzahl: number; label: string }
    taf: { anzahl: number; label: string }
  }
  fachschaftsTags: Record<string, { name: string; farbe: string }[]>
  // z.B. { 'WR': [{name:'VWL',farbe:'#f97316'}, ...], 'DE': [{name:'Grammatik',farbe:'#...'}, ...] }
}

/** Hardcodierte Fallback-Config (heutige Hofwil-Werte) */
export const DEFAULT_SCHUL_CONFIG: SchulConfig = {
  schulName: 'Gymnasium Hofwil',
  schulKuerzel: 'GH',
  logoUrl: '',
  lpDomain: 'gymhofwil.ch',
  susDomain: 'stud.gymhofwil.ch',
  faecher: [
    'Deutsch', 'Französisch', 'Englisch', 'Italienisch', 'Spanisch', 'Latein',
    'Mathematik', 'Biologie', 'Chemie', 'Physik',
    'Geschichte', 'Geografie',
    'Wirtschaft & Recht', 'Informatik',
    'Bildnerisches Gestalten', 'Musik', 'Sport',
    'Philosophie', 'Pädagogik/Psychologie', 'Religionslehre'
  ],
  gefaesse: ['SF', 'EF', 'EWR', 'GF', 'FF'],
  querschnittsTags: [
    { name: 'BNE', farbe: '#10b981' },
    { name: 'Digitalität', farbe: '#6366f1' },
    { name: 'Transversalität', farbe: '#8b5cf6' },
    { name: 'Interdisziplinär', farbe: '#ec4899' }
  ],
  semesterModell: {
    regel: { anzahl: 8, label: 'S1–S8' },
    taf: { anzahl: 10, label: 'S1–S10' }
  },
  fachschaftsTags: {
    'WR': [
      { name: 'VWL', farbe: '#f97316' },
      { name: 'BWL', farbe: '#3b82f6' },
      { name: 'Recht', farbe: '#22c55e' }
    ]
  }
}
```

- [ ] **Step 2: Tag-Interface schreiben**

```typescript
// src/types/tags.ts
export interface Tag {
  name: string
  farbe: string
  ebene: 'fachschaft' | 'querschnitt' | 'persoenlich'
}
```

- [ ] **Step 3: Tests für schulConfigStore schreiben**

```typescript
// src/__tests__/schulConfig.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('schulConfigStore', () => {
  it('hat DEFAULT_SCHUL_CONFIG als Initialwert', () => {
    // Store sollte mit Fallback-Werten starten
  })

  it('ladeSchulConfig setzt Config aus API-Response', () => {
    // Mock-API → Store übernimmt Werte
  })

  it('ladeSchulConfig nutzt Fallback bei Fehler', () => {
    // API wirft Fehler → Store bleibt bei Default
  })

  it('getFaecherFuerFachschaften gibt korrekte Fächer', () => {
    // WR → 'Wirtschaft & Recht', IN → 'Informatik'
  })

  it('getTagsFuerFachschaften aggregiert Tags aller Fachschaften', () => {
    // ['WR', 'IN'] → VWL, BWL, Recht + evtl. IN-Tags
  })
})
```

- [ ] **Step 4: Tests ausführen, sicherstellen dass sie fehlschlagen**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx vitest run src/__tests__/schulConfig.test.ts`
Expected: FAIL (Module nicht gefunden)

- [ ] **Step 5: schulConfigStore implementieren**

```typescript
// src/store/schulConfigStore.ts
import { create } from 'zustand'
import { SchulConfig, DEFAULT_SCHUL_CONFIG } from '../types/schulConfig'

interface SchulConfigState {
  config: SchulConfig
  geladen: boolean
  fehler: string | null
  ladeSchulConfig: () => Promise<void>
}

export const useSchulConfig = create<SchulConfigState>((set, get) => ({
  config: DEFAULT_SCHUL_CONFIG,
  geladen: false,
  fehler: null,

  ladeSchulConfig: async () => {
    try {
      const response = await fetch(/* API_URL + ladeSchulConfig */)
      if (!response.ok) throw new Error('SchulConfig laden fehlgeschlagen')
      const data = await response.json()
      set({ config: { ...DEFAULT_SCHUL_CONFIG, ...data }, geladen: true, fehler: null })
    } catch (e) {
      console.warn('SchulConfig Fallback aktiv:', e)
      set({ geladen: true, fehler: String(e) })
      // Config bleibt auf DEFAULT_SCHUL_CONFIG
    }
  }
}))
```

- [ ] **Step 6: Tests ausführen, sicherstellen dass sie grün sind**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/Pruefung" && npx vitest run src/__tests__/schulConfig.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/types/schulConfig.ts src/types/tags.ts src/store/schulConfigStore.ts src/__tests__/schulConfig.test.ts
git commit -m "feat: SchulConfig-Typen, Tag-Interface und Store mit Fallback"
```

---

## Task 2: fachbereich.ts → fachUtils.ts

**Files:**
- Rename: `src/utils/fachbereich.ts` → `src/utils/fachUtils.ts`
- Delete: `src/utils/fachbereich.test.ts`
- Create: `src/__tests__/fachUtils.test.ts`
- Modify: Alle 20+ Dateien die `fachbereich.ts` importieren (Import-Pfad ändern)

- [ ] **Step 1: Tests für fachUtils schreiben**

```typescript
// src/__tests__/fachUtils.test.ts
import { describe, it, expect } from 'vitest'

describe('fachUtils', () => {
  describe('tagFarbe', () => {
    it('gibt konfigurierte Farbe für bekannten Tag', () => {
      // Tag mit farbe '#f97316' → Tailwind-Klassen ableiten
    })
    it('gibt Default-Farbe für unbekannten Tag', () => {
      // Tag ohne Farb-Config → slate
    })
  })

  describe('istFachschaftMitFiBu', () => {
    it('true wenn fachschaften WR enthält', () => {
      expect(istFachschaftMitFiBu(['WR', 'IN'])).toBe(true)
    })
    it('false wenn fachschaften kein WR', () => {
      expect(istFachschaftMitFiBu(['DE'])).toBe(false)
    })
  })

  describe('defaultFach', () => {
    it('WR-Fachschaft → Wirtschaft & Recht', () => {
      expect(defaultFach(['WR'])).toBe('Wirtschaft & Recht')
    })
    it('IN-Fachschaft → Informatik', () => {
      expect(defaultFach(['IN'])).toBe('Informatik')
    })
    it('Mehrere Fachschaften → erste', () => {
      expect(defaultFach(['WR', 'IN'])).toBe('Wirtschaft & Recht')
    })
  })

  describe('typLabel (unverändert)', () => {
    it('mc → Multiple Choice', () => {})
    it('freitext → Freitext', () => {})
  })

  describe('bloomLabel (unverändert)', () => {
    it('K1 → Wissen (K1)', () => {})
  })
})
```

- [ ] **Step 2: Tests ausführen, FAIL erwarten**

Run: `npx vitest run src/__tests__/fachUtils.test.ts`

- [ ] **Step 3: fachUtils.ts implementieren**

Datei `src/utils/fachbereich.ts` umbenennen zu `src/utils/fachUtils.ts`. Inhalt ersetzen:

```typescript
// src/utils/fachUtils.ts
import type { Tag } from '../types/tags'

/** Tailwind Badge-Klassen für einen Tag (basierend auf Tag.farbe) */
export function tagBadgeKlassen(tag: Tag): string {
  // Hex-Farbe → nächste Tailwind-Klasse mappen
  // Dark-Mode: opacity-basiert (konsistent mit bestehendem Code in fachbereich.ts)
  const farbenMap: Record<string, string> = {
    '#f97316': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    '#3b82f6': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    '#22c55e': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    '#6b7280': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    '#10b981': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    '#6366f1': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    '#8b5cf6': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    '#ec4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  }
  return farbenMap[tag.farbe] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
}

/** Prüft ob die LP FiBu-Fragetypen sehen darf */
export function istFachschaftMitFiBu(fachschaften: string[]): boolean {
  return fachschaften.includes('WR')
}

/** Default-Fach aus Fachschaften ableiten */
const FACHSCHAFT_ZU_FACH: Record<string, string> = {
  'WR': 'Wirtschaft & Recht',
  'IN': 'Informatik',
  'DE': 'Deutsch',
  'FR': 'Französisch',
  'EN': 'Englisch',
  'MA': 'Mathematik',
  'BI': 'Biologie',
  'CH': 'Chemie',
  'PH': 'Physik',
  'GS': 'Geschichte',
  'GG': 'Geografie',
  'BG': 'Bildnerisches Gestalten',
  'MU': 'Musik',
  'SP': 'Sport',
  'PL': 'Philosophie',
  'LA': 'Latein',
}

export function defaultFach(fachschaften: string[]): string {
  for (const fs of fachschaften) {
    if (FACHSCHAFT_ZU_FACH[fs]) return FACHSCHAFT_ZU_FACH[fs]
  }
  return 'Allgemein'
}

/** Human-readable Label für Fragetypen */
export function typLabel(typ: string): string {
  const labels: Record<string, string> = {
    mc: 'Multiple Choice',
    freitext: 'Freitext',
    zuordnung: 'Zuordnung',
    lueckentext: 'Lückentext',
    visualisierung: 'Zeichnen',
    richtigfalsch: 'Richtig/Falsch',
    berechnung: 'Berechnung',
    buchungssatz: 'Buchungssatz',
    tkonto: 'T-Konto',
    kontenbestimmung: 'Kontenbestimmung',
    bilanzstruktur: 'Bilanz/ER',
    aufgabengruppe: 'Aufgabengruppe',
    pdf: 'PDF-Annotation',
    // Neue Typen (für spätere Phasen vorbereitet)
    sortierung: 'Sortierung',
    hotspot: 'Hotspot',
    bildbeschriftung: 'Bildbeschriftung',
    dragdrop_bild: 'Drag & Drop (Bild)',
    code: 'Code',
    formel: 'Formel',
    audio: 'Audio-Aufnahme',
  }
  return labels[typ] || typ
}

/** Bloom-Taxonomie Label */
export function bloomLabel(stufe: string): string {
  const labels: Record<string, string> = {
    K1: 'Wissen (K1)',
    K2: 'Verstehen (K2)',
    K3: 'Anwenden (K3)',
    K4: 'Analysieren (K4)',
    K5: 'Beurteilen (K5)',
    K6: 'Erschaffen (K6)',
  }
  return labels[stufe] || stufe
}

/** FiBu-Fragetypen (nur für WR) */
export const FIBU_TYPEN = new Set(['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'])
```

- [ ] **Step 4: Import-Pfade in allen ~45 Dateien aktualisieren**

Alle `import ... from '...fachbereich'` → `'...fachUtils'`. Auch Funktionsnamen anpassen: `fachbereichFarbe` → `tagBadgeKlassen`, `zeigeFachbereichBadge` → entfernen (Tags werden direkt gerendert), `istWRFachschaft` → `istFachschaftMitFiBu`, `defaultFachbereich` → `defaultFach`.

**Vollständige Liste (per Grep verifiziert — ~45 Dateien):**

Tests:
- `src/utils/fachbereich.test.ts` → **löschen**
- `src/utils/autoKorrektur.test.ts` → Fixtures: `fachbereich: 'VWL'` → `fach: 'Wirtschaft & Recht', tags: []`
- `src/utils/fragenResolver.test.ts` → Fixtures anpassen

Utils:
- `src/utils/fragenFactory.ts`, `poolConverter.ts`, `analyseUtils.ts`, `trackerUtils.ts`

Services:
- `src/services/fragenbankApi.ts` (`loescheFrage()` Signatur)

LP-Editor:
- `src/components/lp/frageneditor/FragenEditor.tsx`, `KIAssistentPanel.tsx`, `KITypButtons.tsx`, `editorUtils.ts`
- `src/components/lp/frageneditor/sections/MetadataSection.tsx`, `FragetextSection.tsx`, `MusterloesungSection.tsx`, `TypEditorDispatcher.tsx`

LP-Fragenbank:
- `src/components/lp/fragenbank/FragenImport.tsx`, `FragenBrowser.tsx`, `RueckSyncDialog.tsx`
- `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx`, `KompaktZeile.tsx`, `DetailKarte.tsx`, `gruppenHelfer.ts`

LP-Vorbereitung:
- `src/components/lp/vorbereitung/PruefungsComposer.tsx`, `VorbereitungPhase.tsx`
- `src/components/lp/vorbereitung/composer/ConfigTab.tsx`, `VorschauTab.tsx`, `AbschnitteTab.tsx`, `AnalyseTab.tsx`

LP-Übrige:
- `src/components/lp/LPStartseite.tsx`, `HilfeSeite.tsx`
- `src/components/lp/korrektur/BatchExportDialog.tsx`
- `src/components/shared/BerechtigungenEditor.tsx`

SuS-Fragetypen (importieren `typLabel`/`bloomLabel`):
- `src/components/fragetypen/MCFrage.tsx`, `FreitextFrage.tsx`, `LueckentextFrage.tsx`, `ZuordnungFrage.tsx`
- `src/components/fragetypen/RichtigFalschFrage.tsx`, `BerechnungFrage.tsx`, `BuchungssatzFrage.tsx`
- `src/components/fragetypen/TKontoFrage.tsx`, `KontenbestimmungFrage.tsx`, `BilanzERFrage.tsx`
- `src/components/fragetypen/AufgabengruppeFrage.tsx`, `ZeichnenFrage.tsx`, `PDFFrage.tsx`

Andere:
- `src/components/FragenUebersicht.tsx`, `FragenNavigation.tsx`, `AbgabeZusammenfassung.tsx`

**Effizientester Weg:** `grep -rl "fachbereich" src/ | xargs sed -i '' 's|/fachbereich|/fachUtils|g'` für Import-Pfade, dann manuelle Prüfung der Funktionsnamen.

- [ ] **Step 5: Tests + tsc -b**

Run: `npx vitest run src/__tests__/fachUtils.test.ts && npx tsc -b`
Expected: PASS + keine TS-Fehler (oder bekannte Fehler aus Task 3 Typ-Änderungen)

- [ ] **Step 6: Commit**

```bash
git add src/utils/fachUtils.ts src/__tests__/fachUtils.test.ts
git add -u  # geänderte + gelöschte Dateien
git commit -m "refactor: fachbereich.ts → fachUtils.ts mit generischer Logik (~45 Dateien)"
```

---

## Task 3: Typ-System umbauen (fragen.ts, auth.ts, pruefung.ts)

**Files:**
- Modify: `src/types/fragen.ts` (Zeile 23, 28, 32, 72–73)
- Modify: `src/types/auth.ts` (Zeile 26)
- Modify: `src/types/pruefung.ts` (Zeile 16, 18)
- Modify: `src/services/lpApi.ts` (Zeile 9)

- [ ] **Step 1: fragen.ts — Fachbereich → fach + tags**

In `src/types/fragen.ts`:
- Zeile 72: `Fachbereich`-Typ löschen
- Zeile 73: `Gefaess`-Typ löschen (wird zu `string`)
- Zeile 23: `fachbereich: Fachbereich` → `fach: string`
- Zeile 28: `gefaesse: Gefaess[]` → `gefaesse: string[]`
- Zeile 32: `tags: string[]` → `tags: import('../types/tags').Tag[]`
- Import für `Tag` hinzufügen

Neues `FrageBase` (relevante Felder):
```typescript
import type { Tag } from './tags'

export interface FrageBase {
  // ...
  fach: string           // z.B. 'Wirtschaft & Recht', 'Mathematik'
  thema: string
  unterthema?: string
  lehrplanziel?: string
  semester: string[]
  gefaesse: string[]     // war Gefaess[], jetzt string[] (validiert gegen schulConfig)
  bloom: BloomStufe
  tags: Tag[]            // war string[], jetzt Tag-Objekte
  // ...

  // Legacy (Übergangszeit, optional für Rückwärtskompatibilität)
  fachbereich?: string   // Deprecated — wird bei Migration befüllt, nach 6 Monaten entfernen
}
```

- [ ] **Step 2: auth.ts — fachschaft → fachschaften**

```typescript
// src/types/auth.ts
export interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  bild?: string
  rolle: Rolle
  schuelerId?: string
  sessionToken?: string
  fachschaften: string[]   // NEU: Array (war fachschaft?: string)
  adminRolle?: boolean
}
```

- [ ] **Step 3: pruefung.ts — fachbereiche → fach, gefaess → string**

```typescript
// src/types/pruefung.ts, Zeile 14–18
export interface PruefungsConfig {
  // ...
  fach: string              // NEU (war fachbereiche: string[])
  gefaess: string           // war 'SF' | 'EF' | 'EWR' | 'GF', jetzt string
  klassenTyp?: 'regel' | 'taf'  // NEU — nur Typ-Feld, UI (Phasen-Auswahl) in späterem Plan
  // ...
}
```

- [ ] **Step 4: lpApi.ts — fachschaft → fachschaften**

```typescript
// src/services/lpApi.ts, Zeile 5–11
export interface LPInfo {
  email: string
  name: string
  kuerzel: string
  fachschaften: string[]    // NEU: Array (war fachschaft: string)
  rolle: 'admin' | 'lp'
  sichtbareTypen?: string[] // NEU: LP blendet Fragetypen ein/aus
}
```

- [ ] **Step 5: tsc -b ausführen, Fehler zählen**

Run: `npx tsc -b 2>&1 | head -50`
Expected: Viele Fehler (alle Stellen die noch `fachbereich`, `fachschaft`, `Fachbereich`, `Gefaess` nutzen). Diese werden in Tasks 4–7 behoben.

- [ ] **Step 6: Commit (WIP — Typ-Fehler erwartet)**

```bash
git add src/types/fragen.ts src/types/auth.ts src/types/pruefung.ts src/services/lpApi.ts
git commit -m "refactor(types): Fachbereich→fach, tags→Tag[], fachschaft→fachschaften, Gefaess→string [WIP: TS-Fehler erwartet]"
```

---

## Task 4: authStore + LoginScreen anpassen

**Files:**
- Modify: `src/store/authStore.ts` (Demo-LPs, Login-Mapping, Domain-Checks)
- Modify: `src/components/LoginScreen.tsx` (Branding, Domain-Checks)

- [ ] **Step 1: authStore.ts — Demo-LPs auf fachschaften umstellen**

Zeile 17–20: Alle Demo-LPs von `fachschaft: 'WR'` auf `fachschaften: ['WR']` ändern.
Zeile 105: `fachschaft: lpInfo?.fachschaft` → `fachschaften: lpInfo?.fachschaften ?? []`
Zeile 36, 39–40: Domain-Checks → `useSchulConfig().config.susDomain` / `.lpDomain` nutzen.

Da `authStore` kein React-Komponent ist (Zustand-Store), muss die Domain aus dem schulConfigStore gelesen werden:
```typescript
import { useSchulConfig } from './schulConfigStore'

// In rolleAusDomain():
const { config } = useSchulConfig.getState()
if (domain === config.susDomain) return 'sus'
```

- [ ] **Step 2: LoginScreen.tsx — Branding aus Config**

Zeile 130: `<span>WR</span>` → `<span>{config.schulKuerzel}</span>`
Zeile 136: `Gymnasium Hofwil` → `{config.schulName}`
Zeile 34–35, 86–87: Domain-Checks → `config.lpDomain` / `config.susDomain`
Zeile 193: Placeholder → `vorname.nachname@${config.susDomain}`

```tsx
const { config } = useSchulConfig()

// Logo-Block
<span className="text-white text-2xl font-bold">{config.schulKuerzel}</span>
// ...
<p>{config.schulName}</p>
```

- [ ] **Step 3: tsc -b für diese Dateien**

Run: `npx tsc -b 2>&1 | grep -c 'error'`
Expected: Fehlerzahl sinkt

- [ ] **Step 4: Commit**

```bash
git add src/store/authStore.ts src/components/LoginScreen.tsx
git commit -m "refactor: authStore + LoginScreen — fachschaften[], Branding aus schulConfig"
```

---

## Task 5: FragenEditor + MetadataSection + Filter umbauen

**Files:**
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx`
- Modify: `src/components/lp/frageneditor/sections/MetadataSection.tsx`
- Modify: `src/hooks/useFragenFilter.ts`
- Modify: `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx`

- [ ] **Step 1: FragenEditor.tsx — fach + tags statt fachbereich**

Zeile 66: `useState<Fachbereich>(...)` → `useState<string>(frage?.fach ?? defaultFach(user?.fachschaften ?? []))`
Neuer State: `const [tags, setTags] = useState<Tag[]>(frage?.tags ?? [])`
Props an MetadataSection: `fach`/`setFach`/`tags`/`setTags` statt `fachbereich`/`setFachbereich`

- [ ] **Step 2: MetadataSection.tsx — Fach-Dropdown + Tag-Picker**

Die bisherige Logik (Zeile 140: `istWRFachschaft` Gate) wird ersetzt:

```tsx
// Fach-Dropdown (für alle LP, aus schulConfig)
<select value={fach} onChange={(e) => setFach(e.target.value)}>
  {config.faecher.map(f => <option key={f} value={f}>{f}</option>)}
</select>

// Tag-Picker (Tags der eigenen Fachschaften + Querschnitts-Tags)
<div className="flex flex-wrap gap-1">
  {verfuegbareTags.map(tag => (
    <button
      key={tag.name}
      className={`px-2 py-0.5 rounded text-xs ${
        tags.some(t => t.name === tag.name) ? tagBadgeKlassen(tag) : 'bg-slate-100 text-slate-500'
      }`}
      onClick={() => toggleTag(tag)}
    >
      {tag.name}
    </button>
  ))}
</div>
```

Gefäss-Auswahl (Zeile 214): Hardcodierte `['SF','EF','EWR','GF']` → `config.gefaesse`

- [ ] **Step 3: useFragenFilter.ts — Filter auf fach + tags**

Zeile 67: `filterFachbereich` → `filterFach: string`
Zeile 104: `f.fachbereich !== filterFachbereich` → `f.fach !== filterFach`
Gruppierung `'fachbereich'` → `'fach'`
Statistik: `fachbereiche.set(f.fachbereich, ...)` → `faecher.set(f.fach, ...)`
Neuer Filter: `filterTags: string[]` — Frage muss mindestens einen der gewählten Tags haben

- [ ] **Step 4: FragenBrowserHeader.tsx — Filter-UI**

Fachbereich-Dropdown → Fach-Dropdown (aus schulConfig.faecher)
Tag-Filter als Chips (ähnlich MetadataSection)

- [ ] **Step 5: tsc -b + vitest**

Run: `npx tsc -b && npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/frageneditor/ src/hooks/useFragenFilter.ts src/components/lp/fragenbank/
git commit -m "refactor: FragenEditor + Filter — fach/tags statt fachbereich, Gefässe aus Config"
```

---

## Task 6: Restliche Frontend-Dateien anpassen

**Files:**
- Modify: `src/utils/fragenFactory.ts`
- Modify: `src/utils/poolConverter.ts`
- Modify: `src/utils/analyseUtils.ts`
- Modify: `src/components/lp/frageneditor/sections/FragetextSection.tsx`
- Modify: `src/components/lp/frageneditor/sections/MusterloesungSection.tsx`
- Modify: `src/components/lp/frageneditor/KIAssistentPanel.tsx`
- Modify: `src/components/lp/fragenbank/FragenImport.tsx`
- Modify: `src/components/lp/vorbereitung/PruefungsComposer.tsx`
- Modify: `src/components/lp/vorbereitung/composer/ConfigTab.tsx`
- Modify: `src/components/lp/korrektur/KorrekturPDFAnsicht.tsx`
- Modify: `src/components/lp/LPStartseite.tsx`
- Modify: `src/components/lp/HilfeSeite.tsx`
- Modify: `src/components/shared/BerechtigungenEditor.tsx`
- Modify: `src/utils/sebConfigGenerator.ts`
- Modify: `vite.config.ts` (Titel)
- Modify: `index.html` (Titel)

- [ ] **Step 1: fragenFactory.ts — Default-Werte**

`fachbereich: 'VWL'` → `fach: defaultFach(fachschaften)`, `tags: []`
`gefaesse: [] as Gefaess[]` → `gefaesse: [] as string[]`

- [ ] **Step 2: poolConverter.ts — Mapping**

`mapFachbereich()` Funktion anpassen: Konvertiert Pool-Fachbereich zu `fach` + `tags`

- [ ] **Step 3: analyseUtils.ts — Statistiken**

`FachbereichStatus` → `FachStatus`, gruppiert nach `fach` statt `fachbereich`

- [ ] **Step 4: KI-Komponenten (FragetextSection, MusterloesungSection, KIAssistentPanel)**

Props `fachbereich: Fachbereich` → `fach: string`
KI-Prompts: `fachbereich` → `fach` im Kontext

- [ ] **Step 5: PruefungsComposer + ConfigTab**

`toggleFachbereich()` entfernen, `fach` als Einzelwert setzen
ConfigTab: Gefäss-Auswahl aus `config.gefaesse` statt hardcodiert

- [ ] **Step 6: Branding-Strings ersetzen**

`KorrekturPDFAnsicht.tsx` Zeile 256: `'Gymnasium Hofwil'` → `config.schulName`
`sebConfigGenerator.ts` Zeile 12, 19: → `config.schulName`
`vite.config.ts` Zeile 18: → generischer Titel
`index.html` Zeile 7: → generischer Titel

- [ ] **Step 7: BerechtigungenEditor.tsx**

Zeile 36–37: `fachschaft:WR` → dynamisch aus `user.fachschaften[0]` ableiten

- [ ] **Step 8: HilfeSeite.tsx**

Alle `@gymhofwil.ch` Referenzen → `config.lpDomain`
Schulname → `config.schulName`

- [ ] **Step 9: tsc -b — null Fehler erwartet**

Run: `npx tsc -b`
Expected: 0 errors

- [ ] **Step 10: Alle Tests grün**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: alle Frontend-Dateien auf fach/tags/fachschaften/schulConfig umgestellt"
```

---

## Task 7: Backend (apps-script-code.js) anpassen

**Files:**
- Modify: `apps-script-code.js`

- [ ] **Step 1: schulConfig-Endpoint hinzufügen**

Neuer Case `ladeSchulConfig` in `doGet()`:
```javascript
case 'ladeSchulConfig':
  return jsonResponse_(ladeSchulConfig_())

function ladeSchulConfig_() {
  const cached = cacheGet_('schulConfig')
  if (cached) return cached

  // Config aus CONFIGS-Sheet, Tab "SchulConfig" lesen
  // Oder: hardcodierte Default-Werte (Phase 1)
  const config = {
    schulName: 'Gymnasium Hofwil',
    schulKuerzel: 'GH',
    // ... (wie DEFAULT_SCHUL_CONFIG im Frontend)
  }
  cachePut_('schulConfig', config, 3600) // 1h Cache
  return config
}
```

- [ ] **Step 2: LP-Datenmodell — fachschaft → fachschaften**

`ladeLehrpersonen_()`: Spalte "Fachschaft" parsen als Komma-getrenntes Array.
Rückgabe: `fachschaften: zeile[3].split(',').map(s => s.trim())` statt `fachschaft: zeile[3]`

- [ ] **Step 3: Fachbereich-Felder in Fragen/Configs**

`speichereFrage_()`: Neues Feld `fach` speichern, `fachbereich` weiterhin parallel schreiben (Übergang)
`ladeFragenbank_()`: `fach` Feld mitlesen, Fallback auf `fachbereich` wenn `fach` fehlt (Migration)
`speichereConfig_()`: `fach` statt `fachbereiche`
`ladeAlleConfigs_()` / `ladeEinzelConfig_()`: `fach` Feld mitlesen

- [ ] **Step 4: Migrations-Funktion**

```javascript
function migriereFachbereich_() {
  // Alle Fragen in FRAGENBANK_SHEET durchgehen
  // fachbereich → fach + tags setzen (gemäss Mapping in Spec)
  // Alle Configs in CONFIGS_SHEET durchgehen
  // fachbereiche → fach setzen
  // Log: "N Fragen + M Configs migriert"
}
```

Neuer Case in `doPost()`: `case 'migriereFachbereich': return jsonResponse_(migriereFachbereich_())`

- [ ] **Step 5: Fachschaft-basierte Sichtbarkeit**

`istSichtbarMitLP()`: Muss jetzt `fachschaften: string[]` statt `fachschaft: string` prüfen.
`fachschaftZuFachbereiche_()` → `fachschaftenZuFaecher_()`: Mapping für mehrere Fachschaften.

- [ ] **Step 6: Commit**

```bash
git add apps-script-code.js
git commit -m "feat(backend): schulConfig-Endpoint, fachschaften-Array, Migration, fach-Feld"
```

---

## Task 8: Gefäss-Validierung

**Files:**
- Create: `src/utils/gefaessUtils.ts`
- Create: `src/__tests__/gefaessUtils.test.ts`

- [ ] **Step 1: Test schreiben**

```typescript
// src/__tests__/gefaessUtils.test.ts
import { describe, it, expect } from 'vitest'
import { istGueltigesGefaess } from '../utils/gefaessUtils'
import { DEFAULT_SCHUL_CONFIG } from '../types/schulConfig'

describe('gefaessUtils', () => {
  it('SF ist gültig', () => {
    expect(istGueltigesGefaess('SF', DEFAULT_SCHUL_CONFIG)).toBe(true)
  })
  it('FF ist gültig (neu)', () => {
    expect(istGueltigesGefaess('FF', DEFAULT_SCHUL_CONFIG)).toBe(true)
  })
  it('XYZ ist ungültig', () => {
    expect(istGueltigesGefaess('XYZ', DEFAULT_SCHUL_CONFIG)).toBe(false)
  })
  it('leerer String ist ungültig', () => {
    expect(istGueltigesGefaess('', DEFAULT_SCHUL_CONFIG)).toBe(false)
  })
})
```

- [ ] **Step 2: Implementierung**

```typescript
// src/utils/gefaessUtils.ts
import type { SchulConfig } from '../types/schulConfig'

export function istGueltigesGefaess(wert: string, config: SchulConfig): boolean {
  return wert !== '' && config.gefaesse.includes(wert)
}
```

- [ ] **Step 3: Tests + Commit**

Run: `npx vitest run src/__tests__/gefaessUtils.test.ts`

```bash
git add src/utils/gefaessUtils.ts src/__tests__/gefaessUtils.test.ts
git commit -m "feat: Gefäss-Validierung gegen schulConfig"
```

---

## Task 9: Fragetypen-Sichtbarkeit pro LP

**Files:**
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx` (Typ-Dropdown filtern)
- Modify: `src/components/lp/HilfeSeite.tsx` oder neue Settings-Sektion (Toggle-UI)
- Modify: `src/hooks/useFragenFilter.ts` (Typ-Filter einschränken)

- [ ] **Step 1: LP-Einstellungen-UI — Fragetypen-Toggles**

In den LP-Einstellungen (HilfeSeite oder eigene Einstellungsseite): Checkliste aller verfügbaren Fragetypen. Jeder Typ hat einen Toggle (an/aus). FiBu-Typen sind nur sichtbar wenn `fachschaften.includes('WR')`.

```tsx
// Pseudocode für Toggle-Liste
const alleTypen = Object.keys(typLabel).filter(t => {
  if (FIBU_TYPEN.has(t)) return istFachschaftMitFiBu(user.fachschaften)
  return true
})
// Toggle speichert in localStorage + optional Backend (LP-Tab)
```

- [ ] **Step 2: FragenEditor — Typ-Dropdown filtern**

Im `FragenEditor.tsx`: Typ-Auswahl zeigt nur `sichtbareTypen` der LP.

```typescript
const sichtbar = alleTypen.filter(t =>
  (user.sichtbareTypen ?? alleTypen).includes(t) &&
  (!FIBU_TYPEN.has(t) || istFachschaftMitFiBu(user.fachschaften))
)
```

- [ ] **Step 3: Speicherung — localStorage als Primär, LP-Tab optional**

```typescript
// Lesen: localStorage zuerst, Fallback auf LP-Profil
const gespeichert = localStorage.getItem('sichtbareTypen')
const sichtbareTypen = gespeichert ? JSON.parse(gespeichert) : user.sichtbareTypen ?? null
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/ src/hooks/
git commit -m "feat: Fragetypen-Sichtbarkeit pro LP konfigurierbar"
```

---

## Task 10: Gefäss-Validierung an 3 Stellen integrieren

**Files:**
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx`
- Modify: `src/components/lp/vorbereitung/PruefungsComposer.tsx`
- Modify: `apps-script-code.js`

- [ ] **Step 1: FragenEditor — Validierung beim Speichern**

```typescript
import { istGueltigesGefaess } from '../../utils/gefaessUtils'
// Beim Speichern:
const ungueltige = gefaesse.filter(g => !istGueltigesGefaess(g, config))
if (ungueltige.length > 0) {
  // Warnung anzeigen, ungültige Gefässe entfernen
}
```

- [ ] **Step 2: PruefungsComposer — Validierung**

Analog: `gefaess`-Feld in PruefungsConfig validieren gegen `config.gefaesse`.

- [ ] **Step 3: Backend — Validierung in speichereFrage/speichereConfig**

```javascript
// In speichereFrage_() / speichereConfig_():
const gueltigeGefaesse = ladeSchulConfig_().gefaesse
const gefaesse = daten.gefaesse || []
const valide = gefaesse.filter(g => gueltigeGefaesse.includes(g))
```

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/frageneditor/FragenEditor.tsx src/components/lp/vorbereitung/PruefungsComposer.tsx apps-script-code.js
git commit -m "feat: Gefäss-Validierung gegen schulConfig an 3 Stellen"
```

---

## Task 11: Punkte ↔ Bewertungsraster Verknüpfung (Spec 1.6)

**Files:**
- Modify: `src/components/lp/frageneditor/FragenEditor.tsx` (Punkte-Berechnung)

- [ ] **Step 1: Automatische Punkte-Berechnung**

Im FragenEditor: Wenn `bewertungsraster.length > 0`, berechne `punkte` als Summe:
```typescript
const berechneteGesamtpunkte = bewertungsraster.reduce((sum, k) => sum + k.punkte, 0)
// Wenn Raster definiert → Punkte-Feld read-only + Auto-Wert
if (bewertungsraster.length > 0) {
  setPunkte(berechneteGesamtpunkte)
}
```

Im JSX: Punkte-Input `disabled={bewertungsraster.length > 0}` + Hinweis "(aus Bewertungsraster)"

- [ ] **Step 2: tsc -b + vitest**

Run: `npx tsc -b && npx vitest run`

- [ ] **Step 3: Commit**

```bash
git add src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "feat: Punkte automatisch aus Bewertungsraster berechnen"
```

---

## Task 12: Demo-Daten + Einrichtungsprüfung aktualisieren

**Files:**
- Modify: `src/data/demoFragen.ts`
- Modify: `src/data/demoKorrektur.ts`
- Modify: `src/data/demoMonitoring.ts`
- Modify: `src/data/einrichtungsFragen.ts`

- [ ] **Step 1: demoFragen.ts — fachbereich → fach + tags**

Alle Demo-Fragen: `fachbereich: 'VWL'` → `fach: 'Wirtschaft & Recht', tags: [{name: 'VWL', farbe: '#f97316', ebene: 'fachschaft'}]`
Analog für BWL, Recht.

- [ ] **Step 2: einrichtungsFragen.ts anpassen**

Gleiche Änderung für die Einrichtungsprüfung.

- [ ] **Step 3: demoKorrektur.ts + demoMonitoring.ts**

E-Mails und Fachschaft-Referenzen prüfen/anpassen.

- [ ] **Step 4: tsc -b + vitest + npm run build**

Run: `npx tsc -b && npx vitest run && npm run build`
Expected: Alles grün, Build erfolgreich

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "refactor: Demo-Daten auf fach/tags/fachschaften umgestellt"
```

---

## Task 13: Abschluss-Verifikation

- [ ] **Step 1: TypeScript strikt prüfen**

Run: `npx tsc -b`
Expected: 0 errors

- [ ] **Step 2: Alle Tests**

Run: `npx vitest run`
Expected: Alle Tests grün

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build erfolgreich

- [ ] **Step 4: Manuelle Prüfung im Browser**

Run: `npm run dev`
Checklist:
- [ ] Login-Screen zeigt "GH" (oder konfiguriertes Kürzel) + Schulname
- [ ] Demo-Modus: Fragen haben `fach` + farbige Tags
- [ ] FragenEditor: Fach-Dropdown zeigt alle Fächer, Tag-Picker funktioniert
- [ ] FragenBrowser: Filter nach Fach + Tags
- [ ] Gefäss-Auswahl zeigt 5 Optionen (SF, EF, EWR, GF, FF)
- [ ] FiBu-Fragetypen nur sichtbar wenn WR-LP (Demo)

- [ ] **Step 5: HANDOFF.md aktualisieren**

Neue Session mit Zusammenfassung der Architektur-Änderungen.

- [ ] **Step 6: Finaler Commit + Push**

```bash
git add -A
git commit -m "feat: Architektur-Generalisierung komplett — fachunabhängige Plattform"
git push
```

---

## Hinweis für nachfolgende Pläne

Dieser Plan ist **Plan 1 von 5**. Die weiteren Pläne werden separat erstellt:
- Plan 2: Quick-Wins (A1–A4)
- Plan 3: Neue Fragetypen (B1–B3)
- Plan 4: Medien (C1–C4)
- Plan 5: Editoren (A5+A6+D1+D2)

Jeder nachfolgende Plan setzt voraus, dass Plan 1 abgeschlossen ist.
