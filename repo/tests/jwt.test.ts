import { describe, it, expect } from "vitest";
import { signJwt, verifyJwt, generateRefreshToken } from "../src/utils/jwt.js";

describe("JWT Utilities", () => {
  const secret = "test-secret-key-12345";
  const payload = {
    sub: "user-123",
    userId: "user-123",
    username: "testuser",
    type: "access" as const,
    jti: "abc-123",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  describe("signJwt", () => {
    it("should produce a valid JWT token", () => {
      const token = signJwt(payload, secret);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should produce different tokens for same payload (different jti)", () => {
      const p1 = { ...payload, jti: "token-1" };
      const p2 = { ...payload, jti: "token-2" };
      expect(signJwt(p1, secret)).not.toBe(signJwt(p2, secret));
    });
  });

  describe("verifyJwt", () => {
    it("should verify a valid token", () => {
      const token = signJwt(payload, secret);
      const decoded = verifyJwt(token, secret);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe("user-123");
      expect(decoded?.username).toBe("testuser");
    });

    it("should reject a tampered token", () => {
      const token = signJwt(payload, secret);
      const tampered = token.slice(0, -10) + "tampered1234567890";
      expect(verifyJwt(tampered, secret)).toBeNull();
    });

    it("should reject a token signed with wrong secret", () => {
      const token = signJwt(payload, "correct-secret");
      expect(verifyJwt(token, "wrong-secret")).toBeNull();
    });

    it("should reject an expired token", () => {
      const expiredPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) - 100,
      };
      const token = signJwt(expiredPayload, secret);
      expect(verifyJwt(token, secret)).toBeNull();
    });

    it("should reject malformed token", () => {
      expect(verifyJwt("not-a-jwt", secret)).toBeNull();
      expect(verifyJwt("a.b", secret)).toBeNull();
      expect(verifyJwt("", secret)).toBeNull();
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a unique token each time", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 10; i++) {
        tokens.add(generateRefreshToken());
      }
      expect(tokens.size).toBe(10);
    });

    it("should generate a reasonably long token", () => {
      const token = generateRefreshToken();
      expect(token.length).toBeGreaterThan(30);
    });
  });
});
