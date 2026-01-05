import { parseWordle } from './wordle.js';
import { parseConnections } from './connections.js';
import type { ScoreData } from './types.js';

export type Parser = (rawText: string) => ScoreData | null;

// Registry of all parsers
const parsers: Parser[] = [
  parseWordle,
  parseConnections,
];

/**
 * Try all parsers in order until one succeeds
 * Returns the first successful parse result, or null if all fail
 */
export function tryParseScore(rawText: string): { gameType: string; scoreData: ScoreData } | null {
  for (const parser of parsers) {
    const result = parser(rawText);
    if (result) {
      return {
        gameType: result.gameType,
        scoreData: result,
      };
    }
  }
  
  return null;
}

export type { ScoreData };