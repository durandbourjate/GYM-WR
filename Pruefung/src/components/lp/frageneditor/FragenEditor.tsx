import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { typLabel, bloomLabel } from '../../../utils/fachbereich.ts'
import type {
  Frage, Fachbereich, BloomStufe, Gefaess, FrageAnhang,
  MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage,
  RichtigFalschFrage, BerechnungFrage,
  MCOption, Bewertungskriterium,
} from '../../../types/fragen.ts'
import type { FrageTyp } from './editorUtils.ts'
import { generiereFrageId, parseLuecken } from './editorUtils.ts'
import { Abschnitt, Feld } from './EditorBausteine.tsx'
import MCEditor from './MCEditor.tsx'
import LueckentextEditor from './LueckentextEditor.tsx'
import ZuordnungEditor from './ZuordnungEditor.tsx'
import RichtigFalschEditor from './RichtigFalschEditor.tsx'
import BerechnungEditor from './BerechnungEditor.tsx'
import BewertungsrasterEditor from './BewertungsrasterEditor.tsx'
import AnhangEditor from './AnhangEditor.tsx'
import { useKIAssistent } from './KIAssistentPanel.tsx'
import { InlineAktionButton, ErgebnisAnzeige } from './KIBausteine.tsx'
import { berechneZeitbedarf } from '../../../utils/zeitbedarf.ts'
import type { Lernziel } from '../../../types/pool.ts'
import FormattierungsToolbar from './FormattierungsToolbar.tsx'
import PoolUpdateVergleich from './PoolUpdateVergleich.tsx'



interface Props {
  /** Bestehende Frage zum Bearbeiten, oder null für neue */
  frage: Frage | null
  onSpeichern: (frage: Frage) => void
  onAbbrechen: () => void
}

/** Vollbild-Editor zum Erstellen und Bearbeiten von Prüfungsfragen */
export default function FragenEditor({ frage, onSpeichern, onAbbrechen }: Props) {
  const user = useAuthStore((s) => s.user)

  // Grunddaten
  const [typ, setTyp] = useState<FrageTyp>(frage?.typ as FrageTyp ?? 'mc')
  const [fachbereich, setFachbereich] = useState<Fachbereich>(frage?.fachbereich ?? 'VWL')
  const [thema, setThema] = useState(frage?.thema ?? '')
  const [unterthema, setUnterthema] = useState(frage?.unterthema ?? '')
  const [bloom, setBloom] = useState<BloomStufe>(frage?.bloom ?? 'K2')
  const [punkte, setPunkte] = useState(frage?.punkte ?? 1)
  const [tags, setTags] = useState(frage?.tags.join(', ') ?? '')
  const [semester, setSemester] = useState<string[]>(frage?.semester ?? [])
  const [gefaesse, setGefaesse] = useState<Gefaess[]>(frage?.gefaesse ?? ['SF'])

  // Gemeinsam
  const [fragetext, setFragetext] = useState(
    frage && 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  )
  const [musterlosung, setMusterlosung] = useState(frage?.musterlosung ?? '')
  const [bewertungsraster, setBewertungsraster] = useState<Bewertungskriterium[]>(
    frage?.bewertungsraster ?? [{ beschreibung: '', punkte: 1 }]
  )


  // MC-spezifisch
  const [optionen, setOptionen] = useState<MCOption[]>(
    frage?.typ === 'mc' ? (frage as MCFrage).optionen : [
      { id: 'a', text: '', korrekt: true },
      { id: 'b', text: '', korrekt: false },
      { id: 'c', text: '', korrekt: false },
      { id: 'd', text: '', korrekt: false },
    ]
  )
  const [mehrfachauswahl, setMehrfachauswahl] = useState(
    frage?.typ === 'mc' ? (frage as MCFrage).mehrfachauswahl : false
  )

  // Freitext-spezifisch (State beibehalten für Speicherung, UI-Editor entfernt)
  const [laenge] = useState<'kurz' | 'mittel' | 'lang'>(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).laenge : 'mittel'
  )
  const [placeholder] = useState(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).hilfstextPlaceholder ?? '' : ''
  )

  // Lückentext-spezifisch
  const [textMitLuecken, setTextMitLuecken] = useState(
    frage?.typ === 'lueckentext' ? (frage as LueckentextFrage).textMitLuecken : ''
  )
  const [luecken, setLuecken] = useState(
    frage?.typ === 'lueckentext' ? (frage as LueckentextFrage).luecken : []
  )

  // Zuordnung-spezifisch
  const [paare, setPaare] = useState(
    frage?.typ === 'zuordnung' ? (frage as ZuordnungFrage).paare : [
      { links: '', rechts: '' },
      { links: '', rechts: '' },
    ]
  )

  // Richtig/Falsch-spezifisch
  const [aussagen, setAussagen] = useState<RichtigFalschFrage['aussagen']>(
    frage?.typ === 'richtigfalsch' ? (frage as RichtigFalschFrage).aussagen : [
      { id: '1', text: '', korrekt: true },
      { id: '2', text: '', korrekt: false },
      { id: '3', text: '', korrekt: true },
    ]
  )

  // Berechnung-spezifisch
  const [ergebnisse, setErgebnisse] = useState<BerechnungFrage['ergebnisse']>(
    frage?.typ === 'berechnung' ? (frage as BerechnungFrage).ergebnisse : [
      { id: '1', label: 'Ergebnis', korrekt: 0, toleranz: 0, einheit: '' },
    ]
  )
  const [rechenwegErforderlich, setRechenwegErforderlich] = useState(
    frage?.typ === 'berechnung' ? (frage as BerechnungFrage).rechenwegErforderlich : true
  )
  const [hilfsmittel, setHilfsmittel] = useState(
    frage?.typ === 'berechnung' ? (frage as BerechnungFrage).hilfsmittel ?? '' : ''
  )

  // Zeitbedarf
  const [zeitbedarf, setZeitbedarf] = useState<number>(
    frage?.zeitbedarf ?? berechneZeitbedarf(
      (frage?.typ ?? 'mc') as 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung',
      frage?.bloom ?? 'K2',
      frage?.typ === 'freitext' ? { laenge: (frage as FreitextFrage).laenge } : undefined,
    )
  )
  const [zeitbedarfManuell, setZeitbedarfManuell] = useState(!!frage?.zeitbedarf)

  // Sharing
  const [geteilt, setGeteilt] = useState<'privat' | 'schule'>(frage?.geteilt ?? 'privat')

  // Anhänge
  const [anhaenge, setAnhaenge] = useState<FrageAnhang[]>(frage?.anhaenge ?? [])
  const [neueAnhaenge, setNeueAnhaenge] = useState<File[]>([])

  // Validierung
  const [fehler, setFehler] = useState<string[]>([])
  const [speicherLaeuft, setSpeicherLaeuft] = useState(false)

  // KI-Assistent
  const ki = useKIAssistent()

  // Lernziel-Generierung
  const [lernziele, setLernziele] = useState<Lernziel[]>([])
  const [zeigLernzielDialog, setZeigLernzielDialog] = useState(false)
  const [gewaehlterLernzielId, setGewaehlterLernzielId] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)
  const fragetextRef = useRef<HTMLTextAreaElement>(null)
  const musterloeRef = useRef<HTMLTextAreaElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen, damit Overlay unterhalb des Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  // Resizable Panel
  const MIN_BREITE = 480
  const MAX_BREITE_FAKTOR = 0.9 // 90vw
  const [panelBreite, setPanelBreite] = useState(1008) // gleich wie FragenBrowser
  const ziehtRef = useRef(false)
  const startXRef = useRef(0)
  const startBreiteRef = useRef(0)

  const handleZiehStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    ziehtRef.current = true
    startXRef.current = e.clientX
    startBreiteRef.current = panelBreite
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [panelBreite])

  useEffect(() => {
    function handleMauseBewegung(e: MouseEvent): void {
      if (!ziehtRef.current) return
      const maxBreite = window.innerWidth * MAX_BREITE_FAKTOR
      // Panel ist rechts → nach links ziehen = grösser
      const delta = startXRef.current - e.clientX
      const neueBreite = Math.min(maxBreite, Math.max(MIN_BREITE, startBreiteRef.current + delta))
      setPanelBreite(neueBreite)
    }

    function handleMauseLos(): void {
      if (!ziehtRef.current) return
      ziehtRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMauseBewegung)
    document.addEventListener('mouseup', handleMauseLos)
    return () => {
      document.removeEventListener('mousemove', handleMauseBewegung)
      document.removeEventListener('mouseup', handleMauseLos)
    }
  }, [])

  function validiere(): string[] {
    const errs: string[] = []
    if (!thema.trim()) errs.push('Thema fehlt')
    if (!fragetext.trim()) errs.push('Fragetext fehlt')
    if (punkte <= 0) errs.push('Punkte müssen > 0 sein')

    if (typ === 'mc') {
      if (optionen.filter((o) => o.text.trim()).length < 2) errs.push('Mindestens 2 Optionen nötig')
      if (!optionen.some((o) => o.korrekt)) errs.push('Mindestens 1 korrekte Option nötig')
    }
    if (typ === 'lueckentext') {
      if (!textMitLuecken.includes('{{')) errs.push('Lückentext braucht {{1}}-Platzhalter')
    }
    if (typ === 'zuordnung') {
      if (paare.filter((p) => p.links.trim() && p.rechts.trim()).length < 2) errs.push('Mindestens 2 Paare nötig')
    }
    if (typ === 'richtigfalsch') {
      if (aussagen.filter((a) => a.text.trim()).length < 2) errs.push('Mindestens 2 Aussagen nötig')
    }
    if (typ === 'berechnung') {
      if (ergebnisse.filter((e) => e.label.trim()).length < 1) errs.push('Mindestens 1 Ergebnis nötig')
    }
    return errs
  }

  async function handleSpeichern(): Promise<void> {
    const errs = validiere()
    if (errs.length > 0) {
      setFehler(errs)
      return
    }
    setFehler([])
    setSpeicherLaeuft(true)

    const jetzt = new Date().toISOString()
    const tagListe = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const id = frage?.id ?? generiereFrageId(fachbereich, typ)

    // Neue Anhänge hochladen
    let alleAnhaenge = [...anhaenge]
    if (neueAnhaenge.length > 0 && user && apiService.istKonfiguriert()) {
      for (const datei of neueAnhaenge) {
        try {
          const ergebnis = await apiService.uploadAnhang(user.email, id, datei)
          if (ergebnis) {
            alleAnhaenge.push(ergebnis)
          } else {
            console.warn(`[FragenEditor] Upload fehlgeschlagen für: ${datei.name}`)
          }
        } catch (err) {
          console.error(`[FragenEditor] Upload-Fehler für ${datei.name}:`, err)
        }
      }
      // Lokale State aktualisieren
      setAnhaenge(alleAnhaenge)
      setNeueAnhaenge([])
    }

    const basis = {
      id,
      version: frage ? frage.version + 1 : 1,
      erstelltAm: frage?.erstelltAm ?? jetzt,
      geaendertAm: jetzt,
      fachbereich,
      thema: thema.trim(),
      unterthema: unterthema.trim() || undefined,
      semester,
      gefaesse,
      bloom,
      tags: tagListe,
      punkte,
      musterlosung: musterlosung.trim(),
      bewertungsraster: bewertungsraster.filter((b) => b.beschreibung.trim()),
      zeitbedarf: zeitbedarfManuell ? zeitbedarf : berechneZeitbedarf(
        typ as 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung',
        bloom,
        typ === 'freitext' ? { laenge } : undefined,
      ),
      verwendungen: frage?.verwendungen ?? [],
      quelle: frage?.quelle ?? 'manuell' as const,
      anhaenge: alleAnhaenge.length > 0 ? alleAnhaenge : undefined,
      autor: frage?.autor ?? user?.email,
      geteilt,
    }

    let neueFrage: Frage

    switch (typ) {
      case 'mc':
        neueFrage = {
          ...basis,
          typ: 'mc',
          fragetext: fragetext.trim(),
          optionen: optionen.filter((o) => o.text.trim()),
          mehrfachauswahl,
          zufallsreihenfolge: true,
        } as MCFrage
        break
      case 'freitext':
        neueFrage = {
          ...basis,
          typ: 'freitext',
          fragetext: fragetext.trim(),
          laenge,
          hilfstextPlaceholder: placeholder.trim() || undefined,
        } as FreitextFrage
        break
      case 'lueckentext':
        neueFrage = {
          ...basis,
          typ: 'lueckentext',
          fragetext: fragetext.trim(),
          textMitLuecken: textMitLuecken.trim(),
          luecken: luecken.length > 0 ? luecken : parseLuecken(textMitLuecken),
        } as LueckentextFrage
        break
      case 'zuordnung':
        neueFrage = {
          ...basis,
          typ: 'zuordnung',
          fragetext: fragetext.trim(),
          paare: paare.filter((p) => p.links.trim() && p.rechts.trim()),
          zufallsreihenfolge: true,
        } as ZuordnungFrage
        break
      case 'richtigfalsch':
        neueFrage = {
          ...basis,
          typ: 'richtigfalsch',
          fragetext: fragetext.trim(),
          aussagen: aussagen.filter((a) => a.text.trim()).map((a) => ({
            ...a,
            text: a.text.trim(),
          })),
        } as RichtigFalschFrage
        break
      case 'berechnung':
        neueFrage = {
          ...basis,
          typ: 'berechnung',
          fragetext: fragetext.trim(),
          ergebnisse: ergebnisse.filter((e) => e.label.trim()),
          rechenwegErforderlich,
          hilfsmittel: hilfsmittel.trim() || undefined,
        } as BerechnungFrage
        break
    }

    setSpeicherLaeuft(false)
    onSpeichern(neueFrage)
  }

  // ESC schliesst den Editor (stoppt Propagation, damit nicht die Fragenbank geschlossen wird)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onAbbrechen()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true) // capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onAbbrechen])

  return (
    <div className="fixed inset-0 z-[55] flex pointer-events-none">
      <div className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-auto" style={{ top: headerH }} onClick={onAbbrechen} />

      <div ref={panelRef} className="absolute right-0 bottom-0 bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto overflow-hidden" style={{ top: headerH, width: panelBreite, maxWidth: '90vw' }} onWheel={(e) => e.stopPropagation()}>
        {/* Drag-Handle zum Resize */}
        <div
          onMouseDown={handleZiehStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-slate-400/50 active:bg-slate-400/70 transition-colors"
          title="Breite anpassen"
        />
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {frage ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onAbbrechen}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <button
              onClick={handleSpeichern}
              disabled={speicherLaeuft}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {speicherLaeuft ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* Fehler */}
        {fehler.length > 0 && (
          <div className="mx-5 mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            {fehler.map((f, i) => (
              <p key={i} className="text-sm text-red-700 dark:text-red-300">{f}</p>
            ))}
          </div>
        )}

        {/* Scrollbarer Inhalt */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">

          {/* Pool-Info für importierte Fragen */}
          {frage?.quelle === 'pool' && frage.poolId && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Importiert aus Pool: <strong>{frage.quellReferenz || frage.poolId}</strong>
                </span>
                <div className="flex gap-2">
                  {!frage.pruefungstauglich ? (
                    <button
                      onClick={() => {
                        const aktualisiert = { ...frage, pruefungstauglich: true, geaendertAm: new Date().toISOString() }
                        onSpeichern(aktualisiert)
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Prüfungstauglich ✓
                    </button>
                  ) : (
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded">
                      ✓ Prüfungstauglich
                    </span>
                  )}
                </div>
              </div>

              {frage.poolUpdateVerfuegbar && frage.poolVersion && (
                <PoolUpdateVergleich
                  frage={frage}
                  onUebernehmen={() => {
                    onSpeichern({ ...frage, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() })
                  }}
                  onIgnorieren={() => {
                    onSpeichern({ ...frage, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() })
                  }}
                />
              )}
            </div>
          )}

          {/* Fragetyp wählen */}
          <Abschnitt titel="Fragetyp" einklappbar standardOffen={!frage}>
            <div className="flex gap-2 flex-wrap">
              {(['mc', 'freitext', 'lueckentext', 'zuordnung', 'richtigfalsch', 'berechnung'] as FrageTyp[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTyp(t)}
                  disabled={!!frage}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer
                    ${typ === t
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                    ${frage ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  {typLabel(t)}
                </button>
              ))}
            </div>
          </Abschnitt>

          {/* Grunddaten */}
          <Abschnitt
            titel="Zuordnung"
            einklappbar
            standardOffen={!frage}
            titelRechts={ki.verfuegbar ? (
              <button
                onClick={() => ki.ausfuehren('klassifiziereFrage', { fragetext })}
                disabled={!fragetext.trim() || ki.ladeAktion !== null}
                title="KI klassifiziert die Frage und schlägt Fachbereich, Thema, Bloom-Stufe und Tags vor"
                className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors cursor-pointer inline-flex items-center gap-1
                  ${!fragetext.trim() || ki.ladeAktion !== null
                    ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                {ki.ladeAktion === 'klassifiziereFrage' ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Klassifiziere...
                  </>
                ) : (
                  'KI klassifizieren'
                )}
              </button>
            ) : undefined}
          >
            {/* KI-Klassifizierungs-Ergebnis */}
            {ki.ergebnisse.klassifiziereFrage && (
              <div className="mb-3">
                <ErgebnisAnzeige
                  ergebnis={ki.ergebnisse.klassifiziereFrage}
                  vorschauKey="zusammenfassung"
                  renderVorschau={(daten) => {
                    const fb = daten.fachbereich as string | undefined
                    const th = daten.thema as string | undefined
                    const uth = daten.unterthema as string | undefined
                    const bl = daten.bloom as string | undefined
                    const tg = daten.tags as string[] | undefined
                    return (
                      <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                        {fb && <p><span className="text-xs text-slate-500 dark:text-slate-400">Fachbereich:</span> {fb}</p>}
                        {th && <p><span className="text-xs text-slate-500 dark:text-slate-400">Thema:</span> {th}</p>}
                        {uth && <p><span className="text-xs text-slate-500 dark:text-slate-400">Unterthema:</span> {uth}</p>}
                        {bl && <p><span className="text-xs text-slate-500 dark:text-slate-400">Bloom:</span> {bl}</p>}
                        {Array.isArray(tg) && tg.length > 0 && (
                          <p><span className="text-xs text-slate-500 dark:text-slate-400">Tags:</span> {tg.join(', ')}</p>
                        )}
                      </div>
                    )
                  }}
                  onUebernehmen={() => {
                    const d = ki.ergebnisse.klassifiziereFrage?.daten
                    if (d) {
                      if (typeof d.fachbereich === 'string' && ['VWL', 'BWL', 'Recht'].includes(d.fachbereich)) {
                        setFachbereich(d.fachbereich as Fachbereich)
                      }
                      if (typeof d.thema === 'string' && d.thema.trim()) setThema(d.thema.trim())
                      if (typeof d.unterthema === 'string' && d.unterthema.trim()) setUnterthema(d.unterthema.trim())
                      if (typeof d.bloom === 'string' && /^K[1-6]$/.test(d.bloom)) setBloom(d.bloom as BloomStufe)
                      if (Array.isArray(d.tags) && d.tags.length > 0) setTags(d.tags.join(', '))
                    }
                    ki.verwerfen('klassifiziereFrage')
                  }}
                  onVerwerfen={() => ki.verwerfen('klassifiziereFrage')}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Feld label="Fachbereich">
                <select value={fachbereich} onChange={(e) => setFachbereich(e.target.value as Fachbereich)} className="input-field">
                  <option value="VWL">VWL</option>
                  <option value="BWL">BWL</option>
                  <option value="Recht">Recht</option>
                </select>
              </Feld>
              <Feld label="Bloom-Stufe">
                <select value={bloom} onChange={(e) => setBloom(e.target.value as BloomStufe)} className="input-field">
                  {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomStufe[]).map((k) => (
                    <option key={k} value={k}>{k} — {bloomLabel(k)}</option>
                  ))}
                </select>
              </Feld>
              <Feld label="Thema *">
                <input type="text" value={thema} onChange={(e) => setThema(e.target.value)}
                  placeholder="z.B. Marktgleichgewicht" className="input-field" />
              </Feld>
              <Feld label="Zeitbedarf (Min.)">
                <input
                  type="number"
                  value={zeitbedarf}
                  onChange={(e) => { setZeitbedarf(parseFloat(e.target.value) || 0); setZeitbedarfManuell(true) }}
                  min={0.5}
                  max={60}
                  step={0.5}
                  className="input-field"
                  title="Geschätzter Zeitbedarf in Minuten"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {zeitbedarfManuell ? 'Manuell gesetzt' : 'Geschätzt (Typ + Taxonomie)'}
                </p>
              </Feld>
              <Feld label="Unterthema">
                <input type="text" value={unterthema} onChange={(e) => setUnterthema(e.target.value)}
                  placeholder="z.B. Angebot & Nachfrage" className="input-field" />
              </Feld>
              <Feld label="Punkte *">
                <input type="number" value={punkte} onChange={(e) => setPunkte(parseInt(e.target.value) || 0)}
                  min={1} max={20} className="input-field" />
              </Feld>
              <Feld label="Tags (Komma-getrennt)">
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
                  placeholder="z.B. Angebot, Nachfrage, BIP" className="input-field" />
              </Feld>
            </div>

            {/* Semester + Gefässe */}
            <div className="flex gap-6 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semester</label>
                <div className="flex gap-1 flex-wrap">
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSemester((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                      className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer
                        ${semester.includes(s)
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                        }`}
                    >{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Gefäss</label>
                <div className="flex gap-1">
                  {(['SF', 'EF', 'EWR', 'GF'] as Gefaess[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGefaesse((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])}
                      className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer
                        ${gefaesse.includes(g)
                          ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                          : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                        }`}
                    >{g}</button>
                  ))}
                </div>
              </div>

              {/* Sharing / Teilen */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Sichtbarkeit</label>
                <div className="flex w-48 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
                  <button
                    onClick={() => setGeteilt('privat')}
                    className={`flex-1 px-3 py-1 text-xs transition-colors cursor-pointer ${
                      geteilt === 'privat'
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Privat
                  </button>
                  <button
                    onClick={() => setGeteilt('schule')}
                    className={`flex-1 px-3 py-1 text-xs transition-colors cursor-pointer border-l border-slate-300 dark:border-slate-600 ${
                      geteilt === 'schule'
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Schule
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {geteilt === 'schule' ? 'Sichtbar für alle @gymhofwil.ch Lehrpersonen' : 'Nur für Sie sichtbar'}
                </p>
              </div>
            </div>
          </Abschnitt>

          {/* Fragetext */}
          <Abschnitt
            titel="Fragetext *"
            titelRechts={ki.verfuegbar ? (
              <div className="flex gap-1.5">
                <InlineAktionButton
                  label="Generieren"
                  tooltip="KI erstellt einen neuen Fragetext basierend auf Thema, Fachbereich und Taxonomiestufe"
                  hinweis={!thema.trim() ? 'Thema nötig' : undefined}
                  disabled={!thema.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'generiereFragetext'}
                  onClick={() => ki.ausfuehren('generiereFragetext', { fachbereich, thema, unterthema, typ, bloom })}
                />
                <InlineAktionButton
                  label="Prüfen & Verbessern"
                  tooltip="KI prüft den Fragetext auf Klarheit, Eindeutigkeit und Taxonomie-Passung"
                  hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                  disabled={!fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'verbessereFragetext'}
                  onClick={() => ki.ausfuehren('verbessereFragetext', { fragetext })}
                />
                <InlineAktionButton
                  label="🎯 Lernziel"
                  tooltip="Frage basierend auf einem Lernziel aus den Übungspools generieren"
                  disabled={ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'generiereFrageZuLernziel'}
                  onClick={async () => {
                    if (!lernziele.length) {
                      const lz = await apiService.ladeLernziele(fachbereich)
                      setLernziele(lz)
                    }
                    setZeigLernzielDialog(true)
                  }}
                />
              </div>
            ) : undefined}
          >
            <FormattierungsToolbar textareaRef={fragetextRef} value={fragetext} onChange={setFragetext} />
            <textarea
              ref={fragetextRef}
              value={fragetext}
              onChange={(e) => setFragetext(e.target.value)}
              rows={4}
              placeholder="Formulieren Sie die Frage... (Markdown: **fett**, *kursiv*)"
              className="input-field resize-y"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Tipp: **fett** für Hervorhebungen, \n für Absätze
            </p>
            {/* KI-Ergebnisse */}
            {ki.ergebnisse.generiereFragetext && (
              <div className="mt-2">
                <ErgebnisAnzeige
                  ergebnis={ki.ergebnisse.generiereFragetext}
                  vorschauKey="fragetext"
                  zusatzKey="musterlosung"
                  onUebernehmen={() => {
                    const d = ki.ergebnisse.generiereFragetext?.daten
                    if (d) {
                      if (typeof d.fragetext === 'string') setFragetext(d.fragetext)
                      if (typeof d.musterlosung === 'string') setMusterlosung(d.musterlosung)
                    }
                    ki.verwerfen('generiereFragetext')
                  }}
                  onVerwerfen={() => ki.verwerfen('generiereFragetext')}
                />
              </div>
            )}
            {ki.ergebnisse.verbessereFragetext && (
              <div className="mt-2">
                <ErgebnisAnzeige
                  ergebnis={ki.ergebnisse.verbessereFragetext}
                  vorschauKey="fragetext"
                  zusatzKey="aenderungen"
                  onUebernehmen={() => {
                    const d = ki.ergebnisse.verbessereFragetext?.daten
                    if (d && typeof d.fragetext === 'string') setFragetext(d.fragetext)
                    ki.verwerfen('verbessereFragetext')
                  }}
                  onVerwerfen={() => ki.verwerfen('verbessereFragetext')}
                />
              </div>
            )}
            {/* Lernziel-Dialog */}
            {zeigLernzielDialog && (
              <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600">
                <label className="block text-sm font-medium mb-1 dark:text-white">Lernziel auswählen:</label>
                <select
                  value={gewaehlterLernzielId}
                  onChange={e => setGewaehlterLernzielId(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded mb-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">— Lernziel wählen —</option>
                  {lernziele.map(lz => (
                    <option key={lz.id} value={lz.id}>{lz.text} ({lz.bloom})</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    disabled={!gewaehlterLernzielId || ki.ladeAktion === 'generiereFrageZuLernziel'}
                    onClick={() => {
                      const lz = lernziele.find(l => l.id === gewaehlterLernzielId)
                      if (lz) {
                        ki.ausfuehren('generiereFrageZuLernziel', {
                          lernziel: lz.text, bloom: lz.bloom || bloom,
                          thema: lz.thema, fragetyp: typ,
                        })
                        setZeigLernzielDialog(false)
                      }
                    }}
                    className="px-3 py-1 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-600"
                  >
                    {ki.ladeAktion === 'generiereFrageZuLernziel' ? 'Generiert...' : 'Generieren'}
                  </button>
                  <button onClick={() => setZeigLernzielDialog(false)}
                    className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
            {/* KI-Ergebnis: Lernziel-Generierung */}
            {ki.ergebnisse.generiereFrageZuLernziel && (
              <div className="mt-2">
                <ErgebnisAnzeige
                  ergebnis={ki.ergebnisse.generiereFrageZuLernziel}
                  vorschauKey="fragetext"
                  zusatzKey="musterlosung"
                  onUebernehmen={() => {
                    const d = ki.ergebnisse.generiereFrageZuLernziel?.daten
                    if (d) {
                      if (typeof d.fragetext === 'string') setFragetext(d.fragetext)
                      if (typeof d.musterlosung === 'string') setMusterlosung(d.musterlosung)
                    }
                    ki.verwerfen('generiereFrageZuLernziel')
                  }}
                  onVerwerfen={() => ki.verwerfen('generiereFrageZuLernziel')}
                />
              </div>
            )}
          </Abschnitt>

          {/* Anhänge (Bilder, PDFs, Audio, Video, URLs) */}
          <AnhangEditor
            anhaenge={anhaenge}
            neueAnhaenge={neueAnhaenge}
            onAnhangHinzu={(file) => setNeueAnhaenge((prev) => [...prev, file])}
            onAnhangEntfernen={(id) => setAnhaenge((prev) => prev.filter((a) => a.id !== id))}
            onNeuenAnhangEntfernen={(idx) => setNeueAnhaenge((prev) => prev.filter((_, i) => i !== idx))}
            onUrlAnhangHinzu={(anhang) => setAnhaenge((prev) => [...prev, anhang])}
          />

          {/* Typ-spezifische Felder */}
          {typ === 'mc' && (
            <>
              <MCEditor
                optionen={optionen}
                setOptionen={setOptionen}
                mehrfachauswahl={mehrfachauswahl}
                setMehrfachauswahl={setMehrfachauswahl}
                titelRechts={ki.verfuegbar ? (
                  <InlineAktionButton
                    label="Optionen generieren"
                    tooltip="KI erstellt Antwortoptionen (korrekte und falsche) passend zum Fragetext"
                    hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                    disabled={!fragetext.trim() || ki.ladeAktion !== null}
                    ladend={ki.ladeAktion === 'generiereOptionen'}
                    onClick={() => ki.ausfuehren('generiereOptionen', { fragetext })}
                  />
                ) : undefined}
              />
              {ki.ergebnisse.generiereOptionen && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.generiereOptionen}
                    vorschauKey="optionen"
                    renderVorschau={(daten) => {
                      const opts = daten.optionen as Array<{ text: string; korrekt: boolean }> | undefined
                      if (!Array.isArray(opts)) return null
                      return (
                        <ul className="space-y-1">
                          {opts.map((o, i) => (
                            <li key={i} className={`text-sm px-2 py-1 rounded ${o.korrekt ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>
                              {o.korrekt ? '\u2713 ' : '\u2717 '}{o.text}
                            </li>
                          ))}
                        </ul>
                      )
                    }}
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.generiereOptionen?.daten
                      if (d && Array.isArray(d.optionen)) {
                        const neueOptionen: MCOption[] = (d.optionen as Array<{ text: string; korrekt: boolean }>).map((o, i) => ({
                          id: String.fromCharCode(97 + i),
                          text: o.text,
                          korrekt: o.korrekt,
                        }))
                        const merged = neueOptionen.length >= optionen.length
                          ? neueOptionen
                          : [...neueOptionen, ...optionen.slice(neueOptionen.length)]
                        setOptionen(merged)
                      }
                      ki.verwerfen('generiereOptionen')
                    }}
                    onVerwerfen={() => ki.verwerfen('generiereOptionen')}
                  />
                </div>
              )}
            </>
          )}


          {typ === 'lueckentext' && (
            <>
              <LueckentextEditor
                textMitLuecken={textMitLuecken}
                setTextMitLuecken={setTextMitLuecken}
                luecken={luecken}
                setLuecken={setLuecken}
                titelRechts={ki.verfuegbar ? (
                  <div className="flex gap-1.5">
                    <InlineAktionButton
                      label="Generieren"
                      tooltip="KI markiert sinnvolle Lückenstellen im Text"
                      hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                      disabled={!fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'generiereLuecken'}
                      onClick={() => ki.ausfuehren('generiereLuecken', { fragetext, textMitLuecken: textMitLuecken || fragetext })}
                    />
                    <InlineAktionButton
                      label="Prüfen & Verbessern"
                      tooltip="KI prüft ob alle akzeptierten Antwort-Varianten vollständig sind"
                      hinweis={!(textMitLuecken.includes('{{') && luecken.length > 0) ? 'Lückentext mit {{}} nötig' : undefined}
                      disabled={!(textMitLuecken.includes('{{') && luecken.length > 0) || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'pruefeLueckenAntworten'}
                      onClick={() => ki.ausfuehren('pruefeLueckenAntworten', { textMitLuecken, luecken })}
                    />
                  </div>
                ) : undefined}
              />
              {ki.ergebnisse.generiereLuecken && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.generiereLuecken}
                    vorschauKey="textMitLuecken"
                    renderVorschau={(daten) => {
                      const text = daten.textMitLuecken as string | undefined
                      const l = daten.luecken as Array<{ id: string; korrekteAntworten: string[] }> | undefined
                      if (!text) return null
                      return (
                        <div className="space-y-2">
                          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{text}</p>
                          {Array.isArray(l) && l.length > 0 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {l.map((luecke, i) => (
                                <span key={i} className="inline-block mr-3">
                                  {`{{${luecke.id}}}`}: {luecke.korrekteAntworten.join(' / ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }}
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.generiereLuecken?.daten
                      if (d) {
                        if (typeof d.textMitLuecken === 'string') setTextMitLuecken(d.textMitLuecken)
                        if (Array.isArray(d.luecken)) {
                          setLuecken((d.luecken as Array<{ id: string; korrekteAntworten: string[] }>).map((l) => ({
                            id: l.id, korrekteAntworten: l.korrekteAntworten, caseSensitive: false,
                          })))
                        }
                      }
                      ki.verwerfen('generiereLuecken')
                    }}
                    onVerwerfen={() => ki.verwerfen('generiereLuecken')}
                  />
                </div>
              )}
              {ki.ergebnisse.pruefeLueckenAntworten && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.pruefeLueckenAntworten}
                    vorschauKey="bewertung"
                    renderVorschau={(daten) => {
                      const bewertung = daten.bewertung as string | undefined
                      const ergaenzt = daten.ergaenzteAntworten as Array<{ id: string; korrekteAntworten: string[] }> | undefined
                      return (
                        <div className="space-y-2">
                          {bewertung && <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{bewertung}</p>}
                          {Array.isArray(ergaenzt) && ergaenzt.length > 0 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              <p className="font-medium mb-1">Ergänzte Antwort-Varianten:</p>
                              {ergaenzt.map((l, i) => (
                                <span key={i} className="inline-block mr-3">{`{{${l.id}}}`}: {l.korrekteAntworten.join(' / ')}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }}
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.pruefeLueckenAntworten?.daten
                      if (d && Array.isArray(d.ergaenzteAntworten)) {
                        setLuecken((d.ergaenzteAntworten as Array<{ id: string; korrekteAntworten: string[] }>).map((l) => ({
                          id: l.id, korrekteAntworten: l.korrekteAntworten, caseSensitive: false,
                        })))
                      }
                      ki.verwerfen('pruefeLueckenAntworten')
                    }}
                    onVerwerfen={() => ki.verwerfen('pruefeLueckenAntworten')}
                  />
                </div>
              )}
            </>
          )}

          {typ === 'zuordnung' && (
            <>
              <ZuordnungEditor
                paare={paare}
                setPaare={setPaare}
                titelRechts={ki.verfuegbar ? (
                  <div className="flex gap-1.5">
                    <InlineAktionButton
                      label="Generieren"
                      tooltip="KI erstellt passende Zuordnungspaare basierend auf dem Fragetext"
                      hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                      disabled={!fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'generierePaare'}
                      onClick={() => ki.ausfuehren('generierePaare', { fragetext, fachbereich, thema })}
                    />
                    <InlineAktionButton
                      label="Prüfen & Verbessern"
                      tooltip="KI prüft die Paare auf Konsistenz und Eindeutigkeit"
                      hinweis={!(paare.filter((p) => p.links.trim() && p.rechts.trim()).length >= 2) ? 'Mind. 2 Paare nötig' : undefined}
                      disabled={!(paare.filter((p) => p.links.trim() && p.rechts.trim()).length >= 2) || !fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'pruefePaare'}
                      onClick={() => ki.ausfuehren('pruefePaare', { fragetext, paare })}
                    />
                  </div>
                ) : undefined}
              />
              {ki.ergebnisse.generierePaare && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.generierePaare}
                    vorschauKey="paare"
                    renderVorschau={(daten) => {
                      const p = daten.paare as Array<{ links: string; rechts: string }> | undefined
                      if (!Array.isArray(p)) return null
                      return (
                        <div className="space-y-1">
                          {p.map((paar, i) => (
                            <div key={i} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2">
                              <span className="font-medium">{paar.links}</span>
                              <span className="text-slate-400">{'\u2192'}</span>
                              <span>{paar.rechts}</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.generierePaare?.daten
                      if (d && Array.isArray(d.paare)) {
                        setPaare(d.paare as { links: string; rechts: string }[])
                      }
                      ki.verwerfen('generierePaare')
                    }}
                    onVerwerfen={() => ki.verwerfen('generierePaare')}
                  />
                </div>
              )}
              {ki.ergebnisse.pruefePaare && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.pruefePaare}
                    vorschauKey="bewertung"
                    zusatzKey="verbesserungen"
                    onUebernehmen={() => ki.verwerfen('pruefePaare')}
                    onVerwerfen={() => ki.verwerfen('pruefePaare')}
                  />
                </div>
              )}
            </>
          )}

          {typ === 'richtigfalsch' && (
            <>
              <RichtigFalschEditor
                aussagen={aussagen}
                setAussagen={setAussagen}
                titelRechts={ki.verfuegbar ? (
                  <div className="flex gap-1.5">
                    <InlineAktionButton
                      label="Generieren"
                      tooltip="KI erstellt Richtig/Falsch-Aussagen passend zum Thema"
                      hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                      disabled={!fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'generiereAussagen'}
                      onClick={() => ki.ausfuehren('generiereAussagen', { fragetext, fachbereich, thema })}
                    />
                    <InlineAktionButton
                      label="Prüfen & Verbessern"
                      tooltip="KI prüft Aussagen auf Balance, Eindeutigkeit und fachliche Korrektheit"
                      hinweis={!(aussagen.filter((a) => a.text.trim()).length >= 2) ? 'Mind. 2 Aussagen nötig' : undefined}
                      disabled={!(aussagen.filter((a) => a.text.trim()).length >= 2) || !fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'pruefeAussagen'}
                      onClick={() => ki.ausfuehren('pruefeAussagen', { fragetext, aussagen })}
                    />
                  </div>
                ) : undefined}
              />
              {ki.ergebnisse.generiereAussagen && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.generiereAussagen}
                    vorschauKey="aussagen"
                    renderVorschau={(daten) => {
                      const a = daten.aussagen as Array<{ text: string; korrekt: boolean; erklaerung?: string }> | undefined
                      if (!Array.isArray(a)) return null
                      return (
                        <ul className="space-y-1">
                          {a.map((aus, i) => (
                            <li key={i} className={`text-sm px-2 py-1 rounded ${aus.korrekt ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                              {aus.korrekt ? '\u2713 ' : '\u2717 '}{aus.text}
                              {aus.erklaerung && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">{aus.erklaerung}</span>}
                            </li>
                          ))}
                        </ul>
                      )
                    }}
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.generiereAussagen?.daten
                      if (d && Array.isArray(d.aussagen)) {
                        const neue = (d.aussagen as Array<{ text: string; korrekt: boolean; erklaerung?: string }>).map((a, i) => ({
                          id: String(i + 1), text: a.text, korrekt: a.korrekt, erklaerung: a.erklaerung,
                        }))
                        setAussagen(neue)
                      }
                      ki.verwerfen('generiereAussagen')
                    }}
                    onVerwerfen={() => ki.verwerfen('generiereAussagen')}
                  />
                </div>
              )}
              {ki.ergebnisse.pruefeAussagen && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.pruefeAussagen}
                    vorschauKey="bewertung"
                    zusatzKey="verbesserungen"
                    onUebernehmen={() => ki.verwerfen('pruefeAussagen')}
                    onVerwerfen={() => ki.verwerfen('pruefeAussagen')}
                  />
                </div>
              )}
            </>
          )}

          {typ === 'berechnung' && (
            <>
              <BerechnungEditor
                ergebnisse={ergebnisse}
                setErgebnisse={setErgebnisse}
                rechenwegErforderlich={rechenwegErforderlich}
                setRechenwegErforderlich={setRechenwegErforderlich}
                hilfsmittel={hilfsmittel}
                setHilfsmittel={setHilfsmittel}
                titelRechts={ki.verfuegbar ? (
                  <div className="flex gap-1.5">
                    <InlineAktionButton
                      label="Generieren"
                      tooltip="KI berechnet die korrekten Ergebnisse aus dem Aufgabentext"
                      hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                      disabled={!fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'berechneErgebnis'}
                      onClick={() => ki.ausfuehren('berechneErgebnis', { fragetext })}
                    />
                    <InlineAktionButton
                      label="Prüfen & Verbessern"
                      tooltip="KI prüft ob die Toleranzbereiche sinnvoll gewählt sind"
                      hinweis={!(ergebnisse.filter((e) => e.label.trim()).length >= 1) ? 'Mind. 1 Ergebnis nötig' : undefined}
                      disabled={!(ergebnisse.filter((e) => e.label.trim()).length >= 1) || !fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'pruefeToleranz'}
                      onClick={() => ki.ausfuehren('pruefeToleranz', { fragetext, ergebnisse })}
                    />
                  </div>
                ) : undefined}
              />
              {ki.ergebnisse.berechneErgebnis && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.berechneErgebnis}
                    vorschauKey="ergebnisse"
                    renderVorschau={(daten) => {
                      const erg = daten.ergebnisse as Array<{ label: string; korrekt: number; toleranz: number; einheit?: string }> | undefined
                      if (!Array.isArray(erg)) return null
                      return (
                        <div className="space-y-1">
                          {erg.map((e, i) => (
                            <div key={i} className="text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-medium">{e.label}:</span>{' '}
                              {e.korrekt} {e.einheit ?? ''}
                              {e.toleranz > 0 && <span className="text-slate-400"> (+/-{e.toleranz})</span>}
                            </div>
                          ))}
                        </div>
                      )
                    }}
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.berechneErgebnis?.daten
                      if (d && Array.isArray(d.ergebnisse)) {
                        const neue = (d.ergebnisse as Array<{ label: string; korrekt: number; toleranz: number; einheit?: string }>).map((e, i) => ({
                          id: String(i + 1), label: e.label, korrekt: e.korrekt, toleranz: e.toleranz, einheit: e.einheit,
                        }))
                        setErgebnisse(neue)
                      }
                      ki.verwerfen('berechneErgebnis')
                    }}
                    onVerwerfen={() => ki.verwerfen('berechneErgebnis')}
                  />
                </div>
              )}
              {ki.ergebnisse.pruefeToleranz && (
                <div className="-mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.pruefeToleranz}
                    vorschauKey="bewertung"
                    zusatzKey="empfohleneToleranz"
                    onUebernehmen={() => ki.verwerfen('pruefeToleranz')}
                    onVerwerfen={() => ki.verwerfen('pruefeToleranz')}
                  />
                </div>
              )}
            </>
          )}

          {/* Musterlösung */}
          <Abschnitt
            titel="Musterlösung"
            titelRechts={ki.verfuegbar ? (
              <div className="flex gap-1.5">
                <InlineAktionButton
                  label="Generieren"
                  tooltip="KI erstellt eine Musterlösung basierend auf dem Fragetext"
                  hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                  disabled={!fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'generiereMusterloesung'}
                  onClick={() => ki.ausfuehren('generiereMusterloesung', { fragetext, typ, fachbereich, bloom })}
                />
                <InlineAktionButton
                  label="Prüfen & Verbessern"
                  tooltip="KI prüft die Musterlösung auf Korrektheit und Vollständigkeit"
                  hinweis={!fragetext.trim() || !musterlosung.trim() ? 'Fragetext + Musterlösung nötig' : undefined}
                  disabled={!fragetext.trim() || !musterlosung.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'pruefeMusterloesung'}
                  onClick={() => ki.ausfuehren('pruefeMusterloesung', { fragetext, musterlosung })}
                />
              </div>
            ) : undefined}
          >
            <FormattierungsToolbar textareaRef={musterloeRef} value={musterlosung} onChange={setMusterlosung} />
            <textarea
              ref={musterloeRef}
              value={musterlosung}
              onChange={(e) => setMusterlosung(e.target.value)}
              rows={3}
              placeholder="Erwartete korrekte Antwort..."
              className="input-field resize-y"
            />
            {ki.ergebnisse.generiereMusterloesung && (
              <div className="mt-2">
                <ErgebnisAnzeige
                  ergebnis={ki.ergebnisse.generiereMusterloesung}
                  vorschauKey="musterlosung"
                  onUebernehmen={() => {
                    const d = ki.ergebnisse.generiereMusterloesung?.daten
                    if (d && typeof d.musterlosung === 'string') setMusterlosung(d.musterlosung)
                    ki.verwerfen('generiereMusterloesung')
                  }}
                  onVerwerfen={() => ki.verwerfen('generiereMusterloesung')}
                />
              </div>
            )}
            {ki.ergebnisse.pruefeMusterloesung && (
              <div className="mt-2">
                <ErgebnisAnzeige
                  ergebnis={ki.ergebnisse.pruefeMusterloesung}
                  vorschauKey="bewertung"
                  zusatzKey="verbesserteLosung"
                  onUebernehmen={() => {
                    const d = ki.ergebnisse.pruefeMusterloesung?.daten
                    if (d && typeof d.verbesserteLosung === 'string') setMusterlosung(d.verbesserteLosung)
                    ki.verwerfen('pruefeMusterloesung')
                  }}
                  onVerwerfen={() => ki.verwerfen('pruefeMusterloesung')}
                />
              </div>
            )}
          </Abschnitt>

          {/* Bewertungsraster */}
          <BewertungsrasterEditor
            bewertungsraster={bewertungsraster}
            setBewertungsraster={setBewertungsraster}
            kiButtons={ki.verfuegbar ? (
              <>
                <InlineAktionButton
                  label="KI generieren"
                  tooltip="Bewertungsraster basierend auf Frage generieren"
                  disabled={!fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'bewertungsrasterGenerieren'}
                  onClick={() => ki.ausfuehren('bewertungsrasterGenerieren', {
                    fragetext, typ, fachbereich, bloom, punkte, musterlosung
                  })}
                />
                <InlineAktionButton
                  label="KI verbessern"
                  tooltip="Bestehendes Bewertungsraster prüfen und verbessern"
                  disabled={bewertungsraster.filter(k => k.beschreibung.trim()).length === 0 || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'bewertungsrasterVerbessern'}
                  onClick={() => ki.ausfuehren('bewertungsrasterVerbessern', {
                    fragetext, typ, fachbereich, bloom, punkte, musterlosung,
                    bewertungsraster: bewertungsraster.filter(k => k.beschreibung.trim())
                  })}
                />
              </>
            ) : undefined}
          />
          {ki.ergebnisse.bewertungsrasterGenerieren && (
            <div className="mt-2">
              <ErgebnisAnzeige
                ergebnis={ki.ergebnisse.bewertungsrasterGenerieren}
                vorschauKey="kriterien"
                onUebernehmen={() => {
                  const d = ki.ergebnisse.bewertungsrasterGenerieren?.daten
                  if (d && Array.isArray(d.kriterien)) {
                    setBewertungsraster(d.kriterien as Bewertungskriterium[])
                  }
                  ki.verwerfen('bewertungsrasterGenerieren')
                }}
                onVerwerfen={() => ki.verwerfen('bewertungsrasterGenerieren')}
              />
            </div>
          )}
          {ki.ergebnisse.bewertungsrasterVerbessern && (
            <div className="mt-2">
              <ErgebnisAnzeige
                ergebnis={ki.ergebnisse.bewertungsrasterVerbessern}
                vorschauKey="bewertung"
                zusatzKey="verbesserteKriterien"
                onUebernehmen={() => {
                  const d = ki.ergebnisse.bewertungsrasterVerbessern?.daten
                  if (d && Array.isArray(d.verbesserteKriterien)) {
                    setBewertungsraster(d.verbesserteKriterien as Bewertungskriterium[])
                  }
                  ki.verwerfen('bewertungsrasterVerbessern')
                }}
                onVerwerfen={() => ki.verwerfen('bewertungsrasterVerbessern')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
