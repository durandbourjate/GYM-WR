# Bundle T — Mittel-Risiko-Hooks-Splits (Master-Spec)

**Datum:** 2026-05-06
**Status:** Draft (vor Spec-Review)
**Bezug:** [`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md), Section A3 (Hotspots Mittel-Risiko) + Roadmap Phase 3

## 1. Kontext

ExamLab-Vereinfachungs-Audit identifiziert 17 Files >500 Zeilen, davon 5 niedrig-Risiko (Bundle S, gemerged), 6 mittel-Risiko mit Hook-Extraktion (Bundle T, dieses Dokument), 3 hoch-Risiko (Bundle U, später). Bundle S hat das Folder-Pattern für Strategy-Extraktion etabliert (846 → ~400 Z. main per Sub-File-Pattern). Bundle T überträgt das Prinzip auf Komponenten-State: useState/useMemo/useEffect/useRef-Cluster werden in fokussierte Custom-Hooks extrahiert.

Phase-3-Roadmap-Vorgabe: T-Erfahrung **vor** Bundle U (PDFSeite-Hoch-Risiko). Bundle P-Doku (musterloesung Field-Drift, Doku-Variante) wurde am 06.05.2026 gemerged; die optionale P-Migration (Daten-Migration im Sheet) bleibt nach Bundle T für eine eigene Sitzung.

## 2. Ziel

Die 6 Mittel-Risiko-File-Hotspots per Hook-Extraktion in fokussierte Custom-Hooks zerlegen, **ohne Verhaltensänderung**. Hotspot-Bilanz pro Sub-Bundle in der writing-plans-Phase festgelegt; übergreifendes Ziel: alle 6 Files **deutlich unter ihre heutige Zeilenzahl** (Richtschnur: <500 Z. wo machbar, <600 Z. minimum für die hoch-komplexen).

## 3. Scope

### In Scope

| Sub | File | heute | Risiko | Audit-Hook-Hypothese |
|---|---|---:|---|---|
| **T.a** | `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` | 677 | mittel | Phasen-+URL-State-Hook (Naming pro writing-plans, NICHT `useMonitoringData` wegen Kollision mit `usePruefungsMonitoring`) |
| **T.b** | `ExamLab/src/components/fragetypen/TKontoFrage.tsx` | 763 | mittel | `<KontoEingabeForm>` + lokal `tkontoUtils.ts` |
| **T.c** | `ExamLab/src/components/lp/fragensammlung/FragenBrowser.tsx` | 768 | mittel | `useFragenFilterEngine`, `useFragenEditorSync` |
| **T.d** | `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` | 804 | hoch | `useTextOverlay`, `useCanvasSetup`, ggf. `useStiftRendering` + `useDebounce` |
| **T.e** | `ExamLab/src/components/ueben/Dashboard.tsx` | 930 | hoch | `useLernpfadData`, `useThemenKomputationen`, `<FachSektion>` |
| **T.f** | `ExamLab/src/components/lp/LPStartseite.tsx` | 1043 | hoch | `useConfigFiltering`, `useFavoriten`, `useLetzteAktivitaet`, ggf. `<DashboardContentLayout>` (YAGNI-Kandidat) |

Reihenfolge **Risiko-aufsteigend** (T.a → T.f), damit aus mittel-Risiko-Sub-Bundles Pattern-Erfahrung in die hoch-Risiko-Sub-Bundles fliesst.

### Out of Scope

- Verhaltensänderungen (Rendering, Datenfluss, Side-Effects bleiben byte-identisch beobachtbar)
- Bundle-U-Files: `PDFSeite.tsx`, `useDrawingEngine.ts`, `uebungsStore.ts` (eigenes Bundle)
- Apps-Script / Backend / Wire-Vertrag-Änderungen
- `musterlosung`-Feld-Migration (Bundle P-Migration, separat)
- `HilfeSeite.tsx` (906 Z., Audit empfiehlt `React.lazy`-Strategie statt Hook-Extraktion — eigenes Mini-Bundle falls gewollt)
- Test-Coverage-Aufbau für untestete Bestandskomponenten
- Konvergenz Pruefen/Üben-Fragetypen (Adapter-Hook-Pattern aus 2026-04-12-Plan, separat falls je gewünscht)

## 4. Architektur-Konvention (für alle 6 Sub-Bundles)

### 4.1 Hook-Ablage

Etablierte Konvention beibehalten:

| Bereich | Pfad | Naming |
|---|---|---|
| LP-Bereich | `src/hooks/useLP*` (flach) | `useLPNavigation`, `useLPRouteSync`, neu z.B. `useLPConfigFiltering`, `useLPFavoriten` |
| Üben-Bereich | `src/hooks/ueben/` | `useSuSNavigation`, `useUebenKontext`, neu z.B. `useLernpfadData`, `useThemenKomputationen` |
| Fragetyp-spezifisch | File-lokal (Sub-Folder oder Util-File neben Komponente) | `src/components/fragetypen/zeichnen/useTextOverlay.ts`, `src/components/fragetypen/tkonto/tkontoUtils.ts` |
| Cross-cutting Utility | `src/hooks/` (flach, kein Prefix) | `useDebounce`, `useFocusTrap`, `useViewport` (existing) |

`useDebounce` (heute inline in ZeichnenCanvas.tsx) wird in T.d als cross-cutting Utility nach `src/hooks/useDebounce.ts` ausgelagert.

### 4.2 Test-Strategie (Hybrid)

| Hook-Charakter | Test-Pflicht |
|---|---|
| Pure Datenkomputation (Memo-Filter, Aggregation) | **JA** — Vitest, co-located (`useFoo.ts` + `useFoo.test.ts`) |
| Pure State-Maschine (Open/Close, Toggle, Sortierungs-Persistenz) | **JA** — Vitest, co-located |
| Wrapper über Browser-API (RAF, ResizeObserver, IndexedDB) | **NEIN** — Browser-E2E-only |
| Async-Store-Orchestration (mehrere awaitable store-Calls) | **NEIN** — zu komplex zu mocken, Browser-E2E reicht |

Co-Location: bevorzugte Test-Position direkt neben dem Hook-File. Bestehende Tests in `src/tests/` werden **nicht** verschoben (out-of-scope-Migration).

### 4.3 Pre-Audit-Tiefe

| Risiko | Pre-Audit |
|---|---|
| mittel | nur Audit-Hypothese in Master-Spec; volles Inventar erst in writing-plans-Phase pro Sub-Bundle |
| hoch | Mini-Pre-Audit in dieser Master-Spec (Sektion 5), volles Inventar weiterhin in writing-plans |

### 4.4 Definition of Done (pro Sub-Bundle, Bundle-S/L-Standard)

- `npx vitest run` grün — drift=0 oder mit dokumentierten neuen Hybrid-Tests
- `npx tsc -b` clean — keine Type-Errors
- `npm run lint:as-any` clean — kein neues `as any` (existing CI-Gate)
- `npm run lint:no-alert` clean (Bundle-R-Gate)
- Browser-E2E auf staging mit **echten Logins** (LP + SuS, je nach Bereich) — Demo-Modus reicht NICHT (Lehre `feedback_echte_logins`)
- Service-Worker-Cache-Flush vor E2E falls Wire-Vertrag berührt (für T unwahrscheinlich, aber Sicherheits-Routine)
- Code-Reviewer-Subagent APPROVED
- Memory-Update mit Lehren

## 5. Mini-Pre-Audit hoch-Risiko-Files (Working Hypothesis)

### 5.1 T.d — ZeichnenCanvas.tsx (804 Z., hoch-Risiko)

**State-Inventar (gegrept 2026-05-06, vollständig):**
- 18× `useRef`: `canvasRef`, `containerRef`, `onTextCommitRef`, `textInputRef`, `textOverlaySichtbarRef`, `letzterPunktRef`, `stiftBufferRef`, `stiftMetaRef`, `rafIdRef`, `stiftAktivRef`, `renderMitPreviewRef`, `exportiereRef`, `onPNGExportRef`, `onDatenChangeRef`, `serializiereRef`, `textOverlayGeoeffnetRef`, `timerRef` (in inline-`useDebounce`) — und einige weitere Engine-Sync-Refs
- 5× `useCallback`: `starteStiftRendering`, `stoppeStiftRendering`, `textAbschliessen`, `handleStart`, `handleMove`, `handleEnd`
- 1 inline `useDebounce`-Helper (Z. 88–101)

**Cut-Hypothese:**

| Hook | Verantwortung | Test-Hybrid |
|---|---|---|
| `useDebounce` (cross-cutting → `src/hooks/useDebounce.ts`) | Generischer Debounce-Wrapper | **JA** (pure timer-Logic, fake-timers) |
| `useTextOverlay({ onCommit })` | textInput*-Refs, textOverlaySichtbar/Geoeffnet, iOS-Focus-rAF, `textAbschliessen` | **JA** (overlay-state-machine ist pure-genug; iOS-rAF-Fall via Browser-E2E) |
| `useCanvasSetup({ canvasConfig, hintergrundbild })` | `canvasRef`, `containerRef`, `berechneDimensionen`, ResizeObserver | **JA** (dimension-helper pure; ResizeObserver-Wrap via Browser-E2E) |
| `useStiftRendering({ engine })` | `stiftBufferRef`, `stiftMetaRef`, `rafIdRef`, `stiftAktivRef`, `starteStiftRendering`, `stoppeStiftRendering` | **NEIN** (RAF-Loop, Browser-E2E-only) |
| Pointer-Handler (`handleStart/Move/End`) | bleiben in `ZeichnenCanvas.tsx` als Komposition der 3 Hooks | — |

**Risiken:**
- iOS-Focus-rAF in `useTextOverlay` ist fragil — Browser-E2E auf iPad-Simulator notwendig (Bundle-S/L-Standard)
- `useDrawingEngine` (Bundle U Hoch-Risiko, 752 Z.) wird in T.d **nicht** angefasst, nur referenziert
- ZeichnenCanvas exportiert `onEngineActions`-Prop — der externe Vertrag bleibt

**Audit-Vorschlag „useTextOverlay" + „useCanvasSetup" wird übernommen,** `useStiftRendering` als 3. Cut hinzugefügt aufgrund der State-Inventur.

### 5.2 T.e — Dashboard.tsx Üben (930 Z., hoch-Risiko)

**State-Inventar (gegrept 2026-05-06, vollständig nach Reviewer-Hinweis):**
- 14× `useState`:
  - **Daten + Persisted UI**: `alleFragen`, `laden`, `alleThemenAnzeigen`, `eingeklappteFaecher` (Set, mit localStorage), `sortierung` (mit localStorage)
  - **Dashboard-Navigation**: `dashboardTab` (themen/fortschritt/ergebnisse), `aktiverFach`, `aktivesThema`, `lzMiniModal`, `mixDialogOffen`
  - **Filter-Cluster** (innerhalb Themen-Detail-Ansicht): `suchtext`, `unterthemaFilter` (Set), `schwierigkeitFilter` (Set), `typFilter` (Set)
- 8× `useMemo`: `themenMap`, `verfuegbareFaecher`, `sichtbareThemenListe`, `letzteUebungProThema`, `themenSektionen`, `themaDetail`, `gefilterteFragen`, `empfehlungen`
- 1× `useRef`: `deepLinkVerarbeitet`
- 9 Stores referenziert: `useUebenAuthStore`, `useUebenGruppenStore`, `useUebenUebungsStore`, `useUebenFortschrittStore`, `useUebenAuftragStore`, `useUebenNavigationStore`, `useThemenSichtbarkeitStore`, `useUebenSettingsStore`, `useUebenKontext`-Hook

**Cut-Hypothese (überarbeitet — 4 Hooks/Komponenten-Splits):**

| Hook / Komponente | Verantwortung | Test-Hybrid |
|---|---|---|
| `useLernpfadData({ user, gruppe, themenSichtbarkeit })` (`src/hooks/ueben/`) | `ladeFragen` + `ladeFortschritt` + `ladeAuftraege` + `ladeFreischaltungen`, Loading-State, preWarm-Trigger | **NEIN** (4× store-async-Orchestration, Mocking-Aufwand > Wert) |
| `useThemenKomputationen({ alleFragen, fortschritte, sortierung, eingeklappteFaecher, freischaltungen, lernziele, sichtbareFaecher, auftraege })` (`src/hooks/ueben/`) | 8 useMemo's: `themenMap` + `verfuegbareFaecher` + `sichtbareThemenListe` + `letzteUebungProThema` + `themenSektionen` + `themaDetail` + `gefilterteFragen` + `empfehlungen` | **JA** (pure Datenkomputation, Decision-Tree gut testbar) |
| `useFragenFilter({ themenFragen })` (`src/hooks/ueben/`) ODER `<FragenFilterPanel>` (Komponenten-Split) | Filter-Cluster: `suchtext` + `unterthemaFilter` + `schwierigkeitFilter` + `typFilter` + Filter-Anwendung. **Entscheidung Hook-vs-Komponente in writing-plans T.e** je nach Coupling mit ThemaDetail-Render. | **JA** falls Hook (pure Filter-Logik) |
| `<FachSektion>` (Komponenten-Split, gleicher Folder oder `ueben/dashboard/`) | `eingeklappteFaecher`-pro-Fach + ThemaKarten-Render + Empfehlungs-Rendering | **NEIN** (UI-Component, Browser-E2E reicht) |

UI-State `dashboardTab`, `lzMiniModal`, `mixDialogOffen`, `aktiverFach`, `aktivesThema` bleibt im Dashboard-Body — keine Hook-Migration für reinen Tab-/Modal-State.

**Risiken:**
- 5 useEffect-Aufrufe mit Inter-Deps (Reihenfolge: erst Fragen laden, dann preWarm) — Reihenfolge muss in `useLernpfadData` exakt erhalten bleiben (Lehre `feedback_memo_deps_trigger_vs_compute`)
- localStorage-Keys (`examlab-ueben-fach-collapsed`, `examlab-ueben-sortierung`) bleiben in `eingeklappteFaecher`/`sortierung`-State — keine Hook-Migration für UI-State

### 5.3 T.f — LPStartseite.tsx (1043 Z., hoch-Risiko)

**State-Inventar (gegrept 2026-05-06):**
- 12× `useMemo`: `aktiverKurs`, `verfuegbareFachbereiche`, `verfuegbareGefaesse`, `summativeConfigs`, `gefilterteConfigs`, `formativeConfigs`, `gefilterteUebungen`, `favoritenConfigIds`, `favoritenConfigs`, `favoritenPruefungen`, `favoritenUebungen`, `letzteFuenf`
- Wrapper-Pattern: `LPStartseite` (Dispatcher per URL-Query) + `LPStartseiteInner` (Hauptkomponente, alle Hooks)
- 6 Stores: auth, ueben/gruppen, fragensammlung, stammdaten, lpUI, favoriten
- 6 Lazy-Komponenten via `lazyMitRetry`

**Cut-Hypothese:**

| Hook / Komponente | Verantwortung | Test-Hybrid |
|---|---|---|
| `useLPConfigFiltering({ configs, kursId, fachbereich, gefaess, suche })` (`src/hooks/`) | `verfuegbareFachbereiche` + `verfuegbareGefaesse` + `summativeConfigs` + `gefilterteConfigs` + `formativeConfigs` + `gefilterteUebungen` (6 useMemo's) | **JA** (pure-Datenfilterung) |
| `useLPFavoriten({ configs, favoritenIds })` (`src/hooks/`) | `favoritenConfigIds` + `favoritenConfigs` + `favoritenPruefungen` + `favoritenUebungen` | **JA** (pure Set-Komputation) |
| `useLPLetzteAktivitaet({ tracker, configs })` (`src/hooks/`) | `letzteFuenf` (last-5 Sortierung) | **JA** (pure Sortierung) |
| `<DashboardContentLayout>` (Komponenten-Split) | **YAGNI-Kandidat:** nur extrahieren, falls die 3 Hooks oben das File **nicht** unter den Ziel-Wert bringen | **NEIN** (UI-Component) |

**Risiken:**
- Wrapper-Pattern (Dispatcher + Inner) **bleibt** — keine Hook-Order-Brüche durch URL-Wechsel zwischen Multi-/Single-Durchführung und Dashboard
- `useEinrichtungSync` aus Audit-Vorschlag: Demo-Modus-Setup mit `einrichtungsPruefung`/`einrichtungsFragen`/`einrichtungsUebung`/`einrichtungsUebungFragen` — in writing-plans verifizieren, ob Hook oder useEffect, und ob YAGNI

## 6. Mittel-Risiko-Files (Audit-Hypothese, ohne Pre-Audit)

### 6.1 T.a — DurchfuehrenDashboard.tsx (677 Z.)

Audit-Vorschlag `useMonitoringData` ist **ungeeignet wegen Naming-Kollision** mit existierendem `usePruefungsMonitoring` (SuS-Auto-Save/Heartbeat während Prüfung — komplett anderer Bereich). In writing-plans alternativen Namen festlegen, z.B. `useDurchfuehrenPhasenState`, `useDurchfuehrungUrlSync` oder thematisch zugeschnitten. Hauptrisiko: Phase-State (Vorbereitung/Aktiv/Korrektur) muss synchron mit URL bleiben.

### 6.2 T.b — TKontoFrage.tsx (763 Z.)

Audit-Vorschlag: `<KontoEingabeForm>`-Komponenten-Split + `tkontoUtils.ts`-Util-Datei (file-lokal). Pure-Logic-Verdacht: Saldo-Decimal-Berechnung. Test-Hybrid für `tkontoUtils.ts` (sehr empfehlenswert wegen Decimal-Präzisions-Risiko).

### 6.3 T.c — FragenBrowser.tsx (768 Z.)

Audit-Vorschlag: `useFragenFilterEngine` + `useFragenEditorSync`. Hauptrisiko: AutoSave-Coupling — `useFragenAutoSave` (existing) wird im Browser benutzt, beim Hook-Cut darf der AutoSave-Trigger nicht aufgespalten werden. In writing-plans verifizieren, dass `useFragenEditorSync` keine AutoSave-State-Race verursacht (Lehre `feedback_destructive_action_cancel_pending` aus Bundle 3).

## 7. Risiko-Strategie (übergreifend)

| Risiko | Mitigation |
|---|---|
| Hook-Order-Brüche bei URL-Wechsel | Wrapper-Pattern (Dispatcher + Inner) erhalten, wo bereits etabliert (LPStartseite, ggf. Dashboard) |
| useEffect-Reihenfolge bricht (Inter-Deps) | Pro-File `useEffect`-Sequenz dokumentieren in writing-plans, Implementer-Subagent muss Sequenz übernehmen |
| Memo-Deps-Drift bei Trigger-vs-Compute | Bei Cut prüfen: useMemo wird Trigger oder Compute (Lehre Bundle 3 hotfix#1, `feedback_memo_deps_trigger_vs_compute`) |
| iOS-Canvas-Focus-rAF bricht | Browser-E2E auf iPad-Simulator nach T.d (Bundle-S/L-Standard) |
| Auto-Save-Race bei FragenBrowser | E2E mit Antwort-Eingabe + Tab-Switch + Reload — verifizieren dass Antworten persistiert sind |
| Service-Worker-Cache nach Bundle | Vor jedem E2E SW-unregister + caches.delete + reload (Lehre `feedback_service_worker_cache_wire_bundle`, auch bei nicht-Wire-Bundles als Routine) |
| Subagent-Branch-Drift | Branch-Setup explizit im Subagent-Prompt + remote pushen vor Folge-Subagents (Lehre `feedback_subagent_shell_context`) |

## 8. Roadmap

### 8.1 Pro-Sub-Bundle-Ablauf

1. Brainstorm-leichter Pass (writing-plans-Skill) → Spec für Sub-Bundle (kompakt) + Plan
2. Branch von `main`: `feature/bundle-t-<sub>-<file-kurzname>` (z.B. `feature/bundle-t-a-durchfuehren-dashboard`)
3. executing-plans-Skill mit Implementer-Subagent (Bundle-S/L-Pattern)
4. tsc/vitest/lint-Gates lokal grün
5. Browser-E2E auf staging mit echten Logins
6. Code-Reviewer-Subagent APPROVED
7. Merge auf main, Branch lokal+remote löschen
8. Memory-Update + HANDOFF-Eintrag

### 8.2 Reihenfolge

T.a (DurchfuehrenDashboard) → T.b (TKonto) → T.c (FragenBrowser) → T.d (ZeichnenCanvas) → T.e (Dashboard-Üben) → T.f (LPStartseite)

Risiko-aufsteigend: Pattern aus mittel-R-Files (T.a/T.b/T.c) fliesst in hoch-R-Files (T.d/T.e/T.f).

### 8.3 Pause-Punkte

Nach **T.c** (3 von 6 erledigt) Empfehlung für Zwischen-Reflexion: hat sich das Hook-Naming bewährt? Sollte die Test-Hybrid-Schwelle nachjustiert werden? — entweder Master-Spec ergänzen oder einfach in T.d–T.f anwenden.

Nach **T.f** (Bundle T komplett): Memory-Bilanz, dann Phase-3-Wahl P-Migration vs. Bundle U.

## 9. Erfolgskriterien

- 6/6 Sub-Bundles auf main gemerged mit grünen Gates
- alle 6 Files **deutlich** unter heutiger Zeilenzahl, idealerweise <500 Z. (LPStartseite ggf. <600 Z. wegen Dispatcher-Wrapper)
- Pure-Logic-Hooks haben Vitest-Coverage
- Browser-E2E mit echten Logins für jeden Hoch-Risiko-Sub-Bundle (T.d–T.f) bestanden
- Hotspot-Bilanz aktualisiert (Memory + Audit-Doc)

## 10. Rückblick-Hinweis

Das ältere Plan-Dokument `Pruefung/docs/superpowers/specs/2026-04-12-examlab-code-vereinfachung-design.md` (Adapter-Hook-Pattern, BaseDialog, Antwort-Typ-Konvergenz) ist inhaltlich **orthogonal zu Bundle T** und liegt seit 12.04. unbearbeitet. Der grosse Refactor dort wurde durch die Bundles M–S in kleinere, risikoärmere Schritte zerlegt. Bundle T hat keinen Bezug zu jenem Plan und ersetzt ihn nicht.
