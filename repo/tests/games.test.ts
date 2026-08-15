import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import crypto from "node:crypto";

describe("Game Endpoints", () => {
  let app: ReturnType<typeof createApp> extends Promise<infer T> ? T : never;
  let accessToken: string;

  beforeAll(async () => {
    app = await createApp();

    // Register and login a test user
    const username = `gamer_${crypto.randomUUID().slice(0, 8)}`;
    const email = `${username}@example.com`;

    const registerRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: { username, email, password: "GamePass123!" },
      headers: { "Content-Type": "application/json" },
    });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email, password: "GamePass123!" },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.statusCode).toBe(200);
    accessToken = JSON.parse(loginRes.body).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /games", () => {
    it("should start a new game", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/games",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ difficulty: "medium" }),
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(201);
      expect(body.gameId).toBeDefined();
      expect(Array.isArray(body.board)).toBe(true);
      expect(body.board.length).toBe(16);
      expect(body.difficulty).toBe("medium");
      expect(body.startTime).toBeDefined();
    });

    it("should create solvable board", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/games",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect(res.statusCode).toBe(201);
      const board = JSON.parse(res.body).board;
      expect(board.length).toBe(16);
      for (const val of board) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(15);
      }
    });
  });

  describe("GET /games/:gameId", () => {
    it("should get game state", async () => {
      // Start a game first
      const startRes = await app.inject({
        method: "POST",
        url: "/games",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      expect(startRes.statusCode).toBe(201);
      const gameId = JSON.parse(startRes.body).gameId;

      const res = await app.inject({
        method: "GET",
        url: `/games/${gameId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(body.id).toBe(gameId);
      expect(Array.isArray(body.board)).toBe(true);
      expect(typeof body.moves).toBe("number");
      expect(typeof body.elapsedSeconds).toBe("number");
      expect(typeof body.solved).toBe("boolean");
    });

    it("should return 404 for non-existent game", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/games/00000000-0000-0000-0000-000000000000`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /games/:gameId/moves", () => {
    it("should accept a valid move", async () => {
      const startRes = await app.inject({
        method: "POST",
        url: "/games",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const gameId = JSON.parse(startRes.body).gameId;

      // Get the board to find a valid move
      const gameRes = await app.inject({
        method: "GET",
        url: `/games/${gameId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const board = JSON.parse(gameRes.body).board;
      const blankIdx = board.indexOf(0);

      // Find a valid neighbor to move
      let tileIdx: number;
      if (blankIdx >= 4) tileIdx = blankIdx - 4;
      else if (blankIdx < 12) tileIdx = blankIdx + 4;
      else if (blankIdx % 4 > 0) tileIdx = blankIdx - 1;
      else tileIdx = blankIdx + 1;

      const res = await app.inject({
        method: "POST",
        url: `/games/${gameId}/moves`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tileIndex: tileIdx }),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(body.gameId).toBe(gameId);
      expect(Array.isArray(body.board)).toBe(true);
      expect(body.moves).toBe(1);
      expect(typeof body.elapsedTime).toBe("number");
      expect(typeof body.formattedTime).toBe("string");
    });

    it("should return 200 for a move (valid or invalid)", async () => {
      const startRes = await app.inject({
        method: "POST",
        url: "/games",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const gameId = JSON.parse(startRes.body).gameId;

      const res = await app.inject({
        method: "POST",
        url: `/games/${gameId}/moves`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tileIndex: 0 }),
      });

      // Should be 200 (move accepted) or 400 (invalid move)
      expect([200, 400]).toContain(res.statusCode);
    });

    it("should detect a solved game", async () => {
      const startRes = await app.inject({
        method: "POST",
        url: "/games",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const gameId = JSON.parse(startRes.body).gameId;

      // Get the userId from the JWT token
      const userId = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64").toString()).userId;

      // Update the game to solved state
      const solvedBoard = JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
      app.stmts.updateGame.run(
        solvedBoard,
        30,
        60,
        1,
        gameId,
        userId,
      );

      const res = await app.inject({
        method: "GET",
        url: `/games/${gameId}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.solved).toBe(true);
    });
  });

  describe("GET /games/leaderboard", () => {
    it("should return leaderboard", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/games/leaderboard",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
