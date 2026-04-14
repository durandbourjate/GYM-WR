import { useState } from 'react'
import type { PruefungsConfig } from '../../../../types/pruefung.ts'
import type { Frage, FrageAnhang, MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage, RichtigFalschFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage, KontenbestimmungFrage, BilanzERFrage, AufgabengruppeFrage } from '../../../../types/fragen.ts'
import { kontoLabel } from '../../../../utils/kontenrahmen.ts'
import { formatDatum } from '../../../../utils/zeit.ts'
import { typLabel, fachbereichFarbe } from '../../../../utils/fachUtils.ts'
import MediaAnhang from '../../../MediaAnhang.tsx'
import { formatFragetext } from '../../../../utils/textFormatierung.tsx'
import DruckAnsicht from './DruckAnsicht.tsx'

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

/** Schaetzt den Zeitbedarf einer Frage in Minuten basierend auf Typ und Punktzahl */
function schaetzeZeitbedarf(frage: Frage): number {
  switch (frage.typ) {
    case 'mc': return Math.max(1, Math.ceil(frage.punkte * 0.5))
    case 'richtigfalsch': return Math.max(1, Math.ceil(frage.punkte * 0.5))
    case 'freitext': return Math.max(2, frage.punkte * 2)
    case 'lueckentext': return Math.max(1, frage.punkte)
    case 'zuordnung': return Math.max(1, frage.punkte)
    case 'berechnung': return Math.max(2, frage.punkte * 2)
    case 'buchungssatz': return Math.max(3, frage.punkte * 1.5)
    case 'tkonto': return Math.max(5, frage.punkte * 2)
    case 'kontenbestimmung': return Math.max(2, frage.punkte)
    case 'bilanzstruktur': return Math.max(10, frage.punkte * 3)
    case 'aufgabengruppe': return Math.max(5, frage.punkte * 2)
    default: return frage.punkte
  }
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
          {(frage as any).pdfDateiname && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Datei: {(frage as any).pdfDateiname}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">Interaktive Vorschau in der SuS-Ansicht verfügbar</p>
        </div>
      )}
    </div>
  )
}

function MCVorschau({ frage }: { frage: MCFrage }) {
  const buchstaben = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  return (
    <div className="space-y-2">
      {frage.optionen.map((option, idx) => (
        <div
          key={option.id}
          className="flex items-start gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
        >
          {/* Radio/Checkbox Indikator */}
          {frage.mehrfachauswahl ? (
            <div className="mt-0.5 w-4 h-4 rounded border-2 border-slate-300 dark:border-slate-500 shrink-0" />
          ) : (
            <div className="mt-0.5 w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-500 shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0 w-5">
            {buchstaben[idx] ?? String(idx + 1)}
          </span>
          <span className="text-sm text-slate-700 dark:text-slate-200">{option.text}</span>
        </div>
      ))}
      {frage.mehrfachauswahl && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Mehrere Antworten moeglich</p>
      )}
    </div>
  )
}

function FreitextVorschau({ frage }: { frage: FreitextFrage }) {
  const zeilen = frage.laenge === 'kurz' ? 3 : frage.laenge === 'lang' ? 10 : 5
  return (
    <textarea
      disabled
      placeholder={frage.hilfstextPlaceholder || 'Antwort eingeben...'}
      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 resize-none"
      rows={zeilen}
    />
  )
}

function LueckentextVorschau({ frage }: { frage: LueckentextFrage }) {
  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\})/)
  return (
    <div className="text-sm text-slate-700 dark:text-slate-200 leading-loose">
      {teile.map((teil, i) => {
        if (/^\{\{\d+\}\}$/.test(teil)) {
          return (
            <input
              key={i}
              disabled
              placeholder="..."
              className="inline-block w-28 mx-1 px-2 py-0.5 border border-slate-300 dark:border-slate-500 rounded bg-slate-50 dark:bg-slate-700/30 text-center text-sm text-slate-400 dark:text-slate-500"
            />
          )
        }
        return <span key={i}>{teil}</span>
      })}
    </div>
  )
}

function ZuordnungVorschau({ frage }: { frage: ZuordnungFrage }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
          Begriff
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
          Zuordnung
        </div>
      </div>
      {frage.paare.map((p, i) => (
        <div key={i} className="grid grid-cols-2 gap-3">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
            {p.links}
          </div>
          <select
            disabled
            className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-500 appearance-none"
          >
            <option>Zuordnung waehlen...</option>
          </select>
        </div>
      ))}
    </div>
  )
}

function RichtigFalschVorschau({ frage }: { frage: RichtigFalschFrage }) {
  return (
    <div className="space-y-2">
      {frage.aussagen.map((aussage) => (
        <div key={aussage.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
          <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{aussage.text}</span>
          <div className="flex gap-1 shrink-0">
            <button
              disabled
              className="px-3 py-1 text-xs font-medium border border-slate-300 dark:border-slate-500 rounded-l-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              Richtig
            </button>
            <button
              disabled
              className="px-3 py-1 text-xs font-medium border border-slate-300 dark:border-slate-500 rounded-r-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              Falsch
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function BerechnungVorschau({ frage }: { frage: BerechnungFrage }) {
  return (
    <div className="space-y-3">
      {frage.ergebnisse.map((erg) => (
        <div key={erg.id} className="flex items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{erg.label}:</span>
          <input
            disabled
            placeholder="..."
            className="w-32 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-1.5 text-sm text-slate-400 dark:text-slate-500 text-right"
          />
          {erg.einheit && (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{erg.einheit}</span>
          )}
        </div>
      ))}
      {frage.rechenwegErforderlich && (
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Rechenweg:</p>
          <textarea
            disabled
            placeholder="Rechenweg hier eingeben..."
            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/30 px-3 py-2 text-sm text-slate-400 dark:text-slate-500 resize-none"
            rows={4}
          />
        </div>
      )}
    </div>
  )
}

function BuchungssatzVorschau({ frage }: { frage: BuchungssatzFrage }) {
  return (
    <div className="space-y-3">
      {/* Geschäftsfall */}
      <div className="text-sm text-slate-700 dark:text-slate-200 mb-3 leading-relaxed whitespace-pre-wrap">
        {frage.geschaeftsfall}
      </div>
      {/* Buchungstabelle (leer für SuS) */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Soll</th>
              <th className="px-3 py-2 text-right font-medium">Betrag</th>
              <th className="px-3 py-2 text-left font-medium">Haben</th>
              <th className="px-3 py-2 text-right font-medium">Betrag</th>
            </tr>
          </thead>
          <tbody>
            {frage.buchungen.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>
                <td className="px-3 py-2 text-right text-slate-400 dark:text-slate-500">---</td>
                <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>
                <td className="px-3 py-2 text-right text-slate-400 dark:text-slate-500">---</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TKontoVorschau({ frage }: { frage: TKontoFrage }) {
  return (
    <div className="space-y-3">
      {/* Geschäftsfälle */}
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {frage.geschaeftsfaelle.map((gf, i) => (
            <li key={i}>{gf}</li>
          ))}
        </ol>
      )}
      {/* Leere T-Konten */}
      {frage.konten.map((konto) => (
        <div key={konto.id} className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{kontoLabel(konto.kontonummer)}</span>
          </div>
          <div className="grid grid-cols-2">
            <div className="px-3 py-2 border-r border-slate-200 dark:border-slate-600 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Soll
            </div>
            <div className="px-3 py-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
              Haben
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700">
            <div className="px-3 py-4 border-r border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 text-sm">
              ---
            </div>
            <div className="px-3 py-4 text-slate-400 dark:text-slate-500 text-sm">
              ---
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function KontenbestimmungVorschau({ frage }: { frage: KontenbestimmungFrage }) {
  const zeigeKonto = frage.modus === 'konto_bestimmen' || frage.modus === 'gemischt'
  const zeigeKategorie = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
  const zeigeSeite = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'

  return (
    <div className="space-y-3">
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium w-8">#</th>
              <th className="px-3 py-2 text-left font-medium">Geschaeftsfall</th>
              {zeigeKonto && <th className="px-3 py-2 text-left font-medium">Konto</th>}
              {zeigeKategorie && <th className="px-3 py-2 text-left font-medium">Kategorie</th>}
              {zeigeSeite && <th className="px-3 py-2 text-left font-medium">Buchungsseite</th>}
            </tr>
          </thead>
          <tbody>
            {frage.aufgaben.map((aufgabe, idx) =>
              aufgabe.erwarteteAntworten.map((_, aIdx) => (
                <tr key={`${aufgabe.id}-${aIdx}`} className="border-t border-slate-100 dark:border-slate-700">
                  {aIdx === 0 && (
                    <>
                      <td className="px-3 py-2 text-slate-400 dark:text-slate-500 align-top" rowSpan={aufgabe.erwarteteAntworten.length}>
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200 align-top" rowSpan={aufgabe.erwarteteAntworten.length}>
                        {aufgabe.text}
                      </td>
                    </>
                  )}
                  {zeigeKonto && <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>}
                  {zeigeKategorie && <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>}
                  {zeigeSeite && <td className="px-3 py-2 text-slate-400 dark:text-slate-500">---</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BilanzERVorschau({ frage }: { frage: BilanzERFrage }) {
  const zeigeBilanz = frage.modus === 'bilanz' || frage.modus === 'beides'
  const zeigeER = frage.modus === 'erfolgsrechnung' || frage.modus === 'beides'

  return (
    <div className="space-y-3">
      {/* Konten-Tabelle */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Nr.</th>
              <th className="px-3 py-2 text-left font-medium">Konto</th>
              <th className="px-3 py-2 text-right font-medium">Saldo (CHF)</th>
            </tr>
          </thead>
          <tbody>
            {frage.kontenMitSaldi.map((k) => (
              <tr key={k.kontonummer} className="border-t border-slate-100 dark:border-slate-700">
                <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-200">{k.kontonummer}</td>
                <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{kontoLabel(k.kontonummer)}</td>
                <td className="px-3 py-1.5 text-right font-mono text-slate-700 dark:text-slate-200">
                  {k.saldo.toLocaleString('de-CH', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hinweis */}
      <div className="text-xs text-slate-400 dark:text-slate-500 italic">
        {zeigeBilanz && 'SuS erstellen die Bilanzstruktur (Aktiven/Passiven mit Gruppen).'}
        {zeigeBilanz && zeigeER && ' '}
        {zeigeER && 'SuS erstellen die mehrstufige Erfolgsrechnung.'}
      </div>
    </div>
  )
}

function AufgabengruppeVorschau({ frage }: { frage: AufgabengruppeFrage }) {
  const teilaufgaben = frage.teilaufgaben ?? []
  const teilaufgabenIds = frage.teilaufgabenIds ?? []
  const anzahl = teilaufgaben.length || teilaufgabenIds.length
  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {anzahl} Teilaufgabe{anzahl !== 1 ? 'n' : ''}
      </div>
      <div className="space-y-1">
        {teilaufgaben.length > 0
          ? teilaufgaben.map((ta, i) => (
              <div key={ta.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {String.fromCharCode(97 + i)})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{ta.typ}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{ta.fragetext || '(kein Text)'}</span>
                <span className="text-xs text-slate-400">{ta.punkte} P.</span>
              </div>
            ))
          : teilaufgabenIds.map((id, i) => (
              <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded text-sm">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {String.fromCharCode(97 + i)})
                </span>
                <code className="text-xs font-mono text-slate-500 dark:text-slate-400">{id}</code>
              </div>
            ))
        }
      </div>
    </div>
  )
}

/** Zeigt alle Medien-Anhänge inline an */
function AnhangMedien({ anhaenge }: { anhaenge: FrageAnhang[] }) {
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  if (!anhaenge || anhaenge.length === 0) return null

  const lightboxAnhang = lightboxId ? anhaenge.find((a) => a.id === lightboxId) : null

  return (
    <>
      <div className="space-y-2 mt-2">
        {anhaenge.map((a) => (
          <MediaAnhang
            key={a.id}
            anhang={a}
            bildSz={a.bildGroesse === 'klein' ? 'w200' : a.bildGroesse === 'gross' ? 'w800' : 'w400'}
            onLightbox={setLightboxId}
          />
        ))}
      </div>
      {lightboxAnhang && lightboxAnhang.mimeType.startsWith('image/') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setLightboxId(null)}>
          <button type="button" onClick={() => setLightboxId(null)} className="absolute top-4 right-4 w-10 h-10 text-white text-2xl bg-black/40 rounded-full hover:bg-black/60 cursor-pointer flex items-center justify-center">×</button>
          <img
            src={`https://drive.google.com/thumbnail?id=${lightboxAnhang.driveFileId}&sz=w800`}
            alt={lightboxAnhang.beschreibung || lightboxAnhang.dateiname}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
