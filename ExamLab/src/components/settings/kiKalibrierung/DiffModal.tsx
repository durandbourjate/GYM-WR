import type { KIFeedbackEintragLP } from '../../../services/kalibrierungApi'

const AKTION_LABELS: Record<string, string> = {
  generiereMusterloesung: 'Musterlösung',
  klassifiziereFrage: 'Klassifikation',
  bewertungsrasterGenerieren: 'Bewertungsraster',
  korrigiereFreitext: 'Freitext-Korrektur',
}

export default function DiffModal({ eintrag, onSchliessen }: { eintrag: KIFeedbackEintragLP; onSchliessen: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onSchliessen}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl max-w-5xl w-full max-h-[85vh] overflow-auto p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold dark:text-white">
            Vergleich KI ↔ LP — {AKTION_LABELS[eintrag.aktion] ?? eintrag.aktion}
          </h3>
          <button
            onClick={onSchliessen}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xl leading-none"
            aria-label="Schliessen"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">KI-Vorschlag</h4>
            <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs dark:text-slate-200 max-h-[50vh] overflow-y-auto">
{JSON.stringify(eintrag.kiOutputJson, null, 2)}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Deine Endversion</h4>
            <pre className="whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs dark:text-slate-200 max-h-[50vh] overflow-y-auto">
{JSON.stringify(eintrag.finaleVersionJson, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
          <span>Diff-Score: {typeof eintrag.diffScore === 'number' ? eintrag.diffScore.toFixed(2) : '—'}</span>
          <span>Status: {eintrag.status}</span>
          <span>Qualifiziert: {eintrag.qualifiziert ? 'Ja' : 'Nein'}</span>
          <span>Aktiv: {eintrag.aktiv ? 'Ja' : 'Nein'}</span>
          {eintrag.wichtig && <span>&#x2B50; Wichtig</span>}
        </div>
      </div>
    </div>
  )
}
