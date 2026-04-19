import { describe, it, expect } from 'vitest'
import { pruefeAntwort } from './korrektur'

describe('pruefeAntwort — defensive gegen bereinigte Pool-Daten', () => {
  it('mc ohne optionen[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'mc' } as any, { typ:'mc', gewaehlteOptionen:['x'] } as any))
      .not.toThrow()
  })
  it('mc ohne optionen[] liefert false', () => {
    expect(pruefeAntwort({ id:'f', typ:'mc' } as any, { typ:'mc', gewaehlteOptionen:['x'] } as any)).toBe(false)
  })
  it('richtigfalsch ohne aussagen[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'richtigfalsch' } as any, { typ:'richtigfalsch', bewertungen:{} } as any))
      .not.toThrow()
  })
  it('lueckentext ohne luecken[].korrekteAntworten crasht nicht', () => {
    const f: any = { id:'f', typ:'lueckentext', luecken:[{id:'l1'}] }
    const a: any = { typ:'lueckentext', eintraege:{l1:'x'} }
    expect(() => pruefeAntwort(f, a)).not.toThrow()
    expect(pruefeAntwort(f, a)).toBe(false)
  })
  it('sortierung ohne elemente[] crasht nicht', () => {
    const f: any = { id:'f', typ:'sortierung' }
    const a: any = { typ:'sortierung', reihenfolge:['x'] }
    expect(() => pruefeAntwort(f, a)).not.toThrow()
  })
  it('zuordnung ohne paare[] crasht nicht', () => {
    expect(() => pruefeAntwort({ id:'f', typ:'zuordnung' } as any, { typ:'zuordnung', zuordnungen:{} } as any))
      .not.toThrow()
  })
})
