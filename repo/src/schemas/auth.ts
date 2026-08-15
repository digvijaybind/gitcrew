import { z } from "zod";

export const RegisterRequestSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric or underscore"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8).max(128),
  }),
});

export const RegisterResponseSchema = z.object({
  statusCode: z.literal(201),
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});

export const LoginRequestSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
  }),
});

export const LoginResponseSchema = z.object({
  statusCode: z.literal(200),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string().datetime(),
});

export const RefreshRequestSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const RefreshResponseSchema = z.object({
  statusCode: z.literal(200),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string().datetime(),
});

export const LogoutResponseSchema = z.object({
  statusCode: z.literal(200),
  message: z.literal("Logged out successfully"),
});

export const AuthMeResponseSchema = z.object({
  statusCode: z.literal(200),
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  createdAt: z.string().datetime(),
});
