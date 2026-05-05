/**
 * PruefungFragenEditor — Dünner Wrapper um SharedFragenEditor.
 * Stellt EditorProvider + Pruefung-spezifische Slots bereit.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthStore, ladeUndCacheLPs } from '../../../store/authStore.ts'
import { useFragenbankStore } from '../../../store/fragenbankStore.ts'
import type { LPInfo } from '../../../services/lpApi.ts'
import { uploadAnhang as apiUploadAnhang, kiAssistent as apiKiAssistent, markiereFeedbackAlsIgnoriert as apiMarkiereFeedbackAlsIgnoriert } from '../../../services/uploadApi.ts'
import { ladeLernziele as apiLadeLernziele, speichereLernziel as apiSpeichereLernziel } from '../../../services/poolApi.ts'
import { istKonfiguriert } from '../../../services/apiClient.ts'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { setKontenrahmenData } from '@shared/editor/kontenrahmen'
import kontenrahmenDaten from '@shared/editor/kontenrahmenDaten'
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'
import type { SpeichernMeta } from '@shared/editor/SharedFragenEditor'
import { istWRFachschaft } from '../../../utils/fachUtils.ts'
import { useSchulConfig } from '../../../store/schulConfigStore.ts'
import { generateZeitpunkte, zeitpunktModellAusConfig } from '../../../utils/zeitpunktUtils.ts'
import type { Frage } from '../../../types/fragen-storage'
import type { Frage as SharedFrage } from '@shared/types/fragen-core'
import type { FragenPerformance } from '../../../types/tracker.ts'

// Pruefung-spezifische Komponenten
import AnhangEditor from './AnhangEditor.tsx'
import PDFEditor from './PDFEditor.tsx'
import BerechtigungenEditor from '../../shared/BerechtigungenEditor.tsx'
import PoolUpdateVergleich from './PoolUpdateVergleich.tsx'
import RueckSyncDialog from '../fragenbank/RueckSyncDialog.tsx'
import Tooltip from '../../ui/Tooltip.tsx'

interface Props {
  frage: Frage | null
  onSpeichern: (frage: Frage, meta?: SpeichernMeta) => void
  onAbbrechen: () => void
  performance?: FragenPerformance
  /** Optional: zur vorherigen Frage der Liste springen. undefined = kein Button. */
  onVorherigeFrage?: () => void
  /** Optional: zur nächsten Frage der Liste springen. undefined = kein Button. */
  onNaechsteFrage?: () => void
}

export default function PruefungFragenEditor({ frage, onSpeichern, onAbbrechen, performance, onVorherigeFrage, onNaechsteFrage }: Props) {
  const user = useAuthStore((s) => s.user)
  const schulConfig = useSchulConfig((s) => s.config)
  const summaries = useFragenbankStore((s) => s.summaries)

  // Themen-Vorschläge: dedupliziertes, sortiertes Set aller Themen pro Fachbereich
  const ladeThemen = useCallback((fachbereich: string): string[] => {
    if (!fachbereich) return []
    const themen = new Set<string>()
    for (const s of summaries) {
      if (s.fachbereich === fachbereich && s.thema && s.thema.trim()) {
        themen.add(s.thema.trim())
      }
    }
    return Array.from(themen).sort((a, b) => a.localeCompare(b, 'de'))
  }, [summaries])

  // LP-Liste für BerechtigungenEditor
  const [lpListe, setLpListe] = useState<LPInfo[]>([])
  useEffect(() => {
    ladeUndCacheLPs().then(setLpListe)
  }, [])

  // Kontenrahmen für FiBu-Fragetypen laden
  useEffect(() => { setKontenrahmenData(kontenrahmenDaten) }, [])

  // EditorProvider Config + Services
  // Zeitpunkte (Bundle 12 K-4): Modus+Anzahl aus SchulConfig, Fallback auf Legacy-semesterModell
  const semesterListe = useMemo(() => {
    const modell = zeitpunktModellAusConfig(schulConfig, 'regel')
    return generateZeitpunkte(modell)
  }, [schulConfig])

  const editorConfig: EditorConfig = useMemo(() => ({
    benutzer: {
      email: user?.email ?? '',
      name: user?.name,
      fachschaft: user?.fachschaft,
      fachschaften: user?.fachschaften,
    },
    verfuegbareGefaesse: schulConfig.gefaesse,
    verfuegbareSemester: semesterListe,
    zeigeFiBuTypen: istWRFachschaft(user?.fachschaft),
    lpListe: lpListe.map(lp => ({ email: lp.email, name: lp.name, kuerzel: lp.kuerzel })),
    features: {
      kiAssistent: istKonfiguriert(),
      anhangUpload: istKonfiguriert(),
      bewertungsraster: true,
      sharing: true,
      poolSync: true,
      performance: !!performance,
    },
  }), [user, schulConfig, lpListe, performance, semesterListe])

  const editorServices: EditorServices = useMemo(() => ({
    uploadAnhang: async (frageId: string, datei: File) => {
      if (!user) return null
      return apiUploadAnhang(user.email, frageId, datei)
    },
    kiAssistent: async (aktion: string, daten: Record<string, unknown>) => {
      if (!user) return null
      return apiKiAssistent(user.email, aktion, daten)
    },
    markiereFeedbackAlsIgnoriert: async (feedbackId: string) => {
      if (!user) return
      await apiMarkiereFeedbackAlsIgnoriert(user.email, feedbackId)
    },
    istKIVerfuegbar: () => istKonfiguriert(),
    istUploadVerfuegbar: () => istKonfiguriert() && !!user,
    ladeLernziele: async (_gefaess: string, fachbereich: string) => {
      if (!user) return []
      return apiLadeLernziele(user.email, fachbereich)
    },
    speichereLernziel: async (lernziel) => {
      if (!user) return null
      return apiSpeichereLernziel(user.email, lernziel)
    },
    ladeThemen,
  }), [user, ladeThemen])

  return (
    <EditorProvider config={editorConfig} services={editorServices}>
      <SharedFragenEditor
        frage={frage as unknown as SharedFrage | null}
        onSpeichern={(f, meta) => onSpeichern(f as unknown as Frage, meta)}
        onAbbrechen={onAbbrechen}
        performance={performance}
        onVorherigeFrage={onVorherigeFrage}
        onNaechsteFrage={onNaechsteFrage}
        PDFEditorComponent={PDFEditor}
        anhangEditorSlot={(props) => (
          <AnhangEditor
            anhaenge={props.anhaenge}
            neueAnhaenge={props.neueAnhaenge}
            onAnhangHinzu={props.onAnhangHinzu}
            onAnhangEntfernen={props.onAnhangEntfernen}
            onNeuenAnhangEntfernen={props.onNeuenAnhangEntfernen}
            onUrlAnhangHinzu={props.onUrlAnhangHinzu}
          />
        )}
        berechtigungenSlot={(props) => (
          <BerechtigungenEditor
            berechtigungen={props.berechtigungen}
            onChange={props.onChange}
            lpListe={lpListe}
            eigeneFachschaft={user?.fachschaft}
          />
        )}
        berechtigungenHeaderSlot={({ berechtigungen, geteilt }) => {
          const individuelle = berechtigungen.filter(
            b => b.email !== '*' && !b.email.startsWith('fachschaft:')
          )
          const stufeLabel =
            geteilt === 'schule' ? 'Schulweit'
            : geteilt === 'fachschaft' ? 'Fachschaft'
            : individuelle.length > 0 ? 'Privat + geteilt' : 'Privat'
          const zusatz = individuelle.length > 0 ? ` · ${individuelle.length} LP` : ''
          return (
            <span
              className="text-xs px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300"
              title="Geteilt mit (bearbeitbar in den Metadaten)"
            >
              Geteilt: {stufeLabel}{zusatz}
            </span>
          )
        }}
        poolInfoSlot={({ frage: f, onSpeichern: speichern }) => {
          const pf = f as unknown as Frage | null /* Defensive: Slot ist Core-typisiert; Body liest poolVersion (Storage-only via WithStorageBase) */
          if (!pf || pf.quelle !== 'pool' || !pf.poolId) return null
          return (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Importiert aus Pool: <strong>{pf.quellReferenz || pf.poolId}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const aktualisiert = { ...pf, pruefungstauglich: !pf.pruefungstauglich, geaendertAm: new Date().toISOString() }
                      speichern(aktualisiert as unknown as SharedFrage /* Defensive: Storage-Frage zurueck durch Core-typisierten Slot */)
                    }}
                    className={pf.pruefungstauglich
                      ? 'px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/70 cursor-pointer'
                      : 'px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer'
                    }
                  >
                    {pf.pruefungstauglich ? '\u2713 Prüfungstauglich' : 'Prüfungstauglich \u2713'}
                  </button>
                </div>
              </div>
              {pf.poolUpdateVerfuegbar && pf.poolVersion && (
                <PoolUpdateVergleich
                  frage={pf}
                  onUebernehmen={() => speichern({ ...pf, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() } as unknown as SharedFrage /* Defensive: Storage-Frage zurueck durch Core-typisierten Slot */)}
                  onIgnorieren={() => speichern({ ...pf, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() } as unknown as SharedFrage /* Defensive: Storage-Frage zurueck durch Core-typisierten Slot */)}
                />
              )}
            </div>
          )
        }}
        poolSyncSlot={({ frage: fc, typ, onRueckSync }) => {
          // Editor-Slot gibt Core.Frage — Cast auf Storage.Frage für `poolVersion`-Zugriff (Storage-Feld).
          const f = fc as Frage | null
          return (
          <>
            {f && f.poolId && f.poolVersion && (
              <button
                onClick={onRueckSync}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Tooltip text="Änderungen an Pool zurückschreiben"><span>&uarr; An Pool</span></Tooltip>
              </button>
            )}
            {f && !f.poolId && typ !== 'visualisierung' && (
              <button
                onClick={onRueckSync}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Tooltip text="Frage in einen Übungspool exportieren"><span>&uarr; In Pool exportieren</span></Tooltip>
              </button>
            )}
          </>
          )
        }}
        rueckSyncSlot={({ offen, onSchliessen, onErfolg }) => (
          frage ? (
            <RueckSyncDialog
              frage={frage}
              offen={offen}
              onSchliessen={onSchliessen}
              onErfolg={onErfolg as unknown as (updates: Partial<Frage>) => void /* Defensive: Slot ist Core-typisiert; RueckSyncDialog erwartet Partial<Storage.Frage> mit poolVersion (Storage-only via WithStorageBase) */}
            />
          ) : null
        )}
      />
    </EditorProvider>
  )
}
