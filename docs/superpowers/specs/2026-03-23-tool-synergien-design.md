# Design: Tool-Synergien — Gemeinsame Datenschicht

**Datum:** 23.03.2026
**Scope:** 4 Synergien über Unterrichtsplaner, Prüfungsplattform und Übungspools
**Architektur:** Shared Data Layer via Google Sheets + Apps Script Gateway

## Kontext

Die drei Tools (Unterrichtsplaner, Prüfungsplattform, Übungspools) teilen viele Konzepte (Kurse, Fachbereiche, Lernziele, Themen), pflegen sie aber separat. Ziel: **eine Quelle pro Datentyp, drei Konsumenten.** Später optional Evento REST-API als Quelle.

## Architektur

```
┌─────────────────────────────────────────────────────┐
│                    Google Sheets                     │
│  Sheet 1: Kurse      Sheet 2: Stundenplan           │
│  Sheet 3: Schuljahr  Sheet 4: Lehrplan              │
│  (+ bestehend: Fragenbank, Configs, Korrektur)      │
└────────────────────────┬────────────────────────────┘
                         │
                  ┌──────┴──────┐
                  │ Apps Script │ ← einheitliche API
                  │  (Gateway)  │
                  └──────┬──────┘
              ┌──────────┼──────────┐
              ▼          ▼          ▼
       Prüfungs-    Unterrichts-   Übungs-
       plattform    planer         pools
```

**Planer-Fallback:** PWA ohne Backend → Daten via Apps Script laden + localStorage cachen. Offline: cached Daten. Manuelles Override bleibt möglich.

## Implementierungsreihenfolge

S1 (Kurse) → S3 (Pool-Statistiken) → S2 (Prüfung↔Planer) → S4 (Lernziel-DB)

---

## S1: Zentrale Kurs-Verwaltung

### Priorität: Hoch | Abhängigkeiten: Keine (Basis)

### Google Sheets

**Sheet 1 — Kurse**
- Meta-Tab "Kurse": `kursId`, `label` (z.B. "SF WR 28bc29fs"), `fach`, `gefaess` (SF/EF/EWR/GF/KS), `lpEmail`, `klassen` (kommasepariert), `aktiv`
- Pro Kurs ein Tab (Tab-Name = Kurslabel): Spalten `name`, `email`, `klasse`

**Sheet 2 — Stundenplan**
- Spalten: `kursId`, `wochentag` (Mo-Fr), `lektionen` (Anzahl), `zeit` (optional), `raum`
- Ein Kurs kann mehrere Zeilen haben (z.B. Mi 2L + Do 1L)

**Sheet 3 — Schuljahr**
- Tab "Semester": `kursId`, `semester` (S1-S8), `startKW`, `endKW`
- Tab "TaF-Phasen": `kursId`, `phase` (P1-P4), `startKW`, `endKW`
- Tab "Ferien": `label`, `startKW`, `endKW`
- Tab "Sonderwochen": `kw`, `label`, `gymLevel`, `typ` (IW/Schneesport/SF-Woche etc.)

**Sheet 4 — Lehrplan**
- Tab "Lehrplanziele": `id`, `fach`, `gefaess`, `semester`, `thema`, `text`, `bloom`
- Tab "Beurteilungsregeln": `gefaess`, `semester`, `minNoten`, `gewichtung`, `bemerkung`

### Apps Script Endpoints

```
ladeKurse(email)              → alle Kurse der LP
ladeKursDetails(kursId)       → SuS-Liste + Stundenplan + Phasen
ladeSchuljahr(email)          → Ferien + Sonderwochen + Semester + Phasen
ladeLehrplan(fach?, gefaess?) → Lehrplanziele + Beurteilungsregeln
```

### Integration pro Tool

| Tool | Heute | Neu |
|------|-------|-----|
| Prüfungstool | Kurs-Auswahl hardcoded in authStore | → `ladeKurse()` API, Dropdown dynamisch |
| Unterrichtsplaner | Manuelle Eingabe in CourseEditor + JSON-Presets | → `ladeKurse()` + `ladeSchuljahr()` + Preset-Fallback (offline) |
| Übungspools | Kein Kursbezug | Kein Bedarf (SuS-facing) |

### Migration

Bestehende Preset-JSONs (`ferien_hofwil_2526.json`, `sonderwochen_hofwil_2526.json`, `lehrplanziele_*.json`, `beurteilung_hofwil.json`) werden einmalig in die Sheets importiert. JSON-Dateien bleiben als Offline-Fallback.

### kursId-Format

Zentraler Primärschlüssel über alle Sheets: **`{gefaess}-{fach}-{klassen}`** (wenn gefaess != fach) bzw. **`{gefaess}-{klassen}`** (wenn gefaess = fach). Kein Schuljahr-Suffix.
Beispiele: `sf-wr-28bc29fs`, `ef-wr-27a`, `in-28c`, `ks-27a`, `ewr-29fs`

**Migration:**
- Planer: Grid-Layout-IDs (`c11`, `c31`) bleiben client-seitig für die Darstellung. `kursId` wird als neues Feld in CourseConfig ergänzt, das auf die zentrale ID verweist.
- Prüfungstool: Bestehende Prüfungen haben `klasse` (z.B. "28bc29fs"). Migration: `kursId` wird beim nächsten Laden der Prüfung automatisch aus Kurs-Sheet abgeleitet (Matching über Klassen-Substring).

### Feld-Mapping (bestehende Tools → zentrale Sheets)

| Konzept | Planer (EN) | Prüfungstool (DE) | Zentrale Sheet (DE) |
|---------|-------------|-------------------|---------------------|
| Kurs-ID | `id` (c11, c31) | `klasse` (String) | `kursId` (sf-wr-28bc29fs) |
| Fachbereich | `subjectArea` | `fachbereich` | `fach` |
| Gefäss | `typ` (SF/EF/EWR/KS/IN) | `gefaess` (SF/EF/EWR/GF) | `gefaess` (SF/EF/EWR/GF/KS/IN) |
| Spalte/Layout | `col` | — | — (bleibt client-seitig) |
| Halbklasse | `hk` | — | — (bleibt client-seitig) |
| Semester | `semesters[]` | `semester` | `semester` (S1-S8) |

**Sprach-Konvention:** Shared API-Felder auf Deutsch (Prüfungstool-Konvention, Mehrheit). Planer bekommt Mapper-Utility (`mapKursZuCourseConfig()`).

### KW-Konvention (Schuljahr-übergreifend)

KW-Werte in Sheet 3 beziehen sich immer auf das **Schuljahr** (Start August, Ende Juli). Wenn `endKW < startKW` → Jahreswechsel (z.B. startKW=47, endKW=5 = KW 47 bis KW 5 des Folgejahres). Zusätzlich `schuljahr`-Spalte (z.B. "2526") für Eindeutigkeit.

### Caching-Strategie (Planer PWA)

- **Online:** Beim App-Start Daten via Apps Script laden → localStorage speichern mit Zeitstempel
- **Offline:** Cached Daten verwenden. Anzeige: "Daten von [Datum] — Aktualisieren" Button
- **Cache-TTL:** 24h. Bei TTL-Überschreitung: Auto-Refresh wenn online, sonst stale-Warnung
- **Cache-Keys:** `synergy-kurse-{email}`, `synergy-schuljahr-{email}`, `synergy-lehrplan-{fach}` (kein Konflikt mit bestehenden 24 localStorage-Keys)
- **Geschätzte Grösse:** ~50 KB pro Datentyp, total ~200 KB (weit unter 5 MB Limit)

### Auth für Planer → Apps Script

Planer nutzt dasselbe Apps Script Deployment wie Prüfungstool. LP-Email wird als Parameter übergeben (akzeptabel für Single-Teacher-System). Apps Script validiert `@gymhofwil.ch` Domain.

### Datenvalidierung

Apps Script Endpoints validieren:
- `kursId` referenzielle Integrität (Sheet 2-4 → Sheet 1)
- `fach`/`gefaess` gegen Enum-Werte
- KW-Bereiche auf Plausibilität (1-53)
Bei Fehlern: Warnung im Response, nicht blockierend.

### Evento-Vorbereitung

Die Sheet-Struktur ist so gewählt, dass sie 1:1 durch Evento-Daten ersetzt werden kann. `ladeKurse()` und `ladeKursDetails()` wechseln intern die Quelle (Sheet → Evento API), Konsumenten merken nichts.

### Jährliche Wartung

Vor jedem Schuljahr: Sheet-Daten für neues SJ anlegen. Alte JSON-Presets als Offline-Fallback mit aktuellem Stand exportieren (manuell oder via Script).

---

## S2: Prüfung ↔ Planer Bridge

### Priorität: Hoch | Abhängigkeiten: S1 (Kurse)

### Prinzip: Nur Meta-Daten teilen, keine Einzelnoten

| Datenpunkt | Geteilt? | Begründung |
|-----------|----------|-----------|
| Prüfung existiert (Titel, Datum, Kurs) | ✅ | Meta-Info |
| Anzahl gesetzte Noten | ✅ | Nur Zähler |
| Fehlende SuS (Namen) | ✅ | Für Nachprüfungen |
| ∅ Note, Notenverteilung | ❌ | Datenschutz, bleibt im Prüfungstool |
| Einzelnoten pro SuS | ❌ | Datenschutz, bleibt im Prüfungstool |

### Endpoint

```
ladeNotenStand(email) → {
  kurse: [{
    kursId, label, gefaess, semester,
    erforderlicheNoten,       // aus Beurteilungsregeln (Sheet 4)
    vorhandeneNoten,          // Anzahl Prüfungen mit Noten
    pruefungen: [{
      pruefungId, titel, datum,
      hatNoten: boolean,
      anzahlSuS: number,
      fehlendeSuS: [{ name }]
    }]
  }]
}
```

### Planer-Integration

- **Badge an Lektion:** "Prüfung ✓" (durchgeführt) oder "Prüfung ✓ benotet"
- **Noten-Stand-Anzeige:** "SF WR 28bc: 2/4 Noten gesetzt" (nur Zähler)
- **Automatische Verknüpfung:** Prüfung (Kurs X, Datum Y) → Lektion in passender KW/Kurs
- **Link zum Prüfungstool:** Für Details (Notenverteilung etc.)

### Prüfungstool-Integration

- Tracker-Tab: Noten-Stand pro Kurs mit Fortschrittsbalken
- Fehlende SuS: Nachprüfungs-Hinweis

### Performance-Überlegung

`ladeNotenStand()` aggregiert über Configs + Korrektur-Sheets. Ansatz: bestehenden `ladeTrackerDaten`-Endpoint erweitern statt neuen Endpoint. Der Tracker lädt bereits alle Prüfungs-Summaries — `erforderlicheNoten` aus Sheet 4 dazuladen ist ein zusätzlicher Sheet-Read, kein neuer Aggregations-Durchlauf.

---

## S3: Pool-Statistiken → Prüfungstool

### Priorität: Mittel | Abhängigkeiten: Keine (nutzt bestehende Daten)

### Ansatz

Keine LearningView-Anbindung nötig. Die bestehenden `FragenPerformance`-Daten (Lösungsquote + Trennschärfe über alle Prüfungen) werden beim Zusammenstellen einer Prüfung angezeigt.

### Anzeige im PruefungsComposer

Pro Frage ein Info-Badge:
```
Was ist das BIP?                          VWL  MC  3P
∅ 72% · TS 0.38 · 3× verwendet · 45 SuS
░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓
```

### Warnungen

| Situation | Warnung |
|-----------|---------|
| Lösungsquote > 90% | "Sehr leicht" |
| Lösungsquote < 20% | "Sehr schwer" |
| Trennschärfe < 0.2 | "Schlechte Differenzierung" |
| Noch nie verwendet | "Keine Statistiken" (neutral) |

### Schwierigkeit anpassen (optional)

Nach Korrektur: Vorschlag "Frage hat Schwierigkeit 1, aber ∅ 28% → auf 3 anpassen?" LP bestätigt oder verwirft. Keine automatische Änderung.

### Technisch

Kein neuer Endpoint. `FragenPerformance` ist bereits im `FragenBrowser` geladen (`fragenStats` State). Muss an die Fragen-Auswahl im Composer-Tab (`AbschnitteTab.tsx` / `FragenAuswahlDialog`) durchgereicht werden. Der Composer-Tab heisst aktuell "Fragen" im `PruefungsComposer.tsx`.

---

## S4: Zentrale Lernziel-DB

### Priorität: Mittel | Abhängigkeiten: S1 + S2 + S3

### Datenmodell: Zwei Ebenen

Die bestehenden Lernziele haben **zwei Granularitätsstufen** die beibehalten werden:

**Ebene 1 — Grobziele (Lehrplan LP17):** Breite Kompetenzbeschreibungen pro Fach/Zyklus. Aktuell im Planer als Preset-JSON (IDs wie `R-Z1-01`, `V-Z2-03`). Der Planer referenziert diese pro Sequenz.

**Ebene 2 — Feinziele ("Ich kann…"):** Granulare, prüfbare Aussagen. Aktuell in den Pool-Configs als Freitext-Strings. Das Prüfungstool referenziert diese pro Frage.

Beide Ebenen in Sheet 4 "Lehrplan", Tab "Lehrplanziele":

```
id           | ebene | parentId    | fach  | gefaess | semester | thema              | text                                      | bloom
─────────────┼───────┼─────────────┼───────┼─────────┼──────────┼────────────────────┼───────────────────────────────────────────┼──────
V-Z2-03      | grob  | —           | VWL   | SF      | S5       | Geld & Geldpolitik | Geld, Geldpolitik, Finanzmärkte           | —
vwl_geld_01  | fein  | V-Z2-03     | VWL   | SF      | S5       | Geld & Geldpolitik | Ich kann die Funktionen von Geld erklären | K2
vwl_geld_02  | fein  | V-Z2-03     | VWL   | SF      | S5       | Geld & Geldpolitik | Ich kann die Geldmengenaggregate…         | K2
R-Z1-01      | grob  | —           | Recht | SF      | S4       | OR AT              | Vertragsrecht, Schuldrecht                | —
recht_or_01  | fein  | R-Z1-01     | Recht | SF      | S4       | OR AT              | Ich kann die Vertragsvoraussetzungen …    | K3
```

**ID-Migration:**
- Planer Grobziele: behalten bestehende IDs (`R-Z1-01` etc.), `ebene: 'grob'`
- Pool Feinziele: bekommen neue IDs (`{poolId}_{thema}_{index}`), `ebene: 'fein'`, `parentId` → Grobziel
- Deduplizierung: Pool-Feinziele mit identischem Text werden zusammengeführt

### S4 in zwei Phasen

**S4a — Zentrale DB + Lookups:** Sheet befüllen, Endpoints, Tools referenzieren zentrale IDs
**S4b — Abdeckungs-Analyse:** Cross-Tool-Auswertung (unterrichtet/geübt/geprüft). Erst wenn alle 3 Tools zentrale IDs nutzen.

### Integration pro Tool

| Tool | Heute | Neu |
|------|-------|-----|
| Übungspools | `POOL_META.lernziele[]` (Freitext) | Bleibt als Anzeige + ergänzt um `lernzielIds[]` → zentrale IDs |
| Prüfungstool | `lernzielIds[]` pro Frage, Import aus Pool-Sync | Import aus Lehrplan-Sheet (zentral statt Pool-spezifisch) |
| Unterrichtsplaner | `curriculumGoal` (Freitext) | Erweitern: `lernzielIds[]` pro Sequenz/Block, Dropdown |

### Abdeckungs-Analyse

```
Lernziel: "Ich kann die Funktionen von Geld erklären (K2)"
├── Unterrichtet: Sequenz "Geld" KW 47-49 (Planer)
├── Geübt: Pool vwl_geld, 12 Fragen (Pools)
├── Geprüft: 2×, ∅ 68%, TS 0.35 (Prüfungstool)
└── Status: ✅ unterrichtet + geübt + geprüft
```

Pro Kurs/Semester: "15 von 22 Lernzielen abgedeckt, 7 noch offen"

### Anzeige

**Unterrichtsplaner:** Badge "8/12 LZ" pro Sequenz + Overlay "Lernziel-Abdeckung" (Ampel)
**Prüfungstool:** Beim Zusammenstellen: "deckt LZ vwl_geld_01 ab — 2× geprüft". Im Tracker: "15/22 LZ geprüft"

### Endpoints

```
ladeLernziele(fach?, gefaess?, semester?) → Lernziel[]
ladeLernzielAbdeckung(kursId)            → [{ lernzielId, unterrichtet, geuebt, geprueft }]
```

### Befüllung

1. Einmalig: Presets + Pool-Lernziele importieren, deduplizieren, IDs vergeben
2. Laufend: LP pflegt in Sheet. Pool-Sync gleicht mit zentralen IDs ab.

---

## Gesamtübersicht

| # | Synergie | Neue Sheets | Neue Endpoints | Konsumenten | Aufwand |
|---|----------|-------------|---------------|-------------|---------|
| S1 | Kurs-Verwaltung | 4 (Kurse, Stundenplan, Schuljahr, Lehrplan) | 4 | Alle 3 | Gross |
| S2 | Prüfung↔Planer | 0 | 1 | Prüfungstool + Planer | Mittel |
| S3 | Pool-Statistiken | 0 | 0 | Prüfungstool | Klein |
| S4 | Lernziel-DB | 0 (nutzt Sheet 4) | 2 | Alle 3 | Gross |

### Nicht in Scope

- Evento-Integration (spätere Phase, ersetzt Sheet 1-3)
- Multi-LP / Skalierung (erst wenn DUY-Version stabil)
- Live-Sync / Cloud-Backend für Planer (erst wenn Planer definitiv)
- LearningView-Analytics (kein API-Zugang)
