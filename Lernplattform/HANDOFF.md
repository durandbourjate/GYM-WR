# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `fix/lernplattform-bugs` (NICHT auf main gemergt — User muss zuerst testen + freigeben)
**Phase:** 1+3+4 abgeschlossen, Phase 5-7 offen
**Status:** Bug-Fixes + Navigation/AppShell + Quiz-Screen Umbau

### Was in dieser Session gemacht wurde (03.04.2026, Abend-Session)

| Commit | Beschreibung |
|--------|-------------|
| c6b6038 | Fix Sort/Sortierung/Bilder/Fill-Platzhalter + 148 Duplikate |
| 86eb144 | NavigationStore + AppShell + Theme-Toggle + Faecher collapsed |
| 8c70674 | Quiz-Screen Umbau (pool.html-Features) + Ergebnis-Review |

### Verifikation

| Check | Status |
|-------|--------|
| `npx tsc -b` | OK |
| `npx vitest run` | 82 Tests gruen |
| `npm run build` | OK (313 KB JS) |
| SortFrage | 76 Fragen mit Text + Kategorien (vorher leer) |
| SortierungFrage | 69 Fragen mit Texten (vorher nur Zahlen) |
| Bilder | 206 Bilder laden korrekt (resolveAssetUrl + BASE_URL) |
| Fill-Platzhalter | {0} durch ___ ersetzt |
| Navigation | Stack-basiert, Zurueck ueberall, keine Sackgassen |
| AppShell Header | Home, Admin-Button, Theme-Toggle, Abmelden |
| Faecher | Default collapsed im Dashboard |
| Quiz-Screen | Badges, Zurueck, Ueberspringen, Unsicher, Keyboard-Shortcuts |
| Ergebnis-Screen | Score, Badges, aufklappbarer Review, Nochmal-ueben |
| Browser-Test | Demo-Modus verifiziert (Kind + Elternteil) |

---

## Offener Plan (Phasen 5-7)

Vollstaendiger Plan: `~/.claude/plans/enumerated-shimmying-kurzweil.md`

### Phase 5: Kontext-Trennung Gym vs. Familie [L]
- LernKontextProvider (React Context): typ, anrede (du/Sie), feedbackStil
- Anrede-System: Textbausteine mit Sie/Du-Varianten
- Themen-Filterung pro Gruppe (sichtbare Faecher)
- Unterschiedliches Feedback (sachlich vs. ermutigend)

### Phase 6: Admin-Settings-Panel [L]
- GruppenEinstellungen Interface (Faecher, Farben, Anrede, Fragetypen)
- Settings-UI im Admin-Dashboard (Allgemein, Faecher, Farben, Mitglieder)
- Dynamische Fachbereich-Farben (nicht hardcoded)
- Backend: lernplattformLadeEinstellungen/SpeichereEinstellungen

### Phase 7: Backend-Persistenz [L]
- FortschrittStore: localStorage → Apps Script
- AuftragStore: localStorage → Apps Script
- SettingsStore: localStorage → Apps Script
- Offline-Queue fuer fehlgeschlagene Writes

### Noch nicht begonnen: Shared Library (Phase 2)
- packages/shared/ mit FrageText, KontenSelect, Utils, Types
- TypeScript Path Alias in beiden Projekten
- User will Code-Sharing zwischen Pruefungstool + Lernplattform

---

## User-Feedback aus Test-Session (03.04.2026)

### Fundamentale Anforderungen (noch offen):
1. **Gym-Seite soll wie pool.html funktionieren** — Alle Features: Suche, Lernziele, Hilfe, Problem melden, Schnellstart. Aktuell: Grundstruktur da (Header, Nav, Feedback), aber noch NICHT alle pool.html-Features.
2. **Familie-Seite** — Ermutigenderes Feedback, Du-Anrede, einfachere Typen. Noch NICHT implementiert.
3. **Admin-Settings** — Faecher, Farben, Mitglieder im Tool konfigurieren. Noch NICHT implementiert.
4. **Fachbereich-Farben konfigurierbar** — Nicht hardcoded wie in pool.html. LP waehlt Farbe. Noch NICHT implementiert.
5. **Pool.html Features noch fehlend:** Suchfeld, Lernziele-Modal, Hilfe-Modal, Problem-melden-Modal, Schnellstart-Karten, Filter-Chips (Tags), Keyboard 1-4 fuer MC

### Architektur-Entscheide (vom User bestaetigt):
- Shared Library erstellen (nicht pragmatisch kopieren)
- Gleiche Funktionen wie pool.html reichen (nicht pixel-genau)
- Settings-Speicher: Ich entscheide (JSON in Gruppen-Registry geplant)

---

## Neue Dateien in dieser Session

```
src/store/navigationStore.ts          — Stack-basierte Screen-Navigation
src/hooks/useTheme.ts                 — Dark/Light Mode Toggle
src/components/layout/AppShell.tsx     — Zentraler Header-Wrapper
src/components/uebung/QuizHeader.tsx   — Fortschritt + Badges
src/components/uebung/QuizNavigation.tsx — Zurueck/Skip/Weiter
src/components/uebung/QuizActions.tsx  — Beenden + Unsicher
src/components/uebung/FeedbackPanel.tsx — Richtig/Falsch Feedback
src/utils/assetUrl.ts                 — resolveAssetUrl() fuer Bilder
src/utils/fragetext.ts                — bereinigePlatzhalter()
```

## Geaenderte Dateien

```
scripts/convertPools.mjs     — Sort/Sortierung/Bild-Pfad Fixes
src/App.tsx                   — NavigationStore + AppShell
src/components/Dashboard.tsx  — Faecher collapsed, Header entfernt
src/components/UebungsScreen.tsx — Komplett umgebaut (Unterkomponenten)
src/components/Zusammenfassung.tsx — Review + Unsicher/Uebersprungen
src/components/admin/AdminDashboard.tsx — Redundanter Header entfernt
src/store/uebungsStore.ts    — Zurueck, Skip, Unsicher, Score
src/types/uebung.ts          — unsicher, uebersprungen, score Felder
src/components/fragetypen/shared/BildContainer.tsx — resolveAssetUrl
src/components/fragetypen/ZeichnenFrage.tsx — resolveAssetUrl
src/components/fragetypen/PdfFrage.tsx — resolveAssetUrl
```
