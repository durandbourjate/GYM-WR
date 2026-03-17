import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { demoFragen } from '../../data/demoFragen.ts'
import type { Frage, Fachbereich, BloomStufe } from '../../types/fragen.ts'

interface Props {
  onHinzufuegen: (frageIds: string[]) => void
  onSchliessen: () => void
  bereitsVerwendet: string[]
}

/** Overlay-Panel zum Durchsuchen und Auswählen von Fragen aus der Fragenbank */
export default function FragenBrowser({ onHinzufuegen, onSchliessen, bereitsVerwendet }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [alleFragen, setAlleFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())

  // Filter
  const [suchtext, setSuchtext] = useState('')
  const [filterFachbereich, setFilterFachbereich] = useState<Fachbereich | ''>('')
  const [filterTyp, setFilterTyp] = useState<string>('')
  const [filterBloom, setFilterBloom] = useState<BloomStufe | ''>('')

  // Fragen laden
  useEffect(() => {
    async function lade(): Promise<void> {
      if (istDemoModus || !apiService.istKonfiguriert()) {
        setAlleFragen(demoFragen)
        setLadeStatus('fertig')
        return
      }

      if (!user) return
      const result = await apiService.ladeFragenbank(user.email)
      if (result) {
        setAlleFragen(result)
        setLadeStatus('fertig')
      } else {
        setLadeStatus('fehler')
      }
    }
    lade()
  }, [user, istDemoModus])

  // Fragen filtern
  const gefilterteFragen = alleFragen.filter((f) => {
    if (filterFachbereich && f.fachbereich !== filterFachbereich) return false
    if (filterTyp && f.typ !== filterTyp) return false
    if (filterBloom && f.bloom !== filterBloom) return false
    if (suchtext) {
      const text = suchtext.toLowerCase()
      const fragetext = 'fragetext' in f ? (f as { fragetext: string }).fragetext : ''
      return (
        f.id.toLowerCase().includes(text) ||
        f.thema.toLowerCase().includes(text) ||
        fragetext.toLowerCase().includes(text) ||
        (f.unterthema || '').toLowerCase().includes(text) ||
        f.tags.some((t) => t.toLowerCase().includes(text))
      )
    }
    return true
  })

  function toggleAuswahl(id: string): void {
    setAusgewaehlt((prev) => {
      const neu = new Set(prev)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })
  }

  function handleHinzufuegen(): void {
    onHinzufuegen(Array.from(ausgewaehlt))
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onSchliessen} />

      {/* Panel (rechts) */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Fragenbank
          </h2>
          <div className="flex items-center gap-3">
            {ausgewaehlt.size > 0 && (
              <button
                onClick={handleHinzufuegen}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {ausgewaehlt.size} hinzufügen
              </button>
            )}
            <button
              onClick={onSchliessen}
              className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
          <input
            type="text"
            value={suchtext}
            onChange={(e) => setSuchtext(e.target.value)}
            placeholder="Suche nach ID, Thema, Fragetext..."
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <div className="flex gap-2">
            <select
              value={filterFachbereich}
              onChange={(e) => setFilterFachbereich(e.target.value as Fachbereich | '')}
              className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <option value="">Alle Fachbereiche</option>
              <option value="VWL">VWL</option>
              <option value="BWL">BWL</option>
              <option value="Recht">Recht</option>
            </select>
            <select
              value={filterTyp}
              onChange={(e) => setFilterTyp(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <option value="">Alle Typen</option>
              <option value="mc">Multiple Choice</option>
              <option value="freitext">Freitext</option>
              <option value="lueckentext">Lückentext</option>
              <option value="zuordnung">Zuordnung</option>
            </select>
            <select
              value={filterBloom}
              onChange={(e) => setFilterBloom(e.target.value as BloomStufe | '')}
              className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <option value="">Alle Bloom-Stufen</option>
              {['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fragen-Liste */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {ladeStatus === 'laden' && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Fragenbank wird geladen...
            </p>
          )}

          {ladeStatus === 'fehler' && (
            <p className="text-sm text-red-500 dark:text-red-400 text-center py-8">
              Fehler beim Laden der Fragenbank.
            </p>
          )}

          {ladeStatus === 'fertig' && gefilterteFragen.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
              Keine Fragen gefunden.
            </p>
          )}

          {ladeStatus === 'fertig' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                {gefilterteFragen.length} Frage{gefilterteFragen.length !== 1 ? 'n' : ''}
              </p>
              {gefilterteFragen.map((frage) => {
                const istVerwendet = bereitsVerwendet.includes(frage.id)
                const istAusgewaehlt = ausgewaehlt.has(frage.id)
                const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''

                return (
                  <div
                    key={frage.id}
                    onClick={() => !istVerwendet && toggleAuswahl(frage.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors
                      ${istVerwendet
                        ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                        : istAusgewaehlt
                          ? 'border-slate-800 dark:border-slate-200 bg-slate-100 dark:bg-slate-700'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0
                        ${istAusgewaehlt
                          ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200'
                          : 'border-slate-400 dark:border-slate-500'
                        }
                      `}>
                        {istAusgewaehlt && (
                          <span className="text-white dark:text-slate-800 text-xs">✓</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* ID + Badges */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {frage.id}
                          </span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${fachbereichFarbe(frage.fachbereich)}`}>
                            {frage.fachbereich}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                            {typLabel(frage.typ)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {frage.bloom} · {frage.punkte}P.
                          </span>
                          {istVerwendet && (
                            <span className="text-xs text-slate-400 italic">bereits verwendet</span>
                          )}
                        </div>

                        {/* Fragetext (gekürzt) */}
                        {fragetext && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                            {fragetext.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 200)}
                          </p>
                        )}

                        {/* Thema */}
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {frage.thema}{frage.unterthema ? ` > ${frage.unterthema}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fachbereichFarbe(fb: string): string {
  switch (fb) {
    case 'VWL': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
    case 'BWL': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'Recht': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
  }
}

function typLabel(typ: string): string {
  switch (typ) {
    case 'mc': return 'MC'
    case 'freitext': return 'Freitext'
    case 'lueckentext': return 'Lückentext'
    case 'zuordnung': return 'Zuordnung'
    default: return typ
  }
}
