import type { NewLog, Level } from "../db/schema/logs.js";

type Rejection = {
  index: number;
  reason: string;
};

type ValidationResult = {
  valid: NewLog[];
  rejected: Rejection[];
};

const VALID_LEVELS: readonly Level[] = [
  "debug",
  "info",
  "warn",
  "error",
];

function isLevel(value : unknown) : value is Level
{
  return (
    typeof value === "string" && VALID_LEVELS.includes(value as Level)
  );
}

function isFlatAttributes(value: unknown) : value is Record<string, string | number | boolean>
{
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  for(const attributeValue of Object.values(value))
  {
    if(
      typeof attributeValue !== "string" &&
      typeof attributeValue !== "number" &&
      typeof attributeValue !== "boolean"
    ){
      return false;
    }

  }
  return true;
}

// CONTRACT FIX: accept only full ISO 8601 timestamps with an explicit timezone.
function parseTimestamp(value: unknown) : Date | null
{
  if(
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  )
  {
    return null;
  }
  const date = new Date(value);
  if(Number.isNaN(date.getTime()))
  {
    return null;
  }

  const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;

  if(date.getTime() > fiveMinutesFromNow)
  {
    return null;
  }
  return date;

}

export function validateLogs(logs : unknown[]) : ValidationResult
{
  const valid : NewLog[] = [];
  const rejected : Rejection[] = [];

  for(const [index,log] of logs.entries())
  {
    if(typeof log !=="object" || log === null || Array.isArray(log))
    {
      rejected.push({index,reason:"log entry must be an object"});
      continue;
    } 
  
  const entry = log as Record<string,unknown>;
  const timestamp = parseTimestamp(entry.timestamp);
  if(timestamp === null)
  {
    rejected.push({index,reason:"invalid timestamp"});
    continue;
  }

  if(!isLevel(entry.level))
  {
    rejected.push({
      index,
      reason:`invalid level: ${String(entry.level)}`
    });
    continue;
  }
    if (
      typeof entry.service !== "string" ||
      entry.service.trim().length === 0
    ) {
      rejected.push({
        index,
        reason: "service must be a non-empty string",
      });
      continue;
    }

    if (
      typeof entry.message !== "string" ||
      entry.message.trim().length === 0
    ) {
      rejected.push({
        index,
        reason: "message must be a non-empty string",
      });
      continue;
    }
    if (
      entry.attributes !== undefined &&
      !isFlatAttributes(entry.attributes)
    ) {
      rejected.push({
        index,
        reason: "attributes must be a flat object",
      });
      continue;
    }

    valid.push({
      timestamp,
      level : entry.level,
      service : entry.service,
      message : entry.message,
      attributes :
      entry.attributes === undefined
      ? {}
      : entry.attributes,
    });
  }
  return {
    valid,
    rejected,
  }

}