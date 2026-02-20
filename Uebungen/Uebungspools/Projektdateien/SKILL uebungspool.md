---
name: uebungspool
description: >
  Erstellt und erweitert interaktive Übungspools (Fragepools) für den Gymnasialunterricht am Gymnasium Hofwil.
  Die Pools werden als JavaScript-Dateien (.js) erstellt, die in einer pool.html-Webapp laufen und auf GitHub Pages gehostet werden.
  Verwende diesen Skill immer wenn: Übungspool, Fragepool, Fragensammlung, Pool erweitern, neue Fragen erstellen,
  VWL-Fragen, Wirtschaftsfragen, Multiple-Choice-Pool, interaktive Übungen für GitHub,
  oder ähnliche Begriffe im Zusammenhang mit strukturierten Fragensammlungen vorkommen.
---

# Übungspool-Erstellung für Gymnasium Hofwil

Dieser Skill beschreibt das Format und die Regeln für die Erstellung und Erweiterung
von interaktiven Übungspools. Die Pools sind JavaScript-Config-Dateien, die in einer HTML-Webapp
(pool.html) gerendert werden und auf GitHub Pages gehostet sind.

## Grundprinzip: Trennung von Layout und Inhalt

Das zentrale Designprinzip ist die **strikte Trennung** zwischen dem universellen Template
und den themenspezifischen Inhalten:

- **Neue Fragen erstellen** → Nur die Config-Datei im `config/`-Ordner bearbeiten. `pool.html` wird nicht angefasst.
- **Design oder Funktionalität ändern** → Nur `pool.html` bearbeiten. Alle bestehenden Pools profitieren automatisch.
- **Neuen Pool erstellen** → Neue Config-Datei in `config/` anlegen + Eintrag in `index.html` ergänzen.

## Fachbereiche und Farben

| Fachbereich | Farbe | Farbcode (POOL_META) |
|---|---|---|
| **VWL** (Volkswirtschaftslehre) | Orange | `#f89907` |
| **BWL** (Betriebswirtschaftslehre) | Blau | `#01a9f4` |
| **Recht** | Grün | `#73ab2c` |

Diese Farben sind an das Farbschema der Lernplattform LearningView angelehnt und werden
in `POOL_META.color` gesetzt. `pool.html` setzt daraus automatisch das Farbschema.

## Repository und Hosting

- **Repository:** `durandbourjate/GYM-WR-DUY` auf GitHub
- **Branch:** `main`
- **Hosting:** GitHub Pages (automatisch nach Push, 30–60 Sek. Delay)
- **Basis-URL:** `https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/`

## Dateistruktur auf GitHub

```
durandbourjate/GYM-WR-DUY/
└── Uebungen/
    └── Uebungspools/
        ├── index.html              ← Übersichtsseite (listet alle Pools)
        ├── pool.html               ← Universelles Template (NICHT verändern)
        ├── config/                 ← Inhaltsdateien (eine pro Pool)
        │   ├── vwl_beduerfnisse.js
        │   ├── vwl_menschenbild.js
        │   ├── vwl_bip.js
        │   ├── vwl_wachstum.js
        │   ├── vwl_steuern.js
        │   ├── vwl_arbeitslosigkeit.js
        │   ├── vwl_staatsverschuldung.js
        │   ├── vwl_sozialpolitik.js
        │   └── ...                 ← Weitere Pools (BWL, Recht)
        └── img/                    ← Bilder für Fragen (optional)
            ├── vwl/
            │   ├── bip/
            │   └── ...
            ├── bwl/
            └── recht/
```

### Namenskonventionen

| Element | Konvention | Beispiel |
|---|---|---|
| Config-Datei | `{fachbereich}_{thema}.js` | `vwl_bip.js`, `recht_vertragsrecht.js` |
| Bilddatei | `{thema}_{inhalt}_{nr}.png` oder `.svg` | `konjunktur_zyklus_01.png` |
| Bildordner | `img/{fachbereich}/{thema}/` | `img/vwl/konjunktur/` |
| Fragen-ID | `{buchstabe}{zweistellig}` | `d01`, `m07`, `k12` |

**Regeln für Dateinamen:** Kleinbuchstaben, Unterstriche statt Leerzeichen, keine Umlaute
(`ae`/`oe`/`ue` statt `ä`/`ö`/`ü`), keine Sonderzeichen. Das vermeidet Probleme mit URLs auf GitHub Pages.

## URL-System und Deep-Links

### Einzelner Übungspool
```
.../pool.html?pool=vwl_bip
```
Der Parameter `?pool=NAME` bestimmt, welche Config-Datei aus `config/` geladen wird.

### Deep-Links auf Unterthemen

Deep-Links leiten SuS direkt auf ein Unterthema — besonders nützlich für LearningView-Verknüpfungen.

| Parameter | Werte | Beschreibung |
|---|---|---|
| `pool` | Config-Name | **Pflicht.** Bestimmt den Übungspool. |
| `topic` | Topic-Schlüssel | Wählt Unterthema vor. Mehrere mit Komma: `topic=definition,kreislauf` |
| `diff` | `1`, `2`, `3` | Filtert nach Schwierigkeit. Mehrere: `diff=1,2` |
| `type` | `mc`, `tf`, `fill`, `calc`, `multi` | Filtert nach Fragetyp. |
| `start` | `1` | Startet Quiz direkt (ohne Startbildschirm). |
| `keys` | `1` | Zeigt Deep-Link-Übersicht (alle Topic-Schlüssel mit kopierbaren Links). |

**Beispiele:**
```
# Nur Thema "Definition" im BIP-Pool, direkt starten:
pool.html?pool=vwl_bip&topic=definition&start=1

# Thema "Kreislauf", nur einfache MC-Fragen:
pool.html?pool=vwl_bip&topic=kreislauf&diff=1&type=mc

# Deep-Link-Übersicht anzeigen (für Lehrpersonen):
pool.html?pool=vwl_bip&keys=1
```

### Topic-Schlüssel herausfinden

1. **Im Browser:** `pool.html?pool=NAME&keys=1` öffnen → zeigt alle Schlüssel mit kopierbaren Links.
2. **In der Config-Datei:** `config/NAME.js` öffnen → Schlüssel im `window.TOPICS`-Objekt ablesen.

## JavaScript-Dateiformat (Config-Dateien)

Jede Config-Datei im `config/`-Ordner definiert **drei** globale Variablen auf `window`:

```javascript
// Metadaten zum Pool
window.POOL_META = {
  title: "Wirtschaftswachstum – Triebkräfte und Effekte",
  fach: "VWL",
  color: "#f89907",       // Fachbereichsfarbe
  level: "SF GYM1–GYM4"  // Stufe und Gefäss
};

// Unterthemen (Key → Anzeigename)
window.TOPICS = {
  "definition": "Definition & Grundbegriffe",
  "ebene1": "Unmittelbare Ebene: Einkommen & Produktion",
  // ...
};

// Fragen-Array
window.QUESTIONS = [
  { id, topic, type, diff, tax, q, ... },
  // ...
];
```

**Wichtig:** Variablen immer mit `window.` deklarieren, nicht mit `const` oder `let`.
Grund: Die Datei wird per `fetch()` geladen und als Script-Element eingefügt.
Ohne `window.` sind die Variablen nicht global verfügbar.

## Frageformat (Question-Objekt)

### Pflichtfelder (alle Fragetypen)

| Feld    | Typ      | Beschreibung |
|---------|----------|-------------|
| `id`    | String   | Eindeutige ID, Präfix nach Thema (z.B. `"d04"`, `"v11"`) |
| `topic` | String   | Muss einem Key in `TOPICS` entsprechen |
| `type`  | String   | Fragetyp: `"mc"`, `"tf"`, `"fill"`, `"calc"`, `"multi"` |
| `diff`  | Number   | Schwierigkeit: `1` (leicht), `2` (mittel), `3` (schwer) |
| `tax`   | String   | Bloom-Taxonomiestufe: `"K1"` bis `"K6"` |
| `q`     | String   | Fragetext |
| `explain` | String | Erklärung der korrekten Antwort (wird nach Beantwortung angezeigt) |

### Optionales Feld

| Feld  | Typ    | Beschreibung |
|-------|--------|-------------|
| `img` | Object | `{src: "img/vwl/thema/dateiname.svg", alt: "Beschreibung"}` |

### Fragetypen im Detail

#### `"mc"` – Multiple Choice (eine richtige Antwort)
```javascript
{
  id: "d04", topic: "thema_id", type: "mc", diff: 2, tax: "K2",
  q: "Fragetext hier?",
  options: [
    {v: "A", t: "Antworttext A"},
    {v: "B", t: "Antworttext B"},
    {v: "C", t: "Antworttext C"},
    {v: "D", t: "Antworttext D"}
  ],
  correct: "A",
  explain: "Erklärung warum A korrekt ist."
}
```

#### `"multi"` – Mehrfachauswahl (mehrere richtige Antworten)
```javascript
{
  id: "v11", topic: "thema_id", type: "multi", diff: 2, tax: "K2",
  q: "Welche Aussagen treffen zu? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Antworttext A"},
    {v: "B", t: "Antworttext B"},
    {v: "C", t: "Antworttext C"},
    {v: "D", t: "Antworttext D"}
  ],
  correct: ["A", "C"],  // Array!
  explain: "Erklärung."
}
```

#### `"tf"` – True/False
```javascript
{
  id: "r12", topic: "thema_id", type: "tf", diff: 3, tax: "K4",
  q: "Aussage, die wahr oder falsch sein kann.",
  correct: true,  // oder false
  explain: "Erklärung."
}
```

#### `"fill"` – Lückentext
```javascript
{
  id: "v10", topic: "thema_id", type: "fill", diff: 1, tax: "K1",
  q: "Text mit {0} und weiterer {1} Lücke.",
  blanks: [
    {answer: "Hauptantwort", alts: ["Alternative1", "Alternative2"]},
    {answer: "Hauptantwort2", alts: ["Alt"]}
  ],
  explain: "Erklärung."
}
```

#### `"calc"` – Rechenaufgabe
```javascript
{
  id: "e12", topic: "thema_id", type: "calc", diff: 3, tax: "K3",
  q: "Aufgabentext mit Zahlen.",
  rows: [
    {label: "Beschreibung Zeile 1", answer: 5600, tolerance: 50, unit: "Mio. h"},
    {label: "Beschreibung Zeile 2", answer: 448, tolerance: 5, unit: "Mrd. CHF"}
  ],
  explain: "Lösungsweg Schritt für Schritt."
}
```

## Qualitätsregeln

### Abdeckung sicherstellen
- Jedes Topic muss Fragen auf **allen 3 Schwierigkeitsstufen** haben
- Jedes Topic sollte **verschiedene Fragetypen** abdecken (nicht nur mc)
- Mindestens 1 `multi`-Frage pro Topic anstreben

### Schwierigkeitsgrade
- **diff: 1** → Wissen abrufen (K1–K2), Grundbegriffe
- **diff: 2** → Anwenden und Verstehen (K2–K3), Zusammenhänge
- **diff: 3** → Analyse, Bewertung, Transfer (K4–K6)

### Taxonomiestufen (Bloom)
- **K1** Wissen: Fakten abrufen, definieren
- **K2** Verstehen: Erklären, zuordnen, beschreiben
- **K3** Anwenden: Berechnen, anwenden auf neue Situationen
- **K4** Analysieren: Vergleichen, Ursachen identifizieren
- **K5** Bewerten/Beurteilen: Stellungnahme, Evaluation
- **K6** Erschaffen: Neue Lösungen entwickeln

### Bilder (SVG)
- Format: SVG bevorzugt, PNG/JPG möglich. Abgelegt in `img/{fachbereich}/{thema}/`
- **Lösungen dürfen NICHT im Bild sichtbar sein** (z.B. «?» statt konkreter Beispiele)
- Stil: Klare, professionelle Lehrdarstellungen
- Font: `'DM Sans', system-ui, sans-serif`
- Farben: Dezent, kontrastreich (z.B. `#2563eb`, `#dc2626`, `#16a34a`, `#7c3aed`)
- Kontrast: Bilder sollten im Light und Dark Mode lesbar sein. Transparente Hintergründe können im Dark Mode problematisch sein — im Zweifel weissen Hintergrund verwenden.
- Breite: 600–1200 px ideal
- Referenzierung: `img: {src: "img/vwl/thema/dateiname.svg", alt: "Beschreibung"}`

### ID-Konvention
- Präfix leitet sich vom Topic ab (z.B. `d` für "definition", `v` für "verteilung")
- Fortlaufende Nummerierung: `d01`, `d02`, ..., `d15`
- IDs müssen innerhalb eines Pools eindeutig sein

### Erklärungen (explain)
- Immer den vollständigen Lösungsweg aufzeigen
- Bei Rechenaufgaben: Schritt für Schritt
- Bei Konzeptfragen: Warum die richtige Antwort stimmt UND warum die Distraktoren falsch sind

### Weitere Regeln für Config-Dateien
- Topic-Schlüssel in `QUESTIONS` müssen exakt mit den Schlüsseln in `TOPICS` übereinstimmen
- Keine HTML-Tags in Fragetexten (ausser `<br>` für Zeilenumbrüche, falls nötig)

## LearningView-Integration

Die Pools können auf zwei Arten in LearningView eingebunden werden:

**Als Weblink (Standard):** URL als Weblink-Anhang bei einer Aufgabe. Link öffnet sich im neuen Tab.
Für gezielte Verknüpfungen: Deep-Links mit `topic`-Parameter verwenden.

**Als Iframe (Aufgabentyp «Interaktiv extern»):** Pool wird direkt in LearningView eingebettet.
In diesem Modus sendet `pool.html` den Fortschritt automatisch via `window.parent.postMessage()`
an LearningView — nach jeder beantworteten Frage und beim Quiz-Ende.
Protokoll: xAPI-Score-Objekt (`result.score.scaled` als Wert von 0 bis 1).
Im Standalone-Betrieb wird kein `postMessage` gesendet (Prüfung: `window.parent === window`).

## Aktueller Pool-Bestand (VWL)

| # | Pool | Config-Name | Stufe | Fragen | Topics |
|---|------|-------------|-------|--------|--------|
| 1 | Bedürfnisse, Knappheit & Produktionsfaktoren | `vwl_beduerfnisse` | SF GYM1 | 50 | 7 |
| 2 | Ökonomisches Menschenbild | `vwl_menschenbild` | SF GYM1 | 49 | 7 |
| 3 | Bruttoinlandprodukt (BIP) | `vwl_bip` | EWR GYM2 | 60 | 7 |
| 4 | Wirtschaftswachstum | `vwl_wachstum` | SF GYM1–4 | 76 | 6 |
| 5 | Arbeitslosigkeit & Armut | `vwl_arbeitslosigkeit` | SF GYM3 | 50 | 7 |
| 6 | Sozialpolitik und Sozialversicherungen | `vwl_sozialpolitik` | SF GYM3 | 50 | 7 |
| 7 | Steuern und Staatseinnahmen | `vwl_steuern` | SF GYM3 | 60 | 6 |
| 8 | Staatsverschuldung | `vwl_staatsverschuldung` | SF GYM3 | 65 | 7 |

**BWL- und Recht-Pools:** Noch in Planung. Gleiche Architektur, eigene Config-Dateien und Farben.

## index.html aktualisieren

Nach dem Erstellen/Erweitern eines Pools muss die `index.html` aktualisiert werden:
- Feld `questions` auf die neue Gesamtzahl setzen
- Feld `topics` prüfen
- Bei neuem Pool: Neuen Eintrag im `POOLS`-Array ergänzen

```javascript
{
  id: "vwl_wachstum",
  fach: "VWL",
  title: "Wirtschaftswachstum – Triebkräfte und Effekte",
  meta: "SF GYM1–GYM4",
  questions: 76,
  topics: 6
}
```

Die Reihenfolge auf der Übersichtsseite wird durch die Position im `POOLS`-Array bestimmt.

## Workflow: Pool erweitern

1. Bestehende Config-Datei (`config/NAME.js`) und `pool.html` einlesen
2. Aktuelle Verteilung analysieren (Fragen pro Topic × Schwierigkeit × Typ)
3. Lücken identifizieren
4. Neue Fragen erstellen, die Lücken füllen
5. Bei bestehenden Fragen prüfen: Können Bilder oder Multi-Antworten ergänzt werden?
6. SVG-Bilder separat erstellen (im `img/{fach}/{thema}/`-Ordner)
7. JavaScript-Datei syntaktisch validieren (`node -e "eval(code)"`)
8. `index.html` aktualisieren (Fragenzahl, ggf. Topics)
9. CHANGELOG für GitHub-Upload erstellen

## Workflow: Neuen Pool erstellen

1. Thema und Unterthemen definieren → `TOPICS`-Objekt
2. `POOL_META` festlegen (Titel, Fach, Farbe, Stufe)
3. Lehrmaterial analysieren (hochgeladene PDFs/Dokumente)
4. Mindestens 8–12 Fragen pro Topic erstellen
5. Verteilung über Schwierigkeit und Typen sicherstellen
6. SVG-Bilder erstellen wo sinnvoll
7. `index.html` ergänzen (neuen Pool-Eintrag)
8. Config-Datei syntaktisch validieren

## Workflow: Template erweitern

Änderungen am Template (`pool.html`) wirken auf **alle** Pools gleichzeitig.
Vor Änderungen an `pool.html` immer eine Kopie sichern.

1. Aktuelle `pool.html` einlesen
2. Gewünschte Änderung implementieren (neuer Fragetyp, Layout etc.)
3. Testen mit bestehendem Pool
4. Auf GitHub hochladen

## Deployment

1. Auf GitHub zum Repository `durandbourjate/GYM-WR-DUY` navigieren
2. In den richtigen Ordner wechseln (z.B. `Uebungen/Uebungspools/config/`)
3. "Add file" → "Upload files" wählen
4. Datei(en) hochladen und committen
5. Unter "Actions" warten, bis der Build einen grünen Haken zeigt
6. URL im Browser testen

| Aktion | Betroffene Dateien |
|---|---|
| Neue Fragen zu bestehendem Pool | `config/NAME.js` |
| Neuer Pool erstellen | `config/NAME.js` + `index.html` |
| Design/Layout ändern | `pool.html` |
| Bild hinzufügen | `img/{fach}/{thema}/BILD.svg` + `config/NAME.js` |
| Übersichtsseite anpassen | `index.html` |

## Ausgabe

Bei jeder Pool-Erstellung oder -Erweiterung werden folgende Dateien erstellt:

- Pool-Datei: `config/[thema].js`
- Index: `index.html` (aktualisiert)
- Bilder: `img/{fach}/{thema}/*.svg` (einzelne Dateien)
- Zusammenfassung: `CHANGELOG_[thema].md` für GitHub Commit

## Technische Details

### Wie pool.html funktioniert
1. SuS öffnen URL wie `pool.html?pool=vwl_bip`
2. `pool.html` liest den URL-Parameter `pool` aus
3. Per `fetch()` wird `config/vwl_bip.js` geladen
4. Inhalt wird als `<script>` eingefügt → `POOL_META`, `TOPICS` und `QUESTIONS` stehen global zur Verfügung
5. Basierend auf `POOL_META.color` wird das Farbschema gesetzt
6. Chips (Filter) werden aus `TOPICS`, Schwierigkeitsgraden und Fragetypen generiert
7. Quiz filtert, mischt und zeigt Fragen einzeln an

### Abhängigkeiten
- Google Fonts (DM Sans, DM Mono) — mit system-ui als Fallback
- Keine Frameworks, keine npm-Pakete, kein Build-Prozess
- Dark Mode: automatisch unterstützt (CSS `prefers-color-scheme`)
- Funktioniert auf allen modernen Browsern (Desktop und Mobile)

### Lokales Testen
Dateien lassen sich nicht direkt im Dateisystem öffnen (wegen `fetch()`).
Lokalen Webserver starten: `python3 -m http.server` im Ordner, dann `localhost:8000/pool.html?pool=NAME`.
Oder direkt auf GitHub hochladen und dort testen.
