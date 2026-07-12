// Dictionary: loads enable1.txt (bundled at build time via Vite ?raw import).
// All words are stored lowercase; lookups normalize to lowercase.

// Vite's ?raw import returns the file contents as a string.
import wordListRaw from './words.txt?raw';

const MIN_WORD_LENGTH = 3;

const wordSet: Set<string> = new Set(
  (wordListRaw as string)
    .split('\n')
    .map((w: string) => w.trim().toLowerCase())
    .filter((w: string) => w.length >= MIN_WORD_LENGTH && /^[a-z]+$/.test(w))
);

export function isValidWord(word: string): boolean {
  return wordSet.has(word.toLowerCase());
}

export function getMinWordLength(): number {
  return MIN_WORD_LENGTH;
}

// Returns the full dictionary set for use by hint-finding and services.
export function getDictionary(): Set<string> {
  return wordSet;
}

// Set of all prefixes (length >= 1) of dictionary words.
// Used by gridGenerator's DFS solver and findHintWord to prune
// branches that can never form a dictionary word.
let prefixSet: Set<string> | null = null;

export function getPrefixSet(): Set<string> {
  if (prefixSet !== null) return prefixSet;
  prefixSet = new Set<string>();
  for (const w of wordSet) {
    for (let i = 1; i <= w.length; i++) {
      prefixSet.add(w.slice(0, i));
    }
  }
  return prefixSet;
}
