import { parseWordle, ScoreData } from './wordle';
import { parseConnections } from './connections';

export type Parser = (rawText: string) => ScoreData | null;

const parsers: Parser[] = [
  parseWordle,
  parseConnections,
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

export { ScoreData };