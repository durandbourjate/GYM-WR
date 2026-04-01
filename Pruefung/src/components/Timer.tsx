import { useState, useEffect, useRef } from 'react'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { sebVersion, browserInfo } from '../services/sebService.ts'
import { cleanupNachAbgabe } from '../utils/cleanupNachAbgabe.ts'
import { berechneRestzeit, formatZeit, berechneVerstricheneZeit, formatVerstricheneZeit } from '../utils/zeit.ts'

interface Props {
  onZeitAbgelaufen?: () => void
}

export default function Timer({ onZeitAbgelaufen }: Props) {
  const config = usePruefungStore((s) => s.config)
  const startzeit = usePruefungStore((s) => s.startzeit)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const fragen = usePruefungStore((s) => s.fragen)
  const antworten = usePruefungStore((s) => s.antworten)
  const autoSaveCount = usePruefungStore((s) => s.autoSaveCount)
  const heartbeats = usePruefungStore((s) => s.heartbeats)
  const netzwerkFehler = usePruefungStore((s) => s.netzwerkFehler)
  const unterbrechungen = usePruefungStore((s) => s.unterbrechungen)
  const pruefungAbgeben = usePruefungStore((s) => s.pruefungAbgeben)
  const beendetUm = usePruefungStore((s) => s.beendetUm)
  const restzeitMinuten = usePruefungStore((s) => s.restzeitMinuten)

  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [anzeigeSekunden, setAnzeigeSekunden] = useState<number | null>(null)
  const abgegebenRef = useRef(false)

  // Refs für stale-closure Schutz im Interval
  const antwortenRef = useRef(antworten)
  antwortenRef.current = antworten
  const autoSaveCountRef = useRef(autoSaveCount)
  autoSaveCountRef.current = autoSaveCount
  const heartbeatsRef = useRef(heartbeats)
  heartbeatsRef.current = heartbeats
  const netzwerkFehlerRef = useRef(netzwerkFehler)
  netzwerkFehlerRef.current = netzwerkFehler
  const unterbrechungenRef = useRef(unterbrechungen)
  unterbrechungenRef.current = unterbrechungen

  const zeitModus = config?.zeitModus ?? 'countdown'
  const zusatzMinuten = Number((user?.email && config?.zeitverlaengerungen?.[user.email]) ?? 0)

  // Effektives Beenden-Datum (mit Nachteilsausgleich bei Restzeit)
  const effektivBeendetUm = (() => {
    if (!beendetUm) return null
    const ts = new Date(beendetUm).getTime()
    // Nachteilsausgleich nur bei Restzeit-Modus (restzeitMinuten vorhanden)
    if (restzeitMinuten != null && zusatzMinuten > 0) {
      return new Date(ts + zusatzMinuten * 60000).toISOString()
    }
    return beendetUm
  })()

  // Auto-Abgabe Logik (shared zwischen Countdown und Beenden)
  function autoAbgabe(): void {
    if (abgegebenRef.current) return
    abgegebenRef.current = true
    pruefungAbgeben()
    onZeitAbgelaufen?.()
    // Vollbild verlassen (Prüfung ist vorbei)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})

    try {
      const abgabeObjekt = {
        pruefungId: config!.id,
        email: user?.email ?? '',
        name: user?.name ?? 'Unbekannt',
        startzeit,
        abgabezeit: new Date().toISOString(),
        antworten: antwortenRef.current,
        meta: {
          sebVersion: sebVersion(),
          browserInfo: browserInfo(),
          autoSaveCount: autoSaveCountRef.current,
          netzwerkFehler: netzwerkFehlerRef.current,
          heartbeats: heartbeatsRef.current,
          unterbrechungen: unterbrechungenRef.current,
          autoAbgabe: true,
        },
      }
      localStorage.setItem(`pruefung-abgabe-${config!.id}`, JSON.stringify(abgabeObjekt))
    } catch {
      // ignorieren
    }

    if (apiService.istKonfiguriert() && !istDemoModus && user?.email) {
      apiService.speichereAntworten({
        pruefungId: config!.id,
        email: user.email,
        antworten: antwortenRef.current,
        version: -1,
        istAbgabe: true,
        gesamtFragen: fragen.length,
      }).then(() => cleanupNachAbgabe(config!.id))
    } else {
      // Demo oder kein Backend — sofort aufräumen
      cleanupNachAbgabe(config!.id)
    }
  }

  useEffect(() => {
    if (!config || !startzeit || abgegeben) return

    const effektiveDauer = (config.dauerMinuten ?? 0) + zusatzMinuten
    const istOpenEnd = zeitModus === 'open-end'

    const update = () => {
      // Fall 1: LP hat Beenden mit Restzeit ausgelöst → Countdown bis effektivBeendetUm
      if (effektivBeendetUm) {
        const beendetTs = new Date(effektivBeendetUm).getTime()
        const restSek = Math.max(0, Math.floor((beendetTs - Date.now()) / 1000))
        setAnzeigeSekunden(restSek)
        if (restSek <= 0) {
          autoAbgabe()
        }
        return
      }

      // Fall 2: Open-End ohne Beenden → Stoppuhr aufwärts
      if (istOpenEnd) {
        setAnzeigeSekunden(berechneVerstricheneZeit(startzeit))
        return
      }

      // Fall 3: Countdown (Standard)
      const rest = berechneRestzeit(startzeit, effektiveDauer)
      setAnzeigeSekunden(rest)
      if (rest <= 0) {
        autoAbgabe()
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps — autoAbgabe nutzt Refs
  }, [config, startzeit, abgegeben, zeitModus, zusatzMinuten, effektivBeendetUm])

  if (!config || anzeigeSekunden === null) return null

  // Modus bestimmen für Anzeige
  const istOpenEndOhneBeenden = zeitModus === 'open-end' && !effektivBeendetUm
  const anzeige = istOpenEndOhneBeenden
    ? formatVerstricheneZeit(anzeigeSekunden)
    : formatZeit(Math.max(0, anzeigeSekunden))

  const warnungStufe = istOpenEndOhneBeenden
    ? 'normal'
    : anzeigeSekunden <= 0
      ? 'abgelaufen'
      : anzeigeSekunden <= 300
        ? 'kritisch'
        : anzeigeSekunden <= 900
          ? 'warnung'
          : 'normal'

  return (
    <div
      className={`font-mono text-lg font-semibold tabular-nums ${
        warnungStufe === 'abgelaufen'
          ? 'text-red-700 dark:text-red-300'
          : warnungStufe === 'kritisch'
            ? 'text-red-600 dark:text-red-400 animate-pulse'
            : warnungStufe === 'warnung'
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-slate-700 dark:text-slate-200'
      }`}
      title={istOpenEndOhneBeenden ? 'Verstrichene Zeit' : (anzeigeSekunden > 0 ? 'Verbleibende Zeit' : 'Zeit abgelaufen')}
    >
      {istOpenEndOhneBeenden && '+'}{anzeige}
      {zusatzMinuten > 0 && (
        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1" title="Nachteilsausgleich">
          (+{zusatzMinuten} Min.)
        </span>
      )}
    </div>
  )
}
