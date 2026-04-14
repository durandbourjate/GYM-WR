import { useState, useRef, useEffect } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'

interface Props {
  onSchliessen: () => void
}

type HilfeKategorie = 'einstieg' | 'ueben' | 'pruefung' | 'fragen' | 'zusammenarbeit' | 'ki' | 'durchfuehrung' | 'korrektur' | 'bloom' | 'faq'

const KATEGORIEN: { key: HilfeKategorie; label: string }[] = [
  { key: 'einstieg', label: 'Erste Schritte' },
  { key: 'ueben', label: 'Üben' },
  { key: 'pruefung', label: 'Prüfung erstellen' },
  { key: 'fragen', label: 'Fragen & Fragensammlung' },
  { key: 'zusammenarbeit', label: 'Zusammenarbeit' },
  { key: 'ki', label: 'KI-Assistent' },
  { key: 'durchfuehrung', label: 'Durchführung' },
  { key: 'korrektur', label: 'Korrektur & Feedback' },
  { key: 'bloom', label: 'Bloom-Taxonomie' },
  { key: 'faq', label: 'FAQ' },
]

/** Hilfe-/Anleitungsseite für Lehrpersonen */
export default function HilfeSeite({ onSchliessen }: Props) {
  const [kategorie, setKategorie] = useState<HilfeKategorie>('einstieg')
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen, damit Overlay unterhalb des Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  return (
    <ResizableSidebar
      mode="overlay"
      onClose={onSchliessen}
      topOffset={headerH}
      defaultWidth={1152}
      minWidth={400}
      maxWidth={2400}
      storageKey="hilfe-breite"
    >
      <div ref={panelRef} className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Hilfe & Anleitung
          </h2>
          <button
            onClick={onSchliessen}
            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Schliessen
          </button>
        </div>

        {/* Navigation */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex gap-1 overflow-x-auto shrink-0">
          {KATEGORIEN.map((k) => (
            <button
              key={k.key}
              onClick={() => setKategorie(k.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer
                ${kategorie === k.key
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {kategorie === 'einstieg' && <HilfeEinstieg />}
          {kategorie === 'ueben' && <HilfeUeben />}
          {kategorie === 'pruefung' && <HilfePruefung />}
          {kategorie === 'fragen' && <HilfeFragen />}
          {kategorie === 'zusammenarbeit' && <HilfeZusammenarbeit />}
          {kategorie === 'ki' && <HilfeKI />}
          {kategorie === 'durchfuehrung' && <HilfeDurchfuehrung />}
          {kategorie === 'korrektur' && <HilfeKorrektur />}
          {kategorie === 'bloom' && <HilfeBloom />}
          {kategorie === 'faq' && <HilfeFAQ />}
        </div>
      </div>
    </ResizableSidebar>
  )
}

// === Hilfe-Inhalte ===

function Titel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">{children}</h3>
}

function Untertitel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-5 mb-2">{children}</h4>
}

function Text({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">{children}</p>
}

function Schritt({ nr, children }: { nr: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs font-bold flex items-center justify-center">
        {nr}
      </span>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">{children}</div>
    </div>
  )
}

function Hinweis({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-4">
      {children}
    </div>
  )
}

function HilfeEinstieg() {
  return (
    <div>
      <Titel>Willkommen bei ExamLab</Titel>
      <Text>
        ExamLab ermöglicht digitale Prüfungen direkt im Browser — für alle Fachschaften am Gymnasium Hofwil. Sie erstellen Prüfungen im Composer, die Schülerinnen und Schüler bearbeiten sie online, und die Korrektur kann KI-unterstützt erfolgen.
      </Text>

      <Untertitel>Anmeldung</Untertitel>
      <Text>
        Melden Sie sich mit Ihrem <strong>@gymhofwil.ch</strong>-Konto über Google OAuth an. Die Rolle (Lehrperson oder SuS) wird automatisch anhand der E-Mail-Adresse zugewiesen. Lehrpersonen erhalten Zugriff auf Composer, Fragensammlung, Monitoring und Korrektur.
      </Text>
      <Text>
        SuS melden sich mit dem gleichen Login an und sehen direkt die ihnen zugewiesene Prüfung (über den Link mit Prüfungs-ID).
      </Text>

      <Untertitel>Überblick: Ihr Workflow</Untertitel>
      <Schritt nr={1}>
        <strong>Fragen erstellen</strong> — In der Fragensammlung Fragen mit 20 verschiedenen Typen anlegen (MC, Freitext, Lückentext, Zuordnung, Richtig/Falsch, Berechnung, Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER, Aufgabengruppe, Zeichnen, PDF-Annotation, Sortierung, Hotspot, Bildbeschriftung, Audio-Aufnahme, Drag & Drop (Bild), Code-Editor, Formel (LaTeX)).
      </Schritt>
      <Schritt nr={2}>
        <strong>Prüfung zusammenstellen</strong> — Im Composer eine neue Prüfung erstellen: Einstellungen festlegen, Abschnitte bilden, Fragen aus der Fragensammlung zuordnen.
      </Schritt>
      <Schritt nr={3}>
        <strong>Prüfung analysieren</strong> — Im Analyse-Tab die Prüfung auf Taxonomie-Verteilung, Zeitbedarf und Fragetypen-Mix prüfen.
      </Schritt>
      <Schritt nr={4}>
        <strong>Prüfung durchführen</strong> — Klicken Sie auf &laquo;Durchführen&raquo; auf der Startseite. Der 4-Phasen-Workflow führt Sie durch: Teilnehmer auswählen (Vorbereitung) → Bereitschaft prüfen (Lobby) → Live-Monitoring → Ergebnisse.
      </Schritt>
      <Schritt nr={5}>
        <strong>Korrigieren</strong> — Im Korrektur-Dashboard die Antworten KI-gestützt bewerten lassen und Feedback versenden. Individuelle SuS-PDFs drucken.
      </Schritt>
      <Schritt nr={6}>
        <strong>Nachverfolgen</strong> — Im Tracker-Tab sehen Sie: Wer hat gefehlt? Wie viele Noten gibt es pro Kurs? Fragen-Statistiken zeigen Lösungsquoten über alle Durchführungen.
      </Schritt>

      <Untertitel>Favoriten & Direktlinks</Untertitel>
      <Text>
        Markieren Sie häufig verwendete Prüfungen oder Übungen mit dem <strong>☆-Button</strong> auf jeder Karte. Favoriten erscheinen oben in der jeweiligen Liste und sind über das <strong>⭐-Dropdown</strong> in der Kopfzeile jederzeit erreichbar.
      </Text>
      <Text>
        Favoriten sind <strong>Account-verknüpft</strong> — sie werden automatisch mit Ihrem LP-Profil im Backend gespeichert und stehen auf allen Geräten zur Verfügung. Im Dropdown können Sie über das 🔗-Icon einen <strong>Direktlink</strong> kopieren, der direkt zur Prüfung oder Übung führt. Diese Links können Sie z.B. in Ihrem Browser als Lesezeichen speichern oder an Kolleginnen und Kollegen weitergeben.
      </Text>

      <Untertitel>Demo-Modus</Untertitel>
      <Text>
        Ohne Backend-Konfiguration läuft die App im Demo-Modus mit Beispieldaten. Sie können alle Funktionen ausprobieren — Änderungen werden aber nicht gespeichert. Klicken Sie auf dem Login-Screen auf &laquo;Als Lehrperson&raquo; oder &laquo;Als Schüler/in&raquo; unter &laquo;Demo ohne Login starten&raquo;.
      </Text>
    </div>
  )
}

function HilfeUeben() {
  return (
    <div>
      <Titel>Üben — Formative Übungen</Titel>
      <Text>
        Der Bereich <strong>Üben</strong> ermöglicht formative Übungen ohne Notendruck. Übungen verwenden die gleichen Fragetypen und den gleichen Workflow wie Prüfungen — aber ohne Punkte, Noten und strenge Sicherheitsmassnahmen.
      </Text>

      <Untertitel>Unterschiede zu Prüfungen</Untertitel>
      <Text>
        Übungen sind immer <strong>formativ</strong> (unbenotet). Folgende Elemente sind automatisch angepasst:
      </Text>
      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1 mb-4 ml-4">
        <li>• Keine Punkte und keine Noten</li>
        <li>• Kontrollstufe standardmässig auf &laquo;Locker&raquo; (nur Logging, keine Sperre)</li>
        <li>• Open-End-Modus (kein Countdown)</li>
        <li>• &laquo;Auswertung&raquo; statt &laquo;Korrektur&raquo; — ohne Notenberechnung</li>
      </ul>

      <Untertitel>Übung erstellen</Untertitel>
      <Schritt nr={1}>
        Wechseln Sie zum Tab <strong>Üben</strong> in der Kopfzeile.
      </Schritt>
      <Schritt nr={2}>
        Klicken Sie auf <strong>+ Neue Übung</strong>.
      </Schritt>
      <Schritt nr={3}>
        Der Composer öffnet sich mit formativ-Defaults. Titel eingeben, Fragen aus der Fragensammlung hinzufügen, Abschnitte bilden.
      </Schritt>
      <Schritt nr={4}>
        Übung durchführen: gleicher 4-Phasen-Workflow (Vorbereitung → Lobby → Live → Auswertung).
      </Schritt>

      <Untertitel>SuS-Übungsbereich (Selbststudium)</Untertitel>
      <Text>
        Im Sub-Tab <strong>Übungen</strong> innerhalb von Üben verwalten Sie den Selbststudium-Bereich. Hier sind SuS in <strong>Gruppen</strong> organisiert (z.B. nach Kurs oder Familie). Jede Gruppe hat eine eigene Fragenbank und Fortschrittsdaten.
      </Text>
      <Text>
        Das Mastery-System basiert auf <strong>Sessions</strong> (nicht auf Tagen). Fragen durchlaufen 4 Stufen: <strong>neu → üben → gefestigt → gemeistert</strong>. Persistente Schwächen werden als &laquo;Dauerbaustellen&raquo; regelmässig erneut eingestreut, blockieren aber den Fortschritt nicht.
      </Text>

      <Untertitel>Einführungsübung</Untertitel>
      <Text>
        Die <strong>Einführungsübung</strong> wird automatisch bereitgestellt und enthält Beispielaufgaben zu allen wichtigen Fragetypen. Sie erklärt auch das Mastery-System. Ideal für den Einstieg mit einer neuen Klasse.
      </Text>
    </div>
  )
}

function HilfePruefung() {
  return (
    <div>
      <Titel>Prüfung erstellen</Titel>
      <Text>
        Klicken Sie auf &laquo;+ Neue Prüfung&raquo; um den Prüfungs-Composer zu öffnen. Der Composer hat 4 Tabs:
      </Text>

      <Untertitel>1. Einstellungen</Untertitel>
      <Text>
        Titel, Klasse, Datum, Gefäss (SF/EF/EWR/GF/FF), Fach, Tags, Dauer und Prüfungstyp (summativ/formativ) festlegen. Optionen wie SEB-Pflicht, Rücknavigation, Zeitanzeige und Rechtschreibprüfung konfigurieren.
      </Text>
      <Text>
        Zeitzuschläge (Nachteilsausgleich) können pro SuS individuell vergeben werden — die zusätzlichen Minuten werden automatisch zur Prüfungsdauer addiert.
      </Text>

      <Untertitel>2. Abschnitte & Fragen</Untertitel>
      <Text>
        Erstellen Sie Abschnitte (z.B. &laquo;Teil A: Multiple Choice&raquo;) und fügen Sie Fragen aus der Fragensammlung hinzu. Abschnitte und Fragen können per Pfeiltasten umsortiert werden.
      </Text>

      <Untertitel>3. Vorschau</Untertitel>
      <Text>
        Zeigt eine Zusammenfassung der Prüfung wie sie die SuS sehen werden. Über &laquo;SuS-Ansicht öffnen&raquo; können Sie die vollständige Prüfungsansicht testen.
      </Text>

      <Untertitel>4. Analyse</Untertitel>
      <Text>
        Automatische Auswertung der Prüfung: Taxonomie-Verteilung (K1-K6), Fragetypen-Mix, geschätzter Zeitbedarf vs. Prüfungsdauer, Themen-Abdeckung und Punkteverteilung. Warnungen erscheinen bei Ungleichgewichten. Per Button kann zusätzlich eine KI-Analyse mit Verbesserungsvorschlägen gestartet werden.
      </Text>
    </div>
  )
}

function HilfeFragen() {
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
        <strong>Lückentext</strong> — Text mit Platzhaltern (z.B. {`{{1}}`}, {`{{2}}`}). Pro Lücke können mehrere akzeptierte Antworten definiert werden. Optional: Pro Lücke können Dropdown-Optionen definiert werden (Inline-Choice) — SuS wählen dann aus vorgegebenen Antworten statt frei zu tippen.
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
        <strong>12 Standard-Vorlagen</strong> stehen zur Verfügung, gefiltert nach Fachbereich: 5 fachübergreifende (Freitext Kurz/Lang, Analyse, Berechnung, Grafik), 4 WR-spezifische (Rechtsfallanalyse, VWL-Modellanalyse, BWL Entscheidung, FiBu) und 3 für andere Fachschaften (Textproduktion, Quellenanalyse, Experiment). Vorlagen werden automatisch auf die Fragepunkte skaliert. Eigene Vorlagen können gespeichert werden.
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

function HilfeZusammenarbeit() {
  return (
    <div>
      <Titel>Zusammenarbeit & Sharing</Titel>
      <Text>
        Fragen und Prüfungen können mit anderen Lehrpersonen geteilt werden. Das Rechte-System folgt dem Google-Docs-Modell mit drei Rollen.
      </Text>

      <Untertitel>Rollen</Untertitel>
      <ul className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed list-disc pl-5 space-y-1">
        <li><strong>Inhaber</strong> — Ersteller der Frage/Prüfung. Kann alles: bearbeiten, löschen, Berechtigungen vergeben.</li>
        <li><strong>Bearbeiter</strong> — Darf die Frage/Prüfung bearbeiten, aber nicht löschen oder Rechte vergeben.</li>
        <li><strong>Betrachter</strong> — Darf die Frage/Prüfung sehen und als Kopie übernehmen, aber nicht ändern.</li>
      </ul>

      <Untertitel>Sichtbarkeit</Untertitel>
      <Text>
        Im Berechtigungs-Editor können Sie die Sichtbarkeit schnell einstellen:
      </Text>
      <ul className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed list-disc pl-5 space-y-1">
        <li><strong>Privat</strong> — Nur für Sie sichtbar (Standard).</li>
        <li><strong>Fachschaft</strong> — Alle LP Ihrer Fachschaft sehen die Frage als Betrachter.</li>
        <li><strong>Schule</strong> — Alle LP am Gymnasium Hofwil sehen die Frage als Betrachter.</li>
      </ul>
      <Text>
        Zusätzlich können Sie einzelne LP als Bearbeiter oder Betrachter hinzufügen.
      </Text>

      <Untertitel>Fragen duplizieren</Untertitel>
      <Text>
        Geteilte Fragen können mit dem Kopier-Button als eigene Kopie übernommen werden. Die Kopie gehört Ihnen und ist zunächst privat. Änderungen an der Kopie beeinflussen das Original nicht.
      </Text>

      <Untertitel>Prüfungen teilen</Untertitel>
      <Text>
        In der Vorbereitungsphase einer Prüfung finden Sie den Abschnitt &laquo;Prüfung teilen&raquo;. Dort können Sie die Prüfung für Kolleginnen und Kollegen freigeben oder die Sichtbarkeit auf Fachschaft/Schule erweitern.
      </Text>

      <Untertitel>Rechte-Badges</Untertitel>
      <Text>
        In der Fragensammlung zeigen farbige Badges Ihre Rolle bei geteilten Fragen an: <strong>Bearbeiter</strong> (blau) oder <strong>Betrachter</strong> (grau). Eigene Fragen (Inhaber) haben keinen Badge.
      </Text>
    </div>
  )
}

function HilfeKI() {
  return (
    <div>
      <Titel>KI-Assistent</Titel>
      <Text>
        Der KI-Assistent unterstützt Sie beim Erstellen und Prüfen von Fragen. Alle KI-Buttons folgen dem gleichen Muster:
      </Text>

      <Hinweis>
        KI-Vorschläge werden immer als Vorschau angezeigt — Sie entscheiden mit &laquo;Übernehmen&raquo; oder &laquo;Verwerfen&raquo; ob der Vorschlag in die Frage übernommen wird.
      </Hinweis>

      <Untertitel>Generieren</Untertitel>
      <Text>
        Erstellt neue Inhalte basierend auf den vorhandenen Metadaten (Thema, Fachbereich, Taxonomiestufe). Verfügbar für: Fragetext, Musterlösung, MC-Optionen, Zuordnungspaare, R/F-Aussagen, Lücken und Berechnungsergebnisse.
      </Text>

      <Untertitel>Prüfen & Verbessern</Untertitel>
      <Text>
        Prüft bestehende Inhalte und schlägt Verbesserungen vor. Beispiele: Ist der Fragetext klar und eindeutig? Ist die Musterlösung korrekt und vollständig? Sind die R/F-Aussagen ausgewogen? Fehlen Antwort-Varianten bei Lückentexten?
      </Text>

      <Untertitel>Verfügbare KI-Aktionen pro Bereich</Untertitel>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th className="py-2 pr-4">Bereich</th>
              <th className="py-2 pr-4">Generieren</th>
              <th className="py-2">Prüfen & Verbessern</th>
            </tr>
          </thead>
          <tbody className="text-slate-700 dark:text-slate-200">
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">Fragetext</td>
              <td className="py-2 pr-4">Neuen Fragetext erstellen</td>
              <td className="py-2">Klarheit, Eindeutigkeit prüfen</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">Musterlösung</td>
              <td className="py-2 pr-4">Lösung aus Fragetext ableiten</td>
              <td className="py-2">Korrektheit und Vollständigkeit</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">MC-Optionen</td>
              <td className="py-2 pr-4">Antwortoptionen erstellen</td>
              <td className="py-2">—</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">Zuordnung</td>
              <td className="py-2 pr-4">Passende Paare generieren</td>
              <td className="py-2">Konsistenz, Eindeutigkeit</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">Richtig/Falsch</td>
              <td className="py-2 pr-4">Aussagen erstellen</td>
              <td className="py-2">Balance, fachliche Korrektheit</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">Lückentext</td>
              <td className="py-2 pr-4">Lückenstellen markieren</td>
              <td className="py-2">Fehlende Antwort-Varianten</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">Berechnung</td>
              <td className="py-2 pr-4">Ergebnisse berechnen</td>
              <td className="py-2">Toleranzbereiche prüfen</td>
            </tr>
            <tr className="border-b border-slate-100 dark:border-slate-700/50">
              <td className="py-2 pr-4 font-medium">FiBu (4 Typen)</td>
              <td className="py-2 pr-4">Kontenauswahl, Buchungssätze, T-Konten, Kontenbestimmung, Bilanzstruktur, Fallbeispiele</td>
              <td className="py-2">Buchungssätze prüfen</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-medium">Prüfungs-Analyse</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2">Gesamtanalyse mit Verbesserungsvorschlägen</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Untertitel>KI-Analyse (im Analyse-Tab)</Untertitel>
      <Text>
        Analysiert die gesamte Prüfung und gibt Feedback zu Themenabdeckung, Schwierigkeitsbalance und konkrete Verbesserungsvorschläge.
      </Text>
    </div>
  )
}

function HilfeDurchfuehrung() {
  return (
    <div>
      <Titel>Prüfung durchführen</Titel>
      <Text>
        Klicken Sie auf &laquo;Durchführen&raquo; bei der gewünschten Prüfung auf der Startseite. Der 4-Phasen-Workflow führt Sie durch den gesamten Ablauf:
      </Text>

      <Untertitel>Phase 1: Vorbereitung</Untertitel>
      <Schritt nr={1}>Klassenlisten werden automatisch aus Google Sheets geladen.</Schritt>
      <Schritt nr={2}>Wählen Sie die Kurse aus (pro Gefäss, z.B. SF WR). SuS können in mehreren Kursen vorkommen — Duplikate werden automatisch erkannt. Einzelne SuS können über die Checkboxen innerhalb der Kursübersicht ab-/angewählt werden.</Schritt>
      <Schritt nr={3}>Zeitzuschläge (Nachteilsausgleich): Geben Sie die Zusatzminuten direkt neben dem SuS-Namen ein (Eingabefeld in der Teilnehmerliste).</Schritt>
      <Schritt nr={4}>Optional: Einladungs-E-Mails an die ausgewählten SuS versenden.</Schritt>
      <Schritt nr={5}>Wählen Sie die <strong>Kontrollstufe</strong> (Soft-Lockdown): Keine (keine Einschränkungen, für Übungen), Locker (Verstösse werden gezählt und im Monitoring angezeigt, aber keine Sperre), Standard (Copy/Paste-Block, Vollbild, 3 Verstösse = Sperre) oder Streng (Sofort-Pause). iPads werden automatisch auf maximal Standard heruntergestuft.</Schritt>
      <Schritt nr={6}>Klicken Sie &laquo;Weiter zur Lobby&raquo; — die Teilnehmer werden gespeichert.</Schritt>

      <Untertitel>Phase 2: Lobby</Untertitel>
      <Text>
        Hier sehen Sie, welche SuS bereit sind (eingeloggt und wartend). Ein Fortschrittsbalken zeigt bereit/ausstehend an. Unerwartete SuS (nicht auf der Teilnehmerliste) werden separat angezeigt. Gerät, Kontrollstufe und SEB-Status sind pro SuS sichtbar. Zeitzuschläge werden inline pro SuS als ⏱-Badge angezeigt und können über den Nachteilsausgleich-Bereich angepasst werden.
      </Text>

      <Untertitel>Phase 3: Live-Monitoring</Untertitel>
      <Text>
        Im Live-Dashboard sehen Sie pro SuS: Status, Verstösse, Kontrollstufe, Gerät (Laptop/iPad), aktuelle Frage und Fortschritt. Inaktivitäts-Warnstufen zeigen an, wenn SuS länger als 1/3/5 Minuten nichts tun.
      </Text>
      <Text>
        <strong>Soft-Lockdown:</strong> Die Verstoss-Spalte zeigt den Zähler (z.B. ⚠️ 2/3). Bei Hover sehen Sie Details (Zeitpunkt, Typ). Wird ein SuS gesperrt (max. Verstösse erreicht), erscheint ein 🔒-Symbol mit &laquo;Entsperren&raquo;-Button. Die Kontrollstufe zeigt an, ob ein automatisches Downgrade stattgefunden hat (z.B. bei iPads).
      </Text>
      <Text>
        Sie können die Prüfung jederzeit beenden — sofort oder mit Restzeit (z.B. noch 5 Minuten). Über den ✕-Button in der Schülerzeile können auch einzelne SuS individuell beendet werden (z.B. bei Spickverdacht). Bei SuS mit Nachteilsausgleich wird der verbleibende Zeitzuschlag als Countdown angezeigt.
      </Text>
      <Text>
        Antworten werden alle 30 Sekunden automatisch gespeichert. Bei Verbindungsabbruch werden sie lokal zwischengespeichert und bei Reconnect nachgesendet.
      </Text>

      <Untertitel>Multi-Prüfungs-Dashboard</Untertitel>
      <Text>
        Bei Nachprüfungsterminen (verschiedene Prüfungen gleichzeitig) können Sie alle in einem Tab überwachen. Klicken Sie auf den &laquo;Multi-Dashboard&raquo;-Button auf der Prüfungsliste (erscheint ab 2 Prüfungen), wählen Sie die gewünschten Prüfungen per Checkbox und öffnen Sie das Dashboard in einem neuen Tab.
      </Text>

      <Untertitel>Phase 4: Ergebnisse</Untertitel>
      <Text>
        Nach Prüfungsende sehen Sie eine Zusammenfassung: Teilnehmer, Abgaben, No-Shows. Von hier gelangen Sie direkt zur Korrektur.
      </Text>

      <Untertitel>Zeitmodus</Untertitel>
      <Text>
        <strong>Countdown:</strong> Klassischer Modus mit fixer Dauer (z.B. 45 Min.). SuS mit Nachteilsausgleich erhalten automatisch Zusatzzeit.
      </Text>
      <Text>
        <strong>Open-End:</strong> Kein Zeitlimit — die Stoppuhr zählt aufwärts. Sie beenden die Prüfung manuell, optional mit Restzeit.
      </Text>

      <Untertitel>URL-Schema</Untertitel>
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-sm space-y-2 mb-4">
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?id=abc</code> — Prüfung für SuS / Durchführen für LP</div>
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?ids=abc,def</code> — Multi-Dashboard: mehrere Prüfungen parallel überwachen</div>
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?id=abc&ansicht=korrektur</code> — Korrektur-Dashboard</div>
      </div>
    </div>
  )
}

function HilfeKorrektur() {
  return (
    <div>
      <Titel>Korrektur & Feedback</Titel>

      <Text>
        Nach der Prüfung können Sie über &laquo;Korrektur&raquo; auf der Startseite das Korrektur-Dashboard öffnen.
      </Text>

      <Untertitel>Autokorrektur</Untertitel>
      <Text>
        Mit &laquo;Autokorrektur starten&raquo; werden alle Antworten automatisch bewertet. Deterministische Fragetypen (MC, R/F, Lückentext, Zuordnung, Berechnung, FiBu) werden algorithmisch korrigiert. Für komplexe Fragetypen (Freitext, Zeichnen, PDF) können Sie pro Frage einen KI-Vorschlag via Claude API anfordern. Bei Fragen mit Bewertungsraster und Niveaustufen bewertet die KI jedes Kriterium einzeln — Sie sehen Punkte und Kurzkommentar pro Kriterium. Alle Werte können manuell überschrieben werden.
      </Text>

      <Untertitel>Review-Workflow</Untertitel>
      <Schritt nr={1}><strong>Autokorrektur</strong> — MC, R/F, Lückentext, Zuordnung, Berechnung und FiBu werden algorithmisch bewertet. Punkte erscheinen direkt. Diese Fragen werden automatisch als «Geprüft» markiert.</Schritt>
      <Schritt nr={2}><strong>KI-Vorschlag</strong> — Für Freitext, Zeichnen und PDF-Annotation können Sie pro Frage einen KI-Korrekturvorschlag (Claude API) anfordern.</Schritt>
      <Schritt nr={3}><strong>LP prüft</strong> — Punkte ändern, Kommentar schreiben oder Audio aufnehmen markiert die Frage automatisch als &laquo;Geprüft&raquo;. Wenn alle Fragen eines SuS geprüft sind, wechselt der Status auf &laquo;Review fertig&raquo;.</Schritt>
      <Schritt nr={4}><strong>Ergebnisse freigeben</strong> — Wenn alle SuS korrigiert sind, erscheint ein grünes Banner. Die Freigabe ist blockiert solange Bewertungen ohne Punkte existieren (Schutz vor versehentlich unvollständiger Korrektur). Export und Feedback zeigen eine Warnung bei fehlenden Punkten.</Schritt>

      <Untertitel>SuS-PDFs & Export</Untertitel>
      <Text>
        Pro SuS kann ein druckbares PDF erstellt werden (📄-Button pro SuS oder &laquo;Korrektur-PDFs&raquo; im Header). Die PDF-Ansicht enthält alle Fragen, Antworten, Punkte und Kommentare. Über den Browser-Druckdialog können Sie &laquo;Als PDF speichern&raquo; wählen.
      </Text>
      <Text>
        Der &laquo;Excel-Export (Detailliert)&raquo; erstellt eine CSV-Datei mit Antwort-Text und Punkten pro Frage/SuS — wie ein Google-Forms-Export.
      </Text>
      <Text>
        Der &laquo;Backup exportieren&raquo;-Button (blau) erstellt ein vollständiges Excel-Backup (.xlsx) mit einem Übersichts-Tab (Noten, Punkte pro Frage) und einem eigenen Tab pro SuS (Fragen, Antworten, Punkte, Kommentare). Verfügbar im &laquo;Ergebnisse&raquo;-Tab (nach Durchführung, ohne Bewertungen) und im &laquo;Korrektur&raquo;-Tab (mit Bewertungen). Ideal zur Archivierung.
      </Text>

      <Hinweis>
        Die KI-Punkte sind Vorschläge. Sie entscheiden — Ihre manuellen Punkte überschreiben die KI-Bewertung immer.
      </Hinweis>

      <Untertitel>Korrektur-Einsicht freigeben</Untertitel>
      <Text>
        Die Freigabe erfolgt zweistufig: <strong>Einsicht freigeben</strong> (SuS sehen ihre Korrektur online) und <strong>PDF freigeben</strong> (SuS können ihr Korrektur-PDF herunterladen). Beide können unabhängig voneinander aktiviert und jederzeit zurückgenommen werden.
      </Text>

      <Untertitel>Feedback-System</Untertitel>
      <Text>
        SuS und LP können direkt aus der Plattform Probleme oder Wünsche melden. Das Feedback wird in einem eigenen Tab im Google Sheet gesammelt.
      </Text>
      <Text>
        <strong>Für LP:</strong> Im Header finden Sie ein 💬-Icon neben dem Theme-Toggle. In der Korrektur-Ansicht erscheint zusätzlich ein &laquo;Problem melden&raquo;-Link unter jeder Frage — damit können Sie fachliche Fehler oder technische Probleme direkt im Kontext der Frage melden.
      </Text>
      <Text>
        <strong>Für SuS:</strong> In der Korrektur-Einsicht (nach Freigabe) finden SuS ein 💬-Icon im Header und einen &laquo;Problem melden&raquo;-Link unter jeder Frage — z.B. wenn eine Bewertung unklar ist.
      </Text>
    </div>
  )
}

function HilfeBloom() {
  return (
    <div>
      <Titel>Bloom-Taxonomie (K1–K6)</Titel>
      <Text>
        Die Bloom-Taxonomie ordnet Prüfungsfragen nach kognitivem Anforderungsniveau ein. Jede Frage in der Fragensammlung wird einer Stufe K1–K6 zugeordnet. Der Analyse-Tab zeigt die Verteilung über die gesamte Prüfung.
      </Text>

      <Hinweis>
        Für summative Prüfungen im SF W&R empfiehlt sich eine Mischung aus allen Stufen, mit Schwerpunkt auf K2–K4. Reine K1-Prüfungen prüfen nur Faktenwissen; K5/K6-Fragen eignen sich für anspruchsvolle Aufgaben und Fallstudien.
      </Hinweis>

      <div className="space-y-4">
        <BloomStufe
          stufe="K1"
          titel="Wissen (Erinnern)"
          beschreibung="Fakten, Begriffe und Definitionen aus dem Gedächtnis abrufen."
          verben="nennen, aufzählen, wiedergeben, definieren, beschreiben"
          beispiele={[
            'Nennen Sie drei Rechtsquellen des Schweizer Rechts.',
            'Definieren Sie den Begriff «Opportunitätskosten».',
            'Welche Rechtsform hat eine Einzelunternehmung?',
          ]}
        />
        <BloomStufe
          stufe="K2"
          titel="Verstehen"
          beschreibung="Sachverhalte in eigenen Worten erklären und Zusammenhänge erkennen."
          verben="erklären, erläutern, zusammenfassen, interpretieren, unterscheiden"
          beispiele={[
            'Erklären Sie den Unterschied zwischen Angebot und Nachfrage.',
            'Warum sinkt die Kaufkraft bei steigender Inflation?',
            'Erläutern Sie den Zweck der Handelsregisterpflicht.',
          ]}
        />
        <BloomStufe
          stufe="K3"
          titel="Anwenden"
          beschreibung="Gelerntes Wissen auf neue, konkrete Situationen übertragen."
          verben="anwenden, berechnen, durchführen, lösen, erstellen"
          beispiele={[
            'Berechnen Sie den Deckungsbeitrag für folgendes Produkt.',
            'Bestimmen Sie anhand des Sachverhalts, ob ein gültiger Vertrag vorliegt.',
            'Zeichnen Sie die Verschiebung der Angebotskurve bei einer Steuererhöhung.',
          ]}
        />
        <BloomStufe
          stufe="K4"
          titel="Analysieren"
          beschreibung="Sachverhalte in Bestandteile zerlegen, Ursachen und Zusammenhänge untersuchen."
          verben="analysieren, vergleichen, untersuchen, ableiten, gliedern"
          beispiele={[
            'Analysieren Sie die Bilanz der Firma X und identifizieren Sie Risiken.',
            'Vergleichen Sie die AG und die GmbH hinsichtlich Haftung und Kapitalbedarf.',
            'Untersuchen Sie, welche Faktoren zum Marktversagen führen können.',
          ]}
        />
        <BloomStufe
          stufe="K5"
          titel="Bewerten / Beurteilen"
          beschreibung="Sachverhalte kritisch beurteilen und begründete Entscheidungen treffen."
          verben="beurteilen, bewerten, begründen, Stellung nehmen, empfehlen"
          beispiele={[
            'Beurteilen Sie, ob der Mindestlohn die Arbeitslosigkeit senkt oder erhöht.',
            'Empfehlen Sie der Unternehmerin eine geeignete Rechtsform und begründen Sie.',
            'Nehmen Sie Stellung zur Aussage: «Freihandel nützt allen Beteiligten».',
          ]}
        />
        <BloomStufe
          stufe="K6"
          titel="Erschaffen / Entwickeln"
          beschreibung="Eigenständig neue Lösungen, Konzepte oder Strategien entwickeln."
          verben="entwickeln, entwerfen, konzipieren, planen, gestalten"
          beispiele={[
            'Entwickeln Sie eine Marketingstrategie für ein Startup im Bereich Nachhaltigkeit.',
            'Entwerfen Sie einen Vorschlag zur Reform der AHV-Finanzierung.',
            'Konzipieren Sie einen Businessplan für eine Geschäftsidee Ihrer Wahl.',
          ]}
        />
      </div>
    </div>
  )
}

function BloomStufe({ stufe, titel, beschreibung, verben, beispiele }: {
  stufe: string
  titel: string
  beschreibung: string
  verben: string
  beispiele: string[]
}) {
  const [offen, setOffen] = useState(false)
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOffen(!offen)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs font-bold flex items-center justify-center">
          {stufe}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{titel}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">— {beschreibung}</span>
        </div>
        <span className="text-slate-400 dark:text-slate-500 shrink-0">
          {offen ? '−' : '+'}
        </span>
      </button>
      {offen && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            <strong>Typische Verben:</strong> {verben}
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Beispiele (W&R):</p>
          <ul className="space-y-1">
            {beispiele.map((b, i) => (
              <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex gap-2">
                <span className="text-slate-400 dark:text-slate-500 shrink-0">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function HilfeFAQ() {
  return (
    <div>
      <Titel>Häufige Fragen</Titel>

      <FAQItem frage="Was sind die drei Bereiche (Prüfen, Üben, Fragensammlung)?">
        <strong>Prüfen</strong> ist für summative (benotete) Prüfungen. <strong>Üben</strong> ist für formative (unbenotete) Übungen und den Selbststudium-Bereich der SuS. <strong>Fragensammlung</strong> ist die zentrale Sammlung aller Fragen — Fragen können sowohl in Prüfungen als auch in Übungen verwendet werden.
      </FAQItem>

      <FAQItem frage="Was passiert wenn ein SuS die Verbindung verliert?">
        Die Antworten werden lokal im Browser gespeichert. Sobald die Verbindung wiederhergestellt ist, werden sie automatisch an den Server gesendet. Es gehen keine Daten verloren.
      </FAQItem>

      <FAQItem frage="Können SuS zwischen Fragen hin- und herspringen?">
        Ja, wenn &laquo;Rücknavigation erlaubt&raquo; in den Prüfungseinstellungen aktiviert ist. Bei linearen Prüfungen können SuS nur vorwärts navigieren.
      </FAQItem>

      <FAQItem frage="Brauche ich den Safe Exam Browser (SEB)?">
        SEB ist optional. Wenn aktiviert, werden SuS ohne SEB gewarnt und können die Prüfung nicht starten. SEB verhindert den Zugriff auf andere Apps und Websites während der Prüfung. Alternativ bietet der Soft-Lockdown (3 Stufen) SEB-unabhängige Sicherheit direkt im Browser.
      </FAQItem>

      <FAQItem frage="Was ist der Soft-Lockdown?">
        Der Soft-Lockdown bietet SEB-unabhängige Sicherheit in 4 Stufen: Keine (keine Einschränkungen — ideal für Übungen und Einrichtungstests), Locker (nur Logging), Standard (Copy/Paste-Block, Vollbild, 3 Verstösse = Sperre) und Streng (Sofort-Pause bei Vollbild-Verlust). iPads werden automatisch erkannt und maximal auf Standard heruntergestuft (da Vollbild dort nicht erzwingbar ist). Bei einer Sperre muss die LP den SuS manuell entsperren.
      </FAQItem>

      <FAQItem frage="Kann ich mehrere Prüfungen gleichzeitig überwachen?">
        Ja. Klicken Sie auf den &laquo;Multi-Dashboard&raquo;-Button auf der Prüfungsliste (ab 2 Prüfungen sichtbar), wählen Sie die Prüfungen per Checkbox und öffnen Sie das Dashboard in einem neuen Tab.
      </FAQItem>

      <FAQItem frage="Wie funktioniert die Unterthemen-Steuerung?">
        Im Üben-Bereich unter Übungen → Themen können Sie Themen aktivieren. Klappen Sie ein Thema auf, um einzelne Unterthemen per Checkbox zu aktivieren/deaktivieren. Wenn nur einige Unterthemen aktiv sind, zeigt das Badge &laquo;z.T. aktiv&raquo;. SuS sehen dann nur Fragen zu den aktivierten Unterthemen.
      </FAQItem>

      <FAQItem frage="Was sind Lernziele und woher kommen sie?">
        Lernziele stammen aus den Übungspools (316 importierte Lernziele). Sie werden pro Fach, Thema und Unterthema gruppiert. SuS sehen sie über den 🏁-Button im Header oder auf den Themen-Karten. Die Lernziele helfen bei der Orientierung und zeigen den Mastery-Fortschritt. Im Fragen-Editor (Metadaten-Rubrik) können Fragen einzelnen Lernzielen zugeordnet werden.
      </FAQItem>

      <FAQItem frage="Wie funktioniert der Demo-Modus?">
        Ohne Backend-Konfiguration startet die App automatisch im Demo-Modus mit Beispieldaten. Alle Funktionen sind nutzbar, aber Änderungen werden nicht gespeichert.
      </FAQItem>

      <FAQItem frage="Kann ich Fragen in mehreren Prüfungen verwenden?">
        Ja. Die Fragensammlung ist unabhängig von einzelnen Prüfungen. Eine Frage kann in beliebig vielen Prüfungen verwendet werden.
      </FAQItem>

      <FAQItem frage="Was bedeuten die Bloom-Stufen K1-K6?">
        K1 = Wissen (erinnern), K2 = Verstehen, K3 = Anwenden, K4 = Analysieren, K5 = Bewerten/Beurteilen, K6 = Erschaffen/Entwickeln. Höhere Stufen erfordern mehr kognitive Leistung.
      </FAQItem>

      <FAQItem frage="Wie genau ist die Zeitschätzung?">
        Die Zeitschätzung basiert auf Erfahrungswerten pro Fragetyp und Taxonomiestufe. Sie ist ein Richtwert — die tatsächliche Bearbeitungszeit hängt von der Aufgabenkomplexität und den SuS ab. Sie können den Zeitbedarf pro Frage manuell anpassen.
      </FAQItem>

      <FAQItem frage="Wer kann meine Prüfungen sehen?">
        Nur Lehrpersonen mit @gymhofwil.ch-Login haben Zugriff auf den Composer, die Fragensammlung und die Korrektur. SuS sehen nur die ihnen zugewiesene Prüfung.
      </FAQItem>

      <FAQItem frage="Was ist der Open-End-Modus?">
        Im Open-End-Modus gibt es kein fixes Zeitlimit. Die Stoppuhr zählt aufwärts. Sie beenden die Prüfung manuell — entweder sofort oder mit einer Restzeit (z.B. noch 5 Minuten). SuS mit Nachteilsausgleich erhalten auch bei Restzeit automatisch Zusatzminuten.
      </FAQItem>

      <FAQItem frage="Wie funktioniert die Kurs-basierte Auswahl?">
        Teilnehmer werden pro Kurs/Gefäss ausgewählt (z.B. SF WR 28bc29fs), nicht pro Stammklasse. Sie können ganze Kurse an-/abwählen oder einzelne SuS direkt per Checkbox auswählen. Die Kurs-Checkbox zeigt einen Teilauswahl-Status wenn nur einige SuS ausgewählt sind. Duplikate (SuS in mehreren Kursen) werden automatisch erkannt. Die Kurs-Auswahl ist einklappbar um Platz zu sparen.
      </FAQItem>

      <FAQItem frage="Kann ich Audio-Feedback geben?">
        Ja. Im Korrektur-Dashboard können Sie pro Frage und als Gesamtkommentar Audio-Feedback aufnehmen (direkt im Browser). Die Audio-Dateien werden zu Google Drive hochgeladen und sind für die SuS in der Korrektur-Einsicht abspielbar.
      </FAQItem>

      <FAQItem frage="Was sind die Pool-Badges in der Fragensammlung?">
        Pool-Badges zeigen den Sync-Status von importierten Übungspool-Fragen: Rot = ungeprüft (aus Pool importiert, noch nicht reviewt), Gelb = Pool ✓ (reviewt), Grün = prüfungstauglich (von LP abgesegnet für Prüfungen), Blau pulsierend = Update verfügbar.
      </FAQItem>

      <FAQItem frage="Kann ich mathematische Formeln in Fragetexten verwenden?">
        Ja. LaTeX-Formeln können direkt im Fragentext eingefügt werden: <code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">$x^2$</code> für Inline-Formeln und <code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">$$\sum_&#123;i=1&#125;^n$$</code> für Block-Formeln. Die Formeln werden automatisch mit KaTeX gerendert. Als eigenständiger Fragetyp ermöglicht der «Formel (LaTeX)»-Typ den SuS die Eingabe von Formeln mit Live-Vorschau.
      </FAQItem>

      <FAQItem frage="Kann ich Code-Snippets in Fragetexten einfügen?">
        Ja. Code-Blöcke mit Syntax-Highlighting können im Fragentext eingefügt werden (7 Sprachen: Python, JavaScript, SQL, HTML, CSS, Java, TypeScript). Als eigenständiger Fragetyp bietet der «Code-Editor» den SuS eine vollwertige Code-Eingabe mit Syntax-Highlighting und Zeilennummern.
      </FAQItem>

      <FAQItem frage="Welche Materialtypen unterstützt das Material-Panel?">
        Das Material-Panel (Split-Screen 55% oder Overlay) unterstützt: PDF, Video, Audio, Links und Rich-Text. Rich-Text-Materialien können direkt in der Plattform als formatierter Text gepflegt werden — ohne externe Dateien.
      </FAQItem>

      <FAQItem frage="Wie funktioniert die Aufgabengruppe?">
        Eine Aufgabengruppe bündelt mehrere Teilaufgaben (a, b, c, ...) unter einem gemeinsamen Kontext. Teilaufgaben werden direkt im Editor erstellt — jeder Fragetyp ist wählbar. Jede Teilaufgabe hat eigenen Fragetext, Punkte, Musterlösung und Bewertungsraster. In der Prüfung sehen SuS den Kontext einmal oben und die Teilaufgaben darunter.
      </FAQItem>

      <FAQItem frage="Kann ich Bilder für Hotspot/Bildbeschriftung/Drag & Drop hochladen?">
        Ja. In allen drei Bild-Fragetypen können Sie Bilder per Drag &amp; Drop oder Klick hochladen (max. 5 MB). Alternativ können Sie eine URL einfügen. Im Demo-Modus werden Bilder lokal gespeichert.
      </FAQItem>

      <FAQItem frage="Wie funktionieren die Bewertungsraster mit Niveaustufen?">
        12 Standard-Vorlagen (nach Fachbereich gefiltert) stehen als Ausgangspunkt bereit — z.B. Rechtsfallanalyse, VWL-Modellanalyse oder Textproduktion. Jedes Kriterium kann optionale Niveaustufen haben, die beschreiben was für welche Punktzahl erwartet wird. Vorlagen werden automatisch auf die Fragepunkte skaliert. Per KI können Raster generiert oder auf Trennschärfe geprüft werden. Eigene Vorlagen lassen sich speichern.
      </FAQItem>

      <FAQItem frage="Wie kann ich ein Problem oder einen Wunsch melden?">
        Über das 💬-Icon im Header oder den &laquo;Problem melden&raquo;-Link unter jeder Frage (in der Korrektur-Ansicht). Wählen Sie den Typ (Problem/Wunsch), eine Kategorie und optional einen Kommentar. Das Feedback wird direkt im Google Sheet erfasst.
      </FAQItem>

      <FAQItem frage="Können SuS Feedback geben?">
        Ja, aber erst nach Freigabe der Korrektur-Einsicht. SuS sehen dann ein 💬-Icon im Header und können pro Frage Feedback geben — z.B. wenn eine Bewertung unklar ist oder ein technisches Problem aufgetreten ist.
      </FAQItem>
    </div>
  )
}

function FAQItem({ frage, children }: { frage: string; children: React.ReactNode }) {
  const [offen, setOffen] = useState(false)
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setOffen(!offen)}
        className="w-full text-left py-3 flex items-center justify-between cursor-pointer group"
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100">
          {frage}
        </span>
        <span className="text-slate-400 dark:text-slate-500 shrink-0 ml-4">
          {offen ? '−' : '+'}
        </span>
      </button>
      {offen && (
        <div className="pb-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}
