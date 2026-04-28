import { ladeAlleFragen } from './_helper.mjs'

const fragen = await ladeAlleFragen()
const audio = fragen.filter(f => f.typ === 'audio')
console.log(`Audio-Fragen: ${audio.length}`)
if (audio.length > 0) {
  console.log('IDs:', audio.map(f => f.id).join(', '))
}
process.exit(audio.length === 0 ? 0 : 1)
