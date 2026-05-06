import type { Frage, LueckentextFrage } from '../../../../types/fragen-storage'

/** Musterlösung-Box */
export default function MusterloesungBox({ frage }: { frage: Frage }) {
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
