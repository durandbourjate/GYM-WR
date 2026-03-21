import { useState, useRef, useCallback } from 'react'
import type { PruefungsConfig, PruefungsMaterial } from '../../../types/pruefung.ts'
import { Section, Field, Toggle } from './ComposerUI.tsx'
import { apiService } from '../../../services/apiService.ts'
import { parseVideoUrl } from '../../../utils/mediaUtils.ts'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  toggleFachbereich: (fb: string) => void
}

export default function ConfigTab({ pruefung, updatePruefung, toggleFachbereich }: Props) {
  const [neueEmail, setNeueEmail] = useState('')
  const [neueMinuten, setNeueMinuten] = useState(15)

  const zeitverlaengerungen = pruefung.zeitverlaengerungen ?? {}
  const eintraege = Object.entries(zeitverlaengerungen)

  function addZeitverlaengerung(): void {
    const email = neueEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    updatePruefung({
      zeitverlaengerungen: { ...zeitverlaengerungen, [email]: neueMinuten },
    })
    setNeueEmail('')
    setNeueMinuten(15)
  }

  function removeZeitverlaengerung(email: string): void {
    const kopie = { ...zeitverlaengerungen }
    delete kopie[email]
    updatePruefung({ zeitverlaengerungen: kopie })
  }

  return (
    <div className="space-y-6">
      {/* Grunddaten */}
      <Section titel="Grunddaten">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Titel" span={2}>
            <input
              type="text"
              value={pruefung.titel}
              onChange={(e) => updatePruefung({ titel: e.target.value })}
              placeholder="z.B. Prüfung VWL/Recht — Markt & Verträge"
              className="input-field"
            />
          </Field>

          <Field label="Klasse">
            <input
              type="text"
              value={pruefung.klasse}
              onChange={(e) => updatePruefung({ klasse: e.target.value, erlaubteKlasse: e.target.value })}
              placeholder="z.B. 29c WR (SF)"
              className="input-field"
            />
          </Field>

          <Field label="Datum">
            <input
              type="date"
              value={pruefung.datum}
              onChange={(e) => updatePruefung({ datum: e.target.value })}
              className="input-field"
            />
          </Field>

          <Field label="Gefäss">
            <select
              value={pruefung.gefaess}
              onChange={(e) => updatePruefung({ gefaess: e.target.value as 'SF' | 'EF' | 'EWR' | 'GF' })}
              className="input-field"
            >
              <option value="SF">SF (Schwerpunktfach)</option>
              <option value="EF">EF (Ergänzungsfach)</option>
              <option value="EWR">EWR (Einführung W&R)</option>
              <option value="GF">GF (Grundlagenfach)</option>
            </select>
          </Field>

          <Field label="Semester">
            <select
              value={pruefung.semester}
              onChange={(e) => updatePruefung({ semester: e.target.value })}
              className="input-field"
            >
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Fachbereiche */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
            Fachbereiche
          </label>
          <div className="flex gap-2">
            {['VWL', 'BWL', 'Recht'].map((fb) => {
              const aktiv = pruefung.fachbereiche.includes(fb)
              return (
                <button
                  key={fb}
                  onClick={() => toggleFachbereich(fb)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer
                    ${aktiv
                      ? fb === 'VWL' ? 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300'
                      : fb === 'BWL' ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                      : 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                      : 'bg-slate-50 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                    }
                  `}
                >
                  {fb}
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Prüfungsparameter */}
      <Section titel="Prüfungsparameter">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Dauer (Minuten)">
            <input
              type="number"
              value={pruefung.dauerMinuten}
              onChange={(e) => updatePruefung({ dauerMinuten: parseInt(e.target.value) || 0 })}
              min={5}
              max={300}
              className="input-field"
            />
          </Field>

          <Field label="Typ">
            <select
              value={pruefung.typ}
              onChange={(e) => updatePruefung({ typ: e.target.value as 'summativ' | 'formativ' })}
              className="input-field"
            >
              <option value="summativ">Summativ (benotet)</option>
              <option value="formativ">Formativ (unbenotet)</option>
            </select>
          </Field>

          <Field label="Gesamtpunkte">
            <input
              type="number"
              value={pruefung.gesamtpunkte}
              onChange={(e) => updatePruefung({ gesamtpunkte: parseInt(e.target.value) || 0 })}
              min={0}
              className="input-field"
            />
          </Field>
        </div>
      </Section>

      {/* Optionen */}
      <Section titel="Optionen">
        <div className="space-y-3">
          <Toggle
            label="Rücknavigation erlaubt"
            beschreibung="SuS können zwischen Fragen vor- und zurücknavigieren"
            aktiv={pruefung.ruecknavigation}
            onChange={(v) => updatePruefung({ ruecknavigation: v })}
          />
          <Toggle
            label="SEB erforderlich"
            beschreibung="Prüfung nur im Safe Exam Browser erlaubt"
            aktiv={pruefung.sebErforderlich}
            onChange={(v) => updatePruefung({ sebErforderlich: v })}
          />
          <Toggle
            label="Zufällige Fragenreihenfolge"
            beschreibung="Fragen innerhalb eines Abschnitts werden gemischt"
            aktiv={pruefung.zufallsreihenfolgeFragen}
            onChange={(v) => updatePruefung({ zufallsreihenfolgeFragen: v })}
          />
          <Toggle
            label="Zufällige Optionen-Reihenfolge"
            beschreibung="Antwortoptionen bei MC, Single Choice und R/F werden gemischt"
            aktiv={pruefung.zufallsreihenfolgeOptionen}
            onChange={(v) => updatePruefung({ zufallsreihenfolgeOptionen: v })}
          />
        </div>

        <div className="mt-4">
          <Field label="Zeitanzeige">
            <select
              value={pruefung.zeitanzeigeTyp}
              onChange={(e) => updatePruefung({ zeitanzeigeTyp: e.target.value as 'countdown' | 'verstricheneZeit' | 'keine' })}
              className="input-field"
            >
              <option value="countdown">Countdown (verbleibende Zeit)</option>
              <option value="verstricheneZeit">Verstrichene Zeit</option>
              <option value="keine">Keine Zeitanzeige</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* Zeitzuschläge (Nachteilsausgleich) */}
      <Section titel="Zeitzuschläge (Nachteilsausgleich)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Individuelle Zeitverlängerungen für SuS mit Nachteilsausgleich. Die zusätzlichen Minuten werden zur regulären Prüfungsdauer addiert.
        </p>

        {/* Bestehende Einträge */}
        {eintraege.length > 0 && (
          <div className="space-y-2 mb-4">
            {eintraege.map(([email, minuten]) => (
              <div
                key={email}
                className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm"
              >
                <span className="flex-1 text-slate-700 dark:text-slate-200 truncate">{email}</span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-medium">
                  +{minuten} Min.
                </span>
                <button
                  onClick={() => removeZeitverlaengerung(email)}
                  className="w-6 h-6 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer transition-colors"
                  title="Entfernen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Neuen Eintrag hinzufügen */}
        <div className="flex items-end gap-2">
          <Field label="E-Mail">
            <input
              type="email"
              value={neueEmail}
              onChange={(e) => setNeueEmail(e.target.value)}
              placeholder="vorname.nachname@stud.gymhofwil.ch"
              className="input-field"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addZeitverlaengerung()
                }
              }}
            />
          </Field>
          <Field label="Minuten">
            <input
              type="number"
              value={neueMinuten}
              onChange={(e) => setNeueMinuten(parseInt(e.target.value) || 0)}
              min={1}
              max={120}
              className="input-field-narrow w-20"
            />
          </Field>
          <button
            onClick={addZeitverlaengerung}
            disabled={!neueEmail.trim() || !neueEmail.includes('@')}
            className="px-3 py-2 text-sm font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer mb-px"
          >
            +
          </button>
        </div>
      </Section>

      {/* Materialien (Gesetze, PDFs, Hilfsmittel) */}
      <MaterialienSection
        materialien={pruefung.materialien ?? []}
        setMaterialien={(m) => updatePruefung({ materialien: m })}
      />
    </div>
  )
}

/** Formatiert Dateigrösse menschenlesbar */
function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const MAX_MATERIAL_GROESSE = 10 * 1024 * 1024 // 10 MB
const ERLAUBTE_TYPEN = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm', 'video/ogg']

/** Verwaltung von Prüfungs-Materialien (PDFs, Texte, Links, Datei-Uploads) */
function MaterialienSection({ materialien, setMaterialien }: {
  materialien: PruefungsMaterial[]
  setMaterialien: (m: PruefungsMaterial[]) => void
}) {
  const [zeigHinzufuegen, setZeigHinzufuegen] = useState(false)
  const [neuerTyp, setNeuerTyp] = useState<PruefungsMaterial['typ']>('pdf')
  const [neuerTitel, setNeuerTitel] = useState('')
  const [neueUrl, setNeueUrl] = useState('')
  const [neuerInhalt, setNeuerInhalt] = useState('')
  const [embedUrlFehler, setEmbedUrlFehler] = useState('')

  // Datei-Upload State
  const [uploadDatei, setUploadDatei] = useState<File | null>(null)
  const [uploadLaeuft, setUploadLaeuft] = useState(false)
  const [uploadFehler, setUploadFehler] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function resetForm(): void {
    setNeuerTitel('')
    setNeueUrl('')
    setNeuerInhalt('')
    setUploadDatei(null)
    setUploadFehler(null)
    setEmbedUrlFehler('')
    setZeigHinzufuegen(false)
  }

  function addMaterial(): void {
    const titel = neuerTitel.trim()
    if (!titel) return
    if ((neuerTyp === 'pdf' || neuerTyp === 'link') && !neueUrl.trim()) return
    if (neuerTyp === 'text' && !neuerInhalt.trim()) return
    if (neuerTyp === 'videoEmbed') {
      const info = parseVideoUrl(neueUrl.trim())
      if (!info) {
        setEmbedUrlFehler('URL nicht erkannt. Unterstützt: YouTube, Vimeo, nanoo.tv')
        return
      }
      const neu: PruefungsMaterial = {
        id: crypto.randomUUID(),
        titel,
        typ: 'videoEmbed',
        embedUrl: info.embedUrl,
        url: neueUrl.trim(),
      }
      setMaterialien([...materialien, neu])
      resetForm()
      return
    }

    const neu: PruefungsMaterial = {
      id: crypto.randomUUID(),
      titel,
      typ: neuerTyp,
      ...(neuerTyp !== 'text' ? { url: neueUrl.trim() } : {}),
      ...(neuerTyp === 'text' ? { inhalt: neuerInhalt.trim() } : {}),
    }
    setMaterialien([...materialien, neu])
    resetForm()
  }

  /** Datei validieren und als Upload-Kandidat setzen */
  function handleDateiWaehlen(dateien: FileList | null): void {
    if (!dateien || dateien.length === 0) return
    setUploadFehler(null)

    const datei = dateien[0]
    const erlaubt = ERLAUBTE_TYPEN.includes(datei.type)
      || datei.type.startsWith('audio/') || datei.type.startsWith('video/')
    if (!erlaubt) {
      setUploadFehler('Nur PDF, Bild, Audio und Video erlaubt.')
      return
    }
    if (datei.size > MAX_MATERIAL_GROESSE) {
      setUploadFehler(`"${datei.name}" ist zu gross (max. 10 MB).`)
      return
    }

    setUploadDatei(datei)
    // Titel automatisch vorausfüllen (Dateiname ohne Endung)
    if (!neuerTitel.trim()) {
      const ohneEndung = datei.name.replace(/\.[^/.]+$/, '')
      setNeuerTitel(ohneEndung)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /** Datei hochladen und Material hinzufügen */
  async function handleUpload(): Promise<void> {
    if (!uploadDatei || !neuerTitel.trim()) return

    setUploadLaeuft(true)
    setUploadFehler(null)

    try {
      // E-Mail aus Auth-Store holen (wird über Closure erfasst)
      const email = (await import('../../../store/authStore.ts')).useAuthStore.getState().user?.email
      if (!email) {
        setUploadFehler('Nicht angemeldet.')
        setUploadLaeuft(false)
        return
      }

      const ergebnis = await apiService.uploadMaterial(email, uploadDatei)
      if (!ergebnis) {
        setUploadFehler('Upload fehlgeschlagen. Bitte erneut versuchen.')
        setUploadLaeuft(false)
        return
      }

      const neu: PruefungsMaterial = {
        id: crypto.randomUUID(),
        titel: neuerTitel.trim(),
        typ: 'dateiUpload',
        url: ergebnis.url,
        driveFileId: ergebnis.driveFileId,
        dateiname: uploadDatei.name,
        mimeType: uploadDatei.type,
      }
      setMaterialien([...materialien, neu])
      resetForm()
    } catch {
      setUploadFehler('Netzwerkfehler beim Upload.')
    } finally {
      setUploadLaeuft(false)
    }
  }

  function removeMaterial(id: string): void {
    setMaterialien(materialien.filter((m) => m.id !== id))
  }

  function updateMaterial(id: string, partial: Partial<PruefungsMaterial>): void {
    setMaterialien(materialien.map((m) => m.id === id ? { ...m, ...partial } : m))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleDateiWaehlen(e.dataTransfer.files)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neuerTitel])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const typLabel: Record<PruefungsMaterial['typ'], string> = {
    pdf: 'PDF',
    text: 'Text',
    link: 'Link',
    dateiUpload: 'Datei',
    videoEmbed: 'Video',
  }

  const typIcon: Record<PruefungsMaterial['typ'], string> = {
    pdf: '📄',
    text: '📝',
    link: '🔗',
    dateiUpload: '📎',
    videoEmbed: '🎬',
  }

  return (
    <Section titel="Materialien (Hilfsmittel)">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Referenzmaterialien für SuS während der Prüfung (z.B. Gesetzestexte, Formeln, Nachschlagewerke).
      </p>

      {/* Bestehende Materialien */}
      {materialien.length > 0 && (
        <div className="space-y-2 mb-4">
          {materialien.map((mat) => (
            <div
              key={mat.id}
              className="flex items-start gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg"
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <span className="text-sm" title={typLabel[mat.typ]}>{typIcon[mat.typ]}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded font-medium">
                  {typLabel[mat.typ]}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  type="text"
                  value={mat.titel}
                  onChange={(e) => updateMaterial(mat.id, { titel: e.target.value })}
                  className="input-field text-sm font-medium"
                  placeholder="Titel"
                />
                {(mat.typ === 'pdf' || mat.typ === 'link') && (
                  <input
                    type="url"
                    value={mat.url ?? ''}
                    onChange={(e) => updateMaterial(mat.id, { url: e.target.value })}
                    className="input-field text-xs"
                    placeholder={mat.typ === 'pdf' ? 'PDF-URL oder Google-Drive-Link' : 'URL'}
                  />
                )}
                {mat.typ === 'text' && (
                  <textarea
                    value={mat.inhalt ?? ''}
                    onChange={(e) => updateMaterial(mat.id, { inhalt: e.target.value })}
                    className="input-field text-xs"
                    rows={3}
                    placeholder="Textinhalt..."
                  />
                )}
                {mat.typ === 'dateiUpload' && mat.dateiname && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {mat.dateiname}
                  </p>
                )}
                {mat.typ === 'videoEmbed' && mat.url && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {mat.url}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeMaterial(mat.id)}
                className="w-6 h-6 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer transition-colors shrink-0 mt-0.5"
                title="Entfernen"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Neues Material hinzufügen */}
      {!zeigHinzufuegen ? (
        <button
          onClick={() => setZeigHinzufuegen(true)}
          className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer w-full"
        >
          + Material hinzufügen
        </button>
      ) : (
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Titel">
              <input
                type="text"
                value={neuerTitel}
                onChange={(e) => setNeuerTitel(e.target.value)}
                placeholder="z.B. OR Art. 1–10"
                className="input-field"
                autoFocus
              />
            </Field>
            <Field label="Typ">
              <select
                value={neuerTyp}
                onChange={(e) => {
                  setNeuerTyp(e.target.value as PruefungsMaterial['typ'])
                  setUploadDatei(null)
                  setUploadFehler(null)
                }}
                className="input-field"
              >
                <option value="pdf">PDF-Link (eingebettet)</option>
                <option value="dateiUpload">Datei hochladen (PDF/Bild/Audio/Video)</option>
                <option value="videoEmbed">Video einbetten (YouTube/Vimeo/nanoo.tv)</option>
                <option value="text">Text (inline)</option>
                <option value="link">Link (extern)</option>
              </select>
            </Field>
          </div>

          {(neuerTyp === 'pdf' || neuerTyp === 'link') && (
            <Field label={neuerTyp === 'pdf' ? 'PDF-URL / Google-Drive-Link' : 'URL'}>
              <input
                type="url"
                value={neueUrl}
                onChange={(e) => setNeueUrl(e.target.value)}
                placeholder={neuerTyp === 'pdf' ? 'https://drive.google.com/file/d/...' : 'https://...'}
                className="input-field"
              />
            </Field>
          )}

          {neuerTyp === 'videoEmbed' && (
            <div className="space-y-1">
              <Field label="Video-URL (YouTube, Vimeo, nanoo.tv)">
                <input
                  type="url"
                  value={neueUrl}
                  onChange={(e) => { setNeueUrl(e.target.value); setEmbedUrlFehler('') }}
                  placeholder="https://www.youtube.com/watch?v=... oder https://vimeo.com/..."
                  className="input-field"
                />
              </Field>
              {embedUrlFehler && <p className="text-xs text-red-500">{embedUrlFehler}</p>}
            </div>
          )}

          {neuerTyp === 'text' && (
            <Field label="Inhalt">
              <textarea
                value={neuerInhalt}
                onChange={(e) => setNeuerInhalt(e.target.value)}
                placeholder="Gesetzestext, Formeln, etc."
                className="input-field"
                rows={5}
              />
            </Field>
          )}

          {neuerTyp === 'dateiUpload' && (
            <div className="space-y-2">
              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors
                  ${dragOver
                    ? 'border-slate-500 bg-slate-100 dark:bg-slate-700/50'
                    : 'border-slate-300 dark:border-slate-600'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,audio/*,video/*"
                  onChange={(e) => handleDateiWaehlen(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLaeuft}
                  className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Datei auswählen
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  PDF, Bild, Audio oder Video hierher ziehen — max. 10 MB
                </p>
              </div>

              {/* Gewählte Datei anzeigen */}
              {uploadDatei && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                  <span className="text-lg shrink-0" title={
                    uploadDatei.type.startsWith('image/') ? 'Bild'
                    : uploadDatei.type.startsWith('audio/') ? 'Audio'
                    : uploadDatei.type.startsWith('video/') ? 'Video'
                    : 'PDF'
                  }>
                    {uploadDatei.type.startsWith('image/') ? '🖼️'
                      : uploadDatei.type.startsWith('audio/') ? '🎵'
                      : uploadDatei.type.startsWith('video/') ? '🎬'
                      : '📄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{uploadDatei.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatGroesse(uploadDatei.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUploadDatei(null); setUploadFehler(null) }}
                    disabled={uploadLaeuft}
                    className="w-6 h-6 text-xs text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded cursor-pointer transition-colors shrink-0"
                    title="Datei entfernen"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Upload-Fehler */}
              {uploadFehler && (
                <p className="text-xs text-red-600 dark:text-red-400">{uploadFehler}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              disabled={uploadLaeuft}
              className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer disabled:opacity-40"
            >
              Abbrechen
            </button>
            {neuerTyp === 'dateiUpload' ? (
              <button
                onClick={handleUpload}
                disabled={!neuerTitel.trim() || !uploadDatei || uploadLaeuft}
                className="px-3 py-1.5 text-sm font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
              >
                {uploadLaeuft && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 dark:border-slate-800/30 border-t-white dark:border-t-slate-800 rounded-full animate-spin" />
                )}
                {uploadLaeuft ? 'Wird hochgeladen...' : 'Hochladen & hinzufügen'}
              </button>
            ) : (
              <button
                onClick={addMaterial}
                disabled={!neuerTitel.trim() || ((neuerTyp === 'pdf' || neuerTyp === 'link' || neuerTyp === 'videoEmbed') && !neueUrl.trim()) || (neuerTyp === 'text' && !neuerInhalt.trim())}
                className="px-3 py-1.5 text-sm font-medium text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Hinzufügen
              </button>
            )}
          </div>
        </div>
      )}
    </Section>
  )
}
