# Claude-Code Session Protocol — Lückentext-Migration Phase 7

Leitfaden für jede Claude-Code-Migration-Session. Wenn ich (Claude Code)
diese Datei lese, weiss ich exakt was zu tun ist.

## Ziel

Pro Lückentext-Frage im Batch: generiere pro Lücke

1. `korrekteAntworten`: Hauptantwort + 2–3 Synonyme / Schreibvarianten (Schweizer vs. deutsche Schreibweise, Umlaute ae/ä, Kurz-/Langform). Hauptantwort = Index 0. Alle Varianten 100 % korrekt.
2. `dropdownOptionen`: **Genau 5** Einträge = 1 Korrekte (= `korrekteAntworten[0]`) + 4 Distraktoren aus dem gleichen semantischen Feld. **Keine Synonyme der Korrekten** als Distraktoren.

Vollständige Regeln siehe `prompt-template.md`.

## Pro Session

### 1. State / Input laden

```
Read prompt-template.md
Read <input-datei>
```

Wobei `<input-datei>` je nach Phase variiert:

- **Session 1 (Stichprobe):** `stichprobe.json` — 15 Fragen (5 VWL + 5 BWL + 5 Recht, seed=42).
- **Sessions 2+ (Full-Run):** Batch-Datei (z.B. `batch-BWL-s1.json`) oder eine Teilmenge aus `fragen-dump.json`.

Wenn `fragen-dump.json` oder `stichprobe.json` fehlt: Phase B/C noch nicht gelaufen — STOP und Partner fragen.

### 2. Pro Frage im Batch generieren

Für jede Frage:

1. **Parse Frage-Objekt** — Struktur-Check:
   - `id` (string)
   - `fachbereich` (VWL / BWL / Recht / Informatik)
   - `textMitLuecken` (string)
   - `luecken[]` mit je `{ id, caseSensitive }`
2. **Fach-Kontext** aktivieren (siehe `prompt-template.md` → Fachbereichs-Besonderheiten):
   - **VWL:** Modelle präzise, SNB, BIP, Konjunktur
   - **BWL:** Schweizer Kontenrahmen KMU, CHF-Format
   - **Recht:** Tatbestand-Struktur, OR-Whitelist (OR 1, 41, 62, 184, 394, 538; ZGB 1, 2, 8, 641, 817) — sonst abstrakt
3. **Pro Lücke:**
   - Hauptantwort präzise fachlich korrekt
   - 2–3 Synonyme (Schreibvarianten, Kurz-/Langform)
   - 4 plausible Distraktoren aus dem gleichen semantischen Feld, keine Synonyme der Korrekten, keine absurden Optionen
4. **Validate Output-Shape pro Lücke:**
   - `korrekteAntworten` ≥ 1 Eintrag, ≤ 4 Einträge
   - `dropdownOptionen` **genau 5** Einträge, keine Duplikate (case-insensitive)
   - `dropdownOptionen` enthält `korrekteAntworten[0]`
   - `luecken[].id` exakt aus Input übernommen (kein Halluzinieren)

### 3. Output-Array schreiben

Am Ende **ein einziges JSON-Array** mit einem Objekt pro Input-Frage. Keine
Kommentare, keine Fliesstext-Einleitung. Schema:

```json
[
  {
    "id": "<uuid>",
    "fachbereich": "BWL",
    "luecken": [
      {
        "id": "luecke-0",
        "korrekteAntworten": ["Hauptantwort", "Synonym1", "Synonym2"],
        "dropdownOptionen": ["Hauptantwort", "Distraktor1", "Distraktor2", "Distraktor3", "Distraktor4"]
      }
    ]
  }
]
```

User speichert den Output als:
- Session 1: `stichprobe-response.json`
- Sessions 2+: `batch-<fachbereich>-sN.json` oder `batch-sN.json` (für gemischte)

### 4. Skip-Fälle

Falls eine Frage nicht sauber bearbeitet werden kann (kaputte Daten,
fachlich unsicher, keine klare Hauptantwort):

- **NICHT ins Output-Array aufnehmen.**
- Am Session-Ende dem User melden: `Skipped: <id> — <Grund>`

User kann diese Fragen manuell im Editor nachziehen.

## Qualitäts-Baseline (aus `prompt-template.md`)

Vor **jeder** Generierung mental durchgehen:

1. **Schweizer Hochdeutsch:** `ss` statt `ß`, Schweizer Begriffe (SNB, AHV, IV, OR/ZGB).
2. **Fachbegriffe in Schweizer Schreibweise.**
3. **Zahlen / Währung:** Schweizer Format (`1'500`, `4.5`). Keine deutsche Punkt-Notation.
4. **Recht-Artikel** nur aus der OR-Whitelist (OR 1, 41, 62, 184, 394, 538; ZGB 1, 2, 8, 641, 817). Sonst abstrakt formulieren oder weglassen.
5. **Distraktoren** plausibel, aus gleichem Thema — nicht absurd, nicht thematisch fremd.
6. **Keine Meta-Distraktoren** («nichts davon», «alle richtig»).
7. **Keine Dopplungen** zwischen Hauptantwort und Distraktoren (auch nicht flexionsvariante).
8. **Zahlen/Jahreszahlen/Artikelnummern:** Distraktoren sind naheliegende falsche Werte (z.B. für «1848» → 1845, 1850, 1871, 1874).

## Nach Session-Ende

Ich melde dem User:

```
Session <Name> fertig.
  Verarbeitet: X Fragen (Y Lücken total)
  Skipped: [Liste mit Gründen]
  Output gespeichert als: <datei>.json
  Nächster Schritt: node review-generator.mjs (Stichprobe) ODER node upload.mjs <datei> (Full-Run)
```

## Fehlerbehandlung im Batch

Wenn Claude (ich) während der Generierung merkt, dass viele Fragen im Batch
eine systematische Unschärfe haben (z.B. Thema fremd, Formulierung mehrdeutig,
alte Fragen mit ungewöhnlichem Stil): **STOP und Partner fragen**, ob der
Batch neu gezogen werden soll oder ob die Unschärfe akzeptabel ist.

Besser ein Batch abgebrochen + neu geplant als 50 halbgare Antworten.
