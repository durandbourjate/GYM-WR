/**
 * Category definition — the single source of truth for subject area metadata.
 * Used by all components that need category labels, colors, or keys.
 */
export interface CategoryDefinition {
  key: string;           // Internal key, stored in data (e.g. 'VWL', 'BWL', 'Recht')
  label: string;         // Display label (e.g. 'VWL', 'Recht', 'Français')
  shortLabel: string;    // Compact label for badges (e.g. 'VWL', 'R', 'FR')
  color: string;         // Primary color hex (e.g. '#f97316')
  bg: string;            // Light background
  fg: string;            // Foreground / text color
  border: string;        // Border color
}

/**
 * Default W&R categories matching LearningView color scheme.
 * Used for legacy planners and as preset for new W&R planners.
 */
export const WR_CATEGORIES: CategoryDefinition[] = [
  { key: 'BWL',      label: 'BWL',             shortLabel: 'BWL',  color: '#3b82f6', bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' },
  { key: 'VWL',      label: 'VWL',             shortLabel: 'VWL',  color: '#f97316', bg: '#fff7ed', fg: '#9a3412', border: '#fdba74' },
  { key: 'Recht',    label: 'Recht',           shortLabel: 'Recht', color: '#22c55e', bg: '#dcfce7', fg: '#166534', border: '#86efac' },
  { key: 'Informatik', label: 'Informatik',    shortLabel: 'IN',   color: '#6b7280', bg: '#f3f4f6', fg: '#4b5563', border: '#d1d5db' },
  { key: 'Interdisziplinaer', label: 'Interdisziplinär', shortLabel: 'ID', color: '#a855f7', bg: '#f5f3ff', fg: '#5b21b6', border: '#c4b5fd' },
];

/** Fallback colors for unknown categories */
export const FALLBACK_CATEGORY: Omit<CategoryDefinition, 'key' | 'label' | 'shortLabel'> = {
  color: '#64748b', bg: '#f1f5f9', fg: '#475569', border: '#cbd5e1',
};

/**
 * Convert SubjectConfig[] (from plannerSettings) to CategoryDefinition[].
 * Fills in bg/fg/border from WR defaults if available, otherwise generates them.
 */
export function subjectConfigsToCategories(
  subjects: { id: string; label: string; shortLabel: string; color: string }[]
): CategoryDefinition[] {
  return subjects.map(s => {
    // Try to find matching WR default for full color set (case-insensitive)
    const idUp = s.id.toUpperCase();
    const wrMatch = WR_CATEGORIES.find(wr => wr.key.toUpperCase() === idUp || wr.key === s.id);
    if (wrMatch && wrMatch.color === s.color) {
      return { ...wrMatch, label: s.label, shortLabel: s.shortLabel };
    }
    // Generate light/dark variants from primary color
    return {
      key: s.id,
      label: s.label,
      shortLabel: s.shortLabel,
      color: s.color,
      ...generateColorVariants(s.color),
    };
  });
}

/**
 * Generate bg/fg/border from a primary hex color.
 */
export function generateColorVariants(hex: string): { bg: string; fg: string; border: string } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Light background: mix with white (90% white)
  const bgR = Math.round(r * 0.1 + 230);
  const bgG = Math.round(g * 0.1 + 230);
  const bgB = Math.round(b * 0.1 + 230);
  // Dark foreground: darken by 40%
  const fgR = Math.round(r * 0.6);
  const fgG = Math.round(g * 0.6);
  const fgB = Math.round(b * 0.6);
  // Border: lighten by 30%
  const brR = Math.min(255, Math.round(r * 0.7 + 76));
  const brG = Math.min(255, Math.round(g * 0.7 + 76));
  const brB = Math.min(255, Math.round(b * 0.7 + 76));
  return {
    bg: `#${bgR.toString(16).padStart(2, '0')}${bgG.toString(16).padStart(2, '0')}${bgB.toString(16).padStart(2, '0')}`,
    fg: `#${fgR.toString(16).padStart(2, '0')}${fgG.toString(16).padStart(2, '0')}${fgB.toString(16).padStart(2, '0')}`,
    border: `#${brR.toString(16).padStart(2, '0')}${brG.toString(16).padStart(2, '0')}${brB.toString(16).padStart(2, '0')}`,
  };
}

/**
 * Look up a category by key. Returns fallback colors if not found.
 */
export function getCategoryColors(categories: CategoryDefinition[], key?: string): { bg: string; fg: string; border: string } {
  if (!key) return FALLBACK_CATEGORY;
  const cat = categories.find(c => c.key === key);
  if (cat) return { bg: cat.bg, fg: cat.fg, border: cat.border };
  return FALLBACK_CATEGORY;
}

/**
 * Build a Record<string, {bg, fg, border}> from categories — drop-in replacement
 * for the old hardcoded FACHBEREICH_COLORS.
 */
export function categoriesToColorMap(categories: CategoryDefinition[]): Record<string, { bg: string; fg: string; border: string }> {
  const map: Record<string, { bg: string; fg: string; border: string }> = {};
  for (const cat of categories) {
    map[cat.key] = { bg: cat.bg, fg: cat.fg, border: cat.border };
  }
  return map;
}

/**
 * Legacy lessonType → Fachbereich mapping (W&R-specific).
 * In the old Excel import, type 1=BWL, 2=VWL, 3=IN.
 * Used by ZoomYearView, ZoomBlockView, and WeekRows for color inference.
 */
export function inferFachbereichFromLessonType(lt?: number): string | undefined {
  if (lt === 1) return 'BWL';
  if (lt === 2) return 'VWL';
  if (lt === 3) return 'Informatik';
  return undefined;
}

/**
 * Dark-mode block colors for Zoom 2 (ZoomYearView).
 * Generated from WR_CATEGORIES with darkened bg.
 */
export const WR_BLOCK_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  VWL:      { bg: '#7c2d12', fg: '#fde6cc', border: '#ea580c' },
  BWL:      { bg: '#1e3a5f', fg: '#dbeafe', border: '#3b82f6' },
  Recht:    { bg: '#14532d', fg: '#d1fae5', border: '#22c55e' },
  Informatik: { bg: '#374151', fg: '#e5e7eb', border: '#6b7280' },
  Interdisziplinaer: { bg: '#4c1d95', fg: '#ede9fe', border: '#8b5cf6' },
};
export const DEFAULT_BLOCK_COLOR = { bg: '#334155', fg: '#cbd5e1', border: '#64748b' };
export function getBlockColors(sa?: string) { return (sa && WR_BLOCK_COLORS[sa]) || DEFAULT_BLOCK_COLOR; }
