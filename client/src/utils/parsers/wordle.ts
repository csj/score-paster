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
    // Wordle #1 was on June 19, 2021
    const wordleOriginDate = new Date('2021-06-19');
    const gameDateObj = new Date(wordleOriginDate);
    gameDateObj.setDate(wordleOriginDate.getDate() + (gameNumber - 1));
    const gameDate = gameDateObj.toISOString().split('T')[0];
    
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