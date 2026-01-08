import { describe, it, expect } from '@jest/globals';
import { parseConnections } from '../connections';

describe('parseConnections', () => {
  it('should parse a Connections puzzle with 1 mistake', () => {
    const testPaste = `Connections
Puzzle #942
🟩🟩🟩🟩
🟨🟨🟨🟨
🟦🟦🟦🟪
🟦🟦🟦🟦
🟪🟪🟪🟪`;

    const result = parseConnections(testPaste);

    expect(result).not.toBeNull();
    expect(result?.puzzleNumber).toBe(942);
    expect(result?.mistakes).toBe(1);
    expect(result?.displayScore).toBe('1 mistake');
    expect(result?.gameType).toBe('connections');
  });

  it('should parse a perfect Connections puzzle', () => {
    const testPaste = `Connections
Puzzle #100
🟩🟩🟩🟩
🟨🟨🟨🟨
🟦🟦🟦🟦
🟪🟪🟪🟪`;

    const result = parseConnections(testPaste);

    expect(result).not.toBeNull();
    expect(result?.puzzleNumber).toBe(100);
    expect(result?.mistakes).toBe(0);
    expect(result?.displayScore).toBe('Perfect!');
  });

  it('should parse a Connections puzzle with multiple mistakes', () => {
    const testPaste = `Connections
Puzzle #200
🟩🟩🟩🟨
🟩🟩🟩🟩
🟨🟨🟨🟦
🟨🟨🟨🟨
🟦🟦🟦🟦
🟪🟪🟪🟪`;

    const result = parseConnections(testPaste);

    expect(result).not.toBeNull();
    expect(result?.mistakes).toBe(2);
    expect(result?.displayScore).toBe('2 mistakes');
  });

  it('should return null for invalid input', () => {
    const result = parseConnections('Not a Connections puzzle');
    expect(result).toBeNull();
  });
});
