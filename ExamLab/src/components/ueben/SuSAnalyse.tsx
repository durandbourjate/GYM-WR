import { useMemo } from 'react'
import { useUebenFortschrittStore } from '../../store/ueben/fortschrittStore'
import { useUebenGruppenStore } from '../../store/ueben/gruppenStore'
import { useUebenKontext } from '../../hooks/ueben/useUebenKontext'
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
  fortschritt: ThemenFortschritt
  istVerblasst: boolean
}

export default function SuSAnalyse() {
  const { aktiveGruppe } = useUebenGruppenStore()
  const { fortschritte, getThemenFortschritt } = useUebenFortschrittStore()
  const { fachFarben } = useUebenKontext()
  const [fragen, setFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState(false)

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
        setFragen(f.filter(fr => {
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

      ergebnis.push({ fach, thema: tFragen[0].thema, fortschritt, istVerblasst })
    }

    return ergebnis.sort((a, b) => a.fortschritt.quote - b.fortschritt.quote)
  }, [fragen, fortschritte, getThemenFortschritt])

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

      {/* Themen-Übersicht (schwächste zuerst) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Themen (schwächste zuerst)</h4>
        <div className="space-y-2">
          {themenAnalyse.map(t => {
            const farbe = getFachFarbe(t.fach, fachFarben)
            const sterne = berechneSterne(t.fortschritt.quote)
            return (
              <div key={`${t.fach}-${t.thema}`} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: farbe }} />
                  <div>
                    <span className="text-sm font-medium dark:text-white">{t.thema}</span>
                    {t.istVerblasst && (
                      <span className="ml-2 text-[10px] text-amber-500 dark:text-amber-400" title="Lange nicht geübt">
                        Lange nicht geübt
                      </span>
                    )}
                    <div className="text-xs text-slate-400">{t.fach} · {t.fortschritt.gesamt} Fragen</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MiniBar quote={t.fortschritt.quote} />
                  <span className="text-xs w-8 text-right">{sterneText(sterne)}</span>
                </div>
              </div>
            )
          })}
        </div>
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
