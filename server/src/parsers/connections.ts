import { ScoreData } from './types.js';

export function parseConnections(rawText: string): ScoreData | null {
  try {
    // Connections format: "Connections Puzzle #XXX" or similar
    // May include mistakes or completion status
    
    const lines = rawText.trim().split('\n');
    
    // Look for "Connections" keyword
    let connectionsLine = '';
    for (const line of lines) {
      if (line.toLowerCase().includes('connections')) {
        connectionsLine = line.trim();
        break;
      }
    }
    
    if (!connectionsLine) {
      return null;
    }
    
    // Extract puzzle number
    // Pattern: Connections Puzzle #XXX or Connections #XXX
    const puzzleMatch = connectionsLine.match(/Connections.*?#(\d+)/i);
    
    if (!puzzleMatch) {
      return null;
    }
    
    const puzzleNumber = parseInt(puzzleMatch[1], 10);
    
    if (isNaN(puzzleNumber)) {
      return null;
    }
    
    // Extract mistakes (if present)
    // Pattern: "X mistakes" or "Perfect!" or similar
    let mistakes = 0;
    const mistakesMatch = rawText.match(/(\d+)\s*mistakes?/i);
    if (mistakesMatch) {
      mistakes = parseInt(mistakesMatch[1], 10);
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
    
    const displayScore = mistakes === 0 ? 'Perfect!' : `${mistakes} mistake${mistakes !== 1 ? 's' : ''}`;
    
    return {
      gameType: 'connections',
      puzzleNumber,
      mistakes,
      gameDate,
      // Standardized fields for ranking and display
      displayScore,
      sortScore: -mistakes, // Negative so lower mistakes (better) sort first when ascending
    };
  } catch (error) {
    return null;
  }
}