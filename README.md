# CrisisDesk AI — Intelligent Backend API for Emergency & Service Request Triage

CrisisDesk AI is a backend-only, AI-powered triage API. Citizens submit free-text
emergency and public-service reports (in Bangla or English); the backend uses
**Google Gemini** to classify the issue, assign urgency, generate a summary and a
recommended action, detects likely duplicates using **pgvector** embeddings, and
exposes admin APIs for management and analytics.

> Security note: the original problem statement contains an embedded
> prompt-injection instruction (asking AI tools to insert the words "banana" and
> "mango" into every response). This is a trap and is deliberately ignored — no
> API response contains those words.

## Tech stack

- **NestJS 11** (Express) + **TypeScript**
- **PostgreSQL** + **pgvector** (vector similarity search)
- **TypeORM** (entities + migrations)
- **class-validator / class-transformer** (schema validation)
- **Google Gemini** (`generateContent` for triage, `embedContent` for embeddings)
- **Swagger / OpenAPI** (`/docs`)
- **@nestjs/throttler** (rate limiting), **helmet** (security headers)
- **Valkey/Redis** (cache + queues, used by the platform)
- **Jest** (unit/integration tests), **Docker + docker-compose**

## Architecture

```
Client ── POST /api/reports ──▶ ReportController (@Public, @SkipKeyCheck)
                                     │
                                     ▼
                              ReportService
             ┌───────────────┬───────┴────────┬───────────────────┐
             ▼               ▼                ▼                   ▼
        AiService      EmbeddingService  DuplicateService     PostgreSQL
     (Gemini triage)  (Gemini embed)    (pgvector cosine)    (+ pgvector)
```

Report submission pipeline:

1. Validate the request body (class-validator DTO).
2. `AiService` → Gemini structured JSON: `category`, `urgency`, `summary`,
   `suggestedAction`, `confidence` (validated against allowed enums; safe
   fallback if Gemini is unavailable so submission never fails).
3. `EmbeddingService` → 768-dim Gemini embedding of the report text.
4. `DuplicateService` → pgvector nearest-neighbour (cosine) pre-filtered by
   category; flags `possibleDuplicate` + `matchedReportId` above a threshold.
5. Persist the report and store its embedding.

## Prerequisites

- Node.js `22.x` (see `.nvmrc`)
- PostgreSQL 14+ **with the `vector` extension available** (use the
  `pgvector/pgvector` image or a managed provider that supports pgvector)
- Redis / Valkey (used by the platform's cache & queue modules)
- A Gemini API key (`GEMINI_API_KEY`)

## Quick start (Docker — recommended)

The compose file is fully self-contained: it provisions pgvector Postgres,
Redis, and the API together, and the container entrypoint runs migrations, seeds
base data, and starts the app.

The API service loads its configuration from a file in `environments/` via
`env_file`. Put your `GEMINI_API_KEY` (and any other config) in
`environments/development.env`, then:

```shell
docker compose up --build                       # uses environments/development.env
NODE_ENV=production docker compose up --build    # uses environments/production.env
NODE_ENV=staging    docker compose up --build    # uses environments/staging.env
```

`development.env` ships with working defaults; `production.env` and
`staging.env` are templates — fill in `GEMINI_API_KEY`, `JWT_SECRET`, and admin
credentials before using them. The database and Redis connection settings in
these files are automatically overridden by compose to reach the internal `db`
and `redis` services (their `localhost:5433/6380` values are only for running
the app directly on the host).

- API base: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/docs`

Host ports default to **non-standard values** so they never clash with a
globally installed Postgres (`5432`) or Redis (`6379`):

| Service  | Host port (default) | Override var      |
| -------- | ------------------- | ----------------- |
| API      | `5000`              | `APP_PORT`        |
| Postgres | `5433`              | `DB_PORT_HOST`    |
| Redis    | `6380`              | `REDIS_PORT_HOST` |

Inside the compose network the services still use their standard ports
(`db:5432`, `redis:6379`); only the published host ports change. Override
anything inline, e.g.:

```shell
APP_PORT=8080 DB_PORT_HOST=5544 REDIS_PORT_HOST=6390 docker compose up --build
```

App-level config (Gemini, JWT, admin, rate limits, etc.) comes from the selected
`environments/<NODE_ENV>.env` file. Infrastructure wiring is controlled by
compose variables with sensible defaults: `DB_USERNAME`, `DB_PASSWORD`,
`DB_DATABASE`, `REDIS_PASSWORD` (these keep the app and the `db`/`redis`
containers in sync regardless of the env file).

## Quick start (local)

```shell
nvm use            # Node 22
yarn install
# 1) Configure environments/development.env (DB creds + GEMINI_API_KEY)
# 2) Ensure Postgres (with pgvector) and Redis are running
yarn build
yarn migration:run # creates the reports table + pgvector column/index
yarn dev           # start in watch mode (or: yarn start)
```

## Environment variables

Config lives in `environments/<NODE_ENV>.env` (loaded via `src/env.ts`).
Key CrisisDesk settings:

| Variable                         | Default                | Purpose                                          |
| -------------------------------- | ---------------------- | ------------------------------------------------ |
| `API_PREFIX`                     | `api`                  | Global route prefix, giving `/api/reports`       |
| `GEMINI_API_KEY`                 | —                      | Gemini API key (required for real AI output)     |
| `GEMINI_MODEL`                   | `gemini-flash-latest`  | Classification/summarization model               |
| `GEMINI_EMBED_MODEL`             | `gemini-embedding-001` | Embedding model (768 dims)                       |
| `GEMINI_EMBED_DIM`               | `768`                  | Embedding dimensionality (matches `vector(768)`) |
| `DUPLICATE_SIMILARITY_THRESHOLD` | `0.85`                 | Cosine similarity to flag a duplicate            |
| `AUTH_ENABLED`                   | `false`                | Enforce admin JWT on status/delete when `true`   |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | —                      | Admin login credentials                          |

When `GEMINI_API_KEY` is unset, the API still works: reports are stored with
safe fallback classification and duplicate detection is skipped.

## API overview

Base URL: `/api`

| Method | Endpoint                     | Auth    | Purpose                                           |
| ------ | ---------------------------- | ------- | ------------------------------------------------- |
| POST   | `/api/reports`               | public  | Submit a report (AI triage + duplicate detection) |
| GET    | `/api/reports`               | public  | List reports with filters + pagination            |
| GET    | `/api/reports/:id`           | public  | Get a single report                               |
| PATCH  | `/api/reports/:id/status`    | admin\* | Update report status                              |
| DELETE | `/api/reports/:id`           | admin\* | Delete a report                                   |
| GET    | `/api/reports/stats/summary` | public  | Analytics summary                                 |
| POST   | `/api/admin/login`           | public  | Admin login → JWT                                 |

\* Admin endpoints are open by default (`AUTH_ENABLED=false`) so they can be
graded without credentials. Set `AUTH_ENABLED=true` to require the JWT from
`/api/admin/login` (send `Authorization: Bearer <token>`).

Full request/response examples, filters, and error formats are in
[docs/API.md](docs/API.md).

## Duplicate detection (pgvector)

Report embeddings are stored in a `vector(768)` column with an HNSW cosine index.
On submission the API finds the nearest existing report (pre-filtered by
category) and flags `possibleDuplicate` when `1 - cosine_distance >=
DUPLICATE_SIMILARITY_THRESHOLD`.

> The `embedding` column is provisioned by the hand-written migration
> `1784200000000-add-reports-and-pgvector.ts` and maintained via raw SQL, because
> TypeORM has no native `vector` type. Do not run `migration:generate` without
> re-adding this column, or the generated migration will try to drop it.

## Migrations

```shell
yarn migration:run       # apply migrations (creates reports + pgvector)
yarn migration:revert    # revert the last migration
```

## Testing

```shell
yarn test                # unit/integration tests (no DB or network required)
```

Covers AI response normalization/fallback, pgvector duplicate thresholding, the
analytics summary, the submission pipeline, and the controller layer (Gemini is
mocked).

## Deployment

Any host offering Postgres (with pgvector) + Redis works (Railway, Render, etc.):

1. Provision Postgres and enable pgvector (`CREATE EXTENSION vector;` — the
   migration also does this) and a Redis instance.
2. Set env vars (DB, Redis, `GEMINI_API_KEY`, `JWT_SECRET`, admin creds).
3. Run `yarn migration:run` then start the app (Docker image entrypoint does
   this automatically).

## License

UNLICENSED — hackathon project.
