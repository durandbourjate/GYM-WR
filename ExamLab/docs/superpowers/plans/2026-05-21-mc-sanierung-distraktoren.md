# MC-Sanierung: Distraktoren-Längen-Tell — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement Teil A. Teil B ist ein LP-geführter operativer Ablauf (kein Subagent). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Distraktoren-Längen-Tell in den ~759 auffälligen Single-MC-Fragen der Fragensammlung beseitigen — sodass die Länge einer Antwortoption nicht mehr verrät, ob sie korrekt ist.

**Architecture:** Apps-Script macht die deterministische Sheet-Mechanik (Phase 0: Ziel-Ränge planen + Review-Sheet bauen; Phase 3: freigegebene Distraktoren zurückschreiben). Claude Code (Abo) macht die KI-Arbeit (Phase 1: Distraktoren generieren; Phase 2: unabhängiger Checker). Eine CSV des `MC-Sanierung-Review`-Tabs ist die Brücke zwischen beiden.

**Tech Stack:** Google Apps Script (V8-Runtime, reines JS), Google Sheets, Claude Code (Abo — keine Anthropic-API). Verifikation: `node --check`, `DRY_RUN`, Logger-Ausgabe, das Review-Sheet als inspizierbares Artefakt, der Diagnose-Re-Run.

> **Revision 2026-05-22:** Bestand-Sanierung (Phase 1+2) von der Anthropic-API auf Claude Code (Abo) umgestellt. Diese Plan-Version ersetzt die frühere API-Pipeline-Version. Zugehörige Spec: `2026-05-21-mc-sanierung-distraktoren-design.md` (Revision 2026-05-22).

---

## Ausgangslage — was schon existiert

Teil A wurde in einer früheren Session auf Branch `feature/mc-sanierung-spec` umgesetzt (Commits `a9e5fea`..`46b2b34`) — aber nach dem **alten API-Design**. Diese Revision korrigiert das:

| Datei | Stand | Diese Revision |
|---|---|---|
| `apps-script-code.js` (KI-Prompt-Constraint) | ✅ umgesetzt (`a9e5fea`) | bleibt gültig — Prävention ist API-unabhängig (Task A1: nur verifizieren) |
| `diagnose-mc-laengste-antwort.js` (`diagnoseMcMultiLaenge()`) | ✅ umgesetzt (`1aadc1d`) | bleibt gültig (Task A2: nur verifizieren) |
| `sanierung-mc-distraktoren.js` | ⚠️ liegt im alten API-Design vor (Phase 1+2 als Apps-Script-Claude-Calls, `rufeClaudeAuf_`, `CLAUDE_API_KEY`) | **muss zurückgebaut werden** — Task A3 |

## Wichtig: Warum kein klassisches TDD

Teil A fasst ausschliesslich Apps-Script-Code an — kein `vitest`, kein `tsc -b`, kein Build. Verifikation: `node --check` (Syntax-Gate; undefinierte GAS-Globals sind kein Syntaxfehler) + struktureller Soll/Ist-Abgleich der Funktionsliste. Teil B (Phase-1/2-Generierung + operativer Runbook) wird über `DRY_RUN`, Logger-Ausgabe, das Review-Sheet und den Diagnose-Re-Run verifiziert.

## File Structure

| Datei | Verantwortung nach dieser Revision |
|---|---|
| `ExamLab/scripts/sanierung-mc-distraktoren.js` | Apps-Script: **nur** Phase 0 (Planung) + Phase 3 (Rückschreiben) + geteilte Helfer. Kein KI-Code. |
| `ExamLab/scripts/diagnose-mc-laengste-antwort.js` | Apps-Script: Single-MC- + Multi-MC-Längen-Diagnose. Unverändert. |
| `ExamLab/apps-script-code.js` | Längen-Constraint im KI-Optionen-Generator. Unverändert ggü. `a9e5fea`. |
| Review-CSV | Transiente Arbeitsdatei (Export/Import-Brücke). Gitignored, kein Repo-File. |

---

# TEIL A — Code (Subagent-ausführbar)

## Task A1: KI-Prompt-Constraint verifizieren

**Files:**
- Verify: `ExamLab/apps-script-code.js` (`case 'generiereOptionen'` ~Z. 7357, `case 'generiereDistraktoren'` ~Z. 7366)

- [ ] **Step 1: Constraint in beiden Zweigen prüfen**

`apps-script-code.js` öffnen, `case 'generiereOptionen'` UND `case 'generiereDistraktoren'` suchen. Beide Prompts MÜSSEN sinngemäss enthalten: «Alle Optionen etwa gleich lang (Zeichenzahl + Detailtiefe); Distraktoren mit derselben Vollständigkeit/Präzision wie die korrekte Antwort; die korrekte Antwort darf sich nicht durch Länge abheben — weder zuverlässig die längste noch die kürzeste.» Sie dürfen **nicht** «mach die korrekte kürzer» instruieren (erzeugt das inverse Muster).

- [ ] **Step 2: Bei Bedarf nachbessern**

Fehlt der Constraint in einem Zweig oder ist er invers formuliert → gemäss Spec §Rückfall-Prävention ergänzen. Ist alles korrekt → Task ohne Änderung abschliessen.

- [ ] **Step 3: Commit (nur falls Step 2 etwas geändert hat)**

```bash
git add ExamLab/apps-script-code.js
git commit -m "fix(sanierung): Längen-Constraint im MC-Optionen-Generator nachgeschärft"
```

## Task A2: diagnoseMcMultiLaenge() verifizieren

**Files:**
- Verify: `ExamLab/scripts/diagnose-mc-laengste-antwort.js`

- [ ] **Step 1: Funktion prüfen**

Datei öffnen, `diagnoseMcMultiLaenge()` suchen. Sie MUSS die Multi-Choice-MC (`mehrfachauswahl:true`) auf den Längen-Tell prüfen: Ø-Länge korrekter Optionen vs. Ø-Länge falscher Optionen, Befund AUFFÄLLIG/UNAUFFÄLLIG. `textLaenge_` muss identisch zu `sanierung-mc-distraktoren.js` sein (`String(text||'').trim().length`).

- [ ] **Step 2: node --check**

```bash
node --check ExamLab/scripts/diagnose-mc-laengste-antwort.js
```
Expected: kein Output (Syntax ok).

- [ ] **Step 3: Kein Commit nötig** — die Funktion ist bereits committet (`1aadc1d`). Nur falls Step 1 eine Korrektur erforderte, committen.

## Task A3: sanierung-mc-distraktoren.js auf Phase 0 + 3 zurückbauen

Der KI-Teil (Phase 1+2) wird aus dem Apps-Script entfernt — er läuft neu in Claude Code (Teil B). Phase 0, Phase 3 und die von ihnen genutzten Helfer bleiben **unverändert**.

**Files:**
- Modify: `ExamLab/scripts/sanierung-mc-distraktoren.js`

- [ ] **Step 1: Datei lesen + Soll/Ist abgleichen**

Vollständig lesen. Diese Funktionen/Konstanten **ENTFERNEN** (alle gehören zu Phase 1/2 oder zum API-Aufruf):
- Konstanten: `STICHPROBE_ANTEIL`, `CURSOR_P1`, `CURSOR_P2`
- `SANIERUNG_SYSTEM_PROMPT` + `rufeClaudeAuf_()` (der ganze «Claude-Aufruf»-Block)
- `phase1_generierung()`, `berechneZielLaengen_()`, `rangAusLaengen_()`, `generiereDistraktoren_()`
- `phase2_checker()`, `pruefeDistraktoren_()`
- Helfer `wrapUserData_()` und `pseudoZufall_()` — werden nur von Phase 1/2 genutzt, danach tot

Diese **BEHALTEN** (unverändert): `DRY_RUN`, `SANIERUNG_FRAGENSAMMLUNG_ID`, `SANIERUNG_TABS`, `REVIEW_TAB`, `MAX_DISTRAKTOREN`, `ZEIT_BUDGET_MS`, `CURSOR_P3`, `reviewHeaders_()`, `rcol_()`, `textLaenge_()`, `sicherJsonParse_()`, `leseMcOptionen_()`, `cursorLesen_/Schreiben/Loeschen_()`, `phase0_planung()`, `berechneRangPlan_()`, `phase3_rueckschreiben()`, `baueFrageIndex_()`, `schreibeDistraktorenZurueck_()`.

- [ ] **Step 2: Die genannten Blöcke entfernen**

Die zu entfernenden Funktionen liegen grösstenteils zusammenhängend (der «Claude-Aufruf»-Block; dann der durchgehende Block `phase1_generierung` … `pruefeDistraktoren_`). `wrapUserData_`/`pseudoZufall_` stehen im «Geteilte Helfer»-Block. Nach dem Entfernen darf keine entfernte Funktion mehr referenziert werden.

- [ ] **Step 3: Header-Docstring neu schreiben**

Den Datei-Kommentar (Z. 1–15) ersetzen — keine «4-Phasen-Pipeline», kein `CLAUDE_API_KEY` mehr:

```js
/**
 * SANIERUNG: MC-Distraktoren-Längen-Tell — Apps-Script-Teil (Phase 0 + 3).
 *
 * Phase 0 (phase0_planung) plant die Ziel-Ränge und baut den Review-Tab.
 * Phase 1+2 (Distraktoren generieren + prüfen) laufen in Claude Code — siehe
 * Plan TEIL B. Phase 3 (phase3_rueckschreiben) schreibt die freigegebenen
 * Distraktoren zurück.
 *
 * In ein eigenständiges Apps-Script-Projekt kopieren, Phasen einzeln ausführen.
 * VORAUSSETZUNG: Backup der Fragensammlung-Tabelle (Datei → Kopie erstellen).
 * SICHERHEIT: DRY_RUN ist DEFAULT (true) — schützt Phase 3. Auf false setzen
 * für echtes Rückschreiben.
 * Spec: ExamLab/docs/superpowers/specs/2026-05-21-mc-sanierung-distraktoren-design.md
 */
```

- [ ] **Step 4: node --check**

```bash
node --check ExamLab/scripts/sanierung-mc-distraktoren.js
```
Expected: kein Output.

- [ ] **Step 5: Struktur-Verifikation**

```bash
grep -nE "^function |^var [A-Z]" ExamLab/scripts/sanierung-mc-distraktoren.js
```
Expected: `phase1_generierung`, `phase2_checker`, `rufeClaudeAuf_`, `generiereDistraktoren_`, `pruefeDistraktoren_`, `berechneZielLaengen_`, `rangAusLaengen_`, `wrapUserData_`, `pseudoZufall_` kommen NICHT mehr vor; `phase0_planung`, `phase3_rueckschreiben`, `reviewHeaders_`, `berechneRangPlan_`, `baueFrageIndex_`, `schreibeDistraktorenZurueck_` sind weiterhin da.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/scripts/sanierung-mc-distraktoren.js
git commit -m "refactor(sanierung): Phase 1+2 aus Apps-Script entfernt — KI-Arbeit in Claude Code"
```

---

# TEIL B — Operativer Ablauf (LP + Claude Code)

Diese Schritte laufen nicht als Subagent. Der LP arbeitet im Apps-Script-Editor + Google-Account; die KI-Generierung (Phase 1/2) macht eine Claude-Code-Session. Reihenfolge: R1 → R2 → R3 → R4 (Phase 0) → R5 (Phase 1) → R6 (Phase 2) → R7 (Review-Gate) → R8 (Phase 3).

## Die Review-CSV — Spalten-Vertrag

Phase 0 baut den `MC-Sanierung-Review`-Tab mit exakt diesen Spalten (aus `reviewHeaders_()`); die CSV trägt sie als Kopfzeile:

```
id, tab, quell_zeile, fragetext, korrekt_text, korrekt_len, anzahl_distraktoren,
ziel_rang, distraktor_alt_1..5, distraktor_neu_1..5, neu_len_1..5, ist_rang,
stichprobe, checker_status, checker_begruendung, review_status, geschrieben_am
```

Phase 0 füllt alles bis `distraktor_alt_*`. Claude Code füllt `distraktor_neu_1..N`, `neu_len_1..N`, `ist_rang` (Phase 1) sowie `stichprobe`, `checker_status`, `checker_begruendung` (Phase 2). `N` = `anzahl_distraktoren` der Zeile. Der LP füllt `review_status`; Phase 3 setzt `geschrieben_am`.

## Phase 1+2 — die Claude-Code-Prozedur

Die MC-Sanierungs-Session liest die exportierte CSV und verarbeitet jede Daten-Zeile. **Die ~759 Zeilen in Batches über parallele Subagenten** (superpowers:dispatching-parallel-agents) — jeder Subagent ein Batch.

**Phase 1 — Generierung, pro Zeile:**
1. Lies `fragetext`, `korrekt_text`, `korrekt_len`, `anzahl_distraktoren` (N), `ziel_rang` (r), `distraktor_alt_1..N`.
2. Ziel-Längen ableiten: `(r − 1)` Distraktoren **länger** als `korrekt_len` (Faktor ~1.08–1.40×), die restlichen `N − (r − 1)` **kürzer** (~0.72–0.96×), Minimum 12 Zeichen. Pro Distraktor etwas Jitter, damit die Längen kein perfektes Muster bilden.
3. N neue Distraktoren generieren — jeder: (a) inhaltlich **eindeutig falsch**; (b) fachlich plausibler Ablenker, kein Füllwort-Geschwafel; (c) trifft die Ziel-Länge ±15 % durch mehr Vollständigkeit/Präzision, nicht Padding; (d) wiederholt weder die korrekte Antwort noch einen anderen Distraktor.
4. Schreibe `distraktor_neu_1..N`; `neu_len_k` = `String(text).trim().length`; `ist_rang` = 1 + Anzahl `neu_len > korrekt_len`.

**Phase 2 — Checker, pro Zeile (eigener, frischer Subagent — kein geteilter Generierungs-Kontext):**
1. Eingabe: `fragetext`, `korrekt_text`, die N `distraktor_neu_*`. Pro Distraktor prüfen: eindeutig falsch? plausibel (kein Geschwafel/Unsinn)? keine Verdoppelung? **Konservativ** — im Zweifel FLAG.
2. `checker_status` = `OK`/`FLAG`, `checker_begruendung` setzen.
3. Technische Zusatz-Flags (ohne KI): `ist_rang ≠ ziel_rang` → FLAG; ein `distraktor_neu` identisch mit `korrekt_text` → FLAG. Begründung anfügen.
4. `stichprobe` = `JA` für ~12 % der `OK`-Zeilen, deterministisch (z. B. FNV-1a-Hash von `'stichprobe#'+id` < 0.12) — reproduzierbar.

## Runbook R1–R8

### R1 — Vorbereitung
- [ ] **Backup:** Fragensammlung-Tabelle → Datei → Kopie erstellen.
- [ ] Neues eigenständiges Apps-Script-Projekt anlegen (script.google.com).
- [ ] `sanierung-mc-distraktoren.js` (Stand nach Task A3) und `diagnose-mc-laengste-antwort.js` in das Projekt kopieren.
- [ ] **Kein** `CLAUDE_API_KEY` mehr nötig.

### R2 — KI-Prompt-Constraint deployen + abnehmen
- [ ] `apps-script-code.js` (mit dem Constraint) ins Web-App-Projekt übernehmen, **neue Bereitstellung** erstellen (alte Nr. notieren).
- [ ] Abnahme: ~30–50 MC-Fragen über den KI-Assistenten generieren; Verteilung «korrekt = längste» grob ~25 %, nicht ~74 %. Bei Auffälligkeit Prompt nachschärfen.

### R3 — Multi-MC-Analyse
- [ ] `diagnoseMcMultiLaenge()` ausführen → Protokolle lesen, Befund notieren. AUFFÄLLIG → eigenes Folge-Projekt aufsetzen. UNAUFFÄLLIG → dokumentiert abgeschlossen.

### R4 — Phase 0 (Apps-Script)
- [ ] `phase0_planung()` ausführen (bei «Zeitbudget» erneut bis fertig — Cursor-resumable).
- [ ] Log: projizierte Schluss-Verteilung je Rang ~25 % prüfen. Grobe Abweichung → NICHT fortfahren, Rang-Plan-Logik prüfen.
- [ ] «Übersprungen (>5 Distraktoren)» sollte ~0 sein.
- [ ] Review-Tab `MC-Sanierung-Review` kontrollieren (Zeilen da, `distraktor_alt_*` gefüllt).

### R5 — Phase 1 (Claude Code)
- [ ] Review-Tab als CSV herunterladen (Datei → Herunterladen → CSV).
- [ ] Claude-Code-Session: «MC-Sanierung Phase 1» — CSV übergeben, Generierungs-Prozedur (oben) laufen lassen.
- [ ] Stichprobenartig `distraktor_neu_*` + `neu_len_*` + `ist_rang` in der Ergebnis-CSV kontrollieren.

### R6 — Phase 2 (Claude Code)
- [ ] Den Checker-Pass (oben) laufen lassen — frische Subagenten.
- [ ] Gefüllte CSV zurück ins Sheet importieren (Datei → Importieren → aktuelles Blatt ersetzen, Ziel `MC-Sanierung-Review`).
- [ ] Anzahl `FLAG`- und `stichprobe=JA`-Zeilen grob sichten.

### R7 — Review-Gate (LP)
- [ ] **Alle `checker_status=FLAG`-Zeilen** prüfen → `review_status`: `freigegeben` / `abgelehnt` / `nachbearbeitet` (Vorschlag in `distraktor_neu_*` korrigieren).
- [ ] **Alle `stichprobe=JA`-Zeilen** prüfen → `review_status` setzen.
- [ ] **Eskalation:** echter Korrektheits-Fehler in der Stichprobe → **alle `OK`-Zeilen** voll reviewen.
- [ ] Stichprobe sauber → übrige `OK`-Zeilen gebündelt auf `freigegeben` (Fill-Down).

### R8 — Phase 3 + Schluss-Verifikation (Apps-Script)
- [ ] `phase3_rueckschreiben()` mit `DRY_RUN=true` → Log «WÜRDE schreiben: N».
- [ ] `DRY_RUN` auf `false` → `phase3_rueckschreiben()` ausführen (bei «Zeitbudget» erneut bis fertig).
- [ ] `diagnoseMcLaengsteAntwort()` erneut → Befund «UNAUFFÄLLIG» erwartet (`laengsteProzent` und `kuerzesteProzent` je ≤ ~1,2× Zufallserwartung).
- [ ] **abgelehnt-Schleife:** Re-Run nicht UNAUFFÄLLIG + viele `abgelehnt` → für diese Zeilen `distraktor_neu_*`, `neu_len_*`, `ist_rang`, `checker_*`, `review_status` leeren, Phase 1–2 für die Teilmenge wiederholen.

---

## Abschluss

Wenn R8 «UNAUFFÄLLIG» liefert und R2/R3 abgeschlossen sind, ist die Sanierung fertig. `HANDOFF.md` aktualisieren. Branch `feature/mc-sanierung-spec` nach LP-Freigabe nach `main` mergen.
