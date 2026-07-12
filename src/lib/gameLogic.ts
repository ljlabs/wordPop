// Game logic — extracted for testability

export interface Position {
  row: number;
  col: number;
}

export interface FoundWord {
  word: string;
  points: number;
}

// ─── Highlight durations (ms) ───
export const HIGHLIGHT_INVALID_MS = 500;
export const HIGHLIGHT_VALID_MS = 500;
export const HIGHLIGHT_HINT_MS = 1000;

export type HighlightType = 'selecting' | 'valid' | 'invalid' | 'duplicate' | 'hint' | null;

// ─── Scoring ───
// Boggle-style: 3-4 letters = 1pt, 5 = 2pts, 6 = 3pts, 7 = 5pts, 8+ = 11pts
export function scoreWord(word: string): number {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11;
}

// ─── Adjacency ───
export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

export function isValidPath(tiles: Position[]): boolean {
  if (tiles.length < 2) return true;
  const seen = new Set<string>();
  for (const t of tiles) {
    const key = `${t.row},${t.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  for (let i = 0; i < tiles.length - 1; i++) {
    if (!isAdjacent(tiles[i], tiles[i + 1])) return false;
  }
  return true;
}

// ─── Word extraction ───
export function extractWord(grid: string[][], tiles: Position[]): string {
  return tiles.map((t) => grid[t.row][t.col]).join('');
}

// ─── Word validation result ───
export type WordResult = 'valid' | 'too-short' | 'duplicate' | 'not-in-dictionary';

export interface ValidationResult {
  result: WordResult;
  word: string;
  points: number;
}

/**
 * Validate a word selection against the game rules.
 *
 * Rules:
 * 1. Must be at least 3 letters
 * 2. Must not already be in the found-words list
 * 3. Must be in the dictionary (passed as a Set for O(1) lookup)
 */
export function validateWord(
  grid: string[][],
  tiles: Position[],
  foundWords: FoundWord[],
  dictionary: Set<string>
): ValidationResult {
  const word = extractWord(grid, tiles);

  if (word.length < 3) {
    return { result: 'too-short', word, points: 0 };
  }

  if (foundWords.some((w) => w.word === word)) {
    return { result: 'duplicate', word, points: 0 };
  }

  if (!dictionary.has(word.toLowerCase())) {
    return { result: 'not-in-dictionary', word, points: 0 };
  }

  return { result: 'valid', word, points: scoreWord(word) };
}

// ─── Tile selection with backtracking ───
/**
 * Process a new tile hover during drag.
 *
 * Rules:
 * - Same tile as last: no change
 * - Tile is the second-to-last: backtrack (pop last tile)
 * - Tile already in path (not second-to-last): reject
 * - Tile not adjacent to last: reject
 * - Otherwise: add tile to path
 */
export function processTileSelection(
  prev: Position[],
  row: number,
  col: number
): Position[] {
  if (prev.length === 0) return [{ row, col }];

  const last = prev[prev.length - 1];

  // Same tile — no change
  if (last.row === row && last.col === col) return prev;

  // Backtracking: if the tile is the second-to-last, pop the last one off
  if (prev.length >= 2) {
    const secondLast = prev[prev.length - 2];
    if (secondLast.row === row && secondLast.col === col) {
      return prev.slice(0, -1);
    }
  }

  // Already in path (not the second-to-last) — reject
  if (prev.some((t) => t.row === row && t.col === col)) return prev;

  // Not adjacent — reject
  if (!isAdjacent(last, { row, col })) return prev;

  // Valid new tile — add it
  return [...prev, { row, col }];
}

// ─── Hint word finder ───
export interface HintResult {
  word: string;
  points: number;
  path: Position[];
}

/**
 * Find a valid unfound word on the grid using DFS.
 * Returns the first word found, or null if none exist.
 * Prioritizes longer words (more points) for better hints.
 */
export function findHintWord(
  grid: string[][],
  foundWords: FoundWord[],
  dictionary: Set<string>,
  minWordLength: number = 3
): HintResult | null {
  const size = grid.length;
  const foundSet = new Set(foundWords.map((w) => w.word));

  let bestHint: HintResult | null = null;

  function dfs(
    row: number,
    col: number,
    path: Position[],
    visited: Set<string>,
    currentWord: string
  ): void {
    // Check if this word is valid and unfound
    if (currentWord.length >= minWordLength && dictionary.has(currentWord.toLowerCase())) {
      if (!foundSet.has(currentWord)) {
        const pts = scoreWord(currentWord);
        // Keep the longest/best word found
        if (!bestHint || currentWord.length > bestHint.word.length ||
            (currentWord.length === bestHint.word.length && pts > bestHint.points)) {
          bestHint = { word: currentWord, points: pts, path: [...path] };
        }
      }
    }

    // Stop if we've found a decent word (8+ letters is a great hint)
    if (currentWord.length >= 8) return;

    // Explore neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited.has(key)) {
          visited.add(key);
          dfs(nr, nc, [...path, { row: nr, col: nc }], visited, currentWord + grid[nr][nc]);
          visited.delete(key);
        }
      }
    }
  }

  // Start DFS from every tile
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r},${c}`;
      const visited = new Set<string>([key]);
      dfs(r, c, [{ row: r, col: c }], visited, grid[r][c]);
      // Early exit if we found a great word
      if (bestHint && bestHint.word.length >= 6) return bestHint;
    }
  }

  return bestHint;
}
