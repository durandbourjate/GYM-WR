import { useState } from 'react'
import { apiService } from '../../../services/apiService.ts'
import BaseDialog from '../../ui/BaseDialog'

interface Props {
  pruefungId: string
  lpEmail: string
  /** Wenn gesetzt: nur für diesen SuS (Name für Anzeige) */
  einzelnerSuS?: { email: string; name: string }
  /** Anzahl SuS mit Nachteilsausgleich (für Hinweis) */
  anzahlMitNachteilsausgleich?: number
  /** Anzahl aktiver SuS (für Bestätigungstext) */
  anzahlAktiv?: number
  /** Formative Übung → Labels anpassen */
  istFormativ?: boolean
  onBeendet: () => void
  onAbbrechen: () => void
}

export default function BeendenDialog({
  pruefungId,
  lpEmail,
  einzelnerSuS,
  anzahlMitNachteilsausgleich = 0,
  anzahlAktiv = 0,
  istFormativ = false,
  onBeendet,
  onAbbrechen,
}: Props) {
  const [modus, setModus] = useState<'sofort' | 'restzeit'>('sofort')
  const [restzeitMinuten, setRestzeitMinuten] = useState(5)
  const [bemerkung, setBemerkung] = useState('')
  const [lade, setLade] = useState(false)
  const [fehler, setFehler] = useState('')

  async function handleBeenden(): Promise<void> {
    setLade(true)
    setFehler('')

    // Timeout-Schutz: Falls Backend zu lange braucht, Spinner beenden + Fehlermeldung
    const timeoutId = setTimeout(() => {
      setLade(false)
      setFehler('Zeitüberschreitung — die Anfrage wurde an den Server gesendet. Bitte Seite aktualisieren und prüfen ob die Prüfung beendet wurde.')
    }, 30000)

    try {
      const result = await apiService.beendePruefung({
        pruefungId,
        email: lpEmail,
        modus,
        restzeitMinuten: modus === 'restzeit' ? restzeitMinuten : undefined,
        einzelneSuS: einzelnerSuS ? [einzelnerSuS.email] : undefined,
      })

      clearTimeout(timeoutId)

      if (result.success) {
        // Bemerkung lokal speichern (LP-Notizen)
        if (bemerkung.trim()) {
          try {
            const key = `pruefung-bemerkungen-${pruefungId}`
            const bisherige = JSON.parse(localStorage.getItem(key) || '[]') as Array<{zeitpunkt: string; text: string; sus?: string}>
            bisherige.push({
              zeitpunkt: new Date().toISOString(),
              text: bemerkung.trim(),
              sus: einzelnerSuS?.email,
            })
            localStorage.setItem(key, JSON.stringify(bisherige))
          } catch { /* ignorieren */ }
        }
        onBeendet()
        return
      } else {
        setLade(false)
        setFehler(result.error === 'nicht_konfiguriert'
          ? 'Backend nicht konfiguriert (Demo-Modus). Prüfung kann nur mit aktivem Backend beendet werden.'
          : `Fehler beim Beenden: ${result.error || 'Unbekannter Fehler'}`)
      }
    } catch {
      clearTimeout(timeoutId)
      setLade(false)
      setFehler('Netzwerkfehler — bitte Seite aktualisieren und prüfen ob die Prüfung beendet wurde.')
    }
  }

  const label = istFormativ ? 'Übung' : 'Prüfung'
  const zielText = einzelnerSuS
    ? `${label} für ${einzelnerSuS.name} beenden`
    : `${label} für ${anzahlAktiv} aktive SuS beenden`

  // 1-Schritt-Dialog: Modus wählen + direkt beenden
  return (
    <BaseDialog
      open={true}
      onClose={onAbbrechen}
      title={zielText}
      maxWidth="md"
      footer={
        <>
          <button
            onClick={onAbbrechen}
            className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            onClick={handleBeenden}
            disabled={lade}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {lade ? 'Wird beendet...' : `${label} beenden`}
          </button>
        </>
      }
    >
      {/* Modus-Auswahl */}
      <div className="space-y-3 mb-4">
        <label
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            modus === 'sofort'
              ? 'border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-700/50'
              : 'border-slate-200 dark:border-slate-600'
          }`}
        >
          <input
            type="radio"
            name="modus"
            checked={modus === 'sofort'}
            onChange={() => setModus('sofort')}
            className="accent-slate-800 dark:accent-slate-200"
          />
          <div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Sofort beenden</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Alle Antworten werden sofort abgegeben</div>
          </div>
        </label>

        <label
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            modus === 'restzeit'
              ? 'border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-700/50'
              : 'border-slate-200 dark:border-slate-600'
          }`}
        >
          <input
            type="radio"
            name="modus"
            checked={modus === 'restzeit'}
            onChange={() => setModus('restzeit')}
            className="accent-slate-800 dark:accent-slate-200"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100">Restzeit geben</div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min={1}
                max={60}
                value={restzeitMinuten}
                onChange={(e) => setRestzeitMinuten(Math.max(1, Number(e.target.value)))}
                disabled={modus !== 'restzeit'}
                className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 disabled:opacity-50"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">Minuten</span>
            </div>
          </div>
        </label>
      </div>

      {/* Hinweis Nachteilsausgleich */}
      {modus === 'restzeit' && anzahlMitNachteilsausgleich > 0 && !einzelnerSuS && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
          {anzahlMitNachteilsausgleich} SuS mit Nachteilsausgleich erhalten zusätzliche Zeit.
        </div>
      )}

      {/* Bemerkung (optional) */}
      <div className="mb-4">
        <textarea
          value={bemerkung}
          onChange={(e) => setBemerkung(e.target.value)}
          placeholder={einzelnerSuS ? 'Bemerkung (optional), z.B. Beim Spicken erwischt...' : 'Bemerkung (optional), z.B. Internet ausgefallen...'}
          rows={2}
          className="w-full text-sm px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none"
        />
      </div>

      {fehler && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {fehler}
        </div>
      )}
    </BaseDialog>
  )
}
