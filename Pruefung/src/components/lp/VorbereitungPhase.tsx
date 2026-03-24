import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiService } from '../../services/apiService'
import type { PruefungsConfig, Teilnehmer } from '../../types/pruefung'
import KursAuswahl from './KursAuswahl'
import type { KursGruppe, KlassenlistenSuS } from './KursAuswahl'
import TeilnehmerListe, { type AlleSuS } from './TeilnehmerListe'
import { downloadSebDatei } from '../../utils/sebConfigGenerator'

interface Props {
  config: PruefungsConfig
  onTeilnehmerGesetzt: (teilnehmer: Teilnehmer[]) => void
  onWeiterZurLobby?: () => void
}

export default function VorbereitungPhase({ config, onTeilnehmerGesetzt, onWeiterZurLobby }: Props) {
  const user = useAuthStore((s) => s.user)
  const [rohDaten, setRohDaten] = useState<KlassenlistenSuS[]>([])
  const [ladeStatus, setLadeStatus] = useState<'idle' | 'laden' | 'fertig' | 'fehler'>('idle')
  const [fehler, setFehler] = useState('')
  const [ausgewaehlteKurse, setAusgewaehlteKurse] = useState<Set<string>>(new Set())
  const [abgewaehlte, setAbgewaehlte] = useState<Set<string>>(new Set())
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>(config.teilnehmer ?? [])
  const [einladungStatus, setEinladungStatus] = useState<'idle' | 'senden' | 'fertig' | 'fehler'>('idle')
  const [einladungFehler, setEinladungFehler] = useState<string[]>([])
  const [lobbySpeichern, setLobbySpeichern] = useState(false)
  const [lobbyFehler, setLobbyFehler] = useState('')

  // Klassenlisten laden
  const ladeKlassenlisten = useCallback(async () => {
    if (!user || !apiService.istKonfiguriert()) return
    setLadeStatus('laden')
    setFehler('')
    try {
      const daten = await apiService.ladeKlassenlisten(user.email)
      // Rohdaten speichern (jeder Eintrag hat kurs = Sheet-Name)
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

  // Kurs togglen → Teilnehmer-Liste aktualisieren
  const handleToggleKurs = (kurs: string) => {
    const neueAuswahl = new Set(ausgewaehlteKurse)

    if (neueAuswahl.has(kurs)) {
      // Kurs abwählen: nur SuS entfernen, die nicht durch andere gewählte Kurse abgedeckt sind
      neueAuswahl.delete(kurs)

      // Emails aller SuS in den verbleibenden gewählten Kursen sammeln
      const abgedeckteEmails = new Set<string>()
      for (const kg of kursGruppen) {
        if (neueAuswahl.has(kg.kurs)) {
          for (const s of kg.schueler) abgedeckteEmails.add(s.email)
        }
      }

      setTeilnehmer((prev) =>
        prev.filter((t) => t.quelle === 'manuell' || abgedeckteEmails.has(t.email)),
      )
    } else {
      // Kurs auswählen: SuS hinzufügen, die noch nicht in der Teilnehmer-Liste sind
      neueAuswahl.add(kurs)
      const gruppe = kursGruppen.find((g) => g.kurs === kurs)
      if (gruppe) {
        const neue: Teilnehmer[] = gruppe.schueler
          .filter((s) => !teilnehmer.some((t) => t.email === s.email))
          .map((s) => ({
            email: s.email,
            name: s.name,
            vorname: s.vorname,
            klasse: s.klasse,
            quelle: 'klassenliste' as const,
          }))
        setTeilnehmer((prev) => [...prev, ...neue])
      }
    }
    setAusgewaehlteKurse(neueAuswahl)
  }

  const handleToggleEinzelne = (email: string) => {
    const neues = new Set(abgewaehlte)
    if (neues.has(email)) neues.delete(email)
    else neues.add(email)
    setAbgewaehlte(neues)
  }

  const handleManuellHinzufuegen = (email: string) => {
    if (teilnehmer.some((t) => t.email === email)) return
    setTeilnehmer((prev) => [...prev, {
      email,
      name: email.split('@')[0],
      vorname: '',
      klasse: '—',
      quelle: 'manuell' as const,
    }])
  }

  const handleSuSHinzufuegen = (sus: AlleSuS) => {
    if (teilnehmer.some((t) => t.email === sus.email)) return
    setTeilnehmer((prev) => [...prev, {
      email: sus.email,
      name: sus.name,
      vorname: sus.vorname,
      klasse: sus.klasse,
      quelle: 'klassenliste' as const,
    }])
  }

  const handleSpeichern = async () => {
    if (!user) return
    setLobbySpeichern(true)
    setLobbyFehler('')
    try {
      const effektiveTeilnehmer = teilnehmer.filter((t) => !abgewaehlte.has(t.email))
      const erfolg = await apiService.setzeTeilnehmer(user.email, config.id, effektiveTeilnehmer)
      if (erfolg) {
        onTeilnehmerGesetzt(effektiveTeilnehmer)
        onWeiterZurLobby?.()
      } else {
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
    const zuSenden = teilnehmer
      .filter((t) => !abgewaehlte.has(t.email) && !t.einladungGesendet)
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
      setTeilnehmer((prev) =>
        prev.map((t) => erfolgreich.has(t.email) ? { ...t, einladungGesendet: true } : t),
      )
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

  const effektiveTeilnehmer = teilnehmer.filter((t) => !abgewaehlte.has(t.email))

  return (
    <div className="space-y-6">
      {/* Kurs-Auswahl */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kurs auswählen</h3>
          <button
            type="button"
            onClick={ladeKlassenlisten}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Neu laden
          </button>
        </div>

        {ladeStatus === 'laden' && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Klassenlisten werden geladen...</p>
        )}
        {ladeStatus === 'fehler' && (
          <p className="text-sm text-red-600 dark:text-red-400">{fehler}</p>
        )}
        {ladeStatus === 'fertig' && (
          <KursAuswahl
            kursGruppen={kursGruppen}
            ausgewaehlteKurse={ausgewaehlteKurse}
            onToggleKurs={handleToggleKurs}
          />
        )}
      </div>

      {/* Teilnehmer-Liste */}
      {teilnehmer.length > 0 && (
        <TeilnehmerListe
          teilnehmer={teilnehmer}
          onToggle={handleToggleEinzelne}
          onManuellHinzufuegen={handleManuellHinzufuegen}
          onSuSHinzufuegen={handleSuSHinzufuegen}
          abgewaehlte={abgewaehlte}
          alleSuS={rohDaten}
        />
      )}

      {/* Manuell hinzufügen (wenn noch kein Kurs gewählt) */}
      {teilnehmer.length === 0 && ladeStatus === 'fertig' && (
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
          title="Link kopieren"
        >
          📋 Kopieren
        </button>
        {config.sebErforderlich && (
          <button
            type="button"
            onClick={() => downloadSebDatei(config.id, config.titel)}
            className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
            title="SEB-Konfigurationsdatei herunterladen"
          >
            📥 SEB-Datei
          </button>
        )}
      </div>

      {/* Einladungs-Fehler */}
      {einladungFehler.length > 0 && (
        <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
          {einladungFehler.map((f, i) => <p key={i}>❌ {f}</p>)}
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={handleEinladungen}
          disabled={effektiveTeilnehmer.length === 0 || einladungStatus === 'senden'}
          className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
        >
          {einladungStatus === 'senden' ? 'Sende...' : '✉️ Einladungen versenden'}
        </button>

        <button
          type="button"
          onClick={handleSpeichern}
          disabled={effektiveTeilnehmer.length === 0 || lobbySpeichern}
          className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 cursor-pointer font-medium"
        >
          {lobbySpeichern ? 'Speichere...' : 'Weiter zur Lobby →'}
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
