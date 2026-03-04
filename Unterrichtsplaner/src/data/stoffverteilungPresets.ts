/**
 * Stoffverteilung-Vorlagen für verschiedene Fächer (v3.80 C6)
 */
import type { StoffverteilungEntry } from '../store/settingsStore';

export interface StoffverteilungPreset {
  id: string;
  label: string;
  icon: string;
  data: StoffverteilungEntry[];
}

export const STOFFVERTEILUNG_PRESETS: StoffverteilungPreset[] = [
  {
    id: 'wr-sf-duy',
    label: 'W&R Schwerpunktfach (DUY, Lehrplan 17 Kt. Bern)',
    icon: '📘',
    data: [
      { semester: 'S1', gym: 'GYM1', weights: { BWL: 3, RECHT: 0, VWL: 0 } },
      { semester: 'S2', gym: 'GYM1', weights: { BWL: 2, RECHT: 1, VWL: 0 } },
      { semester: 'S3', gym: 'GYM2', weights: { BWL: 1, RECHT: 2, VWL: 2 } },
      { semester: 'S4', gym: 'GYM2', weights: { BWL: 0, RECHT: 3, VWL: 2 } },
      { semester: 'S5', gym: 'GYM3', weights: { BWL: 0, RECHT: 2, VWL: 2 } },
      { semester: 'S6', gym: 'GYM3', weights: { BWL: 2, RECHT: 0, VWL: 2 } },
      { semester: 'S7', gym: 'GYM4', weights: { BWL: 0, RECHT: 2, VWL: 2 } },
      { semester: 'S8', gym: 'GYM4', weights: { BWL: 2, RECHT: 0, VWL: 2 } },
    ],
  },
  {
    id: 'wr-ef',
    label: 'W&R Ergänzungsfach',
    icon: '📗',
    data: [
      { semester: 'S5', gym: 'GYM3', weights: { BWL: 1, RECHT: 1, VWL: 1 } },
      { semester: 'S6', gym: 'GYM3', weights: { BWL: 1, RECHT: 1, VWL: 1 } },
      { semester: 'S7', gym: 'GYM4', weights: { BWL: 1, RECHT: 1, VWL: 1 } },
      { semester: 'S8', gym: 'GYM4', weights: { BWL: 1, RECHT: 1, VWL: 1 } },
    ],
  },
  {
    id: 'leer',
    label: 'Leere Vorlage',
    icon: '✏️',
    data: [
      { semester: 'S1', gym: 'GYM1', weights: {} },
      { semester: 'S2', gym: 'GYM1', weights: {} },
      { semester: 'S3', gym: 'GYM2', weights: {} },
      { semester: 'S4', gym: 'GYM2', weights: {} },
      { semester: 'S5', gym: 'GYM3', weights: {} },
      { semester: 'S6', gym: 'GYM3', weights: {} },
      { semester: 'S7', gym: 'GYM4', weights: {} },
      { semester: 'S8', gym: 'GYM4', weights: {} },
    ],
  },
];
