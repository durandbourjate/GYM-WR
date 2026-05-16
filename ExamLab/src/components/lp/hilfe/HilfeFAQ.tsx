import { useState, type ReactNode } from 'react'
import { Flag, Check, AlertTriangle } from 'lucide-react'
import { Titel } from './layoutHelpers'

export default function HilfeFAQ() {
  return (
    <div>
      <Titel>Häufige Fragen</Titel>

      <FAQItem frage="Was sind die drei Bereiche (Prüfen, Üben, Fragensammlung)?">
        <strong>Prüfen</strong> ist für summative (benotete) Prüfungen. <strong>Üben</strong> ist für formative (unbenotete) Übungen und den Selbststudium-Bereich der SuS. <strong>Fragensammlung</strong> ist die zentrale Sammlung aller Fragen — Fragen können sowohl in Prüfungen als auch in Übungen verwendet werden.
      </FAQItem>

      <FAQItem frage="Was passiert wenn ein SuS die Verbindung verliert?">
        Die Antworten werden lokal im Browser gespeichert. Sobald die Verbindung wiederhergestellt ist, werden sie automatisch an den Server gesendet. Es gehen keine Daten verloren.
      </FAQItem>

      <FAQItem frage="Habe ich versehentlich eine Frage gelöscht — kann ich sie wiederherstellen?">
        Ja. Gelöschte Fragen landen im <strong>Papierkorb</strong> (5. Tab im Header) und können dort wiederhergestellt oder endgültig gelöscht werden. Direkt nach dem Löschen erscheint zudem kurz ein Toast mit Wiederherstellen-Knopf.
      </FAQItem>

      <FAQItem frage="Muss ich beim Frageneditor manuell speichern?">
        Nein. Der Fragen-Editor speichert automatisch (Status oben rechts: &laquo;Gespeichert&raquo; / &laquo;Speichert...&raquo;). Neue Fragen werden zunächst als <strong>Entwurf</strong> angelegt und erst zur regulären Frage, wenn alle Pflichtfelder (violett umrahmt) ausgefüllt sind.
      </FAQItem>

      <FAQItem frage="Können SuS zwischen Fragen hin- und herspringen?">
        Ja, wenn &laquo;Rücknavigation erlaubt&raquo; in den Prüfungseinstellungen aktiviert ist. Bei linearen Prüfungen können SuS nur vorwärts navigieren.
      </FAQItem>

      <FAQItem frage="Brauche ich den Safe Exam Browser (SEB)?">
        SEB ist optional. Wenn aktiviert, werden SuS ohne SEB gewarnt und können die Prüfung nicht starten. SEB verhindert den Zugriff auf andere Apps und Websites während der Prüfung. Alternativ bietet der Soft-Lockdown (4 Stufen) SEB-unabhängige Sicherheit direkt im Browser.
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
        Lernziele stammen aus den Übungspools (316 importierte Lernziele). Sie werden pro Fach, Thema und Unterthema gruppiert. SuS sehen sie über den <Flag className="inline w-3.5 h-3.5 align-text-bottom text-slate-500" aria-label="Lernziele" />-Button im Header oder auf den Themen-Karten. Die Lernziele helfen bei der Orientierung und zeigen den Mastery-Fortschritt. Im Fragen-Editor (Metadaten-Rubrik) können Fragen einzelnen Lernzielen zugeordnet werden.
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
        Pool-Badges zeigen den Sync-Status von importierten Übungspool-Fragen: Rot = ungeprüft (aus Pool importiert, noch nicht reviewt), Gelb = Pool <Check className="inline w-3.5 h-3.5 align-text-bottom text-yellow-600" aria-label="reviewt" /> (reviewt), Grün = prüfungstauglich (von LP abgesegnet für Prüfungen), Blau pulsierend = Update verfügbar.
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
        12 Standard-Vorlagen (nach Fach gefiltert) stehen als Ausgangspunkt bereit — z.B. Rechtsfallanalyse, VWL-Modellanalyse oder Textproduktion. Jedes Kriterium kann optionale Niveaustufen haben, die beschreiben was für welche Punktzahl erwartet wird. Vorlagen werden automatisch auf die Fragepunkte skaliert. Per KI können Raster generiert oder auf Trennschärfe geprüft werden. Eigene Vorlagen lassen sich speichern.
      </FAQItem>

      <FAQItem frage="Wie kann ich ein Problem oder einen Wunsch melden?">
        Über das <AlertTriangle className="inline w-3.5 h-3.5 align-text-bottom text-yellow-500" aria-label="Warnung" />-Icon im Header oder den &laquo;Problem melden&raquo;-Link unter jeder Frage (in der Korrektur-Ansicht). Wählen Sie den Typ (Problem/Wunsch), eine Kategorie und optional einen Kommentar. Das Feedback wird direkt im Google Sheet erfasst.
      </FAQItem>

      <FAQItem frage="Können SuS Feedback geben?">
        Ja, aber erst nach Freigabe der Korrektur-Einsicht. SuS sehen dann ein <AlertTriangle className="inline w-3.5 h-3.5 align-text-bottom text-yellow-500" aria-label="Warnung" />-Icon im Header und können pro Frage Feedback geben — z.B. wenn eine Bewertung unklar ist oder ein technisches Problem aufgetreten ist.
      </FAQItem>
    </div>
  )
}

function FAQItem({ frage, children }: { frage: string; children: ReactNode }) {
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
