# Design-Spec: Öffnung Prüfungsplattform für alle Fachschaften

> **Datum:** 28.03.2026
> **Scope:** Hofwilweiter Einsatz, Architektur vorbereitet für schulübergreifende Öffnung
> **Status:** Review v2

---

## Ziel

Die Prüfungsplattform wird von einem WR-spezifischen Tool zu einer fachunabhängigen Plattform für alle Fachschaften am Gymnasium Hofwil erweitert. Die Architektur wird so gestaltet, dass eine zukünftige Öffnung für andere Schulen mit minimalem Aufwand möglich ist.

**Rollout-Modell:** DUY trägt alle Hofwil-LPs im Lehrpersonen-Tab ein. Jede LP kann eigenständig starten und Prüfungen/Aufgaben erstellen.

---

## Strang 1: Architektur-Generalisierung

### 1.1 Fach + Tag-System (ersetzt Fachbereich)

**Aktuell:** `Fachbereich = 'VWL' | 'BWL' | 'Recht' | 'Informatik' | 'Allgemein'` — hardcodierter Enum.

**Neu:**

#### Fach-Feld
- Pflichtfeld `fach: string` pro Frage und Prüfung
- Auswahl aus `schulConfig.faecher` (Lehrplan 17 Kanton Bern)
- Default: abgeleitet aus der primären Fachschaft der LP
- LP kann überschreiben (z.B. interdisziplinäre Prüfung)

#### Tag-System (drei Ebenen)

| Ebene | Definiert durch | Beispiele | Farbe |
|-------|----------------|-----------|-------|
| **Fachschafts-Tags** | Fachschaft (im LP-Tab) | WR: VWL (orange), BWL (blau), Recht (grün). DE: Grammatik, Literatur, Aufsatz | Konfigurierbar pro Tag |
| **Querschnitts-Tags** | Schulweit (schulConfig) | BNE, Digitalität, Transversalität, Interdisziplinär | Eigene Farbe, für alle LP sichtbar |
| **Persönliche Tags** | Einzelne LP | Eigene Kategorisierung | LP wählt Farbe |

#### Tag-Datenmodell

```typescript
/** Neuer Tag-Typ (ersetzt string[] in FrageBase.tags) */
export interface Tag {
  name: string
  farbe: string       // Hex-Farbwert (z.B. '#f97316')
  ebene: 'fachschaft' | 'querschnitt' | 'persoenlich'
}
```

**Abgrenzung zum bestehenden `tags: string[]`:** Das bestehende `tags`-Feld auf `FrageBase` (Zeile 32, `types/fragen.ts`) wird zu `tags: Tag[]` migriert. Bestehende String-Tags werden zu `{name: 'tagname', farbe: '#6b7280', ebene: 'persoenlich'}` konvertiert.

#### Mapping Fachbereich → Fach + Tags

| Alt (`fachbereich`) | Neu (`fach`) | Neu (`tags`) |
|---------------------|-------------|--------------|
| `'VWL'` | `'Wirtschaft & Recht'` | `[{name: 'VWL', farbe: '#f97316', ebene: 'fachschaft'}]` |
| `'BWL'` | `'Wirtschaft & Recht'` | `[{name: 'BWL', farbe: '#3b82f6', ebene: 'fachschaft'}]` |
| `'Recht'` | `'Wirtschaft & Recht'` | `[{name: 'Recht', farbe: '#22c55e', ebene: 'fachschaft'}]` |
| `'Informatik'` | `'Informatik'` | `[]` |
| `'Allgemein'` | aus Autor-Fachschaft | `[]` |

#### PruefungsConfig: `fachbereiche` → `fach`

Aktuell hat `PruefungsConfig` ein Feld `fachbereiche: string[]` (Zeile 18, `types/pruefung.ts`). Dieses wird ersetzt durch:
- `fach: string` — Pflichtfeld, ein Fach pro Prüfung (aus schulConfig.faecher)
- `fachbereiche` wird bei Migration ignoriert (war eine Aggregation der Fragen-Fachbereiche)

#### Migration
- Alle Fragen: `fachbereich` → `fach` + `tags` (siehe Mapping oben)
- Alle Prüfungen: `fachbereiche` → `fach` (abgeleitet aus Autor-Fachschaft)
- Bestehende `tags: string[]` → `tags: Tag[]` (mit Default-Farbe grau, Ebene persönlich)
- Backend liest alte + neue Felder parallel (6 Monate Übergangszeit)
- Einmaliges Migrations-Script im Backend (`migriereFachbereich_()`)

#### Betroffene Dateien
- `fachbereich.ts` → `fachUtils.ts` (neue generische Logik)
- `types/fragen.ts`: `Fachbereich`-Typ entfällt, `Tag`-Interface + `tags: Tag[]`
- `types/pruefung.ts`: `fachbereiche: string[]` → `fach: string`
- `FragenEditor`, `MetadataSection`: Fach-Dropdown + Tag-Picker statt Fachbereich-Dropdown
- `FragenBrowser`, `useFragenFilter`: Filter nach Fach + Tags
- Backend `apps-script-code.js`: Fachbereich-Felder migrieren, Migrations-Funktion

---

### 1.2 Branding-Config

**Aktuell:** "WR"-Logo, "Gymnasium Hofwil", `@gymhofwil.ch` an ~10 Stellen hardcodiert.

**Neu:** Zentrale `schulConfig` (eigener Tab im CONFIGS-Sheet):

```json
{
  "schulName": "Gymnasium Hofwil",
  "schulKuerzel": "GH",
  "logoUrl": "",
  "lpDomain": "gymhofwil.ch",
  "susDomain": "stud.gymhofwil.ch",
  "faecher": [
    "Deutsch", "Französisch", "Englisch", "Italienisch", "Spanisch", "Latein",
    "Mathematik", "Biologie", "Chemie", "Physik",
    "Geschichte", "Geografie",
    "Wirtschaft & Recht", "Informatik",
    "Bildnerisches Gestalten", "Musik", "Sport",
    "Philosophie", "Pädagogik/Psychologie",
    "Religionslehre"
  ],
  "gefaesse": ["SF", "EF", "EWR", "GF", "FF"],
  "querschnittsTags": [
    {"name": "BNE", "farbe": "#10b981"},
    {"name": "Digitalität", "farbe": "#6366f1"},
    {"name": "Transversalität", "farbe": "#8b5cf6"},
    {"name": "Interdisziplinär", "farbe": "#ec4899"}
  ],
  "semesterModell": {
    "regel": {"anzahl": 8, "label": "S1–S8"},
    "taf": {"anzahl": 10, "label": "S1–S10"}
  }
}
```

#### Laden
- Einmaliger API-Call beim App-Start, gecacht (bestehendes CacheService nutzen)
- Frontend speichert in Zustand-Store (`schulConfigStore.ts`)

#### Betroffene Stellen (hardcodierte Strings ersetzen)
- `LoginScreen.tsx`: Logo, Schulname, Domain-Placeholder
- `authStore.ts`: `rolleAusDomain()` — Domains aus Config
- `HilfeSeite.tsx`: Schulname
- `korrekturPDFAnsicht.tsx`: PDF-Header
- `sebConfigGenerator.ts`: SEB-Titel

---

### 1.3 LP-Profil erweitert

**Aktuell:** `fachschaft: string`, keine Typ-Konfiguration.

**Neu:**

Betrifft drei Stellen im Code:

```typescript
// services/lpApi.ts — Backend-Response
interface LPInfo {
  email: string
  name: string
  kuerzel: string
  fachschaften: string[]        // NEU: Array statt einzeln (z.B. ['WR', 'IN'])
  rolle: 'admin' | 'lp'
  sichtbareTypen?: string[]     // NEU: LP blendet Fragetypen ein/aus
}

// types/auth.ts — Frontend-User
interface AuthUser {
  email: string
  name: string
  vorname: string
  nachname: string
  bild?: string
  rolle: Rolle
  schuelerId?: string
  sessionToken?: string
  fachschaften: string[]        // NEU: Array (war fachschaft?: string)
  adminRolle?: boolean
}

// store/authStore.ts — importiert LPInfo, leitet AuthUser.fachschaften ab
// authStore setzt user.fachschaften = lpInfo.fachschaften bei Login
```

#### Fachschaften (Mehrfach)
- Im Lehrpersonen-Tab: Komma-getrennt (z.B. `WR, IN`)
- Backend parst zu Array
- Tag-System zeigt Tags aller Fachschaften der LP
- FiBu-Sichtbarkeit: `fachschaften.includes('WR')`

#### Berechtigungen und Fachschaften
Bestehendes Berechtigungssystem (`types/auth.ts`, Zeile 7): `email: 'fachschaft:WR'` bleibt als Format bestehen. Bei LP mit mehreren Fachschaften matcht `istSichtbar()` gegen alle Einträge: eine LP mit `fachschaften: ['WR', 'IN']` sieht Fragen mit `email: 'fachschaft:WR'` UND `email: 'fachschaft:IN'`.

#### Fragetypen-Sichtbarkeit
- Default: Alle generischen Typen aktiv
- FiBu-Typen: nur wenn `fachschaften.includes('WR')`
- LP kann in Einstellungen Typen ein-/ausblenden (Toggle-Liste)
- Gespeichert im LP-Profil (Lehrpersonen-Tab) als Primärquelle, localStorage als Cache
- Wirkt auf: Typ-Dropdown im FragenEditor, Typ-Filter im FragenBrowser

---

### 1.4 Gefässe erweiterbar

**Aktuell:** `Gefaess = 'SF' | 'EF' | 'EWR' | 'GF'` als fester TypeScript-Typ.

**Neu:**
- Liste aus `schulConfig.gefaesse`
- TypeScript-Typ wird `string` mit Runtime-Validierung über Hilfsfunktion:
  ```typescript
  // utils/gefaessUtils.ts
  export function istGueltigesGefaess(wert: string, config: SchulConfig): boolean {
    return config.gefaesse.includes(wert)
  }
  ```
- Validierung an 3 Stellen: (1) FragenEditor beim Speichern, (2) PruefungsComposer, (3) Backend `speichereFrage`/`speichereConfig`
- Default: `['SF', 'EF', 'EWR', 'GF', 'FF']`
- Neue Gefässe (z.B. `GF WR` nach Reform) = ein Eintrag in der Config

---

### 1.5 Klassen-Typ (Regel vs. TaF)

**Aktuell:** Kein `Kurs`-Interface im Code — Kurse sind nur als `kursId: string` referenziert (z.B. `sf-wr-29c`). Kurs-Daten liegen als Tabs im KURSE-Sheet.

**Neu:** Kurs-Metadaten im KURSE-Sheet erhalten eine neue Spalte `klassenTyp`:

| kursId | klasse | fach | klassenTyp |
|--------|--------|------|-----------|
| sf-wr-29c | 29c | WR | regel |
| sf-wr-29f | 29f | WR | taf |

- Kein neues TypeScript-Interface nötig — `klassenTyp` wird als Feld auf `PruefungsConfig` mitgeführt (abgeleitet aus Kurs-Sheet beim Erstellen der Prüfung)
- **Regelklasse:** 4 Jahre, Semester S1–S8
- **TaF-Klasse:** 5 Jahre, Semester S1–S10, 4-Phasen-Modell pro Jahr
- Phasen-Zuordnung in `schulConfig` (Kalenderwochen pro Phase)
- LP sieht im Prüfungs-Metadata Semester- ODER Phasen-Auswahl je nach Klassentyp
- Ermöglicht zukünftige TaF-Spezialregeln (z.B. andere Prüfungsdauer, Bewertung)

---

### 1.6 Punkte ↔ Bewertungsraster

**Aktuell:** Punkte-Feld und Bewertungsraster existieren unabhängig voneinander.

**Neu (minimale Verknüpfung):**
- Wenn ein Bewertungsraster definiert ist → Gesamtpunkte = Summe der Raster-Kriterien
- Punkte-Feld wird read-only und zeigt berechneten Wert
- Kein Raster → Punkte wie bisher manuell eingeben
- **Späteres Projekt:** Vertiefung des Rasters (überfachliche Kriterien: Sprache, Argumentation, Struktur)

---

## Strang 2: Neue Features

### Gruppe A — Bestehende Typen erweitern

#### A1: Wörterzähler (Freitext)
- Live-Anzeige der Wortanzahl unter dem Textfeld
- LP kann optionales Wortlimit setzen (Min/Max)
- Bei Überschreitung: Warnung (nicht blockierend)
- Implementierung: Zählfunktion im `FreitextFrage.tsx`, Konfigurationsfeld im `FreitextEditor.tsx`

#### A2: Inline-Choice (Lückentext-Variante)
- Neuer Subtyp von Lückentext: Lücken als Dropdown statt Freitexteingabe
- LP definiert pro Lücke: korrekte Antwort + Distraktoren
- Auto-Korrektur: exakter Match auf gewählte Option
- **LP-Editor-UX:** Bestehender Lückentext-Editor zeigt pro Lücke ein Zusatzfeld "Optionen" (Komma-getrennt). Erste Option = korrekt, Rest = Distraktoren. Toggle "Dropdown statt Freitext" pro Lücke.
- Implementierung: Erweiterung von `LueckentextFrage.tsx` + `LueckentextEditor.tsx`, neues Feld `optionen?: string[]` pro Lücke

#### A3: Rechtschreibprüfung (steuerbar)
- Browser-native Rechtschreibprüfung (`spellcheck`-Attribut)
- LP kann pro Prüfung **deaktivieren** (Default: aktiv = Browserverhalten)
- Neues Feld in Prüfungs-Config: `rechtschreibpruefung: boolean` (Default `true`)
- LP wählt Sprache: `rechtschreibSprache: 'de' | 'fr' | 'en' | 'it'` (setzt `lang`-Attribut)
- Anwendungsfall: Sprach-LPs deaktivieren bei Diktaten/Orthografie-Aufgaben

#### A4: Rich-Text-Referenzpanel
- Erweiterung des bestehenden Material-Side-Panels
- Neben PDF-Anzeige neu auch Rich-Text (HTML) als Material-Typ
- LP erstellt Referenztext im Tiptap-Editor (Formatierung, Bilder, Tabellen)
- SuS sehen formatierten Text im Side-Panel neben den Fragen
- Anwendungsfall: Gedicht, Gesetzesartikel, Quelle, Datenblatt

#### A5: LaTeX in Aufgabenstellungen (LP-Seite)
- Tiptap-Extension für LaTeX-Blöcke im Fragentext-Editor
- LP tippt LaTeX-Syntax, sieht Live-Vorschau (gerendert via KaTeX)
- SuS sehen gerenderte Formeln in der Aufgabenstellung
- Für alle Fächer verfügbar, primär MINT
- Bibliothek: KaTeX (schnell, 300KB, MIT-Lizenz)

#### A6: Code-Blöcke in Aufgabenstellungen (LP-Seite)
- Tiptap-Extension für Code-Blöcke mit Syntax-Highlighting
- LP wählt Sprache (Python, JavaScript, SQL, HTML, CSS, Java, etc.)
- Rendering via CodeMirror 6 oder highlight.js (read-only für SuS)
- Anwendungsfall: Informatik-LP zeigt Code-Snippet, SuS analysieren/ergänzen

---

### Gruppe B — Neue einfache Fragetypen

#### B1: Sortierung / Reihenfolge
- **SuS-Ansicht:** Liste von Elementen (Text oder Bild), per Drag & Drop in richtige Reihenfolge bringen
- **LP-Editor:** Elemente in korrekter Reihenfolge eingeben. Option: Anzahl Elemente (3–15)
- **Auto-Korrektur:** Ja. Teilpunkte: Punkte pro korrekt platziertem Element (Kendall-Tau oder einfacher Positionsvergleich)
- **Datenmodell:**
  ```typescript
  interface SortierungFrage extends BasisFrage {
    typ: 'sortierung'
    elemente: string[]           // korrekte Reihenfolge
    teilpunkte: boolean          // Teilpunkte erlauben
  }
  ```

#### B2: Hotspot (Klickbereiche auf Bild)
- **SuS-Ansicht:** Bild angezeigt, SuS klickt auf richtige Stelle(n)
- **LP-Editor:** Bild hochladen, Bereiche markieren (Rechteck oder Kreis), pro Bereich Label + Punkte
- **Auto-Korrektur:** Ja. Klick innerhalb des definierten Bereichs = korrekt
- **Datenmodell:**
  ```typescript
  interface HotspotFrage extends BasisFrage {
    typ: 'hotspot'
    bildUrl: string
    bereiche: {
      id: string
      form: 'rechteck' | 'kreis'
      koordinaten: { x: number, y: number, breite?: number, hoehe?: number, radius?: number }
      label: string
      punkte: number
    }[]
    mehrfachauswahl: boolean     // ein oder mehrere Bereiche anklicken
  }
  ```
- **Anwendung:** Geo (Karten), Bio (Organe), Geschichte (historische Karten)

#### B3: Bildbeschriftung
- **SuS-Ansicht:** Bild mit leeren Textfeldern an markierten Positionen
- **LP-Editor:** Bild hochladen, Beschriftungspunkte setzen (Position + korrekte Antwort + Toleranz)
- **Auto-Korrektur:** Ja. Textvergleich (case-insensitive, Levenshtein-Toleranz konfigurierbar)
- **Datenmodell:**
  ```typescript
  interface BildbeschriftungFrage extends BasisFrage {
    typ: 'bildbeschriftung'
    bildUrl: string
    beschriftungen: {
      id: string
      position: { x: number, y: number }  // Prozent vom Bild
      korrekt: string[]                     // mehrere akzeptierte Antworten
    }[]
  }
  ```
- **Anwendung:** Bio (Zellaufbau), Geo (stumme Karte), Chemie (Laborgeräte)

---

### Gruppe C — Medien-Features

#### C1: Audio/Video-Einbettung in Fragen
- **LP-Editor:** Upload von Audio (MP3, WAV, OGG) oder Video (MP4, WebM) als Material pro Frage
- **Upload-Ziel:** Google Drive (bestehender Materialien-Ordner)
- **SuS-Ansicht:** HTML5 `<audio>` / `<video>` Player in der Frage
- **Optionen (LP-konfigurierbar):**
  - Anzahl Abspielvorgänge limitierbar (1×, 2×, unbegrenzt)
  - Autoplay ein/aus
  - Nur Audio (kein Bild) vs. Video
- **Anwendung:** Hörverständnis (Sprachen), Musikanalyse, Physik-Experimente

#### C2: Audio-Aufnahme (mündliche Antworten)
- **SuS-Ansicht:** Aufnahme-Button, Wiedergabe, Neuaufnahme
- **Technik:** MediaRecorder API (Browser-nativ, keine Dependencies)
- **Format:** WebM/Opus (kompakt, gute Qualität)
- **Upload:** Blob → Google Drive (SuS-Uploads-Ordner)
- **LP-Korrektur:** Audio-Player in Korrekturansicht, Punkte + Kommentar
- **Datenmodell:**
  ```typescript
  interface AudioAntwort {
    aufnahmeUrl: string
    dauer: number              // Sekunden
    aufgenommenUm: string      // ISO timestamp
  }
  ```
- **Anwendung:** Aussprache (Sprachen), mündliche Erklärungen, Vorträge

#### C3: GIF/Animation in Fragen
- Technisch identisch mit Bild-Upload, Browser rendert GIF nativ
- Keine neue Infrastruktur nötig — nur Upload-Validierung für `.gif` erweitern
- LP kann im Fragentext oder als Material ein GIF einbetten
- **Anwendung:** Physik-Simulationen, Biologie-Prozesse, Chemie-Reaktionen

#### C4: Drag-and-Drop auf Bilder
- **SuS-Ansicht:** Bild + Pool von Labels. SuS ziehen Labels auf definierte Zielzonen im Bild
- **LP-Editor:** Bild hochladen, Zielzonen markieren (Rechteck), Label-Pool definieren, korrekte Zuordnung festlegen
- **Auto-Korrektur:** Ja. Label in richtiger Zone = Punkte
- **Datenmodell:**
  ```typescript
  interface DragDropBildFrage extends BasisFrage {
    typ: 'dragdrop_bild'
    bildUrl: string
    zielzonen: {
      id: string
      position: { x: number, y: number, breite: number, hoehe: number }  // Prozent
      korrektesLabel: string
    }[]
    labels: string[]             // Pool, kann Distraktoren enthalten
  }
  ```
- **Abgrenzung zu Bildbeschriftung:** DragDrop = vordefinierte Antworten zuordnen. Bildbeschriftung = freie Texteingabe.

---

### Gruppe D — Komplexe Editoren

#### D1: Code-Editor (Antwort-Fragetyp)
- **SuS-Ansicht:** Code-Editor mit Syntax-Highlighting, Zeilennummern, Auto-Indent
- **Unterstützte Sprachen:** Python, JavaScript, SQL, HTML, CSS, Java (erweiterbar)
- **LP-Editor:** Sprache wählen, optionaler Starter-Code, optionale Musterlösung
- **Bibliothek:** CodeMirror 6
  - Vorteil: ~150KB (vs. Monaco ~2MB), modular, mobile-freundlich, gut mit React
  - Extensions: Syntax-Highlighting, Zeilennummern, Theme (Light/Dark)
- **Korrektur:** Manuell durch LP (Code-Diff-Ansicht: SuS vs. Musterlösung). KI-Korrektur möglich (Code an Claude senden).
- **Keine Code-Ausführung** in dieser Phase (Sandbox-Ausführung = späteres Projekt)
- **Datenmodell:**
  ```typescript
  interface CodeFrage extends BasisFrage {
    typ: 'code'
    sprache: string              // 'python' | 'javascript' | 'sql' | ...
    starterCode?: string         // Vorgabe-Code
    musterLoesung?: string       // LP-Musterlösung
  }
  ```

#### D2: LaTeX-Formeleditor (Antwort-Fragetyp)
- **SuS-Ansicht:** Visueller Formeleditor (WYSIWYG). SuS klickt Symbole / tippt LaTeX, sieht gerenderte Formel live
- **LP-Editor:** Korrekte Formel als LaTeX eingeben. Optionale Äquivalenzprüfung (symbolisch vs. syntaktisch)
- **Bibliothek:** MathLive
  - Vorteil: MIT-Lizenz, ~400KB, moderner als MathQuill, virtuelles Keyboard für Tablets, barrierefreier
  - Rendering: KaTeX (bereits für LP-Seite eingebunden, A5)
- **Auto-Korrektur:** Teilweise. Exakter LaTeX-Vergleich (normalisiert) oder optionaler symbolischer Vergleich (z.B. `x^2 + 2x + 1` = `(x+1)^2`). Symbolischer Vergleich = komplex, erst bei Bedarf.
- **Datenmodell:**
  ```typescript
  interface FormelFrage extends BasisFrage {
    typ: 'formel'
    korrekteFormel: string       // LaTeX
    vergleichsModus: 'exakt' | 'symbolisch'
    toleranz?: number            // für numerische Formeln
  }
  ```
- **Anwendung:** Mathematik, Physik (Formeln), Chemie (Reaktionsgleichungen)

---

## Dependencies (neue Bibliotheken)

| Bibliothek | Grösse | Lizenz | Verwendet für |
|-----------|--------|--------|---------------|
| KaTeX | ~300KB | MIT | LaTeX-Rendering (LP-Aufgabentext + SuS-Ansicht) |
| MathLive | ~400KB | MIT | Formeleditor SuS-Eingabe |
| CodeMirror 6 | ~150KB | MIT | Code-Editor (LP-Aufgabentext + SuS-Antwort) |

Keine weiteren Dependencies nötig. Audio/Video, Drag-and-Drop, GIF = Browser-native APIs.

**Lazy Loading:** Alle drei Bibliotheken werden per `React.lazy()` / dynamischem `import()` geladen — nur wenn der entsprechende Fragetyp in einer Prüfung vorkommt. Kein Upfront-Load. Damit bleibt die initiale Bundle-Grösse unverändert.

---

## Antwort-Typen (types/antworten.ts)

Für jeden neuen Fragetyp muss ein passender Eintrag in der `Antwort`-Union definiert werden:

```typescript
// Neue Einträge in der Antwort-Union (types/antworten.ts)

| { typ: 'sortierung'; reihenfolge: string[] }                    // IDs in SuS-Reihenfolge
| { typ: 'hotspot'; geklickt: { x: number, y: number }[] }       // Klickpositionen (Prozent)
| { typ: 'bildbeschriftung'; eintraege: Record<string, string> }  // beschriftungId → Text
| { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> }  // zielzonenId → labelText
| { typ: 'code'; code: string }                                   // SuS-Code
| { typ: 'formel'; latex: string }                                // LaTeX-String
| { typ: 'audio'; aufnahmeUrl: string; dauer: number }           // Audio-Aufnahme
```

#### Auto-Korrektur-Integration (autoKorrektur.ts)

Neue auto-korrigierbare Typen in `AUTO_TYPEN` aufnehmen:

| Typ | Auto-Korrektur | Algorithmus |
|-----|---------------|-------------|
| `sortierung` | Ja | Positionsvergleich: Punkte pro Element an korrekter Position. Formel: `(korrekte Positionen / Gesamtelemente) * maxPunkte` |
| `hotspot` | Ja | Klick innerhalb Bereich = Punkte für diesen Bereich |
| `bildbeschriftung` | Ja | Case-insensitiver Textvergleich mit optionaler Levenshtein-Toleranz (Default: 0) |
| `dragdrop_bild` | Ja | Label in korrekter Zone = Punkte |
| `code` | Nein | Manuelle LP-Korrektur + optionale KI-Korrektur |
| `formel` | Teilweise | Exakter normalisierter LaTeX-Vergleich. `vergleichsModus: 'symbolisch'` = reserviert, nicht implementiert (Default: `'exakt'`) |
| `audio` | Nein | Manuelle LP-Korrektur |

---

## Robustheit und Edge Cases

### schulConfig-Ladevorgang
- Fallback bei API-Fehler: Hardcodierte Default-Config (heutige Hofwil-Werte) als Konstante im Frontend
- Bei Netzwerk-Fehler beim Start: Default-Config verwenden + Warnung anzeigen
- schulConfig wird im CacheService gecacht (TTL 1h, invalidiert bei Änderung)

### Medien-Upload (Audio/Video) bei Prüfungen
- **Dateigrössen-Limit:** Audio max. 10MB pro Aufnahme (~10 Min), Video max. 50MB
- **Gleichzeitige Uploads:** Queue-System (max. 3 parallele Uploads)
- **Upload-Fehler:** Retry (3×), dann lokaler Blob im localStorage als Backup, Upload bei nächstem Heartbeat
- **Cleanup:** Orphaned-Media-Dateien werden nicht automatisch gelöscht (zu riskant). LP kann in Einstellungen unbenutzte Medien auflisten und manuell löschen.
- **Google Drive Quota:** Bei 30 SuS × 1 Audio = ~30 Uploads in 5 Min — weit unter der Drive API-Grenze (1000 Requests/100s)

### Bild-basierte Fragetypen (Hotspot, Bildbeschriftung, DragDrop)
- **Koordinaten:** Prozent-basiert (0–100), relativ zur Bildgrösse
- **LP-Editor:** Koordinaten werden im Editor bei aktueller Bildgrösse erfasst und automatisch in Prozent umgerechnet
- **Responsive:** Bild wird mit `max-width: 100%; height: auto` gerendert, Overlay-Elemente per CSS-Prozent positioniert
- **Touch-Targets:** Minimale Hotspot-Grösse = 44×44px (berechnet bei Render, Warnung im Editor falls Bereich zu klein)
- **Aspect Ratio:** `object-fit: contain` — Bild behält Proportionen

---

## Nicht in diesem Projekt (dokumentiert)

### Spätere Projekte
- **Übungspools ↔ Prüfungstool:** Lern-Analytik, Login für Übungspools, KI-gestützte individuelle Übungsempfehlung. Eigenes Designprojekt.
- **Bewertungsraster-Vertiefung:** Überfachliche Kriterien (Sprache, Argumentation, Struktur), gewichtete Rubrics, kriterienbasiertes KI-Feedback.
- **Tier 2 Features:** Diktat-Fragetyp, GeoGebra/Desmos-Integration, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox).
- **Chemie/Bio-Darstellungen:** Molekülzeichnung, Strukturformeln, Zelldiagramme. Erst bei konkretem Fachschafts-Bedarf.
- **Evento-Anbindung:** REST-API für automatischen Klassenlisten-Sync.
- **Multi-Tenant:** Schulübergreifende Konfiguration, separates Backend pro Schule.

### Implementierungsreihenfolge (Vorschlag)

**Phase 1 — Architektur (Strang 1):** 1.1–1.6
Muss zuerst fertig sein, da Strang 2 darauf aufbaut (Fach-Feld, Tag-System, Typ-Sichtbarkeit).

**Phase 2 — Quick-Wins (Gruppe A1–A4):** Wörterzähler, Inline-Choice, Rechtschreibprüfung, Rich-Text-Panel.
Erweitern bestehende Typen, niedrige Komplexität, sofort nutzbar.

**Phase 3 — Neue Fragetypen (Gruppe B):** B1–B3
Eigenständige Komponenten, mittlere Komplexität.

**Phase 4 — Medien (Gruppe C):** C1–C4
Baut auf Google Drive-Infrastruktur auf, Media-APIs.

**Phase 5 — Editoren + LP-Tools (A5, A6, D1, D2):** LaTeX + Code-Blöcke in Aufgabenstellungen UND als Antwort-Fragetypen zusammen implementieren — nutzt gleiche Dependencies (KaTeX, CodeMirror 6), vermeidet doppelte Integration.
