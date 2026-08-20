import express, { type Request, type Response } from "express";
import { healthHandler } from "./http/handlers/healthHandler.js";

const app = express();
const PORT = 8080;

app.get("/health",healthHandler);

app.listen(PORT, () => {
console.log("[+] Log service starting on http://localhost:8080/health");
})


