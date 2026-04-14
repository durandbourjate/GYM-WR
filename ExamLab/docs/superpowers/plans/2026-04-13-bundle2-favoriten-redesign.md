# Bundle 2: Favoriten-Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Favoriten-Verwaltung von Dropdown auf Baumstruktur umbauen, Header vereinfachen (⭐ weg, Tab "Favoriten" rein), Home→Favoriten umbenennen.

**Architecture:** Neue zentrale `APP_NAVIGATION`-Konstante als Single Source of Truth für alle navigierbaren Orte. FavoritenTab zeigt Baumansicht daraus. Header bekommt Tab "Favoriten" mit Direktnavigation (nicht via Modus-System). Alle `/home`-Referenzen werden zu `/favoriten`.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, @dnd-kit (bereits installiert)

**Spec:** `docs/superpowers/specs/2026-04-13-bundle2-favoriten-redesign-design.md`

---

## File Map

| Datei | Aktion | Verantwortung |
|-------|--------|---------------|
| `src/config/appNavigation.ts` | **NEU** | Route-Registry (Baumstruktur) |
| `src/components/lp/Home.tsx` → `Favoriten.tsx` | **Umbenennen** | Dashboard-Seite |
| `src/components/settings/FavoritenTab.tsx` | **Umbauen** | Baumansicht statt Dropdown |
| `src/components/lp/LPHeader.tsx` | **Ändern** | Tab "Favoriten", ⭐-Dropdown weg |
| `src/router/Router.tsx` | **Ändern** | Route `/home` → `/favoriten` |
| `src/router/AuthGuard.tsx` | **Ändern** | Redirect `/home` → `/favoriten` |
| `src/hooks/useLPNavigation.ts` | **Ändern** | `navigiereZuHome` → `navigiereZuFavoriten` |
| `src/hooks/useLPRouteSync.ts` | **Ändern** | Kommentar aktualisieren |
| `src/components/LoginScreen.tsx` | **Ändern** | LP-Redirect → `/favoriten` |
| `src/components/lp/vorbereitung/PruefungsComposer.tsx` | **Ändern** | `onHome` Prop entfernen |

---

## Task 1: Route-Registry erstellen

**Files:**
- Create: `src/config/appNavigation.ts`

- [ ] **Step 1: Datei erstellen**

```typescript
// src/config/appNavigation.ts

export interface NavigationsEintrag {
  pfad: string
  label: string
  icon: string
  kinder?: NavigationsEintrag[]
  nurAdmin?: boolean
}

/**
 * Zentrale Baumstruktur aller navigierbaren LP-Orte.
 * Single Source of Truth für FavoritenTab und Navigation.
 */
export const APP_NAVIGATION: NavigationsEintrag[] = [
  {
    pfad: '/pruefung',
    label: 'Prüfungsliste',
    icon: '📝',
    kinder: [
      { pfad: '/pruefung/tracker', label: 'Tracker', icon: '📊' },
      { pfad: '/pruefung/monitoring', label: 'Multi-Monitoring', icon: '👁️' },
    ],
  },
  {
    pfad: '/uebung',
    label: 'Übungsliste',
    icon: '🎯',
    kinder: [
      { pfad: '/uebung/durchfuehren', label: 'Durchführen', icon: '▶️' },
      { pfad: '/uebung/analyse', label: 'Analyse', icon: '📈' },
    ],
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
    ],
  },
]

/** Flache Liste aller Einträge (Knoten + Blätter) */
export function alleNavigationsEintraege(eintraege: NavigationsEintrag[] = APP_NAVIGATION): NavigationsEintrag[] {
  const result: NavigationsEintrag[] = []
  for (const e of eintraege) {
    result.push(e)
    if (e.kinder) result.push(...alleNavigationsEintraege(e.kinder))
  }
  return result
}
```

- [ ] **Step 2: tsc prüfen**

Run: `cd ExamLab && npx tsc -b`
Expected: Keine neuen Fehler (Datei wird noch nicht importiert)

- [ ] **Step 3: Commit**

```bash
git add src/config/appNavigation.ts
git commit -m "feat: Route-Registry APP_NAVIGATION als Single Source of Truth"
```

---

## Task 2: Home → Favoriten umbenennen (alle Referenzen)

**Files:**
- Rename: `src/components/lp/Home.tsx` → `src/components/lp/Favoriten.tsx`
- Modify: `src/router/Router.tsx`
- Modify: `src/router/AuthGuard.tsx:26`
- Modify: `src/hooks/useLPNavigation.ts:69-71,83`
- Modify: `src/hooks/useLPRouteSync.ts:73`
- Modify: `src/components/LoginScreen.tsx:29`

- [ ] **Step 1: Home.tsx umbenennen**

```bash
cd ExamLab && git mv src/components/lp/Home.tsx src/components/lp/Favoriten.tsx
```

- [ ] **Step 2: In Favoriten.tsx den Komponent umbenennen**

In `src/components/lp/Favoriten.tsx`:
- Zeile 12: `export default function Home()` ��� `export default function Favoriten()`
- Zeile 21: `navigiereZuHome` → `navigiereZuFavoriten`
- Zeile 78: `onHome={navigiereZuHome}` → `onHome={navigiereZuFavoriten}`

- [ ] **Step 3: Router.tsx aktualisieren**

In `src/router/Router.tsx`:
- Zeile 10: `const Home = lazy(...)` → `const Favoriten = lazy(() => import('../components/lp/Favoriten'))`
- Zeile 31: `'/home'` ��� `'/favoriten'`
- Zeile 75-80: `HomeFlow` → `FavoritenFlow`, `<Home />` → `<Favoriten />`
- Zeile 98: `path="/home"` → `path="/favoriten"`, `<HomeFlow />` → `<FavoritenFlow />`

- [ ] **Step 4: AuthGuard.tsx aktualisieren**

In `src/router/AuthGuard.tsx`:
- Zeile 26: `'/home'` → `'/favoriten'`

- [ ] **Step 5: useLPNavigation.ts aktualisieren**

In `src/hooks/useLPNavigation.ts`:
- Zeile 69: `navigiereZuHome` → `navigiereZuFavoriten`
- Zeile 70: `'/home'` → `'/favoriten'`
- Zeile 83: `navigiereZuHome` → `navigiereZuFavoriten`

- [ ] **Step 6: useLPRouteSync.ts aktualisieren**

In `src/hooks/useLPRouteSync.ts`:
- Zeile 73: Kommentar `// Home: /home` → `// Favoriten: /favoriten`

- [ ] **Step 7: LoginScreen.tsx aktualisieren**

In `src/components/LoginScreen.tsx`:
- Zeile 29: `'/home'` → `'/favoriten'`

- [ ] **Step 8: tsc + Tests**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: Alles grün (227 Tests)

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: Home → Favoriten umbenennen (Route, Komponente, alle Referenzen)"
```

---

## Task 3: FavoritenTab — Baum statt Dropdown

**Files:**
- Modify: `src/components/settings/FavoritenTab.tsx` (kompletter Umbau)

- [ ] **Step 1: FavoritenTab.tsx komplett umbauen**

Die bestehende Datei wird umgebaut. Oben: sortierbare Favoriten-Liste (Drag & Drop bleibt).
Unten: Baumansicht aus `APP_NAVIGATION` statt flachem Dropdown.

Kern-Änderungen:
- `APP_ORTE` (Zeile 20-32) entfällt — wird durch `APP_NAVIGATION` Import ersetzt
- Dropdown (`ortDropdownOffen`, Zeile 41, 91-120) entfällt — wird durch Baumansicht ersetzt
- `SortableFavoritItem` (Zeile 126-173) bleibt unverändert
- `typIcon` / `typLabel` (Zeile 175-193) bleiben

Neue Baumansicht-Komponente im selben File:
```typescript
import { APP_NAVIGATION, type NavigationsEintrag } from '../../config/appNavigation'

function NavigationsBaum({ istAdmin }: { istAdmin: boolean }) {
  const { toggleFavorit, istFavorit } = useFavoritenStore()

  return (
    <div className="space-y-1">
      {APP_NAVIGATION.map(eintrag => (
        <BaumEintrag
          key={eintrag.pfad}
          eintrag={eintrag}
          istAdmin={istAdmin}
          toggleFavorit={toggleFavorit}
          istFavorit={istFavorit}
        />
      ))}
    </div>
  )
}

function BaumEintrag({ eintrag, istAdmin, toggleFavorit, istFavorit, tiefe = 0 }: {
  eintrag: NavigationsEintrag
  istAdmin: boolean
  toggleFavorit: ReturnType<typeof useFavoritenStore>['toggleFavorit']
  istFavorit: ReturnType<typeof useFavoritenStore>['istFavorit']
  tiefe?: number
}) {
  const [offen, setOffen] = useState(false)
  const hatKinder = eintrag.kinder && eintrag.kinder.length > 0
  const istFav = istFavorit(eintrag.pfad)

  // Admin-Einträge nur für Admins
  if (eintrag.nurAdmin && !istAdmin) return null

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50"
        style={{ paddingLeft: `${8 + tiefe * 16}px` }}
      >
        {/* Aufklapp-Button oder Platzhalter */}
        {hatKinder ? (
          <button
            onClick={() => setOffen(!offen)}
            className="w-5 text-center text-slate-400 dark:text-slate-500 cursor-pointer text-xs"
          >
            {offen ? '▼' : '▶'}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Icon + Label */}
        <span className="text-sm">{eintrag.icon}</span>
        <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{eintrag.label}</span>

        {/* Stern-Toggle */}
        <button
          onClick={() => toggleFavorit({ typ: 'ort', ziel: eintrag.pfad, label: eintrag.label, icon: eintrag.icon })}
          className="text-lg leading-none cursor-pointer hover:scale-110 transition-transform"
          title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          {istFav ? '⭐' : '☆'}
        </button>
      </div>

      {/* Kinder (wenn aufgeklappt) */}
      {hatKinder && offen && eintrag.kinder!.map(kind => (
        <BaumEintrag
          key={kind.pfad}
          eintrag={kind}
          istAdmin={istAdmin}
          toggleFavorit={toggleFavorit}
          istFavorit={istFavorit}
          tiefe={tiefe + 1}
        />
      ))}
    </div>
  )
}
```

Im `FavoritenTab` selbst wird der alte Dropdown-Bereich (Zeile 90-120) ersetzt durch:
```tsx
{/* App-Struktur */}
<div>
  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">App-Ort hinzufügen</h3>
  <NavigationsBaum istAdmin={istAdmin} />
</div>
```

Hinweis: `istAdmin` muss als Prop an FavoritenTab durchgereicht werden (von EinstellungenPanel.tsx, wo `admin` bereits berechnet wird auf Zeile 23).

- [ ] **Step 2: EinstellungenPanel.tsx — istAdmin Prop durchreichen**

In `src/components/settings/EinstellungenPanel.tsx`:
Dort wo `<FavoritenTab />` gerendert wird, `istAdmin={admin}` als Prop hinzufügen.

- [ ] **Step 3: Beschreibungstext aktualisieren**

In `FavoritenTab.tsx`:
- Zeile 70: `"Favoriten erscheinen auf der Home-Seite."` → `"Favoriten erscheinen auf der Favoriten-Seite."`
- Zeile 75: `"Füge App-Orte unten hinzu"` bleibt passend

- [ ] **Step 4: tsc + Tests**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: Alles grün

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/FavoritenTab.tsx src/components/settings/EinstellungenPanel.tsx
git commit -m "feat: FavoritenTab mit Baumstruktur statt Dropdown"
```

---

## Task 4: Header — Tab "Favoriten" + ⭐-Dropdown entfernen

**Files:**
- Modify: `src/components/lp/LPHeader.tsx`
- Modify: `src/components/lp/Favoriten.tsx` (onHome Prop entfernen)
- Modify: `src/components/lp/LPStartseite.tsx` (onHome Prop entfernen)
- Modify: `src/components/lp/vorbereitung/PruefungsComposer.tsx` (onHome Prop entfernen)

**Verhaltensänderung:** Logo-Klick geht ab jetzt IMMER zu `/favoriten`, auch aus dem Composer heraus. Das ist gewollt — der "← Zurück"-Button existiert separat fürs Dashboard-Zurück. Logo = Startseite.

- [ ] **Step 1: LPHeader.tsx anpassen**

Änderungen:
1. **Tab "Favoriten" links hinzufügen:** Vor den bestehenden Tabs (Prüfen/Üben/Fragensammlung) einen neuen Tab "Favoriten" einfügen.
   - Der Tab nutzt `navigate('/favoriten')` direkt (NICHT `onModusChange`)
   - Import `useNavigate` und `useLocation` von react-router-dom hinzufügen
   - Aktiv-Zustand: `location.pathname === '/favoriten'`

2. **FavoritenDropdown entfernen:** Die gesamte ⭐/☆-Dropdown-Komponente entfernen (Button + Dropdown-Panel + State dafür).

3. **Logo-Klick → /favoriten:** Der ExamLab-Logo-Klick nutzt `navigate('/favoriten')` direkt.

4. **`onHome` Prop aus Props-Interface entfernen.**

- [ ] **Step 2: onHome Prop aus allen Aufrufern entfernen**

3 Dateien betroffen:
- `src/components/lp/Favoriten.tsx`: `onHome={navigiereZuFavoriten}` entfernen (Zeile ~78), `navigiereZuFavoriten` aus useLPNavigation()-Destructuring entfernen falls nicht mehr gebraucht
- `src/components/lp/LPStartseite.tsx`: `onHome={handleZurueck}` entfernen (ca. Zeile 412)
- `src/components/lp/vorbereitung/PruefungsComposer.tsx`: `onHome={onZurueck}` entfernen (ca. Zeile 329)

- [ ] **Step 3: tsc + Tests**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: Alles grün

- [ ] **Step 4: Build prüfen**

Run: `cd ExamLab && npm run build`
Expected: Build erfolgreich

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/LPHeader.tsx src/components/lp/Favoriten.tsx src/components/lp/LPStartseite.tsx src/components/lp/vorbereitung/PruefungsComposer.tsx
git commit -m "feat: Header Tab 'Favoriten' + Star-Dropdown entfernt"
```

---

## Task 5: Cleanup + FavoritenTab Texte in Favoriten.tsx

**Files:**
- Modify: `src/components/lp/Favoriten.tsx`
- Modify: `src/components/settings/FavoritenTab.tsx`

- [ ] **Step 1: FavoritenTab APP_ORTE-Reste aufräumen**

Prüfen dass keine Reste der alten `APP_ORTE`-Konstante oder des Dropdown-States übrig sind.

- [ ] **Step 2: Favoriten.tsx Texte prüfen**

- Zeile 70: Text `"Favoriten erscheinen auf der Home-Seite."` → korrekt anpassen falls noch nicht geschehen
- `navigiereZuHome` → `navigiereZuFavoriten` prüfen (sollte aus Task 2 erledigt sein)

- [ ] **Step 3: Finale Prüfung**

Run: `cd ExamLab && npx tsc -b && npx vitest run && npm run build`
Expected: Alles grün, Build OK

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: Cleanup nach Favoriten-Redesign"
```

---

## Zusammenfassung

| Task | Beschreibung | Geschätzte Dateien |
|------|-------------|-------------------|
| 1 | Route-Registry `appNavigation.ts` | 1 neu |
| 2 | Home → Favoriten umbenennen | 7 ändern |
| 3 | FavoritenTab Baumansicht | 2 ändern |
| 4 | Header Tab + ⭐ weg + onHome entfernen | 4 ändern |
| 5 | Cleanup | 2 prüfen |

**Reihenfolge:** 1 ��� 2 → 3 �� 4 → 5 (strikt sequentiell, da jeder Task auf dem vorherigen aufbaut)
