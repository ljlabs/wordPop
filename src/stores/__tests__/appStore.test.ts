import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../appStore';
import { useLeaderboardStore } from '../leaderboardStore';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ currentView: 'home', gridSize: 4, lastResults: null });
  useLeaderboardStore.setState({ games: [] });
});

describe('appStore', () => {
  it('persists gridSize to localStorage under wordpop_app', () => {
    useAppStore.getState().setGridSize(6);
    expect(useAppStore.getState().gridSize).toBe(6);
    const raw = localStorage.getItem('wordpop_app');
    expect(raw).not.toBeNull();
    expect(raw).toContain('"gridSize":6');
  });

  it('navigate changes the current view (not persisted)', () => {
    useAppStore.getState().navigate('leaderboard');
    expect(useAppStore.getState().currentView).toBe('leaderboard');
  });

  it('startGame sets the view to game', () => {
    useAppStore.getState().startGame();
    expect(useAppStore.getState().currentView).toBe('game');
  });

  it('endGame records to the leaderboard and shows results', () => {
    const results = {
      score: 1234,
      gridSize: 4 as const,
      words: [{ word: 'CAT', points: 10 }],
      longestWord: 'CAT',
      duration: 90,
      solutionWords: ['cat', 'bat', 'hat'],
      foundCount: 1,
      longestPossibleWord: 'cat',
    };
    useAppStore.getState().endGame(results);
    const app = useAppStore.getState();
    expect(app.currentView).toBe('results');
    expect(app.lastResults).toEqual(results);
    expect(useLeaderboardStore.getState().games).toHaveLength(1);
  });

  it('playAgain returns to the game view', () => {
    useAppStore.getState().endGame({
      score: 1, gridSize: 4, words: [], longestWord: '', duration: 90,
      solutionWords: [], foundCount: 0, longestPossibleWord: '',
    });
    useAppStore.getState().playAgain();
    expect(useAppStore.getState().currentView).toBe('game');
  });

  it('persisted state restores only gridSize, not the live view', () => {
    useAppStore.getState().setGridSize(5);
    useAppStore.getState().navigate('leaderboard');
    // The persist middleware writes only the partialized slice to localStorage.
    const raw = JSON.parse(localStorage.getItem('wordpop_app')!);
    expect(raw.state).toHaveProperty('gridSize', 5);
    // currentView and lastResults are NOT in the persisted slice.
    expect(raw.state).not.toHaveProperty('currentView');
    expect(raw.state).not.toHaveProperty('lastResults');
  });
});
