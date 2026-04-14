import type { Verstoss } from '../types/lockdown'

interface Props {
  verstoss: Verstoss
  verstossZaehler: number
  maxVerstoesse: number
  onZurueck: () => void
}

const VERSTOSS_LABELS: Record<Verstoss['typ'], string> = {
  'tab-wechsel': 'Tab-Wechsel erkannt',
  'copy-versuch': 'Kopieren/Einfügen blockiert',
  'vollbild-verlassen': 'Vollbild verlassen',
  'split-view': 'Split-View erkannt',
}

export function VerstossOverlay({ verstoss, verstossZaehler, maxVerstoesse, onZurueck }: Props) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
      <div className="text-center text-white max-w-md px-6">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-3">
          {VERSTOSS_LABELS[verstoss.typ] || 'Verstoss erkannt'}
        </h2>
        <p className="text-red-300 font-semibold text-lg mb-4">
          Dieser Verstoss wurde protokolliert ({verstossZaehler} von {maxVerstoesse})
        </p>
        <p className="text-gray-300 mb-2">
          Das Verlassen der Prüfung ist nicht erlaubt.
        </p>
        <p className="text-gray-300 mb-6">
          Bei {maxVerstoesse} Verstössen wird die Prüfung gesperrt
          <br />und muss von der Lehrperson freigeschaltet werden.
        </p>
        <button
          onClick={onZurueck}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          Zurück zur Prüfung
        </button>
      </div>
    </div>
  )
}
