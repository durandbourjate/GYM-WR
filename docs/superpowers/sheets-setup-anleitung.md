# Google Sheets Setup-Anleitung

**Datum:** 23.03.2026
**Zweck:** 4 Google Sheets als zentrale Datenschicht fuer Unterrichtsplaner, Pruefungsplattform und Uebungspools
**Referenz:** `docs/superpowers/specs/2026-03-23-tool-synergien-design.md`

---

## Uebersicht

| Sheet | Name | Tabs |
|-------|------|------|
| 1 | **Kurse** | 1 Meta-Tab + 8 SuS-Tabs |
| 2 | **Stundenplan** | 1 Tab |
| 3 | **Schuljahr** | 4 Tabs (Semester, TaF-Phasen, Ferien, Sonderwochen) |
| 4 | **Lehrplan** | 2 Tabs (Lehrplanziele, Beurteilungsregeln) |

Jedes Sheet ist ein eigenstaendiges Google Spreadsheet (eigene URL, eigene Sheet-ID).

---

## kursId-Format

Zentraler Primaerschluessel ueber alle Sheets:

```
{gefaess}-{fach}-{klassen}     (wenn gefaess ≠ fach, z.B. sf-wr-29c, ewr-29fs)
{gefaess}-{klassen}            (wenn gefaess = fach, z.B. in-28c, ks-27a)
```

Alle Buchstaben klein, keine Leerzeichen, kein Schuljahr-Suffix.

| Kurs | kursId |
|------|--------|
| SF WR GYM1 (29c) | `sf-wr-29c` |
| SF WR GYM2 (28bc29fs) | `sf-wr-28bc29fs` |
| SF WR GYM3 (27a28f) | `sf-wr-27a28f` |
| IN 28c | `in-28c` |
| IN 29f | `in-29f` |
| IN 30s | `in-30s` |
| KS 27a | `ks-27a` |
| EWR 29fs | `ewr-29fs` |

---

## Sheet 1: Kurse

### Neues Google Spreadsheet erstellen

**Name:** `DUY Kurse 25/26`

### Tab 1: "Kurse" (Meta-Tab)

Dieser Tab listet alle Kurse auf. Spalten:

| kursId | label | fach | gefaess | lpEmail | klassen | aktiv |
|--------|-------|------|---------|---------|---------|-------|
| sf-wr-29c | SF WR 29c | WR | SF | yannick.durand@gymhofwil.ch | 29c | TRUE |
| sf-wr-28bc29fs | SF WR 28bc29fs | WR | SF | yannick.durand@gymhofwil.ch | 28bc,29fs | TRUE |
| sf-wr-27a28f | SF WR 27a28f | WR | SF | yannick.durand@gymhofwil.ch | 27a,28f | TRUE |
| in-28c | IN 28c | IN | IN | yannick.durand@gymhofwil.ch | 28c | TRUE |
| in-29f | IN 29f | IN | IN | yannick.durand@gymhofwil.ch | 29f | TRUE |
| in-30s | IN 30s | IN | IN | yannick.durand@gymhofwil.ch | 30s | TRUE |
| ks-27a | KS 27a | KS | KS | yannick.durand@gymhofwil.ch | 27a | TRUE |
| ewr-29fs | EWR 29fs | WR | EWR | yannick.durand@gymhofwil.ch | 29fs | TRUE |

**Hinweise:**
- `klassen`: kommasepariert, wenn mehrere Klassen im selben Kurs
- `aktiv`: auf `FALSE` setzen, um einen Kurs auszublenden (z.B. nach Schuljahresende)
- `gefaess`: SF, EF, EWR, GF, KS, IN

### Tabs 2-9: SuS-Listen (je ein Tab pro Kurs)

Fuer jeden Kurs einen eigenen Tab anlegen. **Tab-Name = Wert aus Spalte `label`**.

Tab-Namen:
1. `SF WR 29c`
2. `SF WR 28bc29fs`
3. `SF WR 27a28f`
4. `IN 28c`
5. `IN 29f`
6. `IN 30s`
7. `KS 27a`
8. `EWR 29fs`

Jeder SuS-Tab hat folgende Spaltenstruktur:

| name | email | klasse |
|------|-------|--------|
| Muster Anna | anna.muster@stud.gymhofwil.ch | 29c |
| Beispiel Max | max.beispiel@stud.gymhofwil.ch | 29c |

**Hinweise:**
- `name`: Nachname Vorname (fuer Sortierung)
- `email`: Schul-E-Mail der SuS (fuer Google-Integration)
- `klasse`: Bei Mischklassen (z.B. 28bc29fs) die tatsaechliche Stammklasse eintragen
- Die SuS-Daten hier eintragen (du hast die Daten) -- keine Beispieldaten hier, nur die Struktur

---

## Sheet 2: Stundenplan

### Neues Google Spreadsheet erstellen

**Name:** `DUY Stundenplan 25/26`

### Tab: "Stundenplan"

Ein Kurs kann mehrere Zeilen haben (z.B. SF WR 29c hat Dienstag 1L und Donnerstag 2L).

| kursId | wochentag | lektionen | zeit | raum | halbklasse | semester | bemerkung |
|--------|-----------|-----------|------|------|------------|----------|-----------|
| sf-wr-29c | Di | 1 | 09:00-09:45 | | FALSE | 1,2 | |
| sf-wr-29c | Do | 2 | 10:05-11:45 | | FALSE | 1,2 | |
| sf-wr-28bc29fs | Di | 2 | 15:35-17:10 | | FALSE | 1,2 | |
| sf-wr-28bc29fs | Do | 1 | 09:00-09:45 | | FALSE | 1,2 | |
| sf-wr-27a28f | Di | 2 | 13:40-15:20 | | FALSE | 1,2 | |
| sf-wr-27a28f | Do | 2 | 13:40-15:20 | | FALSE | 1,2 | |
| in-28c | Di | 1 | 13:40-14:25 | | FALSE | 1 | |
| in-28c | Di | 2 | 10:05-11:45 | | TRUE | 1 | Praktikum |
| in-28c | Mo | 2 | 10:05-11:45 | | TRUE | 2 | |
| in-29f | Di | 2 | 14:35-16:20 | | TRUE | 1 | Praktikum |
| in-29f | Di | 1 | 13:40-14:25 | | FALSE | 2 | |
| in-30s | Mi | 2 | 08:05-09:45 | | FALSE | 1,2 | Phasenunterricht |
| ks-27a | Mo | 1 | 10:05-10:50 | | FALSE | 1 | |
| ks-27a | Do | 1 | 16:25-17:10 | | FALSE | 2 | |
| ewr-29fs | Di | 1 | 12:50-13:35 | | FALSE | 1 | +1L Auftrag |
| ewr-29fs | Do | 1 | 12:50-13:35 | | FALSE | 2 | |

**Hinweise:**
- `raum`: Spalte leer lassen, selbst eintragen
- `halbklasse`: TRUE wenn nur halbe Klasse (Praktikum), sonst FALSE
- `semester`: 1, 2 oder 1,2 (kommasepariert, wenn ganzjaehrig)
- `bemerkung`: z.B. "Praktikum", "Phasenunterricht", "+1L Auftrag"

---

## Sheet 3: Schuljahr

### Neues Google Spreadsheet erstellen

**Name:** `DUY Schuljahr 25/26`

### Tab 1: "Semester"

Zuordnung der Kurse zu den SF-Semestern (S1-S8). Basiert auf der Stoffverteilung.

| kursId | semester | startKW | endKW | schuljahr | faecher |
|--------|----------|---------|-------|-----------|---------|
| sf-wr-29c | S1 | 33 | 3 | 2526 | BWL 3 |
| sf-wr-29c | S2 | 7 | 27 | 2526 | Recht 1, BWL 2 |
| sf-wr-28bc29fs | S3 | 33 | 3 | 2526 | Recht 2, BWL 1, VWL 2 |
| sf-wr-28bc29fs | S4 | 7 | 27 | 2526 | Recht 3, VWL 2 |
| sf-wr-27a28f | S5 | 33 | 3 | 2526 | Recht 2, VWL 2 |
| sf-wr-27a28f | S6 | 7 | 27 | 2526 | BWL 2, VWL 2 |
| in-28c | S1 | 33 | 3 | 2526 | IN |
| in-28c | S2 | 7 | 27 | 2526 | IN |
| in-29f | S1 | 33 | 3 | 2526 | IN |
| in-29f | S2 | 7 | 27 | 2526 | IN |
| in-30s | S1 | 33 | 3 | 2526 | IN |
| in-30s | S2 | 7 | 27 | 2526 | IN |
| ks-27a | S1 | 33 | 3 | 2526 | KS |
| ks-27a | S2 | 7 | 27 | 2526 | KS |
| ewr-29fs | S1 | 33 | 3 | 2526 | WR |
| ewr-29fs | S2 | 7 | 27 | 2526 | WR |

**Hinweise:**
- `startKW`/`endKW`: Wenn endKW < startKW, bedeutet das Jahreswechsel (z.B. KW 33 bis KW 3 = August bis Januar)
- `faecher`: Grobverteilung aus der Stoffverteilung (Anzahl = Gewichtung in der Semesterplanung). Fuer Nicht-SF-Kurse einfach das Fach eintragen.
- `semester`: S1/S2 fuer GYM1, S3/S4 fuer GYM2, S5/S6 fuer GYM3 usw. IN/KS/EWR nutzen S1/S2.

### Tab 2: "TaF-Phasen"

Gilt fuer TaF-Klassen (30s = IN Phasenunterricht).

| phase | startKW | endKW | schuljahr | bemerkung |
|-------|---------|-------|-----------|-----------|
| P1 | 33 | 40 | 2526 | 8 Wochen, inkl. IW 38 |
| P2 | 47 | 5 | 2526 | 8 Wochen, inkl. IW 46 |
| P3 | 7 | 12 | 2526 | 6 Wochen, inkl. IW 12 |
| P4 | 17 | 25 | 2526 | 8 Wochen, inkl. IW 14 + 25 |

**Hinweis:** Zwischen den Phasen liegen Ferien und unterrichtsfreie Phasen (TaF-Klassen haben kein durchgehendes Semester).

### Tab 3: "Ferien"

| label | startKW | endKW | schuljahr | tage |
|-------|---------|-------|-----------|------|
| Herbstferien | 39 | 41 | 2526 | |
| Weihnachtsferien | 52 | 1 | 2526 | |
| Sportferien | 6 | 6 | 2526 | |
| Fruehlingsferien | 15 | 16 | 2526 | |
| Auffahrt | 20 | 20 | 2526 | Do, Fr |
| Pfingstmontag | 22 | 22 | 2526 | Mo |
| Sommerferien | 28 | 32 | 2526 | |

**Hinweis:**
- `tage`: Nur ausfuellen, wenn nicht die ganze Woche betroffen ist (z.B. Auffahrt = nur Do+Fr)
- Auffahrt und Pfingstmontag sind einzelne Tage, keine ganzen Wochen

### Tab 4: "Sonderwochen"

| kw | label | gymLevel | schuljahr | typ |
|----|-------|----------|-----------|-----|
| 38 | Klassenwoche | GYM1 | 2526 | IW |
| 38 | IW TaF (G&K/MU/SP) | TaF | 2526 | IW |
| 38 | SOL-Projekt | GYM2 | 2526 | IW |
| 38 | Franzaufenthalt / Kompensation | GYM3 | 2526 | IW |
| 38 | Studienreise | GYM4 | 2526 | IW |
| 46 | IW TaF (G&K/MU/SP) | TaF | 2526 | IW |
| 12 | Schneesportlager | GYM2 | 2526 | Schneesport |
| 14 | Gesundheit / Nothilfekurs | GYM1 | 2526 | IW |
| 14 | Deutsch | GYM2 | 2526 | IW |
| 14 | EF-Woche | GYM3 | 2526 | IW |
| 14 | Franzoesisch/Englisch | GYM4 | 2526 | IW |
| 25 | Geografie und Sport | GYM1 | 2526 | IW |
| 25 | Wirtschaftswoche | GYM2 | 2526 | IW |
| 25 | Maturaarbeit | GYM3 | 2526 | IW |
| 25 | Maturpruefung | GYM4 | 2526 | IW |
| 27 | Medienwoche | GYM1 | 2526 | IW |
| 27 | Spezialwoche TaF | TaF | 2526 | IW |
| 27 | MINT | GYM2 | 2526 | IW |
| 27 | Schwerpunktfach | GYM3 | 2526 | SF-Woche |

**Hinweis:**
- `gymLevel`: GYM1, GYM2, GYM3, GYM4 oder TaF
- `typ`: IW (Intensivwoche), Schneesport, SF-Woche etc.
- In KW 46 und 12 haben die meisten Stufen normalen Unterricht -- nur die aufgelisteten Stufen haben Sonderwochen

---

## Sheet 4: Lehrplan

### Neues Google Spreadsheet erstellen

**Name:** `DUY Lehrplan 25/26`

### Tab 1: "Lehrplanziele"

Zwei Ebenen: Grobziele (Lehrplan LP17) und Feinziele ("Ich kann...").

| id | ebene | parentId | fach | gefaess | semester | thema | text | bloom |
|----|-------|----------|------|---------|----------|-------|------|-------|
| B-Z1-01 | grob | | BWL | SF | S1 | Unternehmen | Unternehmen, Unternehmensmodell, Stakeholder | |
| bwl_unt_01 | fein | B-Z1-01 | BWL | SF | S1 | Unternehmen | Ich kann die Elemente des St. Galler Unternehmensmodells benennen und erklaeren. | K2 |
| bwl_unt_02 | fein | B-Z1-01 | BWL | SF | S1 | Unternehmen | Ich kann Anspruchsgruppen eines Unternehmens identifizieren und deren Interessen analysieren. | K4 |
| R-Z1-01 | grob | | Recht | SF | S2 | OR AT | Vertragsrecht, Schuldrecht | |
| recht_or_01 | fein | R-Z1-01 | Recht | SF | S2 | OR AT | Ich kann die Voraussetzungen fuer einen gueltigen Vertrag erklaeren. | K2 |
| recht_or_02 | fein | R-Z1-01 | Recht | SF | S2 | OR AT | Ich kann einfache Rechtsfaelle zum Vertragsrecht loesen. | K3 |
| V-Z2-01 | grob | | VWL | SF | S3 | Angebot & Nachfrage | Marktmodell, Preisbildung, Elastizitaeten | |
| vwl_markt_01 | fein | V-Z2-01 | VWL | SF | S3 | Angebot & Nachfrage | Ich kann die Nachfragekurve herleiten und Verschiebungen erklaeren. | K3 |

**Hinweise:**
- Dies sind **Beispieldaten** zur Veranschaulichung der Struktur. Die vollstaendigen Lernziele werden spaeter per Tool importiert (aus den bestehenden Preset-JSONs und Pool-Configs).
- `ebene`: "grob" (Lehrplan LP17) oder "fein" (Ich-kann-Aussagen)
- `parentId`: Bei Feinzielen die ID des uebergeordneten Grobziels
- `bloom`: K1-K6 (nur bei Feinzielen), leer bei Grobzielen
- `semester`: S1-S8 gemaess Stoffverteilung
- ID-Format Grobziele: `{Fach-Buchstabe}-Z{Zyklus}-{Nummer}` (z.B. B-Z1-01, R-Z1-01, V-Z2-01)
- ID-Format Feinziele: `{fach}_{thema}_{nummer}` (z.B. bwl_unt_01, recht_or_01)

### Tab 2: "Beurteilungsregeln"

| label | deadline | minNoten | semester | stufe | wochenlektionenSchwelle | bemerkung |
|-------|----------|----------|----------|-------|------------------------|-----------|
| Standortbestimmung (Nov) | KW 45 | 1 | 1 | GYM1 | | Nur GYM1 |
| Semesterzeugnis | Ende Semester 1 | 2 | 1 | | | Alle Stufen |
| Jahreszeugnis (bis 3 WL) | Ende Schuljahr | 3 | Jahr | | 3 | Faecher mit max. 3 Wochenlektionen |
| Jahreszeugnis (ueber 3 WL) | Ende Schuljahr | 4 | Jahr | | 4 | Faecher mit mehr als 3 Wochenlektionen |
| Zwischenbericht GYM2+ | Ende Semester 1 | 1 | 1 | GYM2 | | GYM2 und hoeher |

**Hinweise:**
- `semester`: 1, 2 oder "Jahr" (uebers ganze Schuljahr)
- `stufe`: Wenn leer, gilt die Regel fuer alle Stufen
- `wochenlektionenSchwelle`: Bestimmt, ob die Regel fuer einen Kurs gilt (basierend auf Anzahl Wochenlektionen)
- `minNoten`: Mindestanzahl Noten, die gesetzt sein muessen

---

## Nach dem Erstellen: Sheet-IDs finden

Jedes Google Sheet hat eine eindeutige ID in der URL:

```
https://docs.google.com/spreadsheets/d/SHEET_ID_HIER/edit
```

Beispiel:
```
https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       Das ist die Sheet-ID
```

Notiere dir die 4 Sheet-IDs:

| Sheet | Name | Sheet-ID |
|-------|------|----------|
| 1 | DUY Kurse 25/26 | _________________________ |
| 2 | DUY Stundenplan 25/26 | _________________________ |
| 3 | DUY Schuljahr 25/26 | _________________________ |
| 4 | DUY Lehrplan 25/26 | _________________________ |

Diese IDs werden spaeter im Apps Script hinterlegt, damit die Tools auf die Sheets zugreifen koennen.

---

## Berechtigungen einrichten

Damit die Apps (Unterrichtsplaner, Pruefungsplattform) ueber Apps Script auf die Sheets zugreifen koennen, muessen die Sheets zugaenglich sein.

### Option A: Gleicher Google-Account (empfohlen)

Wenn die Sheets im selben Google-Account liegen wie das Apps Script, ist keine weitere Freigabe noetig. Das Script hat automatisch Zugriff.

### Option B: Anderer Account / Service Account

Falls die Sheets in einem anderen Account liegen oder ein Service Account verwendet wird:

1. Oeffne jedes Sheet
2. Klicke auf **"Freigeben"** (oben rechts)
3. Fuege die E-Mail-Adresse des Apps Script / Service Accounts hinzu
4. Berechtigung: **"Bearbeiter"** (Lesen + Schreiben)
5. Wiederhole fuer alle 4 Sheets

### Apps Script konfigurieren

Im Apps Script (`apps-script-code.js`) muessen die Sheet-IDs hinterlegt werden. Die genaue Stelle wird bei der Implementierung der Synergy-Endpoints definiert. Grundstruktur:

```javascript
const SHEET_IDS = {
  kurse: 'SHEET_ID_1',
  stundenplan: 'SHEET_ID_2',
  schuljahr: 'SHEET_ID_3',
  lehrplan: 'SHEET_ID_4'
};
```

---

## Checkliste

- [ ] Sheet 1 (Kurse) erstellt mit Meta-Tab + 8 SuS-Tabs
- [ ] Sheet 2 (Stundenplan) erstellt und alle Zeilen eingetragen
- [ ] Sheet 3 (Schuljahr) erstellt mit 4 Tabs (Semester, TaF-Phasen, Ferien, Sonderwochen)
- [ ] Sheet 4 (Lehrplan) erstellt mit 2 Tabs (Lehrplanziele-Beispiele, Beurteilungsregeln)
- [ ] Raum-Spalte im Stundenplan ausgefuellt
- [ ] SuS-Daten in Sheet 1 eingetragen
- [ ] Alle 4 Sheet-IDs notiert
- [ ] Berechtigungen geprueft (Apps Script hat Zugriff)
