# Design — Security-Hardening selbstständiges Üben

**Datum:** 2026-04-19
**Kontext:** S120 Follow-up nach S119. Security-Hinweis aus HANDOFF.md Z71: `lernplattformLadeFragen()` gibt `korrekteAntworten` 1:1 an SuS zurück.
**Status:** Design — in Review

---

## Ausgangslage

ExamLab hat drei SuS-Modi:

| Modus | Datenfluss | Bereinigung | Korrektur |
|-------|-----------|-------------|-----------|
| Prüfung | `ladePruefung()` | ✅ `bereinigeFrageFuerSuS_` | LP korrigiert später (ggf. KI) |
| Angeleitete Übung | `ladePruefung()` (Modus=`uebung`) | ✅ `bereinigeFrageFuerSuS_` | LP korrigiert später |
| Selbstständige Übung | `lernplattformLadeFragen()` | ❌ **kein Filter** | Client-side sofort nach Klick |

**Bug:** In Modus 3 werden komplette Fragen inkl. `korrekt`/`korrekteAntworten`/`musterlosung` an SuS geliefert — im Network-Tab sichtbar.

Zusätzlich leaken **implizite Felder** die Lösung über Reihenfolgen:
- `sortierung.elemente[]` ist die korrekte Reihenfolge
- `zuordnung.paare[]` enthält Links+Rechts als Paarung
- `mc.optionen[]` und `richtigfalsch.aussagen[]` können konstante Muster offenbaren (Position → Lösung)
- `bildbeschriftung.labels[]` und `dragdrop_bild.labels[]` ebenso

## Schutzziel

- **Vor** „Antwort prüfen"-Klick: Lösung nicht im Network-Tab ableitbar (weder explizit noch über Reihenfolge).
- **Nach** Klick: Korrektur-Resultat + Musterlösung werden ausgeliefert — der Lerneffekt bleibt erhalten.
- **Brute-Force explizit nicht im Scope.** R/F mit 2 Möglichkeiten lässt sich nicht durch Server-Korrektur schützen; SuS schadet sich selbst.
- **LP-Aufrufer** bekommen weiterhin unbereinigte Daten (Admin/Fragenbank-Edit).

Matura-Relevanz wird durch **Prüfungen** abgedeckt (bereits wasserdicht, unverändert). Selbstständiges Üben hat schwächere Ansprüche, aber „aus Prinzip" keine offenen Lösungen.

## Architektur

### Backend (apps-script-code.js)

**B1 — `lernplattformLadeFragen()` bereinigen**

```js
const email = (body.email || '').toLowerCase()
const istLP = istZugelasseneLP(email)
if (!istLP) {
  alleFragen = alleFragen.map(bereinigeFrageFuerSuSUeben_)
}
```

`bereinigeFrageFuerSuSUeben_` = erweiterte Variante von `bereinigeFrageFuerSuS_`, die zusätzlich die implizit-leakenden Reihenfolgen mischt (siehe B2).

**B2 — `bereinigeFrageFuerSuSUeben_` (neu)**

Baut auf `bereinigeFrageFuerSuS_` auf. Zwei Aufgaben: (a) **alle 20 Typen:** Lösungsdaten entfernen, (b) **8 ausgewählte Typen:** zusätzlich Reihenfolgen mischen. Mischung via Fisher-Yates (`shuffle_(arr)` Helper).

**Löschung (alle 20 Typen) — via `bereinigeFrageFuerSuS_` + Ergänzungen:**

| Typ | Zu entfernen | Notiz |
|-----|-------------|-------|
| `mc` | `musterlosung`, `bewertungsraster`, `optionen[].korrekt` | bereits in `bereinigeFrageFuerSuS_` |
| `richtigfalsch` | `musterlosung`, `aussagen[].korrekt`, `aussagen[].erklaerung` | bereits vorhanden |
| `lueckentext` | `musterlosung`, `luecken[].korrekteAntworten`, `luecken[].korrekt` | bereits vorhanden |
| `berechnung` | `musterlosung`, `ergebnisse[].korrekt`, `ergebnisse[].toleranz` | bereits vorhanden |
| `zuordnung` | `musterlosung`, `paare[].rechts` (siehe Split unten) | **NEU** |
| `sortierung` | `musterlosung` (elemente[] wird gemischt — siehe unten) | bereits vorhanden |
| `bildbeschriftung` | `musterlosung`, `labels[].zoneId` oder `.korrekt` | **NEU** — Zone-Zuordnung ist die Lösung |
| `dragdrop_bild` | `musterlosung`, `labels[].zoneId` | **NEU** |
| `hotspot` | `musterlosung`, `hotspots[].korrekt` | **NEU** |
| `buchungssatz` | `musterlosung`, `buchungen[].sollKonto`/`habenKonto`/`betrag` | **NEU** (korrekt-Buchung) |
| `tkonto` | `musterlosung`, `korrekt`/`sollEintraege`/`habenEintraege` | **NEU** |
| `bilanzstruktur` | `musterlosung`, `korrekt`-Felder pro Eintrag | **NEU** |
| `kontenbestimmung` | `musterlosung`, `konten[].korrekt` | **NEU** |
| `formel` | `musterlosung`, `korrekt` (LaTeX-Lösung) | **NEU** |
| `aufgabengruppe` | Teilaufgaben rekursiv bereinigen | bereits vorhanden |
| `freitext` | `musterlosung`, `bewertungsraster` | kommt erst bei Selbstbewertung über `lernplattformPruefeAntwort` |
| `visualisierung` (Zeichnen) | `musterlosung`, `bewertungsraster`, Referenz-Zeichnung falls vorhanden | analog freitext |
| `pdf` | `musterlosung`, `bewertungsraster` | analog freitext |
| `audio` | `musterlosung`, `bewertungsraster` | analog freitext |
| `code` | `musterlosung`, `bewertungsraster`, Referenz-Lösung | analog freitext |

**Mischung (8 Typen) — zusätzlich nach Löschung:**

| Typ | Mischung |
|-----|----------|
| `mc` | `optionen[]` mischen |
| `richtigfalsch` | `aussagen[]` mischen |
| `sortierung` | `elemente[]` mischen (Original = Lösung!) |
| `zuordnung` | `paare[{links,rechts}]` → `linksItems[], rechtsItems[]` (rechts gemischt) |
| `bildbeschriftung` | `labels[]` mischen |
| `dragdrop_bild` | `labels[]` mischen |
| `hotspot` | `hotspots[]` mischen |
| `lueckentext` | Dropdown-Optionen pro Lücke mischen (falls vorhanden) |

Pro Aufruf neue Mischung — das macht DevTools-Scraping über mehrere Requests nutzlos.

**Unberührt (Reihenfolge nicht leak-relevant):**
`berechnung`, `freitext`, `visualisierung`, `pdf`, `audio`, `code`, `formel`, FiBu-Typen, `aufgabengruppe`.

**B3 — Neuer Endpoint `lernplattformPruefeAntwort`**

```
Input:  { action: 'lernplattformPruefeAntwort', gruppeId, frageId, antwort, email, token }
Auth:   sessionToken-Check, Rate-Limit 30/min pro SuS, Gruppen-Mitgliedschaft prüfen
Flow:
  1. Frage unbereinigt aus Fragenbank laden (FRAGENBANK_ID, kanonisch)
  2. pruefeAntwortServer_(frage, antwort) → boolean
  3. Bei Selbstbewertungstyp: return { selbstbewertung: true, musterlosung }
  4. Sonst: return { korrekt, musterlosung, korrektDetails? }
Response: { success: true, korrekt, musterlosung?, selbstbewertung?, korrektDetails? }
```

**B4 — Korrektur-Portierung: Server-Mapping pro Typ**

Neue Helper `pruefeAntwortServer_(frage, antwort)` im Apps-Script. Nicht alle 20 Typen werden automatisch korrigiert — die Selbstbewertungs-Typen bekommen nur die Musterlösung zurück, kein `korrekt`-Boolean.

| Fragetyp | Server-Verhalten |
|----------|-----------------|
| `mc` | auto-korrigieren → `{korrekt, musterlosung}` |
| `richtigfalsch` | auto-korrigieren |
| `lueckentext` | auto-korrigieren (Case-Sensitive beachten) |
| `berechnung` | auto-korrigieren (Toleranz beachten) |
| `zuordnung` | auto-korrigieren |
| `sortierung` | auto-korrigieren (Reihenfolge vergleichen) |
| `bildbeschriftung` | auto-korrigieren (Label → Zone matchen) |
| `dragdrop_bild` | auto-korrigieren |
| `hotspot` | auto-korrigieren (Distanz-Check wie in Pool) |
| `buchungssatz` | auto-korrigieren |
| `tkonto` | auto-korrigieren |
| `bilanzstruktur` | auto-korrigieren |
| `kontenbestimmung` | auto-korrigieren |
| `formel` | auto-korrigieren (LaTeX-Vergleich) |
| `aufgabengruppe` | rekursiv: Teilaufgaben einzeln korrigieren, aggregiertes Resultat |
| `freitext` | **Selbstbewertung** → `{selbstbewertung: true, musterlosung, bewertungsraster?}` |
| `visualisierung` | Selbstbewertung analog freitext |
| `pdf` | Selbstbewertung analog freitext |
| `audio` | Selbstbewertung analog freitext |
| `code` | Selbstbewertung analog freitext |

**Portierung:** 1:1 aus `korrektur.ts::pruefeAntwort` (Switch-Case pro Typ). Test-Paritäts-Invariante: Für jede (frage, antwort)-Kombination in `src/utils/autoKorrektur.test.ts` Fixtures muss `pruefeAntwort(frage, antwort) === pruefeAntwortServer_(frage, antwort)` gelten. Mit einem kleinen JS-Test-Harness im Apps-Script-Editor oder via exportierten JSON-Fixtures zu verifizieren.

### Frontend (ExamLab/src)

**F1 — Service** `src/services/uebenKorrekturApi.ts`

```ts
export async function pruefeAntwort(
  gruppeId: string, frageId: string, antwort: Antwort
): Promise<PruefResultat>
```

Nutzt `uebenApiClient` analog `appsScriptAdapter`. Timeout 60s (Apps-Script Cold-Start).

**F2 — Store-Refactor** `uebungsStore.ts::pruefeAntwortJetzt`

- Wird async
- Setzt `speichertPruefung: true` während Request läuft
- Bei Erfolg: übernimmt `korrekt`/`musterlosung` in `feedbackSichtbar` + `letzteAntwortKorrekt` + `letzteMusterloesung`
- Bei Fehler: setzt `pruefFehler`, UI zeigt Retry-Banner + Fehlermeldung

**F3 — `useFrageAdapter.onPruefen`**

Ruft `store.pruefeAntwortJetzt` async. Propagiert `speichertPruefung`, `pruefFehler`.

**F4 — UI**

- `QuizNavigation`: „Antwort prüfen"-Button mit Spinner während Request, `disabled` + `aria-busy="true"` während `speichertPruefung`
- `UebungsScreen` + `SelbstbewertungsDialog`: `pruefFehler`-Banner mit Retry-Button
- Selbstbewertungstypen: Musterlösung kommt zusammen mit `selbstbewertung: true` Flag

**F5 — `korrektur.ts::pruefeAntwort` bleibt**

Weiterhin genutzt für:
- Demo-Modus (`einrichtungsFragen`) — kein Backend
- Angeleitete Übungen (Modus=`uebung` via `ladePruefung`) — dort korrigiert LP manuell

Kein Delete, keine Breaking-Change.

**F6 — Telemetrie (optional)**

Apps-Script `pruefeAntwortServer_` loggt optional nach `LOG_SHEET_ID` (falls vorhanden) bei Korrektur-Ausnahmen — Portierungs-Drift zwischen `korrektur.ts` und `pruefeAntwortServer_` frühzeitig detektieren.

## Datenfluss (neu)

```
SuS öffnet Thema
  → lernplattformLadeFragen { email, gruppeId }
  → [SuS-Path] bereinigeFrageFuerSuSUeben_ auf alle Fragen → mit Mischung
  → Client-Cache

SuS beantwortet + klickt "Antwort prüfen"
  → speichertPruefung = true
  → uebenKorrekturApi.pruefeAntwort { email, gruppeId, frageId, antwort }
  → lernplattformPruefeAntwort lädt Frage frisch, korrigiert server-side
  → { korrekt: true, musterlosung: "..." }
  → UI zeigt Feedback + Musterlösung

SuS Selbstbewertung (Freitext)
  → uebenKorrekturApi.pruefeAntwort { antwort }
  → { selbstbewertung: true, musterlosung: "..." }
  → SelbstbewertungsDialog zeigt Musterlösung + 3 Bewertungsbuttons
```

## Error-Handling

- **Apps-Script Cold-Start 30-60s:** 60s Timeout, bei Abort Retry-Banner
- **Rate-Limit-Trigger:** Fehlermeldung „Zu viele Anfragen — warte 1 Minute"
- **Gruppen-Mitgliedschaft fehlt:** 403, Fehlermeldung „Kein Zugriff auf diese Übung"
- **Netzwerk offline:** Fehler-Banner mit Retry, `onPruefen` bleibt klickbar
- **Backend liefert malformed Response:** Defensive Parse (wie bei `normalisiereLueckentext` aus S118), Fehler-Banner

## Tests

**Backend (manuell, dokumentiert in Spec):**
- SuS-Response von `lernplattformLadeFragen` enthält keine der 11 sensitiven Felder (`korrekt`, `korrekteAntworten`, `musterlosung`, `bewertungsraster`, `erklaerung`, `toleranz` + je pro Fragetyp)
- Mischung-Reihenfolge unterscheidet sich zwischen 2 Aufrufen (gleiche Frage, 2 Requests)
- `lernplattformPruefeAntwort` liefert `{korrekt: true}` für 6 Typen bei korrekten Antworten + `{korrekt: false}` bei falschen

**Frontend (Vitest, in `src/tests/`):**
- `uebungsStore.pruefeAntwortJetzt` setzt Loading-State, ruft API, übernimmt Resultat (Mock)
- `uebungsStore.pruefeAntwortJetzt` bei Fehler: setzt `pruefFehler`, kein Resultat
- `uebungsStore.pruefeAntwortJetzt` bei Selbstbewertung: setzt `musterloesung`, `korrekt=null`
- `uebenKorrekturApi.pruefeAntwort` Timeout-Verhalten
- Existing `korrektur.ts`-Tests bleiben grün (kein Delete)

**Browser E2E (Staging, echte Logins, Kontrollstufe Locker):**
- SuS öffnet Thema → Network-Tab-Check: keine `korrekt`-Felder in `lernplattformLadeFragen`-Response
- SuS klickt Prüfen → Network-Tab: `lernplattformPruefeAntwort` liefert `korrekt` + `musterlosung`
- Reload → neue Mischung sichtbar (z.B. MC-Optionen in anderer Reihenfolge)
- Netzwerk offline simulieren → Retry-Banner erscheint
- Selbstbewertung-Flow (Freitext): Dialog + 3 Buttons funktionieren
- LP öffnet Fragensammlung → alle Fragetypen editierbar, Lösungsdaten sichtbar (Fallback nicht ausgelöst)

## Out of Scope

- **Brute-Force-Schutz** — R/F trivial, MC nur leicht schwerer. Bei selbstständigem Üben kein Schutzziel.
- **Prüfungsmodus** — bereits wasserdicht über `ladePruefung` + `bereinigeFrageFuerSuS_`.
- **Angeleitete Übung** — läuft über `ladePruefung`, bereits wasserdicht.
- **Demo-Modus** — `einrichtungsFragen` lokal, kein Backend — bleibt lokale Korrektur.
- **Pool-Daten-Korrekturen** — z.B. `korrekteAntworten` in Lückentext-Daten unvollständig (S118-Normalizer-Workaround). Separates Thema Daten-Audit.

## Migration / Deployment-Reihenfolge

Race-Risiko: während eines Deploys kann ein alter Client (z.B. in einem offenen Tab ohne Hard-Reload) gegen das neue Backend sprechen. Bereinigte Fragen ohne erwartete Felder → `TypeError: Cannot read properties of undefined` (genau das Problem aus S118-Lehre).

**Pflicht-Reihenfolge (Zweistufiger Deploy):**

**Phase 1 — Frontend-Defensive (Staging → main, ohne Backend-Änderung):**
1. In `src/utils/ueben/fragetypNormalizer.ts` für alle 8 Misch-Typen defensive Normalizer ergänzen (analog `normalisiereLueckentext` aus S118):
   - `normalisiereMc`: wenn `optionen[].korrekt` fehlt → `false`-Default
   - `normalisiereRichtigFalsch`: wenn `aussagen[].korrekt` fehlt → `false`
   - `normalisiereSortierung`: wenn `elemente[]` fehlt → `[]`
   - `normalisiereZuordnung`: Fallback `paare[] || (linksItems + rechtsItems split)`
   - `normalisiereBildbeschriftung` / `normalisiereDragDropBild`: `labels[].zoneId` Fallback
   - `normalisiereHotspot`: `hotspots[].korrekt` Fallback + defensive Array-Checks
2. In `korrektur.ts::pruefeAntwort` defensive Guards (alle `frage.X.filter/some/every`-Aufrufe wrappen in `Array.isArray(frage.X)`).
3. Deploy, auf Staging browser-verifiziert, Merge auf `main`.
4. **Ab hier:** alte Clients die noch das alte Backend sehen funktionieren wie bisher; neue Clients können sowohl altes (volle Daten) als auch neues (bereinigt) Backend verarbeiten.

**Phase 2 — Backend-Änderung (Frontend-Defensive aktiv):**
1. Backend-Bereinigung + neuen Endpoint + Frontend-Async-Refactor implementieren.
2. Deploy Frontend + Apps-Script manuell.
3. Staging-Test mit echten Logins.
4. LP-Freigabe → Merge `preview` → `main`.

**Cache-Buster / SW-Unregister:**
- Nach Phase-2-Deploy: Bei `pruefFehler` mit `status: 0` (Netzwerkfehler) oder Schema-Mismatch: automatisch Service-Worker unregistrieren + `caches.delete()` + Hard-Reload (pattern aus `LPStartseite::lazyMitRetry`).
- Dokumentierter manueller Weg: `?cb=<timestamp>` anhängen (S115-Lehre in deployment-workflow.md).

**Frontend-Feature-Flag:** nicht nötig — Phase 1 ist rückwärtskompatibel, Phase 2 koppelt Frontend- und Backend-Deploy.

**⚠️ Phase 2 MUSS atomisch deployen (Backend + Frontend zusammen):**
Der Phase-1-Normalizer kann `normalisiereZuordnung` nur **von** `paare[]` **zu** `linksItems[]/rechtsItems[]` rekonstruieren, **nicht umgekehrt** — weil die Paarung selbst die Lösung ist. Wenn Phase 2 Backend die bereinigte Zuordnung ausliefert (`paare` gelöscht, nur `linksItems/rechtsItems`) aber der Client noch Phase-1-Code nutzt, lautet `frage.paare = []` → client-side `pruefeAntwort` → immer `false`.

→ Phase 2 Frontend (Async-Store + Server-Korrektur-Call) **muss** gleichzeitig mit Phase 2 Backend deployen. Kein partial-Merge zulässig.

## Sicherheits-Invariante

Nach Implementation muss für jeden SuS-Aufruf gelten:

```
forall (frage in response.data):
  frage.korrekt === undefined  AND
  frage.musterlosung === undefined  AND
  frage.bewertungsraster === undefined  AND
  (frage.optionen || []).forEach(o => o.korrekt === undefined)  AND
  (frage.aussagen || []).forEach(a => a.korrekt === undefined)  AND
  (frage.luecken || []).forEach(l => l.korrekteAntworten === undefined)  AND
  (frage.ergebnisse || []).forEach(e => e.korrekt === undefined && e.toleranz === undefined)  AND
  ...
```

Ein Vitest-Snapshot-Test prüft diese Invariante gegen eine Mock-Response.

## Release-Checkliste (Phase 2)

Die Zweiphasigkeit ist im „Migration / Deployment-Reihenfolge"-Abschnitt oben dokumentiert. Dies ist die Phase-2-Runlist:

1. Backend-Bereinigung + neuer Endpoint + Frontend-Async-Refactor auf `feature/ueben-security-korrekturendpoint`
2. Lokale Checks: `tsc -b` · `vitest run` · `npm run build`
3. Push zu `preview` (Staging) — Frontend deployed automatisch via GitHub Actions
4. User deployed Apps-Script Bereitstellung manuell
5. E2E-Test auf Staging mit echten Logins (LP + SuS), inkl. Sicherheits-Invariante im Network-Tab
6. LP-Freigabe
7. Merge `preview` → `main` → Production
