import { useState, useEffect, useRef, useCallback } from 'react'
import type { FragenBewertung } from '../../../types/korrektur.ts'
import { effektivePunkte } from '../../../utils/korrekturUtils.ts'
import AudioRecorder from '../../AudioRecorder.tsx'
import { kiAssistent } from '../../../services/uploadApi.ts'

interface Props {
  pruefungId: string
  frageId: string
  fragetext: string
  maxPunkte: number
  /** Base64-PNG aus der Abgabe */
  bildLink?: string
  /** JSON-Zeichen-Befehle falls kein bildLink */
  daten?: string
  /** Musterlösung als Base64-PNG (optional für KI) */
  musterloesungBild?: string
  /** Bloom-Stufe (z.B. 'K2') für KI-Korrektur */
  bloom?: string
  /** Bewertungsraster für KI-Korrektur */
  bewertungsraster?: unknown
  /** Lernziel für KI-Korrektur */
  lernziel?: string
  bewertung: FragenBewertung
  schuelerEmail: string
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null }) => void
  onAudioUpload: (frageId: string, blob: Blob) => Promise<string | null>
}

/** Rendert JSON-Zeichenbefehle auf ein Off-Screen-Canvas und gibt Base64-PNG zurück */
/** Rendert alle Zeichenbefehl-Typen (stift, linie, pfeil, rechteck, text) auf ein Canvas */
function datenAlsBildLink(daten: string): string | null {
  try {
    const befehle = JSON.parse(daten) as unknown[]
    if (!Array.isArray(befehle) || befehle.length === 0) return null

    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 500
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const befehl of befehle) {
      if (typeof befehl !== 'object' || befehl === null || !('typ' in befehl)) continue
      const b = befehl as Record<string, unknown>
      const farbe = typeof b.farbe === 'string' ? b.farbe : '#000000'
      const breite = typeof b.breite === 'number' ? b.breite : 2

      switch (b.typ) {
        case 'stift':
        case 'linie': {
          // Stift hat 'punkte[]', Linie hat 'von'+'bis' — beide als Pfad rendern
          ctx.strokeStyle = farbe
          ctx.lineWidth = breite
          const punkte = b.punkte as { x: number; y: number }[] | undefined
          if (punkte && punkte.length >= 2) {
            ctx.beginPath()
            ctx.moveTo(punkte[0].x, punkte[0].y)
            for (let i = 1; i < punkte.length; i++) {
              ctx.lineTo(punkte[i].x, punkte[i].y)
            }
            ctx.stroke()
          } else {
            // Linie mit von/bis
            const von = b.von as { x: number; y: number } | undefined
            const bis = b.bis as { x: number; y: number } | undefined
            if (von && bis) {
              ctx.beginPath()
              ctx.moveTo(von.x, von.y)
              ctx.lineTo(bis.x, bis.y)
              ctx.stroke()
            }
          }
          break
        }
        case 'pfeil': {
          const von = b.von as { x: number; y: number } | undefined
          const bis = b.bis as { x: number; y: number } | undefined
          if (!von || !bis) break
          ctx.strokeStyle = farbe
          ctx.lineWidth = breite
          ctx.beginPath()
          ctx.moveTo(von.x, von.y)
          ctx.lineTo(bis.x, bis.y)
          ctx.stroke()
          // Pfeilspitze
          const angle = Math.atan2(bis.y - von.y, bis.x - von.x)
          const headLen = 12
          ctx.beginPath()
          ctx.moveTo(bis.x, bis.y)
          ctx.lineTo(bis.x - headLen * Math.cos(angle - Math.PI / 6), bis.y - headLen * Math.sin(angle - Math.PI / 6))
          ctx.moveTo(bis.x, bis.y)
          ctx.lineTo(bis.x - headLen * Math.cos(angle + Math.PI / 6), bis.y - headLen * Math.sin(angle + Math.PI / 6))
          ctx.stroke()
          break
        }
        case 'rechteck': {
          const von = b.von as { x: number; y: number } | undefined
          const bis = b.bis as { x: number; y: number } | undefined
          if (!von || !bis) break
          ctx.strokeStyle = farbe
          ctx.lineWidth = breite
          const x = Math.min(von.x, bis.x)
          const y = Math.min(von.y, bis.y)
          const w = Math.abs(bis.x - von.x)
          const h = Math.abs(bis.y - von.y)
          if (b.gefuellt) {
            ctx.fillStyle = farbe
            ctx.fillRect(x, y, w, h)
          } else {
            ctx.strokeRect(x, y, w, h)
          }
          break
        }
        case 'text': {
          ctx.fillStyle = farbe
          const groesse = typeof b.groesse === 'number' ? b.groesse : 16
          ctx.font = `${groesse}px sans-serif`
          ctx.textBaseline = 'alphabetic'
          const pos = b.position as { x: number; y: number } | undefined
          const x = pos ? pos.x : (typeof b.x === 'number' ? b.x : 0)
          const y = pos ? pos.y : (typeof b.y === 'number' ? b.y : 0)
          if (typeof b.text === 'string') ctx.fillText(b.text, x, y)
          break
        }
      }
    }

    return canvas.toDataURL('image/png')
  } catch (e) {
    console.warn('[datenAlsBildLink] Fehler:', e)
    return null
  }
}

/** Lokaler Speicherschlüssel für Textkommentar */
function kommentarKey(pruefungId: string, frageId: string, email: string): string {
  return `korrektur-kommentar-${pruefungId}-${frageId}-${email}`
}

export default function ZeichnenKorrektur({
  pruefungId,
  frageId,
  fragetext,
  maxPunkte,
  bildLink,
  daten,
  musterloesungBild,
  bloom,
  bewertungsraster,
  lernziel,
  bewertung,
  schuelerEmail,
  onUpdate,
  onAudioUpload,
}: Props) {
  // Bild ermitteln (direkt oder aus daten rendern)
  const [gerendertesBild] = useState<string | null>(() => {
    if (bildLink) return bildLink
    if (daten) {
      // Leere Zeichnung ("[]") ergibt kein Bild — kein Warning nötig
      const trimmed = daten.trim()
      if (trimmed === '[]' || trimmed === '') return null
      const bild = datenAlsBildLink(daten)
      if (!bild) console.warn(`[ZeichnenKorrektur] ${frageId}: datenAlsBildLink gab null zurück`, daten.slice(0, 200))
      return bild
    }
    return null
  })

  // Textkommentar aus localStorage laden
  const lsKey = kommentarKey(pruefungId, frageId, schuelerEmail)
  const [kommentar, setKommentar] = useState<string>(() => {
    try {
      return localStorage.getItem(lsKey) ?? ''
    } catch {
      return ''
    }
  })

  // Debounce-Timer für localStorage
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKommentarChange = useCallback((wert: string) => {
    setKommentar(wert)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        if (wert) {
          localStorage.setItem(lsKey, wert)
        } else {
          localStorage.removeItem(lsKey)
        }
      } catch {
        // localStorage voll — ignorieren
      }
      onUpdate({ lpKommentar: wert || null })
    }, 500)
  }, [lsKey, onUpdate])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // KI-Vorschlag
  const [kiLaedt, setKiLaedt] = useState(false)
  const [kiVorschlagGeladen, setKiVorschlagGeladen] = useState(false)
  const [kiPunkte, setKiPunkte] = useState<number | null>(null)
  const [kiBegruendung, setKiBegruendung] = useState<string | null>(null)
  const [kiFehler, setKiFehler] = useState(false)

  async function handleKiVorschlag(): Promise<void> {
    setKiLaedt(true)
    setKiFehler(false)

    const ergebnis = await kiAssistent(schuelerEmail, 'korrigiereZeichnung', {
      bild: gerendertesBild ?? '',
      fragetext,
      musterloesungBild: musterloesungBild ?? '',
      maxPunkte,
      bloom: bloom || undefined,
      bewertungsraster: bewertungsraster || undefined,
      lernziel: lernziel || undefined,
    })

    setKiLaedt(false)

    if (!ergebnis || 'error' in ergebnis) {
      setKiFehler(true)
      return
    }

    const vorgeschlagenePunkte = typeof ergebnis.punkte === 'number' ? ergebnis.punkte : null
    const begruendung = typeof ergebnis.begruendung === 'string' ? ergebnis.begruendung : null

    setKiPunkte(vorgeschlagenePunkte)
    setKiBegruendung(begruendung)
    setKiVorschlagGeladen(true)
  }

  function handleKiUebernehmen(): void {
    if (kiPunkte !== null) {
      onUpdate({ lpPunkte: kiPunkte })
    }
  }

  // Punkte-Eingabewert
  const aktuellePunkte = effektivePunkte(bewertung)
  const punkteWert = bewertung.lpPunkte ?? bewertung.kiPunkte ?? ''

  return (
    <div className="space-y-3">
      {/* SuS-Zeichnung */}
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Zeichnung:</p>
        {gerendertesBild ? (
          <img
            src={gerendertesBild}
            alt="Zeichnung des Schülers"
            className="max-w-full rounded border border-slate-200 dark:border-slate-600 bg-white"
          />
        ) : (
          <div className="rounded border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-6 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
              {daten ? 'Zeichnung konnte nicht dargestellt werden' : 'Keine Zeichnung vorhanden'}
            </p>
          </div>
        )}
      </div>

      {/* Textkommentar */}
      <div>
        <label
          htmlFor={`zk-kommentar-${frageId}`}
          className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
        >
          Korrektur-Kommentar:
        </label>
        <textarea
          id={`zk-kommentar-${frageId}`}
          rows={3}
          value={kommentar}
          placeholder="Kommentar zur Zeichnung..."
          onChange={(e) => {
            handleKommentarChange(e.target.value)
            // Auto-Geprüft bei Kommentar
            if (e.target.value.trim()) onUpdate({ geprueft: true })
          }}
          className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 resize-none"
        />
      </div>

      {/* KI-Button */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleKiVorschlag}
          disabled={kiLaedt || kiVorschlagGeladen}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors cursor-pointer
            ${kiVorschlagGeladen
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
            }`}
        >
          {kiLaedt ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Generiere...
            </>
          ) : (
            <>KI-Vorschlag</>
          )}
        </button>
      </div>

      {/* KI-Fehler */}
      {kiFehler && (
        <div className="rounded bg-red-50 dark:bg-red-900/15 border border-red-200/50 dark:border-red-700/30 px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-red-700 dark:text-red-300">
            KI-Vorschlag konnte nicht generiert werden.
          </p>
          <button
            onClick={() => { setKiFehler(false); setKiVorschlagGeladen(false) }}
            className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            Erneut
          </button>
        </div>
      )}

      {/* KI-Ergebnis */}
      {kiVorschlagGeladen && kiPunkte !== null && (
        <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-700/30 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Vorschlag: {kiPunkte} / {maxPunkte} Punkte
            </span>
            <button
              onClick={handleKiUebernehmen}
              className="text-xs px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
            >
              Übernehmen
            </button>
          </div>
          {kiBegruendung && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {kiBegruendung}
            </p>
          )}
        </div>
      )}

      {/* Bewertungszeile: Punkte | = X Pkt. | 🎤 Audio | ☑ Geprüft */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <label htmlFor={`zk-punkte-${frageId}`} className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Punkte:
          </label>
          <input
            id={`zk-punkte-${frageId}`}
            type="number"
            min={0}
            max={maxPunkte}
            step={0.5}
            value={punkteWert}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onUpdate({ lpPunkte: null })
              } else {
                const val = parseFloat(raw)
                if (!isNaN(val) && val >= 0 && val <= maxPunkte) {
                  // Auto-Geprüft bei Punkte-Änderung
                  onUpdate({ lpPunkte: val, geprueft: true })
                }
              }
            }}
            className={`w-16 rounded border bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-violet-500 ${punkteWert === '' ? 'border-violet-500 bg-violet-50 dark:bg-[#2d2040]' : 'border-slate-300 dark:border-slate-600'}`}
          />
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            / {maxPunkte}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">=</span>
          <span className={`text-sm font-semibold tabular-nums ${
            aktuellePunkte === maxPunkte
              ? 'text-green-600 dark:text-green-400'
              : aktuellePunkte === 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-700 dark:text-slate-200'
          }`}>
            {aktuellePunkte} Pkt.
          </span>
        </div>

        {/* Audio + Geprüft (rechts, zusammen) */}
        <div className="flex items-center gap-2 ml-auto">
          <AudioRecorder
            bestehendeAudioId={bewertung.audioKommentarId}
            kompakt
            onSpeichern={async (blob) => {
              const driveId = await onAudioUpload(frageId, blob)
              if (driveId) {
                // Auto-Geprüft bei Audio-Kommentar
                onUpdate({ audioKommentarId: driveId, geprueft: true })
              }
            }}
          />
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bewertung.geprueft}
              onChange={(e) => onUpdate({ geprueft: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 dark:bg-slate-700 cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">Geprüft</span>
          </label>
        </div>
      </div>
    </div>
  )
}
