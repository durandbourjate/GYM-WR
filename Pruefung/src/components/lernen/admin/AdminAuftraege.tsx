import { useState } from 'react'
import { useLernenAuftragStore } from '../../../store/lernen/auftragStore'
import { useLernenGruppenStore } from '../../../store/lernen/gruppenStore'
import { useLernenAuthStore } from '../../../store/lernen/authStore'

export default function AdminAuftraege() {
  const { auftraege, erstelleAuftrag, schliesseAuftrag, loescheAuftrag, ladeAuftraege } = useLernenAuftragStore()
  const { aktiveGruppe, mitglieder } = useLernenGruppenStore()
  const { user } = useLernenAuthStore()
  const [formOffen, setFormOffen] = useState(false)

  const alleMitglieder = mitglieder.filter(m => m.rolle === 'lernend')

  // Fächer werden aus echten Fragen-Daten gezogen (leer bis geladen)
  const faecher: string[] = []

  // Auftraege bei Mount laden
  useState(() => { ladeAuftraege() })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold dark:text-white">Aufträge</h3>
        <button
          onClick={() => setFormOffen(!formOffen)}
          className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] hover:bg-slate-900 dark:hover:bg-slate-100"
        >
          {formOffen ? 'Abbrechen' : 'Neuer Auftrag'}
        </button>
      </div>

      {formOffen && (
        <AuftragForm
          faecher={faecher}
          mitglieder={alleMitglieder.map(m => ({ email: m.email, name: m.name }))}
          onErstellen={(daten) => {
            erstelleAuftrag({
              gruppeId: aktiveGruppe?.id || '',
              erstelltVon: user?.email || '',
              ...daten,
            })
            setFormOffen(false)
          }}
        />
      )}

      {/* Aktive Auftraege */}
      <div className="space-y-2">
        {auftraege.filter(a => a.status === 'aktiv').map((auftrag) => (
          <div key={auftrag.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium dark:text-white">{auftrag.titel}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300">aktiv</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              {auftrag.filter.fach && `${auftrag.filter.fach}`}
              {auftrag.filter.thema && ` — ${auftrag.filter.thema}`}
              {auftrag.frist && ` | Bis ${auftrag.frist}`}
            </div>
            <div className="text-xs text-slate-400 mb-3">
              Fuer: {auftrag.zielEmail.join(', ')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => schliesseAuftrag(auftrag.id)}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Abschliessen
              </button>
              <button
                onClick={() => loescheAuftrag(auftrag.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Loeschen
              </button>
            </div>
          </div>
        ))}

        {auftraege.filter(a => a.status === 'aktiv').length === 0 && (
          <p className="text-sm text-slate-400">Keine aktiven Aufträge.</p>
        )}
      </div>

      {/* Abgeschlossene */}
      {auftraege.filter(a => a.status === 'abgeschlossen').length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Abgeschlossen</h4>
          <div className="space-y-1">
            {auftraege.filter(a => a.status === 'abgeschlossen').map((a) => (
              <div key={a.id} className="text-sm text-slate-400 flex items-center justify-between">
                <span>{a.titel}</span>
                <button onClick={() => loescheAuftrag(a.id)} className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface AuftragFormProps {
  faecher: string[]
  mitglieder: { email: string; name: string }[]
  onErstellen: (daten: {
    titel: string
    zielEmail: string[]
    filter: { fach?: string; thema?: string }
    frist?: string
    status: 'aktiv'
  }) => void
}

function AuftragForm({ faecher, mitglieder, onErstellen }: AuftragFormProps) {
  const [titel, setTitel] = useState('')
  const [fach, setFach] = useState('')
  const [thema, setThema] = useState('')
  const [frist, setFrist] = useState('')
  const [zielEmails, setZielEmails] = useState<string[]>(mitglieder.map(m => m.email))

  // Themen-Liste leer bis Fragen aus Backend geladen werden
  const themen: string[] = []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titel.trim() || zielEmails.length === 0) return
    onErstellen({
      titel: titel.trim(),
      zielEmail: zielEmails,
      filter: {
        ...(fach ? { fach } : {}),
        ...(thema ? { thema } : {}),
      },
      ...(frist ? { frist } : {}),
      status: 'aktiv',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-slate-100 dark:border-slate-700 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Titel</label>
        <input
          type="text"
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="z.B. Mathe Addition üben"
          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Fach</label>
          <select
            value={fach}
            onChange={(e) => { setFach(e.target.value); setThema('') }}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
          >
            <option value="">Alle</option>
            {faecher.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-white">Thema</label>
          <select
            value={thema}
            onChange={(e) => setThema(e.target.value)}
            disabled={!fach}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white disabled:opacity-50"
          >
            <option value="">Alle</option>
            {themen.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Frist (optional)</label>
        <input
          type="date"
          value={frist}
          onChange={(e) => setFrist(e.target.value)}
          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-white">Fuer</label>
        <div className="space-y-1">
          {mitglieder.map(m => (
            <label key={m.email} className="flex items-center gap-2 text-sm dark:text-slate-300">
              <input
                type="checkbox"
                checked={zielEmails.includes(m.email)}
                onChange={(e) => {
                  setZielEmails(e.target.checked
                    ? [...zielEmails, m.email]
                    : zielEmails.filter(em => em !== m.email)
                  )
                }}
                className="rounded"
              />
              {m.name}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!titel.trim() || zielEmails.length === 0}
        className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-lg py-2 font-medium disabled:opacity-50 min-h-[44px] hover:bg-slate-900 dark:hover:bg-slate-100"
      >
        Auftrag erstellen
      </button>
    </form>
  )
}
