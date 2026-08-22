// src/http/handlers/handleGetLogs.ts
import type { Request, Response } from "express";
import { findLogs } from "../../db/queries/logsQueries";
import { parseLogQuery } from "../../validation/validateQuery";

export async function handleGetLogs(req: Request, res: Response) {
  try {
    const result = parseLogQuery(req.query as Record<string, unknown>);
    const response = await findLogs(result);

    return res.status(200).json(response);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(400).json({ error: "invalid query parameters" });
  }
}
