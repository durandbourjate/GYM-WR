import { Save, Copy, Trash2 } from 'lucide-react'
import { TabBar } from '../../../ui/TabBar'

interface Props {
  titel: string
  typ: 'summativ' | 'formativ'
  aktiverTab: string
  onTabChange: (id: string) => void
  gesamtFragen: number
  statusText?: string
  speichertGerade: boolean
  speichernDeaktiviert: boolean
  onSpeichern: () => void
  onDuplizieren?: () => void
  onLoeschen?: () => void
}

const ICON_BUTTON =
  'p-2 rounded-md text-slate-500 dark:text-slate-300 transition-colors cursor-pointer ' +
  'disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center'
const ICON_VIOLETT = `${ICON_BUTTON} hover:text-violet-600 hover:bg-violet-50 dark:hover:text-violet-300 dark:hover:bg-violet-900/30`
const ICON_ROT = `${ICON_BUTTON} hover:text-red-600 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-900/30`

/**
 * Editor-Leiste des Prüfungs-Composers: Prüfungstitel + Editor-Tabs links,
 * Speicher-Status + Aktions-Icons (Speichern/Duplizieren/Löschen) rechts.
 * Der globale Header bleibt dadurch rein global (volle Breite für die TabKaskade).
 */
export default function PruefungsComposerLeiste({
  titel, typ, aktiverTab, onTabChange, gesamtFragen,
  statusText, speichertGerade, speichernDeaktiviert,
  onSpeichern, onDuplizieren, onLoeschen,
}: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-2 flex items-center gap-4">
      {/* Links: Prüfungstitel */}
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[16rem] shrink-0">
        {titel || (typ === 'formativ' ? 'Neue Übung' : 'Neue Prüfung')}
      </span>

      {/* Editor-Tabs */}
      <TabBar
        tabs={[
          { id: 'config', label: 'Einstellungen' },
          { id: 'abschnitte', label: `Abschnitte & Fragen (${gesamtFragen})` },
          { id: 'vorschau', label: 'Vorschau' },
          { id: 'analyse', label: 'Analyse', disabled: gesamtFragen === 0 },
        ]}
        activeTab={aktiverTab}
        onTabChange={onTabChange}
        size="md"
      />

      {/* Rechts: Speicher-Status + Aktions-Icons */}
      <div className="ml-auto flex items-center gap-1 shrink-0">
        {statusText && (
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">{statusText}</span>
        )}
        <button
          type="button"
          onClick={onSpeichern}
          disabled={speichernDeaktiviert}
          title="Speichern"
          aria-label="Speichern"
          className={ICON_VIOLETT}
        >
          {speichertGerade
            ? <span className="inline-block w-[18px] h-[18px] border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            : <Save className="w-[18px] h-[18px]" />}
        </button>
        {onDuplizieren && (
          <button
            type="button"
            onClick={onDuplizieren}
            title="Duplizieren"
            aria-label="Duplizieren"
            className={ICON_VIOLETT}
          >
            <Copy className="w-[18px] h-[18px]" />
          </button>
        )}
        {onLoeschen && (
          <button
            type="button"
            onClick={onLoeschen}
            title="Löschen"
            aria-label="Löschen"
            className={ICON_ROT}
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    </div>
  )
}
