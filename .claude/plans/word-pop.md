# WORD POP! — Implementation Plan

## Overview
Build a single-player Boggle-style word game with React + TypeScript + Vite + Tailwind CSS. Fully client-side, no backend. All data persists in localStorage.

## Phase 1: Project Scaffolding

### 1.1 Initialize Vite + React + TypeScript project
- `npm create vite@latest . -- --template react-ts` in the project root
- Install dependencies: `tailwindcss`, `@tailwindcss/vite` (or PostCSS plugin), `typescript`
- Configure Tailwind with the full neubrutalist color palette extracted from DESIGN.md
- Add Fredoka (weights 500, 700, 800) and Work Sans (weights 500, 700) via Google Fonts `@import` in CSS

### 1.2 Tailwind config — port directly from mockups
- Copy the exact `colors`, `borderRadius`, `spacing`, `fontFamily`, `fontSize` tokens from `game_screen_word_pop_updated/code.html`'s `tailwind.config`
- Override `fontFamily` to standardize on Fredoka for all display/headline/title roles (per user instruction — the Home/Results/Leaderboard mocks use Plus Jakarta Sans but we replace with Fredoka everywhere)
- Keep Work Sans for `body-md`, `body-lg`, `label-bold`

### 1.3 Global CSS — neubrutalist utility classes
Port from the mockup `<style>` blocks:
```css
.neubrutalist-shadow      { box-shadow: 4px 4px 0px 0px #1A1A1A; }
.neubrutalist-shadow-lg   { box-shadow: 6px 6px 0px 0px #1A1A1A; }
.neubrutalist-shadow-sm   { box-shadow: 2px 2px 0px 0px #1A1A1A; }
.neubrutalist-shadow-inset { box-shadow: inset 2px 2px 0px 0px rgba(26,26,26,1); }
.tactile-btn {
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.tactile-btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px 0px #1A1A1A !important;
}
.text-shadow-hard { text-shadow: 2px 2px 0px #1A1A1A; }
```
Plus game-screen-specific:
```css
.neo-shadow          { box-shadow: 4px 4px 0px 0px #1A1A1A; }
.neo-shadow-active   { box-shadow: 6px 6px 0px 0px #1A1A1A; transform: translate(-2px, -2px); }
.neo-shadow-pressed  { box-shadow: 0px 0px 0px 0px #1A1A1A; transform: translate(4px, 4px); }
.neo-shadow-sm       { box-shadow: 2px 2px 0px 0px #1A1A1A; }
```
Plus animation keyframes:
```css
@keyframes flash-error {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(0.9) sepia(1) hue-rotate(-50deg) saturate(3); background-color: #ffb3b3 !important; }
}
.error-flash { animation: flash-error 0.6s ease-in-out; }

@keyframes flash-success {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1); background-color: #c8ffc8 !important; }
}
.success-flash { animation: flash-success 0.4s ease-in-out; }

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
.pop-animation { animation: pop 0.3s ease-in-out; }
```

### 1.4 App shell with view-state routing
- `App.tsx` with a `currentView` state: `'home' | 'game' | 'results' | 'leaderboard'`
- Pass `gridSize` and game results between views via lifted state
- No router library — simple conditional rendering

---

## Phase 2: Dictionary & Game Engine (Core Logic)

### 2.1 Word list
- Use the `an-array-of-english-words` npm package (~276k words), or bundle a curated `.txt` word list as a Vite asset
- Load into a `Set<string>` at app startup for O(1) lookup
- Minimum word length: 3 letters (documented in code comment)

### 2.2 Scoring table
```typescript
// Boggle-style scoring
// 3-4 letters = 1 pt
// 5 letters  = 2 pts
// 6 letters  = 3 pts
// 7 letters  = 5 pts
// 8+ letters = 11 pts
function scoreWord(word: string): number { ... }
```

### 2.3 Grid generation
- Boggle-style letter frequency weighting (vowels ~40%, common consonants ~45%, rare Q/X/Z/J ~15%)
- After generating, run a solver pass (DFS from each tile, 3+ letter words) to verify ≥15 valid words exist; re-roll if not
- The solver is a lightweight recursive DFS — not a full trie optimization needed at this scale

### 2.4 Word validation
- Check: minimum 3 letters, in dictionary set, all tiles adjacent (8-dir), no tile reused in same word, not already found this round
- Adjacency check: for each consecutive pair in the selection path, verify `|row1-row2| <= 1 && |col1-col2| <= 1` and not the same cell

---

## Phase 3: Home Screen

### 3.1 Home component (`src/screens/Home.tsx`)
Port structure from `home_word_pop/code.html`:
- Top header bar with hamburger + "WORD POP!" title + settings icon
- Hero section: decorative 3x3 mini letter grid (W O R D / D P O / P ! star) inside a bordered card
- Big "PLAY" button with tactile style
- Grid size selector: 3 cards (4x4 / 5x5 / 6x6) with mini dot-grid preview, checkmark on selected
- Bottom nav bar: Play (active) / Rank / Stats (stub) / Help (stub)

### 3.2 Grid size state
- `selectedGridSize` defaults to 4 (loaded from localStorage if saved)
- Persist selection to localStorage on change
- "PLAY" button navigates to Game view with selected size

---

## Phase 4: Game Screen

### 4.1 Game component (`src/screens/Game.tsx`)
Port structure from `game_screen_word_pop_updated/code.html`:
- Header: exit button (X) + score badge ("PTS 0") + **timer badge** (NEW — not in mockup)
- Timer: 90-second countdown, pill badge with Secondary Pink background, same visual language as score badge
- Hints button: appears after 5s inactivity, hides on any input (port the JS logic from mockup)
  - **Implementation choice**: hints will be a no-op stub (scoping out hint logic to keep scope manageable)
- Letter grid: renders dynamically based on grid size, tiles cycle through primary-container/secondary-container/tertiary-container colors
- SVG drag path overlay: `.drag-path` / `.path-line` classes from mockup

### 4.2 Drag-to-select interaction
- Support both `mousedown`/`mousemove`/`mouseup` and `touchstart`/`touchmove`/`touchend`
- Track `selectedTiles: Array<{row, col}>` state
- On pointer down on a tile: start selection, add tile
- On pointer move: if over a new tile that is adjacent to the last selected tile and not already selected, add it
- On pointer up: submit the word formed by the selected tiles
- Render the SVG polyline connecting tile centers as the player drags

### 4.3 Word submission flow
- On release: form word from selected tiles (uppercase), validate
- **Valid**: green flash animation on tiles, word "pop" animation, score increments, add to found-words set
- **Invalid**: red `.error-flash` animation on tiles
- Clear selection after 300ms delay

### 4.4 Timer logic
- `useEffect` with `setInterval` counting down from 90
- When hits 0: auto-end round, navigate to Results with game data
- Display as MM:SS or just seconds in the pill badge

---

## Phase 5: Results Screen

### 5.1 Results component (`src/screens/Results.tsx`)
Port structure from `results_word_pop/code.html`:
- Score card: big final score in display font, total words found, best word
- Found words section: flex-wrap container with word chips
  - Longer words get bigger chips (text-body-lg) with secondary-container bg + rotate transforms
  - Shorter words get smaller chips (text-label-bold) with surface-bright bg
- Each chip has a point badge
- Stats row: grid size, time taken
- "Play Again" and "View Leaderboard" buttons

### 5.2 Persist game record to localStorage
On reaching Results, save:
```typescript
interface GameRecord {
  id: string;           // timestamp-based
  score: number;
  gridSize: number;     // 4, 5, or 6
  words: Array<{ word: string; points: number }>;
  longestWord: string;
  date: number;         // Date.now()
  duration: number;     // seconds played (90 - remaining)
  avatarIndex: number;  // deterministic from timestamp hash
}
```
Store as JSON array in `localStorage.getItem('wordpop_games')`.

---

## Phase 6: Leaderboard Screen

### 6.1 Leaderboard component (`src/screens/Leaderboard.tsx`)
Port structure from `leaderboard_word_pop/code.html`:
- Header with filter tabs: All / 4x4 / 5x5 / 6x6
- Podium (top 3): gold/silver/bronze cards with avatar, score
- List below: remaining entries ranked by score
- Most recently played game highlighted with dashed-border + tertiary-container style
- Bottom nav bar (same as Home, with Rank active)

### 6.2 Avatar system
- Fixed set of emoji/SVG icons: 🚀 🐱 🍕 🤖 ☀️ 🎸 🌈 🎯
- Deterministic assignment: `avatarIndex = Math.floor(timestamp / 1000) % avatars.length`
- Display as circular badge in each entry

### 6.3 Empty state
- When no games in localStorage: show friendly message "No games played yet — tap Play to set your first high score!" with a big Play button

---

## Phase 7: Polish & Integration

### 7.1 Consistent neubrutalist styling across all screens
- Every interactive element: 2px solid #1A1A1A border + hard shadow
- Hover: shadow grows to 6px, element shifts up-left
- Active/pressed: shadow collapses to 0, element shifts down-right
- All cards: cream bg, 2px border, 4-6px shadow

### 7.2 Touch + mouse support
- All drag interactions work on both input methods
- Bottom nav and buttons have appropriate tap targets (min 44px)
- `select-none` on game screen to prevent text selection during drag

### 7.3 Responsive layout
- Mobile-first, max-w-lg centered on desktop
- Bottom nav fixed at bottom on mobile
- Grid scales with viewport using `aspect-square` + `max-w-sm`

---

## File Structure
```
word_pop/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts          # Ported from mockups
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # View state router
│   ├── index.css                # Tailwind directives + neubrutalist utilities
│   ├── screens/
│   │   ├── Home.tsx
│   │   ├── Game.tsx
│   │   ├── Results.tsx
│   │   └── Leaderboard.tsx
│   ├── components/
│   │   ├── Header.tsx           # Shared top bar
│   │   ├── BottomNav.tsx        # Shared bottom nav
│   │   ├── LetterGrid.tsx       # The game grid
│   │   ├── DragPath.tsx         # SVG overlay
│   │   ├── WordChip.tsx         # Found-word chip
│   │   ├── PodiumCard.tsx       # Leaderboard podium
│   │   └── PillBadge.tsx        # Score/timer badge
│   ├── lib/
│   │   ├── dictionary.ts        # Word list loader + lookup
│   │   ├── gridGenerator.ts     # Boggle-style grid gen + solver
│   │   ├── scoring.ts           # Score table
│   │   ├── adjacency.ts         # Adjacency check helpers
│   │   └── storage.ts           # localStorage CRUD for game records
│   └── types.ts                 # GameRecord, Tile, etc.
└── stitch_pastel_word_grid_game/ # Design reference (read-only)
```

---

## Build Order
1. Scaffold + Tailwind config + CSS utilities (Phase 1)
2. Dictionary + grid generator + scoring (Phase 2)
3. Home screen (Phase 3)
4. Game screen with drag interaction (Phase 4) — this is the hardest part
5. Results screen (Phase 5)
6. Leaderboard screen (Phase 6)
7. Polish pass (Phase 7)

---

## Key Decisions
- **Font**: Fredoka for all display/headline roles (standardizing per user instruction)
- **Dictionary**: `an-array-of-english-words` npm package, ~3-letter minimum
- **Hints**: No-op stub (scoped out — appears/disappears per mockup behavior but does nothing on click)
- **Timer**: 90 seconds default, visible as pill badge in header
- **Persistence**: localStorage with JSON array of GameRecord objects
- **Avatars**: Emoji set with deterministic hash assignment
- **No routing library**: Simple view-state pattern in App.tsx
