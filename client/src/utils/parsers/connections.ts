import { ScoreData } from './types';

export function parseConnections(rawText: string): ScoreData | null {
  try {
    const lines = rawText.trim().split('\n');
    
    // Find the line with "Connections"
    let connectionsLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes('connections')) {
        connectionsLineIndex = i;
        break;
      }
    }
    
    if (connectionsLineIndex === -1) {
      return null;
    }
    
    // Try to find puzzle number in the same line or the next few lines
    let puzzleNumber: number | null = null;
    
    // First, try the same line
    const sameLineMatch = lines[connectionsLineIndex].match(/#([\d,]+)/i);
    if (sameLineMatch) {
      puzzleNumber = parseInt(sameLineMatch[1].replace(/,/g, ''), 10);
    } else {
      // Try the next 2 lines (in case "Puzzle #939" is on a separate line)
      for (let i = connectionsLineIndex + 1; i <= connectionsLineIndex + 2 && i < lines.length; i++) {
        const puzzleMatch = lines[i].match(/#([\d,]+)/i);
        if (puzzleMatch) {
          puzzleNumber = parseInt(puzzleMatch[1].replace(/,/g, ''), 10);
          break;
        }
      }
    }
    
    if (puzzleNumber === null || isNaN(puzzleNumber)) {
      return null;
    }
    
    // Calculate date from puzzle number
    // Connections #1 was on June 12, 2023
    // Use local date components to avoid timezone issues
    const connectionsOriginDate = new Date(2023, 5, 12); // Month is 0-indexed, so 5 = June
    const gameDateObj = new Date(connectionsOriginDate);
    gameDateObj.setDate(connectionsOriginDate.getDate() + (puzzleNumber - 1));
    // Format as YYYY-MM-DD in local time
    const year = gameDateObj.getFullYear();
    const month = String(gameDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(gameDateObj.getDate()).padStart(2, '0');
    const gameDate = `${year}-${month}-${day}`;
    
    // Try to extract mistakes from text first
    let mistakes = 0;
    const mistakesMatch = rawText.match(/(\d+)\s*mistakes?/i);
    if (mistakesMatch) {
      mistakes = parseInt(mistakesMatch[1], 10);
    } else {
      // If no explicit mistake count, infer from grid pattern
      // A perfect Connections game has 4 rows, each with 4 blocks of the same color
      // Grid rows contain emoji blocks: 🟦🟨🟩🟪⬛
      const gridRowPattern = /[🟦🟨🟩🟪⬛]{4,}/;
      const gridRows: string[] = [];
      
      // Find lines that look like grid rows (contain 4+ emoji blocks)
      for (const line of lines) {
        if (gridRowPattern.test(line)) {
          // Extract full emoji characters (each emoji is 2 code units)
          // Match emoji pattern and group into full emojis
          const emojiMatches = line.match(/[🟦🟨🟩🟪⬛]/g);
          if (emojiMatches) {
            // Group into full emojis (every 2 code units = 1 emoji)
            const fullEmojis: string[] = [];
            for (let i = 0; i < emojiMatches.length; i += 2) {
              if (i + 1 < emojiMatches.length) {
                fullEmojis.push(emojiMatches[i] + emojiMatches[i + 1]);
              }
            }
            if (fullEmojis.length >= 4) {
              gridRows.push(fullEmojis.slice(0, 4).join('')); // Take first 4 emojis
            }
          }
        }
      }
      
      // Count non-perfect rows (rows where not all 4 blocks match)
      // Each non-perfect row represents a mistake
      // Note: Each emoji is 2 code units, so a row with 4 emojis has length 8
      for (const row of gridRows) {
        // Extract individual emojis (each is 2 code units)
        const emojis: string[] = [];
        for (let i = 0; i < row.length; i += 2) {
          emojis.push(row.slice(i, i + 2));
        }
        // Check if all emojis are the same
        if (emojis.length === 4) {
          const firstEmoji = emojis[0];
          if (!emojis.every(emoji => emoji === firstEmoji)) {
            mistakes++;
          }
        }
      }
      // If no grid found, mistakes stays 0 (will show as "Perfect!" but user can correct)
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