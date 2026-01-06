import { ScoreData } from './types';

export function parseWordle(rawText: string): ScoreData | null {
  try {
    const lines = rawText.trim().split('\n');
    
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
    
    // Calculate date from game number
    // Wordle #1 was on June 19, 2021, but we need to account for the actual puzzle numbering
    // Using June 20, 2021 as origin to align with current game numbers
    // Use local date components to avoid timezone issues
    const wordleOriginDate = new Date(2021, 5, 20); // Month is 0-indexed, so 5 = June
    const gameDateObj = new Date(wordleOriginDate);
    gameDateObj.setDate(wordleOriginDate.getDate() + (gameNumber - 1));
    // Format as YYYY-MM-DD in local time
    const year = gameDateObj.getFullYear();
    const month = String(gameDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(gameDateObj.getDate()).padStart(2, '0');
    const gameDate = `${year}-${month}-${day}`;
    
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