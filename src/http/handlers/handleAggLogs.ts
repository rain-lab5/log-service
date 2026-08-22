import type { Request, Response } from "express";
import { aggregateLogs } from "../../db/queries/aggLogsQuery.js";
import { parseAggregateQuery } from "../../validation/validateAggQuery.js";

export async function handleAggregateLogs(req: Request, res: Response) {
  try {
    const params = parseAggregateQuery(
      req.query as Record<string, unknown>,
    );
    const buckets = await aggregateLogs(params);

    return res.status(200).json({ buckets });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
}