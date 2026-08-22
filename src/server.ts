import express, { type Request, type Response } from "express";
import { healthHandler } from "./http/handlers/healthHandler.js";
import { handleAddLogs } from "./http/handlers/handleAddLogs.js";
import { initializeApplication } from "./startup.js";
import { errorHandler } from "./http/middleware/errorHandler.js";
import { handleGetLogs } from "./http/handlers/handleGetLogs.js";
import { handleAggregateLogs } from "./http/handlers/handleAggLogs.js";
const app = express();
const PORT = 8080;
// CONTRACT FIX: parse JSON request bodies before the endpoint handler runs.
//--- While testing my load generator, for large number of logs, an error says : Unhandled application error: PayloadTooLargeError: request entity too large
//--- So i am initially setting the limit of the size of the json to -> 1mb ---//
app.use(express.json({limit : "1mb"}));

//------ ROUTES ------//
app.get("/health",healthHandler);
app.post("/logs",handleAddLogs);
app.get("/logs",handleGetLogs);
app.get("/logs/aggregate",handleAggregateLogs)
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



