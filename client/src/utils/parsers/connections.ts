import { ScoreData } from './wordle';

export function parseConnections(rawText: string): ScoreData | null {
  try {
    const lines = rawText.trim().split('\n');
    
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
    
    const puzzleMatch = connectionsLine.match(/Connections.*?#(\d+)/i);
    
    if (!puzzleMatch) {
      return null;
    }
    
    const puzzleNumber = parseInt(puzzleMatch[1], 10);
    
    if (isNaN(puzzleNumber)) {
      return null;
    }
    
    let mistakes = 0;
    const mistakesMatch = rawText.match(/(\d+)\s*mistakes?/i);
    if (mistakesMatch) {
      mistakes = parseInt(mistakesMatch[1], 10);
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
      gameType: 'connections',
      puzzleNumber,
      mistakes,
      gameDate,
    };
  } catch (error) {
    return null;
  }
}