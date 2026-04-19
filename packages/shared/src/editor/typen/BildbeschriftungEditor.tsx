import { useState, useCallback } from 'react'
import type { BildbeschriftungLabel } from '../../types/fragen'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  beschriftungen: BildbeschriftungLabel[]
  setBeschriftungen: React.Dispatch<React.SetStateAction<BildbeschriftungLabel[]>>
}

export default function BildbeschriftungEditor({ bildUrl, setBildUrl, beschriftungen, setBeschriftungen }: Props) {
  const [editId, setEditId] = useState<string | null>(null)

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const neuesBeschriftung: BildbeschriftungLabel = {
      id: `l${Date.now()}`,
      position: { x, y },
      korrekt: [''],
    }
    setBeschriftungen(prev => [...prev, neuesBeschriftung])
    setEditId(neuesBeschriftung.id)
  }, [setBeschriftungen])

  function handleEntfernen(id: string) {
    setBeschriftungen(prev => prev.filter(b => b.id !== id))
  }

  function handleKorrektAendern(id: string, text: string) {
    setBeschriftungen(prev => prev.map(b =>
      b.id === id ? { ...b, korrekt: text.split(',').map(t => t.trim()).filter(Boolean) } : b
    ))
  }

  return (
    <div className="space-y-4">
      <BildMitGenerator bildUrl={bildUrl} setBildUrl={setBildUrl} fragetyp="bildbeschriftung" />

      {bildUrl && (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            Klicke auf das Bild, um Label-Positionen zu setzen
          </p>
          <div className="relative block w-full max-w-2xl cursor-crosshair" onClick={handleBildKlick}>
            <img
              src={resolvePoolBildUrl(bildUrl)}
              alt="Bildbeschriftung-Vorschau"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain', maxHeight: '400px' }}
              draggable={false}
            />

            {beschriftungen.map((b, i) => (
              <div
                key={b.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${b.position.x}%`, top: `${b.position.y}%` }}
              >
                <div className="w-7 h-7 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold shadow-md border-2 border-white dark:border-slate-800">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {beschriftungen.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Label-Punkte ({beschriftungen.length})
          </p>
          <div className="space-y-2">
            {beschriftungen.map((b, i) => (
              <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">
                    Akzeptierte Antworten (kommagetrennt)
                  </label>
                  <input
                    type="text"
                    value={b.korrekt.join(', ')}
                    onChange={(e) => handleKorrektAendern(b.id, e.target.value)}
                    autoFocus={editId === b.id}
                    onFocus={() => setEditId(null)}
                    className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                    placeholder="Antwort 1, Antwort 2, ..."
                  />
                </div>
                <button
                  onClick={() => handleEntfernen(b.id)}
                  className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                  title="Label entfernen"
                >
                  {'\u2715'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
