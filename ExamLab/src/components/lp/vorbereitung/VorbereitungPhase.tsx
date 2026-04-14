import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore, ladeUndCacheLPs } from '../../../store/authStore'
import { apiService } from '../../../services/apiService'
import type { PruefungsConfig, Teilnehmer } from '../../../types/pruefung'
import type { Berechtigung } from '../../../types/auth'
import type { LPInfo } from '../../../services/lpApi'
import KursAuswahl from './KursAuswahl'
import type { KursGruppe, KlassenlistenSuS } from './KursAuswahl'
import TeilnehmerListe, { type AlleSuS } from './TeilnehmerListe'
import { downloadSebDatei } from '../../../utils/sebConfigGenerator'
import { KontrollStufeSelect } from '../durchfuehrung/KontrollStufeSelect'
import type { KontrollStufe } from '../../../types/lockdown'
import BerechtigungenEditor from '../../shared/BerechtigungenEditor'

interface Props {
  config: PruefungsConfig
  onTeilnehmerGesetzt: (teilnehmer: Teilnehmer[]) => void
  onWeiterZurLobby?: () => void
  onConfigUpdate?: (updates: Partial<PruefungsConfig>) => void
}

export default function VorbereitungPhase({ config, onTeilnehmerGesetzt, onWeiterZurLobby, onConfigUpdate }: Props) {
  const user = useAuthStore((s) => s.user)
  const [rohDaten, setRohDaten] = useState<KlassenlistenSuS[]>([])
  const [ladeStatus, setLadeStatus] = useState<'idle' | 'laden' | 'fertig' | 'fehler'>('idle')
  const [fehler, setFehler] = useState('')
  // Neues State-Modell: Set aller ausgewählten SuS-Emails (ersetzt ausgewaehlteKurse + abgewaehlte)
  const [ausgewaehlteSuS, setAusgewaehlteSuS] = useState<Set<string>>(new Set())
  // Manuell hinzugefügte Teilnehmer (nicht aus Klassenlisten)
  const [manuelleTeilnehmer, setManuelleTeilnehmer] = useState<Teilnehmer[]>([])
  const [einladungStatus, setEinladungStatus] = useState<'idle' | 'senden' | 'fertig' | 'fehler'>('idle')
  const [einladungFehler, setEinladungFehler] = useState<string[]>([])
  const [lobbySpeichern, setLobbySpeichern] = useState(false)
  const [lobbyFehler, setLobbyFehler] = useState('')
  const [zeitverlaengerungen, setZeitverlaengerungen] = useState<Record<string, number>>(config.zeitverlaengerungen ?? {})
  const [kontrollStufe, setKontrollStufe] = useState<KontrollStufe>((config.kontrollStufe as KontrollStufe) || (config.typ === 'formativ' ? 'locker' : 'standard'))
  // Track einladungGesendet separat (Email → true)
  const [einladungGesendetMap, setEinladungGesendetMap] = useState<Set<string>>(
    new Set((config.teilnehmer ?? []).filter((t) => t.einladungGesendet).map((t) => t.email))
  )
  const [kursAuswahlOffen, setKursAuswahlOffen] = useState(true)
  const [lpListe, setLpListe] = useState<LPInfo[]>([])
  const [berechtigungen, setBerechtigungen] = useState<Berechtigung[]>(
    (config.berechtigungen as Berechtigung[] | undefined) ?? []
  )

  // Klassenlisten laden
  const ladeKlassenlisten = useCallback(async () => {
    if (!user || !apiService.istKonfiguriert()) return
    setLadeStatus('laden')
    setFehler('')
    try {
      const daten = await apiService.ladeKlassenlisten(user.email)
      const sus: KlassenlistenSuS[] = daten.map((e) => ({
        email: e.email,
        name: e.name,
        vorname: e.vorname,
        klasse: e.klasse,
        kurs: e.kurs || '—',
      }))
      setRohDaten(sus)
      setLadeStatus('fertig')
    } catch (err) {
      setFehler(String(err))
      setLadeStatus('fehler')
    }
  }, [user])

  useEffect(() => { ladeKlassenlisten() }, [ladeKlassenlisten])
  useEffect(() => { ladeUndCacheLPs().then(setLpListe) }, [])

  // Bei neuer Durchführung (durchfuehrungId ändert sich): lokale States zurücksetzen
  useEffect(() => {
    setAusgewaehlteSuS(new Set((config.teilnehmer ?? []).map((t) => t.email)))
    setManuelleTeilnehmer([])
    setZeitverlaengerungen(config.zeitverlaengerungen ?? {})
    setKontrollStufe((config.kontrollStufe as KontrollStufe) || (config.typ === 'formativ' ? 'locker' : 'standard'))
    setEinladungGesendetMap(new Set((config.teilnehmer ?? []).filter((t) => t.einladungGesendet).map((t) => t.email)))
    setEinladungStatus('idle')
    setLobbyFehler('')
  }, [config.durchfuehrungId])

  // Nach Kurs gruppieren (Sheet-Name)
  const kursGruppen = useMemo((): KursGruppe[] => {
    const map = new Map<string, KlassenlistenSuS[]>()
    for (const s of rohDaten) {
      const kurs = s.kurs || '—'
      if (!map.has(kurs)) map.set(kurs, [])
      map.get(kurs)!.push(s)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([kurs, schueler]) => ({ kurs, schueler }))
  }, [rohDaten])

  // Alle SuS-Emails aus Klassenlisten (für schnelle Lookups)
  const alleKursEmails = useMemo(() => new Set(rohDaten.map((s) => s.email)), [rohDaten])

  // Kurs togglen: Empty/Indeterminate → alle an, Full → alle aus
  const handleToggleKurs = (kurs: string) => {
    const gruppe = kursGruppen.find((g) => g.kurs === kurs)
    if (!gruppe) return

    const emails = gruppe.schueler.map((s) => s.email)
    const alleAusgewaehlt = emails.every((e) => ausgewaehlteSuS.has(e))

    setAusgewaehlteSuS((prev) => {
      const neu = new Set(prev)
      if (alleAusgewaehlt) {
        // Alle aus
        for (const e of emails) neu.delete(e)
      } else {
        // Alle an
        for (const e of emails) neu.add(e)
      }
      return neu
    })
  }

  // Einzelne/r SuS togglen
  const handleToggleSuS = (email: string) => {
    setAusgewaehlteSuS((prev) => {
      const neu = new Set(prev)
      if (neu.has(email)) neu.delete(email)
      else neu.add(email)
      return neu
    })
  }

  // Alle SuS aller Kurse auswählen
  const handleAlleAuswaehlen = () => {
    setAusgewaehlteSuS((prev) => {
      const neu = new Set(prev)
      for (const s of rohDaten) neu.add(s.email)
      return neu
    })
  }

  // Keine SuS auswählen (nur Klassenlisten-SuS entfernen, manuelle behalten)
  const handleKeineAuswaehlen = () => {
    setAusgewaehlteSuS((prev) => {
      const neu = new Set(prev)
      for (const s of rohDaten) neu.delete(s.email)
      return neu
    })
  }

  // Teilnehmer-Liste ableiten aus ausgewaehlteSuS + manuelleTeilnehmer
  const teilnehmer = useMemo((): Teilnehmer[] => {
    // SuS aus Klassenlisten die ausgewählt sind
    const klassenlistenTeilnehmer: Teilnehmer[] = rohDaten
      .filter((s) => ausgewaehlteSuS.has(s.email))
      .map((s) => ({
        email: s.email,
        name: s.name,
        vorname: s.vorname,
        klasse: s.klasse,
        quelle: 'klassenliste' as const,
        einladungGesendet: einladungGesendetMap.has(s.email),
      }))

    // Manuelle Teilnehmer (immer dabei)
    const manuellMitStatus = manuelleTeilnehmer.map((t) => ({
      ...t,
      einladungGesendet: einladungGesendetMap.has(t.email),
    }))

    return [...klassenlistenTeilnehmer, ...manuellMitStatus]
  }, [rohDaten, ausgewaehlteSuS, manuelleTeilnehmer, einladungGesendetMap])

  // Abgewaehlte für TeilnehmerListe ableiten (leeres Set — alle in der Liste sind ausgewählt)
  // TeilnehmerListe zeigt nur SuS die in `teilnehmer` sind; die sind per Definition ausgewählt.
  const abgewaehlte = useMemo(() => new Set<string>(), [])

  // Toggle in TeilnehmerListe: SuS ab-/anwählen
  const handleTeilnehmerToggle = (email: string) => {
    // Wenn aus Klassenliste: über ausgewaehlteSuS steuern
    if (alleKursEmails.has(email)) {
      handleToggleSuS(email)
    } else {
      // Manueller Teilnehmer: entfernen
      setManuelleTeilnehmer((prev) => prev.filter((t) => t.email !== email))
    }
  }

  const handleManuellHinzufuegen = (email: string) => {
    if (teilnehmer.some((t) => t.email === email)) return
    // Prüfen ob Email in Klassenlisten existiert
    if (alleKursEmails.has(email)) {
      // Einfach zur Auswahl hinzufügen
      setAusgewaehlteSuS((prev) => new Set(prev).add(email))
    } else {
      setManuelleTeilnehmer((prev) => [...prev, {
        email,
        name: email.split('@')[0],
        vorname: '',
        klasse: '—',
        quelle: 'manuell' as const,
      }])
    }
  }

  const handleSuSHinzufuegen = (sus: AlleSuS) => {
    if (teilnehmer.some((t) => t.email === sus.email)) return
    // SuS aus Klassenliste → einfach auswählen
    if (alleKursEmails.has(sus.email)) {
      setAusgewaehlteSuS((prev) => new Set(prev).add(sus.email))
    } else {
      setManuelleTeilnehmer((prev) => [...prev, {
        email: sus.email,
        name: sus.name,
        vorname: sus.vorname,
        klasse: sus.klasse,
        quelle: 'klassenliste' as const,
      }])
    }
  }

  const handleSpeichern = async () => {
    if (!user) return
    setLobbySpeichern(true)
    setLobbyFehler('')
    // Alle Teilnehmer sind effektiv (keine abgewaehlten mehr im neuen Modell)
    onTeilnehmerGesetzt(teilnehmer)
    onWeiterZurLobby?.()
    try {
      const erfolg = await apiService.setzeTeilnehmer(user.email, config.id, teilnehmer)
      if (!erfolg) {
        setLobbyFehler('Teilnehmer konnten nicht gespeichert werden. Bitte erneut versuchen.')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      setLobbyFehler(`Fehler beim Speichern: ${msg}`)
    } finally {
      setLobbySpeichern(false)
    }
  }

  const handleEinladungen = async () => {
    if (!user) return
    setEinladungStatus('senden')
    setEinladungFehler([])
    const zuSenden = teilnehmer.filter((t) => !t.einladungGesendet)
    const pruefungUrl = `${window.location.origin}${window.location.pathname}?id=${config.id}`
    try {
      const ergebnisse = await apiService.sendeEinladungen(
        user.email,
        config.id,
        config.titel,
        pruefungUrl,
        zuSenden.map((t) => ({ email: t.email, name: t.name, vorname: t.vorname })),
      )
      const erfolgreich = new Set(ergebnisse.filter((e) => e.erfolg).map((e) => e.email))
      setEinladungGesendetMap((prev) => {
        const neu = new Set(prev)
        for (const email of erfolgreich) neu.add(email)
        return neu
      })
      const fehler = ergebnisse.filter((e) => !e.erfolg)
      if (fehler.length > 0) {
        setEinladungFehler(fehler.map((f) => `${f.email}: ${f.fehler}`))
        setEinladungStatus('fehler')
      } else {
        setEinladungStatus('fertig')
      }
    } catch (err) {
      setEinladungFehler([String(err)])
      setEinladungStatus('fehler')
    }
  }

  const handleLinkKopieren = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${config.id}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
      {/* Kurs-Auswahl (Collapsible) */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setKursAuswahlOffen(!kursAuswahlOffen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span>Kurs auswählen</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({kursGruppen.length} {kursGruppen.length === 1 ? 'Kurs' : 'Kurse'}, {ausgewaehlteSuS.size} SuS ausgewählt)
            </span>
          </span>
          <div className="flex items-center gap-2">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); ladeKlassenlisten() }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); ladeKlassenlisten() } }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Neu laden
            </span>
            <span className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${kursAuswahlOffen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>
        {kursAuswahlOffen && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
            {ladeStatus === 'laden' && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Klassenlisten werden geladen...</p>
            )}
            {ladeStatus === 'fehler' && (
              <p className="text-sm text-red-600 dark:text-red-400">{fehler}</p>
            )}
            {ladeStatus === 'fertig' && (
              <KursAuswahl
                kursGruppen={kursGruppen}
                ausgewaehlteSuS={ausgewaehlteSuS}
                onToggleKurs={handleToggleKurs}
                onToggleSuS={handleToggleSuS}
                onAlleAuswaehlen={handleAlleAuswaehlen}
                onKeineAuswaehlen={handleKeineAuswaehlen}
              />
            )}
          </div>
        )}
      </div>

      {/* Teilnehmer-Liste */}
      {teilnehmer.length > 0 && (
        <TeilnehmerListe
          teilnehmer={teilnehmer}
          onToggle={handleTeilnehmerToggle}
          onManuellHinzufuegen={handleManuellHinzufuegen}
          onSuSHinzufuegen={handleSuSHinzufuegen}
          abgewaehlte={abgewaehlte}
          alleSuS={rohDaten}
          zeitverlaengerungen={zeitverlaengerungen}
          onZeitzuschlagChange={(email, minuten) => {
            const neueZV = { ...zeitverlaengerungen }
            if (minuten === null) {
              delete neueZV[email]
            } else {
              neueZV[email] = minuten
            }
            setZeitverlaengerungen(neueZV)
            onConfigUpdate?.({ zeitverlaengerungen: neueZV })
          }}
        />
      )}

      {/* Manuell hinzufügen (wenn noch kein SuS gewählt) */}
      {teilnehmer.length === 0 && (
        <TeilnehmerListe
          teilnehmer={[]}
          onToggle={() => {}}
          onManuellHinzufuegen={handleManuellHinzufuegen}
          onSuSHinzufuegen={handleSuSHinzufuegen}
          abgewaehlte={abgewaehlte}
          alleSuS={rohDaten}
        />
      )}

      {/* Prüfungs-Link */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 font-mono truncate">
          {window.location.origin}{window.location.pathname}?id={config.id}
        </span>
        <button
          type="button"
          onClick={handleLinkKopieren}
          className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
        >
          Kopieren
        </button>
        {config.sebErforderlich && (
          <button
            type="button"
            onClick={() => downloadSebDatei(config.id, config.titel)}
            className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
          >
            SEB-Datei
          </button>
        )}
      </div>

      {/* Kontrollstufe (Soft-Lockdown) */}
      <KontrollStufeSelect
        value={kontrollStufe}
        onChange={(stufe) => {
          setKontrollStufe(stufe)
          onConfigUpdate?.({ kontrollStufe: stufe })
        }}
      />

      {/* Prüfungs-Sharing */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">{config.typ === 'formativ' ? 'Übung teilen' : 'Prüfung teilen'}</h3>
        <BerechtigungenEditor
          berechtigungen={berechtigungen}
          onChange={(neueB) => {
            setBerechtigungen(neueB)
            onConfigUpdate?.({ berechtigungen: neueB as PruefungsConfig['berechtigungen'] })
          }}
          lpListe={lpListe}
          eigeneFachschaft={user?.fachschaft}
        />
      </div>

      {/* Einladungs-Fehler */}
      {einladungFehler.length > 0 && (
        <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
          {einladungFehler.map((f, i) => <p key={i}>{f}</p>)}
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={handleEinladungen}
          disabled={teilnehmer.length === 0 || einladungStatus === 'senden'}
          className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
        >
          {einladungStatus === 'senden' ? 'Sende...' : 'Einladungen versenden'}
        </button>

        <button
          type="button"
          onClick={handleSpeichern}
          disabled={teilnehmer.length === 0 || lobbySpeichern}
          className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 cursor-pointer font-medium"
        >
          {lobbySpeichern ? 'Speichere...' : 'Weiter zur Lobby'}
        </button>
      </div>

      {lobbyFehler && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {lobbyFehler}
        </div>
      )}
    </div>
  )
}
