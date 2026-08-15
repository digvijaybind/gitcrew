export const config = {
  port: parseInt(process.env.PORT || "3000"),
  host: process.env.HOST || "0.0.0.0",
  version: "1.0.0",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  bodyLimit: 1024 * 1024, // 1MB
};
