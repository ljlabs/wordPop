export interface Tile {
  row: number;
  col: number;
  letter: string;
}

export interface FoundWord {
  word: string;
  points: number;
}

export interface GameRecord {
  id: string;
  score: number;
  gridSize: number;
  words: FoundWord[];
  longestWord: string;
  date: number;
  duration: number;
  avatarIndex: number;
}

export type GridSize = 4 | 5 | 6;
export type View = 'home' | 'game' | 'results' | 'leaderboard';

export interface GameResults {
  score: number;
  gridSize: GridSize;
  words: FoundWord[];
  longestWord: string;
  duration: number;
}
