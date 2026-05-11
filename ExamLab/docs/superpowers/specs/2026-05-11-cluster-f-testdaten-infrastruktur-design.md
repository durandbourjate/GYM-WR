---
title: Cluster F — Testdaten-Infrastruktur
date: 2026-05-11
status: Spec-Review ausstehend
verwandt: Cluster E (LP-Settings-Backend), Cluster G (Icon-System), Cluster B (Header)
---

# Cluster F — Testdaten-Infrastruktur

## 1. Zweck

ExamLab braucht eingebaute Testdaten, damit

- Lehrpersonen ExamLab in einer realen Umgebung kennenlernen (Onboarding),
- Features mit Datenanforderung (Analyse, Mastery, Live-Durchführen) ohne Spuren in Echtdaten getestet werden,
- der Test-SuS-Account `wr.test@stud.gymhofwil.ch` eine sinnvolle SuS-Sicht hat (Übungen, Mastery, Rückblick),
- E2E-Tests gegen Live-Backend deterministische Daten haben.

**Grundprinzip:** Testdaten sind **echte Backend-Records** im selben Apps-Script/Drive-Backend wie Echtdaten, aber strukturell isoliert in einem Test-Kurs mit eigener Klasse und eigenen SuS. Sichtbarkeit pro LP über einen Toggle im Einstellungen-Tab „Testdaten".

## 2. Begriffe

- **Test-Kurs:** `KursDefinition` mit ID `test-kurs-01`, Anzeigename „Testkurs WR".
- **Test-Klasse:** Klassen-Identifier `test-klasse-01`, neu in `Stammdaten.klassen[]`.
- **Test-Schüler:** 20 SuS — `wr.test@stud.gymhofwil.ch` + 19× `<vorname>.testschueler<N>@stud.gymhofwil.ch`.
- **Test-LP:** `wr.test@gymhofwil.ch` (LP-Test-Account, Owner des Testkurses).
- **Test-Admin:** Yannick (`yannick.durand@gymhofwil.ch`) — Admin-Rolle via `Stammdaten.admins[]`, keine Extra-Logik nötig.
- **Soll-Zustand:** Vom Seed garantierte Records (IDs `test-*`, alle Antworten/Mastery von Test-Usern).
- **Sichtbarkeits-Toggle:** Boolean im LP-Profil-Backend, per LP, Default `false`.

## 3. Architektur-Entscheidungen

| # | Entscheidung | Begründung |
|---|---|---|
| 1 | Backend-Strategie: dedizierter Test-Kurs im echten Backend (kein separater Tenant). | Authentisch, isolierbar, keine doppelte Pflege. |
| 2 | Umfang: 1 Test-Kurs, 20 SuS, 6 Wochen Mastery-Historie, 1–2 abgeschlossene Prüfungen. | Realistisch für Analyse + Mastery, ohne Wartungs-Overhead. |
| 3 | Seed: Apps-Script-Funktion `seedTestdaten()`, idempotent über fixe IDs (`test-*`). | Konsistent mit bestehenden `seedXxx`-Patterns. |
| 4 | Sichtbarkeit: Toggle im Einstellungen-Tab „Testdaten", Default aus, total ausblendbar. | Sauberer Alltag, bewusste Aktivierung zum Testen/Onboarding. |
| 5 | Toggle-Persistenz: LP-Profil-Backend (`LPProfil.testdatenSichtbar?: boolean`). | Sync über Geräte. Einheitlich mit übrigen LP-Settings (Querbezug Cluster E). |
| 6 | SuS-Sicht: kein Toggle. Trennung über Klassenzugehörigkeit. | Natürlich, kein Extra-UI für SuS. |
| 7 | Filter-Mechanismus: Kurs-/Klassen-Zugehörigkeit + User-Email-Prefix. | Naming-basierte Filter fragil; Strukturzugehörigkeit eindeutig. |
| 8 | Fragen-Quelle: bestehende Fragensammlung wird referenziert. Keine Extra-Test-Fragen. | Fragen sind global; keine Filterung in Fragensammlung selbst. |
| 9 | Einführungsprüfung/-übung: kopieren in Test-Kurs (mit `klasse: 'test-klasse-01'`). | `PruefungsConfig.klasse: string` ist singular, Original gehört in Echtklasse. |
| 10 | Test-Szenarien: 1 abgeschlossen + korrigiert, optional 2., 6 Wochen Mastery für alle 20 SuS, alle Fragetypen abgedeckt, Schwerpunkt simple Typen. | Optimiert auf Analyse-Wert, vermeidet fragile „Live-Phasen". |
| 11 | Reset-Verhalten: destruktiv-idempotent. Alle Test-Records werden gelöscht + neu erzeugt. | Garantiert Soll-Zustand. LP-Modifikationen sind transient. |
| 12 | Onboarding: Initial-Seed nur durch Admin. Toggle ohne Daten → Hinweis „noch nicht initialisiert". | Klare Hierarchie, vermeidet Race-Initialisierung. |
| 13 | Aufruf: Frontend-Button → HTTP-Endpoint `apiAdminSeedTestdaten` (Apps-Script). | Konsistent mit allen anderen Admin-Aktionen. |
| 14 | Badge: Test-Records erhalten gelbes „Test"-Pill in UI-Listen wenn Toggle an. | Sicht-Eindeutigkeit auch bei aktivierter Test-Sicht. |
| 15 | Mastery-Daten-Datum: rollendes 6-Wochen-Fenster, weekly Apps-Script-Trigger rollt vor. | Demo bleibt zeitlich aktuell ohne manuelle Pflege. |

## 4. Datenmodell-Erweiterungen

### 4.1 `LPProfil` (`src/types/stammdaten.ts`)

```diff
 export interface LPProfil {
   email: string
   kursIds: string[]
   fachschaftIds: string[]
   gefaesse: string[]
   favoriten?: AppOrt[]
+  /** Sichtbarkeit Test-Kurs in LP-Listen. Default false. Cluster F. */
+  testdatenSichtbar?: boolean
 }
```

### 4.2 `Stammdaten`

Beim Initial-Seed wird ergänzt:
- `klassen[]`: `'test-klasse-01'` (falls noch nicht vorhanden)
- `kurse[]`: Test-Kurs-Eintrag (siehe 4.3)

Idempotent: zweite Seed-Ausführung ändert nichts.

### 4.3 Test-Kurs

```ts
{
  id: 'test-kurs-01',
  name: 'Testkurs WR',
  fach: 'Wirtschaft & Recht',
  fachschaft: 'WR',
  gefaess: 'SF',
  klassen: ['test-klasse-01']
}
```

### 4.4 Test-LP

`wr.test@gymhofwil.ch` ist ein **echtes Google-Konto**, das vom Entwickler/Tester für E2E-Tests aus LP-Sicht verwendet wird (gepaart mit dem SuS-Account `wr.test@stud.gymhofwil.ch`). Seed legt für diesen Account einen LP-Profil-Eintrag mit `kursIds: ['test-kurs-01']` an.

Yannick (`yannick.durand@gymhofwil.ch`) ist über `Stammdaten.admins[]` (default) bereits Admin — kein Extra-Eintrag nötig.

### 4.5 Test-Schüler (20 Stück)

| # | Email | Vorname | Nachname |
|---|---|---|---|
| 0 | `wr.test@stud.gymhofwil.ch` | wr | test |
| 1 | `anna.testschueler1@stud.gymhofwil.ch` | Anna | Testschueler1 |
| 2 | `beat.testschueler2@stud.gymhofwil.ch` | Beat | Testschueler2 |
| 3 | `clara.testschueler3@stud.gymhofwil.ch` | Clara | Testschueler3 |
| 4 | `david.testschueler4@stud.gymhofwil.ch` | David | Testschueler4 |
| 5 | `eva.testschueler5@stud.gymhofwil.ch` | Eva | Testschueler5 |
| 6 | `felix.testschueler6@stud.gymhofwil.ch` | Felix | Testschueler6 |
| 7 | `greta.testschueler7@stud.gymhofwil.ch` | Greta | Testschueler7 |
| 8 | `hans.testschueler8@stud.gymhofwil.ch` | Hans | Testschueler8 |
| 9 | `ina.testschueler9@stud.gymhofwil.ch` | Ina | Testschueler9 |
| 10 | `jonas.testschueler10@stud.gymhofwil.ch` | Jonas | Testschueler10 |
| 11 | `karin.testschueler11@stud.gymhofwil.ch` | Karin | Testschueler11 |
| 12 | `lukas.testschueler12@stud.gymhofwil.ch` | Lukas | Testschueler12 |
| 13 | `mara.testschueler13@stud.gymhofwil.ch` | Mara | Testschueler13 |
| 14 | `noah.testschueler14@stud.gymhofwil.ch` | Noah | Testschueler14 |
| 15 | `olivia.testschueler15@stud.gymhofwil.ch` | Olivia | Testschueler15 |
| 16 | `pia.testschueler16@stud.gymhofwil.ch` | Pia | Testschueler16 |
| 17 | `quentin.testschueler17@stud.gymhofwil.ch` | Quentin | Testschueler17 |
| 18 | `rosa.testschueler18@stud.gymhofwil.ch` | Rosa | Testschueler18 |
| 19 | `sven.testschueler19@stud.gymhofwil.ch` | Sven | Testschueler19 |

Alle mit `klasse: 'test-klasse-01'`.

### 4.6 Test-Prüfungen

**Prüfung 1 — `[Test] Einführungsprüfung`** (Kopie der echten Einführungsprüfung):
- `id: 'test-pruefung-01'`
- `klasse: 'test-klasse-01'`
- `titel: '[Test] Einführungsprüfung'`
- `erlaubteEmails: [<alle 20 Test-SuS-Emails>]`
- Status: abgeschlossen + alle 20 SuS haben Antworten, alle korrigiert.
- Frageninhalt — Entscheidungs-Regel je nach ExamLab-Persistenz (Plan-Phase prüft, dann anwenden):
  - **Wenn Reference-Persistenz** (Prüfung speichert nur Frage-IDs): Test-Prüfung referenziert dieselben Frage-IDs wie das Original. Keine neuen Frage-Records.
  - **Wenn Embed-Persistenz** (Prüfung speichert Frage-Inhalt eingebettet): Test-Prüfung kopiert den Frage-Inhalt mit der Original-Frage-ID (KEINE neue `test-frage-*`-ID erzeugen, da Fragen nicht gefiltert werden — Test-IDs hier wären überflüssig + verwirrend).

**Prüfung 2 (optional) — `[Test] Aktiengesellschaft – Übungsprüfung`**:
- `id: 'test-pruefung-02'`
- abgeschlossen, 20 Antworten, alle korrigiert
- Liefert Trend-Daten für Analyse über 2 Prüfungen.

### 4.7 Test-Übungen + Mastery

**Übung 1 — `[Test] Einführungsübung`** (Kopie):
- `id: 'test-uebung-01'`
- `wr.test` und ~10 SuS haben je 3-8 Sessions.

**Übung 2 — `[Test] Selbstständiges Üben`**:
- Konfiguration zieht aus bestehender Fragensammlung (WR-Themen).
- Alle 20 SuS haben über 6 Wochen verteilt 3-8 Sessions zu 5-10 Themen.
- Datums-Spread: jedes Session-Datum = `heute − N` mit N gleichverteilt 1-42.

### 4.8 Test-Korrekturen

In Test-Prüfung 1+2: alle Antworten korrigiert, Mix entstanden durch natürliche Auto-/KI-/Hand-Korrektur:
- MC, Single-Choice, Zuordnung, Wahr/Falsch → auto-korrigiert.
- Lückentext (Dropdown), Freitext, PDF-Annotation → KI-korrigiert mit deterministischen Bewertungstext-Templates **pro Frage-ID hardcoded** (nicht pro SuS variabel — gleiche Frage liefert gleichen Bewertungstext bei allen 20 SuS, einzig die Punktzahl variiert nach Antwort-Korrektheit).
- TKonto, BilanzER, Zeichnen → hand-korrigiert (synthetische LP-Bewertung, deterministisch pro Frage-ID, analog).

## 5. Komponenten

### 5.1 Backend (Apps-Script)

#### `apiAdminSeedTestdaten(opts)` — Public Endpoint

```js
function apiAdminSeedTestdaten(opts) {
  // opts: { admin: string, mode: 'initial' | 'reset' }
  // 1. Auth-Check: opts.admin in Stammdaten.admins[]
  // 2. Lock-Check via LockService (verhindert Doppel-Aufruf-Race)
  // 3. Wenn mode === 'reset': loescheAlleTestdaten()
  // 4. erzeugeStammdaten()        // Klasse + Kurs idempotent
  // 5. erzeugeTestLP()            // wr.test@gymhofwil.ch
  // 6. erzeugeTestSchueler()      // 20 SuS
  // 7. erzeugePruefungen()        // Kopien
  // 8. erzeugeAntwortenUndKorrekturen()
  // 9. erzeugeUebungsSessionsUndMastery()
  // 10. initialisiereRolltrigger() // Weekly trigger (idempotent)
  // 11. Statistik zurück: { kurseErzeugt, sussErzeugt, pruefungenErzeugt, sessionsErzeugt, dauerMs }
}
```

#### `loescheAlleTestdaten()` — Internal

Löscht aus allen Storage-Sheets jeden Record dessen ID mit `test-` beginnt ODER dessen `kursId`/`klasse`/`userEmail` Test-Werte enthält. Schlüsselregeln:
- `kursId === 'test-kurs-01'` → löschen
- `klasse === 'test-klasse-01'` → löschen
- `userEmail` matcht `^(wr\.test|.+\.testschueler\d+)@` → löschen
- ID-Prefix `test-` → löschen

**Single Source of Truth (Backend ↔ Frontend):** Die ID-Prefixe (`test-kurs-01`, `test-klasse-01`, `test-`) und das Email-Regex `^(wr\.test|.+\.testschueler\d+)@` müssen identisch in Backend und Frontend sein. Implementierung:
- Frontend exportiert Konstanten aus `src/utils/testdaten/identifikation.ts` (`TEST_KURS_ID`, `TEST_KLASSE_ID`, `TEST_EMAIL_REGEX`).
- Apps-Script-Backend definiert die gleichen Konstanten an einer einzigen Stelle in `apps-script-code.js`.
- Vitest enthält einen Test, der die Backend-Konstanten gegen die Frontend-Konstanten verifiziert (via Datei-Snapshot des Apps-Script-Source).

#### `rolleTestdatenMasteryVor()` — Weekly Trigger

```js
function rolleTestdatenMasteryVor() {
  // Liest alle Übungs-Sessions/Mastery-Records von Test-Usern
  // Verschiebt deren datum-Felder um +7 Tage
  // Records die danach > heute wären → an heute clampen
}
```

Trigger via `ScriptApp.newTrigger('rolleTestdatenMasteryVor').timeBased().everyWeeks(1).create()`, einmalig beim ersten Seed registriert.

#### Endpoint-Registrierung

In `apps-script-code.js` neuer Case im `doPost`-Router:
```js
case 'apiAdminSeedTestdaten': return jsonResponse(apiAdminSeedTestdaten(body.opts))
```

### 5.2 Frontend

#### Filter-Layer (`src/utils/testdaten/filter.ts` — neu)

```ts
export function istTestdaten(record: {
  kursId?: string; klasse?: string; userEmail?: string; id?: string
}): boolean {
  if (record.kursId === 'test-kurs-01') return true
  if (record.klasse === 'test-klasse-01') return true
  if (record.userEmail?.match(/^(wr\.test|.+\.testschueler\d+)@/)) return true
  if (record.id?.startsWith('test-')) return true
  return false
}

export function filtereTestdatenWennDeaktiviert<T extends {
  kursId?: string; klasse?: string; userEmail?: string; id?: string
}>(records: T[], testdatenSichtbar: boolean): T[] {
  if (testdatenSichtbar) return records
  return records.filter(r => !istTestdaten(r))
}
```

#### Read-Pfad-Audit (Plan-Phase)

Filter muss in **allen** Read-Pfaden integriert werden. Bekannte Pfade aus Bundle-3-Lehre — Plan-Phase macht vollständigen Grep:
- `ladeKurse()`, `ladePruefungen()`, `ladeUebungen()`, `ladeSchueler()`
- `ladeAntworten()`, `ladeKorrekturen()`
- `ladeMastery()`, `ladeUebungsSessions()`
- alle `holeAlle*()`-Pfade

**Ausnahme:** Fragensammlung wird NICHT gefiltert (Fragen sind global, kursunabhängig).

#### Settings-Tab „Testdaten" (`src/components/lp/einstellungen/TestdatenTab.tsx` — neu)

Sektionen:

**A. Status**
- „Testdaten initialisiert: ✓ (zuletzt: 2026-05-11 14:23)" oder „✗ Noch nicht erzeugt — bitte Admin kontaktieren."

**B. Sichtbarkeit (für alle LPs)**
- Switch/Checkbox: „Testdaten in meinen Listen anzeigen"
- Bindet an `LPProfil.testdatenSichtbar`
- Hilfetext: „Testdaten sind nur zum Kennenlernen und Testen. Sie sind als 'Test' markiert und werden Echtdaten nie beeinflussen."

**C. Admin-Sektion (nur sichtbar wenn `currentUser.email in Stammdaten.admins`)**
- Button „Testdaten erzeugen" (wenn nicht initialisiert)
- Button „Testdaten zurücksetzen" (wenn initialisiert) — destruktiv-Style, öffnet Confirm-Modal
- Statistik-Anzeige: Kurse / SuS / Prüfungen / Sessions
- Last-Seed-Datum

Layout-Tokens (Typografie, Spacing, Switch-Style) werden in Cluster E festgelegt — bis dahin: Pattern des bestehenden `ProfilTab` übernehmen.

#### Confirm-Modal beim Reset

- Titel: „Testdaten zurücksetzen?"
- Body: „Alle Testdaten werden gelöscht und neu erzeugt. Eigene Änderungen am Testkurs (zusätzliche Prüfungen, Antworten, …) gehen dauerhaft verloren. Echtdaten sind nicht betroffen."
- Buttons: „Abbrechen" + „Endgültig zurücksetzen" (destruktiv-Style analog Lösch-Bestätigungen).

#### Test-Badge (`src/components/shared/TestBadge.tsx` — neu)

```tsx
<span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs font-medium rounded-full px-2 py-0.5">
  Test
</span>
```

Einbindung in:
- Kurs-Listen (Dashboard, Composer, Übersichten)
- Schüler-Listen (Korrekturen, Live-Durchführen, Klassen)
- Prüfungs-/Übungs-Listen (Prüfen, Üben)

Helper-Hook: `useTestBadgeVisible(record)` — gibt boolean (record ist Test-Record UND `testdatenSichtbar` an).

## 6. Datenverhalten

### 6.1 Reset-Semantik

- Destruktiv: alle Test-Records werden gelöscht (auch LP-eigene Modifikationen am Testkurs).
- Atomar pro Storage-Sheet (so weit Apps-Script erlaubt). Wenn ein Teil fehlschlägt: Reset gibt Fehler zurück, partieller Zustand möglich → Frontend zeigt Warnung „Reset unvollständig, bitte erneut versuchen".
- Idempotent: zweiter Aufruf ohne Modifikationen ist no-op.

### 6.2 Rollende Mastery-Daten

- Seed setzt Sessions mit `datum = heute − N` (N gleichverteilt 1-42).
- Weekly Apps-Script-Trigger `rolleTestdatenMasteryVor` läuft sonntags und erhöht `datum` jeder Test-Session um +7 Tage.
- **Roll-Algorithmus:** Statt am `heute`-Datum zu clampen (was nach mehreren Wochen alle Sessions auf einem Datum verklumpen würde), wird ein Modulo-Roll im 42-Tage-Fenster verwendet: für jeden Record ist das neue `datum = heute − ((heute − altes_datum − 7 + 42) mod 42)`. Damit bleibt die ursprüngliche Verteilung 1-42 Tage zurück immer erhalten.
- Wenn Trigger ausfällt (z.B. nicht aktiviert): Daten altern. Test-Tab zeigt Warnhinweis wenn ältestes Session-Datum > 60 Tage.

### 6.3 Onboarding-Flow

1. Admin (Yannick) öffnet ExamLab → Einstellungen → Testdaten.
2. Sieht Status „✗ Noch nicht erzeugt", klickt „Testdaten erzeugen".
3. Apps-Script läuft (~30s erwartet, Statusanzeige im Frontend).
4. Bei Erfolg: Statistik + Aktivierung des „Sichtbarkeit"-Toggles möglich.
5. Andere LPs: öffnen Einstellungen → Testdaten → sehen Status „✓ Initialisiert" + Toggle.
6. `wr.test` (SuS-Account) loggt sich ein → sieht Testkurs natürlich, kann üben — kein Toggle nötig.

## 7. Edge-Cases & Fehlerfälle

- **Seed bei laufender Echtprüfung:** Reset darf laufende Echt-Sessions nicht beeinflussen — Filter-Logik verhindert das (Echt-User-Email matcht keinen Test-Filter).
- **Doppel-Seed-Race:** 2 Admins gleichzeitig „Erzeugen": erster läuft, zweiter sieht „läuft bereits, bitte warten". Apps-Script-seitig via `LockService`.
- **Stammdaten-Konflikt:** Wenn `'test-klasse-01'` jemand manuell angelegt hat → Seed bricht ab mit Fehler.
- **Frontend offline beim Seed-Aufruf:** Standard Fehler-Handling, Retry-Button.
- **Echt-SuS mit Email `*.testschueler<N>@*`:** sehr unwahrscheinlich, Pre-Check im Seed warnt und bricht ab.
- **Toggle an, Daten nicht initialisiert:** Listen leer aus Test-Sicht (kein Crash), Hinweis im Test-Tab.
- **`wr.test@stud.gymhofwil.ch` existiert bereits außerhalb Testkurs:** Seed prüft Klassenzugehörigkeit; wenn `klasse ≠ test-klasse-01` → Fehler mit Hinweis (manuelles Eingreifen nötig).
- **Trigger-Fehler (rolleTestdatenMasteryVor schlägt fehl):** Logging via Apps-Script-Error-Notification. Test-Tab zeigt Hinweis wenn Daten > 60 Tage alt.

## 8. Out-of-Scope (für späteren Cluster oder eigenes Spec)

- **Multi-Klassen-Prüfung:** Status quo `PruefungsConfig.klasse: string` bleibt singular. Wäre eigener Cluster.
- **Test-Modus in SuS-Sicht:** `wr.test` sieht immer Test-Daten, andere SuS nie. Kein Toggle nötig.
- **Visuelle Badges auf einzelnen Fragen** in Fragensammlung: Fragen werden nicht gefiltert.
- **Performance-Last-Tests:** dieses Spec deckt funktionale Testdaten ab, kein „1000 SuS"-Stress-Set.

## 9. Abhängigkeiten zu anderen Clustern

- **Cluster E (Konsistenz):** Backend-Persistenz aller LP-Settings. `testdatenSichtbar` ist ein neues Setting im LP-Profil. **Scope-Begrenzung:** Cluster F migriert ausschließlich das neue Feld `testdatenSichtbar`. Eine breitere Migration anderer LP-Settings (z.B. solche die heute in localStorage liegen) ist explizit Cluster E vorbehalten und nicht Teil dieses Specs.
- **Cluster G (Icon-System):** Tab-Icon für „Testdaten"-Tab. Badge-Styling sollte mit Cluster-G-Designsprache abgestimmt sein (insb. Farb-Token statt hardcoded `yellow-100`).
- **Cluster B (Header-Redesign):** Wenn Testkurs in Listen erscheint, sollte Filter-Header in Fragensammlung Test-Records ebenfalls richtig anzeigen — keine separate Logik.

## 10. Test-Strategie

### 10.1 Unit-Tests (Vitest)

- `istTestdaten()` mit allen Record-Typen + Edge-Cases (leerer String, undefined, Echt-User-Email mit `test` im Namen aber kein Test-Prefix).
- `filtereTestdatenWennDeaktiviert()` Pass-through bei `true`, Filter bei `false`.

### 10.2 Backend-Tests (Apps-Script)

- `seedTestdaten()` idempotent (2× ausführen = gleicher Zustand).
- `loescheAlleTestdaten()` löscht alle markierten Records.
- `rolleTestdatenMasteryVor()` setzt Datums korrekt + clampt an heute.
- `LockService`-Race verhindert Doppel-Aufruf.

### 10.3 Read-Pfad-Audit (Plan-Phase)

Vollständiger Grep aller `holeAlle*`-, `ladeXxx`-, `parseXxx`-Funktionen → Filter überall greifen. Bundle-3-Lehre umsetzen.

### 10.4 Browser-E2E (gegen Live-Backend mit echtem Login)

1. Yannick öffnet Einstellungen → Testdaten, klickt „Erzeugen", wartet auf Erfolg.
2. Yannick aktiviert Toggle, geht zu Prüfen-Tab, sieht Testkurs mit „Test"-Badge.
3. Anderer realer LP-Account: Einstellungen → Testdaten, sieht „Initialisiert", aktiviert Toggle, sieht Testkurs.
4. `wr.test@stud.gymhofwil.ch` SuS-Login: sieht Testkurs natürlich, macht eine Übungs-Session.
5. Yannick: Analyse-Tab, sieht Mastery-Verlauf für `wr.test` + alle 20 Test-SuS.
6. Yannick: Reset-Button, Confirm-Modal, Daten zurückgesetzt.
7. LP ohne aktivierten Toggle: weder Testkurs noch Test-SuS noch Test-Sessions in keiner Liste.
8. Console-Errors: 0 in allen Schritten.

## 11. Offene Punkte (vor Implementation klären)

- **Pruefung-zu-Frage-Persistenz:** Embed (Frage-Inhalt direkt im Prüfungs-Record) vs Reference (Frage-ID). Plan-Phase prüft im Source. Davon hängt ab, ob Test-Prüfungen byte-identische Kopien sind oder nur ID-Referenzen.
- **Mastery-Datenmodell:** Plan-Phase prüft genaue Storage-Struktur (eine Sheet für alle Sessions, oder pro SuS aufgeteilt) — wirkt sich auf Roll-Trigger-Performance aus.
- **Statistik bei Erfolg:** genaue Felder im Frontend-Display abhängig von Apps-Script-Response-Schema, finalisiert in Plan-Phase.
