/**
 * IW-Plan (Intensivwochen) Presets für Gym Hofwil.
 * Quelle: IW-Plan SJ 25/26 (Stand 02.03.2026)
 *
 * Jeder Eintrag ist eine SpecialWeekConfig mit gymLevel.
 * Wird über den "IW-Plan laden"-Button in den SpecialWeeksEditor eingefügt.
 */

import type { SpecialWeekConfig } from '../store/settingsStore';

export const IW_PRESET_2526: SpecialWeekConfig[] = [
  // IW 38
  { id: 'iw38-gym1', label: 'Klassenwoche', week: '38', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw38-gym2', label: 'SOL-Projekt', week: '38', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw38-gym3', label: 'Franz-Aufenthalt', week: '38', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw38-gym4', label: 'Studienreise', week: '38', type: 'event', gymLevel: 'GYM4' },
  // IW 46 — nur TaF, Unterricht gem. Stundenplan für Regelklassen
  { id: 'iw46-taf', label: 'IW TaF', week: '46', type: 'event', gymLevel: 'TaF' },
  // IW 12
  { id: 'iw12-gym2', label: 'Schneesportlager', week: '12', type: 'event', gymLevel: 'GYM2' },
  // IW 14
  { id: 'iw14-gym1', label: 'Nothilfekurs/Gesundheit', week: '14', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw14-gym2', label: 'Deutsch', week: '14', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw14-gym3', label: 'EF-Woche', week: '14', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw14-gym4', label: 'Franz/Englisch', week: '14', type: 'event', gymLevel: 'GYM4' },
  // IW 25
  { id: 'iw25-gym1', label: 'Geo + Sport', week: '25', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw25-gym2', label: 'Wirtschaftswoche', week: '25', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw25-gym3', label: 'Maturaarbeit', week: '25', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw25-gym4', label: 'Maturprüfung', week: '25', type: 'event', gymLevel: 'GYM4' },
  // IW 27
  { id: 'iw27-gym1', label: 'Medienwoche', week: '27', type: 'event', gymLevel: 'GYM1' },
  { id: 'iw27-gym2', label: 'MINT', week: '27', type: 'event', gymLevel: 'GYM2' },
  { id: 'iw27-gym3', label: 'Schwerpunktfach', week: '27', type: 'event', gymLevel: 'GYM3' },
  { id: 'iw27-gym4', label: 'Studienreise', week: '27', type: 'event', gymLevel: 'GYM4' },
];
