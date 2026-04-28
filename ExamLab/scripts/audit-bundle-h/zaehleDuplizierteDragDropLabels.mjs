import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const dndFragen = fragen.filter(f => f.typ === 'dragdrop_bild')
const betroffen = dndFragen.filter(f => {
  const labels = (f.labels ?? []).map(l => (typeof l === 'string' ? l : l.text ?? '').trim()).filter(Boolean)
  return new Set(labels).size !== labels.length
})
console.log(`DragDrop-Fragen mit doppelten Pool-Labels: ${betroffen.length} von ${dndFragen.length}`)
betroffen.forEach(f => console.log(`  - ${f.id}: ${(f.labels ?? []).join(', ')}`))
