import express, { type Request, type Response } from "express";
import { healthHandler } from "./http/handlers/healthHandler.js";
import { initializeApplication } from "./startup.js";

const app = express();
const PORT = 8080;
app.get("/health",healthHandler);


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



