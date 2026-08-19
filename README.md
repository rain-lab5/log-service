#Log Ingestion and Query Service
```
log-service/
├── src/
│   ├── app/
│   │   └── ...
│   │
│   ├── config/
│   │   └── ...
│   │
│   ├── db/
│   │   ├── schema/
│   │   ├── migrations/
│   │   ├── client.ts
│   │   └── ...
│   │
│   ├── http/
│   │   ├── routes/
│   │   ├── handlers/
│   │   └── ...
│   │
│   ├── validation/
│   │   └── ...
│   │
│   ├── logs/
│   │   ├── types.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   ├── queries.ts
│   │   └── ...
│   │
│   └── server.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── contract/
│
├── loadtest/
│   ├── ...
│   └── README.md
│
├── docker/
│   └── ...
│
├── drizzle.config.ts
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```