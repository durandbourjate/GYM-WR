# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `feature/lernplattform-phase7a`
**Phase:** 7a von 7 (Typen-Erweiterung + Pool-Konvertierung)
**Status:** Implementation abgeschlossen, 82 Tests gruen, Build gruen

### Verifikation (03.04.2026)

| Check | Status |
|-------|--------|
| `npx tsc -b` | OK |
| `npx vitest run` | 82 Tests gruen (10 Testdateien) |
| `npm run build` | OK (dist/ erstellt, 257 KB JS) |
| Pruefungstool Regression | 193 Tests gruen, tsc OK |
| Pool-Konvertierung | 26/26 Pools, 2360 Fragen, 0 fehlende Bilder |

---

## Phasen-Uebersicht

| Phase | Datum | Beschreibung | Tests |
|-------|-------|-------------|-------|
| 1 | 02.04 | Scaffolding + Auth + Gruppen | 17 |
| 2 | 03.04 | 8 Fragetypen + Uebungs-Engine | 39 |
| 3 | 03.04 | Mastery-System + Fortschritt | 64 |
| 4 | 03.04 | Admin-Dashboard (3-Ebenen) | 64 |
| 5 | 03.04 | Auftraege + Empfehlungen | 69 |
| 6 | 03.04 | Gamification + Kinder-UX | 82 |
| **7a** | **03.04** | **Typen-Erweiterung + Pool-Konvertierung** | **82** |

## Phase 7a (03.04.2026) — Typen-Erweiterung + Pool-Konvertierung

### Was wurde gemacht

| Task | Beschreibung |
|------|-------------|
| 1 | FrageTyp um 12 neue Typen erweitert (20 total, kein "code" — existiert nicht in Pools) |
| 2 | 12 neue AntwortTyp-Interfaces + FiBu/Bild/Gruppe-Hilfstypen |
| 3 | Konvertierungs-Script (`scripts/convertPools.mjs`) — vm.runInNewContext, Feld-Mapping |
| 4 | Syntax-Fix fuer fehlende Kommas in 9 Recht-Pools (Kommentar-Bloecke im Array) |
| 5 | 194 Pool-Bilder nach `public/pool-bilder/` kopiert (SVG + PDF) |
| 6 | Validierung: Keine Duplikat-IDs, alle Bild-Pfade aufgeloest |

### Pool-Konvertierung — Statistik

| Fach | Pools | Fragen |
|------|-------|--------|
| VWL | 11 | 1058 |
| Recht | 10 | 786 |
| BWL | 5 | 516 |
| **Total** | **26** | **2360** |

### Fragetypen-Verteilung (konvertiert)

| Typ | Anzahl | Komponente vorhanden? |
|-----|--------|----------------------|
| mc | 1019 | Ja |
| tf | 450 | Ja |
| fill | 251 | Ja |
| multi | 234 | Ja |
| open | 93 | **Nein** (Phase 7c) |
| sort | 76 | Ja |
| sortierung | 69 | Ja |
| calc | 56 | Ja |
| bildbeschriftung | 26 | **Nein** (Phase 7d) |
| dragdrop_bild | 26 | **Nein** (Phase 7d) |
| buchungssatz | 19 | **Nein** (Phase 7b) |
| hotspot | 10 | **Nein** (Phase 7d) |
| zeichnen | 9 | **Nein** (Phase 7e) |
| kontenbestimmung | 5 | **Nein** (Phase 7b) |
| tkonto | 5 | **Nein** (Phase 7b) |
| gruppe | 5 | **Nein** (Phase 7e) |
| bilanz | 4 | **Nein** (Phase 7b) |
| formel | 2 | **Nein** (Phase 7c) |
| pdf | 1 | **Nein** (Phase 7c) |

### Neue Dateien

- `Lernplattform/scripts/convertPools.mjs` — Pool-Konverter (Node.js)
- `Lernplattform/scripts/output/*.json` — Konvertierte Fragen (26 Einzel-JSONs + alle-fragen.json + statistik.json)
- `Lernplattform/public/pool-bilder/` — 194 Bilder (bwl/, recht/, vwl/)

### Architektur (nach Phase 7a)

```
Lernplattform/
├── src/
│   ├── types/fragen.ts     # 20 FrageTypen, 20 AntwortTypen, FiBu/Bild/Gruppe-Hilfstypen
│   └── ...                 # Alles andere unveraendert
├── scripts/
│   ├── convertPools.mjs    # Pool → Lernplattform-JSON Konverter
│   └── output/             # 2360 konvertierte Fragen
├── public/
│   └── pool-bilder/        # 194 SVG/PDF aus Uebungspools
```

---

## Was fehlt (naechste Phasen)

### Phase 7b: FiBu-Fragetypen (4 Komponenten, 33 Fragen)
- BuchungssatzFrage, TKontoFrage, BilanzFrage, KontenbestimmungFrage
- Shared KontenSelect-Dropdown
- Korrektur-Logik fuer alle 4 Typen

### Phase 7c: open + formel + pdf (96 Fragen)
- OpenFrage (Selbstbewertung + Musterantwort)
- FormelFrage (KaTeX, code-split)
- PdfFrage (iframe + Freitext/MC)

### Phase 7d: Bild-interaktive Typen (62 Fragen)
- HotspotFrage, BildbeschriftungFrage, DragDropBildFrage
- Shared BildContainer
- Touch: Tap-to-Select/Tap-to-Place (kein HTML5 DnD)

### Phase 7e: Gruppe + Zeichnen (14 Fragen)
- GruppeFrage (rekursive Sub-Fragen)
- ZeichnenFrage (Canvas, Pointer Events)

### Phase 7f: Apps Script Backend
- 11 Endpoints (Login, Gruppen, Fragen, Fortschritt, Auftraege)
- Sheets-Struktur (Registry + Fragenbank + Analytik)

### Phase 7g: Sheet-Import + E2E
- Upload-Script, Default-Gruppe, End-to-End-Verifikation

### Spaetere Verbesserungen
- Streak-Anzeige im Dashboard (UI vorhanden, Daten fehlen ohne Backend)
- Offline-Queue (Spec vorhanden, Implementation in spaeterer Phase)
- Diktat-Typ (Browser-TTS)
- Wortschatz/Konjugation-Typen fuer Sprachen
