import { useStammdatenStore } from '../../../store/stammdatenStore'
import { useToastStore } from '../../../store/toastStore'
import { useTestdatenStatus } from '../../../hooks/useTestdatenStatus'
import type { LPProfil } from '../../../types/stammdaten'

interface Props {
  email: string
}

// Speicher-Pattern: Toggle ist Single-Field instant-save (kein expliziter Button),
// daher KEIN useSpeicherStatus + SpeicherButton (Pattern für Multi-Field-Forms).
// Stattdessen optimistic call + Toast bei Fehler.
export default function TestdatenTab({ email }: Props) {
  const lpProfil = useStammdatenStore(s => s.lpProfil)
  const speichereLPProfil = useStammdatenStore(s => s.speichereLPProfil)
  const istAdmin = useStammdatenStore(s => s.istAdmin)
  const toastAdd = useToastStore(s => s.add)
  const { initialisiert } = useTestdatenStatus()

  const admin = istAdmin(email)
  const sichtbar = lpProfil?.testdatenSichtbar ?? false

  const onToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lpProfil) return
    const updated: LPProfil = { ...lpProfil, testdatenSichtbar: e.target.checked }
    const ok = await speichereLPProfil(updated)
    if (!ok) toastAdd('error', 'Sichtbarkeit konnte nicht gespeichert werden.')
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        Testdaten
      </h3>

      <section>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</h4>
        {initialisiert ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">✓ Initialisiert</p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ✗ Noch nicht erzeugt{!admin && ' — bitte Admin kontaktieren.'}
          </p>
        )}
      </section>

      <section>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sichtbarkeit</h4>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sichtbar}
            onChange={onToggle}
            disabled={!lpProfil}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          Testdaten in meinen Listen anzeigen
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Testdaten sind nur zum Kennenlernen und Testen. Sie sind als „Test" markiert und werden Echtdaten nie beeinflussen.
        </p>
      </section>

      {admin && null /* Task 6: Sektion C — Admin-Aktionen */}
    </div>
  )
}
