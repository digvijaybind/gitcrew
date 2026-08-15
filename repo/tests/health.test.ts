import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app.js";

describe("Health Endpoints", () => {
  let app: ReturnType<typeof createApp> extends Promise<infer T> ? T : never;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /health returns 200 with ok status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.version).toBe("1.0.0");
    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(new Date(body.timestamp).toISOString()).toBeDefined();
  });

  it("GET /health/details returns database health", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/health/details",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.database.status).toBe("ok");
    expect(body.database.message).toBe("Database connection healthy");
  });
});
