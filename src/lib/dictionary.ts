// Dictionary: loads an-array-of-english-words and filters to 3+ letters
// Used for offline O(1) word validation

// @ts-expect-error — no type declarations for this package
import words from 'an-array-of-english-words';

const MIN_WORD_LENGTH = 3;

const wordSet: Set<string> = new Set(
  (words as string[]).filter((w: string) => w.length >= MIN_WORD_LENGTH)
);

export function isValidWord(word: string): boolean {
  return wordSet.has(word.toLowerCase());
}

export function getMinWordLength(): number {
  return MIN_WORD_LENGTH;
}
