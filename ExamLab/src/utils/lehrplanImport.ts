// Konvertiert bestehende Preset-Formate in das zentrale Lernziel-Format

interface PresetLehrplanziel {
  id: string
  area: string
  cycle: number
  topic: string
  goal: string
  contents: string[]
  semester: string
}

interface ZentralesLernziel {
  id: string
  ebene: 'grob' | 'fein'
  parentId: string
  fach: string
  gefaess: string
  semester: string
  thema: string
  text: string
  bloom: string
}

/** Konvertiert Planer-Preset-Lehrplanziele (id, area, cycle, topic, goal, contents, semester)
 *  in das zentrale Format (id, ebene, parentId, fach, gefaess, semester, thema, text, bloom) */
export function konvertierePresetLehrplanziele(presets: PresetLehrplanziel[]): ZentralesLernziel[] {
  return presets.map(p => ({
    id: p.id,
    ebene: 'grob' as const,
    parentId: '',
    fach: areaZuFach(p.area),
    gefaess: 'SF',
    semester: p.semester,
    thema: p.topic,
    text: p.goal,
    bloom: '',
  }))
}

/** Mappt Planer-area-Codes auf die zentralen Fachbezeichnungen */
function areaZuFach(area: string): string {
  switch (area) {
    case 'RECHT': return 'Recht'
    case 'VWL': return 'VWL'
    case 'BWL': return 'BWL'
    default: return area
  }
}
