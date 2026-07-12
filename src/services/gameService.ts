// Game business logic — orchestrates the pure engine in ../lib.
// No React / store imports: this is the testable service layer.

import type { GridSize, GameResults, FoundWord, Position } from '../types';
import { generatePlayableGrid, type GridData } from '../lib/gridGenerator';
import { validateWord, findHintWord, processTileSelection, type ValidationResult, type HintResult } from '../lib/gameLogic';
import { getDictionary } from '../lib/dictionary';

// Seconds per round (timed game — abandons on exit, never resumes).
export const GAME_DURATION = 90;

// Score multiplier used across the live session (kept here so the UI doesn't
// hardcode it). Mirrors the previous Game.tsx behavior (points * 10).
export const SCORE_MULTIPLIER = 10;

export function startGame(size: GridSize): GridData {
  return generatePlayableGrid(size);
}

export function submitWord(
  grid: string[][],
  tiles: Position[],
  foundWords: FoundWord[],
  dictionary: Set<string>
): ValidationResult {
  return validateWord(grid, tiles, foundWords, dictionary);
}

export function findHint(
  grid: string[][],
  foundWords: FoundWord[],
  dictionary: Set<string>
): HintResult | null {
  return findHintWord(grid, foundWords, dictionary);
}

export function buildResults(input: {
  score: number;
  gridSize: GridSize;
  foundWords: FoundWord[];
  duration: number;
  solutionWords: string[];
}): GameResults {
  const longestWord = input.foundWords.reduce<string>(
    (best, w) => (w.word.length > best.length ? w.word : best),
    ''
  );
  const longestPossibleWord = input.solutionWords.reduce(
    (best, w) => (w.length > best.length ? w : best),
    ''
  );
  return {
    score: input.score,
    gridSize: input.gridSize,
    words: input.foundWords,
    longestWord,
    duration: input.duration,
    solutionWords: input.solutionWords,
    foundCount: input.foundWords.length,
    longestPossibleWord,
  };
}

export { processTileSelection, getDictionary };
