import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import type { PruefungsKorrektur, SchuelerAbgabe } from '../../../types/korrektur.ts'
import type { Frage } from '../../../types/fragen.ts'
import type { NotenConfig } from '../../../types/pruefung.ts'
import { berechneStatistiken, berechneFragenStatistiken, berechneGesamtpunkte } from '../../../utils/korrekturUtils.ts'
import { autoKorrigiere, istAutoKorrigierbar } from '../../../utils/autoKorrektur.ts'
import type { KorrekturErgebnis } from '../../../utils/autoKorrektur.ts'
import { erstelleDemoAbgaben, erstelleDemoKorrektur } from '../../../data/demoKorrektur.ts'
import { einrichtungsFragen } from '../../../data/einrichtungsFragen.ts'

type Sortierung = 'name' | 'punkte' | 'status'

interface KorrekturDatenOptions {
  pruefungId: string
  userEmail: string
  queueSave: (data: import('../../../types/korrektur.ts').KorrekturZeileUpdate) => void
  updateKorrekturRef: (k: PruefungsKorrektur | null) => void
}

export function useKorrekturDaten({ pruefungId, userEmail, queueSave, updateKorrekturRef }: KorrekturDatenOptions) {
  const [korrektur, setKorrektur] = useState<PruefungsKorrektur | null>(null)
  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [notenConfig, setNotenConfig] = useState<NotenConfig>({ punkteFuerSechs: 0, rundung: 0.5 })
  const [einsichtFreigegeben, setEinsichtFreigegeben] = useState(false)
  const [pdfFreigegeben, setPdfFreigegeben] = useState(false)
  const [sortierung, setSortierung] = useState<Sortierung>('name')

  // Korrektur-Daten für IndexedDB-Backup aktuell halten
  useEffect(() => { updateKorrekturRef(korrektur) }, [korrektur, updateKorrekturRef])

  // Auto-Korrektur für alle SuS × Fragen berechnen
  const autoErgebnisseAlle = useMemo<Record<string, Record<string, KorrekturErgebnis | null>>>(() => {
    if (fragen.length === 0 || Object.keys(abgaben).length === 0) return {}
    const result: Record<string, Record<string, KorrekturErgebnis | null>> = {}
    for (const [email, abgabe] of Object.entries(abgaben)) {
      const schuelerErgebnisse: Record<string, KorrekturErgebnis | null> = {}
      for (const frage of fragen) {
        const antwort = abgabe.antworten[frage.id]
        schuelerErgebnisse[frage.id] = autoKorrigiere(frage, antwort)
      }
      result[email] = schuelerErgebnisse
    }
    return result
  }, [fragen, abgaben])

  // Auto-Korrektur-Ergebnisse in Bewertungen übernehmen (wenn kiPunkte noch leer)
  // Abhängig von korrektur UND autoErgebnisse — weil korrektur async geladen wird
  useEffect(() => {
    if (Object.keys(autoErgebnisseAlle).length === 0) return
    if (!korrektur) return // Korrektur noch nicht geladen — warten

    let hatAenderungen = false
    const aktualisierteSchueler = korrektur.schueler.map((s) => {
      const autoErgebnisse = autoErgebnisseAlle[s.email]
      if (!autoErgebnisse) return s

      let schuelerGeaendert = false
      const neueBewertungen = { ...s.bewertungen }

      for (const [frageId, ergebnis] of Object.entries(autoErgebnisse)) {
        if (!ergebnis) continue
        const bew = neueBewertungen[frageId]
        if (!bew) continue
        // Nur überschreiben wenn noch keine Punkte gesetzt (null, undefined, leerer String)
        const kiLeer = bew.kiPunkte == null || bew.kiPunkte === ('' as unknown as number)
        const lpLeer = bew.lpPunkte == null || bew.lpPunkte === ('' as unknown as number)
        if (kiLeer && lpLeer) {
          neueBewertungen[frageId] = {
            ...bew,
            kiPunkte: ergebnis.erreichtePunkte,
            lpPunkte: ergebnis.erreichtePunkte,
            quelle: 'auto' as const,
          }
          schuelerGeaendert = true
          hatAenderungen = true
        }
      }

      return schuelerGeaendert ? { ...s, bewertungen: neueBewertungen } : s
    })

    // Nur setKorrektur aufrufen wenn wirklich Änderungen → kein Endlos-Loop
    // (kiLeer/lpLeer ist beim nächsten Durchlauf false → hatAenderungen bleibt false)
    if (hatAenderungen) {
      // gesamtPunkte für alle SuS neu berechnen (sonst bleibt gesamtPunkte=0 nach Auto-Korrektur)
      // NUR punkte aktualisieren, maxPunkte beibehalten (kommt korrekt aus config.gesamtpunkte)
      const mitGesamtpunkten = aktualisierteSchueler.map((s) => {
        const { punkte } = berechneGesamtpunkte(s.bewertungen)
        return { ...s, gesamtPunkte: punkte }
      })
      setKorrektur({ ...korrektur, schueler: mitGesamtpunkten })
    }
  }, [autoErgebnisseAlle, korrektur])

  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Daten laden
  useEffect(() => {
    if (!userEmail) return

    // Demo-Modus: Lokale Demo-Daten verwenden
    if (istDemoModus || !apiService.istKonfiguriert()) {
      setFragen(einrichtungsFragen)
      setAbgaben(erstelleDemoAbgaben())
      setKorrektur(erstelleDemoKorrektur())
      setLadeStatus('fertig')
      return
    }

    async function lade(): Promise<void> {
      const [korrekturResult, abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeKorrektur(pruefungId, userEmail),
        apiService.ladeAbgaben(pruefungId, userEmail),
        apiService.ladePruefung(pruefungId, userEmail),
      ])

      if (abgabenResult) setAbgaben(abgabenResult)
      if (pruefungResult) setFragen(pruefungResult.fragen)

      if (korrekturResult && korrekturResult.schueler.length > 0) {
        setKorrektur(korrekturResult)
      } else if (abgabenResult && Object.keys(abgabenResult).length > 0) {
        const gesamtPunkte = pruefungResult?.config?.gesamtpunkte || 0
        const synthetisiert: PruefungsKorrektur = {
          pruefungId,
          pruefungTitel: pruefungResult?.config?.titel || pruefungId,
          datum: pruefungResult?.config?.datum || '',
          klasse: pruefungResult?.config?.klasse || '',
          schueler: Object.values(abgabenResult).map((abgabe) => ({
            email: abgabe.email,
            name: abgabe.name,
            klasse: '',
            bewertungen: Object.fromEntries(
              (pruefungResult?.fragen || []).map((f) => [f.id, {
                frageId: f.id,
                fragenTyp: f.typ,
                maxPunkte: f.punkte,
                kiPunkte: null,
                lpPunkte: null,
                kiBegruendung: null,
                kiFeedback: null,
                lpKommentar: null,
                quelle: 'manuell' as const,
                geprueft: false,
              }])
            ),
            gesamtPunkte: 0,
            maxPunkte: gesamtPunkte,
            korrekturStatus: 'offen' as const,
          })),
          batchStatus: 'idle',
          letzteAktualisierung: new Date().toISOString(),
        }
        setKorrektur(synthetisiert)
      } else if (korrekturResult) {
        setKorrektur(korrekturResult)
      }
      setLadeStatus(korrekturResult || abgabenResult ? 'fertig' : 'fehler')
    }
    lade()
  }, [userEmail, pruefungId, istDemoModus])

  // Auto-korrigierbare Fragen als geprüft markieren
  const autoGeprueftGesetzt = useRef(false)
  useEffect(() => {
    if (!korrektur || fragen.length === 0 || autoGeprueftGesetzt.current) return

    const autoFragen = fragen.filter((f) => istAutoKorrigierbar(f.typ))
    if (autoFragen.length === 0) { autoGeprueftGesetzt.current = true; return }

    const aenderungen: Array<{ schuelerEmail: string; frageId: string }> = []
    const aktualisierteSchueler = korrektur.schueler.map((schueler) => {
      let schuelerGeaendert = false
      const neueBewertungen = { ...schueler.bewertungen }
      for (const frage of autoFragen) {
        const bewertung = neueBewertungen[frage.id]
        if (bewertung && bewertung.geprueft) continue
        neueBewertungen[frage.id] = {
          ...(bewertung || { kiPunkte: null, lpPunkte: null, kommentar: '' }),
          geprueft: true,
        }
        schuelerGeaendert = true
        aenderungen.push({ schuelerEmail: schueler.email, frageId: frage.id })
      }
      return schuelerGeaendert ? { ...schueler, bewertungen: neueBewertungen } : schueler
    })

    autoGeprueftGesetzt.current = true
    if (aenderungen.length > 0) {
      setKorrektur({ ...korrektur, schueler: aktualisierteSchueler })
      for (const { schuelerEmail, frageId } of aenderungen) {
        queueSave({ pruefungId, schuelerEmail, frageId, geprueft: true })
      }
    }
  }, [korrektur, fragen, pruefungId, queueSave])

  // Berechnete Werte
  const sortierteSchueler = [...(korrektur?.schueler ?? [])].sort((a, b) => {
    switch (sortierung) {
      case 'name': return a.name.localeCompare(b.name)
      case 'punkte': return b.gesamtPunkte - a.gesamtPunkte
      case 'status': return a.korrekturStatus.localeCompare(b.korrekturStatus)
      default: return 0
    }
  })

  const bewertungenOhnePunkte = useMemo(() => {
    if (!korrektur) return 0
    let count = 0
    for (const s of korrektur.schueler) {
      for (const b of Object.values(s.bewertungen)) {
        if (b.lpPunkte === null && b.kiPunkte === null) count++
      }
    }
    return count
  }, [korrektur])

  // Statistiken nur für abgegebene SuS berechnen (aktive SuS haben 0 Punkte und verfälschen Noten)
  const abgegebeneSchueler = korrektur
    ? korrektur.schueler.filter(s => abgaben[s.email])
    : []
  const stats = abgegebeneSchueler.length > 0 ? berechneStatistiken(abgegebeneSchueler, notenConfig) : null
  const fragenStats = korrektur ? berechneFragenStatistiken(korrektur) : []
  const maxPunkte = korrektur?.schueler[0]?.maxPunkte || 0

  return {
    korrektur, setKorrektur,
    abgaben, fragen,
    ladeStatus,
    notenConfig, setNotenConfig,
    einsichtFreigegeben, setEinsichtFreigegeben,
    pdfFreigegeben, setPdfFreigegeben,
    sortierung, setSortierung,
    autoErgebnisseAlle,
    sortierteSchueler,
    bewertungenOhnePunkte,
    stats, fragenStats, maxPunkte,
  }
}
