import { checkDatabaseConnection } from "./db";
import { runMigration } from "./db/migrate";
import { setReady } from "./app-state";

export async function initializeApplication() : Promise<void>
{
    await checkDatabaseConnection();
    await runMigration();
    setReady();
}