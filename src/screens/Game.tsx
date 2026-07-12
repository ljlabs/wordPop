import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import { useGameSessionStore, HIGHLIGHT_VALID_MS } from '../stores/gameSessionStore';

const HIGHLIGHT_INVALID_MS = 500;
const INACTIVITY_MS = 5000;

export default function Game() {
  // App store: read once, stable selectors.
  const gridSize = useAppStore((s) => s.gridSize);
  const goHome = useAppStore((s) => s.goHome);
  const endGame = useAppStore((s) => s.endGame);

  // Session store: stable action references (Zustand guarantees selector
  // results are referentially stable when the selected value doesn't change).
  const start = useGameSessionStore((s) => s.start);
  const tick = useGameSessionStore((s) => s.tick);
  const setShowHints = useGameSessionStore((s) => s.setShowHints);
  const clearHighlight = useGameSessionStore((s) => s.clearHighlight);
  const hint = useGameSessionStore((s) => s.hint);
  const buildSessionResults = useGameSessionStore((s) => s.buildResults);

  // Session state — these change every render but are only read, never deps.
  const status = useGameSessionStore((s) => s.status);
  const grid = useGameSessionStore((s) => s.grid);
  const sessionSize = useGameSessionStore((s) => s.gridSize);
  const score = useGameSessionStore((s) => s.score);
  const timeLeft = useGameSessionStore((s) => s.timeLeft);
  const selectedTiles = useGameSessionStore((s) => s.selectedTiles);
  const isDragging = useGameSessionStore((s) => s.isDragging);
  const highlight = useGameSessionStore((s) => s.highlight);
  const highlightedTiles = useGameSessionStore((s) => s.highlightedTiles);
  const showHints = useGameSessionStore((s) => s.showHints);

  // Stable session actions for pointer callbacks.
  const pointerDown = useGameSessionStore((s) => s.pointerDown);
  const pointerEnter = useGameSessionStore((s) => s.pointerEnter);
  const pointerUp = useGameSessionStore((s) => s.pointerUp);

  const highlightTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Guards the one-shot end-of-game handoff (endGame mutates appStore, which
  // would otherwise retrigger this effect and double-record the game).
  const endedRef = useRef(false);

  // Start a fresh session whenever we mount (Play / Play Again).
  useEffect(() => {
    start(gridSize);
    endedRef.current = false;
    return () => {
      clearTimeout(highlightTimer.current);
      clearTimeout(inactivityTimer.current);
    };
  }, [start, gridSize]); // `start` is stable from Zustand selector

  // Countdown — one real timer driving the store's tick().
  useEffect(() => {
    if (status !== 'playing') return;
    const timer = setInterval(() => tick(), 1000);
    return () => clearInterval(timer);
  }, [status, tick]); // `tick` is stable from Zustand selector

  // When the round ends, hand results to the app store (records to the
  // leaderboard). Timed game is abandoned on exit and never resumed.
  useEffect(() => {
    if (status === 'ended' && !endedRef.current) {
      endedRef.current = true;
      endGame(buildSessionResults());
    }
  }, [status, endGame, buildSessionResults]);

  // Clear a flash highlight after its duration.
  const triggerHighlight = useCallback((duration: number) => {
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => clearHighlight(), duration);
  }, [clearHighlight]);

  useEffect(() => {
    if (highlight !== null) {
      triggerHighlight(highlight === 'valid' ? HIGHLIGHT_VALID_MS : HIGHLIGHT_INVALID_MS);
    }
  }, [highlight, triggerHighlight]);

  // Inactivity → reveal the HINTS button after 5s of no input.
  const resetInactivity = useCallback(() => {
    setShowHints(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setShowHints(true), INACTIVITY_MS);
  }, [setShowHints]);

  useEffect(() => {
    resetInactivity();
    return () => clearTimeout(inactivityTimer.current);
  }, [resetInactivity]);

  // Is a flash highlight active? If so, block new drags.
  const isBlocked = highlight !== null;

  const handlePointerDown = (row: number, col: number) => {
    if (isBlocked) return;
    resetInactivity();
    pointerDown(row, col);
  };

  const handlePointerEnter = (row: number, col: number) => {
    if (!isDragging || isBlocked) return;
    resetInactivity();
    pointerEnter(row, col);
  };

  // Touch drag: on touch devices, onPointerEnter doesn't fire as the finger
  // moves across elements. We use touchMove + elementFromPoint to detect which
  // tile is under the finger.
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isBlocked) return;
    e.preventDefault();
    resetInactivity();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!el) return;
    const tileEl = el.closest('[data-row][data-col]') as HTMLElement | null;
    if (tileEl) {
      const row = parseInt(tileEl.dataset.row!, 10);
      const col = parseInt(tileEl.dataset.col!, 10);
      pointerEnter(row, col);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || isBlocked) return;
    pointerUp();
  };

  const handleHints = () => {
    if (isBlocked) return;
    hint();
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
          onClick={goHome}
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
          onTouchMove={handleTouchMove}
        >
          {/* SVG Drag Path */}
          <svg className="drag-path" preserveAspectRatio="none" viewBox="0 0 100 100">
            {pathD && <path className="path-line" d={pathD} />}
          </svg>

          {/* Grid */}
          <div
            className="grid gap-2 w-full h-full relative z-20"
            style={{ gridTemplateColumns: `repeat(${sessionSize}, 1fr)`, gridTemplateRows: `repeat(${sessionSize}, 1fr)` }}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const bgColor = getTileBg(r, c);

                return (
                  <div
                    key={`${r}-${c}`}
                    ref={(el) => { if (el) tileRefs.current.set(`${r},${c}`, el); }}
                    data-row={r}
                    data-col={c}
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
