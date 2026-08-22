#Log Ingestion and Query Service
```
log-service
├──src
│   ├──db
│   │   ├──migrations
│   │   │   ├──meta
│   │   │   │   ├──_journal.json
│   │   │   │   └──0000_snapshot.json
│   │   │   └──0000_useful_gorgon.sql
│   │   ├──queries
│   │   │   └──logsQueries.ts
│   │   ├──schema
│   │   │   └──logs.ts
│   │   ├──index.ts
│   │   └──migrate.ts
│   ├──http
│   │   ├──handlers
│   │   │   ├──handleAddLogs.ts
│   │   │   ├──handleGetLogs.ts
│   │   │   └──healthHandler.ts
│   │   ├──middleware
│   │   │   └──errorHandler.ts
│   │   └──routes
│   ├──logs
│   │   └──cursor.ts
│   ├──validation
│   │   ├──validateLogs.ts
│   │   └──validateQuery.ts
│   ├──app-state.ts
│   ├──config.ts
│   ├──server.ts
│   └──startup.ts
├──tests
│   ├──errorHandler.test.ts
│   ├──health.test.ts
│   └──logs.test.ts
├──docker-compose.yml
├──dockerfile
├──drizzle.config.ts
├──package-lock.json
├──package.json
├──README.md
├──tsconfig.json
├──.dockerignore
└──.gitignore
```