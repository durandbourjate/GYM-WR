import { useEffect, useMemo, useState } from 'react'
import { useUebenFortschrittStore } from '../../../store/ueben/fortschrittStore'
import { istDauerbaustelle } from '../../../utils/ueben/mastery'
import { uebenFragenAdapter } from '../../../adapters/ueben/appsScriptAdapter'
import type { Frage } from '../../../types/ueben/fragen'

interface Props {
  gruppeId: string
  email: string
  name: string
  onThemaKlick: (fach: string, thema: string) => void
}

export default function AdminKindDetail({ gruppeId, email, name, onThemaKlick }: Props) {
  const { ladeGruppenFortschritt } = useUebenFortschrittStore()
  const [fragen, setFragen] = useState<Frage[]>([])

  useEffect(() => {
    ladeGruppenFortschritt(gruppeId)
    uebenFragenAdapter.ladeFragen(gruppeId).then(setFragen).catch(() => {})
  }, [gruppeId, ladeGruppenFortschritt])

  const fortschritte = useUebenFortschrittStore(s => s.getFortschrittFuerSuS(gruppeId, email))
  const sessions = useUebenFortschrittStore(s => s.getSessionsFuerSuS(gruppeId, email))

  // Fragen-Lookup
  const fragenMap = useMemo(() => {
    const map: Record<string, Frage> = {}
    for (const f of fragen) map[f.id] = f
    return map
  }, [fragen])

  // Letzte 7 Tage
  const siebeTage = useMemo(() => {
    const grenze = new Date()
    grenze.setDate(grenze.getDate() - 7)
    return sessions.filter(s => new Date(s.datum) >= grenze)
  }, [sessions])

  // Dauerbaustellen
  const dauerbaustellen = useMemo(() =>
    fortschritte.filter(fp => istDauerbaustelle(fp.versuche, fp.richtig)),
  [fortschritte])

  // Mastery nach Fach -> Thema
  const fachThemen = useMemo(() => {
    const result: Record<string, Record<string, { gesamt: number; gemeistert: number; gefestigt: number; ueben: number; neu: number }>> = {}
    for (const fp of fortschritte) {
      const frage = fragenMap[fp.fragenId]
      if (!frage) continue
      const { fach, thema } = frage
      if (!result[fach]) result[fach] = {}
      if (!result[fach][thema]) result[fach][thema] = { gesamt: 0, gemeistert: 0, gefestigt: 0, ueben: 0, neu: 0 }
      result[fach][thema].gesamt++
      switch (fp.mastery) {
        case 'gemeistert': result[fach][thema].gemeistert++; break
        case 'gefestigt': result[fach][thema].gefestigt++; break
        case 'ueben': result[fach][thema].ueben++; break
        default: result[fach][thema].neu++; break
      }
    }
    return result
  }, [fortschritte, fragenMap])

  const gesamtFragen = siebeTage.reduce((s, ses) => s + ses.anzahlFragen, 0)
  const gesamtRichtig = siebeTage.reduce((s, ses) => s + ses.richtig, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold dark:text-white">{name}</h2>

      {/* Session-Statistik letzte 7 Tage */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold mb-3 dark:text-white">Letzte 7 Tage</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold dark:text-white">{siebeTage.length}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">Sessions</span>
          </div>
          <div>
            <span className="text-2xl font-bold dark:text-white">{gesamtFragen}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">Fragen</span>
          </div>
          <div>
            <span className="text-2xl font-bold dark:text-white">
              {gesamtFragen > 0 ? Math.round((gesamtRichtig / gesamtFragen) * 100) : 0}%
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-1">richtig</span>
          </div>
        </div>
      </div>

      {/* Dauerbaustellen */}
      {dauerbaustellen.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-5">
          <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Dauerbaustellen</h3>
          <div className="space-y-1">
            {dauerbaustellen.map(fp => {
              const frage = fragenMap[fp.fragenId]
              return (
                <div key={fp.fragenId} className="text-sm text-yellow-700 dark:text-yellow-300">
                  {frage ? `${frage.fach} — ${frage.thema}` : fp.fragenId}: {fp.richtig}/{fp.versuche} richtig ({Math.round((fp.richtig / fp.versuche) * 100)}%)
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Themen nach Fach */}
      {Object.entries(fachThemen).map(([fach, themen]) => (
        <div key={fach}>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">{fach}</h3>
          <div className="space-y-2">
            {Object.entries(themen).map(([thema, stats]) => {
              const quote = stats.gesamt > 0 ? ((stats.gemeistert + stats.gefestigt) / stats.gesamt) * 100 : 0
              return (
                <button
                  key={thema}
                  onClick={() => onThemaKlick(fach, thema)}
                  className="w-full text-left bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium dark:text-white">{thema}</span>
                    <span className="text-sm text-slate-500">{Math.round(quote)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
                    {stats.gemeistert > 0 && <div className="bg-green-500 h-2" style={{ width: `${(stats.gemeistert / stats.gesamt) * 100}%` }} />}
                    {stats.gefestigt > 0 && <div className="bg-blue-400 h-2" style={{ width: `${(stats.gefestigt / stats.gesamt) * 100}%` }} />}
                    {stats.ueben > 0 && <div className="bg-yellow-400 h-2" style={{ width: `${(stats.ueben / stats.gesamt) * 100}%` }} />}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-slate-400">
                    {stats.gemeistert > 0 && <span className="text-green-600">{stats.gemeistert} gemeistert</span>}
                    {stats.gefestigt > 0 && <span className="text-blue-500">{stats.gefestigt} gefestigt</span>}
                    {stats.ueben > 0 && <span className="text-yellow-600">{stats.ueben} ueben</span>}
                    {stats.neu > 0 && <span>{stats.neu} neu</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Leer-Zustand */}
      {fortschritte.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">&#128203;</p>
          <p>Noch keine Uebungsdaten vorhanden.</p>
        </div>
      )}

      {/* Session-Historie */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 dark:text-white">Sessions</h3>
          <div className="space-y-2">
            {[...sessions].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime()).slice(0, 20).map((ses) => (
              <div key={ses.sessionId} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <div>
                  <span className="font-medium dark:text-white">{ses.fach} — {ses.thema}</span>
                  <span className="text-sm text-slate-400 ml-2">{new Date(ses.datum).toLocaleDateString('de-CH')}</span>
                </div>
                <span className={`font-medium ${ses.anzahlFragen > 0 && ses.richtig / ses.anzahlFragen >= 0.7 ? 'text-green-600' : ses.anzahlFragen > 0 && ses.richtig / ses.anzahlFragen >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {ses.richtig}/{ses.anzahlFragen}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
