import express, { type Request, type Response } from "express";
import { healthHandler } from "./http/handlers/healthHandler.js";
import { handleAddLogs } from "./http/handlers/handleAddLogs.js";
import { initializeApplication } from "./startup.js";
import { errorHandler } from "./http/middleware/errorHandler.js";


const app = express();
const PORT = 8080;
// CONTRACT FIX: parse JSON request bodies before the endpoint handler runs.
app.use(express.json());

//------ ROUTES ------//
app.get("/health",healthHandler);
app.post("/logs",handleAddLogs);
//------ ROUTES ------//

// ------ ERROR HANDLER ------ //
app.use(errorHandler);
// ------ ERROR HANDLER ------ //

async function startServer() : Promise<void>
{
    await initializeApplication();
    //--- Functions in this function will automatically throw if something wrong happens ---//
    app.listen(PORT, () => {
    console.log("[+] Log service starting on http://localhost:8080/health");
})
}
startServer().catch((error) => {
  console.error("[-] Failed to start application:", error);
  process.exit(1);
});



