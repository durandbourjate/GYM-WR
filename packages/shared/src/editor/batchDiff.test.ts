/**
 * Cluster D Phase 3a — Tests für berechnePatch (Pure-Diff).
 *
 * Coverage-Ziele:
 *  - Alle 6 nicht-tag Felder (fachbereich, bloom, status, gefaesse, semester, lernzielIds)
 *    werden NUR übernommen wenn !== undefined (Dirty-Flag-Semantik).
 *  - Leerer Input → leerer Patch.
 *  - tagIds=[] → kein Tag-Feld trotz Modus (No-Op).
 *  - tagIds=[…] + Modus → genau das richtige Tag-Feld (mutually exclusive).
 *  - Gemischter Input → alle dirty-Felder + Tag-Feld korrekt.
 */
import { describe, it, expect } from 'vitest'
import { berechnePatch, type BatchFormDiffInput, type TagsModus } from './batchDiff'

const leererInput: BatchFormDiffInput = {
  fachbereich: undefined,
  bloom: undefined,
  status: undefined,
  gefaesse: undefined,
  semester: undefined,
  lernzielIds: undefined,
  tagIds: [],
}

describe('berechnePatch', () => {
  describe('leerer Input', () => {
    it('leerer Form-Input + Tag-Modus → leerer Patch', () => {
      expect(berechnePatch(leererInput, 'hinzufuegen')).toEqual({})
      expect(berechnePatch(leererInput, 'ersetzen')).toEqual({})
      expect(berechnePatch(leererInput, 'entfernen')).toEqual({})
    })
  })

  describe('einzelne nicht-Tag-Felder', () => {
    it('nur fachbereich dirty → nur fachbereich im Patch', () => {
      const patch = berechnePatch(
        { ...leererInput, fachbereich: 'VWL' },
        'hinzufuegen',
      )
      expect(patch).toEqual({ fachbereich: 'VWL' })
    })

    it('nur bloom dirty → nur bloom im Patch', () => {
      const patch = berechnePatch({ ...leererInput, bloom: 'K3' }, 'hinzufuegen')
      expect(patch).toEqual({ bloom: 'K3' })
    })

    it('nur status dirty → nur status im Patch', () => {
      const patch = berechnePatch(
        { ...leererInput, status: 'draft' },
        'hinzufuegen',
      )
      expect(patch).toEqual({ status: 'draft' })
    })

    it('nur gefaesse dirty (leeres Array zählt als dirty!) → nur gefaesse im Patch', () => {
      const patch = berechnePatch({ ...leererInput, gefaesse: [] }, 'hinzufuegen')
      expect(patch).toEqual({ gefaesse: [] })
    })

    it('nur semester dirty → nur semester im Patch', () => {
      const patch = berechnePatch(
        { ...leererInput, semester: ['1', '2'] },
        'hinzufuegen',
      )
      expect(patch).toEqual({ semester: ['1', '2'] })
    })

    it('nur lernzielIds dirty → nur lernzielIds im Patch', () => {
      const patch = berechnePatch(
        { ...leererInput, lernzielIds: ['lz1', 'lz2'] },
        'hinzufuegen',
      )
      expect(patch).toEqual({ lernzielIds: ['lz1', 'lz2'] })
    })
  })

  describe('Tag-Felder', () => {
    it('tagIds=[] + Modus "hinzufuegen" → kein Tag-Feld (No-Op)', () => {
      const patch = berechnePatch({ ...leererInput, tagIds: [] }, 'hinzufuegen')
      expect(patch).toEqual({})
    })

    it('tagIds=[] + Modus "ersetzen" → kein Tag-Feld (kein „Alle entfernen"-Trick)', () => {
      const patch = berechnePatch({ ...leererInput, tagIds: [] }, 'ersetzen')
      expect(patch).toEqual({})
    })

    it('tagIds=["t1"] + Modus "hinzufuegen" → tagsHinzufuegen gesetzt', () => {
      const patch = berechnePatch(
        { ...leererInput, tagIds: ['t1'] },
        'hinzufuegen',
      )
      expect(patch).toEqual({ tagsHinzufuegen: ['t1'] })
    })

    it('tagIds=["t1","t2"] + Modus "ersetzen" → tagsErsetzen gesetzt', () => {
      const patch = berechnePatch(
        { ...leererInput, tagIds: ['t1', 't2'] },
        'ersetzen',
      )
      expect(patch).toEqual({ tagsErsetzen: ['t1', 't2'] })
    })

    it('tagIds=["t1"] + Modus "entfernen" → tagsEntfernen gesetzt', () => {
      const patch = berechnePatch(
        { ...leererInput, tagIds: ['t1'] },
        'entfernen',
      )
      expect(patch).toEqual({ tagsEntfernen: ['t1'] })
    })

    it('Tag-Modi sind mutually exclusive — jeder Aufruf produziert nur EIN Tag-Feld', () => {
      const modi: TagsModus[] = ['hinzufuegen', 'ersetzen', 'entfernen']
      for (const m of modi) {
        const patch = berechnePatch({ ...leererInput, tagIds: ['t1'] }, m)
        const gesetzte = [
          patch.tagsHinzufuegen,
          patch.tagsErsetzen,
          patch.tagsEntfernen,
        ].filter((x) => x !== undefined)
        expect(gesetzte).toHaveLength(1)
      }
    })
  })

  describe('gemischter Input', () => {
    it('alle nicht-Tag-Felder dirty + tags → vollständiger Patch', () => {
      const patch = berechnePatch(
        {
          fachbereich: 'BWL',
          bloom: 'K4',
          status: 'sammlung',
          gefaesse: ['SF', 'EF'],
          semester: ['3'],
          lernzielIds: ['lz1'],
          tagIds: ['t1', 't2'],
        },
        'ersetzen',
      )
      expect(patch).toEqual({
        fachbereich: 'BWL',
        bloom: 'K4',
        status: 'sammlung',
        gefaesse: ['SF', 'EF'],
        semester: ['3'],
        lernzielIds: ['lz1'],
        tagsErsetzen: ['t1', 't2'],
      })
    })

    it('einige dirty + leere tagIds → nur dirty-Felder, kein Tag-Feld', () => {
      const patch = berechnePatch(
        {
          ...leererInput,
          fachbereich: 'Recht',
          bloom: 'K2',
          tagIds: [],
        },
        'hinzufuegen',
      )
      expect(patch).toEqual({ fachbereich: 'Recht', bloom: 'K2' })
    })
  })

  describe('Undefined-Semantik', () => {
    it('alle dirty-Werte explizit undefined → leerer Patch (kein Field-Key)', () => {
      const patch = berechnePatch(leererInput, 'hinzufuegen')
      expect(Object.keys(patch)).toEqual([])
    })

    it('status="draft" wird NICHT als falsy missinterpretiert (Backend-Wert valide)', () => {
      const patch = berechnePatch(
        { ...leererInput, status: 'draft' },
        'hinzufuegen',
      )
      expect(patch.status).toBe('draft')
    })

    it('semester=[] dirty (User löscht alle Zeitpunkte) → semester:[] im Patch', () => {
      const patch = berechnePatch({ ...leererInput, semester: [] }, 'hinzufuegen')
      expect(patch.semester).toEqual([])
    })
  })
})
