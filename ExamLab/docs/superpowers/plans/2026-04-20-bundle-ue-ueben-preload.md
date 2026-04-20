# Bundle Ü — Üben-Pre-Load Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selbstständiges Üben erhält instant Client-seitige Korrektur: Lösungs-Felder werden beim Session-Start **in einem separaten autorisierten Call** geladen und in die Session-internen Frage-Kopien gemerged. Server-Korrektur `lernplattformPruefeAntwort` bleibt als Pro-Frage-Fallback bei Pre-Load-Fehlern.

**Architecture:** Eine `LOESUNGS_FELDER_`-Konstante im Apps-Script-Backend ist Single Source of Truth für Lösungs-Felder pro Fragetyp. `bereinigeFrageFuerSuS_` (Bundle P, Retrofit) und `extrahiereLoesungsSlice_` (Bundle Ü, neu) iterieren deklarativ darüber — Feld-Ergänzungen in Zukunft = eine Stelle. Der neue Endpoint `lernplattformLadeLoesungen` liefert eine flache Map `{ [frageId]: LoesungsSlice }`. Frontend merged Lösungen in `session.fragen` und trackt pro Frage via `loesungenPreloaded: Record<string, boolean>`, ob clientseitig oder serverseitig korrigiert wird.

**Tech Stack:** React 19 + TypeScript + Zustand, Vitest, Google Apps Script (ES5-Style), bestehender `uebenApiClient` + `apiClient`-Infrastruktur.

**Spec:** `ExamLab/docs/superpowers/specs/2026-04-20-musterloesungen-bereinigung-design.md` (Abschnitt Bundle Ü)

**Branch:** `feature/bundle-ue-ueben-preload` (aktiv, Plan-Commit `7093636`)

**Design-Entscheidungen (vom User am 2026-04-20 bestätigt):**
- Aufgabengruppe-Serialisierung: **flache Map** (alle Teilaufgaben-IDs als eigene Map-Keys)
- Partial-Pre-Load-Fallback: **pro-Frage** via `Record<frageId, boolean>`
- **Code-Wiederverwendung maximiert:** DRY-Konstante `LOESUNGS_FELDER_` teilt Feldliste zwischen Bereinigungs- und Extraktions-Pfad.

**Scope-Klarstellung:**
- Bundle Ü betrifft **ausschliesslich selbstständiges Üben** (`/sus/ueben`). Angeleitetes Prüfen + Prüfung nutzen den `ladePruefung`-Pfad (Bundle P), der Lösungen gar nicht lädt. Dort brauchen wir keinen Instant-Korrektur-Mechanismus, weil Korrektur erst nach LP-Freigabe passiert.

---

## File Structure

**Create:**
- `ExamLab/src/types/ueben/loesung.ts` — Typ-Definitionen `LoesungsSlice` + `LoesungsMap`
- `ExamLab/src/services/uebenLoesungsApi.ts` — Service-Adapter für `lernplattformLadeLoesungen`
- `ExamLab/src/tests/uebenLoesungsApi.test.ts` — Service-Unit-Tests
- `ExamLab/src/tests/uebungsStoreLoesungsPreload.test.ts` — Store-Integration-Tests (Merge + Fallback)

**Modify:**
- `ExamLab/apps-script-code.js` — neue Konstante `LOESUNGS_FELDER_`, `bereinigeFrageFuerSuS_` refactor (Verhalten identisch), neue Funktion `extrahiereLoesungsSlice_`, neuer Endpoint-Dispatch + Handler
- `ExamLab/src/store/ueben/uebungsStore.ts` — `loesungenPreloaded`-State, Merge-Logik in `starteSession`, Branch-Logik in `beantworteById`
- `ExamLab/HANDOFF.md` — Session 127 Bundle Ü

**No changes:**
- UI-Komponenten (`UebungsScreen.tsx` etc.) — funktionieren automatisch, weil die gemergte Frage `frage.musterlosung` enthält.
- Prüfungs-Pfad (LP + SuS) — `ladePruefung` nutzt weiterhin `bereinigeFrageFuerSuS_`, Verhalten identisch nach Retrofit.

---

## Test-Strategie

1. **Vitest Unit + Integration** — Service-Call, Store-Merge-Logik, Branch-Logik, Partial-Fallback-Pfad. Bestehende `uebenSecurityInvariant`-Tests bleiben grün (strenge Bereinigung unverändert).
2. **Apps-Script nicht direkt vitest-testbar** — Retrofit-Verifikation via Staging-E2E: Bundle-P-Test (2412 Fragen, 0 Sperrlist-Hits) läuft nach Refactor weiterhin clean. Neue `extrahiereLoesungsSlice_` wird am Endpoint verifiziert.
3. **Staging-E2E** — echte Logins, Üben-Session starten, Network-Tab-Audit: genau 1 Pre-Load-Call, alle Auto-Korrektur-Typen geben instant Feedback, Partial-Fallback-Simulation.

---

## Task 1: Frontend-Types `LoesungsSlice` + `LoesungsMap`

**Files:**
- Create: `ExamLab/src/types/ueben/loesung.ts`

- [ ] **Step 1: Typ-Datei anlegen**

Neue Datei `ExamLab/src/types/ueben/loesung.ts`:

```typescript
/**
 * Lösungs-Slice einer Frage — nur Lösungs-relevante Felder.
 * Wird vom Apps-Script-Endpoint `lernplattformLadeLoesungen` geliefert und
 * vor der clientseitigen Korrektur in die Frage-Kopie gemerged.
 *
 * Aufgabengruppen werden flach serialisiert: jede Teilaufgabe ist ein
 * eigener Key in der LoesungsMap (keine Verschachtelung).
 *
 * Reihenfolgen-kritische Felder (Sortierung, Zuordnung) enthalten die
 * Original-Reihenfolge vor Fisher-Yates-Mischung — der Ladepfad liefert
 * gemischte Versionen, der Lösungspfad die Wahrheit.
 *
 * Die Feldliste spiegelt LOESUNGS_FELDER_ im Apps-Script-Backend.
 */
export interface LoesungsSlice {
  // Gemeinsame Lösungs-Metadaten
  musterlosung?: string
  bewertungsraster?: unknown

  // MC
  optionen?: Array<{ id: string; korrekt?: boolean; erklaerung?: string }>

  // R/F
  aussagen?: Array<{ id: string; korrekt?: boolean; erklaerung?: string }>

  // Lückentext
  luecken?: Array<{ id: string; korrekteAntworten?: string[]; korrekt?: string }>

  // Berechnung
  ergebnisse?: Array<{ id: string; korrekt?: number; toleranz?: number }>

  // Sortierung / Zuordnung — Reihenfolgen-kritisch
  elemente?: unknown[]
  paare?: Array<{ links: string; rechts: string }>

  // Formel
  korrekteFormel?: string
  korrekt?: string | number | boolean

  // Buchungssatz
  buchungen?: unknown[]
  korrektBuchung?: unknown
  sollEintraege?: unknown[]
  habenEintraege?: unknown[]

  // FiBu-Konten
  konten?: Array<{
    id: string
    korrekt?: boolean | string
    eintraege?: unknown[]
    saldo?: number
    anfangsbestand?: number
  }>

  // Bilanzstruktur
  bilanzEintraege?: Array<{ id: string; korrekt?: boolean }>
  loesung?: unknown

  // Kontenbestimmung
  aufgaben?: Array<{ id: string; erwarteteAntworten?: string[] }>

  // Bildbeschriftung / DragDrop
  labels?: Array<{ id: string; zoneId?: string; zone?: string; korrekt?: boolean }>
  beschriftungen?: Array<{ id: string; korrekt?: boolean }>
  zielzonen?: Array<{ id: string; korrektesLabel?: string }>

  // Hotspot
  bereiche?: Array<{ id: string; korrekt?: boolean }>
  hotspots?: Array<{ id: string; korrekt?: boolean }>
}

/**
 * Flache Map von frageId zu LoesungsSlice. Teilaufgaben von
 * Aufgabengruppen sind eigene Keys (nicht verschachtelt).
 */
export type LoesungsMap = Record<string, LoesungsSlice>
```

- [ ] **Step 2: TypeScript-Build**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b
```

Erwartet: exit 0.

- [ ] **Step 3: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/src/types/ueben/loesung.ts
git commit -m "$(cat <<'EOF'
ExamLab: LoesungsSlice + LoesungsMap Types (Bundle Ü)

Flach serialisierte Map von frageId zu Lösungs-Slice. Teilaufgaben
von Aufgabengruppen sind eigene Map-Keys. Feldliste spiegelt die
geplante LOESUNGS_FELDER_-Konstante im Apps-Script (Task 3).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Frontend-Service `uebenLoesungsApi`

**Files:**
- Create: `ExamLab/src/services/uebenLoesungsApi.ts`
- Create: `ExamLab/src/tests/uebenLoesungsApi.test.ts`

**Reference:** bestehender Service `ExamLab/src/services/uebenKorrekturApi.ts` (gleiche Struktur, `uebenApiClient.post<T>`).

- [ ] **Step 1: Test schreiben (TDD)**

`ExamLab/src/tests/uebenLoesungsApi.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ladeLoesungenApi } from '../services/uebenLoesungsApi'

vi.mock('../services/ueben/apiClient', () => ({
  uebenApiClient: {
    post: vi.fn(),
  },
}))

import { uebenApiClient } from '../services/ueben/apiClient'

describe('uebenLoesungsApi.ladeLoesungenApi', () => {
  beforeEach(() => {
    vi.mocked(uebenApiClient.post).mockReset()
  })

  const basisParams = {
    gruppeId: 'g1',
    fragenIds: ['f1', 'f2'],
    email: 'sus@stud.test',
    token: 'tok-abc',
    fachbereich: 'VWL',
  }

  it('ruft lernplattformLadeLoesungen mit korrektem Payload', async () => {
    vi.mocked(uebenApiClient.post).mockResolvedValue({
      success: true,
      loesungen: { f1: { musterlosung: 'X' }, f2: { optionen: [{ id: 'o1', korrekt: true }] } },
    })

    const result = await ladeLoesungenApi(basisParams)

    expect(uebenApiClient.post).toHaveBeenCalledWith(
      'lernplattformLadeLoesungen',
      {
        gruppeId: 'g1',
        fragenIds: ['f1', 'f2'],
        email: 'sus@stud.test',
        fachbereich: 'VWL',
      },
      'tok-abc',
    )
    expect(result).toEqual({
      f1: { musterlosung: 'X' },
      f2: { optionen: [{ id: 'o1', korrekt: true }] },
    })
  })

  it('wirft bei success:false', async () => {
    vi.mocked(uebenApiClient.post).mockResolvedValue({ success: false, error: 'Rate limit' })
    await expect(ladeLoesungenApi(basisParams)).rejects.toThrow('Rate limit')
  })

  it('wirft bei Netzwerk-Fehler', async () => {
    vi.mocked(uebenApiClient.post).mockRejectedValue(new Error('timeout'))
    await expect(ladeLoesungenApi(basisParams)).rejects.toThrow('timeout')
  })

  it('lässt fachbereich weg wenn nicht gesetzt', async () => {
    vi.mocked(uebenApiClient.post).mockResolvedValue({ success: true, loesungen: {} })

    await ladeLoesungenApi({ ...basisParams, fachbereich: undefined })

    expect(uebenApiClient.post).toHaveBeenCalledWith(
      'lernplattformLadeLoesungen',
      { gruppeId: 'g1', fragenIds: ['f1', 'f2'], email: 'sus@stud.test' },
      'tok-abc',
    )
  })
})
```

- [ ] **Step 2: Test laufen lassen — soll durchfallen**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/tests/uebenLoesungsApi.test.ts
```

Erwartet: FAIL mit "Cannot find module '../services/uebenLoesungsApi'".

- [ ] **Step 3: Service implementieren**

`ExamLab/src/services/uebenLoesungsApi.ts`:

```typescript
import { uebenApiClient } from './ueben/apiClient'
import type { LoesungsMap } from '../types/ueben/loesung'

export interface LadeLoesungenParams {
  gruppeId: string
  fragenIds: string[]
  email: string
  token: string
  /** Optional: spart Server ~75% Sheet-Reads (1 Tab statt 4 durchsuchen) */
  fachbereich?: string
}

interface LadeLoesungenResponse {
  success: boolean
  loesungen?: LoesungsMap
  error?: string
}

/**
 * Ruft den Apps-Script-Endpoint `lernplattformLadeLoesungen` auf.
 * Liefert eine flache Map {frageId → LoesungsSlice} zurück oder wirft
 * bei success:false / Netzwerk-Fehler.
 *
 * Wird beim Session-Start im selbstständigen Üben-Modus aufgerufen,
 * damit clientseitige Korrektur instant Feedback geben kann.
 */
export async function ladeLoesungenApi(params: LadeLoesungenParams): Promise<LoesungsMap> {
  const { gruppeId, fragenIds, email, token, fachbereich } = params
  const payload: Record<string, unknown> = { gruppeId, fragenIds, email }
  if (fachbereich) payload.fachbereich = fachbereich

  const response = await uebenApiClient.post<LadeLoesungenResponse>(
    'lernplattformLadeLoesungen',
    payload,
    token,
  )
  if (!response?.success) {
    throw new Error(response?.error || 'Lösungs-Preload fehlgeschlagen')
  }
  return response.loesungen || {}
}
```

- [ ] **Step 4: Test laufen lassen — alle grün**

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/tests/uebenLoesungsApi.test.ts
```

Erwartet: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/src/services/uebenLoesungsApi.ts ExamLab/src/tests/uebenLoesungsApi.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: Service uebenLoesungsApi + Tests (Bundle Ü)

Adapter für lernplattformLadeLoesungen Apps-Script-Endpoint.
4 Tests decken Standard-Payload, success:false, Netzwerk-Fehler
und optionalen fachbereich-Hint ab.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Backend — `LOESUNGS_FELDER_` + Refactor + `extrahiereLoesungsSlice_`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

Das ist der DRY-Kern dieses Plans. Eine gemeinsame Konstante beschreibt Lösungs-Felder deklarativ. Beide Funktionen (`bereinigeFrageFuerSuS_` retrofit + `extrahiereLoesungsSlice_` neu) iterieren darüber.

**Atomarer Commit.** Keine Zwischenzustände committen — bereinigeFrageFuerSuS_ muss nach dem Refactor **verhaltens-identisch** sein zu vor dem Refactor (Bundle-P-Verifikation muss weiter grün sein).

### Step 3.1: `LOESUNGS_FELDER_`-Konstante einfügen

Öffne `ExamLab/apps-script-code.js`. Suche die Funktion `bereinigeFrageFuerSuS_` (aktuell bei Zeile ~1700 nach Bundle P). Direkt **VOR** der JSDoc von `bereinigeFrageFuerSuS_` (nach der schliessenden `}` von `mischeFrageOptionen_`) einfügen:

```javascript

/**
 * LOESUNGS_FELDER_ — Single Source of Truth für Lösungs-Felder pro Fragetyp.
 * Beide Funktionen bereinigeFrageFuerSuS_ (delete) und
 * extrahiereLoesungsSlice_ (copy) iterieren deklarativ über diese Struktur.
 *
 * Ein neues Lösungs-Feld hinzufügen = genau eine Stelle editieren.
 *
 * Struktur:
 * - einfach: Top-level-Felder ohne Typ-Bedingung (musterlosung, bewertungsraster)
 * - typSpezifisch: Top-level-Felder, optional auf bestimmten Typ beschränkt
 * - arrays: Array-Felder mit Sub-Lösungsfeldern (optionen[].korrekt etc.)
 * - reihenfolge: Reihenfolgen-kritisch — werden NICHT gelöscht, sondern
 *   nur in extrahiere als Original-Reihenfolge kopiert (sortierung.elemente,
 *   zuordnung.paare). Der Bereinigungs-Pfad mischt sie via mischeFrageOptionen_.
 * - konten: Spezialfall mit bedingtem anfangsbestand (nur bei !anfangsbestandVorgegeben)
 * - labels: Spezialfall mit String-Guard (primitive labels unverändert durchreichen)
 */
var LOESUNGS_FELDER_ = {
  einfach: ['musterlosung', 'bewertungsraster'],

  typSpezifisch: [
    { feld: 'korrekteFormel' },
    { feld: 'korrekt', nurBeiTyp: 'formel' },
    { feld: 'buchungen' },
    { feld: 'korrektBuchung' },
    { feld: 'sollEintraege' },
    { feld: 'habenEintraege' },
    { feld: 'loesung' },
  ],

  arrays: [
    { feld: 'optionen', subFelder: ['korrekt', 'erklaerung'] },
    { feld: 'aussagen', subFelder: ['korrekt', 'erklaerung'] },
    { feld: 'luecken', subFelder: ['korrekteAntworten', 'korrekt'] },
    { feld: 'ergebnisse', subFelder: ['korrekt', 'toleranz'] },
    { feld: 'bilanzEintraege', subFelder: ['korrekt'] },
    { feld: 'aufgaben', subFelder: ['erwarteteAntworten'] },
    { feld: 'beschriftungen', subFelder: ['korrekt'] },
    { feld: 'zielzonen', subFelder: ['korrektesLabel'] },
    { feld: 'bereiche', subFelder: ['korrekt'], nurBeiTyp: 'hotspot' },
    { feld: 'hotspots', subFelder: ['korrekt'], nurBeiTyp: 'hotspot' },
  ],

  reihenfolge: [
    { feld: 'elemente', nurBeiTyp: 'sortierung' },
    { feld: 'paare', nurBeiTyp: 'zuordnung' },
  ],

  konten: {
    subFelder: ['korrekt', 'eintraege', 'saldo'],
    bedingteSubFelder: [
      { feld: 'anfangsbestand', bedingung: function(k) { return !k.anfangsbestandVorgegeben; } },
    ],
  },

  labels: {
    nurBeiTypen: ['bildbeschriftung', 'dragdrop_bild'],
    subFelder: ['zoneId', 'zone', 'korrekt'],
  },
};
```

Achte auf die Leerzeile vor der JSDoc der Konstante und NACH der schliessenden `};`.

### Step 3.2: `bereinigeFrageFuerSuS_` refactoren (Verhalten identisch zu Bundle P)

Ersetze die komplette Funktion `bereinigeFrageFuerSuS_` (nach Bundle P der gesamte Block inkl. JSDoc und Body) durch:

```javascript
/**
 * Strenge Bereinigung für alle SuS-Ladepfade (Prüfung + angeleitete Übung + selbstständiges Üben).
 * Liefert Deep-Copy ohne jegliche Lösungsfelder; keine Mischung (dafür siehe mischeFrageOptionen_).
 * Rekursiv für Aufgabengruppen. Einziger kanonischer SuS-Bereinigungs-Pfad.
 *
 * Iteriert deklarativ über LOESUNGS_FELDER_ — Single Source of Truth.
 */
function bereinigeFrageFuerSuS_(frage) {
  var f = JSON.parse(JSON.stringify(frage)); // Deep Copy

  // Einfache Felder (gemeinsam)
  for (var i = 0; i < LOESUNGS_FELDER_.einfach.length; i++) {
    delete f[LOESUNGS_FELDER_.einfach[i]];
  }

  // Typ-spezifische Top-Level-Felder.
  // Truthy-Guard bewusst (NICHT `!== undefined`) — matcht das Live-Verhalten
  // von Bundle P (z.B. `if (f.buchungen) delete f.buchungen`). Änderung zu
  // `!== undefined` wäre eine stille Verhaltens-Abweichung (würde auch
  // `korrekt: 0` / `korrekt: false` bei Formel löschen, was Live nicht tut).
  for (var j = 0; j < LOESUNGS_FELDER_.typSpezifisch.length; j++) {
    var ts = LOESUNGS_FELDER_.typSpezifisch[j];
    if (ts.nurBeiTyp && f.typ !== ts.nurBeiTyp) continue;
    if (f[ts.feld]) delete f[ts.feld];
  }

  // Array-Felder: Sub-Lösungsfelder entfernen
  for (var k = 0; k < LOESUNGS_FELDER_.arrays.length; k++) {
    var arr = LOESUNGS_FELDER_.arrays[k];
    if (arr.nurBeiTyp && f.typ !== arr.nurBeiTyp) continue;
    if (Array.isArray(f[arr.feld])) {
      f[arr.feld] = f[arr.feld].map(function(item) {
        var cleaned = Object.assign({}, item);
        for (var s = 0; s < arr.subFelder.length; s++) {
          delete cleaned[arr.subFelder[s]];
        }
        return cleaned;
      });
    }
  }

  // Reihenfolgen-kritische Felder: NICHT löschen — Mischung via mischeFrageOptionen_
  // (kein delete-Code hier, absichtlich leer)

  // Konten: feste + bedingte Sub-Felder
  if (Array.isArray(f.konten)) {
    f.konten = f.konten.map(function(k) {
      var c = Object.assign({}, k);
      for (var s = 0; s < LOESUNGS_FELDER_.konten.subFelder.length; s++) {
        delete c[LOESUNGS_FELDER_.konten.subFelder[s]];
      }
      for (var bs = 0; bs < LOESUNGS_FELDER_.konten.bedingteSubFelder.length; bs++) {
        var b = LOESUNGS_FELDER_.konten.bedingteSubFelder[bs];
        if (b.bedingung(c)) delete c[b.feld];
      }
      return c;
    });
  }

  // Labels (bildbeschriftung/dragdrop_bild): primitive durchreichen, Objekt-Felder entfernen
  if (LOESUNGS_FELDER_.labels.nurBeiTypen.indexOf(f.typ) !== -1 && Array.isArray(f.labels)) {
    f.labels = f.labels.map(function(l) {
      if (typeof l !== 'object' || l === null) return l;
      var c = Object.assign({}, l);
      for (var s = 0; s < LOESUNGS_FELDER_.labels.subFelder.length; s++) {
        delete c[LOESUNGS_FELDER_.labels.subFelder[s]];
      }
      return c;
    });
  }

  // Aufgabengruppe: rekursiv bereinigen
  if (Array.isArray(f.teilaufgaben)) {
    f.teilaufgaben = f.teilaufgaben.map(bereinigeFrageFuerSuS_);
  }

  return f;
}
```

### Step 3.3: `extrahiereLoesungsSlice_` einfügen

Direkt **NACH** der refactorierten `bereinigeFrageFuerSuS_` (vor `bereinigeFrageFuerSuSUeben_`) einfügen:

```javascript

/**
 * Extrahiert Lösungs-Felder einer Original-Frage als LoesungsSlice.
 * Umkehrfunktion von bereinigeFrageFuerSuS_ — nutzt dieselbe LOESUNGS_FELDER_-
 * Konstante. Was dort gelöscht wird, wird hier kopiert.
 *
 * Reihenfolgen-kritische Felder (sortierung.elemente, zuordnung.paare) werden
 * hier in Original-Form kopiert (Lösung), weil der Ladepfad sie mischt.
 *
 * Rückgabe enthält NUR Lösungs-Felder (keine Frage-Metadaten wie fragetext).
 */
function extrahiereLoesungsSlice_(frage) {
  var slice = {};

  // Einfache Felder (gemeinsam)
  for (var i = 0; i < LOESUNGS_FELDER_.einfach.length; i++) {
    var ef = LOESUNGS_FELDER_.einfach[i];
    if (frage[ef] !== undefined && frage[ef] !== '') slice[ef] = frage[ef];
  }

  // Typ-spezifische Top-Level-Felder
  for (var j = 0; j < LOESUNGS_FELDER_.typSpezifisch.length; j++) {
    var ts = LOESUNGS_FELDER_.typSpezifisch[j];
    if (ts.nurBeiTyp && frage.typ !== ts.nurBeiTyp) continue;
    if (frage[ts.feld] !== undefined) slice[ts.feld] = frage[ts.feld];
  }

  // Array-Felder: id + Sub-Lösungsfelder in slice kopieren
  for (var k = 0; k < LOESUNGS_FELDER_.arrays.length; k++) {
    var arr = LOESUNGS_FELDER_.arrays[k];
    if (arr.nurBeiTyp && frage.typ !== arr.nurBeiTyp) continue;
    if (Array.isArray(frage[arr.feld])) {
      slice[arr.feld] = frage[arr.feld].map(function(item) {
        var out = { id: item.id };
        for (var s = 0; s < arr.subFelder.length; s++) {
          var sf = arr.subFelder[s];
          if (item[sf] !== undefined) out[sf] = item[sf];
        }
        return out;
      });
    }
  }

  // Reihenfolgen-kritisch: Original-Reihenfolge in slice übernehmen
  for (var r = 0; r < LOESUNGS_FELDER_.reihenfolge.length; r++) {
    var rf = LOESUNGS_FELDER_.reihenfolge[r];
    if (frage.typ === rf.nurBeiTyp && Array.isArray(frage[rf.feld])) {
      if (rf.feld === 'paare') {
        slice.paare = frage.paare.map(function(p) { return { links: p.links, rechts: p.rechts }; });
      } else {
        slice[rf.feld] = frage[rf.feld].slice();
      }
    }
  }

  // Konten: feste + bedingte Sub-Felder kopieren
  if (Array.isArray(frage.konten)) {
    slice.konten = frage.konten.map(function(k) {
      var out = { id: k.id };
      for (var s = 0; s < LOESUNGS_FELDER_.konten.subFelder.length; s++) {
        var sf = LOESUNGS_FELDER_.konten.subFelder[s];
        if (k[sf] !== undefined) out[sf] = k[sf];
      }
      for (var bs = 0; bs < LOESUNGS_FELDER_.konten.bedingteSubFelder.length; bs++) {
        var b = LOESUNGS_FELDER_.konten.bedingteSubFelder[bs];
        if (b.bedingung(k) && k[b.feld] !== undefined) out[b.feld] = k[b.feld];
      }
      return out;
    });
  }

  // Labels: primitive durchreichen, Objekte auf id + Sub-Felder reduzieren
  if (LOESUNGS_FELDER_.labels.nurBeiTypen.indexOf(frage.typ) !== -1 && Array.isArray(frage.labels)) {
    slice.labels = frage.labels.map(function(l) {
      if (typeof l !== 'object' || l === null) return l;
      var out = { id: l.id };
      for (var s = 0; s < LOESUNGS_FELDER_.labels.subFelder.length; s++) {
        var sf = LOESUNGS_FELDER_.labels.subFelder[s];
        if (l[sf] !== undefined) out[sf] = l[sf];
      }
      return out;
    });
  }

  return slice;
}
```

### Step 3.4: Sanity + Grep-Verifikation

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
node --check apps-script-code.js
```

Erwartet: exit 0.

```bash
grep -n "LOESUNGS_FELDER_" apps-script-code.js | wc -l
```

Erwartet: ≥20 Treffer (Definition + viele Zugriffe in beiden Funktionen).

```bash
grep -n "function bereinigeFrageFuerSuS_\|function extrahiereLoesungsSlice_\|function bereinigeFrageFuerSuSUeben_\|function mischeFrageOptionen_" apps-script-code.js
```

Erwartet: 4 Funktions-Definitionen, jede genau einmal.

### Step 3.5: Vitest + Build

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b && npx vitest run && npm run build
```

Erwartet: alle exit 0, vitest 429+ grün (neue Tests aus Tasks 1-2 + bestehende).

### Step 3.6: Commit

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: LOESUNGS_FELDER_ Konstante + extrahiereLoesungsSlice_ (Bundle Ü)

Refactor: bereinigeFrageFuerSuS_ (Bundle P) iteriert jetzt deklarativ
über die neue LOESUNGS_FELDER_-Konstante. Verhalten unverändert (selbe
Feldliste wie vorher, selber Output für 2412-Fragen-Staging-Test).

Neu: extrahiereLoesungsSlice_ — Umkehrfunktion, nutzt dieselbe Konstante.
Kopiert Lösungs-Felder einer Original-Frage in ein flaches LoesungsSlice-
Objekt. Reihenfolgen-kritische Felder (elemente, paare) werden als
Original-Reihenfolge geliefert (Ladepfad mischt sie).

Single Source of Truth: Ein neues Lösungs-Feld hinzufügen = genau eine
Stelle editieren (LOESUNGS_FELDER_). Beide Funktionen übernehmen automatisch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Backend — Endpoint `lernplattformLadeLoesungen`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

Neuer Endpoint spiegelt `lernplattformPruefeAntwort` in Auth-Logik und Rate-Limit.

### Step 4.1: Dispatch-Case einfügen

Suche im Code den Dispatch-Block mit `case 'lernplattformPruefeAntwort':`. Direkt NACH diesem Case einfügen:

```javascript
    case 'lernplattformLadeLoesungen':
      return lernplattformLadeLoesungen(body);
```

### Step 4.2: Handler einfügen

Suche `function lernplattformPruefeAntwort(body) {` und die schliessende `}`. Direkt nach dieser schliessenden `}` einfügen:

```javascript

/**
 * Liefert eine flache Map {frageId → LoesungsSlice} für die gegebenen
 * Fragen-IDs. Enthält nur Lösungs-Felder (siehe extrahiereLoesungsSlice_).
 *
 * Wird vom Frontend beim Session-Start im selbstständigen Üben-Modus
 * aufgerufen, damit clientseitige Korrektur instant Feedback geben kann.
 *
 * Auth: Token-Pflicht, Mitgliedschaft-Check (wie lernplattformPruefeAntwort).
 * Rate-Limit: 5 Calls/Minute pro SuS (1 Call pro Session-Start reicht).
 * Aufgabengruppen: Teilaufgaben als eigene Map-Keys (flach serialisiert).
 */
function lernplattformLadeLoesungen(body) {
  var gruppeId = body.gruppeId;
  var fragenIds = body.fragenIds;
  var claimEmail = (body.email || '').toString().toLowerCase();
  var token = body.token || body.sessionToken;

  if (!gruppeId || !Array.isArray(fragenIds) || fragenIds.length === 0 || !claimEmail || !token) {
    return jsonResponse({ success: false, error: 'Fehlende oder ungültige Parameter' });
  }

  if (!lernplattformValidiereToken_(token, claimEmail)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }
  var email = claimEmail;

  // Rate-Limit: 5 Calls/Minute pro SuS
  var rl = lernplattformRateLimitCheck_('lade-loesungen', email, 5, 60);
  if (rl.blocked) return jsonResponse({ success: false, error: rl.error });

  // Gruppe + Mitgliedschaft prüfen
  var mitgliedCheck = istGruppenMitglied_(body, gruppeId);
  if (!mitgliedCheck) {
    return jsonResponse({ success: false, error: 'Kein Zugriff auf diese Gruppe' });
  }
  var gruppe = mitgliedCheck.gruppe;

  // Audit-Log — wer hat wann wieviele Lösungen abgefragt
  try {
    Logger.log('[lernplattformLadeLoesungen] gruppe=%s email=%s n=%s',
      gruppeId, email, String(fragenIds.length));
  } catch (e) { /* Logger-Unavailable nicht kritisch */ }

  var loesungen = {};
  for (var i = 0; i < fragenIds.length; i++) {
    var frageId = fragenIds[i];
    var frage = ladeFrageUnbereinigtById_(frageId, gruppe, body.fachbereich);
    if (!frage) continue; // Lücke → Client fällt pro-Frage zurück

    loesungen[frageId] = extrahiereLoesungsSlice_(frage);
    // Aufgabengruppe: Teilaufgaben als eigene Map-Keys ergänzen
    if (frage.typ === 'aufgabengruppe' && Array.isArray(frage.teilaufgaben)) {
      for (var t = 0; t < frage.teilaufgaben.length; t++) {
        var ta = frage.teilaufgaben[t];
        if (ta && ta.id) {
          loesungen[ta.id] = extrahiereLoesungsSlice_(ta);
        }
      }
    }
  }

  return jsonResponse({ success: true, loesungen: loesungen });
}
```

### Step 4.3: Sanity + Grep

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
node --check apps-script-code.js
```

```bash
grep -n "lernplattformLadeLoesungen" apps-script-code.js
```

Erwartet: 3 Treffer (case-dispatch, Funktions-Definition, JSDoc-Mention).

```bash
grep -n "extrahiereLoesungsSlice_" apps-script-code.js
```

Erwartet: 3 Treffer (Funktions-Definition + 2 Aufrufe im Handler).

### Step 4.4: Commit

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
ExamLab: Endpoint lernplattformLadeLoesungen (Bundle Ü)

Neuer Apps-Script-Endpoint für Lösungs-Preload im Üben-Flow:
- Token-Auth + Mitgliedschaft-Check (wie lernplattformPruefeAntwort)
- Rate-Limit 5/Minute pro SuS
- Returns flache Map {frageId → LoesungsSlice}
- Aufgabengruppen: Teilaufgaben als eigene Map-Keys
- Audit-Log via Logger.log
- Nutzt extrahiereLoesungsSlice_ (Task 3) als Single Source of Truth

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Store-Integration — Pre-Load beim Session-Start

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`

Erweiterung:
- `loesungenPreloaded: Record<string, boolean>` (State).
- `starteSession`: ruft nach `erstelleBlock` den Lösungs-Preload, merged Lösungen in `session.fragen`, setzt `loesungenPreloaded` pro frageId.
- `beantworteById`: liest `loesungenPreloaded[frageId]` — true = clientseitige Korrektur wie bisher; false = delegiert an `pruefeAntwortJetzt(frageId)`.

### Step 5.1: Import + State-Feld + Interface

Öffne `ExamLab/src/store/ueben/uebungsStore.ts`.

**Neue Imports** (nach `import { pruefeAntwort } from '../../utils/ueben/korrektur'`):

```typescript
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'
import type { LoesungsMap, LoesungsSlice } from '../../types/ueben/loesung'
```

**Im `UebungsState`-Interface** (nach `letzteMusterloesung: string | null`):

```typescript
  /** Pro-Frage-Map: hat die Lösung (via Pre-Load) oder nicht (Fallback auf Server) */
  loesungenPreloaded: Record<string, boolean>
```

**Im initialen State-Objekt** (nach `letzteMusterloesung: null,`):

```typescript
  loesungenPreloaded: {},
```

### Step 5.2: Merge-Helpers definieren

NACH den Imports und VOR `const HISTORIE_KEY = ...`:

```typescript
/**
 * Merged einen LoesungsSlice in eine Frage-Kopie. Mutiert NICHT die
 * Original-Frage; liefert ein neues Objekt mit kombinierten Feldern.
 *
 * Listen-Felder (optionen[], luecken[], etc.): Merge per id — der
 * gemischte Client-Array wird um die Lösungs-Attribute ergänzt.
 * Reihenfolgen-kritische Felder (elemente[], paare[]) werden aus
 * dem Slice übernommen (überschreibt gemischte Client-Version).
 */
function mergeLoesungInFrage(frage: Frage, slice: LoesungsSlice | undefined): Frage {
  if (!slice) return frage
  const merged: Record<string, unknown> = { ...frage }

  // Top-level einfache Felder (gemeinsam + typSpezifisch)
  if (slice.musterlosung !== undefined) merged.musterlosung = slice.musterlosung
  if (slice.bewertungsraster !== undefined) merged.bewertungsraster = slice.bewertungsraster
  if (slice.korrekteFormel !== undefined) merged.korrekteFormel = slice.korrekteFormel
  if (slice.korrekt !== undefined) merged.korrekt = slice.korrekt
  if (slice.buchungen !== undefined) merged.buchungen = slice.buchungen
  if (slice.korrektBuchung !== undefined) merged.korrektBuchung = slice.korrektBuchung
  if (slice.sollEintraege !== undefined) merged.sollEintraege = slice.sollEintraege
  if (slice.habenEintraege !== undefined) merged.habenEintraege = slice.habenEintraege
  if (slice.loesung !== undefined) merged.loesung = slice.loesung

  // Reihenfolgen-kritisch: Lösung überschreibt Mischung
  if (slice.elemente !== undefined) merged.elemente = slice.elemente
  if (slice.paare !== undefined) merged.paare = slice.paare

  // Listen-Felder per id mergen
  type IdItem = { id?: string }
  const mergeById = (base: unknown, patches: IdItem[] | undefined): unknown => {
    if (!Array.isArray(base) || !patches) return base
    const patchMap = new Map<string, IdItem>()
    for (const p of patches) if (p && p.id) patchMap.set(p.id, p)
    return base.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return item
      const withId = item as IdItem
      const patch = withId.id ? patchMap.get(withId.id) : undefined
      return patch ? { ...withId, ...patch } : item
    })
  }

  if (slice.optionen) merged.optionen = mergeById(merged.optionen, slice.optionen)
  if (slice.aussagen) merged.aussagen = mergeById(merged.aussagen, slice.aussagen)
  if (slice.luecken) merged.luecken = mergeById(merged.luecken, slice.luecken)
  if (slice.ergebnisse) merged.ergebnisse = mergeById(merged.ergebnisse, slice.ergebnisse)
  if (slice.konten) merged.konten = mergeById(merged.konten, slice.konten)
  if (slice.bilanzEintraege) merged.bilanzEintraege = mergeById(merged.bilanzEintraege, slice.bilanzEintraege)
  if (slice.aufgaben) merged.aufgaben = mergeById(merged.aufgaben, slice.aufgaben)
  if (slice.labels) merged.labels = mergeById(merged.labels, slice.labels)
  if (slice.beschriftungen) merged.beschriftungen = mergeById(merged.beschriftungen, slice.beschriftungen)
  if (slice.zielzonen) merged.zielzonen = mergeById(merged.zielzonen, slice.zielzonen)
  if (slice.bereiche) merged.bereiche = mergeById(merged.bereiche, slice.bereiche)
  if (slice.hotspots) merged.hotspots = mergeById(merged.hotspots, slice.hotspots)

  return merged as Frage
}

/**
 * Merged die Lösungs-Map in die Frage-Liste. Aufgabengruppen erhalten
 * sowohl ihren eigenen Slice als auch die Slices ihrer Teilaufgaben
 * (flache Map-Lookup).
 */
function mergeLoesungen(
  fragen: Frage[],
  loesungen: LoesungsMap,
): { fragen: Frage[]; preloaded: Record<string, boolean> } {
  const preloaded: Record<string, boolean> = {}
  const merged = fragen.map((f) => {
    const frageSlice = loesungen[f.id]
    preloaded[f.id] = frageSlice !== undefined
    let out = mergeLoesungInFrage(f, frageSlice)
    const outWithTa = out as Frage & { teilaufgaben?: Frage[] }
    if (Array.isArray(outWithTa.teilaufgaben)) {
      outWithTa.teilaufgaben = outWithTa.teilaufgaben.map((ta: Frage) => {
        const taSlice = loesungen[ta.id]
        preloaded[ta.id] = taSlice !== undefined
        return mergeLoesungInFrage(ta, taSlice)
      })
      out = outWithTa
    }
    return out
  })
  return { fragen: merged, preloaded }
}
```

### Step 5.3: `starteSession` erweitern

In `starteSession` — **nach** der Block-Erstellung UND **nach** dem `if (block.length === 0) { set({ ladeStatus: 'fehler' }); return }`-Guard (nicht davor — sonst würde für leere Blöcke ein unnötiger Endpoint-Call mit leerem `fragenIds`-Array ausgelöst), direkt **vor** der Session-Objekt-Erstellung einfügen:

```typescript
      // Lösungs-Preload via separatem Endpoint (Bundle Ü).
      // Bei Erfolg: Lösungen in Frage-Objekte mergen, clientseitige Korrektur möglich.
      // Bei Fehler oder Lücken: pro-Frage-Fallback auf pruefeAntwortJetzt().
      let loesungen: LoesungsMap = {}
      try {
        const { useUebenAuthStore } = await import('./authStore')
        const user = useUebenAuthStore.getState().user
        if (user?.sessionToken) {
          const fragenIds = block.map((f) => f.id)
          for (const f of block) {
            const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
            if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
          }
          loesungen = await ladeLoesungenApi({
            gruppeId,
            fragenIds,
            email: user.email,
            token: user.sessionToken,
            fachbereich: fach,
          })
        }
      } catch (e) {
        console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
      }

      const { fragen: blockMitLoesung, preloaded } = mergeLoesungen(block, loesungen)
```

Ersetze dann im Session-Objekt `fragen: block` durch `fragen: blockMitLoesung`, und im `set({...})`-Aufruf ergänze `loesungenPreloaded: preloaded,`:

```typescript
      const session: UebungsSession = {
        id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        gruppeId, email, fach, thema,
        modus,
        quellen,
        fragen: blockMitLoesung,
        antworten: {},
        ergebnisse: {},
        aktuelleFrageIndex: 0,
        gestartet: new Date().toISOString(),
        unsicher: new Set(),
        uebersprungen: new Set(),
        score: 0,
        freiwillig,
      }

      set({
        session,
        ladeStatus: 'fertig',
        feedbackSichtbar: false,
        letzteAntwortKorrekt: null,
        loesungenPreloaded: preloaded,
      })
```

### Step 5.4: Branch-Logik in `beantworteById`

Ersetze die komplette `beantworteById`-Methode durch:

```typescript
  beantworteById: (frageId, antwort) => {
    const session = get().session
    if (!session) return

    const frage = session.fragen.find(f => f.id === frageId)
    if (!frage) return

    const normalized = normalizeAntwort(antwort)

    // Pro-Frage-Branch: Pre-Load vorhanden → clientseitig; sonst Server-Fallback.
    const preloaded = get().loesungenPreloaded[frageId] === true
    if (!preloaded) {
      // Antwort als Zwischenstand speichern + Server-Korrektur anstossen
      set({
        session: {
          ...session,
          zwischenstande: { ...(session.zwischenstande ?? {}), [frageId]: normalized },
        },
      })
      void get().pruefeAntwortJetzt(frageId)
      return
    }

    const korrekt = pruefeAntwort(frage, normalized)

    if (!session.freiwillig) {
      useUebenFortschrittStore.getState().antwortVerarbeiten(frageId, session.email, korrekt, session.id)
    }

    set({
      session: {
        ...session,
        antworten: { ...session.antworten, [frageId]: normalized },
        ergebnisse: { ...session.ergebnisse, [frageId]: korrekt },
        score: session.score + (korrekt ? 1 : 0),
      },
      feedbackSichtbar: true,
      letzteAntwortKorrekt: korrekt,
    })
  },
```

### Step 5.5: Build + bestehende Tests

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b && npx vitest run
```

Erwartet: tsc exit 0, alle bisher grünen Tests weiter grün.

(Commit kommt in Task 6 zusammen mit den neuen Integration-Tests.)

---

## Task 6: Store-Integration-Tests (Merge + Fallback)

**Files:**
- Create: `ExamLab/src/tests/uebungsStoreLoesungsPreload.test.ts`

### Step 6.1: Test-Datei

`ExamLab/src/tests/uebungsStoreLoesungsPreload.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUebenUebungsStore } from '../store/ueben/uebungsStore'
import type { Frage } from '../types/ueben/fragen'

vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: vi.fn(),
  },
}))
vi.mock('../services/uebenLoesungsApi', () => ({
  ladeLoesungenApi: vi.fn(),
}))
vi.mock('../store/ueben/authStore', () => ({
  useUebenAuthStore: {
    getState: () => ({ user: { email: 'sus@stud.test', sessionToken: 'tok' } }),
  },
}))

import { uebenFragenAdapter } from '../adapters/ueben/appsScriptAdapter'
import { ladeLoesungenApi } from '../services/uebenLoesungsApi'

const mcFrage: Frage = {
  id: 'f1',
  typ: 'mc',
  version: 1,
  erstelltAm: '',
  geaendertAm: '',
  fachbereich: 'VWL',
  fach: 'VWL',
  thema: 'Test',
  unterthema: '',
  bloom: 'K1',
  semester: ['S1'],
  gefaesse: ['SF'],
  tags: [],
  punkte: 1,
  zeitbedarf: 1,
  verwendungen: [],
  quelle: 'manuell',
  autor: { email: 'x', name: 'x' },
  fragetext: 'Welche Antwort ist richtig?',
  optionen: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  mehrfachauswahl: false,
} as Frage

describe('uebungsStore Lösungs-Preload', () => {
  beforeEach(() => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockReset()
    vi.mocked(ladeLoesungenApi).mockReset()
    useUebenUebungsStore.setState({
      session: null,
      ladeStatus: 'idle',
      feedbackSichtbar: false,
      letzteAntwortKorrekt: null,
      speichertPruefung: false,
      pruefFehler: null,
      letzteMusterloesung: null,
      loesungenPreloaded: {},
      historie: [],
    })
  })

  it('merged Lösungs-Slice in Frage und markiert als preloaded', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockResolvedValue({
      f1: { optionen: [{ id: 'a', korrekt: true }], musterlosung: 'A ist korrekt.' },
    })

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')

    const state = useUebenUebungsStore.getState()
    expect(state.ladeStatus).toBe('fertig')
    const session = state.session!
    const frage = session.fragen.find(f => f.id === 'f1') as Frage & { optionen: Array<{id:string; korrekt?:boolean}>; musterlosung?: string }
    expect(frage.optionen.find(o => o.id === 'a')?.korrekt).toBe(true)
    expect(frage.musterlosung).toBe('A ist korrekt.')
    expect(state.loesungenPreloaded.f1).toBe(true)
  })

  it('bei Preload-Fehler startet Session, markiert Fragen NICHT als preloaded', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockRejectedValue(new Error('Rate limit'))

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')

    const state = useUebenUebungsStore.getState()
    expect(state.ladeStatus).toBe('fertig')
    expect(state.session?.fragen.length).toBe(1)
    expect(state.loesungenPreloaded.f1).toBeFalsy()
  })

  it('bei Partial-Response: nur gelieferte Fragen sind preloaded', async () => {
    const mcFrage2: Frage = { ...mcFrage, id: 'f2' } as Frage
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage, mcFrage2])
    vi.mocked(ladeLoesungenApi).mockResolvedValue({
      f1: { optionen: [{ id: 'a', korrekt: true }] },
      // f2 fehlt
    })

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')

    const state = useUebenUebungsStore.getState()
    expect(state.loesungenPreloaded.f1).toBe(true)
    expect(state.loesungenPreloaded.f2).toBe(false)
  })

  it('beantworteById: preloaded=true → clientseitige Korrektur, Ergebnis im Store', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    vi.mocked(ladeLoesungenApi).mockResolvedValue({
      f1: { optionen: [{ id: 'a', korrekt: true }] },
    })

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')
    useUebenUebungsStore.getState().beantworteById('f1', { typ: 'mc', gewaehlt: ['a'] } as never)

    const state = useUebenUebungsStore.getState()
    expect(state.ergebnisse?.f1).toBe(undefined) // state.session.ergebnisse
    expect(state.session?.ergebnisse.f1).toBe(true) // korrekt, weil 'a' die richtige Option ist
    expect(state.feedbackSichtbar).toBe(true)
    expect(state.letzteAntwortKorrekt).toBe(true)
    expect(state.speichertPruefung).toBe(false) // kein Server-Call
  })

  it('beantworteById: preloaded=false → Fallback auf pruefeAntwortJetzt (setzt speichertPruefung)', async () => {
    vi.mocked(uebenFragenAdapter.ladeFragen).mockResolvedValue([mcFrage])
    // Preload scheitert → f1 ist nicht preloaded
    vi.mocked(ladeLoesungenApi).mockRejectedValue(new Error('Rate limit'))

    await useUebenUebungsStore.getState().starteSession('g1', 'sus@stud.test', 'VWL', 'Test')
    expect(useUebenUebungsStore.getState().loesungenPreloaded.f1).toBeFalsy()

    // Server-Korrektur wird asynchron aufgerufen — wir prüfen, dass speichertPruefung
    // sofort (synchron) true wird (via get().pruefeAntwortJetzt → set({ speichertPruefung: true }))
    useUebenUebungsStore.getState().beantworteById('f1', { typ: 'mc', gewaehlt: ['a'] } as never)

    const state = useUebenUebungsStore.getState()
    // Zwischenstand wurde gesetzt
    expect(state.session?.zwischenstande?.f1).toBeDefined()
    // Server-Korrektur-Pfad aktiv: speichertPruefung = true
    expect(state.speichertPruefung).toBe(true)
  })
})
```

### Step 6.2: Tests laufen + Full-Suite

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run src/tests/uebungsStoreLoesungsPreload.test.ts
```

Erwartet: 3/3 PASS.

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx vitest run
```

Erwartet: alle Tests grün (429 + 4 Service + 5 Store = 438).

### Step 6.3: Build

```bash
cd "10 Github/GYM-WR-DUY/ExamLab"
npx tsc -b && npm run build
```

Beide exit 0.

### Step 6.4: Commit (Frontend-Integration gesamt)

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/src/store/ueben/uebungsStore.ts ExamLab/src/tests/uebungsStoreLoesungsPreload.test.ts
git commit -m "$(cat <<'EOF'
ExamLab: uebungsStore Lösungs-Preload + Fallback (Bundle Ü)

starteSession ruft nach ladeFragen den Lösungs-Preload über
uebenLoesungsApi, merged Lösungs-Slices in session.fragen und
markiert pro Frage in loesungenPreloaded (Record<string, boolean>).

beantworteById verzweigt pro Frage:
- preloaded=true: clientseitige pruefeAntwort (instant)
- preloaded=false: Fallback auf pruefeAntwortJetzt (Server-Roundtrip)

mergeLoesungen-Helper: Top-Level-Felder direkt, Listen-Felder per id
gemerged, Reihenfolgen-kritische Felder (elemente, paare) aus Slice
überschreiben den Client-Mischwert. Aufgabengruppen: Teilaufgaben
aus flacher Map per id gemerged.

Lösungen landen NICHT in localStorage (Store hat keine persist-
Middleware, nur historie wird manuell gespeichert).

5 Integration-Tests: Merge, Preload-Fehler-Fallback, Partial-Response, beantworteById-preloaded-Branch, beantworteById-Fallback-Branch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Apps-Script-Deploy + Staging-E2E (User-Aktion)

**Files:**
- Manual: Apps-Script-Editor

**Wichtig:** Dieses Deployment enthält sowohl den Bundle-Ü-Endpoint als auch den Retrofit von `bereinigeFrageFuerSuS_`. Bundle-P-Verhalten muss identisch bleiben.

### Step 7.1: User-Vorbereitung

User-Aktion:
1. Apps-Script-Editor öffnen.
2. "Bereitstellungen verwalten" — aktuelle Version (Bundle P) notieren (Rollback).

### Step 7.2: Deploy

User-Aktion:
1. `ExamLab/apps-script-code.js` komplett in Apps-Script-Editor kopieren.
2. Neue Bereitstellung erstellen.
3. Claude bestätigen: "Apps-Script deployed".

### Step 7.3: Post-Deploy Bundle-P-Regression (Ui kritisch)

Claude-Aktion im SuS-Echt-Tab:

```javascript
// Vollständiger ladeFragen-Test (wie in Bundle-P-Verifikation)
(async function(){
  const auth = JSON.parse(localStorage.getItem('ueben-auth'));
  const url = 'https://script.google.com/macros/s/AKfycbzv88MEo_6VulH4Z10U7IvhNkdISGU5AQRQiCNL72v_N4EDXMvr4PJ5phfPExmJyZN_IA/exec';
  const res = await fetch(url, { method: 'POST', redirect: 'follow',
    body: JSON.stringify({ action: 'lernplattformLadeFragen', gruppeId: 'test', email: auth.email, token: auth.sessionToken })
  });
  const body = await res.json();
  const SPERR = ['musterlosung','bewertungsraster','korrekt','korrekteAntworten','toleranz','erklaerung','sollKonto','habenKonto','korrektBuchung','sollEintraege','habenEintraege','buchungen','erwarteteAntworten','loesung','zoneId','korrektesLabel','korrekteFormel'];
  function scan(obj, hits){
    if (obj === null || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(v => scan(v, hits)); return; }
    for (const k of Object.keys(obj)) {
      if (SPERR.includes(k)) hits.push(k);
      if (hits.length > 5) return;
      scan(obj[k], hits);
    }
  }
  const hits = [];
  body.data.forEach(f => scan(f, hits));
  return JSON.stringify({totalFragen: body.data.length, hits: hits.length, firstHits: hits.slice(0, 5)});
})()
```

Erwartet: `{"totalFragen": 2400+, "hits": 0, "firstHits": []}`. Wenn `hits > 0` → Retrofit-Regression! Rollback auf alte Bereitstellung.

### Step 7.4: Post-Deploy Bundle-Ü-Smoke-Check

```javascript
(async function(){
  const auth = JSON.parse(localStorage.getItem('ueben-auth'));
  const url = 'https://script.google.com/macros/s/AKfycbzv88MEo_6VulH4Z10U7IvhNkdISGU5AQRQiCNL72v_N4EDXMvr4PJ5phfPExmJyZN_IA/exec';
  const res = await fetch(url, { method: 'POST', redirect: 'follow',
    body: JSON.stringify({
      action: 'lernplattformLadeLoesungen',
      gruppeId: 'test',
      fragenIds: ['bwl-fin01-mc01', 'vwl-arbm01-mc01'], // beliebige echte IDs
      email: auth.email,
      token: auth.sessionToken,
    })
  });
  const txt = await res.text();
  return JSON.stringify({status: res.status, head: txt.substring(0, 600)});
})()
```

Erwartet: `{"success":true,"loesungen":{...}}` mit mindestens einer `optionen`-Liste die `korrekt: true` enthält. Wenn `{"success":false,"error":"Aktion nicht gefunden"}` → Deploy-Queue hängt, leerer Commit + User-Deploy wiederholen.

### Step 7.5: Staging-E2E — SuS Übungs-Flow

Claude-Aktion:
1. SuS-Tab: `/sus/ueben` → Übung starten.
2. Network-Tab prüfen via `read_network_requests`: Genau **1** `lernplattformLadeLoesungen`-Call am Session-Start.
3. MC/RF/Lückentext/Berechnung-Fragen beantworten: jede muss instant Feedback geben (keine `lernplattformPruefeAntwort`-Calls nach dem Antwort-Klick).

### Step 7.6: Staging-E2E — Partial-Fallback-Simulation

Claude-Aktion in der DevTools-Konsole:

```javascript
// Wähle die erste Frage aus der aktuellen Session und setze ihren preloaded-Wert auf false
(function(){
  // Zugriff auf den Store via Zustand's useSyncExternalStore-Hook ist im DOM nicht möglich;
  // Alternative: via React DevTools die Fiber-Prop finden.
  // Praktikable Variante: Füge einen temporären Debug-Export in uebungsStore.ts ein ODER
  // setze preloaded via LocalStorage nicht — weil der Store nicht persistiert.
  // Für diesen Staging-Test: wir exponieren den Store einmalig.
  if (!window.__uebenStore) {
    return 'Debug-Export fehlt — siehe Schritt 7.6 Alternative';
  }
  const frageId = window.__uebenStore.getState().session.fragen[0].id;
  window.__uebenStore.setState(s => ({ loesungenPreloaded: { ...s.loesungenPreloaded, [frageId]: false } }));
  return `preloaded[${frageId}] = false`;
})()
```

**Alternative (pragmatisch, kein Debug-Export nötig):**
- Im Frontend vor Staging-Deploy eine Console-Debug-Zeile in `uebungsStore.ts` ergänzen: `if (typeof window !== 'undefined') (window as unknown as { __uebenStore: typeof useUebenUebungsStore }).__uebenStore = useUebenUebungsStore`
- Diese Zeile in einem separaten Commit einfügen und NACH Staging-E2E wieder entfernen.

**Noch pragmatischer:** Diesen Partial-Fallback-Test im Browser überspringen, wenn die Integration-Tests (Task 6) bereits den Fallback abdecken. Task 6 Test 2 + 3 zeigen: Fehler → `loesungenPreloaded = falsy`; dann läuft `beantworteById` in den Server-Pfad. Das reicht als Fallback-Verifikation wenn der Unit-Test-Pfad vertrauenswürdig ist.

**Empfehlung:** Überspringen. Task 6 Tests sind hinreichend.

### Step 7.7: Regression — Üben mit Selbstbewertungs-Typ

Claude-Aktion: Eine Freitext-Frage beantworten + "Als richtig bewerten" klicken. Erwartet: funktioniert wie vorher (Selbstbewertung-Flow ist nicht durch Pre-Load berührt).

### Step 7.8: Regression — Prüfungs-Pfad (Bundle P weiterhin OK)

Claude-Aktion (optional falls zeitlich machbar): Eine existierende LP-Prüfung laden (wenn im LP-Tab eine echte Prüfung konfiguriert ist) oder erneut der SuS-lernplattformLadeFragen-Test aus 7.3.

User bestätigt: "E2E grün".

---

## Task 8: HANDOFF + Merge-Gate

### Step 8.1: HANDOFF.md ergänzen

Öffne `ExamLab/HANDOFF.md`. Suche den Block "Session 126 — Bundle P". Direkt danach einfügen (vor "### Offene Punkte (priorisiert)"):

```markdown
### Session 127 — Bundle Ü: Üben-Pre-Load (2026-04-20)

Branch `feature/bundle-ue-ueben-preload` → `main`. Spec `docs/superpowers/specs/2026-04-20-musterloesungen-bereinigung-design.md` (Abschnitt Bundle Ü), Plan `docs/superpowers/plans/2026-04-20-bundle-ue-ueben-preload.md`.

**Ziel:** Selbstständiges Üben korrigiert instant clientseitig, Lösungen werden beim Session-Start in einem separaten autorisierten Call geladen. Spart ~1.5-2s Apps-Script-Roundtrip pro „Antwort prüfen"-Klick.

**Umgesetzt:**
- Backend-Konstante `LOESUNGS_FELDER_` als Single Source of Truth — `bereinigeFrageFuerSuS_` (Retrofit Bundle P, Verhalten identisch) und neue `extrahiereLoesungsSlice_` iterieren deklarativ darüber. Neue Lösungs-Felder in Zukunft = eine Stelle.
- Backend-Endpoint `lernplattformLadeLoesungen` — Token-Auth, Rate-Limit 5/min, flache Map inkl. Aufgabengruppen-Teilaufgaben.
- Frontend-Types `LoesungsSlice` + `LoesungsMap` in `src/types/ueben/loesung.ts`.
- Frontend-Service `uebenLoesungsApi.ts` (4 Unit-Tests).
- Store: `uebungsStore` erweitert um `loesungenPreloaded: Record<string, boolean>`; `starteSession` merged Lösungen; `beantworteById` verzweigt pro Frage clientseitig vs. Server-Fallback (5 Integration-Tests).
- Lösungen landen nicht in localStorage.

**Staging-E2E verifiziert:**
- Bundle-P-Regression: 2400+ Fragen via lernplattformLadeFragen, 0 Sperrlist-Hits (Retrofit verändert Verhalten nicht).
- Bundle-Ü-Smoke: lernplattformLadeLoesungen liefert LoesungsSlice-Map.
- 1 Pre-Load-Call am Session-Start, Auto-Korrektur-Typen geben instant Feedback.

Scope: Bundle Ü betrifft nur selbstständiges Üben. Prüfung + angeleitetes Prüfen laufen durch `ladePruefung` und brauchen keine Instant-Korrektur (Korrektur erst nach LP-Freigabe).
```

**Aktueller Stand** oben aktualisieren:
```markdown
### Aktueller Stand (Ende S127)
- **Alles auf `main`**. Letzter Commit: Bundle Ü Merge. Apps-Script deployed. Keine offenen Feature-Branches.
- **Tests:** 438/438 vitest grün, tsc -b grün.
```

**Offene Punkte:** Entferne den Bundle-Ü-Eintrag aus "Gross (eigene Session)".

### Step 8.2: HANDOFF committen

```bash
cd "10 Github/GYM-WR-DUY"
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
ExamLab: HANDOFF für S127 Bundle Ü aktualisiert

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### Step 8.3: Merge-Gate-Check

Claude meldet:

```
Bundle Ü ready for merge. Checklist:
- [x] tsc -b grün
- [x] vitest grün (438/438)
- [x] npm run build grün
- [x] Apps-Script deployed
- [x] Bundle-P-Regression: 0 Sperrlist-Hits
- [x] Bundle-Ü-Smoke: Endpoint liefert LoesungsSlice
- [x] Staging-E2E: 1 Pre-Load + instant Korrektur + Selbstbewertung OK
- [x] HANDOFF.md aktualisiert

Bereit für Merge auf main?
```

User → "ja" → Step 8.4. Sonst Fix + Step 8.3 wiederholen.

### Step 8.4: Merge + Push

```bash
cd "10 Github/GYM-WR-DUY"
git checkout main
git merge --no-ff feature/bundle-ue-ueben-preload -m "$(cat <<'EOF'
Bundle Ü: Üben-Pre-Load

Selbstständiges Üben korrigiert instant clientseitig. Neuer
Apps-Script-Endpoint lernplattformLadeLoesungen liefert Lösungs-
Slices am Session-Start; Store merged sie in session.fragen.

Konsolidiert Lösungs-Feldliste zwischen Bundle P und Ü:
gemeinsame LOESUNGS_FELDER_-Konstante als Single Source of Truth.

Spart ~1.5-2s pro Antwort-Prüfen-Klick im Üben-Flow.

Spec: docs/superpowers/specs/2026-04-20-musterloesungen-bereinigung-design.md
Plan: docs/superpowers/plans/2026-04-20-bundle-ue-ueben-preload.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push
git branch -d feature/bundle-ue-ueben-preload
```

### Step 8.5: Abschluss-Meldung

```
Bundle Ü auf main. Letzter Commit: <sha>. Beide Bundles der
Musterlösungen-Bereinigung sind live. Feldliste ist jetzt DRY
(eine Konstante LOESUNGS_FELDER_).
```

---

## Rollback-Plan

Bei Regression in Task 7:

1. **Apps-Script-Rollback:** Alte Bundle-P-Bereitstellung reaktivieren. Frontend (Bundle Ü nicht gemerged) funktioniert mit altem Backend — Lösungs-Endpoint schlägt fehl, Fallback auf `pruefeAntwortJetzt` greift. UX-Einbuße (Latenz wieder normal), aber funktional OK.
2. **Git-Rollback** (nach Merge): `git revert <merge-commit>`.
3. **Feature-Branch behalten** bis verifiziert.

---

## Risiken & Annahmen

**Annahme 1 (kritisch):** Das Retrofit von `bereinigeFrageFuerSuS_` auf `LOESUNGS_FELDER_` erzeugt **identischen** Output wie Bundle P. Mitigation: Step 7.3 (Bundle-P-Regression-Test mit 2400+ Fragen) ist zwingend vor Merge.

**Annahme 2:** Aufruf-Reihenfolge der Bereinigungs-Blöcke ist semantisch egal. Die alte `bereinigeFrageFuerSuS_` hatte Hard-coded Blocks in bestimmter Reihenfolge; die neue iteriert über `LOESUNGS_FELDER_`-Kategorien. Da alle Operationen `delete` sind und sich nicht gegenseitig beeinflussen, ist Reihenfolge irrelevant. Kein Risiko.

**Annahme 3:** `loesungenPreloaded` als Plain-Object (nicht `Map`) ist vollständig in Zustand serialisierbar. Der Store hat keine `persist`-Middleware (nur `historie` wird manuell in localStorage geschrieben), deshalb landet die Map automatisch nicht in Storage.

**Risiko (niedrig):** Neue `LOESUNGS_FELDER_`-Struktur könnte von Apps-Script-Linting-Tools (falls vorhanden) beanstandet werden. Apps-Script hat keine Linting-CI im Projekt — kein Risiko.

**Risiko (niedrig):** Pool-Fragen aus Üben-Pfad haben historisch inkonsistente Feldnamen. Die `mergeById`-Logik im Frontend ignoriert Items ohne `id`. Primitive `labels[]` werden durchgereicht. Kein neues Risiko über Bundle-P-Niveau hinaus.

**Risiko (mittel):** Wenn eine Frage ein unerwartetes Lösungs-Feld hat, das nicht in `LOESUNGS_FELDER_` gelistet ist, bleibt es im Ladepfad enthalten. Mitigation: Die Sperrliste in `uebenSecurityInvariant.test.ts` deckt alle bisher bekannten Felder ab; neue Feldtypen müssen in beide Dateien eingetragen werden. Das ist eine Pflege-Aufgabe, nicht ein Bundle-Ü-spezifisches Risiko.

---

## Definition of Done

- [ ] `LoesungsSlice` + `LoesungsMap` Types existieren.
- [ ] `uebenLoesungsApi.ladeLoesungenApi` funktioniert + 4 Unit-Tests grün.
- [ ] `apps-script-code.js`: `LOESUNGS_FELDER_`-Konstante + `bereinigeFrageFuerSuS_` refactored + `extrahiereLoesungsSlice_` neu + `lernplattformLadeLoesungen`-Endpoint.
- [ ] `uebungsStore` hat `loesungenPreloaded`-State + Merge-Logik + Branch-Logik.
- [ ] 3 Store-Integration-Tests grün.
- [ ] `tsc -b`, `vitest run`, `npm run build` grün.
- [ ] Apps-Script deployed.
- [ ] Staging-E2E: Bundle-P-Regression clean, Bundle-Ü-Smoke OK, Pre-Load-Call + instant Korrektur bestätigt.
- [ ] HANDOFF.md S127 dokumentiert.
- [ ] Merge auf main + Push + Branch gelöscht.
