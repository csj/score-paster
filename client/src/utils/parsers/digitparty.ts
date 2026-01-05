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
    
    // Calculate date from day number
    // Digit Party day 1 was on April 3, 2023
    // (Calculated: day 1008 on 2026-01-05 means day 1 = 2023-04-03)
    const digitPartyOriginDate = new Date('2023-04-03');
    const gameDateObj = new Date(digitPartyOriginDate);
    gameDateObj.setDate(digitPartyOriginDate.getDate() + (day - 1));
    const gameDate = gameDateObj.toISOString().split('T')[0];
    
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
