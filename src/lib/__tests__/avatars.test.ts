import { describe, it, expect } from 'vitest';
import { getAvatar, randomAvatarIndex, AVATAR_COUNT } from '../avatars';

describe('avatars', () => {
  it('getAvatar returns a stable value for the same index', () => {
    expect(getAvatar(0)).toEqual(getAvatar(0));
    expect(getAvatar(3)).toEqual(getAvatar(3));
  });

  it('getAvatar stays within the palette for any index (incl. negatives)', () => {
    for (const i of [-5, -1, 0, 1, 7, 8, 100, 999]) {
      const a = getAvatar(i);
      expect(typeof a.emoji).toBe('string');
      expect(a.emoji.length).toBeGreaterThan(0);
      expect(typeof a.color).toBe('string');
    }
  });

  it('getAvatar wraps around past the end of the palette', () => {
    expect(getAvatar(AVATAR_COUNT)).toEqual(getAvatar(0));
    expect(getAvatar(AVATAR_COUNT + 1)).toEqual(getAvatar(1));
  });

  it('randomAvatarIndex is within the palette range', () => {
    for (let i = 0; i < 50; i++) {
      const idx = randomAvatarIndex();
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(AVATAR_COUNT);
    }
  });
});
