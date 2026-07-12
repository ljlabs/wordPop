// Leaderboard business logic — pure, framework-agnostic.

import type { GameRecord, GameResults, GridSize } from '../types';
import { randomAvatarIndex } from '../lib/avatars';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function recordGame(results: GameResults): GameRecord {
  const longestWord = results.words.reduce<string>(
    (best, w) => (w.word.length > best.length ? w.word : best),
    ''
  );
  return {
    id: generateId(),
    score: results.score,
    gridSize: results.gridSize as GridSize,
    words: results.words,
    longestWord,
    date: Date.now(),
    duration: results.duration,
    avatarIndex: randomAvatarIndex(),
  };
}

// Filter by grid size and sort by score descending (highest first).
export function topBySize(games: GameRecord[], size: GridSize): GameRecord[] {
  return games
    .filter((g) => g.gridSize === size)
    .sort((a, b) => b.score - a.score);
}
