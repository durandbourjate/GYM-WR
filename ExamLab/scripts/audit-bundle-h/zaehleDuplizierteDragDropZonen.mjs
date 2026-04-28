import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const dndFragen = fragen.filter(f => f.typ === 'dragdrop_bild')
const betroffen = dndFragen.filter(f => {
  const labels = (f.zielzonen ?? []).map(z => (z.korrektesLabel ?? '').trim()).filter(Boolean)
  return new Set(labels).size !== labels.length
})
console.log(`DragDrop-Fragen mit Multi-Zone-Bug (selber korrektesLabel in 2+ Zonen): ${betroffen.length} von ${dndFragen.length}`)
betroffen.forEach(f => {
  const counts = {}
  ;(f.zielzonen ?? []).forEach(z => { counts[z.korrektesLabel] = (counts[z.korrektesLabel] ?? 0) + 1 })
  const dups = Object.entries(counts).filter(([, n]) => n > 1).map(([l, n]) => `${l}×${n}`).join(', ')
  console.log(`  - ${f.id}: ${dups}`)
})
console.log(`\nWenn > 0: User entscheidet ob Bundle J vorzuziehen (Datenmodell-Migration).`)
