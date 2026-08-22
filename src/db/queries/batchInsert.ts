import { db } from "..";
import { logs, type NewLog } from "../schema/logs";

type PendingRow = {
  row: NewLog;
  resolve: () => void;
  reject: (err: unknown) => void;
};

const MAX_BATCH_SIZE = 2000;   // tune empirically against your 1 CPU/1GB cap
const MAX_WAIT_MS = 10;        // caps added latency per request; tune down if p99 matters more than throughput

let pending: PendingRow[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, MAX_WAIT_MS);
}

async function flush() {
  flushTimer = null;
  if (pending.length === 0) return;

  const batch = pending;
  pending = [];

  try {
    await db.insert(logs).values(batch.map((p) => p.row));
    for (const p of batch) p.resolve();
  } catch (err) {
    // CRITICAL: every waiter must be rejected on failure, or requests hang forever.
    for (const p of batch) p.reject(err);
  }
}

export function enqueueInsert(row: NewLog): Promise<void> {
  return new Promise((resolve, reject) => {
    pending.push({ row, resolve, reject });
    if (pending.length >= MAX_BATCH_SIZE) {
      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = null;
      void flush();
    } else {
      scheduleFlush();
    }
  });
}

// batched variant for a single request containing multiple log lines —
// still goes through the same shared buffer/flush cycle
export function enqueueInsertMany(rows: NewLog[]): Promise<void> {
  return Promise.all(rows.map(enqueueInsert)).then(() => undefined);
}