import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import crypto from "node:crypto";

describe("Auth Endpoints", () => {
  let app: ReturnType<typeof createApp> extends Promise<infer T> ? T : never;
  let testUser: { username: string; email: string; password: string };

  beforeAll(async () => {
    app = await createApp();
    testUser = {
      username: `testuser_${crypto.randomUUID().slice(0, 8)}`,
      email: `testuser_${crypto.randomUUID().slice(0, 8)}@example.com`,
      password: "SecurePass123!",
    };
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/register",
        body: testUser,
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(201);
      expect(body.username).toBe(testUser.username);
      expect(body.email).toBe(testUser.email);
      expect(body.id).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/register",
        body: testUser,
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(409);
      const body = JSON.parse(res.body);
      expect(body.title).toBe("Conflict");
    });

    it("should reject invalid username", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/register",
        body: {
          username: "a",
          email: `short_${crypto.randomUUID().slice(0, 8)}@example.com`,
          password: "SecurePass123!",
        },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.status).toBe(400);
    });

    it("should reject invalid email", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/register",
        body: {
          username: "validuser123",
          email: "not-an-email",
          password: "SecurePass123!",
        },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(body.accessToken).toBeDefined();
      expect(typeof body.accessToken).toBe("string");
      expect(body.refreshToken).toBeDefined();
      expect(typeof body.refreshToken).toBe("string");
      expect(body.expiresAt).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {
          email: testUser.email,
          password: "WrongPassword!",
        },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.body);
      expect(body.title).toBe("Unauthorized");
    });

    it("should reject non-existent user", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {
          email: `nonexistent_${crypto.randomUUID().slice(0, 8)}@example.com`,
          password: "SomePassword!",
        },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /auth/refresh", () => {
    let refreshToken: string;

    beforeAll(async () => {
      const loginRes = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
        headers: { "Content-Type": "application/json" },
      });
      expect(loginRes.statusCode).toBe(200);
      refreshToken = JSON.parse(loginRes.body).refreshToken;
    });

    it.skip("should refresh access token", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        body: { refreshToken },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.refreshToken).not.toBe(refreshToken);
    });

    it("should reject invalid refresh token", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/refresh",
        body: { refreshToken: "invalid-token" },
        headers: { "Content-Type": "application/json" },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginRes = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {
          email: testUser.email,
          password: testUser.password,
        },
        headers: { "Content-Type": "application/json" },
      });
      expect(loginRes.statusCode).toBe(200);
      accessToken = JSON.parse(loginRes.body).accessToken;
    });

    it("should logout successfully", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/logout",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(body.message).toBe("Logged out successfully");
    });
  });

  describe("E2E: register -> login -> protected action", () => {
    it("should complete the full auth flow", async () => {
      const e2eEmail = `e2e_${crypto.randomUUID().slice(0, 8)}@example.com`;
      const e2eUsername = `e2e_${crypto.randomUUID().slice(0, 8)}`;

      // Register
      const registerRes = await app.inject({
        method: "POST",
        url: "/auth/register",
        body: {
          username: e2eUsername,
          email: e2eEmail,
          password: "E2ETestPass!",
        },
        headers: { "Content-Type": "application/json" },
      });
      expect(registerRes.statusCode).toBe(201);

      // Login
      const loginRes = await app.inject({
        method: "POST",
        url: "/auth/login",
        body: {
          email: e2eEmail,
          password: "E2ETestPass!",
        },
        headers: { "Content-Type": "application/json" },
      });
      expect(loginRes.statusCode).toBe(200);
      const accessToken = JSON.parse(loginRes.body).accessToken;

      // Access protected route
      const meRes = await app.inject({
        method: "GET",
        url: "/users/me",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(meRes.statusCode).toBe(200);
      const meBody = JSON.parse(meRes.body);
      expect(meBody.id).toBeDefined();
      expect(meBody.email).toBe(e2eEmail);
    });
  });
});
