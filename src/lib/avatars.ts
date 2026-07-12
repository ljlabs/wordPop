// Avatar palette — replaces the hardcoded external-image podium avatars.
// Each game records a random index; getAvatar() resolves it to an emoji + color.

export interface Avatar {
  emoji: string;
  color: string;
}

const AVATARS: Avatar[] = [
  { emoji: '🐱', color: '#fde68a' }, // cat — amber
  { emoji: '🚀', color: '#bfdbfe' }, // rocket — blue
  { emoji: '🍕', color: '#fecaca' }, // pizza — red
  { emoji: '🐸', color: '#bbf7d0' }, // frog — green
  { emoji: '👾', color: '#e9d5ff' }, // alien — purple
  { emoji: '🐼', color: '#e5e7eb' }, // panda — gray
  { emoji: '🌟', color: '#fef08a' }, // star — yellow
  { emoji: '🦊', color: '#fed7aa' }, // fox — orange
];

export const AVATAR_COUNT = AVATARS.length;

export function getAvatar(index: number): Avatar {
  const safe = Math.abs(Math.trunc(index)) % AVATARS.length;
  return AVATARS[safe];
}

export function randomAvatarIndex(): number {
  return Math.floor(Math.random() * AVATARS.length);
}
