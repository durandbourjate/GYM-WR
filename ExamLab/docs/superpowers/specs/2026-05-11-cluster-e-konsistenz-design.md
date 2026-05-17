---
title: Cluster E — Konsistenz (Typografie / Favoriten / Hilfe-Tabs)
date: 2026-05-11
status: E.1 LIVE / E.2 ausgelagert in 2026-05-17-cluster-e-2-typografie-design.md / E.3-E.5 ausstehend
verwandt: Cluster F (Testdaten, LP-Settings-Backend), Cluster G (Icon-System), Cluster B (Header-Redesign)
---

> **Update 2026-05-17:** Foundation-Teile sind teilweise schon umgesetzt (TYPO-Tokens, Tab-Registry, favoritenStore-Type-Erweiterung). E.1 (HilfeSeite konsumiert Tab-Registry) ist LIVE. **E.2 (Typografie-Migration + Lint-Gate)** wurde in eine eigene Spec ausgelagert: `2026-05-17-cluster-e-2-typografie-design.md`. Diese Spec bleibt als Master-Vision für E.3-E.5 (Favoriten-Backend-Migration, Star-Toggle, Favoriten-Picker), die noch ausstehen.

# Cluster E — Konsistenz (Typografie / Favoriten / Hilfe-Tabs)

## 1. Zweck

ExamLab hat heute strukturelle Inkonsistenzen:
- **Typografie:** keine Skala, nur `text-xs`/`text-sm`/vereinzelt `text-lg`. EinstellungenPanel hat keinen Page-Titel, HilfeSeite schon. Tab-Headings sind als `<h3 text-sm>` zu klein für die Hierarchie-Ebene.
- **Hilfe-Tabs:** Reihenfolge unsortiert — „Prüfung erstellen" (Pos. 3) und „Durchführung" (Pos. 7) sind durch unrelated Tabs getrennt, obwohl sie zum gleichen Workflow gehören.
- **Favoriten-System:** Nur App-Orte/Prüfungen/Übungen favorisierbar, NICHT Einstellungen-Tabs oder Hilfe-Tabs. User hat gemeldet: „hier kann ich nicht alle tabs der einstellungen zu den favoriten hinzufügen. das sollte laufend aktualisiert werden, falls neue tabs entstehen." Außerdem leben Favoriten in localStorage statt im LP-Profil-Backend → keine Geräte-Sync.

Ziel: einheitliche Typografie-Skala, sinnvolle Hilfe-Tab-Reihenfolge, erweiterbares Favoriten-System mit Backend-Persistenz und zentraler Tab-Registry.

## 2. Begriffe

- **Tab-Registry:** Zentrale Definitionsdatei (`src/utils/tabRegistry.ts`) aller Tabs in ExamLab. Single source of truth für „welche Tabs gibt's?" — konsumiert von Tab-Renderern UND vom Favoriten-Picker.
- **Surface:** Logischer App-Bereich mit eigenem Tab-System (z.B. `einstellungen`, `hilfe`).
- **AppOrt:** Existierender Type für favorisierbare Lokationen (`{id, titel, screen, params, erstelltAm}`). Wird in Cluster E um `screen: 'einstellungen' | 'hilfe'` erweitert.
- **Typografie-Skala:** Fünf Tiers (Display / H1 / H2 / Body / Caption).
- **Star-Toggle:** Icon (Lucide `Star`) in jedem Tab-Header, schaltet Favoriten-Status für diesen Tab um.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | **5-Tier Typografie-Skala** (Display 24 / H1 20 / H2 18 / Body 14 / Caption 12). | Klare Hierarchie ohne Wildwuchs, Tailwind-natives Mapping. |
| 2 | **Hilfe-Tab-Reihenfolge Workflow-orientiert** statt unsortiert. Prüfung-Lifecycle (erstellen → durchführen → korrigieren) nebeneinander. | User-Feedback adressiert, kognitiv passender. |
| 3 | **Tab-Registry zentral** in `src/utils/tabRegistry.ts`. Tab-Renderer + Favoriten-Picker konsumieren beide. | Single source of truth, neue Tabs erscheinen automatisch im Picker. |
| 4 | **Favoriten erweitert:** Einstellungen-Tabs + Hilfe-Tabs zusätzlich zu Routes/Prüfungen/Übungen favorisierbar. | User-Anforderung, erweitert Quick-Access-Wert. |
| 5 | **Star-Icon in jedem favorisierbaren Tab.** Top-right Position, Toggle. | Discoverability — User sieht direkt wo er favorisieren kann. |
| 6 | **Favoriten-Backend-Migration:** localStorage → `LPProfil.favoriten: AppOrt[]`. Einmalige Migration beim ersten Login mit neuer Version. | Konsistent mit Cluster-F-Prinzip, Geräte-Sync. |
| 7 | **Page-Title-Pattern:** jede Top-Level-Seite (Einstellungen, Hilfe, etc.) hat genau einen Display-Titel oben links. | Verhindert die Inkonsistenz dass manche Seiten Header haben, andere nicht. |
| 8 | **Font-Family:** Tailwind-Default (`font-sans` = ui-sans-serif/system-ui). Keine Custom-Fonts. | Status quo, Plattform-natives Rendering. |

## 4. Datenmodell-Erweiterungen

### 4.1 `AppOrt` (`src/types/stammdaten.ts`)

```diff
 export interface AppOrt {
   id: string                          // Unique ID (generiert)
   titel: string                       // z.B. "SF WR 29c — Analyse"
-  screen: 'pruefung' | 'uebung' | 'fragensammlung'
+  screen: 'pruefung' | 'uebung' | 'fragensammlung' | 'einstellungen' | 'hilfe'
   params: Record<string, string>      // z.B. { configId: 'abc', tab: 'analyse' }
   erstelltAm: string                  // ISO timestamp
 }
```

`params` für Tab-Favoriten: `{ tab: 'profil' }` (Einstellungen) bzw. `{ tab: 'pruefung-erstellen' }` (Hilfe).

### 4.2 `LPProfil` (`src/types/stammdaten.ts`)

`LPProfil.favoriten?: AppOrt[]` existiert bereits als Type, wird aber heute nicht aktiv genutzt (Favoriten leben in localStorage). Cluster E aktiviert das Feld — keine Schema-Änderung.

### 4.3 `Favorit` (`src/store/favoritenStore.ts`)

```diff
 export interface Favorit {
-  typ: 'ort' | 'pruefung' | 'uebung' | 'frage'
+  typ: 'ort' | 'pruefung' | 'uebung' | 'frage' | 'einstellungen-tab' | 'hilfe-tab'
   ziel: string        // Route-Pfad, Config-ID oder Tab-ID
   label: string
   icon?: string
   sortierung: number  // Drag & Drop Ordnung
 }
```

**Verhältnis zu `AppOrt`:** `Favorit.typ` (Store-Diskriminator) und `AppOrt.screen` (Type-Discriminator des `AppOrt`-Records im Backend) sind redundant. Plan-Phase entscheidet:
- **Option A:** `AppOrt` bleibt einziges Schema. `Favorit` wird einfach `AppOrt`. Plan-Phase entfernt `Favorit`-Type, ersetzt durch `AppOrt`.
- **Option B:** Beide bleiben, mit klarer Mapping-Konvention `favorit.typ → appOrt.screen` (z.B. `'einstellungen-tab' → 'einstellungen'`).
- **Empfehlung:** Option A (Konsolidierung), reduziert Drift-Risiko.

### 4.4 ID-Naming-Konvention

Alle Tab-IDs (Registry-Keys) sind **kebab-case** (`pruefung-erstellen`, `ki-kalibrierung`). Konsistent mit Routen-Pfaden und mit Memory-Lehre `feedback_examlab_sprachkonvention` (Identifier ohne Umlaut).

## 5. Komponenten

### 5.1 Typografie-Tokens (`src/styles/typografie.ts` — neu)

```ts
export const TYPO = {
  display: 'text-2xl font-bold',          // 24 px / 700 — Page-Title
  h1:      'text-xl font-bold',           // 20 px / 700 — Tab-/Section-Title
  h2:      'text-lg font-semibold',       // 18 px / 600 — Sub-Section, Dialog-Title
  body:    'text-sm',                     // 14 px / 400 — Default-Content
  caption: 'text-xs font-medium',         // 12 px / 500 — Labels, Badges, Meta
} as const;
```

Verwendung:
```tsx
<h1 className={TYPO.display}>Einstellungen</h1>
<h2 className={TYPO.h1}>Mein Profil</h2>
<p className={TYPO.body}>...</p>
```

Tier-Regeln:
- **Display:** Genau 1× pro Top-Level-Seite (Einstellungen, Hilfe, Prüfen, Üben, Fragensammlung). Linke obere Ecke.
- **H1:** Tab-Haupttitel (z.B. „Mein Profil" innerhalb Einstellungen → Profil).
- **H2:** Klar abgesetzte Sub-Sektionen, Dialog-Titel, Karten-Header.
- **Body:** Default für alles andere.
- **Caption:** Small Labels, Form-Hints, Badge-Text.

### 5.2 Tab-Registry (`src/utils/tabRegistry.ts` — neu)

```ts
export type TabSurface = 'einstellungen' | 'hilfe';

export interface TabDefinition {
  id: string;                  // z.B. 'profil', 'pruefung-erstellen'
  surface: TabSurface;
  titel: string;               // Anzeigename
  route: string;               // Route oder Modal-Path
  /** Optional: nur sichtbar wenn Funktion true zurückgibt (z.B. Admin-Tab) */
  sichtbar?: (ctx: { istAdmin: boolean }) => boolean;
  /** Optional: Lucide-Icon-Name aus Cluster G */
  icon?: string;
}

export const TAB_REGISTRY: TabDefinition[] = [
  // Einstellungen
  { id: 'profil',            surface: 'einstellungen', titel: 'Mein Profil',         route: '/einstellungen/profil' },
  { id: 'lernziele',         surface: 'einstellungen', titel: 'Lernziele',           route: '/einstellungen/lernziele' },
  { id: 'favoriten',         surface: 'einstellungen', titel: 'Favoriten',           route: '/einstellungen/favoriten' },
  { id: 'problemmeldungen',  surface: 'einstellungen', titel: 'Problemmeldungen',    route: '/einstellungen/problemmeldungen' },
  { id: 'uebungen',          surface: 'einstellungen', titel: 'Übungen',             route: '/einstellungen/uebungen' },
  { id: 'fragensammlung',    surface: 'einstellungen', titel: 'Fragensammlung',      route: '/einstellungen/fragensammlung' },
  { id: 'testdaten',         surface: 'einstellungen', titel: 'Testdaten',           route: '/einstellungen/testdaten' }, // Cluster F
  { id: 'admin',             surface: 'einstellungen', titel: 'Admin',               route: '/einstellungen/admin',
                             sichtbar: ({ istAdmin }) => istAdmin },
  { id: 'ki-kalibrierung',   surface: 'einstellungen', titel: 'KI-Kalibrierung',     route: '/einstellungen/ki-kalibrierung' },

  // Hilfe (Workflow-Order)
  { id: 'einstieg',          surface: 'hilfe', titel: 'Erste Schritte',              route: '/hilfe/einstieg' },
  { id: 'fragen',            surface: 'hilfe', titel: 'Fragen & Fragensammlung',     route: '/hilfe/fragen' },
  { id: 'pruefung',          surface: 'hilfe', titel: 'Prüfung erstellen',           route: '/hilfe/pruefung' },
  { id: 'durchfuehrung',     surface: 'hilfe', titel: 'Durchführung',                route: '/hilfe/durchfuehrung' },
  { id: 'korrektur',         surface: 'hilfe', titel: 'Korrektur & Feedback',        route: '/hilfe/korrektur' },
  { id: 'ueben',             surface: 'hilfe', titel: 'Üben',                        route: '/hilfe/ueben' },
  { id: 'ki',                surface: 'hilfe', titel: 'KI-Assistent',                route: '/hilfe/ki' },
  { id: 'bloom',             surface: 'hilfe', titel: 'Bloom-Taxonomie',             route: '/hilfe/bloom' },
  { id: 'zusammenarbeit',    surface: 'hilfe', titel: 'Zusammenarbeit',              route: '/hilfe/zusammenarbeit' },
  { id: 'faq',               surface: 'hilfe', titel: 'FAQ',                        route: '/hilfe/faq' },
];

export function tabsFuerSurface(surface: TabSurface, ctx: { istAdmin: boolean }): TabDefinition[] {
  return TAB_REGISTRY.filter(t =>
    t.surface === surface && (t.sichtbar?.(ctx) ?? true)
  );
}
```

### 5.3 Star-Toggle in Tab-Header (`src/components/ui/TabStarToggle.tsx` — neu)

Kleine Komponente die in jedem Tab-Inhalt eingebunden wird (z.B. oben rechts neben dem H1-Tab-Titel).

```tsx
import { Star } from 'lucide-react'; // Cluster G

interface Props { tabId: string; surface: TabSurface }
export function TabStarToggle({ tabId, surface }: Props) {
  const { istFavorit, toggleFavorit } = useFavoritenStore();
  const aktiv = istFavorit({ typ: `${surface}-tab`, ziel: tabId });
  return (
    <button onClick={() => toggleFavorit(/* Favorit-Objekt */)}>
      <Star className={`w-5 h-5 ${aktiv ? 'fill-yellow-500 text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`} />
    </button>
  );
}
```

Integration: jedes Tab-Komponenten-Top hat:
```tsx
<div className="flex items-center justify-between mb-4">
  <h1 className={TYPO.h1}>{tab.titel}</h1>
  <TabStarToggle tabId={tab.id} surface={tab.surface} />
</div>
```

### 5.4 Favoriten-Backend-Adapter

#### Frontend (`src/store/favoritenStore.ts` Refactor)

Aktueller Store nutzt Zustand-`persist`-Middleware mit localStorage. Refactor:
- Entferne `persist`-Middleware.
- Lade Favoriten beim App-Start aus `LPProfil.favoriten` (via existierendem `stammdatenStore`).
- Schreibe Änderungen via debounced `speichereLPProfil()` zurück ins Backend.
- Migration-Hook (einmalig pro User pro Gerät): bei erstem Lauf nach Update
  1. Lese localStorage-Key `'examlab-favoriten'`.
  2. Wenn leer → nichts tun, lösche eventuellen Key.
  3. Wenn vorhanden → Merge-Regel: **Union per `id`-Match.** Falls Backend-Favorit und localStorage-Favorit dieselbe `id` haben → Backend gewinnt (jüngere `erstelltAm` wäre Alternative — Plan-Phase entscheidet). Backend-only und localStorage-only werden vereint.
  4. Commit das Merge-Resultat via `speichereLPProfil()`.
  5. Lösche localStorage-Key erst nach erfolgreichem Commit (sonst Datenverlust bei Backend-Fehler).

#### Backend (Apps-Script)

`LPProfil`-Persistenz funktioniert bereits über existierende `speichereLPProfil()`-API. Keine Backend-Änderung nötig — nur das `favoriten`-Feld wird jetzt aktiv geschrieben.

### 5.5 Favoriten-Picker-UI (`FavoritenTab.tsx` Erweiterung)

Im Favoriten-Tab gibt's einen „+ Favorit hinzufügen"-Button → öffnet einen Picker-Dialog:
- Tabs werden nach Surface gruppiert (Einstellungen, Hilfe).
- Jeder Tab erscheint mit Titel + Icon (aus Tab-Registry).
- Bereits favorisierte Tabs sind als „bereits hinzugefügt" gekennzeichnet (kein Doppel-Add).
- Auch existierende Surfaces (App-Orte, Prüfungen, Übungen) werden im Picker angezeigt — Picker ist single entry point statt mehrerer.

## 6. Migration

### Phase 1: Foundation
- Typografie-Tokens-Datei + Tab-Registry + erweiterte Favoriten-Types.
- Vitest für Tab-Registry-Filter (`tabsFuerSurface`), Favorit-Type-Discriminator.

### Phase 2: Typografie-Migration
- Auf jeder Top-Level-Seite (Einstellungen, Hilfe, Prüfen, Üben, Fragensammlung) einen Display-Titel ergänzen falls fehlend.
- Tab-Komponenten-Header: `<h3 text-sm>` durch `<h1 className={TYPO.h1}>` ersetzen.
- Sub-Sektion-Header auf `TYPO.h2`.
- **Lint-Regel `lint:typo-tokens`: ja, einführen.** Konsistent mit etablierten Lint-Pattern (`lint:no-alert`, `lint:wire-contract`, `lint:musterloesung`). Greppt nach Heading-Tags (`<h1`, `<h2`, `<h3`) deren `className` nicht eines der `TYPO.*`-Konstanten referenziert. Whitelist für gerechtfertigte Ausnahmen.

### Phase 3: Hilfe-Tab-Reihenfolge
- Tab-Definitions-Array `KATEGORIEN` in `src/components/lp/HilfeSeite.tsx` **wird durch Tab-Registry-Filter ersetzt** (verbindlicher Pfad, kein Either-Or). HilfeSeite konsumiert `tabsFuerSurface('hilfe', ctx)`. Single source of truth bleibt zwingend.
- Workflow-Order: Erste Schritte / Fragen / Prüfung erstellen / Durchführung / Korrektur / Üben / KI / Bloom / Zusammenarbeit / FAQ.
- Bestehende Hash-Links (`#einstieg`, `#korrektur` etc.) bleiben gleich (IDs sind preserved).

### Phase 4: Favoriten-Migration zu Backend
- `favoritenStore.ts` Refactor (siehe 5.4).
- Migration-Hook beim ersten App-Mount: localStorage → Backend (siehe 5.4).
- localStorage-Key löschen nach erfolgreichem Upload.
- Edge-Case-Test: User mit lokalen Favoriten aber Backend leer → Upload. User ohne lokale Favoriten aber Backend hat welche → Lade nur Backend.

### Phase 5: Star-Toggle in Tab-Headers
- `TabStarToggle` Komponente.
- Einbindung in alle 9 Einstellungen-Tab-Komponenten + 10 Hilfe-Tab-Komponenten.
- Favoriten-Tab-Picker zeigt neue Surfaces.

### Phase 6: Cleanup
- Existing `LPProfil.favoriten?: AppOrt[]` markieren als „aktiv genutzt seit Cluster E" (JSDoc).
- localStorage-Cleanup-Logik prüfen: nach Migration soll der Key `'examlab-favoriten'` nicht mehr existieren.

## 7. UI-Spezifikation

### 7.1 Page-Title-Pattern (Display)

Jede Top-Level-Seite zeigt ihren Namen oben links:
```tsx
<div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
  <h1 className={TYPO.display}>Einstellungen</h1>
</div>
```

Pro Tab-Inhalt darunter ein H1:
```tsx
<div className="px-6 pt-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className={TYPO.h1}>Mein Profil</h2>
    <TabStarToggle tabId="profil" surface="einstellungen" />
  </div>
  {/* tab content */}
</div>
```

### 7.2 Star-Toggle Visual

- Inaktiv: `Star` (outlined) in `text-slate-400`, hover `text-yellow-500`.
- Aktiv: `Star` (filled) in `text-yellow-500`.
- Größe `md` (20 px).
- Tooltip on hover: „Zu Favoriten hinzufügen" / „Aus Favoriten entfernen".

### 7.3 Favoriten-Picker

Modal-Dialog mit Tab-Bar oben (Surfaces) + scrollbare Liste der Tabs/Locations pro Surface. Suche nach Titel im Header des Modals.

## 8. Edge-Cases & Fehlerfälle

- **Tab-Registry-Drift:** Wenn ein Tab in Code gelöscht wird aber im Registry bleibt → Favoriten zeigen auf nicht-existente Route. Resolver muss „Tab nicht mehr vorhanden"-Hinweis zeigen statt zu crashen. Periodischer Self-Heal entfernt orphan Favoriten.
- **Migration-Race:** Wenn User auf zwei Geräten gleichzeitig erste Migration durchführt → Beide laden localStorage hoch. Backend muss Merge per `id`-Dedup machen (heutige `speichereLPProfil()`-API überschreibt komplett — Plan-Phase prüft).
- **localStorage-Persistenz nicht löschbar:** Wenn der Migration-Hook fehlschlägt (z.B. Backend-Offline), bleiben Favoriten in localStorage. Beim nächsten Erfolg sollen sie eingespielt werden. Retry-Pattern.
- **Admin-Tab Sichtbarkeit:** Tab-Registry hat `sichtbar`-Predicate. Picker filtert vor Anzeige, damit Non-Admins kein Admin-Tab favorisieren können.
- **Hilfe-Tab-Umordnung in HilfeSeite:** Bestehender Hash-Link `#korrektur` muss weiter funktionieren (User-Bookmarks). Registry-Order ändert nur Anzeige, IDs bleiben.
- **Page-Title doppelt:** Wenn eine Seite zwei H1 hat (versehentlich), wirkt's unstrukturiert. Lint-Regel prüft Single-H1-pro-Page-Pattern wo möglich.
- **Typografie-Tier-Missbrauch:** Plan-Phase soll alle existierenden Headings auf neue Skala migrieren, nicht parallel beide laufen lassen.

## 9. Out-of-Scope (für späteren Cluster oder eigenes Spec)

- **Tab-Verschiebbarkeit per Drag-and-Drop** (Reihenfolge in der Tab-Bar). Heute fixe Order.
- **Per-LP-Custom-Tab-Order** (jeder LP sortiert sich seine Tabs). Heute global.
- **Page-Title-Routes** (Display-Titel reagiert auf URL-Param). Heute statisch pro Surface.
- **Hilfe-Volltextsuche** (über Tab-Inhalte hinweg). Eigenständig.
- **Onboarding-Tour mit Star-Toggle-Highlight.** Heute reine Discoverability via Icon.

## 10. Abhängigkeiten zu anderen Clustern

- **Cluster F (Testdaten):** Testdaten-Tab wird in der Tab-Registry registriert (`id: 'testdaten'`, `surface: 'einstellungen'`). Sichtbar für alle LPs, Aktionen nur für Admins (Predicate-Logik im Tab-Content, nicht in Registry).
- **Cluster G (Icon-System):** Star-Toggle nutzt Lucide-`Star`. Tab-Registry hat optional `icon`-Feld für künftiges Tab-Icon-Mapping. Typografie-Skala und Icon-Größen-Skala teilen Tier-Konzept (md / lg).
- **Cluster B (Header-Redesign):** Favoriten-Bar im Header (heute bereits da) konsumiert aus dem Backend-Favoriten-Store statt localStorage nach Migration. L2-Hover-Menüs zeigen Favoriten dynamisch. **Reihenfolge:** Cluster E muss vor Cluster B implementiert werden — sonst baut Cluster B auf localStorage-Favoriten und müsste danach migrieren.
- **Cluster C (Globale Suche):** Suche kann Tab-Registry nutzen um Einstellungen/Hilfe-Tabs als Treffer anzubieten. Single source of truth = Registry.

## 11. Test-Strategie

### 11.1 Unit-Tests (Vitest)

- `TAB_REGISTRY` — alle Einträge haben unique `id` pro Surface (Snapshot-Test).
- `tabsFuerSurface()` — filtert korrekt nach Surface + Admin-Predicate.
- `TYPO`-Konstanten — Snapshot-Test gegen Spec (Schutz vor versehentlichen Änderungen).
- Favoriten-Store: Backend-Adapter speichert + lädt korrekt, Migration-Hook idempotent.

### 11.2 Browser-E2E (Live-Backend, echte Logins)

1. LP-Login: jede Top-Seite (Einstellungen, Hilfe, etc.) zeigt Display-Titel oben.
2. Hilfe-Seite: Tab-Reihenfolge entspricht Spec, Prüfung erstellen + Durchführung + Korrektur nebeneinander.
3. Einstellungen → Profil: Star-Toggle klickbar, fügt zu Favoriten hinzu, Header-Favoriten-Bar zeigt den neuen Eintrag.
4. Favoriten-Tab → „+ Favorit hinzufügen": Picker zeigt alle Tabs aus Registry, gruppiert nach Surface.
5. Verifizieren: Favorit wurde im Backend gespeichert (Re-Login zeigt selben Favoriten).
6. Migration: Bei einem LP-Account der heute localStorage-Favoriten hat → einmaliger Mount migriert sie ins Backend, localStorage-Key gelöscht.

### 11.3 Visuelle Verifikation

- Vor/Nach-Screenshots der Einstellungen-Seite + Hilfe-Seite mit neuer Typografie.
- Tab-Star-Toggle-States (aktiv/inaktiv/hover).

## 12. Offene Punkte (vor Implementation klären)

- **Backend-API für `LPProfil`-Update:** Existiert `speichereLPProfil()` als Partial-Update oder Full-Object? Plan-Phase prüft. Falls Full-Object: Concurrent-Update-Race-Risiko bei Two-Device-Sync.
- **Existing Hash-Links für Hilfe-Tabs:** Sind sie irgendwo dokumentiert oder verlinkt? Plan-Phase greppt nach `#einstieg`, `#korrektur` etc. im Code + in Hilfe-Inhalten.
- **Storybook für Typografie-Galerie:** Falls Cluster G's Storybook-Setup beschlossen wird, hier ebenfalls eine `Typografie.stories.tsx` mit allen 5 Tiers anlegen.
- **Lazy-Load-Bug Übungen-Tab (Cluster A):** Audit zeigt: `ladeGruppen()` läuft nur bei AdminSettings-Mount. Cluster A löst das durch globalen Load-on-App-Start. Cluster E touch das nicht, aber Plan-Phase soll bestätigen dass Cluster-A-Fix nicht mit Cluster-E-Refactor von Tab-Komponenten kollidiert.
