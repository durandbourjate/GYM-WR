import { useState, useRef } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { fachbereichFarbe, typLabel, bloomLabel } from '../../../utils/fachUtils.ts'
import type { Frage, Fachbereich, BloomStufe } from '../../../types/fragen-storage'
import { generiereFrageId } from '../frageneditor/editorUtils.ts'

interface Props {
  onImportiert: (fragen: Frage[]) => void
  onSchliessen: () => void
}

interface ErkannterFrage {
  ausgewaehlt: boolean
  typ: string
  fragetext: string
  bloom: string
  punkte: number
  optionen?: { text: string; korrekt: boolean }[]
  musterlosung?: string
  paare?: { links: string; rechts: string }[]
  aussagen?: { text: string; korrekt: boolean; erklaerung?: string }[]
}

/** Modal für den KI-gestützten Fragen-Import aus Text/PDF */
export default function FragenImport({ onImportiert, onSchliessen }: Props) {
  const user = useAuthStore((s) => s.user)
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

  // Eingabe-Felder
  const [textEingabe, setTextEingabe] = useState('')
  const [fachbereich, setFachbereich] = useState<Fachbereich>('VWL')
  const [defaultBloom, setDefaultBloom] = useState<BloomStufe>('K2')
  const [thema, setThema] = useState('')

  // Status
  const [status, setStatus] = useState<'eingabe' | 'laden' | 'vorschau' | 'fehler'>('eingabe')
  const [fehler, setFehler] = useState('')
  const [erkannteQuestions, setErkannteQuestions] = useState<ErkannterFrage[]>([])

  // Fragen erkennen via KI
  async function handleErkennen(): Promise<void> {
    if (!textEingabe.trim()) {
      setFehler('Bitte Text eingeben oder einfügen.')
      return
    }
    if (!user?.email) return

    setStatus('laden')
    setFehler('')

    try {
      const result = await apiService.kiAssistent(user.email, 'importiereFragen', {
        text: textEingabe.trim(),
        fachbereich,
        bloom: defaultBloom,
        thema,
      })

      if (!result) {
        setFehler('Keine Antwort vom Server')
        setStatus('fehler')
        return
      }
      const ergebnis = result.ergebnis
      if ('error' in ergebnis && typeof ergebnis.error === 'string') {
        setFehler(ergebnis.error)
        setStatus('fehler')
        return
      }

      const fragen = (ergebnis.fragen ?? ergebnis.questions ?? []) as ErkannterFrage[]
      if (!Array.isArray(fragen) || fragen.length === 0) {
        setFehler('Keine Fragen erkannt. Versuchen Sie, den Text deutlicher zu formulieren.')
        setStatus('fehler')
        return
      }

      setErkannteQuestions(fragen.map((f) => ({ ...f, ausgewaehlt: true })))
      setStatus('vorschau')
    } catch {
      setFehler('Netzwerkfehler bei der KI-Analyse')
      setStatus('fehler')
    }
  }

  function toggleFrage(idx: number): void {
    setErkannteQuestions((prev) =>
      prev.map((f, i) => i === idx ? { ...f, ausgewaehlt: !f.ausgewaehlt } : f)
    )
  }

  function toggleAlle(): void {
    const alleAus = erkannteQuestions.every((f) => f.ausgewaehlt)
    setErkannteQuestions((prev) => prev.map((f) => ({ ...f, ausgewaehlt: !alleAus })))
  }

  // Ausgewählte Fragen importieren
  function handleImportieren(): void {
    const jetzt = new Date().toISOString()
    const ausgewaehlte = erkannteQuestions.filter((f) => f.ausgewaehlt)

    const neueFragen: Frage[] = ausgewaehlte.map((ef) => {
      const typ = ef.typ || 'freitext'
      const id = generiereFrageId(fachbereich, typ)
      const bloom = (ef.bloom || defaultBloom) as BloomStufe

      const basis = {
        id,
        version: 1,
        erstelltAm: jetzt,
        geaendertAm: jetzt,
        fachbereich,
        fach: fachbereich,
        thema: thema || 'Importiert',
        semester: [],
        gefaesse: ['SF'],
        bloom,
        tags: ['import'],
        punkte: ef.punkte || 1,
        musterlosung: ef.musterlosung || '',
        bewertungsraster: [],
        verwendungen: [],
        quelle: 'ki-generiert' as const,
        autor: user?.email,
        geteilt: 'privat' as const,
      }

      switch (typ) {
        case 'mc':
          return {
            ...basis,
            typ: 'mc' as const,
            fragetext: ef.fragetext,
            optionen: (ef.optionen || []).map((o, i) => ({
              id: String.fromCharCode(97 + i),
              text: o.text,
              korrekt: o.korrekt,
            })),
            mehrfachauswahl: false,
            zufallsreihenfolge: true,
          }
        case 'zuordnung':
          return {
            ...basis,
            typ: 'zuordnung' as const,
            fragetext: ef.fragetext,
            paare: ef.paare || [],
            zufallsreihenfolge: true,
          }
        case 'richtigfalsch':
          return {
            ...basis,
            typ: 'richtigfalsch' as const,
            fragetext: ef.fragetext,
            aussagen: (ef.aussagen || []).map((a, i) => ({
              id: String(i + 1),
              text: a.text,
              korrekt: a.korrekt,
              erklaerung: a.erklaerung,
            })),
          }
        default:
          return {
            ...basis,
            typ: 'freitext' as const,
            fragetext: ef.fragetext,
            laenge: 'mittel' as const,
          }
      }
    })

    onImportiert(neueFragen)
  }

  const ausgewaehltAnzahl = erkannteQuestions.filter((f) => f.ausgewaehlt).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[120px]">
      <div className="absolute inset-0 bg-black/50" onClick={onSchliessen} />

      <div
        ref={panelRef}
        className="relative w-full max-w-2xl max-h-[calc(100vh-150px)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Fragen importieren via KI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Text aus PDFs, Lehrbüchern oder Dokumenten einfügen
            </p>
          </div>
          <button
            onClick={onSchliessen}
            className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Inhalt */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {/* Eingabe-Phase */}
          {(status === 'eingabe' || status === 'fehler') && (
            <>
              {/* Einstellungen */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Fach
                  </label>
                  <select
                    value={fachbereich}
                    onChange={(e) => setFachbereich(e.target.value as Fachbereich)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="VWL">VWL</option>
                    <option value="BWL">BWL</option>
                    <option value="Recht">Recht</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Bloom-Stufe (Standard)
                  </label>
                  <select
                    value={defaultBloom}
                    onChange={(e) => setDefaultBloom(e.target.value as BloomStufe)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomStufe[]).map((k) => (
                      <option key={k} value={k}>{k} — {bloomLabel(k)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Thema
                  </label>
                  <input
                    type="text"
                    value={thema}
                    onChange={(e) => setThema(e.target.value)}
                    placeholder="z.B. Marktgleichgewicht"
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Text einfügen
                </label>
                <textarea
                  value={textEingabe}
                  onChange={(e) => setTextEingabe(e.target.value)}
                  rows={12}
                  placeholder="Fügen Sie hier den Text ein, aus dem Fragen erkannt werden sollen...&#10;&#10;Beispiel:&#10;1. Was versteht man unter dem Gleichgewichtspreis?&#10;2. Erklären Sie den Unterschied zwischen Angebot und Nachfrage.&#10;a) Angebotskurve&#10;b) Nachfragekurve"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Tipp: Nummerierte Listen, Aufzählungen und MC-Optionen (a, b, c, d) werden besser erkannt.
                </p>
              </div>

              {/* Datei-Upload (Platzhalter für Zukunft) */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  PDF-Upload (in Planung) — aktuell bitte Text manuell einfügen
                </p>
              </div>

              {/* Fehler */}
              {fehler && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{fehler}</p>
                </div>
              )}
            </>
          )}

          {/* Lade-Phase */}
          {status === 'laden' && (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto mb-4 border-4 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                KI analysiert Text und erkennt Fragen...
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Dies kann einige Sekunden dauern.
              </p>
            </div>
          )}

          {/* Vorschau-Phase */}
          {status === 'vorschau' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {erkannteQuestions.length} Frage{erkannteQuestions.length !== 1 ? 'n' : ''} erkannt
                </p>
                <button
                  onClick={toggleAlle}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {erkannteQuestions.every((f) => f.ausgewaehlt) ? 'Alle abwählen' : 'Alle wählen'}
                </button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-auto">
                {erkannteQuestions.map((frage, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleFrage(idx)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      frage.ausgewaehlt
                        ? 'border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-700'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        frage.ausgewaehlt
                          ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200'
                          : 'border-slate-400 dark:border-slate-500'
                      }`}>
                        {frage.ausgewaehlt && <span className="text-white dark:text-slate-800 text-xs">✓</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 text-xs rounded ${fachbereichFarbe(fachbereich)}`}>
                            {fachbereich}
                          </span>
                          <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                            {typLabel(frage.typ)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {frage.bloom} · {frage.punkte}P.
                          </span>
                        </div>

                        {/* Fragetext */}
                        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3">
                          {frage.fragetext}
                        </p>

                        {/* MC-Optionen Vorschau */}
                        {frage.typ === 'mc' && frage.optionen && (
                          <div className="mt-1 space-y-0.5">
                            {frage.optionen.map((opt, oi) => (
                              <div key={oi} className={`text-xs px-2 py-0.5 rounded ${
                                opt.korrekt
                                  ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                                  : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {String.fromCharCode(97 + oi)}) {opt.text} {opt.korrekt ? '✓' : ''}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {status === 'vorschau' && (
            <button
              onClick={() => { setStatus('eingabe'); setErkannteQuestions([]) }}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
          )}
          {status !== 'vorschau' && <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onSchliessen}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>

            {(status === 'eingabe' || status === 'fehler') && (
              <button
                onClick={handleErkennen}
                disabled={!textEingabe.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Fragen erkennen
              </button>
            )}

            {status === 'vorschau' && (
              <button
                onClick={handleImportieren}
                disabled={ausgewaehltAnzahl === 0}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ausgewaehltAnzahl} Frage{ausgewaehltAnzahl !== 1 ? 'n' : ''} importieren
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
