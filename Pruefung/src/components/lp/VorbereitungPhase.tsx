import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { apiService } from '../../services/apiService'
import type { PruefungsConfig, Teilnehmer } from '../../types/pruefung'
import KlassenAuswahl from './KlassenAuswahl'
import type { KlassenGruppe } from './KlassenAuswahl'
import TeilnehmerListe from './TeilnehmerListe'

interface Props {
  config: PruefungsConfig
  onTeilnehmerGesetzt: (teilnehmer: Teilnehmer[]) => void
}

export default function VorbereitungPhase({ config, onTeilnehmerGesetzt }: Props) {
  const user = useAuthStore((s) => s.user)
  const [gruppen, setGruppen] = useState<KlassenGruppe[]>([])
  const [ladeStatus, setLadeStatus] = useState<'idle' | 'laden' | 'fertig' | 'fehler'>('idle')
  const [fehler, setFehler] = useState('')
  const [ausgewaehlteKlassen, setAusgewaehlteKlassen] = useState<Set<string>>(new Set())
  const [abgewaehlte, setAbgewaehlte] = useState<Set<string>>(new Set())
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>(config.teilnehmer ?? [])
  const [einladungStatus, setEinladungStatus] = useState<'idle' | 'senden' | 'fertig' | 'fehler'>('idle')
  const [einladungFehler, setEinladungFehler] = useState<string[]>([])

  // Klassenlisten laden
  const ladeKlassenlisten = useCallback(async () => {
    if (!user || !apiService.istKonfiguriert()) return
    setLadeStatus('laden')
    setFehler('')
    try {
      const daten = await apiService.ladeKlassenlisten(user.email)
      // Nach Klasse gruppieren
      const map = new Map<string, KlassenGruppe>()
      for (const eintrag of daten) {
        if (!map.has(eintrag.klasse)) {
          map.set(eintrag.klasse, { klasse: eintrag.klasse, schueler: [] })
        }
        map.get(eintrag.klasse)!.schueler.push(eintrag)
      }
      setGruppen(Array.from(map.values()).sort((a, b) => a.klasse.localeCompare(b.klasse)))
      setLadeStatus('fertig')
    } catch (err) {
      setFehler(String(err))
      setLadeStatus('fehler')
    }
  }, [user])

  useEffect(() => { ladeKlassenlisten() }, [ladeKlassenlisten])

  // Klasse togglen → Teilnehmer-Liste aktualisieren
  const handleToggleKlasse = (klasse: string) => {
    const neueAuswahl = new Set(ausgewaehlteKlassen)
    if (neueAuswahl.has(klasse)) {
      neueAuswahl.delete(klasse)
      setTeilnehmer((prev) => prev.filter((t) => t.klasse !== klasse || t.quelle === 'manuell'))
    } else {
      neueAuswahl.add(klasse)
      const gruppe = gruppen.find((g) => g.klasse === klasse)
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
    setAusgewaehlteKlassen(neueAuswahl)
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

  const handleSpeichern = async () => {
    if (!user) return
    const effektiveTeilnehmer = teilnehmer.filter((t) => !abgewaehlte.has(t.email))
    const erfolg = await apiService.setzeTeilnehmer(user.email, config.id, effektiveTeilnehmer)
    if (erfolg) {
      onTeilnehmerGesetzt(effektiveTeilnehmer)
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
      {/* Klassenlisten */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Teilnehmer auswählen</h3>
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
          <KlassenAuswahl
            gruppen={gruppen}
            ausgewaehlteKlassen={ausgewaehlteKlassen}
            onToggleKlasse={handleToggleKlasse}
          />
        )}
      </div>

      {/* Teilnehmer-Liste */}
      {teilnehmer.length > 0 && (
        <TeilnehmerListe
          teilnehmer={teilnehmer}
          onToggle={handleToggleEinzelne}
          onManuellHinzufuegen={handleManuellHinzufuegen}
          abgewaehlte={abgewaehlte}
        />
      )}

      {/* Manuell hinzufügen (wenn noch keine Klasse gewählt) */}
      {teilnehmer.length === 0 && ladeStatus === 'fertig' && (
        <TeilnehmerListe
          teilnehmer={[]}
          onToggle={() => {}}
          onManuellHinzufuegen={handleManuellHinzufuegen}
          abgewaehlte={abgewaehlte}
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
          disabled={effektiveTeilnehmer.length === 0}
          className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 cursor-pointer font-medium"
        >
          Weiter zur Lobby →
        </button>
      </div>
    </div>
  )
}
