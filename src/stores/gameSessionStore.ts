// Live, timed game session. NOT persisted — a timed game is abandoned on
// exit and never resumed. All side-effect timers (countdown, inactivity,
// highlight flashes) live in the Game component so this store stays testable.
import { create } from 'zustand';
import type { GridSize, FoundWord, GameResults, Position } from '../types';
import {
  startGame as genGame,
  submitWord,
  findHint,
  buildResults,
  GAME_DURATION,
  SCORE_MULTIPLIER,
  getDictionary,
} from '../services/gameService';
import {
  type HighlightType,
  HIGHLIGHT_VALID_MS,
  processTileSelection,
} from '../lib/gameLogic';

type Status = 'idle' | 'playing' | 'ended';

interface GameSessionState {
  status: Status;
  gridSize: GridSize;
  grid: string[][];
  dictionary: Set<string>;
  solutionWords: string[];
  score: number;
  timeLeft: number;
  selectedTiles: Position[];
  isDragging: boolean;
  foundWords: FoundWord[];
  highlight: HighlightType;
  highlightedTiles: Position[];
  showHints: boolean;

  start: (size: GridSize) => void;
  pointerDown: (row: number, col: number) => void;
  pointerEnter: (row: number, col: number) => void;
  pointerUp: () => void;
  tick: () => void;
  setShowHints: (show: boolean) => void;
  hint: () => void;
  clearHighlight: () => void;
  buildResults: () => GameResults;
}

const EMPTY_GRID: string[][] = [];

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  status: 'idle',
  gridSize: 4,
  grid: EMPTY_GRID,
  dictionary: new Set<string>(),
  solutionWords: [],
  score: 0,
  timeLeft: GAME_DURATION,
  selectedTiles: [],
  isDragging: false,
  foundWords: [],
  highlight: null,
  highlightedTiles: [],
  showHints: false,

  start: (size) => {
    const { grid, solutionWords } = genGame(size);
    set({
      status: 'playing',
      gridSize: size,
      grid,
      dictionary: getDictionary(),
      solutionWords,
      score: 0,
      timeLeft: GAME_DURATION,
      selectedTiles: [],
      isDragging: false,
      foundWords: [],
      highlight: null,
      highlightedTiles: [],
      showHints: false,
    });
  },

  pointerDown: (row, col) => {
    if (get().status !== 'playing' || get().highlight !== null) return;
    set({ isDragging: true, selectedTiles: [{ row, col }] });
  },

  pointerEnter: (row, col) => {
    const { isDragging, highlight, selectedTiles } = get();
    if (!isDragging || highlight !== null) return;
    // Reuse the engine's backtracking selection logic.
    set({ selectedTiles: processTileSelection(selectedTiles, row, col) });
  },

  pointerUp: () => {
    const { isDragging, highlight, grid, selectedTiles, foundWords, dictionary } = get();
    if (!isDragging || highlight !== null) return;

    const validation = submitWord(grid, selectedTiles, foundWords, dictionary);

    if (validation.result === 'valid') {
      set({
        score: get().score + validation.points * SCORE_MULTIPLIER,
        foundWords: [...get().foundWords, { word: validation.word, points: validation.points * SCORE_MULTIPLIER }],
        highlight: 'valid',
        highlightedTiles: selectedTiles,
        isDragging: false,
        selectedTiles: [],
      });
    } else {
      // duplicate / too-short / not-in-dictionary → flash feedback
      const type: HighlightType = validation.result === 'duplicate' ? 'duplicate' : 'invalid';
      set({
        highlight: type,
        highlightedTiles: selectedTiles,
        isDragging: false,
        selectedTiles: [],
      });
    }
  },

  tick: () => {
    const { timeLeft } = get();
    if (timeLeft <= 1) {
      set({ timeLeft: 0, status: 'ended' });
    } else {
      set({ timeLeft: timeLeft - 1 });
    }
  },

  setShowHints: (show) => set({ showHints: show }),

  // Reveal a real unfound word: award its points, add to found words,
  // and flash the path green like a valid submission.
  hint: () => {
    const { status, highlight, grid, foundWords, dictionary } = get();
    if (status !== 'playing' || highlight !== null) return;
    const found = findHint(grid, foundWords, dictionary);
    if (!found) return;
    set({
      score: get().score + found.points * SCORE_MULTIPLIER,
      foundWords: [...get().foundWords, { word: found.word, points: found.points * SCORE_MULTIPLIER }],
      highlight: 'valid',
      highlightedTiles: found.path,
      showHints: false,
    });
  },

  clearHighlight: () => set({ highlight: null, highlightedTiles: [] }),

  buildResults: () => {
    const { score, gridSize, foundWords, solutionWords } = get();
    return buildResults({ score, gridSize, foundWords, duration: GAME_DURATION, solutionWords });
  },
}));

// Re-export for the component's highlight duration config.
export { HIGHLIGHT_VALID_MS };
