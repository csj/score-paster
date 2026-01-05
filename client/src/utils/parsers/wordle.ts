export interface ScoreData {
  gameType: string;
  gameNumber?: number;
  guesses: number;
  maxGuesses: number;
  gameDate: string;
  [key: string]: unknown;
}

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
    
    const match = wordleLine.match(/Wordle\s+(\d+)\s+(\d+)\/(\d+)/i);
    
    if (!match) {
      return null;
    }
    
    const gameNumber = parseInt(match[1], 10);
    const guesses = parseInt(match[2], 10);
    const maxGuesses = parseInt(match[3], 10);
    
    if (isNaN(gameNumber) || isNaN(guesses) || isNaN(maxGuesses)) {
      return null;
    }
    
    if (guesses < 1 || guesses > maxGuesses) {
      return null;
    }
    
    let gameDate = new Date().toISOString().split('T')[0];
    
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
    };
  } catch (error) {
    return null;
  }
}