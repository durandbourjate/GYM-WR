# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `feature/lernplattform-phase7a`
**Phase:** 7a–7e abgeschlossen (Typen + Konvertierung + alle 22 Komponenten)
**Status:** Alle Fragetypen implementiert, 82 Tests gruen, Build gruen

### Verifikation (03.04.2026)

| Check | Status |
|-------|--------|
| `npx tsc -b` | OK |
| `npx vitest run` | 82 Tests gruen (10 Testdateien) |
| `npm run build` | OK (dist/ 299 KB JS) |
| Pruefungstool Regression | 193 Tests gruen, tsc OK |
| Pool-Konvertierung | 26/26 Pools, 2360 Fragen, 0 fehlende Bilder |

---

## Phasen-Uebersicht

| Phase | Datum | Beschreibung | Komponenten |
|-------|-------|-------------|------------|
| 1 | 02.04 | Scaffolding + Auth + Gruppen | — |
| 2 | 03.04 | 8 Fragetypen + Uebungs-Engine | 8 |
| 3 | 03.04 | Mastery-System + Fortschritt | — |
| 4 | 03.04 | Admin-Dashboard (3-Ebenen) | �� |
| 5 | 03.04 | Auftraege + Empfehlungen | — |
| 6 | 03.04 | Gamification + Kinder-UX | — |
| **7a** | **03.04** | **Typen + Pool-Konvertierung** | **+12 Typen** |
| **7b** | **03.04** | **FiBu-Fragetypen** | **+4** |
| **7c** | **03.04** | **open + formel + pdf** | **+3** |
| **7d** | **03.04** | **Bild-interaktive Typen** | **+3** |
| **7e** | **03.04** | **Gruppe + Zeichnen + Audio + Code** | **+4** |

## Alle 22 Fragetypen (komplett)

| Typ | Komponente | Korrektur | Fragen |
|-----|-----------|-----------|--------|
| mc | MCFrage | Auto (String-Vergleich) | 1019 |
| tf | TFFrage | Auto (Boolean-Array) | 450 |
| fill | FillFrage | Auto (case-insensitive) | 251 |
| multi | MultiFrage | Auto (Set-Vergleich) | 234 |
| open | OpenFrage | Selbstbewertung | 93 |
| sort | SortFrage | Auto (Kategorie-Match) | 76 |
| sortierung | SortierungFrage | Auto (Reihenfolge) | 69 |
| calc | CalcFrage | Auto (Toleranz) | 56 |
| bildbeschriftung | BildbeschriftungFrage | Auto (Text-Match) | 26 |
| dragdrop_bild | DragDropBildFrage | Auto (Zone-Match) | 26 |
| buchungssatz | BuchungssatzFrage | Auto (Soll/Haben/Betrag) | 19 |
| hotspot | HotspotFrage | Auto (Radius-Match) | 10 |
| zeichnen | ZeichnenFrage | Selbstbewertung | 9 |
| kontenbestimmung | KontenbestimmungFrage | Auto (Konto+Seite) | 5 |
| tkonto | TKontoFrage | Auto (Eintraege+Saldo) | 5 |
| gruppe | GruppeFrage | Rekursiv (Teil-Korrektur) | 5 |
| bilanz | BilanzFrage | Auto (Seiten+Summe) | 4 |
| formel | FormelFrage | Auto (LaTeX-Vergleich) | 2 |
| pdf | PdfFrage | Selbstbewertung | 1 |
| zuordnung | ZuordnungFrage | Auto (Paar-Match) | 0* |
| audio | AudioFrage | Selbstbewertung | 0** |
| code | CodeFrage | Selbstbewertung | 0** |

*zuordnung: Typ existiert, keine Pool-Fragen (wird fuer Lernplattform-eigene Fragen genutzt)
**audio/code: Aus Pruefungstool uebernommen, keine Pool-Fragen vorhanden

### Architektur (nach Phase 7e)

```
Lernplattform/src/components/fragetypen/
├── index.ts            # Registry: 22 Komponenten
├── FeedbackBox.tsx     # Shared: Lob/Trost-Feedback
├── shared/
│   ├── KontenSelect.tsx  # FiBu: Konto-Dropdown
│   └── BildContainer.tsx # Bild: Lade + Overlay
├── MCFrage.tsx, MultiFrage.tsx, TFFrage.tsx, FillFrage.tsx
├── CalcFrage.tsx, SortFrage.tsx, SortierungFrage.tsx, ZuordnungFrage.tsx
├── OpenFrage.tsx, FormelFrage.tsx, PdfFrage.tsx
├── BuchungssatzFrage.tsx, TKontoFrage.tsx, BilanzFrage.tsx, KontenbestimmungFrage.tsx
├── HotspotFrage.tsx, BildbeschriftungFrage.tsx, DragDropBildFrage.tsx
└── GruppeFrage.tsx, ZeichnenFrage.tsx, AudioFrage.tsx, CodeFrage.tsx
```

---

## Was fehlt (naechste Phasen)

### Phase 7f: Apps Script Backend
- 11 Endpoints (Login, Gruppen, Fragen, Fortschritt, Auftraege)
- Sheets-Struktur (Registry + Fragenbank + Analytik)
- Aktuell: localStorage-only (Mock-Adapter)

### Phase 7g: Sheet-Import + E2E
- Upload-Script fuer konvertierte Fragen
- Default-Gruppe anlegen
- End-to-End-Verifikation im Browser

### Spaetere Verbesserungen
- Streak-Anzeige im Dashboard (UI vorhanden, Daten fehlen ohne Backend)
- Offline-Queue (Spec vorhanden, Implementation in spaeterer Phase)
- Diktat-Typ (Browser-TTS)
- Wortschatz/Konjugation-Typen fuer Sprachen
- CodeMirror 6 Integration (statt Textarea) fuer Code-Typ
- KaTeX als npm-Dependency statt CDN fuer Formel-Typ
