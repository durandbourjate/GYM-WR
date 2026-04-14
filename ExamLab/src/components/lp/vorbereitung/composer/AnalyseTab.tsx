import { useState, useMemo } from 'react'
import type { Frage } from '../../../../types/fragen.ts'
import type { PruefungsConfig } from '../../../../types/pruefung.ts'
import { berechnePruefungsAnalyse } from '../../../../utils/analyseUtils.ts'
import { useKIAssistent } from '../../frageneditor/useKIAssistent.ts'
import { useAuthStore } from '../../../../store/authStore.ts'
import type { AnalyseWarnung } from '../../../../utils/analyseUtils.ts'
import { Section } from './ComposerUI.tsx'
import { MiniCard } from './ComposerUI.tsx'

interface Props {
  pruefung: PruefungsConfig
  fragenMap: Record<string, Frage>
  fragenGeladen: boolean
}

export default function AnalyseTab({ pruefung, fragenMap, fragenGeladen }: Props) {
  const istDemoModus = useAuthStore((s) => s.istDemoModus)
  const ki = useKIAssistent()
  const [kiAnalyse, setKiAnalyse] = useState<Record<string, unknown> | null>(null)
  const [kiLadend, setKiLadend] = useState(false)
  const [kiFehler, setKiFehler] = useState<string | null>(null)

  const analyse = useMemo(
    () => berechnePruefungsAnalyse(pruefung, fragenMap),
    [pruefung, fragenMap],
  )

  if (!fragenGeladen) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-slate-500 dark:text-slate-400">Fragen werden geladen...</span>
      </div>
    )
  }

  if (analyse.gesamtFragen === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 dark:text-slate-400">
          Noch keine Fragen in der Prüfung. Fügen Sie Fragen hinzu, um die Analyse zu sehen.
        </p>
      </div>
    )
  }

  async function starteKIAnalyse(): Promise<void> {
    if (istDemoModus) {
      setKiLadend(true)
      await new Promise((r) => setTimeout(r, 1500))
      setKiAnalyse({
        themenAbdeckung: 'Die Prüfung deckt die Kernthemen des Semesters gut ab. Marktgleichgewicht und Vertragsrecht bilden den Schwerpunkt.',
        schwierigkeitsBalance: 'Gute Mischung aus Wissens- und Verständnisfragen. Für eine summative Prüfung könnten mehr Anwendungsaufgaben (K3/K4) den Transfer fördern.',
        verbesserungen: [
          'Eine Freitext-Frage auf K5/K6-Niveau (z.B. Fallanalyse) würde die höheren Taxonomiestufen besser abdecken.',
          'Die Bearbeitungszeit scheint angemessen für den Umfang der Prüfung.',
          'Erwägen Sie, die MC-Fragen mit Distraktoren zu ergänzen, die häufige Missverständnisse aufgreifen.',
        ],
        gesamtBewertung: 'Solide Prüfung mit ausgewogener Themenabdeckung. Kleine Anpassungen bei der Taxonomie-Verteilung könnten die diagnostische Qualität verbessern.',
      })
      setKiLadend(false)
      return
    }

    setKiLadend(true)
    setKiFehler(null)

    // Payload kompakt halten: nur relevante Felder
    const fragenIds = pruefung.abschnitte.flatMap((a) => a.fragenIds)
    const fragenKompakt = fragenIds
      .map((id) => fragenMap[id])
      .filter(Boolean)
      .map((f) => ({
        fragetext: 'fragetext' in f ? (f as { fragetext: string }).fragetext : '',
        typ: f.typ,
        bloom: f.bloom,
        thema: f.thema,
        punkte: f.punkte,
      }))

    try {
      await ki.ausfuehren('analysierePruefung', {
        titel: pruefung.titel,
        klasse: pruefung.klasse,
        fachbereiche: pruefung.fachbereiche,
        fragen: fragenKompakt,
      })

      const ergebnis = ki.ergebnisse.analysierePruefung
      if (ergebnis?.fehler) {
        setKiFehler(ergebnis.fehler)
      } else if (ergebnis?.daten) {
        setKiAnalyse(ergebnis.daten)
      }
    } catch {
      setKiFehler('KI-Analyse fehlgeschlagen')
    } finally {
      setKiLadend(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Übersicht */}
      <div className="grid grid-cols-4 gap-3">
        <MiniCard label="Fragen" wert={String(analyse.gesamtFragen)} />
        <MiniCard label="Punkte" wert={String(analyse.gesamtPunkte)} />
        <MiniCard label="Dauer" wert={`${analyse.dauerMinuten} Min.`} />
        <MiniCard label="Zeitbedarf" wert={`${analyse.zeitbedarfSumme} Min.`} />
      </div>

      {/* Warnungen */}
      {analyse.warnungen.length > 0 && (
        <div className="space-y-2">
          {analyse.warnungen.map((w, i) => (
            <WarnungBadge key={i} warnung={w} />
          ))}
        </div>
      )}

      {/* Farbcode-Legende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> OK</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Warnung</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Überschreitung</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> KI-Hinweis</span>
      </div>

      {/* Zeitbedarf — Gesamtbalken + pro Frage */}
      <Section titel="Zeitbedarf">
        <div className="space-y-4">
          {/* Gesamtbalken */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    analyse.zeitbedarfProzent <= 100
                      ? 'bg-green-500 dark:bg-green-400'
                      : analyse.zeitbedarfProzent <= 120
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-red-500 dark:bg-red-400'
                  }`}
                  style={{ width: `${Math.min(analyse.zeitbedarfProzent, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {analyse.zeitbedarfSumme}/{analyse.dauerMinuten} Min.
              </span>
            </div>
            <p className={`text-xs ${
              analyse.zeitbedarfProzent >= 80 && analyse.zeitbedarfProzent <= 100
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {analyse.zeitbedarfProzent >= 80 && analyse.zeitbedarfProzent <= 100
                ? 'Zeitbedarf passt zur Prüfungsdauer'
                : analyse.zeitbedarfProzent > 100
                  ? 'Zeitbedarf übersteigt die Prüfungsdauer'
                  : 'Zeitbedarf liegt unter der Prüfungsdauer — Puffer vorhanden'}
            </p>
          </div>
          {/* Gestapelter Balken — ein Balken, Segmente pro Frage */}
          <div className="space-y-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg h-8 overflow-hidden flex">
              {analyse.zeitbedarfDetails.map((z, i) => {
                const anteil = analyse.zeitbedarfSumme > 0 ? (z.minuten / analyse.zeitbedarfSumme) * 100 : 0
                if (anteil < 0.5) return null
                // Abwechselnde Farben für Lesbarkeit
                const farben = ['bg-slate-500', 'bg-slate-400', 'bg-slate-600', 'bg-slate-350']
                const farbKlasse = farben[i % farben.length]
                return (
                  <div
                    key={z.frageId}
                    className={`h-full ${farbKlasse} flex items-center justify-center relative group`}
                    style={{ width: `${anteil}%`, minWidth: anteil > 3 ? undefined : '8px' }}
                    title={`${z.frageNummer}. ${z.label}: ${z.minuten} Min.`}
                  >
                    {anteil > 5 && (
                      <span className="text-[9px] font-medium text-white truncate px-0.5">{z.frageNummer}</span>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Legende unter dem Balken */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {analyse.zeitbedarfDetails.map((z) => (
                <span key={z.frageId} className="whitespace-nowrap">
                  <span className="font-medium">{z.frageNummer}.</span> {z.minuten} Min. ({z.label})
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Taxonomie-Verteilung */}
      <Section titel="Taxonomie-Verteilung (Bloom)">
        <div className="space-y-2">
          {analyse.taxonomie.map((t) => (
            <div key={t.stufe} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-6">{t.stufe}</span>
              <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded h-5 overflow-hidden relative">
                <div
                  className="h-full bg-slate-600 dark:bg-slate-300 rounded transition-all"
                  style={{ width: `${t.prozent}%` }}
                />
                {t.fragenNummern.length > 0 && (
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white dark:text-slate-800 font-medium pointer-events-none overflow-hidden" title={`Fr. ${t.fragenNummern.join(', ')}`}>
                    {t.fragenNummern.join(', ')}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right">
                {t.anzahl} ({t.prozent}%)
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Fragetypen-Mix */}
      <Section titel="Fragetypen-Mix">
        <div className="flex flex-wrap gap-3">
          {analyse.fragetypen.map((ft) => (
            <div key={ft.typ} className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center min-w-[80px]">
              <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{ft.anzahl}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{ft.label}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Fr. {ft.fragenNummern.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Themen */}
      <Section titel="Themen-Abdeckung">
        <div className="space-y-1.5">
          {analyse.themen.map((t) => (
            <div key={t.thema} className="flex justify-between text-sm py-1 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-slate-700 dark:text-slate-200">{t.thema}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {t.anzahl} {t.anzahl === 1 ? 'Frage' : 'Fragen'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Punkteverteilung */}
      {analyse.abschnittPunkte.length > 0 && (
        <Section titel="Punkteverteilung">
          <div className="space-y-1.5">
            {analyse.abschnittPunkte.map((a) => (
              <div key={a.titel} className="flex justify-between text-sm py-1 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-slate-700 dark:text-slate-200">{a.titel}</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {a.punkte} Pkt. ({a.prozent}%)
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-1 px-3 font-medium">
              <span className="text-slate-800 dark:text-slate-100">Summe</span>
              <span className={analyse.gesamtPunkte === analyse.gesamtPunkteKonfiguriert
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
              }>
                {analyse.gesamtPunkte} / {analyse.gesamtPunkteKonfiguriert} Pkt.
                {analyse.gesamtPunkte === analyse.gesamtPunkteKonfiguriert ? ' ✓' : ' ≠'}
              </span>
            </div>
          </div>
        </Section>
      )}

      {/* KI-Analyse */}
      <Section titel="KI-Analyse">
        {!kiAnalyse && !kiLadend && !kiFehler && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Lassen Sie die gesamte Prüfung durch KI analysieren — Themenabdeckung, Schwierigkeitsbalance und Verbesserungsvorschläge.
            </p>
            <button
              onClick={starteKIAnalyse}
              disabled={!ki.verfuegbar && !istDemoModus}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              KI-Analyse starten
            </button>
            {!ki.verfuegbar && !istDemoModus && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                Backend nicht konfiguriert
              </p>
            )}
          </div>
        )}

        {kiLadend && (
          <div className="flex items-center justify-center py-8">
            <span className="inline-block w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-slate-500 dark:text-slate-400">Wird analysiert...</span>
          </div>
        )}

        {kiFehler && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{kiFehler}</p>
            <button
              onClick={() => setKiFehler(null)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 mt-1 cursor-pointer"
            >
              Schliessen
            </button>
          </div>
        )}

        {kiAnalyse && (
          <div className="space-y-4">
            {typeof kiAnalyse.themenAbdeckung === 'string' && (
              <KIKarte titel="Themen-Abdeckung" text={kiAnalyse.themenAbdeckung} />
            )}
            {typeof kiAnalyse.schwierigkeitsBalance === 'string' && (
              <KIKarte titel="Schwierigkeits-Balance" text={kiAnalyse.schwierigkeitsBalance} />
            )}
            {Array.isArray(kiAnalyse.verbesserungen) && kiAnalyse.verbesserungen.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-2">Verbesserungsvorschläge</h4>
                <ul className="space-y-1.5">
                  {(kiAnalyse.verbesserungen as string[]).map((v, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-200 flex gap-2">
                      <span className="text-slate-400 shrink-0">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {typeof kiAnalyse.gesamtBewertung === 'string' && (
              <KIKarte titel="Gesamtbewertung" text={kiAnalyse.gesamtBewertung} />
            )}
            <button
              onClick={() => { setKiAnalyse(null); ki.verwerfen('analysierePruefung') }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              Analyse verwerfen
            </button>
          </div>
        )}
      </Section>
    </div>
  )
}

function KIKarte({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">{titel}</h4>
      <p className="text-sm text-slate-700 dark:text-slate-200">{text}</p>
    </div>
  )
}

function WarnungBadge({ warnung }: { warnung: AnalyseWarnung }) {
  const farben = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    warnung: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    fehler: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  }

  return (
    <div className={`px-3 py-2 rounded-lg border text-sm ${farben[warnung.schwere]}`}>
      {warnung.text}
    </div>
  )
}
