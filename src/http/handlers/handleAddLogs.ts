import type { Request, Response } from "express";
import { validateLogs } from "../../validation/validateLogs";
import { insertLogs } from "../../db/queries/logsQueries";

function isLogsRequest(value: unknown): value is { logs: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as { logs?: unknown }).logs)
  );
}

export async function handleAddLogs(req : Request, res : Response)
{
    const body = req.body;

    if(!isLogsRequest(body))
    {
        return res.status(400).json({
        error: "request body must contain a logs array",
        })
    }

    // CONTRACT FIX: validate the entries inside the documented logs envelope.
    const result = validateLogs(body.logs);
    const status = result.valid.length > 0 ? 200 : 400;
    //--- Any error thrown from the insert function will get caught in server.ts by the errorHandler ---//
    // DATABASE FIX: do not issue an empty insert when every entry is rejected.
    if (result.valid.length > 0) {
       await insertLogs(result.valid);
    }


    return res.status(status).json({
        accepted : result.valid.length,
        rejected : result.rejected,
    })
}
