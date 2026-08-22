import type { Level } from "../db/schema/logs.js";

const LEVELS = new Set<Level>(["debug", "info", "warn", "error"]);
const BUCKETS = new Set(["1m", "5m", "1h", "1d"] as const);
const GROUPS = new Set(["service", "level"] as const);

export type AggregateBucket = "1m" | "5m" | "1h" | "1d";
export type AggregateGroup = "service" | "level";

export type AggregateQuery = {
  since: Date;
  until: Date;
  bucket: AggregateBucket;
  groupBy?: AggregateGroup;
  service?: string;
  level?: Level;
  messageQuery?: string;
  attributes: Record<string, string>;
};

function singleQueryValue(value: unknown, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${name} must be provided once`);
  }

  return value;
}

function parseTimestamp(value: string, name: string): Date {
  const isoTimestamp =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || !isoTimestamp.test(value)) {
    throw new Error(`${name} must be a valid ISO 8601 timestamp`);
  }

  return date;
}

export function parseAggregateQuery(
  query: Record<string, unknown>,
): AggregateQuery {
  const sinceValue = singleQueryValue(query.since, "since");
  const untilValue = singleQueryValue(query.until, "until");
  const bucketValue = singleQueryValue(query.bucket, "bucket");
  const groupValue = singleQueryValue(query.group_by, "group_by");
  const service = singleQueryValue(query.service, "service");
  const levelValue = singleQueryValue(query.level, "level");
  const messageQuery = singleQueryValue(query.q, "q");

  if (sinceValue === undefined) {
    throw new Error("since is required");
  }
  if (untilValue === undefined) {
    throw new Error("until is required");
  }
  if (bucketValue === undefined) {
    throw new Error("bucket is required");
  }
  if (!BUCKETS.has(bucketValue as AggregateBucket)) {
    throw new Error("bucket must be one of 1m, 5m, 1h, 1d");
  }

  const since = parseTimestamp(sinceValue, "since");
  const until = parseTimestamp(untilValue, "until");

  if (until <= since) {
    throw new Error("until must be later than since");
  }

  let level: Level | undefined;
  if (levelValue !== undefined) {
    if (!LEVELS.has(levelValue as Level)) {
      throw new Error("level must be one of debug, info, warn, error");
    }
    level = levelValue as Level;
  }

  let groupBy: AggregateGroup | undefined;
  if (groupValue !== undefined) {
    if (!GROUPS.has(groupValue as AggregateGroup)) {
      throw new Error("group_by must be service or level");
    }
    groupBy = groupValue as AggregateGroup;
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
    since,
    until,
    bucket: bucketValue as AggregateBucket,
    groupBy,
    service,
    level,
    messageQuery,
    attributes,
  };
}
