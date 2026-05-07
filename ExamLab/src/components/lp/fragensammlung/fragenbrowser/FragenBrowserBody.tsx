// ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserBody.tsx
import type { Frage, FrageSummary } from '../../../../types/fragen-storage'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import { useFragenFilter } from '../../../../hooks/useFragenFilter.ts'
import FragenListeSkeleton from '../../skeletons/FragenListeSkeleton'
import FragenBrowserHeader from './FragenBrowserHeader.tsx'
import VirtualisierteFragenListe from './VirtualisierteFragenListe.tsx'
import DraftsSection from '../DraftsSection'

interface Props {
  ladeStatus: 'laden' | 'fertig'
  detailLaden: boolean
  filter: ReturnType<typeof useFragenFilter>
  drafts: Frage[]
  bereitsVerwendetSet: Set<string>
  fragenStats: Map<string, FragenPerformance>
  ownEmail: string
  toggleFrageInPruefung: (frageId: string) => void
  toggleGruppe: (key: string) => void
  handleEditFrage: (frage: Frage | FrageSummary) => void
  handleFrageDuplizieren: (frage: Frage | FrageSummary) => Promise<void>
  handleFrageLoeschen: (frage: Frage | FrageSummary) => void
  onNeueFrageErstellen: () => void
  onBatchExport: () => void
  onImport: () => void
  onExcelImport: () => void
  onSchliessen: () => void
  zielPruefungTitel?: string
  zielAbschnittTitel?: string
  inline?: boolean
  listeRef: React.RefObject<HTMLDivElement | null>
}

export default function FragenBrowserBody({
  ladeStatus, detailLaden, filter, drafts, bereitsVerwendetSet, fragenStats, ownEmail,
  toggleFrageInPruefung, toggleGruppe, handleEditFrage, handleFrageDuplizieren, handleFrageLoeschen,
  onNeueFrageErstellen, onBatchExport, onImport, onExcelImport, onSchliessen,
  zielPruefungTitel, zielAbschnittTitel, inline, listeRef,
}: Props) {
  return (
    <>
      {/* Header mit Suche + Filter */}
      <FragenBrowserHeader
        ladeStatus={ladeStatus}
        gefilterteFragen={filter.gefilterteFragen}
        stats={filter.stats}
        alleStats={filter.alleStats}
        verfuegbareThemen={filter.verfuegbareThemen}
        verfuegbareUnterthemen={filter.verfuegbareUnterthemen}
        aktiveFilter={filter.aktiveFilter}
        suchtext={filter.suchtext}
        setSuchtext={filter.setSuchtext}
        filterFachbereich={filter.filterFachbereich}
        setFilterFachbereich={filter.setFilterFachbereich}
        filterTyp={filter.filterTyp}
        setFilterTyp={filter.setFilterTyp}
        filterBloom={filter.filterBloom}
        setFilterBloom={filter.setFilterBloom}
        filterThema={filter.filterThema}
        setFilterThema={filter.setFilterThema}
        filterUnterthema={filter.filterUnterthema}
        setFilterUnterthema={filter.setFilterUnterthema}
        filterPoolStatus={filter.filterPoolStatus}
        setFilterPoolStatus={filter.setFilterPoolStatus}
        filterMitAnhang={filter.filterMitAnhang}
        setFilterMitAnhang={filter.setFilterMitAnhang}
        filterKontext={filter.filterKontext}
        setFilterKontext={filter.setFilterKontext}
        filterZuruecksetzen={filter.filterZuruecksetzen}
        sortierung={filter.sortierung}
        setSortierung={filter.setSortierung}
        gruppierung={filter.gruppierung}
        setGruppierung={filter.setGruppierung}
        setAufgeklappteGruppen={filter.setAufgeklappteGruppen}
        kompaktModus={filter.kompaktModus}
        setKompaktModus={filter.setKompaktModus}
        onNeueFrageErstellen={onNeueFrageErstellen}
        onBatchExport={onBatchExport}
        onImport={onImport}
        onExcelImport={onExcelImport}
        onSchliessen={onSchliessen}
        zielPruefungTitel={zielPruefungTitel}
        zielAbschnittTitel={zielAbschnittTitel}
        inline={inline}
        listeRef={listeRef}
      />

      {/* Drafts-Sektion oberhalb der Sammlung */}
      {ladeStatus === 'fertig' && (
        <DraftsSection
          drafts={drafts}
          onClickDraft={(frage) => handleEditFrage(frage)}
          ownEmail={ownEmail}
        />
      )}

      {/* Fragen-Liste */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {ladeStatus === 'laden' && <FragenListeSkeleton />}

        {detailLaden && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 z-10 flex items-center justify-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Frage wird geladen...</p>
          </div>
        )}

        {ladeStatus === 'fertig' && filter.gefilterteFragen.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            Keine Fragen gefunden.
          </p>
        )}

        {ladeStatus === 'fertig' && filter.gefilterteFragen.length > 0 && (
          <VirtualisierteFragenListe
            gruppierteAnzeige={filter.gruppierteAnzeige}
            gruppierung={filter.gruppierung}
            aufgeklappteGruppen={filter.aufgeklappteGruppen}
            kompaktModus={filter.kompaktModus}
            bereitsVerwendetSet={bereitsVerwendetSet}
            fragenStats={fragenStats}
            toggleGruppe={toggleGruppe}
            toggleFrageInPruefung={toggleFrageInPruefung}
            handleEditFrage={handleEditFrage}
            handleFrageDuplizieren={handleFrageDuplizieren}
            handleFrageLoeschen={handleFrageLoeschen}
            scrollResetTrigger={`${filter.suchtext}|${filter.gruppierung}|${filter.gefilterteFragen.length}`}
            scrollContainerRef={listeRef}
          />
        )}
      </div>
    </>
  )
}
