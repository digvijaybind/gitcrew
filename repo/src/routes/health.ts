import type { FastifyInstance } from "fastify";
import type { ProblemDetails } from "../types.js";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get<{ Reply: { status: string; version: string; uptime: number; timestamp: string } }>(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            required: ["status", "version", "uptime", "timestamp"],
            properties: {
              status: { type: "string", const: "ok" },
              version: { type: "string" },
              uptime: { type: "number" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: "ok",
        version: (fastify as any).config!.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    },
  );

  fastify.get<{
    Reply: {
      status: string;
      version: string;
      uptime: number;
      timestamp: string;
      database: { status: string; message: string };
    } | ProblemDetails;
  }>("/health/details", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            version: { type: "string" },
            uptime: { type: "number" },
            timestamp: { type: "string" },
            database: {
              type: "object",
              properties: {
                status: { type: "string" },
                message: { type: "string" },
              },
            },
          },
        },
        503: {
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
  }, async (request, reply) => {
    try {
      // Verify database connectivity
      fastify.db.prepare("SELECT 1").get();

      return {
        status: "ok",
        version: (fastify as any).config!.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: "ok",
          message: "Database connection healthy",
        },
      };
    } catch {
      reply.status(503);
      return {
        type: "https://httpwg.org/specs/rfc7807.html#rfc.section-6.6",
        title: "Service Unavailable",
        status: 503,
        detail: "Database connection unhealthy",
        instance: request.url,
      } satisfies ProblemDetails;
    }
  });
}
