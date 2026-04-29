# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Letzter Stand auf main

### Bundle K — Type-Konsolidierung Frage Core + Storage ✅ MERGED

**Merge:** Bundle K auf `main` (Merge-Commit folgt). 16 Commits Feature-Arbeit auf `refactor/type-konsolidierung-frage-core-storage`.

**Geliefert:**
- `packages/shared/src/types/fragen-core.ts` (kanonische Editor-Types in shared, 699 Z.)
- `ExamLab/src/types/fragen-storage.ts` (Storage-Erweiterung mit `WithStorageBase<T>`-Helper, 108 Z.)
- `ExamLab/src/types/auth.ts` re-exportet `Berechtigung`/`RechteStufe` aus `@shared/types/auth`
- Alte `packages/shared/src/types/fragen.ts` + `ExamLab/src/types/fragen.ts` gelöscht
- index.ts re-exportet nur fragen-core (single-export wegen TS2308-Ambiguität bei Dual-Export)

**Cut-Entscheidung umgesetzt:** `berechtigungen`/`geteilt`/`autor` in core (Editor-Felder), nur `_recht`/`poolVersion` storage-only. `tags: string[]` in core, `tags: (string|Tag)[]` in storage. Strukturelles Subtyping erlaubt Storage-Frage als Editor-Input ohne Mapping; an einer Stelle (`PruefungFragenEditor.poolSyncSlot`) Cast am Callback-Boundary nötig.

**E2E-Verifikation auf staging mit echten Logins:**
- LP-Fragensammlung lädt 2363 Fragen, Tags rendern, Filter funktionieren
- MC-Editor öffnet sauber: Pflichtfeld-Outlines violett, Pool-Info-Slot, Sharing-Badge
- prev/next-Navigation synchronisiert (S129-Regel intakt)
- SuS-Üben-Modus: MC-Frage Auto-Korrektur funktioniert, Musterlösung mit C9-Phase-2-Layout
- Privacy: SuS-UI rendert keine Storage-Felder (Pool-Info, Sharing fehlen wie erwartet)

**Lehren aus der Implementation (für künftige Type-Migrationen):**
1. **Audit-Pattern muss Extension- und inline-import-Varianten erfassen** — Phase-0-Audit `from '...types/fragen'` (single-quote-Ende) hat ~95 Files mit `.ts`-Extension verpasst (`from '../types/fragen.ts'`) und alle inline `import('...types/fragen').X`-Type-Expressions. Phase 5 musste die nachziehen. Künftig: Pattern-Set mit `'`, `.ts'`, `.tsx'`, `.js'` UND `import\\(['"`]` einbeziehen.
2. **Doppel-`export *` aus zwei strukturell-identischen Files erzeugt 78× TS2308** — TS resolviert duplicate symbols nicht silent zu „identisch", sondern droppt sie. Plan-Achtung-Fallback (single-export) war richtig.
3. **`fragen-storage` re-exportet via `export type *` Core-Sub-Type-Namen mit Core-Tags** — `MCFrage` etc. aus fragen-storage sind die Core-Variante (string-tags), nicht Storage. Storage-Caller die narrow Sub-Types brauchen, müssen `Extract<Frage, {typ:'mc'}>`-Aliase oder explizite `WithStorageBase<Core.MCFrage>`-Exports nutzen. Dokumentiert in 3 Files (autoKorrektur.ts, fibuAutoKorrektur.ts, KorrekturFrageVollansicht.tsx).
4. **Storage-Felder sind nicht in shared erlaubt** — `poolVersion?: unknown` darf NICHT in fragen-core wieder eingebaut werden, auch wenn ein TS-Fehler an einem Callback-Boundary „nur ein Feld" verlangt. Lösung ist Cast am Callback-Boundary (Spec Risiko-Mitigation #3), nicht Storage-Feld-Leak in Core.

**Tech-Debt aus Code-Review (post-Merge-Bundles):**
- DruckAnsicht.tsx 11 Casts könnten via `alsCoreFrage<T>`-Helper konsolidiert werden
- `Extract<Frage, {typ:'X'}>`-Aliases als zentrale Storage-Sub-Type-Exports in fragen-storage exportieren
- `leereEingabenDetektor.ts` könnte direkt auf `@shared/types/fragen-core` (SuS-Pfad)
- Inline `import('./auth').Berechtigung[]` in FrageSummary auf top-of-file-Import-Style

---

## Aktiv offen

### Kleine Follow-Ups (nicht blockierend)

**G.d.1 Final-Review Follow-Ups** (aus S152):
- `preWarmKorrektur` extrahiert `sessionToken` aus `useUebenAuthStore`, wird aber von LP-Context aufgerufen → expliziter `sessionToken`-Argument wäre klarer
- Network-Error-Test für `preWarmKorrektur` fehlt (6 Cases statt G.a-7)
- `setKorrekturStatus` triggert 3-4× Cache-Invalidierung während laufender `batchKorrektur` — korrekt aber dokumentationswürdig

**autoSave-IDB-Race Restbestände** (S150-Sweep, niedrige Priorität — kein Hard-Nav direkt danach):
- `cleanupNachAbgabe.ts:13` — `clearIndexedDB(...).catch(...)` ohne await
- `App.tsx:180` — `clearIndexedDB`/`clearQueue` bei `durchfuehrungId`-Wechsel

~~**FrageBase-Divergenz** (S159 Spawn-Task M2)~~ → wird durch Bundle K aufgelöst (siehe oben).

### Future Bundles (geplant)

- **Media-Phase-3-5 Dual-Write Migration** — `MediaQuelle`-Type ist in shared definiert (`packages/shared/src/types/mediaQuelle.ts`), aber Apps-Script kennt ihn nicht. Echte Migration ist eigenes Bundle in Bundle-J-Grösse: Backend liest+schreibt beide Formate (`bildUrl`/`pdfBase64` UND `MediaQuelle`), Frontend-Migrator ist bereits da (`mediaQuelleMigrator.ts`). ~3-4 Sessions, Apps-Script-Deploy nötig. Phase 6 (alte Felder weg, Daten-Migration) als separates Bundle danach.
- **`as any`-Cleanup** — 72 Stellen aktuell (von 58 gewachsen), eigenes Hygiene-Bundle, ~1 Session.
- **Backend-Migration weg von Apps-Script** (langfristig, strategisch) — Edge-Runtime / Cloud Run / Cloudflare Workers. Vorbereitend: API-Contract (Zod/JSON-Schema), Endpoint-Inventar, Schema-Doku. Kein konkreter Trigger jetzt, aber Vorarbeit lohnt während anderer Bundles.

### Future / YAGNI (nur falls UX-Feedback negativ)

- Bundle G.f.3 — KorrekturDashboard-Skeleton (eingebettet + standalone) falls G.d.1 Pre-Warm-Cache-Miss-Flash spürbar
- Phase-Komponenten-Skeletons (LobbyPhase / AktivPhase / BeendetPhase intern)
- Doppel-Header-Optik G.e — falls Sticky-Lane-Header parallel zum virtuellen Header sichtbar
- IDB-Verschlüsselung als eigenes Sub-Bundle (separates Threat-Model)

### Backlog (älter, low-priority)

| # | Thema | Notiz |
|---|---|---|
| A2 | KI-Bild-Generator Backend (`generiereFrageBild`-Endpoint) | Frontend steht |
| A3 | KI-Zusammenfassung Audio-Rückmeldungen | Braucht A2 |
| B2 | Audio iPhone — 19s Aufnahme speichert nur 4s | iPhone MediaRecorder |
| B3 | Abgabe-Timeout „Übertragung ausstehend" | Apps-Script Execution Log |
| B4 | Fachkürzel stimmen nicht (PDF-Abgleich mit `stammdaten.ts`) | — |
| V1 | Bilanzstruktur: Gewinn/Verlust-Eingabe | — |
| V3 | Testdaten-Generator für `wr.test` | — |
| V8 | Ähnliche Fragen erkennen (Duplikat-Erkennung) | — |
| T1 | 62 SVGs visuell prüfen (neutrale Bilder erstellt S87) | — |
| T2 | Excel-Import Feinschliff | — |

### Langfristig

- SEB / iPad — SEB deaktiviert (`sebErforderlich: false`)
- Tier 2 Features: Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- TaF Phasen-UI — `klassenTyp`-Feld vorhanden, UI verschoben auf nächstes SJ
- Monitoring-Verzögerung ~28s — Akzeptabel

---

## Letzter Stand auf main

### Bundle J — DnD-Bild Multi-Zone-Datenmodell (S160 + S161)

**Merges:** `eae1cec` (Migration) + `000de2e` (Cleanup) + S161 Apps-Script-Cleanup-Deploy.

- DragDrop-Bild-Datenmodell auf Multi-Zone (`korrekteLabels: string[]` pro Zone) und Multi-Label-Akzeptanz (Synonym-Listen).
- Pool-Tokens als `DragDropBildLabel{id, text}` mit Stack-Counter für Duplikate. Deterministische `stabilId(frageId, text, index)` Cross-Env-Hashes (TS+ESM-Mirror).
- Generic `felder`-Patch am `batchUpdateFragenMigrationEndpoint` (Erweiterung des C9-Endpoints) — nutzbar für künftige Migrationen.
- 28/28 dragdrop_bild-Fragen migriert (5 BWL + 10 Recht + 12 VWL + 1 Demo `einr-dd-kontinente`).
- **Apps-Script 3× deployed:** Phase 4 (LOESUNGS_FELDER + Privacy-Test), Phase 9.0 (generic `felder`-Patch), S161-Cleanup (`pruefeAntwortServer_` Multi-Label-Match).
- **Browser-E2E (S161):** LP+SuS mit echten Logins, Security-Check, kritische Pfade, verwandte Fragetypen, Mobile/iPad Stack-Mechanik geprüft.
- **Lückentext Phase 8 E2E (S161):** Browser-Test mit echten Logins (LP-Pfade Editor + Bulk-Toggle, SuS-Pfade Freitext + Dropdown, Security-Invarianten Network-Tab) abgeschlossen.
- **Tests:** 1098 vitest passes, tsc/build clean.
- **Cleanup auf main** (vorgezogen statt 12.05.): `korrektesLabel?:` aus `DragDropBildZielzone` weg in 3 Type-Files, Dual-Read-Pfade entfernt, `zoneKorrektBelegt`-Helper raus, Demo-Frage `einr-dd-kontinente` aufs neue Format. Scheduled-Task `bundle-j-cleanup-check` deaktiviert.

**Memory-Detail:** `project_s158_bundle_j_specplan.md` (Spec+Plan) · `project_s159_bundle_j_phase_1_8.md` (Phase 1-8) · `project_s160_bundle_j_komplett.md` (Migration+Cleanup) · `project_s161_bundle_j_lueckentext_e2e.md` (E2E+Deploy)

---

## Bundle J Browser-E2E Test-Plan (Referenz für DnD-Bild-Regressionen)

In S161 abgeschlossen — Test-Plan-Details bleiben als Referenz für künftige DnD-Bild-Regressionen.

<details>
<summary>Test-Plan-Details (Referenz)</summary>

### Setup
- Tab-Gruppe mit LP (`wr.test@gymhofwil.ch`) + SuS (`wr.test@stud.gymhofwil.ch`).
- Test-Prüfung: Einrichtungsprüfung mit DnD-Bild-Frage `einr-dd-kontinente`.
- Stichprobe-Migration via `node upload.mjs --ids=<5-10 IDs>` vor dem E2E.

### Zu testende Änderungen

| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|----------|---------------------|-------------------|
| 1 | LP-Editor Multi-Zone-Frage | Bilanz-Schema mit 2× `Aktiva`-Zonen + 2 `Aktiva`-Pool-Tokens speicherbar | Editor crasht bei alten Fragen |
| 2 | LP-Editor Multi-Label | Zone akzeptiert `['Marketing-Mix', '4P']` | Chip-Input verliert Daten |
| 3 | SuS-Stack-Counter | Pool zeigt `Aktiva ×2`, Counter dekrementiert beim Drop | Stack verschwindet falsch |
| 4 | SuS-Korrektur Multi-Zone | 2 `Aktiva`-Tokens in 2 `Aktiva`-Zonen → beide korrekt | Eine Zone fälschlich falsch |
| 5 | Bestand-Frage (vor Mig) | Frage öffnen + lösen wie vorher (Demo-Frage `einr-dd-kontinente`) | Antwort orphaned |
| 6 | Bestand-Frage (nach Mig) | Frage öffnen + lösen wie vorher (1:1-Mapping) | Antwort orphaned |

### Security-Check

- SuS-API-Response: keine `korrekteLabels`, kein `korrektesLabel`.
- SuS-API-Response: `labels` hat `id+text` (IDs sind base32-Hashes).
- LP-API-Response: `korrekteLabels` vollständig (LP-Editor / Korrektur).

### Kritische Pfade (regression-prevention.md §1.3)

- SuS lädt Üben-Modus mit DnD-Frage.
- LP Korrektur-Vollansicht für DnD-Frage.
- LP Druck-Ansicht (`/lp/druck`).
- SuS-Heartbeat speichert `zuordnungen`.
- SuS-Abgabe persistiert.

### Regressions-Tests (verwandte Fragetypen)

- Hotspot, Bildbeschriftung.
- Sortierung, Zuordnung.
- FiBu-Tabellen-Eingabe (Buchungssatz, T-Konto, Bilanz/ER).

### Mobile / iPad-Test (Stack-Touch-Mechanik)

- Tap-to-Select auf Stack `Soll ×3`.
- Tap auf Zone → Counter dekrementiert.
- Bei Counter = 0: Stack verschwindet aus Pool.
- Tap auf platzierten Token → entfernt, Counter +1.
- Touch-Targets ≥ 44×44px.
- `touchAction: 'none'` auf interaktiven Elementen.

</details>

---

## Historie

| Session | Datum | Inhalt | Memory |
|---|---|---|---|
| S161 | ~Apr/Mai 26 | Bundle J Browser-E2E + Lückentext Phase 8 E2E + Apps-Script-Cleanup-Deploy | `project_s161_bundle_j_lueckentext_e2e.md` |
| S160 | 28.04.26 | Bundle J KOMPLETT auf main + Cleanup vorgezogen | `project_s160_bundle_j_komplett.md` |
| S159 | 28.04.26 | Bundle J Phase 1-8 auf Branch | `project_s159_bundle_j_phase_1_8.md` |
| S158 | 28.04.26 | Bundle J Spec + Plan | `project_s158_bundle_j_specplan.md` |
| S157 | 28.04.26 | Bundle H Editor-UX-Feinschliff (Violett-Pflichtfeld + 4 Vereinfachungen + SuS-Tastatur) | `project_s157_bundle_h_phasen_0_4.md` |
| S156 | 28.04.26 | Bundle H Spec + Plan | `project_s156_bundle_h_plan.md` |
| S155 | 27.04.26 | Bundle G.f.2 (Skeleton-Pattern für DurchfuehrenDashboard + FragenBrowser) | `project_s155_bundle_g_f_2.md` |
| S154 | 27.04.26 | Bundle G.e (Fragensammlung-Virtualisierung) + G.f (LP-Startseite Skeleton) | `project_s154_bundle_g_e_f.md` |
| S153 | 27.04.26 | Bundle G.d.2 (IDB-Cache Klassenlisten + Gruppen) | `project_s153_bundle_g_d_2.md` |
| S152 | 27.04.26 | Bundle G.d.1 (4 Hebel: Lobby-Polling, schalteFrei Pre-Warm, Korrektur-Cache, SuS-Warteraum) | `project_s152_bundle_g_d_1.md` · `..._plan.md` |
| S151 | 27.04.26 | Bundle G.d/e/f Specs (4 Specs reviewer-approved) | `project_s151_bundle_g_specs.md` |
| S150 | 27.04.26 | autoSave-IDB-Race-Fix (Folge-Hotfix S149) | `project_s150_autosave_idb_race.md` |
| S149 | 27.04.26 | Bundle G.c (LP-Login Pre-Fetch + Logout-Cleanup, IDB-Race-Hotfix) | `project_s149_bundle_gc.md` |
| S148 | 26.04.26 | Bundle G.b (Editor-Nachbar + Anhang-PDF-Prefetch, frontend-only) | `project_s148_bundle_gb.md` |
| S147 | 26.04.26 | Bundle G.a (Server-Cache-Pre-Warming, 4 Trigger) | `project_s147_bundle_ga.md` |
| S146 | 26.04.26 | Bundle E (Übungsstart-Latenz N=10 cold 4'322ms→1'036ms) + Repo-Cleanup | `project_s146_bundle_e.md` |
| S145 | 24.04.26 | Auth-Session-Restore-Fix (Standalone-Üben-Refresh) | `project_s145_auth_fix.md` |
| S144 | 24.04.26 | Lückentext Phase 7 Migration (253/253 Fragen) | `project_s144_lueckentext_phase7.md` |
| S142 | 24.04.26 | Bildeditor-Bundle + Lückentext-Modus Phase 1-6 | `project_s142_bildeditor_lueckentext.md` · `..._lueckentext_modus.md` |
| S141 | 24.04.26 | Altlasten-Bundle (Audio raus aus Einführung, AdminFragenbank weg, useResizableHandle) | `project_s141_altlasten_bundle.md` |
| S140 | 24.04.26 | Bundle F1 (Probleme-Dashboard) + F2 (Bugfix-Bundle, Audio-Fragetyp deaktiviert) | inline MEMORY.md |
| S137-138 | 23.04.26 | UI/Autokorrektur-Bundle | `project_s137_ui_bundle.md` |

### Archiv (Sessions 20–136)

100+ Sessions komprimiert. Bei Bedarf via `git log` + Memory-Files nachvollziehbar.

| Datum | Sessions | Meilenstein |
|-------|----------|-------------|
| 26.03. | 20–22 | Root-Cause-Fixes, Live-Test Bugfixes, Scroll-Bug |
| 27.03. | 23–29 | 16 Bugfixes, Toolbar-Redesign, Zeichnen-Features, Multi-Teacher Phase 1–4, Sicherheit |
| 28.03. | 30–32 | Plattform-Öffnung für alle Fachschaften, Demo-Prüfung, LP-Editor UX |
| 31.03. | 38–44 | E2E-Tests, Security Hardening, Staging, Workflow-Umstellung |
| 01.04. | 45–49 | Batch-Writes, Request-Queue, Re-Entry-Schutz, 8 neue Pool-Fragetypen |
| 02.04. | 51–53 | Browser-Tests + 75 Pool-Fragen, Bewertungsraster, Lernplattform Design |
| 04.04. | 55–58 | Shared Editor Phase 1–5a (EditorProvider, Typ-Editoren, SharedFragenEditor) |
| 05.04. | 59–64 | Fusion Phase 1–6 (Lernplattform → Prüfungstool), Übungstool A–F, Prompt Injection Schutz |
| 05.–06.04. | 66–67a | ExamLab Overhaul, Performance, Datenbereinigung |
| 07.04. | 68–71 | Tech-Verbesserungen, Lernsteuerung, Navigation, grosses Bugfix-Paket |
| 10.04. | 72–87 | Editor-Crashes, Fragetyp-Korrektur, Navigation, Einstellungen, Stammdaten, Performance, UX-Polish, Druckansicht, Excel-Import, Store-Migration, Favoriten, Bild-Fragetypen Reparatur |
| 11.04. | 88–90 | Improvement Plan S1–S5, Deep Links, Fachkürzel, Performance |
| 12.04. | 91–92 | Code-Vereinfachung (Adapter-Hook Refactoring), Save-Resilienz |
| 13.04. | 93–97 | Browser-Test Bugfixes, FiBu-Fixes, Bild-Upload, Deep Links + React Router |
| 13.04. | 98–104 | UX-Bundles 1–8 (Quick Wins, Favoriten-Redesign, Übungs-Themen, Layout-Umbau, Bildfragen-Editor, Design-System, UX-Harmonisierung) |
| 14.04. | 105–107 | C11+C9+Wording, E1 FiBu-Fix + Feedback-System, Rename Pruefung→ExamLab + Kontenrahmen 2850 |
| 14.–22.04. | 108–136 | C9 Phase 1–4 Migration (2412 Fragen), KI-Kalibrierung, Detaillierte Lösungen |

---

## Architektur (etabliert in S66–S92, weiterhin gültig)

- **Adapter-Hook Pattern:** `useFrageAdapter(frageId)` abstrahiert Prüfungs-/Übungs-Store
- **Fragetypen-Registry:** `shared/fragetypenRegistry.ts` (EINE Kopie, nicht zwei)
- **Shared UI:** `ui/BaseDialog.tsx`, `ui/Button.tsx`
- **Antwort-Normalizer:** `utils/normalizeAntwort.ts`
- **FrageModeContext:** `context/FrageModeContext.tsx`
- **SuS-Navigation:** Kein Start-Screen, direkt Üben-Tab. Tabs „Üben"/„Prüfen" in Kopfzeile.
- **kursId-Format:** `{gefaess}-{fach}-{klassen}` wenn `gefaess≠fach`, sonst `{gefaess}-{klassen}` (ohne Schuljahr)
- **Shared-Editoren:** `packages/shared/src/editor/` auf **Repo-Root**, nicht in ExamLab. Vite-Alias `@shared` mappt von ExamLab via `../packages/shared/src` (S156-Lehre).

## Security (alle erledigt ✅)

- Rollen-Bypass → `restoreSession()` validiert E-Mail-Domain
- Timer-Manipulation → Server-seitige Validierung
- Rate Limiting → 4 SuS-Endpoints (10–15/min)
- Cross-Exam Token Reuse → verhindert
- Prompt Injection → Inputs in `<user_data>` gewrappt
- Session-Lock → Neuer Login invalidiert alten Token
- IDB-Privacy nach Logout → `tx.oncomplete`-await vor Hard-Nav (S149-Lehre)
