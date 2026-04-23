# Claude-Code Session Protocol

Leitfaden für jede Migration-Session. Wenn ich (Claude Code) diese Datei lese, weiss ich exakt was zu tun ist.

## Pro Session

### 1. State laden

```
Read state.json
```

Bestimme:
- `verarbeitet` — wie viele Fragen schon done
- `fragen` — Map von frage-ID → status

Wenn State-Datei nicht existiert: Phase 3 (Dump) ist noch nicht gelaufen — STOP und Partner fragen.

### 2. Next Batch auswählen

```
Read fragen-input.jsonl (vollständig)
```

Filter: `state.fragen[frage.id]?.status !== 'done'` UND `status !== 'skip'`.

Batch-Size:
- **Session 1 (Stichprobe):** 30 Fragen, spezifisch ausgewählt via `stichprobe-ids.json`
- **Sessions 2–14 (Full-Run alt):** 100 Fragen
- **Ab Session 15 (Full-Run neu):** 50 Fragen — Reduktion nach wiederholten Session-Ausfällen. Deterministische Reihenfolge (Fachbereich → Typ → ID) bleibt. Pro Session wird die erste Hälfte des 100er-Batches aus `show-batch.mjs` verarbeitet.

Wenn weniger Fragen übrig als Batch-Size: alle übrigen.

### 3. Pro Frage generieren

Für jede Frage im Batch:

1. **Parse Frage-Objekt** (Struktur-Check)
2. **Generiere Musterlösung** (2–4 Sätze, 60–80 Wörter) nach Spec §5
3. **Generiere Teilerklärungen** pro Sub-Element nach Fragetyp-Regel:

| Typ | Sub-Array | feld in teilerklaerung | ID-Feld |
|---|---|---|---|
| mc | optionen | optionen | id |
| richtigfalsch | aussagen | aussagen | id |
| lueckentext | luecken | luecken | id |
| hotspot | bereiche | bereiche | id |
| dragdrop_bild | zielzonen | zielzonen | id |
| bildbeschriftung | beschriftungen | beschriftungen | id |
| kontenbestimmung | aufgaben | aufgaben | id |
| buchungssatz | buchungen | buchungen | id |
| bilanzstruktur | kontenMitSaldi | kontenMitSaldi | **kontonummer** |
| zuordnung | paare | _keine IDs — leer lassen_ | — |
| tkonto, sortierung, freitext, berechnung, zeichnen, audio, code, pdf, formel, visualisierung, aufgabengruppe | — | _keine Sub-Struktur — leer lassen_ | — |

4. **Validiere Output-Shape:**
   - Jede Teilerklärung hat `feld` + `id` + `text` (alle Strings, `text.length > 0`)
   - `feld` aus obiger Tabelle
   - `id` muss in der Frage-Sub-Array existieren (kein Halluzinieren)
   - Exakt **eine** Teilerklärung pro Sub-Element (keine Duplikate)

5. **Append als JSON-Zeile an `fragen-updates.jsonl`:**

   ```json
   {"id":"uuid-1","fachbereich":"BWL","musterlosung":"Gesamterklärung 2-4 Sätze.","teilerklaerungen":[{"feld":"optionen","id":"opt-a","text":"Warum korrekt/falsch..."},...]}
   ```

6. **Update state.json:**

   ```json
   "fragen": { "uuid-1": { "status": "done", "zeitpunkt": "ISO", "teile": 4 } }
   ```

   Bei Fehler (Frage unlesbar / fachlich unsicher / etc.):

   ```json
   "fragen": { "uuid-1": { "status": "skip", "grund": "...", "zeitpunkt": "ISO" } }
   ```

   **WICHTIG:** Skip-Fragen kommen NICHT in `fragen-updates.jsonl`.

### 4. State speichern + Summary

Nach allen Fragen des Batches:

1. Write `state.json` (kompletter State, nicht nur Delta).
2. Print Summary an User:

```
Session N done.
  Verarbeitet diese Session: 100 (done=98, skip=2)
  Total: 1230/2397 (51.3%)
  Skip-Fragen: uuid-42 (grund), uuid-78 (grund)
  Zeitbudget diese Session: ~55 Min
```

### 5. Git-Status
State + Updates-Dateien sind in `.gitignore` — nicht committet.

Commit passiert NUR nach Phase 6 Upload (Migration komplett).

## Qualitäts-Baseline (aus Spec §5)

Vor **jeder** Generierung mental durchgehen:

1. **1–2 Sätze, max 30 Wörter** pro Teilerklärung.
2. **Schweizer Hochdeutsch** (ss statt ß, Franken, Schweizer Institutionen).
3. **Distraktoren** (MC/RF falsch): Denkfehler benennen, nicht nur „falsch".
4. **Korrekte Optionen:** Begründen warum, nicht wiederholen.
5. **Recht-Artikel** NUR wenn sicher. Whitelist: OR 1, 41, 62, 184, 394, 538; ZGB 1, 2, 8, 641, 817. Im Zweifel weglassen.
6. **Keine Füllwörter:** „selbstverständlich", „offensichtlich", „man sieht leicht ein" → streichen.
7. **Neutrale 3. Person**, keine Anrede.
8. **Zahlen:** Schweizer Format `1'500` (Apostroph), `4.5` (Punkt-Dezimal).
9. **Zitate:** Chevrons («…»).
10. **Plain-Text**, kein Markdown (`**fett**`, `_kursiv_` wird nicht gerendert).

## Fachbereichs-Besonderheiten

**VWL:**
- Modelle präzise (Angebot/Nachfrage-Axen, Konjunktur-Zyklus-Phasen, SNB-Funktionen)
- Indikatoren mit Zeithorizont (z.B. „BIP misst quartalsweise", „Arbeitslosenquote monatlich")

**BWL:**
- Schweizer Kontenrahmen KMU (1000 Bank, 2000 Kreditoren, 3000 Warenertrag, etc.)
- Soll/Haben-Logik: Aktivkonten zunahme=Soll, Passiv zunahme=Haben, Aufwand=Soll, Ertrag=Haben
- CHF-Beträge: Schweizer Format

**Recht:**
- Tatbestand-Struktur (Vertragsabschluss: Antrag + Annahme; Eigentumserwerb: Besitz + Wille; etc.)
- OR-Artikelnummern NUR aus Whitelist. Sonst abstrakt formulieren.
- Keine Fall-Analyse in Teilerklärungen — nur Rechtsgrundsätze.

## Fehlerbehandlung

Falls Frage nicht bearbeitbar (kaputte Daten, Unklarheit, fachlich unsicher):

- `state.fragen[id] = {status:'skip', grund:'...', zeitpunkt:ISO}`
- NICHT an `fragen-updates.jsonl` appenden
- Weiter mit nächster Frage
- Am Session-Ende: Liste der Skip-Fragen im Summary. User kann manuell nacharbeiten.

## Nach Session-Ende

Ich melde im Chat:
```
Session N fertig.
Total: X/2397 verarbeitet (Y%)
Skipped diese Session: [Liste]
Bereit für Session N+1. Soll ich starten, oder Pause?
```

User entscheidet ob nächste Session direkt oder später.
