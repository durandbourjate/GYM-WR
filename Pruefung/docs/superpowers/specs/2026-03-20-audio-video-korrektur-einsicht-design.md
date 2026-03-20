# Audio/Video in Fragen + Audio-Korrektur + SuS-Korrektur-Einsicht

> Datum: 2026-03-20
> Status: Genehmigt

## Zusammenfassung

Drei zusammenhängende Features:
1. **Audio/Video-Anhänge in Fragen** — LP kann Audio, Video und URL-Embeds (YouTube, Vimeo, nanoo.tv) zu Fragen hinzufügen
2. **Audio-Aufnahme im Korrektur-Dashboard** — LP nimmt Audio-Feedback direkt im Browser auf (pro Frage + Gesamtkommentar)
3. **SuS-Korrektur-Einsicht** — SuS sehen ihre korrigierte Prüfung inkl. Audio-Kommentare in der App

## Teil 1: Audio/Video-Anhänge in Fragen

### Typ-Erweiterung

`FrageAnhang` in `fragen.ts` erhält ein neues optionales Feld:

```ts
export interface FrageAnhang {
  id: string
  dateiname: string
  mimeType: string
  groesseBytes: number
  driveFileId: string            // leer bei URL-Embeds
  beschreibung?: string
  bildGroesse?: 'klein' | 'mittel' | 'gross'
  // NEU:
  url?: string                   // YouTube/Vimeo/nanoo.tv URL (nur bei URL-Embeds)
}
```

Bei URL-Embeds: `driveFileId` = leer, `mimeType` = `'video/embed'`, `url` = Original-URL.

### AnhangEditor-Änderungen

**MIME-Filter erweitern:**
- Bisher: `image/*`, `application/pdf`
- Neu: `image/*`, `application/pdf`, `audio/*`, `video/*`

**Grössenlimits differenziert:**
- Bild/PDF/Audio: 5 MB
- Video: 25 MB
- Erkennung via `mimeType.startsWith('video/')` → höheres Limit

**URL-Einbettung:**
- Neuer Button "+ URL einbetten" neben "+ Datei hochladen"
- Textfeld für URL-Eingabe
- Regex-Validierung für unterstützte Plattformen:
  - YouTube: `youtube.com/watch?v=...` oder `youtu.be/...`
  - Vimeo: `vimeo.com/...`
  - nanoo.tv: `*.nanoo.tv/...` (generisch, iframe-Embed)
- Automatische Embed-URL-Extraktion (YouTube → `youtube.com/embed/VIDEO_ID`, etc.)
- Wird als `FrageAnhang` mit `mimeType: 'video/embed'` gespeichert, kein Drive-Upload

**Max. Anhänge:** Bleibt bei 5.

### Anzeige — MediaAnhang-Komponente

Medien-Rendering in neue `MediaAnhang.tsx`-Komponente extrahieren (wird von FrageAnhaenge, VorschauTab und KorrekturEinsicht wiederverwendet):

```
if (mimeType.startsWith('image/'))     → <img> mit Lightbox (wie bisher)
if (mimeType.startsWith('audio/'))     → <audio controls> mit Drive-Stream-URL
if (mimeType === 'video/embed')        → <iframe> mit Embed-URL (YouTube/Vimeo/nanoo)
if (mimeType.startsWith('video/'))     → <video controls> mit Drive-Preview-URL
if (mimeType === 'application/pdf')    → <iframe> mit Drive-Preview (wie bisher)
```

Reihenfolge wichtig: `video/embed` muss vor `video/*` geprüft werden.

**Drive-URLs:**
- Audio: `https://drive.google.com/uc?id=${driveFileId}&export=download`
- Video: `https://drive.google.com/file/d/${driveFileId}/preview` (Drive-eigener Player)
- Fallback bei Ladefehler: "Medium konnte nicht geladen werden"-Meldung + "In Drive öffnen"-Link

### VorschauTab-Änderungen

`AnhangBilder`-Funktion in `VorschauTab.tsx` umbenennen zu `AnhangMedien` und `MediaAnhang`-Komponente verwenden.

## Teil 2: Audio-Aufnahme im Korrektur-Dashboard

### Browser-Recording

Neuer Hook `useAudioRecorder.ts`:
- Nutzt `MediaRecorder` API (Browser-nativ, kein externes Package)
- Format: `audio/webm;codecs=opus` (Chrome/Firefox/Edge) mit Fallback auf `audio/mp4` (Safari)
- States: `idle` → `recording` → `preview` → `uploading` → `done`
- Rückgabe: `{ startRecording, stopRecording, audioBlob, audioUrl, isRecording, dauer }`
- Cleanup: `MediaStream.getTracks().forEach(t => t.stop())` im useEffect-Cleanup
- Fehlerbehandlung: `NotAllowedError` (Mikrofon-Berechtigung verweigert) → Hinweis an User

### Komponenten-Hierarchie

```
AudioRecorder.tsx (UI: Button + Recording-Status + Preview)
  └── useAudioRecorder.ts (Hook: MediaRecorder-Logik)

AudioPlayer.tsx (UI: Play/Pause + Dauer-Anzeige)
  → Wird verwendet in: KorrekturFrageZeile, KorrekturSchuelerZeile, KorrekturEinsicht
```

`AudioRecorder` besitzt den Recording-State lokal (kein Zustand-Store nötig).
Upload-Callback wird als Prop übergeben.

### UI im KorrekturDashboard

**Pro Frage (in KorrekturFrageZeile.tsx):**
- Mikrofon-Button neben dem LP-Kommentar-Textfeld
- Während Aufnahme: rot pulsierender Indikator + Dauer-Anzeige + Stopp-Button
- Nach Aufnahme: Mini-Player (Play/Pause + Dauer) + Löschen-Button + Speichern-Button
- Speichern: Blob → Base64 → `uploadAnhang` → Drive-File-ID in `FragenBewertung.audioKommentarId`
- Audio überschreibbar: Neue Aufnahme ersetzt bestehende

**Gesamtkommentar (in KorrekturSchuelerZeile.tsx):**
- Gleicher Mikrofon-Button beim Gesamt-LP-Kommentar
- Drive-File-ID in `SchuelerKorrektur.audioGesamtkommentarId`

### Typ-Erweiterungen in korrektur.ts

```ts
export interface FragenBewertung {
  // ... bestehende Felder ...
  audioKommentarId?: string       // NEU: Drive-File-ID des Audio-Kommentars
}

export interface SchuelerKorrektur {
  // ... bestehende Felder ...
  audioGesamtkommentarId?: string  // NEU: Drive-File-ID des Gesamt-Audio-Kommentars
}

export interface KorrekturZeileUpdate {
  // ... bestehende Felder ...
  audioKommentarId?: string | null   // NEU (null = entfernen)
}
```

Gesamtkommentar-Audio: Bestehenden `speichereKorrekturZeile`-Endpoint erweitern mit neuem Payload-Feld `audioGesamtkommentarId`.

## Teil 3: SuS-Korrektur-Einsicht

### Freigabe durch LP

Neues Feld im bestehenden `korrektur`-Objekt von `PruefungsConfig`:
```ts
korrektur: {
  aktiviert: boolean;
  modus: 'sofort' | 'batch';
  systemPrompt?: string;
  freigegeben?: boolean;  // NEU — Default: false
};
```

- Button "Korrektur freigeben" im KorrekturDashboard (neben "Feedback senden")
- Bestätigungsdialog: "Soll die Korrektur für die SuS sichtbar gemacht werden?"
- Setzt `korrektur.freigegeben: true` in der Config via Apps Script
- Umkehrbar: Toggle-Button "Freigabe zurückziehen"

### Backend-Endpoints (Apps Script)

**`ladeKorrekturenFuerSuS`** (Liste):
- Input: `schuelerEmail`
- Liest alle Configs, filtert auf `korrektur.freigegeben === true` + `erlaubteKlasse` enthält SuS
- Gibt zurück: `[{ pruefungId, titel, datum, klasse, note, gesamtPunkte, maxPunkte }]`

**`ladeKorrekturDetail`** (Einzelne Korrektur):
- Input: `pruefungId`, `schuelerEmail`
- Prüft: `korrektur.freigegeben === true`
- Gibt zurück: Fragen + SuS-Antworten + Bewertungen (nur die des anfragenden SuS)
- Rollencheck: SuS sieht nur eigene Daten

**`korrekturFreigeben`** (Toggle):
- Input: `pruefungId`, `freigegeben: boolean`
- Rollencheck: Nur LP
- Setzt `korrektur.freigegeben` in Config-Sheet

### Neuer View: KorrekturEinsicht.tsx

**Zugang:**
- SuS loggt sich ein (wie bisher)
- Ohne `?id=`-Parameter: Startseite zeigt "Meine Korrekturen" (Liste freigegebener Prüfungen)
- Klick auf Prüfung → Korrektur-Einsicht

**Darstellung pro Frage:**
- Fragetext (read-only)
- Antwort des SuS (read-only, gleiche Darstellung wie bei Abgabe)
- Bewertung: Punkte (X/Y), LP-Kommentar, Audio-Player (falls vorhanden)
- Punkteanzeige: Symbole ✓ (volle Punkte), ~ (Teilpunkte), ✗ (0 Punkte) — neutral, passend zum bestehenden Farbschema

**Gesamtübersicht (oben):**
- Prüfungstitel, Datum, Klasse
- Gesamtpunkte, Note
- Gesamtkommentar (Text + Audio-Player)

**Kein Editieren.** Reine Einsicht.

### Routing-Änderung in App.tsx

```
SuS-Rolle:
  mit ?id=...               → Prüfung ablegen (wie bisher)
  ohne ?id, Korrekturen da  → Startseite mit "Meine Korrekturen"-Liste
  ohne ?id, nichts da       → Startseite "Keine Prüfungen verfügbar"
```

## Neue Dateien

| Datei | Beschreibung |
|-------|-------------|
| `src/hooks/useAudioRecorder.ts` | MediaRecorder-Hook (Start/Stopp/Blob/Cleanup) |
| `src/components/AudioPlayer.tsx` | Wiederverwendbarer Mini-Player (Play/Pause/Dauer) |
| `src/components/AudioRecorder.tsx` | Record-UI (Mikrofon-Button + Status + Preview), lokaler State |
| `src/components/MediaAnhang.tsx` | Renderer für alle Medientypen (Audio/Video/Bild/PDF/Embed), mit Ladefehler-Fallback |
| `src/components/sus/KorrekturEinsicht.tsx` | SuS-Korrektur-View (einzelne Prüfung) |
| `src/components/sus/KorrekturListe.tsx` | Liste freigegebener Korrekturen |
| `src/utils/mediaUtils.ts` | URL-Parsing (YouTube/Vimeo/nanoo), MIME-Helpers, Grössenlimits |

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/types/fragen.ts` | `FrageAnhang.url` Feld |
| `src/types/korrektur.ts` | `audioKommentarId`, `audioGesamtkommentarId`, `KorrekturZeileUpdate` |
| `src/types/pruefung.ts` | `korrektur.freigegeben` Feld |
| `src/components/FrageAnhaenge.tsx` | Nutzt `MediaAnhang` statt eigener Logik |
| `src/components/lp/frageneditor/AnhangEditor.tsx` | MIME-Filter, Grössenlimits, URL-Einbettung |
| `src/components/lp/composer/VorschauTab.tsx` | `AnhangBilder` → `AnhangMedien`, nutzt `MediaAnhang` |
| `src/components/lp/KorrekturFrageZeile.tsx` | `AudioRecorder` + `AudioPlayer` Integration |
| `src/components/lp/KorrekturSchuelerZeile.tsx` | Gesamt-Audio-Kommentar |
| `src/components/lp/KorrekturDashboard.tsx` | "Korrektur freigeben"-Toggle-Button |
| `src/services/apiService.ts` | Neue Endpoints (ladeKorrekturenFuerSuS, ladeKorrekturDetail, korrekturFreigeben) |
| `src/App.tsx` | Routing: SuS ohne ?id → KorrekturListe |
| `apps-script-code.js` | Backend: ladeKorrekturenFuerSuS, ladeKorrekturDetail, korrekturFreigeben |

## Backward Compatibility

Alle neuen Felder sind optional (`?`). Bestehende Daten ohne diese Felder funktionieren weiterhin — kein Migrationsbedarf.

## Nicht im Scope

- SuS-seitige Audio/Video-Aufnahme (mündliche Prüfungen)
- Transkription von Audio-Kommentaren
- Video-Recording durch LP
- Buchhaltungs-Fragetyp (separates Feature, danach)
