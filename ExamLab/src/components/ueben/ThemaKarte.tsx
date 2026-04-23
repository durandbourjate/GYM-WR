import { useState } from 'react'
import type { ThemenFortschritt } from '../../types/ueben/fortschritt'
import type { ThemenStatus } from '../../types/ueben/themenSichtbarkeit'
import { berechneSterne, sterneText } from '../../utils/ueben/gamification'
import { getFachFarbe } from '../../utils/ueben/fachFarben'

interface ThemaKarteProps {
  thema: string
  fach: string
  anzahlFragen: number
  anzahlUnterthemen: number
  fortschritt: ThemenFortschritt
  themenStatus: ThemenStatus
  fachFarben: Record<string, string>
  onClick: () => void
  /** Anzahl Lernziele für dieses Thema (0 = kein 🏁 Button) */
  anzahlLernziele?: number
  /** Callback wenn 🏁 Button geklickt wird */
  onLernzieleKlick?: () => void
}

/**
 * Thema-Karte im SuS-Dashboard.
 * 3 visuelle Stufen:
 * - aktiv: Farbiger linker Rand + "Aktuell"-Badge
 * - abgeschlossen: Normal
 * - nicht_freigeschaltet: Gedämpft, kein Klick
 */
export function ThemaKarte({
  thema, fach, anzahlFragen, anzahlUnterthemen,
  fortschritt, themenStatus, fachFarben, onClick,
  anzahlLernziele = 0, onLernzieleKlick,
}: ThemaKarteProps) {
  const farbe = getFachFarbe(fach, fachFarben)
  const istAktiv = themenStatus === 'aktiv'
  const istGesperrt = themenStatus === 'nicht_freigeschaltet'
  const [zeigeGesperrtInfo, setZeigeGesperrtInfo] = useState(false)

  const handleKlick = () => {
    if (istGesperrt) {
      // Overlay anzeigen (bleibt bis User explizit agiert)
      setZeigeGesperrtInfo(true)
    } else {
      onClick()
    }
  }

  const handleFreiwilligUeben = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZeigeGesperrtInfo(false)
    onClick()
  }

  const handleOverlaySchliessen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setZeigeGesperrtInfo(false)
  }

  // Ticket 3/4 S137: alle Themen bekommen farbigen linken Rand (analog LP-DetailKarte).
  // Aktiv zusätzlich border-b-4 + Badge, Gesperrt bleibt grau (keine Fach-Farbe).
  const zeigeFachRand = !istGesperrt

  return (
    <button
      onClick={handleKlick}
      className={`text-left p-4 rounded-xl border-2 transition-colors min-h-[48px] relative cursor-pointer
        ${istGesperrt
          ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:opacity-75'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
        }
        ${zeigeFachRand ? 'border-l-4' : ''}
        ${istAktiv ? 'border-b-4' : ''}
      `}
      style={
        istAktiv
          ? { borderLeftColor: farbe, borderBottomColor: farbe }
          : zeigeFachRand
            ? { borderLeftColor: farbe }
            : undefined
      }
    >
      {/* Aktuell-Badge */}
      {istAktiv && (
        <span
          className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: farbe }}
        >
          Aktuell
        </span>
      )}

      {/* Schloss-Icon bei gesperrten Themen */}
      {istGesperrt && (
        <span className="absolute top-2 right-2 text-slate-400 dark:text-slate-600 text-sm">
          🔒
        </span>
      )}

      {/* Overlay bei Klick auf gesperrtes Thema — bleibt bis User agiert */}
      {zeigeGesperrtInfo && (
        <div className="absolute inset-0 bg-slate-900/90 dark:bg-slate-100/90 rounded-xl flex flex-col items-center justify-center gap-3 z-10 p-4">
          <p className="text-white dark:text-slate-800 text-xs text-center font-medium">
            Noch nicht freigeschaltet
          </p>
          <button
            onClick={handleFreiwilligUeben}
            className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-medium px-4 py-2 rounded-lg min-h-[36px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Freiwillig üben (nicht bewertet)
          </button>
          <button
            onClick={handleOverlaySchliessen}
            className="text-slate-400 dark:text-slate-500 text-xs hover:text-white dark:hover:text-slate-800"
          >
            Abbrechen
          </button>
        </div>
      )}

      <div className="mb-2">
        <span className="font-semibold dark:text-white text-sm leading-tight">{thema}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>{anzahlFragen} Fragen</span>
        {anzahlUnterthemen > 0 && <span>{anzahlUnterthemen} Unterthemen</span>}
        {!istGesperrt && <span>{sterneText(berechneSterne(fortschritt.quote))}</span>}
        {anzahlLernziele > 0 && onLernzieleKlick && (
          <span
            onClick={(e) => { e.stopPropagation(); onLernzieleKlick() }}
            className="cursor-pointer hover:opacity-80"
            title={`${anzahlLernziele} Lernziele`}
          >
            🏁
          </span>
        )}
      </div>
      {!istGesperrt && <FortschrittsBalkenKompakt fortschritt={fortschritt} />}
    </button>
  )
}

function FortschrittsBalkenKompakt({ fortschritt }: { fortschritt: ThemenFortschritt }) {
  if (fortschritt.gesamt === 0) return null
  const gemeistertPct = (fortschritt.gemeistert / fortschritt.gesamt) * 100
  const gefestigtPct = (fortschritt.gefestigt / fortschritt.gesamt) * 100
  const uebenPct = (fortschritt.ueben / fortschritt.gesamt) * 100

  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex mt-2">
      {gemeistertPct > 0 && <div className="bg-green-500 h-2" style={{ width: `${gemeistertPct}%` }} />}
      {gefestigtPct > 0 && <div className="bg-blue-400 h-2" style={{ width: `${gefestigtPct}%` }} />}
      {uebenPct > 0 && <div className="bg-yellow-400 h-2" style={{ width: `${uebenPct}%` }} />}
    </div>
  )
}
