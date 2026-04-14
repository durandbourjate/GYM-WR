# Design: Buchhaltungs-Fragetypen & Aufgabengruppen

**Datum:** 2026-03-21
**Status:** Approved
**Kontext:** Prüfungsplattform (ExamLab/)

## Übersicht

Erweiterung der Prüfungsplattform um 4 neue Buchhaltungs-Fragetypen und ein generisches Aufgabengruppen-Konzept. Basiert auf dem Schweizer KMU-Kontenrahmen und orientiert sich an Tools wie Bookyto (bookyto.com).

**Fachbereich:** Alle FiBu-Fragetypen gehören zum Fachbereich `BWL` (bestehender Wert, keine Erweiterung nötig).

### Neue Fragetypen

| # | Fragetyp | `typ`-Wert | Beschreibung | Prio |
|---|----------|-----------|-------------|------|
| 1 | Buchungssatz | `buchungssatz` | Geschäftsfall → Soll/Haben/Betrag | Hoch |
| 2 | T-Konto | `tkonto` | Buchungen in T-Konten eintragen, Saldi berechnen | Hoch |
| 3 | Kontenbestimmung | `kontenbestimmung` | Konten, Kategorien, Seiten bestimmen | Mittel |
| 4 | Bilanz/ER-Struktur | `bilanzstruktur` | Bilanz/ER aufbauen mit Gruppen, Reihenfolge, Mehrstufigkeit | Hoch |
| 5 | Journal | `journal` | Chronologische Verbuchung zusammenhängender Geschäftsfälle | Tief (später) |

### Neues Plattform-Konzept

- **Aufgabengruppe**: Bündelt mehrere Teilaufgaben unter gemeinsamem Kontext. Generisch, fachübergreifend nutzbar.

---

## 1. Shared FiBu-Infrastruktur

### 1.1 KMU-Kontenrahmen

Statische JSON-Datei unter `src/data/kontenrahmen-kmu.json`, wird per `import` geladen (kein Fetch nötig, Vite bundelt es). Geschätzte Grösse: ~15KB (ca. 200 Konten).

```typescript
interface Konto {
  nummer: string          // z.B. "1000"
  name: string            // z.B. "Kasse"
  kategorie: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'
  gruppe: string          // z.B. "Umlaufvermögen", "Kurzfristiges Fremdkapital"
  untergruppe?: string    // Optional, für Mehrstufigkeit ER
}
```

Gruppen-Zuordnung:
- **Aktiv**: Umlaufvermögen, Anlagevermögen
- **Passiv**: Kurzfristiges Fremdkapital, Langfristiges Fremdkapital, Eigenkapital
- **Aufwand/Ertrag**: Gemäss mehrstufiger ER (Warenaufwand, Personalaufwand, etc.)

### 1.2 Kontenauswahl-Komponente (`KontenSelect`)

Wiederverwendbare React-Komponente für alle FiBu-Fragetypen:

```typescript
interface KontenauswahlConfig {
  modus: 'eingeschraenkt' | 'voll'
  konten?: string[]   // Nur bei 'eingeschraenkt': Kontonummern zur Auswahl
}
```

- **Eingeschränkter Modus**: Dropdown mit LP-definierten Konten (wie Bookyto)
- **Voller Modus**: Durchsuchbares Autocomplete über ganzen Kontenrahmen (Suche nach Nummer oder Name)
- Modus wird pro Aufgabe von der LP gewählt

### 1.3 KI-Aktionen (neue AktionKeys)

Folgende `AktionKey`-Werte werden zu `useKIAssistent.ts` hinzugefügt:

| AktionKey | Beschreibung | Fragetypen |
|-----------|-------------|------------|
| `generiereKontenauswahl` | Konten vorschlagen (korrekte + Distraktoren) | Alle FiBu |
| `generiereBuchungssaetze` | Buchungssätze aus Geschäftsfall generieren | Buchungssatz |
| `pruefeBuchungssaetze` | Buchungssätze auf Korrektheit prüfen | Buchungssatz |
| `generiereTKonten` | T-Konten aus Geschäftsfällen generieren | T-Konto |
| `generiereKontenaufgaben` | Kontenbestimmungs-Aufgaben generieren | Kontenbestimmung |
| `generiereBilanzStruktur` | Musterlösung Bilanz/ER aus Kontenliste | Bilanz/ER |
| `generiereFallbeispiel` | Kontext + Teilaufgaben für Aufgabengruppe | Aufgabengruppe |

### 1.4 Material: Kontenrahmen

Bei Prüfungen mit FiBu-Aufgaben wird der KMU-Kontenrahmen automatisch als Hilfsmittel vorgeschlagen.

### 1.5 Umgang mit `FrageBase`-Pflichtfeldern

Die neuen FiBu-Typen erben von `FrageBase` zwei Felder, die Klärung brauchen:

- **`musterlosung: string`** — Bei strukturierten Typen wird hier ein **lesbarer Text** hinterlegt (z.B. "Warenaufwand / Kreditoren 5'000"), der in der Vorschau und im Export angezeigt wird. Die eigentliche Musterlösung steckt in den typspezifischen Feldern (`buchungen`, `konten`, `loesung`). Der Text wird vom Editor automatisch aus der strukturierten Lösung generiert.
- **`bewertungsraster: Bewertungskriterium[]`** — Wird bei FiBu-Typen **leer gelassen** (`[]`). Stattdessen verwenden T-Konto und Bilanz/ER ihre eigenen `bewertungsoptionen`-Felder mit booleschen Toggles. Die Auto-Korrektur-Engine prüft zuerst die typspezifischen Optionen; nur wenn keine vorhanden sind, fällt sie auf das generische Raster zurück.

### 1.6 Auto-Korrektur: Regelbasiert

Alle FiBu-Fragetypen verwenden **deterministische, regelbasierte** Auto-Korrektur (nicht KI-basiert). Die Antworten sind strukturiert und eindeutig prüfbar:
- Konto korrekt? → Exakter String-Vergleich der Kontonummer
- Betrag korrekt? → Numerischer Vergleich
- Reihenfolge? → Positionsvergleich
- Beschriftung? → String-Vergleich gegen erwartete Labels

Keine LLM-Aufrufe für die Korrektur nötig. Die KI wird nur im Editor (Aufgaben generieren, prüfen) eingesetzt.

---

## 2. Fragetyp: Buchungssatz

### 2.1 Datenmodell (Frage)

```typescript
interface BuchungssatzFrage extends FrageBase {
  typ: 'buchungssatz'
  geschaeftsfall: string              // Aufgabentext
  buchungen: SollHabenZeile[]         // Erwartete Lösung (eine oder mehrere Zeilen)
  kontenauswahl: KontenauswahlConfig
}

interface SollHabenZeile {
  id: string                          // Für Zuordnung in Antworten
  sollKonten: BuchungsKonto[]         // Ein oder mehrere Soll-Konten
  habenKonten: BuchungsKonto[]        // Ein oder mehrere Haben-Konten
  buchungstext?: string               // Optional
}

// Unterstützt zusammengesetzte Buchungssätze (z.B. MWST):
// Soll: Warenaufwand 4'000 + Vorsteuer 320 / Haben: Kreditoren 4'320
interface BuchungsKonto {
  kontonummer: string
  betrag: number
}
```

### 2.2 Antwort-Type (SuS-Abgabe)

```typescript
// Ergänzung in antworten.ts → Antwort Union
| { typ: 'buchungssatz'; buchungen: {
    id: string;
    sollKonten: { kontonummer: string; betrag: number }[];
    habenKonten: { kontonummer: string; betrag: number }[];
    buchungstext?: string;
  }[] }
```

### 2.3 SuS-Ansicht

Geschäftsfall-Text oben, darunter Buchungstabelle:

| Soll-Konto | Betrag | Haben-Konto | Betrag | Text (opt.) |
|------------|--------|-------------|--------|-------------|
| [▾ Konto] | [Input] | [▾ Konto] | [Input] | [Input] |
| [+ Soll-Zeile] | | [+ Haben-Zeile] | | |
| [+ Buchungssatz] |

- Pro Buchungssatz: mehrere Soll- und Haben-Zeilen möglich (zusammengesetzte Buchungen)
- Button für zusätzliche Buchungssätze
- Konto-Dropdowns + Betrag-Inputs

### 2.4 LP-Editor

- Geschäftsfall-Textfeld (Tiptap)
- Musterlösung: Buchungszeilen definieren (gleiche UI wie SuS)
- Kontenauswahl-Konfiguration: Toggle eingeschränkt/voll + Konten-Picker
- KI-Buttons: "Konten vorschlagen", "Buchungssatz generieren", "Buchungssatz prüfen"

### 2.5 Auto-Korrektur

- Regelbasiert (deterministisch)
- Pro Buchungssatz: Soll-Konten, Haben-Konten, Beträge separat prüfbar
- Reihenfolge der Buchungssätze flexibel
- Innerhalb eines zusammengesetzten Buchungssatzes: Reihenfolge der Konten flexibel
- Teilpunkte konfigurierbar (pro Konto, pro Betrag, oder pro Buchungssatz)

---

## 3. Fragetyp: T-Konto

### 3.1 Datenmodell (Frage)

```typescript
interface TKontoFrage extends FrageBase {
  typ: 'tkonto'
  aufgabentext: string
  geschaeftsfaelle?: string[]          // Optional: zu verbuchende Geschäftsfälle
  konten: TKontoDefinition[]           // Erwartete T-Konten (Musterlösung)
  kontenauswahl: KontenauswahlConfig
  bewertungsoptionen: TKontoBewertung
}

interface TKontoDefinition {
  id: string
  kontonummer: string
  anfangsbestand?: number
  anfangsbestandVorgegeben: boolean    // true = vorausgefüllt
  eintraege: TKontoEintrag[]
  saldo: { betrag: number; seite: 'soll' | 'haben' }
}

interface TKontoEintrag {
  seite: 'soll' | 'haben'
  gegenkonto: string
  betrag: number
  buchungstext?: string
}

interface TKontoBewertung {
  beschriftungSollHaben: boolean
  kontenkategorie: boolean             // Aktiv/Passiv/Aufwand/Ertrag
  zunahmeAbnahme: boolean
  buchungenKorrekt: boolean
  saldoKorrekt: boolean
}
```

### 3.2 Antwort-Type

```typescript
| { typ: 'tkonto'; konten: {
    id: string;
    beschriftungLinks?: string;        // "Soll" oder "Haben"
    beschriftungRechts?: string;
    kontenkategorie?: string;          // "aktiv" | "passiv" | "aufwand" | "ertrag"
    eintraegeLinks: { gegenkonto: string; betrag: number }[];
    eintraegeRechts: { gegenkonto: string; betrag: number }[];
    saldo?: { betrag: number; seite: 'links' | 'rechts' };
  }[] }
```

### 3.3 SuS-Ansicht

Klassische T-Darstellung pro Konto:

```
            Bank (1020)
         [▾ Kontenkategorie]
┌──────────────┬──────────────┐
│  [Soll    ▾] │  [Haben   ▾] │   ← Dropdown oder fix vorgegeben
├──────────────┼──────────────┤
│ AB  5'000    │              │   ← Anfangsbestand
│ [▾ Kto] [  ]│ [▾ Kto] [  ]│   ← Gegenkonto + Betrag
│   [+ Zeile]  │   [+ Zeile]  │
├──────────────┼──────────────┤
│              │ Saldo [    ] │
└──────────────┴──────────────┘
```

- Soll/Haben-Beschriftung als Dropdown (SuS zuordnen) oder fix vorgegeben
- Kontenkategorie-Dropdown optional einblendbar
- Mehrere T-Konten pro Aufgabe möglich
- Touch-freundlich: Buttons statt Drag & Drop für Einträge hinzufügen

### 3.4 LP-Editor

- Aufgabentext + optionale Geschäftsfälle-Liste
- Pro T-Konto: Kontonummer, Anfangsbestand, Einträge definieren
- Bewertungsoptionen: Checkboxen welche Kriterien bewertet werden
- Punkteverteilung pro Kriterium
- KI-Button: generiert T-Konten aus Geschäftsfällen

### 3.5 Auto-Korrektur

Regelbasiert, prüft nur aktivierte Bewertungskriterien:
- Beschriftung Soll/Haben korrekt?
- Kontenkategorie korrekt?
- Zunahme/Abnahme auf richtiger Seite?
- Buchungen korrekt? (Gegenkonto + Betrag, Reihenfolge flexibel)
- Saldo korrekt berechnet? (Betrag + Seite)

---

## 4. Fragetyp: Kontenbestimmung

### 4.1 Datenmodell (Frage)

```typescript
interface KontenbestimmungFrage extends FrageBase {
  typ: 'kontenbestimmung'
  aufgabentext: string
  modus: 'konto_bestimmen' | 'kategorie_bestimmen' | 'gemischt'
  aufgaben: Kontenaufgabe[]
  kontenauswahl: KontenauswahlConfig
}

interface Kontenaufgabe {
  id: string
  text: string                         // Geschäftsfall
  erwarteteAntworten: KontenAntwort[]
}

interface KontenAntwort {
  kontonummer?: string
  kategorie?: 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'
  seite?: 'soll' | 'haben'
}
```

### 4.2 Antwort-Type

```typescript
| { typ: 'kontenbestimmung'; aufgaben: Record<string, {
    antworten: {
      kontonummer?: string;
      kategorie?: string;
      seite?: string;
    }[];
  }> }
```

### 4.3 SuS-Ansicht

Kompakte Tabelle, Spalten je nach Modus:

| Geschäftsfall | Konto | Kategorie | Seite |
|---------------|-------|-----------|-------|
| Miete bar bezahlt | [▾ Konto] | [▾ Kat.] | [▾ S/H] |
|                   | [▾ Konto] | [▾ Kat.] | [▾ S/H] |

- Pro Geschäftsfall 2 Zeilen (Soll + Haben)
- Spalten werden je nach Modus ein-/ausgeblendet

### 4.4 LP-Editor

- Modus wählen
- Geschäftsfälle als Liste eingeben
- Pro Fall: erwartete Konten + Kategorie + Seite
- KI-Button: generiert Geschäftsfälle mit Lösungen

### 4.5 Auto-Korrektur

- Regelbasiert
- Teilpunkte pro korrekte Antwort (Konto, Kategorie, Seite separat)
- Reihenfolge der Konten pro Geschäftsfall flexibel

---

## 5. Fragetyp: Bilanz/ER-Struktur

### 5.1 Datenmodell (Frage)

```typescript
interface BilanzERFrage extends FrageBase {
  typ: 'bilanzstruktur'
  aufgabentext: string
  modus: 'bilanz' | 'erfolgsrechnung' | 'beides'
  kontenMitSaldi: KontoMitSaldo[]     // Vorgegebene Konten mit Beträgen
  loesung: BilanzERLoesung
  bewertungsoptionen: BilanzERBewertung
}

interface KontoMitSaldo {
  kontonummer: string
  saldo: number
}

interface BilanzERLoesung {
  bilanz?: BilanzStruktur
  erfolgsrechnung?: ERStruktur
}

interface BilanzStruktur {
  aktivSeite: {
    label: string                      // "Aktiven"
    gruppen: BilanzGruppe[]
  }
  passivSeite: {
    label: string                      // "Passiven"
    gruppen: BilanzGruppe[]
  }
  bilanzsumme: number
}

interface BilanzGruppe {
  label: string                        // z.B. "Umlaufvermögen"
  konten: string[]                     // Kontonummern in korrekter Reihenfolge
}

interface ERStruktur {
  stufen: ERStufe[]
}

interface ERStufe {
  label: string                        // z.B. "Bruttoergebnis"
  aufwandKonten: string[]
  ertragKonten: string[]
  zwischentotal: number
}

interface BilanzERBewertung {
  seitenbeschriftung: boolean
  gruppenbildung: boolean
  gruppenreihenfolge: boolean
  kontenreihenfolge: boolean
  betraegeKorrekt: boolean
  zwischentotale: boolean
  bilanzsummeOderGewinn: boolean
  mehrstufigkeit: boolean              // Nur ER
}
```

### 5.2 Antwort-Type

```typescript
| { typ: 'bilanzstruktur'; bilanz?: {
    linkeSeite: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] };
    rechteSeite: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] };
    bilanzsummeLinks?: number;
    bilanzsummeRechts?: number;
  };
  erfolgsrechnung?: {
    stufen: { label: string; konten: { nr: string; betrag: number }[]; zwischentotal?: number }[];
    gewinnVerlust?: number;
  } }
```

### 5.3 SuS-Ansicht — Bilanz

SuS baut die Bilanz selbst auf:

```
        [____________] ← Titel-Input
┌─────────────────────┬─────────────────────┐
│ [Seitenlabel    ▾]  │ [Seitenlabel    ▾]  │  ← Dropdown: Aktiven/Passiven
├─────────────────────┼─────────────────────┤
│ [Gruppenlabel     ] │ [Gruppenlabel     ] │  ← Input
│ [▾ Konto]   [Betrag]│ [▾ Konto]  [Betrag]│
│ [+ Konto]           │ [+ Konto]           │
│ Total:      [      ]│ Total:      [      ]│
├─────────────────────┤─────────────────────┤
│ [Gruppenlabel     ] │ [Gruppenlabel     ] │
│ [▾ Konto]   [Betrag]│ [▾ Konto]  [Betrag]│
│ [+ Konto] [+ Gruppe]│ [+ Konto] [+ Gruppe]│
├─────────────────────┼─────────────────────┤
│ Bilanzsumme [      ]│ Bilanzsumme [      ]│
└─────────────────────┴─────────────────────┘
```

- Seitenbeschriftung als Dropdown
- Gruppen: Freitext-Label + Konten-Dropdowns + Beträge
- Reihenfolge ändern über Pfeil-Buttons (↑↓) — touch-freundlich, kein Drag & Drop nötig
- Zwischentotale und Bilanzsumme als Inputs

### 5.4 SuS-Ansicht — Erfolgsrechnung (mehrstufig)

```
        Erfolgsrechnung 1.1.–31.12.2025
┌────────────────────────────────────────┐
│ [Stufenlabel                        ] │
│   [▾ Ertragskonto]          [Betrag] │
│   [▾ Aufwandkonto]         -[Betrag] │
│   [+ Konto]                           │
│   ────────────────────────────────── │
│   [Zwischentotal-Label]     [      ] │
├────────────────────────────────────────┤
│ [+ Stufe]                              │
├────────────────────────────────────────┤
│ Gewinn / Verlust            [      ] │
└────────────────────────────────────────┘
```

- Stufen hinzufügen/entfernen
- Pro Stufe: Aufwand-/Ertragskonten + Zwischentotal
- Mehrstufigkeit flexibel (1-stufig bis vollständig)

### 5.5 LP-Editor

- Modus wählen: Bilanz / ER / Beides
- Konten mit Saldi vorgeben (Rohdaten für SuS)
- Musterlösung: Struktur aufbauen (gleiche UI wie SuS, vorbefüllt)
- Bewertungsoptionen: Checkboxen
- KI-Button: generiert Musterlösung aus Kontenliste

### 5.6 Auto-Korrektur

Regelbasiert, je nach aktivierten Kriterien:
- Seitenbeschriftung korrekt?
- Gruppen vorhanden und korrekt benannt?
- Reihenfolge der Gruppen?
- Konten in richtiger Gruppe und Reihenfolge?
- Beträge korrekt?
- Zwischentotale korrekt?
- Bilanzsumme / Gewinn-Verlust korrekt?

---

## 6. Aufgabengruppe (generisches Plattform-Konzept)

### 6.1 Konzept

Bündelt mehrere Teilaufgaben unter gemeinsamem Kontext. Fachübergreifend nutzbar — nicht FiBu-spezifisch.

### 6.2 Datenmodell

Die Aufgabengruppe wird als **spezieller Frage-Typ** implementiert (erweitert `FrageBase`), damit sie in derselben Fragenbank gespeichert, über dieselben CRUD-Operationen verwaltet und in `PruefungsAbschnitt.fragenIds` referenziert werden kann.

```typescript
interface AufgabengruppeFrage extends FrageBase {
  typ: 'aufgabengruppe'
  kontext: string                      // Gemeinsamer Text (Tiptap/Markdown)
  kontextAnhaenge?: FrageAnhang[]
  teilaufgabenIds: string[]            // IDs der enthaltenen Fragen (geordnet)
  // punkte: number  — geerbt von FrageBase, = Summe der Teilaufgaben
  // material wird über PruefungsMaterial der Prüfung abgedeckt
}
```

### 6.3 Integration in Prüfungsstruktur

**Keine strukturelle Änderung an `PruefungsConfig` nötig.** Da `Aufgabengruppe` ein Frage-Typ ist, wird ihre ID einfach in `PruefungsAbschnitt.fragenIds` aufgenommen wie jede andere Frage. Die enthaltenen Teilaufgaben-IDs werden NICHT separat in `fragenIds` gelistet — sie sind über `teilaufgabenIds` der Aufgabengruppe erreichbar.

```typescript
// Bestehende Struktur bleibt unverändert:
interface PruefungsAbschnitt {
  titel: string;
  beschreibung?: string;
  fragenIds: string[];          // Kann nun auch IDs von AufgabengruppeFrage enthalten
  punkteOverrides?: Record<string, number>;
}
```

### 6.4 Speicherung / Backend

- Aufgabengruppen werden in der **bestehenden Fragenbank** (Google Sheet) gespeichert, gleiche Zeile wie andere Fragen
- `typ: 'aufgabengruppe'` als Diskriminator
- `teilaufgabenIds` als JSON-Array in der Zelle
- CRUD über bestehende `speichereFrage` / `ladeFragenbank` Endpoints — kein neuer Backend-Code nötig
- Teilaufgaben sind eigenständige Fragen in derselben Fragenbank

### 6.5 Antwort-Type

Aufgabengruppen selbst haben keine eigene Antwort. Die SuS-Antworten werden pro Teilaufgabe gespeichert (mit deren jeweiliger Frage-ID als Key in `Record<string, Antwort>`). Das bestehende Auto-Save serialisiert automatisch alle Teilaufgaben.

### 6.6 SuS-Ansicht

- Kontext (Fallbeispiel) oben, bleibt sichtbar (sticky/aufklappbar)
- Teilaufgaben mit a), b), c) beschriftet
- Navigation innerhalb der Gruppe
- Jede Teilaufgabe nutzt ihren normalen Fragetyp-Renderer

### 6.7 LP-Editor

- Kontext-Textfeld (Tiptap)
- Teilaufgaben aus Fragenbank hinzufügen oder inline erstellen
- Reihenfolge per Drag & Drop (oder Pfeil-Buttons)
- Punkte: Summe der Teilaufgaben, automatisch berechnet
- KI-Button: "Fallbeispiel generieren"

### 6.8 Korrektur

- Aufgabengruppe als Block angezeigt
- Jede Teilaufgabe einzeln korrigiert (Auto-Korrektur oder manuell je nach Typ)
- Gesamtpunktzahl = Summe der Teilaufgaben

### 6.9 Beispiele über FiBu hinaus

- **Rechtsfall**: Freitext-Sachverhalt → MC-Gesetzesartikel → Freitext-Begründung
- **VWL-Analyse**: Berechnung → MC → Freitext-Interpretation
- **FiBu-Prozess**: Eröffnungsbilanz → Buchungssätze → T-Konten → Schlussbilanz + ER

---

## 7. Implementierungsreihenfolge

| Phase | Inhalt | Abhängigkeiten |
|-------|--------|---------------|
| 1 | Shared Infrastruktur (Kontenrahmen-JSON, KontenSelect, shared Types) | — |
| 2 | Fragetyp Buchungssatz (Editor, Renderer, Auto-Korrektur, KI-Aktionen) | Phase 1 |
| 3 | Fragetyp T-Konto | Phase 1 |
| 4 | Fragetyp Kontenbestimmung | Phase 1 |
| 5 | Fragetyp Bilanz/ER-Struktur | Phase 1 |
| 6 | Aufgabengruppe (generisch) | — |
| 7 | Journal (später) | Phase 1 |

KI-Aktionen und Auto-Korrektur werden jeweils zusammen mit dem Fragetyp implementiert.

### Erweiterbarkeit

Folgende Features sind bewusst aufgeschoben, die Architektur berücksichtigt sie aber:
- Kalkulation
- Geldflussrechnung
- Weitere ER-Stufen / Kontenrahmen-Varianten

---

## 8. Integrationspunkte (bestehende Architektur)

### 8.1 Pro neuem Fragetyp

1. **`src/types/fragen.ts`** — Interface + `Frage` Union-Type ergänzen
2. **`src/types/antworten.ts`** — `Antwort` Union-Type ergänzen
3. **`src/components/lp/frageneditor/editorUtils.ts`** — `FrageTyp` Union erweitern
4. **`src/components/fragetypen/`** — Neue SuS-Komponente
5. **`src/components/lp/frageneditor/`** — Neuer Editor
6. **`src/components/Layout.tsx`** — `renderFrage` Dispatcher erweitern
7. **`src/components/lp/composer/VorschauTab.tsx`** — Vorschau ergänzen
8. **`src/components/lp/KorrekturFrageZeile.tsx`** — Korrektur-Renderer
9. **`src/components/lp/KorrekturSchuelerZeile.tsx`** — Schüler-Korrektur
10. **`apps-script-code.js`** — Backend-Validierung
11. **`src/components/lp/frageneditor/useKIAssistent.ts`** — Neue AktionKeys
12. **`src/components/lp/FragenBrowser.tsx`** — Filter-Dropdown erweitern

### 8.2 Aufgabengruppe zusätzlich

- **Prüfungs-Composer** erweitern (Gruppen erstellen/bearbeiten)
- **SuS-Navigation** anpassen (Gruppen-Kontext sticky, Teilaufgaben a/b/c)
- **Monitoring** anpassen (Fortschritt pro Teilaufgabe)

### 8.3 Pool-Sync

FiBu-Fragetypen werden vorerst **nicht** in die Pool-Brücke integriert. `poolId` bleibt leer für diese Typen. Eine spätere Integration ist möglich, erfordert aber Erweiterung des Pool-Schemas.

### 8.4 Export (CSV/PDF)

Die bestehende Export-Logik (`exportUtils.ts`) muss für die neuen Fragetypen formatiert werden:
- Buchungssatz: Tabelle Soll/Haben/Betrag
- T-Konto: T-Darstellung als Text
- Bilanz/ER: Strukturierte Darstellung
- Aufgabengruppe: Kontext + Teilaufgaben sequentiell

Dies wird als Teil der jeweiligen Phase implementiert.
