import { useState, useCallback, useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap.ts'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsConfig, PruefungsAbschnitt } from '../../types/pruefung.ts'

import ThemeToggle from '../ThemeToggle.tsx'
import FragenBrowser from './FragenBrowser.tsx'

interface Props {
  config: PruefungsConfig | null // null = neue Prüfung
  onZurueck: () => void
}

type ComposerTab = 'config' | 'abschnitte' | 'vorschau'

const leerePruefung: PruefungsConfig = {
  id: '',
  titel: '',
  klasse: '',
  gefaess: 'SF',
  semester: 'S4',
  fachbereiche: [],
  datum: new Date().toISOString().split('T')[0],
  typ: 'summativ',
  modus: 'pruefung',
  dauerMinuten: 45,
  gesamtpunkte: 0,
  erlaubteKlasse: '',
  sebErforderlich: false,
  abschnitte: [],
  zufallsreihenfolgeFragen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'countdown',
  autoSaveIntervallSekunden: 30,
  heartbeatIntervallSekunden: 10,
  korrektur: { aktiviert: false, modus: 'batch' },
  feedback: { zeitpunkt: 'nach-review', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
}

export default function PruefungsComposer({ config, onZurueck }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [pruefung, setPruefung] = useState<PruefungsConfig>(config ?? { ...leerePruefung })
  const [tab, setTab] = useState<ComposerTab>('config')
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'speichern' | 'erfolg' | 'fehler'>('idle')
  const [zeigFragenBrowser, setZeigFragenBrowser] = useState(false)
  const [zielAbschnittIndex, setZielAbschnittIndex] = useState<number>(0)
  const [loeschDialog, setLoeschDialog] = useState<{ index: number; titel: string } | null>(null)

  const loeschDialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(loeschDialog ? loeschDialogRef : { current: null })

  // Gesamtpunkte berechnen (wird in Vorschau angezeigt)
  const gesamtFragen = pruefung.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)

  function updatePruefung(partial: Partial<PruefungsConfig>): void {
    setPruefung((prev) => ({ ...prev, ...partial }))
  }

  function updateAbschnitt(index: number, partial: Partial<PruefungsAbschnitt>): void {
    setPruefung((prev) => {
      const abschnitte = [...prev.abschnitte]
      abschnitte[index] = { ...abschnitte[index], ...partial }
      return { ...prev, abschnitte }
    })
  }

  function addAbschnitt(): void {
    const nr = pruefung.abschnitte.length + 1
    const neuerAbschnitt: PruefungsAbschnitt = {
      titel: `Teil ${String.fromCharCode(64 + nr)}: Neuer Abschnitt`,
      beschreibung: '',
      fragenIds: [],
    }
    updatePruefung({ abschnitte: [...pruefung.abschnitte, neuerAbschnitt] })
  }

  function removeAbschnitt(index: number): void {
    setLoeschDialog({ index, titel: pruefung.abschnitte[index].titel })
  }

  function bestaetigeLoeschen(): void {
    if (!loeschDialog) return
    const abschnitte = pruefung.abschnitte.filter((_, i) => i !== loeschDialog.index)
    updatePruefung({ abschnitte })
    setLoeschDialog(null)
  }

  function moveAbschnitt(index: number, richtung: 'hoch' | 'runter'): void {
    const abschnitte = [...pruefung.abschnitte]
    const newIndex = richtung === 'hoch' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= abschnitte.length) return
    ;[abschnitte[index], abschnitte[newIndex]] = [abschnitte[newIndex], abschnitte[index]]
    updatePruefung({ abschnitte })
  }

  function removeFrageAusAbschnitt(abschnittIndex: number, frageId: string): void {
    const abschnitt = pruefung.abschnitte[abschnittIndex]
    updateAbschnitt(abschnittIndex, {
      fragenIds: abschnitt.fragenIds.filter((id) => id !== frageId),
    })
  }

  function moveFrageInAbschnitt(abschnittIndex: number, frageIndex: number, richtung: 'hoch' | 'runter'): void {
    const abschnitt = pruefung.abschnitte[abschnittIndex]
    const ids = [...abschnitt.fragenIds]
    const newIndex = richtung === 'hoch' ? frageIndex - 1 : frageIndex + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    ;[ids[frageIndex], ids[newIndex]] = [ids[newIndex], ids[frageIndex]]
    updateAbschnitt(abschnittIndex, { fragenIds: ids })
  }

  const handleFragenHinzufuegen = useCallback((frageIds: string[]) => {
    const abschnitt = pruefung.abschnitte[zielAbschnittIndex]
    if (!abschnitt) return
    // Duplikate vermeiden
    const neueIds = frageIds.filter((id) => !abschnitt.fragenIds.includes(id))
    updateAbschnitt(zielAbschnittIndex, {
      fragenIds: [...abschnitt.fragenIds, ...neueIds],
    })
    setZeigFragenBrowser(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps — updateAbschnitt ist inline-Funktion, wuerde Callback bei jedem Render neu erstellen
  }, [pruefung.abschnitte, zielAbschnittIndex])

  async function handleSpeichern(): Promise<void> {
    // ID generieren wenn neue Prüfung
    const zuSpeichern = { ...pruefung }
    if (!zuSpeichern.id) {
      zuSpeichern.id = generiereId(zuSpeichern)
    }
    // erlaubteKlasse = klasse wenn nicht gesetzt
    if (!zuSpeichern.erlaubteKlasse) {
      zuSpeichern.erlaubteKlasse = zuSpeichern.klasse
    }

    setSpeicherStatus('speichern')

    if (istDemoModus || !apiService.istKonfiguriert()) {
      // Demo: Simuliere Speichern
      await new Promise((r) => setTimeout(r, 500))
      setPruefung(zuSpeichern)
      setSpeicherStatus('erfolg')
      setTimeout(() => setSpeicherStatus('idle'), 2000)
      return
    }

    const ok = await apiService.speichereConfig(user!.email, zuSpeichern)
    if (ok) {
      setPruefung(zuSpeichern)
      setSpeicherStatus('erfolg')
      setTimeout(() => setSpeicherStatus('idle'), 2000)
    } else {
      setSpeicherStatus('fehler')
      setTimeout(() => setSpeicherStatus('idle'), 3000)
    }
  }

  function toggleFachbereich(fb: string): void {
    const fachbereiche = pruefung.fachbereiche.includes(fb)
      ? pruefung.fachbereiche.filter((f) => f !== fb)
      : [...pruefung.fachbereiche, fb]
    updatePruefung({ fachbereiche })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onZurueck}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {config ? 'Prüfung bearbeiten' : 'Neue Prüfung'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Speicher-Status */}
            {speicherStatus === 'erfolg' && (
              <span className="text-sm text-green-600 dark:text-green-400">Gespeichert ✓</span>
            )}
            {speicherStatus === 'fehler' && (
              <span className="text-sm text-red-600 dark:text-red-400">Fehler beim Speichern</span>
            )}
            <button
              onClick={handleSpeichern}
              disabled={speicherStatus === 'speichern' || !pruefung.titel.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {speicherStatus === 'speichern' ? 'Speichern...' : 'Speichern'}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto mt-3 flex gap-1">
          {(['config', 'abschnitte', 'vorschau'] as ComposerTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer
                ${tab === t
                  ? 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-b-0 border-slate-200 dark:border-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }
              `}
            >
              {t === 'config' && 'Einstellungen'}
              {t === 'abschnitte' && `Abschnitte & Fragen (${gesamtFragen})`}
              {t === 'vorschau' && 'Vorschau'}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {tab === 'config' && (
          <ConfigTab pruefung={pruefung} updatePruefung={updatePruefung} toggleFachbereich={toggleFachbereich} />
        )}

        {tab === 'abschnitte' && (
          <AbschnitteTab
            pruefung={pruefung}
            onAddAbschnitt={addAbschnitt}
            onRemoveAbschnitt={removeAbschnitt}
            onMoveAbschnitt={moveAbschnitt}
            onUpdateAbschnitt={updateAbschnitt}
            onRemoveFrage={removeFrageAusAbschnitt}
            onMoveFrage={moveFrageInAbschnitt}
            onFragenBrowser={(abschnittIndex) => {
              setZielAbschnittIndex(abschnittIndex)
              setZeigFragenBrowser(true)
            }}
          />
        )}

        {tab === 'vorschau' && <VorschauTab pruefung={pruefung} />}
      </main>

      {/* Fragen-Browser Overlay */}
      {zeigFragenBrowser && (
        <FragenBrowser
          onHinzufuegen={handleFragenHinzufuegen}
          onSchliessen={() => setZeigFragenBrowser(false)}
          bereitsVerwendet={pruefung.abschnitte.flatMap((a) => a.fragenIds)}
        />
      )}

      {/* Lösch-Bestätigungsdialog */}
      {loeschDialog && (
        <div ref={loeschDialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              Abschnitt löschen?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
              Abschnitt &laquo;{loeschDialog.titel}&raquo; wirklich löschen? Die enthaltenen Fragen werden aus der Prüfung entfernt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLoeschDialog(null)}
                className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={bestaetigeLoeschen}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-medium text-sm"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// === SUB-KOMPONENTEN ===

function ConfigTab({
  pruefung,
  updatePruefung,
  toggleFachbereich,
}: {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  toggleFachbereich: (fb: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Grunddaten */}
      <Section titel="Grunddaten">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Titel" span={2}>
            <input
              type="text"
              value={pruefung.titel}
              onChange={(e) => updatePruefung({ titel: e.target.value })}
              placeholder="z.B. Prüfung VWL/Recht — Markt & Verträge"
              className="input-field"
            />
          </Field>

          <Field label="Klasse">
            <input
              type="text"
              value={pruefung.klasse}
              onChange={(e) => updatePruefung({ klasse: e.target.value, erlaubteKlasse: e.target.value })}
              placeholder="z.B. 29c WR (SF)"
              className="input-field"
            />
          </Field>

          <Field label="Datum">
            <input
              type="date"
              value={pruefung.datum}
              onChange={(e) => updatePruefung({ datum: e.target.value })}
              className="input-field"
            />
          </Field>

          <Field label="Gefäss">
            <select
              value={pruefung.gefaess}
              onChange={(e) => updatePruefung({ gefaess: e.target.value as 'SF' | 'EF' | 'EWR' })}
              className="input-field"
            >
              <option value="SF">SF (Schwerpunktfach)</option>
              <option value="EF">EF (Ergänzungsfach)</option>
              <option value="EWR">EWR (Einführung W&R)</option>
            </select>
          </Field>

          <Field label="Semester">
            <select
              value={pruefung.semester}
              onChange={(e) => updatePruefung({ semester: e.target.value })}
              className="input-field"
            >
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Fachbereiche */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
            Fachbereiche
          </label>
          <div className="flex gap-2">
            {['VWL', 'BWL', 'Recht'].map((fb) => {
              const aktiv = pruefung.fachbereiche.includes(fb)
              return (
                <button
                  key={fb}
                  onClick={() => toggleFachbereich(fb)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer
                    ${aktiv
                      ? fb === 'VWL' ? 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300'
                      : fb === 'BWL' ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                      : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                      : 'bg-slate-50 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                    }
                  `}
                >
                  {fb}
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Prüfungsparameter */}
      <Section titel="Prüfungsparameter">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Dauer (Minuten)">
            <input
              type="number"
              value={pruefung.dauerMinuten}
              onChange={(e) => updatePruefung({ dauerMinuten: parseInt(e.target.value) || 0 })}
              min={5}
              max={300}
              className="input-field"
            />
          </Field>

          <Field label="Typ">
            <select
              value={pruefung.typ}
              onChange={(e) => updatePruefung({ typ: e.target.value as 'summativ' | 'formativ' })}
              className="input-field"
            >
              <option value="summativ">Summativ (benotet)</option>
              <option value="formativ">Formativ (unbenotet)</option>
            </select>
          </Field>

          <Field label="Gesamtpunkte">
            <input
              type="number"
              value={pruefung.gesamtpunkte}
              onChange={(e) => updatePruefung({ gesamtpunkte: parseInt(e.target.value) || 0 })}
              min={0}
              className="input-field"
            />
          </Field>
        </div>
      </Section>

      {/* Optionen */}
      <Section titel="Optionen">
        <div className="space-y-3">
          <Toggle
            label="Rücknavigation erlaubt"
            beschreibung="SuS können zwischen Fragen vor- und zurücknavigieren"
            aktiv={pruefung.ruecknavigation}
            onChange={(v) => updatePruefung({ ruecknavigation: v })}
          />
          <Toggle
            label="SEB erforderlich"
            beschreibung="Prüfung nur im Safe Exam Browser erlaubt"
            aktiv={pruefung.sebErforderlich}
            onChange={(v) => updatePruefung({ sebErforderlich: v })}
          />
          <Toggle
            label="Zufällige Fragenreihenfolge"
            beschreibung="Fragen innerhalb eines Abschnitts werden gemischt"
            aktiv={pruefung.zufallsreihenfolgeFragen}
            onChange={(v) => updatePruefung({ zufallsreihenfolgeFragen: v })}
          />
        </div>

        <div className="mt-4">
          <Field label="Zeitanzeige">
            <select
              value={pruefung.zeitanzeigeTyp}
              onChange={(e) => updatePruefung({ zeitanzeigeTyp: e.target.value as 'countdown' | 'verstricheneZeit' | 'keine' })}
              className="input-field"
            >
              <option value="countdown">Countdown (verbleibende Zeit)</option>
              <option value="verstricheneZeit">Verstrichene Zeit</option>
              <option value="keine">Keine Zeitanzeige</option>
            </select>
          </Field>
        </div>
      </Section>
    </div>
  )
}

function AbschnitteTab({
  pruefung,
  onAddAbschnitt,
  onRemoveAbschnitt,
  onMoveAbschnitt,
  onUpdateAbschnitt,
  onRemoveFrage,
  onMoveFrage,
  onFragenBrowser,
}: {
  pruefung: PruefungsConfig
  onAddAbschnitt: () => void
  onRemoveAbschnitt: (index: number) => void
  onMoveAbschnitt: (index: number, richtung: 'hoch' | 'runter') => void
  onUpdateAbschnitt: (index: number, partial: Partial<PruefungsAbschnitt>) => void
  onRemoveFrage: (abschnittIndex: number, frageId: string) => void
  onMoveFrage: (abschnittIndex: number, frageIndex: number, richtung: 'hoch' | 'runter') => void
  onFragenBrowser: (abschnittIndex: number) => void
}) {
  if (pruefung.abschnitte.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Noch keine Abschnitte. Fügen Sie mindestens einen Abschnitt hinzu, um Fragen zuzuordnen.
        </p>
        <button
          onClick={onAddAbschnitt}
          className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
        >
          + Abschnitt hinzufügen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pruefung.abschnitte.map((abschnitt, aIndex) => (
        <div
          key={aIndex}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Abschnitt-Header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-1">
              <button
                onClick={() => onMoveAbschnitt(aIndex, 'hoch')}
                disabled={aIndex === 0}
                className="w-7 h-7 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Nach oben"
              >↑</button>
              <button
                onClick={() => onMoveAbschnitt(aIndex, 'runter')}
                disabled={aIndex === pruefung.abschnitte.length - 1}
                className="w-7 h-7 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                title="Nach unten"
              >↓</button>
            </div>
            <input
              type="text"
              value={abschnitt.titel}
              onChange={(e) => onUpdateAbschnitt(aIndex, { titel: e.target.value })}
              className="flex-1 font-semibold text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-2 focus:ring-slate-400 rounded px-2 py-1"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {abschnitt.fragenIds.length} {abschnitt.fragenIds.length === 1 ? 'Frage' : 'Fragen'}
            </span>
            <button
              onClick={() => onRemoveAbschnitt(aIndex)}
              className="w-7 h-7 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer transition-colors"
              title="Abschnitt löschen"
            >×</button>
          </div>

          {/* Beschreibung */}
          <div className="px-5 pt-3">
            <input
              type="text"
              value={abschnitt.beschreibung || ''}
              onChange={(e) => onUpdateAbschnitt(aIndex, { beschreibung: e.target.value || undefined })}
              placeholder="Optionale Beschreibung für die SuS..."
              className="w-full text-sm text-slate-600 dark:text-slate-300 bg-transparent border-none outline-none placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-slate-400 rounded px-2 py-1"
            />
          </div>

          {/* Fragen-Liste */}
          <div className="px-5 py-3">
            {abschnitt.fragenIds.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic py-2">
                Noch keine Fragen in diesem Abschnitt.
              </p>
            ) : (
              <div className="space-y-1.5">
                {abschnitt.fragenIds.map((frageId, fIndex) => (
                  <div
                    key={frageId}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm"
                  >
                    <span className="text-xs text-slate-400 dark:text-slate-500 w-5 text-center tabular-nums">
                      {fIndex + 1}.
                    </span>
                    <span className="flex-1 text-slate-700 dark:text-slate-200 font-mono text-xs truncate">
                      {frageId}
                    </span>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => onMoveFrage(aIndex, fIndex, 'hoch')}
                        disabled={fIndex === 0}
                        className="w-6 h-6 text-xs text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >↑</button>
                      <button
                        onClick={() => onMoveFrage(aIndex, fIndex, 'runter')}
                        disabled={fIndex === abschnitt.fragenIds.length - 1}
                        className="w-6 h-6 text-xs text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      >↓</button>
                      <button
                        onClick={() => onRemoveFrage(aIndex, frageId)}
                        className="w-6 h-6 text-xs text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer"
                        title="Frage entfernen"
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => onFragenBrowser(aIndex)}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              + Fragen hinzufügen
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={onAddAbschnitt}
        className="w-full py-3 text-sm font-medium text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        + Neuen Abschnitt hinzufügen
      </button>
    </div>
  )
}

function VorschauTab({ pruefung }: { pruefung: PruefungsConfig }) {
  const gesamtFragen = pruefung.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-slate-800 dark:bg-slate-200 rounded-2xl flex items-center justify-center">
            <span className="text-white dark:text-slate-800 text-xl font-bold">WR</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {pruefung.titel || '(Kein Titel)'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {pruefung.klasse || '(Keine Klasse)'} · {pruefung.datum}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <MiniCard label="Dauer" wert={`${pruefung.dauerMinuten} Min.`} />
          <MiniCard label="Fragen" wert={String(gesamtFragen)} />
          <MiniCard label="Punkte" wert={String(pruefung.gesamtpunkte)} />
          <MiniCard label="Typ" wert={pruefung.typ === 'summativ' ? 'Summativ' : 'Formativ'} />
        </div>

        {pruefung.abschnitte.length > 0 && (
          <div className="space-y-1.5 mb-6">
            {pruefung.abschnitte.map((a) => (
              <div
                key={a.titel}
                className="flex justify-between text-sm text-slate-700 dark:text-slate-300 py-1.5 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <span>{a.titel}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {a.fragenIds.length} {a.fragenIds.length === 1 ? 'Frage' : 'Fragen'}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
          {pruefung.ruecknavigation && <p>Alle Fragen können in beliebiger Reihenfolge beantwortet werden.</p>}
          <p>Antworten werden automatisch gespeichert.</p>
          {pruefung.sebErforderlich && <p className="text-amber-600 dark:text-amber-400">SEB erforderlich</p>}
        </div>

        {pruefung.id && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Prüfungs-ID: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{pruefung.id}</code>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              URL für SuS: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded break-all">
                {window.location.origin + window.location.pathname}?id={pruefung.id}
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// === HILFSFUNKTIONEN ===

function generiereId(config: PruefungsConfig): string {
  const klasse = config.klasse.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10)
  const datum = config.datum.replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 6)
  return `${klasse}-${datum}-${rand}`
}

// === UI-BAUSTEINE ===

function Section({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">
        {titel}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

function Toggle({ label, beschreibung, aktiv, onChange }: {
  label: string
  beschreibung: string
  aktiv: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{beschreibung}</p>
      </div>
      <button
        onClick={() => onChange(!aktiv)}
        className={`w-10 h-6 rounded-full transition-colors cursor-pointer relative
          ${aktiv ? 'bg-slate-800 dark:bg-slate-200' : 'bg-slate-300 dark:bg-slate-600'}
        `}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-800 transition-transform shadow-sm
            ${aktiv ? 'left-[18px]' : 'left-0.5'}
          `}
        />
      </button>
    </div>
  )
}

function MiniCard({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{wert}</div>
    </div>
  )
}
