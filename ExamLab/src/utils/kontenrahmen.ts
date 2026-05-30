// SSOT: Der KMU-Kontenrahmen lebt zentral im shared-DI
// (packages/shared/src/editor/kontenrahmen.ts), gefüttert aus der einen
// Daten-Quelle data/kontenrahmen-kmu.json (siehe App.tsx, UebenEditorProvider,
// PruefungFragenEditor). Diese Datei ist ein Re-Export-Shim, damit die
// bestehenden ExamLab-Importe (kontoLabel, findKonto …) unverändert bleiben.
// Siehe docs/superpowers/specs/2026-05-30-kontenrahmen-ssot.md
export * from '@shared/editor/kontenrahmen'
