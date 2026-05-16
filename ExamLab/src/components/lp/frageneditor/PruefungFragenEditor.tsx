/**
 * PruefungFragenEditor — Dünner Wrapper um SharedFragenEditor.
 * Stellt EditorProvider + Pruefung-spezifische Slots bereit.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthStore, ladeUndCacheLPs } from '../../../store/authStore.ts'
import { useFragensammlungStore } from '../../../store/fragensammlungStore.ts'
import type { LPInfo } from '../../../services/lpApi.ts'
import { uploadAnhang as apiUploadAnhang, kiAssistent as apiKiAssistent, markiereFeedbackAlsIgnoriert as apiMarkiereFeedbackAlsIgnoriert } from '../../../services/uploadApi.ts'
import { ladeLernziele as apiLadeLernziele, speichereLernziel as apiSpeichereLernziel } from '../../../services/poolApi.ts'
import { istKonfiguriert } from '../../../services/apiClient.ts'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'
import { setKontenrahmenData } from '@shared/editor/kontenrahmen'
import kontenrahmenDaten from '@shared/editor/kontenrahmenDaten'
import SharedFragenEditor from '@shared/editor/SharedFragenEditor'
import type { SpeichernMeta, AutoSaveAdapter } from '@shared/editor/SharedFragenEditor'
import type { FragenBulkPatch, TagsModus } from '@shared/types/fragen-core'
import { TagPicker } from '@shared/editor/components/TagPicker'
import { useShallow } from 'zustand/react/shallow'
import { useTagsStore } from '../../../store/tagsStore.ts'
import { erstelleTag } from '../../../services/tagsApi.ts'
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
import RueckSyncDialog from '../fragensammlung/RueckSyncDialog.tsx'
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
  /** Bundle 3 P-C.3 — Auto-Save-Adapter (opt-in, nur Fragensammlung). */
  autoSave?: AutoSaveAdapter
  /** Test-Tickets-Bundle — Lösch-Button im Editor (mit Bestätigung). undefined = kein Button. */
  onLoeschen?: (frage: Frage) => void
  /** Cluster D Phase 4 — Pass-Through für Batch-Edit-Modus an den SharedFragenEditor.
   *  undefined = Single-Edit-Modus (Backward-Compat). */
  batchMode?: { count: number; sichtbareCount: number }
  /** Cluster D Phase 4 — Save-Handler im Batch-Modus (statt onSpeichern). */
  onBatchSave?: (patch: FragenBulkPatch, tagsModus: TagsModus) => void
}

export default function PruefungFragenEditor({ frage, onSpeichern, onAbbrechen, performance, onVorherigeFrage, onNaechsteFrage, autoSave, onLoeschen, batchMode, onBatchSave }: Props) {
  const user = useAuthStore((s) => s.user)
  const schulConfig = useSchulConfig((s) => s.config)
  const summaries = useFragensammlungStore((s) => s.summaries)

  // Cluster H Phase 2 — TagPicker DI: tagsStore + tagsApi sind App-Schicht;
  // wir reichen TagPicker als Render-Prop in den SharedFragenEditor.
  // useShallow ist Pflicht: .filter() returnt neues Array → ohne shallow-Equality infinite re-render (React #185).
  const alleTags = useTagsStore(useShallow((s) => s.tags.filter((t) => !t.archiviert)))
  const upsertTagLokal = useTagsStore((s) => s.upsertLokal)
  const handleErstelleTag = useCallback(async (name: string) => {
    if (!user?.email) throw new Error('Nicht eingeloggt')
    const r = await erstelleTag({ email: user.email, name })
    upsertTagLokal(r.tag)
    return r.tag
  }, [user?.email, upsertTagLokal])

  // Cluster H Phase 3 (17.05.2026): Legacy-Fallback aus Polish P3 entfernt.
  // tagIds ist Single-Source-of-Truth — der Editor zeigt direkt die im Store
  // referenzierten Tags. Pre-Phase-3-Fragen mit leerem tagIds + altem `tags`-Feld
  // zeigen jetzt keine vorausgewaehlten Tags mehr; das ist erwartet, weil Phase 1
  // alle Migrationskandidaten in tagIds umgeschrieben hat.
  const fragePrepared = frage

  // Cluster H Phase 2 Polish P4: Beim Speichern legacy-`tags`-Liste aus aktuellem
  // `tagIds` neu computen — der TagPicker ist jetzt single-source-of-truth, das
  // Komma-Feld in MetadataSection ist entfernt. `tags` bleibt parallel persistiert
  // bis Phase-3-Cleanup (Rollback-Sicherheit). Gleiche Logik im Auto-Save-Pfad,
  // damit auch zwischen-Saves vollständig sind.
  const tagsAusIds = useCallback((tagIds?: string[]): string[] => {
    if (!tagIds || tagIds.length === 0) return []
    return useTagsStore.getState().getByIds(tagIds).map((t) => t.name)
  }, [])

  const handleSpeichern = useCallback((f: SharedFrage, meta?: SpeichernMeta) => {
    const namen = tagsAusIds(f.tagIds)
    const angereichert = { ...(f as unknown as Frage), tags: namen } as Frage
    onSpeichern(angereichert, meta)
  }, [onSpeichern, tagsAusIds])

  const wrappedAutoSave: AutoSaveAdapter | undefined = useMemo(() => {
    if (!autoSave) return undefined
    return {
      ...autoSave,
      onTippe: (f: SharedFrage) => {
        const namen = tagsAusIds(f.tagIds)
        const angereichert = { ...(f as unknown as Frage), tags: namen } as unknown as SharedFrage
        autoSave.onTippe(angereichert)
      },
    }
  }, [autoSave, tagsAusIds])

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
    kiAssistent: async (kiAktion: string, daten: Record<string, unknown>) => {
      if (!user) return null
      return apiKiAssistent(user.email, kiAktion, daten)
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
        frage={fragePrepared as unknown as SharedFrage | null}
        onSpeichern={handleSpeichern}
        onAbbrechen={onAbbrechen}
        onLoeschen={onLoeschen ? (f) => onLoeschen(f as unknown as Frage) : undefined}
        performance={performance}
        onVorherigeFrage={onVorherigeFrage}
        onNaechsteFrage={onNaechsteFrage}
        autoSave={wrappedAutoSave}
        batchMode={batchMode}
        onBatchSave={onBatchSave}
        tagPickerSlot={({ tagIds, onChange }) => (
          <TagPicker
            tagIds={tagIds}
            onChange={onChange}
            alleTags={alleTags}
            onErstelleNeu={handleErstelleTag}
          />
        )}
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
