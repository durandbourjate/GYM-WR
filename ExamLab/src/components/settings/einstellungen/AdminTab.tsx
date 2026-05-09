import { useState, useEffect, useCallback } from 'react'
import { useStammdatenStore } from '../../../store/stammdatenStore'
import type { Stammdaten, KursDefinition, FachDefinition, FachschaftDefinition } from '../../../types/stammdaten'
import { SettingsField } from './sharedFelder'
import { InlineKursEditor, InlineTextEditor } from './InlineEditoren'

export default function AdminTab({ email, stammdaten }: { email: string; stammdaten: Stammdaten }) {
  const { speichereStammdaten: speichereStammdatenAction } = useStammdatenStore()
  const [admins, setAdmins] = useState(stammdaten.admins.join('\n'))
  const [klassen, setKlassen] = useState(stammdaten.klassen.join(', '))
  const [gefaesse, setGefaesse] = useState<string[]>(stammdaten.gefaesse)
  const [kurse, setKurse] = useState<KursDefinition[]>(stammdaten.kurse)
  const [faecher, setFaecher] = useState<FachDefinition[]>(stammdaten.faecher)
  const [fachschaften, setFachschaften] = useState<FachschaftDefinition[]>(stammdaten.fachschaften)
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'laeuft' | 'gespeichert' | 'fehler'>('idle')
  const [bearbeitungsModus, setBearbeitungsModus] = useState(false)

  // Inline-Edit State
  const [neuerKursOffen, setNeuerKursOffen] = useState(false)
  const [neuesFachOffen, setNeuesFachOffen] = useState(false)
  const [neueFachschaftOffen, setNeueFachschaftOffen] = useState(false)
  const [neuesGefaessOffen, setNeuesGefaessOffen] = useState(false)

  useEffect(() => {
    setAdmins(stammdaten.admins.join('\n'))
    setKlassen(stammdaten.klassen.join(', '))
    setGefaesse(stammdaten.gefaesse)
    setKurse(stammdaten.kurse)
    setFaecher(stammdaten.faecher)
    setFachschaften(stammdaten.fachschaften)
  }, [stammdaten])

  const speichern = useCallback(async () => {
    setSpeicherStatus('laeuft')
    const daten: Partial<Stammdaten> = {
      admins: admins.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean),
      klassen: klassen.split(',').map(s => s.trim()).filter(Boolean),
      gefaesse,
      kurse,
      faecher,
      fachschaften,
    }
    const ok = await speichereStammdatenAction(email, daten)
    setSpeicherStatus(ok ? 'gespeichert' : 'fehler')
    if (ok) {
      setBearbeitungsModus(false)
      setTimeout(() => setSpeicherStatus('idle'), 2000)
    }
  }, [admins, klassen, gefaesse, kurse, faecher, fachschaften, email, speichereStammdatenAction])

  const abbrechen = () => {
    setBearbeitungsModus(false)
    setAdmins(stammdaten.admins.join('\n'))
    setKlassen(stammdaten.klassen.join(', '))
    setGefaesse(stammdaten.gefaesse)
    setKurse(stammdaten.kurse)
    setFaecher(stammdaten.faecher)
    setFachschaften(stammdaten.fachschaften)
    setNeuerKursOffen(false)
    setNeuesFachOffen(false)
    setNeueFachschaftOffen(false)
    setNeuesGefaessOffen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Admin-Einstellungen</h3>
        {!bearbeitungsModus && (
          <button onClick={() => setBearbeitungsModus(true)} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            Bearbeiten
          </button>
        )}
      </div>

      <SettingsField label="Admins (E-Mails, eine pro Zeile)" value={admins} onChange={setAdmins} multiline readonly={!bearbeitungsModus} />
      <SettingsField label="Klassen (kommasepariert)" value={klassen} onChange={setKlassen} readonly={!bearbeitungsModus} hinweis="z.B. 27a, 28bc29fs, 29c, 30s" />
      {/* === GEFÄSSE CRUD === */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gefässe ({gefaesse.length})</label>
          {bearbeitungsModus && !neuesGefaessOffen && (
            <button onClick={() => setNeuesGefaessOffen(true)} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">+ Gefäss</button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {gefaesse.map((g, idx) => (
            <span key={g} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded inline-flex items-center gap-1">
              {g}
              {bearbeitungsModus && (
                <button onClick={() => setGefaesse(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer">✕</button>
              )}
            </span>
          ))}
        </div>
        {neuesGefaessOffen && (
          <InlineTextEditor
            label="Gefäss"
            felder={[
              { name: 'kuerzel', placeholder: 'Kürzel (z.B. SF, EF, EWR, GF)', required: true },
            ]}
            onSpeichern={(werte) => {
              const kuerzel = werte.kuerzel.trim()
              if (kuerzel && !gefaesse.includes(kuerzel)) {
                setGefaesse(prev => [...prev, kuerzel])
              }
              setNeuesGefaessOffen(false)
            }}
            onAbbrechen={() => setNeuesGefaessOffen(false)}
          />
        )}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">z.B. SF, EF, EWR, GF — werden bei Kursen und im Frageneditor als Auswahl angeboten.</p>
      </div>

      {/* === KURSE CRUD === */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Kurse ({kurse.length})</label>
          {bearbeitungsModus && !neuerKursOffen && (
            <button onClick={() => setNeuerKursOffen(true)} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">+ Kurs hinzufügen</button>
          )}
        </div>
        <div className="space-y-1">
          {kurse.map((k, idx) => (
            <div key={k.id} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded">
              <span className="font-medium flex-1">{k.name}</span>
              <span className="text-xs text-slate-400">{k.gefaess} · {k.klassen.join(', ')}</span>
              {bearbeitungsModus && (
                <button onClick={() => setKurse(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
              )}
            </div>
          ))}
        </div>
        {neuerKursOffen && (
          <InlineKursEditor
            gefaesse={gefaesse}
            fachschaften={fachschaften}
            onSpeichern={(k) => { setKurse(prev => [...prev, k]); setNeuerKursOffen(false) }}
            onAbbrechen={() => setNeuerKursOffen(false)}
          />
        )}
      </div>

      {/* === FACHSCHAFTEN CRUD === */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fachschaften ({fachschaften.length})</label>
          {bearbeitungsModus && !neueFachschaftOffen && (
            <button onClick={() => setNeueFachschaftOffen(true)} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">+ Fachschaft</button>
          )}
        </div>
        <div className="space-y-1">
          {fachschaften.map((fs, idx) => (
            <div key={fs.id} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded">
              <span className="font-medium">{fs.kuerzel}</span>
              <span className="text-slate-500 dark:text-slate-400 flex-1">{fs.name}</span>
              {fs.fachbereichTags && fs.fachbereichTags.map(t => (
                <span key={t.name} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.farbe + '20', color: t.farbe }}>{t.name}</span>
              ))}
              {bearbeitungsModus && (
                <button onClick={() => setFachschaften(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs cursor-pointer">✕</button>
              )}
            </div>
          ))}
        </div>
        {neueFachschaftOffen && (
          <InlineTextEditor
            label="Fachschaft"
            felder={[
              { name: 'kuerzel', placeholder: 'Kürzel (z.B. MA)', required: true },
              { name: 'name', placeholder: 'Name (z.B. Mathematik)', required: true },
            ]}
            onSpeichern={(werte) => {
              const id = werte.kuerzel.toLowerCase()
              setFachschaften(prev => [...prev, { id, kuerzel: werte.kuerzel, name: werte.name, faecherIds: [id] }])
              setNeueFachschaftOffen(false)
            }}
            onAbbrechen={() => setNeueFachschaftOffen(false)}
          />
        )}
      </div>

      {/* === FÄCHER CRUD === */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fächer ({faecher.length})</label>
          {bearbeitungsModus && !neuesFachOffen && (
            <button onClick={() => setNeuesFachOffen(true)} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">+ Fach</button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {faecher.map((f, idx) => (
            <span key={f.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded inline-flex items-center gap-1">
              {f.kuerzel} — {f.name}
              {bearbeitungsModus && (
                <button onClick={() => setFaecher(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 cursor-pointer">✕</button>
              )}
            </span>
          ))}
        </div>
        {neuesFachOffen && (
          <InlineTextEditor
            label="Fach"
            felder={[
              { name: 'kuerzel', placeholder: 'Kürzel (z.B. PH)', required: true },
              { name: 'name', placeholder: 'Name (z.B. Physik)', required: true },
            ]}
            onSpeichern={(werte) => {
              const id = werte.kuerzel.toLowerCase()
              setFaecher(prev => [...prev, { id, kuerzel: werte.kuerzel, name: werte.name }])
              setNeuesFachOffen(false)
            }}
            onAbbrechen={() => setNeuesFachOffen(false)}
          />
        )}
      </div>

      {/* Speichern */}
      {bearbeitungsModus && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={speichern}
            disabled={speicherStatus === 'laeuft'}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              speicherStatus === 'laeuft' ? 'bg-slate-300 dark:bg-slate-600 cursor-wait'
              : speicherStatus === 'gespeichert' ? 'bg-green-600 text-white'
              : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100'
            }`}
          >
            {speicherStatus === 'laeuft' ? 'Speichern...' : speicherStatus === 'gespeichert' ? '✓ Gespeichert' : 'Speichern'}
          </button>
          <button onClick={abbrechen} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            Abbrechen
          </button>
        </div>
      )}
      {speicherStatus === 'fehler' && (
        <p className="text-sm text-red-600 dark:text-red-400">Fehler beim Speichern. Bitte erneut versuchen.</p>
      )}
    </div>
  )
}
