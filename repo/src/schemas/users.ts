import { z } from "zod";

export const GetUsersParamsSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional().default("10"),
  }),
});

export const GetUsersResponseSchema = z.object({
  statusCode: z.literal(200),
  data: z.array(
    z.object({
      id: z.string().uuid(),
      username: z.string(),
      email: z.string(),
      createdAt: z.string().datetime(),
    }),
  ),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const GetUserResponseSchema = z.object({
  statusCode: z.literal(200),
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});

export const GetUserScoresResponseSchema = z.object({
  statusCode: z.literal(200),
  data: z.array(
    z.object({
      id: z.string().uuid(),
      gameDuration: z.number(),
      moveCount: z.number(),
      createdAt: z.string().datetime(),
    }),
  ),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
