# Bundle X — BatchExportDialog Pure-Logic-Cut

**Datum:** 2026-05-08
**Branch (geplant):** `bundle-x/batchexport-logic`
**Phase:** Phase-5+ Hotspot-Reduction (nach Phase-4-Audit Abschluss durch Bundle U+V+W+W.b)
**Cut-Strategie:** Pure-Logic-Cut (Bundle U/V/W/W.b-Pattern fortgeführt)

---

## 1 · Kontext & Ziel

### Target-Datei
`ExamLab/src/components/lp/korrektur/BatchExportDialog.tsx` — **535 Zeilen**, im Hotspot-Set Files >500 Z.

### Hotspot-Position
Aktuell 9 Files >500 Z. nach Bundle W.b (HilfeSeite 906, ConfigTab 747, EinstellungenPanel 607, BilanzERFrage 589, AktivPhase 573, Layout 570, **BatchExportDialog 535**, PruefungsComposer 526, ZeichnenCanvas 518). Bundle X erledigt das **8. File** mit niedrigem Risiko-Faktor (Dialog-Component, Pure-Logic gut isolierbar).

### Logische Bereiche im Source-File
| Zeilen | Bereich | Charakter |
|---|---|---|
| 1-39 | Imports + Type-Definitionen (`Phase`, `FrageZuweisung`, `SendeErgebnis`, `PoolEintrag`) | Type-only |
| 41-69 | Component-Setup (useState/useMemo) | Stateful (bleibt) |
| 71-92 | `useEffect` Pool-Loading + `ladeTopicsFuerPool` helper | State-mutating (bleibt) |
| 94-109 | Auswahl-Helpers (`toggleFrage`, `alleAuswaehlen`, `keineAuswaehlen`) | State-mutating (bleibt) |
| **112-129** | `weiterZuZuweisung` mit Auto-Zuweisung-Logik | **Pure-Logic-Anteil ~16 Z.** (Z. 113-127) |
| 131-160 | Zuweisungs-Helpers (`setzePoolFuerFrage`, `setzeTopicFuerFrage`, `bulkZuweisungAnwenden`) | State-mutating (bleibt) |
| 163-168 | `alleZugewiesen` useMemo | Pure aber trivial (bleibt inline) |
| **170-256** | `handleExport` async-Logik | **Pure-Logic-Anteil ~85 Z.** (Pool-Gruppierung + per-Pool-API + Result-Mapping) |
| 258-534 | JSX-Render (5 Phasen + Footer) | UI (bleibt) |

### Konsumenten-Surface
1 React-Konsument verifiziert via grep: `FragenBrowser.tsx` Z. 21 (import) + Z. 211 (usage) öffnet Dialog mit `<BatchExportDialog fragen={...} onSchliessen={...} onErfolg={...} />`. Plus Re-Export in `lp/korrektur/index.ts` Z. 10 + 1 Test-Mock in `FragenBrowser.test.tsx` Z. 77. Public-Props **unverändert** durch Cut. Kein Caller-Edit nötig.

### Bestehende Test-Coverage
**Keine Tests** für `handleExport` oder Auto-Zuweisung. Cut bringt erstmals isolierte Vitest-Coverage.

### Ziel-Metriken
- `BatchExportDialog.tsx` schrumpft **535 → ~454 Zeilen** (≤500-Schwelle Master-Spec, 46 Z. Margin).
- Hotspot-Bilanz Files >500 Z. (ohne `data/`+`test/`): **9 → 8**.
- +8 neue Vitest-Tests (1472 → 1480).

---

## 2 · Architektur & Files

### Cut-Strategie: Pure-Logic-Cut

Reine Logik (Auto-Zuweisung-Map-Bau + Batch-Export-Pool-Gruppierung-und-API) wandert nach `utils/batchExportLogic.ts`. Component bleibt UI + State-Verwaltung. Side-Effects (`setState`, `apiService`-Aufruf, `onErfolg`-Callback, `ladeTopicsFuerPool`-State-Mutation) bleiben in der Component.

### 1 neues File `ExamLab/src/utils/batchExportLogic.ts` (~120 Z.)

Konsistent zu existierenden Pure-Modulen (`utils/poolExporter.ts`, `utils/fachUtils.ts`). **Flat in `utils/`**, kein Sub-Folder (analog Bundle W: einzelne thematische Datei statt `utils/batchExport/`-Unterordner).

```typescript
// ExamLab/src/utils/batchExportLogic.ts
import type { Frage } from '../types/fragen-storage'
import { apiService } from '../services/apiService'
import { konvertiereZuPoolFormat } from './poolExporter'

export interface PoolEintrag {
  id: string
  file: string
  fach: string
  title: string
}

export interface FrageZuweisung {
  frageId: string
  poolId: string
  topic: string
}

export interface SendeErgebnis {
  frageId: string
  erfolg: boolean
  poolId?: string
  poolContentHash?: string
  fehler?: string
}

interface ErstelleAutoZuweisungenArgs {
  gewaehlteIds: Set<string>
  exportierbar: Frage[]
  pools: PoolEintrag[]
}

interface AutoZuweisungenResult {
  zuweisungen: Map<string, FrageZuweisung>
  benoetigteTopicPools: string[]  // pools für die Component noch ladeTopicsFuerPool() aufrufen muss
}

/**
 * Erstellt Auto-Zuweisungen basierend auf Fachbereich-Match.
 * Pure: keine State-Mutationen.
 */
export function erstelleAutoZuweisungen(args: ErstelleAutoZuweisungenArgs): AutoZuweisungenResult {
  const { gewaehlteIds, exportierbar, pools } = args
  const zuweisungen = new Map<string, FrageZuweisung>()
  const benoetigteTopicPools = new Set<string>()

  for (const id of gewaehlteIds) {
    const frage = exportierbar.find(f => f.id === id)
    if (!frage) continue
    const passenderPool = pools.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase())
    zuweisungen.set(id, {
      frageId: id,
      poolId: passenderPool?.id || '',
      topic: '',
    })
    if (passenderPool) benoetigteTopicPools.add(passenderPool.id)
  }

  return { zuweisungen, benoetigteTopicPools: Array.from(benoetigteTopicPools) }
}

interface FuehreBatchExportArgs {
  zuweisungen: Map<string, FrageZuweisung>
  fragen: Frage[]
  pools: PoolEintrag[]
  email: string
  onFortschritt: (gesendet: number, gesamt: number) => void
}

interface BatchExportResult {
  ergebnisse: SendeErgebnis[]
  erfolgreiche: Array<{ frageId: string; poolId: string; poolContentHash: string }>
}

/**
 * Führt Batch-Export der Zuweisungen aus. Gruppiert nach Pool-Datei,
 * macht eine API-Anfrage pro Pool.
 *
 * Pure-async: kein direktes setState, keine Component-Refs. Caller
 * verbindet `onFortschritt` mit `setFortschritt` und mappt das Result
 * auf `setErgebnisse` + `onErfolg`-Callback + Phase-Übergang.
 */
export async function fuehreBatchExportAus(args: FuehreBatchExportArgs): Promise<BatchExportResult> {
  const { zuweisungen, fragen, pools, email, onFortschritt } = args
  const gesamt = zuweisungen.size
  onFortschritt(0, gesamt)
  const alleErgebnisse: SendeErgebnis[] = []

  // Gruppiere nach Pool-Datei
  const nachPool = new Map<string, Array<{ frage: Frage; zuweisung: FrageZuweisung }>>()
  for (const [frageId, zuw] of zuweisungen) {
    const frage = fragen.find(f => f.id === frageId)
    if (!frage) continue
    const pool = pools.find(p => p.id === zuw.poolId)
    if (!pool) continue
    const datei = pool.file || pool.id + '.js'
    if (!nachPool.has(datei)) nachPool.set(datei, [])
    nachPool.get(datei)!.push({ frage, zuweisung: zuw })
  }

  let gesendet = 0
  for (const [poolDatei, eintraege] of nachPool) {
    try {
      const aenderungen = eintraege.map(({ frage, zuweisung }) => {
        const exported = konvertiereZuPoolFormat(frage, zuweisung.topic)
        exported.reviewed = false
        return {
          poolFrageId: null as string | null,
          typ: 'export' as const,
          felder: exported as unknown as Record<string, unknown>,
          _frageId: frage.id,
        }
      })

      const result = await apiService.schreibePoolAenderung(
        email,
        poolDatei,
        aenderungen.map(({ _frageId: _, ...rest }) => rest),
      )

      if (result?.erfolg) {
        const exportierteIdValues = Object.values(result.exportierteIds)
        const hashValues = Object.values(result.neueHashes)
        const poolName = poolDatei.replace('.js', '')

        for (let i = 0; i < eintraege.length; i++) {
          alleErgebnisse.push({
            frageId: eintraege[i].frage.id,
            erfolg: true,
            poolId: poolName + ':' + (exportierteIdValues[i] || ''),
            poolContentHash: hashValues[i] || '',
          })
        }
      } else {
        for (const { frage } of eintraege) {
          alleErgebnisse.push({
            frageId: frage.id,
            erfolg: false,
            fehler: result?.fehler?.join(', ') || 'Unbekannter Fehler',
          })
        }
      }
    } catch (e) {
      for (const { frage } of eintraege) {
        alleErgebnisse.push({
          frageId: frage.id,
          erfolg: false,
          fehler: e instanceof Error ? e.message : 'Netzwerkfehler',
        })
      }
    }

    gesendet += eintraege.length
    onFortschritt(gesendet, gesamt)
  }

  const erfolgreiche = alleErgebnisse
    .filter(e => e.erfolg)
    .map(e => ({
      frageId: e.frageId,
      poolId: e.poolId!,
      poolContentHash: e.poolContentHash!,
    }))

  return { ergebnisse: alleErgebnisse, erfolgreiche }
}
```

### 1 neues Test-File `ExamLab/src/utils/batchExportLogic.test.ts` (~180 Z.)

8 Vitest co-located neben Source.

| # | Test-Fall | Branch |
|---|---|---|
| 1 | `erstelleAutoZuweisungen`: matching fachbereich → poolId set | Z. 49 |
| 2 | `erstelleAutoZuweisungen`: no matching pool → empty poolId, kein TopicPool | Z. 50 |
| 3 | `erstelleAutoZuweisungen`: gewaehlteIds nicht in exportierbar → übersprungen (kein crash) | Z. 47 |
| 4 | `fuehreBatchExportAus`: empty zuweisungen → leere `ergebnisse` + leere `erfolgreiche`, onFortschritt(0,0) aufgerufen | early-return-equivalent |
| 5 | `fuehreBatchExportAus`: 1 Frage success → 1 erfolgreich, korrekt zugeordnete poolId/hash | success-Pfad |
| 6 | `fuehreBatchExportAus`: 2 Fragen same pool → 1 API-Aufruf mit 2 änderungen, 2 erfolgreiche, **`onFortschritt.mock.calls === [[0,2], [2,2]]`** (Reihenfolge + Anzahl) | Pool-Gruppierung + Progress-Callback |
| 7 | `fuehreBatchExportAus`: API result.erfolg=false → alle markiert fehlgeschlagen mit `fehler`-Text | Z. 80-85 |
| 8 | `fuehreBatchExportAus`: API throws → catch-Pfad, alle als 'Netzwerkfehler' fehlgeschlagen | Z. 90-95 |

**Setup:** Mock `apiService.schreibePoolAenderung` via `vi.mock('../services/apiService')`. Mock `konvertiereZuPoolFormat` via `vi.mock('./poolExporter')`. `afterEach: vi.restoreAllMocks()`.

### Component-Änderungen `BatchExportDialog.tsx`

**Imports oben** (3 neue):
```typescript
import {
  erstelleAutoZuweisungen,
  fuehreBatchExportAus,
  type PoolEintrag,
  type FrageZuweisung,
  type SendeErgebnis,
} from '../../../utils/batchExportLogic'
```

**Imports oben entfernen** (3 alte werden überflüssig in Component-Body):
- `import { konvertiereZuPoolFormat } from '../../../utils/poolExporter'` — jetzt in batchExportLogic.ts
- `import { apiService } from '../../../services/apiService'` — jetzt in batchExportLogic.ts

(`import { useAuthStore } from '../../../store/authStore'` bleibt — Component liest weiter `email`.)

**Type-Definitionen Z. 18-39 entfernen** — 3 lokale Interfaces wandern. `Phase` (lokal in Component) bleibt — wird nur dort genutzt für `useState<Phase>`.

**`weiterZuZuweisung`-Body Z. 113-127 ersetzen:**
```typescript
function weiterZuZuweisung(): void {
  const { zuweisungen: neueZuweisungen, benoetigteTopicPools } = erstelleAutoZuweisungen({
    gewaehlteIds, exportierbar, pools,
  })
  for (const poolId of benoetigteTopicPools) ladeTopicsFuerPool(poolId)
  setZuweisungen(neueZuweisungen)
  setPhase('zuweisung')
}
```

**`handleExport`-Body Z. 170-256 ersetzen:**
```typescript
async function handleExport(): Promise<void> {
  setPhase('senden')
  const { ergebnisse, erfolgreiche } = await fuehreBatchExportAus({
    zuweisungen,
    fragen: exportierbar,
    pools,
    email,
    onFortschritt: (gesendet, gesamt) => setFortschritt({ gesendet, gesamt }),
  })
  setErgebnisse(ergebnisse)
  if (erfolgreiche.length > 0) onErfolg(erfolgreiche)
  setPhase(ergebnisse.some(e => !e.erfolg) ? 'fehler' : 'fertig')
}
```

### Saving-Math

| Stelle | Vorher | Nachher | Saving |
|---|---:|---:|---:|
| Type-Defs Z. 18-39 (3 Interfaces) | ~22 | 0 (move zu helper) | -22 |
| Imports oben (Net) | 7 | 6 | -1 |
| `weiterZuZuweisung` Body | 18 | 7 | -11 |
| `handleExport` Body | 87 | 13 | -74 |
| **Total** | | | **-108 Z.** |

**Erwarteter Endwert:** 535 - 108 = **~427 Z.** ✅ <500 mit 73 Z. Margin.

(Saving höher als initial geschätzt -81 Z., weil Type-Move und konvertiereZuPoolFormat-Import-Removal mehr beitragen.)

---

## 3 · Datenfluss & Side-Effect-Aufteilung

### Component behält
- `useState` aller State (Phase, gewaehlteIds, pools, poolTopics, zuweisungen, ergebnisse, fortschritt, fehlerText)
- `useEffect` Pool-Index-Load
- `ladeTopicsFuerPool` (mutiert State `setPoolTopics`)
- `useAuthStore` Hook für `email`
- Alle `set*`-Calls
- `onErfolg`-Callback-Aufruf nach Erfolg
- `setPhase` Übergänge (Auswahl → Zuweisung → Senden → Fertig/Fehler)
- JSX-Render (5 Phasen + Footer)

### Helper bekommen
- Pure Args-Objects (kein React-State, kein Hook)
- Direkte Imports von `apiService.schreibePoolAenderung` und `konvertiereZuPoolFormat`
- `onFortschritt`-Callback (DI für Progress-Updates)
- `email` als Param

### Auto-Zuweisung — Topic-Vorlade-Side-Effect getrennt

`erstelleAutoZuweisungen` liefert `benoetigteTopicPools: string[]` als Result-Field. Component iteriert darüber und ruft `ladeTopicsFuerPool` (state-mutiert). Das hält den Helper pure und macht die Topic-Vorlade-Logik im Component sichtbar.

---

## 4 · Test-Strategie

### `batchExportLogic.test.ts` Setup

```typescript
vi.mock('../services/apiService', () => ({
  apiService: { schreibePoolAenderung: vi.fn() }
}))
vi.mock('./poolExporter', () => ({
  konvertiereZuPoolFormat: vi.fn(f => ({ id: f.id, fragetext: 'test' }))
}))

afterEach(() => vi.restoreAllMocks())
```

### Existierende Tests bleiben grün
Keine bestehenden Tests betroffen — `BatchExportDialog`-Component hatte bisher keine Test-Coverage.

### Drift-Tracking
- Phase 1 (utils): +8 Vitest → 1472 → 1480
- Phase 2 (Component-Edit): +0 → 1480 stable
- tsc/4 Lint-Gates/build pro Phase clean

---

## 5 · Phasen-Plan

### Phase 1 — `batchExportLogic.ts` extrahieren + Tests

1. Erstelle `ExamLab/src/utils/batchExportLogic.ts` mit `erstelleAutoZuweisungen` + `fuehreBatchExportAus` + 3 Type-Exports byte-identisch.
2. Erstelle `ExamLab/src/utils/batchExportLogic.test.ts` — 8 Vitest (Test #6 inkl. `onFortschritt.mock.calls === [[0,2], [2,2]]`-Assertion).
3. **Verify:** tsc clean, +8 vitest, 4 Lint-Gates clean, build clean.
4. **DoD-Note:** Type-Imports in Component (Phase 2) verwenden `type`-only-Syntax: `import { erstelleAutoZuweisungen, fuehreBatchExportAus, type PoolEintrag, type FrageZuweisung, type SendeErgebnis } from '...'` — `verbatimModuleSyntax`-konform.
5. **Per-Phase-Reviewer** APPROVED.

### Phase 2 — `BatchExportDialog.tsx` umstellen

1. Imports oben anpassen (3 neue + 2 entfernen).
2. Type-Defs Z. 18-39 entfernen.
3. `weiterZuZuweisung`-Body durch Helper-Aufruf ersetzen.
4. `handleExport`-Body durch Helper-Aufruf ersetzen.
5. **Verify:** tsc clean, vitest 1480 stable, 4 Lint-Gates clean, build clean. **`wc -l BatchExportDialog.tsx` ≤ 460** (Ziel ~427, Margin >40 unter 500).
6. **Per-Phase-Reviewer** APPROVED.

### Phase 3 — Final Verification + E2E + Merge

1. Final Code-Reviewer (gesamte Branch) APPROVED.
2. Hotspot-Bilanz prüfen: 9 → 8.
3. Browser-E2E auf staging mit echtem LP-Login: Batch-Export-Flow durchspielen (Auswahl → Zuweisung → Export → Fertig oder Fehler).
4. HANDOFF.md `Bundle X`-Eintrag.
5. Memory-Eintrag.
6. Merge → main + Push + Pages-Production-Deploy.
7. Worktree + Branch löschen.

---

## 6 · Browser-E2E

5 Pflicht-Pfade auf staging mit echtem LP-Login:

| # | Pfad | Stresst |
|---|---|---|
| 1 | LP-Login + Korrektur-Bereich öffnen + Batch-Export-Dialog öffnen | Smoke (Phase 'auswahl' rendert) |
| 2 | Mehrere Fragen auswählen (>1 Pool-Zugehörigkeit) → Weiter zu Zuweisung | `erstelleAutoZuweisungen` liefert pre-populated Auto-Zuweisungen |
| 3 | Zuweisungen vervollständigen (Topic pro Frage) → Exportieren-Button aktiv | `alleZugewiesen`-Memo |
| 4 | Export-Aufruf → Senden-Phase → Fertig-Phase mit erfolgreich-Counter | `fuehreBatchExportAus` happy-path + Pool-Gruppierung |
| 5 | 0 Console-Errors während E2E | Cross-cutting |

**Mindest-Manual** falls Auto-E2E blockiert: Pfade 1+2+5.

---

## 7 · Definition of Done

- [ ] vitest 1480 passed (Drift +8 exakt)
- [ ] tsc -b clean
- [ ] 4 Lint-Gates clean
- [ ] vite build erfolgreich
- [ ] `wc -l BatchExportDialog.tsx` ≤ 460
- [ ] Hotspot-Bilanz Files >500 Z.: 9 → 8
- [ ] Per-Phase-Reviewer (P1, P2) APPROVED
- [ ] Final Code-Reviewer APPROVED
- [ ] Browser-E2E mind. Pfade 1+2+5 ✅ mit echtem LP-Login
- [ ] HANDOFF.md `Bundle X`-Eintrag
- [ ] Memory `project_bundle_x_komplett.md` + MEMORY.md Index

---

## 8 · Risiken & Mitigationen

| Risiko | L | I | Mitigation |
|---|---|---|---|
| Pool-Gruppierung-Logic ändert subtil Verhalten | niedrig | hoch | byte-identische Loop-Logik in Helper, Test #6 prüft 2-Fragen-same-pool-Single-API-Aufruf |
| `_frageId`-Hilfsfeld-Stripping vergessen | niedrig | mittel | Helper macht den `.map(({_frageId: _, ...rest}) => rest)`-Strip explizit |
| `result.erfolg=false`-Branch oder `catch`-Pfad falsch | niedrig | hoch | Tests #7 + #8 decken beide Fehler-Branches mit konkreten `fehler`-Strings |
| `onFortschritt`-Reihenfolge oder -Anzahl ändert sich | niedrig | niedrig | Tests verifizieren Aufruf-Reihenfolge (initial(0,gesamt), dann pro Pool-Datei) |
| Type-Move bricht Re-Imports anderswo | niedrig | mittel | Pre-Cut-grep: `grep -rn "PoolEintrag\|FrageZuweisung\|SendeErgebnis" ExamLab/src` — sollte nur BatchExportDialog.tsx zeigen, sonst Re-Export-Bridge nötig |
| `apiService.schreibePoolAenderung`-Signatur weicht vom Test-Mock ab | niedrig | mittel | Reviewer prüft Mock-Setup gegen aktuelle apiService-API-Definition |

---

## 9 · Out-of-Scope / Spawn-Tasks

- **Layout.tsx (570 Z.)** als nächster Hotspot-Cut-Kandidat (Bundle Y). Niedriger-mittel Risiko (Layout-Component cross-cutting).
- **AktivPhase.tsx (573 Z.), BilanzERFrage.tsx (589 Z.), EinstellungenPanel.tsx (607 Z.)** als mittel-Risiko Bundles.
- **HilfeSeite.tsx (906 Z.) + ConfigTab.tsx (747 Z.)** als hoch-Risiko Bundles.
- **PruefungsComposer.tsx (526 Z.)** + **ZeichnenCanvas.tsx (518 Z.)** als knapp-drin-Bundles (kleiner Cut reicht).

Phase-5-Hotspot-Reduction-Roadmap durch Bundle X gestartet — restliche 8 Files folgen in eigenen Sessions je nach Priorität.

---

## Anhang A — Konsumenten-Surface vor/nach Cut

**Unverändert.** `BatchExportDialog`-Props (`fragen`, `onSchliessen`, `onErfolg`) bleiben byte-identisch. Caller in `LPKorrekturView.tsx` (oder analog) braucht keinen Edit.
