/**
 * Fachbereich-Vorlagen für verschiedene Schulfächer (v3.80 C4)
 */
import type { SubjectConfig } from '../store/settingsStore';

export interface SubjectPreset {
  id: string;
  label: string;
  icon: string;
  subjects: SubjectConfig[];
}

export const SUBJECT_PRESETS: SubjectPreset[] = [
  {
    id: 'wr',
    label: 'W&R (VWL / BWL / Recht)',
    icon: '🎓',
    subjects: [
      { id: 'vwl', label: 'VWL', shortLabel: 'VWL', color: '#f97316', courseType: 'SF' },
      { id: 'bwl', label: 'BWL', shortLabel: 'BWL', color: '#3b82f6', courseType: 'SF' },
      { id: 'recht', label: 'Recht', shortLabel: 'RE', color: '#22c55e', courseType: 'SF' },
    ],
  },
  {
    id: 'nawi',
    label: 'Naturwissenschaften (Bio / Chemie / Physik)',
    icon: '🔬',
    subjects: [
      { id: 'bio', label: 'Biologie', shortLabel: 'BIO', color: '#22c55e', courseType: 'SF' },
      { id: 'chemie', label: 'Chemie', shortLabel: 'CH', color: '#a855f7', courseType: 'SF' },
      { id: 'physik', label: 'Physik', shortLabel: 'PH', color: '#3b82f6', courseType: 'SF' },
    ],
  },
  {
    id: 'sprachen',
    label: 'Sprachen (Deutsch / Englisch / Französisch)',
    icon: '🌍',
    subjects: [
      { id: 'deutsch', label: 'Deutsch', shortLabel: 'DE', color: '#ef4444', courseType: 'KS' },
      { id: 'englisch', label: 'Englisch', shortLabel: 'EN', color: '#3b82f6', courseType: 'KS' },
      { id: 'franzoesisch', label: 'Französisch', shortLabel: 'FR', color: '#f59e0b', courseType: 'KS' },
    ],
  },
  {
    id: 'mint',
    label: 'Mathematik & Informatik',
    icon: '📐',
    subjects: [
      { id: 'mathe', label: 'Mathematik', shortLabel: 'MA', color: '#6366f1', courseType: 'KS' },
      { id: 'informatik', label: 'Informatik', shortLabel: 'IN', color: '#06b6d4', courseType: 'IN' },
    ],
  },
  {
    id: 'leer',
    label: 'Leer (Vorlage-Struktur)',
    icon: '✏️',
    subjects: [
      { id: 'fach1', label: 'Fachbereich 1', shortLabel: 'F1', color: '#3b82f6', courseType: 'KS' },
      { id: 'fach2', label: 'Fachbereich 2', shortLabel: 'F2', color: '#22c55e', courseType: 'KS' },
      { id: 'fach3', label: 'Fachbereich 3', shortLabel: 'F3', color: '#f97316', courseType: 'KS' },
    ],
  },
];
