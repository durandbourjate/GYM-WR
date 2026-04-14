import type { PruefungsConfig } from '../../../../types/pruefung.ts'
import type {
  Frage, FrageAnhang, MCFrage, FreitextFrage, LueckentextFrage,
  ZuordnungFrage, RichtigFalschFrage, BerechnungFrage,
  BuchungssatzFrage, TKontoFrage, KontenbestimmungFrage,
  BilanzERFrage, AufgabengruppeFrage, SortierungFrage,
  InlineTeilaufgabe,
  HotspotFrage, BildbeschriftungFrage, DragDropBildFrage
} from '../../../../types/fragen.ts'
import { kontoLabel } from '../../../../utils/kontenrahmen.ts'
import { formatDatum } from '../../../../utils/zeit.ts'
import { typLabel } from '../../../../utils/fachUtils.ts'
import { useSchulConfig } from '../../../../store/schulConfigStore.ts'
import { formatFragetext } from '../../../../utils/textFormatierung.tsx'
import { istBild } from '../../../../utils/mediaUtils.ts'

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
    case 'sortierung': return <SortierungDruck frage={frage as SortierungFrage} />
    case 'visualisierung': return <ZeichenDruck />
    case 'pdf': return <PDFHinweis />
    case 'audio': return <DigitalHinweis typ="Audio-Aufnahme" />
    case 'code': return <CodeDruck />
    case 'formel': return <FormelDruck />
    case 'hotspot': return <HotspotDruck frage={frage as HotspotFrage} />
    case 'bildbeschriftung': return <BildbeschriftungDruck frage={frage as BildbeschriftungFrage} />
    case 'dragdrop_bild': return <DragDropBildDruck frage={frage as DragDropBildFrage} />
    default: return null
  }
}

// ============================================================
// Einzelne Fragetyp-Renderer
// ============================================================

const BUCHSTABEN = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function MCDruck({ frage }: { frage: MCFrage }) {
  return (
    <div className="space-y-1.5">
      {frage.optionen.map((option, idx) => (
        <div key={option.id} className="flex items-start gap-2 text-sm print:text-black">
          {frage.mehrfachauswahl ? (
            <span className="shrink-0 w-4 h-4 mt-0.5 border border-slate-400 print:border-black rounded-sm" />
          ) : (
            <span className="shrink-0 w-4 h-4 mt-0.5 border border-slate-400 print:border-black rounded-full" />
          )}
          <span className="font-medium text-slate-500 print:text-black shrink-0 w-5">
            {BUCHSTABEN[idx] ?? String(idx + 1)})
          </span>
          <span className="text-slate-700 dark:text-slate-200 print:text-black">{option.text}</span>
        </div>
      ))}
      {frage.mehrfachauswahl && (
        <p className="text-[10px] text-slate-400 print:text-slate-600 mt-1">Mehrere Antworten möglich</p>
      )}
    </div>
  )
}

function RichtigFalschDruck({ frage }: { frage: RichtigFalschFrage }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-slate-300 print:border-slate-400">
          <th className="text-left py-1 font-medium text-slate-600 print:text-black">Aussage</th>
          <th className="w-12 text-center py-1 font-medium text-slate-600 print:text-black">R</th>
          <th className="w-12 text-center py-1 font-medium text-slate-600 print:text-black">F</th>
        </tr>
      </thead>
      <tbody>
        {frage.aussagen.map((aussage) => (
          <tr key={aussage.id} className="border-b border-slate-200 print:border-slate-300">
            <td className="py-2 text-slate-700 print:text-black">{aussage.text}</td>
            <td className="text-center"><span className="inline-block w-4 h-4 border border-slate-400 print:border-black rounded-sm" /></td>
            <td className="text-center"><span className="inline-block w-4 h-4 border border-slate-400 print:border-black rounded-sm" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FreitextDruck({ frage }: { frage: FreitextFrage }) {
  const zeilen = frage.laenge === 'kurz' ? 4 : frage.laenge === 'lang' ? 14 : 8
  return (
    <div className="space-y-0">
      {Array.from({ length: zeilen }).map((_, i) => (
        <div key={i} className="druck-linie" />
      ))}
    </div>
  )
}

function LueckentextDruck({ frage }: { frage: LueckentextFrage }) {
  const teile = frage.textMitLuecken.split(/(\{\{\d+\}\})/)
  return (
    <div className="text-sm text-slate-700 print:text-black leading-loose">
      {teile.map((teil, i) => {
        if (/^\{\{\d+\}\}$/.test(teil)) {
          return <span key={i} className="inline-block w-28 mx-1 border-b border-slate-400 print:border-black">&nbsp;</span>
        }
        return <span key={i}>{teil}</span>
      })}
    </div>
  )
}

function ZuordnungDruck({ frage }: { frage: ZuordnungFrage }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-slate-300 print:border-slate-400">
          <th className="text-left py-1 font-medium text-slate-600 print:text-black w-1/2">Begriff</th>
          <th className="text-left py-1 font-medium text-slate-600 print:text-black w-1/2">Zuordnung</th>
        </tr>
      </thead>
      <tbody>
        {frage.paare.map((p, i) => (
          <tr key={i} className="border-b border-slate-200 print:border-slate-300">
            <td className="py-2 text-slate-700 print:text-black">{p.links}</td>
            <td className="py-2"><span className="inline-block w-full border-b border-dotted border-slate-400 print:border-black">&nbsp;</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BerechnungDruck({ frage }: { frage: BerechnungFrage }) {
  return (
    <div className="space-y-3">
      {frage.rechenwegErforderlich && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Rechenweg:</p>
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="druck-linie" />
            ))}
          </div>
        </div>
      )}
      {frage.ergebnisse.map((erg) => (
        <div key={erg.id} className="flex items-baseline gap-2 text-sm">
          <span className="font-medium text-slate-700 print:text-black">{erg.label}:</span>
          <span className="flex-1 border-b border-dotted border-slate-400 print:border-black">&nbsp;</span>
          {erg.einheit && <span className="text-slate-500 print:text-slate-700">{erg.einheit}</span>}
        </div>
      ))}
    </div>
  )
}

function BuchungssatzDruck({ frage }: { frage: BuchungssatzFrage }) {
  const anzahlZeilen = Math.max(frage.buchungen.length, 3)
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-700 print:text-black italic">{frage.geschaeftsfall}</p>
      <table className="w-full text-sm border-collapse border border-slate-300 print:border-slate-400">
        <thead>
          <tr className="bg-slate-50 print:bg-white">
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Soll</th>
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-right font-medium">Betrag</th>
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Haben</th>
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-right font-medium">Betrag</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: anzahlZeilen }).map((_, i) => (
            <tr key={i}>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 h-8">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TKontoDruck({ frage }: { frage: TKontoFrage }) {
  return (
    <div className="space-y-3">
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <div className="text-sm text-slate-700 print:text-black">
          <p className="font-medium mb-1">Geschäftsfälle:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            {frage.geschaeftsfaelle.map((gf, i) => (
              <li key={i}>{gf}</li>
            ))}
          </ol>
        </div>
      )}
      {/* T-Konto-Vorlagen */}
      <div className="grid grid-cols-2 gap-3 print:gap-2">
        {frage.konten.map((konto) => (
          <div key={konto.id} className="border border-slate-300 print:border-slate-400">
            {/* Konto-Header */}
            <div className="text-center text-xs font-bold border-b-2 border-slate-400 print:border-black py-1 bg-slate-50 print:bg-white text-slate-700 print:text-black">
              {kontoLabel(konto.kontonummer)}
            </div>
            {/* Soll / Haben */}
            <div className="grid grid-cols-2 divide-x divide-slate-300 print:divide-slate-400">
              <div className="text-center text-[10px] font-medium text-slate-500 print:text-slate-700 py-0.5 border-b border-slate-200 print:border-slate-300">Soll</div>
              <div className="text-center text-[10px] font-medium text-slate-500 print:text-slate-700 py-0.5 border-b border-slate-200 print:border-slate-300">Haben</div>
            </div>
            {/* Leere Zeilen */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-2 divide-x divide-slate-200 print:divide-slate-300 h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function KontenbestimmungDruck({ frage }: { frage: KontenbestimmungFrage }) {
  return (
    <table className="w-full text-sm border-collapse border border-slate-300 print:border-slate-400">
      <thead>
        <tr className="bg-slate-50 print:bg-white">
          <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">#</th>
          <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Aufgabe</th>
          {frage.modus !== 'kategorie_bestimmen' && (
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Konto</th>
          )}
          {frage.modus !== 'konto_bestimmen' && (
            <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-left font-medium">Kategorie</th>
          )}
          <th className="border border-slate-300 print:border-slate-400 px-2 py-1 text-center font-medium">S/H</th>
        </tr>
      </thead>
      <tbody>
        {(frage.aufgaben ?? []).map((aufgabe, i) => (
          <tr key={aufgabe.id}>
            <td className="border border-slate-300 print:border-slate-400 px-2 py-2 text-slate-600 print:text-black w-8">{i + 1}</td>
            <td className="border border-slate-300 print:border-slate-400 px-2 py-2 text-slate-700 print:text-black">{aufgabe.text}</td>
            {frage.modus !== 'kategorie_bestimmen' && (
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 w-32">&nbsp;</td>
            )}
            {frage.modus !== 'konto_bestimmen' && (
              <td className="border border-slate-300 print:border-slate-400 px-2 py-2 w-28">&nbsp;</td>
            )}
            <td className="border border-slate-300 print:border-slate-400 px-2 py-2 w-12">&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function BilanzDruck({ frage }: { frage: BilanzERFrage }) {
  return (
    <div className="space-y-3">
      {/* Konten als Referenz */}
      {frage.kontenMitSaldi.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Konten:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-700 print:text-black">
            {frage.kontenMitSaldi.map((k) => (
              <span key={k.kontonummer}>
                {kontoLabel(k.kontonummer)}: {k.saldo.toLocaleString('de-CH')}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Leere Bilanz-Struktur */}
      {(frage.modus === 'bilanz' || frage.modus === 'beides') && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Bilanz:</p>
          <div className="grid grid-cols-2 gap-0 border border-slate-300 print:border-slate-400">
            <div className="border-r border-slate-300 print:border-slate-400">
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Aktiven</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
            <div>
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Passiven</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Leere ER-Struktur */}
      {(frage.modus === 'erfolgsrechnung' || frage.modus === 'beides') && (
        <div>
          <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Erfolgsrechnung:</p>
          <div className="grid grid-cols-2 gap-0 border border-slate-300 print:border-slate-400">
            <div className="border-r border-slate-300 print:border-slate-400">
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Aufwand</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
            <div>
              <div className="text-center text-xs font-bold py-1 border-b border-slate-300 print:border-slate-400 bg-slate-50 print:bg-white">Ertrag</div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 border-b border-slate-200 print:border-slate-300 last:border-b-0" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AufgabengruppeDruck({ frage }: { frage: AufgabengruppeFrage }) {
  const teilaufgaben = frage.teilaufgaben ?? []
  const buchstaben = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  return (
    <div className="space-y-3 pl-3 border-l-2 border-slate-200 print:border-slate-300">
      {teilaufgaben.map((ta, i) => (
        <div key={ta.id} className="druck-frage">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-medium text-slate-700 print:text-black">
              {buchstaben[i] ?? String(i + 1)})
            </span>
            <span className="text-xs text-slate-500 print:text-slate-600">
              {ta.punkte} {ta.punkte === 1 ? 'Pt.' : 'Pt.'}
            </span>
          </div>
          {ta.fragetext && (
            <div className="text-sm text-slate-800 print:text-black mb-2 leading-relaxed">
              {formatFragetext(ta.fragetext)}
            </div>
          )}
          <TeilaufgabeInhalt ta={ta} />
        </div>
      ))}
    </div>
  )
}

function TeilaufgabeInhalt({ ta }: { ta: InlineTeilaufgabe }) {
  switch (ta.typ) {
    case 'mc': {
      const optionen = ta.optionen ?? []
      return (
        <div className="space-y-1">
          {optionen.map((opt, idx) => (
            <div key={opt.id} className="flex items-start gap-2 text-sm print:text-black">
              <span className="shrink-0 w-4 h-4 mt-0.5 border border-slate-400 print:border-black rounded-sm" />
              <span className="font-medium text-slate-500 print:text-black w-5">{BUCHSTABEN[idx]})</span>
              <span>{opt.text}</span>
            </div>
          ))}
        </div>
      )
    }
    case 'richtigfalsch': {
      const aussagen = ta.aussagen ?? []
      return (
        <table className="w-full text-sm border-collapse">
          <tbody>
            {aussagen.map((a) => (
              <tr key={a.id} className="border-b border-slate-200 print:border-slate-300">
                <td className="py-1 text-slate-700 print:text-black">{a.text}</td>
                <td className="w-8 text-center"><span className="inline-block w-3.5 h-3.5 border border-slate-400 print:border-black rounded-sm" /></td>
                <td className="w-8 text-center"><span className="inline-block w-3.5 h-3.5 border border-slate-400 print:border-black rounded-sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    case 'freitext': {
      const zeilen = ta.laenge === 'kurz' ? 3 : ta.laenge === 'lang' ? 10 : 6
      return (
        <div>{Array.from({ length: zeilen }).map((_, i) => <div key={i} className="druck-linie" />)}</div>
      )
    }
    case 'lueckentext': {
      const text = ta.textMitLuecken ?? ''
      const teile = text.split(/(\{\{\d+\}\})/)
      return (
        <div className="text-sm print:text-black leading-loose">
          {teile.map((t, i) => /^\{\{\d+\}\}$/.test(t)
            ? <span key={i} className="inline-block w-24 mx-1 border-b border-slate-400 print:border-black">&nbsp;</span>
            : <span key={i}>{t}</span>
          )}
        </div>
      )
    }
    case 'berechnung': {
      const ergebnisse = ta.ergebnisse ?? []
      return (
        <div className="space-y-2">
          {ta.rechenwegErforderlich && (
            <div>
              <p className="text-xs font-medium mb-1">Rechenweg:</p>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="druck-linie" />)}
            </div>
          )}
          {ergebnisse.map((e) => (
            <div key={e.id} className="flex items-baseline gap-2 text-sm">
              <span className="font-medium">{e.label}:</span>
              <span className="flex-1 border-b border-dotted border-slate-400 print:border-black">&nbsp;</span>
              {e.einheit && <span className="text-slate-500">{e.einheit}</span>}
            </div>
          ))}
        </div>
      )
    }
    case 'zuordnung': {
      const paare = ta.paare ?? []
      return (
        <div className="space-y-1 text-sm">
          {paare.map((p, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-1/2 text-slate-700 print:text-black">{p.links}</span>
              <span className="w-1/2 border-b border-dotted border-slate-400 print:border-black">&nbsp;</span>
            </div>
          ))}
        </div>
      )
    }
    default:
      // Sortierung, Code, Formel, Zeichnen etc. → liniertes Feld
      return (
        <div>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="druck-linie" />)}</div>
      )
  }
}

function SortierungDruck({ frage }: { frage: SortierungFrage }) {
  // Elemente in zufälliger Reihenfolge zeigen (für Druck: einfach alphabetisch)
  const gemischt = [...frage.elemente].sort(() => 0.5 - Math.random())
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 print:text-slate-600">Bringen Sie die folgenden Elemente in die richtige Reihenfolge:</p>
      <div className="flex flex-wrap gap-2">
        {gemischt.map((el, i) => (
          <span key={i} className="px-2 py-1 text-sm border border-slate-300 print:border-slate-400 rounded bg-slate-50 print:bg-white text-slate-700 print:text-black">
            {el}
          </span>
        ))}
      </div>
      <div className="space-y-0 mt-2">
        {frage.elemente.map((_, i) => (
          <div key={i} className="flex items-baseline gap-2 text-sm">
            <span className="text-slate-500 print:text-black w-6">{i + 1}.</span>
            <span className="flex-1 border-b border-dotted border-slate-400 print:border-black">&nbsp;</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ZeichenDruck() {
  return (
    <div className="border-2 border-slate-300 print:border-slate-400 rounded-lg h-48">
      <p className="text-xs text-slate-400 print:text-slate-500 p-2">Zeichne hier:</p>
    </div>
  )
}

function HotspotDruck({ frage }: { frage: HotspotFrage }) {
  return (
    <div className="space-y-2">
      {frage.bildUrl && (
        <img src={frage.bildUrl} alt="Hotspot-Bild" className="max-w-full rounded border border-slate-300 print:border-slate-400" />
      )}
      <p className="text-sm text-slate-600 print:text-black">
        Markiere {frage.bereiche?.length || 1} Stelle{(frage.bereiche?.length || 1) > 1 ? 'n' : ''} auf dem Bild.
      </p>
    </div>
  )
}

function BildbeschriftungDruck({ frage }: { frage: BildbeschriftungFrage }) {
  const beschriftungen = frage.beschriftungen || []
  return (
    <div className="space-y-3">
      {frage.bildUrl && (
        <div className="relative inline-block">
          <img src={frage.bildUrl} alt="Bildbeschriftung" className="max-w-full rounded border border-slate-300 print:border-slate-400" />
          {/* Nummerierte Marker auf dem Bild */}
          {beschriftungen.map((b, i) => (
            <div
              key={b.id}
              className="absolute w-5 h-5 rounded-full bg-slate-700 print:bg-black text-white text-[9px] font-bold flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${b.position.x}%`, top: `${b.position.y}%` }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}
      {/* Antwortlinien */}
      {beschriftungen.map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-200 print:bg-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
          <div className="druck-linie flex-1" />
        </div>
      ))}
    </div>
  )
}

function DragDropBildDruck({ frage }: { frage: DragDropBildFrage }) {
  const zielzonen = frage.zielzonen || []
  const labels = frage.labels || []
  return (
    <div className="space-y-3">
      {frage.bildUrl && (
        <div className="relative inline-block">
          <img src={frage.bildUrl} alt="Drag & Drop" className="max-w-full rounded border border-slate-300 print:border-slate-400" />
          {/* Nummerierte Zielzonen auf dem Bild */}
          {zielzonen.map((z, i) => (
            <div
              key={z.id}
              className="absolute border-2 border-dashed border-slate-500 print:border-black rounded flex items-center justify-center"
              style={{
                left: `${z.position.x}%`, top: `${z.position.y}%`,
                width: `${z.position.breite}%`, height: `${z.position.hoehe}%`,
              }}
            >
              <span className="text-xs font-bold text-slate-500 print:text-black">{String.fromCharCode(65 + i)}</span>
            </div>
          ))}
        </div>
      )}
      {/* Begriffe zum Zuordnen */}
      <div>
        <p className="text-xs font-medium text-slate-600 print:text-black mb-1">Ordne folgende Begriffe den Zonen (A, B, C...) zu:</p>
        <div className="grid grid-cols-2 gap-1">
          {labels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="dark:text-white">{label}</span>
              <span className="text-slate-400">→ Zone ___</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PDFHinweis() {
  return (
    <p className="text-sm italic text-slate-500 print:text-slate-600">
      📄 Diese Aufgabe ist nur digital verfügbar (PDF-Annotation).
    </p>
  )
}

function DigitalHinweis({ typ }: { typ: string }) {
  return (
    <p className="text-sm italic text-slate-500 print:text-slate-600">
      💻 {typ} — nur digital verfügbar.
    </p>
  )
}

function CodeDruck() {
  return (
    <div className="border border-slate-300 print:border-slate-400 rounded bg-slate-50 print:bg-white p-3">
      <p className="text-xs font-medium text-slate-600 print:text-black mb-2">Code:</p>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="druck-linie" />
      ))}
    </div>
  )
}

function FormelDruck() {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="font-medium text-slate-700 print:text-black">Formel:</span>
      <span className="flex-1 border-b border-dotted border-slate-400 print:border-black h-8">&nbsp;</span>
    </div>
  )
}
