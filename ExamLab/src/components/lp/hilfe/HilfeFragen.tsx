import { Titel, Untertitel, Text } from './layoutHelpers'

export default function HilfeFragen() {
  return (
    <div>
      <Titel>Fragen & Fragensammlung</Titel>
      <Text>
        Die Fragensammlung ist der zentrale Ort für alle Prüfungsfragen. Fragen können in mehreren Prüfungen wiederverwendet werden.
      </Text>

      <Untertitel>20 Fragetypen</Untertitel>
      <Text>
        <strong>Multiple Choice</strong> — Einfach- oder Mehrfachauswahl. Optionen werden bei der Prüfung automatisch gemischt.
      </Text>
      <Text>
        <strong>Freitext</strong> — Kurz, mittel oder lang. SuS können mit Fettschrift und Überschriften formatieren. Optional: Min/Max-Wortlimit konfigurierbar — Warnung bei Unter-/Überschreitung.
      </Text>
      <Text>
        <strong>Lückentext</strong> — Text mit Platzhaltern (z.B. {`{{1}}`}, {`{{2}}`}). Zwei Modi pro Frage wählbar: <strong>Freitext</strong> (SuS tippt — mehrere akzeptierte Antworten/Synonyme pro Lücke) oder <strong>Dropdown</strong> (SuS wählt aus 5 Optionen: 1 korrekte + 4 Distraktoren). Editor zeigt beide Felder, das inaktive ist gedimmt — Toggle pro Frage im Editor. Für alle 253 Bestands-Lückentext-Fragen kann der Modus auch zentral umgeschaltet werden: <strong>Einstellungen → Fragensammlung → Bulk-Toggle</strong> (Admin-only).
      </Text>
      <Text>
        <strong>Zuordnung</strong> — Paare von Begriffen und Definitionen. SuS ordnen per Dropdown zu.
      </Text>
      <Text>
        <strong>Richtig/Falsch</strong> — Mehrere Aussagen, die einzeln als richtig oder falsch bewertet werden.
      </Text>
      <Text>
        <strong>Berechnung</strong> — Numerische Ergebnisse mit definierbarer Toleranz und Einheit. Rechenweg kann optional verlangt werden.
      </Text>

      <Untertitel>Finanzbuchhaltung (FiBu)</Untertitel>
      <Text>
        <strong>Buchungssatz</strong> — Geschäftsfälle im Format «Soll-Konto an Haben-Konto Betrag». Konten aus dem Schweizer KMU-Kontenrahmen. Ein Betrag pro Buchungssatz, klar strukturiert.
      </Text>
      <Text>
        <strong>T-Konto</strong> — T-Konten-Form mit Soll/Haben-Buchungen, Gegenkonten, Geschäftsfall-Nummer und Saldo (Eingabefeld auf beiden Seiten des T). Kontenkategorie-Badge in FiBu-Farben (Aktiv=gelb, Passiv=rot, Aufwand=blau, Ertrag=grün).
      </Text>
      <Text>
        <strong>Kontenbestimmung</strong> — Geschäftsfall → Konto/Kategorie/Seite bestimmen. 3 Modi verfügbar.
      </Text>
      <Text>
        <strong>Bilanz/ER</strong> — Zweispalten-Bilanz und mehrstufige Erfolgsrechnung. Seiten starten neutral, färben sich nach Auswahl (Aktiven=gelb, Passiven=rot).
      </Text>
      <Text>
        <strong>Konten-Kategoriefarben</strong> — Im Konto-Dropdown werden Konten farblich nach Kontenart hervorgehoben. Diese Farben können pro Frage deaktiviert werden (Checkbox in der Kontenauswahl-Sektion).
      </Text>

      <Untertitel>Weitere</Untertitel>
      <Text>
        <strong>Aufgabengruppe</strong> — Bündelt mehrere Teilaufgaben unter einem gemeinsamen Kontext/Fallbeispiel. Teilaufgaben werden direkt im Editor erstellt (alle Fragetypen wählbar). Jede Teilaufgabe hat einen eigenen Fragetext, Punkte, Musterlösung und Bewertungsraster. Die Nummerierung (a, b, c, ...) erfolgt automatisch.
      </Text>
      <Text>
        <strong>Zeichnen/Visualisierung</strong> — Zeichenfläche mit 6 Werkzeugen: Stift (3 Stärken, durchgehend/gestrichelt), Linie, Pfeil, Rechteck, Ellipse, Text. Alle Werkzeuge in Dropdown-Menüs. Farben (3×3 Grid), Textformatierung (Grösse S/M/L/XL, Fett, Rotation). Selektierte Elemente nachträglich bearbeitbar.
      </Text>
      <Text>
        <strong>PDF-Annotation</strong> — LP lädt ein PDF hoch (z.B. Zeitungsartikel, Gesetzestext). SuS annotieren direkt auf dem PDF mit Werkzeugen: Text-Highlighter, Kommentar, Freihand-Zeichnung (3 Stärken + gestrichelt) und Label-Zuordnung. LP kann vordefinierte Kategorien festlegen (z.B. Stilmittel, Argumentationstypen). Korrektur mit optionalem KI-Vorschlag.
      </Text>

      <Untertitel>Interaktive Fragetypen</Untertitel>
      <Text>
        <strong>Sortierung</strong> — Elemente in die richtige Reihenfolge bringen (Drag & Drop). Auto-Korrektur mit optionalen Teilpunkten.
      </Text>
      <Text>
        <strong>Hotspot</strong> — Klickbereiche auf einem Bild markieren. LP definiert Rechteck-/Kreis-Bereiche, SuS klickt die richtigen Stellen. Bild per Drag &amp; Drop hochladen oder URL eingeben. Auto-Korrektur.
      </Text>
      <Text>
        <strong>Bildbeschriftung</strong> — Labels an vordefinierten Positionen auf einem Bild eintragen. Bild per Upload oder URL. Mehrere akzeptierte Antworten pro Position möglich. Auto-Korrektur.
      </Text>
      <Text>
        <strong>Drag & Drop (Bild)</strong> — Labels aus einem Pool auf Zielzonen im Bild ziehen. Bild per Upload oder URL. Kann Distraktoren enthalten. Auto-Korrektur.
      </Text>

      <Untertitel>MINT & Code</Untertitel>
      <Text>
        <strong>Code-Editor</strong> — SuS schreiben Code mit Syntax-Highlighting. 7 Sprachen: Python, JavaScript, SQL, HTML, CSS, Java, TypeScript. Manuelle oder KI-gestützte Korrektur.
      </Text>
      <Text>
        <strong>Formel (LaTeX)</strong> — SuS geben mathematische Formeln als LaTeX ein mit Live-Vorschau. Symbolleiste für häufige Zeichen. Auto-Korrektur mit normalisiertem Vergleich.
      </Text>
      <Text>
        <strong>Audio-Aufnahme</strong> — SuS nehmen Audio auf (z.B. Aussprache, mündliche Erklärung). Manuelle Korrektur durch LP. Audio wird zu Google Drive hochgeladen.
      </Text>

      <Untertitel>Metadaten pro Frage</Untertitel>
      <Text>
        Jede Frage hat: Fach, Tags (frei konfigurierbar pro Fachschaft), Bloom-Stufe (K1-K6), Thema/Unterthema, Punkte, geschätzter Zeitbedarf, Musterlösung und optionales Bewertungsraster. Diese Metadaten werden im Analyse-Tab für die Prüfungsanalyse verwendet.
      </Text>

      <Untertitel>Zeitbedarf</Untertitel>
      <Text>
        Der Zeitbedarf wird automatisch geschätzt basierend auf Fragetyp und Taxonomiestufe (z.B. MC K1 = 1 Min., Freitext lang K4 = 12 Min.). Sie können den Wert jederzeit manuell anpassen.
      </Text>

      <Untertitel>Fragetypen-Menü</Untertitel>
      <Text>
        Die 20 Fragetypen sind in 6 Kategorien organisiert: <strong>Text &amp; Sprache</strong>, <strong>Auswahl &amp; Zuordnung</strong>, <strong>Bilder &amp; Medien</strong>, <strong>MINT</strong>, <strong>Buchhaltung</strong> und <strong>Struktur</strong>. FiBu-Typen erscheinen nur bei WR-Fachschaft. Ein Suchfeld ermöglicht schnelles Filtern.
      </Text>

      <Untertitel>Bild-Upload</Untertitel>
      <Text>
        Für Hotspot, Bildbeschriftung und Drag &amp; Drop (Bild) können Bilder per <strong>Drag &amp; Drop</strong> oder Klick hochgeladen werden (max. 5 MB). Alternativ kann eine URL eingefügt werden. Im Demo-Modus werden Bilder als Data-URL gespeichert.
      </Text>

      <Untertitel>Bewertungsraster mit Niveaustufen</Untertitel>
      <Text>
        Jede Frage kann ein Bewertungsraster mit Kriterien und optionalen <strong>Niveaustufen</strong> haben. Niveaustufen beschreiben, was für die jeweilige Punktzahl erwartet wird (z.B. 2P: &laquo;Schlüssige Argumentation mit Belegen&raquo;, 1P: &laquo;Nachvollziehbar, aber lückenhaft&raquo;, 0P: &laquo;Keine Argumentation&raquo;).
      </Text>
      <Text>
        <strong>12 Standard-Vorlagen</strong> stehen zur Verfügung, gefiltert nach Fach: 5 fachübergreifende (Freitext Kurz/Lang, Analyse, Berechnung, Grafik), 4 WR-spezifische (Rechtsfallanalyse, VWL-Modellanalyse, BWL Entscheidung, FiBu) und 3 für andere Fachschaften (Textproduktion, Quellenanalyse, Experiment). Vorlagen werden automatisch auf die Fragepunkte skaliert. Eigene Vorlagen können gespeichert werden.
      </Text>
      <Text>
        Per <strong>KI generieren</strong> wird ein massgeschneidertes Raster inkl. Niveaustufen erstellt. Per <strong>KI verbessern</strong> wird ein bestehendes Raster auf Trennschärfe geprüft. Die KI-Korrektur bewertet bei vorhandenen Niveaustufen jedes Kriterium einzeln.
      </Text>

      <Untertitel>Erklärungen (R/F &amp; MC)</Untertitel>
      <Text>
        Bei Richtig/Falsch und Multiple-Choice können Sie pro Option eine <strong>Erklärung</strong> hinterlegen. Mit dem Toggle &laquo;Erklärungen den SuS in der Korrektur-Einsicht zeigen&raquo; steuern Sie, ob die Erklärungen nur für die LP (Korrekturhilfe) oder auch für SuS sichtbar sind.
      </Text>

      <Untertitel>Rechtschreibprüfung</Untertitel>
      <Text>
        Die Browser-Autokorrektur kann pro Prüfung deaktiviert werden — z.B. für Diktate oder Sprachprüfungen. Einstellung unter: Prüfung bearbeiten → Konfiguration → Rechtschreibprüfung. Im Freitext-Editor erscheint ein Hinweis-Link dazu.
      </Text>

      <Untertitel>iPad Diktierfunktion</Untertitel>
      <Text>
        Die iOS-Diktierfunktion (Mikrofon-Symbol auf der Tastatur) kann <strong>nicht</strong> per Webseite deaktiviert werden — es ist ein Systemfeature. Mögliche Massnahmen: (1) <strong>SEB</strong> (Safe Exam Browser) kann die Diktierfunktion unterbinden. (2) Über <strong>MDM-Profile</strong> (z.B. Jamf, Zuludesk) kann Dictation auf verwalteten iPads systemweit deaktiviert werden (Einschränkungsprofil → Siri → Diktierfunktion deaktivieren). Sprechen Sie bei Bedarf die Schulinformatik an.
      </Text>
    </div>
  )
}
