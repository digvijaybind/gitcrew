import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import type { FastifyUser } from "../types.js";

export const authPlugin = fp(
  async (fastify: FastifyInstance) => {
    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
    const JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me";

    const ACCESS_TOKEN_EXPIRY = "15m";
    const REFRESH_TOKEN_EXPIRY = "7d";

    // Register JWT plugin
    await fastify.register(import("@fastify/jwt"), {
      secret: JWT_SECRET,
      sign: {
        expiresIn: ACCESS_TOKEN_EXPIRY,
      },
    });

    fastify.decorate("jwtAuth", {
      ACCESS_TOKEN_EXPIRY,
      REFRESH_TOKEN_EXPIRY,
      JWT_SECRET,
      JWT_REFRESH_SECRET,

      signAccessToken(payload: {
        sub: string;
        userId: string;
        username: string;
      }): string {
        return fastify.jwt.sign(payload, {
          expiresIn: ACCESS_TOKEN_EXPIRY,
        });
      },

      signRefreshToken(payload: {
        sub: string;
        userId: string;
        username: string;
      }): string {
        const crypto = require("node:crypto");
        const secret = JWT_REFRESH_SECRET;
        const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
        const exp = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);
        const iat = Math.floor(Date.now() / 1000);
        const p = Buffer.from(JSON.stringify({ ...payload, type: "refresh" as const, jti: crypto.randomUUID(), iat, exp })).toString("base64url");
        const signingInput = `${header}.${p}`;
        const hmac = crypto.createHmac("sha256", secret);
        const signature = Buffer.from(hmac.update(signingInput).digest()).toString("base64url");
        return `${signingInput}.${signature}`;
      },

      verifyAccessToken(token: string): FastifyUser {
        return fastify.jwt.verify(token) as unknown as FastifyUser;
      },

      verifyRefreshToken(token: string): FastifyUser {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token");
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error("Token expired");
        return { sub: payload.sub, userId: payload.userId, username: payload.username } as FastifyUser;
      },

      // Simple JWT verification prehandler
      verifyJwt: async (request: any, reply: any) => {
        try {
          const token = request.headers.authorization?.replace("Bearer ", "") || "";
          request.user = fastify.jwt.verify(token) as unknown as FastifyUser;
        } catch {
          reply.code(401).send({
            type: "https://datatracker.ietf.org/doc/html/rfc9110#name-401-unauthorized",
            title: "Unauthorized",
            status: 401,
            detail: "Invalid or expired token",
          });
          throw new Error("Unauthorized");
        }
      },
    });
  },
  { name: "auth-plugin" },
);
