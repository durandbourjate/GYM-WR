import { useState, useRef } from 'react'
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
import FreitextEditor from './FreitextEditor.tsx'
import LueckentextEditor from './LueckentextEditor.tsx'
import ZuordnungEditor from './ZuordnungEditor.tsx'
import RichtigFalschEditor from './RichtigFalschEditor.tsx'
import BerechnungEditor from './BerechnungEditor.tsx'
import AnhangEditor from './AnhangEditor.tsx'
import { useKIAssistent, KIFragetextButtons, KIMusterlosungButtons, KIMCOptionenButton } from './KIAssistentPanel.tsx'
import { KIZuordnungButtons, KIRichtigFalschButtons, KILueckentextButtons, KIBerechnungButtons } from './KITypButtons.tsx'
import { berechneZeitbedarf } from '../../../utils/zeitbedarf.ts'

interface Props {
  /** Bestehende Frage zum Bearbeiten, oder null für neue */
  frage: Frage | null
  onSpeichern: (frage: Frage) => void
  onAbbrechen: () => void
}

/** Vollbild-Editor zum Erstellen und Bearbeiten von Prüfungsfragen */
export default function FragenEditor({ frage, onSpeichern, onAbbrechen }: Props) {
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

  // Freitext-spezifisch
  const [laenge, setLaenge] = useState<'kurz' | 'mittel' | 'lang'>(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).laenge : 'mittel'
  )
  const [placeholder, setPlaceholder] = useState(
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

  // Anhänge
  const [anhaenge, setAnhaenge] = useState<FrageAnhang[]>(frage?.anhaenge ?? [])
  const [neueAnhaenge, setNeueAnhaenge] = useState<File[]>([])

  // Validierung
  const [fehler, setFehler] = useState<string[]>([])

  // KI-Assistent
  const ki = useKIAssistent()

  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef)

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

  function handleSpeichern(): void {
    const errs = validiere()
    if (errs.length > 0) {
      setFehler(errs)
      return
    }
    setFehler([])

    const jetzt = new Date().toISOString()
    const tagListe = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const id = frage?.id ?? generiereFrageId(fachbereich, typ)

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
      anhaenge: anhaenge.length > 0 ? anhaenge : undefined,
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

    onSpeichern(neueFrage)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onAbbrechen} />

      <div ref={panelRef} className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {frage ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onAbbrechen}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSpeichern}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Speichern
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

          {/* Fragetyp wählen */}
          <Abschnitt titel="Fragetyp">
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
          <Abschnitt titel="Zuordnung">
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
              <Feld label="Unterthema">
                <input type="text" value={unterthema} onChange={(e) => setUnterthema(e.target.value)}
                  placeholder="z.B. Angebot & Nachfrage" className="input-field" />
              </Feld>
              <Feld label="Punkte *">
                <input type="number" value={punkte} onChange={(e) => setPunkte(parseInt(e.target.value) || 0)}
                  min={1} max={20} className="input-field" />
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
                  {(['SF', 'EF', 'EWR'] as Gefaess[]).map((g) => (
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
            </div>
          </Abschnitt>

          {/* Fragetext */}
          <Abschnitt titel="Fragetext *">
            <textarea
              value={fragetext}
              onChange={(e) => setFragetext(e.target.value)}
              rows={4}
              placeholder="Formulieren Sie die Frage... (Markdown: **fett**, *kursiv*)"
              className="input-field resize-y"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Tipp: **fett** für Hervorhebungen, \n für Absätze
            </p>
            <KIFragetextButtons
              ki={ki}
              typ={typ}
              fachbereich={fachbereich}
              thema={thema}
              unterthema={unterthema}
              bloom={bloom}
              fragetext={fragetext}
              onSetFragetext={setFragetext}
              onSetMusterlosung={setMusterlosung}
            />
          </Abschnitt>

          {/* Anhänge (Bilder, PDFs) */}
          <AnhangEditor
            anhaenge={anhaenge}
            neueAnhaenge={neueAnhaenge}
            onAnhangHinzu={(file) => setNeueAnhaenge((prev) => [...prev, file])}
            onAnhangEntfernen={(id) => setAnhaenge((prev) => prev.filter((a) => a.id !== id))}
            onNeuenAnhangEntfernen={(idx) => setNeueAnhaenge((prev) => prev.filter((_, i) => i !== idx))}
          />

          {/* Typ-spezifische Felder */}
          {typ === 'mc' && (
            <>
              <MCEditor
                optionen={optionen}
                setOptionen={setOptionen}
                mehrfachauswahl={mehrfachauswahl}
                setMehrfachauswahl={setMehrfachauswahl}
              />
              <KIMCOptionenButton
                ki={ki}
                fragetext={fragetext}
                optionen={optionen}
                onSetOptionen={setOptionen}
              />
            </>
          )}

          {typ === 'freitext' && (
            <FreitextEditor
              laenge={laenge}
              setLaenge={setLaenge}
              placeholder={placeholder}
              setPlaceholder={setPlaceholder}
            />
          )}

          {typ === 'lueckentext' && (
            <>
              <LueckentextEditor
                textMitLuecken={textMitLuecken}
                setTextMitLuecken={setTextMitLuecken}
                luecken={luecken}
                setLuecken={setLuecken}
              />
              <KILueckentextButtons
                ki={ki}
                fragetext={fragetext}
                textMitLuecken={textMitLuecken}
                luecken={luecken}
                onSetTextMitLuecken={setTextMitLuecken}
                onSetLuecken={setLuecken}
              />
            </>
          )}

          {typ === 'zuordnung' && (
            <>
              <ZuordnungEditor paare={paare} setPaare={setPaare} />
              <KIZuordnungButtons
                ki={ki}
                fragetext={fragetext}
                fachbereich={fachbereich}
                thema={thema}
                paare={paare}
                onSetPaare={setPaare}
              />
            </>
          )}

          {typ === 'richtigfalsch' && (
            <>
              <RichtigFalschEditor aussagen={aussagen} setAussagen={setAussagen} />
              <KIRichtigFalschButtons
                ki={ki}
                fragetext={fragetext}
                fachbereich={fachbereich}
                thema={thema}
                aussagen={aussagen}
                onSetAussagen={setAussagen}
              />
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
              />
              <KIBerechnungButtons
                ki={ki}
                fragetext={fragetext}
                ergebnisse={ergebnisse}
                onSetErgebnisse={setErgebnisse}
              />
            </>
          )}

          {/* Musterlösung */}
          <Abschnitt titel="Musterlösung">
            <textarea
              value={musterlosung}
              onChange={(e) => setMusterlosung(e.target.value)}
              rows={3}
              placeholder="Erwartete korrekte Antwort..."
              className="input-field resize-y"
            />
            <KIMusterlosungButtons
              ki={ki}
              fragetext={fragetext}
              musterlosung={musterlosung}
              typ={typ}
              fachbereich={fachbereich}
              bloom={bloom}
              onSetMusterlosung={setMusterlosung}
            />
          </Abschnitt>

          {/* Bewertungsraster */}
          <Abschnitt titel="Bewertungsraster">
            <div className="space-y-2">
              {/* Spalten-Header */}
              {bewertungsraster.length > 0 && (
                <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex-1">Kriterium</span>
                  <span className="w-14 text-center">Pkt.</span>
                  <span className="w-7" />
                </div>
              )}
              {bewertungsraster.map((kriterium, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={kriterium.beschreibung}
                    onChange={(e) => {
                      const neu = [...bewertungsraster]
                      neu[i] = { ...neu[i], beschreibung: e.target.value }
                      setBewertungsraster(neu)
                    }}
                    placeholder="Kriterium..."
                    className="input-field flex-1 min-w-0"
                  />
                  <input
                    type="number"
                    value={kriterium.punkte}
                    onChange={(e) => {
                      const neu = [...bewertungsraster]
                      neu[i] = { ...neu[i], punkte: parseFloat(e.target.value) || 0 }
                      setBewertungsraster(neu)
                    }}
                    min={0}
                    step={0.5}
                    className="px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 text-center shrink-0" style={{ width: "56px" }}
                    title="Punkte für dieses Kriterium"
                  />
                  <button
                    onClick={() => setBewertungsraster(bewertungsraster.filter((_, j) => j !== i))}
                    className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0 mt-1"
                  >×</button>
                </div>
              ))}
              <button
                onClick={() => setBewertungsraster([...bewertungsraster, { beschreibung: '', punkte: 1 }])}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                + Kriterium hinzufügen
              </button>
            </div>
          </Abschnitt>
        </div>
      </div>
    </div>
  )
}
