# PRD — Puzzle Game Application

## Problem

People want a quick, satisfying puzzle experience they can open instantly in a browser — no install, no server, no build step. Existing options either require a server (Node.js app), a build pipeline (Create React App, Vite), or a platform (Steam, itch.io). We deliver a single HTML file that works with a double-click.

## Users

| Segment | Needs |
|---|---|
| Casual browser users | Open a file, play immediately, feel good when they win |
| Developers / tinkerers | Clean, readable React code they can fork and tweak |
| Teachers / event organizers | Embed on a shared computer; no setup needed |

## Experience — 15-Puzzle (Sliding Tile Puzzle)

### Core Loop
1. User opens `app/index.html`.
2. A **15-puzzle** (4×4 grid with numbered tiles and one empty space) loads.
3. Tiles slide into the empty space via **click** or **arrow-key**.
4. Goal: arrange tiles 1–15 in order (left-to-right, top-to-bottom).
5. A **win banner** with confetti animation appears when solved.
6. User can **replay** immediately with a shuffled board.

### Interaction Design
- **Click to move**: Click any tile adjacent to the empty space — it slides into it.
- **Keyboard support**: Arrow keys shift the tile in that direction.
- **Timer**: Displays elapsed time; resets on replay.
- **Move counter**: Tracks total moves.
- **Shuffle animation**: Tiles visually animate when the board shuffles on load.
- **Win celebration**: A full-screen overlay with a "🎉 You solved it!" message, confetti particles, and a "Play Again" button.

### Visual Design
- Clean, minimal aesthetic: neutral background, large legible tile numbers.
- Tiles use subtle shadows and hover effects for depth.
- Smooth CSS transitions for tile movement (not jarring instant swaps).
- Responsive layout: works on desktop and tablet viewport sizes.
- Color-coded win overlay: celebratory but not garish.

### Content Plan
| Element | Content |
|---|---|
| Title | "15-Puzzle" |
| Subtitle | "Slide the tiles to solve the puzzle" |
| Timer display | `00:00` format |
| Move counter | "Moves: 0" |
| Controls hint | "Click tiles or use arrow keys" |
| Win overlay | "You solved it!" + "Play Again" button |
| Loading state | Brief spinner while initial shuffle completes |

## Out of Scope

- Multiple puzzle types (only the 15-puzzle for v1)
- Mobile touch/swipe gestures (click/keyboard only)
- High scores / localStorage persistence
- Sound effects or music
- Dark mode / themes
- Multiplayer or shared puzzles
- A build pipeline — this is a single HTML file

## Success Criteria

- [ ] `app/index.html` opens in any browser and renders the game
- [ ] Tiles slide correctly when clicked or arrow-keyed
- [ ] Board is solvable on shuffle (parity-checked shuffle)
- [ ] Win state triggers when tiles 1–15 are in order
- [ ] "Play Again" button creates a fresh shuffled board
- [ ] Timer and move counter update correctly
- [ ] Responsive layout works down to 400px viewport width
- [ ] Zero console errors in browser DevTools
