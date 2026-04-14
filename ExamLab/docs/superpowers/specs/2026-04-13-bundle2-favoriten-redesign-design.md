# Bundle 2: Favoriten-Redesign — Design Spec

> Datum: 13.04.2026
> Kontext: UX-Verbesserungen aus User-Test, Tasks N1 + N2

---

## Ziel

Die Favoriten-Verwaltung von einer manuell gepflegten Dropdown-Liste zu einer dynamischen App-Struktur umbauen. Gleichzeitig den Header vereinfachen: ⭐-Dropdown entfällt, neuer "Favoriten"-Tab ersetzt "Home".

## Änderungen

### 1. Route-Registry (`src/config/appNavigation.ts`) — NEU

Zentrale Konstante `APP_NAVIGATION` als Baumstruktur aller navigierbaren LP-Orte.

```typescript
interface NavigationsEintrag {
  pfad: string        // z.B. '/pruefung'
  label: string       // z.B. 'Prüfungsliste'
  icon: string        // Emoji, z.B. '📝'
  kinder?: NavigationsEintrag[]
  nurAdmin?: boolean  // Nur für Admins sichtbar (z.B. Admin-Tab)
}

const APP_NAVIGATION: NavigationsEintrag[] = [
  {
    pfad: '/pruefung',
    label: 'Prüfungsliste',
    icon: '📝',
    kinder: [
      { pfad: '/pruefung/tracker', label: 'Tracker', icon: '📊' },
      { pfad: '/pruefung/monitoring', label: 'Multi-Monitoring', icon: '👁️' },
    ]
  },
  {
    pfad: '/uebung',
    label: 'Übungsliste',
    icon: '🎯',
    kinder: [
      { pfad: '/uebung/durchfuehren', label: 'Durchführen', icon: '▶️' },
      { pfad: '/uebung/analyse', label: 'Analyse', icon: '📈' },
    ]
  },
  {
    pfad: '/fragensammlung',
    label: 'Fragensammlung',
    icon: '📚',
  },
  {
    pfad: '/einstellungen',
    label: 'Einstellungen',
    icon: '⚙️',
    kinder: [
      { pfad: '/einstellungen/profil', label: 'Profil', icon: '👤' },
      { pfad: '/einstellungen/lernziele', label: 'Lernziele', icon: '🎓' },
      { pfad: '/einstellungen/favoriten', label: 'Favoriten', icon: '⭐' },
      { pfad: '/einstellungen/admin', label: 'Admin', icon: '🔧', nurAdmin: true },
    ]
  },
]
```

- Statische Konstante, kein Performance-Impact
- Single Source of Truth für FavoritenTab-Baum
- Sowohl Knoten (`/pruefung`) als auch Blätter (`/pruefung/tracker`) als Favoriten setzbar

### 2. FavoritenTab-Umbau (`src/components/settings/FavoritenTab.tsx`)

Aktuell: Flaches Dropdown mit 9 hardcodierten Einträgen + Drag & Drop Liste.

Neu: Zwei Bereiche:

**Oben — Aktive Favoriten (sortierbar):**
- Bestehende @dnd-kit Drag & Drop Liste bleibt
- Zeigt alle aktiven Favoriten (Orte + Prüfungen/Übungen)
- Drag-Handle, Icon, Label, Typ-Badge, Löschen-Button

**Unten — App-Struktur (Baum):**
- Aufklappbare Baumansicht aus `APP_NAVIGATION`
- Pro Eintrag: Icon + Label + Stern-Toggle (⭐/☆)
- Oberkategorien aufklappbar (▶/▼), standardmässig eingeklappt
- Stern-Toggle ruft `toggleFavorit({ typ: 'ort', ziel: pfad, label })` auf
- Bereits favorisierte Einträge zeigen gefüllten Stern

Hardcodierte `APP_ORTE`-Liste in FavoritenTab wird durch `APP_NAVIGATION`-Import ersetzt.

### 3. Header-Umbau (`src/components/lp/LPHeader.tsx`)

Aktuell: Tabs `Prüfen | Üben | Fragensammlung` + ⭐-Dropdown rechts.

Neu:
- Tabs: **Favoriten | Prüfen | Üben | Fragensammlung**
- "Favoriten"-Tab nutzt **direkte Navigation** (`navigate('/favoriten')`), NICHT das `modus`/`onModusChange`-System — da `/favoriten` eine eigene Komponente rendert (nicht LPStartseite)
- ⭐-Dropdown + `FavoritenDropdown`-Komponente entfällt komplett
- ExamLab-Logo-Klick → `/favoriten` (statt `/home`)

### 4. Umbenennung Home → Favoriten

| Vorher | Nachher |
|--------|---------|
| Route `/home` | Route `/favoriten` |
| `src/components/lp/Home.tsx` | `src/components/lp/Favoriten.tsx` |
| `HomeFlow` in Router.tsx | `FavoritenFlow` in Router.tsx |
| Root-Redirect → `/home` | Root-Redirect → `/favoriten` |
| `navigiereZuHome()` in useLPNavigation.ts | `navigiereZuFavoriten()` |
| `'/home'` in AuthGuard.tsx | `'/favoriten'` |
| `'/home'` in LoginScreen.tsx | `'/favoriten'` |
| Kommentar in useLPRouteSync.ts | Aktualisieren |

Hinweis: Persisted Favoriten mit `ziel: '/home'` in localStorage sind harmlos (keine Nutzer in Produktion). Keine Migration nötig.

Inhalt der Komponente bleibt identisch:
- Favoriten-Karten (horizontal scrollbar)
- Offene Korrekturen
- Anstehende Prüfungen
- Letzte Prüfungen
- Letzte Übungen

### 5. Store (`src/store/favoritenStore.ts`)

Keine Änderungen nötig. Das bestehende Datenmodell (`Favorit` mit typ/ziel/label/icon/sortierung) unterstützt bereits alle Anforderungen.

## Nicht im Scope

- hashMigration.ts: Keine Anpassung nötig (keine Nutzer in Produktion)
- Stern-Icons auf Prüfungs-/Übungskarten: Existieren bereits in LPStartseite.tsx
- Favoriten für individuelle Fragen: Existiert bereits im Store-Modell

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/config/appNavigation.ts` | **NEU** — Route-Registry |
| `src/components/settings/FavoritenTab.tsx` | Umbau: Baum statt Dropdown |
| `src/components/lp/LPHeader.tsx` | Neuer Tab, ⭐-Dropdown weg |
| `src/components/lp/Home.tsx` → `Favoriten.tsx` | Umbenennung |
| `src/router/Router.tsx` | Route `/home` → `/favoriten`, HomeFlow → FavoritenFlow |
| `src/router/AuthGuard.tsx` | `'/home'` → `'/favoriten'` |
| `src/hooks/useLPNavigation.ts` | `navigiereZuHome` → `navigiereZuFavoriten`, Pfad anpassen |
| `src/hooks/useLPRouteSync.ts` | Kommentar aktualisieren |
| `src/components/LoginScreen.tsx` | Redirect nach LP-Login → `/favoriten` |
| `src/components/lp/LPStartseite.tsx` | Import-Pfad Home → Favoriten (falls referenziert) |

## Tests

- Bestehende `favoritenStore.test.ts` (7 Tests): Unverändert, kein Store-Umbau
- Manueller Browser-Test: Tab-Navigation, Baum-Toggles, Drag & Drop, Logo-Klick
