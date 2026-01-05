import { ScoreData } from './types';

export function parseDigitParty(rawText: string): ScoreData | null {
  try {
    const lines = rawText.trim().split('\n');
    
    // Look for "digit.party" or "digit party" keyword
    let hasDigitParty = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('digit.party') || 
          line.toLowerCase().includes('digit party') ||
          line.toLowerCase().includes('https://digit.party')) {
        hasDigitParty = true;
        break;
      }
    }
    
    if (!hasDigitParty) {
      return null;
    }
    
    // Match pattern: "day X: Y points Z%"
    // Example: "day 1008: 194 points 95%"
    const scoreMatch = rawText.match(/day\s+([\d,]+):\s*(\d+)\s+points\s+(\d+)%/i);
    
    if (!scoreMatch) {
      return null;
    }
    
    const day = parseInt(scoreMatch[1].replace(/,/g, ''), 10);
    const points = parseInt(scoreMatch[2], 10);
    const percentage = parseInt(scoreMatch[3], 10);
    
    if (isNaN(day) || isNaN(points) || isNaN(percentage)) {
      return null;
    }
    
    // Validate reasonable ranges
    if (points < 0 || percentage < 0 || percentage > 100) {
      return null;
    }
    
    // Use today's date (can't convert day number to date without knowing start date)
    let gameDate = new Date().toISOString().split('T')[0];
    
    // Try to extract date from text if present
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
      gameType: 'digitparty',
      day,
      points,
      percentage,
      gameDate,
      // Standardized fields for ranking and display
      displayScore: `${points} points (${percentage}%)`,
      sortScore: points, // Positive so higher points (better) sort first when ascending
    };
  } catch (error) {
    return null;
  }
}
