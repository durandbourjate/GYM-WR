# Deep Links, Home-Startseite & React Router — Design Spec

> ExamLab A1: Echte Deep Links + App-Strukturverzeichnis
> Datum: 2026-04-13
> Status: Genehmigt

---

## Zusammenfassung

ExamLab bekommt ein echtes Routing-System mit React Router (BrowserRouter). Die LP-Navigation wird von handgebautem Hash-Routing auf deklarative Routes umgestellt. SuS-Üben wird ebenfalls mit Routes versehen. Eine neue Home-Startseite bietet Favoriten, offene Korrekturen, anstehende und letzte Prüfungen/Übungen. Das Favoriten-System wird um App-Orte und Drag & Drop-Sortierung erweitert.

## Scope

- **In Scope:** LP-Routing (React Router), SuS-Üben-Routing, Home-Startseite, erweitertes Favoriten-System, Multi-Monitoring im Prüfungsdashboard
- **Out of Scope:** SuS-Prüfung (bleibt bei `?id=` Query-Parameter + In-Memory-State aus Sicherheitsgründen)

## Entscheidungen

| Entscheidung | Gewählt | Alternativen verworfen |
|---|---|---|
| Router-Typ | BrowserRouter (saubere URLs) | HashRouter (bestehend, aber weniger sauber) |
| Ansatz | React Router + lpNavigationStore ablösen | Minimaler Ausbau (zu kurzfristig), eigener Mini-Router (unnötig) |
| SuS-Routing | Ja, für Üben-Bereich | Nur LP (SuS profitieren ebenfalls) |
| Multi-Monitoring | Integriert in `/pruefung/monitoring` | Separater `?ids=`-Flow (umständlich) |
| GitHub Pages | `404.html`-Redirect-Trick | Hash-basiert (hässliche URLs) |
| DnD-Library | `@dnd-kit/core` | HTML5 DnD API (Touch-Probleme, siehe bilder-in-pools.md #18) |

---

## 1. Routing-Architektur

### BrowserRouter mit GitHub Pages

Da GitHub Pages kein Server-Side Routing unterstützt, wird eine `404.html` auf Repo-Root-Ebene erstellt die ExamLab-Pfade auf `index.html` umleitet. React Router übernimmt dann das clientseitige Routing.

**Base Path:** `/GYM-WR-DUY/ExamLab/` (aus `vite.config.ts`, Env-Variable `VITE_BASE_PATH`).

### Route-Struktur

Alle Pfade relativ zum Base Path (`/GYM-WR-DUY/ExamLab/`).

```
/                                  → Redirect zu /home (LP) bzw. /sus (SuS)
/login                             → Login-Screen

— LP-Bereich —
/home                              → Home-Startseite
/pruefung                          → Prüfungsliste
/pruefung/tracker                  → Prüfungs-Tracker
/pruefung/monitoring               → Multi-Monitoring (aktive Prüfungen auswählen)
/pruefung/:configId                → Prüfungs-Composer (bearbeiten)
/pruefung/:configId/korrektur      → Korrektur-Ansicht
/pruefung/:configId/monitoring     → Einzel-Monitoring
/uebung                            → Übungsliste
/uebung/durchfuehren               → Übung durchführen
/uebung/analyse                    → Analyse-Dashboard
/uebung/:configId                  → Übung bearbeiten
/fragensammlung                    → Fragenbank
/fragensammlung/:frageId           → Frage bearbeiten
/einstellungen                     → Einstellungen (Default-Tab)
/einstellungen/:tab                → Einstellungen-Tab (profil/lernziele/favoriten/admin)

— SuS-Bereich —
/sus                               → SuS-Startseite (Tabs Prüfen/Üben)
/sus/ueben                         → Üben-Dashboard
/sus/ueben/:themaId                → Übungssession zu Thema
/sus/ueben/ergebnis                → Ergebnis-Zusammenfassung
/sus/pruefung                      → Prüfungs-Flow (Query-Param ?id={id} bleibt)
/sus/korrektur/:pruefungId         → Korrektur-Einsicht

— Catch-all —
*                                  → Redirect auf /home (LP) bzw. /sus (SuS)
```

### Route-Reihenfolge (Konfliktvermeidung)

Statische Routes MÜSSEN vor parametrisierten Routes stehen, damit `/pruefung/tracker` nicht von `/pruefung/:configId` geschluckt wird:

```tsx
<Route path="pruefung">
  <Route index element={<PruefungsListe />} />
  <Route path="tracker" element={<Tracker />} />
  <Route path="monitoring" element={<MultiMonitoring />} />
  <Route path=":configId" element={<PruefungsComposer />} />
  <Route path=":configId/korrektur" element={<Korrektur />} />
  <Route path=":configId/monitoring" element={<EinzelMonitoring />} />
</Route>
```

Gleiches Pattern für `/uebung` (statisch `durchfuehren`, `analyse` vor `:configId`).

### Rollenbasierte Weiche (App.tsx)

```
Nicht eingeloggt      → /login (mit Return-URL-Preservation)
User.rolle === 'lp'   → LP-Routes (/, /home, /pruefung, ...)
User.rolle === 'sus'  → SuS-Routes (/sus, /sus/ueben, ...)
Unbekannte URL        → Redirect auf /home (LP) bzw. /sus (SuS)
Rollen-Mismatch       → Redirect auf rollen-spezifische Home
                        (SuS auf LP-Route → /sus, LP auf SuS-Route → /home)
```

### Auth Guard mit Return-URL

Wenn ein nicht-eingeloggter User eine Deep-Link-URL öffnet (z.B. Lesezeichen auf `/pruefung/abc123/korrektur`):
1. Redirect auf `/login?returnTo=/pruefung/abc123/korrektur`
2. Nach erfolgreichem Login: Redirect zur gespeicherten `returnTo`-URL
3. Fallback wenn `returnTo` fehlt oder ungültig: `/home` (LP) bzw. `/sus` (SuS)

### Ablösung lpNavigationStore

Der `lpNavigationStore` (~890 Zeilen) wird schrittweise abgebaut:

- **Entfernt:** `modus`, `ansicht`, `configId`, `frageId`, `listenTab`, `uebungsTab`, `bauHash()`, `navigiereZuHash()`, `aktualisiereHash()`, hashchange-Listener
- **Ersetzt durch:** `useParams()`, `useLocation()`, `useNavigate()` von React Router
- **Bleibt (umbenannt zu `useLPUIStore`):** Reiner UI-State (offene Panels, Scroll-Position, temporäre Filter)
- **Favoriten-Code** → wird in den bestehenden `useFavoritenStore` verschoben/erweitert (separate Zuständigkeit)

### Migration von `?id=` / `?ids=` Query-Parametern

- `?id={pruefungId}` (SuS-Prüfung): Bleibt, wird aber über `useSearchParams()` statt `URLSearchParams(window.location.search)` gelesen
- `?ids={id1},{id2}` (Multi-Monitoring): Wird obsolet → Route `/pruefung/monitoring` mit UI-basierter Auswahl
- `?demo=true|eltern`: Bleibt als Query-Param, gelesen via `useSearchParams()`
- `?reset=true`: Bleibt als Query-Param
- `?fach=...&thema=...`: Bleibt für SuS-Deep-Links, gelesen via `useSearchParams()`

### Hash-Bookmark-Migration

Bestehende Lesezeichen mit Hash-Routes (`#/pruefung/abc123`) werden einmalig migriert:

```typescript
// In App.tsx beim Start (einmalig):
if (window.location.hash.startsWith('#/')) {
  const path = window.location.hash.slice(1); // '#/pruefung/abc' → '/pruefung/abc'
  window.history.replaceState(null, '', basePath + path);
}
```

---

## 2. Home-Startseite (`/home`)

Standard-Einstieg für Lehrpersonen. Volle Breite, responsives Grid.

### Sektionen (von oben nach unten)

#### 2.1 Favoriten
- Horizontale Karten-Reihe, scrollbar bei vielen Einträgen
- Zwei Typen gemischt: **App-Orte** (z.B. "Fragensammlung", "Tracker") + **Inhalte** (z.B. "Prüfung Konjunktur 29c")
- Jede Karte: Icon/Emoji + Name + Typ-Badge (Ort/Prüfung/Übung/Frage)
- Klick navigiert direkt zum Ziel
- Default alphabetisch sortiert, per Drag & Drop umsortierbar (`@dnd-kit/core`)

#### 2.2 Offene Korrekturen
- Prüfungen mit Status "abgeschlossen" aber nicht fertig korrigiert
- Spalten: Prüfungsname, Kurs, Abgaben (z.B. "18/22 korrigiert"), Datum
- Klick → `/pruefung/:id/korrektur`

#### 2.3 Anstehende Prüfungen
- Prüfungen mit Datumsfeld in der Zukunft + Status Entwurf/Bereit
- Chronologisch sortiert
- Wenn kein Datum eingegeben bei Durchführung: Datum wird automatisch gesetzt

#### 2.4 Letzte Prüfungen (letzte 5)
- Name, Kurs, Status-Badge (Entwurf/Aktiv/Abgeschlossen/Korrigiert), Datum
- Klick → Composer oder Korrektur je nach Status

#### 2.5 Letzte Übungen (letzte 5)
- Name, Kurs, Status-Badge, Datum
- Klick → Übung bearbeiten

### Datenquellen

Alle aus bestehenden Stores/Backend: `usePruefungConfigStore`, `useUebungConfigStore`, `useFavoritenStore`. Keine neuen Backend-Endpoints nötig.

---

## 3. Favoriten-System

### Erweitertes Datenmodell

```typescript
interface Favorit {
  typ: 'ort' | 'pruefung' | 'uebung' | 'frage';
  ziel: string;         // Route-Pfad ('/fragensammlung') oder Config-ID ('abc123')
  label: string;        // Anzeigename
  icon?: string;        // Emoji optional
  sortierung: number;   // Drag & Drop Reihenfolge
}
```

### Favoriten setzen

1. **Stern-Icon in Listen** — Prüfungsliste, Übungsliste, Fragenbank haben ☆/★-Toggle pro Eintrag (teilweise bereits vorhanden)
2. **Einstellungen → Favoriten-Tab** (`/einstellungen/favoriten`):
   - Alle Favoriten als sortierbare Liste (Drag & Drop via `@dnd-kit`)
   - App-Orte hinzufügen: Dropdown mit allen verfügbaren Orten (Home, Prüfungsliste, Tracker, Fragensammlung, Übungsliste, Analyse, Durchführen, Einstellungs-Tabs)
   - Inhalt-Favoriten werden über Stern-Icons in den Listen gesetzt
   - Löschen per x-Button

### Backend

Bestehender Favoriten-Endpoint wird um `typ`, `ziel`, `label`, `sortierung` erweitert. Ein Sync-Call, kein neuer Endpoint. Favoriten-Management-Code wird aus `lpNavigationStore` in `useFavoritenStore` verschoben.

---

## 4. Multi-Monitoring

Bisher separater Flow über `?ids={id1},{id2},...`. Wird integriert in `/pruefung/monitoring`.

- Route `/pruefung/monitoring` zeigt Liste aktiver Prüfungen mit Checkboxen zur Auswahl
- Mehrere Prüfungen gleichzeitig auswählbar
- Live-Übersicht aller ausgewählten Prüfungen (bestehende `MultiDurchfuehrenDashboard`-Logik wiederverwendet)
- Einzelne Prüfung anklicken → `/pruefung/:configId/monitoring`

---

## 5. Migrations-Strategie

Schrittweise Migration in 5 Phasen. Jede Phase ist eigenständig deploybar.

### Phase 1 — React Router einrichten
- `react-router-dom` installieren
- `BrowserRouter` in `main.tsx` mit `basename={VITE_BASE_PATH}`
- `404.html` auf Repo-Root-Ebene (`_site/404.html`) — erkennt ExamLab-Pfade und leitet um
- `index.html`: Decoder-Script das den Query-Parameter zurück in `history.replaceState()` konvertiert
- Rollenbasierte Weiche in App.tsx mit Auth Guard + Return-URL
- Hash-Bookmark-Migration (einmaliger `#/...` → `/...` Redirect)
- `lpNavigationStore.navigiere()` als Wrapper um `useNavigate()` (Kompatibilitätsschicht)
- **Service Worker:** Version-Bump erzwingen um Stale-Cache nach Routing-Wechsel zu vermeiden

### Phase 2 — LP-Routes migrieren
- Jede Ansicht wird Route-Komponente
- `useParams()` ersetzt Store-State (`configId`, `frageId`)
- `bauHash()` / `navigiereZuHash()` / hashchange-Listener entfernen
- `lpNavigationStore` schrittweise abbauen
- `window.location.search` Zugriffe → `useSearchParams()` migrieren

### Phase 3 — Home-Startseite + Favoriten
- Route `/home` mit 5 Sektionen
- Default-Redirect `/` → `/home`
- Favoriten-Store erweitern (`typ: 'ort'`, `sortierung`)
- `@dnd-kit/core` installieren für Drag & Drop Sortierung
- Einstellungen: neuer Tab "Favoriten" (`/einstellungen/favoriten`)

### Phase 4 — SuS-Üben migrieren
- `useUebenNavigationStore` durch SuS-Routes ersetzen
- `/sus`, `/sus/ueben`, `/sus/ueben/:themaId`, `/sus/ueben/ergebnis`
- SuS-Startseite auf `/sus`

### Phase 5 — Aufräumen
- `lpNavigationStore` umbenennen zu `useLPUIStore`, auf reinen UI-State reduzieren
- Alte `?ids=`-Logik entfernen (Multi-Monitoring ist jetzt `/pruefung/monitoring`)
- Favoriten-Code in `useFavoritenStore` konsolidieren
- Tests für Route-Navigation (Unit-Tests für Route-Matching, Integration-Tests für Auth Guards)
- Browser-Test: Alle kritischen Pfade durchklicken
- Dokumentation aktualisieren (HANDOFF.md)

---

## 6. Technische Details

### GitHub Pages 404.html

Die `404.html` wird auf Repo-Root-Ebene platziert (`_site/404.html` im Build). Sie muss ExamLab-Pfade erkennen (Base Path `/GYM-WR-DUY/ExamLab/`) und an die ExamLab `index.html` weiterleiten. Andere Pfade (Unterrichtsplaner, Uebungen) dürfen nicht umgeleitet werden.

```html
<!-- 404.html (Repo-Root-Ebene) -->
<!DOCTYPE html>
<html>
<head>
  <script>
    var l = window.location;
    var base = '/GYM-WR-DUY/ExamLab/';
    // Nur ExamLab-Pfade umleiten
    if (l.pathname.startsWith(base)) {
      // Pfad nach Base als Query-Param encodieren
      var route = l.pathname.slice(base.length);
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        base + '?p=/' + route.replace(/&/g, '~and~') +
        (l.search ? '&q=' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    }
    // Andere Pfade: Standard 404
  </script>
</head>
<body>
  <h1>Seite nicht gefunden</h1>
  <p><a href="/GYM-WR-DUY/">Zur Startseite</a></p>
</body>
</html>
```

### index.html Decoder-Script

In ExamLab's `index.html` (vor dem React-Mount):

```html
<script>
  // 404.html Redirect decodieren
  (function() {
    var params = new URLSearchParams(window.location.search);
    var p = params.get('p');
    if (p) {
      var path = p.replace(/~and~/g, '&');
      var query = params.get('q');
      var url = window.location.pathname + (query ? '?' + query.replace(/~and~/g, '&') : '') + window.location.hash;
      window.history.replaceState(null, '', path + (query ? '?' + query.replace(/~and~/g, '&') : '') + window.location.hash);
    }
  })();
</script>
```

### Vite Dev Server

Vite unterstützt BrowserRouter im Dev-Modus nativ — `historyApiFallback` ist Standard für SPA. Die `navigateFallbackDenylist` im Workbox-Config muss geprüft werden, damit statische Assets (PDFs, Bilder) nicht vom SW abgefangen werden.

### Service Worker Cache-Invalidierung

In Phase 1: SW-Version in `vite.config.ts` (Workbox-Config) explizit hochzählen, damit der alte SW mit Hash-Routing-Logik durch den neuen ersetzt wird. `skipWaiting()` + `clientsClaim()` sicherstellen.

### Abhängigkeiten

- `react-router-dom` (neue Dependency)
- `@dnd-kit/core` + `@dnd-kit/sortable` (für Favoriten Drag & Drop, Phase 3)
