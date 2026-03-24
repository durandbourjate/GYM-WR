# PT-1: Backup-Export als Excel

## Zweck

LP-seitiges Backup nach Prüfungsdurchführung und/oder Korrektur. Ein `.xlsx` mit Übersicht + Detail-Tabs pro SuS. Phasenabhängig: nach Durchführung nur Antworten, nach Korrektur zusätzlich Punkte und Kommentare.

## Auslöser

Ein **"Backup exportieren"**-Button, sichtbar in:
1. **BeendetPhase** (Tab "Ergebnisse") — Export mit Antworten, ohne Bewertungen
2. **KorrekturDashboard** (Tab "Korrektur") — Export mit Antworten + Bewertungen

Gleicher Button, gleiches Format. Unterschied ist nur, ob Korrektur-Daten vorhanden sind.

## Excel-Struktur

### Tab "Übersicht"

Spalten (links → rechts):

| Name | E-Mail | Klasse | Total | Max | Note | F1 Pkt | F1 Kommentar | F2 Pkt | F2 Kommentar | ... |

- **Total/Max/Note**: Leer wenn keine Korrektur vorhanden
- **F{n} Pkt**: Effektive Punkte pro Frage (`lpPunkte ?? kiPunkte`)
- **F{n} Kommentar**: Effektiver Kommentar (`lpKommentar ?? kiFeedback`)
- Fragen-Header: Kurzform des Fragetextes (erste ~50 Zeichen) + Typ-Kürzel

### Tab pro SuS (z.B. "Meier Anna")

| # | Frage | Typ | Antwort | Punkte | Max | Kommentar |

- **#**: Frage-Nummer (1, 2, 3...)
- **Frage**: Fragetext (gekürzt auf ~200 Zeichen, Markdown/HTML bereinigt)
- **Typ**: Fragetyp-Label (MC, Freitext, Lückentext, etc.)
- **Antwort**: Via `antwortAlsText()` — existierende Funktion in exportUtils.ts
- **Punkte**: `lpPunkte ?? kiPunkte` (leer wenn keine Korrektur)
- **Max**: maxPunkte der Frage
- **Kommentar**: `lpKommentar ?? kiFeedback` (leer wenn keine Korrektur)

Tab-Name: `name`-Feld wie gespeichert (gekürzt auf 31 Zeichen, Excel-Limit). Herkunft: `SchuelerKorrektur.name` bzw. `SchuelerAbgabe.name`.

## Dateiname

`{Prüfungstitel}_Backup_{YYYY-MM-DD}.xlsx`

Beispiel: `VWL_Test_KW12_Backup_2026-03-24.xlsx`

## Technische Umsetzung

### Dependency

`xlsx` (SheetJS Community Edition) — Client-seitige Excel-Generierung, ~200KB.

```bash
npm install xlsx
```

### Neue Datei: `src/utils/backupExport.ts`

SheetJS wird lazy-loaded via `import('xlsx')` innerhalb der Export-Funktion (kein Top-Level-Import, um Bundle-Grösse zu schonen).

```typescript
interface BackupExportInput {
  config: PruefungsConfig
  fragen: Frage[]
  abgaben: Record<string, SchuelerAbgabe>  // aus korrektur.ts (email → Abgabe)
  korrektur?: PruefungsKorrektur           // optional — nur nach Korrektur vorhanden
}

async function exportiereBackupXlsx(input: BackupExportInput): Promise<void>
```

Logik:
1. `const XLSX = await import('xlsx')` — Lazy-Load
2. Übersicht-Tab aufbauen (Header-Zeile + eine Zeile pro SuS)
3. Pro SuS einen Detail-Tab erstellen
4. Effektive Punkte/Kommentare berechnen: `lpPunkte ?? kiPunkte`, `lpKommentar ?? kiFeedback`
5. Workbook als Blob generieren, Download triggern (analog zu bestehendem `downloadCSV()`)

### Geänderte Dateien

1. **`src/components/lp/BeendetPhase.tsx`** — "Backup exportieren"-Button neben bestehendem "Ergebnisse exportieren"
2. **`src/components/lp/KorrekturDashboard.tsx`** — "Backup exportieren"-Button neben bestehenden CSV-Buttons
3. **`package.json`** — `xlsx` Dependency

### Daten-Verfügbarkeit

- **BeendetPhase**: `config` und `schueler` (MonitoringDaten) sind als Props vorhanden. `fragen` und `abgaben` fehlen — müssen via `ladePruefung()` (für Fragen) und `ladeAbgaben()` beim Klick geladen werden. Button zeigt Loading-State während API-Calls, Fehler-Toast bei Fehlschlag.
- **KorrekturDashboard**: `korrektur`, `fragen` und `abgaben` sind bereits geladen.
- **Klasse**: Aus `SchuelerKorrektur.klasse`, `SchuelerAbgabe.klasse` oder `config.teilnehmer[].klasse` (erster verfügbarer Wert).

### Geänderte Dateien (erweitert)

4. **`src/components/lp/DurchfuehrenDashboard.tsx`** — `fragen` als Prop an BeendetPhase durchreichen (wird bereits geladen, aber nicht weitergegeben)

### Edge Cases

- SuS ohne Abgabe: Tab wird erstellt mit "Keine Abgabe" in Antwort-Spalte
- Teilkorrektur (nicht alle SuS bewertet): Punkte-Spalten leer für unkorrigierte SuS
- Fragen mit Teilaufgaben (Aufgabengruppe): Werden als separate Zeilen aufgeführt
- Tab-Name Duplikate: Bei gleichem Namen Suffix " (2)" anhängen
- Sonderzeichen in Tab-Namen: Excel-ungültige Zeichen entfernen (`[]:*?/\`)
