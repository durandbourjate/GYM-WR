import type { AufgabengruppeFrage, InlineTeilaufgabe } from '../../../../../types/fragen-storage'
import { formatFragetext } from '../../../../../utils/textFormatierung.tsx'
import { BUCHSTABEN } from './util'

export default function AufgabengruppeDruck({ frage }: { frage: AufgabengruppeFrage }) {
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
