import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";
import crypto from "node:crypto";

describe("Users Endpoints", () => {
  let app: ReturnType<typeof createApp> extends Promise<infer T> ? T : never;
  let accessToken: string;
  let userId: string;
  let userEmail: string;

  beforeAll(async () => {
    app = await createApp();

    const username = `user_${crypto.randomUUID().slice(0, 8)}`;
    userEmail = `${username}@example.com`;

    // Register
    const registerRes = await app.inject({
      method: "POST",
      url: "/auth/register",
      body: { username, email: userEmail, password: "UserPass123!" },
      headers: { "Content-Type": "application/json" },
    });
    expect(registerRes.statusCode).toBe(201);
    userId = JSON.parse(registerRes.body).id;

    // Login
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { email: userEmail, password: "UserPass123!" },
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.statusCode).toBe(200);
    accessToken = JSON.parse(loginRes.body).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /users/me", () => {
    it("should return current user profile", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/users/me",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(body.id).toBe(userId);
      expect(body.email).toBe(userEmail);
    });

    it("should return 401 without token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/users/me",
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /users", () => {
    it("should return paginated user list", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/users?limit=10",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.hasMore).toBe("boolean");
    });

    it("should support pagination cursor", async () => {
      const res1 = await app.inject({
        method: "GET",
        url: "/users?limit=5",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body1 = JSON.parse(res1.body);
      expect(Array.isArray(body1.data)).toBe(true);

      const res2 = await app.inject({
        method: "GET",
        url: `/users?limit=5&cursor=${body1.nextCursor}`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body2 = JSON.parse(res2.body);
      expect(Array.isArray(body2.data)).toBe(true);
    });
  });

  describe("GET /users/:userId/scores", () => {
    it("should return empty scores for new user", async () => {
      const res = await app.inject({
        method: "GET",
        url: `/users/${userId}/scores?limit=10`,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.statusCode).toBe(200);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });
});
