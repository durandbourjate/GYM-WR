import { useEffect, useMemo, useState } from 'react'
import { useThemenSichtbarkeitStore } from '../../../store/ueben/themenSichtbarkeitStore'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { useUebenAuthStore } from '../../../store/ueben/authStore'
import { useUebenFortschrittStore } from '../../../store/ueben/fortschrittStore'
import { uebenFragenAdapter } from '../../../adapters/ueben/appsScriptAdapter'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'
import { useUebenKontext } from '../../../hooks/ueben/useUebenKontext'
import { LernzieleMiniModal } from '../LernzieleAkkordeon'
import { useUebenSettingsStore } from '../../../store/ueben/settingsStore'
import type { ThemenStatus } from '../../../types/ueben/themenSichtbarkeit'
import type { Frage } from '../../../types/ueben/fragen'

interface ThemaEintrag {
  fach: string
  thema: string
  anzahlFragen: number
  anzahlLernziele: number
  unterthemen: { name: string; anzahl: number }[]
  status: ThemenStatus
}

export default function AdminThemensteuerung() {
  const { aktiveGruppe } = useUebenGruppenStore()
  const { user } = useUebenAuthStore()
  const { freischaltungen, ladeFreischaltungen, setzeStatus, getStatus, getAktiveThemen, getAktiveUnterthemen, setzeUnterthemen } = useThemenSichtbarkeitStore()
  const { fachFarben } = useUebenKontext()
  const maxAktiveThemen = useUebenSettingsStore(s => s.einstellungen?.maxAktiveThemen ?? 5)
  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)
  const [filterFach, setFilterFach] = useState<string | null>(null)
  const [ausgeklappt, setAusgeklappt] = useState<Set<string>>(new Set())
  const [kopiert, setKopiert] = useState<string | null>(null)
  const [lzModal, setLzModal] = useState<{ fach: string; thema: string } | null>(null)

  // Lernziele
  const { lernziele, ladeLernziele } = useUebenFortschrittStore()

  useEffect(() => {
    if (!aktiveGruppe) return
    ladeFreischaltungen(aktiveGruppe.id)
    ladeLernziele(aktiveGruppe.id)
    const ladeFragen = async () => {
      setLaden(true)
      const fragen = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      setAlleFragen(fragen)
      setLaden(false)
    }
    ladeFragen()
  }, [aktiveGruppe, ladeFreischaltungen, ladeLernziele])

  const themen = useMemo(() => {
    const map: Record<string, ThemaEintrag> = {}
    for (const f of alleFragen) {
      const tags = (f.tags || []) as (string | { name: string })[]
      if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung')) continue
      if (f.thema === 'Einrichtung' || f.thema === 'Einrichtungstest') continue

      const fach = f.fach || 'Andere'
      const thema = f.thema || 'Allgemein'
      const key = `${fach}::${thema}`
      if (!map[key]) {
        const lzAnzahl = lernziele.filter(lz => lz.aktiv !== false && lz.fach === fach && (lz.thema === thema || lz.thema?.includes(thema) || thema?.includes(lz.thema))).length
        map[key] = { fach, thema, anzahlFragen: 0, anzahlLernziele: lzAnzahl, unterthemen: [], status: getStatus(fach, thema) }
      }
      map[key].anzahlFragen++

      const ut = (f as { unterthema?: string }).unterthema
      if (ut) {
        const existing = map[key].unterthemen.find(u => u.name === ut)
        if (existing) existing.anzahl++
        else map[key].unterthemen.push({ name: ut, anzahl: 1 })
      }
    }
    return Object.values(map).sort((a, b) => {
      const rang: Record<ThemenStatus, number> = { aktiv: 0, abgeschlossen: 1, nicht_freigeschaltet: 2 }
      const diff = rang[a.status] - rang[b.status]
      if (diff !== 0) return diff
      return a.fach.localeCompare(b.fach) || a.thema.localeCompare(b.thema)
    })
  }, [alleFragen, getStatus, freischaltungen, lernziele])

  const faecher = useMemo(() => [...new Set(themen.map(t => t.fach))].sort(), [themen])
  const gefilterteThemen = filterFach ? themen.filter(t => t.fach === filterFach) : themen
  const aktiveAnzahl = getAktiveThemen().length

  const handleStatusAendern = async (fach: string, thema: string, neuerStatus: ThemenStatus) => {
    if (!aktiveGruppe || !user) return
    await setzeStatus(aktiveGruppe.id, fach, thema, neuerStatus, user.email, 'manuell')
  }

  const toggleAusgeklappt = (key: string) => {
    setAusgeklappt(prev => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }

  const erzeugeDeepLink = (fach: string, thema: string, unterthema?: string) => {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/Ueben/')
    const params = new URLSearchParams({ fach, thema })
    if (unterthema) params.set('unterthema', unterthema)
    return `${base}?${params.toString()}`
  }

  const kopiereLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setKopiert(id)
      setTimeout(() => setKopiert(null), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setKopiert(id)
      setTimeout(() => setKopiert(null), 2000)
    }
  }

  if (laden) return <p className="text-slate-500">Themen werden geladen...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Themensteuerung</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Aktivierte Themen werden im SuS-Dashboard hervorgehoben. Max. {maxAktiveThemen} gleichzeitig aktiv.
          </p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          aktiveAnzahl >= maxAktiveThemen
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
        }`}>
          {aktiveAnzahl}/{maxAktiveThemen} aktiv
        </span>
      </div>

      {/* Fach-Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterFach(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !filterFach
              ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-800'
              : 'text-slate-500 border-slate-300 dark:border-slate-600 hover:border-slate-400'
          }`}
        >
          Alle
        </button>
        {faecher.map(fach => {
          const farbe = getFachFarbe(fach, fachFarben)
          return (
            <button
              key={fach}
              onClick={() => setFilterFach(filterFach === fach ? null : fach)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={filterFach === fach
                ? { backgroundColor: farbe, color: '#fff', borderColor: farbe }
                : { borderColor: '#d1d5db', color: farbe }
              }
            >
              {fach}
            </button>
          )
        })}
      </div>

      {/* Themen-Liste */}
      <div className="space-y-2">
        {gefilterteThemen.map(eintrag => {
          const farbe = getFachFarbe(eintrag.fach, fachFarben)
          const key = `${eintrag.fach}::${eintrag.thema}`
          const istOffen = ausgeklappt.has(key)
          const hatUnterthemen = eintrag.unterthemen.length > 0

          return (
            <div key={key} className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden${eintrag.status === 'nicht_freigeschaltet' ? ' opacity-70' : ''}`}>
              {/* Thema-Zeile */}
              <div
                className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800 transition-colors ${
                  eintrag.status === 'aktiv' ? 'border-l-4' : ''
                }`}
                style={eintrag.status === 'aktiv' ? { borderLeftColor: farbe } : undefined}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Aufklapp-Pfeil */}
                  {hatUnterthemen ? (
                    <button
                      onClick={() => toggleAusgeklappt(key)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-5 text-center shrink-0"
                    >
                      {istOffen ? '▾' : '▸'}
                    </button>
                  ) : (
                    <span className="w-5" />
                  )}
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: farbe }} />
                  <div className="min-w-0">
                    <span className="font-medium text-sm dark:text-white">{eintrag.status === 'nicht_freigeschaltet' && <span className="mr-1">🔒</span>}{eintrag.thema}</span>
                    <div className="text-xs text-slate-400">
                      {eintrag.fach} · {eintrag.anzahlFragen} Fragen
                      {hatUnterthemen && ` · ${eintrag.unterthemen.length} Unterthemen`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Lernziele */}
                  {eintrag.anzahlLernziele > 0 && (
                    <button
                      onClick={() => setLzModal({ fach: eintrag.fach, thema: eintrag.thema })}
                      className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-slate-400 transition-colors"
                      title={`${eintrag.anzahlLernziele} Lernziele`}
                    >
                      🏁 {eintrag.anzahlLernziele}
                    </button>
                  )}
                  {eintrag.anzahlLernziele === 0 && (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 px-2" title="Keine Lernziele definiert">
                      —
                    </span>
                  )}

                  {/* Deep-Link kopieren */}
                  <button
                    onClick={() => kopiereLink(erzeugeDeepLink(eintrag.fach, eintrag.thema), key)}
                    className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-slate-400 transition-colors"
                    title="Deep-Link kopieren"
                  >
                    {kopiert === key ? '✓ Kopiert' : '🔗 Link'}
                  </button>

                  {/* Status-Badge — "z.T. aktuell" wenn nur einige Unterthemen */}
                  {(() => {
                    const aktiveUT = getAktiveUnterthemen(eintrag.fach, eintrag.thema)
                    const istPartiell = eintrag.status === 'aktiv' && aktiveUT && aktiveUT.length > 0 && aktiveUT.length < eintrag.unterthemen.length
                    if (eintrag.status !== 'aktiv' && eintrag.status !== 'abgeschlossen') return null
                    return (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        eintrag.status === 'aktiv'
                          ? (istPartiell
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300')
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {eintrag.status === 'aktiv'
                          ? (istPartiell ? 'z.T. aktuell' : 'Aktuell')
                          : 'Freigegeben'}
                      </span>
                    )
                  })()}

                  {/* Aktions-Buttons */}
                  {eintrag.status === 'nicht_freigeschaltet' && (
                    <button
                      onClick={() => handleStatusAendern(eintrag.fach, eintrag.thema, 'aktiv')}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-white min-h-[36px] transition-colors hover:opacity-90"
                      style={{ backgroundColor: farbe }}
                    >
                      Aktivieren
                    </button>
                  )}
                  {eintrag.status === 'aktiv' && (
                    <>
                      <button
                        onClick={() => handleStatusAendern(eintrag.fach, eintrag.thema, 'abgeschlossen')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 min-h-[36px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Abschliessen
                      </button>
                      <button
                        onClick={() => handleStatusAendern(eintrag.fach, eintrag.thema, 'nicht_freigeschaltet')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 min-h-[36px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        title="Aktivierung rückgängig — Thema ist für SuS nicht mehr sichtbar"
                      >
                        Deaktivieren
                      </button>
                    </>
                  )}
                  {eintrag.status === 'abgeschlossen' && (
                    <button
                      onClick={() => handleStatusAendern(eintrag.fach, eintrag.thema, 'nicht_freigeschaltet')}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600 min-h-[36px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      title="Thema wieder sperren"
                    >
                      Deaktivieren
                    </button>
                  )}
                </div>
              </div>

              {/* Unterthemen (ausgeklappt) — mit Checkboxen zur granularen Aktivierung */}
              {istOffen && hatUnterthemen && (() => {
                const aktiveUT = getAktiveUnterthemen(eintrag.fach, eintrag.thema)
                const alleAktiv = !aktiveUT || aktiveUT.length === 0
                const themaIstAktivOderAbgeschlossen = eintrag.status === 'aktiv' || eintrag.status === 'abgeschlossen'

                const toggleUnterthema = async (utName: string) => {
                  if (!aktiveGruppe || !user) return

                  // Thema automatisch aktivieren wenn es noch nicht freigeschaltet ist
                  if (!themaIstAktivOderAbgeschlossen) {
                    await setzeStatus(aktiveGruppe.id, eintrag.fach, eintrag.thema, 'aktiv', user.email, 'manuell')
                    // Nur dieses Unterthema aktiv setzen
                    setzeUnterthemen(aktiveGruppe.id, eintrag.fach, eintrag.thema, [utName])
                    return
                  }

                  if (alleAktiv) {
                    // Alle waren aktiv → alle ausser dieses deaktivieren
                    const alle = eintrag.unterthemen.map(u => u.name).filter(n => n !== utName)
                    setzeUnterthemen(aktiveGruppe.id, eintrag.fach, eintrag.thema, alle)
                  } else {
                    const istAktiv = aktiveUT!.includes(utName)
                    if (istAktiv) {
                      // Deaktivieren
                      const neueUT = aktiveUT!.filter(n => n !== utName)
                      setzeUnterthemen(aktiveGruppe.id, eintrag.fach, eintrag.thema, neueUT.length > 0 ? neueUT : undefined)
                    } else {
                      // Aktivieren
                      const neueUT = [...aktiveUT!, utName]
                      // Wenn alle Unterthemen aktiv → undefined (= alle)
                      const alleNamen = eintrag.unterthemen.map(u => u.name)
                      const sindAlle = alleNamen.every(n => neueUT.includes(n))
                      setzeUnterthemen(aktiveGruppe.id, eintrag.fach, eintrag.thema, sindAlle ? undefined : neueUT)
                    }
                  }
                }

                return (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-700">
                    {eintrag.unterthemen.sort((a, b) => a.name.localeCompare(b.name)).map(ut => {
                      const utKey = `${key}::${ut.name}`
                      const istChecked = alleAktiv || (aktiveUT?.includes(ut.name) ?? false)
                      return (
                        <div key={ut.name} className="flex items-center justify-between px-4 py-2.5 pl-14">
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={themaIstAktivOderAbgeschlossen && istChecked}
                              onChange={() => toggleUnterthema(ut.name)}
                              className="rounded border-slate-300 dark:border-slate-600 text-slate-600 focus:ring-slate-500"
                            />
                            <span className={`text-sm ${themaIstAktivOderAbgeschlossen && istChecked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{ut.name}</span>
                            <span className="text-xs text-slate-400">{ut.anzahl} Fragen</span>
                          </label>
                          <button
                            onClick={() => kopiereLink(erzeugeDeepLink(eintrag.fach, eintrag.thema, ut.name), utKey)}
                            className="text-xs px-2 py-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-slate-400 transition-colors"
                            title={`Deep-Link für ${ut.name} kopieren`}
                          >
                            {kopiert === utKey ? '✓ Kopiert' : '🔗'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )
        })}

        {gefilterteThemen.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">Keine Themen gefunden.</p>
        )}
      </div>

      {/* Lernziele-Modal */}
      {lzModal && (
        <LernzieleMiniModal
          thema={lzModal.thema}
          fach={lzModal.fach}
          lernziele={lernziele}
          fortschritte={{}}
          onSchliessen={() => setLzModal(null)}
          onUeben={() => setLzModal(null)}
        />
      )}
    </div>
  )
}
