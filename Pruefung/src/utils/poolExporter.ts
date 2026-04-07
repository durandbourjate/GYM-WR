// Pruefung/src/utils/poolExporter.ts
// Konvertierung ExamLab → Pool-Format (Gegenstück zu poolConverter.ts)

import type {
  Frage,
  MCFrage,
  LueckentextFrage,
  ZuordnungFrage,
  RichtigFalschFrage,
  BerechnungFrage,
} from '../types/fragen'

export interface PoolFrageExport {
  id: string
  topic: string
  type: 'mc' | 'multi' | 'tf' | 'fill' | 'calc' | 'sort' | 'open'
  diff: number
  tax: string
  reviewed: boolean
  q: string
  explain?: string
  sample?: string
  options?: Array<{ v: string; t: string }>
  correct?: string | string[] | boolean
  blanks?: Array<{ answer: string; alts?: string[] }>
  rows?: Array<{ label: string; answer: number; tolerance: number; unit?: string }>
  categories?: string[]
  items?: Array<{ t: string; cat: number }>
}

/**
 * Konvertiert eine ExamLab-Frage ins Pool-Format.
 * Wirft Error bei VisualisierungFrage (nicht exportierbar).
 */
export function konvertiereZuPoolFormat(
  frage: Frage,
  topic: string,
  poolFrageId?: string,
): PoolFrageExport {
  if (frage.typ === 'visualisierung') {
    throw new Error('VisualisierungFragen können nicht in Pools exportiert werden.')
  }

  const basis: PoolFrageExport = {
    id: poolFrageId || frage.id,
    topic,
    type: mapTypZuPool(frage),
    diff: frage.schwierigkeit || 2,
    tax: frage.bloom || 'K2',
    reviewed: frage.poolGeprueft ?? false,
    q: 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : '',
  }

  // Musterlosung-Mapping: open → sample, rest → explain
  if (frage.typ === 'freitext') {
    basis.sample = frage.musterlosung || ''
  } else {
    basis.explain = frage.musterlosung || ''
  }

  // Typ-spezifische Felder
  switch (frage.typ) {
    case 'mc': {
      const mc = frage as MCFrage
      basis.options = mc.optionen.map((o, i) => ({
        v: String.fromCharCode(65 + i),
        t: o.text,
      }))
      if (mc.mehrfachauswahl) {
        basis.type = 'multi'
        basis.correct = mc.optionen
          .map((o, i) => (o.korrekt ? String.fromCharCode(65 + i) : null))
          .filter((v): v is string => v !== null)
      } else {
        basis.type = 'mc'
        const idx = mc.optionen.findIndex((o) => o.korrekt)
        basis.correct = idx >= 0 ? String.fromCharCode(65 + idx) : 'A'
      }
      break
    }
    case 'freitext':
      basis.type = 'open'
      break
    case 'lueckentext': {
      const lt = frage as LueckentextFrage
      basis.type = 'fill'
      basis.q = lt.textMitLuecken || frage.fragetext
      basis.blanks = lt.luecken.map((l) => ({
        answer: l.korrekteAntworten[0] || '',
        ...(l.korrekteAntworten.length > 1
          ? { alts: l.korrekteAntworten.slice(1) }
          : {}),
      }))
      break
    }
    case 'zuordnung': {
      const zu = frage as ZuordnungFrage
      basis.type = 'sort'
      const cats = [...new Set(zu.paare.map((p) => p.rechts))]
      basis.categories = cats
      basis.items = zu.paare.map((p) => ({
        t: p.links,
        cat: cats.indexOf(p.rechts),
      }))
      break
    }
    case 'richtigfalsch': {
      const rf = frage as RichtigFalschFrage
      basis.type = 'tf'
      if (rf.aussagen.length === 1) {
        basis.q = rf.aussagen[0].text
        basis.correct = rf.aussagen[0].korrekt
      } else {
        basis.correct = rf.aussagen[0]?.korrekt ?? true
      }
      break
    }
    case 'berechnung': {
      const be = frage as BerechnungFrage
      basis.type = 'calc'
      basis.rows = be.ergebnisse.map((e) => ({
        label: e.label || '',
        answer: e.korrekt,
        tolerance: e.toleranz || 0,
        ...(e.einheit ? { unit: e.einheit } : {}),
      }))
      break
    }
  }

  return basis
}

function mapTypZuPool(frage: Frage): PoolFrageExport['type'] {
  switch (frage.typ) {
    case 'mc':
      return (frage as MCFrage).mehrfachauswahl ? 'multi' : 'mc'
    case 'freitext':
      return 'open'
    case 'lueckentext':
      return 'fill'
    case 'zuordnung':
      return 'sort'
    case 'richtigfalsch':
      return 'tf'
    case 'berechnung':
      return 'calc'
    default:
      throw new Error(`Typ ${frage.typ} nicht exportierbar`)
  }
}

/**
 * Serialisiert eine PoolFrage als JS-Objekt-String (unquoted keys, Pool-Format).
 */
export function serialisierePoolFrage(pf: PoolFrageExport): string {
  const lines: string[] = []
  lines.push(
    `  {id: "${pf.id}", topic: "${pf.topic}", type: "${pf.type}", diff: ${pf.diff}, tax: "${pf.tax}", reviewed: ${pf.reviewed},`,
  )

  lines.push(`    q: ${JSON.stringify(pf.q)},`)

  if (pf.options) {
    lines.push(`    options: [`)
    pf.options.forEach((o, i) => {
      const comma = i < pf.options!.length - 1 ? ',' : ''
      lines.push(`      {v: "${o.v}", t: ${JSON.stringify(o.t)}}${comma}`)
    })
    lines.push(`    ],`)
  }

  if (pf.correct !== undefined) {
    if (Array.isArray(pf.correct)) {
      lines.push(
        `    correct: [${pf.correct.map((c) => `"${c}"`).join(', ')}],`,
      )
    } else if (typeof pf.correct === 'boolean') {
      lines.push(`    correct: ${pf.correct},`)
    } else {
      lines.push(`    correct: "${pf.correct}",`)
    }
  }

  if (pf.blanks) {
    lines.push(`    blanks: [`)
    pf.blanks.forEach((b, i) => {
      const alts =
        b.alts?.length
          ? `, alts: [${b.alts.map((a) => JSON.stringify(a)).join(', ')}]`
          : ''
      const comma = i < pf.blanks!.length - 1 ? ',' : ''
      lines.push(
        `      {answer: ${JSON.stringify(b.answer)}${alts}}${comma}`,
      )
    })
    lines.push(`    ],`)
  }

  if (pf.rows) {
    lines.push(`    rows: [`)
    pf.rows.forEach((r, i) => {
      const unit = r.unit ? `, unit: "${r.unit}"` : ''
      const comma = i < pf.rows!.length - 1 ? ',' : ''
      lines.push(
        `      {label: ${JSON.stringify(r.label)}, answer: ${r.answer}, tolerance: ${r.tolerance}${unit}}${comma}`,
      )
    })
    lines.push(`    ],`)
  }

  if (pf.categories) {
    lines.push(
      `    categories: [${pf.categories.map((c) => JSON.stringify(c)).join(', ')}],`,
    )
  }

  if (pf.items) {
    lines.push(`    items: [`)
    pf.items.forEach((item, i) => {
      const comma = i < pf.items!.length - 1 ? ',' : ''
      lines.push(
        `      {t: ${JSON.stringify(item.t)}, cat: ${item.cat}}${comma}`,
      )
    })
    lines.push(`    ],`)
  }

  if (pf.sample) {
    lines.push(`    sample: ${JSON.stringify(pf.sample)},`)
  }
  if (pf.explain) {
    lines.push(`    explain: ${JSON.stringify(pf.explain)}`)
  }

  // Letztes Komma entfernen
  const lastLine = lines[lines.length - 1]
  if (lastLine.endsWith(',')) {
    lines[lines.length - 1] = lastLine.slice(0, -1)
  }

  lines.push(`  }`)
  return lines.join('\n')
}
