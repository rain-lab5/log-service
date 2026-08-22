import { and, eq, gte, ilike, lt, sql } from "drizzle-orm";
import { db } from "../index.js";
import { logs } from "../schema/logs.js";
import type { AggregateBucket,AggregateQuery } from "../../validation/validateAggQuery.js";
const BUCKET_INTERVALS: Record<AggregateBucket, string> = {
  "1m": "1 minute",
  "5m": "5 minutes",
  "1h": "1 hour",
  "1d": "1 day",
};

// Fix: raw date_bin parameters must be serialized before postgres-js binds them.
const ORIGIN = "2000-01-01T00:00:00.000Z";

export async function aggregateLogs(params: AggregateQuery) {
  const conditions = [
    gte(logs.timestamp, params.since),
    lt(logs.timestamp, params.until),
  ];

  if (params.service !== undefined) {
    conditions.push(eq(logs.service, params.service));
  }

  if (params.level !== undefined) {
    conditions.push(eq(logs.level, params.level));
  }

  if (params.messageQuery !== undefined) {
    conditions.push(ilike(logs.message, `%${params.messageQuery}%`));
  }

  for (const [key, value] of Object.entries(params.attributes)) {
    conditions.push(sql`${logs.attributes} ->> ${key} = ${value}`);
  }

  const bucketStart = sql`date_bin(
    ${sql.raw(`INTERVAL '${BUCKET_INTERVALS[params.bucket]}'`)},
    ${logs.timestamp},
    ${ORIGIN}::timestamptz
  )`;

  // Fix: NULL is returned for an ungrouped result, but it is not a grouping
  // key. Grouping by NULL causes PostgreSQL to reject the query.
  const rows = params.groupBy === undefined
    ? await db
      .select({
        start: bucketStart,
        group: sql`NULL`,
        count: sql<number>`count(*)::int`,
      })
      .from(logs)
      .where(and(...conditions))
      .groupBy(sql.raw("1"))
      .orderBy(sql.raw("1"))
    : await db
      .select({
        start: bucketStart,
        group: params.groupBy === "service" ? logs.service : logs.level,
        count: sql<number>`count(*)::int`,
      })
      .from(logs)
      .where(and(...conditions))
      // Fix: use the selected bucket position so each date_bin occurrence does
      // not receive a different bound origin parameter.
      .groupBy(
        sql.raw("1"),
        params.groupBy === "service" ? logs.service : logs.level,
      )
      .orderBy(
        sql.raw("1"),
        params.groupBy === "service" ? logs.service : logs.level,
      );

  return rows.map((row) => ({
    start: new Date(row.start as Date).toISOString(),
    group: row.group === null ? null : String(row.group),
    count: Number(row.count),
  }));
}
