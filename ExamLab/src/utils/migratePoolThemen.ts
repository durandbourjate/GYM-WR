/**
 * Einmalige Migration: Pool-Fragen im Backend mit korrektem thema/unterthema versehen.
 *
 * Vorher: thema = Topic-Label (z.B. "Wirtschaft, Bedürfnisse & Knappheit"), unterthema = leer
 * Nachher: thema = Pool-Titel (z.B. "Geld, Geldpolitik und Finanzmärkte"), unterthema = Topic-Label
 *
 * Erkennung: Fragen mit poolId aber ohne unterthema.
 */

import { poolTitel } from './poolTitelMapping'
import { useFragenbankStore } from '../store/fragenbankStore'
import { speichereFrage } from '../services/fragenbankApi'
import type { Frage } from '../types/fragen'

export interface MigrationErgebnis {
  total: number
  aktualisiert: number
  uebersprungen: number
  fehler: number
  details: string[]
}

export async function migratePoolThemen(email: string): Promise<MigrationErgebnis> {
  const ergebnis: MigrationErgebnis = {
    total: 0,
    aktualisiert: 0,
    uebersprungen: 0,
    fehler: 0,
    details: [],
  }

  // Alle Fragen aus dem Store (bereits geladen)
  const alleFragen = useFragenbankStore.getState().fragen
  if (!alleFragen || alleFragen.length === 0) {
    ergebnis.details.push('Keine Fragen im Store — bitte zuerst Fragenbank laden.')
    return ergebnis
  }

  // Pool-Fragen ohne unterthema identifizieren
  const zuMigrieren: Frage[] = []
  for (const f of alleFragen) {
    const pid = (f as { poolId?: string }).poolId
    if (!pid) continue // Keine Pool-Frage
    if (f.unterthema) continue // Bereits migriert

    const poolMetaId = pid.split(':')[0]
    const titel = poolTitel(poolMetaId)
    if (!titel) {
      ergebnis.details.push(`Übersprungen: ${f.id} — Pool-ID "${poolMetaId}" nicht in Mapping-Tabelle`)
      ergebnis.uebersprungen++
      continue
    }

    zuMigrieren.push(f)
  }

  ergebnis.total = zuMigrieren.length
  if (zuMigrieren.length === 0) {
    ergebnis.details.push('Alle Pool-Fragen haben bereits korrekte thema/unterthema Werte.')
    return ergebnis
  }

  ergebnis.details.push(`${zuMigrieren.length} Pool-Fragen zu migrieren...`)

  // In Batches von 5 migrieren (Backend nicht überlasten)
  for (let i = 0; i < zuMigrieren.length; i += 5) {
    const batch = zuMigrieren.slice(i, i + 5)
    const promises = batch.map(async (f) => {
      const pid = (f as { poolId?: string }).poolId!
      const poolMetaId = pid.split(':')[0]
      const neuerTitel = poolTitel(poolMetaId)!
      const altesThema = f.thema

      // thema → Pool-Titel, unterthema → bisheriges thema (Topic-Label)
      const aktualisiert: Frage = {
        ...f,
        thema: neuerTitel,
        unterthema: altesThema,
      }

      try {
        const ok = await speichereFrage(email, aktualisiert)
        if (ok) {
          ergebnis.aktualisiert++
          return true
        } else {
          ergebnis.fehler++
          ergebnis.details.push(`Fehler bei ${f.id}: speichereFrage gab false zurück`)
          return false
        }
      } catch (error) {
        ergebnis.fehler++
        ergebnis.details.push(`Fehler bei ${f.id}: ${error}`)
        return false
      }
    })

    await Promise.all(promises)

    // Fortschritt loggen
    const fortschritt = Math.min(i + 5, zuMigrieren.length)
    console.log(`[Migration] ${fortschritt}/${zuMigrieren.length} verarbeitet`)
  }

  ergebnis.details.push(`Fertig: ${ergebnis.aktualisiert} aktualisiert, ${ergebnis.fehler} Fehler, ${ergebnis.uebersprungen} übersprungen.`)
  return ergebnis
}
