import { useState } from 'react'
import { useEditorConfig } from '../EditorContext'
import { typLabel } from '../fachUtils'
import type { FrageTyp } from '../editorUtils'

/** Kategorisierte Fragetypen-Auswahl mit Suchfeld */

interface Kategorie {
  label: string
  typen: FrageTyp[]
}

const KATEGORIEN: Kategorie[] = [
  {
    label: 'Text & Sprache',
    typen: ['freitext', 'lueckentext', 'audio'],
  },
  {
    label: 'Auswahl & Zuordnung',
    typen: ['mc', 'richtigfalsch', 'zuordnung', 'sortierung'],
  },
  {
    label: 'Bilder & Medien',
    typen: ['hotspot', 'bildbeschriftung', 'dragdrop_bild', 'visualisierung', 'pdf'],
  },
  {
    label: 'MINT',
    typen: ['berechnung', 'code', 'formel'],
  },
  {
    label: 'Buchhaltung',
    typen: ['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'],
  },
  {
    label: 'Struktur',
    typen: ['aufgabengruppe'],
  },
]

interface Props {
  typ: FrageTyp
  setTyp: (t: FrageTyp) => void
  gesperrt: boolean
}

export default function FrageTypAuswahl({ typ, setTyp, gesperrt }: Props) {
  const [suchtext, setSuchtext] = useState('')
  const config = useEditorConfig()
  const hatFiBu = config.zeigeFiBuTypen

  const suche = suchtext.trim().toLowerCase()

  const btnKlassen = (t: FrageTyp) => [
    'px-3 py-1.5 text-sm rounded-lg border transition-colors',
    typ === t
      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500',
    gesperrt ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
  ].join(' ')

  return (
    <div className="space-y-3">
      {/* Suchfeld */}
      {!gesperrt && (
        <input
          type="text"
          value={suchtext}
          onChange={(e) => setSuchtext(e.target.value)}
          placeholder="Fragetyp suchen..."
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white placeholder-slate-400"
        />
      )}

      {/* Kategorien */}
      {KATEGORIEN.map((kat) => {
        // FiBu-Typen nur fuer WR-Fachschaft
        if (kat.label === 'Buchhaltung' && !hatFiBu) return null

        // Filter nach Suchtext
        const sichtbar = suche
          ? kat.typen.filter(t => typLabel(t).toLowerCase().includes(suche))
          : kat.typen

        if (sichtbar.length === 0) return null

        return (
          <div key={kat.label}>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {kat.label}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {sichtbar.map((t) => (
                <button
                  key={t}
                  onClick={() => setTyp(t)}
                  disabled={gesperrt}
                  className={btnKlassen(t)}
                >
                  {typLabel(t)}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
