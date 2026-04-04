# Übungstool — HANDOFF

## Aktueller Stand

**Branch:** `main`
**Phase:** Bugfix-Runde + Umbenennung (04.04.2026)
**Status:** TSC OK, 92 LP-Tests + 193 Prüfungs-Tests grün, Build OK
**Apps Script:** Unverändert (keine Backend-Änderungen)

### Architektur
- **Ein Format:** Kanonisch aus `@shared/types/fragen` (discriminated union)
- **Eine Fragenbank:** `FRAGENBANK_ID` = Prüfungstool-Sheet (Gym-Gruppen), eigenes Sheet (Familie)
- **Ein Editor:** SharedFragenEditor mit allen Features (KI, Anhänge, Sharing, Lernziele)
- **Kein Adapter:** Keine Konvertierung zwischen LP und Prüfungstool-Format
- **CSS:** Identisch mit Prüfungstool (input-field, slate-Farben, Kontrast)

### Letzte Commits (fix/uebungstool-bugs → main)

| Änderung | Details |
|----------|---------|
| **Umbenennung** | Prüfungsplattform → **Prüfungstool**, Lernplattform → **Übungstool** (index.html, package.json, vite.config.ts, LoginScreen, Header, README, CLAUDE.md, root index.html) |
| **Bug 2: MC-UUID** | MCEditor zeigt Index-Buchstaben (a,b,c) statt opt.id → UUIDs nicht mehr sichtbar |
| **Bug 1: Keine Gruppen** | Abmelde-Button auf "Keine Gruppen"-Screen hinzugefügt |
| **Bug 3: LP Dashboard leer** | Admin-Rolle → automatisch zu Admin-Screen navigieren statt leeres Dashboard |
| **Bug 4: Felder zu schmal** | `width: 100%` für textarea bei `field-sizing: content` |
| **Bug 5: Umlaute** | "Pruefen"→"Prüfen" (23 Dateien), "Faecher"→"Fächer", "ueben"→"üben" |
| **Bug 6: Fragenbank-Filter** | Suchfeld + Thema-Filter + Typ-Filter + "Filter zurücksetzen" |
| **Bug 7: Dashboard-Suche** | Suchfeld für Themensuche im SuS-Dashboard |
| **Bug 8: Übersicht-Tab** | Mitglieder-Liste (Lernende + Admins) statt leerer Platzhalter |
| **Bug 10: Hilfe-Button** | ?-Button im Header mit Hilfe-Panel (Mastery-Stufen erklärt) |

---

## Offene Bugs

### A) Architektur/Backend (nicht in dieser Session)

| # | Thema | Details |
|---|-------|---------|
| 9 | **Übungspools-Lernziele weg?** | User meldet dass Lernziele in Übungspools verschwunden sind. Separat prüfen ob Deployment-Artefakt oder anderer Bug. |
| 11 | **Backend KI/Upload/Lernziele** | Endpoints im EditorProvider vorbereitet, fehlen im Apps Script Backend |
| 12 | **speichereFrage → FRAGENBANK_ID** | Speichert noch ins alte Gruppen-Sheet, muss auf gemeinsame Fragenbank umgestellt werden |

### B) Wünsche (niedrige Priorität)

| # | Thema | Details |
|---|-------|---------|
| — | **Fortschritts-Daten in Übersicht** | AdminUebersicht zeigt Mitglieder, aber noch keine Fortschritts-Balken (Backend-Aggregation fehlt) |
| — | **Dashboard Typ-Filter als Buttons** | Aktuell Dropdown wegen 22 Typen — Buttons wären kompakter |

---

## Verifikation

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
cd Pruefung && npx tsc -b && npx vitest run
```

---

## Nächste Session — Empfohlene Reihenfolge

1. E2E-Test im Browser (Login, Gruppen, Dashboard, Übung, Admin)
2. Bug 12: speichereFrage auf FRAGENBANK_ID umstellen
3. Bug 11: KI/Upload/Lernziele-Endpoints im Apps Script Backend
4. Bug 9: Übungspools-Lernziele prüfen
5. Fortschritts-Daten pro Mitglied in AdminUebersicht
