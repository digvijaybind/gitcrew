import { z } from "zod";

export const StartGameRequestSchema = z.object({
  body: z.object({
    difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  }),
});

export const StartGameResponseSchema = z.object({
  statusCode: z.literal(201),
  gameId: z.string().uuid(),
  board: z.array(z.number()),
  difficulty: z.string(),
  startTime: z.string().datetime(),
});

export const SubmitMoveRequestSchema = z.object({
  params: z.object({
    gameId: z.string().uuid(),
  }),
  body: z.object({
    tileIndex: z.number().int().min(0).max(15),
  }),
});

export const SubmitMoveResponseSchema = z.object({
  statusCode: z.literal(200),
  gameId: z.string().uuid(),
  board: z.array(z.number()),
  moves: z.number(),
  solved: z.boolean(),
  elapsedTime: z.number(),
  formattedTime: z.string(),
});

export const GetGameResponseSchema = z.object({
  statusCode: z.literal(200),
  id: z.string().uuid(),
  userId: z.string().uuid(),
  board: z.array(z.number()),
  moves: z.number(),
  elapsedSeconds: z.number(),
  solved: z.boolean(),
  difficulty: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const GameScoreResponseSchema = z.object({
  statusCode: z.literal(200),
  id: z.string().uuid(),
  gameDuration: z.number(),
  moveCount: z.number(),
  createdAt: z.string().datetime(),
});

export const LeaderboardResponseSchema = z.object({
  statusCode: z.literal(200),
  data: z.array(
    z.object({
      rank: z.number(),
      userId: z.string().uuid(),
      username: z.string(),
      gameDuration: z.number(),
      moveCount: z.number(),
      createdAt: z.string().datetime(),
    }),
  ),
});
