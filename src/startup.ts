import { checkDatabaseConnection } from "./db";
import { runMigration } from "./db/migrate";
import { setReady } from "./app-state";
import { startRetentionSweeper } from "./db/retention";

export async function initializeApplication() : Promise<void>
{
    await checkDatabaseConnection();
    await runMigration();
    setReady();
    startRetentionSweeper();
}