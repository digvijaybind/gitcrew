import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { config } from "./config.js";
import { dbPlugin } from "./plugins/db.js";
import { authPlugin } from "./plugins/auth.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { usersRoutes } from "./routes/users.js";
import { gamesRoutes } from "./routes/games.js";

export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      transport:
        process.env.NODE_ENV === "production"
          ? undefined
          : { targets: [{ target: "pino-pretty", options: { translateTime: "HH:MM:ss Z" } }] },
      level: "info",
    },
    bodyLimit: config.bodyLimit,
    ignoreTrailingSlash: true,
  });

  // Attach config
  fastify.decorate("config", config);

  // Register plugins
  await fastify.register(dbPlugin);
  await fastify.register(authPlugin);
  await fastify.register(swaggerPlugin);

  // CORS
  await fastify.register(import("@fastify/cors"), {
    origin: config.corsOrigin.split(","),
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Idempotency-Key",
    ],
    credentials: true,
  });

  // Helmet security headers
  await fastify.register(import("@fastify/helmet"), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  // Rate limiting (skip for health endpoints)
  await fastify.register(import("@fastify/rate-limit"), {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    keyGenerator: (req: any) => req.ip,
    skip: (req: any) => req.url.startsWith("/health"),
  });

  // Global error handler — RFC 7807 Problem Details
  fastify.setErrorHandler((error: any, _request: any, reply: any) => {
    const statusCode = error.statusCode || error.code === "FST_ERR_VALIDATION" ? 400 : 500;

    if (error.code === "FST_ERR_VALIDATION") {
      reply.status(statusCode);
      return {
        type: "https://httpwg.org/specs/rfc7807.html",
        title: "Validation Error",
        status: statusCode,
        detail: error.message,
        instance: _request.url,
        validation: error.validation,
      };
    }

    fastify.log.error({ err: error }, "Unhandled error");

    reply.status(statusCode);
    return {
      type: "https://httpwg.org/specs/rfc7807.html",
      title: statusCode === 500 ? "Internal Server Error" : "Error",
      status: statusCode,
      detail:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message ?? "Unknown error",
      instance: _request.url,
    };
  });

  // Register routes
  await fastify.register(async (instance: FastifyInstance) => {
    await instance.register(healthRoutes);
  });

  await fastify.register(async (instance: FastifyInstance) => {
    await instance.register(authRoutes);
  });

  await fastify.register(async (instance: FastifyInstance) => {
    await instance.register(usersRoutes);
  });

  await fastify.register(async (instance: FastifyInstance) => {
    await instance.register(gamesRoutes);
  });

  return fastify;
}

// Start server only when run directly
if (process.env.NODE_ENV !== "test") {
  const app = await createApp();

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
