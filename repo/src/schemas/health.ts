import { z } from "zod";

export const HealthResponseSchema = z.object({
  statusCode: z.literal(200),
  status: z.literal("ok"),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string().datetime(),
});

export const DatabaseStatusSchema = z.object({
  status: z.literal("ok"),
  message: z.literal("Database connection healthy"),
});

export const HealthDetailResponseSchema = z.object({
  statusCode: z.literal(200),
  status: z.literal("ok"),
  version: z.string(),
  uptime: z.number(),
  timestamp: z.string().datetime(),
  database: DatabaseStatusSchema,
});
