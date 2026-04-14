import { useMemo } from 'react'
import type { FragenFortschritt } from '../../../../types/ueben/fortschritt'
import type { Frage } from '../../../../types/ueben/fragen'
import { getFachFarbe } from '../../../../utils/ueben/fachFarben'

interface KlassenLueckenProps {
  fragen: Frage[]
  fortschritte: FragenFortschritt[]
  anzahlSuS: number
  fachFarben: Record<string, string>
}

interface Luecke {
  fach: string
  thema: string
  anteilUnterGefestigt: number // 0–1: Anteil SuS unter "gefestigt"
  betroffeneSuS: number
  anzahlFragen: number
}

/**
 * Zeigt klassenweite Lücken: Themen wo >50% der SuS unter "gefestigt" sind.
 * Sortiert nach Dringlichkeit (höchster Anteil zuerst).
 */
export default function KlassenLuecken({ fragen, fortschritte, anzahlSuS, fachFarben }: KlassenLueckenProps) {
  const luecken = useMemo(() => {
    if (anzahlSuS === 0) return []

    // Fragen pro Thema
    const themaFragen: Record<string, { fach: string; ids: string[] }> = {}
    for (const f of fragen) {
      const t = f.thema || 'Allgemein'
      if (!themaFragen[t]) themaFragen[t] = { fach: f.fach || '', ids: [] }
      themaFragen[t].ids.push(f.id)
    }

    // Pro Thema: Wie viele SuS sind unter gefestigt?
    const ergebnis: Luecke[] = []

    for (const [thema, { fach, ids }] of Object.entries(themaFragen)) {
      // Pro SuS: Durchschnitts-Mastery für dieses Thema
      const susScores: Record<string, number> = {}
      const susCounts: Record<string, number> = {}

      for (const fp of fortschritte) {
        if (!ids.includes(fp.fragenId)) continue
        if (!susScores[fp.email]) { susScores[fp.email] = 0; susCounts[fp.email] = 0 }
        susCounts[fp.email]++
        switch (fp.mastery) {
          case 'gemeistert': susScores[fp.email] += 100; break
          case 'gefestigt': susScores[fp.email] += 75; break
          case 'ueben': susScores[fp.email] += 25; break
        }
      }

      let unterGefestigt = 0
      const alleEmails = new Set(fortschritte.map(fp => fp.email))
      for (const email of alleEmails) {
        const score = (susScores[email] || 0) / ids.length
        if (score < 50) unterGefestigt++ // unter 50% = unter gefestigt
      }

      const anteil = unterGefestigt / anzahlSuS
      if (anteil >= 0.5) { // Mindestens 50% der Klasse hat Lücke
        ergebnis.push({ fach, thema, anteilUnterGefestigt: anteil, betroffeneSuS: unterGefestigt, anzahlFragen: ids.length })
      }
    }

    return ergebnis.sort((a, b) => b.anteilUnterGefestigt - a.anteilUnterGefestigt)
  }, [fragen, fortschritte, anzahlSuS])

  if (luecken.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">
        Keine klassenweiten Lücken erkannt (gut!).
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {luecken.map(l => {
        const farbe = getFachFarbe(l.fach, fachFarben)
        const pct = Math.round(l.anteilUnterGefestigt * 100)
        return (
          <div
            key={`${l.fach}-${l.thema}`}
            className="flex items-center justify-between p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
          >
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: farbe }} />
              <div>
                <span className="font-medium text-sm dark:text-white">{l.thema}</span>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {l.fach} · {l.anzahlFragen} Fragen
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{pct}%</span>
              <div className="text-xs text-slate-400">{l.betroffeneSuS}/{anzahlSuS} SuS</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
