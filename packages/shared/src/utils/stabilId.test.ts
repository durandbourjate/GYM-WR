import { describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { stabilId } from './stabilId'

describe('stabilId', () => {
  it('liefert deterministische ID für gleichen Input', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Aktiva', 0)
    expect(a).toBe(b)
    expect(a).toHaveLength(8)
  })

  it('unterschiedliche Indizes liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Aktiva', 1)
    expect(a).not.toBe(b)
  })

  it('unterschiedliche Texte liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-1', 'Passiva', 0)
    expect(a).not.toBe(b)
  })

  it('unterschiedliche Frage-IDs liefern unterschiedliche IDs', () => {
    const a = stabilId('frage-1', 'Aktiva', 0)
    const b = stabilId('frage-2', 'Aktiva', 0)
    expect(a).not.toBe(b)
  })

  it('Output ist nur a-z2-7 (base32, lowercase)', () => {
    const id = stabilId('frage-1', 'Test 123', 0)
    expect(id).toMatch(/^[a-z2-7]{8}$/)
  })

  it('TS- und MJS-Variante liefern byte-identische IDs', () => {
    const cases = [
      ['frage-1', 'Aktiva', 0],
      ['frage-2', 'Soll', 5],
      ['fr-with-äöü', 'Spezial', 99],
    ] as const
    const tsResults = cases.map(([f, t, i]) => stabilId(f, t, i))

    // stabilId.mjs liegt im selben Verzeichnis wie dieser Test. __dirname wird
    // von vitest als echter FS-Pfad injiziert (CWD-unabhängig: funktioniert egal
    // ob via ExamLab-vitest oder standalone packages/shared-vitest). NICHT
    // import.meta.url verwenden — das ist unter vitest eine http://-Dev-Server-
    // URL, kein file://. pathToFileURL macht daraus eine space-sichere file://-URL.
    const mjsUrl = pathToFileURL(path.join(__dirname, 'stabilId.mjs')).href

    const tmpScript = '/tmp/stabilId-mjs-check.mjs'
    writeFileSync(tmpScript, `
      import { stabilId } from ${JSON.stringify(mjsUrl)}
      const cases = ${JSON.stringify(cases)}
      for (const [f, t, i] of cases) console.log(stabilId(f, t, i))
    `)
    try {
      const out = execSync(`node ${tmpScript}`, { encoding: 'utf8' }).trim().split('\n')
      expect(out).toEqual(tsResults)
    } finally {
      unlinkSync(tmpScript)
    }
  })
})
