# Uebungstool — HANDOFF

## Aktueller Stand

**Branch:** `main`
**Phase:** Fortschritt pro Mitglied + Lernziele (05.04.2026)
**Status:** TSC OK, 101 LP-Tests + 193 Pruefungs-Tests gruen, Build OK
**Apps Script:** Deployed (Security-Hardening + 3 neue Endpoints)

### Architektur
- **Ein Format:** Kanonisch aus `@shared/types/fragen` (discriminated union)
- **Eine Fragenbank:** `FRAGENBANK_ID` = Pruefungstool-Sheet (Gym-Gruppen), eigenes Sheet (Familie)
- **Ein Editor:** SharedFragenEditor mit allen Features (KI, Anhaenge, Sharing, Lernziele)
- **Kein Adapter:** Keine Konvertierung zwischen LP und Pruefungstool-Format
- **CSS:** Identisch mit Pruefungstool (input-field, slate-Farben, Kontrast)
- **Kontenrahmen:** KMU-Kontenrahmen (CH) geladen in beiden EditorProviders

---

## In dieser Session erledigt (05.04.2026)

### Security-Hardening
| # | Fix | Details |
|---|-----|---------|
| 1 | IDOR-Fix: generiereCode | Admin-Check + Audit-Log |
| 2 | IDOR-Fix: einladen | Admin-Check + Audit-Log |
| 3 | IDOR-Fix: entfernen | Admin-Check + Audit-Log |
| 4 | IDOR-Fix: ladeMitglieder | Mitglied-Check |
| 5 | Rate Limiting Login | 20 Versuche/10min |
| 6 | Audit-Logging | AuditLog-Tab im Registry-Sheet |
| 7 | Helper-Funktionen | istGruppenAdmin_, istGruppenMitglied_, auditLog_ |
| 8 | Refactoring | speichereFrage + loescheFrage auf Helper |

### Fortschritt + Lernziele Feature
| # | Feature | Details |
|---|---------|---------|
| 1 | Lernziel-Interface erweitert | +fragenIds (optional), poolId/aktiv optional |
| 2 | SessionEintrag + LernzielStatus | Neue Typen in fortschritt.ts |
| 3 | lernzielStatus() | Berechnet Status aus Fragen-Mastery (5 Tests) |
| 4 | FortschrittService | Interface + AppsScript-Adapter (3 Endpoints) |
| 5 | FortschrittStore erweitert | +gruppenFortschritt, +lernziele, +Selektoren (4 Tests) |
| 6 | Backend: ladeGruppenFortschritt | Admin-only, alle SuS-Daten einer Gruppe |
| 7 | Backend: ladeLernzieleV2 | Aus Lernziele-Tab (Gym: Fragenbank, Familie: Gruppen-Sheet) |
| 8 | Backend: speichereLernziel | Admin-only, Upsert, erstellt Tab automatisch |
| 9 | AdminKindDetail | Backend-Anbindung: Sessions, Dauerbaustellen, Mastery pro Thema |
| 10 | Lernziele-Panel | Dynamische Checkliste aus Backend, Fallback auf statischen Text |

### Lernziele-Tab Struktur
| Spalte | Typ | Beschreibung |
|--------|-----|-------------|
| id | string | z.B. LZ-BWL-001 |
| text | string | Lernziel-Beschreibung |
| fach | string | BWL, VWL, Recht, Informatik |
| thema | string | Zugehoeriges Thema |
| bloom | string | K1-K6 |
| fragenIds | string | Komma-separierte Fragen-IDs |

---

## Offene Punkte

| # | Thema | Details | Aufwand |
|---|-------|---------|---------|
| 1 | **E2E-Browser-Test** | LP testet manuell: Admin-Ansicht (Kind-Detail), SuS-Ansicht (Lernziele-Panel) | Mittel |
| 2 | **Lernziele-Tab erstellen** | Wird automatisch beim ersten speichereLernziel erstellt, oder manuell im Sheet (Spalten: id, text, fach, thema, bloom, fragenIds) | Manuell |

---

## Verifikation

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
cd Pruefung && npx tsc -b && npx vitest run && npm run build
```
