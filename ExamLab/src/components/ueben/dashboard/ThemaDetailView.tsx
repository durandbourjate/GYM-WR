// ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx
import type { Frage } from '../../../types/ueben/fragen'
import type { ThemenFortschritt } from '../../../types/ueben/fortschritt'
import { berechneSterne, sterneText } from '../../../utils/ueben/gamification'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'
import { FilterSection, Chip, FortschrittsBalken, MasteryBadges } from './themaDetailHelpers'

// TEMPORÄR: wird in Task 4.8 durch Import aus useThemenKomputationen ersetzt
interface ThemenInfo {
  fach: string
  thema: string
  unterthemen: string[]
  fragen: Frage[]
  fortschritt: ThemenFortschritt
}

const SCHWIERIGKEIT_LABELS: Record<number, string> = { 1: 'Einfach', 2: 'Mittel', 3: 'Schwer' }
const SCHWIERIGKEIT_STERNE: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

const TYP_LABELS: Record<string, string> = {
  mc: 'Multiple Choice', multi: 'Multi', tf: 'Richtig/Falsch', fill: 'Lückentext', calc: 'Berechnung',
  sort: 'Zuordnung', sortierung: 'Sortierung', zuordnung: 'Paare',
  open: 'Freitext', formel: 'Formel', pdf: 'PDF-Annotation',
  buchungssatz: 'Buchungssatz', tkonto: 'T-Konto', bilanz: 'Bilanz', kontenbestimmung: 'Kontenbestimmung',
  hotspot: 'Hotspot', bildbeschriftung: 'Bildbeschriftung', dragdrop_bild: 'Drag & Drop',
  gruppe: 'Aufgabengruppe', zeichnen: 'Zeichnen', audio: 'Audio', code: 'Code',
  richtigfalsch: 'Richtig/Falsch', lueckentext: 'Lückentext', berechnung: 'Berechnung',
  freitext: 'Freitext', visualisierung: 'Zeichnen', bilanzstruktur: 'Bilanz',
  aufgabengruppe: 'Aufgabengruppe',
}

interface ThemaDetailProps {
  themaDetail: ThemenInfo
  gefilterteFragen: Frage[]
  unterthemaFilter: Set<string>
  schwierigkeitFilter: Set<number>
  typFilter: Set<string>
  onToggleUnterthema: (v: string) => void
  onToggleSchwierigkeit: (v: number) => void
  onToggleTyp: (v: string) => void
  onToggleAlleUnterthemen: () => void
  onToggleAlleSchwierigkeiten: () => void
  onToggleAlleTypen: () => void
  onZurueck: () => void
  onStarte: () => void
  fachFarben: Record<string, string>
}

export function ThemaDetailView({
  themaDetail, gefilterteFragen,
  unterthemaFilter, schwierigkeitFilter, typFilter,
  onToggleUnterthema, onToggleSchwierigkeit, onToggleTyp,
  onToggleAlleUnterthemen, onToggleAlleSchwierigkeiten, onToggleAlleTypen,
  onZurueck, onStarte, fachFarben,
}: ThemaDetailProps) {
  const farbe = getFachFarbe(themaDetail.fach, fachFarben)
  // Immer alle 3 Schwierigkeitsstufen anzeigen (Pool-Fragen haben diff 1-3)
  const verfuegbareSchwierigkeiten = [1, 2, 3]
  const verfuegbareTypen = [...new Set(themaDetail.fragen.map(f => f.typ))].sort()
  const filterAktiv = unterthemaFilter.size > 0 || schwierigkeitFilter.size > 0 || typFilter.size > 0

  return (
    <div className="space-y-4">
      {/* Header mit Zurück */}
      <div className="flex items-center gap-3">
        <button
          onClick={onZurueck}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          ←
        </button>
        <div>
          <h3 className="text-lg font-bold dark:text-white">{themaDetail.thema}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: farbe }} />
            <span>{themaDetail.fach}</span>
            <span>·</span>
            <span>{themaDetail.fragen.length} Fragen</span>
          </div>
        </div>
      </div>

      {/* Fortschritt */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <FortschrittsBalken fortschritt={themaDetail.fortschritt} />
        <div className="flex justify-between mt-2">
          <MasteryBadges fortschritt={themaDetail.fortschritt} />
          <span className="text-sm">{sterneText(berechneSterne(themaDetail.fortschritt.quote))}</span>
        </div>
      </div>

      {/* Unterthema-Chips */}
      {themaDetail.unterthemen.length > 0 && (
        <FilterSection
          titel="Unterthemen"
          emoji="📚"
          onToggleAlle={onToggleAlleUnterthemen}
        >
          {themaDetail.unterthemen.map(ut => {
            const anzahl = themaDetail.fragen.filter(f => (f as { unterthema?: string }).unterthema === ut).length
            return (
              <Chip
                key={ut}
                label={ut}
                count={anzahl}
                aktiv={unterthemaFilter.has(ut)}
                farbe={farbe}
                onClick={() => onToggleUnterthema(ut)}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Schwierigkeits-Chips */}
      <FilterSection titel="Schwierigkeit" emoji="📊" onToggleAlle={onToggleAlleSchwierigkeiten}>
        {verfuegbareSchwierigkeiten.map(s => {
          const anzahl = themaDetail.fragen.filter(f => (f.schwierigkeit ?? 2) === s).length
          return (
            <Chip
              key={s}
              label={`${SCHWIERIGKEIT_STERNE[s] || '⭐'} ${SCHWIERIGKEIT_LABELS[s] || `Stufe ${s}`}`}
              count={anzahl}
              aktiv={schwierigkeitFilter.has(s)}
              farbe={farbe}
              onClick={() => onToggleSchwierigkeit(s)}
            />
          )
        })}
      </FilterSection>

      {/* Fragetyp-Chips */}
      {verfuegbareTypen.length > 0 && (
        <FilterSection titel="Fragetyp" emoji="✏️" onToggleAlle={onToggleAlleTypen}>
          {verfuegbareTypen.map(t => {
            const anzahl = themaDetail.fragen.filter(f => f.typ === t).length
            return (
              <Chip
                key={t}
                label={TYP_LABELS[t] || t}
                count={anzahl}
                aktiv={typFilter.has(t)}
                farbe={farbe}
                onClick={() => onToggleTyp(t)}
              />
            )
          })}
        </FilterSection>
      )}

      {/* Info-Balken + Start-Button */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {filterAktiv
              ? `${gefilterteFragen.length} von ${themaDetail.fragen.length} Fragen ausgewählt`
              : `${themaDetail.fragen.length} Fragen verfügbar`
            }
          </span>
          <button
            onClick={onStarte}
            disabled={gefilterteFragen.length === 0}
            className="px-6 py-2.5 rounded-xl font-semibold text-white transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: gefilterteFragen.length > 0 ? farbe : undefined }}
          >
            Übung starten
          </button>
        </div>
      </div>
    </div>
  )
}
