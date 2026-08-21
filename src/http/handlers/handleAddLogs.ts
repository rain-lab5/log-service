import type { Request, Response } from "express";
import { validateLogs } from "../../validation/validateLogs";

function isLogsRequest(value: unknown): value is { logs: unknown[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as { logs?: unknown }).logs)
  );
}

export function handleAddLogs(req : Request, res : Response)
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

    return res.status(status).json({
        accepted : result.valid.length,
        rejected : result.rejected,
    })
}
