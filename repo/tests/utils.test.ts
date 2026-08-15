import { describe, it, expect } from "vitest";
import {
  isSolvable,
  shuffleBoard,
  tryMove,
  isSolved,
  isValidBoard,
  formatTime,
} from "../src/utils/game.js";

describe("Game Utilities", () => {
  describe("isSolvable", () => {
    it("should recognize a solved board as solvable", () => {
      const solved = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
      expect(isSolvable(solved)).toBe(true);
    });

    it("should return true for a shuffled solvable board", () => {
      const board = shuffleBoard(100);
      expect(isSolvable(board)).toBe(true);
    });

    it("should return false for an unshuffled non-solvable board", () => {
      // Swap two tiles to create un-solvable board
      const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 13, 15, 0];
      expect(isSolvable(board)).toBe(false);
    });
  });

  describe("shuffleBoard", () => {
    it("should produce a valid shuffled board", () => {
      const board = shuffleBoard(200);
      expect(board.length).toBe(16);
    });

    it("should produce a solvable board", () => {
      for (let i = 0; i < 10; i++) {
        const board = shuffleBoard(200);
        expect(isSolvable(board)).toBe(true);
      }
    });

    it("should produce different shuffles", () => {
      const boards = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const board = shuffleBoard(200);
        boards.add(JSON.stringify(board));
      }
      expect(boards.size).toBeGreaterThan(5);
    });

    it("should contain exactly numbers 0-15", () => {
      const board = shuffleBoard(200);
      const sorted = [...board].sort((a, b) => a - b);
      const expected = Array.from({ length: 16 }, (_, i) => i);
      expect(sorted).toEqual(expected);
    });
  });

  describe("tryMove", () => {
    it("should return null for non-adjacent tile", () => {
      const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
      expect(tryMove(board, 0)).toBeNull(); // tile 1 at index 0, blank at 15
    });

    it("should swap adjacent tile with blank", () => {
      const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
      const result = tryMove(board, 14); // move tile 15 left
      expect(result).not.toBeNull();
      expect(result![14]).toBe(0);
      expect(result![15]).toBe(15);
    });

    it("should handle blank at edge positions", () => {
      const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
      // Blank at index 14, valid neighbors: 10, 13, 15
      expect(tryMove(board, 10)).not.toBeNull(); // up
      expect(tryMove(board, 13)).not.toBeNull(); // left
      expect(tryMove(board, 15)).not.toBeNull(); // right
      expect(tryMove(board, 0)).toBeNull(); // far
    });
  });

  describe("isSolved", () => {
    it("should detect solved board", () => {
      const solved = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
      expect(isSolved(solved)).toBe(true);
    });

    it("should detect unsolved board", () => {
      const unsolved = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 13, 15, 0];
      expect(isSolved(unsolved)).toBe(false);
    });
  });

  describe("isValidBoard", () => {
    it("should accept a valid board", () => {
      expect(isValidBoard([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0])).toBe(true);
    });

    it("should reject board with wrong length", () => {
      expect(isValidBoard([1, 2, 3])).toBe(false);
    });

    it("should reject board with duplicate numbers", () => {
      expect(isValidBoard([1, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0])).toBe(false);
    });
  });

  describe("formatTime", () => {
    it("should format 0 seconds as 00:00", () => {
      expect(formatTime(0)).toBe("00:00");
    });

    it("should format 65 seconds as 01:05", () => {
      expect(formatTime(65)).toBe("01:05");
    });

    it("should format 3661 seconds as 61:01", () => {
      expect(formatTime(3661)).toBe("61:01");
    });
  });
});
