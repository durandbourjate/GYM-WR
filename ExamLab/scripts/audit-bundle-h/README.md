# Audit-Skripte Bundle H

Vor Merge auszuführen. Liefern Bestand-Statistik, damit User informierte Decision treffen kann.

## Setup

```bash
export APPS_SCRIPT_URL='https://script.google.com/macros/s/.../exec'
export MIGRATION_EMAIL='wr.test@gymhofwil.ch'
```

## Ausführung

```bash
cd ExamLab/scripts/audit-bundle-h
node zaehleAudioFragen.mjs
node zaehleDuplizierteDragDropLabels.mjs
node zaehleDuplizierteDragDropZonen.mjs
node zaehleEmpfohlenLeere.mjs
```

## Erwartete Resultate

- `zaehleAudioFragen.mjs` = 0
- `zaehleDuplizierteDragDropLabels.mjs` = 0
- `zaehleDuplizierteDragDropZonen.mjs` ≥ 0 (zur Information; wenn > 5: User-Decision Bundle J vorziehen)
- `zaehleEmpfohlenLeere.mjs` ≥ 0 (zur Information)
