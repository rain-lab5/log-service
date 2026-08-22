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

export async function findLogs(params : LogQuery)
{
    const conditions = [];
    
    if(params.service !==undefined)
    {
        conditions.push(eq(logs.service,params.service));
    }

    if(params.level !== undefined)
    {
        conditions.push(eq(logs.level,params.level))
    }

    if(params.since!==undefined)
    {
        conditions.push(gte(logs.timestamp,params.since))
    }

    if(params.until !==undefined)
    {
    conditions.push(lt(logs.timestamp,params.until));
    }

    if(params.messageQuery!==undefined)
    {
        conditions.push(ilike(logs.message,`%${params.messageQuery}%`));
    }

    for(const [key,value] of Object.entries(params.attributes))
    {
        conditions.push(
            sql`${logs.attributes} ->> ${key} = ${value}`,
        );
    }

    if (params.cursor !== undefined) {
        const cursor = decodeCursor(params.cursor);
        const cursorTimestamp = new Date(cursor.timestamp);
        const cursorId = BigInt(cursor.id);

        conditions.push(
        or(
         lt(logs.timestamp, cursorTimestamp),
            and(
            eq(logs.timestamp, cursorTimestamp),
            lt(logs.id, cursorId),
            ),
        ),
        );
     }
     
    const rows = await db
        .select()
        .from(logs)
        .where(conditions.length === 0? undefined: and(...conditions))
        .limit(params.limit+1);

    const hasNextPage = rows.length > params.limit;
    const result = hasNextPage ? rows.slice(0,params.limit) : rows;
    const last = result.at(-1);

    return {
        logs: result.map((log) => ({
        ...log,
        id: log.id.toString(),
        timestamp: log.timestamp.toISOString(),
    })),
        next_cursor: hasNextPage && last !== undefined
        ? encodeCursor({
          timestamp: last.timestamp.toISOString(),
          id: last.id.toString(),
        })
      : null,
    };

}



