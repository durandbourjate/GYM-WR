import { useState, useRef, useCallback } from 'react'
import type { PruefungsConfig, PruefungsMaterial } from '../../../../types/pruefung.ts'
import { Section, Field, Toggle } from './ComposerUI.tsx'
import { apiService } from '../../../../services/apiService.ts'
import { parseVideoUrl } from '../../../../utils/mediaUtils.ts'
import { downloadSebDatei } from '../../../../utils/sebConfigGenerator.ts'
import { useStammdatenStore } from '../../../../store/stammdatenStore.ts'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  toggleFachbereich: (fb: string) => void
  /** Berechnete Gesamtpunkte aus Fragen (wenn verfügbar) */
  berechnetePunkte?: number
}

export default function ConfigTab({ pruefung, updatePruefung, toggleFachbereich, berechnetePunkte }: Props) {
  const { stammdaten } = useStammdatenStore()

  // Fachbereich-Optionen aus Stammdaten: alle Fachbereiche die in Fachschaften definiert sind
  const fachbereichOptionen = (() => {
    const tags: { name: string; farbe: string }[] = []
    for (const fs of stammdaten.fachschaften) {
      if (fs.fachbereichTags) {
        for (const t of fs.fachbereichTags) {
          if (!tags.some(existing => existing.name === t.name)) tags.push(t)
        }
      } else {
        // Fachschaft ohne Tags: Kürzel als Fachbereich
        if (!tags.some(existing => existing.name === fs.kuerzel)) {
          tags.push({ name: fs.kuerzel, farbe: '#6b7280' })
        }
      }
    }
    // Fallback wenn keine Stammdaten: VWL, BWL, Recht
    return tags.length > 0 ? tags : [
      { name: 'VWL', farbe: '#f97316' },
      { name: 'BWL', farbe: '#3b82f6' },
      { name: 'Recht', farbe: '#22c55e' },
    ]
  })()
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
              placeholder={pruefung.typ === 'formativ' ? 'z.B. Übung VWL — Markt' : 'z.B. Prüfung VWL/Recht — Markt & Verträge'}
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
              onChange={(e) => updatePruefung({ gefaess: e.target.value })}
              className="input-field"
            >
              <option value="SF">SF (Schwerpunktfach)</option>
              <option value="EF">EF (Ergänzungsfach)</option>
              <option value="EWR">EWR (Einführung W&R)</option>
              <option value="GF">GF (Grundlagenfach)</option>
            </select>
          </Field>

          <Field label="Zeitpunkt">
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

        {/* Fach */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
            Fach
          </label>
          <div className="flex gap-2 flex-wrap">
            {fachbereichOptionen.map((fb) => {
              const aktiv = pruefung.fachbereiche.includes(fb.name)
              return (
                <button
                  key={fb.name}
                  onClick={() => toggleFachbereich(fb.name)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                    aktiv
                      ? 'text-white font-medium'
                      : 'bg-slate-50 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                  }`}
                  style={aktiv ? { backgroundColor: fb.farbe + 'dd', borderColor: fb.farbe } : undefined}
                >
                  {fb.name}
                </button>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Prüfungsparameter */}
      <Section titel={pruefung.typ === 'formativ' ? 'Übungsparameter' : 'Prüfungsparameter'}>
        {/* Zeitmodus */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Zeitmodus</label>
          <div className="flex gap-1">
            {(['countdown', 'open-end'] as const).map((m) => (
              <button
                key={m}
                onClick={() => updatePruefung({ zeitModus: m })}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                  ${(pruefung.zeitModus ?? 'countdown') === m
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {m === 'countdown' ? 'Countdown' : 'Open-End'}
              </button>
            ))}
          </div>
          {(pruefung.zeitModus ?? 'countdown') === 'open-end' && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Kein Zeitlimit. Beenden Sie die {pruefung.typ === 'formativ' ? 'Übung' : 'Prüfung'} manuell im Monitoring.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(pruefung.zeitModus ?? 'countdown') !== 'open-end' && (
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
          )}

          {/* Typ-Dropdown ausgeblendet — wird automatisch über den Modus (Prüfen/Üben) gesetzt */}

          {pruefung.typ !== 'formativ' && (
          <Field label="Gesamtpunkte">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={berechnetePunkte ?? pruefung.gesamtpunkte}
                onChange={(e) => updatePruefung({ gesamtpunkte: parseInt(e.target.value) || 0 })}
                readOnly={berechnetePunkte !== undefined}
                min={0}
                className={`input-field ${berechnetePunkte !== undefined ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
              />
              {berechnetePunkte !== undefined && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">auto</span>
              )}
            </div>
          </Field>
          )}
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
          {pruefung.typ !== 'formativ' && (
            <>
              <Toggle
                label="SEB erforderlich"
                beschreibung="Prüfung nur im Safe Exam Browser erlaubt"
                aktiv={pruefung.sebErforderlich}
                onChange={(v) => updatePruefung({ sebErforderlich: v })}
              />
              {pruefung.sebErforderlich && (
                <button
                  type="button"
                  onClick={() => downloadSebDatei(pruefung.id, pruefung.titel)}
                  className="ml-8 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  📥 SEB-Datei herunterladen
                </button>
              )}
            </>
          )}
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

        {(pruefung.zeitModus ?? 'countdown') !== 'open-end' && (
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
        )}
      </Section>

      {/* Rechtschreibprüfung */}
      <Section titel="Rechtschreibprüfung">
        <div className="space-y-3">
          <Toggle
            label="Rechtschreibprüfung aktiviert"
            beschreibung="Browser-Rechtschreibkorrektur für Freitext-Eingaben (für Diktate deaktivieren)"
            aktiv={pruefung.rechtschreibpruefung !== false}
            onChange={(v) => updatePruefung({ rechtschreibpruefung: v })}
          />
          {pruefung.rechtschreibpruefung !== false && (
            <div className="ml-8">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Sprache
              </label>
              <select
                value={pruefung.rechtschreibSprache ?? 'de'}
                onChange={(e) => updatePruefung({ rechtschreibSprache: e.target.value as 'de' | 'fr' | 'en' | 'it' })}
                className="input-field w-48"
              >
                <option value="de">Deutsch (de)</option>
                <option value="fr">Français (fr)</option>
                <option value="en">English (en)</option>
                <option value="it">Italiano (it)</option>
              </select>
            </div>
          )}
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
    if ((neuerTyp === 'text' || neuerTyp === 'richtext') && !neuerInhalt.trim()) return
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
      ...(neuerTyp !== 'text' && neuerTyp !== 'richtext' ? { url: neueUrl.trim() } : {}),
      ...(neuerTyp === 'text' || neuerTyp === 'richtext' ? { inhalt: neuerInhalt.trim() } : {}),
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
      const email = (await import('../../../../store/authStore.ts')).useAuthStore.getState().user?.email
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
    richtext: 'Rich-Text',
    link: 'Link',
    dateiUpload: 'Datei',
    videoEmbed: 'Video',
  }

  const typIcon: Record<PruefungsMaterial['typ'], string> = {
    pdf: '📄',
    text: '📝',
    richtext: '🖹',
    link: '🔗',
    dateiUpload: '📎',
    videoEmbed: '🎬',
  }

  return (
    <Section titel="Materialien (Hilfsmittel)">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
        Referenzmaterialien für SuS (z.B. Gesetzestexte, Formeln, Nachschlagewerke).
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
                {mat.typ === 'richtext' && (
                  <textarea
                    value={mat.inhalt ?? ''}
                    onChange={(e) => updateMaterial(mat.id, { inhalt: e.target.value })}
                    className="input-field text-xs font-mono"
                    rows={4}
                    placeholder="<p>HTML-Inhalt...</p>"
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
                <option value="richtext">Rich-Text (formatierter Inhalt)</option>
                <option value="text">Text (inline, unformatiert)</option>
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

          {neuerTyp === 'richtext' && (
            <Field label="Rich-Text Inhalt (HTML)">
              <textarea
                value={neuerInhalt}
                onChange={(e) => setNeuerInhalt(e.target.value)}
                placeholder="<p>Formatierter <strong>HTML</strong>-Inhalt...</p>"
                className="input-field font-mono text-xs"
                rows={8}
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                HTML-Inhalt wird beim Anzeigen bereinigt und als formatierter Text dargestellt.
              </p>
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
                disabled={!neuerTitel.trim() || ((neuerTyp === 'pdf' || neuerTyp === 'link' || neuerTyp === 'videoEmbed') && !neueUrl.trim()) || ((neuerTyp === 'text' || neuerTyp === 'richtext') && !neuerInhalt.trim())}
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
