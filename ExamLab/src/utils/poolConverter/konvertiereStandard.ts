import type {
  Frage,
  MCFrage,
  FreitextFrage,
  ZuordnungFrage,
  LueckentextFrage,
  RichtigFalschFrage,
  BerechnungFrage,
  SortierungFrage,
  FormelFrage,
  CodeFrage,
  VisualisierungFrage,
} from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'
import { berechnePunkte } from './punkte'

export function konvertiereStandard(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    // -------------------------------------------------------
    // mc → MCFrage (einzeln, mehrfachauswahl: false)
    // -------------------------------------------------------
    case 'mc': {
      const optionen = (poolFrage.options ?? []).map((opt) => ({
        id: genId(),
        text: opt.t,
        korrekt: opt.v === poolFrage.correct,
        feedback: undefined as string | undefined,
      }))
      const frage: MCFrage = {
        ...basis,
        typ: 'mc',
        fragetext: poolFrage.q,
        optionen,
        mehrfachauswahl: false,
        zufallsreihenfolge: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // multi → MCFrage (mehrfach, mehrfachauswahl: true)
    // -------------------------------------------------------
    case 'multi': {
      const korrektSet = new Set(
        Array.isArray(poolFrage.correct) ? (poolFrage.correct as string[]) : [],
      )
      const optionen = (poolFrage.options ?? []).map((opt) => ({
        id: genId(),
        text: opt.t,
        korrekt: korrektSet.has(opt.v),
        feedback: undefined as string | undefined,
      }))
      const frage: MCFrage = {
        ...basis,
        typ: 'mc',
        fragetext: poolFrage.q,
        optionen,
        mehrfachauswahl: true,
        zufallsreihenfolge: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // tf → RichtigFalschFrage (einzelne Aussage aus q + correct)
    // -------------------------------------------------------
    case 'tf': {
      const frage: RichtigFalschFrage = {
        ...basis,
        typ: 'richtigfalsch',
        fragetext: poolFrage.q,
        aussagen: [
          {
            id: genId(),
            text: poolFrage.q,
            korrekt: poolFrage.correct === true,
            erklaerung: poolFrage.explain,
          },
        ],
      }
      return frage
    }

    // -------------------------------------------------------
    // fill → LueckentextFrage
    // blanks.answer + blanks.alts → korrekteAntworten
    // -------------------------------------------------------
    case 'fill': {
      const luecken = (poolFrage.blanks ?? []).map((blank) => ({
        id: genId(),
        korrekteAntworten: [blank.answer, ...(blank.alts ?? [])],
        caseSensitive: false,
      }))
      const frage: LueckentextFrage = {
        ...basis,
        typ: 'lueckentext',
        fragetext: poolFrage.q,
        textMitLuecken: poolFrage.q,
        luecken,
      }
      return frage
    }

    // -------------------------------------------------------
    // calc → BerechnungFrage
    // rows → ergebnisse (answer→korrekt, tolerance→toleranz, unit→einheit)
    // -------------------------------------------------------
    case 'calc': {
      const ergebnisse = (poolFrage.rows ?? []).map((row) => ({
        id: genId(),
        label: row.label,
        korrekt: row.answer,
        toleranz: row.tolerance,
        einheit: row.unit,
      }))
      const frage: BerechnungFrage = {
        ...basis,
        typ: 'berechnung',
        fragetext: poolFrage.q,
        ergebnisse,
        rechenwegErforderlich: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // sort → ZuordnungFrage
    // items × categories → paare (item.t = links, categories[item.cat] = rechts)
    // -------------------------------------------------------
    case 'sort': {
      const cats = poolFrage.categories ?? []
      const paare = (poolFrage.items ?? []).map((item) => {
        if (typeof item === 'string') return { links: item, rechts: '' }
        return { links: item.t, rechts: cats[item.cat] ?? '' }
      })
      const frage: ZuordnungFrage = {
        ...basis,
        typ: 'zuordnung',
        fragetext: poolFrage.q,
        paare,
        zufallsreihenfolge: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // open → FreitextFrage (sample → musterlosung)
    // -------------------------------------------------------
    case 'open': {
      const frage: FreitextFrage = {
        ...basis,
        // Überschreibe musterlosung mit sample (falls vorhanden)
        musterlosung: poolFrage.sample ?? poolFrage.explain ?? '',
        typ: 'freitext',
        fragetext: poolFrage.q,
        laenge: berechnePunkte(poolFrage) <= 2 ? 'kurz' : berechnePunkte(poolFrage) <= 4 ? 'mittel' : 'lang',
      }
      return frage
    }

    // -------------------------------------------------------
    // sortierung → SortierungFrage
    // items: string[] in korrekter Reihenfolge
    // -------------------------------------------------------
    case 'sortierung': {
      // items können als string[] oder {t,cat}[] kommen — normalisieren
      const elemente = (poolFrage.items ?? []).map(item =>
        typeof item === 'string' ? item : item.t
      )
      const frage: SortierungFrage = {
        ...basis,
        typ: 'sortierung',
        fragetext: poolFrage.q,
        elemente,
        teilpunkte: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // formel → FormelFrage (LaTeX-basiert)
    // -------------------------------------------------------
    case 'formel': {
      const frage: FormelFrage = {
        ...basis,
        typ: 'formel',
        fragetext: poolFrage.q,
        korrekteFormel: (typeof poolFrage.correct === 'string' ? poolFrage.correct : '') || '',
        vergleichsModus: 'exakt',
      }
      return frage
    }

    // -------------------------------------------------------
    // code → CodeFrage
    // -------------------------------------------------------
    case 'code': {
      const frage: CodeFrage = {
        ...basis,
        typ: 'code',
        fragetext: poolFrage.q,
        sprache: poolFrage.sprache ?? 'python',
        starterCode: poolFrage.starterCode,
        musterLoesung: poolFrage.sample,
      }
      return frage
    }

    // zeichnen → VisualisierungFrage
    case 'zeichnen': {
      const frage: VisualisierungFrage = {
        ...basis,
        typ: 'visualisierung',
        fragetext: poolFrage.q,
      }
      return frage
    }
  }
  // Unreachable per type-narrowing in dispatcher; aber TS verlangt Return:
  throw new Error(`konvertiereStandard called with non-standard type: ${(poolFrage as { type: string }).type}`)
}
