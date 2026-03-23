import { CURRICULUM_GOALS, type CurriculumGoal } from '../data/curriculumGoals';
import type { Fachbereich } from '../types';

/**
 * Phase 4: Auto-Suggest Lehrplanziele
 * 
 * Fuzzy-matches a thema string against curriculum goals,
 * returning scored suggestions ordered by relevance.
 */

interface SuggestResult {
  goal: CurriculumGoal;
  score: number;       // 0–1, higher = better match
  matchReason: string; // e.g. "topic: Preistheorie", "content: Elastizitäten"
}

// Normalize text for matching
function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue')
    .replace(/[–—]/g, '-').replace(/[^a-z0-9\s-]/g, '').trim();
}

// Tokenize into meaningful words (skip stopwords)
const STOPWORDS = new Set(['und', 'oder', 'der', 'die', 'das', 'ein', 'eine', 'von', 'zu', 'mit', 'in', 'auf', 'an', 'des', 'den', 'dem', 'als', 'fuer', 'bei', 'zum', 'zur']);

function tokenize(s: string): string[] {
  return norm(s).split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));
}

// Score how well a query matches a goal
function scoreGoal(queryTokens: string[], goal: CurriculumGoal, fachbereich?: Fachbereich): { score: number; reason: string } {
  if (queryTokens.length === 0) return { score: 0, reason: '' };

  let bestScore = 0;
  let bestReason = '';

  const topicNorm = norm(goal.topic);
  const contentsNorm = goal.contents.map(norm);

  // 1. Exact topic match (highest priority)
  const queryJoined = queryTokens.join(' ');
  if (topicNorm.includes(queryJoined) || queryJoined.includes(topicNorm)) {
    const overlap = Math.min(queryJoined.length, topicNorm.length) / Math.max(queryJoined.length, topicNorm.length);
    const s = 0.8 + 0.2 * overlap;
    if (s > bestScore) { bestScore = s; bestReason = `Thema: ${goal.topic}`; }
  }

  // 2. Token-by-token matching against topic
  const topicTokens = tokenize(goal.topic);
  const topicHits = queryTokens.filter(qt => topicTokens.some(tt => tt.includes(qt) || qt.includes(tt)));
  if (topicHits.length > 0) {
    const s = (topicHits.length / queryTokens.length) * 0.7 + (topicHits.length / Math.max(topicTokens.length, 1)) * 0.2;
    if (s > bestScore) { bestScore = s; bestReason = `Thema: ${goal.topic}`; }
  }

  // 3. Token matching against goal text
  const goalTokens = tokenize(goal.goal);
  const goalHits = queryTokens.filter(qt => goalTokens.some(gt => gt.includes(qt) || qt.includes(gt)));
  if (goalHits.length > 0) {
    const s = (goalHits.length / queryTokens.length) * 0.5;
    if (s > bestScore) { bestScore = s; bestReason = `Grobziel: ${goal.goal.slice(0, 60)}…`; }
  }

  // 4. Token matching against contents
  for (const content of goal.contents) {
    const cTokens = tokenize(content);
    const cHits = queryTokens.filter(qt => cTokens.some(ct => ct.includes(qt) || qt.includes(ct)));
    if (cHits.length > 0) {
      const s = (cHits.length / queryTokens.length) * 0.45;
      if (s > bestScore) {
        bestScore = s;
        const matched = contentsNorm.find(cn => cHits.some(h => cn.includes(h)));
        bestReason = `Inhalt: ${goal.contents.find((_, i) => norm(goal.contents[i]) === matched) || content}`;
      }
    }
  }

  // 5. Subject area bonus
  if (fachbereich && goal.area === fachbereich) {
    bestScore *= 1.2; // 20% boost for matching subject area
  }

  return { score: Math.min(bestScore, 1), reason: bestReason };
}

/**
 * Suggest curriculum goals based on a topic string.
 * Returns top N matches with score > threshold.
 */
export function suggestGoals(
  thema: string,
  fachbereich?: Fachbereich,
  maxResults = 3,
  threshold = 0.2,
  goals?: CurriculumGoal[]
): SuggestResult[] {
  const queryTokens = tokenize(thema);
  if (queryTokens.length === 0) return [];

  const source = goals ?? CURRICULUM_GOALS;
  const scored = source
    .map(goal => {
      const { score, reason } = scoreGoal(queryTokens, goal, fachbereich);
      return { goal, score, matchReason: reason };
    })
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored;
}

/**
 * Infer subject area from a topic string by finding the best-matching
 * curriculum goal and returning its area. Returns undefined if no
 * confident match is found (score < 0.35).
 */
export function suggestFachbereich(thema: string, goals?: CurriculumGoal[]): Fachbereich | undefined {
  const queryTokens = tokenize(thema);
  if (queryTokens.length === 0) return undefined;

  const source = goals ?? CURRICULUM_GOALS;
  let bestScore = 0;
  let bestArea: Fachbereich | undefined;

  for (const goal of source) {
    // Score without subject area bonus to get unbiased match
    const { score } = scoreGoal(queryTokens, goal);
    if (score > bestScore) {
      bestScore = score;
      bestArea = goal.area;
    }
  }

  // Only return if we have a confident match
  return bestScore >= 0.35 ? bestArea : undefined;
}
