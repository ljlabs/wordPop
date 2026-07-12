// Persisted leaderboard history — the only game state that survives a reload.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameRecord, GameResults } from '../types';
import { recordGame } from '../services/leaderboardService';

interface LeaderboardState {
  games: GameRecord[];
  addGame: (results: GameResults) => void;
  clear: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  persist(
    (set) => ({
      games: [],
      addGame: (results: GameResults) =>
        set((state) => ({ games: [recordGame(results), ...state.games] })),
      clear: () => set({ games: [] }),
    }),
    {
      name: 'wordpop_games',
      partialize: (state) => ({ games: state.games }),
    }
  )
);
