# CLAUDE.md — Übungspools

Interaktive Fragesammlungen für W&R-Unterricht. Modulare Architektur: eine gemeinsame Webapp + Pool-Configs.

**Live:** https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/

## Architektur

```
pool.html              ← Gemeinsame Webapp (Fragelogik, UI, Fortschritt)
config/*.js            ← Je ein Pool = eine JS-Datei mit poolConfig-Objekt
index.html             ← Übersichtsseite aller Pools
analytics/             ← Dashboard + Apps Script für Auswertung
```

## Pools (27 Stück)

- VWL (11): Bedürfnisse, Menschenbild, Markteffizienz, BIP, Konjunktur, Wachstum, Geld, Arbeitslosigkeit, Sozialpolitik, Steuern, Staatsverschuldung
- Recht (10): Einführung, Einleitungsartikel, Grundrechte, Personenrecht, Sachenrecht, OR AT, Arbeitsrecht, Mietrecht, Strafrecht, Prozessrecht
- BWL (5): Einführung, Unternehmensmodell, Strategie/Führung, Marketing, Fibu
- Informatik (1): Kryptographie

## Fragetypen (21 Typen, TYPE_HANDLERS Registry)

**Basis:** mc, multi, tf, fill, calc, sort, open
**FiBu:** buchungssatz, tkonto, bilanz, kontenbestimmung
**Gruppe:** gruppe (verschachtelte Teilfragen)
**Reihenfolge:** sortierung (Pick-to-Order)
**Formel:** formel (LaTeX/KaTeX Live-Preview)
**Bild-interaktiv:** hotspot, bildbeschriftung, dragdrop_bild
**Komplex:** code (CodeMirror 5), zeichnen (Canvas), pdf (iframe + Freitext/MC)

Neue Typen hinzufügen: Handler-Objekt `{ render, buttons, restore, correctAnswer }` in `TYPE_HANDLERS` registrieren + TYPE_LABELS erweitern.

**CDN-Dependencies:** KaTeX (Formel), CodeMirror 5 (Code-Editor)

## LearningView-Integration

- **Weblink:** `pool.html?config=vwl_bip` → öffnet Pool direkt
- **Deep-Link:** `pool.html?config=vwl_bip&topic=Nominales+vs+reales+BIP` → springt zu Thema
- **iFrame:** Aufgabentyp «Interaktiv extern» → Score via `postMessage` (xAPI)

## Farbschema

`COLOR_SCHEMES` setzt CSS Custom Properties basierend auf `POOL_META.fach`:
VWL = orange, BWL = blau, Recht = grün (identisch mit Unterrichtsplaner)

## Neuen Pool erstellen

1. Neue `.js`-Datei in `config/` anlegen
2. `poolConfig`-Objekt exportieren (Struktur: siehe bestehende Pools)
3. Pool in `index.html` verlinken
4. Pushen → GitHub Pages deployed automatisch

## Workflow

Keine Build-Pipeline — statische Dateien, direkt auf GitHub Pages deployed.
Änderungen committen + pushen reicht.
