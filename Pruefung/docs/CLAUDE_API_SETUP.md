# Claude API Setup — Prüfungsplattform

## 1. Anthropic-Konto erstellen

1. Gehe zu [console.anthropic.com](https://console.anthropic.com/)
2. Erstelle ein Konto (oder melde dich an)
3. Navigiere zu **Settings → API Keys**
4. Klicke **Create Key**, Name: `Pruefungsplattform Hofwil`
5. Kopiere den Key (beginnt mit `sk-ant-...`) — wird nur einmal angezeigt!

## 2. Billing einrichten

1. In der Console: **Settings → Billing**
2. Zahlungsmittel hinzufügen (Kreditkarte oder Prepaid-Credits)
3. **Empfohlen:** Monatliches Limit auf CHF 5 setzen (Settings → Limits)

### Kostenübersicht

| Szenario | Tokens | Kosten |
|----------|--------|--------|
| 1 Prüfung (20 SuS × 6 Freitext) | ~180'000 | ~CHF 0.40 |
| 12 Prüfungen/Jahr | ~2.2 Mio | ~CHF 5–10 |

## 3. API-Key in Apps Script eintragen

1. Öffne das Apps Script Projekt: [script.google.com](https://script.google.com/)
2. Gehe zu **Projekteinstellungen** (Zahnrad-Icon links)
3. Scrolle zu **Skripteigenschaften**
4. Klicke **Skripteigenschaft hinzufügen**:
   - **Eigenschaft:** `CLAUDE_API_KEY`
   - **Wert:** `sk-ant-...` (den kopierten Key einfügen)
5. Speichern

## 4. Testen

In Apps Script: **Ausführen → `testClaudeApi`**

```javascript
function testClaudeApi() {
  const result = rufeClaudeAuf(
    'Du bist ein hilfreicher Assistent.',
    'Antworte mit genau einem Wort: Funktioniert.'
  )
  Logger.log(result)
}
```

Wenn die Antwort im Log erscheint, ist alles korrekt eingerichtet.

## Sicherheit

- Der API-Key ist nur serverseitig in Apps Script gespeichert
- Er ist nicht im Frontend-Code oder im GitHub-Repository sichtbar
- Nur autorisierte Benutzer (LP mit @gymhofwil.ch) können die Korrektur-Endpoints aufrufen
