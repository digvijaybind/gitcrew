# Brief — Puzzle Game Application

## Restatement

Build a self-contained, browser-based puzzle game using React. The player opens `app/index.html` in a browser and gets a fully working puzzle game experience — no server, no build step required.

## One Outcome That Must Work

**A playable puzzle game loads and runs in the browser when opening `app/index.html`** — a user can interact with the puzzle (e.g. drag pieces, swap tiles, or click to solve), see win/lose feedback, and replay. That's the single bar we pass or fail on.

## Boundaries

1. **Static only** — everything lives under `app/`, works via double-click, zero server dependency. No API routes, no Node runtime.
2. **React, but simple** — use React (the template is `api`, so we keep it lightweight). No complex state management libraries, no routing — just one clean component tree.
3. **One puzzle, well-polished** — ship one puzzle type done right (e.g. a sliding-tile 15-puzzle or a match-3 mini-game), rather than three half-built ones. Focus on smooth interaction, clear visuals, and satisfying win state.
