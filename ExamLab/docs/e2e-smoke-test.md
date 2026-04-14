# E2E Smoke-Test Checklist — Prüfungsplattform

> Nach jedem grösseren Change einmal durchgehen. Nutze die Einrichtungsprüfung (`?id=einrichtung-sf-wr-27a28f`).
> Benötigt: 1 LP-Tab + 1 SuS-Tab (Google OAuth Login).

## Setup
- [ ] LP eingeloggt (`@gymhofwil.ch`)
- [ ] SuS eingeloggt (`@stud.gymhofwil.ch`)
- [ ] Prüfung gestartet (Live-Phase)

## SuS-Flow

### Navigation & Grundfunktion
- [ ] Navigationsleiste zeigt alle Teile (A–F) mit Fragennummern
- [ ] Weiter/Zurück-Buttons funktionieren
- [ ] Direkt-Navigation via Fragennummer in Sidebar
- [ ] Timer läuft korrekt
- [ ] "Gespeichert ✓" erscheint nach Beantwortung (Auto-Save)

### Fragetypen (je einmal beantworten)
- [ ] **MC Single** (Frage 1) — Option auswählen, grüne Markierung
- [ ] **MC Multiple** (Frage 2) — Mehrere Optionen, Checkboxen
- [ ] **Richtig/Falsch** (Frage 3) — Aussagen bewerten
- [ ] **Sortierung** (Frage 4) — ↑/↓ Pfeile verschieben Elemente
- [ ] **Hotspot** (Frage 5) — Klick auf Bild, Markierung erscheint
- [ ] **Freitext** (Frage 6) — Text eingeben, Formatierung (fett/kursiv)
- [ ] **Lückentext** (Frage 7) — Lücken ausfüllen
- [ ] **Freitext lang** (Frage 8) — Mehrzeiliger Text
- [ ] **Formel** (Frage 9) — LaTeX eingeben, Vorschau erscheint
- [ ] **Lückentext Inline-Choice** (Frage 10) — Dropdown in Lücke
- [ ] **Zuordnung** (Frage 11) — Dropdowns zuweisen
- [ ] **Berechnung** (Frage 12) — Zahlen + Rechenweg eingeben
- [ ] **Bildbeschriftung** (Frage 13) — Labels auf Bild eingeben
- [ ] **DragDrop** (Frage 14) — Labels in Zonen ziehen
- [ ] **Zeichnen** (Frage 15) — Stift/Linie zeichnen, Farbwechsel
- [ ] **PDF-Annotation** (Frage 16) — PDF blättern, Highlight/Kommentar
- [ ] **Code** (Frage 17) — Python-Code eingeben, Tab funktioniert
- [ ] **Buchungssatz** (Frage 18) — Soll/Haben Dropdown + Betrag
- [ ] **T-Konto** (Frage 19) — Konten-Eingabe
- [ ] **Bilanz/ER** (Frage 20) — Struktur ausfüllen
- [ ] **Aufgabengruppe** (Frage 21–22) — Teilaufgaben im Kontext
- [ ] **Material-Frage** (Frage 23) — Materialpanel öffnen

### Abgabe
- [ ] "Abgeben" → Dialog zeigt beantwortet/nicht beantwortet
- [ ] "Definitiv abgeben" → Bestätigungsseite
- [ ] Bestätigungsseite zeigt Name + E-Mail

## LP-Flow

### Live-Monitoring
- [ ] SuS erscheint mit Status "Aktiv"
- [ ] Fragen-Nummer aktualisiert sich
- [ ] Fortschritt (%) aktualisiert sich
- [ ] Nach Abgabe: Status "Abgegeben", Fortschritt nicht 0%
- [ ] "Abgegeben: X / Y" korrekt

### Auswertung
- [ ] Ergebnis-Übersicht: Teilnehmer/Abgegeben/Erzwungen korrekt
- [ ] "Autokorrektur starten" → deterministische Fragen bekommen Punkte
- [ ] Punkte-Feld zeigt tatsächliche Punkte (nicht 0 bei Auto-Korrektur)
- [ ] "Geprüft" Checkbox funktioniert

### Korrektur-Vollansicht
- [ ] **MC**: Optionen mit ✓/✗ und Farbcodierung
- [ ] **Freitext**: Schülertext angezeigt
- [ ] **Zeichnung**: PNG-Bild der Zeichnung sichtbar
- [ ] **PDF**: PDF-Dokument in Korrektur sichtbar (nicht nur "X Markierungen")
- [ ] **Formel**: KaTeX-Rendering + Raw-Text
- [ ] **Hotspot**: Bild mit Markierungspositionen
- [ ] **Bildbeschriftung**: Bild mit Labels an Positionen
- [ ] **DragDrop**: Bild mit Zonen und platzierten Labels
- [ ] **Code**: Monospace-Darstellung
- [ ] **Sortierung**: Reihenfolge mit ✓/✗ pro Position
- [ ] **FiBu-Typen**: Buchungssatz/T-Konto/Bilanz korrekt

### Export & PDFs
- [ ] Excel-Export erstellt Datei
- [ ] Korrektur-PDFs generierbar

## iPad-spezifisch (manuell am Gerät)
- [ ] Touch DnD bei Sortierung
- [ ] Tap-to-select bei DragDrop
- [ ] Zeichnen mit Finger (16px Toleranz)
- [ ] PDF-Werkzeuge mit Touch
- [ ] Sticky Header korrekt (dvh)

---

*Letzte Durchführung: ___________  |  Version: ___________  |  Ergebnis: ☐ OK  ☐ Probleme*
