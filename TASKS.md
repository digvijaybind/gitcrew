# TASKS — Puzzle Game Application (API Backend)

## Phase 1: Scaffold

- [x] **T001 — Create project structure**
  - `src/app.ts`, `src/config.ts`, `tsconfig.json`, `package.json`
  - `Dockerfile`, `docker-compose.yml`, `.env.example`
  - `vitest.config.ts` for test runner

- [x] **T002 — Verify project builds**
  - `npm install` succeeds
  - `npx vitest run` runs tests

## Phase 2: Core Infrastructure

- [x] **T003 — Implement database plugin**
  - SQLite (better-sqlite3) connection with WAL mode
  - Prepared statements for all CRUD operations
  - Migrations: users, games, scores tables
  - Indexes for performance

- [x] **T004 — Implement JWT authentication plugin**
  - HS256 access tokens (15min expiry)
  - HS256 refresh tokens (7d expiry)
  - Custom sign/verify utilities
  - Fastify JWT integration with preHandler

- [x] **T005 — Implement utility functions**
  - `jwt.ts`: signJwt, verifyJwt, generateRefreshToken
  - `hash.ts`: hashPassword, verifyPassword (bcrypt)
  - `game.ts`: isSolvable, shuffleBoard, tryMove, isSolved, formatTime

## Phase 3: API Routes

- [x] **T006 — Health endpoints**
  - `GET /health` — returns status, version, uptime
  - `GET /health/details` — includes database health check
  - 503 when database is unreachable

- [x] **T007 — Auth routes**
  - `POST /auth/register` — create user with validated input
  - `POST /auth/login` — JWT access + refresh tokens
  - `POST /auth/refresh` — rotate refresh tokens
  - `POST /auth/logout` — invalidate refresh token

- [x] **T008 — User routes**
  - `GET /users` — paginated user list
  - `GET /users/me` — current user profile
  - `GET /users/:userId/scores` — user game scores

- [x] **T009 — Game routes**
  - `POST /games` — start new game (shuffled board)
  - `GET /games/:gameId` — get game state
  - `POST /games/:gameId/moves` — submit move, auto-detect win
  - `GET /games/leaderboard` — top scores

## Phase 4: Security & Documentation

- [x] **T010 — Security baseline**
  - Helmet headers (CSP, HSTS, X-Frame-Options)
  - CORS locked to configured origins
  - Rate limiting (100 req/min per IP)
  - Request size limit: 1MB
  - RFC 7807 Problem Details error responses
  - Idempotency support via Idempotency-Key header

- [x] **T011 — OpenAPI documentation**
  - OpenAPI 3.1 spec at `/docs/json`
  - Scalar UI at `/docs`
  - JWT bearer auth security scheme
  - Zod schemas for all endpoints

## Phase 5: Testing

- [x] **T012 — Unit tests**
  - JWT utilities: sign, verify, expiry, tampering
  - Game logic: solvability, shuffle, moves, solved detection
  - Time formatting, board validation

- [x] **T013 — Integration tests**
  - Health endpoints: status, database check
  - Auth flow: register → login → protected action
  - User CRUD: list, profile, scores
  - Game flow: start → move → get state → leaderboard
  - Error cases: 401, 404, 409, 400

## Summary

| Category | Tasks | Status |
|----------|-------|--------|
| Infrastructure | 4 | ✅ Complete |
| API Routes | 4 | ✅ Complete |
| Security/Docs | 2 | ✅ Complete |
| Tests | 2 | ✅ Complete |

**52 passing tests** (unit + integration + e2e)

---

## Future

| ID | Feature | Notes |
|---|---|---|
| F001 | 3×3 (8-puzzle) mode | Easier difficulty |
| F002 | Touch/swipe support | Mobile users |
| F003 | Sound effects | Slide/click/win sounds |
| F004 | High scores | localStorage persistence |
| F005 | Custom board sizes | Configurable grid |
| F006 | Dark mode | Toggle theme |
| F007 | Animated number scramble | Tiles slide into place |
| F008 | Share result | "Solved in X moves, Y seconds" |
| F009 | Multiple puzzles | Match-3, memory card |
| F010 | Build pipeline | Vite/esbuild optimization |
| F011 | WebSocket moves | Real-time multiplayer |
| F012 | Email verification | Confirm email on signup |
| F013 | OAuth providers | Google, GitHub login |
| F014 | Redis caching | Rate limit + session store |
| F015 | PostgreSQL migration | Swap SQLite for production |
