# Bundle J — DragDrop-Bild Multi-Zone Migration

Migriert alle `dragdrop_bild`-Fragen vom alten Datenmodell (Single-Label-pro-Zone,
String-Pool) auf das neue Modell (Multi-Label-pro-Zone, ID-keyed Pool-Tokens).

## Was passiert

**Pro Frage:**

- `zielzonen[i].korrektesLabel: string` → `zielzonen[i].korrekteLabels: string[]`
  (alter Wert wird in Array übernommen, `korrektesLabel` bleibt aus Kompat-Gründen
  bestehen wird aber vom Frontend ignoriert).
- `labels: string[]` → `labels: DragDropBildLabel[]` mit `{id, text}`.
  IDs werden via `stabilId(frageId, text, index)` deterministisch berechnet,
  sodass Apps-Script und Frontend dieselben IDs vergeben.
- `pruefungstauglich: false` (LP muss nach Migration die Frage neu freigeben).

**Was nicht angefasst wird:** fragetext, bildUrl, bildDriveFileId, thema,
unterthema, semester, gefaesse, bloom, tags, punkte, musterlosung, autor etc.
bleiben 1:1.

## Voraussetzungen

- Apps-Script-Deploy mit `batchUpdateFragenMigration` (generic `felder`-Patch,
  Bundle J Phase 9.0) UND erweitertem `LOESUNGS_FELDER_` (`korrekteLabels`).
- Frontend-Deploy mit Frage-/Antwort-Normalizer (Phase 1-8).
- **Sheet-Backup vor Migration** (Datei → Kopie erstellen → benennen
  `Backup-vor-Bundle-J-YYYY-MM-DD`).
- Env: `APPS_SCRIPT_URL`, `MIGRATION_EMAIL` (Admin-LP).

## Schritte

```bash
cd ExamLab/scripts/migrate-dragdrop-multi-zone
node dump.mjs          # liest fragen.json (nur dragdrop_bild)
node migrate.mjs       # liest fragen.json, schreibt migriert.json
node upload.mjs --dry-run   # zeigt was hochgeladen würde
node upload.mjs        # echter Upload (idempotent)
```

Siehe `SESSION-PROTOCOL.md` für die Schritt-für-Schritt-Bedienung mit
Stichprobe-Verifikation.
