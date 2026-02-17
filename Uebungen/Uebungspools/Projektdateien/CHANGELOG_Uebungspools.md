# Changelog — Übungspools Wirtschaft und Recht

Alle wesentlichen Änderungen am Übungspool-System (Template, Übersichtsseite, Architektur).
Änderungen an einzelnen Config-Dateien (neue Fragen, Korrekturen) werden hier nicht aufgeführt.

---

## 2026-02-17 — Light/Dark Mode Toggle & Lückentext-Fix

**Betroffene Dateien:** `pool.html`, `index.html`

### Neue Funktion: Manueller Theme-Toggle
- 🌙/☀️ Button oben rechts im Header (pool.html und index.html)
- Klick wechselt zwischen Light und Dark Mode
- Einstellung wird per `localStorage` (`pool-theme`) gespeichert und über beide Seiten geteilt
- Ohne manuelle Auswahl folgt das Theme weiterhin der System-Einstellung (`prefers-color-scheme`)
- FOUC-Prävention: Inline-Script im `<head>` setzt die Klasse vor dem Rendern (kein Flackern)
- Print erzwingt immer Light Mode

### Bugfix: Lückentext im Dark Mode nicht lesbar
- `.fill-input` hatte im Dark Mode keine explizite Textfarbe → dunkle Schrift auf dunklem Hintergrund
- Neu: `color: var(--c-text)` für `.fill-input`, `.fill-input:focus`, `.fill-input.correct`, `.fill-input.wrong` im Dark Mode

### Technische Änderung: CSS-Architektur Dark Mode
- Dark-Mode-Styles von `@media(prefers-color-scheme:dark)` auf `html.dark`-Klasse umgestellt
- Betrifft alle Dark-Mode-Regeln in beiden Dateien
- Ermöglicht manuellen Override via JavaScript (Toggle) bei gleichzeitigem System-Fallback

---

## 2026-02-16 — Bildsupport in Fragen

**Betroffene Dateien:** `pool.html`

- Optionales `img`-Feld pro Frage (`img.src`, `img.alt`)
- Bild wird zwischen Fragetext und Antwortoptionen angezeigt
- Zoom-Funktion: Klick/Tap öffnet Vollansicht mit dunklem Overlay
- Bildunterschrift (`alt`) in Kursivschrift unter dem Bild
- Review-Ansicht: Bilder verkleinert dargestellt
- PDF-Export: Bilder mit begrenzter Höhe
- Bildordner-Struktur: `img/{fach}/{thema}/dateiname.png`

---

## 2026-02-15 — Deep-Links auf Unterthemen

**Betroffene Dateien:** `pool.html`

- URL-Parameter `&topic=KEY` öffnet direkt ein Unterthema
- Weitere Parameter: `&diff=`, `&type=`, `&start=1` (Quiz direkt starten)
- Parameter `&keys=1` zeigt Deep-Link-Übersicht mit kopierbaren Links für Lehrpersonen
- Mehrere Topics per Komma kombinierbar: `&topic=definition,kreislauf`

---

## 2026-02-14 — Klappbare Fachbereiche & Übersichtsseite

**Betroffene Dateien:** `index.html`

- Fachbereiche (VWL, BWL, Recht) als klappbare Sektionen mit Chevron-Pfeil
- Farbige Oberkante pro Fachbereich (Orange/Blau/Grün)
- Header zeigt Anzahl Pools und Gesamtzahl Fragen
- Fachbereiche mit Pools standardmässig offen, leere eingeklappt
- Sanfte CSS-Transition beim Auf-/Zuklappen

---

## 2026-02-14 — Modulare Architektur (pool.html + config/)

**Betroffene Dateien:** `pool.html`, `index.html`, `config/*.js`

### Architektur-Umstellung
- Trennung von Template (`pool.html`) und Inhalt (`config/*.js`)
- Ein universelles Template für alle Pools statt einzelner HTML-Dateien
- Config-Dateien werden per `fetch()` + URL-Parameter geladen
- `window.`-Deklaration für globale Variablen (POOL_META, TOPICS, QUESTIONS)

### Farbsystem
- Dynamische Fachbereichsfarben über `POOL_META.color`
- VWL: Orange (#f89907), BWL: Blau (#01a9f4), Recht: Grün (#73ab2c)
- Farben aus LearningView übernommen

### Neue Features
- Home-Button (🏠) im Header → Link zur Übersichtsseite
- Problem-Melden-Funktion (Report-Modal) mit Kategorien und Clipboard-Export
- Frage überspringen (Skip-Button)
- Fortschrittsbalken im Quiz
- LearningView-Integration via `postMessage` (xAPI-Score im Iframe-Modus)
- PDF-Export mit automatischer Rückkehr zum Startbildschirm

---

## 2026-02-13 — Dark Mode & Fachbereichsfarben

**Betroffene Dateien:** `pool.html` (damals noch Einzeldateien)

- Automatischer Dark Mode via `@media(prefers-color-scheme:dark)` (später auf Toggle umgestellt)
- Fachbereichs-Farbkonzept eingeführt (VWL=Orange, BWL=Blau, Recht=Grün)
- Symbole bei Schwierigkeitsgraden (⭐) und Fragetypen (📝, ✓✗, 📖, 🔢, 🔀, ✏️)
- Neuer Fragetyp: `open` (offene Kurzantwort mit Selbsteinschätzung)

---

## 2026-02-13 — Erstes Übungspool-System

**Betroffene Dateien:** Einzelne HTML-Dateien pro Pool

- Grundstruktur: Startbildschirm → Quiz → Auswertung
- Fragetypen: mc, tf, fill, calc, sort
- Filter nach Unterthema, Schwierigkeit, Fragetyp
- Modi: Fokus (sortiert) und Mix (zufällig)
- Sofortiges Feedback mit Erklärungen
- Erster Pool: VWL BIP (EWR GYM2)
