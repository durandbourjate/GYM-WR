import { useState, useEffect, useMemo, useCallback } from 'react'
import type { SchuelerStatus } from '../../../types/monitoring'
import type { PruefungsConfig } from '../../../types/pruefung'
import { inaktivitaetsStufe } from '../../../utils/phase'
import { useAuthStore } from '../../../store/authStore'
import { apiService } from '../../../services/apiService'
import ZusammenfassungsLeiste from './ZusammenfassungsLeiste'
import SusDetailPanel from './SusDetailPanel'
import BeendenDialog from './BeendenDialog'

type Sortierung = 'name' | 'klasse' | 'fortschritt' | 'status'
type QuickFilter = 'alle' | 'aktiv' | 'abgegeben' | 'nicht-erschienen'

interface Props {
  config: PruefungsConfig
  schuelerStatus: SchuelerStatus[]
  startTimestamp: number
  onBeenden: () => void
  onConfigUpdate?: (updates: Partial<PruefungsConfig>) => void
}

export default function AktivPhase({ config, schuelerStatus, startTimestamp, onBeenden, onConfigUpdate }: Props) {
  const user = useAuthStore((s) => s.user)
  const [sortierung, setSortierung] = useState<Sortierung>('name')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('alle')
  const [detailSus, setDetailSus] = useState<string | null>(null)
  const [zeigBeendenDialog, setZeigBeendenDialog] = useState(false)
  const [einzelBeendenSuS, setEinzelBeendenSuS] = useState<{ email: string; name: string } | null>(null)
  const [beendenLaeuft, setBeendenLaeuft] = useState(false)
  const [sebAusnahmenLokal, setSebAusnahmenLokal] = useState<Set<string>>(
    new Set(config.sebAusnahmen ?? [])
  )
  const [jetzt, setJetzt] = useState(Date.now())

  // Reguläres Ende der Prüfung (Start + Dauer)
  const basisEndeMs = startTimestamp + config.dauerMinuten * 60 * 1000

  // Tick-Interval: 1s wenn jemand in Overtime ist, sonst kein Tick nötig
  const zeitverlaengerungen = config.zeitverlaengerungen ?? {}
  const hatOvertimeSuS = useMemo(() => {
    if (Object.keys(zeitverlaengerungen).length === 0) return false
    const now = jetzt
    // Prüfe ob das Basis-Ende überschritten ist UND noch jemand aktiv + Zuschlag hat
    if (now < basisEndeMs) return false
    return Object.entries(zeitverlaengerungen).some(([email, minuten]) => {
      const schueler = schuelerStatus.find((s) => s.email === email)
      if (!schueler || schueler.status === 'abgegeben' || schueler.status === 'beendet-lp') return false
      const persoenlichesEnde = basisEndeMs + minuten * 60 * 1000
      return now < persoenlichesEnde
    })
  }, [zeitverlaengerungen, schuelerStatus, jetzt, basisEndeMs])

  useEffect(() => {
    if (!hatOvertimeSuS) return
    const interval = setInterval(() => setJetzt(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [hatOvertimeSuS])

  // Zeitzuschlag inline hinzufuegen/aendern
  const handleZeitzuschlag = useCallback((email: string, minuten: number) => {
    const aktuell = config.zeitverlaengerungen ?? {}
    if (minuten <= 0) {
      const kopie = { ...aktuell }
      delete kopie[email]
      onConfigUpdate?.({ zeitverlaengerungen: kopie })
    } else {
      onConfigUpdate?.({ zeitverlaengerungen: { ...aktuell, [email]: minuten } })
    }
  }, [config.zeitverlaengerungen, onConfigUpdate])

  async function handleSebAusnahme(email: string): Promise<void> {
    if (!user) return
    const erfolg = await apiService.sebAusnahmeErlauben(config.id, user.email, email)
    if (erfolg) {
      setSebAusnahmenLokal((prev) => new Set(prev).add(email))
    }
  }

  // Loading-States für async Aktionen (Button-Feedback)
  const [ladendButtons, setLadendButtons] = useState<Record<string, boolean>>({})

  async function handleEntsperren(schuelerEmail: string): Promise<void> {
    if (!user) return
    setLadendButtons((prev) => ({ ...prev, [`entsperren-${schuelerEmail}`]: true }))
    try {
      await apiService.entsperreSuS(config.id, user.email, schuelerEmail)
    } finally {
      setLadendButtons((prev) => ({ ...prev, [`entsperren-${schuelerEmail}`]: false }))
    }
  }

  const maxVerstoesse = 3

  const gefilterteSchueler = useMemo(() => {
    let liste = [...schuelerStatus]

    // Filter
    switch (quickFilter) {
      case 'aktiv':
        liste = liste.filter((s) => s.status === 'aktiv' || s.status === 'inaktiv')
        break
      case 'abgegeben':
        liste = liste.filter((s) => s.status === 'abgegeben' || s.status === 'beendet-lp')
        break
      case 'nicht-erschienen':
        liste = liste.filter((s) => s.status === 'nicht-gestartet')
        break
    }

    // Sortierung
    liste.sort((a, b) => {
      switch (sortierung) {
        case 'name': return (a.name || a.email).localeCompare(b.name || b.email)
        case 'klasse': return (a.klasse ?? '').localeCompare(b.klasse ?? '')
        case 'fortschritt':
          return (b.gesamtFragen > 0 ? b.beantworteteFragen / b.gesamtFragen : 0)
            - (a.gesamtFragen > 0 ? a.beantworteteFragen / a.gesamtFragen : 0)
        case 'status': return statusReihenfolge(a.status) - statusReihenfolge(b.status)
        default: return 0
      }
    })
    return liste
  }, [schuelerStatus, sortierung, quickFilter])

  const detailSchueler = detailSus ? schuelerStatus.find((s) => s.email === detailSus) : null

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <ZusammenfassungsLeiste
        schueler={schuelerStatus}
        gesamtTeilnehmer={config.teilnehmer?.length ?? schuelerStatus.length}
      />

      {/* Filter + Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 text-xs">
          {(['alle', 'aktiv', 'abgegeben', 'nicht-erschienen'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setQuickFilter(f)}
              className={`px-2.5 py-1 rounded-full cursor-pointer transition-colors
                ${quickFilter === f
                  ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
            >
              {filterLabel(f)}
            </button>
          ))}
        </div>

        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as Sortierung)}
          className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <option value="name">Name (A-Z)</option>
          <option value="klasse">Klasse</option>
          <option value="fortschritt">Fortschritt</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Tabelle */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Verstösse</th>
              <th className="px-3 py-2">Kontrolle</th>
              <th className="px-3 py-2">Gerät</th>
              <th className="px-3 py-2">Frage</th>
              <th className="px-3 py-2">Fortschritt</th>
              <th className="px-2 py-2" title="Zeitzuschlag (Nachteilsausgleich)">⏱ Zeit+</th>
              {config.sebErforderlich && <th className="px-3 py-2">SEB</th>}
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {gefilterteSchueler.map((s) => {
              const stufe = inaktivitaetsStufe(s)
              const fortschrittProzent = s.gesamtFragen > 0
                ? Math.round((s.beantworteteFragen / s.gesamtFragen) * 100)
                : 0
              const zuschlagMin = zeitverlaengerungen[s.email] ?? 0
              return (
                <tr
                  key={s.email}
                  onClick={() => setDetailSus(s.email)}
                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                    ${stufe === 'rot' ? 'bg-red-50 dark:bg-red-900/10' : ''}
                    ${stufe === 'orange' ? 'bg-amber-50 dark:bg-amber-900/10' : ''}
                    ${stufe === 'gelb' ? 'bg-yellow-50 dark:bg-yellow-900/5' : ''}
                  `}
                >
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-medium">
                    {s.name || s.email}
                    {s.klasse && <span className="ml-1 text-xs text-slate-400">({s.klasse})</span>}
                    {stufe && (
                      <span className="ml-1 text-xs" title={`Inaktiv seit >${{ gelb: '1', orange: '3', rot: '5' }[stufe]} Min.`}>
                        {{ gelb: '\uD83D\uDFE1', orange: '\uD83D\uDFE0', rot: '\uD83D\uDD34' }[stufe]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {statusBadge(s.status)}
                  </td>
                  {/* Verstösse */}
                  <td className="px-3 py-2">
                    {s.gesperrt ? (
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold cursor-help text-xs" title={verstossTooltip(s)}>
                          🔒 {s.verstossZaehler ?? 0}/{maxVerstoesse}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleEntsperren(s.email) }}
                          disabled={ladendButtons[`entsperren-${s.email}`]}
                          className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-semibold cursor-pointer hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait"
                        >
                          {ladendButtons[`entsperren-${s.email}`] ? 'Wird entsperrt…' : 'Entsperren'}
                        </button>
                      </div>
                    ) : (s.verstossZaehler ?? 0) > 0 ? (
                      <span
                        className={`font-semibold cursor-help text-xs ${(s.verstossZaehler ?? 0) >= 2 ? 'text-red-600' : 'text-amber-600'}`}
                        title={verstossTooltip(s)}
                      >
                        ⚠️ {s.verstossZaehler}/{maxVerstoesse}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  {/* Kontrolle */}
                  <td className="px-3 py-2 text-xs">
                    {(() => {
                      const lpStufe = (config.kontrollStufe as string) || 'keine'
                      const susStufe = s.kontrollStufe || lpStufe
                      if (susStufe === lpStufe) {
                        return <span>{stufeIcon(susStufe)} {susStufe}</span>
                      }
                      // Nur "auto" anzeigen wenn Tablet-Downgrade (streng→standard)
                      return (
                        <span className="text-amber-700 dark:text-amber-400" title="Automatisch angepasst (Tablet)">
                          {stufeIcon(lpStufe)}→{stufeIcon(susStufe)} auto
                        </span>
                      )
                    })()}
                  </td>
                  {/* Gerät */}
                  <td className="px-3 py-2 text-sm">
                    {s.geraet === 'tablet' ? '📱' : s.geraet === 'laptop' ? '💻' : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                    {s.aktuelleFrage !== null && s.aktuelleFrage !== undefined
                      ? `${s.aktuelleFrage + 1}/${s.gesamtFragen}`
                      : '\u2014'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-20">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${fortschrittProzent}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-8 text-right">{fortschrittProzent}%</span>
                    </div>
                  </td>
                  {/* Zeitzuschlag inline */}
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <ZeitzuschlagInline
                      email={s.email}
                      zuschlagMin={zuschlagMin}
                      basisEndeMs={basisEndeMs}
                      jetzt={jetzt}
                      istAktiv={s.status === 'aktiv' || s.status === 'inaktiv'}
                      onAendern={handleZeitzuschlag}
                    />
                  </td>
                  {config.sebErforderlich && (
                    <td className="px-3 py-2 text-xs">
                      {s.sebVersion ? (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">SEB</span>
                      ) : sebAusnahmenLokal.has(s.email) ? (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Ausnahme</span>
                      ) : s.status !== 'nicht-gestartet' ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSebAusnahme(s.email) }}
                          className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer transition-colors"
                        >
                          Kein SEB — Ausnahme?
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  )}
                  {/* Einzeln beenden */}
                  <td className="px-2 py-2">
                    {(s.status === 'aktiv' || s.status === 'inaktiv') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEinzelBeendenSuS({ email: s.email, name: s.name || s.email })
                        }}
                        className="w-6 h-6 flex items-center justify-center text-xs text-red-400 hover:text-white hover:bg-red-500 rounded cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Abgabe-Zähler */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Abgegeben: {schuelerStatus.filter((s) => s.status === 'abgegeben' || s.status === 'beendet-lp').length} / {config.teilnehmer?.length ?? schuelerStatus.length}
      </p>

      {/* Beenden-Button (U8: grau wenn bereits beendet) */}
      <div className="flex justify-center pt-2 border-t border-slate-200 dark:border-slate-700">
        {config.beendetUm ? (
          <span className="px-6 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg font-medium">
            Prüfung beendet ✓
          </span>
        ) : (
          <button
            type="button"
            disabled={beendenLaeuft}
            onClick={() => {
              // Bei 0 aktiven SuS: direkt beenden ohne Dialog
              const aktive = schuelerStatus.filter((s) => s.status === 'aktiv').length
              if (aktive === 0) {
                setBeendenLaeuft(true)
                const timeoutId = setTimeout(() => {
                  setBeendenLaeuft(false)
                }, 30000)
                apiService.beendePruefung({
                  pruefungId: config.id,
                  email: user?.email ?? '',
                  modus: 'sofort',
                }).then((result) => {
                  clearTimeout(timeoutId)
                  if (result.success) {
                    setBeendenLaeuft(false)
                    onBeenden()
                  } else {
                    setBeendenLaeuft(false)
                  }
                }).catch(() => {
                  clearTimeout(timeoutId)
                  setBeendenLaeuft(false)
                })
                return
              }
              setZeigBeendenDialog(true)
            }}
            className="px-6 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer font-medium disabled:opacity-50"
          >
            {beendenLaeuft ? 'Wird beendet...' : (config.typ === 'formativ' ? 'Übung beenden' : 'Prüfung beenden')}
          </button>
        )}
      </div>

      {/* Detail-Panel */}
      {detailSchueler && (
        <SusDetailPanel
          schueler={detailSchueler}
          pruefungId={config.id}
          onSchliessen={() => setDetailSus(null)}
        />
      )}

      {/* Beenden-Dialog (alle) */}
      {zeigBeendenDialog && (
        <BeendenDialog
          pruefungId={config.id}
          lpEmail={user?.email ?? ''}
          anzahlAktiv={schuelerStatus.filter((s) => s.status === 'aktiv').length}
          istFormativ={config.typ === 'formativ'}
          onBeendet={onBeenden}
          onAbbrechen={() => setZeigBeendenDialog(false)}
        />
      )}

      {/* Beenden-Dialog (einzelner SuS) */}
      {einzelBeendenSuS && (
        <BeendenDialog
          pruefungId={config.id}
          lpEmail={user?.email ?? ''}
          einzelnerSuS={einzelBeendenSuS}
          anzahlAktiv={1}
          istFormativ={config.typ === 'formativ'}
          onBeendet={() => setEinzelBeendenSuS(null)}
          onAbbrechen={() => setEinzelBeendenSuS(null)}
        />
      )}
    </div>
  )
}

// --- Inline-Zeitzuschlag-Komponente ---

interface ZeitzuschlagInlineProps {
  email: string
  zuschlagMin: number
  basisEndeMs: number
  jetzt: number
  istAktiv: boolean
  onAendern: (email: string, minuten: number) => void
}

function ZeitzuschlagInline({ email, zuschlagMin, basisEndeMs, jetzt, istAktiv, onAendern }: ZeitzuschlagInlineProps) {
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editWert, setEditWert] = useState(zuschlagMin)

  // Sync wenn von aussen geaendert
  useEffect(() => {
    setEditWert(zuschlagMin)
  }, [zuschlagMin])

  // Kein Zuschlag: Kleiner "+5" Button
  if (zuschlagMin === 0) {
    return (
      <button
        type="button"
        onClick={() => onAendern(email, 5)}
        className="text-xs px-1.5 py-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded cursor-pointer transition-colors"
      >
        +5
      </button>
    )
  }

  // Berechne ob dieser SuS in Overtime ist (Basis-Ende überschritten, aber persoenliches Ende noch nicht)
  const persoenlichesEndeMs = basisEndeMs + zuschlagMin * 60 * 1000
  const istInOvertime = istAktiv && jetzt >= basisEndeMs && jetzt < persoenlichesEndeMs
  const restSekunden = istInOvertime ? Math.ceil((persoenlichesEndeMs - jetzt) / 1000) : 0

  // Mini-Editor (Popup)
  if (zeigEditor) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editWert}
          onChange={(e) => setEditWert(parseInt(e.target.value) || 0)}
          min={0}
          max={120}
          className="w-12 px-1 py-0.5 text-xs text-center border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAendern(email, editWert)
              setZeigEditor(false)
            } else if (e.key === 'Escape') {
              setEditWert(zuschlagMin)
              setZeigEditor(false)
            }
          }}
          onBlur={() => {
            onAendern(email, editWert)
            setZeigEditor(false)
          }}
        />
        <span className="text-xs text-slate-400">′</span>
      </div>
    )
  }

  // Overtime-Countdown
  if (istInOvertime) {
    const min = Math.floor(restSekunden / 60)
    const sek = restSekunden % 60
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs font-mono text-amber-600 dark:text-amber-400" title={`+${zuschlagMin} Min. Zuschlag — Restzeit`}>
          ⏱ {min}:{sek.toString().padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={() => onAendern(email, zuschlagMin + 5)}
          className="text-[10px] px-1 py-0.5 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 rounded cursor-pointer transition-colors"
        >
          +5
        </button>
      </div>
    )
  }

  // Zuschlag gesetzt, aber noch nicht in Overtime
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setZeigEditor(true)}
        className="text-xs px-2 py-0.5 bg-blue-600 dark:bg-blue-700 text-white rounded font-bold cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        title={`+${zuschlagMin} Min. Zeitzuschlag — klicken zum Bearbeiten`}
      >
        ⏱ +{zuschlagMin}′
      </button>
      <button
        type="button"
        onClick={() => onAendern(email, zuschlagMin + 5)}
        className="text-[10px] px-1 py-0.5 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 rounded cursor-pointer transition-colors"
      >
        +5
      </button>
    </div>
  )
}

// --- Hilfsfunktionen ---

function statusReihenfolge(status: SchuelerStatus['status']): number {
  switch (status) {
    case 'aktiv': return 0
    case 'inaktiv': return 1
    case 'nicht-gestartet': return 2
    case 'abgegeben': return 3
    case 'beendet-lp': return 4
    default: return 5
  }
}

function filterLabel(f: QuickFilter): string {
  switch (f) {
    case 'alle': return 'Alle'
    case 'aktiv': return 'Aktiv'
    case 'abgegeben': return 'Abgegeben'
    case 'nicht-erschienen': return 'Nicht erschienen'
  }
}

function verstossTooltip(s: SchuelerStatus): string {
  if (!s.verstoesse?.length) return 'Keine Verstösse'
  return s.verstoesse.map(v =>
    `${new Date(v.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })} — ${v.typ}${v.dauer_sekunden ? ` (${v.dauer_sekunden}s)` : ''}`
  ).join('\n')
}

function stufeIcon(stufe?: string): string {
  return stufe === 'locker' ? '🟢' : stufe === 'streng' ? '🔴' : '🟡'
}

function statusBadge(status: SchuelerStatus['status']): React.JSX.Element {
  switch (status) {
    case 'aktiv':
      return <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Aktiv</span>
    case 'abgegeben':
      return <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Abgegeben</span>
    case 'nicht-gestartet':
      return <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">Nicht da</span>
    case 'beendet-lp':
      return <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">Beendet</span>
    case 'inaktiv':
      return <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Inaktiv</span>
    default:
      return <span>{status}</span>
  }
}
