import type { ScoreData } from './types';
import { parseWordle } from './wordle';
import { parseConnections } from './connections';
import { parseDigitParty } from './digitparty';

export type Parser = (rawText: string) => ScoreData | null;

const parsers: Parser[] = [
  parseWordle,
  parseConnections,
  parseDigitParty,
];

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