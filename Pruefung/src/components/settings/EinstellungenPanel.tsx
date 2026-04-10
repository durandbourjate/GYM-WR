import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useStammdatenStore } from '../../store/stammdatenStore'
import type { Stammdaten, LPProfil } from '../../types/stammdaten'

interface Props {
  onSchliessen: () => void
}

type EinstellungenTab = 'profil' | 'admin'

/**
 * Einstellungen-Panel: Slide-over Panel.
 * - Mein Profil: LP konfiguriert eigene Kurse/Fächer/Gefässe
 * - Admin: Stammdaten verwalten (nur Admins)
 */
export default function EinstellungenPanel({ onSchliessen }: Props) {
  const user = useAuthStore(s => s.user)
  const { stammdaten, lpProfil, istAdmin, ladeStammdaten, ladeLPProfil } = useStammdatenStore()
  const admin = istAdmin(user?.email)

  const [tab, setTab] = useState<EinstellungenTab>(admin ? 'admin' : 'profil')

  // Stammdaten + Profil laden
  useEffect(() => {
    if (user?.email) {
      ladeStammdaten(user.email)
      ladeLPProfil(user.email)
    }
  }, [user?.email, ladeStammdaten, ladeLPProfil])

  const tabs: { key: EinstellungenTab; label: string; sichtbar: boolean }[] = [
    { key: 'profil', label: 'Mein Profil', sichtbar: true },
    { key: 'admin', label: 'Admin', sichtbar: admin },
  ]

  const sichtbareTabs = tabs.filter(t => t.sichtbar)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onSchliessen} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Einstellungen</h2>
          <button onClick={onSchliessen} className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-4 border-b border-slate-200 dark:border-slate-700">
          {sichtbareTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t.key
                  ? 'border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'profil' && user?.email && (
            <ProfilTab email={user.email} stammdaten={stammdaten} profil={lpProfil} />
          )}
          {tab === 'admin' && admin && user?.email && (
            <AdminTab email={user.email} stammdaten={stammdaten} />
          )}
        </div>
      </div>
    </div>
  )
}

// === PROFIL TAB ===

function ProfilTab({ email, stammdaten, profil }: { email: string; stammdaten: Stammdaten; profil: LPProfil | null }) {
  const { speichereLPProfil } = useStammdatenStore()
  const [gewaehlteKurse, setGewaehlteKurse] = useState<string[]>(profil?.kursIds ?? [])
  const [gewaehlteFachschaften, setGewaehlteFachschaften] = useState<string[]>(profil?.fachschaftIds ?? [])
  const [gewaehlteGefaesse, setGewaehlteGefaesse] = useState<string[]>(profil?.gefaesse ?? [])
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'laeuft' | 'gespeichert' | 'fehler'>('idle')

  // Wenn Profil geladen wird, State aktualisieren
  useEffect(() => {
    if (profil) {
      setGewaehlteKurse(profil.kursIds ?? [])
      setGewaehlteFachschaften(profil.fachschaftIds ?? [])
      setGewaehlteGefaesse(profil.gefaesse ?? [])
    }
  }, [profil])

  const speichern = async () => {
    setSpeicherStatus('laeuft')
    const neuesProfil: LPProfil = {
      email,
      kursIds: gewaehlteKurse,
      fachschaftIds: gewaehlteFachschaften,
      gefaesse: gewaehlteGefaesse,
    }
    const ok = await speichereLPProfil(neuesProfil)
    setSpeicherStatus(ok ? 'gespeichert' : 'fehler')
    if (ok) setTimeout(() => setSpeicherStatus('idle'), 2000)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Mein Profil</h3>

      {/* Fachschaften */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fachschaften</label>
        <div className="flex flex-wrap gap-2">
          {stammdaten.fachschaften.map(fs => (
            <CheckboxChip
              key={fs.id}
              label={fs.name}
              checked={gewaehlteFachschaften.includes(fs.id)}
              onChange={checked => {
                setGewaehlteFachschaften(prev =>
                  checked ? [...prev, fs.id] : prev.filter(id => id !== fs.id)
                )
              }}
            />
          ))}
        </div>
      </div>

      {/* Kurse */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Meine Kurse</label>
        <div className="flex flex-wrap gap-2">
          {stammdaten.kurse.map(k => (
            <CheckboxChip
              key={k.id}
              label={k.name}
              checked={gewaehlteKurse.includes(k.id)}
              onChange={checked => {
                setGewaehlteKurse(prev =>
                  checked ? [...prev, k.id] : prev.filter(id => id !== k.id)
                )
              }}
            />
          ))}
        </div>
      </div>

      {/* Gefässe */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gefässe</label>
        <div className="flex flex-wrap gap-2">
          {stammdaten.gefaesse.map(g => (
            <CheckboxChip
              key={g}
              label={g}
              checked={gewaehlteGefaesse.includes(g)}
              onChange={checked => {
                setGewaehlteGefaesse(prev =>
                  checked ? [...prev, g] : prev.filter(id => id !== g)
                )
              }}
            />
          ))}
        </div>
      </div>

      {/* Speichern */}
      <button
        onClick={speichern}
        disabled={speicherStatus === 'laeuft'}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
          speicherStatus === 'laeuft'
            ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-wait'
            : speicherStatus === 'gespeichert'
            ? 'bg-green-600 text-white'
            : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100'
        }`}
      >
        {speicherStatus === 'laeuft' ? 'Speichern...' : speicherStatus === 'gespeichert' ? '✓ Gespeichert' : 'Profil speichern'}
      </button>
      {speicherStatus === 'fehler' && (
        <p className="text-sm text-red-600 dark:text-red-400">Fehler beim Speichern. Bitte erneut versuchen.</p>
      )}
    </div>
  )
}

// === ADMIN TAB ===

function AdminTab({ email, stammdaten }: { email: string; stammdaten: Stammdaten }) {
  const { speichereStammdaten: speichereStammdatenAction } = useStammdatenStore()
  const [admins, setAdmins] = useState(stammdaten.admins.join('\n'))
  const [klassen, setKlassen] = useState(stammdaten.klassen.join(', '))
  const [gefaesse, setGefaesse] = useState(stammdaten.gefaesse.join(', '))
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'laeuft' | 'gespeichert' | 'fehler'>('idle')
  const [bearbeitungsModus, setBearbeitungsModus] = useState(false)

  // Stammdaten aktualisieren wenn sie sich ändern
  useEffect(() => {
    setAdmins(stammdaten.admins.join('\n'))
    setKlassen(stammdaten.klassen.join(', '))
    setGefaesse(stammdaten.gefaesse.join(', '))
  }, [stammdaten])

  const speichern = async () => {
    setSpeicherStatus('laeuft')
    const daten: Partial<Stammdaten> = {
      admins: admins.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean),
      klassen: klassen.split(',').map(s => s.trim()).filter(Boolean),
      gefaesse: gefaesse.split(',').map(s => s.trim()).filter(Boolean),
    }
    const ok = await speichereStammdatenAction(email, daten)
    setSpeicherStatus(ok ? 'gespeichert' : 'fehler')
    if (ok) {
      setBearbeitungsModus(false)
      setTimeout(() => setSpeicherStatus('idle'), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Admin-Einstellungen</h3>
        {!bearbeitungsModus && (
          <button
            onClick={() => setBearbeitungsModus(true)}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Bearbeiten
          </button>
        )}
      </div>

      {/* Admins */}
      <SettingsField
        label="Admins (E-Mails, eine pro Zeile)"
        value={admins}
        onChange={setAdmins}
        multiline
        readonly={!bearbeitungsModus}
      />

      {/* Klassen */}
      <SettingsField
        label="Klassen (kommasepariert)"
        value={klassen}
        onChange={setKlassen}
        readonly={!bearbeitungsModus}
        hinweis="z.B. 27a, 28bc29fs, 29c, 30s"
      />

      {/* Gefässe */}
      <SettingsField
        label="Gefässe (kommasepariert)"
        value={gefaesse}
        onChange={setGefaesse}
        readonly={!bearbeitungsModus}
        hinweis="z.B. SF, EF, EWR, GF"
      />

      {/* Kurse (nur Anzeige, Bearbeitung in späterer Version) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kurse ({stammdaten.kurse.length})</label>
        <div className="space-y-1">
          {stammdaten.kurse.map(k => (
            <div key={k.id} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded">
              <span className="font-medium">{k.name}</span>
              <span className="text-slate-400 dark:text-slate-500 ml-2">({k.fach}, {k.gefaess})</span>
            </div>
          ))}
        </div>
        {bearbeitungsModus && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Kurse können in einer nächsten Version bearbeitet werden.</p>
        )}
      </div>

      {/* Fachschaften (nur Anzeige) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fachschaften ({stammdaten.fachschaften.length})</label>
        <div className="flex flex-wrap gap-1.5">
          {stammdaten.fachschaften.map(fs => (
            <span key={fs.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {fs.kuerzel} — {fs.name}
            </span>
          ))}
        </div>
      </div>

      {/* Fächer (nur Anzeige) */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fächer ({stammdaten.faecher.length})</label>
        <div className="flex flex-wrap gap-1.5">
          {stammdaten.faecher.map(f => (
            <span key={f.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {f.kuerzel} — {f.name}
            </span>
          ))}
        </div>
      </div>

      {/* Speichern */}
      {bearbeitungsModus && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={speichern}
            disabled={speicherStatus === 'laeuft'}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              speicherStatus === 'laeuft'
                ? 'bg-slate-300 dark:bg-slate-600 cursor-wait'
                : speicherStatus === 'gespeichert'
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100'
            }`}
          >
            {speicherStatus === 'laeuft' ? 'Speichern...' : speicherStatus === 'gespeichert' ? '✓ Gespeichert' : 'Speichern'}
          </button>
          <button
            onClick={() => {
              setBearbeitungsModus(false)
              setAdmins(stammdaten.admins.join('\n'))
              setKlassen(stammdaten.klassen.join(', '))
              setGefaesse(stammdaten.gefaesse.join(', '))
            }}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
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

// === SHARED COMPONENTS ===

function CheckboxChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
        checked
          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-slate-400'
      }`}
    >
      {checked && '✓ '}{label}
    </button>
  )
}

function SettingsField({ label, value, onChange, multiline, readonly, hinweis }: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  readonly?: boolean
  hinweis?: string
}) {
  const baseClass = `w-full text-sm rounded-lg border px-3 py-2 transition-colors ${
    readonly
      ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'
      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-slate-400'
  }`

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readonly}
          rows={3}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          readOnly={readonly}
          className={baseClass}
        />
      )}
      {hinweis && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hinweis}</p>}
    </div>
  )
}
