import { useState } from 'react'
import type { SchuelerKorrektur, SchuelerAbgabe } from '../../../types/korrektur.ts'
import type { Frage, PDFAnnotation, PDFFrage } from '../../../types/fragen.ts'
import type { KorrekturErgebnis } from '../../../utils/autoKorrektur.ts'
import { effektivePunkte, berechneNote, statusLabel, korrekturStatusFarbe } from '../../../utils/korrekturUtils.ts'
import type { NotenConfig } from '../../../types/pruefung.ts'
import KorrekturFrageZeile from './KorrekturFrageZeile.tsx'
import ZeichnenKorrektur from './ZeichnenKorrektur.tsx'
import PDFKorrektur from './PDFKorrektur.tsx'
import AudioRecorder from '../../AudioRecorder.tsx'

interface Props {
  pruefungId: string
  schueler: SchuelerKorrektur
  abgabe: SchuelerAbgabe | undefined
  fragen: Frage[]
  autoErgebnisse: Record<string, KorrekturErgebnis | null>
  notenConfig?: Partial<NotenConfig>
  userEmail?: string
  onBewertungUpdate: (
    schuelerEmail: string,
    frageId: string,
    updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null; kiPunkte?: number | null; kiBegruendung?: string | null; quelle?: 'auto' | 'ki' | 'manuell' | 'fehler' }
  ) => void
  onNoteOverride: (schuelerEmail: string, noteOverride: number | null) => void
  onAudioUpload: (schuelerEmail: string, frageId: string, blob: Blob) => Promise<string | null>
  onGesamtAudioUpdate: (email: string, audioId: string) => void
  onPDF?: () => void
  defaultOffen?: boolean
  istFormativ?: boolean
}

export default function KorrekturSchuelerZeile({ pruefungId, schueler, abgabe, fragen, autoErgebnisse, notenConfig, userEmail, onBewertungUpdate, onNoteOverride, onAudioUpload, onGesamtAudioUpdate, onPDF, defaultOffen = false, istFormativ = false }: Props) {
  const [offen, setOffen] = useState(defaultOffen)
  const [noteEditModus, setNoteEditModus] = useState(false)
  const [noteInput, setNoteInput] = useState('')

  // Aggregierte Werte (mit NaN-Schutz für maxPunkte aus Backend-Daten)
  const bewertungenListe = Object.values(schueler.bewertungen)
  const totalPunkte = bewertungenListe.reduce((s, b) => s + effektivePunkte(b), 0)
  const totalMax = bewertungenListe.reduce((s, b) => s + (Number.isFinite(b.maxPunkte) ? b.maxPunkte : 0), 0)
  const berechneteNote = berechneNote(totalPunkte, totalMax, notenConfig)
  const note = schueler.noteOverride ?? berechneteNote
  const hatOverride = schueler.noteOverride != null
  const geprueftCount = bewertungenListe.filter((b) => b.geprueft).length
  const totalCount = bewertungenListe.length
  const alleGeprueft = totalCount > 0 && geprueftCount === totalCount

  function handleNoteEdit(): void {
    setNoteInput(note.toFixed(1))
    setNoteEditModus(true)
  }

  function handleNoteSpeichern(): void {
    const parsed = parseFloat(noteInput)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 6) {
      const rundung = notenConfig?.rundung ?? 0.5
      const gerundet = Math.round(parsed / rundung) * rundung
      const begrenzt = Math.round(Math.min(6, Math.max(1, gerundet)) * 100) / 100
      onNoteOverride(schueler.email, begrenzt)
    }
    setNoteEditModus(false)
  }

  function handleNoteZuruecksetzen(): void {
    onNoteOverride(schueler.email, null)
    setNoteEditModus(false)
  }

  const handleAlleBestaetigen = () => {
    for (const bew of bewertungenListe) {
      if (!bew.geprueft) {
        onBewertungUpdate(schueler.email, bew.frageId, { geprueft: true })
      }
    }
  }

  return (
    <div className={`border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
      alleGeprueft ? 'bg-green-50/40 dark:bg-green-900/5' : ''
    }`}>
      {/* Kopfzeile (klickbar) */}
      <button
        onClick={() => setOffen(!offen)}
        className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1fr_auto] gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-left items-center"
      >
        {/* Name + Klasse */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 w-4 shrink-0 transition-transform duration-150 inline-block"
            style={{ transform: offen ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {schueler.name}
          </span>
          {schueler.klasse && (
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
              {schueler.klasse}
            </span>
          )}
        </div>

        {/* Punkte + Note */}
        <div className="hidden md:flex items-center gap-2">
          {!istFormativ && (
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {totalPunkte} / {totalMax}
          </span>
          )}
          {!istFormativ && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                note >= 4
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              } ${hatOverride ? 'ring-1 ring-amber-400 dark:ring-amber-500' : ''}`}
              title={hatOverride ? `Berechnet: ${berechneteNote.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)}, Überschrieben: ${note.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)}` : `Note: ${note.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)}`}
            >
              {note.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)}
            </span>
          )}
        </div>

        {/* Status + Geprüft-Zähler */}
        <div className="flex items-center gap-2 justify-end md:justify-start">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${korrekturStatusFarbe(schueler.korrekturStatus)}`}>
            {statusLabel(schueler.korrekturStatus)}
          </span>
          <span className={`text-xs ${
            alleGeprueft
              ? 'text-green-600 dark:text-green-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}>
            {geprueftCount}/{totalCount} ✓
          </span>
          {onPDF && (
            <button
              onClick={(e) => { e.stopPropagation(); onPDF() }}
              className="text-xs px-1.5 py-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors cursor-pointer"
            >
              PDF
            </button>
          )}
        </div>

        {/* Punkte + Note (Mobile, rechts oben) */}
        {!istFormativ && (
        <div className="md:hidden text-right">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {totalPunkte}/{totalMax}
          </span>
          <span className={`ml-1 text-xs ${note >= 4 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ({note.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)})
          </span>
        </div>
        )}
      </button>

      {/* Aufgeklappter Bereich */}
      {offen && (
        <div className="px-4 pb-3 space-y-1">
          {fragen.map((frage, fragenIdx) => {
            const bewertung = schueler.bewertungen[frage.id]
            const antwort = abgabe?.antworten[frage.id]

            if (!bewertung) return null

            // Visualisierung: spezielle Zeichnen-Korrektur
            if (frage.typ === 'visualisierung' && antwort?.typ === 'visualisierung') {
              return (
                <div
                  key={frage.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    bewertung.geprueft
                      ? 'border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  {/* Frage-Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{frage.id}</span>
                    <span className="inline-block px-1.5 py-0.5 text-xs rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      visualisierung
                    </span>
                    {!istFormativ && (
                    <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      max. {bewertung.maxPunkte} Pkt.
                    </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 truncate" title={(frage as { fragetext?: string }).fragetext}>
                    {(frage as { fragetext?: string }).fragetext ?? frage.id}
                  </p>
                  <ZeichnenKorrektur
                    pruefungId={pruefungId}
                    frageId={frage.id}
                    fragetext={(frage as { fragetext?: string }).fragetext ?? frage.id}
                    maxPunkte={bewertung.maxPunkte}
                    bildLink={antwort.bildLink}
                    daten={antwort.daten}
                    bloom={frage.bloom}
                    bewertungsraster={(frage as unknown as Record<string, unknown>).bewertungsraster}
                    lernziel={(frage as unknown as Record<string, unknown>).lernziel as string}
                    bewertung={bewertung}
                    schuelerEmail={schueler.email}
                    onUpdate={(updates) => onBewertungUpdate(schueler.email, frage.id, updates)}
                    onAudioUpload={(frageId, blob) => onAudioUpload(schueler.email, frageId, blob)}
                  />
                </div>
              )
            }

            // PDF: spezielle PDF-Korrektur mit Annotation-Ansicht
            if (frage.typ === 'pdf' && antwort?.typ === 'pdf') {
              const pdfAntwort = antwort as { typ: 'pdf'; annotationen: PDFAnnotation[] }
              return (
                <div
                  key={frage.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    bewertung.geprueft
                      ? 'border-green-200 bg-green-50/30 dark:border-green-800/40 dark:bg-green-900/10'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  {/* Frage-Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{frage.id}</span>
                    <span className="inline-block px-1.5 py-0.5 text-xs rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      pdf
                    </span>
                    {!istFormativ && (
                    <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                      max. {bewertung.maxPunkte} Pkt.
                    </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 truncate" title={(frage as PDFFrage).fragetext}>
                    {(frage as PDFFrage).fragetext ?? frage.id}
                  </p>
                  <PDFKorrektur
                    pruefungId={pruefungId}
                    frageId={frage.id}
                    fragetext={(frage as PDFFrage).fragetext ?? frage.id}
                    maxPunkte={bewertung.maxPunkte}
                    frage={frage as PDFFrage}
                    annotationen={pdfAntwort.annotationen ?? []}
                    bewertung={bewertung}
                    schuelerEmail={schueler.email}
                    onUpdate={(updates) => onBewertungUpdate(schueler.email, frage.id, updates)}
                    onAudioUpload={(frageId, blob) => onAudioUpload(schueler.email, frageId, blob)}
                  />
                </div>
              )
            }

            return (
              <KorrekturFrageZeile
                key={frage.id}
                frageId={frage.id}
                frage={frage}
                antwort={antwort}
                autoErgebnis={autoErgebnisse[frage.id] ?? null}
                bewertung={bewertung}
                aufgabeNr={fragenIdx + 1}
                userEmail={userEmail}
                istFormativ={istFormativ}
                onUpdate={(updates) => onBewertungUpdate(schueler.email, frage.id, updates)}
                onAudioUpload={(frageId, blob) => onAudioUpload(schueler.email, frageId, blob)}
              />
            )
          })}

          {/* Note-Anzeige und Override (nicht bei formativen Übungen) */}
          {!istFormativ && (
          <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">Note:</span>
            {noteEditModus ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNoteSpeichern(); if (e.key === 'Escape') setNoteEditModus(false) }}
                  min={1}
                  max={6}
                  step={notenConfig?.rundung ?? 0.5}
                  className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  autoFocus
                />
                <button
                  onClick={handleNoteSpeichern}
                  className="text-xs px-2 py-1 rounded bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 cursor-pointer"
                >
                  OK
                </button>
                {hatOverride && (
                  <button
                    onClick={handleNoteZuruecksetzen}
                    className="text-xs px-2 py-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer"
                  >
                    Zurücksetzen
                  </button>
                )}
                <button
                  onClick={() => setNoteEditModus(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold px-2 py-0.5 rounded ${
                  note >= 4
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {note.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)}
                </span>
                {hatOverride && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    (berechnet: {berechneteNote.toFixed((notenConfig?.rundung ?? 0.5) < 0.5 ? 2 : 1)})
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleNoteEdit() }}
                  className="text-[10px] px-1.5 py-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors cursor-pointer"
                >
                  Anpassen
                </button>
              </div>
            )}
            <div className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              {totalPunkte} / {totalMax} Pkt. ({totalMax > 0 ? Math.round(totalPunkte / totalMax * 100) : 0}%)
            </div>
          </div>
          )}

          {/* Audio-Gesamtkommentar */}
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400">Audio-Gesamtkommentar:</span>
            <div className="mt-1">
              <AudioRecorder
                bestehendeAudioId={schueler.audioGesamtkommentarId}
                onSpeichern={async (blob) => {
                  const driveId = await onAudioUpload(schueler.email, 'gesamt', blob)
                  if (driveId) {
                    onGesamtAudioUpdate(schueler.email, driveId)
                  }
                }}
              />
            </div>
          </div>

          {/* Alle bestätigen */}
          {!alleGeprueft && totalCount > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAlleBestaetigen}
                className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white transition-colors cursor-pointer"
              >
                Alle bestätigen ({totalCount - geprueftCount} offen)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
