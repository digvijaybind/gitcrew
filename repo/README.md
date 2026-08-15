# 15-Puzzle Game API

> A headless REST API for the classic sliding-tile puzzle. Register, start a game, make moves, and climb the leaderboard — all over HTTP.

---

## Pitch

Ever wanted to solve a 15-puzzle without installing anything? The **15-Puzzle Game API** gives you the full game engine as a lightweight, production-ready REST API. Authenticate with JWT, spawn a solvable board, submit moves one tile at a time, and watch your solve time and move count get recorded on a live leaderboard. It's the backend half of the classic puzzle — no build step, no client framework, just clean JSON over HTTP.

## What Was Built

| Layer | Detail |
|---|---|
| **Framework** | Fastify v5 (TypeScript) |
| **Auth** | HS256 JWT access tokens (15 min) + refresh tokens (7 days), bcrypt password hashing |
| **Database** | SQLite via `better-sqlite3`, WAL mode, prepared statements, auto-migrate on boot |
| **API** | 12 REST endpoints across health, auth, users, and game routes |
| **Documentation** | OpenAPI 3.1 spec at `GET /docs/json`, Scalar UI at `GET /docs` |
| **Security** | Helmet (CSP, HSTS, X-Frame-Options), CORS whitelist, rate limiting (100 req/min), 1 MB body cap |
| **Error format** | RFC 7807 Problem Details on every error response |
| **Testing** | 52 passing tests (unit, integration, e2e) across 7 test files |
| **Container** | Multi-stage Docker build → distroless non-root runtime |
| **Shuffle** | Parity-checked simulated-move shuffle guarantees solvable boards every time |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check (status, version, uptime) |
| `GET` | `/health/details` | No | Detailed health including DB status |
| `POST` | `/auth/register` | No | Create a new user |
| `POST` | `/auth/login` | No | Get access + refresh tokens |
| `POST` | `/auth/refresh` | No | Rotate refresh tokens |
| `POST` | `/auth/logout` | Yes | Invalidate refresh token |
| `GET` | `/users` | Yes | Paginated user list |
| `GET` | `/users/me` | Yes | Current user profile |
| `GET` | `/users/:userId/scores` | Yes | User's game scores |
| `POST` | `/games` | Yes | Start a new game (shuffled board) |
| `GET` | `/games/:gameId` | Yes | Get game state |
| `POST` | `/games/:gameId/moves` | Yes | Submit a move (auto-detects win) |
| `GET` | `/games/leaderboard` | Yes | Top 10 scores |

### Game Logic

- **15-puzzle**: 4×4 grid with tiles 1–15 and one blank space
- **Shuffle**: 200 random moves from solved state → always solvable
- **Move**: POST `{ tileIndex: N }` where N is the index of a tile adjacent to the blank
- **Win**: Tiles 1–15 in order with blank in position 15
- **Difficulty**: `easy`, `medium`, `hard` (controls shuffle move count)

## Run Instructions

### Prerequisites

- Node.js ≥ 20
- npm (bundled with Node)

### Local Development

```bash
# 1. Install dependencies
cd repo
npm install

# 2. Run migrations (creates SQLite database)
npm run db:migrate

# 3. Start the dev server with hot-reload
npm run dev
```

Server will be available at `http://localhost:3000`.

### Docker (Recommended for Production)

```bash
cd repo
docker compose up --build
```

This builds the image, creates the volume for persistence, and runs the health check.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Listening port |
| `HOST` | `0.0.0.0` | Listening host |
| `JWT_SECRET` | `dev-secret-change-me` | HS256 signing key for access tokens |
| `JWT_REFRESH_SECRET` | `dev-refresh-secret-change-me` | HS256 key for refresh tokens |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins |
| `DATABASE_URL` | `./data/puzzle.db` | SQLite database path |
| `RATE_LIMIT_MAX` | `100` | Requests per time window per IP |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window in milliseconds |
| `NODE_ENV` | `development` | `development` or `production` |

### API Quick-Start

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"secret1234"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret1234"}'
# → {"accessToken":"...","refreshToken":"...","expiresAt":"..."}

# Start a game
curl -X POST http://localhost:3000/games \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>"

# Make a move
curl -X POST http://localhost:3000/games/<gameId>/moves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"tileIndex": 4}'

# View leaderboard
curl http://localhost:3000/games/leaderboard \
  -H "Authorization: Bearer <accessToken>"
```

### OpenAPI Docs

Interactive API docs with examples at `http://localhost:3000/docs`. Raw JSON spec at `http://localhost:3000/docs/json`.

### Testing

```bash
npm test
# 52 tests passing
```

## The Crew

| Role | Contribution |
|------|-------------|
| **Planner** | Wrote PRD and TASKS.md — defined scope, experience, and success criteria |
| **Builder** | Implemented all 13 tasks (T001–T013): Fastify app, plugins, routes, schemas, utils, scripts |
| **QA** | Wrote 52 tests, caught 70+ TypeScript errors, fixed auth, rate-limit, swagger, and guard bugs, created missing `migrate.ts` |
| **Marketer** | This README, CHANGELOG, and the v1.0.0 release |

## Status

| Item | Status |
|------|--------|
| Core API | ✅ Complete |
| Authentication | ✅ Complete |
| Game Engine | ✅ Complete |
| Leaderboard | ✅ Complete |
| Tests | ✅ 52/52 passing |
| TypeScript | ✅ Clean |
| Docker | ✅ Ready |
| OpenAPI Docs | ✅ Live |
| Review Verdict | ✅ PASS |
| Tags | ⏳ Pending (v1.0.0) |

---

built by a crew · living in git · [GitAgentProtocol](https://www.gitagent.sh/)
