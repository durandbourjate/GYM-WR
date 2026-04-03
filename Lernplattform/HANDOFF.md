# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `feature/lernplattform-phase7a`
**Phase:** 7a–7f abgeschlossen + Backend deployed + 7 Gruppen erstellt
**Status:** Alle 22 Fragetypen, 2360 Fragen live, Backend deployed, bereit fuer E2E-Test

### Verifikation (03.04.2026)

| Check | Status |
|-------|--------|
| `npx tsc -b` | OK |
| `npx vitest run` | 82 Tests gruen (10 Testdateien) |
| `npm run build` | OK (dist/ 300 KB JS) |
| Pruefungstool Regression | 193 Tests gruen, tsc OK |
| Pool-Konvertierung | 26/26 Pools, 2360 Fragen, 0 fehlende Bilder |
| Pool-Daten live | Lazy-Loading via PoolFragenAdapter, Browser-verifiziert |
| Apps Script Backend | 14 Endpoints, deployed + getestet (doGet OK, Gruppen erstellt) |
| Dashboard-Filter | Fach/Schwierigkeit/Typ + einklappbare Sektionen, Browser-verifiziert |

---

## Phasen-Uebersicht

| Phase | Datum | Beschreibung | Komponenten |
|-------|-------|-------------|------------|
| 1 | 02.04 | Scaffolding + Auth + Gruppen | — |
| 2 | 03.04 | 8 Fragetypen + Uebungs-Engine | 8 |
| 3 | 03.04 | Mastery-System + Fortschritt | — |
| 4 | 03.04 | Admin-Dashboard (3-Ebenen) | — |
| 5 | 03.04 | Auftraege + Empfehlungen | — |
| 6 | 03.04 | Gamification + Kinder-UX | — |
| **7a** | **03.04** | **Typen + Pool-Konvertierung** | **+12 Typen** |
| **7b** | **03.04** | **FiBu-Fragetypen** | **+4** |
| **7c** | **03.04** | **open + formel + pdf + audio/code** | **+3** |
| **7d** | **03.04** | **Bild-interaktive Typen** | **+3** |
| **7e** | **03.04** | **Gruppe + Zeichnen + Audio + Code** | **+4** |
| **—** | **03.04** | **Pool-Daten live + Dashboard-Filter** | **—** |
| **7f** | **03.04** | **Apps Script Backend deployed, 7 Gruppen** | **—** |

## Backend-Status (deployed 03.04.2026)

### Apps Script URL
```
VITE_APPS_SCRIPT_URL in Lernplattform/.env.local (nicht im Repo)
```

### Gruppen in der Registry

| ID | Name | Typ | Kontext |
|----|------|-----|---------|
| familie | Familie | familie | Kinder (privat), Eltern als Admin |
| sf-wr-29c | SF WR 29c | gym | GYM1 |
| sf-wr-28bc29fs | SF WR 28bc29fs | gym | GYM2 |
| sf-wr-27a28f | SF WR 27a28f | gym | GYM3 |
| in-28c | IN 28c | gym | Informatik |
| in-29f | IN 29f | gym | Informatik |
| in-30s | IN 30s | gym | Informatik |

### Sheets-Struktur (Google Drive)
```
Lernplattform/ (Ordner in Google Drive)
├── Gruppen-Registry (Tab "Gruppen": 7 Eintraege)
├── Lernplattform: Familie          (5 Tabs)
├── Lernplattform: SF WR 29c       (5 Tabs)
├── Lernplattform: SF WR 28bc29fs  (5 Tabs)
├── Lernplattform: SF WR 27a28f    (5 Tabs)
├── Lernplattform: IN 28c          (5 Tabs)
├── Lernplattform: IN 29f          (5 Tabs)
└── Lernplattform: IN 30s          (5 Tabs)
```

Pro Sheet: Tabs Fragen, Mitglieder, Auftraege, Fortschritt, Sessions.

### Mitglieder eintragen (manuell im Sheet)

**Familie:** Tab "Mitglieder" in "Lernplattform: Familie":
- Eltern: rolle=admin, mit E-Mail
- Kinder: rolle=mitglied, mit E-Mail (Code-Login als Fallback fuer unterwegs)
- Private E-Mails verwenden (nicht Schul-Email)
- LP kann zusaetzlich mit Schul-Email als admin eingetragen werden (sieht Gruppe bei beiden Logins)

**Gym-Klassen:** SuS-Emails aus Evento/Kurse-Sheet. Noch nicht eingetragen.

---

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

---

## Was fehlt (naechste Schritte)

### Naechste Session: E2E-Test im Browser
- Login mit Google OAuth → Gruppen-Auswahl → echte Fragen ueben
- Fortschritt speichern (Backend) statt localStorage
- Alle Fragetypen visuell pruefen
- Dashboard-Filter testen

### Frontend-Adapter umstellen
- Mock → echtes Backend (Toggle via VITE_APPS_SCRIPT_URL vorhanden/leer)
- FortschrittStore: localStorage → Backend-Persistenz
- AuftragStore: localStorage → Backend-Persistenz

### Bekannte UX-Themen
- Fill-Fragen: {0}-Platzhalter im Text sichtbar (kosmetisch, Luecken sind als separate Felder)
- Dashboard: Sehr viele Themen (~85 VWL, ~67 Recht, ~36 BWL) — Filter helfen, evtl. Suche ergaenzen

### Spaetere Verbesserungen
- SuS-Import aus Evento/Kurse-Sheet (Klassenlisten-Sync)
- Streak-Anzeige im Dashboard
- Offline-Queue
- Diktat-Typ (Browser-TTS)
- CodeMirror 6 / KaTeX als npm-Dependency statt CDN
