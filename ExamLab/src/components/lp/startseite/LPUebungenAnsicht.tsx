import LPUebungenSkeleton from '../skeletons/LPUebungenSkeleton'
import Button from '../../ui/Button'
import { FilterLeiste } from './FilterLeiste'
import { PruefungsKarte } from './PruefungsKarte'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { TrackerPruefungSummary } from '../../../types/tracker'

export interface LPUebungenAnsichtProps {
  configsLadeStatus: 'laden' | 'fertig'
  formativeConfigs: PruefungsConfig[]
  gefilterteUebungen: PruefungsConfig[]
  favoritenUebungen: PruefungsConfig[]
  hatAktiveFilter: boolean

  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  filterFach: string[]
  toggleFachFilter: (f: string) => void
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  resetFilter: () => void

  handleNeueUebung: () => void
  handleBearbeiten: (c: PruefungsConfig) => void
  handleDuplizieren: (c: PruefungsConfig) => void
  findeTrackerSummary: (id: string) => TrackerPruefungSummary | undefined
}

/**
 * Übungen-Tab-Body. Vorher inline in LPStartseite.tsx Z. 519-634
 * (uebungsTab === 'durchfuehren'-Block).
 */
export function LPUebungenAnsicht(props: LPUebungenAnsichtProps) {
  const {
    configsLadeStatus, formativeConfigs, gefilterteUebungen, favoritenUebungen, hatAktiveFilter,
    verfuegbareFachbereiche, verfuegbareGefaesse, filterFach, toggleFachFilter,
    filterGefaess, setFilterGefaess, filterStatus, setFilterStatus,
    sortierung, setSortierung, resetFilter,
    handleNeueUebung, handleBearbeiten, handleDuplizieren, findeTrackerSummary,
  } = props

  return (
    <main className="p-6">
      {configsLadeStatus === 'laden' && <LPUebungenSkeleton />}
      {configsLadeStatus === 'fertig' && formativeConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Noch keine Übungen</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Erstellen Sie Ihre erste formative Übung.</p>
          <Button variant="primary" size="md" onClick={handleNeueUebung}>
            + Neue Übung erstellen
          </Button>
        </div>
      )}
      {configsLadeStatus === 'fertig' && formativeConfigs.length > 0 && (
        <div className="space-y-3">
          {/* Such- und Filterleiste (analog Prüfen) */}
          <FilterLeiste
            verfuegbareFachbereiche={verfuegbareFachbereiche}
            filterFach={filterFach}
            toggleFachFilter={toggleFachFilter}
            verfuegbareGefaesse={verfuegbareGefaesse}
            filterGefaess={filterGefaess}
            setFilterGefaess={setFilterGefaess}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortierung={sortierung}
            setSortierung={setSortierung}
            hatAktiveFilter={hatAktiveFilter}
            resetFilter={resetFilter}
            aktionSlot={
              <Button variant="primary" size="sm" onClick={handleNeueUebung} className="ml-auto whitespace-nowrap">
                + Neue Übung
              </Button>
            }
          />

          {/* Zähler */}
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {hatAktiveFilter
              ? `${gefilterteUebungen.length} von ${formativeConfigs.length} Übungen`
              : `${formativeConfigs.length} Übung${formativeConfigs.length !== 1 ? 'en' : ''}`}
          </h2>

          {/* Favoriten-Sektion für Übungen */}
          {!hatAktiveFilter && favoritenUebungen.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <span>⭐</span> Favoriten
              </h3>
              {favoritenUebungen.map(c => (
                <PruefungsKarte key={`fav-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
              ))}
              <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
            </div>
          )}

          {gefilterteUebungen.map(c => (
            <PruefungsKarte key={c.id} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} trackerSummary={findeTrackerSummary(c.id)} />
          ))}
        </div>
      )}
    </main>
  )
}
