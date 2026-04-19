import { useState, useCallback } from 'react'
import type { HotspotBereich } from '../../types/fragen'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  bereiche: HotspotBereich[]
  setBereiche: React.Dispatch<React.SetStateAction<HotspotBereich[]>>
  mehrfachauswahl: boolean
  setMehrfachauswahl: (v: boolean) => void
}

export default function HotspotEditor({ bildUrl, setBildUrl, bereiche, setBereiche, mehrfachauswahl, setMehrfachauswahl }: Props) {
  const [ersteEcke, setErsteEcke] = useState<{ x: number; y: number } | null>(null)
  const [editLabel, setEditLabel] = useState<string | null>(null)

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (!ersteEcke) {
      setErsteEcke({ x, y })
    } else {
      const minX = Math.min(ersteEcke.x, x)
      const minY = Math.min(ersteEcke.y, y)
      const breite = Math.abs(x - ersteEcke.x)
      const hoehe = Math.abs(y - ersteEcke.y)

      const neuerBereich: HotspotBereich = {
        id: `b${Date.now()}`,
        form: 'rechteck',
        koordinaten: { x: minX, y: minY, breite, hoehe },
        label: `Bereich ${bereiche.length + 1}`,
        punkte: 1,
      }
      setBereiche(prev => [...prev, neuerBereich])
      setErsteEcke(null)
      setEditLabel(neuerBereich.id)
    }
  }, [ersteEcke, bereiche.length, setBereiche])

  function handleBereichEntfernen(id: string) {
    setBereiche(prev => prev.filter(b => b.id !== id))
  }

  function handleBereichAendern(id: string, feld: 'label' | 'punkte', wert: string | number) {
    setBereiche(prev => prev.map(b =>
      b.id === id ? { ...b, [feld]: wert } : b
    ))
  }

  return (
    <div className="space-y-4">
      <BildMitGenerator bildUrl={bildUrl} setBildUrl={setBildUrl} fragetyp="hotspot" />

      {bildUrl && (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            {ersteEcke
              ? 'Klicke auf die zweite Ecke des Rechtecks'
              : 'Klicke auf das Bild, um die erste Ecke eines neuen Bereichs zu setzen'}
          </p>
          <div className="relative block w-full max-w-2xl cursor-crosshair" onClick={handleBildKlick}>
            <img
              src={resolvePoolBildUrl(bildUrl)}
              alt="Hotspot-Vorschau"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain', maxHeight: '400px' }}
              draggable={false}
            />

            {ersteEcke && (
              <div
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-violet-500 border-2 border-white shadow-md pointer-events-none"
                style={{ left: `${ersteEcke.x}%`, top: `${ersteEcke.y}%` }}
              />
            )}

            {bereiche.map((bereich, i) => {
              const k = bereich.koordinaten
              return (
                <div
                  key={bereich.id}
                  className="absolute border-2 border-violet-500 bg-violet-500/20 rounded pointer-events-none"
                  style={{
                    left: `${k.x}%`,
                    top: `${k.y}%`,
                    width: `${k.breite ?? 0}%`,
                    height: `${k.hoehe ?? 0}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1 rounded shadow">
                    {i + 1}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bereiche.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Definierte Bereiche ({bereiche.length})
          </p>
          <div className="space-y-2">
            {bereiche.map((bereich, i) => (
              <div key={bereich.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={bereich.label}
                  onChange={(e) => handleBereichAendern(bereich.id, 'label', e.target.value)}
                  autoFocus={editLabel === bereich.id}
                  onFocus={() => setEditLabel(null)}
                  className="flex-1 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-slate-500 focus:outline-none"
                  placeholder="Label"
                />
                <input
                  type="number"
                  value={bereich.punkte}
                  onChange={(e) => handleBereichAendern(bereich.id, 'punkte', Number(e.target.value))}
                  min={0}
                  step={0.5}
                  className="w-16 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-slate-500 focus:outline-none text-center"
                  title="Punkte"
                />
                <span className="text-xs text-slate-400">Pkt</span>
                <button
                  onClick={() => handleBereichEntfernen(bereich.id)}
                  className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                  title="Bereich entfernen"
                >
                  {'\u2715'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={mehrfachauswahl}
          onChange={(e) => setMehrfachauswahl(e.target.checked)}
          className="rounded border-slate-300 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">
          Mehrfachauswahl (SuS kann mehrere Bereiche anklicken)
        </span>
      </label>
    </div>
  )
}
