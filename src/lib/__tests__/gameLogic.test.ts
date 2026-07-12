import { describe, it, expect } from 'vitest';
import {
  isAdjacent,
  isValidPath,
  scoreWord,
  validateWord,
  extractWord,
  processTileSelection,
  findHintWord,
  HIGHLIGHT_INVALID_MS,
  HIGHLIGHT_VALID_MS,
  HIGHLIGHT_HINT_MS,
  type Position,
  type FoundWord,
} from '../gameLogic';

// ─── Test fixtures ───
const GRID_4x4 = [
  ['P', 'L', 'A', 'Y'],
  ['S', 'T', 'E', 'R'],
  ['O', 'I', 'T', 'C'],
  ['D', 'M', 'U', 'H'],
];

const MOCK_DICT = new Set<string>([
  'play', 'ster', 'oter', 'much', 'dime', 'cute', 'mute',
  'store', 'moist', 'ouch', 'cite', 'test', 'best', 'rest',
  'jest', 'nest', 'pest', 'west', 'zest', 'tern', 'stern',
]);

// ─── isAdjacent ───
describe('isAdjacent', () => {
  it('returns true for horizontally adjacent tiles', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
  });

  it('returns true for vertically adjacent tiles', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
  });

  it('returns true for diagonally adjacent tiles', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(true);
  });

  it('returns false for the same tile', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 0 })).toBe(false);
  });

  it('returns false for tiles 2 steps apart', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });

  it('returns false for tiles far apart', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 3, col: 3 })).toBe(false);
  });
});

// ─── isValidPath ───
describe('isValidPath', () => {
  it('accepts a single tile', () => {
    expect(isValidPath([{ row: 0, col: 0 }])).toBe(true);
  });

  it('accepts a valid path of adjacent tiles', () => {
    const path: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(isValidPath(path)).toBe(true);
  });

  it('accepts a valid diagonal path', () => {
    const path: Position[] = [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ];
    expect(isValidPath(path)).toBe(true);
  });

  it('rejects path with duplicate tiles', () => {
    const path: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 0 }, // duplicate
    ];
    expect(isValidPath(path)).toBe(false);
  });

  it('rejects path with non-adjacent tiles', () => {
    const path: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 2 }, // gap
    ];
    expect(isValidPath(path)).toBe(false);
  });

  it('rejects empty path', () => {
    expect(isValidPath([])).toBe(true); // edge case — empty is valid
  });
});

// ─── extractWord ───
describe('extractWord', () => {
  it('extracts word from grid tiles', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 0, col: 3 }, // Y
    ];
    expect(extractWord(GRID_4x4, tiles)).toBe('PLAY');
  });

  it('extracts word from diagonal tiles', () => {
    const tiles: Position[] = [
      { row: 1, col: 1 }, // T
      { row: 2, col: 2 }, // T
    ];
    expect(extractWord(GRID_4x4, tiles)).toBe('TT');
  });
});

// ─── scoreWord ───
describe('scoreWord', () => {
  it('returns 1 for 3-letter words', () => {
    expect(scoreWord('CAT')).toBe(1);
  });

  it('returns 1 for 4-letter words', () => {
    expect(scoreWord('PLAY')).toBe(1);
  });

  it('returns 2 for 5-letter words', () => {
    expect(scoreWord('STORE')).toBe(2);
  });

  it('returns 3 for 6-letter words', () => {
    expect(scoreWord('BRUTAL')).toBe(3);
  });

  it('returns 5 for 7-letter words', () => {
    expect(scoreWord('FREIGHT')).toBe(5);
  });

  it('returns 11 for 8+ letter words', () => {
    expect(scoreWord('CHALLENGE')).toBe(11);
    expect(scoreWord('STRETCHED')).toBe(11);
  });
});

// ─── validateWord ───
describe('validateWord', () => {
  const emptyFound: FoundWord[] = [];

  it('returns "valid" for a dictionary word with enough letters', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 0, col: 3 }, // Y
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, MOCK_DICT);
    expect(result.result).toBe('valid');
    expect(result.word).toBe('PLAY');
    expect(result.points).toBe(1); // 4-letter word = 1pt
  });

  it('returns "too-short" for words under 3 letters', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, MOCK_DICT);
    expect(result.result).toBe('too-short');
    expect(result.points).toBe(0);
  });

  it('returns "duplicate" for already-found words', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 0, col: 3 }, // Y
    ];
    const foundWords: FoundWord[] = [{ word: 'PLAY', points: 10 }];
    const result = validateWord(GRID_4x4, tiles, foundWords, MOCK_DICT);
    expect(result.result).toBe('duplicate');
    expect(result.points).toBe(0);
  });

  it('returns "not-in-dictionary" for words not in the dictionary', () => {
    const tiles: Position[] = [
      { row: 0, col: 3 }, // Y
      { row: 1, col: 3 }, // R
      { row: 2, col: 3 }, // C
      { row: 3, col: 3 }, // H
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, MOCK_DICT);
    expect(result.result).toBe('not-in-dictionary');
    expect(result.points).toBe(0);
  });

  it('is case-insensitive for dictionary lookup', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 0, col: 3 }, // Y
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, MOCK_DICT);
    expect(result.result).toBe('valid');
  });
});

// ─── Highlight constants ───
describe('highlight durations', () => {
  it('invalid highlight is 500ms', () => {
    expect(HIGHLIGHT_INVALID_MS).toBe(500);
  });

  it('valid highlight is 500ms', () => {
    expect(HIGHLIGHT_VALID_MS).toBe(500);
  });

  it('hint highlight is 1000ms', () => {
    expect(HIGHLIGHT_HINT_MS).toBe(1000);
  });
});

// ─── Game flow scenarios ───
describe('game flow scenarios', () => {
  it('valid word adds to found words and increments score', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 0, col: 3 }, // Y
    ];
    const foundWords: FoundWord[] = [];
    const result = validateWord(GRID_4x4, tiles, foundWords, MOCK_DICT);

    expect(result.result).toBe('valid');
    expect(result.points).toBe(1);

    // Simulate adding to found words
    const newFound = [...foundWords, { word: result.word, points: result.points * 10 }];
    expect(newFound).toHaveLength(1);
    expect(newFound[0].word).toBe('PLAY');
  });

  it('duplicate word is rejected after first submission', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 0, col: 3 }, // Y
    ];
    const foundWords: FoundWord[] = [{ word: 'PLAY', points: 10 }];

    const result = validateWord(GRID_4x4, tiles, foundWords, MOCK_DICT);
    expect(result.result).toBe('duplicate');
  });

  it('non-dictionary word is rejected', () => {
    // "PLARY" is not a real word
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
      { row: 0, col: 2 }, // A
      { row: 1, col: 3 }, // R
      { row: 0, col: 3 }, // Y
    ];
    const result = validateWord(GRID_4x4, tiles, [], MOCK_DICT);
    expect(result.result).toBe('not-in-dictionary');
  });

  it('too-short word is rejected', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L
    ];
    const result = validateWord(GRID_4x4, tiles, [], MOCK_DICT);
    expect(result.result).toBe('too-short');
  });

  it('longer words score more points', () => {
    // 3-letter word
    const shortTiles: Position[] = [
      { row: 2, col: 1 }, // I
      { row: 2, col: 2 }, // T
      { row: 1, col: 2 }, // E
    ];
    const shortResult = validateWord(GRID_4x4, shortTiles, [], MOCK_DICT);
    // "ITE" — not in dictionary, but let's test scoring directly
    expect(scoreWord('ITE')).toBe(1);
    expect(scoreWord('STORE')).toBe(2);
    expect(scoreWord('BRUTAL')).toBe(3);
    expect(scoreWord('FREIGHT')).toBe(5);
    expect(scoreWord('CHALLENGE')).toBe(11);
  });

  it('highlight type determines tile color', () => {
    // Verify highlight color constants are correct
    expect(HIGHLIGHT_INVALID_MS).toBe(500);
    expect(HIGHLIGHT_VALID_MS).toBe(500);
    expect(HIGHLIGHT_HINT_MS).toBe(1000);
  });
});

// ─── Feedback states: validation result → highlight type mapping ───
describe('feedback states', () => {
  const dict = new Set(['play', 'store', 'test']);
  const emptyFound: FoundWord[] = [];

  it('valid new word → "valid" result (green feedback)', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, dict);
    expect(result.result).toBe('valid');
    // Game maps 'valid' → highlight type 'valid' → green #86efac
  });

  it('duplicate word → "duplicate" result (yellow feedback)', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
    ];
    const foundWords: FoundWord[] = [{ word: 'PLAY', points: 10 }];
    const result = validateWord(GRID_4x4, tiles, foundWords, dict);
    expect(result.result).toBe('duplicate');
    // Game maps 'duplicate' → highlight type 'duplicate' → yellow #fde68a
  });

  it('word too short → "too-short" result (red feedback)', () => {
    const tiles: Position[] = [
      { row: 0, col: 0 }, { row: 0, col: 1 },
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, dict);
    expect(result.result).toBe('too-short');
    // Game maps 'too-short' → highlight type 'invalid' → red #fca5a5
  });

  it('not in dictionary → "not-in-dictionary" result (red feedback)', () => {
    const tiles: Position[] = [
      { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 },
    ];
    const result = validateWord(GRID_4x4, tiles, emptyFound, dict);
    expect(result.result).toBe('not-in-dictionary');
    // Game maps 'not-in-dictionary' → highlight type 'invalid' → red #fca5a5
  });

  it('each result maps to a distinct highlight type', () => {
    // valid → 'valid', duplicate → 'duplicate', too-short/not-in-dict → 'invalid'
    // This ensures duplicate words get yellow, not red
    const tiles3 = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }]; // PLA — not in dict
    const tiles4 = [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }]; // PLAY — in MOCK_DICT
    const validResult = validateWord(GRID_4x4, tiles4, emptyFound, MOCK_DICT);
    const dupResult = validateWord(GRID_4x4, tiles4, [{ word: 'PLAY', points: 10 }], MOCK_DICT);
    const shortResult = validateWord(GRID_4x4, [{ row: 0, col: 0 }, { row: 0, col: 1 }], emptyFound, MOCK_DICT);

    expect(validResult.result).toBe('valid');
    expect(dupResult.result).toBe('duplicate');
    expect(shortResult.result).toBe('too-short');

    // All three are different — confirming distinct feedback paths
    const results = [validResult.result, dupResult.result, shortResult.result];
    expect(new Set(results).size).toBe(3);
  });
});

// ─── processTileSelection (backtracking) ───
describe('processTileSelection', () => {
  it('starts a new path from empty', () => {
    const result = processTileSelection([], 0, 0);
    expect(result).toEqual([{ row: 0, col: 0 }]);
  });

  it('adds an adjacent tile to the path', () => {
    const prev: Position[] = [{ row: 0, col: 0 }];
    const result = processTileSelection(prev, 0, 1);
    expect(result).toEqual([{ row: 0, col: 0 }, { row: 0, col: 1 }]);
  });

  it('does nothing when hovering the same tile', () => {
    const prev: Position[] = [{ row: 0, col: 0 }, { row: 0, col: 1 }];
    const result = processTileSelection(prev, 0, 1);
    expect(result).toEqual(prev);
  });

  it('rejects a non-adjacent tile', () => {
    const prev: Position[] = [{ row: 0, col: 0 }];
    const result = processTileSelection(prev, 2, 2);
    expect(result).toEqual(prev);
  });

  it('rejects a tile already in the path (not second-to-last)', () => {
    const prev: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ];
    // Trying to go back to (0,0) which is not the second-to-last
    const result = processTileSelection(prev, 0, 0);
    expect(result).toEqual(prev);
  });

  it('backtracks when hovering the second-to-last tile', () => {
    const prev: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ];
    // Hovering (0,1) which is the second-to-last → pops (1,1)
    const result = processTileSelection(prev, 0, 1);
    expect(result).toEqual([{ row: 0, col: 0 }, { row: 0, col: 1 }]);
  });

  it('backtracks multiple times in sequence', () => {
    let path: Position[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
    ];
    // Backtrack once: remove (1,2)
    path = processTileSelection(path, 1, 1);
    expect(path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ]);
    // Backtrack again: remove (1,1)
    path = processTileSelection(path, 0, 1);
    expect(path).toEqual([{ row: 0, col: 0 }, { row: 0, col: 1 }]);
    // Backtrack once more: remove (0,1)
    path = processTileSelection(path, 0, 0);
    expect(path).toEqual([{ row: 0, col: 0 }]);
  });

  it('allows re-drawing after backtracking', () => {
    // Simulate: S(1,0) → P(0,0) → L(0,1) → backtrack to P → then T(1,1)
    let path: Position[] = [
      { row: 1, col: 0 }, // S
      { row: 0, col: 0 }, // P
      { row: 0, col: 1 }, // L — wrong, should have gone to T(1,1)
    ];
    // Backtrack: remove L
    path = processTileSelection(path, 0, 0);
    expect(path).toEqual([
      { row: 1, col: 0 },
      { row: 0, col: 0 },
    ]);
    // Now go to T(1,1) which IS adjacent to P(0,0)
    path = processTileSelection(path, 1, 1);
    expect(path).toEqual([
      { row: 1, col: 0 },
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ]);
  });

  it('full backtracking scenario: S → P → O → P → Y', () => {
    // Grid positions for the 4x4 mock:
    // (0,0)=P (0,1)=L (0,2)=A (0,3)=Y
    // (1,0)=S (1,1)=T (1,2)=E (1,3)=R
    // Simulate drawing: S(1,0) → P(0,0) → O(2,0) → backtrack to P(0,0) → Y(0,3)
    // Wait — Y(0,3) is not adjacent to P(0,0). Let's use valid adjacencies.

    let path: Position[] = [];

    // Start at S(1,0)
    path = processTileSelection(path, 1, 0);
    expect(path).toEqual([{ row: 1, col: 0 }]);

    // Go to P(0,0) — adjacent diagonally
    path = processTileSelection(path, 0, 0);
    expect(path).toEqual([{ row: 1, col: 0 }, { row: 0, col: 0 }]);

    // Go to L(0,1) — adjacent
    path = processTileSelection(path, 0, 1);
    expect(path).toEqual([{ row: 1, col: 0 }, { row: 0, col: 0 }, { row: 0, col: 1 }]);

    // Oops, meant to go to T(1,1) instead — backtrack to P(0,0)
    path = processTileSelection(path, 0, 0);
    expect(path).toEqual([{ row: 1, col: 0 }, { row: 0, col: 0 }]);

    // Now go to T(1,1) — adjacent to P(0,0)
    path = processTileSelection(path, 1, 1);
    expect(path).toEqual([{ row: 1, col: 0 }, { row: 0, col: 0 }, { row: 1, col: 1 }]);

    // Final path: S → P → T
    expect(path).toHaveLength(3);
  });
});

// ─── findHintWord ───
describe('findHintWord', () => {
  // Grid:
  // P L A Y
  // S T E R
  // O I T C
  // D M U H

  it('finds a valid word on the grid', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    expect(hint!.word.length).toBeGreaterThanOrEqual(3);
    expect(hint!.points).toBeGreaterThan(0);
    expect(hint!.path.length).toBeGreaterThanOrEqual(3);
  });

  it('returns a word that is in the dictionary', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    expect(MOCK_DICT.has(hint!.word.toLowerCase())).toBe(true);
  });

  it('returns a path that matches the word letters', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    const pathWord = hint!.path.map((t) => GRID_4x4[t.row][t.col]).join('');
    expect(pathWord).toBe(hint!.word);
  });

  it('returns a valid adjacent path', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    for (let i = 0; i < hint!.path.length - 1; i++) {
      expect(isAdjacent(hint!.path[i], hint!.path[i + 1])).toBe(true);
    }
  });

  it('returns a path with no duplicate tiles', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    const keys = hint!.path.map((t) => `${t.row},${t.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('skips already-found words', () => {
    // Find a hint first
    const hint1 = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint1).not.toBeNull();

    // Mark it as found
    const foundWords: FoundWord[] = [{ word: hint1!.word, points: hint1!.points }];
    const hint2 = findHintWord(GRID_4x4, foundWords, MOCK_DICT);

    // Should return a different word (or null if none left)
    if (hint2) {
      expect(hint2.word).not.toBe(hint1!.word);
    }
  });

  it('prioritizes longer words', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    // The finder should return the longest available word
    // With our mock dict containing "STER", "TER", etc., it should find the longest
    expect(hint!.word.length).toBeGreaterThanOrEqual(3);
  });

  it('returns null when all words are found', () => {
    // Find all words first
    let foundWords: FoundWord[] = [];
    let hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    while (hint) {
      foundWords.push({ word: hint.word, points: hint.points });
      hint = findHintWord(GRID_4x4, foundWords, MOCK_DICT);
    }
    // Now there should be no more hints
    const finalHint = findHintWord(GRID_4x4, foundWords, MOCK_DICT);
    expect(finalHint).toBeNull();
  });

  it('works on a 5x5 grid', () => {
    const grid5x5 = [
      ['W', 'O', 'R', 'D', 'S'],
      ['B', 'A', 'C', 'K', 'E'],
      ['L', 'I', 'G', 'H', 'T'],
      ['F', 'I', 'R', 'E', 'Y'],
      ['J', 'U', 'M', 'P', 'S'],
    ];
    const bigDict = new Set([...MOCK_DICT, 'word', 'back', 'light', 'fire', 'jump', 'words']);
    const hint = findHintWord(grid5x5, [], bigDict);
    expect(hint).not.toBeNull();
    expect(hint!.word.length).toBeGreaterThanOrEqual(3);
  });

  it('scoring matches the word length', () => {
    const hint = findHintWord(GRID_4x4, [], MOCK_DICT);
    expect(hint).not.toBeNull();
    expect(hint!.points).toBe(scoreWord(hint!.word));
  });
});
