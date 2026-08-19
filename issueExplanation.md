# Log Service Setup and Migration Explanation

## Purpose

This document explains how the current log-service project is wired together, why the database migration initially appeared to do nothing, and what was changed to make it work. It is intended to be a working reference for extending the project.

## Current Dependency Flow

The setup has two separate flows: the database setup flow and the application runtime flow.

### Database setup flow

```text
.env
  |
  v
 drizzle.config.ts
  |
  +--> src/db/schema/*.ts
  |       |
  |       v
  |   drizzle-kit generate
  |       |
  |       v
  |   src/db/migrations/*.sql
  |       |
  |       v
  |   drizzle-kit migrate
  |       |
  +--> PostgreSQL in Docker Compose
```

1. `docker compose up -d` starts the PostgreSQL container.
2. The container creates the `logservice` database and role when its data volume is initialized.
3. `.env` supplies the connection URL used by local commands and application code.
4. `drizzle.config.ts` loads `.env` through `dotenv/config` and gives Drizzle Kit the database URL, schema location, and migrations directory.
5. `src/db/schema/logs.ts` is the source-of-truth description of the `logs` table.
6. `npx drizzle-kit generate` compares the schema with the previous Drizzle snapshot and creates SQL migration files.
7. `npx drizzle-kit migrate` connects to PostgreSQL, creates the Drizzle migration bookkeeping table if necessary, and executes unapplied SQL migrations.

### Application runtime flow

```text
.env
  |
  v
src/config.ts
  |
  v
src/db/index.ts
  |
  +--> postgres-js connection
  |
  +--> Drizzle ORM using src/db/schema/logs.ts
```

`src/config.ts` validates `DATABASE_URL` and sets the application port. `src/db/index.ts` creates a `postgres-js` client and exposes a Drizzle database instance with the log schema.

The current `src/server.ts` only prints a startup message. It does not yet expose HTTP endpoints or use the database connection. Therefore, running the server and running database migrations are currently separate operations.

## PostgreSQL Compose Configuration

`docker-compose.yml` defines one service:

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: logservice
      POSTGRES_PASSWORD: logservice
      POSTGRES_DB: logservice
    ports:
      - "15432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

Important details:

- `5432` is PostgreSQL's port inside the container.
- `15432` is the port exposed to the Linux host.
- The database URL must use `localhost:15432`, not `localhost:5432`.
- `postgres_data` keeps the database files when the container is recreated.
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` are used only when PostgreSQL initializes an empty data directory. Changing these values later does not change an already-created role or database.

## The Original Problem

The original `.env` value used port `5432`:

```dotenv
DATABASE_URL=postgresql://logservice:logservice@localhost:5432/logservice
```

The Compose container was healthy, but Drizzle migrations did not create the `logs` table. Direct inspection inside the container showed:

```text
Did not find any tables.
```

The important distinction was where the connection was made:

- `docker compose exec postgres psql ...` connects from inside the container through a local Unix socket.
- `npx drizzle-kit migrate` runs on the host and connects using `DATABASE_URL` over TCP.

The host connection to `localhost:5432` was not reaching the Compose PostgreSQL instance in this WSL/Docker environment. It also produced password authentication failures. The container itself accepted the credentials over its own TCP connection, proving that PostgreSQL and the role were running correctly inside Compose.

There was a second detail that made the behavior confusing: Compose environment variables do not update an existing PostgreSQL volume. If the volume was initialized earlier with a different password, changing `POSTGRES_PASSWORD` in `docker-compose.yml` does not reset that password.

## What Was Changed

### 1. Dedicated host port

The Compose mapping was changed from:

```yaml
- "5432:5432"
```

to:

```yaml
- "15432:5432"
```

This keeps PostgreSQL on its normal internal port while giving the host a dedicated port that unambiguously reaches this Compose service.

### 2. Connection URL updated

`.env` now contains:

```dotenv
DATABASE_URL=postgresql://logservice:logservice@localhost:15432/logservice
```

`.env.example` contains the same non-secret development value so a new developer starts with the correct port.

### 3. Drizzle schema path corrected

The schema lives under `src/db/schema/logs.ts`, so `drizzle.config.ts` uses:

```ts
schema: "./src/db/schema/*.ts"
```

The migration output remains:

```ts
out: "./src/db/migrations"
```

### 4. Node types for the config

The root-level Drizzle config uses `process.env`. The file includes a Node type reference so the editor understands the `process` global:

```ts
/// <reference types="node" />
```

This is a TypeScript/editor concern only; it does not affect database connectivity.

## Result After the Fix

The following checks succeeded:

```bash
PGPASSWORD=logservice psql \
  -h 127.0.0.1 -p 15432 \
  -U logservice -d logservice \
  -c 'select current_user, current_database();'

npx drizzle-kit migrate
```

The database then contained:

```text
public.logs
 drizzle.__drizzle_migrations
```

`public.logs` is the application table. `drizzle.__drizzle_migrations` records which generated migrations have already run, so future executions do not repeat the same migration.

## Normal Development Process

Start PostgreSQL:

```bash
docker compose up -d
```

Check that it is running:

```bash
docker compose ps
docker compose exec -T postgres pg_isready -U logservice -d logservice
```

Generate a migration after changing the schema:

```bash
npm run generate
```

Apply pending migrations:

```bash
npm run migrate
```

Build the TypeScript project:

```bash
npm run build
```

Run the current development server:

```bash
npm run dev
```

For database inspection, use a non-interactive command when possible:

```bash
docker compose exec -T postgres psql \
  -U logservice -d logservice \
  -c '\dt'
```

The `-T` option disables pseudo-terminal allocation. This is useful in scripts and avoids problems when command execution is being managed by an editor terminal.

## Schema and Migration Rules

The schema file is the desired database structure. A migration file is the historical SQL change needed to move a database from one structure to the next.

Do not edit an already-applied migration to change its meaning. Instead:

1. Edit `src/db/schema/logs.ts`.
2. Run `npm run generate`.
3. Review the generated SQL in `src/db/migrations`.
4. Run `npm run migrate`.
5. Verify the database structure.

For a fresh database, all migrations run in order. For an existing database, Drizzle consults `drizzle.__drizzle_migrations` and runs only migrations that are not recorded there.

## Troubleshooting Checklist

### The migration says nothing happened

Check whether the migration file actually contains SQL:

```bash
sed -n '1,200p' src/db/migrations/0000_useful_gorgon.sql
```

Then check migration history:

```bash
docker compose exec -T postgres psql \
  -U logservice -d logservice \
  -c 'select * from drizzle.__drizzle_migrations;'
```

If both the migration table and application table are missing, verify that the CLI can reach the database using the same host and port from `.env`.

### Authentication fails

Test the exact host connection:

```bash
PGPASSWORD=logservice psql \
  -h 127.0.0.1 -p 15432 \
  -U logservice -d logservice \
  -c 'select current_database();'
```

If this fails but `docker compose exec postgres psql ...` works, the two commands are connecting through different paths. Check the host port in both `docker-compose.yml` and `.env`.

Remember that an existing named volume preserves the original database credentials. For a development database, the role password can be synchronized from inside the container:

```bash
docker compose exec postgres psql \
  -U logservice -d logservice \
  -c "ALTER USER CURRENT_USER PASSWORD 'logservice';"
```

Never put real production passwords in Compose files or committed example files.

### The database is unexpectedly empty

Check which container and volume are active:

```bash
docker compose ps
docker volume ls
docker compose logs postgres
```

Do not remove the volume casually. Removing it destroys the local database data. If the database is disposable and a completely fresh initialization is required, the destructive operation is:

```bash
docker compose down -v
docker compose up -d
```

Only use that when losing the local data is acceptable.

## Important Current Limitations

- `src/server.ts` is not yet an HTTP log ingestion service; it only logs that startup began.
- The `migrate` function imported in `src/db/index.ts` is not currently called. The project currently uses the Drizzle Kit CLI for migrations.
- The `start` script currently points to `dost/server.js`, which appears to be a typo and should eventually point to the built output, likely `dist/server.js`.
- There are no automated tests yet.

These limitations are separate from the migration incident. The database setup now works, but the API, runtime migration strategy, and production deployment process still need to be designed.
