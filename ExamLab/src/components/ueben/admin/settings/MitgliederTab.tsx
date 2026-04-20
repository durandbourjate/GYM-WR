import { useState } from 'react'
import { useUebenGruppenStore } from '../../../../store/ueben/gruppenStore'
import { uebenGruppenAdapter } from '../../../../adapters/ueben/appsScriptAdapter'

export default function MitgliederTab() {
  const { aktiveGruppe, mitglieder } = useUebenGruppenStore()
  const [einladenEmail, setEinladenEmail] = useState('')
  const [einladenRolle, setEinladenRolle] = useState<'admin' | 'lernend'>('lernend')
  const [einladenStatus, setEinladenStatus] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [einladenFehler, setEinladenFehler] = useState('')
  const [generierteKodes, setGenerierteKodes] = useState<Record<string, string>>({})
  const [kodeStatus, setKodeStatus] = useState<Record<string, 'laden' | 'fehler'>>({})
  const [rolleStatus, setRolleStatus] = useState<Record<string, 'laden' | 'fehler' | 'ok'>>({})
  const [rolleFehler, setRolleFehler] = useState<Record<string, string>>({})

  if (!aktiveGruppe) {
    return <p className="text-sm text-slate-400">Keine Gruppe aktiv.</p>
  }

  const refreshMitglieder = () => {
    useUebenGruppenStore.getState().waehleGruppe(aktiveGruppe.id)
  }

  const handleEntfernen = async (email: string, name: string) => {
    if (!window.confirm(`Wirklich entfernen: ${name} (${email})?`)) return
    try {
      await uebenGruppenAdapter.entfernen(aktiveGruppe.id, email)
      refreshMitglieder()
    } catch {
      alert('Entfernen fehlgeschlagen.')
    }
  }

  const handleEinladen = async () => {
    const email = einladenEmail.trim()
    if (!email) return
    setEinladenStatus('laden')
    setEinladenFehler('')
    try {
      await uebenGruppenAdapter.einladen(aktiveGruppe.id, email, '', einladenRolle)
      setEinladenEmail('')
      setEinladenRolle('lernend')
      setEinladenStatus('ok')
      refreshMitglieder()
      setTimeout(() => setEinladenStatus('idle'), 2000)
    } catch (e) {
      setEinladenFehler(e instanceof Error ? e.message : 'Einladen fehlgeschlagen')
      setEinladenStatus('fehler')
    }
  }

  const handleKodeGenerieren = async (email: string) => {
    setKodeStatus(prev => ({ ...prev, [email]: 'laden' }))
    try {
      const code = await uebenGruppenAdapter.generiereCode(aktiveGruppe.id, email)
      setGenerierteKodes(prev => ({ ...prev, [email]: code }))
      setKodeStatus(prev => {
        const next = { ...prev }
        delete next[email]
        return next
      })
    } catch {
      setKodeStatus(prev => ({ ...prev, [email]: 'fehler' }))
    }
  }

  const handleRolleAendern = async (email: string, neueRolle: 'admin' | 'lernend') => {
    setRolleStatus(prev => ({ ...prev, [email]: 'laden' }))
    setRolleFehler(prev => { const n = { ...prev }; delete n[email]; return n })
    try {
      await uebenGruppenAdapter.aendereRolle(aktiveGruppe.id, email, neueRolle)
      setRolleStatus(prev => ({ ...prev, [email]: 'ok' }))
      refreshMitglieder()
      setTimeout(() => setRolleStatus(prev => { const n = { ...prev }; delete n[email]; return n }), 2000)
    } catch (e) {
      setRolleFehler(prev => ({ ...prev, [email]: e instanceof Error ? e.message : 'Fehler' }))
      setRolleStatus(prev => ({ ...prev, [email]: 'fehler' }))
    }
  }

  const adminAnzahl = mitglieder.filter(m => m.rolle === 'admin').length
  const istFamilie = aktiveGruppe.typ === 'familie'

  return (
    <div className="space-y-6">
      {/* Mitgliederliste */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {mitglieder.length === 0 && (
          <p className="text-sm text-slate-400 p-4">Keine Mitglieder gefunden.</p>
        )}
        {mitglieder.map((m) => {
          const istAdmin = m.rolle === 'admin'
          return (
            <div key={m.email} className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <div className="flex-1 min-w-0">
                <p className="font-medium dark:text-white truncate">{m.name}</p>
                <p className="text-xs text-slate-400 truncate">{m.email}</p>
                {generierteKodes[m.email] && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Code: <span className="font-mono font-bold">{generierteKodes[m.email]}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Rollen-Dropdown — "Letzte Kurs-Leitung" darf nicht herabgestuft werden */}
                {rolleStatus[m.email] === 'laden' ? (
                  <span className="text-xs text-slate-400 px-2">…</span>
                ) : (
                  <select
                    value={m.rolle}
                    onChange={(e) => {
                      const neueRolle = e.target.value as 'admin' | 'lernend'
                      if (neueRolle === m.rolle) return
                      if (istAdmin && adminAnzahl <= 1 && neueRolle === 'lernend') return
                      handleRolleAendern(m.email, neueRolle)
                    }}
                    disabled={istAdmin && adminAnzahl <= 1}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-slate-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    title={istAdmin && adminAnzahl <= 1 ? 'Letzte Kurs-Leitung — Rolle kann nicht geändert werden' : 'Rolle ändern'}
                  >
                    <option value="admin">Kurs-Leitung</option>
                    <option value="lernend">Lernend</option>
                  </select>
                )}
                {rolleStatus[m.email] === 'ok' && <span className="text-xs text-green-500">✓</span>}
                {rolleFehler[m.email] && <span className="text-xs text-red-500">{rolleFehler[m.email]}</span>}

                {/* Code generieren (nur Familie, nur nicht-Admin) */}
                {istFamilie && !istAdmin && (
                  <button
                    onClick={() => handleKodeGenerieren(m.email)}
                    disabled={kodeStatus[m.email] === 'laden'}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px] px-2 disabled:opacity-50"
                  >
                    {kodeStatus[m.email] === 'laden' ? '…' : kodeStatus[m.email] === 'fehler' ? 'Fehler' : 'Code'}
                  </button>
                )}

                {/* Entfernen (nur nicht-Admin) */}
                {!istAdmin && (
                  <button
                    onClick={() => handleEntfernen(m.email, m.name)}
                    className="text-xs text-red-400 hover:text-red-600 min-h-[44px] px-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Einladen */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 space-y-3">
        <p className="text-sm font-medium dark:text-white">Mitglied einladen</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={einladenEmail}
            onChange={(e) => setEinladenEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEinladen() }}
            placeholder="E-Mail-Adresse"
            className="flex-1 min-w-0 p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-slate-500 text-sm"
          />
          <select
            value={einladenRolle}
            onChange={(e) => setEinladenRolle(e.target.value as 'admin' | 'lernend')}
            className="text-sm px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-slate-500 cursor-pointer shrink-0"
            title="Rolle beim Einladen"
          >
            <option value="lernend">Lernend</option>
            <option value="admin">Kurs-Leitung</option>
          </select>
          <button
            onClick={handleEinladen}
            disabled={!einladenEmail.trim() || einladenStatus === 'laden'}
            className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 px-4 rounded-lg text-sm font-medium min-h-[44px] disabled:opacity-50 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
          >
            {einladenStatus === 'laden' ? '…' : 'Einladen'}
          </button>
        </div>
        {einladenStatus === 'ok' && (
          <p className="text-sm text-green-600 dark:text-green-400">Einladung gesendet.</p>
        )}
        {einladenStatus === 'fehler' && (
          <p className="text-sm text-red-500">{einladenFehler}</p>
        )}
      </div>
    </div>
  )
}
