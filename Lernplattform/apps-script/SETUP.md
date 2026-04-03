# Lernplattform — Apps Script Setup

## 1. Gruppen-Registry Sheet erstellen

1. Google Sheets → Neues Dokument erstellen
2. Name: "Lernplattform: Gruppen-Registry"
3. Erste Zeile (Header): `id | name | typ | adminEmail | fragenbankSheetId | analytikSheetId`
4. Sheet-ID kopieren (aus URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/edit`)

## 2. Apps Script Projekt erstellen

1. https://script.google.com → Neues Projekt
2. Name: "Lernplattform Backend"
3. Gesamten Inhalt von `lernplattform-backend.js` in `Code.gs` einfügen
4. `GRUPPEN_REGISTRY_ID` mit der Sheet-ID aus Schritt 1 ersetzen

## 3. Bereitstellen

1. Bereitstellen → Neue Bereitstellung
2. Typ: Web-App
3. Beschreibung: "Lernplattform v1.0"
4. Ausführen als: Ich
5. Zugriff: Alle (auch ohne Google-Konto)
6. Bereitstellen → URL kopieren

## 4. Frontend konfigurieren

1. `.env` in `Lernplattform/` erstellen (oder `.env.local`):
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
   ```
2. Dev-Server neu starten (`npm run dev`)

## 5. Erste Gruppe erstellen

Im Browser-Demo oder via API:
```json
{
  "action": "lernplattformErstelleGruppe",
  "name": "SF WR 29c",
  "typ": "gym",
  "adminEmail": "yannick.durand@gymhofwil.ch"
}
```

Das erstellt automatisch ein Fragenbank-Sheet mit Tabs:
- Fragen (leer — Pool-Import kommt separat)
- Mitglieder
- Auftraege
- Fortschritt
- Sessions

## Sheets-Struktur

```
Gruppen-Registry (zentral)
├── id | name | typ | adminEmail | fragenbankSheetId | analytikSheetId

Pro Gruppe: Fragenbank-Sheet
├── Fragen:       id | fach | thema | typ | schwierigkeit | ... | daten (JSON)
├── Mitglieder:   email | name | rolle | code | beigetreten
├── Auftraege:    id | titel | fach | thema | deadline | aktiv
├── Fortschritt:  email | fragenId | versuche | richtig | richtigInFolge | mastery | ...
└── Sessions:     sessionId | email | thema | fach | datum | ergebnis
```

## Endpoints

| Aktion | Beschreibung |
|--------|-------------|
| lernplattformLogin | OAuth-Login, gibt Token + Gruppen |
| lernplattformValidiereToken | Session prüfen |
| lernplattformCodeLogin | Login mit 6-stelligem Code |
| lernplattformGeneriereCode | Code für Mitglied erstellen |
| lernplattformLadeGruppen | Gruppen für E-Mail |
| lernplattformErstelleGruppe | Neue Gruppe + Sheets |
| lernplattformLadeMitglieder | Mitglieder einer Gruppe |
| lernplattformEinladen | Mitglied hinzufügen |
| lernplattformEntfernen | Mitglied entfernen |
| lernplattformLadeFragen | Fragen mit Filter |
| lernplattformSpeichereFortschritt | Übungsergebnis speichern |
| lernplattformLadeFortschritt | Mastery-Daten laden |
| lernplattformLadeAuftraege | Aufträge einer Gruppe |
| lernplattformSpeichereAuftrag | Auftrag erstellen/updaten |
