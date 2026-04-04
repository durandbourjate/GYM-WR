# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `main` (gemergt + gepusht)
**Phase:** 5+6 abgeschlossen + UI-Bugfixes (04.04.2026)
**Status:** 93 Tests grün, Build OK (323 KB JS + PWA)
**Apps Script:** Deployed, Registry-Sheet mit 8 Gruppen angelegt (Familie + 6 Gym + Test)

### Letzte Commits

| Commit | Beschreibung |
|--------|-------------|
| 41e26b1 | Duplikat-Dateien entfernt (macOS Kopien) |
| 827ac74 | 5 UI-Bugfixes (Dark Mode, Navigation, Umlaute, Ladezeit) |

### UI-Bugfixes (04.04.2026)

1. **Dark Mode Toggle** — `@custom-variant dark` in index.css (Tailwind CSS v4 class-basiert)
2. **Zurück/Home-Button während Übung** — Session wird genullt bevor Navigation, kein Effect-Loop mehr
3. **Gruppe wechseln** — `gruppeAbwaehlen()` im Store, Gruppenname im Header klickbar (bei >1 Gruppe)
4. **Umlaute** — 20+ UI-Texte korrigiert (ue→ü, ae→ä, oe→ö) in 10+ Dateien
5. **Gruppen-Ladezeit** — Mitglieder non-blocking im Hintergrund laden

### Verifikation

| Check | Status |
|-------|--------|
| `npx tsc -b` | OK |
| `npx vitest run` | 93 Tests grün |
| `npm run build` | OK (323 KB JS, 198 Precache-Einträge) |
| Preview Dark Mode | OK (Toggle, Farben, Persistenz) |
| Preview Umlaute | OK (Login, Dashboard, Zusammenfassung) |

---

## Offene Punkte

### Sofort testbar (nächster Schritt)

1. **Browser-Test mit echtem Login** — Login → Gruppen → Dashboard → Übung → Zurück/Home → Gruppe wechseln
2. **Dark Mode im echten Browser** — Toggle, Persistenz über Reload, System-Präferenz

### Offene Features

#### Pool.html-Features nachrüsten (Priorität: Mittel)
- Suchfeld, Lernziele-Modal, Hilfe-Modal, Problem-melden, Schnellstart-Karten, Filter-Chips

#### Shared Editor (Priorität: Hoch)
- FragenEditor aus Prüfungstool nach `packages/shared/` extrahieren
- ~12 Abhängigkeiten abstrahieren (authStore, apiService, KI-Assistent, Upload, etc.)
- EditorConfig für kontextabhängige Felder (Punkte, Bewertungsraster nur im Prüfungstool)
- Fragen erstellen/bearbeiten direkt in der Lernplattform

#### Prüfungstool Path Alias (Priorität: Niedrig)
- `Pruefung/tsconfig.app.json` + `vite.config.ts` auf @shared umstellen
- Re-Exports in Prüfung für Backward-Compatibility

#### Phase 7: Backend-Persistenz (Priorität: Mittel)
- AuftragStore: localStorage → Apps Script
- FortschrittStore: Backend-Sync vollständig (aktuell: IndexedDB + Offline-Queue, aber Backend-Endpoint noch nicht aufgerufen)

---

## Architektur-Überblick

### Stack
React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 (PWA)

### Kontext-System
- **Gym** (Sie-Form, sachlich) vs. **Familie** (Du-Form, ermutigend) via LernKontextProvider
- Rolle wird aus Gruppe abgeleitet (adminEmail → admin, sonst lernend)

### Daten-Flow
- Google Sheets via Apps Script Backend (14 Endpoints)
- Fragenbank: Sheets-basiert (pro Gruppe eigenes fragebankSheetId)
- Fortschritt: IndexedDB + Offline-Queue (Backend-Sync noch offen)
- Auth: Google OAuth + Code-Login

### Gruppen-Registry (Google Sheet)
8 Gruppen angelegt: Familie, sf-wr-29c, sf-wr-28bc29fs, sf-wr-27a28f, in-28c, in-29f, in-30s, test
