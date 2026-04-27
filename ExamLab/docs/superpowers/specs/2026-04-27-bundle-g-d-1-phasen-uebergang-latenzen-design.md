# Bundle G.d.1 — Phasen-Übergang-Latenzen (Design-Spec)

> **Status:** Design — wartet auf Spec-Review + User-Freigabe
> **Datum:** 2026-04-27
> **Session:** S151
> **Vorgänger:** Bundle G.c (Login-Pre-Fetch + Logout-Cleanup, S149 auf `main`) + S150 autoSave-IDB-Race-Fix

## Zielsetzung

Spürbare Wartezeiten zwischen LP- und SuS-Aktionen entlang der vier Workflow-Phasen (Vorbereitung → Lobby → Live → Auswertung) reduzieren. G.d.1 adressiert vier Sync-Punkte mit vier unabhängigen, kombinierbaren Hebeln.

**Erwartbarer Win:**
- LP sieht SuS-grün in Lobby: bis ~20s → ≤7s (Hebel A)
- SuS-erste-Frage nach LP-Freischaltung: ~5s → ~2s (Hebel B)
- LP-Auswertung-Tab Korrektur lädt: 2-4s → ≤1.5s (Hebel C)
- SuS sieht "freigeschaltet" marginal schneller (~2s, Hebel D)

## Bundle-G-Roadmap-Kontext

Ursprüngliche Roadmap-Zeile in HANDOFF.md: "Bundle G.d — Lobby 'Live schalten'-Pre-Warm (Backend-only, Apps-Script)". Im Brainstorming wurde der Scope erweitert:

- "Live schalten"-Pre-Warm allein adressiert nur einen der vier Sync-Punkte
- Zwei der vier Hebel sind Polling-Konstanten (Frontend-only), nicht Backend-Pre-Warm
- "Backend-only"-Constraint deshalb fallen gelassen

G.d wurde zusätzlich in zwei Sub-Bundles zerlegt:

| Sub-Bundle | Inhalt | Architektur-Familie |
|---|---|---|
| **G.d.1** | Polling-Tuning + Backend-Pre-Warm (4 Hebel) | G.a-Familie (Server-Cache + Frontend-Konstanten) |
| **G.d.2** | IDB-Cache für Klassenlisten + Gruppen | G.c-Familie (Frontend-IDB-Cache mit Login-Pre-Fetch) |

G.d.1 ist diese Spec. G.d.2 wird nach G.d.1-Merge separat spec'd.

## Vier Hebel im Überblick

| Hebel | Was | Wo | Erwartung |
|---|---|---|---|
| **A** | LP-`ladeMonitoring`-Polling 15s → 5s in Lobby-Phase | Frontend-Konstante in `DurchfuehrenDashboard.tsx` | Sync 1: 20s → ≤7s |
| **B** | Backend `schalteFrei` triggert inline `preWarmFragenBeimFreischalten_` | apps-script-code.js | Sync 2: ~5s → ~2s |
| **C** | Frontend-Trigger Pre-Warm Korrektur bei Tab-Klick "Auswertung" | DurchfuehrenDashboard + neuer Endpoint `lernplattformPreWarmKorrektur` | Sync 4: 2-4s → ≤1.5s |
| **D** | SuS-Warteraum-Polling 5s → 3s | Frontend-Konstante in `Startbildschirm.tsx` | Sync 2: marginal -2s |

**Sync-Punkte vs. Hebel:**

| Sync-Punkt | Hauptursache | Hebel |
|---|---|---|
| 1) LP sieht SuS in Lobby grün | LP-Daten-Polling 15s in Lobby (SuS-Warteraum-Heartbeat schon 5s) | A |
| 2) SuS sieht "Prüfung freigeschaltet" + erste Frage rendert | SuS-Polling 5s + Frage-Lade Cache-cold | B + D |
| 3) LP sieht SuS-Abgabe | LP-Polling 5s in Live (schon kurz, kein Hebel) | — |
| 4) Auswertung-Tab Korrektur lädt | `ladeKorrektur` Cache-cold beim Tab-Wechsel | C |

## Architektur — Backend (apps-script-code.js)

### Hebel B — Erweiterung von `schalteFrei`-Action

Im bestehenden `schalteFrei`-Action-Handler, **nach** erfolgreichem `setzeKonfigField('freigeschaltet', true)` und **vor** dem `return jsonResponse(...)`:

```js
if (success) {
  try {
    preWarmFragenBeimFreischalten_(pruefungId);
  } catch (e) {
    console.log('[Freischalten-PreWarm-Fehler] ' + e.message);
  }
}
```

Neuer interner Helper `preWarmFragenBeimFreischalten_(pruefungId)`:

```
Verhalten:
1. configRow aus Configs-Sheet via existierendem Helper (analog
   preWarmKorrekturNachAbgabe_ aus G.a)
2. fragenIds aus config.abschnitte extrahieren
3. CacheService-Soft-Lock (30s TTL) — analog G.a's
   lernplattformPreWarmFragen (apps-script-code.js:8957-8964):
     var lockKey = 'prewarm_freischalten_' + pruefungId
     if (cache.get(lockKey)) return  // dedup
     cache.put(lockKey, '1', 30)
   LockService wäre hier overkill (deckt nur ms-genaue Concurrency).
4. gruppiereFragenIdsNachTab_(fragenIds, gruppeId, fachbereich)
5. bulkLadeFragenAusSheet_ pro Tab → CacheService.putAll() (G.a-Helpers)
6. Logger.log('[PreWarmFreischalten] pruefungId=%s n=%d ms=%d')
```

**Begründung Backend-only / inline (kein neuer Endpoint):**
- Trigger ist atomar mit der `schalteFrei`-Action
- Kein Frontend-Code-Change für B
- Latenz-Impact auf "Freischalten"-Klick: +50-200ms (akzeptabel, Spinner ist sowieso sichtbar)
- Wenn G.a-Trigger A bereits gewärmt hat → LockService dedupliziert

**Latenz-Impact auf `schalteFrei`-Response:** ~50-200ms (erste Freischaltung nach Cache-Cold), ~10ms wenn Cache schon warm via G.a-Trigger A. LP sieht den `freigeschaltetLaedt`-Spinner während der Antwort, das passt zu UX.

### Hebel C — Neuer Endpoint `lernplattformPreWarmKorrektur`

```
Body:     { email, sessionToken, pruefungId }
Response: { success: true, latenzMs: X }
          | { success: true, deduped: true }
          | { error: 'Nicht autorisiert' | 'Pruefung nicht gefunden' | <fehler> }

Verhalten:
1. validiereTokenFuerEmail_(email, sessionToken)
2. istZugelasseneLP(email)
3. CacheService-Soft-Lock (30s TTL) — analog G.a-Pattern:
     var lockKey = 'prewarm_korrektur_' + pruefungId
     if (cache.get(lockKey)) return { success: true, deduped: true }
     cache.put(lockKey, '1', 30)
4. configRow + Korrektur-Sheet-Daten lesen (analog der Lese-Pfad
   in ladeKorrektur — exakter Helper im Plan zu lokalisieren)
5. CacheService.putAll() für die Cache-Keys die ladeKorrektur
   später ausliest (Cache-Key-Schema im Plan zu klären)
6. Logger.log('[PreWarmKorrektur] pruefungId=%s ms=%d')
7. return { success: true, latenzMs: X }
```

**Begründung Authorization (nur LP):**
Korrektur-Daten enthalten LP-spezifische Bewertungen, dürfen NICHT von SuS pre-warmable sein. `istZugelasseneLP(email)` ist der bestehende LP-Check.

**Begründung Lock-Key:**
`prewarm_korrektur_${pruefungId}` dedupliziert Re-Aufrufe pro Prüfung (LP klickt 2× kurz hintereinander auf "Auswertung"-Tab). Verschiedene Prüfungen blockieren sich nicht gegenseitig.

**Im Plan zu lokalisieren:**
- Welcher konkreter Sheet-Read-Helper deckt `ladeKorrektur`-Daten ab?
- Welcher CacheService-Key wird von `ladeKorrektur` gelesen?
- Falls Helper noch nicht extrahiert ist: Plan-Schritt für Helper-Extraktion einplanen.

## Architektur — Frontend (ExamLab/src)

### Hebel A — Polling Lobby

```ts
// DurchfuehrenDashboard.tsx (Z. 231)
// Vorher:
const intervallMs = phase === 'aktiv' ? 5000 : 15000
// Nachher:
const intervallMs = (phase === 'aktiv' || phase === 'lobby') ? 5000 : 15000
```

1-Zeilen-Änderung. Wirkt nur in Lobby-Phase, alle anderen Phasen unverändert.

### Hebel D — Polling Warteraum

```ts
// Startbildschirm.tsx (Z. 86)
// Vorher: }, 5000)
// Nachher: }, 3000)
```

1-Zeilen-Änderung. Wirkt nur im Warteraum (vor Freischaltung).

### Hebel C — Frontend-Trigger

**Erweiterung `services/preWarmApi.ts`:**

```ts
export async function preWarmKorrektur(
  pruefungId: string,
  email: string,
  signal?: AbortSignal,
): Promise<void>
```

Analog `preWarmFragen` (existiert seit G.a):
- Nutzt `postJson`-Helper
- Catch-all-Error-Handler (fail-silent)
- Returnt `Promise<void>`
- Respektiert `PRE_WARM_ENABLED`-Flag (early-return)
- Respektiert `signal.aborted` (early-return)

**Trigger-Integration in `DurchfuehrenDashboard.tsx`:**

Zwei Trigger (Backend dedupliziert via LockService):

1. **Tab-Klick "Auswertung"** — direkt im `onClick`-Handler der TabKaskade:
   ```ts
   onClick: () => {
     setActiveTab('auswertung')
     if (user && pruefungId) {
       void preWarmKorrektur(pruefungId, user.email)
     }
   }
   ```

2. **Phase-Wechsel zu `beendet`** — im existierenden Phase-Wechsel-useEffect (Z. 301):
   ```ts
   useEffect(() => {
     const neuerTab = phaseZuTab(phase)
     if (tabIndex(neuerTab) > tabIndex(phaseZuTab(letztePhaseRef.current))) {
       setActiveTab(neuerTab)
       // NEU: Pre-Warm Korrektur bei Wechsel zu beendet
       if (phase === 'beendet' && user && pruefungId) {
         void preWarmKorrektur(pruefungId, user.email)
       }
     }
     letztePhaseRef.current = phase
   }, [phase, user, pruefungId])
   ```

Beide Trigger sind fire-and-forget. LockService im Backend stellt sicher, dass kein Doppel-Read passiert wenn beide kurz hintereinander feuern.

**Edge-Case:** Direkter Mount mit `phase === 'beendet'` (z.B. URL-Direktaufruf einer beendeten Prüfung) — der Phase-Wechsel-useEffect feuert nicht, aber der Tab-Klick-Trigger greift. Falls LP beim Mount direkt auf Auswertung-Tab gesetzt wird (Z. 264-266), explizit Pre-Warm im selben Block.

## Datenfluss pro Use-Case

### Use-Case A — LP sieht SuS-grün in Lobby

```
SuS öffnet Lobby-URL → Startbildschirm.tsx mountet
  ↓
SuS-Warteraum-Heartbeat (3s, Hebel D): apiService.heartbeat
  ↓
Backend speichert letzterHeartbeat im Antworten-Sheet
  ↓
LP-Dashboard pollt ladeMonitoring (5s in Lobby, Hebel A)
  ↓
LP-UI rechnet bereite = istKuerzlich(letzterHeartbeat)
  ↓
SuS-Zeile wird grün

Worst-Case-Latenz: 3s SuS-Heartbeat + 5s LP-Polling + 1.5s GAS-RTT = ~9.5s
Vorher: 5s SuS-Heartbeat + 15s LP-Polling + 1.5s GAS-RTT = ~21.5s
```

### Use-Case B — LP klickt "Freischalten" → SuS sieht erste Frage

```
LP klickt "Freischalten" → schaltePruefungFrei API-Call
  ↓
Backend schalteFrei-Action:
  - setzeKonfigField('freigeschaltet', true)  ~500ms
  - preWarmFragenBeimFreischalten_(pruefungId)  ~50-200ms
    → bulkLadeFragenAusSheet_ → CacheService.putAll
  - return { success: true }
  ↓
LP-UI: Spinner verschwindet, "✓ Freigeschaltet"
  ↓
SuS-Warteraum-Heartbeat (3s) sieht freigeschaltet=true
  ↓
SuS-Screen wechselt zu "Prüfung starten"-Button
  ↓
SuS klickt "Starten" → AppPruefung mountet
  ↓
ladePruefung + ladeFragen API-Calls
  → Cache-Hit dank Pre-Warm (Hebel B)
  → ~300-500ms intern
  ↓
SuS sieht erste Frage

Spürbare Latenz: 3s Polling + 1.5s Pre-Warm-Round + 1.5s SuS-Klick + 1.5s Lade = ~7.5s
Vorher (G.a-Trigger A 1h alt + cold): 5s + 1.5s + 1.5s + 4s = ~12s
```

### Use-Case C — LP klickt Auswertung-Tab → Korrektur lädt

```
LP klickt Tab "Auswertung"
  ↓
onClick: setActiveTab('auswertung') + void preWarmKorrektur(...)
  ↓ (parallel)
Frontend rendert Auswertung-Tab → KorrekturDashboard mountet
  → useKorrekturDaten ruft ladeKorrektur
Backend lernplattformPreWarmKorrektur (parallel):
  - Lock + Sheet-Read + CacheService.putAll
  - Latenz ~1-2s GAS-intern
  ↓
ladeKorrektur trifft warmen Cache (wenn Pre-Warm zuerst fertig)
ODER cold-Pfad (wenn Pre-Warm noch läuft)
  → Beide funktionieren, Pre-Warm ist Optimierung

Spürbare Latenz wenn Pre-Warm gewinnt: ~1.5s GAS-RTT (Cache-Hit)
Spürbare Latenz wenn ladeKorrektur zuerst startet: 2-4s (cold-Pfad, unverändert)
```

**Race-Verhalten:** Wenn `ladeKorrektur` schneller war als Pre-Warm, ist Pre-Warm überflüssig — kein Schaden, Lock greift bei Re-Klick. Wenn LP schnell zurück klickt (z.B. Vorbereitung → Auswertung → Vorbereitung → Auswertung), dedupliziert LockService.

### Use-Case D — Phase-Wechsel zu beendet (Auto-Detect)

```
Letzte SuS gibt ab → bestimmePhase liefert 'beendet'
  ↓
Phase-Wechsel-useEffect feuert:
  - setActiveTab('auswertung')
  - void preWarmKorrektur(...)
  ↓
Korrektur-Cache wird gewärmt während LP noch auf "Beendet"-Toast schaut
  ↓
LP klickt Auswertung-Tab → Cache-Hit
```

## Fehlerbehandlung

### Grundprinzip

Pre-Warm ist Performance-Optimierung. Fehlschlag darf keinen funktionalen Pfad blockieren — `ladeKorrektur` bleibt der reguläre Lade-Pfad und funktioniert unverändert.

### Frontend-Fehlerpfade

| Fehler | Verhalten |
|---|---|
| `preWarmKorrektur`-Network-Timeout | AbortController-äquivalent (5s), Promise resolves mit `void` |
| Backend liefert `{error}` | Catch-all in `preWarmApi.ts`, `console.warn`, Promise resolves mit `void` |
| `PRE_WARM_ENABLED === false` | Early-return, kein API-Call |
| User wechselt schnell weg | Pre-Warm läuft Backend-seitig zu Ende (kein Schaden) |

**Kein Toast, kein Spinner, kein Banner für Pre-Warm.** User soll nichts merken ausser dass Tab-Wechsel schneller ist.

### Backend-Fehlerpfade

| Fehler | Verhalten |
|---|---|
| `validiereTokenFuerEmail_` fail | `{error: 'Nicht autorisiert'}` |
| `istZugelasseneLP` false | `{error: 'Nicht autorisiert'}` |
| `LockService.tryLock` fail | `{success: true, deduped: true}` |
| Sheet-Read fehlschlägt | try/catch, Logger.log + `{error}`, Frontend ignoriert |
| `CacheService.putAll` quota voll | try/catch im Helper, Logger.log, kein Fehler nach aussen |
| `preWarmFragenBeimFreischalten_` wirft | try/catch in `schalteFrei`, Logger.log, **Response bleibt success:true** |

### Race-Conditions

**Szenario 1:** LP klickt "Freischalten" → SuS-Warteraum sieht freigeschaltet (3s) → SuS klickt sofort "Starten" → `ladePruefung`-Backend-Call läuft parallel zu Pre-Warm.

**Verhalten:** `ladePruefung` läuft regulär — entweder partial Cache-Hit oder cold-Pfad. Beide korrekt. Kein Locking auf Lade-Pfad.

**Szenario 2:** LP klickt 2× kurz hintereinander auf "Auswertung"-Tab.

**Verhalten:** Erster `preWarmKorrektur`-Call hält Lock 30s. Zweiter Call → `{success: true, deduped: true}`. Frontend ignoriert beide Responses (fail-silent).

**Szenario 3:** Hebel A erhöht Polling-Frequenz → mehr Backend-Last in Lobby.

**Quota-Mathematik:**
- 25 SuS × 5 Min Lobby × 12 Polls/Min (5s) = 1'500 Polls für SuS-Heartbeat unverändert
- LP-Polling 5s statt 15s = 60 Polls/h statt 240/h pro LP. Bei 1 LP = ~50 zusätzliche Polls in 5 Min Lobby
- Quota-Auswirkung: vernachlässigbar (Workspace-Limit ~10'800 Calls/Tag)

## Edge-Cases

| Edge-Case | Verhalten |
|---|---|
| Direkter URL-Mount mit `phase === 'beendet'` | Phase-Wechsel-useEffect feuert nicht. Tab-Klick-Trigger greift erst beim ersten Klick. Bei Mount-Set-Default zu Auswertung explizit Pre-Warm hinzufügen (Plan-Phase). |
| LP wechselt Tab "Auswertung" → "Vorbereitung" → "Auswertung" innerhalb 30s | Lock dedupliziert, kein Doppel-Read. |
| `schalteFrei` mit fehlender `pruefungId` | Pre-Warm-Helper try/catch, Logger.log, `schalteFrei` läuft normal weiter. |
| LP klickt "Freischalten" während G.a-Trigger A noch läuft | LockService dedupliziert beide. |
| Polling-Intervall-Änderung trifft `setInterval`-Timing | useEffect-Dep `phase` triggert Cleanup + Re-Setup, kein Stale-Interval. |

## Test-Strategie

### Backend-Tests (Apps Script GAS-Test-Shims)

Zwei neue Test-Funktionen mit Public-Wrappern (S133-Lehre):

1. **`testPreWarmFragenBeimFreischalten_` + `testPreWarmFragenBeimFreischalten`**
   - Cases:
     - (a) Cold-Call: `pruefungId` bekannt, `fragenIds` aus Config extrahiert, `bulkLadeFragenAusSheet_` aufgerufen, Response success
     - (b) Deduped: zweiter Call innerhalb 30s mit gleicher pruefungId → Lock greift, kein Re-Read
     - (c) Fehlende `fragenIds`: leere `abschnitte` → no-op, kein Crash
     - (d) Fehler in `bulkLadeFragenAusSheet_`: try/catch, `schalteFrei` läuft trotzdem
   - Assertions: CacheService-Eintrag tatsächlich vorhanden, Latenz <3s intern, Logger-Output

2. **`testPreWarmKorrektur_` + `testPreWarmKorrektur`**
   - Cases:
     - (a) Cold-Call: bekannte LP, bekannte pruefungId, Cache befüllt
     - (b) Deduped: zweiter Call → `{success: true, deduped: true}`
     - (c) Auth-Fail: nicht-LP `istZugelasseneLP` → `{error: 'Nicht autorisiert'}`
     - (d) Pruefung nicht gefunden: ungültige pruefungId → `{error}`, kein Crash
   - Assertions: Response-Shape, CacheService-Inhalt, Lock-Verhalten

### Frontend-Tests (vitest)

Drei Test-Bereiche:

1. **`preWarmApi.test.ts` erweitern**
   - Existing: `preWarmFragen`-Cases bleiben unverändert
   - Neu: `preWarmKorrektur`-Wrapper
     - Erfolgreicher Call mit `pruefungId, email`
     - Backend-Error → Promise resolves mit void
     - `PRE_WARM_ENABLED === false` → kein API-Call
     - `signal.aborted` → kein API-Call

2. **`DurchfuehrenDashboard.test.tsx` (oder neuer Test-File)**
   - Hebel A: bei `phase === 'lobby'` ist Polling-Intervall 5000ms (mocked Timer)
   - Hebel C: Klick auf Tab "Auswertung" triggert `preWarmKorrektur` (mocked API)
   - Hebel C: Phase-Wechsel zu `beendet` triggert `preWarmKorrektur` einmal

3. **`Startbildschirm.test.tsx` (oder Erweiterung)**
   - Hebel D: Warteraum-Polling-Intervall ist 3000ms (mocked Timer)

**Test-Stand-Erwartung:** 731 + ~10 neue = ~741 vitest grün.

### Browser-E2E (preview-Branch, echte Logins)

Test-Plan analog regression-prevention.md Phase 3:

| # | Pfad | Erwartung |
|---|---|---|
| 1 | LP-Login + Prüfung "Durchführen" → SuS-Login im Warteraum | LP sieht SuS in Lobby grün ≤7s (Stoppuhr) |
| 2 | LP klickt "Freischalten" | Network-Tab: `schalteFrei` Response ≤500ms (Pre-Warm inline) |
| 3 | SuS sieht "Prüfung starten" + klickt | Erste Frage rendert ≤2s |
| 4 | LP wechselt zu Auswertung-Tab nach Abgaben | Korrektur-Daten sichtbar ≤1.5s |
| 5 | LP klickt Auswertung 2× kurz hintereinander | Network-Tab: zweiter Call `deduped:true` |
| 6 | Bundle G.a Trigger A unverändert (LP "Speichern") | Network-Tab: `lernplattformPreWarmFragen` Call wie vorher |
| 7 | SuS-Logout-Cleanup (G.c) bleibt funktional | DevTools → IDB nach Logout leer |
| 8 | Polling-Last sichtbar in Apps-Script-Logs während 1 Min Lobby mit 1 SuS | ~20 SuS-Heartbeats (3s-Intervall) + ~12 LP-Polls (5s-Intervall) im Logger sichtbar; ±20% Toleranz |

## Akzeptanz-Kriterien

| Kriterium | Wert |
|---|---|
| Sync 1 (LP sieht SuS-grün in Lobby) | ≤7s (vorher bis 20s) |
| Sync 2 (SuS-erste-Frage nach Freischalt-Klick) | ≤2s (vorher ~5s) |
| Sync 4 (Auswertung-Tab Korrektur) | ≤1.5s (vorher 2-4s) |
| `schalteFrei`-Response-Latenz | ≤+200ms gegenüber heute |
| Bundle G.a Latenzen unverändert (Regressions-Floor) | Cold ≤1'200ms intern, Warm ≤250ms intern |
| Bundle G.c Logout-Cleanup unverändert | IDB nach Logout leer |
| Alle GAS-Test-Shims grün | 8 Cases (4 in `testPreWarmFragenBeimFreischalten` + 4 in `testPreWarmKorrektur`) |
| Alle vitest-Tests grün | 731 baseline + ~10 neue |
| `tsc -b` clean | ja |
| `npm run build` erfolgreich | ja |
| Browser-E2E grün | 8/8 Punkte |

## Reihenfolge der Implementierung (Plan-Phase)

**Hard-Constraint:** Ein einziger Apps-Script-Deploy für alle Backend-Änderungen (S133/S135-Lehre: Multi-Deploy-Thrash vermeiden). Backend wird vollständig fertig + GAS-getestet, dann **einmal** deployed, dann Frontend.

1. **Backend gebündelt:** `lernplattformPreWarmKorrektur`-Endpoint + `preWarmFragenBeimFreischalten_`-Helper + `schalteFrei`-Erweiterung + 2 GAS-Test-Shims (ein Apps-Script-Deploy für alles)
2. **Apps-Script-Deploy** durch User
3. **Frontend Hebel A** (1-Zeilen-Änderung in DurchfuehrenDashboard) + Test
4. **Frontend Hebel D** (1-Zeilen-Änderung in Startbildschirm) + Test
5. **Frontend Hebel C** (`preWarmKorrektur`-Wrapper + 2 Trigger-Integrationen + Tests)
6. **Browser-E2E** auf preview mit echten Logins
7. **Mess-Verifikation** via Browser-Stoppuhr + Apps-Script-Logs
8. **Merge auf main** nach LP-Freigabe

Geschätzte Subagent-Sessions: ~8-12 Commits in 1-2 Implementations-Sessions.

## Was wir explizit NICHT in G.d.1 machen

- **IDB-Cache für Klassenlisten + Gruppen** → G.d.2 (separate Spec)
- **LP-Login-Pre-Fetch anderer Daten** → G.d.2
- **Backend-Auto-Detect Phase-Wechsel** → vereinfacht via Frontend-Trigger (Hebel C)
- **Cache-Invalidierung bei Frage-Edit** → eigenes Sub-Bundle wenn Praxis es zeigt
- **Sync 3 (LP sieht SuS-Abgabe)** → schon ≤5s, kein lohnender Hebel
- **Push-Mechanismen (SSE/WebSocket)** → Apps-Script unterstützt nichts davon
- **Rate-Adaptive-Polling** (Server-Hint "next-poll-in") → unnötige Komplexität

## Verifizierte Annahmen (Code-Read 2026-04-27)

- **`schalteFrei`-Action existiert** in `apps-script-code.js` (referenziert in [pruefungApi.ts:227](../../../src/services/pruefungApi.ts#L227))
- **`apiService.schaltePruefungFrei`-Caller** in [DurchfuehrenDashboard.tsx:465](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L465)
- **LP-Polling-Konstante** in [DurchfuehrenDashboard.tsx:231](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L231): `phase === 'aktiv' ? 5000 : 15000`
- **SuS-Warteraum-Polling-Konstante** in [Startbildschirm.tsx:86](../../../src/components/Startbildschirm.tsx#L86): `5000`
- **Phasen-Modell:** `'vorbereitung' | 'lobby' | 'live' | 'auswertung'` ([DurchfuehrenDashboard.tsx:33](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx#L33))
- **`bestimmePhase`** mappt zu `PruefungsPhase = 'vorbereitung' | 'lobby' | 'aktiv' | 'beendet'`
- **G.a-Helpers** `gruppiereFragenIdsNachTab_`, `bulkLadeFragenAusSheet_` existieren in `apps-script-code.js`
- **G.a `preWarmKorrekturNachAbgabe_`-Pattern** kann als Vorbild für `preWarmFragenBeimFreischalten_` dienen
- **`preWarmApi.ts`-Wrapper-Pattern** existiert seit G.a und kann erweitert werden
- **`PRE_WARM_ENABLED`-Kill-Switch** existiert in `services/preWarmApi.ts`

## Im Plan zu lokalisieren

- **`ladeKorrektur` Sheet-Read-Helper:** existiert ein wiederverwendbarer Helper für die Korrektur-Sheet-Lese-Logik, oder muss extrahiert werden?
- **Cache-Key-Schema von `ladeKorrektur`:** welcher Cache-Key wird gelesen, damit `lernplattformPreWarmKorrektur` denselben befüllt?
- **`schalteFrei`-Action exact location** in `apps-script-code.js`: wo ist der `setzeKonfigField('freigeschaltet', true)`-Pfad?
- **Tab-Klick-Handler in DurchfuehrenDashboard:** existiert ein zentraler `setActiveTab`-Wrapper oder ist es inline pro Tab?
- **Direct-Mount-Auswertung-Edge-Case:** Z. 264-266 setzt `setActiveTab('auswertung')` bei beendeter Prüfung. Hier explizit Pre-Warm einsetzen.
