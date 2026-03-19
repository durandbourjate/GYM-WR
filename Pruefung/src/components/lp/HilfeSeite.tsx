import { useState, useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'

interface Props {
  onSchliessen: () => void
}

type HilfeKategorie = 'einstieg' | 'pruefung' | 'fragen' | 'ki' | 'durchfuehrung' | 'korrektur' | 'bloom' | 'faq'

const KATEGORIEN: { key: HilfeKategorie; label: string }[] = [
  { key: 'einstieg', label: 'Erste Schritte' },
  { key: 'pruefung', label: 'Prüfung erstellen' },
  { key: 'fragen', label: 'Fragen & Fragenbank' },
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

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onSchliessen} />

      <div ref={panelRef} className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
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
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex gap-1 overflow-x-auto">
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
          {kategorie === 'pruefung' && <HilfePruefung />}
          {kategorie === 'fragen' && <HilfeFragen />}
          {kategorie === 'ki' && <HilfeKI />}
          {kategorie === 'durchfuehrung' && <HilfeDurchfuehrung />}
          {kategorie === 'korrektur' && <HilfeKorrektur />}
          {kategorie === 'bloom' && <HilfeBloom />}
          {kategorie === 'faq' && <HilfeFAQ />}
        </div>
      </div>
    </div>
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
      <Titel>Willkommen zur Prüfungsplattform</Titel>
      <Text>
        Die Prüfungsplattform ermöglicht digitale Prüfungen direkt im Browser. Sie erstellen Prüfungen im Composer, die Schülerinnen und Schüler bearbeiten sie online, und die Korrektur kann KI-unterstützt erfolgen.
      </Text>

      <Untertitel>Anmeldung</Untertitel>
      <Text>
        Melden Sie sich mit Ihrem <strong>@gymhofwil.ch</strong>-Konto über Google OAuth an. Die Rolle (Lehrperson oder SuS) wird automatisch anhand der E-Mail-Adresse zugewiesen. Lehrpersonen erhalten Zugriff auf Composer, Fragenbank, Monitoring und Korrektur.
      </Text>
      <Text>
        SuS melden sich mit dem gleichen Login an und sehen direkt die ihnen zugewiesene Prüfung (über den Link mit Prüfungs-ID).
      </Text>

      <Untertitel>Überblick: Ihr Workflow</Untertitel>
      <Schritt nr={1}>
        <strong>Fragen erstellen</strong> — In der Fragenbank Fragen mit 6 verschiedenen Typen anlegen (MC, Freitext, Lückentext, Zuordnung, Richtig/Falsch, Berechnung).
      </Schritt>
      <Schritt nr={2}>
        <strong>Prüfung zusammenstellen</strong> — Im Composer eine neue Prüfung erstellen: Einstellungen festlegen, Abschnitte bilden, Fragen aus der Fragenbank zuordnen.
      </Schritt>
      <Schritt nr={3}>
        <strong>Prüfung analysieren</strong> — Im Analyse-Tab die Prüfung auf Taxonomie-Verteilung, Zeitbedarf und Fragetypen-Mix prüfen.
      </Schritt>
      <Schritt nr={4}>
        <strong>Prüfung durchführen</strong> — URL an SuS verteilen. Im Monitoring-Dashboard den Fortschritt live verfolgen.
      </Schritt>
      <Schritt nr={5}>
        <strong>Korrigieren</strong> — Im Korrektur-Dashboard die Antworten KI-gestützt bewerten lassen und Feedback versenden.
      </Schritt>

      <Untertitel>Demo-Modus</Untertitel>
      <Text>
        Ohne Backend-Konfiguration läuft die App im Demo-Modus mit Beispieldaten. Sie können alle Funktionen ausprobieren — Änderungen werden aber nicht gespeichert. Klicken Sie auf dem Login-Screen auf &laquo;Demo ausprobieren&raquo; um direkt loszulegen.
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
        Titel, Klasse, Datum, Gefäss (SF/EF/EWR), Fachbereiche, Dauer und Prüfungstyp (summativ/formativ) festlegen. Optionen wie SEB-Pflicht, Rücknavigation und Zeitanzeige konfigurieren.
      </Text>
      <Text>
        Zeitzuschläge (Nachteilsausgleich) können pro SuS individuell vergeben werden — die zusätzlichen Minuten werden automatisch zur Prüfungsdauer addiert.
      </Text>

      <Untertitel>2. Abschnitte & Fragen</Untertitel>
      <Text>
        Erstellen Sie Abschnitte (z.B. &laquo;Teil A: Multiple Choice&raquo;) und fügen Sie Fragen aus der Fragenbank hinzu. Abschnitte und Fragen können per Pfeiltasten umsortiert werden.
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
      <Titel>Fragen & Fragenbank</Titel>
      <Text>
        Die Fragenbank ist der zentrale Ort für alle Prüfungsfragen. Fragen können in mehreren Prüfungen wiederverwendet werden.
      </Text>

      <Untertitel>6 Fragetypen</Untertitel>
      <Text>
        <strong>Multiple Choice</strong> — Einfach- oder Mehrfachauswahl. Optionen werden bei der Prüfung automatisch gemischt.
      </Text>
      <Text>
        <strong>Freitext</strong> — Kurz, mittel oder lang. SuS können mit Fettschrift und Überschriften formatieren.
      </Text>
      <Text>
        <strong>Lückentext</strong> — Text mit Platzhaltern (z.B. {`{{1}}`}, {`{{2}}`}). Pro Lücke können mehrere akzeptierte Antworten definiert werden.
      </Text>
      <Text>
        <strong>Zuordnung</strong> — Paare von Begriffen und Definitionen. SuS ordnen per Drag & Drop zu.
      </Text>
      <Text>
        <strong>Richtig/Falsch</strong> — Mehrere Aussagen, die einzeln als richtig oder falsch bewertet werden.
      </Text>
      <Text>
        <strong>Berechnung</strong> — Numerische Ergebnisse mit definierbarer Toleranz und Einheit. Rechenweg kann optional verlangt werden.
      </Text>

      <Untertitel>Metadaten pro Frage</Untertitel>
      <Text>
        Jede Frage hat: Fachbereich (VWL/BWL/Recht), Bloom-Stufe (K1-K6), Thema/Unterthema, Punkte, geschätzter Zeitbedarf, Musterlösung und optionales Bewertungsraster. Diese Metadaten werden im Analyse-Tab für die Prüfungsanalyse verwendet.
      </Text>

      <Untertitel>Zeitbedarf</Untertitel>
      <Text>
        Der Zeitbedarf wird automatisch geschätzt basierend auf Fragetyp und Taxonomiestufe (z.B. MC K1 = 1 Min., Freitext lang K4 = 12 Min.). Sie können den Wert jederzeit manuell anpassen.
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
            <tr>
              <td className="py-2 pr-4 font-medium">Berechnung</td>
              <td className="py-2 pr-4">Ergebnisse berechnen</td>
              <td className="py-2">Toleranzbereiche prüfen</td>
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

      <Untertitel>Vorbereitung</Untertitel>
      <Schritt nr={1}>Prüfung im Composer fertigstellen und speichern.</Schritt>
      <Schritt nr={2}>URL an SuS verteilen (über den &laquo;URL&raquo;-Button auf der Startseite kopieren).</Schritt>
      <Schritt nr={3}>Falls SEB aktiviert: SuS müssen den Safe Exam Browser starten.</Schritt>

      <Untertitel>Während der Prüfung</Untertitel>
      <Text>
        Über &laquo;Monitoring&raquo; auf der Startseite öffnen Sie das Live-Dashboard. Dort sehen Sie pro SuS: Fortschritt, letzte Aktivität, Netzwerkstatus und SEB-Status.
      </Text>
      <Text>
        Antworten werden alle 30 Sekunden automatisch gespeichert. Bei Verbindungsabbruch werden Antworten lokal zwischengespeichert und bei Reconnect nachgesendet.
      </Text>

      <Untertitel>URL-Schema</Untertitel>
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-sm space-y-2 mb-4">
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?id=abc</code> — Prüfung für SuS</div>
        <div><code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">/Pruefung/?id=abc</code> — Monitoring für LP (wenn als LP angemeldet)</div>
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

      <Untertitel>KI-Korrektur</Untertitel>
      <Text>
        Mit &laquo;KI-Korrektur starten&raquo; werden alle Antworten automatisch durch die KI bewertet. Die KI vergibt Punkte und schreibt eine Begründung. Sie können jeden Wert manuell überschreiben.
      </Text>

      <Untertitel>Review-Workflow</Untertitel>
      <Schritt nr={1}><strong>KI bewertet</strong> — Automatische Punktevergabe pro Frage und SuS.</Schritt>
      <Schritt nr={2}><strong>LP prüft</strong> — Sie können KI-Vorschläge bestätigen oder anpassen. Ihre Punkte haben immer Vorrang.</Schritt>
      <Schritt nr={3}><strong>Feedback senden</strong> — Generiert individuelles Feedback pro SuS und versendet es per E-Mail.</Schritt>

      <Hinweis>
        Die KI-Punkte sind Vorschläge. Sie entscheiden — Ihre manuellen Punkte überschreiben die KI-Bewertung immer.
      </Hinweis>
    </div>
  )
}

function HilfeBloom() {
  return (
    <div>
      <Titel>Bloom-Taxonomie (K1–K6)</Titel>
      <Text>
        Die Bloom-Taxonomie ordnet Prüfungsfragen nach kognitivem Anforderungsniveau ein. Jede Frage in der Fragenbank wird einer Stufe K1–K6 zugeordnet. Der Analyse-Tab zeigt die Verteilung über die gesamte Prüfung.
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

      <FAQItem frage="Was passiert wenn ein SuS die Verbindung verliert?">
        Die Antworten werden lokal im Browser gespeichert. Sobald die Verbindung wiederhergestellt ist, werden sie automatisch an den Server gesendet. Es gehen keine Daten verloren.
      </FAQItem>

      <FAQItem frage="Können SuS zwischen Fragen hin- und herspringen?">
        Ja, wenn &laquo;Rücknavigation erlaubt&raquo; in den Prüfungseinstellungen aktiviert ist. Bei linearen Prüfungen können SuS nur vorwärts navigieren.
      </FAQItem>

      <FAQItem frage="Brauche ich den Safe Exam Browser (SEB)?">
        SEB ist optional. Wenn aktiviert, werden SuS ohne SEB gewarnt und können die Prüfung nicht starten. SEB verhindert den Zugriff auf andere Apps und Websites während der Prüfung.
      </FAQItem>

      <FAQItem frage="Wie funktioniert der Demo-Modus?">
        Ohne Backend-Konfiguration startet die App automatisch im Demo-Modus mit Beispieldaten. Alle Funktionen sind nutzbar, aber Änderungen werden nicht gespeichert.
      </FAQItem>

      <FAQItem frage="Kann ich Fragen in mehreren Prüfungen verwenden?">
        Ja. Die Fragenbank ist unabhängig von einzelnen Prüfungen. Eine Frage kann in beliebig vielen Prüfungen verwendet werden.
      </FAQItem>

      <FAQItem frage="Was bedeuten die Bloom-Stufen K1-K6?">
        K1 = Wissen (erinnern), K2 = Verstehen, K3 = Anwenden, K4 = Analysieren, K5 = Bewerten/Beurteilen, K6 = Erschaffen/Entwickeln. Höhere Stufen erfordern mehr kognitive Leistung.
      </FAQItem>

      <FAQItem frage="Wie genau ist die Zeitschätzung?">
        Die Zeitschätzung basiert auf Erfahrungswerten pro Fragetyp und Taxonomiestufe. Sie ist ein Richtwert — die tatsächliche Bearbeitungszeit hängt von der Aufgabenkomplexität und den SuS ab. Sie können den Zeitbedarf pro Frage manuell anpassen.
      </FAQItem>

      <FAQItem frage="Wer kann meine Prüfungen sehen?">
        Nur Lehrpersonen mit @gymhofwil.ch-Login haben Zugriff auf den Composer, die Fragenbank und die Korrektur. SuS sehen nur die ihnen zugewiesene Prüfung.
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
