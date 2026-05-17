import { useRef, useState } from 'react'
import { Loader2, Check, X } from 'lucide-react'
import { useStammdatenStore } from '../../../store/stammdatenStore'
import { useToastStore } from '../../../store/toastStore'
import { useTestdatenStatus } from '../../../hooks/useTestdatenStatus'
import { apiAdminSeedTestdaten, type SeedResponse } from '../../../services/testdatenApi'
import ResetConfirmModal from './testdaten/ResetConfirmModal'
import type { LPProfil } from '../../../types/stammdaten'
import { TYPO } from '../../../styles/typografie'

/** ISO-Timestamp -> 'DD.MM.YYYY HH:mm' (Europe/Zurich-Lokalzeit). Bei
 *  ungueltigem Input wird der Original-String zurueckgegeben (defensiv). */
function formatiereSeedDatum(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('de-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

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
  const { initialisiert, ladestand, letzterSeedAm, setLetzterSeedAm } = useTestdatenStatus({ email })

  const admin = istAdmin(email)
  const sichtbar = lpProfil?.testdatenSichtbar ?? false

  const [seedResult, setSeedResult] = useState<SeedResponse | null>(null)
  const [seedLoading, setSeedLoading] = useState(false)
  const [modalOffen, setModalOffen] = useState(false)
  const loadingRef = useRef(false) // Doppel-Klick-Guard (State ist stale zwischen Klicks)

  const onToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lpProfil) return
    const updated: LPProfil = { ...lpProfil, testdatenSichtbar: e.target.checked }
    const ok = await speichereLPProfil(updated)
    if (!ok) toastAdd('error', 'Sichtbarkeit konnte nicht gespeichert werden.')
  }

  const fuehreAus = async (mode: 'initial' | 'reset') => {
    if (loadingRef.current) return
    loadingRef.current = true
    setSeedLoading(true)
    setSeedResult(null)
    try {
      const result = await apiAdminSeedTestdaten({ email, mode })
      setSeedResult(result)
      // Spawn-Task 17.05.2026: nach erfolgreichem Seed/Reset den Datum-Anzeige-State
      // sofort aktualisieren — Response enthaelt den frischen ISO-Timestamp, also
      // kein zweiter Backend-Roundtrip noetig.
      if (result.success && result.statistik?.letzterSeedAm) {
        setLetzterSeedAm(result.statistik.letzterSeedAm)
      }
      if (result.success && mode === 'reset') setModalOffen(false)
    } finally {
      loadingRef.current = false
      setSeedLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100`}>
        Testdaten
      </h2>

      <section>
        <h3 className={`${TYPO.h2} text-slate-700 dark:text-slate-200 mb-2`}>Status</h3>
        {ladestand === 'pruefe' ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Prüfe…</p>
        ) : initialisiert ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" aria-hidden="true" /> Initialisiert
            {letzterSeedAm && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">
                (zuletzt: {formatiereSeedDatum(letzterSeedAm)})
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" aria-hidden="true" /> Noch nicht erzeugt{!admin && ' — bitte Admin kontaktieren.'}
          </p>
        )}
      </section>

      <section>
        <h3 className={`${TYPO.h2} text-slate-700 dark:text-slate-200 mb-2`}>Sichtbarkeit</h3>
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

      {admin && (
        <section>
          <h3 className={`${TYPO.h2} text-slate-700 dark:text-slate-200 mb-2`}>Admin-Aktionen</h3>
          <div className="flex items-center gap-3">
            {!initialisiert && (
              <button
                type="button"
                onClick={() => void fuehreAus('initial')}
                disabled={seedLoading}
                className="px-3 py-1.5 rounded text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {seedLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                {seedLoading ? 'Wird erzeugt…' : 'Testdaten erzeugen'}
              </button>
            )}
            {initialisiert && (
              <button
                type="button"
                onClick={() => setModalOffen(true)}
                disabled={seedLoading}
                className="px-3 py-1.5 rounded text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {seedLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                {seedLoading ? 'Wird zurückgesetzt…' : 'Zurücksetzen'}
              </button>
            )}
            {seedLoading && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                kann bis ~60s dauern (Backend re-seedet)
              </span>
            )}
          </div>

          {seedResult && (
            <div className="mt-3 text-sm">
              {seedResult.success ? (
                <div className="text-emerald-700 dark:text-emerald-300">
                  <p className="font-medium">Erfolg{seedResult.dauerMs ? ` (${Math.round(seedResult.dauerMs / 1000)}s)` : ''}</p>
                  <ul className="mt-1 text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
                    {seedResult.statistik?.testSuSAngelegt !== undefined && <li>{seedResult.statistik.testSuSAngelegt} SuS angelegt</li>}
                    {seedResult.statistik?.testPruefungenAngelegt !== undefined && <li>{seedResult.statistik.testPruefungenAngelegt} Prüfungen</li>}
                    {seedResult.statistik?.testUebungenAngelegt !== undefined && <li>{seedResult.statistik.testUebungenAngelegt} Übungen</li>}
                    {seedResult.statistik?.testSessionsAngelegt !== undefined && <li>{seedResult.statistik.testSessionsAngelegt} Sessions</li>}
                  </ul>
                </div>
              ) : (
                <p className="text-rose-700 dark:text-rose-300">Fehler: {seedResult.error ?? 'Unbekannt'}</p>
              )}
            </div>
          )}

          <ResetConfirmModal
            offen={modalOffen}
            loading={seedLoading}
            onAbbrechen={() => { if (!seedLoading) setModalOffen(false) }}
            onBestaetigen={() => void fuehreAus('reset')}
          />
        </section>
      )}
    </div>
  )
}
