---
title: Cluster C — Globale Suche erweitern
date: 2026-05-11
status: Spec-Review ausstehend
verwandt: Cluster E (Tab-Registry, Typografie), Cluster G (Icon-System), Cluster B (Header-Layout)
---

# Cluster C — Globale Suche erweitern

## 1. Zweck

Heute durchsucht die Header-Suche nur Kurse und Gruppen. User-Anforderung: „**die suchfunktion im examlab header sollte nicht nur in der fragensammlung suchen. ich sollte auch nach einstellungen, kursen, prüfungen etc. suchen können.**"

Ziel: einheitliche globale Suche im App-Header die über alle relevanten Bereiche sucht (Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen, Schüler) und Treffer gruppiert + direkt navigierbar präsentiert. Erste-Klasse-Suche statt scoped-per-Surface.

## 2. Begriffe

- **Quelle:** Treffer-Kategorie (Einstellungen-Tab, Hilfe-Tab, Kurs, Prüfung, Übung, Frage, Schüler).
- **Treffer:** Match in einer Quelle mit Score + Highlight-Stellen.
- **Such-Index:** Client-side gecachetes Such-Set pro Quelle, durchsucht über Levenshtein/Substring.
- **Quell-Sektion:** Block im Dropdown mit Header (z.B. „Einstellungen") + bis zu 5 Treffern + „Alle Treffer in …"-Link.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Sieben Quellen im Phase-1-Scope:** Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen, Schüler. | Deckt die häufigsten Navigations-Ziele ab. |
| 2 | **Schüler nur mit Permission** (LP sieht nur Schüler seiner eigenen Kurse, Admin sieht alle). | Datenschutz, konsistent mit bestehender Sichtbarkeit. |
| 3 | **Fragen-Suche auf Titel + ID + Tags + Themen.** Volltext (Fragetext, Lösung) explizit Out-of-Scope Phase 1. | Performance: 1000+ Fragen, Volltext wäre teuer. |
| 4 | **Korrekturen, Antworten, Material-Inhalte NICHT durchsuchbar.** | Datenschutz + zu spezifisch für globale Suche. |
| 5 | **Treffer gruppiert nach Quelle, max 5 pro Quelle**, „Alle Treffer in …"-Link für mehr. | Übersichtlich, vermeidet visuellen Overload. |
| 6 | **Debounced search-as-you-type** (300 ms). | Reduziert Backend-Calls / Compute-Last. |
| 7 | **Such-Trigger ab 2 Zeichen.** | Vermeidet sinnlose 1-Zeichen-Treffer-Lawinen. |
| 8 | **Match-Stellen highlighted** (Bold oder Background-Highlight). | Schnellere visuelle Erkennung warum etwas matcht. |
| 9 | **Direkte Navigation** beim Klick: Quelle + ID → Route (via Tab-Registry aus Cluster E). | Single-Hop zur Ziel-Lokation. |
| 10 | **Client-side Such-Index pro Quelle**, gecached aus regulären Listen-Loads. Refresh on demand. | Schnell, kein Backend-Such-Endpoint nötig in Phase 1. |
| 11 | **Volltext-Backend-Endpoint** = Out-of-Scope Phase 1. Falls später nötig, eigener Cluster. | YAGNI; aktuell reicht Client-Side. |
| 12 | **Keyboard-Navigation:** Arrow Up/Down zwischen Treffern, Enter öffnet erste/aktive, Escape schließt. | A11y + Power-User-Speed. |

## 4. Datenmodell

### 4.1 Treffer-Type

```ts
type SucheQuelle =
  | 'einstellungen-tab' | 'hilfe-tab'
  | 'kurs' | 'pruefung' | 'uebung'
  | 'frage' | 'schueler';

interface SucheTreffer {
  quelle: SucheQuelle;
  id: string;
  titel: string;                  // Hauptdarstellung
  subTitel?: string;              // z.B. "Klasse 29c · 25.06.2026"
  highlightStellen?: { start: number; end: number; feld: string }[];
  navigation: {
    route: string;                // z.B. /pruefen/abc-123
    params?: Record<string, string>;
  };
  score: number;                  // 0-100, höher = besser
  icon?: string;                  // Lucide-Name aus Tab-Registry oder Default
}

interface SucheErgebnis {
  treffer: SucheTreffer[];
  proQuelleSichtbar: Record<SucheQuelle, number>;  // max 5 pro Quelle
  proQuelleGesamt: Record<SucheQuelle, number>;    // Original-Count vor Limit
}
```

### 4.2 Such-Index pro Quelle

`src/store/sucheIndexStore.ts` (neu):

```ts
interface SucheIndexState {
  einstellungenTabs: TabDefinition[];     // aus Cluster E Tab-Registry — sofort verfügbar
  hilfeTabs: TabDefinition[];             // aus Cluster E Tab-Registry — sofort verfügbar
  kurse: KursDefinition[];                // aus Stammdaten-Store
  pruefungen: PruefungsConfig[];          // aus Pruefungen-Store (Lazy-Load wenn nicht geladen)
  uebungen: UebungsConfig[];              // aus Uebungen-Store (Lazy-Load)
  fragen: FrageSummary[];                 // Titel + ID + Tags + Themen — aus FragenStore (FrageSummary, keine Volltexte)
  schueler: SchuelerInfo[];               // aus SchuelerStore (LP-permission-filtered)
  istGeladen: Record<SucheQuelle, boolean>;
  laedt: (quelle: SucheQuelle) => Promise<void>;
}
```

Lazy-Load: bei erstem Such-Trigger werden noch-nicht-geladene Quellen parallel nachgeladen. Loading-Indikator pro Sektion.

### 4.3 Such-Engine (`src/utils/sucheEngine.ts` — neu)

```ts
export function searche(query: string, index: SucheIndexState): SucheErgebnis {
  const queryNormalized = normalize(query);
  if (queryNormalized.length < 2) return leeresErgebnis;

  const treffer: SucheTreffer[] = [];
  // Pro Quelle: Substring-Match + Score basierend auf Treffer-Position / Feld
  // Hauptwort-Match (Anfang des Titels) > Substring im Titel > Substring in Subtitel/Tag
  // Einstellungen/Hilfe-Tabs: Tab-Titel
  // Kurse: Name + Fach + Klasse
  // Prüfungen: Titel + Klasse + Datum
  // Übungen: Titel + Fachbereich
  // Fragen: Titel + ID + Tag-Namen + Themen-Namen
  // Schüler: Vor- + Nachname + Email (LP-permission-filtered)
  // ...
  return gruppiereUndLimitiere(treffer, { maxProQuelle: 5 });
}
```

Plan-Phase entscheidet ob `fuse.js` oder ähnliche Library eingeführt wird oder einfacher Substring-Match reicht.

## 5. Komponenten

### 5.1 `GlobalSuche` Komponente Refactor

Bestehende `src/components/shared/header/GlobalSuche.tsx` wird erweitert:

#### Input
```tsx
<input
  type="search"
  placeholder="Suche …"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={handleKeyDown}
  onFocus={oeffneDropdown}
  className="w-64 ..."
/>
```

#### Dropdown
```tsx
{istOffen && query.length >= 2 && (
  <div className="absolute top-full mt-1 w-96 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg border z-50">
    {QUELLEN_REIHENFOLGE.map(quelle => {
      const sektion = ergebnis.treffer.filter(t => t.quelle === quelle);
      if (sektion.length === 0) return null;
      return <QuellSektion key={quelle} quelle={quelle} treffer={sektion} gesamtCount={ergebnis.proQuelleGesamt[quelle]} />
    })}
    {ergebnis.treffer.length === 0 && <EmptyState query={query} />}
  </div>
)}
```

Reihenfolge der Sektionen (Konstante):
1. Einstellungen-Tabs
2. Hilfe-Tabs
3. Kurse
4. Prüfungen
5. Übungen
6. Fragen
7. Schüler

### 5.2 `QuellSektion` (neu)

```tsx
<section>
  <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
    <h3 className={`${TYPO.caption} uppercase`}>{quellLabel(quelle)}</h3>
    <span className={TYPO.caption}>{gesamtCount > 5 ? `${gesamtCount}` : ''}</span>
  </div>
  <ul>
    {treffer.map(t => <TrefferZeile key={t.id} treffer={t} onClick={() => navigiere(t)} />)}
  </ul>
  {gesamtCount > 5 && (
    <button onClick={() => alleTrefferAnzeigen(quelle)} className={`${TYPO.caption} block w-full text-left px-3 py-2 hover:bg-slate-50`}>
      Alle {gesamtCount} Treffer in {quellLabel(quelle).toLowerCase()} →
    </button>
  )}
</section>
```

### 5.3 `TrefferZeile` (neu)

```tsx
<li onClick={onClick} className="px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer flex items-center gap-3">
  <Icon name={treffer.icon ?? 'File'} className="w-4 h-4 text-slate-500" />
  <div className="flex-1 min-w-0">
    <div className={`${TYPO.body} truncate`} dangerouslySetInnerHTML={{ __html: highlight(treffer.titel, treffer.highlightStellen) }} />
    {treffer.subTitel && <div className={`${TYPO.caption} truncate`}>{treffer.subTitel}</div>}
  </div>
</li>
```

`highlight()` baut JSX-Array per String-Split (XSS-sicher by-construction, kein `dangerouslySetInnerHTML`): `[plainStart, <mark>match</mark>, plainEnd]`. `<mark>` mit Tailwind `bg-yellow-200 dark:bg-yellow-700/50 font-semibold`.

### 5.4 `EmptyState`

```tsx
<div className="px-4 py-6 text-center">
  <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
  <p className={TYPO.body}>Nichts gefunden für „{query}"</p>
  <p className={TYPO.caption}>Versuche andere Begriffe oder Filter.</p>
</div>
```

### 5.5 Keyboard-Navigation

- **Arrow Down** im Input: Selektiert erste Treffer-Zeile. Dann Pfeile bewegen zwischen Sektionen + Treffern.
- **Enter:** Öffnet aktiven Treffer (oder ersten falls keiner aktiv).
- **Escape:** Schließt Dropdown.
- **Tab:** Standard-Behavior, fokussiert nächstes UI-Element.

### 5.6 „Alle Treffer in …"-Voll-Liste

Klick auf Link führt in Voll-Liste der Quelle mit voraktiviertem Suchfilter:
- Einstellungen: → Einstellungen-Tab geöffnet (irrelevant für Such-View, einfach navigieren)
- Hilfe: → Hilfe-Tab geöffnet
- Kurse: → Dashboard mit Such-Pre-Fill in lokalem Filter (falls existiert; sonst einfach Dashboard)
- Prüfungen / Übungen: → Prüfen/Üben-Liste mit Filter-State `suche=…`
- Fragen: → Fragensammlung mit voraktiviertem Suchfeld
- Schüler: → Klassen-View (oder Schüler-Liste falls existiert)

### 5.7 Cache-Invalidierung

- **Tab-Registry-Daten:** statisch, kein Refresh nötig.
- **Stammdaten (Kurse):** wird beim App-Mount geladen, danach stale-bis-Reload.
- **Prüfungen / Übungen:** geladen bei erstem Such-Trigger oder bei Surface-Navigation. Stale-Threshold 5 Min — danach Background-Refresh.
- **Fragen-Summary:** geladen bei erstem Trigger; Plan-Phase entscheidet ob Cache-Refresh bei Frage-Änderung (Subscribe) oder Manual-Refresh.
- **Schüler:** wie Stammdaten.

## 6. Migration

### Phase 1: Foundation
- `sucheEngine.ts` mit Substring-Match + Score + Tests.
- `sucheIndexStore.ts` Lazy-Load-Logik + Tests.
- Konstante `QUELLEN_REIHENFOLGE` + Labels.

### Phase 2: Quellen-Integration
- Adapter pro Quelle: `mapEinstellungenTabsZuTreffer()`, `mapKurseZuTreffer()`, … (jede ableitend aus Tab-Registry / Store-State).
- Permission-Filter für Schüler.

### Phase 3: UI-Refactor `GlobalSuche`
- Dropdown-Layout + Quell-Sektionen + Treffer-Zeilen + Highlight.
- Keyboard-Navigation.
- Empty-State.

### Phase 4: Navigation-Wiring
- TrefferZeile-Klick → router.navigate(treffer.navigation.route).
- „Alle Treffer in"-Link → navigiert in Quelle-Liste mit pre-filled search.

### Phase 5: Cleanup + E2E
- Performance-Tests (Such-Latenz bei 1000+ Fragen).
- Browser-E2E.

## 7. UI-Spezifikation

### 7.1 Header-Input

- Position: rechts neben Tab-Kaskade, links von Favoriten/User-Menü.
- Breite: `w-64` (256 px) oder `w-72` bei großen Bildschirmen.
- Style: leichter Border, Focus-Ring Violet.
- Icon: `Search` (Lucide) links im Input.

### 7.2 Dropdown

- Position: `absolute top-full mt-1 right-0` — gegen Rechts ausgerichtet damit nicht beim großen Schirm zentriert wirkt.
- Breite: `w-96` (384 px), `max-h-[60vh]`, `overflow-y-auto`.
- Shadow: `shadow-lg`.
- Z-Index: `z-50` (unter App-Header z-60).

### 7.3 Quell-Sektion-Header

- Caption-Größe, uppercase, mit Quell-Counter.

### 7.4 Treffer-Zeile

- Hover: `bg-violet-50 dark:bg-violet-900/20`.
- Aktiv (Keyboard-Selection): zusätzlich `ring-1 ring-violet-300`.
- Highlight: `<mark>` mit Yellow-Background.

### 7.5 Empty-State

- Mittig im Dropdown, Suche-Icon graumarkiert, Body-Text + Caption-Hilfe.

## 8. Edge-Cases & Fehlerfälle

- **Sehr lange Treffer-Titel:** truncate via `truncate` Tailwind-Klasse. Subtitle ggf. weglassen.
- **Stale Such-Index nach Daten-Änderung:** z.B. User erstellt neue Frage → Such-Index zeigt sie erst nach Cache-Refresh. Plan-Phase: subscribe auf Store-Updates oder explizit refresh on each search? Empfehlung: auto-refresh wenn Quelle-Store sich seit letztem Cache aktualisiert hat (Zustand-Subscribe).
- **Sehr viele Treffer in einer Quelle:** „Alle Treffer in …"-Link führt in Voll-Liste; Dropdown bleibt auf 5 pro Quelle limitiert.
- **Spezial-Zeichen in Query:** Suche normalisiert ohne diakritische Zeichen (z.B. „Übung" matcht „uebung"). Plan-Phase prüft `normalize()`-Implementation.
- **Keine Quellen geladen (Cold Start):** Dropdown zeigt Spinner pro Sektion während Lazy-Load. Treffer erscheinen sektionsweise sobald jeweilige Quelle geladen ist.
- **Schüler-Permission bei Admin-Wechsel:** Wenn User sich neu einloggt und Admin-Status sich ändert, Schüler-Index muss refresh.
- **Klick außerhalb Dropdown:** Schließt Dropdown, Query bleibt aber im Input erhalten (User kann weiter editieren).
- **Mobile / Touch:** Dropdown wird Full-Width auf kleinen Screens. Keyboard-Navigation hat kein Pendant auf Touch — TouchZeile-Tap reicht.

## 9. Out-of-Scope

- **Volltext-Suche** in Frage-Inhalten / Lösung / Material-PDFs. Phase 2 oder eigenes Feature.
- **Filter-Operatoren** wie `fach:BWL` oder `bloom:K3`. Keyword-Filter könnten später dazukommen, heute nicht.
- **Such-Historie** (zuletzt gesuchte Begriffe). Eigenständig.
- **Multi-Tenant-Suche** (Cross-Account). Nur in eigener Sicht.
- **Backend-Such-Endpoint:** alles client-side. Backend-Endpoint nur wenn Performance untragbar wird.

## 10. Abhängigkeiten zu anderen Clustern

- **Cluster E (Konsistenz):** Tab-Registry liefert Einstellungen-Tabs und Hilfe-Tabs als Such-Quellen. Routen aus Registry. **Voraussetzung.**
- **Cluster G (Icon-System):** Lucide-Icons für Such-Input (`Search`), Treffer-Zeilen, Empty-State. Brand-Farb-Tokens. **Voraussetzung.**
- **Cluster B (Header-Redesign):** Globale Suche bleibt im App-Header — keine Layout-Konflikte. Floating-Action-Bar aus Cluster D ist `z-50`, Suche-Dropdown auch `z-50` — Plan-Phase prüft ob sie sich überlappen können (vermutlich nicht weil unterschiedliche Positionen).
- **Cluster F (Testdaten):** Such-Index respektiert den `testdatenSichtbar`-Toggle: wenn aus, Test-Kurs/Test-Schüler/Test-Prüfungen sind nicht in Suchresultaten. Filter-Funktion `istTestdaten` wird in jedem Such-Adapter angewendet.

## 11. Test-Strategie

### 11.1 Unit-Tests (Vitest)

- `searche()` mit verschiedenen Queries (kurz, lang, Sonderzeichen, leer).
- Score-Ranking: Treffer in Titel-Anfang höher als Substring in Tag.
- Quellen-Limit: max 5 pro Sektion, `gesamtCount` korrekt.
- Permission-Filter Schüler: LP sieht nur eigene, Admin alle.
- Highlight-Logic: korrekt platziert.

### 11.2 Browser-E2E

1. **Multi-Quellen-Treffer:** Suche „BWL" → Dropdown zeigt mehrere Sektionen (Kurse, Prüfungen, Fragen).
2. **Tab-Suche:** Suche „Lernziel" → Treffer in Einstellungen-Tab „Lernziele".
3. **Schüler-Suche:** LP-Login → Suche „Mara" → Findet Schüler aus eigenen Klassen, nicht aus fremden.
4. **Admin-Suche:** Yannick (Admin) → Suche „Mara" → Findet alle Schüler mit dem Namen.
5. **Keyboard-Navigation:** Suche „Aktien" → Pfeil-Runter → Enter → Navigation zur Frage.
6. **Alle Treffer:** Suche „Bilanz" → 12 Fragen-Treffer → Click „Alle 12 Treffer in Fragen" → Fragensammlung mit Such-Filter.
7. **Empty-State:** Suche „xyzqwer123" → Empty-State sichtbar.
8. **Cluster-F-Interaktion:** Testdaten-Toggle aus → Suche „Test" findet KEINE Test-Records. Toggle an → Test-Records erscheinen.
9. **Console-Errors:** 0 in allen Schritten.

### 11.3 Performance-Tests

- Such-Latenz bei 1000 Fragen, 100 Prüfungen, 200 Schüler: < 100 ms.
- Lazy-Load von Quellen blockiert UI nicht — Dropdown bleibt responsiv.

## 12. Offene Punkte (vor Implementation klären)

- **Such-Library:** Plain Substring vs `fuse.js` vs eigener Levenshtein. Plan-Phase entscheidet basierend auf erwarteter Daten-Größe + Tippfehler-Toleranz. Empfehlung: erst Plain Substring, später fuse.js falls Fuzzy-Match gefragt.
- **„Alle Treffer in …"-Voll-Liste-Verhalten:** existiert ein generisches `?suche=`-Pre-Fill-Pattern in jeder Surface? Plan-Phase greppt + ergänzt wo fehlt.
- **Schüler-Datenstruktur für Suche:** wo lebt die Liste der Schüler heute? Plan-Phase findet `SchuelerStore` oder ähnlich.
- **Cache-Refresh-Strategie:** Subscribe auf Store-Updates vs Manual-Refresh-Button. Plan-Phase entscheidet.
- **Highlight-XSS-Schutz:** `<mark>`-Tag via `dangerouslySetInnerHTML` braucht Sanitization der User-Query-Substrings. **Empfohlener Pfad:** statt `dangerouslySetInnerHTML` per String-Split + JSX-Array bauen (`[plain, <mark>match</mark>, plain]`). Sicher by-construction, kein DOMPurify nötig. Plan-Phase implementiert.
- **Mobile-UX:** Dropdown auf kleinen Screens — Full-Screen-Modal vs Inline-Dropdown. Plan-Phase entscheidet.
