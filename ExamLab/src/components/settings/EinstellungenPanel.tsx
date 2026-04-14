import { useState, useEffect, useCallback } from 'react'
import { TabBar } from '../ui/TabBar'
import { ResizableSidebar } from '@shared/ui/ResizableSidebar'
import { useAuthStore } from '../../store/authStore'
import { useStammdatenStore } from '../../store/stammdatenStore'
import type { Stammdaten, LPProfil, KursDefinition, FachDefinition, FachschaftDefinition } from '../../types/stammdaten'
import LernzielTab from './LernzielTab'
import FavoritenTab from './FavoritenTab'
import AdminSettings from '../ueben/admin/AdminSettings'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'

import type { EinstellungenTab } from '../../store/lpUIStore'

interface Props {
  onSchliessen: () => void
  initialTab?: EinstellungenTab
}

/**
 * Einstellungen-Panel: ResizableSidebar.
 * - Mein Profil: LP konfiguriert eigene Kurse/Fächer/Gefässe
 * - Admin: Stammdaten verwalten (nur Admins)
 */
export default function EinstellungenPanel({ onSchliessen, initialTab }: Props) {
  const user = useAuthStore(s => s.user)
  const { stammdaten, lpProfil, istAdmin, ladeStammdaten, ladeLPProfil } = useStammdatenStore()
  const admin = istAdmin(user?.email)
  const aktiveGruppe = useUebenGruppenStore(s => s.aktiveGruppe)

  const [tab, setTab] = useState<EinstellungenTab>(initialTab ?? (admin ? 'admin' : 'profil'))

  // Stammdaten + Profil laden (Actions sind stabile Zustand-Referenzen)
  useEffect(() => {
    if (user?.email) {
      ladeStammdaten(user.email)
      ladeLPProfil(user.email)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const tabs: { key: EinstellungenTab; label: string; sichtbar: boolean }[] = [
    { key: 'profil', label: 'Mein Profil', sichtbar: true },
    { key: 'lernziele', label: 'Lernziele', sichtbar: true },
    { key: 'favoriten', label: 'Favoriten', sichtbar: true },
    { key: 'uebungen', label: 'Übungen', sichtbar: !!aktiveGruppe },
    { key: 'admin', label: 'Admin', sichtbar: admin },
  ]

  const sichtbareTabs = tabs.filter(t => t.sichtbar)

  // Header-Höhe messen, damit Overlay unterhalb des App-Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  return (
    <ResizableSidebar
      mode="overlay"
      title="Einstellungen"
      onClose={onSchliessen}
      topOffset={headerH}
      storageKey="einstellungen-breite"
    >
      <div className="p-4">
      {/* Tabs */}
      <div className="pb-3">
        <TabBar
          tabs={sichtbareTabs.map(t => ({ id: t.key, label: t.label }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as EinstellungenTab)}
          size="sm"
        />
      </div>

      <div>
        {tab === 'profil' && user?.email && (
          <ProfilTab email={user.email} stammdaten={stammdaten} profil={lpProfil} />
        )}
        {tab === 'lernziele' && user?.email && (
          <LernzielTab email={user.email} />
        )}
        {tab === 'favoriten' && (
          <FavoritenTab istAdmin={admin} />
        )}
        {tab === 'uebungen' && <AdminSettings />}
        {tab === 'admin' && admin && user?.email && (
          <AdminTab email={user.email} stammdaten={stammdaten} />
        )}
      </div>
      </div>
    </ResizableSidebar>
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
        <p className="text-sm text-red-600 dark:text-red-400">
          Fehler beim Speichern. {useStammdatenStore.getState().fehler ? `Details: ${useStammdatenStore.getState().fehler}` : 'Bitte erneut versuchen.'}
        </p>
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
  const [kurse, setKurse] = useState<KursDefinition[]>(stammdaten.kurse)
  const [faecher, setFaecher] = useState<FachDefinition[]>(stammdaten.faecher)
  const [fachschaften, setFachschaften] = useState<FachschaftDefinition[]>(stammdaten.fachschaften)
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'laeuft' | 'gespeichert' | 'fehler'>('idle')
  const [bearbeitungsModus, setBearbeitungsModus] = useState(false)

  // Inline-Edit State
  const [neuerKursOffen, setNeuerKursOffen] = useState(false)
  const [neuesFachOffen, setNeuesFachOffen] = useState(false)
  const [neueFachschaftOffen, setNeueFachschaftOffen] = useState(false)

  useEffect(() => {
    setAdmins(stammdaten.admins.join('\n'))
    setKlassen(stammdaten.klassen.join(', '))
    setGefaesse(stammdaten.gefaesse.join(', '))
    setKurse(stammdaten.kurse)
    setFaecher(stammdaten.faecher)
    setFachschaften(stammdaten.fachschaften)
  }, [stammdaten])

  const speichern = useCallback(async () => {
    setSpeicherStatus('laeuft')
    const daten: Partial<Stammdaten> = {
      admins: admins.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean),
      klassen: klassen.split(',').map(s => s.trim()).filter(Boolean),
      gefaesse: gefaesse.split(',').map(s => s.trim()).filter(Boolean),
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
    setGefaesse(stammdaten.gefaesse.join(', '))
    setKurse(stammdaten.kurse)
    setFaecher(stammdaten.faecher)
    setFachschaften(stammdaten.fachschaften)
    setNeuerKursOffen(false)
    setNeuesFachOffen(false)
    setNeueFachschaftOffen(false)
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
      <SettingsField label="Gefässe (kommasepariert)" value={gefaesse} onChange={setGefaesse} readonly={!bearbeitungsModus} hinweis="z.B. SF, EF, EWR, GF" />

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
            gefaesse={gefaesse.split(',').map(s => s.trim()).filter(Boolean)}
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

/** Inline-Editor für neuen Kurs */
function InlineKursEditor({ gefaesse, fachschaften, onSpeichern, onAbbrechen }: {
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
function InlineTextEditor({ label, felder, onSpeichern, onAbbrechen }: {
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
