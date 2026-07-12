import { describe, it, expect } from 'vitest';
import { getDictionary, getMinWordLength, isValidWord } from '../dictionary';

describe('dictionary', () => {
  it('getDictionary returns a Set', () => {
    expect(getDictionary()).toBeInstanceOf(Set);
  });

  it('contains common 3+ letter words', () => {
    expect(getDictionary().has('play')).toBe(true);
    expect(getDictionary().has('cats')).toBe(true);
    expect(getDictionary().has('quartz')).toBe(true);
  });

  it('excludes words shorter than the minimum', () => {
    expect(getDictionary().has('a')).toBe(false);
    expect(getDictionary().has('to')).toBe(false);
  });

  it('getMinWordLength matches the filtered length', () => {
    const min = getMinWordLength();
    for (const w of getDictionary()) {
      expect(w.length).toBeGreaterThanOrEqual(min);
    }
  });

  it('isValidWord is case-insensitive', () => {
    expect(isValidWord('PLAY')).toBe(true);
    expect(isValidWord('Play')).toBe(true);
    expect(isValidWord('zzzzzzzz')).toBe(false);
  });
});
