import { useEffect, useMemo } from 'react'
import { useUebenFortschrittStore } from '../../../store/ueben/fortschrittStore'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { uebenFragenAdapter } from '../../../adapters/ueben/appsScriptAdapter'
import { useUebenKontext } from '../../../hooks/ueben/useUebenKontext'
import { useState } from 'react'
import type { Frage } from '../../../types/ueben/fragen'
import KursHeatmap from './analyse/KursHeatmap'
import KlassenLuecken from './analyse/KlassenLuecken'
import SuSUebersicht from './analyse/SuSUebersicht'

interface AnalyseDashboardProps {
  onSuSKlick?: (email: string, name: string) => void
}

export default function AnalyseDashboard({ onSuSKlick }: AnalyseDashboardProps) {
  const { aktiveGruppe, mitglieder } = useUebenGruppenStore()
  const { gruppenFortschritt, gruppenSessions, ladeGruppenFortschritt } = useUebenFortschrittStore()
  const { fachFarben } = useUebenKontext()
  const [fragen, setFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(true)

  const gruppeId = aktiveGruppe?.id || ''

  useEffect(() => {
    if (!gruppeId) return
    ladeGruppenFortschritt(gruppeId)
    const ladeFragen = async () => {
      setLaden(true)
      const f = await uebenFragenAdapter.ladeFragen(gruppeId)
      setFragen(f.filter(fr => {
        const tags = (fr.tags || []) as (string | { name: string })[]
        if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung')) return false
        if (fr.thema === 'Einrichtung' || fr.thema === 'Einrichtungstest') return false
        return true
      }))
      setLaden(false)
    }
    ladeFragen()
  }, [gruppeId, ladeGruppenFortschritt])

  const fortschritte = gruppenFortschritt[gruppeId] || []
  const sessions = gruppenSessions[gruppeId] || []

  const mitgliederNamen = useMemo(() => {
    const map: Record<string, string> = {}
    for (const m of mitglieder) {
      if (m.rolle === 'lernend') map[m.email] = m.name
    }
    return map
  }, [mitglieder])

  const lernendeMitglieder = mitglieder.filter(m => m.rolle === 'lernend')

  // Übersichts-Zahlen
  const stats = useMemo(() => {
    const aktiveSuS = new Set(fortschritte.map(fp => fp.email)).size
    const siebeTage = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recentSessions = sessions.filter(s => new Date(s.datum).getTime() > siebeTage).length

    let totalScore = 0
    let totalFragen = 0
    for (const fp of fortschritte) {
      totalFragen++
      switch (fp.mastery) {
        case 'gemeistert': totalScore += 100; break
        case 'gefestigt': totalScore += 75; break
        case 'ueben': totalScore += 25; break
      }
    }
    const avgMastery = totalFragen > 0 ? Math.round(totalScore / totalFragen) : 0

    return { aktiveSuS, recentSessions, avgMastery }
  }, [fortschritte, sessions])

  if (laden) {
    return <div className="p-6 text-slate-500">Analyse wird geladen...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Analyse</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Übungsfortschritt und Lernstatistiken · {aktiveGruppe?.name}
        </p>
      </div>

      {/* Übersichts-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatKarte label="Aktive Lernende" wert={stats.aktiveSuS} total={lernendeMitglieder.length} />
        <StatKarte label="Sessions (letzte 7 Tage)" wert={stats.recentSessions} />
        <StatKarte label="Ø Mastery-Quote" wert={`${stats.avgMastery}%`} />
      </div>

      {/* Heatmap */}
      <Sektion titel="Kurs-Heatmap" beschreibung="Mastery pro SuS und Thema">
        <KursHeatmap
          fragen={fragen}
          fortschritte={fortschritte}
          mitgliederNamen={mitgliederNamen}
          onSuSKlick={onSuSKlick}
        />
      </Sektion>

      {/* Klassenweite Lücken */}
      <Sektion titel="Klassenweite Lücken" beschreibung="Themen wo >50% der SuS unter 'gefestigt' sind">
        <KlassenLuecken
          fragen={fragen}
          fortschritte={fortschritte}
          anzahlSuS={lernendeMitglieder.length}
          fachFarben={fachFarben}
        />
      </Sektion>

      {/* SuS-Übersicht */}
      <Sektion titel="Lernende" beschreibung="Sortierbare Übersicht aller Mitglieder">
        <SuSUebersicht
          fortschritte={fortschritte}
          sessions={sessions}
          mitgliederNamen={mitgliederNamen}
          onSuSKlick={onSuSKlick}
        />
      </Sektion>
    </div>
  )
}

function StatKarte({ label, wert, total }: { label: string; wert: number | string; total?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="text-2xl font-bold text-slate-800 dark:text-white">
        {wert}
        {total !== undefined && <span className="text-sm font-normal text-slate-400">/{total}</span>}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  )
}

function Sektion({ titel, beschreibung, children }: { titel: string; beschreibung: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1">{titel}</h3>
      <p className="text-xs text-slate-400 mb-4">{beschreibung}</p>
      {children}
    </div>
  )
}
