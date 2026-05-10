# Drive-Aufräumung — User-Action-Brief Bundle Legacy-Naming-Cleanup

**Datum:** 2026-05-10
**Anlass:** Bundle Legacy-Naming-Cleanup (`refactor/legacy-naming-cleanup`)
**Code-Status:** Phase 1+2+3 fertig (commits 269c602, 01db72c, da05c7a, f8bb85c, 4bb8b74). Wartet auf Apps-Script-Deploy + Drive-Aufräumung durch User.

---

## Was hier zu tun ist

Bei der Migration `lernplattform*` → `ueben*` und `'Lernplattform: '` Sheet-Prefix → `'ExamLab: '` ändert sich nichts an Daten/Sheet-IDs/Funktionalität. Aber im Drive gibt es User-sichtbare **Sheet-Namen** und **alte Apps-Script-Projekte**, die optional umbenannt/aufgeräumt werden können.

Diese Aufräumung ist **nicht zwingend** für die Funktion (Sheet-IDs sind unverändert; Apps-Script greift auf IDs zu, nicht auf Namen). Aber sie macht das Drive konsistenter.

---

## ✅ Aktiv verwendete Drive-Sheets (NICHT LÖSCHEN!)

Diese Sheets werden vom Hauptbackend `apps-script-code.js` aktiv gelesen/geschrieben. Sheet-IDs sind hartcodiert in `apps-script-code.js`.

| Sheet-Beschreibung | ID-Konstante in apps-script-code.js | Aktueller Sheet-Name (vermutlich) | Empfehlung |
|---|---|---|---|
| Hauptdaten-Sheet (Fragensammlung) | `FRAGENSAMMLUNG_ID` | `Fragenbank` (Legacy-Name) | Optional umbenennen → `ExamLab: Fragensammlung` |
| Gruppen-Registry | `GRUPPEN_REGISTRY_ID` | `Lernplattform: Gruppen-Registry` | Optional umbenennen → `ExamLab: Gruppen-Registry` |
| Schul-Configs (Lehrpersonen, Klassen, etc.) | `CONFIGS_ID` | (Originalname) | Keine Aktion nötig |

Pro Familie/Gruppe (im Sheet `GRUPPEN_REGISTRY_ID` aufgelistet):

| Sheet-Beschreibung | ID-Quelle | Aktueller Sheet-Name (vermutlich) | Empfehlung |
|---|---|---|---|
| Familien-Sheet (Fragensammlung pro Familie) | `gruppe.fragensammlungSheetId` (Spalte E) | `Lernplattform: <Familie-Name>` | Optional umbenennen → `ExamLab: <Familie-Name>` |
| Familien-Analytik-Sheet | `gruppe.analytikSheetId` (Spalte F) | (variabel) | Keine Aktion nötig |

**Wichtig:** Sheet-IDs ändern sich beim Umbenennen NICHT. Backend funktioniert weiter, egal wie das Sheet im Drive heißt.

---

## 🗑️ Empfehlung für Löschung

### 1. Altes Lernplattform-Apps-Script-Projekt (Pre-Fusion)

Vor der Backend-Fusion (05.04.2026, commit `cf7d2eb`) gab es ein **separates Apps-Script-Projekt** für die Lernplattform — typisch namens „Lernplattform Backend" oder ähnlich, mit eigenem Web-App-URL.

**Wo finden:**
1. https://script.google.com → „Eigene Projekte"
2. Suche nach Projekten mit „Lernplattform" im Namen
3. Falls gefunden: prüfen, ob das Web-App-URL noch irgendwo aktiv ist (Frontend nutzt nur eine `VITE_APPS_SCRIPT_URL`, also vermutlich nicht)

**Vor Löschung:** Web-App-URL des alten Projekts notieren — falls in einem `.env`-File oder einer Browser-Bookmarks-Liste eines Users gespeichert, dort entfernen.

### 2. Alte Test-Sheets aus Fusion-Phase

Während der Backend-Fusion (April 2026) wurden möglicherweise Test-Sheets erstellt (z.B. „Lernplattform: Test-Familie"). Diese können gelöscht werden, wenn sie aktuell ungenutzt sind.

**Vor Löschung:** Im aktiven `GRUPPEN_REGISTRY_ID`-Sheet prüfen, ob die Test-Familie noch in der Gruppen-Liste steht. Falls ja: Eintrag dort löschen, dann das verlinkte Test-Sheet im Drive löschen.

---

## 🔄 Manuelles Sheet-Rename (optional, kosmetisch)

Wenn du die Drive-Konsistenz möchtest, kannst du jedes der oben gelisteten **aktiv verwendeten Sheets** im Drive-UI manuell umbenennen:

1. Sheet im Drive öffnen → oben links auf den Namen klicken → neu eingeben → Enter
2. Die Sheet-ID ändert sich dabei NICHT (steht in der URL nach `/d/`)
3. Backend funktioniert sofort weiter mit dem neuen Namen

Empfohlene Renames:

| Vorher | Nachher |
|---|---|
| `Fragenbank` | `ExamLab: Fragensammlung` |
| `Lernplattform: Gruppen-Registry` | `ExamLab: Gruppen-Registry` |
| `Lernplattform: <Familie-Name>` | `ExamLab: <Familie-Name>` (pro Familie) |

---

## ✅ Verifikations-Schritte nach Drive-Aufräumung

Nachdem du das Apps-Script-Deploy gemacht und (optional) Drive-Renames durchgeführt hast:

1. **Apps-Script-URL aufrufen** (oder im Apps-Script-Editor `doGet()` testen):
   - Erwartung: 0 Errors im Apps-Script-Editor-Execution-Log
   - Falls Error mit `getSheetByName(...)` returns null: Sheet-Name wurde geändert, aber Backend-Code refrenziert `getSheetByName('alterName')`. Dies sollte aber NICHT passieren, weil Backend Sheet-IDs (nicht Namen) nutzt.

2. **Frontend Üben-Tab öffnen** auf Staging-URL:
   - Login mit echtem SuS-Account (z.B. `wr.test@stud.gymhofwil.ch`)
   - Themen-Karten laden → 0 Console-Errors
   - Eine Frage starten + abgeben → Korrektur funktioniert

3. **Frontend Composer öffnen** auf Staging-URL:
   - Login mit echtem LP-Account (z.B. `wr.test@gymhofwil.ch`)
   - Composer öffnet → 0 Console-Errors
   - Vorschau-Tab rendert → 0 Errors

Falls Errors auftauchen: rollback ist möglich via:
- Apps-Script: vorherige Version via Apps-Script-Editor → Versionen → Restore
- Frontend: `git revert` der Phase-Commits

---

## Zusammenfassung der notwendigen User-Aktionen

| Schritt | Pflicht? | Zeitaufwand |
|---|---|---|
| **1. Apps-Script-Deploy** (Frontend + Backend Hard-Cut) | ✅ Pflicht | ~5 min |
| 2. Manuelles Sheet-Rename (Drive) | Optional (kosmetisch) | ~10 min |
| 3. Altes Lernplattform-Apps-Script-Projekt löschen | Optional (Cleanup) | ~5 min |
| 4. Browser-E2E-Test mit echten Logins | ✅ Pflicht | ~10 min |

**Wichtig:** Schritt 1 + 4 sind Pflicht (sonst funktioniert das Üben-Tool nicht mehr). Schritt 2 + 3 sind kosmetisch und können später nachgeholt werden.
