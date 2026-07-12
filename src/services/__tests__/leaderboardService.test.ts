import { describe, it, expect } from 'vitest';
import { recordGame, topBySize } from '../leaderboardService';
import { AVATAR_COUNT } from '../../lib/avatars';
import type { GameRecord, GameResults } from '../../types';

const RESULTS: GameResults = {
  score: 1500,
  gridSize: 4,
  words: [
    { word: 'CAT', points: 10 },
    { word: 'STITCH', points: 110 },
  ],
  longestWord: 'STITCH',
  duration: 90,
  solutionWords: ['cat', 'stitch', 'match'],
  foundCount: 2,
  longestPossibleWord: 'stitch',
};

describe('leaderboardService.recordGame', () => {
  it('produces a GameRecord from results', () => {
    const rec = recordGame(RESULTS);
    expect(rec.score).toBe(1500);
    expect(rec.gridSize).toBe(4);
    expect(rec.duration).toBe(90);
    expect(rec.longestWord).toBe('STITCH');
    expect(rec.words).toHaveLength(2);
  });

  it('stamps an id and a positive date', () => {
    const rec = recordGame(RESULTS);
    expect(typeof rec.id).toBe('string');
    expect(rec.id.length).toBeGreaterThan(0);
    expect(rec.date).toBeGreaterThan(0);
  });

  it('assigns an avatar index within the palette', () => {
    for (let i = 0; i < 20; i++) {
      const rec = recordGame(RESULTS);
      expect(rec.avatarIndex).toBeGreaterThanOrEqual(0);
      expect(rec.avatarIndex).toBeLessThan(AVATAR_COUNT);
    }
  });
});

describe('leaderboardService.topBySize', () => {
  const games: GameRecord[] = [
    { id: 'a', score: 100, gridSize: 4, words: [], longestWord: 'A', date: 1, duration: 90, avatarIndex: 0 },
    { id: 'b', score: 300, gridSize: 5, words: [], longestWord: 'B', date: 2, duration: 90, avatarIndex: 0 },
    { id: 'c', score: 200, gridSize: 4, words: [], longestWord: 'C', date: 3, duration: 90, avatarIndex: 0 },
  ];

  it('filters by grid size', () => {
    expect(topBySize(games, 4).map((g) => g.id)).toEqual(['c', 'a']);
    expect(topBySize(games, 5).map((g) => g.id)).toEqual(['b']);
  });

  it('sorts by score descending', () => {
    expect(topBySize(games, 4).map((g) => g.score)).toEqual([200, 100]);
  });
});
