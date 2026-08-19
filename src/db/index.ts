import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "./schema/logs.js"

import { config } from "../config.js";

const client = postgres(config.databaseUrl);
export const db = drizzle(client, {schema});
