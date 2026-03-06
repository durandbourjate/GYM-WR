import type { BlockCategory, LessonDetail } from '../types';

// === Block-Kategorie / Untertyp-System ===
export interface CategoryDef {
  key: BlockCategory;
  label: string;
  labelShort: string;
  icon: string;
  color: string;
}

export interface SubtypeDef {
  key: string;
  label: string;
  labelShort: string;
  icon: string;
  custom?: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'LESSON', label: 'Lektion', labelShort: 'Lekt.', icon: '📖', color: '#3b82f6' },
  { key: 'ASSESSMENT', label: 'Beurteilung', labelShort: 'Beurt.', icon: '📝', color: '#ef4444' },
  { key: 'EVENT', label: 'Event', labelShort: 'Event', icon: '📅', color: '#f59e0b' },
  { key: 'HOLIDAY', label: 'Ferien/Frei', labelShort: 'Frei', icon: '🏖', color: '#6b7280' },
];

export const DEFAULT_SUBTYPES: Record<BlockCategory, SubtypeDef[]> = {
  LESSON: [
    { key: 'einfuehrung', label: 'Einführung', labelShort: 'Einf.', icon: '🚀' },
    { key: 'theorie', label: 'Theorie', labelShort: 'Theo.', icon: '📘' },
    { key: 'uebung', label: 'Übung', labelShort: 'Übg.', icon: '✏️' },
    { key: 'sol', label: 'Selbstorganisiertes Lernen', labelShort: 'SOL', icon: '📚' },
    { key: 'diskussion', label: 'Diskussion', labelShort: 'Disk.', icon: '💬' },
  ],
  ASSESSMENT: [
    { key: 'pruefung', label: 'Prüfung schriftlich', labelShort: 'Prüf.', icon: '📝' },
    { key: 'pruefung_muendlich', label: 'Prüfung mündlich', labelShort: 'Mdl.', icon: '🎤' },
    { key: 'praesentation', label: 'Präsentation', labelShort: 'Präs.', icon: '🎯' },
    { key: 'projektabgabe', label: 'Projektabgabe', labelShort: 'Proj.', icon: '📦' },
  ],
  EVENT: [
    { key: 'exkursion', label: 'Exkursion', labelShort: 'Exk.', icon: '🚌' },
    { key: 'tag_offen', label: 'Tag der offenen Tür', labelShort: 'TdoT', icon: '🏫' },
    { key: 'ausfall', label: 'Ausfall', labelShort: 'Ausf.', icon: '❌' },
    { key: 'auftrag', label: 'Auftrag', labelShort: 'Auftr.', icon: '📋' },
  ],
  HOLIDAY: [],
};

// Custom subtypes persistence
const CUSTOM_SUBTYPES_KEY = 'unterrichtsplaner-custom-subtypes';

export function loadCustomSubtypes(): Record<string, SubtypeDef[]> {
  try {
    const data = localStorage.getItem(CUSTOM_SUBTYPES_KEY);
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

export function saveCustomSubtypes(custom: Record<string, SubtypeDef[]>) {
  localStorage.setItem(CUSTOM_SUBTYPES_KEY, JSON.stringify(custom));
}

export function getSubtypesForCategory(category: BlockCategory): SubtypeDef[] {
  const defaults = DEFAULT_SUBTYPES[category] || [];
  const custom = loadCustomSubtypes();
  const customForCat = (custom[category] || []).map(s => ({ ...s, custom: true }));
  return [...defaults, ...customForCat];
}

// Migration helper: old BlockType → new category + subtype
export function migrateBlockType(blockType?: string): { category?: BlockCategory; subtype?: string } {
  if (!blockType) return {};
  const map: Record<string, { category: BlockCategory; subtype?: string }> = {
    'LESSON': { category: 'LESSON' },
    'INTRO': { category: 'LESSON', subtype: 'einfuehrung' },
    'SELF_STUDY': { category: 'LESSON', subtype: 'sol' },
    'DISCUSSION': { category: 'LESSON', subtype: 'diskussion' },
    'EXAM': { category: 'ASSESSMENT', subtype: 'pruefung' },
    'EXAM_ORAL': { category: 'ASSESSMENT', subtype: 'pruefung_muendlich' },
    'EXAM_LONG': { category: 'ASSESSMENT', subtype: 'pruefung' },
    'PRESENTATION': { category: 'ASSESSMENT', subtype: 'praesentation' },
    'PROJECT_DUE': { category: 'ASSESSMENT', subtype: 'projektabgabe' },
    'EVENT': { category: 'EVENT' },
    'HOLIDAY': { category: 'HOLIDAY' },
  };
  return map[blockType] || {};
}

// Get effective category/subtype from detail (with migration)
export function getEffectiveCategorySubtype(detail: LessonDetail): { category?: BlockCategory; subtype?: string } {
  if (detail.blockCategory) return { category: detail.blockCategory, subtype: detail.blockSubtype };
  return migrateBlockType(detail.blockType);
}

// Format display labels
export function getCategoryLabel(category: BlockCategory, long = true): string {
  const cat = CATEGORIES.find(c => c.key === category);
  return cat ? (long ? cat.label : cat.labelShort) : category;
}

export function getSubtypeLabel(category: BlockCategory, subtype: string, long = true): string {
  const subtypes = getSubtypesForCategory(category);
  const st = subtypes.find(s => s.key === subtype);
  return st ? (long ? st.label : st.labelShort) : subtype;
}
