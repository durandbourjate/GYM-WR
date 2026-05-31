import type { Course, LessonType } from '../types';

/** Erkennt den LessonType aus dem Zellinhalt (Heuristik, nur Vorbelegung). */
export function detectLessonType(text: string): LessonType {
  const t = text.toLowerCase();
  if (!t || t === '-' || t === '—') return 0;
  if (/(ferien|auffahrt|pfingst)/.test(t)) return 6;
  if (/(prüfung|test|pw |prüf\.)/.test(t)) return 4;
  if (/(studienreise|sporttag|iw\d|besuchstag|tag d\.|fachschaftstag|schneesport|aufnahme|intensiv|orientierungslauf|konferenz|ma präs)/.test(t)) return 5;
  if (/(progr|krypto|rtpp|byod|vsc |excel|projekt|vortrag|darknet|metadaten|rastergr|vektorgr|gesichtser)/.test(t)) return 3;
  if (/(bwl|market|fibu|swot|porter|csr|standort|untern|st\. galler|selbstbeurteil|nwa)/.test(t)) return 1;
  if (/(recht|vwl|or at|grundr|miete|person|gesellsch|genossensch|sozial|sozv|bip|preis|lorenzkurve|staats|marktversagen|wohnungsm|elastiz|gefangenen|ökon|dollar|gerechtigkeit|iconomix|ungleich|kosten-gewinn)/.test(t)) return 2;
  return 0;
}

/**
 * Matcht einen Excel-Spalten-Header gegen die (dynamischen) Kurse und gibt die
 * `col` des ersten Treffers zurück, sonst null. Quelle der Kurse ist bewusst ein
 * Parameter (nicht statische COURSES), damit der Import in dieselben col-Keys
 * schreibt, die die Anzeige liest — auch bei selbst-definierten Kursen (col 100+).
 */
export function matchHeaderToCourse(header: string, courses: Course[]): number | null {
  const h = String(header).toLowerCase().trim();
  if (!h) return null;
  for (const c of courses) {
    const cls = c.cls.toLowerCase();
    const dayMatch = c.day.toLowerCase();
    if (h.includes(cls) || h === `${cls} ${dayMatch}` || h === `${dayMatch} ${cls}`) {
      return c.col;
    }
  }
  return null;
}

/**
 * Parst eine Kalenderwoche aus dem Zellinhalt (KW-Muster oder reine Zahl 1-52),
 * padded auf 2 Stellen. Gibt null, wenn die Woche nicht im erlaubten Bereich
 * (`allowedWeeks`, aus der aktiven Planer-Instanz) liegt.
 */
export function parseWeekFromCell(firstCell: string, allowedWeeks: string[]): string | null {
  const cell = String(firstCell || '').trim();
  let weekW: string | null = null;
  const kwMatch = cell.match(/(?:kw|woche)\s*(\d{1,2})/i);
  if (kwMatch) {
    weekW = kwMatch[1].padStart(2, '0');
  } else {
    const num = parseInt(cell);
    if (num >= 1 && num <= 52) {
      weekW = String(num).padStart(2, '0');
    }
  }
  if (weekW && !allowedWeeks.includes(weekW)) weekW = null;
  return weekW;
}
