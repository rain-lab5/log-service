import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema/logs.js"
import { sql } from "drizzle-orm";



import { config } from "../config.js";

const client = postgres(config.databaseUrl, {
  max: 30,                    // tune against DB CPU/core count, not guessed
  idle_timeout: 20,
  connect_timeout: 5,
  max_lifetime: 60 * 30,
});
export const db = drizzle(client, {schema});

//--- For checking that we actually have a connection with DB, i chose to Query it and return [1] as a mathimatical value ---//
//--- Since the client object does not actually mean that the db is reachable ---//

export async function checkDatabaseConnection() : Promise<void>
{
    await db.execute(sql`SELECT 1`);
    //--- if postgres unavailable -> Throws ---//
}
