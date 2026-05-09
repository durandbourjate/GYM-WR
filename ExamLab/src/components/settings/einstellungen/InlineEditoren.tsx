import { useState } from 'react'
import type { KursDefinition, FachschaftDefinition } from '../../../types/stammdaten'

/** Inline-Editor für neuen Kurs */
export function InlineKursEditor({ gefaesse, fachschaften, onSpeichern, onAbbrechen }: {
  gefaesse: string[]
  fachschaften: FachschaftDefinition[]
  onSpeichern: (k: KursDefinition) => void
  onAbbrechen: () => void
}) {
  const [name, setName] = useState('')
  const [fach, setFach] = useState('')
  const [fachschaft, setFachschaft] = useState(fachschaften[0]?.id ?? '')
  const [gefaess, setGefaess] = useState(gefaesse[0] ?? 'SF')
  const [klassenStr, setKlassenStr] = useState('')

  const handleSpeichern = () => {
    if (!name.trim() || !fach.trim() || !klassenStr.trim()) return
    const klassen = klassenStr.split(',').map(s => s.trim()).filter(Boolean)
    const fs = fachschaften.find(f => f.id === fachschaft)
    const id = `${gefaess.toLowerCase()}-${(fs?.kuerzel ?? fach).toLowerCase()}-${klassen.join('')}`.replace(/\s+/g, '')
    onSpeichern({ id, name: name.trim(), fach: fach.trim(), fachschaft: fs?.kuerzel ?? '', gefaess, klassen })
  }

  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Kursname (z.B. SF WR 29c)" className="text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white" />
        <input type="text" value={fach} onChange={e => setFach(e.target.value)} placeholder="Fach (z.B. Wirtschaft & Recht)" className="text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white" />
        <select value={fachschaft} onChange={e => setFachschaft(e.target.value)} className="text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white">
          {fachschaften.map(fs => <option key={fs.id} value={fs.id}>{fs.kuerzel}</option>)}
        </select>
        <select value={gefaess} onChange={e => setGefaess(e.target.value)} className="text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white">
          {gefaesse.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <input type="text" value={klassenStr} onChange={e => setKlassenStr(e.target.value)} placeholder="Klassen (kommasepariert, z.B. 29c)" className="w-full text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white" />
      <div className="flex gap-2">
        <button onClick={handleSpeichern} disabled={!name.trim() || !fach.trim() || !klassenStr.trim()} className="px-3 py-1 text-xs font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded hover:bg-slate-900 dark:hover:bg-slate-100 cursor-pointer disabled:opacity-40">Hinzufügen</button>
        <button onClick={onAbbrechen} className="px-3 py-1 text-xs text-slate-500 cursor-pointer">Abbrechen</button>
      </div>
    </div>
  )
}

/** Generischer Inline-Editor für einfache Name/Kürzel-Paare */
export function InlineTextEditor({ label, felder, onSpeichern, onAbbrechen }: {
  label: string
  felder: { name: string; placeholder: string; required?: boolean }[]
  onSpeichern: (werte: Record<string, string>) => void
  onAbbrechen: () => void
}) {
  const [werte, setWerte] = useState<Record<string, string>>({})
  const alleAusgefuellt = felder.filter(f => f.required).every(f => (werte[f.name] ?? '').trim())

  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label} hinzufügen</p>
      <div className="flex gap-2">
        {felder.map(f => (
          <input
            key={f.name}
            type="text"
            value={werte[f.name] ?? ''}
            onChange={e => setWerte(prev => ({ ...prev, [f.name]: e.target.value }))}
            placeholder={f.placeholder}
            className="flex-1 text-sm px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 dark:text-white"
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSpeichern(werte)} disabled={!alleAusgefuellt} className="px-3 py-1 text-xs font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded hover:bg-slate-900 dark:hover:bg-slate-100 cursor-pointer disabled:opacity-40">Hinzufügen</button>
        <button onClick={onAbbrechen} className="px-3 py-1 text-xs text-slate-500 cursor-pointer">Abbrechen</button>
      </div>
    </div>
  )
}
