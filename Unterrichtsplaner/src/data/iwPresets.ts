/**
 * IW-Plan (Intensivwochen) Presets für Gym Hofwil.
 * Quelle: IW-Plan SJ 25/26 (IW_Plan_SJ_25_26_250710.pdf)
 *
 * Jeder Eintrag ist eine SpecialWeekConfig mit gymLevel.
 * Wird über den "IW-Plan laden"-Button in den SpecialWeeksEditor eingefügt.
 *
 * Legende:
 *   GYM1 = AK29 (29abcd) + 30fs (TaF GYM1)
 *   GYM2 = AK28 (28abcd) + 29fs (TaF GYM2)
 *   GYM3 = AK27 (27abcd) + 28f (TaF GYM3)
 *   GYM4 = AK26 (26abcd) + 27f (TaF GYM4)
 *   TaF  = alle TaF-Klassen gemeinsam
 *
 * Feiertage und Kollegiumsveranstaltungen sind KEINE Sonderwochen.
 */

import type { SpecialWeekConfig } from '../store/settingsStore';

export const IW_PRESET_2526: SpecialWeekConfig[] = [

  // ── KW 38 ──────────────────────────────────────────────────────────────
  { id: 'iw38-gym1', label: 'Klassenwoche', week: '38', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw38-taf',  label: 'IW TaF (G&K/MU/SP)', week: '38', type: 'event', gymLevel: 'TaF' },
  { id: 'iw38-gym2', label: 'SOL-Projekt', week: '38', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw38-gym3', label: 'Franzaufenthalt / Kompensation', week: '38', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw38-gym4', label: 'Studienreise', week: '38', type: 'event', gymLevel: 'GYM4' },

  // ── KW 46 (TaF-Woche) ─────────────────────────────────────────────────
  { id: 'iw46-taf', label: 'IW TaF (G&K/MU/SP)', week: '46', type: 'event', gymLevel: 'TaF' },

  // ── KW 12 ──────────────────────────────────────────────────────────────
  { id: 'iw12-gym2', label: 'Schneesportlager', week: '12', type: 'event', gymLevel: 'GYM2' },

  // ── KW 14 ──────────────────────────────────────────────────────────────
  { id: 'iw14-gym1', label: 'Gesundheit / Nothilfekurs', week: '14', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw14-gym2', label: 'Deutsch', week: '14', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw14-gym3', label: 'EF-Woche', week: '14', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw14-gym4', label: 'Französisch/Englisch', week: '14', type: 'event', gymLevel: 'GYM4' },

  // ── KW 25 ──────────────────────────────────────────────────────────────
  { id: 'iw25-gym1', label: 'Geografie und Sport', week: '25', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw25-gym2', label: 'Wirtschaftswoche', week: '25', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw25-gym3', label: 'Maturaarbeit', week: '25', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw25-gym4', label: 'Maturprüfung', week: '25', type: 'event', gymLevel: 'GYM4' },

  // ── KW 27 ──────────────────────────────────────────────────────────────
  { id: 'iw27-gym1', label: 'Medienwoche', week: '27', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw27-taf',  label: 'Spezialwoche TaF', week: '27', type: 'event', gymLevel: 'TaF' },
  { id: 'iw27-gym2', label: 'MINT', week: '27', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw27-gym3', label: 'Schwerpunktfach', week: '27', type: 'event', gymLevel: 'GYM3' },

];
