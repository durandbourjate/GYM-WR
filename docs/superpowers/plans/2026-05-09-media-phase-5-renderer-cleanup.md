# Media-Phase 5 — Renderer-Cleanup ExamLab/src/ Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 PDF-Renderer-Files in `ExamLab/src/` lesen Bild-/PDF-Felder ausschliesslich via `ermittlePdfQuelle`-Resolver (Single-Read-Path), nicht mehr via direkte Alt-Feld-Zugriffe (`frage.pdfBase64`/`frage.pdfUrl`/`frage.pdfDriveFileId`/`frage.pdfDateiname`). Resolver-Fallback bleibt aktiv für Bestandsdaten (Phase-6-Cleanup separat).

**Architecture:** Pure Read-Pfad-Refactor. Keine Wire-Vertrag-Änderung, kein neuer State, kein neuer Test-Code. In jeder Datei: einmalig `const pdfQuelle = ermittlePdfQuelle(frage)` oben, dann switch über die 5 MediaQuelle-Varianten (`drive`/`pool`/`app`/`extern`/`inline`) statt Alt-Feld-Booleans. PDFFrage hat einen Edge-Case-Fallback für Alt-Daten mit nur `pdfDateiname` ohne andere PDF-Quelle (Material-Asset-Lookup), der erhalten bleibt.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest. `@shared/utils/mediaQuelleResolver`-Imports.

**Spec:** [`docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md`](../specs/2026-05-09-media-phase-3-5-dual-write-design.md) Section 6 + Section 0 STATUS-UPDATE für aktuellen Kontext.

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree:** `.worktrees/media-phase-5` (zu erstellen in Phase 0)

**Branch:** `media-phase-5/renderer-cleanup` (von `main` abzweigen)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output direkt prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`).

**Vitest-Baseline:** `1514 passed | 4 todo | 1 skipped` (Stand main `a6a8b18` post-HANDOFF-Update). Drift-Erwartung: **0** (pure Read-Pfad-Refactor, evtl. Mock-Shape-Anpassung in 1-2 bestehenden Tests falls sie auf Alt-Feld-Shapes mocken).

---

## File Map

### Geänderte Files (4)

| Datei | Heute | Nachher | Änderung |
|---|---|---|---|
| `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/PDFAnnotationAnzeige.tsx` | Z. 12 liest `frage.pdfDateiname` direkt mit Cast | `pdfQuelle?.dateiname ?? 'Dokument'` | 1 Zeile geändert |
| `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/index.tsx` | Z. 255-256 liest `frage.pdfDateiname` direkt | `ermittlePdfQuelle(frage)?.dateiname` (inline) + Import | 1-3 Zeilen |
| `ExamLab/src/components/fragetypen/PDFFrage.tsx` | Z. 234 Loading-Condition liest 4 Alt-Felder + Z. 143-152 pdfDateiname-Material-Fallback | Loading via `ermittlePdfQuelle(frage)` (mit pdfDateiname-Fallback erhalten) | 2 Stellen |
| `ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx` | Z. 64-99 useEffect liest 4 Alt-Felder direkt für PDF-Loading-Pfad-Auswahl, Z. 93 `effectivePdf = frage.pdfBase64 \|\| geladenesPdf` | useEffect mit `ermittlePdfQuelle(frage)` + switch über 5 MediaQuelle-Varianten + Resolver für loadedPdf | 30-40 Zeilen umgebaut |

### Neue Files

Keine.

### Reihenfolge (Risiko-aufsteigend)

1. **Phase 0**: Worktree + Branch + Pre-Edit-Audit (resolver-Edge-Cases, ermittlePdfQuelle-Returns für jeden Test-Fall)
2. **Phase 1**: Trivial-Files (PDFAnnotationAnzeige + VorschauTab) — ein Commit, low-risk pure Display-Migration
3. **Phase 2**: PDFFrage.tsx — Loading-Condition + pdfDateiname-Fallback-Konsolidierung — eigener Commit, mittel-risk
4. **Phase 3**: PDFKorrektur.tsx — heaviest Refactor (useEffect-Pipeline auf MediaQuelle umstellen) — eigener Commit, mittel-risk
5. **Phase 4**: Frontend-Verifikation (tsc/vitest/4×lint/build clean)
6. **Phase 5**: Browser-E2E mit echten LP+SuS-Logins
7. **Phase 6**: Merge + HANDOFF + Cleanup

---

## Phase 0: Worktree + Pre-Edit-Audit

### Task 0.1: Worktree erstellen + Branch

- [ ] **Step 1: main ist aktuell**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin main
git checkout main
git pull --ff-only origin main
git log --oneline -3
```

Expected: `a6a8b18 HANDOFF: Media-Phase Status nach Audit-Pass-2 aktualisiert` (oder neuer) als HEAD.

- [ ] **Step 2: Branch + Worktree**

```bash
git branch media-phase-5/renderer-cleanup main
git worktree add .worktrees/media-phase-5 media-phase-5/renderer-cleanup
cd .worktrees/media-phase-5
git status
```

Expected: `On branch media-phase-5/renderer-cleanup`, working tree clean.

### Task 0.2: Pre-Edit-Audit

- [ ] **Step 1: Resolver-Edge-Cases verstehen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/media-phase-5"
sed -n '74,99p' packages/shared/src/utils/mediaQuelleMigrator.ts
```

Expected output zeigt `pdfQuelleAus`-Funktion. Kritisch: Wenn weder `pdfBase64` noch `pdfDriveFileId` noch `pdfUrl` vorhanden → `return null`. **Konsequenz:** Alt-Daten mit nur `pdfDateiname` (Material-Asset-Lookup wie Einrichtungsprüfung) bekommen `null` zurück. Daher behält PDFFrage.tsx den `pdfDateiname`-Fallback in Phase 2.

- [ ] **Step 2: Bestätige `mq_ergaenzeMediaQuelle_` ergänzt frage.pdf**

```bash
grep -A2 "if (typ === 'pdf' && !typDaten.pdf)" ExamLab/apps-script-code.js
```

Expected: Apps-Script-READ ergänzt `typDaten.pdf` falls fehlend. **Konsequenz:** Frage-Objekte vom Backend haben `frage.pdf` immer gefüllt (außer pdfDateiname-only Edge-Case).

- [ ] **Step 3: Vitest-Baseline**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -8
```

Expected: `Tests  1514 passed | 4 todo (1518)`. Diese Zahl darf am Ende von Phase 4 maximal um ±0-2 driften (Mock-Shape-Updates falls existing tests).

- [ ] **Step 4: tsc-Baseline**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: keine Fehler.

---

## Phase 1: Trivial-Files

### Task 1.1: PDFAnnotationAnzeige.tsx (1 Zeile)

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/PDFAnnotationAnzeige.tsx:12`

- [ ] **Step 1: Edit anwenden**

Aktuell Z. 11-13:
```tsx
const pdfQuelle = ermittlePdfQuelle(frage as Parameters<typeof ermittlePdfQuelle>[0])
const pdfDateiname = 'pdfDateiname' in frage ? (frage as { pdfDateiname?: string }).pdfDateiname : 'Dokument'
```

Geändert zu:
```tsx
const pdfQuelle = ermittlePdfQuelle(frage as Parameters<typeof ermittlePdfQuelle>[0])
const pdfDateiname = pdfQuelle?.dateiname ?? 'Dokument'
```

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: keine Fehler.

### Task 1.2: VorschauTab/index.tsx (1-3 Zeilen)

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/index.tsx:255-256` + Import-Block

- [ ] **Step 1: Import oben ergänzen**

Datei oben (nach den existierenden Imports — exakte Position via `grep -n "^import" ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/index.tsx | head -5` prüfen):

```tsx
import { ermittlePdfQuelle } from '@shared/utils/mediaQuelleResolver'
```

- [ ] **Step 2: Z. 255-256 anpassen**

Aktuell Z. 255-256:
```tsx
{frage.pdfDateiname && (
  <p className="text-xs text-slate-500 dark:text-slate-400">Datei: {frage.pdfDateiname}</p>
)}
```

Geändert zu (Inline-Resolver-Call innerhalb der Bedingung, kein neuer lokaler State nötig):
```tsx
{ermittlePdfQuelle(frage)?.dateiname && (
  <p className="text-xs text-slate-500 dark:text-slate-400">Datei: {ermittlePdfQuelle(frage)?.dateiname}</p>
)}
```

**Optimierung optional:** `const pdfDateiname = ermittlePdfQuelle(frage)?.dateiname` als lokale Variable knapp davor — vermeidet Doppel-Aufruf, ist aber Sub-100ms-Optimierung (Resolver ist pure). Halt mich an Inline-Variante (kürzer, kein neuer Zwischen-State).

- [ ] **Step 3: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: keine Fehler. (Falls "Property 'pdfDateiname' does not exist on type Frage" — kein Problem weil ermittlePdfQuelle den Cast macht; aber wenn doch, lokaler `as { pdfDateiname?: string }`-Cast in der existierenden Bedingung als Fallback.)

### Task 1.3: Commit

- [ ] **Step 1: Diff prüfen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/media-phase-5"
git diff --stat
```

Expected: 2 files changed, ~3-5 line changes total.

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/PDFAnnotationAnzeige.tsx \
        ExamLab/src/components/lp/vorbereitung/composer/VorschauTab/index.tsx
git commit -m "$(cat <<'EOF'
Media-Phase 5 (1/3): PDFAnnotationAnzeige + VorschauTab via Resolver

Beide Display-Komponenten greifen direkt auf frage.pdfDateiname zu.
Migration auf ermittlePdfQuelle(frage)?.dateiname konsolidiert die
Read-Pfade durch den Resolver (mit Migrator-Fallback für Alt-Daten).

PDFAnnotationAnzeige.tsx: pdfQuelle ist bereits Z. 11 berechnet, daher
nur Z. 12 anpassen.

VorschauTab/index.tsx: ermittlePdfQuelle-Import + Inline-Resolver-Call.

Spec: docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -3
```

Expected: Commit erstellt.

---

## Phase 2: PDFFrage.tsx Loading-Condition + Material-Fallback

### Task 2.1: Loading-Condition (Z. 234)

**Files:**
- Modify: `ExamLab/src/components/fragetypen/PDFFrage.tsx:234`

- [ ] **Step 1: Edit Loading-Condition**

Aktuell Z. 234:
```tsx
if (renderer.state.status === 'loading' || (renderer.state.status === 'idle' && !ladeFehler && (frage.pdfBase64 || frage.pdfUrl || frage.pdfDriveFileId || frage.pdfDateiname))) {
```

Geändert zu:
```tsx
if (renderer.state.status === 'loading' || (renderer.state.status === 'idle' && !ladeFehler && (ermittlePdfQuelle(frage) !== null || frage.pdfDateiname))) {
```

**Begründung der Doppel-Bedingung:** `ermittlePdfQuelle` returnt `null` für Frage-Objekte mit nur `pdfDateiname` (kein pdfUrl/pdfBase64/pdfDriveFileId). Diese werden im Material-Fallback Z. 144-152 als App-Asset geladen — die Loading-Anzeige muss diesen Fallback-Pfad mitabdecken, daher `|| frage.pdfDateiname` bleibt.

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: keine Fehler. (`ermittlePdfQuelle` ist bereits Z. 9 importiert.)

### Task 2.2: Material-Fallback dokumentieren

**Files:**
- Modify: `ExamLab/src/components/fragetypen/PDFFrage.tsx:143-152` (Code unverändert, aber Kommentar präzisieren)

- [ ] **Step 1: Kommentar Z. 143 präzisieren**

Aktuell Z. 143:
```tsx
// Fallback: Lokale Datei aus pdfDateiname (Alt-Daten ohne pdfUrl)
```

Geändert zu:
```tsx
// Fallback: Lokale Datei aus pdfDateiname (Alt-Daten ohne pdfUrl/pdfBase64/pdfDriveFileId, z.B. Einrichtungsprüfung)
// pdfQuelleAus returnt null wenn keine PDF-Quelle setzbar — dieser Pfad lädt aus ./materialien/.
// Phase-6-Cleanup: pdfDateiname-Felder migrieren auf MediaQuelle.app, dann diesen Fallback entfernen.
```

**Begründung:** Edge-Case wird sonst im Phase-6-Bundle übersehen. Inline-Doku als Wegweiser.

### Task 2.3: Commit

- [ ] **Step 1: Diff prüfen**

```bash
git diff --stat
```

Expected: 1 file changed, ~3-5 line changes.

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/components/fragetypen/PDFFrage.tsx
git commit -m "$(cat <<'EOF'
Media-Phase 5 (2/3): PDFFrage Loading-Condition via Resolver

Z. 234 Loading-Condition liest 4 Alt-Felder direkt — auf
ermittlePdfQuelle(frage) konsolidiert. pdfDateiname-Bedingung bleibt
als zweite Komponente, weil pdfQuelleAus null returnt für Frage-Objekte
mit nur pdfDateiname (Material-Asset-Lookup wie Einrichtungsprüfung).

Z. 143-152 Material-Fallback unverändert, Kommentar präzisiert mit
Phase-6-Wegweiser (pdfDateiname → MediaQuelle.app migrieren).

Spec: docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: PDFKorrektur.tsx Refactor

### Task 3.1: useEffect auf MediaQuelle-aware umstellen

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx:1-99`

Heutiger Stand Z. 64-99:
```tsx
useEffect(() => {
  if (frage.pdfBase64) return // Bereits vorhanden
  const driveId = frage.pdfDriveFileId || frage.anhaenge?.find(a => a.mimeType === 'application/pdf')?.driveFileId
  if (driveId && apiService.istKonfiguriert()) {
    apiService.ladeDriveFile(driveId, schuelerEmail).then((result) => {
      if (result?.base64) {
        setGeladenesPdf(result.base64)
      }
    })
  } else if (frage.pdfUrl && !driveId) {
    // Fallback: PDF per URL laden und als Base64 konvertieren (z.B. Einrichtungsprüfung)
    fetch(frage.pdfUrl)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          if (base64) setGeladenesPdf(base64)
        }
        reader.readAsDataURL(blob)
      })
      .catch(err => {
        console.error('[PDFKorrektur] PDF per URL laden fehlgeschlagen:', err)
        toast.error('PDF-Annotation konnte nicht geladen werden.')
      })
  }
}, [frage.pdfDriveFileId, frage.pdfBase64, frage.pdfUrl, frage.anhaenge, schuelerEmail])

const effectivePdf = frage.pdfBase64 || geladenesPdf

useEffect(() => {
  if (effectivePdf) {
    renderer.ladePDF({ base64: effectivePdf })
  }
}, [effectivePdf, renderer.ladePDF])
```

- [ ] **Step 1: Import ergänzen**

Z. 1-10 Imports oben — ergänze:
```tsx
import { ermittlePdfQuelle } from '@shared/utils/mediaQuelleResolver'
```

(falls noch nicht vorhanden — bisher nicht in PDFKorrektur.tsx).

- [ ] **Step 2: useEffect refactor**

Z. 65-91 ersetzen mit:

```tsx
useEffect(() => {
  if (frage.pdfBase64) return // Bereits inline vorhanden — kein Nachladen
  const pdfQuelle = ermittlePdfQuelle(frage)
  // Drive-Quelle (oder PDF-Anhang als Fallback): via apiService.ladeDriveFile
  const driveId = pdfQuelle?.typ === 'drive'
    ? pdfQuelle.driveFileId
    : frage.anhaenge?.find(a => a.mimeType === 'application/pdf')?.driveFileId
  if (driveId && apiService.istKonfiguriert()) {
    apiService.ladeDriveFile(driveId, schuelerEmail).then((result) => {
      if (result?.base64) {
        setGeladenesPdf(result.base64)
      }
    })
    return
  }
  // Extern-Quelle: per URL laden und als Base64 konvertieren
  // pool/app werden hier nicht abgedeckt: Korrektur-Pfad hat keinen toAssetUrl-Resolver in scope,
  // und LP korrigiert SuS-Abgaben (keine Pool/App-Lehrer-Materialien). Falls je auftritt: kein Crash, nur leerer Korrektur-Block.
  if (pdfQuelle?.typ === 'extern') {
    const url = pdfQuelle.url
    if (url) {
      fetch(url)
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            if (base64) setGeladenesPdf(base64)
          }
          reader.readAsDataURL(blob)
        })
        .catch(err => {
          console.error('[PDFKorrektur] PDF per URL laden fehlgeschlagen:', err)
          toast.error('PDF-Annotation konnte nicht geladen werden.')
        })
    }
  }
// frage.id als Dep (statt 4 separate Alt-Felder) — Resolver liest pure aus frage,
// wechselt nur bei Frage-Wechsel. anhaenge bleibt als separate Dep weil Drive-Fallback.
}, [frage.id, frage.pdfBase64, frage.anhaenge, schuelerEmail])
```

**Wichtige Anmerkungen für den Implementer:**
1. `frage.pdfBase64`-Check Z. 1 bleibt aus dem Original — gleiches Verhalten "wenn inline schon da, kein Reload"
2. `ermittlePdfQuelle(frage)` einmal aufrufen, dann switch über `pdfQuelle?.typ`
3. Drive-Pfad: bevorzugt `pdfQuelle.driveFileId`, fällt auf Anhang-Drive-Fallback wenn kein Drive-pdfQuelle
4. URL-Pfad: nur `extern` löst direkt URL auf — `pool`/`app` erfordern App-Asset-Resolver (`toAssetUrl`), in Korrektur-Pfad nicht im scope, sollten in der Praxis nicht auftreten (LP korrigiert SuS-Abgaben, nicht Pool/App-Bilder direkt)
5. **Inline-Pfad (`pdfQuelle.typ === 'inline'`):** wird durch `frage.pdfBase64`-Early-Return Z. 66 abgedeckt — wenn Editor `pdf: { typ: 'inline', base64: '...' }` setzt aber `frage.pdfBase64` leer ist, müsste man auch das abdecken. **Edge-Case:** in der Praxis schreibt Apps-Script-READ `pdfBase64` parallel zu `pdf` (siehe parseFrage Z. 3019-3022). Aber sicherheitshalber kann man `pdfQuelle.typ === 'inline'` als zusätzlichen Early-Return ergänzen:

```tsx
if (frage.pdfBase64) return
const pdfQuelle = ermittlePdfQuelle(frage)
if (pdfQuelle?.typ === 'inline') {
  setGeladenesPdf(pdfQuelle.base64)
  return
}
```

**Empfehlung:** Inline-Early-Return ergänzen, defensiv.

- [ ] **Step 3: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -3
```

Expected: keine Fehler. Wenn `Property 'pdf' does not exist on type 'PDFFrage'` — kein Problem, `ermittlePdfQuelle` macht den Cast über `Parameters<typeof ermittlePdfQuelle>[0]`-Type.

### Task 3.2: Commit

- [ ] **Step 1: Diff prüfen**

```bash
git diff --stat
git diff ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx
```

Expected: 1 file changed, ~30-40 line changes.

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/components/lp/korrektur/PDFKorrektur.tsx
git commit -m "$(cat <<'EOF'
Media-Phase 5 (3/3): PDFKorrektur PDF-Loading via Resolver

useEffect-Pipeline (Z. 65-91) auf ermittlePdfQuelle umgestellt — switch
über die 5 MediaQuelle-Varianten statt direkten Alt-Feld-Reads. Behält:
- frage.pdfBase64 Early-Return (gleiche Semantik)
- Drive-Anhang-Fallback wenn kein Drive-MediaQuelle
- URL-Loading via fetch (nur extern; pool/app in LP-Korrektur-Pfad
  unwahrscheinlich)
- Defensiver Inline-Early-Return falls pdfBase64 leer aber MediaQuelle
  inline ist
useEffect-Deps reduziert von 4 Alt-Feldern auf [frage.id, pdfBase64,
anhaenge, schuelerEmail].

Spec: docs/superpowers/specs/2026-05-09-media-phase-3-5-dual-write-design.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Frontend-Verifikation

### Task 4.1: Vitest + tsc + Lint + Build

- [ ] **Step 1: tsc clean**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail -5
```

Expected: keine Fehler.

- [ ] **Step 2: vitest grün**

```bash
cd ExamLab && npx vitest run 2>&1 | tail -8
```

Expected: `Tests  1514 passed | 4 todo (1518)` (Drift = 0). Falls 1-2 Tests failen wegen Mock-Shape-Updates: Mock-Shapes auf MediaQuelle-aware anpassen (z.B. ergänzen `pdf: { typ: 'inline', base64: '...', mimeType: 'application/pdf' }` zu Mock-Frage-Objekten).

- [ ] **Step 3: 4 Lint-Gates**

```bash
cd ExamLab && npm run lint:as-any 2>&1 | tail -3 && \
  npm run lint:no-alert 2>&1 | tail -2 && \
  npm run lint:no-tests-dir 2>&1 | tail -2 && \
  npm run lint:musterloesung 2>&1 | tail -2
```

Expected: alle 4 clean (Total: 0 / 0 Treffer / OK keine __tests__/ / OK alle Tokens auf Baseline).

- [ ] **Step 4: vite build**

```bash
cd ExamLab && npx vite build 2>&1 | tail -3
```

Expected: `dist/sw.js` + `dist/workbox-*.js` produced, Build-Zeit ~3s.

---

## Phase 5: Browser-E2E mit echten Logins

> **WICHTIG:** Diese Phase erfordert User-Action im Browser mit echten LP+SuS-Logins (per Memory-Lehre `feedback_echte_logins`). Agent kann das nicht autonom — User muss bestätigen.

### Task 5.1: Service-Worker-Cache (NICHT zwingend in Phase 5)

Phase 5 ist **kein Wire-Vertrag-Bundle** (pure Read-Pfad-Refactor, kein API-Payload-Change). SW-Clear ist optional, empfohlen falls aus vorheriger Session noch Caches bestehen.

### Task 5.2: LP-Browser-E2E (User)

- [ ] **Step 1 (User): LP-Login + Composer-Vorschau einer PDF-Frage**

Browser → ExamLab → LP-Login (echter Account, kein Demo) → Fragensammlung → PDF-Frage → Composer-Vorschau-Tab → **erwartete Anzeige:** „Datei: <pdf-name>" (kommt aus `ermittlePdfQuelle(frage)?.dateiname`). Validiert VorschauTab-Edit.

- [ ] **Step 2 (User): LP-Korrektur einer abgegebenen PDF-Frage**

Bestehende abgegebene PDF-Frage in einer Korrektur-Liste → öffnen → **erwartete Anzeige:** PDF rendert mit allen Annotationen. Validiert PDFKorrektur.tsx-Edit (useEffect lädt PDF korrekt).

Test alle 3 PDF-Quellen-Varianten (falls verfügbar):
- Drive-Upload-PDF → lädt via `apiService.ladeDriveFile`
- Extern-URL-PDF (z.B. Pool-PDF) → lädt via fetch
- Inline-Base64-PDF (z.B. Einrichtungsprüfung kleines PDF) → lädt aus frage.pdfBase64-Early-Return

- [ ] **Step 3 (User): LP-Annotation-Anzeige in Korrekturansicht**

In Korrektur-Vollansicht → PDFAnnotationAnzeige für Frage rendert mit **Datei-Name korrekt im Badge** (📄 <pdf-name>). Validiert PDFAnnotationAnzeige.tsx-Edit.

### Task 5.3: SuS-Browser-E2E (User)

- [ ] **Step 1 (User): SuS-Login + PDF-Frage rendern**

ExamLab → SuS-Login (echter Account `wr.test` o.ä.) → Prüfung mit PDF-Frage starten → **erwartete Anzeige:** PDF lädt + ist annotierbar. Validiert PDFFrage.tsx-Edit (Loading-Condition zeigt Spinner, Resolver-aware).

Test mindestens 2 Varianten:
- Drive-PDF (gross)
- Inline-PDF (klein, Einrichtungsprüfung)

- [ ] **Step 2 (User): pdfDateiname-Edge-Case (falls testbar)**

Falls eine Bestandsfrage existiert mit nur `pdfDateiname` ohne pdfUrl/pdfBase64 (Alt-Daten Material-Lookup): SuS-Sicht öffnet PDF → Loading-Spinner → PDF lädt aus `./materialien/<pdfDateiname>`. Validiert dass Phase-2-Material-Fallback funktioniert.

- [ ] **Step 3 (User): Bestätigung im Chat**

User meldet:
- ✅ LP-Composer-Vorschau zeigt pdfDateiname
- ✅ LP-Korrektur lädt PDF aller Quellen-Varianten
- ✅ LP-Annotation-Anzeige zeigt pdfDateiname
- ✅ SuS-PDF-Frage rendert + lädt PDF
- ✅ (optional) pdfDateiname-Material-Fallback funktioniert

---

## Phase 6: Merge + HANDOFF + Cleanup

### Task 6.1: Sync-Check + FF-Merge

- [ ] **Step 1: main aktuell**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git fetch origin main
git log --oneline main..origin/main
```

Expected: leerer Output. Sonst: `git pull --ff-only origin main`, `cd .worktrees/media-phase-5 && git rebase main`.

- [ ] **Step 2: FF-Merge**

```bash
git checkout main
git merge --ff-only media-phase-5/renderer-cleanup
git log --oneline -5
```

Expected: 3 Commits (Phase 1 + Phase 2 + Phase 3) jetzt auf main.

- [ ] **Step 3: Push**

```bash
git push origin main
```

### Task 6.2: HANDOFF-Eintrag

- [ ] **Step 1: Eintrag oben in HANDOFF.md**

Datei `ExamLab/HANDOFF.md` — vor dem aktuell obersten Eintrag in „Letzter Stand auf main":

```markdown
### Media-Phase 5 — PDF-Renderer-Cleanup ✅ MERGED (2026-05-09)

Branch `media-phase-5/renderer-cleanup`. Letztes Sub-Bundle der Media-Migration vor Phase 6 (Type-Cleanup + Sheet-Daten-Migration). 4 PDF-Renderer-Files in `ExamLab/src/` auf `ermittlePdfQuelle`-Resolver umgestellt — Read-Pfade konsolidiert, Alt-Feld-Direktzugriffe raus.

**Was geliefert (3 Commits):**

| Commit | File(s) | Δ |
|---|---|---|
| 1/3 | PDFAnnotationAnzeige.tsx + VorschauTab/index.tsx | -2/+3 (Display-Cleanup, pdfDateiname via Resolver) |
| 2/3 | PDFFrage.tsx | Loading-Condition (Z. 234) via `ermittlePdfQuelle` + Material-Fallback-Kommentar präzisiert |
| 3/3 | PDFKorrektur.tsx | useEffect-Pipeline (Z. 65-91) auf MediaQuelle-Switch umgestellt, defensiver Inline-Early-Return ergänzt, Deps reduziert |

**Verifikation:**
- vitest **1514 passed | 4 todo | 1 skipped** (drift = 0)
- tsc/4×lint/build clean
- Browser-E2E mit echten LP+SuS-Logins: LP-Composer-Vorschau ✅ + LP-Korrektur (alle PDF-Quellen) ✅ + LP-Annotation-Anzeige ✅ + SuS-PDF-Frage rendert ✅

**Was bleibt:**
- pdfDateiname-Material-Fallback in PDFFrage.tsx Z. 143-152 erhalten (Edge-Case Alt-Daten ohne pdfUrl/pdfBase64/pdfDriveFileId — Phase 6 migriert pdfDateiname-only-Daten auf MediaQuelle.app)
- Phase 4.a/4.b (Editor-State-Refactor) als optionale Code-Hygiene-Bundles
- Phase 6 als nächstes grosses Bundle: Type-Cleanup + Sheet-Daten-Migration via `admin:migrierMediaQuelle`

**Merge:** `<commit-sha>`.

---
```

`<commit-sha>` durch FF-Merge-HEAD ersetzen.

- [ ] **Step 2: Eintrittspunkt + Future-Bundles aktualisieren**

In HANDOFF.md unter „Eintrittspunkte für nächste Session" und „Future Bundles": Phase 5 als ✅ erledigt markieren, Phase 6 als nächstes hervorheben.

- [ ] **Step 3: Commit + Push HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: Media-Phase 5 (Renderer-Cleanup) ✅ erledigt + Phase 6 als nächstes"
git push origin main
```

### Task 6.3: Worktree + Branch cleanup

- [ ] **Step 1: Worktree entfernen**

```bash
chflags -R nohidden .worktrees/media-phase-5/ 2>/dev/null
git worktree remove --force .worktrees/media-phase-5
rm -rf .worktrees/media-phase-5 2>/dev/null
git worktree list
```

Expected: nur Haupt-Worktree.

- [ ] **Step 2: Branch droppen**

```bash
git branch -d media-phase-5/renderer-cleanup
git branch
```

Expected: nur `main` + `preview` übrig.

---

## Risiko-Bilanz

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|---------------------|--------|------------|
| Loading-Condition für pdfDateiname-only-Frage falsch evaluiert | Niedrig | Mittel | Phase 2 behält explizite `\|\| frage.pdfDateiname`-Bedingung, Browser-E2E mit Bestandsfrage testet |
| PDFKorrektur lädt PDF-Quelle falsch (Drive vs. URL vs. Inline) | Niedrig-Mittel | Mittel | useEffect schaltet defensiv über pdfQuelle.typ + behält frage.pdfBase64-Early-Return + Drive-Anhang-Fallback. Browser-E2E mit allen 3 Varianten |
| useEffect-Dep-Array verursacht stale-closure | Niedrig | Niedrig | Reduziert auf `frage.id` — wechselt nur bei Frage-Wechsel; pure Read-Pfad ohne State-Race |
| pool/app-PDF in Korrektur-Pfad nicht abgedeckt | Sehr niedrig | Niedrig | LP korrigiert SuS-Abgaben; pool/app-PDFs sind Lehrer-Material, nicht SuS-Antwort. Theoretisch könnte ein Lehrer eine pool-PDF in eigener Frage haben — der Edge-Case fällt dann auf "kein PDF" zurück (kein Crash, nur leerer Korrektur-Block) |
| Mock-Shape in bestehenden Tests bricht | Niedrig | Niedrig | Phase 4 Step 2 fängt das ab; falls failing tests: Mock erweitern um `pdf: MediaQuelle`-Property |

## Abschätzung

- **Phase 0 + 1 + 2 + 3:** ~30-45 Min (Agent-Arbeit)
- **Phase 4:** ~5 Min (Verifikation)
- **Phase 5:** ~15 Min (User-Browser-E2E)
- **Phase 6:** ~5 Min (Merge + HANDOFF + Cleanup)
- **Total:** ~1 Stunde

## Memory-Lehren applicable

- `feedback_tsc_b_exit_misleading` — tsc-Output direkt prüfen
- `feedback_echte_logins` — Browser-E2E mit echten LP+SuS-Logins, kein Demo-Modus
- `feedback_grep_anwesenheit_nicht_abwesenheit` — bei "ist X schon implementiert" explizit nach X suchen (relevant für Phase-6-Audit später)
- `feedback_hash_verification` — vor Verwendung von Commit-Hashes via `git rev-parse <hash>` prüfen
