import { describe, it, expect, beforeEach } from 'vitest';
import { useGameSessionStore } from '../gameSessionStore';
import { GAME_DURATION } from '../../services/gameService';

beforeEach(() => {
  useGameSessionStore.setState({
    status: 'idle',
    gridSize: 4,
    grid: [],
    dictionary: new Set<string>(),
    score: 0,
    timeLeft: GAME_DURATION,
    selectedTiles: [],
    isDragging: false,
    foundWords: [],
    highlight: null,
    highlightedTiles: [],
    showHints: false,
  });
});

const FIXED_GRID = [
  ['P', 'L', 'A', 'Y'],
  ['S', 'T', 'E', 'R'],
  ['O', 'I', 'T', 'C'],
  ['D', 'M', 'U', 'H'],
];

describe('gameSessionStore', () => {
  it('start() populates a real grid and marks the game playing', () => {
    useGameSessionStore.getState().start(4);
    const s = useGameSessionStore.getState();
    expect(s.status).toBe('playing');
    expect(s.grid.length).toBe(4);
    expect(s.grid[0].length).toBe(4);
    expect(s.timeLeft).toBe(GAME_DURATION);
    expect(s.score).toBe(0);
    expect(s.dictionary.size).toBeGreaterThan(0);
  });

  it('pointerDown seeds the selection and dragging flag', () => {
    useGameSessionStore.getState().start(4);
    useGameSessionStore.getState().pointerDown(0, 0);
    const s = useGameSessionStore.getState();
    expect(s.isDragging).toBe(true);
    expect(s.selectedTiles).toEqual([{ row: 0, col: 0 }]);
  });

  it('accepts a valid word via pointerUp and awards score x10', () => {
    const store = useGameSessionStore.getState();
    store.start(4);
    // Inject a known grid + dictionary so PLAY is valid.
    useGameSessionStore.setState({ grid: FIXED_GRID, dictionary: new Set(['play']) });
    useGameSessionStore.getState().pointerDown(0, 0);
    useGameSessionStore.getState().pointerEnter(0, 1);
    useGameSessionStore.getState().pointerEnter(0, 2);
    useGameSessionStore.getState().pointerEnter(0, 3);
    useGameSessionStore.getState().pointerUp();

    const s = useGameSessionStore.getState();
    // PLAY = 4 letters = 1 base point * 10 multiplier.
    expect(s.score).toBe(10);
    expect(s.foundWords).toHaveLength(1);
    expect(s.foundWords[0].word).toBe('PLAY');
    expect(s.highlight).toBe('valid');
  });

  it('rejects a duplicate word', () => {
    useGameSessionStore.getState().start(4);
    useGameSessionStore.setState({ grid: FIXED_GRID, dictionary: new Set(['play']) });
    const s = useGameSessionStore.getState();
    s.pointerDown(0, 0); s.pointerEnter(0, 1); s.pointerEnter(0, 2); s.pointerEnter(0, 3);
    s.pointerUp();
    useGameSessionStore.getState().clearHighlight();
    // Second attempt at the same word.
    useGameSessionStore.getState().pointerDown(0, 0);
    useGameSessionStore.getState().pointerEnter(0, 1);
    useGameSessionStore.getState().pointerEnter(0, 2);
    useGameSessionStore.getState().pointerEnter(0, 3);
    useGameSessionStore.getState().pointerUp();

    const after = useGameSessionStore.getState();
    expect(after.foundWords).toHaveLength(1); // not added again
    expect(after.highlight).toBe('duplicate');
  });

  it('tick() decrements the timer and ends at zero', () => {
    useGameSessionStore.getState().start(4);
    useGameSessionStore.setState({ timeLeft: 1 });
    useGameSessionStore.getState().tick();
    const s = useGameSessionStore.getState();
    expect(s.timeLeft).toBe(0);
    expect(s.status).toBe('ended');
  });

  it('hint() reveals and awards an unfound word', () => {
    useGameSessionStore.getState().start(4);
    useGameSessionStore.setState({ grid: FIXED_GRID, dictionary: new Set(['play']), showHints: true });
    useGameSessionStore.getState().hint();
    const s = useGameSessionStore.getState();
    expect(s.foundWords).toHaveLength(1);
    expect(s.score).toBeGreaterThan(0);
    expect(s.showHints).toBe(false);
  });

  it('blocks input while a highlight flash is active', () => {
    useGameSessionStore.getState().start(4);
    useGameSessionStore.setState({ highlight: 'valid', highlightedTiles: [{ row: 0, col: 0 }] });
    useGameSessionStore.getState().pointerDown(1, 1);
    const s = useGameSessionStore.getState();
    expect(s.selectedTiles).toHaveLength(0);
    expect(s.isDragging).toBe(false);
  });
});
