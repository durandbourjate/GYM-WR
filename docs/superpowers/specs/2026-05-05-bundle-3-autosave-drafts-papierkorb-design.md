# Bundle 3 — Auto-Save + Drafts + Papierkorb

**Datum:** 2026-05-05
**Branch:** `feature/bundle-3-autosave-drafts-papierkorb`
**Vorgänger:** Bundle 2 (`2bb8c86`) — Editor-Komfort. User-Audit nach Bundle-2-E2E ergab fehlenden Datenverlust-Schutz im LP-Frageneditor.

## Problem

ExamLab hat im LP-Bereich aktuell **keinen Datenverlust-Schutz**:
- `grep` über das gesamte Repo: 0 Treffer für `beforeunload`, `isDirty`, `hasUnsaved`, `unsavedChanges`-Pattern
- LP tippt minutenlang Fragetext + Optionen → Browser-Tab-Schließen oder Klick neben Editor → alles weg
- SuS-Antworten haben Auto-Save (autoSave.ts + IDB-Queue, Bundle G.c) — LP-Editoren nicht
- Fragensammlung kann „verunreinigt" werden, wenn LP halb-ausgefüllte Fragen versehentlich speichert

User-Anforderung (Triage 05.05.2026):
- Auto-Save für Editor-Inhalte (datenverlust-sicher)
- Unvollständige Fragen sollen NICHT in der Fragensammlung erscheinen
- Drafts sollen prominent sichtbar sein (eigene Sektion in Fragensammlung)
- Papierkorb für Wiederherstellung gelöschter Fragen

User-Kontext: Backend-Migration von Apps-Script auf Edge-Runtime ist geplant (siehe HANDOFF „Future Bundles"). Bundle 3 sollte API-Adapter abstrahieren, damit Migration einfach ist.

## Lösung

**Hybrid Persistence (IDB-Cache + Server-Authority)** mit einheitlichem `draft|sammlung`-Status, Lazy-Draft-Creation, Soft-Delete-Papierkorb und 4-Stufen-Retry-Eskalation.

### Architektur

```
React-State ─debounced 1s──→ IDB-Cache       (instant, lokales Fallback)
            ─debounced 10s─→ Server-Sync     (Source-of-Truth)
                              (await beim Schließen)

Editor-Open  ← Server-Read → mit IDB reconcile (Server gewinnt) → State
Logout       → IDB-Cache lokal löschen (Server bleibt)
```

**API-Adapter** `ExamLab/src/services/draftApi.ts` mit 4 Endpoints (`speichereDraft`, `ladeDraft`, `loescheDraft`/`stelleWiederHer`, `listeDrafts`) abstrahiert Apps-Script. Bei Backend-Migration: Adapter-Implementation austauschen, Frontend-Code unverändert.

### Daten-Modell

Erweiterung der Frage-Storage-Type um drei Felder (in `ExamLab/src/types/fragen-storage.ts` und Apps-Script-Sheet):

```ts
interface FrageMitDraftLifecycle {
  status: 'draft' | 'sammlung'        // REQUIRED mit Default 'sammlung' für Backfill
  geloescht_am: string | null         // ISO-Timestamp für Soft-Delete (Papierkorb)
  // existing: autor, geteilt, pruefungstauglich (bleiben unverändert)
}
```

`status` ist **required** (nicht optional) — Bundle-L-Lehre „Vaporware-Type-Union vermeiden". Default `'sammlung'` für Migration aller existierenden Fragen. `pruefungstauglich` bleibt orthogonal: eine Sammlung-Frage darf `pruefungstauglich=false` sein (LP-Begutachtung), ist aber strukturell vollständig.

**Sheet-Schema:** Aktuelles Fragen-Sheet hat `A1:T1` (20 Spalten). Bundle 3 erweitert auf `A1:V1` (22 Spalten):
- Spalte U: `status` (`'draft'` | `'sammlung'`)
- Spalte V: `geloescht_am` (ISO-String oder leer)

**Migration-Reihenfolge** (zwingend in dieser Reihenfolge):
1. Manuelles Google-Sheets-Backup (Memory S136 C9-Lehre)
2. Header-Erweiterung Spalte U+V via Apps-Script-Job
3. Backfill alle existing Rows: `status='sammlung'`, `geloescht_am=''`
4. Verify per Stichprobe (3 Fragen)
5. Endpoints aktivieren

**Vollständigkeits-Trigger (draft↔sammlung): Server ist Authority.** Client zeigt UI-Hinweis (amber-Status) basierend auf lokaler `pflichtfeldValidation`, finaler `status`-Wert wird aber nach jedem Server-Sync aus der Response übernommen. Server-side `istVollstaendig_(frage)` (analog `pflichtfeldValidation`-Logik portiert) ist die einzige Quelle für Status-Wechsel.

### State-Machine

```
[Editor offen, leer]
       │ erste Eingabe (Lazy)
       ▼
   [draft] ────vollständig────→ [sammlung]
       │                            │
       │                            │ Pflichtfeld gelöscht
       │  ←─────zurück──────────────┘
       │
       │ explicit Verwerfen / Auto-Cleanup nach 30 Tagen (Phase 2, optional)
       ▼
   [geloescht_am=now] (Papierkorb, sowohl drafts als auch sammlung)
       │ Wiederherstellen
       │
       ▼
   [draft] ODER [sammlung] (zurück zum Vor-Lösch-Status)
       │
       │ Hard-Delete nach 90 Tagen ODER manuell
       ▼
   gelöscht
```

**Trigger draft↔sammlung:** `pflichtfeldValidation` (existierend) — strukturelle Vollständigkeit aller Pflichtfelder.

### Lazy-Draft-Creation

LP klickt „+ Neue Frage":
- Editor öffnet ohne Draft (kein Server-Eintrag, keine UUID)
- Beim Mount: `draftId = useState(() => existingFrage?.id ?? null)`
- Bei **erster Eingabe** (Fragetext, Thema, Fach, …): `draftId = crypto.randomUUID()` + erster Sync queued
- Bei sofortigem Schließen ohne Tippen: nichts persistiert, kein Cleanup nötig

### Auto-Save-Flow

| Trigger | Lokal (IDB) | Server | UI |
|---|---|---|---|
| Erste Eingabe (Lazy) | Draft mit neuer UUID anlegen | next debounce (10s) | grau „Speichert…" |
| Tippen | debounced 1s update | debounced 10s sync | grau „Speichert…" / grün „✓ Gespeichert" |
| Pflichtfelder OK | — | server-side `status: 'sammlung'` | grün „✓ Gespeichert" |
| Pflichtfeld gelöscht | update | sync `status: 'draft'` | amber „📝 Entwurf — Pflichtfelder fehlen: …" |
| Editor schließen | letzter sync await | finale Sync vor close (max 3s spinner-block, dann silent close + background sync mit Toast „wird im Hintergrund gespeichert") | spinner kurz, max 3s |
| Verwerfen-Klick | IDB-Eintrag löschen | `geloescht_am=now` (Soft-Delete in Papierkorb) | nichts (UI schließt) |
| Wiederherstellen | — | `geloescht_am=null` | Frage zurück in Drafts/Sammlung |

### Retry-Schema (4 Stufen)

| Fehler-Typ | Verhalten | UI |
|---|---|---|
| Network-Error / 5xx | Silent retry exp. backoff: 1s→2s→4s (max 3) | nichts während Retries |
| 401 Nicht authentifiziert | `sessionWiederherstellen` + 1 retry (Bug 8b-Pattern) | nichts (transparent) |
| 429 Rate Limit | Wait `Retry-After`-Header + retry | gelb „Server überlastet — wird wiederholt" |
| 4xx (außer 401/429) | Direkt eskalieren — Logik-Fehler | rotes Banner sofort |
| Nach 3 Max-Retries | Harte Eskalation | rotes Banner + Schließen-Confirm |

**Eskalations-UI (Stufe 3):**
```
⚠️ Server nicht erreichbar.
Deine Änderungen sind lokal sicher, aber noch nicht synchronisiert.
[Erneut versuchen]
```
Plus: Schließen-Confirm aktiviert: „Daten gehen bei Logout verloren. Wirklich schließen?"

### Drafts-Sichtbarkeit + Sharing

Drafts sind **persönlich** standardmäßig (`autor: email`). Sharing-Pattern analog zu Fragen:
- Optional `geteilt: { fachschaft?: 'WR'|'IN'; nutzer?: email[] }`
- Drafts-Sektion in Fragensammlung-UI zeigt: eigene + (geteilte mit Fachschaft / direkt geteilte)
- Zeigt Owner-Hinweis bei geteilten Drafts („geteilt von kollege@…")

### UI-Komponenten

**Save-Status-Indikator** (im Editor-Footer, ersetzt aktuellen Save-Button):
- 5 Zustände: `Gespeichert` (grün), `Speichert…` (grau spinner), `Entwurf — Pflichtfelder fehlen: …` (amber, mit Liste), `Verbindungsproblem` (gelb, retry läuft), `Server nicht erreichbar` (rot Banner, retry-Button)

**Drafts-Sektion in Fragensammlung** (oben, vor regulärer Liste):
```
✏️ Entwürfe (3)
   • Konjunktur — VWL · vor 2 Std (eigen)
   • (ohne Titel) — BWL · vor 5 Min (eigen)
   • Buchungssatz — BWL · gestern (geteilt von kollege@…)
```

**Papierkorb-View** (eigene Route `/papierkorb` oder Tab in Fragensammlung):
- Liste gelöschter Fragen mit `geloescht_am`-Timestamp
- Pro Eintrag: `[Wiederherstellen]` `[Endgültig löschen]`-Buttons
- Warnung wenn Eintrag älter als 83 Tage: „Wird in N Tagen endgültig gelöscht"
- Auto-Hard-Delete nach 90 Tagen via Apps-Script-Trigger (täglich)

**Schließen-Modal** (nur bei unvollständigem Draft):
```
Die Frage ist unvollständig — folgende Felder fehlen:
  • Fragetext
  • Fach

Speichern in der Sammlung ist nicht möglich.

[Als Entwurf behalten]  [Verwerfen]
```
Bei vollständig-und-synced: silent close, kein Modal.

**App-weiter `beforeunload`-Listener:** wenn IRGENDEIN dirty-Editor offen → Browser-Standard-Warnung. Plus Logout-Pfad async warten (S149-Pattern: `tx.oncomplete`-await für IDB-Cleanup vor Hard-Nav).

**BroadcastChannel** für Multi-Tab-Sync: gleicher User editiert dieselbe Frage in 2 Tabs → letzter Server-Sync gewinnt, anderer Tab erhält Update via Channel.

### Migration der bestehenden Fragen

~2412 existierende Fragen bekommen einmalig via Apps-Script-Migrations-Job:
- `status: 'sammlung'` (alle aktuellen Fragen sind in der Sammlung)
- `geloescht_am: null`

Kein Daten-Verlust. Pflichtfeld-validierung-fail bleibt mit `pruefungstauglich=false` (existing) — Frage bleibt in Sammlung mit Warn-Badge, nicht in Drafts. User kann manuell zu Drafts wandern lassen wenn gewünscht (Phase 2 Polish).

## Scope

### Frontend (ExamLab + shared)

- `ExamLab/src/services/draftApi.ts` (neu) — API-Adapter, 4 Endpoints
- `ExamLab/src/services/draftSync.ts` (neu) — Hybrid IDB+Server mit debounce + Retry
- `ExamLab/src/hooks/useDirtyTracker.ts` (neu) — boolean state, app-weiter Tracker im store
- `ExamLab/src/hooks/useFragenAutoSave.ts` (neu) — Editor-Hook, kombiniert Tracker + draftSync. Naming bewusst spezifisch (nicht `useAutoSave`), um Verwechslung mit existing `services/autoSave.ts` (SuS-Antworten-Bundle G.c) zu vermeiden.
- `ExamLab/src/store/draftStore.ts` (neu) — globaler State für aktive Drafts (für UI-Liste + beforeunload)
- `packages/shared/src/editor/SharedFragenEditor.tsx` — `useFragenAutoSave` integrieren, Save-Button durch Status-Indikator ersetzen
- `packages/shared/src/editor/components/SaveStatusIndikator.tsx` (neu) — 5 Zustände
- `packages/shared/src/editor/components/SchliessenModal.tsx` (neu) — bei unvollständig
- `ExamLab/src/components/lp/fragenbank/DraftsSection.tsx` (neu) — Drafts-Sektion in Fragensammlung
- `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx` — DraftsSection oben einbinden
- `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx` (neu) — Liste, Wiederherstellen, Endgültig-löschen
- `ExamLab/src/AppLP.tsx` (oder `LPStartseite.tsx`) — `beforeunload`-Listener auf dirty-Tracker
- `ExamLab/src/store/authStore.ts` — Logout-Pfad: IDB-Cache cleanen vor Hard-Nav (S149)
- `ExamLab/src/types/fragen-storage.ts` — Type-Erweiterung um `status`, `geloescht_am`

### Backend (Apps-Script)

- `ExamLab/apps-script-code.js`:
  - Sheet-Schema-Migration: 2 neue Spalten in Fragen-Sheet (`status`, `geloescht_am`) — Header + Migration-Job für existing Rows
  - 4 neue Endpoints:
    - `speichereDraft(frage, owner)` — Upsert mit `status` automatisch berechnet via `istVollstaendig_(frage)` (Server-side-Validierung der Pflichtfelder)
    - `ladeDraft(frageId, requesterEmail)` — single-Frage mit Owner-Check (Sharing respected)
    - `listeDrafts(requesterEmail)` — alle eigene + geteilte Drafts des Users
    - `softDeleteFrage(frageId, requesterEmail)` / `stelleWiederHer(frageId)` / `hardDeleteFrage(frageId)` — Papierkorb-Operationen
  - Existing `lade…`-Endpoints: filter `geloescht_am === null` (Papierkorb-Inhalte ausblenden in normalen Listen)
  - Daily-Trigger für Auto-Hard-Delete (`installAutoHardDeleteTrigger_`, läuft 1× täglich, löscht alle Einträge mit `geloescht_am < now - 90 Tage`)
  - GAS-Test-Shim `testBundle3DraftLifecycle_` — deckt: lazy creation, status-Übergang vollständig↔unvollständig, soft-delete, restore, hard-delete

### Tests

- **Unit:** `useDirtyTracker`, `useFragenAutoSave`, `draftSync` (debounce, retry, conflict-resolution). BroadcastChannel via `vi.mock` gestubt (jsdom-Support begrenzt), echter Multi-Tab-Test nur in E2E.
- **Unit:** `draftApi` (alle 4 Endpoints, Mocking via `vi.mock`)
- **Unit:** Status-Migration-Logik (`istVollstaendig_` ↔ `pflichtfeldValidation`)
- **Component:** `SaveStatusIndikator` (5 Zustände)
- **Component:** `SchliessenModal` (vollständig/unvollständig/Verbindungsfehler-Variante)
- **Component:** `DraftsSection` (eigene + geteilte Filter)
- **Component:** `PapierkorbView` (Liste, Wiederherstellen, Endgültig-löschen-Confirm)
- **Apps-Script GAS:** `testBundle3DraftLifecycle_` (komplette Lifecycle-Sequenz)
- **E2E mit echten Logins:** Frageneditor-Flow (lazy creation, draft↔sammlung-Übergang, Schließen-Modal nur bei unvollständig, Server-Crash-Simulation, Wiederherstellen-Banner, Multi-Tab via BroadcastChannel, Logout-IDB-Cleanup)

## Risiken / Spezialfälle

1. **Apps-Script-Latency** (Memory `code-quality.md`): jeder Sync-Call ~1.5-2s. 10s-Debounce + IDB-Cache mitigieren. Bei Backend-Migration: Latency entfällt → schneller Sync möglich.
2. **Apps-Script-Quota**: bei Multi-LP später relevant. Aktuell single-user, kein Limit-Risiko.
3. **IDB-Cleanup bei Logout** (S149-Lehre): zwingend `tx.oncomplete`-await vor `window.location.href`. Privacy-Verlust auf shared Geräten sonst möglich.
4. **Multi-Tab-Konflikt**: User editiert dieselbe Frage in 2 Tabs. Last-write-wins via BroadcastChannel — anderer Tab kriegt Update. Akzeptiert für Phase 1 (kein Versions-System).
5. **Pflichtfeld-Definition**: `pflichtfeldValidation` ist existing (Bundle L). Was als „vollständig" gilt, hängt davon ab. Falls LP es zu locker findet (z.B. Frage mit nur thema=string non-empty wandert in Sammlung), separater Audit nötig — aktuell akzeptabel.
6. **Draft-Sharing-Edge-Case**: LP A (Owner) löscht eine geteilte Draft. LP B (geteilt mit) sieht sie weg. Erwartetes Verhalten — Owner hat Authority. UI-Hinweis nicht nötig.
7. **Rate-Limit-Trigger**: 10s-Debounce sollte Apps-Script-Rate-Limits nicht treffen. Falls doch (z.B. mehrere Editoren parallel offen), 429-Retry-Schema greift.

## Out of Scope

- **Cross-User-Konflikt-Resolution** (versionierung, merge): last-write-wins für Phase 1
- **Versions-History pro Frage** (Edit-Log)
- **Offline-Modus** (Service-Worker, Background-Sync) — separates Bundle, PWA-Ebene
- **Bundle für PruefungsComposer / Stammdaten / Korrektur-Vollansicht**: gleicher Pattern, eigenes Bundle 4 (kann denselben `useFragenAutoSave`-Hook wiederverwenden)
- **Auto-Cleanup-Drafts nach 30 Tagen**: Phase-2-Add-On, optional
- **Server-Side-`istVollstaendig_` als Single-Source**: aktuell Frontend `pflichtfeldValidation` + Server-side-Doppel-Check. Konsolidierung in Phase 2

## Implementation-Reihenfolge (für Plan)

1. **Phase A — Daten-Modell + Apps-Script-Backend**
   - Type-Erweiterung
   - Apps-Script Sheet-Migration + 4 Endpoints + GAS-Test-Shim
   - **User-Task: Apps-Script-Deploy + Migration-Job für existing Fragen**

2. **Phase B — Service-Layer**
   - draftApi.ts (Adapter)
   - draftSync.ts (Hybrid IDB+Server mit debounce + Retry)
   - useDirtyTracker, useFragenAutoSave Hooks
   - draftStore (global)
   - Tests

3. **Phase C — Editor-Integration**
   - SharedFragenEditor: useFragenAutoSave einbinden
   - SaveStatusIndikator
   - SchliessenModal
   - app-weiter beforeunload + Logout-IDB-Cleanup

4. **Phase D — Fragensammlung-UI**
   - DraftsSection in FragenBrowser
   - Sharing-Filter (eigene + geteilt)
   - Tests

5. **Phase E — Papierkorb**
   - PapierkorbView
   - Wiederherstellen + Endgültig-löschen-Confirm
   - Apps-Script Daily-Trigger für Auto-Hard-Delete
   - Tests

6. **Phase F — E2E + Merge**
   - Browser-E2E mit echten Logins, alle Pfade
   - HANDOFF-Update
   - Merge → main

## Verifikation

- `tsc -b` clean (ExamLab + shared --force baseline)
- `vitest run` alle bestehenden + neue Tests grün
- `lint:as-any` 0/0/0
- `npm run build` clean
- Apps-Script `testBundle3DraftLifecycle_` 4-5 Cases grün im GAS-Editor
- Browser-E2E: 10+ Pfade mit echten Logins (`wr.test@gymhofwil.ch`)

## Aufwand-Schätzung

- **Frontend:** ~15-20 Files (5-6 neu, Rest Modifikation)
- **Backend:** 4 neue Endpoints + Sheet-Schema-Migration + Daily-Trigger + GAS-Test
- **Tests:** ~15-20 neue
- **Sessions:** 3-4 (komplexer als Bundle 2 wegen mehr Files + Apps-Script-Schema-Migration)
- **Apps-Script-Deploys:** 2-3 (initiale Endpoints + Daily-Trigger + ggf. Hotfixes)
- **Phasen:** 6 (A bis F), pro Phase 1-3 atomare Commits
