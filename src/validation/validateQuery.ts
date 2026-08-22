import { info } from "node:console";
import { Level } from "../db/schema/logs";
import { PgNumericBigInt } from "drizzle-orm/pg-core";

const LEVELS = new Set<Level>(["debug","info","warn","error"]);
//--- I avoided letting raw express query values reach the db ---//
export type LogQuery = {
    service? :string;
    level? : string;
    since? : Date;
    until? : Date;
    attributes: Record<string,string>;
    messageQuery? : string;
    limit : number;
    cursor? : string;
}

function singleQueryValue(value:unknown,name : string) : string | undefined
{
    if(value === undefined)
    {
        return undefined;
    }
    if(typeof value !== "string")
    {
        throw new Error(`${name} must be provided once`);
    }
    return value;
}

function parseTimestamp(value: string, name: string): Date 
{
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime()) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    throw new Error(`${name} must be a valid ISO 8601 timestamp`);
  }

  return date;
}

export function parseLogQuery(query : Record<string,unknown>) : LogQuery
{
    const service = singleQueryValue(query.service, "service");
    const levelValue = singleQueryValue(query.level, "level");
    const sinceValue = singleQueryValue(query.since, "since");
    const untilValue = singleQueryValue(query.until, "until");
    const messageQuery = singleQueryValue(query.q, "q");
    const limitValue = singleQueryValue(query.limit, "limit");
    const cursor = singleQueryValue(query.cursor, "cursor");   
    
    let level : Level | undefined;
    if(levelValue !== undefined)
    {
        if(!LEVELS.has(levelValue as Level))
        {
            throw new Error("[!] level must be one of debug, info, warn, error");

        }
        level = levelValue as Level;
    }
    let limit = 100;
    if(limitValue !== undefined){
        if(!/^\d+$/.test(limitValue)){
        throw new Error("limit must be a number between 1 and 1000");
        }
        limit = Number(limitValue); 
        if(limit < 1 || limit >1000)
        {
            throw new Error("[!] Limit must be in [1,1000]");
        }
    }
    const since = sinceValue === undefined
    ? undefined
    : parseTimestamp(sinceValue,"since");
    const until = untilValue === undefined
    ? undefined
    : parseTimestamp(untilValue, "until");

    if(since !== undefined && until !== undefined && until <= since)
    {
        throw new Error("until must be later than since");
    }

    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
        if (!key.startsWith("attr.")) {
        continue;
        }    

    
    const attributeName = key.slice("attr.".length);
    if (attributeName.length === 0 || typeof value !== "string") {
      throw new Error(`${key} must have one string value`);
    }
    attributes[attributeName] = value;  
}

return {
    service,
    level,
    since,
    until,
    attributes,
    messageQuery,
    limit,
    cursor
};
}



