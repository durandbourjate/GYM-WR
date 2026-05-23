/** Normalisiert beliebige Datum-Eingaben in das von `<input type="date">`
 *  geforderte Format `YYYY-MM-DD`. Verwendet lokale Zeit für die Tagesgrenze.
 *
 *  Hintergrund: Apps-Script-Roundtrip kann das `datum`-Feld als Date-Objekt
 *  serialisieren (ISO mit Zeit + TZ). `<input type="date">` lehnt non-`YYYY-MM-DD`
 *  ab und zeigt leer an. Diese Util fängt alle vorkommenden Formate. */
export function toIsoDateInput(value: string | Date | null | undefined): string {
  if (value == null) return ''
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return ''
    return formatLocalIsoDate_(value)
  }
  const s = String(value).trim()
  if (!s) return ''
  // Schon im Zielformat
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // Deutsches dd.mm.yyyy
  const de = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (de) return `${de[3]}-${de[2]}-${de[1]}`
  // Alles andere (ISO-with-time, Date.toString-Ausgabe, …) → parsen, lokal extrahieren
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return formatLocalIsoDate_(d)
}

function formatLocalIsoDate_(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Formatiert ein Datum (String oder Date-Objekt) als "Mi 01. April 2026".
 *  Akzeptiert ISO-Strings ("2026-04-01"), Date-Objekte und rohe Date.toString()-Ausgaben. */
export function formatDatum(datum: string | Date): string {
  let d: Date
  if (datum instanceof Date) {
    d = datum
  } else if (typeof datum === 'string') {
    // ISO-Format (YYYY-MM-DD) → explizit als lokale Mitternacht parsen
    if (/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
      d = new Date(datum + 'T00:00:00')
    } else {
      // Alles andere (z.B. rohe Date.toString()-Ausgabe) → direkt parsen
      d = new Date(datum)
    }
  } else {
    // Fallback: versuche String-Konvertierung (z.B. wenn ein Date-Objekt als any durchkommt)
    d = new Date(String(datum))
  }
  if (isNaN(d.getTime())) return String(datum)
  return new Intl.DateTimeFormat('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/** Formatiert Sekunden als MM:SS */
export function formatZeit(sekunden: number): string {
  const min = Math.floor(Math.abs(sekunden) / 60)
  const sec = Math.abs(sekunden) % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** Formatiert einen ISO-Timestamp als HH:MM */
export function formatUhrzeit(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Berechnet verbleibende Sekunden ab Startzeit + Dauer */
export function berechneRestzeit(startzeit: string, dauerMinuten: number): number {
  const start = new Date(startzeit).getTime()
  const ende = start + dauerMinuten * 60 * 1000
  const jetzt = Date.now()
  return Math.max(0, Math.floor((ende - jetzt) / 1000))
}

/** Berechnet verstrichene Sekunden seit Startzeit */
export function berechneVerstricheneZeit(startzeit: string): number {
  const start = new Date(startzeit).getTime()
  return Math.max(0, Math.floor((Date.now() - start) / 1000))
}

/** Formatiert Sekunden als H:MM:SS (wenn >= 1h) oder MM:SS */
export function formatVerstricheneZeit(sekunden: number): string {
  const h = Math.floor(sekunden / 3600)
  const m = Math.floor((sekunden % 3600) / 60)
  const s = sekunden % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
