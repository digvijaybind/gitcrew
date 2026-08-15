import crypto from "node:crypto";

const GRID_SIZE = 4;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

/**
 * Check if a 4x4 puzzle board is solvable.
 * For a 4x4 grid: count inversions + row number of blank (from bottom) must be even.
 */
export function isSolvable(board: number[]): boolean {
  let inversions = 0;
  const blankRow = board.indexOf(0);
  if (blankRow === -1) return false;
  // For even-width grids: 0-indexed row from bottom + inversions must be even
  const blankRowFromBottom = GRID_SIZE - Math.floor(blankRow / GRID_SIZE) - 1;

  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i] === 0) continue;
    for (let j = i + 1; j < TOTAL_CELLS; j++) {
      if (board[j] === 0) continue;
      if (board[i] > board[j]) inversions++;
    }
  }

  return (inversions + blankRowFromBottom) % 2 === 0;
}

/**
 * Shuffle a board using simulated random moves from solved state.
 * This guarantees solvability.
 */
export function shuffleBoard(numMoves = 200): number[] {
  const board = Array.from({ length: TOTAL_CELLS }, (_, i) =>
    i === TOTAL_CELLS - 1 ? 0 : i + 1,
  );
  let blankIdx = TOTAL_CELLS - 1;

  let lastDirection = -1;

  for (let i = 0; i < numMoves; i++) {
    const neighbors = getNeighbors(blankIdx);
    // Avoid undoing the last move
    const filtered = neighbors.filter(
      (n) => Math.sign(n - blankIdx) !== -lastDirection,
    );
    const candidates = filtered.length > 0 ? filtered : neighbors;
    const randomNeighbor =
      candidates[Math.floor(Math.random() * candidates.length)]!;

    // Swap blank with neighbor
    board[blankIdx] = board[randomNeighbor]!;
    board[randomNeighbor] = 0;
    lastDirection = randomNeighbor - blankIdx;
    blankIdx = randomNeighbor;
  }

  return board;
}

/**
 * Get valid neighbor indices for a blank position.
 */
function getNeighbors(blankIdx: number): number[] {
  const row = Math.floor(blankIdx / GRID_SIZE);
  const col = blankIdx % GRID_SIZE;
  const neighbors: number[] = [];

  if (row > 0) neighbors.push(blankIdx - GRID_SIZE); // up
  if (row < GRID_SIZE - 1) neighbors.push(blankIdx + GRID_SIZE); // down
  if (col > 0) neighbors.push(blankIdx - 1); // left
  if (col < GRID_SIZE - 1) neighbors.push(blankIdx + 1); // right

  return neighbors;
}

/**
 * Try to move a tile into the blank space.
 * Returns new board if valid, null if not.
 */
export function tryMove(board: number[], tileIdx: number): number[] | null {
  const blankIdx = board.indexOf(0);
  const neighbors = getNeighbors(blankIdx);

  if (!neighbors.includes(tileIdx)) return null;

  const newBoard = [...board];
  newBoard[blankIdx] = board[tileIdx];
  newBoard[tileIdx] = 0;
  return newBoard;
}

/**
 * Check if the board is in the solved state.
 */
export function isSolved(board: number[]): boolean {
  for (let i = 0; i < TOTAL_CELLS - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[TOTAL_CELLS - 1] === 0 || board.at(-1) === 0;
}

/**
 * Validate a board array.
 */
export function isValidBoard(board: number[]): boolean {
  if (!Array.isArray(board) || board.length !== TOTAL_CELLS) return false;

  const nums = board.filter((n) => n !== 0).sort((a, b) => a - b);
  const expected = Array.from(
    { length: TOTAL_CELLS - 1 },
    (_, i) => i + 1,
  );

  return nums.every((n, i) => n === expected[i]);
}

/**
 * Format seconds into MM:SS.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Generate a unique game ID.
 */
export function generateGameId(): string {
  return crypto.randomUUID();
}
