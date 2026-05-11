---
title: Cluster B — Header-Redesign Fragensammlung (Sticky-Collapse + L2-Hover)
date: 2026-05-11
status: Spec-Review ausstehend
verwandt: Cluster E (Tab-Registry, Favoriten-Backend), Cluster G (Icons), Cluster A (Header-Styling-Tokens)
---

# Cluster B — Header-Redesign Fragensammlung

## 1. Zweck

Drei zusammenhängende Header-Verbesserungen:
- **Sticky-Collapse:** der Fragensammlung-Filter-Header (~200 px) bleibt heute beim Scrollen voll sichtbar und frisst viel Platz. Beim Scrollen soll er auf eine schmale Chip-Bar mit aktiven Filtern kollabieren.
- **Papierkorb als L2-Hover:** heute über `setModus('papierkorb')` versteckt erreichbar. Wird zu einem L2-Untermenü unter „Fragensammlung" analog Prüfen/Üben.
- **Logo vs. Favoriten-Trennung:** Logo führt zu Home/Dashboard, Favoriten-Button bleibt eigenständiger Quick-Access. Heute machen beide dasselbe.

Cluster B baut auf Cluster E (Favoriten-Backend, Tab-Registry) und Cluster G (Icon-System mit Lucide).

## 2. Begriffe

- **L1-Tabs:** Oberste Header-Navigation (Prüfen / Üben / Fragensammlung / Einstellungen).
- **L2-Hover-Menü:** Mouseover-getriggertes Dropdown unter einem L1-Tab. Heute für Prüfen, Üben, Einstellungen vorhanden.
- **Filter-Header:** Sub-Header der Fragensammlung mit Such-Feld, Filter-Dropdowns, Aktion-Buttons.
- **Sticky-Collapse:** Header-Pattern das beim Scrollen vom Voll-Zustand auf Slim-Zustand kollabiert.
- **Chip-Bar:** Slim-State des Filter-Headers — zeigt nur aktive Filter als entfernbare Chips.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **Logo → Home/Dashboard.** Trennung von Favoriten-Funktion. | Doppel-Funktion ist verwirrend, Logo bekommt klare Home-Semantik. |
| 2 | **Favoriten bleibt eigenständiger Header-Quick-Access.** Kein L2-Hover am Logo. | L2 am Logo wirkt fremd (Logo ist Anker, kein Tab). |
| 3 | **Papierkorb wird L2-Untermenü unter Fragensammlung.** 2 Einträge: „Fragensammlung" + „Papierkorb". | Discoverability erhöht, konsistent mit Prüfen/Üben/Einstellungen-Pattern. |
| 4 | **Sticky-Collapse: Chip-Bar mit aktiven Filtern** (Variante A). | Beste Balance Platz/Sichtbarkeit. User sieht jederzeit was gefiltert ist. |
| 5 | **Expand-Trigger:** Scroll-zurück-zum-Top, Klick in Chip-Bar (außerhalb von Chip-X), oder Klick „Filter erweitern"-Button. | Multiple Recovery-Pfade, niedriges Risiko des „Wo ist mein Header"-Confusions. |
| 6 | **Chip-X entfernt einzelnen Filter.** Komplettes „Reset"-Button bleibt im Voll-Header. | Granular im Slim-State, Bulk im Voll-State. |
| 7 | **Smooth Transition** mit Tailwind-Transitions (`transition-all duration-200`). | Keine Sprung-Animationen, professioneller Eindruck. |
| 8 | **„X von Y Fragen"-Counter** sichtbar in Slim-State. | Wichtige Information bleibt, auch ohne Voll-Header. |
| 9 | **Z-Index-Hierarchie:** App-Header `z-60`, Filter-Header `z-50`, Modals `z-70`. | Verhindert Overlapping, App-Header bleibt oben. |

## 4. Datenmodell / State

### 4.1 Filter-Header-State

Heute lebt der Filter-State im `useFragensammlungFilter` Hook (oder ähnlich). Cluster B fügt nur Display-State hinzu:

```ts
// Neuer Hook für Collapse-Verhalten (finale API)
function useFilterHeaderCollapse(scrollContainerRef: RefObject<HTMLElement>) {
  const [istKollabiert, setIstKollabiert] = useState(false);
  const [manuelleErweiterung, setManuelleErweiterung] = useState(false);
  useEffect(() => { /* scroll observer auf ref.current */ }, [scrollContainerRef]);
  return {
    istKollabiert: istKollabiert && !manuelleErweiterung,
    expand: () => setManuelleErweiterung(true),
  };
}
```

Hook bekommt Ref auf Scroll-Container (statt querySelector) — robuster gegen Render-Order und Lazy-Mount der VirtualisierteFragenListe.

### 4.2 L2-Tab-Registry Erweiterung (Cluster E)

Tab-Registry aus Cluster E bekommt L2-Einträge unter `fragensammlung`-Surface — Plan-Phase verifiziert genauen Registry-Schema.

## 5. Komponenten

### 5.1 Logo-Component Anpassung

In `src/components/shared/header/AppHeader.tsx` (vermutlich, Plan-Phase verifiziert):
- Logo-Element bekommt `<Link to="/home">` oder `setModus('startseite')`-Handler statt heute-Verhalten.
- Hover-State: subtle background, `cursor: pointer`.
- Falls heute kein dedizierter Home/Dashboard-Modus existiert: Plan-Phase entscheidet ob LP-Startseite (`/`) der Home-Anker ist oder ob ein neuer Modus eingeführt wird.

### 5.2 L2-Hover-Menü für Fragensammlung

In `src/components/shared/header/TabKaskade.tsx` (oder analog) — bereits existierende L2-Logic erweitern für Fragensammlung:

```tsx
// Tab-Registry liefert L2-Einträge:
{
  id: 'fragensammlung',
  surface: 'lp-top',
  titel: 'Fragensammlung',
  l2: [
    { id: 'fragensammlung-main', titel: 'Fragensammlung', route: '/fragensammlung' },
    { id: 'papierkorb',          titel: 'Papierkorb',     route: '/papierkorb', icon: 'Trash2' },
  ]
}
```

L2-Hover-UI ist bereits vorhanden (siehe Prüfen/Üben/Einstellungen) — Cluster B nur Daten ergänzen.

### 5.3 Sticky-Collapse-Filter-Header

`src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx`:

```tsx
function FragenBrowserHeader({ ... }) {
  const { istKollabiert, expand } = useFilterHeaderCollapse();
  const aktiveFilter = useAktiveFilterChips();

  if (istKollabiert) {
    return <SlimFilterBar
      chips={aktiveFilter}
      anzahlFragen={anzahlGefiltert}
      onErweitern={expand}
    />;
  }

  return <VollHeader {...} />;
}
```

### 5.4 `SlimFilterBar` Komponente (neu)

```tsx
<div className="sticky top-0 z-50 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-3 transition-all duration-200">
  <span className={TYPO.caption}>Filter:</span>
  {aktiveFilter.map(f => (
    <FilterChip key={f.id} label={f.label} onEntfernen={() => entferneFilter(f.id)} />
  ))}
  <span className={`${TYPO.caption} ml-2`}>· {anzahlFragen} Fragen</span>
  <button onClick={onErweitern} className="ml-auto text-xs ...">
    Filter erweitern <ChevronDown className="w-3.5 h-3.5 inline" />
  </button>
</div>
```

Bei `aktiveFilter.length === 0`:
- Slim-Bar zeigt nur „Keine Filter aktiv · 256 Fragen" + Erweitern-Button.
- Alternative: Slim-Bar komplett ausblenden — Plan-Phase entscheidet.

### 5.5 `FilterChip` (neu)

```tsx
<span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-200 px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5">
  {label}
  <button onClick={onEntfernen} aria-label={`${label} entfernen`}>
    <X className="w-3 h-3" />
  </button>
</span>
```

### 5.6 Scroll-Detector Hook

```tsx
function useFilterHeaderCollapse(opts: { scrollThreshold: number } = { scrollThreshold: 60 }) {
  const [istKollabiert, setIstKollabiert] = useState(false);
  const [manuelleErweiterung, setManuelleErweiterung] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('[data-scroll-container="fragensammlung"]');
    if (!scrollContainer) return;
    function handleScroll() {
      const scrolled = scrollContainer.scrollTop > opts.scrollThreshold;
      setIstKollabiert(scrolled);
      if (scrollContainer.scrollTop === 0) setManuelleErweiterung(false);
    }
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [opts.scrollThreshold]);

  return {
    istKollabiert: istKollabiert && !manuelleErweiterung,
    expand: () => setManuelleErweiterung(true),
  };
}
```

Wichtig: der korrekte Scroll-Container muss adressiert werden (Plan-Phase verifiziert: heute scrollt entweder die VirtualisierteFragenListe oder der Outer-Layout-Container).

### 5.7 Aktive Filter ableiten

```tsx
function useAktiveFilterChips(): FilterChipData[] {
  const filter = useFragensammlungFilter();
  const chips: FilterChipData[] = [];
  if (filter.suchtext)                  chips.push({ id: 'suche',     label: `Suche: ${filter.suchtext}`,           entferne: () => filter.setSuchtext('') });
  if (filter.fachbereich !== 'alle')    chips.push({ id: 'fach',      label: filter.fachbereich,                    entferne: () => filter.setFachbereich('alle') });
  if (filter.thema !== 'alle')          chips.push({ id: 'thema',     label: `Thema: ${filter.thema}`,              entferne: () => filter.setThema('alle') });
  if (filter.unterthema !== 'alle')     chips.push({ id: 'unterthema', label: `Unterthema: ${filter.unterthema}`,   entferne: () => filter.setUnterthema('alle') });
  if (filter.fragetyp !== 'alle')       chips.push({ id: 'typ',       label: `Typ: ${filter.fragetyp}`,             entferne: () => filter.setFragetyp('alle') });
  if (filter.bloom.length > 0)          chips.push({ id: 'bloom',     label: `Bloom: ${filter.bloom.join(', ')}`,  entferne: () => filter.setBloom([]) });
  if (filter.status !== 'alle')         chips.push({ id: 'status',    label: filter.status,                         entferne: () => filter.setStatus('alle') });
  if (filter.nurMitAnhang)              chips.push({ id: 'anhang',    label: 'mit Anhang',                          entferne: () => filter.setNurMitAnhang(false) });
  if (filter.quelle !== 'alle')         chips.push({ id: 'quelle',    label: filter.quelle === 'schule' ? 'Schule' : 'Privat', entferne: () => filter.setQuelle('alle') });
  return chips;
}
```

(Filter-Dimensionen aus heutigem `FragenBrowserHeader.tsx`-Audit; Plan-Phase verifiziert finale Feld-Namen).

## 6. UI-Spezifikation

### 6.1 Voll-Header (initialer State + nach Scroll-zurück-zum-Top)

Heutiger Header bleibt strukturell — nur Brand-Farben und Typografie-Tokens aus Cluster G/E übernehmen.

### 6.2 Slim-State (während Scrolling)

- Höhe: ~40-44 px (1 Zeile).
- Background: `bg-slate-100 dark:bg-slate-800` (selber Token wie Themen-Header aus Cluster A Bug 2).
- Border-Bottom: `border-slate-200 dark:border-slate-700`.
- Chips: Violet-Brand (`bg-violet-100`, siehe FilterChip).
- Counter rechts: `text-xs text-slate-500 dark:text-slate-400`.
- Erweitern-Button rechts: `text-xs` + ChevronDown-Icon.

### 6.3 Transition

- `transition-all duration-200 ease-in-out` für Slim/Voll-Wechsel.
- Höhe-Animation: **max-height-Trick** (Voll → `max-h-[400px]` oder höher, Slim → `max-h-12`). Tailwind-idiomatisch, keine neue Dependency. **Framer Motion ist Out-of-Scope** — würde nicht eingeführt nur für diese eine Komponente.

### 6.4 L2-Hover Fragensammlung

L2-Menü öffnet sich unter „Fragensammlung"-L1-Tab bei Hover. 2 Einträge:
- „Fragensammlung" (Default, ChevronRight oder kein Icon)
- „Papierkorb" (mit `Trash2`-Icon, vermutlich `text-slate-500`)

Optisch identisch mit existierenden L2-Menüs (Prüfen, Üben).

### 6.5 Logo

Logo wird klickbar:
- `<button onClick={navigiereZuHome}>` oder `<Link to="/">`.
- Hover: `bg-slate-100 dark:bg-slate-700` subtle.
- Tooltip: „Zur Startseite".

## 7. Migration

### Phase 1: Foundation
- `useFilterHeaderCollapse` Hook + `useAktiveFilterChips` Hook + `SlimFilterBar` + `FilterChip` Komponenten + Tests.

### Phase 2: Filter-Header-Integration
- `FragenBrowserHeader.tsx` integriert Slim/Voll-Switch.
- Scroll-Detector verkabeln.
- Visuelle Verifikation: Smooth-Transitions, kein Layout-Sprung.

### Phase 3: Tab-Registry-L2-Erweiterung
- Cluster-E-Tab-Registry um L2-Einträge für Fragensammlung erweitern (Papierkorb).
- TabKaskade rendert L2-Hover-Menü für Fragensammlung-Hover automatisch.

### Phase 4: Logo-Trennung
- Logo wird klickbar, navigiert zu Home.
- Falls Home-Modus noch nicht existiert: prüfen wo LP heute startet (Dashboard-Auswahl-Screen?) — das wird der Home-Anker.

### Phase 5: Cleanup + E2E
- Lint-Check: ungenutzte L2-Routes für Fragensammlung-Modus.
- Browser-E2E aller drei Sub-Features.

## 8. Edge-Cases & Fehlerfälle

- **Keine aktiven Filter:** Slim-Bar zeigt „Keine Filter aktiv · X Fragen" + Erweitern-Button. Alternative: Slim-Bar komplett ausblenden (Plan-Phase entscheidet via UX-Test).
- **Sehr viele aktive Filter:** Slim-Bar overflow-x-auto, scrollt horizontal. Counter und Erweitern-Button bleiben rechts fix.
- **Scroll-Position 0 mit aktivem manuell-Erweitern:** Beim Scroll-zurück-nach-Top wird `manuelleErweiterung` zurückgesetzt — beim erneuten Scroll kollabiert wieder normal.
- **Schnelles Scroll Hin und Her:** Debounce nicht nötig (transition handled), aber Plan-Phase visuell verifizieren.
- **Mobile/Touch:** Hover-Effects funktionieren nicht auf Touch. L2-Menü öffnet auf Click statt Hover. Plan-Phase prüft existing L2-Mobile-Verhalten.
- **Filter-Reset im Slim-State:** Heute gibt's „Filter zurücksetzen"-Button im Voll-Header. Im Slim-State: Erweitern-Button öffnet Voll-Header, Reset dort. Slim-Bar bekommt kein eigenes Reset-Button.
- **L2-Hover bei aktivem Tab:** Wenn User schon in Fragensammlung ist, Hover auf Fragensammlung-Tab zeigt L2 mit „Fragensammlung" (aktiv markiert) + „Papierkorb".
- **Logo-Klick als „Cancel":** User ist in Composer und klickt versehentlich Logo → könnte ungespeicherte Arbeit verlieren. Plan-Phase: prüfen ob Discard-Dialog bei unsaved changes existiert oder ergänzt werden muss.

## 9. Out-of-Scope

- **Mehr-stufige Filter (L3):** heute nicht geplant. Filter-Header bleibt 2-Zeilen-Layout im Voll-State.
- **Globale Suche-Erweiterung:** Cluster C behandelt das. Cluster B touch das Suchfeld im Filter-Header nicht über visuelle Anpassungen hinaus.
- **Drag-Reorder L2-Einträge:** L2-Reihenfolge ist registry-fix.
- **Mobile-First Header-Redesign:** Heutiges Mobile-Layout bleibt. Plan-Phase prüft dass Slim-State auch auf Mobile passt.
- **Sticky-Collapse für andere Surfaces** (Prüfen-Liste, Üben-Liste): heute nicht geplant. Wäre eigenständig.

## 10. Abhängigkeiten zu anderen Clustern

- **Cluster E (Konsistenz):** Voraussetzung. Tab-Registry liefert L2-Definitionen. Favoriten-Bar im Header konsumiert Backend-Favoriten (Cluster E Phase 4).
- **Cluster G (Icon-System):** Voraussetzung. Lucide-Icons für ChevronDown, X (Filter-Chip-Remove), Trash2 (Papierkorb), Brand-Farb-Tokens.
- **Cluster A (Bug-Fixes):** Bug 2 (Themen-Header-Style) etabliert das Sticky-Header-Pattern. Cluster B baut darauf für Slim-State auf.
- **Cluster C (Globale Suche):** Globale Suche im App-Header bleibt — Cluster C erweitert nur den Inhalts-Scope (Was wird durchsucht). Header-Layout wird nicht von Cluster B + C kollidieren.

## 11. Test-Strategie

### 11.1 Unit-Tests (Vitest)

- `useFilterHeaderCollapse`: scroll-getriggert kollabieren, manuelles Expand, reset bei scroll-to-top.
- `useAktiveFilterChips`: korrekte Ableitung pro Filter-Dimension, Filter-Entfernen aktualisiert State.
- `FilterChip` Snapshot.

### 11.2 Browser-E2E (Live-Backend, echte Logins)

1. **Logo-Klick:** Im Composer → Logo klicken → navigiert zu Home/Dashboard.
2. **Papierkorb L2:** Hover auf Fragensammlung-Tab → L2-Menü mit Papierkorb erscheint → Klick → Papierkorb-View öffnet.
3. **Sticky-Collapse:** Fragensammlung mit aktiven Filtern (BWL + Bloom K2-K3 + Ungeprüft) → scroll → Slim-Bar zeigt Chips → scroll-to-top → Voll-Header zurück.
4. **Chip-Entfernen:** Im Slim-State Chip „BWL × " klicken → Filter weg, Listen-Anzeige aktualisiert.
5. **Erweitern-Button:** Im Slim-State „Filter erweitern" klicken → Voll-Header expandiert (auch ohne Scroll-Reset). Voll-Header bleibt sichtbar bis User entweder scroll-zurück-zum-Top macht (resettet `manuelleErweiterung`) und dann wieder runter scrollt, oder die Seite verlässt. (Hook-Logik: `manuelleErweiterung` wird nur bei `scrollTop === 0` zurückgesetzt — siehe 5.6.)
6. **Keine aktiven Filter:** Reset-Button im Voll-Header → scroll → Slim-Bar zeigt nur „Keine Filter aktiv · 256 Fragen" + Erweitern.
7. **Console-Errors:** 0 in allen Schritten.

### 11.3 Visuelle Verifikation

- Vor/Nach-Screenshots: Filter-Header Voll-State, Slim-State, L2-Hover-Menü.
- Animations-Test: Slim ↔ Voll Transition smooth (kein Sprung).

## 12. Offene Punkte (vor Implementation klären)

- **Home/Dashboard-Modus:** existiert ein Modus für „LP-Startseite" oder muss er neu eingeführt werden? Plan-Phase prüft `useLPNavigationStore`.
- **Scroll-Container-Identifier:** Aktueller Scroll-Container muss klar adressierbar sein (z.B. via `data-scroll-container="fragensammlung"`). Plan-Phase fügt Attribut hinzu falls fehlt.
- **Smooth-Transition Höhe-Animation:** max-height-Trick vs Komponenten-Switch vs Framer Motion. Plan-Phase entscheidet basierend auf vorhandenen Patterns.
- **Mobile-L2-Verhalten:** Plan-Phase verifiziert existing Mobile-L2 (Hover vs Click) und passt Fragensammlung-L2 entsprechend an.
- **Slim-Bar bei keinen aktiven Filtern:** anzeigen oder ausblenden? Visual-Review in Plan-Phase.
- **Logo-Discard-Dialog:** prüfen ob unsaved-changes-Pattern existiert beim Logo-Klick (z.B. mitten im Composer).
