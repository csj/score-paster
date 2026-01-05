import { ScoreData } from './types.js';

export function parseWordle(rawText: string): ScoreData | null {
  try {
    // Wordle format: "Wordle XXX X/6" where XXX is game number, X is guesses used
    // May also include date or grid representation
    
    const lines = rawText.trim().split('\n');
    
    // Look for "Wordle" keyword
    let wordleLine = '';
    for (const line of lines) {
      if (line.toLowerCase().includes('wordle')) {
        wordleLine = line.trim();
        break;
      }
    }
    
    if (!wordleLine) {
      return null;
    }
    
    // Extract game number and guesses
    // Pattern: Wordle XXX X/6 or Wordle 1,661 5/6 (game number may have commas)
    // Match game number with optional commas (e.g., "1,661" or "1661")
    const match = wordleLine.match(/Wordle\s+([\d,]+)\s+(\d+)\/(\d+)/i);
    
    if (!match) {
      return null;
    }
    
    // Remove commas from game number before parsing
    const gameNumber = parseInt(match[1].replace(/,/g, ''), 10);
    const guesses = parseInt(match[2], 10);
    const maxGuesses = parseInt(match[3], 10);
    
    if (isNaN(gameNumber) || isNaN(guesses) || isNaN(maxGuesses)) {
      return null;
    }
    
    if (guesses < 1 || guesses > maxGuesses) {
      return null;
    }
    
    // Try to extract date from the text or use today's date
    let gameDate = new Date().toISOString().split('T')[0];
    
    // Look for date patterns in the text
    const dateMatch = rawText.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
    if (dateMatch) {
      try {
        const parsedDate = new Date(dateMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          gameDate = parsedDate.toISOString().split('T')[0];
        }
      } catch {
        // Use default date
      }
    }
    
    return {
      gameType: 'wordle',
      gameNumber,
      guesses,
      maxGuesses,
      gameDate,
      // Standardized fields for ranking and display
      displayScore: `${guesses}/${maxGuesses}`,
      sortScore: -guesses, // Negative so lower guesses (better) sort first when ascending
    };
  } catch (error) {
    return null;
  }
}