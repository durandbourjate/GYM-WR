# Bundle G.a — Server-Cache-Pre-Warming (Design-Spec)

> **Status:** Design — wartet auf Spec-Review + User-Freigabe
> **Datum:** 2026-04-26
> **Session:** S147
> **Vorgänger:** Bundle E (Übungsstart-Latenz, S146 auf `main`)

## Zielsetzung

Apps-Script-`CacheService` proaktiv vorwärmen, sobald ein klares User-Intent-Signal vorliegt — statt erst beim eigentlichen Klick auf "Übung starten" oder "Korrektur öffnen". Damit fällt für die meisten User-Aktionen der Bundle-E-Bulk-Read weg und es bleibt nur der Cache-Hit-Pfad (~300-500 ms intern statt ~1'000 ms).

**Erwartbarer Win:** Spürbare Übungsstart-Latenz von aktuell **~3-4 s** (nach Bundle E) auf **~2-2.5 s** (~30-40 % zusätzlicher Win). Plattform-Floor von ~1.5 s (HTTPS + V8-Init + Auth) bleibt unausweichlich — echtes Sub-Sekunden-UX würde Frontend-Memory-Pre-Fetch erfordern (separates Bundle G.c).

## Bundle-G-Roadmap-Kontext

Bundle G war ursprünglich als 9-Anwendungsfälle-Bundle geplant (Tier 1 #1-6 + Tier 2 #7-9). Während des Brainstorms wurde das Bundle in drei kohärente Sub-Bundles entlang technischer Boundaries zerlegt:

| Sub-Bundle | Inhalt | Backend? | Status |
|---|---|---|---|
| **G.a** | Server-Cache-Pre-Warming (4 Trigger) | ja | **diese Spec** |
| **G.b** | Client-side Prefetch (Editor/Korrektur Prev-Next, Material-iframe) | nein | später, eigene Spec |
| **G.c** | Frontend-Memory-Pre-Fetch der Frage-Stammdaten | nein, nur Frontend | später, eigene Spec mit Sicherheits-Audit |

Login-Pre-Warm aus der ursprünglichen Roadmap wurde gestrichen — kein konkretes Intent-Signal beim Login, Quota-Verschwendung wenn User heute gar nicht übt. Statt Login-Pre-Warm gibt es **Workflow-Trigger** entlang des LP- und SuS-Klickpfads.

## Vier Pre-Warm-Trigger

| ID | Auslöser | Wer ruft | Backend-Pfad |
|---|---|---|---|
| **A** | LP klickt "Speichern" beim Erstellen / Editieren einer Prüfung (Trigger-Punkt nach `speichereConfig`-Erfolg) | Frontend (LP) | neuer Endpoint `lernplattformPreWarmFragen` |
| **B** | SuS klickt Fach-Tab in Üben-Übersicht | Frontend (SuS) | derselbe Endpoint `lernplattformPreWarmFragen` |
| **C** | SuS hovert >300 ms auf Themen-Card | Frontend (SuS) | derselbe Endpoint `lernplattformPreWarmFragen` |
| **D** | SuS klickt "Abgeben" (`istAbgabe:true`) | Backend (in `speichereAntworten`-Abgabe-Pfad) | inline fire-and-forget, kein neuer Endpoint |

Trigger A: Es gibt im aktuellen Code **keinen separaten "Lobby-Anlegen"-Endpoint** — die Prüfung wird via [`speichereConfig`](../../../apps-script-code.js#L4524) (Backend-Handler `speichereConfig`) persistiert. Die `PruefungsConfig.id` ist Frontend-generiert und zur Aufrufzeit bekannt; aus `config.abschnitte` extrahiert der Frontend die `fragenIds`. Trigger A feuert direkt nach erfolgreicher `speichereConfig`-Antwort. Pre-Warm-Fenster: 2-10 min bis LP "Live schaltet".

Trigger B ist **wichtigster SuS-Hebel** (User-Aussage: „grösster Leidensdruck beim selbstständigen Üben"). Nutzt `lastUsedThema` aus localStorage (in dieser Spec neu einzuführen, Schlüssel `examlab.lastUsedThema.<gruppeId>.<fach>` mit Themen-Name als String-Wert). Frontend filtert die Fragen lokal aus dem `AppsScriptFragenAdapter`-Cache (Map<gruppeId, Frage[]>) auf `{fach, thema}` und sendet die `fragenIds` an Pre-Warm.

Trigger C deckt den Fall, in dem `lastUsedThema` nicht zum gewählten Thema passt. 300-ms-Hover-Threshold mit `useDebouncedHover`.

Trigger D verschmilzt mit `lernplattformAbgeben` — kein separater Endpoint, kein extra Frontend-Code. Inline-Aufruf vor `return jsonResponse(...)`. Async via Apps-Script-Trigger-API wurde geprüft und verworfen (~5 % Failure-Rate, 30 s+ Latenz, nicht produktionsreif).

**Wichtige Klarstellung — was Bundle G.a wärmt:** Bundle E hat den Apps-Script-`CacheService` für `lernplattformLadeLoesungen` (Lösungen) optimiert. Bundle G.a wärmt **denselben** CacheService proaktiv — den der `lernplattformLadeLoesungen` beim eigentlichen Übungs-Start liest. Frontend-Frage-Stammdaten (geladen via `lernplattformLadeFragen`) werden bereits im [`AppsScriptFragenAdapter`](../../../src/adapters/ueben/appsScriptAdapter.ts#L142) gecacht (In-Memory-Map<gruppeId, Frage[]>) — die sind nicht Teil von G.a.

## Architektur — Ansatz B (Spezifische Endpoints)

### Backend (apps-script-code.js)

**Zwei neue Endpoints + eine Erweiterung:**

```
+ lernplattformPreWarmFragen(body)    ← neu, Trigger A + B + C teilen sich
~ speichereAntworten(body)            ← Erweiterung um inline preWarmKorrekturNachAbgabe_
                                         im istAbgabe-Pfad, Trigger D
+ preWarmKorrekturNachAbgabe_(...)    ← neuer interner Helper für Trigger D
```

Da Frontend immer die `fragenIds` mitsenden kann (sie sind aus `config.abschnitte` bzw. dem Frontend-Cache lokal verfügbar), brauchen wir keinen separaten Lobby-Endpoint und auch keinen `holeLobby_`-Helper im Backend. Ein einziger Endpoint mit gemeinsamem Body-Shape genügt — die Trigger-Differenzierung passiert nur frontend-seitig durch das Aufruf-Timing. Der Endpoint nutzt die Bundle-E-Helfer `gruppiereFragenIdsNachTab_` + `bulkLadeFragenAusSheet_` als Kern. Cache-TTL bleibt 1 h (Bundle-E-Erbe).

**Endpoint — `lernplattformPreWarmFragen`:**

```
Body:     { email, sessionToken, fragenIds: string[], gruppeId: string, fachbereich?: string }
Response: { success: true, fragenAnzahl: N, latenzMs: X }
          oder { success: true, deduped: true }
          oder { error: 'Nicht autorisiert' | 'Zu viele Fragen' | <fehler> }

Verhalten:
1. validiereTokenFuerEmail_(email, sessionToken) — LP oder SuS, beides erlaubt
2. Sanity-Check: 1 ≤ fragenIds.length ≤ 200 (DoS-Schutz)
3. LockService.tryLock(`prewarm_${email}_${hashIds_(fragenIds)}`, 30 s)
   → Lock besteht: return { success: true, deduped: true }
4. gruppiereFragenIdsNachTab_(fragenIds, gruppeId, fachbereich)
5. bulkLadeFragenAusSheet_(sheetId, tab, idSet) für jeden Tab (befüllt CacheService)
6. Logger.log('[PreWarmFragen] email=%s n=%d ms=%d')
7. return jsonResponse({success: true, fragenAnzahl: n, latenzMs: ms})
```

**Begründung Authorization (jeder authentifizierte User):** Pre-Warm-Endpoint exponiert keine Lösungen — er warmt nur den Server-Cache, dessen Inhalt nur durch berechtigten `lernplattformLadeLoesungen`-Call (mit eigenen Auth-Checks) abgerufen werden kann. Daher keine Privacy-Implikation für SuS-Aufruf.

**Begründung Lock-Key über Hash der fragenIds:** Trigger A sendet z.B. 30 fragenIds einer Prüfung; Trigger B 50 Fragen eines Themas; Trigger C 50 Fragen eines anderen Themas. Lock auf `(email, fragenIds-Hash)` dedupliziert nur wirklich identische Re-Aufrufe (Hover-Spam: User hovert auf dieselbe Card 5× hintereinander, oder LP klickt 2× "Speichern"). Verschiedene Themen blockieren sich nicht gegenseitig.

**Sanity-Check 200 Fragen:** Schutz gegen versehentliche / böswillige Riesen-Requests. Eine durchschnittliche Klassen-Prüfung hat 10-30 Fragen, ein Themen-Pool selten >50.

**Erweiterung `speichereAntworten`:**

Im `istAbgabe === true`-Pfad, nach erfolgreichem Speichern + vor `return jsonResponse(...)`:

```js
if (istAbgabe) {
  try {
    preWarmKorrekturNachAbgabe_(pruefungId, email);
  } catch (e) {
    console.log('[Abgabe-PreWarm-Fehler] ' + e.message);
  }
}
```

`preWarmKorrekturNachAbgabe_` ist **kein neuer Endpoint**, sondern interne Helper-Funktion. Sie liest die `fragenIds` aus dem `Configs`-Sheet anhand `pruefungId` (analog zur bestehenden Logik in `speichereAntworten`, die `configRow` in Z. 3052 lookuped) und ruft `bulkLadeFragenAusSheet_` für die Korrektur-Daten dieser SuS-Abgabe.

**Cache-Granularität:** Der Cache wird pro Lobby-Tab aggregiert befüllt (analog Bundle E — `bulkLadeFragenAusSheet_` cached den ganzen Tab). Jede SuS-Abgabe wärmt denselben Tab-Cache; weitere Abgaben aus derselben Lobby finden bei der ersten Abgabe schon einen warmen Cache und triggern via `tryLock`-äquivalentem Mechanismus keinen erneuten Sheet-Read (Detail im Plan).

Latenz-Impact auf Abgabe-Response: 50-200 ms (Sheet-Read + Cache-Write) bei der ersten Abgabe; ~10 ms ab der zweiten (Cache schon warm).

### Frontend (ExamLab/src)

**Neu:**

```
+ services/preWarmApi.ts
+ hooks/usePreWarm.ts
+ hooks/useDebouncedHover.ts (für Trigger C)
```

**`services/preWarmApi.ts`:**

```ts
export const PRE_WARM_ENABLED = true; // Kill-Switch via Frontend-Deploy

export async function preWarmFragen(
  fragenIds: string[],
  gruppeId: string,
  fachbereich?: string,
  signal?: AbortSignal
): Promise<void>;
```

Ein einziger Wrapper für alle drei Trigger A/B/C, da Endpoint und Body-Shape identisch sind.

Der Wrapper:
- Nutzen den existierenden `postJson`-Helper aus `apiClient.ts` (S130-Lehre `postJson<T>` ist Lüge — beide Funktionen extrahieren `.success` selbst)
- Catch-all-Error-Handler intern (kein Throw nach aussen, fail-silent)
- Returnen `Promise<void>` — kein Datenpfad zurück
- Respektieren `PRE_WARM_ENABLED`-Flag (early-return wenn `false`)
- Respektieren `signal.aborted` (early-return wenn `true`)

**`hooks/usePreWarm.ts`:**

```ts
export function usePreWarm(
  apiCall: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList
): void;
```

Verhalten:
- Bei Mount oder Dep-Change: AbortController erzeugen, `apiCall(signal)` triggern
- Bei Unmount oder erneutem Dep-Change: AbortSignal feuert
- Network-Timeout 5 s (eigener `setTimeout` der Signal feuert)
- Kein State-Update auf unmounted Component

**`hooks/useDebouncedHover.ts`:**

```ts
export function useDebouncedHover(
  delayMs: number,
  callback: () => void
): { onMouseEnter: () => void; onMouseLeave: () => void };
```

Verhalten:
- `onMouseEnter` startet `setTimeout(callback, delayMs)`
- `onMouseLeave` ruft `clearTimeout`
- Auf Touch-Devices (iPad): `onMouseEnter` feuert beim Tap — kein Pre-Warm-Spam, weil Tap eh sofort den Klick auslöst und der Lock greift

**Drei Call-Sites** (Trigger-A-Komponente per Code-Read verifiziert; B/C-Komponenten exakt im Plan zu lokalisieren):

```
~ Trigger A: src/components/lp/LPStartseite.tsx (speichereConfig wird Z.261/283
  aufgerufen) oder VorbereitungPhase.tsx
    Nach erfolgreichem speichereConfig:
    const fragenIds = config.abschnitte.flatMap(a => a.fragenIds ?? [])
    if (fragenIds.length > 0) preWarmFragen(fragenIds, gruppeId, fachbereich)

~ Trigger B: SuS-Üben-Fach-Tab-Komponente (Plan-Phase: lokalisieren)
    onClick auf Fach-Tab:
      const lastThema = localStorage.getItem(
        `examlab.lastUsedThema.${gruppeId}.${fach}`
      )
      if (lastThema) {
        const fragenIds = uebenFragenAdapter.getCachedFragen(gruppeId)
          ?.filter(f => f.fach === fach && f.thema === lastThema)
          .map(f => f.id) ?? []
        if (fragenIds.length > 0) preWarmFragen(fragenIds, gruppeId, fachbereich)
      }
    [Schreibt lastUsedThema beim erfolgreichen starteSession()]

~ Trigger C: ThemaCard-Komponente (Plan-Phase: lokalisieren)
    via useDebouncedHover(300, () => {
      const fragenIds = uebenFragenAdapter.getCachedFragen(gruppeId)
        ?.filter(f => f.fach === fach && f.thema === thema).map(f => f.id) ?? []
      if (fragenIds.length > 0) preWarmFragen(fragenIds, gruppeId, fachbereich)
    })
```

**Frontend-Cache-Zugriff:** Der `AppsScriptFragenAdapter` ([appsScriptAdapter.ts:142](../../../src/adapters/ueben/appsScriptAdapter.ts#L142)) hält bereits einen In-Memory-Map<gruppeId, Frage[]>. Aktuell ist die `cache`-Property privat — wir ergänzen einen `getCachedFragen(gruppeId)`-Public-Getter (kein neuer Backend-Call, nur Read-Through). Falls der Cache bei einem Trigger noch leer ist (z.B. User klickt sofort nach Login auf einen Tab, vor `ladeFragen`-Call), wird Trigger B/C ein No-Op — keine Pre-Warm. Beim nächsten Klick mit warmem Frontend-Cache feuert Pre-Warm.

**`lastUsedThema`-Persistenz (neu in dieser Spec):** localStorage-Key `examlab.lastUsedThema.<gruppeId>.<fach>` mit Themen-Name als Value. Wird in `uebungsStore.starteSession` gesetzt nach erfolgreichem Session-Start. Try/catch um localStorage-Calls (S118-Lehre).

## Datenfluss pro Use-Case

### Use-Case A: LP speichert neue Prüfung → SuS-Lösungen warm

```
LP klickt "Speichern" beim Erstellen / Editieren einer Prüfung
  ↓
Frontend ruft speichereConfig(email, config) → Backend speichert ins
  Configs-Sheet
  ↓
Frontend extrahiert: const fragenIds = config.abschnitte.flatMap(a => a.fragenIds ?? [])
  ↓
Frontend: preWarmFragen(fragenIds, gruppeId, fachbereich)  [fire-and-forget]
  ↓
LP arbeitet weiter (Vorbereitung-Phase, später Lobby SuS einladen,
  Zusatzzeiten, Einstellungen) — 2-10 min
  ↓
Backend (parallel zur LP-Arbeit):
  validiereTokenFuerEmail_ + Sanity-Check + LockService.tryLock
  → gruppiereFragenIdsNachTab_(fragenIds, gruppeId, fachbereich)
  → bulkLadeFragenAusSheet_(...) für jeden Tab → CacheService.putAll()
  Latenz: ~1-2 s GAS-intern
  ↓
LP klickt "Live schalten"
  ↓
SuS klicken Code/Link
  ↓
SuS-Browser ruft lernplattformLadeLoesungen
  → CacheService.getAll() liefert Fragen aus warmem Cache
  → Latenz: ~300-500 ms intern (Cache-Hit-Pfad)
  → Spürbar für SuS: ~2-2.5 s (mit Plattform-Overhead)
```

### Use-Case B: SuS klickt Fach-Tab in Üben-Übersicht

```
SuS klickt z.B. "BWL"-Tab
  ↓
Frontend liest lastUsedThema = localStorage[`examlab.lastUsedThema.${gruppeId}.BWL`]
  ↓
Wenn vorhanden:
  fragenIds = uebenFragenAdapter.getCachedFragen(gruppeId)
    .filter(f => f.fach === 'BWL' && f.thema === lastUsedThema)
    .map(f => f.id)
  preWarmFragen(fragenIds, gruppeId, 'BWL')  [fire-and-forget]
  ↓
SuS navigiert: Thema → Schwierigkeit → Anzahl → "Üben starten"
(5-15 s User-Klicks)
  ↓
Backend (parallel):
  validiereTokenFuerEmail_ + Sanity-Check + LockService.tryLock(hashIds_)
  → bulkLadeFragenAusSheet_('BWL', idSet=fragenIds)
  → CacheService.putAll()
  Latenz: ~1-2 s GAS-intern
  ↓
SuS klickt "Üben starten"
  ↓
Block-Picker rollt 10 Fragen aus dem Thema (alle aus dem warmen Set)
  ↓
SuS-Browser ruft lernplattformLadeLoesungen
  → Cache-Hit für ALLE 10 Fragen
  → Spürbar: ~2 s
```

### Use-Case C: SuS hovert auf Themen-Card

```
SuS hovert auf "Konjunkturzyklen"-Card
  ↓
useDebouncedHover startet 300-ms-Timer
  ↓
[Mouse leaves <300ms]   [Mouse stays >300ms]
clearTimeout, kein Call  → fragenIds = uebenFragenAdapter.getCachedFragen(...)
                              .filter(f => f.thema === 'Konjunkturzyklen').map(f => f.id)
                          → preWarmFragen(fragenIds, gruppeId, 'VWL')
                          ↓
                          LockService dedupliziert via hashIds_(fragenIds)
                          wenn User dieselbe Card kürzlich (30 s) gehovert hat
                          ↓
                          Identischer Backend-Pfad wie Use-Case B
```

**Hover-Spam-Szenario abgedeckt:** User fährt mit Maus über 8 Themen-Cards in 5 s. Jedes Hover >300 ms triggert `preWarmFragen` mit jeweils anderem fragenIds-Set → 8 verschiedene Lock-Keys → keine gegenseitige Blockade. Re-Hover dieselbe Card: gleicher Hash → `deduped:true`. 8 Pre-Warms in 5 s GAS-Quota-mässig kein Problem (Quota = 100k pro Tag).

### Use-Case D: SuS klickt "Abgeben"

```
SuS klickt "Abgeben"
  ↓
Frontend ruft speichereAntworten({pruefungId, email, antworten, istAbgabe: true, ...})
  ↓
Backend (speichereAntworten in apps-script-code.js:3032):
  Auth + Status-Check + Speichern der Antworten
  ↓
  if (istAbgabe) try {
    preWarmKorrekturNachAbgabe_(pruefungId, email)  [intern, try/catch]
      → configRow aus Configs-Sheet anhand pruefungId
      → fragenIds aus configRow.abschnitte extrahieren
      → bulkLadeFragenAusSheet_(... für die Korrektur-Daten)
      → CacheService.putAll()
  }
  ↓
  return jsonResponse({success: true})
  Latenz: ~50-200 ms zusätzlich gegenüber heutigem Abgabe-Endpoint (erste Abgabe)
          ~10 ms ab der zweiten Abgabe (Cache schon warm via Tab-Granularität)
  ↓
LP öffnet Korrektur-Dashboard für diese Prüfung
  → Cache-Hit auf Korrektur-Daten dieser SuS
  → Spürbar für LP: ~2 s statt ~3-4 s
```

## Fehlerbehandlung

### Grundprinzip

Pre-Warm ist eine **Performance-Optimierung**. Wenn sie fehlschlägt, muss der reguläre Pfad (`lernplattformLadeLoesungen` mit Bundle-E-Bulk-Read) unverändert weiter funktionieren. Es darf keinen Fall geben, in dem ein Pre-Warm-Fehler Login, Übungs-Start oder Abgabe blockiert.

### Frontend-Fehlerpfade

| Fehler | Verhalten |
|---|---|
| Network-Timeout (>5 s) | AbortController feuert, Promise resolves mit `void` |
| Backend liefert `{error}` | Catch-all in `preWarmApi.ts` loggt via `console.warn`, Promise resolves mit `void` |
| User wechselt Tab/unmounted | AbortController feuert, kein State-Update auf unmounted Component |
| Hook-Dep ändert sich | AbortController feuert, neuer Pre-Warm-Call gestartet |
| `lastUsedThema` ist null/undefined (B) | Hook ruft API-Funktion gar nicht erst auf |

**Kein Toast, kein Banner, kein Spinner für Pre-Warm.** User soll nichts merken, ausser dass es schneller ist.

### Backend-Fehlerpfade

| Fehler | Verhalten |
|---|---|
| Auth fehlt/ungültig | `{error: 'Nicht autorisiert'}`, Frontend ignoriert |
| Sanity-Check (>200 fragenIds) | `{error: 'Zu viele Fragen'}`, Logger-Warnung, Frontend ignoriert |
| LockService-Lock besteht (B/C) | `{success: true, deduped: true}` — kein Fehler |
| Sheet-Read schlägt fehl | try/catch, Logger.log + `{error}`, Frontend ignoriert |
| CacheService.putAll quota voll | try/catch im Helper, Logger.log, kein Fehler nach aussen |
| `preWarmKorrekturNachAbgabe_` (D) wirft | try/catch in `speichereAntworten`-Abgabe-Pfad, Logger.log, **Abgabe-Response bleibt success:true** |

### Race-Condition

**Szenario:** LP speichert Prüfung → Pre-Warm startet → 3 s später klickt SuS bereits "Übung starten" (z.B. eilig). Pre-Warm-Backend ist noch in `bulkLadeFragenAusSheet_`.

**Verhalten:** `lernplattformLadeLoesungen` läuft regulär — entweder ist der Cache schon teilweise warm (partial Cache-Hit, schneller als cold) oder noch nicht (cold-Pfad mit Bundle-E-Bulk-Read als Fallback). Beide Pfade liefern korrekte Daten. **Kein Locking auf Lade-Pfad.**

### Kill-Switch

Bei chronischem Production-Failure: Frontend-Konstante `PRE_WARM_ENABLED = false` setzen, deployen, Pre-Warm ist aus. Kein Backend-Rollback nötig. Bundle-E-Pfad funktioniert weiter.

## Edge-Cases

| Edge-Case | Verhalten |
|---|---|
| Prüfung ohne Fragen / leere `abschnitte` | Frontend: `if (fragenIds.length > 0)` Guard verhindert API-Call. Backend bekommt nichts. |
| SuS-Login während Pre-Warm läuft | GAS-CacheService ist atomar pro `getAll/putAll`. Worst Case: Cache-Miss, Bundle-E-Fallback. Korrekt. |
| LP wechselt Browser-Tab während Pre-Warm | AbortController stoppt Lauschen, Backend läuft zu Ende. Beabsichtigt — Backend-Arbeit nicht verschwendet. |
| SuS hat keinen `lastUsedThema` (B) | localStorage liefert `null` → Hook ruft API-Funktion gar nicht erst auf. Erste Üben-Session profitiert nicht von B, aber Hover (C) feuert. |
| Frontend-Frage-Cache leer (B/C) | `getCachedFragen` liefert `undefined` oder leeres Array → `fragenIds.length === 0` → kein API-Call. Wird beim nächsten Klick mit warmem Frontend-Cache feuern. |
| Doppel-Trigger B + C kombiniert | LockService dedupliziert via `hashIds_(fragenIds)`. Verschiedene Themen blockieren sich nicht. |
| Cache-Invalidierung beim Frage-Edit | Cached Version max. 1 h alt (Bundle-E-TTL). Bundle G.a verschärft das nicht. Cache-Invalidation auf Edit ist eigenes Sub-Bundle wenn Praxis es zeigt. |

## Test-Strategie

### Backend-Tests (Apps Script)

Zwei neue GAS-Test-Shims am Dateiende, mit Public-Wrappern ohne Underscore (S133-Lehre):

1. **`testPreWarmFragen_` + `testPreWarmFragen`**
   - Cases: (a) Cold-Call mit 30 fragenIds einer Prüfung, (b) zweiter Call mit identischen fragenIds innerhalb 30 s → `deduped:true`, (c) zweiter Call mit anderen fragenIds → kein Lock, neuer Sheet-Read, (d) Auth-Fail (kein Token), (e) Sanity-Check-Verletzung (>200 fragenIds)
   - Assertions: Response-Shape, LockService-Verhalten, CacheService-Eintrag tatsächlich vorhanden, Latenz <3 s intern

2. **`testPreWarmEffekt_` + `testPreWarmEffekt`** — **das Akzeptanz-Kriterium**
   - N=10 cold-Pfad (kein Pre-Warm) vs. N=10 warm-Pfad (nach Pre-Warm) für `lernplattformLadeLoesungen`
   - Output: Latenz-Vergleich in `Logger.log`
   - **Ziel: pre-warmed-Pfad ≤ 700 ms intern**

3. **`testPreWarmKorrekturNachAbgabe_` + `testPreWarmKorrekturNachAbgabe`** — Trigger-D-Verifikation
   - Cases: (a) Erste Abgabe einer Lobby → CacheService befüllt + Latenz-Overhead messbar (~50-200 ms), (b) Zweite Abgabe derselben Lobby → Cache schon warm, Overhead ~10 ms
   - Assertions: Cache-Granularität pro Lobby-Tab, Latenz-Akzeptanz erfüllt

### Frontend-Tests (vitest)

Drei Test-Dateien:

1. **`preWarmApi.test.ts`** — Mock `postJson`, Cases: erfolgreicher Call / Backend-Error / Timeout / Promise resolves immer void
2. **`usePreWarm.test.ts`** — Mock-API mit AbortSignal, Cases: Mount-Fire / Unmount-Abort / Re-Call bei Dep-Change / kein Call bei null-Dep
3. **`useDebouncedHover.test.ts`** — vitest-fake-timers, Cases: <300ms cancelt / >300ms feuert / Mouse-Leave während Timer cancelt

### Browser-E2E (auf preview-Branch)

Echte Logins (LP `yannick.durand@gymhofwil.ch` + SuS `wr.test@stud.gymhofwil.ch`). Test-Plan analog regression-prevention.md Phase 3:

| # | Pfad | Erwartung |
|---|---|---|
| 1 | LP speichert neue BWL-Prüfung mit 10 Fragen | Network-Tab: `lernplattformPreWarmFragen` direkt nach `speichereConfig` |
| 2 | LP wartet 30 s, schaltet live | Stackdriver: Pre-Warm fertig vor Live-Schaltung |
| 3 | SuS startet Übung dieser Prüfung | Stoppuhr "Klick → Frage 1 sichtbar" ≤ 2.5 s |
| 4 | SuS klickt BWL-Tab in Üben-Übersicht (mit lastUsedThema gesetzt) | Network-Tab: `lernplattformPreWarmFragen`-Call mit fragenIds des Themas |
| 5 | SuS hovert auf 5 Themen-Cards | 1 Call pro Card (>300 ms), 0 Calls bei <300 ms |
| 6 | SuS klickt zweimal kurz hintereinander dieselbe Card | Zweiter Call: `deduped:true` |
| 7 | SuS gibt Übung ab (`istAbgabe:true`) | Stackdriver: `[PreWarmKorrektur]`-Log nach `speichereAntworten` |
| 8 | LP öffnet Korrektur-Dashboard | Korrektur-Lade-Latenz misst, Vergleich ohne Pre-Warm-Abgabe |

## Akzeptanz-Kriterien

| Kriterium | Wert |
|---|---|
| `testPreWarmEffekt` warm-Pfad intern | ≤ 700 ms (nicht hard, ≤ 800 ms akzeptabel) |
| Browser-Stoppuhr SuS-Übungsstart spürbar | ≤ 2.5 s |
| Bundle-E-Latenzen unverändert (Regressions-Floor) | Cold ≤ 1'200 ms intern, Warm ≤ 250 ms intern |
| Abgabe-Latenz mit Trigger D (erste Abgabe) | ≤ +250 ms gegenüber Bundle-E-Abgabe-Floor |
| Abgabe-Latenz mit Trigger D (n-te Abgabe, Cache warm) | ≤ +30 ms gegenüber Bundle-E-Abgabe-Floor |
| Alle GAS-Test-Shims grün | 8 Cases (5 in `testPreWarmFragen` + 1 in `testPreWarmEffekt` + 2 in `testPreWarmKorrekturNachAbgabe`) |
| Alle vitest-Tests grün | bestehende 684 + ~25 neue |
| `tsc -b` clean | ja |
| Browser-E2E grün | 8/8 Punkte |

## Reihenfolge der Implementierung (Plan-Phase)

1. **Backend gebündelt:** `lernplattformPreWarmFragen` + Trigger-D-Erweiterung in `lernplattformAbgeben` + `preWarmKorrekturNachAbgabe_` + 3 GAS-Test-Shims (ein Apps-Script-Deploy für alles)
2. **Apps-Script-Deploy** durch User
3. **Frontend-Hook + API-Wrapper** mit vitest-Tests + neuer `getCachedFragen`-Public-Getter im Adapter + `lastUsedThema`-Persistenz im `uebungsStore`
4. **3 Frontend-Call-Sites** integrieren (A: nach `speichereConfig`, B: Fach-Tab-Click, C: ThemaCard-Hover)
5. **Browser-E2E** auf preview mit echten Logins
6. **Mess-Verifikation** via `testPreWarmEffekt` + Latenz-Stoppuhr
7. **Merge auf main** nach LP-Freigabe

Geschätzte Subagent-Sessions: ~10-15 Commits in 1-2 Implementations-Sessions (analog Bundle E mit 11 Commits).

## Was wir explizit NICHT in G.a machen

- **Frontend-Memory-Pre-Fetch** der Frage-Stammdaten → G.c (separate Spec mit Sicherheits-Audit)
- **Login-Pre-Warm** → gestrichen, kein klares Intent-Signal
- **Editor / Korrektur Prev-Next-Prefetch** → G.b (separate Spec)
- **Material-`<link rel="prefetch">`** → ebenfalls G.b
- **Cache-Invalidierung bei Frage-Edit** → eigenes Sub-Bundle, falls Praxis es zeigt
- **Login-Pre-Warm** für LP-Korrektur-Stapel → entfällt durch Use-Case D (Pre-Warm beim SuS-Abgabe)

## Verifizierte Annahmen (Code-Read 2026-04-26)

Bei der Spec-Erstellung wurden mehrere Annahmen aus dem Brainstorm via Code-Read verifiziert. Resultate:

- **"Lobby-Anlegen"-Endpoint:** existiert nicht. Echter Pfad ist `speichereConfig` ([apps-script-code.js:4524](../../../apps-script-code.js#L4524)). `config.id` wird Frontend-generiert und ist zur Aufrufzeit bekannt. Trigger A feuert direkt nach erfolgreicher `speichereConfig`-Antwort mit den `fragenIds` aus `config.abschnitte`.
- **`holeLobby_`-Helper:** existiert nicht und ist nicht nötig. Frontend gibt fragenIds direkt mit. Für Trigger D liest `preWarmKorrekturNachAbgabe_` die fragenIds inline aus dem `Configs`-Sheet (Plan-Phase: prüfen ob ein vorhandener Helper wie `ladeConfigById_` reusable ist).
- **`thema` ist String, nicht ID:** [`uebungsStore.starteSession`](../../../src/store/ueben/uebungsStore.ts#L150) nimmt `thema: string` (Themenname). Lock-Key nutzt deshalb `hashIds_(fragenIds)`, nicht `themaId`.
- **`lastUsedThema`-Persistenz:** existiert NICHT im aktuellen Code. Wird neu in dieser Spec eingeführt (localStorage-Key `examlab.lastUsedThema.<gruppeId>.<fach>`).
- **Frontend-Frage-Cache:** existiert in [`AppsScriptFragenAdapter`](../../../src/adapters/ueben/appsScriptAdapter.ts#L142) als private `Map<gruppeId, Frage[]>`. Plan-Phase: `getCachedFragen(gruppeId)`-Public-Getter ergänzen (Read-Through, kein Backend-Call).
- **Auth-Helper:** `istZugelasseneLP(email)` ist der gängige LP-Check ([apps-script-code.js:4527](../../../apps-script-code.js#L4527)). `validiereTokenFuerEmail_`-Helper-Pfad ist vorhanden (in Bundle E genutzt). `validiereLPSession_` aus dem ursprünglichen Spec-Entwurf gibt es nicht — irrelevant für G.a, da Pre-Warm-Endpoint jeden authentifizierten User akzeptiert.

## Im Plan zu lokalisieren

- **Trigger-A-Komponente:** [`LPStartseite.tsx:261/283`](../../../src/components/lp/LPStartseite.tsx#L261) ruft `speichereConfig` für Demo-Setup. Der eigentliche LP-Workflow (eigene Prüfungen erstellen) muss im Plan exakt lokalisiert werden — vermutlich in `VorbereitungPhase.tsx` oder einem zugehörigen Hook.
- **Trigger-B-Komponente:** SuS-Üben-Übersicht-Fach-Tabs. Plan-Phase: konkrete Komponente identifizieren.
- **Trigger-C-Komponente:** ThemaCard. Plan-Phase: konkrete Komponente identifizieren.
- **Trigger-D-Endpoint:** verifiziert — der SuS-Abgabe-Pfad ist `speichereAntworten` ([apps-script-code.js:3032](../../../apps-script-code.js#L3032)) im `istAbgabe === true`-Zweig. Plan-Phase: exakte Stelle für `preWarmKorrekturNachAbgabe_`-Aufruf identifizieren (nach erfolgreichem Persist + vor Return).
