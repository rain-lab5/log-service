import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema/logs.js"
import { sql } from "drizzle-orm";



import { config } from "../config.js";

const client = postgres(config.databaseUrl);
export const db = drizzle(client, {schema});

//--- For checking that we actually have a connection with DB, i chose to Query it and return [1] as a mathimatical value ---//
//--- Since the client object does not actually mean that the db is reachable ---//

export async function checkDatabaseConnection() : Promise<void>
{
    await db.execute(sql`SELECT 1`);
    //--- if postgres unavailable -> Throws ---//
}
