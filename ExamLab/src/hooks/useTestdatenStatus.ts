import { useEffect, useState } from 'react'
import { useStammdatenStore } from '../store/stammdatenStore'
import { TEST_KLASSE_ID, TEST_KURS_ID } from '../utils/testdaten/identifikation'
import { istTestdaten } from '../utils/testdaten/filter'
import { apiService } from '../services/apiService'
import { apiTestdatenLetzterSeed } from '../services/testdatenApi'

export interface TestdatenStatus {
  initialisiert: boolean
  ladestand: 'pruefe' | 'fertig'
  /** ISO-Timestamp des letzten Seed/Reset (leer = unbekannt oder Backend ohne
   *  letzterSeedAm-Support). */
  letzterSeedAm: string
  /** Setter fuer letzterSeedAm — Caller (z.B. TestdatenTab nach erfolgreichem
   *  Reset/Seed) kann den Wert aktualisieren ohne erneuten Backend-Roundtrip,
   *  weil apiAdminSeedTestdaten den neuen ISO-Timestamp bereits in der Response
   *  als `statistik.letzterSeedAm` mitliefert. */
  setLetzterSeedAm: (iso: string) => void
}

/**
 * Inferenz aus zwei Quellen (OR):
 *   1. Stammdaten-Marker (klassen.includes('test-klasse-01') + kurse.find(id==='test-kurs-01')) —
 *      greift falls Stammdaten künftig erweitert wird, ist aktuell aber leer (F.2 schreibt
 *      Test-Kurs in `KURSE_SHEET`, nicht in Configs-Stammdaten).
 *   2. PruefungsConfig-Marker: `apiService.ladeAlleConfigs` 1× beim Mount — wenn eine Config
 *      mit `id` oder `klasse` als Test-Record erkennbar ist, gilt das als initialisiert.
 *
 * Für Admins (Yannick) sieht ladeAlleConfigs alle Configs inkl. der Test-Prüfung — Status
 * korrekt. Für non-Admin LPs ohne Test-Kurs-Zugang fehlt die Test-Prüfung in den Configs —
 * Status zeigt dann fälschlich „nicht initialisiert" (akzeptiert, weil dieser LP ohnehin
 * keine Testdaten sieht).
 */
export function useTestdatenStatus(opts?: { email?: string }): TestdatenStatus {
  const stammdaten = useStammdatenStore(s => s.stammdaten)
  const [pruefeFertig, setPruefeFertig] = useState(false)
  const [hatPruefungsMarker, setHatPruefungsMarker] = useState(false)
  const [letzterSeedAm, setLetzterSeedAm] = useState<string>('')

  useEffect(() => {
    let abgebrochen = false
    if (!opts?.email) { setPruefeFertig(true); return }
    // Parallel: configs für Marker-Inferenz, ScriptProperty für letzterSeedAm.
    const configsPromise = apiService.ladeAlleConfigs(opts.email)
      .then(configs => {
        if (abgebrochen) return
        const marker = (configs ?? []).some(c =>
          istTestdaten({ id: c.id, klasse: c.klasse })
        )
        setHatPruefungsMarker(marker)
      })
      .catch(() => { /* swallow — pruefeFertig wird unten gesetzt */ })
    const seedPromise = apiTestdatenLetzterSeed({ email: opts.email })
      .then(r => {
        if (!abgebrochen && r.success && r.letzterSeedAm) setLetzterSeedAm(r.letzterSeedAm)
      })
      .catch(() => { /* Backend ohne letzterSeedAm-Support — letzterSeedAm bleibt '' */ })
    Promise.all([configsPromise, seedPromise]).finally(() => {
      if (!abgebrochen) setPruefeFertig(true)
    })
    return () => { abgebrochen = true }
  }, [opts?.email])

  const hatStammdatenMarker = !!(
    stammdaten &&
    stammdaten.klassen.includes(TEST_KLASSE_ID) &&
    stammdaten.kurse.some(k => k.id === TEST_KURS_ID)
  )

  return {
    initialisiert: hatStammdatenMarker || hatPruefungsMarker,
    ladestand: pruefeFertig ? 'fertig' : 'pruefe',
    letzterSeedAm,
    setLetzterSeedAm,
  }
}
