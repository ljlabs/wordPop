import type { Position } from '../types';

export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

export function tilesAreValidPath(tiles: Position[]): boolean {
  if (tiles.length < 2) return tiles.length === 1;
  const seen = new Set<string>();
  for (const t of tiles) {
    const key = `${t.row},${t.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  for (let i = 0; i < tiles.length - 1; i++) {
    if (!isAdjacent(tiles[i], tiles[i + 1])) return false;
  }
  return true;
}

export function posKey(pos: Position): string {
  return `${pos.row},${pos.col}`;
}
