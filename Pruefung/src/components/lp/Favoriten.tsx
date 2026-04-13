import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useFavoritenStore } from '../../store/favoritenStore'
import { apiService } from '../../services/apiService'
import { useLPNavigation } from '../../hooks/useLPNavigation'
import type { PruefungsConfig } from '../../types/pruefung'
// Status direkt aus PruefungsConfig ableiten (ohne TrackerDaten)
import LPHeader from './LPHeader'
import LPSkeleton from './LPSkeleton'

/** Favoriten-Startseite für Lehrpersonen: Favoriten, Korrekturen, anstehende/letzte Prüfungen */
export default function Favoriten() {
  const user = useAuthStore(s => s.user)
  const istDemoModus = useAuthStore(s => s.istDemoModus)
  const rawFavoriten = useFavoritenStore(s => s.favoriten)
  const favoriten = useMemo(() =>
    [...rawFavoriten].sort((a, b) => a.sortierung - b.sortierung),
  [rawFavoriten])

  const { setModus, navigiereZuEinstellungen } = useLPNavigation()
  const [configs, setConfigs] = useState<PruefungsConfig[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')

  // Configs laden
  useEffect(() => {
    if (!user) return
    if (istDemoModus || !apiService.istKonfiguriert()) {
      setConfigs([])
      setLadeStatus('fertig')
      return
    }
    apiService.ladeAlleConfigs(user.email).then(result => {
      if (result) setConfigs(result)
      setLadeStatus('fertig')
    })
  }, [user, istDemoModus])

  // Daten für Sektionen ableiten
  const heute = new Date().toISOString().split('T')[0]

  const offeneKorrekturen = useMemo(() =>
    configs.filter(c => {
      // Beendet → Korrektur offen
      return !!c.beendetUm
    }).slice(0, 10),
  [configs])

  const anstehendePruefungen = useMemo(() =>
    configs
      .filter(c => c.datum && c.datum >= heute && c.typ !== 'formativ')
      .sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''))
      .slice(0, 5),
  [configs, heute])

  const letztePruefungen = useMemo(() =>
    configs
      .filter(c => c.typ !== 'formativ')
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
      .slice(0, 5),
  [configs])

  const letzteUebungen = useMemo(() =>
    configs
      .filter(c => c.typ === 'formativ')
      .sort((a, b) => (b.datum ?? '').localeCompare(a.datum ?? ''))
      .slice(0, 5),
  [configs])

  if (ladeStatus !== 'fertig') return <LPSkeleton />

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <LPHeader
        untertitel={user ? `${user.name} · Lehrperson` : undefined}
        modus="pruefung"
        onModusChange={(m) => setModus(m as 'pruefung' | 'uebung' | 'fragensammlung')}
        aktionsButtons={null}
        onFragensammlung={() => setModus('fragensammlung')}
        onEinstellungen={() => navigiereZuEinstellungen()}
        onHilfe={() => {}}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Willkommen{user?.vorname ? `, ${user.vorname}` : ''}
        </h1>

        {/* Favoriten */}
        <Sektion titel="Favoriten" leer={favoriten.length === 0} leerText="Noch keine Favoriten gesetzt. In den Einstellungen oder per Stern-Icon hinzufügen.">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favoriten.map(fav => (
              <Link
                key={fav.ziel}
                to={fav.typ === 'ort' ? fav.ziel : `/${fav.typ}/${fav.ziel}`}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shadow-sm min-w-[140px]"
              >
                <span className="text-lg">{fav.icon || typIcon(fav.typ)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{fav.label || fav.ziel}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{typLabel(fav.typ)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Sektion>

        {/* Offene Korrekturen */}
        <Sektion titel="Offene Korrekturen" leer={offeneKorrekturen.length === 0} leerText="Keine offenen Korrekturen.">
          <ConfigListe configs={offeneKorrekturen} linkPrefix="/pruefung" linkSuffix="/korrektur" />
        </Sektion>

        {/* Anstehende Prüfungen */}
        <Sektion titel="Anstehende Prüfungen" leer={anstehendePruefungen.length === 0} leerText="Keine anstehenden Prüfungen.">
          <ConfigListe configs={anstehendePruefungen} linkPrefix="/pruefung" />
        </Sektion>

        {/* Letzte Prüfungen */}
        <Sektion titel="Letzte Prüfungen" leer={letztePruefungen.length === 0} leerText="Noch keine Prüfungen erstellt.">
          <ConfigListe configs={letztePruefungen} linkPrefix="/pruefung" />
        </Sektion>

        {/* Letzte Übungen */}
        <Sektion titel="Letzte Übungen" leer={letzteUebungen.length === 0} leerText="Noch keine Übungen erstellt.">
          <ConfigListe configs={letzteUebungen} linkPrefix="/uebung" />
        </Sektion>
      </main>
    </div>
  )
}

// --- Hilfskomponenten ---

function Sektion({ titel, children, leer, leerText }: {
  titel: string
  children: React.ReactNode
  leer: boolean
  leerText: string
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">{titel}</h2>
      {leer ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">{leerText}</p>
      ) : children}
    </section>
  )
}

function ConfigListe({ configs, linkPrefix, linkSuffix = '' }: {
  configs: PruefungsConfig[]
  linkPrefix: string
  linkSuffix?: string
}) {
  return (
    <div className="space-y-2">
      {configs.map(c => {
        const status = configStatus(c)
        return (
          <Link
            key={c.id}
            to={`${linkPrefix}/${c.id}${linkSuffix}`}
            className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {c.titel || 'Unbenannt'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {c.gefaess ? `${c.gefaess} · ` : ''}{c.datum || 'Kein Datum'}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.farbe}`}>
              {status.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function typIcon(typ: string): string {
  switch (typ) {
    case 'ort': return '📍'
    case 'pruefung': return '📝'
    case 'uebung': return '🎯'
    case 'frage': return '❓'
    default: return '📄'
  }
}

function typLabel(typ: string): string {
  switch (typ) {
    case 'ort': return 'App-Ort'
    case 'pruefung': return 'Prüfung'
    case 'uebung': return 'Übung'
    case 'frage': return 'Frage'
    default: return ''
  }
}

/** Einfache Status-Bestimmung direkt aus PruefungsConfig (ohne TrackerDaten) */
function configStatus(c: PruefungsConfig): { label: string; farbe: string } {
  if (c.beendetUm) return { label: 'Beendet', farbe: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
  if (c.freigeschaltet) return { label: 'Aktiv', farbe: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
  return { label: 'Entwurf', farbe: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
}
