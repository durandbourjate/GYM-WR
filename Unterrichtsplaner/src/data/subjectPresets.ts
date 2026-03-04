/**
 * Fachbereich-Vorlagen für Gymnasialfächer Kt. Bern (Lehrplan 17)
 * v3.82 E5: Einzelfächer statt Gruppen-Presets — 21 Einzelfächer
 */
import type { SubjectConfig } from '../store/settingsStore';

export interface SubjectPreset {
  id: string;
  label: string;
  icon: string;
  group: string;          // Gruppierungsüberschrift im Dropdown
  subjects: SubjectConfig[];
}

/** Gruppen-Reihenfolge im Dropdown */
export const SUBJECT_GROUPS = [
  'W&R',
  'Naturwissenschaften',
  'Sprachen',
  'Geistes-/Sozialwiss.',
  'Gestalterisch',
  'Mathe & Info',
  'Andere',
] as const;

export const SUBJECT_PRESETS: SubjectPreset[] = [
  // ── W&R ──
  {
    id: 'vwl', label: 'VWL', icon: '🎓', group: 'W&R',
    subjects: [{ id: 'vwl', label: 'VWL', shortLabel: 'VWL', color: '#f97316', courseType: 'SF' }],
  },
  {
    id: 'bwl', label: 'BWL', icon: '🎓', group: 'W&R',
    subjects: [{ id: 'bwl', label: 'BWL', shortLabel: 'BWL', color: '#3b82f6', courseType: 'SF' }],
  },
  {
    id: 'recht', label: 'Recht', icon: '🎓', group: 'W&R',
    subjects: [{ id: 'recht', label: 'Recht', shortLabel: 'RE', color: '#22c55e', courseType: 'SF' }],
  },

  // ── Naturwissenschaften ──
  {
    id: 'biologie', label: 'Biologie', icon: '🔬', group: 'Naturwissenschaften',
    subjects: [{ id: 'biologie', label: 'Biologie', shortLabel: 'BIO', color: '#16a34a', courseType: 'SF' }],
  },
  {
    id: 'chemie', label: 'Chemie', icon: '🔬', group: 'Naturwissenschaften',
    subjects: [{ id: 'chemie', label: 'Chemie', shortLabel: 'CH', color: '#dc2626', courseType: 'SF' }],
  },
  {
    id: 'physik', label: 'Physik', icon: '🔬', group: 'Naturwissenschaften',
    subjects: [{ id: 'physik', label: 'Physik', shortLabel: 'PH', color: '#7c3aed', courseType: 'SF' }],
  },

  // ── Sprachen ──
  {
    id: 'deutsch', label: 'Deutsch', icon: '🌍', group: 'Sprachen',
    subjects: [{ id: 'deutsch', label: 'Deutsch', shortLabel: 'DE', color: '#1d4ed8', courseType: 'KS' }],
  },
  {
    id: 'englisch', label: 'Englisch', icon: '🌍', group: 'Sprachen',
    subjects: [{ id: 'englisch', label: 'Englisch', shortLabel: 'EN', color: '#0369a1', courseType: 'KS' }],
  },
  {
    id: 'franzoesisch', label: 'Französisch', icon: '🌍', group: 'Sprachen',
    subjects: [{ id: 'franzoesisch', label: 'Französisch', shortLabel: 'FR', color: '#0891b2', courseType: 'KS' }],
  },
  {
    id: 'italienisch', label: 'Italienisch', icon: '🇮🇹', group: 'Sprachen',
    subjects: [{ id: 'italienisch', label: 'Italienisch', shortLabel: 'IT', color: '#b45309', courseType: 'SF' }],
  },
  {
    id: 'latein', label: 'Latein', icon: '🏛️', group: 'Sprachen',
    subjects: [{ id: 'latein', label: 'Latein', shortLabel: 'LA', color: '#6b7280', courseType: 'SF' }],
  },
  {
    id: 'spanisch', label: 'Spanisch', icon: '🇪🇸', group: 'Sprachen',
    subjects: [{ id: 'spanisch', label: 'Spanisch', shortLabel: 'ES', color: '#ef4444', courseType: 'SF' }],
  },

  // ── Geistes-/Sozialwiss. ──
  {
    id: 'geschichte', label: 'Geschichte', icon: '📜', group: 'Geistes-/Sozialwiss.',
    subjects: [{ id: 'geschichte', label: 'Geschichte', shortLabel: 'GS', color: '#b45309', courseType: 'KS' }],
  },
  {
    id: 'geografie', label: 'Geografie', icon: '🌎', group: 'Geistes-/Sozialwiss.',
    subjects: [{ id: 'geografie', label: 'Geografie', shortLabel: 'GG', color: '#0891b2', courseType: 'KS' }],
  },
  {
    id: 'philosophie', label: 'Philosophie', icon: '🤔', group: 'Geistes-/Sozialwiss.',
    subjects: [{ id: 'philosophie', label: 'Philosophie', shortLabel: 'PL', color: '#f59e0b', courseType: 'EF' }],
  },

  // ── Gestalterisch ──
  {
    id: 'bg', label: 'Bildnerisches Gestalten', icon: '🎨', group: 'Gestalterisch',
    subjects: [{ id: 'bg', label: 'Bildnerisches Gestalten', shortLabel: 'BG', color: '#ec4899', courseType: 'SF' }],
  },
  {
    id: 'musik', label: 'Musik', icon: '🎵', group: 'Gestalterisch',
    subjects: [{ id: 'musik', label: 'Musik', shortLabel: 'MU', color: '#8b5cf6', courseType: 'KS' }],
  },
  {
    id: 'sport', label: 'Sport', icon: '⚽', group: 'Gestalterisch',
    subjects: [{ id: 'sport', label: 'Sport', shortLabel: 'SP', color: '#10b981', courseType: 'KS' }],
  },

  // ── Mathe & Info ──
  {
    id: 'mathematik', label: 'Mathematik', icon: '📐', group: 'Mathe & Info',
    subjects: [{ id: 'mathematik', label: 'Mathematik', shortLabel: 'MA', color: '#1d4ed8', courseType: 'KS' }],
  },
  {
    id: 'informatik', label: 'Informatik', icon: '💻', group: 'Mathe & Info',
    subjects: [{ id: 'informatik', label: 'Informatik', shortLabel: 'IN', color: '#6366f1', courseType: 'IN' }],
  },

  // ── Andere ──
  {
    id: 'leer', label: 'Leer (Vorlage-Struktur)', icon: '✏️', group: 'Andere',
    subjects: [
      { id: 'fach1', label: 'Fachbereich 1', shortLabel: 'F1', color: '#3b82f6', courseType: 'KS' },
      { id: 'fach2', label: 'Fachbereich 2', shortLabel: 'F2', color: '#22c55e', courseType: 'KS' },
      { id: 'fach3', label: 'Fachbereich 3', shortLabel: 'F3', color: '#f97316', courseType: 'KS' },
    ],
  },
];
