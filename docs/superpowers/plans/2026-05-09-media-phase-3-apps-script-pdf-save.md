# Media-Phase 3 — Apps-Script SAVE für PDF Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apps-Script `typenSpezifischeFelder` PDF-case akzeptiert + persistiert `frage.pdf` (MediaQuelle) zusätzlich zu den 4 Alt-Feldern. Frontend bleibt unverändert. Voraussetzung für Phase 4.b (PDF-Editor schreibt `frage.pdf`).

**Architecture:** Eine einzige Code-Zeile in `ExamLab/apps-script-code.js` Z. 4559-4562 (innerhalb `case 'pdf':` von `typenSpezifischeFelder`): ergänze `pdf: frage.pdf` zum return-Object, analog zu wie Bild bereits Z. 4580+ funktioniert. Apps-Script-Deploy ist manueller User-Workflow nach Frontend-Merge.

**Tech Stack:** Google Apps Script (JavaScript V8, Script-Editor im Browser), git Branch + manueller Deploy-Workflow.

**Spec:** [`docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md`](../specs/2026-05-09-media-phase-3-5-dual-write-design.md) Section 3.

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree:** `.worktrees/media-phase-3` (zu erstellen in Phase 0)

**Branch:** `media-phase-3/apps-script-pdf-save` (von `main` abzweigen — die Spec liegt aktuell auf `spec/media-phase-3-5`, beide Branches kommen unabhängig zurück nach main)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output direkt prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`).

**Vitest-Baseline:** `1514 passed | 4 todo | 1 skipped` (Stand main `0cd3382`). Drift-Erwartung: **0** (keine Frontend-Änderungen).

---

## File Map

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/apps-script-code.js` | (kein Z.-Tracking, ist data) | +1 Z. (~1 net) | Z. 4559-4562 (`case 'pdf':` von `typenSpezifischeFelder`): ergänze `pdf: frage.pdf,` als neue Property in return-Object |

### Neue Files

Keine.

### Reihenfolge

1. **Phase 0**: Worktree + Branch erstellen, Spec-Sync prüfen, Pre-Edit-Verifikation der Apps-Script-Code-Stelle
2. **Phase 1**: Apps-Script-Code-Edit + lokale Verifikation (tsc/lint/build/vitest unverändert)
3. **Phase 2**: Commit + PR/Merge auf main
4. **Phase 3**: User-Aufgabe — Apps-Script-Deploy + Browser-E2E-Verifikation (mit Anleitung)
5. **Phase 4**: HANDOFF-Update + Cleanup

---

## Phase 0: Worktree + Baseline

### Task 0.1: Worktree erstellen + Branch initialisieren

- [ ] **Step 1: Sicherstellen dass main aktuell ist**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin main
git checkout main
git pull --ff-only origin main
git log --oneline -3
```

Expected: `0cd3382 HANDOFF: SchuelerZeile-Orphan-Cleanup ...` (oder neuere) als HEAD von `main`.

- [ ] **Step 2: Branch vom main erstellen + Worktree**

```bash
git branch media-phase-3/apps-script-pdf-save main
git worktree add .worktrees/media-phase-3 media-phase-3/apps-script-pdf-save
cd .worktrees/media-phase-3
git status
```

Expected: `On branch media-phase-3/apps-script-pdf-save`, working tree clean, HEAD = main.

### Task 0.2: Pre-Edit-Verifikation der Code-Stelle

- [ ] **Step 1: Aktuelles PDF-Case in typenSpezifischeFelder prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/media-phase-3"
sed -n '4555,4595p' ExamLab/apps-script-code.js
```

Expected output (gekürzt) zeigt:

```js
function typenSpezifischeFelder(frage) {
  switch (frage.typ) {
    ...
    case 'pdf':
      return {
        pdfDriveFileId: frage.pdfDriveFileId,
        pdfUrl: frage.pdfUrl,
        pdfBase64: frage.pdfBase64,
        pdfDateiname: frage.pdfDateiname,
        seitenAnzahl: frage.seitenAnzahl,
        kategorien: frage.kategorien,
        erlaubteWerkzeuge: frage.erlaubteWerkzeuge,
        ...
      };
    ...
    case 'hotspot':
      return { bildUrl: frage.bildUrl, bildDriveFileId: frage.bildDriveFileId, bild: frage.bild, bereiche: ..., mehrfachauswahl: ... };
```

Falls die exakten Zeilennummern abweichen (Apps-Script-Code-Datei wird häufig geändert): finden via `grep -n "case 'pdf':" ExamLab/apps-script-code.js` — die nächste Zeile danach ist `return {` und einige Zeilen später kommen die `pdf*`-Felder.

- [ ] **Step 2: Bild-Vergleichsstelle prüfen (Z. 4580+ analog)**

```bash
grep -n "bild: frage.bild" ExamLab/apps-script-code.js
```

Expected: 3 Treffer (`hotspot`, `bildbeschriftung`, `dragdrop_bild` — alle 3 schreiben schon `bild: frage.bild` mit). Diese Stellen sind das Vorbild für unsere PDF-Änderung.

- [ ] **Step 3: parseFrage PDF-Case bestätigen (READ-Pfad)**

```bash
grep -n "pdf: typDaten.pdf" ExamLab/apps-script-code.js
```

Expected: 1 Treffer — `parseFrage` Z. ~3023, liest `pdf: typDaten.pdf || undefined` schon. **Bedeutet:** sobald Apps-Script SAVE das `pdf`-Feld schreibt, kann READ es direkt zurückliefern (keine zusätzliche READ-Änderung nötig).

- [ ] **Step 4: Vitest-Baseline einmal laufen lassen (no-op-Verifikation)**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -8
```

Expected: `Tests  1514 passed | 4 todo (1518)`. Diese Zahl muss am Ende der Phase 1 unverändert bleiben (Drift = 0).

---

## Phase 1: Apps-Script-Code-Edit

### Task 1.1: PDF-Case ergänzen

> **Spec 3.2 Optional Defensive Console.log bewusst weggelassen:** Spec erwähnt optional `console.log` wenn payload sowohl `pdf` als auch `pdfXxx`-Alt-Felder enthält (Debug-Hilfe). Hier minimal gehalten — Add-on jederzeit nachträglich möglich falls im Phase-4.b-Test gewünscht.

- [ ] **Step 1: Edit ausführen — `pdf: frage.pdf` zum PDF-return-Object hinzufügen**

Datei: `ExamLab/apps-script-code.js`

Aktueller Block (Z. ~4559-4566 — exakte Zeilennummern via `grep -n "case 'pdf':" ExamLab/apps-script-code.js` vor dem Edit prüfen):

```js
    case 'pdf':
      return {
        pdfDriveFileId: frage.pdfDriveFileId,
        pdfUrl: frage.pdfUrl,
        pdfBase64: frage.pdfBase64,
        pdfDateiname: frage.pdfDateiname,
        seitenAnzahl: frage.seitenAnzahl,
        ...
      };
```

Geändert zu:

```js
    case 'pdf':
      return {
        pdfDriveFileId: frage.pdfDriveFileId,
        pdfUrl: frage.pdfUrl,
        pdfBase64: frage.pdfBase64,
        pdfDateiname: frage.pdfDateiname,
        pdf: frage.pdf,
        seitenAnzahl: frage.seitenAnzahl,
        ...
      };
```

Also: **eine neue Zeile** `pdf: frage.pdf,` direkt nach `pdfDateiname: frage.pdfDateiname,` und vor `seitenAnzahl: frage.seitenAnzahl,`.

- [ ] **Step 2: Edit verifizieren**

```bash
grep -n "pdf: frage.pdf" ExamLab/apps-script-code.js
```

Expected: 1 Treffer in der Nähe von Z. 4559+. (Es gibt sonst noch `mq_ergaenzeMediaQuelle_` mit `frage.pdf = pdfQ;` in Z. 1797+ — das ist eine andere Stelle und sollte nicht matchen weil dort kein Doppelpunkt steht.)

- [ ] **Step 3: Position-Sanity — `pdf: frage.pdf,` muss WITHIN des PDF-cases stehen**

```bash
sed -n '4555,4575p' ExamLab/apps-script-code.js
```

Expected: zeigt den `case 'pdf':`-Block mit `pdf: frage.pdf,` als neuer Zeile zwischen `pdfDateiname` und `seitenAnzahl`. Wenn die Zeile außerhalb des Blocks gelandet ist (z.B. im `case 'visualisierung':` davor): rückgängig + neu setzen.

### Task 1.2: Frontend-Verifikation (no-op erwartet)

- [ ] **Step 1: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log | tail -5
```

Expected: keine Fehler (Apps-Script wird von tsc nicht gechecked).

- [ ] **Step 2: vitest — drift = 0 verifizieren**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -8
```

Expected: `Tests  1514 passed | 4 todo (1518)` — exakt wie Baseline.

- [ ] **Step 3: 4 Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any 2>&1 | tail -3 && \
  npm run lint:no-alert 2>&1 | tail -2 && \
  npm run lint:no-tests-dir 2>&1 | tail -2 && \
  npm run lint:musterloesung 2>&1 | tail -2
```

Expected:
- `as-any-Audit: Total: 0`
- `0 Treffer in produktivem Code`
- `OK: keine __tests__/-Verzeichnisse`
- `OK: alle Tokens auf oder unter Baseline`

- [ ] **Step 4: vite build**

```bash
cd ExamLab && npx vite build 2>&1 | tail -3
```

Expected: `dist/sw.js` + `dist/workbox-*.js` produced. Build-Zeit ~3s.

---

## Phase 2: Commit + Merge

### Task 2.1: Commit auf Feature-Branch

- [ ] **Step 1: Diff prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/media-phase-3"
git diff --stat
git diff
```

Expected: 1 file changed, `+1 -0` in `ExamLab/apps-script-code.js`. Diff zeigt die eine neue Zeile `+        pdf: frage.pdf,` an der erwarteten Stelle.

- [ ] **Step 2: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
Media-Phase 3: Apps-Script SAVE persistiert pdf-Feld (MediaQuelle)

typenSpezifischeFelder PDF-case ergänzt um `pdf: frage.pdf` (analog zu
Bild Z. 4580+ wo `bild: frage.bild` schon mitgeschrieben wird).

Voraussetzung für Phase 4.b (PDF-Editor schreibt `frage.pdf`).

READ-Pfad ist bereits Phase-2-ready: parseFrage Z. ~3023 liest
`pdf: typDaten.pdf || undefined` schon. mq_ergaenzeMediaQuelle_
ergänzt frage.pdf für Alt-Daten (Backwards-Compat).

Frontend unverändert (drift = 0 in vitest 1514, tsc/lint/build clean).

Apps-Script-Deploy: manuell durch User nach Merge.

Spec: docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md (Section 3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -3
```

Expected: Commit erstellt, HEAD-Hash neu.

### Task 2.2: Sync-Check + Merge auf main

- [ ] **Step 1: Sicherstellen dass main nicht weiter gewachsen ist**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin main
git log --oneline main..origin/main
```

Expected: leerer Output (lokales main = origin/main). Falls Output kommt: erst `git pull --ff-only origin main`, dann den Branch rebasen mit `cd .worktrees/media-phase-3 && git rebase main`.

- [ ] **Step 2: FF-Merge auf main**

```bash
git checkout main
git merge --ff-only media-phase-3/apps-script-pdf-save
git log --oneline -3
```

Expected: FF-merge clean, HEAD jetzt am Branch-Commit.

- [ ] **Step 3: Push origin main**

```bash
git push origin main
```

Expected: `<old>..<new>  main -> main` (kein Force-Push).

### Task 2.3: Branch + Worktree cleanup

- [ ] **Step 1: Worktree entfernen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
chflags -R nohidden .worktrees/media-phase-3/ 2>/dev/null
git worktree remove --force .worktrees/media-phase-3
rm -rf .worktrees/media-phase-3 2>/dev/null
git worktree list
```

Expected: nur Haupt-Worktree übrig.

- [ ] **Step 2: Lokalen Branch droppen**

```bash
git branch -d media-phase-3/apps-script-pdf-save
git branch
```

Expected: `media-phase-3/apps-script-pdf-save` weg, nur `main` + `preview` + ggf. `spec/media-phase-3-5` übrig.

---

## Phase 3: User-Aufgabe — Apps-Script-Deploy + Verifikation

> **WICHTIG:** Dieser Phase wird vom **User manuell ausgeführt**. Der Agent kann den Apps-Script-Editor im Browser nicht bedienen + nicht deployen. Der Agent stoppt nach Phase 2 + meldet diese Anweisungen an den User.

### Task 3.1: Apps-Script-Deploy

- [ ] **Step 1 (User): Apps-Script-Editor öffnen**

Browser → Google Drive → Apps-Script-Projekt für ExamLab öffnen. Datei `apps-script-code.js` auswählen.

- [ ] **Step 2 (User): Aktuellen Code aus Repo holen**

Im Apps-Script-Editor: kompletten Datei-Inhalt mit lokalem `ExamLab/apps-script-code.js` (post-Merge) ersetzen. Alternativ: Apps-Script-CLI (clasp) `clasp push` falls eingerichtet.

- [ ] **Step 3 (User): Deploy**

Apps-Script-Editor → "Bereitstellen" → "Bereitstellung verwalten" → bestehende Bereitstellung "Bearbeiten" → neue Version-Beschreibung eingeben (z.B. "Phase 3: pdf-Feld in typenSpezifischeFelder") → "Bereitstellen". URL bleibt unverändert (gleiches Deployment).

### Task 3.2: Browser-E2E-Verifikation

- [ ] **Step 1 (User): Service-Worker-Cache clearen vor E2E**

Browser DevTools → Application → Service Workers → "Unregister". Application → Storage → "Clear site data". Reload.

- [ ] **Step 2 (User): Bestehende PDF-Frage öffnen + speichern (Regression-Check)**

LP-Login → Fragensammlung → existierende PDF-Frage öffnen → ohne Änderung "Speichern". Editor zeigt PDF korrekt (Resolver-Fallback, da Editor noch Alt-Felder schreibt). Save erfolgreich, kein Fehler.

- [ ] **Step 3 (User): Sheet-Inspektion**

Google Sheets öffnen → entsprechender Fachbereich-Tab → Zeile der gespeicherten Frage finden → **`typDaten`-Spalte** ansehen (eine einzige Spalte mit JSON-stringified Object aus typenSpezifischeFelder). Inhalt sollte JSON enthalten mit Keys `pdfDriveFileId`/`pdfUrl`/`pdfBase64`/`pdfDateiname` (Alt-Felder weiterhin gefüllt durch Editor).

**Hinweis zum `pdf`-Key:** Wenn der Editor (noch ohne Phase 4.b) speichert, wird `frage.pdf = undefined` an Apps-Script geschickt. `JSON.stringify` droppt undefined-Properties — d.h. der `pdf`-Key kann **komplett fehlen** im Sheet-JSON. Das ist erwartet für die Editor-Save-Variante in Step 2 und kein Beweis dass die Apps-Script-Änderung nicht aktiv ist. Der Beweis kommt aus Step 4 (curl-Test mit explizitem `pdf`-Wert).

**Wichtig:** Wenn der Editor-Save-Pfad einen Fehler wirft oder die Frage nach Reload nicht mehr lädt: Apps-Script-Änderung könnte fehlerhaft sein (Re-Deploy oder Code-Check via Apps-Script-Editor).

- [ ] **Step 4 (User): Curl-Test mit explizitem pdf-Payload (optional aber empfohlen)**

Apps-Script-Endpoint-URL ermitteln (aus deployment dialog oder Apps-Script-Settings).

```bash
APPS_SCRIPT_URL="<deine-apps-script-deployment-url>"
LP_EMAIL="<deine-lp-email>"
PRUEFUNG_ID="<id-einer-test-pruefung>"
FRAGE_ID="<id-der-pdf-test-frage>"

curl -X POST "$APPS_SCRIPT_URL" \
  -H "Content-Type: text/plain" \
  -d "$(cat <<EOF
{
  "action": "speichereFrage",
  "email": "$LP_EMAIL",
  "frage": {
    "id": "$FRAGE_ID",
    "typ": "pdf",
    "fachbereich": "wr",
    "pdf": { "typ": "drive", "driveFileId": "TEST_DRIVE_ID", "mimeType": "application/pdf", "dateiname": "test.pdf" }
  }
}
EOF
)"
```

Expected: Response zeigt `success: true`. Sheet-Inspektion danach: **`typDaten`-Spalte enthält JSON mit `pdf`-Key** dessen Wert die MediaQuelle ist (`{"typ":"drive","driveFileId":"TEST_DRIVE_ID","mimeType":"application/pdf","dateiname":"test.pdf"}`). Das ist der positive Beweis dass die Apps-Script-Änderung aktiv ist.

> ⚠️ **Achtung:** Dieser Test überschreibt die genannte Test-Frage komplett. Vorher Backup machen oder dedizierte Test-Frage anlegen.

- [ ] **Step 5 (User): Bestätigung im Chat**

User meldet im Chat:
- ✅ Apps-Script-Deploy erfolgreich
- ✅ Bestandsfrage Save+Reload OK
- ✅ Sheet zeigt `pdf`-Key (mit `null`/`undefined`-Wert nach Editor-Save oder mit MediaQuelle nach curl-Test)

Dann erst kann Phase 4.a-Plan starten.

---

## Phase 4: HANDOFF-Update + Cleanup

### Task 4.1: HANDOFF-Eintrag

- [ ] **Step 1: Eintrag oben in HANDOFF.md ergänzen**

Datei: `ExamLab/HANDOFF.md`

Vor dem aktuell obersten Eintrag (`### Spawn-Task-Cleanup-Sweep + Salvage-Bundle ✅ MERGED (2026-05-09)` oder neuer) einen neuen Eintrag einfügen:

```markdown
### Media-Phase 3 — Apps-Script SAVE für PDF ✅ MERGED (2026-05-09)

Branch `media-phase-3/apps-script-pdf-save`. **Erstes Sub-Bundle der Media-Phase-3-5-Dual-Write Migration** (Spec [`docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md`](../../docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md)). Eine einzige Apps-Script-Code-Zeile: `pdf: frage.pdf` ergänzt in `typenSpezifischeFelder` PDF-case (analog Bild Z. 4580+).

**Was geliefert:**
- `ExamLab/apps-script-code.js` Z. ~4559+ — `pdf: frage.pdf,` als neue Property im PDF-return-Object

**Verifikation (frontend):**
- vitest **1514 passed | 4 todo | 1 skipped** (drift = 0, keine Frontend-Änderungen)
- tsc/4×lint/build clean

**Verifikation (Apps-Script — User manuell post-merge):**
- Apps-Script-Deploy via Editor "Bereitstellung verwalten"
- Browser-E2E mit echtem LP-Login: Bestandsfrage Save+Reload OK
- Sheet-Inspektion `typDaten`-Spalte (Editor-Save: `pdf`-Key kann fehlen weil JSON.stringify undefined droppt — kein Bug)
- curl-Test mit explizitem `pdf`-Payload → `typDaten`-JSON enthält `pdf`-Key mit MediaQuelle (positiver Beweis für aktive Apps-Script-Änderung)

**Voraussetzung für:** Phase 4.b (PDF-Editor schreibt `frage.pdf`). Phase 4.a (Bild-Stack) hängt nicht von Phase 3 ab — könnte parallel laufen, aber per Spec sequenziell.

**Merge:** `<commit-sha>`. Apps-Script-Deploy: `<datum-zeit>`.

---
```

`<commit-sha>` und `<datum-zeit>` durch tatsächliche Werte ersetzen.

- [ ] **Step 2: Commit HANDOFF**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
HANDOFF: Media-Phase 3 (Apps-Script SAVE für PDF) dokumentiert

Erstes Sub-Bundle der Media-Phase-3-5-Dual-Write Migration. Eine
Apps-Script-Code-Zeile, frontend-drift = 0. User-Apps-Script-Deploy
+ Browser-E2E-Verifikation post-merge erforderlich vor Phase 4.b.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main
```

Expected: HANDOFF-commit clean push.

### Task 4.2: Spec-Branch droppen falls nicht mehr benötigt

- [ ] **Step 1: spec/media-phase-3-5 ist schon auf main? prüfen**

```bash
git log --oneline main | head -5 | grep -i "spec.*media-phase"
```

Expected: Falls Spec-Commit auf main ist → Branch droppen. Falls nicht → Branch bleibt für Phase 4.a/4.b/5-Pläne (die hängen alle an der gleichen Spec).

- [ ] **Step 2: Falls nicht mehr benötigt — branch droppen**

```bash
# nur wenn die spec auch auf main ist
git branch -d spec/media-phase-3-5
git push origin --delete spec/media-phase-3-5  # falls auch remote
```

Andernfalls: Branch bleibt für die nachfolgenden Plan-Sessions.

---

## Risiko-Bilanz

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|---------------------|--------|------------|
| Falsche Stelle im Apps-Script-File getroffen | Niedrig | Hoch (Backend-Bug) | Phase 0 Task 0.2 verifiziert exakte Stelle, Phase 1 Step 3 sanity-check |
| Apps-Script-Deploy fehlgeschlagen | Niedrig | Mittel | User merkt es im Browser-E2E (Step 3.2.3 Sheet-Inspektion), kann Re-Deploy machen |
| Bestehende Saves brechen | Sehr niedrig | Hoch | Änderung ist additiv (neues Property dazu), Pre-Edit-Verifikation Phase 0 stellt sicher dass Bild-Pattern (Z. 4580+) bereits funktioniert |
| Frontend-Drift entdeckt | Sehr niedrig | Niedrig | Phase 1 Task 1.2 verifiziert tsc/vitest/lint/build alle clean |

## Abschätzung

- **Phase 0 + 1 + 2:** ~10-15 Min (Agent-Arbeit)
- **Phase 3:** ~10-15 Min (User-Arbeit, Browser + manueller Apps-Script-Deploy)
- **Phase 4:** ~5 Min (Agent-Arbeit, HANDOFF + cleanup)
- **Total:** ~30 Min

## Memory-Lehren applicable

- `feedback_tsc_b_exit_misleading` — tsc-Output direkt prüfen, nicht nur Exit-Code
- `feedback_service_worker_cache_wire_bundle` — SW-Clear vor Browser-E2E (Phase 3 Task 3.2 Step 1)
- `feedback_hash_verification` — vor Verwendung von Commit-Hashes via `git rev-parse <hash>` prüfen
- `feedback_staging_workflow` — Browser-Test ist Pflicht vor Phase 4.b
