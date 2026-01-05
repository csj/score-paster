import { Score } from '../database/models.js';

/**
 * Compare two scores for ranking
 * Returns negative if a should rank before b, positive if b should rank before a
 * Always sorts by sortScore ascending (negative values for "lower is better" games)
 * If scores are equal and currentUserId is provided, prioritizes the current user
 */
export function compareScores(a: Score, b: Score, currentUserId?: string): number {
  // First sort by game date (most recent first)
  if (a.gameDate !== b.gameDate) {
    return b.gameDate.localeCompare(a.gameDate);
  }
  
  // Then sort by sortScore (ascending - negative values for "lower is better" come first)
  const aSortScore = (a.scoreData as any).sortScore ?? 0;
  const bSortScore = (b.scoreData as any).sortScore ?? 0;
  
  const scoreDiff = aSortScore - bSortScore;
  
  // If scores are equal and we have a current user, prioritize their score
  if (scoreDiff === 0 && currentUserId) {
    if (a.userId === currentUserId && b.userId !== currentUserId) {
      return -1; // Current user's score comes first
    }
    if (b.userId === currentUserId && a.userId !== currentUserId) {
      return 1; // Current user's score comes first
    }
  }
  
  return scoreDiff;
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