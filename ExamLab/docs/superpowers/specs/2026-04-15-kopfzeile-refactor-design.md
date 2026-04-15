# Design-Spec — Kopfzeilen-Refactor mit kaskadierenden Tabs

**Datum:** 2026-04-15
**Status:** Draft — zur Review
**Scope:** ExamLab LP + SuS Header (Router-level Komponente)
**Ziel:** Eine einheitliche, platzsparende Kopfzeile mit Tab-Kaskade, globaler Suche und aufgeräumtem ⋮-Menü für alle 4 Ansichten (LP-Prüfen, LP-Üben, SuS-Üben, SuS-Prüfen).

---

## 1 — Problem & Motivation

Heutige Kopfzeile:
- 4 Haupt-Tabs (Favoriten/Prüfen/Üben/Fragensammlung) im `LPHeader`
- Rechts 5 individuelle Header-Buttons (Einstellungen, Hilfe, Feedback-Icon, ThemeToggle, Abmelden) plus einen konditionalen Fragensammlung-Button — unübersichtlich
- Bundle 13 Cluster I hat für LP-Üben bereits eine zweite Tab-Ebene (Durchführen / Übungen / Analyse) plus Kurs-Tabs eingeführt. Die anderen Bereiche (Prüfen, Fragensammlung, SuS) haben dieses Muster nicht — inkonsistent.
- SuS haben keinen einheitlichen Header (wird ad hoc pro Seite gerendert). Design weicht vom LP-Design ab (Hover, Buttons, Tabs).
- Keine globale Suche.

Ziel: Eine kanonische Kopfzeilen-Architektur für LP und SuS, alles in einer Zeile, mit klarer visueller Hierarchie und einer globalen Suche.

---

## 2 — Tab-Kaskade

### 2.1 Ebenen-Modell

Drei Ebenen:
- **L1** = Haupt-Bereich. Immer sichtbar. Klick wechselt Bereich.
- **L2** = Ansicht innerhalb L1. Erscheint inline direkt rechts am aktiven L1. Kleinere Schrift als L1.
- **L3** = Ausgewählter Kontext innerhalb L2 (Kurs, Prüfung). Erscheint als Dropdown direkt rechts am aktiven L2. Nur sichtbar wenn etwas gewählt ist.

**Anordnung (Lesrichtung):**

```
[Favoriten] [Prüfen] [⟪Üben aktiv⟫][·L2-Gruppe·[▾L3 wenn gewählt]] [Fragensammlung] … [Suche] [⋮]
                     ↑ L2+L3 klebt inline am aktiven L1, restliche L1 bleiben rechts sichtbar
```

**L1-Reihenfolge ist fix** (Favoriten · Prüfen · Üben · Fragensammlung). Bei L1-Wechsel verschieben sich die nicht-aktiven L1 horizontal, weil die L2-Gruppe inline eingefügt wird. Der Trade-off (Fitts-Law: Fragensammlung wandert) ist bewusst akzeptiert, weil L1-Wechsel seltener passieren als L2-Nutzung und der Kontext-Bezug zwischen aktivem L1 und seinen L2-Tabs visuell wichtiger ist. Bei Overflow: horizontales Scrollen der Tab-Leiste; Suche und ⋮ bleiben sticky rechts.

### 2.2 Visuelle Hierarchie

- **L1-Tabs:** 13 px, padding 5px/11px, aktiv = violetter Unterstrich + violetter Hintergrund (`bg-violet-50`).
- **L2-Gruppe:** dünner violetter Links-Rand (`border-l-2 border-violet-400`) gruppiert die L2-Tabs visuell an den aktiven L1. L2-Tabs 12 px, aktiv = violetter Unterstrich, etwas blasser als L1.
- **L3-Dropdown:** `border border-violet-300`, weisser Hintergrund, `▾`-Chevron violett. Mehrfachauswahl zeigt zusätzlich `+N`-Pill (`bg-violet-100 text-violet-700`).

### 2.3 L1/L2/L3 pro Rolle und Bereich

| Rolle | L1 | L2 (pro L1) | L3 (Dropdown) |
|---|---|---|---|
| LP | Favoriten | — | — |
| LP | Prüfen | Durchführen, Analyse | Aktive Prüfung(en) — MultiSelect, nur bei `Durchführen`. Analyse: Prüfung als Dropdown, SingleSelect. |
| LP | Üben | Durchführen, Übungen, Analyse | Kurs — SingleSelect, bei `Übungen` und `Analyse`. Bei `Durchführen`: aktive Übung (SingleSelect). |
| LP | Fragensammlung | — | — |
| SuS | Prüfen | Offen, Ergebnisse | — (kein L3). Auswahl einer Prüfung navigiert in Detail-View, kein Tab-Zustand. |
| SuS | Üben | Themen, Fortschritt, Ergebnisse | Kurs — SingleSelect, bei `Themen`. Bei `Fortschritt/Ergebnisse` kein L3 nötig. |

### 2.4 Wording

- Tab-Label "Durchführen" — unabhängig von Modus (Prüfen/Üben) reicht das kurze Wort, Kontext ist durch L1 klar.
- Button "Prüfung starten" / "Übung starten" wird zu "Durchführen" angeglichen.
- "Fragensammlung" behalten (neues Wording ab Bundle 12).

### 2.5 L3-Verhalten

- **Kein L3 sichtbar, wenn nichts gewählt.** Keine Placeholder-Dropdowns.
- **Auswahl passiert primär im Hauptbildschirm** (Klick auf Prüfung/Kurs-Karte). Das setzt die L3-Selektion automatisch und blendet das Dropdown ein.
- **Dropdown** dient zum Wechseln und Schliessen aktiver Selektionen (bei MultiSelect: Checkbox pro Item).
- **MultiSelect** (Prüfen · Durchführen): Eine Prüfung ist "primär" (im Hauptbereich sichtbar), weitere laufen im Hintergrund (Live-Monitoring-Aggregation). Trigger zeigt Name der primären + "+N"-Pill. Trigger-Label wird auf 40 Zeichen begrenzt, danach Ellipsis. "+N"-Pill zählt die nicht-primären aktiven Prüfungen.
  - **Uncheck der primären:** Die nächste aktive (nach Index) wird primär. Sind keine weiteren aktiv: zurück zum Leer-State (kein L3 sichtbar), Hauptbereich zeigt Prüfungs-Liste.
- **SingleSelect** (alle anderen): Ein aktiver Item, Wechsel ersetzt ihn.

### 2.6 Favoriten

Favoriten hat kein L2/L3 (ist eine flache Liste). Klick auf ein Favoriten-Item navigiert direkt in den Ziel-Bereich (z.B. Prüfen · Durchführen · [gewählte Prüfung]) und setzt dort die L3-Selektion.

---

## 3 — Suche

### 3.1 Funktion

- **Global** über Fragen, Prüfungen, Übungen, Themen, Kurse, Pool-Inhalte.
- **Kontext-Priorisierung:** Ergebnisse aus dem aktiven L1+L2+L3-Kontext werden zuoberst gruppiert mit Tag (z.B. `Üben · SF WR 29c`).
- **Treffer-Highlight:** Matches in Titel + Metadaten gelb markiert.
- **Tastatur:** `⌘K` / `Ctrl+K` fokussiert, `↑↓` navigiert, `Enter` öffnet, `ESC` schliesst.

### 3.2 Scope pro Rolle

**Architektur:** Zwei separate Hooks, nicht ein Hook mit Rollen-Flag. Dies verhindert, dass ein vergessener Guard zu Datenleck zwischen Rollen führt.

- **`useGlobalSucheLP()`** — Liest ausschliesslich aus LP-Stores. Vollständiger LP-Datenraum (alle eigenen Prüfungen, alle Fragen der Fragensammlung, alle Pools, alle Kurse).
- **`useGlobalSucheSuS()`** — Liest ausschliesslich aus SuS-Stores. Nur SuS-relevante Daten: eigene Kurse, dort verfügbare (freigegebene) Themen, eigene Prüfungs-Historie mit Freigabe-Status.

**Indexierungs-Blacklist (beide Hooks):** Folgende Felder werden NIE in den Suchindex geschrieben — weder bei LP noch bei SuS:

- `musterlosung`, `korrekt`, `korrekteAntworten`, `bewertungsraster`, `toleranz`, `hinweis`

**Zusätzliche SuS-Guards (`useGlobalSucheSuS`):**

- Nur Prüfungen mit Status `freigegeben` oder `zurueckgegeben` werden indexiert (auch Metadaten wie Titel). Entwürfe, Live-Prüfungen vor Freigabe, zurückgerufene Prüfungen werden ausgeschlossen.
- Nur Themen/Kurse, in denen der SuS Mitglied ist.
- Explizite vitest-Tests, die versuchen, aus SuS-Suche auf LP-exclusive Felder zuzugreifen. Erwartet: leerer Treffer.

### 3.3 Ergebnis-Gruppen (in dieser Reihenfolge)

1. **Im aktiven Kontext** (optional, nur wenn ≥1 Treffer)
2. **Fragensammlung** (Fragen)
3. **Prüfungen**
4. **Themen / Kurse**

Max 5 Items pro Gruppe. Wenn mehr vorhanden: Zeile "N weitere Treffer — Filter verfeinern" (nicht klickbar, kein eigener Suchergebnis-Screen in diesem Refactor).

### 3.4 Layout

- Input: 260 px Grundbreite, auf 360 px bei Fokus/Active.
- Shortcut-Badge rechts im Input bei nicht fokussiertem Zustand (`⌘K`), ersetzt durch `ESC` bei Fokus.
- Dropdown-Panel min 440 px breit, max 420 px hoch mit Scroll.

---

## 4 — ⋮-Menü

### 4.1 Inhalt (LP)

1. **Benutzer** — Name + Rollenbadge (nicht klickbar, nur Info)
2. Einstellungen
3. Dark Mode (Toggle)
4. Hilfe & Anleitungen `⌘/` (plattformneutral, nicht von macOS/Safari belegt; auf Windows/Linux `Ctrl+/`)
5. Feedback senden
6. Abmelden (rote Variante)

**Tastatur-Shortcuts:** Nur `⌘K` (Suche) und `⌘/` (Hilfe) werden unterstützt. Shortcuts werden mit `event.preventDefault()` abgefangen und plattformadaptiv angezeigt (`⌘` auf macOS, `Ctrl` sonst). Kein `⌘,` (Safari-Konflikt), kein `⌘?` (Shift-Abhängigkeit uneinheitlich über Layouts).

### 4.2 Inhalt (SuS)

Identisches Layout, aber:
- Keine "Einstellungen" (SuS hat keine Plattform-Config)
- "Hilfe (SuS)" statt "Hilfe & Anleitungen" — andere Inhalte
- "Problem melden" statt "Feedback senden"
- Rest identisch

### 4.3 Platzierung

Rechts oben, nach Suche. `⋮` als Icon, Panel öffnet per Klick, schliesst bei Outside-Click oder ESC.

---

## 5 — Mobile / Responsive

### 5.1 Viewport ≥ 900 px (Desktop/Tablet)

Einzeilig wie oben beschrieben.

### 5.2 600–899 px (schmales Tablet, Phone Landscape)

Zweizeilig:
- **Zeile 1:** Brand · L1-Tabs · Suche · ⋮
- **Zeile 2:** L2-Gruppe + L3-Dropdown (eingerückt mit Indikator am Ursprungs-L1)

### 5.3 < 600 px (Phone Portrait)

- **Zeile 1:** Brand · L1-Dropdown (zeigt aktiven L1-Namen, Klick öffnet Liste aller L1) · `⌕`-Icon (öffnet Such-Modal) · ⋮
- **Zeile 2:** L2 als scrollbarer Chip-Row + L3-Dropdown inline
- L1-Dropdown enthält L1-Items flach ohne Nesting; L2/L3 werden erst nach L1-Auswahl in Zeile 2 aktualisiert
- Break-Points via `matchMedia` mit `throttle 150ms`, um Flicker bei Rotation zu vermeiden
- Deep-Links zu SuS-Übungen (`/sus/ueben?fach=X`) müssen auf Phone funktionieren

---

## 6 — Komponenten-Architektur

### 6.1 Neue Komponenten (alle in `ExamLab/src/components/shared/header/`)

- `AppHeader.tsx` — Kanonische Kopfzeilen-Komponente (ersetzt `LPHeader`, wird auch von SuS genutzt). Nimmt `rolle: 'lp' | 'sus'` als Prop plus deklarative Tab-Config.
- `TabKaskade.tsx` — Rendert L1+L2+L3 aus der Config. Verwaltet Overflow-Scroll.
- `L3Dropdown.tsx` — Dropdown-Komponente (Single/Multi-Select).
- `GlobalSuche.tsx` — Suchfeld + Ergebnis-Panel. Ruft `useGlobalSuche()` Hook.
- `OptionenMenu.tsx` — ⋮-Menü.

### 6.2 Neue Hooks/Utils

- `useTabKaskadeConfig(rolle)` — Liefert die Tab-Config abhängig von Rolle und aktueller URL.
- `useGlobalSuche()` — Debounced Volltextsuche über Stores (pruefungStore, fragensammlungStore, uebenStore, kurseStore).
- `useL3Selection(l1, l2)` — Lifted State für L3-Auswahl, persistiert pro (L1, L2) in localStorage.

### 6.3 Ersetzungen

- `LPHeader.tsx` — wird `AppHeader` mit Rolle `lp`. Bestehende Props (titel, zurueck, aktionsButtons, breadcrumbs) bleiben kompatibel, aktiviert über `mode="detail"` vs. `mode="dashboard"`.
- `ThemeToggle.tsx` — verliert eigene Platzierung, wird vom `OptionenMenu` intern verwendet.
- `FeedbackButton.tsx` — wird vom `OptionenMenu` verwendet, kein separates Icon mehr in der Header-Leiste.
- `UebenTabLeiste.tsx` (Bundle 13 S113, inkl. 5 vitest-Tests) — Funktionalität wird in `TabKaskade` absorbiert. Datei wird gelöscht, Tests auf `TabKaskade.test.tsx` migriert (gleiche Szenarien: Kurs-Tabs-Rendering, Click-Navigation, localStorage).
- SuS-Seiten (z.B. `SuSStartseite.tsx`, `KorrekturListe.tsx`, `KorrekturEinsicht.tsx`) — inline-Header-Code wird entfernt, `AppHeader rolle="sus"` eingefügt.

### 6.4 Tab-Config-Schema (TypeScript)

```ts
type L1Id = 'favoriten' | 'pruefung' | 'uebung' | 'fragensammlung'
type L3Mode = 'single' | 'multi' | 'none'

interface L3Config {
  mode: L3Mode
  items: Array<{ id: string; label: string; meta?: string }>
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onAddNew?: () => void
  addNewLabel?: string
}

interface L2Tab {
  id: string
  label: string
  onClick: () => void
  l3?: L3Config
}

interface L1Tab {
  id: L1Id
  label: string
  onClick: () => void
  l2?: L2Tab[]
}

interface TabKaskadeConfig {
  l1Tabs: L1Tab[]
  aktivL1: L1Id
  aktivL2?: string
}
```

---

## 7 — Routing-Integration

### 7.1 URL-Schema (ergänzt bestehende Muster)

- `/favoriten`
- `/pruefung` → Default `Durchführen`
- `/pruefung/analyse`
- `/pruefung/:pruefungId` (Durchführen mit aktiver Prüfung)
- `/uebung` → Default `Übungen`
- `/uebung/durchfuehren`
- `/uebung/kurs/:kursId` (bereits in Bundle 13)
- `/uebung/analyse/:kursId`
- `/fragensammlung`
- SuS: `/sus/ueben`, `/sus/ueben/kurs/:kursId`, `/sus/pruefen`, `/sus/pruefen/ergebnisse`

### 7.2 useLPRouteSync / useSuSRouteSync

- `AppHeader` hört auf URL-Änderungen und aktualisiert aktive L1/L2/L3.
- Klicks auf Tabs führen `navigate(...)` aus, nicht direkt Store-Updates (Single Source of Truth = URL).

---

## 8 — Datenfluss & State

- **Tab-Selektion:** URL ist Source of Truth. `useTabKaskadeConfig` leitet Aktiv-Status aus URL ab.
- **L3-Selektion — Precedence:**
  1. URL-Parameter (z.B. `/uebung/kurs/:kursId`) gewinnt immer
  2. Wenn URL keinen L3-Parameter hat, wird `localStorage` (z.B. `examlab-ueben-letzter-kurs`) gelesen und die URL entsprechend ergänzt (`navigate(..., { replace: true })`)
  3. Wenn weder URL noch localStorage einen Wert hat: L3 nicht sichtbar, User wählt im Hauptbildschirm
  4. localStorage wird nur geschrieben, wenn der Benutzer aktiv eine Auswahl trifft (nicht bei Redirects)
- **Suche:** Client-seitig, indexiert aus vorhandenen Stores. Kein Backend-Call für Suche.
- **Store-Ladestatus:** `useGlobalSucheLP`/`useGlobalSucheSuS` geben `{ treffer, istLadend, fehler }` zurück. Bei `istLadend` zeigt das Ergebnis-Panel "Lade Daten …" statt Leer-Treffer, um "nichts gefunden" nicht fälschlich anzuzeigen, während Stores noch laden.
- **⋮-Menü:** Lokaler UI-State (offen/zu), keine Persistenz.

---

## 9 — Migration

### 9.1 Phase 1 — Skeleton
- `AppHeader`, `TabKaskade`, `L3Dropdown`, `GlobalSuche`, `OptionenMenu` neu implementieren.
- Tests (vitest) pro Komponente.

### 9.2 Phase 2 — LP-Migration
- `LPHeader` durch `AppHeader rolle="lp"` ersetzen.
- Alle 4 LP-Bereiche einzeln umstellen, jeweils manuell im Browser verifizieren.
- Bestehende Deep-Links (`/pruefung/...`, `/uebung/kurs/...`) bleiben funktional.

### 9.3 Phase 3 — SuS-Migration
- Inline-Header in SuS-Komponenten durch `AppHeader rolle="sus"` ersetzen.
- SuS-Suche aktivieren (eingeschränkter Scope).
- Deep-Link `/sus/ueben?fach=X` weiterhin funktional (bereits in Bundle 12 gefixt).

### 9.4 Phase 4 — Aufräumen
- `ThemeToggle` als eigenständige Header-Komponente entfernen.
- `LPHeader.tsx` löschen wenn nirgends mehr referenziert.
- Veraltete Props aus den Stores entfernen, wo sie nur noch für den alten Header genutzt wurden.

### 9.5 Feature-Flag (optional)

Wir können `AppHeader` hinter einem `ENABLE_NEW_HEADER`-Flag aktivieren, damit bei Problemen auf Preview schnell zurückgerollt werden kann. Nach Bestätigung auf Staging: Flag entfernen.

---

## 10 — Tests

### 10.1 Unit-Tests (vitest)

- `TabKaskade`: Rendering für alle 4 Rolle/L1-Kombinationen, L2/L3 Sichtbarkeit.
- `L3Dropdown`: Single/Multi-Select, Leer-State, "+Neu"-Action.
- `GlobalSuche`: Kontext-Priorisierung, Gruppen-Reihenfolge, Highlight.
- `OptionenMenu`: LP-vs-SuS-Varianten, Outside-Click schliesst.

### 10.2 Integration-Tests

- Deep-Link-Navigation: `/uebung/kurs/X` setzt korrekt alle 3 Ebenen aktiv.
- MultiSelect bei Prüfen · Durchführen: mehrere Prüfungen parallel, Wechsel der "primären" via Dropdown.
- ⌘K aktiviert Suche, ESC schliesst.

### 10.3 Browser-Test

- Desktop (1280+), Tablet (900–1279), schmal (600–899), Phone (< 600).
- Light + Dark Mode.
- LP: alle 4 L1-Bereiche + Wechsel zwischen ihnen.
- SuS: Üben/Prüfen, Deep-Link von E-Mail simulieren.

---

## 10.4 — Accessibility (ARIA)

- **Tab-Kaskade:** L1-Container hat `role="tablist"`, L1-Tabs haben `role="tab"` und `aria-selected`. L2 analog als zweites nested tablist mit `aria-label="Ansichten für {L1-Name}"`. Panels haben `role="tabpanel"` mit `aria-labelledby` auf den aktiven Tab.
- **L3-Dropdown:** `role="combobox"` mit `aria-haspopup="listbox"` und `aria-expanded`. Panel `role="listbox"`, Items `role="option"` mit `aria-selected`.
- **Suche:** Input `role="searchbox"` mit `aria-label="ExamLab durchsuchen"`. Ergebnis-Panel `role="listbox"`, Items `role="option"`, Gruppen-Label als `role="group"` mit `aria-label`.
- **⋮-Menü:** Trigger `aria-haspopup="menu"`, Panel `role="menu"`, Items `role="menuitem"`. Separator `role="separator"`.
- **Fokus-Reihenfolge:** Brand → L1 → aktives L2 → L3-Dropdown → verbleibende L1 → Suche → ⋮. Tab-Taste folgt dieser Reihenfolge. Pfeiltasten innerhalb tablist navigieren Tabs (WAI-ARIA Authoring Practices).
- **Screenreader-Ankündigung:** Bei L1-Wechsel wird "Ansicht {Name} aktiv, {N} Unter-Ansichten verfügbar" gelesen (via `aria-live="polite"` region im Header).

## 11 — Out of Scope (parkiert)

- Keyboard-Shortcuts über `⌘K`/`⌘/` hinaus (Tab-Wechsel per Zahl etc.) — späterer Bundle.
- Breadcrumb-Historie ("zuletzt besucht") — späterer Bundle.
- Such-Backend-Integration (server-side indexed search) — aktuell client-seitig ausreichend.
- Favoriten als L1-Dropdown mit Preview — aktuell einfache Liste auf /favoriten.
- Eigener Suchergebnis-Screen ("Alle N Treffer anzeigen …") — aktuell nur Top 5 pro Gruppe + Verfeinerungs-Hinweis.

---

## 12 — Offene Entscheidungen

Keine.

---

## 13 — Risiken

- **Shared Header für LP+SuS:** Gemeinsame Komponente für zwei Nutzergruppen mit unterschiedlichem Datenraum. Risiko: falsche Daten in SuS-Suche leaken. **Massnahme:** Strikte Scope-Trennung in `useGlobalSuche`, explizite Tests für SuS-Scope.
- **Migration von `LPHeader`:** Bestehende Props (zurueck, aktionsButtons, breadcrumbs) in Detail-Ansichten müssen weiter funktionieren. **Massnahme:** `mode="detail"`-Variante, separate Integration-Tests.
- **Overflow bei vielen Prüfungen:** Wenn 10+ Prüfungen aktiv → L3-Trigger wird breit. **Massnahme:** Max 40 Zeichen im Trigger, danach "…".

---

**Ende Spec**
