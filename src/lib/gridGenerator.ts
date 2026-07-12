import { isValidWord, getPrefixSet } from './dictionary';

// Boggle-style letter frequency weights
// Vowels ~40%, common consonants ~45%, rare (Q/X/Z/J) ~15%
const LETTER_WEIGHTS: [string, number][] = [
  ['A', 9], ['B', 2], ['C', 2], ['D', 4], ['E', 12], ['F', 2],
  ['G', 3], ['H', 2], ['I', 9], ['J', 1], ['K', 1], ['L', 4],
  ['M', 2], ['N', 6], ['O', 8], ['P', 2], ['Q', 1], ['R', 6],
  ['S', 4], ['T', 6], ['U', 4], ['V', 2], ['W', 2], ['X', 1],
  ['Y', 2], ['Z', 1],
];

const TOTAL_WEIGHT = LETTER_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

function randomLetter(): string {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const [letter, weight] of LETTER_WEIGHTS) {
    r -= weight;
    if (r <= 0) return letter;
  }
  return 'E';
}

export function generateGrid(size: number): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < size; r++) {
    grid.push([]);
    for (let c = 0; c < size; c++) {
      grid[r].push(randomLetter());
    }
  }
  return grid;
}

interface SolverResult {
  count: number;
  words: Set<string>;
}

// DFS solver to count findable words (3+ letters) on the grid.
// Uses prefix pruning via getPrefixSet() and caps path depth at 8
// to keep the solver fast over a full English dictionary.
const MAX_SOLVER_DEPTH = 8;

function solveGrid(grid: string[][], minWords: number): SolverResult {
  const size = grid.length;
  const found = new Set<string>();
  const prefixSet = getPrefixSet();

  function dfs(
    row: number,
    col: number,
    current: string,
    visited: boolean[][]
  ): void {
    if (current.length >= 3 && isValidWord(current)) {
      found.add(current);
    }

    if (found.size >= minWords) return;

    // Depth cap: don't explore paths longer than MAX_SOLVER_DEPTH letters.
    if (current.length >= MAX_SOLVER_DEPTH) return;

    // Prefix pruning: stop if no dictionary word starts with `current`.
    if (!prefixSet.has(current.toLowerCase())) return;

    visited[row][col] = true;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
          dfs(nr, nc, current + grid[nr][nc], visited);
        }
      }
    }

    visited[row][col] = false;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (found.size >= minWords) break;
      const visited = Array.from({ length: size }, () => Array(size).fill(false));
      dfs(r, c, grid[r][c], visited);
    }
    if (found.size >= minWords) break;
  }

  return { count: found.size, words: found };
}

export interface GridData {
  grid: string[][];
  solutionWords: string[];
}

export function generatePlayableGrid(size: number): GridData {
  const MIN_WORDS = 15;
  let attempts = 0;
  const MAX_ATTEMPTS = 20;

  while (attempts < MAX_ATTEMPTS) {
    const grid = generateGrid(size);
    const result = solveGrid(grid, MIN_WORDS);

    if (result.count >= MIN_WORDS) {
      return { grid, solutionWords: Array.from(result.words) };
    }
    attempts++;
  }

  // Fallback: return whatever we have
  const grid = generateGrid(size);
  const result = solveGrid(grid, 0);
  return { grid, solutionWords: Array.from(result.words) };
}
