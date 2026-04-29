import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import type { Frage, FrageAnhang } from '../../../types/fragen-storage'

// Storage-Varianten der Fragetypen via Extract<Frage, ...> — damit narrowing aus
// der Storage-Union die `tags: (string|Tag)[]` + `_recht` + `poolVersion` Felder
// behält. Direkter Import der named Types liefert Core-Varianten (Tags=string[]),
// die strukturell inkompatibel sind.
type MCFrage = Extract<Frage, { typ: 'mc' }>
type RichtigFalschFrage = Extract<Frage, { typ: 'richtigfalsch' }>
type LueckentextFrage = Extract<Frage, { typ: 'lueckentext' }>
type ZuordnungFrage = Extract<Frage, { typ: 'zuordnung' }>
type BerechnungFrage = Extract<Frage, { typ: 'berechnung' }>
type KontenbestimmungFrage = Extract<Frage, { typ: 'kontenbestimmung' }>
type HotspotFrage = Extract<Frage, { typ: 'hotspot' }>
type BildbeschriftungFrage = Extract<Frage, { typ: 'bildbeschriftung' }>
type DragDropBildFrage = Extract<Frage, { typ: 'dragdrop_bild' }>
import type { Antwort } from '../../../types/antworten'
import type { KorrekturErgebnis } from '../../../utils/autoKorrektur'
import MediaAnhang from '../../MediaAnhang.tsx'
import AudioPlayer from '../../AudioPlayer.tsx'
import { toAssetUrl } from '../../../utils/assetUrl'
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from '../../../utils/ueben/fragetypNormalizer'
import { ermittleBildQuelle, ermittlePdfQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc, mediaQuelleZuIframeSrc } from '@shared/utils/mediaQuelleUrl'

interface Props {
  frage: Frage
  antwort: Antwort | undefined
  autoErgebnis: KorrekturErgebnis | null
}

/** Haupttext der Frage je nach Typ */
function frageHaupttext(frage: Frage): string {
  switch (frage.typ) {
    case 'buchungssatz':
      return frage.geschaeftsfall
    case 'tkonto':
    case 'kontenbestimmung':
    case 'bilanzstruktur':
      return frage.aufgabentext
    case 'aufgabengruppe':
      return frage.kontext
    default:
      return (frage as { fragetext: string }).fragetext ?? ''
  }
}

/** MC-Optionen mit Korrektheit-Anzeige */
function MCAnzeige({ frage, antwort }: { frage: MCFrage; antwort: Extract<Antwort, { typ: 'mc' }> | undefined }) {
  const gewaehlteIds = new Set(antwort?.gewaehlteOptionen ?? [])

  return (
    <div className="space-y-1 mt-2">
      {frage.optionen.map((option) => {
        const gewaehlt = gewaehlteIds.has(option.id)
        const korrekt = option.korrekt

        let bgClass = 'bg-slate-50 dark:bg-slate-700/50'
        if (gewaehlt && korrekt) bgClass = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
        else if (gewaehlt && !korrekt) bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'
        else if (!gewaehlt && korrekt) bgClass = 'bg-green-50/50 dark:bg-green-900/10'

        return (
          <div key={option.id} className={`flex items-start gap-2 px-3 py-1.5 rounded border ${bgClass}`}>
            <span className="text-sm mt-0.5 shrink-0">
              {gewaehlt ? (korrekt ? '✓' : '✗') : (korrekt ? '○' : '')}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-200">{option.text}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Richtig/Falsch-Aussagen mit R/F-Anzeige */
function RFAnzeige({ frage, antwort }: { frage: RichtigFalschFrage; antwort: Extract<Antwort, { typ: 'richtigfalsch' }> | undefined }) {
  return (
    <div className="space-y-1 mt-2">
      {frage.aussagen.map((aussage) => {
        const bewertung = antwort?.bewertungen[aussage.id]
        const hatGeantwortet = bewertung !== undefined
        const korrekt = hatGeantwortet && bewertung === aussage.korrekt

        let bgClass = 'bg-slate-50 dark:bg-slate-700/50'
        if (hatGeantwortet && korrekt) bgClass = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40'
        else if (hatGeantwortet && !korrekt) bgClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40'

        return (
          <div key={aussage.id} className={`flex items-start gap-2 px-3 py-1.5 rounded border ${bgClass}`}>
            <span className="text-sm font-medium mt-0.5 shrink-0 w-5 text-center">
              {hatGeantwortet ? (bewertung ? 'R' : 'F') : '–'}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{aussage.text}</span>
            {hatGeantwortet && !korrekt && (
              <span className="text-xs text-red-500 dark:text-red-400 shrink-0">
                (korrekt: {aussage.korrekt ? 'R' : 'F'})
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Freitext-Antwort (B52: HTML korrekt rendern wenn formatiert) */
function FreitextAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'freitext' }> | undefined }) {
  if (!antwort?.text) return <KeineAntwort />
  const istHTML = antwort.formatierung === 'html' || antwort.text.includes('<p>')
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      {istHTML ? (
        <div
          className="text-sm text-slate-700 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(antwort.text) }}
        />
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{antwort.text}</p>
      )}
    </div>
  )
}

/** Berechnung-Antwort */
function BerechnungAnzeige({ frage, antwort }: { frage: BerechnungFrage; antwort: Extract<Antwort, { typ: 'berechnung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.ergebnisse.map((erg) => {
        const eingabe = antwort.ergebnisse[erg.id] ?? ''
        return (
          <div key={erg.id} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{erg.label}:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{eingabe || '–'}</span>
            {erg.einheit && <span className="text-slate-400 dark:text-slate-500">{erg.einheit}</span>}
          </div>
        )
      })}
      {antwort.rechenweg && (
        <div className="pt-1 border-t border-slate-200 dark:border-slate-600 mt-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">Rechenweg:</span>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{antwort.rechenweg}</p>
        </div>
      )}
    </div>
  )
}

/** Lückentext-Antwort */
function LueckentextAnzeige({ frage, antwort }: { frage: LueckentextFrage; antwort: Extract<Antwort, { typ: 'lueckentext' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.luecken.map((luecke, i) => {
        const eingabe = antwort.eintraege[luecke.id] ?? ''
        return (
          <div key={luecke.id} className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Lücke {i + 1}:</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{eingabe || '–'}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Zuordnung-Antwort */
function ZuordnungAnzeige({ frage, antwort }: { frage: ZuordnungFrage; antwort: Extract<Antwort, { typ: 'zuordnung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.paare.map((paar) => {
        const zugeordnet = antwort.zuordnungen[paar.links]
        const korrekt = zugeordnet === paar.rechts
        return (
          <div key={paar.links} className="flex items-center gap-2 text-sm">
            <span className="text-slate-700 dark:text-slate-200">{paar.links}</span>
            <span className="text-slate-400">→</span>
            <span className={`font-medium ${korrekt ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {zugeordnet || '–'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Buchungssatz-Antwort */
function BuchungssatzAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'buchungssatz' }> | undefined }) {
  if (!antwort || antwort.buchungen.length === 0) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-2">
      {antwort.buchungen.map((b, i) => (
        <div key={b.id ?? i} className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Buchung {i + 1}:</span>
          <div className="flex gap-4 mt-0.5">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Soll: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {b.sollKonto || '?'}: {b.betrag}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Haben: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {b.habenKonto || '?'}: {b.betrag}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** T-Konto-Antwort */
function TKontoAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'tkonto' }> | undefined }) {
  if (!antwort || antwort.konten.length === 0) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-2">
      {antwort.konten.map((k, i) => (
        <div key={k.id ?? i} className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            T-Konto {i + 1}{k.beschriftungLinks ? ` (${k.beschriftungLinks})` : ''}:
          </span>
          <div className="flex gap-4 mt-0.5">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Links: </span>
              {k.eintraegeLinks.map((e, j) => (
                <span key={j} className="text-slate-700 dark:text-slate-200">
                  {e.gegenkonto}: {e.betrag}{j < k.eintraegeLinks.length - 1 ? ', ' : ''}
                </span>
              ))}
              {k.eintraegeLinks.length === 0 && <span className="text-slate-400">–</span>}
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Rechts: </span>
              {k.eintraegeRechts.map((e, j) => (
                <span key={j} className="text-slate-700 dark:text-slate-200">
                  {e.gegenkonto}: {e.betrag}{j < k.eintraegeRechts.length - 1 ? ', ' : ''}
                </span>
              ))}
              {k.eintraegeRechts.length === 0 && <span className="text-slate-400">–</span>}
            </div>
          </div>
          {k.saldo && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Saldo: {k.saldo.betragLinks ? `Links ${k.saldo.betragLinks}` : ''}{k.saldo.betragRechts ? `Rechts ${k.saldo.betragRechts}` : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** Kontenbestimmung-Antwort */
function KontenbestimmungAnzeige({ frage, antwort }: { frage: KontenbestimmungFrage; antwort: Extract<Antwort, { typ: 'kontenbestimmung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-1">
      {frage.aufgaben.map((aufgabe) => {
        const antwortAufgabe = antwort.aufgaben[aufgabe.id]
        return (
          <div key={aufgabe.id} className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">{aufgabe.text}: </span>
            <span className="text-slate-700 dark:text-slate-200">
              {antwortAufgabe?.antworten.map(a => [a.kontonummer, a.kategorie, a.seite].filter(Boolean).join(' / ')).join(', ') || '–'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Bilanz/ER-Antwort (kompakte Zusammenfassung) */
function BilanzERAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'bilanzstruktur' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-2">
      {antwort.bilanz && (
        <div className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bilanz:</span>
          <div className="flex gap-4 mt-0.5">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{antwort.bilanz.linkeSeite.label}: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {antwort.bilanz.linkeSeite.gruppen.flatMap(g => g.konten).length} Konten
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{antwort.bilanz.rechteSeite.label}: </span>
              <span className="text-slate-700 dark:text-slate-200">
                {antwort.bilanz.rechteSeite.gruppen.flatMap(g => g.konten).length} Konten
              </span>
            </div>
          </div>
        </div>
      )}
      {antwort.erfolgsrechnung && (
        <div className="text-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Erfolgsrechnung:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-200">
            {antwort.erfolgsrechnung.stufen.length} Stufen
            {antwort.erfolgsrechnung.gewinnVerlust != null && ` | Ergebnis: ${antwort.erfolgsrechnung.gewinnVerlust}`}
          </span>
        </div>
      )}
    </div>
  )
}

/** Formel-Antwort (LaTeX via KaTeX) */
function FormelAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'formel' }> | undefined }) {
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (!antwort?.latex) return
    import('katex').then((katex) => {
      try {
        setHtml(katex.default.renderToString(antwort.latex, { throwOnError: false, displayMode: true }))
      } catch {
        setHtml('')
      }
    })
  }, [antwort?.latex])

  if (!antwort?.latex) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">Eingegebene Formel:</span>
      {html ? (
        <div className="mt-1" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code className="text-sm text-slate-700 dark:text-slate-200 block mt-1">{antwort.latex}</code>
      )}
    </div>
  )
}

/** Zeichnung/Visualisierung-Antwort (PNG-Export) */
function VisualisierungAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'visualisierung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  if (antwort.bildLink) {
    return (
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
        <img src={antwort.bildLink} alt="SuS-Zeichnung" className="max-w-full border border-slate-200 dark:border-slate-600 rounded" />
      </div>
    )
  }
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-sm italic text-slate-400">[Zeichnungsdaten vorhanden, kein Bild-Export]</span>
    </div>
  )
}

/** PDF-Annotation-Antwort mit PDF-Vorschau */
function PDFAnnotationAnzeige({ frage, antwort }: { frage: Frage; antwort: Extract<Antwort, { typ: 'pdf' }> | undefined }) {
  const pdfAnhang = ('anhaenge' in frage ? (frage as { anhaenge?: FrageAnhang[] }).anhaenge : [])?.find(a => a.mimeType === 'application/pdf')
  const pdfQuelle = ermittlePdfQuelle(frage as Parameters<typeof ermittlePdfQuelle>[0])
  const pdfDateiname = 'pdfDateiname' in frage ? (frage as { pdfDateiname?: string }).pdfDateiname : 'Dokument'

  const hatPdf = Boolean(pdfAnhang || pdfQuelle)

  return (
    <div className="mt-2 space-y-2">
      {/* PDF-Vorschau */}
      {hatPdf && (
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">📄 {pdfDateiname}</span>
          {pdfAnhang ? (
            <MediaAnhang anhang={pdfAnhang} />
          ) : pdfQuelle ? (
            <iframe
              src={mediaQuelleZuIframeSrc(pdfQuelle, toAssetUrl)}
              className="w-full rounded border border-slate-200 dark:border-slate-600"
              style={{ height: '400px' }}
              title={pdfDateiname}
            />
          ) : null}
        </div>
      )}
      {/* Annotationsinfo */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {antwort ? `${antwort.annotationen?.length ?? 0} Annotationen (Markierungen, Kommentare, Freihand)` : 'Keine Antwort'}
        </span>
      </div>
    </div>
  )
}

/** Audio-Antwort */
function AudioAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'audio' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  const src = antwort.aufnahmeUrl
  if (!src) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
        Aufnahme ({antwort.dauer ? `${Math.round(antwort.dauer)}s` : '–'})
      </span>
      <AudioPlayer src={src} />
    </div>
  )
}

/** Code-Antwort */
function CodeAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'code' }> | undefined }) {
  if (!antwort?.code) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 mt-2 overflow-x-auto">
      <pre className="text-sm text-slate-700 dark:text-slate-200 px-3 py-2 font-mono whitespace-pre-wrap">{antwort.code}</pre>
    </div>
  )
}

/** Sortierung-Antwort */
function SortierungAnzeige({ antwort }: { antwort: Extract<Antwort, { typ: 'sortierung' }> | undefined }) {
  if (!antwort) return <KeineAntwort />
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
      {antwort.reihenfolge.map((item, i) => (
        <div key={i} className="text-sm text-slate-700 dark:text-slate-200">
          {i + 1}. {item}
        </div>
      ))}
    </div>
  )
}

/** Hotspot-Antwort mit Bild + Markierungen */
function HotspotAnzeige({ frage, antwort }: { frage: HotspotFrage; antwort: Extract<Antwort, { typ: 'hotspot' }> | undefined }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const bildSrc = bildQuelle ? mediaQuelleZuImgSrc(bildQuelle, toAssetUrl) : null
  if (!antwort) return <>{bildSrc && <img src={bildSrc} alt="Hotspot" className="max-w-full rounded mt-2" />}<KeineAntwort /></>
  return (
    <div className="mt-2">
      {bildSrc && (
        <div className="relative inline-block">
          <img src={bildSrc} alt="Hotspot" className="max-w-full rounded" />
          {/* Korrekte Bereiche als SVG-Polygone (grün gestrichelt) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {(frage.bereiche ?? []).filter(b => Array.isArray(b.punkte) && b.punkte.length >= 3).map((b) => (
              <polygon
                key={b.id}
                points={b.punkte.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(34,197,94,0.15)"
                stroke="#22c55e"
                strokeWidth="0.4"
                strokeDasharray="1,0.7"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {/* Bereich-Labels (als HTML, damit Text nicht skaliert wird) */}
          {(frage.bereiche ?? []).filter(b => Array.isArray(b.punkte) && b.punkte.length >= 3).map((b) => {
            const xs = b.punkte.map(p => p.x), ys = b.punkte.map(p => p.y)
            const cx = xs.reduce((s, v) => s + v, 0) / xs.length
            const cy = ys.reduce((s, v) => s + v, 0) / ys.length
            return (
              <span
                key={b.id + '-label'}
                className="absolute text-[10px] text-green-600 dark:text-green-400 bg-white/80 dark:bg-slate-800/80 px-1 rounded pointer-events-none"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
              >
                {b.label}
              </span>
            )
          })}
          {/* SuS-Klicks (rot) */}
          {antwort.klicks?.map((klick, i) => (
            <div key={i} className="absolute w-4 h-4 -ml-2 -mt-2 bg-red-500 rounded-full border-2 border-white opacity-80" style={{ left: `${klick.x}%`, top: `${klick.y}%` }} />
          ))}
        </div>
      )}
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {antwort.klicks?.length ?? 0} Markierungen gesetzt
      </div>
    </div>
  )
}

/** Bildbeschriftung-Antwort mit Bild + Labels an Positionen */
function BildbeschriftungAnzeige({ frage, antwort }: { frage: BildbeschriftungFrage; antwort: Extract<Antwort, { typ: 'bildbeschriftung' }> | undefined }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const bildSrc = bildQuelle ? mediaQuelleZuImgSrc(bildQuelle, toAssetUrl) : null
  return (
    <div className="mt-2">
      {bildSrc && (
        <div className="relative inline-block">
          <img src={bildSrc} alt="Bildbeschriftung" className="max-w-full rounded" />
          {/* Labels an ihren Positionen */}
          {frage.beschriftungen.map((label, i) => {
            const eingabe = antwort?.eintraege?.[label.id] ?? ''
            const korrekt = label.korrekt.some(k => k.toLowerCase() === eingabe.toLowerCase())
            return (
              <div key={label.id} className="absolute" style={{ left: `${label.position.x}%`, top: `${label.position.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${
                  !eingabe ? 'bg-slate-200/80 dark:bg-slate-600/80 border-slate-300 dark:border-slate-500'
                  : korrekt ? 'bg-green-100/90 dark:bg-green-900/60 border-green-400 dark:border-green-700'
                  : 'bg-red-100/90 dark:bg-red-900/60 border-red-400 dark:border-red-700'
                }`}>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{i + 1}</span>
                  <span className="text-slate-700 dark:text-slate-200">{eingabe || '—'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Textliste als Fallback / Zusatzinfo */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
        {frage.beschriftungen.map((label, i) => {
          const eingabe = antwort?.eintraege?.[label.id] ?? ''
          const korrekt = label.korrekt.some(k => k.toLowerCase() === eingabe.toLowerCase())
          return (
            <div key={label.id} className="text-sm flex items-center gap-2">
              <span className="shrink-0">{eingabe ? (korrekt ? '✓' : '✗') : '—'}</span>
              <span className="text-slate-500 dark:text-slate-400">Label {i + 1}:</span>
              <span className="text-slate-700 dark:text-slate-200">{eingabe || 'Keine Eingabe'}</span>
              {!korrekt && eingabe && <span className="text-xs text-slate-400">Erwartet: {label.korrekt.join(' / ')}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** DragDrop-Bild-Antwort mit Bild + Zonen + Labels */
function DragDropBildAnzeige({ frage: frageRaw, antwort: antwortRaw }: { frage: DragDropBildFrage; antwort: Extract<Antwort, { typ: 'dragdrop_bild' }> | undefined }) {
  const frage = normalisiereDragDropBild(frageRaw)
  const antwort = antwortRaw ? normalisiereDragDropAntwort(antwortRaw, frage) : undefined
  const labelMap = new Map(frage.labels.map(l => [l.id, l]))
  const bildQuelle = ermittleBildQuelle(frage)
  const bildSrc = bildQuelle ? mediaQuelleZuImgSrc(bildQuelle, toAssetUrl) : null
  function texteInZone(zoneId: string): string[] {
    if (!antwort) return []
    return Object.entries(antwort.zuordnungen)
      .filter(([, zid]) => zid === zoneId)
      .map(([lid]) => (labelMap.get(lid)?.text ?? '').trim())
      .filter(Boolean)
  }
  function istKorrekt(zone: typeof frage.zielzonen[number], texte: string[]): boolean {
    const sollSet = new Set(zone.korrekteLabels.map(s => s.trim().toLowerCase()))
    return texte.some(t => sollSet.has(t.toLowerCase()))
  }
  return (
    <div className="mt-2">
      {bildSrc && (
        <div className="relative inline-block">
          <img src={bildSrc} alt="Drag & Drop" className="max-w-full rounded" />
          {/* Zielzonen mit platzierten Labels */}
          {frage.zielzonen.filter(z => Array.isArray(z.punkte) && z.punkte.length >= 3).map((zone) => {
            const texte = texteInZone(zone.id)
            const hatAntwort = texte.length > 0
            const korrekt = istKorrekt(zone, texte)
            const xs = zone.punkte.map(p => p.x), ys = zone.punkte.map(p => p.y)
            const minX = Math.min(...xs), minY = Math.min(...ys)
            const breite = Math.max(...xs) - minX, hoehe = Math.max(...ys) - minY
            return (
              <div key={zone.id} className={`absolute border-2 flex items-center justify-center ${
                !hatAntwort ? 'border-dashed border-slate-400/60'
                : korrekt ? 'border-green-500 bg-green-500/15'
                : 'border-red-500 bg-red-500/15'
              }`} style={{ left: `${minX}%`, top: `${minY}%`, width: `${breite}%`, height: `${hoehe}%` }}>
                {hatAntwort && (
                  <span className={`text-xs font-medium px-1 rounded ${korrekt ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {texte.join(', ')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {/* Textliste als Zusatzinfo */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
        {frage.zielzonen.map((zone) => {
          const texte = texteInZone(zone.id)
          const hatAntwort = texte.length > 0
          const korrekt = istKorrekt(zone, texte)
          const erwartet = zone.korrekteLabels.join(' / ')
          return (
            <div key={zone.id} className="text-sm flex items-center gap-2">
              <span className="shrink-0">{hatAntwort ? (korrekt ? '✓' : '✗') : '—'}</span>
              <span className="text-slate-700 dark:text-slate-200">{hatAntwort ? texte.join(', ') : 'Nicht platziert'}</span>
              {!korrekt && hatAntwort && <span className="text-xs text-slate-400">Erwartet: {erwartet}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Platzhalter für fehlende Antwort */
function KeineAntwort() {
  return (
    <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2">
      <span className="text-sm italic text-slate-400 dark:text-slate-500">Keine Antwort</span>
    </div>
  )
}

/** Auto-Korrektur-Details */
function AutoKorrekturDetails({ ergebnis, frageTyp }: { ergebnis: KorrekturErgebnis; frageTyp: string }) {
  // MC und R/F werden bereits inline angezeigt → Details nur für andere Typen
  if (frageTyp === 'mc' || frageTyp === 'richtigfalsch') return null

  return (
    <div className="mt-2 space-y-0.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Auto-Korrektur: {ergebnis.erreichtePunkte}/{ergebnis.maxPunkte} Pkt.
      </span>
      {ergebnis.details.map((detail, i) => (
        <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
          detail.korrekt
            ? 'bg-green-50 dark:bg-green-900/15 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-300'
        }`}>
          <span className="shrink-0">{detail.korrekt ? '✓' : '✗'}</span>
          <span className="flex-1 truncate">{detail.bezeichnung}</span>
          <span className="tabular-nums shrink-0">{detail.erreicht}/{detail.max}</span>
          {detail.kommentar && (
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={detail.kommentar}>
              {detail.kommentar}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/** Musterlösung-Box */
function MusterloesungBox({ frage }: { frage: Frage }) {
  // Visualisierung mit Musterlösungsbild
  if (frage.typ === 'visualisierung' && frage.musterloesungBild) {
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        <img
          src={frage.musterloesungBild}
          alt="Musterlösung"
          className="mt-1 max-w-full rounded border border-amber-200 dark:border-amber-700/30"
        />
      </div>
    )
  }

  // Buchungssatz: korrekte Buchungen aus Frage-Daten
  if (frage.typ === 'buchungssatz') {
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        {frage.buchungen.map((b, i) => (
          <div key={b.id ?? i} className="text-sm mt-1 text-amber-800 dark:text-amber-200">
            <span className="text-xs text-amber-600 dark:text-amber-400">Buchung {i + 1}: </span>
            Soll [{b.sollKonto}: {b.betrag}]
            {' / '}
            Haben [{b.habenKonto}: {b.betrag}]
          </div>
        ))}
      </div>
    )
  }

  // T-Konto: korrekte Konten aus Frage-Daten
  if (frage.typ === 'tkonto') {
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        {frage.konten.map((k, i) => (
          <div key={k.id ?? i} className="text-sm mt-1 text-amber-800 dark:text-amber-200">
            <span className="text-xs text-amber-600 dark:text-amber-400">Konto {k.kontonummer}: </span>
            Soll [{k.eintraege.filter(e => e.seite === 'soll').map(e => `${e.gegenkonto}: ${e.betrag}`).join(', ')}]
            {' / '}
            Haben [{k.eintraege.filter(e => e.seite === 'haben').map(e => `${e.gegenkonto}: ${e.betrag}`).join(', ')}]
            {' → Saldo: '}{k.saldo.betrag} ({k.saldo.seite})
          </div>
        ))}
      </div>
    )
  }

  // Kontenbestimmung: erwartete Antworten
  if (frage.typ === 'kontenbestimmung') {
    const kf = frage
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        {kf.aufgaben.map((a) => (
          <div key={a.id} className="text-sm mt-1 text-amber-800 dark:text-amber-200">
            <span className="text-xs text-amber-600 dark:text-amber-400">{a.text}: </span>
            {a.erwarteteAntworten.map(e => [e.kontonummer, e.kategorie, e.seite].filter(Boolean).join(' / ')).join(', ')}
          </div>
        ))}
      </div>
    )
  }

  // Bilanz/ER: Lösungsstruktur
  if (frage.typ === 'bilanzstruktur') {
    const bf = frage
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        {bf.loesung.bilanz && (
          <div className="text-sm mt-1 text-amber-800 dark:text-amber-200">
            Bilanz: {bf.loesung.bilanz.aktivSeite.gruppen.length} Aktiv-Gruppen, {bf.loesung.bilanz.passivSeite.gruppen.length} Passiv-Gruppen | Bilanzsumme: {bf.loesung.bilanz.bilanzsumme}
          </div>
        )}
        {bf.loesung.erfolgsrechnung && (
          <div className="text-sm mt-1 text-amber-800 dark:text-amber-200">
            ER: {bf.loesung.erfolgsrechnung.stufen.length} Stufen
          </div>
        )}
      </div>
    )
  }

  // Lückentext: Korrekte Antworten als Musterlösung
  if (frage.typ === 'lueckentext') {
    const lf = frage as LueckentextFrage
    if (lf.luecken?.some(l => (l as { korrekteAntworten?: string[] }).korrekteAntworten?.length)) {
      return (
        <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
          {lf.luecken.map((l, i) => (
            <div key={l.id} className="text-sm mt-1 text-amber-800 dark:text-amber-200">
              <span className="text-xs text-amber-600 dark:text-amber-400">Lücke {i + 1}: </span>
              {(l as { korrekteAntworten?: string[] }).korrekteAntworten?.join(' / ') || '–'}
            </div>
          ))}
        </div>
      )
    }
  }

  // Allgemein: Text-Musterlösung
  if (frage.musterlosung) {
    return (
      <div className="mt-3 rounded border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/15 px-3 py-2">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Musterlösung:</span>
        <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap mt-1">{frage.musterlosung}</p>
      </div>
    )
  }

  return null
}

/** Vollansicht einer Frage in der Korrektur-Ansicht */
export default function KorrekturFrageVollansicht({ frage, antwort, autoErgebnis }: Props) {
  const text = frageHaupttext(frage)

  // Anhänge aus Frage extrahieren (Bilder, PDFs)
  const anhaenge = 'anhaenge' in frage ? (frage as { anhaenge?: FrageAnhang[] }).anhaenge : undefined

  return (
    <div>
      {/* Fragetext */}
      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-1">{text}</p>

      {/* Anhänge (Bilder, PDFs, Materialien) */}
      {anhaenge && anhaenge.length > 0 && (
        <div className="space-y-2 my-2">
          {anhaenge.map((a) => (
            <MediaAnhang key={a.id} anhang={a} />
          ))}
        </div>
      )}

      {/* Typ-spezifische Antwortdarstellung */}
      {frage.typ === 'mc' && (
        <MCAnzeige frage={frage} antwort={antwort?.typ === 'mc' ? antwort : undefined} />
      )}
      {frage.typ === 'richtigfalsch' && (
        <RFAnzeige frage={frage} antwort={antwort?.typ === 'richtigfalsch' ? antwort : undefined} />
      )}
      {frage.typ === 'freitext' && (
        <FreitextAnzeige antwort={antwort?.typ === 'freitext' ? antwort : undefined} />
      )}
      {frage.typ === 'berechnung' && (
        <BerechnungAnzeige frage={frage} antwort={antwort?.typ === 'berechnung' ? antwort : undefined} />
      )}
      {frage.typ === 'lueckentext' && (
        <LueckentextAnzeige frage={frage} antwort={antwort?.typ === 'lueckentext' ? antwort : undefined} />
      )}
      {frage.typ === 'zuordnung' && (
        <ZuordnungAnzeige frage={frage} antwort={antwort?.typ === 'zuordnung' ? antwort : undefined} />
      )}
      {frage.typ === 'buchungssatz' && (
        <BuchungssatzAnzeige antwort={antwort?.typ === 'buchungssatz' ? antwort : undefined} />
      )}
      {frage.typ === 'tkonto' && (
        <TKontoAnzeige antwort={antwort?.typ === 'tkonto' ? antwort : undefined} />
      )}
      {frage.typ === 'kontenbestimmung' && (
        <KontenbestimmungAnzeige frage={frage} antwort={antwort?.typ === 'kontenbestimmung' ? antwort : undefined} />
      )}
      {frage.typ === 'bilanzstruktur' && (
        <BilanzERAnzeige antwort={antwort?.typ === 'bilanzstruktur' ? antwort : undefined} />
      )}
      {frage.typ === 'formel' && (
        <FormelAnzeige antwort={antwort?.typ === 'formel' ? antwort : undefined} />
      )}
      {frage.typ === 'visualisierung' && (
        <VisualisierungAnzeige antwort={antwort?.typ === 'visualisierung' ? antwort : undefined} />
      )}
      {frage.typ === 'pdf' && (
        <PDFAnnotationAnzeige frage={frage} antwort={antwort?.typ === 'pdf' ? antwort : undefined} />
      )}
      {frage.typ === 'audio' && (
        <AudioAnzeige antwort={antwort?.typ === 'audio' ? antwort : undefined} />
      )}
      {frage.typ === 'code' && (
        <CodeAnzeige antwort={antwort?.typ === 'code' ? antwort : undefined} />
      )}
      {frage.typ === 'sortierung' && (
        <SortierungAnzeige antwort={antwort?.typ === 'sortierung' ? antwort : undefined} />
      )}
      {frage.typ === 'hotspot' && (
        <HotspotAnzeige frage={frage} antwort={antwort?.typ === 'hotspot' ? antwort : undefined} />
      )}
      {frage.typ === 'bildbeschriftung' && (
        <BildbeschriftungAnzeige frage={frage} antwort={antwort?.typ === 'bildbeschriftung' ? antwort : undefined} />
      )}
      {frage.typ === 'dragdrop_bild' && (
        <DragDropBildAnzeige frage={frage} antwort={antwort?.typ === 'dragdrop_bild' ? antwort : undefined} />
      )}

      {/* Auto-Korrektur-Details */}
      {autoErgebnis && <AutoKorrekturDetails ergebnis={autoErgebnis} frageTyp={frage.typ} />}

      {/* Musterlösung */}
      <MusterloesungBox frage={frage} />
    </div>
  )
}
