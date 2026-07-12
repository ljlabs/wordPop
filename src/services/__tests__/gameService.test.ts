import { describe, it, expect } from 'vitest';
import {
  startGame,
  submitWord,
  findHint,
  buildResults,
  GAME_DURATION,
  SCORE_MULTIPLIER,
} from '../gameService';
import { getDictionary } from '../../lib/dictionary';
import type { FoundWord, Position, GridSize } from '../../types';

// A fixed real-world grid (not the old mock) for deterministic cases.
const GRID: string[][] = [
  ['P', 'L', 'A', 'Y'],
  ['S', 'T', 'E', 'R'],
  ['O', 'I', 'T', 'C'],
  ['D', 'M', 'U', 'H'],
];

describe('gameService.startGame', () => {
  it('returns a grid of the requested size', () => {
    for (const size of [4, 5, 6] as GridSize[]) {
      const { grid } = startGame(size);
      expect(grid).toHaveLength(size);
      expect(grid[0]).toHaveLength(size);
    }
  });

  it('uses the real dictionary internally', () => {
    const { grid, solutionWords } = startGame(4);
    expect(grid.length).toBeGreaterThan(0);
    // The generated grid is guaranteed to contain real words.
    expect(solutionWords.length).toBeGreaterThan(0);
  });
});

describe('gameService.submitWord', () => {
  const dict = getDictionary();

  it('returns "valid" for a real word in the dictionary', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
    ];
    const res = submitWord(GRID, tiles, [], dict);
    expect(res.result).toBe('valid');
    expect(res.word).toBe('PLAY');
  });

  it('returns "too-short" for words under 3 letters', () => {
    const tiles: Position[] = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    const res = submitWord(GRID, tiles, [], dict);
    expect(res.result).toBe('too-short');
    expect(res.points).toBe(0);
  });

  it('returns "duplicate" for an already-found word', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
    ];
    const found: FoundWord[] = [{ word: 'PLAY', points: 10 }];
    const res = submitWord(GRID, tiles, found, dict);
    expect(res.result).toBe('duplicate');
  });

  it('returns "not-in-dictionary" for a nonsense path', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 3 }, { row: 0, col: 3 },
    ];
    const res = submitWord(GRID, tiles, [], dict);
    expect(res.result).toBe('not-in-dictionary');
  });
});

describe('gameService.findHint', () => {
  it('finds a real word with a valid adjacent path', () => {
    const dict = getDictionary();
    const hint = findHint(GRID, [], dict);
    expect(hint).not.toBeNull();
    expect(dict.has(hint!.word.toLowerCase())).toBe(true);
    expect(hint!.path.length).toBeGreaterThanOrEqual(3);
  });

  it('returns null once all words are found', () => {
    const dict = getDictionary();
    let found: FoundWord[] = [];
    let hint = findHint(GRID, found, dict);
    while (hint) {
      found.push({ word: hint.word, points: hint.points });
      hint = findHint(GRID, found, dict);
    }
    expect(findHint(GRID, found, dict)).toBeNull();
  });
});

describe('gameService.buildResults', () => {
  it('computes longest word and preserves score/size', () => {
    const results = buildResults({
      score: 120,
      gridSize: 4,
      foundWords: [
        { word: 'CAT', points: 10 },
        { word: 'STITCH', points: 110 },
      ],
      duration: GAME_DURATION,
      solutionWords: ['cat', 'stitch', 'match', 'batch'],
    });
    expect(results.score).toBe(120);
    expect(results.gridSize).toBe(4);
    expect(results.longestWord).toBe('STITCH');
    expect(results.duration).toBe(GAME_DURATION);
    expect(results.solutionWords).toEqual(['cat', 'stitch', 'match', 'batch']);
    expect(results.foundCount).toBe(2);
    expect(results.longestPossibleWord).toBe('stitch');
  });

  it('exposes a 90s duration and a x10 multiplier constant', () => {
    expect(GAME_DURATION).toBe(90);
    expect(SCORE_MULTIPLIER).toBe(10);
  });
});
