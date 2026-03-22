/**
 * Typ-spezifische Editor-Abschnitte für alle 11 Fragetypen.
 * Extrahiert aus FragenEditor.tsx.
 */
import type {
  MCOption, RichtigFalschFrage, BerechnungFrage,
  SollHabenZeile, KontenauswahlConfig,
  TKontoDefinition,
  KontenbestimmungFrage, Kontenaufgabe,
  BilanzERFrage, KontoMitSaldo, BilanzERLoesung,
} from '../../../../types/fragen.ts'
import type { FrageTyp } from '../editorUtils.ts'
import type { useKIAssistent } from '../useKIAssistent.ts'
import MCEditor from '../MCEditor.tsx'
import LueckentextEditor from '../LueckentextEditor.tsx'
import ZuordnungEditor from '../ZuordnungEditor.tsx'
import RichtigFalschEditor from '../RichtigFalschEditor.tsx'
import BerechnungEditor from '../BerechnungEditor.tsx'
import BuchungssatzEditor from '../BuchungssatzEditor.tsx'
import TKontoEditor from '../TKontoEditor.tsx'
import KontenbestimmungEditor from '../KontenbestimmungEditor.tsx'
import BilanzEREditor from '../BilanzEREditor.tsx'
import AufgabengruppeEditor from '../AufgabengruppeEditor.tsx'
import { KIBuchungssatzButtons, KITKontoButtons, KIKontenbestimmungButtons, KIBilanzERButtons } from '../KIFiBuButtons.tsx'
import { InlineAktionButton, ErgebnisAnzeige } from '../KIBausteine.tsx'

interface TypEditorDispatcherProps {
  typ: FrageTyp
  fragetext: string
  fachbereich: string
  thema: string
  ki: ReturnType<typeof useKIAssistent>

  // MC
  optionen: MCOption[]
  setOptionen: React.Dispatch<React.SetStateAction<MCOption[]>>
  mehrfachauswahl: boolean
  setMehrfachauswahl: (v: boolean) => void

  // Lückentext
  textMitLuecken: string
  setTextMitLuecken: (v: string) => void
  luecken: { id: string; korrekteAntworten: string[]; caseSensitive: boolean }[]
  setLuecken: React.Dispatch<React.SetStateAction<{ id: string; korrekteAntworten: string[]; caseSensitive: boolean }[]>>

  // Zuordnung
  paare: { links: string; rechts: string }[]
  setPaare: React.Dispatch<React.SetStateAction<{ links: string; rechts: string }[]>>

  // Richtig/Falsch
  aussagen: RichtigFalschFrage['aussagen']
  setAussagen: React.Dispatch<React.SetStateAction<RichtigFalschFrage['aussagen']>>

  // Berechnung
  ergebnisse: BerechnungFrage['ergebnisse']
  setErgebnisse: React.Dispatch<React.SetStateAction<BerechnungFrage['ergebnisse']>>
  rechenwegErforderlich: boolean
  setRechenwegErforderlich: (v: boolean) => void
  hilfsmittel: string
  setHilfsmittel: (v: string) => void

  // Buchungssatz
  geschaeftsfall: string
  setGeschaeftsfall: (v: string) => void
  buchungen: SollHabenZeile[]
  setBuchungen: React.Dispatch<React.SetStateAction<SollHabenZeile[]>>
  kontenauswahl: KontenauswahlConfig
  setKontenauswahl: React.Dispatch<React.SetStateAction<KontenauswahlConfig>>

  // T-Konto
  tkAufgabentext: string
  setTkAufgabentext: (v: string) => void
  tkGeschaeftsfaelle: string[]
  setTkGeschaeftsfaelle: React.Dispatch<React.SetStateAction<string[]>>
  tkKonten: TKontoDefinition[]
  setTkKonten: React.Dispatch<React.SetStateAction<TKontoDefinition[]>>

  // Kontenbestimmung
  kbAufgabentext: string
  setKbAufgabentext: (v: string) => void
  kbModus: KontenbestimmungFrage['modus']
  setKbModus: React.Dispatch<React.SetStateAction<KontenbestimmungFrage['modus']>>
  kbAufgaben: Kontenaufgabe[]
  setKbAufgaben: React.Dispatch<React.SetStateAction<Kontenaufgabe[]>>
  kbKontenauswahl: KontenauswahlConfig
  setKbKontenauswahl: React.Dispatch<React.SetStateAction<KontenauswahlConfig>>

  // Bilanz/ER
  biAufgabentext: string
  setBiAufgabentext: (v: string) => void
  biModus: BilanzERFrage['modus']
  setBiModus: React.Dispatch<React.SetStateAction<BilanzERFrage['modus']>>
  biKontenMitSaldi: KontoMitSaldo[]
  setBiKontenMitSaldi: React.Dispatch<React.SetStateAction<KontoMitSaldo[]>>
  biLoesung: BilanzERLoesung
  setBiLoesung: React.Dispatch<React.SetStateAction<BilanzERLoesung>>

  // Aufgabengruppe
  agKontext: string
  setAgKontext: (v: string) => void
  agTeilaufgabenIds: string[]
  setAgTeilaufgabenIds: React.Dispatch<React.SetStateAction<string[]>>
}

export default function TypEditorDispatcher(props: TypEditorDispatcherProps) {
  const { typ, fragetext, fachbereich, thema, ki } = props

  return (
    <>
      {typ === 'mc' && (
        <>
          <MCEditor
            optionen={props.optionen}
            setOptionen={props.setOptionen}
            mehrfachauswahl={props.mehrfachauswahl}
            setMehrfachauswahl={props.setMehrfachauswahl}
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
                    const merged = neueOptionen.length >= props.optionen.length
                      ? neueOptionen
                      : [...neueOptionen, ...props.optionen.slice(neueOptionen.length)]
                    props.setOptionen(merged)
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
            textMitLuecken={props.textMitLuecken}
            setTextMitLuecken={props.setTextMitLuecken}
            luecken={props.luecken}
            setLuecken={props.setLuecken}
            titelRechts={ki.verfuegbar ? (
              <div className="flex gap-1.5">
                <InlineAktionButton
                  label="Generieren"
                  tooltip="KI markiert sinnvolle Lückenstellen im Text"
                  hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
                  disabled={!fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'generiereLuecken'}
                  onClick={() => ki.ausfuehren('generiereLuecken', { fragetext, textMitLuecken: props.textMitLuecken || fragetext })}
                />
                <InlineAktionButton
                  label="Prüfen & Verbessern"
                  tooltip="KI prüft ob alle akzeptierten Antwort-Varianten vollständig sind"
                  hinweis={!(props.textMitLuecken.includes('{{') && props.luecken.length > 0) ? 'Lückentext mit {{}} nötig' : undefined}
                  disabled={!(props.textMitLuecken.includes('{{') && props.luecken.length > 0) || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'pruefeLueckenAntworten'}
                  onClick={() => ki.ausfuehren('pruefeLueckenAntworten', { textMitLuecken: props.textMitLuecken, luecken: props.luecken })}
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
                    if (typeof d.textMitLuecken === 'string') props.setTextMitLuecken(d.textMitLuecken)
                    if (Array.isArray(d.luecken)) {
                      props.setLuecken((d.luecken as Array<{ id: string; korrekteAntworten: string[] }>).map((l) => ({
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
                    props.setLuecken((d.ergaenzteAntworten as Array<{ id: string; korrekteAntworten: string[] }>).map((l) => ({
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
            paare={props.paare}
            setPaare={props.setPaare}
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
                  hinweis={!(props.paare.filter((p) => p.links.trim() && p.rechts.trim()).length >= 2) ? 'Mind. 2 Paare nötig' : undefined}
                  disabled={!(props.paare.filter((p) => p.links.trim() && p.rechts.trim()).length >= 2) || !fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'pruefePaare'}
                  onClick={() => ki.ausfuehren('pruefePaare', { fragetext, paare: props.paare })}
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
                    props.setPaare(d.paare as { links: string; rechts: string }[])
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
            aussagen={props.aussagen}
            setAussagen={props.setAussagen}
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
                  hinweis={!(props.aussagen.filter((a) => a.text.trim()).length >= 2) ? 'Mind. 2 Aussagen nötig' : undefined}
                  disabled={!(props.aussagen.filter((a) => a.text.trim()).length >= 2) || !fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'pruefeAussagen'}
                  onClick={() => ki.ausfuehren('pruefeAussagen', { fragetext, aussagen: props.aussagen })}
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
                    props.setAussagen(neue)
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
            ergebnisse={props.ergebnisse}
            setErgebnisse={props.setErgebnisse}
            rechenwegErforderlich={props.rechenwegErforderlich}
            setRechenwegErforderlich={props.setRechenwegErforderlich}
            hilfsmittel={props.hilfsmittel}
            setHilfsmittel={props.setHilfsmittel}
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
                  hinweis={!(props.ergebnisse.filter((e) => e.label.trim()).length >= 1) ? 'Mind. 1 Ergebnis nötig' : undefined}
                  disabled={!(props.ergebnisse.filter((e) => e.label.trim()).length >= 1) || !fragetext.trim() || ki.ladeAktion !== null}
                  ladend={ki.ladeAktion === 'pruefeToleranz'}
                  onClick={() => ki.ausfuehren('pruefeToleranz', { fragetext, ergebnisse: props.ergebnisse })}
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
                    props.setErgebnisse(neue)
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

      {typ === 'buchungssatz' && (
        <BuchungssatzEditor
          geschaeftsfall={props.geschaeftsfall}
          setGeschaeftsfall={props.setGeschaeftsfall}
          buchungen={props.buchungen}
          setBuchungen={props.setBuchungen}
          kontenauswahl={props.kontenauswahl}
          setKontenauswahl={props.setKontenauswahl}
          titelRechts={<KIBuchungssatzButtons ki={ki} geschaeftsfall={props.geschaeftsfall} />}
          kontenauswahlTitelRechts={ki.verfuegbar && props.geschaeftsfall.trim() ? (
            <InlineAktionButton
              label="Konten vorschlagen"
              tooltip="KI schlägt passende Konten für den Geschäftsfall vor"
              disabled={ki.ladeAktion !== null}
              ladend={ki.ladeAktion === 'generiereKontenauswahl'}
              onClick={() => ki.ausfuehren('generiereKontenauswahl', { geschaeftsfall: props.geschaeftsfall })}
            />
          ) : undefined}
        />
      )}

      {typ === 'tkonto' && (
        <TKontoEditor
          aufgabentext={props.tkAufgabentext}
          setAufgabentext={props.setTkAufgabentext}
          geschaeftsfaelle={props.tkGeschaeftsfaelle}
          setGeschaeftsfaelle={props.setTkGeschaeftsfaelle}
          konten={props.tkKonten}
          setKonten={props.setTkKonten}
          kontenauswahl={props.kontenauswahl}
          setKontenauswahl={props.setKontenauswahl}
          titelRechts={<KITKontoButtons ki={ki} aufgabentext={props.tkAufgabentext} />}
        />
      )}

      {typ === 'kontenbestimmung' && (
        <KontenbestimmungEditor
          aufgabentext={props.kbAufgabentext}
          setAufgabentext={props.setKbAufgabentext}
          modus={props.kbModus}
          setModus={props.setKbModus}
          aufgaben={props.kbAufgaben}
          setAufgaben={props.setKbAufgaben}
          kontenauswahl={props.kbKontenauswahl}
          setKontenauswahl={props.setKbKontenauswahl}
          titelRechts={<KIKontenbestimmungButtons ki={ki} aufgabentext={props.kbAufgabentext} />}
        />
      )}

      {typ === 'bilanzstruktur' && (
        <BilanzEREditor
          aufgabentext={props.biAufgabentext}
          setAufgabentext={props.setBiAufgabentext}
          modus={props.biModus}
          setModus={props.setBiModus}
          kontenMitSaldi={props.biKontenMitSaldi}
          setKontenMitSaldi={props.setBiKontenMitSaldi}
          loesung={props.biLoesung}
          setLoesung={props.setBiLoesung}
          titelRechts={<KIBilanzERButtons ki={ki} aufgabentext={props.biAufgabentext} modus={props.biModus} />}
        />
      )}

      {typ === 'aufgabengruppe' && (
        <AufgabengruppeEditor
          kontext={props.agKontext}
          setKontext={props.setAgKontext}
          teilaufgabenIds={props.agTeilaufgabenIds}
          setTeilaufgabenIds={props.setAgTeilaufgabenIds}
        />
      )}
    </>
  )
}
