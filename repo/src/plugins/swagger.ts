import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";

const isProd = process.env.NODE_ENV === "production";

export const swaggerPlugin = fp(async (fastify: FastifyInstance) => {
  // Register @fastify/swagger
  await fastify.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "15-Puzzle Game API",
        description:
          "RESTful API for the 15-Puzzle Game Application.",
        version: "1.0.0",
      },
      servers: [
        {
          url: isProd
            ? "https://api.puzzle-game.example.com"
            : "http://localhost:3000",
          description: isProd ? "Production" : "Development",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // Register @fastify/swagger-ui
  await fastify.register(import("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}, { name: "swagger-plugin" });
