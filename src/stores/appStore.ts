// App-level state: current view + selected grid size.
// gridSize is persisted across reloads; the live game session is NOT
// (timed game — abandon on exit, never resume).
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { View, GridSize, GameResults } from '../types';
import { useLeaderboardStore } from './leaderboardStore';

interface AppState {
  currentView: View;
  gridSize: GridSize;
  // Set when a game ends; consumed by the Results screen, then cleared on replay.
  lastResults: GameResults | null;

  navigate: (view: View) => void;
  setGridSize: (size: GridSize) => void;
  startGame: () => void;
  endGame: (results: GameResults) => void;
  playAgain: () => void;
  goHome: () => void;
  goToLeaderboard: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'home',
      gridSize: 4,
      lastResults: null,

      navigate: (view) => set({ currentView: view }),
      setGridSize: (size) => set({ gridSize: size }),
      startGame: () => set({ currentView: 'game' }),
      endGame: (results) => {
        // Persist the finished game to the leaderboard (one-directional call).
        useLeaderboardStore.getState().addGame(results);
        set({ lastResults: results, currentView: 'results' });
      },
      playAgain: () => set({ currentView: 'game' }),
      goHome: () => set({ currentView: 'home' }),
      goToLeaderboard: () => set({ currentView: 'leaderboard' }),
    }),
    {
      name: 'wordpop_app',
      // Only gridSize survives reloads.
      partialize: (state) => ({ gridSize: state.gridSize }),
    }
  )
);
