# Übungspools

Interaktive Fragesammlungen für den W&R-Unterricht. Jeder Pool ist eine JavaScript-Datei mit strukturierten Fragen, die in einer gemeinsamen Webapp (`pool.html`) laufen.

**Live:** https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/

## Architektur

```
pool.html              ← Gemeinsame Webapp (Fragelogik, UI, Fortschritt)
config/
  vwl_bip.js           ← Ein Pool = eine JS-Datei mit Fragen
  vwl_geld.js
  recht_or_at.js
  bwl_fibu.js
  ...
index.html             ← Übersichtsseite aller Pools
```

## Pools (27 Stück)

| Fachbereich | Pools |
|-------------|-------|
| **VWL** (11) | Bedürfnisse, Menschenbild, Markteffizienz, BIP, Konjunktur, Wachstum, Geld, Arbeitslosigkeit, Sozialpolitik, Steuern, Staatsverschuldung |
| **Recht** (10) | Einführung, Einleitungsartikel, Grundrechte, Personenrecht, Sachenrecht, OR AT, Arbeitsrecht, Mietrecht, Strafrecht, Prozessrecht |
| **BWL** (5) | Einführung, Unternehmensmodell, Strategie/Führung, Marketing, Fibu |
| **Informatik** (1) | Kryptographie |

## Fragetypen

- Multiple Choice (single/multi)
- Lückentext
- Zuordnung (Drag & Drop)
- Reihenfolge
- Wahr/Falsch
- Kurzantwort (mit Regex-Matching)

## LearningView-Integration

- **Als Weblink:** `pool.html?config=vwl_bip` — öffnet direkt den Pool
- **Als iFrame:** Aufgabentyp «Interaktiv extern» — sendet Score via `postMessage` (xAPI)
- **Deep-Link:** `pool.html?config=vwl_bip&topic=Nominales+vs+reales+BIP` — springt zu einem Thema

## Neuen Pool erstellen

Eine neue `.js`-Datei in `config/` anlegen, die das `poolConfig`-Objekt exportiert. Struktur siehe bestehende Pools oder den Claude-Skill «uebungspool».

## Features pool.html

### ✅ Implementiert
- **Farbschema pro Fachbereich:** `COLOR_SCHEMES` setzt `--c-primary` basierend auf `POOL_META.color`/`POOL_META.fach` (VWL=orange, BWL=blau, Recht=grün)
- **Light/Dark-Mode Toggle:** Sonne/Mond-Icon im Header (`.theme-toggle`), Modus per `localStorage` gespeichert
- **Suchfeld:** Textfeld im Startscreen (`.search-input`), filtert Fragen über Keywords/Titel
- **Lernziel-Anzeige:** Lernziele als Chips (`.chip-lz`), Button im Header (`headerLzBtn`), Overlay-Panel (`lz-mini-overlay`)
- **Multi-Pool-Modus:** `index.html` als Übersicht, `pool.html?config=a,b,c` lädt mehrere Pools gleichzeitig mit Topic-Prefixing
- **LearningView-Integration:** xAPI-Score via `postMessage`, Deep-Links mit `topic`-Parameter
- **Kompakter Header:** Scrollt zusammen bei Scrollen (`.app-header.compact`)
- **Fortschrittsanzeige:** Statistiken, Übungsfortschritt
- **Hilfe-System:** `help-content.html` als eingebundene Hilfeseite

### 🟡 Offene Feature-Ideen
- **Keywords/Tags pro Frage:** Neues `keywords`-Feld in Frage-Objekten für feinere Filterung (z.B. "Steuerparadies", "BNE", "Nachhaltigkeit")
- **Interdisziplinäre Filter:** Fragen über Fachbereichsgrenzen hinweg filtern (BNE, transversale Kompetenzen) — basiert auf Keyword-System
- **Lernziel→Fragen-Filter:** Klick auf Lernziel zeigt nur passende Fragen (aktuell: Anzeige, aber kein direkter Filter-Klick)
