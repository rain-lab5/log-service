import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

export const config = {
  databaseUrl,
  port: Number(process.env.PORT ?? 8080),
  // Logs older than this are eligible for deletion. Defaults to 30 days.
  retentionDays: Number(process.env.RETENTION_DAYS ?? 30),
  // How often the retention sweep runs.
  retentionSweepIntervalMs: Number(
    process.env.RETENTION_SWEEP_INTERVAL_MS ?? 60_000,
  ),
  // Rows deleted per DELETE statement. Kept small on purpose so each
  // statement is fast and holds row locks only briefly, instead of one
  // long DELETE that blocks concurrent inserts/vacuum and bloats the
  // table before autovacuum can catch up.
  retentionBatchSize: Number(process.env.RETENTION_BATCH_SIZE ?? 5_000),
};