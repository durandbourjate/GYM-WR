# Multi-MC-Sanierung: Distraktoren-Längen-Tell bei Mehrfachauswahl beseitigen

- **Datum:** 2026-05-23
- **Status:** Entwurf (User-Approval pro Design-Abschnitt im Brainstorming)
- **Kontext:** Folge-Cluster der MC-Sanierung (Single-MC, gemergt 23.05.2026, Commit
  `a79b0a5`). Eigener Branch `feature/multi-mc-sanierung-spec`. Standalone-Cluster
  vom laufenden Backend-Migrations-Projekt.

---

## Problem

Das Diagnose-Skript `ExamLab/scripts/diagnose-mc-laengste-antwort.js`
(`diagnoseMcMultiLaenge()`) hat alle **238 Multi-Choice-MC** (`typ:'mc'`,
`mehrfachauswahl:true` bzw. ≥ 2 korrekte Optionen) der Fragensammlung analysiert
(Run am 23.05.2026):

- Ø Zeichenlänge korrekt: **53**, Distraktor: **41**
- **Verhältnis korrekt/Distraktor: 1.27×**
- **163 von 238 Fragen (68.5 %)** haben Ø-korrekt > Ø-Distraktor
- Befund: **LEICHT ERHÖHT** (Schwelle `AUFFÄLLIG` = > 1.30× oder > 70 %).

**Vergleich Single-MC** (vor Sanierung): 1.81× / 74.2 % — Multi-MC ist deutlich
schwächer ausgeprägt, aber der Tell ist messbar.

**Ursache:** Gleiches Generierungs-Artefakt wie bei Single-MC — korrekte Antworten
als vollständige, abgesicherte Aussagen formuliert, Distraktoren kürzer.

**Pädagogisches Risiko:** Bei Multi-MC mit 2–3 korrekten von 4 Optionen funktioniert
die Heuristik „wähle die längsten *k* Optionen" (mit *k* = bekannte oder geratene
Anzahl Korrekter) systematisch besser als Zufall. Die Tell-Stärke pro Frage
variiert — in der Sanierung wird nur die „rote Zone" angegangen (siehe
Zielmetrik + Phase 0).

---

## Zielmetrik — was «saniert» bedeutet

Erfolg ist **aggregat + pro-Frage** definiert, hybrid:

1. **Aggregat:** Nach Sanierung ist das Verhältnis Ø-korrekt / Ø-Distraktor
   **< 1.15×** und `frageProzent` (Anteil Fragen mit Ø-korrekt > Ø-Distraktor)
   **< 65 %**. Das ist die Standard-Diagnose-Ausgabe; sie muss „UNAUFFÄLLIG"
   melden.
2. **Pro Frage (hart):** Keine Frage hat mehr „perfektes Ranking" — also
   `min(korrekt_laengen) > max(distraktor_laengen)`. Ausnahme: Fragen, die im
   LP-Review-Gate abgelehnt wurden (`review_status = 'abgelehnt'`) — diese
   bleiben unverändert im Bestand.

**Zentrales Prinzip:** Wie bei Single-MC ist das Ziel *Längen ⊥ Korrektheit*, nicht
Anti-Korrelation. Die Längen-Verteilungen von korrekten und falschen Optionen
sollen sich überlappen, nicht klar getrennt sein. Eine Einzelfrage darf die
längste Option als korrekt haben — sie darf das nur nicht *systematisch* tun.

### Eingriffstiefe

Nur **Distraktoren** werden umformuliert. Korrekte Optionen bleiben zu 100 %
unangetastet — Text + `korrekt`-Flag. Begründung identisch zu Single-MC:
Blast-Radius klein halten, kein versehentliches Falschmachen einer korrekten
Antwort.

---

## Scope

- **Multi-MC** (`mehrfachauswahl:true`, 238 Fragen total): saniert wird **die rote
  Zone**, datengetrieben nach Tell-Score-Inspect (siehe Phase 0). Erwarteter
  Umfang: ~60–100 Fragen. Tabs: BWL / VWL / Recht / Informatik.
- **Nicht-rote-Zone-Multi-MC** (~140–180): unangetastet — sie fliessen nur als
  fixe Grösse in die Aggregat-Rechnung ein.
- **Single-MC:** unangetastet (Teil A+B abgeschlossen).
- **Andere Tells** (Position-Bias, Negations-Marker, Syntax-Parallelität): bewusst
  out-of-scope für diesen Cluster.

---

## Architektur — Apps-Script + Claude Code + Review-Sheet

Wie bei Single-MC. Zweiteilung:

- **Apps-Script** für deterministische Sheet-Mechanik (Phase 0 Planung, Phase 3
  Rückschreiben + Helfer).
- **Claude Code** für KI-Arbeit (Phase 1 Distraktoren generieren, Phase 2 Checker).
  Über das Claude-Abo, nicht über die Anthropic-API — kein API-Key, kein
  6-Min-Limit auf dem KI-Teil.
- **Brücke:** CSV des Review-Tabs (Export aus Sheet, Re-Import nach Phase 1 + 2).

**Plattform:** Bestehendes Standalone-Apps-Script-Projekt „MC-Sanierung" (aus
Single-MC-R1). Neue Datei `sanierung-mc-multi.gs` daneben, klar getrennt von
`sanierung-mc-distraktoren.js`, damit Single-MC-Code unangetastet bleibt.
`diagnose-mc-laengste-antwort.gs` wird **erweitert** um Tell-Score-Histogramm
(`diagnoseMcMultiTellScore()`).

**Apps-Script-Files (im MC-Sanierung-Standalone-Projekt):**

| Datei | Status | Inhalt |
|---|---|---|
| `diagnose-mc-laengste-antwort.gs` | erweitert | Neue Funktion `diagnoseMcMultiTellScore()` — Histogramm-Ausgabe. Bestehende Funktionen unverändert. |
| `sanierung-mc-multi.gs` | neu | `phase0_planung()`, `phase3_rueckschreiben()`, Helfer (`exportiereRoteZoneCSV_`, `importiereDistraktorenNeu_`, `importiereCheckerErgebnis_`, `verifiziereLaengenband_`, `finalisiereReviewStatus_`). `DRY_RUN = true` als Default. `run*`-Wrapper-Funktionen für Dropdown-Sichtbarkeit. |
| `apps-script-code.js` (Backend) | minimal erweitert | Multi-MC-Hinweis-Zeile im bestehenden `generiereOptionen`/`generiereDistraktoren`-Prompt-Constraint. Wird ins **produktive Backend** deployed (analog Single-MC-Teil-A). |

### Vier Phasen

| Phase | Wer | Tut |
|---|---|---|
| 0 — Diagnose+Planung | Apps-Script: `diagnoseMcMultiTellScore()` + `phase0_planung()` | Histogramm-Ausgabe, LP wählt Schwelle, Review-Tab anlegen + befüllen, `in_roter_zone`-Flag + `soll_laenge` setzen. |
| — Export | LP | Lädt `MC-Sanierung-Multi-Review`-Tab als CSV (Datei → Herunterladen → CSV). |
| 1 — Generierung | **Claude Code** | Pro „rote" Frage neue Distraktoren generieren mit Soll-Länge ≈ Ø-Korrekt der Frage (±20 %). Subagenten in Batches à ~10 Fragen. |
| 2 — Checker | **Claude Code** | Frische Subagenten prüfen Plausibilität, ohne Phase-1-Kontext. Batches à ~5 Fragen. Status: OK / FLAG / STICHPROBE (11 % der OK zufällig). |
| — Import | LP | Importiert die gefüllte CSV zurück (Datei → Importieren → aktuelles Blatt ersetzen, Ziel `MC-Sanierung-Multi-Review`). |
| — LP-Review-Gate | LP im Sheet | Reviewt FLAG- und STICHPROBE-Zeilen, setzt `review_status`. Eskalations-Regel: ≥ 2 echte Korrektheits-Fehler in der Stichprobe → Voll-Review aller OK. |
| 3 — Rückschreiben | Apps-Script `phase3_rueckschreiben()` | Schreibt nur Zeilen mit `review_status = 'freigegeben'` zurück in `typDaten.optionen`. Idempotent über `geschrieben_am`. |
| — Schluss-Diagnose | Apps-Script | `diagnoseMcMultiLaenge()` + `diagnoseMcMultiTellScore()` Re-Run → Befund UNAUFFÄLLIG bestätigen. |

---

## Phase 0 — Diagnose + Planung

### 0a) `diagnoseMcMultiTellScore()` — Tell-Score-Histogramm

Neue Funktion in `diagnose-mc-laengste-antwort.gs`. Iteriert über alle 238 Multi-MC
und berechnet pro Frage:

- `korrekt_avg_len = Ø textLaenge_(opt.text) für opt mit opt.korrekt`
- `distraktor_avg_len = Ø textLaenge_(opt.text) für opt mit !opt.korrekt`
- `tell_score = (korrekt_avg − distraktor_avg) / korrekt_avg`
  - Bereich: −∞ bis +1. `0` = Längen ausgeglichen. `> 0` = korrekte länger.
  - Bei `korrekt_avg === 0` (Edge-Case): tell_score = `0`, Frage wird geloggt.
- `perfektes_ranking = (min(korrekt_laengen) > max(distraktor_laengen))`

**Logger-Ausgabe:**

```
=== Multi-MC Tell-Score-Histogramm ===
Total Multi-MC: 238
score < 0.0   :  XX (XX.X%)   ← Distraktor schon länger, kein Problem
0.0 – 0.10   :  XX (XX.X%)
0.10 – 0.20  :  XX (XX.X%)
0.20 – 0.30  :  XX (XX.X%)
0.30 – 0.40  :  XX (XX.X%)
0.40 – 0.50  :  XX (XX.X%)
0.50 +       :  XX (XX.X%)
Perfektes Ranking: XX Fragen (XX.X%)
Top-20 Tells (Frage-ID, score, fachbereich):
  abc123  0.78  BWL
  …
```

### 0b) `phase0_planung()` — Review-Tab anlegen

**Konstanten am Skript-Anfang (LP-konfigurierbar):**

```js
var SCHWELLE_TELL_SCORE = 0.30;            // saniere wenn score > SCHWELLE
var SANIERE_PERFEKTES_RANKING_IMMER = true; // perfektes Ranking immer sanieren, unabhängig von Schwelle
var SOLL_LAENGE_TOLERANZ = 0.20;            // ±20 % Längen-Band für neue Distraktoren
```

**Ablauf:**

1. Iteriert über alle 238 Multi-MC, berechnet `tell_score`, `perfektes_ranking`,
   `soll_laenge = round(korrekt_avg_len)`.
2. Setzt `in_roter_zone = (tell_score > SCHWELLE_TELL_SCORE) || (perfektes_ranking && SANIERE_PERFEKTES_RANKING_IMMER)`.
3. Legt den Tab `MC-Sanierung-Multi-Review` an (oder leert ihn bei Wiederholungs-Lauf).
4. Schreibt eine Zeile pro Frage mit allen Spalten (siehe Daten-Modell unten).
5. Loggt Zähler: rote Zone = N, davon X mit perfektem Ranking, Y nur via Tell-Score.

**Idempotenz:** Phase 0 ist beliebig oft wiederholbar — LP kann Schwelle anpassen
und Phase 0 erneut laufen. Bei Wiederholung wird der Tab komplett neu geschrieben
(nicht inkrementell), sofern keine `distraktoren_neu_json`-Inhalte oder
`review_status`-Werte vorhanden sind. Falls doch, bricht Phase 0 hart ab und
verlangt manuelle Tab-Löschung — Schutz gegen versehentliches Überschreiben von
LP-Arbeit.

### Daten-Modell — Review-Tab

| Spalte | Quelle | Zweck |
|---|---|---|
| `id` | Frage | Match-Key zum Rückschreiben |
| `fachbereich` | Frage | Filter/Sortierung (BWL/VWL/Recht/Informatik) |
| `frage_text` | Frage | Für Generator-Prompt + LP-Sichtprüfung |
| `optionen_alt_json` | Frage | Snapshot vor Sanierung (Audit + Rückschreib-Source) |
| `korrekt_avg_len` | Phase 0 | Ø-Zeichenlänge korrekte Optionen |
| `distraktor_avg_len` | Phase 0 | Ø-Zeichenlänge Distraktoren |
| `tell_score` | Phase 0 | `(korrekt_avg − distraktor_avg) / korrekt_avg` |
| `perfektes_ranking` | Phase 0 | `true` wenn `min(korrekt) > max(distraktor)` |
| `in_roter_zone` | Phase 0 | `true` wenn Frage saniert werden soll |
| `soll_laenge` | Phase 0 | Längen-Ziel pro neuem Distraktor (= `korrekt_avg_len`, gerundet) |
| `distraktoren_neu_json` | Phase 1 | Neue Distraktoren-Texte (JSON-Array, Reihenfolge wie alt-Distraktoren) |
| `checker_status` | Phase 2 | `OK` / `FLAG` / `STICHPROBE` |
| `checker_kommentar` | Phase 2 | Begründung bei FLAG |
| `checker_detail_json` | Phase 2 | Pro-Distraktor-Status für Forensik |
| `review_status` | LP | `freigegeben` / `nachbearbeitet` / `abgelehnt` |
| `lp_kommentar` | LP | optional |
| `geschrieben_am` | Phase 3 | ISO-Timestamp; nicht-leer = bereits geschrieben (Idempotenz) |
| `phase3_status` | Phase 3 | `geschrieben` / `error: <reason>` |

---

## Phase 1 — Distraktor-Regenerierung (Claude Code)

**Brücke Apps-Script ↔ Claude Code:**

1. Helper `exportiereRoteZoneCSV_()` ist eine Doku-Hilfe — er gibt LP die Anleitung
   im Logger aus (Datei → Herunterladen → CSV; nur Zeilen mit
   `in_roter_zone === true` benötigt). LP exportiert manuell.
2. LP legt CSV unter `~/Downloads/mc-multi-sanierung/MC-Multi-Review-export.csv` ab.
3. Claude-Code-Session arbeitet die CSV ab.
4. LP importiert die fertige CSV zurück ins Sheet (komplett, nicht nur rote-Zone —
   damit alle 238 Zeilen ihren ursprünglichen Stand behalten).

**Arbeitsverzeichnis-Struktur** (analog `~/Downloads/mc-sanierung-r5/`):

```
~/Downloads/mc-multi-sanierung/
├── MC-Multi-Review-export.csv     ← LP-Export
├── batches/                       ← Phase 1
│   ├── batch-01.csv
│   └── …
├── out/                           ← Phase 1 Output
│   ├── batch-01.json
│   └── …
├── checker-batches/               ← Phase 2
├── checker-out/                   ← Phase 2 Output
├── agent-prompt-template.md       ← Phase 1 Prompt
├── agent-checker-template.md      ← Phase 2 Prompt
├── split.js                       ← Phase 1 Batching
├── split-checker.js               ← Phase 2 Batching (kleinere Batches)
├── merge.js                       ← Phase 1 → Re-Import-CSV
├── merge-checker.js               ← Phase 2 → Re-Import-CSV
└── STATE.md                       ← Fortschritts-Tracker (für neue Sessions)
```

**Wiederverwendung:** `split.js`, `merge.js`, `split-checker.js`, `merge-checker.js`
können 1:1 (oder mit minimalen Spalten-Anpassungen) aus dem `mc-sanierung-r5`-Setup
kopiert werden.

### Generator-Prompt (`agent-prompt-template.md`, Kern)

```
Du bekommst eine Multi-Choice-MC-Frage mit 4 Optionen, davon sind 2 oder 3 korrekt.
Deine Aufgabe: Erzeuge NEUE Distraktoren (die nicht-korrekten Optionen), die:

1. Inhaltlich plausibel falsch sind (klar verkehrt für Fachkundige,
   aber Schüler-Trick: muss plausibel klingen)
2. Eine Länge von <SOLL_LAENGE> Zeichen haben, ±20 %
   (also zwischen <SOLL_MIN> und <SOLL_MAX> Zeichen)
3. Den eingebauten Fehler explizit benennen (du formulierst aktiv eine
   FALSCHE Aussage, kein vages "irgendwie verkehrt")
4. Sprachlich + syntaktisch zu den KORREKTEN Optionen passen
   (gleicher Satzbau-Stil, gleiche Begriffs-Granularität)

KORREKTE OPTIONEN (NICHT VERÄNDERN, nur Referenz für Stil + Länge):
<korrekte_optionen_inkl_text_und_laenge>

BISHERIGE DISTRAKTOREN (ersetzen, dürfen aber als grobe Themen-Anker dienen):
<distraktoren_alt_inkl_text_und_laenge>

Output: JSON-Array mit genau <N_DISTRAKTOREN> neuen Distraktor-Strings,
in derselben Reihenfolge wie die bisherigen Distraktoren (Index-Position bleibt).
```

**Soll-Längen-Logik:**

- `SOLL_LAENGE = soll_laenge` (aus Sheet, gerundet von `korrekt_avg_len`)
- `SOLL_MIN = round(SOLL_LAENGE * 0.8)`, `SOLL_MAX = round(SOLL_LAENGE * 1.2)`
- Subagent prüft im Output die Länge jedes Distraktors. Wenn ausserhalb des Bands:
  Retry (max 2 Mal), dann mit „BEST EFFORT — ausserhalb Band"-Marker ablegen.
  Längen-Verifikation post-Phase 1 via `verifiziereLaengenband_()` in Apps-Script
  meldet diese Fälle.

**Batch-Grösse:** ~10 Fragen pro Subagent. Bei 60–100 roten Fragen: 6–10 Subagenten
parallel.

**Single-MC-Lehre angewandt:** „Agent-Prompt verlangt eingebauten, konkret
benannten Fehler" (Distraktoren drifteten sonst ins WAHRE).

---

## Phase 2 — Checker-Pass

**Setup:** Frische Subagenten, kein Phase-1-Kontext. Andere Batch-Aufteilung als
Phase 1 (kleiner: ~5 Fragen pro Subagent), damit kein Subagent zweimal dieselbe
Frage sieht.

### Checker-Prompt (`agent-checker-template.md`, Kern)

```
Du bekommst eine Multi-Choice-MC-Frage mit ihren KORREKTEN Optionen und
NEU GENERIERTEN Distraktoren. Beurteile jede neue Distraktor-Option:

Status pro Distraktor:
- OK   : klar falsch + plausibel + sprachlich passend
- FLAG : etwas stimmt nicht (zu wahr? zu unsinnig? zu uneindeutig?)

Begründe jeden FLAG mit ein-zwei Sätzen.

Frage-Status (rollup):
- Wenn ≥ 1 Distraktor FLAG → frage_status = FLAG
- Sonst: Zufalls-11 %-Stichprobe → frage_status = STICHPROBE
- Sonst: frage_status = OK

KORREKTE OPTIONEN (NICHT prüfen, nur Kontext):
<korrekte_optionen>

NEU GENERIERTE DISTRAKTOREN (das hier prüfen):
<distraktoren_neu>

Output: JSON mit { frage_status, kommentar, pro_distraktor: [{status, grund}] }
```

**Wichtige Eigenschaften (Single-MC-Lehre):**

- **Konservativ flaggen ist OK** — Single-MC hatte 21 % FLAG-Quote, ~78 % davon
  waren nach LP-Review freigegeben (Über-Flaggen). Bei Multi-MC erwarte ich
  ähnliche Quote.
- **Stichprobe ist nicht optional** — 11 % zufällige OK-Fragen werden zusätzlich
  der LP zur Verifikation gegeben (deckte bei Single-MC 5 echte Probleme auf).
- **Eskalations-Regel:** Wenn LP in der Stichprobe (~5–10 Zeilen) **≥ 2 echte
  Korrektheits-Fehler** findet → Voll-Review aller OK-Fragen, nicht nur
  FLAG+Stichprobe. Bei Single-MC wurde diese Regel pragmatisch ausgelassen
  (5/68 = 7 % Stichprobe-Fehlerquote, war Grenzfall) — LP-Entscheidung.

**Output:** CSV mit `checker_status`, `checker_kommentar`, `checker_detail_json`.

**Re-Import:** Apps-Script-Helper `importiereCheckerErgebnis_()` schreibt Status +
Kommentar ins Sheet, markiert die LP-Review-Zeilen (FLAG + STICHPROBE) farbig
(Hintergrund), damit LP sie im Sheet schnell findet.

**Geschätzter Aufwand:** Bei 60–100 roten Fragen → 12–20 Checker-Batches à 5
Fragen → 12–20 Subagenten.

---

## LP-Review-Gate (R7-analog)

Zwischen Phase 2 und Phase 3. LP arbeitet im Sheet-Tab `MC-Sanierung-Multi-Review`:

1. **FLAG-Zeilen** (geschätzt ~13–20 bei 65 in roter Zone): Distraktor inhaltlich
   prüfen.
   - `review_status = 'freigegeben'`: Distraktor akzeptabel (Checker hat über-geflaggt).
   - `review_status = 'nachbearbeitet'`: LP editiert `distraktoren_neu_json`-Text
     manuell, dann `freigegeben`.
   - `review_status = 'abgelehnt'`: Ganze Frage wird in Phase 3 übersprungen,
     bleibt unverändert im Bestand.
2. **STICHPROBE-Zeilen** (geschätzt ~7–10): genauso reviewen. Eskalations-Regel
   beachten.
3. **Fill-Down OK-nicht-Stichprobe** (geschätzt ~40–50 Zeilen): nach LP-Bestätigung
   „bin fertig" automatisch via Helper `finalisiereReviewStatus_()` auf
   `freigegeben` gesetzt.

**Aufwand-Schätzung:** ~60–90 min für ~20–30 FLAG+STICHPROBE-Zeilen.

---

## Phase 3 — Rückschreiben

`phase3_rueckschreiben()` in `sanierung-mc-multi.gs`.

**Ablauf:**

1. Liest alle Sheet-Zeilen mit `in_roter_zone === true && review_status === 'freigegeben' && geschrieben_am === ''`.
2. Pro Frage: liest **aktuelle** `typDaten.optionen` aus Fragensammlung (NICHT aus
   `optionen_alt_json` — das ist nur Audit-Snapshot; aktueller Stand könnte
   abweichen, wenn DU zwischendurch Hand angelegt hat).
3. Match-Index: für jede Distraktor-Index-Position der alten Optionen wird der
   neue Distraktor-Text aus `distraktoren_neu_json[i]` eingesetzt. Reihenfolge
   stabil — kein Re-Order.
4. Korrekte-Antwort-nie-anfassen-Invariante: `if (optionen[o].korrekt) continue;`
   (Truthy-Check, identisch zu Single-MC — gleiche Begründung).
5. Schreibt zurück: `typDaten.optionen` JSON aktualisiert. Setzt `geschrieben_am`
   auf ISO-Timestamp.
6. Loggt: N geschrieben, M übersprungen (abgelehnt + bereits geschrieben), Errors
   (falls > 0: hart abbrechen).

**Schutz:**

- `DRY_RUN = true` als Default am Skript-Anfang. Erst nach LP-Sichtprüfung der
  Trockenlauf-Logs auf `false`.
- Idempotenz über `geschrieben_am`: re-run überspringt bereits geschriebene Zeilen.
- Korrekt-Texte werden vor + nach Phase 3 byte-vergleichen (Audit-Hash optional).

---

## Schluss-Diagnose

Nach Phase 3:

1. `diagnoseMcMultiLaenge()` Re-Run → Befund **UNAUFFÄLLIG** (Aggregat < 1.15× / 65 %).
2. `diagnoseMcMultiTellScore()` Re-Run → **0 Fragen mit perfektem Ranking** (ausser
   `abgelehnt`-Fragen), Histogramm konzentriert um 0.0.
3. Smoke-Test: 5 zufällige sanierte Fragen in der App öffnen (Frageneditor),
   prüfen: 4 Optionen sichtbar, 2-3 korrekt-markiert, Distraktor-Texte sind die
   neuen.

---

## Prävention — komplementär zur Sanierung

Der KI-Prompt-Constraint aus Single-MC-Teil-A (in `apps-script-code.js`,
`generiereOptionen` + `generiereDistraktoren`) ist bereits live und gilt
implizit auch für Multi-MC. **Kleine Ergänzung:**

In den bestehenden Constraint wird ein Multi-MC-Hinweis aufgenommen, ungefähr:

> „Bei Mehrfachauswahl-Fragen (≥ 2 korrekte Optionen): achte zusätzlich darauf,
> dass die Längen-Verteilung der Distraktoren mit der Längen-Verteilung der
> korrekten Optionen vermischt — keine systematische Korrelation zwischen Länge
> und Korrektheit."

Diese Zeile ist die einzige Code-Änderung am produktiven Backend
(`apps-script-code.js`). Alles andere lebt im Standalone-MC-Sanierung-Apps-Script-Projekt.

---

## Verifikation & Werkzeuge

**Apps-Script-only — kein vitest.** Validierung:

- `node --check` auf alle neuen .js-Dateien (lokal vor Deploy ins Apps-Script-Projekt).
- `DRY_RUN`-Modus für Phase 3 (Trockenlauf-Logs prüfen).
- Helper `verifiziereLaengenband_()` post-Phase 1: meldet Distraktoren ausserhalb
  des Soll-Bands ±20 %.
- Audit pre/post Phase 3: korrekt-Texte byte-identisch (kann in Phase 3 selbst
  geprüft werden, hart-abbrechen bei Mismatch).

### Erfolgskriterien (hart)

| # | Kriterium | Mess-Methode |
|---|---|---|
| 1 | Aggregat-Verhältnis < 1.15× | `diagnoseMcMultiLaenge()` Re-Run |
| 2 | Aggregat frageProzent < 65 % | dito |
| 3 | 0 Fragen mit perfektem Ranking (modulo `abgelehnt`) | `diagnoseMcMultiTellScore()` Re-Run |
| 4 | Keine korrekte Option verändert | Audit: korrekt-Texte byte-identisch pre/post Phase 3 |
| 5 | Keine Frage strukturell beschädigt | Smoke-Test: 5 zufällige sanierte Fragen im Editor öffnen |

---

## Risiken & Gegenmassnahmen

| Risiko | Wahrscheinlichkeit | Gegenmassnahme |
|---|---|---|
| Generator-Drift: neue Distraktoren wahr/uneindeutig | mittel | Checker-Pass (Phase 2) + LP-Review-Gate. Single-MC-Lehre: Prompt verlangt konkret benannten Fehler. |
| Längen-Band nicht eingehalten | niedrig | Subagent-Retry (max 2) + `verifiziereLaengenband_()` post-Phase 1 |
| Schwellen-Wahl falsch | mittel | Histogramm-Inspect vor Phase 0; Phase 0 ist idempotent (LP kann iterieren) |
| Fragensammlung drift während Sanierung (DU ändert parallel) | niedrig | Phase 3 liest aktuelle Optionen, ersetzt nur Distraktor-Indices. LP-Hinweis: „während laufender Sanierung keine Multi-MC-Edits in BWL/VWL/Recht/Informatik" |
| Apps-Script 6-Min-Timeout in Phase 3 | niedrig | Phase 3 schreibt nur ~60–100 Zeilen → < 1 min erwartet. Falls > 5 min: PropertiesService-Resume-Pattern (aus Single-MC) |
| LP-Review-Aufwand höher als geschätzt | mittel | Konservative Schätzung 60–90 min für 20–30 Zeilen. Falls > 2 h: Schwelle anpassen + Phase 0 neu, oder Stichprobe schrumpfen |
| Wiederholungs-Lauf von Phase 0 überschreibt LP-Arbeit | niedrig | Phase 0 bricht hart ab, wenn `distraktoren_neu_json` oder `review_status` schon Inhalte hat — verlangt manuelle Tab-Löschung |

---

## Geschätzter Aufwand (Ende-zu-Ende)

| Phase | DU-Aufwand | Subagenten |
|---|---|---|
| 0 (Diagnose + Planung + Schwelle wählen) | 20 min | — |
| 1 (Generierung) | 30 min (CSV-Export, Batch-Start, CSV-Import) | 6–10 × ~5 min |
| 2 (Checker) | 20 min (Batch-Start, CSV-Import) | 12–20 × ~3 min |
| LP-Review-Gate | 60–90 min | — |
| 3 (Rückschreiben + Schluss-Diagnose) | 15 min | — |
| **Total** | **~2.5–3 h LP-Arbeit** | 20–30 Subagenten-Runs |

---

## Explizit verworfen

- **Volle Sanierung aller 238 Multi-MC** (statt nur „rote Zone"): Aufwand
  ~3× höher, marginaler Zugewinn (Aggregat würde bei < 1.10× landen statt < 1.15×).
  Pareto-Suboptimal.
- **Aufblähen ohne Inhalts-Ersatz** (bestehende Distraktoren um Phrasen
  ergänzen): inhaltliche Drift-Risiko + Plausibilitätsverlust („… in der Schweiz"
  als Füllwort wirkt zwangsläufig künstlich). Nicht-Reusable-Pipeline.
- **2-Phasen-Topologie** (Generierung+Checker zusammen in einem Pass): Confirmation
  Bias — gleicher Agent generiert und prüft. Single-MC-Lehre: Checker mit
  frischem Kontext fängt Drift.
- **4-Klassen-Rang-Schema wie Single-MC** (`ziel_rang` 1–4): Multi-MC braucht
  keine Rang-Verteilung, sondern nur Längen-Überlappung. Ein Soll-Wert pro
  Distraktor genügt.
- **Vitest-Tests für Phase-0-/Phase-3-Helfer**: Apps-Script läuft nicht in
  vitest. Verifikation über `node --check` + DRY_RUN + Re-Diagnose. Identisch
  zum Single-MC-Setup.
- **Multi-MC mit-sanieren in der Single-MC-Pipeline** (`sanierung-mc-distraktoren.js`
  erweitern statt neue Datei): Single-MC ist abgeschlossen und auf `main`.
  Erweitern würde diesen Code anfassen ohne Bestand-Sanierungs-Aufgabe — Risiko
  versehentlicher Drift. Neue, klar getrennte Datei = saubere Trennung der
  Cluster.

---

## Offene Punkte für Plan-Phase

- Tell-Score-Schwelle (`SCHWELLE_TELL_SCORE`): Default 0.30, finale Wahl erfolgt
  nach Phase-0a-Histogramm-Inspect durch LP.
- Aufteilung der Phase-1-Batches: pro Subagent ~10 Fragen, oder pro Fachbereich
  (BWL/VWL/Recht/Informatik separat)? Plan-Phase klärt.
- Helper-Naming-Konventionen (`_`-Suffix für „im Dropdown ausgeblendet" — analog
  Single-MC).
