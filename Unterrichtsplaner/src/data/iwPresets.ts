/**
 * IW-Plan (Intensivwochen) Presets für Gym Hofwil.
 * Quelle: IW-Plan SJ 25/26 (IW_Plan_SJ_25_26_250710.pdf)
 *
 * Jeder Eintrag ist eine SpecialWeekConfig mit gymLevel (einzelner String).
 * Wird über den "IW-Plan laden"-Button in den SpecialWeeksEditor eingefügt.
 *
 * v3.89 L3: Labels korrigiert gemäss HANDOFF-Mapping-Tabelle.
 *   Wo «— (Unterricht)» steht: kein Eintrag nötig (regulärer Unterricht).
 *
 * Legende:
 *   GYM1 = AK29 (29abcd) + 30fs (TaF GYM1)
 *   GYM2 = AK28 (28abcd) + 29fs (TaF GYM2)
 *   GYM3 = AK27 (27abcd) + 28f (TaF GYM3)
 *   GYM4 = AK26 (26abcd) + 27f (TaF GYM4)
 *   TaF  = alle TaF-Klassen gemeinsam
 */

import type { SpecialWeekConfig } from '../store/settingsStore';

export const IW_PRESET_2526: SpecialWeekConfig[] = [

  // ── KW 38 ──────────────────────────────────────────────────────────────
  { id: 'iw38-gym1', label: 'Klassenwoche',                                  week: '38', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw38-gym2', label: 'SOL-Projekt / Auftrittskompetenz',              week: '38', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw38-gym3', label: 'Studienreise / Franz.aufenthalt Komp.',         week: '38', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw38-gym4', label: 'Studienreise (Klassenverband)',                 week: '38', type: 'event', gymLevel: 'GYM4' },
  { id: 'iw38-taf',  label: 'IW TaF (G&K/MU/SP)',                           week: '38', type: 'event', gymLevel: 'TaF' },

  // ── KW 46 (nur TaF) ───────────────────────────────────────────────────
  { id: 'iw46-taf', label: 'IW TaF (G&K/MU/SP)', week: '46', type: 'event', gymLevel: 'TaF' },

  // ── KW 12 (nur GYM2) ──────────────────────────────────────────────────
  { id: 'iw12-gym2', label: 'Schneesportlager', week: '12', type: 'event', gymLevel: 'GYM2' },

  // ── KW 14 ──────────────────────────────────────────────────────────────
  { id: 'iw14-gym1', label: 'Nothilfekurs / Gesundheit / Sicherheit',        week: '14', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw14-gym2', label: 'Nothilfekurs / Gesundheit (reduz.)',            week: '14', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw14-gym3', label: 'EF-Woche (Deutsch, Franz./Engl.)',              week: '14', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw14-gym4', label: 'Ergänzungsfach / Maturvorbereitung',            week: '14', type: 'event', gymLevel: 'GYM4' },
  { id: 'iw14-taf',  label: 'MU TaF / Sport GF BG',                         week: '14', type: 'event', gymLevel: 'TaF' },

  // ── KW 25 ──────────────────────────────────────────────────────────────
  { id: 'iw25-gym1', label: 'Geografie und Sport',                           week: '25', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw25-gym2', label: 'Wirtschaft und Arbeit',                         week: '25', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw25-gym3', label: 'Maturaarbeit',                                  week: '25', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw25-gym4', label: 'Maturprüfung',                                  week: '25', type: 'event', gymLevel: 'GYM4' },
  { id: 'iw25-taf',  label: 'Maturprüfung',                                  week: '25', type: 'event', gymLevel: 'TaF' },

  // ── KW 27 ──────────────────────────────────────────────────────────────
  { id: 'iw27-gym1', label: 'Medienwoche',                                   week: '27', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw27-gym2', label: 'Spezialwoche TaF MINT',                         week: '27', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw27-gym3', label: 'Französisch/Englisch (5HT)',                    week: '27', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw27-gym4', label: 'Studienreise (Klassenverband)',                 week: '27', type: 'event', gymLevel: 'GYM4' },
  { id: 'iw27-taf',  label: 'Englisch (5HT) / SF-Woche',                    week: '27', type: 'event', gymLevel: 'TaF' },

];
