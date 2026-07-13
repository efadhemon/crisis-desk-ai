# CrisisDesk AI — Intelligent Backend API for Emergency & Service Request Triage

CrisisDesk AI is a backend-only, AI-powered triage API. Citizens submit free-text
emergency and public-service reports (in Bangla or English); the backend uses
**Google Gemini** to classify the issue, assign urgency, generate a summary and a
recommended action, detects likely duplicates using **pgvector** embeddings, and
exposes admin APIs for management and analytics.

## Tech stack

- **NestJS 11** (Express) + **TypeScript**
- **PostgreSQL** + **pgvector** (vector similarity search)
- **TypeORM** (entities + migrations)
- **class-validator / class-transformer** (schema validation)
- **Google Gemini** (`generateContent` for triage, `embedContent` for embeddings)
- **Swagger / OpenAPI** (`/docs`)
- **@nestjs/throttler** (rate limiting), **helmet** (security headers)
- **Valkey** (cache + queues via `iovalkey`, Redis-compatible)
- **Jest** (unit/integration tests), **Docker + docker-compose**

## Documentation

| Doc | Contents |
| --- | -------- |
| [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md) | Module layout, request lifecycle, report pipeline, auth, DB/pgvector, Docker |
| [docs/API.md](docs/API.md) | Endpoint reference, request/response examples, enums, error shapes |

Interactive OpenAPI UI: `http://localhost:5000/docs` (after the API is running).

## Architecture

```
Client ── POST /api/reports ──▶ ReportController (@Public on public routes)
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
3. `EmbeddingService` → 768-dim Gemini embedding of the report text
   (`description` + location). Null embedding skips duplicate detection.
4. `DuplicateService` → pgvector nearest-neighbour (cosine) pre-filtered by
   category; flags `possibleDuplicate` + `matchedReportId` above a threshold.
5. Persist the report and store its embedding (raw SQL for the `vector` column).

See [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md) for the full
module map, auth model, and request lifecycle.

## Prerequisites

- Node.js `22.x` (see `.nvmrc`)
- Docker + Docker Compose (for Postgres/pgvector and Valkey)
- A Gemini API key (`GEMINI_API_KEY`)

## Quick start (local development — recommended)

Run **Postgres + Valkey in Docker**, and the API on the host with `yarn dev`
(hot reload).

### 1. Configure environment

```shell
cp environments/example.env environments/development.env
```

Edit `environments/development.env` and set at least:

- `GEMINI_API_KEY`
- `JWT_SECRET`
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` (seeded via `yarn db:seed`, used with `POST /auth/login`)

Point DB and Valkey at the Compose-published host ports:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=crisisdesk
DB_PASSWORD=crisisdesk
DB_DATABASE=crisis-desk-ai
DB_LOGGING=false
DB_SSL_MODE=false

QUEUE_HOST=localhost
QUEUE_PORT=6380
QUEUE_PASSWORD=crisisdesk
QUEUE_USERNAME=default

CACHE_STORE_HOST=localhost
CACHE_STORE_PORT=6380
CACHE_STORE_PASSWORD=crisisdesk
CACHE_STORE_USERNAME=default
CACHE_TTL=60
```

> Compose exposes a single Valkey instance on host port `6380`. Use that same
> host/port/password for both queue and cache settings when developing locally.

### 2. Start Postgres + Valkey

```shell
docker compose up db valkey -d
```

| Service  | Host port | Default credentials                         |
| -------- | --------- | ------------------------------------------- |
| Postgres | `5433`    | user/pass `crisisdesk`, db `crisis-desk-ai` |
| Valkey   | `6380`    | password `crisisdesk`                       |

Useful commands:

```shell
docker compose ps
docker compose logs -f db valkey
docker compose stop db valkey    # stop infra
docker compose down              # stop + remove containers (DB volume is kept)
```

Override ports/credentials if needed:

```shell
DB_PORT_HOST=5544 VALKEY_PORT_HOST=6390 VALKEY_PASSWORD=secret \
  DB_USERNAME=crisisdesk DB_PASSWORD=crisisdesk DB_DATABASE=crisis-desk-ai \
  docker compose up db valkey -d
```

### 3. Install, migrate, and run the API

```shell
nvm use            # Node 22
yarn install
yarn migration:run # creates reports table + pgvector column/index
yarn db:seed       # optional — seeds admin/super-admin user
yarn dev           # NestJS watch mode
```

- API base: `http://localhost:5000/api` (or your `API_PREFIX`)
- Swagger UI: `http://localhost:5000/docs`

## Full stack with Docker Compose

Run Postgres, Valkey, **and** the API all in containers:

```shell
# put GEMINI_API_KEY (and other config) in environments/development.env first
docker compose up --build                        # uses environments/development.env
NODE_ENV=production docker compose up --build    # uses environments/production.env
```

Compose overrides `DB_HOST` / Valkey hosts inside the `app` container so the API
reaches the internal `db` and `valkey` services. The `localhost:5433/6380` values
in your env file are only for host-based `yarn dev`.

- API base: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/docs`

| Service  | Host port (default) | Override var       |
| -------- | ------------------- | ------------------ |
| API      | `5000`              | `APP_PORT`         |
| Postgres | `5433`              | `DB_PORT_HOST`     |
| Valkey   | `6380`              | `VALKEY_PORT_HOST` |

```shell
APP_PORT=8080 DB_PORT_HOST=5544 VALKEY_PORT_HOST=6390 docker compose up --build
```

App-level config (Gemini, JWT, admin, rate limits, etc.) comes from
`environments/<NODE_ENV>.env`. Infrastructure credentials can also be set via
`DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, and `VALKEY_PASSWORD`.

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
| `SUPER_ADMIN_EMAIL`              | —                      | Seeded superadmin email (`yarn db:seed`)         |
| `SUPER_ADMIN_PASSWORD`           | —                      | Seeded superadmin password                       |
| `JWT_SECRET`                     | —                      | Secret for signing auth JWTs                     |
| `SKIP_AUTH`                      | `false`                | Bypass global JWT guard (local debugging only)   |

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
| DELETE | `/api/reports/:id`           | admin\* | Hard-delete a report                              |
| GET    | `/api/reports/stats/summary` | public  | Analytics summary                                 |
| POST   | `/api/auth/login`            | public  | Internal (superadmin) login → JWT                 |

\* Admin endpoints omit `@Public()`, so the global JWT `AuthGuard` requires a
Bearer access token from `POST /api/auth/login` (INTERNAL users only — typically
the seeded superadmin). Send `Authorization: Bearer <accessToken>`.

Full request/response examples, filters, and error formats:
[docs/API.md](docs/API.md). Architecture:
[docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md).

## Duplicate detection (pgvector)

Report embeddings are stored in a `vector(768)` column with an HNSW cosine index.
On submission the API finds the nearest existing report (pre-filtered by
category) and flags `possibleDuplicate` when `1 - cosine_distance >=
DUPLICATE_SIMILARITY_THRESHOLD`.

> The `embedding` column and HNSW index are managed via raw SQL (see the reports
> schema migration). Mark the property with `@IgnoredColumn()` so TypeORM treats
> it as virtual; `yarn migration:generate` strips any generated DROP/ADD for
> that column and its index.

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

### Docker-only (recommended)

Push to `main` runs `.github/workflows/deploy.yml`. The server needs **only
Docker** (no host Postgres, Valkey, or nginx). CI builds/pushes the API image,
writes `environments/production.env` from `PRODUCTION_ENV_VARS`, generates a
full-stack `docker-compose.yml` (db + valkey + app) from
`docker-compose.template.yml`, and runs `docker compose up -d` on the host.

Compose overrides `DB_HOST` / Valkey hosts to the internal service names. Set
`GEMINI_API_KEY`, `JWT_SECRET`, `SUPER_ADMIN_*`, `DB_*`, and matching
`QUEUE_PASSWORD` / `CACHE_STORE_PASSWORD` in the production secret. The API
listens on host `PORT` (default `5000`). Migrations and seed run in the image
entrypoint.

### External managed services

Alternatively, provision Postgres (with pgvector) + Valkey elsewhere, point the
env file at them, and run only the API container (or `yarn migration:run` then
start the app).

## License

UNLICENSED — hackathon project.
