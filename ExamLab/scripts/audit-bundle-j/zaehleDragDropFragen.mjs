#!/usr/bin/env node
// Audit Bundle J — zählt dragdrop_bild-Fragen für Migrations-Scope

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL
if (!APPS_SCRIPT_URL || !MIGRATION_EMAIL) {
  console.error('Setze APPS_SCRIPT_URL und MIGRATION_EMAIL (Admin-LP) in der Umgebung.')
  process.exit(1)
}

const r = await fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ action: 'holeAlleFragenFuerMigration', email: MIGRATION_EMAIL }),
  redirect: 'follow',
})
if (!r.ok) {
  console.error(`Apps-Script HTTP ${r.status}`)
  process.exit(1)
}
const data = await r.json()
if (data.error) {
  console.error('API-Fehler:', data.error)
  process.exit(1)
}
if (!Array.isArray(data.data)) {
  console.error('Unerwartetes Response-Shape (data.data ist kein Array):', data)
  process.exit(1)
}

const dnd = data.data.filter(f => f.typ === 'dragdrop_bild')
let multiZoneBug = 0
const multiZoneIds = []
for (const f of dnd) {
  const labelCounts = new Map()
  for (const z of (f.zielzonen ?? [])) {
    const k = (z.korrektesLabel ?? '').trim().toLowerCase()
    if (!k) continue
    labelCounts.set(k, (labelCounts.get(k) ?? 0) + 1)
  }
  if ([...labelCounts.values()].some(n => n > 1)) {
    multiZoneBug++
    multiZoneIds.push(f.id)
  }
}
const distraktoren = dnd.filter(f => (f.labels?.length ?? 0) > (f.zielzonen?.length ?? 0))

console.log(`DragDrop-Bild-Fragen total: ${dnd.length}`)
console.log(`  Multi-Zone-Bug heute (≥2 Zonen identisches korrektesLabel): ${multiZoneBug}`)
console.log(`  Mit Distraktoren (labels.length > zielzonen.length): ${distraktoren.length}`)
console.log()
console.log(`Multi-Zone-Bug-Fragen-IDs (LP-Re-Edit nach Migration nötig):`)
for (const id of multiZoneIds) console.log(`  ${id}`)
console.log()
console.log(`Hinweis: Aktive Üben-Sessions + Antworten in laufenden Prüfungen`)
console.log(`manuell prüfen via Apps-Script Editor (Sheets "Übungssessions" / "Antworten").`)
