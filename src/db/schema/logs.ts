import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const logs = pgTable(
  "logs",
  {
    id: bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    timestamp: timestamp("timestamp", {
      withTimezone: true,
      mode: "date",
    }).notNull(),

    level: text("level").notNull(),

    service: text("service").notNull(),

    message: text("message").notNull(),

    attributes: jsonb("attributes")
      .$type<Record<string, string | number | boolean>>()
      .notNull()
      .default({}),
  },
  (table) => [
    // Covers queries filtered by service (+ time range, cursor pagination).
    index("logs_service_timestamp_id_idx").on(
      table.service,
      table.timestamp.desc(),
      table.id.desc(),
    ),

    // Covers queries with NO service filter (attr-only, q-only, or bare
    // time-range queries) so they still get an index scan + ordered
    // cursor pagination instead of falling back to a full seq scan + sort.
    index("logs_timestamp_id_idx").on(
      table.timestamp.desc(),
      table.id.desc(),
    ),

    // NOTE: no GIN index on `attributes`. Attribute equality is compared
    // as strings via `->>`, which GIN (jsonb_ops/jsonb_path_ops) cannot
    // accelerate — it only helps `@>`/`?`. A GIN index here would cost
    // write throughput on every insert for zero query benefit, so
    // attr.<key> filters are applied as a post-filter on top of the
    // service/timestamp index range instead. See README "Attribute
    // storage strategy" for the full trade-off.
  ],
);

export type Level = "debug" | "info" | "warn" | "error";
export type NewLog = typeof logs.$inferInsert;
export type Log = typeof logs.$inferSelect;