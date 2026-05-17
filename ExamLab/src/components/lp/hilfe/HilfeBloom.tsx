import { useState } from 'react'
import { TitelMitStern, Text, Hinweis } from './layoutHelpers'

export default function HilfeBloom() {
  return (
    <div>
      <TitelMitStern tabId="bloom">Bloom-Taxonomie (K1–K6)</TitelMitStern>
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
