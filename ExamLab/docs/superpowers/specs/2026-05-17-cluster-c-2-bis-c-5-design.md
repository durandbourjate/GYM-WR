# Cluster C.2–C.5 — Globale Suche Phase 2 (Fuzzy + Pre-Fill + Schüler + Volltext)

**Datum:** 17.05.2026
**Status:** Spec
**Vorgänger:** Cluster C Phase 1 LIVE (`docs/superpowers/specs/2026-05-11-cluster-c-globale-suche-design.md` + `docs/superpowers/plans/2026-05-12-cluster-c-globale-suche.md`)
**Out-of-Scope-Quelle:** Cluster-C-Spec §9

---

## 1. Ziel

Erweitert die Phase-1-Foundation (6 Quellen, Score-Engine, Adapter-Pattern in `src/utils/sucheEngine.ts` + `src/utils/sucheAdapter.ts`) um vier Features aus §9 Out-of-Scope:

1. **C.5 Fuzzy-Match** — Tippfehler-Toleranz via eigene Levenshtein im `sucheEngine.ts`. Threshold `dist ≤ 2`.
2. **C.3 `?suche=`-Pre-Fill** — Treffer-Click auf "Alle X Treffer in …" landet auf Ziel-Surface mit `?suche=<term>` als URL-Param. Surface liest Param beim Mount.
3. **C.2 Schüler-Suche + Klassenlisten-Tab** — Neuer Einstellungen-Tab "Klassenlisten" (löst F.4 OoS mit auf) + Schüler-Adapter aus `useKlassenlistenStore`. Treffer-Click öffnet Tab mit Schüler highlighted.
4. **C.4 Volltext-Toggle** — Opt-in Volltext-Modus im Suche-Dropdown. Default bleibt schnelle Titel/ID/Tag-Suche. Toggle ON → zusätzlich Fragetext + Musterlösung indexiert.

**Phase-Reihenfolge:** C.5 → C.3 → C.2 → C.4 (Engine zuerst, Risiko zuletzt). Jede Phase shippt unabhängig auf preview → main.

## 2. Foundation bleibt unverändert

- **Score-Bounds** (`SCORE_BOUNDS` in `src/types/suche.ts`): TITEL_PREFIX=100, ID_EXACT=95, TITEL_SUBSTRING=70, TAG_THEMA=50, SUBTITEL=30.
- **Quellen-Reihenfolge** (`QUELLEN_REIHENFOLGE`): einstellungen-tab, hilfe-tab, kurs, pruefung, uebung, frage. **C.2 fügt `schueler` nach `kurs` ein.**
- **Adapter-Pattern**: pure Funktionen Source → `SucheTreffer[]`, gerouted via `ROUTE_BUILDERS`.
- **Normalisierung** `normalizeForSuche()`: ä→ae, ö→oe, ü→ue, ß→ss, NFD-Diakritik.
- **Pro-Quelle-Limit** 5 Treffer im Dropdown.

## 3. Phase 1 — C.5 Fuzzy-Match

### 3.1 Engine-Erweiterung in `sucheEngine.ts`

```ts
/**
 * Klassische DP-Levenshtein-Distanz, O(n×m).
 * Hot-Path-Optimierung: early-exit wenn diff > 2 (Threshold).
 */
export function levenshtein(a: string, b: string): number { /* 20-30 Z. */ }
```

### 3.2 Fuzzy-Fallback in `scoreFromMatch`

```ts
export function scoreFromMatch(haystack, needle, feld): number {
  const h = normalizeForSuche(haystack)
  const n = normalizeForSuche(needle)
  if (!n) return 0
  if (h.includes(n)) { /* … bestehende Logik … */ }

  // Fuzzy-Fallback nur für titel (False-Positive-Schutz)
  // ID-Fuzzy bewusst NICHT: ID_EXACT-Penalty würde fuzzy-id (85) über
  // TITEL_SUBSTRING (70) ranken — verfälscht Ranking. Spawn-Task wenn nötig.
  if (feld === 'titel' && n.length >= 3) {
    const tokens = h.split(/\s+/)
    const minDist = Math.min(...tokens.map(t => levenshtein(t, n)))
    if (minDist <= 2) {
      return Math.max(0, SCORE_BOUNDS.TITEL_SUBSTRING - (minDist === 1 ? 10 : 20))
    }
  }
  return 0
}
```

### 3.3 Bounds + Edge-Cases

- **Min-Length:** needle ≥ 3 Zeichen, sonst zu viele False-Positives ("ab" matched alles dist≤2).
- **Felder:** Fuzzy NUR auf `titel`. ID/tag/subTitel bleiben exact-only. ID-Fuzzy verworfen weil `ID_EXACT - Penalty` (z.B. 85) über `TITEL_SUBSTRING` (70) ranken würde — ein Tippfehler bei der ID dürfte nicht über einen sauberen Titel-Treffer.
- **Score-Penalty:** dist=1 → TITEL_SUBSTRING − 10 = 60, dist=2 → TITEL_SUBSTRING − 20 = 50. dist≥3 → 0 (kein Match).
- **Highlight:** Bei Fuzzy-Match keine Highlight-Stellen (kein exakter Substring im Original) — analog zur existierenden Diakritik-Behandlung.
- **Performance:** Levenshtein early-exit wenn `Math.abs(a.length - b.length) > 2`. 1000 Items × Levenshtein-DP O(20×6) ≈ 120k ops, < 50ms.

### 3.4 Tests

- Unit `levenshtein()`: 10 Cases — leere Strings, identische, prefix-diff, suffix-diff, swap, insert, delete, replace, early-exit, max-length.
- Unit `scoreFromMatch` Fuzzy-Branch: 5 Cases — exact-Match-Priorität, fuzzy-titel-dist1, fuzzy-titel-dist2, fuzzy-id, fuzzy-NICHT-tag, min-length-3-Guard.
- Performance-Smoke `sucheEngine.perf.test.ts`: 1000 Items × 10 queries × Fuzzy < 100ms.

## 4. Phase 2 — C.3 `?suche=`-Pre-Fill

### 4.1 Sammelview-Routing

`ROUTE_BUILDERS` in `sucheAdapter.ts` werden um Sammelview-Routes ergänzt (parallel zu existierenden Pro-Item-Routes):

```ts
export const SAMMELVIEW_ROUTE_BUILDERS: Record<SucheQuelle, (query: string) => string> = {
  'einstellungen-tab': () => '/einstellungen',  // Tab-Treffer haben kein Sammelview
  'hilfe-tab':         () => '/hilfe',
  kurs:                (q) => `/?suche=${encodeURIComponent(q)}`,
  pruefung:            (q) => `/?suche=${encodeURIComponent(q)}`,
  uebung:              (q) => `/?suche=${encodeURIComponent(q)}&modus=uebung`,
  frage:               (q) => `/fragensammlung?suche=${encodeURIComponent(q)}`,
  schueler:            (q) => `/einstellungen?tab=klassenlisten&suche=${encodeURIComponent(q)}`,  // C.2
}
```

Header-Komponente `sucheUI` ruft `SAMMELVIEW_ROUTE_BUILDERS[quelle](query)` für "Alle X Treffer in …"-Link.

### 4.2 Surface-Patches (~5-10 Z. pro Surface)

```tsx
// Pattern für jede Surface — handelt sowohl Mount als auch Re-Click ab:
const [params, setParams] = useSearchParams()
const [suchtext, setSuchtext] = useState(params.get('suche') ?? '')
const lastSeenParam = useRef<string | null>(null)

useEffect(() => {
  const suche = params.get('suche')
  if (!suche || suche === lastSeenParam.current) return
  lastSeenParam.current = suche
  setSuchtext(suche)
  // Param sofort entfernen damit nachträgliches Tippen URL nicht trackt
  const next = new URLSearchParams(params)
  next.delete('suche')
  setParams(next, { replace: true })
}, [params, setParams])
```

**`uebung`-Modus-Switch:** Sammelview-Route `/?suche=<term>&modus=uebung` triggert sowohl Pre-Fill (`suche`) als auch Modus-Switch (`modus`). LPStartseite liest `modus`-Param und setzt `useLPNavigationStore.setModus('uebung')` im selben useEffect. Cleanup entfernt beide Params via `replace`.

**Patch-Liste C.3:**
- `src/components/lp/LPStartseite.tsx` — gemeinsamer `suchtext`-State + Modus-Switch via `?modus=uebung`
- `src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx` (via Container) — Fragen-Suchtext

**Klassenlisten-Tab Pre-Fill wandert in C.2** (kommt mit Tab-Bau, gleiches Pattern).

### 4.3 Edge-Cases

| Szenario | Verhalten |
|---|---|
| URL ohne `?suche=` | Surface mountet normal, kein Pre-Fill |
| User tippt nach Pre-Fill | URL-Param wurde bereits entfernt, kein Re-Trigger |
| Cross-Surface-Navigate | Neuer Mount → neuer Param-Read; sicher |
| URL-encoded Sonderzeichen | `URLSearchParams` decoded automatisch |
| Re-Click "Alle Treffer" auf bereits offener Surface | `useEffect [params]` + `lastSeenParam.current` greift, neuer Param wird als Update erkannt und übernommen |
| `?modus=uebung` ohne `?suche=` | nur Modus-Switch, kein suchtext-Update |

### 4.4 Tests

- Unit `SAMMELVIEW_ROUTE_BUILDERS` 6 Cases (1 pro Quelle, encoding-Test mit Sonderzeichen).
- Integration je Surface (3 in C.3): "rendert mit initialSuche aus URL-Param", "Cleanup nach Mount".

## 5. Phase 3 — C.2 Schüler-Suche + Klassenlisten-Tab

### 5.1 Klassenlisten-Tab (löst F.4 OoS)

**TAB_REGISTRY-Erweiterung** in `src/utils/tabRegistry.ts`:

```ts
{ id: 'klassenlisten', surface: 'einstellungen', titel: 'Klassenlisten',
  route: '/einstellungen/klassenlisten', icon: 'Users' }
```

**Neue Komponente** `src/components/settings/einstellungen/KlassenlistenTab.tsx`:

- Suchfeld `suchtext` (mit `?suche=`-Pre-Fill aus C.3-Pattern)
- Klassen-Dropdown-Filter (alle Klassen aus `klassenlistenStore.daten`)
- Tabelle: Vorname · Nachname · E-Mail · Klasse · Kurs (falls zugewiesen)
- Cluster-F-Filter: `filtereTestdatenWennDeaktiviert` vor Render
- Schüler-Highlighting: URL-Param `&schueler=<email>` → Zeile blau-hinterlegt + `scrollIntoView`
- Daten-Loading: bei `ladeStatus === 'idle'` triggert Mount `klassenlistenStore.lade(email)`; Skeleton bis `'fertig'`

**EinstellungenPanel-Integration:**
- Klassenlisten-Tab erscheint in Tab-Reihenfolge nach `lernziele` (existiert in TAB_REGISTRY, Z.30). Konvention: organisatorische Tabs vor Daten-Tabs.
- Permission: alle LPs (kein Admin-Gate)

### 5.2 Schüler-Adapter

**Neuer Adapter `indexSchueler` in `src/utils/sucheAdapter.ts`:**

```ts
export function indexSchueler(
  query: string,
  eintraege: KlassenlistenEintrag[],
): SucheTreffer[] {
  return eintraege.map(e => {
    const titel = `${e.vorname} ${e.nachname}`
    const titelScore = scoreFromMatch(titel, query, 'titel')
    const emailScore = scoreFromMatch(e.email, query, 'id')
    const klasseScore = scoreFromMatch(e.klasse, query, 'subTitel')
    const score = Math.max(titelScore, emailScore, klasseScore)
    if (score === 0) return null
    return {
      quelle: 'schueler',
      id: e.email,
      titel,
      subTitel: `${e.klasse}${e.kurs ? ' · ' + e.kurs : ''}`,
      highlightStellen: findeHighlightStellen(titel, query, 'titel'),
      navigation: { route: SAMMELVIEW_ROUTE_BUILDERS.schueler(titel) + `&schueler=${encodeURIComponent(e.email)}` },
      score,
      iconKey: 'schueler',
    }
  }).filter((t): t is SucheTreffer => t !== null)
}
```

### 5.3 Type-Erweiterungen in `src/types/suche.ts`

```ts
export type SucheQuelle =
  | 'einstellungen-tab' | 'hilfe-tab' | 'kurs'
  | 'schueler'   // NEU C.2
  | 'pruefung' | 'uebung' | 'frage'

export type SucheIconKey = '…' | 'schueler' /* NEU */

export const QUELLEN_REIHENFOLGE: readonly SucheQuelle[] = [
  'einstellungen-tab', 'hilfe-tab', 'kurs',
  'schueler',  // NEU nach 'kurs'
  'pruefung', 'uebung', 'frage',
]

export const QUELL_LABEL: Record<SucheQuelle, string> = {
  …,
  schueler: 'Schüler',
}

export const ICON_MAP: Record<SucheIconKey, LucideIcon> = {
  …,
  schueler: Users,
}

export interface SucheIndex {
  …,
  schueler: KlassenlistenEintrag[]
}
```

### 5.4 Engine-Integration

`fuehreSucheAus` ergänzt:

```ts
const alle: SucheTreffer[] = [
  …,
  ...indexSchueler(query, index.schueler),
]
```

`useSucheIndex.ts` Hook erweitert um `useKlassenlistenStore`:

```ts
const schueler = useKlassenlistenStore(s => s.daten ?? [])
const index = useMemo(() => ({ …, schueler }), [/* deps */])
```

### 5.5 Permission

- **LP-Hook `useGlobalSuche.shared.ts`:** Schüler-Adapter im Index gewired.
- **SuS-Hook `useGlobalSucheSuS.ts`:** Schüler-Adapter NICHT gewired. SuS sieht nie andere Schüler.

### 5.6 Klassenlisten-Tab Pre-Fill-Wiring (parallel zu C.3 Pattern)

`KlassenlistenTab.tsx` implementiert das C.3-Pattern (`useSearchParams` → `initialSuche`/`initialSchueler` → State + Cleanup). Erweitert: zusätzlich `?schueler=<email>` für direktes Highlight.

### 5.7 Tests

- Unit `indexSchueler` 8 Cases: vorname-Match, nachname-Match, email-Match, klasse-Match, fuzzy-Match via C.5, F.4-Filter aktiv, leeres Array, score-fallthrough.
- Integration `KlassenlistenTab.test.tsx`: Filter funktioniert, Pre-Fill via URL, Schüler-Highlighting bei `&schueler=`.
- **Permission-Pflicht-Test `useGlobalSucheSuS.test.ts`:** Index-Objekt enthält keine `schueler`-Property. Test scheitert wenn Adapter versehentlich in SuS-Pfad gewired wird → Privacy-Schutz.
- E2E (preview): LP sucht "Müller" → Klick → Klassenlisten-Tab mit Müller highlighted + Filter "Müller" aktiv.

## 6. Phase 4 — C.4 Volltext-Toggle

### 6.1 UI-Erweiterung im Suche-Dropdown

Neuer Pill-Toggle "Volltext" rechts neben dem Such-Input:

```
┌──────────────────────────────────────────────┐
│ 🔍 [Suche …            ]  □ Volltext         │
├──────────────────────────────────────────────┤
│ Treffer ...                                  │
└──────────────────────────────────────────────┘
```

- Default: **OFF** (schnelle Phase-1-Suche)
- Toggle nicht URL-persistent, kein Cross-Session-Storage; resettet beim Surface-Wechsel
- Tooltip: "Sucht zusätzlich in Fragetext und Musterlösung. Langsamer."

### 6.2 Lazy-Daten-Loader

**Klick auf Toggle ON:**

1. `useFragenStore.getState().ladeAlleVollDaten(email)` (falls noch nicht geladen oder cached)
2. Quelle "Fragen" zeigt Spinner-State "Volltext wird vorbereitet … (1–2s)"
3. Nach Load: Adapter switch zu `indexFragenVolltext`
4. Cache pro Session, beliebig oft toggle-bar

**`useFragenStore.ladeAlleVollDaten()`** — Backend-Call der pro-Frage `FrageSummary` → `Frage` Vollobjekt nachlädt. **Voraussetzung:** Backend-Endpoint `ladeAlleFragenVollText(email)` muss existieren oder erweitert werden (Plan-Detail). Falls nicht: serieller Lade-Pfad pro Frage über `ladeFrageVoll(id)`.

### 6.3 Neuer Adapter `indexFragenVolltext`

```ts
export function indexFragenVolltext(query: string, fragen: Frage[]): SucheTreffer[] {
  return fragen.map(f => {
    // Bestehende Felder (Titel/ID/Tag/Thema)
    const basisScore = berechneBasisScore(f, query)  // Helper aus indexFragen extrahiert
    // PLUS Volltext-Felder
    const fragetextScore = scoreFromMatch(f.fragetext, query, 'subTitel')
    const loesungScore = f.musterlosung ? scoreFromMatch(f.musterlosung, query, 'subTitel') : 0
    const score = Math.max(basisScore, fragetextScore, loesungScore)
    if (score === 0) return null
    // Treffer-Snippet bei Volltext-Match
    const snippet = generiereSnippet(f.fragetext, query, 50)  // 50 chars Kontext
    return { …, subTitel: snippet, highlightStellen: findeHighlightStellen(snippet, query, 'subTitel'), score, … }
  }).filter(notNull)
}
```

`generiereSnippet(text, query, kontext)` Helper: findet erste Match-Stelle, schneidet ±kontext chars um Match, prependet "…" / appended "…" wenn beschnitten.

### 6.4 Engine-Integration

```ts
export function fuehreSucheAus(
  query: string,
  index: SucheIndex,
  opts?: { volltext?: boolean },
): SucheErgebnis {
  …
  const fragenAdapter = opts?.volltext
    ? indexFragenVolltext(query, index.fragenVoll ?? [])
    : indexFragen(query, index.fragen)
  …
}
```

`SucheIndex` erweitert um optionale `fragenVoll: Frage[]` (lazy-loaded).

### 6.5 Performance-Bounds

- **Min-Length** bei Volltext: query ≥ 3 Zeichen (sonst zu viele Matches).
- **Debounce:** 300ms statt 100ms im Volltext-Modus.
- **Worst-Case:** 1000 Fragen × 500 chars × `normalizeForSuche` ≈ 500k chars pro Keystroke. Mit Debounce auf 300ms → 3.3 calls/sec max. Akzeptabel.
- **Smoke-Test:** 1000 mock-Fragen × 5 Volltext-queries < 200ms.

### 6.6 Volltext-spezifische Treffer-Anzeige

- subTitel = Snippet statt `f.thema`
- Highlight im subTitel via `findeHighlightStellen(snippet, query, 'subTitel')`
- Icon bleibt `HelpCircle` (kein eigener iconKey für Volltext-Match)

### 6.7 Tests

- Unit `indexFragenVolltext` 10 Cases: snippet-zentriert, snippet-randständig, leere Lösung, exact-Titel-Priorität über Volltext-Match, Score-Branches, F.4-Filter.
- Unit `generiereSnippet` 5 Cases: leerer Text, Match am Anfang, Mitte, Ende, kein-Match-Fallback.
- Hook-Test `useGlobalSuche.shared` mit `volltextAktiv=true`: triggert `ladeAlleVollDaten`, switched Adapter.
- E2E (preview): Toggle ON → suche Begriff aus Fragetext → Snippet sichtbar; Toggle OFF → zurück zu Titel-Match-only.

## 7. Out-of-Scope (für separate Cluster)

| Out-of-Scope | Begründung |
|---|---|
| **Material-PDF-Volltext** | PDF-parse-Library nötig, Bundle-Size-Risiko |
| **Lückentext-Wörter / DragDrop-Labels Volltext** | Strukturierte Frage-Inhalte; eigenes Daten-Modell pro Typ |
| **Antwort-Optionen (MC-Frage-Choices) Volltext** | Wie Lückentext: typ-spezifisch, eigene Spec |
| **Filter-Operatoren** `fach:BWL`, `bloom:K3` | Query-Parser-Aufwand; eigene Spec |
| **Such-Historie** (zuletzt gesuchte Begriffe) | Persistenz-Frage; eigene Spec |
| **SuS-Schüler-Suche** | SuS sieht nie andere Schüler — Permission-Regel |
| **Backend-Volltext-Endpoint** | Frontend-only bleibt; Backend-Migration ist separate Architektur |
| **Mehrwort-AND/OR-Operatoren** | Bleibt wie heute: alle Tokens müssen matchen |
| **Worker-Migration für Volltext** | Eskalations-Pfad falls Smoke-Test < 200ms nicht haltbar |

## 8. Abhängigkeiten zwischen Phasen

```
C.5 (Fuzzy) ─────────────┐
                         │
C.3 (Pre-Fill 3 Surfaces)─┤
                         │
C.2 (Schüler + Tab) ←─ benötigt C.3-Pattern (Klassenlisten-Pre-Fill nutzt selbe Mechanik)
                         │
C.4 (Volltext) ───────────┤ — implizit nutzt C.5 (Fuzzy auch im Volltext-Modus)
```

- **C.5** unabhängig — kann standalone shippen.
- **C.3** unabhängig (3 Surfaces ohne Klassenlisten).
- **C.2** wartet auf C.3 (für Pre-Fill-Pattern-Anwendung im neuen Klassenlisten-Tab).
- **C.4** unabhängig (Toggle aufgepfropft, betrifft nur Fragen-Adapter).

## 9. Tests-Strategie (Zusammenfassung)

| Phase | Unit | Integration | Browser-E2E (preview) |
|---|---|---|---|
| C.5 | `levenshtein` 10 + `scoreFromMatch` Fuzzy 5 + Performance-Smoke | — | "bilantz" → "Bilanz" |
| C.3 | `SAMMELVIEW_ROUTE_BUILDERS` 6 | 3× Surface URL-Param + Cleanup | "Alle X Treffer in"-Click → Surface vor-gefiltert |
| C.2 | `indexSchueler` 8 + Permission-Test SuS-Hook | `KlassenlistenTab.test.tsx` Filter/Pre-Fill/Highlight | LP sucht Schüler → Tab + Highlight |
| C.4 | `indexFragenVolltext` 10 + `generiereSnippet` 5 + Performance-Smoke | Hook `volltextAktiv=true` Lazy-Load | Toggle ON → Snippet sichtbar |

**Erwartung:** +50 Unit + ~10 Integration. vitest-Wachstum: 1926 → ~1985.

## 10. Risiken + Mitigations

| Risiko | Mitigation |
|---|---|
| C.5 Fuzzy False-Positives | Threshold dist≤2 + min-length=3 + nur titel/id-Felder |
| C.3 URL-Param überschreibt aktiven Filter ungewollt | Mount-only `useEffect` + Param sofort `replace`-entfernt; Re-Mount-Pattern für Re-Click via lastSeenParam-Ref |
| C.2 Klassenlisten-Lade-Latenz blockiert Suche | Adapter zeigt leere Quelle bei `ladeStatus !== 'fertig'`, kein Crash |
| C.4 Volltext-Frage-Load erhöht Memory drastisch | Lazy + Session-Cache; reversibler Toggle |
| C.4 1000+ Fragen-Volltext zu langsam | Debounce 300ms + min-length=3 + Worker-Migration (OoS-Eskalation) |
| C.4 Backend-Endpoint `ladeAlleVollDaten` existiert nicht | **Hard-Plan-Decision vor C.4-Start:** entweder (a) Apps-Script-Batch-Endpoint hinzufügen ODER (b) Volltext-Universe auf "aktive Kurse" begrenzen. Serieller Per-Frage-Load über `ladeFrageVoll(id)` × 1000 = ~30 min Apps-Script-Latenz, daher NICHT akzeptabler Fallback (siehe code-quality.md Apps-Script-Latenz-Regel). |
| **C.2 SuS-Permission-Lapse: Schüler-Adapter leakt in SuS-Hook** | Privacy-Breach (SuS sieht andere Schüler). Mitigation: `useGlobalSucheSuS.ts` wired KEIN Schüler-Adapter. **Pflicht-Permission-Test** in §5.7 (Test: `useGlobalSucheSuS` Index enthält keine `schueler`-Property). Test scheitert wenn jemand das ändert. |

## 11. Abhängigkeiten zu anderen Clustern

- **Cluster F (Testdaten):** `filtereTestdatenWennDeaktiviert` in Klassenlisten-Tab + indexSchueler. **Voraussetzung erfüllt** (F.4 MERGED).
- **Cluster E (Tab-Registry):** Neuer Klassenlisten-Tab in `TAB_REGISTRY`. Auto-Pickup in Cluster-E-Surfaces (FavoritenPicker, etc.) durch Registry-Pattern. **Voraussetzung erfüllt** (E.1 MERGED).
- **Cluster G (Icon-System):** `Users`-Icon aus `lucide-react`. Direkt-Import konsistent mit Phase-1-Pattern. **Voraussetzung erfüllt**.
- **Cluster H (Tags):** `tagNamenFuerFrage` aus tagsStore unverändert genutzt. **Voraussetzung erfüllt** (H.3 MERGED).

## 12. Spec-Akzeptanz

- [ ] Section 1 (Übersicht) approved 17.05.2026
- [ ] Section 2 (C.5 Fuzzy) approved 17.05.2026
- [ ] Section 3 (C.3 Pre-Fill) approved 17.05.2026
- [ ] Section 4 (C.2 Schüler + Tab) approved 17.05.2026
- [ ] Section 5 (C.4 Volltext) approved 17.05.2026
- [ ] Section 6 (Tests + OoS) approved 17.05.2026

Brainstorming-Session 17.05.2026 mit DUY. Spec-Review folgt via spec-document-reviewer-Subagent.
