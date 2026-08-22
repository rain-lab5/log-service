import { sql } from "drizzle-orm";
import { db } from "./index";
import { config } from "../config";

let sweeping = false;
let timer: NodeJS.Timeout | null = null;

// Deletes ONE batch of expired rows and reports how many were removed.
// Uses a subquery + LIMIT on the timestamp-ordered index so each
// statement is a short, index-backed operation — not a full scan, and
// not a single transaction touching the whole expired range at once.
async function deleteExpiredBatch(): Promise<number> {
  // Convert Date to text because this raw SQL parameter is serialized by postgres-js.
  const cutoff = new Date(
    Date.now() - config.retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = await db.execute(sql`
    WITH expired AS (
      SELECT id
      FROM logs
      WHERE timestamp < ${cutoff}
      ORDER BY timestamp ASC, id ASC
      LIMIT ${config.retentionBatchSize}
    )
    DELETE FROM logs
    WHERE id IN (SELECT id FROM expired)
  `);

  // postgres-js returns rowCount on the result object.
  return (result as unknown as { count?: number }).count ?? 0;
}

async function runSweep(): Promise<void> {
  if (sweeping) return; // never overlap sweeps with each other
  sweeping = true;
  try {
    // Keep deleting batches back-to-back while a batch is full-sized
    // (i.e. there's likely more expired data), but yield to the event
    // loop and to ingestion between batches instead of looping tightly.
    let deletedInBatch = await deleteExpiredBatch();
    while (deletedInBatch === config.retentionBatchSize) {
      await new Promise((r) => setTimeout(r, 50));
      deletedInBatch = await deleteExpiredBatch();
    }
  } catch (err) {
    // A failed sweep must never crash the process or block ingestion —
    // log and retry on the next scheduled tick.
    console.error("[retention] sweep failed:", err);
  } finally {
    sweeping = false;
  }
}

export function startRetentionSweeper(): void {
  if (timer !== null) return;
  timer = setInterval(() => {
    void runSweep();
  }, config.retentionSweepIntervalMs);
  // Don't let this timer keep the process alive on its own during shutdown.
  timer.unref();
}

export function stopRetentionSweeper(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}