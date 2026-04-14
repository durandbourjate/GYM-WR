import DOMPurify from 'dompurify'
import type { SchuelerKorrektur, SchuelerAbgabe, FragenBewertung } from '../../../types/korrektur.ts'
import type { Frage, MCFrage, PDFAnnotation } from '../../../types/fragen.ts'
import type { PruefungsKorrektur } from '../../../types/korrektur.ts'
import type { NotenConfig } from '../../../types/pruefung.ts'
import type { Antwort } from '../../../types/antworten.ts'
import { effektivePunkte, berechneNote } from '../../../utils/korrekturUtils.ts'
import { fachbereichFarbe } from '../../../utils/fachUtils.ts'
import { useSchulConfig } from '../../../store/schulConfigStore.ts'

interface Props {
  schueler: SchuelerKorrektur
  abgabe: SchuelerAbgabe | undefined
  fragen: Frage[]
  korrektur: PruefungsKorrektur
  notenConfig?: Partial<NotenConfig>
  onSchliessen: () => void
}

/** Wandelt Antwort in lesbaren Text um (für Nicht-Freitext-Typen) */
function antwortAlsText(antwort: Antwort | undefined, frage: Frage): string {
  if (!antwort) return '(keine Antwort)'

  switch (antwort.typ) {
    case 'mc':
      if (antwort.gewaehlteOptionen.length === 0) return '(keine Auswahl)'
      if (frage.typ === 'mc') {
        return antwort.gewaehlteOptionen
          .map((id) => (frage as MCFrage).optionen.find((o) => o.id === id)?.text ?? id)
          .join(', ')
      }
      return antwort.gewaehlteOptionen.join(', ')

    case 'zuordnung': {
      const paare = Object.entries(antwort.zuordnungen)
      if (paare.length === 0) return '(keine Zuordnung)'
      return paare.map(([links, rechts]) => `${links} → ${rechts}`).join(', ')
    }

    case 'lueckentext': {
      const eintraege = Object.entries(antwort.eintraege)
      if (eintraege.length === 0) return '(keine Einträge)'
      return eintraege
        .sort(([a], [b]) => a.localeCompare(b, 'de', { numeric: true }))
        .map(([_id, text], i) => `Lücke ${i + 1}: ${text || '–'}`)
        .join(', ')
    }

    case 'richtigfalsch': {
      const bewertungen = Object.entries(antwort.bewertungen)
      if (bewertungen.length === 0) return '(keine Angaben)'
      return bewertungen
        .sort(([a], [b]) => a.localeCompare(b, 'de', { numeric: true }))
        .map(([_id, wert], i) => `Aussage ${i + 1}: ${wert ? 'R' : 'F'}`)
        .join(', ')
    }

    case 'berechnung': {
      const ergebnisse = Object.entries(antwort.ergebnisse)
      if (ergebnisse.length === 0 && !antwort.rechenweg) return '(keine Angaben)'
      const teile = ergebnisse
        .sort(([a], [b]) => a.localeCompare(b, 'de', { numeric: true }))
        .map(([_id, wert], i) => `Ergebnis ${i + 1}: ${wert || '–'}`)
      if (antwort.rechenweg) teile.push(`Rechenweg: ${antwort.rechenweg}`)
      return teile.join(', ')
    }

    case 'buchungssatz': {
      if (antwort.buchungen.length === 0) return '(keine Buchungen)'
      return antwort.buchungen.map((b, i) => {
        const soll = `${b.sollKonto || '?'}: ${b.betrag}`
        const haben = `${b.habenKonto || '?'}: ${b.betrag}`
        return `Buchung ${i + 1}: Soll [${soll}] / Haben [${haben}]`
      }).join('; ')
    }

    case 'tkonto': {
      if (antwort.konten.length === 0) return '(keine T-Konten)'
      return antwort.konten.map((k, i) => {
        const left = k.eintraegeLinks.map(e => `${e.gegenkonto}: ${e.betrag}`).join(', ')
        const right = k.eintraegeRechts.map(e => `${e.gegenkonto}: ${e.betrag}`).join(', ')
        const saldoText = k.saldo ? (k.saldo.betragLinks ? ` Saldo Links: ${k.saldo.betragLinks}` : k.saldo.betragRechts ? ` Saldo Rechts: ${k.saldo.betragRechts}` : '') : ''
        return `T-Konto ${i + 1}: Links [${left}] | Rechts [${right}]${saldoText}`
      }).join('; ')
    }

    case 'kontenbestimmung': {
      const entries = Object.entries(antwort.aufgaben)
      if (entries.length === 0) return '(keine Antworten)'
      return entries.map(([_id, a]) =>
        a.antworten.map(ant => [ant.kontonummer, ant.kategorie, ant.seite].filter(Boolean).join(' / ')).join(', ')
      ).join('; ')
    }

    case 'bilanzstruktur': {
      const parts: string[] = []
      if (antwort.bilanz) {
        const links = antwort.bilanz.linkeSeite.gruppen.flatMap(g => g.konten.map(k => k.nr)).length
        const rechts = antwort.bilanz.rechteSeite.gruppen.flatMap(g => g.konten.map(k => k.nr)).length
        parts.push(`Bilanz: ${links}+${rechts} Konten`)
      }
      if (antwort.erfolgsrechnung) {
        const stufen = antwort.erfolgsrechnung.stufen.length
        parts.push(`ER: ${stufen} Stufen`)
      }
      return parts.length > 0 ? parts.join(', ') : '(leer)'
    }

    case 'visualisierung':
      if (antwort.bildLink) return '__VISUALISIERUNG_BILD__'
      return '(Zeichnung vorhanden — siehe Tool-Korrektur)'

    case 'freitext':
      return antwort.text || '(leer)'

    case 'pdf': {
      const pdfA = antwort as { typ: 'pdf'; annotationen: PDFAnnotation[] }
      return `${pdfA.annotationen?.length ?? 0} PDF-Annotationen`
    }

    default:
      return '(unbekannter Typ)'
  }
}

/** Punkte-Indikator: Volle Punktzahl, Teilpunkte oder Null */
function PunkteIndikator({ punkte, maxPunkte }: { punkte: number; maxPunkte: number }) {
  const safePunkte = Number.isFinite(punkte) ? punkte : 0
  const safeMax = Number.isFinite(maxPunkte) ? maxPunkte : 0
  const symbol = safePunkte >= safeMax ? '✓' : safePunkte > 0 ? '~' : '✗'
  const farbe = safePunkte >= safeMax
    ? 'text-green-700 print:text-green-800'
    : safePunkte > 0
      ? 'text-amber-700 print:text-amber-800'
      : 'text-red-700 print:text-red-800'

  return (
    <span className={`font-bold ${farbe}`}>
      {symbol} {safePunkte} / {safeMax}
    </span>
  )
}

/** Einzelne Frage in der PDF-Ansicht */
function PDFFrageBlock({ idx, frage, bewertung, antwort }: {
  idx: number
  frage: Frage
  bewertung: FragenBewertung
  antwort: Antwort | undefined
}) {
  const punkte = effektivePunkte(bewertung)
  const istFreitext = antwort?.typ === 'freitext'
  const istHTML = istFreitext && /<[^>]+>/.test(antwort.text)
  const istVisualisierungMitBild = antwort?.typ === 'visualisierung' && !!antwort.bildLink
  const fragetext = (frage as MCFrage).fragetext ?? frage.id

  return (
    <div className="korrektur-pdf-frage border border-slate-300 rounded-lg p-4 print:break-inside-avoid">
      {/* Frage-Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-slate-800 print:text-black">
            {idx + 1}.
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded print:border print:border-slate-400 ${fachbereichFarbe(frage.fachbereich)}`}>
            {frage.fachbereich}
          </span>
          <span className="text-xs text-slate-500 print:text-slate-600 capitalize">
            {frage.typ}
          </span>
        </div>
        <div className="text-sm shrink-0">
          <PunkteIndikator punkte={punkte} maxPunkte={bewertung.maxPunkte} />
        </div>
      </div>

      {/* Fragetext (gekürzt wenn sehr lang) */}
      <p className="text-sm text-slate-700 print:text-black mb-3 line-clamp-3">
        {fragetext}
      </p>

      {/* Schüler-Antwort */}
      <div className="mb-2">
        <p className="text-xs font-medium text-slate-500 print:text-slate-600 mb-1">Antwort:</p>
        {istVisualisierungMitBild && antwort?.typ === 'visualisierung' ? (
          <img
            src={antwort.bildLink}
            alt="Zeichnung"
            className="max-w-full rounded border border-slate-200 print:border-slate-300 bg-white"
          />
        ) : istHTML ? (
          <div
            className="text-sm text-slate-800 print:text-black bg-slate-50 print:bg-white rounded p-2 border border-slate-200 print:border-slate-300 prose-zusammenfassung"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(antwort.text) }}
          />
        ) : (
          <p className="text-sm text-slate-800 print:text-black bg-slate-50 print:bg-white rounded p-2 border border-slate-200 print:border-slate-300 whitespace-pre-wrap">
            {antwortAlsText(antwort, frage)}
          </p>
        )}
      </div>

      {/* LP-Kommentar oder KI-Feedback */}
      {bewertung.lpKommentar && (
        <div className="mt-2 p-2 bg-amber-50 print:bg-white border border-amber-200 print:border-amber-400 rounded text-sm">
          <p className="text-xs font-medium text-amber-700 print:text-amber-800 mb-0.5">Kommentar:</p>
          <p className="text-slate-800 print:text-black">{bewertung.lpKommentar}</p>
        </div>
      )}
      {!bewertung.lpKommentar && bewertung.kiFeedback && (
        <div className="mt-2 p-2 bg-blue-50 print:bg-white border border-blue-200 print:border-blue-400 rounded text-sm">
          <p className="text-xs font-medium text-blue-700 print:text-blue-800 mb-0.5">Feedback:</p>
          <p className="text-slate-800 print:text-black">{bewertung.kiFeedback}</p>
        </div>
      )}
    </div>
  )
}

export default function KorrekturPDFAnsicht({ schueler, abgabe, fragen, korrektur, notenConfig, onSchliessen }: Props) {
  const { config } = useSchulConfig()
  // Punkte und Note berechnen
  const bewertungenListe = Object.values(schueler.bewertungen)
  const totalPunkte = bewertungenListe.reduce((s, b) => s + effektivePunkte(b), 0)
  const totalMax = bewertungenListe.reduce((s, b) => s + b.maxPunkte, 0)
  const berechneteNote = berechneNote(totalPunkte, totalMax, notenConfig)
  const note = schueler.noteOverride ?? berechneteNote
  const rundung = notenConfig?.rundung ?? 0.5

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto print:relative print:z-auto print:overflow-visible">
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
            {schueler.name} — Korrektur-PDF
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
        <div className="korrektur-pdf-header mb-6 pb-4 border-b-2 border-slate-300 print:border-slate-400">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 print:text-slate-600 tracking-wider uppercase mb-1">
                {config.schulName}
              </p>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black mb-1">
                {korrektur.pruefungTitel}
              </h1>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-600 dark:text-slate-400 print:text-slate-700">
                {korrektur.datum && (
                  <span>{new Date(korrektur.datum).toLocaleDateString('de-CH')}</span>
                )}
                <span>{korrektur.klasse}</span>
              </div>
            </div>
            {/* Note prominent */}
            <div className={`text-center px-4 py-2 rounded-lg border-2 ${
              note >= 4
                ? 'border-green-400 print:border-green-600 bg-green-50 print:bg-white'
                : 'border-red-400 print:border-red-600 bg-red-50 print:bg-white'
            }`}>
              <p className="text-xs text-slate-500 print:text-slate-600">Note</p>
              <p className={`text-2xl font-bold ${
                note >= 4
                  ? 'text-green-700 print:text-green-800'
                  : 'text-red-700 print:text-red-800'
              }`}>
                {note.toFixed(rundung < 0.5 ? 2 : 1)}
              </p>
            </div>
          </div>

          {/* Schüler-Info */}
          <div className="mt-3 pt-3 border-t border-slate-200 print:border-slate-300">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100 print:text-black">
                {schueler.name}
              </span>
              {schueler.klasse && (
                <span className="text-slate-500 print:text-slate-600">{schueler.klasse}</span>
              )}
              <span className="text-slate-500 print:text-slate-600">
                {totalPunkte} / {totalMax} Punkte
                ({totalMax > 0 ? Math.round(totalPunkte / totalMax * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Fragen */}
        <div className="flex flex-col gap-4 print:gap-3">
          {fragen.map((frage, idx) => {
            const bewertung = schueler.bewertungen[frage.id]
            if (!bewertung) return null
            const antwort = abgabe?.antworten[frage.id]

            return (
              <PDFFrageBlock
                key={frage.id}
                idx={idx}
                frage={frage}
                bewertung={bewertung}
                antwort={antwort}
              />
            )
          })}
        </div>

        {/* Zusammenfassung / Footer */}
        <div className="mt-6 pt-4 border-t-2 border-slate-300 print:border-slate-400">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-700 print:text-black">
              <span className="font-medium">Gesamtergebnis:</span>{' '}
              <span className="font-semibold">{totalPunkte} / {totalMax} Punkte</span>{' '}
              <span className="text-slate-500 print:text-slate-600">
                ({totalMax > 0 ? Math.round(totalPunkte / totalMax * 100) : 0}%)
              </span>
            </div>
            <div className={`text-lg font-bold px-3 py-1 rounded ${
              note >= 4
                ? 'text-green-700 print:text-green-800'
                : 'text-red-700 print:text-red-800'
            }`}>
              Note: {note.toFixed(rundung < 0.5 ? 2 : 1)}
            </div>
          </div>

          {/* Audio-Hinweis */}
          {schueler.audioGesamtkommentarId && (
            <p className="text-xs text-slate-500 print:text-slate-600 mt-2 italic">
              Ein mündlicher Gesamtkommentar ist verfügbar (Audio-Datei, nicht im Druck enthalten).
            </p>
          )}

          {/* Zeitstempel */}
          <p className="text-xs text-slate-400 print:text-slate-500 mt-4">
            Generiert am {new Date().toLocaleDateString('de-CH')} um {new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}
