# Pre-Commit Checklist — Prüfungsplattform

> Vor jedem Commit/Merge zu `main` durchgehen. Schnell-Check: ~5 Min.

## Build & Tests

- [ ] `npx tsc -b` — keine TypeScript-Fehler
- [ ] `npx vitest run` — alle Tests grün (aktuell: 167+)
- [ ] `npm run build` — Build erfolgreich

## Security-Invarianten

- [ ] SuS-API-Response enthält keine Lösungsfelder
- [ ] Session-Token bei allen API-Calls (GET + POST)
- [ ] Rollen-Validierung aus E-Mail-Domain aktiv
- [ ] Keine API-Keys/Secrets im Client-Code

## Regressions-Check (bei Änderungen an Shared Code)

- [ ] Impact-Analyse: Alle Aufrufer der geänderten Funktion geprüft
- [ ] LP-Flow funktioniert (Monitoring, Korrektur)
- [ ] SuS-Flow funktioniert (Laden, Beantworten, Auto-Save, Abgabe)
- [ ] Heartbeat sendet korrekt (Token, gesamtFragen)

## Browser-Test (bei UI/Flow-Änderungen)

- [ ] `npm run preview` → Lokaler Build getestet
- [ ] Light Mode + Dark Mode
- [ ] Keine Console-Errors

## Apps Script (bei Backend-Änderungen)

- [ ] Alte Bereitstellungs-Nr. notiert: ___
- [ ] Neue Bereitstellung erstellt
- [ ] Frontend + Backend zusammen getestet

## Vor Merge

- [ ] Keine aktiven Prüfungen
- [ ] HANDOFF.md aktualisiert
- [ ] Feature-Branch aufgeräumt

---

*Datum: ___________ | Branch: ___________ | Ergebnis: OK / Probleme*
