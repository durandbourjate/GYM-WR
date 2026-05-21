import { ClipboardList } from 'lucide-react'
import { TYPO } from '../../../styles/typografie'
import LPCardsSkeleton from '../skeletons/LPCardsSkeleton'
import LPTrackerSkeleton from '../skeletons/LPTrackerSkeleton'
import TrackerSection from '../TrackerSection'
import Button from '../../ui/Button'
import { FilterLeiste } from './FilterLeiste'
import { PruefungsKarte } from './PruefungsKarte'
import { MultiDashboardDialog } from './MultiDashboardDialog'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { TrackerDaten, TrackerPruefungSummary } from '../../../types/tracker'

export interface LPPruefungenAnsichtProps {
  configs: PruefungsConfig[]
  configsLadeStatus: 'laden' | 'fertig'
  trackerLadeStatus: 'laden' | 'fertig'
  trackerDaten: TrackerDaten | null
  backendFehler: boolean
  istDemoModus: boolean
  listenTab: 'pruefungen' | 'tracker'

  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  summativeConfigs: PruefungsConfig[]
  gefilterteConfigs: PruefungsConfig[]
  letzteFuenf: PruefungsConfig[]
  favoritenPruefungen: PruefungsConfig[]
  hatAktiveFilter: boolean

  filterFach: string[]
  toggleFachFilter: (f: string) => void
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  resetFilter: () => void

  multiDashboardOffen: boolean
  setMultiDashboardOffen: (o: boolean) => void
  multiDashboardAuswahl: Set<string>
  setMultiDashboardAuswahl: (s: Set<string>) => void

  handleNeue: () => void
  handleBearbeiten: (c: PruefungsConfig) => void
  handleDuplizieren: (c: PruefungsConfig) => void
  handleLoeschen: (c: PruefungsConfig) => void
  findeTrackerSummary: (id: string) => TrackerPruefungSummary | undefined
}

/**
 * Prüfen-Modus-Body. Vorher inline in LPStartseite.tsx Z. 643-862
 * (modus === 'pruefung'-Block).
 */
export function LPPruefungenAnsicht(props: LPPruefungenAnsichtProps) {
  const {
    configsLadeStatus, trackerLadeStatus, trackerDaten, backendFehler, istDemoModus, listenTab,
    verfuegbareFachbereiche, verfuegbareGefaesse,
    summativeConfigs, gefilterteConfigs, letzteFuenf, favoritenPruefungen, hatAktiveFilter,
    filterFach, toggleFachFilter, filterGefaess, setFilterGefaess,
    filterStatus, setFilterStatus, sortierung, setSortierung, resetFilter,
    multiDashboardOffen, setMultiDashboardOffen,
    multiDashboardAuswahl, setMultiDashboardAuswahl,
    handleNeue, handleBearbeiten, handleDuplizieren, handleLoeschen, findeTrackerSummary,
  } = props

  return (
    <main className="p-6">
      {configsLadeStatus === 'laden' && listenTab === 'pruefungen' && <LPCardsSkeleton />}

      {configsLadeStatus === "fertig" && backendFehler && !istDemoModus && (
        <div className="mb-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
          <span className="text-slate-400 shrink-0 mt-0.5">ⓘ</span>
          <span>Backend nicht erreichbar — bestehende Prüfungen konnten nicht geladen werden. Der Composer ist trotzdem nutzbar.</span>
        </div>
      )}

      {/* Tracker-Ansicht: eigener Lade-Status, unabhängig von Configs */}
      {listenTab === 'tracker' && (
        trackerLadeStatus === 'laden' ? (
          <LPTrackerSkeleton />
        ) : trackerDaten ? (
          <TrackerSection trackerDaten={trackerDaten} />
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
            Keine Tracker-Daten verfügbar.
          </p>
        )
      )}

      {/* Prüfungen-Ansicht */}
      {listenTab === 'pruefungen' && configsLadeStatus === 'fertig' && summativeConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          </div>
          <h2 className={`${TYPO.h2} text-slate-800 dark:text-slate-100 mb-2`}>
            Noch keine Prüfungen
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Erstellen Sie Ihre erste digitale Prüfung.
          </p>
          <Button variant="primary" size="md" onClick={handleNeue}>
            + Neue Prüfung erstellen
          </Button>
        </div>
      )}

      {listenTab === 'pruefungen' && configsLadeStatus === 'fertig' && summativeConfigs.length > 0 && (
        <div className="space-y-3">
          {/* Such- und Filterleiste */}
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
              <Button variant="primary" size="sm" onClick={handleNeue} className="ml-auto whitespace-nowrap">
                + Neue Prüfung
              </Button>
            }
          />

          {/* Zähler + Multi-Dashboard */}
          <div className="flex items-center justify-between">
            <h2 className={`${TYPO.body} font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide`}>
              {hatAktiveFilter
                ? `${gefilterteConfigs.length} von ${summativeConfigs.length} Prüfungen`
                : `${summativeConfigs.length} Prüfungen`}
            </h2>
            {summativeConfigs.length > 1 && (
              <button
                onClick={() => {
                  setMultiDashboardAuswahl(new Set())
                  setMultiDashboardOffen(true)
                }}
                className="text-xs px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                Multi-Dashboard
              </button>
            )}
          </div>

          {/* Multi-Dashboard Dialog */}
          {multiDashboardOffen && (
            <MultiDashboardDialog
              summativeConfigs={summativeConfigs}
              auswahl={multiDashboardAuswahl}
              setAuswahl={setMultiDashboardAuswahl}
              onSchliessen={() => setMultiDashboardOffen(false)}
            />
          )}

          {/* Favoriten-Sektion (nur wenn Favoriten vorhanden und kein aktiver Filter) */}
          {!hatAktiveFilter && favoritenPruefungen.length > 0 && (
            <div className="space-y-2">
              <h3 className={`${TYPO.caption} font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5`}>
                <span>⭐</span> Favoriten
              </h3>
              {favoritenPruefungen.map(c => (
                <PruefungsKarte key={`fav-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} onLoeschen={handleLoeschen} trackerSummary={findeTrackerSummary(c.id)} />
              ))}
              <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
            </div>
          )}

          {/* Zuletzt-Sektion (nur ohne Filter und wenn >5 Prüfungen) */}
          {letzteFuenf.length > 0 && (
            <div className="space-y-2">
              <h3 className={`${TYPO.caption} font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide`}>
                Zuletzt
              </h3>
              {letzteFuenf.map(c => (
                <PruefungsKarte key={`recent-${c.id}`} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} onLoeschen={handleLoeschen} trackerSummary={findeTrackerSummary(c.id)} />
              ))}
              <div className="border-b border-slate-200 dark:border-slate-700 pt-2 mb-1" />
              <h3 className={`${TYPO.caption} font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide pt-1`}>
                Alle Prüfungen
              </h3>
            </div>
          )}

          {/* Hauptliste */}
          {gefilterteConfigs.length === 0 && hatAktiveFilter && (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
              Keine Prüfungen entsprechen den Filtern.
            </p>
          )}
          {gefilterteConfigs.map(c => (
            <PruefungsKarte key={c.id} config={c} onBearbeiten={handleBearbeiten} onDuplizieren={handleDuplizieren} onLoeschen={handleLoeschen} trackerSummary={findeTrackerSummary(c.id)} />
          ))}
        </div>
      )}
    </main>
  )
}
