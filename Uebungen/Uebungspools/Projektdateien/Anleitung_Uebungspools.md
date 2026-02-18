# Anleitung: Modulare Ãœbungspools erstellen und verwalten

## Zweck
Dieses Dokument beschreibt das **modulare Ãœbungspool-System** fÃ¼r den Unterricht in Wirtschaft und Recht am Gymnasium Hofwil. Das System trennt das universelle Template (Layout, Logik, Design) von den themenspezifischen Daten (Fragen, Themen, Metadaten). Dadurch wird Layout einmal gepflegt und wirkt auf alle Pools, neue Fragen werden nur als Datendatei ergÃ¤nzt.

Die Ãœbungspools erlauben den SuS, selbststÃ¤ndig und individuell zu Ã¼ben â€” mit sofortigem Feedback, wÃ¤hlbaren Filtern und einer Auswertung am Ende.

## Wann diese Anleitung anwenden
- Ein neuer Ãœbungspool zu einem Themenbereich soll erstellt werden.
- Einem bestehenden Pool sollen Fragen hinzugefÃ¼gt oder angepasst werden.
- Das Template (Layout, FunktionalitÃ¤t) soll fÃ¼r alle Pools angepasst werden.
- Die Ãœbersichtsseite (index.html) soll aktualisiert werden.

---

## Architektur

### Dateistruktur auf GitHub

```
GYM-WR-DUY/
â””â”€â”€ Uebungen/
    â””â”€â”€ Uebungspools/
        â”œâ”€â”€ index.html          â† Ãœbersichtsseite (listet alle Pools)
        â”œâ”€â”€ pool.html           â† Universelles Template (CSS + JS-Logik)
        â””â”€â”€ config/
            â”œâ”€â”€ vwl_bip.js              â† Daten: BIP (60 Fragen)
            â”œâ”€â”€ vwl_beduerfnisse.js     â† Daten: BedÃ¼rfnisse (50 Fragen)
            â”œâ”€â”€ vwl_menschenbild.js     â† Daten: Menschenbild (49 Fragen)
            â””â”€â”€ ...                     â† Weitere Pools
```

### Komponenten

| Datei | Funktion | Ã„nderungshÃ¤ufigkeit |
|---|---|---|
| `pool.html` | Template mit HTML, CSS und JavaScript-Logik. LÃ¤dt Daten per URL-Parameter. | Selten (nur bei Layout-/FunktionsÃ¤nderungen) |
| `config/*.js` | Reine Datendateien: `POOL_META`, `TOPICS`, `QUESTIONS`. Kein HTML, kein CSS, keine Logik. | HÃ¤ufig (neue Fragen, neue Pools) |
| `index.html` | Ãœbersichtsseite mit `POOLS`-Array als Registry. | Bei jedem neuen Pool |

### URL-Schema

Die SuS rufen immer `pool.html` mit dem URL-Parameter `?pool=NAME` auf:

```
https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/pool.html?pool=vwl_bip
```

Der Parameter `pool` bestimmt, welche Config-Datei geladen wird (`config/vwl_bip.js`).

**Aktuelle Pool-URLs (Stand Februar 2026):**
- `pool.html?pool=vwl_beduerfnisse` â†’ BedÃ¼rfnisse, Knappheit & Produktionsfaktoren (SF GYM1, 50 Fragen)
- `pool.html?pool=vwl_menschenbild` â†’ Ã–konomisches Menschenbild (SF GYM1, 49 Fragen)
- `pool.html?pool=vwl_bip` â†’ Bruttoinlandprodukt (EWR GYM2, 60 Fragen)
- `pool.html?pool=vwl_wachstum` â†’ Wirtschaftswachstum â€” TriebkrÃ¤fte und Effekte (SF GYM1â€“GYM4, 55 Fragen)
- `pool.html?pool=vwl_steuern` â†’ Steuern und Staatseinnahmen (SF GYM3, 60 Fragen)
- `pool.html?pool=vwl_arbeitslosigkeit` â†’ Arbeitslosigkeit & Armut (SF GYM3, 50 Fragen)
- `pool.html?pool=vwl_staatsverschuldung` â†’ Staatsverschuldung (SF GYM3, 65 Fragen)
- `pool.html?pool=vwl_sozialpolitik` â†’ Sozialpolitik und Sozialversicherungen (SF GYM3, 50 Fragen)
- Ãœbersicht: `index.html`

### Farbsystem

Die Fachbereichsfarbe wird automatisch Ã¼ber `POOL_META.color` gesetzt:

| Fachbereich | SchlÃ¼ssel | Primary | Primary Light | LV-Farbe |
|---|---|---|---|---|
| VWL | `vwl` | `#f89907` | `#ffb74d` | Orange (8) |
| BWL | `bwl` | `#01a9f4` | `#4fc3f7` | Blau (1) |
| Recht | `recht` | `#73ab2c` | `#8bc34a` | GrÃ¼n (5) |

---

## Config-Datei: Struktur und Format

Jede Config-Datei (`config/*.js`) enthÃ¤lt genau drei Variablen. **Wichtig: Alle Variablen mÃ¼ssen mit `window.` deklariert werden**, damit sie als globale Variablen verfÃ¼gbar sind.

### POOL_META

```javascript
window.POOL_META = {
  id: "vwl_bip",                                    // Dateiname ohne .js
  fach: "VWL",                                       // VWL, BWL oder Recht
  title: "Ãœbungspool: Bruttoinlandprodukt (BIP)",    // Angezeigter Titel
  meta: "EWR GYM2 Â· Gymnasium Hofwil Â· Individuell Ã¼ben",  // Untertitel
  color: "vwl"                                       // Farbschema: vwl, bwl, recht
};
```

### TOPICS

```javascript
window.TOPICS = {
  definition: {label:"Definition & Grundbegriffe", short:"Definition"},
  messprobleme: {label:"Was das BIP (nicht) misst", short:"Messprobleme"},
  dreiseiten: {label:"Drei Seiten des BIP", short:"3 Seiten"},
  nomreal: {label:"Nominales & Reales BIP", short:"Nom./Real"},
  kreislauf: {label:"Wirtschaftskreislauf", short:"Kreislauf"},
  verteilung: {label:"Verteilung & Ungleichheit", short:"Verteilung"},
  wachstum: {label:"Wachstum & Nachhaltigkeit", short:"Wachstum"}
};
```

- `label`: VollstÃ¤ndiger Name (Auswertung, Tooltips)
- `short`: Kurzform (Filter-Chips, Badges)
- Die SchlÃ¼ssel (z.B. `definition`) werden in den Fragen als `topic` referenziert.

### QUESTIONS

Array von Frage-Objekten. Jede Frage hat folgende Pflichtfelder:

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | String | Eindeutige ID im Pool (z.B. `"d01"`) |
| `topic` | String | SchlÃ¼ssel aus TOPICS (z.B. `"definition"`) |
| `type` | String | Fragetyp: `mc`, `multi`, `tf`, `fill`, `calc`, `sort`, `open` |
| `diff` | Number | Schwierigkeit: `1` (einfach), `2` (mittel), `3` (schwer) |
| `tax` | String | Taxonomiestufe: `"K1"` bis `"K6"` |
| `q` | String | Fragetext |
| `explain` | String | ErklÃ¤rung (nach Beantwortung angezeigt) |

---

## Fragetypen im Detail

### Multiple Choice (`mc`)

```javascript
{id:"d01", topic:"definition", type:"mc", diff:1, tax:"K1",
 q:"Was misst das Bruttoinlandprodukt (BIP)?",
 options:[
   {v:"A", t:"Den Marktwert aller Endprodukte eines Jahres."},
   {v:"B", t:"Den Wert aller Importe und Exporte."},
   {v:"C", t:"Den Wert aller Exporte eines Landes."},
   {v:"D", t:"Das GesamtvermÃ¶gen aller Einwohner."}
 ],
 correct:"A",
 explain:"Das BIP entspricht dem Marktwert aller Endprodukte."
}
```

### Mehrfachauswahl (`multi`)

```javascript
{id:"g16", topic:"gleichgewicht", type:"multi", diff:2, tax:"K4",
 q:"Der Staat fÃ¼hrt einen HÃ¶chstpreis P_H ein. Welche FlÃ¤chen bilden die neue Konsumentenrente?",
 options:[
   {v:"A", t:"FlÃ¤che A"},
   {v:"B", t:"FlÃ¤che B"},
   {v:"C", t:"FlÃ¤che C"},
   {v:"D", t:"FlÃ¤che D"}
 ],
 correct:["A","B"],
 explain:"Die KR besteht aus FlÃ¤che A (erhalten) und FlÃ¤che B (von PR umverteilt)."
}
```

- Wie MC, aber `correct` ist ein **Array** statt ein einzelner String.
- Im UI werden Checkboxen (â˜‘ï¸) statt Radio-Buttons angezeigt.
- Hinweis â€žMehrere Antworten kÃ¶nnen richtig sein." erscheint automatisch Ã¼ber den Optionen.
- SuS mÃ¼ssen â€žÃœberprÃ¼fen" klicken (kein sofortiges AuslÃ¶sen bei Klick).
- Bewertung: Volle Punktzahl nur bei **exakter Ãœbereinstimmung** (alle richtigen gewÃ¤hlt, keine falschen).
- Ideal fÃ¼r Diagramm-Fragen mit beschrifteten FlÃ¤chen (Aâ€“F) oder Aussagensammlungen.
```

### Richtig/Falsch (`tf`)

```javascript
{id:"d02", topic:"definition", type:"tf", diff:1, tax:"K1",
 q:"Vorleistungen werden beim BIP abgezogen, um DoppelzÃ¤hlungen zu vermeiden.",
 correct:true,
 explain:"Korrekt. Ohne Abzug wÃ¼rde der Wert auf jeder Produktionsstufe erneut gezÃ¤hlt."
}
```

### LÃ¼ckentext (`fill`)

```javascript
{id:"s01", topic:"dreiseiten", type:"fill", diff:1, tax:"K1",
 q:"Die VWL beschÃ¤ftigt sich mit dem Problem der {0}. Sie entsteht, weil die {1} unbegrenzt sind, die {2} aber begrenzt.",
 blanks:[
   {answer:"Knappheit", alts:[]},
   {answer:"BedÃ¼rfnisse", alts:["WÃ¼nsche"]},
   {answer:"Mittel", alts:["GÃ¼ter","Ressourcen"]}
 ],
 explain:"Unbegrenzte BedÃ¼rfnisse treffen auf begrenzte Mittel."
}
```

- `{0}`, `{1}`, etc. = Platzhalter im Fragetext
- `answer` = korrekte Antwort
- `alts` = akzeptierte Alternativen (Gross-/Kleinschreibung wird ignoriert)

### Berechnung (`calc`)

```javascript
{id:"n03", topic:"nomreal", type:"calc", diff:2, tax:"K3",
 q:"Das nominale BIP betrÃ¤gt CHF 700 Mrd., der BIP-Deflator liegt bei 105. Berechnen Sie:",
 rows:[
   {label:"Reales BIP (in Mrd. CHF)", answer:666.67, tolerance:0.5, unit:"Mrd. CHF"},
   {label:"Inflationsrate", answer:5.0, tolerance:0.1, unit:"%"}
 ],
 explain:"Reales BIP = Nominales BIP / Deflator Ã— 100 = 700/105Ã—100 = 666.67"
}
```

- `tolerance` = akzeptierte Abweichung (Â±)
- `rows` = mehrere Teilaufgaben mÃ¶glich

### Zuordnung (`sort`)

```javascript
{id:"m07", topic:"messprobleme", type:"sort", diff:2, tax:"K2",
 q:"Ordnen Sie zu, ob die folgenden AktivitÃ¤ten im BIP erfasst werden.",
 categories:["Im BIP erfasst", "Nicht im BIP erfasst"],
 items:[
   {t:"Arztbesuch", cat:0},
   {t:"Hausarbeit", cat:1},
   {t:"Nachhilfe (schwarz)", cat:1},
   {t:"Autokauf beim HÃ¤ndler", cat:0}
 ],
 explain:"Nur Ã¼ber den Markt gehandelte Leistungen werden im BIP erfasst."
}
```

- `cat` = Index der Zielkategorie (0-basiert)
- Funktioniert per Select-then-Place (Tap auf Begriff, dann Tap auf Kategorie)

### Offene Frage (`open`)

```javascript
{id:"d05", topic:"definition", type:"open", diff:2, tax:"K2",
 q:"ErklÃ¤ren Sie in eigenen Worten, warum Vorleistungen abgezogen werden.",
 sample:"Vorleistungen werden abgezogen, um DoppelzÃ¤hlungen zu vermeiden. Das BIP soll nur die tatsÃ¤chliche WertschÃ¶pfung jeder Stufe erfassen.",
 explain:"Beispiel: Mehl (CHF 2) â†’ Brot (CHF 5) â†’ WertschÃ¶pfung = CHF 3."
}
```

- `sample` = LÃ¶sungsvorschlag (vor der SelbsteinschÃ¤tzung angezeigt)
- `explain` = zusÃ¤tzliche Vertiefung
- SuS schÃ¤tzen sich selbst ein: "Gewusst" / "Nicht gewusst"

---

## Schwierigkeitsgrade

| Stufe | Wert | Symbol | Beschreibung |
|---|---|---|---|
| Einfach | `1` | â­ | Grundwissen, Definitionen, direkte Fakten (K1â€“K2) |
| Mittel | `2` | â­â­ | ZusammenhÃ¤nge verstehen, einfache Anwendung (K2â€“K3) |
| Schwer | `3` | â­â­â­ | Transfer, Analyse, Beurteilung neuer Situationen (K3â€“K5) |

Verteilung: ca. 40% einfach, 40% mittel, 20% schwer.

## Taxonomiestufen

| Stufe | Bezeichnung | Typische Fragetypen |
|---|---|---|
| K1 | Wissen | MC, TF, Fill |
| K2 | Verstehen | MC, Multi, TF, Fill, Sort, Open |
| K3 | Anwenden | MC, Multi, Calc, Sort |
| K4 | Analysieren | MC, Multi, Open |
| K5 | Beurteilen | Open |
| K6 | Gestalten | Open |

## ID-Konvention

- Erstes Zeichen: KÃ¼rzel des Unterthemas (z.B. `d` fÃ¼r Definition, `m` fÃ¼r Messprobleme)
- Zwei Ziffern: Laufnummer (z.B. `d01`, `d02`, `m01`)
- IDs mÃ¼ssen innerhalb eines Pools eindeutig sein.
- Kommentare im QUESTIONS-Array helfen bei der Orientierung:

```javascript
window.QUESTIONS = [
// â”€â”€ DEFINITION (d01â€“d10) â”€â”€
{id:"d01", ...},
{id:"d02", ...},
// â”€â”€ MESSPROBLEME (m01â€“m08) â”€â”€
{id:"m01", ...},
```

---

## Vorgehen: Neuen Pool erstellen

### 1. KlÃ¤rung

Folgende Angaben sind nÃ¶tig:
- **Klasse und Stufe**: z.B. EWR GYM2, SF GYM1
- **GefÃ¤ss**: SF, EWR oder EF
- **Fachbereich**: Recht, BWL oder VWL
- **Themenbereich**: z.B. "BIP", "Vertragsrecht"
- **Stoffgrundlage**: LearningView-Export als .docx oder Beschreibung der Inhalte

### 2. Unterthemen identifizieren

- Aus dem LearningView-Export die Unterthemen identifizieren (typisch 4â€“8 pro Pool).
- Jedes Unterthema erhÃ¤lt einen kurzen SchlÃ¼ssel (z.B. `definition`, `messprobleme`).
- K1â€“K2-Fragen beziehen sich direkt auf das Unterrichtsmaterial.
- K3â€“K6-Fragen dÃ¼rfen auf neuen Beispielen und Situationen basieren.

### 3. Aufgabenpool erstellen

#### Umfang
- Mindestens 30 Aufgaben pro Pool, besser 40â€“60.
- Jedes Unterthema mindestens 4â€“6 Aufgaben.
- Alle 7 Fragetypen verwenden, Schwerpunkt auf MC und TF.
- Offene Fragen gezielt fÃ¼r hÃ¶here Taxonomiestufen (K2â€“K5).

#### ErklÃ¤rungen
**Jede Aufgabe muss eine ErklÃ¤rung haben** (`explain`), die nach dem Beantworten angezeigt wird:
- Bei korrekter Antwort: LÃ¶sungsweg bestÃ¤tigen und vertiefen.
- Bei falscher Antwort: Fehler erklÃ¤ren und korrekte Antwort begrÃ¼nden.
- Fachlich prÃ¤zis und verstÃ¤ndlich formuliert.
- Bei Recht: Gesetzesartikel referenzieren.

### 4. Config-Datei erstellen

Neue Datei im Ordner `config/` erstellen, z.B. `config/bwl_unternehmensformen.js`:

```javascript
// Ãœbungspool: Unternehmensformen
// Fachbereich: BWL
// Anzahl Fragen: 45

window.POOL_META = {
  id: "bwl_unternehmensformen",
  fach: "BWL",
  title: "Ãœbungspool: Unternehmensformen",
  meta: "SF GYM1 Â· Gymnasium Hofwil Â· Individuell Ã¼ben",
  color: "bwl"
};

window.TOPICS = {
  einzelunternehmen: {label:"Einzelunternehmen", short:"Einzelunt."},
  kollektiv: {label:"Kollektivgesellschaft", short:"KolG"},
  ag: {label:"Aktiengesellschaft", short:"AG"},
  gmbh: {label:"GmbH", short:"GmbH"},
  vergleich: {label:"Rechtsformvergleich", short:"Vergleich"}
};

window.QUESTIONS = [
// â”€â”€ EINZELUNTERNEHMEN (e01â€“e09) â”€â”€
{id:"e01", topic:"einzelunternehmen", type:"mc", diff:1, tax:"K1",
 q:"...",
 options:[...],
 correct:"A",
 explain:"..."},
// ...
];
```

### 5. index.html aktualisieren

Neuen Eintrag im `POOLS`-Array in `index.html` hinzufÃ¼gen:

```javascript
{
  id: "bwl_unternehmensformen",
  fach: "BWL",
  title: "Unternehmensformen",
  meta: "SF GYM1",
  questions: 45,
  topics: 5
},
```

### 6. Auf GitHub hochladen

1. Config-Datei in `Uebungen/Uebungspools/config/` hochladen
2. Aktualisierte `index.html` hochladen
3. Warten bis GitHub Actions "pages build and deployment" grÃ¼nen Haken zeigt (30â€“60 Sek.)
4. URL testen: `pool.html?pool=bwl_unternehmensformen`

### 7. In LearningView verlinken

URL als Weblink bei einer Aufgabe einfÃ¼gen (Ã¶ffnet sich in neuem Tab).

---

## Vorgehen: Bestehenden Pool erweitern

### Fragen hinzufÃ¼gen

1. Config-Datei Ã¶ffnen (z.B. `config/vwl_bip.js`)
2. Neue Fragen-Objekte ans Ende des `QUESTIONS`-Arrays einfÃ¼gen
3. Kommentar-Header im Array aktualisieren (z.B. Anzahl Fragen)
4. Auf GitHub hochladen â€” fertig. `pool.html` muss nicht angepasst werden.

### Fragen anpassen

1. Config-Datei Ã¶ffnen
2. Betreffendes Frage-Objekt finden (Suche nach ID)
3. Ã„nderungen vornehmen
4. Auf GitHub hochladen

---

## Vorgehen: Template anpassen

Ã„nderungen an `pool.html` wirken auf **alle Pools gleichzeitig**:

- Layout/CSS Ã¤ndern â†’ `pool.html` bearbeiten
- Neue Fragetypen â†’ JavaScript-Logik in `pool.html` erweitern
- Neue Filter â†’ `pool.html` anpassen

Keine Config-Dateien mÃ¼ssen angefasst werden.

---

## UI-Struktur

### Startbildschirm
- **Home-Button** (ðŸ ) im Header â†’ Link zur Ãœbersichtsseite (`index.html`)
- **Modus-Wahl**: Fokus oder Mix
  - **Fokus**: Unterthema und Schwierigkeit mÃ¼ssen gewÃ¤hlt werden. Aufgaben nach Schwierigkeit sortiert.
  - **Mix**: Alles vorausgewÃ¤hlt. Aufgaben zufÃ¤llig gemischt.
- **Filter-Chips**: Unterthema, Schwierigkeit und Fragetyp. Live-Anzeige der Aufgabenanzahl. Neben jeder Rubrik ein **â€žAlle â‡„"-Button** zum schnellen An-/AbwÃ¤hlen aller Chips einer Kategorie.
- **Start-Button**: Erst aktiv, wenn mindestens 1 Aufgabe den Filtern entspricht.

### Quiz-Ablauf
- Immer nur eine Aufgabe sichtbar.
- Sofortiges Feedback mit ErklÃ¤rung (grÃ¼n/rot).
- "NÃ¤chste Aufgabe" erscheint erst nach Beantwortung.
- "Ãœbung beenden" jederzeit sichtbar.
- Fortschrittsbalken und Punktestand oben.

### Auswertung
- Gesamtpunktzahl und Prozent.
- AufschlÃ¼sselung nach Unterthema (grÃ¼n â‰¥70%, gelb â‰¥40%, rot <40%).
- Liste der falsch beantworteten Fragen mit ErklÃ¤rungen.
- PDF-Export via `window.print()`. Nach dem Drucken/Speichern wird automatisch zum Startbildschirm zurÃ¼ckgekehrt.
- "Neue Ãœbung starten"-Button.

---

## QualitÃ¤tskontrolle

Vor der Fertigstellung prÃ¼fen:

**Inhalt & Struktur:**
- [ ] Mindestens 30 Aufgaben im Pool
- [ ] Alle Unterthemen abgedeckt (min. 4 Aufgaben pro Unterthema)
- [ ] Schwierigkeitsgrade verteilt (1, 2 und 3)
- [ ] Mindestens 3 verschiedene Fragetypen verwendet
- [ ] Taxonomiestufen variiert (mindestens K1â€"K4)
- [ ] Jede Aufgabe hat eine verstÃ¤ndliche ErklÃ¤rung
- [ ] Fachlich korrekt und lehrplankonform
- [ ] Fragestellungen eindeutig formuliert (SuS wissen, was gesucht ist)
- [ ] Bei Recht: Gesetzesartikel referenziert
- [ ] Schweizerische Terminologie verwendet

**Bilder (bei Fragen mit `img`-Feld):**
- [ ] Bilder verraten die korrekte Antwort nicht (siehe Abschnitt Â«BildqualitÃ¤tÂ»)
- [ ] Alt-Texte sind neutral und enthalten keine Antworthinweise
- [ ] SVG-Inhalte liegen vollstÃ¤ndig innerhalb der viewBox (nicht abgeschnitten)
- [ ] Bilder sind im Light und Dark Mode lesbar

**Technik:**
- [ ] Alle IDs eindeutig
- [ ] Variablen mit `window.` deklariert (nicht `const`)
- [ ] POOL_META.color korrekt gesetzt (vwl/bwl/recht)
- [ ] Topic-SchlÃ¼ssel in QUESTIONS stimmen mit TOPICS Ã¼berein
- [ ] index.html POOLS-Array aktualisiert
- [ ] Im Browser getestet (Desktop + Mobile)
- [ ] Zuordnungsaufgaben funktionieren auf Touchscreens

---

## BildqualitÃ¤t bei Fragen

Wenn ein Bild (`img`) zusammen mit einer Frage angezeigt wird, gelten die folgenden Regeln. **Claude prÃ¼ft diese bei jedem neuen Pool und bei jeder Ãœberarbeitung automatisch.**

### Inhaltliche Regeln: LÃ¶sungen nicht verraten

- Das Bild darf die korrekte Antwort **nicht direkt ablesen** lassen.
  - **Zuordnung (sort):** Das Bild darf nicht dieselben Stichworte enthalten, die als Items zugeordnet werden sollen.
  - **Richtig/Falsch (tf):** Das Bild darf keine Zusammenfassungen, Klammern oder Zahlen zeigen, die die Aussage direkt bestÃ¤tigen oder widerlegen.
  - **Multiple Choice (mc/multi):** Das Bild darf keine Information enthalten, die eine der Optionen offensichtlich als richtig kennzeichnet.
  - **LÃ¼ckentext (fill):** Das Bild darf die gesuchten BegriffslÃ¼cken nicht direkt anzeigen.
- Der **alt-Text** wird als Bildunterschrift (figcaption) angezeigt und muss neutral formuliert sein.
  - Schlecht: `"Alterslastquotient sinkend von 9.5:1 auf 2:1"` â†' verrÃ¤t die Antwort
  - Gut: `"Alterslastquotient Schweiz 1948â€"2050"` â†' beschreibt ohne LÃ¶sungshinweis
- SVGs mit LÃ¶sungshinweisen (z.B. Â«â†' LÃ¶sung: â€¦Â», Zusammenfassungsklammern mit Ergebnissen) mÃ¼ssen bereinigt werden.
- Wenn dasselbe Bild bei mehreren Fragen verwendet wird: PrÃ¼fen, ob es bei einer Frage die Antwort verrÃ¤t, auch wenn es bei einer anderen sinnvoll ist. Im Zweifel das Bild nur bei der allgemeineren Frage einsetzen.

### Technische Regeln: Darstellung

- **viewBox-Abstand:** SVG-Inhalte mÃ¼ssen vollstÃ¤ndig innerhalb der viewBox liegen. Elemente nahe am rechten oder unteren Rand werden auf schmalen Bildschirmen abgeschnitten. Sicherheitsabstand: mindestens 10 px zum Rand.
- **Leerraum:** Nach dem Entfernen von Inhalten (z.B. Bulletpoints) die viewBox-HÃ¶he und das Hintergrund-Rect anpassen, damit kein Ã¼berflÃ¼ssiger Leerraum entsteht.
- **Dark Mode:** SVGs sollten einen weissen Hintergrund (`fill="#fff"`) haben, damit sie in beiden Modi lesbar sind. Transparente HintergrÃ¼nde kÃ¶nnen im Dark Mode problematisch sein.
- **Format:** PNG/JPG fÃ¼r Fotos, SVG fÃ¼r Diagramme und Grafiken. Breite 600â€"1200 px bei Rasterbildern.

### PrÃ¼fschema (automatisch bei jeder Erstellung/Ãœberarbeitung)

FÃ¼r jede Frage mit `img`-Feld prÃ¼ft Claude:

1. Welcher Fragetyp liegt vor (mc, tf, sort, fill, etc.)?
2. EnthÃ¤lt das Bild Informationen, die die korrekte Antwort direkt erkennen lassen?
3. EnthÃ¤lt der alt-Text Antworthinweise?
4. Sind alle Bildinhalte innerhalb der viewBox sichtbar (kein Abschneiden am Rand)?
5. Passt die Detailtiefe des Bildes zum Zweck der Frage (Illustration vs. LÃ¶sungsquelle)?

---

## Workflow: Vom LearningView-Export zum Ãœbungspool

1. **Lehrer lÃ¤dt LearningView-Export hoch** (Word-Dokument mit Bausteinen)
2. **Claude analysiert die Bausteine** und identifiziert Unterthemen
3. **Claude schlÃ¤gt die Unterthemen-Struktur vor** (mit Labels und KÃ¼rzeln)
4. **Lehrer bestÃ¤tigt** oder passt an
5. **Claude erstellt die Config-Datei** (`config/NAME.js` mit POOL_META, TOPICS, QUESTIONS)
6. **Lehrer testet** via `pool.html?pool=NAME` im Browser
7. **Iterative Anpassung**: Fragen korrigieren, ergÃ¤nzen, Schwierigkeit anpassen
8. **Claude aktualisiert index.html** (neuer Eintrag im POOLS-Array)
9. **Lehrer lÃ¤dt Config-Datei und index.html auf GitHub** hoch und verlinkt in LearningView

---

## Hosting und Integration

### GitHub Pages
- Repository: `durandbourjate/GYM-WR-DUY`
- Basis-URL: `https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/`
- Deployment: Automatisch via GitHub Actions nach jedem Commit (30â€“60 Sek.)
- Status prÃ¼fen: Repository â†’ Tab "Actions" â†’ grÃ¼ner Haken = live

### LearningView
- **Als Weblink:** URL als Weblink-Anhang bei einer Aufgabe einfÃ¼gen. Ã–ffnet sich in neuem Tab.
- **Als Iframe (Aufgabentyp Â«Interaktiv externÂ»):** Pool wird direkt in LearningView eingebettet. Der Fortschritt wird automatisch via `postMessage` an LearningView gemeldet (xAPI-Score-Objekt). Die Funktion `sendScoreToLV()` sendet nach jeder Antwort und beim Quiz-Ende den aktuellen Score. Im Standalone-Betrieb (kein Iframe) hat dies keinen Effekt.
- Details zur Integration: Siehe `learningview_integration.md`.

### Technische Anforderungen
- Einzige externe AbhÃ¤ngigkeit: Google Fonts (Fallback auf system-ui)
- Keine Frameworks, keine npm-Pakete, kein Build-Prozess
- `pool.html` lÃ¤dt Config per `fetch()` und fÃ¼gt den Code als Inline-Script ein
- Dark Mode wird automatisch unterstÃ¼tzt (CSS media query)
