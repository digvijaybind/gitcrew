import type { FastifyInstance } from "fastify";
import type { ProblemDetails } from "../types.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { generateRefreshToken } from "../utils/jwt.js";

export async function authRoutes(fastify: FastifyInstance) {

  // POST /auth/register
  fastify.post<{
    Body: { username: string; email: string; password: string };
    Reply: {
      statusCode: number;
      id: string;
      username: string;
      email: string;
      createdAt: string;
    };
  }>(
    "/auth/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 30,
              pattern: "^[a-zA-Z0-9_]+$",
            },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, maxLength: 128 },
          },
        },
        response: {
          201: {
            type: "object",
            required: ["id", "username", "email", "createdAt"],
            properties: {
              statusCode: { type: "number", const: 201 },
              id: { type: "string", format: "uuid" },
              username: { type: "string" },
              email: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          409: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              status: { type: "number" },
              detail: { type: "string" },
              instance: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { username, email, password } = request.body;

      // Check if user already exists
      const existing = fastify.stmts!.getUserByEmail.get(email);
      if (existing) {
        reply.status(409);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-409-conflict",
          title: "Conflict",
          status: 409,
          detail: "A user with this email already exists",
          instance: request.url,
        } as ProblemDetails;
      }

      const usernameCheck = fastify.stmts!.getUserByUsername.get(username);
      if (usernameCheck) {
        reply.status(409);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-409-conflict",
          title: "Conflict",
          status: 409,
          detail: "A user with this username already exists",
          instance: request.url,
        } as ProblemDetails;
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate UUID for user
      const { default: crypto } = await import("node:crypto");
      const id = crypto.randomUUID();

      // Create user
      fastify.stmts.createUser.run(id, username, email, passwordHash);

      reply.status(201);
      return {
        statusCode: 201,
        id,
        username,
        email,
        createdAt: new Date().toISOString(),
      };
    },
  );

  // POST /auth/login
  fastify.post<{
    Body: { email: string; password: string };
    Reply: {
      statusCode: number;
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
  }>(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["accessToken", "refreshToken", "expiresAt"],
            properties: {
              statusCode: { type: "number", const: 200 },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          401: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              status: { type: "number" },
              detail: { type: "string" },
              instance: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = fastify.stmts!.getUserByEmail.get(email) as any;
      if (!user) {
        reply.status(401);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-401-unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid email or password",
          instance: request.url,
        } as ProblemDetails;
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        reply.status(401);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-401-unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid email or password",
          instance: request.url,
        } as ProblemDetails;
      }

      // Generate tokens
      const accessToken = fastify.jwtAuth!.signAccessToken({
        sub: user.id,
        userId: user.id,
        username: user.username,
      });

      const refreshTokenValue = generateRefreshToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      fastify.stmts!.updateUserToken.run(refreshTokenValue, expiresAt, user.id);

      reply.status(200);
      return {
        statusCode: 200,
        accessToken,
        refreshToken: refreshTokenValue,
        expiresAt,
      };
    },
  );

  // POST /auth/refresh
  fastify.post<{
    Body: { refreshToken: string };
    Reply: {
      statusCode: number;
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
  }>(
    "/auth/refresh",
    {
      schema: {
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            required: ["accessToken", "refreshToken", "expiresAt"],
            properties: {
              statusCode: { type: "number", const: 200 },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              expiresAt: { type: "string", format: "date-time" },
            },
          },
          401: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              status: { type: "number" },
              detail: { type: "string" },
              instance: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { refreshToken } = request.body;

      // Find user with matching refresh token
      const rows: any[] = fastify.db.prepare("SELECT * FROM users WHERE refresh_token IS NOT NULL").all();
      const user = rows.find((u: any) => u.refresh_token === refreshToken) || null;

      if (!user) {
        reply.status(401);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-401-unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid refresh token",
          instance: request.url,
        } as ProblemDetails;
      }

      // Verify refresh token with its secret
      let payload: any;
      try {
        payload = fastify.jwtAuth!.verifyRefreshToken(refreshToken);
      } catch {
        reply.status(401);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-401-unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Invalid refresh token",
          instance: request.url,
        } as ProblemDetails;
      }

      // Generate new access token
      const newAccessToken = fastify.jwtAuth!.signAccessToken({
        sub: payload.sub,
        userId: payload.userId,
        username: payload.username,
      });

      // Generate new refresh token
      const newRefreshToken = generateRefreshToken();
      const newExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      fastify.stmts!.updateUserToken.run(
        newRefreshToken,
        newExpiresAt,
        user.id,
      );

      reply.status(200);
      return {
        statusCode: 200,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
      };
    },
  );

  // POST /auth/logout
  fastify.post<{
    Reply: { statusCode: number; message: string };
  }>(
    "/auth/logout",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: [fastify.jwtAuth.verifyJwt],
    },
    async (request, reply) => {
      const userId = request.user.userId;

      fastify.stmts!.updateUserToken.run(null, null, userId);

      reply.status(200);
      return {
        statusCode: 200,
        message: "Logged out successfully",
      };
    },
  );
}
