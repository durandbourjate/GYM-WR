# Qualitätsstandards — Checkliste bei jeder Änderung

## Vor der Änderung
- [ ] Betroffene Dateien gelesen und verstanden?
- [ ] Impact-Analyse: Welche anderen Stellen nutzen diesen Code?
- [ ] Gibt es ein bestehendes Shared Component / Pattern für diesen Fall?

## Code-Qualität (während der Änderung)
- [ ] DRY: Wird Code dupliziert, der wiederverwendbar sein sollte?
  → Shared Components: Button, BaseDialog, Adapter-Hooks, Fragetypen-Registry
  → Konfiguration über Daten (Maps, Registries) statt if/else-Ketten
- [ ] Flexibilität: Hardcodierte Werte in Konstanten/Config auslagern?
- [ ] Wiederverwendung: Könnte diese Logik auch anderswo gebraucht werden?
  → Wenn ja: als Hook/Util extrahieren, nicht inline lassen
- [ ] TypeScript strikt: Keine neuen `any`-Casts, explizite Typen
- [ ] Konsistenz: Passt der Code zu bestehenden Patterns im Projekt?

## Sicherheit & Datenschutz
- [ ] Input-Validierung: Werden Nutzereingaben sanitized?
- [ ] XSS: Kein `dangerouslySetInnerHTML` ohne Sanitizing?
- [ ] Berechtigungen: LP/SuS-Trennung gewahrt?
- [ ] Prüfungsintegrität: Können SuS Antworten/Lösungen einsehen oder manipulieren?
- [ ] localStorage: Keine sensiblen Daten unverschlüsselt?
- [ ] Missbrauchs-Prävention: Kann die Änderung Fraud erleichtern?

## Nach der Änderung
- [ ] TypeScript-Check bestanden (tsc -b)?
- [ ] Im Browser verifiziert (NICHT geraten)?
- [ ] Bestehende Funktionalität funktioniert noch?
- [ ] Light/Dark Mode geprüft (falls UI-Änderung)?
- [ ] Mobile/iPad geprüft (falls Layout-Änderung)?
