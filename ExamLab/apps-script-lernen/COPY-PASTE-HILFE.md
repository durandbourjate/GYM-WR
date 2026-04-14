# Copy-Paste Blöcke für das Setup

> Alle Inhalte hier sind bereit zum direkten Einfügen (Copy-Paste in Sheets oder Terminal).

---

## 1. Gruppen-Registry Header (→ in Zelle A1 einfügen)

```
id	name	typ	adminEmail	fragenbankSheetId	analytikSheetId
```

---

## 2. Code für Apps Script (→ gesamten Inhalt von Code.gs ersetzen)

Datei: `lernplattform-backend.js` — den gesamten Inhalt kopieren und in Code.gs einfügen.

---

## 3. .env.local Inhalt (→ als Datei im Lernplattform-Ordner speichern)

Nach dem Deployment die URL eintragen:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec
```

---

## 4. Test-Befehl (→ im Terminal ausführen)

Backend-Gesundheitscheck:

```bash
curl "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec"
```

Erwartete Antwort: `{"status":"ok","app":"lernplattform","version":"1.0"}`

---

## 5. Erste Gruppe erstellen (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformErstelleGruppe","name":"SF WR 29c","typ":"gym","adminEmail":"yannick.durand@gymhofwil.ch"}'
```

---

## 6. Familie-Gruppe erstellen (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformErstelleGruppe","name":"Familie Durand","typ":"familie","adminEmail":"yannick.durand@gymhofwil.ch"}'
```

---

## 7. Kind als Mitglied einladen (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformEinladen","gruppeId":"familie-durand","email":"kind1@familie.local","name":"Kind 1"}'
```

---

## 8. Code generieren für Kind (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformGeneriereCode","gruppeId":"familie-durand","email":"kind1@familie.local"}'
```

Antwort enthält den 6-stelligen Code (z.B. `{"success":true,"data":{"code":"HK7N3P"}}`).
