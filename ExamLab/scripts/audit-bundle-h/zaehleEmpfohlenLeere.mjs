import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const stats = {}
for (const f of fragen) {
  stats[f.typ] = stats[f.typ] ?? { total: 0, empfohlenLeer: 0 }
  stats[f.typ].total++
  // Heuristik vor Phase 1 — wird nach Phase 1 ergänzt durch validierePflichtfelder
  if (f.typ === 'mc' && Array.isArray(f.optionen) && f.optionen.every(o => !o?.erklaerung)) stats[f.typ].empfohlenLeer++
  if (f.typ === 'richtigfalsch' && Array.isArray(f.aussagen) && f.aussagen.every(a => !a?.erklaerung)) stats[f.typ].empfohlenLeer++
  if (f.typ === 'freitext' && !f.musterloesung) stats[f.typ].empfohlenLeer++
}
console.log('Bestand mit leeren Empfohlen-Feldern (Heuristik, MC/RF/Freitext):')
Object.entries(stats).sort((a, b) => b[1].empfohlenLeer - a[1].empfohlenLeer).forEach(([typ, s]) => {
  console.log(`  ${typ}: ${s.empfohlenLeer} / ${s.total}`)
})
