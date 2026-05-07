import type { MonitoringDaten } from '../types/monitoring'

/**
 * Mapt das rohe Apps-Script-Result zu typisierten MonitoringDaten.
 * Hauptaufgaben:
 * - status-Ableitung aus abgabezeit / istAbgabe / istAbgegeben (drei Backend-Quellen)
 * - Lockdown-Felder (B19-Fix-Mapping: geraet/vollbild/kontrollStufe/verstoesse)
 * - verstoesse-JSON-String-Parsing mit Fallback auf []
 * - aktuelleFrage Typ-Coercion (string → number, leer-String → null)
 *
 * Vorher inline in DurchfuehrenDashboard::ladeDaten (Z.200-227).
 */
export function mappeMonitoringResult(raw: MonitoringDaten | null): MonitoringDaten {
  const effectiveResult = raw || { pruefungTitel: '', schueler: [], gesamtSus: 0 }
  return {
    ...effectiveResult,
    gesamtSus: effectiveResult.gesamtSus ?? (effectiveResult.schueler as unknown[])?.length ?? 0,
    schueler: (((effectiveResult.schueler || []) as unknown as Record<string, unknown>[]).map((s) => ({
      email: (s.email as string) || '',
      name: (s.name as string) || (s.email as string) || '',
      status: (s.abgabezeit || s.istAbgabe === 'true' || s.istAbgegeben === 'true' || s.istAbgegeben === true)
        ? 'abgegeben'
        : ((s.status as string) || 'nicht-gestartet'),
      letzterHeartbeat: (s.letzterHeartbeat as string) || null,
      letzterSave: (s.letzterSave as string) || null,
      beantworteteFragen: Number(s.beantworteteFragen) || 0,
      gesamtFragen: Number(s.gesamtFragen) || 0,
      abgabezeit: (s.abgabezeit as string) || null,
      startzeit: (s.startzeit as string) || null,
      heartbeats: Number(s.heartbeats) || 0,
      netzwerkFehler: Number(s.netzwerkFehler) || 0,
      autoSaveCount: Number(s.autoSaveCount) || 0,
      unterbrechungen: Array.isArray(s.unterbrechungen) ? s.unterbrechungen : [],
      sebVersion: (s.sebVersion as string) || undefined,
      browserInfo: (s.browserInfo as string) || undefined,
      aktuelleFrage: typeof s.aktuelleFrage === 'number'
        ? s.aktuelleFrage
        : (s.aktuelleFrage != null && s.aktuelleFrage !== '' ? Number(s.aktuelleFrage) : null),
      // Lockdown-Felder (B19-Fix)
      geraet: (s.geraet as 'laptop' | 'tablet' | 'unbekannt') || undefined,
      vollbild: s.vollbild === true || s.vollbild === 'true',
      kontrollStufe: (s.kontrollStufe as 'keine' | 'locker' | 'standard' | 'streng') || undefined,
      verstossZaehler: Number(s.verstossZaehler) || 0,
      gesperrt: s.gesperrt === true || s.gesperrt === 'true',
      verstoesse: Array.isArray(s.verstoesse)
        ? s.verstoesse
        : (typeof s.verstoesse === 'string'
          ? (() => { try { return JSON.parse(s.verstoesse as string) } catch { return [] } })()
          : []),
    }))),
  } as MonitoringDaten
}
