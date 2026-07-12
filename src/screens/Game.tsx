import { useState, useEffect, useRef, useCallback } from 'react';
import type { GridSize, GameResults } from '../types';
import {
  type Position,
  type FoundWord,
  type HighlightType,
  HIGHLIGHT_INVALID_MS,
  HIGHLIGHT_VALID_MS,
  HIGHLIGHT_HINT_MS,
  processTileSelection,
  validateWord,
  findHintWord,
} from '../lib/gameLogic';

interface GameProps {
  gridSize: GridSize;
  onEndGame: (results: GameResults) => void;
  onExit: () => void;
}

// Mock grid data for each size
const MOCK_GRIDS: Record<number, string[][]> = {
  4: [
    ['P', 'L', 'A', 'Y'],
    ['S', 'T', 'E', 'R'],
    ['O', 'I', 'T', 'C'],
    ['D', 'M', 'U', 'H'],
  ],
  5: [
    ['W', 'O', 'R', 'D', 'S'],
    ['B', 'A', 'C', 'K', 'E'],
    ['L', 'I', 'G', 'H', 'T'],
    ['F', 'I', 'R', 'E', 'Y'],
    ['J', 'U', 'M', 'P', 'S'],
  ],
  6: [
    ['B', 'R', 'I', 'G', 'H', 'T'],
    ['C', 'L', 'O', 'U', 'D', 'S'],
    ['F', 'L', 'A', 'M', 'E', 'S'],
    ['G', 'R', 'A', 'S', 'P', 'S'],
    ['W', 'I', 'N', 'D', 'Y', 'Z'],
    ['J', 'U', 'M', 'P', 'E', 'D'],
  ],
};

// Mock dictionary — in production this will be the real word list
// For now, accept common English words so invalid words actually fail
const MOCK_DICTIONARY = new Set<string>([
  'play', 'ster', 'oter', 'much', 'dime', 'cute', 'mute',
  'words', 'bake', 'light', 'fire', 'jump', 'play', 'rest',
  'store', 'moist', 'ouch', 'cite', 'dime', 'much', 'cute',
  'mute', 'test', 'best', 'rest', 'jest', 'nest', 'pest',
  'west', 'zest', 'chest', 'fresh', 'press', 'stern', 'tern',
]);

export default function Game({ gridSize, onEndGame, onExit }: GameProps) {
  const [grid] = useState<string[][]>(() => MOCK_GRIDS[gridSize]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [selectedTiles, setSelectedTiles] = useState<Position[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [highlight, setHighlight] = useState<HighlightType>(null);
  const [highlightedTiles, setHighlightedTiles] = useState<Position[]>([]);
  const [showHints, setShowHints] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>();
  const highlightTimer = useRef<ReturnType<typeof setTimeout>>();
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Clear any active highlight after its duration
  const triggerHighlight = useCallback((type: HighlightType, tiles: Position[], duration: number) => {
    clearTimeout(highlightTimer.current);
    setHighlight(type);
    setHighlightedTiles(tiles);
    highlightTimer.current = setTimeout(() => {
      setHighlight(null);
      setHighlightedTiles([]);
    }, duration);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(highlightTimer.current);
      clearTimeout(inactivityTimer.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onEndGame({
        score,
        gridSize,
        words: foundWords,
        longestWord: foundWords.reduce((best, w) => w.word.length > best.length ? w.word : best, ''),
        duration: 90,
      });
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, score, gridSize, foundWords, onEndGame]);

  // Inactivity hints timer
  const resetInactivity = useCallback(() => {
    setShowHints(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setShowHints(true), 5000);
  }, []);

  useEffect(() => {
    resetInactivity();
    return () => clearTimeout(inactivityTimer.current);
  }, [resetInactivity]);

  // Is any highlight active? If so, block new drags
  const isBlocked = highlight !== null;

  // Handle pointer down on a tile
  const handlePointerDown = (row: number, col: number) => {
    if (isBlocked) return;
    resetInactivity();
    setIsDragging(true);
    setSelectedTiles([{ row, col }]);
  };

  // Handle pointer move over a tile
  const handlePointerEnter = (row: number, col: number) => {
    if (!isDragging || isBlocked) return;
    resetInactivity();
    setSelectedTiles((prev) => processTileSelection(prev, row, col));
  };

  // Handle pointer up — submit word
  const handlePointerUp = () => {
    if (!isDragging || isBlocked) return;
    setIsDragging(false);

    const validation = validateWord(grid, selectedTiles, foundWords, MOCK_DICTIONARY);

    if (validation.result === 'valid') {
      setScore((s) => s + validation.points * 10);
      setFoundWords((w) => [...w, { word: validation.word, points: validation.points * 10 }]);
      triggerHighlight('valid', selectedTiles, HIGHLIGHT_VALID_MS);
    } else if (validation.result === 'duplicate') {
      triggerHighlight('duplicate', selectedTiles, HIGHLIGHT_INVALID_MS);
    } else {
      triggerHighlight('invalid', selectedTiles, HIGHLIGHT_INVALID_MS);
    }

    setTimeout(() => setSelectedTiles([]), 50);
  };

  // Hints button — find a real unfound word, award points, add to found words, and highlight in green like a valid word
  const handleHints = () => {
    if (isBlocked) return;
    const hint = findHintWord(grid, foundWords, MOCK_DICTIONARY);
    if (hint) {
      // Award points and add to found words (same as valid word submission)
      setScore((s) => s + hint.points * 10);
      setFoundWords((w) => [...w, { word: hint.word, points: hint.points * 10 }]);
      // Highlight in green like a valid word
      triggerHighlight('valid', hint.path, HIGHLIGHT_VALID_MS);
    }
  };

  // Get tile center position for SVG path
  const getTileCenter = (row: number, col: number): { x: number; y: number } | null => {
    const key = `${row},${col}`;
    const tileEl = tileRefs.current.get(key);
    const gridEl = gridRef.current;
    if (!tileEl || !gridEl) return null;
    const tileRect = tileEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    return {
      x: ((tileRect.left + tileRect.width / 2 - gridRect.left) / gridRect.width) * 100,
      y: ((tileRect.top + tileRect.height / 2 - gridRect.top) / gridRect.height) * 100,
    };
  };

  // Build SVG path
  const pathPoints = selectedTiles
    .map((t) => getTileCenter(t.row, t.col))
    .filter(Boolean) as { x: number; y: number }[];
  const pathD = pathPoints.length > 0
    ? `M ${pathPoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`
    : '';

  // Base tile colors as hex (inline styles to avoid Tailwind specificity conflicts)
  const TILE_BASE_COLORS = ['#fdfd96', '#ffd1dc', '#e3ffe2'];

  // Determine tile background color: highlight override or base color
  const getTileBg = (r: number, c: number): string => {
    const isSelected = selectedTiles.some((t) => t.row === r && t.col === c);
    const isHighlighted = highlightedTiles.some((t) => t.row === r && t.col === c);

    // Active drag selection — blue
    if (isSelected && isDragging) return '#93c5fd';

    // Post-release feedback highlights
    if (isHighlighted && highlight === 'valid') return '#86efac';   // green
    if (isHighlighted && highlight === 'duplicate') return '#fde68a'; // yellow
    if (isHighlighted && highlight === 'invalid') return '#fca5a5'; // red
    if (isHighlighted && highlight === 'hint') return '#fbbf24';    // amber/gold

    // Default base color
    return TILE_BASE_COLORS[(r + c) % 3];
  };

  return (
    <div className="flex flex-col min-h-dvh select-none">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-5 py-4 bg-surface border-b-2 border-on-surface neubrutalist-shadow sticky top-0 z-50">
        <button
          onClick={onExit}
          className="w-10 h-10 flex items-center justify-center bg-surface-bright border-2 border-on-surface rounded-lg neo-shadow active:neo-shadow-pressed transition-all"
        >
          <span className="material-symbols-outlined text-on-surface text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Score Badge */}
          <div className="flex items-center gap-1 bg-primary-container border-2 border-on-surface rounded-lg px-3 py-2 neo-shadow-sm">
            <span className="font-label font-bold text-on-surface" style={{ fontSize: '14px' }}>PTS</span>
            <span className="font-title text-on-surface" style={{ fontSize: '20px' }}>{score}</span>
          </div>
          {/* Timer Badge */}
          <div className="flex items-center gap-1 bg-secondary-container border-2 border-on-surface rounded-lg px-3 py-2 neo-shadow-sm">
            <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: '18px' }}>timer</span>
            <span className="font-label font-bold text-on-secondary-container" style={{ fontSize: '14px' }}>{timeLeft}s</span>
          </div>
        </div>
      </header>

      {/* Game Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 relative mt-12 mb-8">
        {/* Hints Button */}
        <div className="mb-4 flex justify-center h-10">
          <button
            className={`${showHints ? '' : 'hidden'} bg-surface-bright border-2 border-on-surface rounded-full px-6 py-2 neo-shadow active:neo-shadow-pressed transition-all`}
            onClick={handleHints}
          >
            <span className="font-headline text-on-surface tracking-widest" style={{ fontSize: '20px' }}>HINTS</span>
          </button>
        </div>

        {/* Letter Grid */}
        <div
          ref={gridRef}
          className="relative w-full max-w-[340px] aspect-square bg-surface-container-highest border-2 border-on-surface rounded-xl p-1 neo-shadow-sm"
          onPointerUp={handlePointerUp}
          onPointerLeave={() => { if (isDragging) handlePointerUp(); }}
        >
          {/* SVG Drag Path */}
          <svg className="drag-path" preserveAspectRatio="none" viewBox="0 0 100 100">
            {pathD && <path className="path-line" d={pathD} />}
          </svg>

          {/* Grid */}
          <div
            className="grid gap-2 w-full h-full relative z-20"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const bgColor = getTileBg(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    ref={(el) => { if (el) tileRefs.current.set(`${r},${c}`, el); }}
                    className="border-2 border-on-surface rounded-lg flex items-center justify-center neo-shadow transition-colors cursor-pointer"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handlePointerDown(r, c);
                    }}
                    onPointerEnter={() => handlePointerEnter(r, c)}
                    style={{ touchAction: 'none', backgroundColor: bgColor }}
                  >
                    <span className="font-headline text-on-surface" style={{ fontSize: 'clamp(20px, 6vw, 32px)' }}>{letter}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
