# ⚡ Forge API

> Personal production-grade backend boilerplate — Node.js · TypeScript · Express · PostgreSQL

A lightweight, scalable, solo-developer-optimised starter kit for **SaaS products, AI tools, internal apps, and MVPs**. Designed for rapid iteration without sacrificing production-readiness.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Application Flow](#application-flow)
4. [Request Lifecycle](#request-lifecycle)
5. [Authentication Flow](#authentication-flow)
6. [Error Flow](#error-flow)
7. [Database Flow](#database-flow)
8. [Creating a New Module](#creating-a-new-module)
9. [Quick Start](#quick-start)
10. [Scripts Reference](#scripts-reference)
11. [Environment Variables](#environment-variables)
12. [Testing](#testing)
13. [Docker](#docker)
14. [Deployment](#deployment)
15. [Scaling Recommendations](#scaling-recommendations)
16. [Future Improvements](#future-improvements)

---

## Architecture Overview

### Design Philosophy

| Principle | Decision |
|---|---|
| **Functional & modular** | No classes, no decorators, no IoC container. Plain functions. |
| **Explicit over magic** | No auto-discovery, no global registries. Everything imported directly. |
| **Thin controllers** | Controllers validate → call service → respond. Zero business logic. |
| **Fat services** | All business rules live in the service layer. |
| **Isolated repositories** | All SQL lives in `*.repository.ts`. No raw queries in services. |
| **Type-safe everything** | Zod validates both env vars and request payloads. TypeScript strict mode. |
| **Fail fast** | Invalid env → immediate crash with a readable error. Never a silent misconfiguration. |

### Layer Responsibilities

```
Request
  ↓
Middleware  (security, logging, body parsing, auth guard)
  ↓
Router      (route definition, validation middleware wiring)
  ↓
Service     (business logic, orchestration, error throwing)
  ↓
Repository  (raw SQL queries, returns typed row objects)
  ↓
Database    (postgres.js connection pool)
  ↑
Response    (ok() / created() / noContent() helpers)
```

### Why postgres.js instead of TypeORM?

The original boilerplate used TypeORM + decorators + `reflect-metadata`. That's a lot of runtime magic for simple SQL. `postgres.js` gives you:

- Tagged-template SQL (parameterised by default — no injection)
- Auto camelCase transform of snake_case column names
- Tiny bundle, zero decorators
- Easy transactions
- Full TypeScript types via generics

---

## Folder Structure

```
forge-api/
│
├── src/
│   ├── main.ts                  # Entry point — boots DB, runs migrations, starts server
│   ├── app.ts                   # Express app factory (importable by tests)
│   │
│   ├── core/                    # Infrastructure — no business logic lives here
│   │   ├── config/
│   │   │   ├── env.ts           # Zod env validation (fails fast on misconfiguration)
│   │   │   └── constants.ts     # Non-secret app-wide constants
│   │   ├── db/
│   │   │   ├── client.ts        # postgres.js pool — initDb, getDb, withTransaction
│   │   │   └── migrate.ts       # Lightweight SQL-file migration runner
│   │   ├── errors/
│   │   │   └── AppError.ts      # Typed error hierarchy (AppError → HTTP subclasses)
│   │   ├── http/
│   │   │   └── respond.ts       # ok(), created(), noContent() response helpers
│   │   └── logger/
│   │       └── index.ts         # Winston logger (dev: pretty | prod: JSON)
│   │
│   ├── shared/                  # Reusable cross-module code
│   │   ├── middleware/
│   │   │   ├── validate.ts      # Generic Zod validation middleware factory
│   │   │   ├── requireAuth.ts   # JWT Bearer guard — injects req.ctx.userId
│   │   │   ├── errorHandler.ts  # Global error handler (last middleware)
│   │   │   └── notFound.ts      # 404 catch-all
│   │   ├── types/
│   │   │   └── index.ts         # AppRequest, TokenPayload, Pagination types
│   │   ├── utils/
│   │   │   ├── hash.ts          # bcryptjs helpers
│   │   │   ├── jwt.ts           # sign/verify access & refresh tokens
│   │   │   └── pagination.ts    # parsePagination, buildPaginatedResult
│   │   └── validators/
│   │       └── index.ts         # Reusable Zod schemas (email, password, id, etc.)
│   │
│   ├── modules/                 # Feature modules (one folder per domain)
│   │   ├── auth/
│   │   │   ├── auth.schema.ts   # RegisterSchema, LoginSchema, RefreshSchema
│   │   │   ├── auth.service.ts  # register(), login(), refreshTokens()
│   │   │   └── auth.router.ts   # POST /auth/register | /login | /refresh
│   │   ├── users/
│   │   │   ├── users.schema.ts  # UpdateProfileSchema
│   │   │   ├── users.repository.ts  # All users SQL queries
│   │   │   ├── users.service.ts     # getProfile(), updateProfile()
│   │   │   └── users.router.ts      # GET /users/me | PATCH /users/me
│   │   └── health/
│   │       └── health.router.ts # GET /health — app + DB status
│   │
│   └── __tests__/
│       ├── setup.ts             # Vitest global setup (DB init, cleanDb helper)
│       ├── helpers.ts           # agent(), createTestUser(), authHeader()
│       ├── health/health.test.ts
│       ├── auth/auth.test.ts
│       └── users/users.test.ts
│
├── migrations/
│   ├── 001_create_users.up.sql
│   └── 001_create_users.down.sql
│
├── scripts/
│   ├── migrate.ts               # Migration CLI (make | up | down | status)
│   ├── seed.ts                  # Dev data seeder
│   └── setup.js                 # First-run helper (.env copy + instructions)
│
├── docker/
│   ├── docker-compose.yml       # Local dev (Postgres + optional pgAdmin)
│   ├── docker-compose.prod.yml  # Production stack reference
│   └── Dockerfile               # Multi-stage production image
│
├── .github/
│   └── workflows/ci.yml         # GitHub Actions — typecheck + test on push/PR
│
├── .env.example
├── .gitignore
├── .prettierrc
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── vitest.config.ts
```

---

## Application Flow

### 1. Bootstrap (main.ts)

```
process start
  │
  ├─ dotenv loads .env
  │
  ├─ env.ts: Zod validates all env vars
  │     └─ failure → console.error + process.exit(1)
  │
  ├─ initDb(): postgres.js pool created, SELECT 1 connectivity check
  │     └─ failure → logger.error + process.exit(1)
  │
  ├─ runMigrations(): scans migrations/*.up.sql, applies unapplied ones
  │
  ├─ buildApp(): Express configured (middleware stack + routes mounted)
  │
  ├─ app.listen(PORT)
  │
  └─ SIGTERM / SIGINT hooks registered for graceful shutdown
```

### 2. Middleware Registration Order (app.ts)

```
helmet()          — Security headers (XSS, clickjacking, etc.)
cors()            — CORS (open in dev, whitelist in production)
compression()     — gzip response bodies
morgan()          — HTTP access logging → Winston
express.json()    — Parse JSON bodies (10mb limit)
express.urlencoded() — Parse form bodies
```

Routes are mounted after middleware. Error handler and 404 handler are mounted **last**.

---

## Request Lifecycle

```
Incoming HTTP Request
  │
  ├─ helmet, cors, compression, morgan   (global middleware)
  │
  ├─ express.json / urlencoded           (body parsing)
  │
  ├─ Router match
  │     ├─ requireAuth (if protected)    — verifies JWT, injects req.ctx.userId
  │     └─ validate(Schema)             — Zod parses req.body/params/query
  │                                        success → parsed data replaces req.body
  │                                        failure → next(ValidationError)
  │
  ├─ Controller function
  │     └─ calls service function
  │           └─ calls repository function(s)
  │                 └─ executes SQL via postgres.js
  │                       └─ returns typed row object(s)
  │           └─ applies business rules, throws AppError subclass on failure
  │     └─ calls ok(res, data) / created(res, data) / noContent(res)
  │
  └─ (on error) errorHandler middleware
        ├─ ValidationError  → 422 + field-level details
        ├─ AppError subclass → mapped status code
        └─ unknown          → 500 (message hidden in production)
```

---

## Authentication Flow

### Register

```
POST /api/v1/auth/register
  │
  ├─ validate(RegisterSchema)      — name, email, password checked
  ├─ findUserByEmail()             — duplicate check → 409 ConflictError
  ├─ hashPassword()                — bcrypt, 12 rounds
  ├─ createUser()                  — INSERT INTO users
  ├─ signAccessToken()             — JWT signed with JWT_SECRET + JWT_VERSION
  ├─ signRefreshToken()            — longer expiry JWT
  └─ created(res, { user, tokens })
```

### Login

```
POST /api/v1/auth/login
  │
  ├─ validate(LoginSchema)
  ├─ findUserByEmail()             — not found → 400 "Invalid credentials" (no enumeration)
  ├─ verifyPassword()              — bcrypt compare → wrong → 400 "Invalid credentials"
  ├─ signAccessToken() + signRefreshToken()
  └─ ok(res, { user, tokens })
```

### Protected Route

```
GET /api/v1/users/me
  │
  ├─ requireAuth middleware
  │     ├─ reads Authorization: Bearer <token>
  │     ├─ verifyToken() — jwt.verify with versioned secret
  │     │     └─ invalid/expired → 401 UnauthorizedError
  │     └─ injects req.ctx = { userId, userEmail }
  │
  └─ controller reads req.ctx.userId → calls service
```

### Refresh

```
POST /api/v1/auth/refresh  { refreshToken }
  │
  ├─ verifyToken(refreshToken)     — validates signature + expiry
  ├─ checks payload.version === CONSTANTS.JWT_VERSION
  │     └─ mismatch → 401 (bump JWT_VERSION to invalidate ALL sessions)
  └─ signAccessToken()             — new short-lived token
```

---

## Error Flow

```
throw new ConflictError('Email already exists')
  │         ↑
  │   AppError subclass (statusCode=409, code='CONFLICT')
  │
  └─ next(err) in controller catch block
       │
       └─ errorHandler middleware
             ├─ instanceof ValidationError → 422 + fieldErrors in details
             ├─ instanceof AppError        → err.statusCode + err.message
             └─ unknown                   → 500 (full error logged server-side)

Response shape (always):
  Success: { success: true,  data: T, meta?: {} }
  Error:   { success: false, error: { code, message, details? } }
```

### Custom Error Example

```typescript
// core/errors/AppError.ts already provides:
throw new BadRequestError('Name too long');        // 400
throw new UnauthorizedError();                      // 401
throw new ForbiddenError('Not your resource');      // 403
throw new NotFoundError('Post');                    // 404 "Post not found"
throw new ConflictError('Email already registered');// 409
throw new ValidationError({ email: ['Invalid'] }); // 422
throw new InternalError();                          // 500
```

---

## Database Flow

### Connection

```typescript
// Initialised once in main.ts:
await initDb();  // creates postgres.js pool, runs SELECT 1

// Accessed anywhere:
const sql = getDb();
const rows = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`;
```

### Transactions

```typescript
import { withTransaction } from '@core/db';

const result = await withTransaction(async (tx) => {
  const [user] = await tx`INSERT INTO users (...) RETURNING *`;
  await tx`INSERT INTO audit_log (user_id) VALUES (${user.id})`;
  return user;
});
// Automatically rolled back if any tx` call throws
```

### Migration Lifecycle

```
npm run migrate:make add_posts_table
  → creates migrations/002_add_posts_table.up.sql
  → creates migrations/002_add_posts_table.down.sql

npm run migrate:up
  → reads _migrations table (created automatically)
  → applies any unapplied *.up.sql files in numeric order
  → records each in _migrations

npm run migrate:down
  → reads last entry in _migrations
  → runs matching *.down.sql
  → removes entry from _migrations

npm run migrate:status
  → lists all applied migrations with timestamps
```

---

## Creating a New Module

Follow this pattern to add, for example, a `posts` module.

### 1. Create the folder

```
src/modules/posts/
  posts.schema.ts
  posts.repository.ts
  posts.service.ts
  posts.router.ts
```

### 2. Schema (`posts.schema.ts`)

```typescript
import { z } from 'zod';

export const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  body:  z.string().min(1),
});

export type CreatePostDto = z.infer<typeof CreatePostSchema>;
```

### 3. Repository (`posts.repository.ts`)

```typescript
import { getDb } from '@core/db';

export interface Post { id: number; title: string; body: string; authorId: number; createdAt: Date; }

export async function createPost(data: Omit<Post, 'id' | 'createdAt'>): Promise<Post> {
  const sql = getDb();
  const [post] = await sql<Post[]>`
    INSERT INTO posts (title, body, author_id)
    VALUES (${data.title}, ${data.body}, ${data.authorId})
    RETURNING *
  `;
  return post;
}
```

### 4. Service (`posts.service.ts`)

```typescript
import { createPost } from './posts.repository';
import { CreatePostDto } from './posts.schema';

export async function publishPost(authorId: number, dto: CreatePostDto) {
  return createPost({ ...dto, authorId });
}
```

### 5. Router (`posts.router.ts`)

```typescript
import { Router } from 'express';
import { requireAuth, validate } from '@shared/middleware';
import { created } from '@core/http';
import { AppRequest } from '@shared/types';
import { CreatePostSchema } from './posts.schema';
import { publishPost } from './posts.service';

export const postsRouter = Router();

postsRouter.post('/', requireAuth, validate(CreatePostSchema), async (req, res, next) => {
  try {
    const userId = (req as AppRequest).ctx.userId!;
    const post = await publishPost(userId, req.body);
    created(res, { post });
  } catch (err) { next(err); }
});
```

### 6. Mount in app.ts

```typescript
import { postsRouter } from '@modules/posts/posts.router';
// ...
app.use(`${prefix}/posts`, postsRouter);
```

### 7. Migration

```bash
npm run migrate:make create_posts_table
# Edit the generated .up.sql and .down.sql
npm run migrate:up
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- Docker (for the local Postgres container)
- npm or yarn

### 1. Install dependencies

```bash
# npm
npm install

# yarn
yarn install
```

### 2. Environment setup

```bash
# npm
npm run setup

# yarn
node scripts/setup.js
```

Edit `.env` — the defaults match the Docker Compose file, so for local dev you may not need to change anything.

### 3. Start Postgres

```bash
# npm
npm run docker:up

# yarn
yarn docker:up
```

### 4. Run migrations

```bash
# npm
npm run migrate:up

# yarn
yarn migrate:up
```

### 5. (Optional) Seed sample data

```bash
# npm
npm run seed

# yarn
yarn seed
```

### 6. Start the dev server

```bash
# npm
npm run dev

# yarn
yarn dev
```

The server starts at **http://localhost:4000/api/v1**

---

## Scripts Reference

| Script | npm | yarn | Description |
|---|---|---|---|
| Dev server | `npm run dev` | `yarn dev` | tsx watch mode, auto-restarts on save |
| Production build | `npm run build` | `yarn build` | Compiles to `dist/` |
| Start production | `npm start` | `yarn start` | Runs compiled `dist/main.js` |
| Typecheck | `npm run typecheck` | `yarn typecheck` | `tsc --noEmit` |
| Lint | `npm run lint` | `yarn lint` | ESLint |
| Format | `npm run format` | `yarn format` | Prettier |
| Tests | `npm test` | `yarn test` | Vitest (single run) |
| Tests watch | `npm run test:watch` | `yarn test:watch` | Vitest interactive |
| Coverage | `npm run test:coverage` | `yarn test:coverage` | Coverage report |
| New migration | `npm run migrate:make <name>` | `yarn migrate:make <name>` | Scaffold .up/.down SQL files |
| Apply migrations | `npm run migrate:up` | `yarn migrate:up` | Run pending migrations |
| Roll back | `npm run migrate:down` | `yarn migrate:down` | Roll back last migration |
| Migration status | `npm run migrate:status` | `yarn migrate:status` | Show applied migrations |
| Seed DB | `npm run seed` | `yarn seed` | Insert sample data |
| Docker up | `npm run docker:up` | `yarn docker:up` | Start Postgres container |
| Docker down | `npm run docker:down` | `yarn docker:down` | Stop containers |
| Docker logs | `npm run docker:logs` | `yarn docker:logs` | Stream container logs |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | `development` / `test` / `staging` / `production` |
| `PORT` | No | `4000` | HTTP server port |
| `API_PREFIX` | No | `/api/v1` | URL prefix for all routes |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | Min 32 chars. Keep secret. |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token TTL |
| `CORS_ORIGINS` | No | — | Comma-separated origins (prod only) |
| `LOG_LEVEL` | No | `debug` | `error` / `warn` / `info` / `http` / `debug` |

---

## Testing

Tests use **Vitest** + **Supertest**. The test suite hits a real database (the same schema, a dedicated test DB in CI).

```bash
# Run all tests
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test isolation

Each test file calls `cleanDb()` in `beforeEach` to truncate relevant tables, so tests are fully independent regardless of run order.

### CI

GitHub Actions (`.github/workflows/ci.yml`) spins up a Postgres service container, runs migrations, then executes the full test suite on every push and pull request.

---

## Docker

### Local development

```bash
# Start Postgres (+ pgAdmin on port 5050 with --profile tools)
npm run docker:up
docker compose -f docker/docker-compose.yml --profile tools up -d

# Stop
npm run docker:down
```

### Production image

```bash
# Build
docker build -f docker/Dockerfile -t forge-api:latest .

# Run
docker run -p 4000:4000 --env-file .env forge-api:latest
```

The Dockerfile is a two-stage build: `builder` compiles TypeScript, `production` copies only the compiled JS and production node_modules, resulting in a lean image.

---

## Deployment

### Local / Dev

```
npm run dev
```

### Staging / Production (server)

```bash
# 1. Build
npm run build

# 2. Set env vars (never commit .env to git)
export NODE_ENV=production
export DATABASE_URL=...
export JWT_SECRET=...

# 3. Apply migrations
npm run migrate:up

# 4. Start
npm start
```

### Docker Compose (VPS / self-hosted)

```bash
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, etc.

docker compose -f docker/docker-compose.prod.yml up -d
```

### Platform-as-a-Service

Works out of the box on **Railway**, **Render**, **Fly.io**, and **Heroku**:

1. Set env vars in the platform dashboard.
2. Set the start command to `npm run build && npm run migrate:up && npm start`.
3. Point `DATABASE_URL` at the platform's Postgres addon.

---

## Scaling Recommendations

| Concern | Recommendation |
|---|---|
| **Stateless API** | Already stateless (JWTs, no session state). Add more instances freely. |
| **Database pool** | Increase `max` in `core/db/client.ts` as traffic grows. Use PgBouncer for 100+ connections. |
| **Rate limiting** | Add `express-rate-limit` on auth routes to prevent brute-force. |
| **Caching** | Add Redis + `ioredis` for session caching, token blacklisting, or expensive query results. |
| **File uploads** | Add `multer` + S3/Cloudflare R2 for asset storage. |
| **Background jobs** | Add `BullMQ` (Redis-backed) for email, webhooks, and async processing. |
| **Email** | Add `nodemailer` or Resend SDK in `shared/utils/mailer.ts`. |
| **Multi-tenancy** | Add a `tenant_id` column and a `requireTenant` middleware early. Easier to add now than later. |
| **Observability** | Winston already emits JSON in production. Pipe to Datadog, Loki, or CloudWatch. |
| **Secrets management** | Replace `.env` with AWS Secrets Manager / Doppler in production. |

---

## Future Improvements

- [ ] **Refresh token rotation** — store refresh tokens in DB, invalidate on use
- [ ] **Role-based access control (RBAC)** — add `role` column, extend `requireAuth`
- [ ] **Email verification** — send verification link on register
- [ ] **Password reset** — time-limited reset tokens via email
- [ ] **Rate limiting** — `express-rate-limit` on `/auth` routes
- [ ] **OpenAPI / Swagger** — auto-generate from Zod schemas with `zod-to-openapi`
- [ ] **Soft deletes** — add `deleted_at` column pattern to repositories
- [ ] **Audit log** — generic trigger or middleware for write operations
- [ ] **Request ID tracing** — add `x-request-id` header, propagate through logs
- [ ] **Health check details** — expand to include memory, CPU, migration status
- [ ] **Redis integration** — caching layer + BullMQ job queue
- [ ] **Multi-tenancy** — workspace/org scoping pattern

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | ✗ | Register new user |
| POST | `/api/v1/auth/login` | ✗ | Login, get tokens |
| POST | `/api/v1/auth/refresh` | ✗ | Refresh access token |

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | ✓ | Get current user profile |
| PATCH | `/api/v1/users/me` | ✓ | Update name / email |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | ✗ | App + DB status check |

---

## License

MIT — use freely for personal and commercial projects.
