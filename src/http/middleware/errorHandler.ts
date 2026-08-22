import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // CONTRACT FIX: malformed JSON must be reported as a client error.
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      error: "malformed JSON",
    });
  }

  console.error("Unhandled application error:", err);

  return res.status(500).json({
    error: "internal server error",
  });
}