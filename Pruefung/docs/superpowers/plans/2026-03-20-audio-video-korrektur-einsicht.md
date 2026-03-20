# Audio/Video + Korrektur-Einsicht — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audio/Video-Anhänge in Fragen, Audio-Aufnahme im Korrektur-Dashboard, und SuS-Korrektur-Einsicht implementieren.

**Architecture:** Bestehende Anhänge-Infrastruktur (AnhangEditor → uploadAnhang → Drive) erweitern um Audio/Video/URL-Embeds. Neue MediaAnhang-Komponente als zentraler Medien-Renderer. Browser MediaRecorder API für Audio-Aufnahme. Neuer SuS-View für Korrektur-Einsicht mit Backend-Endpoints.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, MediaRecorder API, Google Drive API via Apps Script

**Spec:** `docs/superpowers/specs/2026-03-20-audio-video-korrektur-einsicht-design.md`

---

## Task 1: Types + Utils (Grundlagen)

**Files:**
- Modify: `src/types/fragen.ts:1-11` — FrageAnhang.url Feld
- Modify: `src/types/korrektur.ts:5-22,26-42,73-80` — Audio-Felder
- Modify: `src/types/pruefung.ts:44-49` — korrektur.freigegeben
- Create: `src/utils/mediaUtils.ts`

- [ ] **Step 1: FrageAnhang erweitern**

In `src/types/fragen.ts`, `url` Feld hinzufügen:

```ts
export interface FrageAnhang {
  id: string
  dateiname: string
  mimeType: string
  groesseBytes: number
  driveFileId: string
  beschreibung?: string
  bildGroesse?: 'klein' | 'mittel' | 'gross'
  url?: string  // YouTube/Vimeo/nanoo.tv URL (nur bei URL-Embeds)
}
```

- [ ] **Step 2: korrektur.ts erweitern**

`audioKommentarId` zu `FragenBewertung` (nach `geprueft`), `audioGesamtkommentarId` zu `SchuelerKorrektur` (nach `feedbackGesendet`), `audioKommentarId` zu `KorrekturZeileUpdate` (nach `geprueft`):

```ts
// In FragenBewertung:
  geprueft: boolean
  audioKommentarId?: string  // Drive-File-ID des Audio-Kommentars

// In SchuelerKorrektur:
  feedbackGesendet?: string
  audioGesamtkommentarId?: string  // Drive-File-ID des Gesamt-Audio-Kommentars

// In KorrekturZeileUpdate:
  geprueft?: boolean
  audioKommentarId?: string | null  // null = entfernen
```

- [ ] **Step 3: pruefung.ts erweitern**

`freigegeben` zu `korrektur`-Objekt in PruefungsConfig:

```ts
  korrektur: {
    aktiviert: boolean;
    modus: 'sofort' | 'batch';
    systemPrompt?: string;
    freigegeben?: boolean;  // Default: false
  };
```

- [ ] **Step 4: mediaUtils.ts erstellen**

```ts
// Grössenlimits
export const MAX_GROESSE_STANDARD = 5 * 1024 * 1024  // 5 MB (Bild/PDF/Audio)
export const MAX_GROESSE_VIDEO = 25 * 1024 * 1024     // 25 MB (Video)

export function maxGroesseFuerMimeType(mimeType: string): number {
  return mimeType.startsWith('video/') ? MAX_GROESSE_VIDEO : MAX_GROESSE_STANDARD
}

export function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// MIME-Type Helpers
export function istBild(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function istAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function istVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/') && mimeType !== 'video/embed'
}

export function istEmbed(mimeType: string): boolean {
  return mimeType === 'video/embed'
}

export function istPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

// Akzeptierte MIME-Types für Datei-Upload
export const AKZEPTIERTE_MIME_TYPES = 'image/*,application/pdf,audio/*,video/*'

// URL-Parsing
export interface EmbedInfo {
  plattform: 'youtube' | 'vimeo' | 'nanoo' | 'unbekannt'
  embedUrl: string
  titel: string
}

export function parseVideoUrl(url: string): EmbedInfo | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (ytMatch) {
    return {
      plattform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      titel: `YouTube Video ${ytMatch[1]}`,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return {
      plattform: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      titel: `Vimeo Video ${vimeoMatch[1]}`,
    }
  }

  // nanoo.tv (generisch)
  if (url.includes('nanoo.tv')) {
    // nanoo.tv Embed: URL direkt als iframe verwenden
    const embedUrl = url.includes('/link/') ? url.replace('/link/', '/embed/') : url
    return {
      plattform: 'nanoo',
      embedUrl,
      titel: 'nanoo.tv Video',
    }
  }

  return null
}

// Drive-URLs für Medien
export function driveStreamUrl(driveFileId: string): string {
  return `https://drive.google.com/uc?id=${driveFileId}&export=download`
}

export function drivePreviewUrl(driveFileId: string): string {
  return `https://drive.google.com/file/d/${driveFileId}/preview`
}

export function driveViewUrl(driveFileId: string): string {
  return `https://drive.google.com/file/d/${driveFileId}/view`
}
```

- [ ] **Step 5: Build prüfen**

Run: `cd Pruefung && npm run build`
Expected: Erfolgreich (keine Breaking Changes, alle neuen Felder optional)

- [ ] **Step 6: Commit**

```bash
git add src/types/fragen.ts src/types/korrektur.ts src/types/pruefung.ts src/utils/mediaUtils.ts
git commit -m "Audio/Video Types + mediaUtils: Typ-Erweiterungen und URL-Parsing"
```

---

## Task 2: MediaAnhang-Komponente (zentraler Medien-Renderer)

**Files:**
- Create: `src/components/MediaAnhang.tsx`
- Modify: `src/components/FrageAnhaenge.tsx` (96 Z.) — nutzt MediaAnhang
- Modify: `src/components/lp/composer/VorschauTab.tsx:394-445` — AnhangBilder → AnhangMedien

- [ ] **Step 1: MediaAnhang.tsx erstellen**

Zentraler Renderer für alle Medientypen. Wird von FrageAnhaenge, VorschauTab und KorrekturEinsicht verwendet:

```tsx
import { useState } from 'react'
import type { FrageAnhang } from '../types/fragen.ts'
import { istBild, istAudio, istVideo, istEmbed, istPDF, driveStreamUrl, drivePreviewUrl, driveViewUrl } from '../utils/mediaUtils.ts'

interface Props {
  anhang: FrageAnhang
  /** Bildgrösse für Thumbnails (nur bei Bildern) */
  bildSz?: string
  /** Lightbox-Callback (nur bei Bildern) */
  onLightbox?: (id: string) => void
}

export default function MediaAnhang({ anhang, bildSz = 'w400', onLightbox }: Props) {
  const [fehler, setFehler] = useState(false)

  if (fehler) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm text-slate-500 dark:text-slate-400">
        Medium konnte nicht geladen werden.{' '}
        {anhang.driveFileId && (
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700 dark:hover:text-slate-200"
          >
            In Drive öffnen
          </a>
        )}
      </div>
    )
  }

  // Bild
  if (istBild(anhang.mimeType)) {
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${anhang.driveFileId}&sz=${bildSz}`
    return (
      <div className="group">
        <button
          type="button"
          onClick={() => onLightbox?.(anhang.id)}
          className="block w-full cursor-pointer"
          title={anhang.beschreibung || anhang.dateiname}
        >
          <img
            src={thumbnailUrl}
            alt={anhang.beschreibung || anhang.dateiname}
            className="max-w-full rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm group-hover:shadow-md transition-shadow"
            loading="lazy"
            onError={() => setFehler(true)}
          />
        </button>
        {anhang.beschreibung && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{anhang.beschreibung}</p>
        )}
      </div>
    )
  }

  // Audio
  if (istAudio(anhang.mimeType)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <audio
          controls
          preload="metadata"
          className="w-full"
          onError={() => setFehler(true)}
        >
          <source src={driveStreamUrl(anhang.driveFileId)} type={anhang.mimeType} />
        </audio>
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">🎵 {anhang.dateiname}</span>
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-2"
          >
            Öffnen
          </a>
        </div>
      </div>
    )
  }

  // Video-Embed (YouTube/Vimeo/nanoo)
  if (istEmbed(anhang.mimeType) && anhang.url) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={anhang.url}
            title={anhang.beschreibung || anhang.dateiname}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onError={() => setFehler(true)}
          />
        </div>
        {anhang.beschreibung && (
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30">
            <span className="text-xs text-slate-600 dark:text-slate-300 italic">{anhang.beschreibung}</span>
          </div>
        )}
      </div>
    )
  }

  // Video (Drive-Upload)
  if (istVideo(anhang.mimeType)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={drivePreviewUrl(anhang.driveFileId)}
            title={anhang.dateiname}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">🎬 {anhang.dateiname}</span>
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-2"
          >
            Öffnen
          </a>
        </div>
      </div>
    )
  }

  // PDF (wie bisher)
  if (istPDF(anhang.mimeType)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <iframe
          src={drivePreviewUrl(anhang.driveFileId)}
          title={anhang.dateiname}
          className="w-full h-64 border-0"
          allow="autoplay"
        />
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">📄 {anhang.dateiname}</span>
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-2"
          >
            Öffnen
          </a>
        </div>
      </div>
    )
  }

  // Unbekannter Typ: Fallback
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm text-slate-500">
      📎 {anhang.dateiname}
      {anhang.driveFileId && (
        <a href={driveViewUrl(anhang.driveFileId)} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
          Öffnen
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 2: FrageAnhaenge.tsx refactoren**

Ersetze die gesamte Rendering-Logik durch `MediaAnhang`. Lightbox bleibt erhalten:

```tsx
import { useState } from 'react'
import type { FrageAnhang } from '../types/fragen.ts'
import { driveViewUrl } from '../utils/mediaUtils.ts'
import MediaAnhang from './MediaAnhang.tsx'

interface Props {
  anhaenge: FrageAnhang[]
}

export default function FrageAnhaenge({ anhaenge }: Props) {
  const [lightboxId, setLightboxId] = useState<string | null>(null)

  if (!anhaenge || anhaenge.length === 0) return null

  const lightboxAnhang = lightboxId ? anhaenge.find((a) => a.id === lightboxId) : null

  return (
    <>
      <div className="space-y-3 mt-3">
        {anhaenge.map((a) => (
          <MediaAnhang
            key={a.id}
            anhang={a}
            bildSz="w800"
            onLightbox={setLightboxId}
          />
        ))}
      </div>

      {/* Lightbox (nur Bilder) */}
      {lightboxAnhang && lightboxAnhang.mimeType.startsWith('image/') && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setLightboxId(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxId(null)}
            className="absolute top-4 right-4 w-10 h-10 text-white text-2xl bg-black/40 rounded-full hover:bg-black/60 transition-colors cursor-pointer flex items-center justify-center"
            title="Schliessen"
          >
            ×
          </button>
          <img
            src={`https://drive.google.com/thumbnail?id=${lightboxAnhang.driveFileId}&sz=w1600`}
            alt={lightboxAnhang.beschreibung || lightboxAnhang.dateiname}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: VorschauTab AnhangBilder → AnhangMedien**

In `VorschauTab.tsx`, die `AnhangBilder` Funktion (ca. Zeile 394-445) durch `AnhangMedien` ersetzen, die `MediaAnhang` nutzt. Nicht mehr nur Bilder filtern, sondern alle Anhänge anzeigen:

```tsx
// Import hinzufügen (oben):
import MediaAnhang from '../../MediaAnhang.tsx'

// AnhangBilder-Funktion ersetzen durch:
function AnhangMedien({ anhaenge }: { anhaenge: FrageAnhang[] }) {
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  if (!anhaenge || anhaenge.length === 0) return null

  const lightboxAnhang = lightboxId ? anhaenge.find((a) => a.id === lightboxId) : null

  return (
    <>
      <div className="space-y-2 mt-2">
        {anhaenge.map((a) => (
          <MediaAnhang
            key={a.id}
            anhang={a}
            bildSz={a.bildGroesse === 'klein' ? 'w200' : a.bildGroesse === 'gross' ? 'w800' : 'w400'}
            onLightbox={setLightboxId}
          />
        ))}
      </div>
      {lightboxAnhang && lightboxAnhang.mimeType.startsWith('image/') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setLightboxId(null)}>
          <button type="button" onClick={() => setLightboxId(null)} className="absolute top-4 right-4 w-10 h-10 text-white text-2xl bg-black/40 rounded-full hover:bg-black/60 cursor-pointer flex items-center justify-center" title="Schliessen">×</button>
          <img
            src={`https://drive.google.com/thumbnail?id=${lightboxAnhang.driveFileId}&sz=w800`}
            alt={lightboxAnhang.beschreibung || lightboxAnhang.dateiname}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
```

Alle Aufrufe von `<AnhangBilder` zu `<AnhangMedien` umbenennen. `AnhangBild`-Funktion entfernen (nicht mehr nötig).

- [ ] **Step 4: Build prüfen**

Run: `cd Pruefung && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/MediaAnhang.tsx src/components/FrageAnhaenge.tsx src/components/lp/composer/VorschauTab.tsx
git commit -m "MediaAnhang: Zentraler Medien-Renderer für Audio/Video/Bild/PDF/Embed"
```

---

## Task 3: AnhangEditor erweitern (Audio/Video/URL-Upload)

**Files:**
- Modify: `src/components/lp/frageneditor/AnhangEditor.tsx` (205 Z.)

- [ ] **Step 1: MIME-Filter und Grössenlimits anpassen**

Konstanten oben ersetzen:

```ts
// ALT:
const MAX_ANHAENGE = 5
const MAX_GROESSE = 5 * 1024 * 1024 // 5 MB

// NEU:
import { maxGroesseFuerMimeType, formatGroesse, AKZEPTIERTE_MIME_TYPES, parseVideoUrl } from '../../../utils/mediaUtils.ts'
import type { EmbedInfo } from '../../../utils/mediaUtils.ts'

const MAX_ANHAENGE = 5
```

`istBild`-Helper entfernen (kommt jetzt aus mediaUtils). `formatGroesse`-Helper entfernen (kommt aus mediaUtils).

- [ ] **Step 2: Validierung in handleDateiAuswahl anpassen**

MIME-Typ-Check und Grössenlimit dynamisch machen:

```ts
// ALT:
if (datei.size > MAX_GROESSE) { ... }
if (!datei.type.startsWith('image/') && datei.type !== 'application/pdf') { ... }

// NEU:
const maxGroesse = maxGroesseFuerMimeType(datei.type)
if (datei.size > maxGroesse) {
  setFehler(`Datei zu gross (max. ${formatGroesse(maxGroesse)})`)
  return
}
const erlaubt = datei.type.startsWith('image/') || datei.type === 'application/pdf'
  || datei.type.startsWith('audio/') || datei.type.startsWith('video/')
if (!erlaubt) {
  setFehler('Nur Bilder, PDFs, Audio und Video erlaubt')
  return
}
```

- [ ] **Step 3: accept-Attribut aktualisieren**

```tsx
// ALT:
accept="image/*,application/pdf"

// NEU:
accept={AKZEPTIERTE_MIME_TYPES}
```

- [ ] **Step 4: URL-Einbettung UI hinzufügen**

Neuen State `urlEingabe` und `urlModus` hinzufügen. Button "+ URL einbetten" neben dem Upload-Button. Bei Klick: Textfeld + Hinzufügen-Button anzeigen:

```tsx
const [urlModus, setUrlModus] = useState(false)
const [urlEingabe, setUrlEingabe] = useState('')
const [urlFehler, setUrlFehler] = useState('')

function handleUrlHinzufuegen() {
  const info = parseVideoUrl(urlEingabe.trim())
  if (!info) {
    setUrlFehler('URL nicht erkannt. Unterstützt: YouTube, Vimeo, nanoo.tv')
    return
  }
  if (anhaenge.length + neueAnhaenge.length >= MAX_ANHAENGE) {
    setUrlFehler(`Maximal ${MAX_ANHAENGE} Anhänge`)
    return
  }
  const embed: FrageAnhang = {
    id: `embed-${Date.now()}`,
    dateiname: info.titel,
    mimeType: 'video/embed',
    groesseBytes: 0,
    driveFileId: '',
    url: info.embedUrl,
    beschreibung: info.plattform === 'youtube' ? 'YouTube' : info.plattform === 'vimeo' ? 'Vimeo' : 'nanoo.tv',
  }
  onUrlAnhangHinzu(embed)  // Neuer Callback (Props erweitern!)
  setUrlEingabe('')
  setUrlModus(false)
  setUrlFehler('')
}
```

Props-Interface erweitern um `onUrlAnhangHinzu: (anhang: FrageAnhang) => void`.

UI: Buttons-Reihe am Ende, nach dem Drag&Drop-Bereich:

```tsx
<div className="flex gap-2 mt-2">
  {/* Bestehender Upload-Button */}
  <button type="button" onClick={() => inputRef.current?.click()} className="...">
    + Datei hochladen
  </button>
  <button type="button" onClick={() => setUrlModus(!urlModus)} className="...">
    + URL einbetten
  </button>
</div>

{urlModus && (
  <div className="mt-2 flex gap-2">
    <input
      type="url"
      value={urlEingabe}
      onChange={(e) => { setUrlEingabe(e.target.value); setUrlFehler('') }}
      placeholder="YouTube, Vimeo oder nanoo.tv URL"
      className="flex-1 text-sm border rounded px-2 py-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
    />
    <button type="button" onClick={handleUrlHinzufuegen} className="text-sm px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-700">
      Hinzufügen
    </button>
  </div>
)}
{urlFehler && <p className="text-xs text-red-500 mt-1">{urlFehler}</p>}
```

- [ ] **Step 5: FragenEditor.tsx anpassen**

`AnhangEditor` erhält neuen `onUrlAnhangHinzu`-Prop. In `FragenEditor.tsx` den Callback implementieren: URL-Embeds direkt zur `anhaenge`-Liste der Frage hinzufügen (kein Upload nötig).

- [ ] **Step 6: Build prüfen**

Run: `cd Pruefung && npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/components/lp/frageneditor/AnhangEditor.tsx src/components/lp/frageneditor/FragenEditor.tsx
git commit -m "AnhangEditor: Audio/Video-Upload + URL-Einbettung (YouTube/Vimeo/nanoo)"
```

---

## Task 4: Audio-Recording Hook + Komponenten

**Files:**
- Create: `src/hooks/useAudioRecorder.ts`
- Create: `src/components/AudioPlayer.tsx`
- Create: `src/components/AudioRecorder.tsx`

- [ ] **Step 1: useAudioRecorder Hook erstellen**

```ts
import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioRecorderState {
  status: 'idle' | 'recording' | 'preview' | 'uploading' | 'done' | 'fehler'
  audioBlob: Blob | null
  audioUrl: string | null
  dauer: number       // Sekunden
  fehler: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  verwerfen: () => void
}

export function useAudioRecorder(): AudioRecorderState {
  const [status, setStatus] = useState<AudioRecorderState['status']>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [dauer, setDauer] = useState(0)
  const [fehler, setFehler] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startZeitRef = useRef<number>(0)

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      setFehler(null)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Format: WebM/Opus (Chrome/Firefox) oder MP4 (Safari)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setStatus('preview')

        // Stream stoppen
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }

      recorder.start(1000) // Chunks alle 1s
      startZeitRef.current = Date.now()
      setStatus('recording')

      // Timer für Dauer-Anzeige
      timerRef.current = setInterval(() => {
        setDauer(Math.floor((Date.now() - startZeitRef.current) / 1000))
      }, 500)
    } catch (err) {
      const msg = err instanceof Error && err.name === 'NotAllowedError'
        ? 'Mikrofon-Zugriff wurde verweigert. Bitte Berechtigung erteilen.'
        : 'Mikrofon konnte nicht gestartet werden.'
      setFehler(msg)
      setStatus('fehler')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const verwerfen = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDauer(0)
    setStatus('idle')
  }, [audioUrl])

  return { status, audioBlob, audioUrl, dauer, fehler, startRecording, stopRecording, verwerfen }
}
```

- [ ] **Step 2: AudioPlayer.tsx erstellen**

Wiederverwendbarer Mini-Player:

```tsx
import { useRef, useState } from 'react'

interface Props {
  src: string
  /** Kompakt-Modus (kleiner, inline) */
  kompakt?: boolean
}

export default function AudioPlayer({ src, kompakt = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [spielt, setSpielt] = useState(false)
  const [dauer, setDauer] = useState(0)
  const [position, setPosition] = useState(0)

  function togglePlay() {
    if (!audioRef.current) return
    if (spielt) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  function formatZeit(s: number): string {
    const min = Math.floor(s / 60)
    const sek = Math.floor(s % 60)
    return `${min}:${sek.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center gap-2 ${kompakt ? 'text-xs' : 'text-sm'}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDauer(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setPosition(audioRef.current?.currentTime || 0)}
        onPlay={() => setSpielt(true)}
        onPause={() => setSpielt(false)}
        onEnded={() => { setSpielt(false); setPosition(0) }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`${kompakt ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors cursor-pointer`}
        title={spielt ? 'Pause' : 'Abspielen'}
      >
        {spielt ? '⏸' : '▶'}
      </button>
      <span className="text-slate-500 dark:text-slate-400 tabular-nums min-w-[3rem]">
        {formatZeit(position)} / {formatZeit(dauer)}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: AudioRecorder.tsx erstellen**

Record-UI mit Status, Preview und Upload-Callback:

```tsx
import { useAudioRecorder } from '../hooks/useAudioRecorder.ts'
import AudioPlayer from './AudioPlayer.tsx'

interface Props {
  /** Wird aufgerufen wenn Aufnahme gespeichert werden soll */
  onSpeichern: (blob: Blob) => Promise<void>
  /** Bestehende Audio-File-ID (zum Anzeigen eines Players) */
  bestehendeAudioId?: string
  kompakt?: boolean
}

export default function AudioRecorder({ onSpeichern, bestehendeAudioId, kompakt = false }: Props) {
  const { status, audioUrl, dauer, fehler, startRecording, stopRecording, verwerfen } = useAudioRecorder()
  const [speichert, setSpeichert] = useState(false)

  async function handleSpeichern() {
    // audioBlob aus dem Hook holen — da useAudioRecorder den Blob im State hat,
    // brauchen wir ihn hier via dem Hook-Return
    // Wir nutzen audioUrl um ein Blob zu erstellen — NEIN, besser:
    // Wir erweitern den onSpeichern-Aufruf
    // Eigentlich brauchen wir den Blob direkt...
    // -> Lösung: audioBlob kommt aus useAudioRecorder
  }

  // Bestehender Audio-Kommentar
  if (status === 'idle' && bestehendeAudioId) {
    return (
      <div className="flex items-center gap-2">
        <AudioPlayer
          src={`https://drive.google.com/uc?id=${bestehendeAudioId}&export=download`}
          kompakt={kompakt}
        />
        <button
          type="button"
          onClick={startRecording}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
          title="Neue Aufnahme"
        >
          Ersetzen
        </button>
      </div>
    )
  }

  // Idle: Mikrofon-Button
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        className={`${kompakt ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'} flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors cursor-pointer`}
        title="Audio-Kommentar aufnehmen"
      >
        🎤
      </button>
    )
  }

  // Recording: Pulsierender Indikator
  if (status === 'recording') {
    return (
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-red-600 dark:text-red-400 tabular-nums">
          {Math.floor(dauer / 60)}:{(dauer % 60).toString().padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={stopRecording}
          className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
        >
          Stopp
        </button>
      </div>
    )
  }

  // Preview: Player + Speichern/Verwerfen
  if (status === 'preview' && audioUrl) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <AudioPlayer src={audioUrl} kompakt={kompakt} />
        <button
          type="button"
          onClick={async () => {
            setSpeichert(true)
            // Blob holen über fetch des Object-URL
            const resp = await fetch(audioUrl)
            const blob = await resp.blob()
            await onSpeichern(blob)
            verwerfen()
            setSpeichert(false)
          }}
          disabled={speichert}
          className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
        >
          {speichert ? 'Speichert...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={verwerfen}
          disabled={speichert}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 underline cursor-pointer"
        >
          Verwerfen
        </button>
      </div>
    )
  }

  // Fehler
  if (status === 'fehler') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-500">{fehler}</span>
        <button type="button" onClick={startRecording} className="text-xs underline text-slate-500 cursor-pointer">
          Erneut versuchen
        </button>
      </div>
    )
  }

  return null
}
```

Hinweis: `useState` Import in AudioRecorder fehlt — bei der Implementierung ergänzen.

- [ ] **Step 4: Build prüfen**

Run: `cd Pruefung && npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAudioRecorder.ts src/components/AudioPlayer.tsx src/components/AudioRecorder.tsx
git commit -m "Audio-Recording: useAudioRecorder Hook + AudioPlayer + AudioRecorder Komponenten"
```

---

## Task 5: Audio-Recording in KorrekturDashboard integrieren

**Files:**
- Modify: `src/components/lp/KorrekturFrageZeile.tsx` (178 Z.) — Mikrofon-Button pro Frage
- Modify: `src/components/lp/KorrekturSchuelerZeile.tsx` (290 Z.) — Gesamt-Audio-Kommentar
- Modify: `src/services/apiService.ts` — Upload-Helper für Audio-Blobs

- [ ] **Step 1: apiService um uploadAudioKommentar erweitern**

Neuer Helper in `apiService.ts` der einen Blob als Base64 hochlädt:

```ts
async uploadAudioKommentar(email: string, pruefungId: string, schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      const mimeType = blob.type || 'audio/webm'
      const dateiname = `audio_${pruefungId}_${schuelerEmail}_${frageId}_${Date.now()}.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'uploadAnhang',
            email,
            frageId: `korrektur-${pruefungId}`,
            dateiname,
            mimeType,
            groesseBytes: blob.size,
            base64Data: base64,
          }),
        })
        const text = await response.text()
        const data = JSON.parse(text)
        if (data.success && data.anhang) {
          resolve(data.anhang.driveFileId)
        } else {
          resolve(null)
        }
      } catch {
        resolve(null)
      }
    }
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 2: KorrekturFrageZeile erweitern**

Import hinzufügen:
```ts
import AudioRecorder from '../../AudioRecorder.tsx'
import AudioPlayer from '../../AudioPlayer.tsx'
```

Props erweitern:
```ts
interface Props {
  // ... bestehend ...
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null }) => void
  onAudioUpload: (frageId: string, blob: Blob) => Promise<string | null>  // NEU
}
```

Nach dem Kommentar-Textarea (ca. Zeile 149) den AudioRecorder einfügen:

```tsx
<div className="mt-2">
  <AudioRecorder
    bestehendeAudioId={bewertung.audioKommentarId}
    kompakt
    onSpeichern={async (blob) => {
      const driveId = await onAudioUpload(frageId, blob)
      if (driveId) {
        onUpdate({ audioKommentarId: driveId })
      }
    }}
  />
</div>
```

- [ ] **Step 3: KorrekturSchuelerZeile erweitern**

Import hinzufügen und AudioRecorder nach dem Gesamt-Kommentar-Bereich einfügen. Props um `onAudioUpload` erweitern und durch an KorrekturFrageZeile weiterreichen.

Zusätzlich: Gesamt-Audio-Kommentar nach der Noten-Override-Section:

```tsx
<div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
  <span className="text-xs text-slate-500 dark:text-slate-400">Audio-Gesamtkommentar:</span>
  <div className="mt-1">
    <AudioRecorder
      bestehendeAudioId={schueler.audioGesamtkommentarId}
      onSpeichern={async (blob) => {
        const driveId = await onAudioUpload('gesamt', blob)
        if (driveId) {
          onGesamtAudioUpdate(schueler.email, driveId)
        }
      }}
    />
  </div>
</div>
```

Props um `onGesamtAudioUpdate: (email: string, audioId: string) => void` erweitern.

- [ ] **Step 4: KorrekturDashboard Callbacks ergänzen**

In `KorrekturDashboard.tsx` den `handleAudioUpload` und `handleGesamtAudioUpdate` implementieren und an `KorrekturSchuelerZeile` weitergeben:

```ts
const handleAudioUpload = useCallback(async (schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> => {
  const user = useAuthStore.getState().user
  if (!user || !pruefungId) return null
  return apiService.uploadAudioKommentar(user.email, pruefungId, schuelerEmail, frageId, blob)
}, [pruefungId])

const handleGesamtAudioUpdate = useCallback(async (email: string, audioId: string) => {
  // Über speichereKorrekturZeile oder neuen Endpoint speichern
  if (!pruefungId) return
  const user = useAuthStore.getState().user
  if (!user) return
  await apiService.speichereKorrekturZeile({
    pruefungId,
    schuelerEmail: email,
    frageId: '_gesamt',
    audioKommentarId: audioId,
  }, user.email)
}, [pruefungId])
```

- [ ] **Step 5: Build prüfen**

Run: `cd Pruefung && npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturSchuelerZeile.tsx src/components/lp/KorrekturDashboard.tsx src/services/apiService.ts
git commit -m "Audio-Korrektur: Mikrofon-Aufnahme + Player im KorrekturDashboard"
```

---

## Task 6: Backend-Endpoints (Apps Script)

**Files:**
- Modify: `apps-script-code.js` — 3 neue Endpoints

- [ ] **Step 1: korrekturFreigeben Endpoint**

In der `doPost`-Funktion neuen Case hinzufügen:

```js
case 'korrekturFreigeben': {
  const { pruefungId, freigegeben, email } = daten
  // LP-Check
  if (!email.endsWith('@gymhofwil.ch') || email.includes('@stud.')) {
    return antwort({ success: false, fehler: 'Nur für Lehrpersonen' })
  }
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Configs')
  // Config-Zeile finden und korrektur.freigegeben setzen
  const configs = configSheet.getDataRange().getValues()
  const header = configs[0]
  const configCol = header.indexOf('config')
  for (let i = 1; i < configs.length; i++) {
    try {
      const config = JSON.parse(configs[i][configCol])
      if (config.id === pruefungId) {
        config.korrektur = config.korrektur || {}
        config.korrektur.freigegeben = freigegeben
        configSheet.getRange(i + 1, configCol + 1).setValue(JSON.stringify(config))
        return antwort({ success: true })
      }
    } catch (e) { continue }
  }
  return antwort({ success: false, fehler: 'Prüfung nicht gefunden' })
}
```

- [ ] **Step 2: ladeKorrekturenFuerSuS Endpoint**

In der `doGet`-Funktion oder `doPost`:

```js
case 'ladeKorrekturenFuerSuS': {
  const { schuelerEmail } = daten
  const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Configs')
  const korrekturSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Korrekturen')
  const configs = configSheet.getDataRange().getValues()
  const header = configs[0]
  const configCol = header.indexOf('config')

  const ergebnis = []
  for (let i = 1; i < configs.length; i++) {
    try {
      const config = JSON.parse(configs[i][configCol])
      if (!config.korrektur?.freigegeben) continue

      // Korrektur-Daten für diesen SuS laden
      // ... (SuS-spezifische Daten aus Korrekturen-Sheet filtern)
      ergebnis.push({
        pruefungId: config.id,
        titel: config.titel,
        datum: config.datum,
        klasse: config.klasse,
        // note und punkte aus Korrektur-Daten
      })
    } catch (e) { continue }
  }
  return antwort({ success: true, korrekturen: ergebnis })
}
```

- [ ] **Step 3: ladeKorrekturDetail Endpoint**

Gibt Fragen + Antworten + Bewertungen für einen einzelnen SuS zurück. Prüft `korrektur.freigegeben === true`.

- [ ] **Step 4: Commit**

```bash
git add apps-script-code.js
git commit -m "Backend: korrekturFreigeben, ladeKorrekturenFuerSuS, ladeKorrekturDetail Endpoints"
```

**WICHTIG:** Nach diesem Commit: User muss den Code in den Apps Script Editor kopieren und neue Bereitstellung erstellen.

---

## Task 7: SuS-Korrektur-Einsicht (Frontend)

**Files:**
- Create: `src/components/sus/KorrekturListe.tsx`
- Create: `src/components/sus/KorrekturEinsicht.tsx`
- Modify: `src/services/apiService.ts` — 2 neue Endpoints
- Modify: `src/App.tsx` (216 Z.) — Routing

- [ ] **Step 1: apiService-Endpoints hinzufügen**

```ts
async ladeKorrekturenFuerSuS(email: string): Promise<KorrekturListeEintrag[] | null> {
  // POST mit action: 'ladeKorrekturenFuerSuS'
}

async ladeKorrekturDetail(pruefungId: string, email: string): Promise<KorrekturDetailDaten | null> {
  // POST mit action: 'ladeKorrekturDetail'
}

async korrekturFreigeben(pruefungId: string, freigegeben: boolean, email: string): Promise<boolean> {
  // POST mit action: 'korrekturFreigeben'
}
```

Typen definieren (in apiService oder eigene Datei):

```ts
interface KorrekturListeEintrag {
  pruefungId: string
  titel: string
  datum: string
  klasse: string
  gesamtPunkte: number
  maxPunkte: number
  note?: number
}

interface KorrekturDetailDaten {
  config: PruefungsConfig
  fragen: Frage[]
  antworten: Record<string, Antwort>
  bewertungen: Record<string, FragenBewertung>
  gesamtPunkte: number
  maxPunkte: number
  note?: number
  audioGesamtkommentarId?: string
}
```

- [ ] **Step 2: KorrekturListe.tsx erstellen**

Liste der freigegebenen Korrekturen:

```tsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import { formatDatum } from '../../utils/zeit.ts'
import ThemeToggle from '../ThemeToggle.tsx'

// Zeigt Liste freigegebener Korrekturen für SuS
export default function KorrekturListe({ onWaehle }: { onWaehle: (pruefungId: string) => void }) {
  // Lädt korrekturen via apiService.ladeKorrekturenFuerSuS
  // Zeigt Cards mit Titel, Datum, Note, Punkte
  // Klick → onWaehle(pruefungId)
}
```

- [ ] **Step 3: KorrekturEinsicht.tsx erstellen**

SuS-View einer einzelnen korrigierten Prüfung:

```tsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import MediaAnhang from '../MediaAnhang.tsx'
import AudioPlayer from '../AudioPlayer.tsx'
import { formatDatum } from '../../utils/zeit.ts'

// Read-only Ansicht der Korrektur für SuS
export default function KorrekturEinsicht({ pruefungId, onZurueck }: { pruefungId: string; onZurueck: () => void }) {
  // Lädt Detail via apiService.ladeKorrekturDetail
  // Zeigt: Header (Titel, Datum, Note, Punkte, Gesamtkommentar + Audio)
  // Pro Frage: Fragetext, Anhänge, Antwort (read-only), Bewertung (Punkte, Kommentar, Audio)
  // Symbole: ✓ (volle Punkte), ~ (Teilpunkte), ✗ (0 Punkte)
}
```

- [ ] **Step 4: App.tsx Routing erweitern**

SuS ohne `?id=` → KorrekturListe statt Demo-Prüfung. State für gewählte Korrektur:

```tsx
// Neue Imports:
import KorrekturListe from './components/sus/KorrekturListe.tsx'
import KorrekturEinsicht from './components/sus/KorrekturEinsicht.tsx'

// In der SuS-Logik (ca. Zeile 70-87):
const [korrekturId, setKorrekturId] = useState<string | null>(null)

// Wenn SuS, kein ?id=, und korrekturId gesetzt:
if (korrekturId) {
  return <KorrekturEinsicht pruefungId={korrekturId} onZurueck={() => setKorrekturId(null)} />
}

// Wenn SuS, kein ?id=:
if (!pruefungId) {
  return <KorrekturListe onWaehle={setKorrekturId} />
}
```

- [ ] **Step 5: KorrekturDashboard — "Freigeben"-Button**

In `KorrekturDashboard.tsx` Header-Bereich (ca. Zeile 265-315) einen Toggle-Button hinzufügen:

```tsx
<button
  type="button"
  onClick={async () => {
    const neuerWert = !korrekturFreigegeben
    const ok = await apiService.korrekturFreigeben(pruefungId, neuerWert, user.email)
    if (ok) setKorrekturFreigegeben(neuerWert)
  }}
  className={`text-sm px-3 py-1 rounded ${korrekturFreigegeben ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'}`}
>
  {korrekturFreigegeben ? '✓ Freigegeben' : 'Korrektur freigeben'}
</button>
```

State `korrekturFreigegeben` aus den geladenen Config-Daten initialisieren.

- [ ] **Step 6: Build prüfen**

Run: `cd Pruefung && npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/components/sus/ src/services/apiService.ts src/App.tsx src/components/lp/KorrekturDashboard.tsx
git commit -m "SuS-Korrektur-Einsicht: KorrekturListe + KorrekturEinsicht + Freigabe-Toggle"
```

---

## Task 8: HANDOFF.md aktualisieren + Finaler Build

**Files:**
- Modify: `Pruefung/HANDOFF.md`

- [ ] **Step 1: HANDOFF.md aktualisieren**

Neue Features in die Feature-Tabelle eintragen. "Offen"-Liste aktualisieren (Audio/Video entfernen). Neue Dateien in Verzeichnisstruktur ergänzen.

- [ ] **Step 2: Vollständiger Build + manueller Test**

```bash
cd Pruefung && npm run build
```

- [ ] **Step 3: Commit + Push**

```bash
git add -A
git commit -m "Audio/Video in Fragen + Audio-Korrektur + SuS-Korrektur-Einsicht"
git push
```

**WICHTIG für User:** Nach dem Push:
1. `apps-script-code.js` → Apps Script Editor kopieren → Neue Bereitstellung
2. Testen: Frage mit Audio/Video-Anhang erstellen, URL-Embed testen
3. Testen: Audio-Aufnahme im Korrektur-Dashboard
4. Testen: Korrektur freigeben → SuS-Login → Korrektur-Einsicht
