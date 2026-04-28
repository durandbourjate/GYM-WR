/**
 * Pure builder: nimmt den Editor-State und liefert eine synthetische Frage-Form
 * zur Pflichtfeld-/Empfohlen-Validierung. Wird von SharedFragenEditor's
 * `aktuelleFrage` useMemo aufgerufen — kein React-State, keine Side-Effects.
 *
 * Ziel: 21-Typ-Switch raus aus SharedFragenEditor.tsx (DRY + LOC-Reduktion).
 *
 * NICHT identisch zu `speichereJetzt`-Switch: dieser baut die finale Frage über
 * `FrageBasis` mit id/version/erstelltAm/... — andere Struktur, anderer Output-Typ.
 * Hier reicht das Minimum, das `validierePflichtfelder` braucht.
 */
import type { Frage } from '../types/fragen'

export interface FragePreviewState {
  id?: string
  typ: string
  fragetext: string
  // MC
  optionen?: unknown[]
  mehrfachauswahl?: boolean
  // Freitext
  musterlosung?: string
  bewertungsraster?: unknown[]
  // Lückentext
  textMitLuecken?: string
  luecken?: unknown[]
  lueckentextModus?: string
  // Zuordnung
  paare?: unknown[]
  // R/F
  aussagen?: unknown[]
  // Berechnung
  ergebnisse?: unknown[]
  // Buchungssatz
  geschaeftsfall?: string
  buchungen?: unknown[]
  // T-Konto
  tkAufgabentext?: string
  tkKonten?: unknown[]
  // Kontenbestimmung
  kbAufgabentext?: string
  kbAufgaben?: unknown[]
  // Bilanz/ER
  biAufgabentext?: string
  biKontenMitSaldi?: unknown[]
  // Aufgabengruppe
  agKontext?: string
  agTeilaufgaben?: unknown[]
  // Visualisierung
  canvasConfig?: unknown
  // PDF
  pdfDriveFileId?: string
  pdfUrl?: string
  pdfBase64?: string
  pdfErlaubteWerkzeuge?: unknown[]
  // Sortierung
  sortElemente?: unknown[]
  // Bild-Fragetypen (Hotspot, Bildbeschriftung, DragDropBild)
  bildUrl?: string
  // Hotspot
  hsBereiche?: unknown[]
  // Bildbeschriftung
  bbBeschriftungen?: unknown[]
  // DragDropBild
  ddZielzonen?: unknown[]
  ddLabels?: unknown[]
  // Code
  codeSprache?: string
  codeMusterLoesungCode?: string
  // Formel
  formelKorrekteFormel?: string
}

/**
 * Liefert eine synthetische Frage-Form für `validierePflichtfelder`. Muss strukturell
 * spiegeln, was die jeweilige Validator-Funktion in pflichtfeldValidation.ts liest.
 *
 * Bei unbekanntem `typ` returnen wir das Basis-Objekt — Validator behandelt das
 * defensiv (DEFAULT_KONSERVATIV).
 */
export function buildFragePreview(s: FragePreviewState): Frage {
  const id = s.id ?? 'preview'
  const basis = { id, typ: s.typ, fragetext: s.fragetext }
  switch (s.typ) {
    case 'mc':
      return { ...basis, optionen: s.optionen, mehrfachauswahl: s.mehrfachauswahl } as unknown as Frage
    case 'freitext':
      return { ...basis, musterlosung: s.musterlosung, bewertungsraster: s.bewertungsraster } as unknown as Frage
    case 'lueckentext':
      return {
        ...basis,
        textMitLuecken: s.textMitLuecken,
        luecken: s.luecken,
        lueckentextModus: s.lueckentextModus,
      } as unknown as Frage
    case 'zuordnung':
      return { ...basis, paare: s.paare } as unknown as Frage
    case 'richtigfalsch':
      return { ...basis, aussagen: s.aussagen } as unknown as Frage
    case 'berechnung':
      return { ...basis, ergebnisse: s.ergebnisse } as unknown as Frage
    case 'buchungssatz':
      return {
        ...basis,
        fragetext: s.geschaeftsfall ?? '',
        geschaeftsfall: s.geschaeftsfall,
        buchungen: s.buchungen,
      } as unknown as Frage
    case 'tkonto':
      return {
        ...basis,
        aufgabentext: s.tkAufgabentext,
        konten: s.tkKonten,
      } as unknown as Frage
    case 'kontenbestimmung':
      return {
        ...basis,
        aufgabentext: s.kbAufgabentext,
        aufgaben: s.kbAufgaben,
      } as unknown as Frage
    case 'bilanzstruktur':
      return {
        ...basis,
        aufgabentext: s.biAufgabentext,
        kontenMitSaldi: s.biKontenMitSaldi,
      } as unknown as Frage
    case 'aufgabengruppe':
      return {
        ...basis,
        kontext: s.agKontext,
        teilaufgaben: s.agTeilaufgaben,
      } as unknown as Frage
    case 'visualisierung':
      return {
        ...basis,
        untertyp: 'frei',
        canvasConfig: s.canvasConfig,
      } as unknown as Frage
    case 'pdf':
      return {
        ...basis,
        pdfDriveFileId: s.pdfDriveFileId,
        pdfUrl: s.pdfUrl,
        pdfBase64: s.pdfBase64,
        pdfErlaubteWerkzeuge: s.pdfErlaubteWerkzeuge,
      } as unknown as Frage
    case 'sortierung':
      return { ...basis, elemente: s.sortElemente } as unknown as Frage
    case 'hotspot':
      return { ...basis, bildUrl: s.bildUrl, bereiche: s.hsBereiche } as unknown as Frage
    case 'bildbeschriftung':
      return {
        ...basis,
        bildUrl: s.bildUrl,
        beschriftungen: s.bbBeschriftungen,
      } as unknown as Frage
    case 'dragdrop_bild':
      return {
        ...basis,
        bildUrl: s.bildUrl,
        zielzonen: s.ddZielzonen,
        labels: s.ddLabels,
      } as unknown as Frage
    case 'code':
      return {
        ...basis,
        sprache: s.codeSprache,
        musterloesung: s.codeMusterLoesungCode,
      } as unknown as Frage
    case 'formel':
      return { ...basis, korrekteFormel: s.formelKorrekteFormel } as unknown as Frage
    default:
      return basis as unknown as Frage
  }
}
