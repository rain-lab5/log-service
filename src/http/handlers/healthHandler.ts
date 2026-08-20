import type { Request, Response } from "express";
import { isReady } from "../../app-state";

export function healthHandler(req: Request, res: Response) {
  if(!isReady())
    {
    return res.status(503).send("Service unavailable");
    }  
  res.status(200).send("[+] OK");
}