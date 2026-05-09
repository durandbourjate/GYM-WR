# Phase 6.f — Sheet-Daten-Migration (User-Action)

**Datum:** 2026-05-09
**Typ:** USER-ACTION (Claude kann den Endpoint nicht selbst aufrufen — braucht LP-Token im Browser-Session)
**Endpoint:** `admin:migrierMediaQuelle` (Apps-Script Z. 1459, Implementation Z. 11629–11737)
**Status:** Bereit zum Ausführen

---

## 1 · Was 6.f macht

Bestehende Sheet-Rows in den 4 Tabs (VWL/BWL/Recht/Informatik) ergänzen MediaQuelle-Felder (`bild`/`pdf`) im `typDaten`-JSON. Funktionsweise des Endpoints:

1. Iteriert durch `BILD_TYPEN` (`hotspot`/`bildbeschriftung`/`dragdrop_bild`) + `pdf`
2. Pro Row: parst `typDaten`-JSON
3. Wenn `typDaten.bild`/`typDaten.pdf` fehlt: ergänzt aus Alt-Feldern via `mq_bildQuelleAus_`/`mq_pdfQuelleAus_`
4. Schreibt `typDaten`-JSON zurück (nur wenn `dryRun: false` und etwas geändert wurde)
5. Idempotent: bei zweitem Aufruf werden bereits migrierte Rows übersprungen (`!typDaten.bild`-Check)

**Wichtig:** Endpoint *ergänzt* nur `bild`/`pdf`. Alt-Felder (`bildUrl`/`pdfUrl`/`pdfBase64`/etc.) bleiben unverändert. Daten sind dual nach Migration → kompatibel zu altem + neuem Read-Pfad.

---

## 2 · Schritte (User)

### 2.1 Backup machen (Pflicht)

**Vor `dryRun: false`** zwingend: Fragensammlung-Sheet duplizieren.

Option A: Direkt im Drive Web-UI rechtsklick auf das Sheet → „Kopie erstellen". Name: `Fragensammlung_Backup_2026-05-09_pre-mediaquelle-migration`.

Option B: Versionshistorie im Sheet selber: Datei → Versionsverlauf → Version mit Namen versehen: „Pre-Phase-6f Migration Backup".

### 2.2 Dry-Run

Im Browser auf Staging eingeloggt als LP `wr.test@gymhofwil.ch` oder Admin `yannick.durand@gymhofwil.ch` (Admin-Privileg ist nötig — siehe Apps-Script Z. 11635 `var admins = ladeStammdatenKey_('admins')`).

Browser-Console (F12) auf einem Tab mit ExamLab geöffnet:

```javascript
// Token via Auth-Store holen, dann fetch zum Apps-Script-Endpoint
const authStore = (await import('/GYM-WR-DUY/staging/assets/index-XXX.js')).useAuthStore  // Note: Pfad muss aktuell sein
const token = useAuthStore.getState().token
fetch('https://script.google.com/macros/s/AKfycbz.../exec', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },  // Apps-Script erwartet text/plain (CORS-bypass)
  body: JSON.stringify({
    action: 'admin:migrierMediaQuelle',
    email: 'yannick.durand@gymhofwil.ch',
    callerEmail: 'yannick.durand@gymhofwil.ch',
    token,
    dryRun: true,
  })
}).then(r => r.json()).then(console.log)
```

**Einfacher Weg:** Apps-Script-Editor öffnen, manuelle Funktion aufrufen:

```javascript
function dryRunMigrieren() {
  var result = migrierFragenZuMediaQuelleEndpoint_({
    email: 'yannick.durand@gymhofwil.ch',
    callerEmail: 'yannick.durand@gymhofwil.ch',
    dryRun: true,
  });
  Logger.log(result.getContent());  // jsonResponse-Struktur
}
```

Im Apps-Script-Editor: Run-Button → Logs sichtbar via View → Logs (Cmd+Enter).

**Erwartete Response-Struktur:**

```json
{
  "success": true,
  "dryRun": true,
  "tabs": [
    { "name": "VWL", "rows": 1234, "aktualisiert": 45 },
    { "name": "BWL", "rows": 567, "aktualisiert": 12 },
    { "name": "Recht", "rows": 234, "aktualisiert": 8 },
    { "name": "Informatik", "rows": 89, "aktualisiert": 3 }
  ],
  "totalSummary": 68,
  "summary": [
    { "tab": "VWL", "row": 42, "typ": "hotspot", "feld": "bild", "quelleTyp": "drive" },
    ...  // bis zu 50 Items
  ],
  "errors": []
}
```

`aktualisiert` zeigt Anzahl Rows die geändert würden. Bei dryRun=true wird nichts geschrieben.

### 2.3 Live-Run

Nach erfolgreichem Dry-Run + Stichproben-Check der Summary:

```javascript
function liveRunMigrieren() {
  var result = migrierFragenZuMediaQuelleEndpoint_({
    email: 'yannick.durand@gymhofwil.ch',
    callerEmail: 'yannick.durand@gymhofwil.ch',
    dryRun: false,  // ← LIVE
  });
  Logger.log(result.getContent());
}
```

Response sollte gleiche `aktualisiert`-Zahlen zeigen wie dryRun.

### 2.4 Verifikation

1. **Stichproben-Check direkt in Sheet:** `typDaten`-Spalte einer Bild-Frage → JSON-Parse → `bild`-Feld vorhanden mit `{typ: 'drive', driveFileId: '...', mimeType: '...'}` (oder `pool`/`app`/`extern`/`inline` je nach Quelle).

2. **Re-Run mit dryRun=true:** sollte `aktualisiert: 0` zeigen (Idempotenz-Check).

3. **Browser-E2E:** ExamLab Staging im LP-Login: Bild-Frage öffnen, Bild rendert weiter (kein Regression).

---

## 3 · Risiko + Rollback

**Risiko niedrig (additive Migration):**
- Endpoint ergänzt nur fehlende Felder, löscht keine Alt-Spalten.
- Idempotent durch `!typDaten.bild`-Check.
- Alt-Daten bleiben kompatibel (bei späterem Frontend-Read über Resolver).

**Rollback:** Backup-Sheet zurückkopieren. Alternativ: Live-Run war additiv → Alt-Felder unverändert → kein Rollback nötig wenn `bild`/`pdf` Felder akzeptiert sind.

---

## 4 · Voraussetzung für

- **6.d Type-Removal:** Ohne 6.f hätten alte Daten ohne `bild`/`pdf` und Frontend würde leere Bilder zeigen nach Type-Removal.
- **6.e Apps-Script Schreib-Pfad-Cleanup:** Setzt voraus dass alle Daten MediaQuelle haben, bevor Alt-Spalten-Schreiben rückgebaut wird.

---

## 5 · Apps-Script-Code-Referenz

| Funktion | Zeile | Zweck |
|----------|-------|-------|
| `migrierFragenZuMediaQuelleEndpoint_` | 11629 | Haupt-Endpoint mit dryRun-Default |
| `mq_bildQuelleAus_` | 1731 | Konvertiert Alt-Felder zu MediaQuelle (Bild) |
| `mq_pdfQuelleAus_` | 1754 | Konvertiert Alt-Felder zu MediaQuelle (PDF) |
| `mq_klassifiziere_` | 1724 | Klassifiziert relativen Pfad als pool/app |
| `mq_extrahiereDriveId_` | 1712 | Extrahiert Drive-File-ID aus URLs |

Implementiert als Apps-Script-Mirror der Frontend-Migrator-Funktionen in `packages/shared/src/utils/mediaQuelleMigrator.ts`.
