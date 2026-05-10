import { useEffect, useRef } from 'react'

export type SchliessenVariante = 'unvollstaendig' | 'sync-pending'

interface Props {
  open: boolean
  variante: SchliessenVariante
  onAlsEntwurfBehalten?: () => void
  onVerwerfen: () => void
  onAbbrechen: () => void
}

export default function SchliessenModal({
  open,
  variante,
  onAlsEntwurfBehalten,
  onVerwerfen,
  onAbbrechen,
}: Props) {
  const abbrechenRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    abbrechenRef.current?.focus()
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAbbrechen()
    }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onAbbrechen])

  if (!open) return null

  const isUnvollstaendig = variante === 'unvollstaendig'

  const title = isUnvollstaendig
    ? 'Frage ist unvollständig'
    : 'Änderungen noch nicht gesichert'

  const body = isUnvollstaendig
    ? 'Diese Frage hat noch leere Pflichtfelder. Wie möchtest du fortfahren?'
    : 'Verbindung zum Server unterbrochen. Wenn du jetzt schliesst, gehen die letzten Änderungen verloren.'

  return (
    <div
      // z-Index muss über ResizableSidebar.overlay-Stack liegen (startet bei 51 + auto-increment).
      // Sonst ist das Modal hinter dem Editor-Overlay versteckt (Ticket 9 Bug).
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onAbbrechen()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="schliessen-modal-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl text-slate-800 dark:text-slate-100">
        <h2 id="schliessen-modal-title" className="text-lg font-semibold mb-3">
          {title}
        </h2>
        <p className="text-sm mb-5 text-slate-600 dark:text-slate-300">
          {body}
        </p>
        <div className="flex gap-2 justify-end flex-wrap">
          <button
            type="button"
            ref={abbrechenRef}
            onClick={onAbbrechen}
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded cursor-pointer transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onVerwerfen}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded cursor-pointer transition-colors"
          >
            {isUnvollstaendig ? 'Verwerfen' : 'Trotzdem schliessen'}
          </button>
          {isUnvollstaendig && onAlsEntwurfBehalten && (
            <button
              type="button"
              onClick={onAlsEntwurfBehalten}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded cursor-pointer transition-colors"
            >
              Als Entwurf behalten
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
