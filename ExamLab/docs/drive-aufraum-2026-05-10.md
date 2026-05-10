# Drive-Aufräumung — Bundle Legacy-Naming-Cleanup ✅ ERLEDIGT

**Datum:** 2026-05-10
**Status:** User hat Files mit „Lernplattform" im Namen gelöscht ✅. Aktive Sheets verifiziert (uebenLogin success, 2 Gruppen geladen).

---

## ✅ Aktive Drive-Dateien (DOKUMENTATION)

### Statisch referenzierte Sheets (in `apps-script-code.js`)

| Konstante | Sheet-ID | Drive-Link | Zweck |
|---|---|---|---|
| `FRAGENSAMMLUNG_ID` | `1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs` | [öffnen](https://docs.google.com/spreadsheets/d/1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs) | Haupt-Fragensammlung (Gym-Schule) |
| `CONFIGS_ID` | `1QpcC44Ly7BUTLgUkVQtdqjTUDXmgdWdVD8ajjzsd7tE` | [öffnen](https://docs.google.com/spreadsheets/d/1QpcC44Ly7BUTLgUkVQtdqjTUDXmgdWdVD8ajjzsd7tE) | Lehrpersonen, Klassen-Configs |
| `ANTWORTEN_MASTER_ID` | `1r4CAoCkE0VxON4MbviqHlklSL3qJRe0uZO7bgPoo1KI` | [öffnen](https://docs.google.com/spreadsheets/d/1r4CAoCkE0VxON4MbviqHlklSL3qJRe0uZO7bgPoo1KI) | SuS-Antworten Master-Sheet |
| `GRUPPEN_REGISTRY_ID` | `1VH7Vu7JIKYLic2-wK2uSa2nXA7WVvStKOjUDi9cpWnI` | [öffnen](https://docs.google.com/spreadsheets/d/1VH7Vu7JIKYLic2-wK2uSa2nXA7WVvStKOjUDi9cpWnI) | Familien/Gym-Gruppen-Registry (Üben-Tool) |
| `KURSE_SHEET_ID` | `1inmEds_g48-lTFCqo9NUqAcxhDxF2mFSoBM5fO6uJng` | [öffnen](https://docs.google.com/spreadsheets/d/1inmEds_g48-lTFCqo9NUqAcxhDxF2mFSoBM5fO6uJng) | Kurse (Stundenplaner) |
| `STUNDENPLAN_SHEET_ID` | `1mesBOmPuLewvnY5iNb4iD2zNDUn8-ruK5HE0DsKwUSs` | [öffnen](https://docs.google.com/spreadsheets/d/1mesBOmPuLewvnY5iNb4iD2zNDUn8-ruK5HE0DsKwUSs) | Stundenplan |
| `SCHULJAHR_SHEET_ID` | `1LG52G7uqBMxQDVBeYXLb4jSa20Mjs1OBCKkd4bU3yjM` | [öffnen](https://docs.google.com/spreadsheets/d/1LG52G7uqBMxQDVBeYXLb4jSa20Mjs1OBCKkd4bU3yjM) | Schuljahres-Daten |
| `LEHRPLAN_SHEET_ID` | `1x3p_-_GjP25JvmCASh2TQSg0EhE0BD3MtHIy2xpo3Xo` | [öffnen](https://docs.google.com/spreadsheets/d/1x3p_-_GjP25JvmCASh2TQSg0EhE0BD3MtHIy2xpo3Xo) | Lehrplan |

### Drive-Ordner

| Konstante | Folder-ID | Drive-Link | Zweck |
|---|---|---|---|
| `ANTWORTEN_ORDNER_ID` | `1PAF1SUnR7nQ175muXn4iQERdQLJ-UnQQ` | [öffnen](https://drive.google.com/drive/folders/1PAF1SUnR7nQ175muXn4iQERdQLJ-UnQQ) | SuS-Antworten (pro Prüfung 1 Sheet) |
| `ANHAENGE_ORDNER_ID` | `1Ql4XuKmxyNW9ZIGsn4getcaB4FhLbjtm` | [öffnen](https://drive.google.com/drive/folders/1Ql4XuKmxyNW9ZIGsn4getcaB4FhLbjtm) | LP-Anhänge bei Fragen (Bilder, PDFs) |
| `MATERIALIEN_ORDNER_ID` | `1yBqm-9iKOcp8QptnISmwKaZGbR63mF5V` | [öffnen](https://drive.google.com/drive/folders/1yBqm-9iKOcp8QptnISmwKaZGbR63mF5V) | LP-Materialien bei Prüfungen |
| `SUS_UPLOADS_ORDNER_ID` | `1pQdSujvdzTp5MAbBdJU3ipiaG3zstyu8` | [öffnen](https://drive.google.com/drive/folders/1pQdSujvdzTp5MAbBdJU3ipiaG3zstyu8) | SuS-Uploads während Prüfung |

### Dynamische Familien-/Gym-Gruppen-Sheets

In **`GRUPPEN_REGISTRY_ID`-Sheet** (Tab „Gruppen") sind alle dynamischen Sheets aufgelistet:
- Spalte E (`fragensammlungSheetId`): pro Familie/Gym ein Fragensammlung-Sheet
- Spalte F (`analytikSheetId`): pro Familie/Gym optional ein Analytik-Sheet

**Aktive Gruppen** (Stand 2026-05-10):

| ID | Name | Typ | fragensammlungSheet |
|---|---|---|---|
| `familie` | Familie | familie | ✅ vorhanden |
| `test` | Test | gym | ✅ vorhanden |

---

## ✅ Was erledigt wurde (2026-05-10)

| Aktion | Status |
|---|---|
| Apps-Script (Hauptbackend) auf neuen Wire-Vertrag deployt | ✅ |
| Apps-Script-Wire-Vertrag verifiziert (`uebenLogin` success, 2 Gruppen, 59/0 Wire-Contract-Audit) | ✅ |
| Code-Ordner `ExamLab/apps-script-lernen/` gelöscht (Pre-Fusion-Legacy) | ✅ |
| Drive-Files mit „Lernplattform" im Namen gelöscht (User-Aktion) | ✅ |
| Sheet-Prefix-String in Apps-Script auf `'ExamLab: '` umgestellt (für künftige Neu-Erstellungen) | ✅ |
| Bundle Legacy-Naming-Cleanup + Cosmetic-Bundle auf main gemerged | ✅ |

---

## 🔍 Optional: Manuelles Sheet-Rename im Drive

Die oben gelisteten **aktiven Sheets** behalten ihre alten Namen (z.B. `Lernplattform: Gruppen-Registry`, `Fragenbank`) bis du sie manuell umbenennst. Sheet-IDs ändern sich beim Rename **NICHT**, also funktioniert das Backend weiter:

| Aktueller Name (vermutlich) | Empfohlener neuer Name |
|---|---|
| `Lernplattform: Gruppen-Registry` | `ExamLab: Gruppen-Registry` |
| `Lernplattform: Familie` | `ExamLab: Familie` |
| `Lernplattform: Test` | `ExamLab: Test` |
| `Fragenbank` | `ExamLab: Fragensammlung` |

Diese Renames sind **rein kosmetisch** und können beliebig später nachgeholt werden.

---

## 📁 Apps-Script-Projekt-Cleanup (optional)

Falls noch nicht erledigt:
- https://script.google.com → „Eigene Projekte"
- Suche nach Projekten mit „Lernplattform" im Namen
- Das alte separate Lernplattform-Apps-Script-Projekt (Pre-Fusion) kann gelöscht werden
- ⚠️ Achtung: das **aktive** Apps-Script (mit der URL `AKfycbzv88MEo_6VulH4Z10U7IvhNkdISGU5AQRQiCNL72v_N4EDXMvr4PJ5phfPExmJyZN_IA`) muss bleiben — das ist das Hauptbackend
