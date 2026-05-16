import { useState } from 'react'
import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import type { Frage, MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage, RichtigFalschFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage, KontenbestimmungFrage, BilanzERFrage, AufgabengruppeFrage } from '../../../../../types/fragen-storage'
import { formatDatum } from '../../../../../utils/zeit.ts'
import { typLabel, fachbereichFarbe } from '../../../../../utils/fachUtils.ts'
import { formatFragetext } from '../../../../../utils/textFormatierung.tsx'
import DruckAnsicht from '../DruckAnsicht'
import { schaetzeZeitbedarf } from './zeitbedarf'
import AnhangMedien from './AnhangMedien'
import MCVorschau from './MCVorschau'
import FreitextVorschau from './FreitextVorschau'
import LueckentextVorschau from './LueckentextVorschau'
import ZuordnungVorschau from './ZuordnungVorschau'
import RichtigFalschVorschau from './RichtigFalschVorschau'
import BerechnungVorschau from './BerechnungVorschau'
import BuchungssatzVorschau from './BuchungssatzVorschau'
import TKontoVorschau from './TKontoVorschau'
import KontenbestimmungVorschau from './KontenbestimmungVorschau'
import BilanzERVorschau from './BilanzERVorschau'
import AufgabengruppeVorschau from './AufgabengruppeVorschau'
import { ermittlePdfQuelle } from '@shared/utils/mediaQuelleResolver'
import { FragetypIcon } from '../../../../ui/icons/FragetypIcon'

interface Props {
  pruefung: PruefungsConfig
  fragenMap: Record<string, Frage>
  fragenGeladen?: boolean
  onSuSVorschau: () => void
}

export default function VorschauTab({ pruefung, fragenMap, fragenGeladen = true, onSuSVorschau }: Props) {
  const [druckAnsichtOffen, setDruckAnsichtOffen] = useState(false)
  const gesamtFragen = pruefung.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)

  // Gesamtpunkte und geschätzte Zeit berechnen
  let gesamtPunkte = 0
  let gesamtZeit = 0
  for (const abschnitt of pruefung.abschnitte) {
    for (const frageId of abschnitt.fragenIds) {
      const frage = fragenMap[frageId]
      if (frage) {
        gesamtPunkte += frage.punkte
        gesamtZeit += frage.zeitbedarf ?? schaetzeZeitbedarf(frage)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Zusammenfassungsleiste */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
              {pruefung.titel || '(Kein Titel)'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDruckAnsichtOffen(true)}
              disabled={gesamtFragen === 0}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Druckbare Ansicht
            </button>
            {pruefung.id && (
              <button
                onClick={onSuSVorschau}
                disabled={gesamtFragen === 0}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Interaktive SuS-Vorschau
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {pruefung.klasse || '(Keine Klasse)'} · {formatDatum(pruefung.datum)}
        </p>

        {/* Zusammenfassungs-Badges */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Fragen:</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{gesamtFragen}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Punkte:</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{gesamtPunkte}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Prüfungsdauer:</span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{pruefung.dauerMinuten} Min.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">Geschätzte Zeit:</span>
            <span className={`text-sm font-semibold ${gesamtZeit > pruefung.dauerMinuten ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {gesamtZeit} Min.
            </span>
          </div>
        </div>
      </div>

      {/* Prüfungs-ID & URL */}
      {pruefung.id && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3">
          <div className="flex items-center gap-6 text-xs text-slate-400 dark:text-slate-500">
            <span>
              ID: <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{pruefung.id}</code>
            </span>
            <span className="truncate">
              URL: <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                {window.location.origin + window.location.pathname}?id={pruefung.id}
              </code>
            </span>
          </div>
        </div>
      )}

      {/* SuS-Vorschau der Fragen */}
      {gesamtFragen === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 dark:text-slate-500">
            Fuegen Sie zuerst Fragen hinzu, um die Vorschau zu sehen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pruefung.abschnitte.map((abschnitt, aIndex) => (
            <div key={aIndex}>
              {/* Abschnitt-Header */}
              <div className="mb-3 mt-6 first:mt-0">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-600 pb-2">
                  {abschnitt.titel}
                </h3>
                {abschnitt.beschreibung && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 italic">
                    {abschnitt.beschreibung}
                  </p>
                )}
              </div>

              {/* Fragen */}
              {abschnitt.fragenIds.map((frageId, fIndex) => {
                const frage = fragenMap[frageId]
                if (!frage) {
                  return (
                    <div key={frageId} className={`px-5 py-3 rounded-xl border text-sm ${fragenGeladen ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {fragenGeladen ? `Frage nicht gefunden: ${frageId}` : `${frageId} (laden...)`}
                    </div>
                  )
                }

                // Laufende Nummer ueber alle Abschnitte
                const vorherigeFragen = pruefung.abschnitte
                  .slice(0, aIndex)
                  .reduce((s, a) => s + a.fragenIds.length, 0)
                const frageNr = vorherigeFragen + fIndex + 1

                return (
                  <FrageVorschau key={frageId} frage={frage} nummer={frageNr} />
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Hinweise */}
      {gesamtFragen > 0 && (
        <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5 pt-2">
          {pruefung.ruecknavigation && <p>Alle Fragen koennen in beliebiger Reihenfolge beantwortet werden.</p>}
          <p>Antworten werden automatisch gespeichert.</p>
          {pruefung.sebErforderlich && <p className="text-amber-600 dark:text-amber-400">SEB erforderlich</p>}
        </div>
      )}

      {/* Druckbare Ansicht (Fullscreen-Overlay) */}
      {druckAnsichtOffen && (
        <DruckAnsicht
          pruefung={pruefung}
          fragenMap={fragenMap}
          onSchliessen={() => setDruckAnsichtOffen(false)}
        />
      )}
    </div>
  )
}

/** Read-only Vorschau einer einzelnen Frage wie SuS sie sehen */
function FrageVorschau({ frage, nummer }: { frage: Frage; nummer: number }) {
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext
    : 'aufgabentext' in frage ? (frage as { aufgabentext: string }).aufgabentext
    : 'kontext' in frage ? (frage as { kontext: string }).kontext : ''
  const zeitbedarf = frage.zeitbedarf ?? schaetzeZeitbedarf(frage)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 mb-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Frage {nummer}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${fachbereichFarbe(frage.fachbereich)}`}>
            {frage.fachbereich}
          </span>
          {/* Typ (Icon + Label) — Cluster G Phase 5 */}
          <FragetypIcon typ={frage.typ} className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden />
          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300">
            {typLabel(frage.typ)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            ~{zeitbedarf} Min.
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded">
            {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
          </span>
        </div>
      </div>

      {/* Fragetext */}
      {fragetext && (
        <div className="text-sm text-slate-800 dark:text-slate-100 mb-4 leading-relaxed">
          {formatFragetext(fragetext)}
        </div>
      )}

      {/* Bild-Anhänge inline anzeigen */}
      {frage.anhaenge && frage.anhaenge.length > 0 && (
        <AnhangMedien anhaenge={frage.anhaenge} />
      )}

      {/* Typ-spezifische Vorschau */}
      {frage.typ === 'mc' && <MCVorschau frage={frage as MCFrage} />}
      {frage.typ === 'freitext' && <FreitextVorschau frage={frage as FreitextFrage} />}
      {frage.typ === 'lueckentext' && <LueckentextVorschau frage={frage as LueckentextFrage} />}
      {frage.typ === 'zuordnung' && <ZuordnungVorschau frage={frage as ZuordnungFrage} />}
      {frage.typ === 'richtigfalsch' && <RichtigFalschVorschau frage={frage as RichtigFalschFrage} />}
      {frage.typ === 'berechnung' && <BerechnungVorschau frage={frage as BerechnungFrage} />}
      {frage.typ === 'buchungssatz' && <BuchungssatzVorschau frage={frage as BuchungssatzFrage} />}
      {frage.typ === 'tkonto' && <TKontoVorschau frage={frage as TKontoFrage} />}
      {frage.typ === 'kontenbestimmung' && <KontenbestimmungVorschau frage={frage as KontenbestimmungFrage} />}
      {frage.typ === 'bilanzstruktur' && <BilanzERVorschau frage={frage as BilanzERFrage} />}
      {frage.typ === 'aufgabengruppe' && <AufgabengruppeVorschau frage={frage as AufgabengruppeFrage} />}
      {frage.typ === 'visualisierung' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-center space-y-2">
          <span className="text-2xl">🖌</span>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Zeichenaufgabe</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Interaktive Vorschau in der SuS-Ansicht verfügbar</p>
        </div>
      )}
      {frage.typ === 'pdf' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-center space-y-2">
          <span className="text-2xl">📄</span>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">PDF-Annotation</p>
          {ermittlePdfQuelle(frage)?.dateiname && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Datei: {ermittlePdfQuelle(frage)?.dateiname}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">Interaktive Vorschau in der SuS-Ansicht verfügbar</p>
        </div>
      )}
    </div>
  )
}
