# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-01-01

### Added

- **Fastify v5 API** with TypeScript — clean, typed, modular architecture
- **JWT authentication** — HS256 access tokens (15 min) + refresh tokens (7 days) with rotation
- **15-Puzzle game engine** — parity-checked shuffle, move validation, win detection, difficulty levels
- **User system** — register, login, logout, profile, paginated user list, per-user scores
- **Score tracking & leaderboard** — top 10 by solve time and move count, persisted to SQLite
- **SQLite database** — WAL mode, prepared statements, foreign keys, auto-migrate on boot
- **Health endpoints** — `/health` and `/health/details` with DB connectivity check
- **RFC 7807 Problem Details** — consistent error responses across all endpoints
- **OpenAPI/Swagger docs** — interactive Scalar UI at `/docs`, JSON spec at `/docs/json`
- **Security stack** — Helmet (CSP, HSTS, X-Frame-Options), CORS whitelist, rate limiting (100 req/min), 1 MB body limit
- **Docker support** — multi-stage build, distroless non-root runtime, health check
- **52 passing tests** — unit tests for game logic, JWT, hashing; integration tests for full API flows; e2e tests for all endpoints
- **`migrate.ts` script** — standalone database migration for initial setup and schema updates

### Fixed

- `@fastify/rate-limit` `skip` option placement for Fastify v5 compatibility
- `@fastify/jwt` SignOptions/VerifyOptions `secret` key handling
- `@fastify/swagger-ui` removed invalid `staticContext` option
- JWT preHandler type mismatches across auth, games, and users routes
- `httpErrors` reference in verifyJwt prehandler for Fastify v5
- TypeScript null-check guards in game logic (`isSolvable`, `shuffleBoard`, `isSolved`)
- Unused imports and variables cleaned across all route files
- Created missing `src/scripts/migrate.ts` referenced in package.json scripts
- Rate limit plugin skip function parameter typing
