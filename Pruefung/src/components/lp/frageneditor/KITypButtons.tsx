/**
 * Typ-spezifische KI-Buttons für Zuordnung, R/F, Lückentext, Berechnung.
 */
import type { useKIAssistent } from './useKIAssistent.ts'
import type { RichtigFalschFrage, BerechnungFrage } from '../../../types/fragen.ts'
import { InlineAktionButton, ErgebnisAnzeige } from './KIBausteine.tsx'

// === Zuordnung ===

interface KIZuordnungButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  fachbereich: string
  thema: string
  paare: { links: string; rechts: string }[]
  onSetPaare: (paare: { links: string; rechts: string }[]) => void
}

export function KIZuordnungButtons({ ki, fragetext, fachbereich, thema, paare, onSetPaare }: KIZuordnungButtonsProps) {
  if (!ki.verfuegbar) return null

  const hatPaare = paare.filter((p) => p.links.trim() && p.rechts.trim()).length >= 2

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
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
          hinweis={!hatPaare ? 'Mind. 2 Paare nötig' : undefined}
          disabled={!hatPaare || !fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'pruefePaare'}
          onClick={() => ki.ausfuehren('pruefePaare', { fragetext, paare })}
        />
      </div>

      {ki.ergebnisse.generierePaare && (
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
                    <span className="text-slate-400">→</span>
                    <span>{paar.rechts}</span>
                  </div>
                ))}
              </div>
            )
          }}
          onUebernehmen={() => {
            const d = ki.ergebnisse.generierePaare?.daten
            if (d && Array.isArray(d.paare)) {
              onSetPaare(d.paare as { links: string; rechts: string }[])
            }
            ki.verwerfen('generierePaare')
          }}
          onVerwerfen={() => ki.verwerfen('generierePaare')}
        />
      )}

      {ki.ergebnisse.pruefePaare && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.pruefePaare}
          vorschauKey="bewertung"
          zusatzKey="verbesserungen"
          onUebernehmen={() => ki.verwerfen('pruefePaare')}
          onVerwerfen={() => ki.verwerfen('pruefePaare')}
        />
      )}
    </div>
  )
}

// === Richtig/Falsch ===

interface KIRichtigFalschButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  fachbereich: string
  thema: string
  aussagen: RichtigFalschFrage['aussagen']
  onSetAussagen: (aussagen: RichtigFalschFrage['aussagen']) => void
}

export function KIRichtigFalschButtons({ ki, fragetext, fachbereich, thema, aussagen, onSetAussagen }: KIRichtigFalschButtonsProps) {
  if (!ki.verfuegbar) return null

  const hatAussagen = aussagen.filter((a) => a.text.trim()).length >= 2

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
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
          hinweis={!hatAussagen ? 'Mind. 2 Aussagen nötig' : undefined}
          disabled={!hatAussagen || !fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'pruefeAussagen'}
          onClick={() => ki.ausfuehren('pruefeAussagen', { fragetext, aussagen })}
        />
      </div>

      {ki.ergebnisse.generiereAussagen && (
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
                    {aus.korrekt ? '✓ ' : '✗ '}{aus.text}
                    {aus.erklaerung && (
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">{aus.erklaerung}</span>
                    )}
                  </li>
                ))}
              </ul>
            )
          }}
          onUebernehmen={() => {
            const d = ki.ergebnisse.generiereAussagen?.daten
            if (d && Array.isArray(d.aussagen)) {
              const neue = (d.aussagen as Array<{ text: string; korrekt: boolean; erklaerung?: string }>).map((a, i) => ({
                id: String(i + 1),
                text: a.text,
                korrekt: a.korrekt,
                erklaerung: a.erklaerung,
              }))
              onSetAussagen(neue)
            }
            ki.verwerfen('generiereAussagen')
          }}
          onVerwerfen={() => ki.verwerfen('generiereAussagen')}
        />
      )}

      {ki.ergebnisse.pruefeAussagen && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.pruefeAussagen}
          vorschauKey="bewertung"
          zusatzKey="verbesserungen"
          onUebernehmen={() => ki.verwerfen('pruefeAussagen')}
          onVerwerfen={() => ki.verwerfen('pruefeAussagen')}
        />
      )}
    </div>
  )
}

// === Lückentext ===

interface KILueckentextButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  textMitLuecken: string
  luecken: { id: string; korrekteAntworten: string[]; caseSensitive: boolean }[]
  onSetTextMitLuecken: (text: string) => void
  onSetLuecken: (luecken: { id: string; korrekteAntworten: string[]; caseSensitive: boolean }[]) => void
}

export function KILueckentextButtons({ ki, fragetext, textMitLuecken, luecken, onSetTextMitLuecken, onSetLuecken }: KILueckentextButtonsProps) {
  if (!ki.verfuegbar) return null

  const hatLuecken = textMitLuecken.includes('{{') && luecken.length > 0

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
        <InlineAktionButton
          label="Generieren"
          tooltip="KI markiert sinnvolle Lückenstellen im Text und schlägt Antworten vor"
          hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'generiereLuecken'}
          onClick={() => ki.ausfuehren('generiereLuecken', { fragetext, textMitLuecken: textMitLuecken || fragetext })}
        />
        <InlineAktionButton
          label="Prüfen & Verbessern"
          tooltip="KI prüft ob alle akzeptierten Antwort-Varianten vollständig sind"
          hinweis={!hatLuecken ? 'Lückentext mit {{}} nötig' : undefined}
          disabled={!hatLuecken || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'pruefeLueckenAntworten'}
          onClick={() => ki.ausfuehren('pruefeLueckenAntworten', { textMitLuecken, luecken })}
        />
      </div>

      {ki.ergebnisse.generiereLuecken && (
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
              if (typeof d.textMitLuecken === 'string') onSetTextMitLuecken(d.textMitLuecken)
              if (Array.isArray(d.luecken)) {
                onSetLuecken((d.luecken as Array<{ id: string; korrekteAntworten: string[] }>).map((l) => ({
                  id: l.id,
                  korrekteAntworten: l.korrekteAntworten,
                  caseSensitive: false,
                })))
              }
            }
            ki.verwerfen('generiereLuecken')
          }}
          onVerwerfen={() => ki.verwerfen('generiereLuecken')}
        />
      )}

      {ki.ergebnisse.pruefeLueckenAntworten && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.pruefeLueckenAntworten}
          vorschauKey="bewertung"
          renderVorschau={(daten) => {
            const bewertung = daten.bewertung as string | undefined
            const ergaenzt = daten.ergaenzteAntworten as Array<{ id: string; korrekteAntworten: string[] }> | undefined
            return (
              <div className="space-y-2">
                {bewertung && (
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{bewertung}</p>
                )}
                {Array.isArray(ergaenzt) && ergaenzt.length > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <p className="font-medium mb-1">Ergänzte Antwort-Varianten:</p>
                    {ergaenzt.map((l, i) => (
                      <span key={i} className="inline-block mr-3">
                        {`{{${l.id}}}`}: {l.korrekteAntworten.join(' / ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          }}
          onUebernehmen={() => {
            const d = ki.ergebnisse.pruefeLueckenAntworten?.daten
            if (d && Array.isArray(d.ergaenzteAntworten)) {
              onSetLuecken((d.ergaenzteAntworten as Array<{ id: string; korrekteAntworten: string[] }>).map((l) => ({
                id: l.id,
                korrekteAntworten: l.korrekteAntworten,
                caseSensitive: false,
              })))
            }
            ki.verwerfen('pruefeLueckenAntworten')
          }}
          onVerwerfen={() => ki.verwerfen('pruefeLueckenAntworten')}
        />
      )}
    </div>
  )
}

// === Berechnung ===

interface KIBerechnungButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  ergebnisse: BerechnungFrage['ergebnisse']
  onSetErgebnisse: (ergebnisse: BerechnungFrage['ergebnisse']) => void
}

export function KIBerechnungButtons({ ki, fragetext, ergebnisse, onSetErgebnisse }: KIBerechnungButtonsProps) {
  if (!ki.verfuegbar) return null

  const hatErgebnisse = ergebnisse.filter((e) => e.label.trim()).length >= 1

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
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
          hinweis={!hatErgebnisse ? 'Mind. 1 Ergebnis nötig' : undefined}
          disabled={!hatErgebnisse || !fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'pruefeToleranz'}
          onClick={() => ki.ausfuehren('pruefeToleranz', { fragetext, ergebnisse })}
        />
      </div>

      {ki.ergebnisse.berechneErgebnis && (
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
                    {e.toleranz > 0 && <span className="text-slate-400"> (±{e.toleranz})</span>}
                  </div>
                ))}
              </div>
            )
          }}
          onUebernehmen={() => {
            const d = ki.ergebnisse.berechneErgebnis?.daten
            if (d && Array.isArray(d.ergebnisse)) {
              const neue = (d.ergebnisse as Array<{ label: string; korrekt: number; toleranz: number; einheit?: string }>).map((e, i) => ({
                id: String(i + 1),
                label: e.label,
                korrekt: e.korrekt,
                toleranz: e.toleranz,
                einheit: e.einheit,
              }))
              onSetErgebnisse(neue)
            }
            ki.verwerfen('berechneErgebnis')
          }}
          onVerwerfen={() => ki.verwerfen('berechneErgebnis')}
        />
      )}

      {ki.ergebnisse.pruefeToleranz && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.pruefeToleranz}
          vorschauKey="bewertung"
          zusatzKey="empfohleneToleranz"
          onUebernehmen={() => ki.verwerfen('pruefeToleranz')}
          onVerwerfen={() => ki.verwerfen('pruefeToleranz')}
        />
      )}
    </div>
  )
}
