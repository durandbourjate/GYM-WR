# Lückentext-Migration — Phase 7 (KI-Batch)

Einmalige Migration: Alle 253 Lückentext-Fragen bekommen via **Claude Code**
(keine SDK-Dependency, nutzt Subscription des Users) pro Lücke neu befüllte
`korrekteAntworten` (Hauptantwort + 2-3 Synonyme) und `dropdownOptionen`
(exakt 5 Einträge: 1 Korrekte + 4 Distraktoren).

Nach der Migration sind **alle Fragen `pruefungstauglich=false`** — der LP
prüft pro Frage manuell und setzt `pruefungstauglich=true`. Nicht Teil
dieses Skripts.

**Plan:** `../../docs/superpowers/plans/2026-04-24-lueckentext-modus-migration.md` (Phase 7)
**Template:** `../migrate-teilerklaerungen/` (C9 Phase 4)
**Session-Protokoll:** [SESSION-PROTOCOL.md](SESSION-PROTOCOL.md)

## Voraussetzungen

- **Node >= 20.11**
- **Apps-Script-URL** der Produktions-Bereitstellung (mit `batchUpdateLueckentextMigration` aktiviert — siehe Phase 5 Deploy)
- **LP-E-Mail mit `rolle=admin`**
- **Google-Sheets-Backup der Fragenbank** (Pflicht vor Upload!)
- Migrations-Fenster angekündigt — keine gleichzeitige Frage-Bearbeitung durch andere LP (Endpoint nutzt Whole-Sheet-Snapshot-Write — parallele Edits werden überschrieben).

## Workflow (5 Phasen)

### Phase A — Setup

1. **Google-Sheets-Backup erstellen:** Drive → Fragenbank → Datei → **Kopie erstellen** → `ExamLab_Fragenbank_Backup_YYYY-MM-DD_lueckentext`
2. **Apps-Script verifizieren:** im GAS-Editor `testC9BatchUpdateLueckentextMigration` laufen lassen → erwartet `✓ batchUpdateLueckentextMigration-Test bestanden.`
3. **Migrations-Fenster kommunizieren** — keine LP/SuS sollten während Upload im Sheet editieren.
4. **Env-Variablen setzen:**
   ```bash
   export APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   export MIGRATION_EMAIL=admin@gymhofwil.ch
   ```

### Phase B — Dump

```bash
cd ExamLab/scripts/migrate-lueckentext-antworten
node dump.mjs
```

Output: `fragen-dump.json` (JSON-Array mit ~253 Lückentext-Fragen).
Plausibilitäts-Check: Fachbereichs-Counts (erwartet ~94 VWL, ~93 BWL, ~63 Recht, ~3 Informatik je nach Datenstand).

### Phase C — Stichprobe (15 Fragen)

```bash
node pick-stichprobe.mjs
```

Output: `stichprobe.json` (5 Fragen pro VWL/BWL/Recht, seed=42) + `stichprobe-ids.json` (IDs + Seed).
Informatik wird ausgelassen.

**Claude-Code-Session 1 (Stichprobe):**
- Neue Claude-Code-Session öffnen.
- Paste-n: Inhalt von `prompt-template.md` **+** Inhalt von `stichprobe.json`.
- Claude antwortet mit einem **JSON-Array** (1 Objekt pro Input-Frage).
- Output als `stichprobe-response.json` speichern.

```bash
node review-generator.mjs
```

Output: `stichprobe-review.md` — Markdown-Report mit pro Frage:
- Fragetext + textMitLuecken
- Pro Lücke: alte vs. neue korrekteAntworten + dropdownOptionen
- Sanity-Hinweise (z.B. ⚠️ wenn Dropdown ≠ 5 Einträge, Duplikate)
- OK/Ablehnen-Checkbox für LP

**LP reviewt, gibt Freigabe oder Feedback.** Bei >2 Ablehnungen: Prompt iterieren + Stichprobe neu.

### Phase D — Full-Run (Batches)

Nach Freigabe der Stichprobe: alle 253 Fragen in Batches à ~30-50 verarbeiten.

Pro Batch:
1. Aus `fragen-dump.json` einen Batch ziehen (z.B. alle VWL, oder alle noch offenen Fragen ab Index N).
2. Neue Claude-Code-Session → paste-n `prompt-template.md` + Batch-JSON.
3. Claude-Response als `batch-<fachbereich>-sN.json` oder `batch-sN.json` speichern.
4. (Optional) Konsolidieren in `lueckentext-updates.jsonl` (eine Zeile pro Frage).

**Tipp:** Pro Fachbereich eine eigene Datei — dann matcht der Upload 1:1 pro POST.

### Phase E — Upload

```bash
# Dry-Run pro Batch
node upload.mjs batch-BWL-s1.json --dry-run

# Echter Upload
node upload.mjs batch-BWL-s1.json

# Full-Run (alle Fachbereiche in einer JSONL)
node upload.mjs lueckentext-updates.jsonl

# Upload nur eines Fachbereichs aus einer gemischten Datei
node upload.mjs lueckentext-updates.jsonl --fachbereich=VWL
```

Upload sendet **einen POST pro Fachbereich**. Bei HTTP-Fehler oder Apps-Script-Error (Timeout >5 min, 5xx, 4xx, `resp.error`): split in Hälften + retry (nur wenn >10 Einträge).

**Response pro Fachbereich:** `{ success, fachbereich, aktualisiert, nichtGefunden, keineLuecken, falscherTyp }`.

Log: `upload.log` (ISO-Timestamps pro Aktion).

**Verifikation nach Upload:**
- `aktualisiert`-Count == erwartet (aus Batch-Datei)?
- `nichtGefunden` / `keineLuecken` / `falscherTyp` leer (oder minimal — ggf. manuell nachschauen)?
- Im GAS-Editor: `zaehleLeereLueckentextAntworten` erneut ausführen → erwartet **0 / 253** betroffene Fragen.
- 5 Fragen pro Fachbereich manuell im Frontend prüfen (Freitext UND Dropdown-Modus).

## Dateien

| Datei | Rolle | Im Repo? |
|---|---|---|
| `dump.mjs` | Lädt alle Lückentext-Fragen via Apps-Script | ✓ |
| `pick-stichprobe.mjs` | Zieht 15 Stichproben-Fragen (seed=42, 5/Fachbereich) | ✓ |
| `review-generator.mjs` | Baut `stichprobe-review.md` aus Dump + IDs + Response | ✓ |
| `upload.mjs` | Upload via Apps-Script pro Fachbereich, split-on-error | ✓ |
| `prompt-template.md` | System-Prompt für Claude-Code-Sessions | ✓ |
| `package.json` | Node-Konfiguration (keine Dependencies) | ✓ |
| `.gitignore` | Ignoriert lokale Migrations-Artefakte | ✓ |
| `SESSION-PROTOCOL.md` | Leitfaden für Claude-Code-Session | ✓ |
| `fragen-dump.json` | Dump-Output | — (lokal, gitignored) |
| `stichprobe.json` / `stichprobe-ids.json` | Stichproben-Input + Meta | — (lokal, gitignored) |
| `stichprobe-response.json` | Claude-Output der Stichproben-Session | — (lokal, gitignored) |
| `stichprobe-review.md` | Markdown-Review für LP | — (lokal, gitignored) |
| `batch-*.json` / `lueckentext-updates.jsonl` | Full-Run-Batches | — (lokal, gitignored) |
| `upload.log` | Upload-History | — (lokal, gitignored) |

## Rollback

Bei Problemen:

1. **Sheet-Rollback:** Drive öffnen → Backup-Kopie umbenennen auf den Live-Namen (ursprüngliches File davor umbenennen oder verschieben).
2. **Apps-Script-Cache:** neuer Deploy oder im Editor `cacheInvalidieren_()` manuell aufrufen.

Kein Frontend-Deploy nötig — das Schema `luecken[].korrekteAntworten` + `luecken[].dropdownOptionen` ist seit Phase 1-6 bekannt.

## Kosten

Keine externen Kosten — Claude-Code-Subscription + Apps-Script-Quoten reichen aus.
