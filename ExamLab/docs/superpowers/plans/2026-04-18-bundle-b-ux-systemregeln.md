# Bundle B — UX-Systemregeln Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vier UX-Systemregeln aus User-Test 17.04.2026 umsetzen — globaler Zurück-Button, kein Page-Reload-Gefühl bei Settings/Hilfe, Auto-Scroll bei Tab-Overflow, einheitliche Tab-Component überall.

**Architecture:** Erweiterung der bestehenden Komponenten — kein Architektur-Schnitt. Nutzt vorhandenes `AppHeader` (S114), `TabBar` (`ui/TabBar.tsx`), `ResizableSidebar` (S109).

**Tech Stack:** React 19 + TypeScript + React Router v6 + Zustand + Tailwind v4 + Vitest

**Branch:** `feature/bundle-b-ux-systemregeln` (bereits erstellt von main, leer)

**Voraussetzung:** Bundle A (`feature/ueben-zwischenstand-flow`) ist auf main gemergt. Vor B-Start: rebase auf aktuelle main.

---

## File Structure

| Datei | Rolle | Status |
|---|---|---|
| `ExamLab/src/components/shared/header/AppHeader.tsx` | Globaler Zurück-Button im Header (auch ohne `onZurueck` Prop) | modify |
| `ExamLab/src/hooks/useGlobalZurueck.ts` | Hook: liefert `() => navigate(-1)` mit Fallback auf Default-Route pro Rolle | **create** |
| `ExamLab/src/hooks/useTabAutoScroll.ts` | Hook: Maus-nahe-Rand-basiertes Auto-Scroll für horizontalen Container | **create** |
| `ExamLab/src/hooks/useTabAutoScroll.test.ts` | Vitest mit fake mouse-events | **create** |
| `ExamLab/src/components/ui/TabBar.tsx` | Eingebauter Auto-Scroll für Overflow | modify |
| `ExamLab/src/components/shared/header/TabKaskade.tsx` | Auto-Scroll für L1/L2/L3 wenn Overflow | modify |
| `ExamLab/src/components/settings/EinstellungenPanel.tsx` | Sicherstellen: Öffnen ohne Page-Reload-Gefühl (Datenfetches debouncen) | modify (evtl.) |
| `ExamLab/src/components/lp/HilfeSeite.tsx` | Selbiges für Hilfe | modify (evtl.) |
| `ExamLab/src/router/Router.tsx` | `/einstellungen` und `/einstellungen/:tab` ggf. ersetzen oder anders auflösen | modify (evtl.) |
| `ExamLab/src/store/lpUIStore.ts` | Settings-State persistent unabhängig von URL-Wechsel | modify (evtl.) |

**Verworfen (Scope):**
- Animation/Transition für Settings-Open (separater Polish-Pass)
- Touch-/Swipe-Gesten zum Tab-Scrollen (später, wenn iPad-Test ergibt dass nötig)
- Page-Transitions zwischen Routes (Performance-Risiko, eigene Diskussion)

---

## Task 1: Audit Page-Reload-Gefühl

**Files:** keine — Investigation

**Rationale:** User-Bericht: "häufig lädt die ganze seite neu bei einem klick. z.b. wenn ich die einstellungen öffne, müsste ja die headbar und die aktuell aktive seite bleiben". Bevor Code geändert wird: belegen WAS genau passiert.

- [ ] **Step 1.1: Im Browser mit echten Logins testen**

LP-Tab in Chrome-in-Chrome. Performance-Recording:
1. Auf `/favoriten` einloggen
2. Performance starten
3. ⋮-Menü → Einstellungen klicken
4. Performance stoppen
5. Prüfen: gibt es ein vollständiges Re-Render der Route oder nur das Settings-Panel?

Wenn vollständiges Re-Mount (LPStartseite-Mount log mehrfach): das ist der Bug.

- [ ] **Step 1.2: Memory-Beobachtung**

Zustand-Stores prüfen: werden `gruppen`, `configs`, `fragenbank` neu gefetcht beim Settings-Öffnen? Falls ja: Cache-Invalidation prüfen.

- [x] **Step 1.3: Findings dokumentieren**

## Audit-Findings (Task 1) — 18.04.2026

**Root Cause:** Inkonsistentes Öffnen der Einstellungen in zwei Code-Pfaden:
- `Favoriten.tsx:54` ruft `navigiereZuEinstellungen()` → `navigate('/einstellungen')` → Router wechselt von `/favoriten` (Element `<FavoritenFlow>`) zu `/einstellungen` (Element `<LPFlow>`) → Favoriten unmountet, LPStartseite mountet neu.
- `LPStartseite.tsx:344` ruft `toggleEinstellungen()` (Store-Flag) → kein Route-Wechsel → ResizableSidebar-Overlay erscheint ohne Remount.

`EinstellungenPanel.tsx:64` nutzt bereits `<ResizableSidebar mode="overlay">` — Design ist korrekt, nur der Einstieg aus Favoriten ist kaputt.

**Weitere Beobachtungen:**
- `Router.tsx:127–128`: `/einstellungen` + `/einstellungen/:tab` sind separate Routen (Sibling von `/favoriten`). Bookmark-Fähigkeit war vermutlich Absicht.
- `useLPRouteSync.ts:17–24`: URL→Store-Sync setzt `setZeigEinstellungen(true, tab)` wenn pathname mit `/einstellungen` anfängt — nach dem Remount.
- Hilfe und Fragensammlung haben vermutlich ein analoges Muster (TODO in Task 4 prüfen).

**Fix-Plan (minimal-invasiv) für Task 4:**
1. `Favoriten.tsx` + andere Einstiegspunkte nutzen `toggleEinstellungen(tab?)` statt `navigate('/einstellungen')`.
2. `/einstellungen` und `/einstellungen/:tab` Routen in `Router.tsx` entfernen. Alternativ Redirect auf `/favoriten` + `toggleEinstellungen(tab)` via Effect, damit bestehende Bookmarks nicht brechen.
3. `useLPRouteSync.ts` URL-Sync für `/einstellungen` entfernen (Store ist jetzt Quelle der Wahrheit).
4. Analog für `/hilfe`/`/fragensammlung` prüfen und vereinheitlichen.

**Browser-Verifikation:** später auf Staging mit echten Logins — Performance-Recording vor/nach wenn User verfügbar.

---

## Task 2: Globaler Zurück-Button

**Files:**
- Modify: `ExamLab/src/components/shared/header/AppHeader.tsx`
- Create: `ExamLab/src/hooks/useGlobalZurueck.ts`

**Rationale:** User: "globaler zurück-button, welcher immer einen schritt zurück führt". Aktuell: `AppHeader` zeigt Zurück-Button nur im Detail-Modus mit `onZurueck` prop.

**Verhalten:**
- Auf Top-Level-Routes (`/favoriten`, `/sus/ueben`, etc.): Zurück-Button **versteckt** (kein sinnvolles Ziel)
- Auf Sub-Routes (z.B. `/pruefung/abc-123`, `/uebung/kurs/xyz`): Zurück-Button **sichtbar** → `navigate(-1)`
- Wenn `history.length <= 1` (Direkter Aufruf via Bookmark): Zurück-Button leitet auf Default-Route der Rolle (`/favoriten` für LP, `/sus/ueben` für SuS)

- [ ] **Step 2.1: useGlobalZurueck-Hook**

```ts
// 10 Z. ungefähr — useNavigate, useLocation, useAuthStore.user.rolle
// Returns: { canGoBack: boolean, goBack: () => void }
```

`canGoBack` = false wenn auf Top-Level-Route. Top-Level-Liste als Konstante.

- [ ] **Step 2.2: AppHeader integrieren**

In `AppHeader.tsx`: wenn `onZurueck` nicht von Parent kommt, fallback auf `useGlobalZurueck`. Button sichtbar wenn `canGoBack`.

- [ ] **Step 2.3: Tests**

Vitest mit MemoryRouter — verschiedene Routes durchspielen.

- [ ] **Step 2.4: Browser-Test**

LP: `/favoriten` (kein Zurück), `/pruefung/X` (Zurück → /favoriten). SuS: `/sus/ueben` (kein Zurück), `/sus/ueben/X` (Zurück → /sus/ueben).

- [ ] **Step 2.5: Commit**

```
B-2: Globaler Zurück-Button im AppHeader
```

---

## Task 3: useTabAutoScroll Hook

**Files:**
- Create: `ExamLab/src/hooks/useTabAutoScroll.ts`
- Create: `ExamLab/src/hooks/useTabAutoScroll.test.ts`

**Rationale:** User: "wenn z.b. eine headbar mehr tabs hat als angezeigt werden können soll wenn die maus in die nähe des randes kommt die tabs scrollen, je näher am rand desto schneller".

**Algorithmus:**
- Container-Ref + horizontal scrollbar
- mousemove-Listener auf Container
- Berechne Distanz von Maus-X zu linkem/rechtem Container-Rand
- Wenn Distanz < `triggerZoneWidth` (z.B. 60px): scroll mit Geschwindigkeit `(1 - distance/triggerZoneWidth) * maxSpeed` pro Frame
- requestAnimationFrame loop, gestoppt wenn Maus aus Trigger-Zone

```ts
useTabAutoScroll(containerRef, {
  triggerZoneWidth: 60,    // px Abstand zum Rand
  maxSpeed: 12,            // px pro Frame bei Maus am Rand
  enabled: true,
})
```

- [ ] **Step 3.1: Hook-Implementation**

Ohne Throttle (rAF macht das natürlich). Cleanup für eventListener + cancelAnimationFrame.

- [ ] **Step 3.2: Tests**

Vitest mit `pointer-events`-fake events. Prüfen dass `scrollLeft` zunimmt bei Maus-rechts-nahe-Rand.

- [ ] **Step 3.3: TabBar integrieren**

In `TabBar.tsx`: `useTabAutoScroll(containerRef)` wenn Overflow horizontal.

- [ ] **Step 3.4: TabKaskade integrieren**

L1/L2/L3 — gleicher Hook.

- [ ] **Step 3.5: Browser-Test**

Mit > 8 Tabs in Header — Maus-nahe-Rand → scrollt automatisch.

- [ ] **Step 3.6: Commit**

```
B-3: useTabAutoScroll-Hook für Header + TabBar + TabKaskade
```

---

## Task 4: Settings/Hilfe öffnen ohne Re-Mount

**Files (abhängig von Task 1 Audit):**
- Möglicherweise: `EinstellungenPanel.tsx`, `HilfeSeite.tsx`, `lpUIStore.ts`, `Router.tsx`

**Rationale:** Aktueller Verdacht — `/einstellungen`-Route triggert URL-Sync der `useLPNavigationStore.zeigEinstellungen` setzt → öffnet Panel. Aber: möglicherweise wird durch URL-Wechsel auch andere Effekte ausgelöst (Daten-Refetch).

**Lösungs-Optionen** (nach Audit entscheiden):
- **A) URL-Sync sauber halten:** Settings-State im Store, URL nur synchronisieren OHNE Daten-Refetches zu triggern.
- **B) Settings ohne URL:** `/einstellungen`-Route entfernen, Settings als reines UI-State (Bookmark-Verlust akzeptiert).
- **C) Settings als Modal:** komplett über App-Layer rendern statt im LPStartseite-Subtree.

- [ ] **Step 4.1: Findings aus Task 1 hier einsetzen**

- [ ] **Step 4.2: Implementation**

Minimal-invasiv die identifizierten Daten-Refetches gating.

- [ ] **Step 4.3: Browser-Verifikation**

Performance-Recording vor/nach. Header + Hauptbereich darf NICHT neu rendern beim Settings-Öffnen.

- [ ] **Step 4.4: Commit**

```
B-4: Settings/Hilfe öffnen ohne Page-Re-Mount
```

---

## Task 5: TabBar überall einsetzen (Audit-Schritt)

**Files:** keine — Audit, evtl. Refactoring

**Rationale:** User: "haben wir noch keine allgemeine design-code für tabs?". Ja — `TabBar.tsx` gibt's. Aber wird sie konsequent überall genutzt?

- [ ] **Step 5.1: Tab-ähnliche Komponenten finden**

```bash
grep -rn "tab\|Tab" ExamLab/src/components --include="*.tsx" \
  | grep -v "TabBar\|test\|stories\|comment" \
  | head -50
```

Identifizieren: welche Komponenten rendern eigene Tab-Logik (eigene buttons in Reihe mit Active-State)?

- [ ] **Step 5.2: Bei jedem Hit:**

- Wenn 1:1 ersetzbar: TabBar einsetzen.
- Wenn nur ähnlich (z.B. Sub-Tabs in Settings die anders aussehen sollen): in Plan dokumentieren als "bewusst andere Variante" oder TabBar erweitern (z.B. variant="compact").

- [ ] **Step 5.3: Refactor pro Komponente**

Branch-intern, ein Commit pro umgestellter Komponente.

- [ ] **Step 5.4: Tests**

Bestehende Komponententests müssen weiterhin grün bleiben. Snapshot-Updates wo nötig.

- [x] **Step 5.5: Commit-Sequenz**

## Audit-Findings (Task 5) — 18.04.2026

TabBar-Adoption ist bereits stark. 5 Konsumenten importieren `TabBar` direkt:
- `lp/vorbereitung/PruefungsComposer.tsx` (Einstellungen/Abschnitte/Vorschau/Analyse)
- `lp/korrektur/KorrekturDashboard.tsx`
- `lp/durchfuehrung/DurchfuehrenDashboard.tsx`
- `settings/EinstellungenPanel.tsx` (Top-Level-Tabs im Settings-Overlay)
- `ueben/admin/AdminSettings.tsx`

Verbleibende "tab-artige" State-Variablen (z.B. `dashboardTab` in `ueben/Dashboard.tsx`) sind **URL-synchronisierter State**, keine eigenen Tab-UIs — die Tab-Optik kommt dort aus `TabKaskade`. Kein Migrations-Kandidat.

**Ergebnis:** Keine Migration nötig in Bundle B. Ausreichend konsistent. Folgenutzen (z.B. `variant="compact"` oder `badge`-Prop) kann später bei konkreter Nachfrage folgen.

**Keine Commits für Task 5 nötig.**

---

## Task 6: Browser-Test (echte Logins, Staging)

Folgt `regression-prevention.md` Phase 3. Test-Plan VOR dem Klicken.

### Test-Plan: B Bundle UX-Systemregeln

| # | Bug aus User-Test 17.04. | Erwartetes Verhalten | Regressions-Risiko |
|---|---|---|---|
| B-2 | Globaler Zurück-Button | Sub-Routes zeigen Zurück-Button, klick = -1 | History-Stack-Verhalten bei direktem Bookmark |
| B-3 | Tab-Auto-Scroll | Maus-rechts-Rand → tabs scrollen nach rechts, schneller je näher | iPad-Touch (kein mousemove → kein Scroll → User scrollt manuell, OK) |
| B-4 | Settings öffnet ohne Reload | Header + Hauptbereich bleiben statisch, nur Sidebar erscheint | Bookmark `/einstellungen/farben` muss noch funktionieren |
| B-5 | TabBar überall | Alle Tab-Reihen sehen identisch aus | Layout-Brüche in Settings/Composer/etc. |

### Security-Check (Phase 4)

- [ ] Globaler Zurück-Button löst keinen Cross-Role-Navigation aus (LP klickt Zurück → bleibt in LP-Bereich)
- [ ] Settings ohne Re-Mount: keine zwischenzeitliche Anzeige sensibler Daten
- [ ] Keine neue localStorage-Persistenz

### Kritische Pfade (aus regression-prevention.md 1.3)

- [ ] Pfad 1 (SuS lädt Prüfung): unverändert — Settings/Header sind LP-relevant, SuS-Flow unangetastet
- [ ] Pfad 4 (LP Monitoring): Header bleibt stehen wenn Settings öffnet — Live-Monitoring darf nicht hängen

---

## Task 7: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] Session 117-Eintrag (oder welche Session-Nummer aktuell ist) mit Stand B
- [ ] Lehre einklappen falls ein neuer Bug-Typ entdeckt wird

---

## Risiken

1. **`/einstellungen`-Route entfernen** würde bestehende Bookmarks brechen. Vor Entfernung: Redirect von alter Route auf neue Lösung.
2. **Auto-Scroll auf iPad/Touch** funktioniert mit mousemove nicht — User-Erwartung muss geklärt werden (Touch-Swipe ist iOS-Standard).
3. **TabBar-Migration** kann sichtbare Layout-Verschiebungen erzeugen wenn alte Tab-Reihen andere Spacing/Größen hatten.
4. **Globaler Zurück-Button** kann irreführend sein wenn History-Stack vom externen Referrer kommt — Fallback auf Default-Route entscheidend.

---

## Quality Checklist (`qualitaet.md`)

- [ ] DRY: useTabAutoScroll-Hook für alle Tab-Container
- [ ] TypeScript strikt: Keine neuen `as any`
- [ ] Konsistenz: Nutzt bestehende `Button`-Komponente
- [ ] LP/SuS-Trennung: useGlobalZurueck respektiert Rolle
- [ ] Light/Dark Mode: keine Style-Regression
- [ ] Mobile/iPad: Auto-Scroll fällt graceful zurück (keine Errors)

---

## Bezug auf Rules

- `regression-prevention.md` — Phase 3 Test-Plan + Phase 4 Security-Check
- `qualitaet.md` — Vor/Während/Nach-Checkliste
- `code-quality.md` — neue Hooks klein halten, keine Selektoren mit `.filter()`
- `design-system.md` — TabBar-Layout konsistent mit AppHeader-Stil
