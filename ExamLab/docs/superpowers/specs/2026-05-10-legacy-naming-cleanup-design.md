# Bundle Legacy-Naming-Cleanup — Design Spec

**Datum:** 2026-05-10
**Status:** Spec — Reviewer-Loop ausstehend
**Branch:** `refactor/legacy-naming-cleanup` (von `main` @ `08c4a38`)
**Bundle-Name:** Bundle Legacy-Naming-Cleanup (kurz „Bundle LN")

---

## 1. Übersicht & Scope

**Ziel:** Vollständige Entfernung der Legacy-Begriffe `fragenbank` und `lernplattform` aus Code, Apps-Script-Wire-Vertrag, Apps-Script-Konstanten, Sheet-Name-Prefix und Drive-Inventar. Konsistenter Namespace: `fragensammlung` (Daten-Domäne) und `ueben*` (Üben-Bereich).

**Hintergrund:**
- `fragenbank` (291 Treffer per HANDOFF 01.05.2026, aktuell 79) — UI-Begriff seit S99 ist „Fragensammlung", aber Identifier nicht durchgängig migriert. Bundle M hat UI-Strings umbenannt, nicht Identifier.
- `lernplattform` (217 Treffer per HANDOFF, aktuell 349 inkl. tote `apps-script-lernen/`) — Begriff aus Fusion-Phase Lernplattform→ExamLab (S59-64). Heutiges Konzept ist „ExamLab Üben". Frontend hat schon `ueben*`-Namespace etabliert (`uebenApiClient`, `uebenLoesungsApi`, `auftragStore`, `UebenEditorProvider`), aber Apps-Script-action-Strings heißen noch `lernplattform*`.
- `apps-script-lernen/` (separates Apps-Script-Verzeichnis) ist post-Fusion-Phase-6-Legacy (Commit `cf7d2eb` 05.04.2026: „Lernplattform/ gelöscht, Dateien verschoben"). Frontend nutzt nur eine `VITE_APPS_SCRIPT_URL` (Hauptbackend).

**In-Scope:**

1. **Frontend-Code-Identifier:** `fragenbank` → `fragensammlung`, `lernplattform*` → `ueben*` action-Strings + Variable-/Type-Namen
2. **Apps-Script Wire-Vertrag:** `doPost`-Switch case-Statements + Funktions-Namen in `apps-script-code.js`
3. **Apps-Script-interne Konstanten:** `FRAGENBANK_SYSTEM_TABS`, lokale Variable `fragenbankTabs`
4. **Sheet-Name-Prefix:** `'Lernplattform: '` → `'ExamLab: '` in `apps-script-code.js:8978`
5. **Storage-Drop-Code:** `examlab-fragenbank-cache` IDB-Drop in [authStore.ts:159](../../../src/store/authStore.ts) entfernen
6. **Tote `apps-script-lernen/`-Ordner:** komplett löschen (3 Files)
7. **User-Action-Brief:** Drive-Aufräumung (welche Sheets manuell umbenennen, welche alten Apps-Script-Projekte löschen)

**Out-of-Scope:**
- `pool*` Identifier (separater Audit nötig — größtenteils aktiver Code für Übungspools, nicht legacy)
- Weitere Bezeichner-Konsistenz (z.B. `uebung*`/`ueben*`-Vermischung in Stores) — bei Bedarf eigenes Cosmetic-Bundle
- Neuanlage / Restrukturierung von Sheets im Drive (nur Code ändern, Drive bleibt User-Aktion)
- Lernplattform-Apps-Script-Projekt im Google-Drive selbst — User-Aktion via Drive-Aufräum-Brief

**Deployment-Modell:** Hard-Cut. Apps-Script + Frontend werden zeitgleich auf Staging deployt, User testet beide, dann zeitgleich auf Production. Service-Worker-Cache-Invalidation gemäß Memory-Pattern `feedback_service_worker_cache_wire_bundle.md`.

---

## 2. Phasen-Struktur

Innerhalb des Mega-Bundles 4 Phasen, jede eigenständig verifizierbar (vitest + lint + build clean) und mit eigenem Commit:

| Phase | Inhalt | Wire-Vertrag-Wechsel? | Verifikation |
|---|---|---|---|
| **1** | `fragenbank` → `fragensammlung` (Frontend + Apps-Script-Konstanten + Storage-Drop-Code) | Nein | vitest, tsc, 4× lint, build |
| **2** | `lernplattform*` → `ueben*` action-Strings (Frontend + Apps-Script `doPost`-Switch + Funktions-Namen) | **Ja** (Hard-Cut) | vitest, tsc, 4× lint, build |
| **3** | Sheet-Name-Prefix `'Lernplattform: '` → `'ExamLab: '` + `apps-script-lernen/`-Ordner löschen | Nein (kosmetisch) | vitest, tsc, 4× lint, build |
| **4** | Browser-E2E + Drive-Aufräum-Brief + Reviewer-Loop | n.a. | Browser-E2E mit echten LP+SuS-Logins auf Staging, Drive-Brief abgenommen |

**Reihenfolge-Begründung:**
- Phase 1 zuerst → kein Wire-Vertrag-Risiko, Aufwärm-Bundle innerhalb des Mega-Bundles
- Phase 2 als Hauptstück → der Wire-Vertrag-Wechsel ist der eigentliche Risiko-Knoten
- Phase 3 nach Phase 2 → kosmetisch, hängt von Phase 2 nicht ab
- Phase 4 am Ende → Browser-E2E muss auf Staging mit deployed Apps-Script laufen

**Phase-Übergang:** Pro Phase 1 Commit. Code-Reviewer-Subagent zwischen Phasen, nicht erst am Ende.

---

## 3. Code-Änderungen pro Phase

### Phase 1: `fragenbank` → `fragensammlung`

| Bereich | Stellen | Anmerkung |
|---|---|---|
| src/ Components | 4 Files: [SuSVorschau.tsx](../../../src/components/lp/vorbereitung/SuSVorschau.tsx), [FragenBrowserHeader.tsx](../../../src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx), [KorrekturDashboard.tsx](../../../src/components/lp/korrektur/KorrekturDashboard.tsx), [DurchfuehrenDashboard.tsx](../../../src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx) | Vermutlich UI-Strings + Identifier |
| src/ Tests | 6 Files: [authStoreLoginPrefetch.test.ts](../../../src/tests/authStoreLoginPrefetch.test.ts), [LPStartseite.test.tsx](../../../src/tests/LPStartseite.test.tsx), [fragenBrowserEditorPrefetch.test.tsx](../../../src/tests/fragenBrowserEditorPrefetch.test.tsx), [FragenBrowser.test.tsx](../../../src/tests/FragenBrowser.test.tsx), [LPAppHeaderContainer.test.tsx](../../../src/components/lp/LPAppHeaderContainer.test.tsx), [SuSAppHeaderContainer.test.tsx](../../../src/components/sus/SuSAppHeaderContainer.test.tsx) | Test-Strings auf „Fragensammlung" UI-Begriff (Bundle M) angleichen |
| src/ Storage | [authStore.ts:159](../../../src/store/authStore.ts) (Logout-Drop alter IDB) | `examlab-fragenbank-cache`-Drop entfernen |
| `apps-script-code.js` | 6 Stellen: `FRAGENBANK_SYSTEM_TABS` (Z. 120, 285, 770) + lokale Variable `fragenbankTabs` (Z. 9265–9268) | → `FRAGENSAMMLUNG_SYSTEM_TABS` / `fragensammlungTabs` |

### Phase 2: `lernplattform*` → `ueben*` action-Strings

| Bereich | Stellen | Anmerkung |
|---|---|---|
| src/ Services | 6 Files: [preWarmApi.ts](../../../src/services/preWarmApi.ts), [uebenKorrekturApi.ts](../../../src/services/uebenKorrekturApi.ts), [uebenLoesungsApi.ts](../../../src/services/uebenLoesungsApi.ts), [ueben/apiClient.ts](../../../src/services/ueben/apiClient.ts), [ueben/index.ts](../../../src/services/ueben/index.ts), [lpApi.ts](../../../src/services/lpApi.ts) (?) | action-String-Literale in `uebenPost(...)`-Calls |
| src/ Adapter | [appsScriptAdapter.ts](../../../src/adapters/ueben/appsScriptAdapter.ts) | action-String-Mapping |
| src/ Stores | 3 Stores: [ueben/uebungsStore.ts](../../../src/store/ueben/uebungsStore.ts), [ueben/authStore.ts](../../../src/store/ueben/authStore.ts), [ueben/auftragStore.ts](../../../src/store/ueben/auftragStore.ts) | action-Strings + Type `LernplattformKeys` → `UebenKeys` |
| src/ Components | 3 Files: [UebenEditorProvider.tsx](../../../src/components/ueben/admin/UebenEditorProvider.tsx), [SuSStartseite.tsx](../../../src/components/sus/SuSStartseite.tsx), [UebungsToolView.tsx](../../../src/components/lp/UebungsToolView.tsx) | Ggf. action-String-Refs |
| src/ Types/Tests | 6 Test-Files + Type-Files (`pruefResultat.ts`, `loesung.ts`, `uebenSecurityInvariant.test.ts`, `preWarmApi.test.ts`, `uebenLoesungsApi.test.ts`, `uebenKorrekturApi.test.ts`, `uebungsStorePruefen.test.ts`, `storageMigration.ts`) | Mock-action-Strings + Test-Snapshots |
| `apps-script-code.js` | ~30 case-Statements im `doPost`-Switch + ~30 Funktions-Namen (z.B. `lernplattformLadeFragenAusGruppenSheet_` → `uebenLadeFragenAusGruppenSheet_`) | Wire-Vertrag-Wechsel |

**Konkrete action-String-Mappings:**

| Alt | Neu |
|---|---|
| `lernplattformLadeFragen` | `uebenLadeFragen` |
| `lernplattformPruefeAntwort` | `uebenPruefeAntwort` |
| `lernplattformValidiereToken` | `uebenValidiereToken` |
| `lernplattformLogin` | `uebenLogin` |
| `lernplattformCodeLogin` | `uebenCodeLogin` |
| `lernplattformLadeLoesungen` | `uebenLadeLoesungen` |
| `lernplattformPreWarmFragen` | `uebenPreWarmFragen` |
| `lernplattformPreWarmKorrektur` | `uebenPreWarmKorrektur` |
| `lernplattformErstelleGruppe` | `uebenErstelleGruppe` |
| `lernplattformLadeGruppen` | `uebenLadeGruppen` |
| `lernplattformLadeGruppenFortschritt` | `uebenLadeGruppenFortschritt` |
| `lernplattformSpeichereAuftrag` | `uebenSpeichereAuftrag` |
| `lernplattformSpeichereFortschritt` | `uebenSpeichereFortschritt` |
| `lernplattformLadeEinstellungen` | `uebenLadeEinstellungen` |
| `lernplattformSpeichereEinstellungen` | `uebenSpeichereEinstellungen` |
| `lernplattformLadeLernzieleV` | `uebenLadeLernzieleV` |
| `lernplattformSpeichereLernziel` | `uebenSpeichereLernziel` |
| `lernplattformLadeThemenSichtbarkeit` | `uebenLadeThemenSichtbarkeit` |
| `lernplattformSetzeThemenStatus` | `uebenSetzeThemenStatus` |
| `lernplattformSpeichereFrage` | `uebenSpeichereFrage` |
| `lernplattformLoescheFrage` | `uebenLoescheFrage` |
| `lernplattformRateLimitCheck` | `uebenRateLimitCheck` (intern) |
| `lernplattformGeneriereCode` | `uebenGeneriereCode` |

(Vollständige Liste wird in Plan-Phase aus tatsächlichem grep-Ergebnis erweitert.)

### Phase 3: Sheet-Name-Prefix + Cleanup

| Stelle | Änderung |
|---|---|
| `apps-script-code.js:8978` | `'Lernplattform: ' + name` → `'ExamLab: ' + name` |
| `ExamLab/apps-script-lernen/` | Komplett-Löschung (3 Files: `lernplattform-backend.js`, `SETUP.md`, `COPY-PASTE-HILFE.md`) |

**Vor Löschung von `apps-script-lernen/`:** SETUP.md + COPY-PASTE-HILFE.md durchlesen und prüfen, ob Setup-Anleitungen relevant sind, die nicht im Hauptbackend dokumentiert sind. Falls ja: Inhalte ins Hauptbackend-Setup übernehmen (z.B. `Google_Workspace_Setup.md`).

### Phase 4: Drive-Aufräum-Brief

Markdown-Datei `ExamLab/docs/drive-aufraum-2026-05-10.md` (User-Action-Brief), enthält:

- **Aktiv verwendete Drive-Sheets** (NICHT LÖSCHEN!):
  - Hauptdaten-Sheet (`FRAGENSAMMLUNG_ID = '1ASSRv7m...'`)
  - Gruppen-Registry (`GRUPPEN_REGISTRY_ID = '1VH7Vu7J...'`)
  - Schul-Configs-Sheet (`CONFIGS_ID`)
  - Pro Familie: Familien-Sheet (`gruppe.fragensammlungSheetId`)
  - Pro Familie: Analytik-Sheet (`analytikSheetId`)
- **Empfehlung für manuelles Sheet-Rename:**
  - `Lernplattform: Gruppen-Registry` → `ExamLab: Gruppen-Registry`
  - Pro Familien-Sheet: `Lernplattform: <Familie-Name>` → `ExamLab: <Familie-Name>`
  - Hauptdaten-Sheet (vermutlich `Fragenbank`) → `ExamLab: Fragensammlung`
  - **Hinweis:** Sheet-IDs ändern sich nicht durch Rename — Backend funktioniert weiter
- **Empfehlung für Löschung:**
  - Altes separates Lernplattform-Apps-Script-Projekt (bei script.google.com unter „Eigene Projekte", erkennbar an Namen wie „Lernplattform Backend" o.ä.)
  - Alte Test-Sheets aus Fusion-Phase
- **User-Verifikations-Schritte:**
  - Nach Sheet-Rename: Apps-Script-URL einmal aufrufen → 0 Errors im Apps-Script-Editor-Log
  - Frontend Üben-Tab öffnen → Login + Themen laden funktioniert

---

## 4. Tests, Verifikation, Risiken

### Verifikations-Layer pro Phase

| Layer | Pro Phase | Anmerkung |
|---|---|---|
| `vitest run` | ✅ | Pflicht-Pass mit drift = 0 (~1523 erwartete Tests laut HANDOFF-Stand) |
| `tsc -b` | ✅ | Pflicht clean |
| `lint:as-any` | ✅ | 0/0/0 |
| `lint:no-alert` | ✅ | 0 |
| `lint:no-tests-dir` | ✅ | clean |
| `lint:musterloesung` | ✅ | Baseline (drift = 0) |
| `vite build` | ✅ | PWA generateSW grün |

### End-Verifikation (Phase 4)

1. **Browser-E2E auf Staging mit echten LP+SuS-Logins** (Memory-Regel `feedback_echte_logins.md`):
   - LP `wr.test@gymhofwil.ch`: Composer öffnen, Vorschau, SuS-Vorschau-Modal
   - SuS `wr.test@stud.gymhofwil.ch`: Üben-Tab, Themen-Karten, eine Frage starten + abgeben
   - 0 Console-Errors aus aktuellem Bundle, alle Carryover-Errors dokumentiert
2. **Apps-Script-Test** (User):
   - Apps-Script-Editor: ein `doPost`-Test-Aufruf mit jedem neuen action-String (z.B. `uebenLadeFragen`) → 0 Errors im Execution-Log
3. **Service-Worker-Cache-Invalidation** (Memory-Pattern `feedback_service_worker_cache_wire_bundle.md`):
   - Vor Browser-E2E: SW-unregister + `caches.delete()` + reload, sonst alter Bundle-Cache vs. neuer Backend-Vertrag

### Audit-Pre-Cut Phase 2 (Memory-Lehre `feedback_grep_anwesenheit_nicht_abwesenheit.md`)

Bevor Phase 2 abgeschlossen wird:
- Vollständiger grep `lernplattform` in `src/` und `apps-script-code.js` muss **0 Treffer** zeigen
- Vollständiger grep `ueben` in den geänderten Test-Mocks muss **die richtigen** Treffer zeigen (Anwesenheit beweisen, nicht Abwesenheit)

### Risiken & Mitigations

| Risiko | Wahrsch. | Schwere | Mitigation |
|---|---|---|---|
| **Wire-Vertrag-Drift** (Frontend deployt mit `ueben*`, Apps-Script noch mit `lernplattform*`) | mittel | hoch (100% Üben-Ausfall) | Apps-Script + Frontend zeitgleich deployen, User-Verifikation Apps-Script-Deploy-Status vor Frontend-Deploy |
| **Browser-Cache-Drift** (User mit altem Frontend trifft neues Backend) | hoch | hoch (100% Üben-Ausfall für gecachten User) | Bundle-ID-Wechsel durch Vite-Build, SW-unregister im Brief, ggf. version.ts-Bump |
| **Vergessene Read-Pfade in Apps-Script** (action-Strings auch in internen Calls, nicht nur `doPost`-Switch) | mittel | hoch (Sub-Endpoint-Bruch) | Vollständiger grep nach `lernplattform` in `apps-script-code.js`, File-für-File-Audit, Memory-Lehre `feedback_backend_read_paths_audit.md` |
| **Test-Mocks veraltet** (`vi.spyOn` / mock-Property auf alten Strings) | hoch | niedrig (Tests grün, aber falsche Coverage) | `vitest run` Pflicht-Pass, manuelle Mock-Inventur Phase 2, grep nach String-Literalen in Tests |
| **Drive-User-Aktion: aktiv genutzte Sheets versehentlich gelöscht** | niedrig | hoch (Datenverlust) | Aufräum-Brief listet **explizit** alle aktiv genutzten Sheets mit „NICHT LÖSCHEN"-Markierung; User-Aktion ist Rename, nicht Delete |
| **`apps-script-lernen/SETUP.md` enthält Anleitungen die nicht in Hauptbackend-Doku sind** | niedrig | niedrig (Doku-Verlust) | Vor Löschung: SETUP.md + COPY-PASTE-HILFE.md lesen, relevante Inhalte in `Google_Workspace_Setup.md` übernehmen |
| **Sub-String-Match bei Mass-Rename** (z.B. `lernplattform` als Teil eines Doku-Strings) | niedrig | niedrig (False-Positive in Comments) | File-für-File-Edit, keine Mass-Replace per sed; word-boundary-grep, jeder Treffer manuell verifiziert |
| **Token-Konflikt mit anderen Stores** (`ueben*` schon belegt, vgl. Memory `feedback_audit_lager_disambiguierung.md`) | niedrig | mittel | Konflikt-Check abgeschlossen: 0 `ueben*`-action-Strings in Apps-Script und Frontend (Audit) ✅ |

### Memory-Lehren die abgedeckt werden

- ✅ `feedback_sorgfalt.md` — Audit → Plan → Umsetzung
- ✅ `feedback_regressionsprevention.md` — Feature-Branch + Impact-Analyse + Pre-Commit-Checklist
- ✅ `feedback_staging_workflow.md` — Staging-Test mit User-Freigabe vor main
- ✅ `feedback_service_worker_cache_wire_bundle.md` — SW-Cache-Invalidation
- ✅ `feedback_backend_read_paths_audit.md` — alle Read-Pfade prüfen
- ✅ `feedback_grep_anwesenheit_nicht_abwesenheit.md` — Anwesenheit beweisen
- ✅ `feedback_audit_lager_disambiguierung.md` — semantischer Audit für Token-Konflikt
- ✅ `feedback_echte_logins.md` — keine Demo-Logins
- ✅ `feedback_hash_verification.md` — Commit-Hashes verifizieren

---

## 5. Definition of Done + Deployment

### DoD pro Phase

**Phase 1 (`fragenbank` → `fragensammlung`):**
- ☐ Alle 10 src/-Files + 6 Apps-Script-Konstanten umbenannt
- ☐ Storage-Drop-Code in [authStore.ts:159](../../../src/store/authStore.ts) entfernt
- ☐ vitest grün (drift = 0), tsc clean, 4× lint clean, build clean
- ☐ grep `fragenbank` in src/ + apps-script-code.js: **0 Treffer**
- ☐ grep `fragensammlung` in geänderten Files: erwartete Anwesenheit verifiziert
- ☐ 1 Commit mit `cleanup:` Prefix
- ☐ Code-Reviewer (Subagent) APPROVED

**Phase 2 (`lernplattform*` → `ueben*`):**
- ☐ ~67 src/-Treffer in 6 Services + 1 Adapter + 3 Stores + 3 Components + Tests umbenannt
- ☐ ~172 Apps-Script-Treffer in `doPost`-Switch + Funktions-Namen umbenannt
- ☐ vitest grün (drift = 0), tsc clean, 4× lint clean, build clean
- ☐ grep `lernplattform` in src/ + apps-script-code.js: **0 Treffer**
- ☐ grep `ueben` in geänderten Files: erwartete Anwesenheit verifiziert (mind. ~30 neue action-Strings)
- ☐ 1 Commit mit `refactor:` Prefix
- ☐ Code-Reviewer APPROVED

**Phase 3 (Sheet-Prefix + Cleanup):**
- ☐ `'Lernplattform: '` → `'ExamLab: '` in `apps-script-code.js:8978`
- ☐ `apps-script-lernen/`-Ordner gelöscht
- ☐ vitest grün, tsc clean, 4× lint clean, build clean
- ☐ grep `lernplattform`/`fragenbank` (case-insensitive) im gesamten Repo: **0 Treffer** (Restposten-Check)
- ☐ 1 Commit mit `cleanup:` Prefix
- ☐ Code-Reviewer APPROVED

**Phase 4 (E2E + Drive-Brief):**
- ☐ Browser-E2E auf Staging mit echten LP+SuS-Logins ✅
- ☐ 0 neue Console-Errors aus aktuellem Bundle
- ☐ User Apps-Script-Deploy-Test ✅ (mind. 1 `uebenLadeFragen`-Aufruf grün)
- ☐ Drive-Aufräum-Brief committed (`docs/drive-aufraum-2026-05-10.md`)
- ☐ User-Action Drive-Rename ausgeführt (oder explizit verschoben)
- ☐ HANDOFF.md-Eintrag „Bundle Legacy-Naming-Cleanup ✅ MERGED"
- ☐ Memory-Eintrag `project_bundle_legacy_naming_cleanup.md` + Index-Eintrag in MEMORY.md

### Deployment-Reihenfolge

1. **Branch-Anlage:** `refactor/legacy-naming-cleanup` von `main` (Hauptrepo `GYM-WR-DUY/main`) ✅ erfolgt
2. **Phase 1–3 commits** auf Branch
3. **Push Branch → preview** (Force-Push gemäß Memory `feedback_preview_forcepush.md` mit `git log preview ^<local>` Pre-Check)
4. **Staging-Deploy:**
   - User Apps-Script-Deploy → neuer Apps-Script-Code geht live (Hard-Cut)
   - Frontend-Deploy auf Staging via Preview-Branch-Build → neuer Bundle-ID
5. **Service-Worker-Cache-Invalidation** beim ersten Browser-Test (Brief)
6. **Phase 4 Browser-E2E + User-Test Apps-Script** auf Staging
7. **User-Freigabe** nach Staging-Test (Memory-Regel `feedback_staging_workflow.md`)
8. **Merge `refactor/legacy-naming-cleanup` → main**
9. **Production-Deploy:**
   - Apps-Script bleibt auf Staging-Version (= Production-Version, da Hard-Cut zeitgleich)
   - Frontend Production-Deploy via main → Production-Bundle live
10. **HANDOFF + Memory aktualisieren** + git push

### Rollback-Plan

Falls Phase 2 nach Staging-Deploy bricht:
- **Apps-Script:** vorherige Version via Apps-Script-Editor → Versionen → Restore
- **Frontend:** `git revert <commit-Phase-2>` + Push → Auto-Deploy
- Phase 1+3 können auf main bleiben (kein Wire-Vertrag-Wechsel)

### Audit-Trail / Doku

- HANDOFF.md: Bundle-Eintrag im Format der bestehenden Tabelle (Bundle-Name, Datum, Merge-Commit, Effekt, Hotspot-Bilanz, Lehren)
- Memory-File `project_bundle_legacy_naming_cleanup.md` mit:
  - Effekt-Bilanz (Treffer-Reduktion `lernplattform`/`fragenbank` 270 → 0)
  - Architektur-Patterns (Hard-Cut Wire-Vertrag-Wechsel mit Sub-Phasen)
  - Lehren (z.B. ob die Mass-Rename-Strategie funktioniert hat)
- Index-Eintrag in `MEMORY.md` (eine Zeile, < 200 Zeichen)
