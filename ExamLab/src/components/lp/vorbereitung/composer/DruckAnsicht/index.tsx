import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import type { Frage, FrageAnhang } from '../../../../../types/fragen-storage'
import { formatDatum } from '../../../../../utils/zeit.ts'
import { typLabel } from '../../../../../utils/fachUtils.ts'
import { useSchulConfig } from '../../../../../store/schulConfigStore.ts'
import { formatFragetext } from '../../../../../utils/textFormatierung.tsx'
import { istBild } from '../../../../../utils/mediaUtils.ts'
import MCDruck from './MCDruck'
import RichtigFalschDruck from './RichtigFalschDruck'
import FreitextDruck from './FreitextDruck'
import LueckentextDruck from './LueckentextDruck'
import ZuordnungDruck from './ZuordnungDruck'
import BerechnungDruck from './BerechnungDruck'
import BuchungssatzDruck from './BuchungssatzDruck'
import TKontoDruck from './TKontoDruck'
import KontenbestimmungDruck from './KontenbestimmungDruck'
import BilanzDruck from './BilanzDruck'
import AufgabengruppeDruck from './AufgabengruppeDruck'
import SortierungDruck from './SortierungDruck'
import HotspotDruck from './HotspotDruck'
import BildbeschriftungDruck from './BildbeschriftungDruck'
import DragDropBildDruck from './DragDropBildDruck'
import { PDFHinweis, DigitalHinweis, ZeichenDruck, CodeDruck, FormelDruck } from './hinweise'

interface Props {
  pruefung: PruefungsConfig
  fragenMap: Record<string, Frage>
  onSchliessen: () => void
}

export default function DruckAnsicht({ pruefung, fragenMap, onSchliessen }: Props) {
  const { config } = useSchulConfig()

  // Gesamtpunkte berechnen
  let gesamtPunkte = 0
  for (const abschnitt of pruefung.abschnitte) {
    for (const frageId of abschnitt.fragenIds) {
      const frage = fragenMap[frageId]
      if (frage) gesamtPunkte += frage.punkte
    }
  }

  // Laufende Frage-Nummern berechnen
  let laufendeNr = 0

  return (
    <div className="fixed inset-0 z-[70] bg-white dark:bg-slate-900 overflow-y-auto print:relative print:z-auto print:overflow-visible">
      {/* Steuerleiste (nur Bildschirm) */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onSchliessen}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            ← Zurück
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
            {pruefung.titel || '(Kein Titel)'} — Druckansicht
          </span>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-700 dark:bg-slate-600 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors cursor-pointer"
          >
            Drucken / PDF
          </button>
        </div>
      </div>

      {/* Druckbarer Inhalt */}
      <div className="max-w-3xl mx-auto p-6 print:p-4 print:max-w-none">
        {/* Header */}
        <div className="druck-header mb-6 pb-4 border-b-2 border-slate-300 print:border-slate-400">
          <p className="text-xs text-slate-500 print:text-slate-600 tracking-wider uppercase mb-1">
            {config.schulName}
          </p>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black mb-2">
            {pruefung.titel || '(Kein Titel)'}
          </h1>

          {/* Metadaten */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700 mb-4">
            {pruefung.klasse && <span>Klasse: {pruefung.klasse}</span>}
            <span>Datum: {formatDatum(pruefung.datum)}</span>
            <span>Dauer: {pruefung.dauerMinuten} Min.</span>
            <span>Gesamtpunkte: {gesamtPunkte}</span>
          </div>

          {/* Name-Felder */}
          <div className="flex gap-6 text-sm text-slate-700 dark:text-slate-300 print:text-black">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Name:</span>
              <span className="inline-block w-48 border-b border-slate-400 print:border-black">&nbsp;</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Vorname:</span>
              <span className="inline-block w-48 border-b border-slate-400 print:border-black">&nbsp;</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Klasse:</span>
              <span className="inline-block w-20 border-b border-slate-400 print:border-black">&nbsp;</span>
            </div>
          </div>
        </div>

        {/* Hinweise */}
        {pruefung.abschnitte.length > 0 && (
          <div className="text-xs text-slate-500 print:text-slate-600 mb-4 space-y-0.5">
            {pruefung.ruecknavigation && <p>Alle Fragen können in beliebiger Reihenfolge beantwortet werden.</p>}
            <p>Antworten werden automatisch gespeichert.</p>
          </div>
        )}

        {/* Abschnitte + Fragen */}
        {pruefung.abschnitte.map((abschnitt, aIndex) => (
          <div key={aIndex} className={`druck-abschnitt ${aIndex > 0 ? 'mt-6' : ''}`}>
            {/* Abschnitt-Header */}
            <div className="mb-4 pb-2 border-b-2 border-slate-300 print:border-slate-400">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 print:text-black">
                {abschnitt.titel}
              </h2>
              {abschnitt.beschreibung && (
                <p className="text-sm text-slate-600 dark:text-slate-300 print:text-slate-700 mt-1 italic">
                  {abschnitt.beschreibung}
                </p>
              )}
            </div>

            {/* Fragen */}
            {abschnitt.fragenIds.map((frageId) => {
              const frage = fragenMap[frageId]
              if (!frage) return null
              laufendeNr++
              return (
                <DruckFrage key={frageId} frage={frage} nummer={laufendeNr} />
              )
            })}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-300 print:border-slate-400">
          <p className="text-sm text-slate-600 print:text-slate-700 font-medium text-center mb-2">
            Viel Erfolg!
          </p>
          <p className="text-xs text-slate-400 print:text-slate-500 text-center">
            Generiert am {new Date().toLocaleDateString('de-CH')} um {new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Frage-Wrapper
// ============================================================

function DruckFrage({ frage, nummer }: { frage: Frage; nummer: number }) {
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext
    : 'aufgabentext' in frage ? (frage as { aufgabentext: string }).aufgabentext
    : 'kontext' in frage ? (frage as { kontext: string }).kontext : ''

  return (
    <div className="druck-frage mb-4 p-4 border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-lg">
      {/* Header: Nummer + Typ + Punkte */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 print:text-black">
            Frage {nummer}
          </span>
          <span className="text-xs text-slate-500 print:text-slate-600">
            ({typLabel(frage.typ)})
          </span>
        </div>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 print:text-black px-2 py-0.5 border border-slate-300 print:border-slate-400 rounded">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
      </div>

      {/* Fragetext */}
      {fragetext && (
        <div className="text-sm text-slate-800 dark:text-slate-100 print:text-black mb-3 leading-relaxed">
          {formatFragetext(fragetext)}
        </div>
      )}

      {/* Anhänge (Bilder inline, Rest als Hinweis) */}
      {frage.anhaenge && frage.anhaenge.length > 0 && (
        <DruckAnhaenge anhaenge={frage.anhaenge} />
      )}

      {/* Typ-spezifischer Inhalt */}
      <FrageInhalt frage={frage} />
    </div>
  )
}

// ============================================================
// Anhänge für Druck
// ============================================================

function DruckAnhaenge({ anhaenge }: { anhaenge: FrageAnhang[] }) {
  return (
    <div className="mb-3 space-y-2">
      {anhaenge.map((anhang) => {
        if (istBild(anhang.mimeType)) {
          const url = anhang.externeUrl
            || `https://drive.google.com/thumbnail?id=${anhang.driveFileId}&sz=w600`
          return (
            <img
              key={anhang.id}
              src={url}
              alt={anhang.beschreibung || anhang.dateiname}
              className="max-w-full max-h-64 rounded border border-slate-200 print:border-slate-300"
            />
          )
        }
        return (
          <p key={anhang.id} className="text-xs italic text-slate-500 print:text-slate-600">
            📎 {anhang.dateiname} — nur digital verfügbar
          </p>
        )
      })}
    </div>
  )
}

// ============================================================
// Typ-Dispatcher
// ============================================================

function FrageInhalt({ frage }: { frage: Frage }) {
  switch (frage.typ) {
    case 'mc': return <MCDruck frage={frage} />
    case 'richtigfalsch': return <RichtigFalschDruck frage={frage} />
    case 'freitext': return <FreitextDruck frage={frage} />
    case 'lueckentext': return <LueckentextDruck frage={frage} />
    case 'zuordnung': return <ZuordnungDruck frage={frage} />
    case 'berechnung': return <BerechnungDruck frage={frage} />
    case 'buchungssatz': return <BuchungssatzDruck frage={frage} />
    case 'tkonto': return <TKontoDruck frage={frage} />
    case 'kontenbestimmung': return <KontenbestimmungDruck frage={frage} />
    case 'bilanzstruktur': return <BilanzDruck frage={frage} />
    case 'aufgabengruppe': return <AufgabengruppeDruck frage={frage} />
    case 'sortierung': return <SortierungDruck frage={frage} />
    case 'visualisierung': return <ZeichenDruck />
    case 'pdf': return <PDFHinweis />
    case 'audio': return <DigitalHinweis typ="Audio-Aufnahme" />
    case 'code': return <CodeDruck />
    case 'formel': return <FormelDruck />
    case 'hotspot': return <HotspotDruck frage={frage} />
    case 'bildbeschriftung': return <BildbeschriftungDruck frage={frage} />
    case 'dragdrop_bild': return <DragDropBildDruck frage={frage} />
    default: return null
  }
}
