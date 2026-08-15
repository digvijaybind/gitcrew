import type { FastifyInstance } from "fastify";
import type { ProblemDetails } from "../types.js";

export async function usersRoutes(fastify: FastifyInstance) {
  // GET /users - list users (admin)
  fastify.get<{
    Querystring: { cursor?: string; limit?: string };
    Reply: {
      statusCode: number;
      data: Array<{ id: string; username: string; email: string; createdAt: string }>;
      nextCursor: string | null;
      hasMore: boolean;
    };
  }>(
    "/users",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            cursor: { type: "string" },
            limit: { type: "string", pattern: "^[0-9]+$" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    username: { type: "string" },
                    email: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              nextCursor: { type: ["string", "null"] },
              hasMore: { type: "boolean" },
            },
          },
        },
      },
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (request, reply) => {
      const limit = Math.min(parseInt(request.query.limit || "10") || 10, 50);
      const cursor = request.query.cursor || "";

      const users = fastify.db
        .prepare(
          `SELECT id, username, email, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        )
        .all(parseInt(cursor) || 0, limit + 1) as any[];

      const hasMore = users.length > limit;
      const data = users.slice(0, limit);

      reply.status(200);
      return {
        statusCode: 200,
        data: data.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          createdAt: u.created_at,
        })),
        nextCursor: hasMore ? String((parseInt(cursor) || 0) + limit) : null,
        hasMore,
      };
    },
  );

  // GET /users/me - get current user
  fastify.get<{
    Reply: {
      statusCode: number;
      id: string;
      username: string;
      email: string;
      createdAt: string;
    };
  }>(
    "/users/me",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              id: { type: "string", format: "uuid" },
              username: { type: "string" },
              email: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          404: {
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
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (request, reply) => {
      const userId = request.user.userId;

      const user = fastify.stmts!.getUserById.get(userId) as any;
      if (!user) {
        reply.status(404);
        return {
          type: "https://datatracker.ietf.org/doc/html/rfc9110#name-404-not-found",
          title: "Not Found",
          status: 404,
          detail: "User not found",
          instance: request.url,
        } as ProblemDetails;
      }

      reply.status(200);
      return {
        statusCode: 200,
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      };
    },
  );

  // GET /users/:userId/scores - get user scores
  fastify.get<{
    Params: { userId: string };
    Querystring: { cursor?: string; limit?: string };
    Reply: {
      statusCode: number;
      data: Array<{ id: string; gameDuration: number; moveCount: number; createdAt: string }>;
      nextCursor: string | null;
      hasMore: boolean;
    };
  }>(
    "/users/:userId/scores",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            cursor: { type: "string" },
            limit: { type: "string", pattern: "^[0-9]+$" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              statusCode: { type: "number", const: 200 },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    gameDuration: { type: "number" },
                    moveCount: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
              nextCursor: { type: ["string", "null"] },
              hasMore: { type: "boolean" },
            },
          },
        },
      },
      preHandler: [(fastify as any).jwtAuth!.verifyJwt],
    },
    async (request, reply) => {
      const { userId } = request.params;
      const limit = Math.min(
        parseInt(request.query.limit || "10") || 10,
        50,
      );
      const offset = request.query.cursor ? parseInt(request.query.cursor) : 0;

      const scores = fastify.stmts!.getScoresByUser.all(
        userId,
        limit + 1,
        offset,
      ) as any[];

      const hasMore = scores.length > limit;
      const data = scores.slice(0, limit);

      reply.status(200);
      return {
        statusCode: 200,
        data: data.map((s) => ({
          id: s.id,
          gameDuration: s.game_duration,
          moveCount: s.move_count,
          createdAt: s.created_at,
        })),
        nextCursor: hasMore ? String(offset + limit) : null,
        hasMore,
      };
    },
  );
}
