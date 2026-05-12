---
title: Cluster C — Globale Suche erweitern
date: 2026-05-11
revisions:
  - 2026-05-12: Spec rev2 nach Reviewer-Loop (Scope auf 6 Quellen reduziert, Schüler + Pre-Fill Phase 2, XSS-Code-Fix, Architektur als Selektor-Hook statt eigener Store, Score-Tabelle, Z-Index-Schicht, Library-Entscheidung Plain Substring + Diakritik-Normalize)
status: Spec-Review approved (rev2)
verwandt: Cluster E (Tab-Registry, Typografie), Cluster G (Icon-System), Cluster B (Header-Layout), Cluster F (Testdaten-Filter)
---

# Cluster C — Globale Suche erweitern

## 1. Zweck

Heute durchsucht die Header-Suche (`src/components/shared/header/GlobalSuche.tsx`, 108 Z.) nur die Fragensammlung (über `useGlobalSucheLP`-Hook). User-Anforderung: „**die suchfunktion im examlab header sollte nicht nur in der fragensammlung suchen. ich sollte auch nach einstellungen, kursen, prüfungen etc. suchen können.**"

Ziel: einheitliche globale Suche im App-Header die über mehrere relevante Bereiche sucht (Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen) und Treffer gruppiert + direkt navigierbar präsentiert. Erste-Klasse-Suche statt scoped-per-Surface.

## 2. Begriffe

- **Quelle:** Treffer-Kategorie (Einstellungen-Tab, Hilfe-Tab, Kurs, Prüfung, Übung, Frage).
- **Treffer:** Match in einer Quelle mit Score + Highlight-Stellen.
- **Such-Selektor:** Memo-Hook (`useSucheIndex`) der die 6 Quellen aus bestehenden Stores zusammenträgt — kein eigener State, kein Duplikat-Cache.
- **Quell-Sektion:** Block im Dropdown mit Header (z.B. „Einstellungen") + bis zu 5 Treffern + „Alle Treffer in …"-Link (nur Navigation, kein Filter-Pre-Fill in Phase 1).

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Sechs Quellen im Phase-1-Scope:** Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen. **Schüler explizit Phase 2** (kein bestehender LP-Permission-Hook, würde Sub-Cluster werden). | YAGNI; deckt expliziten User-Wunsch ab. |
| 2 | **Fragen-Suche auf Titel + ID + Tags + Themen.** Volltext (Fragetext, Lösung) explizit Out-of-Scope. | Performance: 1000+ Fragen, Volltext wäre teuer. |
| 3 | **Korrekturen, Antworten, Material-Inhalte NICHT durchsuchbar.** | Datenschutz + zu spezifisch für globale Suche. |
| 4 | **Treffer gruppiert nach Quelle, max 5 pro Quelle**, „Alle Treffer in …"-Link **nur als Navigation** zur Surface (kein Filter-Pre-Fill in Phase 1 — `?suche=`-Pattern existiert in keiner Surface, würde eigener Sub-Cluster werden). | Scope-Reduktion; Pre-Fill als Phase 2. |
| 5 | **Debounced search-as-you-type (300 ms)**, Such-Trigger ab 2 Zeichen. | Reduziert Compute-Last + vermeidet 1-Zeichen-Treffer-Lawinen. |
| 6 | **Match-Stellen highlighted** via JSX-Array (`<mark>`-Element), nicht `dangerouslySetInnerHTML`. XSS-sicher by-construction. | Sicherheit + Tailwind-Styling kompatibel. |
| 7 | **Such-Engine:** Plain Substring + Unicode-Normalize (`text.normalize('NFD').replace(/\p{Diacritic}/gu, '')`). Keine externe Library (fuse.js etc.) in Phase 1. | YAGNI; bei 1000+ Fragen reicht Substring; Fuzzy-Match als Phase 2 falls gewünscht. |
| 8 | **Such-Index als Memo-Selektor** (`useSucheIndex()` in `src/hooks/useSucheIndex.ts`), liest direkt aus bestehenden Stores (`useStammdatenStore`, `usePruefungenStore`, `useUebungenStore`, `useFragenStore`, `tabRegistry`). **Kein neuer Zustand-Store** — Source-of-Truth bleibt in den Domain-Stores, Cache-Invalidierung via Zustand-Subscribe geschieht automatisch. | Vermeidet Duplikat-State + Sync-Komplexität. |
| 9 | **Direkte Navigation** beim Klick: Quelle + ID → Route (via Tab-Registry aus Cluster E für Einstellungen/Hilfe; via bestehenden Routes für Domain-Entities). | Single-Hop zur Ziel-Lokation. |
| 10 | **Cluster-F-Filter:** Such-Adapter nutzen `filtereTestdatenWennDeaktiviert()` aus `utils/testdaten/filter.ts` **vor** Indexierung. Engine bleibt agnostisch. | Konsistenz mit Cluster F.4 Pattern (`useLPConfigFiltering`). |
| 11 | **Score-Boundaries** (für Ranking + Test-Verifikation): Titel-Prefix=100, ID-Exact=95, Titel-Substring=70, Tag/Thema-Substring=50, Subtitel-Substring=30. Tie-Break alphabetisch nach `titel`. | Konkret testbar; Plan-Phase folgt Tabelle. |
| 12 | **Keyboard-Navigation:** Arrow Up/Down zwischen Treffern (über Sektionen hinweg), Enter öffnet aktiven (oder ersten), Escape schließt Dropdown. **Cmd+K / Ctrl+K** fokussiert Input (übernommen aus bestehender GlobalSuche). | A11y + Power-User-Speed + Konsistenz. |
| 13 | **Z-Index-Schicht:** Suche-Dropdown `z-50`, App-Header `z-60`, Cluster-D Floating-Bar (Phase 2) `z-40`. | Klare Hierarchie ohne Plan-Phase-Prüfung. |
| 14 | **Sprach-Konvention:** Domain-Begriffe deutsch ohne Umlaut (`SucheQuelle`, `SucheTreffer`, `fuehreSucheAus`, `useSucheIndex`). UI-Strings deutsch mit Umlaut. | Konsistent mit ExamLab-Konvention (`project_examlab_sprachkonvention.md`). |

## 4. Datenmodell

### 4.1 Treffer-Type

```ts
type SucheQuelle =
  | 'einstellungen-tab' | 'hilfe-tab'
  | 'kurs' | 'pruefung' | 'uebung' | 'frage';

interface HighlightStelle {
  start: number;
  end: number;
  feld: 'titel' | 'subTitel';
}

interface SucheTreffer {
  quelle: SucheQuelle;
  id: string;
  titel: string;                  // Hauptdarstellung
  subTitel?: string;              // z.B. "Klasse 29c · 25.06.2026"
  highlightStellen?: HighlightStelle[];
  navigation: {
    route: string;                // z.B. "/pruefen/abc-123"
    params?: Record<string, string>;
  };
  score: number;                  // 0-100, Boundaries siehe §3 Tabelle Zeile 11
  icon?: string;                  // Lucide-Icon-Name aus Tab-Registry oder Default
}

interface SucheErgebnis {
  treffer: SucheTreffer[];
  proQuelleSichtbar: Record<SucheQuelle, number>;  // max 5 pro Quelle (limitiert)
  proQuelleGesamt: Record<SucheQuelle, number>;    // Original-Count vor Limit
}
```

### 4.2 Such-Index — Selektor-Hook statt Store

`src/hooks/useSucheIndex.ts` (neu):

```ts
export interface SucheIndex {
  einstellungenTabs: TabDefinition[];   // aus tabRegistry: tabsFuerSurface('einstellungen', ctx)
  hilfeTabs: TabDefinition[];           // aus tabRegistry: tabsFuerSurface('hilfe', ctx)
  kurse: KursDefinition[];              // useStammdatenStore (Cluster F-Filter angewendet)
  pruefungen: PruefungsConfig[];        // usePruefungenStore (Cluster F-Filter)
  uebungen: UebungsConfig[];            // useUebungenStore (Cluster F-Filter)
  fragen: FrageSummary[];               // useFragenStore (FrageSummary: Titel/ID/Tags/Themen, keine Volltexte)
}

export function useSucheIndex(): SucheIndex {
  // Pro Source-Store EIN Feld-Selektor mit shallow, NICHT der ganze Store —
  // damit unverwandte Field-Updates (z.B. "aktive Pruefung gespeichert") kein Re-Render im Such-Hook auslösen.
  const kurse = useStammdatenStore(s => s.kurse, shallow);
  const pruefungen = usePruefungenStore(s => s.alle, shallow);
  // …4 weitere Selektoren analog…
  const einstellungenTabs = tabsFuerSurface('einstellungen', ctx);
  const hilfeTabs = tabsFuerSurface('hilfe', ctx);

  return useMemo(() => ({
    einstellungenTabs,
    hilfeTabs,
    kurse: filtereTestdatenWennDeaktiviert(kurse, testdatenSichtbar),
    pruefungen: filtereTestdatenWennDeaktiviert(pruefungen, testdatenSichtbar),
    // …
  }), [einstellungenTabs, hilfeTabs, kurse, pruefungen, testdatenSichtbar /* …*/]);
}
```

**Cache-Invalidierung:** automatisch durch Zustand-Subscribe — keine manuelle Refresh-Logik nötig. Wenn der relevante Feld-Selektor des Source-Store sich ändert, re-rendert die Komponente und Such-Memo invalidiert. Selektor-Stabilität via `shallow` aus `zustand/shallow` verhindert Re-Render-Loops bei nicht-identischen Array-Returns.

### 4.3 Such-Engine

`src/utils/sucheEngine.ts` (neu):

```ts
export function fuehreSucheAus(query: string, index: SucheIndex): SucheErgebnis {
  const queryNormalized = normalizeForSuche(query);
  if (queryNormalized.length < 2) return LEERES_ERGEBNIS;

  const alleTreffer: SucheTreffer[] = [
    ...indexEinstellungenTabs(queryNormalized, index.einstellungenTabs),
    ...indexHilfeTabs(queryNormalized, index.hilfeTabs),
    ...indexKurse(queryNormalized, index.kurse),
    ...indexPruefungen(queryNormalized, index.pruefungen),
    ...indexUebungen(queryNormalized, index.uebungen),
    ...indexFragen(queryNormalized, index.fragen),
  ];

  return gruppiereUndLimitiere(alleTreffer, { maxProQuelle: 5 });
}

export function normalizeForSuche(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
```

Pro Such-Quelle eine reine `index*`-Funktion (z.B. `indexFragen(q, fragen)`) — testbar isoliert. Score-Logik in `score()`-Helper gemäß §3 Tabelle Z.11.

## 5. Komponenten

### 5.1 `GlobalSuche` Komponente Refactor

Bestehende `src/components/shared/header/GlobalSuche.tsx` wird erweitert. Cmd+K-Shortcut bleibt erhalten.

#### Input

```tsx
<input
  type="search"
  placeholder="Suche …"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onKeyDown={handleKeyDown}
  onFocus={() => setOffen(true)}
  className="w-64 ..."
/>
```

#### Dropdown

```tsx
{istOffen && query.length >= 2 && (
  <div className="absolute top-full mt-1 right-0 w-96 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg border z-50">
    {QUELLEN_REIHENFOLGE.map(quelle => {
      const sektion = ergebnis.treffer.filter(t => t.quelle === quelle);
      if (sektion.length === 0) return null;
      return (
        <QuellSektion
          key={quelle}
          quelle={quelle}
          treffer={sektion}
          gesamtCount={ergebnis.proQuelleGesamt[quelle]}
          activeIndex={activeIndex}
        />
      );
    })}
    {ergebnis.treffer.length === 0 && <EmptyState query={query} />}
  </div>
)}
```

Reihenfolge der Sektionen (Konstante `QUELLEN_REIHENFOLGE` in `sucheEngine.ts`):
1. Einstellungen-Tabs
2. Hilfe-Tabs
3. Kurse
4. Prüfungen
5. Übungen
6. Fragen

### 5.2 `QuellSektion` (neu)

```tsx
<section>
  <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
    <h3 className={`${TYPO.caption} uppercase`}>{quellLabel(quelle)}</h3>
    <span className={TYPO.caption}>{gesamtCount > 5 ? `${gesamtCount}` : ''}</span>
  </div>
  <ul>
    {treffer.map((t, i) => (
      <TrefferZeile key={t.id} treffer={t} aktiv={i === activeIndex} onClick={() => navigiere(t)} />
    ))}
  </ul>
  {gesamtCount > 5 && (
    <button onClick={() => navigiereZuSurface(quelle)} className={`${TYPO.caption} block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700`}>
      Alle {gesamtCount} Treffer in {quellLabel(quelle).toLowerCase()} →
    </button>
  )}
</section>
```

### 5.3 `TrefferZeile` (neu) — XSS-sicher

```tsx
<li
  onClick={onClick}
  className={`px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer flex items-center gap-3 ${aktiv ? 'bg-violet-100 dark:bg-violet-900/40 ring-1 ring-violet-300' : ''}`}
>
  <Icon name={treffer.icon ?? 'File'} className="w-4 h-4 text-slate-500" />
  <div className="flex-1 min-w-0">
    <div className={`${TYPO.body} truncate`}>
      {highlight(treffer.titel, treffer.highlightStellen, 'titel')}
    </div>
    {treffer.subTitel && (
      <div className={`${TYPO.caption} truncate text-slate-500`}>
        {highlight(treffer.subTitel, treffer.highlightStellen, 'subTitel')}
      </div>
    )}
  </div>
</li>
```

```ts
// src/utils/highlight.tsx
export function highlight(
  text: string,
  stellen: HighlightStelle[] | undefined,
  feld: 'titel' | 'subTitel'
): ReactNode[] {
  const relevante = (stellen ?? []).filter(s => s.feld === feld).sort((a, b) => a.start - b.start);
  if (relevante.length === 0) return [text];

  const teile: ReactNode[] = [];
  let cursor = 0;
  relevante.forEach((s, i) => {
    if (s.start > cursor) teile.push(text.slice(cursor, s.start));
    teile.push(
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 font-semibold rounded px-0.5">
        {text.slice(s.start, s.end)}
      </mark>
    );
    cursor = s.end;
  });
  if (cursor < text.length) teile.push(text.slice(cursor));
  return teile;
}
```

**XSS-sicher by-construction:** kein `dangerouslySetInnerHTML`, kein DOMPurify. React escaped Text-Children automatisch.

### 5.4 `EmptyState`

```tsx
<div className="px-4 py-6 text-center">
  <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
  <p className={TYPO.body}>Nichts gefunden für „{query}"</p>
  <p className={TYPO.caption}>Versuche andere Begriffe.</p>
</div>
```

### 5.5 Keyboard-Navigation

- **Arrow Down** im Input: Selektiert erste Treffer-Zeile (`activeIndex = 0`). Dann Pfeile bewegen `activeIndex` über Sektionen hinweg (Flat-Index über `ergebnis.treffer`).
- **Arrow Up:** Rückwärts; bei `activeIndex === 0` zurück in Input-Fokus.
- **Enter:** Öffnet aktiven Treffer (oder ersten falls `activeIndex < 0`).
- **Escape:** Schließt Dropdown, behält Query im Input.
- **Tab:** Standard-Behavior, schließt Dropdown, fokussiert nächstes UI-Element.
- **Cmd+K / Ctrl+K** (von bestehender Komponente übernommen): Fokussiert Such-Input von überall in der App.

### 5.6 „Alle Treffer in …"-Link — Phase 1: nur Navigation

Klick auf Link führt zur Voll-Liste der Quelle **ohne Filter-Pre-Fill**:
- Einstellungen-Tab: → Einstellungen mit dem getroffenen Tab aktiv
- Hilfe-Tab: → Hilfe mit dem Tab aktiv
- Kurse: → Dashboard (User filtert dort manuell)
- Prüfungen: → Prüfen-Liste
- Übungen: → Üben-Liste
- Fragen: → Fragensammlung

`?suche=`-Pre-Fill ist explizit **Phase 2**, eigener Sub-Cluster (würde 5 Surfaces gleichzeitig anfassen).

## 6. Migration

### Phase 1: Foundation
- `sucheEngine.ts` mit `fuehreSucheAus()` + `normalizeForSuche()` + 6× `index*`-Adapter + `gruppiereUndLimitiere()` + Vitest.
- `highlight.tsx` Helper mit Vitest (XSS-sicher).
- Konstante `QUELLEN_REIHENFOLGE` + `quellLabel()`-Mapper.

### Phase 2: Quellen-Integration
- `useSucheIndex()`-Hook mit Selektoren aus 5 Source-Stores + Tab-Registry.
- Cluster-F-Filter `filtereTestdatenWennDeaktiviert()` in den 4 Domain-Adaptern (Kurse, Prüfungen, Übungen, Fragen).
- FrageSummary-Subset (Titel/ID/Tags/Themen) gegen `useFragenStore` verifizieren.

### Phase 3: UI-Refactor `GlobalSuche`
- Dropdown-Layout + 6 `QuellSektion`en + `TrefferZeile` + `EmptyState`.
- Keyboard-Navigation (Flat-Index, Active-Highlight).
- Mobile-Treatment (Full-Width Dropdown bei `<sm`).

### Phase 4: Navigation-Wiring
- TrefferZeile-Klick → `react-router-dom` `navigate(treffer.navigation.route)`.
- „Alle Treffer in"-Link → einfacher `navigate(surfaceRoute)` ohne Filter-Params.

### Phase 5: Cleanup + Browser-E2E
- Performance-Check (Such-Latenz bei 1000+ Fragen).
- Browser-E2E gegen echte LP-Logins (siehe §11.2).

## 7. UI-Spezifikation

### 7.1 Header-Input

- Position: rechts neben Tab-Kaskade, links von Favoriten/User-Menü.
- Breite: `w-64` (256 px) auf md+, `w-full` auf mobile.
- Style: Border `border-slate-200 dark:border-slate-700`, Focus-Ring `ring-violet-500`.
- Icon: `Search` (lucide-react) links im Input.

### 7.2 Dropdown

- Position: `absolute top-full mt-1 right-0` — rechts ausgerichtet.
- Breite: `w-96` (384 px) md+, full-width mit Backdrop unter md.
- `max-h-[60vh]`, `overflow-y-auto`, `shadow-lg`, `z-50`.

### 7.3 Quell-Sektion-Header

- Caption-Größe, uppercase, mit Quell-Counter (`gesamtCount > 5 ? '12' : ''`).

### 7.4 Treffer-Zeile

- Hover: `bg-violet-50 dark:bg-violet-900/20`.
- Aktiv (Keyboard): zusätzlich `bg-violet-100 dark:bg-violet-900/40 ring-1 ring-violet-300`.
- Highlight: `<mark>` mit `bg-yellow-200 dark:bg-yellow-700/50`.

### 7.5 Empty-State

- Mittig im Dropdown, `Search`-Icon graumarkiert (`text-slate-300`), Body-Text + Caption.

## 8. Edge-Cases & Fehlerfälle

- **Sehr lange Treffer-Titel:** `truncate` Tailwind-Klasse. Subtitle ggf. kürzen via `truncate`.
- **Diakritik / Umlaute:** `normalizeForSuche()` normalisiert NFD + entfernt Diacritics → „Übung" matcht „uebung", „uebung" matcht „Übung".
- **Spezial-Zeichen in Query:** Regex-Sonderzeichen werden in `normalizeForSuche()` als Text behandelt (kein Regex-Bau aus User-Input).
- **Sehr viele Treffer in einer Quelle:** Dropdown zeigt 5, „Alle Treffer in …"-Link navigiert zur Surface.
- **Cold Start ohne geladene Daten:** Dropdown zeigt „Lade …"-State pro nicht-geladene Quelle. Plan-Phase: einzelne `istGeladen`-Flags aus Source-Stores ablesen.
- **Klick außerhalb Dropdown:** Schließt Dropdown, Query bleibt im Input. (`useClickOutside`-Pattern; falls in Codebase vorhanden, nutzen.)
- **Mobile / Touch:** Dropdown wird `w-full` unter `md` Breakpoint. Keyboard-Navigation entfällt — Tap reicht.
- **Stale Daten:** Zustand-Subscribe in Adaptern → automatisches Re-Render bei Store-Update. Keine manuelle Cache-Invalidierung.

## 9. Out-of-Scope (explizit nicht in Phase 1)

- **Schüler-Suche:** kein bestehender LP-Permission-Hook; eigener Sub-Cluster Phase 2.
- **„Alle Treffer in"-Filter-Pre-Fill** in Ziel-Surfaces (`?suche=`-Pattern): eigener Sub-Cluster, weil 5 Surfaces gleichzeitig betroffen.
- **Volltext-Suche** in Frage-Inhalten / Lösung / Material-PDFs. Phase 2 oder eigenes Feature.
- **Fuzzy-Match** (Levenshtein, fuse.js): Phase 2 falls Tippfehler-Toleranz gefordert.
- **Filter-Operatoren** wie `fach:BWL` oder `bloom:K3`. Phase 2.
- **Such-Historie** (zuletzt gesuchte Begriffe). Eigenständiger Cluster.
- **Multi-Tenant-Suche** (Cross-Account). Nur Eigensicht.
- **Backend-Such-Endpoint:** alles client-side bleibt. Backend nur wenn Performance untragbar.

## 10. Abhängigkeiten zu anderen Clustern

- **Cluster E (Tab-Registry):** `tabsFuerSurface('einstellungen' | 'hilfe', ctx)` liefert die ersten beiden Quellen. Routen für Tab-Treffer aus Registry. **Voraussetzung erfüllt** (E.1 MERGED).
- **Cluster G (Icon-System):** Lucide-Icons (`Search`, `File`, etc.). Phase 1 nutzt direkten `lucide-react`-Import (kein zentrales Wrapper-System nötig — Codebase-Pattern). Phase 2 von Cluster G ergänzt zentralen Wrapper. **Nicht-blockierend.**
- **Cluster B (Header):** Globale Suche bleibt im App-Header. Z-Index-Schicht in §3 Z.13 festgelegt. **Keine Konflikte.**
- **Cluster F (Testdaten):** Such-Adapter rufen `filtereTestdatenWennDeaktiviert(records, testdatenSichtbar)` aus `utils/testdaten/filter.ts` **vor** Indexierung. Konsistent mit Cluster F.4 Pattern. **Voraussetzung erfüllt** (F.4 MERGED).
- **Cluster D (Batch-Edit, future):** Floating-Bar `z-40` < Suche-Dropdown `z-50` < App-Header `z-60`. Pre-festgelegt.

## 11. Test-Strategie

### 11.1 Unit-Tests (Vitest)

- `normalizeForSuche()`: NFD-Normalisierung, Diakritik-Entfernung, Lowercase.
- `fuehreSucheAus()` mit verschiedenen Queries (leer, 1-Zeichen, 2+, Umlaut, Sonderzeichen).
- Score-Ranking gemäß §3 Z.11: Titel-Prefix > ID-Exact > Titel-Substring > Tag > Subtitel.
- `gruppiereUndLimitiere()`: max 5 pro Sektion, `proQuelleGesamt` korrekt.
- 6× `index*`-Adapter isoliert (Mock-Daten).
- `highlight()`: korrekte Stellen-Platzierung, mehrere Highlights, edge cases (start=0, end=text.length).
- Cluster-F-Filter: `filtereTestdatenWennDeaktiviert` wird in Adaptern aufgerufen.

### 11.2 Browser-E2E (gegen echte Logins, kein Demo-Modus)

1. **Multi-Quellen-Treffer:** LP-Login → Suche „BWL" → Dropdown zeigt mindestens 2 Sektionen (Kurse + Prüfungen oder Fragen).
2. **Tab-Suche Einstellungen:** Suche „Lernziel" → Treffer in Einstellungen-Tab „Lernziele" → Klick → Einstellungen mit Tab „lernziele" aktiv.
3. **Tab-Suche Hilfe:** Suche „Bloom" → Treffer in Hilfe-Tab „bloom" → Klick → Hilfe mit Tab aktiv.
4. **Frage-Treffer:** Suche „Aktien" → Frage-Treffer → Klick → Fragensammlung mit Frage geöffnet.
5. **Diakritik:** Suche „uebung" → findet „Übung"-Records (und umgekehrt).
6. **Keyboard-Navigation:** Suche „Bilanz" → Pfeil-Runter (1×) → Enter → Navigation zum ersten Treffer.
7. **„Alle Treffer in"-Link:** Suche mit ≥6 Treffern in einer Quelle → Klick „Alle X Treffer in …" → Navigation zur Surface (kein Filter, einfach Surface-Default).
8. **Cluster-F-Interaktion:** Testdaten-Sichtbarkeit aus → Suche nach Test-Frage → KEINE Test-Records im Dropdown. Toggle an → Test-Records erscheinen.
9. **Empty-State:** Suche „xyzqwer123" → Empty-State sichtbar.
10. **Console-Errors:** 0 in allen Schritten.
11. **Cmd+K Shortcut:** Aus beliebiger Surface → Cmd+K → Such-Input fokussiert.

### 11.3 Performance-Tests (Vitest mit synthetischen Daten)

- Such-Latenz bei 1000 Fragen + 100 Prüfungen + 100 Übungen + 50 Kursen + 19 Tabs: **< 50 ms** (typewriter-Geschwindigkeit).
- `useSucheIndex()`-Memo-Stability: keine Re-Renders bei unverwandten Store-Updates.

## 12. Plan-Phase-Audits (vor Code)

Drei Audits, die der Plan zu Beginn ausführt:

1. **FrageSummary-Verfügbarkeit:** `useFragenStore` liefert eine Summary mit Titel/ID/Tags/Themen ohne Volltext? Grep `FrageSummary`, `summaries`, `holeFragen`. Falls nicht: dünner Selektor `useFragenSummaries()`.
2. **`useClickOutside`-Pattern:** Existiert ein wiederverwendbarer Hook für „Klick außerhalb"? Falls ja → nutzen, falls nein → einfache `useEffect` + `event.target` Inline-Lösung (kein neuer Hook für 1 Verwendung).
3. **Zustand-Selektor-Stabilität:** Wie verwenden bestehende Multi-Store-Konsumenten `useShallow` / `shallow` (zustand v4 vs v5)? Grep `zustand/shallow`, `useShallow`, `import { shallow }`. Plan-Phase richtet `useSucheIndex` an dem etablierten Pattern aus, damit §4.2 nicht erst beim Performance-Test (§11.3) auffällt.
