# Spec — Probleme-Dashboard in Einstellungen

**Datum:** 2026-04-23
**Bundle:** F1
**Autor:** DUY + Claude
**Status:** Draft (pending Review)

## Ziel

Admin und Lehrpersonen (LPs) sollen die via `FeedbackModal` eingereichten Problemmeldungen und Wünsche niederschwellig einsehen und als erledigt markieren können — direkt in ExamLab unter **Einstellungen → Problemmeldungen**. Jede Meldung bietet einen Deep-Link zur betroffenen Frage / Prüfung / Übungsgruppe, damit Fehler sofort behoben werden können.

## Ausgangslage

Heute landen alle Meldungen aus dem FeedbackModal via `no-cors` GET in einem separaten Apps-Script-Deploy (`AKfycbwSxIOq…`), das in das Google Sheet *„ExamLab Problemmeldungen"* schreibt. Die Meldungen werden aktuell **nie ausgelesen** in der App — DUY schaut manuell ins Sheet. Das ist unpraktikabel und verhindert kollegiale Zusammenarbeit.

Wichtige Eigenschaften der heutigen Write-Lösung, die erhalten bleiben müssen:

- **Anonyme Schreibe:** Keine User-Email landet im Sheet, nur `rolle`, `gruppeId`, `frageId`, etc. SuS müssen nicht authentifiziert sein, um ein Problem zu melden.
- **Fire-and-forget:** `no-cors` + lokaler Erfolgs-Overlay im Modal. Kein Retry, kein Roundtrip-Risiko.
- **Bestehender Endpoint** soll unverändert bleiben — kein Risiko für den Schreibpfad.

## Scope

### In Scope

- Neuer Tab **„Problemmeldungen"** im `EinstellungenPanel.tsx` (immer sichtbar, Badge-Count offener Meldungen).
- Liste alle Meldungen (Probleme + Wünsche) mit Status-/Typ-Filter, clientseitigem „Nur meine Fragen"-Toggle, Deep-Link-Button.
- „Erledigt"-Checkbox pro Zeile (Toggle im Sheet).
- Sichtbarkeits-Regeln: Admin sieht alles; LPs sehen nur Meldungen mit Fragen-/Prüfungs-/Übungskontext.
- Zwei neue Endpoints in der **Haupt-Apps-Script**: `listeProblemmeldungen`, `markiereProblemmeldungErledigt`.
- Eine kleine Anpassung im **separaten Feedback-Apps-Script**: UUID-Generierung beim Write (neue Spalte `id`) + neue Spalte `erledigt` (leer).

### Out of Scope

- Automatische Archivierung / Löschung (YAGNI, Google Sheets hält 10M+ Zellen).
- Notiz-Feld beim Erledigt-Markieren („wie gelöst").
- Dreistufiger Workflow (Offen/In Arbeit/Erledigt).
- Push-Notifications oder E-Mail-Benachrichtigungen an LP.
- Reply-Funktion an SuS (heute Schreiber anonym, keine Email).
- Export/Bulk-Operations.

## Design-Entscheidungen

### Sichtbarkeits-Regeln

Reuse der bestehenden Helper `istSichtbarMitLP(email, item, lpInfo, istAdmin)` und `ermittleRechtMitLP(...)` aus `apps-script-code.js` (Z. 655 + 679). Diese decken bereits ab: Inhaber, Bearbeiter, Familie-Gruppen, Fachschaft-Sharing, Schule-Sharing, Admin-Override.

- **Admin** (`lpInfo.rolle === 'admin'`): sieht alle Meldungen — inklusive solche ohne Fragenkontext (UX-Feedback, Feature-Wünsche an die Plattform).
- **LP**: sieht eine Meldung nur, wenn
  1. die Meldung mindestens eines von `frageId`, `pruefungId`, `gruppeId` hat, **und**
  2. bei `frageId` gesetzt: `istSichtbarMitLP(email, frage, lpInfo, false)` → `true` (via Fragen-Sheet-Lookup).
  3. bei nur `pruefungId`/`gruppeId` ohne `frageId`: LP ist Inhaber/Bearbeiter der Prüfung-/Übungsgruppe (analog: `istSichtbarMitLP` auf dem Prüfungs-/Gruppen-Sheet).
- **SuS**: kein Zugriff. Das `EinstellungenPanel` ist in der SuS-Ansicht nicht erreichbar. Zusätzlich: Tab-Definition mit `sichtbar: rolle === 'lp'`, Backend-Rollen-Check über `istZugelasseneLP`.

**Client-Filter „Nur meine Fragen"** (Checkbox, Default AUS):
Filtert Meldungen nach `recht === 'inhaber'`. Das `recht`-Feld wird vom Backend als Teil des Meldungs-Payload gesetzt (Werte: `'inhaber'`, `'bearbeiter'`, `'berechtigt'`, `'admin'`).

### Privacy: `frageText`-Schutz

`frageText` (die ersten 200 Zeichen der Frage, vom FeedbackModal mitgesendet) wird an LPs mit Leserecht auf die Frage weitergegeben. Für **Admin ohne Leserecht** (z.B. durch spätere Rechte-Änderung) oder bei nicht-auflösbarer `frageId`: Ersatztext `'[Fragentext nicht einsehbar]'` im Backend ausliefern.

Rendering-Invariante (Frontend): `comment` und `frageText` werden ausschliesslich als React-Text-Nodes gerendert — kein `dangerouslySetInnerHTML`, kein `title=`-Attribut, kein `href=` mit User-Content.

### Status-Workflow

- Eine einzige Boolean-Spalte `erledigt` (`''` / `'ja'`).
- **Status-Filter** oben: `Offen` (Default) / `Erledigt` / `Alle`.
- Erledigte Meldungen bleiben im Sheet (Historie / Audit). Keine Auto-Archivierung.
- Tab-Badge zählt nur **offene** Meldungen im Sichtbarkeitsbereich des Users.

### Typ-Handling

- Beide Typen (`problem` und `wunsch`) in einer Liste.
- **Typ-Filter** oben: `Alle` (Default) / `Probleme` / `Wünsche`.
- Typ-Badge pro Zeile (🔴 Problem / 💡 Wunsch).

### Deep-Link (Priorität)

Universal-Link pro Zeile. Klick öffnet ein Ziel, in dieser Priorität:

1. **`frageId` vorhanden** → Fragensammlung-Editor auf die Frage. Falls LP keinen Lesezugriff hat (Inhaber-Check im Backend), Link disabled mit Tooltip.
2. **`pruefungId`** oder **`gruppeId`** → Prüfungs-/Übungsgruppen-Settings. Falls nicht Inhaber, disabled.
3. **`ort`** (Bildschirm-Kontext, z.B. `dashboard`, `sus-startseite`) → als reiner Text angezeigt, kein klickbarer Link.

### Sortierung

- Neueste zuerst (`zeitstempel DESC`).

### Backend-Architektur (Hybrid)

Begründung: Schreiben muss anonym bleiben (SuS-Pseudo-Anonymität), Lesen/Toggle braucht Auth.

- **Schreiben** (unverändert): separater Feedback-Apps-Script, `no-cors` GET, neue Spalten `id` (UUID beim Write) + `erledigt` (leer).
- **Lesen** (`listeProblemmeldungen`): neu in Haupt-Apps-Script, **Session-Token-Validierung via `lernplattformValidiereToken_(body.token, email)`** (analog zu allen anderen LP-Endpoints, siehe apps-script-code.js:249/299/332), Rate-Limit `lernplattformRateLimitCheck_('listeProblemmeldungen', email, 30, 300)`. Greift per `SpreadsheetApp.openById(SCRIPT_PROPERTY_PROBLEMMELDUNGEN_SHEET_ID)` auf das Sheet zu (Sheet-ID als Script-Property, nicht hardcoded).
- **Toggle** (`markiereProblemmeldungErledigt`): neu in Haupt-Apps-Script, Token-Validierung + Rate-Limit + IDOR-Check über `ermittleRechtMitLP` (Inhaber, Bearbeiter, Admin dürfen togglen).

### Batch-Auflösung der Fragen-Inhaber

Der Lese-Endpoint darf pro Request **nur ein einziges Mal** das Fragen-Sheet lesen. Pattern:

```js
function baueFrageMetaMap_(frageIds) {
  var map = {}
  if (!frageIds.length) return map
  var sheet = SpreadsheetApp.openById(…).getSheetByName('Fragen')
  var data = sheet.getDataRange().getValues()  // 1 Read
  // Index nach id, einmalig
  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][idCol])
    if (frageIds.indexOf(id) >= 0) {
      map[id] = { inhaberEmail: …, geteilt: …, fachschaft: …, pruefungstauglich: … }
    }
  }
  return map
}
```

Einmal aufrufen mit allen `frageIds` aus der Meldungs-Liste (deduped), Ergebnis in den Map-Lookup stecken.

### Minimal-Invasiv: Schreibpfad bleibt

Das separate Feedback-Apps-Script bekommt genau eine Zeile mehr: UUID beim Write generieren und in neue Spalte `id` schreiben. Keine anderen Änderungen. Risiko minimal.

## Architektur

### Frontend-Komponenten (Neu)

```
src/components/settings/problemmeldungen/
├── ProblemmeldungenTab.tsx           // Container, State-Management
├── ProblemmeldungenListe.tsx         // Listen-Rendering
├── ProblemmeldungZeile.tsx           // Eine Zeile (Badge, Kontext, Link, Checkbox)
├── ProblemmeldungenFilter.tsx        // Status/Typ/Scope-Filter
└── problemmeldungenApi.ts            // Client-Wrapper um postJson
```

**Integration in `EinstellungenPanel.tsx`:**

```tsx
const tabs: { key: EinstellungenTab; label: string; sichtbar: boolean }[] = [
  { key: 'profil', label: 'Mein Profil', sichtbar: true },
  { key: 'lernziele', label: 'Lernziele', sichtbar: true },
  { key: 'favoriten', label: 'Favoriten', sichtbar: true },
  { key: 'uebungen', label: 'Übungen', sichtbar: true },
  { key: 'problemmeldungen', label: `Problemmeldungen (${offeneCount})`, sichtbar: true },
  { key: 'admin', label: 'Admin', sichtbar: admin },
  { key: 'kiKalibrierung', label: 'KI-Kalibrierung', sichtbar: true },
]
```

Badge-Count (`offeneCount`) wird aus der **bereits geladenen Liste** derivered (In-Memory-Count über `listeProblemmeldungen`-Response gefiltert auf `!erledigt`). Kein eigener Count-Endpoint — das würde einen Extra-Roundtrip pro Panel-Öffnung bedeuten (Apps-Script-Latenz ~1.5–2 s, siehe code-quality.md).

**Lazy-Load:** Die Liste wird beim ersten Öffnen des EinstellungenPanels geladen (unabhängig vom aktiven Tab), damit der Tab-Badge sofort korrekt ist. Danach bei jedem Erledigt-Toggle: optimistisches Update im Client + Re-Fetch bei Fehler.

**Type Union erweitern:**
```ts
// store/lpUIStore.ts
export type EinstellungenTab =
  | 'profil' | 'lernziele' | 'favoriten' | 'uebungen'
  | 'problemmeldungen' | 'admin' | 'kiKalibrierung'
```

**Deep-Link-Navigation:**
- Frage-Link: Navigiert via `useNavigate` (oder existierendem Router) auf `/lp/fragensammlung?frageId=<id>&oeffne=edit`. Der Router-Handler öffnet die Frage direkt im `FragenEditor`. Falls die Route nicht existiert, `window.location.href` als Fallback.
- Prüfungs-/Gruppen-Link: analog, jeweils auf bestehende Admin-Settings-Ansicht mit Pre-Selection.

### Backend-Endpoints (Haupt-Apps-Script) — Pseudo-Code

**Script-Property nötig:** `PROBLEMMELDUNGEN_SHEET_ID` = ID des Sheets „ExamLab Problemmeldungen".

```js
// --- Dispatcher ---
case 'listeProblemmeldungen': return listeProblemmeldungen(body)
case 'markiereProblemmeldungErledigt': return markiereProblemmeldungErledigt(body)

function listeProblemmeldungen(body) {
  var email = String(body.email || '').toLowerCase()
  if (!istZugelasseneLP(email)) return jsonResponse({error: 'Nicht autorisiert'})
  if (!lernplattformValidiereToken_(body.token || body.sessionToken, email))
    return jsonResponse({error: 'Token ungültig'})
  var rl = lernplattformRateLimitCheck_('listeProblemmeldungen', email, 30, 300)
  if (!rl.ok) return jsonResponse({error: 'Rate-Limit', retryAfter: rl.retryAfter})

  var lpInfo = findeLPInfo_(email)
  var istAdmin = lpInfo && lpInfo.rolle === 'admin'

  var sheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('PROBLEMMELDUNGEN_SHEET_ID')
  ).getSheetByName('ExamLab-Problemmeldungen')

  var lastCol = sheet.getLastColumn()
  var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : []
  var lastRow = sheet.getLastRow()
  var rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : []
  var col = function(name) { return headers.indexOf(name) }

  // Batch-Auflösung aller frageIds in EINEM Sheet-Read
  var frageIds = []
  rows.forEach(function(r) {
    var id = String(r[col('frageId')] || '')
    if (id && frageIds.indexOf(id) < 0) frageIds.push(id)
  })
  var frageMap = baueFrageMetaMap_(frageIds)  // {id: {inhaberEmail, geteilt, fachschaft, istPool, ...}}

  // Pruefung/Gruppe analog
  var pruefungIds = []
  rows.forEach(function(r) {
    var id = String(r[col('pruefungId')] || r[col('gruppeId')] || '')
    if (id && pruefungIds.indexOf(id) < 0) pruefungIds.push(id)
  })
  var gruppeMap = baueGruppeMetaMap_(pruefungIds)

  var meldungen = rows.map(function(r) {
    var frageId = String(r[col('frageId')] || '')
    var pruefungId = String(r[col('pruefungId')] || '')
    var gruppeId = String(r[col('gruppeId')] || '')
    var frageMeta = frageMap[frageId] || null
    var gruppeMeta = gruppeMap[pruefungId] || gruppeMap[gruppeId] || null

    // Sichtbarkeit + Recht via bestehende Helper
    var sichtbarFrage = frageMeta ? istSichtbarMitLP(email, frageMeta, lpInfo, istAdmin) : false
    var sichtbarGruppe = gruppeMeta ? istSichtbarMitLP(email, gruppeMeta, lpInfo, istAdmin) : false
    var sichtbar = istAdmin || sichtbarFrage || sichtbarGruppe
    if (!sichtbar) return null  // filtert raus

    var recht = 'keine'
    if (frageMeta && sichtbarFrage) recht = ermittleRechtMitLP(email, frageMeta, lpInfo, istAdmin)
    else if (gruppeMeta && sichtbarGruppe) recht = ermittleRechtMitLP(email, gruppeMeta, lpInfo, istAdmin)
    else if (istAdmin) recht = 'admin'

    // Privacy: frageText nur wenn Leserecht
    var frageTextRaw = String(r[col('frageText')] || '')
    var frageText = sichtbarFrage || istAdmin ? frageTextRaw : ''

    return {
      id: String(r[col('id')] || ''),
      zeitstempel: toIsoStr_(r[col('zeitstempel')]),
      typ: String(r[col('typ')] || ''),
      category: String(r[col('category')] || ''),
      comment: String(r[col('comment')] || ''),
      rolle: String(r[col('rolle')] || ''),
      frageId: frageId,
      frageText: frageText,
      frageTyp: String(r[col('frageTyp')] || ''),
      modus: String(r[col('modus')] || ''),
      pruefungId: pruefungId,
      gruppeId: gruppeId,
      ort: String(r[col('ort')] || ''),
      appVersion: String(r[col('appVersion')] || ''),
      inhaberEmail: frageMeta ? frageMeta.inhaberEmail : '',
      inhaberAktiv: frageMeta ? frageMeta.inhaberAktiv : true,  // false = ehemalige LP
      istPoolFrage: frageMeta ? !!frageMeta.istPool : false,
      recht: recht,  // 'inhaber'|'bearbeiter'|'berechtigt'|'admin'|'keine'
      erledigt: String(r[col('erledigt')] || '').toLowerCase() === 'ja',
    }
  }).filter(function(m) { return m !== null })

  return jsonResponse({ success: true, data: meldungen })
}

function markiereProblemmeldungErledigt(body) {
  var email = String(body.email || '').toLowerCase()
  var id = String(body.id || '')
  var erledigt = !!body.erledigt
  if (!istZugelasseneLP(email)) return jsonResponse({error: 'Nicht autorisiert'})
  if (!lernplattformValidiereToken_(body.token || body.sessionToken, email))
    return jsonResponse({error: 'Token ungültig'})
  var rl = lernplattformRateLimitCheck_('toggleProblemmeldung', email, 60, 300)
  if (!rl.ok) return jsonResponse({error: 'Rate-Limit'})
  if (!id) return jsonResponse({error: 'id fehlt'})

  var lpInfo = findeLPInfo_(email)
  var istAdmin = lpInfo && lpInfo.rolle === 'admin'

  var sheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('PROBLEMMELDUNGEN_SHEET_ID')
  ).getSheetByName('ExamLab-Problemmeldungen')

  var lastCol = sheet.getLastColumn()
  var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : []
  var idCol = headers.indexOf('id')
  var erledigtCol = headers.indexOf('erledigt')
  var frageIdCol = headers.indexOf('frageId')
  var pruefungIdCol = headers.indexOf('pruefungId')
  var gruppeIdCol = headers.indexOf('gruppeId')
  var lastRow = sheet.getLastRow()
  if (idCol < 0 || erledigtCol < 0) return jsonResponse({error: 'Sheet-Header kaputt'})

  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : []
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][idCol]) !== id) continue

    // IDOR: nicht-Admin muss Recht 'inhaber' oder 'bearbeiter' auf Frage/Gruppe haben
    if (!istAdmin) {
      var frageId = String(data[i][frageIdCol] || '')
      var gruppeId = String(data[i][pruefungIdCol] || data[i][gruppeIdCol] || '')
      var recht = 'keine'
      if (frageId) {
        var fmeta = baueFrageMetaMap_([frageId])[frageId]
        if (fmeta && istSichtbarMitLP(email, fmeta, lpInfo, false)) {
          recht = ermittleRechtMitLP(email, fmeta, lpInfo, false)
        }
      }
      if (recht === 'keine' && gruppeId) {
        var gmeta = baueGruppeMetaMap_([gruppeId])[gruppeId]
        if (gmeta && istSichtbarMitLP(email, gmeta, lpInfo, false)) {
          recht = ermittleRechtMitLP(email, gmeta, lpInfo, false)
        }
      }
      if (recht !== 'inhaber' && recht !== 'bearbeiter') {
        return jsonResponse({error: 'Keine Berechtigung für diese Meldung'})
      }
    }

    sheet.getRange(i + 2, erledigtCol + 1).setValue(erledigt ? 'ja' : '')
    return jsonResponse({ success: true })
  }
  return jsonResponse({error: 'Meldung nicht gefunden'})
}
```

**`baueFrageMetaMap_(frageIds)` / `baueGruppeMetaMap_(ids)`:** jeweils 1 Sheet-Read pro Request, Ergebnis in `{id: meta}`-Dict. Bei nicht-auflösbarer ID → kein Eintrag → Meldung für LP nicht sichtbar (nur Admin sieht sie). Das `inhaberAktiv`-Flag prüft, ob die Inhaber-Email noch im LP-Sheet steht.

### Feedback-Apps-Script (separat) — Minimal-Patch

Nur im Write-Handler:

```js
function doGet(e) {
  // … bestehender Code …
  var row = [
    new Date(),                    // zeitstempel
    Utilities.getUuid(),           // NEU: id (UUID v4)
    '',                            // NEU: erledigt (leer = offen)
    e.parameter.rolle || '',
    // … rest bleibt identisch …
  ]
  sheet.appendRow(row)
}
```

Bestehende Zeilen im Sheet haben keine UUID — Backfill-Skript (einmalig): fülle leere `id`-Zellen mit `Utilities.getUuid()`. Läuft als manueller GAS-Function-Aufruf vom Admin.

## Datenschema

Sheet *„ExamLab Problemmeldungen"*, Tab *„ExamLab-Problemmeldungen"*:

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| zeitstempel | Date | Einreichzeit |
| **id** (neu) | String (UUID) | Eindeutige ID pro Meldung, für Toggle |
| **erledigt** (neu) | String | `''` oder `'ja'` |
| rolle | String | `'lp'` oder `'sus'` |
| ort | String | Bildschirm-Kontext |
| typ | String | `'problem'` oder `'wunsch'` |
| category | String | z.B. `'Fachlicher Fehler'` |
| comment | String | Optional, bis 500 Zeichen |
| pruefungId | String | Optional |
| frageId | String | Optional |
| frageText | String | Optional, bis 200 Zeichen |
| zusatzinfo | String | Optional |
| frageTyp | String | Optional |
| modus | String | `'pruefen'` / `'ueben'` / `'fragensammlung'` |
| bildschirm | String | Optional |
| appVersion | String | Build-Timestamp |
| gruppeId | String | Optional |

## Security / Privacy

- **Schreibpfad bleibt anonym**: keine Email wird geschickt, kein Auth-Token.
- **Lesen** (`listeProblemmeldungen`):
  - `istZugelasseneLP(email)` — LP ist im LP-Sheet.
  - `lernplattformValidiereToken_(body.token, email)` — Session-Token gültig.
  - `lernplattformRateLimitCheck_('listeProblemmeldungen', email, 30, 300)` — max. 30/5min pro LP.
- **Toggle** (`markiereProblemmeldungErledigt`):
  - Gleiche 3 Checks wie oben (Auth, Token, Rate-Limit `toggleProblemmeldung` 60/5min).
  - **IDOR-Schutz**: nicht-Admin muss `recht ∈ {'inhaber', 'bearbeiter'}` auf der verknüpften Frage oder Prüfungs-/Übungsgruppe haben. Via `istSichtbarMitLP` + `ermittleRechtMitLP` (bestehende Helper, unterstützen Familie, Fachschaft-Sharing, Schule-Sharing).
- **Privacy für `frageText`**: LP sieht Volltext nur bei Leserecht auf die Frage (`istSichtbarMitLP === true`). Sonst liefert Backend `frageText: ''`.
- **Pool-Fragen**: `frageId` → kein Inhaber im Fragen-Sheet. Meldung nur für Admin sichtbar (oder für LP, falls Meldung zusätzlich eine Prüfungs-`gruppeId` hat und LP dort Rechte hat).
- **Ehemalige LPs**: `inhaberEmail` nicht mehr in `istZugelasseneLP` → Meldung wird als "orphan" für Admin mit Badge "ehemaliger Inhaber" markiert. LP sieht sie nur, wenn sie selbst jetzt Inhaber/Bearbeiter via anderem Weg ist.
- **Frontend XSS-Regel**: `comment`, `frageText`, `ort` werden **ausschliesslich als React-Text** gerendert. Kein `dangerouslySetInnerHTML`, kein `title={…}`-Attribut mit User-Content, kein `href={…}` mit User-Content.
- **SuS-Ansicht**: Tab `problemmeldungen` nur wenn `rolle === 'lp'`. SuS erreichen `EinstellungenPanel` zudem nicht — doppelte Absicherung.

### Akzeptiertes Rest-Risiko

**SuS-Meldung während laufender Prüfung wird sofort sichtbar.** Theoretisch könnte ein SuS via Meldung Hinweise an LP signalisieren (oder umgekehrt beim Querlesen). Akzeptiert, weil:
- LPs checken das Dashboard nicht mehrmals pro Minute während einer laufenden Prüfung (Monitoring-Tab ist der Hot-Path).
- Meldungs-Kommentare sind kurz (max. 500 Zeichen) und werden kaum Lösungen enthalten.
- Alternative (Delay/Suppress während laufender Prüfung) wäre Feature-Creep für v1.
- Bei Bedarf später nachrüstbar: Backend-Filter, der Meldungen mit `rolle='sus' && modus='pruefen'` erst nach Prüfungsende anzeigt.

## Rollout (Reihenfolge kritisch)

1. **Feature-Branch** `feature/problemmeldungen-dashboard`.
2. **Feedback-Apps-Script (separat) ZUERST:**
   a. Schema-Migration: Spalten `id` (nach `zeitstempel`) + `erledigt` (nach `id`) ins Sheet einfügen.
   b. **Backfill-Function** `backfillUuids()` als GAS-Function: füllt alle leeren `id`-Zellen mit `Utilities.getUuid()`. User führt manuell im Editor aus, **vor** Deploy des neuen Write-Handlers.
   c. Write-Handler patchen: `Utilities.getUuid()` in `id`-Spalte schreiben.
   d. Neue Bereitstellung.
3. **Haupt-Apps-Script DANACH:**
   a. `PROBLEMMELDUNGEN_SHEET_ID` als Script-Property setzen.
   b. 2 neue Endpoints + `baueFrageMetaMap_` / `baueGruppeMetaMap_` implementieren.
   c. Smoke-Test-Funktion (wie bei C9) im GAS-Editor.
   d. Neue Bereitstellung.
4. **Frontend:** 5 neue Komponenten + Tab-Integration + Type-Union erweitern.
5. Tests (vitest): Filter-Logik (Scope/Status/Typ), Deep-Link-Priorität, Erledigt-Toggle-Optimistic-Update, Legacy-Row-Handling (id leer → Toggle disabled).
6. Staging-Deploy + E2E mit echten Logins (Admin + LP + eine LP ohne Fragen → leere Liste).
7. User-Freigabe → Merge `main`.

### Legacy-Row-Handling

Falls der Backfill-Schritt (2b) aus Zeitgründen nicht vor dem ersten neuen Write läuft, könnten im Sheet Zeilen ohne `id` existieren. Frontend-Verhalten:

- Zeile wird normal angezeigt.
- Erledigt-Checkbox ist **disabled** mit Tooltip „Legacy-Eintrag, bitte Admin kontaktieren (Backfill nötig)".
- Backend: `markiereProblemmeldungErledigt` returnt `error: 'id fehlt'` → UI zeigt Toast.

## Offene Fragen

Keine — alle relevanten Entscheidungen sind im Brainstorming beantwortet:

- Wer sieht was: Admin alles; LP nur mit Fragenkontext, Sichtbarkeit via `istSichtbarMitLP` (inkl. Familie/Fachschaft/Schule-Sharing).
- Status: 2-stufig (Offen/Erledigt).
- Typ: beide Typen in einer Liste mit Filter-Badge.
- Deep-Link: Universal-Link mit Priorität `frageId > pruefungId/gruppeId > ort`.
- Archivierung: keine, Filter reicht.
- Backend: Hybrid (Schreiben unverändert, Lesen/Toggle in Haupt-Apps-Script mit Token-Auth + IDOR via `ermittleRechtMitLP`).
- Badge-Count: In-Memory aus geladener Liste derivered, kein Extra-Endpoint.
- Live-Prüfung: kein Delay in v1 (dokumentiertes Rest-Risiko).

## Review-Antworten (Reviewer v1, 2026-04-23)

| Issue | Lösung |
|-------|--------|
| Fehlende Session-Token-Validierung | `lernplattformValidiereToken_` in beiden Endpoints ergänzt. |
| IDOR zu simpel (Email-Match statt Recht) | Umgestellt auf `istSichtbarMitLP` + `ermittleRechtMitLP` — unterstützt Inhaber, Bearbeiter, Familie, Fachschaft, Schule. |
| Privacy `frageText` | Backend liefert `frageText: ''` bei fehlendem Leserecht. |
| `SHEET_ID` hardcoded vs. Property | Eindeutig als Script-Property. |
| Familie-Gruppen | Implizit via `istSichtbarMitLP` abgedeckt. |
| Ehemalige LPs | `inhaberAktiv`-Flag im Payload, UI-Badge „ehemaliger Inhaber". |
| Pool-Fragen | `istPoolFrage`-Flag im Payload, Deep-Link disabled. |
| Rate-Limit fehlt | Hinzugefügt: 30/5min Lesen, 60/5min Toggle. |
| Badge-Count überdesignt | Ersetzt durch In-Memory-Derivation. |
| Batch-Resolver | `baueFrageMetaMap_` / `baueGruppeMetaMap_` (je 1 Sheet-Read). |
| Rollout-Reihenfolge unklar | Konkretisiert: (2) Feedback-Script inkl. Backfill → (3) Haupt-Script → (4) Frontend. |
| Legacy-Rows ohne UUID | Frontend: disabled-Toggle + Tooltip. |
| XSS-Regel für `comment`/`frageText` | Explizite Rendering-Invariante. |
| SuS-Tab-Filter | `sichtbar: rolle === 'lp'` (+ doppelte Absicherung durch SuS ohne EinstellungenPanel-Route). |
| Live-Prüfung-Fraud-Risiko | Dokumentiertes Rest-Risiko, kein Fix in v1. |

### Implementation-Notes aus Review-Runde 2 (2026-04-23)

Reviewer hat 3 kleine Hinweise gegeben, die direkt im Plan (nicht Spec-Revision) umgesetzt werden:

1. **`baueGruppeMetaMap_` auftrennen:** `pruefungId` und `gruppeId` kommen aus getrennten Sheets (`Pruefungen` und `Uebungsgruppen`). ID-Kollision zwischen Sheets könnte falsche Sichtbarkeit ergeben. Lösung: entweder zwei getrennte Helper oder ein Helper mit beiden Sheets und `{pruefungen:{}, gruppen:{}}`-Rückgabe.
2. **Script-Property-Guard:** Beide Endpoints mit `if (!sheetId) return jsonResponse({error: 'Problemmeldungen-Sheet nicht konfiguriert'})` abfangen. Zusätzlich `if (!sheet) return jsonResponse({error: 'Sheet-Tab nicht gefunden'})` für den Fall, dass der Tab-Name nicht stimmt.
3. **`Recht`-Type-Union Frontend:** `export type Recht = 'inhaber'|'bearbeiter'|'berechtigt'|'admin'|'keine'` definieren (z.B. in `src/types/recht.ts`), sodass `recht === 'inhaber'`-Filter type-safe ist.
