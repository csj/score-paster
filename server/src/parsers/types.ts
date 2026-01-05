// Shared ScoreData type for all parsers
export interface ScoreData {
  gameType: string;
  gameDate: string; // YYYY-MM-DD
  // Standardized fields for ranking and display
  displayScore: string; // Human-readable score (e.g., "4/6", "Perfect!", "1,234")
  sortScore: number; // Numeric value for sorting (always ascending: negative for "lower is better", positive for "higher is better")
  // Game-specific fields (e.g., gameNumber, guesses, puzzleNumber, etc.)
  [key: string]: unknown;
}
