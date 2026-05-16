/**
 * KI-SVG-Generator: Generiert ein Diagramm-SVG basierend auf Textbeschreibung.
 * Wird als Tab neben BildUpload im Frageneditor angezeigt.
 *
 * Nutzt den generiereFrageBild-Endpoint im Apps Script Backend (Claude API).
 */
import { useState } from 'react'
import { Loader2, RefreshCw, Sparkles, Check } from 'lucide-react'
import { useEditorServices } from '../EditorContext'

interface Props {
  /** Callback wenn SVG generiert wurde — setzt die bildUrl */
  onBildGeneriert: (svgDataUrl: string) => void
  /** Fragetyp für kontextspezifische SVG-Generierung */
  fragetyp?: 'bildbeschriftung' | 'hotspot' | 'dragdrop_bild'
}

// Beispiel-Prompts je nach Fragetyp
const BEISPIEL_PROMPTS: Record<string, string> = {
  bildbeschriftung: 'Ein Angebot-Nachfrage-Diagramm mit Preis auf der Y-Achse und Menge auf der X-Achse. Nummerierte Marker (1-6) an den wichtigsten Stellen.',
  hotspot: 'Ein Organigramm einer Unternehmung mit CEO, 3 Abteilungen und je 2 Unterabteilungen. Klare Rechtecke für Hotspot-Bereiche.',
  dragdrop_bild: 'Eine leere Bilanz-Struktur mit Aktiven links und Passiven rechts, je 4 leere Felder zum Zuordnen.',
}

export default function BildGeneratorPanel({ onBildGeneriert, fragetyp }: Props) {
  const services = useEditorServices()
  const [beschreibung, setBeschreibung] = useState('')
  const [generiert, setGeneriert] = useState<string | null>(null)
  const [ladend, setLadend] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [iterationen, setIterationen] = useState(0)

  const beispiel = fragetyp ? BEISPIEL_PROMPTS[fragetyp] || '' : ''

  async function generiere() {
    if (!beschreibung.trim()) return
    setLadend(true)
    setFehler(null)

    try {
      // Backend-Call: generiereFrageBild Endpoint (falls verfügbar via EditorServices)
      const svc = services as unknown as Record<string, unknown>
      const genFn = svc.generiereFrageBild as ((params: { beschreibung: string; typ?: string; iteration?: number }) => Promise<{ svg?: string; error?: string }>) | undefined
      const result = genFn ? await genFn({
        beschreibung: beschreibung.trim(),
        typ: fragetyp,
        iteration: iterationen,
      }) : undefined

      if (result?.svg) {
        // SVG als Data-URL setzen
        const svgBlob = new Blob([result.svg], { type: 'image/svg+xml' })
        const dataUrl = URL.createObjectURL(svgBlob)
        setGeneriert(dataUrl)
        setIterationen(prev => prev + 1)
      } else {
        setFehler(result?.error || 'KI konnte kein Bild generieren. Versuche eine andere Beschreibung.')
      }
    } catch (err) {
      setFehler('Fehler bei der Generierung: ' + String(err))
    } finally {
      setLadend(false)
    }
  }

  function uebernehmen() {
    if (generiert) {
      onBildGeneriert(generiert)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
          Beschreibe das gewünschte Diagramm
        </label>
        <textarea
          value={beschreibung}
          onChange={e => setBeschreibung(e.target.value)}
          placeholder={beispiel || 'z.B. Ein Kreislaufdiagramm der Wirtschaft mit Haushalten, Unternehmen und Staat...'}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-800 dark:text-white dark:border-slate-600"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={generiere}
          disabled={ladend || !beschreibung.trim()}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 min-h-[36px] flex items-center gap-2"
        >
          {ladend ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Generiere...
            </>
          ) : iterationen > 0 ? (
            <><RefreshCw className="w-4 h-4" aria-hidden="true" /> Nochmal generieren</>
          ) : (
            <><Sparkles className="w-4 h-4" aria-hidden="true" /> SVG generieren</>
          )}
        </button>
        {iterationen > 0 && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {iterationen} Iteration{iterationen > 1 ? 'en' : ''}
          </span>
        )}
      </div>

      {fehler && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {fehler}
        </div>
      )}

      {generiert && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Vorschau:</p>
          <div className="border rounded-lg p-2 dark:border-slate-600 bg-white dark:bg-slate-800">
            <img
              src={generiert}
              alt="Generiertes Diagramm"
              className="max-w-full max-h-[300px] mx-auto"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={uebernehmen}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 min-h-[36px] inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" aria-hidden="true" /> Bild übernehmen
            </button>
            <button
              onClick={() => { setGeneriert(null); setIterationen(0) }}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm"
            >
              Verwerfen
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Tipp: Beschreibung anpassen und nochmal generieren um das Ergebnis zu verbessern.
          </p>
        </div>
      )}

      {!generiert && !ladend && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-medium">Tipps für gute Ergebnisse:</p>
          <ul className="list-disc ml-4 space-y-0.5">
            <li>Beschreibe die Struktur (Achsen, Bereiche, Gruppen)</li>
            <li>Nenne die Anzahl der Elemente (z.B. "6 Marker", "4 Zonen")</li>
            <li>Keine Lösungstexte im Bild — nur Grundstruktur + Nummern/Buchstaben</li>
            <li>Nach dem Generieren: Zonen/Marker im Editor manuell positionieren</li>
          </ul>
        </div>
      )}
    </div>
  )
}
