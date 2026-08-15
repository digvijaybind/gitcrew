import crypto from "node:crypto";

const ALGORITHM = "HS256";

export interface JwtPayload {
  sub: string;
  userId: string;
  username: string;
  type: "access" | "refresh";
  jti: string;
  iat: number;
  exp: number;
}

export interface JwtHeader {
  alg: string;
  typ: string;
}

/**
 * Base64url encode a Uint8Array.
 */
function base64urlEncode(data: Uint8Array): string {
  return Buffer.from(data).toString("base64url");
}

/**
 * Base64url decode a string to Uint8Array.
 */
function base64urlDecode(str: string): Uint8Array {
  return Buffer.from(str, "base64url");
}

/**
 * Sign a JWT token (HS256).
 * @param payload - The JWT payload
 * @param secret - The signing secret (string or Uint8Array)
 * @returns Signed JWT token string
 */
export function signJwt(
  payload: JwtPayload,
  secret: string | Uint8Array,
): string {
  const header: JwtHeader = { alg: ALGORITHM, typ: "JWT" };
  const headerJson = JSON.stringify(header);
  const payloadJson = JSON.stringify(payload);

  const headerB64 = base64urlEncode(new TextEncoder().encode(headerJson));
  const payloadB64 = base64urlEncode(new TextEncoder().encode(payloadJson));
  const signingInput = `${headerB64}.${payloadB64}`;

  let key: Uint8Array;
  if (typeof secret === "string") {
    key = new TextEncoder().encode(secret);
  } else {
    key = secret;
  }

  const hmac = crypto.createHmac("sha256", key);
  const signature = base64urlEncode(
    new Uint8Array(hmac.update(signingInput).digest()),
  );

  return `${signingInput}.${signature}`;
}

/**
 * Verify a JWT token (HS256).
 * @param token - The JWT token string
 * @param secret - The signing secret (string or Uint8Array)
 * @returns The decoded payload, or null if invalid
 */
export function verifyJwt(
  token: string,
  secret: string | Uint8Array,
): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64 || !signatureB64) return null;

  let key: Uint8Array;
  if (typeof secret === "string") {
    key = new TextEncoder().encode(secret);
  } else {
    key = secret;
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const hmac = crypto.createHmac("sha256", key);
  const expectedSignature = base64urlEncode(
    new Uint8Array(hmac.update(signingInput).digest()),
  );

  // Constant-time comparison
  const sigBytes = base64urlDecode(signatureB64);
  const expectedSigBytes = base64urlDecode(expectedSignature);
  if (sigBytes.length !== expectedSigBytes.length) return null;

  let result = 0;
  for (let i = 0; i < sigBytes.length; i++) {
    result |= sigBytes[i] ^ expectedSigBytes[i];
  }
  if (result !== 0) return null;

  try {
    const payloadBytes = base64urlDecode(payloadB64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson) as JwtPayload;

    // Check expiration
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a refresh token.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
