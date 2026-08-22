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
    index("logs_attributes_gin_idx")
      .using("gin", table.attributes),

    // Temporarily disabled for ingestion benchmarking.
     index("logs_service_timestamp_id_idx").on(
     table.service,
     table.timestamp.desc(),
     table.id.desc(),
     ),
  ],
);

export type Level = "debug" | "info" | "warn" | "error";
export type NewLog = typeof logs.$inferInsert;
export type Log = typeof logs.$inferSelect;