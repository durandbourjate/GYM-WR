import { useState, useCallback, useRef, useEffect } from 'react'
import type { BildbeschriftungLabel } from '../../types/fragen-core'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'
import type { FeldStatus } from '../pflichtfeldValidation'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  beschriftungen: BildbeschriftungLabel[]
  setBeschriftungen: React.Dispatch<React.SetStateAction<BildbeschriftungLabel[]>>
  /** Pflichtfeld-Status der Beschriftungen-Section (Bundle H Phase 7) */
  feldStatusBeschriftungen?: FeldStatus
}

function pflichtCls(status: FeldStatus | undefined): string {
  return status === 'pflicht-leer'
    ? 'border border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40 rounded-lg p-3'
    : 'border border-slate-200 dark:border-slate-700 rounded-lg p-3'
}

function istBeschriftungLeer(b: BildbeschriftungLabel): boolean {
  if (!Array.isArray(b.korrekt) || b.korrekt.length === 0) return true
  return b.korrekt.every(s => !s || !s.trim())
}

type DragState = { labelId: string; offsetX: number; offsetY: number } | null

export default function BildbeschriftungEditor({ bildUrl, setBildUrl, beschriftungen, setBeschriftungen, feldStatusBeschriftungen }: Props) {
  const [editId, setEditId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Delete/Backspace löscht selektiertes Label (wenn Fokus nicht im Eingabefeld).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
        e.preventDefault()
        setBeschriftungen(prev => prev.filter(b => b.id !== selectedId))
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, setBeschriftungen])

  function bildKoordinaten(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (drag) return
    const target = e.target as HTMLElement
    if (target.closest('[data-label]')) return
    const p = bildKoordinaten(e)
    if (!p) return
    const neuesBeschriftung: BildbeschriftungLabel = {
      id: `l${Date.now()}`,
      position: p,
      korrekt: [''],
    }
    setBeschriftungen(prev => [...prev, neuesBeschriftung])
    setEditId(neuesBeschriftung.id)
    setSelectedId(neuesBeschriftung.id)
  }, [setBeschriftungen, drag])

  function handleEntfernen(id: string) {
    setBeschriftungen(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleKorrektAendern(id: string, text: string) {
    setBeschriftungen(prev => prev.map(b =>
      b.id === id ? { ...b, korrekt: text.split(',').map(t => t.trim()).filter(Boolean) } : b
    ))
  }

  // Bundle 2: Zonenname (label, optional)
  const updateBeschriftungLabel = useCallback((id: string, label: string | undefined) => {
    setBeschriftungen(prev => prev.map(b => b.id === id ? { ...b, label } : b))
  }, [setBeschriftungen])

  function handleLabelPointerDown(label: BildbeschriftungLabel, e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    const p = bildKoordinaten(e)
    if (!p) return
    setSelectedId(label.id)
    setDrag({ labelId: label.id, offsetX: p.x - label.position.x, offsetY: p.y - label.position.y })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  useEffect(() => {
    if (!drag) return
    function onMove(e: PointerEvent) {
      const p = bildKoordinaten(e)
      if (!p) return
      setBeschriftungen(prev => prev.map(b => {
        if (b.id !== drag!.labelId) return b
        const newX = Math.max(0, Math.min(100, p.x - drag!.offsetX))
        const newY = Math.max(0, Math.min(100, p.y - drag!.offsetY))
        return { ...b, position: { x: newX, y: newY } }
      }))
    }
    function onUp() { setDrag(null) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, setBeschriftungen])

  return (
    <div className="space-y-4">
      <BildMitGenerator bildUrl={bildUrl} setBildUrl={setBildUrl} fragetyp="bildbeschriftung" />

      {bildUrl && (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            Klicke aufs Bild fürs neues Label, Label ziehen zum Verschieben. Delete/Backspace löscht markiertes Label.
          </p>
          <div ref={containerRef} className="relative block w-full max-w-2xl cursor-crosshair" onClick={handleBildKlick}>
            <img
              src={resolvePoolBildUrl(bildUrl)}
              alt="Bildbeschriftung-Vorschau"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain', maxHeight: '400px' }}
              draggable={false}
            />

            {beschriftungen.map((b, i) => {
              const istSelected = selectedId === b.id
              return (
                <div
                  key={b.id}
                  data-label={b.id}
                  onPointerDown={(e) => handleLabelPointerDown(b, e)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move"
                  style={{ left: `${b.position.x}%`, top: `${b.position.y}%`, touchAction: 'none' }}
                >
                  <div
                    className={`w-7 h-7 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold shadow-md border-2 border-white dark:border-slate-800 ${istSelected ? 'ring-4 ring-violet-300 dark:ring-violet-500/60' : ''}`}
                  >
                    {i + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {beschriftungen.length > 0 && (
        <div data-testid="bildbeschriftung-marker-section" className={pflichtCls(feldStatusBeschriftungen)}>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Marker ({beschriftungen.length})
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Marker: per Drag platzieren · Antworten kommagetrennt eingeben
          </p>
          <div className="space-y-2">
            {beschriftungen.map((b, i) => {
              const leer = istBeschriftungLeer(b)
              const inputCls = leer
                ? 'w-full px-2 py-1 text-sm rounded border border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:outline-none'
                : 'w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:outline-none'
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`p-2 rounded-lg border space-y-2 ${
                    selectedId === b.id
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={b.label ?? ''}
                        onChange={(e) => updateBeschriftungLabel(b.id, e.target.value || undefined)}
                        placeholder="Zonenname (optional, z.B. 'Eingang')"
                        data-testid={`marker-${b.id}-label-input`}
                        className="w-full text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                      />
                      <div data-testid={`marker-${b.id}-antworten`}>
                        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">
                          Akzeptierte Antworten (kommagetrennt)
                        </label>
                        <input
                          type="text"
                          value={b.korrekt.join(', ')}
                          onChange={(e) => handleKorrektAendern(b.id, e.target.value)}
                          autoFocus={editId === b.id}
                          onFocus={() => setEditId(null)}
                          className={inputCls}
                          placeholder="Antwort 1, Antwort 2, ..."
                        />
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEntfernen(b.id) }}
                      className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                      title="Label entfernen (oder Delete/Backspace)"
                    >
                      {'✕'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
