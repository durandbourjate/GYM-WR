# Musterlösungen-Bereinigung — Design

Datum: 2026-04-20
Status: Freigegeben durch User, zwei Implementierungs-Pläne folgen
Kontext: Security-Hinweis aus S119, teilweise adressiert in S122, vollständig abzuschliessen in S126+

## Problem

Drei Modi, unterschiedliche Security-Anforderungen:

| Modus                         | Ladepfad darf Lösung enthalten? | Musterlösung wird freigeschaltet durch                                  |
|-------------------------------|---------------------------------|-------------------------------------------------------------------------|
| Prüfung (summativ)             | nein                            | LP-Korrekturfreigabe nach Abgabe                                      |
| Prüfen (angeleitet, ohne Note) | nein                            | LP-Korrekturfreigabe nach Abgabe (gleicher Code wie Prüfung)          |
| Selbstständig Üben             | nein                            | Separater autorisierter Endpoint beim Session-Start (Pre-Load)        |

Nach Audit am 2026-04-20 bestehen zwei unabhängige Lücken:

### Lücke 1: Prüfung nutzt nur milde Bereinigung

`ladePruefung` in `apps-script-code.js:1583` wendet `bereinigeFrageFuerSuS_` (Zeile 1639) an. Diese entfernt:

- `musterlosung`, `bewertungsraster`
- MC: `optionen[].korrekt`, `optionen[].erklaerung`
- R/F: `aussagen[].korrekt`, `aussagen[].erklaerung`
- Lückentext: `luecken[].korrekteAntworten`, `luecken[].korrekt`
- Berechnung: `ergebnisse[].korrekt`, `ergebnisse[].toleranz`

**Nicht entfernt:** FiBu (`buchungen`, `konten[].korrekt`, T-Konto-`saldo`, `bilanzEintraege[].korrekt`, `aufgaben[].erwarteteAntworten`, `bilanzstruktur.loesung`), Hotspot `bereiche[].korrekt`, Bildbeschriftung/DragDrop `labels[].zoneId`, `zielzonen[].korrektesLabel`, `beschriftungen[].korrekt`, Formel `korrekteFormel` / `korrekt`.

Diese Felder werden ausschliesslich in `bereinigeFrageFuerSuSUeben_` (Zeile 1710) entfernt, die aber nur vom Üben-Endpoint aufgerufen wird.

Folge: In Prüfung + angeleitetem Prüfen sieht SuS im Network-Tab Lösungsfelder für FiBu-, Hotspot- und Bildbeschriftungs-Fragen.

### Lücke 2: Selbstständiges Üben hat duales Frontend

Backend bereinigt korrekt (Zeile 7795). Aber Frontend hat zwei Korrektur-Pfade:

- `uebungsStore.beantworteById` → clientseitige `pruefeAntwort()` aus `utils/ueben/korrektur.ts` (braucht Lösungsfelder)
- `uebungsStore.pruefeAntwortJetzt` → serverseitig via `lernplattformPruefeAntwort` (braucht keine)

Solange Lösungsfelder im Lade-Response fehlen, bricht die clientseitige Korrektur still (`korrekt = false` oder `undefined`-Exception, die Defensive Normalizer abfängt). UX-Latenz pro Prüf-Call: ~1.5–2s (Apps-Script-Plattform-Limit).

## Architektur-Überblick

Zwei Bundles, unabhängig umsetzbar:

- **Bundle P** — Prüfung-Hardening (Backend-only): schliesst Lücke 1 durch Konsolidierung der Bereinigungs-Funktionen.
- **Bundle Ü** — Üben-Pre-Load (Backend + Frontend): schliesst Lücke 2 durch autorisierten separaten Lösungs-Endpoint beim Session-Start.

Bundle P ist Voraussetzung für keine, blockiert nicht Bundle Ü. Empfohlene Reihenfolge: P zuerst (klein, niedriges Risiko), Ü als Folge-Session.

## Bundle P — Prüfung-Hardening

### Änderungen

Alle in [`apps-script-code.js`](../../../apps-script-code.js):

1. **Konsolidierung.** `bereinigeFrageFuerSuS_` erhält die volle strenge Bereinigung — also den kompletten Inhalt der aktuellen `bereinigeFrageFuerSuSUeben_` **minus** den Mischungs-Switch (Zeilen 1795–1835).
2. **Mischung extrahiert.** Neue Funktion `mischeFrageOptionen_(frage)` kapselt den `switch(f.typ) case 'mc'|'richtigfalsch'|'sortierung'|'zuordnung'|'bildbeschriftung'|'dragdrop_bild'|'hotspot'|'lueckentext'`-Block.
3. **`bereinigeFrageFuerSuSUeben_` wird Ein-Zeiler:**
   ```js
   function bereinigeFrageFuerSuSUeben_(frage) {
     return mischeFrageOptionen_(bereinigeFrageFuerSuS_(frage));
   }
   ```
4. **Keine Änderung an Call-Sites.** `ladePruefung` (1583), `ladeAbgabe`, `lernplattformLadeFragen` (7795) bleiben textuell gleich — aber `ladePruefung` erhält automatisch die strenge Variante, weil `bereinigeFrageFuerSuS_` jetzt streng ist.
5. **Verifikation am Endpoint:** `ladePruefung` + `lernplattformLadeFragen` liefern nach Deploy identische Lösungsfeld-Bereinigung für SuS.

### Tests

- **Apps-Script-Code ist nicht in vitest erreichbar** → keine neuen vitest-Unit-Tests.
- **Manueller Staging-Test (Pflicht vor Merge):**
  - LP-Tab erstellt Test-Prüfung aus Einrichtungsprüfung (enthält Hotspot, Bildbeschriftung, DragDrop, FiBu-Typen).
  - SuS-Tab startet Prüfung → Network-Tab `ladePruefung`-Response prüfen: keines der aufgeführten Felder sichtbar.
  - LP-Tab: Prüfung laden → alle Lösungsfelder sichtbar (LP-Pfad unberührt).

### Deploy

- Apps-Script-Deploy durch User (siehe bestehendes Muster).
- Rollback: Backup des `apps-script-code.js` vor Änderung, alte Deployment-Version bei Problem reaktivieren.

### Risiko

Niedrig. LP-Pfad ist unverändert. SuS-Pfad wird strikter — einzig möglicher Regressions-Trigger: eine Komponente im Prüfungs-Frontend (`pruefungStore` + UI), die heimlich ein Lösungsfeld aus dem Lade-Response verwendet. Audit-Grep (`musterlosung`, `korrekt`, `bereiche[].korrekt`, `labels[].zoneId` etc. in `ExamLab/src/components/fragetypen/**/*.tsx`) zeigt: alle Lese-Stellen sind in LP-Komponenten (Korrekturansicht, Editor) oder hinter Mode-Guards. Keine SuS-Komponente liest während einer aktiven Prüfung ein Lösungsfeld.

## Bundle Ü — Üben-Pre-Load

### Backend (Apps-Script)

Neuer Endpoint `lernplattformLadeLoesungen`:

```
POST {
  action: 'lernplattformLadeLoesungen',
  gruppeId: string,
  fragenIds: string[],
  email: string,
  token: string,
  fachbereichHint?: string,  // wie bei lernplattformPruefeAntwort: 1 Tab statt 4
}

Response {
  success: true,
  loesungen: { [frageId]: LoesungsSlice }
}
```

`LoesungsSlice` enthält nur Lösungs-relevante Felder pro Fragetyp:

| Fragetyp          | Felder                                                                    |
|-------------------|---------------------------------------------------------------------------|
| allgemein         | `musterlosung`, `bewertungsraster`                                        |
| mc                | `optionen: [{id, korrekt, erklaerung}]`                                    |
| richtigfalsch     | `aussagen: [{id, korrekt, erklaerung}]`                                    |
| lueckentext       | `luecken: [{id, korrekteAntworten}]`                                       |
| berechnung        | `ergebnisse: [{id, korrekt, toleranz}]`                                    |
| hotspot           | `bereiche: [{id, korrekt, punkte}]`                                        |
| bildbeschriftung  | `labels: [{id, zoneId}]`, `beschriftungen: [{id, korrekt}]`                |
| dragdrop_bild     | `labels: [{id, zoneId}]`, `zielzonen: [{id, korrektesLabel}]`              |
| zuordnung         | `paare: [{links, rechts}]`                                                 |
| sortierung        | `elemente: [{id, position}]`                                               |
| formel            | `korrekteFormel`, `korrekt`                                                |
| buchungssatz      | `buchungen`, `korrektBuchung`                                              |
| tkonto            | `konten[].eintraege`, `konten[].saldo`                                     |
| bilanzstruktur    | `loesung`, `bilanzEintraege[].korrekt`                                     |
| kontenbestimmung  | `konten[].korrekt`, `aufgaben[].erwarteteAntworten`                        |
| aufgabengruppe    | rekursiv: `teilaufgaben[].<LoesungsSlice>`                                 |
| freitext, audio, pdf, code, visualisierung | `musterlosung`, `bewertungsraster` (Selbstbewertung) |

Auth: identisch zu `lernplattformPruefeAntwort` (Token + Mitgliedschaft-Check).

Rate-Limit: 5 Calls/Minute pro SuS (Session-Start lädt 1× — reicht).

Implementation-Detail: `extrahiereLoesungsSlice_(frage)` als Gegenstück zu `bereinigeFrageFuerSuS_`, nutzt dieselbe Feldliste (DRY — gemeinsame Konstante `LOESUNGS_FELDER_` mit Feldnamen pro Fragetyp, beide Funktionen lesen daraus).

Logging: `Logger.log('[lernplattformLadeLoesungen] gruppe=%s email=%s n=%d', gruppeId, email, fragenIds.length)` — Audit-Fähigkeit für Lösungs-Abrufe.

### Frontend

**Neuer Service** `src/services/uebenLoesungsApi.ts`:
- `ladeLoesungen(fragenIds, gruppeId, email, token, fachbereich?) → Promise<Record<string, LoesungsSlice>>`
- Timeout 10s, bei Fehler re-throw (nicht silent swallowen — Store entscheidet Fallback).

**Store-Integration** `src/store/ueben/uebungsStore.ts::starteSession`:
- Nach erfolgreichem `ladeFragen` + `erstelleBlock`: Ruft `ladeLoesungen(block.map(f => f.id), …)`.
- Merged Lösungs-Map in Session-interne Frage-Kopien: `block.map(f => ({...f, ...(loesungen[f.id] ?? {})}))`.
- Lösungen landen **nicht** im persistierten Store (persist-Middleware mit `partialize`), nur in `session.fragen` im In-Memory-State.
- Bei Pre-Load-Fehler: Session startet trotzdem. State-Flag `loesungenPreloaded: boolean` steuert Verhalten von `beantworteById`:
  - `true` → clientseitig via `pruefeAntwort()` (instant)
  - `false` → server-Fallback via `pruefeAntwortJetzt()` (Latenz, bisheriger Pfad)

**Store-Action** `beantworteById`:
- Liest `loesungenPreloaded` aus State.
- Bei `true`: bisheriger clientseitiger Pfad (Zeile 165–190).
- Bei `false`: delegiert an `pruefeAntwortJetzt(frageId)`.

**UI** `UebungsScreen.tsx`:
- Lösung-anzeigen-Button liest `frage.musterlosung` aus der gemergten Frage (wie bisher). Funktioniert automatisch sobald Pre-Load erfolgreich war.
- Bei `loesungenPreloaded === false`: Musterlösung kommt wie bisher via `letzteMusterloesung` aus dem Prüf-Response.

### Tests

- **vitest neu** `src/tests/uebenLoesungsApi.test.ts`: Endpoint-Aufruf mit Params + Error-Handling.
- **vitest neu** `src/tests/uebungsStoreLoesungsMerge.test.ts`: Merge-Logik in `starteSession` (Lösungen werden gemerged; Merge-Fehler → `loesungenPreloaded=false`; beantworteById wählt richtigen Pfad).
- **E2E-Staging** (manuell, mit echten Logins): Üben-Session starten → Network-Tab zeigt genau 1 `lernplattformLadeLoesungen`-Call (nicht per Frage). Antworten auf alle auto-korrigierbaren Fragetypen geben instant Feedback.
- **Regressionstest**: Pre-Load absichtlich failen lassen (z.B. via Chrome DevTools Network-Throttle + Endpoint-Override) → Session startet, Antworten gehen durch pruefeAntwortJetzt.

### Deploy

- Apps-Script-Deploy (neuer Endpoint). User muss deployen.
- Frontend-Deploy via GitHub Actions (Merge auf main).

### Risiko

Mittel. Der Fallback-Pfad ist kritisch — wenn Pre-Load silently failt und Fallback nicht greift, friert Üben-Session ein (beantworteById kann weder clientseitig noch serverseitig prüfen). Test-Plan muss Fallback-Pfad zwingend durchlaufen.

## Nicht im Scope

- **Tests als Apps-Script-Code-Einheiten**: Apps-Script hat keinen lokalen Runner. Backend-Änderungen werden manuell in Staging verifiziert.
- **KI-Prüfung / Automatische Prüfung nach Abgabe** (vom User im Kontext erwähnt): separater Task, nicht Teil dieser Bereinigung.
- **Selbstbewertungs-Typen** (Freitext/Audio/Visualisierung/PDF/Code) im Üben-Flow: aktueller Pfad bleibt (Server schickt `musterlosung` im `pruefeAntwortJetzt`-Response). Pre-Load schickt `musterlosung` mit, dann funktioniert auch Selbstbewertung ohne Server-Roundtrip. Trivialer Ko-Effekt von Bundle Ü.

## Reihenfolge der Pläne

Zwei separate Implementierungs-Pläne:

1. **Plan P** — `docs/superpowers/plans/2026-04-20-bundle-p-pruefung-hardening.md`
2. **Plan Ü** — `docs/superpowers/plans/2026-04-20-bundle-ue-ueben-preload.md`

Plan P wird zuerst geschrieben und umgesetzt. Plan Ü entsteht erst nach Freigabe von P, falls dabei Annahmen an der Code-Basis widerlegt werden (Risiko-Minimierung).

## Offene Punkte für Plan P

- Zeilen-genaue Extraktions-Grenzen für `mischeFrageOptionen_` (switch-Block).
- Audit-Grep-Ergebnis für SuS-Komponenten die Lösungsfelder lesen — bestätigen dass keine Call-Site bricht.
- Apps-Script-Deploy-Koordination (nicht während aktiver Prüfungen).

## Offene Punkte für Plan Ü

- `LOESUNGS_FELDER_`-Konstante: exakte Feldliste pro Fragetyp. Basis ist Line-by-Line-Cross-Check gegen `bereinigeFrageFuerSuSUeben_` — die LoesungsSlice-Tabelle oben ist **nicht vollständig**, es fehlen mindestens: `sollEintraege`/`habenEintraege` (buchungssatz), `konten[].anfangsbestand` (tkonto, bedingt bei `anfangsbestandVorgegeben=false`). Plan Ü startet mit dem Audit.
- Aufgabengruppe-Serialisierung: Response-Form für rekursive Teilaufgaben konkretisieren — entweder flache Map (`{<teilaufgabenId>: LoesungsSlice}`) oder verschachtelt (`teilaufgaben[].<LoesungsSlice>`). Entscheidung vor Backend-Implementation.
- Partial-Pre-Load-Strategie: Wenn der Endpoint einige Fragen-IDs aus der Response weglässt (z.B. Frage existiert nicht mehr, Rate-Limit mitten drin): pro-Frage-Fallback (`loesungenPreloaded` Map statt Boolean, fehlende Frage → `pruefeAntwortJetzt`) oder pro-Session-Fallback (alle-oder-nichts)? Entscheidung vor Store-Implementation.
- Persist-Middleware-`partialize` Konfiguration (Lösungen nicht persistieren).
- E2E-Fallback-Simulation: DevTools-basiert oder Feature-Flag im Service.
