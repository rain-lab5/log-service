import { db } from "..";
import { Log, logs,NewLog } from "../schema/logs";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  lt,
  or,
  param,
  sql,
} from "drizzle-orm";
import type { LogQuery } from "../../validation/validateQuery";
import { decodeCursor,encodeCursor } from "../../logs/cursor";
import { log } from "node:console";



export async function insertLogs(logsArray : NewLog[])
{
    await db.insert(logs).values(logsArray);
}

