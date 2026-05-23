# MC-Sanierung: Distraktoren-Längen-Tell beseitigen

- **Datum:** 2026-05-21
- **Revision:** 2026-05-22 — Bestand-Sanierung (Phase 1+2) von der Anthropic-API auf Claude Code (Abo) umgestellt. Betroffen: «Architektur», «Per-Frage-Algorithmus», «Review & Verifikation», «Testing», «Deployment», «Risiken», «Explizit verworfen». Unverändert: Problem, Zielmetrik, Scope, Rang-Zuweisung, Prävention.
- **Status:** Genehmigt (User-Approval pro Design-Abschnitt; Abo-Revision 2026-05-22 genehmigt)
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

## Architektur — Apps-Script + Claude Code + Review-Sheet

Die Fragen liegen im Google Sheet (`FRAGENSAMMLUNG_ID`). Die Sanierung teilt sich
auf zwei Werkzeuge: ein **Apps-Script** für die deterministische Sheet-Mechanik
(Planung, Rückschreiben) und eine **Claude-Code-Session** für die KI-Arbeit
(Distraktoren generieren + prüfen). Die KI-Arbeit läuft damit über das Claude-Abo,
nicht über die Anthropic-API — kein API-Key, keine Stückkosten, kein
6-Minuten-Limit auf dem KI-Teil. Brücke zwischen beiden Werkzeugen ist eine CSV
des Review-Tabs.

> **Abgrenzung:** Der laufende ExamLab-KI-Assistent (`apps-script-code.js`,
> `case 'generiereOptionen'`) ruft die Anthropic-API weiterhin auf — eine
> deployte Web-Funktion kann kein persönliches Abo nutzen. Davon ist nur der
> Präventions-Constraint betroffen (Prompt-Tweak, kein Mengenverbrauch). Die
> Umstellung auf das Abo betrifft ausschliesslich den einmaligen Sanierungs-Batch.

**Apps-Script-File:** `ExamLab/scripts/sanierung-mc-distraktoren.js` — zum
Reinkopieren in den Apps-Script-Editor, analog `migrate-fibu-fragen.js`. Enthält
nur noch Phase 0 + Phase 3 + Helfer; `DRY_RUN = true` als Default (schützt
Phase 3). `run*`-Wrapper-Funktionen, damit jede Phase im Editor-Dropdown
erscheint (Apps-Script blendet `_`-Suffix-Funktionen aus).

### Vier Phasen

| Phase | Wer | Tut |
|---|---|---|
| 0 — Planung | Apps-Script `phase0_planung()` | Liest alle ~1023 Single-MC, klassifiziert jede, misst das Rang-Histogramm der 264 unauffälligen, weist den 759 je einen **Ziel-Rang** zu, legt den Review-Tab an und befüllt ihn. Loggt die projizierte Schluss-Verteilung. |
| — Export | LP | Lädt den `MC-Sanierung-Review`-Tab als CSV herunter (Datei → Herunterladen → CSV). |
| 1 — Generierung | **Claude Code** | Liest die CSV; generiert pro auffälliger Frage 3 neue Distraktoren; füllt `distraktor_neu_*`, `neu_len_*`, `ist_rang`. Die 759 Zeilen gebündelt in Batches (parallele Subagenten). |
| 2 — Checker | **Claude Code** | Unabhängiger, frischer Checker-Pass pro Frage (eigener Subagent, kein geteilter Kontext mit Phase 1) → `checker_status` + `checker_begruendung`. |
| — Import | LP | Importiert die gefüllte CSV zurück (Datei → Importieren → aktuelles Blatt ersetzen, Ziel `MC-Sanierung-Review`). |
| 3 — Rückschreiben | Apps-Script `phase3_rueckschreiben()` | Schreibt nur Zeilen mit `review_status = freigegeben` zurück in `typDaten.optionen` (+ Legacy-`optionen`-Spalte, falls vorhanden). Idempotent über `geschrieben_am`. |

Phase 0 und Phase 3 (Apps-Script) sind idempotent und — wegen des
Apps-Script-6-Minuten-Limits — cursor-resumable über `PropertiesService`: der LP
startet sie so oft neu, bis der Cursor das Ende erreicht. Phase 1+2 laufen in
Claude Code ohne dieses Limit; die Batch-Bündelung übernimmt dort die
Resumability-Rolle (eine unterbrochene Session setzt am nächsten unbefüllten
Batch fort).

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

## Per-Frage-Sanierungs-Algorithmus (Phase 1, in Claude Code)

Für eine Frage mit Ziel-Rang `r` (1 = längste … 4 = kürzeste) und fixer korrekter
Antwort der Länge `L_korrekt`:

- Es braucht `(r − 1)` Distraktoren *länger* und `(4 − r)` Distraktoren *kürzer*
  als `L_korrekt` (Rang `r` = 1 + Anzahl längerer Distraktoren).
- Daraus leitet Claude Code 3 Ziel-Längen mit etwas Jitter ab (damit die Längen
  selbst kein perfektes Muster bilden).
- **Generierungs-Vorgabe** je Distraktor (Claude Code folgt ihr):
  - **(a)** bleibt inhaltlich **eindeutig falsch** relativ zur Frage;
  - **(b)** bleibt ein fachlich plausibler Ablenker — kein Füllwort-Geschwafel,
    keine offensichtlich fake Aussage;
  - **(c)** trifft die Ziel-Länge ± Toleranz (mehr Vollständigkeit/Präzision, nicht
    Padding);
  - **(d)** die korrekte Antwort wird weder verändert noch als Distraktor
    wiederholt.
- Pro CSV-Zeile liest Claude Code: Fragetext, korrekte Antwort (read-only, als
  Kontext + zur Längen-Kalibrierung), die 3 aktuellen Distraktoren, `korrekt_len`
  und `ziel_rang`.
- `ist_rang` wird nach der Generierung aus den realen Vorschlags-Längen berechnet.
  Verfehlt die Ausgabe den `ziel_rang`, wird die Zeile automatisch geflaggt.

**Längen-Messung:** Phase 0 (`korrekt_len`), Phase 1 (`neu_len_*`, `ist_rang`) und
das Diagnose-Skript müssen **dieselbe** Längen-Definition verwenden:
`String(text).trim().length` (im Diagnose-Skript der Helfer `textLaenge_`). Sonst
messen Phase-0-Projektion und Schluss-Re-Run unterschiedliche Grössen. Claude Code
verwendet beim Füllen von `neu_len_*` exakt diese Definition.

---

## Review & Verifikation

### Phase 2 — Checker-Pass

Pro Frage ein **unabhängiger, frischer** Checker-Pass — ausgeführt von einem
eigenen Subagenten ohne geteilten Kontext mit der Generierung; genau die
Unabhängigkeit macht die Prüfung wertvoll. Eingabe: Fragetext, korrekte Antwort,
die 3 *neuen* Distraktoren. Bewertung je neuem Distraktor:

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
Generierungs-Runde nur auf der `abgelehnt`-Menge. Damit Phase 1/2 diese Zeilen
erneut verarbeiten, muss die zweite Runde ihren Zeilen-Zustand zurücksetzen
(`distraktor_neu_*`, `neu_len_*`, `ist_rang`, `checker_*`, `review_status` leeren)
und die Phasen-Cursor für diese Teilmenge neu initialisieren — sonst überspringt
die Resumability-Logik sie.

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

Dieses Projekt fasst Apps-Script-Werkzeuge (Phase 0/3 + Diagnose-Erweiterung +
Prompt-String) und eine Claude-Code-Generierung (Phase 1/2) an — kein React-Code,
keine TypeScript-Typen. `tsc -b` / `vitest` / `npm run build` sind hier *nicht*
die Gates (die bestehenden Migrations-Skripte des Projekts setzen diesen
Präzedenzfall). Die Verifikation läuft über:

- **`DRY_RUN = true`** beim Erst-Lauf von Phase 3 — nur Logger, kein Rückschreiben.
  Phase 0 schreibt nur das Review-Sheet, Phase 1/2 nur die CSV — sie brauchen kein
  `DRY_RUN`.
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

- **neu** `ExamLab/scripts/sanierung-mc-distraktoren.js` (nur Phase 0 + 3 + Helfer)
- **erweitert** `ExamLab/scripts/diagnose-mc-laengste-antwort.js` (Multi-MC-Pass)
- **Prompt-Edit** in `ExamLab/apps-script-code.js` (`case 'generiereOptionen'`)

Die `apps-script-code.js`-Änderung braucht einen **manuellen Apps-Script-Deploy**
(neue Bereitstellung) durch den LP. `sanierung-mc-distraktoren.js` und
`diagnose-mc-laengste-antwort.js` werden zum Ausführen in den Apps-Script-Editor
kopiert. Phase 1+2 laufen in einer Claude-Code-Session — dafür ist kein API-Key
und kein Editor-Skript nötig. Kein Frontend-Deploy nötig.

---

## Neue / betroffene Dateien

| Datei | Änderung |
|---|---|
| `ExamLab/scripts/sanierung-mc-distraktoren.js` | **Neu.** Apps-Script mit Phase 0 (Planung) + Phase 3 (Rückschreiben) + Helfer; `DRY_RUN`-Default für Phase 3. |
| `ExamLab/scripts/diagnose-mc-laengste-antwort.js` | **Erweitert.** Zweite Funktion `diagnoseMcMultiLaenge()` für die Multi-MC-Analyse. |
| `ExamLab/apps-script-code.js` | **Prompt-Edit.** Längen-Constraint in `case 'generiereOptionen'` (+ ggf. weitere MC-Optionen erzeugende KI-Aktionen). |
| `MC-Sanierung-Review` (Sheet-Tab) | **Neu.** Laufzeit-Artefakt in der Fragensammlung-Tabelle, kein Repo-File. |
| Review-CSV (transiente Arbeitsdatei) | **Neu.** Export/Import-Brücke Sheet ↔ Claude Code. Enthält echte Prüfungsfragen → gitignored, kein Repo-File. |

---

## Komponenten-Schnitt / Isolation

- `sanierung-mc-distraktoren.js` ist **self-contained**: `phase0_planung()` +
  `phase3_rueckschreiben()` + Helfer (`ladeSingleMcFragen_`,
  `berechneZielRaenge_`, `schreibeReviewZeile_`, `leseOptionen_` /
  `schreibeOptionen_`, `textLaenge_`). Kommuniziert mit dem Rest nur über das
  Sheet. Keine Kopplung an die React-App. (`rufeClaudeAuf_` entfällt — die
  KI-Arbeit liegt ausserhalb des Apps-Scripts.)
- Phase 0 und Phase 3 sind je eine eigene, einzeln aufrufbare Funktion mit klarem
  Input (Sheet-Zustand) und Output (Sheet-Zustand); Phase 3 ist via `DRY_RUN`
  trocken prüfbar.
- Die Claude-Code-Generierung (Phase 1+2) koppelt nur über die CSV ans
  Apps-Script — dieselben Spalten rein wie raus, kein gemeinsamer Code.
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
- **CSV-Round-Trip:** Export/Import zwischen Sheet und Claude Code ist ein
  manueller LP-Schritt. Risiko: Spalten- oder Encoding-Drift beim Re-Import.
  Mitigation: ganzer Tab als CSV (kein Teil-Paste), `id`-Spalte als stabiler
  Schlüssel, LP prüft nach dem Import stichprobenartig.
- **Abo-Verbrauch:** ~1'500 Generierungen + Checks laufen über das Claude-Abo; je
  nach Abo-Stufe verteilt sich das über mehrere Sessions. Kein 6-Min-Limit mehr,
  da Phase 1/2 nicht im Apps-Script laufen.
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
- **Committetes Generierungs-Skript (Claude Agent SDK):** Ein wiederverwendbares
  Node-Skript, das die Generierung programmatisch über das Abo treibt, wurde
  zugunsten der direkten Claude-Code-Session verworfen — für einen Einmal-Job
  Overhead (SDK-Setup, Abo-Auth-Konfiguration), und ein periodischer Audit ist
  ohnehin nicht im Scope.
