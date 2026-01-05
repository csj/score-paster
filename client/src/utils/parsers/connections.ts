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
          // Extract just the emoji blocks from the line
          const blocks = line.match(/[🟦🟨🟩🟪⬛]/g);
          if (blocks && blocks.length >= 4) {
            gridRows.push(blocks.slice(0, 4).join('')); // Take first 4 blocks
          }
        }
      }
      
      // Count how many rows have all 4 blocks matching (perfect rows)
      let perfectRows = 0;
      for (const row of gridRows) {
        if (row.length === 4) {
          const firstBlock = row[0];
          if (row.split('').every(block => block === firstBlock)) {
            perfectRows++;
          }
        }
      }
      
      // In Connections, you need 4 perfect rows for a perfect game
      // If you have fewer than 4 perfect rows, you made mistakes
      // The number of mistakes is typically: 4 - perfectRows
      // But we need to be careful - if there are fewer than 4 rows total, 
      // the user might not have completed the game
      if (gridRows.length === 4) {
        // Game completed - mistakes = 4 - perfectRows
        mistakes = 4 - perfectRows;
      } else if (gridRows.length > 0) {
        // Partial game - assume mistakes based on incomplete rows
        // This is a heuristic - we can't know exact mistakes from partial games
        mistakes = Math.max(0, 4 - perfectRows);
      }
      // If no grid found, mistakes stays 0 (will show as "Perfect!" but user can correct)
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