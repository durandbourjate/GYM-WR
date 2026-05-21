# MC-Sanierung: Distraktoren-Längen-Tell beseitigen

- **Datum:** 2026-05-21
- **Status:** Genehmigt (User-Approval pro Design-Abschnitt)
- **Kontext:** Ein Audit (`ExamLab/scripts/diagnose-mc-laengste-antwort.js`) hat ein
  systematisches Exam-Integritäts-Problem in der Fragensammlung aufgedeckt. Eigenes
  Content-/Tooling-Projekt, getrennt von der Backend-Migration.

---

## Problem

Das Diagnose-Skript hat alle Single-Choice-Multiple-Choice-Fragen (`typ:'mc'`,
genau eine korrekte Option) der Fragensammlung analysiert:

- **759 von 1023 Single-MC (74,2 %)** haben die korrekte Antwort als strikt
  **längste** Option.
- Zufallserwartung bei Ø 4 Optionen: ~25 %. Nur 2,8 % haben die korrekte als
  kürzeste.
- Ø Zeichenlänge: korrekt 82 vs. Distraktor 45 (**1,81×**). Befund: AUFFÄLLIG.

**Ursache:** Generierungs-Artefakt — korrekte Antworten wurden als vollständige,
präzise, abgesicherte Aussagen formuliert (lang), Distraktoren als kurze
plausibel-falsche Schnipsel.

**Pädagogisches Risiko:** Schüler können Single-Choice-MC mit der Heuristik
«längste Antwort wählen» zu ~74 % korrekt raten — ohne Inhaltswissen. Das
untergräbt die Validität jeder MC-basierten Prüfung *und* Übung.

Die 238 Multi-Choice-MC (`mehrfachauswahl:true`) wurden bewusst nicht
längen-analysiert — das «längste = korrekt»-Muster ist dort nicht direkt
aussagekräftig.

---

## Zielmetrik — was «saniert» bedeutet

Der Sanierungs-Erfolg ist **aggregat** definiert, nie pro Einzelfrage:

- Über alle Single-MC ist der **Längen-Rang der korrekten Antwort gleichverteilt**
  — jeder der 4 Ränge (längste / 2. / 3. / kürzeste) tritt bei ~25 % der Fragen
  auf.
- **Ø-Länge korrekt ≈ Ø-Länge Distraktor** (Distraktoren werden angehoben, die
  korrekte Antwort bleibt fix — siehe Eingriffstiefe).

**Zentrales Prinzip — keine Korrelation, nicht Anti-Korrelation:** Das Ziel ist,
dass die Länge einer Option *nichts* über ihre Korrektheit verrät. Die korrekte
Antwort **darf** die längste Option einer Einzelfrage sein — sie darf es nur nicht
*systematisch* sein. Würde die korrekte Antwort nach der Sanierung *nie* die
längste sein, wäre das ein genauso ausnutzbares (invertiertes) Muster. Eine
Einzelfrage ist deshalb nie «falsch»; nur die systematische Häufung ist das
Problem. Folge: Es gibt keine Pro-Frage-Warnung.

**Erfolgskriterium — objektiv messbar:** Der Diagnose-Skript-Re-Run nach der
Sanierung liefert `laengsteProzent` *und* `kuerzesteProzent` je innerhalb ~1,2×
der Zufallserwartung → Befund «UNAUFFÄLLIG» (die bestehende Schwelle des
Diagnose-Skripts: > 1,5× = AUFFÄLLIG, > 1,2× = LEICHT ERHÖHT, sonst UNAUFFÄLLIG).

### Eingriffstiefe

Nur **Distraktoren** werden umformuliert. Die korrekte Antwort bleibt zu 100 %
unangetastet — Text und `korrekt`-Flag. Begründung: Ein Eingriff in die korrekte
Antwort kann sie unbemerkt falsch oder ungenau machen (schlimmster Fall in einer
Prüfung). Distraktoren-only hält die Blast-Radius klein: Ein Distraktor-Edit kann
nur durch zwei Failure-Modes scheitern — versehentlich *wahr* geworden, oder
aufgebläht zu «Word-Salad» — beide gezielt prüfbar (siehe Review & Verifikation).

**Feasibility-Vorbehalt:** Da die korrekte Antwort nie gekürzt wird, würde bei
einer ohnehin sehr langen korrekten Antwort der Ziel-Rang «kürzeste» erzwingen,
dass *alle drei* Distraktoren noch länger werden — hohes Word-Salad-Risiko. Solche
Fragen werden bewusst beim Rang «längste» belassen. Der Aggregat-Zielwert toleriert
diesen Bodensatz, solange er klein bleibt (siehe Rang-Zuweisung).

---

## Scope

- **Single-MC** (`typ:'mc'`, `mehrfachauswahl:false`): 759 auffällige Fragen werden
  saniert. Die 264 bereits unauffälligen bleiben **unangetastet** (weniger
  Review-Last, weniger Risiko, YAGNI) — sie fliessen nur als fixe Grösse in die
  Aggregat-Rechnung ein. Tabs: BWL / VWL / Recht / Informatik.
- **Multi-MC** (`mehrfachauswahl:true`, ~238): zuerst **Analyse** (Diagnose-Skript
  erweitern). Bei Befund mit denselben Mitteln mit-saniert, sonst dokumentiert
  verworfen.

---

## Architektur — Apps-Script-LLM-Pipeline + Review-Sheet

Die Fragen liegen im Google Sheet (`FRAGENSAMMLUNG_ID`); ein Apps-Script ruft
bereits Claude (Anthropic) auf (`kiAssistentEndpoint`, `apps-script-code.js:7302`,
Modell `claude-sonnet-4-20250514`). Die Sanierung nutzt diese Infrastruktur.

**Neues Apps-Script-File:** `ExamLab/scripts/sanierung-mc-distraktoren.js` — zum
Reinkopieren in den Apps-Script-Editor, analog `migrate-fibu-fragen.js`. `DRY_RUN
= true` als Default. `run*`-Wrapper-Funktionen, damit jede Phase im
Editor-Dropdown erscheint (Apps-Script blendet `_`-Suffix-Funktionen aus).

### Vier Phasen

Jede Phase ist einzeln lauffähig, idempotent und resumable. Wegen des
Apps-Script-6-Minuten-Limits speichert jede Phase einen Cursor in
`PropertiesService` und wird vom LP so oft manuell neu gestartet, bis der Cursor
das Ende erreicht.

| Phase | Funktion | Tut |
|---|---|---|
| 0 — Planung | `phase0_planung()` | Liest alle ~1023 Single-MC, klassifiziert jede, misst das Rang-Histogramm der 264 unauffälligen, weist den 759 je einen **Ziel-Rang** zu, legt den Review-Tab an und befüllt ihn. Loggt die projizierte Schluss-Verteilung. |
| 1 — Generierung | `phase1_generierung()` | Pro auffälliger Frage ein Claude-Call → 3 neue Distraktoren. Batchweise (~100/Lauf), Cursor-resumable. Schreibt Vorschläge + berechneten `ist_rang` in die Review-Zeile. |
| 2 — Checker | `phase2_checker()` | Zweiter, unabhängiger Claude-Pass pro Frage → `checker_status` + `checker_begruendung`. Batchweise. |
| 3 — Rückschreiben | `phase3_rueckschreiben()` | Schreibt nur Zeilen mit `review_status = freigegeben` zurück in `typDaten.optionen` (+ Legacy-`optionen`-Spalte, falls vorhanden). Idempotent über `geschrieben_am`. |

### Review-Sheet

Ein neuer Tab `MC-Sanierung-Review` in der Fragensammlung-Tabelle (alles an einem
Ort; das Apps-Script hat die Tabelle ohnehin offen). Spalten:

| Spalte | Inhalt |
|---|---|
| `id` | Frage-ID |
| `tab` | BWL / VWL / Recht / Informatik |
| `fragetext` | Kontext für den Review |
| `korrekt_text` | Korrekte Antwort (read-only-Referenz, nie verändert) |
| `korrekt_len` | Zeichenlänge der korrekten Antwort |
| `ziel_rang` | Zugewiesener Ziel-Rang der korrekten Antwort (1–4) |
| `distraktor_alt_1..3` | Original-Distraktoren |
| `distraktor_neu_1..3` | Von Phase 1 vorgeschlagene Distraktoren |
| `neu_len_1..3` | Zeichenlängen der Vorschläge |
| `ist_rang` | Aus den Vorschlags-Längen berechneter realer Rang der korrekten Antwort |
| `stichprobe` | `JA`, wenn die Zeile in die Review-Stichprobe fällt |
| `checker_status` | `OK` / `FLAG` (aus Phase 2) |
| `checker_begruendung` | Begründung bei `FLAG` |
| `review_status` | LP füllt: `freigegeben` / `abgelehnt` / `nachbearbeitet` |
| `geschrieben_am` | Von Phase 3 gesetzt |

Der LP arbeitet im vertrauten Spreadsheet und kann Vorschläge direkt in der
`distraktor_neu_*`-Zelle nachbessern.

---

## Rang-Zuweisung (Phase 0)

Die 759 auffälligen Fragen sind heute alle Rang 1 (korrekte = strikt längste). Die
264 unauffälligen behalten ihre realen Ränge (≥ 2). Ziel: das Gesamt-Histogramm
über alle 1023 ≈ gleichverteilt (~256 pro Rang).

**Zuweisungs-Regel** (deterministisch → reproduzierbar/resumable):

1. Phase 0 misst das reale Rang-Histogramm der 264 unauffälligen.
2. Daraus ergibt sich, wie viele der 759 je Rang gebraucht werden, damit jeder der
   4 Ränge final ~256 erreicht.
3. Die 759 werden nach `korrekt_len` **absteigend** sortiert. Die Fragen mit den
   *längsten* korrekten Antworten behalten Rang 1 — das löst zugleich den
   Feasibility-Vorbehalt (sehr lange korrekte Antwort lässt sich nicht plausibel
   überbieten) und füllt den Rang-1-Anteil.
4. Die übrigen 759 werden auf die Ränge 2/3/4 verteilt; die Streuung innerhalb
   einer Rang-Gruppe ist deterministisch über einen Hash der Frage-`id`.

Phase 0 loggt die **projizierte Schluss-Verteilung** (264 real + 759 zugewiesen).
Der LP bestätigt ~25/25/25/25, bevor Phase 1 startet — so wird die Rang-Mathematik
geprüft, ohne Test-Framework.

---

## Per-Frage-Sanierungs-Algorithmus (Phase 1)

Für eine Frage mit Ziel-Rang `r` (1 = längste … 4 = kürzeste) und fixer korrekter
Antwort der Länge `L_korrekt`:

- Es braucht `(4 − r)` Distraktoren *länger* und `(r − 1)` Distraktoren *kürzer*
  als `L_korrekt`.
- Daraus werden 3 Ziel-Längen mit etwas Jitter abgeleitet (damit die Längen selbst
  kein perfektes Muster bilden).
- **Claude-Instruktion** je Distraktor:
  - **(a)** bleibt inhaltlich **eindeutig falsch** relativ zur Frage;
  - **(b)** bleibt ein fachlich plausibler Ablenker — kein Füllwort-Geschwafel,
    keine offensichtlich fake Aussage;
  - **(c)** trifft die Ziel-Länge ± Toleranz (mehr Vollständigkeit/Präzision, nicht
    Padding);
  - **(d)** die korrekte Antwort wird weder verändert noch als Distraktor
    wiederholt.
- Claude erhält Fragetext, korrekte Antwort (read-only, als Kontext + zur
  Längen-Kalibrierung) und die 3 aktuellen Distraktoren.
- `ist_rang` wird nach der Generierung aus den realen Vorschlags-Längen berechnet.
  Verfehlt die Ausgabe den `ziel_rang`, wird die Zeile automatisch geflaggt.

---

## Review & Verifikation

### Phase 2 — Checker-Pass

Pro Frage ein **unabhängiger, frischer** Claude-Call — kein geteilter Kontext mit
der Generierung; genau die Unabhängigkeit macht die Prüfung wertvoll. Eingabe:
Fragetext, korrekte Antwort, die 3 *neuen* Distraktoren. Bewertung je neuem
Distraktor:

1. **Korrektheit** — ist der Distraktor eindeutig falsch? Der katastrophale Fall
   ist ein versehentlich *wahr* gewordener Distraktor (zwei korrekte Antworten).
   Der Checker urteilt **konservativ**: lässt sich ein Distraktor unter
   vernünftiger Lesart als wahr argumentieren → `FLAG`.
2. **Plausibilität** — echter fachlicher Ablenker, oder aufgeblähtes
   Füllwort-Geschwafel / offensichtlich fake?
3. **Keine Verdoppelung** — wiederholt der Distraktor versehentlich die korrekte
   Antwort oder einen anderen Distraktor?

Ausgabe: `checker_status` ∈ {`OK`, `FLAG`} + `checker_begruendung`. Über-Flaggen
ist akzeptabel (kostet nur Review-Zeit, kein Korrektheitsrisiko).

### Flag-Auslöser

Eine Zeile wird geflaggt, wenn **mindestens eines** zutrifft:

- der Checker meldet `FLAG`;
- `ist_rang ≠ ziel_rang` (Ziel-Länge verfehlt);
- defensiver Gleichheits-Check: ein neuer Distraktor-Text ist identisch mit der
  korrekten Antwort.

### Menschlicher Review-Gate

- **Pflicht-Review:** Der LP prüft *jede* `FLAG`-Zeile und setzt `review_status`
  auf `freigegeben` (doch in Ordnung), `abgelehnt` (Sanierung verwerfen,
  Original-Distraktoren behalten) oder `nachbearbeitet` (LP hat den Vorschlag in
  der Zelle korrigiert).
- **Stichprobe:** ~12 % der `OK`-Zeilen werden deterministisch (Hash aus `id`) als
  `stichprobe = JA` markiert; der LP reviewt auch diese.
- **Eskalation:** Findet der LP in der Stichprobe einen echten *Korrektheits*-Fehler
  (Distraktor wahr), der dem Checker entgangen ist, kollabiert das Vertrauen in die
  Auto-Freigabe → **Voll-Review aller `OK`-Zeilen**. Reine Stil-Mängel lösen keine
  Eskalation aus, nur `nachbearbeitet`.
- **Auto-Freigabe:** Erst *nachdem* die Stichprobe sauber durch ist, werden die
  übrigen `OK`-Zeilen gebündelt auf `freigegeben` gesetzt → Phase 3.

### Objektive Schluss-Verifikation

Nach dem Rückschreiben (Phase 3) wird das Diagnose-Skript erneut ausgeführt.
Erfolg = `laengsteProzent` *und* `kuerzesteProzent` je innerhalb ~1,2× der
Zufallserwartung → Befund «UNAUFFÄLLIG». Das ist der inhaltsfreie, objektive
Nachweis, dass das Aggregat-Muster verschwunden ist.

**Bekannte Schleife:** Zeilen, die der LP auf `abgelehnt` setzt, behalten
Original-Distraktoren und bleiben auffällig. Ergibt der Diagnose-Re-Run wegen zu
vieler `abgelehnt`-Zeilen keinen UNAUFFÄLLIG-Befund, läuft eine zweite
Generierungs-Runde nur auf der `abgelehnt`-Menge.

---

## Multi-MC-Analyse

Das Diagnose-Skript `diagnose-mc-laengste-antwort.js` wird um eine zweite Funktion
`diagnoseMcMultiLaenge()` erweitert (neben der bestehenden
`diagnoseMcLaengsteAntwort()`). Sie prüft die ~238 Multi-Choice-MC auf einen
verwandten Tell: **Ø-Länge der korrekten Optionen vs. Ø-Länge der falschen
Optionen**. Ist die Länge einer Option ein Prädiktor für ihre Korrektheit
(«die langen anklicken»), liegt ein Befund vor.

- **Kein Befund:** dokumentiert verworfen, kein weiterer Aufwand.
- **Befund:** Die Multi-MC werden mit denselben Mitteln saniert — die falschen
  Optionen (Distraktoren) werden so umformuliert, dass die Längen-Verteilung der
  korrekten und falschen Optionen sich überlappt (Länge ⊥ Korrektheit). Der
  Pipeline-Mechanismus (Review-Sheet, Checker, Gate) ist identisch; nur die
  Rang-Mechanik entfällt zugunsten von Längen-Parität pro Frage.

---

## Rückfall-Prävention — KI-Prompt-Constraint

Einzige Präventionsmassnahme. `apps-script-code.js`, `case 'generiereOptionen'`
(~Z. 7350). Der aktuelle Prompt verlangt «3 plausible Distraktoren», sagt nichts
zur Längen-Kalibrierung.

Der Generator erzeugt *alle 4 Optionen* (inkl. der korrekten) — darum genügt hier
ein einfacher Constraint; die Rang-Mechanik der Bestand-Sanierung ist nur nötig,
wo die korrekte Antwort fix ist.

**Ergänzung sinngemäss:** «Alle 4 Optionen müssen etwa gleich lang sein (ähnliche
Zeichenzahl und Detailtiefe). Formuliere die Distraktoren mit derselben
Vollständigkeit und Präzision wie die korrekte Antwort. Die korrekte Antwort darf
sich nicht durch ihre Länge abheben — sie darf weder zuverlässig die längste noch
die kürzeste Option sein.»

**Falle vermeiden:** Es darf *nicht* «mach die korrekte kürzer als einen
Distraktor» instruiert werden — das erzeugt über viele Calls das inverse Muster.
Gleich lange Optionen pro Call ⇒ zufälliger Rang ⇒ aggregat gleichverteilt, gratis.

**Plan-Phase muss prüfen:** ob weitere KI-Aktionen MC-Optionen erzeugen (z. B. ein
Ganzfrage-Generator) und den Constraint überall anwenden.

---

## Testing & Verifikation

Dieses Projekt fasst **ausschliesslich Apps-Script-Werkzeuge** an (Migrations-Skript
+ Diagnose-Erweiterung + Prompt-String). Kein React-Code, keine TypeScript-Typen —
`tsc -b` / `vitest` / `npm run build` sind hier *nicht* die Gates (die bestehenden
Migrations-Skripte des Projekts setzen diesen Präzedenzfall). Die Verifikation
läuft über:

- **`DRY_RUN = true`** beim Erst-Lauf jeder Phase — nur Logger + Review-Sheet, kein
  Rückschreiben.
- **Phase-0-Log der projizierten Schluss-Verteilung** — der LP bestätigt
  ~25/25/25/25, bevor Phase 1 startet (prüft die Rang-Mathematik ohne
  Test-Framework).
- **Review-Sheet** als menschlich inspizierbares Artefakt + **Stichprobe**.
- **Diagnose-Re-Run** als objektiver Schluss-Nachweis.
- **KI-Prompt-Abnahme:** nach Deploy ~30–50 MC-Fragen via KI-Assistent generieren,
  die Diagnose-Logik darauf anwenden → Verteilung ~gleichverteilt.

---

## Deployment

Drei committete Repo-Dateien über einen Feature-Branch:

- **neu** `ExamLab/scripts/sanierung-mc-distraktoren.js`
- **erweitert** `ExamLab/scripts/diagnose-mc-laengste-antwort.js` (Multi-MC-Pass)
- **Prompt-Edit** in `ExamLab/apps-script-code.js` (`case 'generiereOptionen'`)

Die `apps-script-code.js`-Änderung braucht einen **manuellen Apps-Script-Deploy**
(neue Bereitstellung) durch den LP. Die beiden Skripte werden zum Ausführen in den
Apps-Script-Editor kopiert. Kein Frontend-Deploy nötig.

---

## Neue / betroffene Dateien

| Datei | Änderung |
|---|---|
| `ExamLab/scripts/sanierung-mc-distraktoren.js` | **Neu.** 4-Phasen-Pipeline + Helfer, `DRY_RUN`-Default. |
| `ExamLab/scripts/diagnose-mc-laengste-antwort.js` | **Erweitert.** Zweite Funktion `diagnoseMcMultiLaenge()` für die Multi-MC-Analyse. |
| `ExamLab/apps-script-code.js` | **Prompt-Edit.** Längen-Constraint in `case 'generiereOptionen'` (+ ggf. weitere MC-Optionen erzeugende KI-Aktionen). |
| `MC-Sanierung-Review` (Sheet-Tab) | **Neu.** Laufzeit-Artefakt in der Fragensammlung-Tabelle, kein Repo-File. |

---

## Komponenten-Schnitt / Isolation

- `sanierung-mc-distraktoren.js` ist **self-contained**: 4 Phasen-Funktionen +
  Helfer (`ladeSingleMcFragen_`, `berechneZielRaenge_`, `rufeClaudeAuf_`,
  `schreibeReviewZeile_`, `leseOptionen_` / `schreibeOptionen_`). Kommuniziert mit
  dem Rest nur über das Sheet (liest Fragensammlung-Tabs, schreibt Review-Tab und
  zurück). Keine Kopplung an die React-App.
- Jede Phase ist eine eigene, einzeln aufrufbare Funktion mit klarem Input
  (Sheet-Zustand) und Output (Sheet-Zustand) — unabhängig testbar via `DRY_RUN`.
- Die Diagnose-Erweiterung ist eine separate Funktion neben der bestehenden —
  keine Änderung am bestehenden Single-MC-Pass.
- Der Prompt-Edit ist eine lokalisierte String-Änderung in einem `case` —
  minimaler Blast-Radius.

---

## Reihenfolge / Deliverables

Drei unabhängige Deliverables, empfohlene Reihenfolge:

1. **KI-Prompt-Constraint** zuerst — stoppt die Blutung; ab Deploy sind neu
   generierte Fragen sauber.
2. **Multi-MC-Analyse** — Diagnose-Erweiterung; entscheidet, ob Multi-MC in den
   Sanierungs-Scope fällt.
3. **Bestand-Sanierung** der 759 Single-MC (+ ggf. Multi-MC) über die
   4-Phasen-Pipeline.

---

## Offene Punkte / Risiken

- **`abgelehnt`-Bodensatz:** Zu viele vom LP abgelehnte Vorschläge können den
  UNAUFFÄLLIG-Befund verhindern → zweite Generierungs-Runde (bekannte Schleife).
- **Apps-Script-6-Min-Limit:** Phase 1 und 2 brauchen je ~7–10 manuelle Neustarts
  (759 × ~3 s API-Latenz). Cursor-Resumability ist Pflicht.
- **Checker-Restrisiko:** Ein LLM-Checker kann einen wahr gewordenen Distraktor
  übersehen. Mitigation: konservatives Flaggen + Stichprobe + Eskalations-Regel.
- **Weitere Generierungs-Pfade:** Falls neben `generiereOptionen` weitere
  KI-Aktionen MC-Optionen erzeugen, müssen alle den Constraint bekommen — in der
  Plan-Phase zu verifizieren.

---

## Explizit verworfen (YAGNI)

- **Editor-Warnung beim Speichern:** Eine Pro-Frage-Warnung «korrekte Antwort ist
  die längste» wäre Rauschen — eine Einzelfrage mit längster korrekter Antwort ist
  legitim (~25 % der Fälle). Das Problem ist rein aggregat.
- **Import-Pipeline-Check:** Nicht im Scope; der KI-Generator ist der
  nachgewiesene Verursacher.
- **Periodischer Audit als stehende Massnahme:** Das Diagnose-Skript bleibt als
  Werkzeug erhalten (wird hier ohnehin erweitert + re-run), aber es wird kein
  periodischer Prozess etabliert.
- **Eingriff in die korrekte Antwort:** Verworfen zugunsten von Distraktoren-only —
  Korrektheitsrisiko zu hoch.
- **Sanierung der 264 bereits unauffälligen Fragen:** Unnötige Änderung an
  bereits korrektem Inhalt.
