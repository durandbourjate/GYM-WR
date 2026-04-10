import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { BilanzERFrage } from '../../../types/ueben/fragen'
import FeedbackBox from './FeedbackBox'

export default function BilanzFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'bilanzstruktur') return null
  const beFrage = frage as BilanzERFrage

  const kontenMitSaldi = beFrage.kontenMitSaldi || []
  const loesung = beFrage.loesung
  const istBilanz = beFrage.modus !== 'erfolgsrechnung'
  const linksLabel = istBilanz ? 'Aktiven' : 'Aufwand'
  const rechtsLabel = istBilanz ? 'Passiven' : 'Ertrag'

  const [links, setLinks] = useState<string[]>([])
  const [rechts, setRechts] = useState<string[]>([])
  const [bilanzsumme, setBilanzsumme] = useState('')

  const toggleKonto = (kontonummer: string) => {
    if (disabled) return
    // Konto auf eine Seite zuordnen oder zwischen Seiten wechseln
    if (links.includes(kontonummer)) {
      setLinks(links.filter(n => n !== kontonummer))
      setRechts([...rechts, kontonummer])
    } else if (rechts.includes(kontonummer)) {
      setRechts(rechts.filter(n => n !== kontonummer))
    } else {
      setLinks([...links, kontonummer])
    }
  }

  const getSeite = (kontonummer: string): 'links' | 'rechts' | 'none' => {
    if (links.includes(kontonummer)) return 'links'
    if (rechts.includes(kontonummer)) return 'rechts'
    return 'none'
  }

  const handleAbsenden = () => {
    if (disabled) return
    onAntwort({
      typ: 'bilanz',
      aktiven: links,
      passiven: rechts,
      bilanzsumme: parseFloat(bilanzsumme) || 0,
    })
  }

  // Korrekte Zuordnung aus loesung extrahieren
  const korrekteAktiven = loesung?.bilanz?.aktivSeite?.gruppen?.flatMap(g => g.konten) || []
  const korrektePassiven = loesung?.bilanz?.passivSeite?.gruppen?.flatMap(g => g.konten) || []
  const korrekteBilanzsumme = loesung?.bilanz?.bilanzsumme

  const alleZugeordnet = kontenMitSaldi.every(k => links.includes(k.kontonummer) || rechts.includes(k.kontonummer))

  return (
    <div className="space-y-4">
      {/* Konten-Liste zum Zuordnen */}
      <div className="space-y-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Klicke auf ein Konto: 1× = {linksLabel}, 2× = {rechtsLabel}, 3× = entfernen
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {kontenMitSaldi.map((k) => {
            const seite = getSeite(k.kontonummer)
            const korrektSeite = feedbackSichtbar && loesung
              ? (korrekteAktiven.includes(k.kontonummer) ? 'links' : korrektePassiven.includes(k.kontonummer) ? 'rechts' : null)
              : null
            const istRichtig = feedbackSichtbar && korrektSeite === seite

            return (
              <button
                key={k.kontonummer}
                onClick={() => toggleKonto(k.kontonummer)}
                disabled={disabled}
                className={`p-3 rounded-lg border-2 text-left text-sm min-h-[48px] flex justify-between items-center transition-colors
                  ${seite === 'links' ? 'border-slate-400 bg-slate-50 dark:bg-slate-900/30' : ''}
                  ${seite === 'rechts' ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30' : ''}
                  ${seite === 'none' ? 'border-slate-200 dark:border-slate-600' : ''}
                  ${feedbackSichtbar && istRichtig ? 'ring-2 ring-green-400' : ''}
                  ${feedbackSichtbar && !istRichtig && seite !== 'none' ? 'ring-2 ring-red-400' : ''}
                  ${disabled ? 'cursor-default' : 'cursor-pointer hover:border-slate-400'}
                `}
              >
                <span className="dark:text-white">
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400 mr-2">{k.kontonummer}</span>
                  {k.name && <span className="text-sm mr-2">{k.name}</span>}
                </span>
                <span className="font-mono text-sm dark:text-white">{k.saldo.toLocaleString('de-CH')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legende */}
      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-400 inline-block" /> {linksLabel}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-400 inline-block" /> {rechtsLabel}
        </span>
      </div>

      {/* Bilanzsumme */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {istBilanz ? 'Bilanzsumme' : 'Total'}:
        </label>
        <input
          type="number"
          value={bilanzsumme}
          onChange={(e) => setBilanzsumme(e.target.value)}
          disabled={disabled}
          placeholder="CHF"
          className={`w-32 p-2 rounded-lg border text-sm text-right min-h-[44px] dark:bg-slate-800 dark:text-white
            ${feedbackSichtbar && korrekteBilanzsumme !== undefined
              ? (parseFloat(bilanzsumme) === korrekteBilanzsumme ? 'border-green-400 ring-2 ring-green-400' : 'border-red-400 ring-2 ring-red-400')
              : 'border-slate-300 dark:border-slate-600'}
          `}
        />
      </div>

      {!disabled && alleZugeordnet && bilanzsumme && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={beFrage.musterlosung} />}
    </div>
  )
}
