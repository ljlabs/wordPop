import type { GameRecord } from '../types';

const GAMES_KEY = 'wordpop_games';

export function loadGames(): GameRecord[] {
  try {
    const raw = localStorage.getItem(GAMES_KEY);
    if (!raw) return [];
    const games = JSON.parse(raw) as GameRecord[];
    return games.sort((a, b) => b.date - a.date);
  } catch {
    return [];
  }
}

export function saveGame(game: GameRecord): void {
  const games = loadGames();
  games.push(game);
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export function clearGames(): void {
  localStorage.removeItem(GAMES_KEY);
}
