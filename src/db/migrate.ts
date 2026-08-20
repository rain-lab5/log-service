import { migrate } from "drizzle-orm/postgres-js/migrator";
import {db} from "./index.js";

export async function runMigration() : Promise<void>
{
    await migrate(db, {
        migrationsFolder : "./src/db/migrations",
    });
}