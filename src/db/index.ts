import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema/logs.js"
import { sql } from "drizzle-orm";



import { config } from "../config.js";

const client = postgres(config.databaseUrl, {
  // With inserts batched, you don't want many client connections
  // competing for one physical core — a handful is enough to keep the
  // batch-insert writer and concurrent GET /logs / /logs/aggregate
  // queries from blocking each other. Re-check this against your own
  // load test; don't assume this number without measuring.
  max: 8,
  idle_timeout: 20,
  connect_timeout: 5,
});
export const db = drizzle(client, {schema});

//--- For checking that we actually have a connection with DB, i chose to Query it and return [1] as a mathimatical value ---//
//--- Since the client object does not actually mean that the db is reachable ---//

export async function checkDatabaseConnection() : Promise<void>
{
    await db.execute(sql`SELECT 1`);
    //--- if postgres unavailable -> Throws ---//
}