# API Backend Playbook

The law for everything that ships from this repo. Products are **production-ready Node.js APIs** (Express/Fastify) with OpenAPI docs, tests, and Docker support.

## 1. Tech Stack

- **Runtime**: Node.js 20+ (ESM)
- **Framework**: Fastify (faster, better TypeScript support)
- **Validation**: Zod schemas
- **Database**: SQLite (better-sqlite3) for simplicity, swap to PostgreSQL via env
- **Auth**: JWT (HS256) with short access + long refresh tokens
- **Docs**: OpenAPI 3.1 via `@fastify/swagger` + Scalar UI
- **Tests**: Vitest + Supertest
- **Container**: Multi-stage Dockerfile (distroless final)

## 2. Project Structure

```
src/
  app.ts              ← Fastify instance, plugin registration
  routes/             ← feature-based route modules
    health.ts         ← GET /health
    auth.ts           ← POST /auth/register, /auth/login, /auth/refresh
    users.ts          ← CRUD /users (protected)
  plugins/
    db.ts             ← SQLite connection + migrations
    auth.ts           ← JWT decorators
    swagger.ts        ← OpenAPI + Scalar UI at /docs
  schemas/            ← Zod schemas (request/response)
  utils/
    jwt.ts            ← sign/verify helpers
    hash.ts           ← bcrypt password hashing
  types.ts            ← shared TypeScript types
tests/
  *.test.ts           ← Vitest + Supertest
Dockerfile            ← multi-stage, non-root
docker-compose.yml    ← dev + prod
package.json          ← scripts: dev, build, start, test, db:migrate
```

## 3. API Design Rules

- **RESTful**: nouns not verbs, plural resources (`/users`, `/posts`)
- **Versioning**: `/api/v1/` prefix, accept header fallback
- **Errors**: RFC 7807 Problem Details (`application/problem+json`)
- **Pagination**: cursor-based (`?cursor=&limit=`) for lists
- **Idempotency**: `Idempotency-Key` header on mutating endpoints
- **Rate limiting**: 100 req/min per IP (configurable)
- **CORS**: locked to configured origins only

## 4. Security Baseline

- Helmet headers (CSP, HSTS, X-Frame-Options, etc.)
- Request size limit: 1MB
- Body parsing: JSON only, strict
- No `eval`/`Function` constructor
- Dependencies: `npm audit` in CI, pinned versions
- Secrets: never in code, all via env (`.env.example` provided)

## 5. Testing Standards

- Unit: pure functions (jwt, hash, utils) — 100% coverage target
- Integration: full request/response cycles via Supertest
- Contract: OpenAPI schema validates responses
- E2E: critical paths (register → login → protected action)
- Run: `npm test` (Vitest), `npm run test:coverage`

## 5. Docker & Deploy

- Build: `docker build -t api .`
- Run: `docker run -p 3000:3000 --env-file .env api`
- Health: `GET /health` returns `{ status: "ok", version, uptime }`
- Logs: structured JSON (pino), stdout

## 6. Acceptance Criteria (v1.0.0)

- `npm run dev` starts server with hot reload
- `npm test` passes (unit + integration)
- `curl /health` → 200
- `curl /docs` → Scalar UI loads
- Register → login → access protected route works
- Docker image builds and runs
- OpenAPI spec at `/docs/json` is valid