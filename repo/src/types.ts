// Fastify types
import type { FastifyRequest } from "fastify";

// ─── Auth user ───────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  refreshToken: string | null;
  refreshTokenExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Puzzle game ─────────────────────────────────────────────────────
export interface Game {
  id: string;
  userId: string;
  board: number[];
  moves: number;
  elapsedSeconds: number;
  solved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Score (for leaderboard) ─────────────────────────────────────────
export interface Score {
  id: string;
  userId: string;
  gameDuration: number;
  moveCount: number;
  createdAt: string;
}

// ─── JWT decoration ──────────────────────────────────────────────────
export interface FastifyUser {
  sub: string;
  userId: string;
  username: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: FastifyUser;
  }
}

// ─── Pagination cursor ───────────────────────────────────────────────
export interface CursorPagination {
  cursor?: string;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Problem Details (RFC 7807) ──────────────────────────────────────
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}
