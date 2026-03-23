import type { ManagedSequence, LessonDetail, Course } from '../types';

/**
 * Parse a duration string like "45 min", "1.5h", "90min", "2 Lektionen" into minutes.
 * Returns 0 if unparseable.
 */
export function parseDurationToMinutes(dur?: string): number {
  if (!dur) return 0;
  const s = dur.trim().toLowerCase();
  // "45 min" / "45min" / "45 Minuten"
  let m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:min(?:uten)?|m)$/);
  if (m) return parseFloat(m[1].replace(',', '.'));
  // "1.5h" / "1.5 h" / "2 Stunden"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:h|stunden?)$/);
  if (m) return parseFloat(m[1].replace(',', '.')) * 60;
  // "2 Lektionen" / "3L" / "1 Lektion"
  m = s.match(/^(\d+(?:[.,]\d+)?)\s*(?:l(?:ektionen?|\.?)?)$/);
  if (m) return parseFloat(m[1].replace(',', '.')) * 45; // 1 Lektion = 45 min
  // Plain number → assume minutes
  m = s.match(/^(\d+(?:[.,]\d+)?)$/);
  if (m) return parseFloat(m[1].replace(',', '.'));
  return 0;
}

/**
 * Format minutes back to a readable string.
 */
export function formatMinutes(mins: number): string {
  if (mins <= 0) return '';
  if (mins % 60 === 0 && mins >= 60) return `${mins / 60}h`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  return `${mins} min`;
}

/**
 * Count SOL entries and sum their durations across all lessons in a sequence.
 */
export function computeSeqSolTotal(
  seq: ManagedSequence,
  lessonDetails: Record<string, LessonDetail>,
  courses: Course[],
): { count: number; totalMinutes: number; formatted: string } {
  // Find all course cols for this sequence
  const kursIds = seq.kursIds?.length ? seq.kursIds : [seq.kursId];
  const cols = kursIds.map(cid => courses.find(c => c.id === cid)?.col).filter((c): c is number => c != null);

  let count = 0;
  let totalMinutes = 0;

  for (const block of seq.blocks) {
    for (const weekW of block.weeks) {
      for (const col of cols) {
        const key = `${weekW}-${col}`;
        const detail = lessonDetails[key];
        if (detail?.sol?.enabled) {
          count++;
          totalMinutes += parseDurationToMinutes(detail.sol.duration);
        }
      }
    }
  }

  // Also add sequence-level SOL duration if present
  if (seq.sol?.enabled && seq.sol.duration) {
    totalMinutes += parseDurationToMinutes(seq.sol.duration);
  }

  return { count, totalMinutes, formatted: formatMinutes(totalMinutes) };
}
