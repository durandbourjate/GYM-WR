import { Titel, Untertitel, Text, Hinweis } from './layoutHelpers'

export default function HilfeKI() {
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
        Erstellt neue Inhalte basierend auf den vorhandenen Metadaten (Thema, Fach, Taxonomiestufe). Verfügbar für: Fragetext, Musterlösung, MC-Optionen, Zuordnungspaare, R/F-Aussagen, Lücken und Berechnungsergebnisse.
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
