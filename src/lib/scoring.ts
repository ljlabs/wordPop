// Boggle-style scoring table
// 3-4 letters = 1 pt
// 5 letters  = 2 pts
// 6 letters  = 3 pts
// 7 letters  = 5 pts
// 8+ letters = 11 pts

export function scoreWord(word: string): number {
  const len = word.length;
  if (len <= 4) return 1;
  if (len === 5) return 2;
  if (len === 6) return 3;
  if (len === 7) return 5;
  return 11; // 8+
}
