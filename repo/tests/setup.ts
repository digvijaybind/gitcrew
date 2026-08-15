import { beforeEach } from "vitest";
import process from "node:process";

beforeEach(() => {
  process.env.DATABASE_URL = ":memory:";
  process.env.NODE_ENV = "test";
  process.env.PORT = "3001";
  process.env.JWT_SECRET = "test-secret-key-for-jwt";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key";
  process.env.CORS_ORIGIN = "http://localhost:3001";
  process.env.RATE_LIMIT_MAX = "10000";
});
