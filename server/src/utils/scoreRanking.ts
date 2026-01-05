import { Score } from '../database/models.js';

/**
 * Compare two scores for ranking
 * Returns negative if a should rank before b, positive if b should rank before a
 * Always sorts by sortScore ascending (negative values for "lower is better" games)
 */
export function compareScores(a: Score, b: Score): number {
  // First sort by game date (most recent first)
  if (a.gameDate !== b.gameDate) {
    return b.gameDate.localeCompare(a.gameDate);
  }
  
  // Then sort by sortScore (ascending - negative values for "lower is better" come first)
  const aSortScore = (a.scoreData as any).sortScore ?? 0;
  const bSortScore = (b.scoreData as any).sortScore ?? 0;
  
  return aSortScore - bSortScore;
}

/**
 * Get display score for a score
 * Returns the displayScore field from scoreData
 */
export function getDisplayScore(score: Score): string {
  const scoreData = score.scoreData as any;
  
  // Use displayScore if present
  if (scoreData.displayScore) {
    return scoreData.displayScore;
  }
  
  // Fallback for legacy scores (shouldn't happen with new parsers)
  return JSON.stringify(scoreData);
}