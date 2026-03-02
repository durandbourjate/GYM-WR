# Projekt Interaktive Unterrichtsplanung

Interaktives Tool für die Unterrichtsplanung

## V1 — Grundkonzept

- Soll Excel- bzw. Word-Dokumente ersetzen, in welchen bisher Unterrichtsplanung geschieht.
- Das Tool soll mir helfen zu planen, in welchen Lektionen ich welche Inhalte durchführe.
- Beispiele für bisherige Herangehensweise zur Verfügung stellen.
- Grundsätzlich eine Matrix mit:
  - Spalten: Kurse (SF WR GYM 1 29c, SF WR GYM 2 28bc29fs, SF WR GYM 3 27a28f, SF WR GYM 4, EWR 29c, …)
  - Zeilen: DIN-Wochen
- Modulare Felder pro Lektion, gruppierbar (häufig Doppellektionen als Paket).
- Sichtbar machen, wann Unterricht stattfindet. Planbare Ausfälle (Ferien, Sonderwochen, Events wie Besuchstag, Fachschaftstag, Terminkonflikte etc.).
- In Übersicht in wenigen Worten beschreiben worum es geht: Fachbereich, Überthema, Unterthema (z.B. VWL, Einführung Preismodell / FIBU K.3.2 Bilanzkonten / Recht OR AT Entstehung).
- Farbcode: auf einen Blick zeigt ob Ferien, Ausfälle, Unterricht (unterschiedlich nach Fach).
- Einfach Anpassungen vornehmen: bei Krankheit/Ausfall ganzen Verlauf "hinausschieben", Ferien/fixe Ausfälle bleiben fix.
- Lektionen-Bausteine gruppierbar als Sequenz (z.B. 10 Lektionen zu einem Thema).
- Verlinken von LearningView-Bausteinen.
- Lokal gespeicherte Materialien, Links, Kalendereinträge, Mails verlinken.
- Bausteine/Kurse/Themensequenzen speichern für Wiederverwendung über Jahre hinweg.
- Verschiedene Ansichten: Überblick ganzes Jahr, Überblick ein Kurs, Überblick Themensequenz.
- Interaktion mit anderen Arbeitsprozessen (Unterrichtsadministration).
- Vorgaben einhalten (z.B. Mindestanzahl Noten pro Zeitspanne).

## V2 — Interaktion & Navigation

- Überblick über alle 4 Jahre beim SF? EWR 1J, mit WEGM wird GF WR 2J.
- Infos (Hilfe) bei Mouse-Over auf Buttons.
- Doppelklick auf Lektion → Info öffnen. Klick neben Info-Feld → schliessen.
- Titel der Lektion = Oberthema & Unterthema.
- Lehrplanbezug automatisch? Taxonomiestufe automatisch?
- Importierte Lektionen automatisch Blocktyp zuordnen.
- Sequenz-Markierung: bei Klick im Sequenzentab direkt zum Block.
- Fach-Tag automatisch setzen (aus Kursspalte). Farbe auch.
- Auswahl hervorheben im Übersichtsplan.
- Multiple Kacheln: Command+Klick (einzeln), Shift+Klick (von–bis).
- Interaktion möglichst im Übersichtsplan, wenig in Menüs.
- Leere Zellen anklickbar und füllbar.
- Mehrfachauswahl Drag&Drop verschieben.
- Klick auf Kachel → direkt Detailansicht.
- Sequenzenmenü: Block-Detail-Menü mit Infos für ganzen Block.
- Ferien/Sonderwochen nicht per Drag&Drop verschiebbar (fixieren).
- Buttons neue Sequenz / neue Kachel in Titelzeile.
- Ferien/Sonderwochen-Kacheln in voller Grösse.
- Alle Spalten gleich breit.
- Buttons (einfügen, push, details) bei 1× Klick auf Kachel minimalistisch (+, Pfeil, i).
- Detail-Modal bei Mouse-Over (nach 2s).
- Kursfilter bei Doppelklick auf Klassenname.

## V3 — Farbcode

- Farbcode ändern: VWL orange, BWL blau, Recht grün (wie LearningView/Übungspool). Informatik grau.
- SF läuft Di-Do-Di-Do: sollte in Sequenzen so abgebildet sein.

## V4 — Auswahl & Blocktypen

- Taxonomiestufen nicht nötig (in LearningView abgedeckt).
- Shift+Klick-Auswahl buggy.
- Details-Menü Block-Typ: gruppieren (Beurteilungstypen in aufklappbarem Button).
- Sequenznamen unklar (c17, c31 etc.).
- Externe Verlinkung bei Block-Details (LearningView, Übungspool).
- Details bei Klick auf Block-Titel (nicht Details-Button).
- Mehrere Kacheln anklicken → zu Sequenz zusammenfügen.
- Abwählen mit Esc oder Klick ins Leere.

## V5 — Kategorien & Dauer

- Doppelklick in leeres Feld → Menü "neue UE / neue Sequenz" (nicht schon bei Klick).
- Einfacher Klick in leeres Feld → bisherige Auswahl abwählen.
- Block-Typ "Lektion" als Standard.
- Zwei Rubriken: Block-Typ (Lektion, Beurteilung, Event, Ferien) und Block-Untertyp (Lektion→Einführung/Übung/Theorie/SOL/Diskussion, Beurteilung→Prüfung schriftlich/mündlich/Präsentation/Projektabgabe, Event→Exkursion/Tag d. offenen Tür/Ausfall/Auftrag).
- Eigene Labels hinzufügbar.
- Dauer eintragbar: Vorwahl 1L/2L, benutzerdefinierbare Zeit.
- Kategorie → Typ (nicht "Untertyp").

## V6 — Einstellungsmenü & SOL

- Shift+Klick Auswahl klappt, Drag&Drop auch.
- Bei Mehrfachauswahl: Sonderwochen & Ferien überspringen.
- Shift-Klick nur Lektionen des Kurses. Command-Klick für leere Zellen.
- Ansicht Mo-Di-Mi-Do-Fr. Mehrtägige Kurse intelligent beide Spalten auswählen.
- Informatik grau.
- SOL mit Kurs verknüpfen: Tag bei Kachel, Details in Detailansicht (Dauer, Thema, Materiallink).
- Einstellungsmenü:
  - Leerer Planer ohne Import möglich
  - Stundenplan → Kurse hinzufügen
  - Sonderwochen (welche Kurse betroffen)
  - Default Lektionendauer
  - Fächer definieren
  - Ferien definieren
- Dauer: nur mit xxmin (45/90/135min), "Halbtag"/"Ganztag" möglich.

## V7 — Sequenzansicht & Drag

- Scrollen bei Mouse-Over-Menü soll in Menüs scrollen, nicht im Plan.
- Klick+Hold+Drag auf leere Zellen → auswählen für neue Sequenz.
- Sequenzansicht:
  - Klick auf Block-Titel → Details anzeigen
  - Klick auf Titel → Sequenz im Plan auswählen
  - Klick auf KW → Kachel im Plan auswählen
  - Materiallinks in Detailansicht
  - Lektionen auflisten bei Block-Detail, Klick → Lektiondetailansicht
- Tab "Detail" → "Unterrichtseinheit", anderer → "Sequenz".

## V8 — Sequenz/Block-Konzept

- "Block" in Sequenzmenü = Sequenz (Reihe von Lektionen).
- Direkt Blöcke auflisten (gefiltert nach Klasse/Fachbereich).
- Klick auf Reihentitel → Reihe im Plan aktivieren.
- Aufklappbarer Felder-Mechanismus für Sequenz-Einstellungen.
- Mittlere Zoom-Ansicht: Kurse vertikal, wie Wochenansicht aber kompakter.
- Titelzeilen fixiert (sticky bei Scrollen).

## V9 — Kontrast, Batch & Reihen

- Ansicht zu dunkel, mehr Kontrast. Vergangene Wochen aufhellen.
- Bug: Sequenz bleibt nach Schliessen des Menüs ausgewählt.
- Häufig falsche Fachbereich-Tags.
- Shift-Klick über Semesterwechsel möglich machen.
- Batch-Bearbeitung: für Mehrfachauswahl Fachbereich, Kategorie, Typ, Dauer, SOL setzen.
- Sequenz-Tab: direkt Blöcke ("Sequenz") auflisten, gefiltert.
- Aufklappbare Felder/Lektionen bei Sequenz-Detail.
- Fachbereich-Klick soll Modal nicht zuklappen.
- Reihen-Konzept: mehrere Sequenzen mit gleichem Oberthema gehören zusammen.
- Warnung bei Verschiebung wenn Rhythmisierung 1L-2L gestört wird.
- Sequenz-Hinweislinien: sticky bei Kachel, breiter, besser klickbar, Farbcode nach Fach.
- Legende: BWL blau, Recht grün, VWL orange, Ferien weiss, Event grau.

## V10 — Sammlung & Notizen

- Im Detail-Menü UE zu Sequenz hinzufügen (neue/bestehende).
- Materialsammlung: Sequenzen/UE speichern für spätere Jahre.
  - Szenario: Lektionen inkl. Sequenzen vom letzten Jahr übernehmen.
  - Szenario: Neu starten, stellenweise auf Sammlung zurückgreifen.
- Dritter Tab "Sammlung" (neben Sequenzen).
- Feiertage tracken und blockieren.
- Niederschwelliger Weg für Notizen/Details: aufklappbare Detailspalte neben Kurs (wie Excel-Gruppierung).
- Tabs Felder/Lektionen: aktiver Tab visuell hervorheben.
- Fachbereich-Klick soll Modal nicht zuklappen.
- Reihen: mehrere Sequenzen mit gleichem Oberthema zusammenfassen.

## V11 — Direktbearbeitung

- "i" bei Kacheln: Thema/Notizen bei Mouse-Over, aufklappbare Detailspalte für ganzen Kurs.
- Doppelklick leere Zelle → Menü neue UE/Sequenz (Buttons buggy).
- Klick auf Sequenzbalken → auch Bearbeitungsmenü öffnen.
- Klick auf Sequenz-Tag in UE-Detail → zur Sequenz springen.
- Bei Lektionen-Ansicht in Sequenz: Klick auf UE → Details aufklappen, Doppelklick → Tab wechseln.

## V12 — Zoom & Drag

- Mittlere Zoom-Ansicht: alle KW zeigen.
- Sequenz-Tag klicken → direkt zur Sequenz scrollen.
- Click+Drag leere Felder → Sequenz erstellen, Zellen hervorheben.
- Click+Drag auch auf gefüllte Zellen (oder Shift-Klick).
- Klick auf Sequenz aus Zoom 2 → Sequenz im Menü öffnen.
- "i"-Symbol bei Kacheln entfernen (Doppelklick reicht).
- Einstellungen-Button in Kopfzeile aktivieren.
- Export/Import in Einstellungsmenü legen.
- Grauer Text auf dunkler Fläche schlecht lesbar.

## V13 — Hover-Preview & Zoom 2

- Mouse-Over UE: Detailfeld immer anzeigen (auch bei Kacheln am Bildschirmrand).
- Zoom 2: Felder in Fachfarbe (nicht Text). Text grösser.
- Zoom 2: als Jahr zeigen (Wochentage nicht relevant). Bei 2-Tage-Kursen: breiter Balken bei durchgehender Sequenz, 2 schmale bei separaten.
- SOL bei Sequenzen: Total zu allen zugehörigen UE.
- Feature: Google-Kalender im Tool.
- Details-Toggle grösser. Spaltenbreite anpassbar (2× normal). Notizentext mit Umbrüchen.

## V14 — Auto-Save

- Nichts angewählt → Detail-Fenster schliessen.
- Änderungen automatisch speichern. Speicher-Button durch "Nicht speichern" ersetzen.
- Zoom 2: nicht in Semester aufteilen, durchgehend nach Kursen.

## V15 — Zellauswahl

- Klick auf leere Zelle → anwählen.
- Klick+Drag auf leere Zellen → anwählen (optisch hervorheben).
- Zoom 2: Schrift sehr klein.
- Zoom 2 Sequenz anwählen → Detailfenster: Sequenz ganz oben.

## V16 — Calendar & Batch

- Google Calendar Push: Ferien/Sonderwochen nicht als Einzellektion.
- Zoom 2: Sticky-Kopfzeile abgeschnitten.
- Batch-Bearbeitung: Buttons zeigen welche angewählt (farbliche Hervorhebung).

## V17 — Klick+Drag & Toggle

- Klick auf leere Zelle markiert. Klick+Drag noch nicht.
- Auto-Save für UE und Sequenzen.
- Zoom 2: auch einzelne UE anzeigen, nicht nur Sequenzen.
- Zoom 3: Toggle vergangene Wochen dunkler/gleich.
- Shift-Klick bei Mehrtageskursen: Popup "beide Tage auswählen?".
- Sequenz-Klick: aktive Sequenz ganz oben, Felder/Lektionen default ausklappen.

## V18 — Ferien/Sonderwochen-Darstellung

- Ferien stärker differenzieren (leere Blöcke mit Beschriftung).
- Studienreisen als durchgehende Blöcke (ausser wenn Kurs trotzdem Unterricht hat).
- Einzellektionen bei Sonderwochen/Ferien normalgross.
- Sequenz-Linie in Fachfarbe (VWL orange, BWL blau, Recht grün).
- Alt-Shift-Klick für Mehrfachauswahl Zweitageskurse. Möglichst intuitiv.
- Lehrplanziel weniger prominent. Beschreibung nach Unterthema.
- Ferien nicht als Lektionen in Sequenz.
- Felder/Lektionen default ausklappen.
- LearningView-Link und Materiallink vereinfachen auf nur "Material".

## V19 — Zoom 2 Fixes

- Ferien: keine Sequenz-Balken mit Fachfarbe.
- Zoom 2: Einzelne UE immer noch nur bei 30s sichtbar.
- Zoom 2: Kopfzeile schneidet ab. Schrift heller. Ferien kaum lesbar.
- Hell/Schatten-Toggle auch in Zoom 2.

## V20 — Mehrfachauswahl & Events

- Esc soll auch Suchfeld-Eingabe löschen.
- Shift-Klick nur im selben Kurs (SF WR GYM2 an beiden Tagen).
- Ausfälle wegen Einzelevents wie IW/Ferien darstellen?
- IW-Plan verknüpfen.
- Ferien, Sonderwochen, Einzeltermine deutlicher unterscheidbar.
- Halbklassen-Mechanismus breiter: z.B. rotes P bei Prüfungen (2-3 Zeichen, Farbe wählbar).
- UE mit Aufträgen wie normaler Unterricht darstellen.
- Sonderwochen durchgehend, Unterricht darüber legen.

## V21 — Menü & Batch

- Menü-Icons in Kopfzeile bei geöffnetem Detailmenü.
- Mehrfachauswahl → Batch → neue Sequenz / zu bestehender hinzufügen.
- Möglichst alles bearbeitbar (Zeiten, KW etc. über Bearbeitungsbutton).

## V22 — Multi-Planer

- Mehrere Planer (Tabs) für mehrere Anstellungen.
- Einstellungen: "Neuer Unterrichtsplaner" als Tab. UE/Sequenzen zwischen Planern (über Sammlung).
- Klick auf Sequenz-Linie → richtige Sequenz im Menü öffnen.
- Neu aufsetzen mit Excel-Import schwierig.

## V30 — Neuer Planer

- Bug: bei "Kurs hinzufügen" muss für jedes Zeichen neu in Zelle klicken.
- Voreingestellte Ferien/Sonderwochen: wie in Plan übertragen?
- UE/Sequenzen erstellt → sollten in Zoom 3 sichtbar sein (Bug: erscheinen in Zoom 2).
- Zoom 1: woher kommen vorausgefüllte Daten bei neuem Kurs?
- Neue Sequenzen: "Neuer Block" umbenennen → Name = Oberthema?

## V31 — Einstellungen & Details

- Einstellungen:
  - Kurs speichern/exportieren/archivieren
  - Zeit-Eingabe grösser. SOL wie HK/S1/S2 wählbar. Nicht 1/2/3L sondern 45min/90min/Andere.
  - Sonderwochen: IW-Konzept pro KW und GYM-Stufe (IW27 GYM3: SF-Woche, IW27 GYM2: Medienwoche). "Hinzufügen"-Button. Mit Sammlung verlinken. "Aus Sammlung" oder "neu erstellen".
  - Ferien: Tagesauswahl möglich (Standard ganze Woche).
  - "Einstellungen anwenden"-Button weglassen (laufend speichern).
- Details UE/Sequenzen:
  - UE-Details auf Sequenz übertragen ("bei Sequenz anwenden").
  - Sequenz-Name = Oberthema (auto-sync).
  - UE-Name: Unterthema als Default.
  - Im Planer (Zoom 3) UE erstellen → Mehrfachauswahl → Sequenz.

## V32 — Vereinfachung

- Klick&Drag für neue Sequenz: Zellen hervorheben.
- Zoom 2 vorerst weglassen (Mehrwert unklar, kompliziert Erstellung).

## Umsetzungsstatus V31/V32 (v3.50–v3.51)

**Erledigt:**
- ✅ Zoom 2 entfernt
- ✅ Settings Auto-Save
- ✅ Kurs: SOL-Checkbox, grössere Zeit-Inputs, 45min/90min/Andere
- ✅ Ferien: Tagesauswahl für partielle Wochen
- ✅ Sequenz-Name = Oberthema (auto-sync)
- ✅ UE-Name: Unterthema als Fallback in Lektionsliste
- ✅ "Auf Sequenz anwenden"-Button im DetailPanel

**Offen:**
- Sonderwochen hierarchisch pro GYM-Stufe (IW-Konzept)
- "Aus Sammlung laden" bei Hinzufügen
- Kurs exportieren/speichern/archivieren
- Klick&Drag für Mehrfachauswahl/Sequenz-Erstellung
