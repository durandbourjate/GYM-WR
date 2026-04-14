import { useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useUebenKontext } from '../../hooks/ueben/useUebenKontext'
import { useThemenSichtbarkeitStore } from '../../store/ueben/themenSichtbarkeitStore'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { berechneSterne, sterneText, berechneStreak, berechneLevel, berechneMeilensteine } from '../../utils/ueben/gamification'
import { berechneMasteryMitRecency } from '../../utils/ueben/mastery'
import { getFachFarbe } from '../../utils/ueben/fachFarben'
import type { Frage } from '../../types/ueben/fragen'
import type { ThemenFortschritt } from '../../types/ueben/fortschritt'
import { useEffect, useState } from 'react'

interface ThemaAnalyse {
  fach: string
  thema: string
  fragen: Frage[]
  fortschritt: ThemenFortschritt
  istVerblasst: boolean
}

export default function SuSAnalyse() {
  const { aktiveGruppe } = useUebenGruppenStore()
  const { fortschritte, getThemenFortschritt } = useUebenFortschrittStore()
  const { fachFarben } = useUebenKontext()
  const { freischaltungen, getStatus } = useThemenSichtbarkeitStore()
  const [fragen, setFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState(false)
  // A7: Welche Themen sind expandiert (Key: "fach|thema")
  const [expandierteThemen, setExpandierteThemen] = useState<Set<string>>(new Set())
  const toggleThema = (key: string): void => {
    setExpandierteThemen(prev => {
      const neu = new Set(prev)
      if (neu.has(key)) neu.delete(key)
      else neu.add(key)
      return neu
    })
  }

  useEffect(() => {
    if (!aktiveGruppe) return
    let abgebrochen = false
    const lade = async () => {
      setLaden(true)
      setFehler(false)
      try {
        // Timeout: 15 Sekunden, dann Fehler anzeigen statt endlos laden
        const timeout = new Promise<Frage[]>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        const laden = uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
        const f = await Promise.race([laden, timeout])
        if (abgebrochen) return
        // Im Demo-Modus sind die Einrichtungs-Fragen der einzige Inhalt — nicht ausfiltern.
        const istDemo = useAuthStore.getState().istDemoModus
        setFragen(f.filter(fr => {
          if (istDemo) return true
          const tags = (fr.tags || []) as (string | { name: string })[]
          if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung')) return false
          return fr.thema !== 'Einrichtung' && fr.thema !== 'Einrichtungstest'
        }))
      } catch {
        if (!abgebrochen) setFehler(true)
      } finally {
        if (!abgebrochen) setLaden(false)
      }
    }
    lade()
    return () => { abgebrochen = true }
  }, [aktiveGruppe])

  // Themen-Analyse mit Recency
  const themenAnalyse = useMemo(() => {
    const themaMap: Record<string, { fach: string; fragen: Frage[] }> = {}
    for (const f of fragen) {
      const key = `${f.fach}|${f.thema}`
      if (!themaMap[key]) themaMap[key] = { fach: f.fach, fragen: [] }
      themaMap[key].fragen.push(f)
    }

    const ergebnis: ThemaAnalyse[] = []
    for (const [, { fach, fragen: tFragen }] of Object.entries(themaMap)) {
      const fortschritt = getThemenFortschritt(tFragen)

      // Recency prüfen: ältester Versuch im Thema
      let aeltesterVersuch = ''
      for (const f of tFragen) {
        const fp = fortschritte[f.id]
        if (fp?.letzterVersuch && (!aeltesterVersuch || fp.letzterVersuch < aeltesterVersuch)) {
          aeltesterVersuch = fp.letzterVersuch
        }
      }
      const { istVerblasst } = berechneMasteryMitRecency(
        fortschritt.quote >= 75 ? 'gemeistert' : fortschritt.quote >= 50 ? 'gefestigt' : 'ueben',
        aeltesterVersuch || undefined
      )

      ergebnis.push({ fach, thema: tFragen[0].thema, fragen: tFragen, fortschritt, istVerblasst })
    }

    // A7: Nur freigeschaltete Themen (aktiv + abgeschlossen). Wenn keine Freischaltungen konfiguriert: alle zeigen.
    const gefiltert = freischaltungen.length === 0
      ? ergebnis
      : ergebnis.filter(t => {
          const status = getStatus(t.fach, t.thema)
          return status !== 'nicht_freigeschaltet'
        })

    return gefiltert.sort((a, b) => a.fortschritt.quote - b.fortschritt.quote)
  }, [fragen, fortschritte, getThemenFortschritt, freischaltungen, getStatus])

  // Gesamt-Statistiken
  const stats = useMemo(() => {
    const fpWerte = Object.values(fortschritte)
    const gemeistert = fpWerte.filter(fp => fp.mastery === 'gemeistert').length
    const gefestigt = fpWerte.filter(fp => fp.mastery === 'gefestigt').length
    const versuche = fpWerte.reduce((s, fp) => s + fp.versuche, 0)
    const sessionDaten = fpWerte.flatMap(fp => fp.sessionIds || [])
    const streak = berechneStreak([...new Set(sessionDaten)])
    const themenAbgeschlossen = themenAnalyse.filter(t => t.fortschritt.quote >= 75).length
    const level = berechneLevel(gemeistert)
    const meilensteine = berechneMeilensteine({ gemeistert, gefestigt, versuche, streak, themenAbgeschlossen })

    return { gemeistert, gefestigt, versuche, streak, level, meilensteine, themenAbgeschlossen }
  }, [fortschritte, themenAnalyse])

  if (laden) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
      </div>
      <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
  )

  if (fehler) return (
    <div className="text-center py-8">
      <p className="text-slate-500 dark:text-slate-400 mb-2">Analyse konnte nicht geladen werden.</p>
      <button onClick={() => setLaden(true)} className="text-sm text-blue-500 hover:text-blue-600 cursor-pointer">Nochmal versuchen</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold dark:text-white">Mein Fortschritt</h3>

      {/* Übersicht: Level + Streak */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniKarte label="Level" wert={stats.level} icon="📈" />
        <MiniKarte label="Streak" wert={stats.streak} icon="🔥" />
        <MiniKarte label="Gemeistert" wert={stats.gemeistert} icon="⭐" />
        <MiniKarte label="Versuche" wert={stats.versuche} icon="✏️" />
      </div>

      {/* Meilensteine */}
      {stats.meilensteine.some(m => m.erreicht) && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Meilensteine</h4>
          <div className="flex flex-wrap gap-2">
            {stats.meilensteine.filter(m => m.erreicht).map(m => (
              <span key={m.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium dark:text-slate-300" title={m.titel}>
                {m.icon} {m.titel}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Themen-Übersicht (schwächste zuerst) — A7: ausklappbar mit Fehler-Details */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Themen (schwächste zuerst)</h4>
        {themenAnalyse.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">Noch keine freigeschalteten Themen geübt.</p>
        ) : (
          <div className="space-y-1">
            {themenAnalyse.map(t => {
              const key = `${t.fach}|${t.thema}`
              const farbe = getFachFarbe(t.fach, fachFarben)
              const sterne = berechneSterne(t.fortschritt.quote)
              const expandiert = expandierteThemen.has(key)
              // Schwächste Fragen: quote=0 oder zuletzt falsch, sortiert nach Fehlerquote desc
              const fragenMitFehlern = t.fragen
                .map(f => {
                  const fp = fortschritte[f.id]
                  if (!fp || fp.versuche === 0) return null
                  const fehlerquote = 1 - (fp.richtig / fp.versuche)
                  return { frage: f, fp, fehlerquote }
                })
                .filter((x): x is NonNullable<typeof x> => x !== null && x.fehlerquote > 0)
                .sort((a, b) => b.fehlerquote - a.fehlerquote)
                .slice(0, 5)
              return (
                <div key={key} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleThema(key)}
                    className="w-full flex items-center justify-between py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded transition-colors cursor-pointer"
                    aria-expanded={expandiert}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-slate-400 transition-transform shrink-0 ${expandiert ? 'rotate-90' : ''}`}>▸</span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: farbe }} />
                      <div className="min-w-0">
                        <span className="text-sm font-medium dark:text-white">{t.thema}</span>
                        {t.istVerblasst && (
                          <span className="ml-2 text-[10px] text-amber-500 dark:text-amber-400" title="Lange nicht geübt">
                            Lange nicht geübt
                          </span>
                        )}
                        <div className="text-xs text-slate-400">{t.fach} · {t.fortschritt.gesamt} Fragen</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <MiniBar quote={t.fortschritt.quote} />
                      <span className="text-xs w-8 text-right">{sterneText(sterne)}</span>
                    </div>
                  </button>
                  {expandiert && (
                    <div className="pl-10 pr-2 pb-3 pt-1 text-xs space-y-2">
                      {fragenMitFehlern.length === 0 ? (
                        <p className="text-slate-400 dark:text-slate-500 italic">
                          Noch keine Fehler in diesem Thema — weiter so!
                        </p>
                      ) : (
                        <>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Schwierigste Fragen:
                          </p>
                          <ul className="space-y-1.5">
                            {fragenMitFehlern.map(({ frage, fp, fehlerquote }) => {
                              const fragetext = (frage as { fragetext?: string }).fragetext || (frage as { text?: string }).text || ''
                              const vorschau = fragetext.slice(0, 80) + (fragetext.length > 80 ? '…' : '')
                              return (
                                <li key={frage.id} className="flex items-start gap-2">
                                  <span
                                    className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                                      fehlerquote >= 0.66 ? 'bg-red-400' : fehlerquote >= 0.33 ? 'bg-amber-400' : 'bg-slate-300'
                                    }`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-slate-700 dark:text-slate-300 truncate">{vorschau || '(kein Fragetext)'}</div>
                                    <div className="text-[10px] text-slate-400">
                                      {Math.round(fehlerquote * 100)}% falsch · {fp.richtig}/{fp.versuche} richtig
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniKarte({ label, wert, icon }: { label: string; wert: number | string; icon: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
      <div className="text-lg mb-0.5">{icon}</div>
      <div className="text-xl font-bold dark:text-white">{wert}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  )
}

function MiniBar({ quote }: { quote: number }) {
  const pct = Math.round(quote)
  const farbe = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-400' : pct >= 25 ? 'bg-yellow-400' : 'bg-slate-300'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div className={`${farbe} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-7 text-right">{pct}%</span>
    </div>
  )
}
